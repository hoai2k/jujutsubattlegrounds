// CURSED SPEECH 呪言 — Inumaki's entire character, in one module.
//
// He says a word and another fighter's body obeys it. That is a bigger claim
// than anything else in this project makes, so the rules below are written to
// be boring and total: every command resolves through ONE function, every
// forced state runs on ONE clock, and every exit is a state change that the
// rest of the game already knows how to cause.
//
// WHERE THE PIECES LIVE
//   · this file              the gauge, the tiers, resistance, the resolver,
//                            and the forced-state driver
//   · characters/inumaki.js  every number — the command table AND the throat
//                            curve. Nothing here invents a value.
//   · combat/fighter.js      `throat`, `throatTier`, `utter`, `forced`,
//                            `cmdBind`, the `commanded` state, the per-tick
//                            calls and the round reset
//   · combat/effects.js      the `inumaki_command` cast and the seven
//                            `speech_*` payloads
//   · fx/kanji.js            the extruded glyphs, the flight and the impact
//   · ui/hud.js              the throat row, the tier badge, the resistance
//                            readout on the TARGET's plate
//   · ui/commandcard.js      the anime-title-card typographic overlay
//   · audio/sfx.js           `command(weight, tier)` — the voice, degraded
//   · art/models/inumaki.js  `setCollar`, `setMarks`, `setStrain`
//
// ---------------------------------------------------------------------------
// THE FOUR RULES
// ---------------------------------------------------------------------------
// 1. EVERY COMMAND IS INTERRUPTIBLE. A command is a `ct` state whose STARTUP
//    is the utterance window, and the effect fires on the last frame of it.
//    Anything at all that changes his state during that window — a jab, a
//    knockdown, a domain pull, a transfiguration, a KO — cancels the command,
//    because the effect simply never reaches its frame. That is structural
//    rather than a list of checks, exactly the way taunts are cancelled.
//    `checkUtterance` below then charges him the interruption penalty.
//
// 2. COMMANDS ARE NOT SURE-HIT. They are aimed, they are range-limited, and
//    they miss. They deliberately do NOT go through the domain sure-hit path:
//    a sure-hit command would be a domain effect on a character who canonically
//    does not have a domain.
//
// 3. RESISTANCE IS MAX_CE, AND IT IS CANON. The research is explicit that the
//    technique hinges on the gap in cursed energy between speaker and target.
//    So the DURATION of every forced state scales inversely with the target's
//    current MAX_CE. Damage does NOT scale — a word that crushes you crushes
//    you whoever you are; what a strong sorcerer buys is getting their body
//    back sooner.
//
// 4. HE NEVER SPENDS HEALTH. Not on a command, not on the ultimate, not on an
//    interruption. The gauge is the cost. If a future change ever makes cursed
//    speech deal him damage, it is wrong.
import { flatDist } from '../../core/math.js';

// ---------------------------------------------------------------------------
// THE FOUR TIERS
// ---------------------------------------------------------------------------
// `at` is the fraction of the gauge the tier opens at. `dur` and `dmg` are what
// commands are worth in that tier. SILENCED zeroes both, which is not how it
// refuses commands — `canSpeak` does that outright — but it means that if a
// command ever DID leak through it would do nothing, which is the correct
// failure mode.
export const TIERS = [
  {
    key: 0, name: 'CLEAR', jp: '清明', at: 0,
    dur: 1.00, dmg: 1.00, voice: 1.00
  },
  {
    key: 1, name: 'STRAINED', jp: '嗄れ', at: 0.35,
    dur: 0.78, dmg: 0.92, voice: 0.80
  },
  {
    key: 2, name: 'RAW', jp: '血声', at: 0.65,
    dur: 0.55, dmg: 0.72, voice: 0.52
  },
  {
    key: 3, name: 'SILENCED', jp: '失声', at: 0.90,
    dur: 0.00, dmg: 0.00, voice: 0.00
  }
];

export const TIER_AT = TIERS.map(t => t.at);

export function tierOf(frac) {
  let t = 0;
  for (let i = TIER_AT.length - 1; i >= 0; i--) {
    if (frac >= TIER_AT[i] - 1e-6) { t = i; break; }
  }
  return t;
}

export function tierDef(t) { return TIERS[Math.max(0, Math.min(TIERS.length - 1, t))]; }

