// OPENNESS — how much CLEAR FIGHTING FLOOR does each map actually have?
//
// The audit answers "can you get there"; it says nothing about whether the
// place is worth getting to. This walks the same flood fill and then asks the
// question the audit cannot:
//
//   · area      total walkable square metres, and the largest single connected
//               region of it (the arena you actually fight in)
//   · biggest   the largest OPEN RECTANGLE inside that region — no wall, no
//               obstacle, no change of height. This is the number that decides
//               whether a map feels like a plaza or a corridor.
//   · clutter   wall colliders whose footprint sits inside the play area
//   · pieces    platform colliders, i.e. how finely the floor is chopped up
//
//     node tools/openness.mjs [map ...]
import { chromium } from 'playwright';
import { createServer } from 'vite';

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PORT = +(process.env.OPEN_PORT || 5271);
const server = await createServer({ server: { port: PORT, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'domcontentloaded' });

const res = await page.evaluate(async (only) => {
  const mc = await import('/src/arena/mapcheck.js');
  const idx = await import('/src/arena/index.js');
  const ids = only.length ? only : idx.MAP_IDS;
  const STEP = 0.5;
  const out = [];
  for (const id of ids) {
    const bd = mc.boundsFor(id);
    const R = mc.reachable(bd);
    // re-grid the visited set at 0.5 m: (i, j) -> set of heights stood on
    const cells = new Map();
    for (const k of R.seen) {
      const [i, j, yb] = k.split(',').map(Number);
      const x = i * 0.25, z = j * 0.25, y = yb * 0.25;
      const key = Math.round(x / STEP) + ',' + Math.round(z / STEP);
      const e = cells.get(key);
      if (!e) cells.set(key, [y]); else if (!e.includes(y)) e.push(y);
    }
    const area = cells.size * STEP * STEP;
    // THE RECTANGLE HAS TO BE ON ONE FLOOR. Measured across the whole visited
    // set it happily spans a gallery, the drop off it and the yard below, and
    // reports a courtyard on a map made of 6 m balconies.
    const byY = new Map();                  // height bucket -> Set("i,j")
    for (const [k, ys] of cells) {
      for (const y of ys) {
        const yb = Math.round(y / 0.5);
        for (const b2 of [yb - 1, yb, yb + 1]) {   // a step is not a storey
          if (!byY.has(b2)) byY.set(b2, new Set());
        }
        byY.get(yb).add(k);
      }
    }
    let best = 0, rect = 0, rectDims = [0, 0], rectY = 0;
    // THE BIGGEST CIRCLE THAT FITS, which is the number a fight cares about.
    // The largest RECTANGLE rewards corridors — a 15 m lane 108 m long scores
    // higher than a 30 m green — and a corridor is the thing being fixed.
    let disc = 0, discY = 0, discAt = [0, 0];
    const floors = [];
    for (const [yb, set] of byY) {
      if (!set.size) continue;
      // connected components inside this floor
      const seen = new Set();
      for (const start of set) {
        if (seen.has(start)) continue;
        const stack = [start]; seen.add(start);
        const region = [];
        while (stack.length) {
          const cur = stack.pop();
          region.push(cur);
          const [ci, cj] = cur.split(',').map(Number);
          for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nk = (ci + di) + ',' + (cj + dj);
            if (seen.has(nk) || !set.has(nk)) continue;
            seen.add(nk); stack.push(nk);
          }
        }
        if (region.length > best) best = region.length;
        {
          // two-pass chamfer distance transform inside this component
          let ai = Infinity, aj = Infinity, bi = -Infinity, bj = -Infinity;
          for (const k of region) {
            const [ci, cj] = k.split(',').map(Number);
            ai = Math.min(ai, ci); bi = Math.max(bi, ci);
            aj = Math.min(aj, cj); bj = Math.max(bj, cj);
          }
          const w = bi - ai + 3, h = bj - aj + 3;      // 1-cell margin of "outside"
          const d = new Float32Array(w * h);           // 0 outside, INF inside
          for (const k of region) {
            const [ci, cj] = k.split(',').map(Number);
            d[(ci - ai + 1) * h + (cj - aj + 1)] = Infinity;
          }
          const D1 = 1, D2 = Math.SQRT2;
          for (let i = 1; i < w; i++) for (let j = 1; j < h - 1; j++) {
            const o = i * h + j;
            if (!d[o]) continue;
            d[o] = Math.min(d[o], d[o - h] + D1, d[o - 1] + D1, d[o - h - 1] + D2, d[o - h + 1] + D2);
          }
          for (let i = w - 2; i >= 0; i--) for (let j = h - 2; j >= 1; j--) {
            const o = i * h + j;
            if (!d[o]) continue;
            d[o] = Math.min(d[o], d[o + h] + D1, d[o + 1] + D1, d[o + h + 1] + D2, d[o + h - 1] + D2);
          }
          for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
            const v = d[i * h + j];
            if (v > disc && v < Infinity) {
              disc = v; discY = yb * 0.5; discAt = [(i + ai - 1) * STEP, (j + aj - 1) * STEP];
            }
          }
        }
        floors.push({ y: yb * 0.5, area: Math.round(region.length * STEP * STEP), rect: 0, dims: [0, 0] });
        // largest all-ones rectangle in this component
        const rs = new Set(region);
        let i0 = Infinity, i1 = -Infinity, j0 = Infinity, j1 = -Infinity;
        for (const k of region) {
          const [ci, cj] = k.split(',').map(Number);
          i0 = Math.min(i0, ci); i1 = Math.max(i1, ci);
          j0 = Math.min(j0, cj); j1 = Math.max(j1, cj);
        }
        const W = i1 - i0 + 1, H = j1 - j0 + 1;
        if (W * H * STEP * STEP < rect) continue;
        const up = new Array(W).fill(0);
        for (let j = 0; j < H; j++) {
          for (let i = 0; i < W; i++) up[i] = rs.has((i + i0) + ',' + (j + j0)) ? up[i] + 1 : 0;
          const stack2 = [];
          for (let i = 0; i <= W; i++) {
            const h = i < W ? up[i] : 0;
            let startI = i;
            while (stack2.length && stack2[stack2.length - 1][1] >= h) {
              const [si, sh] = stack2.pop();
              const a = sh * (i - si) * STEP * STEP;
              const f = floors[floors.length - 1];
              if (f && a > f.rect) { f.rect = Math.round(a); f.dims = [(i - si) * STEP, sh * STEP]; }
              if (a > rect) { rect = a; rectDims = [(i - si) * STEP, sh * STEP]; rectY = yb * 0.5; }
              startI = si;
            }
            stack2.push([startI, h]);
          }
        }
      }
    }
    const inPlay = bd.walls.filter(w => w.y0 < 3 && (w.x1 - w.x0) * (w.z1 - w.z0) < 400).length;
    out.push({
      id,
      extentArea: Math.round((bd.maxX - bd.minX) * (bd.maxZ - bd.minZ)),
      walkArea: Math.round(area),
      biggestFloor: Math.round(best * STEP * STEP),
      openRect: [Math.round(rectDims[0]), Math.round(rectDims[1])],
      openRectY: rectY,
      discR: +(disc * STEP).toFixed(1), discY, discAt: discAt.map(v => Math.round(v)),
      wallsInPlay: inPlay,
      platforms: bd.platforms.length,
      floors: floors.filter(f => f.area > 120).sort((a, b) => b.rect - a.rect).slice(0, 5)
    });
  }
  return out;
}, only);

for (const r of res) {
  console.log(
    r.id.padEnd(22),
    ('walk ' + r.walkArea + ' m²').padEnd(14),
    ('arena ' + r.biggestFloor + ' m²').padEnd(15),
    ('open ' + r.openRect[0] + '×' + r.openRect[1] + ' m @ y' + r.openRectY).padEnd(24),
    ('circle Ø' + Math.round(r.discR * 2) + ' m @ y' + r.discY).padEnd(21),
    ('walls ' + r.wallsInPlay).padEnd(11),
    'pieces ' + r.platforms
  );
  if (process.argv.includes('--detail')) {
    for (const f of r.floors) {
      console.log('    y=' + String(f.y).padStart(6), ('area ' + f.area + ' m²').padEnd(13),
        'best box ' + Math.round(f.dims[0]) + '×' + Math.round(f.dims[1]) + ' m');
    }
  }
}
await browser.close();
await server.close();
