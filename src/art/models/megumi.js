// MEGUMI FUSHIGURO — built to a researched reference pass over the MAPPA
// design (JJK wiki character sheet + anime key art, front / 3-4 / side / back).
//
// ============================ REFERENCE SHEET ============================
// Sources consulted: Jujutsu Kaisen Wiki character sheet (build, canonical
// 175cm / 60kg, uniform description, eye colour note), ORICON character
// profile, and anime key-art descriptions of the spike layout. Geometry here
// is original and procedural — nothing imported.
//
// BUILD    175 cm (H 1.75) — mid-height for the roster. Shorter than Gojo
//          (1.90) and much slighter than Todo. Same frame as Yuta but the
//          posture is the opposite: Yuta is open and unsure, Megumi is shut.
//          Lean athletic teenager: narrow shoulders, long clean limbs, no
//          bulk anywhere. Shoulder half-width 0.100·H, muscle 0.94.
// HEAD     Slightly narrow, sharp jaw with a defined chin point. Face reads
//          older than the rest of the roster because the features are all
//          angles — nothing round on him.
// HAIR     THE IDENTIFIER. Black with a blue cast, spiked upward and outward
//          in every direction — the "sea urchin" read — but ANGULAR and
//          LAYERED, not a ball of needles. Four bands, and the side view is
//          what gets it wrong if you rush it:
//            1 FRINGE  — five long wedges over the forehead, pointing DOWN
//              and slightly forward, the two centre ones splitting over the
//              brow. They reach roughly to eyebrow height.
//            2 CROWN   — the tall band. Spikes leave the skull UP and OUT and
//              rake BACKWARD, so from the side the mass has a clear
//              front-low / back-high wedge. This backward rake is the thing.
//            3 SIDES   — sweep out past the ear line and back, nearly
//              horizontal, covering the top of the ear.
//            4 NAPE    — shorter, flaring back and slightly down; the back
//              silhouette is widest at about ear height, not at the crown.
//          Volume: wider than the shoulders is wrong; the outer spike tips sit
//          about 1.55x head radius out. Highlights are a lifted blue-grey.
// EYES     Dark blue-green (#2b4a4e — anime reads deep teal, manga green).
//          Narrow, sharply tilted almond, heavy dark upper lash line, LOW
//          STRAIGHT BROWS set close to the eye. Permanently unimpressed: the
//          brows carry it, tilted down toward the nose, and the mouth is a
//          short flat line with no curve at all.
// GARMENTS Layer by layer, outside in:
//            · Jujutsu Tech jacket, near-black navy #1b1f2b, HIGH STAND
//              COLLAR closed at the throat, straight front placket with a
//              lighter seam, hem at mid-hip.
//            · Cuffed sleeves, plain, no rank marking.
//            · Dark turtleneck under the collar, just visible at the neck.
//            · Wide-leg trousers, almost hakama — deliberately fuller than
//              the roster norm (legBulk 1.22) and gathered at the ankle.
//            · Brown leather shoes #4a382a — the one warm value on him.
// TOOL     Cursed tool as real geometry: a short straight blade (chokutō
//          profile), squared tsuba, wrapped dark grip. Worn at the back and
//          drawn into the hand for techniques and the heavy.
// PALETTE  hair #12141c / hi #2a3242 · skin #f0ddd0 · jacket #1b1f2b /
//          lining #2c3240 · turtleneck #14161d · trousers #1b1f2b ·
//          shoes #4a382a · eyes #2b4a4e · steel #b8c0cc · accent #6f8fa8
// IDENTITY 1) the angular back-raked black spike silhouette
//          2) the flat unimpressed mouth under low straight brows
//          3) the high closed collar + wide hakama-cut trousers
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, coneSpike, sphereShell, shapeExtrude } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const HAIR = 0x141824;
const HAIR_HI = 0x2e384c;
const SKIN = 0xf0ddd0;
// The uniform is near-black navy, but a pure #1b1f2b crushes to a silhouette
// under the toon ramp — these are lifted just enough that the garment layers
// still separate from each other on a dark map.
const JACKET = 0x232a3a;
const LINING = 0x39435c;
const NECK_KNIT = 0x14161d;
const SHOE = 0x4a382a;
const EYE = 0x2b4a4e;
const STEEL = 0xb8c0cc;
const GRIP = 0x1a1c22;