// ---------------------------------------------------------------------------
// THE GAUGE
// ---------------------------------------------------------------------------
// Present on EVERY fighter (they are two numbers that stay zero) for the same
// reason `charge` and `frozenT` are: the HUD, the debug overlay and the model
// hooks would otherwise each need a null check. `cfg.throat` is what actually
// makes any of it do something.
export function throatFrac(f) {
  const c = f?.cfg?.throat;
  return c ? Math.max(0, Math.min(1, f.throat / c.max)) : 0;
}

export function hasVoice(f) { return !!f?.cfg?.throat; }

// SILENCED, the state. Two independent ways in:
//   · the gauge is at or past the SILENCED threshold, and has not yet fallen
//     back to `clearAt` (the hysteresis — see the config note)
//   · `voiceSpent`, the latch the ultimate sets, which lasts the round
export function isSilenced(f) {
  if (!hasVoice(f)) return false;
  return f.voiceSpent || f.throatTier >= 3;
}

// Can he say ANYTHING right now.
export function canSpeak(f) { return hasVoice(f) && !isSilenced(f); }

// Can he afford THIS command. The wheel greys out anything that fails here,
// and startCT refuses it with its own line rather than a silent no-op.
//
// The rule is "the utterance must not itself silence him": a command whose
// cost would push the gauge past the SILENCED threshold is refused. That is
// what makes BLAST AWAY a decision — at 60% strain it is simply not available,
// and the player has to either spend a cheap word or go and breathe.
export function affordable(f, cmd) {
  if (!canSpeak(f) || !cmd) return false;
  const c = f.cfg.throat;
  return f.throat + cmd.throat <= c.max * TIERS[3].at - 1e-6;
}

// PER-TICK. Called from Fighter.update for every fighter; returns immediately
// for anyone without `cfg.throat`, which is the entire rest of the roster.
// Returns the tier if it CHANGED this tick, else null.
export function tickThroat(f, dt) {
  const c = f.cfg.throat;
  if (!c) return null;
  const before = f.throatTier;

  // The rest timer. Set by `spend` and by `checkUtterance`; while it runs the
  // gauge does not recover at all. This is the whole reason his rhythm exists.
  if (f.throatRest > 0) f.throatRest = Math.max(0, f.throatRest - dt);

  if (!f.alive || f.state === 'ko' || f.state === 'intro') {
    // a body that is not in the fight neither strains nor recovers
  } else if (f.throatRest <= 0 && f.throat > 0) {
    // SILENCED recovers faster, so the crisis has an end the player can see
    // coming. Everything else recovers at the flat rate.
    const rate = f.throatTier >= 3 ? c.silencedRecover : c.recover;
    f.throat = Math.max(0, f.throat - rate * dt);
  }

  f.throat = Math.max(0, Math.min(c.max, f.throat));

  // THE HYSTERESIS. Once he is in tier 3 he stays in tier 3 until the gauge
  // falls to `clearAt`, whatever the raw fraction says. Without it he flickers
  // across the boundary every few frames and SILENCED stops reading as a
  // crisis and starts reading as a flicker.
  let tier = tierOf(f.throat / c.max);
  if (before >= 3 && f.throat > c.clearAt) tier = 3;
  f.throatTier = tier;
  return f.throatTier !== before ? f.throatTier : null;
}

// Add strain and start the rest timer. The single point every cost goes
// through, so there is exactly one place the clock is touched.
export function spend(f, amount) {
  const c = f?.cfg?.throat;
  if (!c || !(amount > 0)) return 0;
  const before = f.throat;
  f.throat = Math.min(c.max, f.throat + amount);
  f.throatRest = c.restDelay;
  let tier = tierOf(f.throat / c.max);
  if (f.throatTier >= 3 && f.throat > c.clearAt) tier = 3;
  f.throatTier = tier;
  return f.throat - before;
}

// THE ULTIMATE'S PRICE. Not a big number added to the gauge — a LATCH, so that
// no amount of recovery gives the voice back inside the round. `resetRound`
// on the fighter clears it, which is the only thing that does.
export function spendVoice(f) {
  const c = f?.cfg?.throat;
  if (!c) return;
  f.throat = c.max;
  f.throatTier = 3;
  f.voiceSpent = true;
  f.throatRest = c.restDelay;
}

