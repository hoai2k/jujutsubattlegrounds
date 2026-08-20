// AWAKENING 天与呪縛 — Maki's entire character, in one module.
//
// She is the only fighter in the game with IN-MATCH PROGRESSION. A meter fills
// from being in the fight and never falls; crossing a threshold moves her to
// the next of four stages, permanently for the round, and every stage makes
// her better at damage, movement, frame data and stamina at once.
//
// WHERE THE PIECES LIVE — deliberately the same layout combat/charge.js uses,
// because that file is the project's established shape for "a second resource
// that changes how a character performs", and a second layout would be a
// second thing to learn.
//   · this file              the meter, the stages, the gain table, the rules
//   · combat/fighter.js      `awaken`, `awakenStage`, the per-tick call, the
//                            reset, and four multiplier sites
//   · characters/maki.js     every NUMBER is declared THERE, not here — this
//                            file only owns the rules and the shape
//   · ui/hud.js              the meter row, its stage ticks and the ULT gate
//   · art/models/maki.js     `setStage(n)` — the glasses, the wear, the eyes
//   · art/anim/maki.js       the four postures, via `_clip`'s A1/A2/A3 suffix
//
// ---------------------------------------------------------------------------
// THE ONE RULE THAT MAKES HER WORK
// ---------------------------------------------------------------------------
// TAKING DAMAGE PAYS MORE THAN DEALING IT. `gainOnTake` is 0.80 per point of
// health lost against `gainOnDeal`'s 0.55 per point dealt.
//
// That inversion is the whole design and it is worth being explicit about what
// it buys:
//
//   1. SHE IS NOT A SNOWBALL. A progression character who scales off winning
//      is a character who is unbeatable once ahead and hopeless once behind.
//      Scaling off PARTICIPATION means the losing Maki climbs fastest, so the
//      mechanic is a comeback rather than a runaway.
//   2. IT IS THE CANON. Heavenly Restriction awakens under pressure, not under
//      success. A Maki who gets stronger by being hit is the correct reading
//      of the character and it happens to be the correct reading of the
//      balance too, which is rare enough to be worth writing down.
//   3. THE OPPONENT HAS A REAL DECISION. Hitting her is how she wins the late
//      round; not hitting her is how she wins the early one. There is no
//      dominant line, which is the definition of an interesting matchup.
//
// ---------------------------------------------------------------------------
// AND IT NEVER GOES DOWN, NEVER RESETS, AND NEVER HEALS
// ---------------------------------------------------------------------------
// All three are stated as config flags (`decay`, `resetOnStage`, `healOnStage`)
// rather than as absences, so a reader can see they are decisions. The meter is
// monotonic within a round and starts at zero every round — see `resetRound`.
// The events that pay, keyed by what happened. Read at the one place each
// event already fires, so there is no new hook anywhere in the hit pipeline.
export const AWAKEN_EVENT = {
  block: 'gainOnBlock',
  knockdown: 'gainOnKnockdown',
  land: 'gainOnLand'
};

export function hasAwakening(f) { return !!f?.cfg?.awakening; }

// Which stage a meter value corresponds to. Thresholds are ascending, and the
// stage is simply how many of them have been passed — so a config with three
// thresholds yields stages 0..3.
export function stageFor(cfg, value) {
  const th = cfg.awakening.thresholds;
  let s = 0;
  for (let i = 0; i < th.length; i++) if (value >= th[i]) s = i + 1;
  return s;
}

export function stageDef(f) {
  const a = f.cfg?.awakening;
  if (!a) return null;
  return a.stages[Math.max(0, Math.min(a.stages.length - 1, f.awakenStage ?? 0))];
}

// ---------------------------------------------------------------------------
// THE FOUR MULTIPLIER READS
// ---------------------------------------------------------------------------
// Each of these is called from exactly one place in fighter.js and returns 1
// for every character who is not Maki, so the roster is bit-identical.
export function awakenDmg(f) { return stageDef(f)?.dmg ?? 1; }
export function awakenSpeed(f) { return stageDef(f)?.speed ?? 1; }
export function awakenStartup(f) { return stageDef(f)?.startup ?? 1; }
export function awakenBlockChip(f) { return stageDef(f)?.block ?? 1; }
// stamina is a MAX and a REGEN multiplier, applied where the pool is read
export function awakenStamina(f) { return stageDef(f)?.stamina ?? 1; }
// dash i-frames are granted FLAT rather than multiplied, because multiplying
// her base of zero would have left the column permanently dead
export function awakenDashIFrames(f) { return stageDef(f)?.dash ?? 0; }

