// TRANSFIGURED HUMANS 改造人間 — Mahito's victims, as a SET of designs.
//
// ======================== SHARED REFERENCE SHEET =========================
// Researched against the Jujutsu Kaisen Wiki's Transfigured Human and Idle
// Transfiguration pages and the Shibuya / Meiji-Jingumae station sequences.
// All geometry, texture and animation below is original and procedural.
//
// WHAT THEY ACTUALLY ARE, and every clause here is a modelling instruction:
//
//   · "As the shape of the body is dependent on the shape of the soul... Mahito
//     can freely twist their soul into any shape he desires to morph them into
//     a GROTESQUE CREATURE THAT IS UNRECOGNIZABLE FROM THEIR ORIGINAL
//     APPEARANCE." So: not a human with lumps. A body reassembled wrongly.
//
//   · "Transfigured humans can come in ALL KINDS OF SHAPES AND SIZES; the
//     LARGEST one Mahito has created is MORE THAN TWICE AS TALL AS HIMSELF and
//     is EXTREMELY OBESE, while the smallest is roughly the size of Junpei
//     Yoshino's palm." That range is why this is a SET rather than one model
//     with jitter — the variance the design has is between BODY PLANS, not in
//     the scale slider.
//
//   · "Despite appearing like cursed spirits, TRANSFIGURED HUMANS STILL POSSESS
//     HUMAN BODIES." This is the single best detail in the reference and it is
//     the one the old model missed entirely. NANAMI WORKED OUT WHAT THEY WERE
//     BECAUSE ONE OF THEM WAS STILL WEARING A WATCH. So every variant here
//     carries one surviving human artefact — a wristwatch, a shoe, a shirt
//     collar, a belt — sitting on anatomy that has no business having it. It is
//     what makes them read as PEOPLE rather than as monsters, which is the
//     whole horror of the technique.
//
//   · "The 'sweat' of a human's soul 'trickles out' every now and then, causing
//     them to PARTIALLY REGAIN CONSCIOUSNESS AND CRY, PLEAD FOR HELP, OR ASK
//     FOR DEATH." Modelled as the SURFACING beat: at intervals the creature
//     stops, the wrong anatomy goes slack, and a human face pushes up through
//     the flesh for a second. Driven by `st.surface`.
//
//   · Most rank around grade 3 to weak grade 2 — they lose to any real
//     sorcerer. Nothing here is meant to look dangerous. It is meant to look
//     WRONG.
//
// THE MATERIAL FAMILY. All five share the flesh archetype from
// textures/creature.js with SEAMS drawn into the texture — the same stitched
// join language Mahito's own patchwork body uses (the sorcerers literally call
// him "Patchface"), so they read as HIS work rather than as generic mutants.
// Skin tones are deliberately MISMATCHED within a single body: an arm from one
// palette against a torso from another, because a soul reassembled out of
// order does not come back one colour.
//
// THE RIGS. Five body plans, five hierarchies, five animators. A three-armed
// torso walking on its hands and a creature folded backwards at the waist
// cannot share a skeleton and are not asked to. Each builder returns the same
// small interface the shikigami use — { group, height, radius, setReveal,
// tick } — so combat/minion.js drives any of them through one path.
//
// PER-VARIANT:
//   SPLAYED  多肢 — no legs. A torso with SIX ARMS, walking on its knuckles
//            like a spider. Human hands, still human, at the ends. Artefact: a
//            WRISTWATCH on one of the walking arms.
//   BENT     折躯 — folded backwards at the waist so the spine is inverted; it
//            travels face-up on all fours with the head hanging behind and
//            dragging. Artefact: a SHOE, still laced, on one foot.
//   TOWER    満身 — the big one. Twice a man's height and grossly swollen, with
//            vestigial arms buried in the mass and THREE FACES fused into the
//            torso at different heights. Artefact: a BELT, buried in a fold.
//   MAW      裂胸 — the head has sunk into the shoulders and the entire chest
//            has opened into a mouth with human teeth. Arms far too long,
//            dragging. Artefact: a SHIRT COLLAR around the sunken neck.
//   STILT    長脚 — inverted proportions: a tiny compressed torso on two
//            enormously long thin legs, with the head hanging BELOW the
//            shoulders on a stretched neck. Artefact: a TIE, hanging past the
//            head.
// =========================================================================
import * as THREE from 'three';
import { tubeBetween, coneSpike, roundBox, tGeo } from '../builders/geo.js';
import { v3, rand, randPick } from '../../../core/math.js';
import { toonMaterial } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { bakeStatic, collectOutlines, applyLOD } from '../builders/bake.js';
import {
  projectUV, dermis, glow, voidMat, fleshTex, maskTex, boneMat, FLESH_RIM
} from '../textures/creature.js';

// ---------------------------------------------------------------------------
// the shared flesh palette
// ---------------------------------------------------------------------------
// MISMATCHED ON PURPOSE. A transfigured body is reassembled out of order, so
// each build draws two or three tones from this list and puts them on adjacent
// masses. The tones are all plausible human skin pushed slightly wrong —
// jaundiced, bloodless, bruised — rather than monster colours.
// The first pass drew all six from one narrow band of warm pink and the
// mismatching was invisible on the model — a body reassembled out of order
// has to look reassembled. The spread is widened in VALUE (a bloodless
// near-white against a congested near-brown) as well as in hue, because a cel
// shader separates values far more readably than it separates hues.
const TONES = [
  { base: '#d8c6b6', a: '#ab9585', b: '#bda294' },   // bloodless, the lightest
  { base: '#8f7466', a: '#665047', b: '#7a5f55' },   // congested, the darkest
  { base: '#b7ae8c', a: '#8a8163', b: '#9b9270' },   // jaundiced, green-yellow
  { base: '#c2a0a6', a: '#8f6f78', b: '#a67f8a' },   // bruised, mauve
  { base: '#a3a094', a: '#7a786d', b: '#8b887c' },   // grey, drained of colour
  { base: '#cf9c86', a: '#a06f5e', b: '#b5806c' }    // flushed, over-perfused
];
const SEAM = '#6b3f44';

let _toneN = 0;
function fleshMat(seed, { seams = 5, veins = 10, bloom = null } = {}) {
  const t = TONES[seed % TONES.length];
  return dermis(fleshTex('tf' + seed + seams + veins + (bloom ?? ''), {
    base: t.base, blotchA: t.a, blotchB: t.b, seam: SEAM, seams, veins, bloom
  }), { rimColor: FLESH_RIM, rim: 0.34, rimStart: 0.64, gloss: 0.28 });
}

// ---------------------------------------------------------------------------
// small helpers, shared across the five plans
// ---------------------------------------------------------------------------
function joint(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function part(parent, geo, mat, { outline = false, thickness = 0.011, uv = 'auto', uvScale = [1, 1] } = {}) {
  if (uv !== 'keep') {
    if (uv === 'auto') { if (!geo.getAttribute('uv')) projectUV(geo, 'cylY', { scale: uvScale }); }
    else projectUV(geo, uv, { scale: uvScale });
  }
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  if (outline) parent.add(makeOutline(mesh, { color: 0x14090c, thickness }));
  return mesh;
}
function blob(rx, ry, rz, seg = 10) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 2));
  g.scale(rx, ry, rz);
  g.computeVertexNormals();
  return g;
}

