// THE SEWER — a brick vault under Shibuya: a central chamber, water in the
// channel, arches into dark tunnels, green service light.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'sewer_lair', name: 'THE SEWER', jp: '下水道',
  desc: 'Where the curses live. Brick, water, and a light that is the wrong green.',
  extent: { minX: -18, maxX: 18, minZ: -14, maxZ: 14 },
  background: 0x06080a, fog: { color: 0x080c0a, near: 16, far: 55 },
  grade: { vignette: 0.62, tint: [0.92, 1.06, 0.94], lift: 0.0, sat: 0.85, contrast: 1.08 },
  lights: { key: { color: 0xb0e0c0, intensity: 1.8 }, rim: { color: 0x60ff90, intensity: 1.6 }, hemi: { sky: 0x3a5a48, ground: 0x1a1a18, intensity: 0.7 }, fill: { color: 0x80c0a0, intensity: 0.4 } },
  previewCam: { pos: [-8, 5, 16], look: [0, 1, -2] }
};
export function build(k) {
  const brick = surface('sbrick', 0x8a7a70, { tex: 'brick', rep: [8, 3], texArgs: ['#6a5a50'] });
  const floor = surface('sfloor', 0x7a7c80, { tex: 'concrete', rep: [8, 8], texArgs: ['#5a5c60'] });
  const water = surface('swater', 0x3a6a58, { tex: 'water', rep: [6, 20] });
  const pipe = surface('pipe', 0x5a5e60, { tex: 'rust', rep: [4, 1] });
  k.floor(floor, 0, 0, 50, 40);
  // the channel down the middle (a shallow trench you can stand in)
  k.box(water, 0, -0.5, 0, 6, 0.4, 40, { wall: false });
  k.bounds.addFloor(-3, 3, -20, 20, -0.1);
  // walls and arches
  k.box(brick, 0, 0, -15, 44, 9, 2); k.box(brick, 0, 0, 15, 44, 9, 2);
  k.box(brick, -20, 0, 0, 2, 9, 32); k.box(brick, 20, 0, 0, 2, 9, 32);
  for (const [x, z, r] of [[-20, 0, Math.PI / 2], [20, 0, Math.PI / 2], [0, -15, 0], [0, 15, 0]]) { const arch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.6, 8, 20, Math.PI), brick); arch.position.set(x, 0.8, z); arch.rotation.y = r; k.add(arch); const dark = new THREE.Mesh(new THREE.CircleGeometry(2.6, 20), new THREE.MeshBasicMaterial({ color: 0x020302 })); dark.position.set(x - Math.sin(r) * 0.9, 0.9, z - Math.cos(r) * 0.9); dark.rotation.y = r; k.add(dark); }
  k.box(brick, 0, 9, 0, 44, 2, 32, { floor: false, wall: false });
  // pillars and pipes
  for (const [x, z] of [[-10, -8], [10, -8], [-10, 8], [10, 8]]) k.cylinder(brick, x, 0, z, 0.9, 9, 10);
  for (const z of [-11, 11]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 40, 10), pipe); p.rotation.z = Math.PI / 2; p.position.set(0, 6.5, z); k.add(p); }
  // green service lamps
  for (const [x, z] of [[-14, -12], [14, -12], [-14, 12], [14, 12], [0, 0]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), glow(0x80ffb0)); l.position.set(x, 6, z); k.add(l); }
  // drips into the channel
  k.tick(new THREE.Group(), (n, dt, t) => { });
  k.fence(null);
}
