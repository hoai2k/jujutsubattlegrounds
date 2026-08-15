// YUJI — no innate technique, no domain (canon). Pure physical output: the
// bar grows fastest through punching, techniques are cheap and purely
// offensive, and BLACK FLASH — a tight timing input on any connect — is the
// engine that refunds and spikes his cursed energy.
import { withDefaults } from './schema.js';

export const YUJI = withDefaults({
  id: 'yuji', name: 'YUJI', title: "SUKUNA'S VESSEL",
  stats: {
    hp: 105, walkSpeed: 2.7, runSpeed: 5.6, dashSpeed: 9.0,
    startMaxCE: 40, ceRegen: 2.0, ceGainPerPunch: 9, damageScale: 1.05,
    stamina: 120, staminaRegen: 26, dashDrain: 24
  },
  // slightly faster string with bigger forward steps than the rest of the
  // roster — he walks you down. The string builds MAX_CE and pressure; it
  // does NOT open Black Flash (only his techniques do).
  punches: [
    { dmg: 5, startup: 5, active: 3, recovery: 10, reach: 1.4, kb: 1.8, kbY: 0, hitstun: 14, type: 'light', step: 2.2 },
    { dmg: 6, startup: 6, active: 3, recovery: 12, reach: 1.5, kb: 2.4, kbY: 0, hitstun: 16, type: 'light', step: 2.2 },
    { dmg: 9, startup: 9, active: 4, recovery: 18, reach: 1.55, kb: 3.8, kbY: 7.8, hitstun: 26, type: 'launcher', step: 2.4 }
  ],
  // HEAVY — OVERHAND SMASH: the biggest bare-hand hit in the roster and the
  // slowest. He plants and throws his whole weight into it, eating a jab on the
  // way in (armor through the windup) to get there.
  heavy: {
    name: 'Overhand Smash', dmg: 19, startup: 19, active: 5, recovery: 30,
    reach: 1.9, kb: 6.2, hitstun: 32, step: 3.0, staminaCost: 24, armorFrames: 18
  },
  // BLACK FLASH: only his TECHNIQUES open the window — Divergent Fist, its
  // delayed shockwave, and Manji Kick. The punch string cannot. `window`
  // frames open after `delay` frames; pressing punch inside lands 黒閃 at
  // dmgMult × the connecting hit. Chain: each consecutive Flash adds chainDmg
  // to his damage multiplier until he whiffs a technique or gets hit.
  // Landing one refunds CURRENT_CE and spikes MAX_CE — his resource engine.
  blackFlash: {
    delay: 6, window: 5, dmgMult: 2.5, chainDmg: 0.06,
    ceRefund: 25, maxSpike: 8, reach: 2.4
  },
  ct1: {
    // straight hit now, shockwave a beat later — the delayed launch catches
    // anyone acting right after the block/hit. Both impacts are BF eligible.
    name: 'Divergent Fist', cost: 10, startup: 14, active: 4, recovery: 18,
    effect: 'yuji_divergent', dmg: 7, dmg2: 10, delay: 0.45,
    reach: 1.9, arc: 1.6, kb: 2, hitstun: 18, clip: 'ct1'
  },
  ct2: {
    // committed spinning kick: gap-closer, combo ender, domain-cast punish
    name: 'Manji Kick', cost: 8, staminaCost: 22, startup: 15, active: 9, recovery: 24,
    effect: 'yuji_manji', dmg: 11, lungeSpeed: 13.5, kb: 7, kbY: 2, hitstun: 24, clip: 'ct2'
  },
  // SPECIAL — BLACK FLASH: B pressed inside the window a landed
  // technique opens (see blackFlash above). No CE cost — landing one REFUNDS
  // energy, that's the engine — and a short cooldown so one Divergent Fist
  // can't be double-dipped for two Flashes.
  special: { key: 'yuji_blackflash', name: 'BLACK FLASH', cost: 0, cooldown: 1.5 },
  ultimate: {
    // NOT a domain: faster startup, less commitment (the Collapse tradeoff).
    // Sukuna surfaces: markings + aura, damage/speed spike, the punch string
    // becomes Dismantle slashes. When the window ends the rent comes due —
    // recoil damage and a CE-regen blackout (standard backlash).
    kind: 'transform', name: "SUKUNA'S MANIFESTATION", jpName: '両面宿儺',
    startup: 34, recovery: 22, effect: 'yuji_sukuna', clip: 'sukuna',
    duration: 8, dmgMult: 1.35, speedMult: 1.12, recoil: 12,
    backlash: { duration: 8, growthMult: 0.5 }
  },
  // Dismantle string while Sukuna is surfaced: faster, chunkier, slash VFX
  sukunaPunches: [
    { dmg: 7, startup: 4, active: 3, recovery: 8, reach: 1.6, kb: 1.6, kbY: 0, hitstun: 14, type: 'light', step: 2.4, sukuna: true, clip: 'slash1' },
    { dmg: 7, startup: 5, active: 3, recovery: 10, reach: 1.7, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 2.4, sukuna: true, clip: 'slash2' },
    { dmg: 11, startup: 7, active: 4, recovery: 15, reach: 1.75, kb: 4.2, kbY: 8.0, hitstun: 26, type: 'launcher', step: 2.6, sukuna: true, clip: 'slash3' }
  ],
  domain: null, // canon-correct: no innate technique, no domain
  simpleDomainDrain: 16,
  barrierBreak: { ceDrain: 28, chip: 30 },
  copyEffect: { effect: 'yuji_divergent', dmg: 8, name: 'Copied: Divergent Fist' }
});
