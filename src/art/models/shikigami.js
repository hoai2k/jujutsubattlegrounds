// SHIKIGAMI — the six shadow constructs of the Ten Shadows Technique.
//
// ======================== SHARED REFERENCE NOTES =========================
// Researched against the Jujutsu Kaisen Wiki shikigami pages and anime
// appearance descriptions; all geometry below is original and procedural.
//
// FAMILY   Every one of these is a SHADOW CONSTRUCT, so they share one
//          material and one presentation language:
//            · near-black bodies (values sit between #0a0c14 and #1c202c) so
//              they read as absence rather than as a dark-coloured animal
//            · a hard cool rim (#8fb6d8) doing almost all the shape reading —
//              rim strength 0.9 against a black body is what makes them
//              legible against every one of the seven maps
//            · a shadow POOL disc on the ground under each one, which is what
//              they rise out of on summon and sink back into on death
//            · smoke wisping off the silhouette (spawned by the entity)
//          Individual identity comes from silhouette and from the one or two
//          canonical markings each design actually has.
//
// PER-CREATURE (accuracy notes are in the deliverable write-up):
//  DIVINE DOGS 玉犬 — a PAIR of twin wolves, one white one black; each wears
//          THREE DOTS on the forehead in the other's colour. Lean wolf build,
//          long muzzle, upright pointed ears, heavy brush tail.
//  NUE 鵺  — large OWL-LIKE body, orange-brown plumage, a WHITE MASK-LIKE
//          SKULL for a face with human-like teeth, big wings, TWO SETS of
//          talons, a mark on the forehead matching the Serpent's.
//  TOAD 蝦蟇 — squat wide-bodied toad, heavy brow, enormous mouth, and the
//          long elastic TONGUE that is the entire reason it exists.
//  GREAT SERPENT 大蛇 — a very long white snake with black markings running
//          the body, wedge head, forehead mark.
//  MAX ELEPHANT 満象 — enormous, heaviest of the set. Broad domed skull,
//          large ears, two tusks, and the trunk that delivers the torrent.
//  RABBIT ESCAPE 兎 — a swarm of small plain rabbits, long ears, no detail
//          beyond that; they exist in numbers, not as individuals.
// =========================================================================
import * as THREE from 'three';
import { toonMaterial } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { tubeBetween, coneSpike, roundBox, tGeo, mergeGeos } from '../builders/geo.js';
import { v3, rand } from '../../core/mathutil.js';

// ---- the one shared shikigami material ------------------------------------
// vertexColors carries every creature's individual values, so all six share
// this single material instance and therefore a single shading response.
let _mat = null, _glowMat = null;
export function shikigamiMaterial() {
  if (!_mat) {
    // Tuned against the real bodies, not in the abstract: at rim 0.9 /
    // rimStart 0.48 every creature rendered as a black hole with a hot
    // outline — the mass vanished and only the silhouette edge survived. The
    // band floor is lifted and the rim pulled back so there is actual shape
    // inside the shape, while the bodies still read as darkness.
    _mat = toonMaterial({
      vertexColors: true, steps: [46, 88, 172],
      rim: 0.52, rimStart: 0.64, rimColor: 0x8fb6d8, gloss: 0.12,
      warm: 0x141a26, cool: 0x16203a
    });
  }
  return _mat;
}
// Additive over a dark body blows straight to white, which is why every eye in
// the first pass rendered as a headlight. Opacity is kept low and each caller
// clones it so the colour survives instead of being clipped away.
function glowMat() {
  if (!_glowMat) {
    _glowMat = new THREE.MeshBasicMaterial({
      color: 0x8fb6d8, transparent: true, opacity: 0.42,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
  }
  return _glowMat;
}

// Values, not colours: every one of these is a shadow first and an animal
// second, so even the "white" ones sit well below mid-grey. PALE has to read
// as the white twin next to BLACK without ever reading as a live white wolf.
const BLACK = 0x171b28;      // the default construct value
const CHAR = 0x252b3c;       // a half-step up, for overlapping masses
const PALE = 0x7f8a9e;       // the "white" of the white dog / the serpent
const BONE = 0xaab4c4;       // Nue's skull mask, tusks, teeth
const EMBER = 0x3d2a1a;      // Nue's plumage — the orange-brown, read as shadow
const MARK = 0x6f8fa8;       // forehead marks and glyphs — rim-coloured

// ---- construction helpers --------------------------------------------------
// A "joint" is just a Group: these creatures do not use the humanoid skeleton
// (a quadruped, a bird and a snake share nothing with it), so each body plan
// gets a hierarchy shaped like the animal and an animator written for it.
function joint(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function colored(geo, color) {
  const n = geo.getAttribute('position').count;
  const c = new THREE.Color(color);
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
// add a mesh to a joint. `outline` marks the few silhouette-defining masses
// that earn an inverted-hull pass (keeping the draw-call cost sane).
function part(parent, geo, color, { outline = false, thickness = 0.014 } = {}) {
  const mesh = new THREE.Mesh(colored(geo, color), shikigamiMaterial());
  parent.add(mesh);
  if (outline) parent.add(makeOutline(mesh, { color: 0x04050a, thickness }));
  return mesh;
}
function ellipsoid(rx, ry, rz, seg = 10) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 2));
  g.scale(rx, ry, rz);
  g.computeVertexNormals();
  return g;
}
// the three forehead dots the Divine Dogs wear, and Nue's / the Serpent's mark
function dots(host, r, spread, color) {
  for (let i = -1; i <= 1; i++) {
    const d = new THREE.Mesh(colored(new THREE.SphereGeometry(r, 6, 5), color), shikigamiMaterial());
    d.position.set(i * spread, 0, 0);
    host.add(d);
  }
}

// ---- the shadow pool every shikigami rises out of --------------------------
function shadowPool(radius) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 22),
    new THREE.MeshBasicMaterial({ color: 0x04050a, transparent: true, opacity: 0.86, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.94, radius * 1.06, 24), glowMat());
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(disc, ring);
  g.renderOrder = 2;
  return g;
}

