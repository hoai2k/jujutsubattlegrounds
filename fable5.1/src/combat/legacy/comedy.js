// THE COMEDY METER 笑い — Takaba's confidence, with a bar drawn on it.
//
// ===========================================================================
// WHY THIS IS NOT AN INVENTED RESOURCE
// ===========================================================================
// The Comedian runs on Takaba's GENUINE belief that something is funny. Break
// that belief and the technique stops — which is the canonical limit of the
// technique and the thing Kenjaku worked out and exploited. So the meter is
// not a game-design bolt-on that happens to suit him; it is the source's own
// failure condition, made playable. See the research note in
// characters/takaba_bits.js.
//
// ===========================================================================
// WHAT IT DOES, AND THE ONE THING IT DELIBERATELY DOES NOT
// ===========================================================================
// IT DOES: shift the WEIGHTING of his outcome tables. A cold room rolls the
// small, tame, faintly pathetic bits; a hot room rolls the colossal ones.
// IT DOES: turn the audience on at maximum — crowd laughter under his hits, a
// spotlight, applause on knockdowns — and change his idle posture per tier.
// IT DOES: set the difficulty of THE GAME SHOW at the moment of activation.
//
// IT DOES NOT MAKE HIM STRONGER. Every entry in a table declares a `value`
// column and every entry in a table is worth the same, so the expected output
// of a roll is IDENTICAL at all three tiers. That is the brief's hardest ask
// and the reason `bigness` exists as a separate column from `value`: the
// meter tilts SPECTACLE, never power.
//
// ===========================================================================
// THE ROLL — REUSED, NOT REWRITTEN
// ===========================================================================
// `rollFrom` below is a lift of `DomainSystem._rollSwordTech`
// (src/domains/domains.js), which is the weighted-table roller Yuta's domain
// has always used: a seeded stream, a no-immediate-repeat filter, a debug
// force override, and `weightedPick` from core/mathutil.js doing the actual
// arithmetic. The only thing added is the meter tilt, which is a pure function
// of the entry's `bigness` applied to the weight before the pick.
//
// *** DOMAINS.JS WAS NOT MODIFIED. *** Yuta's roll runs through his own copy,
// untouched, with its own `swordRoll` stream and its own `forcedRoll`. The two
// share `weightedPick` and nothing else, which is the same relationship every
// other pair of systems in this project has with a mathutil helper. Verified
// in the delivery report.
import { mulberry32, weightedPick, clamp } from '../../core/math.js';

// ---------------------------------------------------------------------------
// THE METER
// ---------------------------------------------------------------------------
export function ensureComedy(f) {
  if (f.comedy == null) {
    const c = f.cfg.comedy;
    f.comedy = c ? c.start : 0;
    f.comedyTier = 0;
    // ONE SEEDED STREAM PER FIGHTER, exposed in the debug overlay, exactly as
    // Yuta's `swordRoll` is. A fixed seed makes a bug reproducible; without it
    // "the pie one is broken" is not an actionable report.
    f.comedyRoll = { seed: (Math.random() * 0xffffffff) >>> 0, last: null };
    f.comedyRoll.rng = mulberry32(f.comedyRoll.seed);
    f.forcedBit = null;
  }
  return f.comedy;
}

export function tierIndexFor(f, value = f.comedy) {
  const tiers = f.cfg.comedy?.tiers ?? [];
  const p = value / (f.cfg.comedy?.max ?? 100);
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) if (p >= tiers[i].at) idx = i;
  return idx;
}

export function tierOf(f) { return f.cfg.comedy?.tiers?.[f.comedyTier ?? 0] ?? null; }

