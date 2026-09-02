// FX — everything visual that is not a character or the stage: hit sparks
// by weight, guard sparks, energy bodies for projectiles, beams, zone marks,
// auras, slashes, summons, domain domes, speed trails, KO burst. All
// procedural, all cheap, all budgeted by tier.
import * as THREE from 'three';
import { Particles } from './particles.js';
import { energyMaterial } from '../art/shaders/toon.js';
import { rand, clamp, v3 } from '../core/math.js';
import { quality } from '../render/quality.js';

const GEO = {};
function geo(shape, size) {
  const key = shape + ':' + size.toFixed(2);
  if (GEO[key]) return GEO[key];
  let g;
  switch (shape) {
    case 'disc': g = new THREE.CylinderGeometry(size, size, size * 0.18, 20); g.rotateX(Math.PI / 2); break;
    case 'crescent': case 'slash': g = new THREE.TorusGeometry(size, size * 0.18, 6, 18, Math.PI * 0.9); g.rotateZ(-Math.PI * 0.45); break;
    case 'wave': g = new THREE.TorusGeometry(size, size * 0.3, 6, 14, Math.PI); g.rotateZ(-Math.PI / 2); break;
    case 'bolt': case 'shot': case 'nail': g = new THREE.ConeGeometry(size * 0.35, size * 2.2, 6); g.rotateX(Math.PI / 2); break;
    case 'ember': case 'bug': g = new THREE.TetrahedronGeometry(size, 0); break;
    case 'ball': g = new THREE.SphereGeometry(size, 12, 10); break;
    case 'shard': case 'ice': g = new THREE.OctahedronGeometry(size, 0); g.scale(0.6, 1.4, 0.6); break;
    case 'shark': case 'fist': g = new THREE.CapsuleGeometry(size * 0.5, size * 1.4, 4, 8); g.rotateX(Math.PI / 2); break;
    case 'junk': case 'box': case 'car': case 'anvil': g = new THREE.BoxGeometry(size * 1.4, size, size * (shape === 'car' ? 2.6 : 1.2)); break;
    case 'pie': g = new THREE.CylinderGeometry(size, size, size * 0.4, 12); break;
    default: g = new THREE.SphereGeometry(size, 14, 12);
  }
  GEO[key] = g; return g;
}

export class FX {
  constructor(stage) {
    this.stage = stage; this.scene = stage.scene;
    this.root = new THREE.Group(); this.root.name = 'fx'; this.scene.add(this.root);
    this.particles = new Particles(this.root, 1600);
    this.timed = [];      // { node, life, t, update }
    this.time = 0;
    this._ringGeo = new THREE.RingGeometry(0.8, 1, 40);
    this._ringGeo.rotateX(-Math.PI / 2);
  }
  add(node, life, update) { this.root.add(node); this.timed.push({ node, life, t: 0, update }); return node; }
  remove(node) { const i = this.timed.findIndex(t => t.node === node); if (i >= 0) this.timed.splice(i, 1); this.root.remove(node); node.traverse?.(o => { if (o.material?.dispose && !o.userData.shared) o.material.dispose(); }); }
  mat(color, o = {}) { return energyMaterial({ color, ...o }); }

