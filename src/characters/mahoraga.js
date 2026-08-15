// MAHORAGA — 八握剣異戒神将魔虚羅
//
// NOT A ROSTER CHARACTER. He is deliberately absent from ROSTER / ROSTER_IDS
// in characters/index.js, so he never appears on the select screen and the CPU
// can never be handed him. The only way onto the field is Megumi's summon
// ritual: interrupt his Domain Expansion cast with the SPECIAL button and the
// domain is spent on calling this instead.
//
// THE SHAPE HE IS MEANT TO HAVE
//   An enormous late-round threat that gets worse the longer the round runs,
//   and that a mobile opponent who rotates their tools can still take apart.
//   Every number below serves one of those two halves.
//
// COST — and it is all up front:
//   · Megumi's HP CARRIES OVER. Summoning at 22% health means Mahoraga starts
//     at 22% health. That is the real cost and it is why the ritual is a
//     decision rather than a formality.
//   · Once per match, and Megumi's Domain Expansion is consumed to get him.
//   · He has NO resource system. No cursed energy, no bar growth, no meter,
//     no ultimate, no domain.
//   · He is SLOW. Run speed 3.4 against the roster's 5.2, and startup frames
//     roughly double everyone else's. That is his weakness and it is meant to
//     be exploitable by anyone willing to keep moving.
//
// NO SELF-DAMAGE. Explicitly: there is no health drain, no decay timer, no
// chip on himself, no recoil, no expiry, and no passive self-harm of any kind
// anywhere in this file or in the systems that read it. He does not hurt
// himself to exist. If he ends up too strong the levers are the adaptation
// interval, the roll range and his speed — never self-damage.
import { withDefaults } from './schema.js';
import { ADAPT } from '../combat/adaptation.js';

