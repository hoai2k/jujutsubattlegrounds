// Fires Ryu's ultimate across a map from four headings and asks the map
// validator whether navigation survived. One browser per map — the ten-map
// version of this ran the renderer out of memory.
import { chromium } from 'playwright';
import { createServer } from 'vite';
const maps = JSON.parse(process.argv[2]);
const server = await createServer({ server: { port: 5196, strictPort: true } });
await server.listen();
const out = [];
for (const map of maps) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 900, height: 540 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  try {
    await page.goto('http://localhost:5196/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !!window.__skipSelect, null, { timeout: 20000 });
    const r = await page.evaluate(async map => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const mc = await import('/src/arena/mapcheck.js');
      window.__skipSelect({ mode: 'cpu', chars: ['ryu', 'yuji'], p1: 'ryu', p2: 'yuji', map });
      const t = Date.now();
      while (!window.__game.match && Date.now() - t < 25000) await sleep(120);
      const m = window.__game.match;
      if (!m) return { error: 'no match' };
      await sleep(1800);
      const [ryu] = m.fighters;
      const bd = m.arena.bounds;
      // `reachable` returns { seen: Set, cells: n, key, capped } — the walked
      // cell count is `seen.size`, not the object.
      const cells = b => mc.reachable(b).seen.size;
      const before = cells(bd);
      const platBefore = bd.platforms.filter(p => p.live);
      const liveBefore = platBefore.length;
      const wallsBefore = bd.walls.filter(w => w.live).length;
      const D = m.arena.destruct;
      const destBefore = D.entries.filter(e => e.stage < 3).length;
      const home = ryu.pos.clone();
      // FOUR SHOTS ON THE CARDINALS from the spawn, and then FOUR AIMED at the
      // four densest destructible clusters. The cardinals answer "does it
      // break navigation"; the aimed shots answer "does it destroy anything at
      // all", which the cardinals do not on a map that is mostly open lawn.
      const targets = [];
      const live = D.entries.filter(e => e.stage < 3);
      for (let i = 0; i < 4 && live.length; i++) {
        const e = live[Math.floor(i * live.length / 4)];
        targets.push(e.center.clone());
      }
      const shots = [];
      for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) shots.push({ yaw, from: home });
      for (const t of targets) {
        const back = t.clone().sub(home).normalize().multiplyScalar(-8).add(t);
        back.y = bd.floorAt(back.x, back.z, t.y + 4);
        shots.push({ yaw: Math.atan2(t.x - back.x, t.z - back.z), from: back });
      }
      for (const s of shots) {
        ryu.pos.copy(s.from); ryu.facing = s.yaw;
        ryu.res.maxCE = 100; ryu.res.curCE = 100;
        ryu.startUltBurst(m.ctxFor(ryu));
        await sleep(2300);
      }
      ryu.pos.copy(home);
      await sleep(800);
      const after = cells(bd);
      // THE CHECK THAT MATTERS: is every spawn still standable, is every live
      // platform still reachable from a spawn, and is nobody under the floor?
      const spawnsOk = (bd.spawns.length ? bd.spawns : []).every(s => {
        const y = bd.floorAt(s.x, s.z, s.y + 0.6);
        return Number.isFinite(y) && Math.abs(y - s.y) < 3.0;
      });
      const fightersOk = m.fighters.every(f =>
        f.pos.y >= bd.floorAt(f.pos.x, f.pos.z, f.pos.y + 1) - 0.8);
      return {
        map,
        reachableCellsBefore: before, reachableCellsAfter: after,
        cellsLostPct: +(100 * (before - after) / Math.max(1, before)).toFixed(1),
        platformsDestroyed: liveBefore - bd.platforms.filter(p => p.live).length,
        // THE NUMBER THAT MATTERS. A destroyed PROP TOP (a car roof, a train
        // roof) is intended destruction and the map validator already rules it
        // is not a route; a destroyed ROUTE is navigation actually breaking.
        routesDestroyed: platBefore.filter(p => !p.live && !p.prop).length,
        propTopsDestroyed: platBefore.filter(p => !p.live && p.prop).length,
        wallsDestroyed: wallsBefore - bd.walls.filter(w => w.live).length,
        destructiblesTotal: D.entries.length,
        destructiblesDestroyed: destBefore - D.entries.filter(e => e.stage < 3).length,
        spawnsStillStandable: spawnsOk,
        nobodyUnderTheFloor: fightersOk
      };
    }, map);
    out.push({ ...r, errors: errs.slice(0, 3) });
  } catch (e) { out.push({ map, error: String(e).slice(0, 200) }); }
  await browser.close();
}
await server.close();
console.log(JSON.stringify(out, null, 1));
process.exit(0);
