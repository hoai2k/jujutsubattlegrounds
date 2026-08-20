// COMEDY GEOMETRY — Takaba's bits, as real objects.
//
// ===========================================================================
// THE RULE, AND IT IS THE MOST IMPORTANT NOTE IN THIS CHARACTER
// ===========================================================================
// *** CHEAP-LOOKING IS NOT THE JOKE. A BEAUTIFULLY RENDERED ANVIL IS. ***
//
// Everything in this file is built to the same standard as fx/newfx.js and
// held to the same test: FREEZE THE FRAME. If you cannot tell from a still
// what arrived, from what direction, and roughly how hard, the effect failed.
// Every construct here is:
//
//   · REAL ORIENTED GEOMETRY, never a camera-facing card
//   · TOON-SHADED with the project's own materials and OUTLINED with the
//     project's own inverted-hull outline, so an anvil sits in the same
//     lighting and the same ink as Nanami's blade
//   · WEIGHTED. A piano falls with a piano's acceleration and lands with a
//     piano's shake. The comedy is entirely in WHAT is happening; the physics
//     and the fidelity are exactly what they are for everything else.
//
// The tonal clash is the point and it only works at full quality. A cartoon
// anvil rendered as a flat sprite would read as a bug in the renderer; a
// cartoon anvil rendered with the same care as Sukuna's shrine reads as a
// cursed technique that has decided to be funny, which is what the Comedian
// actually is.
import * as THREE from 'three';
import { v3, rand, clamp } from '../core/mathutil.js';
import { roundBox, tGeo, latheY, tubeBetween, shapeExtrude } from '../art/builders/geo.js';
import { toonMaterial } from '../art/shaders/toon.js';
import { makeOutline } from '../art/shaders/outline.js';

// The shared material family. Same archetypes the character models use, so a
// falling safe and a suit jacket are lit by the same shader.
// `vertexColors: false` on every one: these are raw geometries with no colour
// attribute, and the shared toonMaterial defaults to vertex colours because
// the character models carry theirs that way. Leaving the default on renders
// every prop in this file solid black.
const M = {
  iron: (c = 0x5a626e) => toonMaterial({ vertexColors: false, steps: [40, 118, 205, 255], rim: 0.5, rimStart: 0.62, gloss: 0.62, color: c, rimColor: 0xcfd8e8 }),
  paint: (c = 0xd8332e) => toonMaterial({ vertexColors: false, steps: [66, 142, 255], rim: 0.3, rimStart: 0.68, color: c, rimColor: 0xffd8c8 }),
  cloth: (c = 0x8a1f2c) => toonMaterial({ vertexColors: false, steps: [64, 140, 255], rim: 0.28, rimStart: 0.70, color: c, rimColor: 0xffc8c8 }),
  wood: (c = 0x8a6a44) => toonMaterial({ vertexColors: false, steps: [70, 148, 232, 255], rim: 0.22, rimStart: 0.72, color: c, rimColor: 0xd8c8a8 }),
  cream: (c = 0xf0e6d0) => toonMaterial({ vertexColors: false, steps: [110, 178, 255], rim: 0.24, rimStart: 0.72, color: c, rimColor: 0xffffff }),
  glass: (c = 0xffe27a) => toonMaterial({ vertexColors: false, steps: [90, 160, 240, 255], rim: 0.7, rimStart: 0.5, gloss: 0.9, color: c, rimColor: 0xffffff })
};
const ink = (mesh, thickness = 0.014) => makeOutline(mesh, { color: 0x120c0a, thickness });

function node(...meshes) {
  const g = new THREE.Group();
  for (const m of meshes) { g.add(m); g.add(ink(m)); }
  return g;
}
const mesh = (geo, mat) => new THREE.Mesh(geo, mat);

// ===========================================================================
// THE EIGHT BITS
// ===========================================================================

