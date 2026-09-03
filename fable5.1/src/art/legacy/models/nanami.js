// NANAMI — broad-shouldered, squared-off tailored tan suit, 7:3 blond side
// part, thin glasses, patterned tie on a spring chain, wrapped blunt blade.
//
// TWO THINGS WERE WRONG AND BOTH ARE EASY TO REINTRODUCE (2026-08-14):
//   * The suit was 0xd8c093 against 0xeed4b0 skin — the same hue two steps
//     apart in value, so his sleeves read as bare arms and the whole character
//     read as a naked man in trousers. A tan suit on a tan man only works if
//     the suit is pushed COOL and DOWN in value; the blue shirt canon gives
//     him is what actually carries the contrast, so it has to be visible.
//   * The blade's `back` attachment was rot z=102°, which is very nearly
//     horizontal — it came out of one hip and went in the other. Canon is a
//     holster on the BACK of his dress shirt, hidden under the blazer, so the
//     blade lies along the spine.
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, ribbonShell, sphereShell, roundBox, shapeExtrude } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3, DEG } from '../../../core/math.js';

const SUIT = 0xa98d5c;      // tan blazer — cooler and darker than the skin
const SUIT_DK = 0x836b41;   // shadowed panels / closure line
const SHIRT = 0x8fadd2;     // canon: a BLUE dress shirt, not a white one
const TIE = 0x27314a;       // dark tie...
const TIE_DOT = 0xdfe6f0;   // ...with the dotted pattern that matches the wrap
const HAIR = 0xdfc258;
const SKIN = 0xf4dcbd;

