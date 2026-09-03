// STAR RAGE 星の怒り — Yuki's virtual mass, in one module.
//
// She adds mass that is not there to things that are. The technique empowers
// her strikes with force equal to real mass, and it applies to HER as readily
// as to what she hits — which is where the whole character comes from, because
// mass makes a strike enormous and a body slow at the same time.
//
// WHERE THE PIECES LIVE — the same layout combat/charge.js and
// combat/awakening.js use.
//   · this file             the meter, the build/spend rules, the armour
//   · combat/fighter.js     `mass`, `massCharging`, the per-tick call, the
//                           reset, and the multiplier sites
//   · characters/yuki.js    every NUMBER is declared THERE
//   · combat/effects.js     the techniques read `massSpend()` and scale
//   · combat/garuda.js      the partner spends from the SAME pool
//   · ui/hud.js             the meter row and the armour tick
//   · art/models/yuki.js    `setMass(f)` — the shimmer, the dust, the core
//
// ---------------------------------------------------------------------------
// THE DECISION, WHICH IS THE WHOLE CHARACTER
// ---------------------------------------------------------------------------
// Mass is simultaneously her damage resource and her mobility debt:
//
//   HOLD it   → armour through hits and no knockback, and she is SLOW
//   SPEND it  → an enormous single hit, and the armour goes with it
//   DUMP it   → mobility back immediately, damage gone
//
// The two numbers that make that a real decision rather than a ramp are
// `armorAt` (45) and `spendCap` (55): the armour threshold sits BELOW the
// spend cap, so every full-power technique she throws drops her out of armour
// on use. She cannot be the immovable object and the irresistible force in the
// same second. Everything else here is bookkeeping around that one tension.
//
// ---------------------------------------------------------------------------
// WHY IT DOES NOT DECAY
// ---------------------------------------------------------------------------
// Deliberately unlike Kashimo's charge, which bleeds while he stands still.
// His resource asks "are you moving?" and punishes hesitation; hers asks "are
// you heavy or fast?" and has to let her SIT on an answer. A decaying mass
// meter would make the choice for her every few seconds, which would delete
// the decision the character is built on.

// The events that build, keyed by what connected. Read at the one place each
// already fires, so there is no new hook in the hit pipeline.
export const MASS_GAIN = {
  punch: 'buildOnPunch',
  heavy: 'buildOnHeavy',
  tech: 'buildOnTech',
  garuda: 'buildOnGaruda'
};

export function hasMass(f) { return !!f?.cfg?.mass; }
export function massFrac(f) { return hasMass(f) ? (f.mass ?? 0) / f.cfg.mass.max : 0; }

// ---------------------------------------------------------------------------
// CARRYING IT — the three things being heavy does to her
// ---------------------------------------------------------------------------
// ARMOUR. Above the threshold she has armour through hits and cannot be
// knocked back. Implemented by reporting into fighter's existing armour path
// rather than by a new branch in applyHit: `resolveArmor` is the flag Yuji's
// RESOLVE already sets and it already means "do not flinch", which is exactly
// what this is. Reusing it means Inumaki's posture commands, Naoya's freeze
// and every other consumer of "is this body currently refusing to react" all
// get the right answer for her for free — see the delivery notes, where that
// interaction is called out as one that had to be decided.
export function massArmor(f) {
  return hasMass(f) && (f.mass ?? 0) >= f.cfg.mass.armorAt;
}

// THE SPEED PENALTY. Linear in the meter, so it is felt long before the armour
// arrives — there is no free weight.
export function massSpeed(f) {
  if (!hasMass(f)) return 1;
  return 1 - massFrac(f) * f.cfg.mass.speedPenalty;
}
export function massDash(f) {
  if (!hasMass(f)) return 1;
  return 1 - massFrac(f) * f.cfg.mass.dashPenalty;
}

// KNOCKBACK RESISTANCE, continuous rather than a snap at the threshold: at 0
// mass she takes full knockback, at `kbResistAt` she takes none. A cliff here
// would read as a bug the first time a hit at 44 mass sent her flying and the
// same hit at 46 did not.
export function massKbResist(f) {
  if (!hasMass(f)) return 1;
  const k = Math.min(1, (f.mass ?? 0) / f.cfg.mass.kbResistAt);
  return 1 - k;
}