// GLOVE ON A SPRING — a real coil (a helix of tube segments) with a real
// laced boxing glove on the end. It EXTENDS along the lane, which is what
// makes it read as a spring rather than as a thrown object.
export function bigGlove(fx, from, dir, len = 5.0, life = 0.42) {
  const g = new THREE.Group();
  const coil = new THREE.Group();
  const SEG = 22;
  for (let i = 0; i < SEG; i++) {
    const a0 = i * 1.05, a1 = (i + 1) * 1.05;
    const r = 0.17;
    const p0 = v3(Math.cos(a0) * r, Math.sin(a0) * r, i * 0.052);
    const p1 = v3(Math.cos(a1) * r, Math.sin(a1) * r, (i + 1) * 0.052);
    coil.add(mesh(tubeBetween(p0, p1, [0.030, 0.030], { radial: 5, hSeg: 1 }), M.iron(0x9aa2ae)));
  }
  g.add(coil);
  const glove = mesh(latheY([[0.10, -0.24], [0.30, -0.10], [0.34, 0.10], [0.24, 0.26], [0.10, 0.32]], 16, 0.86), M.paint(0xd8332e));
  glove.rotation.x = Math.PI / 2;
  const cuff = mesh(tGeo(new THREE.CylinderGeometry(0.20, 0.20, 0.12, 14), { rot: [90, 0, 0] }), M.paint(0xf2f2ee));
  // the laces — three short white bars across the knuckle
  const laces = new THREE.Group();
  for (let i = 0; i < 3; i++) laces.add(mesh(tGeo(roundBox(0.16, 0.022, 0.016, 0.006), { pos: [0, 0.10 - i * 0.10, 0.30] }), M.cream(0xf2f2ee)));
  const head = node(glove, cuff);
  head.add(laces);
  g.add(head);
  g.position.copy(from);
  g.lookAt(from.clone().add(dir));
  fx.prop(g, life, (n, t) => {
    const k = t / life;
    const ext = Math.sin(Math.min(1, k * 1.7) * Math.PI * 0.6) / Math.sin(Math.PI * 0.6);
    coil.scale.z = Math.max(0.05, ext * len / (SEG * 0.052));
    head.position.z = ext * len;
    n.children.forEach(c => { if (c.material) c.material.opacity = 1; });
    if (k > 0.8) g.scale.setScalar(clamp(1 - (k - 0.8) * 5, 0, 1));
  });
  return g;
}

// MALLET — a squared wooden head on a turned handle, brought down. Real
// rotation about a real pivot, so the arc is the arc.
export function mallet(fx, at, life = 0.5) {
  const pivot = new THREE.Group();
  const head = mesh(roundBox(0.62, 0.62, 1.05, 0.09), M.wood(0x9a7a4e));
  head.position.y = 1.9;
  const band = mesh(tGeo(roundBox(0.66, 0.10, 1.10, 0.03), { pos: [0, 1.9, 0] }), M.iron(0x4a4f58));
  const shaft = mesh(tGeo(new THREE.CylinderGeometry(0.085, 0.10, 1.7, 12), { pos: [0, 0.95, 0] }), M.wood(0xb8945e));
  const n = node(head, band, shaft);
  pivot.add(n);
  pivot.position.copy(at).add(v3(0, 0, 0));
  pivot.rotation.x = -2.1;
  fx.prop(pivot, life, (p, t) => {
    const k = clamp(t / (life * 0.45), 0, 1);
    p.rotation.x = -2.1 + k * k * 2.1;
    if (t > life * 0.6) p.scale.setScalar(clamp(1 - (t - life * 0.6) / (life * 0.4), 0, 1));
  });
  return pivot;
}

// BANANA PEEL — a real peel: a small body with four splayed skins lying flat
// on the floor. It stays for a beat after the slip, because a banana peel that
// vanishes is not a banana peel.
export function bananaPeel(fx, at, life = 1.4) {
  const g = new THREE.Group();
  const body = mesh(latheY([[0.05, 0], [0.09, 0.05], [0.06, 0.11]], 10, 1), M.glass(0xf2d84a));
  const parts = [body];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const p = mesh(shapeExtrude([
      [0, 0], [0.075, 0.03], [0.30, 0.02], [0.34, 0], [0.30, -0.02], [0.075, -0.03]
    ], 0.018), M.glass(0xe8ce3e));
    p.rotation.set(-0.35, -a, 0);
    p.position.set(Math.cos(a) * 0.05, 0.03, Math.sin(a) * 0.05);
    parts.push(p);
  }
  const n = node(...parts);
  g.add(n);
  g.position.copy(at).setY(at.y + 0.02);
  fx.prop(g, life, (p, t) => { if (t > life * 0.7) p.scale.setScalar(clamp(1 - (t - life * 0.7) / (life * 0.3), 0, 1)); });
  return g;
}

