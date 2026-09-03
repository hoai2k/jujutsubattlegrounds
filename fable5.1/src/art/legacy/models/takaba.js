// TAKABA FUMIHIKO 高羽史彦 — the comedian, in the costume.
//
// ======================== REFERENCE SHEET ================================
// Researched 2026-08-20 against the reference art supplied with the brief
// (full-body Culling Game turnaround) plus the NamuWiki entry, the ORICON
// profile, Grokipedia's Takaba page and Beebom's and Animehunch's character
// pieces. jujutsu-kaisen.fandom.com and hero.fandom.com are BOTH BLOCKED from
// this session's proxy; everything below is off the supplied art or one of
// those four text sources, and every call I had to make is marked
// APPROXIMATED.
//
// ---- BUILD AND HEIGHT, RELATIVE TO THE ROSTER ---------------------------
//   Described as "a TALL adult man". The brief asks for average height and an
//   unremarkable build, and the supplied art supports the brief over the
//   adjective: the proportions are ordinary and the musculature on the bare
//   half is a normal man's, not a fighter's. Built at H = 1.80 — the exact
//   middle of the roster (Yuji 1.75, Nanami 1.845, Toji 1.90, Yaga 1.99) with
//   muscle 1.00 and bulk 1.00, WHICH NO OTHER CHARACTER IN THE PROJECT TAKES.
//   Everyone else is pushed somewhere. He is the baseline, and standing him
//   next to Yaga or Todo is the entire joke.
//   The supplied art also shows a SLIGHT PAUNCH and a soft chest on the bare
//   half. Built (torsoShape waist 1.06 against a chest of 1.00 — the only
//   inverted torso profile in the project), because "unremarkable build"
//   drawn with abdominals is not unremarkable, it is a hero with a lighter
//   spec.
//
// ---- HAIR, FROM EVERY ANGLE ---------------------------------------------
//   Quoted: "short, SLICKED BACK, BLACK hair, and LONG TAPERED SIDEBURNS that
//   REACH PAST HIS NOSE."
//     FRONT   a high flat forehead — the hair is swept off it entirely — and
//             the two sideburns hanging down the cheeks well below the eyes.
//             They are the single most identifiable thing about his face.
//     3/4     the slick runs in visible combed strands from the hairline to
//             the crown; the sideburn is a tapering wedge, wide at the temple
//             and pointed at the tip.
//     SIDE    the whole mass lies flat against the skull and continues past
//             the crown into a short blunt nape.
//     BACK    flat, with the strand grooves converging to a centre point.
//   Built as six slicked strand ribbons over a close cap, plus two tapered
//   sideburn wedges reaching to a point below the nose line.
//
// ---- FACE ---------------------------------------------------------------
//   "THICK EYEBROWS and eyes with SMALL LIGHT BROWN PUPILS." The small pupil
//   in a large sclera is the exact drawing convention for an eager, slightly
//   manic expression, and it is what makes him read as a comedian rather than
//   as a sorcerer. Built with eyeW 0.58 / eyeH 0.34 (large) and an iris at
//   0.26 of the eye height (small — the roster default is 0.42).
//
// ---- THE COSTUME, LAYER BY LAYER ----------------------------------------
//   Quoted: "the costume of the FIRST SUPERHERO THAT EVER MADE HIM LAUGH
//   HYSTERICALLY. It is a SKIN-TIGHT UNIFORM THAT IS SPLIT DOWN THE MIDDLE.
//   The LEFT SIDE is a LIGHT BLUE where there are TWO YELLOW STRIPES on both
//   the arm and leg. The RIGHT SIDE of his uniform is MISSING ENTIRELY,
//   revealing his bare chest, leg" — and the supplied art agrees exactly.
//     1  the blue half — HIS LEFT (screen right when he faces you), running
//        from the shoulder to the ankle, with a hard vertical edge down the
//        centre line of the body. Skin-tight, so it is painted onto the
//        existing limb geometry rather than built as a garment over it.
//     2  TWO YELLOW STRIPES on the upper left arm and two on the left leg.
//     3  a WHITE CHOKER at the throat with a small round smiling face on it.
//     4  a SMILING HEART SYMBOL on the left chest, in yellow.
//     5  a WHITE BELT with a ROUND SMILING FACE buckle.
//     6  RED GLOVES — BOTH HANDS, including the bare arm, with a flared cuff.
//     7  RED BOOTS — BOTH FEET, calf-high, with a folded-over cuff.
//   THE ASYMMETRY IS THE DESIGN. Both gloves and both boots are red even
//   though only one side of the suit exists, and that inconsistency is
//   canonical and is the funniest thing about the costume.
//
// ---- PALETTE (hex) ------------------------------------------------------
//   suit blue     #2f63b0     suit blue shade  #23508f
//   stripe yellow #e8dc4a     emblem yellow    #f0d848
//   white trim    #f2f2ee     white shade      #d2d2cc
//   red           #d8332e     red shade        #a8221f
//   skin          #f0cba4     skin shade       #cfa47c
//   hair          #14131a     brow             #14131a
//
// ---- KEY IDENTIFIERS, in the order a viewer finds them -------------------
//   1 the split costume       2 the sideburns
//   3 the red gloves on both hands, one of them on a bare arm
//   4 the smiley belt         5 the slicked hair and high forehead
//   6 AN UNATHLETIC STANCE — see art/anim/takaba.js. Weight on one hip,
//     shoulders slightly rounded, hands not up. He should look out of place in
//     every idle frame, which is the strongest thing about the design.
//
// ---- APPROXIMATED, and stated rather than hidden ------------------------
//   · THE EXACT BLUE. References run from a light periwinkle to a mid royal.
//     Built at #2f63b0, a mid blue, because a light one against #f0cba4 skin
//     is the exact value-adjacency failure nanami.js's header documents — the
//     bare half and the clothed half would read as one surface.
//   · THE CHEST EMBLEM'S EXACT OUTLINE. It reads as a heart with a smile in
//     the supplied art and is described as "a smiling heart symbol"; built as
//     a rounded heart with a drawn arc mouth and two dot eyes.
//   · WHAT IS UNDER THE SUIT ON THE BARE SIDE below the belt. Canon is
//     explicit that the costume is indecent; this build puts a plain blue
//     brief line across both hips, because the alternative is not something to
//     put in a character-select rotation.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel } from '../builders/humanoid.js';
import { latheY, tGeo, ribbonShell, sphereShell, roundBox, shapeExtrude } from '../builders/geo.js';
import { v3 } from '../../../core/math.js';