// ---------------------------------------------------------------------------
// RESISTANCE
// ---------------------------------------------------------------------------
// 0 = the word lands at full length. 1 = it does nothing at all, which is
// deliberately unreachable: `RESIST_CAP` is 0.62, so even a fully built
// opponent eats 38% of the stated duration. A command that could be reduced to
// zero would make the whole character stop existing in the back half of a
// round, and "your technique turns off after ninety seconds" is not a design.
export const RESIST_FLOOR_CE = 40;   // the roster's typical opening MAX_CE
export const RESIST_CAP = 0.62;

// THE TWO FIGHTERS WITH NO MAX_CE AT ALL — Toji and Mahoraga — declare
// `cfg.speechResist` themselves, a flat 0..1 that stands in for the curve.
// Both are documented at their declaration; the short version:
//
//   TOJI gets a FLAT MID-TABLE 0.45, not zero and not one.
//     Zero is what the canon reading argues for (resistance is cursed energy
//     output; he has none, so nothing pushes back) and it is what the
//     Sportskeeda "Toji's worst matchup may be Inumaki" piece says out loud.
//     It is also unplayable in a fighting game: it would make the single most
//     mobile character in the roster a free two-second root on command, every
//     time, from twelve metres, forever.
//     One is what the fantasy argues for — Heavenly Restriction as immunity —
//     and it is worse: it deletes the matchup in the other direction, and
//     Inumaki's answer to a man he cannot command is a punch string that does
//     2.6 damage.
//     0.45 says the honest thing instead: cursed speech WORKS on Toji, because
//     the cursed energy is in the WORD and not in the listener, and what
//     Heavenly Restriction buys him is a body that shrugs it off faster than
//     most. He also keeps the Inverted Spear, which nullifies a technique
//     outright — so he has a real, expensive, timing-based answer that nobody
//     else in the roster owns. That is the "give Inumaki something" the brief
//     asked for, pointed the other way: Toji is the one who gets the tool.
//
//   MAHORAGA gets 0.40 as a BASE, and then adapts. Each command is its own
//     adaptation category (see combat/adaptation.js), so the wheel that turns
//     over his head is the real answer: adapting to DON'T MOVE does nothing
//     about BLAST AWAY, and Inumaki's counterplay is to rotate words the same
//     way everyone else rotates tools.
export function resistOf(f) {
  if (!f) return 0;
  if (f.cfg?.speechResist != null) return Math.max(0, Math.min(1, f.cfg.speechResist));
  const maxCE = f.res?.maxCE ?? 0;
  const k = (maxCE - RESIST_FLOOR_CE) / (100 - RESIST_FLOOR_CE);
  return Math.max(0, Math.min(1, k)) * RESIST_CAP;
}

// The 0..3 badge the HUD prints on the TARGET's plate, so both players can
// read how much the next word is going to be worth before it is said.
export function resistBand(f) {
  const r = resistOf(f);
  return r < 0.12 ? 0 : r < 0.30 ? 1 : r < 0.48 ? 2 : 3;
}
export const RESIST_BANDS = ['OPEN', 'RESISTING', 'HARDENED', 'DEAF'];

// BLOCKING. Commands are not blockable in the conventional sense — guard does
// not refuse them and there is no blockstun — but a fighter who is actually
// holding guard when the word arrives keeps their footing better. This is a
// duration cut only; the damage still lands in full.
export const BLOCK_DUR_MULT = 0.55;

// ---------------------------------------------------------------------------
// THE ONE FUNCTION EVERY COMMAND'S LENGTH GOES THROUGH
// ---------------------------------------------------------------------------
//   duration = base * tier.dur * (1 - resist) * (blocked ? 0.55 : 1)
//
// and it is never allowed to reach zero: `MIN_DUR` guarantees that a command
// which connected did SOMETHING, so a player who spent the throat and won the
// interaction always sees a result. A quarter of a second of root is not much
// but it is not nothing, and "nothing happened" is the worst thing a move can
// report.
export const MIN_DUR = 0.22;

