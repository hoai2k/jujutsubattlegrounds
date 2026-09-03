// ===========================================================================
// GARUDA ガルダ — Yuki Tsukumo's shikigami — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-19. The wiki page itself answers 402 to WebFetch in this
// environment (same as every other fandom page — see models/maki.js), so this
// is built from the Appearance text as reproduced across several
// search-result extractions, which agree with each other closely enough to
// trust. NO IMAGE WAS VIEWED. Said plainly.
//
// THE DESCRIPTION, as close to verbatim as the sources give it:
//   "Garuda is a long WHITE shikigami. It has a long, SERPENT-ESQUE body with
//    sections that are covered with BONE-LIKE COLUMNS. This same material
//    comprises Garuda's head, which is complete with TWO EYES and a BIRD-LIKE
//    BILL. Garuda possesses EIGHT LEVITATING WINGS that facilitate flight. The
//    creature's body is SEGMENTED into small sections that allow it a wide
//    range of movement, and it is MUCH LARGER THAN ITS WIELDER."
//
// Six load-bearing facts, and all six are built:
//   1. LONG AND SERPENTINE — not a bird, despite the name and the bill.
//   2. WHITE, and specifically BONE — not feather, not scale, not shadow.
//   3. BONE-LIKE COLUMNS covering the sections. This is the distinctive
//      surface note and it is what stops it reading as a plain white snake:
//      each segment wears a fan of raised ribs, like a vertebra's processes.
//   4. A BONE HEAD WITH A BIRD-LIKE BILL. The single strangest thing about the
//      design and the one that must not be softened — a snake body ending in
//      a beaked skull.
//   5. EIGHT LEVITATING WINGS. LEVITATING is the operative word: they are
//      DETACHED, floating clear of the body rather than hinged to it. Eight,
//      counted, in four pairs down the length.
//   6. MUCH LARGER THAN YUKI. She is H 1.82; Garuda's body runs about 6.2 m
//      nose to tail here, which is comfortably "much larger" while still
//      fitting in an arena alongside two fighters without owning the screen.
//
// ---------------------------------------------------------------------------
// WHY THIS IS NOT BUILT IN shikigami.js
// ---------------------------------------------------------------------------
// That file is the Ten Shadows, and its whole design thesis is a FAMILY: one
// shared cool #8fb6d8 rim, one shared shadow-pool emergence, one shared toon
// response, so every one of Megumi's creatures reads as the same summoner's
// work. Garuda is not Megumi's and must not read as though it were. It gets:
//   · its own bone-white palette with a WARM rim (#fff0d8), against the Ten
//     Shadows' cool one
//   · NO shadow pool and NO emergence, because it never submerges — it is
//     permanently on the field, which is the entire point of the character
//   · a STAR RAGE channel: `setMass(f)` drives an indigo charge through the
//     bone, so when Yuki pours virtual mass into it the creature visibly
//     carries her technique's colour. Nothing in the Ten Shadows does this.
// The two generic helpers (`joint`, `part`, `ellipsoid`) ARE imported from
// that file, because they are geometry utilities rather than family traits and
// duplicating them would be silly. Nothing in shikigami.js is modified.
//
// ---------------------------------------------------------------------------
// THE RIG — a flying body plan, which is not a humanoid one
// ---------------------------------------------------------------------------
// A chain of 14 SEGMENT joints nose to tail, each parented to the last, so a
// rotation at segment 3 carries everything behind it — that is what "segmented
// into small sections that allow a wide range of movement" has to mean
// mechanically. Plus:
//   · a HEAD joint and a JAW joint at the front
//   · 8 WING joints hung off segments 2, 4, 6 and 8 in pairs, each free to
//     rotate independently. They are NOT children of a shoulder because they
//     are not attached — they float, so their joints sit at an offset and the
//     animator keeps them there.
// There are no legs, no arms, no spine and no hips, so none of the humanoid
// builder applies and none of the shared BASE_CLIPS mean anything here. Its
// animation set is its own and lives in art/anim/garuda.js.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   bone      #ece6d6      boneDk     #c2b9a4      column  #f6f2e6
//   maw       #3a2f34      eye        #d8a24e      eyeGlow #ffe0a0
//   membrane  #e8e2d0      star       #6f7fd0      starHot #b8c4f0
//   rim       #fff0d8      outline    #0e0c10
// The bone is a warm off-white, NOT pure white: a #ffffff creature blows out
// to a silhouette-free blob under the key light, which is the lesson the
// Divine Dogs note in shikigami.js already records, and it applies to
// something this large even more strongly.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the wings' exact shape. "Eight levitating wings" is the whole reference.
//     Built as tapered bone-framed membrane panels because that reads as a
//     wing at a glance and matches the bone material the rest of it is made
//     of; whether canon draws them feathered is not something the text says.
//   · the head's proportions beyond "bone, two eyes, a bird-like bill".
//   · the column pattern's exact geometry — "covered with bone-like columns"
//     is descriptive, not specific.
//   · the tail's termination. Built as a simple taper.
// ===========================================================================
import * as THREE from 'three';
import { joint, part, ellipsoid } from './shikigami.js';
import { makeGarudaAnimator } from '../../anim/garuda.js';
import { tubeBetween, tGeo, roundBox, coneSpike, shapeExtrude } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3 } from '../../../core/math.js';

