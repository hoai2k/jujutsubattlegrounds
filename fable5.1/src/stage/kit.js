// MAP KIT — the vocabulary the ten maps are written in. A map declares
// floors, walls, blocks, props, skyline, lights, grade and fog; the kit
// merges static geometry per material into a handful of draw calls,
// registers collision alongside, and builds the canvas textures.
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { archetype, toonMaterial } from '../art/shaders/toon.js';
import { Bounds } from './bounds.js';
import { rand, mulberry32, v3 } from '../core/math.js';
import { quality } from '../render/quality.js';

// ---- canvas textures ---------------------------------------------------------
const _tex = new Map();
export function tex(key, size, draw, repeat = [4, 4]) {
  const ck = key + ':' + repeat.join(',');
  if (_tex.has(ck)) return _tex.get(ck);
  const c = document.createElement('canvas'); c.width = c.height = size;
  const R = mulberry32(key.length * 977 + 13);
  draw(c.getContext('2d'), size, (a = 1, b) => (b === undefined ? R() * a : a + R() * (b - a)));
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  _tex.set(ck, t); return t;
}
export const TEX = {
  tile: (rep, base = '#8e929c', grout = '#2a2e38') => tex('tile' + base, 256, (g, S, r) => { g.fillStyle = grout; g.fillRect(0, 0, S, S); const n = 8, s = S / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = shade(base, r(-14, 14)); g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4); } for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(30,34,44,${r(0.04, 0.16)})`; g.fillRect(r(0, S), r(0, S), r(2, 10), r(2, 10)); } }, rep),
  concrete: (rep, base = '#6c7079') => tex('concrete' + base, 256, (g, S, r) => { g.fillStyle = base; g.fillRect(0, 0, S, S); for (let i = 0; i < 900; i++) { g.fillStyle = shade(base, r(-24, 26), r(0.1, 0.45)); g.fillRect(r(0, S), r(0, S), r(1, 7), r(1, 7)); } for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(40,42,50,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, i * S / 8); g.lineTo(S, i * S / 8 + r(-6, 6)); g.stroke(); } }, rep),
  asphalt: (rep) => tex('asphalt', 256, (g, S, r) => { g.fillStyle = '#34373f'; g.fillRect(0, 0, S, S); for (let i = 0; i < 1600; i++) { const v = 44 + r(-12, 22); g.fillStyle = `rgba(${v},${v + 1},${v + 6},${r(0.15, 0.5)})`; g.fillRect(r(0, S), r(0, S), r(1, 4), r(1, 4)); } }, rep),
  wood: (rep, base = '#7a5a3c') => tex('wood' + base, 256, (g, S, r) => { g.fillStyle = base; g.fillRect(0, 0, S, S); for (let i = 0; i < 26; i++) { g.strokeStyle = shade(base, r(-30, 20), 0.5); g.lineWidth = r(1, 4); const y = r(0, S); g.beginPath(); g.moveTo(0, y); for (let x = 0; x < S; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 3); g.stroke(); } for (let i = 0; i <= 4; i++) { g.strokeStyle = 'rgba(40,26,16,0.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, i * S / 4); g.lineTo(S, i * S / 4); g.stroke(); } }, rep),
  grass: (rep) => tex('grass', 256, (g, S, r) => { g.fillStyle = '#3f5e3c'; g.fillRect(0, 0, S, S); for (let i = 0; i < 2200; i++) { const v = r(0, 1); g.fillStyle = `rgba(${40 + v * 30},${74 + v * 40},${38 + v * 24},${r(0.2, 0.6)})`; g.fillRect(r(0, S), r(0, S), r(1, 3), r(2, 6)); } }, rep),
  gravel: (rep) => tex('gravel', 256, (g, S, r) => { g.fillStyle = '#8a8478'; g.fillRect(0, 0, S, S); for (let i = 0; i < 1400; i++) { const v = 120 + r(-40, 40); g.fillStyle = `rgba(${v},${v - 4},${v - 12},${r(0.3, 0.8)})`; g.beginPath(); g.arc(r(0, S), r(0, S), r(1, 4), 0, 6.3); g.fill(); } }, rep),
  brick: (rep, base = '#8a5a4a') => tex('brick' + base, 256, (g, S, r) => { g.fillStyle = '#4a3a34'; g.fillRect(0, 0, S, S); const bh = S / 8, bw = S / 4; for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) { const off = y % 2 ? bw / 2 : 0; g.fillStyle = shade(base, r(-18, 18)); g.fillRect(x * bw + off + 2, y * bh + 2, bw - 4, bh - 4); } }, rep),
  metal: (rep) => tex('metal', 256, (g, S, r) => { g.fillStyle = '#6a6e78'; g.fillRect(0, 0, S, S); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${r(0.02, 0.08)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, r(0, S)); g.lineTo(S, r(0, S)); g.stroke(); } for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(30,32,40,0.6)'; g.beginPath(); g.arc(r(0, S), r(0, S), 3, 0, 6.3); g.fill(); } }, rep),
  rust: (rep) => tex('rust', 256, (g, S, r) => { g.fillStyle = '#4d4a45'; g.fillRect(0, 0, S, S); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${78 + r(0, 38)},${44 + r(0, 20)},${24 + r(0, 14)},${r(0.08, 0.4)})`; g.beginPath(); g.arc(r(0, S), r(0, S), r(2, 14), 0, 6.3); g.fill(); } }, rep),
  water: (rep) => tex('water', 256, (g, S, r) => { g.fillStyle = '#2a4a5a'; g.fillRect(0, 0, S, S); for (let i = 0; i < 60; i++) { g.strokeStyle = `rgba(160,200,220,${r(0.05, 0.2)})`; g.lineWidth = r(1, 3); const y = r(0, S); g.beginPath(); g.moveTo(0, y); for (let x = 0; x < S; x += 8) g.lineTo(x, y + Math.sin(x * 0.08 + i) * 4); g.stroke(); } }, rep),
  tatami: (rep) => tex('tatami', 256, (g, S, r) => { g.fillStyle = '#a89a62'; g.fillRect(0, 0, S, S); for (let i = 0; i < S; i += 3) { g.fillStyle = `rgba(80,70,40,${r(0.05, 0.15)})`; g.fillRect(0, i, S, 1); } g.fillStyle = '#3a3a2a'; g.fillRect(0, 0, S, 6); g.fillRect(0, S / 2, S, 6); }, rep),
  rock: (rep) => tex('rock', 256, (g, S, r) => { g.fillStyle = '#5a5a60'; g.fillRect(0, 0, S, S); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${60 + r(0, 60)},${60 + r(0, 55)},${64 + r(0, 50)},${r(0.2, 0.6)})`; g.beginPath(); g.arc(r(0, S), r(0, S), r(4, 22), 0, 6.3); g.fill(); } }, rep),
  sand: (rep) => tex('sand', 256, (g, S, r) => { g.fillStyle = '#c8b48a'; g.fillRect(0, 0, S, S); for (let i = 0; i < 2000; i++) { const v = r(-20, 20); g.fillStyle = `rgba(${200 + v},${180 + v},${140 + v},${r(0.2, 0.5)})`; g.fillRect(r(0, S), r(0, S), 1, 1); } }, rep)
};
function shade(hex, d, a = 1) { const n = parseInt(hex.slice(1), 16); const r = Math.max(0, Math.min(255, (n >> 16) + d)), g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d)), b = Math.max(0, Math.min(255, (n & 255) + d)); return a === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`; }

