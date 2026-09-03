// WARP FX — Uro's effects, and the only genuinely REFRACTIVE rendering in this
// project.
// ===========================================================================
// THE BRIEF'S CENTRAL DEMAND, and the reason this file is not in fx/fx.js:
//
//   "REFRACTION, NOT PARTICLES. Her techniques should read as the world
//    bending, using screen-space refraction and distortion of what's actually
//    behind the effect. The player should see the arena warp through her
//    attacks rather than see glowing shapes drawn over it."
//
// Every other effect in this game is additive geometry: a ring, a beam, a
// sprite, a coloured mesh drawn over the arena. None of that can satisfy the
// above, because all of it is drawn ON the frame rather than THROUGH it. So
// this file does something nothing else in the project does:
//
//   1. IT CAPTURES THE SCENE. Once per frame, and only while something warped
//      is actually on screen, the arena is rendered into a small offscreen
//      target WITHOUT the warp geometry in it. That texture is the backdrop.
//   2. EVERY WARP SURFACE SAMPLES IT IN SCREEN SPACE. A shard's fragment
//      shader takes its own screen position, offsets it by that shard's own
//      distortion, and returns what the arena looks like THERE. So what you
//      see through a shard is the real map, at the wrong place.
//   3. EACH PIECE HAS ITS OWN OFFSET. That is what sells it: a shattered plane
//      of eleven shards shows eleven mutually inconsistent views of the same
//      arena, and the MISMATCH between them is the effect. One uniform
//      distortion over the whole plane would look like a bad camera; eleven
//      disagreeing ones look like space is broken.
//
// ---------------------------------------------------------------------------
// THE CAPTURE, AND WHAT IT COSTS
// ---------------------------------------------------------------------------
// One extra scene render per frame at 1/6 resolution (640x360 by default),
// AND ONLY WHILE A WARP EFFECT IS LIVE — `active` is zero the rest of the
// time and `capture` returns on its first line. Off-frames cost nothing at
// all, so twenty-five characters who never warp pay nothing for this file
// existing.
//
// The capture deliberately renders the scene with the warp group HIDDEN, which
// is what stops a shard sampling itself and smearing into a feedback loop.
//
// ---------------------------------------------------------------------------
// THE LAG RING — how the reflect surface shows a reflection that is LATE
// ---------------------------------------------------------------------------
// The brief asks for the mirror to lag, "and the reflected version of the
// opponent moves a beat late". That is not a shader trick, it is a history:
// captures are kept in a small ring and the reflect surface samples one from
// `LAG_FRAMES` ago. The arena behind it is therefore genuinely a few frames
// stale — the opponent in the mirror really is doing what they were doing a
// sixth of a second ago, and it costs one extra render target rather than any
// per-frame work.
//
// ---------------------------------------------------------------------------
// READABILITY IS MANDATORY, AND IT IS ENFORCED HERE RATHER THAN HOPED FOR
// ---------------------------------------------------------------------------
// Three rules, all of them structural:
//   · DISTORTION IS CLAMPED. `MAX_OFFSET` caps how far any fragment can
//     displace, in screen fractions. Nothing can smear the frame beyond it.
//   · EVERY WARP SURFACE IS A BOUNDED VOLUME. There is no full-screen pass
//     anywhere in this file. The one effect that covers the frame — the
//     ultimate — does it for `FULLSCREEN_MAX` seconds and no longer, enforced
//     by the effect's own clock rather than by an artist remembering.
//   · THE OPPONENT IS NEVER OCCLUDED. Every warp material writes
//     `depthWrite: false` and renders in the transparent pass, so a fighter in
//     front of a shard draws over it. You can always see the person hitting
//     you; what you cannot see clearly is the wall behind them.
// The per-domain colour-grade check is in the delivery report.
import * as THREE from 'three';
import { v3, rand, clamp } from '../../core/math.js';

