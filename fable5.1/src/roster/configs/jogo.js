// JOGO — Disaster Flames. The roster's only true zoner: he controls space with
// fire and punishes anyone who stands still. Slow, fragile in a scramble,
// devastating with room to breathe. Techniques are expensive — he has to land
// punches to fund them, which forces him forward sometimes.
// Burn DoT does NOT feed his MAX_CE growth (see combat/burn.js) — only direct
// hits do, or he snowballs from full screen.
import { withDefaults } from './schema.js';

export const JOGO = withDefaults({
  id: 'jogo', name: 'JOGO', title: 'DISASTER CURSE',
  stats: {
    // below-average health and stamina, mediocre dash — the zoner's tax
    hp: 90, walkSpeed: 2.5, runSpeed: 5.0, dashSpeed: 8.0, jumpVel: 8.4,
    startMaxCE: 42, ceRegen: 2.5, ceGainPerPunch: 6, damageScale: 1.0,
    stamina: 85, staminaRegen: 20, dashDrain: 28
  },
  // weakest normals in the game, short reach — he is not a brawler. The 3rd
  // hit is a small eruption that KNOCKS DOWN rather than launches: it ends
  // the exchange and buys him the space he actually wants.
  punches: [
    { dmg: 3, startup: 7, active: 3, recovery: 13, reach: 1.25, kb: 1.6, kbY: 0, hitstun: 14, type: 'light', step: 1.3 },
    { dmg: 3, startup: 8, active: 3, recovery: 15, reach: 1.3, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 1.3 },
    { dmg: 6, startup: 11, active: 4, recovery: 22, reach: 1.35, kb: 4.5, kbY: 0, hitstun: 26, type: 'knockdown', step: 1.5, clip: 'punch3' }
  ],
  // HEAVY — MAGMA BURST: a squat pop of flame off the crater. Weak for a
  // heavy; it exists to end pressure, not to deal damage.
  heavy: {
    name: 'Magma Burst', dmg: 12, startup: 17, active: 5, recovery: 30,
    reach: 1.7, kb: 6.0, hitstun: 28, step: 1.6, staminaCost: 20, clip: 'heavy'
  },
  ct1: {
    // EMBER INSECTS — his neutral tool: a swarm of small homing flame
    // projectiles with loose tracking. Low damage each, one burn stack each.
    // MAXIMUM (Overheat): a dense screen-crossing swarm.
    name: 'Ember Insects', cost: 14, startup: 16, active: 4, recovery: 22,
    effect: 'jogo_embers', dmg: 2.5, count: 4, speed: 9, homing: 2.4,
    burnStacks: 1, range: 12, clip: 'ct1',
    maximum: { count: 10, dmg: 3, speed: 11, homing: 3.2, range: 24 }
  },
  ct2: {
    // VOLCANIC ERUPTION — a delayed eruption at a targeted ground position
    // (aim with the left stick; neutral targets the opponent's feet). The
    // glowing marker telegraph IS the move: a trap and a wake-up punish, not
    // a fast button. MAXIMUM (Overheat): a wide multi-stage eruption.
    name: 'Volcanic Eruption', cost: 26, startup: 20, active: 4, recovery: 28,
    effect: 'jogo_eruption', dmg: 18, delay: 0.85, radius: 2.2, aimRange: 8,
    kb: 4, kbY: 9, burnStacks: 2, clip: 'ct2',
    maximum: { dmg: 14, radius: 3.0, stages: 3, stageGap: 0.55 }
  },
  // LB dash leaves burning ground behind him for a couple of seconds —
  // chasing Jogo through his own wake costs you burn stacks.
  dashFire: { life: 2.2, radius: 1.05, dropEvery: 0.14, stackEvery: 0.5 },
  // weak guard: blocking drains stamina fast (see fighter.js block chip)
  blockStaminaMult: 1.6,
  // SPECIAL — OVERHEAT (B): a short vulnerable channel; his head
  // vents and both CTs upgrade to their MAXIMUM versions for the duration.
  special: {
    key: 'jogo_overheat', name: 'OVERHEAT', cost: 30, cooldown: 16,
    channelFrames: 46, duration: 10, clip: 'overheat'
  },
  ultimate: { kind: 'domain' },
  domain: {
    // COFFIN OF THE IRON MOUNTAIN — pure attrition, the deliberate contrast
    // to Gojo's lockdown: no stun, no control, just continuous unavoidable
    // heat that cannot be blocked and burn stacks that never decay while it
    // holds. Magma erupts from the floor at intervals (sure-hit rule: these
    // land, they are not dodgeable hitboxes). Jogo is immune and faster inside.
    name: 'COFFIN OF THE IRON MOUNTAIN', jpName: '蓋棺鉄囲山', refinement: 8,
    castFrames: 96, duration: 20, env: 'volcano',
    sureHit: { effect: 'iron_mountain', interval: 0 },
    heat: {
      dps: 2.6,            // constant unblockable tick on everyone trapped
      stackEvery: 1.4,     // a burn stack builds automatically this often
      eruptEvery: 2.4,     // guaranteed magma eruption under each victim
      eruptDmg: 6,
      casterSpeedMult: 1.22
    },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },
  simpleDomainDrain: 22,
  barrierBreak: { ceDrain: 30, chip: 22 },
  copyEffect: { effect: 'jogo_embers', dmg: 2, count: 3, name: 'Copied: Ember Insects' }
});