// ---------------------------------------------------------------------------
// BUILDING
// ---------------------------------------------------------------------------
export function gainMass(f, amount) {
  if (!hasMass(f) || !f.alive || amount <= 0) return;
  const before = f.mass;
  f.mass = Math.min(f.cfg.mass.max, f.mass + amount);
  if (f.mass !== before) f.emit('massGain', { mass: f.mass });
}
export function massOnEvent(f, key) {
  if (!hasMass(f)) return;
  const field = MASS_GAIN[key];
  if (field) gainMass(f, f.cfg.mass[field] ?? 0);
}

// THE CHARGE. Held on an attack input; `massCharging` is set by the state
// machine and this is what actually fills the bar while it is.
export function tickMassCharge(f, dt) {
  if (!hasMass(f) || !f.massCharging) return;
  gainMass(f, f.cfg.mass.buildOnCharge * dt);
}

// ---------------------------------------------------------------------------
// SPENDING
// ---------------------------------------------------------------------------
// `spendMass` takes up to `spendCap` and returns the SCALARS the caller should
// apply. Returning a bundle rather than a single number is deliberate: damage,
// knockback, guard damage, shake and destruction all scale differently, and a
// caller that only got a damage number would silently forget the other four.
//
// `k` is 0..1 — how much of the cap was actually available — and every scale
// interpolates from 1 (nothing spent) to the config's full value.
export function spendMass(f, { fraction = 1 } = {}) {
  const one = { k: 0, dmg: 1, kb: 1, guard: 1, shake: 1, destruct: 1, spent: 0 };
  if (!hasMass(f)) return one;
  const m = f.cfg.mass;
  const want = m.spendCap * Math.max(0, Math.min(1, fraction));
  const spent = Math.min(f.mass, want);
  if (spent <= 0.01) return one;
  f.mass -= spent;
  const k = spent / m.spendCap;
  f.emit('massSpend', { spent, k });
  return {
    k, spent,
    dmg: 1 + (m.dmgScale - 1) * k,
    kb: 1 + (m.kbScale - 1) * k,
    guard: 1 + (m.guardScale - 1) * k,
    shake: 1 + (m.shakeScale - 1) * k,
    destruct: 1 + (m.destructScale - 1) * k
  };
}

// THE DUMP. Everything goes at once and she gets a short burst of mobility as
// the weight comes off. This is the escape option a character with the worst
// dash in the game otherwise would not have, and it costs her everything she
// has been saving — which is exactly the right price for an escape.
export function dumpMass(f) {
  if (!hasMass(f) || f.mass <= 0.01) return false;
  const m = f.cfg.mass;
  f.mass = 0;
  f.massDumpT = m.dumpSpeedFrames;
  f.emit('massDump');
  return true;
}
// the post-dump mobility burst, read alongside massSpeed
export function massDumpSpeed(f) {
  if (!hasMass(f) || !(f.massDumpT > 0)) return 1;
  return f.cfg.mass.dumpSpeedBonus;
}

// ---------------------------------------------------------------------------
// PER-TICK
// ---------------------------------------------------------------------------
export function tickMass(f, dt) {
  if (!hasMass(f)) return;
  tickMassCharge(f, dt);
  if (f.massDumpT > 0) f.massDumpT = Math.max(0, f.massDumpT - dt * 60);
  // NO DECAY — see the header. The line is here, doing nothing, on purpose:
  // `decay` is 0 in the config and is read rather than assumed, so a future
  // pass that wants to change the ruling has one number to change and one
  // place to change it.
  if (f.cfg.mass.decay > 0) f.mass = Math.max(0, f.mass - f.cfg.mass.decay * dt);
  // the model's shimmer, dust and dark core
  f.model?.setMass?.(massFrac(f));
}

export function resetMass(f) {
  if (!hasMass(f)) return;
  // ROUND-SCOPED, like every other resource here.
  f.mass = 0;
  f.massCharging = false;
  f.massDumpT = 0;
  f.model?.setMass?.(0);
}

// ---------------------------------------------------------------------------
// THE AI'S READ
// ---------------------------------------------------------------------------
// "Yuki builds mass, walks through hits, and hunts the command grab." The bot
// asks one question: am I heavy enough to go in? Above the armour threshold
// the answer is yes and the profile switches from charging to walking forward,
// which is the behaviour the character is for.
export function massReady(f) {
  return hasMass(f) && (f.mass ?? 0) >= f.cfg.mass.armorAt;
}
