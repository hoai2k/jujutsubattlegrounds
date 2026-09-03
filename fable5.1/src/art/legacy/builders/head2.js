// SCULPTED HEAD + FACE, second generation. `animeHead` in geo.js is a sphere
// with the face pressed flat and the jaw pinched; everything on the face is
// then a flat quad floating a centimetre in front of it. Held next to the
// canon idle sheets and the imported ?render3d Yuji, that reads as a mask on
// a ball: no brow, no cheekbone, no nose in the silhouette, eyes that sit ON
// the face instead of IN it.
//
// This builder is a sphere too, but every vertex is pushed by a small set of
// named anatomical features — brow ridge, eye sockets, cheekbones, nose bridge
// and tip, chin — on top of the same affine jaw taper, and the SAME function
// answers "where is the skin in direction d", so the eyes, brows and ears are
// placed on the surface rather than at a hard-coded plane. Opt in per
// character with `spec.head: 'sculpt'`; nothing on the roster changes
// otherwise.
import * as THREE from 'three';
import { roundBox, tGeo, almondEye } from './geo.js';
import { DEG } from '../../../core/math.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const g = (v, c, w) => Math.exp(-((v - c) * (v - c)) / (2 * w * w));   // gaussian
const sm = v => { v = clamp01(v); return v * v * (3 - 2 * v); };

// Unit direction n -> point on the head surface, in head radii. `o` is the
// character's face spec: jaw / chin / width as before, plus feature strengths.
export function headShape(n, o = {}) {
  const jaw = o.jaw ?? 1, chin = o.chin ?? 1, width = o.width ?? 1;
  const brow = o.brow ?? 1, cheek = o.cheek ?? 1, nose = o.nose ?? 1, socket = o.socket ?? 1;
  let x = n.x, y = n.y, z = n.z;
  // cranium: the back of the skull is longer than a sphere, and the crown a
  // shade flatter
  if (z < 0) z *= 1 + 0.12 * (-z) * sm((y + 0.35) / 0.7);
  if (y > 0.72) y = 0.72 + (y - 0.72) * 0.90;
  // face plane. Flattened to the SAME depth as the classic head (front at
  // ~0.61 r): every character file places something at that plane — a scar,
  // a mask, a blindfold, a second pair of eyes — and those have to stay
  // proud of the skin. The anatomy below is pushed out from it.
  if (z > 0.44) z = 0.44 + (z - 0.44) * 0.30;
  // jaw taper below the eye line, chin drawn down and forward
  if (y < -0.05) {
    const u = clamp01((-y - 0.05) / 0.95), k = Math.pow(u, 1.45);
    x *= 1 - 0.50 * k * jaw;
    if (z > 0) { z *= 1 - 0.20 * k; y -= 0.17 * k * chin * Math.max(0, z / 0.6); }
    else z *= 1 - 0.40 * k;
  }
  x *= width;
  // features: pushed along the sphere normal, so they survive the taper
  const front = sm(n.z / 0.55);
  let b = 0;
  b += 0.030 * brow * g(n.y, 0.16, 0.09) * front * sm(1 - Math.abs(n.x) / 0.85);        // brow ridge
  b -= 0.032 * socket * (g(n.x, 0.40, 0.17) + g(n.x, -0.40, 0.17)) * g(n.y, -0.05, 0.11) * front; // eye sockets
  b += 0.040 * cheek * (g(n.x, 0.74, 0.20) + g(n.x, -0.74, 0.20)) * g(n.y, -0.30, 0.16) * sm(n.z / 0.35) * (1 - front * 0.4); // cheekbones
  b += 0.035 * nose * g(n.x, 0, 0.09) * g(n.y, -0.14, 0.14) * front;                       // bridge
  b += 0.095 * nose * g(n.x, 0, 0.11) * g(n.y, -0.34, 0.11) * sm((n.z - 0.6) / 0.35);       // tip
  b += 0.025 * chin * g(n.x, 0, 0.28) * g(n.y, -0.86, 0.14) * front;                       // chin
  b -= 0.020 * g(n.x, 0, 0.16) * g(n.y, -0.62, 0.07) * front;                              // under the lip
  return new THREE.Vector3(x + n.x * b, y + n.y * b, z + n.z * b);
}

