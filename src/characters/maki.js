// ===========================================================================
// MAKI ZENIN — THE ONLY CHARACTER WITH IN-MATCH PROGRESSION
// ===========================================================================
// She is built as the MIRROR IMAGE OF TOJI. He is at full power on frame one
// and never scales; she starts below the roster average and ends up his equal.
// Same weapon family, opposite curve.
//
// ---------------------------------------------------------------------------
// HEAVENLY RESTRICTION — THE SECOND ONE, AND IT REUSES HIS HANDLING ENTIRELY
// ---------------------------------------------------------------------------
// `noCursedEnergy: true` is the same flag Toji declares, keyed off by the same
// sites, with no new branch anywhere. What the flag turns on is documented in
// full at the top of characters/toji.js and NOTHING about that list changed to
// accommodate her — that was the design constraint and it held. Specifically:
//
//   fighter.spendCE     always succeeds
//   fighter.charged     always false
//   fighter.ultReady    always false  <- and see the AWAKENING GATE below,
//                       which is why she needed a new ultimate `kind` rather
//                       than a change to this getter
//   fighter.update      CE regen skipped
//   hud                 CE bar and MAX CE badge REMOVED, not shown empty
//   domains.castDomain  refused
//   ai                  never evaluates a domain or a charge plan
//
// The one thing she declares that he also declares is `speechResist`. His is
// 0.45 and the reasoning is written out in his file at length; hers is 0.52
// for one honest reason: at stage 0 she is NOT yet a completed Heavenly
// Restriction — canon is explicit that Mai's death is what finishes it — so
// the body that shakes off a command is only partly built. combat/speech.js
// reads a flat number, so the value is the stage-0 one and awakening does not
// change it. That is a deliberate simplification and it is stated rather than
// hidden: making cursed speech resistance scale with the meter would put a
// second consumer on the awakening system for a two-frame difference.
//
// ---------------------------------------------------------------------------
// THE AWAKENING — the whole character
// ---------------------------------------------------------------------------
// Rules live in combat/awakening.js; every NUMBER lives here. Four states:
// stage 0 (base) plus three awakened stages, each PERMANENT for the round.
// The meter fills from landing hits AND from taking damage — she gets stronger
// by being in the fight, not by winning it — and it only ever goes up.
//
// THE THRESHOLDS. 100 points of meter, gates at 28 / 60 / 100.
//   · the FIRST gate is early and cheap on purpose. A character who is
//     strictly worse than the roster for forty seconds is not fun to hold, so
//     stage 1 arrives after roughly one exchange and immediately takes the
//     worst of the base numbers away.
//   · the LAST gate is deliberately most of a round. At the measured build
//     rates below, a fighter who is winning reaches stage 3 at about 70–80
//     seconds and one who is losing reaches it sooner, which is the intended
//     asymmetry: falling behind is how she catches up.
//
// See STAGES below for exactly what each one grants. The short version: at
// stage 0 her damage multiplier is 0.86 — the LOWEST on the roster — and at
// stage 3 it is 1.18, which is Toji's number exactly. That equality is the
// point of the character and it is not an accident of tuning.
//
// ---------------------------------------------------------------------------
// THE BALANCE FRAME
// ---------------------------------------------------------------------------
// Weakest character in the game for the first fifteen seconds; a top-tier one
// in the last thirty. If she is overtuned the dials are the STAGE-3 numbers
// and `awakening.gainOnDeal` — NOT the thresholds, because making the climb
// longer just makes the bad part of the character last longer, which is the
// wrong fix in the same way giving Toji a resource would be.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE FOUR STAGES
// ---------------------------------------------------------------------------
// Every multiplier below is applied in combat/awakening.js and read from
// exactly one place, so this table IS the progression. The columns are chosen
// so that each stage improves something the player can FEEL in a different
// system — damage, then speed, then frames, then stamina — rather than four
// identical percentage bumps.
//
//   dmg      outgoing damage multiplier (replaces stats.damageScale)
//   speed    walk/run/dash multiplier
//   startup  attack startup multiplier — BELOW 1 is faster
//   stamina  max stamina and regen multiplier
//   block    incoming chip multiplier while guarding — BELOW 1 is better
//   dash     dash i-frames, in frames, granted flat
export const MAKI_STAGES = [
  // ---- STAGE 0 — BELOW THE ROSTER AVERAGE, AND IT SHOULD HURT ------------
  // 0.86 damage is the lowest number in the game (next lowest is Inumaki's
  // 0.88, and he has a whole second kit to compensate). Startup 1.10 means
  // every attack she owns is 10% slower than its printed frame data. She is
  // genuinely bad here and that is the design.
  { name: 'RESTRAINED', jp: '基', dmg: 0.86, speed: 0.94, startup: 1.10, stamina: 0.90, block: 1.10, dash: 0 },
  // ---- STAGE 1 — the worst of it comes off -------------------------------
  // Arrives after roughly one exchange. Damage reaches roughly roster
  // average; the startup penalty halves. This is the stage where she stops
  // feeling broken and starts feeling merely modest.
  { name: 'STIRRING', jp: '兆', dmg: 0.97, speed: 1.00, startup: 1.05, stamina: 1.00, block: 1.00, dash: 2 },
  // ---- STAGE 2 — genuinely good ------------------------------------------
  // Above average across the board and the frame data goes POSITIVE — her
  // moves now come out faster than printed, which is the first stage where
  // the pressure game actually works.
  { name: 'AWAKENING', jp: '覚', dmg: 1.07, speed: 1.07, startup: 0.95, stamina: 1.14, block: 0.90, dash: 4 },
  // ---- STAGE 3 — TOJI'S EQUAL -------------------------------------------
  // 1.18 is his `damageScale` to two decimal places, deliberately. The speed
  // multiplier lands her run at 6.1 against his 6.3 and her dash at 10.2
  // against his 10.4 — a shade under him on the legs, which is right: he is
  // still the faster of the two and she is the one with two weapons out.
  // 7 dash i-frames is exactly his `dashIFrames`.
  { name: 'HEAVENLY RESTRICTION', jp: '天与呪縛', dmg: 1.18, speed: 1.16, startup: 0.88, stamina: 1.30, block: 0.74, dash: 7 }
];