export function durationFor(caster, target, cmd, opts = {}) {
  const base = opts.base ?? cmd.dur ?? 0;
  if (!(base > 0)) return 0;
  const tier = tierDef(caster.throatTier ?? 0);
  let d = base * tier.dur * (1 - resistOf(target));
  if (opts.blocked) d *= BLOCK_DUR_MULT;
  // MAHORAGA. Each command is its own adaptation category, and for the three
  // commands that deal no damage at all the adaptation has to bite somewhere —
  // so it bites here, on the length. See the long note at the bottom of
  // combat/adaptation.js. A no-op for every other fighter in the game, because
  // nobody else has an `adapt`.
  const adapted = target?.adapt?.reductionFor?.(adaptKey(cmd)) ?? 0;
  if (adapted > 0) d *= (1 - adapted);
  return Math.max(MIN_DUR, d);
}

// The adaptation category for a command. One per word — see adaptation.js.
export function adaptKey(cmd) { return 'cmd_' + cmd.key; }

// Damage is scaled by the TIER only — never by resistance. See rule 3.
export function damageFor(caster, cmd, opts = {}) {
  const base = opts.base ?? cmd.dmg ?? 0;
  return base * tierDef(caster.throatTier ?? 0).dmg;
}

// ---------------------------------------------------------------------------
// BINDINGS
// ---------------------------------------------------------------------------
// `f.cmdBind` is `{ ct1, ct2 }`. Read through these two helpers everywhere so
// a missing or stale binding falls back to the config default rather than
// crashing a button.
export function boundKey(f, slot) {
  const c = f?.cfg?.commands;
  if (!c) return null;
  const k = f.cmdBind?.[slot];
  return (k && c.defs[k]) ? k : c.defaults[slot];
}

export function boundCommand(f, slot) {
  const c = f?.cfg?.commands;
  if (!c) return null;
  return c.defs[boundKey(f, slot)] ?? null;
}

export function bindCommand(f, slot, key) {
  if (!f?.cfg?.commands?.defs[key]) return false;
  f.cmdBind = { ...(f.cmdBind || {}), [slot]: key };
  return true;
}

// The wheel's snapshot, in the shape ui/hud.js `setWheel` already consumes —
// the same widget Megumi, Geto, Toji and Panda use. `affordable: false` is
// what greys a command out, which is exactly what the brief asked the wheel to
// show: everything his throat cannot currently pay for.
export function wheelSnapshot(f) {
  const c = f.cfg.commands;
  return c.order.map(k => {
    const d = c.defs[k];
    return {
      def: {
        short: d.short, jp: d.jp, name: d.name, cost: d.throat,
        desc: d.desc + '  ·  ' + d.range.toFixed(1) + 'm'
      },
      lost: false,
      cd: 0,
      affordable: affordable(f, d),
      bound: boundKey(f, 'ct1') === k ? 'ct1' : boundKey(f, 'ct2') === k ? 'ct2' : null
    };
  });
}

// ---------------------------------------------------------------------------
// THE UTTERANCE, AND ITS INTERRUPTION
// ---------------------------------------------------------------------------
// `f.utter` is non-null for exactly as long as a command's `ct` state is live
// and has not yet fired. Same contract `f.taunt` keeps, for the same reason:
// every interruption in the game is already a state change, so nothing else
// has to have heard of cursed speech.
//
// Called from Fighter.update EVERY frame, for every fighter, in every state.
export function checkUtterance(f) {
  if (!f.utter) return;
  // still in the same cast: nothing to do
  if (f.state === 'ct' && f.move?.commandKey === f.utter.key) return;
  const u = f.utter;
  f.utter = null;
  f.model?.setCollar?.(0);
  f.model?.setMarks?.(false);
  if (u.fired) return;                    // it completed; `spend` already ran
  // INTERRUPTED. The command is gone and the throat pays anyway.
  const cmd = f.cfg.commands?.defs?.[u.key];
  const mult = f.cfg.throat?.interruptMult ?? 0.6;
  if (cmd) spend(f, cmd.throat * mult);
  f.emit('utterBroken', { key: u.key, cmd });
}

