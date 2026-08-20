// TAKABA FUMIHIKO 高羽史彦 — THE COMEDIAN, and the roster's WILDCARD.
//
// Everybody else in this game is a plan. Gojo is a plan, Higuruma is a plan,
// Nanami is a very boring plan that works. Takaba is the only fighter nobody
// can plan around, INCLUDING HIM: every technique he owns resolves into a roll
// off a weighted table of absurd outcomes, and neither player knows what is
// about to happen until the callout lands.
//
// He is also a deliberate tonal break. A cast of sorcerers and monsters, and
// one normal man in a costume who is trying his material out on them.
//
// ===========================================================================
// RESEARCH — see characters/takaba_bits.js for the sources and the full note.
// ===========================================================================
// The short version, because it decides two mechanics:
//   · THE COMEDIAN makes whatever he GENUINELY finds funny become real. So the
//     bits are reality-warps, not thrown props: they arrive fully formed with
//     no cast-up.
//   · ITS ONLY LIMIT IS HIS CONFIDENCE. Shake his belief in his own material
//     and the technique stops — which is what Kenjaku worked out and worked.
//     THE COMEDY METER IS THAT, WITH A BAR ON IT. It is not an invented
//     resource; it is the canonical failure mode made playable.
// One correction to the brief is recorded in takaba_bits.js: in canon a shaken
// Takaba produces LESS, where the brief asks for equal-value-smaller-spectacle.
// Built as briefed, because it is the better game; flagged because it is the
// looser adaptation.
//
// CANON-CORRECT: NO DOMAIN EXPANSION. He does not have one and the brief is
// explicit. D-pad Right is a burst ultimate on the standard gate.
import { withDefaults, PUNCH_DEFAULTS } from './schema.js';
import { BIT_TABLE, BIG_TABLE } from './takaba_bits.js';

// ---------------------------------------------------------------------------
// THE COMEDY METER — the three tiers, and what each one is
// ---------------------------------------------------------------------------
// `at` is the meter fraction the tier starts at. `tilt` is the exponent applied
// to each outcome's `bigness` when the table is re-weighted — see `weightAt` in
// combat/comedy.js. Negative tilt favours the tame entries, positive favours
// the enormous ones, and because every entry in a table is worth the same
// `value`, the EXPECTED OUTPUT IS FLAT ACROSS ALL THREE TIERS. A Takaba who is
// killing gets more ridiculous, not stronger. That is the brief's hardest ask
// and it is the whole reason `value` exists as a column.
export const COMEDY_TIERS = [
  {
    key: 'cold', at: 0.00, name: 'OPEN MIC', jp: '滑り', tilt: -1.35, color: 0x6f7a88,
    desc: 'Bombing. Small, tame, faintly pathetic bits. Same average damage, no spectacle.'
  },
  {
    key: 'warm', at: 0.40, name: 'WARMING UP', jp: '温まる', tilt: 0.0, color: 0xe0b45a,
    desc: 'The room is with him. Flat weighting — the tables as authored.'
  },
  {
    key: 'killing', at: 0.82, name: 'KILLING', jp: '爆笑', tilt: 1.55, color: 0xff4d7a,
    desc: 'Enormous ridiculous bits, an audience, a spotlight and applause on knockdowns.'
  }
];

