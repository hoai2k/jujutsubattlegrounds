// GLOBAL BALANCE SCALARS
//
// User-requested (2026-08-13): "increase the health of all characters by A LOT
// and slightly lower the damage of punches and make the damage for special
// attacks slightly higher so it's not just spamming punch to win."
//
// The point of the change is the RATIO, not the absolute numbers. Before it,
// a punch string was ~17 damage into a ~100 health bar — six strings and the
// round was over — so the basic string was not merely a viable win condition,
// it was the FASTEST one, and every technique in the game was competing with
// something that costs nothing and is safer. Afterwards a punch is worth about
// a third of what it was as a fraction of a health bar and a technique is
// worth about half again more than that relative to it, so the string is what
// you use to build meter and create the opening, and the technique is what
// actually takes the round.
//
// THREE NUMBERS, AND THEY ARE THE ONLY DIALS. Everything downstream reads
// them; there are no per-character balance edits anywhere. To retune the game,
// change these and nothing else.
//
// MEASURED, not estimated. Harness: Todo on CPU versus a fully passive Yuji on
// jujutsu_high, driven headless at a fixed 1/60 step, timed to one full stock.
//
//                       max HP   time to a stock   effective DPS
//   before (1/1/1)         105        22.3 s           5.01
//   after  (2.35/.85/1.3)  247        39.6 s           6.28
//
// So a real fight runs about 1.8x longer, not the 2.35x the health alone
// suggests — because the CPU's damage is mostly techniques and techniques went
// UP. Damage per second actually ROSE; what fell is specifically what a jab is
// worth. The two ratios that matter, in strings/casts needed to take a stock:
//   punch-only   HP / PUNCH   = 2.76x as many as before
//   technique    HP / SPECIAL = 1.81x as many as before
// which is the request restated as a number: a technique is now 1.53x more
// efficient relative to a punch than it used to be, and the string is what you
// throw to build meter and open them up rather than the thing that wins.
//
// `ceGainPerPunch` is deliberately untouched, so the longer fight also hands
// both players considerably more meter than they used to have — the extra time
// is spent throwing the techniques, not jabbing through it.
//
// IF ROUNDS STILL RUN LONG FOR YOUR TASTE, HP IS THE DIAL. Drop it toward 1.8
// and the punch-to-technique ratio, which is the actual request, is completely
// unaffected.
export const HP = 2.35;        // every fighter's maximum health
export const PUNCH = 0.85;     // the basic string and the heavy — "slightly lower"
export const SPECIAL = 1.30;   // every technique, ultimate, domain, summon and DoT

// The multiplier for one incoming hit. `basic` is tagged in hits.js from the
// `isPunch` flag the attack state already sets, which is true for exactly the
// punch string and the heavy swing and false for everything else — including
// command moves like Todo's shoulder charge, which are techniques by intent
// even though they resolve through the melee path.
export function hitMult(hit) {
  return hit.basic ? PUNCH : SPECIAL;
}

// HEALTH-DENOMINATED CONFIG. Anything measured in points of health has to move
// with the health bar or the change silently retunes it: a heal of 18 into a
// 235-point bar is a third of what a heal of 18 into a 100-point bar was.
// These are the paths that carry such a value, and the list is exhaustive as
// of this change — a new one has to be added here.
//
// DELIBERATELY ABSENT:
//   · summon/minion health (Megumi's shikigami, Mahito's transfigured human,
//     Higuruma's Judgeman). They are meant to die to a couple of clean hits
//     and total player damage output is roughly flat, so leaving them alone is
//     what PRESERVES that, not what breaks it.
//   · Hanami's root-field patch `special.hp` and its `heavyDamage`/`fireDamage`
//     — that pool and the numbers that chew through it are denominated in each
//     other, not in fighter health.
//   · anything already expressed as a FRACTION (Kurourushi's `healFrac`,
//     Hakari's `hpFloor` ratio), which follows the bar for free.
const HEALTH_DENOMINATED = [
  'stats.hp',
  // PANDA'S THREE CORES. Each pool is a health bar in its own right, so each
  // has to move with the global dial or the change silently retunes him — and
  // it would retune him worse than anybody, because his `stats.hp` (the
  // balanced core) WOULD scale while the other two did not, leaving him with
  // one enormous core and two paper ones. The list's own instruction says a new
  // health-denominated path has to be added here; these are the three.
  'cores.defs.panda.hp',
  'cores.defs.gorilla.hp',
  'cores.defs.trike.hp',
  'gluttony.perStage.hp',      // Kurourushi's per-stage max-health gain
  'jackpotKit.ct2.heal',       // Hakari's RCT counter stance
  'rct.rate',                  // Hakari's Jackpot regeneration, health/second
  'rct.perSecond',             // Sukuna's and Sukuna-Yuji's passive RCT
  'flora.regen.natural',       // Hanami's Nature's Embrace, health/second
  'flora.regen.artificial',
  'flora.regen.field',
  'ultimate.recoil'            // Yuji's Sukuna-transform self-damage
];

function at(obj, path) {
  const keys = path.split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    o = o?.[keys[i]];
    if (o === undefined || o === null) return null;
  }
  const k = keys[keys.length - 1];
  return typeof o[k] === 'number' ? { o, k } : null;
}

// Applied once, in characters/schema.js `withDefaults`, so every consumer —
// the HUD bar, the round reset, the heal clamps — reads the scaled number and
// no call site has to know this happened.
export function applyHealthScale(cfg) {
  for (const path of HEALTH_DENOMINATED) {
    const hit = at(cfg, path);
    if (hit) hit.o[hit.k] = hit.o[hit.k] * HP;
  }
  return cfg;
}
