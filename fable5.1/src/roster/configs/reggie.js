// ===========================================================================
// REGGIE STAR — レジィ・スター. 再契象 CONTRACTUAL RE-CREATION. THE IMPROVISER.
// ===========================================================================
// The only fighter in this game whose attacks are not made of cursed energy.
// Everything he throws is a real object, bought, kept as a receipt, and burned
// back into existence at the moment he needs it.
//
// ===========================================================================
// RESEARCH — WHAT THE TECHNIQUE ACTUALLY IS, AND WHAT IT CORRECTED
// ===========================================================================
// Sources (web, 2026-08-22): the Jujutsu Kaisen Wiki entries for Reggie Star,
// Contractual Re-Creation and Hollow Wicker Basket; the Villains Wiki entry;
// the Japanese アニメイトタイムズ and 攻略大百科 write-ups (which carry the
// original kanji the English wiki paraphrases); the Sportskeeda explainers;
// and the jujutsukaisenmanga.pro fight summary.
//
// *** THE NAME. 再契象 — SAIKEISHŌ. *** The English wiki renders it
// "Contractual Re-Creation", which is a translation rather than the name. Both
// are carried below, because the Japanese is the thing and the English is what
// a player will recognise.
//
// THE RULES, as researched:
//   · He applies cursed energy to a CONTRACT — in practice a receipt — and
//     BURNS IT. What was written on the contract is then re-created.
//   · IT IS NOT LIMITED TO OBJECTS. Canon is explicit: SERVICES work too. He
//     re-creates a spa treatment mid-fight and recovers from it while Megumi
//     is exhausted. That is in the kit below and it is the single best thing
//     the research turned up.
//   · Re-created things can be COMMANDED LIKE SHIKIGAMI — but only simple
//     instructions ("stab", "stay", "fall") — and anything given a command
//     DISAPPEARS once it has carried it out. So every object is genuinely
//     one-use, which is what the design brief asked for and what canon
//     independently requires.
//   · *** WATER IS THE COUNTER, AND IT IS HOW HE DIES. *** A wet receipt
//     cannot be burned. Megumi loads Chimera Shadow Garden with vehicles and a
//     house, disperses it, and they both drop into a school SWIMMING POOL; his
//     receipts dissolve on contact and he drowns. Implemented literally — see
//     `waterLock` below and combat/receipts.js.
//   · 彌虚葛籠 — HOLLOW WICKER BASKET. He does not use Simple Domain; he uses
//     its ANCESTOR, a woven sphere thrown up by an interlocked hand sign that
//     neutralises a domain's guaranteed hit. He is a thousand years old and it
//     is the Heian-era version of the technique. This game already has a
//     universal Simple Domain, so his IS this, by name — see `simpleDomainAs`.
//
// ---------------------------------------------------------------------------
// FIVE THINGS THE DESIGN BRIEF GOT WRONG, AND WHAT I DID ABOUT THEM
// ---------------------------------------------------------------------------
//  1. *** HE DOES NOT FIGHT IN THE SENDAI COLONY. *** He fights MEGUMI
//     FUSHIGURO in the TOKYO NO. 1 COLONY. Sendai is Yuta's colony — it is
//     where Ryu Ishigori, Uro and Kurourushi are, all three of whom are
//     already in this game, which is presumably where the mix-up came from.
//     The finisher is therefore built on the Megumi fight. It is STILL staged
//     on the school map where that map is loaded, and for a better reason
//     than the brief's: the beat that ends his life is a fall into a SCHOOL
//     SWIMMING POOL. See `finishers` below.
//  2. *** THERE IS NO MONEY. *** The brief describes an economy where he has
//     to "afford" things. Canon has no wallet: the constraint is that he must
//     be HOLDING A RECEIPT for the thing, and receipts are finite, physical
//     and destroyed by water. So the stock below is denominated in the
//     PRINTED TOTAL on the tags he is carrying — which keeps the brief's
//     ticking counter and its "spend everything on one big object" tension,
//     and is a thing the fiction actually contains rather than an invented
//     currency. The HUD says ¥ because the tags say ¥.
//  3. THE CHEAP OBJECT IS NOT A TRAFFIC CONE, it is a KITCHEN KNIFE — the
//     single most-cited use of the technique in the source. The cone is still
//     in the junk table, alongside it.
//  4. THE FIRE EXTINGUISHER IS A GAS CANISTER. Canon lists GAS in his stock
//     and does not list an extinguisher. Same mechanical job — a cloud that
//     takes away line of sight — with a real item behind it.
//  5. THE LADDER, THE VENDING MACHINE AND THE FISHING ROD ARE INVENTED, and
//     that is legitimate here in a way it would not be for any other
//     character: the technique's entire premise is that ANY receipt works.
//     Canon's own list (knives, machetes, cars, trucks, drones, a moped, a
//     wooden house, nets, gas, spa services) is a grab-bag by design. The
//     three inventions are flagged `canon: false` in the table so nobody
//     later mistakes them for research.
//
// CANON-CORRECT: *** REGGIE HAS NO DOMAIN EXPANSION. *** He has an ANTI-domain
// technique, which is the opposite thing. He joins Nanami, Yuji, Todo, Toji,
// Hanami, Kurourushi, Choso, Nobara, Geto, Naoya, Kashimo, Panda, Inumaki,
// Maki, Yuki, Miwa, Yaga, Takaba, Dagon and Uraume on a burst ultimate with
// the faster non-domain startup and the standard gate.
import { withDefaults } from './schema.js';

