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
import { applyRestPose } from '../src/art/rig3d/render3d.js';
import { rerigHierarchy } from '../src/art/rig3d/retarget.js';
import { applyJointEdits, modelBindHeight } from '../src/art/rig3d/joints.js';
import { setDualQuaternionSkinning } from '../src/art/rig3d/dqs.js';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};

// ---- a synthetic Mixamo-style T-pose humanoid, 1.6 m, facing +Z ------------
function makeMixamoRig(bend = 0) {
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
    // `bend` puts the rest elbow OUT of the plane the game's rest arm bends
    // in — the case the roll reference exists for
    const hand = B(s + 'Hand', m * 0.24, -bend * 0.10, bend * 0.14, fore);
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

// ---- 4b: rest-pose calibration ---------------------------------------------
// Models rarely ship in T-pose. Scramble the rig into an arbitrary pose (the
// state a real file arrives in), then apply a manifest `pose` that stands it
// back up, rebuild the retargeter from the calibrated rest, and the bind
// alignment must hold exactly as it did from the clean T-pose.
{
  const t2 = makeMixamoRig();
  // ship it broken: arms dropped and elbows bent, spine slumped
  const scramble = {
    'mixamorig:LeftArm': [0, 0, -70], 'mixamorig:RightArm': [0, 0, 70],
    'mixamorig:LeftForeArm': [0, -40, 0], 'mixamorig:RightForeArm': [0, 40, 0],
    'mixamorig:Spine': [18, 0, 0]
  };
  applyRestPose(t2, scramble);
  // the calibration the bench would export: back to the T (identity locals)
  applyRestPose(t2, Object.fromEntries(Object.keys(scramble).map(k => [k, [0, 0, 0]])));
  const m2 = guessBoneMap(t2).map;
  const w2 = new THREE.Group();
  w2.scale.setScalar(s);
  w2.add(t2);
  t2.position.y -= box.min.y;
  model.group.add(w2);
  const rt2 = new Retargeter(model, srcRest, w2, m2);
  player.play('idle', { fade: 0, restart: true });
  player.update(0.01);
  rt2.apply();
  const d2 = dir(worldPos(model.group, m2.UpArmL), worldPos(model.group, m2.LoArmL));
  const sd2 = dir(srcJointWorld('UpArmL'), srcJointWorld('LoArmL'));
  check('calibrated rest retargets like a clean bind', sd2.dot(d2) > 0.995,
    `dot=${sd2.dot(d2).toFixed(4)}`);
  model.group.remove(w2);
}

// ---- 4c: Rigify DEF rigs — the shape the first real model shipped in --------
// A numbered spine chain that is really pelvis→head, sided pelvis helper
// bones, twist segments, and limbs parented FLAT under the armature root.
// The mapper must read the convention and the rerig must give the flat limbs
// a real hierarchy, or a crouch leaves the legs standing at bind height.
{
  const B = (name, x, y, z, parent) => {
    const b = new THREE.Bone();
    b.name = name; b.position.set(x, y, z);
    if (parent) parent.add(b);
    return b;
  };
  const arm = new THREE.Group(); arm.name = 'Yuji_Rig';
  const sp = [B('DEF-spine', 0, 0.95, 0)];
  for (let i = 1; i <= 6; i++) sp.push(B(`DEF-spine.00${i}`, 0, 0.08, 0, sp[i - 1]));
  arm.add(sp[0]);
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    B(`DEF-pelvis.${s}`, m * 0.06, 0.9, 0, arm);                       // butt helper, root-level
    const sh = B(`DEF-shoulder.${s}`, m * 0.03, 1.35, 0, arm);         // flat!
    arm.add(sh);
    const ua = B(`DEF-upper_arm.${s}`, m * 0.12, 1.35, 0, arm);        // flat!
    const uat = B(`DEF-upper_arm.${s}.001`, m * 0.12, 0, 0, ua);       // twist
    const fa = B(`DEF-forearm.${s}`, m * 0.12, 0, 0, uat);
    B(`DEF-hand.${s}`, m * 0.22, 0, 0, fa);
    const th = B(`DEF-thigh.${s}`, m * 0.08, 0.9, 0, arm);             // flat!
    const sh2 = B(`DEF-shin.${s}`, 0, -0.4, 0, th);
    B(`DEF-foot.${s}`, 0, -0.4, 0, sh2);
  }
  const { map: rm, missing: rmiss } = guessBoneMap(arm);
  check('Rigify spine chain reads as pelvis→head',
    rm.Hips?.name === 'DEF-spine' && rm.Head?.name === 'DEF-spine.006' &&
    rm.Neck?.name === 'DEF-spine.004' && rm.Chest?.name === 'DEF-spine.003');
  check('sided pelvis helpers are not the pelvis; twists lose to real bones',
    rm.UpArmL?.name === 'DEF-upper_arm.L' && !rmiss.length,
    rmiss.join(' '));
  const moved = rerigHierarchy(arm, rm);
  const chain = (n, out = []) => { for (let a = n.parent; a; a = a.parent) out.push(a.name); return out; };
  check('rerig gives flat limbs a real hierarchy (world preserved)',
    moved >= 8 &&
    chain(rm.ThighL).includes('DEF-spine') &&
    chain(rm.UpArmL).includes('DEF-shoulder.L') &&
    chain(rm.UpArmL).includes('DEF-spine.003'),
    `moved=${moved}`);
  arm.updateMatrixWorld(true);
  const hipY0 = new THREE.Vector3().setFromMatrixPosition(rm.ThighL.matrixWorld).y;
  check('rerig kept world positions intact', Math.abs(hipY0 - 0.9) < 1e-6, `y=${hipY0}`);
  // the payoff: dropping the hips now drops the legs with them
  rm.Hips.position.y -= 0.5;
  arm.updateMatrixWorld(true);
  const hipY1 = new THREE.Vector3().setFromMatrixPosition(rm.ThighL.matrixWorld).y;
  check('a crouch carries the flat-rigged legs down', Math.abs(hipY1 - 0.4) < 1e-6, `y=${hipY1}`);
}