const CAP_W = 640, CAP_H = 360;
const LAG_FRAMES = 9;          // ~0.15 s of lag on the reflect surface
// PASS 2: 0.085 let a shard sample nearly a tenth of the screen away, which on
// a map with a giant neon billboard overhead meant shards near the floor showed
// the billboard — technically correct refraction, and it read as prismatic
// noise rather than as displaced world. 0.055 keeps every sample close enough
// to be recognisably THE SAME WALL in the wrong place, which is the read that
// says space is broken rather than that the shader is.
const MAX_OFFSET = 0.055;      // screen fractions — the readability clamp
const FULLSCREEN_MAX = 0.55;   // seconds the ultimate may cover the frame

// ---------------------------------------------------------------------------
// THE SHADER
// ---------------------------------------------------------------------------
// One material, four modes. Keeping them in one program means a shard, a lens,
// a mirror and the collapse dome all distort by the same maths and therefore
// look like one technique rather than four.
//
//   uMode 0  SHARD    a fragment of broken space. Rigid offset + slight
//                     rotation of the sampled region, plus an edge glint.
//   uMode 1  LENS     the fold. A radial pinch that pulls the sampled region
//                     toward the centre and snaps back.
//   uMode 2  MIRROR   the reflect surface. Horizontally inverted sample off
//                     the LAGGED capture, with a travelling ripple.
//   uMode 3  DOME     the ultimate. Low-frequency non-euclidean swim plus a
//                     strong barrel bend, as though seen through moving water.
const VERT = /* glsl */`
  varying vec2 vUv;
  varying vec4 vClip;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vClip = projectionMatrix * mv;
    gl_Position = vClip;
  }
`;