// window/sign textures for skyline boxes
export function windowsTex(hue = 200, lit = 0.35) {
  return tex('win' + hue + lit, 128, (g, S, r) => { g.fillStyle = '#1a1c24'; g.fillRect(0, 0, S, S); const n = 8, s = S / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const on = r() < lit; g.fillStyle = on ? `hsl(${hue + r(-20, 20)},70%,${r(55, 80)}%)` : `hsl(${hue},20%,${r(12, 20)}%)`; g.fillRect(x * s + 3, y * s + 3, s - 6, s - 7); } }, [1, 1]);
}

// ---- materials -----------------------------------------------------------------
const _mats = new Map();
export function surface(name, color, opts = {}) {
  const key = name + ':' + color + ':' + JSON.stringify(opts);
  if (_mats.has(key)) return _mats.get(key);
  const map = opts.tex ? TEX[opts.tex](opts.rep || [4, 4], ...(opts.texArgs || [])) : null;
  const m = toonMaterial({ color, map, ...archetypeOpts(opts.arch || 'stone'), side: opts.double ? THREE.DoubleSide : THREE.FrontSide, emissive: opts.emissive ?? 0, emissiveIntensity: opts.emissiveIntensity ?? 1 });
  m.name = name; _mats.set(key, m); return m;
}
import { ARCH } from '../art/shaders/toon.js';
function archetypeOpts(a) { return ARCH[a] || ARCH.stone; }
export function glow(color, opacity = 1) { const m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false }); m.color.multiplyScalar(1.6); return m; }

