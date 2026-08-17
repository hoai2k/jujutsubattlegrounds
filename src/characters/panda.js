// PANDA — 呪骸. THE STANCE CHARACTER, and the only multi-pool health bar in
// the game.
//
// THREE CURSED CORES, THREE FIGHTERS, ONE BODY. He switches between them
// mid-fight and each one is a genuinely different character with its own frame
// data, its own two techniques, its own guard and its own movement. Nothing
// else in the roster does this: Toji swaps WEAPONS (his punches, his heavy, his
// guard and his special are constant across all four), Hakari swaps a MOVESET
// once for 99 seconds, Megumi and Geto swap SUMMONS. Panda swaps who he is.
//
// CANON, AS RESEARCHED (2026-08-13; sources listed in art/models/panda.js and
// in the delivery notes) — AND WHAT THE RESEARCH CORRECTED IN THE BRIEF:
//
//   · THE THIRD CORE IS A TRICERATOPS, and it is the SISTER. The brief asked
//     me to research it and said to build it as a mobility stance if the
//     source did not specify enough. The source specifies the identity
//     precisely — Panda's three cores are, in his own framing, an older sister
//     (Triceratops), a middle brother (Gorilla) and a baby brother (Panda) —
//     but it says almost nothing about how the sister FIGHTS: the form has
//     never been shown doing anything, and the only line about it is a joke.
//     What canon DOES give is the BODY: switching to it makes him "more
//     slender", and his head takes on a wide Triceratops shape.
//     So I built the brief's fallback — the MOBILITY STANCE — and the reason
//     it is not a cop-out is that the two answers agree: a slender body is a
//     fast body, and the horn and frill give a fast character a gore-charge
//     and a guard that are both distinctly hers rather than generically quick.
//     Reported in full in the delivery notes, as asked.
//
//   · GORILLA'S SIGNATURE IS NAMED, AND IT IS EXACTLY THE BRIEF'S ASK. The
//     brief specified "a guard-breaking overhead"; canon has the UNBLOCKABLE
//     DRUMMING BEAT — a strike whose impact resonates THROUGH the target's
//     guard so they take it even while blocking. That is better than a guard
//     break (which the game already has, on Nanami's 7:3 and on stamina
//     depletion) and it is his, by name. It is CT1 below.
//     Canon also states Gorilla Mode "rapidly drains cursed energy", which is
//     implemented literally: `ceDrain` on the stance, ticked in the fighter.
//
//   · THE BALANCED CORE has no special technique at all in canon; what it has
//     is high cursed energy and intelligence. So it is the complete,
//     unremarkable, fully functional fighter the brief asks for, and its
//     techniques are cursed-energy applications rather than a bloodline trick.
//
// CANON-CORRECT: NO DOMAIN EXPANSION. He is a cursed corpse; the question does
// not arise. D-pad Right is a burst ultimate on the standard gate.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE THREE STANCES
// ---------------------------------------------------------------------------
// Each is a complete fighter. Read across the rows rather than down the
// columns — the design is in the CONTRASTS, and every number below was chosen
// against the other two rather than in isolation:
//
//                      PANDA          GORILLA         TRICERATOPS
//   run speed          5.00           4.00            6.30
//   dash speed         8.40           6.40            10.20
//   damage scale       1.00           1.30            0.80
//   jab startup        7f             10f             5f
//   jab recovery       13f            20f             10f
//   launcher startup   11f            15f             8f
//   armour on normals  none           8 / 8 / 12f     none
//   block chip mult    0.85 (good)    0.70 (best)     1.30 (poor)
//   dash i-frames      0              0               8
//   CE drain           none           14/s            none
//
// The shape that falls out: BALANCED wins neutral, GORILLA wins the punish,
// TRICERATOPS wins the escape — and each of them LOSES the other two roles
// badly enough that living in one is never right.
const STANCES = {
  // ---- 1 · PANDA — THE BALANCED CORE 熊猫核 -------------------------------
  // Average everything, and that is the design rather than a shrug. His
  // numbers are within a few percent of the roster norm in every category, his
  // guard is slightly better than average, and he has no projectile — a
  // complete mid-range fighter with no hole in it and no spike either. If a
  // player never swapped they would have an entirely serviceable character,
  // which is exactly what "a complete, unremarkable, fully functional fighter"
  // has to mean.
  panda: {
    name: 'PANDA', jp: '熊猫核', short: 'PAN', clipSuffix: '',
    stats: { walkSpeed: 2.60, runSpeed: 5.00, dashSpeed: 8.40, damageScale: 1.00, dashDrain: 26 },
    punches: [
      { name: 'Paw Jab', dmg: 4.4, startup: 7, active: 3, recovery: 13, reach: 1.55, kb: 1.7, kbY: 0, hitstun: 15, type: 'light', step: 1.7, src: 'panda_core' },
      { name: 'Paw Cross', dmg: 5.2, startup: 8, active: 3, recovery: 15, reach: 1.62, kb: 2.3, kbY: 0, hitstun: 17, type: 'light', step: 1.7, src: 'panda_core' },
      { name: 'Double Palm', dmg: 8.6, startup: 11, active: 4, recovery: 21, reach: 1.70, kb: 3.8, kbY: 7.8, hitstun: 27, type: 'launcher', step: 2.1, src: 'panda_core' }
    ],
    heavy: {
      name: 'Body Check', dmg: 15, startup: 17, active: 5, recovery: 28,
      reach: 1.95, kb: 6.0, kbY: 0, hitstun: 30, step: 2.5,
      staminaCost: 20, armorFrames: 6, ceGain: 1.6, clip: 'heavy', src: 'panda_core'
    },
    // STILL NO PROJECTILE — the QUAKE PALM never leaves the ground: the palm
    // goes into the FLOOR and the floor carries it, a rupture front of
    // thrown turf running 6.5 m down the lane (stick-steered) that pops
    // whoever it reaches into the air. Ground-game ranged control, which is
    // the only kind the brief allows him.
    ct1: {
      name: 'Quake Palm', jpName: '震掌', cost: 18,
      startup: 14, active: 4, recovery: 22,
      effect: 'panda_palm', clip: 'ct1',
      dmg: 13, range: 6.5, speed: 12, radius: 1.5,
      kb: 3.5, kbY: 6.5, hitstun: 26, src: 'panda_core'
    },
    // A forward roll that ends in a body press. His gap closer and his only
    // real mobility outside the dash — and it is deliberately mediocre,
    // because a balanced stance with a great approach would not be balanced.
    ct2: {
      name: 'Rolling Press', jpName: '転身圧', cost: 22,
      startup: 16, active: 6, recovery: 28,
      effect: 'panda_roll', clip: 'ct2',
      dmg: 16, reach: 2.0, travel: 5.2, kb: 5.0, kbY: 1.2, hitstun: 28, type: 'heavy', src: 'panda_core'
    },
    blockChipMult: 0.85, blockStaminaMult: 0.90, blockStartupFrames: 2,
    dashIFrames: 0
  },

  // ---- 2 · GORILLA — THE BROTHER'S CORE 猩々核 ----------------------------
  // THE PUNISH STANCE. The best raw output in the game after Sukuna's, armour
  // on every normal, and a technique that cannot be blocked — bought with the
  // worst mobility on the roster (4.00 run is below Todo's 4.60 and Hanami's
  // 4.30), the longest recovery frames of any stance in the game, and a cursed
  // energy bill that runs whether he is doing anything or not.
  //
  // THE CE DRAIN IS THE REAL LIMITER and it is canon: "much stronger and faster
  // in this form but at the cost of rapidly draining his cursed energy". At
  // 14/s against a 2.4/s regen he is net -11.6/s, so a full bar buys about
  // eight and a half seconds of Gorilla and then he is out of techniques
  // entirely. Sitting in Gorilla is not a strategy, it is a countdown.
  gorilla: {
    name: 'GORILLA', jp: '猩々核', short: 'GOR', clipSuffix: 'Gor',
    stats: { walkSpeed: 2.10, runSpeed: 4.00, dashSpeed: 6.40, damageScale: 1.30, dashDrain: 36 },
    ceDrain: 14,
    punches: [
      { name: 'Hammer Down', dmg: 6.4, startup: 10, active: 4, recovery: 20, reach: 1.80, kb: 3.0, kbY: 0, hitstun: 18, type: 'light', step: 1.6, armorFrames: 8, src: 'panda_gorilla' },
      { name: 'Back Fist', dmg: 7.6, startup: 11, active: 4, recovery: 22, reach: 1.88, kb: 3.6, kbY: 0, hitstun: 20, type: 'light', step: 1.6, armorFrames: 8, src: 'panda_gorilla' },
      { name: 'Uproot', dmg: 13.0, startup: 15, active: 5, recovery: 30, reach: 1.95, kb: 5.0, kbY: 8.8, hitstun: 30, type: 'launcher', step: 1.9, armorFrames: 12, src: 'panda_gorilla' }
    ],
    heavy: {
      name: 'Mountain Fist', dmg: 21, startup: 21, active: 5, recovery: 36,
      reach: 2.05, kb: 7.0, kbY: 0, hitstun: 34, step: 2.4,
      staminaCost: 26, armorFrames: 16, ceGain: 1.8, clip: 'heavyGor', src: 'panda_gorilla'
    },
    // ---- UNBLOCKABLE DRUMMING BEAT 不可視の連打 --------------------------
    // CANON, BY NAME. He beats his chest and the impact resonates THROUGH the
    // guard — a blocked Drumming Beat deals its damage in full. Implemented as
    // `unblockable` on the hit, which the existing pipeline already honours
    // (Todo's Vice Grab uses it), so nothing new was needed to express it.
    //
    // It is short-ranged and slow on purpose. An unblockable that also had
    // reach would have no counterplay at all; at 2.2 m and 20 frames the answer
    // is the same answer Gorilla always has — do not be there, he cannot chase.
    ct1: {
      name: 'Drumming Beat', jpName: '不可視の連打', cost: 24,
      startup: 20, active: 5, recovery: 26,
      effect: 'panda_drum', clip: 'ct1Gor',
      dmg: 19, radius: 2.20, kb: 5.5, kbY: 1.0, hitstun: 28,
      unblockable: true, src: 'panda_gorilla'
    },
    // The overhead. Enormous, slow, and it puts them on the floor.
    ct2: {
      name: 'Gorilla Slam', jpName: '猩々落', cost: 28,
      startup: 26, active: 5, recovery: 34,
      effect: 'panda_slam', clip: 'ct2Gor',
      dmg: 26, reach: 2.35, arc: 1.2, kb: 6.5, kbY: 0, hitstun: 34, type: 'knockdown',
      armorFrames: 14, destruct: 52, src: 'panda_gorilla'
    },
    // THE BEST GUARD IN THE GAME after Hanami's. He is a wall; he simply
    // cannot get to you.
    blockChipMult: 0.70, blockStaminaMult: 0.62, blockStartupFrames: 4,
    dashIFrames: 0
  },

  // ---- 3 · TRICERATOPS — THE SISTER'S CORE 三角竜核 -----------------------
  // THE MOBILITY STANCE. Fastest movement in his kit by a distance, the
  // fastest normals, an eight-frame invulnerable dash, and the lowest damage
  // on the roster outside Naoya's. She is how he LEAVES — and the reason she
  // is not simply a worse Kashimo is the CREST ROLL, which is the only
  // invulnerable evasive option any of his three stances owns.
  //
  // Canon gives the body ("more slender and feminine", a wide Triceratops
  // head) and nothing about the fighting, so the horn is where the invention
  // went: a gore charge that covers ground and a frill that she hides behind.
  trike: {
    name: 'TRICERATOPS', jp: '三角竜核', short: 'TRI', clipSuffix: 'Tri',
    stats: { walkSpeed: 3.10, runSpeed: 6.30, dashSpeed: 10.20, damageScale: 0.80, dashDrain: 20 },
    punches: [
      { name: 'Horn Jab', dmg: 3.4, startup: 5, active: 2, recovery: 10, reach: 1.70, kb: 1.3, kbY: 0, hitstun: 13, type: 'light', step: 1.9, src: 'panda_trike' },
      { name: 'Horn Hook', dmg: 3.9, startup: 6, active: 2, recovery: 11, reach: 1.76, kb: 1.7, kbY: 0, hitstun: 15, type: 'light', step: 1.9, src: 'panda_trike' },
      { name: 'Toss', dmg: 6.4, startup: 8, active: 3, recovery: 17, reach: 1.82, kb: 2.8, kbY: 8.2, hitstun: 25, type: 'launcher', step: 2.2, src: 'panda_trike' }
    ],
    heavy: {
      name: 'Crest Slam', dmg: 12, startup: 15, active: 5, recovery: 26,
      reach: 1.90, kb: 5.5, kbY: 0, hitstun: 30, step: 2.8,
      staminaCost: 16, armorFrames: 0, ceGain: 1.6, clip: 'heavyTri', src: 'panda_trike'
    },
    // GORE CHARGE — a long committed run-through with the horns down. Damage
    // is modest; what it buys is 7 m of ground and a body behind him.
    ct1: {
      name: 'Gore Charge', jpName: '突角突進', cost: 18,
      startup: 11, active: 14, recovery: 20,
      effect: 'panda_gore', clip: 'ct1Tri',
      dmg: 12, reach: 1.9, travel: 7.2, speed: 15, kb: 4.0, kbY: 1.0, hitstun: 22,
      destruct: 34, src: 'panda_trike'
    },
    // CREST ROLL — the evasive option, and the reason this stance exists. 14
    // invulnerable frames on a backward roll that leaves a light hit behind
    // it. It does not deal with pressure by beating it; it is not there.
    ct2: {
      name: 'Crest Roll', jpName: '襟盾転', cost: 16,
      startup: 6, active: 4, recovery: 18,
      effect: 'panda_crestroll', clip: 'ct2Tri',
      dmg: 7, radius: 1.6, kb: 2.5, kbY: 0, hitstun: 16,
      iFrames: 14, travel: 4.6, src: 'panda_trike'
    },
    // POOR GUARD, deliberately. Everything about this stance says "do not be
    // hit", and a fast stance that also blocked well would have no cost at all.
    blockChipMult: 1.30, blockStaminaMult: 1.30, blockStartupFrames: 3,
    dashIFrames: 8
  },

  // ---- 4 · ALL THREE AT ONCE — the ultimate's stance ----------------------
  // NOT SELECTABLE. `cores.order` does not contain it, so the swap cycle and
  // the radial can never reach it; the only door in is the ultimate's effect
  // handler, exactly as `SUMMONS` is the only door to Mahoraga.
  //
  // It is built as a REAL STANCE rather than as a pile of buffs because that
  // is the cheapest possible expression of "no stance restrictions": Gorilla's
  // damage, the Triceratops's speed and the balanced core's neutral are just
  // the numbers, and `_def`/`_punchSet` already route through the active
  // stance so every system reads them for free.
  //
  // RB is Gorilla's Drumming Beat and RT is the Triceratops's Gore Charge —
  // the two signature techniques, both available at once, which is what makes
  // the window feel like three characters rather than a stat boost.
  all: {
    name: 'THREE CORES', jp: '三核共鳴', short: 'ALL', clipSuffix: 'Gor',
    // 1.55 damage scale — HIGHER THAN GORILLA'S 1.30, and it has to be, because
    // the `byCores` multiplier below multiplies it. See the note on that field:
    // at 1.30 a one-core ultimate landed at 0.585 outgoing, which is HALF his
    // ordinary balanced-core damage. An ultimate that makes you worse is not a
    // weak ultimate, it is a bug wearing a design's clothes.
    stats: { walkSpeed: 3.00, runSpeed: 6.00, dashSpeed: 9.80, damageScale: 1.55, dashDrain: 18 },
    punches: [
      { name: 'Resonant Jab', dmg: 5.6, startup: 5, active: 3, recovery: 10, reach: 1.80, kb: 2.2, kbY: 0, hitstun: 15, type: 'light', step: 1.9, armorFrames: 6, src: 'panda_gorilla' },
      { name: 'Resonant Cross', dmg: 6.6, startup: 6, active: 3, recovery: 11, reach: 1.88, kb: 2.8, kbY: 0, hitstun: 17, type: 'light', step: 1.9, armorFrames: 6, src: 'panda_gorilla' },
      { name: 'Resonant Lift', dmg: 11.0, startup: 9, active: 4, recovery: 18, reach: 1.95, kb: 4.4, kbY: 8.6, hitstun: 28, type: 'launcher', step: 2.2, armorFrames: 8, src: 'panda_gorilla' }
    ],
    heavy: {
      name: 'Three-Core Slam', dmg: 22, startup: 15, active: 5, recovery: 26,
      reach: 2.10, kb: 7.0, kbY: 0, hitstun: 34, step: 2.8,
      staminaCost: 18, armorFrames: 18, ceGain: 1.8, clip: 'heavyGor', src: 'panda_gorilla'
    },
    ct1: {
      name: 'Drumming Beat', jpName: '不可視の連打', cost: 0,
      startup: 14, active: 5, recovery: 18,
      effect: 'panda_drum', clip: 'ct1Gor',
      dmg: 21, radius: 2.60, kb: 5.5, kbY: 1.0, hitstun: 28,
      unblockable: true, src: 'panda_gorilla'
    },
    ct2: {
      name: 'Gore Charge', jpName: '突角突進', cost: 0,
      startup: 8, active: 14, recovery: 14,
      effect: 'panda_gore', clip: 'ct1Tri',
      dmg: 16, reach: 2.1, travel: 8.0, speed: 17, kb: 4.5, kbY: 1.0, hitstun: 24,
      destruct: 44, src: 'panda_trike'
    },
    blockChipMult: 0.70, blockStaminaMult: 0.62, blockStartupFrames: 2,
    dashIFrames: 6
  }
};