// A HUMAN FACE, pushed into a surface. The single most important shared piece
// in this file: it is what makes a lump of meat read as a person. Built flat
// and slightly proud of the host so it can be faded in and out by the
// "surfacing" beat — eyes, a nose ridge, and an open mouth.
function humanFace(host, size, { pos = [0, 0, 0], rot = [0, 0, 0], tone = '#b09284' } = {}) {
  const g = joint(host, pos[0], pos[1], pos[2]);
  g.rotation.set(rot[0], rot[1], rot[2]);
  const mat = dermis(fleshTex('face' + tone, {
    base: tone, blotchA: '#8a6f64', blotchB: '#9c7d78', seam: SEAM, seams: 2, veins: 5
  }), { rimColor: FLESH_RIM, rim: 0.30, rimStart: 0.66 });
  part(g, tGeo(blob(size * 0.5, size * 0.62, size * 0.30, 12), { pos: [0, 0, 0] }), mat);
  // brow ridge and nose — the two forms that make a blank oval read as a face
  part(g, tGeo(blob(size * 0.34, size * 0.07, size * 0.10, 8), { pos: [0, size * 0.18, size * 0.24] }), mat);
  part(g, tGeo(blob(size * 0.08, size * 0.16, size * 0.12, 7), { pos: [0, size * 0.02, size * 0.28] }), mat);
  const eyes = [];
  for (const s of [1, -1]) {
    const socket = new THREE.Mesh(new THREE.CircleGeometry(size * 0.13, 10), voidMat(0x120b0d));
    socket.position.set(s * size * 0.18, size * 0.10, size * 0.26);
    g.add(socket);
    const e = new THREE.Mesh(new THREE.SphereGeometry(size * 0.10, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xe8e2d8 }));
    e.position.set(s * size * 0.18, size * 0.10, size * 0.24);
    g.add(e);
    const p = new THREE.Mesh(new THREE.CircleGeometry(size * 0.045, 8), voidMat(0x0e0a0c));
    p.position.set(s * size * 0.18, size * 0.10, size * 0.315);
    g.add(p);
    eyes.push(e);
  }
  // THE MOUTH, open. It is always open — they are, per the reference, crying
  // or pleading or asking to die.
  const mouth = joint(g, 0, -size * 0.24, size * 0.22);
  const cavity = new THREE.Mesh(new THREE.SphereGeometry(size * 0.17, 10, 8), voidMat(0x1c0d10));
  cavity.scale.set(1, 0.7, 0.5);
  mouth.add(cavity);
  const teeth = boneMat(maskTex('tfTeeth', { base: '#ded4c0', crack: '#a89a84', stain: '#c2b49c' }));
  for (let i = -2; i <= 2; i++) {
    part(mouth, tGeo(roundBox(size * 0.05, size * 0.06, size * 0.03, size * 0.008),
      { pos: [i * size * 0.06, size * 0.08, size * 0.10] }), teeth);
  }
  return { group: g, mouth, eyes };
}

// A HUMAN ARTEFACT — the watch, the shoe, the collar, the belt, the tie. The
// Nanami detail: these are still people, and the giveaway is the thing they
// were wearing when it happened. Built in cloth/metal values that read as
// MANUFACTURED against everything else on the body being meat.
function artefact(host, kind, S, { pos = [0, 0, 0], rot = [0, 0, 0] } = {}) {
  const g = joint(host, pos[0], pos[1], pos[2]);
  g.rotation.set(rot[0], rot[1], rot[2]);
  const cloth = toonMaterial({
    vertexColors: false, color: 0x2a2e3a, steps: [56, 128, 210], rim: 0.28, rimStart: 0.70, rimColor: 0x8b9bab
  });
  const leather = toonMaterial({
    vertexColors: false, color: 0x1b1512, steps: [50, 120, 200], rim: 0.30, rimStart: 0.68, rimColor: 0x8b9bab
  });
  const steel = toonMaterial({
    vertexColors: false, color: 0xb8bcc6, steps: [60, 150, 255], rim: 0.62, rimStart: 0.58, gloss: 0.7, rimColor: 0xdfe8f4
  });
  switch (kind) {
    case 'watch': {
      // a strap round the limb and a small bright dial — the actual clue
      const band = new THREE.Mesh(new THREE.TorusGeometry(S * 0.055, S * 0.014, 6, 16), leather);
      band.rotation.x = Math.PI / 2;
      g.add(band);
      const face = new THREE.Mesh(new THREE.CylinderGeometry(S * 0.030, S * 0.030, S * 0.010, 12), steel);
      face.rotation.set(Math.PI / 2, 0, 0);
      face.position.z = S * 0.055;
      g.add(face);
      const dial = new THREE.Mesh(new THREE.CircleGeometry(S * 0.022, 12),
        new THREE.MeshBasicMaterial({ color: 0xe8e4d8 }));
      dial.position.z = S * 0.061;
      g.add(dial);
      const hand = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.004, S * 0.018), voidMat(0x14100c));
      hand.position.set(0, S * 0.008, S * 0.062);
      g.add(hand);
      break;
    }
    case 'shoe': {
      const sole = new THREE.Mesh(tGeo(roundBox(S * 0.10, S * 0.035, S * 0.22, S * 0.012), {}), leather);
      g.add(sole);
      const upper = new THREE.Mesh(tGeo(blob(S * 0.048, S * 0.045, S * 0.075, 9), { pos: [0, S * 0.035, -S * 0.03] }), leather);
      g.add(upper);
      for (let i = 0; i < 3; i++) {
        const lace = new THREE.Mesh(new THREE.PlaneGeometry(S * 0.075, S * 0.008),
          new THREE.MeshBasicMaterial({ color: 0xcfc8ba, side: THREE.DoubleSide }));
        lace.position.set(0, S * (0.052 + i * 0.012), -S * (0.01 + i * 0.022));
        lace.rotation.x = -0.5;
        g.add(lace);
      }
      break;
    }
    case 'collar': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(S * 0.12, S * 0.022, 6, 18), cloth);
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1, 1, 0.6);
      g.add(ring);
      for (const s of [1, -1]) {
        const point = new THREE.Mesh(tGeo(roundBox(S * 0.05, S * 0.012, S * 0.075, S * 0.006),
          { pos: [s * S * 0.045, -S * 0.01, S * 0.075], rot: [18, 0, s * 14] }), cloth);
        g.add(point);
      }
      break;
    }
    case 'belt': {
      const band = new THREE.Mesh(new THREE.TorusGeometry(S * 0.30, S * 0.026, 6, 22), leather);
      band.rotation.x = Math.PI / 2;
      band.scale.set(1, 1, 0.85);
      g.add(band);
      const buckle = new THREE.Mesh(tGeo(roundBox(S * 0.075, S * 0.065, S * 0.014, S * 0.006), {}), steel);
      buckle.position.z = S * 0.26;
      g.add(buckle);
      break;
    }
    case 'tie': {
      const knot = new THREE.Mesh(tGeo(roundBox(S * 0.045, S * 0.045, S * 0.028, S * 0.008), {}), cloth);
      g.add(knot);
      const blade = new THREE.Mesh(tGeo(roundBox(S * 0.055, S * 0.34, S * 0.012, S * 0.005),
        { pos: [0, -S * 0.20, S * 0.008] }), cloth);
      g.add(blade);
      const tip = new THREE.Mesh(tGeo(coneSpike(S * 0.030, S * 0.06, v3(), { radial: 4, hSeg: 2, zScale: 0.25 }),
        { rot: [0, 0, 180], pos: [0, -S * 0.37, S * 0.008] }), cloth);
      g.add(tip);
      break;
    }
  }
  return g;
}

