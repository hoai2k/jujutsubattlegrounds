// HIT RESOLUTION — pure functions, no scene, no THREE. Everything here is
// unit-testable under node (fable5.1/test/hits.mjs): the damage pipeline, the
// arc/capsule tests, and the outcome of a hit on a defender's state.
import { HP as HP_SCALE, PUNCH, SPECIAL } from './balance.js';

export const BALANCE = { HP: HP_SCALE, PUNCH, SPECIAL };
export const hitMult = hit => (hit.basic ? PUNCH : SPECIAL);

export function computeDamage(attacker, baseDmg, opts = {}) {
  let dmg = baseDmg * (attacker.dmgMult ?? 1);
  let crit = !!opts.forceCrit || attacker.ratioPrimed === 2;
  const ratio = attacker.cfg?.ratio;
  if (ratio && !crit && opts.canCrit !== false) {
    if (attacker.ratioMark || (attacker.rng ? attacker.rng() : Math.random()) < ratio.critChance) { crit = true; attacker.ratioMark = false; }
  }
  if (crit) dmg *= ratio ? ratio.critMult : 1.5;
  if (attacker.ratioPrimed === 1) dmg *= 1.35;
  return { dmg, crit };
}

export function inArc(attacker, target, reach, arc = 1.6) {
  const dx = target.pos.x - attacker.pos.x, dz = target.pos.z - attacker.pos.z;
  const dist = Math.hypot(dx, dz);
  if (dist > reach + 0.5 + (target.hurtBox?.pad ?? 0)) return false;
  let d = Math.atan2(dx, dz) - attacker.facing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d) < arc / 2 + 0.25;
}

// strike point vs the defender's hurt capsule
export function capsuleHit(origin, defender) {
  const hb = defender.hurtBox;
  const dx = defender.pos.x - origin.x, dz = defender.pos.z - origin.z;
  const horiz = Math.hypot(dx, dz);
  const centerY = defender.pos.y + hb.center;
  return horiz <= hb.radius + 0.5 && Math.abs(origin.y - centerY) <= hb.height;
}

// ---------------------------------------------------------------------------
// JUDGE: what happens to a defender who is hit. Returns a plain decision the
// fighter applies. `d` is a snapshot view of the defender:
//   { alive, iFrames, armorFrames, state, f, hp, stamina, airborne, juggle,
//     otgUsed, blockStartup, blockChipMult, blockStaminaMult, kbResist }
// ---------------------------------------------------------------------------
export function judgeHit(d, hit) {
  if (!d.alive) return { result: 'dead' };
  if (d.iFrames > 0 && !hit.sureHit) return { result: 'iframe' };
  const heavyArmor = !!d.heavyArmor;
  if ((d.armorFrames > 0 || heavyArmor) && !hit.sureHit && hit.type !== 'launcher') {
    return { result: 'armor', hp: d.hp - hit.dmg * 0.6 };
  }
  const downed = d.state === 'knockdown' || d.state === 'getup';
  if (downed && !hit.sureHit) {
    if (d.otgUsed || !hit.otgOk) return { result: 'whiff' };
    return { result: 'otg', hp: d.hp - hit.dmg * 0.5, iFrames: 40, state: 'getup', otgUsed: true };
  }
  const guardUp = d.state === 'block' && d.f >= (d.blockStartup ?? 0);
  const blocking = guardUp || d.state === 'blockstun';
  if (blocking && hit.guardBreak) {
    return { result: 'guardbreak', hp: d.hp - hit.dmg, stamina: 0, state: 'guardBreak' };
  }
  if (blocking && !hit.unblockable && !hit.sureHit) {
    const chip = hit.dmg * 0.15 * (d.blockChipMult ?? 1);
    const stamina = d.stamina - 12 * (d.blockStaminaMult ?? 1);
    if (stamina <= 0) return { result: 'guardbreak', hp: d.hp - chip, stamina: 0, state: 'guardBreak' };
    return { result: 'block', hp: d.hp - chip, stamina, state: 'blockstun', push: 0.5 };
  }
  // clean hit
  const out = { result: 'hit', hp: d.hp - hit.dmg };
  const kbR = d.kbResist ?? 1;
  if (hit.type === 'knockdown') {
    out.juggle = 0; out.otgUsed = false;
    if (d.airborne) { out.state = 'launched'; out.vel = { x: hit.kb * 0.5 / kbR, y: -13, z: 0, set: true }; }
    else { out.state = 'knockdown'; out.vel = { x: hit.kb / kbR, y: 2.5, z: 0, set: true }; }
  } else if (d.airborne || hit.type === 'launcher') {
    const juggle = d.juggle + 1;
    out.juggle = juggle;
    if (juggle > 4) { out.result = 'tech'; out.state = 'launched'; out.iFrames = 60; out.vel = { x: 4, y: 2, z: 0, set: true }; return out; }
    const jScale = 1 / (1 + juggle * 0.25);
    out.state = 'launched'; out.grounded = false;
    out.vel = { x: hit.kb * 0.8 / kbR, y: (hit.kbY || 6.5) * jScale, z: 0, set: true };
  } else {
    const stun = hit.hitstun;
    out.state = stun >= 20 ? 'hitHeavy' : 'hitLight';
    out.hitstun = stun;
    out.vel = { x: hit.kb / kbR, y: 0, z: 0, set: false };
  }
  return out;
}

// hit-stop frames by weight — the "contact" principle from the direction doc
export function hitstopFor(hit, result) {
  if (result === 'block') return 2;
  if (result === 'guardbreak') return 8;
  if (result === 'armor') return 3;
  if (hit.crit) return 10;
  if (hit.type === 'knockdown') return 11;
  if (hit.type === 'launcher') return 8;
  if (hit.hitstun >= 20) return 7;
  return 4;
}
