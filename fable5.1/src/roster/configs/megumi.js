// MEGUMI — Ten Shadows Technique. The summoner and the most technical member
// of the roster. Average everything on paper: no standout normal, no oppressive
// damage, no defensive get-out. What he has is the field — six shikigami he
// binds to his two technique slots on the fly, and a shadow that lets him
// exceed every limit he normally plays under.
//
// The hook that makes him different from Mahito (the other summoner): PERMANENT
// LOSS. Mahito's transfigured human is disposable and re-summonable. Megumi's
// shikigami are finite — kill one and it is gone for the match. He gets weaker
// across a long fight if he spends them carelessly, and the only way to get
// them back is the domain.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE SHIKIGAMI ROSTER
// ---------------------------------------------------------------------------
// One entry per summon. `cost` is CURRENT_CE, `cooldown` is seconds on that
// shikigami specifically (each has its own timer — they do not share one), `hp`
// is how much punishment the body takes before it is LOST FOR THE MATCH, and
// startup/active/recovery are Megumi's own frames while he performs the summon.
// `slots` is how many of the active-summon limit this occupies (Divine Dogs put
// two bodies on the field for one slot — that pair is one summon).
//
// Read the table top to bottom as a cost curve: Rabbit Escape is the panic
// button, Dogs are the default, Elephant is the whole bar.
export const SHIKIGAMI_DEFS = {
  divineDogs: {
    key: 'divineDogs', name: 'DIVINE DOGS', jp: '玉犬', short: 'DOGS',
    cost: 22, cooldown: 7, hp: 26, slots: 1, color: 0xdfe6f2,
    startup: 16, active: 2, recovery: 18, clip: 'summonLow',
    // two independent bodies. Fast, low damage, high pressure — they interrupt.
    pair: true, dmg: 3.5, hitstun: 14, kb: 1.3,
    speed: 6.4, lungeSpeed: 9.5, reach: 1.25, swingEvery: 1.25,
    life: 26,            // they fade on this timer even if never killed
    ceFeed: 0.35,        // fraction of a punch's MAX_CE growth their bites feed
    desc: 'PAIR · FAST · INTERRUPTS'
  },
  nue: {
    key: 'nue', name: 'NUE', jp: '鵺', short: 'NUE',
    cost: 26, cooldown: 9, hp: 22, slots: 1, color: 0xc8a05a,
    startup: 20, active: 2, recovery: 20, clip: 'summonClap',
    dmg: 8, hitstun: 26, kb: 3.0, stun: 0.75,   // the dive briefly stuns on hit
    speed: 7.2, reach: 1.6, swingEvery: 2.6, flyHeight: 3.4,
    life: 22, ceFeed: 0.4,
    carry: { dur: 0.85, speed: 13, height: 4.2 }, // it can lift Megumi and move him
    desc: 'AERIAL · DIVE · STUNS'
  },
  toad: {
    key: 'toad', name: 'TOAD', jp: '蝦蟇', short: 'TOAD',
    cost: 18, cooldown: 8, hp: 20, slots: 1, color: 0x6f8a72,
    startup: 18, active: 2, recovery: 18, clip: 'summonLow',
    // utility: the tongue drags them to Megumi, and it eats one hit for him
    dmg: 4, hitstun: 20, kb: 0,
    tongueRange: 7.5, dragSpeed: 9, swingEvery: 3.4, reach: 7.5,
    guard: true,         // intercepts ONE incoming hit for Megumi, then despawns
    speed: 2.2, life: 20, ceFeed: 0.3,
    desc: 'GRAB · DRAG · BODY-BLOCKS'
  },
  serpent: {
    key: 'serpent', name: 'GREAT SERPENT', jp: '大蛇', short: 'SERPENT',
    cost: 30, cooldown: 12, hp: 34, slots: 1, color: 0xe8e4dc,
    startup: 26, active: 3, recovery: 26, clip: 'summonPoint',
    // travels along the ground from the shadow, coils, pins. Slow and loud.
    dmg: 14, hitstun: 36, kb: 1.0, pin: 1.35,
    travelSpeed: 11, reach: 1.9, swingEvery: 4.0, speed: 4.6,
    life: 18, ceFeed: 0.5,
    desc: 'GROUND RUSH · PINS'
  },
  elephant: {
    key: 'elephant', name: 'MAX ELEPHANT', jp: '満象', short: 'ELEPHANT',
    cost: 48, cooldown: 20, hp: 55, slots: 2, color: 0xb9bec8,
    startup: 34, active: 3, recovery: 34, clip: 'summonBoth',
    // the whole bar and the whole screen. Torrent radius is the payoff.
    dmg: 26, hitstun: 40, kb: 9, kbY: 3.5,
    torrentRadius: 4.6, torrentDelay: 0.55, torrentEvery: 3.6,
    speed: 1.6, reach: 2.6, swingEvery: 3.6,
    life: 16, ceFeed: 0.6,
    desc: 'HIGH COST · TORRENT · HEAVY'
  },
  rabbits: {
    key: 'rabbits', name: 'RABBIT ESCAPE', jp: '脱兎', short: 'RABBITS',
    cost: 14, cooldown: 10, hp: 14, slots: 1, color: 0xf0ecec,
    startup: 12, active: 2, recovery: 14, clip: 'summonLow',
    // near-zero damage. The point is the screen full of bodies: it obscures,
    // it pushes, and it buys him the two seconds he needed.
    swarm: 22, dmg: 0.8, hitstun: 8, kb: 0.9, pushRadius: 3.2, pushForce: 7,
    speed: 5.4, reach: 0.8, swingEvery: 0.9,
    life: 5.5, ceFeed: 0.15,
    desc: 'PANIC · OBSCURES · PUSHES'
  },

  // =========================================================================
  // THE THREE ADDITIONS — Round Deer, Piercing Ox, Tiger Funeral
  // =========================================================================

  // ROUND DEER 円鹿 — THE SUSTAIN HE DID NOT HAVE.
  // Canon function, verified: it "can output positive energy from reverse
  // cursed technique. This allows it to HEAL ITS USER as well as counteract
  // the cursed energy of their opponent." Sukuna heals himself by touching his
  // hand to its nose.
  //
  // So it does NOT attack. At all. `dmg: 0` is not a balance number, it is the
  // creature — a shikigami whose entire output is keeping Megumi alive, which
  // is a thing his kit genuinely lacked (every other summon was pressure).
  //
  // The two halves of the canon description are both here:
  //   HEAL      `heal.rate` HP/s to the owner while he is inside `heal.radius`
  //   NEUTRALISE `heal.ceDrain` — it eats the OPPONENT's cursed energy in the
  //             same field, which is the "counteract the cursed energy of
  //             their opponent" clause and is far more interesting in a
  //             fighting game than a raw heal on its own.
  // FRAGILE ON PURPOSE: 16 HP is the lowest body in the set after the rabbits.
  // It cannot defend itself and it will die to two clean hits, so leaving it
  // out is a bet that the opponent is busy.
  roundDeer: {
    key: 'roundDeer', name: 'ROUND DEER', jp: '円鹿', short: 'DEER',
    cost: 26, cooldown: 16, hp: 16, slots: 1, color: 0xffd98a,
    startup: 22, active: 2, recovery: 22, clip: 'summonLow',
    support: true,                 // never targets, never strikes
    dmg: 0, hitstun: 0, kb: 0,
    heal: { rate: 3.2, radius: 4.0, ceDrain: 3.0, tick: 0.25 },
    speed: 4.2, reach: 0, swingEvery: 99,
    life: 20, ceFeed: 0,
    desc: 'HEALS MEGUMI · CANNOT ATTACK'
  },

  // PIERCING OX 貫牛 — THE RUNWAY.
  // Canon function, verified and quoted: "It's a strong offensive shikigami
  // that attacks by ramming into its target head first. PIERCING OX CAN ONLY
  // CHARGE IN A STRAIGHT LINE, BUT THE LONGER THE CHARGE, THE MORE POWERFUL
  // ITS ATTACK." Yorozu works this out mid-fight and it is the single stated
  // fact about the creature.
  //
  // THE DISTANCE SCALING IS THE WHOLE SUMMON and it is implemented as real
  // distance travelled, not as a charge timer and not as a flat hit:
  //
  //     dmg = chargeMin + travelled_metres * dmgPerMetre     (capped at chargeMax)
  //
  // At 0 m that is 5 — worse than a jab. At the 16 m cap it is 53, the biggest
  // single number any shikigami puts out, bigger than Max Elephant's torrent.
  // It also means the OX BACKS AWAY BEFORE IT COMMITS, which telegraphs
  // enormously and is exactly the counterplay: close the gap and it is
  // harmless; let it get to the other side of the map and it is lethal.
  piercingOx: {
    key: 'piercingOx', name: 'PIERCING OX', jp: '貫牛', short: 'OX',
    cost: 32, cooldown: 15, hp: 42, slots: 1, color: 0xd8c24a,
    startup: 26, active: 3, recovery: 26, clip: 'summonPoint',
    // the charge
    chargeMin: 5, dmgPerMetre: 3.0, chargeMax: 53,
    chargeSpeed: 15.5, runwayWant: 9.5, runwayMax: 16, runwaySpeed: 6.0,
    // it cannot turn once committed — the straight line is canon and it is the out
    chargeTurnRate: 0.55, overrun: 2.2,
    hitstun: 40, kb: 9.5, kbY: 2.4,
    dmg: 5,                        // the floor, used by cross-summon contact
    speed: 5.0, reach: 2.0, swingEvery: 3.2,
    life: 20, ceFeed: 0.5,
    desc: 'CHARGE · DAMAGE SCALES WITH DISTANCE'
  },

  // TIGER FUNERAL 虎葬 — THE RELIABLE PICK.
  // *** ITS APPEARANCE AND ITS KIT ARE ORIGINAL INTERPRETATION, NOT CANON. ***
  // What IS canon: the name, the kanji 虎葬, that it is a Ten Shadows
  // shikigami, and that Sukuna fused it into Merged Beast Agito during the
  // Shinjuku Showdown. The wiki is explicit that its appearance "has not yet
  // been shown" and its capabilities "are unknown, as it has yet to be
  // summoned outright."
  //
  // The kit below is designed, not researched. It follows fan consensus that a
  // shikigami contributing Agito's striped torso and tiger-like feet is an
  // all-purpose melee beast in the mould of the Divine Dogs, and it is
  // deliberately built with NO STANDOUT STRENGTH AND NO STANDOUT WEAKNESS:
  // every number below sits between the Dogs' and the Serpent's. It is the
  // summon you pick when you do not have a read.
  tigerFuneral: {
    key: 'tigerFuneral', name: 'TIGER FUNERAL', jp: '虎葬', short: 'TIGER',
    cost: 28, cooldown: 11, hp: 32, slots: 1, color: 0xe2ded6,
    startup: 20, active: 2, recovery: 20, clip: 'summonLow',
    original: true,                // flagged so the HUD can mark it
    dmg: 9, hitstun: 24, kb: 3.2,
    speed: 6.8, lungeSpeed: 11.5, reach: 1.7, swingEvery: 1.7,
    pounceEvery: 5.5, pounceRange: 6.5, pounceDmg: 13,
    life: 22, ceFeed: 0.4,
    desc: 'ALL-ROUNDER · NO WEAKNESS'
  },

  // =========================================================================
  // THE FUSIONS
  // =========================================================================
  // Three of them, and they are NOT one mechanic three times — canon gives
  // each a different rule and each rule is implemented as written.
  //
  // `fusion` on a def declares:
  //   parts     the component keys
  //   consume   whether fusing spends them permanently
  //   requireAlive  whether the components must be un-destroyed to fuse
  //   unlockOnLoss  a component whose DESTRUCTION unlocks this instead

  // MERGED BEAST AGITO 嵌合獣 顎吐 — the big one.
  // Component list VERIFIED from research: NUE + GREAT SERPENT + ROUND DEER +
  // TIGER FUNERAL. (Canon hedges on whether destroying the components is
  // required — "it is unknown if the destruction of the other shikigami is
  // required for Nue: Totality to inherit their abilities" — so the game makes
  // the call the brief asks for: fusing CONSUMES them.)
  //
  // THE COST IS THE POINT. Four of his eleven entries, gone for the match,
  // including his only healer and his best control tool. What he gets back is
  // the strongest thing in his kit for a limited window.
  agito: {
    key: 'agito', name: 'MERGED BEAST AGITO', jp: '嵌合獣 顎吐', short: 'AGITO',
    fullName: 'NUE: TOTALITY — MERGED BEAST AGITO', jpFull: '鵺「渾」嵌合獣 顎吐',
    cost: 55, cooldown: 40, hp: 110, slots: 2, color: 0xdd8f3c,
    startup: 40, active: 4, recovery: 38, clip: 'summonBoth',
    fusion: { parts: ['nue', 'serpent', 'roundDeer', 'tigerFuneral'], consume: true, requireAlive: true },
    // devastating and persistent for a limited window, then it dissolves
    life: 18,
    dmg: 18, hitstun: 34, kb: 4.0,
    speed: 5.4, reach: 2.6, swingEvery: 1.5,
    // GRAB — canonically what it does: it repeatedly tried to grab Gojo so
    // Mahoraga could hit him. Here it grabs and holds, which is the setup tool.
    grabEvery: 5.0, grabRange: 3.2, grabHold: 1.1, grabDmg: 14,
    // NUE'S ELECTRICITY — "generated a current of electricity between its
    // palms". A wide arc that stuns.
    zapEvery: 6.5, zapRange: 7.5, zapDmg: 24, zapStun: 0.9, zapCharge: 0.85,
    // ROUND DEER'S REVERSE CURSED TECHNIQUE — it regenerates itself AND heals
    // Megumi, which is why Gojo prioritised killing it over Mahoraga.
    regen: 3.4, ownerHeal: 1.6, healRadius: 6.0,
    ceFeed: 0.55,
    desc: 'FUSION · GRABS · SHOCKS · REGENERATES'
  },

  // DIVINE DOG: TOTALITY 玉犬「渾」 — the inheritance fusion.
  // Canon is INHERITANCE, not combination: the white dog was killed, and "the
  // power of the deceased white dog was passed on to its black twin to allow
  // it to become Divine Dog: Totality". So the canonical trigger is the
  // OPPOSITE of Agito's — it is unlocked BY a loss rather than paid for with
  // one.
  //
  // The game honours both readings, because both are true of the same summon:
  //   · WITH THE DOGS ALIVE it behaves like Agito — fusing CONSUMES the pair.
  //   · WITH THE DOGS ALREADY DESTROYED it is available for free, because
  //     canonically that is precisely when it exists at all.
  // Which means losing the Divine Dogs is the one permanent loss in Megumi's
  // kit that GIVES him something, and that is exactly the beat the manga has.
  totality: {
    key: 'totality', name: 'DIVINE DOG: TOTALITY', jp: '玉犬「渾」', short: 'TOTALITY',
    cost: 34, cooldown: 18, hp: 46, slots: 1, color: 0xbfe0ff,
    startup: 24, active: 2, recovery: 24, clip: 'summonClap',
    fusion: { parts: ['divineDogs'], consume: true, unlockOnLoss: 'divineDogs' },
    // "immense speed and powerful claws capable of damaging special grade
    // cursed spirits" — the fastest thing Megumi can put on the field
    dmg: 13, hitstun: 28, kb: 3.6,
    speed: 9.6, lungeSpeed: 15, reach: 2.0, swingEvery: 1.15,
    life: 20, ceFeed: 0.45,
    desc: 'FUSION · FASTEST · HEAVY CLAWS'
  },

  // THE WELL'S UNKNOWN ABYSS 不知井底 — the fusion that costs nothing.
  // Canon, and quoted: winged toads that "can be destroyed WITHOUT ANY
  // CONSEQUENCE, and can be summoned SO LONG AS NUE AND THE TOAD ARE ALIVE."
  // So: requires both alive, consumes neither, and the toads themselves are
  // never recorded as a loss. It is Megumi's own extension technique in canon
  // and it is the counterexample that stops "fusion" meaning one thing.
  //
  // What they do is also canon: "use their tongues to RESTRAIN opponents or
  // CATCH PROJECTILE ATTACKS." Both are implemented — the second one is the
  // interesting half, because nothing else in the game eats a projectile.
  wellsAbyss: {
    key: 'wellsAbyss', name: "THE WELL'S UNKNOWN ABYSS", jp: '不知井底', short: 'ABYSS',
    cost: 20, cooldown: 12, hp: 18, slots: 1, color: 0x9ec46a,
    startup: 18, active: 2, recovery: 18, clip: 'summonBoth',
    fusion: { parts: ['nue', 'toad'], consume: false, requireAlive: true },
    expendable: true,              // never recorded as a permanent loss
    count: 3,
    dmg: 3.5, hitstun: 18, kb: 0.6,
    tongueRange: 6.0, swingEvery: 2.2, rootTime: 0.7,
    intercepts: 2,                 // projectiles the flight will catch
    speed: 6.0, reach: 6.0,
    life: 14, ceFeed: 0.2,
    desc: 'FLIGHT · RESTRAINS · CATCHES PROJECTILES'
  },

  // MAHORAGA — present so the wheel shows the whole technique, and LOCKED.
  // It is summoned by the ritual during the domain cast (see `ritual` below),
  // never off the wheel, so `ritualOnly` keeps it visible and unselectable.
  // Nothing about the existing ritual changes; this entry is a HUD entry.
  mahoraga: {
    key: 'mahoraga', name: 'MAHORAGA', jp: '摩虚羅', short: 'MAHORAGA',
    fullName: 'EIGHT-HANDLED SWORD DIVERGENT SILA DIVINE GENERAL MAHORAGA',
    jpFull: '八握剣異戒神将魔虚羅',
    ritualOnly: true, cost: 0, cooldown: 0, hp: 1, slots: 2, color: 0xb9bec8,
    dmg: 0, life: 1, swingEvery: 99, speed: 0, reach: 0,
    desc: 'RITUAL ONLY · DOMAIN CAST'
  }
};

