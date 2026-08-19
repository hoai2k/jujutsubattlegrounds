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
  // ---- RB · CT1 — THE RANGED SLOT ------------------------------------------
  // ROSTER CONVENTION: RB holds the character's FURTHEST-REACHING technique,
  // RT holds the strongest. Manji Slash flies 8.5 m and Divergent Bloom lands
  // at 3.2 m for nearly twice the damage, so they sit that way round.
  ct1: {
    // MANJI SLASH — the 卍 thrown rather than kicked: a spinning four-armed
    // wheel of cursed energy (real geometry) that flies out and comes back,
    // cutting on both passes. The return leg is 60% damage and catches
    // anyone who stepped in to punish the throw.
    name: 'Manji Slash', jpName: '卍斬', cost: 8, staminaCost: 22,
    startup: 15, active: 9, recovery: 24,
    effect: 'yuji_manji', dmg: 11, speed: 17, range: 8.5, size: 1.15,
    kb: 4.5, kbY: 1.5, hitstun: 24, clip: 'ct2'
  },
  // ---- RT · CT2 — THE POWER SLOT -------------------------------------------
  ct2: {
    // DIVERGENT BLOOM — no fist anywhere in it. He puts his cursed energy
    // into the deck and it comes back up under them as a crimson CE crystal,
    // which then DIVERGES: a second, bigger detonation out of the same bloom
    // a beat later, and that one launches. The delayed second impact was
    // always the identity of the technique; now it is the whole move.
    // Stick-aimed, neutral drops it on their feet. Both hits open Black Flash.
    name: 'Divergent Bloom', jpName: '硬着発散', cost: 10,
    startup: 14, active: 4, recovery: 18,
    effect: 'yuji_divergent', dmg: 7, dmg2: 10, delay: 0.45,
    reach: 3.2, radius: 2.1, clip: 'ct1'
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
  copyEffect: { effect: 'yuji_divergent', dmg: 8, name: 'Copied: Divergent Bloom' }
});
