// Navigation for maps that are not a flat disc.
//
// The original arena was a circle with a radius, and every system that touched
// the floor assumed it: the fighter clamped to `arenaRadius`, the shadow spread
// assumed open ground, the camera never had to worry about a wall being in the
// way. Seven multi-level maps with interiors need an actual spatial model, so
// this is it — deliberately small and axis-aligned, because a fighting game
// needs collision that is predictable far more than it needs collision that is
// clever.
//
// Three primitives:
//   PLATFORM  a walkable top surface (an AABB footprint at a height). Floors,
//             mezzanines, rooftops, tabletops.
//   RAMP      a platform whose height interpolates along one axis. Stairs,
//             escalators, slopes.
//   WALL      a solid AABB that blocks horizontal movement between y0 and y1.
//
// Everything is indexed into a uniform grid so a lookup touches a handful of
// candidates rather than the whole map. Destroying a structural piece calls
// `remove(id)`, which is what makes "a broken wall opens a new route" real
// rather than cosmetic.
import * as THREE from 'three';
import { ARTIFICIAL } from './terrain.js';

const CELL = 5;                 // spatial hash cell size, metres
export const STEP_UP = 0.55;    // how high a fighter can walk up without jumping

export class Bounds {
  constructor({ minX = -20, maxX = 20, minZ = -20, maxZ = 20, groundY = 0, terrain = ARTIFICIAL } = {}) {
    this.minX = minX; this.maxX = maxX;
    this.minZ = minZ; this.maxZ = maxZ;
    this.groundY = groundY;
    this.platforms = [];
    this.walls = [];
    this.byId = new Map();
    this._pGrid = new Map();
    this._wGrid = new Map();
    this.spawns = [];
    // TERRAIN (see ./terrain.js). A fourth primitive alongside platform / ramp
    // / wall: a flat rect that says what the surface at that height IS. It is
    // deliberately separate from `platforms` because the two do not always
    // coincide — a stepping stone is a platform with no terrain of its own, and
    // a decorative grass apron is terrain nobody can walk on.
    this.terrains = [];
    this._tGrid = new Map();
    // PITS. `groundY` is one number for the whole map, which is fine until a
    // map has a room BELOW it: a sunken plaza, a pool hall under a gym. Without
    // this the ground plane pages straight over the top of that room and the
    // fighter stands on thin air at groundY where the floor should be four
    // metres down, so the room can be seen and never entered. A pit lowers the
    // fallback floor over one rect only.
    this.pits = [];
    // what the bare ground plane is, for anywhere no rect covers
    this.groundTerrain = terrain;
    // legacy: several systems still ask an arena for "a radius". Give them the
    // inscribed one so anything that still thinks in circles stays inside.
    this.radius = Math.min(maxX - minX, maxZ - minZ) / 2;
  }

  _key(cx, cz) { return cx * 73856093 ^ cz * 19349663; }
  _insert(grid, item) {
    const c0x = Math.floor(item.x0 / CELL), c1x = Math.floor(item.x1 / CELL);
    const c0z = Math.floor(item.z0 / CELL), c1z = Math.floor(item.z1 / CELL);
    for (let cx = c0x; cx <= c1x; cx++) {
      for (let cz = c0z; cz <= c1z; cz++) {
        const k = this._key(cx, cz);
        let list = grid.get(k);
        if (!list) grid.set(k, list = []);
        list.push(item);
      }
    }
  }
  _query(grid, x, z) {
    return grid.get(this._key(Math.floor(x / CELL), Math.floor(z / CELL))) || EMPTY;
  }

  // ---- authoring ----------------------------------------------------------
  platform(x0, z0, x1, z1, y, opts = {}) {
    const p = {
      x0: Math.min(x0, x1), x1: Math.max(x0, x1),
      z0: Math.min(z0, z1), z1: Math.max(z0, z1),
      y, id: opts.id, ramp: null, live: true
    };
    this.platforms.push(p);
    this._insert(this._pGrid, p);
    if (p.id) this._reg(p.id, p);
    return p;
  }
  // axis: 'x' or 'z' — the direction height runs along
  ramp(x0, z0, x1, z1, yLow, yHigh, axis = 'z', opts = {}) {
    const p = this.platform(x0, z0, x1, z1, yLow, opts);
    p.ramp = { axis, yLow, yHigh };
    return p;
  }
  // A classified surface. `kind` is 'natural' | 'artificial'. Rects may overlap
  // freely — the query takes the highest one at or below the asking height, so
  // a mezzanine laid over a plaza answers for the mezzanine.
  terrain(x0, z0, x1, z1, y, kind) {
    const t = {
      x0: Math.min(x0, x1), x1: Math.max(x0, x1),
      z0: Math.min(z0, z1), z1: Math.max(z0, z1),
      y, kind, live: true
    };
    this.terrains.push(t);
    this._insert(this._tGrid, t);
    return t;
  }

  // What the fighter at (x,z,y) is standing on. `y` is their feet; anything
  // above them is ignored so a walkway overhead cannot claim the floor below.
  terrainAt(x, z, y = Infinity) {
    let best = this.groundTerrain, bestY = -Infinity;
    for (const t of this._query(this._tGrid, x, z)) {
      if (!t.live) continue;
      if (x < t.x0 || x > t.x1 || z < t.z0 || z > t.z1) continue;
      if (t.y > y + STEP_UP) continue;
      if (t.y > bestY) { bestY = t.y; best = t.kind; }
    }
    return best;
  }

