// MAHITO — Idle Transfiguration. Built to the researched MAPPA S1–S2 design.
//
// ============================ REFERENCE SHEET ============================
// Sources: JJK wiki character sheets + key visual descriptions (researched;
// original geometry matching the design — no imported assets).
//
// BUILD    Average height (H 1.75), lean and slender: narrow shoulders, long
//          limbs. Deceptively normal silhouette — the wrongness is in the
//          seams and the hair, not the shape.
// HAIR     Desaturated GREY-BLUE, shoulder length. Messy feathered top with
//          face-framing strands; the bulk gathers into THREE thick rope-like
//          tails — one at the back, one at each side — each TIED near its
//          end with a small dark band so the tip flares below the tie. From
//          the side/back the three tails are the read. (Tails are spring
//          chains here so they swing with him.)
// FACE     Heterochromia: LEFT eye dark blue #2e4a76, RIGHT eye grey
//          #8a8f96. Narrow, relaxed, slightly droopy eyes. Permanent faint
//          half-smile — he is enjoying himself. Stitched seams: horizontal
//          across each cheek under the eyes (with cross ticks), one at the
//          forehead/hairline, one ringing the neck.
// BODY     Patchwork seams continue over the body: collar seam, across the
//          collarbones, rings around upper arms and wrists — thin RAISED
//          geometry in a darker tone so the rim light catches it, plus
//          subtle mismatched skin panels.
// CLOTHES  Loose black/near-navy tunic top; the LEFT SLEEVE splits into
//          three hanging strips (spring cloth). Matching loose trousers
//          cuffed at mid-calf, bare shins, flat white shoes.
// PALETTE  hair #8b9bab (shadow #5c6b7c) · skin #e8ded6, seams #4a3f3f ·
//          eyes L #2e4a76 / R #8a8f96 · cloth #22242c (lining #3a3d48) ·
//          shoes #e9e9e6
// IDENTITY 1) grey-blue hair in three tied tails  2) cross-stitched
//          patchwork seams on face and body  3) serene mismatched-eyed
//          half-smile + the split left sleeve.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, coneSpike, sphereShell, almondEye, shapeExtrude } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const HAIR = 0x8b9bab;
const HAIR_DK = 0x5c6b7c;
const SKIN = 0xe8ded6;
const SKIN_PATCH = 0xd8cbc4;  // mismatched panel tone
const SEAM = 0x4a3f3f;
const CLOTH = 0x22242c;
const LINING = 0x3a3d48;
const TIE = 0x2a2430;

