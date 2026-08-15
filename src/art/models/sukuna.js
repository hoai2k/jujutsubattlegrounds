// ===========================================================================
// SUKUNA 両面宿儺 — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 from the Jujutsu Kaisen wiki appearance section, the
// Villains-wiki mirror, a structural how-to-draw breakdown of the face, and
// several cosplay/marking guides. Web search only — the wiki host answered 402
// to a direct fetch, so the descriptions below are assembled from the search
// summaries and the drawing tutorial rather than from staring at plates. There
// are no reference images in this repo and none were viewed: everything here
// is authored from written description, and the places where that left a
// judgement call are flagged as APPROXIMATED.
//
// BUILD & HEIGHT (relative to this roster)
//   Tall and powerfully built. H = 1.94 — above Gojo (1.92) and Higuruma
//   (1.86), below Hakari (1.95) and deliberately below Todo (2.00), who stays
//   the roster's heavyweight silhouette. Wider shoulder line than Gojo and
//   more muscle, but a lean waist: he is built like something that does not
//   need leverage. Posture is upright, weight back, chin level — contemptuous
//   rather than coiled. He never leans in.
//
// HEAD & FACE
//   Anime-narrow jaw, hard chin wedge, high cheekbones. FOUR EYES: the natural
//   pair, and a SECOND PAIR sitting below them on the cheekbones. Canon detail
//   the search surfaced and this model honours: in his TRUE form the two eyes
//   on his RIGHT side are angled differently from the left and sit on a raised
//   pale "flesh plate" over that half of the face. Both pairs are red. Sclera
//   are dark on the lower pair so the upper pair still reads as the eyes.
//
// MARKINGS
//   Black tattoo-like lines, described as covering "wrists, ankles, upper
//   arms, upper body, abdomen and face", plus LARGE BLACK DOTS on each
//   shoulder. Authored layout, front to back:
//     face    two horizontal bars across the forehead; a slash under each eye
//             running out to the temple; one short chin stripe; at full stacks
//             a nose-bridge bar and two brow verticals
//     neck    a matched pair of angled stripes either side of the throat
//     chest   two long diagonals off the collarbones, a third lower, and at
//             full stacks a sternum line joining them
//     abdomen three stacked horizontal bands
//     arms    a double band around each upper arm and a single band at each
//             wrist — ON ALL FOUR ARMS — with forearm bands added by stacks
//     legs    ankle bands, thigh bands at higher stacks
//     dots    one large filled circle on each of the four shoulders
//   Built in TIERS so Finger stacks reveal them progressively (see setFingers).
//
// HAIR
//   Short, dense, spiked UPWARD and back — not a fringe hanging forward. Front
//   view: a jagged crown with the hairline breaking into points over the brow.
//   Side: swept back off the temple, no sideburn. Back: shorter, closing the
//   nape in downward points. Colour is described as pink-red / dusty rose;
//   authored slightly deeper and redder than Yuji's salmon so the two read as
//   different characters at distance.
//
// GARMENTS
//   Loose traditional dress, deliberately roomy — the source notes his kimono
//   is cut wide "akin to a ladies' kimono" precisely because of the extra
//   arms. Authored as: bare chest and abdomen (the markings are the costume),
//   a dark open haori off the shoulders, a wide obi, and a tattered hakama.
//   Torn hem, no footwear detail beyond simple dark sandals.
//
// PALETTE (hex)
//   skin      #e6cebb    hair      #d4636d    hair rim  #ffb2b8
//   marks     #23090f    haori     #17131c    haori lining #4a1520
//   obi       #2b1119    hakama    #221b26    plate     #f0e2d6
//   eyes      #e02038    accent    #ff2f45    outline   #0a0509
//
// INSTANTLY IDENTIFIABLE, in the order a player will read them:
//   1. four arms   2. four eyes   3. black bands over bare pale skin
//   4. upswept red-pink spikes   5. the seam across the abdomen
//
// APPROXIMATED (no image reference was available):
//   · exact curvature and count of each marking stroke
//   · the precise silhouette of the hair spikes
//   · the shape of the right-side flesh plate
//   · the abdominal mouth, which the sources describe but do not detail. It is
//     authored CLOSED — a dark seam with a pale tooth ridge and lip geometry —
//     so it reads as wrong rather than as gore.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, coneSpike, sphereShell, roundBox, almondEye } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const SKIN = 0xe6cebb;
const HAIR = 0xd4636d;
const MARK = 0x23090f;
const HAORI = 0x17131c;
const LINING = 0x4a1520;
const OBI = 0x2b1119;
const HAKAMA = 0x221b26;
const PLATE = 0xf0e2d6;
const EYE = 0xe02038;
const GLOW = 0xff2f45;

