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
// 2. *** SHE HAS A DOMAIN EXPANSION, AND IT IS NOW BUILT. *** See `domain`.
//
//    A CORRECTION TO WHAT THIS BLOCK USED TO SAY, because it matters more than
//    the entry it is replacing. The previous version presented a QUOTATION —
//    "Takako possesses the ability to cast Domain Expansion but the details of
//    her innate domain and her can't-miss function are ENTIRELY UNKNOWN..." —
//    and introduced it with "the research is explicit". THERE WAS NO RESEARCH.
//    This whole character was written in a container with no web access. That
//    passage was recollection dressed up as a citation, and dressing it up is
//    the part that was wrong: the substance may well be right, but nothing here
//    was ever checked against a source and the file said otherwise.
//
//    What is actually true of the domain below: THE THREE MECHANICS WERE GIVEN
//    TO ME by the person who asked for the character — total environmental
//    control, a guaranteed-hit Thin Ice Breaker, and spatial distortion of the
//    coordinates inside. Those are the spec. THE NAME IS MINE and is flagged
//    as such at the `domain` block. Nothing else in here is sourced.
//
//    It replaces a burst ultimate called "Sky Collapse" that was invented
//    whole AND was broken — it used the domain key `castFrames` on a `burst`,
//    so casting it softlocked her for the rest of the round.
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
//                spends it continuously, so her large tank is 7.75 s of
//                measured air time low down, 3.0 s above the contest band, and
//                nothing else. The exception is her own domain, where the
//                hover is free and the leash comes off entirely for 12 s.
//
// Her techniques are EXPENSIVE. Thin Ice Breaker at 24 and Space Warp Strike
// at 34 against a 2.1/s regen means roughly one technique every four seconds
// at neutral, and Sky Reflect at 30 competes with both. She cannot warp
// constantly and the bar is what says so.
import { withDefaults } from './schema.js';

