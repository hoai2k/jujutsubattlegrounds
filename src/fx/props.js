// PROCEDURAL TECHNIQUE PROPS — real geometry, not billboards.
//
// Everything a technique puts into the world as an OBJECT lives here: roots
// that surge out of the floor, a thrown 卍, a pachinko ball, film frames,
// chains, soul blades, spears. Each builder returns a THREE.Group that the
// effect drives through FXSystem.prop(node, life, onUpdate), so the mechanic
// owns the animation and the model never desyncs from the hitbox.
//
// House rules for everything in this file:
//   · geometry only — no textures, no external assets (see CLAUDE.md)
//   · low poly on purpose: 5-8 radial segments reads correctly at arena
//     distance and keeps a dozen simultaneous props cheap
//   · built pointing +Y (things that grow) or +Z (things that fly), so the
//     caller can orient with one quaternion
import * as THREE from 'three';
import { makeGlowMat } from '../arena/arena.js';
import { rand, v3 } from '../core/mathutil.js';

const solid = (c) => new THREE.MeshBasicMaterial({ color: c });

// ---------------------------------------------------------------------------
// HANAMI — ROOTS
// ---------------------------------------------------------------------------
// One clump of roots surging up out of the deck. Each root is three tapered
// segments stacked through nested pivots, every joint leaning a little, which
// is what gives a straight cylinder chain an organic bend for almost nothing.
// Grows along +Y from its own base, so the caller scales Y from 0 to drive it
// out of the ground.
export function buildRootClump(len = 2.2, natural = false) {
  const g = new THREE.Group();
  const bark = solid(0x6a4f34);
  const dark = solid(0x513a26);
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const root = new THREE.Group();
    let parent = root;
    let r0 = rand(0.10, 0.17);
    const segLen = len / 3;
    for (let s = 0; s < 3; s++) {
      const r1 = r0 * 0.66;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, segLen, 5), s === 1 ? dark : bark);
      seg.position.y = segLen / 2;
      // the lean COMPOUNDS through the joints, so it has to stay small — at
      // 0.34 per joint three segments end up nearly horizontal and the clump
      // reads as planks lying on the floor rather than roots standing out of it
      seg.rotation.z = rand(-0.16, 0.16);
      seg.rotation.x = rand(-0.16, 0.16);
      parent.add(seg);
      // the joint: a pivot at the segment's TIP that the next segment hangs
      // off, so each lean compounds into a curve instead of a kink
      const pivot = new THREE.Group();
      pivot.position.y = segLen / 2;
      seg.add(pivot);
      parent = pivot;
      r0 = r1;
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(r0 * 1.5, len * 0.3, 5), dark);
    tip.position.y = len * 0.15;
    parent.add(tip);
    const a = (i / n) * Math.PI * 2 + rand(-0.5, 0.5);
    const off = rand(0.05, 0.5);
    root.position.set(Math.cos(a) * off, 0, Math.sin(a) * off);
    root.rotation.z = -Math.cos(a) * rand(0.04, 0.2);
    root.rotation.x = Math.sin(a) * rand(0.04, 0.2);
    g.add(root);
  }
  // on soil it comes up green: a few leaf blades around the base
  if (natural) {
    const leaf = makeGlowMat(0x9ed86a, 0.8);
    for (let i = 0; i < 4; i++) {
      const a = rand(0, Math.PI * 2);
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.11, rand(0.4, 0.75), 4), leaf);
      l.position.set(Math.cos(a) * rand(0.3, 0.7), 0.2, Math.sin(a) * rand(0.3, 0.7));
      l.rotation.z = Math.cos(a) * 0.5;
      l.rotation.x = -Math.sin(a) * 0.5;
      g.add(l);
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// YUJI
// ---------------------------------------------------------------------------
// The cursed-energy bloom: a crystal knot of raw CE forced up out of the
// ground. Core plus outward shards, built around origin so it can be scaled
// as one piece.
export function buildCEBloom(radius = 1.3) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.42, 0), makeGlowMat(0xff3b30, 0.9));
  g.add(core);
  const shard = makeGlowMat(0xff8a70, 0.75);
  const dark = solid(0x2a0810);
  for (let i = 0; i < 11; i++) {
    const a = rand(0, Math.PI * 2);
    const b = rand(-0.2, 1);          // biased upward — it erupts, not explodes
    const dir = v3(Math.cos(a) * Math.sqrt(1 - b * b), b, Math.sin(a) * Math.sqrt(1 - b * b));
    const s = new THREE.Mesh(new THREE.ConeGeometry(radius * rand(0.09, 0.16), radius * rand(0.7, 1.3), 4),
      i % 3 === 0 ? dark : shard);
    s.position.copy(dir).multiplyScalar(radius * 0.4);
    s.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
    g.add(s);
  }
  return g;
}

