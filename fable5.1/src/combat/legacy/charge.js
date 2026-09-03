// CHARGE 帯電 — Kashimo's entire character, in one module.
//
// He converts cursed energy into electricity, and the conversion is driven by
// MOTION. Everything he does scales off one number, and that number only goes
// up while he is moving and only goes down while he is standing still or
// holding guard. He is the one fighter in the game who is punished for doing
// nothing.
//
// WHERE THE PIECES LIVE
//   · this file            the meter, the tiers, the build/decay table
//   · combat/fighter.js    `charge`, `chargeTier`, the per-tick call, the reset
//   · characters/kashimo.js  every number is declared THERE, not here — this
//                          file only owns the rules and the shape
//   · combat/effects.js    the electric techniques read `chargeScale(f, ...)`
//   · ui/hud.js            the meter row and its tier ticks
//   · art/models/kashimo.js  `setCharge(tier, frac)` — the arcs on the body
//
// THE ONE RULE THAT MAKES HIM WORK, AND WHY IT IS STRUCTURAL
// -----------------------------------------------------------------------
// Build and decay are decided by STATE, not by a list of moves. Three buckets:
//
//   BUILD   dash > run > walk. Movement, and nothing else, at rates that make
//           dashing overwhelmingly the best of the three.
//   DECAY   idle, block, blockstun, simpleDomain, and every state where he is
//           planted with no intent to move.
//   HOLD    everything else — attacking, recovering, being hit, in the air,
//           mid-cinematic. Neither built nor bled.
//
// The HOLD bucket is the important one and it is the difference between a
// character and a punishment. If attacking bled him, his own punch string
// would disarm him and the correct way to play him would be to never press
// anything, which is the opposite of the design. If being HIT bled him, a
// zoner would strip him without him ever having a decision to make. So the
// meter answers exactly one question — "are you moving, or are you turtling" —
// and nothing else can touch it.
//
// LANDING HITS also pays, as a flat grant rather than a rate (see `HIT_GAIN`
// keys), because "never stops threatening" has to be worth something on the
// meter and not just on the health bar.

// The states that BLEED him. Everything not in here and not moving simply
// holds, which is the whole ruling above expressed as one Set.
const DECAY_STATES = new Set(['idle', 'block', 'blockstun', 'guardBreak', 'simpleDomain']);

// Flat grants, keyed by what connected. Read by fighter/effects at the one
// place each event already fires, so there is no new hook anywhere.
export const HIT_GAIN = {
  punch: 4,        // any hit of the staff string
  heavy: 6,        // the committed sweep
  tech: 7,         // Lightning Bolt / Discharge Strike connecting
  arcPass: 14      // an Arc Dash that passed through somebody — the big one
};

// Tier boundaries as fractions of the meter. Four tiers, 0..3.
//
// WHY FOUR AND NOT THREE. Three tiers would have made the middle one the whole
// game: you would live in it, and the top would be a rare treat. Four gives a
// genuinely BAD state (tier 0, where he is a man with a stick), a working state
// (1), a good one (2) and a scary one (3) — and because tier 1 starts at only
// 25%, a single dash out of neutral is enough to leave the bad state, which is
// what stops the character from feeling like a punishment on the opening frame
// of every round.
export const TIERS = [
  {
    key: 0, name: 'EARTHED', jp: '接地',
    dmg: 0.76, speed: 1.00, size: 1.00, aoe: false
  },
  {
    key: 1, name: 'CHARGED', jp: '帯電',
    dmg: 1.00, speed: 1.06, size: 1.12, aoe: false
  },
  {
    key: 2, name: 'ARCING', jp: '放電',
    dmg: 1.20, speed: 1.14, size: 1.26, aoe: false
  },
  {
    key: 3, name: 'MYTHICAL', jp: '雷神',
    dmg: 1.42, speed: 1.24, size: 1.46, aoe: true
  }
];

// The fraction of the meter each tier opens at.
export const TIER_AT = [0, 0.25, 0.55, 0.85];