// ---- 4d: TWIST — does the elbow bend in the right plane? -------------------
// Matching only the bone DIRECTION leaves the rotation about the limb free,
// and a model whose rest elbow bends out of the game's plane then flicks its
// forearm sideways the moment a clip bends it. The roll reference pins it.
// The bend-plane normal after retargeting must match the drive rig's, for a
// rest pose deliberately built 40 degrees out of plane.
{
  const t3 = makeMixamoRig(1);
  const m3 = guessBoneMap(t3).map;
  const w3 = new THREE.Group();
  w3.scale.setScalar(s);
  w3.add(t3);
  t3.position.y -= box.min.y;
  model.group.add(w3);
  const rt3 = new Retargeter(model, srcRest, w3, m3);
  const planeOf = (a, b, c, get) =>
    new THREE.Vector3().crossVectors(dir(get(a), get(b)), dir(get(b), get(c))).normalize();
  let worstPlane = 1;
  for (const clip of ['block', 'punch3', 'hitHeavy', 'getup']) {
    player.play(clip, { fade: 0, restart: true });
    for (let i = 0; i < 12; i++) player.update(1 / 60);
    rt3.apply();
    for (const side of ['L', 'R']) {
      const src = planeOf('UpArm' + side, 'LoArm' + side, 'Hand' + side, srcJointWorld);
      const dst = planeOf('UpArm' + side, 'LoArm' + side, 'Hand' + side,
        n => worldPos(model.group, m3[n]));
      if (src.lengthSq() > 0.5 && dst.lengthSq() > 0.5) worstPlane = Math.min(worstPlane, src.dot(dst));
    }
  }
  check('elbows bend in the drive rig\'s plane, not the model\'s', worstPlane > 0.99,
    `worst normal dot=${worstPlane.toFixed(4)}`);
  model.group.remove(w3);
}