  // Lower the fallback floor over one rect. Pits may overlap; the LOWEST one
  // covering a point wins, so a pool basin inside a pool hall reads as the
  // basin.
  pit(x0, z0, x1, z1, y) {
    this.pits.push({
      x0: Math.min(x0, x1), x1: Math.max(x0, x1),
      z0: Math.min(z0, z1), z1: Math.max(z0, z1), y
    });
  }
  groundAt(x, z) {
    let y = this.groundY;
    for (const p of this.pits) {
      if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
      if (p.y < y) y = p.y;
    }
    return y;
  }

  wall(x0, z0, x1, z1, y0, y1, opts = {}) {
    const w = {
      x0: Math.min(x0, x1), x1: Math.max(x0, x1),
      z0: Math.min(z0, z1), z1: Math.max(z0, z1),
      y0, y1, id: opts.id, live: true
    };
    this.walls.push(w);
    this._insert(this._wGrid, w);
    if (w.id) this._reg(w.id, w);
    return w;
  }
  _reg(id, item) {
    let list = this.byId.get(id);
    if (!list) this.byId.set(id, list = []);
    list.push(item);
  }

  // A structural piece was destroyed. Its colliders go dead — the wall you
  // just blew through is now a route, and the floor a collapsed pillar was
  // holding up can be dropped by removing that platform too.
  remove(id) {
    const list = this.byId.get(id);
    if (!list) return false;
    for (const item of list) item.live = false;
    return true;
  }
  restore(id) {
    const list = this.byId.get(id);
    if (!list) return false;
    for (const item of list) item.live = true;
    return true;
  }

  // ---- queries ------------------------------------------------------------
  // Highest walkable surface at (x,z) that is at or below `ceil`. Returns the
  // map's ground plane when nothing else qualifies, so a fighter can never
  // fall out of the world.
  floorAt(x, z, ceil = Infinity) {
    let best = this.pits.length ? this.groundAt(x, z) : this.groundY;
    for (const p of this._query(this._pGrid, x, z)) {
      if (!p.live) continue;
      if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
      const y = p.ramp ? rampY(p, x, z) : p.y;
      if (y <= ceil && y > best) best = y;
    }
    return best;
  }

  // Which platform (if any) the point is standing on — used by the maps to
  // decide interior vs exterior for culling.
  platformAt(x, z, y) {
    let best = null, bestY = -Infinity;
    for (const p of this._query(this._pGrid, x, z)) {
      if (!p.live || !p.id) continue;
      if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue;
      const py = p.ramp ? rampY(p, x, z) : p.y;
      if (py <= y + STEP_UP && py > bestY) { bestY = py; best = p; }
    }
    return best;
  }

  // Push a point out of any wall it has entered, along the shallowest axis.
  // Called after movement rather than before it, which keeps the fighter's
  // own velocity integration untouched.
  resolveWalls(pos, radius = 0.36) {
    const y = pos.y;
    for (const w of this._query(this._wGrid, pos.x, pos.z)) {
      if (!w.live) continue;
      if (y + 1.55 < w.y0 || y > w.y1) continue;      // over it, or under it
      const px = w.x0 - radius, qx = w.x1 + radius;
      const pz = w.z0 - radius, qz = w.z1 + radius;
      if (pos.x <= px || pos.x >= qx || pos.z <= pz || pos.z >= qz) continue;
      // shallowest escape wins
      const dxL = pos.x - px, dxR = qx - pos.x;
      const dzL = pos.z - pz, dzR = qz - pos.z;
      const m = Math.min(dxL, dxR, dzL, dzR);
      if (m === dxL) pos.x = px;
      else if (m === dxR) pos.x = qx;
      else if (m === dzL) pos.z = pz;
      else pos.z = qz;
    }
  }

  clampXZ(pos, pad = 0.3) {
    pos.x = Math.max(this.minX + pad, Math.min(this.maxX - pad, pos.x));
    pos.z = Math.max(this.minZ + pad, Math.min(this.maxZ - pad, pos.z));
    return pos;
  }

  contains(x, z, pad = 0) {
    return x > this.minX + pad && x < this.maxX - pad && z > this.minZ + pad && z < this.maxZ - pad;
  }

  // Camera collision: walk the segment and report the first fraction at which
  // it enters a wall. Coarse on purpose — a stepped march is plenty for
  // pulling a chase camera in, and it costs nothing.
  raySweep(from, to, steps = 14) {
    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t, y = from.y + dy * t, z = from.z + dz * t;
      for (const w of this._query(this._wGrid, x, z)) {
        if (!w.live) continue;
        if (y < w.y0 || y > w.y1) continue;
        if (x > w.x0 && x < w.x1 && z > w.z0 && z < w.z1) return Math.max(0.12, (i - 1) / steps);
      }
      if (!this.contains(x, z, -1.5)) return Math.max(0.12, (i - 1) / steps);
    }
    return 1;
  }

  // Spawn points: authored per map, with a ring fallback so a map that forgets
  // to declare them still works.
  spawnPoint(i, n) {
    if (this.spawns.length >= n) return this.spawns[i % this.spawns.length].clone();
    const cx = (this.minX + this.maxX) / 2, cz = (this.minZ + this.maxZ) / 2;
    if (n <= 2) return new THREE.Vector3(cx + (i === 0 ? -2.6 : 2.6), this.groundY, cz);
    const a = (i / n) * Math.PI * 2;
    const r = n === 3 ? 3.4 : 3.8;
    return new THREE.Vector3(cx + Math.sin(a) * r, this.groundY, cz + Math.cos(a) * r);
  }
}

const EMPTY = [];

function rampY(p, x, z) {
  const r = p.ramp;
  const t = r.axis === 'x'
    ? (x - p.x0) / Math.max(1e-4, p.x1 - p.x0)
    : (z - p.z0) / Math.max(1e-4, p.z1 - p.z0);
  return r.yLow + (r.yHigh - r.yLow) * Math.max(0, Math.min(1, t));
}
