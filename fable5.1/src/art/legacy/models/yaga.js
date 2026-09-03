// YAGA MASAMICHI 夜蛾正道 — the principal of Tokyo Jujutsu High.
//
// ======================== REFERENCE SHEET ================================
// Researched 2026-08-20 against the reference art supplied with the brief
// (full-body 2017 turnaround) plus the ORICON character profile, the Baidu
// profile, CBR's and Looper's technique explainers and Poggers' character
// analysis. jujutsu-kaisen.fandom.com is BLOCKED from this session's proxy, so
// the wiki's own turnaround was not readable — every clause below is either
// off the supplied art or off one of those five text sources, and the two
// places where I had to make a call are marked APPROXIMATED.
//
// ---- BUILD AND HEIGHT, RELATIVE TO THE ROSTER ---------------------------
//   192 cm, quoted. That is the TALLEST HUMAN IN THIS GAME and it is not
//   close: Toji 1.90, Todo 1.87, Nanami 1.845, Yuki 1.80, the students
//   1.72-1.78. Built here at H = 1.99 in game units, which is the same scaling
//   every other character takes (the roster runs ~4% over the quoted figure so
//   that the tallest bodies still read at fighting distance).
//   "A tall man with a MUSCULAR FRAME and TAN SKIN." So: muscle 1.30 and bulk
//   1.22 — the heaviest human spec in the project, above Todo's 1.26/1.18 —
//   with the mass carried in the CHEST AND SHOULDERS rather than the waist.
//   The supplied art is emphatic about this: the jacket is straining at the
//   shoulder seam and hanging loose at the hip.
//
// ---- HEAD AND FACE ------------------------------------------------------
//   Square, heavy-jawed, broad. Thick neck running straight into the trapezius
//   with no taper — on the supplied art there is barely a neck at all.
//   THICK EYEBROWS, quoted, and they sit low.
//   THE EYES ARE NEVER VISIBLE. Every reference has the sunglasses on.
//
// ---- HAIR, FROM EVERY ANGLE ---------------------------------------------
//   Quoted: "short, SPIKY, DARK BROWN hair on top with THE REST OF HIS HEAD
//   SHAVED." So this is NOT a mohawk and NOT a flat-top:
//     FRONT   a low block of short upright spikes across the crown, with a
//             hard horizontal edge where it stops and the shaved skin begins.
//     3/4     the block is as wide as the skull — it is not a strip.
//     SIDE    the shaved sides are BARE SKIN with a shadow of stubble, and the
//             transition is a step, not a fade.
//     BACK    the block stops at the crown; the whole occiput is shaved.
//   Built as 14 short upright spike cards on a shallow cap, plus a separate
//   stubble shell over the shaved skull in a darker tone of the skin.
//
// ---- FACIAL HAIR --------------------------------------------------------
//   Quoted: "a MUSTACHE and GOATEE combination." The supplied art shows them
//   JOINED — a full circle beard round the mouth with the chin patch running
//   down past the jawline — but the cheeks bare. Built exactly that way: a
//   mustache bar, two thin corner strips, and a chin block.
//
// ---- THE SUNGLASSES — the key identifier --------------------------------
//   "He only started wearing sunglasses after becoming the principal." They
//   are on in every reference from that point and they are the first thing
//   anybody draws. The supplied art has SMALL OVAL LENSES on thin dark wire,
//   sitting low on the nose with the brow visible above them.
//   Built as REAL GEOMETRY with a genuine lens material: a dark, glossy,
//   heavily-rimmed toon material at 8 shading steps rather than the roster's
//   3-4, because a lens is the one surface in this project that has to look
//   SMOOTH under a cel shader. Frames, bridge, temples and hinge lugs are
//   separate metal geometry.
//
// ---- GARMENTS, LAYER BY LAYER (the 2017 look, which is the supplied art) --
//   Quoted: "In 2017 he wore a WHITE DRESS SHIRT underneath a BLACK JACKET
//   with MATCHING PANTS AND SHOES." (The 2018 look is a zipped-up black
//   jacket; the 2017 suit is the more recognisable silhouette and is what the
//   brief supplied, so it is what is built.)
//     1  white dress shirt, COLLAR OPEN, NO TIE, top button undone
//     2  dark suit jacket, UNBUTTONED and hanging open, notched lapels,
//        two-button front left undone, back vent
//     3  matching dark trousers, full break over the shoe
//     4  BROWN LEATHER BELT with a plain rectangular steel buckle — the only
//        warm colour on the whole costume and the thing that stops him reading
//        as a silhouette
//     5  black leather derbies
//
// ---- PALETTE (hex) ------------------------------------------------------
//   suit          #23242e     suit shadow   #15161e
//   lapel face    #2b2c37     shirt         #f0eee8
//   shirt shadow  #cfcdc6     belt          #4a3526
//   buckle        #b0b4bc     shoe          #14151a
//   skin          #c9976a     skin shadow   #a87a52
//   hair          #33241a     stubble       #a8794f
//   lens          #15171f     frame         #2a2c34
//
// ---- KEY IDENTIFIERS, in the order a viewer finds them -------------------
//   1 the sunglasses      2 the mass (he is the widest human on screen)
//   3 the shaved sides with the spiky block on top
//   4 the circle beard    5 the open jacket over a white shirt with no tie
//   6 ARMS FOLDED AT REST — see the STANCE in art/anim/yaga.js. He stands like
//     a teacher waiting for an answer, not like a fighter.
//
// ---- APPROXIMATED, and stated rather than hidden ------------------------
//   · THE EXACT LENS SHAPE. The supplied art is small and the lenses read as
//     oval; some other art reads them as squared. Built oval, at the size the
//     supplied art shows.
//   · THE SHOE PATTERN. No reference resolves it. Built as plain derbies.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, ribbonShell, sphereShell, roundBox, shapeExtrude } from '../builders/geo.js';
import { MAT, toonMaterial } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3, DEG } from '../../../core/math.js';

