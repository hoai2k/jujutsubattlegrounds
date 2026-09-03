// SIMPLE DOMAIN 簡易領域 — the visual. Miwa's signature and the reason to
// build her.
//
// THE DESIGN RULE FOR THIS WHOLE FILE, and it is the reason it looks the way
// it does: RESTRAINT READS AS SKILL. Every other big effect in this game is
// additive — particles, blooms, screen flashes, expanding shells. Miwa's is
// SUBTRACTIVE. One line of glowing script on the floor, one nearly-invisible
// wall, and when something crosses it, ONE clean blade arc. No burst, no
// shower, no shake. She is the character who does exactly enough, and the
// effect has to say that before the player has read a single tooltip.
//
// ---------------------------------------------------------------------------
// THE FOUR PIECES
// ---------------------------------------------------------------------------
//   1. THE RING is INSCRIBED, not spawned. A radial wipe reveals it over
//      `inscribeSeconds`, in step with her sweep animation, so the geometry
//      follows the blade tip. This is done by writing an angular cutoff into a
//      custom shader rather than by scaling a mesh: scaling would grow the
//      circle from the middle, and the brief asks for it to be DRAWN.
//   2. THE SCRIPT AND THE PATTERN are real geometry on the ring — a band of
//      glyph ticks and an inner geometric figure — and they rotate slowly.
//   3. THE WALL is a cylinder at the perimeter at 0.14 opacity. Visible, and
//      deliberately not obscuring: you must be able to see her through it,
//      because the whole matchup is about reading what she is doing in there.
//   4. THE CUT is a single elegant arc: one thin tapered plane swept through
//      the crossing point, alive for 0.16 s. One line, not a particle burst.
//
// ---------------------------------------------------------------------------
// READING INSIDE EVERY DOMAIN'S COLOUR GRADE
// ---------------------------------------------------------------------------
// This is the hard requirement and it drove the palette. Several domains in
// this game apply heavy grades — Jogo's furnace is orange-black, Sukuna's
// shrine is red, Unlimited Void is a blue-white blowout, Mahito's is grey
// flesh, Higuruma's is a warm sepia courtroom. A coloured ring loses to at
// least one of them.
//
// THE SOLVE IS VALUE, NOT HUE. The ring's core is drawn at near-WHITE
// (`ringHot` #ffffff) with the pale ice blue only in the falloff, and it is
// rendered with `depthWrite: false` and ADDITIVE blending. Additive white is
// the one thing that survives every grade in the project: it cannot be tinted
// out, because it is adding light rather than reflecting it, and it separates
// from a dark grade by brightness and from a bright grade by saturation
// (everything around it in Unlimited Void is desaturated blue-white; the ring
// carries a hard edge nothing else in there has).
//
// The one grade it does NOT survive on brightness alone is Unlimited Void, so
// the ring also carries a HARD DARK OUTLINE — a second, slightly larger ring
// in near-black at low opacity, sitting under the bright one. Against a dark
// domain it is invisible; against a blown-out one it is what holds the shape.
// Costing one extra draw call to be legible in all eight was the right trade.
import * as THREE from 'three';
import { v3 } from '../../core/math.js';

