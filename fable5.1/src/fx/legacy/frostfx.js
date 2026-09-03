// TECHNIQUE GEOMETRY — Uraume's ice and Ryu's discharge, as real objects.
//
// Same rule as fx/newfx.js, which this file sits beside rather than inside:
// every effect here is a MESH with a shape that means something, oriented in
// world space, animated by a function of its own progress, and nothing is a
// camera-facing card. FREEZE THE FRAME — if a still cannot tell you which way
// the attack went and roughly how hard it was, the effect has failed.
//
// ===========================================================================
// THE ICE HAS ITS OWN RULE ON TOP OF THAT
// ===========================================================================
//   *** URAUME'S ICE IS CARVED, NOT SPRAYED. ***
//
// The brief asks for formed ice built as "real refractive-looking geometry
// with the toon shader, with a distinct hard-edged crystalline shape language.
// It should look carved and deliberate, not like a particle effect." So every
// ice construct in this file obeys three constraints:
//
//   1. FLAT FACES AND HARD EDGES. Every ice mesh is built from low-segment
//      primitives with `flatShading` — cones with five sides, boxes, prisms.
//      There is not one smooth surface anywhere in the ice half of this file.
//      A sphere would read as slush.
//   2. THREE TONES, LAYERED, NOT BLENDED. A pale near-white body (#dff2fb), a
//      mid ice blue (#a8dce8) on the inner mass, and the saturated accent
//      (#4fd8e8) as a thin core. Refraction is FAKED by nesting a smaller,
//      brighter, additively-blended solid inside a larger translucent one —
//      the toon shader has no refraction and a real one for one character was
//      not worth the surface area, but a bright core seen through a pale shell
//      reads as depth from any angle, which is what refraction is doing for
//      the eye in the reference.
//   3. IT GROWS ALONG ONE AXIS. Every construct scales up from zero on the
//      axis it is growing FROM — a column comes out of the ground, a shard
//      grows from its base, a shell closes around a body from the feet up.
//      Nothing pops in at full size, because a thing that pops in reads as
//      being placed and a thing that grows reads as being made.
//
// ===========================================================================
// THE DISCHARGE HAS ITS OWN RULE TOO
// ===========================================================================
//   *** RYU'S BEAM IS A SOLID OBJECT WITH A HOT CORE. ***
//
// Not a line, not a glow, not a stack of billboards: a real cylinder of
// geometry with a second, brighter, thinner cylinder inside it and a flared
// mouth at the muzzle end. The core is near-white with a cold cast and the
// shell is the chartreuse accent, which is how the anime's "blue and yellow"
// survives into a game that cannot spend either colour on a flat swatch. See
// the accent audit at the top of art/models/ryu.js.
import * as THREE from 'three';
import { v3, rand } from '../../core/math.js';

// ---- THE PALETTES ---------------------------------------------------------
export const ICE = { pale: 0xdff2fb, mid: 0xa8dce8, core: 0x4fd8e8, deep: 0x2a8fa8 };
export const OUT = { edge: 0xd8f05a, hot: 0xf2fbc0, core: 0xfaffe8, deep: 0x8fbe20 };

function glow(color, opacity, side = THREE.DoubleSide) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, side
  });
}
// The ICE SHELL material. NOT additive — ice is a translucent solid and
// additive blending makes it a light source, which is the single fastest way
// to make it look like a particle effect instead of a substance. Normal alpha,
// flat shading, and it writes no depth so nested layers do not fight.
function iceMat(color, opacity) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false,
    side: THREE.DoubleSide, flatShading: true
  });
}

// ===========================================================================
// URAUME
// ===========================================================================

