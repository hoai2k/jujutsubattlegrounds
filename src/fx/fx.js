// Procedural VFX: pooled billboard particles, shockwave rings, technique
// flashes, blob contact shadows. All textures generated to canvas at runtime.
import * as THREE from 'three';
import { makeGlowMat } from '../arena/arena.js';
import { buildRika } from '../art/models/rika.js';
import { rand, v3 } from '../core/mathutil.js';
import {
  buildRootClump, buildCEBloom, buildManji, buildFilmFrame, buildProjectionPlate,
  buildPachinkoBall, buildSpear, buildChainRope, buildSoulBlade, buildPlayfulCloud,
  buildNullifySeal, buildStoneSlab, buildHorn } from './props.js';
// URAUME'S ICE and RYU'S DISCHARGE. Both are real oriented geometry rather
// than billboards — see the header of fx/frostfx.js for the two shape-language
// rules those constructs are held to.
import {
  iceShard, iceColumn, frostShell as buildFrostShell, iceSheet as buildIceSheet,
  glacierWall, graniteBeam, chargeOrb, chargeCracks, ICE, OUT
} from './frostfx.js';

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
  // NO CAMERA. Nothing in here may aim itself at one: the scene is drawn once
  // per eye and anything oriented during the update can only be right for a
  // single view. Camera-facing nodes are marked (see `_bb`) and aimed per eye
  // in core/stage.js.
  constructor(scene) {
    this.scene = scene;
    this.parts = [];         // {mesh, vel, life, maxLife, grow, fade, spin}
    this.rings = [];         // {mesh, life, maxLife, growRate}
    this.shadows = [];       // {mesh, fighter}
    this.auras = [];         // {mesh, fighter, t, color}
    this.beams = [];
    this.props = [];         // procedural technique geometry — see fx/props.js
    this.rika = null;        // lazy spectral Rika
    this.rikaTimer = 0;
    this._shadowTex = shadowTexture();
  }

  // =========================================================================
  // URAUME — THE ICE
  // =========================================================================
  // Geometry lives in fx/frostfx.js; these are the call-site wrappers, so the
  // combat layer never touches THREE directly and never has to know how a
  // shard is put together.

  // A terrain patch. Returns the controller the IceSystem holds — it resizes
  // when fire melts it and fades as it thaws, and neither of those should
  // require the combat layer to know about meshes.
  iceSheet(x, y, z, r) { return buildIceSheet(this.scene, x, y, z, r); }

  // ONE SHARD IN FLIGHT. Driven by the entity that owns the hitbox, so the
  // picture and the hit test are the same position by construction.
  iceShardNode(len = 0.9, r = 0.11) { return iceShard(len, r); }
  // INO — Kaichi's horn. `big` is the Judgement Horn, the one that homes.
  hornNode(r = 0.72, color = 0x6ea8ff, big = false) { return buildHorn(r, color, big); }

  // A column bursting out of the ground. `grow` is the fraction of its final
  // height it has reached — it comes UP rather than appearing, which is rule 3
  // of the ice shape language.
  iceColumnNode(h, r) { return iceColumn(h, r); }

  // Uraume's ultimate: the advancing face.
  glacierNode(width, height) { return glacierWall(width, height); }

  // ---- THE FROSTBOUND SHELL ----------------------------------------------
  // *** THE MESH THAT HAS TO NOT LOOK LIKE NAOYA'S FREEZE. *** His is a gold
  // desaturation of the victim's own materials plus a 24-tick clock and no
  // geometry at all; this is a physical object built around a body whose
  // colours are untouched. The two are distinguishable in a still frame with
  // the HUD off, which is the bar the distinction had to clear.
  //
  // Measured against the victim rather than assumed, because the victim might
  // be Mahoraga at 3.6 m or Jogo at 1.42 m.
  frostShell(victim) {
    if (!victim) return null;
    this.frostShatter(victim, true);          // never two shells on one body
    const h = (victim.cfg.size?.height ?? 1.8) * 1.06;
    const r = (victim.hurtBox?.radius ?? victim.cfg.size?.hurtRadius ?? 0.6) * 1.25;
    const node = buildFrostShell(h, r);
    node.position.copy(victim.pos);
    this.scene.add(node);
    victim._frostNode = node;
    // IT GROWS FROM THE FEET UP over the first tenth of a second, and then
    // holds. The growth is on Y only — a shell that scaled uniformly would
    // read as being inflated rather than as closing over somebody.
    // IT FOLLOWS THE BODY. Registered here rather than parented to
    // `victim.model.group`, because the shell must NOT inherit the body's
    // rotation — a frozen fighter's model still turns to face the opponent
    // and a shell that turned with them would read as being worn rather than
    // as having been built around them.
    (this._shells ??= []).push({ node, victim, t: 0 });
    victim.model?.setFrostShell?.(1);
    return node;
  }

  // The break. `silent` skips the burst — used when a second shell replaces a
  // first, which should not look like the first one was destroyed.
  frostShatter(victim, silent = false) {
    const node = victim?._frostNode;
    if (!node) return false;
    node.removeFromParent();
    node.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    victim._frostNode = null;
    if (this._shells) this._shells = this._shells.filter(s => s.node !== node);
    victim.model?.setFrostShell?.(0);
    if (silent) return true;
    // the burst: real shards thrown outward, not a puff. The shell was a solid
    // and it should come apart like one.
    const h = (victim.cfg.size?.height ?? 1.8);
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      this._spawn(victim.pos.clone().add(v3(Math.cos(a) * rand(0.1, 0.7), rand(0.1, h), Math.sin(a) * rand(0.1, 0.7))), {
        color: i % 3 === 0 ? ICE.core : ICE.pale, size: rand(0.10, 0.26), aspect: 0.45,
        life: rand(0.22, 0.5), gravity: 12,
        vel: v3(Math.cos(a) * rand(2, 6), rand(1.5, 5), Math.sin(a) * rand(2, 6))
      });
    }
    this._ring(victim.pos.clone().setY(0.06), ICE.core, { size: 0.4, growRate: 12, life: 0.28, flat: true });
    return true;
  }

  // =========================================================================
  // RYU — THE DISCHARGE
  // =========================================================================
  beamNode(len, r) { return graniteBeam(len, r); }

  // ---- THE CHARGE TELL ----------------------------------------------------
  // "The charge state needs to escalate visibly on the model: energy
  // gathering, the ground cracking under him, light spilling across the arena,
  // air distortion. The opponent must be able to read his charge tier from
  // anywhere."
  //
  // All four of those are here and all four are driven by ONE 0..1 number
  // (`threatOf` in combat/output.js), so they cannot disagree about how far
  // along he is. The fifth channel — the muzzle itself lighting up — lives on
  // the MODEL (`setOutput`), because it is geometry attached to his head.
  outputCharge(caster, k, tier) {
    // 1. THE GROUND. A crack rig placed once and grown from there.
    if (!caster._crackNode) {
      const g = chargeCracks(9);
      this.scene.add(g);
      caster._crackNode = g;
    }
    caster._crackNode.position.set(caster.pos.x, caster.pos.y + 0.02, caster.pos.z);
    caster._crackNode.userData.set(k);

    // 2. THE GATHER at the muzzle.
    const mz = caster.model?.muzzle;
    const at = caster.pos.clone()
      .add(v3(0, mz?.y ?? 1.8, 0))
      .addScaledVector(caster.forward(), (mz?.ahead ?? 0.2) + 0.1);
    if (!caster._orbNode) {
      const g = chargeOrb(0.16);
      this.scene.add(g);
      caster._orbNode = g;
    }
    caster._orbNode.position.copy(at);
    caster._orbNode.scale.setScalar(0.5 + k * 2.2);
    caster._orbNode.rotation.y += 0.22;
    caster._orbNode.rotation.x += 0.14;
    caster._orbNode.userData.core.material.opacity = 0.5 + k * 0.5;
    caster._orbNode.userData.shell.material.opacity = 0.10 + k * 0.30;

    // 3. DEBRIS off the floor. Rate scales with the tier, so the ground gets
    //    visibly angrier rather than merely brighter.
    for (let i = 0; i < 1 + tier; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = rand(0.5, 1.2 + tier * 0.9);
      this._spawn(caster.pos.clone().add(v3(Math.cos(a) * rr, 0.05, Math.sin(a) * rr)), {
        color: i % 2 === 0 ? OUT.edge : 0x8d8f96, size: rand(0.07, 0.20), aspect: 0.6,
        life: rand(0.20, 0.55), gravity: 16,
        vel: v3(rand(-1, 1), rand(2, 4 + tier * 1.6), rand(-1, 1))
      });
    }
    // 4. THE MOTES falling INTO the muzzle — the "gathering" read, and the one
    //    that says the energy is coming from outside him.
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2, rr = rand(1.2, 3.0);
      this._spawn(at.clone().add(v3(Math.cos(a) * rr, rand(-0.8, 1.2), Math.sin(a) * rr)), {
        color: OUT.hot, size: rand(0.06, 0.16), aspect: 0.4, life: 0.24,
        vel: v3(-Math.cos(a) * rr * 3.4, 0, -Math.sin(a) * rr * 3.4)
      });
    }
    // 5. THE LIGHT SPILLING ACROSS THE ARENA. One ring a beat, sized by tier,
    //    laid flat — visible from anywhere including behind cover.
    caster._chargeRingT = (caster._chargeRingT ?? 0) - 1 / 60;
    if (caster._chargeRingT <= 0) {
      caster._chargeRingT = 0.34 - k * 0.18;
      this._ring(caster.pos.clone().setY(0.05), tier >= 3 ? OUT.hot : OUT.edge,
        { size: 0.4, growRate: 6 + tier * 4, life: 0.4, flat: true });
    }
  }

  // Torn down on release, on a hit that interrupts him, and on the round
  // reset. Idempotent, so every one of those can call it without checking.
  outputClear(caster) {
    for (const key of ['_crackNode', '_orbNode']) {
      const n = caster?.[key];
      if (!n) continue;
      n.removeFromParent();
      n.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      caster[key] = null;
    }
  }

  // BRACE. Deliberately a DIFFERENT read from the charge: no ground cracks, no
  // muzzle, no forward direction at all — energy falling INTO him from every
  // side. A player who has learned the character has to be able to tell at a
  // glance whether he is about to fire or merely refuelling, because the
  // correct response to the two is completely different.
  braceGather(caster, k) {
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2, rr = rand(2.0, 4.2);
      this._spawn(caster.pos.clone().add(v3(Math.cos(a) * rr, rand(0.2, 2.6), Math.sin(a) * rr)), {
        color: i === 0 ? OUT.hot : OUT.edge, size: rand(0.07, 0.17), aspect: 0.45, life: 0.30,
        vel: v3(-Math.cos(a) * rr * 2.6, rand(-0.4, 0.8), -Math.sin(a) * rr * 2.6)
      });
    }
    caster._braceRingT = (caster._braceRingT ?? 0) - 1 / 60;
    if (caster._braceRingT <= 0) {
      caster._braceRingT = 0.42;
      // the ring CONTRACTS rather than growing — the inverse of every other
      // ring in the game, which is the whole visual grammar of "taking in"
      this._ring(caster.pos.clone().setY(0.05), OUT.edge,
        // -1.6 over 0.5 s takes the scale from 1.0 to 0.2 — it contracts and
        // stops, rather than passing through zero and turning inside out,
        // which is what a larger negative rate does to `scale.addScalar`.
        { size: 4.0, growRate: -1.6, life: 0.5, flat: true });
    }
  }

  // ---- PROCEDURAL PROPS ---------------------------------------------------
  // A technique's actual geometry — roots, a thrown 卍, a pachinko ball, a
  // spear — handed over with a lifetime and a per-frame driver. `onUpdate`
  // receives (node, k, dt) with k running 0 -> 1 across `life`, so the move
  // that owns the hitbox also owns the animation and the two cannot drift.
  prop(node, life, onUpdate) {
    this.scene.add(node);
    this.props.push({ node, t: 0, life, onUpdate });
    return node;
  }
  dropProp(node) {
    const i = this.props.findIndex(p => p.node === node);
    if (i >= 0) this.props.splice(i, 1);
    this._disposeNode(node);
  }
  _disposeNode(node) {
    this.scene.remove(node);
    node.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }

  // =========================================================================
  // THE ARENA BOUNDARY
  // =========================================================================
  // Every map is a rectangle and `bounds.clampXZ` holds the fighter inside it.
  // Where the map has built a wall along that line the wall does the work and
  // is its own explanation; where it has not, the fighter simply stops in open
  // ground with nothing to have stopped against, which reads as the controller
  // dropping input rather than as a limit.
  //
  // So the limit gets a body. A barrier panel flares at the point of contact —
  // a hex lattice, because that is the visual language the domain barriers
  // already use here (fx/domainfx.js `_buildBarrier` is a wireframe sphere in
  // the same family), so a curtain around the arena reads as the same class of
  // thing rather than as a new one.
  //
  // Deliberately CHEAP AND SHORT. It is feedback, not scenery: nothing persists,
  // there is no standing dome to light or cull, and a player who never touches
  // the edge never sees it. Walking along the boundary retriggers it, which is
  // correct — the hand stays on the glass.
  _barrierTexture() {
    if (this._ffTex) return this._ffTex;
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.clearRect(0, 0, 256, 256);
    // A HEX LATTICE, drawn rather than tiled: one ring of cells around the
    // centre, brightest at the impact and dying out toward the rim, so the
    // panel has a middle instead of being a uniform sheet of pattern.
    const R = 22, H = R * Math.sqrt(3) / 2;
    g.lineWidth = 2.4;
    g.lineJoin = 'round';
    for (let row = -4; row <= 4; row++) {
      for (let col = -4; col <= 4; col++) {
        const cx = 128 + col * R * 1.5;
        const cy = 128 + row * H * 2 + (col & 1 ? H : 0);
        const d = Math.hypot(cx - 128, cy - 128) / 118;
        if (d > 1) continue;
        g.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - d) * (1 - d)).toFixed(3) + ')';
        g.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          const x = cx + Math.cos(a) * R * 0.94, y = cy + Math.sin(a) * R * 0.94;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.closePath();
        g.stroke();
      }
    }
    // and a soft bloom under it so the middle of the strike is a light, not a
    // drawing of one
    const grad = g.createRadialGradient(128, 128, 2, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255,255,255,0.55)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.13)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    return (this._ffTex = new THREE.CanvasTexture(c));
  }

  // `nx, nz` is the OUTWARD normal of the boundary that was hit — the panel
  // stands in the plane of the barrier, facing back into the arena.
  forceField(pos, nx, nz, power = 1) {
    const size = 2.2 + power * 1.1;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.15),
      new THREE.MeshBasicMaterial({
        map: this._barrierTexture(), color: 0x8fd8ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        toneMapped: false
      }));
    mesh.position.copy(pos);
    // NOT a billboard. The panel IS the barrier, so it has to lie in the
    // barrier's plane from every seat — turning it to face a camera would make
    // it a card floating in the air instead of a surface being pressed on.
    mesh.lookAt(pos.x + nx, pos.y, pos.z + nz);
    mesh.renderOrder = 3;
    this.prop(mesh, 0.46, (node, k) => {
      // IN HARD, OUT SOFT. The flare has to land on the frame the fighter
      // stopped, or it reads as a consequence of something else.
      const a = k < 0.12 ? k / 0.12 : Math.pow(1 - (k - 0.12) / 0.88, 1.7);
      node.material.opacity = a * 0.85;
      // and it swells a little as it goes, so the pressure reads as spreading
      // outward from the hand rather than as a lamp switching off
      const sc = 1 + k * 0.35;
      node.scale.set(sc, sc, 1);
    });
    // two or three sparks skidding along the surface sell it as a contact
    for (let i = 0; i < 3; i++) {
      this._spawn(pos.clone().add(v3(rand(-0.4, 0.4), rand(-0.5, 0.6), rand(-0.4, 0.4))), {
        color: 0xbfeaff, size: 0.14, life: 0.3,
        vel: v3(-nx * rand(0.4, 1.2) + rand(-0.6, 0.6), rand(0.6, 2.0), -nz * rand(0.4, 1.2) + rand(-0.6, 0.6))
      });
    }
  }

  attachShadow(fighter) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
      new THREE.MeshBasicMaterial({ map: this._shadowTex, color: 0x000000, transparent: true, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;
    this.scene.add(mesh);
    this.shadows.push({ mesh, fighter });
  }

  // ---- BILLBOARDS ---------------------------------------------------------
  // Mark a node as camera-facing, with an optional fixed roll about its own
  // view axis. NOTHING here writes a camera quaternion: the scene is drawn
  // once per eye and a quad aimed while the world updates can only face one of
  // them, which in split-screen leaves every other seat looking at it edge-on
  // — invisible. The aim happens per eye in core/stage.js, immediately before
  // that eye draws, off exactly these two userData flags.
  _bb(obj, roll = 0) {
    obj.userData.billboard = true;
    obj.userData.bbRoll = roll;
    return obj;
  }

  _spawn(pos, opts = {}) {
    const size = opts.size ?? 0.3;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size * (opts.aspect ?? 1)), makeGlowMat(opts.color ?? 0xffffff, opts.opacity ?? 1));
    mesh.position.copy(pos);
    // every particle is a camera-facing card unless the caller lays it out in
    // world space itself (`userData.billboard = false`)
    this._bb(mesh);
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
    else this._bb(mesh);
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
    this._bb(bar.mesh, 0.4);
    const notch = this._spawn(pos.clone().add(v3(0.28, 0.12, 0)), { color: 0xffffff, size: 0.34, aspect: 0.12, life: 0.3, vel: v3() });
    this._bb(notch.mesh, -1.1);
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

  // THE DASH BURST — the impulse at the front of a dash. Louder than the trail
  // that follows it and thrown BACKWARD along the heading, so the read is "he
  // left from here" rather than "he is moving fast": a scuff ring on the floor
  // at the push-off, a fan of dust behind it, and a pair of camera-facing
  // streaks for the snap.
  dashBurst(fighter, dir) {
    const at = fighter.pos.clone();
    const back = dir.clone().multiplyScalar(-1);
    const col = fighter.model.palette.energy ?? 0x9fd0ff;
    this._ring(at.clone().setY(0.06), col, { size: 0.35, growRate: 9, life: 0.26 });
    for (let i = 0; i < 10; i++) {
      this._spawn(at.clone().add(v3(rand(-0.3, 0.3), rand(0.1, 1.4), rand(-0.3, 0.3))), {
        color: i % 3 ? 0xb8c0d8 : col, size: rand(0.14, 0.32), life: rand(0.18, 0.34),
        vel: back.clone().multiplyScalar(rand(3, 7)).add(v3(rand(-1, 1), rand(0.2, 1.6), rand(-1, 1))),
        gravity: 5
      });
    }
    for (let i = 0; i < 2; i++) {
      const bar = this._spawn(at.clone().add(v3(0, 0.8 + i * 0.5, 0)).addScaledVector(back, 0.35), {
        color: col, size: 1.5, aspect: 0.09, life: 0.16, vel: back.clone().multiplyScalar(2)
      });
      this._bb(bar.mesh, rand(-0.35, 0.35));
    }
  }

  // ---- WATER ---------------------------------------------------------------
  // WHAT STANDING IN A RIVER LOOKS LIKE. The maps have had water since the
  // start and it only ever reacted to techniques hitting it, so a fighter in
  // Kyoto's river — which runs down most of the middle of the map — was a body
  // cut off at the thigh by a flat green sheet that did nothing. That reads as
  // falling through the floor, and every player who saw it read it that way.
  //
  // `power` scales the whole thing: a footfall is ~0.4, walking out of a jump
  // into the river is ~1.4. The ring is laid FLAT at the water's own height so
  // it sits on the surface rather than around the body.
  waterRing(x, y, z, power = 1) {
    const at = v3(x, y + 0.02, z);
    this._ring(at, 0xcfeef8, { size: 0.34 * power, growRate: 2.2 + power * 2.4, life: 0.34 + power * 0.2 });
    if (power > 0.7) this._ring(at, 0x8fd0e0, { size: 0.2 * power, growRate: 1.6 + power * 3.4, life: 0.5 });
    const n = Math.round(3 + power * 9);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const out = rand(0.15, 0.5) * power;
      this._spawn(v3(x + Math.cos(a) * out, y + 0.05, z + Math.sin(a) * out), {
        color: i % 3 ? 0xcfeef8 : 0x8fd0e0, size: rand(0.05, 0.13) * (0.6 + power),
        life: rand(0.24, 0.5),
        vel: v3(Math.cos(a) * rand(0.6, 2.2) * power, rand(1.4, 4.2) * power, Math.sin(a) * rand(0.6, 2.2) * power),
        gravity: 11
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
    this._bb(core.mesh);
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
      this._bb(c.mesh);
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
      this._bb(sp.mesh);
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
    this._bb(arc.mesh, rand(-0.6, 0.2));
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
      this._bb(bar.mesh);
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
    this._bb(bar.mesh, 0.4);
    const notch = this._spawn(pos.clone().add(v3(0.3, 0.2, 0)), { color: 0xffffff, size: 0.5, aspect: 0.1, life: 0.4, vel: v3() });
    this._bb(notch.mesh, -1.1);
    if (level === 2) {
      // screen-crack read: hard white shards radiating from the point
      for (const rot of [0.2, 1.1, 2.0, 2.8]) {
        const shard = this._spawn(pos, { color: 0xffffff, size: rand(1.2, 1.9), aspect: 0.03, life: 0.3, vel: v3() });
        this._bb(shard.mesh, rot + rand(-0.15, 0.15));
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
      this._bb(bar.mesh, -a * 0.7 + 0.2);
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
      this._bb(bar.mesh, rot);
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
    this._bb(bar.mesh, rot);
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
      this._bb(bar.mesh, rand(-1.2, 1.2));
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
    this._bb(blade.mesh, Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) + 0.25);
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
    this._bb(arc.mesh, -0.55);
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
    this._bb(core.mesh);
    const rim = this._spawn(pos.clone(), {
      color: 0xc4142c, size: 0.95 + k * 0.45, life: 0.09, vel: v3(), opacity: 0.55
    });
    this._bb(rim.mesh);
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
    this._bb(flash.mesh);
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
    this._bb(spike.mesh);
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
      this._bb(p.mesh, a);
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
      this._bb(p.mesh, Math.atan2(d.y, d.x) - Math.PI / 2);
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

  // =========================================================================
  // FINISHER-GRADE EFFECTS
  // -------------------------------------------------------------------------
  // A finisher holds on one technique for a second and a half with the camera
  // a metre away from it, which is a completely different exposure from the
  // same technique going off in a fight at four metres and 60 frames a second.
  // The gameplay effects above are tuned for the second case and read as thin
  // when a cinematic sits on them; these are built for the first — layered,
  // longer-lived, and expensive enough that nothing should fire one per frame.
  //
  // All of them are composed from the same two primitives as everything else
  // in this file (`_spawn` and `_ring`), so they cost what a normal effect
  // costs, and they inherit the pooled update for free.
  // =========================================================================

  // A BODY ON FIRE. Flames licking UP the silhouette rather than a fireball
  // in front of it: the particles are seeded along the body's own height, they
  // rise, and they narrow as they go, which is what separates "burning" from
  // "standing in an explosion". Jogo does not knock people down — he cooks
  // them, and until this existed there was no way to show it.
  bodyBurn(fighter, k = 1, opts = {}) {
    const g = fighter.model.group;
    const H = (fighter.model.H ?? 1.8) * (g.scale.y || 1);
    const n = Math.round(10 * k);
    for (let i = 0; i < n; i++) {
      const u = rand(0.05, 0.95);                     // where up the body
      const r = (0.16 + 0.12 * (1 - u)) * H;          // wider at the feet
      const a = rand(0, Math.PI * 2);
      this._spawn(v3(g.position.x + Math.cos(a) * r, g.position.y + u * H, g.position.z + Math.sin(a) * r), {
        color: u > 0.7 ? 0xffd98f : (i % 3 ? 0xff7a2f : 0xff4a1f),
        size: rand(0.14, 0.34) * (1.2 - u * 0.5) * H / 1.8,
        life: rand(0.35, 0.8),
        vel: v3(rand(-0.4, 0.4), rand(1.6, 3.6), rand(-0.4, 0.4)),
        gravity: -1.6,                                 // fire ACCELERATES upward
        grow: -0.25
      });
    }
    // embers that outlive the flame and fall
    for (let i = 0; i < Math.round(4 * k); i++) {
      this._spawn(v3(g.position.x + rand(-0.4, 0.4), g.position.y + rand(0.3, 1.4) * H / 1.8, g.position.z + rand(-0.4, 0.4)), {
        color: 0xffb03c, size: rand(0.05, 0.12), life: rand(0.7, 1.4),
        vel: v3(rand(-1.2, 1.2), rand(1, 3), rand(-1.2, 1.2)), gravity: 5
      });
    }
    if (opts.ground !== false) {
      this._ring(v3(g.position.x, 0.05, g.position.z), 0xff5a1f,
        { size: 0.5 * k, growRate: 1.6, life: 0.5 });
    }
  }

  // THE GROUND REMEMBERS IT. A scorch left where something enormous landed:
  // a dark scar, a hot rim, and smoke coming off it. Draws once and lingers.
  scorch(pos, radius = 2, color = 0xff5a1f) {
    const at = pos.clone().setY(0.05);
    this._ring(at, 0x140a06, { size: radius * 0.6, growRate: 0.5, life: 1.6 });
    this._ring(at, color, { size: radius * 0.42, growRate: 1.4, life: 1.1 });
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2), d = rand(0.2, radius);
      this._spawn(v3(at.x + Math.cos(a) * d, 0.1, at.z + Math.sin(a) * d), {
        color: i % 3 ? 0x3a3a44 : 0x6a5a4a, size: rand(0.3, 0.8), life: rand(0.9, 1.8),
        vel: v3(rand(-0.3, 0.3), rand(0.4, 1.2), rand(-0.3, 0.3)), gravity: -0.4, grow: 0.7
      });
    }
  }

  // THE HIT THAT ENDS IT. Three rings on three different clocks plus a shard
  // burst — one ring reads as a spark, three read as an event. Every finisher
  // used to hand-roll its own stack of `_ring` calls with slightly different
  // numbers; this is that stack, authored once, in the finisher's own colour.
  impactBloom(pos, color, k = 1) {
    this._ring(pos, 0xffffff, { size: 0.12 * k, growRate: 34 * k, life: 0.22, flat: false });
    this._ring(pos, color, { size: 0.30 * k, growRate: 20 * k, life: 0.45, flat: false });
    this._ring(pos, 0x0a0a10, { size: 0.55 * k, growRate: 12 * k, life: 0.55, flat: false });
    const flash = this._spawn(pos, { color: 0xffffff, size: 0.7 * k, life: 0.12, vel: v3(), grow: 6 * k });
    this._bb(flash.mesh);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + rand(-0.2, 0.2);
      this._spawn(pos, {
        color: i % 4 ? color : 0xffffff, size: rand(0.1, 0.3) * k, aspect: 0.35,
        life: rand(0.25, 0.6),
        vel: v3(Math.cos(a) * rand(4, 11) * k, rand(-2, 6), Math.sin(a) * rand(4, 11) * k),
        gravity: 7
      });
    }
  }

  // CHARGE. Energy pulled INWARD to a point — the opposite of every other
  // effect in this file, and the reason a wind-up reads as a wind-up. The
  // particles are spawned out at the radius and given a velocity aimed back at
  // the centre, so they converge and arrive together.
  techCharge(at, color, k = 1) {
    for (let i = 0; i < Math.round(16 * k); i++) {
      const a = rand(0, Math.PI * 2), e = rand(-0.7, 0.9), d = rand(1.1, 2.6) * k;
      const p = v3(at.x + Math.cos(a) * d, at.y + e * d * 0.7, at.z + Math.sin(a) * d);
      const life = rand(0.25, 0.5);
      this._spawn(p, {
        color, size: rand(0.08, 0.2), life,
        vel: v3((at.x - p.x) / life, (at.y - p.y) / life, (at.z - p.z) / life)
      });
    }
    this._ring(at, color, { size: 1.5 * k, growRate: -2.6 * k, life: 0.5, flat: false });
  }

  // FLOOR COMING UP. Chunks thrown off the deck by something that landed on
  // it — the cheap, universal way to say "that had weight".
  debris(pos, n = 12, color = 0x6b6f78) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(v3(pos.x + Math.cos(a) * rand(0.2, 1.2), 0.15, pos.z + Math.sin(a) * rand(0.2, 1.2)), {
        color, size: rand(0.12, 0.4), life: rand(0.5, 1.1),
        vel: v3(Math.cos(a) * rand(1.5, 5), rand(3, 8), Math.sin(a) * rand(1.5, 5)),
        gravity: 14, spin: rand(-6, 6)
      });
    }
  }

  // ===========================================================================
  // TECHNIQUE OVERHAUL BUILDERS. Everything below serves the redesigned CT
  // moves — travelling waves, constructs and swarms, all drawn per tick by the
  // entity that owns the mechanic, so the visual can never desync from the
  // hitbox: they read the same position.
  // ===========================================================================

  // TODO — RESONANT CLAP. A wall of pink concussion in flight: stacked
  // vertical rings around the wavefront plus a snap bar, in his accent color.
  // =========================================================================
  // DAGON — THE SEA
  // =========================================================================
  // Everything he throws is WATER, and all of it shares one palette so the
  // volley, the surge, the spit and the patch read as one substance: a cold
  // teal body (#2e6f80) with a pale foam highlight (#dff0f4). Deliberately
  // separate from Choso's red and from Jogo's orange, and deliberately COLD
  // against Dagon's own crimson body — he should never be mistaken for the
  // thing he is throwing.
  seaFishTrail(pos, vel) {
    this._spawn(pos.clone(), {
      color: 0x2e6f80, size: rand(0.10, 0.20), life: 0.18, opacity: 0.8,
      vel: vel.clone().multiplyScalar(-0.18).add(v3(rand(-0.4, 0.4), rand(-0.2, 0.4), rand(-0.4, 0.4)))
    });
    if (Math.random() < 0.4) {
      this._spawn(pos.clone(), {
        color: 0xdff0f4, size: rand(0.05, 0.11), life: 0.24, opacity: 0.7,
        vel: v3(rand(-0.6, 0.6), rand(-0.6, 0.2), rand(-0.6, 0.6))
      });
    }
  }

  seaSpitTrail(pos, dir) {
    const jet = this._spawn(pos.clone(), {
      color: 0x7fc8d8, size: 0.34, aspect: 0.24, life: 0.12, opacity: 0.9, vel: v3()
    });
    this._bb(jet.mesh, Math.atan2(dir.x, dir.z));
    for (let i = 0; i < 2; i++) {
      this._spawn(pos.clone().add(v3(rand(-0.15, 0.15), rand(-0.15, 0.15), rand(-0.15, 0.15))), {
        color: i ? 0xdff0f4 : 0x2e6f80, size: rand(0.05, 0.12), life: 0.2, opacity: 0.75,
        vel: dir.clone().multiplyScalar(-rand(1, 3)).add(v3(rand(-1, 1), rand(0, 1.5), rand(-1, 1)))
      });
    }
  }

  // THE SURGE. A wall of water crossing the ground: a wide low ring plus a
  // crest of foam thrown up along its leading edge.
  tidalTick(pos, dir, width) {
    this._ring(pos.clone().setY(pos.y + 0.10), 0x2e6f80,
      { size: width * 0.42, growRate: 2.6, life: 0.20, flat: true });
    const crest = this._spawn(pos.clone().add(v3(0, 0.55, 0)), {
      color: 0x7fc8d8, size: width * 0.72, aspect: 0.30, life: 0.16, opacity: 0.75, vel: v3()
    });
    this._bb(crest.mesh);
    for (let i = 0; i < 5; i++) {
      const off = (i / 4 - 0.5) * width * 0.9;
      const side = v3(dir.z, 0, -dir.x).multiplyScalar(off);
      this._spawn(pos.clone().add(side).add(v3(0, rand(0.1, 0.7), 0)), {
        color: i % 2 ? 0xdff0f4 : 0x9fd8e4, size: rand(0.14, 0.34), life: rand(0.24, 0.46),
        opacity: 0.85, gravity: 12,
        vel: dir.clone().multiplyScalar(rand(1, 3)).add(v3(rand(-1.2, 1.2), rand(2, 4.5), rand(-1.2, 1.2)))
      });
    }
  }

  // THE PATCH. Placed once when the surge expires — a shallow disc of standing
  // water with a foam rim, and a slow shimmer on a 0.18 s tick so it stays
  // visibly WET rather than looking like a painted decal.
  waterPatch(pos, radius) {
    this._ring(pos.clone().setY(pos.y + 0.04), 0xdff0f4,
      { size: radius * 0.5, growRate: radius * 2.2, life: 0.5, flat: true });
    for (let i = 0; i < 10; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, radius);
      this._spawn(pos.clone().add(v3(Math.cos(a) * r, 0.05, Math.sin(a) * r)), {
        color: 0x7fc8d8, size: rand(0.16, 0.34), life: rand(0.3, 0.6), opacity: 0.6,
        vel: v3(rand(-0.8, 0.8), rand(0.4, 1.6), rand(-0.8, 0.8)), gravity: 10
      });
    }
  }

  waterPatchTick(pos, radius) {
    const a = rand(0, Math.PI * 2), r = rand(0, radius * 0.92);
    this._ring(pos.clone().add(v3(Math.cos(a) * r, 0.045, Math.sin(a) * r)), 0x9fd8e4,
      { size: 0.12, growRate: 1.4, life: 0.55, flat: true });
  }

  // =========================================================================
  // URO — THE TWO THINGS THE REFRACTION CANNOT DO ON ITS OWN
  // =========================================================================
  // fx/warpfx.js owns everything that BENDS. These two are the additive
  // accents that go with it, and they are deliberately near-colourless: her
  // whole visual identity is distortion rather than a hue, so nothing here is
  // allowed to read as an energy colour.

  // The reflect connecting. The BENDING half is fx/warpfx.js `bounce`, called
  // by the reflect system directly; this is the additive accent that goes with
  // it — a hard pale flash at the contact point so the RETURN is legible from
  // across the arena. The opponent has to be able to see that their own attack
  // is now coming back at them.
  skyReflectBounce(at, dir) {
    this._ring(at.clone(), 0xeaf8ff, { size: 0.3, growRate: 9, life: 0.28, flat: false });
    for (let i = 0; i < 9; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(at.clone(), {
        color: i % 3 ? 0xeaf8ff : 0xcfe8f5, size: rand(0.06, 0.18), aspect: 0.4,
        life: rand(0.16, 0.34), opacity: 0.9,
        vel: dir.clone().multiplyScalar(rand(2, 6)).add(v3(Math.cos(a) * 2, rand(-1, 2), Math.sin(a) * 2))
      });
    }
  }

  // One shell of the SKY COLLAPSE arriving. The refraction dome is the effect;
  // this is the impact under it.
  skyShell(pos, radius) {
    for (let k = 0; k < 3; k++) {
      this._ring(pos.clone().setY(pos.y + 0.08 + k * 0.5), k ? 0xcfe8f5 : 0xffffff,
        { size: radius * (0.2 + k * 0.12), growRate: radius * 3.2, life: 0.42, flat: k === 0 });
    }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      this._spawn(pos.clone().add(v3(Math.cos(a) * radius * 0.35, rand(0.1, 2.4), Math.sin(a) * radius * 0.35)), {
        color: i % 4 === 0 ? 0xffffff : 0xdff2ff, size: rand(0.12, 0.32), aspect: 0.5,
        life: rand(0.3, 0.62), opacity: 0.85,
        vel: v3(Math.cos(a) * rand(4, 11), rand(-4, 1), Math.sin(a) * rand(4, 11))
      });
    }
  }

  clapWaveTick(pos, dir, width) {
    const c = 0xff5fc8;
    for (let k = 0; k < 2; k++) {
      this._ring(pos.clone().add(v3(0, 0.55 + k * 0.85, 0)), k ? c : 0xffd0ec,
        { size: width * (0.32 + k * 0.14), growRate: 2.2, life: 0.16, flat: false });
    }
    const bar = this._spawn(pos, { color: c, size: width * 0.8, aspect: 0.10, life: 0.14, vel: v3() });
    this._bb(bar.mesh);
    for (let i = 0; i < 3; i++) {
      this._spawn(pos.clone().add(v3(rand(-0.5, 0.5) * width * 0.4, rand(0.2, 1.7), rand(-0.5, 0.5) * width * 0.4)), {
        color: i ? c : 0xffffff, size: rand(0.10, 0.24), life: 0.22,
        vel: dir.clone().multiplyScalar(-rand(2, 5)).add(v3(rand(-1, 1), rand(0, 2), rand(-1, 1)))
      });
    }
  }

  // YUJI — the Divergent ghost fist: cursed energy in the SHAPE of the punch,
  // arriving late. Trail while it flies, a knuckled burst when it lands.
  ghostFistTrail(pos, dir) {
    const fist = this._spawn(pos, { color: 0xff3b30, size: 0.62, aspect: 0.72, life: 0.12, vel: dir.clone().multiplyScalar(2) });
    fist.mesh.material.opacity = 0.85;
    for (let i = 0; i < 2; i++) {
      this._spawn(pos.clone().add(v3(rand(-0.25, 0.25), rand(-0.25, 0.25), rand(-0.25, 0.25))), {
        color: i ? 0x300810 : 0xff8a70, size: rand(0.12, 0.3), life: 0.2,
        vel: dir.clone().multiplyScalar(-rand(3, 6))
      });
    }
  }
  ghostFistBurst(pos, dir) {
    this._ring(pos, 0xff3b30, { size: 0.4, growRate: 12, life: 0.3, flat: false });
    // four knuckle shards punched THROUGH the point of impact
    for (let i = 0; i < 4; i++) {
      const off = v3(rand(-0.3, 0.3), rand(-0.2, 0.35), rand(-0.3, 0.3));
      this._spawn(pos.clone().add(off), {
        color: 0xffb09a, size: rand(0.4, 0.7), aspect: 0.22, life: 0.26,
        vel: dir.clone().multiplyScalar(rand(6, 11)).add(v3(rand(-1, 1), rand(-0.5, 1.5), rand(-1, 1)))
      });
    }
    for (let i = 0; i < 10; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(pos, {
        color: i % 3 ? 0xff3b30 : 0x1c060a, size: rand(0.12, 0.3), life: rand(0.2, 0.4),
        vel: v3(Math.cos(a) * rand(2, 6), rand(0, 4), Math.sin(a) * rand(2, 6)), gravity: 7
      });
    }
  }

  // YUJI — the 卍 crescent: two crossed spinning bars riding the wavefront.
  crescentTick(pos, dir, color = 0xffa04a) {
    const spin = performance.now() * 0.02;
    for (let k = 0; k < 2; k++) {
      const bar = this._spawn(pos, { color: k ? color : 0xffe0c0, size: 1.35, aspect: 0.12, life: 0.12, vel: dir.clone().multiplyScalar(1) });
      this._bb(bar.mesh, spin + k * Math.PI / 2);
    }
    this._spawn(pos, {
      color, size: rand(0.1, 0.2), life: 0.22,
      vel: dir.clone().multiplyScalar(-rand(2, 4)).add(v3(rand(-1, 1), rand(-0.5, 1), rand(-1, 1)))
    });
  }

  // NAOYA — one frozen FILM FRAME of the kick: a hollow gold rectangle drawn
  // from four thin bars, popped at the strike point and left to burn out.
  frameFlash(pos, idx = 0) {
    const gold = idx % 2 ? 0xe8c85a : 0xfff0c0;
    const w = 1.35, h = 1.9, life = 0.34;
    const edges = [
      { off: v3(0, h / 2, 0), size: w, aspect: 0.05, rz: 0 },
      { off: v3(0, -h / 2, 0), size: w, aspect: 0.05, rz: 0 },
      { off: v3(-w / 2, 0, 0), size: h, aspect: 0.04, rz: Math.PI / 2 },
      { off: v3(w / 2, 0, 0), size: h, aspect: 0.04, rz: Math.PI / 2 }
    ];
    for (const e of edges) {
      const bar = this._spawn(pos.clone().add(e.off), { color: gold, size: e.size, aspect: e.aspect, life, vel: v3() });
      this._bb(bar.mesh, e.rz);
    }
    // the kick inside the frame: a hard diagonal slash bar
    const cut = this._spawn(pos, { color: 0xffffff, size: 1.6, aspect: 0.07, life: life * 0.7, vel: v3() });
    this._bb(cut.mesh, -0.7 + idx * 0.12);
  }

  // NANAMI — the Ratio Wave in flight: a wide blunt-gold blade bar with the
  // white 7:3 division line riding at seventy percent of its width.
  ratioWaveTick(pos, dir, width, sweet = false) {
    const gold = sweet ? 0xffe9b8 : 0xffd98f;
    const bar = this._spawn(pos, { color: gold, size: width, aspect: 0.16, life: 0.13, vel: dir.clone().multiplyScalar(1.5) });
    this._bb(bar.mesh);
    // the 7:3 line, offset to the seventy-percent point of the blade
    const notch = this._spawn(pos.clone().add(v3(dir.z, 0, -dir.x).multiplyScalar(width * 0.2)), {
      color: 0xffffff, size: 0.55, aspect: 0.07, life: 0.13, vel: dir.clone().multiplyScalar(1.5)
    });
    this._bb(notch.mesh, Math.PI / 2);
    if (sweet) {
      this._spawn(pos.clone().add(v3(0, rand(0, 0.6), 0)), {
        color: 0xffffff, size: rand(0.1, 0.2), life: 0.25,
        vel: v3(rand(-2, 2), rand(1, 3), rand(-2, 2))
      });
    }
  }

  // HIGURUMA — the Verdict gavel itself, an oversized cursed-energy construct
  // hanging over the marked ground. Returned as a node; the entity drops it.
  gavelConstruct(radius) {
    const g = new THREE.Group();
    const wood = new THREE.MeshBasicMaterial({ color: 0x2c2436 });
    const trim = makeGlowMat(0xd8c78a, 0.9);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.34, radius * 0.34, radius * 0.9, 12), wood);
    head.rotation.z = Math.PI / 2;
    g.add(head);
    for (const s of [-1, 1]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.37, radius * 0.37, radius * 0.1, 12), trim);
      band.rotation.z = Math.PI / 2;
      band.position.x = s * radius * 0.38;
      g.add(band);
    }
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.07, radius * 0.09, radius * 1.5, 8), wood);
    handle.position.y = radius * 0.75;
    g.add(handle);
    g.userData.spinAxis = rand(0, Math.PI * 2);
    this.scene.add(g);
    return g;
  }
  // the court seal stamped where it lands: gold rings plus a bench of upright
  // bars around the rim, like the rail of a courtroom dock.
  gavelVerdict(pos, radius) {
    const base = pos.clone().setY(0.07);
    this._ring(base, 0xd8c78a, { size: radius * 0.45, growRate: 15, life: 0.4 });
    this._ring(base, 0xfff2cc, { size: radius * 0.3, growRate: 9, life: 0.5 });
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const bar = this._spawn(base.clone().add(v3(Math.cos(a) * radius * 0.85, 0.5, Math.sin(a) * radius * 0.85)), {
        color: i % 3 ? 0xd8c78a : 0xffffff, size: rand(0.7, 1.1), aspect: 0.12, life: rand(0.3, 0.5),
        vel: v3(0, rand(2, 4), 0), gravity: 10
      });
      this._bb(bar.mesh);
    }
    this.debris(base, 10, 0x4a4258);
  }

  // MAHITO — the Body Lance mid-extension: segments of pale reshaped flesh
  // shrinking toward a blade tip, plus the grey soul-ripple it drags.
  bodyLanceTick(from, tip, dir) {
    const len = from.distanceTo(tip);
    const segs = Math.max(2, Math.round(len * 1.6));
    for (let i = 0; i < segs; i++) {
      const k = i / segs;
      if (Math.random() > 0.5) continue;   // stochastic redraw — reads as writhing
      const p = from.clone().lerp(tip, k);
      this._spawn(p, {
        color: i % 3 ? 0x8b9bab : 0xb8c6d4, size: 0.5 * (1 - k * 0.6), life: 0.13,
        vel: v3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.4, 0.4))
      });
    }
    const blade = this._spawn(tip, { color: 0xdfe8f0, size: 0.8, aspect: 0.3, life: 0.1, vel: dir.clone().multiplyScalar(3) });
    this._bb(blade.mesh);
  }
  // the soul yanked visible: a grey silhouette burst rising off the body
  soulRip(pos) {
    for (let i = 0; i < 3; i++) {
      const bar = this._spawn(pos.clone().add(v3(rand(-0.2, 0.2), 0.2 + i * 0.4, rand(-0.2, 0.2))), {
        color: 0x8b9bab, size: 0.9 - i * 0.18, aspect: 1.6, life: 0.5,
        vel: v3(0, 1.6, 0)
      });
      bar.mesh.material.opacity = 0.5;
    }
    this._ring(pos.clone().add(v3(0, 1.1, 0)), 0x8b9bab, { size: 0.4, growRate: 5, life: 0.45, flat: false });
  }

  // HAKARI — one pachinko ball in flight: a hot neon bead with a falling
  // spark, gold when it is the jackpot ball.
  pachinkoTrail(pos, hot = false) {
    this._spawn(pos, { color: hot ? 0xffc93c : 0x69f0ae, size: hot ? 0.34 : 0.26, life: 0.1, vel: v3() });
    if (Math.random() < 0.6) {
      this._spawn(pos, {
        color: hot ? 0xfff3c4 : 0xb9f6ca, size: rand(0.06, 0.14), life: 0.24,
        vel: v3(rand(-1, 1), rand(-2, -0.5), rand(-1, 1))
      });
    }
  }

  // PANDA — the Quake Palm rupture front: turf and stone shoved up out of the
  // ground at the wavefront, one burst per tick.
  quakeTick(pos, radius) {
    const base = pos.clone().setY(0.08);
    this._ring(base, 0xdfe4ee, { size: radius * 0.4, growRate: 9, life: 0.22 });
    for (let i = 0; i < 5; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0.1, radius * 0.8);
      const sp = this._spawn(base.clone().add(v3(Math.cos(a) * r, 0.05, Math.sin(a) * r)), {
        color: i % 2 ? 0x6b6f78 : 0x8a8fa0, size: rand(0.3, 0.62), aspect: 0.3,
        life: rand(0.22, 0.4), vel: v3(rand(-1, 1), rand(5, 10), rand(-1, 1)), gravity: 22, spin: rand(-5, 5)
      });
      this._bb(sp.mesh);
    }
  }

  // TOJI — Playful Cloud whirling at full extension: a bar of staff-light
  // swept around the orbit angle, plus the wind it kicks loose.
  staffSpinTick(caster, radius, ang) {
    const p = caster.pos.clone().add(v3(Math.sin(ang) * radius * 0.7, 1.2, Math.cos(ang) * radius * 0.7));
    const bar = this._spawn(p, { color: 0xd8d2c4, size: radius * 0.9, aspect: 0.07, life: 0.11, vel: v3() });
    this._bb(bar.mesh, ang);
    this._spawn(p, {
      color: 0xf2ead8, size: rand(0.08, 0.18), life: 0.2,
      vel: v3(Math.cos(ang) * 3, rand(0, 1.5), -Math.sin(ang) * 3)
    });
  }

  // TOJI — PLAYFUL CLOUD overhead: the staff bar coming down plus a crack
  // line of thrown deck driven forward from the point of impact.
  staffSlamCrack(caster, dir, reach) {
    const at = caster.pos.clone().addScaledVector(dir, reach * 0.6);
    const bar = this._spawn(at.clone().setY(1.6), { color: 0xd8d2c4, size: 2.4, aspect: 0.09, life: 0.2, vel: v3(0, -6, 0) });
    this._bb(bar.mesh, 1.35);
    this._ring(at.clone().setY(0.07), 0xd8d2c4, { size: 0.5, growRate: 12, life: 0.35 });
    // the crack: hard flat bars stepped down the line with the debris they threw
    for (let i = 0; i < 4; i++) {
      const p = caster.pos.clone().addScaledVector(dir, 1.0 + i * 0.9).setY(0.1);
      const c = this._spawn(p, { color: i % 2 ? 0x8a8fa0 : 0xf2ead8, size: 0.9, aspect: 0.14, life: 0.24 + i * 0.05, vel: v3() });
      c.mesh.rotation.x = -Math.PI / 2;
      c.mesh.rotation.z = Math.atan2(dir.x, dir.z) + rand(-0.15, 0.15);
      c.mesh.userData.billboard = false;
      this.debris(p, 3, 0x6b6f78);
    }
  }

  // TOJI — SPLIT SOUL KATANA: the cut that ignores the body. Desaturated
  // soul-blue phantom slashes, and on the Soul Cut the target's soul flashed
  // out of register for a beat.
  soulSlashArc(caster, big = false) {
    const p = caster.pos.clone().add(v3(0, 1.3, 0)).addScaledVector(caster.forward(), 1.3);
    for (let k = 0; k < (big ? 3 : 2); k++) {
      const arc = this._spawn(p, {
        color: k === 0 ? 0xbfd4e8 : 0x8b9bab, size: big ? 2.5 : 2.0, aspect: 0.09,
        life: 0.2 + k * 0.04, vel: v3()
      });
      this._bb(arc.mesh, -0.5 + k * 0.55 + rand(-0.1, 0.1));
    }
    for (let i = 0; i < 7; i++) {
      this._spawn(p, {
        color: i % 2 ? 0xbfd4e8 : 0xffffff, size: rand(0.08, 0.18), life: 0.28,
        vel: v3(rand(-3, 3), rand(-1, 3), rand(-3, 3))
      });
    }
  }

  // TOJI — CHAIN OF A THOUSAND MILES: the actual chain, drawn as a run of
  // link motes from hand to target point with a crack at the tip.
  chainLinks(from, to) {
    const n = Math.max(6, Math.round(from.distanceTo(to) * 2.2));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = from.clone().lerp(to, k);
      p.y += Math.sin(k * Math.PI) * -0.25;      // slight sag
      this._spawn(p, {
        color: i % 3 === 0 ? 0xf2ead8 : 0x9aa0ae, size: i % 3 === 0 ? 0.16 : 0.11,
        life: 0.2 + k * 0.08, vel: v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))
      });
    }
    this._ring(to, 0x9aa0ae, { size: 0.3, growRate: 7, life: 0.22, flat: false });
  }

  // TOJI — the Inverted Spear's nullify landing: the technique being TURNED
  // OFF, drawn as a collapsing green seal around the victim.
  nullifySeal(pos) {
    this._ring(pos.clone().add(v3(0, 1.15, 0)), 0x6ea88a, { size: 1.5, growRate: -3.2, life: 0.4, flat: false });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bar = this._spawn(pos.clone().add(v3(Math.cos(a) * 0.9, 0.5 + (i % 3) * 0.45, Math.sin(a) * 0.9)), {
        color: i % 2 ? 0x6ea88a : 0xd9ffe8, size: 0.5, aspect: 0.12, life: 0.4,
        vel: v3(-Math.cos(a) * 1.6, 0, -Math.sin(a) * 1.6)
      });
      this._bb(bar.mesh, a);
    }
  }

  // TOJI — the spear thrust as a vacuum lance: a thin hard line of white
  // driven down the whole length in one frame.
  spearLance(origin, dir, range) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, range, 6, 1, true), makeGlowMat(0xf4f8ff, 0.95));
    mesh.position.copy(origin).addScaledVector(dir, range / 2);
    mesh.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
    this.scene.add(mesh);
    this.beams.push({ mesh, life: 0.22, maxLife: 0.22 });
    for (let i = 0; i < 8; i++) {
      const p = origin.clone().addScaledVector(dir, rand(0.5, range));
      this._spawn(p, {
        color: i % 2 ? 0xf4f8ff : 0x8fb6d8, size: rand(0.08, 0.2), life: 0.2,
        vel: v3(rand(-2, 2), rand(-1, 2), rand(-2, 2))
      });
    }
  }

  // GOJO — RED in flight: a core of repulsion with matter shoved off it,
  // and the burst when the stored push lets go all at once.
  redOrbTick(pos, dir) {
    this._spawn(pos, { color: 0xff5a4a, size: 0.55, life: 0.1, vel: v3() });
    this._spawn(pos, { color: 0xffc0a8, size: 0.28, life: 0.08, vel: v3() });
    for (let i = 0; i < 2; i++) {
      this._spawn(pos.clone().add(v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))), {
        color: i ? 0xff6a4a : 0xffffff, size: rand(0.1, 0.22), life: 0.22,
        vel: dir.clone().multiplyScalar(-rand(3, 7)).add(v3(rand(-1.5, 1.5), rand(-1, 1.5), rand(-1.5, 1.5)))
      });
    }
    if (Math.random() < 0.25) this._ring(pos, 0xff8a6a, { size: 0.3, growRate: 4, life: 0.14, flat: false });
  }
  redOrbBurst(pos) {
    const core = this._spawn(pos, { color: 0xff5a4a, size: 1.0, life: 0.35, vel: v3(), grow: 11 });
    this._bb(core.mesh);
    this._ring(pos, 0xff8a6a, { size: 0.5, growRate: 18, life: 0.4, flat: false });
    this._ring(pos.clone().setY(0.07), 0xff5a4a, { size: 0.5, growRate: 14, life: 0.35 });
    for (let i = 0; i < 20; i++) {
      const a = rand(0, Math.PI * 2), b = rand(-0.5, 1);
      this._spawn(pos, {
        color: i % 3 ? 0xff6a4a : 0xffc0a8, size: rand(0.15, 0.4), life: rand(0.25, 0.5),
        vel: v3(Math.cos(a) * rand(6, 14), b * 6, Math.sin(a) * rand(6, 14))
      });
    }
  }

  // SUKUNA — one tick of the Dismantle wavefront: a hard red X and the thin
  // line of the cut racing ahead of it.
  dismantleTick(pos, dir, width) {
    for (const rz of [0.7, -0.7]) {
      const bar = this._spawn(pos, { color: Math.random() < 0.3 ? 0xffffff : 0xff2f45, size: width * 1.3, aspect: 0.06, life: 0.13, vel: dir.clone().multiplyScalar(2) });
      this._bb(bar.mesh, rz + rand(-0.12, 0.12));
    }
    this._spawn(pos.clone().add(v3(rand(-0.4, 0.4), rand(-0.3, 0.5), rand(-0.4, 0.4))), {
      color: 0xff2f45, size: rand(0.08, 0.2), life: 0.2,
      vel: v3(rand(-2, 2), rand(-1, 2), rand(-2, 2))
    });
  }

  // YUTA — Rika's arm, manifested: an oversized spectral hand built from
  // boxes, palm open, flown by the rikaHand entity. Returned as a node.
  rikaHandNode() {
    const g = new THREE.Group();
    const mat = makeGlowMat(0x9ff5c9, 0.55);
    const dark = makeGlowMat(0x1a3a30, 0.7);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.35), mat);
    g.add(palm);
    for (let i = 0; i < 4; i++) {
      const fing = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.75, 0.22), i % 2 ? mat : dark);
      fing.position.set(-0.33 + i * 0.22, 0.82, 0);
      fing.rotation.x = -0.25;
      g.add(fing);
    }
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.55, 0.22), dark);
    thumb.position.set(0.55, 0.15, 0);
    thumb.rotation.z = -0.7;
    g.add(thumb);
    this.scene.add(g);
    return g;
  }

  // ===========================================================================
  // PROCEDURAL TECHNIQUE GEOMETRY. The builders live in fx/props.js; these
  // wrappers give each prop its motion. Self-animating ones (roots, blooms,
  // frames, slabs, seals) are fire-and-forget; the entity-driven ones return a
  // bare node the owning mechanic moves itself, the way woodenBall already did.
  // ===========================================================================

  // HANAMI — a clump of roots surging out of the deck and sinking back. Overshoots
  // its height on the way up and leans as it goes, so a run of them along a line
  // reads as one thing travelling underground rather than five separate props.
  rootSurge(pos, { len = 2.2, natural = false, lean = null, life = 1.1 } = {}) {
    const node = buildRootClump(len, natural);
    node.position.copy(pos);
    node.rotation.y = rand(0, Math.PI * 2);
    if (lean) {
      // tip the whole clump along the direction of travel — gently, so the
      // run of them rakes forward without lying down
      node.rotation.x = lean.z * 0.16;
      node.rotation.z = -lean.x * 0.16;
    }
    node.scale.set(1, 0.02, 1);
    this.prop(node, life, (n, k) => {
      // 0 -> 0.25 burst up with overshoot, hold, then withdraw
      const up = k < 0.25 ? k / 0.25 : 1;
      const grow = up < 1 ? 1.18 * Math.sin(up * Math.PI * 0.5) : 1;
      const sink = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      n.scale.set(1, Math.max(0.02, grow * sink), 1);
      n.rotation.y += 0.012;
    });
    this.debris(pos, 5, natural ? 0x4e7a3a : 0x6a4f34);
    return node;
  }

  // YUJI — the cursed-energy bloom: forced up out of the ground, holds, and
  // is gone. The effect detonates it on its own clock; this is just the object.
  ceBloomAt(pos, radius = 1.3, life = 0.6) {
    const node = buildCEBloom(radius);
    node.position.copy(pos);
    node.scale.setScalar(0.05);
    this.prop(node, life, (n, k) => {
      const s = k < 0.3 ? (k / 0.3) : 1 + Math.sin((k - 0.3) * 8) * 0.06;
      n.scale.setScalar(Math.max(0.05, s * (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1)));
      n.rotation.y += 0.05;
      n.rotation.x += 0.02;
    });
    return node;
  }

  // NAOYA — one film frame popping into existence and shattering. The pane
  // flashes out first, then the frame falls apart.
  filmFrameAt(pos, facing = 0, idx = 0) {
    const node = buildFilmFrame();
    node.position.copy(pos);
    node.rotation.y = facing + rand(-0.2, 0.2);
    node.scale.setScalar(0.2);
    this.prop(node, 0.4, (n, k) => {
      n.scale.setScalar(k < 0.18 ? 0.2 + (k / 0.18) * 0.8 : 1 + k * 0.25);
      const pane = n.userData.pane;
      if (pane) pane.material.opacity = Math.max(0, 0.16 * (1 - k * 3));
      n.traverse(o => { if (o.material && o !== pane) o.material.opacity = 1 - k * k; });
      n.position.y += 0.6 * (k > 0.5 ? 0.02 : 0);
    });
    for (let i = 0; i < 6; i++) {
      this._spawn(pos.clone().add(v3(rand(-0.6, 0.6), rand(-0.8, 0.8), rand(-0.3, 0.3))), {
        color: idx % 2 ? 0xe8c85a : 0xfff0c0, size: rand(0.1, 0.22), aspect: 0.35,
        life: rand(0.15, 0.3), vel: v3(rand(-2, 2), rand(-1, 3), rand(-2, 2))
      });
    }
    return node;
  }

  // NAOYA — the afterimage he leaves standing in a position he has already left.
  projectionPlateAt(pos, facing) {
    const node = buildProjectionPlate();
    node.position.copy(pos);
    node.rotation.y = facing;
    this.prop(node, 0.35, (n, k) => {
      n.traverse(o => { if (o.material) o.material.opacity = (o.material.opacity ?? 1) * (1 - k * 0.14); });
      n.scale.x = 1 + k * 0.3;
    });
    return node;
  }

  // SHARED — a slab of the deck driven up out of the floor, then crumbling.
  stoneSlabAt(pos, { w = 1.1, h = 1.8, color = 0x6b6f78, life = 0.9 } = {}) {
    const node = buildStoneSlab(w, h, color);
    node.position.copy(pos);
    node.scale.set(1, 0.05, 1);
    this.prop(node, life, (n, k) => {
      const up = Math.min(1, k / 0.18);
      const fall = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      n.scale.set(1, Math.max(0.05, up * fall), 1);
    });
    this.debris(pos, 6, color);
    return node;
  }

  // TOJI — the seal the Inverted Spear stamps when it turns a technique off.
  nullifySealAt(pos, radius = 1.4) {
    const node = buildNullifySeal(radius);
    node.position.copy(pos).add(v3(0, 1.1, 0));
    this._bb(node);
    this.prop(node, 0.5, (n, k) => {
      n.scale.setScalar(1 - k * 0.55);
      // the spin rides in the billboard roll, not in rotation.z — the per-eye
      // aim rewrites the quaternion outright, so a roll written here would be
      // thrown away before it ever drew
      n.userData.bbRoll += 0.09;
      n.traverse(o => { if (o.material) o.material.opacity = 1 - k; });
    });
    return node;
  }

  // ---- entity-driven nodes: the mechanic owns the motion ------------------
  manjiNode(size = 1.1) { const n = buildManji(size); this.scene.add(n); return n; }
  ballNode(r = 0.9, gold = false) { const n = buildPachinkoBall(r, gold); this.scene.add(n); return n; }
  spearNode(len = 3.2) { const n = buildSpear(len); this.scene.add(n); return n; }
  soulBladeNode(len = 3.0, big = false) { const n = buildSoulBlade(len, big); this.scene.add(n); return n; }
  staffNode(len = 2.6) { const n = buildPlayfulCloud(len); this.scene.add(n); return n; }
  chainNode(links = 14) { const n = buildChainRope(links); this.scene.add(n); return n; }

  // lay a chain node between two world points: one position, one quaternion,
  // one stretch along its own +Z
  layChain(node, from, to) {
    if (!node) return;
    const d = to.clone().sub(from);
    const len = Math.max(0.001, d.length());
    node.position.copy(from);
    node.quaternion.setFromUnitVectors(v3(0, 0, 1), d.clone().normalize());
    node.scale.z = len / (node.userData.length || 1);
  }

  // drop an entity-driven node with a small burst so it never just vanishes
  popProp(node, color = 0xffffff) {
    if (!node) return;
    for (let i = 0; i < 8; i++) {
      const a = rand(0, Math.PI * 2);
      this._spawn(node.position.clone(), {
        color, size: rand(0.1, 0.26), life: rand(0.15, 0.3),
        vel: v3(Math.cos(a) * rand(2, 6), rand(-1, 3), Math.sin(a) * rand(2, 6))
      });
    }
    this._disposeNode(node);
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
    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      p.t += dt;
      const k = p.life > 0 ? Math.min(1, p.t / p.life) : 1;
      if (p.onUpdate) p.onUpdate(p.node, k, dt);
      if (p.t >= p.life) { this._disposeNode(p.node); this.props.splice(i, 1); }
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
    // ---- THE FROST SHELLS ------------------------------------------------
    // Follow the body's POSITION and not its rotation (see `frostShell`), and
    // grow on Y over the first tenth of a second so the ice closes over
    // somebody rather than appearing around them — rule 3 of the ice shape
    // language in fx/frostfx.js.
    if (this._shells?.length) {
      for (let i = this._shells.length - 1; i >= 0; i--) {
        const sh = this._shells[i];
        // a victim who died, was removed, or had the shell disposed under us
        if (!sh.victim?.alive || sh.victim._frostNode !== sh.node) {
          this.frostShatter(sh.victim, true);
          this._shells.splice(i, 1);
          continue;
        }
        sh.t += dt;
        sh.node.position.copy(sh.victim.pos);
        const g = Math.min(1, sh.t / 0.10);
        sh.node.scale.set(0.72 + 0.28 * g, g, 0.72 + 0.28 * g);
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
    // Billboards and spin decorations are driven in core/stage.js: billboards
    // because they have to be aimed once per eye, spin because it rides along
    // in the same pass and there is no reason to walk the scene twice.
  }
}
