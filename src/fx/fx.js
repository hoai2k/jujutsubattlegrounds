// Procedural VFX: pooled billboard particles, shockwave rings, technique
// flashes, blob contact shadows. All textures generated to canvas at runtime.
import * as THREE from 'three';
import { makeGlowMat } from '../arena/arena.js';
import { buildRika } from '../art/models/rika.js';
import { rand, v3 } from '../core/mathutil.js';

function shadowTexture() {
  // white radial with alpha falloff; tinted black by the material so the
  // contact shadow always darkens regardless of blending quirks
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.42)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export class FXSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.parts = [];         // {mesh, vel, life, maxLife, grow, fade, spin}
    this.rings = [];         // {mesh, life, maxLife, growRate}
    this.shadows = [];       // {mesh, fighter}
    this.auras = [];         // {mesh, fighter, t, color}
    this.beams = [];
    this.rika = null;        // lazy spectral Rika
    this.rikaTimer = 0;
    this._shadowTex = shadowTexture();
  }

  attachShadow(fighter) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: this._shadowTex, color: 0x000000, transparent: true, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    this.scene.add(mesh);
    this.shadows.push({ mesh, fighter });
  }

  _spawn(pos, opts = {}) {
    const size = opts.size ?? 0.3;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size * (opts.aspect ?? 1)), makeGlowMat(opts.color ?? 0xffffff, opts.opacity ?? 1));
    mesh.position.copy(pos);
    this.scene.add(mesh);
    const p = {
      mesh,
      vel: opts.vel || v3(rand(-1, 1), rand(0.5, 2.5), rand(-1, 1)),
      life: opts.life ?? 0.4, maxLife: opts.life ?? 0.4,
      grow: opts.grow ?? 0, gravity: opts.gravity ?? 0, spin: opts.spin ?? 0
    };
    this.parts.push(p);
    return p;
  }

  _ring(pos, color, { size = 0.4, growRate = 6, life = 0.35, flat = true } = {}) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(size, size * 0.14, 6, 26), makeGlowMat(color, 0.9));
    mesh.position.copy(pos);
    if (flat) mesh.rotation.x = -Math.PI / 2;
    else mesh.quaternion.copy(this.camera.quaternion);
    this.scene.add(mesh);
    this.rings.push({ mesh, life, maxLife: life, growRate });
  }

  hitSpark(pos, kind = 'light') {
    const color = kind === 'crit' ? 0xffb03c : kind === 'heavy' ? 0xffd98f : 0xcfe4ff;
    const n = kind === 'light' ? 7 : 12;
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(pos, {
        color, size: rand(0.1, 0.24), life: rand(0.18, 0.32),
        vel: v3(Math.cos(a) * rand(2, 5.5), rand(-1.5, 3.5), Math.sin(a) * rand(2, 5.5)),
        gravity: 6
      });
    }
    this._ring(pos, color, { size: 0.25, growRate: kind === 'light' ? 5 : 8, life: 0.22, flat: false });
    if (kind === 'crit') this._ring(pos, 0xff7838, { size: 0.4, growRate: 10, life: 0.3, flat: false });
  }

  ratioMark(pos) {
    // 7:3 line flash — Nanami's signature
    const bar = this._spawn(pos, { color: 0xffd98f, size: 1.4, aspect: 0.06, life: 0.3, vel: v3(), spin: 0 });
    bar.mesh.quaternion.copy(this.camera.quaternion);
    bar.mesh.rotateZ(0.4);
    const notch = this._spawn(pos.clone().add(v3(0.28, 0.12, 0)), { color: 0xffffff, size: 0.34, aspect: 0.12, life: 0.3, vel: v3() });
    notch.mesh.quaternion.copy(this.camera.quaternion);
    notch.mesh.rotateZ(-1.1);
  }

  guardSpark(pos) {
    for (let i = 0; i < 5; i++) {
      this._spawn(pos, { color: 0x9fd0ff, size: rand(0.08, 0.16), life: 0.2, vel: v3(rand(-2, 2), rand(0, 2), rand(-2, 2)) });
    }
    this._ring(pos, 0x86c8ff, { size: 0.5, growRate: 2.5, life: 0.2, flat: false });
  }

  guardBreak(pos) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this._spawn(pos, { color: 0xa8ccff, size: rand(0.14, 0.3), life: 0.5, vel: v3(Math.cos(a) * 6, rand(1, 4), Math.sin(a) * 6), gravity: 8 });
    }
    this._ring(pos, 0xcfe4ff, { size: 0.4, growRate: 12, life: 0.4, flat: false });
  }

  armorFlash(pos) {
    this._ring(pos, 0x9ff5c9, { size: 0.6, growRate: 3, life: 0.25, flat: false });
  }

  dashTrail(fighter) {
    const p = fighter.pos.clone().add(v3(0, 1, 0));
    for (let i = 0; i < 4; i++) {
      this._spawn(p, {
        color: fighter.model.palette.energy ?? 0x9fd0ff, size: rand(0.2, 0.45), life: 0.25,
        vel: fighter.forward().multiplyScalar(-rand(2, 4)).add(v3(rand(-1, 1), rand(0, 1), rand(-1, 1)))
      });
    }
  }

  jumpPuff(pos) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this._spawn(pos.clone().setY(0.1), { color: 0xb8c0d8, size: 0.22, life: 0.3, vel: v3(Math.cos(a) * 2.4, 0.4, Math.sin(a) * 2.4), opacity: 0.5 });
    }
  }

  // MEGUMI'S TAUNT. Something surfaces in the shadow at his feet for a beat
  // and sinks again — the half of the joke his skeleton cannot tell. Kept
  // deliberately vague and small: it is a shape in the dark that he glances at
  // and dismisses, not a summon, and reading clearly as a Divine Dog would make
  // it look like a technique came out.
  shadowPuff(pos) {
    const base = pos.clone().setY(0.06);
    this._ring(base, 0x2a2f4a, { size: 0.34, growRate: 2.2, life: 0.9 });
    // the shape: a few dark motes that RISE, hang, and drop back in
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = rand(0.12, 0.3);
      this._spawn(base.clone().add(v3(Math.cos(a) * r, 0, Math.sin(a) * r)), {
        color: i % 3 ? 0x161a2c : 0x4a5580, size: rand(0.14, 0.26),
        life: rand(0.6, 0.95), vel: v3(rand(-0.3, 0.3), rand(1.1, 1.9), rand(-0.3, 0.3)),
        gravity: 5.2, opacity: 0.85
      });
    }
  }

  // ---- techniques ---------------------------------------------------------
  redBlast(caster, range) {
    const origin = caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(caster.forward(), 0.7);
    const core = this._spawn(origin, { color: 0xff5a4a, size: 0.9, life: 0.35, vel: v3(), grow: 9 });
    core.mesh.quaternion.copy(this.camera.quaternion);
    this._ring(origin, 0xff8a6a, { size: 0.5, growRate: 16, life: 0.35, flat: false });
    // rush of particles down range
    const fw = caster.forward();
    for (let i = 0; i < 18; i++) {
      this._spawn(origin, {
        color: i % 3 ? 0xff6a4a : 0xffc0a8, size: rand(0.15, 0.4), life: rand(0.25, 0.45),
        vel: fw.clone().multiplyScalar(rand(10, 22)).add(v3(rand(-2, 2), rand(-1, 2.5), rand(-2, 2)))
      });
    }
  }

  // JOGO — Volcanic Eruption detonation: fire column + magma spray + shock ring
  eruptionBlast(pos, radius) {
    const base = pos.clone().setY(0.1);
    this._ring(base, 0xff5a1f, { size: radius * 0.5, growRate: 18, life: 0.4 });
    this._ring(base, 0xffb03a, { size: radius * 0.35, growRate: 12, life: 0.5 });
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, radius * 0.7);
      this._spawn(base.clone().add(v3(Math.cos(a) * r, 0.1, Math.sin(a) * r)), {
        color: i % 3 === 0 ? 0x3a2a20 : (i % 2 ? 0xff5a1f : 0xffb03a),
        size: rand(0.18, 0.5), life: rand(0.4, 0.8),
        vel: v3(rand(-2, 2), rand(6, 14), rand(-2, 2)), gravity: 14
      });
    }
    // the rising fire column
    for (let i = 0; i < 8; i++) {
      const c = this._spawn(base.clone().add(v3(0, 0.3 + i * 0.28, 0)), {
        color: 0xff7a2f, size: rand(0.5, 1.0) * (1 - i * 0.08), life: 0.35, vel: v3(0, 5, 0), grow: 2
      });
      c.mesh.quaternion.copy(this.camera.quaternion);
    }
  }

  // ---- HANAMI ------------------------------------------------------------
  // ROOT ERUPTION / the Wooden Ball's shatter: a ring of wooden spikes coming
  // up out of the floor, plus turf and splinters. `natural` brightens it — the
  // same move out of soil is a bigger, greener event than out of concrete, and
  // that difference has to be visible without reading the HUD.
  rootBurst(pos, radius, natural = false) {
    const base = pos.clone();
    base.y += 0.06;
    this._ring(base, natural ? 0x9ed86a : 0x6f9a52, { size: radius * 0.5, growRate: 16, life: 0.42 });
    this._ring(base, 0x6a4f34, { size: radius * 0.3, growRate: 10, life: 0.55 });
    const n = natural ? 22 : 15;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
      const r = radius * rand(0.25, 0.92);
      // the spike itself: a tall thin shard driven upward
      const sp = this._spawn(base.clone().add(v3(Math.cos(a) * r, 0.1, Math.sin(a) * r)), {
        color: i % 3 === 0 ? 0x513a26 : 0x6a4f34,
        size: rand(0.5, 1.0), aspect: 0.22, life: rand(0.34, 0.58),
        vel: v3(0, rand(9, 15), 0), gravity: 22
      });
      sp.mesh.quaternion.copy(this.camera.quaternion);
    }
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(base.clone().add(v3(Math.cos(a) * radius * 0.5, 0.1, Math.sin(a) * radius * 0.5)), {
        color: i % 2 ? 0x4e7a3a : 0x76a352, size: rand(0.1, 0.26), life: rand(0.4, 0.8),
        vel: v3(rand(-3, 3), rand(3, 8), rand(-3, 3)), gravity: 12
      });
    }
  }

  // The Wooden Ball itself: an enormous knotted mass hanging overhead while it
  // condenses. Returned as a node so the effect can drop it and release it.
  woodenBall(pos, radius) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x6a4f34 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.55, 1), mat);
    g.add(core);
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), b = rand(-1, 1);
      const s = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.09, radius * 0.44, 4),
        new THREE.MeshBasicMaterial({ color: 0x513a26 }));
      const dir = v3(Math.cos(a) * Math.sqrt(1 - b * b), b, Math.sin(a) * Math.sqrt(1 - b * b));
      s.position.copy(dir).multiplyScalar(radius * 0.6);
      s.lookAt(s.position.clone().add(dir));
      s.rotateX(Math.PI / 2);
      g.add(s);
    }
    g.position.copy(pos);
    g.position.y += 9.5;
    g.userData.y0 = g.position.y;
    this.scene.add(g);
    return g;
  }
  // k: 0 at cast, 1 at impact
  woodenBallFall(node, k) {
    if (!node) return;
    const y0 = node.userData.y0;
    node.position.y = y0 - (y0 - 0.6) * (k * k);
    node.rotation.y += 0.14;
    node.rotation.x += 0.06;
  }

  // ---- KUROURUSHI --------------------------------------------------------
  // CORROSIVE SPRAY: a short amber cone of digestive fluid, thickening toward
  // the mouth and thinning out at the edge of its range.
  corrosiveSpray(caster, reach, arc) {
    const mouth = caster.pos.clone().add(v3(0, 1.30, 0)).addScaledVector(caster.forward(), 0.45);
    const fwd = caster.forward();
    for (let i = 0; i < 30; i++) {
      const t = Math.random();
      const a = (Math.random() - 0.5) * arc;
      const dir = fwd.clone().applyAxisAngle(v3(0, 1, 0), a);
      dir.y += rand(-0.22, 0.10);
      this._spawn(mouth.clone().addScaledVector(dir, t * reach * 0.4), {
        color: Math.random() < 0.35 ? 0xf0c94a : 0xd8a02a,
        size: rand(0.14, 0.34) * (0.5 + t), life: rand(0.22, 0.44),
        vel: dir.multiplyScalar(reach * rand(1.4, 2.4)), gravity: 5
      });
    }
    this._ring(mouth, 0xd8a02a, { size: 0.3, growRate: 5, life: 0.2, flat: false });
  }

  // MAHITO — Soul Touch: a grey-blue grasp closing in front of him
  soulGrasp(caster) {
    const p = caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(caster.forward(), 1.0);
    this._ring(p, 0x8b9bab, { size: 0.5, growRate: -1.6, life: 0.28, flat: false });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      this._spawn(p.clone().add(v3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0)), {
        color: i % 2 ? 0x8b9bab : 0xdfe6ee, size: rand(0.08, 0.18), life: 0.25,
        vel: p.clone().sub(caster.pos.clone().add(v3(0, 1.25, 0))).normalize().multiplyScalar(-2)
          .add(v3(rand(-1, 1), rand(-1, 1), rand(-1, 1)))
      });
    }
  }

  blueOrb(pos) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), makeGlowMat(0x66b8ff, 1));
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), makeGlowMat(0x3c8aff, 0.8));
    halo.userData.billboard = true;
    g.add(core, halo);
    g.position.copy(pos);
    g.userData.spin = true;
    this.scene.add(g);
    return g;
  }

  release(node) {
    // small implosion on release
    for (let i = 0; i < 10; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(node.position, { color: 0x66b8ff, size: 0.18, life: 0.3, vel: v3(Math.cos(a) * -3, rand(-1, 1), Math.sin(a) * -3) });
    }
    this.scene.remove(node);
  }

  purpleBeam(origin, dir) {
    const len = 26;
    const geo = new THREE.CylinderGeometry(0.85, 0.85, len, 14, 1, true);
    const mesh = new THREE.Mesh(geo, makeGlowMat(0xb47fff, 0.95));
    mesh.position.copy(origin).addScaledVector(dir, len / 2);
    mesh.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
    this.scene.add(mesh);
    this.beams.push({ mesh, life: 0.7, maxLife: 0.7 });
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, len, 10, 1, true), makeGlowMat(0xffffff, 1));
    core.position.copy(mesh.position);
    core.quaternion.copy(mesh.quaternion);
    this.scene.add(core);
    this.beams.push({ mesh: core, life: 0.55, maxLife: 0.55 });
    for (let i = 0; i < 30; i++) {
      const t = rand(1, len);
      const p = origin.clone().addScaledVector(dir, t);
      this._spawn(p, { color: i % 2 ? 0xb47fff : 0xe8d0ff, size: rand(0.2, 0.6), life: rand(0.3, 0.7), vel: v3(rand(-3, 3), rand(-1, 4), rand(-3, 3)) });
    }
  }

  rikaFlash(caster, kind) {
    if (!this.rika) {
      this.rika = buildRika();
      this.scene.add(this.rika.group);
      this.rika.setOpacity(0);
    }
    const back = caster.forward().multiplyScalar(-1.2);
    this.rika.group.position.copy(caster.pos).add(back);
    this.rika.group.rotation.y = caster.facing;
    this.rikaTimer = kind === 'blast' ? 0.8 : 0.65;
    const p = caster.pos.clone().add(v3(0, 1.4, 0)).addScaledVector(caster.forward(), 1.4);
    for (let i = 0; i < 12; i++) {
      this._spawn(p, { color: 0x9ff5c9, size: rand(0.2, 0.5), life: 0.4, vel: v3(rand(-4, 4), rand(-1, 4), rand(-4, 4)) });
    }
    this._ring(p, 0x8fe8b8, { size: 0.5, growRate: 9, life: 0.3, flat: false });
  }

  // long-lived Rika manifestation control (domain background presence)
  rikaManifest(on, pos) {
    if (on && !this.rika) {
      this.rika = buildRika();
      this.scene.add(this.rika.group);
    }
    if (this.rika) {
      this.rikaTimer = on ? 1e9 : 0;
      if (pos) this.rika.group.position.copy(pos);
    }
  }

  cleaveArc(caster, big = false) {
    const p = caster.pos.clone().add(v3(0, 1.3, 0)).addScaledVector(caster.forward(), 1.2);
    const arc = this._spawn(p, { color: big ? 0xffc25e : 0xffe2b0, size: big ? 2.6 : 1.9, aspect: 0.16, life: 0.22, vel: v3() });
    arc.mesh.quaternion.copy(this.camera.quaternion);
    arc.mesh.rotateZ(rand(-0.6, 0.2));
    for (let i = 0; i < 8; i++) {
      this._spawn(p, { color: 0xffd98f, size: rand(0.1, 0.2), life: 0.25, vel: v3(rand(-4, 4), rand(-1, 3), rand(-4, 4)) });
    }
  }

  overtimeAura(fighter, duration) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), makeGlowMat(0xffc25e, 0.5));
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.auras.push({ mesh, fighter, t: duration, kind: 'ring' });
  }

  // generic timed ground aura (Resolve, Sukuna form, Black Flash chain stacks)
  buffAura(fighter, duration, color) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), makeGlowMat(color, 0.45));
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    this.auras.push({ mesh, fighter, t: duration, kind: 'ring' });
  }

  // ---- specials -------------------------------------------------------------
  // Gojo's warp: distortion rings at entry and exit, a streak of afterimage
  // motes along the path. No footstep — the sound side is a bare whoosh.
  warpBlink(from, to, color) {
    for (const p of [from, to]) {
      this._ring(p.clone().add(v3(0, 1.1, 0)), color, { size: 0.45, growRate: 6, life: 0.3, flat: false });
      this._ring(p.clone().setY(0.06), color, { size: 0.35, growRate: 4, life: 0.25 });
    }
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = from.clone().lerp(to, t).add(v3(rand(-0.2, 0.2), 1.0 + rand(-0.3, 0.5), rand(-0.2, 0.2)));
      this._spawn(p, { color, size: rand(0.12, 0.3), life: 0.22 + t * 0.1, vel: v3(0, rand(0.2, 1), 0) });
    }
  }

  // Todo's swap: an instantly readable double-snap — burst + ring + a brief
  // vertical afterimage bar at BOTH origins, in his signature color.
  boogieSwap(a, b, color) {
    for (const p of [a, b]) {
      const c = p.clone().add(v3(0, 1.1, 0));
      this._ring(c, color, { size: 0.5, growRate: 9, life: 0.28, flat: false });
      const bar = this._spawn(c, { color, size: 0.55, aspect: 3.2, life: 0.24, vel: v3() });
      bar.mesh.quaternion.copy(this.camera.quaternion);
      bar.mesh.userData.keepQuat = true;
      for (let i = 0; i < 8; i++) {
        const ang = rand(0, Math.PI * 2);
        this._spawn(c, {
          color: i % 3 === 0 ? 0xffffff : color, size: rand(0.1, 0.24), life: 0.3,
          vel: v3(Math.cos(ang) * rand(2, 5), rand(-1, 3), Math.sin(ang) * rand(2, 5)), gravity: 5
        });
      }
    }
  }

  // Nanami's primed 7:3 payoff: big golden ratio markers over the impact,
  // white crack lines, gold burst.
  ratioStrike(pos, level = 2) {
    const gold = 0xffd98f;
    const bar = this._spawn(pos, { color: gold, size: level === 2 ? 2.4 : 1.6, aspect: 0.07, life: 0.4, vel: v3() });
    bar.mesh.quaternion.copy(this.camera.quaternion);
    bar.mesh.rotateZ(0.4);
    bar.mesh.userData.keepQuat = true;
    const notch = this._spawn(pos.clone().add(v3(0.3, 0.2, 0)), { color: 0xffffff, size: 0.5, aspect: 0.1, life: 0.4, vel: v3() });
    notch.mesh.quaternion.copy(this.camera.quaternion);
    notch.mesh.rotateZ(-1.1);
    notch.mesh.userData.keepQuat = true;
    if (level === 2) {
      // screen-crack read: hard white shards radiating from the point
      for (const rot of [0.2, 1.1, 2.0, 2.8]) {
        const shard = this._spawn(pos, { color: 0xffffff, size: rand(1.2, 1.9), aspect: 0.03, life: 0.3, vel: v3() });
        shard.mesh.quaternion.copy(this.camera.quaternion);
        shard.mesh.rotateZ(rot + rand(-0.15, 0.15));
        shard.mesh.userData.keepQuat = true;
      }
    }
    for (let i = 0; i < (level === 2 ? 16 : 8); i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(pos, {
        color: i % 2 ? gold : 0xffffff, size: rand(0.14, 0.34), life: rand(0.3, 0.5),
        vel: v3(Math.cos(a) * rand(3, 8), rand(-1, 5), Math.sin(a) * rand(3, 8)), gravity: 6
      });
    }
    this._ring(pos, gold, { size: 0.4, growRate: 11, life: 0.35, flat: false });
  }

  // Divergent Fist: compact straight-punch shock at the fist
  divergentJab(caster) {
    const p = caster.pos.clone().add(v3(0, 1.3, 0)).addScaledVector(caster.forward(), 1.3);
    this._ring(p, 0xffa04a, { size: 0.3, growRate: 7, life: 0.22, flat: false });
    for (let i = 0; i < 6; i++) {
      this._spawn(p, {
        color: i % 2 ? 0xffa04a : 0xffe0c0, size: rand(0.1, 0.22), life: 0.25,
        vel: caster.forward().multiplyScalar(rand(4, 8)).add(v3(rand(-1.5, 1.5), rand(-1, 2), rand(-1.5, 1.5)))
      });
    }
  }

  // ---- MAHORAGA -------------------------------------------------------------
  // WHEEL SLASH: a wide flat arc of blade light swept across the ground in
  // front of him, plus the debris the sweep tears up.
  wheelArc(caster, reach) {
    const fw = caster.forward();
    const base = caster.pos.clone().setY(0.08);
    this._ring(base.clone().addScaledVector(fw, reach * 0.45), 0xc6ac72,
      { size: reach * 0.42, growRate: 10, life: 0.4 });
    // the blade trail: a fan of bars laid along the sweep
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 2.4;
      const d = fw.clone().applyAxisAngle(v3(0, 1, 0), a);
      const p = caster.pos.clone().setY(1.5 + Math.sin(i / 8 * Math.PI) * 0.5)
        .addScaledVector(d, reach * 0.62);
      const bar = this._spawn(p, {
        color: i % 3 === 0 ? 0xfff0c8 : 0xc6ac72, size: 1.5, aspect: 0.10,
        life: 0.26 + i * 0.008, vel: v3()
      });
      bar.mesh.quaternion.copy(this.camera.quaternion);
      bar.mesh.rotateZ(-a * 0.7 + 0.2);
      bar.mesh.userData.keepQuat = true;
    }
    for (let i = 0; i < 20; i++) {
      const a = rand(-1.3, 1.3);
      const d = fw.clone().applyAxisAngle(v3(0, 1, 0), a);
      this._spawn(caster.pos.clone().setY(0.15).addScaledVector(d, rand(1.5, reach)), {
        color: i % 3 === 0 ? 0xc6ac72 : 0x9a968c, size: rand(0.2, 0.6), life: rand(0.3, 0.6),
        vel: d.multiplyScalar(rand(3, 9)).add(v3(0, rand(1, 4), 0)), gravity: 8
      });
    }
  }

  // WORLD-CUTTING SLASH: a line drawn through the world. A hard white core
  // down the whole range, a gold outer sheath, and the ground opening along it.
  worldCut(caster, dir, range, width) {
    const len = range;
    const yaw = Math.atan2(dir.x, dir.z);
    // THE CUT LINE ON THE GROUND is the primary read — playtest showed that
    // leading with the vertical plane made it look like a light pillar rather
    // than a slash across the arena.
    const scar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.06, len), makeGlowMat(0xfff0c8, 1));
    scar.position.copy(caster.pos).addScaledVector(dir, len / 2).setY(0.05);
    scar.rotation.y = yaw;
    this.scene.add(scar);
    this.beams.push({ mesh: scar, life: 0.75, maxLife: 0.75 });
    // the blade plane standing on it: short and wide, not a tower
    const core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.12, 4.6, len), makeGlowMat(0xffffff, 1));
    core.position.copy(caster.pos).addScaledVector(dir, len / 2).setY(2.0);
    core.rotation.y = yaw;
    this.scene.add(core);
    this.beams.push({ mesh: core, life: 0.30, maxLife: 0.30 });
    const sheath = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 5.4, len), makeGlowMat(0xc6ac72, 0.8));
    sheath.position.copy(core.position);
    sheath.rotation.y = yaw;
    this.scene.add(sheath);
    this.beams.push({ mesh: sheath, life: 0.5, maxLife: 0.5 });
    // the ground opening along the cut
    for (let i = 1; i <= 22; i++) {
      const p = caster.pos.clone().setY(0.06).addScaledVector(dir, (i / 22) * len);
      this._spawn(p, {
        color: i % 4 === 0 ? 0xfff0c8 : 0x0a0b10, size: rand(0.6, 1.5), aspect: 0.28,
        life: rand(0.5, 1.0), opacity: 0.85, vel: v3(rand(-0.6, 0.6), rand(0.4, 2.6), rand(-0.6, 0.6))
      });
      if (i % 3 === 0) {
        this._spawn(p, {
          color: 0x9a968c, size: rand(0.4, 1.0), life: rand(0.5, 1.1), opacity: 0.55,
          vel: v3(rand(-4, 4), rand(2, 7), rand(-4, 4)), gravity: 10
        });
      }
    }
    this._ring(caster.pos.clone().setY(0.06), 0xc6ac72, { size: 1.0, growRate: 20, life: 0.6 });
  }

  // The telegraph that writes itself across the floor during the wind-up, so
  // the line the cut is going to take is readable before it happens.
  worldCutTell(caster, dir, range) {
    for (let i = 1; i <= 14; i++) {
      const p = caster.pos.clone().setY(0.05).addScaledVector(dir, (i / 14) * range);
      this._spawn(p, {
        color: 0xc6ac72, size: 0.5, aspect: 0.22, life: 0.85 - i * 0.02, opacity: 0.7,
        vel: v3(0, 0.1, 0)
      });
    }
  }

  // ADAPTATION: the wheel locks. A gold shock ring at head height plus a
  // column of sparks, so the moment is visible from anywhere on the map.
  adaptFlare(fighter, height = 3.9) {
    const p = fighter.pos.clone().setY(height);
    this._ring(p, 0xc6ac72, { size: 0.7, growRate: 14, life: 0.55, flat: false });
    this._ring(p, 0xfff0c8, { size: 0.4, growRate: 9, life: 0.4, flat: false });
    this._ring(fighter.pos.clone().setY(0.06), 0xc6ac72, { size: 1.2, growRate: 16, life: 0.5 });
    for (let i = 0; i < 22; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(p, {
        color: i % 3 === 0 ? 0xfff0c8 : 0xc6ac72, size: rand(0.15, 0.4), life: rand(0.35, 0.7),
        vel: v3(Math.cos(a) * rand(2, 6), rand(-2, 3), Math.sin(a) * rand(2, 6)), gravity: 5
      });
    }
  }

  // ---- HAKARI ---------------------------------------------------------------
  // CURSED ENERGY SMASH: a flat ring off the floor plus a dome of chunks — the
  // shockwave is the reason the move is worth its startup, so it gets read
  // from the ground up rather than as a hit spark.
  ceShockwave(caster, radius) {
    const fw = caster.forward();
    const base = caster.pos.clone().setY(0.07).addScaledVector(fw, radius * 0.45);
    this._ring(base, 0xffc93c, { size: radius * 0.4, growRate: 20, life: 0.42 });
    this._ring(base, 0xfff3c4, { size: radius * 0.22, growRate: 13, life: 0.3 });
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, radius * 0.8);
      this._spawn(base.clone().add(v3(Math.cos(a) * r, 0.1, Math.sin(a) * r)), {
        color: i % 3 === 0 ? 0xfff3c4 : 0xffc93c, size: rand(0.14, 0.4),
        life: rand(0.3, 0.6), gravity: 10,
        vel: v3(Math.cos(a) * rand(3, 8), rand(3, 8), Math.sin(a) * rand(3, 8))
      });
    }
  }

  // THE SHUTTER. A corrugated steel door that rolls up out of the floor in
  // front of him and rides his facing while it stands. Managed here rather
  // than as a particle because it has to persist, be looked at, and break.
  shutterUp(fighter, sp) {
    this.shutterDown(fighter);
    const g = new THREE.Group();
    const w = sp.width ?? 2.3, h = sp.height ?? 2.4;
    const slats = 9;
    const mat = new THREE.MeshStandardMaterial({ color: 0x6d7078, roughness: 0.65, metalness: 0.35 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a3d45, roughness: 0.8 });
    for (let i = 0; i < slats; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(w, h / slats * 0.86, 0.09), i % 2 ? mat : dark);
      slat.position.y = (i + 0.5) * (h / slats);
      g.add(slat);
    }
    // side rails so it reads as a door rather than a floating panel
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.16), dark);
      rail.position.set(s * (w / 2 + 0.05), h / 2, 0);
      g.add(rail);
    }
    this.scene.add(g);
    const entry = { group: g, fighter, dist: sp.dist ?? 1.35, h, t: 0, life: sp.duration ?? 4 };
    (this.shutters ||= []).push(entry);
    fighter.shutterFx = entry;
    return entry;
  }
  shutterDown(fighter, shattered = false) {
    const list = this.shutters;
    if (!list) return;
    const i = list.findIndex(s => s.fighter === fighter);
    if (i < 0) return;
    const s = list[i];
    if (shattered) {
      const p = s.group.position.clone().setY(s.h * 0.5);
      for (let k = 0; k < 20; k++) {
        this._spawn(p.clone().add(v3(rand(-1, 1), rand(-1, 1), 0)), {
          color: k % 3 === 0 ? 0xb9bcc4 : 0x5a5d66, size: rand(0.16, 0.42),
          life: rand(0.4, 0.9), gravity: 12,
          vel: v3(rand(-4, 4), rand(1, 6), rand(-4, 4))
        });
      }
      this._ring(p, 0xd8dce4, { size: 0.6, growRate: 12, life: 0.4, flat: false });
    }
    this.scene.remove(s.group);
    list.splice(i, 1);
    fighter.shutterFx = null;
  }

  // JACKPOT BLAST: a solid bar of gold light down the firing line.
  jackpotBeam(caster, dir, range, width) {
    const yaw = Math.atan2(dir.x, dir.z);
    const origin = caster.pos.clone().setY(1.35);
    const core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.34, width * 0.34, range), makeGlowMat(0xffffff, 1));
    core.position.copy(origin).addScaledVector(dir, range / 2);
    core.rotation.y = yaw;
    this.scene.add(core);
    this.beams.push({ mesh: core, life: 0.3, maxLife: 0.3 });
    const sheath = new THREE.Mesh(new THREE.CylinderGeometry(width * 0.5, width * 0.72, range, 16, 1, true), makeGlowMat(0xffc93c, 0.9));
    sheath.position.copy(core.position);
    sheath.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
    this.scene.add(sheath);
    this.beams.push({ mesh: sheath, life: 0.55, maxLife: 0.55 });
    this._ring(origin, 0xffc93c, { size: width * 0.5, growRate: 14, life: 0.4, flat: false });
    for (let i = 0; i < 30; i++) {
      const t = rand(0.5, range);
      this._spawn(origin.clone().addScaledVector(dir, t).add(v3(rand(-0.5, 0.5), rand(-0.5, 0.5), rand(-0.5, 0.5))), {
        color: i % 3 ? 0xffc93c : 0xfff3c4, size: rand(0.2, 0.55), life: rand(0.3, 0.7),
        vel: v3(rand(-3, 3), rand(0, 4), rand(-3, 3))
      });
    }
  }

  // the counter stance invitation: a slow gold halo that hangs at chest height
  counterStance(caster) {
    const p = caster.pos.clone().add(v3(0, 1.25, 0));
    this._ring(p, 0xffc93c, { size: 1.1, growRate: -1.6, life: 0.5, flat: false });
    this._ring(p, 0xfff3c4, { size: 0.8, growRate: -1.1, life: 0.42, flat: false });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      this._spawn(p.clone().add(v3(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0)), {
        color: 0xffc93c, size: rand(0.1, 0.2), life: 0.45,
        vel: v3(-Math.cos(a) * 2, -Math.sin(a) * 2, 0)
      });
    }
  }

  chargedAura(fighter) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), makeGlowMat(fighter.model.palette.energy ?? 0x9fd0ff, 0.4));
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    const aura = { mesh, fighter, t: 1e9, kind: 'charged' };
    this.auras.push(aura);
    return aura;
  }

  removeAura(aura) {
    if (!aura) return;
    this.scene.remove(aura.mesh);
    const i = this.auras.indexOf(aura);
    if (i >= 0) this.auras.splice(i, 1);
  }

  // ---- HIGURUMA ------------------------------------------------------------
  // GAVEL STRIKE: the impact is the gavel, so the read is a hard square
  // shockwave rather than the round rings everything else uses.
  gavelSlam(at, radius) {
    this._ring(at.clone().setY(0.06), 0xd8c78a, { size: radius * 0.4, growRate: radius * 5, life: 0.35 });
    this._ring(at.clone().setY(0.06), 0xfff0c0, { size: radius * 0.2, growRate: radius * 3, life: 0.5 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      this._spawn(at.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0.1, Math.sin(a) * 0.3)), {
        color: i % 3 === 0 ? 0xfff0c0 : 0xd8c78a, size: rand(0.12, 0.30), life: rand(0.25, 0.5),
        vel: new THREE.Vector3(Math.cos(a) * rand(4, 9), rand(1, 5), Math.sin(a) * rand(4, 9)), gravity: 8
      });
    }
  }

  // CONFISCATION: no impact at all. A short reach and a closing hand, drawn as
  // motes pulled OUT of the space in front of him and into his palm — the
  // visual grammar of taking something away rather than hitting with it.
  confiscate(caster) {
    const hand = caster.pos.clone().addScaledVector(caster.forward(), 1.0).setY(1.15);
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0.5, 1.3);
      const from = hand.clone().add(new THREE.Vector3(Math.cos(a) * r, rand(-0.5, 0.6), Math.sin(a) * r));
      this._spawn(from, {
        color: i % 3 === 0 ? 0xfff0c0 : 0xd8c78a, size: rand(0.07, 0.16), life: 0.3,
        vel: hand.clone().sub(from).multiplyScalar(3.2)
      });
    }
    this._ring(hand, 0xd8c78a, { size: 0.5, growRate: -1.1, life: 0.32, flat: false });
  }

  // JUDGMENT SLASH: one wide pale arc laid across the sweep.
  judgmentArc(caster, reach) {
    const fwd = caster.forward();
    for (let i = 0; i < 12; i++) {
      const k = i / 11 - 0.5;
      const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), k * 2.1);
      this._spawn(caster.pos.clone().setY(1.15).addScaledVector(dir, reach * 0.72), {
        color: i % 4 === 0 ? 0xffffff : 0xdfe8f6, size: rand(0.28, 0.5), aspect: 0.14,
        life: 0.26, vel: dir.clone().multiplyScalar(2.5)
      });
    }
    this._ring(caster.pos.clone().setY(1.1), 0xdfe8f6, { size: reach * 0.5, growRate: 6, life: 0.22, flat: false });
  }

  // EXECUTION: the wind-up telegraph. A pale column standing over the point
  // the blade is going to arrive at — the move is meant to be reactable, so
  // the tell is deliberately loud.
  executionThrust(caster) {
    const at = caster.pos.clone().addScaledVector(caster.forward(), 1.6);
    for (let i = 0; i < 18; i++) {
      this._spawn(at.clone().add(new THREE.Vector3(rand(-0.5, 0.5), rand(0, 2.6), rand(-0.5, 0.5))), {
        color: i % 3 === 0 ? 0xffffff : 0xd8c78a, size: rand(0.10, 0.24), life: rand(0.2, 0.45),
        vel: new THREE.Vector3(rand(-0.5, 0.5), -rand(3, 8), rand(-0.5, 0.5))
      });
    }
    this._ring(at.clone().setY(0.06), 0xd8c78a, { size: 0.5, growRate: 3, life: 0.35 });
  }

  // =========================================================================
  // SUKUNA
  // =========================================================================
  // DISMANTLE — a crossing slash. Two thin blade planes laid over each other
  // at opposing angles down the whole line, plus the cut opening along the
  // floor. Deliberately THIN next to Mahoraga's world cut: this is a neutral
  // poke he throws every few seconds, not an ultimate, and it has to read as
  // one clean X rather than as a wall of light.
  dismantleSlash(caster, dir, range, width) {
    const yaw = Math.atan2(dir.x, dir.z);
    const at = caster.pos.clone().addScaledVector(dir, range / 2).setY(1.35);
    for (const [rot, col, life] of [[0.62, 0xff2f45, 0.26], [-0.62, 0xfff0f2, 0.20]]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(width * 0.16, 3.4, range), makeGlowMat(col, 1));
      blade.position.copy(at);
      blade.rotation.set(0, yaw, 0);
      blade.rotateZ(rot);
      this.scene.add(blade);
      this.beams.push({ mesh: blade, life, maxLife: life });
    }
    // the scar it leaves on the ground
    const scar = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, 0.05, range), makeGlowMat(0x8c0c1c, 0.9));
    scar.position.copy(caster.pos).addScaledVector(dir, range / 2).setY(0.045);
    scar.rotation.y = yaw;
    this.scene.add(scar);
    this.beams.push({ mesh: scar, life: 0.55, maxLife: 0.55 });
    for (let i = 1; i <= 16; i++) {
      const p = caster.pos.clone().setY(0.06).addScaledVector(dir, (i / 16) * range);
      this._spawn(p, {
        color: i % 4 === 0 ? 0xff6070 : 0x120409, size: rand(0.4, 1.0), aspect: 0.24,
        life: rand(0.3, 0.7), opacity: 0.8, vel: v3(rand(-0.5, 0.5), rand(0.4, 2.2), rand(-0.5, 0.5))
      });
    }
    this._ring(caster.pos.clone().setY(0.06), 0xff2f45, { size: 0.7, growRate: 16, life: 0.4 });
  }

  // CLEAVE — the close cut. `depth` is 0..1, how hard the target's own MAX_CE
  // made it land: at 0 it is two thin lines, at 1 it is a full X across them
  // with the ground opening underneath. The player should be able to SEE that
  // the bar they built is what is killing them.
  cleaveCut(caster, target, depth = 0.5) {
    const chest = target.pos.clone().add(v3(0, 1.3, 0));
    const k = 0.6 + depth * 1.1;
    for (const rot of [0.55, -0.62]) {
      const bar = this._spawn(chest, {
        color: rot > 0 ? 0xff2f45 : 0xfff2f4, size: 2.3 * k, aspect: 0.07,
        life: 0.24 + depth * 0.12, vel: v3()
      });
      bar.mesh.quaternion.copy(this.camera.quaternion);
      bar.mesh.rotateZ(rot);
      bar.mesh.userData.keepQuat = true;
    }
    const n = Math.round(10 + depth * 22);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(chest, {
        color: i % 3 === 0 ? 0x120409 : 0xff2f45, size: rand(0.12, 0.3 + depth * 0.3),
        life: rand(0.2, 0.5), gravity: 5,
        vel: v3(Math.cos(a) * rand(3, 6 + depth * 8), rand(-1, 5), Math.sin(a) * rand(3, 6 + depth * 8))
      });
    }
    this._ring(chest, 0xff2f45, { size: 0.3 * k, growRate: 9 + depth * 8, life: 0.32, flat: false });
    if (depth > 0.6) this._ring(target.pos.clone().setY(0.07), 0x8c0c1c, { size: 0.5, growRate: 14, life: 0.4 });
  }

  // FIRE ARROW — the charge. A gathering point in front of the drawn hand
  // that grows with `t` (0..1). Called every few frames while he holds it, so
  // the tell builds visibly the longer he commits.
  fireArrowCharge(caster, t) {
    const at = caster.pos.clone().addScaledVector(caster.forward(), 0.9).setY(1.45);
    const n = 1 + Math.round(t * 3);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = 1.6 - t * 1.2;
      this._spawn(at.clone().add(v3(Math.cos(a) * r, rand(-0.6, 0.6), Math.sin(a) * r)), {
        color: i % 2 ? 0xffb03a : 0xff4a1f, size: rand(0.14, 0.30) * (0.6 + t),
        life: 0.24, vel: at.clone().sub(at).add(v3(-Math.cos(a) * 5, 0, -Math.sin(a) * 5))
      });
    }
    if (t > 0.25) this._ring(at, 0xff7a2f, { size: 0.30 + t * 0.5, growRate: -0.8, life: 0.2, flat: false });
    this._ring(caster.pos.clone().setY(0.06), 0xff4a1f, { size: 0.8 + t * 1.6, growRate: -1.2, life: 0.22 });
  }

  // FIRE ARROW — the release. A screen-crossing column of flame.
  fireArrowBeam(caster, dir, range, width) {
    const yaw = Math.atan2(dir.x, dir.z);
    const origin = caster.pos.clone().addScaledVector(dir, range / 2).setY(1.5);
    const core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, width * 0.5, range), makeGlowMat(0xfff4d0, 1));
    core.position.copy(origin); core.rotation.y = yaw;
    this.scene.add(core);
    this.beams.push({ mesh: core, life: 0.42, maxLife: 0.42 });
    const sheath = new THREE.Mesh(new THREE.BoxGeometry(width * 1.5, width * 1.5, range), makeGlowMat(0xff5a1f, 0.85));
    sheath.position.copy(origin); sheath.rotation.y = yaw;
    this.scene.add(sheath);
    this.beams.push({ mesh: sheath, life: 0.62, maxLife: 0.62 });
    const scorch = new THREE.Mesh(new THREE.BoxGeometry(width * 2.0, 0.05, range), makeGlowMat(0x2a0a06, 0.9));
    scorch.position.copy(caster.pos).addScaledVector(dir, range / 2).setY(0.045);
    scorch.rotation.y = yaw;
    this.scene.add(scorch);
    this.beams.push({ mesh: scorch, life: 1.4, maxLife: 1.4 });
    for (let i = 1; i <= 30; i++) {
      const p = caster.pos.clone().setY(rand(0.1, 2.2)).addScaledVector(dir, (i / 30) * range)
        .add(v3(rand(-1, 1) * width, 0, rand(-1, 1) * width));
      this._spawn(p, {
        color: i % 3 === 0 ? 0xffe08a : 0xff5a1f, size: rand(0.3, 1.1), life: rand(0.4, 1.0),
        opacity: 0.9, vel: v3(rand(-1.5, 1.5), rand(1, 5), rand(-1.5, 1.5))
      });
    }
    this._ring(caster.pos.clone().setY(0.06), 0xff5a1f, { size: 1.2, growRate: 24, life: 0.7 });
  }

  // CONSUME A FINGER — the moment it takes. A dark pulse out of him with the
  // markings' red inside it, sized by which stack this is.
  fingerFlare(caster, stacks) {
    const chest = caster.pos.clone().setY(1.35);
    const k = 0.8 + stacks * 0.22;
    this._ring(chest, 0x120409, { size: 0.5 * k, growRate: 11 * k, life: 0.55, flat: false });
    this._ring(chest, 0xff2f45, { size: 0.32 * k, growRate: 8 * k, life: 0.45, flat: false });
    this._ring(caster.pos.clone().setY(0.06), 0x8c0c1c, { size: 0.7, growRate: 13 * k, life: 0.6 });
    for (let i = 0; i < 18 + stacks * 6; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(chest.clone().add(v3(rand(-0.4, 0.4), rand(-0.6, 0.8), rand(-0.4, 0.4))), {
        color: i % 3 === 0 ? 0xff2f45 : 0x120409, size: rand(0.15, 0.45) * k, life: rand(0.4, 0.9),
        opacity: 0.85, vel: v3(Math.cos(a) * rand(1, 5), rand(0.5, 4), Math.sin(a) * rand(1, 5))
      });
    }
  }

  // MALEVOLENT SHRINE — one automatic slash, somewhere. Used both for the
  // hits that land on people and for the constant criss-crossing in the
  // periphery that makes the space itself read as lethal.
  shrineSlash(at, scale = 1, hot = false) {
    const rot = rand(-1.2, 1.2);
    const bar = this._spawn(at, {
      color: hot ? 0xff2f45 : 0x6e0c18, size: rand(1.6, 3.4) * scale, aspect: 0.05,
      life: rand(0.16, 0.30), opacity: hot ? 1 : 0.75, vel: v3()
    });
    bar.mesh.quaternion.copy(this.camera.quaternion);
    bar.mesh.rotateZ(rot);
    bar.mesh.userData.keepQuat = true;
    if (hot) {
      for (let i = 0; i < 5; i++) {
        const a = rand(0, Math.PI * 2);
        this._spawn(at, {
          color: i % 2 ? 0x120409 : 0xff2f45, size: rand(0.12, 0.28), life: rand(0.2, 0.45),
          vel: v3(Math.cos(a) * rand(2, 6), rand(-1, 4), Math.sin(a) * rand(2, 6)), gravity: 5
        });
      }
    }
  }

  // MALEVOLENT SHRINE, YUJI'S VERSION — the automatic strike is a BLACK FLASH
  // rather than a slash. Black core, red lightning, a hard ring: the same
  // visual vocabulary as his own 黒閃 so the domain reads as HIM using it
  // rather than as Sukuna's shrine wearing his colours. `scale` under 1 is the
  // ambient version that fires in the periphery and on the arena.
  shrineBlackFlash(at, scale = 1) {
    const n = Math.round(6 + scale * 14);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(at, {
        color: i % 3 === 0 ? 0x14090c : 0xff2038,
        size: rand(0.12, 0.42) * scale, life: rand(0.2, 0.45),
        vel: v3(Math.cos(a) * rand(3, 10) * scale, rand(-2, 6) * scale, Math.sin(a) * rand(3, 10) * scale),
        gravity: 4
      });
    }
    this._ring(at, 0xff2038, { size: 0.34 * scale, growRate: 12 * scale, life: 0.32, flat: false });
    this._ring(at, 0x14090c, { size: 0.20 * scale, growRate: 8 * scale, life: 0.28, flat: false });
    if (scale > 0.8) {
      // the distortion bar: the space itself denting, camera-aligned
      const bar = this._spawn(at, { color: 0x14090c, size: 2.6, aspect: 0.10, life: 0.20, vel: v3() });
      bar.mesh.quaternion.copy(this.camera.quaternion);
      bar.mesh.rotateZ(rand(-1.2, 1.2));
      bar.mesh.userData.keepQuat = true;
    }
  }

  // =========================================================================
  // CHOSO — BLOOD MANIPULATION
  // =========================================================================
  // THE PALETTE RULE for everything below: deep ARTERIAL red (#8e1020) as the
  // body with a #c4142c highlight and only the smallest #ff4a5a specular. It
  // is deliberately darker, bluer and wetter than Sukuna's scarlet slashes
  // (#ff2f45) and nowhere near Jogo's orange fire (#ff5a1f) — the roster has a
  // lot of red and his has to look like it came out of a body. Blood also
  // FALLS: nearly everything here carries gravity, where fire rises.

  // BLOOD EDGE — the thrown blade's trail, dropped every few frames while it
  // travels. A flat elongated card plus a couple of falling droplets.
  bloodEdgeTrail(pos, dir) {
    const blade = this._spawn(pos.clone(), {
      color: 0xc4142c, size: 0.55, aspect: 0.22, life: 0.16, vel: v3()
    });
    blade.mesh.quaternion.copy(this.camera.quaternion);
    blade.mesh.rotateZ(Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) + 0.25);
    for (let i = 0; i < 2; i++) {
      this._spawn(pos.clone(), {
        color: 0x8e1020, size: rand(0.05, 0.12), life: rand(0.25, 0.45),
        vel: v3(rand(-0.6, 0.6), rand(-0.4, 0.6), rand(-0.6, 0.6)), gravity: 9
      });
    }
  }

  // BLOOD EDGE — the throw itself: a hardened crescent leaving his hand.
  bloodEdgeCast(caster) {
    const p = caster.pos.clone().add(v3(0, 1.30, 0)).addScaledVector(caster.forward(), 0.6);
    const arc = this._spawn(p, { color: 0xc4142c, size: 1.05, aspect: 0.26, life: 0.20, vel: v3() });
    arc.mesh.quaternion.copy(this.camera.quaternion);
    arc.mesh.rotateZ(-0.55);
    for (let i = 0; i < 7; i++) {
      this._spawn(p, {
        color: i % 3 ? 0x8e1020 : 0xff4a5a, size: rand(0.08, 0.2), life: rand(0.2, 0.4),
        vel: caster.forward().multiplyScalar(rand(2, 6)).add(v3(rand(-1.5, 1.5), rand(-1, 1.5), rand(-1.5, 1.5))),
        gravity: 8
      });
    }
  }

  // PIERCING BLOOD — a hard, thin, screen-crossing lance. Much narrower than
  // Hollow Purple and it does not glow white: the core is bright arterial and
  // the sheath is nearly black-red, so it reads as a jet of liquid under
  // pressure rather than as a beam of energy.
  piercingBlood(origin, dir, range = 22, width = 1.05) {
    const sheath = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.5, width * 0.34, range, 12, 1, true),
      makeGlowMat(0x8e1020, 0.92));
    sheath.position.copy(origin).addScaledVector(dir, range / 2);
    sheath.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
    this.scene.add(sheath);
    this.beams.push({ mesh: sheath, life: 0.5, maxLife: 0.5 });
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.17, width * 0.10, range, 8, 1, true),
      makeGlowMat(0xff4a5a, 1));
    core.position.copy(sheath.position);
    core.quaternion.copy(sheath.quaternion);
    this.scene.add(core);
    this.beams.push({ mesh: core, life: 0.34, maxLife: 0.34 });
    // spray coming off the line, falling
    for (let i = 0; i < 26; i++) {
      const t = rand(0.6, range);
      const p = origin.clone().addScaledVector(dir, t);
      this._spawn(p, {
        color: i % 3 ? 0x8e1020 : 0xc4142c, size: rand(0.10, 0.34), life: rand(0.3, 0.7),
        vel: v3(rand(-3, 3), rand(-0.5, 3), rand(-3, 3)), gravity: 11
      });
    }
    this._ring(origin.clone(), 0xc4142c, { size: 0.35, growRate: 11, life: 0.28, flat: false });
  }

  // FLOWING RED SCALE — the activation. A low ring at his feet and a column of
  // blood rising UP his body, which is the one place in his kit where it goes
  // upward: the fiction is his circulation coming to the surface.
  redScaleBurst(fighter) {
    const base = fighter.pos.clone().setY(0.06);
    this._ring(base, 0x8e1020, { size: 0.5, growRate: 9, life: 0.55 });
    this._ring(base, 0xc4142c, { size: 0.3, growRate: 15, life: 0.4 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      this._spawn(fighter.pos.clone().add(v3(Math.sin(a) * 0.42, rand(0.1, 0.5), Math.cos(a) * 0.42)), {
        color: i % 3 ? 0xc4142c : 0x8e1020, size: rand(0.12, 0.3), life: rand(0.4, 0.8),
        vel: v3(Math.sin(a) * 0.8, rand(3.5, 7), Math.cos(a) * 0.8)
      });
    }
    this._ring(fighter.pos.clone().add(v3(0, 1.2, 0)), 0xff4a5a, { size: 0.4, growRate: 7, life: 0.35, flat: false });
  }

  // FLOWING RED SCALE — the sustain, dripped from the fighter every few
  // frames while the buff holds so it is visible at a glance that it is up.
  redScaleTick(fighter) {
    const p = fighter.pos.clone().add(v3(rand(-0.35, 0.35), rand(0.5, 1.7), rand(-0.35, 0.35)));
    this._spawn(p, {
      color: Math.random() < 0.4 ? 0xff4a5a : 0x8e1020, size: rand(0.06, 0.16),
      life: rand(0.3, 0.55), vel: v3(rand(-0.3, 0.3), rand(0.6, 1.8), rand(-0.3, 0.3))
    });
  }

  // SUPERNOVA — the compressed mass in transit. A dark dense sphere with a
  // bright rim, growing slightly as it goes.
  supernovaCore(pos, k = 0) {
    const core = this._spawn(pos.clone(), {
      color: 0x5a0a14, size: 0.75 + k * 0.35, life: 0.10, vel: v3()
    });
    core.mesh.quaternion.copy(this.camera.quaternion);
    const rim = this._spawn(pos.clone(), {
      color: 0xc4142c, size: 0.95 + k * 0.45, life: 0.09, vel: v3(), opacity: 0.55
    });
    rim.mesh.quaternion.copy(this.camera.quaternion);
    if (Math.random() < 0.7) {
      this._spawn(pos.clone(), {
        color: 0x8e1020, size: rand(0.08, 0.2), life: rand(0.3, 0.6),
        vel: v3(rand(-1.5, 1.5), rand(-1, 1), rand(-1.5, 1.5)), gravity: 8
      });
    }
  }

  // SUPERNOVA — the detonation. CANON SHAPE: the compressed mass bursts into a
  // sphere of pellets thrown outward in EVERY direction at once, and the
  // pellets are what go off. So the burst is deliberately omnidirectional
  // (including straight up and straight down) rather than a ground-hugging
  // fireball — that is the whole difference between this and an eruption.
  supernovaBurst(pos, radius, pellets = 22) {
    const c = pos.clone();
    this._ring(c, 0xc4142c, { size: radius * 0.28, growRate: radius * 5.5, life: 0.45, flat: false });
    this._ring(c, 0x8e1020, { size: radius * 0.16, growRate: radius * 4.0, life: 0.6, flat: false });
    this._ring(c.clone().setY(0.08), 0x8e1020, { size: radius * 0.35, growRate: radius * 4.5, life: 0.5 });
    const flash = this._spawn(c, { color: 0xff4a5a, size: radius * 0.5, life: 0.16, vel: v3(), grow: radius * 3 });
    flash.mesh.quaternion.copy(this.camera.quaternion);
    // the pellets themselves: a real sphere of directions, not a disc
    for (let i = 0; i < pellets; i++) {
      const u = (i + 0.5) / pellets;
      const phi = Math.acos(1 - 2 * u);
      const th = i * 2.399963;                 // golden-angle spiral = even cover
      const d = v3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      const sp = rand(8, 16);
      this._spawn(c, {
        color: i % 4 === 0 ? 0xff4a5a : 0x8e1020, size: rand(0.18, 0.4),
        life: rand(0.35, 0.65), vel: d.multiplyScalar(sp), gravity: 7
      });
    }
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(c, {
        color: 0xc4142c, size: rand(0.08, 0.22), life: rand(0.5, 1.0),
        vel: v3(Math.cos(a) * rand(1, 5), rand(2, 7), Math.sin(a) * rand(1, 5)), gravity: 13
      });
    }
  }

  // =========================================================================
  // NOBARA — STRAW DOLL TECHNIQUE
  // =========================================================================
  // THE PALETTE RULE: pale STRAW (#f0e2b8) and matte BLACK IRON (#2a2c34),
  // with a single warm ochre (#c9a24a) for the bound cursed energy. Nothing
  // else on the roster is in this range — the golds already in the game
  // (Nanami, Hakari, Kurourushi) are all saturated and hot, and this is pale
  // and dry. The recurring SHAPE is a nail: thin, straight, hard-edged.

  // a nail in flight, and where it lands
  nailTrail(pos) {
    this._spawn(pos.clone(), {
      color: 0xf0e2b8, size: rand(0.06, 0.13), aspect: 0.4, life: 0.16,
      vel: v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))
    });
  }
  nailStick(pos, inBody = false) {
    this._ring(pos.clone(), inBody ? 0xc9a24a : 0xf0e2b8,
      { size: 0.18, growRate: 3.2, life: 0.22, flat: false });
    for (let i = 0; i < 5; i++) {
      this._spawn(pos.clone(), {
        color: i % 2 ? 0x2a2c34 : 0xf0e2b8, size: rand(0.05, 0.12), life: rand(0.15, 0.3),
        vel: v3(rand(-2, 2), rand(0, 2), rand(-2, 2)), gravity: 9
      });
    }
  }
  // a nail SITTING there, ticking. Deliberately visible from across the map:
  // a trap the opponent cannot see is not a trap, it is a surprise.
  nailIdle(pos) {
    const spike = this._spawn(pos.clone().add(v3(0, 0.18, 0)), {
      color: 0x2a2c34, size: 0.30, aspect: 0.22, life: 0.20, vel: v3()
    });
    spike.mesh.quaternion.copy(this.camera.quaternion);
    this._spawn(pos.clone().add(v3(0, 0.30, 0)), {
      color: 0xc9a24a, size: 0.10, life: 0.24, vel: v3(0, 0.4, 0), opacity: 0.8
    });
  }
  nailBlast(pos, radius) {
    this._ring(pos.clone(), 0xf0e2b8, { size: radius * 0.30, growRate: radius * 5, life: 0.34, flat: false });
    this._ring(pos.clone().setY(pos.y + 0.06), 0xc9a24a, { size: radius * 0.20, growRate: radius * 4, life: 0.4 });
    // the burst is SPIKES, not a puff — thin elongated cards thrown outward
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rand(-0.15, 0.15);
      const p = this._spawn(pos.clone(), {
        color: i % 3 === 0 ? 0x2a2c34 : 0xf0e2b8, size: rand(0.22, 0.44), aspect: 0.20,
        life: rand(0.22, 0.4),
        vel: v3(Math.cos(a) * rand(5, 11), rand(0.5, 4), Math.sin(a) * rand(5, 11)), gravity: 10
      });
      p.mesh.quaternion.copy(this.camera.quaternion);
      p.mesh.rotateZ(a);
      p.mesh.userData.keepQuat = true;
    }
  }

  // RESONANCE — the CHANNEL. This is the tell, so it is loud and it is on HER,
  // not on the target: a ring of straw-pale motes converging on her hands and
  // a slow rising column, growing as the channel runs. `k` is 0..1 progress.
  resonanceChannel(caster, k) {
    const hands = caster.pos.clone().add(v3(0, 1.15, 0)).addScaledVector(caster.forward(), 0.32);
    const a = rand(0, Math.PI * 2);
    const r = 1.5 * (1 - k) + 0.2;
    this._spawn(hands.clone().add(v3(Math.cos(a) * r, rand(-0.4, 0.7), Math.sin(a) * r)), {
      color: Math.random() < 0.3 ? 0xc9a24a : 0xf0e2b8, size: rand(0.07, 0.16),
      life: 0.24, vel: v3(-Math.cos(a) * r * 3.4, rand(-0.4, 0.4), -Math.sin(a) * r * 3.4)
    });
    if (Math.random() < 0.35) {
      this._ring(hands, 0xf0e2b8, { size: 0.16 + k * 0.26, growRate: -0.5, life: 0.28, flat: false });
    }
  }

  // RESONANCE — the LANDING. It arrives INSIDE them, so it starts at the chest
  // and comes outward: black iron spikes driven through from within, which is
  // the canon read (large black spikes emerging from the opponent's chest) and
  // is also visually unmistakable at any range.
  resonanceHit(pos, power = 0.5) {
    const n = 6 + Math.round(power * 10);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const phi = Math.acos(1 - 2 * u);
      const th = i * 2.399963;
      const d = v3(Math.sin(phi) * Math.cos(th), Math.cos(phi) * 0.7, Math.sin(phi) * Math.sin(th)).normalize();
      const p = this._spawn(pos.clone(), {
        color: i % 4 === 0 ? 0xc9a24a : 0x2a2c34, size: 0.34 + power * 0.5, aspect: 0.16,
        life: 0.30 + power * 0.2, vel: d.clone().multiplyScalar(1.6 + power * 3)
      });
      p.mesh.quaternion.copy(this.camera.quaternion);
      p.mesh.rotateZ(Math.atan2(d.y, d.x) - Math.PI / 2);
      p.mesh.userData.keepQuat = true;
    }
    this._ring(pos.clone(), 0xf0e2b8, { size: 0.25, growRate: 5 + power * 12, life: 0.32, flat: false });
    for (let i = 0; i < 8 + power * 14; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(pos.clone(), {
        color: 0xf0e2b8, size: rand(0.06, 0.16), life: rand(0.3, 0.6),
        vel: v3(Math.cos(a) * rand(1, 5), rand(0, 4), Math.sin(a) * rand(1, 5)), gravity: 8
      });
    }
  }

  // FULL RELEASE — the same event at ultimate scale, plus a straw-coloured
  // pillar so the biggest single hit in the game is visible from anywhere on
  // the map.
  fullReleaseHit(pos, power = 1) {
    this.resonanceHit(pos, 1);
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 0.7, 16, 14, 1, true), makeGlowMat(0xf0e2b8, 0.85));
    col.position.copy(pos).setY(pos.y + 7.4);
    this.scene.add(col);
    this.beams.push({ mesh: col, life: 0.75, maxLife: 0.75 });
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.20, 16, 8, 1, true), makeGlowMat(0xc9a24a, 1));
    inner.position.copy(col.position);
    this.scene.add(inner);
    this.beams.push({ mesh: inner, life: 0.6, maxLife: 0.6 });
    for (let i = 0; i < 34; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(pos.clone().add(v3(0, rand(0, 3), 0)), {
        color: i % 3 === 0 ? 0x2a2c34 : 0xf0e2b8, size: rand(0.14, 0.42), aspect: 0.3,
        life: rand(0.5, 1.0), vel: v3(Math.cos(a) * rand(2, 8), rand(4, 12), Math.sin(a) * rand(2, 8)),
        gravity: 9
      });
    }
    this._ring(pos.clone().setY(0.08), 0xf0e2b8, { size: 0.8, growRate: 22, life: 0.7 });
  }

  koBurst(pos) {
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(pos.clone().add(v3(0, 1.2, 0)), {
        color: i % 2 ? 0xffd98f : 0xffffff, size: rand(0.2, 0.5), life: rand(0.4, 0.9),
        vel: v3(Math.cos(a) * rand(3, 9), rand(1, 7), Math.sin(a) * rand(3, 9)), gravity: 7
      });
    }
    this._ring(pos.clone().setY(0.1), 0xffe8c0, { size: 0.6, growRate: 18, life: 0.5 });
  }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.scene.remove(p.mesh); this.parts.splice(i, 1); continue; }
      p.vel.y -= (p.gravity || 0) * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.grow) p.mesh.scale.addScalar(p.grow * dt);
      const a = p.life / p.maxLife;
      p.mesh.material.opacity = a;
      if (!p.mesh.userData.keepQuat) p.mesh.quaternion.copy(this.camera.quaternion);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) { this.scene.remove(r.mesh); this.rings.splice(i, 1); continue; }
      r.mesh.scale.addScalar(r.growRate * dt);
      r.mesh.material.opacity = (r.life / r.maxLife) * 0.9;
    }
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) { this.scene.remove(b.mesh); this.beams.splice(i, 1); continue; }
      b.mesh.material.opacity = b.life / b.maxLife;
    }
    // the shutter rides its owner's facing and rolls up over its first beat
    if (this.shutters) {
      for (let i = this.shutters.length - 1; i >= 0; i--) {
        const s = this.shutters[i];
        s.t += dt;
        const f = s.fighter;
        if (!f.alive || f.shutterT <= 0) { this.shutterDown(f, false); continue; }
        const g = f.model.group;
        const fwd = v3(Math.sin(f.facing), 0, Math.cos(f.facing));
        s.group.position.set(g.position.x + fwd.x * s.dist, 0, g.position.z + fwd.z * s.dist);
        s.group.rotation.y = f.facing;
        // roll-up: 0.22 s of travel out of the floor, then it just stands
        const k = Math.min(1, s.t / 0.22);
        s.group.scale.set(1, k * k * (3 - 2 * k), 1);
      }
    }
    for (const s of this.shadows) {
      const f = s.fighter;
      s.mesh.position.set(f.model.group.position.x, 0.02, f.model.group.position.z);
      const h = f.model.group.position.y;
      const sc = Math.max(0.4, 1 - h * 0.18);
      s.mesh.scale.setScalar(sc);
      s.mesh.material.opacity = Math.max(0.25, 0.9 - h * 0.15);
    }
    for (let i = this.auras.length - 1; i >= 0; i--) {
      const a = this.auras[i];
      a.t -= dt;
      if (a.t <= 0 || !a.fighter.alive) { this.scene.remove(a.mesh); this.auras.splice(i, 1); continue; }
      a.mesh.position.set(a.fighter.model.group.position.x, 0.04, a.fighter.model.group.position.z);
      const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.12;
      a.mesh.scale.setScalar(pulse);
    }
    if (this.rika) {
      if (this.rikaTimer > 0) {
        this.rikaTimer -= dt;
        this.rika.update(dt);
        this.rika.setOpacity(Math.min(1, this.rikaTimer * 3));
      } else {
        this.rika.setOpacity(0);
      }
    }
    // billboard + spin decorations
    this.scene.traverse(o => {
      if (o.userData.billboard) o.quaternion.copy(this.camera.quaternion);
      if (o.userData.spin) o.rotation.y += dt * 5;
    });
  }
}