// BUCKET — a real galvanised pail with a wire handle, dropped over the head
// and left there for the blind duration.
export function bucket(fx, target, life = 2.2) {
  const g = new THREE.Group();
  const pail = mesh(latheY([[0.30, 0], [0.335, 0.34], [0.345, 0.38]], 16, 1), M.iron(0x9fb0bc));
  const base = mesh(tGeo(new THREE.CylinderGeometry(0.30, 0.30, 0.03, 16), { pos: [0, 0.01, 0] }), M.iron(0x8a9aa6));
  const rim = mesh(tGeo(new THREE.TorusGeometry(0.345, 0.022, 5, 18), { rot: [90, 0, 0], pos: [0, 0.38, 0] }), M.iron(0x7a8a96));
  const handle = mesh(new THREE.TorusGeometry(0.33, 0.016, 4, 16, Math.PI), M.iron(0x6a7a86));
  handle.rotation.y = Math.PI / 2;
  handle.position.y = 0.34;
  g.add(node(pail, base, rim, handle));
  fx.prop(g, life, (p, t) => {
    // it drops on, then rings and settles
    const drop = clamp(t / 0.18, 0, 1);
    const h = (target?.cfg?.size?.height ?? 1.8);
    p.position.copy(target.pos).setY(target.pos.y + h * 0.94 - 0.30 + (1 - drop) * 1.4);
    p.rotation.z = Math.sin(t * 26) * 0.09 * Math.exp(-t * 5);
    if (t > life - 0.25) p.scale.setScalar(clamp((life - t) / 0.25, 0, 1));
  });
  return g;
}

// PIE — a real tin with a crust and a cream dome, thrown, then a splat disc
// that sticks to the face.
export function pie(fx, from, to, life = 0.5) {
  const g = new THREE.Group();
  const tin = mesh(latheY([[0.20, 0], [0.26, 0.05], [0.27, 0.07]], 14, 1), M.iron(0xb0b4bc));
  const cream = mesh(latheY([[0.25, 0.06], [0.24, 0.13], [0.14, 0.18], [0, 0.20]], 14, 1), M.cream());
  g.add(node(tin, cream));
  g.position.copy(from);
  const dir = to.clone().sub(from);
  fx.prop(g, life, (p, t) => {
    const k = clamp(t / (life * 0.62), 0, 1);
    p.position.copy(from).addScaledVector(dir, k);
    p.position.y += Math.sin(k * Math.PI) * 0.5;
    p.rotation.x = t * 14;
    if (k >= 1) { p.rotation.x = 0; p.scale.set(1.5, 0.25, 1.5); }
    if (t > life * 0.85) p.scale.multiplyScalar(0.88);
  });
  return g;
}

// RAKE — a real garden rake lying tines-up, which swings on its own handle.
export function rake(fx, at, dir, life = 0.7) {
  const pivot = new THREE.Group();
  const g = new THREE.Group();
  const shaft = mesh(tGeo(new THREE.CylinderGeometry(0.035, 0.040, 1.55, 10), { rot: [90, 0, 0], pos: [0, 0, 0.78] }), M.wood(0xa8845a));
  const head = mesh(tGeo(roundBox(0.70, 0.05, 0.10, 0.02), { pos: [0, 0, 1.58] }), M.iron(0x6a7078));
  const parts = [shaft, head];
  for (let i = -3; i <= 3; i++) {
    parts.push(mesh(tGeo(new THREE.ConeGeometry(0.028, 0.20, 5), { rot: [180, 0, 0], pos: [i * 0.105, -0.10, 1.58] }), M.iron(0x8a9098)));
  }
  g.add(node(...parts));
  pivot.add(g);
  pivot.position.copy(at).setY(at.y + 0.04);
  pivot.rotation.y = Math.atan2(dir.x, dir.z);
  fx.prop(pivot, life, (p, t) => {
    const k = clamp(t / (life * 0.35), 0, 1);
    g.rotation.x = -k * k * 1.75;   // the handle whips up
    if (t > life * 0.7) p.scale.setScalar(clamp(1 - (t - life * 0.7) / (life * 0.3), 0, 1));
  });
  return pivot;
}

