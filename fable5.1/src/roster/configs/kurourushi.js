// KUROURUSHI — 黒沐死. The attrition monster.
//
// He never gets a clean knockout. He covers the field in swarms, melts through
// guard with digestive fluid, and grows physically larger and stronger by
// eating — until there is nothing left of you. The exact opposite of a burst
// character, and deliberately the opposite of Hanami too: Hanami denies you
// ground, Kurourushi takes ground and then takes YOU.
//
// GLUTTONY is a second resource, unique to him, shown on his HUD. It fills
// when DEVOUR lands and when his swarms connect, and it NEVER DECAYS. At each
// threshold he physically GROWS — the model scales, the plating thickens, more
// limbs articulate — gaining damage, reach and health and losing a little
// speed. The opponent must be able to see how far gone he is at a glance, and
// they can: he is visibly bigger.
//
// NAVIGATION AT SIZE. Reused wholesale from Mahoraga's ruling (see
// characters/mahoraga.js): the model scales and NOTHING about navigation does.
// `bodyRadius` stays at the human 0.36 and the wall probe stays at human
// height, so a fully grown Kurourushi can physically go everywhere a fresh one
// can and "stuck in the Shibuya ticket hall at stage 3" is impossible by
// construction rather than by testing. The size lives in the hurt capsule, the
// reach numbers, the push radius and the camera — none of which have
// navigation consequences.
//
// Canon-correct: whether Kurourushi can expand a domain is never established
// in the source and he never does — so he has NO Domain Expansion here, and
// D-pad Right is a burst ultimate on the faster non-domain startup tier.
import { withDefaults } from './schema.js';

