// SCRAMBLE CROSSING — the Shibuya intersection at night: wet asphalt,
// zebra stripes, a ring of lit towers and signs, halted taxis as cover.
import * as THREE from 'three';
import { surface, TEX, glow } from '../kit.js';

export const DEF = {
  id: 'shibuya_crossing', name: 'SCRAMBLE CROSSING', jp: '渋谷スクランブル交差点',
  desc: 'The busiest crossing in the world, empty. Halted taxis and a wall of light.',
  extent: { minX: -24, maxX: 24, minZ: -20, maxZ: 20 },
  background: 0x0d1020, fog: { color: 0x121628, near: 40, far: 140 },
  grade: { vignette: 0.44, tint: [1.0, 0.98, 1.08], lift: 0.0, sat: 1.12, contrast: 1.04 },
  lights: { key: { color: 0xffe0c8, intensity: 2.3 }, rim: { color: 0x7fb0ff, intensity: 2.2, pos: [-8, 8, -8] }, hemi: { sky: 0x6f7fd0, ground: 0x30281e, intensity: 0.9 }, fill: { color: 0xff90c0, intensity: 0.45 } },
  previewCam: { pos: [0, 9, 26], look: [0, 1, 0] }
};
export function build(k) {
  const asphalt = surface('asphalt', 0x9a9ca4, { tex: 'asphalt', rep: [16, 16] });
  const paint = surface('paint', 0x9a9a92, { arch: 'stone' });
  const kerb = surface('kerb', 0x8a8c94, { tex: 'concrete', rep: [8, 2] });
  const taxi = surface('taxi', 0x3a3a48, { arch: 'metal' });
  k.floor(asphalt, 0, 0, 90, 90);
  // zebra stripes on the four crossings + the diagonal
  for (const [cx, cz, rot] of [[0, 12, 0], [0, -12, 0], [14, 0, Math.PI / 2], [-14, 0, Math.PI / 2]]) for (let i = -4; i <= 4; i++) k.box(paint, cx + (rot ? 0 : i * 1.2), 0.005, cz + (rot ? i * 1.2 : 0), rot ? 6 : 0.6, 0.01, rot ? 0.6 : 6, { floor: false, wall: false });
  for (let i = -8; i <= 8; i++) k.box(paint, i * 1.3, 0.005, 0, 0.5, 0.01, 6, { floor: false, wall: false, rot: Math.PI / 4 });
  // kerbs and pavement corners
  for (const [x, z] of [[-19, -15], [19, -15], [-19, 15], [19, 15]]) { k.box(kerb, x, 0, z, 12, 0.18, 10); }
  // taxis (cover, low walls)
  for (const [x, z, r] of [[-9, 8, 0.2], [10, -7, -0.4], [-2, -13, 1.4]]) { k.box(taxi, x, 0.18, z, 1.9, 1.1, 4.2, { rot: r, wall: false }); k.bounds.addWall(x - 1.4, x + 1.4, z - 1.8, z + 1.8, 0, 1.4); const roof = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.9), glow(0xffd070)); roof.position.set(x, 1.45, z); roof.rotation.y = r; k.add(roof); }
  // towers + signs
  k.skyline(28, { r0: 34, r1: 70, hMin: 18, hMax: 60, hue: 210, lit: 0.45, color: 0x2a2e48 });
  const cols = [0xff4090, 0x40c0ff, 0xffd040, 0x60ff90, 0xff7040];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const r = 31; k.sign(Math.sin(a) * r, 6 + (i % 3) * 5, Math.cos(a) * r, 5 + (i % 2) * 3, 2.4, cols[i % cols.length], a + Math.PI); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.4; k.lamp(Math.sin(a) * 21, Math.cos(a) * 17, 5, 0xfff4d8); }
  // the big screen
  k.sign(0, 16, -38, 22, 12, 0x60a0ff, 0);
  k.fence(null);
}
