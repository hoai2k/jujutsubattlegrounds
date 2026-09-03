// DESTRUCTION — staged, budgeted, and structural.
//
// Rules this implements, in the order they matter:
//  1. NOTHING VANISHES. Every destructible runs INTACT -> CRACKED -> DAMAGED
//     -> DESTROYED, and each stage has its own geometry: cracks appear, chunks
//     fall off and shift, and the final stage swaps the whole prop for a
//     rubble pile. An object carries the history of the fight on it.
//  2. STRUCTURE CHANGES THE LEVEL. A destructible can own collider ids in the
//     Bounds; destroying it kills them, so a blown wall really is a new route
//     and a dropped floor section really is a hole. That is the entire reason
//     destruction is worth having.
//  3. THE BUDGET IS A HARD CAP. Debris is pooled, settles, then FREEZES (stops
//     simulating entirely) and finally recycles oldest-first. A fight that
//     lasts three minutes cannot end up simulating three minutes of rubble.
import * as THREE from 'three';
import { toonMaterial } from '../../art/shaders/toon.js';
import { rand, v3, flatDist } from '../../core/math.js';

export const STAGE = { INTACT: 0, CRACKED: 1, DAMAGED: 2, DESTROYED: 3 };

// One shared material per debris family — a hundred chunks must not be a
// hundred materials.
let _debrisMats = null;
function debrisMats() {
  if (!_debrisMats) {
    _debrisMats = {
      concrete: toonMaterial({ vertexColors: false, color: 0x8d8f96, steps: [70, 150, 255], rim: 0.14 }),
      metal: toonMaterial({ vertexColors: false, color: 0x9aa4b4, steps: [56, 132, 255], rim: 0.5, gloss: 0.5 }),
      wood: toonMaterial({ vertexColors: false, color: 0x6b4f33, steps: [66, 142, 255], rim: 0.16 }),
      glass: toonMaterial({
        vertexColors: false, color: 0xcfe4f2, steps: [110, 190, 255], rim: 0.7,
        transparent: true, opacity: 0.62
      }),
      tile: toonMaterial({ vertexColors: false, color: 0xc8cdd6, steps: [86, 164, 255], rim: 0.2 }),
      foliage: toonMaterial({ vertexColors: false, color: 0x3d5a3f, steps: [62, 134, 255], rim: 0.15 })
    };
  }
  return _debrisMats;
}

// Crack decals: thin dark planes laid over a chunk face. Generated once per
// size class and reused, because a crack is a crack.
let _crackGeo = null;
function crackGeo() {
  if (!_crackGeo) _crackGeo = new THREE.PlaneGeometry(1, 1);
  return _crackGeo;
}
let _crackMat = null;
function crackMat() {
  if (!_crackMat) {
    _crackMat = new THREE.MeshBasicMaterial({
      color: 0x14161d, transparent: true, opacity: 0.85, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2
    });
  }
  return _crackMat;
}