export const KUROURUSHI = withDefaults({
  id: 'kurourushi', name: 'KUROURUSHI', title: 'SPECIAL GRADE — THE SWARM',
  jpName: '黒沐死',

  stats: {
    hp: 135, walkSpeed: 2.60, runSpeed: 5.10, dashSpeed: 9.20, jumpVel: 8.20,
    startMaxCE: 40, ceRegen: 2.4, ceGainPerPunch: 6, damageScale: 1.0,
    // the tank that cannot afford to guard: low stamina, slow regen
    stamina: 95, staminaRegen: 18, dashDrain: 24
  },

  // ---- GLUTTONY + GROWTH --------------------------------------------------
  // Three stages beyond base, and the count is a config value exactly as asked
  // — `thresholds.length` is the number of stages and everything downstream
  // (the HUD pips, the model's plate thickening, the per-stage bonuses) reads
  // it rather than assuming three.
  gluttony: {
    max: 100,
    thresholds: [25, 55, 85],
    // per stage, cumulative
    perStage: {
      scale: 0.125,      // model scale, hurt capsule, push radius
      dmg: 0.10,         // outgoing damage
      reach: 0.09,       // every reach number he has
      hp: 14,            // maximum health, and he is healed for the gain
      speed: -0.06       // walk/run/dash — he gets slower as he gets bigger
    },
    // what feeds it
    perSwarmTick: 0.8,
    perDevour: 14,
    perSelfDevourRoach: 0.5,
    selfDevourMax: 8,
    perInfestationSecond: 3.6
  },

  // ---- X · THE MULTI-LIMB STRING ------------------------------------------
  // FAST for a heavyweight — the opening jab is 6 frames, which is roster-jab
  // speed on a 135 HP body — and very WIDE horizontally, because each hit is a
  // different pair of arms sweeping across. Damage is only medium: he is not
  // supposed to kill you with his hands, he is supposed to never stop.
  // MEASURED. An earlier pass ran 5/5/11 with a 17-damage heavy, and against
  // the harness (time to three KOs on a passive opponent) he came in at 41 s
  // against Yuji's 50, Todo's 62 and Sukuna's 70 — the fastest killer in the
  // game, which is precisely the wrong shape for the attrition character. The
  // string keeps its SPEED and its REACH, which are what make him feel like
  // this, and gives up the damage, which was never supposed to be his.
  punches: [
    { name: 'Rake', dmg: 4, startup: 6, active: 3, recovery: 13, reach: 2.00, kb: 2.0, kbY: 0, hitstun: 15, type: 'light', step: 1.5 },
    { name: 'Cross Rake', dmg: 4, startup: 7, active: 3, recovery: 13, reach: 2.10, kb: 2.4, kbY: 0, hitstun: 16, type: 'light', step: 1.5 },
    { name: 'Four-Arm Sweep', dmg: 9, startup: 13, active: 5, recovery: 18, reach: 2.20, kb: 4.8, kbY: 0, hitstun: 30, type: 'knockdown', step: 1.7 }
  ],

  // Y — the pronotum shield driven forward.
  heavy: {
    name: 'Shield Charge', dmg: 15, startup: 19, active: 5, recovery: 31,
    reach: 2.30, kb: 6.0, kbY: 0, hitstun: 32, step: 2.6,
    staminaCost: 22, armorFrames: 12, ceGain: 1.6, clip: 'heavy'
  },

  // ---- RB · CT1 — SWARM ---------------------------------------------------
  // A wave of cockroaches that spread across the ground and pursue the
  // opponent independently. Low damage per tick, but they LINGER, they obscure
  // vision, and every tick feeds Gluttony. His zoning and his engine at once —
  // which is why it is the cheapest technique he has and why he throws it on
  // cooldown forever.
  //
  // THE CAP IS ABSOLUTE (see combat/swarm.js): the system culls the oldest
  // roaches to stay under it, so the renderer's cost is fixed no matter how
  // many waves are in flight.
  ct1: {
    name: 'Swarm', jpName: '蟲の群れ', cost: 14,
    startup: 12, active: 4, recovery: 31,          // 47f = the clip's 0.78 s
    effect: 'kurourushi_swarm', clip: 'ct1',
    count: 26, life: 9.0, speed: 3.4, spread: 2.2,
    tickDmg: 0.9, tickEvery: 0.55, contactRadius: 0.85,
    // the vision obscure: how much screen-space fog a roach on top of you is
    // worth, capped hard so it can never become an unplayable brownout
    obscurePerRoach: 0.020, obscureMax: 0.34
  },

  // ---- RT · CT2 — CORROSIVE SPRAY -----------------------------------------
  // A short cone of digestive fluid. On hit it MELTS GUARD: their block chip
  // and their block stamina drain both go up hard for several seconds, and it
  // leaves damage over time. This is how he beats defensive characters — and
  // it is specifically his answer to Hanami, who is otherwise a wall he cannot
  // get through.
  ct2: {
    name: 'Corrosive Spray', jpName: '消化液', cost: 20,
    startup: 18, active: 6, recovery: 28,          // 52f = the clip's 0.86 s
    effect: 'kurourushi_spray', clip: 'ct2',
    dmg: 9, reach: 4.2, arc: 0.95, kb: 1.5, kbY: 0, hitstun: 20,
    melt: { duration: 6, chipMult: 2.4, staminaMult: 1.8 },
    dot: { duration: 5, dps: 3.0 }
  },

  // ---- LT · BLOCK ---------------------------------------------------------
  // POOR, and expensive. He absorbs damage, he does not avoid it — a guard is
  // the wrong tool for him and the numbers say so.
  blockChipMult: 1.50,
  blockStaminaMult: 2.00,
  blockStartupFrames: 6,

  // ---- MASS ---------------------------------------------------------------
  kbResist: 0.80,
  launchResist: 0.72,

  size: {
    height: 2.25,
    bodyRadius: 0.36,        // HUMAN at every growth stage — see the note above
    pushRadius: 0.56,
    hurtRadius: 0.74, hurtHeight: 1.62, hurtCenter: 1.20, hurtPad: 0.18,
    strikeY: 1.45,
    stepShake: 0.06,
    camDist: 1.18, camHeight: 0.50, camPitch: 0.04
  },

  // ---- B · SPECIAL — DEVOUR --------------------------------------
  // A committed grab. On success he bites down: heavy damage, he heals for a
  // portion of it, and he takes a large chunk of Gluttony. It is SLOW enough
  // to be jumped or dashed out of — a read, not a mix-up — and it connects
  // faster against a downed opponent, which is what turns his knockdown ender
  // into a genuine loop.
  //
  // SELF-DEVOUR: with nobody in reach he eats his own swarm instead, turning
  // active roaches into Gluttony. It is a small amount and it costs him the
  // field control, but it means he is never entirely stalled — a Kurourushi
  // who cannot catch you is still getting bigger, slowly, and you have to do
  // something about that.
  special: {
    key: 'kurourushi_devour', name: 'DEVOUR', jp: '捕食',
    cost: 10, cooldown: 9, clip: 'devour', selfClip: 'selfDevour',
    startup: 24, downedStartup: 14, active: 4, recovery: 30,
    reach: 2.0, arc: 1.15,
    dmg: 30, healFrac: 0.45,
    // the victim is held for this long — the cinematic beat
    holdFrames: 46,
    selfRadius: 7.0
  },

  // ---- D-pad Right · ULTIMATE — INFESTATION -------------------------------
  // NON-DOMAIN: standard gate (MAX_CE 100 + a full bar), full bar cost,
  // standard backlash, faster startup.
  //
  // The arena floods. The screen crawls, the opponent takes continuous damage
  // ANYWHERE on the map, and every tick feeds Gluttony — potentially pushing
  // him through several growth stages at once. It should feel like the map has
  // been lost.
  //
  // IT IS SURVIVABLE, and the numbers are set so that it is: 12 seconds at
  // 3.4 dps is 41 damage against 100-145 health, so it does not kill from
  // full on its own, and the Gluttony it generates (2.4/s = 28.8) is one
  // threshold and a bit rather than the whole bar. The threat is what he
  // becomes afterwards, not the ticks.
  ultimate: {
    kind: 'burst', name: 'INFESTATION', jpName: '蟲毒',
    startup: 32, active: 18, recovery: 37,         // 87f = the clip's 1.45 s
    effect: 'kurourushi_infestation', clip: 'ult',
    // MEASURED. 12 s x 5.5 dps = 66 damage against 100-145 health: it hurts
    // badly, it does not kill from full on its own, and there is no escaping
    // it — which is the correct shape for a win condition that has to be
    // survivable. The Gluttony is the real payload: 12 x 3.6 = 43 is one
    // threshold from anywhere and two from a bar that was already building.
    duration: 12, dps: 5.5, tickEvery: 0.5,
    // the flood: how many extra roaches ride the map while it holds, on top of
    // whatever is already out. Still bounded by the swarm system's hard cap.
    floodCount: 120, floodLife: 12.5,
    obscure: 0.42
  },

  // canon: no Domain Expansion is ever established for him, so he has none
  domain: null,

  simpleDomainDrain: 24,
  barrierBreak: { ceDrain: 34, chip: 20 },

  // YUTA'S COPY. The swarm, at a fraction of the count and with no Gluttony
  // attached — Gluttony is a property of Kurourushi's body, not of the
  // technique, so there is nothing there for Copy to take.
  copyEffect: { effect: 'kurourushi_swarm', count: 10, dmg: 0.9, name: 'Copied: Swarm' }
});
