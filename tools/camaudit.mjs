// CAMERA AUDIT — drives the real FightCamera against every real map, headlessly.
//
// The map validator (src/arena/mapcheck.js) answers "can the fighter stand
// here". This answers the next question: "and if he does, can he SEE himself".
// It builds each map, walks a grid of standable positions, puts an opponent at
// eight bearings around each one, runs the actual rig from src/core/camera.js
// to a settled frame, and reports every spot where the shot fails.
//
//     node tools/camaudit.mjs                  # all ten maps
//     node tools/camaudit.mjs kyoto_grounds    # one map
//     node tools/camaudit.mjs --step 2.5       # coarser grid (faster)
import { chromium } from 'playwright';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const stepArg = args.indexOf('--step');
const STEP = stepArg >= 0 ? +args[stepArg + 1] : 3;
const only = args.filter((a, i) => !a.startsWith('--') && i !== stepArg + 1);

const PORT = +(process.env.CAMAUDIT_PORT || 5198);
const server = await createServer({ server: { port: PORT, strictPort: true, hmr: false }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'domcontentloaded' });

const res = await page.evaluate(async ({ only, STEP }) => {
  const THREE = await import('/node_modules/three/build/three.module.js');
  const idx = await import('/src/arena/index.js');
  const { FightCamera } = await import('/src/core/camera.js');
  const ids = only.length ? only : idx.MAP_IDS;

  // A settled shot: run the rig long enough that the damping has converged.
  // `ground` is what combat/fighter.js would be reporting as this fighter's
  // own floor — the match hands the rig the same number every frame.
  const OPTS = g => ({ ground: g, foeH: 1.8 });
  const settle = (cam, me, foe, ground) => { for (let i = 0; i < 150; i++) cam.update(1 / 60, me, foe, null, OPTS(ground)); };

  const out = { maps: [] };
  for (const id of ids) {
    const built = idx.buildMap(id, { quality: idx.DEFAULT_QUALITY });
    const b = built.bounds;
    const find = [];
    const bump = (kind, o) => find.push({ kind, ...o });
    const stats = { probes: 0, minDist: 99, sumDist: 0 };

    for (let x = b.minX + 1; x <= b.maxX - 1; x += STEP) {
      for (let z = b.minZ + 1; z <= b.maxZ - 1; z += STEP) {
        const fy = b.floorAt(x, z, Infinity);
        // is this a real standable spot? (not inside a wall)
        let inWall = false;
        for (const w of b.walls) {
          if (!w.live) continue;
          if (fy + 1.55 < w.y0 || fy > w.y1 - 0.02) continue;
          if (x > w.x0 - 0.36 && x < w.x1 + 0.36 && z > w.z0 - 0.36 && z < w.z1 + 0.36) { inWall = true; break; }
        }
        if (inWall) continue;

        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          const me = new THREE.Vector3(x, fy, z);
          // opponent 4 m away on the same deck (clamped into the map)
          const ox = Math.max(b.minX + 0.5, Math.min(b.maxX - 0.5, x + Math.sin(a) * 4));
          const oz = Math.max(b.minZ + 0.5, Math.min(b.maxZ - 0.5, z + Math.cos(a) * 4));
          // THE OPPONENT STANDS ON A LEVEL THIS FIGHTER COULD BE NEXT TO.
          // `floorAt(..., Infinity)` returns the highest surface at that
          // column, which on the urban maps is a roof twenty metres up — a
          // pairing that never happens at four metres' separation and that
          // swamps the report with shots nobody will ever be in.
          const foe = new THREE.Vector3(ox, b.floorAt(ox, oz, fy + 2.2), oz);

          const cam = new FightCamera(new THREE.PerspectiveCamera(50, 1.6, 0.1, 400), 'follow');
          cam.bounds = b;
          settle(cam, me, foe, fy);

          // 0. THE UNLOCKED CAMERA (R3) has to frame its fighter too. Run the
          //    same spot with the opponent lock off and check he is on screen.
          const free = new FightCamera(new THREE.PerspectiveCamera(50, 1.6, 0.1, 400), 'follow');
          free.bounds = b;
          free.setLocked(false);
          settle(free, me, foe, fy);
          free.cam.updateMatrixWorld();
          const fp = new THREE.Vector3(me.x, me.y + 1.15, me.z).project(free.cam);
          if (fp.z > 1 || Math.abs(fp.x) > 0.92 || Math.abs(fp.y) > 0.92)
            bump('FREE-OFF-FRAME', { x: +x.toFixed(1), z: +z.toFixed(1), deg: k * 45, deck: +me.y.toFixed(1), ndc: [+fp.x.toFixed(2), +fp.y.toFixed(2)] });

          const chest = new THREE.Vector3(me.x, me.y + 1.15, me.z);
          const d = cam.pos.distanceTo(chest);
          stats.probes++; stats.sumDist += d;
          if (d < stats.minDist) stats.minDist = d;

          // 1. THE RIG IS IN THE FIGHTER'S HEAD. camera.js holds the lens at
          //    MIN_LENS (1.5 m) from his chest whatever the geometry says, so
          //    anything under that is a leak. Between the floor and 2 m is
          //    reported separately: the shot is legitimately tight there, and
          //    it is worth knowing where, but it is not a fault.
          if (d < 1.45) bump('POINT-BLANK', { x: +x.toFixed(1), z: +z.toFixed(1), deg: k * 45, dist: +d.toFixed(2) });
          else if (d < 2) bump('TIGHT', { x: +x.toFixed(1), z: +z.toFixed(1), deg: k * 45, dist: +d.toFixed(2) });

          // 2. THE RIG IS INSIDE THE WORLD — under a surface the fighter is
          //    not under, or through a wall. Split in two, because the camera
          //    is ALLOWED to clip geometry rather than sit inside the fighter
          //    (camera.js MIN_LENS): at the standoff floor that is the trade
          //    working as designed, and further out than it, it is the sweep
          //    failing.
          const cf = b.floorAt(cam.pos.x, cam.pos.z, Infinity);
          if (cam.pos.y < cf - 0.05 && !b._sameSpace(cam.pos.x, cam.pos.y, cam.pos.z, me)) {
            bump(d > 1.85 ? 'BURIED-CAM' : 'STANDOFF-CLIP',
              { x: +x.toFixed(1), z: +z.toFixed(1), deg: k * 45, dist: +d.toFixed(2), camY: +cam.pos.y.toFixed(2), lid: +cf.toFixed(2) });
          }

          // 3. THE FIGHTER IS OFF-SCREEN. Project his chest through the settled
          //    camera and check it lands inside the frame.
          cam.cam.updateMatrixWorld();
          const p = chest.clone().project(cam.cam);
          if (p.z > 1 || Math.abs(p.x) > 0.92 || Math.abs(p.y) > 0.92)
            bump('OFF-FRAME', { x: +x.toFixed(1), z: +z.toFixed(1), deg: k * 45, dy: +(foe.y - me.y).toFixed(1), ndc: [+p.x.toFixed(2), +p.y.toFixed(2)] });
        }
      }
    }

    // 4. DECK HEAVE. Standing under an overhang and jumping: does the rig's
    //    idea of the floor jump to the thing over the fighter's head?
    for (const pl of b.platforms) {
      if (!pl.live || pl.ramp) continue;
      const cx = (pl.x0 + pl.x1) / 2, cz = (pl.z0 + pl.z1) / 2;
      const under = b.floorAt(cx, cz, pl.y - 0.1);
      if (pl.y - under < 1.6 || pl.y - under > 4.5) continue;   // not a headroom case
      const cam = new FightCamera(new THREE.PerspectiveCamera(50, 1.6, 0.1, 400), 'follow');
      cam.bounds = b;
      const me = new THREE.Vector3(cx, under, cz);
      const foe = new THREE.Vector3(cx + 3, under, cz);
      settle(cam, me, foe, under);
      const rest = cam.deckY;
      // a 1.9 m jump — roughly the top of a normal jump arc
      me.y = under + 1.9;
      for (let i = 0; i < 30; i++) cam.update(1 / 60, me, foe, null, OPTS(under));
      if (cam.deckY - rest > 0.5)
        bump('DECK-HEAVE', { x: +cx.toFixed(1), z: +cz.toFixed(1), rest: +rest.toFixed(2), jumped: +cam.deckY.toFixed(2), lid: pl.y });
    }

    out.maps.push({
      id, findings: find,
      probes: stats.probes,
      minDist: +stats.minDist.toFixed(2),
      avgDist: +(stats.sumDist / Math.max(1, stats.probes)).toFixed(2)
    });
  }
  return out;
}, { only, STEP });

const tally = {};
for (const m of res.maps) for (const f of m.findings) tally[f.kind] = (tally[f.kind] || 0) + 1;
console.log(JSON.stringify(res, null, 1));
console.error('\n=== camera audit: ' + Object.entries(tally).map(([k, v]) => k + '=' + v).join('  ') + ' ===');
for (const m of res.maps) {
  const by = {};
  for (const f of m.findings) by[f.kind] = (by[f.kind] || 0) + 1;
  console.error('  ' + m.id.padEnd(24) + String(m.probes).padStart(6) + ' probes  min=' + m.minDist + '  avg=' + m.avgDist
    + '   ' + Object.entries(by).map(([k, v]) => k + ':' + v).join(' '));
}
await browser.close();
await server.close();
