// ===========================================================================
// SUKUNA'S VESSELS — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-04 by web search (no images viewed — see the note in
// models/sukuna.js; the same limitation applies here).
//
// WHAT DIFFERS FROM THE BASE, AND NOTHING ELSE
// The true form (models/sukuna.js) is its own body: four arms, four eyes, a
// second mouth. A VESSEL is not. When Sukuna is in someone else's body it IS
// that body — Yuji's or Megumi's build, height, face and clothes — with three
// things laid over it:
//
//   1. THE MARKINGS. Black tattoo-like lines that "manifest on his vessel
//      whenever he is in control". Two bars across the forehead, a slash out
//      from beside each eye toward the temple, a short chin stripe, a pair on
//      the throat, and bands on the upper arms and wrists. Same layout as the
//      true form's always-on set, scaled to the host's head.
//   2. THE SECOND PAIR OF EYES. Canon detail: the incarnation gave Yuji "a
//      second pair of eyes underneath his normal eyes, usually closed, which
//      opened when Sukuna took control". So on a vessel they sit BELOW the
//      natural pair — not on a flesh plate, which is a true-form feature only.
//   3. THE EXPRESSION. Handled in animation, not geometry: the vessel uses
//      Sukuna's stance and clip set, so it stands like him.
//
// EXPLICITLY NOT PRESENT ON A VESSEL: the extra arms, the abdominal mouth, the
// flesh plate, the pink-red hair. A vessel keeps the host's hair and silhouette
// — that is the entire point of the look, and it is why these two are cosmetic
// rather than a re-model.
//
// MEGUMI'S VESSEL is Sukuna's main body from chapter 212 onward (taken with
// the "Enchain" binding vow). "Meguna" is a fan name with no canonical
// equivalent — see the variant descriptor.
//
// BUILT BY OVERLAY, NOT BY DUPLICATION. Both call the host's own builder and
// then parent marking meshes to the bones of the finished model. Nothing about
// Yuji's or Megumi's mesh, rig, materials or clips is touched or copied.
// ===========================================================================
import * as THREE from 'three';
import { buildYuji } from './yuji.js';
import { buildMegumi } from './megumi.js';
import { roundBox, almondEye, tGeo } from '../builders/geo.js';

const MARK = 0x23090f;
const EYE = 0xe02038;

// Lay Sukuna's markings over a finished host model. `m` is the host's measure
// block (ctx.m is not available post-finalize, so the caller passes the few
// numbers that matter). Everything is parented to a bone, so it deforms with
// the host exactly as its own geometry does.
function applyMarkings(model, o) {
  const { headR, headC, H } = o;
  const markMat = new THREE.MeshBasicMaterial({ color: MARK });
  const flatMat = new THREE.MeshBasicMaterial({ vertexColors: false, color: 0x40151d });
  const irisMat = new THREE.MeshBasicMaterial({ color: EYE });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const head = model.getBone('Head');
  const neck = model.getBone('Neck');
  const hj = o.headJoint, nj = o.neckJoint;
  // bone-local placement: bind pose has identity rotation, so a world offset
  // and a local offset are the same thing (same trick as the Finger tiers)
  const L = (j, w) => [w[0] - j.x, w[1] - j.y, w[2] - j.z];
  const put = (bone, j, geo, w, rot = [0, 0, 0], mat = markMat) => {
    const b = model.getBone(bone);
    if (!b) return null;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...L(j, w));
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    b.add(mesh);
    return mesh;
  };

  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;
  const bar = (w, h) => roundBox(w, h, 0.004, 0.002);

  // forehead: two bars, the upper one shorter
  put('Head', hj, bar(headR * 0.86, headR * 0.075), [0, eyeY + headR * 0.50, faceZ + headR * 0.014]);
  put('Head', hj, bar(headR * 0.58, headR * 0.065), [0, eyeY + headR * 0.68, faceZ - headR * 0.004]);
  // chin
  put('Head', hj, bar(headR * 0.070, headR * 0.16), [0, headC.y - headR * 0.66, faceZ - headR * 0.02]);

  for (const s of [1, -1]) {
    // the slash outboard of each eye, running to the temple
    put('Head', hj, bar(headR * 0.34, headR * 0.062),
      [s * headR * 0.74, eyeY - headR * 0.12, faceZ - headR * 0.10], [0, 0, s * -0.24]);
    // throat pair
    if (neck) put('Neck', nj, bar(headR * 0.30, headR * 0.055),
      [s * 0.026 * H, nj.y - 0.014 * H, 0.019 * H], [0, 0, s * -1.12]);

    // ---- THE SECOND PAIR OF EYES ------------------------------------------
    // On a vessel these sit BELOW the natural pair (canon: "underneath his
    // normal eyes, usually closed, opened when Sukuna took control"). No flesh
    // plate — that is a true-form feature and does not belong on a host.
    const ex = s * headR * 0.42, ey = eyeY - headR * 0.42;
    const tilt = s > 0 ? -7 : 10;
    put('Head', hj, tGeo(almondEye(headR * 0.40, headR * 0.19, tilt), {}),
      [ex, ey, faceZ + headR * 0.020], [0, 0, 0], flatMat);
    put('Head', hj, new THREE.CircleGeometry(headR * 0.078, 12),
      [ex - s * headR * 0.028, ey + headR * 0.010, faceZ + headR * 0.026], [0, 0, 0], irisMat);
    put('Head', hj, new THREE.CircleGeometry(headR * 0.024, 8),
      [ex - s * headR * 0.042, ey + headR * 0.038, faceZ + headR * 0.030], [0, 0, 0], whiteMat);
    put('Head', hj, bar(headR * 0.42, headR * 0.050),
      [ex, ey + headR * 0.120, faceZ + headR * 0.024], [0, 0, tilt * 0.010]);
  }

  // arm bands — the two arms the host actually has
  for (const side of ['L', 'R']) {
    for (const [bone, r, drop] of [
      ['UpArm' + side, 0.0300 * H, 0.030 * H],
      ['UpArm' + side, 0.0290 * H, 0.052 * H],
      ['Hand' + side, 0.0180 * H, -0.004 * H]
    ]) {
      const j = o.joints[bone];
      if (!j) continue;
      const g = new THREE.CylinderGeometry(r, r, 0.010 * H, 12, 1, true);
      put(bone, j, g, [j.x, j.y - drop, j.z]);
    }
  }
  return markMat;
}

// The host models do not hand their measure block back, so both builders below
// re-derive the handful of numbers `applyMarkings` needs from the finished
// model, which does carry `H` and `m`.
function overlay(model) {
  const m = model.m;
  applyMarkings(model, {
    H: model.H, headR: m.headR, headC: m.headC,
    headJoint: m.joints.get('Head'), neckJoint: m.joints.get('Neck'),
    joints: Object.fromEntries([...m.joints.entries()])
  });
  // A vessel has no Fingers to eat and no markings to spread — the stacks are
  // a true-form mechanic. The switch exists so nothing that calls it has to
  // know which body it is looking at.
  model.setFingers = () => { };
  return model;
}

export function buildSukunaYuji() { return overlay(buildYuji()); }
export function buildSukunaMegumi() { return overlay(buildMegumi()); }