// ---- 4e: pivot fixes are portable and non-destructive ----------------------
// A correction is stored as an offset in the model's own axes as a FRACTION
// OF ITS HEIGHT, so the same numbers land in the same anatomical place on a
// re-exported or decimated version of the model. Two properties matter: the
// pivot lands where asked, and nothing downstream moves — children keep their
// world transforms, and the inverse-bind is rebuilt so the rest mesh is
// unchanged (skinMatrix = M · boneInverse must be invariant).
{
  const rig = makeMixamoRig();
  const map = guessBoneMap(rig).map;
  rerigHierarchy(rig, map);
  rig.updateMatrixWorld(true);
  // a stand-in skeleton so the inverse-bind path is exercised
  const bones = Object.values(map);
  const skel = new THREE.Skeleton(bones);
  const sk = { bones, boneInverses: skel.boneInverses, needsUpdate: false };
  const before = bones.map((b, i) =>
    new THREE.Matrix4().multiplyMatrices(b.matrixWorld, sk.boneInverses[i]).clone());

  const H = modelBindHeight(rig);                 // this rig's own bind height
  const shoulder = map.UpArmL;
  const elbowBefore = new THREE.Vector3().setFromMatrixPosition(map.LoArmL.matrixWorld);
  const shoulderBefore = new THREE.Vector3().setFromMatrixPosition(shoulder.matrixWorld);
  applyJointEdits(rig, { [shoulder.name]: [0, 0.03, 0] }, [sk], H);
  rig.updateMatrixWorld(true);

  const moved = new THREE.Vector3().setFromMatrixPosition(shoulder.matrixWorld).sub(shoulderBefore);
  check('a normalized pivot offset lands where asked',
    Math.abs(moved.y - 0.03 * H) < 1e-6 && Math.hypot(moved.x, moved.z) < 1e-6,
    `moved ${moved.y.toFixed(4)} of ${(0.03 * H).toFixed(4)}`);
  const elbowAfter = new THREE.Vector3().setFromMatrixPosition(map.LoArmL.matrixWorld);
  check('children keep their world position when a pivot moves',
    elbowAfter.distanceTo(elbowBefore) < 1e-6);
  let worstSkin = 0;
  for (let i = 0; i < bones.length; i++) {
    const now = new THREE.Matrix4().multiplyMatrices(bones[i].matrixWorld, sk.boneInverses[i]);
    for (let k = 0; k < 16; k++) worstSkin = Math.max(worstSkin, Math.abs(now.elements[k] - before[i].elements[k]));
  }
  check('the rest mesh is untouched (skin matrices invariant)', worstSkin < 1e-6,
    `max drift ${worstSkin.toExponential(1)}`);
  // portability: the same numbers on a model exported at a different scale
  const rig2 = makeMixamoRig();
  const map2 = guessBoneMap(rig2).map;
  rerigHierarchy(rig2, map2);
  rig2.scale.setScalar(100);                       // "re-exported in centimetres"
  rig2.updateMatrixWorld(true);
  const sk2 = { bones: Object.values(map2), boneInverses: new THREE.Skeleton(Object.values(map2)).boneInverses };
  const sBefore2 = new THREE.Vector3().setFromMatrixPosition(map2.UpArmL.matrixWorld);
  // no height passed: it is measured in the root's own axes, which is the
  // whole point — the scaled export must not double-count its own transform
  applyJointEdits(rig2, { [map2.UpArmL.name]: [0, 0.03, 0] }, [sk2]);
  rig2.updateMatrixWorld(true);
  const moved2 = new THREE.Vector3().setFromMatrixPosition(map2.UpArmL.matrixWorld).sub(sBefore2);
  check('the same fix survives a re-export at a different scale',
    Math.abs(moved2.y / 100 - 0.03 * H) < 1e-4,
    `${(moved2.y / 100).toFixed(4)} vs ${(0.03 * H).toFixed(4)}`);
}