// Everything that moves the meter goes through here, so the ledger is one
// function and a new source cannot forget to announce a tier change.
export function gainComedy(f, amount, reason = '') {
  if (!f.cfg.comedy) return;
  ensureComedy(f);
  const max = f.cfg.comedy.max;
  const before = f.comedyTier;
  f.comedy = clamp(f.comedy + amount, 0, max);
  const now = tierIndexFor(f);
  if (now !== before) {
    f.comedyTier = now;
    f.emit('comedyTier', { tier: now, def: f.cfg.comedy.tiers[now], up: now > before });
  }
  if (amount !== 0) f.emit('comedy', { amount, reason, value: f.comedy });
}

// The slow bleed. A set does not hold itself up.
export function tickComedy(f, dt) {
  if (!f.cfg.comedy) return;
  ensureComedy(f);
  if (f.state === 'riff') return;      // the riff owns the meter while it runs
  gainComedy(f, -f.cfg.comedy.idleDrainPerSec * dt);
}

// ---------------------------------------------------------------------------
// THE WEIGHT TILT
// ---------------------------------------------------------------------------
// `tilt` is the tier's exponent. The entry's effective weight is
//
//     w * exp(tilt * (bigness - 0.5) * 2)
//
// so at tilt 0 (WARMING UP) the tables are exactly as authored; at -1.35
// (OPEN MIC) a bigness-1.0 entry is weighted e^-1.35 ≈ 0.26x and a
// bigness-0.15 entry ≈ 1.93x; at +1.55 (KILLING) the reverse. Nothing is ever
// weighted to ZERO, deliberately: a cold Takaba can still roll a piano, it is
// just rare, and "this can never happen right now" is a worse feeling in a
// random character than "this almost never happens".
export function weightAt(entry, tilt) {
  return (entry.weight ?? 1) * Math.exp(tilt * ((entry.bigness ?? 0.5) - 0.5) * 2);
}

// ---------------------------------------------------------------------------
// THE ROLL
// ---------------------------------------------------------------------------
// Lifted from domains.js `_rollSwordTech`. Same three rules:
//   1  a debug FORCE overrides everything and still records `last`
//   2  the previous result is filtered out — NO IMMEDIATE REPEATS
//   3  `weightedPick` off the fighter's own seeded stream
export function rollFrom(f, table, { tilt = 0 } = {}) {
  ensureComedy(f);
  const roll = f.comedyRoll;
  if (f.forcedBit) {
    const forced = table.find(e => e.key === f.forcedBit);
    if (forced) { roll.last = forced.key; return forced; }
  }
  const pool = table.length > 1 ? table.filter(e => e.key !== roll.last) : table;
  const entry = weightedPick(pool, roll.rng, e => weightAt(e, tilt));
  roll.last = entry.key;
  return entry;
}

// What the effect dispatcher calls: pick the tilt off the fighter's current
// tier and roll. `tierOverride` is Yuta's copy, which always rolls WARM — see
// the ruling in characters/takaba.js.
export function rollBit(f, table, tierOverride = null) {
  const tiers = f.cfg.comedy?.tiers;
  let tilt = 0;
  if (tierOverride && tiers) tilt = tiers.find(t => t.key === tierOverride)?.tilt ?? 0;
  else if (tiers) tilt = tiers[f.comedyTier ?? 0]?.tilt ?? 0;
  return rollFrom(f, table, { tilt });
}

// Debug (F7): cycle the forced outcome through OFF -> each entry in both
// tables. Same shape as `cycleForcedRoll` in domains.js.
export function cycleForcedBit(f, allBits) {
  ensureComedy(f);
  const keys = [null, ...allBits.map(e => e.key)];
  f.forcedBit = keys[(keys.indexOf(f.forcedBit) + 1) % keys.length];
  return f.forcedBit;
}

export function comedyDebug(f) {
  if (!f?.cfg?.comedy) return null;
  const t = tierOf(f);
  return {
    value: Math.round(f.comedy ?? 0),
    tier: t?.name ?? '-', tilt: t?.tilt ?? 0,
    seed: f.comedyRoll?.seed, last: f.comedyRoll?.last, forced: f.forcedBit
  };
}