  // ---- hits -------------------------------------------------------------
  hitSpark(p, weight = 'light', color = 0xffffff, dir = null) {
    const n = weight === 'crit' ? 34 : weight === 'knockdown' ? 26 : weight === 'heavy' ? 18 : 9;
    const spd = weight === 'light' ? 4 : 7;
    this.particles.emit(p, { color: 0xffffff, count: n, size: weight === 'light' ? 0.16 : 0.24, life: 0.28, vel: dir ? [dir.x * 3, 1, dir.z * 3] : [0, 1.5, 0], velSpread: spd, grav: 12, drag: 3 });
    this.particles.emit(p, { color, count: Math.round(n * 0.6), size: 0.3, life: 0.35, velSpread: spd * 0.7, grav: 6, drag: 4 });
    // the flash card
    const size = weight === 'crit' ? 1.4 : weight === 'knockdown' ? 1.2 : weight === 'heavy' ? 0.9 : 0.55;
    const star = new THREE.Mesh(this._star(), this.mat(weight === 'crit' ? 0xffe0a0 : 0xffffff, { opacity: 1, additive: true, fresnel: 0.2 }));
    star.position.copy(p); star.scale.setScalar(size); star.userData.billboard = true; star.rotation.z = rand(6.28);
    this.add(star, weight === 'light' ? 0.12 : 0.18, (o, k) => { o.scale.setScalar(size * (1 + k * 1.4)); o.material.uniforms.uOpacity.value = 1 - k; });
    // ink burst lines for heavy+
    if (weight !== 'light') this.burstLines(p, weight === 'crit' ? 14 : 9, size * 1.4, color);
  }
  _star() { if (this._starGeo) return this._starGeo; const s = new THREE.Shape(); const n = 8; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, r = i % 2 ? 0.28 : 1; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(r, 0); } this._starGeo = new THREE.ShapeGeometry(s); return this._starGeo; }
  burstLines(p, n, r, color) {
    const g = new THREE.BufferGeometry(); const pos = [];
    for (let i = 0; i < n; i++) { const a = rand(6.28), e = rand(-0.6, 0.6); const d = v3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)); const r0 = r * rand(0.3, 0.6), r1 = r * rand(1.0, 1.8); pos.push(p.x + d.x * r0, p.y + d.y * r0, p.z + d.z * r0, p.x + d.x * r1, p.y + d.y * r1, p.z + d.z * r1); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1, toneMapped: false });
    const l = new THREE.LineSegments(g, m);
    this.add(l, 0.14, (o, k) => { o.material.opacity = 1 - k; });
  }
  guardSpark(p, color = 0x8fd4ff) {
    this.particles.emit(p, { color: 0xbfe8ff, count: 10, size: 0.14, life: 0.25, velSpread: 4, grav: 8 });
    const ring = new THREE.Mesh(this._ringGeo, this.mat(color, { opacity: 0.9, additive: true, fresnel: 0.3 }));
    ring.position.copy(p); ring.userData.billboard = true; ring.scale.setScalar(0.5);
    this.add(ring, 0.16, (o, k) => { o.scale.setScalar(0.5 + k * 0.9); o.material.uniforms.uOpacity.value = 1 - k; });
  }
  guardBreak(p) { this.hitSpark(p, 'knockdown', 0xffa040); this.shockRing(p, 1.6, 0xffc060); }
  armorFlash(p, color = 0xffd080) { this.particles.emit(p, { color, count: 8, size: 0.2, life: 0.3, velSpread: 2 }); }
  shockRing(p, size = 1.2, color = 0xffffff) {
    const ring = new THREE.Mesh(this._ringGeo, this.mat(color, { opacity: 0.9, additive: true, fresnel: 0.2 }));
    ring.position.set(p.x, p.y + 0.05, p.z); ring.scale.setScalar(0.3);
    this.add(ring, 0.35, (o, k) => { o.scale.setScalar(0.3 + k * size * 2.5); o.material.uniforms.uOpacity.value = (1 - k) * 0.9; });
    this.particles.emit(p, { color: 0xc0b0a0, count: 14, size: 0.35, life: 0.6, vel: [0, 1.5, 0], velSpread: 3, grav: 4, alpha: 0.5 });
  }
  blackFlash(p) {
    this.hitSpark(p, 'crit', 0xff2020);
    this.particles.emit(p, { color: 0xff2020, count: 50, size: 0.35, life: 0.5, velSpread: 9, grav: 6 });
    this.particles.emit(p, { color: 0x101010, count: 30, size: 0.5, life: 0.5, velSpread: 6, alpha: 0.8 });
    this.shockRing(p, 2.4, 0xff3030);
  }
  pop(p, color) { this.particles.emit(p, { color, count: 8, size: 0.2, life: 0.3, velSpread: 3, drag: 4 }); }
  sureHit(p, color) { this.particles.emit(p, { color, count: 6, size: 0.25, life: 0.4, vel: [0, 1, 0], velSpread: 1.5 }); }

  // ---- techniques -------------------------------------------------------
  body(shape, size, color, at, life = 8) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(geo(shape, size), this.mat(color, { opacity: 1, additive: true, fresnel: 0.9, pulse: 0.2 }));
    const halo = new THREE.Mesh(geo('orb', size * 1.6), this.mat(color, { opacity: 0.35, additive: true, fresnel: 2.2 }));
    g.add(core, halo); g.position.copy(at);
    g.userData.spin = shape === 'disc' ? 22 : shape === 'ball' ? 6 : 0;
    const light = quality().bloom;
    this.add(g, life, (o, k, dt) => { core.material.uniforms.uTime.value += dt; if (!light) return; this.particles.emit(o.position, { color, count: 1, size: size * 0.6, life: 0.3, velSpread: 0.6, alpha: 0.7 }); });
    if (shape === 'crescent' || shape === 'slash') g.rotation.y = 0;
    return g;
  }
  beam(origin, dir, range, width, color, shape) {
    const g = new THREE.Group();
    const cyl = new THREE.CylinderGeometry(width * 0.5, width * 0.35, range, 12, 1, true);
    cyl.rotateX(Math.PI / 2); cyl.translate(0, 0, range / 2);
    const m = new THREE.Mesh(cyl, this.mat(color, { opacity: 0.9, additive: true, fresnel: 1.2 }));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.18, width * 0.12, range, 8, 1, true).rotateX(Math.PI / 2).translate(0, 0, range / 2), this.mat(0xffffff, { opacity: 0.9, additive: true, fresnel: 0.1 }));
    g.add(m, core); g.position.copy(origin); g.lookAt(origin.clone().add(dir));
    this.add(g, 0.4, (o, k) => { const s = 1 - k * k; m.material.uniforms.uOpacity.value = s; core.material.uniforms.uOpacity.value = s; o.scale.set(1 + k * 0.6, 1 + k * 0.6, 1); });
    for (let i = 0; i < 12; i++) this.particles.emit(origin.clone().addScaledVector(dir, range * i / 12), { color, count: 2, size: width * 0.5, life: 0.4, velSpread: 1.5 });
    return g;
  }
  zoneMark(at, radius, color, shape, delay) {
    const ring = new THREE.Mesh(this._ringGeo, this.mat(color, { opacity: 0.8, additive: true, fresnel: 0.2 }));
    ring.position.set(at.x, at.y + 0.04, at.z); ring.scale.setScalar(radius);
    const pillar = shape === 'pillar' || shape === 'crystal' || shape === 'ice' ? new THREE.Mesh(shape === 'pillar' ? new THREE.CylinderGeometry(radius * 0.5, radius * 0.7, 3, 10, 1, true) : new THREE.OctahedronGeometry(radius * 0.7, 0), this.mat(color, { opacity: 0.8, additive: true, fresnel: 1.4 })) : null;
    if (pillar) { pillar.position.set(at.x, at.y + 1.2, at.z); pillar.scale.setScalar(0.01); }
    const g = new THREE.Group(); g.add(ring); if (pillar) g.add(pillar);
    this.add(g, delay + 0.5, (o, k, dt, t) => { const pre = clamp(t / Math.max(0.01, delay), 0, 1); ring.material.uniforms.uOpacity.value = 0.3 + pre * 0.7; ring.scale.setScalar(radius * (0.3 + pre * 0.7)); if (pillar) { const post = clamp((t - delay) / 0.3, 0, 1); pillar.scale.set(post, post * 1.2, post); pillar.material.uniforms.uOpacity.value = 1 - clamp((t - delay - 0.2) / 0.3, 0, 1); } });
    return g;
  }
  burst(p, radius, color, shape = 'ring') {
    this.shockRing(p, radius * 0.7, color);
    this.particles.emit(v3(p.x, p.y + 0.6, p.z), { color, count: Math.round(10 + radius * 6), size: 0.35, life: 0.5, vel: [0, 2, 0], velSpread: radius * 1.8, grav: 8, drag: 2 });
    const dome = new THREE.Mesh(geo('orb', 1), this.mat(color, { opacity: 0.5, additive: true, fresnel: 1.8 }));
    dome.position.set(p.x, p.y + 0.2, p.z); dome.scale.setScalar(0.2);
    this.add(dome, 0.28, (o, k) => { o.scale.setScalar(0.2 + k * radius); o.material.uniforms.uOpacity.value = 0.6 * (1 - k); });
  }
  slash(caster, reach, arc, color, shape) {
    const g = new THREE.Mesh(new THREE.RingGeometry(reach * 0.55, reach * 1.05, 24, 1, -arc / 2, arc), this.mat(color, { opacity: 0.85, additive: true, fresnel: 0.2 }));
    g.rotation.x = -Math.PI / 2; g.rotation.z = -Math.PI / 2;
    const grp = new THREE.Group(); grp.add(g);
    grp.position.set(caster.pos.x, caster.pos.y + 1.1, caster.pos.z); grp.rotation.y = caster.facing;
    grp.rotation.x = shape === 'thrust' ? 0 : rand(-0.5, 0.5);
    this.add(grp, 0.18, (o, k) => { g.material.uniforms.uOpacity.value = 0.9 * (1 - k); o.scale.set(1 + k * 0.3, 1, 1 + k * 0.3); });
    this.particles.emit(caster.pos.clone().addScaledVector(caster.forward(), reach * 0.7).setY(caster.pos.y + 1.1), { color, count: 10, size: 0.22, life: 0.3, velSpread: 3 });
  }
  aura(f, color, k = 0.6) {
    const p = f.chest;
    this.particles.emit(v3(p.x, p.y - 0.6, p.z), { color, count: Math.round(18 * k + 6), size: 0.3, life: 0.7, vel: [0, 2.5, 0], velSpread: 1.2, spread: 0.4, drag: 1 });
    const sh = new THREE.Mesh(geo('orb', 1), this.mat(color, { opacity: 0.4 * k, additive: true, fresnel: 2.4 }));
    sh.position.copy(p); sh.scale.set(0.8, 1.2, 0.8);
    this.add(sh, 0.5, (o, kk) => { o.position.copy(f.chest); o.scale.setScalar(0.8 + kk * 0.6); o.material.uniforms.uOpacity.value = 0.4 * k * (1 - kk); });
  }
  trail(f, color, seconds) {
    this.add(new THREE.Group(), seconds, (o, k, dt) => { this.particles.emit(f.chest, { color, count: 3, size: 0.4, life: 0.35, velSpread: 0.5, alpha: 0.7, spread: 0.3 }); });
  }
  blink(p, color) { this.particles.emit(v3(p.x, p.y + 1, p.z), { color, count: 24, size: 0.25, life: 0.35, velSpread: 4, drag: 3 }); this.shockRing(p, 0.8, color); }
  clap(a, b, color) { this.blink(a, color); this.blink(b, color); this.stage.impactFrame(2, 0x0a0410, 0xffe0ff); }
  speech(f, color, range) { const p = f.chest.clone().setY(f.chest.y + 0.35); this.particles.emit(p, { color, count: 30, size: 0.3, life: 0.5, vel: [f.forward().x * range * 1.5, 0, f.forward().z * range * 1.5], velSpread: 2, drag: 1 }); this.shockRing(p, range * 0.4, color); }
  summon(color, size) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45 * size, 1), this.mat(color, { opacity: 0.85, additive: false, fresnel: 1.1, pulse: 0.15 }));
    const halo = new THREE.Mesh(geo('orb', 0.7 * size), this.mat(color, { opacity: 0.3, additive: true, fresnel: 2 }));
    g.add(body, halo); g.userData.spin = 2;
    this.add(g, 999, (o, k, dt) => { body.material.uniforms.uTime.value += dt; this.particles.emit(o.position, { color, count: 1, size: 0.25, life: 0.4, vel: [0, 1, 0], velSpread: 0.5, alpha: 0.6 }); });
    return g;
  }
  // ---- domains ------------------------------------------------------------
  domain(env, radius, at, color) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 40, 24), this.mat(color, { opacity: 0.35, additive: false, fresnel: 1.6, pulse: 0.05 }));
    dome.material.side = THREE.BackSide;
    const outer = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.02, 40, 24), this.mat(color, { opacity: 0.18, additive: true, fresnel: 2.4 }));
    const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), this.mat(color, { opacity: 0.25, additive: true, fresnel: 0.2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.03;
    g.add(dome, outer, floor); g.position.set(at.x, 0, at.z); g.userData.color = color; g.userData.radius = radius;
    this.root.add(g);
    this.timed.push({ node: g, life: 999, t: 0, update: (o, k, dt) => { dome.material.uniforms.uTime.value += dt; if (Math.random() < 0.5) this.particles.emit(v3(at.x + rand(-radius, radius) * 0.7, 0.2, at.z + rand(-radius, radius) * 0.7), { color, count: 1, size: 0.3, life: 1.5, vel: [0, 1.2, 0], velSpread: 0.3, alpha: 0.5 }); } });
    return g;
  }
  updateDomain(node, dt) { }
  removeDomain(node) { this.remove(node); }
  // ---- KO --------------------------------------------------------------------
  ko(p, color) {
    this.hitSpark(p, 'crit', color);
    this.particles.emit(p, { color, count: 60, size: 0.4, life: 1.2, velSpread: 9, grav: 6, drag: 1.5 });
    this.shockRing(p, 4, color);
  }
  dust(p, k = 1) { this.particles.emit(v3(p.x, p.y + 0.1, p.z), { color: 0xb0a898, count: Math.round(6 * k), size: 0.3, life: 0.5, vel: [0, 0.6, 0], velSpread: 1.4 * k, alpha: 0.4, drag: 3 }); }
  update(dt) {
    this.time += dt;
    this.particles.update(dt);
    for (let i = this.timed.length - 1; i >= 0; i--) {
      const t = this.timed[i]; t.t += dt;
      const k = clamp(t.t / t.life, 0, 1);
      t.update?.(t.node, k, dt, t.t);
      if (t.t >= t.life) { this.root.remove(t.node); this.timed.splice(i, 1); }
    }
  }
  clear() { for (const t of this.timed) this.root.remove(t.node); this.timed.length = 0; this.particles.clear(); }
}