// ---------------------------------------------------------------------------
// ONE ICE SHARD. A five-sided tapered prism with a chisel point — the shape
// language for everything Uraume makes. Built pointing +Y so a caller can aim
// it with `lookAt`, and deliberately NOT symmetrical: the tip is offset a few
// degrees off the axis, because a perfectly axial spike reads as a traffic
// cone and a canted one reads as a crystal that grew.
// ---------------------------------------------------------------------------
export function iceShard(len, r, { cant = 0.14, sides = 5 } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(r, len, sides), iceMat(ICE.pale, 0.62));
  body.position.y = len * 0.5;
  body.rotation.z = cant;
  g.add(body);
  // the mid mass, inside
  const inner = new THREE.Mesh(new THREE.ConeGeometry(r * 0.62, len * 0.86, sides), iceMat(ICE.mid, 0.55));
  inner.position.y = len * 0.44;
  inner.rotation.z = cant;
  g.add(inner);
  // THE CORE. Additive, thin, bright — this is the fake refraction, and it is
  // the only additive layer in an ice construct.
  const core = new THREE.Mesh(new THREE.ConeGeometry(r * 0.26, len * 0.70, sides), glow(ICE.core, 0.85));
  core.position.y = len * 0.38;
  core.rotation.z = cant;
  g.add(core);
  // a base collar, so the shard has somewhere it came from
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.3, len * 0.08, sides), iceMat(ICE.pale, 0.7));
  collar.position.y = len * 0.04;
  g.add(collar);
  return g;
}

// ---------------------------------------------------------------------------
// AN ICE COLUMN — Frost Calm's payload. A thick faceted pillar that BURSTS out
// of the ground, with a broken top rather than a point: these are what the
// technique traps people in, not what it stabs them with.
// ---------------------------------------------------------------------------
export function iceColumn(h, r) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r, h, 6), iceMat(ICE.pale, 0.55));
  shell.position.y = h * 0.5;
  g.add(shell);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.46, r * 0.62, h * 0.94, 6), iceMat(ICE.mid, 0.5));
  inner.position.y = h * 0.47;
  g.add(inner);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.16, r * 0.22, h * 0.82, 5), glow(ICE.core, 0.7));
  core.position.y = h * 0.41;
  g.add(core);
  // THE BROKEN TOP. Three canted wedges of different heights, which is what
  // stops a column reading as a pipe.
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const wh = h * (0.10 + i * 0.05);
    const w = new THREE.Mesh(new THREE.ConeGeometry(r * (0.44 - i * 0.06), wh, 4), iceMat(ICE.pale, 0.6));
    w.position.set(Math.cos(a) * r * 0.42, h + wh * 0.4, Math.sin(a) * r * 0.42);
    w.rotation.set(Math.cos(a) * 0.30, a, Math.sin(a) * 0.30);
    g.add(w);
  }
  // and a spray of small shards round the base where it came through the floor
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.ConeGeometry(r * 0.16, r * (0.7 + Math.random()), 4), iceMat(ICE.pale, 0.55));
    s.position.set(Math.cos(a) * r * 1.15, r * 0.2, Math.sin(a) * r * 1.15);
    s.rotation.set(Math.cos(a) * 0.9, a, Math.sin(a) * 0.9);
    g.add(s);
  }
  return g;
}

