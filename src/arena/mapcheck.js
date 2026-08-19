// MAP VALIDATOR — dev only, imported by nothing.
//
// Ten maps' worth of level geometry, and every way one of them ships broken is
// SILENT: nothing throws, nothing warns, and a beauty shot of the offending
// corner looks perfect. The faults only exist under the fighter's feet, which
// means they are only found by playing every square metre of every map — or by
// this.
//
// From the browser console on the dev server:
//     const c = await import('/src/arena/mapcheck.js'); c.report();
//   · `report()`      every map, formatted, worst first
//   · `check(id)`     one map, returns the raw findings
//
// The checks are the five ways a map has actually shipped broken here, plus
// reachability, which is the one that catches everything else:
//
//   UNREACHABLE   a platform with an id that a fighter cannot walk to from any
//                 spawn. Catches a stair that does not meet its landing, a room
//                 with no door, a mezzanine whose only ramp faces a wall.
//   RAMP-ENDS     a ramp whose low end does not meet a floor at its low height
//                 (or high/high). A flight authored high-to-low through a raw
//                 `bounds.ramp` slopes against its own steps and reads as a
//                 staircase that carries you downward.
//   BURIED        a ramp with a platform laid OVER it. The fighter surfaces
//                 through solid floor at the top of the flight.
//   SUNK          a platform below the map's fallback ground with no `pit`
//                 under it. `floorAt` returns groundY, so the room is visible,
//                 lit, furnished and unenterable.
//   WALL-LIP      a wall whose top is level with a floor beside it. The engine
//                 forgives the exact tie now (bounds.LIP_EPS), so this is a
//                 style warning: build to that line and the next edit falls off
//                 the other side of it.
//   PHANTOM       a floor you can SEE with no collider under it. The one fault
//                 the other checks are blind to — they all start from the
//                 colliders, and here the collider is what is missing — and the
//                 one that reads as "I fell through the level".
//   UNCAPPED      a solid block with a flat top and no walkable surface on it:
//                 land on it and you sink into the collider and get shoved off
//                 sideways. Advisory; some blocks are meant to be obstacles.
//   SPAWN         a spawn point inside a wall, or over a hole.
//
// The reachability key is (i, j, HEIGHT BUCKET). Keying on (i, j) alone marks a
// cell visited on whichever level was reached first and hides every stacked
// floor above it — on maps that are three levels deep that is most of the map.
import * as THREE from 'three';
import { MAPS, MAP_IDS, DEFAULT_QUALITY } from './index.js';
import { STEP_UP, LIP_EPS } from './bounds.js';

const STEP = 0.25;          // flood-fill grid, metres
// HEIGHT BUCKET for the visited key. Must be FINE. A 1 m bucket looks generous
// and silently breaks every climb: partway up a ramp the fill reaches a cell
// twice — once at the surface under the flight (the ceil test clips the ramp
// out while the fighter is still below it) and once on the flight itself — and
// on a shallow slope those two heights land in the same 1 m bucket, so the
// second arrival is discarded as already-seen and the climb dead-ends halfway.
// Kyoto's crag read as unreachable for exactly this reason and the map was fine.
const VBUCKET = 0.25;
const RADIUS = 0.36;        // fighter capsule radius, as Bounds.resolveWalls

// Walk the bounds of one map without building its scene: `build()` populates
// `b.bounds` on the way through, so nothing here needs fx, sfx or a renderer.
export function boundsFor(id, quality = DEFAULT_QUALITY) {
  return MAPS[id].build(quality).bounds;
}

// Can a fighter standing at `from` (feet height fy) step to (x, z)?
// Mirrors the fighter's own move-resolve: find the floor under the destination
// no higher than a step up, then let the walls push back and see if the point
// actually moved anywhere.
function stepTo(bd, x, z, fy) {
  if (!bd.contains(x, z, 0.2)) return null;
  const y = bd.floorAt(x, z, fy + STEP_UP);
  if (y > fy + STEP_UP) return null;          // too tall to climb
  const p = new THREE.Vector3(x, y, z);
  bd.resolveWalls(p, RADIUS);
  // resolveWalls shoves the point out of anything it entered; if it moved more
  // than a fraction of the grid step, the destination is inside geometry.
  if (Math.hypot(p.x - x, p.z - z) > STEP * 0.5) return null;
  return y;
}

