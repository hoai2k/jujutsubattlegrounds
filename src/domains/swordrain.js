// The katana field inside Authentic Mutual Love: a volley rains down and
// embeds point-first, scattered (never gridded) with a blade or two near each
// fighter. Running into one picks it up; the nearest blade to Yuta highlights
// so pickup routing stays readable at speed. When the field runs dry a small
// refill volley drops after a delay. Placement uses the domain's seeded RNG so
// a whole run is reproducible from the seed in the debug overlay.
import * as THREE from 'three';
import { makeGlowMat } from '../arena/arena.js';
import { flatDist, v3 } from '../core/mathutil.js';

const FIELD_R = 11;       // keep blades inside the sword-field floor
const EMBED_Y = -0.18;    // tip sinks this far into the ground when set
const FALL_SPEED = 26;
const MIN_GAP = 1.7;      // no two blades this close — reads as scattered, not clumped
const PICKUP_STATES = ['idle', 'walk', 'run', 'dash', 'land'];

export class SwordRain {
  constructor(match, caster, cfg, rng) {
    this.match = match;
    this.caster = caster;
    this.cfg = cfg;
    this.rng = rng;
    this.group = new THREE.Group();
    this.group.name = 'swordRain';
    match.root.add(this.group);
    this.swords = [];
    this.refillT = 0;
    this.t = 0;
    // hard floor: 6 is a balance constraint, not a suggestion
    this.spawnVolley(Math.max(6, cfg.volley ?? 6), true);
  }

  get remaining() { return this.swords.filter(s => s.set).length; }
  get falling() { return this.swords.some(s => !s.set); }

  nearestPos(pos) {
    let best = null, bd = Infinity;
    for (const s of this.swords) {
      if (!s.set) continue;
      const d = flatDist(pos, s.g.position);
      if (d < bd) { bd = d; best = s; }
    }
    return best ? best.g.position : null;
  }

  // ---- spawning -------------------------------------------------------------
  spawnVolley(n, initial) {
    const spots = this._scatter(n, initial);
    spots.forEach((p, i) => this.swords.push(this._makeSword(p, i * 0.06)));
    this.match.sfx.swordRain();
  }

  // scattered placement: one blade seeded near each fighter, the rest spread
  // over the field with a minimum gap
  _scatter(n, initial) {
    const spots = [];
    const fits = p => Math.hypot(p.x, p.z) < FIELD_R
      && spots.every(q => Math.hypot(p.x - q.x, p.z - q.z) > MIN_GAP);
    const near = f => {
      for (let i = 0; i < 20; i++) {
        const a = this.rng() * Math.PI * 2, r = 2.6 + this.rng() * 1.2;
        const p = { x: f.pos.x + Math.sin(a) * r, z: f.pos.z + Math.cos(a) * r };
        if (fits(p)) return p;
      }
      return null;
    };
    if (initial) {
      for (const f of this.match.fighters) {
        const p = near(f);
        if (p && spots.length < n) spots.push(p);
      }
    }
    while (spots.length < n) {
      let p = null;
      for (let i = 0; i < 24 && !p; i++) {
        const a = this.rng() * Math.PI * 2;
        const r = 2.5 + Math.sqrt(this.rng()) * (FIELD_R - 2.6);
        const q = { x: Math.sin(a) * r, z: Math.cos(a) * r };
        if (fits(q)) p = q;
      }
      spots.push(p || { x: Math.sin(this.rng() * 6.28) * 6, z: Math.cos(this.rng() * 6.28) * 6 });
    }
    return spots;
  }