export function buildSukuna() {
  const spec = {
    id: 'sukuna', name: 'Sukuna', H: 1.94, headScale: 0.97,
    shoulder: 0.122, hip: 0.052, muscle: 1.24, bulk: 1.12, legBulk: 1.06,
    skinTone: SKIN, clothColor: SKIN, sleeveColor: SKIN, pantColor: HAKAMA, shoeColor: 0x14101a,
    // bare chest and bare arms: the body is skin, not fabric
    bodySlot: 'skin',
    torsoShape: { chest: 1.18, waist: 0.92, hip: 0.96 },
    face: { jaw: 1.0, chin: 1.04, width: 1.0 },
    shoe: { len: 0.118, hgt: 0.046 },
    // THE SECOND ARM PAIR. Lower, inboard and set back so the four deltoids
    // stack down the ribcage instead of fanning out sideways.
    arms2: { shoulderY: 0.688, shoulder: 0.104, scale: 0.90, spread: 30, back: -0.034, slot: 'skin' },
    palette: { rim: 0xffc0b0, hairRim: 0xffb2b8, outline: 0x0a0509, accent: GLOW, energy: 0xff2f45 }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- the mark slot -------------------------------------------------------
  // Markings live in their own material so the whole set can be DARKENED as
  // Finger stacks accumulate (MeshBasicMaterial multiplies colour by vertex
  // colour, so driving material.color from grey to white takes them from faint
  // to full black). Tiered spread is separate geometry — see below.
  const markMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  markMat.color.setScalar(0.58);      // stack 0: present, but not yet loud

  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- MUSCLE --------------------------------------------------------------
  // The shared torso lathe is a smooth barrel, which on a bare-chested build
  // read as skinny however far the bulk dial went. Pectorals and a shallow
  // abdominal block are laid over it so "powerfully built" survives the
  // silhouette test — and so the chest markings have something to sit on.
  // PASS 4: separate pectoral lobes are GONE. Round ones read as breasts and
  // flat ones still caught their own cel band and read as two pale patches
  // stuck on his chest. The roster is stylized rather than anatomical, so the
  // mass now lives where the rest of the cast keeps it — in the torso profile
  // (chest 1.18, bulk 1.12) — and definition is drawn rather than modelled:
  // one shallow sternum wedge, and a pectoral crease line per side in the
  // mark slot, which the cel shader treats as line art instead of as form.
  bag.add('skin', tGeo(new THREE.SphereGeometry(0.048 * H, 14, 10), {
    scale: [0.62, 1.35, 0.30], pos: [0, 0.700 * H, 0.046 * H]
  }), { chain: torsoChain, color: SKIN, blend: 0.05 });
  for (const s of [1, -1]) {
    bag.add('mark', tGeo(roundBox(0.052 * H, 0.005 * H, 0.004, 0.002),
      { rot: [0, 0, s * 8], pos: [s * 0.036 * H, 0.728 * H, 0.062 * H] }),
      { chain: torsoChain, color: 0x6a4436, blend: 0.05 });
  }

  // ---- ALWAYS-ON MARKINGS (tier 0) ----------------------------------------
  // Skinned into the merged mark mesh, so they deform with the body.
  const bar = (w, h) => roundBox(w, h, 0.004, 0.002);

  // forehead: two horizontal bars, the upper one shorter. PASS 3 dropped both
  // by ~0.12 headR — the hair cap was sitting on top of them and the upper bar
  // was invisible from the front.
  bag.add('mark', tGeo(bar(headR * 0.86, headR * 0.075),
    { pos: [0, eyeY + headR * 0.50, faceZ + headR * 0.014] }), { bone: 'Head', color: MARK });
  bag.add('mark', tGeo(bar(headR * 0.58, headR * 0.065),
    { pos: [0, eyeY + headR * 0.68, faceZ - headR * 0.004] }), { bone: 'Head', color: MARK });
  // chin stripe — short. Pass 2 ran it long enough to meet the neck marks and
  // the three of them read as a moustache.
  bag.add('mark', tGeo(bar(headR * 0.070, headR * 0.16),
    { pos: [0, headC.y - headR * 0.66, faceZ - headR * 0.02] }), { bone: 'Head', color: MARK });
  for (const s of [1, -1]) {
    // The slash OUTBOARD of each eye, running from beside it out to the
    // temple. PASS 3 caught this sitting at mouth height and spanning the
    // whole jaw — the two of them met in the middle and read as one bar
    // across his face. It belongs beside the eye, not under the mouth.
    bag.add('mark', tGeo(bar(headR * 0.34, headR * 0.062),
      { rot: [0, 0, s * -14], pos: [s * headR * 0.74, eyeY - headR * 0.12, faceZ - headR * 0.10] }),
      { bone: 'Head', color: MARK });
    // neck stripes: steep and out at the sides of the throat, not under the jaw
    bag.add('mark', tGeo(bar(headR * 0.30, headR * 0.055),
      { rot: [0, 0, s * -64], pos: [s * 0.026 * H, y.neck - 0.014 * H, 0.019 * H] }),
      { bone: 'Neck', color: MARK });
  }

  // chest: two long diagonals off the collarbones, plus a lower third. Pushed
  // proud of the pectoral shelf added below — at pass 3's depth they sank
  // behind it and disappeared from the front entirely.
  for (const s of [1, -1]) {
    bag.add('mark', tGeo(bar(0.070 * H, 0.010 * H),
      { rot: [0, 0, s * 26], pos: [s * 0.032 * H, 0.766 * H, 0.062 * H] }),
      { chain: torsoChain, color: MARK, blend: 0.05 });
    bag.add('mark', tGeo(bar(0.058 * H, 0.009 * H),
      { rot: [0, 0, s * 18], pos: [s * 0.036 * H, 0.722 * H, 0.064 * H] }),
      { chain: torsoChain, color: MARK, blend: 0.05 });
  }

  // arm bands: a double band high on every upper arm, one at every wrist.
  // Authored for all four arms from one loop — if the lower pair is ever
  // dropped from the spec this simply builds nothing for it.
  const ARMS = [['UpArmL', 'LoArmL', 'HandL'], ['UpArmR', 'LoArmR', 'HandR'],
  ['UpArmL2', 'LoArmL2', 'HandL2'], ['UpArmR2', 'LoArmR2', 'HandR2']];
  const bandAt = (bone, r, thick, drop = 0) => {
    const j = joints.get(bone);
    if (!j) return;
    bag.add('mark', tGeo(new THREE.CylinderGeometry(r, r, thick, 12, 1, true),
      { pos: [j.x, j.y - drop, j.z] }), { bone, color: MARK });
  };
  for (const [up, lo, hand] of ARMS) {
    if (!joints.get(up)) continue;
    const small = up.endsWith('2');
    const ru = (small ? 0.0295 : 0.0325) * H, rw = (small ? 0.0175 : 0.0195) * H;
    bandAt(up, ru, 0.011 * H, 0.030 * H);
    bandAt(up, ru * 0.97, 0.008 * H, 0.052 * H);
    bandAt(hand, rw, 0.010 * H, -0.004 * H);
  }
  // ankle bands
  for (const s of ['L', 'R']) {
    const j = joints.get('Foot' + s);
    bag.add('mark', tGeo(new THREE.CylinderGeometry(0.0225 * H, 0.0225 * H, 0.011 * H, 12, 1, true),
      { pos: [j.x, j.y + 0.045 * H, j.z] }), { bone: 'Shin' + s, color: MARK });
  }

  // ---- FACE: four eyes -----------------------------------------------------
  // The natural pair first, through the shared face builder.
  addFace(ctx, {
    eyeW: 0.50, eyeH: 0.26, eyeColor: EYE, eyeTilt: 10, lashTilt: 13,
    browTilt: 17, browUp: 1.28, browColor: 0x2a0d12, lashColor: 0x14070b,
    mouthW: 0.26, mouthColor: 0x5a1c26
  });

  // THE FLESH PLATE over his right temple and cheekbone (he faces +Z, so his
  // right is -X). PASS 2: the first attempt wrapped a shell around the whole
  // front of the skull and read as a mask — it hid the face entirely. It is
  // now a small raised pad on the side of the face only, sitting proud of the
  // cheek and catching the light a shade brighter than the skin around it.
  bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.40, 10, 8), {
    scale: [0.42, 1.05, 0.80],
    pos: [-headR * 0.72, eyeY - headR * 0.06, headC.z + headR * 0.24]
  }), { bone: 'Head', color: PLATE });

  // THE SECOND PAIR, on the cheekbones under the natural eyes. Smaller, darker
  // sclera, and the right one is tilted against the left exactly as the source
  // describes — the asymmetry is the tell that this is the true form.
  // PASS 3: the first cut of these read as two red dots on his cheeks. The
  // sclera is bigger and a shade lighter (dark maroon, not near-black, which
  // vanished into the toon shadow band) and the iris is scaled up to match, so
  // the lower pair reads as EYES from fighting distance rather than as marks.
  for (const s of [1, -1]) {
    const ex = s * headR * 0.42, ey = eyeY - headR * 0.40;
    const tilt = s > 0 ? -7 : 13;                 // his right pair sits differently
    bag.add('flat', tGeo(almondEye(headR * 0.42, headR * 0.20, tilt),
      { pos: [ex, ey, faceZ + headR * 0.020] }), { bone: 'Head', color: 0x40151d });
    bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.082, 12),
      { scale: [0.85, 1.05, 1], pos: [ex - s * headR * 0.030, ey + headR * 0.010, faceZ + headR * 0.026] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.026, 8),
      { pos: [ex - s * headR * 0.045, ey + headR * 0.040, faceZ + headR * 0.030] }),
      { bone: 'Head', color: 0xffffff });
    // lash line above each lower eye, so they read as eyes and not as marks
    bag.add('mark', tGeo(bar(headR * 0.44, headR * 0.052),
      { rot: [0, 0, tilt * 0.6], pos: [ex, ey + headR * 0.125, faceZ + headR * 0.024] }),
      { bone: 'Head', color: MARK });
  }

  // ---- THE ABDOMINAL SEAM --------------------------------------------------
  // Closed. A dark lipped slit across the stomach with a pale ridge behind it
  // — the read is "there is a mouth there", not an open mouth.
  // PASS 3: pass 2's crescents were 8 cm across and read as a belt buckle.
  // Halved, tightened and darkened — at fighting distance it is a line, and
  // only up close does it resolve into something with lips.
  const seamY = 0.604 * H;   // clear of the obi, which was eating the lower lip
  bag.add('mark', tGeo(bar(0.046 * H, 0.0075 * H), { pos: [0, seamY, 0.052 * H] }),
    { chain: torsoChain, color: 0x120409, blend: 0.05 });
  bag.add('flat', tGeo(bar(0.036 * H, 0.0028 * H), { pos: [0, seamY + 0.0026 * H, 0.0532 * H] }),
    { chain: torsoChain, color: 0xe4d2c6, blend: 0.05 });
  for (const s of [1, -1]) {
    // the lips: two shallow crescents closing over it
    bag.add('skin', tGeo(new THREE.TorusGeometry(0.024 * H, 0.0035 * H, 6, 12, Math.PI * 0.86),
      { rot: [0, 0, s > 0 ? 0 : 180], pos: [0, seamY + s * 0.0045 * H, 0.049 * H] }),
      { chain: torsoChain, color: 0xd8b7a6, blend: 0.05 });
  }

  // ---- GARMENTS ------------------------------------------------------------
  // PASS 2. The first attempt built the haori as a full revolution from the
  // crotch to the collar, which produced a black tabard covering the chest,
  // the abdominal seam and every marking on the torso — the exact opposite of
  // the brief. It is now a PARTIAL lathe: the coat wraps the back and the
  // sides and is genuinely OPEN down the front, so the body is the costume and
  // the cloth only frames it.
  //
  // LatheGeometry rotates the profile from +Z at phi 0, so leaving a gap
  // around phi 0 leaves a gap at the front. Authored open across ~76 degrees.
  const openLathe = (profile, phiStart, phiLength, zScale = 1) => {
    const pts = profile.map(p => new THREE.Vector2(Math.max(0.0004, p[0]), p[1]));
    const g = new THREE.LatheGeometry(pts, 20, phiStart, phiLength);
    if (zScale !== 1) g.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, zScale));
    g.computeVertexNormals();
    return g;
  };
  const OPEN_START = Math.PI * 0.21, OPEN_LEN = Math.PI * 1.58;
  bag.add('cloth', openLathe([
    [0.084 * H, 0.470 * H], [0.090 * H, 0.560 * H], [0.094 * H, 0.660 * H],
    [0.096 * H, 0.745 * H], [0.090 * H, 0.798 * H], [0.066 * H, 0.828 * H]
  ], OPEN_START, OPEN_LEN, 0.84), { chain: torsoChain, color: HAORI, blend: 0.06 });
  // the lining shows on the inside face of the same shell, a hair narrower
  bag.add('cloth', openLathe([
    [0.078 * H, 0.478 * H], [0.084 * H, 0.560 * H], [0.088 * H, 0.660 * H],
    [0.090 * H, 0.745 * H], [0.084 * H, 0.796 * H], [0.062 * H, 0.824 * H]
  ], OPEN_START, OPEN_LEN, 0.84), { chain: torsoChain, color: LINING, blend: 0.06 });
  // collar: a low roll that follows the same opening rather than a barrel
  // round the throat (pass 1 read as a scarf and hid the neck markings)
  bag.add('cloth', openLathe([
    [0.052 * H, 0.800 * H], [0.058 * H, 0.826 * H], [0.052 * H, 0.848 * H]
  ], OPEN_START, OPEN_LEN, 0.88), { chain: torsoChain, color: LINING, blend: 0.05 });
  // wide obi at the waist, closed all the way round, with the knot at the back
  bag.add('cloth', latheY([
    [0.076 * H, 0.494 * H], [0.081 * H, 0.516 * H], [0.081 * H, 0.552 * H], [0.075 * H, 0.572 * H]
  ], 20, 0.80), { chain: torsoChain, color: OBI, blend: 0.05 });
  bag.add('cloth', tGeo(roundBox(0.062 * H, 0.044 * H, 0.028 * H, 0.008),
    { pos: [0, 0.532 * H, -0.064 * H] }), { bone: 'Hips', color: OBI });
  // hakama: a wide skirt off the obi, the tatters handled by the springs below
  bag.add('cloth', latheY([
    [0.078 * H, 0.498 * H], [0.096 * H, 0.430 * H], [0.108 * H, 0.352 * H]
  ], 20, 0.88), { bone: 'Hips', color: HAKAMA });

  // ---- HAIR: short, dense, driven upward ----------------------------------
  const spikes = [];
  const addSpike = (dir, len, rBase, bendUp = 0.3) => {
    const d = dir.clone().normalize();
    const pos = headC.clone().addScaledVector(d, headR * 0.86);
    const geo = coneSpike(rBase, len, new THREE.Vector3(0, len * bendUp, 0), { radial: 6, hSeg: 4 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(pos.x, pos.y, pos.z);
    geo.computeVertexNormals();
    spikes.push(geo);
  };
  // crown: tall upright blades, longest at the front — the whole mass is
  // driven UP and slightly back, never forward over the brow
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.22;
    addSpike(v3(Math.sin(a) * 0.30, 1, Math.cos(a) * 0.26 - 0.10),
      headR * (0.78 + (i % 2) * 0.16), headR * 0.40, 0.10);
  }
  // mid ring flaring outward, shorter round the back
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.5;
    const back = Math.cos(a) < -0.4;
    addSpike(v3(Math.sin(a) * 0.80, 0.86, Math.cos(a) * 0.74),
      headR * ((back ? 0.40 : 0.56) + (i % 2) * 0.10), headR * 0.34, back ? -0.05 : 0.22);
  }
  // hairline: points breaking over the brow, angled UP and out
  addSpike(v3(0.16, 0.92, 0.60), headR * 0.56, headR * 0.30, 0.24);
  addSpike(v3(-0.22, 0.90, 0.58), headR * 0.54, headR * 0.29, 0.24);
  addSpike(v3(0.52, 0.88, 0.44), headR * 0.48, headR * 0.27, 0.20);
  addSpike(v3(-0.54, 0.86, 0.42), headR * 0.46, headR * 0.26, 0.20);
  // Temples swept BACK and up, not out. Pass 3 aimed these nearly horizontally
  // sideways and the result was a pair of horns at ear height.
  for (const s of [1, -1]) {
    addSpike(v3(s * 0.62, 0.72, -0.32), headR * 0.44, headR * 0.27, 0.10);
    addSpike(v3(s * 0.48, 0.30, -0.86), headR * 0.42, headR * 0.30, -0.28);
  }
  addSpike(v3(0, 0.26, -1), headR * 0.44, headR * 0.32, -0.34);
  // scalp caps. PASS 3 pulled the front cap UP and shortened it: at 0.42 pi it
  // came down over the forehead bars and the upper one never appeared at all.
  // The back cap is unchanged — the nape should be covered.
  bag.add('hair', tGeo(sphereShell(headR * 1.06, { thetaLength: Math.PI * 0.32, scale: [1, 0.96, 1.02] }),
    { pos: [headC.x, headC.y + headR * 0.14, headC.z - headR * 0.06] }), { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 1.06, { thetaLength: Math.PI * 0.52, scale: [1, 1.05, 1] }),
    { rot: [-62, 0, 0], pos: [headC.x, headC.y - headR * 0.08, headC.z - headR * 0.30] }), { bone: 'Head', color: HAIR });
  for (const s of spikes) bag.add('hair', s, { bone: 'Head', color: HAIR });

  // ---- springs: haori tails + hakama tatters -------------------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.062 * H, -0.055 * H, -0.045 * H),
      restDir: v3(s * 0.10, -1, -0.14).normalize(), stiffness: 52, damping: 0.82, gravity: 8,
      segments: [
        { len: 0.085 * H, mesh: makeFlapMesh(0.072 * H, 0.062 * H, 0.085 * H, 0.009, clothMat, HAORI, oOpts) },
        { len: 0.075 * H, mesh: makeFlapMesh(0.062 * H, 0.038 * H, 0.075 * H, 0.008, clothMat, HAORI, oOpts) }
      ]
    });
    // the hakama's torn front panels
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.030 * H, -0.075 * H, 0.040 * H),
      restDir: v3(s * 0.04, -1, 0.10).normalize(), stiffness: 60, damping: 0.80, gravity: 9,
      segments: [
        { len: 0.070 * H, mesh: makeFlapMesh(0.056 * H, 0.030 * H, 0.070 * H, 0.008, clothMat, HAKAMA, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.013, outlineHairScale: 0,
    materials: { mark: markMat }
  });

  // =========================================================================
  // FINGER STACKS — the markings spread and darken
  // =========================================================================
  // Four tiers of extra geometry, each parented rigidly to the bone it sits
  // on and hidden until the matching stack is eaten. The always-on set above
  // stays where it is; these only ADD. `setFingers(n)` also drives the shared
  // mark material from faint to full black, and lights the glow group at max.
  const tierMat = new THREE.MeshBasicMaterial({ color: MARK });
  // PASS 5 dropped this from 0.9 — additive red over a near-black mark blew
  // out to white and the forehead bar read as a sticker rather than a glow.
  const glowMat = new THREE.MeshBasicMaterial({
    color: GLOW, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const tiers = [];
  const mkTier = () => { const t = []; tiers.push(t); return t; };
  // A tier spans several bones, so it is a LIST of meshes rather than one
  // group: each mesh is parented to the bone it rides and the tier only owns
  // their visibility. `pos` is bone-local (bind pose = identity rotation, so
  // world offset and local offset are the same thing).
  const put = (tier, bone, geo, pos, rot = [0, 0, 0], mat = tierMat) => {
    const b = model.getBone(bone);
    if (!b) return;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.visible = false;
    b.add(mesh);
    tier.push(mesh);
  };
  // bone-local helper: joints are in world bind space, bones are relative
  const local = (bone, world) => {
    const j = joints.get(bone);
    return [world[0] - j.x, world[1] - j.y, world[2] - j.z];
  };

  // ---- TIER 1: forearm bands on all four arms, a third chest diagonal ------
  const t1 = mkTier();
  for (const [up, lo, hand] of ARMS) {
    if (!joints.get(lo)) continue;
    const small = lo.endsWith('2');
    const r = (small ? 0.0215 : 0.0238) * H;
    const j = joints.get(lo);
    put(t1, lo, new THREE.CylinderGeometry(r, r, 0.010 * H, 12, 1, true),
      local(lo, [j.x, j.y - 0.034 * H, j.z]));
    put(t1, lo, new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.008 * H, 12, 1, true),
      local(lo, [j.x, j.y - 0.056 * H, j.z]));
  }
  for (const s of [1, -1]) {
    put(t1, 'Spine', roundBox(0.052 * H, 0.009 * H, 0.005 * H, 0.002),
      local('Spine', [s * 0.030 * H, 0.662 * H, 0.056 * H]), [0, 0, s * 0.22]);
  }

  // ---- TIER 2: the abdomen bands and the shoulder dots ---------------------
  const t2 = mkTier();
  // three bands across the stomach, kept CLEAR of the seam at 0.604H — pass 5
  // ran one straight through it and the two together read as a printed label
  for (let i = 0; i < 3; i++) {
    put(t2, 'Spine', roundBox(0.062 * H - i * 0.009 * H, 0.008 * H, 0.005 * H, 0.002),
      local('Spine', [0, 0.564 * H - i * 0.022 * H, 0.050 * H]));
  }
  for (const [up] of ARMS) {
    if (!joints.get(up)) continue;
    const j = joints.get(up);
    const m = j.x >= 0 ? 1 : -1;
    const r = (up.endsWith('2') ? 0.012 : 0.014) * H;
    put(t2, up, new THREE.SphereGeometry(r, 10, 8),
      local(up, [j.x + m * 0.020 * H, j.y + 0.004 * H, j.z]), [0, 0, 0]);
  }

  // ---- TIER 3: temple lines to the jaw, thigh bands, hand backs ------------
  const t3 = mkTier();
  for (const s of [1, -1]) {
    put(t3, 'Head', roundBox(headR * 0.065, headR * 0.42, 0.004, 0.002),
      local('Head', [s * headR * 0.76, eyeY + headR * 0.06, headC.z + headR * 0.30]),
      [0, s * 0.55, s * 0.20]);
    const tj = joints.get('Thigh' + (s > 0 ? 'L' : 'R'));
    put(t3, 'Thigh' + (s > 0 ? 'L' : 'R'),
      new THREE.CylinderGeometry(0.047 * H, 0.047 * H, 0.011 * H, 12, 1, true),
      local('Thigh' + (s > 0 ? 'L' : 'R'), [tj.x, tj.y - 0.055 * H, tj.z]));
  }
  for (const [, , hand] of ARMS) {
    if (!joints.get(hand)) continue;
    const j = joints.get(hand);
    put(t3, hand, roundBox(0.020 * H, 0.030 * H, 0.004 * H, 0.002),
      local(hand, [j.x, j.y - 0.030 * H, j.z + 0.013 * H]));
  }

  // ---- TIER 4: the face closes up, and the sternum line joins the chest ----
  const t4 = mkTier();
  put(t4, 'Head', roundBox(headR * 0.30, headR * 0.055, 0.004, 0.002),
    local('Head', [0, eyeY + headR * 0.04, faceZ + headR * 0.03]));
  for (const s of [1, -1]) {
    put(t4, 'Head', roundBox(headR * 0.055, headR * 0.24, 0.004, 0.002),
      local('Head', [s * headR * 0.30, eyeY + headR * 0.44, faceZ + headR * 0.006]));
  }
  put(t4, 'Chest', roundBox(0.010 * H, 0.090 * H, 0.005 * H, 0.002),
    local('Chest', [0, 0.712 * H, 0.058 * H]));

  // ---- the glow, at maximum stacks only -----------------------------------
  // Additive red over all four irises and the heaviest marks. This is the
  // "at a glance, he is at maximum" read.
  const glowGroup = new THREE.Group();
  glowGroup.visible = false;
  for (const s of [1, -1]) {
    const up = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.115, 12), glowMat);
    up.position.set(...local('Head', [s * headR * 0.40, eyeY, faceZ + headR * 0.034]));
    const lo = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.075, 10), glowMat);
    lo.position.set(...local('Head', [s * headR * 0.42, eyeY - headR * 0.40, faceZ + headR * 0.032]));
    glowGroup.add(up, lo);
  }
  // the forehead bar catches it too — ONE of them (pass 5 built this inside
  // the left/right loop and stacked two coincident meshes, which doubled the
  // additive contribution and was half the reason it blew out white)
  {
    const fb = new THREE.Mesh(roundBox(headR * 0.86, headR * 0.060, 0.004, 0.002), glowMat);
    fb.position.set(...local('Head', [0, eyeY + headR * 0.50, faceZ + headR * 0.022]));
    glowGroup.add(fb);
  }
  model.getBone('Head').add(glowGroup);

  // The public switch. n = 0..4 Finger stacks.
  model.setFingers = n => {
    const k = Math.max(0, Math.min(tiers.length, n | 0));
    for (let i = 0; i < tiers.length; i++) for (const mesh of tiers[i]) mesh.visible = i < k;
    // the always-on set darkens from faint toward full black as he eats
    markMat.color.setScalar(0.58 + 0.42 * (k / tiers.length));
    tierMat.color.setHex(k >= tiers.length ? 0x000000 : MARK);
    glowGroup.visible = k >= tiers.length;
  };
  model.setFingers(0);

  return model;
}