// ---------------------------------------------------------------------------
// Debris pool: fixed-size, physics-lite, settles then freezes.
// ---------------------------------------------------------------------------
class DebrisPool {
  constructor(root, budget) {
    this.root = root;
    this.budget = budget;
    this.group = new THREE.Group();
    this.group.name = 'debris';
    root.add(this.group);
    this.items = [];       // live (simulating)
    this.settled = [];     // frozen, still drawn, recycled oldest-first
    this.free = [];
    this.geos = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.TetrahedronGeometry(0.7),
      new THREE.BoxGeometry(1, 0.35, 1)
    ];
  }

  _acquire(mat) {
    let m = this.free.pop();
    if (!m) {
      if (this.items.length + this.settled.length >= this.budget) {
        // budget reached: retire the oldest SETTLED chunk first, and only
        // steal a live one if nothing has settled yet
        const old = this.settled.shift() || this.items.shift();
        if (!old) return null;
        m = old.mesh;
      } else {
        m = new THREE.Mesh(this.geos[0], mat);
        m.frustumCulled = true;
        this.group.add(m);
      }
    }
    m.geometry = this.geos[(Math.random() * this.geos.length) | 0];
    m.material = mat;
    m.visible = true;
    return m;
  }

  spawn(pos, opts = {}) {
    const mats = debrisMats();
    const mat = mats[opts.kind] || mats.concrete;
    const mesh = this._acquire(mat);
    if (!mesh) return;
    const s = opts.size ?? rand(0.12, 0.34);
    mesh.scale.set(s * rand(0.7, 1.3), s * rand(0.6, 1.2), s * rand(0.7, 1.3));
    mesh.position.copy(pos);
    mesh.rotation.set(rand(0, 6.28), rand(0, 6.28), rand(0, 6.28));
    this.items.push({
      mesh,
      vel: opts.vel ? opts.vel.clone() : v3(rand(-3, 3), rand(2, 7), rand(-3, 3)),
      spin: v3(rand(-9, 9), rand(-9, 9), rand(-9, 9)),
      restY: opts.restY ?? 0,
      rest: 0, life: 0
    });
  }

  update(dt, bounds) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const d = this.items[i];
      d.life += dt;
      d.vel.y -= 22 * dt;
      d.mesh.position.addScaledVector(d.vel, dt);
      d.mesh.rotation.x += d.spin.x * dt;
      d.mesh.rotation.y += d.spin.y * dt;
      d.mesh.rotation.z += d.spin.z * dt;
      const floor = bounds
        ? bounds.floorAt(d.mesh.position.x, d.mesh.position.z, d.mesh.position.y + 0.4)
        : d.restY;
      const rest = floor + d.mesh.scale.y * 0.4;
      if (d.mesh.position.y <= rest) {
        d.mesh.position.y = rest;
        d.vel.y = Math.abs(d.vel.y) * 0.24;     // one small bounce, then done
        d.vel.x *= 0.55; d.vel.z *= 0.55;
        d.spin.multiplyScalar(0.45);
        if (d.vel.lengthSq() < 0.9) d.rest += dt;
      }
      // SETTLE: once it stops moving it stops being simulated. It stays on
      // screen as static geometry; it just costs nothing per frame any more.
      if (d.rest > 0.35 || d.life > 12) {
        d.mesh.rotation.x = Math.round(d.mesh.rotation.x / 1.5708) * 1.5708;
        this.items.splice(i, 1);
        this.settled.push(d);
        if (this.settled.length > this.budget * 0.7) {
          const gone = this.settled.shift();
          gone.mesh.visible = false;
          this.free.push(gone.mesh);
        }
      }
    }
  }

  setBudget(n) {
    this.budget = n;
    while (this.settled.length + this.items.length > n) {
      const gone = this.settled.shift() || this.items.shift();
      if (!gone) break;
      gone.mesh.visible = false;
      this.free.push(gone.mesh);
    }
  }

  clear() {
    for (const d of [...this.items, ...this.settled]) { d.mesh.visible = false; this.free.push(d.mesh); }
    this.items.length = 0;
    this.settled.length = 0;
  }
}

// ---------------------------------------------------------------------------
// The system. Maps register destructibles through the kit; combat calls
// damageAt().
// ---------------------------------------------------------------------------
export class Destructibles {
  constructor(root, ctx = {}) {
    this.root = root;
    this.ctx = ctx;                       // {fx, sfx, cam, stage, bounds}
    this.entries = [];
    this.quality = ctx.quality || { debrisBudget: 220, destructionDetail: 1 };
    this.pool = new DebrisPool(root, this.quality.debrisBudget);
    this.grid = new Map();
    this.pending = [];                    // delayed collapses
  }

  _key(x, z) { return (Math.floor(x / 6) * 73856093) ^ (Math.floor(z / 6) * 19349663); }

  // entry: {
  //   group, chunks:[Mesh], hp, center, radius, kind,
  //   colliderIds:[], dropPlatformIds:[], rubble:Group|null,
  //   glass:bool, onDestroyed:fn
  // }
  register(entry) {
    entry.maxHp = entry.hp;
    entry.stage = STAGE.INTACT;
    entry.cracks = null;
    entry.hidden = [];
    this.entries.push(entry);
    const k = this._key(entry.center.x, entry.center.z);
    let list = this.grid.get(k);
    if (!list) this.grid.set(k, list = []);
    list.push(entry);
    // neighbouring cells too, so a big object near a boundary is still found
    return entry;
  }

  _near(pos, radius) {
    const out = [];
    const r = Math.ceil((radius + 6) / 6);
    const cx = Math.floor(pos.x / 6), cz = Math.floor(pos.z / 6);
    for (let i = -r; i <= r; i++) {
      for (let j = -r; j <= r; j++) {
        const list = this.grid.get(((cx + i) * 73856093) ^ ((cz + j) * 19349663));
        if (list) for (const e of list) if (!out.includes(e)) out.push(e);
      }
    }
    return out;
  }

