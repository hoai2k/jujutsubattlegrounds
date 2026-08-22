// NANAMI — Ratio Technique. No domain (canon), no flash, brutal consistency.
// Compensation: strongest Simple Domain and barrier-break output in the roster.
import { withDefaults, PUNCH_DEFAULTS } from './schema.js';

export const NANAMI = withDefaults({
  id: 'nanami', name: 'NANAMI', title: 'GRADE 1 — OVERTIME',
  stats: {
    hp: 110, walkSpeed: 2.5, runSpeed: 5.0, dashSpeed: 8.2,
    startMaxCE: 40, ceRegen: 2.2, ceGainPerPunch: 7, damageScale: 1.0
  },
  punches: PUNCH_DEFAULTS.map((p, i) => ({ ...p, dmg: [4, 5, 9][i] })),
  // HEAVY — BLUNT DESCENT: the blunt sword brought straight down on the 7:3
  // line. Longest reach of any heavy (it is a weapon), measured rather than
  // wild, and it can roll a Ratio crit like everything else he throws.
  heavy: {
    name: 'Blunt Descent', dmg: 16, startup: 17, active: 5, recovery: 28,
    reach: 2.25, kb: 5.0, hitstun: 30, step: 1.8, staminaCost: 20, armorFrames: 12
  },
  // Passive: 7:3 Ratio — chance for a guaranteed critical (2.1x) on any hit;
  // a Ratio mark (from CT1) makes the next hit a guaranteed crit.
  ratio: { critChance: 0.18, critMult: 2.1 },
  ct1: {
    // RATIO WAVE — the blunt blade projects its edge: a travelling gold bar
    // with the white 7:3 line drawn on its face, steered by the stick.
    // Caught in the band around seventy percent of its range the hit is a
    // FORCED critical — the technique finding the weak point is not a roll
    // of the dice, it is the technique. Landing anywhere applies the mark.
    name: 'Ratio Wave', jpName: '七三の斬撃', cost: 15,
    startup: 18, active: 5, recovery: 24,
    effect: 'nanami_cleave', dmg: 12, range: 7.0, speed: 15, width: 2.4,
    kb: 3.5, kbY: 0.5, appliesMark: true, clip: 'ct1'
  },
  ct2: {
    name: 'Overtime', cost: 40, startup: 24, active: 1, recovery: 30,
    effect: 'nanami_overtime', duration: 8, dmgMult: 1.3, speedMult: 1.22, clip: 'ct2'
  },
  // SPECIAL — the 7:3 TIMING: a sub-second sweep over a tick track with one
  // red line at the ratio point. Stop the marker on the line and his next
  // move is a guaranteed Ratio strike (double-ish damage, shatters a held
  // guard); adjacent gets a partial bonus; a miss costs the long cooldown.
  // The sweep accelerates a little with every success.
  special: {
    key: 'nanami_ratio', name: '7:3 TIMING', cost: 8, cooldown: 4, missCooldown: 8,
    sweepTime: 0.8, sweepAccel: 0.92, minSweep: 0.5,
    mark: 0.7, hitWindow: 0.05, nearWindow: 0.12, primedTime: 6, clip: 'ratioFocus'
  },
  ultimate: {
    // Non-domain ultimate; faster startup as compensation.
    kind: 'burst', name: 'COLLAPSE', jpName: '時間外労働・崩落',
    startup: 30, effect: 'nanami_collapse',
    hits: 3, dmgPerHit: 9, reach: 2.6, arc: 2.2, clip: 'ult'
  },
  domain: null, // canon-correct: Nanami has no Domain Expansion
  simpleDomainDrain: 11,                     // strongest Simple Domain
  barrierBreak: { ceDrain: 26, chip: 36 },   // best barrier-break output
  copyEffect: { effect: 'nanami_cleave', dmg: 8, name: 'Copied: Cleave' }
});