// ---------------------------------------------------------------------------
// THE FROST SHELL — FROSTBOUND, closed around a body.
//
// *** THIS IS THE MESH THAT HAS TO NOT LOOK LIKE NAOYA'S FREEZE. ***
// His is a gold DESATURATION of the victim's own materials plus a 24-tick
// countdown ring — no geometry at all. This is the opposite: the victim's
// colours are untouched and a physical object is built AROUND them, so the two
// are distinguishable in a still frame with no HUD.
//
// Measured against whatever it is closing around, because the victim might be
// Mahoraga at 3.6 m or Jogo at 1.42 m. `h` and `r` come from the fighter's own
// hurtbox at the call site.
// ---------------------------------------------------------------------------
export function frostShell(h, r) {
  const g = new THREE.Group();
  // the main body: an eight-sided prism, wider at the middle
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.25, h, 8), iceMat(ICE.pale, 0.44));
  shell.position.y = h * 0.5;
  g.add(shell);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 1.02, h * 0.96, 8), iceMat(ICE.mid, 0.30));
  inner.position.y = h * 0.49;
  g.add(inner);
  // THE PLATES. Six irregular slabs stuck to the outside at angles — this is
  // the "several layers of ice" the source describes, and it is what makes the
  // shell read as accreted rather than as a jar the victim was put in.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand(-0.3, 0.3);
    const yy = h * (0.15 + 0.7 * (i / 6));
    const pw = r * rand(0.6, 1.1), ph = h * rand(0.16, 0.32);
    const p = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, r * 0.30), iceMat(ICE.pale, 0.55));
    p.position.set(Math.cos(a) * r * 1.18, yy, Math.sin(a) * r * 1.18);
    p.rotation.set(rand(-0.3, 0.3), -a, rand(-0.4, 0.4));
    g.add(p);
  }
  // the cap — a cluster of upward wedges, so the shell is closed over the head
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    const wh = h * rand(0.12, 0.22);
    const w = new THREE.Mesh(new THREE.ConeGeometry(r * 0.42, wh, 4), iceMat(ICE.pale, 0.6));
    w.position.set(Math.cos(a) * r * 0.5, h + wh * 0.35, Math.sin(a) * r * 0.5);
    w.rotation.set(Math.cos(a) * 0.4, a, Math.sin(a) * 0.4);
    g.add(w);
  }
  // the base rime, spreading onto the floor
  const rime = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.9, r * 2.2, h * 0.05, 9), iceMat(ICE.pale, 0.5));
  rime.position.y = h * 0.025;
  g.add(rime);
  return g;
}

// ---------------------------------------------------------------------------
// AN ICE SHEET — the terrain patch. A very flat faceted disc that sits ON the
// floor rather than hovering over it, with a raised broken rim.
//
// Returns a small controller rather than a bare node, because a patch is
// resized by melting and faded as it thaws, and the IceSystem should not have
// to know how the mesh is put together to do either.
// ---------------------------------------------------------------------------
export function iceSheet(parent, x, y, z, r) {
  const g = new THREE.Group();
  g.position.set(x, y + 0.015, z);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.03, 14), iceMat(ICE.pale, 0.40));
  g.add(disc);
  const sheen = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.86, 0.035, 12), glow(ICE.core, 0.10));
  g.add(sheen);
  // THE RIM. Eight low wedges round the edge, so the patch has a boundary a
  // player can see from a standing camera. Without this a sheet of ice on a
  // grey floor is invisible at fighting distance, which would make the whole
  // terrain mechanic unreadable.
  const rim = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const w = new THREE.Mesh(new THREE.ConeGeometry(0.10, rand(0.10, 0.24), 4), iceMat(ICE.pale, 0.62));
    w.position.set(Math.cos(a), 0.04, Math.sin(a));
    w.rotation.set(Math.cos(a) * 0.5, a, Math.sin(a) * 0.5);
    rim.add(w);
  }
  g.add(rim);
  parent.add(g);
  let R = r;
  const apply = () => { g.scale.set(R, 1, R); };
  apply();
  return {
    node: g,
    resize(nr) { R = Math.max(0.1, nr); apply(); },
    setFade(k) {
      const o = Math.max(0, Math.min(1, k));
      disc.material.opacity = 0.40 * o;
      sheen.material.opacity = 0.10 * o;
      for (const w of rim.children) w.material.opacity = 0.62 * o;
    },
    dispose() {
      g.removeFromParent();
      g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
  };
}

// ---------------------------------------------------------------------------
// THE GLACIATION WALL — the ultimate. An advancing face of ice, built as a row
// of columns of varying height with a solid mass behind them. It is authored
// as a single node the caller walks across the arena.
// ---------------------------------------------------------------------------
export function glacierWall(width, height) {
  const g = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(width, height, 1.1), iceMat(ICE.mid, 0.42));
  face.position.y = height * 0.5;
  g.add(face);
  const n = Math.max(5, Math.round(width / 1.3));
  for (let i = 0; i < n; i++) {
    const x = -width / 2 + (i + 0.5) * (width / n);
    const h = height * rand(0.72, 1.30);
    const c = iceColumn(h, rand(0.34, 0.58));
    c.position.set(x + rand(-0.2, 0.2), 0, rand(-0.35, 0.45));
    c.rotation.y = rand(0, Math.PI);
    g.add(c);
  }
  return g;
}