// Every variant ends here. Same contract as the shikigami models so
// combat/minion.js drives all five through one path — plus `surfaceRate`,
// which is how often the human inside gets to the surface.
function finish(group, { height, radius, tick, variant, surfaceRate = 6.5, extras = {} }) {
  // the same static bake the shikigami get — a transfigured human is a hundred
  // small rigid masses on a dozen joints, and merging them per joint costs
  // nothing and removes most of the draw calls. See builders/bake.js.
  bakeStatic(group);
  const hulls = collectOutlines(group);
  let reveal = 0;
  const api = {
    group, height, radius, variant, extras, surfaceRate, hulls,
    setLOD(dist) { applyLOD(hulls, dist); },
    // A transfigured human does NOT rise out of a shadow — it is not a
    // shikigami and it must not share that read. It comes up out of the FLOOR:
    // it claws its way out, so the reveal is a vertical emergence with the body
    // still full size rather than an inflation.
    //
    // It publishes an OFFSET rather than writing group.position.y itself,
    // because the entity re-places the group from its world position every
    // frame and would otherwise stamp on it. The caller adds `revealOffset`.
    revealOffset: -height * 0.9,
    setReveal(k) {
      reveal = Math.max(0, Math.min(1, k));
      const e = reveal * reveal * (3 - 2 * reveal);
      api.revealOffset = (e - 1) * height * 0.9;
      group.visible = reveal > 0.001;
    },
    get reveal() { return reveal; },
    tick
  };
  api.setReveal(0);
  return api;
}

// ===========================================================================
// 1 — SPLAYED 多肢 : no legs, six arms, walks on its knuckles
// ===========================================================================
export function buildSplayed() {
  const S = 1.35;
  const g = new THREE.Group();
  const A = fleshMat(0, { seams: 7, veins: 14 });
  const B = fleshMat(2, { seams: 5, veins: 10 });
  const C = fleshMat(4, { seams: 4, veins: 8 });

  // A torso hanging in the middle of a ring of arms, sternum-down. There is no
  // pelvis and there are no legs — the ribcage simply stops.
  const root = joint(g, 0, 0.72 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, blob(0.22 * S, 0.20 * S, 0.26 * S, 14), A, { outline: true, uvScale: [2, 2] });
  part(torso, tGeo(blob(0.17 * S, 0.14 * S, 0.16 * S, 11), { pos: [0, -0.16 * S, -0.04 * S] }), B, { uvScale: [2, 2] });
  // the stump where the hips ended: a puckered seam, not a wound
  part(torso, tGeo(blob(0.11 * S, 0.07 * S, 0.10 * S, 9), { pos: [0, -0.27 * S, -0.05 * S] }), C);

  // THE HEAD is pushed forward off the sternum on almost no neck, so it looks
  // down at the ground it is crawling over.
  const neck = joint(torso, 0, 0.10 * S, 0.16 * S);
  const head = joint(neck, 0, 0.06 * S, 0.06 * S);
  part(head, blob(0.115 * S, 0.125 * S, 0.115 * S, 12), A, { outline: true, uvScale: [2, 2] });
  const face = humanFace(head, 0.20 * S, { pos: [0, -0.01 * S, 0.075 * S] });

  // SIX ARMS in a ring. Four are load-bearing (they walk on them), two are
  // vestigial and held up against the chest — which is the detail that makes
  // the plan read as wrong rather than as "a spider".
  const arms = [];
  // The walking arms are SPLAYED WIDE — the shoulder ring is pushed out and
  // each arm is rolled outward at its root, so the four of them form a stance
  // rather than hanging under the body. Without that roll the plan read as a
  // man stooping instead of as a torso being carried by hands.
  const RING = [
    { a: -0.70, walk: true, roll: -0.55 }, { a: 0.70, walk: true, roll: 0.55 },
    { a: -2.30, walk: true, roll: -0.60 }, { a: 2.30, walk: true, roll: 0.60 },
    { a: -1.45, walk: false, roll: -0.10 }, { a: 1.45, walk: false, roll: 0.10 }
  ];
  RING.forEach((cfg, i) => {
    const side = Math.sign(cfg.a) || 1;
    const mat = [A, B, C][i % 3];
    const sh = joint(torso, Math.sin(cfg.a) * 0.24 * S, cfg.walk ? -0.02 * S : 0.06 * S, Math.cos(cfg.a) * 0.24 * S);
    sh.rotation.y = cfg.a;
    sh.rotation.z = cfg.roll;
    const len1 = (cfg.walk ? 0.40 : 0.24) * S;
    part(sh, tubeBetween(v3(0, 0, 0), v3(0, -len1, 0.05 * S), [0.055 * S, 0.042 * S], { radial: 7, hSeg: 3 }),
      mat, { uv: 'cylY', uvScale: [1, 2] });
    const el = joint(sh, 0, -len1, 0.05 * S);
    const len2 = (cfg.walk ? 0.36 : 0.20) * S;
    part(el, tubeBetween(v3(0, 0, 0), v3(0, -len2, 0), [0.042 * S, 0.034 * S], { radial: 6, hSeg: 3 }),
      mat, { uv: 'cylY', uvScale: [1, 2] });
    const wr = joint(el, 0, -len2, 0);
    // A HUMAN HAND. Still a hand. Five fingers, correct proportions, put on
    // the ground like a foot — which is the horror.
    part(wr, tGeo(blob(0.048 * S, 0.028 * S, 0.058 * S, 9), { pos: [0, -0.022 * S, 0.010 * S] }), mat);
    const fingers = [];
    for (let f = -2; f <= 2; f++) {
      const fj = joint(wr, f * 0.021 * S, -0.038 * S, 0.048 * S);
      part(fj, tubeBetween(v3(0, 0, 0), v3(f * 0.006 * S, -0.012 * S, 0.055 * S), [0.010 * S, 0.007 * S],
        { radial: 4, hSeg: 2 }), mat, { uv: 'cylZ' });
      fingers.push(fj);
    }
    arms.push({ sh, el, wr, fingers, walk: cfg.walk, ang: cfg.a, roll: cfg.roll, side, phase: i * 1.05 });
    // THE ARTEFACT — a wristwatch, on the second walking arm
    if (i === 1) artefact(el, 'watch', S, { pos: [0, -len2 * 0.30, 0] });
  });

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 4);
    t += dt * (2.6 + run * 6);
    const sur = st.surface ?? 0;
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // THE GAIT IS WRONG BY DESIGN: the four walking arms move in a rotating
    // sequence rather than in diagonal pairs, so it never settles into a
    // rhythm a viewer can predict. That unpredictability is the point.
    arms.forEach((L, i) => {
      if (!L.walk) {
        // the two vestigial arms twitch against the chest, out of time
        L.sh.rotation.x = -1.5 + Math.sin(t * 3.1 + L.phase) * 0.30 - sur * 0.5;
        L.el.rotation.x = -1.9 + Math.sin(t * 4.3 + L.phase) * 0.35;
        L.wr.rotation.z = Math.sin(t * 5.7 + L.phase) * 0.5;
        for (const f of L.fingers) f.rotation.x = -0.9 + Math.sin(t * 6 + L.phase) * 0.5;
        return;
      }
      const ph = t * 1.35 + L.phase * 1.7;
      const lift = Math.max(0, Math.sin(ph));
      L.sh.rotation.x = Math.sin(ph) * (0.24 + run * 0.30) - 0.10;
      L.sh.rotation.z = L.roll + Math.sin(ph * 0.5) * 0.10;
      L.el.rotation.x = -0.30 - lift * (0.55 + run * 0.3);
      L.wr.rotation.x = 0.45 + lift * 0.35;
      for (const f of L.fingers) f.rotation.x = -0.25 - lift * 0.5;
    });
    root.position.y = 0.72 * S + Math.abs(Math.sin(t * 1.35)) * 0.035 * S - sur * 0.10 * S;
    torso.rotation.x = 0.16 + Math.sin(t * 2.7) * 0.05 - sur * 0.35 + swing * 0.3;
    torso.rotation.z = Math.sin(t * 1.1) * 0.09;
    // the head lolls on almost no neck, and it never quite tracks the body
    neck.rotation.x = 0.30 + Math.sin(t * 0.9) * 0.14 - sur * 0.85;
    neck.rotation.z = Math.sin(t * 1.7) * 0.22;
    head.rotation.y = Math.sin(t * 0.6) * 0.5 * (1 - sur);
    // THE SURFACING: the face comes up and the mouth opens
    face.mouth.scale.setScalar(0.6 + sur * 0.9 + Math.sin(t * 3) * 0.05);
    if (st.hurt) torso.rotation.x -= 0.35;
  };

  return finish(g, { height: 1.25 * S, radius: 0.62 * S, tick, variant: 'splayed', surfaceRate: 7 });
}

