// OUTPUT 呪力の放出 — Ryu Ishigori's entire character, in one module.
//
// ---------------------------------------------------------------------------
// THE CANON, AS RESEARCHED
// ---------------------------------------------------------------------------
// Sources (web, 2026-08-21): the Jujutsu Kaisen Wiki entries for Ryu Ishigori,
// CURSED ENERGY DISCHARGE and GRANITE BLAST, pulled as raw wikitext through
// the fandom MediaWiki API (see the same note at the top of combat/frost.js —
// a plain page fetch 402s from this environment, `api.php?action=parse` does
// not, so these were read rather than remembered).
//
//   INNATE TECHNIQUE — CURSED ENERGY DISCHARGE 呪力の放出 (Juryoku no Hōshutsu).
//   Directed blasts of compressed cursed energy, fired LIKE A CANNON. *The
//   blasts must be CHARGED in order to concentrate the cursed energy into a
//   single point before firing, and the strength of the output depends on how
//   much it has been built up.* The beams take several forms at the user's
//   discretion — a full-power blast, or a volley of rapid-fire shots.
//   He fires from a POMPADOUR SHAPED LIKE A CANNON, with a hole in the front,
//   which "keeps his hands completely free while charging and firing".
//
//   EXTENSION — GRANITE BLAST グラニテブラスト. The signature: a directed beam
//   of hyper-concentrated cursed energy that at full power devastates several
//   city blocks. *THE MORE CURSED ENERGY CHARGED INTO IT, THE BROADER ITS
//   ATTACK RANGE BECOMES.*
//
//   Kenjaku records him as having the HIGHEST CURSED ENERGY OUTPUT IN RECORDED
//   JUJUTSU HISTORY, and he is the only sorcerer who releases the same power
//   whether or not his cursed technique is active.
//
// ---------------------------------------------------------------------------
// *** THE THREE PLACES THE RESEARCH CONTRADICTS THE BRIEF ***
// The brief asked to be corrected, so these are corrected here, in the file
// the corrections change, and reported in the delivery notes as well.
// ---------------------------------------------------------------------------
//  1. HE HAS A DOMAIN EXPANSION — but nobody knows what it is.
//     The brief guesses he may not. He does: he casts one in ch.179, with the
//     Peacock King mudra, in a three-way simultaneous expansion with Yuta and
//     Uro. But the wiki is explicit that "the details of his innate domain and
//     his can't-miss function are ENTIRELY UNKNOWN" — the barrier came apart
//     before any of the three domains was fully realised, so the source has
//     shown the CASTING and nothing else. There is no name, no environment, no
//     sure-hit and no refinement in canon.
//     THE ROUTE TAKEN: no domain. `domain: null`, a burst ultimate with the
//     faster non-domain startup — because building him one would mean
//     inventing a name, an interior and a sure-hit payload out of nothing,
//     which is precisely what the brief forbids for a character who doesn't
//     have one, and the fact that a nameless domain technically exists does
//     not make an invented one any less invented. The ultimate is instead his
//     defining canon act: Granite Blast at maximum. What the domain DOES buy
//     him is the single best-attested fact about his tank — he cast one and
//     still had enough left to fire Granite Blast several more times — and
//     that is where the oversized ceiling below comes from.
//  2. HE IS NOT A HELPLESS BRAWLER. The brief asks for "weak normals and
//     terrible close-range options"; canon says the opposite in as many words
//     — "while Ryu excels at long-range combat, he does not rely on it and is
//     just as dangerous at close to mid-range", an "expert hand-to-hand
//     combatant" who matched Yuta blow for blow and overpowered Rika. The
//     cannon is his HAIR precisely so his hands stay free to punch with.
//     THE ROUTE TAKEN: the archetype the brief is buying is kept — he is slow,
//     short-reaching and enormously committal — but his normals are HEAVY
//     rather than feeble, because canon says every physical blow he throws
//     carries a cursed-energy discharge on contact. So getting inside him is
//     still the whole game plan and it still works (he cannot catch you, he
//     cannot pressure you, and his startup is the worst in the roster), but he
//     is not free once you are there. See the string in characters/ryu.js.
//  3. HE IS NOT ONE OF THE BIGGEST HUMANS IN THE ROSTER. The brief asks to
//     rank him against Todo, Yaga and Yuki; the reference makes him "a
//     handsome young man who is RELATIVELY TALL with a muscular body" — lean,
//     defined, visibly not a heavyweight. He is modelled to that. The lineup
//     and the exact ranking are in art/models/ryu.js.
//
// ---------------------------------------------------------------------------
// WHERE THE PIECES LIVE
//   · this file             the ceiling, the tier table, the charge clock
//   · combat/fighter.js     `outputT`, `outputTier`, the two charge states,
//                           the ceiling in `gainMaxCE`
//   · characters/ryu.js     every number that is a per-character decision
//   · combat/effects.js     the beam itself, and what it does to the map
//   · ui/hud.js             the oversized bar and the tier pips
//   · art/models/ryu.js     `setOutput(tier, frac)` — the cannon lighting up
// ===========================================================================
import { clamp } from '../core/mathutil.js';

