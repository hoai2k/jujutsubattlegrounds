// GOJO — tall, lean, high-collar dark jacket, black blindfold, white spiked
// hair. Silhouette: vertical, sharp, crowned by the spike halo.
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, coneSpike, sphereShell, roundBox } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3, DEG } from '../../core/mathutil.js';

const JACKET = 0x171b28;
const JACKET_DK = 0x121522;
const TRIM = 0x93a6c8;
const HAIR = 0xf2f6ff;
const BLINDFOLD = 0x0b0c12;
const SKIN = 0xf3dcc8;

// VARIANTS. `opts` is additive and every default reproduces the original model
// exactly, so `buildGojo()` with no arguments is byte-for-byte the character
// that shipped. Two dials:
//   blindfold : false takes the fold off and opens the SIX EYES as real
//               geometry with their own material — the eyes are the whole
//               point of that look, so they are not a texture swap.
//   shinjuku  : the Shinjuku Showdown outfit and condition — black shirt,
//               white training pants, black belt, and battle damage built into
//               the geometry as torn hanging cloth with its own spring chains.
export function buildGojo(opts = {}) {
  const { blindfold = true, shinjuku = false } = opts;
  const TOP = shinjuku ? 0x14151b : JACKET;
  const BOTTOM = shinjuku ? 0xd8d4c8 : JACKET_DK;
  const spec = {
    id: 'gojo', name: 'Gojo', H: 1.92, headScale: 0.98,
    shoulder: 0.099, hip: 0.05, muscle: shinjuku ? 1.04 : 0.98, bulk: 0.94, legBulk: 0.9,
    skinTone: SKIN, clothColor: TOP, pantColor: BOTTOM, shoeColor: 0x0d0e14,
    torsoShape: { chest: 1.04, waist: 0.90, hip: 0.92 },
    face: { jaw: 1.05, chin: 1.0, width: 0.98 },
    shoe: { len: 0.118, hgt: shinjuku ? 0.038 : 0.055 },
    palette: shinjuku
      ? { rim: 0xc6a8ff, hairRim: 0xe8dcff, outline: 0x0a0810, accent: 0xb47fff, energy: 0xb47fff }
      : { rim: 0x9fd0ff, hairRim: 0xd8ecff, outline: 0x0a0e1c, accent: 0x7fd0ff, energy: 0x8fd4ff }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain } = ctx.m;

  // ---- jacket details -----------------------------------------------------
  // Shinjuku wears a plain tight shirt, so the whole uniform kit — collar,
  // trim, zipper, hem skirt, cuffs — is skipped for it.
  if (!shinjuku) {
  // tall collar
  bag.add('cloth', latheY([
    [0.036 * H, y.neck - 0.012 * H], [0.041 * H, y.neck + 0.012 * H], [0.046 * H, y.headBase + 0.022 * H]
  ], 16, 0.85), { bone: 'Neck', color: JACKET });
  // collar trim lip
  bag.add('cloth', latheY([
    [0.046 * H, y.headBase + 0.020 * H], [0.0475 * H, y.headBase + 0.03 * H]
  ], 16, 0.85), { bone: 'Head', color: TRIM });
  // zipper strip down the front — three short segments hugging the torso curve
  for (const [cy, cz, ch] of [[0.775 * H, 0.052 * H, 0.09 * H], [0.685 * H, 0.046 * H, 0.09 * H], [0.60 * H, 0.040 * H, 0.08 * H]]) {
    bag.add('cloth', tGeo(roundBox(0.011 * H, ch, 0.006 * H, 0.002),
      { pos: [0, cy, cz] }), { chain: torsoChain, color: TRIM, blend: 0.05 });
  }
  // jacket hem skirt over the hips
  bag.add('cloth', latheY([
    [0.0745 * H, 0.415 * H], [0.0725 * H, 0.46 * H], [0.069 * H, 0.505 * H]
  ], 20, 0.78), { bone: 'Hips', color: JACKET });
  // sleeve cuffs
  for (const s of ['L', 'R']) {
    const wr = ctx.m.joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0205 * H, 0.023 * H, 0.035 * H, 10),
      { pos: [wr.x, wr.y + 0.02 * H, wr.z] }), { bone: 'LoArm' + s, color: JACKET_DK });
  }
  }

  // ---- SHINJUKU: the belt, and the damage --------------------------------
  if (shinjuku) {
    // black belt woven through the waist of the white pants
    bag.add('cloth', latheY([
      [0.0705 * H, 0.500 * H], [0.0735 * H, 0.518 * H], [0.0735 * H, 0.548 * H], [0.0700 * H, 0.566 * H]
    ], 18, 0.80), { chain: torsoChain, color: 0x111116, blend: 0.05 });
    // BATTLE DAMAGE AS GEOMETRY, not as a painted texture: the shirt is torn
    // open across the chest and both sleeves are gone at the bicep, so the cuts
    // read in silhouette from any angle rather than only face-on.
    for (const [sx, cy, w, h, rz] of [
      [1, 0.735, 0.030, 0.055, 0.30], [-1, 0.700, 0.024, 0.070, -0.22],
      [1, 0.648, 0.022, 0.048, 0.55], [-1, 0.612, 0.026, 0.040, -0.40]
    ]) {
      bag.add('skin', tGeo(roundBox(w * H, h * H, 0.010 * H, 0.004),
        { rot: [0, 0, rz * 57.3], pos: [sx * 0.030 * H, cy * H, 0.052 * H] }),
        { chain: torsoChain, color: SKIN, blend: 0.05 });
    }
    // torn sleeve stubs — the shirt ends raggedly above the elbow
    for (const s of ['L', 'R']) {
      const sh = ctx.m.joints.get('UpArm' + s);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        bag.add('cloth', tGeo(new THREE.ConeGeometry(0.008 * H, 0.030 * H, 4), {
          rot: [180, 0, 0],
          pos: [sh.x + Math.cos(a) * 0.030 * H, sh.y - 0.070 * H, sh.z + Math.sin(a) * 0.022 * H]
        }), { bone: 'UpArm' + s, color: TOP });
      }
    }
  }

  // ---- blindfold ----------------------------------------------------------
  const bfY = headC.y - headR * 0.06;
  if (blindfold) {
    bag.add('cloth', latheY([
      [headR * 1.00, bfY - headR * 0.20], [headR * 1.075, bfY], [headR * 1.00, bfY + headR * 0.20]
    ], 20, 0.97), { bone: 'Head', color: BLINDFOLD });
    // knot + short tails at the back
    bag.add('cloth', tGeo(roundBox(headR * 0.22, headR * 0.18, headR * 0.14, 0.004),
      { pos: [0, bfY, headC.z - headR * 1.02] }), { bone: 'Head', color: BLINDFOLD });
    for (const s of [1, -1]) {
      bag.add('cloth', tGeo(roundBox(headR * 0.10, headR * 0.42, 0.006, 0.002),
        { rot: [12, 0, s * 24], pos: [s * headR * 0.10, bfY - headR * 0.3, headC.z - headR * 1.04] }),
        { bone: 'Head', color: BLINDFOLD });
    }
  }

  // THE SIX EYES. Built through the shared face builder so the shape language
  // matches the rest of the roster, then given an additive inner glow that the
  // blindfolded build does not have — at fighting distance the read is "those
  // are lit from inside", which is the entire point of taking the fold off.
  addFace(ctx, blindfold
    ? { noEyes: true, mouthW: 0.22 }
    : {
      noEyes: false, mouthW: 0.22, eyeW: 0.56, eyeH: 0.34,
      eyeColor: shinjuku ? 0x9fd8ff : 0x6fc8ff, eyeTilt: 4, lashTilt: 6,
      browTilt: 6, browUp: 1.30, browColor: 0xe8f4ff, lashColor: 0x2a3550
    });

  // ---- white spiked hair --------------------------------------------------
  const spikes = [];
  const addSpike = (dir, len, rBase, bendUp = 0.4, yawBend = 0) => {
    const d = dir.clone().normalize();
    const pos = headC.clone().addScaledVector(d, headR * 0.86);
    const geo = coneSpike(rBase, len, new THREE.Vector3(yawBend, len * bendUp, 0), { radial: 6, hSeg: 4 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(pos.x, pos.y, pos.z);
    geo.computeVertexNormals();
    spikes.push(geo);
  };
  // crown ring — tall fat spikes straight up with outward lean
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.26;
    addSpike(v3(Math.sin(a) * 0.40, 1, Math.cos(a) * 0.36), headR * (0.82 + (i % 2) * 0.2), headR * 0.38, 0.28);
  }
  // mid ring — flared out
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.62;
    addSpike(v3(Math.sin(a) * 0.85, 0.85, Math.cos(a) * 0.8), headR * (0.60 + (i % 2) * 0.16), headR * 0.34, 0.40);
  }
  // front fringe over the blindfold
  addSpike(v3(0.18, 0.55, 1), headR * 0.52, headR * 0.30, 0.7);
  addSpike(v3(-0.25, 0.5, 0.95), headR * 0.48, headR * 0.28, 0.7);
  addSpike(v3(0.58, 0.48, 0.8), headR * 0.44, headR * 0.26, 0.65);
  addSpike(v3(-0.62, 0.45, 0.76), headR * 0.42, headR * 0.26, 0.65);
  // nape
  addSpike(v3(0.3, 0.14, -1), headR * 0.42, headR * 0.28, -0.3);
  addSpike(v3(-0.3, 0.16, -1), headR * 0.42, headR * 0.28, -0.3);
  // scalp cap under the spikes
  bag.add('hair', tGeo(sphereShell(headR * 1.05, { thetaLength: Math.PI * 0.52, scale: [1, 0.98, 1] }),
    { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.04] }), { bone: 'Head', color: HAIR });
  for (const s of spikes) bag.add('hair', s, { bone: 'Head', color: HAIR });

  // ---- springs -------------------------------------------------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  if (!shinjuku) {
    // uniform: the jacket's back hem flaps
    for (const s of [1, -1]) {
      springs.push({
        bone: 'Hips',
        localOffset: v3(s * 0.052 * H, -0.10 * H, -0.062 * H),
        restDir: v3(0, -1, -0.12).normalize(),
        stiffness: 70, damping: 0.80, gravity: 7,
        segments: [
          { len: 0.055 * H, mesh: makeFlapMesh(0.052 * H, 0.048 * H, 0.055 * H, 0.008, clothMat, JACKET, oOpts) },
          { len: 0.05 * H, mesh: makeFlapMesh(0.048 * H, 0.038 * H, 0.05 * H, 0.007, clothMat, JACKET, oOpts) }
        ]
      });
    }
  } else {
    // SHINJUKU: hanging shreds of the shirt off the ribs and the waist, each on
    // its own chain so the damage MOVES. This is what makes the wear read as
    // torn cloth rather than as a dark patch painted on him.
    for (const [bone, ox, oy, oz, w, len] of [
      ['Chest', 0.055, -0.055, 0.030, 0.030, 0.075],
      ['Chest', -0.048, -0.070, 0.036, 0.024, 0.062],
      ['Hips', 0.058, -0.030, -0.050, 0.034, 0.090],
      ['Hips', -0.054, -0.038, -0.046, 0.028, 0.078],
      ['Hips', 0.020, -0.042, 0.052, 0.022, 0.055]
    ]) {
      springs.push({
        bone, localOffset: v3(ox * H, oy * H, oz * H),
        restDir: v3(ox * 0.4, -1, oz * 0.3).normalize(),
        stiffness: 58, damping: 0.78, gravity: 9,
        segments: [
          { len: len * H, mesh: makeFlapMesh(w * H, w * 0.45 * H, len * H, 0.007, clothMat, TOP, oOpts) }
        ]
      });
    }
  }

  const model = finalizeModel(ctx, { springs, outlineThickness: 0.0125, outlineHairScale: 0 });

  // THE EYES, LIT. An additive lens over each iris, present only when the fold
  // is off. Shinjuku's burns brighter and violet-shifted, because by then the
  // Six Eyes are the only thing about him that is not damaged.
  if (!blindfold) {
    const glow = new THREE.MeshBasicMaterial({
      color: shinjuku ? 0xd8c0ff : 0x9fe0ff, transparent: true,
      opacity: shinjuku ? 0.62 : 0.42, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const head = model.getBone('Head');
    const hj = ctx.m.joints.get('Head');
    const eyeY = headC.y - headR * 0.10;
    const faceZ = headC.z + headR * 0.615;
    for (const s of [1, -1]) {
      const m1 = new THREE.Mesh(new THREE.CircleGeometry(headR * 0.15, 14), glow);
      m1.position.set(s * headR * 0.40 - hj.x, eyeY - hj.y, faceZ + headR * 0.036 - hj.z);
      head.add(m1);
    }
  }
  return model;
}