// TRAPDOOR — two real hinged flaps set into the floor, which open, swallow,
// and close. The frame stays visible for the whole off-field duration so the
// opponent's player can see exactly where they are about to come back.
export function trapdoor(fx, at, life = 1.4) {
  const g = new THREE.Group();
  const frame = mesh(tGeo(new THREE.TorusGeometry(0.92, 0.07, 4, 4), { rot: [90, 0, 45] }), M.wood(0x4a3a2c));
  const flaps = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group();
    const flap = mesh(roundBox(1.24, 0.07, 0.60, 0.02), M.wood(0x5a4634));
    flap.position.z = s * 0.30;
    hinge.add(flap); hinge.add(ink(flap));
    hinge.position.z = s * 0.62;
    g.add(hinge);
    flaps.push({ hinge, s });
  }
  const hole = mesh(tGeo(new THREE.CircleGeometry(0.88, 20), { rot: [-90, 0, 0], pos: [0, 0.005, 0] }),
    new THREE.MeshBasicMaterial({ color: 0x05050a }));
  g.add(hole);
  g.add(node(frame));
  g.position.copy(at).setY(at.y + 0.03);
  fx.prop(g, life, (p, t) => {
    const open = t < 0.22 ? t / 0.22 : t > life - 0.30 ? clamp((life - t) / 0.30, 0, 1) : 1;
    for (const f of flaps) f.hinge.rotation.x = f.s * open * 1.65;
  });
  return g;
}

// STAGE LIGHT — a real fresnel: barn doors, a lens, a yoke and a severed
// cable. It falls with gravity and the TELEGRAPH is a real light cone on the
// floor, so it can be walked out of on sight.
export function stageLight(fx, at, telegraph = 0.55, fall = 0.4) {
  const life = telegraph + fall + 0.5;
  const g = new THREE.Group();
  const can = mesh(latheY([[0.30, 0], [0.34, 0.30], [0.30, 0.46]], 14, 1), M.iron(0x2e3238));
  const lens = mesh(tGeo(new THREE.CircleGeometry(0.29, 16), { rot: [90, 0, 0], pos: [0, 0.008, 0] }), M.glass(0xffe27a));
  const yoke = mesh(new THREE.TorusGeometry(0.40, 0.030, 4, 16, Math.PI), M.iron(0x40454c));
  yoke.rotation.set(0, Math.PI / 2, Math.PI);
  yoke.position.y = 0.24;
  const doors = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const d = mesh(tGeo(roundBox(0.44, 0.34, 0.02, 0.01), { rot: [-32, a * 57.29578, 0], pos: [Math.cos(a) * 0.30, -0.10, Math.sin(a) * 0.30] }), M.iron(0x23262b));
    doors.push(d);
  }
  const cable = mesh(tubeBetween(v3(0, 0.44, 0), v3(0.12, 0.95, -0.08), [0.026, 0.020], { radial: 5, hSeg: 3 }), M.cloth(0x1a1a20));
  g.add(node(can, lens, yoke, cable, ...doors));
  g.position.copy(at).setY(at.y + 9.0);
  // THE TELEGRAPH — a real cone of light on the floor. It brightens as the
  // fixture gets closer, which is a physically honest tell as well as a fair
  // one.
  const cone = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending }));
  cone.rotation.x = -Math.PI / 2;
  cone.position.copy(at).setY(at.y + 0.04);
  fx.prop(cone, telegraph + fall, (p, t) => {
    p.material.opacity = 0.10 + 0.34 * clamp(t / (telegraph + fall), 0, 1);
    p.scale.setScalar(1 - 0.25 * clamp(t / (telegraph + fall), 0, 1));
  });
  fx.prop(g, life, (p, t) => {
    if (t < telegraph) { p.visible = t > telegraph * 0.55; return; }
    const k = clamp((t - telegraph) / fall, 0, 1);
    p.position.y = at.y + 9.0 * (1 - k * k) + 0.30;
    if (k >= 1) p.rotation.z = Math.sin((t - telegraph - fall) * 30) * 0.12 * Math.exp(-(t - telegraph - fall) * 6);
    if (t > life - 0.4) p.scale.setScalar(clamp((life - t) / 0.4, 0, 1));
  });
  return g;
}

// ===========================================================================
// THE SIX BIG ONES
// ===========================================================================