export function sculptHead(r, o = {}) {
  const geo = new THREE.SphereGeometry(r, 48, 36);
  const pos = geo.getAttribute('position');
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.set(pos.getX(i), pos.getY(i), pos.getZ(i)).divideScalar(r);
    const p = headShape(n, o);
    pos.setXYZ(i, p.x * r, p.y * r, p.z * r);
  }
  geo.computeVertexNormals();
  return geo;
}

// World point on the skin in direction `dir` from the head centre, plus
// `out` head-radii along that direction.
export function skinPoint(ctx, dir, out = 0) {
  const { headR, headC } = ctx.m;
  const n = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  const p = headShape(n, ctx.spec.face || {}).multiplyScalar(headR);
  return p.addScaledVector(n, out * headR).add(headC);
}

// Tapered eyebrow slab: heavy at the inner end, drawn to a point outward.
function browShape(w, h, sideSign) {
  const s = new THREE.Shape();
  const pts = [[-0.50, 0.05], [-0.30, 0.55], [0.10, 0.62], [0.52, 0.30], [0.52, 0.10], [0.05, -0.12], [-0.42, -0.30]];
  pts.forEach(([px, py], i) => { const X = px * w * sideSign, Y = py * h; i ? s.lineTo(X, Y) : s.moveTo(X, Y); });
  s.closePath();
  return new THREE.ShapeGeometry(s, 6);
}

// Upper lid: a crescent thickening toward the outer corner, the anime lash line.
function lidShape(w, h, sideSign) {
  const s = new THREE.Shape();
  const S = sideSign;
  s.moveTo(-w * 0.52 * S, h * 0.02);
  s.quadraticCurveTo(-w * 0.18 * S, h * 0.98, w * 0.56 * S, h * 0.30);
  s.lineTo(w * 0.50 * S, h * 0.12);
  s.quadraticCurveTo(-w * 0.20 * S, h * 0.66, -w * 0.50 * S, -h * 0.06);
  s.closePath();
  return new THREE.ShapeGeometry(s, 8);
}

