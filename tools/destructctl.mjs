// Is the navigable-space loss RYU'S, or is it what this map's destructibles do
// when destroyed by anything at all? Destroys the same entries directly
// through `Destructibles.damageAt` with no attacker involved, and compares.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const map = process.argv[2];
const server = await createServer({ server: { port: 5194, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 800, height: 480 } });
page.on('pageerror', e => console.log('[err]', e.message));
await page.goto('http://localhost:5194/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
const r = await page.evaluate(async map => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mc = await import('/src/arena/mapcheck.js');
  window.__skipSelect({ mode: 'cpu', chars: ['yuji', 'nobara'], p1: 'yuji', p2: 'nobara', map });
  const t = Date.now();
  while (!window.__game.match && Date.now() - t < 25000) await sleep(120);
  const m = window.__game.match;
  await sleep(1600);
  const bd = m.arena.bounds, D = m.arena.destruct;
  const cells = () => mc.reachable(bd).seen.size;
  const before = cells();
  const platBefore = bd.platforms.filter(p => p.live);
  // DESTROY EVERY DESTRUCTIBLE ON THE MAP. The absolute worst case the
  // existing destruction system can produce, with no character involved.
  for (const e of [...D.entries]) D.damageAt(e.center.clone(), 1.0, 999, { kind: 'erase' });
  await sleep(600);
  const after = cells();
  const killed = platBefore.filter(p => !p.live);
  return {
    map,
    cellsBefore: before, cellsAfterTotalDestruction: after,
    cellsLostPct: +(100 * (before - after) / before).toFixed(1),
    platformsKilled: killed.length,
    platformsKilledThatWereProps: killed.filter(p => p.prop).length,
    platformsKilledThatWereROUTES: killed.filter(p => !p.prop).length,
    routeIds: [...new Set(killed.filter(p => !p.prop).map(p => String(p.id)))].slice(0, 12),
    allKilledIds: [...new Set(killed.map(p => String(p.id)))].slice(0, 16),
    spawnsOk: (bd.spawns.length ? bd.spawns : []).every(s => Math.abs(bd.floorAt(s.x, s.z, s.y + 0.6) - s.y) < 3)
  };
}, map);
console.log(JSON.stringify(r, null, 1));
await browser.close(); await server.close(); process.exit(0);