// Wrap a finished body in the shared summon / death presentation. Every
// builder ends with this, so emergence and dissolve are identical across the
// family even though the bodies could not be less alike.
function finish(body, { height, radius, poolR, tick, extras }) {
  const group = new THREE.Group();
  const pool = shadowPool(poolR ?? radius * 1.15);
  group.add(pool, body);
  let reveal = 0;
  const api = {
    group, body, pool, height, radius, extras: extras || {},
    // 0 = fully submerged in the shadow, 1 = fully out
    setReveal(k) {
      reveal = Math.max(0, Math.min(1, k));
      const e = reveal * reveal * (3 - 2 * reveal);
      body.position.y = (e - 1) * height * 1.05;
      const s = 0.62 + e * 0.38;
      body.scale.setScalar(s);
      pool.scale.setScalar(0.5 + e * 0.7);
      pool.children[1].material.opacity = 0.18 + (1 - e) * 0.5;
    },
    get reveal() { return reveal; },
    tick
  };
  api.setReveal(0);
  return api;
}

// ===========================================================================
// 1 — DIVINE DOGS 玉犬 : quadruped, trotting gait, diagonal-pair timing
// ===========================================================================
// `white` picks which twin this is. Both are shadow-black bodies; the white
// one's coat value is lifted to PALE and its three forehead dots go black,
// the black one's dots go pale — the canon inversion.
export function buildDivineDog(white = false) {
  const coat = white ? PALE : BLACK;
  const dotC = white ? BLACK : PALE;
  const S = 0.92;                      // overall scale — wolf, not pony
  const body = new THREE.Group();

  // Wolf proportions, not pony: body LONGER than it is tall, legs short enough
  // that the barrel sits low, head large. The first pass had it leggy and
  // beach-ball-segmented; the barrel sections now overlap heavily so they
  // merge into one mass.
  const root = joint(body, 0, 0.50 * S, 0);
  // spine: chest -> waist -> hips, so the back can arch through the gait
  const chest = joint(root, 0, 0, 0.20 * S);
  const waist = joint(root, 0, 0, -0.06 * S);
  const hips = joint(waist, 0, 0, -0.22 * S);
  part(chest, ellipsoid(0.185 * S, 0.185 * S, 0.30 * S, 12), coat, { outline: true });
  part(waist, ellipsoid(0.165 * S, 0.165 * S, 0.26 * S, 10), coat);
  part(hips, ellipsoid(0.175 * S, 0.180 * S, 0.24 * S, 10), coat, { outline: true });
  // shoulder / haunch masses so the legs do not float off the barrel
  part(chest, tGeo(ellipsoid(0.09 * S, 0.13 * S, 0.13 * S, 8), { pos: [0.155 * S, -0.06 * S, 0.04 * S] }), coat);
  part(chest, tGeo(ellipsoid(0.09 * S, 0.13 * S, 0.13 * S, 8), { pos: [-0.155 * S, -0.06 * S, 0.04 * S] }), coat);

  // neck + head: long wolf muzzle, upright pointed ears
  const neck = joint(chest, 0, 0.09 * S, 0.24 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, 0.07 * S, 0.16 * S), [0.125 * S, 0.105 * S], { radial: 9, hSeg: 3 }), coat);
  const head = joint(neck, 0, 0.08 * S, 0.18 * S);
  part(head, ellipsoid(0.115 * S, 0.118 * S, 0.135 * S, 10), coat, { outline: true, thickness: 0.011 });
  // muzzle: a tapering wedge, not a cone stuck on a ball
  part(head, tubeBetween(v3(0, -0.012 * S, 0.06 * S), v3(0, -0.045 * S, 0.215 * S),
    [0.072 * S, 0.036 * S], { radial: 8, hSeg: 3, zScale: 0.85 }), coat);
  const jaw = joint(head, 0, -0.045 * S, 0.055 * S);
  part(jaw, tubeBetween(v3(0, 0, 0), v3(0, -0.012 * S, 0.155 * S), [0.055 * S, 0.028 * S], { radial: 7, hSeg: 2 }), CHAR);
  // fangs
  for (const s of [1, -1]) {
    part(jaw, tGeo(coneSpike(0.013 * S, 0.05 * S, v3(), { radial: 4, hSeg: 2 }),
      { rot: [180, 0, 0], pos: [s * 0.032 * S, 0.028 * S, 0.115 * S] }), BONE);
  }
  // ears: tall triangles raked slightly back
  for (const s of [1, -1]) {
    part(head, tGeo(coneSpike(0.042 * S, 0.13 * S, v3(s * 0.02 * S, 0, -0.03 * S), { radial: 4, hSeg: 3, zScale: 0.4 }),
      { pos: [s * 0.055 * S, 0.075 * S, -0.02 * S], rot: [-12, 0, s * 16] }), coat);
  }
  // eyes — two hard glowing slits, the only bright thing on the animal
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.038 * S, 0.016 * S), glowMat().clone());
    e.material.opacity = 0.62;
    e.material.color.setHex(white ? 0xcfe4ff : 0x8fb6d8);
    e.position.set(s * 0.058 * S, 0.012 * S, 0.088 * S);
    e.rotation.set(0, s * 0.5, s * -0.22);
    head.add(e);
  }
  // THE THREE FOREHEAD DOTS, in the opposite colour
  const brow = joint(head, 0, 0.062 * S, 0.062 * S);
  brow.rotation.x = -0.5;
  dots(brow, 0.017 * S, 0.045 * S, dotC);

  // legs: upper / lower / paw, front pair on the chest, rear on the hips
  const legs = [];
  for (const s of [1, -1]) {
    for (const [host, z, up, lo] of [[chest, 0.08 * S, 0.22, 0.19], [hips, -0.04 * S, 0.24, 0.21]]) {
      const hip = joint(host, s * 0.105 * S, -0.09 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -up * S, 0), [0.062 * S, 0.040 * S], { radial: 7, hSeg: 3 }), coat);
      const knee = joint(hip, 0, -up * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -lo * S, 0), [0.040 * S, 0.028 * S], { radial: 6, hSeg: 3 }), coat);
      const paw = joint(knee, 0, -lo * S, 0);
      part(paw, tGeo(roundBox(0.062 * S, 0.036 * S, 0.088 * S, 0.014 * S), { pos: [0, -0.014 * S, 0.018 * S] }), CHAR);
      legs.push({ hip, knee, paw, front: host === chest, side: s });
    }
  }

  // tail: a three-link brush that lags behind the body
  const tailA = joint(hips, 0, 0.08 * S, -0.18 * S);
  part(tailA, tubeBetween(v3(0, 0, 0), v3(0, 0.02 * S, -0.16 * S), [0.045 * S, 0.038 * S], { radial: 7, hSeg: 2 }), coat);
  const tailB = joint(tailA, 0, 0.02 * S, -0.16 * S);
  part(tailB, tubeBetween(v3(0, 0, 0), v3(0, -0.01 * S, -0.15 * S), [0.038 * S, 0.028 * S], { radial: 6, hSeg: 2 }), coat);
  const tailC = joint(tailB, 0, -0.01 * S, -0.15 * S);
  part(tailC, tubeBetween(v3(0, 0, 0), v3(0, -0.03 * S, -0.13 * S), [0.028 * S, 0.008 * S], { radial: 5, hSeg: 2 }), coat);

  // ---- QUADRUPED GAIT -----------------------------------------------------
  // A trot: diagonal pairs move together, so front-left swings with rear-right.
  // The spine counter-rotates a little and the whole body bobs at twice the
  // stride rate. Speed drives the stride frequency directly.
  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 6);
    t += dt * (2.6 + run * 9);
    const bite = st.action === 'bite' ? st.actionK : 0;
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI) + (L.side > 0 ? 0 : Math.PI));
      const swing = Math.sin(ph);
      const lift = Math.max(0, Math.sin(ph)) * (0.35 + run * 0.55);
      L.hip.rotation.x = swing * (0.42 + run * 0.32) * (L.front ? 1 : -0.86);
      L.knee.rotation.x = -lift * (L.front ? 0.9 : 1.25) - 0.12;
      L.paw.rotation.x = lift * 0.5;
    }
    root.position.y = 0.50 * S + Math.abs(Math.sin(t)) * 0.028 * (0.5 + run);
    root.rotation.z = Math.sin(t) * 0.05 * run;
    chest.rotation.x = -0.06 + Math.sin(t * 2) * 0.04 - bite * 0.25;
    waist.rotation.y = Math.sin(t) * 0.10 * run;
    hips.rotation.x = 0.04 - Math.sin(t * 2) * 0.03;
    // head: leads into the lunge, snaps down on the bite
    neck.rotation.x = -0.18 + Math.sin(t * 2 + 1) * 0.05 + bite * 0.5;
    head.rotation.x = 0.10 - bite * 0.45;
    jaw.rotation.x = 0.05 + (st.action === 'bite' ? Math.sin(st.actionK * Math.PI) * 0.75 : 0);
    // tail: each link lags the one before it, which is the whole trick
    tailA.rotation.x = -0.5 + Math.sin(t * 0.9) * 0.10;
    tailA.rotation.y = Math.sin(t * 0.75) * 0.22;
    tailB.rotation.y = Math.sin(t * 0.75 - 0.7) * 0.30;
    tailC.rotation.y = Math.sin(t * 0.75 - 1.4) * 0.36;
    tailB.rotation.x = Math.sin(t * 0.9 - 0.6) * 0.14;
    if (st.hurt) { chest.rotation.x -= 0.3; head.rotation.x += 0.4; }
  };

  return finish(body, { height: 0.95 * S, radius: 0.5 * S, poolR: 0.62 * S, tick, extras: { white } });
}

