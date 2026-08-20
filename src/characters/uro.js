// TAKAKO URO 烏鷺亨子 — SKY MANIPULATION 天使呪法. The reflector, and the only
// fighter in this project who is not obliged to come back down.
//
// She fights by treating space as a physical surface: she grabs it, folds it,
// bends it and shatters it. Attacks arrive from angles that should not exist,
// projectiles come back at whoever threw them, and she spends most of a round
// in the air. She is a zoner who beats other zoners — and the moment somebody
// gets on top of her she is in more trouble than anyone on the roster.
//
// ===========================================================================
// RESEARCH — THE THREE THINGS THE BRIEF ASKED ME TO CHECK
// ===========================================================================
//
// 1. *** "THIN ICE BREAKER" IS CORRECT. *** The brief hedged and offered "Thin
//    Ice Deformation or something else". It is not: the technique is THIN ICE
//    BREAKER (薄氷ブレイカー, Usurai Bureikā), an extension technique of Sky
//    Manipulation. The mechanic the brief describes is also right, and the
//    research is more specific than the brief about WHY it works: "rather than
//    striking their target directly, the user hits the SURFACE OF THE SKY via
//    their cursed technique", which "creates a shattering effect where the
//    sky's surface cracks like thin ice, consequently hitting the target with
//    increased force". Because the blow lands on the space the target occupies
//    rather than on the target's body, ordinary cursed-energy REINFORCEMENT is
//    much less effective against it — so the technique below carries a
//    `pierceGuard` term that no other neutral tool in the game has.
//
// 2. *** SHE DOES HAVE A DOMAIN EXPANSION, AND IT IS UNBUILDABLE. *** This is
//    a correction to the brief's assumption rather than to its instruction.
//    The research is explicit: "Takako possesses the ability to cast Domain
//    Expansion but the details of her innate domain and her can't-miss
//    function are ENTIRELY UNKNOWN. When she used it at the same time as Yuta
//    and Ryu, the barrier came apart before any of their domains were fully
//    realized." So there is a name-less, interior-less, sure-hit-less domain
//    on the record, and nothing whatsoever to build from.
//    THE CALL: she keeps the NON-DOMAIN burst ultimate the brief specifies.
//    Inventing an interior, a name and a sure-hit for a domain the source
//    deliberately never showed would be presenting invention as canon, which
//    the brief explicitly forbids. The burst it is, and it is built as the
//    total sky collapse the brief describes as the fallback — see `ultimate`.
//
// 3. *** SHE IS SADISTIC, PROUD, AND PLAYS WITH PEOPLE. *** "Takako enjoys
//    toying with her enemies and has sadistic tendencies", with pride rooted
//    in having been sacrificed as a proxy in her original life. That is the
//    taunt (see combat/taunts.js) and it is also why her whole kit is built
//    around making the opponent's effort not matter.
//
// ===========================================================================
// THE SHAPE OF HER, IN NUMBERS
// ===========================================================================
//   AVERAGE health, AVERAGE damage, EXCELLENT mobility, POOR close defence.
//   hp 94        — the third-lowest on the roster, above Nobara and Miwa
//   damageScale  1.00, dead average
//   block        THE WORST GUARD IN THE GAME. Chip through her block is 1.45x
//                and the stamina drain 1.40x, because "if someone gets on top
//                of her she's in trouble" has to be a number and not a vibe —
//                and because the stamina it eats is the stamina she flies on.
//   stamina 118  — the highest on the roster, and it is not a buff: flight
//                spends it continuously, so her large tank is roughly 9
//                seconds of air time and nothing else.
//
// Her techniques are EXPENSIVE. Thin Ice Breaker at 24 and Space Warp Strike
// at 34 against a 2.1/s regen means roughly one technique every four seconds
// at neutral, and Sky Reflect at 30 competes with both. She cannot warp
// constantly and the bar is what says so.
import { withDefaults } from './schema.js';