export function buildNanami() {
  const spec = {
    id: 'nanami', name: 'Nanami', H: 1.845, headScale: 0.97,
    shoulder: 0.113, hip: 0.056, muscle: 1.14, bulk: 1.1, legBulk: 1.04,
    // "matching slacks" — the trousers are the same cloth, a touch darker only
    // so the leg reads separately from the jacket hem. Light shoes are canon.
    skinTone: SKIN, clothColor: SUIT, pantColor: 0xb59a68, shoeColor: 0xb3a488,
    torsoShape: { chest: 1.10, waist: 1.0, hip: 0.95 },
    shoulderCap: false,
    face: { jaw: 1.2, chin: 1.05, width: 1.03 },
    shoe: { len: 0.125, hgt: 0.048 },
    palette: { rim: 0xffd9a0, hairRim: 0xfff0c0, outline: 0x241505, metalRim: 0xfff2cc, accent: 0xf2b23c, energy: 0xffc25e }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- suit tailoring -----------------------------------------------------
  // SHIRT PANEL. Was a small triangle tucked at the collar, which left the tie
  // hanging on bare jacket like a bookmark. It now runs the length of the
  // jacket opening so the blue actually reads as a shirt and gives the tie
  // something to sit on.
  bag.add('cloth', tGeo(shapeExtrude([
    [-0.042 * H, 0.070 * H], [0.042 * H, 0.070 * H],
    [0.030 * H, -0.115 * H], [-0.030 * H, -0.115 * H]
  // z must clear the torso lathe: chest radius 0.076H×1.10 with zScale 0.74
  // puts the front surface at ~0.062H, and the first version of this panel sat
  // at 0.056H — i.e. entirely inside his chest, invisible.
  ], 0.008 * H), { rot: [10, 0, 0], pos: [0, 0.760 * H, 0.071 * H] }),
    { chain: torsoChain, color: SHIRT, blend: 0.04 });
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0], [s * 0.032 * H, 0.012 * H], [s * 0.022 * H, -0.03 * H]
    ], 0.006 * H), { rot: [8, 0, 0], pos: [0, 0.828 * H, 0.052 * H] }), { bone: 'Neck', color: SHIRT });
    // notched lapels — thin panels hugging the chest slope
    bag.add('cloth', tGeo(shapeExtrude([
      [0, 0.10 * H], [s * 0.048 * H, 0.075 * H], [s * 0.058 * H, 0.035 * H],
      [s * 0.044 * H, 0.045 * H], [s * 0.022 * H, -0.06 * H], [s * 0.006 * H, -0.06 * H]
    // the lapels are the OUTERMOST layer at the chest — they lie over the
    // shirt panel, so they have to clear its z as well as the torso's
    ], 0.005 * H), { rot: [16, 0, 0], pos: [0, 0.72 * H, 0.062 * H] }),
      { chain: torsoChain, color: SUIT, blend: 0.04 });
  }
  // jacket closure line + buttons
  bag.add('cloth', tGeo(roundBox(0.006 * H, 0.17 * H, 0.006 * H, 0.002),
    { pos: [0.012 * H, 0.565 * H, 0.062 * H] }), { chain: torsoChain, color: SUIT_DK, blend: 0.05 });
  // jacket hem + belt line peeking under it
  bag.add('cloth', latheY([
    [0.084 * H, 0.42 * H], [0.080 * H, 0.47 * H], [0.076 * H, 0.51 * H]
  ], 20, 0.80), { bone: 'Hips', color: SUIT });
  bag.add('cloth', latheY([
    [0.0725 * H, 0.505 * H], [0.0735 * H, 0.525 * H]
  ], 18, 0.78), { bone: 'Hips', color: 0x4a3320 });
  // shoulder pads — squared silhouette
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s);
    bag.add('cloth', tGeo(roundBox(0.055 * H, 0.030 * H, 0.062 * H, 0.010 * H),
      { rot: [0, 0, (s === 'L' ? -1 : 1) * 8], pos: [sh.x + (s === 'L' ? 1 : -1) * 0.004 * H, sh.y + 0.017 * H, sh.z] }),
      { bone: 'UpArm' + s, color: SUIT });
    // white shirt cuffs
    const wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0175 * H, 0.019 * H, 0.024 * H, 10),
      { pos: [wr.x, wr.y + 0.012 * H, wr.z] }), { bone: 'LoArm' + s, color: SHIRT });
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.021 * H, 0.023 * H, 0.030 * H, 10),
      { pos: [wr.x, wr.y + 0.032 * H, wr.z] }), { bone: 'LoArm' + s, color: SUIT });
  }

  // ---- face: narrow eyes, heavy brow, glasses -----------------------------
  addFace(ctx, {
    eyeW: 0.5, eyeH: 0.24, eyeColor: 0x6b4c30, browTilt: 14, browUp: 1.55,
    browColor: 0x7a5c22, lashColor: 0x1a1208, mouthW: 0.26, mouthColor: 0x4a2c26
  });
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;
  const glassMat = { bone: 'Head', color: 0x24262e };
  for (const s of [1, -1]) {
    bag.add('metal', tGeo(new THREE.TorusGeometry(headR * 0.21, headR * 0.022, 6, 14),
      { scale: [1.1, 0.72, 1], pos: [s * headR * 0.40, eyeY + headR * 0.01, faceZ + headR * 0.05] }), glassMat);
    // temples back to the ears
    bag.add('metal', tGeo(roundBox(headR * 0.58, headR * 0.024, headR * 0.024, 0.002),
      { rot: [0, s * 78, 0], pos: [s * headR * 0.80, eyeY + headR * 0.05, faceZ - headR * 0.48] }), glassMat);
  }
  bag.add('metal', tGeo(roundBox(headR * 0.20, headR * 0.028, headR * 0.026, 0.002),
    { pos: [0, eyeY + headR * 0.03, faceZ + headR * 0.045] }), glassMat);

  // ---- 7:3 blond side part ------------------------------------------------
  bag.add('hair', tGeo(sphereShell(headR * 1.06, { thetaLength: Math.PI * 0.34, scale: [1, 0.86, 1.04] }),
    { pos: [headC.x, headC.y + headR * 0.18, headC.z - headR * 0.04] }), { bone: 'Head', color: HAIR });
  // part line groove on the "7" side
  bag.add('hair', tGeo(roundBox(headR * 0.045, headR * 0.03, headR * 0.9, 0.004),
    { rot: [8, 0, 0], pos: [headC.x + headR * 0.30, headC.y + headR * 0.92, headC.z + headR * 0.1] }),
    { bone: 'Head', color: 0xc4a95c });
  // swept fringe: cards sweeping from the part line (at x = +0.3R) to the left
  const partX = headR * 0.30;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x0 = partX - t * headR * 1.05;
    const p0 = v3(headC.x + partX * 0.8, headC.y + headR * 0.78, headC.z + headR * 0.38);
    const p1 = v3(headC.x + x0, headC.y + headR * (0.62 - t * 0.06), headC.z + headR * 0.82);
    const p2 = v3(headC.x + x0 - headR * 0.08, headC.y + headR * (0.42 - t * 0.05), headC.z + headR * 0.90);
    bag.add('hair', ribbonShell([p0, p1, p2], u => headR * 0.32 * (1 - u * 0.55), 0.010, { seg: 6, normalHint: v3(0, 0.3, 1) }),
      { bone: 'Head', color: HAIR });
  }
  // right-side short sweep (the "3")
  bag.add('hair', ribbonShell([
    v3(headC.x + partX * 0.9, headC.y + headR * 0.70, headC.z + headR * 0.40),
    v3(headC.x + headR * 0.72, headC.y + headR * 0.45, headC.z + headR * 0.70),
    v3(headC.x + headR * 0.9, headC.y + headR * 0.18, headC.z + headR * 0.55)
  ], u => headR * 0.3 * (1 - u * 0.5), 0.010, { seg: 6, normalHint: v3(0.5, 0.3, 0.8) }), { bone: 'Head', color: HAIR });
  // clean nape wedge — back of the skull only
  bag.add('hair', tGeo(sphereShell(headR * 1.06, {
    thetaStart: Math.PI * 0.38, thetaLength: Math.PI * 0.28,
    phiStart: Math.PI * 1.08, phiLength: Math.PI * 0.84, scale: [0.98, 1, 0.94]
  }), { pos: [headC.x, headC.y + headR * 0.04, headC.z - headR * 0.08] }), { bone: 'Head', color: HAIR });

  // ---- wrapped blunt blade prop ------------------------------------------
  const blade = buildBluntBlade(H, spec.palette);

  // ---- springs: tie + back vent flaps ------------------------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const tieMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  // tie: knot is static, 3 spring segments below with the dot pattern color
  bag.add('cloth', tGeo(roundBox(0.026 * H, 0.026 * H, 0.016 * H, 0.005),
    { pos: [0, 0.815 * H, 0.056 * H] }), { bone: 'Neck', color: TIE });
  springs.push({
    bone: 'Chest', localOffset: v3(0, 0.10 * H, 0.080 * H),
    restDir: v3(0, -1, 0.10).normalize(), stiffness: 85, damping: 0.8, gravity: 8,
    segments: [
      { len: 0.062 * H, mesh: makeFlapMesh(0.030 * H, 0.036 * H, 0.062 * H, 0.010, tieMat, TIE, oOpts) },
      { len: 0.06 * H, mesh: makeFlapMesh(0.036 * H, 0.030 * H, 0.06 * H, 0.009, tieMat, TIE, oOpts) },
      { len: 0.045 * H, mesh: makeFlapMesh(0.030 * H, 0.008 * H, 0.045 * H, 0.008, tieMat, TIE_DOT, oOpts) }
    ]
  });
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.04 * H, -0.09 * H, -0.06 * H),
      restDir: v3(0, -1, -0.15).normalize(), stiffness: 75, damping: 0.82, gravity: 7,
      segments: [
        { len: 0.05 * H, mesh: makeFlapMesh(0.055 * H, 0.05 * H, 0.05 * H, 0.009, clothMat, SUIT, oOpts) },
        { len: 0.045 * H, mesh: makeFlapMesh(0.05 * H, 0.042 * H, 0.045 * H, 0.008, clothMat, SUIT, oOpts) }
      ]
    });
  }

  return finalizeModel(ctx, {
    springs, outlineThickness: 0.0135,
    props: {
      blade: {
        node: blade, default: 'back',
        attachments: {
          // ALONG THE SPINE, not across the hips. The blade group is built
          // growing along +Y from its hilt, so a z-rotation near 90° lays it
          // flat — which is how it ended up entering one hip and exiting the
          // other. A small z tilt keeps it upright and slightly canted, and
          // the negative z offset puts it behind the back where the blazer
          // hides it.
          back: { bone: 'Hips', pos: [0.026 * H, 0.03 * H, -0.088 * H], rot: [-6, 0, 17] },
          hand: { bone: 'HandR', pos: [0, -0.045 * H, 0.012 * H], rot: [-100, 0, 0] }
        }
      }
    }
  });
}

