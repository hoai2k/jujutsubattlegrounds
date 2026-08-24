// JOINT PIVOTS — moving where a bone rotates, without moving the mesh.
// ===========================================================================
// A rig can be perfectly skinned and still be WRONG: if the shoulder bone sits
// three centimetres below the actual shoulder, every arm raise pivots from
// inside the ribcage and the deltoid shears. Yuji's rig has exactly this — the
// weights say the shoulder joint is above where the bone puts it.
//
// The fix is not to repaint weights (expensive, destructive, needs a DCC tool)
// but to MOVE THE PIVOT and leave everything else alone:
//
//   1. translate the bone (rotation untouched),
//   2. give every child back its old world transform, so nothing downstream
//      shifts,
//   3. rebuild the bone's inverse-bind so the rest mesh is bit-identical:
//      skinMatrix = M · boneInverse must not change, so
//      boneInverse' = M'⁻¹ · M · boneInverse.
//
// After that the rest pose renders exactly as before — same vertices, same
// weights, same falloff — but the bone now ROTATES ABOUT THE RIGHT POINT.
// That is the whole of the correction, and it is reversible and data-only:
// the bench exports the new local positions as the manifest's `joints`, and
// the game replays them at load.
import * as THREE from 'three';

export function collectSkeletons(root) {
  const out = [];
  root.traverse(o => {
    if (o.isSkinnedMesh && o.skeleton && !out.includes(o.skeleton)) out.push(o.skeleton);
  });
  return out;
}

const _m = new THREE.Matrix4();
const _inv = new THREE.Matrix4();

// newLocalPos: the bone's new position in its parent's space.
export function moveBonePivot(bone, newLocalPos, skeletons) {
  bone.updateWorldMatrix(true, true);
  const Mold = bone.matrixWorld.clone();
  const kids = bone.children.map(c => ({ c, w: c.matrixWorld.clone() }));

  bone.position.copy(newLocalPos);
  bone.updateWorldMatrix(false, true);

  // boneInverse' = M'⁻¹ · M · boneInverse  →  rest skinning unchanged
  const T = _m.copy(bone.matrixWorld).invert().multiply(Mold).clone();
  for (const sk of skeletons) {
    const i = sk.bones.indexOf(bone);
    if (i >= 0) sk.boneInverses[i].premultiply(T);
  }
  // children keep the world transforms they had
  _inv.copy(bone.matrixWorld).invert();
  for (const { c, w } of kids) {
    _m.multiplyMatrices(_inv, w).decompose(c.position, c.quaternion, c.scale);
  }
  bone.updateWorldMatrix(false, true);
  for (const sk of skeletons) sk.needsUpdate = true;
}

// Manifest replay: { nodeName: [x, y, z] } local positions.
export function applyJointEdits(root, joints, skeletons = collectSkeletons(root)) {
  if (!joints) return 0;
  const byName = new Map();
  root.traverse(o => { if (o.name && !byName.has(o.name)) byName.set(o.name, o); });
  let n = 0;
  for (const [name, p] of Object.entries(joints)) {
    const bone = byName.get(name);
    if (!bone) { console.warn(`[render3d] joints names no node "${name}"`); continue; }
    moveBonePivot(bone, new THREE.Vector3(p[0], p[1], p[2]), skeletons);
    n++;
  }
  return n;
}

// ---------------------------------------------------------------- analysis --
// WHERE THE JOINT ACTUALLY IS, according to the skin. Between two adjacent
// bones the weights hand over across a band, and the centroid of that band is
// the joint — that is what a joint IS, in a skinned mesh. Comparing it with
// where the bone sits is a measurement of the rig rather than an opinion
// about it.
//
// Two details make it trustworthy on real rigs:
//   · TWIST BONES. Rigify puts `upper_arm.L.001` between the upper arm and
//     the forearm, so the raw band between two canonical bones is empty. Each
//     canonical bone therefore owns its unmapped descendants up to the next
//     canonical one, and the weights are read through those groups.
//   · VERTEX POSITIONS ARE SKINNED, not read raw. gltfpack bakes its
//     dequantization into the inverse-binds, so `position` alone is in the
//     wrong space; running the actual skinning math is the only thing that is
//     correct for every exporter.
const REF_PARENT = {
  Spine: 'Hips', Chest: 'Spine', Neck: 'Chest', Head: 'Neck',
  ClavL: 'Chest', UpArmL: 'ClavL', LoArmL: 'UpArmL', HandL: 'LoArmL',
  ClavR: 'Chest', UpArmR: 'ClavR', LoArmR: 'UpArmR', HandR: 'LoArmR',
  ThighL: 'Hips', ShinL: 'ThighL', FootL: 'ShinL',
  ThighR: 'Hips', ShinR: 'ThighR', FootR: 'ShinR'
};