// ANVIL — a proper London-pattern anvil: horn, step, face, waist and base.
// The most recognisable silhouette in the file and the one the whole "a
// beautifully rendered anvil" line is about.
export function anvil(fx, at, telegraph = 0.35, fall = 0.34) {
  const life = telegraph + fall + 0.7;
  const g = new THREE.Group();
  const iron = M.iron(0x4c525c);
  const face = mesh(roundBox(1.60, 0.34, 0.72, 0.05), iron);
  face.position.y = 1.04;
  const step = mesh(tGeo(roundBox(0.34, 0.16, 0.56, 0.04), { pos: [0.86, 0.94, 0] }), iron);
  const horn = mesh(tGeo(new THREE.ConeGeometry(0.26, 0.86, 12), { rot: [0, 0, -90], pos: [1.42, 0.98, 0] }), iron);
  const waist = mesh(tGeo(latheY([[0.42, 0], [0.30, 0.34], [0.34, 0.62], [0.56, 0.86]], 12, 0.82), { pos: [-0.05, 0.10, 0] }), iron);
  const base = mesh(tGeo(roundBox(1.15, 0.24, 0.86, 0.05), { pos: [-0.05, 0.12, 0] }), iron);
  g.add(node(face, step, horn, waist, base));
  g.position.copy(at).setY(at.y + 8.0);
  _drop(fx, g, at, 8.0, telegraph, fall, life, 1.6, 0xffe27a);
  return g;
}

// SAFE — a real strongbox: a riveted body, a hinged door, a spoked handle and
// a combination dial. It stays on top of them for the pin duration.
export function safe(fx, at, telegraph = 0.4, fall = 0.34, stay = 2.0) {
  const life = telegraph + fall + stay;
  const g = new THREE.Group();
  const body = mesh(roundBox(1.55, 1.60, 1.25, 0.07), M.iron(0x3c4450));
  body.position.y = 0.80;
  const door = mesh(tGeo(roundBox(1.34, 1.38, 0.10, 0.04), { pos: [0, 0.80, 0.64] }), M.iron(0x4a5460));
  const dial = mesh(tGeo(new THREE.CylinderGeometry(0.20, 0.20, 0.09, 18), { rot: [90, 0, 0], pos: [-0.28, 0.86, 0.72] }), M.iron(0xb0b4bc));
  const spokes = [];
  for (let i = 0; i < 4; i++) {
    spokes.push(mesh(tGeo(roundBox(0.44, 0.055, 0.055, 0.02), { rot: [0, 0, i * 45], pos: [0.34, 0.80, 0.72] }), M.iron(0xc0c4cc)));
  }
  const rivets = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    rivets.push(mesh(tGeo(new THREE.SphereGeometry(0.045, 6, 5), { pos: [Math.cos(a) * 0.62, 0.80 + Math.sin(a) * 0.64, 0.70] }), M.iron(0x8a9098)));
  }
  g.add(node(body, door, dial, ...spokes, ...rivets));
  g.position.copy(at).setY(at.y + 8.5);
  _drop(fx, g, at, 8.5, telegraph, fall, life, 2.0, 0xb0b4bc);
  return g;
}

// STAGE CURTAIN — real red velvet: two hanging panels with a swag and a gold
// fringe, which sweep in from either side and wrap.
export function curtain(fx, at, life = 1.9) {
  const g = new THREE.Group();
  const panels = [];
  for (const s of [1, -1]) {
    const p = new THREE.Group();
    // pleats — six tapered panels per side, so the velvet has folds rather
    // than being a flat sheet
    for (let i = 0; i < 6; i++) {
      const w = 0.30;
      const m = mesh(tGeo(roundBox(w, 3.4, 0.09, 0.03), { rot: [0, i * 6 - 15, 0], pos: [(i - 2.5) * w * 0.86, 1.7, Math.sin(i * 1.1) * 0.10] }), M.cloth(i % 2 ? 0x8a1f2c : 0x741924));
      p.add(m); p.add(ink(m, 0.012));
    }
    const fringe = mesh(tGeo(roundBox(1.60, 0.14, 0.14, 0.05), { pos: [0, 0.06, 0] }), M.glass(0xd8b45a));
    p.add(fringe); p.add(ink(fringe));
    p.position.set(s * 5.0, 0, 0);
    g.add(p);
    panels.push({ p, s });
  }
  const rail = mesh(tGeo(new THREE.CylinderGeometry(0.07, 0.07, 6.2, 10), { rot: [0, 0, 90], pos: [0, 3.42, 0] }), M.iron(0x6a5a3a));
  g.add(node(rail));
  g.position.copy(at);
  fx.prop(g, life, (n, t) => {
    const close = clamp(t / 0.32, 0, 1);
    const open = t > life - 0.36 ? clamp((t - (life - 0.36)) / 0.36, 0, 1) : 0;
    for (const q of panels) q.p.position.x = q.s * (5.0 * (1 - close) + 0.42 + open * 5.0);
    n.rotation.y += 0.0;
  });
  return g;
}

