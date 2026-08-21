// CONTROL. The same destruction test with an EXISTING character's biggest
// map-breaker, so "Ryu's beam costs 5% of shibuya_crossing" can be read
// against what the game already does rather than against zero.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const [who, map] = [process.argv[2], process.argv[3]];
const server = await createServer({ server: { port: 5195, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 540 } });
page.on('pageerror', e => console.log('[err]', e.message));
await page.goto('http://localhost:5195/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
const r = await page.evaluate(async ({ who, map }) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mc = await import('/src/arena/mapcheck.js');
  window.__skipSelect({ mode: 'cpu', chars: [who, 'yuji'], p1: who, p2: 'yuji', map });
  const t = Date.now();
  while (!window.__game.match && Date.now() - t < 25000) await sleep(120);
  const m = window.__game.match;
  await sleep(1800);
  const [a] = m.fighters;
  const bd = m.arena.bounds, D = m.arena.destruct;
  const cells = () => mc.reachable(bd).seen.size;
  const before = cells();
  const platBefore = bd.platforms.filter(p => p.live).length;
  const destBefore = D.entries.filter(e => e.stage < 3).length;
  const home = a.pos.clone();
  const live = D.entries.filter(e => e.stage < 3);
  const shots = [];
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) shots.push({ yaw, from: home });
  for (let i = 0; i < 4 && live.length; i++) {
    const e = live[Math.floor(i * live.length / 4)];
    const back = e.center.clone().sub(home).normalize().multiplyScalar(-8).add(e.center);
    back.y = bd.floorAt(back.x, back.z, e.center.y + 4);
    shots.push({ yaw: Math.atan2(e.center.x - back.x, e.center.z - back.z), from: back });
  }
  for (const s of shots) {
    a.pos.copy(s.from); a.facing = s.yaw;
    a.res.maxCE = 100; a.res.curCE = 100;
    // Gojo's ultimate is HOLLOW PURPLE, which goes through `startPurple`;
    // everyone else's is a burst.
    if (a.cfg.purple) { a.purpleWindow = 999; a.startPurple(m.ctxFor(a)); }
    else a.startUltBurst(m.ctxFor(a));
    await sleep(2300);
  }
  await sleep(700);
  const after = cells();
  return {
    who, map,
    cellsBefore: before, cellsAfter: after,
    cellsLostPct: +(100 * (before - after) / Math.max(1, before)).toFixed(1),
    platformsDestroyed: platBefore - bd.platforms.filter(p => p.live).length,
    destructiblesDestroyed: destBefore - D.entries.filter(e => e.stage < 3).length,
    spawnsOk: (bd.spawns.length ? bd.spawns : []).every(s => Math.abs(bd.floorAt(s.x, s.z, s.y + 0.6) - s.y) < 3)
  };
}, { who, map });
console.log(JSON.stringify(r, null, 1));
await browser.close(); await server.close(); process.exit(0);