export function reachable(bd) {
  const seen = new Set();
  const key = (i, j, y) => i + ',' + j + ',' + Math.round(y / VBUCKET);
  const queue = [];
  const seeds = bd.spawns.length ? bd.spawns : [bd.spawnPoint(0, 2), bd.spawnPoint(1, 2)];
  for (const s of seeds) {
    const y = bd.floorAt(s.x, s.z, s.y + STEP_UP);
    const i = Math.round(s.x / STEP), j = Math.round(s.z / STEP);
    const k = key(i, j, y);
    if (!seen.has(k)) { seen.add(k); queue.push([i, j, y]); }
  }
  // hard cap: a 120 x 120 m map at 0.25 m over four levels is ~900k cells, and
  // a runaway is a bug in the check rather than in the map
  const CAP = 4_000_000;
  let n = 0;
  while (queue.length && n < CAP) {
    const [i, j, fy] = queue.pop();
    n++;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      const y = stepTo(bd, ni * STEP, nj * STEP, fy);
      if (y === null) continue;
      const k = key(ni, nj, y);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([ni, nj, y]);
    }
  }
  return { seen, cells: n, key, capped: n >= CAP };
}

// Was any part of this platform walked on?
function touched(bd, p, R) {
  const i0 = Math.ceil(p.x0 / STEP), i1 = Math.floor(p.x1 / STEP);
  const j0 = Math.ceil(p.z0 / STEP), j1 = Math.floor(p.z1 / STEP);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const x = i * STEP, z = j * STEP;
      const y = p.ramp ? rampYOf(p, x, z) : p.y;
      if (R.seen.has(R.key(i, j, y))) return true;
      // the surface actually standing here may be something laid over this
      // platform; a covered platform is not unreachable, it is BURIED, and that
      // is a separate finding
      if (bd.floorAt(x, z, y + STEP_UP) > y + 0.01) return true;
    }
  }
  return false;
}

// Is (x,z) inside a live ramp's footprint? Ramps carry their own collider and
// their terrain rect deliberately does not follow their surface.
function onRamp(bd, x, z) {
  for (const p of bd.platforms) {
    if (!p.live || !p.ramp) continue;
    if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return true;
  }
  return false;
}

function rampYOf(p, x, z) {
  const r = p.ramp;
  const t = r.axis === 'x'
    ? (x - p.x0) / Math.max(1e-4, p.x1 - p.x0)
    : (z - p.z0) / Math.max(1e-4, p.z1 - p.z0);
  return r.yLow + (r.yHigh - r.yLow) * Math.max(0, Math.min(1, t));
}

// Ignoring one platform, what is the highest surface at (x,z) at or below ceil?
function floorExcluding(bd, x, z, ceil, skip) {
  let best = bd.pits.length ? bd.groundAt(x, z) : bd.groundY;
  for (const p of bd.platforms) {
    if (p === skip || !p.live) continue;
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
    const y = p.ramp ? rampYOf(p, x, z) : p.y;
    if (y <= ceil && y > best) best = y;
  }
  return best;
}