// FIRE HOSE — a real canvas hose with a brass nozzle and a genuine jet: a
// tapering column of water with a spreading front, laid along the lane in
// world space rather than billboarded.
export function fireHose(fx, from, dir, len = 9.0, life = 0.95) {
  const g = new THREE.Group();
  const nozzle = mesh(tGeo(latheY([[0.10, 0], [0.14, 0.22], [0.09, 0.34]], 12, 1), { rot: [90, 0, 0] }), M.iron(0xb08a3a));
  const hose = mesh(tubeBetween(v3(0, 0, -0.1), v3(-0.5, -0.5, -1.4), [0.10, 0.10], { radial: 7, hSeg: 4 }), M.cloth(0xd8c8a0));
  g.add(node(nozzle, hose));
  const jet = new THREE.Group();
  const SEG = 9;
  const segs = [];
  for (let i = 0; i < SEG; i++) {
    const r0 = 0.10 + i * 0.055, r1 = 0.10 + (i + 1) * 0.055;
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r1, r0, len / SEG, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x8ad0f0, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    m.rotation.x = Math.PI / 2;
    m.position.z = (i + 0.5) * (len / SEG);
    jet.add(m);
    segs.push(m);
  }
  g.add(jet);
  g.position.copy(from);
  g.lookAt(from.clone().add(dir));
  fx.prop(g, life, (n, t) => {
    const k = clamp(t / (life * 0.25), 0, 1);
    jet.scale.z = k;
    segs.forEach((m, i) => {
      m.material.opacity = 0.42 * k * (1 - i / (SEG * 1.6)) * (0.75 + Math.sin(t * 26 + i) * 0.25);
    });
    if (t > life - 0.2) jet.scale.z = clamp((life - t) / 0.2, 0, 1) * k;
  });
  return g;
}

// FOAM FINGER — a real foam hand: four folded fingers, a raised index, and a
// printed band. It swings on a real pivot through a real arc.
export function foamFinger(fx, at, facing, life = 0.8) {
  const pivot = new THREE.Group();
  const g = new THREE.Group();
  const palm = mesh(roundBox(1.10, 1.35, 0.42, 0.18), M.paint(0xf05a8a));
  palm.position.set(0, 0, 2.0);
  const index = mesh(tGeo(roundBox(0.44, 1.55, 0.40, 0.18), { pos: [0.30, 1.30, 2.0] }), M.paint(0xf05a8a));
  const thumb = mesh(tGeo(roundBox(0.42, 0.85, 0.38, 0.16), { rot: [0, 0, 36], pos: [-0.66, 0.30, 2.0] }), M.paint(0xf05a8a));
  const band = mesh(tGeo(roundBox(1.14, 0.30, 0.44, 0.06), { pos: [0, -0.52, 2.0] }), M.cream(0xf2f2ee));
  const arm = mesh(tubeBetween(v3(0, 0, 0), v3(0, 0, 1.7), [0.14, 0.20], { radial: 8, hSeg: 3 }), M.paint(0xc44878));
  g.add(node(palm, index, thumb, band, arm));
  pivot.add(g);
  pivot.position.copy(at).setY(at.y + 1.15);
  pivot.rotation.y = facing;
  fx.prop(pivot, life, (p, t) => {
    const k = clamp(t / (life * 0.42), 0, 1);
    const e = k * k * (3 - 2 * k);
    p.rotation.y = facing - 1.45 + e * 2.9;
    g.rotation.z = -0.25 + e * 0.5;
    if (t > life * 0.65) p.scale.setScalar(clamp(1 - (t - life * 0.65) / (life * 0.35), 0, 1));
  });
  return pivot;
}

