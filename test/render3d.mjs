// RENDER3D RETARGETING — the headless proof of the mapping math.
//
// There is no .glb in this repo (and never will be — see public/models/), so
// this builds the thing a .glb would provide: a synthetic Mixamo-named
// humanoid in a T-POSE, deliberately at a different height and a different
// bind pose from the game's rigs. It then drives it from a REAL roster model
// playing REAL clips through the real AnimPlayer, and asserts the properties
// the whole feature stands on:
//
//   1. bone-name auto-detection maps a Mixamo rig completely
//   2. at bind, the T-pose arms come down to the game's A-pose (alignment)
//   3. mid-clip, every mapped limb points the way the drive rig's limb points
//   4. the Hips positional track transfers (a knockdown puts the body down)
//   5. nothing is NaN anywhere, across every base clip
//
// Plain node script, no framework, matching test/roster.mjs:
//
//     node test/render3d.mjs
import * as THREE from 'three';
import { buildYuji } from '../src/art/models/yuji.js';
import { makeClips } from '../src/art/anim/index.js';
import { AnimPlayer } from '../src/art/anim/player.js';
import { guessBoneMap } from '../src/art/rig3d/bonemap.js';
import { Retargeter, captureSourceRest } from '../src/art/rig3d/retarget.js';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

// ---- a synthetic Mixamo-style T-pose humanoid, 1.6 m, facing +Z ------------
function makeMixamoRig() {
  const B = (name, x, y, z, parent) => {
    const b = new THREE.Bone();
    b.name = 'mixamorig:' + name;
    b.position.set(x, y, z);
    if (parent) parent.add(b);
    return b;
  };
  const hips = B('Hips', 0, 0.85, 0);
  const spine = B('Spine', 0, 0.09, 0, hips);
  const spine1 = B('Spine1', 0, 0.10, 0, spine);
  const spine2 = B('Spine2', 0, 0.10, 0, spine1);
  const neck = B('Neck', 0, 0.12, 0, spine2);
  B('Head', 0, 0.09, 0.01, neck);
  for (const s of ['Left', 'Right']) {
    const m = s === 'Left' ? 1 : -1;
    const sh = B(s + 'Shoulder', m * 0.06, 0.09, 0, spine2);
    const arm = B(s + 'Arm', m * 0.11, 0, 0, sh);         // T-pose: straight out
    const fore = B(s + 'ForeArm', m * 0.26, 0, 0, arm);
    const hand = B(s + 'Hand', m * 0.24, 0, 0, fore);
    B(s + 'HandMiddle1', m * 0.08, 0, 0, hand);
    const up = B(s + 'UpLeg', m * 0.09, -0.06, 0, hips);
    const leg = B(s + 'Leg', 0, -0.38, 0, up);
    const foot = B(s + 'Foot', 0, -0.36, 0, leg);
    B(s + 'ToeBase', 0, -0.05, 0.12, foot);
  }
  const root = new THREE.Group();
  root.name = 'Armature';
  root.add(hips);
  return root;
}

// world position of a node measured under `top` (works detached from a scene)
function worldPos(top, node) {
  top.updateMatrixWorld(true);
  return new THREE.Vector3().setFromMatrixPosition(node.matrixWorld);
}
const dir = (a, b) => b.clone().sub(a).normalize();
const noNaN = o => {
  let bad = null;
  o.traverse(n => {
    for (const v of [...n.position.toArray(), ...n.quaternion.toArray()]) {
      if (!Number.isFinite(v)) bad = n.name;
    }
  });
  return bad;
};

// ---- build both sides ------------------------------------------------------
const model = buildYuji();
const srcRest = captureSourceRest(model);
const target = makeMixamoRig();

const { map, missing, report } = guessBoneMap(target);
check('bone auto-detection maps the full Mixamo core', missing.length === 0, report);
check('spine chain split: Spine -> lowest, Chest -> highest',
  map.Spine?.name === 'mixamorig:Spine' && map.Chest?.name === 'mixamorig:Spine2');