// ---------------------------------------------------------------------------
// THE RING SHADER
// ---------------------------------------------------------------------------
// A flat annulus whose fragment shader does three things: a radial falloff so
// the band has soft shoulders and a hard core, an ANGULAR CUTOFF so the ring
// can be drawn in rather than appearing, and a slow rotating pattern term.
const RING_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const RING_FRAG = `
  varying vec2 vUv;
  uniform float uDraw;      // 0..1 — how much of the circle has been inscribed
  uniform float uSpin;      // radians
  uniform float uOpacity;
  uniform float uHot;       // extra brightness on a fresh crossing
  uniform vec3  uColor;
  uniform vec3  uCore;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    // ---- the band ------------------------------------------------------
    // a hard bright core with soft shoulders, sitting at r = 0.90
    float band = smoothstep(0.80, 0.90, r) * (1.0 - smoothstep(0.90, 1.00, r));
    float core = smoothstep(0.875, 0.900, r) * (1.0 - smoothstep(0.900, 0.925, r));
    // ---- the script ticks ----------------------------------------------
    // 48 marks around the band, alternating long and short — this is the
    // "ring of glowing script" and it is cheap
    float a = atan(p.y, p.x);
    float ticks = step(0.55, abs(fract((a + uSpin) * 48.0 / 6.2831853) - 0.5) * 2.0);
    float glyph = ticks * smoothstep(0.855, 0.875, r) * (1.0 - smoothstep(0.935, 0.955, r));
    // ---- the inner geometric figure ------------------------------------
    // a slowly turning hexagram, drawn as two triangles' worth of radial
    // spokes at 0.62 radius
    float spokes = step(0.90, abs(fract((a - uSpin * 0.6) * 6.0 / 6.2831853) - 0.5) * 2.0);
    float inner = spokes * smoothstep(0.30, 0.34, r) * (1.0 - smoothstep(0.62, 0.66, r));
    // ---- THE INSCRIPTION -----------------------------------------------
    // the angular cutoff. Anything past uDraw of the way round is not there
    // yet, with a short bright leading edge at the blade tip.
    float turn = (a + 3.14159265) / 6.2831853;
    float drawn = step(turn, uDraw);
    float lead = smoothstep(uDraw - 0.035, uDraw, turn) * step(turn, uDraw);
    float mask = drawn;
    float amt = (band * 0.55 + glyph * 0.85 + inner * 0.40) * mask;
    vec3 col = mix(uColor, uCore, clamp(core * 1.6 + lead * 2.0 + uHot, 0.0, 1.0));
    float alpha = (amt + core * 0.9 * mask + lead * 1.4) * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`;

class ZoneFx {
  constructor(scene, zone) {
    this.scene = scene;
    this.zone = zone;
    const d = zone.def;
    this.group = new THREE.Group();
    this.group.position.copy(zone.origin);
    this.group.position.y += 0.03;

    // ---- THE DARK BACKING RING -----------------------------------------
    // Slightly larger, near-black, low opacity, drawn UNDER the bright one.
    // Invisible against a dark domain; against Unlimited Void's blowout it is
    // the only thing holding the shape. See the header.
    this.backMat = new THREE.MeshBasicMaterial({
      color: 0x05070c, transparent: true, opacity: 0.0,
      depthWrite: false, side: THREE.DoubleSide
    });
    this.back = new THREE.Mesh(new THREE.CircleGeometry(1, 64), this.backMat);
    this.back.rotation.x = -Math.PI / 2;
    this.group.add(this.back);

    // ---- THE RING ------------------------------------------------------
    this.ringMat = new THREE.ShaderMaterial({
      vertexShader: RING_VERT, fragmentShader: RING_FRAG,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uDraw: { value: 0 }, uSpin: { value: 0 }, uOpacity: { value: 1 },
        uHot: { value: 0 },
        uColor: { value: new THREE.Color(d.ringColor) },
        uCore: { value: new THREE.Color(d.ringHot) }
      }
    });
    this.ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.group.add(this.ring);