export const URO = withDefaults({
  id: 'uro', name: 'URO', title: 'SKY MANIPULATION — THE REFLECTOR',
  stats: {
    hp: 94,
    walkSpeed: 2.6, runSpeed: 5.6, dashSpeed: 9.4,
    // A HIGH JUMP, because the jump is now the door to the whole character.
    // 9.6 against the roster's 8.8 gets her clear of a grounded opponent's
    // reach on frame one of the leap, which is what stops flight from being a
    // thing she has to fight for every time she wants it.
    jumpVel: 9.6,
    startMaxCE: 40, ceRegen: 2.1, ceGainPerPunch: 5.6, damageScale: 1.00,
    stamina: 118, staminaRegen: 19, dashDrain: 26
  },

  // ---- THE PASSIVE ---------------------------------------------------------
  // Read by combat/flight.js and by nothing else. See that file's header for
  // the whole design; the numbers here are the tuning.
  //
  // maxHeight 7.0 is the single most important number in this config and it is
  // NOT arbitrary — it is set from the melee matchups. The tallest reach in the
  // game is Yuki's commanded Garuda dive and Todo's launcher, both of which
  // top out around 7.6 m of vertical threat from the ground; a launcher into
  // an air string covers 7.8. At 7.0 m she is inside every one of those, so
  // there is no altitude at which a melee character simply cannot touch her.
  // See the honest assessment in the delivery report.
  flight: {
    maxHeight: 7.0,
    headroom: 0.55,
    climbSpeed: 6.2,
    sinkSpeed: 1.15,
    drain: 13,          // ~9.0 s of holding station on a full bar
    climbDrain: 21,     // ~5.6 s of continuous climbing
    enterCost: 6,
    minStamina: 5,
    takeoff: 0.55,      // the jump's own arc runs below this — see flight.js
    airSpeed: 4.9,      // deliberately SLOWER than her 5.6 run
    airAccel: 17,
    airDashSpeed: 9.2,
    airDashDrain: 30
  },

  // ---- GUARD — BELOW AVERAGE, as briefed -----------------------------------
  // Expressed through `blockChipMult` and `blockStaminaMult`, which are the
  // two dials combat/fighter.js `_applyHit` ALREADY reads through `_tune`
  // (Mahoraga and Hanami use them for the opposite reason — heavy guards that
  // take a fraction of the usual chip). Nothing new was needed: she is simply
  // the first character to set them above 1.
  //   1.45 chip     blocking a 20-damage technique costs her 4.4 rather than
  //                 3.0, so a long guard against a zoner genuinely kills her
  //   1.40 stamina  and it drains the bar she needs to fly
  blockChipMult: 1.45,
  blockStaminaMult: 1.40,

  // ---- X — THE 3-HIT STRING ------------------------------------------------
  // Average, and IDENTICAL grounded or airborne — `air: true` is the flag the
  // state machine reads to allow the string off the ground at full value. Her
  // aerial normals being as good as her grounded ones is the passive's other
  // half: an aerial character whose air buttons are worse is a character who
  // has to land to fight.
  air: { normals: true, techniques: true, heavy: false },
  punches: [
    { dmg: 4, startup: 6, active: 3, recovery: 12, reach: 1.40, kb: 1.6, kbY: 0, hitstun: 14, type: 'light', step: 1.6 },
    { dmg: 5, startup: 7, active: 3, recovery: 14, reach: 1.45, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 1.6 },
    { dmg: 8, startup: 10, active: 4, recovery: 20, reach: 1.55, kb: 3.4, kbY: 7.6, hitstun: 26, type: 'launcher', step: 1.8 }
  ],
  // HEAVY — FOLD. A grounded-only knockdown: she pinches the space under them
  // and drops it. Slightly weaker and slower than the roster default because
  // she should never want to be down there.
  heavy: {
    name: 'Fold', dmg: 13, startup: 18, active: 5, recovery: 30,
    reach: 1.9, kb: 5.2, hitstun: 30, step: 2.0, staminaCost: 20, clip: 'heavy'
  },

  // ---- RB · CT1 — THIN ICE BREAKER 薄氷ブレイカー ----------------------------
  // Her neutral tool, and the technique the research names. She treats the
  // plane of space in front of her as a sheet and SHATTERS it: a wide forward
  // wall of fractured space, with the break propagating outward in cracks.
  //
  // Medium-fast (18 frames), good coverage (5.2 m wide by 9 m deep), and cheap
  // enough to actually throw in neutral. The `pierceGuard` term is the
  // research showing up as a number — the blow lands on the SPACE the target
  // occupies, so reinforcement (i.e. blocking) is less effective than usual:
  // a blocked Thin Ice Breaker still delivers 45% of its damage as chip,
  // against the game's usual ~22%.
  //
  // ROSTER CONVENTION: RB is the furthest-reaching technique, RT the strongest.
  ct1: {
    name: 'THIN ICE BREAKER', jp: '薄氷ブレイカー',
    cost: 24, startup: 18, active: 6, recovery: 26,
    effect: 'uro_thin_ice', dmg: 15,
    width: 5.2, range: 9.0, thickness: 0.9,
    kb: 4.2, kbY: 1.6, hitstun: 28,
    pierceGuard: 0.45,        // fraction of damage a BLOCK still eats
    shards: 14,               // fragments the plane breaks into (visual + audit)
    crackTime: 0.16,          // how long the crack takes to run before it breaks
    clip: 'ct1'
  },

  // ---- RT · CT2 — SPACE WARP STRIKE 空間歪曲打 ------------------------------
  // The committed one. She folds the space in front of her and the attack
  // EMERGES SOMEWHERE ELSE — behind the opponent, above them, or from either
  // side. Very hard to block on reaction; the counterplay is spacing, not
  // blocking, because the fold has a maximum reach and outside it nothing
  // happens at all.
  //
  // `emergence` is the rotation. It is an ORDERED CYCLE rather than a random
  // roll on purpose: a random emergence point is unlearnable and therefore
  // unfair, while a cycle is a pattern a good opponent can read after four
  // exchanges — which is exactly the amount of counterplay a 34-cost committed
  // technique should have. The cycle is per-round, and it starts at a random
  // index so the first one of the round is not free information.
  ct2: {
    name: 'SPACE WARP STRIKE', jp: '空間歪曲打',
    cost: 34, startup: 24, active: 5, recovery: 34,
    effect: 'uro_warp_strike', dmg: 26,
    reach: 8.5,               // the fold's maximum span; outside it, nothing
    emergence: ['behind', 'above', 'left', 'right'],
    kb: 5.6, kbY: 3.2, hitstun: 34,
    lensTime: 0.22,           // the compress/stretch of the scene between the folds
    ghosts: 2,                // mirrored duplicates of her at the fold points
    clip: 'ct2'
  },

  // ---- B · SPECIAL — SKY REFLECT 天逆鉾 -------------------------------------
  // A short reflect stance. See combat/reflect.js for the complete rule and
  // for the per-tool audit — including why summons and Cursed Speech are
  // deliberately outside it, and how a mirror match provably terminates.
  //
  // THE NUMBERS ARE THE BALANCE. 8 frames of startup means it can be baited by
  // any technique with a visible wind-up; 20 active is a third of a second, so
  // it has to be a read rather than a panic button; 22 frames of recovery is
  // longer than her own launcher, so a whiffed reflect is a free combo. At 30
  // CURSED ENERGY it costs more than Thin Ice Breaker and nearly as much as
  // Space Warp Strike — she genuinely cannot hold it up and threaten at the
  // same time.
  special: {
    key: 'uro_reflect', name: 'SKY REFLECT', jp: '天逆鉾',
    cost: 30, cooldown: 3.6, clip: 'reflect',
    reflect: {
      startup: 8, active: 20, recovery: 22,
      radius: 2.6, arc: 2.5,
      damageMult: 1.0, speedMult: 1.12
    }
  },

  // ---- D-PAD RIGHT · ULTIMATE — SKY COLLAPSE 天蓋崩落 -----------------------
  // *** THIS IS BUILT, NOT RESEARCHED, AND THE HEADER SAYS SO IN FULL. ***
  // She has a Domain Expansion in canon whose name, interior and sure-hit are
  // all unknown; there is nothing to build. So this is the brief's stated
  // fallback: a TOTAL SKY COLLAPSE. The entire skybox bends downward and
  // crushes the arena in a wide radius, with the horizon visibly folding in on
  // itself.
  //
  // Standard non-domain gate: MAX_CE 100 plus a full CURRENT_CE bar, the whole
  // bar spent, standard backlash. Same shape as Nanami's Collapse, Todo's
  // Brotherhood and Geto's Uzumaki, so nothing about the ultimate framework
  // had to move to accept it.
  ultimate: {
    kind: 'burst', name: 'SKY COLLAPSE', jp: '天蓋崩落',
    effect: 'uro_sky_collapse',
    castFrames: 52, active: 6, recovery: 46,
    // the collapse itself
    radius: 16.0, dmg: 62, kb: 9.0, kbY: 5.0, hitstun: 48,
    rings: 3,                 // it comes down in three closing shells
    ringGap: 0.34,
    // the world under it, for the duration of the effect
    bendTime: 1.9, bendDepth: 0.55,
    backlash: { duration: 9, regenMult: 0, growthMult: 0.5 }
  },

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  // NO DOMAIN. Canon-correct in the only sense the game can express: she has
  // one and nothing about it is known, so she sits with the burst-ultimate
  // majority of the roster. See the research note at the top.
  domain: null,

  // ---- YUTA'S COPY ---------------------------------------------------------
  // Canon does this exact thing: Yuta copies Sky Manipulation off her after
  // the Sendai Colony and uses it through the Shinjuku Showdown, which makes
  // this the single most canonically-supported Copy entry in the game.
  // What he takes is THIN ICE BREAKER — the named extension technique, at
  // reduced power, and NOT the flight (a copied technique in this project is
  // always one move, never a passive) and NOT the reflect stance.
  copyEffect: { effect: 'uro_thin_ice', dmg: 11, name: 'Copied: Thin Ice Breaker' }
});
