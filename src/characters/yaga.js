// YAGA MASAMICHI 夜蛾正道 — THE BUILDER.
//
// Every other summoner in this game spends a resource and receives a fixed
// creature. Megumi pays cursed energy and gets a Divine Dog. Geto pays and gets
// the curse he bound. Mahito pays and gets a transfigured human. Dagon pays and
// gets whatever the aim stick asked for. All of them are TRANSACTIONS.
//
// Yaga is not a transaction. He spends TIME UNDER PRESSURE and receives
// WHATEVER HE MANAGED TO FINISH. The corpse that walks off his hands is a
// direct readout of how long the opponent left him alone, and that is the whole
// character: the summon is not the reward for paying a cost, it is the RECORD
// of an argument he had with the other player about whether he was allowed to
// work.
//
// ===========================================================================
// RESEARCH (2026-08-20, web) — AND WHAT IT SAYS ABOUT THE TECHNIQUE'S RULES
// ===========================================================================
// Sources: CBR "Masamichi Yaga's Unique Cursed Corpse Technique, Explained";
// Looper's explainer; Gamerant's "Masamichi Yaga's Cursed Technique,
// Explained"; the ORICON profile; FandomWire. (jujutsu-kaisen.fandom.com is
// blocked from this session's proxy — noted in the delivery report rather than
// papered over.)
//
//   · THE TECHNIQUE IS AUTHORSHIP, NOT SUMMONING. He does not call something
//     that already exists somewhere else. He BUILDS an object and puts
//     information into it: "a person's physical information" is used "to
//     replicate their soul information and place it into a Cursed Corpse."
//     That is a manufacturing process with an input, a duration and a quality
//     — which is precisely why the mechanic below is a HOLD with a meter and
//     not a button that spawns a thing. The mechanic is the technique.
//
//   · A NORMAL CURSED CORPSE IS AN OBJECT. Quoted: "usually an inanimate
//     object that is programmed to complete a set list of given tasks and
//     lacks self-awareness or its own cursed energy." Two hard consequences,
//     both implemented:
//       - IT RUNS OFF HIS ENERGY, NOT ITS OWN. So construction bills
//         CURRENT_CE continuously (`ceDrain` below) rather than charging a
//         lump sum at the end, and a corpse's lifespan is finite by nature.
//       - IT IS PROGRAMMED, so its AI is a short task list rather than a
//         personality. See combat/construction.js: the corpses do not
//         improvise, they execute, and COMMAND (RB) overwrites the list.
//
//   · THEY FEEL NO PAIN AND DO NOT FLINCH. Quoted advantage over living
//     beings: they "feel no pain or fear, and do not flinch when struck."
//     Implemented literally — every tier above SCRAP carries `noFlinch`, so
//     hitting a corpse does not interrupt what it was doing. This is the single
//     most important thing about fighting one and it is canon rather than a
//     balance invention.
//
//   · PANDA IS THE OUTLIER, AND THE BRIEF ASKED WHAT THAT IMPLIES. He was made
//     by putting THREE compatible souls into one core so each could observe
//     the others and stabilise; after three months the corpse began producing
//     ITS OWN cursed energy and stopped feeding off Yaga's. So Panda is not
//     "a really good version of what B builds" — he is the result of a
//     MONTHS-LONG process that ends in independence, and independence is
//     exactly what a mid-fight corpse can never have.
//     THAT IS THE CEILING RULE FOR THIS WHOLE CHARACTER, and it is why even a
//     MASTERWORK expires: nothing built inside a two-minute round has had three
//     months to stabilise, so everything he makes here stays on his meter and
//     stays on a clock. Panda is in the roster as a FIGHTER, not as something
//     Yaga can produce, and that is the canon-correct separation.
//     (See `pandaNod` at the bottom for the one small acknowledgement.)
//
//   · THE HIGHER-UPS NEARLY PROMOTED HIM TO SPECIAL GRADE AND RESTRICTED HIM,
//     because a man who can make sentient corpses can raise an army that needs
//     no supply line. That is the fantasy the ultimate cashes: MASTERPIECE is
//     the one time in a round he gets to skip the risk entirely.
//
// CANON-CORRECT: NO DOMAIN EXPANSION. He has never been shown with one and the
// brief is explicit. D-pad Right is a burst ultimate on the standard gate,
// sitting with Nanami, Yuji, Todo, Toji, Hanami, Kurourushi, Choso, Nobara,
// Geto, Naoya, Kashimo, Panda, Inumaki, Maki, Yuki and Miwa.
//
// ===========================================================================
// THE SHAPE OF HIM, IN NUMBERS
// ===========================================================================
//   hp 134        the highest single pool in the game (Dagon 132, Todo 126)
//   runSpeed 4.25 second slowest fighter after Dagon's 3.90
//   damageScale 1.12  above average, because his hands have to be a real
//                 threat or nobody would ever have to respect the space he
//                 makes for himself
//   armor on punch 1  the only character with armour on the FIRST hit of the
//                 string. It is what lets him contest a rushdown at all.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE FOUR TIERS
// ---------------------------------------------------------------------------
// `at` is the fraction of the construction meter the tier needs. Release below
// `scrap.at` and nothing is produced at all — he wasted the time, which is the
// floor of the risk.
//
// Read ACROSS the rows. Every number was chosen against the tier above and
// below rather than in isolation, and the curve is deliberately CONVEX: the
// step from SCRAP to STANDARD is large, STANDARD to REFINED is moderate, and
// REFINED to MASTERWORK is large again. A player who gets interrupted at 60%
// has still got most of what patience was going to buy them; a player who is
// left completely alone gets something that changes the round.
//
//                    SCRAP    STANDARD   REFINED   MASTERWORK
//   meter needed     25%      50%        75%       100%
//   build time       1.6s     3.2s       4.8s      6.4s
//   CE spent         12       24         36        48
//   hp               18       46         74        128
//   swipe damage     3.0      7.5        10.5      15.0
//   lifespan         7s       15s        22s       34s
//   move speed       2.6      3.8        5.0       5.6
//   flinches?        yes      no         no        no
//   extra attack     —        —          LUNGE     LUNGE + SLAM
export const CORPSE_TIERS = [
  // ---- SCRAP 屑骸 --------------------------------------------------------
  // Barely held together and it looks it: mismatched limb lengths, a lashed
  // torso, one arm shorter than the other, a head that is not on straight.
  // It is worth building — three seconds of a body between him and the
  // opponent is three seconds — but it is not worth PROTECTING.
  {
    key: 'scrap', name: 'SCRAP CORPSE', jp: '屑骸', short: 'SCRAP', at: 0.25,
    hp: 18, dmg: 3.0, hitstun: 10, kb: 0.8, speed: 2.6, reach: 1.25,
    swingEvery: 1.5, life: 7, emergeTime: 0.5, height: 1.42,
    noFlinch: false, color: 0x6a6154, accent: 0x8a7a5e,
    desc: 'FRAGILE · SLOW · BUYS A SECOND'
  },
  // ---- STANDARD 呪骸 -----------------------------------------------------
  // A functional cursed corpse and his bread and butter. Symmetrical, sealed,
  // finished at the joints. It does not flinch. This is the tier the design is
  // balanced around and the tier a competent opponent should be conceding.
  {
    key: 'standard', name: 'CURSED CORPSE', jp: '呪骸', short: 'CORPSE', at: 0.50,
    hp: 46, dmg: 7.5, hitstun: 20, kb: 2.4, speed: 3.8, reach: 1.55,
    swingEvery: 1.15, life: 15, emergeTime: 0.7, height: 1.72,
    noFlinch: true, color: 0x7d7263, accent: 0xb59a68,
    desc: 'SOLID · NO FLINCH · THE BASELINE'
  },
  // ---- REFINED 精骸 ------------------------------------------------------
  // Noticeably better made and noticeably faster, with a LUNGE in its
  // repertoire: it closes distance on its own instead of walking. Reaching
  // this means the opponent gave him about five uninterrupted seconds, which
  // is already a mistake.
  {
    key: 'refined', name: 'REFINED CORPSE', jp: '精骸', short: 'REFINED', at: 0.75,
    hp: 74, dmg: 10.5, hitstun: 26, kb: 3.4, speed: 5.0, reach: 1.72,
    swingEvery: 0.95, life: 22, emergeTime: 0.85, height: 1.88,
    noFlinch: true, color: 0x8a7c66, accent: 0xd8c08a,
    lunge: { every: 4.2, range: 7.5, speed: 12.5, dmg: 13, kb: 4.5, hitstun: 28 },
    desc: 'FAST · LUNGES · GENUINELY ANNOYING'
  },
  // ---- MASTERWORK 傑作 ---------------------------------------------------
  // A finished object. Deliberate proportions, clean seams, a sealed core that
  // glows through the chest plate, and a GUARD SLAM that puts a fighter on the
  // floor. Its own special behaviour is the BODY BLOCK: it interposes itself
  // between Yaga and the opponent on its own initiative, which is what turns
  // "he has a summon" into "he has a bodyguard".
  //
  // Reaching it costs 6.4 uninterrupted seconds and 48 CURRENT_CE. Nobody
  // should ever allow it. Landing one means they made a mistake, and that is
  // the point of putting it on the end of the meter rather than on a button.
  {
    key: 'masterwork', name: 'MASTERWORK', jp: '傑作', short: 'MASTER', at: 1.0,
    hp: 128, dmg: 15.0, hitstun: 32, kb: 5.0, speed: 5.6, reach: 1.95,
    swingEvery: 0.85, life: 34, emergeTime: 1.05, height: 2.16,
    noFlinch: true, color: 0x968a72, accent: 0xf0dca8,
    lunge: { every: 3.6, range: 9.0, speed: 14.0, dmg: 18, kb: 5.5, hitstun: 30 },
    slam: { every: 6.5, range: 2.4, dmg: 24, kb: 6.5, hitstun: 36, knockdown: true },
    guardFor: true,             // it puts itself on the line for him
    desc: 'HEAVY · LUNGES · SLAMS · BODYGUARDS'
  }
];

