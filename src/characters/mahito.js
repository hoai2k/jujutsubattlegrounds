// MAHITO — Idle Transfiguration. The tricky one: fights alongside a summoned
// transfigured human, reshapes his own body into weapons, and threatens the
// scariest win condition in the game inside his domain. Middling on paper —
// the pressure comes from never fighting him alone.
import { withDefaults } from './schema.js';

export const MAHITO = withDefaults({
  id: 'mahito', name: 'MAHITO', title: 'CURSED SPIRIT — SOUL',
  stats: {
    // everything middling; the dash is the one slightly-above-average stat
    hp: 100, walkSpeed: 2.6, runSpeed: 5.2, dashSpeed: 9.0, jumpVel: 8.8,
    startMaxCE: 40, ceRegen: 2.3, ceGainPerPunch: 6, damageScale: 1.0,
    stamina: 100, staminaRegen: 22, dashDrain: 26
  },
  // unnaturally stretching limbs: good reach, average damage, 3rd launches
  punches: [
    { dmg: 4, startup: 7, active: 3, recovery: 13, reach: 1.6, kb: 1.6, kbY: 0, hitstun: 14, type: 'light', step: 1.7 },
    { dmg: 5, startup: 8, active: 3, recovery: 15, reach: 1.7, kb: 2.2, kbY: 0, hitstun: 16, type: 'light', step: 1.7 },
    { dmg: 8, startup: 11, active: 4, recovery: 21, reach: 1.8, kb: 3.6, kbY: 7.8, hitstun: 26, type: 'launcher', step: 1.9 }
  ],
  // HEAVY — FLESH MAUL: the arm balloons into a mass and swats them flat
  heavy: {
    name: 'Flesh Maul', dmg: 15, startup: 17, active: 5, recovery: 29,
    reach: 2.0, kb: 5.5, hitstun: 30, step: 2.2, staminaCost: 20, clip: 'heavy'
  },
  ct1: {
    // SOUL TOUCH — short-range grab-strike: damage plus a lingering SOUL
    // WOUND (increased damage taken from all sources). Narrow and whiffs
    // badly on a miss — it's a read, not a poke.
    name: 'Soul Touch', cost: 18, startup: 13, active: 4, recovery: 34,
    effect: 'mahito_soultouch', dmg: 10, reach: 1.6, arc: 1.1,
    kb: 2.5, kbY: 0, hitstun: 26,
    soulWound: { duration: 6, dmgTakenMult: 1.3 }, clip: 'ct1'
  },
  ct2: {
    // BODY WEAPON — the arm reshapes into a blade / hammer / spike fan and
    // swings. Committed, high damage, long reach. The variant (geometry AND
    // animation) rotates so it never repeats twice in a row — see
    // fighter.startCT clip-variant support + the model's showBodyWeapon.
    name: 'Body Lance', cost: 20, startup: 20, active: 5, recovery: 30,
    effect: 'mahito_bodyweapon', dmg: 16, reach: 6.5,
    extendTime: 0.22, holdTime: 0.1,
    kb: 5, kbY: 2, hitstun: 30,
    clips: ['bwBlade', 'bwHammer', 'bwSpikes'], clip: 'bwBlade'
  },
  // SPECIAL — SUMMON TRANSFIGURED HUMAN (B): a weak independent AI ally.
  // Fragile, low damage; its value is pressure, and the pressure is meant to
  // stack. UP TO THREE may stand at once, and nothing else gates the summon:
  // if he has the cursed energy and the cooldown is up, he gets another one.
  // At the cap the button does nothing and costs nothing. Each summon's
  // proportions, limb count and mass are randomized (see combat/minion.js).
  special: {
    key: 'mahito_summon', name: 'SUMMON', cost: 25, cooldown: 12,
    maxMinions: 3,
    castFrames: 30, clip: 'summon',
    minion: {
      hp: 18, dmg: 3, hitstun: 14, kb: 1.4,
      duration: 15,          // despawns on this timer, on death, or Mahito's KO
      speed: 3.4, lungeSpeed: 7.5,
      swingEvery: 1.6, reach: 1.3,
      ceFeedMult: 0.4,       // its hits feed REDUCED MAX_CE growth to Mahito
      drainMult: 0.4         // and drain the transfiguration gauge at a reduced rate
    }
  },
  ultimate: { kind: 'domain' },
  domain: {
    // SELF-EMBODIMENT OF PERFECTION — the instant-win domain.
    // DURATION 7s, NOT 20: a deliberate balance exception. His win condition
    // (transfiguration = instant KO) is far stronger than anyone else's
    // payload, so he gets roughly a third of the standard uptime to land it.
    // Duration is already a per-character config value — nothing here is
    // hardcoded — but do not "fix" this number up to 20: seven seconds is
    // what makes RUN a real counter (see transfig tuning below).
    name: 'SELF-EMBODIMENT OF PERFECTION', jpName: '自閉円頓裹', refinement: 9,
    castFrames: 96, duration: 7, env: 'flesh',
    sureHit: { effect: 'transfigure', interval: 0 },
    transfig: {
      // The TRANSFIGURATION GAUGE: appears full (100) over each trapped
      // fighter on cast, drains by proximity to Mahito, and empties = instant
      // KO. Expiry with the bar not empty = nothing: Mahito spent his whole
      // bar for zero. The bar never carries between casts.
      gauge: 100,
      nearR: 3.2,          // inside this: fast drain (the visible inner ring)
      midR: 6.5,           // inside this: slow drain (the outer ring); beyond: none
      // SIX SECONDS in contact range = transfigured, on proximity alone.
      // Derived from the gauge so the two can never drift apart: staying
      // inside nearR for 6 of the domain's 7 seconds is lethal by itself, and
      // any connected hit (chunks below) buys him the margin.
      drainNear: 100 / 6,
      drainMid: 6,         // gauge/s at mid -> 42 max over 7s: never lethal alone,
      // connected attacks take chunks directly — the real killer up close
      chunkPunch: 6,
      chunkSoulTouch: 16,
      chunkBodyWeapon: 14,
      chunkHeavy: 10,
      minionMult: 0.4,     // minion hits drain at this fraction
      blockedMult: 0.45,   // blocking can't stop the drain (sure-hit) but
                           //    blocked hits drain less than clean hits
      koCinematic: 2.0     // seconds of camera-takeover transformation
    },
    backlash: { duration: 10, regenMult: 0, growthMult: 0.5 }
  },
  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },
  copyEffect: { effect: 'mahito_soultouch', dmg: 7, name: 'Copied: Soul Touch' }
});
