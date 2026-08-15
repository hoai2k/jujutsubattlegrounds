// MAP KIT — the shared vocabulary the seven maps are assembled from.
//
// Every map file is a level-design document written against this API: it
// declares floors, walls, stairs, rooms and props, and the kit handles the
// three things that would otherwise have to be repeated seven times —
//   · REGISTERING COLLISION alongside the geometry, so navigation and art can
//     never drift apart
//   · WIRING DESTRUCTION, including the structural consequences
//   · KEEPING IT AFFORDABLE: instancing for repeated props, merged static
//     geometry, distance culling for detail, and zone culling so an interior
//     does not pay for the exterior it cannot see
//
// Textures are canvas-generated at runtime like the rest of the project — no
// image files anywhere.
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { toonMaterial } from '../art/shaders/toon.js';
import { xrayable } from '../art/shaders/xray.js';
import { Bounds } from './bounds.js';
import { Destructibles } from './destruct.js';
import { classifyMaterial, NATURAL, ARTIFICIAL } from './terrain.js';
import { rand, v3 } from '../core/mathutil.js';

// ---------------------------------------------------------------------------
// canvas textures
// ---------------------------------------------------------------------------
const _texCache = new Map();
function tex(key, size, draw, repeat = [4, 4]) {
  const ck = key + repeat.join(',');
  if (_texCache.has(ck)) return _texCache.get(ck);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  _texCache.set(ck, t);
  return t;
}