// ===========================================================================
// THE OBJECTS
// ===========================================================================
// *** THE CURSED-ENERGY COSTS WERE WRONG AND MEASUREMENT CAUGHT IT. ***
//
// The design says, in as many words at the top of this file: "cursed energy is
// what burns them, and burning is cheap; the tag is the expensive part." The
// first pass then priced the objects at 6-20 CE against a 2.5/s regen — so a
// forty-five-second round affords about a hundred and fifty cursed energy in
// total, and an instrumented match showed him refusing his own buttons for
// lack of CE EIGHTEEN TIMES while sitting on 46-56 stock the entire round.
//
// He was not resource-starved in the resource the character is about. He was
// starved in the one that was supposed to be cheap, and the stock — the whole
// point of him — never became the binding constraint at all.
//
// Every `ce` below is now roughly HALF what it was. The stock numbers did not
// move. What changed is which of the two a player actually feels, which is the
// difference between the character working and the character existing.
// One entry is one object, and adding an object is one entry plus one builder
// in art/models/receiptobjects.js plus one clip in art/anim/reggie.js.
// Nothing in combat/receipts.js, the wheel, the HUD or the CPU knows any
// object by name.
//
// FIELDS
//   name/short/jp   what it is called everywhere it is printed
//   canon           is this something he is SHOWN materialising?
//   cost            RECEIPT STOCK spent. This is the resource that matters.
//   ce              cursed energy spent — small for everything, because
//                   burning a tag is cheap; the tag is the expensive part
//   startup/active/recovery   frames @60
//   effect          key into the effect dispatcher
//   clip            the materialise-and-use animation
//   src             Mahoraga adaptation category — SEE THE NOTE BELOW
//   desc            the wheel's one-line description
//
// *** EVERY OBJECT IS ITS OWN ADAPTATION CATEGORY. *** The brief recommends it
// and it is right, for exactly the reason Toji's four weapons are four
// categories and Kashimo's whole kit is one: adaptation is a response to a
// KIND OF THING ARRIVING, and a ladder and a car are not the same kind of
// thing in any sense a body could learn from. The consequence in the matchup
// is that Mahoraga adapts to Reggie more slowly than to anybody else in the
// game — seven objects plus the junk plus the punches is nine buckets — and
// Reggie's counterplay is simply to rotate, which is also how he plays anyway.
// See `EFFECT_SRC` in combat/effects.js for the machine-readable half.
export const OBJECTS = {
  // ---- 1 · LADDER — THE REACH --------------------------------------------
  // The longest melee hitbox in the game at 4.2 m, and it lasts THREE SWINGS
  // before it buckles. Nothing else he owns contests space in front of him;
  // this is the button that says "not here".
  ladder: {
    key: 'ladder', name: 'ALUMINIUM LADDER', short: 'LADDER', jp: '梯子', canon: false,
    cost: 16, ce: 4, startup: 20, active: 8, recovery: 26,
    effect: 'reggie_ladder', clip: 'mLadder', src: 'reggie_ladder',
    dmg: 15, reach: 4.2, arc: 1.5, kb: 4.2, kbY: 1.0, hitstun: 26,
    swings: 3, destruct: 26, weight: 'mid',
    desc: 'BEST REACH IN THE GAME · THREE SWINGS'
  },

  // ---- 2 · GAS CANISTER — THE SCREEN -------------------------------------
  // CANON (gas is in his stock). Almost no damage. What it does is take away
  // the opponent's ability to SEE him for two and a half seconds — a real
  // vision occlusion, not a debuff icon — which turns his next materialise
  // into a guess. His only mix-up tool.
  canister: {
    key: 'canister', name: 'GAS CANISTER', short: 'GAS', jp: '瓦斯缶', canon: true,
    cost: 10, ce: 3, startup: 16, active: 6, recovery: 22,
    effect: 'reggie_gas', clip: 'mCanister', src: 'reggie_gas',
    dmg: 5, travel: 5.5, radius: 3.6, cloudDur: 2.6, occlude: 0.82,
    kb: 1.2, kbY: 0, hitstun: 12, weight: 'light',
    desc: 'BLINDING CLOUD · NO DAMAGE · HIS ONLY MIX-UP'
  },

  // ---- 3 · DRONE — THE ONE THAT STAYS ------------------------------------
  // CANON. The only object that does not resolve immediately: it hovers,
  // follows the opponent and drops small charges on a cadence for eight
  // seconds, or until somebody shoots it down (it has 22 health and it is a
  // BODY, so it is hittable). Set-and-forget pressure, and the reason he can
  // ever win neutral without spending.
  drone: {
    key: 'drone', name: 'CAMERA DRONE', short: 'DRONE', jp: '無人機', canon: true,
    cost: 20, ce: 5, startup: 18, active: 4, recovery: 24,
    effect: 'reggie_drone', clip: 'mDrone', src: 'reggie_drone',
    hp: 22, life: 8.0, hover: 3.1, speed: 5.4, dropEvery: 1.35,
    dmg: 7, radius: 1.3, kb: 1.6, kbY: 0.4, hitstun: 14, weight: 'light',
    desc: 'HOVERS AND HARASSES · 8 s · CAN BE SHOT DOWN'
  },

  // ---- 4 · FISHING ROD — THE ANSWER TO ZONERS ----------------------------
  // The grapple. It hooks and it pulls, and WHICH BODY MOVES depends on mass:
  // against anybody lighter than him they come to him, against Todo, Panda,
  // Yuki, Hanami, Kurourushi, Dagon and Mahoraga HE goes to THEM. That is not
  // a special case in the code, it is `kbResist` doing its job — see
  // `reggie_rod` in effects.js.
  //
  // It is his approach tool and it is the single most important button in the
  // Uraume, Ryu, Jogo and Nobara matchups.
  rod: {
    key: 'rod', name: 'FISHING ROD', short: 'ROD', jp: '釣竿', canon: false,
    cost: 12, ce: 4, startup: 14, active: 5, recovery: 24,
    effect: 'reggie_rod', clip: 'mRod', src: 'reggie_rod',
    // *** MEASURED AND RETUNED. *** `pull: 9.0` over 0.42 s should be 3.8 m of
    // travel and measured 1.5 m in a live match — the `commanded` state's
    // velocity is fought by friction and by the soft lock, so the nominal
    // number and the real one are not the same thing. 18.0 over 0.55 s lands
    // at just under 4 m of gap closed, which is what a 12.5 m grapple has to
    // be worth to be an approach tool rather than a poke.
    dmg: 8, range: 12.5, speed: 34, pull: 18.0, pullTime: 0.55, hitstun: 22,
    kb: 0, kbY: 0, weight: 'light',
    desc: 'HOOKS AND YANKS · CLOSES ON ZONERS'
  },

  // ---- 5 · MOPED — THE CHARGE --------------------------------------------
  // CANON. He shoves it forward and it drives itself 11 m down the lane,
  // steered by the stick like every other travelling technique in this game.
  // It knocks down, it breaks scenery, and it keeps going through the first
  // thing it hits — so it is his only tool that beats a wake-up.
  moped: {
    key: 'moped', name: 'MOPED', short: 'MOPED', jp: '原付', canon: true,
    cost: 24, ce: 6, startup: 24, active: 10, recovery: 26,
    effect: 'reggie_moped', clip: 'mMoped', src: 'reggie_moped',
    dmg: 22, travel: 11.0, speed: 17, radius: 1.15,
    kb: 6.0, kbY: 1.4, hitstun: 32, type: 'knockdown', destruct: 44,
    weight: 'mid',
    desc: 'DRIVES ITSELF DOWN THE LANE · KNOCKDOWN'
  },

  // ---- 6 · VENDING MACHINE — THE TRAP ------------------------------------
  // Dropped from above onto a MARKED SPOT, with 0.62 s between the marker
  // appearing and the machine arriving. Enormous damage and completely
  // avoidable, which is the correct shape for a move that costs a third of
  // his stock.
  //
  // THE WRECK IS THE REAL VALUE. It stays on the field for 14 seconds as
  // solid cover — it blocks projectiles, it is something to fight around, and
  // it is the only piece of PLAYER-PLACED terrain in the game that is not
  // made of cursed energy. See the persistent-ground audit in the delivery
  // notes for how it behaves under Hanami's roots, Uraume's ice, Jogo's
  // burning ground, Megumi's shadow and Sukuna's shrine.
  vending: {
    key: 'vending', name: 'VENDING MACHINE', short: 'VENDING', jp: '自販機', canon: false,
    cost: 30, ce: 7, startup: 22, active: 6, recovery: 30,
    effect: 'reggie_vending', clip: 'mVending', src: 'reggie_vending',
    dmg: 40, markTime: 0.62, aimRange: 9.0, radius: 1.9,
    kb: 5.0, kbY: 0, hitstun: 40, type: 'knockdown', destruct: 70,
    wreckLife: 14.0, wreckRadius: 1.35, weight: 'heavy',
    desc: 'DROPS FROM ABOVE · TELEGRAPHED · LEAVES COVER'
  },

  // ---- 7 · CAR — THE WHOLE STOCK -----------------------------------------
  // CANON, and the most expensive thing he can do outside the ultimate. 44
  // stock against a 100 cap: throwing a car means he has spent nearly half of
  // everything and cannot follow it up with anything but junk.
  // MEASURED at 67.6 damage against a 235 health bar — 29% of a life for
  // 44 stock, which is the best damage-per-stock in the kit and is paid for
  // entirely by the wind-up below.
  //
  // 46 frames of startup is the second-longest non-ultimate wind-up in the
  // game (behind Geto's special-grade summon at 44 and Sukuna's charged Fire
  // Arrow) and the animation advertises every one of them.
  car: {
    key: 'car', name: 'CAR', short: 'CAR', jp: '車', canon: true,
    cost: 44, ce: 10, startup: 46, active: 12, recovery: 34,
    effect: 'reggie_car', clip: 'mCar', src: 'reggie_car',
    dmg: 52, travel: 16.0, speed: 21, radius: 1.7,
    kb: 13.0, kbY: 5.0, hitstun: 48, type: 'knockdown', destruct: 95,
    weight: 'heavy',
    desc: 'HALF HIS STOCK · MASSIVE · UNMISSABLE WIND-UP'
  }
};

