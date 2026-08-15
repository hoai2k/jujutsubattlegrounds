// YUTA — shortest of the roster: a slight build swallowed by an oversized,
// layered WHITE uniform, shaggy black bowl-cut hair, katana slung at the left
// hip. Rika-green accents.
//
// Rebuilt 2026-07-27 (the previous single-tube version is kept alongside as
// .yuta-v1-backup.js.bak). Notes worth keeping if this is ever touched again:
//   * The jacket is a PARTIAL lathe with a real V opening worn over a
//     contrasting shirt, so the two garments read as two garments. The shirt
//     has to stay far from the jacket IN VALUE or the opening flattens into
//     one mass — which direction depends on the jacket. It is now the bright
//     garment, so the shirt is the dark one.
//   * COLOUR IS CANON, not a mood choice (2026-08-14). Yuta's Jujutsu High
//     uniform is a LOOSE WHITE JACKET with sleeves that stop at the forearms,
//     slender black trousers and white sneakers — he is the only one on the
//     roster not dressed in dark navy, and shipping him in navy made him read
//     as a second Megumi in every lineup. The bare forearms come from
//     `foreSleeveColor`/`foreArmSlot` on the shared builder.
//   * The hair cap's thetaLength must stop AT the equator (0.50pi). Sweeping
//     past it drops the rim onto the eye line and swallows the eyes no matter
//     how short the fringe locks are cut.
//   * The scabbard lathe is built CENTRED on y=0 and angled down-and-back; a
//     lathe that starts at y=0 grows upward only, and rotating that pivots the
//     whole length out sideways like a rod through the hip.
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, ribbonShell, sphereShell, roundBox, shapeExtrude } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { v3, DEG } from '../../core/mathutil.js';

// The uniform is white; `JKT` is the lit face of it and `JKT_SH` the folded /
// shadowed layers (hood underside, cuff seams, hem). Not pure white — a 0xffffff
// garment clips to a flat silhouette under the key light and loses every fold.
const JKT = 0xe6e9f0;       // jacket
const JKT_SH = 0xbcc3d4;    // shadowed layers of the same garment
const PANT = 0x14161f;      // slender black trousers
const SHIRT = 0x232838;     // undershirt — now the DARK garment, so the open V
                            // still separates from the jacket around it
const TRIM = 0x2a3048;      // collar edge / buttons: dark against white cloth
const HAIR = 0x15181f;
const HAIR_HI = 0x232838;   // upper layer, catches the rim light
const SKIN = 0xf2ddc9;
const ACCENT = 0x9ff5c9;    // Rika green
const BELT = 0x0d1018;

// Partial lathe: like latheY but sweeps only part of the circle, which is what
// lets the jacket hang open at the front instead of sealing into a tube.
// three.js maps phi=0 to +Z (the character's front), so a gap centred on 0
// opens straight down the chest.
function lathePartialY(profile, { phiStart = 0, phiLength = Math.PI * 2, seg = 22, zScale = 1 } = {}) {
  const pts = profile.map(p => new THREE.Vector2(Math.max(0.0004, p[0]), p[1]));
  const geo = new THREE.LatheGeometry(pts, seg, phiStart, phiLength);
  if (zScale !== 1) geo.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, zScale));
  geo.computeVertexNormals();
  return geo;
}

