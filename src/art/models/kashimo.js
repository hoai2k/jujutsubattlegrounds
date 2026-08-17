// HAJIME KASHIMO — 禪院甚壱. THE GOD OF LIGHTNING.
// The Culling Game body (the young vessel Kenjaku prepared).
//
// ============================ REFERENCE SHEET ============================
// REBUILT FROM THE OFFICIAL CHARACTER SHEET (front view, full body, staff in
// the left hand). Everything below is read off that image rather than inferred
// from prose, which is what the previous four passes had to do — they were
// written without reference art and it showed: the hair had become an oversized
// cyan shell that swallowed the head, one forearm wrap floated free of the arm,
// and the staff was a two-metre black rod. All three are fixed here by building
// to the picture instead of to a description.
//
// WHAT THE SHEET ACTUALLY SHOWS, and every one of these is load-bearing:
//
// HAIR   MINT GREEN, not cyan. A light spring green with cool shadow. Short,
//        tousled, jagged bangs to the eyebrows, and the back stops at the nape
//        — there is NO long gathered tail. The silhouette is carried entirely
//        by TWO HORN-KNOTS standing on TOP of the skull, one either side of the
//        parting, each canted outward and forward and bound with two darker
//        wraps. They are horns in outline, not the round side-buns the old
//        build made: taller than they are wide, tapering, tips flicked out.
// EYES   GREEN, matching the hair, wide and calm under thick level brows. The
//        sheet shows NO lightning marks on the face, so the old under-eye bolt
//        geometry is gone; the charge read moves to the eyes, the hair tips and
//        the staff, which is where it should have been anyway — those are the
//        three things already in the reader's eye line.
// TOP    A white pullover with a BUNCHED FUNNEL COLLAR that swallows the neck
//        and stands as high as the jaw. Raglan seams from collar to underarm.
//        The sleeves are BALLOONED — wide and gathered — and stop just below
//        the elbow at a tight cuff. Body is loose with a soft gathered waist.
// ARMS   BANDAGE from the sleeve cuff to the wrist, wound in overlapping turns.
// LEGS   White trousers, very full, gathered and closed BELOW THE KNEE, with
//        BANDAGE wound down the shin from the cuff to the boot.
// BOOTS  Pale blue-grey ankle boots with a raised toe cap and a strap button
//        at the outer ankle. Not white — they are visibly cooler and darker
//        than the garment, and that is what separates the leg from the floor.
// STAFF  THE HEADLINE CORRECTION. It is a slim RED-ORANGE rod with polished
//        BRASS fittings: a domed brass cap at the top, a long brass ferrule at
//        the foot with an engraved band, and it stands about shoulder height —
//        not the black two-metre pole the old build carried. Held loosely in
//        the left hand, planted, which is the pose the sheet is in.
//
// WHAT THE MODEL STILL OWES THE GAME (unchanged in behaviour, rebuilt in
// place): the CHARGE RIG — four discrete tiers of arcing lightning read from
// across the arena — and `setStaff`, which the effect dispatcher calls when the
// rod is thrown and recalled.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, coneSpike } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

// ---- PALETTE ---------------------------------------------------------------
// Read off the sheet. The hair is the one that mattered most: cyan #58e2e8 was
// a straight misread and it made him a different character at a glance.
const HAIR = 0x8fe3bc;          // mint green
const HAIR_HI = 0xc4f5dd;
const HAIR_DK = 0x4fae86;
const TIE = 0x69c9a4;           // the wraps binding each horn-knot
const SKIN = 0xf7e7db;
// THREE WHITES, NOT ONE — kept from the previous build because the reasoning
// was sound and the sheet agrees: top, trousers and boots are all "white" in
// description, but the boots read distinctly cooler and the trousers a shade
// softer, and without those steps he renders as one white column.
const TOP = 0xf4f4f0;
const TOP_SH = 0xd9dbd8;
const TROUSER = 0xecece4;
const BOOT = 0xbcc6d2;          // pale blue-grey, per the sheet
const BOOT_DK = 0x93a0b0;
const BAND = 0xe8e2d4;          // bandage — warmer and softer than the top
const BAND_DK = 0xcfc7b4;
const RODWOOD = 0xc4442a;       // the red-orange shaft
const RODWOOD_DK = 0x8e2c1c;
const BRASS = 0xc9932f;
const BRASS_DK = 0x8f6a20;
const EYE = 0x6fd0a0;           // green, matching the hair
export const BOLT = 0xa46bff;   // the lightning keeps its violet
export const BOLT_CORE = 0xf4ecff;

