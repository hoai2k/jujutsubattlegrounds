// TOMBS OF THE STAR — the cave under the temple: a stone floor ringed by
// pillars, glowing crystal, a stair up to the altar, mist on the ground.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'star_tomb', name: 'TOMBS OF THE STAR', jp: '星漿体の廟',
  desc: 'A cave lit by something that is not fire. The altar is up the stair.',
  extent: { minX: -18, maxX: 18, minZ: -16, maxZ: 16 },
  background: 0x06080e, fog: { color: 0x0a0e18, near: 18, far: 60 },
  grade: { vignette: 0.62, tint: [0.9, 0.98, 1.16], lift: 0.0, sat: 0.9, contrast: 1.08 },
  lights: { key: { color: 0xa0d0ff, intensity: 1.6 }, rim: { color: 0x60ffd0, intensity: 2.0 }, hemi: { sky: 0x304870, ground: 0x181a20, intensity: 0.7 }, fill: { color: 0x40a0ff, intensity: 0.5 } },
  previewCam: { pos: [-10, 6, 18], look: [0, 1, -2] }
};
export function build(k) {
  const rock = surface('trock', 0x6a6e78, { tex: 'rock', rep: [10, 10] });
  const stone = surface('tstone', 0x8a8c94, { tex: 'tile', rep: [12, 10], texArgs: ['#6a6c74', '#2a2c34'] });
  k.floor(rock, 0, 0, 60, 60);
  k.box(stone, 0, 0, 0, 30, 0.1, 24, { wall: false });
  // pillars in a ring
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; k.cylinder(rock, Math.sin(a) * 15, 0, Math.cos(a) * 13, 0.9, 9, 10); }
  // altar up a stair at the back
  for (let i = 0; i < 5; i++) k.box(stone, 0, 0, -11 - i * 0.7, 10, 0.4 * (i + 1), 0.7, { wall: false });
  k.box(stone, 0, 0, -18, 14, 2.0, 8, { wall: false });
  k.box(rock, 0, 2, -21, 3, 1.4, 2);
  // crystals
  const cry = glow(0x60e0ff, 0.9);
  for (let i = 0; i < 14; i++) { const a = k.rand(0, 6.28), r = k.rand(10, 26); const c = new THREE.Mesh(new THREE.ConeGeometry(k.rand(0.3, 0.8), k.rand(1.5, 4), 5), cry); c.position.set(Math.sin(a) * r, 0.5, Math.cos(a) * r); c.rotation.set(k.rand(-0.4, 0.4), 0, k.rand(-0.4, 0.4)); k.add(c); }
  // cave walls + ceiling
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; k.mesh(new THREE.DodecahedronGeometry(6, 0), rock, Math.sin(a) * 30, 4, Math.cos(a) * 28, { scale: k.rand(1.2, 2) }); }
  k.box(rock, 0, 14, 0, 70, 2, 70, { floor: false, wall: false });
  // mist: a slow drifting plane
  const mist = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({ color: 0x8fb0e0, transparent: true, opacity: 0.08, depthWrite: false })); mist.rotation.x = -Math.PI / 2; mist.position.y = 0.35;
  k.tick(mist, (n, dt, t) => { n.position.x = Math.sin(t * 0.1) * 2; n.material.opacity = 0.06 + Math.sin(t * 0.5) * 0.02; });
  k.fence(null);
}