// ---------------------------------------------------------------------------
// THE FORCED STATES
// ---------------------------------------------------------------------------
// RUN AWAY and COME HERE are the only two things in this project that move a
// fighter the player did not ask to be moved, so they are built to be as
// narrow as possible:
//
//   · They are a STATE (`commanded`) with a clock, so every existing way of
//     taking a fighter's state ends them, for free.
//   · They are pure MOVEMENT. The victim takes no damage, no hitstun and no
//     knockdown from them, and comes out of them standing and neutral.
//   · They CANNOT put anyone inside geometry, because they write `vel` and let
//     the ordinary collision and arena-bounds pass in Fighter.update resolve
//     it — exactly as walking does. Nothing here writes `pos`.
//   · They are SHORT. A second of Run Away and just over half a second of Come
//     Here, before resistance takes a bite out of both.
//
// `f.forced` is `{ mode, t, speed, from }`. `from` is the CASTER's position at
// the moment the word landed, captured by value: if the caster then dies, gets
// transfigured, or teleports, the victim still runs away from where the voice
// came from rather than chasing a moving anchor or crashing on a null.
export function beginForced(target, mode, seconds, speed, from) {
  target.forced = { mode, t: seconds, speed, from: from.clone() };
  target.setState('commanded', { clip: mode === 'flee' ? 'run' : 'run' });
  target.vel.y = Math.max(0, target.vel.y);
}

// Per-tick driver, called from the `commanded` case of the state machine.
// Returns false when the clock is out and the caller should hand the body back.
export function tickForced(target, dt) {
  const fo = target.forced;
  if (!fo) return false;
  fo.t -= dt;
  if (fo.t <= 0) { target.forced = null; return false; }
  const dx = target.pos.x - fo.from.x;
  const dz = target.pos.z - fo.from.z;
  const len = Math.hypot(dx, dz) || 1;
  // FLEE pushes out along that vector, PULL pushes in along it. Pull also
  // STOPS SHORT: once they are inside `PULL_STOP` metres the drag ends early,
  // so Come Here delivers them to punching range and never through him.
  const sign = fo.mode === 'flee' ? 1 : -1;
  if (fo.mode === 'pull' && len < PULL_STOP) { target.forced = null; return false; }
  target.vel.x = (dx / len) * fo.speed * sign;
  target.vel.z = (dz / len) * fo.speed * sign;
  // They face the way the word is taking them, which is what makes it read as
  // their body doing something rather than the camera sliding.
  target.facing = Math.atan2(target.vel.x, target.vel.z);
  return true;
}

export const PULL_STOP = 1.65;

// ---------------------------------------------------------------------------
// WHAT CURSED SPEECH DOES NOT REACH
// ---------------------------------------------------------------------------
// Three rulings that are worth writing down because they are all "nothing
// happens", and a behaviour nobody documented is indistinguishable from a bug.
//
// SUMMONS ARE NOT COMMANDABLE. Megumi's shikigami, Mahito's transfigured
// human, Geto's curses and Higuruma's Judgeman are all their own systems with
// their own tiny state machines; none of them is a Fighter, and `other()` —
// which every command resolves against — only ever returns a Fighter. So a
// word aimed into a pack of curses passes through them and lands on the
// summoner, which is both the correct fiction (the word is aimed at a person,
// and a construct made of somebody else's cursed energy has no body of its own
// to obey with) and the correct game (a character whose commands could delete
// a summoner's board would be a hard counter to three of the roster at once).
//
// THE ONE APPARENT EXCEPTION IS NOT ONE: MAHORAGA is commandable, in full,
// because when Megumi calls him the ritual REPLACES THE FIGHTER IN THE SEAT.
// He is not a summon on the field; he is the fighter. So he is commanded like
// anybody else, and he adapts to it — see `speechResist` in his config.
//
// A CINEMATIC OUTRANKS A WORD. Higuruma's execution duel, his trial, Megumi's
// summon ritual and the match-win finisher all suspend the logic tick or hold
// their participants in a state that reads no input, so an utterance cannot be
// STARTED during any of them (`trySpecial` and `_stateLogic` both refuse) and a
// word already in flight simply stops advancing with everything else. Nothing
// special had to be written for that and nothing should be.

// ---------------------------------------------------------------------------
// RANGE
// ---------------------------------------------------------------------------
// One predicate, so the cast, the CPU and the debug overlay cannot disagree
// about whether a word would have reached. Flat distance, because a command is
// aimed at a person and not at a point in the air.
export function inCommandRange(caster, target, cmd) {
  if (!caster || !target || !target.alive) return false;
  return flatDist(caster.pos, target.pos) <= cmd.range + (target.hurtBox?.radius ?? 0.62);
}
