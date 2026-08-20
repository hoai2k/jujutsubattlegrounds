// DAGON 陀艮 — a special-grade cursed spirit born of humanity's fear of the
// ocean, and the roster's DOMAIN SUMMONER.
//
// He is slow, enormously durable, and mostly harmless outside his domain.
// Inside it he is the most oppressive character in the game, because his
// domain does not damage anyone: it fills the arena with an endless tide of
// sea shikigami that do.
//
// ===========================================================================
// RESEARCH — AND THE BRIEF HAD THE DOMAIN'S NAME RIGHT
// ===========================================================================
// HORIZON OF THE CAPTIVATING SKANDHA 蕩蘊平線 (Tōun Heisen). The brief invited
// a correction and there is none to make: that is the name, and the interior
// the brief describes matches the source almost exactly — "a tropical beach
// that has a forest of palm trees on one side of the shore and an ocean on the
// other side, stretching into the distance", described as a CALM domain whose
// "waters are shallow enough for someone to stand in it while close to the
// beach". The palms are the one thing the brief omits and they are built.
//
// THE SURE-HIT IS THE SHIKIGAMI, CONFIRMED. Quoted: the domain's "sure-hit
// sure-kill effect causes the AQUATIC SHIKIGAMI THAT DAGON SUMMONS TO
// AUTOMATICALLY HIT THEIR TARGET", and it "can divide the guaranteed hits
// among multiple opponents, or concentrate all of its power onto a single
// target" — which is a free, canon-correct rule for the free-for-all modes and
// is implemented as `splitSureHit` below.
//
// THE EXTENSION TECHNIQUE HAS A NAME. Inside the domain he activates DEATH
// SWARM (死累累湧軍), "a virtually endless swarm of fish monster shikigami
// [attacking] from all sides", which "appear instantaneously from the target's
// perspective, making them nearly impossible to block because the shikigami
// don't exist until they hit the target". That is the escalating spawn the
// brief asks for, named in the source.
//
// WHAT HE SUMMONS, and it is why no shikigami here is invented: "eel-like sea
// serpents, piranha swarms, small sharks, and tough crustaceans", scaling
// "from medium-sized fish to gigantic sea beasts". See
// art/models/oceanshikigami.js.
//
// HIS COMBAT RECORD, which is the balance argument for the whole character:
// the domain "overwhelmed Naobito, Maki, Nanami and Megumi through RELENTLESS
// ATTRITION" — four sorcerers, one of them a grade 1 and one of them the
// fastest man alive, ground down by volume rather than by a kill move. The
// domain below is tuned to feel like that and nothing else.
//
// ===========================================================================
// THE SHAPE OF HIM, IN NUMBERS
// ===========================================================================
//   hp 132        the highest on the roster outside Panda's three pools
//   runSpeed 3.9  the slowest fighter in the game (Todo 4.6, Yuki 4.5 loaded)
//   blockChipMult 0.62 — the best guard in the game, under Mahoraga's
//   ceGainPerPunch 8.4 and ceRegen 3.0 — ABOVE AVERAGE MAX_CE GROWTH, as the
//                 brief asks. His entire gameplan is reaching the domain and
//                 the game should let a patient player get there: from a 40
//                 start he needs 8 landed hits or about 55 seconds of standing
//                 there taking it, whichever comes first.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE FOUR OCEAN SHIKIGAMI
// ---------------------------------------------------------------------------
// One entry per creature. Read by combat/ocean.js for behaviour, by
// art/models/oceanshikigami.js for the body, and by the domain's spawn table
// below for how often each turns up.
//
//   hp        how much punishment the body takes before it dies. Killing one
//             buys time and nothing else — another arrives.
//   weight    its share of the spawn roll, and it CHANGES over the domain's
//             life (see `waves`), which is what makes the escalation a change
//             in KIND rather than only in rate.
//   slots     how many of the concurrent cap it occupies. The shark is 3.
//   sure      whether its attacks route through the domain's sure-hit path.
//             True for all four inside the domain; outside it (the SPECIAL's
//             single persistent ally) it is forced false.
export const OCEAN_DEFS = {
  // PIRANHA SHOAL — the fast darting swarm. Low damage each, and there are a
  // lot of them; the shoal is ONE entity carrying `count` bodies, so it costs
  // one slot and reads as fifteen fish.
  piranha: {
    key: 'piranha', name: 'PIRANHA SHOAL', jp: '群魚', short: 'SHOAL',
    hp: 12, slots: 1, count: 14, color: 0x2f4b5c,
    dmg: 2.2, hitstun: 8, kb: 0.7,
    speed: 7.6, reach: 1.1, swingEvery: 0.65,
    life: 14, emergeTime: 0.55,
    desc: 'FAST · SWARM · CHIP'
  },
  // ARMOURED CRAB — the body-blocker. It walks between you and Dagon, it eats
  // hits, and every so often it rams. The only one that occupies ground.
  crab: {
    key: 'crab', name: 'ARMOURED CRAB', jp: '甲殻', short: 'CRAB',
    hp: 46, slots: 2, color: 0x4a5f63,
    dmg: 9, hitstun: 24, kb: 3.4,
    speed: 2.4, reach: 1.9, swingEvery: 2.6,
    ramEvery: 5.0, ramSpeed: 8.5, ramDmg: 14, ramKb: 6.5,
    blocker: true,             // it puts itself on the line between the two
    armor: true,               // it does not flinch off a light hit
    life: 20, emergeTime: 0.9,
    desc: 'HEAVY · BODY-BLOCKS · RAMS'
  },
  // EEL-SERPENT — the ranged one. It hangs back and spits a pressurised jet.
  // The wind-up is deliberately long and deliberately visible (the throat
  // swells and the lure brightens — see the model) because a spit with no tell
  // arriving out of a swarm of twenty is not a fight.
  eel: {
    key: 'eel', name: 'EEL-SERPENT', jp: '鰻蛇', short: 'EEL',
    hp: 22, slots: 1, color: 0x26414f,
    dmg: 3, hitstun: 14, kb: 1.0,          // its bite, if you close on it
    speed: 4.6, reach: 1.5, swingEvery: 2.2,
    spit: { every: 3.4, windup: 0.85, range: 15, speed: 17, dmg: 7, hitstun: 18, kb: 1.6 },
    standoff: 8.5,             // the distance it tries to hold
    life: 18, emergeTime: 0.75,
    desc: 'RANGED · SPITS · KEEPS DISTANCE'
  },
  // GREAT SHARK — the late threat. Rare, expensive in slots, and it hits like
  // a technique rather than like a summon.
  shark: {
    key: 'shark', name: 'GREAT SHARK', jp: '大鮫', short: 'SHARK',
    hp: 78, slots: 3, color: 0x38505e,
    dmg: 22, hitstun: 38, kb: 7.0, kbY: 2.4,
    speed: 5.4, lungeSpeed: 12.5, reach: 2.8, swingEvery: 3.6,
    lungeEvery: 6.0, lungeRange: 9.0,
    armor: true,
    life: 22, emergeTime: 1.25,
    desc: 'RARE · HUGE · LUNGES'
  }
};