export const PANDA = withDefaults({
  id: 'panda', name: 'PANDA', title: 'CURSED CORPSE — THREE CORES',
  jpName: '呪骸',

  stats: {
    // `hp` HERE IS THE BALANCED CORE'S POOL, not his total. Everything that
    // reads `cfg.stats.hp` outside the health system is a THRESHOLD test —
    // the CPU's "am I hurt" checks, mostly — and those want to compare the
    // exposed pool against the exposed pool's size. His total is 182 (see
    // `cores` below), read through `combat/cores.js totalHP` where it is
    // actually wanted. Both numbers are scaled by the global HP dial; see the
    // paths added to HEALTH_DENOMINATED in combat/balance.js.
    hp: 68,
    // Movement, damage and dash drain are ALL overridden per stance (see
    // STANCES above) and read through `Fighter.stats`. These are the balanced
    // core's values, kept here so that anything reading the config directly
    // gets a sane fighter rather than a hole.
    walkSpeed: 2.60, runSpeed: 5.00, dashSpeed: 8.40, jumpVel: 8.40,
    // HIGH CURSED ENERGY, canon: the balanced core's stated strength is that
    // it has a lot of cursed energy and the sense to use it. It is also what
    // pays for Gorilla, which burns 14/s.
    startMaxCE: 46, ceRegen: 2.8, ceGainPerPunch: 6,
    damageScale: 1.00,
    stamina: 120, staminaRegen: 24, dashDrain: 26
  },

  // ---- THE THREE CORES ----------------------------------------------------
  // 68 + 60 + 54 = 182 against a roster norm of 100 and Todo's 125, so his
  // TOTAL is the highest in the game by a wide margin — and each individual
  // pool is 68% / 60% / 54% of one ordinary health bar, so any single one of
  // them dies faster than any other character in the game.
  //
  // THE POOLS ARE NOT EQUAL, and the ordering is the balance lever that keeps
  // the three stances honest: the strongest stance has the second-smallest
  // pool and the fastest stance has the smallest. Gorilla out-damages
  // everything, and Gorilla is also the second-easiest core to delete; the
  // Triceratops escapes everything, and she cannot take a punish. Only the
  // balanced core is durable, and it is the one whose numbers are ordinary.
  //
  // These three numbers are health-denominated and are scaled by the global
  // HP dial in combat/balance.js — see the three paths added to
  // HEALTH_DENOMINATED there.
  cores: {
    order: ['panda', 'gorilla', 'trike'],
    // THE SWAP WINDOW. 26 frames (0.43 s) with no armour, no invulnerability
    // and no cancel — long enough that swapping in someone's face is a real
    // risk and short enough that swapping on a knockdown is free. Compare
    // Toji's weapon draw, which is the same idea at a shorter duration because
    // a tool swap changes two buttons and a core swap changes the character.
    swapFrames: 26,
    swapCost: 8,
    defs: {
      panda: { hp: 68, name: 'PANDA', jp: '熊猫核', short: 'PAN' },
      gorilla: { hp: 60, name: 'GORILLA', jp: '猩々核', short: 'GOR' },
      trike: { hp: 54, name: 'TRICERATOPS', jp: '三角竜核', short: 'TRI' }
    }
  },

  stances: STANCES,

  // Base slots point at the balanced core so that anything reading the config
  // without going through `Fighter._def` (the debug overlay, a future tool)
  // sees a coherent character rather than an empty one.
  punches: STANCES.panda.punches,
  heavy: STANCES.panda.heavy,
  ct1: STANCES.panda.ct1,
  ct2: STANCES.panda.ct2,
  blockChipMult: STANCES.panda.blockChipMult,
  blockStaminaMult: STANCES.panda.blockStaminaMult,
  blockStartupFrames: STANCES.panda.blockStartupFrames,

  // ---- MASS ---------------------------------------------------------------
  // Bigger than the students, smaller than Todo in WEIGHT terms but taller in
  // BULK. He is a bear: hard to move, easy to hit.
  kbResist: 0.78,
  launchResist: 0.70,
  size: {
    height: 1.98,
    bodyRadius: 0.34,
    pushRadius: 0.56,
    hurtRadius: 0.78, hurtHeight: 1.66, hurtCenter: 1.14, hurtPad: 0.16,
    strikeY: 1.34,
    stepShake: 0.05,
    camDist: 1.06, camHeight: 0.18, camPitch: 0.02
  },

  // ---- B · SPECIAL — CORE SWAP -------------------------------------------
  // TAP cycles to the next surviving core; HOLD opens the radial and picks one
  // directly. Exactly the interaction Megumi's shikigami, Toji's arsenal and
  // Geto's curses already present, using the same `_openWheel` / `_wheelPick`
  // pair — including the rule that DESTROYED OPTIONS ARE NOT SELECTABLE, which
  // matters more here than anywhere else it is used, because a destroyed core
  // is gone for the match and a wheel that let you point at one would be
  // pointing at a corpse.
  //
  // It costs a small amount of cursed energy and NO cooldown beyond the
  // animation. A cooldown would make being caught in the wrong stance a
  // sentence rather than a mistake, and the 26-frame window is already the
  // punish.
  special: {
    key: 'panda_swap', name: 'CORE SWAP', jp: '核転換',
    cost: 8, cooldown: 0.9, clip: 'swap',
    timeScale: 0.62, maxHold: 3.5, stateFrames: 26
  },

  // ---- D-pad RIGHT · ULTIMATE — THREE CORES, ONE BODY --------------------
  // 三核共鳴. NON-DOMAIN: standard gate, full bar, standard backlash, and the
  // fast non-domain startup.
  //
  // He draws on every SURVIVING core at once: the `all` stance above, with no
  // swap animation and no stance restrictions.
  //
  // THE SCALING IS THE POINT, and it is the payoff for having played the core
  // management well:
  //   3 cores alive   x1.00   12.0 s   — devastating
  //   2 cores alive   x0.70    8.4 s
  //   1 core alive    x0.45    5.4 s   — weak, and it should be
  // Both the DAMAGE and the DURATION scale, because scaling only one of them
  // gives either a long weak window (annoying) or a short strong one (still a
  // round-ender). A Panda down to his last core gets five seconds of a slightly
  // better version of himself, which is the correct amount of help for a player
  // who has already lost two thirds of his kit.
  ultimate: {
    kind: 'burst', name: 'THREE CORES, ONE BODY', jpName: '三核共鳴',
    startup: 12, active: 5, recovery: 12,          // 29f
    effect: 'panda_allcores', clip: 'ult',
    duration: 12.0,
    // MEASURED AND RETUNED. The first pass used 1.00 / 0.70 / 0.45, which read
    // fine on paper and was wrong in the game: those numbers multiply the `all`
    // stance's own damage scale, so a one-core ultimate came out at 1.55 x 0.45
    // = 0.70 outgoing — THIRTY PERCENT WORSE than simply standing in his
    // balanced core and not spending a bar. The floor has to sit at his
    // baseline, not below it.
    //
    //   3 cores   x1.00   dmg 1.55   12.0 s   devastating; above Gorilla
    //   2 cores   x0.80   dmg 1.24    9.6 s   about Gorilla, with Gorilla's
    //                                         damage on the Triceratops's legs
    //   1 core    x0.62   dmg 0.96    7.4 s   NO damage payoff at all — what he
    //                                         still gets is free cursed energy,
    //                                         no swap animation, both signature
    //                                         techniques at once and 6.0 run.
    //
    // So the floor is "a bar buys you utility"; the ceiling is "a bar buys you
    // the round". That spread is the reward for protecting all three cores and
    // it is legible without a tooltip, because the HUD strip is right there.
    byCores: { 3: 1.00, 2: 0.80, 1: 0.62 },
    dmg: 0,
    backlash: { duration: 8, regenMult: 0.5, growthMult: 0.5 }
  },

  // canon-correct: a cursed corpse has no Domain Expansion
  domain: null,

  simpleDomainDrain: 18,
  barrierBreak: { ceDrain: 30, chip: 26 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // THE UNBLOCKABLE DRUMMING BEAT. It is the named canon technique, it is the
  // one thing in his kit that does something no other move in the game does,
  // and it is the recognisable answer to "what did you take off Panda".
  //
  // Deliberately NOT the core swap: Yuta has one health bar, so there would be
  // nothing to swap between and the copy would be a no-op — which is the
  // clearest possible sign that the swap is a health-system feature rather
  // than a technique. Copy holds attacks; this is the attack.
  copyEffect: { effect: 'panda_drum', dmg: 15, name: 'Copied: Drumming Beat' }
});
