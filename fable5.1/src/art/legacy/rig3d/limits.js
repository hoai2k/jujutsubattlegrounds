// BEND LIMITS — the clip was authored for a different body.
// ===========================================================================
// The retargeter transfers ROTATIONS, which is what makes a clip play on any
// rig at all. It is also what makes this necessary: a rotation that reads
// perfectly on the procedural body can be impossible on an imported one,
// because the two have different FLESH.
//
// Nobara's punch3 ends with her elbow folded 145°. On the procedural body the
// upper arm and forearm are slim tapered cylinders with an ink outline, so at
// 145° they stay two visibly separate segments with a gap between them. On the
// imported body the same 145° presses two thick sleeves against each other:
// the gap closes, the outline merges, and the arm stops reading as an arm with
// an elbow. It reads as one long loop — which is exactly what "long and
// bendy" describes, and no amount of skin-weight work fixes it, because
// nothing is wrong with the skin. The pose is simply one this body cannot
// hold.
//
// So a limit is a property of the BODY, not of the clip: the most a joint may
// fold before its own volume closes. It lives in the manifest next to the
// other per-model corrections, applies after the retargeter, and is measured
// in degrees of bend — 0 straight, 180 folded flat.
//
//     "limits": { "LoArmL": 120, "LoArmR": 120 }
//
// WHAT IT COSTS. The fist stops where the limit puts it, a few centimetres
// from where the clip asked. That is a real cost and the reason the default is
// no limits at all: it is worth paying only where the alternative is a limb
// that has stopped being legible. Prefer the smallest limit that opens the
// silhouette.
import * as THREE from 'three';

const CHAINS = {
  LoArmL: ['UpArmL', 'LoArmL', 'HandL'], LoArmR: ['UpArmR', 'LoArmR', 'HandR'],
  ShinL: ['ThighL', 'ShinL', 'FootL'], ShinR: ['ThighR', 'ShinR', 'FootR']
};

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
const _u = new THREE.Vector3(), _v = new THREE.Vector3(), _axis = new THREE.Vector3();
const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _wq = new THREE.Quaternion();

/**
 * Normalize a manifest `limits` block. Values are the maximum bend in degrees;
 * anything unusable is dropped with a warning rather than applied wrongly.
 */
export function normalizeLimits(spec, label = 'limits') {
  const out = [];
  for (const [joint, deg] of Object.entries(spec ?? {})) {
    if (!CHAINS[joint]) { console.warn(`[render3d] ${label}: "${joint}" is not a limitable joint`); continue; }
    const max = Number(deg);
    if (!(max >= 0 && max <= 180)) { console.warn(`[render3d] ${label}: ${joint} needs 0..180 degrees`); continue; }
    out.push({ joint, chain: CHAINS[joint], max: max * Math.PI / 180 });
  }
  return out;
}

/**
 * Unbend anything past its limit, in place. Call after the retargeter, with
 * world matrices current — the same slot the grip solver runs in.
 *
 * The correction is applied about the joint's OWN current bend axis rather
 * than a fixed hinge, so it gives back exactly the rotation that went too far
 * and leaves the arm's swing and twist alone.
 */
export function applyBendLimits(map, limits) {
  let hit = 0;
  for (const { chain, max } of limits) {
    const [pn, jn, cn] = chain;
    const parent = map[pn], joint = map[jn], child = map[cn];
    if (!parent || !joint || !child) continue;
    // The retargeter writes local rotations and does not refresh the world
    // matrices, so reading them raw measures the pose one frame late and the
    // correction chases a moving target: asked for 120 degrees it settled at
    // 129, and asked for 80 it settled at 115.
    parent.updateWorldMatrix(true, true);
    _a.setFromMatrixPosition(parent.matrixWorld);
    _b.setFromMatrixPosition(joint.matrixWorld);
    _c.setFromMatrixPosition(child.matrixWorld);
    _u.copy(_b).sub(_a);
    _v.copy(_c).sub(_b);
    if (_u.lengthSq() < 1e-12 || _v.lengthSq() < 1e-12) continue;
    _u.normalize(); _v.normalize();
    const bend = Math.acos(Math.max(-1, Math.min(1, _u.dot(_v))));
    if (bend <= max) continue;
    _axis.crossVectors(_u, _v);
    if (_axis.lengthSq() < 1e-10) continue;               // straight: no hinge to undo
    _axis.normalize();
    // Unbend in WORLD space and express the result in the joint's parent
    // frame — stated as "the world orientation I want, converted back", not as
    // a similarity transform of a delta, which is the version I got subtly
    // wrong and which quietly under-corrected by a quarter of the excess.
    _q.setFromAxisAngle(_axis, -(bend - max));
    joint.getWorldQuaternion(_wq);
    _wq.premultiply(_q);
    joint.parent.getWorldQuaternion(_pq).invert();
    joint.quaternion.copy(_pq.multiply(_wq)).normalize();
    joint.updateWorldMatrix(false, true);
    hit++;
  }
  return hit;
}