export function analyzeJoints(root, map) {
  root.updateMatrixWorld(true);
  const canonOf = new Map();
  for (const [c, n] of Object.entries(map)) if (n) canonOf.set(n, c);

  const bands = new Map();     // "A|B" -> {w, x, y, z, n}
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  const acc = new THREE.Vector3();
  const sm = new THREE.Matrix4();

  root.traverse(mesh => {
    if (!mesh.isSkinnedMesh || !mesh.skeleton) return;
    const sk = mesh.skeleton;
    // group every joint under the canonical bone that owns it
    const group = sk.bones.map(b => {
      let a = b;
      while (a && !canonOf.has(a)) a = a.parent;
      return a ? canonOf.get(a) : null;
    });
    // full skinning transform per bone, in world space
    const post = new THREE.Matrix4().multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse);
    const skin = sk.bones.map((b, i) =>
      new THREE.Matrix4().multiplyMatrices(post,
        sm.multiplyMatrices(b.matrixWorld, sk.boneInverses[i]).clone()));
    const bind = mesh.bindMatrix;

    const g = mesh.geometry;
    const pos = g.getAttribute('position');
    const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
    if (!si || !sw) return;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(bind);
      acc.set(0, 0, 0);
      let heaviest = -1, heaviestW = 0;
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k);
        if (w <= 0) continue;
        const bi = si.getComponent(i, k);
        acc.addScaledVector(_v2.copy(v).applyMatrix4(skin[bi]), w);
        if (w > heaviestW) { heaviestW = w; heaviest = bi; }
      }
      if (heaviest < 0) continue;
      box.expandByPoint(acc);
      for (let a = 0; a < 4; a++) {
        const wa = sw.getComponent(i, a);
        if (wa < 0.15) continue;
        const ga = group[si.getComponent(i, a)];
        if (!ga) continue;
        for (let b = a + 1; b < 4; b++) {
          const wb = sw.getComponent(i, b);
          if (wb < 0.15) continue;
          const gb = group[si.getComponent(i, b)];
          if (!gb || gb === ga) continue;
          const key = ga < gb ? ga + '|' + gb : gb + '|' + ga;
          let e = bands.get(key);
          if (!e) bands.set(key, e = { w: 0, p: new THREE.Vector3(), n: 0 });
          const m = Math.min(wa, wb);
          e.w += m; e.p.addScaledVector(acc, m); e.n++;
        }
      }
    }
  });

  const H = Math.max(1e-6, box.max.y - box.min.y);
  const rows = [];
  for (const [canon, node] of Object.entries(map)) {
    if (!node) continue;
    const parent = REF_PARENT[canon];
    if (!parent || !map[parent]) continue;
    const key = canon < parent ? canon + '|' + parent : parent + '|' + canon;
    const e = bands.get(key);
    if (!e || e.n < 60 || e.w <= 0) { rows.push({ canon, node: node.name, band: e?.n ?? 0 }); continue; }
    const want = e.p.clone().multiplyScalar(1 / e.w);
    const at = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
    const d = want.clone().sub(at);
    rows.push({
      canon, node: node.name, band: e.n,
      at: at.toArray(), want: want.toArray(), delta: d.toArray(),
      dist: d.length(), pctH: 100 * d.length() / H, dY: d.y
    });
  }
  return { rows, H };
}

const _v2 = new THREE.Vector3();

// World-space target -> the local position to store in `joints`.
export function worldToLocalPos(node, world) {
  const p = new THREE.Vector3().copy(world);
  if (node.parent) {
    node.parent.updateWorldMatrix(true, false);
    p.applyMatrix4(_inv.copy(node.parent.matrixWorld).invert());
  }
  return p;
}

// SYMMETRY. A humanoid rig should be a mirror of itself, and where it is not,
// one of the two sides is wrong. Averaging the pair about the model's own
// mid-plane fixes both at once and is the single highest-value automatic
// correction available — it also cancels the left/right disagreement the
// weight estimator itself produces on an asymmetric costume.
export function mirrorPairs(map) {
  const out = [];
  for (const base of ['Clav', 'UpArm', 'LoArm', 'Hand', 'Thigh', 'Shin', 'Foot']) {
    if (map[base + 'L'] && map[base + 'R']) out.push([base + 'L', base + 'R']);
  }
  return out;
}