// The thrown 卍: four arms with hooked tips, spinning on its own axis. Built
// flat in the XY plane so it reads as a wheel when flown along +Z.
export function buildManji(size = 1.1) {
  const g = new THREE.Group();
  const hot = makeGlowMat(0xffa04a, 0.95);
  const core = makeGlowMat(0xffe0c0, 1);
  const bar = size * 0.9, th = size * 0.14;
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(bar, th, th), hot);
    shaft.position.x = bar / 2;
    arm.add(shaft);
    // the hook that makes it a 卍 rather than a cross
    const hook = new THREE.Mesh(new THREE.BoxGeometry(th, bar * 0.5, th), i % 2 ? hot : core);
    hook.position.set(bar - th / 2, bar * 0.25, 0);
    arm.add(hook);
    arm.rotation.z = (i / 4) * Math.PI * 2;
    g.add(arm);
  }
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.2, 0), core));
  return g;
}

// ---------------------------------------------------------------------------
// NAOYA — PROJECTION SORCERY
// ---------------------------------------------------------------------------
// One film frame: a hollow gold rectangle of four bars with a pane inside it.
// The pane is what shatters; the frame is what the eye tracks.
export function buildFilmFrame(w = 1.5, h = 2.1) {
  const g = new THREE.Group();
  const gold = makeGlowMat(0xe8c85a, 0.95);
  const th = 0.075;
  const edges = [[0, h / 2, w, th], [0, -h / 2, w, th], [-w / 2, 0, th, h], [w / 2, 0, th, h]];
  for (const [x, y, bw, bh] of edges) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(bw + th, bh + th, th), gold);
    bar.position.set(x, y, 0);
    g.add(bar);
  }
  // sprocket holes down both sides — the detail that says "film"
  for (let i = -1; i <= 1; i++) {
    for (const s of [-1, 1]) {
      const hole = new THREE.Mesh(new THREE.BoxGeometry(th * 1.6, th * 1.6, th * 1.4), makeGlowMat(0xfff0c0, 1));
      hole.position.set(s * (w / 2), i * h * 0.3, 0);
      g.add(hole);
    }
  }
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), makeGlowMat(0xfff0c0, 0.16));
  g.add(pane);
  g.userData.pane = pane;
  return g;
}

// A projection afterimage: the flat gold slab he leaves standing in a position
// he has already left. Deliberately not a body — it is a FRAME of one.
export function buildProjectionPlate(height = 1.9) {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.72, height, 0.12), makeGlowMat(0xe8c85a, 0.3));
  slab.position.y = height / 2;
  g.add(slab);
  const edge = makeGlowMat(0xfff0c0, 0.85);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.14), edge);
    e.position.set(s * 0.36, height / 2, 0);
    g.add(e);
  }
  return g;
}

// ---------------------------------------------------------------------------
// HAKARI — THE MACHINE
// ---------------------------------------------------------------------------
// A pachinko ball the size of a person: chrome sphere, equator band, panel
// dimples. Rolls along +X of its own frame.
export function buildPachinkoBall(r = 0.9, gold = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2),
    makeGlowMat(gold ? 0xffc93c : 0x69f0ae, 0.9));
  g.add(body);
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, r * 0.09, 6, 20),
    makeGlowMat(gold ? 0xfff3c4 : 0xb9f6ca, 1));
  band.rotation.x = Math.PI / 2;
  g.add(band);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const d = new THREE.Mesh(new THREE.SphereGeometry(r * 0.13, 5, 4), solid(0x123a2a));
    d.position.set(Math.cos(a) * r * 0.85, rand(-0.4, 0.4) * r, Math.sin(a) * r * 0.85);
    g.add(d);
  }
  return g;
}

