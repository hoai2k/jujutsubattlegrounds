// SHIBUYA STATION — the elevated platform: tiled floor, a standing train on
// one side, square pillars, fluorescent tubes, a mezzanine up a flight.
import * as THREE from 'three';
import { surface, glow } from '../kit.js';
export const DEF = {
  id: 'shibuya_underground', name: 'SHIBUYA STATION', jp: '渋谷駅 高架ホーム',
  desc: 'A platform after the last train. Pillars for cover, a mezzanine above.',
  extent: { minX: -24, maxX: 24, minZ: -9, maxZ: 11 },
  background: 0x0a0c12, fog: { color: 0x0a0c12, near: 30, far: 90 },
  grade: { vignette: 0.55, tint: [0.96, 1.0, 1.06], lift: -0.01, sat: 0.92, contrast: 1.06 },
  lights: { key: { color: 0xe8f0ff, intensity: 2.0 }, rim: { color: 0xffc080, intensity: 1.6, pos: [8, 6, -8] }, hemi: { sky: 0x8090b0, ground: 0x30302c, intensity: 0.85 }, fill: { color: 0xa0c0ff, intensity: 0.5 } },
  previewCam: { pos: [-14, 5, 16], look: [0, 1, 0] }
};
export function build(k) {
  const tile = surface('ptile', 0xb8bac0, { tex: 'tile', rep: [24, 10], texArgs: ['#9a9ea8', '#33363e'] });
  const conc = surface('pconc', 0x9a9ca4, { tex: 'concrete', rep: [6, 6] });
  const pillar = surface('pillar', 0xcfd2d8, { tex: 'concrete', rep: [1, 3] });
  const train = surface('train', 0x3e6a4a, { arch: 'metal' });
  const trainTop = surface('trainTop', 0xd8dcd8, { arch: 'metal' });
  const ceil = surface('ceil', 0x5a5e68, { tex: 'concrete', rep: [12, 4] });
  const yellow = surface('tactile', 0xd8c040, { arch: 'stone' });
  k.floor(tile, 0, 1, 60, 22);
  // tactile strip along the platform edge
  k.box(yellow, 0, 0.005, -8.2, 56, 0.01, 0.5, { floor: false, wall: false });
  // the train, standing at the edge (a wall the length of the platform)
  k.box(train, 0, 0.2, -12.5, 52, 3.2, 3.2, { wall: true });
  k.box(trainTop, 0, 3.4, -12.5, 52, 0.4, 3.0, { floor: false, wall: false });
  for (let x = -24; x <= 24; x += 4) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), glow(0xfff0c0, 0.9)); w.position.set(x, 2.0, -10.88); k.add(w); }
  // pillars (cover)
  for (const x of [-16, -8, 8, 16]) k.box(pillar, x, 0, 3, 1.2, 5.2, 1.2);
  // ceiling with tubes
  k.box(ceil, 0, 5.2, 1, 60, 0.6, 22, { floor: false, wall: false });
  for (let x = -22; x <= 22; x += 5.5) { const t = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.3), glow(0xf4f8ff)); t.position.set(x, 5.1, 1); k.add(t); }
  // the mezzanine: a flight of steps at the far end up to a deck at 2.2
  for (let i = 0; i < 6; i++) k.box(conc, 20 - i * 0.0, 0, 8 - i * 0.6, 8, 0.36 * (i + 1), 0.6, { wall: false });
  k.box(conc, 20, 2.16, 10.2, 8, 0.2, 2.2, { wall: false });
  k.box(conc, 20, 2.36, 11.4, 8, 1.0, 0.2, { wall: false });
  // back wall with posters
  k.box(conc, 0, 0, 11.5, 60, 5.4, 0.6);
  for (let i = 0; i < 5; i++) { k.sign(-18 + i * 8, 2.6, 11.15, 3.2, 2.0, [0xff6090, 0x60c0ff, 0xffd060, 0x80ff90, 0xff9040][i], Math.PI); }
  k.fence(null);
}