export function check(id, quality = DEFAULT_QUALITY) {
  const bd = boundsFor(id, quality);
  const out = [];
  const R = reachable(bd);
  if (R.capped) out.push({ sev: 1, kind: 'CAP', msg: 'flood fill hit its cell cap — result is incomplete' });

  // ---- UNREACHABLE --------------------------------------------------------
  // Only platforms with an id are checked: an id means the map author named the
  // piece, which is the closest thing to "this one is supposed to matter".
  // Unnamed decorative ledges are not worth the false positives.
  const byId = new Map();
  for (const p of bd.platforms) {
    if (!p.id || p.prop) continue;      // a prop top is a surface, not a route
    if (!byId.has(p.id)) byId.set(p.id, []);
    byId.get(p.id).push(p);
  }
  for (const [pid, parts] of byId) {
    if (parts.some(p => touched(bd, p, R))) continue;
    const p = parts[0];
    out.push({
      sev: 0, kind: 'UNREACHABLE', id: pid,
      msg: `platform "${pid}" (y=${p.y.toFixed(2)}, ${fmt(p)}) cannot be walked to from any spawn`
    });
  }

  // ---- RAMP ENDS + BURIED -------------------------------------------------
  for (const p of bd.platforms) {
    if (!p.ramp) continue;
    const r = p.ramp;
    const along = r.axis === 'x' ? [p.x0, p.x1] : [p.z0, p.z1];
    const cross = r.axis === 'x' ? (p.z0 + p.z1) / 2 : (p.x0 + p.x1) / 2;
    const at = (t, off) => r.axis === 'x'
      ? [along[0] + (along[1] - along[0]) * t + off, cross]
      : [cross, along[0] + (along[1] - along[0]) * t + off];

    // BURIED: is something laid over the flight?
    //
    // The ceiling on this query is `y + STEP_UP`, not some generous headroom
    // figure. What makes a buried stair broken is that `floorAt` prefers the
    // slab OVER the tread while the fighter is standing on the tread, and
    // floorAt is asked with the fighter's own step-up reach. A wider ceiling
    // flags every legitimate thing that has floor above it — a service walkway
    // slung under a bridge deck, a stair under a mezzanine — as buried.
    for (const t of [0.1, 0.35, 0.65, 0.9]) {
      const [x, z] = at(t, 0);
      const y = rampYOf(p, x, z);
      const over = floorExcluding(bd, x, z, y + STEP_UP, p);
      if (over > y + 0.12) {
        out.push({
          sev: 0, kind: 'BURIED', id: p.id,
          msg: `ramp ${p.id ? '"' + p.id + '" ' : ''}${fmt(p)} runs UNDER a floor at y=${over.toFixed(2)} ` +
            `(ramp surface y=${y.toFixed(2)} at t=${t}) — use floorHole for the slab it climbs to`
        });
        break;
      }
    }

    // ENDS: 0.8 m past each end, is there ground at that end's height?
    const pad = 0.8;
    for (const [t, want, label] of [[0, r.yLow, 'low'], [1, r.yHigh, 'high']]) {
      const [x, z] = at(t, (t === 0 ? -pad : pad) * Math.sign((along[1] - along[0]) || 1));
      if (!bd.contains(x, z, 0)) continue;      // a flight running off the map edge
      const g = floorExcluding(bd, x, z, want + STEP_UP, p);
      if (Math.abs(g - want) > STEP_UP) {
        out.push({
          sev: 1, kind: 'RAMP-END', id: p.id,
          msg: `ramp ${p.id ? '"' + p.id + '" ' : ''}${fmt(p)} ${label} end wants y=${want.toFixed(2)} ` +
            `but the floor just past it is y=${g.toFixed(2)} — the flight is inverted or does not meet its landing`
        });
      }
    }
  }

  // ---- SUNK ---------------------------------------------------------------
  for (const p of bd.platforms) {
    if (p.y >= bd.groundY - 0.01) continue;
    const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
    if (bd.groundAt(cx, cz) <= p.y + 0.01) continue;
    out.push({
      sev: 0, kind: 'SUNK', id: p.id,
      msg: `platform ${p.id ? '"' + p.id + '" ' : ''}${fmt(p)} sits at y=${p.y.toFixed(2)}, below the ` +
        `fallback ground y=${bd.groundAt(cx, cz).toFixed(2)} — add b.pit() over its footprint`
    });
  }

  // ---- WALL LIP -----------------------------------------------------------
  // A wall whose top is exactly a walkable height beside it. Sampled just
  // outside each of the four faces.
  const seenLip = new Set();
  for (const w of bd.walls) {
    if (!w.live) continue;
    const probes = [
      [(w.x0 + w.x1) / 2, w.z0 - RADIUS - 0.05], [(w.x0 + w.x1) / 2, w.z1 + RADIUS + 0.05],
      [w.x0 - RADIUS - 0.05, (w.z0 + w.z1) / 2], [w.x1 + RADIUS + 0.05, (w.z0 + w.z1) / 2]
    ];
    for (const [x, z] of probes) {
      if (!bd.contains(x, z, 0)) continue;
      // Exact ties only. `LIP_EPS` in resolveWalls now forgives a floor level
      // with a wall top, so this no longer costs the player anything at run
      // time — it stays because a wall built to exactly the height of the deck
      // beside it is still a mistake worth naming, and because the forgiveness
      // is one tie-break wide: anything that drifts a few centimetres off this
      // line lands back in the wall. Widening the window past the tie was
      // tried and is not worth it — the random prop heights (a tree is
      // `rand(1.1, 1.9)` tall) put a handful of trunks within 10 cm of some
      // floor on every build, and a check that cries wolf once a build is a
      // check nobody reads.
      const f = bd.floorAt(x, z, w.y1 + STEP_UP);
      if (Math.abs(f - w.y1) <= 0.005) {
        const k = (w.id || '') + Math.round(w.y1 * 100);
        if (seenLip.has(k)) break;
        seenLip.add(k);
        out.push({
          sev: 2, kind: 'WALL-LIP', id: w.id,
          msg: `wall ${w.id ? '"' + w.id + '" ' : ''}${fmt(w)} tops out at y=${w.y1.toFixed(3)}, exactly the ` +
            `floor beside it — stop it ~0.12 m short; the engine forgives the tie, the next edit may not`
        });
        break;
      }
    }
  }

  // ---- PHANTOM ------------------------------------------------------------
  // A DRAWN FLOOR WITH NOTHING UNDER IT. Every floor the kit lays down also
  // records a terrain rect (kit.floor -> _terrainFor), whether or not it asked
  // for a collider — so a terrain rect sitting well above the surface the
  // collision system actually reports at that spot is a piece of floor you can
  // see, walk onto, and drop straight through. This is the fault that reads as
  // "I fell through the level" rather than as "this room is unreachable", and
  // it is the one thing none of the checks above could see: they all start from
  // the colliders, and the whole failure here is that the collider is missing.
  //
  // Sampled at the centre and a little inside each corner, because a rect can
  // be partly covered — half a mezzanine floor with a collider and half without
  // is a real way to author this wrong, and the centre alone would pass it.
  // The drop has to be worth calling a hole. Anything inside a step-up is a
  // kerb: the fighter walks down it without noticing, and half the maps have
  // pavements drawn 0.22 m proud of the road they meet.
  const PH_TOL = STEP_UP;
  for (const t of bd.terrains) {
    if (!t.live) continue;
    const w = t.x1 - t.x0, d = t.z1 - t.z0;
    if (w < 0.6 || d < 0.6) continue;                 // trim, kerbs, thresholds
    const inx = Math.min(0.4, w * 0.25), inz = Math.min(0.4, d * 0.25);
    const probes = [
      [(t.x0 + t.x1) / 2, (t.z0 + t.z1) / 2],
      [t.x0 + inx, t.z0 + inz], [t.x1 - inx, t.z0 + inz],
      [t.x0 + inx, t.z1 - inz], [t.x1 - inx, t.z1 - inz]
    ];
    let worst = null;
    for (const [x, z] of probes) {
      if (!bd.contains(x, z, 0)) continue;
      // A FLIGHT'S terrain rect is registered at its LOW end over its whole
      // footprint (kit.stairs), so at the top of the flight the rect sits
      // metres under the surface by design. The ramp collider IS the floor
      // there; skip the probe rather than report the stairs on every map.
      if (onRamp(bd, x, z)) continue;
      const f = bd.floorAt(x, z, t.y + STEP_UP);
      if (t.y - f > PH_TOL && (worst === null || f < worst.f)) worst = { f, x, z };
    }
    if (worst) {
      out.push({
        sev: 0, kind: 'PHANTOM', 
        msg: `floor drawn at y=${t.y.toFixed(2)} over ${fmt(t)} has no collider — the surface at ` +
          `(${worst.x.toFixed(1)}, ${worst.z.toFixed(1)}) is y=${worst.f.toFixed(2)}, so a fighter ` +
          `standing on it falls ${(t.y - worst.f).toFixed(2)} m through it`
      });
    }
  }

  // ---- UNCAPPED -----------------------------------------------------------
  // A SOLID BLOCK WITH NO TOP. A wall is a horizontal blocker between two
  // heights and nothing else, so a fighter who lands on one sinks into the band
  // and is shoved out sideways: the object is solid to walk into and thin air
  // to stand on. Nobody notices on a fence or a kerb. On something with a
  // metre-plus footprint and a flat top within landing distance of the floor
  // beside it — a car, a train, a crate stack — it reads as falling through the
  // thing you just landed on, and the fix is a platform at the drawn top with
  // the wall stopped just under it (see `kit.car`).
  //
  // Advisory, not a fault: some blocks are meant to be pure obstacles. It is
  // here so the list is short, known, and deliberate rather than discovered by
  // a player mid-round.
  for (const w of bd.walls) {
    if (!w.live) continue;
    const wx = w.x1 - w.x0, wz = w.z1 - w.z0;
    if (Math.min(wx, wz) < 1.2) continue;              // fences, posts, kerbs
    if (w.y1 - w.y0 < 0.8) continue;                   // kerbs and lips
    const cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2;
    const top = bd.floorAt(cx, cz, w.y1 + STEP_UP);
    if (top > w.y1 - STEP_UP) continue;                // already capped
    const under = bd.floorAt(cx, cz, w.y0 + STEP_UP);
    if (w.y1 - under > 2.4) continue;                  // out of reach: scenery
    out.push({
      sev: 2, kind: 'UNCAPPED', id: w.id,
      msg: `block ${w.id ? '"' + w.id + '" ' : ''}${fmt(w)} is solid from y=${w.y0.toFixed(2)} to ` +
        `y=${w.y1.toFixed(2)} with no walkable top — a fighter who lands on it is pushed off sideways`
    });
  }

  // ---- SPAWNS -------------------------------------------------------------
  bd.spawns.forEach((s, i) => {
    const p = new THREE.Vector3(s.x, bd.floorAt(s.x, s.z, s.y + STEP_UP), s.z);
    const before = p.clone();
    bd.resolveWalls(p, RADIUS);
    if (before.distanceTo(p) > 0.02) {
      out.push({ sev: 0, kind: 'SPAWN', msg: `spawn ${i} at (${s.x}, ${s.z}) is inside a wall` });
    }
  });

  out.sort((a, b) => a.sev - b.sev);
  return { id, findings: out, cells: R.cells, platforms: bd.platforms.length, walls: bd.walls.length };
}

const fmt = r => `[${r.x0.toFixed(1)},${r.z0.toFixed(1)} → ${r.x1.toFixed(1)},${r.z1.toFixed(1)}]`;

export function checkAll(ids = MAP_IDS) {
  return ids.map(id => check(id));
}

export function report(ids = MAP_IDS) {
  let total = 0;
  for (const r of checkAll(ids)) {
    total += r.findings.length;
    const head = `${r.id}  —  ${r.findings.length} finding(s)  ` +
      `(${r.platforms} platforms, ${r.walls} walls, ${r.cells} cells walked)`;
    if (!r.findings.length) { console.log('%c✓ ' + head, 'color:#6ad48a'); continue; }
    console.groupCollapsed('%c✗ ' + head, 'color:#ff8f6a');
    for (const f of r.findings) console.log(`  [${f.kind}] ${f.msg}`);
    console.groupEnd();
  }
  return total + ' finding(s) across ' + ids.length + ' map(s)';
}