export function buildKashimo() {
  const spec = {
    id: 'kashimo', name: 'Kashimo', H: 1.79, headScale: 0.99,
    shoulder: 0.104, hip: 0.047, muscle: 0.90, bulk: 0.88,
    legBulk: 1.30,                       // very full trousers
    skinTone: SKIN, clothColor: TOP, pantColor: TROUSER, shoeColor: BOOT,
    // The sleeves stop below the elbow, so the builder's arm tubes are the
    // BANDAGE — the ballooned sleeve is separate geometry added over the top.
    sleeveColor: BAND,
    armSlot: 'cloth',
    // the shared shoulder cap reads `sleeveColor`, which here is bandage, and
    // would put two tan domes on a white shoulder. The balloon sleeve below
    // covers the same ground properly.
    shoulderCap: false,
    torsoShape: { chest: 0.97, waist: 0.95, hip: 0.99 },
    face: { jaw: 0.95, chin: 0.93, width: 1.02 },
    shoe: { len: 0.112, hgt: 0.046 },
    palette: {
      rim: 0xdcf7ea, hairRim: 0xcaffe6, outline: 0x0a0f12,
      accent: BOLT, energy: BOLT
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;

  // ---- FACE ---------------------------------------------------------------
  // Young and open, thick level brows, a slight smile. No face markings — the
  // sheet has none, and the charge read lives elsewhere now.
  addFace(ctx, {
    eyeColor: EYE, eyeW: 0.55, eyeH: 0.36, browColor: 0x25302c,
    browTilt: 3, browUp: 1.08, lashColor: 0x1a2622, mouthW: 0.21
  });
  // NOTE: no extra brow bars are added here. `addFace` already draws brows and
  // the previous build laid a second heavier pair on top of them; under the
  // fringe those read as two black girders across the face.

  // ---- HAIR ---------------------------------------------------------------
  // FOUR MASSES, and the order is the order they occlude: skull cap, bangs,
  // nape, horn-knots.
  //
  // THE SKULL CAP IS SMALL. This is the fix for the blob: the previous build
  // used a shell at 0.99·headR with a 1.30 rad face gap cut to the pole and a
  // second crown shell over it, which together stood a full head-radius proud
  // of the skull and read as a helmet with a face hole. One shell at 1.03,
  // closed over the crown, with the fringe hung off the front, is all a short
  // tousled cut needs.
  // THE CAP COVERS THE CROWN. A narrow face gap (0.80 rad, not 1.16) and a
  // theta that reaches past the equator, because the fringe below is SHORT and
  // cannot be asked to cover the top of the skull as well — that was the bald
  // pink dome in the first render of this rebuild.
  const FACE_GAP = 0.80;
  bag.add('hair', tGeo(sphereShell(headR * 1.05, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.66, scale: [1.0, 0.98, 1.04]
  }), { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.02] }),
    { bone: 'Head', color: HAIR });

  // A strand is a tapered spike. `coneSpike(rBase, h, bend)` grows along +Y
  // from its origin and the TIP lands at y = h + bend.y, which is the only
  // piece of arithmetic this section needs — the previous build's fringe hung
  // to the collarbone because that sum was never worked out.
  //
  // STRANDS MUST BE FAT. The hair outline is an inverted hull 0.012 · 1.2 =
  // 14 mm thick; a strand of 15 mm radius is therefore ENTIRELY inside its own
  // outline and renders as a black spike. Everything here is at least 26% of a
  // head radius, and `outlineHairScale` is pulled down to 0.7 besides.
  const strand = (x, yy, z, len, rad, bend, color) => {
    bag.add('hair', tGeo(coneSpike(rad, len, bend), { pos: [x, yy, z] }),
      { bone: 'Head', color });
  };

  // BANGS — a SHORT fringe. Base at the hairline (+0.52), tip at the brow
  // (≈ 0.00), so h + bend.y must come to about -0.52·headR.
  const BANG = [
    [-0.66, 0.30, -0.26], [-0.40, 0.34, -0.12], [-0.14, 0.36, -0.03],
    [0.14, 0.36, 0.05], [0.40, 0.33, 0.14], [0.66, 0.29, 0.26]
  ];
  for (const [bx, blen, tipX] of BANG) {
    strand(
      headC.x + bx * headR * 0.86,
      headC.y + headR * 0.52,
      headC.z + headR * 0.30,
      headR * blen,
      headR * 0.29,
      v3(tipX * headR, -headR * (0.52 + blen), headR * 0.42),
      Math.abs(bx) > 0.55 ? HAIR_DK : HAIR
    );
  }
  // one brighter strand off the parting
  strand(headC.x - headR * 0.06, headC.y + headR * 0.56, headC.z + headR * 0.26,
    headR * 0.32, headR * 0.24, v3(-headR * 0.1, -headR * 0.80, headR * 0.40), HAIR_HI);

  // NAPE. Short, to the neck — no tail. Stubby spikes off the back of the skull.
  for (let i = 0; i < 6; i++) {
    const t = i / 5 - 0.5;
    strand(
      headC.x + t * headR * 1.05,
      headC.y - headR * 0.02,
      headC.z - headR * 0.58,
      headR * 0.30,
      headR * 0.28,
      v3(t * headR * 0.5, -headR * 0.62, -headR * 0.40),
      i % 2 ? HAIR : HAIR_DK
    );
  }
  // side locks in front of the ears, down to the jaw
  for (const s of [1, -1]) {
    strand(headC.x + s * headR * 0.80, headC.y + headR * 0.26, headC.z + headR * 0.04,
      headR * 0.34, headR * 0.27, v3(s * headR * 0.18, -headR * 0.92, headR * 0.16), HAIR_DK);
  }

  // THE HORN-KNOTS. The whole silhouette, and the thing the old build got
  // wrong by putting round buns on the SIDES of the head. They stand on TOP,
  // one either side of the parting, canted outward and slightly forward, and
  // each is a tapered knot bound by two darker wraps with a flicked tip.
  for (const s of [1, -1]) {
    const bx = headC.x + s * headR * 0.46;
    const by = headC.y + headR * 0.80;
    const bz = headC.z + headR * 0.04;
    // the knot body: SHORT AND FAT, leaning out and forward. The first pass
    // made these long and thin and they read as two black insect antennae.
    bag.add('hair', tGeo(coneSpike(headR * 0.34, headR * 0.52,
      v3(s * headR * 0.34, headR * 0.10, headR * 0.10)), { pos: [bx, by, bz] }),
      { bone: 'Head', color: HAIR });
    // TWO WRAPS per knot, sitting proud of it as flattened rings
    for (let w = 0; w < 2; w++) {
      const k = 0.26 + w * 0.34;
      bag.add('hair', tGeo(new THREE.TorusGeometry(headR * (0.27 - w * 0.06), headR * 0.058, 5, 12), {
        rot: [80, 0, s * -22],
        pos: [bx + s * headR * 0.34 * k, by + headR * 0.52 * k, bz + headR * 0.10 * k]
      }), { bone: 'Head', color: TIE });
    }
    // the tip flicking out past the last wrap
    bag.add('hair', tGeo(coneSpike(headR * 0.16, headR * 0.24,
      v3(s * headR * 0.26, headR * 0.04, headR * 0.05)), {
      pos: [bx + s * headR * 0.22, by + headR * 0.34, bz + headR * 0.07]
    }), { bone: 'Head', color: HAIR_HI });
  }

  // ---- THE FUNNEL COLLAR --------------------------------------------------
  // Bunched, standing to the jaw, and wider at the top than the bottom — it is
  // a rolled tube of cloth, not a turtleneck sleeve. This is the single most
  // recognisable garment feature on the sheet.
  const neckY = y.neck;
  // LATHE PROFILES MUST RUN BOTTOM-TO-TOP. A profile written downward builds
  // the surface with inverted winding, and the consequence is not a subtle
  // shading artefact: `finalizeModel` wraps every cloth mesh in an inverted-hull
  // outline, so a reversed patch pushes its BLACK hull inward and paints it
  // over the front of the body. The first render of this rebuild had a black
  // torso and black legs for exactly that reason.
  // TALLER THAN A COLLAR HAS ANY RIGHT TO BE — it stands to the jaw and hides
  // the neck completely, which is the read on the sheet. Built short first and
  // he looked like a boy in a polo shirt with a very long neck.
  bag.add('cloth', tGeo(latheY([
    [0.050 * H, neckY - 0.034 * H],
    [0.062 * H, neckY - 0.008 * H],
    [0.070 * H, neckY + 0.026 * H],
    [0.072 * H, neckY + 0.060 * H],
    [0.066 * H, neckY + 0.086 * H],
    [0.058 * H, neckY + 0.098 * H]
  ], 20, 0.95), { pos: [0, 0, 0.004 * H] }), { bone: 'Chest', color: TOP });
  // the gather: three soft creases around it so the roll reads as cloth
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    bag.add('cloth', tGeo(roundBox(0.014 * H, 0.052 * H, 0.012 * H, 0.005 * H, 2), {
      rot: [0, -a * 57.3, 0],
      pos: [Math.sin(a) * 0.068 * H, neckY + 0.026 * H, Math.cos(a) * 0.068 * H + 0.004 * H]
    }), { bone: 'Chest', color: TOP_SH });
  }

  // ---- THE BALLOON SLEEVES ------------------------------------------------
  // Wide from the shoulder, fullest at mid-upper-arm, closing to a tight cuff
  // just below the elbow. Built as a lathe around each upper arm and bound to
  // the UpArm bone so it swings with the limb.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s);
    const el = joints.get('LoArm' + s);
    const m = s === 'L' ? 1 : -1;
    const dir = el.clone().sub(sh);
    const len = dir.length();
    // the lathe is built along +Y at the origin and then rotated onto the arm
    const tilt = Math.atan2(dir.x, -dir.y) * 57.2958;
    // bottom-to-top, per the note on the collar above.
    // A LATHE IS OPEN AT BOTH ENDS, so the cuff radius has to close down onto
    // the arm tube itself or the open bottom shows its unlit interior as a
    // black ring at the elbow — which is exactly what the first render did.
    bag.add('cloth', tGeo(latheY([
      [0.025 * H, -len * 1.04],
      [0.026 * H, -len * 0.98],
      [0.046 * H, -len * 0.84],
      [0.056 * H, -len * 0.50],
      [0.050 * H, -len * 0.20],
      [0.034 * H, 0.02 * H]
    ], 18, 1.0), { rot: [0, 0, -tilt], pos: [sh.x, sh.y, sh.z + 0.004 * H] }),
      { bone: 'UpArm' + s, color: TOP });
    // the cuff the balloon gathers into
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.026 * H, 0.008 * H, 5, 14), {
      rot: [90 - tilt * 0.35, 0, 0],
      pos: [el.x + m * 0.004 * H, el.y + 0.014 * H, el.z + 0.004 * H]
    }), { bone: 'UpArm' + s, color: TOP_SH });
  }

  // ---- BANDAGES -----------------------------------------------------------
  // Forearms and shins, wound as overlapping turns.
  //
  // THE FLOATING-FOREARM BUG. The old build placed the forearm wraps with a
  // hand-written offset from the shoulder and bound them to the wrong bone, so
  // one arm's stack of rings hung in the air beside the body — clearly visible
  // in any front shot. Here every ring is INTERPOLATED BETWEEN THE TWO REST
  // JOINTS it belongs to and bound to the bone that owns that segment, so a
  // wrap cannot be anywhere except on the limb.
  const wrapLimb = (aKey, bKey, bone, n, r0, r1, from = 0.06, to = 0.98) => {
    const a = joints.get(aKey), b = joints.get(bKey);
    const d = b.clone().sub(a);
    const tilt = Math.atan2(d.x, -d.y) * 57.2958;
    for (let i = 0; i < n; i++) {
      const k = from + (to - from) * (i / (n - 1));
      const p = a.clone().addScaledVector(d, k);
      const r = r0 + (r1 - r0) * k;
      // slim turns — at 0.30 of the limb radius they read as plumbing washers
      bag.add('cloth', tGeo(new THREE.TorusGeometry(r, r * 0.17, 5, 12), {
        rot: [90, 0, -tilt],
        pos: [p.x, p.y, p.z]
      }), { bone, color: i % 2 ? BAND : BAND_DK });
    }
  };
  for (const s of ['L', 'R']) {
    wrapLimb('LoArm' + s, 'Hand' + s, 'LoArm' + s, 6, 0.026 * H, 0.021 * H);
    wrapLimb('Shin' + s, 'Foot' + s, 'Shin' + s, 6, 0.036 * H, 0.028 * H, 0.10, 0.86);
  }

  // ---- TROUSERS AND BOOTS -------------------------------------------------
  // The trouser is very full and CLOSES BELOW THE KNEE, so the cuff is a ring
  // near the top of the shin with the bandage running out of it.
  for (const s of ['L', 'R']) {
    const kn = joints.get('Shin' + s);
    const th = joints.get('Thigh' + s);
    const d = kn.clone().sub(th);
    const tilt = Math.atan2(d.x, -d.y) * 57.2958;
    const len = d.length();
    bag.add('cloth', tGeo(latheY([
      [0.043 * H, -len * 1.16],
      [0.046 * H, -len * 1.10],
      [0.070 * H, -len * 0.98],
      [0.078 * H, -len * 0.72],
      [0.072 * H, -len * 0.35],
      [0.055 * H, 0]
    ], 18, 1.0), { rot: [0, 0, -tilt], pos: [th.x, th.y, th.z + 0.004 * H] }),
      { bone: 'Thigh' + s, color: TROUSER });
    // the gathered cuff
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.043 * H, 0.012 * H, 5, 14), {
      rot: [90, 0, 0], pos: [kn.x, kn.y + 0.020 * H, kn.z]
    }), { bone: 'Shin' + s, color: TOP_SH });
    // BOOT: a raised toe cap and the strap button at the outer ankle
    const ft = joints.get('Foot' + s);
    const m = s === 'L' ? 1 : -1;
    bag.add('cloth', tGeo(roundBox(0.050 * H, 0.030 * H, 0.052 * H, 0.010 * H, 2), {
      pos: [ft.x, ft.y + 0.030 * H, ft.z + 0.012 * H]
    }), { bone: 'Foot' + s, color: BOOT });
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.009 * H, 6, 5), {
      pos: [ft.x + m * 0.026 * H, ft.y + 0.034 * H, ft.z + 0.006 * H]
    }), { bone: 'Foot' + s, color: BOOT_DK });
  }

  // ---- THE TOP'S HEM ------------------------------------------------------
  // Loose to mid-thigh with a soft gathered waist, drawn as a lathe over the
  // hips so the body does not end at the belt.
  // NARROWER THAN INSTINCT WANTS. At 0.099·H this lathe stood clear of the
  // body on every side and read as a barrel with a head on it; the tunic is
  // loose, not inflated, and it only has to be a little wider than the hips.
  bag.add('cloth', tGeo(latheY([
    [0.074 * H, y.hips - 0.072 * H],
    [0.080 * H, y.hips - 0.060 * H],
    [0.084 * H, y.hips - 0.030 * H],
    [0.080 * H, y.hips + 0.020 * H],
    [0.074 * H, y.hips + 0.070 * H]
  ], 20, 0.90), { pos: [0, 0, 0.004 * H] }), { bone: 'Hips', color: TOP });
  // the waist gather
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.076 * H, 0.008 * H, 5, 18), {
    rot: [90, 0, 0], pos: [0, y.hips + 0.048 * H, 0.004 * H]
  }), { bone: 'Hips', color: TOP_SH });

  // ---- THE STAFF 如意棒 ---------------------------------------------------
  // Slim red-orange shaft, brass at both ends, shoulder height. Built along +Y
  // about its own middle so the attachment rotations below are readable.
  const ROD_LEN = 1.42;
  const staff = new THREE.Group();
  // The rod hangs off an INNER group so it can be slid down its own axis
  // without touching the outer node, whose position `attachProp` owns. Centred
  // on the hand the ferrule floats a foot off the deck; -0.30 plants it.
  const rodInner = new THREE.Group();
  rodInner.position.y = -0.30;
  staff.add(rodInner);
  const rodMat = MAT.cloth({ rimColor: 0xffd0c0 });
  const brassMat = MAT.metal({ rimColor: 0xfff0c8 });
  const addRod = (geo, color, mat) => {
    const g = geo.clone();
    const n = g.getAttribute('position').count;
    const c = new THREE.Color(color);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    rodInner.add(new THREE.Mesh(g, mat));
  };
  addRod(new THREE.CylinderGeometry(0.017, 0.019, ROD_LEN, 10), RODWOOD, rodMat);
  // the domed brass cap at the head
  addRod(tGeo(new THREE.CylinderGeometry(0.023, 0.023, 0.055, 10), { pos: [0, ROD_LEN / 2, 0] }), BRASS, brassMat);
  addRod(tGeo(new THREE.SphereGeometry(0.024, 10, 7), { pos: [0, ROD_LEN / 2 + 0.036, 0] }), BRASS, brassMat);
  // the long engraved ferrule at the foot
  addRod(tGeo(new THREE.CylinderGeometry(0.022, 0.024, 0.20, 10), { pos: [0, -ROD_LEN / 2 + 0.10, 0] }), BRASS_DK, brassMat);
  addRod(tGeo(new THREE.SphereGeometry(0.026, 10, 7), { pos: [0, -ROD_LEN / 2 - 0.005, 0] }), BRASS, brassMat);
  for (let i = 0; i < 3; i++) {
    addRod(tGeo(new THREE.TorusGeometry(0.023, 0.005, 4, 12),
      { rot: [90, 0, 0], pos: [0, -ROD_LEN / 2 + 0.05 + i * 0.055, 0] }), BRASS, brassMat);
  }
  // a darker seam down the shaft so the red is not a flat tube
  addRod(tGeo(new THREE.BoxGeometry(0.005, ROD_LEN * 0.72, 0.005), { pos: [0, 0.02, 0.017] }), RODWOOD_DK, rodMat);

  // THE CONDUCTOR CORE — the charge read on the staff. A bead at the head that
  // brightens with the tier.
  const tipCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.038, 1),
    new THREE.MeshBasicMaterial({ color: BOLT_CORE, transparent: true, opacity: 0.12 }));
  tipCore.position.y = ROD_LEN / 2 + 0.036;
  rodInner.add(tipCore);

  // ---- THE CHARGE RIG -----------------------------------------------------
  // Four discrete tiers of arcing lightning strung between anchor points on the
  // body, rebuilt on a timer so it crackles. Unchanged in behaviour from the
  // previous build — this is the part that was working.
  const ARC_MAX = 7, ARC_SEG = 5;
  const arcList = [];
  const arcGroup = new THREE.Group();
  for (let i = 0; i < ARC_MAX; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_SEG * 8 * 3), 3));
    const idx = [];
    for (let k = 0; k < ARC_SEG; k++) {
      const b = k * 8;
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3, b + 4, b + 5, b + 6, b + 4, b + 6, b + 7);
    }
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? BOLT_CORE : BOLT, transparent: true, opacity: 0.9,
      depthWrite: false, side: THREE.DoubleSide
    }));
    mesh.visible = false;
    arcGroup.add(mesh);
    arcList.push(mesh);
  }
  // the tier-3 ring around him
  const ring = new THREE.Group();
  const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.014, 5, 26),
    new THREE.MeshBasicMaterial({ color: BOLT, transparent: true, opacity: 0.4, depthWrite: false }));
  ringMesh.rotation.x = Math.PI / 2;
  ring.add(ringMesh);
  ring.position.y = 0.62 * H;
  ring.visible = false;
  arcGroup.add(ring);
  ctx.group.add(arcGroup);

  const model = finalizeModel(ctx, {
    materials: { hair: MAT.hair({ rimColor: 0xcaffe6 }) },
    // the hair is built from tapered spikes rather than slabs, so the default
    // 1.2x hair outline is thick enough to swallow them whole — see the note
    // on strand radius above
    outlineHairScale: 0.7,
    props: {
      staff: {
        node: staff,
        default: 'hand',
        attachments: {
          // ROTATIONS FOUND BY SHOOTING CANDIDATES, not by reasoning about the
          // hand's local axes — under the stance pose the hand's +Y has been
          // rotated most of a right angle and intuition is reliably wrong here.
          // pos/rot are ARRAYS — `attachProp` reads them with `fromArray` and
          // by index, so a Vector3 here silently becomes NaN.
          //
          // THE ROTATION IS SOLVED, NOT GUESSED. Under the stance pose the left
          // hand's local axes are nowhere near world-aligned, and the previous
          // build's hand-picked [-96, 0, 26] laid a 1.4 m rod out sideways like
          // a tightrope pole. This is the Euler that carries the rod's local +Y
          // onto world +Y through the hand bone's rest rotation — measured off
          // the bone in the viewer, then tilted 8 degrees off vertical so it
          // reads as carried rather than surveyed.
          // and the offset is ZERO: the rod is modelled about its own middle,
          // the hand sits at 0.88 m, and the rod is 1.42 m long, so centring it
          // on the hand plants the ferrule just off the deck exactly as the
          // sheet has it. Any local offset here is applied in the hand's
          // ROTATED frame and moves the rod somewhere nobody predicted.
          hand: { bone: 'HandL', pos: [0, 0, 0], rot: [5.8, 12.6, 130.3] },
          back: { bone: 'Chest', pos: [-0.10, 0.02, -0.13], rot: [14, 0, -28] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      }
    }
  });

  // ---- CHARGE TIER --------------------------------------------------------
  let tier = 0, frac = 0, stepT = 0;
  const anchors = [
    v3(0, 0.92 * H, 0.03),                       // head
    v3(0.11 * H, 0.74 * H, 0), v3(-0.11 * H, 0.74 * H, 0),   // shoulders
    v3(0.09 * H, 0.50 * H, 0.02), v3(-0.09 * H, 0.50 * H, 0.02),
    v3(0.06 * H, 0.24 * H, 0), v3(-0.06 * H, 0.24 * H, 0)
  ];

  function rebuildArcs() {
    const n = [0, 2, 4, ARC_MAX][tier];
    for (let i = 0; i < ARC_MAX; i++) arcList[i].visible = i < n;
    for (let i = 0; i < n; i++) {
      const line = arcList[i];
      const a = anchors[(Math.random() * anchors.length) | 0];
      const b = anchors[(Math.random() * anchors.length) | 0];
      const to = a === b
        ? a.clone().add(v3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.5))
        : b;
      const pts = [];
      for (let k = 0; k <= ARC_SEG; k++) {
        const u = k / ARC_SEG;
        const j = (k === 0 || k === ARC_SEG) ? 0 : 1;
        pts.push(v3(
          a.x + (to.x - a.x) * u + (Math.random() - 0.5) * 0.20 * j,
          a.y + (to.y - a.y) * u + (Math.random() - 0.5) * 0.20 * j,
          a.z + (to.z - a.z) * u + (Math.random() - 0.5) * 0.14 * j));
      }
      const w = tier >= 3 ? 0.030 : 0.022;
      const pos = line.geometry.getAttribute('position');
      let vi = 0;
      const put = (p, sx, sy, sz) => { pos.setXYZ(vi++, p.x + sx, p.y + sy, p.z + sz); };
      for (let k = 0; k < ARC_SEG; k++) {
        const p0 = pts[k], p1 = pts[k + 1];
        const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z;
        let ax = -dy, ay = dx, al = Math.hypot(ax, ay);
        if (al < 1e-5) { ax = 1; ay = 0; al = 1; }
        ax = ax / al * w; ay = ay / al * w;
        put(p0, ax, ay, 0); put(p1, ax, ay, 0); put(p1, -ax, -ay, 0); put(p0, -ax, -ay, 0);
        let bz = -dy, by = dz, bl = Math.hypot(bz, by);
        if (bl < 1e-5) { bz = 1; by = 0; bl = 1; }
        bz = bz / bl * w; by = by / bl * w;
        put(p0, 0, by, bz); put(p1, 0, by, bz); put(p1, 0, -by, -bz); put(p0, 0, -by, -bz);
      }
      pos.needsUpdate = true;
      line.geometry.computeBoundingSphere();
    }
    ring.visible = tier >= 3;
    const lit = [0.12, 0.45, 0.75, 1.0][tier];
    tipCore.material.opacity = 0.12 + lit * 0.8;
    tipCore.scale.setScalar(0.7 + lit * 0.9);
  }
  rebuildArcs();

  // `setCharge`, called every tick from Fighter.update — see combat/charge.js.
  model.setCharge = (t, f = 0) => {
    const nt = Math.max(0, Math.min(3, t | 0));
    frac = f;
    if (nt !== tier) { tier = nt; rebuildArcs(); }
  };

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    if (tier <= 0) {
      if (arcList[0].visible) rebuildArcs();
      return;
    }
    stepT += dt;
    const rate = tier >= 3 ? 1 / 30 : 1 / 24;
    if (stepT >= rate) { stepT = 0; rebuildArcs(); }
    if (ring.visible) {
      ring.rotation.y += dt * 1.4;
      ringMesh.material.opacity = 0.35 + frac * 0.45;
    }
  };

  // Used by the effect dispatcher when the rod is thrown and recalled.
  model.setStaff = key => model.attachProp('staff', key);

  return model;
}