export function buildYuta() {
  const spec = {
    id: 'yuta', name: 'Yuta', H: 1.73, headScale: 1.06,
    shoulder: 0.092, hip: 0.05, muscle: 0.88, bulk: 0.98, legBulk: 0.92,
    skinTone: SKIN,
    clothColor: SHIRT,        // base torso IS the shirt — the jacket goes over it
    sleeveColor: JKT,
    // the jacket sleeve stops at the forearm: below the elbow is bare skin,
    // shaded out of the skin slot so it does not band like fabric
    foreSleeveColor: SKIN,
    foreArmSlot: 'skin',
    pantColor: PANT,
    shoeColor: 0xdfe4ee,      // white sneakers
    torsoShape: { chest: 0.97, waist: 0.93, hip: 0.99 },
    face: { jaw: 0.95, chin: 0.9, width: 1.0 },
    shoe: { len: 0.112, hgt: 0.05 },
    palette: { rim: 0xa9e8cd, hairRim: 0x8fd8b8, outline: 0x0b0f18, accent: ACCENT, energy: 0x8ff0c0 }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ================= JACKET =================================================
  // Open-front shell sitting proud of the shirt. The 0.40rad gap at phi=0 is
  // the opening; the shirt underneath shows through it.
  const GAP = 0.30;   // half-angle of the front opening (radians)
  const jacketProfile = [
    [0.079 * H, 0.40 * H],   // hem
    [0.076 * H, 0.47 * H],
    [0.070 * H, 0.545 * H],  // waist
    [0.076 * H, 0.63 * H],
    [0.082 * H, 0.70 * H],   // chest
    [0.081 * H, 0.762 * H],
    [0.062 * H, 0.808 * H]   // shoulder taper
  ];
  bag.add('cloth', lathePartialY(jacketProfile, {
    phiStart: GAP, phiLength: Math.PI * 2 - GAP * 2, seg: 26, zScale: 0.80
  }), { chain: torsoChain, color: JKT, blend: 0.05 });

  // Lapel slabs down both sides of the opening: give the jacket edge real
  // thickness so the V doesn't look like a hole cut in a shell.
  for (const s of [1, -1]) {
    // narrow angled edge flanking the opening, widest at the collar
    const lapel = shapeExtrude([
      [s * 0.006 * H, 0.104 * H], [s * 0.046 * H, 0.086 * H], [s * 0.038 * H, 0.020 * H],
      [s * 0.024 * H, -0.104 * H], [s * 0.007 * H, -0.100 * H]
    ], 0.013 * H);
    bag.add('cloth', tGeo(lapel, { rot: [12, 0, 0], pos: [0, 0.668 * H, 0.054 * H] }),
      { chain: torsoChain, color: JKT_SH, blend: 0.04 });
  }
  // shirt placket + a couple of buttons showing in the gap
  bag.add('cloth', tGeo(roundBox(0.016 * H, 0.20 * H, 0.006 * H, 0.002),
    { rot: [10, 0, 0], pos: [0, 0.655 * H, 0.050 * H] }), { chain: torsoChain, color: 0x2a3048, blend: 0.05 });
  for (let i = 0; i < 3; i++) {
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.0055 * H, 6, 5),
      { pos: [0, 0.60 * H + i * 0.055 * H, 0.056 * H] }), { chain: torsoChain, color: TRIM, blend: 0.05 });
  }

  // stand collar — taller than v1 and flared, framing the jaw
  bag.add('cloth', lathePartialY([
    [0.040 * H, y.neck - 0.020 * H], [0.046 * H, y.neck + 0.012 * H], [0.053 * H, y.headBase + 0.030 * H]
  ], { phiStart: GAP * 0.8, phiLength: Math.PI * 2 - GAP * 1.6, seg: 18, zScale: 0.90 }),
    { bone: 'Neck', color: JKT });
  bag.add('cloth', lathePartialY([
    [0.053 * H, y.headBase + 0.028 * H], [0.0545 * H, y.headBase + 0.040 * H]
  ], { phiStart: GAP * 0.8, phiLength: Math.PI * 2 - GAP * 1.6, seg: 18, zScale: 0.90 }),
    { bone: 'Head', color: TRIM });

  // ================= HOOD ===================================================
  // A shaped shell folded down behind the neck, plus a rolled rim — reads as
  // cloth instead of v1's two floating rings.
  const hood = sphereShell(0.088 * H, {
    thetaStart: Math.PI * 0.16, thetaLength: Math.PI * 0.52,
    phiStart: Math.PI * 0.62, phiLength: Math.PI * 0.76,
    seg: 16, rings: 8, scale: [1.05, 1.15, 0.9]
  });
  bag.add('cloth', tGeo(hood, { rot: [-26, 0, 0], pos: [0, 0.815 * H, -0.045 * H] }),
    { bone: 'Chest', color: JKT });
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.062 * H, 0.019 * H, 8, 16, Math.PI * 1.05),
    { rot: [72, 0, 180], pos: [0, 0.792 * H, -0.052 * H] }), { bone: 'Chest', color: JKT_SH });

  // ================= BELT + HEM =============================================
  bag.add('cloth', latheY([
    [0.0745 * H, 0.512 * H], [0.0765 * H, 0.532 * H], [0.0745 * H, 0.552 * H]
  ], 20, 0.80), { bone: 'Hips', color: BELT });
  bag.add('cloth', tGeo(roundBox(0.026 * H, 0.022 * H, 0.010 * H, 0.003),
    { pos: [0, 0.532 * H, 0.061 * H] }), { bone: 'Hips', color: 0x8a93a8 });
  // hem skirt under the belt
  bag.add('cloth', latheY([
    [0.083 * H, 0.375 * H], [0.081 * H, 0.43 * H], [0.076 * H, 0.50 * H]
  ], 22, 0.80), { bone: 'Hips', color: JKT });

  // Shoulder seams + the ROLLED SLEEVE END. The oversized cuff used to sit at
  // the wrist; with the sleeve stopping at the forearm it belongs just below
  // the elbow instead, as the thick rolled-back hem the bare arm comes out of.
  // A white cuff left down at the wrist read as a bandage on a bare arm.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.031 * H, 0.0055 * H, 6, 14),
      { rot: [90, 0, (s === 'L' ? 1 : -1) * 12], pos: [sh.x, sh.y - 0.004 * H, sh.z] }),
      { bone: 'UpArm' + s, color: JKT_SH });
    // roll sits a third of the way down the forearm, oriented along the limb
    const cuffAt = el.clone().lerp(wr, 0.30);
    const axis = wr.clone().sub(el).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    const cuff = new THREE.CylinderGeometry(0.030 * H, 0.035 * H, 0.052 * H, 12);
    cuff.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    cuff.translate(cuffAt.x, cuffAt.y, cuffAt.z);
    bag.add('cloth', cuff, { bone: 'LoArm' + s, color: JKT });
    const lip = new THREE.TorusGeometry(0.0335 * H, 0.0042 * H, 6, 14);
    lip.rotateX(Math.PI / 2);
    lip.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    const lipAt = el.clone().lerp(wr, 0.42);
    lip.translate(lipAt.x, lipAt.y, lipAt.z);
    bag.add('cloth', lip, { bone: 'LoArm' + s, color: JKT_SH });
  }

  // ================= FACE ===================================================
  addFace(ctx, {
    eyeW: 0.55, eyeH: 0.35, eyeColor: 0x39445a, browTilt: 3, browUp: 1.28,
    lashColor: 0x10121a, mouthW: 0.19
  });
  const faceZ = headC.z + headR * 0.615;
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.30, headR * 0.042, 0.004, 0.002),
      { rot: [0, 0, s * -6], pos: [s * headR * 0.40, headC.y - headR * 0.345, faceZ + headR * 0.01] }),
      { bone: 'Head', color: 0xc9a894 });
  }

  // ================= HAIR ===================================================
  // Layered bowl. Cards are built along a curve that hugs the skull then falls
  // away, and lengths vary per lock so the fringe silhouette is jagged rather
  // than a clean arc. Slight asymmetry (the +X side hangs longer).
  // One cap only. A second offset shell was leaving a hard crease ring across
  // the crown, so the light-catching layer lives on individual locks instead.
  // thetaLength must stop AT the equator, not past it: sweeping to 0.54pi
  // dropped the cap's rim to the eye line and swallowed the eyes no matter how
  // short the fringe locks were cut. The locks cover the forehead instead.
  bag.add('hair', tGeo(sphereShell(headR * 1.10, {
    thetaLength: Math.PI * 0.50, scale: [1.02, 1.0, 1.05]
  }), { pos: [headC.x, headC.y + headR * 0.055, headC.z - headR * 0.07] }),
    { bone: 'Head', color: HAIR });

  // lock: yaw a0 / pitch a1 on the scalp, sweeping down by `droop`
  const lock = (a0, a1, w, droop, flare = 1.0, thick = 0.013) => {
    const dir = v3(Math.sin(a0) * Math.cos(a1), Math.sin(a1), Math.cos(a0) * Math.cos(a1));
    const flat = v3(dir.x, 0, dir.z).normalize();
    const p0 = headC.clone().addScaledVector(dir, headR * 0.99);
    const p1 = headC.clone().addScaledVector(flat, headR * 1.07 * flare);
    p1.y = p0.y - droop * 0.42;
    const p2 = headC.clone().addScaledVector(flat, headR * 1.03 * flare);
    p2.y = p0.y - droop;
    return ribbonShell([p0, p1, p2], t => w * (1 - t * 0.72), thick, { seg: 6, normalHint: flat.clone() });
  };

  // Fringe — 10 locks, jagged lengths, parting slightly off-centre. Lengths
  // are tuned to break ON the brow: any longer and the eyes disappear, which
  // is exactly what the first pass got wrong.
  // 13 thinner locks rather than 10 thick ones: the chunky version faceted
  // into a solid slab. Lengths break just above the eye line so the eyes stay
  // the focal point at fight-camera distance.
  const fringeLen = [0.25, 0.19, 0.29, 0.16, 0.27, 0.18, 0.31, 0.17, 0.26, 0.15, 0.23, 0.18, 0.13];
  for (let i = 0; i < 13; i++) {
    const a = (i - 5.8) * 0.168;
    bag.add('hair', lock(a, 0.54 - Math.abs(a) * 0.08, headR * 0.30, headR * fringeLen[i], 1.0, 0.010),
      { bone: 'Head', color: i % 3 === 0 ? HAIR_HI : HAIR });
  }
  // side locks framing the cheeks — the long ones that make him read as Yuta
  for (const s of [1, -1]) {
    const extra = s > 0 ? 0.16 : 0;   // asymmetry
    bag.add('hair', lock(s * 1.02, 0.30, headR * 0.42, headR * (1.02 + extra), 1.04), { bone: 'Head', color: HAIR });
    bag.add('hair', lock(s * 1.34, 0.26, headR * 0.40, headR * (0.94 + extra), 1.02), { bone: 'Head', color: HAIR });
    bag.add('hair', lock(s * 1.70, 0.24, headR * 0.38, headR * 0.86, 1.0), { bone: 'Head', color: HAIR_HI });
    bag.add('hair', lock(s * 2.05, 0.22, headR * 0.36, headR * 0.80), { bone: 'Head', color: HAIR });
  }
  // nape layer
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i - 2.5) * 0.30;
    bag.add('hair', lock(a, 0.24, headR * 0.38, headR * (0.88 + (i % 2) * 0.14)), { bone: 'Head', color: HAIR });
  }
  // (no crown flicks: near-vertical locks read as antennae from the fight camera)

  // ================= SCABBARD ===============================================
  // Tapered body + capped tip + cord, slung at the left hip. The profile is
  // built CENTRED on y=0 — a lathe that starts at y=0 grows only upward, and
  // rotating that pivots the whole length out sideways like a tail.
  // rz near -78 laid the blade almost flat, so it read as a stick jutting out
  // of his hip. Angled down-and-back it tucks along the leg instead.
  const scabRot = [0, -34, -50];
  const half = 0.165 * H;
  bag.add('cloth', tGeo(latheY([
    [0.004 * H, -half], [0.0105 * H, -half + 0.03 * H], [0.0122 * H, -half + 0.12 * H],
    [0.0125 * H, half - 0.09 * H], [0.0118 * H, half - 0.02 * H], [0.005 * H, half]
  ], 12, 0.78), { rot: scabRot, pos: [0.068 * H, 0.47 * H, -0.035 * H] }), { bone: 'Hips', color: 0x0f1220 });
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.0138 * H, 0.0034 * H, 6, 12),
    { rot: scabRot, pos: [0.081 * H, 0.517 * H, 0.010 * H] }), { bone: 'Hips', color: ACCENT });
  bag.add('cloth', tGeo(roundBox(0.024 * H, 0.028 * H, 0.026 * H, 0.005),
    { rot: scabRot, pos: [0.090 * H, 0.535 * H, 0.024 * H] }), { bone: 'Hips', color: 0x1c2133 });

  const katana = buildKatana(H, spec.palette);

  // ================= SPRINGS ================================================
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.048 * H, -0.105 * H, -0.048 * H),
      restDir: v3(s * 0.08, -1, -0.14).normalize(), stiffness: 58, damping: 0.80, gravity: 7,
      segments: [
        { len: 0.065 * H, mesh: makeFlapMesh(0.062 * H, 0.056 * H, 0.065 * H, 0.009, clothMat, JKT, oOpts) },
        { len: 0.058 * H, mesh: makeFlapMesh(0.056 * H, 0.042 * H, 0.058 * H, 0.008, clothMat, JKT, oOpts) }
      ]
    });
    // nape hair
    springs.push({
      bone: 'Head',
      localOffset: v3(s * headR * 0.42, headC.y - joints.get('Head').y - headR * 0.18, headC.z - joints.get('Head').z - headR * 0.96),
      restDir: v3(s * 0.16, -1, -0.22).normalize(), stiffness: 88, damping: 0.78, gravity: 5,
      segments: [
        { len: headR * 0.56, mesh: makeFlapMesh(headR * 0.28, headR * 0.10, headR * 0.56, 0.008, hairMat, HAIR, oOpts) }
      ]
    });
  }
  // FRONT HEM. Narrow and short on purpose. On the old navy jacket this was a
  // 0.072H-wide panel nobody could pick out of the dark mass; in white it read
  // as an apron hanging over the crotch, so it is cut back to the width of the
  // jacket's front opening and stops well above the knee.
  springs.push({
    bone: 'Hips', localOffset: v3(0, -0.105 * H, 0.052 * H),
    restDir: v3(0, -1, 0.12).normalize(), stiffness: 58, damping: 0.8, gravity: 7,
    segments: [{ len: 0.040 * H, mesh: makeFlapMesh(0.048 * H, 0.038 * H, 0.040 * H, 0.009, clothMat, JKT, oOpts) }]
  });
  // hood tail — the folded hood swings a little behind the shoulders
  springs.push({
    bone: 'Chest', localOffset: v3(0, 0.085 * H, -0.062 * H),
    restDir: v3(0, -1, -0.30).normalize(), stiffness: 70, damping: 0.82, gravity: 6,
    segments: [{ len: 0.055 * H, mesh: makeFlapMesh(0.070 * H, 0.052 * H, 0.055 * H, 0.011, clothMat, JKT_SH, oOpts) }]
  });

  return finalizeModel(ctx, {
    springs, outlineThickness: 0.0115,
    props: {
      katana: {
        node: katana, default: 'away',
        attachments: {
          hand: { bone: 'HandR', pos: [0, -0.09 * H * 0.5, 0.01 * H], rot: [-100, 0, 0] }
        }
      }
    }
  });
}