// ===========================================================================
// PART 1 — THE CEILING, AND THE ONE ROSTER ASSUMPTION IT TOUCHES
// ===========================================================================
// *** READ THIS BEFORE CHANGING THE NUMBER. ***
//
// MAX_CE in this project is two things wearing one name, and Ryu is the first
// character for whom that matters:
//
//   A. IT IS A TANK. `res.curCE` is spent by techniques and refills toward
//      `res.maxCE`, so MAX_CE is how much cursed energy a fighter can hold.
//   B. IT IS THE SHARED ULTIMATE GATE. `Fighter.charged` is
//      `maxCE >= 100 && curCE >= maxCE`, and 100 is a MAGIC NUMBER that the
//      whole roster, the HUD's MAX CE badge, Barrier Break and Gojo's charged
//      Blue all agree on.
//
// Raising the ceiling therefore cannot mean "move the gate", or every one of
// those would quietly change meaning for twenty-eight other characters. So the
// split is made explicit:
//
//   *** THE GATE STAYS AT 100 FOR EVERYONE, FOREVER. THE TANK IS PER-
//   *** CHARACTER AND DEFAULTS TO 100.
//
// `Fighter.ceCeiling` reads `cfg.stats.ceCeiling ?? 100`, and the ONLY line in
// the project that changed is the clamp inside `gainMaxCE`, from a literal 100
// to that getter. `charged` is untouched, so a 100-ceiling character reaches
// the gate at exactly the moment they always did, and Ryu — whose ceiling is
// 150 — has to fill a bar half again as big before his ultimate opens, because
// `charged` also requires `curCE >= maxCE`. That is not a loophole, it is the
// price: the biggest tank in the game is also the slowest ultimate in the game
// to charge, and both facts come from the same number.
//
// TWO EXISTING MECHANICS SCALE OFF TARGET MAX_CE. Both were audited against
// the raised ceiling and NEITHER needed a change; the reasoning is recorded at
// each, because "I checked" is worth nothing without the arithmetic.
//
//   SUKUNA'S CLEAVE — `cleaveDamage` in combat/effects.js is
//   `base + ceScale x targetMAX_CE`, i.e. it hits harder the more cursed
//   energy the target is holding. Ryu at a full 150 is therefore CLEAVE'S BEST
//   TARGET IN THE GAME by a distance, exactly as the brief predicts. That is
//   the correct outcome and it is not degenerate, for a reason that is
//   structural rather than a patch: THE PEAK IS SELF-LIMITING. Cleave reads
//   `res.maxCE`, and `res.maxCE` is only at 150 when Ryu has spent a whole
//   round growing it and has not yet spent it. The moment he fires anything it
//   drops, and the moment he fires his ultimate `consumeFullBar` resets him to
//   `startMaxCE`. So the maximum-value Cleave is available exactly when Ryu is
//   at his most dangerous and has not committed yet, which is the correct
//   moment for a punish to be at its largest. The measured numbers are in the
//   delivery notes.
//
//   INUMAKI'S COMMAND RESISTANCE — `resistOf` in combat/speech.js is
//   `clamp01((maxCE - floor) / (100 - floor)) * RESIST_CAP`. Note the clamp:
//   it is ALREADY normalised against 100 and ALREADY capped. Ryu at 150 lands
//   on `RESIST_CAP` — the same ceiling any character at 100 MAX_CE reaches —
//   so he resists commands as hard as it is possible to resist them AND NO
//   HARDER. The brief asks for "should resist commands heavily", and he does;
//   the thing that makes it non-degenerate was already in the file, and no
//   line of speech.js changed.
// ===========================================================================

