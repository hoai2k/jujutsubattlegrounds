// KYOTO EXCHANGE GROUNDS — the sister-school event field: a wide gravel
// arena, a wooden stage, a scoreboard, cherry trees in the afternoon.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'kyoto_grounds', name: 'KYOTO EXCHANGE GROUNDS', jp: '京都姉妹校交流会',
  desc: 'The exchange event field. Cherry blossom, a stage, and an audience of teachers.',
  extent: { minX: -24, maxX: 24, minZ: -18, maxZ: 18 },
  background: 0x9ab8d8, fog: { color: 0xa8c0d8, near: 50, far: 150 },
  grade: { vignette: 0.36, tint: [1.06, 1.0, 0.94], lift: 0.02, sat: 1.12, contrast: 1.0 },
  lights: { key: { color: 0xfff0d8, intensity: 2.8 }, rim: { color: 0xa0c0ff, intensity: 1.4 }, hemi: { sky: 0x9ab8e0, ground: 0x6a5a40, intensity: 1.0 }, fill: { color: 0xffd0c0, intensity: 0.5 } },
  previewCam: { pos: [14, 7, 24], look: [0, 1, 0] }
};
export function build(k) {
  const gravel = surface('kgravel', 0xc8c0a8, { tex: 'gravel', rep: [16, 12] });
  const grass = surface('kgrass', 0x8ab070, { tex: 'grass', rep: [12, 12] });
  const wood = surface('kwood', 0x9a7a52, { tex: 'wood', rep: [6, 2] });
  const white = surface('kline', 0xe8e8e0, { arch: 'stone' });
  const cloth = surface('kcloth', 0xd04040, { arch: 'cloth' });
  k.floor(grass, 0, 0, 90, 90);
  k.box(gravel, 0, 0, 0, 46, 0.06, 34, { wall: false });
  for (let i = -3; i <= 3; i++) k.box(white, 0, 0.07, i * 5, 44, 0.01, 0.12, { floor: false, wall: false });
  // the stage with steps
  k.box(wood, 0, 0, -20, 20, 1.2, 8, { wall: false });
  for (let i = 0; i < 3; i++) k.box(wood, 0, 0, -15.6 + i * 0.4, 6, 0.4 * (i + 1), 0.4, { wall: false });
  for (const x of [-9, 9]) k.cylinder(wood, x, 1.2, -23, 0.25, 4, 8, { wall: false });
  k.box(cloth, 0, 5.0, -23, 20, 0.8, 0.3, { floor: false, wall: false });
  // scoreboard
  k.box(surface('board', 0x30343c, { arch: 'metal' }), 20, 0, -14, 6, 4, 0.6);
  k.sign(20, 2.6, -13.65, 5, 2.4, 0x60ff90, 0);
  // tents along the sides (cover)
  for (const [x, z] of [[-20, 12], [20, 12], [-20, -4]]) { k.box(cloth, x, 2.4, z, 5, 0.3, 4, { floor: false, wall: false }); for (const [dx, dz] of [[-2.3, -1.8], [2.3, -1.8], [-2.3, 1.8], [2.3, 1.8]]) k.cylinder(surface('tpole', 0xc0c0c8, { arch: 'metal' }), x + dx, 0, z + dz, 0.06, 2.4, 6, { wall: false }); k.box(wood, x, 0, z, 3, 0.8, 1.2, { wall: true }); }
  k.trees(18, { r0: 26, r1: 42, color: 0xf0a8c8, trunk: 0x5a4030 });
  k.trees(10, { r0: 30, r1: 44, color: 0x4a7a4a });
  k.fence(null);
}
