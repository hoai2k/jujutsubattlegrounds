// YUTA — Copy / Rika. Highest raw output, hardest to pilot.
import { withDefaults, PUNCH_DEFAULTS } from './schema.js';
import { SWORD_TABLE } from './yuta_swords.js';

export const YUTA = withDefaults({
  id: 'yuta', name: 'YUTA', title: 'SPECIAL GRADE',
  stats: {
    hp: 100, walkSpeed: 2.6, runSpeed: 5.3, dashSpeed: 8.8,
    startMaxCE: 40, ceRegen: 2.4, ceGainPerPunch: 6, damageScale: 1.08
  },
  punches: PUNCH_DEFAULTS.map((p, i) => ({ ...p, dmg: [4, 5, 8][i] })),
  // HEAVY — RIKA SLAM: he swings, Rika lands it. Armored through the windup
  // like his Cleave, and it spikes airborne opponents straight into the floor.
  heavy: {
    name: 'Rika Slam', dmg: 17, startup: 18, active: 6, recovery: 29,
    reach: 2.1, kb: 5.4, hitstun: 32, step: 2.2, staminaCost: 22, armorFrames: 16
  },
  ct1: {
    // RIKA'S GRASP — her oversized spectral hand flown down the lane
    // (stick-steered). What it catches it BRINGS BACK, deposited at arm's
    // reach in front of Yuta with the combo already his: the payoff moved
    // from knockback to position, which is the scarier gift.
    name: 'Rika: Grasp', cost: 18, startup: 26, active: 6, recovery: 30,
    effect: 'yuta_rika_swing', dmg: 14, range: 6.0, speed: 17, dragGap: 1.6,
    hitstun: 26, armorFrames: 26, clip: 'ct1'
  },
  ct2: {
    name: 'Rika: Lunge', cost: 12, startup: 12, active: 9, recovery: 16,
    effect: 'yuta_lunge', dmg: 8, lungeSpeed: 14, reach: 1.6, kb: 1.2, hitstun: 18, clip: 'ct2'
  },
  // Passive: after being hit by an opponent CT, B mimics a weaker copy once.
  // Passive COPY. Two ways to load the slot: land a punch on someone
  // (stealOnPunch — reliable, the intended route) or get hit by their cursed
  // technique (costs health to learn). Storing from a new source overwrites.
  copy: { powerMult: 0.62, clip: 'cast', stealOnPunch: true },
  // SPECIAL — USE COPIED TECHNIQUE: fires the stored technique back at
  // reduced power in his own green-white energy. One slot; storing overwrites,
  // using clears. The HUD shows what's loaded (source accent color) or EMPTY.
  special: { key: 'yuta_copy', name: 'COPY', cost: 10, cooldown: 3 },
  ultimate: { kind: 'domain' },
  domain: {
    // AUTHENTIC MUTUAL LOVE — sword-pickup random-technique payload (Jujutsu
    // Shenanigans style). A volley of katanas embeds across the field; Yuta
    // starts unarmed, runs a blade down, and the sure-hit fires ON CONNECT:
    // the lunging slash can be spaced or whiffed, but once it lands the rolled
    // technique applies in full — no block, no guard, no mitigation. Only the
    // standing domain counters answer it (barrier break / clash / Simple Domain).
    name: 'AUTHENTIC MUTUAL LOVE', jpName: '真贋相愛', refinement: 7,
    castFrames: 96, duration: 20, env: 'swordfield',
    sureHit: { effect: 'sword_rain' },
    swords: {
      volley: 7,            // formation volley (code enforces a hard floor of 6)
      refill: 3,            // small refill volley once the field runs dry
      refillDelay: 1.6,     // seconds of empty arena before the refill drops
      pickupRadius: 1.2,    // run-into auto-pickup range
      carrySpeedMult: 1.24, // movement bonus while holding a blade
      unarmedPunchMult: 0.5,// bare-hand punch damage inside his own domain
      staggerDmg: 3,        // the slash contact itself — the roll is the payoff
      swing: {
        name: 'Imbued Slash', startup: 13, active: 8, recovery: 26,
        lungeSpeed: 12, reach: 2.5, arc: 2.0, effect: 'sword_slash', clip: 'swordSlash'
      },
      table: SWORD_TABLE
    },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },
  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  copyEffect: { effect: 'yuta_rika_swing', dmg: 9, name: 'Copied: Rika' }
});