// ---------------------------------------------------------------------------
// TOJI — THE ARSENAL, AS ACTUAL OBJECTS
// ---------------------------------------------------------------------------
// The Inverted Spear of Heaven, built along +Z so it can be flown or thrust
// down a direction vector directly.
export function buildSpear(len = 3.2) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, len, 6), solid(0x2e2a26));
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = len / 2;
  g.add(shaft);
  const blade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 4), makeGlowMat(0xf4f8ff, 0.95));
  blade.rotation.x = Math.PI / 2;
  blade.position.z = len + 0.45;
  g.add(blade);
  // the curled guard that makes it read as the Inverted Spear and not a stick
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 5, 10), makeGlowMat(0x6ea88a, 0.9));
  guard.position.z = len - 0.1;
  g.add(guard);
  return g;
}

// Chain of a Thousand Miles: alternating links along +Z, so laying it between
// two points is one scale and one quaternion.
export function buildChainRope(links = 14, spacing = 0.32) {
  const g = new THREE.Group();
  const steel = solid(0x9aa0ae);
  const bright = makeGlowMat(0xf2ead8, 0.8);
  for (let i = 0; i < links; i++) {
    const l = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 4, 8), i % 3 === 0 ? bright : steel);
    l.position.z = i * spacing;
    l.rotation.y = Math.PI / 2;
    l.rotation.z = (i % 2) * Math.PI / 2;
    g.add(l);
  }
  g.userData.length = (links - 1) * spacing;
  return g;
}

// Split Soul Katana's cut, as an object: a long flat blade plane of soul-blue
// with a white core, built along +X so it can be swept.
export function buildSoulBlade(len = 3.0, big = false) {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(len, big ? 0.5 : 0.32, 0.05), makeGlowMat(0xbfd4e8, 0.55));
  g.add(blade);
  const core = new THREE.Mesh(new THREE.BoxGeometry(len * 0.98, big ? 0.1 : 0.06, 0.07), makeGlowMat(0xffffff, 0.95));
  g.add(core);
  // the fray at the trailing edge — a soul cut does not have a clean edge
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.06, rand(0.25, 0.6), 3), makeGlowMat(0x8b9bab, 0.5));
    t.position.set(rand(-len / 2, len / 2), -(big ? 0.3 : 0.2), 0);
    t.rotation.z = Math.PI;
    g.add(t);
  }
  return g;
}

// Playful Cloud, whole: the three-section staff, built along +X.
export function buildPlayfulCloud(len = 2.6) {
  const g = new THREE.Group();
  const wood = solid(0x6b6257);
  const cap = makeGlowMat(0xd8d2c4, 0.9);
  for (let i = -1; i <= 1; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len / 3.2, 6), wood);
    s.rotation.z = Math.PI / 2;
    s.position.x = i * (len / 3);
    g.add(s);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 4, 8), cap);
    ring.rotation.y = Math.PI / 2;
    ring.position.x = i * (len / 3) + len / 6.6;
    g.add(ring);
  }
  return g;
}

// The technique-nullifying seal the spear stamps: concentric rings plus four
// cardinal bars, flat in XY, collapsing inward as it resolves.
export function buildNullifySeal(radius = 1.4) {
  const g = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * (1 - i * 0.32), 0.045, 5, 24),
      makeGlowMat(i ? 0xd9ffe8 : 0x6ea88a, 0.9));
    g.add(ring);
  }
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.5, 0.06, 0.06), makeGlowMat(0x6ea88a, 0.9));
    const a = (i / 4) * Math.PI * 2;
    bar.position.set(Math.cos(a) * radius * 0.75, Math.sin(a) * radius * 0.75, 0);
    bar.rotation.z = a;
    g.add(bar);
  }
  return g;
}

// ---------------------------------------------------------------------------
// SHARED — GROUND STRUCTURE
// ---------------------------------------------------------------------------
// A slab of deck driven up out of the floor. Used by anything that ruptures
// ground: Toji's staff fissure, Panda's slam. Grows along +Y from its base.
export function buildStoneSlab(w = 1.1, h = 1.8, color = 0x6b6f78) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.62, h, 6), solid(color));
  body.position.y = h / 2;
  body.rotation.y = rand(0, Math.PI);
  g.add(body);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.44, h * 0.35, 6), solid(color === 0x6b6f78 ? 0x8a8fa0 : color));
  cap.position.y = h + h * 0.14;
  cap.rotation.y = rand(0, Math.PI);
  g.add(cap);
  return g;
}
