// TODO — by far the largest silhouette in the roster: towering, extremely
// broad shoulders, thick bare arms, narrow waist. A different weight class at
// a glance. Short black hair, thick brows, the chin scar, and a SLEEVELESS
// Jujutsu Tech uniform so the build reads. Accent: hot magenta — Boogie
// Woogie's signature snap color.
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, coneSpike, sphereShell, roundBox } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const UNIFORM = 0x222739;
const UNIFORM_DK = 0x191d2c;
const TRIM = 0x6e2a38;
const HAIR = 0x181a22;
const SKIN = 0xd9a878;      // warm, darker than the rest of the roster
const ACCENT = 0xff5fc8;
const SASH = 0x2f6fd0;      // canon: a BRIGHT blue waist sash
const SASH_DK = 0x1f4b93;   // its folded/shadowed band

export function buildTodo() {
  const spec = {
    id: 'todo', name: 'Todo', H: 2.0, headScale: 0.9,
    // the proportion set IS the character: shoulders half again Gojo's,
    // heavy muscle multipliers, V-taper torso, thick legs
    shoulder: 0.132, hip: 0.058, muscle: 1.38, bulk: 1.16, legBulk: 1.18,
    skinTone: SKIN, clothColor: UNIFORM, pantColor: UNIFORM_DK, shoeColor: 0x101018,
    sleeveColor: SKIN,        // sleeveless: the arm tubes render as bare arms
    torsoShape: { chest: 1.2, waist: 0.84, hip: 0.88 },
    face: { jaw: 1.18, chin: 1.06, width: 1.08 },
    shoe: { len: 0.128, hgt: 0.06, wid: 0.052 },
    palette: { rim: 0xffc9a8, hairRim: 0x5a6488, outline: 0x0c0810, accent: ACCENT, energy: ACCENT }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- sleeveless gakuran --------------------------------------------------
  // high collar
  bag.add('cloth', latheY([
    [0.036 * H, y.neck - 0.012 * H], [0.042 * H, y.neck + 0.012 * H], [0.046 * H, y.headBase + 0.018 * H]
  ], 16, 0.86), { bone: 'Neck', color: UNIFORM });
  // torn-off sleeve rims capping the deltoids — the tell that this uniform
  // lost its sleeves rather than never having them
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s);
    bag.add('cloth', tGeo(new THREE.TorusGeometry(0.041 * H, 0.011 * H, 8, 14),
      { rot: [0, 0, s === 'L' ? -78 : 78], pos: [sh.x, sh.y + 0.004 * H, sh.z] }),
      { bone: 'UpArm' + s, color: UNIFORM });
  }
  // zip strip
  for (const [cy, cz, ch] of [[0.77 * H, 0.058 * H, 0.09 * H], [0.68 * H, 0.05 * H, 0.09 * H], [0.6 * H, 0.044 * H, 0.08 * H]]) {
    bag.add('cloth', tGeo(roundBox(0.009 * H, ch, 0.005 * H, 0.002),
      { pos: [0, cy, cz] }), { chain: torsoChain, color: TRIM, blend: 0.05 });
  }
  // THE BLUE SASH. Canon: "Todo's choice of pants is very loose and stops
  // above the ankle with a BRIGHT BLUE SASH wrapped around the waist" — and he
  // wears it in his forged memories too, which is how much it belongs to him.
  // It shipped as a 0x14161f belt, i.e. as nothing. It is now a real wrap:
  // three stacked bands so it has depth, a knot off to his right, and two
  // hanging tails (springs, further down) so it moves when he does.
  bag.add('cloth', latheY([
    [0.0715 * H, 0.492 * H], [0.0765 * H, 0.512 * H],
    [0.0775 * H, 0.538 * H], [0.0725 * H, 0.560 * H]
  ], 22, 0.8), { bone: 'Hips', color: SASH });
  bag.add('cloth', latheY([
    [0.0745 * H, 0.516 * H], [0.0755 * H, 0.534 * H]
  ], 22, 0.8), { bone: 'Hips', color: SASH_DK });
  // the knot, sitting on his right hip
  bag.add('cloth', tGeo(roundBox(0.040 * H, 0.038 * H, 0.030 * H, 0.008 * H),
    { rot: [0, 0, 14], pos: [-0.062 * H, 0.528 * H, 0.030 * H] }), { bone: 'Hips', color: SASH });
  // jacket hem
  bag.add('cloth', latheY([
    [0.078 * H, 0.425 * H], [0.076 * H, 0.468 * H], [0.072 * H, 0.508 * H]
  ], 20, 0.8), { bone: 'Hips', color: UNIFORM });
  // knuckle wraps at the wrists
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.021 * H, 0.023 * H, 0.03 * H, 10),
      { pos: [wr.x, wr.y + 0.018 * H, wr.z] }), { bone: 'LoArm' + s, color: 0x2e3345 });
  }

  // ---- face: small stern eyes, thick brows, the chin scar ------------------
  addFace(ctx, {
    eyeW: 0.42, eyeH: 0.22, eyeColor: 0x4a3226, eyeTilt: 10, lashTilt: 12,
    browTilt: 18, browUp: 1.3, browColor: 0x14151c, mouthW: 0.26, mouthTilt: -4
  });
  // heavier second brow bar — the trademark thick eyebrows
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.5, headR * 0.09, 0.004, 0.002),
      { rot: [0, 0, s * 16], pos: [s * headR * 0.4, headC.y - headR * 0.1 + headR * 0.22 * 1.32, headC.z + headR * 0.63] }),
      { bone: 'Head', color: 0x14151c });
  }
  // THE SCAR. Canon is "the large scar running down the LEFT side of Todo's
  // face" from training with Yuki — it crosses the brow and the cheek and is
  // one of the two things that identify him in a silhouette. The old version
  // was a 0.34R nick on the chin, which at fight distance was invisible and at
  // bench distance read as a smudge. It is now a long vertical seam with a
  // couple of cross-ticks, built on the LEFT of the face (screen -X).
  const scarX = -headR * 0.62;
  bag.add('flat', tGeo(roundBox(headR * 0.075, headR * 0.92, 0.004, 0.002),
    { rot: [0, 0, -7], pos: [scarX, headC.y - headR * 0.10, headC.z + headR * 0.60] }),
    { bone: 'Head', color: 0xc79a7c });
  for (const [dy, w] of [[0.26, 0.15], [-0.02, 0.17], [-0.30, 0.13]]) {
    bag.add('flat', tGeo(roundBox(headR * w, headR * 0.045, 0.004, 0.002),
      { rot: [0, 0, 74], pos: [scarX + headR * 0.005, headC.y - headR * 0.10 + headR * dy, headC.z + headR * 0.615] }),
      { bone: 'Head', color: 0xc79a7c });
  }

  // ---- hair: high-and-tight crop — the hairline sits well above the brows,
  // the mass swept up and back into a short ridge
  bag.add('hair', tGeo(sphereShell(headR * 1.05, { thetaLength: Math.PI * 0.4, scale: [1, 0.9, 1.02] }),
    { rot: [-14, 0, 0], pos: [headC.x, headC.y + headR * 0.16, headC.z - headR * 0.14] }), { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 1.05, { thetaLength: Math.PI * 0.48, scale: [1, 1.04, 1] }),
    { rot: [-62, 0, 0], pos: [headC.x, headC.y - headR * 0.08, headC.z - headR * 0.3] }), { bone: 'Head', color: HAIR });
  // swept-back ridge tufts along the crown — cropped, not styled
  for (let i = 0; i < 5; i++) {
    const a = (i / 5 - 0.5) * 1.5;
    const d = v3(Math.sin(a) * 0.45, 1, -0.15).normalize();
    const pos = headC.clone().add(v3(0, headR * 0.12, -headR * 0.06)).addScaledVector(d, headR * 0.82);
    const geo = coneSpike(headR * 0.26, headR * 0.34, new THREE.Vector3(0, -headR * 0.1, -headR * 0.26), { radial: 6, hSeg: 3 });
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    geo.translate(pos.x, pos.y, pos.z);
    geo.computeVertexNormals();
    bag.add('hair', geo, { bone: 'Head', color: HAIR });
  }
  // sideburns hugging the temples
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(headR * 0.12, headR * 0.36, headR * 0.14, 0.004),
      { pos: [s * headR * 0.9, headC.y - headR * 0.1, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });
  }

  // ================= THE TOP-KNOT ===========================================
  // Canon: "shoulder-length black hair that is almost always tied into a
  // top-knot bun with unusual flyaway strands with rounded ends akin to
  // multiple stamens of a flower, befitting the meaning of his name" (藤 —
  // wisteria). This was missing entirely: he shipped with a plain high-and-
  // tight crop, which is the one hairstyle Todo does not have, and it cost him
  // the single most recognisable thing about his silhouette.
  //
  // Three parts, and all three are needed — the bun alone reads as a bump:
  //   1 GATHER  — bands sweeping up the back of the skull into the tie, so the
  //               knot looks pulled from the hair rather than set on top of it
  //   2 KNOT    — a squashed sphere (wider than tall) plus a dark tie ring
  //   3 STAMENS — the flyaways, each a thin strand capped by a small ball
  const knotAt = v3(headC.x, headC.y + headR * 1.02, headC.z - headR * 0.20);

  // 1 — gather bands converging on the tie
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) * 0.34;
    const from = headC.clone().add(v3(Math.sin(a) * headR * 0.82, headR * 0.30, -Math.cos(a * 0.6) * headR * 0.66));
    const mid = from.clone().lerp(knotAt, 0.55);
    const dir = knotAt.clone().sub(from);
    const len = dir.length();
    const band = new THREE.CylinderGeometry(headR * 0.085, headR * 0.13, len, 6);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    band.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    band.translate(mid.x, mid.y, mid.z);
    band.computeVertexNormals();
    bag.add('hair', band, { bone: 'Head', color: i % 2 ? 0x22252f : HAIR });
  }

  // 2 — the knot itself, wider than it is tall, plus the tie
  // sized to read as a BUN. At 0.34R it was a sprout on top of his head and
  // the stamens above it turned the whole thing into an antenna; the knot has
  // to be a real mass before the flyaways read as coming out of something.
  bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.46, 12, 10),
    { scale: [1.18, 0.82, 1.12], pos: [knotAt.x, knotAt.y + headR * 0.04, knotAt.z] }),
    { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(new THREE.TorusGeometry(headR * 0.33, headR * 0.070, 6, 14),
    { rot: [90, 0, 0], pos: [knotAt.x, knotAt.y - headR * 0.16, knotAt.z] }),
    { bone: 'Head', color: 0x0d0e13 });

  // 3 — the stamens. Yaw around the knot, each leaning out and up by a
  // different amount so they splay like a flower head instead of a crown.
  const flyLen = [0.62, 0.44, 0.70, 0.38, 0.56, 0.48, 0.66, 0.40];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.35;
    const lean = 0.52 + (i % 3) * 0.16;
    const dir = v3(Math.sin(a) * lean, 1, Math.cos(a) * lean * 0.8).normalize();
    const len = headR * flyLen[i];
    const base = knotAt.clone().add(v3(0, headR * 0.20, 0));
    const strand = new THREE.CylinderGeometry(headR * 0.030, headR * 0.042, len, 5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    strand.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q));
    const mid = base.clone().addScaledVector(dir, len / 2);
    strand.translate(mid.x, mid.y, mid.z);
    strand.computeVertexNormals();
    bag.add('hair', strand, { bone: 'Head', color: HAIR });
    // the ROUNDED END — this is the detail canon calls out, so it is a real
    // ball on the tip rather than a taper
    const tip = base.clone().addScaledVector(dir, len);
    bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.062, 8, 6),
      { pos: [tip.x, tip.y, tip.z] }), { bone: 'Head', color: i % 2 ? 0x262a35 : HAIR });
  }

  // ---- springs: hem flaps + the two sash tails ----------------------------
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const oOpts = { color: spec.palette.outline, thickness: 0.008 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.055 * H, -0.10 * H, -0.055 * H),
      restDir: v3(s * 0.05, -1, -0.1).normalize(), stiffness: 80, damping: 0.82, gravity: 8,
      segments: [
        { len: 0.05 * H, mesh: makeFlapMesh(0.06 * H, 0.05 * H, 0.05 * H, 0.009, clothMat, UNIFORM, oOpts) }
      ]
    });
  }
  // SASH TAILS. Both hang from the knot on his right hip, one longer than the
  // other, and they are the only loose cloth on him — a 2 m slab of a man with
  // nothing that trails reads as a statue when he moves.
  for (const [len0, len1, spread] of [[0.085, 0.070, 0.02], [0.062, 0.048, -0.015]]) {
    springs.push({
      bone: 'Hips',
      localOffset: v3(-0.062 * H + spread * H, -0.005 * H, 0.020 * H),
      restDir: v3(-0.18, -1, 0.16).normalize(), stiffness: 52, damping: 0.78, gravity: 9,
      segments: [
        { len: len0 * H, mesh: makeFlapMesh(0.038 * H, 0.034 * H, len0 * H, 0.008, clothMat, SASH, oOpts) },
        { len: len1 * H, mesh: makeFlapMesh(0.034 * H, 0.026 * H, len1 * H, 0.007, clothMat, SASH_DK, oOpts) }
      ]
    });
  }

  return finalizeModel(ctx, { springs, outlineThickness: 0.013, outlineHairScale: 0 });
}