// ===========================================================================
// 2 — BENT 折躯 : folded backwards at the waist, travelling face-up
// ===========================================================================
export function buildBent() {
  const S = 1.30;
  const g = new THREE.Group();
  const A = fleshMat(1, { seams: 6, veins: 12 });
  const B = fleshMat(3, { seams: 4, veins: 9 });
  const C = fleshMat(5, { seams: 3, veins: 6 });

  // A CRAB-WALK. The spine is snapped backwards at the waist, so the belly is
  // uppermost and the four limbs reach up and back to the floor. The head hangs
  // off the far end, upside down, and drags.
  const root = joint(g, 0, 0.60 * S, 0);
  const pelvis = joint(root, 0, 0, -0.10 * S);
  part(pelvis, blob(0.17 * S, 0.15 * S, 0.16 * S, 12), B, { outline: true, uvScale: [2, 2] });
  // the belly, presented at the sky, taut and over-inflated
  const belly = joint(pelvis, 0, 0.10 * S, 0.20 * S);
  part(belly, blob(0.22 * S, 0.19 * S, 0.26 * S, 14), A, { outline: true, uvScale: [2, 2] });
  part(belly, tGeo(blob(0.15 * S, 0.11 * S, 0.13 * S, 10), { pos: [0, 0.14 * S, 0.02 * S] }), C, { uvScale: [2, 2] });
  // A SECOND FACE, in the stomach, looking straight up. Nothing about this is
  // survivable and it is exactly what the reference describes.
  const bellyFace = humanFace(belly, 0.24 * S, { pos: [0, 0.20 * S, 0.03 * S], rot: [-Math.PI / 2 + 0.3, 0, 0] });

  // the chest continues PAST the fold, so the ribs are underneath
  const chest = joint(belly, 0, -0.06 * S, 0.26 * S);
  part(chest, blob(0.19 * S, 0.16 * S, 0.20 * S, 12), B, { uvScale: [2, 2] });
  // THE HEAD, inverted, hanging off the front and scraping
  const neck = joint(chest, 0, -0.04 * S, 0.19 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, -0.16 * S, 0.12 * S), [0.055 * S, 0.048 * S], { radial: 7, hSeg: 3 }),
    C, { uv: 'cylY' });
  const head = joint(neck, 0, -0.17 * S, 0.13 * S);
  part(head, blob(0.115 * S, 0.13 * S, 0.115 * S, 12), A, { outline: true, uvScale: [2, 2] });
  const face = humanFace(head, 0.21 * S, { pos: [0, 0.01 * S, 0.06 * S], rot: [0, 0, Math.PI] });
  artefact(neck, 'collar', S, { pos: [0, -0.05 * S, 0.03 * S], rot: [0.5, 0, 0] });

  // FOUR LIMBS reaching UP-AND-BACK to the floor, knees and elbows inverted
  const limbs = [];
  for (const s of [1, -1]) {
    for (const [host, z, isArm] of [[chest, 0.06 * S, true], [pelvis, -0.06 * S, false]]) {
      const up = joint(host, s * 0.145 * S, 0.02 * S, z);
      const l1 = (isArm ? 0.30 : 0.32) * S;
      part(up, tubeBetween(v3(0, 0, 0), v3(s * 0.05 * S, -l1, 0), [0.058 * S, 0.045 * S], { radial: 7, hSeg: 3 }),
        isArm ? A : B, { uv: 'cylY', uvScale: [1, 2] });
      const mid = joint(up, s * 0.05 * S, -l1, 0);
      const l2 = (isArm ? 0.28 : 0.30) * S;
      part(mid, tubeBetween(v3(0, 0, 0), v3(0, -l2, isArm ? 0.03 * S : -0.03 * S), [0.045 * S, 0.036 * S],
        { radial: 6, hSeg: 3 }), isArm ? B : C, { uv: 'cylY', uvScale: [1, 2] });
      const end = joint(mid, 0, -l2, isArm ? 0.03 * S : -0.03 * S);
      if (isArm) {
        part(end, tGeo(blob(0.046 * S, 0.026 * S, 0.055 * S, 9), { pos: [0, -0.020 * S, 0.008 * S] }), C);
        for (let f = -2; f <= 2; f++) {
          part(end, tubeBetween(v3(f * 0.020 * S, -0.034 * S, 0.045 * S), v3(f * 0.024 * S, -0.046 * S, 0.095 * S),
            [0.009 * S, 0.006 * S], { radial: 4, hSeg: 2 }), C, { uv: 'cylZ' });
        }
      } else {
        part(end, tGeo(blob(0.052 * S, 0.032 * S, 0.085 * S, 9), { pos: [0, -0.026 * S, 0.020 * S] }), C);
      }
      limbs.push({ up, mid, end, isArm, side: s, phase: (isArm ? 0 : Math.PI) + (s > 0 ? 0 : Math.PI * 0.5) });
    }
  }
  // THE SHOE, still laced, on one back foot
  artefact(limbs.find(L => !L.isArm && L.side > 0).end, 'shoe', S, { pos: [0, -0.045 * S, 0.02 * S] });

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 4);
    t += dt * (2.2 + run * 7);
    const sur = st.surface ?? 0;
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // A SCUTTLE, on a four-beat that never lands square. Each limb is a
    // quarter cycle off the last, so there is no moment where the body is
    // symmetrical — which is what makes it read as fleeing from itself.
    limbs.forEach((L) => {
      const ph = t * 1.5 + L.phase;
      const lift = Math.max(0, Math.sin(ph));
      L.up.rotation.x = -0.22 + Math.sin(ph) * (0.30 + run * 0.34);
      L.up.rotation.z = L.side * (0.28 + Math.sin(ph * 0.5) * 0.12);
      L.mid.rotation.x = 0.55 + lift * (0.5 + run * 0.3);
      L.end.rotation.x = -0.45 - lift * 0.3;
    });
    root.position.y = 0.60 * S + Math.abs(Math.sin(t * 1.5)) * 0.045 * S;
    pelvis.rotation.z = Math.sin(t * 0.75) * 0.10;
    belly.rotation.x = -0.14 + Math.sin(t * 2.4) * 0.06 + sur * 0.25;
    // the belly swells and slackens like breathing that is not working
    belly.scale.set(1 + Math.sin(t * 1.9) * 0.05, 1 - Math.sin(t * 1.9) * 0.03, 1 + Math.sin(t * 1.9) * 0.04);
    chest.rotation.x = 0.10 - Math.sin(t * 2.4) * 0.05 + swing * 0.35;
    // the head DRAGS: it lags the body and swings loose, never held
    neck.rotation.x = 0.24 + Math.sin(t * 1.1 - 0.7) * 0.20 - sur * 0.55;
    neck.rotation.z = Math.sin(t * 0.85 - 0.5) * 0.34;
    head.rotation.z = Math.sin(t * 1.4 - 0.9) * 0.42;
    face.mouth.scale.setScalar(0.6 + sur * 0.9);
    bellyFace.mouth.scale.setScalar(0.5 + sur * 1.0 + Math.sin(t * 2.6) * 0.06);
    if (st.hurt) { belly.rotation.x -= 0.3; }
  };

  return finish(g, { height: 1.05 * S, radius: 0.62 * S, tick, variant: 'bent', surfaceRate: 5.5 });
}