export const ROSTER_CE_CEILING = 100;   // what every other character gets
export const RYU_CE_CEILING = 150;      // stated here so the audit has a name

// ===========================================================================
// PART 2 — THE CHARGE TIERS
// ===========================================================================
// Hold RT. The beam grows through four tiers; let go at any of them.
//
// THE SHAPE OF THE TABLE IS THE CHARACTER. Look down the `dmg` column and then
// down the `hold` column: damage roughly quadruples across the four tiers and
// the hold time roughly quintuples. That is deliberate and it is the honest
// answer to "is the top tier worth it" — it is worth it only against somebody
// who cannot punish 2.6 seconds of standing still, which against a competent
// opponent means only after they have committed to something long. TIER 4 IS
// NOT MEANT TO LAND IN NEUTRAL. It is meant to land on a whiffed ultimate, a
// long recovery, a summon animation, or a wake-up they misjudged.
//
// `hold` is in FRAMES at 60 Hz and is CUMULATIVE from the start of the charge.
// `cost` is CURRENT_CE spent at RELEASE — nothing is spent while charging, so
// a bluffed charge costs Ryu time and safety and no meter at all, which is
// what makes starting one a mind game rather than a commitment.
export const TIERS = [
  {
    key: 0, name: 'TAP', jp: '放出',
    // THE PANIC RELEASE. Below tier 1 the charge has not concentrated into
    // anything; canon has exactly this beat — Ryu charges in a rush in ch.177
    // and Yuta blocks the weaker blast with his BARE HANDS. So a released
    // tier-0 is a real shot and a bad one, rather than a fizzle.
    hold: 0, cost: 10, dmg: 12, width: 0.85, range: 16, speed: 34,
    destruct: 34, kb: 4.0, hitstun: 20, shake: 0.30, flash: 0.10
  },
  {
    key: 1, name: 'CHARGED', jp: '溜め',
    hold: 30, cost: 18, dmg: 22, width: 1.20, range: 22, speed: 38,
    destruct: 60, kb: 5.5, hitstun: 26, shake: 0.45, flash: 0.16
  },
  {
    key: 2, name: 'COMPRESSED', jp: '圧縮',
    hold: 66, cost: 34, dmg: 40, width: 1.90, range: 30, speed: 42,
    destruct: 110, kb: 7.5, hitstun: 34, shake: 0.72, flash: 0.26
  },
  {
    key: 3, name: 'GRANITE', jp: '硬化',
    hold: 108, cost: 52, dmg: 62, width: 2.70, range: 40, speed: 46,
    destruct: 170, kb: 9.5, hitstun: 40, shake: 1.00, flash: 0.38
  },
  {
    key: 4, name: 'MAXIMUM', jp: '出力最大',
    // THE HARDEST-HITTING NON-ULTIMATE ATTACK IN THE GAME. For scale, the
    // previous holder was Mahoraga's World-Cutting Slash at 46 and the biggest
    // number anywhere in a character config outside an ultimate was 62.
    hold: 156, cost: 74, dmg: 88, width: 3.60, range: 48, speed: 50,
    destruct: 240, kb: 12.0, hitstun: 48, shake: 1.35, flash: 0.52
  }
];

export const MAX_HOLD = TIERS[TIERS.length - 1].hold;

// Which tier a given number of held frames has reached.
export function tierOf(frames) {
  let t = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (frames >= TIERS[i].hold) { t = i; break; }
  }
  return t;
}
export function tierDef(t) { return TIERS[clamp(t | 0, 0, TIERS.length - 1)]; }

