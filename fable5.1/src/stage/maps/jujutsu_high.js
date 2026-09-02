// TOKYO JUJUTSU HIGH — the temple approach at dusk: a stone court, wooden
// halls, torii gates, stone lanterns, cedar all round.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'jujutsu_high', name: 'TOKYO JUJUTSU HIGH', jp: '東京呪術高専',
  desc: 'The temple court at dusk. Torii, lanterns, and the cedar dark.',
  extent: { minX: -20, maxX: 20, minZ: -16, maxZ: 16 },
  background: 0x2a2038, fog: { color: 0x2a2038, near: 30, far: 90 },
  grade: { vignette: 0.5, tint: [1.08, 0.98, 0.92], lift: 0.0, sat: 1.05, contrast: 1.03 },
  lights: { key: { color: 0xffc890, intensity: 2.5 }, rim: { color: 0x80a0ff, intensity: 1.8 }, hemi: { sky: 0x7060a0, ground: 0x3a3020, intensity: 0.9 }, fill: { color: 0xff9060, intensity: 0.5 } },
  previewCam: { pos: [-12, 7, 20], look: [0, 1.5, -4] }
};
export function build(k) {
  const stone = surface('court', 0x9a968c, { tex: 'tile', rep: [16, 12], texArgs: ['#8e8a80', '#4a4640'] });
  const wood = surface('hall', 0x6a4a32, { tex: 'wood', rep: [6, 2] });
  const roofM = surface('troof', 0x3a3a44, { arch: 'stone' });
  const red = surface('torii', 0xc03828, { arch: 'stone' });
  const lantern = surface('lantern', 0x8a8a84, { tex: 'rock', rep: [1, 1] });
  k.floor(stone, 0, 0, 70, 70);
  // main hall at the back, raised on a deck with steps
  k.box(wood, 0, 0, -18, 26, 1.0, 10, { wall: false });
  for (let i = 0; i < 3; i++) k.box(stone, 0, 0, -12.6 + i * 0.5, 10, 0.34 * (i + 1), 0.5, { wall: false });
  k.box(wood, 0, 1, -20, 22, 6, 6);
  k.box(roofM, 0, 7, -20, 28, 1.2, 10, { floor: false, wall: false });
  for (const x of [-9, -3, 3, 9]) k.box(wood, x, 1, -17, 0.5, 6, 0.5, { wall: false });
  // torii gates at the front
  for (const z of [14, 10]) { for (const x of [-3, 3]) k.cylinder(red, x, 0, z, 0.32, 6.5, 10); k.box(red, 0, 6.2, z, 9, 0.5, 0.5, { floor: false, wall: false }); k.box(red, 0, 5.2, z, 7.4, 0.35, 0.35, { floor: false, wall: false }); }
  // stone lanterns with a warm glow
  for (const [x, z] of [[-12, -4], [12, -4], [-12, 6], [12, 6]]) { k.box(lantern, x, 0, z, 0.9, 0.5, 0.9, { wall: true }); k.cylinder(lantern, x, 0.5, z, 0.22, 1.4, 8, { wall: false }); k.box(lantern, x, 1.9, z, 0.9, 0.7, 0.9, { floor: false, wall: false }); const g = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), glow(0xffc070)); g.position.set(x, 2.2, z); k.add(g); k.box(lantern, x, 2.6, z, 1.2, 0.3, 1.2, { floor: false, wall: false }); }
  // side halls
  k.box(wood, -22, 0, 0, 6, 4.5, 20); k.box(roofM, -22, 4.5, 0, 8, 0.8, 22, { floor: false, wall: false });
  k.box(wood, 22, 0, 0, 6, 4.5, 20); k.box(roofM, 22, 4.5, 0, 8, 0.8, 22, { floor: false, wall: false });
  k.trees(22, { r0: 24, r1: 40, color: 0x2a4a34, trunk: 0x4a3828 });
  k.fence(null);
}