function buildBluntBlade(H, palette) {
  const g = new THREE.Group();
  const len = 0.30 * H;
  // wrapped rectangular blade — cloth bands give it the bound look
  const core = new THREE.Mesh(roundBox(0.032 * H, len, 0.014 * H, 0.004),
    MAT.cloth({ vertexColors: false, color: 0xcfc4a8, rimColor: palette.rim }));
  core.position.y = len / 2 + 0.02 * H;
  g.add(core);
  for (let i = 0; i < 5; i++) {
    const band = new THREE.Mesh(roundBox(0.036 * H, 0.026 * H, 0.018 * H, 0.004),
      MAT.cloth({ vertexColors: false, color: i % 2 ? 0xb9ac8c : 0xa89a78, rimColor: palette.rim }));
    band.position.y = 0.05 * H + i * 0.05 * H;
    band.rotation.y = (i % 2 ? 1 : -1) * 0.05;
    g.add(band);
  }
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.009 * H, 0.0085 * H, 0.07 * H, 8),
    MAT.cloth({ vertexColors: false, color: 0x2c2418, rimColor: palette.rim }));
  hilt.position.y = -0.03 * H;
  const guard = new THREE.Mesh(roundBox(0.042 * H, 0.010 * H, 0.020 * H, 0.003),
    MAT.metal({ vertexColors: false, color: 0x6f5a30 }));
  guard.position.y = 0.005 * H;
  g.add(hilt, guard);
  g.add(makeOutline(core, { color: 0x241505, thickness: 0.007 }));
  return g;
}