// The ultimate gate. She has no cursed energy, so `fighter.ultReady` is false
// for her forever — this is the replacement, and it is what the D-pad Right
// path and the HUD both test.
export function awakenUltReady(f) {
  const u = f.cfg?.ultimate;
  if (!u || u.kind !== 'awakening') return false;
  if ((f.awakenStage ?? 0) < (u.requireStage ?? 3)) return false;
  if ((f.awakenUses ?? 0) >= (u.uses ?? 1)) return false;
  return (f.awakenUltCD ?? 0) <= 0;
}

// ---------------------------------------------------------------------------
// GAINING
// ---------------------------------------------------------------------------
// `add` is the single entry point. Everything that pays goes through here so
// the stage-up check, the toast, the model call and the emit happen once.
export function gainAwakening(f, amount, why = null) {
  if (!hasAwakening(f) || !f.alive || amount <= 0) return;
  const a = f.cfg.awakening;
  const before = f.awaken;
  f.awaken = Math.min(a.max, f.awaken + amount);
  if (f.awaken === before) return;
  const ns = stageFor(f.cfg, f.awaken);
  if (ns !== f.awakenStage) {
    f.awakenStage = ns;
    // THE STAGE-UP. Everything that has to happen when she crosses a line
    // happens here and nowhere else.
    f.model?.setStage?.(ns);
    // ...and NOT a heal. `healOnStage` is 0 and is read rather than assumed,
    // so if a future pass wants to change that ruling there is one number.
    if (a.healOnStage > 0) f.res.hp = Math.min(f.maxHP, f.res.hp + a.healOnStage);
    // the locomotion clip changes with the posture, so a fighter standing
    // still at the moment of the stage-up needs to be told to re-play it —
    // otherwise she keeps the old idle until she next moves
    if (['idle', 'walk', 'run'].includes(f.state)) f.play(f.state, { fade: 0.35 });
    f.emit('awakenStage', { stage: ns, def: a.stages[ns] });
  }
  if (why) f.emit('awakenGain', { amount, why });
}

// Damage-driven gain. Called from the two ends of the hit pipeline — see the
// call sites in fighter._feedGauges — with the ACTUAL damage applied rather
// than the move's printed number, so chip, blocks and resistances all feed the
// meter honestly.
export function awakenOnDeal(f, dmg) {
  if (!hasAwakening(f)) return;
  gainAwakening(f, dmg * f.cfg.awakening.gainOnDeal, 'deal');
}
export function awakenOnTake(f, dmg) {
  if (!hasAwakening(f)) return;
  gainAwakening(f, dmg * f.cfg.awakening.gainOnTake, 'take');
}
export function awakenOnEvent(f, key) {
  if (!hasAwakening(f)) return;
  const field = AWAKEN_EVENT[key];
  if (!field) return;
  gainAwakening(f, f.cfg.awakening[field] ?? 0, key);
}

// ---------------------------------------------------------------------------
// PER-TICK
// ---------------------------------------------------------------------------
// There is deliberately almost nothing here. The meter has no decay and no
// passive growth — it moves only when something happens to her or because of
// her — so the tick exists purely to run the ultimate's cooldown and to keep
// the model in sync if something else reset the stage.
export function tickAwakening(f, dt) {
  if (!hasAwakening(f)) return;
  if (f.awakenUltCD > 0) f.awakenUltCD = Math.max(0, f.awakenUltCD - dt);
}

export function resetAwakening(f) {
  if (!hasAwakening(f)) return;
  // ROUND-SCOPED, like every other resource in this project. She starts every
  // round restrained.
  f.awaken = 0;
  f.awakenStage = 0;
  f.awakenUses = 0;
  f.awakenUltCD = 0;
  f.model?.setStage?.(0);
}

// ---------------------------------------------------------------------------
// THE AI'S READ
// ---------------------------------------------------------------------------
// "Maki plays for awakening and gets more aggressive as she scales." Rather
// than scattering stage checks through the profile, the bot asks one question
// and gets a 0..1 number: how confident should I be right now.
//
// Note that it is NOT simply the stage. Below stage 2 it also weighs how close
// the next threshold is, because a Maki two points from stage 1 should already
// be looking for the exchange that gets her there.
export function awakenAggression(f) {
  if (!hasAwakening(f)) return 0.5;
  const a = f.cfg.awakening;
  const s = f.awakenStage ?? 0;
  if (s >= a.stages.length - 1) return 1;
  const lo = s === 0 ? 0 : a.thresholds[s - 1];
  const hi = a.thresholds[s];
  const within = hi > lo ? (f.awaken - lo) / (hi - lo) : 0;
  return (s + Math.max(0, Math.min(1, within))) / (a.stages.length - 1);
}