export const MAKI = withDefaults({
  id: 'maki', name: 'MAKI', title: 'THE ZENIN WHO LEFT',

  // THE FLAG. Same one Toji declares, same handling, no new branch.
  noCursedEnergy: true,
  speechResist: 0.52,

  stats: {
    // MIDDLE OF THE PACK, and it does not scale. Health is the one thing
    // awakening does NOT touch: the meter is about output and mobility, and a
    // character whose health bar grows mid-round would make every damage
    // calculation the opponent has made a lie.
    // (Nobara 96 · Yuta 92 · Gojo 95 · MAKI 104 · Yuji 105 · Toji 112)
    hp: 104,
    // BASE legs, before the stage multiplier. At stage 0 (×0.94) she walks at
    // 2.63 and runs at 4.98 — below the roster average. At stage 3 (×1.16)
    // she runs at 6.15, second only to Toji.
    walkSpeed: 2.80, runSpeed: 5.30, dashSpeed: 8.80, jumpVel: 9.0,
    // NO CURSED ENERGY. Stated explicitly rather than left to the schema
    // defaults, exactly as Toji's config does, so reading this file tells you
    // the truth about her.
    startMaxCE: 0, ceRegen: 0, ceGainPerPunch: 0,
    // A REAL POOL, but nothing like his 160. Awakening multiplies it: 118 at
    // stage 0, 153 at stage 3, which lands just under him at the very end.
    stamina: 118, staminaRegen: 24, dashDrain: 24,
    // Overridden every tick by the stage table — the value here is the
    // stage-0 one so that anything reading the raw config sees the truth.
    damageScale: 0.86
  },

  // ---- THE STRING ---------------------------------------------------------
  // A WEAPON string, not a fist string, and the numbers say so: more reach
  // than any unarmed set in the game and less speed. These are the RAW
  // numbers; the stage table's `startup` multiplier is applied on top, so at
  // stage 0 the jab is a 7-frame move and at stage 3 it is a 5-frame one.
  //
  // Compare Toji's unarmed string (7/9/14 damage at 5/6/9 startup, reach
  // 1.55–1.65). Hers is longer and slower at every stage, and only out-damages
  // his at stage 3 — where it should, because by then she is him with a stick.
  punches: [
    { name: 'Sweep', dmg: 6, startup: 6, active: 3, recovery: 12, reach: 1.80, kb: 1.7, kbY: 0, hitstun: 15, type: 'light', step: 1.7 },
    { name: 'Reverse', dmg: 8, startup: 7, active: 3, recovery: 14, reach: 1.85, kb: 2.3, kbY: 0, hitstun: 17, type: 'light', step: 1.7 },
    { name: 'Rising Cut', dmg: 13, startup: 11, active: 4, recovery: 21, reach: 1.90, kb: 3.6, kbY: 7.8, hitstun: 27, type: 'launcher', step: 1.9 }
  ],

  heavy: {
    name: 'Overhead', dmg: 16, startup: 17, active: 5, recovery: 29,
    reach: 2.05, kb: 5.6, hitstun: 31, step: 2.3, staminaCost: 20, clip: 'heavy'
  },

  // ---- GUARD AND DASH -----------------------------------------------------
  // Average at base, strong when awakened — the stage table's `block` and
  // `dash` columns do the scaling. `dashIFrames` here is the BASE of zero:
  // at stage 0 her dash has no invulnerability at all, which is a real and
  // deliberate weakness, and at stage 3 it has Toji's seven.
  blockStaminaMult: 0.80,
  blockChipMult: 1.00,
  dashIFrames: 0,

  // =========================================================================
  // THE AWAKENING METER
  // =========================================================================
  // Read by combat/awakening.js and by ui/hud.js. Deliberately shaped like
  // the project's other second resources (`charge`, `blood`, `throat`,
  // `essence`) so the HUD row and the reset path are the ones that already
  // exist rather than a fourth near-duplicate.
  awakening: {
    max: 100,
    stages: MAKI_STAGES,
    // THE GATES. See the header for why the first is early and the last is a
    // whole round.
    thresholds: [28, 60, 100],

    // ---- HOW IT FILLS ----------------------------------------------------
    // TWO SOURCES, and the ratio between them is the character.
    //
    // DEALING damage pays 0.55 per point. TAKING damage pays 0.80 per point —
    // NOTABLY MORE. That inversion is the whole design statement: she is
    // built by the fight happening TO her, and a Maki who is losing the
    // neutral is climbing faster than one who is winning it. It is also what
    // stops her being a snowball: a player who is already ahead gets to stage
    // 3 slowest.
    gainOnDeal: 0.55,
    gainOnTake: 0.80,
    // flat grants for the events that are not damage
    gainOnBlock: 0.9,        // holding a guard through a hit is being in the fight
    gainOnKnockdown: 4.0,    // getting put on the floor is REALLY being in it
    gainOnLand: 1.6,         // a technique connecting
    // ---- AND IT NEVER GOES DOWN -----------------------------------------
    // No decay, no reset on stage-up, no loss on knockdown. Stated as a flag
    // rather than an absence so that a future reader knows it is a decision.
    decay: 0,
    resetOnStage: false,
    // ---- NOR DOES IT HEAL ------------------------------------------------
    // Explicit, because "you got stronger" implies "you got better" and it
    // does not. Reaching a stage restores nothing.
    healOnStage: 0
  },

  // =========================================================================
  // THE TWO WEAPONS — B, and it is a TOGGLE, not a wheel
  // =========================================================================
  // The deliberate contrast with Toji's four-weapon radial. She carries two
  // tools and swaps between them; there is no ring, no time dilation, no
  // stick selection and no `maxHold`. One button, two states.
  //
  // The shape below reuses his `arsenal` KEY so that fighter.equipped,
  // fighter._clip's per-weapon idle lookup and hud's arsenal row all work
  // unchanged — but with `toggle: true` and a two-entry `order`, which is what
  // combat/fighter.js branches on to run the swap instead of opening a wheel.
  arsenal: {
    toggle: true,
    default: 'playful_cloud',
    order: ['playful_cloud', 'split_soul'],
    // FASTER THAN HIS, AND STILL PUNISHABLE. 22 frames against his 26,
    // because she is moving something she is already wearing rather than
    // reaching into a curse — but the guard-cancel window is the same 4
    // frames, so a mistimed swap costs the same combo it costs him.
    swapFrames: 22,
    swapGuardCancel: 4,
    cooldown: 0.7,
    weapons: {
      // ---------------------------------------------------------------------
      // PLAYFUL CLOUD 游雲 — inherited, and it is his model. See the note in
      // art/models/maki.js: the prop is buildPlayfulCloud from
      // art/models/toji_weapons.js, imported unchanged.
      // ---------------------------------------------------------------------
      playful_cloud: {
        name: 'PLAYFUL CLOUD', short: 'CLOUD', jp: '游雲', clipSuffix: 'Cloud',
        desc: 'BLUNT · WIDE ARCS · GUARD PRESSURE',
        ct1: {
          // THE SWEEP — two committed level arcs she steps into, where his
          // Cloud Cyclone is a spin around himself. Same weapon, different
          // intent, and the frame data says so: hers is slower to start, has
          // a longer active window and covers a wider arc in front rather
          // than a circle around.
          name: 'Playful Cloud Sweep', cost: 0, startup: 14, active: 18, recovery: 24,
          effect: 'maki_cloud_sweep', dmg: 8, hits: 2, reach: 3.1, arc: 2.4,
          kb: 3.0, kbY: 0.3, hitstun: 18, guardDamage: 22, clip: 'ct1Cloud'
        },
        ct2: {
          // THE OVERHEAD. Real guard pressure — it breaks a guard outright,
          // which is what the "guard pressure" in the descriptor means. Slow,
          // and the recovery is a full punish on whiff.
          name: 'Crushing Arc', cost: 0, startup: 21, active: 5, recovery: 32,
          effect: 'maki_cloud_crush', dmg: 19, reach: 2.6, arc: 1.5,
          kb: 5.4, kbY: 0, hitstun: 32, guardBreak: true, step: 2.0,
          destruct: 42, clip: 'ct2Cloud'
        }
      },
      // ---------------------------------------------------------------------
      // SPLIT SOUL KATANA 釈魂刀 — also his model, also unchanged.
      // ---------------------------------------------------------------------
      split_soul: {
        name: 'SPLIT SOUL KATANA', short: 'KATANA', jp: '釈魂刀', clipSuffix: 'Soul',
        desc: 'SOUL CUT · IGNORES GUARD · DAMAGE DEBUFF',
        ct1: {
          // THE STRING — three cuts on one breath. Faster than his two-hit
          // Slashing String and each hit is weaker; the total is close, and
          // the extra hit is what makes it better at confirming into the
          // launcher and worse at trading.
          name: 'Slashing String', cost: 0, startup: 8, active: 16, recovery: 21,
          effect: 'maki_soul_string', dmg: 5, hits: 3, reach: 2.5, arc: 1.8,
          kb: 1.9, kbY: 0, hitstun: 15, clip: 'ct1Soul'
        },
        // ---- SPLIT SOUL STRIKE ---------------------------------------------
        // Her signature technique and the one the brief names. Unblockable,
        // and it leaves a DAMAGE-REDUCTION debuff — note that this is the
        // OTHER debuff from Toji's Soul Cut, deliberately: his cuts their
        // damage OUTPUT (`dmgMult`), hers cuts their damage RESISTANCE, so
        // they take more. Same weapon, same fiction, opposite direction, and
        // the two do not stack into anything degenerate because they touch
        // different multipliers.
        //
        // FRAME DATA vs HIS SOUL CUT (16/5/28, dmg 13):
        //   hers is 19/4/34 for 15 — slower on both ends and hits harder. She
        //   commits more and gets more, which is the whole difference between
        //   the two characters expressed in one move.
        ct2: {
          name: 'SPLIT SOUL STRIKE', cost: 0, startup: 19, active: 4, recovery: 34,
          effect: 'maki_split_soul', dmg: 15, reach: 2.8, arc: 1.5,
          kb: 2.6, kbY: 0, hitstun: 26, unblockable: true, clip: 'ct2Soul',
          debuff: { duration: 8, incomingMult: 1.22 }
        }
      }
    }
  },

  // =========================================================================
  // B — THE WEAPON SWAP
  // =========================================================================
  // Costs nothing, because she has nothing to spend. The cooldown exists only
  // to stop swap-mashing, and the vulnerable window is `arsenal.swapFrames`.
  special: {
    key: 'maki_swap', name: 'WEAPON SWAP', jp: '換装',
    cost: 0, cooldown: 0.7, clip: 'swap'
  },

  // =========================================================================
  // D-PAD RIGHT — GATED ON AWAKENING, NOT ON A METER
  // =========================================================================
  // She has no cursed energy, so `fighter.ultReady` is false for her forever
  // and there is no standard gate to reach. Rather than special-casing that
  // getter — which would have touched Toji's path — this declares a NEW
  // ultimate kind, `awakening`, the same way his config declares `cooldown`.
  // Nothing else on the roster uses it, so the four existing kinds ('domain',
  // 'burst', 'transform', 'cooldown') are untouched.
  //
  // THE GATE IS THE POINT. It is unavailable for most of the round and the
  // HUD says so explicitly (see ui/hud.js — the awakening row's final tick
  // carries the ULT badge), so the player spends the whole match climbing
  // toward one button. That is what makes the meter feel like a goal rather
  // than a passive buff.
  //
  // ONCE PER ROUND, plus a cooldown that in practice never matters because
  // the round usually ends first. `uses: 1` is the real limit.
  ultimate: {
    kind: 'awakening', name: 'BEYOND THE ZENIN', jpName: '禪院を超えて',
    requireStage: 3,       // maximum awakening or nothing
    uses: 1,               // once per round
    cooldown: 30,
    // NON-DOMAIN STARTUP — the faster, lower-commitment startup every
    // non-domain ultimate in this game already uses. She has no domain and is
    // canon-correct not to.
    startup: 16,
    effect: 'maki_beyond',
    // the assault: alternating weapons, six strikes, then both at once
    sequence: [
      { weapon: 'playful_cloud', dmg: 11, at: 0.28 },
      { weapon: 'split_soul', dmg: 12, at: 0.36, unblockable: true },
      { weapon: 'playful_cloud', dmg: 11, at: 0.43 },
      { weapon: 'split_soul', dmg: 13, at: 0.51, unblockable: true },
      { weapon: 'playful_cloud', dmg: 12, at: 0.59 },
      { weapon: 'both', dmg: 30, at: 0.70, unblockable: true, knockdown: true }
    ],
    reach: 3.0, arc: 1.6,
    // the sequence runs across the ACTIVE window; `startUltBurst` builds the
    // state from these three, so they are the real length of the move
    active: 90, recovery: 34,
    whiffRecovery: 34,
    destruct: 70,
    clip: 'ult'
  },

  // NO DOMAIN, and canon-correct: she does not have one.
  domain: null,
  noUltimate: false,

  // ---- interactions, all inherited from the no-CE handling ---------------
  // Both of these are Toji's values and they are his for his reasons: Simple
  // Domain and Barrier Break both channel cursed energy, and she has none.
  // `null` on the break is the refusal; the drain is inert.
  simpleDomainDrain: 0,
  barrierBreak: null,

  // WHAT YUTA'S COPY GETS. Same ruling Toji already gets and for the same
  // reason: a cursed technique is not what she has, so Copy stores the WEAPON.
  // Hers gives the katana rather than the spear, which keeps the two Heavenly
  // Restrictions from handing Yuta the same thing.
  copyEffect: { effect: 'maki_soul_string', dmg: 6, name: 'Copied: Cursed Tool' }
});
