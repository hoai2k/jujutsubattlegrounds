import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5209, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 320, height: 200 } });
page.on('pageerror', e => console.error('[err]', e.message));
await page.goto('http://localhost:5209/', { waitUntil: 'domcontentloaded' });
console.log(JSON.stringify(await page.evaluate(async () => {
  const THREE = await import('/node_modules/three/build/three.module.js');
  const mc = await import('/src/arena/mapcheck.js');
  const { STEP_UP } = await import('/src/arena/bounds.js');
  const bd = mc.boundsFor('detention');
  const R = mc.reachable(bd);
  // what heights did the fill actually reach near the tower?
  const near = [];
  for (const k of R.seen) {
    const [i, j, hb] = k.split(',').map(Number);
    const x = i * 0.25, z = j * 0.25;
    if (Math.hypot(x + 30, z + 26) < 7) near.push(+(hb * 0.25).toFixed(2));
  }
  near.sort((a, b) => b - a);
  // and what does the collision say the helix treads are?
  const treads = bd.platforms.filter(p => p.id === 'towerstair')
    .map(p => ({ y: +p.y.toFixed(2), x: +((p.x0 + p.x1) / 2).toFixed(2), z: +((p.z0 + p.z1) / 2).toFixed(2) }))
    .sort((a, b) => a.y - b.y);
  const probe = treads.slice(0, 6).map(t => {
    const p = new THREE.Vector3(t.x, bd.floorAt(t.x, t.z, t.y + STEP_UP), t.z);
    const before = p.clone();
    bd.resolveWalls(p, 0.36);
    return { want: t.y, floorAt: +p.y.toFixed(2), pushed: +before.distanceTo(p).toFixed(3) };
  });
  return { maxHeightNearTower: near.slice(0, 6), treadCount: treads.length, probe };
}), null, 1));
await browser.close(); await server.close();
