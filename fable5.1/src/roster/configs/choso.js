// CHOSO — Blood Manipulation. The mid-range controller: he fights in the
// awkward band just outside melee, punishes approaches, and whittles you down.
// Slower and more deliberate than the students, durable, and with the best
// conversion in the roster once FLOWING RED SCALE is up.
//
// ---------------------------------------------------------------------------
// THE SECOND RESOURCE: BLOOD 血
// ---------------------------------------------------------------------------
// A dedicated gauge, separate from cursed energy, shown on his HUD plate. It
// fills as he deals damage AND as he takes it, so it rewards being in the
// fight rather than running from it. Every technique he owns costs Blood on
// top of its cursed-energy cost.
//
// HE DOES NOT TAKE SELF-DAMAGE. There is no health cost anywhere in this file
// and no passive self-harm anywhere in his implementation — the Blood gauge IS
// the cost, and his health bar is never spent. (Look for `blood:` on the moves
// below; that is the whole economy.) The fiction is that a Death Painting Womb
// makes blood rather than losing it, which is also why he is the one character
// whose second resource fills from being hit.
//
// Canon-correct: NO DOMAIN EXPANSION. His D-pad Right is a burst ultimate with
// the faster startup and lower commitment every non-domain ultimate in this
// project gets — the same trade Nanami, Todo, Toji, Hanami and Kurourushi make.
import { withDefaults } from './schema.js';

