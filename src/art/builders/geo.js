// Geometry construction toolkit: lathes, oriented tapered tubes, hair-card
// ribbons, bent spikes, extruded shapes. Everything returns BufferGeometry
// with smooth vertex normals — no untouched primitive stacks.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { DEG } from '../../core/mathutil.js';

const _m = new THREE.Matrix4();
const _e = new THREE.Euler();

export function tGeo(geo, { pos, rot, scale } = {}) {
  if (scale) {
    const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
    geo.applyMatrix4(_m.makeScale(s[0], s[1], s[2]));
  }
  if (rot) {
    _e.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG);
    geo.applyMatrix4(_m.makeRotationFromEuler(_e));
  }
  if (pos) geo.applyMatrix4(_m.makeTranslation(pos[0], pos[1], pos[2]));
  geo.computeVertexNormals();
  return geo;
}

export function mergeGeos(list) {
  // Strip UVs first: the toolkit mixes primitive geometry (position/normal/uv)
  // with generated geometry (position/normal only), and mergeGeometries refuses
  // a set whose attributes disagree — silently returning null.
  const flat = list.map(g => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const k of ['uv', 'uv1', 'uv2']) if (n.getAttribute(k)) n.deleteAttribute(k);
    if (!n.getAttribute('normal')) n.computeVertexNormals();
    return n;
  });
  const merged = BufferGeometryUtils.mergeGeometries(flat, false);
  if (!merged) {
    console.warn('[mergeGeos] failed —', flat.map((g, i) => i + ':' + Object.keys(g.attributes).sort().join('/')).join('  '));
  }
  return merged;
}

// Profile lathe around Y. profile: [[radius, y], ...] bottom -> top.
// zScale flattens the cross-section front/back for anime bodies.
export function latheY(profile, seg = 22, zScale = 1) {
  const pts = profile.map(p => new THREE.Vector2(Math.max(0.0004, p[0]), p[1]));
  const geo = new THREE.LatheGeometry(pts, seg);
  if (zScale !== 1) geo.applyMatrix4(_m.makeScale(1, 1, zScale));
  geo.computeVertexNormals();
  return geo;
}

