// GETO — 夏油傑. Cursed Spirit Manipulation. THE GENERAL.
//
// He does not fight. He deploys, he stands behind what he deployed, and once a
// round he can cash the entire army in for one enormous attack.
//
// THE SECOND SUMMONER, AND DELIBERATELY NOTHING LIKE THE FIRST:
//
//   MEGUMI has a personal wheel of six shikigami. They are HIS, he binds two
//   at a time, he fights alongside them, and losing one is losing a limb — for
//   the whole match, with only his domain able to give them back.
//
//   GETO has an ARMY OF BORROWED MONSTERS. He holds eight, he can only have a
//   couple out at once, he fights BEHIND them rather than with them, and his
//   ultimate EATS ALL OF THEM AT ONCE. He has no domain and nothing gives them
//   back inside a round.
//
// THE WHOLE CHARACTER IS ONE TENSION, and every number below serves it:
//   Keeping curses alive makes Maximum: Uzumaki lethal but leaves him passive.
//   Spending them keeps pressure on but defuses his payoff.
// He is not allowed to be good at both, and the HUD shows the projected
// Uzumaki damage live so the player is never guessing which side of that
// trade they are currently on.
//
// Canon-correct: Geto has NO Domain Expansion. He joins Nanami, Yuji, Todo,
// Toji, Hanami, Kurourushi, Choso and Nobara on a burst ultimate with the
// faster non-domain startup and the standard gate.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE STABLE
// ---------------------------------------------------------------------------
// `body` names a builder in combat/curses.js. The four SPECIAL GRADES reuse
// the existing playable characters wholesale — model, rig and the complete
// animation set — and are cut down here to a reduced stat line and ONE
// signature move each. The four LOW GRADES use two original curse models
// (art/models/lowcurses.js) that correspond to no playable character.
//
// Reading the table as a cost curve: chaff is 10-13 CE and comes back in five
// seconds; a special grade is 38-46 CE, most of a bar, and if it dies it is
// gone for the round.
//
// `uzumakiWeight` is what each curse is worth to the ultimate. A special grade
// is worth four low grades, so the full stable is 4 + 16 = 20 weight and an
// emptied one is 0.
export const CURSE_DEFS = {
  // ---- LOW GRADES ---------------------------------------------------------
  // Four cheap bodies. Little damage, high nuisance. They exist to be in the
  // way, to eat a swing meant for Geto, and to be worth almost nothing when
  // they die — which is what makes them spammable.
  maw1: {
    key: 'maw1', body: 'lowMaw', name: 'GAPING MAW', jp: '呪霊', short: 'MAW',
    cost: 10, cooldown: 4.5, hp: 15, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 3.0, hitstun: 12, kb: 1.1, speed: 5.6, reach: 1.15, preferRange: 1.15,
    swingEvery: 1.25, actTime: 0.34, hitAt: 0.14, recoverTime: 0.36, life: 22,
    ceFeed: 0.18, blockChance: 0.30, animAction: 'bite', turnRate: 10,
    desc: 'CHAFF · FAST · BODY-BLOCKS'
  },
  maw2: {
    key: 'maw2', body: 'lowMaw', name: 'GAPING MAW II', jp: '呪霊', short: 'MAW II',
    cost: 10, cooldown: 4.5, hp: 15, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 3.0, hitstun: 12, kb: 1.1, speed: 5.6, reach: 1.15, preferRange: 1.15,
    swingEvery: 1.25, actTime: 0.34, hitAt: 0.14, recoverTime: 0.36, life: 22,
    ceFeed: 0.18, blockChance: 0.30, animAction: 'bite', turnRate: 10,
    desc: 'CHAFF · FAST · BODY-BLOCKS'
  },
  wisp1: {
    key: 'wisp1', body: 'lowWisp', name: 'TENDRIL WISP', jp: '呪霊', short: 'WISP',
    cost: 12, cooldown: 5.0, hp: 13, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 2.4, hitstun: 14, kb: 0.8, speed: 4.4, reach: 1.75, preferRange: 1.75,
    swingEvery: 1.5, actTime: 0.42, hitAt: 0.16, recoverTime: 0.44, life: 22,
    ceFeed: 0.18, blockChance: 0.34, animAction: 'lash', turnRate: 7,
    desc: 'CHAFF · REACH · SCREENS'
  },
  wisp2: {
    key: 'wisp2', body: 'lowWisp', name: 'TENDRIL WISP II', jp: '呪霊', short: 'WISP II',
    cost: 12, cooldown: 5.0, hp: 13, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 2.4, hitstun: 14, kb: 0.8, speed: 4.4, reach: 1.75, preferRange: 1.75,
    swingEvery: 1.5, actTime: 0.42, hitAt: 0.16, recoverTime: 0.44, life: 22,
    ceFeed: 0.18, blockChance: 0.34, animAction: 'lash', turnRate: 7,
    desc: 'CHAFF · REACH · SCREENS'
  },

  // ---- SPECIAL GRADES -----------------------------------------------------
  // `slots: 2` against an `activeLimit` of 2 is what enforces "two low grades
  // OR one special grade" without a second counter anywhere.

  // JOGO — reuses the playable model, rig and clip set. Signature move: the
  // EMBER INSECTS off his ct1. The only curse in the stable that reaches, and
  // therefore the one Geto puts out when the opponent will not come to him.
  jogo: {
    key: 'jogo', body: 'jogo', specialGrade: true,
    name: 'JOGO', jp: '漏瑚', short: 'JOGO',
    cost: 40, cooldown: 16, hp: 38, slots: 2, refund: 0.55, uzumakiWeight: 4,
    dmg: 11, hitstun: 20, kb: 1.6, speed: 3.0, reach: 7.5, preferRange: 6.2,
    swingEvery: 2.6, actTime: 0.55, hitAt: 0.20, recoverTime: 0.6, life: 20,
    ceFeed: 0.30, blockChance: 0.10, clip: 'ct1', turnRate: 5,
    desc: 'SPECIAL GRADE · RANGED FIRE PRESSURE'
  },
  // HANAMI — reuses the playable model, rig and clip set. Signature move: the
  // ROOT ERUPTION off his ct1. Pure area denial: he makes ground unsafe, which
  // is worth more to a man who intends to stand still than a curse that chases.
  hanami: {
    key: 'hanami', body: 'hanami', specialGrade: true,
    name: 'HANAMI', jp: '花御', short: 'HANAMI',
    cost: 42, cooldown: 18, hp: 46, slots: 2, refund: 0.55, uzumakiWeight: 4,
    dmg: 15, hitstun: 30, kb: 3.2, kbY: 8.0, radius: 2.4, delay: 0.62,
    speed: 2.2, reach: 6.0, preferRange: 4.4,
    swingEvery: 3.4, actTime: 0.62, hitAt: 0.24, recoverTime: 0.7, life: 20,
    ceFeed: 0.30, blockChance: 0.16, clip: 'ct1', turnRate: 3.5,
    desc: 'SPECIAL GRADE · AREA DENIAL'
  },
  // MAHITO — reuses the playable model, rig and clip set. Signature move: SOUL
  // TOUCH off his ct1, WITHOUT the transfiguration gauge. Transfiguration is a
  // second resource that belongs to the man rather than to the borrowed hand,
  // so a summoned Mahito simply hits hard up close.
  mahito: {
    key: 'mahito', body: 'mahito', specialGrade: true,
    name: 'MAHITO', jp: '真人', short: 'MAHITO',
    cost: 38, cooldown: 15, hp: 34, slots: 2, refund: 0.55, uzumakiWeight: 4,
    dmg: 14, hitstun: 26, kb: 2.6, speed: 5.2, reach: 1.9, preferRange: 1.7,
    swingEvery: 2.0, actTime: 0.42, hitAt: 0.18, recoverTime: 0.5, life: 20,
    ceFeed: 0.30, blockChance: 0.22, clip: 'ct1', turnRate: 9,
    desc: 'SPECIAL GRADE · CLOSE PRESSURE'
  },
  // KUROUROSHI — reuses the playable model, rig and clip set. Signature move:
  // a REDUCED SWARM — a chip cloud around itself, with no gluttony stages and
  // no devour grab. Attrition: the curse you leave out when you want the
  // opponent to bleed while Geto does nothing at all.
  kurourushi: {
    key: 'kurourushi', body: 'kurourushi', specialGrade: true,
    name: 'KUROUROSHI', jp: '黒沐死', short: 'KUROU',
    cost: 44, cooldown: 20, hp: 52, slots: 2, refund: 0.55, uzumakiWeight: 4,
    dmg: 5.0, hitstun: 12, kb: 0.6, radius: 2.9,
    speed: 2.6, reach: 3.0, preferRange: 2.4,
    swingEvery: 1.8, actTime: 0.46, hitAt: 0.18, recoverTime: 0.5, life: 20,
    ceFeed: 0.30, blockChance: 0.26, clip: 'ct1', turnRate: 4,
    desc: 'SPECIAL GRADE · SWARM CHIP'
  }
};

