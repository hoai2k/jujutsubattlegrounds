// BOOTS EACH MAP IN THE REAL GAME and reports frame cost + renderer counters.
//
// The set-dressing pass added several hundred objects and a few dozen
// per-frame tickers across the ten maps, and "it still validates" is not the
// same claim as "it still runs". This starts an actual CPU match on each map
// through the existing `__skipSelect` dev hook, lets it settle, and then
// samples real frames — same renderer, same post stack, same everything.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const maps = process.argv.slice(2);
const server = await createServer({ server: { port: 5201, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const out = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const errs = [];
const ids = maps.length ? maps : [
  'shibuya_underground', 'shibuya_crossing', 'sendai_school', 'jujutsu_high', 'detention',
  'shinjuku', 'kyoto_grounds', 'star_tomb', 'yasohachi_bridge', 'sewer_lair'
];
for (const map of ids) {
  // ONE PAGE PER MAP. `__skipSelect` is consumed when the match starts, so a
  // second call on the same page throws — and reusing a page would measure a
  // scene with the previous map's textures still resident anyway.
  const page = await browser.newPage({ viewport: { width: 1100, height: 620 } });
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:5201/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
  const r = await page.evaluate(async map => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    window.__skipSelect({ mode: 'cpu', chars: ['yuji', 'megumi'], p1: 'yuji', p2: 'megumi', map });
    const t0 = Date.now();
    while (!window.__game?.match && Date.now() - t0 < 30000) await sleep(120);
    if (!window.__game?.match) return { map, error: 'match never started' };
    await sleep(2500);                       // let it settle
    const frames = [];
    let last = performance.now();
    await new Promise(res => {
      let n = 0;
      const tick = () => {
        const now = performance.now();
        frames.push(now - last);
        last = now;
        if (++n >= 90) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    frames.sort((a, b) => a - b);
    const info = window.__game.stage?.renderer?.info;
    return {
      map,
      medianMs: +frames[frames.length >> 1].toFixed(2),
      p95Ms: +frames[Math.floor(frames.length * 0.95)].toFixed(2),
      drawCalls: info?.render?.calls ?? null,
      triangles: info?.render?.triangles ?? null,
      geometries: info?.memory?.geometries ?? null,
      textures: info?.memory?.textures ?? null
    };
  }, map);
  out.push(r);
  console.error(JSON.stringify(r));
  await page.close();
}
console.log(JSON.stringify({ maps: out, pageErrors: [...new Set(errs)] }, null, 1));
await browser.close();
await server.close();