export function tierOf(frac) {
  let t = 0;
  for (let i = TIER_AT.length - 1; i >= 0; i--) {
    if (frac >= TIER_AT[i] - 1e-6) { t = i; break; }
  }
  return t;
}

export function tierDef(t) { return TIERS[Math.max(0, Math.min(TIERS.length - 1, t))]; }

// ---------------------------------------------------------------------------
// THE THREE SCALARS every electric thing in his kit reads. All three return 1
// for anybody who is not him, so they are safe to call unconditionally from
// the shared effect dispatcher and there is no branch to forget.
// ---------------------------------------------------------------------------
export function chargeDmg(f) { return f?.cfg?.charge ? tierDef(f.chargeTier).dmg : 1; }
export function chargeSize(f) { return f?.cfg?.charge ? tierDef(f.chargeTier).size : 1; }
export function chargeSpeed(f) { return f?.cfg?.charge ? tierDef(f.chargeTier).speed : 1; }
export function chargeAoE(f) { return !!(f?.cfg?.charge && tierDef(f.chargeTier).aoe); }

// ---------------------------------------------------------------------------
// PER-TICK. Called from Fighter.update for every fighter; returns immediately
// for anyone without `cfg.charge`, which is the entire rest of the roster.
//
// Returns the tier if it CHANGED this tick (so the caller can fire the callout
// and re-dress the model), or null.
// ---------------------------------------------------------------------------
export function tickCharge(f, dt) {
  const c = f.cfg.charge;
  if (!c) return null;
  const before = f.chargeTier;

  // MYTHICAL BEAST AMBER pins the meter at full and stops the clock entirely.
  // The limiter is off: there is nothing left to manage, which is the whole
  // fantasy of the ultimate.
  if (f.amberT > 0) {
    f.charge = c.max;
  } else if (!f.alive || f.state === 'ko' || f.state === 'intro') {
    // nothing at all happens to a body that is not in the fight
  } else {
    const s = f.state;
    if (s === 'dash') f.charge += c.build.dash * dt;
    else if (s === 'run') f.charge += c.build.run * dt;
    else if (s === 'walk') f.charge += c.build.walk * dt;
    else if (DECAY_STATES.has(s)) {
      // BLOCKING BLEEDS HARDER THAN STANDING. Turtling is not merely a
      // non-answer against him, it is an active disarm — which is the line the
      // whole character is built on.
      const rate = (s === 'block' || s === 'blockstun' || s === 'simpleDomain')
        ? c.decay.block : c.decay.idle;
      f.charge -= rate * dt;
    }
    // everything else HOLDS — see the header.
  }

  f.charge = Math.max(0, Math.min(c.max, f.charge));
  f.chargeTier = tierOf(f.charge / c.max);
  return f.chargeTier !== before ? f.chargeTier : null;
}

// A flat grant. `why` is a key of HIT_GAIN, or a raw number.
export function gainCharge(f, why) {
  if (!f?.cfg?.charge) return 0;
  const amount = typeof why === 'number' ? why : (HIT_GAIN[why] ?? 0);
  if (!(amount > 0)) return 0;
  const before = f.charge;
  f.charge = Math.min(f.cfg.charge.max, f.charge + amount);
  f.chargeTier = tierOf(f.charge / f.cfg.charge.max);
  return f.charge - before;
}

// A flat cost. Returns false and spends NOTHING if he cannot afford it, so a
// refused move never leaves him half-drained.
export function spendCharge(f, amount) {
  if (!f?.cfg?.charge || !amount) return true;
  if (f.charge < amount) return false;
  f.charge -= amount;
  f.chargeTier = tierOf(f.charge / f.cfg.charge.max);
  return true;
}

// The 0..1 fill, for the HUD and the model.
export function chargeFrac(f) {
  const c = f?.cfg?.charge;
  return c ? Math.max(0, Math.min(1, f.charge / c.max)) : 0;
}
