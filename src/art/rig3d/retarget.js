// Pose retargeting: drives an arbitrary rigged humanoid from the game's
// procedural rig, live, every frame — so every clip the game has (and every
// clip it ever grows) plays on an imported model without re-authoring.
//
// HOW IT WORKS. The procedural CharacterModel keeps doing exactly what it does
// today: AnimPlayer writes the clips onto its shared skeleton. That skeleton
// becomes a DRIVE RIG — its meshes are hidden, its bones stay authoritative
// (springs, prop attachments and every combat query still read them). After
// each update, the retargeter transfers the pose onto the imported skeleton:
//
//   1. The drive rig's bones are authored with IDENTITY rest rotations
//      (rig.js creates them world-aligned), so a bone's accumulated local
//      quaternion chain IS its world-space rotation away from bind. No
//      matrix-world round trip, no dependency on render order.
//   2. For each mapped target bone: desiredWorld = srcWorld ∘ A, where A is a
//      constant computed once from the two BIND poses — A = offset ∘ R ∘
//      dstRestWorld, and R is the shortest-arc rotation taking the target
//      bone's rest direction (toward its canonical child) onto the source
//      bone's rest direction. R is what absorbs the bind-pose difference: a
//      T-pose model and the game's arms-down A-pose meet in the middle
//      without either side knowing about the other.
//   3. Bones with no canonical child to aim at (hands, feet, head) INHERIT
//      the nearest mapped ancestor's R, so they ride their parent's
//      alignment and keep their natural rest attitude relative to it —
//      which is what makes a wrist or an ankle look owned rather than reset.
//   4. Locals are recovered top-down through the target's real hierarchy, so
//      unmapped in-between bones (extra spine links, twist bones, fingers)
//      keep their rest pose and everything below them still lands where the
//      clip put it.
//   5. The Hips positional track (crouch, knockdown, jump squash) transfers
//      as a world-space offset scaled by the two rigs' hip heights.
//
// Everything here is allocation-free per frame.
import * as THREE from 'three';
import { DEG } from '../../core/mathutil.js';

// canonical child each bone aims at when computing its rest direction
const REF_CHILD = {
  Hips: 'Spine', Spine: 'Chest', Chest: 'Neck', Neck: 'Head',
  ClavL: 'UpArmL', UpArmL: 'LoArmL', LoArmL: 'HandL',
  ClavR: 'UpArmR', UpArmR: 'LoArmR', LoArmR: 'HandR',
  ThighL: 'ShinL', ShinL: 'FootL',
  ThighR: 'ShinR', ShinR: 'FootR'
};
// canonical parent, for inheriting R when there is nothing to aim at
const REF_PARENT = {
  Spine: 'Hips', Chest: 'Spine', Neck: 'Chest', Head: 'Neck',
  ClavL: 'Chest', UpArmL: 'ClavL', LoArmL: 'UpArmL', HandL: 'LoArmL',
  ClavR: 'Chest', UpArmR: 'ClavR', LoArmR: 'UpArmR', HandR: 'LoArmR',
  ThighL: 'Hips', ShinL: 'ThighL', FootL: 'ShinL',
  ThighR: 'Hips', ShinR: 'ThighR', FootR: 'ShinR'
};

// Rest capture must happen while the drive rig is still in bind pose — i.e.
// synchronously at model build, before any AnimPlayer touches it. Rotations
// are identity at bind, so rest world position is just the local-offset sum.
export function captureSourceRest(model) {
  const rest = new Map(); // name -> { worldPos }
  for (const bone of model.boneList) {
    const parent = rest.get(bone.parent?.name);
    const wp = parent ? parent.worldPos.clone().add(bone.position) : bone.position.clone();
    rest.set(bone.name, { worldPos: wp, localPos: bone.position.clone() });
  }
  return rest;
}

const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _e = new THREE.Euler();