// The face on a sculpted head. Everything sits on the skin via skinPoint.
export function addFace2(ctx, o = {}) {
  const { bag } = ctx;
  const { headR } = ctx.m;
  const skin = ctx.spec.skinTone;
  const eyeW = headR * (o.eyeW ?? 0.50), eyeH = headR * (o.eyeH ?? 0.26);
  const white = o.scleraColor ?? 0xf3f5f9;
  const ink = o.lashColor ?? 0x14121a;
  const iris = o.eyeColor ?? 0x6a4630;
  const eyeDir = [0.40, -0.06, 0.92];
  for (const s of o.noEyes ? [] : [1, -1]) {
    // the eye's own frame: facing out of the socket, which wraps ~14° round
    // the head, and tilted by the character's eye angle
    const rotY = s * (o.eyeWrap ?? 14), rotZ = s * (o.eyeTilt ?? 4);
    const at = (out, dx = 0, dy = 0) => {
      const p = skinPoint(ctx, [s * eyeDir[0], eyeDir[1], eyeDir[2]], out);
      return [p.x + dx, p.y + dy, p.z];
    };
    const place = (geo, out, dx = 0, dy = 0) => tGeo(geo, { rot: [0, rotY, rotZ], pos: at(out, dx, dy) });
    // sclera, set into the socket
    bag.add('flat', place(almondEye(eyeW, eyeH, 0), 0.012, 0, -eyeH * 0.08), { bone: 'Head', color: white });
    // iris: dark limbal ring, the iris, pupil, one highlight
    const ir = eyeH * 0.44;
    bag.add('flat', place(tGeo(new THREE.CircleGeometry(ir * 1.12, 16), { scale: [0.82, 1.12, 1] }), 0.016, -s * eyeW * 0.04, eyeH * 0.02), { bone: 'Head', color: o.limbalColor ?? 0x2a1a14 });
    bag.add('flat', place(tGeo(new THREE.CircleGeometry(ir, 16), { scale: [0.82, 1.12, 1] }), 0.020, -s * eyeW * 0.04, eyeH * 0.02), { bone: 'Head', color: iris });
    bag.add('flat', place(tGeo(new THREE.CircleGeometry(ir * 0.42, 10), { scale: [0.85, 1.15, 1] }), 0.024, -s * eyeW * 0.04, eyeH * 0.0), { bone: 'Head', color: 0x120c0c });
    bag.add('flat', place(new THREE.CircleGeometry(ir * 0.26, 8), 0.028, -s * eyeW * 0.10, eyeH * 0.16), { bone: 'Head', color: 0xffffff });
    // upper lid / lash line, thick toward the outer corner
    bag.add('flat', place(lidShape(eyeW, eyeH * 0.55, s), 0.030, 0, eyeH * 0.30), { bone: 'Head', color: ink });
    // lower lid crease, outer half only
    bag.add('flat', place(tGeo(roundBox(eyeW * 0.46, eyeH * 0.07, 0.003, 0.001), { rot: [0, 0, s * -6] }), 0.026, s * eyeW * 0.14, -eyeH * 0.50), { bone: 'Head', color: o.lowerLidColor ?? 0x6b4a44 });
    // brow, riding the brow ridge
    const bp = skinPoint(ctx, [s * 0.40, 0.14, 0.92], 0.024);
    bag.add('flat', tGeo(browShape(eyeW * (o.browW ?? 1.0), eyeH * (o.browH ?? 0.55), s),
      { rot: [0, rotY, s * (o.browTilt ?? 12)], pos: [bp.x + s * eyeW * 0.04, bp.y + eyeH * (o.browUp ?? 0.0), bp.z] }),
      { bone: 'Head', color: o.browColor ?? ink });
  }
  // mouth: a short line with the corners drawn down a touch, and the shadow
  // under the lower lip
  const mp = skinPoint(ctx, [0, -0.60, 0.95], 0.014);
  bag.add('flat', tGeo(roundBox(headR * (o.mouthW ?? 0.22), headR * 0.035, 0.003, 0.001), { rot: [0, 0, o.mouthTilt ?? 0], pos: [mp.x, mp.y, mp.z] }),
    { bone: 'Head', color: o.mouthColor ?? 0x4a2a30 });
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.035, headR * 0.028, 0.003, 0.001), { rot: [0, 0, s * (o.mouthCorner ?? -14)], pos: [mp.x + s * headR * (o.mouthW ?? 0.22) * 0.50, mp.y - headR * 0.006, mp.z] }),
      { bone: 'Head', color: o.mouthColor ?? 0x4a2a30 });
  }
  // nostril shadows, the one nose line anime keeps
  for (const s of [1, -1]) {
    const np = skinPoint(ctx, [s * 0.10, -0.40, 0.92], 0.010);
    bag.add('flat', tGeo(roundBox(headR * 0.022, headR * 0.014, 0.003, 0.001), { rot: [0, 0, s * 30], pos: [np.x, np.y, np.z] }),
      { bone: 'Head', color: o.noseShadow ?? 0xb98f78 });
  }
  // ears: a shell with a darker hollow, on the skin at the ear line
  if (ctx.spec.ears !== false) {
    for (const s of [1, -1]) {
      const ep = skinPoint(ctx, [s * 0.98, -0.12, -0.10], 0.02);
      bag.add('skin', tGeo(new THREE.SphereGeometry(headR * 0.18, 10, 8), { scale: [0.36, 1, 0.72], rot: [0, s * 12, 0], pos: [ep.x, ep.y, ep.z] }), { bone: 'Head', color: skin });
      bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.075, 10), { scale: [1, 1.4, 1], rot: [0, s * 90, 0], pos: [ep.x + s * headR * 0.05, ep.y, ep.z - headR * 0.01] }), { bone: 'Head', color: o.earHollow ?? 0xc9987c });
    }
  }
}