// ---- 4f: dual-quaternion skinning ------------------------------------------
// DQS blends the bones' ROTATIONS instead of their matrices, which is what
// stops a bent elbow pinching. The GLSL itself can only run on a GPU, so what
// is checked here is the two things that can go wrong off it: the PREMISE
// (blending rotations is only valid if every skin matrix is rigid up to a
// uniform scale — a shear or a squash would be silently discarded), and the
// PLUMBING (the patch reaches the material, chains whatever was already there,
// injects all three chunks, and comes back off cleanly).
{
  const bones = Object.values(map);
  const skel = new THREE.Skeleton(bones);
  let worstOrtho = 0, worstScale = 0;
  for (const clip of ['idle', 'punch1', 'launched']) {
    if (!player.clips.has(clip)) continue;
    player.play(clip, { fade: 0, restart: true });
    for (let i = 0; i < 40; i++) {
      player.update(1 / 60);
      rt.apply();
      for (let b = 0; b < bones.length; b++) {
        const m = new THREE.Matrix4().multiplyMatrices(bones[b].matrixWorld, skel.boneInverses[b]);
        const e = m.elements;
        const col = k => new THREE.Vector3(e[k * 4], e[k * 4 + 1], e[k * 4 + 2]);
        const [x, y, z] = [col(0), col(1), col(2)];
        const len = [x.length(), y.length(), z.length()];
        worstOrtho = Math.max(worstOrtho,
          Math.abs(x.dot(y)) / (len[0] * len[1]),
          Math.abs(x.dot(z)) / (len[0] * len[2]),
          Math.abs(y.dot(z)) / (len[1] * len[2]));
        worstScale = Math.max(worstScale,
          Math.abs(len[0] - len[1]), Math.abs(len[0] - len[2]));
      }
    }
  }
  check('skin matrices stay rigid, so rotation blending is lossless',
    worstOrtho < 1e-5 && worstScale < 1e-5,
    `shear ${worstOrtho.toExponential(1)}, scale spread ${worstScale.toExponential(1)}`);

  // plumbing, on a stand-in skinned mesh
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
  const mat = new THREE.MeshStandardMaterial();
  let baseRan = 0;
  mat.onBeforeCompile = () => { baseRan++; };
  const mesh = new THREE.SkinnedMesh(geom, mat);
  mesh.bind(skel);
  const holder = new THREE.Group(); holder.add(mesh);

  const compile = () => {
    const shader = {
      vertexShader: '#include <common>\n#include <skinnormal_vertex>\n#include <skinning_vertex>\n',
    };
    mat.onBeforeCompile(shader, null);
    return shader.vertexShader;
  };
  const keyBefore = mat.customProgramCacheKey?.();

  const n = setDualQuaternionSkinning(holder, true);
  const patched = compile();
  check('the patch reaches every skinned material', n === 1);
  check('all three shader chunks are replaced',
    patched.includes('dqsQuat') && patched.includes('dqsBR') && patched.includes('dqsPoint')
    && !patched.includes('#include <skinning_vertex>')
    && !patched.includes('#include <skinnormal_vertex>'));
  check('an existing onBeforeCompile still runs', baseRan === 1);
  check('re-applying is a no-op, not a double patch',
    setDualQuaternionSkinning(holder, true) === 1
    && (compile().match(/vec4 dqsQuat\(/g) || []).length === 1);
  check('patched and unpatched need different program cache keys',
    mat.customProgramCacheKey() !== keyBefore);

  setDualQuaternionSkinning(holder, false);
  const reverted = compile();
  check('turning it off restores the stock chunks',
    reverted.includes('#include <skinning_vertex>') && !reverted.includes('dqsQuat'));
}

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