  // The single entry point for every damage source in the game.
  // opts.kind steers the flavour: 'heat' scorches and ignites (Jogo), 'erase'
  // deletes outright regardless of hp (Hollow Purple), 'water' washes, 'body'
  // is a launched fighter hitting geometry.
  damageAt(pos, radius, power, opts = {}) {
    if (!power) return 0;
    let hits = 0;
    for (const e of this._near(pos, radius)) {
      if (e.stage === STAGE.DESTROYED) continue;
      const d = flatDist(e.center, pos);
      if (d > radius + e.radius) continue;
      if (Math.abs(e.center.y - pos.y) > radius + 2.5 + e.radius) continue;
      const falloff = Math.max(0.25, 1 - d / Math.max(0.001, radius + e.radius));
      // HOLLOW PURPLE erases a channel through anything in its path — hp is
      // not consulted, the object is simply gone
      e.hp -= opts.kind === 'erase' ? e.maxHp * 2 : power * falloff;
      hits++;
      this._restage(e, pos, opts);
    }
    return hits;
  }

  _restage(e, from, opts) {
    const f = e.hp / e.maxHp;
    const want = f <= 0 ? STAGE.DESTROYED : f < 0.35 ? STAGE.DAMAGED : f < 0.72 ? STAGE.CRACKED : STAGE.INTACT;
    while (e.stage < want) this._advance(e, from, opts);
  }

  _advance(e, from, opts = {}) {
    e.stage++;
    const { fx, sfx, cam } = this.ctx;
    const detail = this.quality.destructionDetail;
    const at = e.center.clone();

    if (e.stage === STAGE.CRACKED) {
      // CRACKED: fissures appear on the surviving geometry, a puff of dust,
      // and a couple of chips fall off.
      e.cracks = this._makeCracks(e, 3 + Math.round(3 * detail));
      this._dust(at, e.radius * 0.7, 4 + Math.round(5 * detail));
      this._debris(e, 2 + Math.round(3 * detail), 0.6);
      sfx?.crack?.();
    } else if (e.stage === STAGE.DAMAGED) {
      // DAMAGED: real geometry leaves. A third of the chunks are removed and
      // shed as debris; several of the rest are knocked out of alignment so
      // the object visibly sags.
      this._makeCracks(e, 4 + Math.round(4 * detail));
      const take = Math.max(1, Math.floor(e.chunks.length * 0.34));
      for (let i = 0; i < take; i++) {
        const c = e.chunks.find(c => c.visible && !c.userData.keep);
        if (!c) break;
        c.visible = false;
        e.hidden.push(c);
      }
      for (const c of e.chunks) {
        if (!c.visible || Math.random() > 0.5) continue;
        c.rotation.z += rand(-0.16, 0.16);
        c.rotation.x += rand(-0.10, 0.10);
        c.position.y -= rand(0, 0.08);
        c.position.x += rand(-0.05, 0.05);
      }
      this._dust(at, e.radius, 8 + Math.round(10 * detail));
      this._debris(e, 4 + Math.round(6 * detail), 1.0);
      sfx?.crack?.();
      cam?.shake(0.16);
    } else if (e.stage >= STAGE.DESTROYED) {
      this._destroy(e, from, opts);
    }
  }

  _destroy(e, from, opts = {}) {
    const { fx, sfx, cam } = this.ctx;
    const detail = this.quality.destructionDetail;
    for (const c of e.chunks) c.visible = false;
    if (e.cracks) e.cracks.visible = false;
    if (e.rubble) e.rubble.visible = true;
    this._debris(e, 8 + Math.round(16 * detail), 1.6, from);
    this._dust(e.center, e.radius * 1.4, 12 + Math.round(16 * detail));
    // STRUCTURAL CONSEQUENCE: the colliders die, so the space changes shape.
    const bounds = this.ctx.bounds;
    if (bounds) {
      for (const id of e.colliderIds || []) bounds.remove(id);
      // a pillar coming down takes the floor section it was holding with it,
      // on a short delay so the collapse reads as a collapse
      if (e.dropPlatformIds?.length) {
        this.pending.push({ t: 0.45, ids: e.dropPlatformIds, at: e.center.clone(), drop: e.dropMeshes || [] });
      }
    }
    if (e.glass) sfx?.glassBreak?.(); else sfx?.rubble?.();
    cam?.shake(e.radius > 1.6 ? 0.5 : 0.25);
    e.onDestroyed?.(this);
  }