// wheel order, clockwise from the top — muscle memory depends on this never
// changing, so it is written once here and read by the UI, the CPU and the HUD.
// The six originals keep their positions exactly; everything new is appended,
// so nobody's hands have to relearn where the Dogs are.
export const SHIKIGAMI_ORDER = [
  'divineDogs', 'nue', 'toad', 'serpent', 'elephant', 'rabbits',
  'roundDeer', 'piercingOx', 'tigerFuneral',
  'totality', 'wellsAbyss', 'agito', 'mahoraga'
];

// the three fusion entries, in the order the HUD lists them
export const FUSION_ORDER = ['totality', 'wellsAbyss', 'agito'];

export const MEGUMI = withDefaults({
  id: 'megumi', name: 'MEGUMI', title: 'TEN SHADOWS — SUMMONER',
  stats: {
    // average across the board on purpose. The dash is the one number nudged
    // up: he needs to be able to leave, because he wins from position.
    hp: 100, walkSpeed: 2.6, runSpeed: 5.2, dashSpeed: 9.2, jumpVel: 8.8,
    startMaxCE: 40, ceRegen: 2.4, ceGainPerPunch: 6, damageScale: 1.0,
    stamina: 100, staminaRegen: 22, dashDrain: 26
  },
  // 3-hit string with the cursed tool: average speed, average damage, decent
  // reach from the blade. Nothing here wins a fight — it builds the bar that
  // pays for the shikigami that do.
  punches: [
    { dmg: 4, startup: 7, active: 3, recovery: 12, reach: 1.55, kb: 1.6, kbY: 0, hitstun: 14, type: 'light', step: 1.7 },
    { dmg: 5, startup: 7, active: 3, recovery: 14, reach: 1.60, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 1.7 },
    { dmg: 8, startup: 10, active: 4, recovery: 20, reach: 1.70, kb: 3.4, kbY: 7.6, hitstun: 26, type: 'launcher', step: 2.0 }
  ],
  // HEAVY — a two-handed overhead chop with the cursed tool
  heavy: {
    name: 'Cleaving Chop', dmg: 15, startup: 17, active: 5, recovery: 29,
    reach: 2.0, kb: 5.4, hitstun: 30, step: 2.3, staminaCost: 20, clip: 'heavy'
  },

  // ---- the two bound shikigami slots --------------------------------------
  // These are markers, not normal techniques: cost, frame data and clip all
  // come from whichever shikigami is currently bound (see SHIKIGAMI_DEFS and
  // Fighter.startShikigami). The defaults below are the opening loadout.
  shikigami: {
    defaults: { ct1: 'divineDogs', ct2: 'nue' },
    activeLimit: 2,       // slots, not bodies — Dogs are one summon of two wolves
    defs: SHIKIGAMI_DEFS,
    order: SHIKIGAMI_ORDER
  },
  ct1: { name: 'SHIKIGAMI I', cost: 22, shikigamiSlot: true, effect: 'megumi_shikigami' },
  ct2: { name: 'SHIKIGAMI II', cost: 26, shikigamiSlot: true, effect: 'megumi_shikigami' },

  // ---- SPECIAL — THE SHIKIGAMI WHEEL (B, HOLD) -------------------
  // Hold to open a radial selector; the game keeps running and time slows a
  // little, so opening it in someone's face is a real risk. Stick picks the
  // shikigami, RB/RT picks which slot it lands in, release confirms.
  // Cheap and short — re-binding mid-fight is meant to be part of the rhythm,
  // not a once-a-round commitment.
  special: {
    key: 'megumi_wheel', name: 'SHIKIGAMI WHEEL', cost: 6, cooldown: 3.5,
    clip: 'wheel', timeScale: 0.62, maxHold: 3.5, stateFrames: 8
  },

  ultimate: { kind: 'domain' },

  // ---- THE SUMMON RITUAL (B DURING the domain cast) --------------
  // The one shikigami that cannot be called with a hand sign alone. While
  // CHIMERA SHADOW GARDEN is still being cast — before the barrier resolves —
  // the SPECIAL button abandons it and begins the ritual for MAHORAGA
  // instead. The bar is already spent by then, so the domain is consumed
  // either way: he never gets both. Once per match.
  //
  // This flag is the ONLY thing gating it. Megumi's normal Domain Expansion is
  // untouched: don't press it and everything behaves exactly as it did.
  ritual: { summon: 'mahoraga' },

  domain: {
    // CHIMERA SHADOW GARDEN — the INCOMPLETE domain, built as incomplete.
    // No enclosing barrier, no sure-hit. In exchange it costs less than a
    // finished domain and lasts far longer, and inside it every limit his
    // technique normally plays under is off.
    name: 'CHIMERA SHADOW GARDEN', jpName: '嵌合暗翳庭',
    // REFINEMENT 3 — the lowest in the game by a wide margin, and that is the
    // point. Ordering: Gojo 10 > Mahito 9 > Jogo 8 > Yuta 7 > MEGUMI 3. A
    // clash is decided on damage taken first, so he can still win an exchange
    // outright; refinement only breaks an exact tie — and on a tie his
    // half-finished barrier loses to every complete domain in the roster.
    refinement: 3,
    castFrames: 84,
    duration: 30,          // vs the standard 20 — uptime is what he bought
    env: 'shadow',
    // NOT the full ultimate gate: 78% of a full bar. High but reachable, and
    // reachable more than once a match, which the 20s domains are not.
    castThreshold: 0.78,
    noBarrier: true,       // no dome: barrier break has nothing to break
    // What LT + D-Right says when somebody tries the break anyway. Declared
    // here because there are now TWO open domains and they answer differently
    // — Sukuna's tells you to run, this one tells you the heavy pushes the
    // shadow back. Same text as before that distinction existed.
    noBarrierHint: 'NO BARRIER — HEAVY PUSHES IT BACK',
    // ...and NO sure-hit, which is why Simple Domain stays unavailable in here
    // (there is nothing for it to neutralize). Malevolent Shrine sets this and
    // gets Simple Domain as its counter; this domain deliberately does not.
    openSureHit: false,
    sureHit: { effect: 'shadow_garden', interval: 0 },
    shadow: {
      // The sea of shadow. It SPREADS from where he cast, and it does not
      // cover the arena — running to the edge is the counterplay, so the
      // radius is deliberately smaller than every map. Per-map scaling lives
      // on the map definition (`shadowScale`), because a 12m interior and a
      // 60m street cannot share one number.
      radius: 13.5, spreadTime: 1.6,
      minRadius: 7, maxRadius: 22,
      freeSummons: true,    // no CE cost, no cooldown, no active limit
      restoreLost: true,    // everything killed earlier comes back — while it holds
      // heavy attacks shove the shadow back locally: a dent the opponent can
      // stand in and be safe. This is the "push it back" counter.
      dent: { radius: 2.6, duration: 3.2, max: 6 },
      travel: { speed: 13.5, drain: 16 },  // submerged dash: fast, stamina-hungry
      // erupting a summon directly under the opponent is the domain's teeth
      ambushChance: 0.55
    },
    backlash: { duration: 9, regenMult: 0, growthMult: 0.5 }
  },
  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  // Yuta's Copy takes the simplest, most recognizable thing off him: one
  // Divine Dog, on loan. It is a real shikigami entity with a short leash —
  // and because loss is tracked per owner, Yuta losing it costs Megumi nothing.
  copyEffect: { effect: 'megumi_copy_dog', dmg: 6, name: 'Copied: Divine Dog' }
});