// ===========================================================================
// RYU
// ===========================================================================

// ---------------------------------------------------------------------------
// THE BEAM. A real cylinder with a hot core and a flared mouth, built along +Z
// so the caller can point it with a single `lookAt`.
//
//   len    how far it reaches
//   r      its radius — which is the TIER's `width`, so the geometry and the
//          hitbox are the same number and cannot drift
// ---------------------------------------------------------------------------
export function graniteBeam(len, r) {
  const g = new THREE.Group();
  // the shell — the chartreuse half
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.86, len, 14, 1, true), glow(OUT.edge, 0.40));
  shell.rotation.x = Math.PI / 2;
  shell.position.z = len * 0.5;
  g.add(shell);
  // the hot layer
  const hot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.52, len, 12, 1, true), glow(OUT.hot, 0.55));
  hot.rotation.x = Math.PI / 2;
  hot.position.z = len * 0.5;
  g.add(hot);
  // THE CORE — near white with the cold cast, and this is where the anime's
  // blue half survives. Solid rather than open-ended, so the beam has a body.
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.26, r * 0.20, len, 10), glow(OUT.core, 0.95));
  core.rotation.x = Math.PI / 2;
  core.position.z = len * 0.5;
  g.add(core);
  // THE MOUTH. A flared cone at the muzzle end — the muzzle flash as geometry,
  // which is what tells you in a still frame which end of the beam he is on.
  const mouth = new THREE.Mesh(new THREE.ConeGeometry(r * 2.1, r * 2.6, 12, 1, true), glow(OUT.hot, 0.5));
  mouth.rotation.x = -Math.PI / 2;
  mouth.position.z = r * 1.0;
  g.add(mouth);
  // and the rings running down it, which is the only part of the beam that
  // moves and is what stops it reading as a static tube
  const rings = [];
  const nr = Math.max(3, Math.round(len / 4));
  for (let i = 0; i < nr; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.15, r * 0.10, 5, 14), glow(OUT.edge, 0.55));
    ring.position.z = (i + 0.5) * (len / nr);
    g.add(ring);
    rings.push(ring);
  }
  g.userData.rings = rings;
  g.userData.len = len;
  return g;
}

// THE CHARGE GATHER — what accumulates at the muzzle while he holds. A shell
// of inward-falling motes plus a growing core, driven by one 0..1 number so it
// cannot disagree with the tier table or with the model's own muzzle glow.
export function chargeOrb(r) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), glow(OUT.core, 0.9));
  g.add(core);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 2.0, 1), glow(OUT.edge, 0.22));
  g.add(shell);
  g.userData.core = core;
  g.userData.shell = shell;
  return g;
}

// THE GROUND CRACK — what opens under him as he charges. Radial fissures that
// lengthen with the tier, laid flat on the floor. This is half of "the ground
// cracking under him" and it is the half that stays put; the debris is
// particles at the call site.
export function chargeCracks(n = 8) {
  const g = new THREE.Group();
  const arms = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
    const arm = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 1),
      new THREE.MeshBasicMaterial({
        color: OUT.edge, transparent: true, opacity: 0.0,
        depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
      })
    );
    arm.rotation.x = -Math.PI / 2;
    arm.rotation.z = -a;
    arm.position.set(Math.cos(a) * 0.5, 0.03, Math.sin(a) * 0.5);
    arm.userData.a = a;
    g.add(arm);
    arms.push(arm);
  }
  g.userData.arms = arms;
  // `k` is 0..1 across the whole charge
  g.userData.set = k => {
    for (const arm of arms) {
      const len = 0.6 + k * 5.4 * rand(0.85, 1.15);
      arm.scale.set(1, len, 1);
      arm.position.set(Math.cos(arm.userData.a) * len * 0.5, 0.03, Math.sin(arm.userData.a) * len * 0.5);
      arm.material.opacity = 0.15 + k * 0.55;
    }
  };
  g.userData.set(0);
  return g;
}
