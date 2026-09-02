// Quality tiers. The point of a tier is that it drops WORK, not just pixels:
// LOW is a direct render with no composer and no shadow map at all.
export const TIERS = [
  { name: 'LOW', shadow: 0, post: false, bloom: false, aberration: false, fxaa: false, impactFrame: false, pixelRatioCap: 1.0, particles: 0.4, springs: false, decals: true },
  { name: 'MEDIUM', shadow: 1024, post: true, bloom: false, aberration: false, fxaa: false, impactFrame: true, pixelRatioCap: 1.25, particles: 0.7, springs: true, decals: true },
  { name: 'HIGH', shadow: 2048, post: true, bloom: true, aberration: true, fxaa: true, impactFrame: true, pixelRatioCap: 1.5, particles: 1.0, springs: true, decals: true },
  { name: 'ULTRA', shadow: 4096, post: true, bloom: true, aberration: true, fxaa: true, impactFrame: true, pixelRatioCap: 2.0, particles: 1.5, springs: true, decals: true }
];

const KEY = 'f51.quality';
let index = 2;
try {
  const q = new URLSearchParams(location.search).get('quality');
  const saved = q ?? localStorage.getItem(KEY);
  if (saved !== null) {
    const i = TIERS.findIndex(t => t.name.toLowerCase() === String(saved).toLowerCase());
    index = i >= 0 ? i : Math.max(0, Math.min(TIERS.length - 1, parseInt(saved, 10) || 2));
  }
} catch (e) { /* no storage */ }

const listeners = new Set();
export const quality = () => TIERS[index];
export const qualityIndex = () => index;
export function setQuality(i) {
  index = Math.max(0, Math.min(TIERS.length - 1, i | 0));
  try { localStorage.setItem(KEY, String(index)); } catch (e) { /* ignore */ }
  for (const l of listeners) l(TIERS[index]);
  return TIERS[index];
}
export const cycleQuality = () => setQuality((index + 1) % TIERS.length);
export const onQuality = fn => { listeners.add(fn); return () => listeners.delete(fn); };