export const MAHORAGA = withDefaults({
  id: 'mahoraga', name: 'MAHORAGA', title: '八握剣異戒神将 — DIVINE GENERAL',
  jpName: '魔虚羅',
  summonOnly: true,          // read by the select screen guard and the viewer

  // ---- SCALE --------------------------------------------------------------
  // The model is authored at H 3.60 m. Against the roster that is 1.80x Todo
  // (2.00, the previous largest), 2.06x Megumi (1.75) and 1.89x Gojo (1.90).
  size: {
    height: 3.6,
    vsTallest: 1.8,          // x Todo
    // CAMERA. A camera tuned for a 1.8 m fighter frames his waist. These pull
    // the seat's own camera back and raise its look target, and are eased in
    // over ~1s so the transformation does not snap the view.
    camDist: 2.05,           // multiplier on the follow distance
    camHeight: 1.55,         // metres added to the look target
    camPitch: 0.10,          // extra downward tilt so the frame sits under him
    // COLLISION. Deliberately NOT scaled with the model — see the note on
    // bodyRadius below.
    bodyRadius: 0.36,
    pushRadius: 1.15,        // fighter-vs-fighter separation: bodies don't overlap
    // HURT CAPSULE — he is a far bigger thing to hit, and he should be. These
    // read against the roster defaults of radius 0.62 / half-height 1.45 /
    // centre 1.05, and they are what make a normal punch connect with his shin
    // instead of whiffing under him.
    hurtRadius: 1.05,
    hurtHeight: 2.35,        // vertical half-tolerance
    hurtCenter: 1.75,        // centre of mass off the floor
    hurtPad: 0.55,           // extra range every technique gets against him
    strikeY: 2.10,           // where HIS blows originate
    // every footfall registers: a camera kick and a floor thump, twice a cycle
    stepShake: 0.14,
    wheelY: 3.90             // where the wheel sits, for the adaptation flare
  },
  // NAVIGATION. bodyRadius stays at the human 0.36 and his wall probe stays at
  // the human height on purpose. It means he can physically go anywhere a
  // human can go, which makes "stuck in a doorway on map 6" impossible by
  // construction rather than by testing. His size lives in the hurt capsule,
  // the reach numbers, the push radius and the camera — all of which are
  // free of navigation consequences. His shoulders clip an interior lintel;
  // a 3.6 m thing shouldering through a corridor SHOULD.

  stats: {
    // hp is a placeholder: the ritual overwrites it with whatever Megumi had
    // left at the moment of the summon.
    hp: 100,
    walkSpeed: 1.75,         // roster 2.6
    runSpeed: 3.40,          // roster 5.2 — this is the weakness
    dashSpeed: 12.0,         // the CHARGE, not a dash: fast but committed
    jumpVel: 10.2,           // scaled so the arc reads right at his height
    // NO CURSED ENERGY. maxCE never leaves 0, so `charged` and `ultReady` are
    // permanently false: no aura, no ultimate gate, no domain, no bar to fill.
    startMaxCE: 0, ceRegen: 0, ceGainPerPunch: 0,
    // Stamina exists only so block and charge have something to talk to; it
    // regenerates fast enough that it never gates him. It is not a resource.
    stamina: 100, staminaRegen: 60, dashDrain: 0,
    damageScale: 1.0
  },

  // ---- X · THE CLAW STRING -------------------------------------------------
  // Slow, enormous, three hits. Reach 3.3-3.8 m against the roster's 1.35-1.7:
  // he is hitting people who think they are safely outside his range.
  // ARMOUR on the first hit — he trades and wins.
  // FRAME DATA IS CUT TO THE ANIMATION, not the other way round: every
  // startup below is the exact frame its clip's impact key lands on, so the
  // hitbox and the claw arrive together. Totals equal each clip's duration.
  punches: [
    {
      name: 'Rake', dmg: 12, startup: 22, active: 5, recovery: 16,   // 43f
      reach: 3.30, kb: 3.2, kbY: 0, hitstun: 24, type: 'heavy', step: 1.5,
      armorFrames: 27          // <- the trade: it covers the whole wind-up
    },
    {
      name: 'Return Rake', dmg: 14, startup: 23, active: 5, recovery: 18, // 46f
      reach: 3.50, kb: 4.0, kbY: 0, hitstun: 26, type: 'heavy', step: 1.6
    },
    {
      name: 'Upward Tear', dmg: 20, startup: 30, active: 6, recovery: 27, // 63f
      reach: 3.80, kb: 5.0, kbY: 9.0, hitstun: 32, type: 'launcher', step: 1.8
    }
  ],

  // Y · the committed hammer-fist. Knockdown, as every heavy in the game is.
  heavy: {
    name: 'Hammerfall', dmg: 26, startup: 32, active: 6, recovery: 31,  // 69f
    reach: 4.00, kb: 7.0, kbY: 0, hitstun: 36, step: 2.2,
    staminaCost: 0, armorFrames: 20, ceGain: 0, clip: 'heavy'
  },

  // ---- RB · CT1 — WHEEL SLASH ---------------------------------------------
  // A flat sweep of the blade through everything in an arc in front of him.
  // Long reach, wide arc, no cost. This is his neutral tool.
  ct1: {
    name: 'WHEEL SLASH', jpName: '輪転斬', cost: 0,
    startup: 26, active: 6, recovery: 27,        // 59f = the clip's 0.98 s
    effect: 'mahoraga_wheel_slash', clip: 'wheelSlash',
    dmg: 22, reach: 5.2, arc: 2.8, kb: 6.0, kbY: 1.2, hitstun: 34,
    destroyPower: 70, destroyRadius: 3.0
  },

  // ---- RT · CT2 — WORLD-CUTTING SLASH -------------------------------------
  // His signature and the most telegraphed move in the game: 46 frames of
  // startup with a dead-still hold in the middle of it, a cut line drawn
  // across the world before the blade moves, and then a line that goes
  // through the arena as well as through whoever is standing in it.
  ct2: {
    name: 'WORLD-CUTTING SLASH', jpName: '世界を断つ斬撃', cost: 0,
    startup: 46, active: 8, recovery: 66,        // 120f = the clip's 2.00 s
    effect: 'mahoraga_world_cut', clip: 'worldCut',
    dmg: 46, range: 15.0, width: 2.2, kb: 9.0, kbY: 4.0, hitstun: 46,
    // the environment cut: stepped along the line, erasing what it passes
    destroySteps: 16, destroyStep: 1.0, destroyRadius: 2.6, destroyPower: 150,
    telegraphAt: 16          // frame the ground line starts drawing itself
  },

  // ---- LT · BLOCK ---------------------------------------------------------
  // Excellent reduction, very slow to raise. blockStartupFrames is real: for
  // 25 frames after the press the guard is not up yet and he eats the hit
  // clean. Pressing block on reaction to his own bad read does not save him.
  blockChipMult: 0.28,       // roster chip is 15% of the hit; his is 4.2%
  blockStartupFrames: 25,
  blockStaminaMult: 0.35,

  // ---- LB · HEAVY CHARGE (replaces the dash) ------------------------------
  // Commits forward, armours through one hit, and cannot turn sharply. Held
  // like a dash, but it locks his facing so a sidestep beats it.
  heavyCharge: {
    speed: 12.0, armorFrames: 34, turnRate: 1.1,   // roster turn is 6-10
    minFrames: 26, cooldown: 1.1,
    dmg: 16, reach: 3.0, kb: 7.5, kbY: 1.0, hitstun: 30
  },

  // ---- B / D-pad Right ----------------------------------------------------
  special: null,             // spent on the summon — the press does nothing
  noSpecialReason: 'THE SPECIAL WAS SPENT ON THE SUMMON',
  ultimate: { kind: 'none' },
  noUltimate: true,          // D-Right is refused with a readable line
  noUltimateReason: 'MAHORAGA HAS NO DOMAIN',
  domain: null,

  // MAHITO. A shadow construct has no soul to reshape — the same ruling this
  // project already applies to Megumi's shikigami inside Self-Embodiment of
  // Perfection. Mahoraga is the largest shikigami there is, so Idle
  // Transfiguration's gauge never starts on him.
  soulless: true,

  // ---- MASS ---------------------------------------------------------------
  // Knockback and launch height scale down hard: he gets moved, but he does
  // not get carried. Juggles still work, they are just short.
  kbResist: 0.38,
  launchResist: 0.34,

  // ---- THE PASSIVE --------------------------------------------------------
  adaptation: { ...ADAPT },

  // Yuta's Copy off Mahoraga: the sweep, at Copy's usual reduced power.
  // Adaptation is a passive property of the body, not a technique — there is
  // no cursed technique on him to steal, so the blade is what gets stored.
  copyEffect: { effect: 'mahoraga_wheel_slash', dmg: 13, name: 'Copied: Wheel Slash' },

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 }
});