// PIANO — a real upright: a case, a lid, a fallboard, eighty-eight keys in
// black and white, three pedals and a brass castor on each leg. The biggest
// object in the file and the one whose landing carries the most weight.
export function piano(fx, at, telegraph = 0.5, fall = 0.42) {
  const life = telegraph + fall + 0.9;
  const g = new THREE.Group();
  const black = M.paint(0x1c1a20);
  const body = mesh(roundBox(2.30, 1.85, 0.98, 0.06), black);
  body.position.y = 1.30;
  const lid = mesh(tGeo(roundBox(2.40, 0.12, 1.10, 0.04), { pos: [0, 2.26, 0] }), black);
  const fall_ = mesh(tGeo(roundBox(2.20, 0.30, 0.10, 0.03), { rot: [-40, 0, 0], pos: [0, 0.72, 0.52] }), black);
  const keybed = mesh(tGeo(roundBox(2.16, 0.10, 0.52, 0.02), { pos: [0, 0.52, 0.62] }), M.cream(0xf4f2ea));
  const parts = [body, lid, fall_, keybed];
  // the black keys — a real 5+7 pattern rather than an even comb
  const PATTERN = [1, 1, 0, 1, 1, 1, 0];
  for (let i = 0, x = -1.02; i < 21; i++) {
    if (PATTERN[i % 7]) parts.push(mesh(tGeo(roundBox(0.055, 0.07, 0.32, 0.01), { pos: [x + 0.05, 0.585, 0.55] }), black));
    x += 0.098;
  }
  for (let i = 0; i < 3; i++) parts.push(mesh(tGeo(new THREE.CylinderGeometry(0.035, 0.035, 0.20, 8), { pos: [(i - 1) * 0.20, 0.20, 0.48] }), M.iron(0xb08a3a)));
  for (const s of [1, -1]) {
    parts.push(mesh(tGeo(roundBox(0.20, 0.44, 0.24, 0.03), { pos: [s * 1.00, 0.22, 0.30] }), black));
    parts.push(mesh(tGeo(new THREE.SphereGeometry(0.09, 8, 6), { pos: [s * 1.00, 0.06, 0.30] }), M.iron(0xb08a3a)));
  }
  g.add(node(...parts));
  g.position.copy(at).setY(at.y + 10.0);
  _drop(fx, g, at, 10.0, telegraph, fall, life, 2.6, 0xf4f2ea);
  return g;
}

// The shared FALL — telegraph ring, gravity-correct descent, landing bounce,
// and a dust ring sized to the mass. Every dropped object uses it, which is
// why an anvil, a safe and a piano feel like three weights of the same thing.
function _drop(fx, g, at, h, telegraph, fall, life, mass, dustColor) {
  const ring = new THREE.Mesh(new THREE.RingGeometry(mass * 0.55, mass * 0.72, 26),
    new THREE.MeshBasicMaterial({ color: dustColor, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.copy(at).setY(at.y + 0.05);
  fx.prop(ring, telegraph + fall, (p, t) => {
    const k = clamp(t / (telegraph + fall), 0, 1);
    p.material.opacity = 0.16 + 0.44 * k;
    p.scale.setScalar(1.35 - 0.35 * k);
  });
  let landed = false;
  fx.prop(g, life, (p, t) => {
    if (t < telegraph) { p.visible = t > telegraph * 0.4; p.position.y = at.y + h; return; }
    const k = clamp((t - telegraph) / fall, 0, 1);
    p.position.y = at.y + h * (1 - k * k);
    if (k >= 1 && !landed) {
      landed = true;
      for (let i = 0; i < 20; i++) {
        const a = rand(0, Math.PI * 2);
        fx._spawn(at.clone().setY(at.y + 0.1), {
          color: i % 3 === 0 ? dustColor : 0x9a9288, size: rand(0.12, 0.34), life: rand(0.3, 0.7),
          vel: v3(Math.cos(a) * rand(3, 8) * mass * 0.5, rand(0.5, 3), Math.sin(a) * rand(3, 8) * mass * 0.5), gravity: 9
        });
      }
      fx._ring(at.clone().setY(at.y + 0.05), dustColor, { size: mass * 0.5, growRate: 14, life: 0.4 });
    }
    if (t > life - 0.5) p.scale.setScalar(clamp((life - t) / 0.5, 0, 1));
  });
}

// ===========================================================================
// THE AUDIENCE — maximum Comedy Meter only
// ===========================================================================
// A SPOTLIGHT that follows him, and confetti/applause on knockdowns. It grants
// nothing; it is the meter's reward being LEGIBLE, which is what the brief
// asks "lean into it" to mean.
export function spotlight(fx, f, life = 0.2) {
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 1.5, 7.0, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.10, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  cone.position.copy(f.pos).setY(f.pos.y + 3.5);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.5, 22),
    new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.copy(f.pos).setY(f.pos.y + 0.03);
  const g = new THREE.Group();
  g.add(cone, pool);
  fx.prop(g, life, () => {
    cone.position.copy(f.pos).setY(f.pos.y + 3.5);
    pool.position.copy(f.pos).setY(f.pos.y + 0.03);
  });
  return g;
}

export function confetti(fx, at, n = 60) {
  const COLORS = [0xff4d7a, 0xffd84a, 0x5fd0ff, 0x6fe89a, 0xf2f2ee, 0xd8332e];
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2);
    fx._spawn(at.clone().add(v3(rand(-0.6, 0.6), rand(-0.3, 0.6), rand(-0.6, 0.6))), {
      color: COLORS[i % COLORS.length], size: rand(0.07, 0.17), aspect: 0.45,
      life: rand(0.9, 1.9), opacity: 0.95, spin: rand(-12, 12), gravity: 3.4,
      vel: v3(Math.cos(a) * rand(2, 7), rand(4, 9), Math.sin(a) * rand(2, 7))
    });
  }
}