export function buildMegumi() {
  const spec = {
    id: 'megumi', name: 'Megumi', H: 1.75, headScale: 1.0,
    shoulder: 0.100, hip: 0.051, muscle: 0.94, bulk: 0.95,
    legBulk: 1.22,                       // the wide hakama-cut trousers
    skinTone: SKIN, clothColor: JACKET, pantColor: JACKET, shoeColor: SHOE,
    torsoShape: { chest: 1.0, waist: 0.95, hip: 0.98 },
    face: { jaw: 1.06, chin: 1.05, width: 0.97 },   // sharper than the roster norm
    shoe: { len: 0.112, hgt: 0.046 },
    palette: {
      rim: 0x9fb8cf, hairRim: 0x6f8fa8, outline: 0x06070c,
      accent: 0x6f8fa8, energy: 0x2a2f4a
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- face: narrow tilted eyes, LOW STRAIGHT BROWS, flat mouth ------------
  // The default face helper draws a tilted brow and a curved mouth; both are
  // wrong for him, so the eyes are drawn here and only the nose is inherited.
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.50, eyeH = headR * 0.255;
  for (const s of [1, -1]) {
    const ex = s * headR * 0.405;
    // heavy upper lash: thick, and tilted DOWN toward the nose
    bag.add('flat', tGeo(roundBox(eyeW * 1.10, eyeH * 0.30, 0.004, 0.002),
      { rot: [0, 0, s * 11], pos: [ex, eyeY + eyeH * 0.44, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x0d0f16 });
    bag.add('flat', tGeo(sharpEye(eyeW, eyeH, s),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xf4f6fa });
    // iris: tall, pushed toward the inner corner — reads as looking past you
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.46, 12),
      { scale: [0.78, 1.16, 1], pos: [ex - s * eyeW * 0.07, eyeY + eyeH * 0.02, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.19, 10),
      { scale: [0.8, 1.1, 1], pos: [ex - s * eyeW * 0.07, eyeY + eyeH * 0.02, faceZ + headR * 0.027] }),
      { bone: 'Head', color: 0x0a1214 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.10, 8),
      { pos: [ex - s * eyeW * 0.16, eyeY + eyeH * 0.20, faceZ + headR * 0.03] }),
      { bone: 'Head', color: 0xffffff });
    // BROW: low, straight, angled down toward the nose. This single element
    // carries the whole expression — it sits closer to the eye than anyone
    // else's in the roster.
    bag.add('flat', tGeo(roundBox(eyeW * 1.02, eyeH * 0.20, 0.004, 0.002),
      { rot: [0, 0, s * -9], pos: [ex - s * eyeW * 0.04, eyeY + eyeH * 0.92, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0x101219 });
  }
  // mouth: a short flat line. No curve up, no curve down.
  bag.add('flat', tGeo(roundBox(headR * 0.20, headR * 0.038, 0.004, 0.002),
    { pos: [0, headC.y - headR * 0.585, faceZ - headR * 0.045] }),
    { bone: 'Head', color: 0x5c3b3e });

  // ---- HAIR ---------------------------------------------------------------
  // Scalp shell first so no skin shows between the spikes — but it is CUT AWAY
  // at the front (phi window) so it cannot swallow the face. In three's sphere
  // parameterisation phi = PI/2 faces +Z, so the opening is centred there.
  // The shells are kept TIGHT to the skull (0.98–1.00 r) and the spikes root
  // just inside them. An oversized cap swallows the spikes and the whole thing
  // reads as a smooth ball with pins in it — which is exactly what the first
  // iteration did.
  const FACE_GAP = 1.30;                     // radians of skull left uncovered
  bag.add('hair', tGeo(sphereShell(headR * 0.99, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.62, scale: [1.02, 1.0, 1.05]
  }), { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });
  // back-of-skull shell: closes the nape without adding volume
  bag.add('hair', tGeo(sphereShell(headR * 0.97, {
    phiStart: Math.PI / 2 + 0.95, phiLength: Math.PI * 2 - 1.9,
    thetaLength: Math.PI * 0.44, scale: [1, 1.02, 1]
  }), { rot: [-62, 0, 0], pos: [headC.x, headC.y - headR * 0.14, headC.z - headR * 0.20] }),
    { bone: 'Head', color: HAIR });

  // spike helper: dir = where it leaves the skull, bend = where the tip goes.
  // These are chunky angular WEDGES, not needles — the silhouette has to read
  // as mass with points on it, which is the difference between Megumi's hair
  // and a sea urchin.
  const spike = (dir, len, rBase, bend, color = HAIR) => {
    const d = dir.clone().normalize();
    const base = headC.clone().addScaledVector(d, headR * 0.78);
    const geo = coneSpike(rBase, len, bend, { radial: 5, hSeg: 4, zScale: 0.78 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(base.x, base.y, base.z);
    geo.computeVertexNormals();
    bag.add('hair', geo, { bone: 'Head', color });
  };

  // 1 FRINGE — five wedges over the forehead, pointing down and forward. The
  // two centre wedges split over the brow so the forehead shows between them.
  const fringe = [
    { x: 0.12, len: 0.90, r: 0.34, bendX: 0.10, drop: 1.05 },
    { x: -0.16, len: 0.98, r: 0.36, bendX: -0.12, drop: 1.12 },
    { x: 0.46, len: 0.88, r: 0.32, bendX: 0.22, drop: 1.00 },
    { x: -0.50, len: 0.92, r: 0.32, bendX: -0.24, drop: 1.05 },
    { x: 0.76, len: 0.76, r: 0.28, bendX: 0.34, drop: 0.88 },
    { x: -0.78, len: 0.78, r: 0.28, bendX: -0.36, drop: 0.90 }
  ];
  for (const f of fringe) {
    // leave the skull almost straight FORWARD and let the bend take the tip
    // down past the brow — leaving it upward makes a crown, not a fringe
    spike(v3(f.x, 0.30, 0.95), headR * f.len, headR * f.r,
      v3(f.bendX * headR, -headR * f.drop * 1.25, headR * 0.10));
  }

  // 2 CROWN — the tall band. Up, out, and RAKED BACK: every tip's bend has a
  // negative z, which is what gives the side view its front-low/back-high
  // wedge instead of a symmetrical puffball.
  const crown = [
    { a: 0.00, z: 0.30, len: 1.22, r: 0.46, rake: 0.48 },
    { a: 0.46, z: 0.24, len: 1.32, r: 0.46, rake: 0.54 },
    { a: -0.44, z: 0.26, len: 1.30, r: 0.46, rake: 0.54 },
    { a: 0.88, z: 0.10, len: 1.18, r: 0.43, rake: 0.62 },
    { a: -0.86, z: 0.12, len: 1.20, r: 0.43, rake: 0.62 },
    { a: 1.30, z: -0.06, len: 1.06, r: 0.40, rake: 0.68 },
    { a: -1.28, z: -0.04, len: 1.08, r: 0.40, rake: 0.68 },
    { a: 2.10, z: -0.24, len: 1.00, r: 0.38, rake: 0.56 },
    { a: -2.06, z: -0.22, len: 1.02, r: 0.38, rake: 0.56 },
    // two shorter fillers between the long ones so the mass has no gaps
    { a: 0.22, z: 0.44, len: 0.84, r: 0.34, rake: 0.34 },
    { a: -0.20, z: 0.46, len: 0.86, r: 0.34, rake: 0.34 }
  ];
  crown.forEach((c, i) => {
    spike(v3(Math.sin(c.a), 0.94, c.z), headR * c.len, headR * c.r,
      v3(Math.sin(c.a) * headR * 0.40, headR * 0.16, -headR * c.rake),
      i % 3 === 1 ? HAIR_HI : HAIR);   // scattered lifted strands catch the rim
  });

  // 3 SIDES — nearly horizontal, out past the ear and back. These set the
  // width of the front silhouette; they must clear the ear, not sit on it.
  for (const s of [1, -1]) {
    spike(v3(s * 0.98, 0.30, 0.30), headR * 1.12, headR * 0.38,
      v3(s * headR * 0.60, -headR * 0.18, -headR * 0.46));
    spike(v3(s * 1.00, 0.10, -0.10), headR * 1.20, headR * 0.40,
      v3(s * headR * 0.68, -headR * 0.08, -headR * 0.54));
    spike(v3(s * 0.86, -0.10, -0.44), headR * 1.00, headR * 0.35,
      v3(s * headR * 0.52, -headR * 0.26, -headR * 0.48));
  }

  // 4 NAPE — shorter, flaring back and down. Widest point of the BACK view
  // sits here, at about ear height.
  const nape = [
    { x: 0.00, y: 0.06, len: 0.94, r: 0.40 },
    { x: 0.40, y: 0.00, len: 1.00, r: 0.39 },
    { x: -0.40, y: 0.02, len: 1.00, r: 0.39 },
    { x: 0.72, y: -0.18, len: 0.86, r: 0.35 },
    { x: -0.72, y: -0.16, len: 0.88, r: 0.35 },
    { x: 0.18, y: -0.34, len: 0.74, r: 0.32 },
    { x: -0.20, y: -0.32, len: 0.76, r: 0.32 }
  ];
  for (const n of nape) {
    spike(v3(n.x, n.y, -0.96), headR * n.len, headR * n.r,
      v3(n.x * headR * 0.42, -headR * 0.44, -headR * 0.42));
  }

  // ---- garments -----------------------------------------------------------
  // HIGH STAND COLLAR, closed at the throat — a straight-sided band, not a
  // flare. Taller at the back than the front, as the uniform reads.
  bag.add('cloth', tGeo(latheY([
    [0.040 * H, y.neck - 0.030 * H], [0.043 * H, y.neck + 0.004 * H], [0.0425 * H, y.neck + 0.038 * H]
  ], 16, 0.92), {}), { bone: 'Neck', color: JACKET });
  // collar back lip: the extra height behind, in the lighter lining value so
  // the high closed collar actually reads against the jacket
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0435 * H, 0.0435 * H, 0.022 * H, 14, 1, true,
    Math.PI * 0.55, Math.PI * 0.9), { pos: [0, y.neck + 0.050 * H, 0] }), { bone: 'Neck', color: LINING });
  // collar top edge — a thin bright rim all the way round
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.0428 * H, 0.0035 * H, 6, 16),
    { rot: [90, 0, 0], pos: [0, y.neck + 0.040 * H, 0] }), { bone: 'Neck', color: LINING });
  // turtleneck knit just showing inside the collar
  bag.add('cloth', tGeo(latheY([
    [0.031 * H, y.neck - 0.020 * H], [0.033 * H, y.neck + 0.030 * H]
  ], 14, 0.94), {}), { bone: 'Neck', color: NECK_KNIT });

  // jacket body: a straight-hanging shell over the torso lathe, hem at mid-hip
  bag.add('cloth', tGeo(latheY([
    [0.081 * H, 0.425 * H], [0.084 * H, 0.47 * H], [0.079 * H, 0.53 * H], [0.075 * H, 0.60 * H]
  ], 20, 0.80), {}), { bone: 'Hips', color: JACKET });
  // front placket seam — a thin lifted strip down the centre of the chest
  bag.add('cloth', tGeo(roundBox(0.011 * H, 0.19 * H, 0.006 * H, 0.003),
    { pos: [0, 0.665 * H, 0.062 * H] }), { bone: 'Chest', color: LINING });
  // shoulder yoke seams
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.052 * H, 0.007 * H, 0.006 * H, 0.002),
      { rot: [0, 0, s * 14], pos: [s * 0.048 * H, 0.782 * H, 0.030 * H] }), { bone: 'Chest', color: LINING });
  }
  // sleeve cuffs
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    const cuffP = wr.clone().lerp(el, 0.14);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0195 * H, 0.0185 * H, 0.022 * H, 10),
      { pos: [cuffP.x, cuffP.y, cuffP.z] }), { bone: 'Hand' + s, color: LINING });
  }
  // trouser ankle gathers — the wide leg pulls in tight at the shoe
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s), kn = joints.get('Shin' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.026 * H, 0.030 * H, 0.030 * H, 10),
      { pos: [an.x, an.y + 0.045 * H, an.z * 0.6 + kn.z * 0.4] }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: LINING, blend: 0.06 });
  }
  // belt
  bag.add('cloth', tGeo(latheY([
    [0.073 * H, 0.508 * H], [0.075 * H, 0.528 * H]
  ], 18, 0.82), {}), { bone: 'Hips', color: NECK_KNIT });

  // ---- springs: jacket hem + a few loose crown strands ---------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.007 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.055 * H, -0.075 * H, -0.035 * H),
      restDir: v3(s * 0.06, -1, -0.08).normalize(), stiffness: 72, damping: 0.84, gravity: 8,
      segments: [
        { len: 0.048 * H, mesh: makeFlapMesh(0.062 * H, 0.056 * H, 0.048 * H, 0.009, clothMat, JACKET, oOpts) },
        { len: 0.038 * H, mesh: makeFlapMesh(0.056 * H, 0.046 * H, 0.038 * H, 0.008, clothMat, JACKET, oOpts) }
      ]
    });
  }
  // two long back strands that lag behind the head on hard turns — they sell
  // the hair as hair without making the spiked silhouette wobble
  const headJ = joints.get('Head');
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Head',
      localOffset: v3(s * headR * 0.52, headC.y + headR * 0.20 - headJ.y, -headR * 0.92 + (headC.z - headJ.z)),
      restDir: v3(s * 0.30, -0.25, -1).normalize(), stiffness: 95, damping: 0.80, gravity: 5,
      segments: [
        { len: 0.030 * H, mesh: makeFlapMesh(0.020 * H, 0.013 * H, 0.030 * H, 0.012, hairMat, HAIR, oOpts) },
        { len: 0.022 * H, mesh: makeFlapMesh(0.013 * H, 0.003 * H, 0.022 * H, 0.009, hairMat, HAIR_HI, oOpts) }
      ]
    });
  }

  // ---- CURSED TOOL: short straight blade ----------------------------------
  const tool = new THREE.Group();
  {
    const metalMat = MAT.metal({ rimColor: 0xdfe8ff });
    const gripMat = MAT.cloth({ rimColor: 0x8fa8c0 });
    const colored = (geo, color, mat) => {
      const n = geo.getAttribute('position').count;
      const c = new THREE.Color(color);
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      return new THREE.Mesh(geo, mat);
    };
    // SHORT sword: 38 cm of blade over a 15 cm grip. It is a cursed tool he
    // draws in close, not a katana — anything longer parks the tip above his
    // head on the back mount and reads as the wrong weapon entirely.
    const blade = colored(shapeExtrude([
      [-0.015, 0], [0.015, 0], [0.015, 0.32], [0.004, 0.38], [-0.015, 0.34]
    ], 0.011), STEEL, metalMat);
    const tsuba = colored(roundBox(0.066, 0.014, 0.046, 0.004), 0x2a2f3a, metalMat);
    tsuba.position.y = -0.005;
    const grip = colored(new THREE.CylinderGeometry(0.016, 0.018, 0.15, 8), GRIP, gripMat);
    grip.position.y = -0.088;
    const pommel = colored(new THREE.SphereGeometry(0.019, 8, 6), 0x2a2f3a, metalMat);
    pommel.position.y = -0.166;
    tool.add(blade, tsuba, grip, pommel);
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.011, outlineHairScale: 0,
    props: {
      tool: {
        node: tool, default: 'back',
        // NOTE: attachment offsets are BONE-LOCAL, not world. The Chest bone
        // already sits at ~0.70·H, so the back mount only needs the small
        // offset out from the spine — putting a world Y here parks the sword
        // above his head.
        attachments: {
          // slung across the back, hilt clearing the left shoulder but staying
          // well below the crown
          back: { bone: 'Chest', pos: [0.045 * H, 0.020 * H, -0.070 * H], rot: [14, 0, 44] },
          // BLADE UP. -6 left it lying horizontally BEHIND him — his hand's
          // local +Y under his stance is very nearly straight back, so a
          // near-zero rotation reads as "the sword vanished" from the front
          // and as a spike through the hip from the side. Solved against his
          // STANCE; see the note on Toji's split_soul.
          hand: { bone: 'HandR', pos: [0, -0.065 * H, 0.012 * H], rot: [58, -47, -76] },
          away: { bone: 'Hips', pos: [0, -9, 0], rot: [0, 0, 0] }
        }
      }
    }
  });

  // ---- SHADOW TRAVEL look --------------------------------------------------
  // Submerged, he is a silhouette sinking into the floor: the whole model
  // drops below the surface and the outlines go with it. Driven by the
  // fighter through setSubmerged(0..1); 0 is fully surfaced.
  let sub = 0, subTarget = 0;
  model.setSubmerged = v => { subTarget = Math.max(0, Math.min(1, v)); };
  model.submergeAmount = () => sub;
  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    const next = sub + (subTarget - sub) * Math.min(1, dt * 11);
    if (Math.abs(next - sub) > 1e-4 || (next > 0) !== (sub > 0)) {
      sub = next;
      // Sink the whole rig rather than scaling it — the silhouette stays right
      // on the way down and the floor visually cuts him off. The outline hulls
      // are siblings of the body meshes, so they have to be moved too or the
      // submerged half keeps its ink line.
      const dy = -sub * 2.1;
      for (const child of model.group.children) {
        if (child.isMesh && /^body_/.test(child.name)) child.position.y = dy;
      }
    } else sub = next;
  };
  return model;
}

// A sharper eye than the shared almond: hard outer corner, tilted, with the
// inner corner pulled low. `s` = 1 for his left (screen +x).
function sharpEye(w, h, s) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 * s, -h * 0.10);
  sh.quadraticCurveTo(-w * 0.16 * s, h * 0.66, w / 2 * s, h * 0.20);
  sh.lineTo(w * 0.46 * s, h * 0.02);
  sh.quadraticCurveTo(w * 0.02 * s, -h * 0.50, -w / 2 * s, -h * 0.10);
  return new THREE.ShapeGeometry(sh, 8);
}