// Tapered elliptical tube from point a to point b. radii: [rTop, rBottom] or fn(t).
export function tubeBetween(a, b, radii, opts = {}) {
  // `bulge` swells the tube by that fraction at its widest, and `bulgeAt` says
  // where along the tube (0 = a, 1 = b) the swell peaks. The default 0.5 is the
  // old symmetric sine exactly; a bicep peaks above the middle of the upper
  // arm, a calf sits high on the shin, and a forearm is thickest just below
  // the elbow — none of them are symmetric.
  const { radial = 12, hSeg = 5, zScale = 1, capA = true, capB = true, bulge = 0, bulgeAt = 0.5 } = opts;
  const pk = Math.min(0.95, Math.max(0.05, bulgeAt));
  const hump = t => t <= pk ? Math.sin(Math.PI * 0.5 * t / pk) : Math.sin(Math.PI * 0.5 * (1 - t) / (1 - pk));
  const dir = b.clone().sub(a);
  const len = dir.length();
  dir.normalize();
  let ref = Math.abs(dir.x) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
  const u = ref.clone().sub(dir.clone().multiplyScalar(ref.dot(dir))).normalize();
  const w = dir.clone().cross(u).normalize();
  const rf = typeof radii === 'function' ? radii
    : t => (radii[0] + (radii[1] - radii[0]) * t) * (1 + bulge * hump(t));

  const posArr = [], idxArr = [];
  for (let i = 0; i <= hSeg; i++) {
    const t = i / hSeg;
    const c = a.clone().addScaledVector(dir, len * t).addScaledVector(dir, 0);
    const r = rf(t);
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const p = c.clone()
        .addScaledVector(u, Math.cos(th) * r)
        .addScaledVector(w, Math.sin(th) * r * zScale);
      posArr.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < hSeg; i++) {
    for (let j = 0; j < radial; j++) {
      const a0 = i * radial + j, a1 = i * radial + (j + 1) % radial;
      const b0 = (i + 1) * radial + j, b1 = (i + 1) * radial + (j + 1) % radial;
      idxArr.push(a0, a1, b0, a1, b1, b0);
    }
  }
  const base = posArr.length / 3;
  if (capA) { posArr.push(a.x, a.y, a.z); for (let j = 0; j < radial; j++) idxArr.push(base, (j + 1) % radial, j); }
  if (capB) {
    const bi = posArr.length / 3;
    posArr.push(b.x, b.y, b.z);
    const top = hSeg * radial;
    for (let j = 0; j < radial; j++) idxArr.push(bi, top + j, top + (j + 1) % radial);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  geo.setIndex(idxArr);
  geo.computeVertexNormals();
  return geo;
}

export function roundBox(w, h, d, r = 0.02, seg = 2) {
  return new RoundedBoxGeometry(w, h, d, seg, r);
}

// Hair card / cloth strip: a thin double-sided shell following a curve.
// points: Vector3[] centerline. widthFn(t)->w, normalHint: outward direction.
export function ribbonShell(points, widthFn, thick = 0.008, opts = {}) {
  const { seg = 10, normalHint = new THREE.Vector3(0, 0, 1), taperThick = true } = opts;
  const curve = new THREE.CatmullRomCurve3(points);
  const pos = [], idx = [];
  const frames = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const c = curve.getPoint(t);
    const tan = curve.getTangent(t).normalize();
    const side = tan.clone().cross(normalHint).normalize();
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    const face = side.clone().cross(tan).normalize();
    frames.push({ c, side, face, w: widthFn(t), th: (taperThick ? (1 - t * 0.7) : 1) * thick });
  }
  // 4 vertices per ring: frontL, frontR, backR, backL (a flattened box section)
  for (const f of frames) {
    const hw = f.w / 2, ht = f.th / 2;
    const corners = [
      f.c.clone().addScaledVector(f.side, -hw).addScaledVector(f.face, ht),
      f.c.clone().addScaledVector(f.side, hw).addScaledVector(f.face, ht),
      f.c.clone().addScaledVector(f.side, hw).addScaledVector(f.face, -ht),
      f.c.clone().addScaledVector(f.side, -hw).addScaledVector(f.face, -ht)
    ];
    for (const p of corners) pos.push(p.x, p.y, p.z);
  }
  for (let i = 0; i < seg; i++) {
    const r0 = i * 4, r1 = (i + 1) * 4;
    for (let f = 0; f < 4; f++) {
      const a0 = r0 + f, a1 = r0 + (f + 1) % 4, b0 = r1 + f, b1 = r1 + (f + 1) % 4;
      idx.push(a0, a1, b0, a1, b1, b0);
    }
  }
  // seal ends
  idx.push(0, 2, 1, 0, 3, 2);
  const l = seg * 4;
  idx.push(l, l + 1, l + 2, l, l + 2, l + 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Bent cone for hair spikes. Base at origin pointing +Y, tip bent by bendVec.
export function coneSpike(rBase, h, bendVec = new THREE.Vector3(), opts = {}) {
  const { radial = 7, hSeg = 5, zScale = 1 } = opts;
  const pos = [], idx = [];
  for (let i = 0; i <= hSeg; i++) {
    const t = i / hSeg;
    const r = rBase * Math.pow(1 - t, 1.15);
    const bend = Math.pow(t, 1.7);
    const cx = bendVec.x * bend, cy = h * t + bendVec.y * bend, cz = bendVec.z * bend;
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      pos.push(cx + Math.cos(th) * r, cy, cz + Math.sin(th) * r * zScale);
    }
  }
  for (let i = 0; i < hSeg; i++) {
    for (let j = 0; j < radial; j++) {
      const a0 = i * radial + j, a1 = i * radial + (j + 1) % radial;
      const b0 = (i + 1) * radial + j, b1 = (i + 1) * radial + (j + 1) % radial;
      idx.push(a0, a1, b0, a1, b1, b0);
    }
  }
  // base cap
  const base = pos.length / 3;
  pos.push(0, 0, 0);
  for (let j = 0; j < radial; j++) idx.push(base, j, (j + 1) % radial);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// 2D outline -> extruded slab (lapels, tsuba, blade profiles).
export function shapeExtrude(pts2, depth, opts = {}) {
  const shape = new THREE.Shape();
  shape.moveTo(pts2[0][0], pts2[0][1]);
  for (let i = 1; i < pts2.length; i++) shape.lineTo(pts2[i][0], pts2[i][1]);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: opts.bevel ?? false,
    bevelThickness: opts.bevelThickness ?? 0.004,
    bevelSize: opts.bevelSize ?? 0.004, bevelSegments: 1, steps: 1
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

// Partial sphere shell (hair caps, hoods): lat/long clamped sphere, offset thickness.
export function sphereShell(r, opts = {}) {
  const { phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI * 0.55,
    seg = 18, rings = 10, scale = [1, 1, 1] } = opts;
  const geo = new THREE.SphereGeometry(r, seg, rings, phiStart, phiLength, thetaStart, thetaLength);
  geo.applyMatrix4(_m.makeScale(scale[0], scale[1], scale[2]));
  geo.computeVertexNormals();
  return geo;
}

// Stylized anime head: modified sphere — tapered jaw, chin point, flattened
// face plane, slightly elongated back skull. r = head radius, center at origin.
export function animeHead(r, opts = {}) {
  const { jaw = 1.0, chin = 1.0, width = 1.0, faceFlat = 0.42 } = opts;
  const geo = new THREE.SphereGeometry(r, 26, 20);
  const pos = geo.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    v.x *= width;
    // jaw taper below the eye line
    if (v.y < -0.08 * r) {
      const u = Math.min(1, (-v.y / r - 0.08) / 0.92);
      const k = Math.pow(u, 1.5);
      v.x *= 1 - 0.52 * k * jaw;
      if (v.z > 0) {
        // pull the front lower face down + forward into a chin wedge
        v.z *= 1 - 0.18 * k;
        v.y -= 0.20 * r * k * chin * Math.max(0, v.z / r);
      } else {
        v.z *= 1 - 0.34 * k; // tuck the back of the jaw
      }
    }
    // flatten the face plane
    const fz = faceFlat * r;
    if (v.z > fz) v.z = fz + (v.z - fz) * 0.30;
    // elongate back skull slightly
    if (v.z < -0.25 * r) v.z *= 1.07;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// Almond eye shape (flat), pointing +Z. w,h in world units.
export function almondEye(w, h, tilt = 0) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.quadraticCurveTo(-w * 0.22, h * 0.62, w / 2, h * 0.12);
  s.quadraticCurveTo(w * 0.1, -h * 0.5, -w / 2, 0);
  const geo = new THREE.ShapeGeometry(s, 8);
  geo.rotateZ(tilt * DEG);
  return geo;
}