  _makeSword(p, fallDelay) {
    const g = new THREE.Group();
    // tip at the group origin, blade rising from it — embed by sinking the group.
    // Cursed-energy green so the pickable volley reads against the dim
    // decorative blade forest of the environment.
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.022), makeGlowMat(0xb0ffdd, 0.85));
    blade.position.y = 0.47;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.045),
      new THREE.MeshBasicMaterial({ color: 0x2a2d38 }));
    guard.position.y = 0.93;
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.015, 0.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x1c2133 }));
    hilt.position.y = 1.04;
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 10), makeGlowMat(0x9ff5c9, 0.9));
    wrap.rotation.x = Math.PI / 2;
    wrap.position.y = 1.0;
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), makeGlowMat(0x9ff5c9, 0.25));
    halo.position.y = 0.3;
    halo.userData.billboard = true;
    g.add(blade, guard, hilt, wrap, halo);
    // flat ground ring: marks the pickup spot even when the blade is occluded
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 6, 24), makeGlowMat(0x9ff5c9, 0.3));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, 0.05, p.z);
    this.group.add(ring);
    g.position.set(p.x, 7 + this.rng() * 3, p.z);
    g.rotation.set((this.rng() - 0.5) * 0.45, this.rng() * Math.PI * 2, (this.rng() - 0.5) * 0.45);
    this.group.add(g);
    return { g, blade, halo, ring, set: false, fallDelay, phase: this.rng() * 6.28 };
  }

  // ---- per-tick ---------------------------------------------------------------
  update(dt) {
    this.t += dt;
    const c = this.caster;
    const fx = this.match.fx;

    // falling volley
    for (const s of this.swords) {
      if (s.set) continue;
      if (s.fallDelay > 0) { s.fallDelay -= dt; continue; }
      s.g.position.y -= FALL_SPEED * dt;
      if (s.g.position.y <= EMBED_Y) {
        s.g.position.y = EMBED_Y;
        s.set = true;
        fx._ring(s.g.position.clone().setY(0.06), 0x9ff5c9, { size: 0.3, growRate: 5, life: 0.3 });
      }
    }

    // glow pulse + nearest-blade highlight
    let nearest = null, bd = Infinity;
    if (!c.heldSword) {
      for (const s of this.swords) {
        if (!s.set) continue;
        const d = flatDist(c.pos, s.g.position);
        if (d < bd) { bd = d; nearest = s; }
      }
    }
    for (const s of this.swords) {
      if (!s.set) continue;
      const hot = s === nearest;
      const k = Math.sin(this.t * (hot ? 7 : 4) + s.phase);
      s.blade.material.opacity = 0.66 + k * 0.16 + (hot ? 0.18 : 0);
      s.halo.material.opacity = hot ? 0.5 + k * 0.2 : 0.18 + k * 0.06;
      s.halo.scale.setScalar(hot ? 1.35 + k * 0.15 : 1);
      s.ring.material.opacity = hot ? 0.55 + k * 0.25 : 0.2 + k * 0.08;
      s.ring.scale.setScalar(hot ? 1.25 + k * 0.1 : 1);
    }

    // run-into pickup: no button press, so it stays fluid at speed
    if (nearest && bd < (this.cfg.pickupRadius ?? 1.2)
      && c.grounded && PICKUP_STATES.includes(c.state)) {
      this._pickup(nearest);
    }

    // economy: never let the arena sit empty for long
    if (this.swords.length === 0 && !c.heldSword) {
      this.refillT += dt;
      if (this.refillT >= (this.cfg.refillDelay ?? 1.6)) {
        this.refillT = 0;
        this.spawnVolley(Math.max(1, this.cfg.refill ?? 3), false);
        this.match.hud.toast(c, 'SWORD REFILL');
      }
    } else this.refillT = 0;
  }

  _pickup(s) {
    this.swords.splice(this.swords.indexOf(s), 1);
    this.group.remove(s.g, s.ring);
    const p = s.g.position.clone().setY(0.6);
    for (let i = 0; i < 8; i++) {
      this.match.fx._spawn(p, {
        color: 0x9ff5c9, size: 0.12 + this.rng() * 0.14, life: 0.3,
        vel: v3((this.rng() - 0.5) * 4, 1 + this.rng() * 3, (this.rng() - 0.5) * 4)
      });
    }
    this.caster.heldSword = true;
    this.caster.startSwordPickup();
  }

  // collapse: remaining blades shatter into cursed-energy motes
  dispose(shatter) {
    if (shatter) {
      for (const s of this.swords) {
        const p = s.g.position.clone().setY(Math.max(0.5, s.g.position.y + 0.5));
        for (let i = 0; i < 6; i++) {
          this.match.fx._spawn(p, {
            color: i % 2 ? 0x9ff5c9 : 0xd8e4ff, size: 0.1 + this.rng() * 0.18, life: 0.5 + this.rng() * 0.4,
            vel: v3((this.rng() - 0.5) * 5, 1 + this.rng() * 4, (this.rng() - 0.5) * 5), gravity: 3
          });
        }
      }
    }
    this.match.root.remove(this.group);
    this.swords.length = 0;
  }
}
