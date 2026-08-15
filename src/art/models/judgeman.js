// JUDGEMAN 審判 — Higuruma's shikigami.
//
// ======================== REFERENCE NOTES ================================
// Researched against the Jujutsu Kaisen Wiki's Judgeman page and the
// character summaries around it (see the deliverable write-up for sources).
// What the reference actually says, and what is modelled here:
//
//   · "A large dark mass with a shape similar to the SCALES OF JUSTICE, with
//     a scale on each side of its body."  -> a dark hanging column with a
//     crossbeam through its shoulders and a shallow pan slung on chains from
//     each end. The pans are the read; everything else is a shadow holding
//     them up.
//   · "A WHITE, MASK-LIKE FACE with its EYES SEWN SHUT, to represent
//     impartiality — Lady Justice's blindfold."  -> a bone-white oval plate
//     with two stitched lash-lines and cross-stitches through them. No mouth,
//     no pupils. It is the only bright thing on the model and it is what makes
//     him instantly identifiable at gameplay distance.
//   · He sides with NEITHER party. He is not a bodyguard and he does not
//     attack — in this game he files evidence and can be destroyed for it.
//
// FAMILY: he is built in the same shadow-construct language as Megumi's Ten
// Shadows (src/art/models/shikigami.js) and shares their material instance —
// near-black values, one hard cool rim (#8fb6d8) doing the shape reading, a
// shadow pool underneath, the same rise-out-of-the-floor reveal. That is a
// deliberate consistency call: a shikigami is a shikigami whoever cast it.
// What separates him from Megumi's set is that none of them are symmetrical
// architecture and he is nothing else.
//
// SCALE: 1.15 m of body hovering ~0.45 m off the floor — head height on a
// crouching person, clearly a construct rather than a fighter.
// =========================================================================
import * as THREE from 'three';
import { shikigamiMaterial } from './shikigami.js';
import { makeOutline } from '../shaders/outline.js';
import { tubeBetween, roundBox, tGeo } from '../builders/geo.js';
import { v3 } from '../../core/mathutil.js';

