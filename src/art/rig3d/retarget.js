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
import { collectBoneNodes } from './bonemap.js';

// canonical child each bone aims at when computing its rest direction
const REF_CHILD = {
  Hips: 'Spine', Spine: 'Chest', Chest: 'Neck', Neck: 'Head',
  ClavL: 'UpArmL', UpArmL: 'LoArmL', LoArmL: 'HandL',
  ClavR: 'UpArmR', UpArmR: 'LoArmR', LoArmR: 'HandR',
  ThighL: 'ShinL', ShinL: 'FootL',
  ThighR: 'ShinR', ShinR: 'FootR'
};
// THE ROLL REFERENCE — the second vector that resolves a bone's TWIST.
//
// Matching a bone's direction alone (the shortest arc from the model's rest
// limb onto the game's) leaves the rotation ABOUT that limb undetermined, and
// the leftover twist is arbitrary. It does not show at rest — the arm points
// the right way either way — but the moment a clip bends the elbow, the
// forearm swings out of plane: the arm reaches overhead and the elbow flicks
// sideways instead of staying under the hand. Every limb in the game bends,
// so every limb showed it.
//
// So each bone also names a SECOND pair of joints whose direction pins the
// roll, and the alignment becomes a full frame match rather than an arc:
//   · a limb uses the next segment down, i.e. its own bend plane — the elbow
//     for the upper arm, the knee for the thigh
//   · the torso uses the SHOULDER AXIS, which is the one line across a body
//     that cannot be mistaken (and which catches a spine bone that ships
//     rolled 180°, as Rigify's DEF-spine does)
// Where the two references are parallel (a rest pose with a dead-straight
// arm) the frame is degenerate and the arc is used instead — it is exactly
// the case where the twist does not matter yet.
const ROLL_REF = {
  Hips: ['ThighR', 'ThighL'],
  Spine: ['UpArmR', 'UpArmL'], Chest: ['UpArmR', 'UpArmL'],
  Neck: ['UpArmR', 'UpArmL'], Head: ['UpArmR', 'UpArmL'],
  ClavL: ['UpArmL', 'LoArmL'], UpArmL: ['LoArmL', 'HandL'], LoArmL: ['UpArmL', 'LoArmL'],
  ClavR: ['UpArmR', 'LoArmR'], UpArmR: ['LoArmR', 'HandR'], LoArmR: ['UpArmR', 'LoArmR'],
  ThighL: ['ShinL', 'FootL'], ShinL: ['ThighL', 'ShinL'],
  ThighR: ['ShinR', 'FootR'], ShinR: ['ThighR', 'ShinR']
};

// orthonormal frame from a primary axis and a roll hint; null if degenerate
const _fx = new THREE.Vector3(), _fy = new THREE.Vector3(), _fz = new THREE.Vector3();
const _fm = new THREE.Matrix4();
function frameQ(primary, roll) {
  _fx.copy(primary).normalize();
  _fy.copy(roll).addScaledVector(_fx, -roll.dot(_fx));
  if (_fy.lengthSq() < 2e-3) return null;      // roll ∥ bone — no twist to read
  _fy.normalize();
  _fz.crossVectors(_fx, _fy);
  return new THREE.Quaternion().setFromRotationMatrix(_fm.makeBasis(_fx, _fy, _fz));
}

// canonical parent, for inheriting R when there is nothing to aim at
const REF_PARENT = {
  Spine: 'Hips', Chest: 'Spine', Neck: 'Chest', Head: 'Neck',
  ClavL: 'Chest', UpArmL: 'ClavL', LoArmL: 'UpArmL', HandL: 'LoArmL',
  ClavR: 'Chest', UpArmR: 'ClavR', LoArmR: 'UpArmR', HandR: 'LoArmR',
  ThighL: 'Hips', ShinL: 'ThighL', FootL: 'ShinL',
  ThighR: 'Hips', ShinR: 'ThighR', FootR: 'ShinR'
};

// -------------------------------------------------------- hierarchy fix ----
// Some exports ship the skeleton FLAT: Rigify DEF-bone rigs parent the
// thighs, shoulders and arms directly under the armature root instead of
// under the spine. Rotation transfer alone would leave those limbs pinned at
// their bind positions while the torso moves — a crouch would stand the legs
// still and drop the body through them. Skinning only reads world matrices,
// so the fix is to physically reparent each mapped bone under its canonical
// parent (world transform preserved exactly), after which position inherits
// the way every clip assumes. Unmapped root-level helpers (Rigify's
// DEF-pelvis butt bones and the like) get parented under the hips so they
// ride the body instead of hanging in the air.
//
// Deterministic: the game and the workbench both run this right after the
// bone map is decided, so a pose calibrated on the bench replays identically
// in the game.
const RERIG_ORDER = [
  'Spine', 'Chest', 'Neck', 'Head',
  'ClavL', 'UpArmL', 'LoArmL', 'HandL', 'ClavR', 'UpArmR', 'LoArmR', 'HandR',
  'ThighL', 'ShinL', 'FootL', 'ThighR', 'ShinR', 'FootR'
];

export function rerigHierarchy(root, map) {
  root.updateMatrixWorld(true);
  const _m = new THREE.Matrix4();
  const isAncestor = (a, n) => {
    for (let x = n.parent; x; x = x.parent) if (x === a) return true;
    return false;
  };
  // world transform preserved: new local = parent⁻¹ ∘ world. Cached
  // matrixWorld values stay valid across moves because every move preserves
  // every world transform.
  const reparent = (n, p) => {
    if (!n || !p || n === p || isAncestor(p, n) || isAncestor(n, p)) return false;
    _m.copy(p.matrixWorld).invert().multiply(n.matrixWorld);
    p.add(n);
    _m.decompose(n.position, n.quaternion, n.scale);
    n.updateMatrix();
    return true;
  };
  let moved = 0;
  for (const c of RERIG_ORDER) {
    const n = map[c];
    if (!n) continue;
    let pc = REF_PARENT[c];
    while (pc && !map[pc]) pc = REF_PARENT[pc];
    if (pc && reparent(n, map[pc])) moved++;
  }
  if (map.Hips) {
    const mapped = new Set(Object.values(map));
    for (const j of collectBoneNodes(root)) {
      if (mapped.has(j)) continue;
      let underMapped = false;
      for (let a = j.parent; a; a = a.parent) if (mapped.has(a)) { underMapped = true; break; }
      if (!underMapped && reparent(j, map.Hips)) moved++;
    }
  }
  if (moved) {
    root.updateMatrixWorld(true);
    console.info(`[render3d] hierarchy normalized — ${moved} bones reparented`);
  }
  return moved;
}

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
          dstDir.normalize(); srcDir.normalize();
          // full frame match where a roll reference exists, arc where it does not
          const rr = ROLL_REF[name];
          let framed = null;
          if (rr && map[rr[0]] && map[rr[1]] && srcRest.get(rr[0]) && srcRest.get(rr[1])) {
            const qd = frameQ(dstDir, restWorldPos(map[rr[1]]).sub(restWorldPos(map[rr[0]])));
            const qs = frameQ(srcDir, srcRest.get(rr[1]).worldPos.clone().sub(srcRest.get(rr[0]).worldPos));
            if (qd && qs) framed = qs.multiply(qd.invert());
          }
          r = framed || new THREE.Quaternion().setFromUnitVectors(dstDir, srcDir);
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

  // The constant that maps this bone's procedural world rotation onto the
  // imported one. Attachments need it: see adoptAttachments in render3d.js.
  alignOf(canonical) { return this.targets.get(canonical)?.align ?? null; }

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
