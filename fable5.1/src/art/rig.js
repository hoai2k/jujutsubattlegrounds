// Shared skeleton + skin binding. Every character uses the same bone names, so
// clips retarget across the roster. Extra bones (a second arm pair, a tail)
// append after the shared list so indices never move.
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

export const BONE_NAMES = [
  'Root', 'Hips', 'Spine', 'Chest', 'Neck', 'Head',
  'ClavL', 'UpArmL', 'LoArmL', 'HandL',
  'ClavR', 'UpArmR', 'LoArmR', 'HandR',
  'ThighL', 'ShinL', 'FootL',
  'ThighR', 'ShinR', 'FootR'
];
const PARENT_OF = {
  Hips: 'Root', Spine: 'Hips', Chest: 'Spine', Neck: 'Chest', Head: 'Neck',
  ClavL: 'Chest', UpArmL: 'ClavL', LoArmL: 'UpArmL', HandL: 'LoArmL',
  ClavR: 'Chest', UpArmR: 'ClavR', LoArmR: 'UpArmR', HandR: 'LoArmR',
  ThighL: 'Hips', ShinL: 'ThighL', FootL: 'ShinL',
  ThighR: 'Hips', ShinR: 'ThighR', FootR: 'ShinR'
};

export function createRig(joints, extra = null) {
  const bones = new Map(), boneList = [];
  const names = extra?.length ? [...BONE_NAMES, ...extra.map(e => e.name)] : BONE_NAMES;
  const parentOf = extra?.length ? { ...PARENT_OF, ...Object.fromEntries(extra.map(e => [e.name, e.parent])) } : PARENT_OF;
  for (const name of names) { const b = new THREE.Bone(); b.name = name; bones.set(name, b); boneList.push(b); }
  for (const name of names) {
    if (name === 'Root') continue;
    const parent = bones.get(parentOf[name]);
    parent.add(bones.get(name));
    const wp = joints.get(name);
    const pwp = parentOf[name] === 'Root' ? new THREE.Vector3() : joints.get(parentOf[name]);
    bones.get(name).position.copy(wp).sub(pwp);
  }
  const boneIndex = new Map(boneList.map((b, i) => [b.name, i]));
  return { bones, boneList, boneIndex, root: bones.get('Root') };
}

const _c = new THREE.Color();

// Collects geometry into material slots with skin weights + vertex colours,
// then merges each slot into one SkinnedMesh bound to the shared skeleton.
export class PartBag {
  constructor(boneIndex) { this.boneIndex = boneIndex; this.slots = new Map(); this.props = []; }

  // opts: { bone } rigid, or { chain:[{bone, point}], blend }; color hex|Color|fn(x,y,z)
  add(slot, geo, opts = {}) {
    geo = geo.index ? geo.toNonIndexed() : geo;
    for (const k of ['uv', 'uv1', 'uv2']) if (geo.getAttribute(k)) geo.deleteAttribute(k);
    const pos = geo.getAttribute('position');
    const n = pos.count;
    const colors = new Float32Array(n * 3);
    const cfn = typeof opts.color === 'function' ? opts.color : null;
    if (!cfn) _c.set(opts.color !== undefined ? opts.color : 0xffffff);
    for (let i = 0; i < n; i++) {
      const c = cfn ? cfn(pos.getX(i), pos.getY(i), pos.getZ(i)) : _c;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    if (opts.chain && opts.chain.length > 1) this._bindChain(pos, si, sw, opts.chain, opts.blend ?? 0.045);
    else { const bi = this.boneIndex.get(opts.bone || 'Root'); for (let i = 0; i < n; i++) { si[i * 4] = bi; sw[i * 4] = 1; } }
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    if (!this.slots.has(slot)) this.slots.set(slot, []);
    this.slots.get(slot).push(geo);
    return geo;
  }

  _bindChain(pos, si, sw, chain, blend) {
    const pts = chain.map(c => c.point), idx = chain.map(c => this.boneIndex.get(c.bone));
    const segs = []; let total = 0;
    for (let s = 0; s < pts.length - 1; s++) { const d = pts[s + 1].clone().sub(pts[s]); segs.push({ a: pts[s], d, len: d.length(), start: total }); total += d.length(); }
    const joints = [0]; for (const s of segs) joints.push(s.start + s.len);
    const bw = Math.max(1e-5, blend * total);
    const v = new THREE.Vector3(), p = new THREE.Vector3(), tmp = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      let best = 0, bestDist = Infinity;
      for (const s of segs) {
        const t = Math.max(0, Math.min(1, tmp.copy(v).sub(s.a).dot(s.d) / (s.len * s.len)));
        p.copy(s.a).addScaledVector(s.d, t);
        const dist = v.distanceToSquared(p);
        if (dist < bestDist) { bestDist = dist; best = s.start + t * s.len; }
      }
      let k = 0; while (k < segs.length - 1 && best > joints[k + 1]) k++;
      let bA = idx[k], bB = bA, wB = 0;
      for (let j = 1; j < segs.length; j++) {
        if (Math.abs(best - joints[j]) <= bw) {
          const t = (best - (joints[j] - bw)) / (2 * bw);
          const sm = t * t * (3 - 2 * t);
          bA = idx[j - 1]; bB = idx[j]; wB = sm; break;
        }
      }
      si[i * 4] = bA; sw[i * 4] = 1 - wB; si[i * 4 + 1] = bB; sw[i * 4 + 1] = wB;
    }
  }

  addProp(mesh, boneName, opts = {}) { this.props.push({ mesh, bone: boneName, outline: opts.outline !== false }); }

  buildMeshes(materialFor, skeleton, rootGroup, bones) {
    const meshes = {};
    for (const [slot, geos] of this.slots) {
      const merged = BufferGeometryUtils.mergeGeometries(geos, false);
      if (!merged) { console.warn('[PartBag] slot "' + slot + '" failed to merge'); continue; }
      const mesh = new THREE.SkinnedMesh(merged, materialFor(slot));
      mesh.name = 'body_' + slot; mesh.frustumCulled = false;
      mesh.castShadow = slot !== 'flat'; mesh.receiveShadow = slot !== 'flat';
      rootGroup.add(mesh);
      mesh.bind(skeleton, new THREE.Matrix4());
      meshes[slot] = mesh;
    }
    for (const p of this.props) bones.get(p.bone).add(p.mesh);
    return meshes;
  }
}