// ===========================================================================
// 2 — NUE 鵺 : winged, flight cycle with phase-lagged wing segments
// ===========================================================================
export function buildNue() {
  const S = 1.05;
  const body = new THREE.Group();
  const root = joint(body, 0, 1.5 * S, 0);

  // owl-like barrel body, plumage read as very dark ember-brown
  const torso = joint(root, 0, 0, 0);
  part(torso, ellipsoid(0.26 * S, 0.32 * S, 0.28 * S, 12), EMBER, { outline: true });
  // layered feather shells down the breast
  for (let i = 0; i < 3; i++) {
    part(torso, tGeo(ellipsoid(0.22 * S - i * 0.03 * S, 0.11 * S, 0.18 * S, 8),
      { pos: [0, -0.06 * S - i * 0.10 * S, 0.06 * S] }), i % 2 ? CHAR : EMBER);
  }

  // HEAD — the white mask-like skull with human teeth. This is THE read, so it
  // is deliberately oversized relative to the body: a small mask disappears at
  // fight distance and the whole design goes with it.
  const neck = joint(torso, 0, 0.26 * S, 0.08 * S);
  const head = joint(neck, 0, 0.13 * S, 0.05 * S);
  part(head, ellipsoid(0.22 * S, 0.21 * S, 0.20 * S, 10), CHAR, { outline: true, thickness: 0.013 });
  // the mask: a pale plate across the front of the skull
  const mask = joint(head, 0, 0.005 * S, 0.13 * S);
  part(mask, tGeo(ellipsoid(0.195 * S, 0.195 * S, 0.085 * S, 12), { pos: [0, 0, 0] }), BONE, { outline: true, thickness: 0.011 });
  // two sunken eye pits
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.058 * S, 12), glowMat().clone());
    e.material.color.setHex(0xd8a04c);
    e.material.opacity = 0.62;
    e.position.set(s * 0.078 * S, 0.045 * S, 0.078 * S);
    mask.add(e);
  }
  // human-like teeth: a straight row across the mask's lower edge
  for (let i = -3; i <= 3; i++) {
    part(mask, tGeo(roundBox(0.026 * S, 0.036 * S, 0.014 * S, 0.004),
      { pos: [i * 0.030 * S, -0.115 * S, 0.062 * S] }), BONE);
  }
  // forehead mark (matches the Great Serpent's)
  const brow = joint(mask, 0, 0.125 * S, 0.05 * S);
  brow.rotation.x = -0.4;
  dots(brow, 0.019 * S, 0.048 * S, MARK);

  // WINGS — three segments a side so the flap can lag outward along the span.
  // Span matters: an owl's wings are roughly three times its body width, and
  // the first pass built them at barely one, which read as a bird with arms.
  // Total half-span here is ~1.75 m against a 0.5 m body.
  const wings = [];
  for (const s of [1, -1]) {
    const shoulder = joint(torso, s * 0.20 * S, 0.12 * S, 0);
    part(shoulder, tubeBetween(v3(0, 0, 0), v3(s * 0.52 * S, 0.07 * S, 0), [0.085 * S, 0.062 * S], { radial: 7, hSeg: 3 }), EMBER, { outline: true, thickness: 0.011 });
    // secondaries filling the inner wing so it is a surface, not a bone
    part(shoulder, tGeo(ellipsoid(0.28 * S, 0.030 * S, 0.20 * S, 9), { pos: [s * 0.28 * S, 0.02 * S, -0.05 * S] }), CHAR);
    const elbow = joint(shoulder, s * 0.52 * S, 0.07 * S, 0);
    part(elbow, tubeBetween(v3(0, 0, 0), v3(s * 0.48 * S, -0.03 * S, 0), [0.062 * S, 0.042 * S], { radial: 6, hSeg: 3 }), EMBER, { outline: true, thickness: 0.010 });
    part(elbow, tGeo(ellipsoid(0.24 * S, 0.026 * S, 0.16 * S, 9), { pos: [s * 0.24 * S, 0, -0.04 * S] }), EMBER);
    const wrist = joint(elbow, s * 0.48 * S, -0.03 * S, 0);
    // primaries: a long fan of tapered feathers off the wrist
    const feathers = [];
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const f = joint(wrist, 0, 0, 0);
      f.rotation.y = s * (-0.34 + k * 1.15);
      part(f, tGeo(coneSpike(0.055 * S, (0.78 - k * 0.26) * S, v3(0, 0, 0), { radial: 4, hSeg: 3, zScale: 0.16 }),
        { rot: [0, 0, s * -94] }), i % 2 ? CHAR : EMBER, { outline: i === 3, thickness: 0.010 });
      feathers.push(f);
    }
    wings.push({ shoulder, elbow, wrist, feathers, side: s });
  }

  // TWO SETS OF TALONS, as the design has
  const talons = [];
  for (const s of [1, -1]) {
    for (const z of [0.09 * S, -0.08 * S]) {
      const hip = joint(torso, s * 0.11 * S, -0.24 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.20 * S, 0), [0.038 * S, 0.028 * S], { radial: 6, hSeg: 2 }), CHAR);
      const foot = joint(hip, 0, -0.20 * S, 0);
      for (let i = -1; i <= 1; i++) {
        part(foot, tGeo(coneSpike(0.013 * S, 0.075 * S, v3(0, 0, 0.02 * S), { radial: 4, hSeg: 2 }),
          { rot: [110, 0, 0], pos: [i * 0.022 * S, 0, 0.012 * S] }), BONE);
      }
      talons.push({ hip, foot });
    }
  }
  // short fanned tail
  const tail = joint(torso, 0, -0.10 * S, -0.22 * S);
  for (let i = -2; i <= 2; i++) {
    part(tail, tGeo(coneSpike(0.030 * S, 0.30 * S, v3(), { radial: 4, hSeg: 2, zScale: 0.25 }),
      { rot: [96, 0, 0], pos: [i * 0.030 * S, 0, 0] }), i % 2 ? CHAR : EMBER);
  }

  // ---- FLIGHT CYCLE -------------------------------------------------------
  // Down-stroke is fast and shallow, up-stroke slow and deep; the elbow lags
  // the shoulder and the primaries lag the elbow, which is what sells a wing
  // as a wing rather than a hinged board.
  let t = 0;
  const tick = (dt, st) => {
    const dive = st.action === 'dive' ? st.actionK : 0;
    t += dt * (st.action === 'dive' ? 11 : 6.2);
    // asymmetric flap: sharpened sine
    const raw = Math.sin(t);
    const flap = Math.sign(raw) * Math.pow(Math.abs(raw), 0.65);
    for (const w of wings) {
      const tuck = dive * 1.15;   // wings sweep back and in through the dive
      w.shoulder.rotation.z = w.side * (flap * 0.55 + 0.10 - tuck * 0.5);
      w.shoulder.rotation.y = w.side * (-tuck * 0.85);
      w.elbow.rotation.z = w.side * (Math.sin(t - 0.55) * 0.42 - tuck * 0.35);
      w.wrist.rotation.z = w.side * (Math.sin(t - 1.05) * 0.34);
      w.feathers.forEach((f, i) => {
        f.rotation.z = w.side * Math.sin(t - 1.3 - i * 0.13) * 0.22;
      });
    }
    root.position.y = 1.5 * S + Math.sin(t) * 0.10 - dive * 0.9;
    torso.rotation.x = 0.10 + Math.sin(t * 2) * 0.05 + dive * 0.85;
    neck.rotation.x = -0.16 - dive * 0.35;
    head.rotation.x = Math.sin(t * 0.7) * 0.08 + dive * 0.55;
    head.rotation.y = Math.sin(t * 0.4) * 0.25 * (1 - dive);
    for (const L of talons) {
      L.hip.rotation.x = 0.55 - dive * 1.5 + Math.sin(t - 0.4) * 0.10;
      L.foot.rotation.x = -0.7 + dive * 1.1;
    }
    tail.rotation.x = 0.30 + Math.sin(t - 0.8) * 0.12 + dive * 0.4;
    if (st.hurt) { torso.rotation.x -= 0.4; }
  };

  return finish(body, { height: 2.1 * S, radius: 0.75 * S, poolR: 0.8 * S, tick });
}