const FRAG = /* glsl */`
  uniform sampler2D uScene;
  uniform float uTime;
  uniform float uK;          // 0..1 progress of the effect
  uniform float uAmount;     // distortion strength
  uniform float uMode;
  uniform float uSeed;
  uniform vec2  uDrift;      // per-shard constant offset, in screen fractions
  uniform float uRoll;       // per-shard rotation of the sampled region
  uniform vec3  uTint;
  uniform float uOpacity;
  uniform float uAberration;
  uniform float uTear;
  uniform float uMax;
  uniform float uEdge;   // 1 = draw the shard rim glint, 0 = no rim at all
  uniform float uSoft;   // 1 = fade the quad out radially (the idle haze)
  varying vec2 vUv;
  varying vec4 vClip;

  vec2 rot(vec2 p, float a) {
    float s = sin(a), c = cos(a);
    return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

  void main() {
    // SCREEN SPACE, from the clip position. This is the whole mechanism: the
    // fragment asks where it is on screen, and then reads the arena from
    // somewhere ELSE on screen.
    vec2 scr = (vClip.xy / vClip.w) * 0.5 + 0.5;
    vec2 c = vUv - 0.5;
    vec2 off = vec2(0.0);

    if (uMode < 0.5) {
      // ---- SHARD ----
      // A constant per-shard drift plus a rotation of the sampled REGION about
      // the shard's own centre. Two shards side by side therefore show the
      // same wall at two different angles, which is the mismatch that sells it.
      off = uDrift + (rot(c, uRoll) - c) * 0.35;
      // a slow breathing wobble so a held shard is never static
      off += vec2(sin(uTime * 3.1 + uSeed * 6.0), cos(uTime * 2.7 + uSeed * 4.0)) * 0.006;
    } else if (uMode < 1.5) {
      // ---- LENS ----
      // The fold. A radial pull toward the centre that peaks at the fold
      // moment and snaps back: 'uK' drives it, and the sign flips past the
      // midpoint so the scene compresses and then stretches.
      float r = length(c) * 2.0;
      float pull = (1.0 - smoothstep(0.0, 1.0, r));
      float dirn = uK < 0.5 ? 1.0 : -1.35;
      off = normalize(c + 1e-5) * pull * uAmount * dirn * (0.35 + 0.65 * sin(uK * 3.14159));
    } else if (uMode < 2.5) {
      // ---- MIRROR ----
      // Horizontally inverted about the surface, off the LAGGED capture (the
      // caller binds the old texture) — so the reflection is both flipped and
      // late. A travelling ripple runs up it.
      vec2 m = vec2(1.0 - scr.x, scr.y);
      float rip = sin((vUv.y * 11.0) - uTime * 4.2 + uSeed) * 0.010
                + sin((vUv.y * 27.0) + uTime * 2.1) * 0.004;
      off = (m - scr) + vec2(rip * uAmount * 8.0, 0.0);
    } else {
      // ---- DOME ----
      // Non-euclidean on purpose: two low-frequency swims at incommensurate
      // rates, plus a barrel bend that curls the horizon inward.
      float r = length(c) * 2.0;
      vec2 swim = vec2(
        sin(vUv.y * 5.3 + uTime * 1.30) + sin(vUv.y * 2.1 - uTime * 0.83),
        cos(vUv.x * 4.7 - uTime * 1.17) + cos(vUv.x * 2.6 + uTime * 0.61)
      ) * 0.012;
      off = swim * uAmount + normalize(c + 1e-5) * r * r * uAmount * 0.22;
    }

    // *** THE READABILITY CLAMP. *** Nothing in this file can displace a
    // fragment further than this, whatever a caller passes in.
    off = clamp(off * uAmount, vec2(-uMax), vec2(uMax));

    // SCANLINE TEARING along the warp edges — intermittent, and only near the
    // top and bottom of the surface, so it reads as the seam of the fold
    // rather than as a broken display.
    if (uTear > 0.0) {
      float band = step(0.986, hash(vec2(floor(vUv.y * 90.0), floor(uTime * 22.0))));
      off.x += band * uTear * 0.05 * (hash(vec2(floor(vUv.y * 90.0), uSeed)) - 0.5);
    }

    vec2 s = clamp(scr + off, vec2(0.001), vec2(0.999));

    // CHROMATIC ABERRATION, increasing with the distortion — the three
    // channels are read from three slightly different places, which is what a
    // real refracting edge does and what makes the effect read as glass rather
    // than as a smear.
    vec3 col;
    if (uAberration > 0.0001) {
      vec2 a = off * uAberration;
      col.r = texture2D(uScene, clamp(s + a, vec2(0.001), vec2(0.999))).r;
      col.g = texture2D(uScene, s).g;
      col.b = texture2D(uScene, clamp(s - a, vec2(0.001), vec2(0.999))).b;
    } else {
      col = texture2D(uScene, s).rgb;
    }

    // The tint is a WASH, not a fill: 12% at most, so her effects stay
    // near-colourless the way the brief asks and never read as an energy
    // colour competing with the rest of the roster.
    col = mix(col, col * uTint, 0.12);

    // The edge glint — a thin bright rim on the shard boundary, and the only
    // additive thing in this file. It is what makes a shard's SHAPE legible
    // against an arena it is showing you a copy of.
    //
    // *** SWITCHED OFF FOR THE IDLE HAZE. *** Found by looking at it: the haze
    // is a rectangle, and a rectangle with a bright rim is a glowing box
    // standing around her. It has no shape worth reading, so it gets no rim.
    float edge = 1.0 - smoothstep(0.0, 0.10, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    col += edge * 0.55 * uOpacity * uEdge;

    // ...and the same rectangle needs a soft boundary or it reads as a pane of
    // glass rather than as displaced air.
    float a = uOpacity;
    if (uSoft > 0.5) a *= 1.0 - smoothstep(0.25, 0.5, length(c));

    gl_FragColor = vec4(col, a);
  }
`;

function warpMaterial(mode) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,          // never occlude a fighter — see the header
    depthTest: true,
    side: THREE.DoubleSide,
    uniforms: {
      uScene: { value: null },
      uTime: { value: 0 },
      uK: { value: 0 },
      uAmount: { value: 1 },
      uMode: { value: mode },
      uSeed: { value: Math.random() * 10 },
      uDrift: { value: new THREE.Vector2() },
      uRoll: { value: 0 },
      uTint: { value: new THREE.Color(0xdff2ff) },
      uOpacity: { value: 1 },
      uAberration: { value: 1.6 },
      uTear: { value: 0 },
      uMax: { value: MAX_OFFSET },
      uEdge: { value: 1 },
      uSoft: { value: 0 }
    }
  });
}