// Wheel order — FIXED FOREVER, because muscle memory depends on it, and
// ordered by cost so the ring reads as a price list going clockwise. Seven
// sectors; `_wheelPick` is written against `order.length` and does not care
// that it is odd (Inumaki's is seven too).
export const OBJECT_ORDER = ['canister', 'rod', 'ladder', 'drone', 'moped', 'vending', 'car'];

// ---------------------------------------------------------------------------
// THE JUNK TABLE — RB, QUICK MATERIALISE
// ---------------------------------------------------------------------------
// *** THE ROLL IS DECORATION AND NEVER A GAMBLE. *** All four entries have
// IDENTICAL frame data, damage, reach and knockback. The only thing that
// varies is which model comes out and which sound it makes. The brief is
// explicit about this and it is right: a neutral tool that sometimes does
// something different is a neutral tool nobody presses.
export const JUNK_TABLE = ['knife', 'cone', 'wrench', 'bottle'];

export const REGGIE = withDefaults({
  id: 'reggie', name: 'REGGIE', title: 'CONTRACTUAL RE-CREATION',
  jpName: 'レジィ・スター',

  // =========================================================================
  // STATS — DELIBERATELY UNREMARKABLE, AND THAT IS THE DESIGN
  // =========================================================================
  // Every number below is within a few percent of the roster mean. He has no
  // stat spike anywhere and no stat hole anywhere, and the brief is right that
  // this IS the character: his identity is entirely what he can afford at any
  // given moment, and a body with an opinion of its own would compete with it.
  //
  // The two places he is not average are both about the RECEIPTS rather than
  // about him: `ceRegen` is a shade high (2.5 against 2.2) because burning
  // tags is his whole kit and a starved Reggie is a Reggie who cannot use the
  // stock he has, and `stamina` is average-plus because he has no meterless
  // pressure at all.
  stats: {
    hp: 100,
    walkSpeed: 2.60, runSpeed: 5.20, dashSpeed: 8.60, jumpVel: 8.80,
    startMaxCE: 40, ceRegen: 2.50, ceGainPerPunch: 6,
    stamina: 106, staminaRegen: 22, dashDrain: 26,
    damageScale: 1.00
  },

  // =========================================================================
  // THE RECEIPT STOCK — 再契象の控え
  // =========================================================================
  // The second resource, next to the cursed-energy bar, and the one that
  // decides what he is allowed to be at any moment.
  //
  // THE SHAPE OF IT:
  //   · It starts at 46 of a 100 cap — enough for a moped or a drone, not
  //     enough for a car. His opening is deliberately modest.
  //   · It regenerates at 4.6/s doing nothing, which is 21.7 s from empty to
  //     full. That is slow, and it is meant to be: a Reggie who has just
  //     thrown a car has really spent it.
  //   · IT REGENERATES FASTER WHEN HE IS WINNING. Every landed punch pays 3.2,
  //     every landed object pays its own `earn`, and a landed heavy pays 6.
  //     He is EARNING as the fight goes, which is the brief's framing and is
  //     also the only thing that makes the economy playable — see the honesty
  //     note in the delivery report.
  //   · A BLOCKED hit pays a third. Chip is still trade.
  //
  // THE NUMBERS, DERIVED RATHER THAN GUESSED, AND THEN MEASURED. A neutral
  // exchange where he lands one punch string (3 x 4.0 = 12) plus 2 s of idle
  // regen (11.6) is 23.6 stock — a canister and a rod, or most of a moped.
  // Three such exchanges is a car. That is the intended rhythm: he spends most
  // of the round in the 10-30 band throwing mid-cost objects, and a car is
  // something he EARNS about three times a round.
  //
  // Every one of these numbers moved up after the first measured matches; see
  // the note on `regen`. The honest summary is in the delivery report: the
  // first pass had the economy about 25% too tight, and a resource character
  // who cannot reach his own expensive half is just a weak character.
  receipts: {
    max: 100,
    start: 46,
    // *** RAISED FROM 4.6 AFTER MEASURED MATCHES. *** Bot-versus-bot at 4.6,
    // he lost 235-to-193 and 53-to-112 against Ino and finished a 45-second
    // round holding 8 stock, having never once afforded a drone or a vending
    // machine. An economy that never lets the character reach his own top
    // half is not an economy, it is a cap. 5.8/s is 17 seconds from empty to
    // full instead of 22.
    regen: 5.8,               // per second, always running
    perPunch: 4.0,            // per landed normal
    perHeavy: 7.5,            // per landed heavy
    blockedMult: 0.34,        // a blocked hit still pays, at a third
    // What a landed OBJECT pays back, as a fraction of the damage it dealt.
    // Deliberately less than it cost: a landed car deals ~68 and therefore
    // returns ~20 against its 44, so even a perfect car is a net spend of 24.
    // *** NOTHING HE DOES REFUNDS ITSELF. *** That is the line that stops the
    // economy from collapsing into "throw the big thing forever", and it is
    // why the return is denominated in DAMAGE rather than in cost — an object
    // that whiffs pays nothing at all.
    perObject: 0.30,
    // ---- WATER, AND IT IS CANON --------------------------------------------
    // A wet receipt cannot be burned. Anything in this game that soaks him
    // LOCKS THE STOCK: he keeps the number, he simply cannot spend it, and the
    // regen halts for the duration. The list of what counts is in
    // combat/receipts.js `WET_SOURCES` and it is short and specific —
    // Dagon's water, the ocean shikigami's spray, Ino's Reiki water, Miwa's
    // rain-slick circle is NOT on it (it is not water, it is a barrier).
    //
    // 3.2 s is long. It is the hardest single counter any character in this
    // game has to another and it is exactly what killed him in the source.
    waterLock: 3.2,
    // A HUD nicety: the stock is displayed as a running yen total, because the
    // tags have yen totals printed on them. 1 stock = ¥1,000.
    yenPerStock: 1000
  },

  // ---- X · THE STRING -----------------------------------------------------
  // Average in every number. What is his about it is the THIRD hit: a
  // materialised object appears in his hands as he shoves, rolled off the junk
  // table for flavour. It changes nothing mechanically — same damage, same
  // launch — and it costs no stock. It is there because a character whose
  // whole identity is "things appear" should not have a punch string in which
  // nothing appears.
  // *** THE REACH WAS THE SINGLE WORST NUMBER IN EITHER CHARACTER AND IT WAS
  // AUTHORED AS CHARACTERISATION. *** He is a man who has never trained, so
  // the first pass gave him the shortest punches on the roster — 1.38 / 1.46 /
  // 1.52 against Yuji's 1.40 / 1.50 / 1.55 and Panda's 1.55 / 1.62 / 1.70 —
  // and the shortest approach step as well, 1.7 against 2.2. He is also the
  // second-TALLEST fighter in the game at 1.86 m. Instrumented over a full
  // match against Yuji: fifty-four punches thrown and 1.8 total damage dealt.
  // Not blocked. WHIFFED. A tall man with short arms does not read as untrained,
  // it reads as a broken hitbox, and it left him with no free offence at all —
  // which for a character whose whole design is "the expensive half is behind a
  // resource" is the difference between an economy and a cage.
  //
  // The reach is now half a step above Yuji's and still well below Panda's,
  // which is the band a normal adult belongs in. The CHARACTERISATION moved to
  // where it belongs: the startup and recovery frames stay the roster's
  // slowest for a light string (6/7/10 up, 12/14/20 back), so he is still slow
  // and still loose and still nobody's idea of a martial artist — he just
  // reaches what he swings at.
  punches: [
    { name: 'Swat', dmg: 4.2, startup: 6, active: 3, recovery: 12, reach: 1.50, kb: 1.6, kbY: 0, hitstun: 14, type: 'light', step: 2.0 },
    { name: 'Backhand', dmg: 5.0, startup: 7, active: 3, recovery: 14, reach: 1.58, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 2.0 },
    { name: 'Heave', dmg: 8.2, startup: 10, active: 4, recovery: 20, reach: 1.66, kb: 3.6, kbY: 7.6, hitstun: 26, type: 'launcher', step: 2.3, junkOnThird: true }
  ],

  heavy: {
    name: 'Haymaker', dmg: 14, startup: 17, active: 5, recovery: 30,
    reach: 1.98, kb: 5.5, kbY: 0, hitstun: 30, step: 2.4,
    staminaCost: 20, armorFrames: 0, ceGain: 1.6, clip: 'heavy'
  },

  // ---- RB · CT1 — QUICK MATERIALISE 速契 ----------------------------------
  // The furthest-reaching of the pair by default (9.5 m against the wheel's
  // variable), which satisfies the roster's slot convention — see THE SLOT
  // CONVENTION in schema.js. It is cheap in both resources, it is fast, and it
  // is the only thing he can do while broke.
  //
  // COSTS 4 STOCK. Not zero. A Reggie at zero stock genuinely cannot throw
  // anything, and that floor is what makes the ultimate's cost mean something.
  ct1: {
    name: 'QUICK MATERIALISE', jpName: '速契', cost: 5,
    startup: 9, active: 4, recovery: 16,
    effect: 'reggie_junk', clip: 'ct1',
    stock: 3,
    dmg: 11, range: 9.5, speed: 26, radius: 0.55,
    kb: 2.4, kbY: 0.3, hitstun: 18, destruct: 8
  },

  // ---- RT · CT2 — MATERIALISE 契象 ----------------------------------------
  // THE SLOT IS A WHEEL. Everything about this move — cost, startup, damage,
  // effect and reach — is bound at runtime from `OBJECTS`, so the convention
  // is a rule about the WHEEL'S CONTENT rather than about this config. Same
  // shape Megumi, Geto and Inumaki already have, and schema.js lists it as one
  // of the four documented exceptions.
  //
  // The numbers here are the FALLBACK for anything that reads the config
  // without going through the binding (the debug overlay, the balance
  // harness): they are the gas canister's, the cheapest object.
  ct2: {
    name: 'MATERIALISE', jpName: '契象', cost: 6,
    startup: 16, active: 6, recovery: 22,
    effect: 'reggie_object', clip: 'mCanister',
    objectSlot: true,
    dmg: 5, range: 5.5
  },

  // ---- LT · BLOCK / LB · DASH ---------------------------------------------
  // Average, stated explicitly. He is not a defensive character and he is not
  // a bad one either; the guard is exactly the roster's, and the flinching
  // animation is doing all the characterisation.
  blockChipMult: 1.0,
  blockStaminaMult: 1.0,
  blockStartupFrames: 3,

  // ---- MASS ---------------------------------------------------------------
  // A fit adult man. Everything here is within a hair of the roster mean, for
  // the same reason the stats are.
  kbResist: 1.0,
  launchResist: 1.0,
  size: {
    height: 1.86,
    bodyRadius: 0.30,
    pushRadius: 0.48,
    hurtRadius: 0.68, hurtHeight: 1.58, hurtCenter: 1.05, hurtPad: 0.14,
    strikeY: 1.28,
    stepShake: 0.02,
    camDist: 1.0, camHeight: 0, camPitch: 0
  },

  // ---- B · SPECIAL — THE RECEIPT WHEEL ------------------------------------
  // The sixth radial in the game, and it reuses `_openWheel` / `_wheelPick`
  // and the shared `wheel` STATE wholesale — the same call Inumaki's command
  // ring already made. What differs is only what the sectors are and what
  // confirming does, and both are read off `cfg.objects`.
  //
  // `avail` excludes any object the stock cannot currently pay for, which is
  // the genuinely new thing: THE RING IS ALSO THE READOUT OF WHAT HE CAN
  // AFFORD. A greyed sector is not selectable, the stick rolls past it, and
  // the default falls through to the first object he can still buy — so the
  // wheel can never land on something that would be refused at release.
  //
  // It costs a token 5 cursed energy and NO STOCK. Choosing is not buying.
  special: {
    key: 'reggie_wheel', name: 'RECEIPT WHEEL', jp: '契象選択',
    cost: 3, cooldown: 2.4, clip: 'wheel',
    timeScale: 0.62, maxHold: 3.2, stateFrames: 8
  },

  objects: {
    defs: OBJECTS,
    order: OBJECT_ORDER,
    default: 'canister',
    junk: JUNK_TABLE
  },

  // ---- D-pad RIGHT · ULTIMATE — CLEARING THE REGISTER 全契焼却 ------------
  // NON-DOMAIN: standard gate (MAX_CE 100 + a full bar), full bar cost,
  // standard backlash, and the fast non-domain startup.
  //
  // He burns EVERY TAG HE IS CARRYING at once and throws the lot, ending on
  // whatever the most expensive thing he could still afford was. The barrage
  // is 3.4 s of objects arriving at 5.2 per second, and the finisher object at
  // the end is picked by what his stock was WHEN HE PRESSED IT:
  //
  //     stock >= 48   a car
  //     stock >= 34   a vending machine
  //     stock >= 26   a moped
  //     otherwise     the drone, which is a very sad ending and is meant to be
  //
  // *** IT COSTS THE ENTIRE STOCK AS WELL AS THE BAR, AND THE STOCK DOES NOT
  // COME BACK FOR 6 SECONDS. *** `stockLock` below halts regeneration
  // completely for six seconds after the barrage ends, so a Reggie who has
  // used his ultimate is a man with a punch string for a quarter of a minute.
  // That is the tradeoff the brief asks for and it is genuinely severe: no
  // other ultimate in this game removes the character's kit afterwards.
  //
  // THE DAMAGE SCALES WITH WHAT HE SPENT, which is the payoff for having
  // managed the stock rather than dumping it:
  //     dmg = baseDmg + spentStock * dmgPerStock
  // At 100 stock that is 34 + 100 x 0.62 = 96 over the barrage; at 20 stock it
  // is 46. A full-stock ultimate is a round-ender and an empty-stock one is a
  // waste of a bar, and the HUD shows him exactly which he is about to get.
  ultimate: {
    kind: 'burst', name: 'CLEARING THE REGISTER', jpName: '全契焼却',
    startup: 30, active: 8, recovery: 22,        // 60f — the fast non-domain gate
    effect: 'reggie_register', clip: 'ult',
    duration: 3.4, rate: 5.2, throwClip: 'ultThrow',
    // *** MEASURED AND RETUNED. *** The first pass used baseDmg 34 /
    // dmgPerStock 0.62 with kb 2.2 per thrown object, which reads fine on
    // paper and was badly wrong in the game: measured against a STATIONARY
    // target at 6 m, a full-stock barrage landed 34.7 damage out of a
    // theoretical 96, because the FIRST object knocked the target two metres
    // back and the other seventeen were aimed at where they used to be.
    //
    // The knockback was the bug, not the damage. Eighteen objects each
    // shoving the target is not a barrage, it is one hit and seventeen
    // whiffs — so `kb` drops to 0.55 (enough to visibly rock them, not enough
    // to move them out of the stream), the radius widens to 1.35, and the
    // per-object hitstun drops to 10 so the volley reads as a rattle rather
    // than as a lock. The FINALE keeps its full knockback: that one is
    // supposed to move them, because it is the last thing that happens.
    // *** THIRD AND FINAL MEASUREMENT PASS, AND THE FIRST TWO WERE MEASURING
    // A THROTTLED BROWSER. *** The harness was polling across one long sleep,
    // which lets Chromium throttle rAF and therefore the whole game loop, and
    // both earlier passes read a barrage that had only fired seven of its
    // eighteen objects. Re-measured in short slices the same code lands all
    // nineteen hits — see the warning now at the top of tools/playtest.mjs.
    //
    // So the numbers below are tuned DOWN rather than up. Measured, at 6 m
    // against a stationary target, total damage including the finale:
    //
    //   100 stock   ~127   54% of a health bar — a round-ender, and it should
    //                      be: it costs a full bar, the ENTIRE stock, and 4.6
    //                      seconds afterwards with no kit at all
    //    48 stock    ~99   about a car and a half
    //    26 stock    ~87   the moped finale
    //     0 stock    ~29   a wasted bar, and it is meant to be — this is what
    //                      pressing it while broke looks like
    //
    // The spread from 29 to 127 is the whole point of the move: it is the only
    // ultimate in this game whose value is decided by how the player managed a
    // resource for the ninety seconds before pressing it.
    baseDmg: 22, dmgPerStock: 0.42,
    perHit: 9, radius: 1.8, kb: 0.55, kbY: 0.25, hitstun: 10, destruct: 22,
    // the object it ends on, by stock spent
    finale: [[44, 'car'], [30, 'vending'], [24, 'moped'], [0, 'drone']],
    // The finale is 34 rather than the car's own 52: it is the LAST of
    // nineteen hits rather than a car thrown from neutral, and at 52 it was
    // worth more than the entire barrage in front of it.
    finaleDmg: 34, finaleKb: 11.0, finaleKbY: 4.2, finaleHitstun: 44, finaleDestruct: 80,
    stockLock: 6.0,
    backlash: { duration: 8, regenMult: 0.5, growthMult: 0.5 }
  },

  // canon-correct: an ANTI-domain technique is not a domain
  domain: null,

  // ---- 彌虚葛籠 HOLLOW WICKER BASKET --------------------------------------
  // The universal Simple Domain, wearing its own name and its own geometry for
  // the one character in the game who canonically uses the Heian-era version
  // instead. Nothing mechanical changes — same drain, same sure-hit
  // neutralisation, same everything — because the two techniques do the same
  // job and combat/newshadow.js already implements that job once.
  //
  // What DOES change is what it is called on the HUD and what it looks like: a
  // woven sphere of interlocking staves rather than a cut circle. See
  // `simpleDomainAs` in fx/newshadowfx.js.
  simpleDomainDrain: 20,
  simpleDomainAs: {
    name: 'HOLLOW WICKER BASKET', jp: '彌虚葛籠', romaji: 'IYAKO TSUZURA',
    style: 'wicker', color: 0xc4a468
  },

  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // THE CAR. Copy holds one attack, and the question "what did you take off
  // Reggie" has exactly one recognisable answer.
  //
  // Deliberately NOT the wheel and NOT the stock: Yuta has no receipts, so a
  // copied wheel would be a radial full of things he cannot pay for, which is
  // the clearest possible sign that the stock is a resource rather than a
  // technique. Copy holds attacks; this is the attack. Yuta's copy pays no
  // stock — see the `stock` guard in `reggie_car`.
  copyEffect: { effect: 'reggie_car', dmg: 40, name: 'Copied: Car' }
});