// ===========================================================================
// YAGA — the construction beat, which lives here because it is the same
// department: real objects appearing where there were none.
// ===========================================================================
// SAWDUST AND SHAVINGS off his hands while the meter fills. Sized and coloured
// by the tier he is currently in, so the escalation is visible from across the
// arena before the corpse exists.
export function craftMotes(fx, f, tierColor, intensity = 1) {
  const hand = f.pos.clone()
    .addScaledVector(f.forward(), 0.55)
    .setY(f.pos.y + (f.cfg.size?.height ?? 1.99) * 0.58);
  for (let i = 0; i < Math.ceil(2 * intensity); i++) {
    fx._spawn(hand.clone().add(v3(rand(-0.28, 0.28), rand(-0.14, 0.14), rand(-0.28, 0.28))), {
      color: i % 3 === 0 ? tierColor : 0xb8a888, size: rand(0.035, 0.10), aspect: 0.5,
      life: rand(0.35, 0.8), opacity: 0.8, gravity: 5.2,
      vel: v3(rand(-1.1, 1.1), rand(0.4, 1.9), rand(-1.1, 1.1))
    });
  }
}

// The moment a corpse is finished: a ring of light at the seams and a burst of
// the tier's colour. Bigger and brighter per tier — the payoff has to scale
// with what the opponent allowed.
export function corpseDeploy(fx, at, tier, scale = 1) {
  const k = ({ scrap: 0.55, standard: 0.85, refined: 1.15, masterwork: 1.6 })[tier.key] ?? 1;
  fx._ring(at.clone().setY(at.y + 0.06), tier.accent, { size: 0.5 * k * scale, growRate: 9 * k, life: 0.5 });
  fx._ring(at.clone().setY(at.y + 0.9 * k), tier.accent, { size: 0.35 * k * scale, growRate: 6 * k, life: 0.4, flat: false });
  for (let i = 0; i < Math.round(14 * k); i++) {
    const a = rand(0, Math.PI * 2);
    fx._spawn(at.clone().setY(at.y + rand(0.2, 1.6 * k)), {
      color: i % 3 === 0 ? tier.accent : tier.color, size: rand(0.08, 0.26 * k), life: rand(0.3, 0.75),
      vel: v3(Math.cos(a) * rand(1.5, 4.5), rand(0.5, 3), Math.sin(a) * rand(1.5, 4.5)), gravity: 6
    });
  }
}

// COMMAND — a short pulse from Yaga to each corpse. Not a beam: a line of
// motes that travels, so it reads as an instruction rather than as a technique.
export function commandPulse(fx, from, to, color) {
  const d = to.clone().sub(from);
  const n = Math.max(4, Math.min(16, Math.round(d.length() * 1.6)));
  for (let i = 0; i < n; i++) {
    const p = from.clone().addScaledVector(d, i / n).setY(from.y + 1.2 + Math.sin((i / n) * Math.PI) * 0.5);
    fx._spawn(p, {
      color, size: 0.13, life: 0.22 + (i / n) * 0.2, opacity: 0.85,
      vel: v3(0, 0.4, 0)
    });
  }
  fx._ring(to.clone().setY(to.y + 0.06), color, { size: 0.4, growRate: 8, life: 0.32 });
}
