// Small math kit shared by every module. No THREE dependency except v3.
import * as THREE from 'three';

export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));
export const smoothstep = t => t * t * (3 - 2 * t);
export const easeOut = t => 1 - (1 - t) * (1 - t);
export const easeIn = t => t * t;
export const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randPick = arr => arr[(Math.random() * arr.length) | 0];
export const sign = v => (v < 0 ? -1 : 1);

export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function angleLerp(a, b, t) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
}
export const angleDamp = (cur, target, lambda, dt) => angleLerp(cur, target, 1 - Math.exp(-lambda * dt));
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const flatDist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const yawBetween = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);

// frames at 60 Hz <-> seconds
export const F = 1 / 60;
export const frames = n => n * F;

export function weightedPick(entries, rng = Math.random, weightOf = e => e.weight ?? 1) {
  let total = 0; for (const e of entries) total += weightOf(e);
  let r = rng() * total;
  for (const e of entries) { r -= weightOf(e); if (r <= 0) return e; }
  return entries[entries.length - 1];
}
