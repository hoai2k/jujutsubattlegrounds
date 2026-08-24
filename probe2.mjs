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
  const bd = mc.boundsFor('star_tomb');
  const R = mc.reachable(bd);
  const at = (x, z) => {
    const i = Math.round(x / 0.25), j = Math.round(z / 0.25);
    const hs = [];
    for (const k of R.seen) {
      const [a, b, hb] = k.split(',').map(Number);
      if (a === i && b === j) hs.push(+(hb * 0.25).toFixed(2));
    }
    return hs.sort((p, q) => q - p);
  };
  return {
    summitCentre: at(0, 0),
    summitNearShaft: at(11.5, -11.5),
    inShaftHole: at(8.5, -8.5),
    chamberUnderShaft: at(8.5, -8.5),
    chamberMid: at(6.5, 0),
    daisTop: at(0, 0),
    shaftTopTread: at(9.9, -9.9),
    floorAtHole: +bd.floorAt(8.5, -8.5, 99).toFixed(2),
    floorAtChamberMid: +bd.floorAt(6.5, 0, 0).toFixed(2),
    floorAtDais: +bd.floorAt(0, 0, 0).toFixed(2),
    summitDeckAt: +bd.floorAt(11.5, -11.5, 99).toFixed(2)
  };
}), null, 1));
await browser.close(); await server.close();
