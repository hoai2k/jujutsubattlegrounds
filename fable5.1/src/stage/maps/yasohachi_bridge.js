// YASOHACHI BRIDGE — the bridge deck at dusk over the river: railings, the
// steel arch overhead, water below, hills on both banks.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'yasohachi_bridge', name: 'YASOHACHI BRIDGE', jp: '八十八橋',
  desc: 'A bridge nobody should cross at night. The river is a long way down.',
  extent: { minX: -26, maxX: 26, minZ: -6, maxZ: 6 },
  background: 0x3a2a44, fog: { color: 0x3a2a44, near: 40, far: 130 },
  grade: { vignette: 0.5, tint: [1.1, 0.96, 0.9], lift: 0.0, sat: 1.05, contrast: 1.04 },
  lights: { key: { color: 0xffb070, intensity: 2.6 }, rim: { color: 0x8090ff, intensity: 1.8 }, hemi: { sky: 0x8060a0, ground: 0x30302a, intensity: 0.85 }, fill: { color: 0xff8050, intensity: 0.5 } },
  previewCam: { pos: [-20, 8, 20], look: [0, 1, 0] }
};
export function build(k) {
  const deck = surface('deck', 0x9a9ca4, { tex: 'asphalt', rep: [12, 3] });
  const steel = surface('steel', 0x5a7a6a, { tex: 'metal', rep: [3, 1] });
  const water = surface('river', 0x3a5a72, { tex: 'water', rep: [30, 30] });
  const hill = surface('hill', 0x3a5a3a, { tex: 'grass', rep: [20, 20] });
  k.bounds.groundY = 0;
  // river far below (visual only, floor disabled by placing it out of reach)
  const w = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), water); w.rotation.x = -Math.PI / 2; w.position.y = -14; k.add(w);
  for (const s of [-1, 1]) k.mesh(new THREE.SphereGeometry(40, 16, 10), hill, s * 70, -30, 0, { scale: 1 });
  k.box(deck, 0, -0.5, 0, 60, 0.5, 14, { wall: false });
  // railings
  for (const z of [-6.6, 6.6]) { k.box(steel, 0, 0, z, 60, 1.1, 0.25, { wall: true }); for (let x = -28; x <= 28; x += 4) k.box(steel, x, 0, z, 0.3, 1.2, 0.3, { wall: false }); }
  // arch
  for (let i = 0; i <= 20; i++) { const t = i / 20, x = -30 + t * 60, y = 2 + Math.sin(t * Math.PI) * 12; for (const z of [-7.2, 7.2]) k.box(steel, x, y, z, 3.2, 0.6, 0.6, { floor: false, wall: false }); if (i % 4 === 0) for (const z of [-7.2, 7.2]) k.box(steel, x, 0, z, 0.3, y, 0.3, { floor: false, wall: false }); }
  for (let i = 0; i <= 5; i++) { const x = -25 + i * 10; k.box(steel, x, 8 + Math.sin((i / 5) * Math.PI) * 6, 0, 0.5, 0.5, 14.4, { floor: false, wall: false }); }
  // lamps + a parked truck as cover
  for (let x = -20; x <= 20; x += 10) k.lamp(x, -6.2, 4, 0xffe0b0);
  k.box(surface('truck', 0x6a4a30, { arch: 'metal' }), 14, 0, 3.2, 2.4, 2.4, 6);
  k.fence(null);
  // the sun
  const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 32), glow(0xffa050)); sun.position.set(-40, 12, -90); k.add(sun);
}