export const CHOSO = withDefaults({
  id: 'choso', name: 'CHOSO', title: 'DEATH PAINTING — THE ELDEST',
  stats: {
    // Durable and deliberate. Above-average health, below-average legs, and a
    // dash that does not save him — he is supposed to hold ground, not escape.
    hp: 116, walkSpeed: 2.5, runSpeed: 4.9, dashSpeed: 8.3, jumpVel: 8.5,
    startMaxCE: 40, ceRegen: 2.3, ceGainPerPunch: 6, damageScale: 1.0,
    stamina: 108, staminaRegen: 22, dashDrain: 26
  },

  // ---- BLOOD ---------------------------------------------------------------
  // `perDamageDealt` and `perDamageTaken` are multipliers on the damage number
  // itself, applied at the single choke point every damage route in the game
  // already passes through (Fighter.applyHit / takeChip). Taking a hit pays
  // more than landing one: that is the whole "reward being in the fight" half,
  // and it is what stops a Choso who is losing from also being a Choso who
  // cannot use his kit.
  blood: {
    max: 100, start: 25,
    perDamageDealt: 0.85,
    perDamageTaken: 1.30,
    // MEASURED AND RAISED from 1.4. Every technique he owns is Blood-negative
    // — Blood Edge costs 10 and its 8 damage only pays back about 7 — so at
    // 1.4/s a Choso who was poking could never climb to the 45 that Flowing
    // Red Scale costs. The CPU profile made this obvious: it either poked all
    // round and never boiled, or banked in silence and did no damage for
    // thirty seconds. At 2.0/s he can hold the band, keep throwing, and still
    // reach the buff — which is the gameplan the character is written around.
    //
    // It is still far too slow to FUND the kit: a Piercing Blood is 17 seconds
    // of standing still. The gauge is meant to be paid for in the fight.
    regen: 2.0,
    lowWarn: 20
  },

  // 3-hit string. Solid, unremarkable, average damage, GOOD reach for a
  // bare-handed string — he is long-armed and he uses it. The third launches.
  // His fists are not the point and the numbers say so.
  punches: [
    { dmg: 4, startup: 7, active: 3, recovery: 13, reach: 1.50, kb: 1.7, kbY: 0, hitstun: 14, type: 'light', step: 1.6 },
    { dmg: 5, startup: 8, active: 3, recovery: 15, reach: 1.55, kb: 2.3, kbY: 0, hitstun: 16, type: 'light', step: 1.6 },
    { dmg: 8, startup: 11, active: 4, recovery: 21, reach: 1.62, kb: 3.6, kbY: 7.6, hitstun: 26, type: 'launcher', step: 1.9 }
  ],
  // HEAVY — BLOOD CLUB: the blood hardens around his forearm and he swings it
  // like a bar. Long reach for a bare arm, armour through the wind-up.
  heavy: {
    name: 'Blood Club', dmg: 15, startup: 17, active: 5, recovery: 29,
    reach: 2.00, kb: 5.6, hitstun: 30, step: 2.2, staminaCost: 20, armorFrames: 10,
    blood: 6
  },

  ct1: {
    // BLOOD EDGE 血刃 — a fast hardened-blood blade thrown flat. Low
    // commitment, good chip, medium travel, and it FALLS OFF past `falloffAt`
    // rather than stopping: the whole point of the move is that it owns one
    // band of the floor and is a poor answer outside it.
    name: 'Blood Edge', cost: 10, blood: 10,
    startup: 13, active: 4, recovery: 18,
    effect: 'choso_blood_edge', dmg: 8,
    speed: 19, range: 11.5, falloffAt: 7.0, falloffMin: 0.45,
    kb: 1.8, kbY: 0, hitstun: 16, clip: 'ct1'
  },
  ct2: {
    // PIERCING BLOOD 穿血 — the big-damage read. A committed lance fired in a
    // straight line at extreme speed that PIERCES: it does not stop on the
    // first thing it touches, it keeps going through the opponent and through
    // destructible geometry alike.
    //
    // REACTABLE BY DESIGN. 28 frames of startup is nearly half a second and
    // the animation loads for a quarter of it with no travel at all; the
    // recovery is the longest non-ultimate in his kit. This is a punish and a
    // hard read, not a poke, and the Blood cost means he gets a handful of
    // them a round.
    name: 'Piercing Blood', cost: 24, blood: 34,
    startup: 28, active: 4, recovery: 34,
    effect: 'choso_piercing_blood', dmg: 30,
    range: 22, width: 1.05, pierce: true,
    kb: 6.5, kbY: 1.6, hitstun: 34, clip: 'ct2'
  },

  // SPECIAL — FLOWING RED SCALE 赤鱗躍動 (B).
  // He boils his own blood. For `duration` seconds his physical damage, his
  // speed and the armour on his normals all go up, and the zoner becomes a
  // rushdown character — this is the payoff his entire neutral game is saving
  // for. The price is the largest single Blood cost in the kit and a genuinely
  // vulnerable 30-frame activation with no hitbox at all, which is why the
  // right time to press it is BEFORE the approach, not during one.
  //
  // No health cost. See the header.
  special: {
    key: 'choso_redscale', name: 'FLOWING RED SCALE',
    cost: 16, blood: 45, cooldown: 14,
    castFrames: 30, recovery: 16, duration: 9,
    dmgMult: 1.34, speedMult: 1.18,
    // armour ON HIS NORMALS ONLY — the punch string and the heavy. It does not
    // armour his techniques, so Red Scale does not make Piercing Blood safe.
    armorFrames: 10,
    clip: 'redScale'
  },

  ultimate: {
    // SUPERNOVA 超新星 — non-domain, so the standard trade: faster startup and
    // less commitment than a domain, full bar and standard backlash.
    //
    // RESEARCH NOTE. The brief described this as "a massive delayed explosion
    // in a wide radius" and asked for the name and appearance to be checked.
    // The NAME is right — Supernova is Choso's own invention, honed over 150
    // years. The APPEARANCE is not quite: canon is CONVERGENCE first (blood
    // compressed into dense pellets) and then Supernova firing them outward in
    // every direction at once, with the option to detonate them like
    // explosives. So the shape here is the brief's — aimed with the left
    // stick, short travel, delayed detonation, wide radius — but what actually
    // detonates is a SPHERE OF PELLETS thrown outward from the point, which is
    // the canon read and also the more legible one on screen.
    kind: 'burst', name: 'SUPERNOVA', jpName: '超新星',
    startup: 32, active: 1, recovery: 30,
    effect: 'choso_supernova', clip: 'ult',
    aimRange: 11,          // how far the left stick can place the detonation
    travel: 0.42,          // seconds from his hands to the point
    fuse: 0.55,            // the delay once it arrives — the telegraph
    radius: 5.2, dmg: 46, pellets: 22,
    kb: 8, kbY: 4.5, hitstun: 40
    // NO `backlash` BLOCK, and that is the standard rather than an omission.
    // In this project a domain charges a regen blackout on top of its cost;
    // a BURST ultimate's whole price is `consumeFullBar()` — CURRENT_CE to
    // zero and MAX_CE reset to its opening value, which is a long climb back.
    // Nanami, Todo, Hanami and Kurourushi all work exactly this way, and an
    // earlier pass here declared a `backlash` object that the burst path never
    // reads: dead data that would have read as a rule nobody enforced. It is
    // gone, and Choso pays what every other non-domain ultimate pays.
  },

  domain: null,            // canon-correct: Choso has no Domain Expansion
  simpleDomainDrain: 17,
  barrierBreak: { ceDrain: 30, chip: 26 },
  // Yuta stores the TECHNIQUE, never the gauge. Blood Edge is the only thing
  // about Choso that is a technique in the ordinary sense — Piercing Blood is
  // the same technique at a scale Yuta has no Blood to pay for, and Flowing
  // Red Scale is a man boiling his own circulation, which is not a thing you
  // can copy without the body that makes it.
  copyEffect: { effect: 'choso_blood_edge', dmg: 7, name: 'Copied: Blood Edge' }
});
