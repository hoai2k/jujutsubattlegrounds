// Ryu's ultimate kills platforms that destroying every destructible on the map
// does not. This instruments Bounds.remove/drop to find out who is calling.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const server = await createServer({ server: { port: 5193, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 800, height: 480 } });
page.on('pageerror', e => console.log('[err]', e.message));
await page.goto('http://localhost:5193/', { waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.keyboard.press('Enter');
await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
const r = await page.evaluate(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mc = await import('/src/arena/mapcheck.js');
  window.__skipSelect({ mode: 'cpu', chars: ['ryu', 'yuji'], p1: 'ryu', p2: 'yuji', map: 'detention' });
  const t = Date.now();
  while (!window.__game.match && Date.now() - t < 25000) await sleep(120);
  const m = window.__game.match;
  await sleep(1600);
  const bd = m.arena.bounds, D = m.arena.destruct;
  const [ryu] = m.fighters;
  const calls = [];
  const realRemove = bd.remove.bind(bd);
  bd.remove = id => { calls.push({ what: 'remove', id: String(id), stack: (new Error()).stack.split('\n').slice(2, 5).join(' | ') }); return realRemove(id); };
  const realDrop = bd.drop.bind(bd);
  bd.drop = items => { calls.push({ what: 'drop', n: items?.length, stack: (new Error()).stack.split('\n').slice(2, 5).join(' | ') }); return realDrop(items); };
  const platBefore = bd.platforms.filter(p => p.live);
  const before = mc.reachable(bd).seen.size;
  const home = ryu.pos.clone();
  const live = D.entries.filter(e => e.stage < 3);
  const shots = [];
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) shots.push({ yaw, from: home });
  for (let i = 0; i < 4 && live.length; i++) {
    const e = live[Math.floor(i * live.length / 4)];
    const back = e.center.clone().sub(home).normalize().multiplyScalar(-8).add(e.center);
    back.y = bd.floorAt(back.x, back.z, e.center.y + 4);
    shots.push({ yaw: Math.atan2(e.center.x - back.x, e.center.z - back.z), from: back });
  }
  let rounds = 0;
  const realReset = m.resetRound?.bind(m);
  if (realReset) m.resetRound = (...a) => { rounds++; return realReset(...a); };
  for (const s of shots) {
    ryu.pos.copy(s.from); ryu.facing = s.yaw;
    ryu.res.maxCE = 100; ryu.res.curCE = 100;
    ryu.startUltBurst(m.ctxFor(ryu));
    await sleep(2300);
  }
  await sleep(700);
  const after = mc.reachable(bd).seen.size;
  const killed = platBefore.filter(p => !p.live);
  const byKind = {};
  for (const c of calls) { const k = c.stack.replace(/https?:\/\/[^ )]+/g, m2 => m2.split('/').pop()); byKind[k] = (byKind[k] || 0) + 1; }
  return {
    cellsBefore: before, cellsAfter: after,
    lostPct: +(100 * (before - after) / before).toFixed(1),
    roundResets: rounds,
    killedTotal: killed.length,
    killedRoutes: killed.filter(p => !p.prop).map(p => String(p.id)),
    killedProps: killed.filter(p => p.prop).map(p => String(p.id)),
    callSites: Object.entries(byKind).sort((a, b) => b[1] - a[1]).slice(0, 4)
  };
});
console.log(JSON.stringify(r, null, 1));
await browser.close(); await server.close(); process.exit(0);