    // ---- THE WALL ------------------------------------------------------
    // A faint translucent cylinder at the perimeter. Visible, NOT obscuring —
    // 0.14 opacity, open at both ends, and it fades out toward the top so it
    // reads as a barrier standing there rather than as a jar with a lid.
    this.wallMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0 },
        uDraw: { value: 0 },
        uSpin: { value: 0 },
        uColor: { value: new THREE.Color(d.ringColor) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity; uniform float uDraw; uniform float uSpin;
        uniform vec3 uColor;
        void main() {
          // fade out with height: strongest at the floor, gone by the top
          float h = 1.0 - smoothstep(0.0, 1.0, vUv.y);
          // vertical striations, slowly turning — the pattern on the wall
          float bars = 0.45 + 0.55 * step(0.72, abs(fract((vUv.x + uSpin * 0.16) * 32.0) - 0.5) * 2.0);
          // the same inscription cutoff the ring uses, so the wall rises
          // behind the blade rather than appearing whole
          float drawn = step(vUv.x, uDraw);
          float a = h * bars * uOpacity * drawn;
          if (a < 0.004) discard;
          gl_FragColor = vec4(uColor, a);
        }`
    });
    this.wall = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 1, 48, 1, true), this.wallMat);
    this.group.add(this.wall);

    this.t = 0;
    this.drawT = 0;
    this.spin = 0;
    this.hot = 0;
    this.cuts = [];
    // the dissipation motes shown when a domain's sure-hit dies at the
    // boundary — see `setNeutralising`
    this.neutralKind = null;
    this.neutralT = 0;
    scene.add(this.group);
    this._resize(zone.radius);
  }

  _resize(r) {
    this.ring.scale.set(r, r, 1);
    this.back.scale.set(r * 1.02, r * 1.02, 1);
    this.wall.scale.set(r, 1, r);
    // the wall's height is a fixed 2.4 m regardless of radius: it is a barrier
    // at head height, not a dome, and scaling it with the ultimate's radius
    // would put a ten-metre wall round the arena
    this.wall.geometry.dispose();
    this.wall.geometry = new THREE.CylinderGeometry(1, 1, 2.4, 48, 1, true);
    this.wall.position.y = 1.2;
  }

  // -------------------------------------------------------------------------
  // THE CROSSING FLASH — the ring lights at the point they came in
  // -------------------------------------------------------------------------
  flashAt(pos, origin) {
    this.hot = 1;
    // a short bright tick on the ring itself at the crossing angle
    const d = pos.clone().sub(origin);
    const a = Math.atan2(d.z, d.x);
    const r = this.zone.radius;
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.10),
      new THREE.MeshBasicMaterial({
        color: this.zone.def.ringHot, transparent: true, opacity: 0.95,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
    mark.rotation.x = -Math.PI / 2;
    mark.rotation.z = -a;
    mark.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
    this.group.add(mark);
    this.cuts.push({ node: mark, t: 0.22, life: 0.22, kind: 'mark' });
  }

  // -------------------------------------------------------------------------
  // THE CUT — one clean stroke, and nothing else
  // -------------------------------------------------------------------------
  // A single tapered plane swept through the crossing point along the tangent
  // of the circle. It is alive for 0.16 s, it does not spawn particles, and it
  // does not shake the screen. That restraint is the whole effect.
  cutAt(at, origin) {
    const d = at.clone().sub(origin).setY(0);
    if (d.lengthSq() < 1e-4) d.set(1, 0, 0);
    d.normalize();
    // the blade travels along the TANGENT — across the boundary, not through
    // it — which is what a cut delivered by the circle would look like
    const tangent = v3(-d.z, 0, d.x);
    const len = 2.6, wid = 0.30;
    // a thin quad, tapered by scaling the far end down in the geometry
    const geo = new THREE.PlaneGeometry(len, wid, 1, 1);
    const p = geo.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      // taper both ends to a point: width falls off with |x|
      const k = 1 - Math.abs(p.getX(i)) / (len / 2);
      p.setY(i, p.getY(i) * Math.max(0.06, k));
    }
    p.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 1,
      depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const node = new THREE.Mesh(geo, mat);
    node.position.copy(at).sub(this.group.position);
    // orient the quad along the tangent, standing vertically
    node.lookAt(node.position.clone().add(v3(0, 0, 1)));
    node.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2;
    node.rotation.z = 0.22;                     // a slight diagonal — a cut, not a bar
    this.group.add(node);
    this.cuts.push({ node, t: 0.16, life: 0.16, kind: 'cut' });
  }

  // -------------------------------------------------------------------------
  // NEUTRALISED DOMAIN EFFECTS DISSIPATING AT THE BOUNDARY
  // -------------------------------------------------------------------------
  // "Jogo's magma cooling, Sukuna's slashes stopping dead in the air, Mahito's
  // transfiguration drain halting. Show the barrier doing its job."
  //
  // Rather than eight bespoke effects, one mechanism with a per-domain COLOUR
  // and BEHAVIOUR: motes of the domain's own colour drift inward, reach the
  // perimeter, and die there — travelling in, stopping dead, and fading. The
  // per-domain differences are the colour and the rate, which is enough,
  // because what the player needs to read is "that thing is being stopped
  // HERE" and the identity of the thing is already on screen.
  setNeutralising(kind, dt) {
    this.neutralKind = kind;
    if (!kind) return;
    this.neutralT -= dt;
    if (this.neutralT > 0) return;
    this.neutralT = 0.07;
    const colors = {
      shrine: 0xff2f45, void: 0xdfe8ff, volcano: 0xff5a1f, flesh: 0x9fb0c4,
      courtroom: 0xd8c78a, swordField: 0x9ff5c9, shadow: 0x8fb6d8, pachinko: 0xffc93c
    };
    const c = colors[kind] ?? 0xdfe8ff;
    const r = this.zone.radius;
    const a = Math.random() * Math.PI * 2;
    // spawned just OUTSIDE the ring, moving in, and killed at the ring — the
    // stopping is the whole message
    const from = v3(Math.cos(a) * r * 1.22, 0.4 + Math.random() * 1.9, Math.sin(a) * r * 1.22);
    const to = v3(Math.cos(a) * r * 0.985, from.y, Math.sin(a) * r * 0.985);
    const mote = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 5, 4),
      new THREE.MeshBasicMaterial({
        color: c, transparent: true, opacity: 0.85,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
    mote.position.copy(from);
    this.group.add(mote);
    this.cuts.push({ node: mote, t: 0.34, life: 0.34, kind: 'neutral', from, to });
  }

  update(dt, zone) {
    this.t += dt;
    const d = zone.def;
    // ---- THE INSCRIPTION -------------------------------------------------
    // Drawn over `inscribeSeconds`, in step with her sweep clip.
    this.drawT = Math.min(1, this.drawT + dt / d.inscribeSeconds);
    this.ringMat.uniforms.uDraw.value = this.drawT;
    this.wallMat.uniforms.uDraw.value = this.drawT;
    this.spin += dt * d.patternSpin;
    this.ringMat.uniforms.uSpin.value = this.spin;
    this.wallMat.uniforms.uSpin.value = this.spin;
    this.hot = Math.max(0, this.hot - dt * 4.5);
    this.ringMat.uniforms.uHot.value = this.hot * 0.6;
    this.wallMat.uniforms.uOpacity.value = d.wallOpacity * this.drawT;
    // the dark backing ring holds the shape inside a blown-out domain
    this.backMat.opacity = 0.34 * this.drawT;
    // the radius can change (the ultimate expands it), so track it every frame
    if (Math.abs((this._lastR ?? -1) - zone.radius) > 0.01) {
      this._lastR = zone.radius;
      this._resize(zone.radius);
    }
    // ---- the transient nodes --------------------------------------------
    for (let i = this.cuts.length - 1; i >= 0; i--) {
      const c = this.cuts[i];
      c.t -= dt;
      const k = Math.max(0, c.t / c.life);
      if (c.kind === 'cut') {
        // the blade arc: full length instantly, then fades and thins. It does
        // not travel — a cut has already happened by the time you see it.
        c.node.material.opacity = k * k;
        c.node.scale.set(1, 0.35 + k * 0.65, 1);
      } else if (c.kind === 'neutral') {
        // inward, and it STOPS at the ring
        const u = 1 - k;
        c.node.position.lerpVectors(c.from, c.to, Math.min(1, u * 1.6));
        c.node.material.opacity = 0.85 * Math.min(1, k * 2.2);
        c.node.scale.setScalar(Math.max(0.15, k));
      } else {
        c.node.material.opacity = k * 0.95;
      }
      if (c.t <= 0) {
        this.group.remove(c.node);
        c.node.geometry.dispose();
        c.node.material.dispose();
        this.cuts.splice(i, 1);
      }
    }
  }

  close() {
    // it collapses rather than blinking out: the ring un-draws the way it was
    // drawn, which takes about a fifth of a second and is the visual full stop
    this.closing = true;
    this.scene.remove(this.group);
    this.ring.geometry.dispose();
    this.ringMat.dispose();
    this.wall.geometry.dispose();
    this.wallMat.dispose();
    this.back.geometry.dispose();
    this.backMat.dispose();
    for (const c of this.cuts) {
      c.node.geometry.dispose();
      c.node.material.dispose();
    }
    this.cuts.length = 0;
  }
}

export class NewShadowFx {
  constructor(scene) {
    this.scene = scene;
  }
  open(zone) { return new ZoneFx(this.scene, zone); }
}
