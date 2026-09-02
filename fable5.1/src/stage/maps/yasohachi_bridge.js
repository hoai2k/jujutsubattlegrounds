// placeholder until the map pass — a flat lit lot so the registry is complete
import { surface } from '../kit.js';
export const DEF = { id: 'yasohachi_bridge', name: 'YASOHACHI_BRIDGE', jp: '', desc: 'pending', extent: { minX: -22, maxX: 22, minZ: -18, maxZ: 18 }, background: 0x0d1020, grade: { vignette: 0.45, tint: [1, 1, 1], lift: 0, sat: 1, contrast: 1 }, lights: { key: { color: 0xffe0c8, intensity: 2.4 }, rim: { color: 0x7fb0ff, intensity: 2 }, hemi: { sky: 0x6f7fd0, ground: 0x30281e, intensity: 0.9 } } };
export function build(k) { k.floor(surface('lot', 0x8a8c94, { tex: 'concrete', rep: [12, 12] }), 0, 0, 80, 80); k.skyline(20); k.fence(null); }
