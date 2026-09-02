// SHINJUKU — the street at blue hour after the showdown: cracked asphalt,
// an overpass leg, billboards, the towers leaning in.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'shinjuku', name: 'SHINJUKU', jp: '新宿',
  desc: 'Blue hour on a wrecked avenue. The overpass is still standing. Mostly.',
  extent: { minX: -24, maxX: 24, minZ: -16, maxZ: 16 },
  background: 0x101830, fog: { color: 0x141c34, near: 36, far: 130 },
  grade: { vignette: 0.46, tint: [0.96, 1.0, 1.1], lift: 0.0, sat: 1.0, contrast: 1.06 },
  lights: { key: { color: 0xd0dcff, intensity: 2.2 }, rim: { color: 0xff8060, intensity: 2.2 }, hemi: { sky: 0x5070c0, ground: 0x302828, intensity: 0.9 }, fill: { color: 0xff70a0, intensity: 0.4 } },
  previewCam: { pos: [-16, 8, 22], look: [0, 2, 0] }
};
export function build(k) {
  const road = surface('road2', 0x8a8c94, { tex: 'asphalt', rep: [14, 10] });
  const conc = surface('conc2', 0xa0a2aa, { tex: 'concrete', rep: [4, 4] });
  const rubble = surface('rubble', 0x8a8478, { tex: 'rock', rep: [2, 2] });
  const paint = surface('paint2', 0x9a9a92, { arch: 'stone' });
  k.floor(road, 0, 0, 80, 80);
  for (let i = -10; i <= 10; i += 2) k.box(paint, i * 2.2, 0.004, 0, 1.2, 0.01, 0.2, { floor: false, wall: false });
  // overpass: two legs and a deck across the far side (cover + a high floor)
  for (const x of [-10, 10]) k.box(conc, x, 0, -13, 2.4, 7, 2.4);
  k.box(conc, 0, 7, -13, 40, 1.2, 8, { floor: false, wall: false });
  k.box(conc, 0, 8.2, -13, 40, 0.9, 0.4, { floor: false, wall: false });
  // a collapsed slab you can stand on, ramped
  k.box(rubble, 16, 0, 6, 8, 0.9, 6, { wall: false });
  k.box(rubble, 12, 0, 6, 2, 0.45, 6, { wall: false });
  // rubble piles (cover)
  for (const [x, z, s] of [[-14, 8, 1.6], [-6, -6, 1.2], [6, 10, 1.0], [20, -8, 1.8]]) { k.mesh(new THREE.DodecahedronGeometry(1, 0), rubble, x, s * 0.5, z, { scale: s }); k.bounds.addWall(x - s * 0.8, x + s * 0.8, z - s * 0.8, z + s * 0.8, 0, s); }
  k.skyline(30, { r0: 36, r1: 76, hMin: 24, hMax: 80, hue: 220, lit: 0.3, color: 0x232840 });
  const cols = [0xff3060, 0x30a0ff, 0xffe040, 0xff6020];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; k.sign(Math.sin(a) * 33, 9 + (i % 3) * 6, Math.cos(a) * 33, 6, 3, cols[i % 4], a + Math.PI); }
  for (const x of [-18, -6, 6, 18]) k.lamp(x, 14, 5, 0xfff0d8);
  k.fence(null);
}