export const OCEAN_ORDER = ['piranha', 'crab', 'eel', 'shark'];

export const DAGON = withDefaults({
  id: 'dagon', name: 'DAGON', title: 'CURSED SPIRIT — THE TIDE',
  stats: {
    hp: 132,
    // THE SLOWEST FIGHTER IN THE GAME, deliberately. He soaks and waits.
    walkSpeed: 1.9, runSpeed: 3.9, dashSpeed: 6.4, jumpVel: 7.4,
    startMaxCE: 40,
    // ABOVE-AVERAGE MAX_CE GROWTH, as briefed. 3.0 regen against the roster's
    // 2.2, and 8.4 growth per landed hit against 6. This is the single
    // mechanical statement of "his entire gameplan is reaching his domain".
    ceRegen: 3.0, ceGainPerPunch: 8.4, damageScale: 1.0,
    stamina: 108, staminaRegen: 24, dashDrain: 30
  },
  size: { hurtPad: 0.34, stepShake: true },
  // THE BEST GUARD IN THE GAME. He is meant to be able to just stand there.
  // Same two dials Mahoraga and Hanami already use, pushed further: 0.62 chip
  // is below Mahoraga's, and it is the mechanical statement of "he soaks
  // damage and waits".
  blockChipMult: 0.62,
  blockStaminaMult: 0.70,

  // ---- X — THE 3-HIT TENTACLE STRING ---------------------------------------
  // Slow, long, medium damage. The FIRST hit carries armour, which is the
  // whole personality of the string: he trades. Third knocks down (rather than
  // launching, which is the roster default) — he does not do juggles, he puts
  // you on the floor and walks toward you.
  punches: [
    { dmg: 6, startup: 11, active: 4, recovery: 18, reach: 2.30, kb: 2.2, kbY: 0, hitstun: 18, type: 'light', step: 1.5, armorFrames: 12 },
    { dmg: 7, startup: 12, active: 4, recovery: 20, reach: 2.40, kb: 2.8, kbY: 0, hitstun: 20, type: 'light', step: 1.5 },
    { dmg: 12, startup: 16, active: 5, recovery: 28, reach: 2.55, kb: 5.0, kbY: 0, hitstun: 32, type: 'knockdown', step: 1.7 }
  ],
  // HEAVY — DEEP HAUL: both arms come over and down.
  heavy: {
    name: 'Deep Haul', dmg: 19, startup: 22, active: 6, recovery: 34,
    reach: 2.6, kb: 6.4, hitstun: 34, step: 1.8, staminaCost: 22,
    armorFrames: 14, clip: 'heavy'
  },

  // ---- RB · CT1 — SHIKIGAMI VOLLEY 式神一斉 ---------------------------------
  // His neutral tool. A small school of fish shikigami that home loosely. Low
  // damage each, good chip, cheap. It is not a kill move and it is not
  // supposed to be: it is what he does with his hands while his bar fills.
  //
  // ROSTER CONVENTION: RB is the furthest-reaching technique, RT the strongest.
  ct1: {
    name: 'SHIKIGAMI VOLLEY', jp: '式神一斉',
    cost: 16, startup: 18, active: 4, recovery: 24,
    effect: 'dagon_volley', dmg: 3.2,
    count: 5, speed: 11.5, homing: 2.0, range: 14,
    kb: 0.9, kbY: 0, hitstun: 10,
    clip: 'ct1'
  },

  // ---- RT · CT2 — TIDAL SLAM 潮撃 ------------------------------------------
  // A heavy forward surge of water. Wide, slow, high damage, washes them back,
  // and LEAVES A SHALLOW WATER PATCH that slows anyone standing in it.
  //
  // The patch is the interesting half and it is the only lingering ground
  // effect he has outside the domain. He is immune to his own — a slow
  // character who slowed himself would simply never use it.
  ct2: {
    name: 'TIDAL SLAM', jp: '潮撃',
    cost: 30, startup: 28, active: 8, recovery: 36,
    effect: 'dagon_tidal_slam', dmg: 24,
    width: 4.6, range: 8.5, surgeSpeed: 13,
    kb: 8.5, kbY: 1.2, hitstun: 34,
    patch: { radius: 3.2, duration: 5.0, slow: 0.62 },
    clip: 'ct2'
  },

  // ---- LT / LB -------------------------------------------------------------
  // Block is `guard` above. The dash is a short slow surge rather than a
  // burst — `dashBurst: false` opts him out of the roster-wide dodge impulse
  // entirely (see combat/fighter.js DASH_BURST), which is the mechanical
  // statement that he cannot get out of the way of anything.
  dashBurst: false,

  // ---- B · SPECIAL — SUMMON SEA SHIKIGAMI 式神召喚 --------------------------
  // ONE persistent ally at a time, outside the domain. Fragile, low damage,
  // and it is his only pressure while he waits. It reuses the ocean shikigami
  // system (combat/ocean.js) rather than growing a second minion path, and it
  // is forced `sure: false` — the guarantee is the DOMAIN's, not his.
  //
  // The type is chosen by the stick at cast time, exactly the way Jogo's
  // eruption is aimed, so there is no fourth binding and no wheel:
  //   neutral / forward  EEL     — the default, and the useful one at range
  //   back               CRAB    — the body-block, when he wants a wall
  //   left or right      PIRANHA — the chip shoal
  // The SHARK is domain-only. It is the payoff for getting there.
  special: {
    key: 'dagon_summon', name: 'SUMMON SEA SHIKIGAMI', jp: '式神召喚',
    cost: 26, cooldown: 9, castFrames: 26, clip: 'summon',
    maxOutside: 1,
    aim: { neutral: 'eel', back: 'crab', side: 'piranha' },
    // outside the domain everything he puts on the field is weaker: 70% health
    // and 80% damage, so the ally is genuinely a placeholder for the domain
    // rather than a reason not to cast it
    outsideHpMult: 0.70, outsideDmgMult: 0.80
  },

  ultimate: { kind: 'domain' },

  // =========================================================================
  // D-PAD RIGHT — DOMAIN EXPANSION: HORIZON OF THE CAPTIVATING SKANDHA
  // =========================================================================
  domain: {
    name: 'HORIZON OF THE CAPTIVATING SKANDHA', jpName: '蕩蘊平線',
    // REFINEMENT 6. Ordering: Gojo 10 > Mahito 9 > Jogo 8 > Yuta 7 >
    // DAGON 6 > Megumi 3. Mid-table on purpose: he is a special grade with a
    // complete barrier and a genuine sure-hit, which puts him well above
    // Megumi's incomplete garden — and below the four whose domains are their
    // defining feat. A clash is decided on damage taken first, so this only
    // breaks an exact tie.
    refinement: 6,
    castFrames: 92,
    duration: 20,           // the standard
    env: 'shoreline',
    sureHit: { effect: 'captivating_skandha', interval: 0 },

    // ---- THE SURE-HIT PAYLOAD: DEATH SWARM 死累累湧軍 ---------------------
    // The core of the character and the requested feature. Everything about
    // the spawn is here so the escalation curve can be read and tuned in one
    // place; combat/ocean.js only executes it.
    swarm: {
      // *** THE ESCALATION. *** `rate` is seconds between spawns, and it is
      // interpolated across the domain's life by this curve — `t` is 0..1
      // through the 20 seconds. A trickle at first, an overwhelming swarm by
      // the end. The player should be able to feel the moment it stops being
      // manageable, which lands around t=0.55.
      //
      //   t     0.00   0.25   0.50   0.75   1.00
      //   gap   3.20   2.30   1.45   0.85   0.48   seconds between spawns
      //
      // Over the full 20 s that is roughly 17 spawn events, of which about
      // half arrive in the last third — which is exactly the shape "surviving
      // to the end feels like an achievement" describes.
      rateCurve: [3.20, 2.30, 1.45, 0.85, 0.48],
      firstDelay: 1.1,        // a beat of beach before anything comes out

      // *** THE HARD CAP. *** The single most important performance number in
      // this addition. Concurrent SLOTS, not bodies — the piranha shoal is one
      // slot and fifteen fish, the shark is three. At the cap the oldest
      // living shikigami is culled rather than the spawn being skipped, so the
      // pressure never visibly stalls and the count never climbs.
      maxSlots: 22,
      cullOldest: true,

      // *** THE WAVE TABLE. *** Spawn weights change over the domain's life,
      // which is what makes the escalation a change in KIND and not just in
      // rate. Early it is almost all piranhas; by the end the shark is a real
      // possibility on every roll.
      //   phase: the t at which this row takes over
      waves: [
        { at: 0.00, weights: { piranha: 76, crab: 18, eel: 6, shark: 0 } },
        { at: 0.30, weights: { piranha: 52, crab: 24, eel: 22, shark: 2 } },
        { at: 0.55, weights: { piranha: 40, crab: 24, eel: 26, shark: 10 } },
        { at: 0.78, weights: { piranha: 32, crab: 22, eel: 26, shark: 20 } }
      ],
      // The shark is rare by weight AND by a hard floor, so an unlucky early
      // roll cannot put one on the beach in the first five seconds.
      sharkNotBefore: 0.42,
      sharkMinGap: 5.5,

      // Where they come from. `fromSea` is the fraction that rise out of the
      // open water behind the opponent; the rest surface in the surf line,
      // which is much closer and is what makes the late game claustrophobic.
      fromSea: 0.45,
      seaDist: [7, 15],
      surfDist: [2.5, 6.0],
      // never inside the opponent's guard on arrival — they emerge and THEN
      // close, which is the difference between pressure and a cheap shot
      minSpawnDist: 2.2
    },

    // *** NO DAMAGE TICK. *** Stated as a value rather than as an omission, so
    // that nobody later "fixes" it by adding one. The sea and the sky do
    // nothing at all. Every point of damage in this domain comes out of a
    // creature that can be killed, and that is the entire distinction from
    // Jogo's attrition furnace and Gojo's lockdown.
    ambientDps: 0,

    // Canon: the sure-hit "can DIVIDE the guaranteed hits among multiple
    // opponents, or CONCENTRATE all of its power onto a single target". With
    // one opponent that is a no-op; in a free-for-all the swarm splits its
    // targeting rather than dogpiling one player, which is both the canon
    // reading and the only version that is not miserable in a 4-player match.
    splitSureHit: true,

    // Inside his own domain he is immune to his own creatures and MOVES
    // FASTER — the same `domainHaste` dial Jogo's furnace already uses, so
    // nothing new was needed for it.
    casterSpeedMult: 1.32,
    casterImmune: true,

    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  ocean: { defs: OCEAN_DEFS, order: OCEAN_ORDER },
  // Yuta's Copy takes the simplest recognisable thing off him: one volley.
  // Deliberately NOT the summon — a copied technique in this project is always
  // one move, and handing Yuta a persistent independent body would be handing
  // him a second character.
  copyEffect: { effect: 'dagon_volley', dmg: 2.4, name: 'Copied: Shikigami Volley' }
});