// ===========================================================================
// 3 — TOAD 蝦蟇 : squat body, breathing idle, and the tongue that does the work
// ===========================================================================
export function buildToad() {
  const S = 1.15;
  const body = new THREE.Group();
  const root = joint(body, 0, 0.30 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, ellipsoid(0.42 * S, 0.28 * S, 0.46 * S, 14), BLACK, { outline: true });
  // warty back: scattered lumps, the one texture cue a toad needs
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.12, 0.34) * S;
    part(torso, tGeo(new THREE.SphereGeometry(rand(0.03, 0.058) * S, 6, 5),
      { pos: [Math.cos(a) * r, 0.20 * S + rand(-0.03, 0.04) * S, Math.sin(a) * r] }), CHAR);
  }
  // head fused into the body, huge mouth line, heavy brow
  const head = joint(torso, 0, 0.05 * S, 0.34 * S);
  part(head, ellipsoid(0.30 * S, 0.20 * S, 0.20 * S, 12), BLACK, { outline: true, thickness: 0.012 });
  const jaw = joint(head, 0, -0.08 * S, -0.02 * S);
  part(jaw, tGeo(ellipsoid(0.28 * S, 0.09 * S, 0.19 * S, 10), { pos: [0, 0, 0.02 * S] }), CHAR);
  for (const s of [1, -1]) {
    // bulging eyes on top of the skull, with a heavy brow ridge over them
    const eye = joint(head, s * 0.155 * S, 0.145 * S, 0.02 * S);
    part(eye, new THREE.SphereGeometry(0.075 * S, 8, 6), CHAR);
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.042 * S, 10), glowMat().clone());
    iris.material.color.setHex(0x9fd08a);
    iris.material.opacity = 0.60;
    iris.position.set(s * 0.03 * S, 0.02 * S, 0.062 * S);
    iris.rotation.y = s * 0.4;
    eye.add(iris);
    part(head, tGeo(ellipsoid(0.10 * S, 0.045 * S, 0.09 * S, 8),
      { pos: [s * 0.155 * S, 0.20 * S, 0.01 * S] }), BLACK);
  }
  // THE TONGUE: a chain of shrinking links kept inside the mouth until fired
  const tongueLinks = [];
  let tongueRoot;
  {
    let host = tongueRoot = joint(jaw, 0, 0.03 * S, 0.16 * S);
    for (let i = 0; i < 10; i++) {
      const r = (0.052 - i * 0.0034) * S;
      part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, 0.30 * S), [r, r * 0.94], { radial: 6, hSeg: 2 }), 0x6a3a44);
      host = joint(host, 0, 0, 0.30 * S);
      tongueLinks.push(host);
    }
    // the tip pad that actually grabs
    part(host, ellipsoid(0.06 * S, 0.03 * S, 0.07 * S, 8), 0x7a444e);
  }
  // squat legs: rear ones folded and powerful, front ones short and planted
  const legs = [];
  for (const s of [1, -1]) {
    const rear = joint(torso, s * 0.30 * S, -0.16 * S, -0.20 * S);
    part(rear, tubeBetween(v3(0, 0, 0), v3(s * 0.12 * S, -0.02 * S, -0.16 * S), [0.10 * S, 0.06 * S], { radial: 7, hSeg: 2 }), BLACK);
    const shin = joint(rear, s * 0.12 * S, -0.02 * S, -0.16 * S);
    part(shin, tubeBetween(v3(0, 0, 0), v3(s * 0.03 * S, -0.20 * S, 0.10 * S), [0.055 * S, 0.038 * S], { radial: 6, hSeg: 2 }), BLACK);
    const foot = joint(shin, s * 0.03 * S, -0.20 * S, 0.10 * S);
    part(foot, tGeo(ellipsoid(0.07 * S, 0.024 * S, 0.11 * S, 8), { pos: [0, 0, 0.03 * S] }), CHAR);
    const front = joint(torso, s * 0.26 * S, -0.18 * S, 0.24 * S);
    part(front, tubeBetween(v3(0, 0, 0), v3(s * 0.03 * S, -0.14 * S, 0.03 * S), [0.052 * S, 0.036 * S], { radial: 6, hSeg: 2 }), BLACK);
    const hand = joint(front, s * 0.03 * S, -0.14 * S, 0.03 * S);
    part(hand, tGeo(ellipsoid(0.055 * S, 0.020 * S, 0.075 * S, 7), { pos: [0, 0, 0.025 * S] }), CHAR);
    legs.push({ rear, shin, foot, front, hand, side: s });
  }

  // ---- BREATHE / HOP / TONGUE ---------------------------------------------
  // The idle is all in the throat sac and the body swelling; the hop is a
  // short compress-and-launch. The tongue extends by scaling each link's
  // spacing, so it stays a chain rather than a stretched cylinder.
  let t = 0, hop = 0;
  const tick = (dt, st) => {
    t += dt * 2.0;
    const breathe = Math.sin(t) * 0.5 + 0.5;
    torso.scale.set(1 + breathe * 0.05, 1 - breathe * 0.03, 1 + breathe * 0.04);
    jaw.rotation.x = 0.04 + breathe * 0.05;
    head.rotation.x = -0.05 + breathe * 0.04;
    // hopping locomotion: it does not walk
    if ((st.speed ?? 0) > 0.4) hop += dt * 4.2; else hop = 0;
    const h = hop > 0 ? Math.max(0, Math.sin(hop)) : 0;
    root.position.y = 0.30 * S + h * 0.30 * S;
    torso.rotation.x = -h * 0.28;
    for (const L of legs) {
      L.rear.rotation.x = 0.2 - h * 1.0;
      L.shin.rotation.x = -0.5 + h * 1.2;
      L.front.rotation.x = -0.1 + h * 0.5;
    }
    // TONGUE: st.tongue is 0..1 reach. The ROOT joint has to be hidden too —
    // it carries the first tube, so leaving it visible parks a red stub in the
    // toad's mouth at all times.
    const reach = st.tongue ?? 0;
    tongueRoot.visible = reach > 0.02;
    tongueLinks.forEach((l, i) => {
      l.position.z = 0.30 * S * (0.02 + reach * 0.98);
      // a slight whipping curve so it does not read as a rod
      l.rotation.y = Math.sin(t * 5 + i * 0.5) * 0.05 * reach;
      l.rotation.x = Math.sin(t * 4 + i * 0.4) * 0.03 * reach;
      l.visible = reach > 0.02;
    });
    if (reach > 0.02) jaw.rotation.x = 0.75;
    if (st.hurt) torso.rotation.x -= 0.25;
  };

  return finish(body, { height: 0.85 * S, radius: 0.62 * S, poolR: 0.72 * S, tick, extras: { tongueLinks } });
}