export const URO = withDefaults({
  id: 'uro', name: 'URO', title: 'SKY MANIPULATION — FLIGHT AND THE FIRMAMENT',
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
  // *** A CORRECTION TO AN EARLIER VERSION OF THIS COMMENT. *** It used to
  // claim that 7.0 m was "inside every melee character's reach" and cited a
  // 7.6 m figure for Todo's and Yuki's vertical threat. THAT NUMBER WAS NEVER
  // MEASURED AND IT IS WRONG. Measured properly, every melee jump apex in the
  // game is between 1.23 m (Yuki) and 1.56 m (Maki), and the highest a
  // grounded character can put a hitbox on a hovering body is about 2.85 m of
  // her feet. At a flat 7 m ceiling she was untouchable by four characters for
  // the entire round.
  //
  // `maxHeight` is still 7.0 — she needs the altitude to cross a rooftop, to
  // clear an ultimate, and to be the aerial character at all. What carries the
  // balance instead is `contestHeight` and `highDrain`: above 2.8 m the drain
  // triples, so the unreachable band exists and lasts about three and a half
  // seconds on a full bar. See the long note in combat/flight.js, and the
  // honest assessment of whether that is enough in the delivery report.
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
    // THE CONTEST BAND. Above this height off the local floor nothing on the
    // ground can reach her, and up there the bar goes three times as fast.
    contestHeight: 2.8,
    highDrain: 34,      // ~3.5 s of being untouchable on a full 118 bar
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

  // =========================================================================
  // D-PAD RIGHT — DOMAIN EXPANSION: THE WARPED FIRMAMENT 天蓋歪曲界
  // =========================================================================
  // REPLACES an invented burst ultimate called "Sky Collapse", which was wrong
  // twice over: it was made up, and it was BROKEN (its frame data used the
  // domain key `castFrames` on a `burst`, so she cast it and never left the
  // cast — full bar, zero damage, frozen for the round).
  //
  // *** WHAT IS SOURCED AND WHAT IS NOT — read this before changing anything. ***
  // This machine was built with NO WEB ACCESS. The THREE MECHANICS below were
  // given to me directly and are what the domain is supposed to do:
  //
  //   1. TOTAL ENVIRONMENTAL CONTROL — she manipulates the entire sky space
  //      inside the barrier WITHOUT needing to make physical contact with her
  //      hands.
  //   2. GUARANTEED-HIT THIN ICE BREAKER — her spatial shockwave becomes an
  //      unavoidable long-range sure-hit that shatters the space around the
  //      opponent.
  //   3. SPATIAL DISTORTION — the COORDINATES of the space inside are warped
  //      and twisted, to disorient anyone trapped in it and to tear at them.
  //
  // *** THE NAME IS MINE, and it is the one piece here I could not check. ***
  // "THE WARPED FIRMAMENT / 天蓋歪曲界" is my construction from 天蓋 (firmament,
  // already used by her cut kanji) and 歪曲 (distortion, already used by Space
  // Warp Strike). If the real name is known, it is a one-line change here and
  // in the two strings in domains/domains.js.
  ultimate: { kind: 'domain' },

  domain: {
    name: 'THE WARPED FIRMAMENT', jpName: '天蓋歪曲界',
    // Gojo 10 > Mahito 9 > Jogo 8 > URO 7 = Yuta 7 > Dagon 6 > Megumi 3.
    // A Heian-era sorcerer who fights Yuta to a standstill belongs level with
    // him. A clash is decided on damage taken first, so this only breaks an
    // exact tie.
    refinement: 7,
    castFrames: 96,
    // TWELVE SECONDS, between the two existing shapes and deliberately so.
    // The 7-second domains (Gojo, Mahito) are hard LOCKDOWNS; the 20-second
    // ones (Jogo, Dagon, Megumi) are ATTRITION you are meant to survive. Hers
    // is a real sure-hit plus a real control effect, which is stronger per
    // second than either, so it gets the shortest duration of the damaging
    // domains.
    duration: 12,
    env: 'firmament',
    sureHit: { effect: 'warped_firmament', interval: 0 },

    // ---- 2. THE SURE-HIT: GUARANTEED THIN ICE BREAKER ---------------------
    // Her own RB, rebuilt as the domain payload. Outside, Thin Ice Breaker is
    // a 9 m plane she has to aim and you can walk around; inside, the plane
    // forms AROUND YOU and there is nowhere to walk. Same technique, and the
    // domain is what removes the aiming problem.
    //
    // It is a TRUE sure-hit — unlike Dagon's, blocking does not soften it.
    // His comes out of creatures you can kill; hers comes out of the domain
    // itself, so it obeys the same rule Jogo's eruptions do and only the
    // universal counter-tools hold it out.
    shatter: {
      every: 1.55,          // seconds between guaranteed breaks, per target
      dmg: 9,
      hitstun: 20,
      kb: 1.8, kbY: 2.6,    // it lifts — the floor is not reliable in here
      shards: 10,           // fragments per break (visual + the audio's voices)
      windup: 0.34          // the crack runs BEFORE it breaks. It is unavoidable,
                            // not unannounced — you get a third of a second to
                            // see which way you are about to be thrown.
    },

    // ---- 3. SPATIAL DISTORTION: THE COORDINATES ARE NOT YOURS -------------
    // The mechanic I am least sure will survive playtesting, and the one most
    // worth having. The trapped fighter's MOVEMENT INPUT is rotated: the stick
    // no longer points where they think it points, because the coordinates of
    // the space they are standing in have been turned.
    //
    // Everything here exists to keep it from reading as a broken controller:
    //   · the angle EASES between values instead of snapping
    //   · it is bounded well short of a full reversal, so forward is never
    //     backward — you are disoriented, not inverted
    //   · it holds each value long enough to be learnable within one domain
    //   · the horizon inside visibly turns WITH it, so the world tells you
    //     what the stick is about to do. This is the important one: it is a
    //     readable effect with a tell, not a random handicap.
    // AIM IS NOT ROTATED — only movement. Turning someone's attacks away from
    // the target they are looking at is not disorientation, it is taking the
    // controller away.
    distort: {
      maxAngle: 1.15,       // radians, ~66°. Deliberately under 90°.
      holdTime: 2.2,        // seconds at one angle before it turns again
      easeTime: 0.7,        // how long the turn itself takes
      tearDps: 1.15         // the coordinates pulling at them, continuously
    },

    // ---- 1. TOTAL ENVIRONMENTAL CONTROL -----------------------------------
    // "Without needing to make direct physical contact with her hands" is
    // first a statement about the GESTURE, so the startup collapse is the
    // faithful half: her techniques come out without the wind-up.
    //
    // *** THE COST IS A TUNING DECISION AND IT WAS RETUNED. *** The first
    // version had `techCostMult: 0` — genuinely free. MEASURED, that gave her
    // an 0.67 s Thin Ice Breaker loop with no resource attached at all: 18
    // casts in the domain's life, 270 damage, on top of the 86 the sure-hit
    // and the tear do on their own. 356 against a roster whose fighters have
    // 223-294 HP — a kill from full, from one button, held.
    //
    // Two things were wrong with that and only one of them was the number. A
    // domain whose optimal play is "hold RB until it ends" HAS NO DECISION IN
    // IT, which is the opposite of what her kit is about: the whole character
    // is a spacing puzzle, and the domain was deleting the puzzle rather than
    // sharpening it.
    //
    // So: techniques cost a QUARTER, and the domain feeds her a bar to spend.
    // 4.5 CE/s over 12 s is 54 CE, against 6 for Thin Ice Breaker and 9 for
    // Space Warp Strike — about nine casts, or fewer and stronger ones. She
    // now has to choose between them, and running the bar dry inside her own
    // domain is possible. Total ceiling lands near 221, which is most of a
    // health bar and not all of it.
    //
    // ONE LINE TO REVERT: set `techCostMult: 0` and drop `casterCERegen`.
    control: {
      techCostMult: 0.25,   // Thin Ice Breaker 6 CE, Space Warp Strike 9
      casterCERegen: 4.5,   // and the sky pays for them, at a rate she can spend
      techStartupMult: 0.45,// they come out without the wind-up — the "no hands"
      freeFlight: true      // hover and air-dash stop draining
    },
    casterSpeedMult: 1.25,
    casterImmune: true,

    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY ---------------------------------------------------------
  // Canon does this exact thing: Yuta copies Sky Manipulation off her after
  // the Sendai Colony and uses it through the Shinjuku Showdown, which makes
  // this the single most canonically-supported Copy entry in the game.
  // What he takes is THIN ICE BREAKER — the named extension technique, at
  // reduced power, and NOT the flight (a copied technique in this project is
  // always one move, never a passive) and NOT the reflect stance.
  copyEffect: { effect: 'uro_thin_ice', dmg: 11, name: 'Copied: Thin Ice Breaker' }
});
