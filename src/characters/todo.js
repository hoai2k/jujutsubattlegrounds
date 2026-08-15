// TODO — the heavyweight. Enormous physical output, the slowest legs in the
// roster, and Boogie Woogie warping the whole spatial game: his mobility is
// the clap, not his feet. Canon-correct: no domain expansion.
import { withDefaults } from './schema.js';

export const TODO = withDefaults({
  id: 'todo', name: 'TODO', title: 'GRADE 1 — MY BROTHER',
  stats: {
    // highest health and stamina; worst ground speed and dash by design
    hp: 125, walkSpeed: 2.3, runSpeed: 4.6, dashSpeed: 7.4, jumpVel: 8.2,
    startMaxCE: 40, ceRegen: 2.2, ceGainPerPunch: 7, damageScale: 1.08,
    stamina: 135, staminaRegen: 24, dashDrain: 34
  },
  // Heaviest normals in the game, but only just: slow startups, huge reach and
  // knockback are what make them feel like a truck — NOT the damage number.
  // He lands a hair above the rest of the roster, not double it. The opener
  // carries armor, so he trades through a jab and wins the trade.
  punches: [
    { dmg: 5, startup: 9, active: 4, recovery: 16, reach: 1.7, kb: 2.6, kbY: 0, hitstun: 16, type: 'light', step: 1.8, armorFrames: 8 },
    { dmg: 6, startup: 10, active: 4, recovery: 18, reach: 1.8, kb: 3.2, kbY: 0, hitstun: 18, type: 'light', step: 1.8 },
    { dmg: 10, startup: 14, active: 5, recovery: 24, reach: 1.85, kb: 4.5, kbY: 8.6, hitstun: 28, type: 'launcher', step: 2.0 }
  ],
  // HEAVY — MOUNTAIN SPLITTER: both fists brought down like a wrecking ball
  heavy: {
    name: 'Mountain Splitter', dmg: 18, startup: 20, active: 5, recovery: 32,
    reach: 2.0, kb: 6.5, hitstun: 32, step: 2.6, staminaCost: 24, armorFrames: 14
  },
  ct1: {
    // rushing double-handed strike ending in a clap shockwave — wide arc,
    // his answer to approaches
    name: 'Clap Combo', cost: 22, startup: 18, active: 8, recovery: 26,
    effect: 'todo_clapcombo', dmg: 14, lungeSpeed: 9, radius: 2.5,
    kb: 6, kbY: 1.5, hitstun: 26, clip: 'ct1'
  },
  ct2: {
    // command grab: unblockable, slow enough to jump out of, terrifying with
    // a swap. Whiffs entirely on airborne or downed targets. The
    // unblockability IS the reward — the number stays in line with the rest
    // of the roster's heavy techniques.
    name: 'Vice Grab', cost: 26, startup: 24, active: 4, recovery: 30,
    effect: 'todo_grab', dmg: 17, reach: 1.7, clip: 'ct2'
  },
  // SPECIAL — BOOGIE WOOGIE: a clap that swaps ground positions with the
  // nearest opponent, keeping each fighter's facing, momentum, height and
  // juggle state. Cheap and short — this is his core loop, clapped constantly.
  // Works inside domains: it's an exchange within the barrier, nothing
  // crosses it (unlike Gojo's warp).
  special: { key: 'todo_boogie', name: 'BOOGIE WOOGIE', cost: 6, cooldown: 2.5, stateFrames: 10, clip: 'boogie' },
  ultimate: {
    // BROTHERHOOD — a rapid chain of swaps, each placing him at a new angle
    // for another blow, capped by one enormous finisher. Non-domain, so the
    // startup is the fast Collapse-class tier.
    kind: 'burst', name: 'BROTHERHOOD', jpName: '不義遊戯・極',
    startup: 30, active: 130, recovery: 26, effect: 'todo_brotherhood',
    swings: 5, hitDmg: 7, finDmg: 18, interval: 0.33, clip: 'ult'
  },
  domain: null, // canon-correct: Todo has no Domain Expansion
  simpleDomainDrain: 16,
  barrierBreak: { ceDrain: 30, chip: 28 },
  copyEffect: { effect: 'todo_boogie_cast', dmg: 5, name: 'Copied: Boogie Woogie' }
});
