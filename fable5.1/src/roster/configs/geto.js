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
// `body` names a builder in combat/curses.js. SIXTEEN CURSES ACROSS THREE
// TIERS, up from eight across two:
//
//   FIVE LOW GRADES   original bodies, five different silhouettes. Two are in
//                     art/models/lowcurses.js and three in getocurses.js.
//   FOUR MID GRADES   original bodies (getocurses.js), one per function: a
//                     harasser, a grabber, a shield and a ranged threat.
//   SEVEN SPECIALS    three original bodies — the manta ray he travels on, the
//                     Rainbow Dragon and the giant hookworm — plus the FOUR
//                     that reuse the existing playable characters wholesale
//                     (model, rig and the complete animation set), cut down to
//                     a reduced stat line and ONE signature move each.
//
// EVERY ONE OF THEM IS A CURSE HE OR KENJAKU IS ACTUALLY SHOWN USING. The
// quote each design is built from is in the reference sheet at the top of
// art/models/getocurses.js; nothing in this table is invented.
//
// Reading the table as a cost curve: chaff is 9-13 CE and comes back in four
// to six seconds; a mid grade is 20-24 CE and eight to thirteen; a special
// grade is 36-48 CE, most of a bar, and if it dies it is gone for the round.
//
// `uzumakiWeight` is what each curse is worth to the ultimate: 1 for a low
// grade, 2 for a mid, 4 for a special. A full stable is
// 5(1) + 4(2) + 7(4) = 41 weight and an emptied one is 0. The formula that
// turns weight into damage is SUBLINEAR and the derivation is on `ultimate`
// below — doubling the stable on a linear curve would have made Uzumaki an
// unanswerable instant kill.
export const CURSE_DEFS = {
  // ---- LOW GRADES ---------------------------------------------------------
  // FIVE cheap bodies with FIVE DIFFERENT SILHOUETTES. This used to be two
  // designs and two duplicates ("GAPING MAW II", "TENDRIL WISP II"), which is
  // the exact thing the brief calls out: the player sees chaff more than
  // anything else in the stable, so variety matters most here. Every one of
  // the three new ones is a curse Geto or Kenjaku is actually drawn using.
  //
  // They exist to be in the way, to eat a swing meant for Geto, and to be worth
  // almost nothing when they die — but no two of them play the same.
  maw1: {
    key: 'maw1', body: 'lowMaw', name: 'GAPING MAW', jp: '呪霊', short: 'MAW',
    role: 'chase',
    cost: 10, cooldown: 4.5, hp: 15, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 3.0, hitstun: 12, kb: 1.1, speed: 5.6, reach: 1.15, preferRange: 1.15,
    swingEvery: 1.25, actTime: 0.34, hitAt: 0.14, recoverTime: 0.36, life: 22,
    ceFeed: 0.18, blockChance: 0.30, animAction: 'bite', turnRate: 10,
    desc: 'CHAFF · CHASES · BODY-BLOCKS'
  },
  wisp1: {
    key: 'wisp1', body: 'lowWisp', name: 'TENDRIL WISP', jp: '呪霊', short: 'WISP',
    role: 'zone',
    cost: 12, cooldown: 5.0, hp: 13, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 2.4, hitstun: 14, kb: 0.8, speed: 4.4, reach: 1.75, preferRange: 1.75,
    swingEvery: 1.5, actTime: 0.42, hitAt: 0.16, recoverTime: 0.44, life: 22,
    ceFeed: 0.18, blockChance: 0.34, animAction: 'lash', turnRate: 7,
    desc: 'CHAFF · REACH · SCREENS'
  },
  // CENTIPEDE — "Multiple RED CENTIPEDE-LIKE cursed spirits that Suguru
  // summoned to battle Maki Zenin", and countless more against Yuta. The
  // fastest body in the stable and the only one that never blocks: it does not
  // defend Geto, it runs at you.
  centipede: {
    key: 'centipede', body: 'lowCentipede', name: 'CENTIPEDE', jp: '百足', short: 'CENTI',
    role: 'harass',
    cost: 11, cooldown: 4.0, hp: 11, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 2.2, hitstun: 10, kb: 0.6, speed: 8.4, reach: 1.05, preferRange: 1.0,
    swingEvery: 0.85, actTime: 0.26, hitAt: 0.10, recoverTime: 0.24, life: 20,
    ceFeed: 0.18, blockChance: 0.0, animAction: 'bite', turnRate: 13,
    desc: 'CHAFF · FASTEST · NEVER BLOCKS'
  },
  // DECOY EYE — "Two SMALL SINGLE-EYED curses that act as DECOYS for Suguru
  // while standing off with opponents." Its role is the one nothing else in
  // the game does: it PULLS AGGRO. Hostile summons go for it instead of for
  // Geto's real bodies, and it does almost no damage at all.
  decoyEye: {
    key: 'decoyEye', body: 'lowEye', name: 'DECOY EYE', jp: '囮', short: 'EYE',
    role: 'decoy', decoy: { radius: 9.0 },
    cost: 9, cooldown: 5.5, hp: 18, slots: 1, refund: 0.6, uzumakiWeight: 1,
    dmg: 1.0, hitstun: 8, kb: 0.4, speed: 3.6, reach: 2.2, preferRange: 2.6,
    swingEvery: 2.2, actTime: 0.4, hitAt: 0.18, recoverTime: 0.5, life: 24,
    ceFeed: 0.10, blockChance: 0.55, animAction: 'lash', turnRate: 6,
    desc: 'CHAFF · DRAWS SUMMONS OFF GETO'
  },
  // FLESH-EATER — "A group of GRADE 3 OR LOWER cursed spirits that work
  // together to SUCK A PERSON'S FLESH APART." So it does not hit, it ATTACHES:
  // once it lands it drains health over time until it is killed or shaken.
  fleshEater: {
    key: 'fleshEater', body: 'lowEater', name: 'FLESH-EATER', jp: '喰', short: 'EATER',
    role: 'grab', latch: { dps: 3.2, duration: 3.0, slow: 0.45 },
    cost: 13, cooldown: 6.5, hp: 12, slots: 1, refund: 0.5, uzumakiWeight: 1,
    dmg: 1.8, hitstun: 10, kb: 0, speed: 5.0, reach: 1.1, preferRange: 1.0,
    swingEvery: 2.6, actTime: 0.40, hitAt: 0.18, recoverTime: 0.5, life: 22,
    ceFeed: 0.22, blockChance: 0.10, animAction: 'bite', turnRate: 9,
    desc: 'CHAFF · LATCHES ON · DRAINS'
  },

  // ---- MID GRADES ---------------------------------------------------------
  // FOUR medium threats with four distinct jobs, which is exactly the brief:
  // something that GRABS, something that SHIELDS, something RANGED, and
  // something that HARASSES. `slots: 1` — they are real bodies but they do not
  // eat the whole allowance the way a special grade does, so a mid grade plus
  // a piece of chaff is a legal field and that is the shape of most of his
  // rounds now.
  koguy: {
    key: 'koguy', body: 'midKoGuy', name: 'KO-GUY', jp: '蝗', short: 'KO-GUY',
    role: 'harass', midGrade: true,
    frames: { startup: 20, active: 2, recovery: 20, clip: 'summonLow' },
    // Kenjaku's asset rather than Geto's own — he is guarding the Shibuya
    // curtain when Yuji finds him — but he is a Cursed Spirit Manipulation
    // body and the technique is the same technique.
    cost: 20, cooldown: 8, hp: 26, slots: 1, refund: 0.5, uzumakiWeight: 2,
    dmg: 6.0, hitstun: 18, kb: 1.8, speed: 6.6, reach: 1.8, preferRange: 1.6,
    swingEvery: 1.6, actTime: 0.38, hitAt: 0.16, recoverTime: 0.42, life: 20,
    // BLACK MUCUS — canon: "he can shoot black mucus from his mouth". A ranged
    // spit that slows, so he can harass from outside his own reach.
    spit: { every: 4.2, range: 9.0, dmg: 4.0, slow: 0.5, dur: 1.6 },
    ceFeed: 0.24, blockChance: 0.12, animAction: 'bite', turnRate: 11,
    desc: 'MID · LEAPS · SPITS BLACK MUCUS'
  },
  fungus: {
    key: 'fungus', body: 'midFungus', name: 'FUNGUS HEADS', jp: '茸', short: 'FUNGUS',
    role: 'grab', midGrade: true,
    frames: { startup: 20, active: 2, recovery: 20, clip: 'summonLow' },
    // "A TALL curse with a FUNGUS BASE and SEVERAL HEADS atop it capable of
    // CAPTURING Suguru's targets. Upon doing so the LARGEST HEAD will attempt
    // to KISS whoever is captive." The kiss is the damage; the capture is the
    // point, because it is what lets Geto set up anything at all.
    cost: 22, cooldown: 11, hp: 30, slots: 1, refund: 0.55, uzumakiWeight: 2,
    dmg: 9.0, hitstun: 26, kb: 0, speed: 2.4, reach: 3.6, preferRange: 3.2,
    swingEvery: 3.6, actTime: 0.55, hitAt: 0.24, recoverTime: 0.7, life: 20,
    hold: 1.25,                    // seconds the target is rooted by the capture
    ceFeed: 0.26, blockChance: 0.18, animAction: 'grab', turnRate: 3,
    desc: 'MID · CAPTURES · HOLDS'
  },
  daruma: {
    key: 'daruma', body: 'midDaruma', name: 'DARUMA', jp: '達磨', short: 'DARUMA',
    role: 'block', midGrade: true,
    frames: { startup: 20, active: 2, recovery: 20, clip: 'summonLow' },
    // "A LARGE BLUE DARUMA DOLL cursed spirit summoned by Suguru to CRUSH
    // Shigeru Sonoda to death." The shield: enormous health, almost no damage
    // output, and it plants itself between Geto and the fight rather than
    // chasing. It is what he puts out when he intends to do nothing for ten
    // seconds while the bar refills.
    cost: 24, cooldown: 13, hp: 64, slots: 1, refund: 0.6, uzumakiWeight: 2,
    dmg: 11.0, hitstun: 30, kb: 5.0, kbY: 1.4, speed: 1.9, reach: 2.2, preferRange: 1.8,
    swingEvery: 4.2, actTime: 0.75, hitAt: 0.42, recoverTime: 0.9, life: 22,
    ceFeed: 0.20, blockChance: 0.92, animAction: 'slam', turnRate: 2.2,
    desc: 'MID · WALL · BODY-BLOCKS FOR GETO'
  },
  pillar: {
    key: 'pillar', body: 'midPillar', name: 'PILLAR CURSE', jp: '光柱', short: 'PILLAR',
    role: 'ranged', midGrade: true,
    frames: { startup: 20, active: 2, recovery: 20, clip: 'summonLow' },
    // Semi-grade 1 by the fanbook. "It can fire DESTRUCTIVE PILLARS OF LIGHT
    // down on a target by POINTING ITS INDEX AND MIDDLE FINGER ON EITHER HAND
    // UPWARDS." Long delay, huge range, hits where the target WAS — so it is
    // avoidable by moving and lethal to anybody standing still.
    cost: 23, cooldown: 12, hp: 20, slots: 1, refund: 0.5, uzumakiWeight: 2,
    dmg: 13.0, hitstun: 30, kb: 2.0, kbY: 6.0, radius: 2.0, delay: 0.85,
    speed: 2.0, reach: 14.0, preferRange: 10.5,
    swingEvery: 3.8, actTime: 0.9, hitAt: 0.42, recoverTime: 0.8, life: 20,
    ceFeed: 0.26, blockChance: 0.06, animAction: 'aim', turnRate: 3.5,
    desc: 'MID · LONG RANGE · PILLARS OF LIGHT'
  },

  // ---- SPECIAL GRADES -----------------------------------------------------
  // `slots: 2` against an `activeLimit` of 2 is what enforces "two low grades
  // OR one special grade" without a second counter anywhere.
  //
  // THREE NEW ONES, all researched: the manta ray he travels on, the Rainbow
  // Dragon, and the giant hookworm. They join the four that reuse playable
  // characters wholesale.

  // THE MANTA RAY — unnamed in canon. "A flying curse with an appearance
  // similar to an aquatic sting-ray... enough size to SUPPORT SUGURU AND ONE
  // OTHER PERSON." MOBILITY, and the only summon in the game that moves its
  // owner: while it is out, Geto can call it to CARRY him — a long, fast,
  // uninterruptible reposition — and between carries it dives at the opponent.
  manta: {
    key: 'manta', body: 'spManta', specialGrade: true,
    name: 'AQUATIC STING-RAY', jp: '飛行呪霊', short: 'MANTA',
    role: 'mobility',
    cost: 36, cooldown: 15, hp: 40, slots: 2, refund: 0.55, uzumakiWeight: 4,
    dmg: 12, hitstun: 24, kb: 4.2, kbY: 1.6,
    speed: 8.6, reach: 2.6, preferRange: 5.0,
    swingEvery: 3.0, actTime: 0.65, hitAt: 0.30, recoverTime: 0.7, life: 20,
    flyHeight: 4.6,
    carry: { every: 7.0, speed: 16, dur: 0.75, height: 3.4 },
    ceFeed: 0.28, blockChance: 0.0, animAction: 'dive', turnRate: 6,
    desc: 'SPECIAL GRADE · CARRIES GETO · DIVES'
  },
  // RAINBOW DRAGON 虹竜 — named, and "the HARDEST SKIN out of all of Geto's
  // cursed spirits", able to "SMASH INTO AND DESTROY STONE STRUCTURES".
  // His heaviest non-ultimate summon: the biggest single hit in the stable and
  // the only body with real damage reduction.
  dragon: {
    key: 'dragon', body: 'spDragon', specialGrade: true,
    name: 'RAINBOW DRAGON', jp: '虹竜', short: 'DRAGON',
    role: 'burst',
    cost: 48, cooldown: 22, hp: 58, slots: 2, refund: 0.55, uzumakiWeight: 4,
    // THE HARDEST SKIN: a flat multiplier on incoming damage, which no other
    // curse has. It is the one thing the reference says about it, so it is the
    // one thing that has to be true in the fight.
    armour: 0.55,
    dmg: 26, hitstun: 40, kb: 8.5, kbY: 2.6,
    speed: 4.4, reach: 4.2, preferRange: 3.4,
    swingEvery: 4.4, actTime: 0.8, hitAt: 0.40, recoverTime: 1.0, life: 20,
    destruct: 45,                  // and it takes the level with it
    ceFeed: 0.34, blockChance: 0.08, animAction: 'smash', turnRate: 3,
    desc: 'SPECIAL GRADE · ARMOURED · HEAVIEST HIT'
  },
  // THE HOOKWORM — unnamed. "A GIANT MAN-EATING HOOKWORM-LIKE curse... innards
  // large enough to CAPTURE AND SWALLOW... It always APPEARS SUDDENLY FROM THE
  // GROUND." It swallowed Toji. It does not chase: it erupts UNDER the target,
  // swallows, and holds them there while the rest of the stable works.
  hookworm: {
    key: 'hookworm', body: 'spHookworm', specialGrade: true,
    name: 'GIANT HOOKWORM', jp: '鉤虫', short: 'WORM',
    role: 'grab',
    cost: 42, cooldown: 19, hp: 54, slots: 2, refund: 0.55, uzumakiWeight: 4,
    dmg: 16, hitstun: 34, kb: 0,
    swallow: { hold: 1.8, dps: 6.0, range: 3.0 },
    erupt: { every: 5.5, range: 12.0 },   // it relocates by submerging
    speed: 0.9, reach: 3.0, preferRange: 2.6,
    swingEvery: 3.4, actTime: 0.6, hitAt: 0.26, recoverTime: 0.8, life: 20,
    ceFeed: 0.30, blockChance: 0.10, animAction: 'grab', turnRate: 4,
    desc: 'SPECIAL GRADE · ERUPTS · SWALLOWS'
  },

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
// Grouped low → mid → special, which is also the cost curve.
export const STABLE_ORDER = [
  'maw1', 'wisp1', 'centipede', 'decoyEye', 'fleshEater',
  'koguy', 'fungus', 'daruma', 'pillar',
  'manta', 'dragon', 'hookworm', 'jogo', 'hanami', 'mahito', 'kurourushi'
];
export const LOW_ORDER = ['maw1', 'wisp1', 'centipede', 'decoyEye', 'fleshEater'];
export const MID_ORDER = ['koguy', 'fungus', 'daruma', 'pillar'];
export const SPECIAL_ORDER = ['manta', 'dragon', 'hookworm', 'jogo', 'hanami', 'mahito', 'kurourushi'];

// ---- WHAT THE CURSE WHEEL OFFERS -----------------------------------------
// The wheel used to hold four special grades. It now holds the MID GRADES TOO,
// which is how the four new medium bodies get a home without adding a fourth
// summon button to a pad that is already full.
//
// The mapping stays as simple as it was:
//   RB  throw a piece of chaff — no choice, no wheel, press it without thinking
//   RT  summon THE ONE YOU CHOSE — mid grade or special grade
//   B   choose which
// `specialOrder` is kept as the SPECIAL-GRADE list specifically, because the
// "one special grade at a time" rule and the reselection-on-loss both need to
// know the difference between a monster and a mid grade.
export const WHEEL_ORDER = [...MID_ORDER, ...SPECIAL_ORDER];

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
    midOrder: MID_ORDER,
    specialOrder: SPECIAL_ORDER,
    wheelOrder: WHEEL_ORDER,
    defaultSpecial: 'manta',
    // SLOTS, NOT BODIES. A low grade costs 1, a mid grade costs 1, a special
    // grade costs 2, and the allowance is 2 — so "two of the small ones OR one
    // monster" is the whole rule, and widening it later is one number.
    //
    // THE MID GRADES DID NOT NEED A THIRD COUNTER. They are `slots: 1` with a
    // real cost and a real cooldown, so the budget already stops him fielding
    // two of them alongside anything; what it permits is a mid grade plus one
    // piece of chaff, which is exactly the shape a general's line should have.
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
  // ---- THE RETUNE, AND WHY THE FORMULA CHANGED SHAPE ----------------------
  // The stable went from EIGHT curses (weight 20) to SIXTEEN (weight 41), and
  // the old formula was LINEAR:
  //
  //     raw = 18 + 8 * weight
  //
  // At weight 41 that is 346 raw -> 369 delivered against a 235-point health
  // bar. A full stable would have been an unanswerable instant kill from full
  // health, which is not a payoff — it is a round that ends because somebody
  // pressed a button, and it would have made every one of the eight new curses
  // a reason NOT to fight.
  //
  // So the scaling is now SUBLINEAR, with the exponent as an explicit dial:
  //
  //     raw       = baseDmg + dmgPerWeight * weight ^ weightExp
  //               = 18 + 8.8 * weight ^ 0.78
  //     delivered = raw * damageScale (0.82) * SPECIAL (1.30) = raw * 1.066
  //
  // The exponent is what does the work. It is chosen so that a FULL stable
  // lands on the same 190-delivered figure the eight-curse version did — the
  // number that was already tuned to sit just short of a kill — while a HALF
  // stable is now worth proportionally MORE than it used to be (50% of a bar
  // against 44%). That is the intended consequence and not a side effect: with
  // sixteen curses, losing four of them should not gut the ultimate, or the
  // opponent's correct play would simply be to kill four cheap bodies and stop
  // thinking about it.
  //
  // The DELIVERED column is the one that matters and the one the HUD prints;
  // measured in a live fight, not estimated. Health bar is 235.
  //
  //   FULL STABLE   (w 41) = 177 raw -> 189 delivered — 80% of a bar. The
  //                 biggest single number in the game, and deliberately just
  //                 short of killing a healthy opponent outright: an ultimate
  //                 that takes a full bar from full health is not a payoff,
  //                 it is a coin flip nobody enjoys losing. It leaves them
  //                 alive and it leaves HIM with nothing.
  //   HALF STABLE   (w 20) = 111 raw -> 118 delivered — 50%. Strong, and about
  //                 level with the other burst ultimates.
  //   ONE SPECIAL   (w  4) =  45 raw ->  48 delivered — 20%.
  //   ONE LOW GRADE (w  1) =  27 raw ->  29 delivered — 12%. Worse than his
  //                 own heavy, which is the point.
  //   EMPTY STABLE  (w  0) =  18 raw ->  19 delivered — and it is still
  //                 ALLOWED to fire, because
  //                 refusing the input would be worse than letting a player
  //                 make a bad decision. It plays the full cinematic and does
  //                 almost nothing, which is a lesson learned once.
  //
  // WEIGHTS: a low grade is 1, a MID grade is 2, a special grade is 4. Sixteen
  // curses = 5(1) + 4(2) + 7(4) = 41.
  //
  // ON USE THE ENTIRE STABLE IS CONSUMED. Everything on the field dissolves
  // and everything still held is struck off, for the rest of the ROUND. After
  // this he has his weak normals and nothing else — and his final animation
  // pose says so.
  ultimate: {
    kind: 'burst', name: 'MAXIMUM: UZUMAKI', jpName: '極ノ番・うずまき',
    startup: 62, active: 26, recovery: 29,       // 117f = the clip's 1.95 s
    effect: 'geto_uzumaki', clip: 'ult',
    baseDmg: 18, dmgPerWeight: 8.8, weightExp: 0.78,
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
