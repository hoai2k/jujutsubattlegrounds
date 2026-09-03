// SENDAI COLONY SCHOOL — a school courtyard inside a colony barrier: gravel,
// the main building, a covered walkway, a tank of a gym, and a violet sky.
import * as THREE from 'three';
import { surface, glow, windowsTex } from '../kit.js';
export const DEF = {
  id: 'sendai_school', name: 'SENDAI COLONY SCHOOL', jp: '仙台結界 学校',
  desc: 'A school at the centre of a colony. The sky is the wrong colour.',
  extent: { minX: -22, maxX: 22, minZ: -18, maxZ: 18 },
  background: 0x2a1a48, fog: { color: 0x2a1a48, near: 40, far: 120 },
  grade: { vignette: 0.48, tint: [1.02, 0.96, 1.1], lift: 0.01, sat: 1.05, contrast: 1.02 },
  lights: { key: { color: 0xf0d8ff, intensity: 2.4 }, rim: { color: 0xa070ff, intensity: 2.0 }, hemi: { sky: 0x8060c0, ground: 0x4a4030, intensity: 0.95 }, fill: { color: 0xffc0a0, intensity: 0.4 } },
  previewCam: { pos: [10, 8, 24], look: [0, 1, 0] }
};
export function build(k) {
  const gravel = surface('gravel', 0xb0aa9a, { tex: 'gravel', rep: [14, 12] });
  const wall = surface('school', 0xd8d0c0, { tex: 'concrete', rep: [8, 3], texArgs: ['#b8b0a0'] });
  const roof = surface('roof', 0x4a4a52, { arch: 'stone' });
  const gym = surface('gym', 0x8a8a92, { tex: 'metal', rep: [6, 3] });
  const paint = surface('spaint', 0xd8d8d0, { arch: 'stone' });
  k.floor(gravel, 0, 0, 80, 80);
  // running track line
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; k.box(paint, Math.sin(a) * 15, 0.004, Math.cos(a) * 12, 1.4, 0.01, 0.25, { floor: false, wall: false, rot: -a }); }
  // main building along the back
  k.box(wall, 0, 0, -24, 44, 10, 8);
  const win = surface('swin', 0x2a2e48, { arch: 'stone' }); win.map = windowsTex(210, 0.2); win.needsUpdate = true;
  for (let f = 0; f < 3; f++) for (let x = -20; x <= 20; x += 4) { const g = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), win); g.position.set(x, 2 + f * 3, -19.98); k.add(g); }
  k.box(roof, 0, 10, -24, 45, 0.5, 9, { floor: false, wall: false });
  // covered walkway pillars along one side
  for (let z = -14; z <= 14; z += 4) k.box(wall, -21, 0, z, 0.5, 3.4, 0.5);
  k.box(roof, -21, 3.4, 0, 3, 0.25, 32, { floor: false, wall: false });
  // gym
  k.box(gym, 24, 0, 4, 8, 7, 22);
  k.box(roof, 24, 7, 4, 9, 0.4, 23, { floor: false, wall: false });
  // benches and a vending machine
  for (const z of [-6, 0, 6]) k.box(surface('bench', 0x6a5a48, { tex: 'wood', rep: [2, 1] }), -17, 0, z, 0.5, 0.45, 2.2, { wall: true });
  k.box(surface('vend', 0xd04040, { arch: 'metal' }), 18, 0, -12, 1.0, 1.9, 0.9);
  const vl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.2), glow(0xfff0c0, 0.9)); vl.position.set(18, 1.1, -11.54); k.add(vl);
  k.trees(10, { r0: 24, r1: 34, color: 0x3a5a3a });
  for (const [x, z] of [[-12, 14], [12, 14], [0, -14]]) k.lamp(x, z, 4.5, 0xffe8c0);
  k.fence(null);
}