const BONE = 0xece6d6;
const BONE_DK = 0xc2b9a4;
const COLUMN = 0xf6f2e6;
const MAW = 0x3a2f34;
const EYE = 0xd8a24e;
const MEMBRANE = 0xe8e2d0;
const STAR = 0x6f7fd0;

const SEGMENTS = 14;
const WING_ON = [2, 4, 6, 8];      // which segments carry a wing pair — 4 pairs = 8

export function buildGaruda() {
  // ---- SCALE, PASS 2 -------------------------------------------------------
  // The first pass built this at S = 1.0: a 5.6 m body with 2.4 m of wingspan,
  // which is "much larger than its wielder" taken far too literally. In a live
  // match beside a 1.82 m Yuki it filled most of the screen and read as a boss
  // rather than as a partner — and a permanent ally that owns the frame makes
  // the FIGHT unreadable, which is the one thing it must not do.
  //
  // At 0.55 the body is about 3.1 m nose to tail. That is still comfortably
  // larger than she is — it is longer than she is tall by two thirds — while
  // occupying a fraction of the screen. The segment radius is scaled UP
  // separately (0.175 -> 0.24) so the shorter body does not come out as a
  // noodle: it is a thick snake now rather than a long thin one.
  const S = 0.55;
  const body = new THREE.Group();
  body.name = 'garuda';

  // Materials. All bone, all warm-rimmed, and every one of them is kept as a
  // live reference so `setMass` can push the Star Rage indigo through them.
  const boneMat = MAT.metal({ vertexColors: false, color: BONE, rimColor: 0xfff0d8 });
  const boneDkMat = MAT.metal({ vertexColors: false, color: BONE_DK, rimColor: 0xffe8c0 });
  const columnMat = MAT.metal({ vertexColors: false, color: COLUMN, rimColor: 0xfff8e8 });
  const mawMat = new THREE.MeshBasicMaterial({ color: MAW });
  // PASS 4: the membrane was drawn at 0.62 opacity, and eight of them at that
  // value read as bright flat SHEETS that dominated the creature — the bone
  // frame is the design and the membrane is supposed to be the thing you see
  // it through. At 0.30 the spars and ribs carry the wing and the panel is a
  // suggestion, which is what "levitating wings" should look like.
  const membraneMat = new THREE.MeshBasicMaterial({
    color: MEMBRANE, transparent: true, opacity: 0.30, side: THREE.DoubleSide, depthWrite: false
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: EYE });

  // ---- THE STAR RAGE CHANNEL ---------------------------------------------
  // A second set of emissive strips running the length of the body, dark at
  // zero mass and blazing indigo at full. Built now, driven by `setMass`.
  const starMat = new THREE.MeshBasicMaterial({
    color: STAR, transparent: true, opacity: 0, depthWrite: false
  });

  // =========================================================================
  // THE SPINE — 14 segments, each parented to the last
  // =========================================================================
  // Front of the creature faces +Z, matching every other model in the project.
  // Each segment's joint sits at its own front edge and its geometry runs
  // BACKWARD from there, so a rotation at any joint pivots everything behind
  // it around that segment's front face — which is how a real vertebral chain
  // behaves and is what makes the swim read.
  const root = joint(body, 0, 0, 0);
  const segments = [];
  const wings = [];
  let host = root;
  let zAt = 0;
  for (let i = 0; i < SEGMENTS; i++) {
    const k = i / (SEGMENTS - 1);
    // radius tapers from a thick neck to a thin tail, with a slight belly
    // around a third of the way down — a uniform taper reads as a traffic cone
    const r = (0.240 - Math.pow(k, 1.35) * 0.205 + Math.sin(k * Math.PI) * 0.030) * S;
    const len = 0.40 * S;
    const seg = joint(host, 0, 0, -(i === 0 ? 0 : len));
    segments.push({ node: seg, r, k });

    // ---- THE SEGMENT BODY, WITH A DELIBERATE OVERLAP --------------------
    // PASS 2 FIX. Butt-jointed at exactly -len, the fourteen tubes came apart
    // into visibly separate pieces the moment the animator put any bend in the
    // chain: each joint rotates about its own front face, so even a few
    // degrees opens a wedge at every seam and the creature reads as debris
    // rather than as an animal.
    //
    // Each tube now runs 14% PAST its own joint spacing and starts slightly
    // BEHIND it, so consecutive segments interpenetrate. The overlap is hidden
    // inside the body at every bend angle the animator can produce, and the
    // radius is held constant across the overlap rather than tapering into it
    // (a tapering overlap shows as a ring).
    part(seg, tubeBetween(v3(0, 0, 0.06 * len), v3(0, 0, -len * 1.14), [r, r * 0.94],
      { radial: 10, hSeg: 2 }),
      boneMat, { outline: i % 3 === 0, thickness: 0.013 });

    // ---- THE BONE-LIKE COLUMNS -------------------------------------------
    // THE distinctive surface note, and the thing that stops this reading as a
    // white snake. Each segment wears a fan of raised ribs standing proud of
    // the body — read as a vertebra's processes. Seven per segment, longest on
    // the dorsal ridge and shortening around the flanks, none on the belly.
    for (let c = 0; c < 7; c++) {
      // spread across the TOP and SIDES only: -0.62π .. +0.62π from straight up
      const a = (c / 6 - 0.5) * Math.PI * 1.24;
      const up = Math.cos(a), side = Math.sin(a);
      // dorsal ribs are the longest; flank ribs shrink toward the belly
      // PASS 2: shorter and thinner. At 0.62·r with a 0.13·r base these read
      // as a row of fins standing off the body; the reference is "covered with
      // bone-like columns", which is a SURFACE texture — closer to a vertebra's
      // processes than to a stegosaur's plates.
      const h = r * (0.40 - Math.abs(a) / Math.PI * 0.44);
      const col = new THREE.Mesh(
        coneSpike(r * 0.085, h, new THREE.Vector3(0, 0, -h * 0.45), { radial: 5, hSeg: 3 }),
        columnMat);
      // sunk INTO the surface rather than sitting on it, so the base is buried
      col.position.set(side * r * 0.82, up * r * 0.82, -len * 0.5);
      // stand each rib along its own radial direction
      col.rotation.z = -a;
      seg.add(col);
    }
    // the ventral plate — a flat belly band, so the underside is not the same
    // ribbed surface as the back
    part(seg, tGeo(ellipsoid(r * 0.66, r * 0.24, len * 0.46, 8), { pos: [0, -r * 0.80, -len * 0.5] }),
      boneDkMat);

    // ---- THE STAR RAGE STRIP ---------------------------------------------
    // Runs between the columns along the dorsal line. Invisible at zero mass.
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(r * 0.30, r * 0.10, len * 0.86), starMat);
    strip.position.set(0, r * 0.88, -len * 0.5);
    seg.add(strip);

    // ---- THE WINGS -------------------------------------------------------
    // LEVITATING: offset clear of the body with a visible GAP, and never
    // hinged. Four pairs on segments 2, 4, 6, 8 = eight wings, as counted.
    if (WING_ON.includes(i)) {
      for (const s of [1, -1]) {
        // the joint floats out to the side and slightly above — the gap
        // between it and the body is the whole point and must survive every
        // pose the animator puts it in
        // the LEVITATION gap scales with the wing so it stays visible: a
        // bigger wing sitting at the old offset would have touched the body,
        // and the gap is the whole design note
        const wj = joint(seg, s * r * 3.4, r * 1.05, -len * 0.5);
        // PASS 3: span raised from 0.72 to 1.20 and chord from 0.34 to 0.62.
        // At the old size eight wings on a 6 m body read as fins — they were
        // there, and they were counted correctly, but nothing about the
        // silhouette said "flying". The reference makes them the creature's
        // most striking feature after the bill, so they are now roughly a
        // third of the body's length each and genuinely carry the shape.
        const span = (1.05 - k * 0.36) * S;
        const chord = (0.56 - k * 0.16) * S;
        // LEADING SPAR — a bone rib running the span
        const spar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.026 * S, 0.011 * S, span, 6), boneMat);
        spar.rotation.z = Math.PI / 2;
        spar.position.x = s * span / 2;
        wj.add(spar);
        spar.add(makeOutline(spar, { color: 0x0e0c10, thickness: 0.012 }));
        // THREE TRAILING RIBS off the spar
        for (let rb = 0; rb < 3; rb++) {
          const u = 0.22 + rb * 0.30;
          const rib = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015 * S, 0.005 * S, chord * (1 - rb * 0.22), 5), boneMat);
          rib.position.set(s * span * u, 0, -chord * (1 - rb * 0.22) / 2);
          rib.rotation.x = Math.PI / 2;
          wj.add(rib);
        }
        // ---- THE MEMBRANE ------------------------------------------------
        // PASS 2 FIX. A single straight-edged quad extruded 8 mm read as a
        // grey PLANK — no camber, no scallop, hard corners, and at any angle
        // other than face-on it was a line. A wing needs a swept leading edge
        // and a SCALLOPED trailing edge, which is what actually says "wing"
        // at a glance, so the outline has more points and they curve.
        const pts = [[0, 0], [span * 0.42, chord * 0.06], [span, 0]];
        // the trailing edge, scalloped between the three ribs
        for (const [u, d] of [[0.86, 0.62], [0.72, 0.86], [0.58, 0.70],
                              [0.42, 0.94], [0.28, 0.78], [0.12, 1.0]]) {
          pts.push([span * u, -chord * d]);
        }
        pts.push([0, -chord * 0.30]);
        const mem = new THREE.Mesh(shapeExtrude(pts, 0.014 * S), membraneMat);
        mem.scale.x = s;
        mem.rotation.x = -Math.PI / 2;
        wj.add(mem);
        // a star strip along each spar, so the wings charge too
        const wstrip = new THREE.Mesh(
          new THREE.BoxGeometry(span * 0.92, 0.014 * S, 0.030 * S), starMat);
        wstrip.position.set(s * span * 0.5, 0.014 * S, 0);
        wj.add(wstrip);
        wings.push({ node: wj, side: s, index: wings.length, seg: i });
      }
    }
    host = seg;
    zAt -= len;
  }
  // the tail tip — a short taper closing the last segment
  {
    const last = segments[SEGMENTS - 1];
    const tip = new THREE.Mesh(
      coneSpike(last.r * 0.9, 0.34 * S, new THREE.Vector3(0, 0, -0.34 * S), { radial: 7, hSeg: 4 }),
      boneDkMat);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -0.40 * S;
    last.node.add(tip);
  }

  // =========================================================================
  // THE HEAD — bone, two eyes, and a BIRD-LIKE BILL on a serpent
  // =========================================================================
  // The strangest and most important thing in the design. The solve is to
  // build a SKULL rather than a snake head — a narrow braincase with a real
  // brow ridge and deep eye sockets — and then put a long tapering BILL on the
  // front of it, split into an upper and a lower half on a jaw joint. A beaked
  // skull at the end of a ribbed white serpent is unmistakable, and softening
  // either half of that would lose the character.
  const head = joint(root, 0, 0, 0.20 * S);
  const HR = 0.185 * S;
  // braincase
  part(head, tGeo(ellipsoid(HR * 0.86, HR * 0.90, HR * 1.20, 12), { pos: [0, 0, -HR * 0.20] }),
    boneMat, { outline: true, thickness: 0.014 });
  // brow ridge — a heavy bone shelf over the sockets, which is what makes it
  // read as a skull rather than as an egg
  part(head, tGeo(roundBox(HR * 1.42, HR * 0.24, HR * 0.40, HR * 0.06),
    { rot: [14, 0, 0], pos: [0, HR * 0.52, HR * 0.32] }), columnMat);
  // a crest of columns over the crown, continuing the body's surface note up
  // onto the head
  for (let c = 0; c < 5; c++) {
    const a = (c / 4 - 0.5) * Math.PI * 0.80;
    const col = new THREE.Mesh(
      coneSpike(HR * 0.10, HR * (0.52 - Math.abs(a) * 0.30), new THREE.Vector3(0, 0, -HR * 0.44),
        { radial: 5, hSeg: 3 }), columnMat);
    col.position.set(Math.sin(a) * HR * 0.70, Math.cos(a) * HR * 0.78, -HR * 0.26);
    col.rotation.z = -a;
    head.add(col);
  }
  // ---- THE EYES -----------------------------------------------------------
  // Two, set in deep sockets under the brow. Sunk into the bone rather than
  // sitting on it — a socket is a hole, and the darkness around the eye is
  // half of what makes a skull frightening.
  const eyeMeshes = [];
  for (const s of [1, -1]) {
    // the socket: a dark recess
    part(head, tGeo(ellipsoid(HR * 0.26, HR * 0.22, HR * 0.16, 8),
      { pos: [s * HR * 0.60, HR * 0.16, HR * 0.44] }), mawMat);
    const e = new THREE.Mesh(new THREE.SphereGeometry(HR * 0.15, 9, 7), eyeMat);
    e.position.set(s * HR * 0.60, HR * 0.16, HR * 0.50);
    head.add(e);
    eyeMeshes.push(e);
    // a bright pupil slit — vertical, which reads as predatory
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(HR * 0.045, HR * 0.20, HR * 0.02),
      new THREE.MeshBasicMaterial({ color: 0x1a1208 }));
    p.position.set(s * HR * 0.60, HR * 0.16, HR * 0.63);
    head.add(p);
  }
  // ---- THE BILL -----------------------------------------------------------
  // Long, tapering, and gently down-curved at the tip. Upper half fixed to the
  // skull, lower half on the JAW joint so it can open.
  const BILL = 0.46 * S;
  const upper = new THREE.Mesh(
    shapeExtrude([
      [0, HR * 0.30], [BILL * 0.96, HR * 0.02], [BILL, -HR * 0.10], [0, -HR * 0.14]
    ], HR * 0.42), boneMat);
  upper.rotation.y = Math.PI / 2;
  upper.position.set(0, HR * 0.02, HR * 0.62);
  head.add(upper);
  upper.add(makeOutline(upper, { color: 0x0e0c10, thickness: 0.011 }));
  // nostril notches, one per side, near the base — small, and they are what
  // says "bill" rather than "spike"
  for (const s of [1, -1]) {
    const n = new THREE.Mesh(
      new THREE.SphereGeometry(HR * 0.055, 6, 5), mawMat);
    n.scale.set(0.5, 1, 1.6);
    n.position.set(s * HR * 0.20, HR * 0.10, HR * 0.86);
    head.add(n);
  }
  const jaw = joint(head, 0, -HR * 0.14, HR * 0.58);
  const lower = new THREE.Mesh(
    shapeExtrude([
      [0, 0], [BILL * 0.92, -HR * 0.06], [BILL * 0.94, -HR * 0.20], [0, -HR * 0.26]
    ], HR * 0.34), boneDkMat);
  lower.rotation.y = Math.PI / 2;
  jaw.add(lower);
  // the maw between them
  const maw = new THREE.Mesh(
    new THREE.BoxGeometry(HR * 0.44, HR * 0.03, BILL * 0.80), mawMat);
  maw.position.set(0, -HR * 0.12, HR * 0.60 + BILL * 0.40);
  head.add(maw);
  // a star strip along the bill's ridge
  const billStar = new THREE.Mesh(
    new THREE.BoxGeometry(HR * 0.10, HR * 0.05, BILL * 0.86), starMat);
  billStar.position.set(0, HR * 0.24, HR * 0.62 + BILL * 0.42);
  head.add(billStar);

  // =========================================================================
  // THE API
  // =========================================================================
  // Deliberately NOT `finish()` from shikigami.js: that adds a shadow pool and
  // a submerge/emerge reveal, and Garuda has neither. It is always on the
  // field — that is the character — so there is nothing to rise out of.
  const group = new THREE.Group();
  group.add(body);

  let massF = 0;
  let hurtT = 0;

  const api = {
    group, body, head, jaw, segments, wings,
    // roughly how big it is, for the hit tests and the camera framing
    height: 1.2 * S, radius: 0.75 * S, length: SEGMENTS * 0.40 * S,

    // STAR RAGE, poured in. 0..1, written every tick from combat/garuda.js.
    setMass(f) {
      massF = Math.max(0, Math.min(1, f || 0));
      starMat.opacity = massF * 0.92;
      // the bone itself warms toward the indigo at high mass — the creature
      // is BECOMING the technique, not wearing it
      const k = massF * 0.42;
      boneMat.color.setRGB(
        0.925 * (1 - k) + 0.435 * k,
        0.902 * (1 - k) + 0.498 * k,
        0.839 * (1 - k) + 0.816 * k);
      for (const e of eyeMeshes) {
        e.scale.setScalar(1 + massF * 0.30);
      }
      eyeMat.color.setHex(massF > 0.6 ? 0xb8c4f0 : EYE);
    },
    get mass() { return massF; },

    // A HIT, for the flinch. Garuda is knocked away and stunned but never
    // permanently lost, so this is a timer and not a death.
    hurt() { hurtT = 0.45; },
    get hurtT() { return hurtT; },
    tickHurt(dt) { hurtT = Math.max(0, hurtT - dt); },

    setVisible(v) { group.visible = v; }
  };
  // THE ANIMATOR IS ATTACHED HERE rather than being the caller's job, so the
  // object satisfies the same `{ group, tick(dt, state) }` interface every
  // other creature in this project exposes — which is what lets the model
  // viewer load it through the CREATURES path with no special case.
  api.tick = makeGarudaAnimator(api);
  // ...and a no-op reveal, because the viewer's slider expects one. Garuda has
  // no emergence: it does not rise out of anything, it is simply already
  // there. The stub says that explicitly rather than leaving the call to throw.
  api.setReveal = () => { };
  api.setLOD = () => { };
  api.setMass(0);
  return api;
}
