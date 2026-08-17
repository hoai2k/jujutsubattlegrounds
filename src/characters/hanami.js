// HANAMI — 花御. Disaster Plants. The area-denial tank.
//
// He does not chase you. He makes the ground hostile until there is nowhere
// left to stand, and then he waits there. Everything below serves that:
//   · the slowest legs and the worst dash in the roster — he genuinely cannot
//     close, so the neutral has to be won by making YOU come to HIM
//   · the highest health, the best guard, real armour on the opening jab
//   · the only character in the game whose strength depends on the MAP
//   · the only character who takes the opponent's meter instead of building
//     his own
//
// TWO PASSIVES, and they are the whole character:
//
//   NATURE'S EMBRACE. He regenerates constantly, at a rate decided by the
//   TERRAIN under his feet (see arena/terrain.js). Natural ground — soil,
//   grass, forest floor, stone, stream bed — feeds him properly; concrete,
//   tile, tarmac and floorboards give him almost nothing. That is a ~9x swing
//   and it makes him a different character per map on purpose: dominant on the
//   Kyoto grounds and across the Jujutsu High lawns, badly weakened in Shibuya
//   Station and the detention centre. ROOT FIELD is how he answers a map that
//   hates him — he builds his own forest.
//
//   FIRE VULNERABILITY. He takes increased damage from every fire source in
//   the game: Jogo's burn stacks, his magma, his domain's ambient heat and its
//   eruptions, and Sukuna's Fire Arrow. Canon-flavoured, and it hands Jogo a
//   genuine hard counter — the roster did not have one. The multiplier is
//   CAPPED (see fireVulnerability below) and the reasoning is written there.
//
// Canon-correct: Hanami has NO Domain Expansion. He joins Nanami, Todo, Toji
// and Kurourushi as the non-domain part of the roster, so D-pad Right is a
// burst ultimate with the faster non-domain startup.
import { withDefaults } from './schema.js';