function buildKatana(H, palette) {
  const g = new THREE.Group();
  const bladeLen = 0.38 * H;
  const blade = shapeExtrude([
    [-0.006 * H, 0], [0.006 * H, 0], [0.0075 * H, bladeLen * 0.85], [0, bladeLen], [-0.006 * H, bladeLen * 0.85]
  ], 0.004 * H);
  const bladeMesh = new THREE.Mesh(blade, MAT.metal({ vertexColors: false, color: 0xdfe6f2, rimColor: 0xffffff }));
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * H, 0.016 * H, 0.006 * H, 10),
    MAT.metal({ vertexColors: false, color: 0x2a2d38 }));
  guard.position.y = -0.004 * H;
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * H, 0.0075 * H, 0.09 * H, 8),
    MAT.cloth({ vertexColors: false, color: 0x1c2133, rimColor: palette.rim }));
  hilt.position.y = -0.05 * H;
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0085 * H, 0.0016 * H, 6, 10),
      MAT.cloth({ vertexColors: false, color: palette.accent, rimColor: palette.rim }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.018 * H - i * 0.018 * H;
    g.add(ring);
  }
  g.add(bladeMesh, guard, hilt);
  g.add(makeOutline(bladeMesh, { color: 0x0b0f18, thickness: 0.006 }));
  return g;
}