// ===========================================================================
// 4 — GREAT SERPENT 大蛇 : a 16-link chain driven by a travelling sine
// ===========================================================================
export function buildGreatSerpent() {
  const S = 1.0;
  const LINKS = 16;
  const body = new THREE.Group();
  const root = joint(body, 0, 0.30 * S, 0);
  const links = [];
  let host = root;
  for (let i = 0; i < LINKS; i++) {
    const k = i / (LINKS - 1);
    // taper: thick behind the head, thinning to the tail
    const r = (0.19 - Math.pow(k, 1.5) * 0.16) * S * (i < 2 ? 0.9 + i * 0.06 : 1);
    const len = 0.34 * S;
    // canonical read: pale body with black banding down its length
    part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, -len), [r, r * 0.93], { radial: 9, hSeg: 2 }),
      i % 3 === 1 ? BLACK : PALE, { outline: i % 4 === 0, thickness: 0.012 });
    const next = joint(host, 0, 0, -len);
    links.push(next);
    host = next;
  }
  // head: a flat wedge, jaw, forehead mark
  const head = joint(root, 0, 0, 0.10 * S);
  part(head, tGeo(ellipsoid(0.19 * S, 0.13 * S, 0.26 * S, 10), { pos: [0, 0, 0.14 * S] }), PALE, { outline: true });
  const jaw = joint(head, 0, -0.06 * S, 0.10 * S);
  part(jaw, tGeo(ellipsoid(0.16 * S, 0.05 * S, 0.20 * S, 9), { pos: [0, 0, 0.13 * S] }), BLACK);
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.035 * S, 8), glowMat().clone());
    e.material.color.setHex(0xd8b06a);
    e.material.opacity = 0.62;
    e.position.set(s * 0.12 * S, 0.05 * S, 0.20 * S);
    e.rotation.y = s * 0.85;
    head.add(e);
    // fangs
    part(jaw, tGeo(coneSpike(0.016 * S, 0.075 * S, v3(), { radial: 4, hSeg: 2 }),
      { rot: [176, 0, 0], pos: [s * 0.06 * S, 0.05 * S, 0.20 * S] }), BONE);
  }
  const brow = joint(head, 0, 0.10 * S, 0.14 * S);
  brow.rotation.x = -0.5;
  dots(brow, 0.020 * S, 0.052 * S, MARK);

  // ---- SERPENTINE MOTION --------------------------------------------------
  // One sine travelling tail-ward along the chain. `st.coil` folds the wave
  // into a tightening spiral for the constriction, `st.rush` flattens it into
  // a straight ground-hugging charge.
  let t = 0;
  const tick = (dt, st) => {
    const rush = st.rush ?? 0, coil = st.coil ?? 0;
    t += dt * (2.6 + rush * 5.5 + (st.speed ?? 0) * 0.5);
    links.forEach((l, i) => {
      const k = i / (LINKS - 1);
      const wave = Math.sin(t - i * 0.55);
      // lateral undulation, damped near the head so it aims where it travels
      l.rotation.y = wave * (0.10 + 0.28 * k) * (1 - rush * 0.6) + coil * 0.34;
      // a little vertical roll keeps it from reading as a flat ribbon
      l.rotation.x = Math.cos(t * 0.9 - i * 0.4) * 0.045 * (1 - rush * 0.5) - coil * 0.10;
    });
    root.position.y = 0.30 * S + Math.sin(t * 1.4) * 0.05 - rush * 0.16 + coil * 0.55;
    root.rotation.x = -rush * 0.12;
    head.rotation.x = Math.sin(t * 1.2) * 0.06 - rush * 0.10;
    head.rotation.y = Math.sin(t * 0.8) * 0.10 * (1 - rush);
    jaw.rotation.x = 0.06 + (st.action === 'bite' ? Math.sin(st.actionK * Math.PI) * 0.8 : Math.sin(t * 0.6) * 0.04);
    if (st.hurt) head.rotation.x -= 0.3;
  };

  return finish(body, { height: 0.8 * S, radius: 0.7 * S, poolR: 0.9 * S, tick, extras: { links } });
}

