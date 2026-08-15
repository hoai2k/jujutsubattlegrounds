// Character config schema. Adding a 4th character = one model file (art/models),
// one anim file (art/anim), one config file here, then register in index.js.
//
// {
//   id, name, title,                     // identity (title shows on plates)
//   stats: {
//     hp, walkSpeed, runSpeed, dashSpeed, jumpVel,
//     startMaxCE,        // MAX_CE at round start and after an ultimate
//     ceRegen,           // CURRENT_CE per second (halted during backlash)
//     ceGainPerPunch,    // MAX_CE growth per landed punch (cap 100)
//     stamina, staminaRegen, dashDrain,
//     damageScale,       // outgoing damage multiplier
//   },
//   punches: [3x { dmg, startup, active, recovery, reach, kb, kbY, hitstun, type }],
//                        // frames @60Hz; type: light | heavy | launcher
//   heavy: { ...same shape, type: 'knockdown', staminaCost, clip },
//                        // the knockdown swing — see HEAVY_DEFAULT below
//   ct1 / ct2: { name, cost, startup, active, recovery, effect, dmg, ... , clip },
//                        // effect = key into the match effect dispatcher
//   ultimate: { kind: 'domain' | 'burst', name, ... },
//   domain: null | {     // null = canon has no domain (Nanami)
//     name, jpName, refinement,          // refinement decides domain clashes
//     castFrames, duration, sureHit: { interval, effect },
//     backlash: { duration, regenMult, growthMult },
//   },
//   finishers: null | [ {...} ],       // OPTIONAL. Match-win cinematics for
//                        // this character, in the shape src/finishers/registry.js
//                        // documents. Absent (the normal case) means the
//                        // finisher registry's own entry for the pick is used,
//                        // and no entry there means the match goes straight to
//                        // the win screen exactly as it always has.
//   simpleDomainDrain,   // stamina/s while holding Simple Domain inside a domain
//   barrierBreak: { ceDrain, chip },     // per-second while channeling a break
//   copyEffect: { effect, dmg }          // what Yuta's Copy yields from this char
// }

import { applyHealthScale } from '../combat/balance.js';

export const PUNCH_DEFAULTS = [
  { dmg: 4, startup: 6, active: 3, recovery: 12, reach: 1.35, kb: 1.6, kbY: 0, hitstun: 14, type: 'light' },
  { dmg: 5, startup: 7, active: 3, recovery: 14, reach: 1.45, kb: 2.2, kbY: 0, hitstun: 16, type: 'light' },
  { dmg: 8, startup: 10, active: 4, recovery: 20, reach: 1.5, kb: 3.6, kbY: 7.6, hitstun: 26, type: 'launcher' }
];

// HEAVY (pad Y / L / .): one committed slow swing per character that always
// puts the opponent on the floor — type 'knockdown', so it ends juggles and
// hands the attacker the wake-up situation. Costs stamina so it can't be
// mashed, and the long recovery is the whiff punish. Every character gets one:
// `heavy` merges over this, so a config only states what it changes.
export const HEAVY_DEFAULT = {
  name: 'Heavy', dmg: 14, startup: 16, active: 5, recovery: 28,
  reach: 1.85, kb: 5.5, kbY: 0, hitstun: 30, type: 'knockdown',
  step: 2.4, staminaCost: 20, armorFrames: 0, ceGain: 1.6, clip: 'heavy'
};

export function withDefaults(cfg) {
  // GLOBAL BALANCE. Health is scaled here, once, at the single point every
  // character config passes through — so `cfg.stats.hp` IS the scaled number
  // everywhere downstream (the HUD bar, the round reset, every heal clamp) and
  // no consumer has to know it happened. Damage is NOT scaled here: it is
  // applied per hit in fighter.applyHit, because a technique's damage lives in
  // a dozen different nested shapes and the hit pipeline is the one place all
  // of them meet. See combat/balance.js for the three dials.
  return applyHealthScale({
    simpleDomainDrain: 20,
    barrierBreak: { ceDrain: 30, chip: 22 },
    ...cfg,
    heavy: { ...HEAVY_DEFAULT, ...(cfg.heavy || {}) },
    stats: {
      hp: 100, walkSpeed: 2.6, runSpeed: 5.2, dashSpeed: 8.6, jumpVel: 8.8,
      startMaxCE: 40, ceRegen: 2.2, ceGainPerPunch: 6,
      stamina: 100, staminaRegen: 22, dashDrain: 26, damageScale: 1,
      ...cfg.stats
    },
    punches: cfg.punches || PUNCH_DEFAULTS.map(p => ({ ...p }))
  });
}