const SUIT = 0x23242e;
const SUIT_DK = 0x15161e;
const LAPEL = 0x2b2c37;
const SHIRT = 0xf0eee8;
const SHIRT_DK = 0xcfcdc6;
const BELT = 0x4a3526;
const BUCKLE = 0xb0b4bc;
const SKIN = 0xc9976a;
const HAIR = 0x33241a;
const STUBBLE = 0x6f4f33;   // the shaved skull reads as SHAVED, not as bald
const FRAME = 0x2a2c34;

// ---- THE LENS MATERIAL ----------------------------------------------------
// The one surface in this model that must not be cel-shaded like cloth. Eight
// bands instead of three, high gloss and a hard early rim: under the toon
// shader that reads as a smooth, dark, curved piece of glass with a highlight
// running across it, which is what a sunglass lens is and what nothing else in
// the project needed.
const lensMat = () => toonMaterial({
  vertexColors: false,
  steps: [10, 22, 38, 58, 84, 118, 168, 236],
  rim: 0.72, rimStart: 0.44, gloss: 0.95,
  color: 0x15171f, rimColor: 0xdfe8ff, warm: 0x0a0c12, cool: 0x0a1022
});

export function buildYaga() {
  const spec = {
    id: 'yaga', name: 'Yaga', H: 1.99, headScale: 0.94,
    // THE HEAVIEST HUMAN SPEC IN THE PROJECT. Wide shoulders, narrow-ish hips,
    // and the mass in the chest — the supplied art's silhouette is a wedge.
    shoulder: 0.136, hip: 0.058, muscle: 1.36, bulk: 1.30, legBulk: 1.30,
    skinTone: SKIN, clothColor: SUIT, pantColor: 0x1e1f28, shoeColor: 0x14151a,
    torsoShape: { chest: 1.26, waist: 1.08, hip: 1.00 },
    shoulderCap: true,
    // square, heavy-jawed, broad
    face: { jaw: 1.26, chin: 1.10, width: 1.04 },
    shoe: { len: 0.132, hgt: 0.052 },
    palette: {
      rim: 0xffd6a8, hairRim: 0xffe8c0, outline: 0x0b0a10,
      metalRim: 0xdfe8ff, accent: 0xb59a68, energy: 0xd8c08a
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ========================================================================
  // LAYER 1 — THE WHITE DRESS SHIRT
  // ========================================================================
  // It runs the full length of the open jacket, because the jacket is
  // UNBUTTONED and most of what a viewer sees between the lapels is shirt.
  // This is the same lesson nanami.js records in its own header: a suit panel
  // that is only a triangle at the collar reads as a bookmark on bare chest.
  bag.add('cloth', tGeo(shapeExtrude([
    [-0.056 * H, 0.096 * H], [0.056 * H, 0.096 * H],
    [0.046 * H, -0.070 * H], [0.026 * H, -0.168 * H],
    [-0.026 * H, -0.168 * H], [-0.046 * H, -0.070 * H]
  ], 0.009 * H), { rot: [9, 0, 0], pos: [0, 0.742 * H, 0.078 * H] }),
    { chain: torsoChain, color: SHIRT, blend: 0.04 });
  // the placket, and the shadow down the fold
  bag.add('cloth', tGeo(roundBox(0.011 * H, 0.235 * H, 0.005 * H, 0.002),
    { rot: [9, 0, 0], pos: [0, 0.730 * H, 0.086 * H] }), { chain: torsoChain, color: SHIRT_DK, blend: 0.04 });
  // ---- THE OPEN COLLAR, NO TIE -------------------------------------------
  // Two spread points standing away from the neck with the top button undone.
  // The absence of a tie is a real identifier: he is the only suited man in
  // the roster without one (Nanami has a patterned tie, Higuruma a loose one).
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0.012 * H], [s * 0.042 * H, 0.020 * H], [s * 0.034 * H, -0.040 * H], [0, -0.024 * H]
    ], 0.007 * H), { rot: [12, 0, s * -6], pos: [s * 0.006 * H, 0.826 * H, 0.056 * H] }),
      { bone: 'Neck', color: SHIRT });
  }
  // the collar band round the back of the neck
  bag.add('cloth', tGeo(latheY([[0.040 * H, 0], [0.042 * H, 0.020 * H]], 14, 0.86),
    { pos: [0, 0.828 * H, -0.004 * H] }), { bone: 'Neck', color: SHIRT });

  // ========================================================================
  // LAYER 2 — THE SUIT JACKET, HANGING OPEN
  // ========================================================================
  // NOTCHED LAPELS, wide and low. On the supplied art they are the largest
  // shapes on the torso and they frame the whole chest.
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0.115 * H], [s * 0.058 * H, 0.086 * H], [s * 0.072 * H, 0.040 * H],
      [s * 0.055 * H, 0.052 * H], [s * 0.030 * H, -0.072 * H], [s * 0.010 * H, -0.072 * H]
    ], 0.006 * H), { rot: [17, 0, 0], pos: [0, 0.712 * H, 0.066 * H] }),
      { chain: torsoChain, color: LAPEL, blend: 0.04 });
    // the jacket front panel outboard of the lapel — this is what makes the
    // coat read as HANGING OPEN rather than as a painted-on stripe
    bag.add('cloth', tGeo(shapeExtrude([
      [s * 0.048 * H, 0.100 * H], [s * 0.100 * H, 0.086 * H],
      [s * 0.104 * H, -0.160 * H], [s * 0.040 * H, -0.150 * H]
    ], 0.008 * H), { rot: [12, 0, 0], pos: [0, 0.700 * H, 0.058 * H] }),
      { chain: torsoChain, color: SUIT, blend: 0.05 });
  }
  // two front buttons, both undone, sitting on the left panel
  for (const b of [0, 1]) {
    bag.add('metal', tGeo(new THREE.CylinderGeometry(0.006 * H, 0.006 * H, 0.003 * H, 8),
      { rot: [90, 0, 0], pos: [0.086 * H, (0.618 - b * 0.048) * H, 0.062 * H] }),
      { chain: torsoChain, color: 0x3a3b46, blend: 0.05 });
  }
  // jacket hem — it hangs past the hip, wide, and it is where the coat's
  // weight lives
  bag.add('cloth', latheY([
    [0.098 * H, 0.400 * H], [0.096 * H, 0.452 * H], [0.090 * H, 0.500 * H]
  ], 22, 0.82), { bone: 'Hips', color: SUIT });
  // SHOULDER PADS — squared, and they are the silhouette. Bigger than
  // Nanami's, because the supplied art's shoulder line is nearly flat.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s);
    // SQUARED, NOT ROUNDED, and small enough to be a shoulder line rather than
    // a pauldron: the first bench pass had these reading as water wings.
    bag.add('cloth', tGeo(roundBox(0.052 * H, 0.022 * H, 0.058 * H, 0.006 * H),
      { rot: [0, 0, (s === 'L' ? -1 : 1) * 4], pos: [sh.x + (s === 'L' ? 1 : -1) * 0.002 * H, sh.y + 0.009 * H, sh.z] }),
      { bone: 'UpArm' + s, color: SUIT });
    // sleeve cuff + a sliver of white shirt cuff under it
    const wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0195 * H, 0.021 * H, 0.022 * H, 10),
      { pos: [wr.x, wr.y + 0.011 * H, wr.z] }), { bone: 'LoArm' + s, color: SHIRT });
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.024 * H, 0.026 * H, 0.034 * H, 10),
      { pos: [wr.x, wr.y + 0.034 * H, wr.z] }), { bone: 'LoArm' + s, color: SUIT });
  }

  // ========================================================================
  // LAYER 4 — THE BELT. The only warm colour on the costume.
  // ========================================================================
  bag.add('cloth', latheY([
    [0.079 * H, 0.494 * H], [0.081 * H, 0.516 * H]
  ], 20, 0.80), { bone: 'Hips', color: BELT });
  bag.add('metal', tGeo(roundBox(0.034 * H, 0.024 * H, 0.010 * H, 0.003),
    { pos: [0, 0.505 * H, 0.064 * H] }), { bone: 'Hips', color: BUCKLE });
  bag.add('metal', tGeo(roundBox(0.024 * H, 0.014 * H, 0.004 * H, 0.002),
    { pos: [0, 0.505 * H, 0.069 * H] }), { bone: 'Hips', color: 0x8c9098 });

  // ========================================================================
  // THE HEAD
  // ========================================================================
  // Thick low brows, and NO VISIBLE EYES — the lenses cover them completely, so
  // the eyes are built (a viewer catching him from below at the right angle
  // gets a hint of them through the glass) but the lash line is heavy and the
  // sclera small.
  addFace(ctx, {
    eyeW: 0.42, eyeH: 0.19, eyeColor: 0x3a2a1c, browTilt: 8, browUp: 1.75,
    browColor: 0x2a1d12, lashColor: 0x120c06,
    mouthW: 0.24, mouthColor: 0x4a2c26
  });
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- THE SUNGLASSES ----------------------------------------------------
  // Real geometry, five components, and the lenses get their own material.
  // They are sized to actually COVER the eyes — the first bench pass had them
  // as thin rings with the eyes reading straight through, which is the one
  // thing this identifier cannot do.
  // THE LENSES GO IN THEIR OWN PART-BAG SLOT, not on the bone as a raw mesh.
  // A raw mesh parented to a THREE.Bone gets the bone's BIND transform applied
  // on top of geometry that is already authored in model space, so it ends up
  // about a metre and a half above his head — which is exactly where the first
  // two bench passes put it, and why the lenses were simply absent. A named
  // slot is skinned like every other piece of him and gets its own material
  // through `finalizeModel`'s `materials` override.
  const frameMat = { bone: 'Head', color: FRAME };
  const LR = headR * 0.30;              // lens radius
  const LX = headR * 0.40;              // lens centre, matching addFace's eyes
  const LY = eyeY + headR * 0.015;
  const LZ = faceZ + headR * 0.085;
  for (const s2 of [1, -1]) {
    // LENS — an oval disc sitting proud of the face plane, canted back at the
    // top the way glasses actually sit on a nose.
    bag.add('lens', tGeo(new THREE.CircleGeometry(LR, 22), {
      scale: [1.0, 0.78, 1], rot: [-9, s2 * 7, 0], pos: [s2 * LX, LY, LZ]
    }), { bone: 'Head', color: 0xffffff });
    // FRAME — a ring round the lens
    bag.add('metal', tGeo(new THREE.TorusGeometry(LR, headR * 0.026, 6, 20),
      { scale: [1.0, 0.78, 1], rot: [-9, s2 * 7, 0], pos: [s2 * LX, LY, LZ - headR * 0.004] }), frameMat);
    // TEMPLE — back along the side of the skull to the ear
    bag.add('metal', tGeo(roundBox(headR * 0.66, headR * 0.024, headR * 0.024, 0.002),
      { rot: [0, s2 * 74, 0], pos: [s2 * headR * 0.82, LY + headR * 0.08, faceZ - headR * 0.52] }), frameMat);
    // HINGE LUG
    bag.add('metal', tGeo(roundBox(headR * 0.06, headR * 0.036, headR * 0.032, 0.002),
      { pos: [s2 * headR * 0.66, LY + headR * 0.07, LZ - headR * 0.10] }), frameMat);
  }
  // BRIDGE
  bag.add('metal', tGeo(roundBox(headR * 0.18, headR * 0.030, headR * 0.026, 0.002),
    { pos: [0, LY + headR * 0.06, LZ - headR * 0.01] }), frameMat);

  // ---- FACIAL HAIR: MUSTACHE + JOINED GOATEE -----------------------------
  // A CIRCLE BEARD: a wide mustache bar, two thin corner strips running down to
  // the jaw, and a chin patch — with the cheeks bare. Built out of curved
  // shells rather than boxes, because the first pass's rectangles read as a
  // mouth guard rather than as hair.
  const beard = { bone: 'Head', color: HAIR };
  // mustache — wide, thin, and it follows the curve of the lip
  bag.add('hair', tGeo(latheY([
    [headR * 0.26, 0], [headR * 0.31, headR * 0.045], [headR * 0.28, headR * 0.09], [headR * 0.18, headR * 0.13]
  ], 16, 0.40), { rot: [14, 0, 0], pos: [0, headC.y - headR * 0.505, faceZ - headR * 0.045] }), beard);
  // the two corner strips down to the jawline
  for (const s2 of [1, -1]) {
    bag.add('hair', ribbonShell([
      v3(s2 * headR * 0.20, headC.y - headR * 0.46, faceZ - headR * 0.06),
      v3(s2 * headR * 0.23, headC.y - headR * 0.63, faceZ - headR * 0.11),
      v3(s2 * headR * 0.17, headC.y - headR * 0.78, faceZ - headR * 0.17)
    ], u => headR * 0.075 * (1 - u * 0.35), 0.010, { seg: 5, normalHint: v3(s2 * 0.4, 0, 1) }), beard);
  }
  // the chin patch, sitting ON the chin and wrapping under it
  bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.30, 14, 12), {
    scale: [1.02, 0.92, 0.72],
    pos: [0, headC.y - headR * 0.685, faceZ - headR * 0.30]
  }), beard);

  // ---- HAIR: THE SPIKY BLOCK ON A SHAVED SKULL ---------------------------
  // THE SHAVED SIDES, as three small flattened patches — two temples and a
  // nape — in a darker tone of the skin.
  //
  // *** EXPLICIT PATCHES, NEVER A SHELL. *** This is the third attempt and the
  // reason is worth writing down: `animeHead` FLATTENS the front of the skull,
  // so ANY full-radius sphere shell wide enough to cover the sides also pokes
  // straight through the face plane. Two earlier passes did exactly that and
  // buried his eyes, his brows and his sunglasses — the sunglasses being the
  // single most important identifier on the character. A patch placed at a
  // stated position cannot do that.
  for (const s2 of [1, -1]) {
    bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.46, 12, 10), {
      scale: [0.30, 1.02, 0.92],
      pos: [s2 * headR * 0.86, headC.y + headR * 0.22, headC.z - headR * 0.12]
    }), { bone: 'Head', color: STUBBLE });
  }
  bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.62, 14, 10), {
    scale: [0.96, 0.80, 0.26],
    pos: [headC.x, headC.y + headR * 0.20, headC.z - headR * 0.82]
  }), { bone: 'Head', color: STUBBLE });

  // THE CAP the spikes sit on — a low block on the CROWN, stopping with a hard
  // edge above the temples. That edge is the haircut.
  bag.add('hair', tGeo(sphereShell(headR * 1.045, {
    thetaLength: Math.PI * 0.30, scale: [0.86, 0.44, 0.94]
  }), { pos: [headC.x, headC.y + headR * 0.40, headC.z - headR * 0.04] }), { bone: 'Head', color: HAIR });
  // A DENSE, SHORT CROP: twenty-two stubby spikes on the crown, all leaning
  // very slightly back. Short and close together — it is a crop, not a crown,
  // and the first pass's tall separated cones read as the latter.
  const ROWS = [
    { z: 0.40, n: 5, w: 0.42, h: 0.17 },
    { z: 0.16, n: 6, w: 0.52, h: 0.21 },
    { z: -0.10, n: 6, w: 0.52, h: 0.20 },
    { z: -0.36, n: 5, w: 0.42, h: 0.16 }
  ];
  for (const row of ROWS) {
    for (let i = 0; i < row.n; i++) {
      const u = row.n === 1 ? 0 : i / (row.n - 1) - 0.5;
      const x = u * headR * row.w * 2;
      const drop = headR * (u * u) * 0.30;    // the crown is domed
      const base = v3(headC.x + x, headC.y + headR * 0.86 - drop, headC.z + headR * row.z);
      const tip = v3(headC.x + x * 1.04, headC.y + headR * (0.86 + row.h) - drop, headC.z + headR * (row.z - 0.07));
      bag.add('hair', ribbonShell([base, base.clone().lerp(tip, 0.55), tip],
        u2 => headR * 0.10 * (1 - u2 * 0.45), 0.010, { seg: 3, normalHint: v3(u, 0.2, 0.5) }),
        { bone: 'Head', color: HAIR });
    }
  }

  // ========================================================================
  // SPRINGS — the two jacket front panels and the back vent
  // ========================================================================
  // A heavy coat hanging open is the whole reason he has springs: the panels
  // swing behind him when he moves and settle late, which is the only part of
  // the costume that communicates his MASS in motion.
  const clothMatS = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.009 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Chest', localOffset: v3(s * 0.086 * H, -0.075 * H, 0.048 * H),
      restDir: v3(s * 0.06, -1, 0.04).normalize(), stiffness: 62, damping: 0.86, gravity: 11,
      segments: [
        { len: 0.085 * H, mesh: makeFlapMesh(0.086 * H, 0.082 * H, 0.085 * H, 0.011, clothMatS, SUIT, oOpts) },
        { len: 0.075 * H, mesh: makeFlapMesh(0.082 * H, 0.074 * H, 0.075 * H, 0.010, clothMatS, SUIT, oOpts) }
      ]
    });
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.042 * H, -0.085 * H, -0.070 * H),
      restDir: v3(0, -1, -0.14).normalize(), stiffness: 58, damping: 0.88, gravity: 10,
      segments: [
        { len: 0.058 * H, mesh: makeFlapMesh(0.062 * H, 0.056 * H, 0.058 * H, 0.010, clothMatS, SUIT_DK, oOpts) },
        { len: 0.048 * H, mesh: makeFlapMesh(0.056 * H, 0.046 * H, 0.048 * H, 0.009, clothMatS, SUIT_DK, oOpts) }
      ]
    });
  }

    return finalizeModel(ctx, {
    springs, outlineThickness: 0.0145,
    // The lens slot gets the one material in the project authored to read as
    // GLASS under a cel shader — eight bands instead of three, high gloss and
    // a hard early rim. Deliberately NOT in `outlineSlots`: an inked lens
    // would read as a cartoon eye rather than as a dark curved surface.
    materials: { lens: lensMat() }
  });
}