// ===========================================================================
// 3 — TOWER 満身 : the biggest one Mahito has made
// ===========================================================================
// "The largest one Mahito has created is MORE THAN TWICE AS TALL AS HIMSELF and
// is EXTREMELY OBESE." Mahito is over 180 cm, so this is built at 3.4 m and it
// is the only transfigured human that towers over a fighter. It barely moves:
// it shuffles, and every step is a whole-body event.
export function buildTower() {
  const S = 1.0;
  const g = new THREE.Group();
  const A = fleshMat(3, { seams: 9, veins: 18, bloom: '#6b3f44' });
  const B = fleshMat(5, { seams: 7, veins: 14 });
  const C = fleshMat(1, { seams: 5, veins: 10 });

  // A COLUMN OF FOLDS. Five stacked masses, each wider than the one under it,
  // so the whole thing is top-heavy and looks like it is about to fall on you.
  const root = joint(g, 0, 0.55 * S, 0);
  const segs = [];
  let host = root;
  const widths = [0.52, 0.62, 0.72, 0.66, 0.44];
  widths.forEach((w, i) => {
    const seg = joint(host, 0, i === 0 ? 0 : 0.52 * S, 0);
    part(seg, blob(w * S, 0.34 * S, w * 0.88 * S, 16), i % 2 ? A : B,
      { outline: i === 2, thickness: 0.016, uvScale: [3, 2] });
    // the fold under each roll — a darker crease mass that catches the rim
    part(seg, tGeo(blob(w * 0.94 * S, 0.09 * S, w * 0.82 * S, 12), { pos: [0, -0.26 * S, 0.02 * S] }), C,
      { uvScale: [3, 1] });
    segs.push(seg);
    host = seg;
  });
  artefact(segs[2], 'belt', S, { pos: [0, -0.20 * S, 0], rot: [0.12, 0, 0] });

  // THREE FACES fused into the column at different heights, each turned a
  // different way. They are not decoration: this thing was several people.
  const faces = [
    humanFace(segs[1], 0.28 * S, { pos: [0.30 * S, 0.06 * S, 0.44 * S], rot: [0, 0.5, 0.3] }),
    humanFace(segs[2], 0.32 * S, { pos: [-0.34 * S, -0.02 * S, 0.52 * S], rot: [0.1, -0.55, -0.4] }),
    humanFace(segs[3], 0.26 * S, { pos: [0.10 * S, 0.14 * S, 0.52 * S], rot: [-0.25, 0.15, 1.9] })
  ];

  // A HEAD ON TOP, sunk almost entirely into the shoulders — the original one,
  // the smallest thing on the body.
  const head = joint(segs[4], 0, 0.24 * S, 0.04 * S);
  part(head, blob(0.17 * S, 0.16 * S, 0.16 * S, 12), C, { outline: true, uvScale: [2, 2] });
  const topFace = humanFace(head, 0.26 * S, { pos: [0, -0.01 * S, 0.11 * S] });

  // VESTIGIAL ARMS, buried to the elbow in the mass and far too small
  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(segs[3], s * 0.60 * S, 0.02 * S, 0.06 * S);
    sh.rotation.z = s * 0.9;
    part(sh, tubeBetween(v3(0, 0, 0), v3(s * 0.14 * S, -0.22 * S, 0), [0.075 * S, 0.055 * S], { radial: 7, hSeg: 2 }),
      B, { uv: 'cylY' });
    const el = joint(sh, s * 0.14 * S, -0.22 * S, 0);
    part(el, tubeBetween(v3(0, 0, 0), v3(s * 0.06 * S, -0.20 * S, 0.02 * S), [0.055 * S, 0.042 * S], { radial: 6, hSeg: 2 }),
      C, { uv: 'cylY' });
    const wr = joint(el, s * 0.06 * S, -0.20 * S, 0.02 * S);
    part(wr, tGeo(blob(0.058 * S, 0.036 * S, 0.070 * S, 9), { pos: [0, -0.026 * S, 0.012 * S] }), C);
    arms.push({ sh, el, wr, side: s });
  }

  // TWO LEGS, if they can be called that: swollen columns with no ankle
  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(root, s * 0.24 * S, -0.06 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(s * 0.03 * S, -0.30 * S, 0), [0.22 * S, 0.20 * S], { radial: 9, hSeg: 3 }),
      B, { outline: true, thickness: 0.014, uv: 'cylY', uvScale: [2, 2] });
    const knee = joint(hip, s * 0.03 * S, -0.30 * S, 0);
    part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.22 * S, 0), [0.20 * S, 0.21 * S], { radial: 9, hSeg: 2 }),
      C, { uv: 'cylY', uvScale: [2, 2] });
    const foot = joint(knee, 0, -0.22 * S, 0);
    part(foot, tGeo(blob(0.22 * S, 0.075 * S, 0.28 * S, 10), { pos: [0, -0.04 * S, 0.05 * S] }), C);
    legs.push({ hip, knee, foot, side: s });
  }

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 3);
    t += dt * (1.1 + run * 2.4);
    const sur = st.surface ?? 0;
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // A SHUFFLE. The feet barely leave the floor and the whole column sways a
    // beat behind them — mass that the legs are not really controlling.
    legs.forEach((L, i) => {
      const ph = t + (i ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(ph));
      L.hip.rotation.x = Math.sin(ph) * (0.16 + run * 0.16);
      L.knee.rotation.x = -lift * 0.22;
      L.foot.rotation.x = lift * 0.12;
    });
    root.position.y = 0.55 * S - Math.abs(Math.sin(t)) * 0.030 * S;
    root.rotation.z = Math.sin(t) * 0.045;
    // each segment lags the one below it — the wobble travels UP the column
    segs.forEach((sg, i) => {
      sg.rotation.z = Math.sin(t - i * 0.42) * (0.035 + i * 0.012);
      sg.rotation.x = Math.sin(t * 1.6 - i * 0.34) * 0.028 + (i === 4 ? sur * -0.2 : 0);
      const br = 1 + Math.sin(t * 1.3 - i * 0.5) * 0.022;
      sg.scale.set(br, 2 - br, br);
    });
    arms.forEach((Aa, i) => {
      Aa.sh.rotation.x = -0.2 + Math.sin(t * 1.7 + i * 2.2) * 0.35 - swing * 1.4;
      Aa.el.rotation.x = -0.9 + Math.sin(t * 2.3 + i) * 0.25 + swing * 0.9;
      Aa.wr.rotation.z = Math.sin(t * 3.1 + i) * 0.3;
    });
    head.rotation.y = Math.sin(t * 0.55) * 0.34 * (1 - sur);
    head.rotation.x = 0.12 - sur * 0.4;
    topFace.mouth.scale.setScalar(0.6 + sur * 0.9);
    // the three fused faces surface out of phase with each other and with the
    // top one — they were three different people and they are not synchronised
    faces.forEach((f, i) => {
      f.mouth.scale.setScalar(0.5 + Math.max(0, Math.sin(t * 0.9 + i * 2.1)) * (0.35 + sur * 0.7));
      f.group.rotation.z += Math.sin(t * 1.3 + i) * 0.002;
    });
    if (st.hurt) root.rotation.x = -0.10;
    else root.rotation.x *= 0.85;
  };

  return finish(g, { height: 3.35 * S, radius: 0.95 * S, tick, variant: 'tower', surfaceRate: 8 });
}

