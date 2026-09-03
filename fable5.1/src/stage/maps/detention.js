// EISHU DETENTION CENTER — the flooded panopticon rotunda: a ring of dark
// cells, a catwalk gallery, the watch post, water on the floor.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'detention', name: 'EISHU DETENTION CENTER', jp: '盈舟少年院',
  desc: 'A flooded panopticon. Every cell door looks at the same point.',
  extent: { minX: -17, maxX: 17, minZ: -17, maxZ: 17 },
  background: 0x070a12, fog: { color: 0x0a0e18, near: 22, far: 70 },
  grade: { vignette: 0.6, tint: [0.86, 0.93, 1.18], lift: 0.01, sat: 0.7, contrast: 1.06 },
  lights: { key: { color: 0xb4ceff, intensity: 1.7 }, rim: { color: 0x6f8fc0, intensity: 1.4 }, hemi: { sky: 0x44608c, ground: 0x2a2620, intensity: 0.75 }, fill: { color: 0x6080c0, intensity: 0.4 } },
  previewCam: { pos: [3, 9, 20], look: [-2, 1.2, -6] }
};
export function build(k) {
  const wet = surface('wetfloor', 0x6a7484, { tex: 'concrete', rep: [10, 10], texArgs: ['#5a6474'] });
  const water = surface('dwater', 0x6f8fa8, { tex: 'water', rep: [8, 8] });
  const cell = surface('cell', 0x8a8c94, { tex: 'brick', rep: [4, 2], texArgs: ['#6a6660'] });
  const iron = surface('iron', 0x5a5e68, { tex: 'rust', rep: [2, 2] });
  const bars = surface('bars', 0x3a3e48, { arch: 'metal' });
  k.floor(wet, 0, 0, 60, 60);
  const wm = new THREE.Mesh(new THREE.CircleGeometry(15, 48), water); wm.rotation.x = -Math.PI / 2; wm.position.y = 0.02; wm.material.transparent = true; wm.material.opacity = 0.55; k.add(wm);
  // the cell ring: 14 cells, two of them passages
  const N = 14, R = 19;
  for (let i = 0; i < N; i++) {
    const a = i / N * Math.PI * 2, x = Math.sin(a) * R, z = Math.cos(a) * R;
    const open = i === 3 || i === 10;
    k.box(cell, x, 0, z, 6.2, 4.2, 4, { rot: -a });
    if (!open) for (let b = -2; b <= 2; b++) { const bx = x + Math.cos(a) * b * 0.45 - Math.sin(a) * 2.1, bz = z - Math.sin(a) * b * 0.45 - Math.cos(a) * 2.1; k.cylinder(bars, bx, 0, bz, 0.05, 3.2, 6, { wall: false }); }
  }
  // collision ring: keep the fight inside the rotunda
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; k.bounds.addWall(Math.sin(a) * 18 - 1.2, Math.sin(a) * 18 + 1.2, Math.cos(a) * 18 - 1.2, Math.cos(a) * 18 + 1.2, 0, 6); }
  // gallery catwalk at 4.2 with a rail
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; k.box(iron, Math.sin(a) * 15.5, 4.2, Math.cos(a) * 15.5, 2.6, 0.2, 3.0, { rot: -a, floor: false, wall: false }); }
  // the watch post
  k.cylinder(iron, 0, 0, 0, 2.6, 0.5, 20, { wall: false });
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; k.cylinder(iron, Math.sin(a) * 2.2, 0.5, Math.cos(a) * 2.2, 0.18, 7, 8, { wall: false }); }
  k.cylinder(iron, 0, 7.5, 0, 3.2, 0.4, 20, { wall: false });
  k.box(cell, 0, 7.9, 0, 4, 3, 4, { floor: false, wall: false });
  // roof with a broken hole, and a shaft of light (a glow plane)
  k.box(surface('droof', 0x2a2e38, { arch: 'stone' }), 0, 13, 0, 60, 0.5, 60, { floor: false, wall: false });
  // the shaft is additive and front-faced, so standing inside it adds a faint
  // haze rather than lifting the whole frame
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3, 6, 13, 24, 1, true), glow(0xc0d8ff, 0.05)); shaft.position.set(2, 6.5, -3); shaft.material.blending = THREE.AdditiveBlending; shaft.material.depthWrite = false; k.add(shaft);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.2; const l = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.3), glow(0xa0c0ff)); l.position.set(Math.sin(a) * 12, 4.0, Math.cos(a) * 12); l.rotation.y = a; k.add(l); }
}