export class Retargeter {
  // model:   the procedural CharacterModel (drive rig)
  // srcRest: captureSourceRest(model), taken at build time
  // wrapper: the normalized (scaled/oriented) parent of the imported model,
  //          sharing model.group with the drive rig
  // map:     canonical name -> target Object3D (from guessBoneMap)
  // opts:    { rotOffset: {Bone:[rx,ry,rz] degrees, applied in world space} }
  constructor(model, srcRest, wrapper, map, opts = {}) {
    this.srcBones = model.boneList;
    this.srcParent = this.srcBones.map(b => {
      const i = this.srcBones.indexOf(b.parent);
      return i;
    });
    this.srcWorldQ = this.srcBones.map(() => new THREE.Quaternion());
    this.srcIndex = new Map(this.srcBones.map((b, i) => [b.name, i]));

    // ---- target rest, in group space -------------------------------------
    // Walk the wrapper subtree once, composing local matrices by hand — the
    // model may not be in a scene yet, so matrixWorld cannot be trusted.
    wrapper.updateMatrix();
    const nodes = [];               // DFS order, parents first
    const info = new Map();         // node -> {parent, restWorldQ, restWorldMat}
    const visit = (node, parent) => {
      node.updateMatrix();
      const p = info.get(parent);
      const restWorldMat = p ? p.restWorldMat.clone().multiply(node.matrix)
        : node.matrix.clone();
      const restWorldQ = new THREE.Quaternion();
      restWorldMat.decompose(_v, restWorldQ, new THREE.Vector3());
      info.set(node, { parent, restWorldQ, restWorldMat });
      nodes.push(node);
      for (const c of node.children) visit(c, node);
    };
    visit(wrapper, null);
    const restWorldPos = node =>
      new THREE.Vector3().setFromMatrixPosition(info.get(node).restWorldMat);

    // ---- per-bone alignment ----------------------------------------------
    // R first (it inherits down the canonical tree), then A = off ∘ R ∘ rest.
    const R = new Map();
    const orderedNames = Object.keys(REF_CHILD)
      .concat(Object.keys(REF_PARENT).filter(k => !(k in REF_CHILD)));
    // resolve in canonical topological order so parents exist before children
    const resolveR = name => {
      if (R.has(name)) return R.get(name);
      let r = new THREE.Quaternion();
      const child = REF_CHILD[name];
      const node = map[name];
      if (node && child && map[child] && srcRest.get(name) && srcRest.get(child)) {
        const dstDir = restWorldPos(map[child]).sub(restWorldPos(node));
        const srcDir = srcRest.get(child).worldPos.clone().sub(srcRest.get(name).worldPos);
        if (dstDir.lengthSq() > 1e-10 && srcDir.lengthSq() > 1e-10) {
          r = new THREE.Quaternion().setFromUnitVectors(dstDir.normalize(), srcDir.normalize());
        }
      } else if (REF_PARENT[name]) {
        r = resolveR(REF_PARENT[name]).clone();
      }
      R.set(name, r);
      return r;
    };
    for (const n of ['Hips', ...orderedNames]) resolveR(n);

    this.targets = new Map();       // canonical -> {node, align}
    for (const [name, node] of Object.entries(map)) {
      if (!this.srcIndex.has(name) || !info.has(node)) continue;
      const align = new THREE.Quaternion();
      if (opts.rotOffset?.[name]) {
        const o = opts.rotOffset[name];
        _e.set(o[0] * DEG, o[1] * DEG, o[2] * DEG, 'XYZ');
        align.setFromEuler(_e);
      }
      align.multiply(R.get(name) ?? _q.identity()).multiply(info.get(node).restWorldQ);
      this.targets.set(name, { node, align });
    }

    // ---- traversal plan ---------------------------------------------------
    // Every node between the wrapper and the deepest mapped bone, DFS order,
    // with a per-node slot for its current world rotation.
    this.plan = nodes.map(node => ({
      node,
      parent: info.get(node).parent,
      canonical: [...this.targets].find(([, t]) => t.node === node)?.[0] ?? null,
      curQ: new THREE.Quaternion()
    }));
    this.curOf = new Map(this.plan.map(p => [p.node, p.curQ]));

    // ---- hips translation -------------------------------------------------
    this.srcHips = model.bones.get('Hips');
    this.srcHipsRest = srcRest.get('Hips');
    const dstHips = map.Hips;
    this.dstHips = dstHips && info.has(dstHips) ? {
      node: dstHips,
      restLocalPos: dstHips.position.clone(),
      // rest inverse of the hips' parent world basis: nothing above the hips
      // is ever animated by the game, so the rest matrix stays exact. The
      // Matrix3 keeps rotation AND the wrapper's inverse scale, so the world
      // offset comes out in the armature's own units.
      invParent: new THREE.Matrix3().setFromMatrix4(
        info.get(dstHips).parent
          ? info.get(info.get(dstHips).parent).restWorldMat.clone().invert()
          : new THREE.Matrix4()),
      ratio: this.srcHipsRest.worldPos.y > 1e-4
        ? restWorldPos(dstHips).y / this.srcHipsRest.worldPos.y : 1
    } : null;
  }

  apply() {
    // 1. source world rotations (identity rest ⇒ plain quaternion chain)
    const bones = this.srcBones, wq = this.srcWorldQ, par = this.srcParent;
    for (let i = 0; i < bones.length; i++) {
      if (par[i] >= 0) wq[i].copy(wq[par[i]]).multiply(bones[i].quaternion);
      else wq[i].copy(bones[i].quaternion);
    }
    // 2. rotations, top-down through the target's real hierarchy
    for (const p of this.plan) {
      const parentQ = p.parent ? this.curOf.get(p.parent) : null;
      if (p.canonical) {
        const t = this.targets.get(p.canonical);
        // desired world = srcWorld ∘ align; local = parent⁻¹ ∘ desired
        _q.copy(wq[this.srcIndex.get(p.canonical)]).multiply(t.align);
        p.curQ.copy(_q);
        if (parentQ) _q2.copy(parentQ).invert().multiply(_q);
        else _q2.copy(_q);
        p.node.quaternion.copy(_q2);
      } else {
        // unmapped: keeps its rest local rotation, still accumulates
        if (parentQ) p.curQ.copy(parentQ).multiply(p.node.quaternion);
        else p.curQ.copy(p.node.quaternion);
      }
    }
    // 3. hips positional track (crouch, lie down, jump squash), height-scaled
    const h = this.dstHips;
    if (h) {
      const root = this.srcIndex.get('Root');
      _v.copy(this.srcHips.position).sub(this.srcHipsRest.localPos);
      if (root !== undefined) _v.applyQuaternion(wq[root]);
      _v.multiplyScalar(h.ratio).applyMatrix3(h.invParent);
      h.node.position.copy(h.restLocalPos).add(_v);
    }
  }
}