export const YAGA = withDefaults({
  id: 'yaga', name: 'YAGA', title: 'PRINCIPAL — CURSED CORPSES',
  stats: {
    hp: 134, walkSpeed: 2.15, runSpeed: 4.25, dashSpeed: 7.10, jumpVel: 8.2,
    startMaxCE: 40, ceRegen: 2.8, ceGainPerPunch: 6.6,
    stamina: 110, staminaRegen: 20, dashDrain: 30, damageScale: 1.12
  },
  size: {
    height: 1.99, bodyRadius: 0.33, pushRadius: 0.54,
    hurtRadius: 0.66, hurtHeight: 1.70, hurtCenter: 1.14, hurtPad: 0.14
  },
  kbResist: 0.80,

  // ---- X — THE STRING ------------------------------------------------------
  // Heavy, slow, long, and it hurts. ARMOUR ON THE FIRST HIT is the load-
  // bearing number of the whole character: without it he cannot contest a
  // rushdown at all, and a builder who cannot contest a rushdown never builds.
  // It is only on hit 1 — the string as a whole is still punishable, so the
  // answer to him is to bait it and hit the recovery, not to stop pressing.
  punches: [
    { name: 'Hook', dmg: 6.5, startup: 9, active: 3, recovery: 17, reach: 1.62, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 1.5, armorFrames: 9 },
    { name: 'Cross', dmg: 7.5, startup: 10, active: 3, recovery: 19, reach: 1.70, kb: 2.8, kbY: 0, hitstun: 18, type: 'light', step: 1.5 },
    { name: 'Uppercut', dmg: 12.0, startup: 13, active: 4, recovery: 24, reach: 1.74, kb: 4.0, kbY: 8.2, hitstun: 28, type: 'launcher', step: 1.9 }
  ],
  heavy: {
    name: 'Shoulder Drive', dmg: 17, startup: 19, active: 5, recovery: 31,
    reach: 1.98, kb: 6.2, kbY: 0, hitstun: 32, step: 2.6,
    staminaCost: 22, armorFrames: 12, ceGain: 1.7, clip: 'heavy'
  },

  // ---- RB (CT1) — COMMAND ---------------------------------------------------
  // THE FURTHEST-REACHING TECHNIQUE OF THE PAIR, by an enormous margin: it
  // reaches every corpse on the field wherever they are, which is the whole
  // arena. The slot convention (schema.js) holds without an excuse.
  //
  // It is FREE, and that is deliberate rather than generous. What it costs is
  // 22 frames of him standing still pointing at something, which against a
  // competent opponent is a genuine price — and if he has nothing built it
  // does nothing at all, so pressing it is an admission.
  ct1: {
    name: 'Command', jpName: '指令', cost: 0,
    startup: 12, active: 1, recovery: 22,
    effect: 'yaga_command', clip: 'ct1',
    // How long the overridden task list runs before the corpses fall back to
    // their own programming. Long enough to matter, short enough that COMMAND
    // is a tool rather than a mode.
    duration: 4.0,
    // A commanded corpse is faster and hits harder — he is spending his own
    // attention on it, which is the fiction and the mechanic at once.
    speedMult: 1.35, dmgMult: 1.20,
    aimRange: 40
  },

  // ---- RT (CT2) — HAYMAKER --------------------------------------------------
  // THE STRONGEST TECHNIQUE OF THE PAIR. One committed blow, enormous damage,
  // a hard knockdown, and it is how he manufactures the four seconds he needs.
  // The recovery is brutal on a whiff, which is what stops it being a button he
  // presses to open every round.
  ct2: {
    name: 'Haymaker', jpName: '大振り', cost: 26,
    startup: 26, active: 5, recovery: 38,
    effect: 'yaga_haymaker', clip: 'ct2',
    dmg: 34, reach: 2.30, arc: 1.9, kb: 8.5, kbY: 2.0, hitstun: 40,
    type: 'knockdown', armorFrames: 14, step: 3.2, destruct: 60,
    // it shatters a held guard outright — the space has to be real
    guardBreak: true
  },

  // ---- B — CONSTRUCTION -----------------------------------------------------
  // HOLD. The meter fills; release deploys whatever tier it reached. Everything
  // about how this behaves lives in combat/construction.js; this is the data.
  special: {
    key: 'yaga_build', name: 'CONSTRUCT', jp: '呪骸製作', clip: 'build',
    // Held cost, not an up-front one. A corpse that runs off his energy has to
    // be paid for while it is being made — see the research note above.
    cost: 0, ceDrain: 7.5, cooldown: 0.9,
    // seconds of uninterrupted work to fill the meter completely
    buildTime: 6.4,
    // he can still shuffle, at a third of his walk speed. He cannot attack,
    // block, dash or jump.
    moveMult: 0.34,
    // ---- WHAT BEING HIT COSTS ---------------------------------------------
    // The single most important table in the character. A light hit is a
    // setback; a heavy hit or a knockdown is the end of the attempt.
    hitLoss: {
      light: 0.22,        // fraction of the FULL meter removed per light hit
      heavy: 1.0,         // a heavy / knockdown / launcher destroys it outright
      chip: 0.06          // a tick of damage-over-time or a sure-hit domain tick
    },
    // Cancel out and the progress SITS for `holdAfterCancel` seconds before it
    // starts bleeding away at `decayRate` of the bar per second. That window is
    // what makes "build in two bites around their pressure" a real gameplan
    // rather than an all-or-nothing hold.
    holdAfterCancel: 3.0, decayRate: 0.42,
    // ---- THE CAP ------------------------------------------------------------
    // TWO AT ONCE, AND A THIRD IS *BLOCKED* RATHER THAN REPLACING THE OLDEST.
    // Picking one, as the brief asks: BLOCKED.
    // The reason is that the whole character is about the value of work already
    // done, and a rule that quietly destroys finished work to make room for
    // worse work contradicts it — a Yaga who has two MASTERWORKS out and
    // accidentally holds B should not delete one. Blocking also gives the
    // OPPONENT something to do: killing a corpse is not just removing a body,
    // it is unlocking his B button, which turns every corpse on the field into
    // a decision for them.
    // He is told, loudly, rather than silently refused — see match.js
    // `constructCapped`.
    maxCorpses: 2,
    tiers: CORPSE_TIERS
  },

  // ---- D-pad Right — MASTERPIECE -------------------------------------------
  // Non-domain, standard gate (MAX_CE 100 + full CURRENT_CE), full bar cost,
  // standard backlash — identical to every other burst ultimate in the game.
  // 34-frame startup, which sits in the non-domain band (Nanami 30, Kashimo 34,
  // Geto 36) rather than in the domain band (44-70).
  //
  // What it buys is the ONE THING the character otherwise cannot have: a
  // MASTERWORK without the 6.4 seconds. It does not bypass the cap — if two
  // corpses are already out, the oldest is dismissed by his own hand (an
  // ultimate is allowed to clear his own bench; a B press is not).
  ultimate: {
    kind: 'burst', name: 'MASTERPIECE', jpName: '傑作呪骸',
    startup: 34, active: 1, recovery: 30,
    effect: 'yaga_masterpiece', clip: 'ult',
    tier: 'masterwork',
    // The ultimate's corpse is bigger and lasts longer than a hand-built
    // MASTERWORK — it is a full bar, so it has to beat the thing you can get
    // for free by being patient.
    scale: 1.18, lifeMult: 1.5, hpMult: 1.25, dmgMult: 1.15
  },

  domain: null, // canon-correct: Yaga has no Domain Expansion

  // A big man with a good guard who is slow to raise it — the guard matches
  // the character: he is not fast, he is IMMOVABLE once he is set.
  blockChipMult: 0.74, blockStaminaMult: 0.80, blockStartupFrames: 5,
  simpleDomainDrain: 21,
  barrierBreak: { ceDrain: 28, chip: 26 },

  // ---- YUTA'S COPY ----------------------------------------------------------
  // What he stores off Yaga is the HAYMAKER, not the construction. Copy is a
  // snapshot of a technique's OUTPUT, and construction has no output at the
  // moment of copying — it has a process. Yuta borrowing a six-second hold that
  // he has no meter for and no corpse system behind would be the worst entry in
  // the copy table by a distance. See the audit in the delivery report.
  copyEffect: { effect: 'yaga_haymaker', dmg: 20, name: 'Copied: Haymaker' },

  // ---- THE PANDA NOD --------------------------------------------------------
  // Cheap, as the brief requires: one extra taunt line, selected by the
  // opponent's pick, resolved in combat/taunts.js by a lookup that already
  // existed for variants. No intro system, no new state, no new asset.
  pandaNod: {
    vs: 'panda',
    say: 'You still owe me an essay.',
    ref: 'Panda is one of his cursed corpses and a student at his school; he is the headmaster who has to grade him.'
  }
});
