// HIT RESOLUTION — the silent-failure surface: a hit that lands when it
// should be blocked, a juggle that never ends, a knockdown that launches.
import { judgeHit, hitstopFor, computeDamage, inArc, capsuleHit, BALANCE } from '../src/combat/hits.js';
import { eq, ok, near } from './assert.mjs';
const D = (o = {}) => ({ alive: true, iFrames: 0, armorFrames: 0, state: 'idle', f: 10, hp: 100, stamina: 100, airborne: false, juggle: 0, otgUsed: false, blockStartup: 0, blockChipMult: 1, blockStaminaMult: 1, kbResist: 1, ...o });
const H = (o = {}) => ({ dmg: 10, kb: 3, kbY: 0, hitstun: 14, type: 'normal', ...o });
export async function suite(t) {
  console.log('hits');
  t('a clean light hit takes damage and enters hitLight', () => { const j = judgeHit(D(), H()); eq(j.result, 'hit'); eq(j.hp, 90); eq(j.state, 'hitLight'); eq(j.hitstun, 14); });
  t('20+ frames of hitstun is a heavy reaction', () => { eq(judgeHit(D(), H({ hitstun: 24 })).state, 'hitHeavy'); });
  t('i-frames refuse everything but a sure-hit', () => { eq(judgeHit(D({ iFrames: 3 }), H()).result, 'iframe'); eq(judgeHit(D({ iFrames: 3 }), H({ sureHit: true })).result, 'hit'); });
  t('a raised guard chips 15% and costs stamina', () => { const j = judgeHit(D({ state: 'block' }), H()); eq(j.result, 'block'); near(j.hp, 98.5); eq(j.stamina, 88); eq(j.state, 'blockstun'); });
  t('a guard with no stamina left breaks', () => { const j = judgeHit(D({ state: 'block', stamina: 10 }), H()); eq(j.result, 'guardbreak'); eq(j.state, 'guardBreak'); });
  t('a guard that is still rising takes the hit clean', () => { eq(judgeHit(D({ state: 'block', f: 1, blockStartup: 4 }), H()).result, 'hit'); });
  t('an unblockable goes through a guard', () => { eq(judgeHit(D({ state: 'block' }), H({ unblockable: true })).result, 'hit'); });
  t('a primed 7:3 strike shatters a guard', () => { eq(judgeHit(D({ state: 'block' }), H({ guardBreak: true })).result, 'guardbreak'); });
  t('armour eats a normal hit at 60% and shrugs; a launcher beats armour', () => { const j = judgeHit(D({ armorFrames: 5 }), H()); eq(j.result, 'armor'); eq(j.hp, 94); eq(judgeHit(D({ armorFrames: 5 }), H({ type: 'launcher' })).result, 'hit'); });
  t('a downed body takes one OTG then nothing', () => { const j = judgeHit(D({ state: 'knockdown' }), H({ otgOk: true })); eq(j.result, 'otg'); eq(j.hp, 95); eq(judgeHit(D({ state: 'knockdown', otgUsed: true }), H({ otgOk: true })).result, 'whiff'); eq(judgeHit(D({ state: 'getup' }), H({ otgOk: false })).result, 'whiff'); });
  t('a knockdown on the ground floors; in the air it spikes', () => { eq(judgeHit(D(), H({ type: 'knockdown' })).state, 'knockdown'); const j = judgeHit(D({ airborne: true }), H({ type: 'knockdown' })); eq(j.state, 'launched'); eq(j.vel.y, -13); });
  t('a launcher lifts with decaying height per juggle and techs out at 5', () => { const j1 = judgeHit(D(), H({ type: 'launcher', kbY: 8 })); eq(j1.state, 'launched'); near(j1.vel.y, 8 / 1.25); eq(j1.juggle, 1); const j4 = judgeHit(D({ airborne: true, juggle: 3 }), H({ kbY: 8 })); near(j4.vel.y, 8 / 2); const j5 = judgeHit(D({ airborne: true, juggle: 4 }), H()); eq(j5.result, 'tech'); eq(j5.iFrames, 60); });
  t('hitstop scales with weight', () => { ok(hitstopFor(H({ type: 'knockdown' })) > hitstopFor(H({ hitstun: 24 }))); ok(hitstopFor(H({ hitstun: 24 })) > hitstopFor(H())); eq(hitstopFor(H(), 'block'), 2); eq(hitstopFor(H({ crit: true })), 10); });
  t('damage multiplies by the attacker scale and the ratio crit', () => { const a = { dmgMult: 1.5, cfg: {} }; eq(computeDamage(a, 10).dmg, 15); const n = { dmgMult: 1, cfg: { ratio: { critChance: 0, critMult: 2 } }, ratioPrimed: 2 }; const r = computeDamage(n, 10); ok(r.crit); eq(r.dmg, 20); const rng = { dmgMult: 1, cfg: { ratio: { critChance: 1, critMult: 2 } }, rng: () => 0.5 }; ok(computeDamage(rng, 10).crit); });
  t('balance scalars are the old game\'s', () => { eq(BALANCE.HP, 2.35); eq(BALANCE.PUNCH, 0.85); eq(BALANCE.SPECIAL, 1.30); });
  t('arc and capsule tests', () => { const a = { pos: { x: 0, z: 0 }, facing: 0 }; ok(inArc(a, { pos: { x: 0, z: 1.5 }, hurtBox: { pad: 0 } }, 2)); ok(!inArc(a, { pos: { x: 0, z: -1.5 }, hurtBox: { pad: 0 } }, 2)); ok(!inArc(a, { pos: { x: 0, z: 4 }, hurtBox: { pad: 0 } }, 2)); const d = { pos: { x: 0, y: 0, z: 0 }, hurtBox: { radius: 0.62, height: 1.45, center: 1.05 } }; ok(capsuleHit({ x: 0.5, y: 1.2, z: 0 }, d)); ok(!capsuleHit({ x: 2, y: 1.2, z: 0 }, d)); ok(!capsuleHit({ x: 0, y: 3.5, z: 0 }, d)); });
}