// ===========================================================================
// 4 — MAW 裂胸 : the head sunk into the shoulders, the chest opened into a mouth
// ===========================================================================
export function buildMaw() {
  const S = 1.28;
  const g = new THREE.Group();
  const A = fleshMat(2, { seams: 8, veins: 15 });
  const B = fleshMat(4, { seams: 5, veins: 11 });
  const C = fleshMat(0, { seams: 4, veins: 8 });
  const teeth = boneMat(maskTex('mawTeeth', { base: '#ded4c0', crack: '#a89a84', stain: '#b9a888' }));

  const root = joint(g, 0, 0.94 * S, 0);
  const pelvis = joint(root, 0, -0.34 * S, 0);
  part(pelvis, blob(0.16 * S, 0.14 * S, 0.14 * S, 12), C, { uvScale: [2, 2] });
  const torso = joint(root, 0, 0, 0);
  // the ribcage, split down the middle and hinged open
  part(torso, blob(0.26 * S, 0.28 * S, 0.20 * S, 14), A, { outline: true, uvScale: [2, 2] });
  // the shoulders, hunched right up so there is nowhere for a head to be
  for (const s of [1, -1]) {
    part(torso, tGeo(blob(0.15 * S, 0.13 * S, 0.14 * S, 11), { pos: [s * 0.22 * S, 0.20 * S, 0] }), B, { uvScale: [2, 2] });
  }
  // THE HEAD, sunk between them until only the crown shows
  const head = joint(torso, 0, 0.26 * S, 0.01 * S);
  part(head, blob(0.115 * S, 0.10 * S, 0.11 * S, 11), C, { uvScale: [2, 2] });
  const crownFace = humanFace(head, 0.17 * S, { pos: [0, -0.005 * S, 0.065 * S], rot: [0.35, 0, 0] });
  artefact(torso, 'collar', S, { pos: [0, 0.245 * S, 0.03 * S], rot: [0.2, 0, 0] });

  // THE CHEST MOUTH. Upper and lower halves hinged at the sides, teeth on both
  // edges. It is the whole design and it takes up the whole front of the body.
  const mouth = joint(torso, 0, -0.02 * S, 0.14 * S);
  const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.20 * S, 12, 10), voidMat(0x1c0d10));
  cavity.scale.set(1.05, 0.9, 0.55);
  cavity.position.z = -0.04 * S;
  mouth.add(cavity);
  // A TONGUE, which is a human forearm and hand. The most deliberate single
  // decision in this file.
  const tongue = joint(mouth, 0, -0.03 * S, -0.02 * S);
  part(tongue, tubeBetween(v3(0, 0, 0), v3(0, -0.02 * S, 0.20 * S), [0.045 * S, 0.038 * S], { radial: 7, hSeg: 3 }),
    C, { uv: 'cylZ' });
  const tHand = joint(tongue, 0, -0.02 * S, 0.20 * S);
  part(tHand, tGeo(blob(0.042 * S, 0.024 * S, 0.050 * S, 9), { pos: [0, 0, 0.02 * S] }), C);
  for (let f = -2; f <= 2; f++) {
    part(tHand, tubeBetween(v3(f * 0.018 * S, 0, 0.045 * S), v3(f * 0.024 * S, 0.010 * S, 0.090 * S),
      [0.008 * S, 0.005 * S], { radial: 4, hSeg: 2 }), C, { uv: 'cylZ' });
  }
  const jaws = [];
  for (const sign of [1, -1]) {
    const j = joint(mouth, 0, sign * 0.05 * S, 0);
    part(j, tGeo(blob(0.24 * S, 0.09 * S, 0.13 * S, 12), { pos: [0, sign * 0.02 * S, 0.05 * S] }),
      sign > 0 ? A : B, { uvScale: [2, 1] });
    for (let i = -3; i <= 3; i++) {
      part(j, tGeo(coneSpike(0.022 * S, 0.075 * S, v3(0, 0, 0.012 * S), { radial: 4, hSeg: 2 }),
        { rot: [sign > 0 ? 172 : 8, 0, 0], pos: [i * 0.055 * S, sign * 0.055 * S, 0.115 * S] }), teeth, { uv: 'cylY' });
    }
    jaws.push({ j, sign });
  }

  // ARMS FAR TOO LONG — knuckles below the knee, dragging
  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(torso, s * 0.28 * S, 0.16 * S, 0);
    part(sh, tubeBetween(v3(0, 0, 0), v3(s * 0.06 * S, -0.46 * S, 0), [0.062 * S, 0.048 * S], { radial: 7, hSeg: 3 }),
      B, { outline: true, uv: 'cylY', uvScale: [1, 2] });
    const el = joint(sh, s * 0.06 * S, -0.46 * S, 0);
    part(el, tubeBetween(v3(0, 0, 0), v3(s * 0.03 * S, -0.52 * S, 0.02 * S), [0.048 * S, 0.038 * S], { radial: 6, hSeg: 3 }),
      A, { uv: 'cylY', uvScale: [1, 2] });
    const wr = joint(el, s * 0.03 * S, -0.52 * S, 0.02 * S);
    part(wr, tGeo(blob(0.052 * S, 0.030 * S, 0.062 * S, 9), { pos: [0, -0.024 * S, 0.010 * S] }), C);
    const fingers = [];
    for (let f = -2; f <= 2; f++) {
      const fj = joint(wr, f * 0.022 * S, -0.040 * S, 0.048 * S);
      part(fj, tubeBetween(v3(0, 0, 0), v3(f * 0.008 * S, -0.030 * S, 0.060 * S), [0.010 * S, 0.006 * S],
        { radial: 4, hSeg: 2 }), C, { uv: 'cylZ' });
      fingers.push(fj);
    }
    arms.push({ sh, el, wr, fingers, side: s });
  }
  artefact(arms[0].el, 'watch', S, { pos: [0, -0.14 * S, 0] });

  // LEGS — short, bandy, and they cannot really carry the torso
  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(pelvis, s * 0.11 * S, -0.06 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(s * 0.06 * S, -0.28 * S, 0), [0.070 * S, 0.055 * S], { radial: 7, hSeg: 3 }),
      B, { uv: 'cylY', uvScale: [1, 2] });
    const knee = joint(hip, s * 0.06 * S, -0.28 * S, 0);
    part(knee, tubeBetween(v3(0, 0, 0), v3(-s * 0.05 * S, -0.26 * S, 0), [0.055 * S, 0.044 * S], { radial: 6, hSeg: 3 }),
      C, { uv: 'cylY', uvScale: [1, 2] });
    const foot = joint(knee, -s * 0.05 * S, -0.26 * S, 0);
    part(foot, tGeo(blob(0.062 * S, 0.034 * S, 0.115 * S, 9), { pos: [0, -0.026 * S, 0.028 * S] }), C);
    legs.push({ hip, knee, foot, side: s });
  }

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 4);
    t += dt * (2.0 + run * 5.5);
    const sur = st.surface ?? 0;
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // A LURCH. The legs are on a normal two-beat but the torso leads by nearly
    // half a cycle, so the body arrives before its feet do — which is the exact
    // read of something being DRAGGED FORWARD by its own chest.
    legs.forEach((L, i) => {
      const ph = t + (i ? Math.PI : 0);
      const lift = Math.max(0, Math.sin(ph));
      L.hip.rotation.x = Math.sin(ph) * (0.34 + run * 0.34);
      L.knee.rotation.x = -0.24 - lift * (0.6 + run * 0.3);
      L.foot.rotation.x = 0.14 + lift * 0.28;
      L.hip.rotation.z = L.side * 0.18;
    });
    root.position.y = 0.94 * S + Math.abs(Math.sin(t)) * 0.045 * S;
    torso.rotation.x = 0.24 + Math.sin(t - 1.4) * 0.10 + run * 0.16 - sur * 0.4 + swing * 0.35;
    torso.rotation.z = Math.sin(t * 0.6) * 0.10;
    torso.rotation.y = Math.sin(t * 0.9) * 0.14;
    // THE CHEST MOUTH breathes constantly and gapes on the attack
    const open = 0.18 + Math.sin(t * 1.7) * 0.10 + swing * 1.15 + sur * 0.5;
    jaws.forEach(J => { J.j.rotation.x = -J.sign * open; });
    // the arm-tongue reaches out of it, groping
    tongue.rotation.x = -0.3 + Math.sin(t * 2.2) * 0.35 - swing * 0.8;
    tongue.rotation.y = Math.sin(t * 1.6) * 0.4;
    tHand.rotation.x = Math.sin(t * 3.1) * 0.5;
    arms.forEach((Aa, i) => {
      const ph = t + (i ? 0 : Math.PI);
      // they swing loose and out of time, and never both at once
      Aa.sh.rotation.x = 0.12 + Math.sin(ph * 0.85) * (0.30 + run * 0.28) - swing * 1.9;
      Aa.sh.rotation.z = Aa.side * (0.20 + Math.sin(ph * 0.5) * 0.12);
      Aa.el.rotation.x = -0.22 - Math.max(0, Math.sin(ph * 0.85)) * 0.30 + swing * 1.1;
      for (const f of Aa.fingers) f.rotation.x = -0.4 + Math.sin(t * 4 + i) * 0.35;
    });
    head.rotation.y = Math.sin(t * 0.7) * 0.30 * (1 - sur);
    head.rotation.x = -0.10 - sur * 0.35;
    crownFace.mouth.scale.setScalar(0.6 + sur * 1.0);
    if (st.hurt) torso.rotation.x -= 0.35;
  };

  return finish(g, { height: 1.72 * S, radius: 0.58 * S, tick, variant: 'maw', surfaceRate: 6 });
}