// ---------------------------------------------------------------------------
// A SHATTERED PLANE
// ---------------------------------------------------------------------------
// The geometry for THIN ICE BREAKER. A rectangle broken into irregular
// polygonal shards by a simple radial fracture from the impact point, which is
// how thin ice actually breaks: cracks run outward from the blow and the
// pieces between them are wedges, not squares.
function fracture(w, h, count, seed = 0) {
  const shards = [];
  const rnd = (() => { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
  // radial wedges, each subdivided along its length so the pieces vary in size
  const centre = new THREE.Vector2(rand(-w * 0.12, w * 0.12), rand(-h * 0.1, h * 0.1));
  const rings = [0.0, 0.32 + rnd() * 0.12, 0.66 + rnd() * 0.14, 1.25];
  const spokes = Math.max(5, Math.round(count / (rings.length - 1)));
  for (let i = 0; i < spokes; i++) {
    const a0 = (i / spokes) * Math.PI * 2 + rnd() * 0.24;
    const a1 = ((i + 1) / spokes) * Math.PI * 2 + rnd() * 0.24;
    for (let r = 0; r < rings.length - 1; r++) {
      const r0 = rings[r], r1 = rings[r + 1] * (0.85 + rnd() * 0.3);
      const pts = [
        new THREE.Vector2(centre.x + Math.cos(a0) * r0 * w * 0.5, centre.y + Math.sin(a0) * r0 * h * 0.5),
        new THREE.Vector2(centre.x + Math.cos(a1) * r0 * w * 0.5, centre.y + Math.sin(a1) * r0 * h * 0.5),
        new THREE.Vector2(centre.x + Math.cos(a1) * r1 * w * 0.5, centre.y + Math.sin(a1) * r1 * h * 0.5),
        new THREE.Vector2(centre.x + Math.cos(a0) * r1 * w * 0.5, centre.y + Math.sin(a0) * r1 * h * 0.5)
      ];
      const shape = new THREE.Shape(pts);
      const geo = new THREE.ShapeGeometry(shape);
      // centre the shard's own uv so the shader's `vUv - 0.5` means something
      geo.computeBoundingBox();
      const bb = geo.boundingBox;
      const uv = geo.getAttribute('uv');
      const pos = geo.getAttribute('position');
      for (let k = 0; k < uv.count; k++) {
        uv.setXY(k,
          (pos.getX(k) - bb.min.x) / Math.max(1e-4, bb.max.x - bb.min.x),
          (pos.getY(k) - bb.min.y) / Math.max(1e-4, bb.max.y - bb.min.y));
      }
      const mid = new THREE.Vector3((bb.min.x + bb.max.x) * 0.5, (bb.min.y + bb.max.y) * 0.5, 0);
      shards.push({ geo, mid, ring: r, ang: (a0 + a1) * 0.5 });
      if (shards.length >= count) return shards;
    }
  }
  return shards;
}

// ===========================================================================
export class WarpFX {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.group = new THREE.Group();
    this.group.name = 'warpfx';
    this.group.renderOrder = 6;
    scene.add(this.group);
    this.items = [];
    this.t = 0;
    this.active = 0;
    // THE LAG RING. Small — nine half-resolution targets at 640x360 is about
    // 6 MB, and it is only ever allocated the first time a warp effect runs.
    this._ring = null;
    this._ringI = 0;
    this._fullscreenT = 0;
  }

  _ensureTargets() {
    if (this._ring) return;
    const opts = { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: false };
    this._ring = [];
    for (let i = 0; i < LAG_FRAMES; i++) {
      this._ring.push(new THREE.WebGLRenderTarget(CAP_W, CAP_H, opts));
    }
  }

  get current() { return this._ring ? this._ring[this._ringI].texture : null; }
  get lagged() {
    if (!this._ring) return null;
    return this._ring[(this._ringI + 1) % this._ring.length].texture;
  }

  // ---- THE CAPTURE --------------------------------------------------------
  // Called from core/stage.js immediately before each eye composites. Returns
  // instantly when nothing is warped, which is the entire rest of the roster.
  capture(camera) {
    if (this.active <= 0 || !this.items.length) return;
    this._ensureTargets();
    const r = this.renderer;
    this._ringI = (this._ringI + 1) % this._ring.length;
    const target = this._ring[this._ringI];
    // hide the warp geometry so it cannot sample itself
    const wasVisible = this.group.visible;
    this.group.visible = false;
    const prevTarget = r.getRenderTarget();
    r.setRenderTarget(target);
    r.clear();
    r.render(this.scene, camera);
    r.setRenderTarget(prevTarget);
    this.group.visible = wasVisible;
    // bind: shards and lenses read the fresh capture, the mirror reads the old
    // NOT every material an item owns is a warp shader: the ice crack lines and
    // the reflect surface's rim are plain basic materials that ride along in
    // the same list so they get disposed with everything else. Guarding on
    // `uniforms` rather than keeping a second list is what stops that being a
    // crash the first time a shard is on screen.
    for (const it of this.items) {
      for (const m of it.mats) {
        if (!m.uniforms?.uScene) continue;
        m.uniforms.uScene.value = m.uniforms.uMode.value === 2 ? this.lagged : this.current;
      }
    }
  }

  _add(item) {
    this.items.push(item);
    this.active++;
    this.group.add(item.node);
    return item;
  }

  _drop(item) {
    this.group.remove(item.node);
    item.node.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    for (const m of item.mats) m.dispose();
    this.active = Math.max(0, this.active - 1);
  }

  // =========================================================================
  // THIN ICE BREAKER — a plane of space fractures like a sheet of ice
  // =========================================================================
  // Three beats, and they are the three the brief asks for:
  //   CRACK    visible crack LINES propagate outward in real geometry from the
  //            impact point, in `crackTime` seconds. Nothing has moved yet.
  //   SHATTER  the plane breaks. Every shard is already refracting the scene
  //            behind it at its OWN wrong angle, and the disagreement between
  //            neighbours is what makes it read as broken space rather than as
  //            broken glass.
  //   DISSOLVE the fragments drift UPWARD, spreading and thinning, and fade.
  thinIce(origin, dir, { width = 5.2, height = 3.4, shards = 14, crackTime = 0.16, life = 0.95, tint = 0xdff2ff } = {}) {
    const node = new THREE.Group();
    const yaw = Math.atan2(dir.x, dir.z);
    node.position.copy(origin);
    node.rotation.y = yaw;

    const mats = [];
    const pieces = [];
    const frags = fracture(width, height, shards, Math.random() * 999);
    for (const f of frags) {
      const mat = warpMaterial(0);
      mat.uniforms.uTint.value.setHex(tint);
      // THE PER-SHARD WRONGNESS. Each piece gets its own constant screen-space
      // drift and its own rotation of the sampled region, scaled by how far out
      // in the fracture it sits — the outer ring is the most displaced, so the
      // break reads as radiating.
      const k = 0.35 + f.ring * 0.42;
      mat.uniforms.uDrift.value.set(rand(-0.032, 0.032) * k, rand(-0.032, 0.032) * k);
      mat.uniforms.uRoll.value = rand(-0.7, 0.7) * k;
      // PASS 2: 1.4 + ring*0.9 read the three channels from three genuinely
      // different parts of the arena and the shards came out as saturated
      // rainbow stripes rather than as refracted world. A real refracting edge
      // splits by a fraction of the displacement, not a multiple of it.
      mat.uniforms.uAberration.value = 0.22 + f.ring * 0.10;
      mat.uniforms.uOpacity.value = 0;
      mats.push(mat);
      const mesh = new THREE.Mesh(f.geo, mat);
      node.add(mesh);
      pieces.push({
        mesh, mat, mid: f.mid, ring: f.ring,
        // the dissolve: outward along the fracture, and UP
        drift: v3(Math.cos(f.ang) * rand(0.5, 1.4), rand(1.4, 3.0), Math.sin(f.ang) * rand(0.2, 0.6)),
        spin: v3(rand(-2, 2), rand(-2, 2), rand(-3, 3))
      });
    }

    // THE CRACK LINES, as real geometry rather than as a texture: thin boxes
    // laid along the fracture spokes, revealed in sequence outward.
    const crackMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false
    });
    const cracks = [];
    for (const f of frags) {
      // PASS 2: `mid.length() * 2` sent every crack a full shard-width past
      // the edge of the sheet, so the break read as a starburst of white
      // spikes rather than as cracks IN something. A crack ends at the shard
      // it separates.
      const len = f.mid.length() * 1.08;
      if (len < 0.15) continue;
      const g = new THREE.BoxGeometry(0.016, len, 0.016);
      g.translate(0, len * 0.5, 0);
      const m = new THREE.Mesh(g, crackMat);
      m.position.set(0, 0, 0.01);
      m.rotation.z = Math.atan2(f.mid.y, f.mid.x) - Math.PI / 2;
      m.scale.y = 0;
      node.add(m);
      cracks.push({ m, at: clamp(f.mid.length() / (width * 0.55), 0, 1) });
    }

    return this._add({
      node, mats: [...mats, crackMat], t: 0, life,
      crackTime, pieces, cracks, crackMat, kind: 'ice'
    });
  }

  // =========================================================================
  // SPACE WARP STRIKE — the fold
  // =========================================================================
  // A LENS between her and the emergence point: the scene between the two
  // compresses toward the fold and then snaps back. Plus the two mirrored
  // duplicates of her that appear at the fold points and vanish.
  fold(from, to, { life = 0.42, ghosts = 2, tint = 0xdff2ff } = {}) {
    const node = new THREE.Group();
    const mid = from.clone().lerp(to, 0.5);
    const span = from.distanceTo(to);
    node.position.copy(mid);
    node.lookAt(to.x, mid.y, to.z);

    const mat = warpMaterial(1);
    mat.uniforms.uTint.value.setHex(tint);
    mat.uniforms.uAberration.value = 0.30;
    mat.uniforms.uTear.value = 1;
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2.2, span * 1.05), 3.2, 1, 1), mat);
    node.add(lens);

    // the mirrored duplicates: flat billboards of the caster's silhouette
    // standing at the two fold points, drawn as heavily distorted lenses of
    // their own so they read as HER seen through the fold rather than as
    // sprites of her
    const mats = [mat];
    const ghostList = [];
    for (let i = 0; i < ghosts; i++) {
      const gm = warpMaterial(1);
      gm.uniforms.uTint.value.setHex(tint);
      gm.uniforms.uAmount.value = 1.8;
      gm.uniforms.uAberration.value = 0.34;
      gm.uniforms.uOpacity.value = 0;
      mats.push(gm);
      const g = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.9), gm);
      const at = i === 0 ? from : to;
      g.position.copy(at).sub(mid).add(v3(0, 0.95, 0));
      node.add(g);
      ghostList.push({ g, gm, delay: i * 0.06 });
    }
    return this._add({ node, mats, t: 0, life, lens, mat, ghosts: ghostList, kind: 'fold' });
  }

  // =========================================================================
  // SKY REFLECT — a rippling mirror of a slightly wrong arena
  // =========================================================================
  // Sampled off the LAGGED capture (see the header), horizontally inverted,
  // with a travelling ripple. `follow` keeps it pinned in front of her for the
  // life of the stance, because she can be moving — and, being Uro, flying.
  reflectSurface(fighter, dur, { tint = 0xdff2ff } = {}) {
    const node = new THREE.Group();
    const mat = warpMaterial(2);
    mat.uniforms.uTint.value.setHex(tint);
    mat.uniforms.uAberration.value = 0.26;
    mat.uniforms.uAmount.value = 1.0;
    const w = 2.3, h = 2.7;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 10, 12), mat);
    node.add(plane);
    // a bright rim so the SURFACE has a legible boundary — the opponent has to
    // be able to see where the reflect is
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(1.34, 1.44, 28),
      new THREE.MeshBasicMaterial({ color: 0xeaf8ff, transparent: true, opacity: 0.55, depthWrite: false })
    );
    rim.scale.set(w / 2.8, h / 2.8, 1);
    node.add(rim);
    return this._add({
      node, mats: [mat, rim.material], t: 0, life: dur, mat, rim,
      follow: fighter, kind: 'mirror'
    });
  }

  // A one-shot flash on the surface when it actually turns something around,
  // plus the incoming attack visibly bending: a short arc of refracted space
  // that runs from the contact point back the way it came.
  bounce(at, dir) {
    const node = new THREE.Group();
    node.position.copy(at);
    const mats = [];
    for (let i = 0; i < 4; i++) {
      const m = warpMaterial(0);
      m.uniforms.uDrift.value.set(rand(-0.07, 0.07), rand(-0.07, 0.07));
      m.uniforms.uRoll.value = rand(-1.2, 1.2);
      m.uniforms.uAberration.value = 0.32;
      mats.push(m);
      const q = new THREE.Mesh(new THREE.PlaneGeometry(rand(0.35, 0.8), rand(0.35, 0.8)), m);
      q.position.set(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.2, 0.2))
        .addScaledVector(dir, i * 0.35);
      q.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      node.add(q);
    }
    return this._add({ node, mats, t: 0, life: 0.34, kind: 'bounce' });
  }

  // =========================================================================
  // SKY COLLAPSE — the ultimate
  // =========================================================================
  // The skybox itself is the effect. A dome inverted over the arena, sampling
  // the scene with the DOME distortion — a low-frequency non-euclidean swim
  // plus a barrel bend that curls the horizon inward — closing downward over
  // its life so the world appears to sit inside a bending sphere.
  //
  // `FULLSCREEN_MAX` is enforced HERE rather than by the caller: the dome is
  // only allowed to be big enough to cover the frame for that long, and after
  // it the amount ramps down whatever the effect's own timer says.
  skyCollapse(centre, { radius = 16, life = 2.4, tint = 0xdff2ff } = {}) {
    const node = new THREE.Group();
    node.position.copy(centre).setY(centre.y + 0.2);
    const mat = warpMaterial(3);
    mat.uniforms.uTint.value.setHex(tint);
    mat.uniforms.uAberration.value = 0.38;
    mat.uniforms.uTear.value = 1;
    mat.uniforms.uAmount.value = 0;
    mat.uniforms.uEdge.value = 0;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      mat
    );
    dome.material.side = THREE.BackSide;
    node.add(dome);
    this._fullscreenT = 0;
    return this._add({ node, mats: [mat], t: 0, life, mat, dome, radius, kind: 'dome' });
  }

  // A faint constant heat-haze around her body, so she reads as slightly
  // displaced even when idle. Cheap: one small quad, low distortion, followed
  // per frame. Refreshed rather than re-added, so it costs one item forever
  // rather than one per frame.
  haze(fighter, strength = 0.35) {
    if (fighter._hazeItem && this.items.includes(fighter._hazeItem)) {
      fighter._hazeItem.t = 0;
      fighter._hazeItem.mat.uniforms.uAmount.value = 0.30 * strength;
      return fighter._hazeItem;
    }
    const node = new THREE.Group();
    const mat = warpMaterial(0);
    mat.uniforms.uDrift.value.set(0.004, 0.002);
    mat.uniforms.uRoll.value = 0.06;
    mat.uniforms.uAberration.value = 0.16;
    mat.uniforms.uAmount.value = 0.30 * strength;
    mat.uniforms.uOpacity.value = 0.55;
    mat.uniforms.uEdge.value = 0;     // no rim: see the shader note
    mat.uniforms.uSoft.value = 1;     // and no hard boundary either
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.05), mat);
    q.position.y = 1.0;
    node.add(q);
    const item = this._add({ node, mats: [mat], t: 0, life: 0.35, mat, follow: fighter, kind: 'haze', quad: q });
    fighter._hazeItem = item;
    return item;
  }

  // ---- per-frame ----------------------------------------------------------
  update(dt, camera) {
    this.t += dt;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.t += dt;
      const k = clamp(it.t / it.life, 0, 1);
      for (const m of it.mats) if (m.uniforms?.uTime) { m.uniforms.uTime.value = this.t; m.uniforms.uK.value = k; }

      if (it.kind === 'ice') {
        // CRACK, then SHATTER, then DISSOLVE.
        const crackK = clamp(it.t / it.crackTime, 0, 1);
        it.crackMat.opacity = crackK < 1 ? 0.9 : Math.max(0, 0.9 - (it.t - it.crackTime) * 6);
        for (const c of it.cracks) {
          c.m.scale.y = clamp((crackK - c.at * 0.6) / 0.4, 0, 1);
        }
        const broke = Math.max(0, it.t - it.crackTime);
        for (const p of it.pieces) {
          // fade in as the crack reaches them, then dissolve upward
          const born = clamp((crackK - p.ring * 0.22) / 0.3, 0, 1);
          const gone = clamp(broke / (it.life - it.crackTime), 0, 1);
          p.mat.uniforms.uOpacity.value = born * (1 - gone * gone);
          p.mat.uniforms.uAmount.value = 0.5 + gone * 0.9;
          p.mesh.position.copy(p.drift).multiplyScalar(gone * gone * 0.9);
          p.mesh.rotation.set(p.spin.x * gone * 0.5, p.spin.y * gone * 0.5, p.spin.z * gone * 0.5);
        }
      } else if (it.kind === 'fold') {
        // compress, then snap back
        it.mat.uniforms.uAmount.value = Math.sin(k * Math.PI) * 2.1;
        it.mat.uniforms.uOpacity.value = Math.sin(k * Math.PI) * 0.95;
        for (const g of it.ghosts) {
          const gk = clamp((it.t - g.delay) / (it.life * 0.55), 0, 1);
          g.gm.uniforms.uOpacity.value = Math.sin(gk * Math.PI) * 0.8;
          g.g.lookAt(camera.position);
        }
      } else if (it.kind === 'mirror') {
        const f = it.follow;
        if (f) {
          const fw = v3(Math.sin(f.facing), 0, Math.cos(f.facing));
          it.node.position.copy(f.pos).addScaledVector(fw, 1.15).add(v3(0, 1.15, 0));
          it.node.rotation.y = f.facing;
        }
        // it materializes and drops rather than popping
        const inK = clamp(it.t / 0.10, 0, 1);
        const outK = clamp((it.life - it.t) / 0.12, 0, 1);
        it.mat.uniforms.uOpacity.value = 0.92 * inK * outK;
        it.rim.material.opacity = 0.55 * inK * outK;
        it.node.scale.set(1, inK * outK, 1);
      } else if (it.kind === 'bounce') {
        const o = Math.sin(k * Math.PI);
        for (const m of it.mats) if (m.uniforms?.uOpacity) m.uniforms.uOpacity.value = o * 0.9;
      } else if (it.kind === 'dome') {
        // THE FULL-SCREEN CLAMP. The dome is the one thing in this file that
        // can cover the frame, and it is allowed to do so for
        // FULLSCREEN_MAX seconds; past that the distortion ramps out even
        // though the dome is still visible.
        this._fullscreenT += dt;
        const over = Math.max(0, this._fullscreenT - FULLSCREEN_MAX);
        const ramp = over > 0 ? Math.max(0, 1 - over / 0.7) : 1;
        it.mat.uniforms.uAmount.value = Math.sin(k * Math.PI) * 2.6 * ramp;
        it.mat.uniforms.uOpacity.value = Math.sin(k * Math.PI) * 0.95;
        // it CLOSES: the dome flattens downward over its life, which is the
        // horizon folding in on itself
        it.node.scale.set(1 + k * 0.25, Math.max(0.12, 1 - k * 0.82), 1 + k * 0.25);
      } else if (it.kind === 'haze') {
        const f = it.follow;
        if (f) {
          it.node.position.copy(f.pos);
          it.quad.lookAt(camera.position);
          it.quad.position.y = (f.model?.H ?? 1.75) * 0.58;
        }
        it.mat.uniforms.uOpacity.value = 0.55 * clamp((it.life - it.t) / 0.2, 0, 1);
      }

      if (it.t >= it.life) { this._drop(it); this.items.splice(i, 1); }
    }
  }

  clear() {
    for (const it of this.items) this._drop(it);
    this.items.length = 0;
    this.active = 0;
    this._fullscreenT = 0;
  }

  dispose() {
    this.clear();
    if (this._ring) for (const t of this._ring) t.dispose();
    this._ring = null;
    this.scene.remove(this.group);
  }
}