// HUD order, left to right. Muscle memory depends on this never changing, so
// it is written once here and read by the stable strip, the wheel and the CPU.
export const STABLE_ORDER = [
  'maw1', 'maw2', 'wisp1', 'wisp2', 'jogo', 'hanami', 'mahito', 'kurourushi'
];
export const LOW_ORDER = ['maw1', 'maw2', 'wisp1', 'wisp2'];
export const SPECIAL_ORDER = ['jogo', 'hanami', 'mahito', 'kurourushi'];

export const GETO = withDefaults({
  id: 'geto', name: 'GETO', title: 'CURSED SPIRIT MANIPULATION',
  jpName: '夏油傑',

  stats: {
    // AVERAGE HEALTH, AVERAGE SPEED. He is not supposed to have a physical
    // edge anywhere; the army is the edge.
    hp: 100, walkSpeed: 2.6, runSpeed: 5.1, dashSpeed: 8.4, jumpVel: 8.6,
    // CE IS HIS FUEL AND IT DRAINS FAST. The regeneration is deliberately
    // BELOW the roster norm (2.2) rather than above it: he is not supposed to
    // be able to idle his way to a full stable on the field. The way he pays
    // for curses is `ceGainPerPunch`, which is the highest in the game — he
    // has to land hits with those bad normals to keep the army out, which is
    // exactly the loop the brief asked for.
    startMaxCE: 42, ceRegen: 1.9, ceGainPerPunch: 9,
    // WEAK. 0.82 is the lowest outgoing multiplier on the roster. He genuinely
    // cannot win by pressing punch, and that is a design requirement rather
    // than a preference.
    damageScale: 0.82,
    stamina: 100, staminaRegen: 22, dashDrain: 26
  },

  // ---- X · THE PUNCH STRING -----------------------------------------------
  // Weak, short, unremarkable, exactly as specified. Open-handed pushes and a
  // descending palm, not boxing. The third hit KNOCKS DOWN rather than
  // launching — nothing he does personally is worth putting someone in the air
  // for, and a knockdown is the more useful outcome anyway because it buys him
  // the time to summon.
  punches: [
    { name: 'Palm', dmg: 3.0, startup: 8, active: 3, recovery: 14, reach: 1.30, kb: 1.4, kbY: 0, hitstun: 13, type: 'light', step: 1.2 },
    { name: 'Cross Palm', dmg: 3.5, startup: 8, active: 3, recovery: 16, reach: 1.35, kb: 1.9, kbY: 0, hitstun: 15, type: 'light', step: 1.2 },
    { name: 'Descending Palm', dmg: 6.5, startup: 12, active: 4, recovery: 24, reach: 1.40, kb: 3.2, kbY: 0, hitstun: 28, type: 'knockdown', step: 1.4 }
  ],

  // HEAVY — a two-handed shove. Slow and committed, and it exists mainly as a
  // panic button to create the two metres he needs to cast in.
  heavy: {
    name: 'Repel', dmg: 12, startup: 18, active: 5, recovery: 30,
    reach: 1.90, kb: 7.2, kbY: 0, hitstun: 30, step: 1.6,
    staminaCost: 20, armorFrames: 0, ceGain: 2.0, clip: 'heavy'
  },

  // ---- THE STABLE ---------------------------------------------------------
  curses: {
    defs: CURSE_DEFS,
    stable: STABLE_ORDER,
    lowOrder: LOW_ORDER,
    specialOrder: SPECIAL_ORDER,
    defaultSpecial: 'jogo',
    // SLOTS, NOT BODIES. A low grade costs 1, a special grade costs 2, and the
    // allowance is 2 — so "two chaff OR one monster" is the whole rule, and
    // widening it later is one number.
    activeLimit: 2
  },

  // ---- RB · CT1 — SUMMON LOW-GRADE ----------------------------------------
  // Fast, cheap, spammable enough to keep the field busy. Cost and frame data
  // come from whichever low grade is next available (see the effect handler),
  // so this block's numbers are only the fallback.
  ct1: {
    name: 'SUMMON: LOW-GRADE', jpName: '呪霊操術', cost: 10,
    startup: 12, active: 2, recovery: 18,        // 32f = the clip's 0.53 s
    effect: 'geto_summon_low', clip: 'summonLow', curseSlot: 'low'
  },

  // ---- RT · CT2 — SUMMON SPECIAL-GRADE ------------------------------------
  // Slow, expensive, and VULNERABLE: 44 frames of startup with his arms open
  // and no hitbox anywhere. That exposure is the price of the best bodies in
  // his stable and the animation is built to advertise it (see the hold in
  // `summonGrand`).
  ct2: {
    name: 'SUMMON: SPECIAL-GRADE', jpName: '呪霊操術', cost: 40,
    startup: 44, active: 2, recovery: 28,        // 74f = the clip's 1.22 s
    effect: 'geto_summon_special', clip: 'summonGrand', curseSlot: 'special'
  },

  // ---- LT · BLOCK / LB · DASH ---------------------------------------------
  // Average guard, average dash. Stated explicitly rather than left to the
  // defaults because "average" is a design decision here, not an omission: he
  // is not allowed a defensive out, because his out is supposed to be the
  // thing standing between him and the opponent.
  blockChipMult: 1.0,
  blockStaminaMult: 1.0,
  blockStartupFrames: 5,

  // ---- B · SPECIAL — THE CURSE WHEEL -----------------------------
  // A radial selector on exactly the pattern Megumi's shikigami wheel
  // established: time slows a little, GAMEPLAY DOES NOT PAUSE, he cannot act
  // while it is held, and release confirms. It chooses which SPECIAL GRADE
  // CT2 will summon. Anything already destroyed is greyed out and cannot be
  // landed on.
  //
  // Cheap and short, like Megumi's, because re-selecting mid-fight should be
  // part of the rhythm rather than a once-a-round commitment.
  special: {
    key: 'geto_wheel', name: 'CURSE WHEEL', jp: '呪霊操術',
    cost: 5, cooldown: 3.0, clip: 'wheel', timeScale: 0.65, maxHold: 3.2,
    stateFrames: 8,
    // REABSORB shares this button: HOLDING it with a curse on the field and
    // the stick pulled back recalls instead of opening the wheel. See the
    // `reabsorbHold` handling in Fighter.trySpecial — one button, two moves,
    // decided by what is actually on the field, which is the same shape
    // Kurourushi's DEVOUR already uses.
    reabsorbFrames: 24, reabsorbClip: 'reabsorb'
  },

  // ---- D-pad Right · ULTIMATE — MAXIMUM: UZUMAKI --------------------------
  // 極ノ番・うずまき. Verified in research: the name is right and the technique
  // is exactly this — every cursed spirit still in his possession compressed
  // into ONE and fired as a single beam of condensed cursed energy. (Geto uses
  // it against Yuta and Rika at the end of JJK 0, with 4,461 spirits.)
  //
  // NON-DOMAIN, so it pays the standard gate (MAX_CE 100 + a full bar), costs
  // the full bar, takes the standard backlash, and gets the FASTER startup the
  // other burst ultimates get.
  //
  // DAMAGE SCALES WITH THE STABLE, and this is the entire character.
  //
  //     raw       = baseDmg + weight * dmgPerWeight
  //     delivered = raw * damageScale (0.82) * SPECIAL (1.30) = raw * 1.066
  //
  // The DELIVERED column is the one that matters and the one the HUD prints;
  // measured in a live fight, not estimated. Health bar is 235.
  //
  //   FULL STABLE   (w 20) = 178 raw -> 190 delivered — 81% of a bar. The
  //                 biggest single number in the game, and deliberately just
  //                 short of killing a healthy opponent outright: an ultimate
  //                 that takes a full bar from full health is not a payoff,
  //                 it is a coin flip nobody enjoys losing. It leaves them
  //                 alive and it leaves HIM with nothing.
  //   HALF STABLE   (w 10) =  98 raw -> 104 delivered — 44%. Strong, and about
  //                 level with the other burst ultimates.
  //   ONE LOW GRADE (w  1) =  26 raw ->  28 delivered — 12%. Worse than his
  //                 own heavy, which is the point.
  //   EMPTY STABLE  (w  0) =  18 raw ->  19 delivered — and it is still
  //                 ALLOWED to fire, because
  //                 refusing the input would be worse than letting a player
  //                 make a bad decision. It plays the full cinematic and does
  //                 almost nothing, which is a lesson learned once.
  //
  // ON USE THE ENTIRE STABLE IS CONSUMED. Everything on the field dissolves
  // and everything still held is struck off, for the rest of the ROUND. After
  // this he has his weak normals and nothing else — and his final animation
  // pose says so.
  ultimate: {
    kind: 'burst', name: 'MAXIMUM: UZUMAKI', jpName: '極ノ番・うずまき',
    startup: 62, active: 26, recovery: 29,       // 117f = the clip's 1.95 s
    effect: 'geto_uzumaki', clip: 'ult',
    baseDmg: 18, dmgPerWeight: 8,
    // the beam itself
    range: 24, width: 3.4, kb: 9.0, kbY: 3.0, hitstun: 46,
    // and it tears up the level on the way through
    destruct: 60
  },

  // canon-correct: no Domain Expansion
  domain: null,

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // What Copy takes off Geto is ONE LOW-GRADE CURSE, on loan. Not a special
  // grade (those are the spine of the character and lending one out for free
  // would be worth more than the slot Yuta spent), and not Uzumaki (an
  // ultimate is not a thing Copy holds). One piece of chaff is the honest
  // answer and it matches what Copy takes off Megumi — one Divine Dog.
  //
  // Loss is tracked per owner, so Yuta losing the borrowed curse costs Geto
  // nothing at all.
  copyEffect: { effect: 'geto_copy_low', dmg: 5, name: 'Copied: Low-Grade Curse' }
});