const BLUE = 0x2f63b0;
const BLUE_DK = 0x23508f;
const STRIPE = 0xe8dc4a;
const EMBLEM = 0xf0d848;
const WHITE = 0xf2f2ee;
const WHITE_DK = 0xd2d2cc;
const RED = 0xd8332e;
const RED_DK = 0xa8221f;
const SKIN = 0xf0cba4;
const HAIR = 0x14131a;

// A SMILING FACE — the motif that appears three times on the costume (choker,
// belt buckle, chest emblem). One builder, three sizes, so they are visibly
// the same mark rather than three drawings of a smile.
function smiley(bag, bone, cx, cy, cz, r, faceColor, inkColor) {
  bag.add('flat', tGeo(new THREE.CircleGeometry(r, 16), { pos: [cx, cy, cz] }), { bone, color: faceColor });
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(new THREE.CircleGeometry(r * 0.13, 8),
      { pos: [cx + s * r * 0.34, cy + r * 0.22, cz + 0.0015] }), { bone, color: inkColor });
  }
  // the mouth: a shallow arc built from five short bars, which under the toon
  // shader reads cleaner than a torus at this size
  for (let i = 0; i < 5; i++) {
    const u = i / 4 - 0.5;
    bag.add('flat', tGeo(roundBox(r * 0.20, r * 0.10, 0.002, 0.001),
      { rot: [0, 0, -u * 58], pos: [cx + u * r * 0.86, cy - r * (0.18 + u * u * 0.9), cz + 0.0015] }),
      { bone, color: inkColor });
  }
}