export const TEX = {
  // small square station tile with dark grout — the Shibuya read
  tile: (rep) => tex('tile', 256, (g, S) => {
    g.fillStyle = '#1c2028'; g.fillRect(0, 0, S, S);
    const n = 8, s = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 138 + rand(-16, 16);
      g.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
      g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
    }
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(40,44,54,${rand(0.04, 0.16)})`;
      g.fillRect(rand(0, S), rand(0, S), rand(2, 10), rand(2, 10));
    }
  }, rep),
  concrete: (rep) => tex('concrete', 256, (g, S) => {
    g.fillStyle = '#565a63'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) {
      const v = 82 + rand(-22, 30);
      g.fillStyle = `rgba(${v},${v + 2},${v + 7},${rand(0.1, 0.45)})`;
      g.fillRect(rand(0, S), rand(0, S), rand(1, 7), rand(1, 7));
    }
    for (let i = 0; i < 8; i++) {   // form-board seams
      g.strokeStyle = 'rgba(45,47,54,0.35)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, i * S / 8); g.lineTo(S, i * S / 8 + rand(-6, 6)); g.stroke();
    }
  }, rep),
  asphalt: (rep) => tex('asphalt', 256, (g, S) => {
    g.fillStyle = '#24272d'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 1600; i++) {
      const v = 32 + rand(-10, 18);
      g.fillStyle = `rgba(${v},${v + 1},${v + 5},${rand(0.15, 0.5)})`;
      g.fillRect(rand(0, S), rand(0, S), rand(1, 4), rand(1, 4));
    }
  }, rep),
  wood: (rep) => tex('wood', 256, (g, S) => {
    g.fillStyle = '#63472f'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(${70 + rand(0, 40)},${48 + rand(0, 30)},${28 + rand(0, 20)},0.5)`;
      g.lineWidth = rand(1, 4);
      const y = rand(0, S);
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x < S; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
      g.stroke();
    }
    for (let i = 0; i <= 4; i++) {
      g.strokeStyle = 'rgba(40,26,16,0.55)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, i * S / 4); g.lineTo(S, i * S / 4); g.stroke();
    }
  }, rep),
  grass: (rep) => tex('grass', 256, (g, S) => {
    g.fillStyle = '#2f4a31'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2200; i++) {
      const v = rand(0, 1);
      g.fillStyle = `rgba(${32 + v * 26},${58 + v * 32},${30 + v * 20},${rand(0.2, 0.6)})`;
      g.fillRect(rand(0, S), rand(0, S), rand(1, 3), rand(2, 6));
    }
  }, rep),
  poolTile: (rep) => tex('poolTile', 256, (g, S) => {
    g.fillStyle = '#22566f'; g.fillRect(0, 0, S, S);
    const n = 10, s = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = rand(0, 1);
      g.fillStyle = `rgb(${38 + v * 20},${86 + v * 26},${104 + v * 26})`;
      g.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3);
    }
  }, rep),
  rust: (rep) => tex('rust', 256, (g, S) => {
    g.fillStyle = '#3d3a35'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(${58 + rand(0, 38)},${34 + rand(0, 20)},${20 + rand(0, 14)},${rand(0.08, 0.4)})`;
      g.beginPath(); g.arc(rand(0, S), rand(0, S), rand(2, 14), 0, 6.3); g.fill();
    }
    for (let i = 0; i < 500; i++) {
      const v = 38 + rand(-14, 20);
      g.fillStyle = `rgba(${v},${v},${v + 3},${rand(0.1, 0.4)})`;
      g.fillRect(rand(0, S), rand(0, S), rand(1, 6), rand(1, 6));
    }
  }, rep)
};

// A big illuminated building screen — animated by cycling its canvas.
export function screenTexture(hue = 200) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  let f = 0;
  const redraw = () => {
    f++;
    g.fillStyle = `hsl(${hue},60%,${8 + Math.sin(f * 0.05) * 3}%)`;
    g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 14; i++) {
      const y = (i * 11 + f * 1.4) % 140 - 10;
      g.fillStyle = `hsla(${(hue + i * 24) % 360},85%,${52 + (i % 3) * 12}%,${0.35 + (i % 4) * 0.14})`;
      g.fillRect((i * 37 + f * 2) % 256 - 40, y, rand(28, 90), 7);
    }
    g.fillStyle = `hsla(${(hue + 40) % 360},90%,66%,0.9)`;
    g.fillRect(16, 44 + Math.sin(f * 0.09) * 8, 120, 26);
    t.needsUpdate = true;
  };
  redraw();
  return { texture: t, redraw };
}

// ---------------------------------------------------------------------------
// shared materials
// ---------------------------------------------------------------------------
// Every surface a map is built from goes through `xrayable` (art/shaders/xray.js):
// level geometry standing between a camera and the fighter it is following
// dissolves out of the shot instead of blocking it. The roster's materials
// deliberately do NOT get this — see the note in that file.
let _mats = null;
export function surfaces() {
  if (_mats) return _mats;
  const T = (map, o = {}) => xrayable(toonMaterial({ vertexColors: false, color: 0xffffff, map, steps: [54, 118, 214], rim: 0.14, ...o }));
  _mats = {
    tile: T(TEX.tile([6, 6])),
    tileWall: T(TEX.tile([4, 2]), { rim: 0.2 }),
    concrete: T(TEX.concrete([5, 5])),
    concreteWall: T(TEX.concrete([3, 2])),
    asphalt: T(TEX.asphalt([8, 8]), { rim: 0.06 }),
    wood: T(TEX.wood([4, 4]), { rim: 0.18 }),
    grass: T(TEX.grass([10, 10]), { rim: 0.1 }),
    poolTile: T(TEX.poolTile([5, 5]), { rim: 0.3 }),
    rust: T(TEX.rust([4, 4]), { rim: 0.28 }),
    metal: xrayable(toonMaterial({ vertexColors: false, color: 0x6d7684, steps: [44, 104, 196], rim: 0.5, gloss: 0.55 })),
    darkMetal: xrayable(toonMaterial({ vertexColors: false, color: 0x2f343e, steps: [40, 98, 190], rim: 0.42, gloss: 0.4 })),
    paint: xrayable(toonMaterial({ vertexColors: false, color: 0x777e8a, steps: [56, 122, 214], rim: 0.16 })),
    glass: xrayable(toonMaterial({
      vertexColors: false, color: 0x6f98ae, steps: [90, 160, 230], rim: 0.75, gloss: 0.7,
      transparent: true, opacity: 0.34
    })),
    foliage: xrayable(toonMaterial({ vertexColors: false, color: 0x243a28, steps: [48, 108, 198], rim: 0.16 })),
    trunk: xrayable(toonMaterial({ vertexColors: false, color: 0x2b2015, steps: [50, 116, 200], rim: 0.12 })),
    rock: xrayable(toonMaterial({ vertexColors: false, color: 0x474950, steps: [52, 116, 202], rim: 0.16 }))
  };
  return _mats;
}
export function glowMaterial(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false
  });
}
// Lit signage, train windows, strip lights, painted road markings. Cut like
// everything else — a lit sign is as solid a block on the shot as a wall.
const _emissiveCache = new Map();
export function emissive(color) {
  let m = _emissiveCache.get(color);
  if (!m) {
    m = xrayable(new THREE.MeshBasicMaterial({ color, toneMapped: false }));
    _emissiveCache.set(color, m);
  }
  return m;
}

// ---------------------------------------------------------------------------
// MapBuilder
// ---------------------------------------------------------------------------
export class MapBuilder {
  constructor(def) {
    this.def = def;
    this.group = new THREE.Group();
    this.group.name = 'map:' + def.id;
    // `def.terrain` is what the bare ground plane counts as, for anywhere no
    // authored surface covers. Absent = artificial, which is the safe default.
    this.bounds = new Bounds({ ...def.extent, terrain: def.terrain });
    this.mats = surfaces();
    this.zones = [];              // {name, box, objects:[], interior}
    this.detail = [];             // {obj, dist} — culled by distance
    this.lights = [];
    this.tickers = [];            // per-frame callbacks (ambient life)
    this.destructReg = [];        // deferred until the Destructibles exists
    this.instanced = [];
    this._statics = new Map();    // material -> geometry[] awaiting merge
  }

  add(obj) { this.group.add(obj); return obj; }

  // ---- static geometry batching ------------------------------------------
  // Anything that never moves and never breaks goes through here and ends up
  // merged into ONE mesh per material. On a map with a few hundred wall
  // segments that is the difference between 300 draw calls and 6.
  static_(geo, mat, zone) {
    const key = zone ? mat.uuid + '|' + zone : mat.uuid;
    let rec = this._statics.get(key);
    if (!rec) this._statics.set(key, rec = { mat, zone, geos: [] });
    rec.geos.push(geo);
    return geo;
  }
  _flushStatics() {
    for (const [, rec] of this._statics) {
      if (!rec.geos.length) continue;
      const clean = rec.geos.map(g => {
        const n = g.index ? g.toNonIndexed() : g;
        return n;
      });
      let merged;
      try { merged = BufferGeometryUtils.mergeGeometries(clean, false); } catch { merged = null; }
      if (!merged) {
        // falls back to one mesh per geometry — correct, but it silently costs
        // draw calls, so say which batch so it can be fixed rather than hidden
        console.warn('[kit] static batch failed to merge on "' + this.def.id + '" zone=' + rec.zone,
          clean.map((g, i) => i + ':' + Object.keys(g.attributes).sort().join('/')).join('  '));
        for (const g of clean) this.group.add(new THREE.Mesh(g, rec.mat));
        continue;
      }
      const mesh = new THREE.Mesh(merged, rec.mat);
      mesh.name = 'static';
      this.group.add(mesh);
      if (rec.zone) this._zoneAdd(rec.zone, mesh);
    }
    this._statics.clear();
  }

  // ---- zones (interior / exterior culling) --------------------------------
  zone(name, box, interior = true) {
    const z = { name, box, objects: [], interior, active: true };
    this.zones.push(z);
    return z;
  }
  _zoneAdd(name, obj) {
    const z = this.zones.find(z => z.name === name);
    if (z) z.objects.push(obj);
  }

  // ---- floors, walls, stairs ----------------------------------------------
  // TERRAIN. Every floor lays a classified rect down alongside its collider,
  // taken from the material it is drawn with (see ./terrain.js) unless the map
  // overrides it with `{ terrain: 'natural' }`. A decorative surface (walk:
  // false) still classifies — the grass apron round the detention centre is
  // real ground even though nobody fights on it — which is why the terrain call
  // sits outside the `walk` guard.
  floor(x0, z0, x1, z1, y, opts = {}) {
    const mat = opts.mat || this.mats.concrete;
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
    const g = new THREE.BoxGeometry(w, opts.thick ?? 0.3, d);
    g.translate((x0 + x1) / 2, y - (opts.thick ?? 0.3) / 2, (z0 + z1) / 2);
    this._terrainFor(x0, z0, x1, z1, y, mat, opts);
    if (opts.solo) {
      const m = new THREE.Mesh(g, mat);
      this.add(m);
      if (opts.zone) this._zoneAdd(opts.zone, m);
      if (opts.walk !== false) this.bounds.platform(x0, z0, x1, z1, y, { id: opts.id });
      return m;
    }
    this.static_(g, mat, opts.zone);
    if (opts.walk !== false) this.bounds.platform(x0, z0, x1, z1, y, { id: opts.id });
    return null;
  }

  _terrainFor(x0, z0, x1, z1, y, mat, opts) {
    if (opts.terrain === false) return;                 // explicitly untracked
    const kind = opts.terrain || classifyMaterial(this.mats, mat);
    this.bounds.terrain(x0, z0, x1, z1, y, kind);
  }

  // Sink the fallback floor over a rect (see Bounds.pit) — used by the maps
  // that have a room under their ground level.
  pit(x0, z0, x1, z1, y) { this.bounds.pit(x0, z0, x1, z1, y); }

  ceiling(x0, z0, x1, z1, y, opts = {}) {
    const mat = opts.mat || this.mats.concrete;
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), opts.thick ?? 0.35, Math.abs(z1 - z0));
    g.translate((x0 + x1) / 2, y + (opts.thick ?? 0.35) / 2, (z0 + z1) / 2);
    this.static_(g, mat, opts.zone);
  }

  wall(x0, z0, x1, z1, y0, y1, opts = {}) {
    const mat = opts.mat || this.mats.concreteWall;
    const w = Math.max(Math.abs(x1 - x0), opts.thick ?? 0.3);
    const d = Math.max(Math.abs(z1 - z0), opts.thick ?? 0.3);
    const g = new THREE.BoxGeometry(w, y1 - y0, d);
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const hx = w / 2, hz = d / 2;
    if (opts.destructible) {
      // A breakable wall is built as a grid of chunks, because the staged
      // damage has to remove real pieces of it and the destroyed stage has to
      // leave a genuine hole you can walk through.
      const id = opts.id || ('wall' + this.bounds.walls.length);
      this.bounds.wall(cx - hx, cz - hz, cx + hx, cz + hz, y0, y1, { id });
      const grp = new THREE.Group();
      const nx = Math.max(1, Math.round(w / 1.4)), ny = Math.max(1, Math.round((y1 - y0) / 1.3));
      const chunks = [];
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const cw = w / nx, ch = (y1 - y0) / ny;
          const cg = new THREE.BoxGeometry(cw * 0.99, ch * 0.99, d);
          const m = new THREE.Mesh(cg, mat);
          m.position.set(cx - w / 2 + cw * (i + 0.5), y0 + ch * (j + 0.5), cz);
          m.userData.home = m.position.clone();
          m.userData.homeRot = m.rotation.clone();
          grp.add(m);
          chunks.push(m);
        }
      }
      this.add(grp);
      if (opts.zone) this._zoneAdd(opts.zone, grp);
      this.destructReg.push({
        group: grp, chunks, hp: opts.hp ?? 130, kind: opts.kind || 'concrete',
        center: v3(cx, (y0 + y1) / 2, cz), radius: Math.max(hx, hz), height: y1 - y0,
        baseY: y0, colliderIds: [id], glass: opts.kind === 'glass',
        rubble: this._rubblePile(cx, y0, cz, Math.min(hx, 1.6), mat)
      });
      return grp;
    }
    this.static_(g, mat, opts.zone);
    if (opts.collide !== false) this.bounds.wall(cx - hx, cz - hz, cx + hx, cz + hz, y0, y1, { id: opts.id });
    return null;
  }

  _rubblePile(x, y, z, r, mat) {
    const grp = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const s = rand(0.25, 0.6) * r;
      const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.6, s), mat);
      m.position.set(x + rand(-r, r), y + s * 0.3, z + rand(-r, r));
      m.rotation.set(rand(0, 1), rand(0, 6.3), rand(0, 1));
      grp.add(m);
    }
    grp.visible = false;
    this.add(grp);
    return grp;
  }

  // A pillar. Destroying a structural one can drop the floor section above it.
  pillar(x, z, y0, h, r, opts = {}) {
    const mat = opts.mat || this.mats.concrete;
    const id = opts.id || ('pil' + Math.round(x * 10) + '_' + Math.round(z * 10));
    this.bounds.wall(x - r, z - r, x + r, z + r, y0, y0 + h, { id });
    const grp = new THREE.Group();
    const chunks = [];
    const segs = Math.max(2, Math.round(h / 1.4));
    for (let i = 0; i < segs; i++) {
      const sh = h / segs;
      const g = opts.square
        ? new THREE.BoxGeometry(r * 2, sh * 0.98, r * 2)
        : new THREE.CylinderGeometry(r, r * 1.04, sh * 0.98, 12);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, y0 + sh * (i + 0.5), z);
      m.userData.home = m.position.clone();
      m.userData.homeRot = m.rotation.clone();
      grp.add(m);
      chunks.push(m);
    }
    this.add(grp);
    if (opts.zone) this._zoneAdd(opts.zone, grp);
    this.destructReg.push({
      group: grp, chunks, hp: opts.hp ?? 240, kind: 'concrete',
      center: v3(x, y0 + h / 2, z), radius: r * 1.5, height: h, baseY: y0,
      colliderIds: [id], dropPlatformIds: opts.drops || [], dropMeshes: opts.dropMeshes || [],
      debrisScale: 1.4, rubble: this._rubblePile(x, y0, z, r * 1.6, mat)
    });
    return grp;
  }

  // A flight of steps. `(x0,z0)` is the END AT yLow and `(x1,z1)` is the end at
  // yHigh — authoring order is the direction of climb, and a flight authored
  // high-to-low is as legal as one authored low-to-high.
  //
  // Both halves of that used to be broken, and both bugs were invisible in the
  // art and only showed up under the fighter's feet:
  //   · the step COUNT came from the signed rise, so any descending flight got
  //     `max(4, negative)` = four steps, whatever the drop — a 4.6 m staircase
  //     rendered as four 1.15 m blocks.
  //   · the RAMP COLLIDER was registered through `bounds.ramp` with the corners
  //     sorted to min/max, which pins yLow to the minimum coordinate no matter
  //     which way the visible steps run. Every descending flight in the game
  //     therefore had a collider sloping the opposite way to its own geometry:
  //     you walked up the stairs and the floor took you down.
  stairs(x0, z0, x1, z1, yLow, yHigh, axis = 'z', opts = {}) {
    const mat = opts.mat || this.mats.concrete;
    const n = opts.steps ?? Math.max(4, Math.round(Math.abs(yHigh - yLow) / 0.24));
    const along = axis === 'x' ? x1 - x0 : z1 - z0;
    // A flight with no width across the climb draws boxes with a zero-length
    // side (invisible) and registers a zero-area ramp (unwalkable). Both fail
    // silently, which is how two of Shibuya Station's escalators shipped as
    // nothing at all — so say so instead.
    const wide = axis === 'x' ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
    if (wide < 0.4 || Math.abs(along) < 0.4) {
      console.warn('[kit] degenerate stair on "' + this.def.id + '": ' + wide.toFixed(2) +
        ' m across the climb by ' + Math.abs(along).toFixed(2) + ' m along it — no treads, no collider');
    }
    // Each tread is thick enough to reach the tread below it, so the flight is
    // a solid mass of stone with real risers. Fixed-thickness treads left a gap
    // under every step on any flight steeper than 0.22 m a step, which read as
    // a ladder of floating slabs.
    const rise = Math.abs(yHigh - yLow) / n;
    const thick = rise + 0.24;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const y = yLow + (yHigh - yLow) * t1;
      const g = axis === 'x'
        ? new THREE.BoxGeometry(Math.abs(along) / n, thick, Math.abs(z1 - z0))
        : new THREE.BoxGeometry(Math.abs(x1 - x0), thick, Math.abs(along) / n);
      const cx = axis === 'x' ? x0 + along * (t0 + t1) / 2 : (x0 + x1) / 2;
      const cz = axis === 'x' ? (z0 + z1) / 2 : z0 + along * (t0 + t1) / 2;
      g.translate(cx, y - thick / 2, cz);
      this.static_(g, mat, opts.zone);
    }
    // one ramp collider rather than n stair colliders: the fighter walks up
    // smoothly and never catches on a lip. `bounds.ramp` interpolates from its
    // MIN corner to its MAX corner, so when the flight was authored running the
    // other way the two heights swap with it — otherwise the collider slopes
    // against the steps (see the note above).
    const descending = axis === 'x' ? x1 < x0 : z1 < z0;
    this.bounds.ramp(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1),
      descending ? yHigh : yLow, descending ? yLow : yHigh, axis, { id: opts.id });
    // The terrain rect is registered at the LOW end. A single rect at the
    // midpoint would be rejected by the standing-height test while the fighter
    // is at the bottom of a tall flight; at the low end it qualifies the whole
    // way up, and the landing's own rect (which is higher) wins at the top.
    this._terrainFor(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1),
      Math.min(yLow, yHigh), mat, opts);
  }

  // A floor with a rectangular opening in it — a stairwell, a light well, the
  // hole a flight of steps has to come up through. Authored as up to four rects
  // around the hole so the collision has the hole in it too, which a single
  // platform plus a decorative gap would not.
  //
  // This exists because the alternative kept being written by hand and kept
  // being got wrong: a stair whose top lands INSIDE the slab it is climbing to
  // is buried under that slab, and the fighter pops through solid concrete at
  // the top of every flight.
  floorHole(x0, z0, x1, z1, y, hole, opts = {}) {
    const X0 = Math.min(x0, x1), X1 = Math.max(x0, x1);
    const Z0 = Math.min(z0, z1), Z1 = Math.max(z0, z1);
    const hx0 = Math.max(X0, Math.min(hole.x0, hole.x1));
    const hx1 = Math.min(X1, Math.max(hole.x0, hole.x1));
    const hz0 = Math.max(Z0, Math.min(hole.z0, hole.z1));
    const hz1 = Math.min(Z1, Math.max(hole.z0, hole.z1));
    if (hx1 <= hx0 || hz1 <= hz0) return this.floor(X0, Z0, X1, Z1, y, opts);
    const parts = [
      [X0, Z0, X1, hz0],   // south of the hole
      [X0, hz1, X1, Z1],   // north of it
      [X0, hz0, hx0, hz1], // west strip beside it
      [hx1, hz0, X1, hz1]  // east strip beside it
    ];
    // Every part keeps the SAME id: `bounds.byId` holds a list per id, so one
    // `remove(id)` still drops the whole slab when the pillar under it goes.
    for (const [a, b, c, d] of parts) {
      if (c - a < 0.01 || d - b < 0.01) continue;
      this.floor(a, b, c, d, y, opts);
    }
    return null;
  }

  // A SLOPE: a ramp you can see. Same contract as `stairs` — (x0,z0) is the end
  // at yLow — but drawn as a smooth bank rather than treads, for the places
  // where the vertical is terrain and not architecture.
  //
  // Kyoto's plateau, bench and stream banks were all raw `bounds.ramp` calls
  // with no geometry at all: four invisible slopes the fighter walked up
  // through open air. Anything that changes the floor height should draw the
  // floor it changes.
  slope(x0, z0, x1, z1, yLow, yHigh, axis = 'z', opts = {}) {
    const mat = opts.mat || this.mats.rock;
    const segs = opts.segs ?? 24;
    const along = axis === 'x' ? x1 - x0 : z1 - z0;
    const wide = axis === 'x' ? Math.abs(z1 - z0) : Math.abs(x1 - x0);
    const base = Math.min(yLow, yHigh) - (opts.depth ?? 1.2);
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs;
      const y = yLow + (yHigh - yLow) * (t0 + t1) / 2;
      const l = Math.abs(along) / segs;
      const g = axis === 'x'
        ? new THREE.BoxGeometry(l, y - base, wide)
        : new THREE.BoxGeometry(wide, y - base, l);
      const a = (axis === 'x' ? x0 : z0) + along * (t0 + t1) / 2;
      g.translate(
        axis === 'x' ? a : (x0 + x1) / 2,
        (y + base) / 2,
        axis === 'x' ? (z0 + z1) / 2 : a);
      this.static_(g, mat, opts.zone);
    }
    const descending = axis === 'x' ? x1 < x0 : z1 < z0;
    this.bounds.ramp(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1),
      descending ? yHigh : yLow, descending ? yLow : yHigh, axis, { id: opts.id });
    this._terrainFor(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1),
      Math.min(yLow, yHigh), mat, opts);
  }

  // Escalator: stairs plus side panels and a handrail that visibly runs.
  escalator(x0, z0, x1, z1, yLow, yHigh, axis = 'z', opts = {}) {
    this.stairs(x0, z0, x1, z1, yLow, yHigh, axis, { ...opts, mat: this.mats.darkMetal });
    const along = axis === 'x' ? [x0, x1] : [z0, z1];
    const side = axis === 'x' ? [z0, z1] : [x0, x1];
    const rails = [];
    for (const s of side) {
      const pts = [];
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = along[0] + (along[1] - along[0]) * t;
        pts.push(axis === 'x'
          ? new THREE.Vector3(a, yLow + (yHigh - yLow) * t + 1.05, s)
          : new THREE.Vector3(s, yLow + (yHigh - yLow) * t + 1.05, a));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.055, 6, false), this.mats.darkMetal);
      this.add(rail);
      rails.push(rail);
      // SIDE PANEL. Stepped along the slope rather than laid in as one flat
      // slab: a single box centred at the mid height buries its lower half in
      // the ground at the bottom of the flight and floats clear of the treads
      // at the top, with the steps punching straight through it in between.
      const segs = 12;
      const len = Math.abs(along[1] - along[0]) / segs;
      for (let i = 0; i < segs; i++) {
        const t = (i + 0.5) / segs;
        const a = along[0] + (along[1] - along[0]) * t;
        const y = yLow + (yHigh - yLow) * t;
        const pg = new THREE.BoxGeometry(
          axis === 'x' ? len : 0.12, 1.05, axis === 'x' ? 0.12 : len);
        pg.translate(axis === 'x' ? a : s, y + 0.5, axis === 'x' ? s : a);
        this.static_(pg, this.mats.darkMetal, opts.zone);
      }
    }
    return rails;
  }

  railing(x0, z0, x1, z1, y, opts = {}) {
    const mat = opts.mat || this.mats.darkMetal;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(2, Math.round(len / 1.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const g = new THREE.BoxGeometry(0.07, 1.05, 0.07);
      g.translate(x0 + (x1 - x0) * t, y + 0.52, z0 + (z1 - z0) * t);
      this.static_(g, mat, opts.zone);
    }
    for (const h of [1.0, 0.55]) {
      const g = new THREE.BoxGeometry(Math.max(0.06, Math.abs(x1 - x0)), 0.06, Math.max(0.06, Math.abs(z1 - z0)));
      g.translate((x0 + x1) / 2, y + h, (z0 + z1) / 2);
      this.static_(g, mat, opts.zone);
    }
    if (opts.collide !== false) {
      this.bounds.wall(Math.min(x0, x1) - 0.1, Math.min(z0, z1) - 0.1,
        Math.max(x0, x1) + 0.1, Math.max(z0, z1) + 0.1, y, y + 1.05, { id: opts.id });
    }
  }

  // ---- instanced repeated props -------------------------------------------
  // For anything that appears dozens of times and never breaks. One draw call.
  repeat(geo, mat, transforms) {
    if (!transforms.length) return null;
    const inst = new THREE.InstancedMesh(geo, mat, transforms.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
    transforms.forEach((t, i) => {
      e.set(t.rx || 0, t.ry || 0, t.rz || 0);
      q.setFromEuler(e);
      s.set(t.s ?? 1, t.sy ?? t.s ?? 1, t.sz ?? t.s ?? 1);
      m4.compose(new THREE.Vector3(t.x, t.y, t.z), q, s);
      inst.setMatrixAt(i, m4);
    });
    inst.instanceMatrix.needsUpdate = true;
    this.add(inst);
    return inst;
  }

  // ---- props ---------------------------------------------------------------
  // Each returns a group and (when breakable) registers itself. `chunkify`
  // turns any group of meshes into a destructible with the stage machinery.
  breakable(grp, opts) {
    const chunks = [];
    grp.traverse(o => {
      if (!o.isMesh) return;
      o.userData.home = o.position.clone();
      o.userData.homeRot = o.rotation.clone();
      chunks.push(o);
    });
    this.destructReg.push({
      group: grp, chunks, hp: opts.hp ?? 40, kind: opts.kind || 'concrete',
      center: opts.center, radius: opts.radius ?? 0.7, height: opts.height ?? 1.5,
      baseY: opts.baseY ?? 0, colliderIds: opts.colliderIds || [],
      glass: opts.glass, debrisScale: opts.debrisScale ?? 1, onDestroyed: opts.onDestroyed
    });
    return grp;
  }

  vending(x, y, z, ry = 0, hue = 0xd8402c) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.7), this.mats.paint);
    body.material = toonMaterial({ vertexColors: false, color: hue, steps: [70, 150, 255], rim: 0.3 });
    body.position.y = 0.95;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.4), emissive(0xfff0c8));
    face.position.set(0, 1.12, 0.36);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.06), this.mats.darkMetal);
    slot.position.set(0, 0.32, 0.36);
    g.add(body, face, slot);
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.add(g);
    this.bounds.wall(x - 0.5, z - 0.4, x + 0.5, z + 0.4, y, y + 1.9, { id: 'vend' + x + z });
    return this.breakable(g, {
      hp: 55, kind: 'metal', center: v3(x, y + 0.95, z), radius: 0.6, height: 1.9, baseY: y,
      colliderIds: ['vend' + x + z]
    });
  }

  bench(x, y, z, ry = 0, len = 2.2) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(len, 0.09, 0.5), this.mats.wood);
    seat.position.y = 0.46;
    const back = new THREE.Mesh(new THREE.BoxGeometry(len, 0.4, 0.08), this.mats.wood);
    back.position.set(0, 0.72, -0.22);
    g.add(seat, back);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.46, 0.44), this.mats.darkMetal);
      leg.position.set(s * (len / 2 - 0.2), 0.23, 0);
      g.add(leg);
    }
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.add(g);
    return this.breakable(g, { hp: 26, kind: 'wood', center: v3(x, y + 0.5, z), radius: len * 0.5, height: 0.9, baseY: y });
  }

  lockerBank(x, y, z, ry = 0, n = 5) {
    const g = new THREE.Group();
    for (let i = 0; i < n; i++) {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.44, 1.8, 0.45), this.mats.paint);
      d.position.set((i - (n - 1) / 2) * 0.46, 0.9, 0);
      g.add(d);
      const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), this.mats.darkMetal);
      vent.position.set(d.position.x, 1.55, 0.23);
      g.add(vent);
    }
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.add(g);
    const w = n * 0.46 / 2;
    this.bounds.wall(x - w, z - 0.25, x + w, z + 0.25, y, y + 1.8, { id: 'lock' + x + z });
    return this.breakable(g, {
      hp: 60, kind: 'metal', center: v3(x, y + 0.9, z), radius: w, height: 1.8, baseY: y,
      colliderIds: ['lock' + x + z]
    });
  }

  // A window wall — panes that shatter individually and leave the frame.
  windows(x0, z0, x1, z1, y0, y1, opts = {}) {
    const g = new THREE.Group();
    const horiz = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const len = horiz ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
    const n = Math.max(1, Math.round(len / 1.8));
    const chunks = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const px = horiz ? x0 + (x1 - x0) * t : (x0 + x1) / 2;
      const pz = horiz ? (z0 + z1) / 2 : z0 + (z1 - z0) * t;
      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? len / n - 0.14 : 0.06, y1 - y0 - 0.18, horiz ? 0.06 : len / n - 0.14),
        opts.mat || this.mats.glass);
      pane.position.set(px, (y0 + y1) / 2, pz);
      pane.userData.home = pane.position.clone();
      pane.userData.homeRot = pane.rotation.clone();
      g.add(pane);
      chunks.push(pane);
      // mullion (kept: the frame survives the glass)
      const mull = new THREE.Mesh(
        new THREE.BoxGeometry(horiz ? 0.1 : 0.12, y1 - y0, horiz ? 0.12 : 0.1), this.mats.darkMetal);
      mull.position.set(horiz ? x0 + (x1 - x0) * (i / n) : px, (y0 + y1) / 2, horiz ? pz : z0 + (z1 - z0) * (i / n));
      mull.userData.keep = true;
      mull.userData.home = mull.position.clone();
      mull.userData.homeRot = mull.rotation.clone();
      g.add(mull);
    }
    this.add(g);
    if (opts.zone) this._zoneAdd(opts.zone, g);
    const id = opts.id || ('win' + Math.round(x0) + '_' + Math.round(z0));
    if (opts.collide !== false) {
      this.bounds.wall(Math.min(x0, x1) - 0.1, Math.min(z0, z1) - 0.1,
        Math.max(x0, x1) + 0.1, Math.max(z0, z1) + 0.1, y0, y1, { id });
    }
    this.destructReg.push({
      group: g, chunks, hp: opts.hp ?? 24, kind: 'glass', glass: true,
      center: v3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
      radius: len / 2, height: y1 - y0, baseY: y0,
      colliderIds: opts.collide === false ? [] : [id]
    });
    return g;
  }

  sign(x, y, z, w = 3, h = 0.8, color = 0x2f6f4f, ry = 0) {
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08),
      toonMaterial({ vertexColors: false, color, steps: [80, 160, 255], rim: 0.25 }));
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.5), emissive(0xf0f4ff));
    lit.position.z = 0.05;
    g.add(board, lit);
    for (const s of [-1, 1]) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), this.mats.darkMetal);
      rod.position.set(s * w * 0.3, h / 2 + 0.25, 0);
      g.add(rod);
    }
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.add(g);
    return this.breakable(g, { hp: 18, kind: 'metal', center: v3(x, y, z), radius: w / 2, height: h, baseY: y - h });
  }

  bigScreen(x, y, z, w, h, ry = 0, hue = 210) {
    const s = screenTexture(hue);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: s.texture, toneMapped: false }));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    this.add(m);
    let acc = 0;
    this.tickers.push(dt => { acc += dt; if (acc > 0.08) { acc = 0; s.redraw(); } });
    // a faint halo so it throws light into the scene
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, h * 1.5), glowMaterial(0x4f7fd8, 0.16));
    halo.position.set(x, y, z);
    halo.rotation.y = ry;
    halo.position.addScaledVector(v3(Math.sin(ry), 0, Math.cos(ry)), 0.1);
    this.add(halo);
    return m;
  }

  car(x, y, z, ry = 0, color = 0x37507a) {
    const g = new THREE.Group();
    const paint = toonMaterial({ vertexColors: false, color, steps: [64, 140, 255], rim: 0.45, gloss: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 4.3), paint);
    body.position.y = 0.72;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.66, 2.1), paint);
    cabin.position.set(0, 1.38, -0.15);
    const glassM = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.5, 2.0), this.mats.glass);
    glassM.position.set(0, 1.4, -0.15);
    g.add(body, cabin, glassM);
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 10), this.mats.darkMetal);
      w.rotation.z = Math.PI / 2;
      w.position.set(sx * 0.92, 0.36, sz * 1.42);
      g.add(w);
    }
    for (const sx of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.06), emissive(0xffeec0));
      l.position.set(sx * 0.6, 0.82, 2.16);
      g.add(l);
    }
    g.position.set(x, y, z);
    g.rotation.y = ry;
    this.add(g);
    this.bounds.wall(x - 1.1, z - 2.2, x + 1.1, z + 2.2, y, y + 1.6, { id: 'car' + x + z });
    return this.breakable(g, {
      hp: 90, kind: 'metal', center: v3(x, y + 0.8, z), radius: 2.2, height: 1.7, baseY: y,
      colliderIds: ['car' + x + z], debrisScale: 1.3
    });
  }

  tree(x, y, z, scale = 1, opts = {}) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.26 * scale, 3.2 * scale, 7), this.mats.trunk);
    trunk.position.y = 1.6 * scale;
    g.add(trunk);
    const leafMat = opts.leafMat || this.mats.foliage;
    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(rand(0.9, 1.5) * scale, 8, 6), leafMat);
      b.position.set(rand(-0.9, 0.9) * scale, (3.0 + i * 0.62 + rand(-0.3, 0.3)) * scale, rand(-0.9, 0.9) * scale);
      b.scale.y = 0.8;
      g.add(b);
    }
    g.position.set(x, y, z);
    this.add(g);
    this.bounds.wall(x - 0.3 * scale, z - 0.3 * scale, x + 0.3 * scale, z + 0.3 * scale, y, y + 3 * scale, { id: 'tree' + x + z });
    return this.breakable(g, {
      hp: 70, kind: 'foliage', center: v3(x, y + 2 * scale, z), radius: 1.4 * scale, height: 4 * scale, baseY: y,
      colliderIds: ['tree' + x + z]
    });
  }

  rock(x, y, z, scale = 1) {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = rand(0.6, 1.5) * scale;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), this.mats.rock);
      m.position.set(rand(-0.6, 0.6) * scale, s * 0.5 + rand(0, 0.4) * scale, rand(-0.6, 0.6) * scale);
      m.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      g.add(m);
    }
    g.position.set(x, y, z);
    this.add(g);
    this.bounds.wall(x - 1.1 * scale, z - 1.1 * scale, x + 1.1 * scale, z + 1.1 * scale, y, y + 1.6 * scale, { id: 'rock' + x + z });
    this.bounds.platform(x - 0.9 * scale, z - 0.9 * scale, x + 0.9 * scale, z + 0.9 * scale, y + 1.5 * scale);
    // standing on a boulder is standing on stone, whatever is under it
    this.bounds.terrain(x - 0.9 * scale, z - 0.9 * scale, x + 0.9 * scale, z + 0.9 * scale,
      y + 1.5 * scale, NATURAL);
    return g;
  }

  // A strip light that can flicker — the single cheapest way to make a
  // corridor feel like a real place.
  stripLight(x, y, z, len = 2.4, axis = 'x', color = 0xdfeaff, flicker = 0) {
    const m = new THREE.Mesh(
      axis === 'x' ? new THREE.BoxGeometry(len, 0.08, 0.22) : new THREE.BoxGeometry(0.22, 0.08, len),
      emissive(color));
    m.position.set(x, y, z);
    this.add(m);
    const halo = new THREE.Mesh(
      axis === 'x' ? new THREE.PlaneGeometry(len * 1.2, 1.1) : new THREE.PlaneGeometry(1.1, len * 1.2),
      glowMaterial(color, 0.13));
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(x, y - 0.06, z);
    this.add(halo);
    if (flicker > 0) {
      let t = rand(0, 5);
      this.tickers.push(dt => {
        t += dt;
        const on = Math.sin(t * 11) > -0.75 && Math.sin(t * 2.3 + 1) > -0.9;
        m.visible = on || Math.random() > flicker;
        halo.visible = m.visible;
      });
    }
    return m;
  }

  neon(x, y, z, w, h, color, ry = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), emissive(color));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    this.add(m);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, h * 2.6), glowMaterial(color, 0.3));
    halo.position.set(x, y, z);
    halo.rotation.y = ry;
    this.add(halo);
    let t = rand(0, 6);
    this.tickers.push(dt => { t += dt; halo.material.opacity = 0.22 + Math.sin(t * 2.2) * 0.08; });
    return m;
  }

  // Water that reacts: the surface ripples, and combat near it throws splashes.
  water(x0, z0, x1, z1, y, opts = {}) {
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
    const geo = new THREE.PlaneGeometry(w, d, Math.min(40, Math.round(w)), Math.min(40, Math.round(d)));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uT: { value: 0 },
        uShallow: { value: new THREE.Color(opts.shallow ?? 0x5fb4d8) },
        uDeep: { value: new THREE.Color(opts.deep ?? 0x14486e) },
        uHits: { value: Array.from({ length: 8 }, () => new THREE.Vector3()) },
        // caustic cell size in METRES, not UV — a 27 m flooded atrium and a
        // 12 m pool were sharing one frequency, which turned the atrium into a
        // field of dinner-plate white blobs
        uSize: { value: new THREE.Vector2(w, d) },
        uAlpha: { value: opts.opacity ?? 0.84 },
        uCaustic: { value: opts.caustic ?? 0.34 }
      },
      vertexShader: /* glsl */`
        uniform float uT; uniform vec3 uHits[8];
        varying vec2 vUv; varying float vW;
        void main(){
          vUv = uv;
          vec3 p = position;
          float w = sin(p.x*0.9 + uT*1.6)*0.045 + sin(p.y*1.3 - uT*1.1)*0.035;
          // impact ripples: rings expanding from recent hits
          for (int i=0;i<8;i++){
            if (uHits[i].z <= 0.0) continue;
            float d = distance(p.xy, uHits[i].xy);
            w += sin(d*7.0 - uT*11.0) * exp(-d*0.55) * uHits[i].z * 0.5;
          }
          p.z += w;
          vW = w;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uShallow; uniform vec3 uDeep; uniform float uT;
        uniform vec2 uSize; uniform float uAlpha; uniform float uCaustic;
        varying vec2 vUv; varying float vW;
        void main(){
          vec3 c = mix(uDeep, uShallow, clamp(vW*5.0+0.5, 0.0, 1.0));
          // caustics on a fixed ~0.9 m cell whatever the surface measures
          vec2 m = vUv * uSize / 0.9;
          float ca = sin(m.x + uT*1.7) * sin(m.y*0.92 - uT*1.3);
          c += vec3(0.26,0.36,0.42) * uCaustic * smoothstep(0.80, 1.0, ca);
          gl_FragColor = vec4(c, uAlpha);
        }`
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    this.add(mesh);
    let t = 0;
    const hits = mat.uniforms.uHits.value;
    const decay = [];
    this.tickers.push(dt => {
      t += dt;
      mat.uniforms.uT.value = t;
      for (let i = 0; i < hits.length; i++) {
        if (hits[i].z > 0) { hits[i].z = Math.max(0, hits[i].z - dt * 1.4); }
      }
    });
    mesh.userData.splash = (wx, wz, power = 1) => {
      // local space of the plane (rotated -90 about X): x stays, z -> -y
      const lx = wx - mesh.position.x, ly = -(wz - mesh.position.z);
      let slot = 0, best = 1e9;
      for (let i = 0; i < hits.length; i++) if (hits[i].z < best) { best = hits[i].z; slot = i; }
      hits[slot].set(lx, ly, Math.min(1.4, power));
    };
    mesh.userData.isWater = true;
    mesh.userData.rect = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y };
    this.waterMeshes = this.waterMeshes || [];
    this.waterMeshes.push(mesh);
    return mesh;
  }

  // Background silhouette layer giving the horizon depth. `shape` picks the
  // profile: 'tower' is a flat-topped slab (cities), 'ridge' is a peaked
  // outline (mountains and treelines). The first pass drew everything as a
  // rectangle, which on the outdoor maps read as green billboards hanging in
  // the sky rather than as hills.
  skyline(count, radius, opts = {}) {
    const mat = new THREE.MeshBasicMaterial({ color: opts.color ?? 0x141a2c, side: THREE.DoubleSide, fog: false });
    const shape = opts.shape ?? 'tower';
    const geos = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(-0.08, 0.08);
      const r = radius * rand(0.85, 1.25);
      const w = rand(opts.minW ?? 8, opts.maxW ?? 26);
      const h = rand(opts.minH ?? 14, opts.maxH ?? 70);
      let g;
      if (shape === 'ridge') {
        // an irregular peaked profile: a ridgeline, not a wall
        const s = new THREE.Shape();
        s.moveTo(-w / 2, 0);
        s.lineTo(-w * 0.30, h * rand(0.45, 0.75));
        s.lineTo(-w * 0.08, h * rand(0.75, 1.0));
        s.lineTo(w * 0.18, h * rand(0.55, 0.9));
        s.lineTo(w * 0.40, h * rand(0.30, 0.6));
        s.lineTo(w / 2, 0);
        s.closePath();
        g = new THREE.ShapeGeometry(s, 1);
      } else {
        g = new THREE.PlaneGeometry(w, h);
        g.translate(0, h / 2, 0);
      }
      // FACE THE CENTRE. This was `-a + PI/2`, which points each panel along the
      // tangent instead of the radius — so its normal is perpendicular to the
      // radial direction at a = 0, PI/2, PI and 3PI/2, and the four panels at
      // those bearings render exactly edge-on: a one-pixel spike standing on the
      // horizon due north, south, east and west of every map in the set.
      const m = new THREE.Matrix4().makeRotationY(a);
      g.applyMatrix4(m);
      // sink the base so the silhouette rises out of the ground plane instead
      // of hovering just above it
      g.translate(Math.sin(a) * r, (opts.baseY ?? 0) - h * 0.06, Math.cos(a) * r);
      geos.push(g);
    }
    const merged = BufferGeometryUtils.mergeGeometries(geos, false);
    if (!merged) {
      console.warn('[kit] skyline merge failed on "' + this.def.id + '" — mixed shapes',
        geos.map((g, i) => i + ':' + Object.keys(g.attributes).sort().join('/')).join('  '));
      return null;
    }
    const mesh = new THREE.Mesh(merged, mat);
    mesh.frustumCulled = false;
    this.add(mesh);
    return mesh;
  }

  // A huge ground disc under everything. Without it the playable floor simply
  // ends and the background silhouettes read as cut-outs hanging in the sky —
  // which is exactly what the first outdoor pass looked like.
  groundPlane(color, radius = 260, y = -0.15) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 40),
      new THREE.MeshBasicMaterial({ color }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.frustumCulled = false;
    this.add(m);
    return m;
  }

  sky(topColor, midColor, horizonColor, radius = 320) {
    const geo = new THREE.SphereGeometry(radius, 24, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(topColor) },
        uMid: { value: new THREE.Color(midColor) },
        uHorizon: { value: new THREE.Color(horizonColor) }
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon; varying vec3 vP;
        void main(){
          float h = normalize(vP).y;
          vec3 c = mix(uHorizon, uMid, smoothstep(-0.06, 0.26, h));
          c = mix(c, uTop, smoothstep(0.2, 0.8, h));
          gl_FragColor = vec4(c, 1.0);
        }`
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    this.add(m);
    return m;
  }

  // ---- ambient life --------------------------------------------------------
  particles(n, box, opts = {}) {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    const seeds = [];
    for (let i = 0; i < n; i++) {
      p[i * 3] = rand(box.x0, box.x1);
      p[i * 3 + 1] = rand(box.y0, box.y1);
      p[i * 3 + 2] = rand(box.z0, box.z1);
      seeds.push({ vy: opts.vy ? rand(opts.vy[0], opts.vy[1]) : rand(-0.1, 0.1), drift: rand(-0.3, 0.3), ph: rand(0, 6.3) });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      color: opts.color ?? 0xb8c8e8, size: opts.size ?? 0.09, transparent: true,
      opacity: opts.opacity ?? 0.5, depthWrite: false,
      blending: opts.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending
    }));
    pts.frustumCulled = false;
    this.add(pts);
    let t = 0;
    this.tickers.push(dt => {
      t += dt;
      const a = geo.getAttribute('position');
      for (let i = 0; i < n; i++) {
        const s = seeds[i];
        a.array[i * 3 + 1] += s.vy * dt;
        a.array[i * 3] += Math.sin(t * 0.5 + s.ph) * s.drift * dt;
        if (a.array[i * 3 + 1] > box.y1) a.array[i * 3 + 1] = box.y0;
        if (a.array[i * 3 + 1] < box.y0) a.array[i * 3 + 1] = box.y1;
      }
      a.needsUpdate = true;
    });
    return pts;
  }

  // ---- finish --------------------------------------------------------------
  finish(ctx) {
    this._flushStatics();
    const destruct = new Destructibles(this.group, {
      ...ctx, bounds: this.bounds, quality: ctx.quality
    });
    for (const e of this.destructReg) destruct.register(e);
    this.destructReg.length = 0;

    const bounds = this.bounds;
    const zones = this.zones;
    const tickers = this.tickers;
    const detail = this.detail;
    const waters = this.waterMeshes || [];
    const def = this.def;
    const group = this.group;

    let t = 0;
    return {
      id: def.id,
      name: def.name,
      group, bounds, destruct,
      radius: bounds.radius,
      fog: def.fog ? new THREE.Fog(def.fog.color, def.fog.near, def.fog.far) : null,
      background: def.background ?? 0x232948,
      grade: def.grade || null,
      lightRig: def.lights || null,
      previewCam: def.previewCam || null,   // stage-select beauty shot
      shadowScale: def.shadowScale ?? 1,
      // MALEVOLENT SHRINE's radius scale. Deliberately its OWN number rather
      // than reusing shadowScale: the two open domains want different things
      // from a map. Megumi's sea of shadow scales with how much open ground
      // there is; Sukuna's shrine scales with how much room there is to RUN,
      // which is not the same question on a map with interiors to break line
      // of sight in. Falls back to the shadow scale, then to 1, so a map that
      // never declares one still gets a sane radius.
      shrineScale: def.shrineScale ?? def.shadowScale ?? 1,
      spawnPoint: (i, n) => bounds.spawnPoint(i, n),
      // combat reports impacts near water so the pool reacts
      splash(x, z, power) {
        for (const w of waters) {
          const r = w.userData.rect;
          if (x > r.x0 - 1 && x < r.x1 + 1 && z > r.z0 - 1 && z < r.z1 + 1) w.userData.splash(x, z, power);
        }
      },
      // TERRAIN: what the surface under (x,z,y) is. Static only — a Root Field
      // laid over concrete is a COMBAT effect and lives in combat/flora.js, so
      // the map never has to know that Hanami exists.
      terrainAt(x, z, y) { return bounds.terrainAt(x, z, y); },
      waterAt(x, z) {
        for (const w of waters) {
          const r = w.userData.rect;
          if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) return r.y;
        }
        return null;
      },
      update(dt, camera) {
        t += dt;
        for (const fn of tickers) fn(dt);
        destruct.update(dt);
        // ZONE CULLING: an interior does not pay for the exterior and vice
        // versa. A zone is active when any camera is inside it or near it.
        if (camera) {
          const p = camera.position;
          for (const z of zones) {
            const b = z.box;
            const inside = p.x > b.x0 - 8 && p.x < b.x1 + 8 && p.z > b.z0 - 8 && p.z < b.z1 + 8
              && p.y > b.y0 - 6 && p.y < b.y1 + 10;
            const want = z.interior ? inside : !inside || true;
            if (want !== z.active) {
              z.active = want;
              for (const o of z.objects) o.visible = want;
            }
          }
          // DETAIL LOD: small props switch off past their range
          for (const d of detail) {
            const vis = p.distanceToSquared(d.pos) < d.dist * d.dist;
            if (vis !== d.obj.visible) d.obj.visible = vis;
          }
        }
      },
      dispose() {
        group.traverse(o => {
          if (o.isMesh || o.isPoints) {
            o.geometry?.dispose?.();
          }
        });
      }
    };
  }
}