// ===========================================================================
// 5 — STILT 長脚 : inverted proportions, head hanging below the shoulders
// ===========================================================================
export function buildStilt() {
  const S = 1.15;
  const g = new THREE.Group();
  const A = fleshMat(4, { seams: 6, veins: 13 });
  const B = fleshMat(0, { seams: 4, veins: 9 });
  const C = fleshMat(2, { seams: 3, veins: 7 });

  // EVERYTHING IS THE WRONG LENGTH. Legs at two and a half times human, a
  // torso compressed to a third, and a neck long enough that the head hangs
  // BELOW the shoulders and swings.
  const root = joint(g, 0, 2.05 * S, 0);
  const pelvis = joint(root, 0, 0, 0);
  part(pelvis, blob(0.115 * S, 0.10 * S, 0.10 * S, 11), B, { uvScale: [2, 2] });
  const torso = joint(pelvis, 0, 0.14 * S, 0);
  part(torso, blob(0.14 * S, 0.15 * S, 0.11 * S, 12), A, { outline: true, uvScale: [2, 2] });
  // ribs showing through — a compressed torso has nothing to hide them
  for (let i = 0; i < 4; i++) {
    part(torso, tGeo(blob(0.135 * S, 0.014 * S, 0.10 * S, 9), { pos: [0, (0.07 - i * 0.045) * S, 0.02 * S] }), C);
  }
  const shoulders = joint(torso, 0, 0.15 * S, 0);
  part(shoulders, blob(0.20 * S, 0.055 * S, 0.09 * S, 12), B, { uvScale: [2, 1] });

  // THE NECK, hanging DOWN off the front of the shoulders — five loose links
  // so it swings like a rope rather than bending like a neck.
  const neckLinks = [];
  let host = joint(shoulders, 0, -0.02 * S, 0.07 * S);
  for (let i = 0; i < 5; i++) {
    part(host, tubeBetween(v3(0, 0, 0), v3(0, -0.13 * S, 0), [(0.042 - i * 0.003) * S, (0.039 - i * 0.003) * S],
      { radial: 6, hSeg: 2 }), C, { uv: 'cylY' });
    host = joint(host, 0, -0.13 * S, 0);
    neckLinks.push(host);
  }
  const head = host;
  part(head, blob(0.105 * S, 0.125 * S, 0.105 * S, 12), A, { outline: true, uvScale: [2, 2] });
  // the face looks UP, because that is the only direction it can look from
  // where it is hanging
  const face = humanFace(head, 0.19 * S, { pos: [0, -0.02 * S, 0.055 * S], rot: [0.7, 0, 0] });
  artefact(neckLinks[0], 'tie', S, { pos: [0, -0.05 * S, 0.045 * S] });

  // ARMS — normal length on a tiny torso, which makes them look far too long
  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(shoulders, s * 0.185 * S, 0, 0);
    part(sh, tubeBetween(v3(0, 0, 0), v3(s * 0.05 * S, -0.34 * S, 0), [0.040 * S, 0.032 * S], { radial: 6, hSeg: 3 }),
      B, { uv: 'cylY', uvScale: [1, 2] });
    const el = joint(sh, s * 0.05 * S, -0.34 * S, 0);
    part(el, tubeBetween(v3(0, 0, 0), v3(s * 0.02 * S, -0.32 * S, 0), [0.032 * S, 0.026 * S], { radial: 6, hSeg: 3 }),
      C, { uv: 'cylY', uvScale: [1, 2] });
    const wr = joint(el, s * 0.02 * S, -0.32 * S, 0);
    part(wr, tGeo(blob(0.036 * S, 0.022 * S, 0.044 * S, 9), { pos: [0, -0.018 * S, 0.006 * S] }), C);
    const fingers = [];
    for (let f = -2; f <= 2; f++) {
      const fj = joint(wr, f * 0.016 * S, -0.030 * S, 0.034 * S);
      part(fj, tubeBetween(v3(0, 0, 0), v3(f * 0.008 * S, -0.050 * S, 0.030 * S), [0.007 * S, 0.004 * S],
        { radial: 4, hSeg: 2 }), C, { uv: 'cylZ' });
      fingers.push(fj);
    }
    arms.push({ sh, el, wr, fingers, side: s });
  }

  // LEGS — enormous, thin, and with an extra joint that a leg does not have
  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(pelvis, s * 0.075 * S, -0.06 * S, 0);
    part(hip, tubeBetween(v3(0, 0, 0), v3(s * 0.02 * S, -0.72 * S, 0), [0.048 * S, 0.034 * S], { radial: 7, hSeg: 4 }),
      A, { outline: true, uv: 'cylY', uvScale: [1, 3] });
    const knee = joint(hip, s * 0.02 * S, -0.72 * S, 0);
    part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.68 * S, 0.04 * S), [0.034 * S, 0.026 * S], { radial: 6, hSeg: 4 }),
      B, { uv: 'cylY', uvScale: [1, 3] });
    // THE THIRD JOINT. Legs do not have one. This is what makes the walk
    // unwatchable rather than merely tall.
    const hock = joint(knee, 0, -0.68 * S, 0.04 * S);
    part(hock, tubeBetween(v3(0, 0, 0), v3(0, -0.36 * S, -0.05 * S), [0.026 * S, 0.022 * S], { radial: 6, hSeg: 3 }),
      C, { uv: 'cylY', uvScale: [1, 2] });
    const foot = joint(hock, 0, -0.36 * S, -0.05 * S);
    part(foot, tGeo(blob(0.042 * S, 0.024 * S, 0.10 * S, 9), { pos: [0, -0.018 * S, 0.035 * S] }), C);
    legs.push({ hip, knee, hock, foot, side: s });
  }
  artefact(legs[1].foot, 'shoe', S, { pos: [0, -0.030 * S, 0.030 * S] });

  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 4);
    t += dt * (1.6 + run * 4.2);
    const sur = st.surface ?? 0;
    const swing = st.action === 'swipe' ? (st.actionK ?? 0) : 0;
    // A STALK. Huge slow strides with an enormous knee lift, and because of
    // the third joint the foot comes down TOE FIRST and then folds — the leg
    // arrives in two stages and neither of them is a step.
    legs.forEach((L, i) => {
      const ph = t + (i ? Math.PI : 0);
      const sw = Math.sin(ph);
      const lift = Math.max(0, sw);
      L.hip.rotation.x = sw * (0.42 + run * 0.34);
      L.knee.rotation.x = -lift * (1.15 + run * 0.35);
      L.hock.rotation.x = 0.55 + lift * 0.85;
      L.foot.rotation.x = -0.45 - lift * 0.3;
      L.hip.rotation.z = L.side * 0.05;
    });
    // the whole body rises and falls almost a third of a metre per stride
    root.position.y = 2.05 * S + Math.abs(Math.sin(t)) * 0.11 * S;
    root.rotation.z = Math.sin(t) * 0.055;
    pelvis.rotation.y = Math.sin(t) * 0.16;
    torso.rotation.x = 0.14 + Math.sin(t * 2) * 0.05 + swing * 0.4;
    shoulders.rotation.y = -Math.sin(t) * 0.24;
    // THE HEAD SWINGS ON THE NECK, a pendulum lagging further with each link.
    // It is never still and it is never facing where the body is going.
    neckLinks.forEach((l, i) => {
      l.rotation.x = Math.sin(t * 1.25 - i * 0.5) * (0.14 + i * 0.05) + sur * 0.10;
      l.rotation.z = Math.sin(t * 0.95 - i * 0.42) * (0.16 + i * 0.06);
      l.rotation.y = Math.sin(t * 0.7 - i * 0.3) * 0.10;
    });
    arms.forEach((Aa, i) => {
      const ph = t + (i ? 0 : Math.PI);
      Aa.sh.rotation.x = Math.sin(ph) * (0.30 + run * 0.26) - swing * 2.0;
      Aa.sh.rotation.z = Aa.side * 0.14;
      Aa.el.rotation.x = -0.18 - Math.max(0, Math.sin(ph)) * 0.24 + swing * 1.2;
      for (const f of Aa.fingers) f.rotation.x = -0.3 + Math.sin(t * 3.4 + i * 1.3) * 0.4;
    });
    face.mouth.scale.setScalar(0.6 + sur * 1.0);
    if (st.hurt) torso.rotation.x -= 0.4;
  };

  return finish(g, { height: 2.35 * S, radius: 0.45 * S, tick, variant: 'stilt', surfaceRate: 5 });
}

// ---------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------
// Five body plans. The summon picks one at random — which is what the previous
// implementation's randomisation was FOR, and what it never actually did: it
// jittered one model's scale and limb count and every result was the same
// silhouette at a different size.
export const TRANSFIGURED_BUILDERS = {
  splayed: buildSplayed,
  bent: buildBent,
  tower: buildTower,
  maw: buildMaw,
  stilt: buildStilt
};
export const TRANSFIGURED_IDS = Object.keys(TRANSFIGURED_BUILDERS);

export function buildTransfigured(variant) {
  const id = TRANSFIGURED_BUILDERS[variant] ? variant : randPick(TRANSFIGURED_IDS);
  return TRANSFIGURED_BUILDERS[id]();
}
