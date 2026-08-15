// GOJO — Limitless. Zone control, best domain in the game, weakest raw melee.
import { withDefaults, PUNCH_DEFAULTS } from './schema.js';

export const GOJO = withDefaults({
  id: 'gojo', name: 'GOJO', title: 'THE HONORED ONE',
  stats: {
    hp: 95, walkSpeed: 2.7, runSpeed: 5.5, dashSpeed: 9.2,
    startMaxCE: 45, ceRegen: 2.6, ceGainPerPunch: 6, damageScale: 0.92
  },
  punches: PUNCH_DEFAULTS.map((p, i) => ({ ...p, dmg: [3, 4, 7][i] })),
  // HEAVY — LIMITLESS HEEL: a bored spinning heel drop. Cheapest and fastest
  // knockdown in the roster and by far the weakest: he is not here to brawl,
  // he is here to make space for the next Red.
  heavy: {
    name: 'Limitless Heel', dmg: 11, startup: 14, active: 5, recovery: 26,
    reach: 1.9, kb: 7.0, hitstun: 28, step: 2.2, staminaCost: 16, clip: 'heavy'
  },
  ct1: {
    name: 'Reversal: Red', cost: 20, startup: 22, active: 5, recovery: 24,
    effect: 'gojo_red', dmg: 11, range: 7.5, kb: 7.5, kbY: 3.2, clip: 'ct1',
    charged: { dmg: 17, range: 11, kb: 10, radius: 2.4 }
  },
  ct2: {
    name: 'Lapse: Blue', cost: 15, startup: 18, active: 6, recovery: 22,
    effect: 'gojo_blue', dmg: 5, range: 6.5, pullTime: 0.7, clip: 'ct2',
    charged: { dmg: 9, range: 9.5, pullTime: 1.0 }
  },
  // Blue then Red while charged inside this window -> Hollow Purple
  purple: {
    name: 'Hollow Purple', windowFrames: 90, startup: 50, active: 40, recovery: 30,
    effect: 'purple', dmg: 45, width: 1.6, clip: 'purple'
  },
  // SPECIAL — TELEPORT: stick direction picks the exit, neutral warps behind
  // the opponent. I-frames through the blink; sealed inside enemy domains.
  special: {
    key: 'gojo_teleport', name: 'TELEPORT', cost: 12, cooldown: 5,
    range: 4, behindGap: 1.5, iFrames: 18, stateFrames: 12, clip: 'special'
  },
  ultimate: { kind: 'domain' },
  domain: {
    name: 'UNLIMITED VOID', jpName: '無量空処', refinement: 10,
    // Shortest window in the roster — total lockdown is the strongest effect
    // in the game, so it is paid for in duration. Releasable early.
    castFrames: 96, duration: 7, env: 'void',
    // Information overload: no direct damage — the victim is locked down,
    // free hits are the damage. Lingering neuro debuff afterward.
    sureHit: { interval: 0, effect: 'void_lock' },
    afterDebuff: { duration: 5, speedMult: 0.72 },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },
  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  copyEffect: { effect: 'gojo_red', dmg: 7, name: 'Copied: Red' }
});