// ===========================================================================
// 5 — MAX ELEPHANT 満象 : heavy plod, segmented trunk, the torrent
// ===========================================================================
export function buildMaxElephant() {
  const S = 1.9;                      // the biggest thing on the field by far
  const body = new THREE.Group();
  const root = joint(body, 0, 0.98 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, ellipsoid(0.52 * S, 0.50 * S, 0.72 * S, 14), BLACK, { outline: true, thickness: 0.018 });
  part(torso, tGeo(ellipsoid(0.44 * S, 0.42 * S, 0.30 * S, 12), { pos: [0, 0.06 * S, -0.55 * S] }), BLACK);

  // head: broad domed skull, big ears, tusks
  const neck = joint(torso, 0, 0.16 * S, 0.60 * S);
  const head = joint(neck, 0, 0.02 * S, 0.16 * S);
  part(head, ellipsoid(0.34 * S, 0.36 * S, 0.30 * S, 12), BLACK, { outline: true, thickness: 0.016 });
  part(head, tGeo(ellipsoid(0.26 * S, 0.16 * S, 0.12 * S, 10), { pos: [0, 0.26 * S, 0.04 * S] }), CHAR);  // domed brow
  for (const s of [1, -1]) {
    // ears: big flat fans, hinged so they can flick
    const ear = joint(head, s * 0.30 * S, 0.06 * S, -0.06 * S);
    part(ear, tGeo(ellipsoid(0.30 * S, 0.34 * S, 0.035 * S, 10), { pos: [s * 0.26 * S, -0.02 * S, -0.10 * S] }),
      CHAR, { outline: true, thickness: 0.014 });
    ear.name = 'ear' + (s > 0 ? 'L' : 'R');
    // eyes
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.045 * S, 8), glowMat().clone());
    e.material.color.setHex(0x8fb6d8);
    e.material.opacity = 0.60;
    e.position.set(s * 0.20 * S, 0.06 * S, 0.26 * S);
    e.rotation.y = s * 0.5;
    head.add(e);
    // TUSKS: long, curving forward and up
    part(head, tGeo(coneSpike(0.055 * S, 0.62 * S, v3(s * 0.10 * S, 0.28 * S, 0.16 * S), { radial: 6, hSeg: 4 }),
      { rot: [72, 0, s * 12], pos: [s * 0.17 * S, -0.22 * S, 0.22 * S] }), BONE, { outline: true, thickness: 0.012 });
  }
  const ears = [head.children.find(c => c.name === 'earL'), head.children.find(c => c.name === 'earR')].filter(Boolean);

  // TRUNK: eight links, tapering, hung off the front of the skull
  const trunk = [];
  {
    let host = joint(head, 0, -0.14 * S, 0.28 * S);
    for (let i = 0; i < 8; i++) {
      const r = (0.115 - i * 0.010) * S;
      part(host, tubeBetween(v3(0, 0, 0), v3(0, -0.17 * S, 0), [r, r * 0.92], { radial: 8, hSeg: 2 }), BLACK);
      host = joint(host, 0, -0.17 * S, 0);
      trunk.push(host);
    }
  }

  // legs: four columns, no visible knee — mass over articulation
  const legs = [];
  for (const s of [1, -1]) {
    for (const z of [0.36 * S, -0.42 * S]) {
      const hip = joint(torso, s * 0.34 * S, -0.34 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.34 * S, 0), [0.17 * S, 0.15 * S], { radial: 9, hSeg: 2 }), BLACK, { outline: true, thickness: 0.014 });
      const knee = joint(hip, 0, -0.34 * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.30 * S, 0), [0.15 * S, 0.16 * S], { radial: 9, hSeg: 2 }), BLACK);
      const foot = joint(knee, 0, -0.30 * S, 0);
      part(foot, tGeo(ellipsoid(0.18 * S, 0.07 * S, 0.19 * S, 9), { pos: [0, -0.02 * S, 0.01 * S] }), CHAR);
      legs.push({ hip, knee, foot, front: z > 0, side: s });
    }
  }
  // small tail
  const tail = joint(torso, 0, 0.18 * S, -0.78 * S);
  part(tail, tubeBetween(v3(0, 0, 0), v3(0, -0.34 * S, -0.06 * S), [0.045 * S, 0.022 * S], { radial: 6, hSeg: 2 }), BLACK);

  // ---- HEAVY PLOD + TORRENT ------------------------------------------------
  // Slow diagonal walk with a long ground-contact phase; every footfall gets a
  // pronounced settle so the mass reads. `st.torrent` raises the trunk and
  // curls it back for the water.
  let t = 0;
  const tick = (dt, st) => {
    t += dt * (1.5 + Math.min(1, (st.speed ?? 0) / 2.5) * 2.0);
    const tor = st.torrent ?? 0;
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI) + (L.side > 0 ? 0 : Math.PI));
      const sw = Math.sin(ph);
      const lift = Math.max(0, sw);
      L.hip.rotation.x = sw * 0.24 * (L.front ? 1 : -0.9);
      L.knee.rotation.x = -lift * 0.34;
      L.foot.rotation.x = lift * 0.18;
    }
    root.position.y = 0.98 * S - Math.abs(Math.sin(t)) * 0.035 * S;
    torso.rotation.z = Math.sin(t) * 0.035;
    torso.rotation.x = -0.02 + Math.sin(t * 2) * 0.02;
    ears.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * (0.2 + Math.sin(t * 0.8 + i) * 0.30); });
    neck.rotation.x = -0.05 - tor * 0.55;
    head.rotation.x = Math.sin(t * 0.9) * 0.05 - tor * 0.30;
    // trunk: hangs and sways at rest, whips up and back for the torrent
    trunk.forEach((l, i) => {
      const k = i / 7;
      l.rotation.x = (0.10 + Math.sin(t * 1.3 - i * 0.35) * 0.09) * (1 - tor)
        - tor * (1.05 - k * 0.55);
      l.rotation.z = Math.sin(t * 0.9 - i * 0.3) * 0.07 * (1 - tor);
    });
    tail.rotation.z = Math.sin(t * 1.1) * 0.18;
    if (st.hurt) { torso.rotation.x -= 0.12; head.rotation.x -= 0.2; }
  };

  return finish(body, {
    height: 2.5 * S, radius: 1.25 * S, poolR: 1.5 * S, tick,
    extras: { trunk, trunkTip: trunk[trunk.length - 1] }
  });
}

