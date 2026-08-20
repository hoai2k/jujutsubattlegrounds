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
//                        // WHICH MOVE GOES IN WHICH SLOT IS A CONVENTION —
//                        // see THE SLOT CONVENTION below. Read it before
//                        // authoring a new pair.
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

// ===========================================================================
// THE SLOT CONVENTION — which move goes on which button
// ===========================================================================
// The button map is FIXED for the whole roster (src/input/input.js owns it);
// what a character chooses is only what to put in each slot:
//
//   X   punch      the 3-hit string          Y   heavy    the knockdown swing
//   RB  ct1        THE FURTHEST-REACHING TECHNIQUE OF THE PAIR
//   RT  ct2        THE STRONGEST TECHNIQUE OF THE PAIR
//   B   special    the signature ability — and, for a summoner, the summon
//                  (directly, as Mahito and Higuruma do, or as the wheel that
//                  selects what RB/RT then throw, as Geto and Megumi do)
//   D-pad Right    the ultimate
//
// RB/RT IS THE ONE THAT NEEDS SAYING, because both slots take a technique and
// nothing in the code enforces the order. A player who has learned one
// character should be able to guess the other twenty: RB is the button you
// press to touch someone standing away from you, RT is the button you press
// when you want the exchange to hurt. Author a new pair that way round.
//
// It applies per SET, not per character: a stance or weapon that owns its own
// ct1/ct2 (Toji's arsenal, Panda's cores, Maki's weapons) follows the rule
// inside each set, so the grip means the same thing in every stance.
//
// WHERE IT CANNOT HOLD, SAY SO IN THE CONFIG. Four shapes break it, and each
// one is written up where it lives rather than being quietly wrong:
//
//   · THE STRONGEST IS ALSO THE FURTHEST — Choso (Piercing Blood), Mahoraga
//     (World-Cutting Slash), Gojo (Red), Hakari (Pachinko Volley). One rule
//     has to give; the roster keeps the move where its character reads best
//     and states which rule it is paying.
//   · RT IS NOT AN ATTACK — Nanami (Overtime), Higuruma (Confiscation),
//     Miwa (Sheathe Stance). "Strongest" means the bigger commitment, not the
//     bigger damage number.
//   · THE SLOTS ARE A WHEEL — Megumi, Geto, Inumaki. What is in them is bound
//     at runtime, so the convention is a rule about the WHEEL's content, not
//     about the config.
//   · A HOLD CHANGES THE MOVE — Sukuna's RT charges into Fire Arrow at 40 m,
//     the longest reach in the game. The slot obeys the rule; the hold does
//     not, and that is the telegraph it is priced on.
//
// A new character that fits none of those has no excuse: put the ranged one
// on RB. `test/roster.mjs` prints the reach and damage of both slots per
// character so a new pair can be eyeballed against this at author time.

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
