// TWO-BONE IK — the one thing pose retargeting cannot do on its own.
//
// The retargeter transfers ROTATIONS. That is the right contract for a body:
// a clip says "the elbow is bent this much", and a taller model's arm ends up
// further from the shoulder, exactly as it should. It is the wrong contract
// the moment something in the world has to be TOUCHED. A hand on the haft of
// a two-handed weapon is a POSITION, and the position an imported arm reaches
// is its own proportions' answer, not the drive rig's. A few centimetres of
// difference is invisible on a free hand and unmissable on one that is
// supposed to be gripping something.
//
// So: the shoulder and elbow are re-solved to put the wrist on a point. The
// classic three-step construction, done in world space so it is indifferent
// to whatever local axes the imported rig happens to use:
//
//   1. swing the whole arm so the wrist points AT the target
//   2. bend the elbow to the angle the triangle needs (law of cosines)
//   3. swing the forearm so the wrist lands exactly on it
//
// Step 2 is what keeps the elbow in the plane the clip already chose: the
// bend axis is read off the CURRENT pose rather than from a pole vector, so
// an arm that the animator bent outward stays bent outward, and only the
// amount changes. A straight arm has no plane to read, so those get the
// caller's hint (or the body's own side) instead.
//
// Nothing here is specific to grips or to imported models — it is a solver
// over three Object3Ds — but grip.js is the only caller, and the reason it
// lives in rig3d/ rather than in core/ is that the procedural body never
// needs it: its clips were authored against its own proportions, so its
// hands are already where the animator put them.
import * as THREE from 'three';

// scratch — this runs per arm per frame, so nothing here allocates
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const _t = new THREE.Vector3(), _u = new THREE.Vector3(), _v = new THREE.Vector3();
const _axis = new THREE.Vector3(), _q = new THREE.Quaternion();
const _wq = new THREE.Quaternion(), _pq = new THREE.Quaternion();
const _ident = new THREE.Quaternion();

const EPS = 1e-6;

// Apply a world-space delta rotation to a bone, blended by `w`, and refresh
// the world matrices below it so the next step reads the moved chain.
function rotateWorld(bone, q, w) {
  if (w < 1) _q.copy(_ident).slerp(q, w); else _q.copy(q);
  if (Math.abs(_q.w) > 1 - EPS) return;             // nothing to do
  bone.getWorldQuaternion(_wq);
  bone.parent.getWorldQuaternion(_pq);
  bone.quaternion.copy(_pq.invert()).multiply(_q).multiply(_wq);
  bone.updateMatrixWorld(true);
}

const worldPos = (o, out) => out.setFromMatrixPosition(o.matrixWorld);

/**
 * Put `end` on `target` by rotating `upper` and `lower`.
 *
 * upper -> lower -> end must be an ancestor chain (gaps are fine: twist bones
 * between them ride along). World matrices must be current on entry; they are
 * current on exit.
 *
 * @param {THREE.Object3D} upper   shoulder / hip
 * @param {THREE.Object3D} lower   elbow / knee
 * @param {THREE.Object3D} end     wrist / ankle
 * @param {THREE.Vector3}  target  world position the end should reach
 * @param {object} [opts]
 *   weight   0..1 blend of the whole correction (default 1)
 *   poleDir  world direction the joint should bend toward when the current
 *            pose is too straight to read a plane from
 *   maxReach fraction of full extension the target is clamped to (default
 *            0.995 — a fully locked-out limb looks broken and the maths goes
 *            singular)
 * @returns {number} how far the end still is from the target, in metres —
 *   0 when it was reached. A non-zero value means the target was out of
 *   range, which is the caller's cue to fade the grip out rather than leave
 *   an arm straining at something it cannot hold.
 */
export function solveTwoBone(upper, lower, end, target, opts = {}) {
  const w = opts.weight ?? 1;
  if (!(w > 0) || !upper || !lower || !end) return Infinity;

  worldPos(upper, _a); worldPos(lower, _b); worldPos(end, _c);
  const L1 = _a.distanceTo(_b), L2 = _b.distanceTo(_c);
  if (L1 < EPS || L2 < EPS) return Infinity;

  // reach clamp: keep the target inside the annulus the chain can actually
  // cover, and remember the shortfall so the caller can judge it
  _t.copy(target);
  const want = _t.distanceTo(_a);
  const hi = (L1 + L2) * (opts.maxReach ?? 0.995);
  const lo = Math.abs(L1 - L2) * 1.02 + EPS;
  const d = Math.min(hi, Math.max(lo, want));
  if (d !== want) _t.sub(_a).setLength(d).add(_a);
  const shortfall = Math.abs(want - d);

  // ---- 1. aim the whole arm at the target --------------------------------
  // A rigid rotation of the sub-chain: the elbow's bend is carried along
  // untouched, which is why the bend plane can be read after this step
  // rather than before it.
  _u.copy(_c).sub(_a).normalize();
  _v.copy(_t).sub(_a).normalize();
  rotateWorld(upper, _q.setFromUnitVectors(_u, _v), w);
  worldPos(lower, _b); worldPos(end, _c);

  // ---- 2. bend the elbow to the angle the triangle needs -----------------
  // the plane the arm is already bent in. Near-straight arms give a
  // degenerate normal, so those fall back to the caller's hint.
  _u.copy(_b).sub(_a); _v.copy(_c).sub(_b);
  _axis.crossVectors(_u, _v);
  if (_axis.lengthSq() < 1e-9) {
    _u.copy(_t).sub(_a).normalize();
    _axis.crossVectors(_u, opts.poleDir ?? _v.set(0, 0, 1));
    if (_axis.lengthSq() < 1e-9) _axis.set(0, 1, 0);
  }
  _axis.normalize();

  // desired angle at the shoulder between (shoulder->target) and
  // (shoulder->elbow), from the law of cosines on the L1/L2/d triangle
  const want1 = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  _u.copy(_b).sub(_a).normalize();
  _v.copy(_t).sub(_a).normalize();
  const have1 = Math.acos(clamp(_u.dot(_v)));
  // rotating by +have1 about normalize(u × v) would take the elbow direction
  // onto the target direction, so closing the gap to want1 is a rotation of
  // (have1 - want1) about that same sense of the bend axis
  const sign = _axis.dot(_u.cross(_v)) > 0 ? 1 : -1;
  rotateWorld(upper, _q.setFromAxisAngle(_axis, (have1 - want1) * sign), w);
  worldPos(lower, _b); worldPos(end, _c);

  // ---- 3. close the forearm onto the target ------------------------------
  _u.copy(_c).sub(_b).normalize();
  _v.copy(_t).sub(_b).normalize();
  rotateWorld(lower, _q.setFromUnitVectors(_u, _v), w);

  return shortfall;
}

const clamp = v => (v < -1 ? -1 : v > 1 ? 1 : v);

/**
 * Read a bone's world rotation, for restoring it after a solve.
 *
 * The IK moves the wrist's PARENTS, so the wrist inherits their rotation and
 * the hand ends up turned. The retargeter already decided what that hand
 * should look like — the clip was gripping something — so the palm attitude
 * is worth keeping across the solve.
 */
export function captureWorldQuat(bone, out = new THREE.Quaternion()) {
  return bone.getWorldQuaternion(out);
}

export function restoreWorldQuat(bone, q) {
  if (!bone?.parent) return;
  bone.parent.getWorldQuaternion(_pq);
  bone.quaternion.copy(_pq.invert()).multiply(q);
  bone.updateMatrixWorld(true);
}