// ===========================================================================
// 6 — RABBIT ESCAPE 兎 : one instanced mesh carrying the whole swarm
// ===========================================================================
// The individual rabbit is deliberately plain — the design is the NUMBER. One
// InstancedMesh means a swarm of two dozen costs a single draw call, which is
// what makes this affordable on the big maps.
export function buildRabbitSwarm(count = 22) {
  const S = 0.42;
  const geos = [];
  geos.push(tGeo(ellipsoid(0.24 * S, 0.22 * S, 0.34 * S, 8), { pos: [0, 0.24 * S, 0] }));           // body
  geos.push(tGeo(ellipsoid(0.16 * S, 0.16 * S, 0.17 * S, 8), { pos: [0, 0.40 * S, 0.26 * S] }));    // head
  for (const s of [1, -1]) {                                                                          // ears
    geos.push(tGeo(coneSpike(0.055 * S, 0.46 * S, v3(s * 0.06 * S, 0, -0.05 * S), { radial: 4, hSeg: 3, zScale: 0.45 }),
      { pos: [s * 0.07 * S, 0.48 * S, 0.20 * S], rot: [-10, 0, s * 9] }));
    geos.push(tGeo(ellipsoid(0.07 * S, 0.09 * S, 0.09 * S, 6), { pos: [s * 0.15 * S, 0.13 * S, -0.16 * S] })); // haunch
  }
  geos.push(tGeo(new THREE.SphereGeometry(0.10 * S, 6, 5), { pos: [0, 0.28 * S, -0.32 * S] }));      // tail

  // mergeGeometries refuses a set whose attributes disagree, and the toolkit
  // mixes sphere-derived geometry (position/normal/uv) with cone-derived
  // geometry (position/normal). Strip uv first or the merge silently returns
  // null and the swarm never builds.
  for (const g of geos) for (const k of ['uv', 'uv1', 'uv2']) if (g.getAttribute(k)) g.deleteAttribute(k);
  const merged = mergeGeos(geos);
  colored(merged, BLACK);

  const mesh = new THREE.InstancedMesh(merged, shikigamiMaterial(), count);
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const body = new THREE.Group();
  body.add(mesh);

  // each rabbit gets its own heading, speed and hop phase
  const units = Array.from({ length: count }, (_, i) => ({
    x: 0, z: 0, y: 0, yaw: (i / count) * Math.PI * 2 + rand(-0.3, 0.3),
    sp: rand(3.2, 6.4), ph: rand(0, Math.PI * 2), alive: true
  }));

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1);
  let t = 0;
  const tick = (dt, st) => {
    t += dt;
    const spread = st.spread ?? 1;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      // flood outward from the summon point, then mill about
      const drive = Math.max(0.25, 1 - t * 0.5);
      u.x += Math.sin(u.yaw) * u.sp * drive * dt;
      u.z += Math.cos(u.yaw) * u.sp * drive * dt;
      u.yaw += Math.sin(t * 2.2 + i) * dt * 1.4;
      const hop = Math.abs(Math.sin(t * 7 + u.ph));
      u.y = hop * 0.34;
      e.set(-hop * 0.5, u.yaw, 0);
      q.setFromEuler(e);
      const s = u.alive ? spread : 0.001;
      sc.set(s, s, s);
      m4.compose({ x: u.x, y: u.y, z: u.z }, q, sc);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  return finish(body, { height: 0.5, radius: 3.0, poolR: 1.4, tick, extras: { units, mesh } });
}

export const SHIKIGAMI_BUILDERS = {
  divineDogs: () => buildDivineDog(false),   // the pair is built as two bodies
  divineDogWhite: () => buildDivineDog(true),
  nue: buildNue,
  toad: buildToad,
  serpent: buildGreatSerpent,
  elephant: buildMaxElephant,
  rabbits: buildRabbitSwarm
};
