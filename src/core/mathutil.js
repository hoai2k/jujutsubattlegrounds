import * as THREE from 'three';

export const DEG = Math.PI / 180;

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function damp(cur, target, lambda, dt) { return lerp(cur, target, 1 - Math.exp(-lambda * dt)); }
export function smoothstep(t) { return t * t * (3 - 2 * t); }
export function easeOut(t) { return 1 - (1 - t) * (1 - t); }
export function easeIn(t) { return t * t; }
export function rand(a = 1, b) { return b === undefined ? Math.random() * a : a + Math.random() * (b - a); }
export function randPick(arr) { return arr[(Math.random() * arr.length) | 0]; }

// deterministic RNG (mulberry32) — the sword-domain roll stream is seeded so
// a run can be reproduced from the seed shown in the debug overlay
export function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function weightedPick(entries, rng = Math.random, weightOf = e => e.weight ?? 1) {
  let total = 0;
  for (const e of entries) total += weightOf(e);
  let r = rng() * total;
  for (const e of entries) { r -= weightOf(e); if (r <= 0) return e; }
  return entries[entries.length - 1];
}

export function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
export function angleDamp(cur, target, lambda, dt) {
  return angleLerp(cur, target, 1 - Math.exp(-lambda * dt));
}

export function v3(x = 0, y = 0, z = 0) { return new THREE.Vector3(x, y, z); }

export function flatDist(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function yawBetween(from, to) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}