// 0..1 across the WHOLE charge, for the model glow and the HUD ring.
export function chargeFrac(frames) { return clamp(frames / MAX_HOLD, 0, 1); }

// 0..1 WITHIN the current tier, for the pip that is filling. Two different
// numbers because they answer two different questions and a single one would
// be wrong for one of them: the model wants "how bright", the HUD wants "how
// close to the next step".
export function tierFrac(frames) {
  const t = tierOf(frames);
  if (t >= TIERS.length - 1) return 1;
  const a = TIERS[t].hold, b = TIERS[t + 1].hold;
  return clamp((frames - a) / Math.max(1, b - a), 0, 1);
}

// ---------------------------------------------------------------------------
// WHAT HE CAN AFFORD. Returns the highest tier his bar covers, so the HUD can
// grey out the pips he cannot reach and the CPU never starts a charge it will
// have to dump at tier 0. Not a gate — he may still hold past what he can pay
// for, and releasing an unaffordable tier drops him to the best one he can
// actually buy rather than refusing the shot.
// ---------------------------------------------------------------------------
export function affordableTier(f) {
  const ce = f?.res?.curCE ?? 0;
  let best = 0;
  for (const t of TIERS) if (ce >= t.cost) best = t.key;
  return best;
}

// The tier a release actually fires at: what he held, capped by what he can
// pay. Returns null only if he cannot afford tier 0, which given tier 0 costs
// 10 means he is effectively empty.
export function releaseTier(f, frames) {
  const held = tierOf(frames);
  const afford = affordableTier(f);
  if ((f?.res?.curCE ?? 0) < TIERS[0].cost && !f.noCE && !f.inJackpot) return null;
  return Math.min(held, afford);
}

// ===========================================================================
// PART 3 — BRACE
// ===========================================================================
// B. He plants and refuels. Completely immobile, no guard, and a slow
// wind-down before he can act again.
//
// *** NO SELF-DAMAGE OF ANY KIND. *** The brief is explicit and it is right:
// Brace costs him TIME and SAFETY, never health. Nothing in this module or in
// the state that runs it touches `res.hp`, and there is deliberately no dial
// here that could be turned into one later.
//
// The rate is per second and it is generous, because the thing being bought is
// the invitation: an opponent who sees Brace and does not immediately run at
// Ryu has made a mistake, and the reward for spotting it has to be worth
// crossing the arena for.
export const BRACE = {
  regenPerSec: 26,        // CURRENT_CE per second while planted
  minFrames: 20,          // he is committed for at least this long
  maxFrames: 150,         // 2.5 s, then it ends on its own
  windDownFrames: 26      // and he is still standing there for this long after
};

// Per-tick. Called from the `brace` state and from nowhere else, so there is
// exactly one place cursed energy is created by this ability.
export function tickBrace(f, dt) {
  const rate = f.cfg?.special?.regenPerSec ?? BRACE.regenPerSec;
  const before = f.res.curCE;
  f.res.curCE = Math.min(f.res.maxCE, f.res.curCE + rate * dt);
  return f.res.curCE - before;
}

// ===========================================================================
// PART 4 — THE READS
// ===========================================================================
// All of these return a neutral value for anybody without `cfg.output`, so the
// shared getters can call them unconditionally.

// He is planted. Read by the state machine, the CPU and the FX — one predicate
// so "is he committed right now" can never be answered two different ways.
export function isCommitted(f) {
  return f?.state === 'outputCharge' || f?.state === 'brace' || f?.state === 'braceDown';
}

// THE TELL, as a single 0..1 number the opponent's side of the screen can read
// from anywhere: 0 = not charging, 1 = about to fire the biggest thing in the
// game. The arena light, the ground cracks and the air distortion all scale
// off this one value, so they cannot disagree about how frightened to be.
export function threatOf(f) {
  if (!f?.cfg?.output) return 0;
  if (f.state !== 'outputCharge') return 0;
  return chargeFrac(f.outputT ?? 0);
}