check('fingers are not mistaken for hands', map.HandL?.name === 'mixamorig:LeftHand');

// normalize the way render3d.js does: height-fit, feet grounded
const wrapper = new THREE.Group();
const tmp = new THREE.Group(); tmp.add(target); tmp.updateMatrixWorld(true);
// a pure bone hierarchy has no geometry, so measure the node origins (this is
// also what render3d.js folds into its bounds for mesh-light exports)
const box = new THREE.Box3();
target.traverse(o => box.expandByPoint(new THREE.Vector3().setFromMatrixPosition(o.matrixWorld)));
const s = model.H / box.getSize(new THREE.Vector3()).y;
wrapper.scale.setScalar(s);
tmp.remove(target);
wrapper.add(target);
target.position.y -= box.min.y;
model.group.add(wrapper);

const rt = new Retargeter(model, srcRest, wrapper, map);
const player = new AnimPlayer(model.bones, makeClips('yuji'));

// ---- 2: bind alignment — T-pose arms land on the game's A-pose -------------
rt.apply();
const srcSh = srcRest.get('UpArmL').worldPos, srcEl = srcRest.get('LoArmL').worldPos;
const srcArmDir = dir(srcSh, srcEl);
const dstArmDir = dir(worldPos(model.group, map.UpArmL), worldPos(model.group, map.LoArmL));
check('T-pose arm folds down to the source A-pose at bind',
  srcArmDir.dot(dstArmDir) > 0.999,
  `dot=${srcArmDir.dot(dstArmDir).toFixed(4)}`);
const legDir = dir(worldPos(model.group, map.ThighL), worldPos(model.group, map.ShinL));
check('legs stay vertical at bind', legDir.y < -0.99, `y=${legDir.y.toFixed(3)}`);

// ---- 3: mid-clip limb tracking ---------------------------------------------
function srcJointWorld(name) {
  model.group.updateMatrixWorld(true);
  return new THREE.Vector3().setFromMatrixPosition(model.getBone(name).matrixWorld);
}
player.play('run', { fade: 0, restart: true });
for (let i = 0; i < 20; i++) player.update(1 / 60);
rt.apply();
let worst = 1;
for (const [a, b] of [['UpArmL', 'LoArmL'], ['LoArmL', 'HandL'], ['ThighL', 'ShinL'],
  ['ShinL', 'FootL'], ['UpArmR', 'LoArmR'], ['ThighR', 'ShinR'], ['Chest', 'Neck']]) {
  const sd = dir(srcJointWorld(a), srcJointWorld(b));
  const dd = dir(worldPos(model.group, map[a]), worldPos(model.group, map[b]));
  worst = Math.min(worst, sd.dot(dd));
}
check('every mapped limb tracks the drive rig mid-run', worst > 0.995,
  `worst dot=${worst.toFixed(4)}`);

// ---- 4: hips positional track ----------------------------------------------
const standY = worldPos(model.group, map.Hips).y;
player.play('knockdown', { fade: 0, restart: true });
for (let i = 0; i < 40; i++) player.update(1 / 60);
rt.apply();
const downY = worldPos(model.group, map.Hips).y;
check('knockdown drops the imported hips to the floor',
  downY < standY * 0.35, `${standY.toFixed(2)} -> ${downY.toFixed(2)}`);

// ---- 5: numerical health across the whole base clip set --------------------
let nanIn = null;
for (const clip of player.clips.keys()) {
  player.play(clip, { fade: 0.05, restart: true });
  for (let i = 0; i < 30; i++) { player.update(1 / 60); rt.apply(); }
  const bad = noNaN(target);
  if (bad) { nanIn = `${clip}:${bad}`; break; }
}
check('no NaN across every clip', !nanIn, nanIn ?? '');

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall good');
process.exit(failures ? 1 : 0);