// ---- the builder ---------------------------------------------------------------------
export class MapBuilder {
  constructor(def) {
    this.def = def; this.group = new THREE.Group(); this.group.name = def.id;
    this.bounds = new Bounds(def.extent);
    this.statics = new Map();   // material -> geometries
    this.dynamic = [];          // { node, update }
    this.spawns = def.spawns || null;
    this.R = mulberry32(def.id.length * 131 + 7);
  }
  rand(a = 1, b) { return b === undefined ? this.R() * a : a + this.R() * (b - a); }
  _push(mat, geo) { if (!this.statics.has(mat)) this.statics.set(mat, []); this.statics.get(mat).push(geo); }
  // a box: floors on top register as floor, and the body as a wall when tall
  box(mat, x, y, z, w, h, d, { floor = true, wall = 'auto', rot = 0, uv = 1 } = {}) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (uv !== 1) { const a = g.getAttribute('uv'); for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) * uv, a.getY(i) * uv); }
    if (rot) g.rotateY(rot);
    g.translate(x, y + h / 2, z);
    this._push(mat, g);
    if (!rot) {
      if (floor && h >= 0.05) this.bounds.addFloor(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y + h);
      if (wall === true || (wall === 'auto' && h > 0.6)) this.bounds.addWall(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y, y + h);
    }
    return g;
  }
  floor(mat, x, z, w, d, y = 0) { const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2); g.translate(x, y, z); this._push(mat, g); this.bounds.addFloor(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y); }
  cylinder(mat, x, y, z, r, h, seg = 12, { wall = true } = {}) { const g = new THREE.CylinderGeometry(r, r, h, seg); g.translate(x, y + h / 2, z); this._push(mat, g); if (wall) this.bounds.addWall(x - r * 0.8, x + r * 0.8, z - r * 0.8, z + r * 0.8, y, y + h); }
  mesh(geo, mat, x, y, z, { rot = 0, scale = 1 } = {}) { const g = geo.clone(); g.scale(scale, scale, scale); if (rot) g.rotateY(rot); g.translate(x, y, z); this._push(mat, g); }
  add(node) { this.group.add(node); }
  tick(node, update) { this.group.add(node); this.dynamic.push({ node, update }); }
  // walls around the arena extent (invisible collision + a visible lip)
  fence(mat, h = 1.0, t = 0.4) { const e = this.def.extent; const w = e.maxX - e.minX, d = e.maxZ - e.minZ; const cx = (e.minX + e.maxX) / 2, cz = (e.minZ + e.maxZ) / 2; if (mat) { this.box(mat, cx, this.bounds.groundY, e.minZ - t / 2, w + t * 2, h, t); this.box(mat, cx, this.bounds.groundY, e.maxZ + t / 2, w + t * 2, h, t); this.box(mat, e.minX - t / 2, this.bounds.groundY, cz, t, h, d); this.box(mat, e.maxX + t / 2, this.bounds.groundY, cz, t, h, d); } }
  // a skyline of window-textured boxes beyond the playable extent
  skyline(n = 24, { r0 = 40, r1 = 80, hMin = 12, hMax = 50, hue = 200, lit = 0.35, color = 0x2a2e40 } = {}) {
    const mat = surface('skyline' + hue, color, { arch: 'stone' }); mat.map = windowsTex(hue, lit); mat.needsUpdate = true;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + this.rand(-0.1, 0.1), r = this.rand(r0, r1);
      const w = this.rand(6, 16), h = this.rand(hMin, hMax);
      const g = new THREE.BoxGeometry(w, h, w); const uv = g.getAttribute('uv'); for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 4, uv.getY(k) * h / 4);
      g.rotateY(this.rand(0, 1)); g.translate(Math.sin(a) * r, h / 2 - 0.5, Math.cos(a) * r); this._push(mat, g);
    }
  }
  trees(n, { r0 = 18, r1 = 40, color = 0x3a6a3a, trunk = 0x5a4030 } = {}) {
    const leaf = surface('leaf' + color, color, { arch: 'fur' }), bark = surface('bark', trunk, { arch: 'stone' });
    for (let i = 0; i < n; i++) {
      const a = this.rand(0, 6.28), r = this.rand(r0, r1), x = Math.sin(a) * r, z = Math.cos(a) * r, h = this.rand(3, 6);
      const t = new THREE.CylinderGeometry(0.2, 0.3, h, 6); t.translate(x, h / 2, z); this._push(bark, t);
      for (let k = 0; k < 3; k++) { const s = new THREE.SphereGeometry(this.rand(1.4, 2.6), 8, 6); s.translate(x + this.rand(-0.8, 0.8), h + this.rand(-0.5, 1.5), z + this.rand(-0.8, 0.8)); this._push(leaf, s); }
    }
  }
  lamp(x, z, h = 4, color = 0xfff0c0) { const m = surface('pole', 0x30323a, { arch: 'metal' }); this.cylinder(m, x, 0, z, 0.08, h, 6, { wall: false }); const g = new THREE.SphereGeometry(0.22, 8, 6); g.translate(x, h, z); const mesh = new THREE.Mesh(g, glow(color)); this.group.add(mesh); }
  sign(x, y, z, w, h, color, rot = 0) { const g = new THREE.PlaneGeometry(w, h); g.rotateY(rot); g.translate(x, y, z); const m = new THREE.Mesh(g, glow(color, 0.95)); m.material.side = THREE.DoubleSide; this.group.add(m); }
  finish() {
    for (const [mat, geos] of this.statics) {
      const merged = BufferGeometryUtils.mergeGeometries(geos.map(g => { const n = g.index ? g.toNonIndexed() : g; if (!n.getAttribute('uv')) { const c = n.getAttribute('position').count; n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c * 2), 2)); } for (const k of ['uv1', 'uv2']) if (n.getAttribute(k)) n.deleteAttribute(k); return n; }), false);
      if (!merged) { console.warn('[kit] merge failed for', mat.name); continue; }
      const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'static_' + mat.name;
      this.group.add(mesh);
    }
    return { group: this.group, bounds: this.bounds, dynamic: this.dynamic, def: this.def, spawnPoint: (i, n) => this.spawnPoint(i, n), radius: Math.min(this.def.extent.maxX, this.def.extent.maxZ), grade: 'map:' + this.def.id, fx: null };
  }
  spawnPoint(i, n) {
    if (this.spawns && this.spawns[i]) return v3(...this.spawns[i]);
    if (n <= 2) return v3(i === 0 ? -2.4 : 2.4, this.bounds.groundY, 0);
    const a = (i / n) * Math.PI * 2, r = n === 3 ? 3.2 : 3.5; return v3(Math.sin(a) * r, this.bounds.groundY, Math.cos(a) * r);
  }
}