  _makeCracks(e, n) {
    if (this.quality.destructionDetail <= 0) return e.cracks;
    let g = e.cracks;
    if (!g) {
      g = new THREE.Group();
      e.group.add(g);
      e.cracks = g;
    }
    g.visible = true;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(crackGeo(), crackMat());
      const r = e.radius;
      m.position.set(rand(-r, r) * 0.8, rand(0.1, e.height ?? r * 2) * 0.9, rand(-r, r) * 0.8);
      // lay it against the nearest face
      m.lookAt(m.position.clone().multiplyScalar(3));
      m.scale.set(rand(0.06, 0.13), rand(0.35, 0.95) * (e.height ?? 1.2), 1);
      m.rotation.z += rand(-0.5, 0.5);
      g.add(m);
    }
    return g;
  }

  _dust(at, radius, n) {
    const fx = this.ctx.fx;
    if (!fx) return;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, radius);
      fx._spawn(at.clone().add(v3(Math.cos(a) * r, rand(-0.4, 1.2), Math.sin(a) * r)), {
        color: Math.random() < 0.4 ? 0xb8b4ae : 0x8a8880,
        size: rand(0.3, 0.95), life: rand(0.5, 1.3), opacity: 0.42,
        vel: v3(Math.cos(a) * rand(0.6, 2.4), rand(0.4, 1.8), Math.sin(a) * rand(0.6, 2.4))
      });
    }
  }

  _debris(e, n, force, from) {
    const dir = from ? e.center.clone().sub(from).setY(0).normalize() : null;
    for (let i = 0; i < n; i++) {
      const p = e.center.clone().add(v3(rand(-1, 1) * e.radius, rand(-0.4, 1) * (e.height ?? 1), rand(-1, 1) * e.radius));
      const vel = v3(rand(-4, 4), rand(2, 8), rand(-4, 4)).multiplyScalar(force);
      if (dir) vel.addScaledVector(dir, rand(2, 7) * force);
      this.pool.spawn(p, { kind: e.kind, size: rand(0.1, 0.3) * (e.debrisScale ?? 1), vel, restY: e.baseY ?? 0 });
    }
    if (e.glass && this.ctx.fx) {
      for (let i = 0; i < n; i++) {
        this.ctx.fx._spawn(e.center.clone().add(v3(rand(-1, 1) * e.radius, rand(0, 1.4), rand(-1, 1) * e.radius)), {
          color: 0xcfe4f2, size: rand(0.08, 0.2), aspect: 0.4, life: rand(0.4, 0.9),
          vel: v3(rand(-5, 5), rand(1, 6), rand(-5, 5)), gravity: 16
        });
      }
    }
  }

  update(dt) {
    this.pool.update(dt, this.ctx.bounds);
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      p.t -= dt;
      if (p.t > 0) continue;
      // the delayed floor collapse
      for (const id of p.ids) this.ctx.bounds?.remove(id);
      for (const m of p.drop) m.visible = false;
      this._dust(p.at, 3, 18);
      this.ctx.cam?.shake(0.6);
      this.ctx.sfx?.rubble?.();
      this.pending.splice(i, 1);
    }
  }

  setQuality(q) {
    this.quality = q;
    this.pool.setBudget(q.debrisBudget);
  }

  // between rounds: put the level back the way it was
  reset() {
    this.pool.clear();
    this.pending.length = 0;
    for (const e of this.entries) {
      e.hp = e.maxHp;
      e.stage = STAGE.INTACT;
      for (const c of e.chunks) { c.visible = true; c.position.copy(c.userData.home); c.rotation.copy(c.userData.homeRot); }
      e.hidden.length = 0;
      if (e.cracks) { e.group.remove(e.cracks); e.cracks = null; }
      if (e.rubble) e.rubble.visible = false;
      for (const m of e.dropMeshes || []) m.visible = true;
      for (const id of e.colliderIds || []) this.ctx.bounds?.restore(id);
      for (const id of e.dropPlatformIds || []) this.ctx.bounds?.restore(id);
    }
  }
}