export function buildTakaba() {
  const spec = {
    id: 'takaba', name: 'Takaba', H: 1.80, headScale: 1.0,
    // THE BASELINE SPEC. Nothing here is pushed anywhere.
    shoulder: 0.113, hip: 0.053, muscle: 1.00, bulk: 1.00, legBulk: 1.00,
    skinTone: SKIN,
    // The limbs are painted per-side below, so the shared cloth colour is the
    // SKIN — the builder's default sleeve becomes the bare arm, and the blue
    // is added over the left one.
    clothColor: SKIN, sleeveColor: SKIN, pantColor: SKIN, shoeColor: RED,
    // THE ONLY INVERTED TORSO PROFILE IN THE PROJECT: waist wider than chest.
    torsoShape: { chest: 1.00, waist: 1.06, hip: 1.00 },
    shoulderCap: false,
    face: { jaw: 1.02, chin: 1.0, width: 1.0 },
    shoe: { len: 0.128, hgt: 0.060 },
    palette: {
      rim: 0xffe0c0, hairRim: 0xbfd0ff, outline: 0x120e14,
      metalRim: 0xdfe8ff, accent: 0xff4d7a, energy: 0xffd84a
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ========================================================================
  // THE SPLIT — his LEFT side clothed, his RIGHT side bare
  // ========================================================================
  // It is SKIN-TIGHT, so the blue is a shell hugging the existing geometry
  // rather than a garment hanging off it. A half-lathe (phiStart/phiLength)
  // gives the hard vertical edge down the centre line that the design needs;
  // anything softer and it reads as a torn shirt instead of as half a suit.
  // A half-lathe: the same profile the torso already has, with every triangle
  // on the BARE side dropped, so the edge down the centre line is a real
  // geometric boundary rather than a colour blend across shared vertices.
  const halfShell = (rProfile, seg, zScale) => {
    // LatheGeometry is INDEXED, so the position attribute is a vertex pool
    // rather than a triangle soup — walking it three at a time reads garbage
    // and the first bench pass produced a shell with no visible triangles at
    // all. De-index first, then every three positions really are one triangle.
    const lathe = latheY(rProfile, seg, zScale);
    const g = lathe.index ? lathe.toNonIndexed() : lathe;
    const p = g.getAttribute('position');
    // drop every triangle whose centroid is on the bare side
    const keep = [];
    for (let i = 0; i < p.count; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      if (cx > -0.001) keep.push(i);
    }
    const pos = new Float32Array(keep.length * 9);
    keep.forEach((i, k) => {
      for (let v = 0; v < 3; v++) {
        pos[k * 9 + v * 3] = p.getX(i + v);
        pos[k * 9 + v * 3 + 1] = p.getY(i + v);
        pos[k * 9 + v * 3 + 2] = p.getZ(i + v);
      }
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    out.computeVertexNormals();
    return out;
  };
  // the blue torso half, a hair proud of the body so it does not z-fight
  // The profile has to CLEAR the torso lathe the builder already made, which
  // is radius x bulk x the zScale it used — the first pass sat a hair inside
  // it at the waist and the blue was simply not there on the bench. It is now
  // 8% proud of the body all the way up, which is still skin-tight and is
  // outside every point of the underlying surface.
  bag.add('cloth', halfShell([
    [0.086 * H, 0.470 * H], [0.092 * H, 0.560 * H], [0.096 * H, 0.660 * H],
    [0.094 * H, 0.740 * H], [0.078 * H, 0.800 * H], [0.058 * H, 0.828 * H]
  ], 22, 0.80), { chain: torsoChain, color: BLUE, blend: 0.05 });
  // the centre-line seam — a thin darker strip right down the middle, which is
  // what makes the edge read as DELIBERATE rather than as a clipping artefact
  bag.add('cloth', tGeo(roundBox(0.009 * H, 0.360 * H, 0.014 * H, 0.003),
    { pos: [0, 0.645 * H, 0.074 * H] }), { chain: torsoChain, color: BLUE_DK, blend: 0.05 });

  // ---- THE LEFT SLEEVE AND LEG, WITH THE TWO YELLOW STRIPES --------------
  {
    const sh = joints.get('UpArmL'), el = joints.get('LoArmL'), wr = joints.get('HandL');
    // upper arm
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.036 * H, 0.031 * H, 0.170 * H, 12),
      { pos: [(sh.x + el.x) / 2, (sh.y + el.y) / 2, (sh.z + el.z) / 2], rot: [0, 0, 9] }),
      { bone: 'UpArmL', color: BLUE });
    // TWO YELLOW STRIPES, on the upper arm — quoted, and they are the only
    // graphic on the sleeve
    for (const k of [0.34, 0.52]) {
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0375 * H, 0.0355 * H, 0.020 * H, 12),
        { pos: [sh.x + (el.x - sh.x) * k, sh.y + (el.y - sh.y) * k, sh.z + (el.z - sh.z) * k], rot: [0, 0, 9] }),
        { bone: 'UpArmL', color: STRIPE });
    }
    // forearm
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.030 * H, 0.026 * H, 0.150 * H, 12),
      { pos: [(el.x + wr.x) / 2, (el.y + wr.y) / 2, (el.z + wr.z) / 2], rot: [0, 0, 5] }),
      { bone: 'LoArmL', color: BLUE });
    // shoulder cap over the seam
    bag.add('cloth', tGeo(sphereShell(0.045 * H, { thetaLength: Math.PI * 0.6 }),
      { pos: [sh.x, sh.y + 0.004 * H, sh.z] }), { bone: 'UpArmL', color: BLUE });
  }
  {
    const th = joints.get('ThighL'), kn = joints.get('ShinL'), ft = joints.get('FootL');
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.050 * H, 0.040 * H, 0.230 * H, 12),
      { pos: [(th.x + kn.x) / 2, (th.y + kn.y) / 2, (th.z + kn.z) / 2] }), { bone: 'ThighL', color: BLUE });
    for (const k of [0.36, 0.54]) {
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0515 * H, 0.0475 * H, 0.022 * H, 12),
        { pos: [th.x + (kn.x - th.x) * k, th.y + (kn.y - th.y) * k, th.z + (kn.z - th.z) * k] }),
        { bone: 'ThighL', color: STRIPE });
    }
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.038 * H, 0.028 * H, 0.200 * H, 12),
      { pos: [(kn.x + ft.x) / 2, (kn.y + ft.y) / 2 + 0.01 * H, (kn.z + ft.z) / 2] }), { bone: 'ShinL', color: BLUE });
  }
  // the brief line across both hips — see the APPROXIMATED note in the header
  bag.add('cloth', latheY([[0.076 * H, 0.440 * H], [0.080 * H, 0.500 * H]], 18, 0.80),
    { bone: 'Hips', color: BLUE_DK });

  // ========================================================================
  // RED GLOVES — BOTH HANDS. One of them on a bare arm, which is the joke.
  // ========================================================================
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0285 * H, 0.0265 * H, 0.070 * H, 12),
      { pos: [wr.x, wr.y - 0.014 * H, wr.z] }), { bone: 'Hand' + s, color: RED });
    // FLARED CUFF — the gauntlet lip, and it is what makes them read as
    // SUPERHERO gloves rather than as work gloves
    bag.add('cloth', tGeo(latheY([[0.030 * H, 0], [0.040 * H, 0.042 * H]], 14, 0.92),
      { pos: [wr.x, wr.y + 0.012 * H, wr.z] }), { bone: 'LoArm' + s, color: RED });
    bag.add('cloth', tGeo(latheY([[0.0405 * H, 0.042 * H], [0.0395 * H, 0.050 * H]], 14, 0.92),
      { pos: [wr.x, wr.y + 0.012 * H, wr.z] }), { bone: 'LoArm' + s, color: RED_DK });
  }

  // ========================================================================
  // RED BOOTS — BOTH FEET, calf-high with a folded-over cuff
  // ========================================================================
  for (const s of ['L', 'R']) {
    const ft = joints.get('Foot' + s), kn = joints.get('Shin' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.040 * H, 0.034 * H, 0.150 * H, 12),
      { pos: [ft.x, ft.y + 0.085 * H, ft.z] }), { bone: 'Shin' + s, color: RED });
    // the fold-over
    bag.add('cloth', tGeo(latheY([[0.042 * H, 0.150 * H], [0.048 * H, 0.176 * H], [0.044 * H, 0.192 * H]], 14, 0.92),
      { pos: [ft.x, ft.y, ft.z] }), { bone: 'Shin' + s, color: RED });
    // heel block
    bag.add('cloth', tGeo(roundBox(0.052 * H, 0.020 * H, 0.048 * H, 0.006),
      { pos: [ft.x, ft.y - 0.030 * H, ft.z - 0.030 * H] }), { bone: 'Foot' + s, color: 0x3a1a18 });
  }

  // ========================================================================
  // THE THREE SMILEYS AND THE HEART
  // ========================================================================
  // 1 — THE CHOKER, a white band at the throat with a small face on it
  bag.add('cloth', tGeo(latheY([[0.042 * H, 0], [0.044 * H, 0.026 * H]], 16, 0.88),
    { pos: [0, 0.822 * H, 0] }), { bone: 'Neck', color: WHITE });
  smiley(bag, 'Neck', 0, 0.833 * H, 0.043 * H, 0.014 * H, EMBLEM, 0x2a2418);

  // 2 — THE BELT, white, with the round smiling buckle
  bag.add('cloth', latheY([[0.081 * H, 0.478 * H], [0.084 * H, 0.508 * H]], 20, 0.80),
    { bone: 'Hips', color: WHITE });
  bag.add('cloth', latheY([[0.0815 * H, 0.474 * H], [0.0825 * H, 0.480 * H]], 20, 0.80),
    { bone: 'Hips', color: WHITE_DK });
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.030 * H, 0.030 * H, 0.010 * H, 18),
    { rot: [90, 0, 0], pos: [0, 0.493 * H, 0.063 * H] }), { bone: 'Hips', color: WHITE });
  smiley(bag, 'Hips', 0, 0.493 * H, 0.069 * H, 0.024 * H, EMBLEM, 0x2a2418);

  // 3 — THE SMILING HEART on the left chest
  {
    // a heart as two lobes and a point, drawn flat against the blue
    const R = 0.030 * H;
    for (const s of [1, -1]) {
      bag.add('flat', tGeo(new THREE.CircleGeometry(R * 0.62, 14),
        { pos: [0.044 * H + s * R * 0.52, 0.706 * H + R * 0.36, 0.088 * H] }), { chain: torsoChain, color: EMBLEM, blend: 0.04 });
    }
    bag.add('flat', tGeo(shapeExtrude([
      [-R * 1.10, R * 0.42], [R * 1.10, R * 0.42], [0, -R * 1.15]
    ], 0.002 * H), { pos: [0.044 * H, 0.706 * H, 0.088 * H] }), { chain: torsoChain, color: EMBLEM, blend: 0.04 });
    // the face on it
    for (const s of [1, -1]) {
      bag.add('flat', tGeo(new THREE.CircleGeometry(R * 0.11, 8),
        { pos: [0.044 * H + s * R * 0.36, 0.706 * H + R * 0.30, 0.090 * H] }), { chain: torsoChain, color: 0x2a2418, blend: 0.04 });
    }
    for (let i = 0; i < 5; i++) {
      const u = i / 4 - 0.5;
      bag.add('flat', tGeo(roundBox(R * 0.22, R * 0.09, 0.002, 0.001),
        { rot: [0, 0, -u * 58], pos: [0.044 * H + u * R * 0.9, 0.706 * H - R * (0.10 + u * u * 0.85), 0.080 * H] }),
        { chain: torsoChain, color: 0x2a2418, blend: 0.04 });
    }
  }

  // ========================================================================
  // THE FACE — big eyes, small light-brown pupils, thick brows
  // ========================================================================
  addFace(ctx, {
    eyeW: 0.58, eyeH: 0.34, eyeColor: 0xb08048, browTilt: 12, browUp: 1.35,
    browColor: HAIR, lashColor: 0x14131a, mouthW: 0.32, mouthColor: 0x8a4a44,
    mouthTilt: 0
  });
  // OVERRIDE THE IRIS. addFace draws one at 0.42 of the eye height; his is
  // quoted as SMALL, and the small pupil in a large sclera is the whole
  // expression. A second, smaller iris is drawn proud of the first, in the
  // light brown the source names.
  {
    const faceZ = headC.z + headR * 0.615;
    const eyeY = headC.y - headR * 0.10;
    const eyeW = headR * 0.58, eyeH = headR * 0.34;
    for (const s of [1, -1]) {
      const ex = s * headR * 0.40;
      bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.44, 12),
        { pos: [ex - s * eyeW * 0.06, eyeY + eyeH * 0.04, faceZ + headR * 0.030] }),
        { bone: 'Head', color: 0xf2f4f8 });
      bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.26, 10),
        { pos: [ex - s * eyeW * 0.06, eyeY + eyeH * 0.05, faceZ + headR * 0.034] }),
        { bone: 'Head', color: 0xb08048 });
      bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.09, 8),
        { pos: [ex - s * eyeW * 0.02, eyeY + eyeH * 0.14, faceZ + headR * 0.038] }),
        { bone: 'Head', color: 0xffffff });
    }
  }

  // ---- HAIR: SLICKED BACK, WITH THE SIDEBURNS ----------------------------
  // the close cap, lying flat on the skull
  // Pulled BACK and DOWN off the brow: the defining thing about the face is a
  // high flat forehead, and the first pass's cap came forward over it and read
  // as a bowl cut.
  bag.add('hair', tGeo(sphereShell(headR * 1.035, { thetaLength: Math.PI * 0.36, scale: [0.94, 0.72, 1.00] }),
    { pos: [headC.x, headC.y + headR * 0.34, headC.z - headR * 0.16] }), { bone: 'Head', color: HAIR });
  // SIX COMBED STRANDS running front-to-back — the slick, and the reason the
  // forehead reads as HIGH rather than as bald
  for (let i = 0; i < 6; i++) {
    const u = i / 5 - 0.5;
    const p0 = v3(headC.x + u * headR * 1.10, headC.y + headR * 0.86, headC.z + headR * 0.28);
    const p1 = v3(headC.x + u * headR * 1.26, headC.y + headR * 0.94, headC.z - headR * 0.10);
    const p2 = v3(headC.x + u * headR * 1.08, headC.y + headR * 0.56, headC.z - headR * 0.88);
    bag.add('hair', ribbonShell([p0, p1, p2], v => headR * 0.125 * (1 - Math.abs(v - 0.5) * 0.5), 0.009,
      { seg: 6, normalHint: v3(u, 0.8, 0) }), { bone: 'Head', color: HAIR });
  }
  // the blunt nape
  bag.add('hair', tGeo(sphereShell(headR * 1.05, {
    thetaStart: Math.PI * 0.40, thetaLength: Math.PI * 0.24,
    phiStart: Math.PI * 1.10, phiLength: Math.PI * 0.80, scale: [0.98, 1, 0.92]
  }), { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.06] }), { bone: 'Head', color: HAIR });
  // ---- THE SIDEBURNS -----------------------------------------------------
  // "LONG TAPERED SIDEBURNS THAT REACH PAST HIS NOSE." The nose sits at
  // headC.y - 0.34R, so the tips are taken to -0.52R, comfortably past it.
  // Wide at the temple, pointed at the tip, lying flat against the cheek.
  for (const s of [1, -1]) {
    bag.add('hair', ribbonShell([
      v3(headC.x + s * headR * 0.86, headC.y + headR * 0.40, headC.z + headR * 0.34),
      v3(headC.x + s * headR * 0.90, headC.y - headR * 0.08, headC.z + headR * 0.40),
      v3(headC.x + s * headR * 0.80, headC.y - headR * 0.56, headC.z + headR * 0.42)
    ], u => headR * 0.26 * (1 - u * 0.78), 0.014, { seg: 7, normalHint: v3(s * 0.9, 0.1, 0.45) }),
      { bone: 'Head', color: HAIR });
  }

  // NO SPRINGS. A skin-tight suit has nothing to swing, and giving him cloth
  // motion would put weight into a silhouette whose whole job is to have none.
  return finalizeModel(ctx, { springs: [], outlineThickness: 0.0125 });
}