const BLACK = 0x171b28;   // the default construct value
const CHAR = 0x252b3c;    // a half-step up, for overlapping masses
const BONE = 0xaab4c4;    // the mask
const STITCH = 0x0c0f16;  // the sewn eyes
const MARK = 0x6f8fa8;    // rim-coloured glyph work

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
function part(parent, geo, color, { outline = false, thickness = 0.012 } = {}) {
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
function shadowPool(radius) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 22),
    new THREE.MeshBasicMaterial({ color: 0x04050a, transparent: true, opacity: 0.86, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.94, radius * 1.06, 24),
    new THREE.MeshBasicMaterial({
      color: 0x8fb6d8, transparent: true, opacity: 0.42,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(disc, ring);
  g.renderOrder = 2;
  return g;
}

export function buildJudgeman() {
  const S = 1.0;
  const H = 1.15 * S;            // body height
  const HOVER = 0.45 * S;        // how far off the floor the mass sits

  const body = new THREE.Group();
  const root = joint(body, 0, HOVER, 0);

  // ---- the column: a robed mass that never quite reaches the ground --------
  // Three overlapping ellipsoids so it reads as one hanging shape rather than
  // stacked beads, tapering to a point underneath.
  const core = joint(root, 0, 0.42 * S, 0);
  part(core, ellipsoid(0.20 * S, 0.30 * S, 0.17 * S, 14), BLACK, { outline: true, thickness: 0.016 });
  part(core, tGeo(ellipsoid(0.235 * S, 0.20 * S, 0.20 * S, 14), { pos: [0, 0.16 * S, 0] }), CHAR);
  part(core, tGeo(ellipsoid(0.15 * S, 0.26 * S, 0.13 * S, 12), { pos: [0, -0.30 * S, 0] }), BLACK, { outline: true });
  // the taper: a long thin drip of shadow instead of feet
  part(core, tubeBetween(v3(0, -0.44 * S, 0), v3(0, -0.80 * S, 0.02 * S),
    [0.085 * S, 0.006 * S], { radial: 9, hSeg: 4 }), BLACK);
  // vestigial mantle: two shoulder folds that give the column a top
  for (const s of [1, -1]) {
    part(core, tGeo(ellipsoid(0.11 * S, 0.055 * S, 0.10 * S, 9),
      { rot: [0, 0, s * -16], pos: [s * 0.19 * S, 0.235 * S, 0] }), CHAR);
  }

  // ---- the face: the one bright thing on him ------------------------------
  const head = joint(core, 0, 0.30 * S, 0.06 * S);
  // hood: the shadow closing around the plate, so the mask reads as set INTO
  // the mass rather than stuck on the front of it
  part(head, tGeo(ellipsoid(0.145 * S, 0.155 * S, 0.135 * S, 12), { pos: [0, 0, -0.03 * S] }), BLACK, { outline: true });
  const maskGeo = ellipsoid(0.105 * S, 0.135 * S, 0.055 * S, 14);
  part(head, tGeo(maskGeo, { pos: [0, 0, 0.075 * S] }), BONE, { outline: true, thickness: 0.010 });
  // EYES SEWN SHUT: two flat closed lash lines with cross-stitches through
  // them. Slightly proud of the plate so the outline pass does not eat them.
  for (const s of [1, -1]) {
    const ex = s * 0.045 * S;
    part(head, tGeo(roundBox(0.052 * S, 0.008 * S, 0.006 * S, 0.002),
      { rot: [0, 0, s * -7], pos: [ex, 0.022 * S, 0.128 * S] }), STITCH);
    for (let i = -1; i <= 1; i++) {
      part(head, tGeo(roundBox(0.005 * S, 0.026 * S, 0.005 * S, 0.0015),
        { rot: [0, 0, s * 30], pos: [ex + i * 0.017 * S, 0.022 * S, 0.130 * S] }), STITCH);
    }
  }
  // the brow glyph — rim-coloured, the same visual grammar as Nue's and the
  // Great Serpent's forehead marks
  part(head, tGeo(roundBox(0.036 * S, 0.006 * S, 0.005 * S, 0.002),
    { pos: [0, 0.085 * S, 0.126 * S] }), MARK);

  // ---- THE SCALES: one on each side --------------------------------------
  // A crossbeam through the shoulders on its own pivot (so the whole balance
  // can tip), three chains per side, and a shallow pan slung under each.
  const beam = joint(core, 0, 0.20 * S, 0.06 * S);
  part(beam, tGeo(roundBox(0.86 * S, 0.030 * S, 0.030 * S, 0.008), {}), CHAR, { outline: true, thickness: 0.010 });
  // the fulcrum knot where the beam passes through the body
  part(beam, ellipsoid(0.055 * S, 0.055 * S, 0.055 * S, 9), BLACK);
  const pans = [];
  for (const s of [1, -1]) {
    const arm = joint(beam, s * 0.42 * S, 0, 0);
    // the ring the chains hang from
    const ring = new THREE.Mesh(colored(new THREE.TorusGeometry(0.028 * S, 0.008 * S, 6, 12), MARK), shikigamiMaterial());
    ring.rotation.y = Math.PI / 2;
    ring.position.y = -0.022 * S;
    arm.add(ring);
    // the pan hangs on its OWN pivot under the beam end, so it stays level
    // while the beam tips — which is what a real balance does and what makes
    // the tilt read at a glance.
    const hang = joint(arm, 0, -0.05 * S, 0);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      part(hang, tubeBetween(v3(0, 0, 0),
        v3(Math.cos(a) * 0.105 * S, -0.20 * S, Math.sin(a) * 0.105 * S),
        [0.006 * S, 0.005 * S], { radial: 5, hSeg: 2 }), MARK);
    }
    // shallow dish: a squashed hemisphere with a lipped rim
    const pan = joint(hang, 0, -0.21 * S, 0);
    const dish = ellipsoid(0.125 * S, 0.045 * S, 0.125 * S, 14);
    part(pan, dish, CHAR, { outline: true, thickness: 0.010 });
    const lip = new THREE.Mesh(colored(new THREE.TorusGeometry(0.122 * S, 0.010 * S, 6, 20), BLACK), shikigamiMaterial());
    lip.rotation.x = Math.PI / 2;
    pan.add(lip);
    pans.push({ arm, hang, pan, side: s });
  }

  // ---- reveal / tick ------------------------------------------------------
  const group = new THREE.Group();
  const pool = shadowPool(0.42);
  group.add(pool, body);

  let reveal = 0;
  let t = 0;
  const api = {
    group, body, pool, height: H + HOVER, radius: 0.42,
    setReveal(k) {
      reveal = Math.max(0, Math.min(1, k));
      const e = reveal * reveal * (3 - 2 * reveal);
      body.position.y = (e - 1) * (H + HOVER) * 1.05;
      body.scale.setScalar(0.62 + e * 0.38);
      pool.scale.setScalar(0.5 + e * 0.7);
      pool.children[1].material.opacity = 0.18 + (1 - e) * 0.5;
    },
    get reveal() { return reveal; },
    // `tilt` is -1..1: the balance leaning toward the party the evidence is
    // piling up against. `hurt` throws the whole thing off its axis for a beat.
    tick(dt, state = {}) {
      t += dt;
      const tilt = Math.max(-1, Math.min(1, state.tilt ?? 0));
      const hurt = state.hurt ? 1 : 0;
      // slow hover + a drift that never repeats on the same period
      core.position.y = 0.42 * S + Math.sin(t * 1.15) * 0.05 + Math.sin(t * 0.43) * 0.02;
      core.rotation.z = Math.sin(t * 0.7) * 0.045 + hurt * 0.25;
      core.rotation.y = Math.sin(t * 0.31) * 0.10;
      // the head tracks nothing — the eyes are sewn shut — but it settles
      head.rotation.x = Math.sin(t * 0.9) * 0.05 - 0.04;
      // THE BALANCE: the beam tips toward the guilty side and the pans swing
      // to catch up, with the lag a real balance has.
      const want = tilt * 0.42;
      beam.rotation.z += (want - beam.rotation.z) * Math.min(1, dt * 2.2);
      beam.rotation.z += Math.sin(t * 2.1) * 0.006;
      for (const p of pans) {
        // pans stay level: cancel the beam's rotation, then let them swing
        p.hang.rotation.z = -beam.rotation.z + Math.sin(t * 2.6 + p.side) * 0.07 * (1 + hurt * 2);
        p.pan.position.y = Math.sin(t * 2.6 + p.side * 1.3) * 0.012;
      }
    }
  };
  api.setReveal(0);
  return api;
}