export const HANAMI = withDefaults({
  id: 'hanami', name: 'HANAMI', title: 'SPECIAL GRADE — DISASTER PLANTS',
  jpName: '花御',

  stats: {
    // the most health in the game and the least mobility in the game
    hp: 145, walkSpeed: 1.90, runSpeed: 3.60, dashSpeed: 5.60, jumpVel: 7.40,
    startMaxCE: 38, ceRegen: 1.8, ceGainPerPunch: 5, damageScale: 1.06,
    stamina: 130, staminaRegen: 26, dashDrain: 40
  },

  // ---- THE PASSIVE --------------------------------------------------------
  // Read by combat/flora.js every tick. `natural` and `artificial` are HP per
  // second; `field` is the rate inside one of his own Root Fields, which is the
  // maximum and is deliberately better than standing on real soil — the field
  // is a spent resource on a cooldown and it should beat the free thing.
  flora: {
    regen: { natural: 3.2, artificial: 0.35, field: 4.6 },
    // how long the HUD holds a terrain change before committing to it, so
    // walking along a kerb does not strobe the readout
    settle: 0.35
  },

  // ---- FIRE VULNERABILITY -------------------------------------------------
  // 1.35, and the cap is deliberate. At the 1.8-2.0 the flavour wants, the
  // Jogo matchup stops being a hard counter and becomes a non-game: his burn
  // DoT alone out-paces natural-ground regeneration, which means Hanami's
  // entire defining passive is switched off by one character before either
  // player has made a decision. At 1.35 the burn still beats his regen on
  // artificial ground (which is the correct, terrifying answer) and still
  // loses to it on natural ground (which is the correct counterplay: get to
  // soil, or make some). See the balance note in the report.
  fireVulnerability: 1.35,

  // ---- X · THE CLUB STRING ------------------------------------------------
  // Slow, enormous reach (2.3-2.5 m against the roster's 1.35-1.7), high
  // damage, ARMOUR on the first hit so he trades and wins. The third hit is a
  // KNOCKDOWN, not a launcher: nothing he does puts you in the air. He puts
  // you on the floor and then he is standing over you.
  punches: [
    {
      name: 'Club Sweep', dmg: 8, startup: 11, active: 4, recovery: 20,
      reach: 2.30, kb: 3.0, kbY: 0, hitstun: 20, type: 'heavy', step: 1.2,
      armorFrames: 15                 // covers the whole wind-up
    },
    {
      name: 'Return Sweep', dmg: 9, startup: 13, active: 4, recovery: 22,
      reach: 2.40, kb: 3.6, kbY: 0, hitstun: 22, type: 'heavy', step: 1.2
    },
    {
      name: 'Double Fall', dmg: 15, startup: 18, active: 5, recovery: 30,
      reach: 2.50, kb: 5.5, kbY: 0, hitstun: 34, type: 'knockdown', step: 1.4
    }
  ],

  // Y — ROOT SLAM. Both clubs through the floor.
  heavy: {
    name: 'Root Slam', dmg: 24, startup: 24, active: 6, recovery: 38,
    reach: 2.70, kb: 6.5, kbY: 0, hitstun: 38, step: 1.6,
    staminaCost: 18, armorFrames: 20, ceGain: 1.7, clip: 'heavy'
  },

  // ---- RB · CT1 — ROOT SWARM ----------------------------------------------
  // A COLUMN of eruptions marching away from him down a line: the roots
  // travel under the floor and surface as they go, one burst at a time, each
  // with its own growing-marker telegraph and each LAUNCHING exactly as the
  // old single trap did. Steer the march with the left stick; neutral sends
  // it at the opponent, led by their velocity. Every burst checks the ground
  // it comes out of, so a swarm crossing natural terrain gets bigger and
  // harder step by step — a Root Field is now a gun emplacement.
  // `dmg` reads as the one-clean-hit number; each burst carries just under
  // half of it, and the launch means the swarm rarely lands more than two.
  ct1: {
    name: 'Root Swarm', jpName: '根の群れ', cost: 16,
    startup: 22, active: 4, recovery: 31,          // 57f = the clip's 0.95 s
    effect: 'hanami_roots', clip: 'ct1',
    dmg: 16, delay: 0.5, gap: 0.14, count: 5, spacing: 1.7, radius: 1.9,
    aimRange: 9, kb: 4, kbY: 9.5,
    // NATURAL GROUND, per burst: bigger and harder where there is something
    // down there to come up out of.
    natural: { dmg: 22, delay: 0.4, radius: 2.3 }
  },

  // ---- RT · CT2 — CURSED BUD ----------------------------------------------
  // Canon calls this the Cursed Bud: a parasitic seed that lives on cursed
  // energy and grows by taking the victim's. Direct damage is almost nothing.
  // The point is STARVING them — six seconds of drain is most of a bar, and a
  // bar is an ultimate. It feeds him at the same time, which is the only way
  // he ever pays for anything.
  //
  // It is CLEANSABLE: land enough clean hits on Hanami and it comes off. The
  // counterplay to "you cannot reach your ultimate" is to go and hit him, which
  // is exactly the fight he wants to have and exactly the fight you have to
  // win anyway.
  ct2: {
    name: 'Cursed Bud', jpName: '呪詛の芽', cost: 12,
    startup: 18, active: 3, recovery: 22,          // 43f = the clip's 0.72 s
    effect: 'hanami_bud', clip: 'ct2',
    dmg: 4, range: 7.0, speed: 13,
    duration: 7, drainPerSec: 6, feedMult: 0.85, cleanseHits: 4,
    // vs a fighter with no cursed-energy system — see combat/flora.js, and the
    // ruling written out there for Toji and Mahoraga
    flatVsNoCE: { dps: 3.4 }
  },

  // ---- LT · BLOCK ---------------------------------------------------------
  // THE BEST GUARD IN THE GAME. A third of the roster's chip, well under half
  // its stamina drain, and it comes up almost instantly — he is not a
  // technician holding a guard, he is a wall being a wall.
  blockChipMult: 0.32,
  blockStaminaMult: 0.40,
  blockStartupFrames: 3,

  // ---- MASS ---------------------------------------------------------------
  kbResist: 0.72,
  launchResist: 0.62,

  size: {
    height: 2.15,
    bodyRadius: 0.36,        // HUMAN, deliberately — see the note in mahoraga.js
    pushRadius: 0.62,
    hurtRadius: 0.82, hurtHeight: 1.75, hurtCenter: 1.25, hurtPad: 0.22,
    strikeY: 1.55,
    stepShake: 0.09,
    camDist: 1.12, camHeight: 0.35, camPitch: 0.03
  },

  // ---- B · SPECIAL — ROOT FIELD ----------------------------------
  // He converts a patch of ground around him into natural terrain: grass and
  // roots come up through concrete. Inside it his regeneration is at maximum
  // and the opponent is SLOWED — the canon Flower Field's sapping calm,
  // expressed as the thing a fighting game can actually use.
  //
  // This is how he functions on urban maps: he builds his own forest. Fields
  // persist, they OVERLAP (a doubled field does not double the regen, but it
  // does double the area he is safe in), and they are DESTRUCTIBLE — heavy
  // attacks tear them up and fire burns them out.
  special: {
    key: 'hanami_rootfield', name: 'ROOT FIELD', jp: '花畑',
    cost: 24, cooldown: 12, castFrames: 34, clip: 'rootField',
    radius: 5.5, duration: 16, slowMult: 0.72,
    // what it takes to kill a patch of it
    hp: 100, heavyDamage: 34, fireDamage: 55, burnPerSecond: 26
  },

  // ---- D-pad Right · ULTIMATE — WOODEN BALL -------------------------------
  // 木の鞠. NON-DOMAIN, so it pays the standard gate (MAX_CE 100 + a full bar)
  // and the full bar, takes the standard backlash, and gets the FASTER startup
  // that Nanami's Collapse and Todo's Brotherhood get.
  //
  // An enormous mass of wood condensed overhead and dropped. Huge damage in a
  // wide radius — and on impact it SHATTERS into a spreading root field that
  // converts a large area of the map to natural terrain FOR THE REST OF THE
  // ROUND. That duality is the payoff of the character: it is a kill attempt
  // and a permanent terrain play at the same time, and against a healthy
  // opponent it is often correct to throw it purely for the ground.
  ultimate: {
    kind: 'burst', name: 'WOODEN BALL', jpName: '木の鞠',
    startup: 34, active: 20, recovery: 39,         // 93f = the clip's 1.55 s
    effect: 'hanami_woodenball', clip: 'ult',
    dmg: 52, radius: 6.5, dropDelay: 0.55, kb: 7.0, kbY: 4.0, hitstun: 42,
    // the spike burst on impact (canon: the ball sprouts and fires spikes)
    spikes: 18,
    // and the ground it leaves behind
    field: { radius: 11.0, duration: 999, permanent: true }
  },

  // canon-correct: no Domain Expansion
  domain: null,

  simpleDomainDrain: 18,
  barrierBreak: { ceDrain: 26, chip: 30 },

  // YUTA'S COPY. What he steals off Hanami is the ERUPTION, not the seed and
  // not the field: the bud is a six-second parasite that needs an owner to
  // feed, and a field is terrain, which is not a thing Copy can hold in a slot.
  // The spikes are the technique, so the spikes are what he gets.
  copyEffect: { effect: 'hanami_roots', dmg: 11, name: 'Copied: Root Eruption' }
});