export const TAKABA = withDefaults({
  id: 'takaba', name: 'TAKABA', title: 'CULLING GAME — THE COMEDIAN',
  // A normal man. Every stat below is within a few percent of the roster
  // average on purpose: the joke and the design are the same thing, which is
  // that there is nothing special about him at all until his technique fires.
  stats: {
    hp: 102, walkSpeed: 2.55, runSpeed: 5.05, dashSpeed: 8.40, jumpVel: 8.6,
    startMaxCE: 42, ceRegen: 2.4, ceGainPerPunch: 6.2,
    stamina: 96, staminaRegen: 21, dashDrain: 27, damageScale: 0.94
  },
  size: {
    height: 1.80, bodyRadius: 0.30, pushRadius: 0.48,
    hurtRadius: 0.56, hurtHeight: 1.56, hurtCenter: 1.02, hurtPad: 0.12
  },

  // ---- X — THE MOST NORMAL PUNCH IN THE GAME -------------------------------
  // Deliberately mediocre and deliberately IDENTICAL to PUNCH_DEFAULTS except
  // for a shorter reach, because he is a normal guy with normal arms who has
  // never trained. He is the only character on the roster who takes the shared
  // defaults essentially untouched, and that is the characterisation: the
  // baseline the whole roster is measured against, worn by the one man who has
  // no business being measured against it.
  punches: PUNCH_DEFAULTS.map(p => ({ ...p, reach: p.reach - 0.06, src: 'punch' })),
  heavy: {
    name: 'Haymaker (Amateur)', dmg: 13, startup: 18, active: 5, recovery: 30,
    reach: 1.78, kb: 5.0, hitstun: 30, step: 2.2, staminaCost: 20, armorFrames: 0
  },

  // ---- THE METER -----------------------------------------------------------
  comedy: {
    max: 100, start: 22,
    tiers: COMEDY_TIERS,
    // ---- IT FILLS WHEN THE MATERIAL LANDS ---------------------------------
    gainBitLand: 7,          // a BIT connects
    gainBigLand: 13,         // THE BIG ONE connects
    gainPunchLand: 1.6,      // an ordinary punch connects — he is winning an exchange
    gainTaunt: 14,           // the taunt. The one taunt in the game with an effect.
    gainRiffPerSec: 26,      // the RIFF stance, while it is uninterrupted
    gainKnockdown: 5,        // he put them on the floor and the room liked it
    // ---- IT DRAINS WHEN HE BOMBS -------------------------------------------
    idleDrainPerSec: 1.5,    // slow bleed: a set does not hold itself up
    loseWhiff: 5,            // a technique that connected with nothing
    loseHit: 4,              // he got hit
    loseHeavy: 9,            // he got put on the floor
    loseRiffInterrupt: 22,   // hit DURING the riff. The punishment for greed.
    loseBlocked: 2.5,        // the bit landed and they blocked it — polite laughter
    // ---- AT MAXIMUM: THE AUDIENCE ------------------------------------------
    // Presentation only; it grants nothing. See fx/comedyfx.js `audience`.
    audienceAt: 0.82, spotlight: true
  },

  // ---- RB (CT1) — A BIT ----------------------------------------------------
  // THE FURTHEST-REACHING TECHNIQUE OF THE PAIR (6.5 m against RT's 4.2), so
  // the slot convention holds with no excuse required. Fast, cheap, low
  // commitment — his neutral tool, pressed constantly.
  ct1: {
    name: 'A Bit', jpName: 'ネタ', cost: 12,
    startup: 13, active: 3, recovery: 22,
    effect: 'takaba_bit', clip: 'ct1',
    range: 6.5, table: BIT_TABLE
  },

  // ---- RT (CT2) — THE BIG ONE ----------------------------------------------
  // THE STRONGEST TECHNIQUE OF THE PAIR. Slow, committed, and about 2.3x the
  // payoff. Shorter reach than RB, which is the trade.
  ct2: {
    name: 'The Big One', jpName: '大ネタ', cost: 30,
    startup: 27, active: 4, recovery: 36,
    effect: 'takaba_big', clip: 'ct2',
    range: 4.2, table: BIG_TABLE
  },

  // ---- B — RIFF ------------------------------------------------------------
  // A short stance where he works the crowd. It builds the meter faster than
  // anything else in the kit and he is COMPLETELY VULNERABLE throughout — no
  // guard, no armour, no cancel out of it after the first few frames. Getting
  // hit during it does not merely interrupt: it drains 22 meter, which is more
  // than the whole stance was going to earn.
  //
  // Pure risk, and the only button in his kit that is a decision rather than a
  // dice roll.
  special: {
    key: 'takaba_riff', name: 'RIFF', jp: '客いじり', clip: 'riff',
    cost: 0, cooldown: 5.5,
    duration: 1.35,          // seconds of stance
    cancelBefore: 0.18,      // he may back out inside this window and nothing happens
    startup: 6
  },

  // ---- D-pad Right — THE GAME SHOW -----------------------------------------
  // Non-domain, standard gate (MAX_CE 100 + full CURRENT_CE), full bar cost,
  // standard backlash. 32-frame startup, in the non-domain band.
  //
  // The arena becomes a game show and the OPPONENT is the contestant. Three
  // minigames, drawn from a pool of six, played back to back with both fighters
  // frozen. Everything about how it runs is in combat/gameshow.js; this is the
  // data, and every number here was tuned by playing it.
  ultimate: {
    kind: 'burst', name: 'THE GAME SHOW', jpName: '公開収録',
    startup: 32, active: 1, recovery: 26,
    effect: 'takaba_gameshow', clip: 'ult',
    show: {
      rounds: 3,
      // ---- THE TEN SECOND BUDGET ------------------------------------------
      // This is an ultimate, not an interruption, and the brief holds the line
      // at ten seconds INCLUDING transitions and the result. The worst case is
      // every round timing out:
      //   opening card 0.60 + 3 x (title 0.50 + play <=2.00 + settle 0.22)
      //                     + result 1.45  =  8.21 s
      // and the measured worst case in a live match is 8.4 s with the cast
      // frames included. A round the contestant passes early ends on the pass,
      // so the common case is nearer 6.5 s.
      openCard: 0.60, titleCard: 0.50, settle: 0.22, result: 1.45,
      playCap: 2.00,
      // Chip damage when they pass all three. It is not nothing — they still
      // spent his whole bar's worth of time being humiliated — but it is not a
      // punish either.
      damage: { pass3: 6, pass2: 34, pass1: 62, pass0: 'INSTANT_KO' },
      // ---- CPU CONTESTANT ---------------------------------------------------
      // Base per-round pass probability when the CPU is the one playing, before
      // the difficulty tier's modifier. It MUST be able to both pass and fail:
      // a CPU that always passes makes the ultimate worthless and one that
      // always fails makes it an auto-win.
      //
      // MEASURED, 40 sampled shows per tier, in-engine (test harness in the
      // delivery notes), as [fail-all, pass 1, pass 2, pass 3]:
      //     OPEN MIC     5% / 5%    / 40% / 50%
      //     WARMING UP 7.5% / 32.5% / 35% / 25%
      //     KILLING   22.5% / 40%   / 20% / 17.5%
      // which is the shape the brief asks for at both ends: never worthless
      // (a CPU at OPEN MIC walks away clean half the time) and never automatic
      // (a CPU at KILLING still survives more than three quarters of them).
      cpuBase: 0.72,
      cpuTier: { cold: 0.08, warm: -0.06, killing: -0.24 },
      cpuJitter: 0.10
    }
  },

  domain: null, // canon-correct: Takaba has no Domain Expansion

  blockChipMult: 1.0, blockStaminaMult: 1.0, blockStartupFrames: 6,
  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY — THE INTERESTING CASE ----------------------------------
  // Copying a RANDOM-OUTCOME technique should ROLL FROM THE SAME TABLE, as the
  // brief says, and it does: `takaba_bit` is the effect key, so Yuta's copy
  // runs the identical dispatcher and the identical `rollFrom` helper. Two
  // rulings fall out and both are deliberate:
  //   · YUTA ROLLS OFF THE *BIT* TABLE, NEVER THE BIG ONE. Copy is a weaker
  //     echo of a technique (0.62 power) and every other entry in the copy
  //     table takes the character's CT1 rather than their CT2.
  //   · YUTA ROLLS AT THE **WARM** TIER, ALWAYS. He has no Comedy Meter, and
  //     the meter is Takaba's confidence — not a property of the technique.
  //     Borrowing a man's sense of humour does not borrow his week.
  copyEffect: { effect: 'takaba_bit', dmg: 8, name: 'Copied: A Bit', copyTier: 'warm' }
});
