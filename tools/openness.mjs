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
      wallsInPlay: inPlay,
      platforms: bd.platforms.length
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
    ('walls ' + r.wallsInPlay).padEnd(11),
    'pieces ' + r.platforms
  );
}
await browser.close();
await server.close();