// VARIANTS. `opts.distorted` builds INSTANT SPIRIT BODY OF DISTORTED KILLING:
// the skin sheds, the body under it is a hard carapace, and the tail and
// tendrils come out. Defaults reproduce the shipped model exactly.
export function buildMahito(opts = {}) {
  const { distorted = false } = opts;
  const CARAPACE = 0x6f7f92, CARA_DK = 0x3e4a58;
  const spec = {
    id: 'mahito', name: 'Mahito', H: 1.75, headScale: 1.02,
    shoulder: distorted ? 0.110 : 0.098, hip: 0.05,
    muscle: distorted ? 1.16 : 0.95, bulk: distorted ? 1.14 : 0.96, legBulk: distorted ? 1.06 : 0.94,
    skinTone: distorted ? CARAPACE : SKIN,
    clothColor: distorted ? CARAPACE : CLOTH, pantColor: distorted ? CARA_DK : CLOTH,
    shoeColor: distorted ? CARA_DK : 0xe9e9e6,
    torsoShape: distorted ? { chest: 1.12, waist: 1.0, hip: 1.02 } : { chest: 1.0, waist: 1.02, hip: 1.0 },
    face: { jaw: 1.0, chin: 0.96, width: 1.0 },
    shoe: { len: 0.11, hgt: 0.042 },
    palette: distorted
      ? { rim: 0x8fa4bb, hairRim: 0x8fa4bb, outline: 0x0a0d12, accent: 0x6f7f92, energy: 0x7f93a8 }
      : { rim: 0xaebccb, hairRim: 0xc9d6e2, outline: 0x101216, accent: 0x8b9bab, energy: 0x9fb8cf }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // ---- face: droopy mismatched eyes + the half-smile -----------------------
  addFace(ctx, { noEyes: true, browTilt: -4, browUp: 1.2, browColor: 0x6b7684, mouthW: 0.0 });
  const eyeW = headR * 0.5, eyeH = headR * 0.24; // narrower than the roster norm
  const EYES = { 1: 0x2e4a76, [-1]: 0x8a8f96 };  // s=1 is his left (screen +x)
  for (const s of [1, -1]) {
    const ex = s * headR * 0.40;
    // relaxed lash line, tilted DOWN toward the outside (droop)
    bag.add('flat', tGeo(roundBox(eyeW * 1.05, eyeH * 0.26, 0.004, 0.002),
      { rot: [0, 0, s * -6], pos: [ex, eyeY + eyeH * 0.45, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x1a1c22 });
    bag.add('flat', tGeo(almondEye(eyeW, eyeH, s * -4),
      { pos: [ex, eyeY, faceZ + headR * 0.02] }), { bone: 'Head', color: 0xf2f4f8 });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.44, 12),
      { scale: [0.85, 1.1, 1], pos: [ex - s * eyeW * 0.05, eyeY + eyeH * 0.04, faceZ + headR * 0.024] }),
      { bone: 'Head', color: EYES[s] });
    bag.add('flat', tGeo(new THREE.CircleGeometry(eyeH * 0.12, 8),
      { pos: [ex - s * eyeW * 0.02, eyeY + eyeH * 0.14, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0xffffff });
  }
  // the permanent half-smile: a thin line kicked up on his left
  bag.add('flat', tGeo(roundBox(headR * 0.26, headR * 0.04, 0.004, 0.002),
    { rot: [0, 0, 9], pos: [headR * 0.03, headC.y - headR * 0.58, faceZ - headR * 0.04] }),
    { bone: 'Head', color: 0x5a3a40 });

  // ---- stitches: raised seam geometry (skin slot -> catches rim light) -----
  const seam = (w, l, rot, p, bone = 'Head') =>
    bag.add('skin', tGeo(roundBox(w, l, 0.008, 0.003), { rot, pos: p }), { bone, color: SEAM });
  const tick = (x, yy, z, bone = 'Head') =>
    bag.add('skin', tGeo(roundBox(headR * 0.028, headR * 0.09, 0.008, 0.003), { pos: [x, yy, z] }), { bone, color: SEAM });
  // cheek seams under each eye, running back toward the ears, with cross ticks
  for (const s of [1, -1]) {
    seam(headR * 0.62, headR * 0.045, [0, s * 24, s * -5],
      [s * headR * 0.5, eyeY - headR * 0.34, faceZ - headR * 0.12]);
    for (let i = 0; i < 3; i++) {
      tick(s * headR * (0.3 + i * 0.17), eyeY - headR * 0.34 + (i % 2 ? 0.006 : -0.004),
        faceZ - headR * 0.10 - i * headR * 0.045);
    }
  }
  // forehead seam at the hairline, off-center
  seam(headR * 0.5, headR * 0.045, [0, -14, 8], [-headR * 0.22, headC.y + headR * 0.44, faceZ - headR * 0.22]);
  // mismatched skin panel on the right cheek (subtle tone shift)
  bag.add('skin', tGeo(almondEye(headR * 0.5, headR * 0.42, 0),
    { rot: [0, -18, 0], pos: [-headR * 0.42, eyeY - headR * 0.4, faceZ - headR * 0.08] }),
    { bone: 'Head', color: SKIN_PATCH });
  // neck ring seam
  bag.add('skin', tGeo(new THREE.TorusGeometry(0.0245 * H, 0.004, 6, 14),
    { rot: [96, 0, 0], pos: [0, y.neck + 0.012 * H, 0.006 * H] }), { bone: 'Neck', color: SEAM });
  // collarbone seam + wrist rings
  seam(0.07 * H, 0.008 * H, [0, 0, -8], [0.02 * H, 0.79 * H, 0.055 * H], 'Chest');
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    bag.add('skin', tGeo(new THREE.TorusGeometry(0.017 * H, 0.0035, 6, 12),
      { rot: [90, 0, 0], pos: [wr.x, wr.y + 0.005 * H, wr.z] }), { bone: 'Hand' + s, color: SEAM });
  }

  // ---- clothing ------------------------------------------------------------
  // loose tunic silhouette: flared hem hanging past the hips
  bag.add('cloth', tGeo(latheY([
    [0.082 * H, 0.40 * H], [0.086 * H, 0.46 * H], [0.079 * H, 0.53 * H]
  ], 20, 0.8), {}), { bone: 'Hips', color: CLOTH });
  // soft collar hugging the neck
  bag.add('cloth', tGeo(latheY([
    [0.031 * H, y.neck - 0.022 * H], [0.037 * H, y.neck + 0.002 * H]
  ], 14, 0.9), {}), { bone: 'Neck', color: LINING });
  // trousers cuffs at mid-calf + bare shins above the shoes
  for (const s of ['L', 'R']) {
    const kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const cuffY = kn.y * 0.62 + an.y * 0.38;
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.031 * H, 0.034 * H, 0.035 * H, 10),
      { pos: [an.x * 0.9 + kn.x * 0.1, cuffY, an.z * 0.5 + kn.z * 0.5] }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: LINING, blend: 0.06 });
    // pale shin between cuff and shoe
    bag.add('skin', tGeo(new THREE.CylinderGeometry(0.0175 * H, 0.0165 * H, cuffY - an.y - 0.02 * H, 9),
      { pos: [an.x, (cuffY + an.y) / 2, an.z * 0.6 + kn.z * 0.4] }),
      { chain: [{ bone: 'Shin' + s, point: kn }, { bone: 'Foot' + s, point: an }], color: SKIN, blend: 0.06 });
  }

  // ---- hair: feathered top + fringe, three tied tails as springs -----------
  // scalp cap
  bag.add('hair', tGeo(sphereShell(headR * 1.08, { thetaLength: Math.PI * 0.5, scale: [1, 0.98, 1.04] }),
    { pos: [headC.x, headC.y + headR * 0.06, headC.z - headR * 0.04] }), { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 1.08, { thetaLength: Math.PI * 0.55, scale: [1, 1.02, 1] }),
    { rot: [-58, 0, 0], pos: [headC.x, headC.y - headR * 0.12, headC.z - headR * 0.28] }), { bone: 'Head', color: HAIR });
  // messy feathered top: soft downward-bent spikes, middle-ish parting
  const addStrand = (dir, len, rBase, bend) => {
    const d = dir.clone().normalize();
    const pos = headC.clone().addScaledVector(d, headR * 0.9);
    const geo = coneSpike(rBase, len, bend, { radial: 5, hSeg: 4 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(pos.x, pos.y, pos.z);
    geo.computeVertexNormals();
    bag.add('hair', geo, { bone: 'Head', color: HAIR });
  };
  // parting: strands sweep out to both sides from just left of center
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    const a = side * (0.25 + (i >> 1) * 0.3);
    addStrand(v3(Math.sin(a), 0.85, 0.5 + (i % 3) * 0.1), headR * 0.5, headR * 0.3, v3(side * 0.1, -headR * 0.3, 0.05));
  }
  // face-framing strands falling over forehead and cheeks
  addStrand(v3(0.16, 0.3, 1), headR * 0.52, headR * 0.24, v3(0.02, -headR * 0.45, 0.06));
  addStrand(v3(-0.28, 0.28, 0.95), headR * 0.56, headR * 0.26, v3(-0.04, -headR * 0.5, 0.05));
  addStrand(v3(0.6, 0.24, 0.75), headR * 0.6, headR * 0.24, v3(0.05, -headR * 0.55, 0));
  addStrand(v3(-0.62, 0.22, 0.72), headR * 0.6, headR * 0.24, v3(-0.05, -headR * 0.55, 0));
  // temples/nape fill so the hairline closes
  for (const s of [1, -1]) addStrand(v3(s * 0.95, 0.1, 0.05), headR * 0.5, headR * 0.3, v3(0, -headR * 0.4, -0.05));
  addStrand(v3(0, 0.15, -0.95), headR * 0.5, headR * 0.34, v3(0, -headR * 0.35, -0.08));

  // THE THREE TAILS — thick rope strands, tied near the end, tips flaring.
  // Spring chains so they swing with movement; the tie is the middle segment.
  const hairMat = MAT.hair({ rimColor: spec.palette.hairRim });
  const oOpts = { color: spec.palette.outline, thickness: 0.007 };
  const springs = [];
  const tail = (localOffset, restDir, w) => springs.push({
    bone: 'Head', localOffset, restDir, stiffness: 70, damping: 0.82, gravity: 8,
    segments: [
      { len: 0.075 * H, mesh: makeFlapMesh(w, w * 0.85, 0.075 * H, w * 0.75, hairMat, HAIR, oOpts) },
      { len: 0.018 * H, mesh: makeFlapMesh(w * 0.66, w * 0.6, 0.018 * H, w * 0.62, hairMat, TIE, oOpts) },  // the tie band
      { len: 0.05 * H, mesh: makeFlapMesh(w * 0.75, w * 1.2, 0.05 * H, w * 0.65, hairMat, HAIR_DK, oOpts) } // flared tip
    ]
  });
  const headJ = joints.get('Head');
  const backY = headC.y - headR * 0.3 - headJ.y;
  tail(v3(0, backY, -headR * 1.12 + (headC.z - headJ.z)), v3(0, -1, -0.25).normalize(), 0.045 * H); // back
  tail(v3(headR * 0.82, backY, -headR * 0.45), v3(0.14, -1, -0.1).normalize(), 0.03 * H);         // his left
  tail(v3(-headR * 0.82, backY, -headR * 0.45), v3(-0.14, -1, -0.1).normalize(), 0.03 * H);       // his right

  // the split left sleeve: three cloth strips hanging from the left forearm
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  // hung from the wrist so the strips trail off the end of the sleeve
  for (let i = 0; i < 3; i++) {
    springs.push({
      bone: 'HandL', localOffset: v3((i - 1) * 0.013 * H, 0.01 * H, (i - 1) * 0.006 * H),
      restDir: v3((i - 1) * 0.18, -1, 0).normalize(), stiffness: 55, damping: 0.8, gravity: 9,
      segments: [
        { len: 0.045 * H, mesh: makeFlapMesh(0.018 * H, 0.015 * H, 0.045 * H, 0.006, clothMat, CLOTH, oOpts) },
        { len: 0.04 * H, mesh: makeFlapMesh(0.015 * H, 0.01 * H, 0.04 * H, 0.005, clothMat, i === 1 ? LINING : CLOTH, oOpts) }
      ]
    });
  }
  // tunic hem flaps
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.05 * H, -0.09 * H, -0.04 * H),
      restDir: v3(s * 0.05, -1, -0.1).normalize(), stiffness: 60, damping: 0.8, gravity: 7,
      segments: [
        { len: 0.05 * H, mesh: makeFlapMesh(0.06 * H, 0.05 * H, 0.05 * H, 0.008, clothMat, CLOTH, oOpts) },
        { len: 0.045 * H, mesh: makeFlapMesh(0.05 * H, 0.04 * H, 0.045 * H, 0.007, clothMat, CLOTH, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, { springs, outlineThickness: 0.011, outlineHairScale: 0 });

  // ---- BODY WEAPON overlays ------------------------------------------------
  // three distinct reshaped-arm forms parented to the right hand, shown by
  // showBodyWeapon(variant) for the swing then melting away. Flesh-toned —
  // these are his own body, not equipment.
  const hand = model.getBone('HandR');
  const fleshMat = MAT.skin({ rimColor: 0xaebccb });
  const mkColored = (geo, color) => {
    const n = geo.getAttribute('position').count;
    const c = new THREE.Color(color);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return new THREE.Mesh(geo, fleshMat);
  };
  const weapons = [];
  // 0 — BLADE: a long flat bone-flesh cleaver
  {
    const g = new THREE.Group();
    const blade = mkColored(shapeExtrude([
      [0, 0], [0.05, -0.02], [0.09, -0.5], [0.05, -0.62], [0, -0.6], [-0.02, -0.3]
    ], 0.015), SKIN_PATCH);
    g.add(blade);
    weapons.push(g);
  }
  // 1 — HAMMER: a swollen mass of knotted flesh
  {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const lump = mkColored(new THREE.SphereGeometry(0.07 + (i % 3) * 0.03, 8, 6), i % 2 ? SKIN_PATCH : SKIN);
      lump.position.set((Math.random() - 0.5) * 0.08, -0.3 - i * 0.05, (Math.random() - 0.5) * 0.08);
      g.add(lump);
    }
    weapons.push(g);
  }
  // 2 — SPIKES: a fan of bone spears bursting from the forearm
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const spike = mkColored(coneSpike(0.028, 0.42 + (i % 2) * 0.12, new THREE.Vector3(0, 0, 0.04), { radial: 6 }), 0xd8cbc4);
      spike.rotation.z = Math.PI + (i - 1.5) * 0.28;
      spike.position.y = -0.12;
      g.add(spike);
    }
    weapons.push(g);
  }
  for (const w of weapons) { w.visible = false; hand.add(w); }
  let bwT = 0, bwActive = null;
  model.showBodyWeapon = variant => {
    if (bwActive) bwActive.visible = false;
    bwActive = weapons[variant % weapons.length];
    bwActive.visible = true;
    bwT = 0.75;
  };
  // ---- DISTORTED KILLING: the crown plate, the tail, the tendrils ---------
  // Per the wiki: the eyes are covered by a crown-like plate crudely attached
  // to the lower jaw; a thick tail; black tendrils from both elbows and more
  // at the back of the head. Built after finalize and parented to bones, so
  // none of the base mesh, rig or materials is touched.
  if (distorted) {
    const dark = new THREE.MeshBasicMaterial({ color: 0x14181f });
    const plate = new THREE.MeshBasicMaterial({ color: 0xb9c6d4 });
    const headB = model.getBone('Head');
    const hj = joints.get('Head');
    const L = (j, w) => [w[0] - j.x, w[1] - j.y, w[2] - j.z];
    // the crown plate over the eyes, sitting crooked
    const cp = new THREE.Mesh(roundBox(headR * 1.7, headR * 0.52, headR * 0.30, headR * 0.05), plate);
    cp.position.set(...L(hj, [0, headC.y - headR * 0.04, headC.z + headR * 0.30]));
    cp.rotation.z = 0.13;
    headB.add(cp);
    // its crude jaw fixings
    for (const s of [1, -1]) {
      const pin = new THREE.Mesh(roundBox(headR * 0.11, headR * 0.55, headR * 0.11, headR * 0.03), plate);
      pin.position.set(...L(hj, [s * headR * 0.62, headC.y - headR * 0.42, headC.z + headR * 0.24]));
      pin.rotation.z = s * -0.2;
      headB.add(pin);
    }
    // tendrils off the back of the head
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI - Math.PI * 0.5;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.05, headR * 0.02, headR * 1.5, 5), dark);
      t.position.set(...L(hj, [Math.sin(a) * headR * 0.5, headC.y + headR * 0.1, headC.z - headR * 1.0]));
      t.rotation.set(-1.1, a * 0.6, 0);
      headB.add(t);
    }
    // elbow tendrils
    for (const side of ['L', 'R']) {
      const b = model.getBone('LoArm' + side), j = joints.get('LoArm' + side);
      if (!b) continue;
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * H, 0.003 * H, 0.19 * H, 5), dark);
        t.position.set(...L(j, [j.x + (i - 1) * 0.014 * H, j.y - 0.02 * H, j.z - 0.030 * H]));
        t.rotation.set(-0.5 + i * 0.2, 0, (i - 1) * 0.25);
        b.add(t);
      }
    }
    // the tail
    const hipB = model.getBone('Hips'), hipJ = joints.get('Hips');
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.030 * H, 0.008 * H, 0.52 * H, 7), dark);
    tail.position.set(...L(hipJ, [0, hipJ.y - 0.10 * H, hipJ.z - 0.14 * H]));
    tail.rotation.x = -0.95;
    hipB.add(tail);
  }

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    if (bwActive) {
      bwT -= dt;
      const s = Math.min(1, Math.max(0.01, bwT > 0.6 ? (0.75 - bwT) * 8 : bwT * 2.5));
      bwActive.scale.setScalar(s);
      if (bwT <= 0) { bwActive.visible = false; bwActive = null; }
    }
  };
  return model;
}
