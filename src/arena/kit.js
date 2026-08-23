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
import { xrayable, xrayAll } from '../art/shaders/xray.js';
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

// ---------------------------------------------------------------------------
// SOFT GLOW — a radial falloff instead of a hard edge.
// ---------------------------------------------------------------------------
// `glowMaterial` above is an UNTEXTURED additive quad, and that is right for
// what it was written for: a wet-asphalt sheen, a pool of light on a floor, a
// sheet laid flat over a surface it is the same shape as. It is exactly wrong
// for anything meant to read as a POINT of light — a bulb's halo, a puff of
// steam, a spark — because a flat quad with a hard edge is a visible square,
// and a lamp in a dark room drawn that way is a glowing box hanging in the air.
// It is the single most visible thing in a beauty shot of the sewer, which is
// where it was found.
//
// Same additive blend, same no-depth-write; the only difference is that the
// alpha falls off to nothing at the rim, which is what a glow is.
let _softTex = null;
function softGlowTexture() {
  if (_softTex) return _softTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 1, 64, 64, 63);
  grd.addColorStop(0.00, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,255,255,0.62)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.16)');
  grd.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  _softTex = new THREE.CanvasTexture(c);
  return _softTex;
}
export function haloMaterial(color, opacity = 1, additive = true) {
  return new THREE.MeshBasicMaterial({
    map: softGlowTexture(), color, transparent: true, opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false, fog: false, toneMapped: false
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

// A ticker that fires once, `delay` seconds from now, and then does nothing.
// Used by the showpiece section to push a consequence onto a later frame rather
// than recursing into the system that is currently running (see `drum`).
function oneShot(delay, fn) {
  let t = 0, done = false;
  return dt => {
    if (done) return;
    t += dt;
    if (t >= delay) { done = true; fn(); }
  };
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
    // ---- COLLAPSIBLE FLOORS ------------------------------------------------
    // A floor that a destructible can DROP has to be drawable on its own, or
    // the collapse takes the collider away and leaves the slab hanging there in
    // full view: the fighter falls through a roof that is still drawn. Every
    // `drops: [id]` in the maps shipped that way, because a floor goes into the
    // merged static batch where nothing can hide it again.
    //
    // So floors with an id are held back here instead of being merged on the
    // spot. `finish()` knows by then which ids something drops, draws exactly
    // those as their own meshes, and hands them to the destructible as
    // `dropMeshes` — the field the collapse path has always read and nobody
    // ever filled. Everything else still merges.
    this._idFloors = [];          // {id, geo, mat, zone} awaiting the verdict
    this.meshById = new Map();    // id -> [Mesh] drawn solo for exactly this
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
      if (opts.id) this._regMesh(opts.id, m);
      if (opts.walk !== false) this.bounds.platform(x0, z0, x1, z1, y, { id: opts.id });
      return m;
    }
    // A NAMED floor is held back until finish() knows whether anything drops
    // it (see `_idFloors`); an anonymous one can never be dropped and merges
    // straight away.
    if (opts.id) this._idFloors.push({ id: opts.id, geo: g, mat, zone: opts.zone });
    else this.static_(g, mat, opts.zone);
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

  // ---- BANK FACE ----------------------------------------------------------
  // The visible face under a raised deck: a cliff, a retaining wall, the rock
  // skirt round a plateau. It is drawn PROUD of the deck it edges, so the deck
  // does not z-fight with its own edge — and that overhang is the fault this
  // helper exists to stop. Drawn as bare geometry it left a rim you can see and
  // stand on with nothing under it: walk to the edge of Kyoto's grass bench and
  // you drop 3.6 m through the lip you were standing on. Every raised deck in
  // the set was edged that way.
  //
  // So a face is three things at once, and none of them is optional:
  //   · the geometry, drawn from `base` up to `top`
  //   · a BLOCKER, so the cliff cannot be walked into from below (pass
  //     `collide: false` for a face that is meant to be pure decoration —
  //     a low kerb, a skirt inside a room)
  //   · a LIP at `top`, carrying the deck out to the drawn edge
  // The blocker stops 0.12 m under the lip for the usual reason: a wall topping
  // out level with the floor beside it collides with anyone standing there.
  bankFace(x0, z0, x1, z1, top, base = 0, opts = {}) {
    this.wall(x0, z0, x1, z1, base, opts.collide === false ? top : top - 0.12,
      { ...opts, collide: opts.collide });
    // The lip has to match what was DRAWN, and `wall` fattens a degenerate rect
    // (a face authored as a line) out to `thick` — so the same expansion is
    // applied here or the lip is a zero-area rect over a 0.5 m ledge.
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const hx = Math.max(Math.abs(x1 - x0), opts.thick ?? 0.3) / 2;
    const hz = Math.max(Math.abs(z1 - z0), opts.thick ?? 0.3) / 2;
    this.bounds.platform(cx - hx, cz - hz, cx + hx, cz + hz, top, { id: opts.id, prop: true });
  }

  // ---- LIP -----------------------------------------------------------------
  // A WALKABLE TOP ON SOMETHING THAT WAS ONLY EVER DRAWN.
  //
  // `bankFace` handles the common case — a face drawn proud of the deck it
  // edges — by drawing it, blocking it and lipping it in one call. This is the
  // other half of the same idea for everything that is NOT a face: a deep eave
  // overhanging a roof deck, the stone cheek beside a flight of steps, the
  // strip of abutment left proud of a bridge bank. Each is a piece of surface
  // you can see and land on, and each was a piece of surface you fell through,
  // because nothing about drawing a box registers anything.
  //
  // It is a platform and NOTHING else: no blocker, so it cannot narrow the
  // route beside it, and `prop: true`, so the validator's reachability pass
  // treats it as a surface rather than as a route somebody forgot to connect.
  // The whole fix for a rim is that landing on it lands on it.
  lip(x0, z0, x1, z1, y, opts = {}) {
    this.bounds.platform(Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1),
      y, { id: opts.id, prop: opts.prop !== false });
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
    // A CAR YOU CAN STAND ON. It used to be one 1.6 m wall and nothing else,
    // so a fighter who landed on the roof sank into the band and was squirted
    // out sideways — the body is solid to walk into and was thin air to land
    // on. Now it collides the way it is drawn: the bonnet and boot are a floor
    // at their own height, the cabin is a low block standing on it, and both
    // carry the car's id so destroying it takes the whole lot with it. The
    // wall under the deck stops 0.06 m short of it for the usual reason — a
    // wall topping out level with a floor collides with anyone standing there.
    const cid = 'car' + x + z;
    // THE COLLIDER TURNS WITH THE CAR. It did not, and `ry` is not a decoration
    // on this helper — half the cars in the set are parked along a kerb at
    // ry = PI/2, and at that angle the drawn car is 4.3 m along X by 1.9 along
    // Z while the box registered for it was 2.2 by 4.4. Both ends of every
    // sideways-parked car were a metre of visible bodywork with nothing under
    // it (land on the bonnet, fall through to the road), and both sides were a
    // metre of solid nothing you walked into.
    //
    // `Bounds` is axis-aligned by design — a fighting game wants collision that
    // is predictable far more than it wants collision that is clever — so this
    // is the rotated box's AABB rather than a true OBB. At an angle that makes
    // the collider slightly generous, which is the right way round to be wrong:
    // the whole drawn top is standable and nothing hangs over an edge.
    const ca = Math.abs(Math.cos(ry)), sa = Math.abs(Math.sin(ry));
    const aabb = (hx, hz) => [ca * hx + sa * hz, sa * hx + ca * hz];
    const [bx, bz] = aabb(1.1, 2.2);        // body
    const [kx, kz] = aabb(0.86, 1.2);       // cabin
    this.bounds.wall(x - bx, z - bz, x + bx, z + bz, y, y + 1.02, { id: cid });
    this.bounds.platform(x - bx, z - bz, x + bx, z + bz, y + 1.08, { id: cid, prop: true });
    this.bounds.wall(x - kx, z - kz, x + kx, z + kz, y + 1.08, y + 1.71, { id: cid });
    return this.breakable(g, {
      hp: 90, kind: 'metal', center: v3(x, y + 0.8, z), radius: 2.2, height: 1.7, baseY: y,
      colliderIds: [cid], debrisScale: 1.3
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
    // THE DECK GOES WHERE THE STONE ACTUALLY ENDS. The four blobs are sized and
    // stacked at random, so the drawn summit is wherever the tallest of them
    // happens to reach — and the deck used to be pinned to a nominal
    // 1.5 * scale regardless, which on any boulder that rolled high left a cap
    // of visible rock standing over its own walkable top. Measured, not assumed.
    let top = 1.2 * scale;
    for (let i = 0; i < 4; i++) {
      const s = rand(0.6, 1.5) * scale;
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), this.mats.rock);
      m.position.set(rand(-0.6, 0.6) * scale, s * 0.5 + rand(0, 0.4) * scale, rand(-0.6, 0.6) * scale);
      m.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      g.add(m);
      top = Math.max(top, m.position.y + s);
    }
    g.position.set(x, y, z);
    this.add(g);
    // THE BLOCKER STOPS UNDER THE TOP. It used to run 0.1 m HIGHER than the
    // deck laid on it, so a fighter standing on the boulder was standing inside
    // the wall band and got shoved off the rock they had just climbed.
    this.bounds.wall(x - 1.1 * scale, z - 1.1 * scale, x + 1.1 * scale, z + 1.1 * scale,
      y, y + top - 0.12, { id: 'rock' + x + z });
    this.bounds.platform(x - 1.1 * scale, z - 1.1 * scale, x + 1.1 * scale, z + 1.1 * scale,
      y + top, { id: 'rock' + x + z, prop: true });
    // standing on a boulder is standing on stone, whatever is under it
    this.bounds.terrain(x - 1.1 * scale, z - 1.1 * scale, x + 1.1 * scale, z + 1.1 * scale,
      y + top, NATURAL);
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
        uCaustic: { value: opts.caustic ?? 0.34 },
        // THE GRAZING COLOUR. Water read from a low angle is mostly what is
        // reflected in it, not what is under it — which is exactly the angle a
        // fight camera reads it from, and exactly where this surface used to
        // fail: flat, dark and the same value as the grass beside it, so a
        // fighter standing knee-deep in Kyoto's river looked like a fighter
        // sunk into the lawn. Derived from `shallow` so every pool keeps its
        // own identity (a sewer channel must not sprout a blue sky), or set
        // outright with `opts.sky`.
        uSky: { value: opts.sky != null ? new THREE.Color(opts.sky)
          : new THREE.Color(opts.shallow ?? 0x5fb4d8).lerp(new THREE.Color(0xffffff), 0.55) }
      },
      vertexShader: /* glsl */`
        uniform float uT; uniform vec3 uHits[8];
        varying vec2 vUv; varying float vW; varying vec3 vWP;
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
          vWP = (modelMatrix * vec4(p,1.0)).xyz;
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uSky; uniform float uT;
        uniform vec2 uSize; uniform float uAlpha; uniform float uCaustic;
        varying vec2 vUv; varying float vW; varying vec3 vWP;
        void main(){
          vec3 c = mix(uDeep, uShallow, clamp(vW*5.0+0.5, 0.0, 1.0));
          // caustics on a fixed ~0.9 m cell whatever the surface measures
          vec2 m = vUv * uSize / 0.9;
          float ca = sin(m.x + uT*1.7) * sin(m.y*0.92 - uT*1.3);
          c += vec3(0.26,0.36,0.42) * uCaustic * smoothstep(0.80, 1.0, ca);
          // FRESNEL. Look straight down and you see through it; look ALONG it
          // and you see the sky sitting on it. Without this the surface has one
          // colour from every angle, and the angle a fight is watched from is
          // the shallow one — which is where a river stopped looking like a
          // river and started looking like ground with a fighter buried in it.
          vec3 V = normalize(cameraPosition - vWP);
          float fres = pow(1.0 - clamp(abs(V.y), 0.0, 1.0), 3.0);
          c = mix(c, uSky, fres * 0.86);
          // and it turns from a window into a sheet as it goes, the way water
          // does: the legs under it read from above, the shine reads from the side
          float a = mix(uAlpha, min(0.94, uAlpha + 0.30), fres);
          gl_FragColor = vec4(c, a);
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
  // THE FAR FIELD: one flat disc under the whole map, so the world does not end
  // at the edge of the level in a cliff of sky.
  //
  // ITS HEIGHT IS THE WHOLE PROBLEM. It defaulted to y = -0.15 — a hand's
  // breadth under the ground — which is fine on a level that is flat and a
  // catastrophe on one that digs. Kyoto's river bed is at -1.60 and its banks
  // at -0.96, so the middle of the map sat UNDER a 300 m opaque green disc: a
  // fighter in the trench was behind it, the x-ray punched a dithered hole in
  // it to keep him visible, and the whole thing read exactly like standing
  // inside the lawn. Sendai's pool hall, Shinjuku's sunken plaza, the tomb and
  // the bridge's river were all under their own.
  //
  // So an auto-placed plane is DEFERRED to finish(), which is the first moment
  // the map's lowest floor is known — the pits and the basements are declared
  // long after the sky is. A map that passes its own `y` is left alone.
  groundPlane(color, radius = 260, y = null) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 40),
      new THREE.MeshBasicMaterial({ color }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y ?? -0.15;
    m.frustumCulled = false;
    this.add(m);
    if (y == null) (this._autoGround = this._autoGround || []).push(m);
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

  // =========================================================================
  // SHOWPIECE — the layer that makes a map read as a PLACE rather than as a
  // correct piece of level geometry.
  // =========================================================================
  // Everything above this line is structure: floors, walls, stairs, the things
  // a fighter stands on and the things that break. The maps were all correct
  // and all a bit inert, because the only atmosphere vocabulary they had was
  // `stripLight`, `neon` and a particle box — so every one of them reached for
  // the same three and they all ended up looking like the same place lit
  // differently.
  //
  // These are the additions. Two rules hold across the whole section and they
  // are the reason it can be used freely:
  //
  //   1. A SHOWPIECE EITHER CARRIES NO COLLISION AT ALL, OR IT CARRIES THE
  //      EXACT PATTERN THE VALIDATOR ASKS FOR. Anything purely visual (a light
  //      shaft, a banner, a cable, drifting mist) registers nothing: it cannot
  //      trap a fighter because there is nothing there. Anything solid enough
  //      to stand on (`crates`, `drum`) registers a blocker that
  //      stops 0.12 m UNDER a walkable top at the height it is drawn, which is
  //      the pattern `kit.car` and `kit.rock` already use and the one that
  //      keeps UNCAPPED, WALL-LIP and PHANTOM out of `mapcheck.report()`.
  //   2. ANIMATION IS FREE WHEN IT IS OFF SCREEN. Every ticker here bails on an
  //      invisible object, and the heavier pieces register themselves with the
  //      distance-culling list so they switch off entirely at range.
  //
  // See `docs/mapkit.md` for what each one is for.

  // Register a prop with the per-frame distance cull. `dist` is the range in
  // metres past which it stops drawing — set it from how big the thing is, not
  // from how much you like it.
  _detail(obj, pos, dist = 48) {
    this.detail.push({ obj, pos: pos.clone ? pos.clone() : v3(pos.x, pos.y, pos.z), dist });
    return obj;
  }

  // ---- LIGHT SHAFT --------------------------------------------------------
  // A cone of daylight or lamplight standing in the air. The single biggest
  // change to how an interior reads for the least geometry: a corridor with one
  // of these has a ceiling, a source and a volume, and the same corridor
  // without one is a box with a light-coloured strip in it.
  //
  // Drawn as a double-sided open cone with additive blending and no depth
  // write, so it never occludes anything and never needs the x-ray cut.
  // `lean` is the HORIZONTAL OFFSET of the pool from the source, as [dx, dz] in
  // metres. A shaft coming through a high window is not vertical, and the two
  // rotations it takes to aim a mesh do not compose the way you expect — so the
  // caller says where the light STARTS and where it LANDS, and the aiming is
  // done here once with a quaternion.
  godRay(x, yTop, z, radius, height, color = 0xdfeaff, opts = {}) {
    const [dx, dz] = opts.lean || [0, 0];
    const axis = v3(dx, -height, dz);
    const len = axis.length();
    const geo = new THREE.CylinderGeometry(radius * (opts.taper ?? 0.22), radius, len, 20, 1, true);
    // A CONE OF ADDITIVE GEOMETRY HAS A HARD EDGE, and a hard-edged shaft of
    // light is a cone-shaped object rather than light. The fix is the standard
    // fake-volume one and it costs four lines of shader: fade the alpha by how
    // FACE-ON the surface is, so the silhouette — where you are looking along
    // the cone's skin and through almost no volume — goes to nothing, and the
    // middle — where you are looking through the whole width of it — stays.
    // Fade the two ends as well, or the shaft stops dead in a bright ring at
    // the ceiling and a bright ring on the floor.
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, fog: false, toneMapped: false,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opts.opacity ?? 0.13 }
      },
      vertexShader: /* glsl */`
        varying vec3 vN; varying vec3 vV; varying float vT;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          vT = uv.y;                        // 0 at the wide end, 1 at the source
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uOpacity;
        varying vec3 vN; varying vec3 vV; varying float vT;
        void main(){
          float face = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 0.85);
          float ends = smoothstep(0.0, 0.22, vT) * smoothstep(0.0, 0.14, 1.0 - vT);
          // THE 2.1 IS THE FADE'S OWN COMPENSATION, not a taste knob. The two
          // fades together remove roughly half the brightness a
          // flat additive cone used to put on the screen, so a shaft authored
          // to look right before this change reads as nothing after it. Doing
          // it here keeps every map's authored opacity meaning the same thing
          // it meant, instead of re-tuning ten of them around a shader.
          gl_FragColor = vec4(uColor, uOpacity * face * ends * 2.1);
        }`
    });
    // the breathing ticker below writes `mat.opacity`, so give it one
    Object.defineProperty(mat, 'opacity', {
      get() { return this.uniforms.uOpacity.value; },
      set(v) { this.uniforms.uOpacity.value = v; }
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x + dx / 2, yTop - height / 2, z + dz / 2);
    m.quaternion.setFromUnitVectors(v3(0, -1, 0), axis.clone().normalize());
    this.add(m);
    // the pool of light it lands in, so the shaft has somewhere to arrive
    if (opts.pool !== false) {
      const pool = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.6, 20),
        haloMaterial(color, (opts.opacity ?? 0.13) * (opts.poolGain ?? 1.1)));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x + dx, yTop - height + 0.04, z + dz);
      pool.scale.set(1, len / height, 1);       // a slanted shaft lands as an ellipse
      this.add(pool);
    }
    const base = mat.opacity;
    let t = rand(0, 6);
    this.tickers.push(dt => {
      if (!m.visible) return;
      t += dt;
      // dust turning over in the beam, not a pulsing lamp — small and slow
      mat.opacity = base * (0.86 + Math.sin(t * 0.55) * 0.1 + Math.sin(t * 1.31) * 0.04);
    });
    this._detail(m, m.position, opts.range ?? 70);
    return m;
  }

  // ---- GROUND MIST --------------------------------------------------------
  // A drifting sheet of low fog over a rect. Scene fog gives depth to the
  // horizon; this gives depth to the FLOOR, which is where the fight is. Two
  // counter-scrolling layers of a soft noise texture, so it never reads as a
  // texture sliding across the ground.
  mist(x0, z0, x1, z1, y, color = 0x9fb0d0, opts = {}) {
    const t = tex('mistnoise', 256, (g, S) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 150; i++) {
        const r = rand(18, 64), cx = rand(0, S), cy = rand(0, S);
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        grd.addColorStop(0, `rgba(255,255,255,${rand(0.12, 0.34)})`);
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.beginPath(); g.arc(cx, cy, r, 0, 6.3); g.fill();
      }
    }, [1, 1]);
    const grp = new THREE.Group();
    const w = Math.abs(x1 - x0), d = Math.abs(z1 - z0);
    const layers = [];
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: t.clone(), color, transparent: true, opacity: (opts.opacity ?? 0.26) * (i ? 0.7 : 1),
        depthWrite: false, blending: THREE.NormalBlending, fog: false
      });
      mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
      mat.map.repeat.set(Math.max(1, w / (opts.scale ?? 26)), Math.max(1, d / (opts.scale ?? 26)));
      mat.map.needsUpdate = true;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((x0 + x1) / 2, y + 0.06 + i * 0.30, (z0 + z1) / 2);
      m.renderOrder = 2;
      grp.add(m);
      layers.push({ mat, sx: (i ? -1 : 1) * rand(0.004, 0.010), sy: (i ? 1 : -1) * rand(0.003, 0.008) });
    }
    this.add(grp);
    this.tickers.push(dt => {
      if (!grp.visible) return;
      for (const l of layers) {
        l.mat.map.offset.x += l.sx * dt;
        l.mat.map.offset.y += l.sy * dt;
      }
    });
    return grp;
  }

  // ---- CABLE --------------------------------------------------------------
  // A hanging line between two points, sagging under its own weight: overhead
  // power, a snapped feeder swinging off a gantry, the chain a lamp hangs on.
  // Cheap, and it does more for a skyline than another tower does.
  cable(from, to, opts = {}) {
    const a = from.clone ? from.clone() : v3(from[0], from[1], from[2]);
    const b = to.clone ? to.clone() : v3(to[0], to[1], to[2]);
    const sag = opts.sag ?? Math.max(0.4, a.distanceTo(b) * 0.09);
    const pts = [];
    const n = opts.segs ?? 10;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      pts.push(p);
    }
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, opts.r ?? 0.045, 5, false),
      opts.mat || this.mats.darkMetal);
    this.add(m);
    return m;
  }

  // ---- BANNER -------------------------------------------------------------
  // Hanging cloth that moves: a shop awning, a festival banner down a shrine
  // approach, a torn tarpaulin in a service tunnel. A vertical plane with
  // segments, waved on the CPU — the whole point is that something in the
  // frame is alive while both fighters are standing still.
  banner(x, y, z, w, h, color, opts = {}) {
    const geo = new THREE.PlaneGeometry(w, h, 6, 5);
    const mat = toonMaterial({
      vertexColors: false, color, steps: [70, 150, 255], rim: 0.2,
      side: THREE.DoubleSide, ...(opts.mat || {})
    });
    const m = new THREE.Mesh(geo, xrayable(mat));
    m.position.set(x, y - h / 2, z);
    m.rotation.y = opts.ry ?? 0;
    this.add(m);
    const home = geo.attributes.position.array.slice();
    const amp = opts.amp ?? 0.14;
    let t = rand(0, 6);
    this.tickers.push(dt => {
      if (!m.visible) return;
      t += dt;
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const px = home[i * 3], py = home[i * 3 + 1];
        // pinned along the top edge, freest at the bottom
        const hang = (h / 2 - py) / h;
        p.array[i * 3 + 2] = Math.sin(px * 1.9 + t * 2.3) * amp * hang
          + Math.sin(py * 2.6 - t * 1.5) * amp * 0.45 * hang;
      }
      p.needsUpdate = true;
    });
    this._detail(m, m.position, opts.range ?? 46);
    return m;
  }

  // ---- STEAM VENT ---------------------------------------------------------
  // A grating that breathes. Puffs on a cycle rather than streaming, because a
  // continuous jet reads as a particle emitter and a puff reads as a building.
  steamVent(x, y, z, opts = {}) {
    const color = opts.color ?? 0xc8d4e4;
    const h = opts.height ?? 3.2;
    const n = opts.puffs ?? 5;
    const grp = new THREE.Group();
    const puffs = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloMaterial(color, 0.2, false));
      m.userData.billboard = true;    // aimed per eye in core/stage.js
      m.position.set(x, y, z);
      m.visible = false;
      grp.add(m);
      puffs.push({ m, t: -i * (opts.period ?? 2.4) / n });
    }
    this.add(grp);
    const period = opts.period ?? 2.4;
    this.tickers.push(dt => {
      if (!grp.visible) return;
      for (const p of puffs) {
        p.t += dt;
        if (p.t < 0) { p.m.visible = false; continue; }
        if (p.t > period) { p.t -= period; }
        const k = p.t / period;                       // 0..1 through the puff
        p.m.visible = true;
        const s = 0.5 + k * (opts.spread ?? 2.4);
        p.m.scale.set(s, s, 1);
        p.m.position.set(x + Math.sin(k * 3.1) * 0.3, y + k * h, z);
        p.m.material.opacity = (opts.opacity ?? 0.34) * Math.sin(k * Math.PI) * 0.9;
      }
    });
    this._detail(grp, v3(x, y, z), opts.range ?? 44);
    return grp;
  }

  // ---- SPARKING CABLE -----------------------------------------------------
  // A dead feeder that arcs every few seconds. Belongs anywhere the level has
  // been broken open — the sewer, the detention block, the station undercroft.
  // Silent by design: the fx layer owns sound, and a map that made noise on a
  // timer would be doing it under the round's audio mix.
  sparker(x, y, z, opts = {}) {
    const color = opts.color ?? 0xbfe4ff;
    const grp = new THREE.Group();
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), haloMaterial(color, 0));
    flash.userData.billboard = true;
    flash.position.set(x, y, z);
    grp.add(flash);
    const bits = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), haloMaterial(color, 0));
      m.userData.billboard = true;
      m.position.set(x, y, z);
      grp.add(m);
      bits.push({ m, v: v3(), t: 0 });
    }
    this.add(grp);
    let wait = rand(0.4, 3.0);
    this.tickers.push(dt => {
      if (!grp.visible) return;
      wait -= dt;
      if (wait <= 0) {
        wait = rand(1.6, 4.6);
        flash.material.opacity = 0.95;
        for (const b of bits) {
          b.t = rand(0.25, 0.6);
          b.v.set(rand(-2.6, 2.6), rand(0.4, 3.2), rand(-2.6, 2.6));
          b.m.position.set(x, y, z);
          b.m.material.opacity = 1;
        }
      }
      flash.material.opacity = Math.max(0, flash.material.opacity - dt * 6);
      for (const b of bits) {
        if (b.t <= 0) { b.m.material.opacity = 0; continue; }
        b.t -= dt;
        b.v.y -= 22 * dt;
        b.m.position.addScaledVector(b.v, dt);
        b.m.material.opacity = Math.max(0, b.t * 2.4);
      }
    });
    this._detail(grp, v3(x, y, z), opts.range ?? 38);
    return grp;
  }

  // ---- WATERFALL / SPILL --------------------------------------------------
  // A falling sheet with a scrolling surface and a mist ball where it lands.
  // No collision: you fall through a waterfall, which is what a waterfall is.
  waterfall(x, yTop, z, w, h, opts = {}) {
    // THE TEXTURE CARRIES ITS OWN ALPHA, and that is the whole difference
    // between a waterfall and a pane of frosted glass. A fully opaque canvas
    // behind a `transparent: true` material is a flat translucent rectangle
    // however fast you scroll it — every strand has the same coverage, so there
    // is no water-shaped edge anywhere in it. Drawn as bright strands over a
    // CLEARED canvas, the gaps between them are genuinely see-through and the
    // sheet reads as falling water from the first frame.
    const t = tex('fallwater', 128, (g, S) => {
      g.clearRect(0, 0, S, S);
      for (let i = 0; i < 26; i++) {      // the body of the sheet: broad, soft
        g.fillStyle = `rgba(210,238,248,${rand(0.16, 0.34)})`;
        g.fillRect(rand(0, S), rand(-40, S), rand(6, 18), rand(50, 150));
      }
      for (let i = 0; i < 120; i++) {     // strands
        g.fillStyle = `rgba(255,255,255,${rand(0.35, 0.95)})`;
        g.fillRect(rand(0, S), rand(-30, S), rand(1, 3), rand(14, 70));
      }
      for (let i = 0; i < 70; i++) {      // the shadowed side of each strand
        g.fillStyle = `rgba(120,170,200,${rand(0.2, 0.55)})`;
        g.fillRect(rand(0, S), rand(-30, S), rand(2, 5), rand(20, 90));
      }
    }, [1, 1]);
    const map = t.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(Math.max(1, w / 2.4), Math.max(1, h / 3.0));
    map.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({
      map, color: opts.color ?? 0xa8d8ea, transparent: true,
      opacity: opts.opacity ?? 0.62, depthWrite: false, side: THREE.DoubleSide, fog: false
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, yTop - h / 2, z);
    m.rotation.y = opts.ry ?? 0;
    this.add(m);
    // the boil at the bottom
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.6, 2.2), haloMaterial(opts.color ?? 0xcfeaf6, 0.22));
    foam.userData.billboard = true;
    foam.position.set(x, yTop - h + 0.5, z);
    this.add(foam);
    const speed = opts.speed ?? 1.5;
    let ft = rand(0, 6);
    this.tickers.push(dt => {
      if (!m.visible) return;
      map.offset.y -= speed * dt;
      ft += dt;
      foam.material.opacity = 0.18 + Math.sin(ft * 3.1) * 0.06;
    });
    this._detail(m, m.position, opts.range ?? 80);
    return m;
  }

  // ---- CURSED SIGIL -------------------------------------------------------
  // A glyph burnt into the floor that breathes. This is the one piece of set
  // dressing in the section that is about the SETTING rather than about the
  // architecture — a jujutsu site has veiling and wards on it, and until now no
  // map showed one anywhere.
  sigil(x, y, z, r, color = 0x9f7fff, opts = {}) {
    const t = tex('sigil' + (opts.rings ?? 3) + (opts.spokes ?? 12), 256, (g, S) => {
      g.clearRect(0, 0, S, S);
      const c = S / 2;
      g.strokeStyle = '#fff'; g.lineCap = 'round';
      const rings = opts.rings ?? 3;
      for (let i = 0; i < rings; i++) {
        g.lineWidth = i === 0 ? 7 : 3.5;
        g.beginPath(); g.arc(c, c, c * (0.94 - i * 0.19), 0, 6.283); g.stroke();
      }
      const spokes = opts.spokes ?? 12;
      g.lineWidth = 2.5;
      for (let i = 0; i < spokes; i++) {
        const a = (i / spokes) * 6.283;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * c * 0.38, c + Math.sin(a) * c * 0.38);
        g.lineTo(c + Math.cos(a) * c * 0.94, c + Math.sin(a) * c * 0.94);
        g.stroke();
      }
      // an inscribed polygon, because a wheel of spokes alone reads as a wheel
      const k = opts.sides ?? 5;
      g.lineWidth = 4;
      g.beginPath();
      for (let i = 0; i <= k; i++) {
        const a = (i / k) * 6.283 - Math.PI / 2;
        const px = c + Math.cos(a) * c * 0.56, py = c + Math.sin(a) * c * 0.56;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.stroke();
    }, [1, 1]);
    const mat = new THREE.MeshBasicMaterial({
      map: t, color, transparent: true, opacity: opts.opacity ?? 0.42,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false
    });
    const m = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat);
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = opts.rz ?? 0;
    m.position.set(x, y + 0.03, z);
    this.add(m);
    const base = mat.opacity;
    const spin = opts.spin ?? 0.06;
    let st = rand(0, 6);
    this.tickers.push(dt => {
      if (!m.visible) return;
      st += dt;
      m.rotation.z += spin * dt;
      mat.opacity = base * (0.72 + Math.sin(st * 1.15) * 0.28);
    });
    this._detail(m, m.position, opts.range ?? 60);
    return m;
  }

  // ---- BEACON -------------------------------------------------------------
  // A rotating warning light with a sweeping wedge. One of these turns a
  // service space into a service space that is IN USE.
  beacon(x, y, z, color = 0xff6a4a, opts = {}) {
    const grp = new THREE.Group();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), emissive(color));
    bulb.position.set(x, y, z);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), haloMaterial(color, 0.5));
    halo.userData.billboard = true;
    halo.position.set(x, y, z);
    // the sweep: an open cone lying on its side, spun about Y
    // The beam is laid out IN GEOMETRY SPACE — apex at the origin, opening out
    // along +X, flattened vertically — so the pivot it hangs off is a plain
    // spin about Y and nothing depends on the order two mesh rotations are
    // applied in. Composing this out of mesh transforms was tried first and
    // put the beam on its side.
    const reach = opts.reach ?? 3.2;
    const cone = new THREE.ConeGeometry(reach * 0.3, reach, 12, 1, true);
    cone.rotateZ(Math.PI / 2);     // apex from +Y round to -X
    cone.translate(reach / 2, 0, 0);
    cone.scale(1, 0.42, 1);        // a beam, not a floodlight
    const wedge = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false
    }));
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    pivot.add(wedge);
    grp.add(bulb, halo, pivot);
    this.add(grp);
    const rate = opts.rate ?? 1.7;
    let bt = rand(0, 6);
    this.tickers.push(dt => {
      if (!grp.visible) return;
      bt += dt;
      pivot.rotation.y += rate * dt;
      halo.material.opacity = 0.32 + Math.abs(Math.sin(bt * rate)) * 0.34;
    });
    this._detail(grp, v3(x, y, z), opts.range ?? 42);
    return grp;
  }

  // ---- HANGING LAMP -------------------------------------------------------
  // A bulb on a flex that swings. Registers nothing — it hangs at head height
  // and a collider there is a soft lock waiting to happen in a corridor.
  hangingLamp(x, yCeil, z, drop = 1.4, color = 0xffd9a0, opts = {}) {
    const pivot = new THREE.Group();
    pivot.position.set(x, yCeil, z);
    const flex = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, drop, 5), this.mats.darkMetal);
    flex.position.y = -drop / 2;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.26, 10, 1, true), this.mats.darkMetal);
    shade.position.y = -drop;
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), emissive(color));
    bulb.position.y = -drop - 0.1;
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), haloMaterial(color, 0.34));
    halo.userData.billboard = true;
    halo.position.y = -drop - 0.1;
    pivot.add(flex, shade, bulb, halo);
    this.add(pivot);
    const amp = opts.amp ?? 0.05;
    let t = rand(0, 6);
    const rate = rand(0.5, 0.8);
    this.tickers.push(dt => {
      if (!pivot.visible) return;
      t += dt;
      pivot.rotation.z = Math.sin(t * rate) * amp;
      pivot.rotation.x = Math.cos(t * rate * 0.77) * amp * 0.6;
    });
    this._detail(pivot, v3(x, yCeil - drop, z), opts.range ?? 34);
    return pivot;
  }

  // ---- LANTERN STRING -----------------------------------------------------
  // Festival lanterns strung along a sagging cable between two posts. The
  // outdoor counterpart to `hangingLamp`, and the cheapest way to give an
  // approach a direction to walk along.
  lanternString(from, to, opts = {}) {
    const a = from.clone ? from.clone() : v3(from[0], from[1], from[2]);
    const b = to.clone ? to.clone() : v3(to[0], to[1], to[2]);
    this.cable(a, b, { sag: opts.sag ?? 0.9, r: 0.03 });
    const n = opts.count ?? Math.max(2, Math.round(a.distanceTo(b) / 2.2));
    const color = opts.color ?? 0xffb86a;
    const grp = new THREE.Group();
    const bulbs = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * (opts.sag ?? 0.9) + 0.22;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 9), emissive(color));
      body.position.copy(p);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), haloMaterial(color, 0.34));
      halo.userData.billboard = true;
      halo.position.copy(p);
      grp.add(body, halo);
      bulbs.push({ halo, ph: rand(0, 6.3) });
    }
    this.add(grp);
    let t = 0;
    this.tickers.push(dt => {
      if (!grp.visible) return;
      t += dt;
      for (const bl of bulbs) bl.halo.material.opacity = 0.26 + Math.sin(t * 1.6 + bl.ph) * 0.1;
    });
    this._detail(grp, a.clone().lerp(b, 0.5), opts.range ?? 56);
    return grp;
  }

  // ---- PIPE RUN -----------------------------------------------------------
  // Decorative service pipes along a wall or ceiling. `collide` defaults to
  // FALSE and should stay false: a pipe at chest height with a collider on it
  // is a snag in a corridor, and the whole class of "I got stuck on nothing"
  // starts with props like this one being made solid because they look solid.
  pipeRun(x0, y0, z0, x1, y1, z1, opts = {}) {
    const a = v3(x0, y0, z0), b = v3(x1, y1, z1);
    const grp = new THREE.Group();
    const rs = opts.radii ?? [0.11, 0.07, 0.09];
    const dir = b.clone().sub(a);
    const len = dir.length();
    // an offset frame across the run, so the pipes sit side by side
    const up = Math.abs(dir.clone().normalize().y) > 0.9 ? v3(1, 0, 0) : v3(0, 1, 0);
    const side = dir.clone().normalize().cross(up).normalize();
    rs.forEach((r, i) => {
      const off = side.clone().multiplyScalar((i - (rs.length - 1) / 2) * 0.26);
      const p0 = a.clone().add(off), p1 = b.clone().add(off);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), opts.mat || this.mats.rust);
      m.position.copy(p0).lerp(p1, 0.5);
      m.quaternion.setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize());
      grp.add(m);
      // collars, so it reads as pipework rather than as rods
      const nc = Math.max(1, Math.round(len / 5));
      for (let c = 1; c <= nc; c++) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.5, r * 1.5, 0.16, 8), this.mats.darkMetal);
        col.position.copy(p0).lerp(p1, c / (nc + 1));
        col.quaternion.copy(m.quaternion);
        grp.add(col);
      }
    });
    this.add(grp);
    if (opts.zone) this._zoneAdd(opts.zone, grp);
    return grp;
  }

  // =========================================================================
  // SOLID SHOWPIECES — these carry collision, so they follow the pattern
  // =========================================================================

  // ---- CRATE STACK --------------------------------------------------------
  // Cover you can break, climb and fight around. Each crate is a blocker that
  // stops 0.12 m under a walkable top registered at the height the lid is
  // DRAWN, so landing on the stack lands you on the stack. Both surfaces carry
  // the same id, so breaking it takes the ledge away with the cover — a route
  // that only exists while the crates do.
  crates(x, y, z, opts = {}) {
    const n = opts.count ?? 3;
    const s = opts.size ?? 1.05;
    const id = opts.id || ('crate' + Math.round(x * 10) + '_' + Math.round(z * 10));
    const g = new THREE.Group();
    const mat = opts.mat || this.mats.wood;
    // A COLUMN, not a heap. The top has to be one flat height or the platform
    // registered for it is a lie somewhere, and a lie about where the floor is
    // is exactly the fault this whole section is written around.
    let top = y;
    for (let i = 0; i < n; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(s * 0.98, s * 0.98, s * 0.98), mat);
      box.position.set(x + rand(-0.05, 0.05), y + s * (i + 0.5), z + rand(-0.05, 0.05));
      box.rotation.y = rand(-0.09, 0.09);
      g.add(box);
      // banding
      for (const ax of [0, 1]) {
        const band = new THREE.Mesh(
          ax ? new THREE.BoxGeometry(s * 1.0, 0.07, 0.07) : new THREE.BoxGeometry(0.07, 0.07, s * 1.0),
          this.mats.darkMetal);
        band.position.copy(box.position);
        band.position.y += s * 0.26;
        band.rotation.y = box.rotation.y;
        g.add(band);
      }
      top = y + s * (i + 1);
    }
    this.add(g);
    if (opts.zone) this._zoneAdd(opts.zone, g);
    const h = s * 0.52;
    this.bounds.wall(x - h, z - h, x + h, z + h, y, top - 0.12, { id });
    this.bounds.platform(x - h, z - h, x + h, z + h, top, { id, prop: true });
    return this.breakable(g, {
      hp: opts.hp ?? 34 * n, kind: 'wood', center: v3(x, y + (top - y) / 2, z),
      radius: s * 0.75, height: top - y, baseY: y, colliderIds: [id]
    });
  }

  // ---- EXPLOSIVE DRUM -----------------------------------------------------
  // THE GIMMICK. A fuel drum that goes up when it breaks, throws a fireball and
  // a shockwave, shakes the camera — and CHAINS, so a row of them clears a wall
  // that no single hit would have.
  //
  // WHAT IT DELIBERATELY DOES NOT DO: it does not touch a fighter. Environment
  // damage from a prop would be a balance change smuggled in as set dressing —
  // a character who happens to spawn beside one would take chip damage from the
  // map — so the blast only feeds `damageAt`, which by construction only ever
  // reaches other destructibles. It changes the SHAPE of the fight, which is
  // what a map is allowed to do, and never the numbers.
  //
  // The chain runs on the destruction system's own pending queue via a short
  // ticker delay rather than recursing, so a row of ten cannot blow the stack
  // and the chain visibly travels.
  drum(x, y, z, opts = {}) {
    const id = opts.id || ('drum' + Math.round(x * 10) + '_' + Math.round(z * 10));
    const color = opts.color ?? 0xc4562c;
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.92, 12),
      toonMaterial({ vertexColors: false, color, steps: [64, 140, 255], rim: 0.34 }));
    body.position.y = 0.46;
    g.add(body);
    for (const ry of [0.30, 0.62]) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.365, 0.035, 5, 14), this.mats.darkMetal);
      rib.rotation.x = Math.PI / 2;
      rib.position.y = ry;
      g.add(rib);
    }
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 12), this.mats.darkMetal);
    lid.position.y = 0.93;
    // the hazard mark, so it reads as "this one goes off" before it does
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), emissive(opts.markColor ?? 0xffd24a));
    mark.position.set(0, 0.5, 0.365);
    g.add(lid, mark);
    g.position.set(x, y, z);
    g.rotation.y = opts.ry ?? rand(0, 6.3);
    this.add(g);
    if (opts.zone) this._zoneAdd(opts.zone, g);
    this.bounds.wall(x - 0.38, z - 0.38, x + 0.38, z + 0.38, y, y + 0.84, { id });
    this.bounds.platform(x - 0.34, z - 0.34, x + 0.34, z + 0.34, y + 0.96, { id, prop: true });
    const at = v3(x, y + 0.55, z);
    const power = opts.power ?? 170;
    const radius = opts.radius ?? 5.0;
    return this.breakable(g, {
      hp: opts.hp ?? 26, kind: 'metal', center: at.clone(), radius: 0.7, height: 0.96,
      baseY: y, colliderIds: [id], debrisScale: 1.2,
      onDestroyed: (D) => {
        const fx = D.ctx?.fx;
        D.ctx?.cam?.shake(0.65);
        D.ctx?.sfx?.rubble?.();
        if (fx) {
          fx._ring?.(at.clone().setY(y + 0.15), 0xffa23c, { size: 0.7, growRate: 18, life: 0.45 });
          fx._spawn?.(at.clone(), { color: 0xffd27a, size: 1.5, life: 0.34, vel: v3(), grow: 11 });
          for (let i = 0; i < 26; i++) {
            const a = rand(0, Math.PI * 2), r = rand(0, 1.4);
            fx._spawn?.(at.clone().add(v3(Math.cos(a) * r, rand(-0.2, 1.0), Math.sin(a) * r)), {
              color: i % 3 ? 0xff7a3c : 0xffe0a0, size: rand(0.3, 1.0),
              life: rand(0.3, 0.8), grow: rand(1.5, 4),
              vel: v3(Math.cos(a) * rand(1, 6), rand(1.5, 6.5), Math.sin(a) * rand(1, 6))
            });
          }
          for (let i = 0; i < 14; i++) {
            fx._spawn?.(at.clone(), {
              color: 0x50525a, size: rand(0.6, 1.6), life: rand(0.7, 1.5), opacity: 0.4, grow: 2,
              vel: v3(rand(-3, 3), rand(0.6, 3.4), rand(-3, 3))
            });
          }
        }
        // THE CHAIN, one tick later. Recursing straight into `damageAt` from
        // inside `_destroy` would blow the stack on a long row and would land
        // the whole chain on a single frame; a queued blast travels.
        this.tickers.push(oneShot(0.09, () => D.damageAt(at, radius, power, { kind: 'heat' })));
      }
    });
  }

  _regMesh(id, mesh) {
    let list = this.meshById.get(id);
    if (!list) this.meshById.set(id, list = []);
    list.push(mesh);
    return mesh;
  }

  // Every mesh drawn for a named floor. Maps that build a destructible by hand
  // (rather than through `pillar`) use this to fill in `dropMeshes`.
  meshesFor(id) { return this.meshById.get(id) || []; }

  // ---- finish --------------------------------------------------------------
  finish(ctx) {
    // WHAT COLLAPSES. Anything a destructible can drop is drawn on its own so
    // the collapse can hide it; everything else merges as usual.
    const dropped = new Set();
    for (const e of this.destructReg) for (const id of e.dropPlatformIds || []) dropped.add(id);
    for (const f of this._idFloors) {
      if (dropped.has(f.id)) {
        const m = new THREE.Mesh(f.geo, f.mat);
        m.name = 'floor:' + f.id;
        this.add(m);
        if (f.zone) this._zoneAdd(f.zone, m);
        this._regMesh(f.id, m);
      } else {
        this.static_(f.geo, f.mat, f.zone);
      }
    }
    this._idFloors.length = 0;
    // and hand each destructible the meshes for the floors it brings down
    for (const e of this.destructReg) {
      if (!e.dropPlatformIds?.length) continue;
      const meshes = new Set(e.dropMeshes || []);
      for (const id of e.dropPlatformIds) for (const m of this.meshesFor(id)) meshes.add(m);
      e.dropMeshes = [...meshes];
    }
    this._flushStatics();
    // THE FAR FIELD, under everything (see groundPlane). By now every pit, every
    // basement and every sunken room has been declared, so the lowest thing a
    // fighter can stand on is known and the disc can go below it.
    if (this._autoGround?.length) {
      let low = this.bounds.groundY;
      for (const p of this.bounds.pits) low = Math.min(low, p.y);
      for (const p of this.bounds.platforms) low = Math.min(low, p.ramp ? Math.min(p.ramp.yLow, p.ramp.yHigh) : p.y);
      for (const m of this._autoGround) m.position.y = low - 0.4;
      this._autoGround.length = 0;
    }

    // THE OCCLUSION CUT, over the whole level in one pass. See xrayAll: the
    // per-helper wrapping this replaces was missing the props — a car, a
    // vending machine, a big screen, a torii — which are precisely the things
    // that end up between the camera and the fighter and used to stay solid.
    xrayAll(this.group);
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
      // `camera` may be a single camera or the whole list of eyes. It has to be
      // the whole list in split screen: culling is a property of the SCENE, not
      // of a view, so anything one eye needs has to stay switched on for all of
      // them. Culling on eye 0 alone deleted the interior out from under the
      // other seats — walls and floor gone, the fighter apparently standing on
      // nothing — while player 1's screen looked perfect.
      update(dt, camera) {
        t += dt;
        for (const fn of tickers) fn(dt);
        destruct.update(dt);
        const cams = Array.isArray(camera) ? camera : camera ? [camera] : [];
        // ZONE CULLING: an interior does not pay for the exterior and vice
        // versa. A zone is active when ANY eye is inside it or near it.
        if (cams.length) {
          for (const z of zones) {
            const b = z.box;
            const inside = cams.some(c => {
              const p = c.position;
              return p.x > b.x0 - 8 && p.x < b.x1 + 8 && p.z > b.z0 - 8 && p.z < b.z1 + 8
                && p.y > b.y0 - 6 && p.y < b.y1 + 10;
            });
            const want = z.interior ? inside : !inside || true;
            if (want !== z.active) {
              z.active = want;
              for (const o of z.objects) o.visible = want;
            }
          }
          // DETAIL LOD: small props switch off past their range — from EVERY
          // eye, for the same reason.
          for (const d of detail) {
            const vis = cams.some(c => c.position.distanceToSquared(d.pos) < d.dist * d.dist);
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
