// WORKBENCH — SHARED RIG MACHINERY for the two model benches
// ===========================================================================
// `?edit=models` (pose + skinning QA) and `?edit=rig` (mapping review +
// feedback export) are two arrangements of the same operations: load a rigged
// model, map its bones to the game's canonical skeleton, stand it into a
// bind pose, drive it through real game clips via the real retargeter, and
// export whatever was changed as a manifest-entry JSON. All of that lives
// here so the two benches cannot drift from each other — or from the game,
// because everything below the UI is the SHIPPED pipeline: the same
// guessBoneMap, the same fitInto, the same Retargeter that ?render3d runs.
// ===========================================================================
import * as THREE from 'three';
import { guessBoneMap, collectBoneNodes } from '../art/rig3d/bonemap.js';
import { Retargeter, captureSourceRest, rerigHierarchy } from '../art/rig3d/retarget.js';
import {
  loadScene, applyRestPose, fitInto, modelsUrl, meshStats, TRI_BUDGET
} from '../art/rig3d/render3d.js';
import {
  analyzeJoints, applyJointEdits, collectSkeletons, moveBonePivot, worldToLocalPos,
  mirrorPairs, modelBindHeight
} from '../art/rig3d/joints.js';
import { liftMaterials, LIFT_DEFAULTS } from '../art/rig3d/lift.js';
import { setDualQuaternionSkinning } from '../art/rig3d/dqs.js';
import { GripSolver } from '../art/rig3d/grip.js';
import {
  applyWeightOps, meshIslands, restPositions, islandBones, anchorFrame
} from '../art/rig3d/weights.js';
import { makeCharacter } from '../characters/index.js';
import { AnimPlayer } from '../art/anim/player.js';
import { DEG } from '../core/mathutil.js';

export const CANONICAL = [
  'Hips', 'Spine', 'Chest', 'Neck', 'Head',
  'ClavL', 'UpArmL', 'LoArmL', 'HandL',
  'ClavR', 'UpArmR', 'LoArmR', 'HandR',
  'ThighL', 'ShinL', 'FootL', 'ThighR', 'ShinR', 'FootR'
];
// the ones a humanoid cannot do without — a missing Clav degrades, a missing
// Thigh does not
export const CORE = new Set([
  'Hips', 'Chest', 'Neck', 'Head', 'UpArmL', 'LoArmL', 'HandL',
  'UpArmR', 'LoArmR', 'HandR', 'ThighL', 'ShinL', 'FootL', 'ThighR', 'ShinR', 'FootR'
]);
const REF_CHILD = {
  Hips: 'Spine', Spine: 'Chest', Chest: 'Neck', Neck: 'Head',
  ClavL: 'UpArmL', UpArmL: 'LoArmL', LoArmL: 'HandL',
  ClavR: 'UpArmR', UpArmR: 'LoArmR', LoArmR: 'HandR',
  ThighL: 'ShinL', ShinL: 'FootL', ThighR: 'ShinR', ShinR: 'FootR'
};

// ---------------------------------------------------------------- stage ----
// The same minimal turntable scene the viewer uses: key/rim/hemi, a pedestal
// grid, drag-orbit + wheel-zoom, driven by whoever mounts it.
export function createStage(canvasHost) {
  const canvas = document.createElement('canvas');
  canvas.className = 'mb-canvas';
  canvasHost.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14161f);
  scene.fog = new THREE.Fog(0x14161f, 10, 34);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  // `tx`/`tz` move what the camera LOOKS AT. The two older benches never
  // needed it — a whole body centred on the origin is the shot — but a bench
  // that asks "point at the left elbow" has to be able to put the left elbow
  // in the middle of the screen and fill the frame with it.
  const cam = { yaw: 0.5, pitch: 0.14, dist: 4.4, height: 1.0, tx: 0, tz: 0 };

  const key = new THREE.DirectionalLight(0xfff0dc, 2.4); key.position.set(4, 7, 5);
  const rim = new THREE.DirectionalLight(0x86b4ff, 1.6); rim.position.set(-5, 6, -6);
  const hemi = new THREE.HemisphereLight(0x8ca0cc, 0x4a4038, 0.7);
  scene.add(key, rim, hemi);
  const grid = new THREE.GridHelper(8, 16, 0x39406a, 0x232741);
  grid.position.y = 0.001;
  scene.add(grid);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(24, 32),
    new THREE.MeshStandardMaterial({ color: 0x12141d, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ORBIT, PINCH, PAN — one pointer set, so the same code serves a mouse and a
  // phone. Every pointer that went down on the canvas is tracked: one is an
  // orbit, two are a pinch-zoom plus a pan of the look-at point. That second
  // gesture is not a luxury on a touch bench — without it a small screen can
  // orbit around a joint but never get close enough to point at it.
  const pts = new Map();
  let px = 0, py = 0, moved = 0, pinch = 0, multi = false;
  const mid = () => {
    let x = 0, y = 0;
    for (const p of pts.values()) { x += p.x; y += p.y; }
    return { x: x / pts.size, y: y / pts.size };
  };
  const spread = () => {
    const a = [...pts.values()];
    return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
  };
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture?.(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { moved = 0; multi = false; }
    else multi = true;
    const m = mid(); px = m.x; py = m.y; pinch = spread();
  });
  const release = e => {
    if (!pts.delete(e.pointerId)) return;
    if (pts.size) { const m = mid(); px = m.x; py = m.y; pinch = spread(); }
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const m = mid(), dx = m.x - px, dy = m.y - py;
    moved += Math.abs(dx) + Math.abs(dy);
    if (pts.size >= 2) {
      const d = spread();
      if (pinch > 4 && d > 4) cam.dist = Math.max(0.25, Math.min(20, cam.dist * (pinch / d)));
      pinch = d;
      // two fingers also PAN: screen-right in world at this yaw, and plain up
      const k = cam.dist * 0.0022;
      cam.tx -= Math.cos(cam.yaw) * dx * k;
      cam.tz += Math.sin(cam.yaw) * dx * k;
      cam.height = Math.max(0, Math.min(4, cam.height + dy * k));
    } else {
      cam.yaw -= dx * 0.008;
      cam.pitch = Math.max(-0.5, Math.min(1.25, cam.pitch + dy * 0.005));
    }
    px = m.x; py = m.y;
  });
  canvas.addEventListener('wheel', e => {
    cam.dist = Math.max(0.25, Math.min(20, cam.dist + e.deltaY * 0.005));
  }, { passive: true });

  function resize() {
    const r = canvasHost.getBoundingClientRect();
    const w = Math.max(2, r.width), h = Math.max(2, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  const stage = {
    renderer, scene, camera, canvas, cam, resize,
    // true when the pointer went down and came back up without orbiting —
    // the click-to-pick path uses it to ignore drag-ends. A finger is less
    // steady than a mouse, so the slop is wider than it would need to be for
    // a cursor, and a two-finger gesture is never a pick.
    wasClick: () => moved < 10 && !multi,
    /** Put a world point in the middle of the frame. */
    frameOn(v, dist) {
      cam.tx = v.x; cam.tz = v.z; cam.height = v.y;
      if (dist != null) cam.dist = Math.max(0.25, Math.min(20, dist));
    },
    /** Named angles, so a bench can ask for "the left side" without maths. */
    orbit(yaw, pitch = 0.06) { cam.yaw = yaw; cam.pitch = pitch; },
    onFrame: null,
    dispose() { stage.dead = true; removeEventListener('resize', resize); renderer.dispose(); }
  };
  let last = performance.now();
  function frame(now) {
    if (stage.dead) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    stage.onFrame?.(dt);
    camera.position.set(
      cam.tx + Math.sin(cam.yaw) * cam.dist * Math.cos(cam.pitch),
      cam.height + Math.sin(cam.pitch) * cam.dist,
      cam.tz + Math.cos(cam.yaw) * cam.dist * Math.cos(cam.pitch));
    camera.lookAt(cam.tx, cam.height, cam.tz);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(resize);
  requestAnimationFrame(frame);
  return stage;
}

// ------------------------------------------------------------ stress poses --
// THE RIG-VERIFICATION SET. Clips show whether a rig ANIMATES; these show
// whether it is BUILT right, because each one drives a single joint group to
// the extreme where a misplaced pivot stops being subtle:
//
//   arms out / up   a shoulder pivot that sits low shears the deltoid and
//                   the sleeve collapses into the chest — invisible at rest,
//                   unmissable overhead
//   arms forward    finds a shoulder placed too far back or front
//   elbows          a forearm pivot off the elbow pinches the sleeve
//   squat           hip and knee pivots, the two the trousers hide
//   twist / head    spine and neck pivots, where a low chest bone folds the
//                   torso at the stomach instead of the ribcage
export const STRESS_POSES = {
  'arms out': { UpArmL: [0, 0, 78], UpArmR: [0, 0, -78], LoArmL: [0, 0, 0], LoArmR: [0, 0, 0] },
  'arms up': { UpArmL: [0, 0, 155], UpArmR: [0, 0, -155], LoArmL: [0, 0, 0], LoArmR: [0, 0, 0] },
  'arms fwd': { UpArmL: [-88, 0, 12], UpArmR: [-88, 0, -12], LoArmL: [0, 0, 0], LoArmR: [0, 0, 0] },
  elbows: { UpArmL: [0, 0, 78], LoArmL: [-100, 0, 0], UpArmR: [0, 0, -78], LoArmR: [-100, 0, 0] },
  squat: {
    ThighL: [-95, -4, 0], ShinL: [110, 0, 0], FootL: [-20, -8, 0],
    ThighR: [-95, 4, 0], ShinR: [110, 0, 0], FootR: [-20, 8, 0],
    Spine: [18, 0, 0], _hips: [0, -0.38, 0]
  },
  twist: { Spine: [0, 38, 0], Chest: [0, 38, 0], Neck: [0, -20, 0], Head: [0, -25, 0] },
  'head turn': { Neck: [0, 52, 0], Head: [-12, 26, 0] }
};

// -------------------------------------------------------- reference poses --
// THE TWO STANCES A RIG IS JUDGED IN. A stress pose asks "does this joint
// survive an extreme?"; a reference pose asks the flatter question first —
// IS THIS RIG WORTH SHIPPING AT ALL? Both put the body somewhere every
// deviation is legible against a straight line, which is what makes them the
// standard: limbs straight, weight even, nothing foreshortened, and the two
// sides mirror images. Anything bent, twisted, short or lopsided here is the
// rig, because the pose contains nothing that could excuse it.
//
// They are DRIVEN, not authored: the drive rig is set to its own bind (its
// bones rest at identity, so that is one line) and the arms are then AIMED
// along a world direction, computed from each rig's own rest limb. That
// matters — the game's bind has the arms 13° off vertical, so a hardcoded
// Euler would be a different pose on a different body, and these have to be
// the same pose on every one.
//
// Not to be confused with `autoPose`, one section down: that STANDS THE MODEL
// UP, editing its stored rest pose so a file authored in some arbitrary pose
// can be measured. This poses the rig that drives it and stores nothing.
export const REFERENCE_POSES = {
  // world direction for the LEFT arm's segments; the right mirrors in x
  'A-pose': { arms: [0.7, -0.71, 0] },
  'T-pose': { arms: [1, 0, 0] }
};

// -------------------------------------------------------------- landmarks --
// WHAT THE RETARGETER ACTUALLY NEEDS FROM A HUMAN.
//
// Everything the alignment does is derived from WHERE THE JOINTS ARE: a
// bone's rest direction is (this joint -> the next joint down), and that
// direction is what gets matched onto the game's. So if a bone sits in the
// wrong place inside the mesh, its rest direction is wrong, the alignment
// built from it is wrong, and the limb points somewhere the clip never asked
// for — which is exactly the "arms out looks bent and hunched" failure.
//
// Skin weights can measure this (see joints.js) but only up to the shape of
// the costume: the band between two bones is a hoodie as much as it is a
// shoulder. A person looking at the model does not have that problem. So the
// bench asks for the one thing a person is unambiguously better at — POINT AT
// THE JOINT — and everything else is derived:
//
//   landmark -> bone pivot -> rest direction -> alignment -> every clip
//
// Each entry names the canonical bone it fixes, so a marked landmark is
// directly actionable rather than a note in a bug report. `hint` is written
// to be answerable without anatomy training, and always describes the
// INTERIOR joint centre rather than the surface bump above it.
export const LANDMARKS = [
  { key: 'hips', bone: 'Hips', label: 'Pelvis centre',
    hint: 'Inside the body, level with the top of the hip bones — the point the whole body pivots around when he leans.' },
  { key: 'waist', bone: 'Spine', label: 'Waist',
    hint: 'The narrowest part of the waist, roughly the navel. This is where the torso is meant to BEND.' },
  { key: 'chest', bone: 'Chest', label: 'Chest / ribcage',
    hint: 'The middle of the ribcage, level with the armpits — not the collarbone.' },
  { key: 'neckBase', bone: 'Neck', label: 'Neck base',
    hint: 'Where the neck meets the shoulders — the notch at the top of the breastbone, in the middle.' },
  { key: 'headCentre', bone: 'Head', label: 'Head centre',
    hint: 'The middle of the SKULL, roughly between the ears. Ignore the hair entirely.' },
  { key: 'shoulderL', bone: 'UpArmL', label: 'Shoulder · left', side: 'L',
    hint: 'The ball joint INSIDE the shoulder where the arm swings from — not the top of the shoulder, and not the sleeve seam.' },
  { key: 'shoulderR', bone: 'UpArmR', label: 'Shoulder · right', side: 'R',
    hint: 'Same on the other side. Getting these two right matters more than anything else in this list.' },
  { key: 'elbowL', bone: 'LoArmL', label: 'Elbow · left', side: 'L',
    hint: 'The centre of the elbow joint, inside the arm.' },
  { key: 'elbowR', bone: 'LoArmR', label: 'Elbow · right', side: 'R', hint: 'The centre of the elbow joint, inside the arm.' },
  { key: 'wristL', bone: 'HandL', label: 'Wrist · left', side: 'L',
    hint: 'Where the hand pivots on the forearm, in the middle of the wrist.' },
  { key: 'wristR', bone: 'HandR', label: 'Wrist · right', side: 'R',
    hint: 'Where the hand pivots on the forearm, in the middle of the wrist.' },
  { key: 'hipL', bone: 'ThighL', label: 'Hip joint · left', side: 'L',
    hint: 'The top of the thigh bone, INSIDE the hip — well below the waist and inboard of the outer hip.' },
  { key: 'hipR', bone: 'ThighR', label: 'Hip joint · right', side: 'R',
    hint: 'The top of the thigh bone, inside the hip.' },
  { key: 'kneeL', bone: 'ShinL', label: 'Knee · left', side: 'L', hint: 'The centre of the knee joint, inside the leg.' },
  { key: 'kneeR', bone: 'ShinR', label: 'Knee · right', side: 'R', hint: 'The centre of the knee joint, inside the leg.' },
  { key: 'ankleL', bone: 'FootL', label: 'Ankle · left', side: 'L',
    hint: 'The centre of the ankle joint, above the heel — not the bottom of the shoe.' },
  { key: 'ankleR', bone: 'FootR', label: 'Ankle · right', side: 'R',
    hint: 'The centre of the ankle joint, above the heel.' }
];

// -------------------------------------------------------------- session ----
// One loaded model + one reference character, and every operation the two
// benches perform on the pair.
//
// EDITS ARE DATA, NOT STATE. Nothing mutates the model in place and hopes:
// the loaded model is snapshotted as a BASELINE, and every change the user
// makes is recorded in one of two plain maps — `jointEdits` (pivot positions)
// and `poseEdits` (local rotations). Any change replays the whole stack from
// the baseline in the SAME ORDER render3d.js uses at load:
//
//     baseline -> joints -> pose -> fit
//
// which is what guarantees an exported manifest entry reproduces exactly what
// the bench showed. It is also why previewing can no longer leave residue:
// the retargeter writes hips POSITIONS as well as rotations, and the old
// snapshot only carried rotations, so every preview left the hips a little
// lower than it found them and the model sank into the floor a step at a
// time. Restoring from the baseline cannot drift.
export class RigSession {
  constructor(stage) {
    this.stage = stage;
    this.wrapper = null;       // normalized parent of the model
    this.model3d = null;       // the loaded scene
    this.nodes = [];           // candidate bone nodes
    this.byName = new Map();
    this.skeletons = [];
    this.map = {};             // canonical -> node
    this.mapReport = '';
    this.overrides = {};       // canonical -> nodeName|null (user picks)
    this.rotOffset = {};       // canonical -> [x,y,z] degrees (retarget trim)
    this.jointEdits = {};      // nodeName -> [dx,dy,dz] offset in model axes,
                               // as a fraction of the model's height — see
                               // art/rig3d/joints.js on why it is stored that
                               // way rather than as a position
    this.poseEdits = {};       // nodeName -> [x,y,z] local euler degrees
    this.weightOps = [];       // island repairs — see art/rig3d/weights.js
    this.pickedIsland = null;  // {verts, bones, at} under the last click
    this.landmarks = {};       // key -> [Vector3, …] samples, in MODEL space
    this.armedLandmark = null; // the key the next click in the view sets
    this.fit = { scale: 1, yOffset: 0, faceYaw: 0 };
    this.baseline = null;      // {trs: Map, inverses: Map}
    this.sourceUrl = '';
    this.sourceLabel = '';
    this.stats = null;         // {tris, verts, meshes} of the loaded file
    this.fitReport = '';

    this.ref = null;           // {model, clips, player, rest, pick}
    this.retargeter = null;
    this.preview = false;
    this.stress = null;
    // WEAPONS ON THE IMPORTED BODY. The reference character's props hang off
    // the DRIVE rig and are drawn with the ghost; a clone of each rides the
    // imported bones so the model can be judged the way it will be seen —
    // which for a character whose battle stance is built around a weapon is
    // the only way to judge it at all. Bind poses show none of it: T-pose,
    // A-pose and "as loaded" are about the rig, and a staff through the
    // frame only gets in the way.
    this.propClones = [];              // {name, node, from}
    this.showProps = true;
    // `keepProps: false` from the manifest entry — a model whose weapon is
    // modelled into its own mesh (Nobara's hammer) must not also carry the
    // procedural one, on the bench any more than in the game.
    this.keepProps = true;
    this.gripEdits = {};               // prop name -> authored grip spec
    this.grips = null;                 // GripSolver over the clones

    this.dqs = true;           // dual-quaternion skinning (see dqs.js)
    this.lift = null;          // ambient-lift handle
    this.liftOpts = { ...LIFT_DEFAULTS };
    this.liftOn = true;

    this.skeletonHelper = null;
    this.markers = null;
    this.selected = null;
    this.weightsOn = false;
    this._origMats = new Map();
    this._raycaster = new THREE.Raycaster();

    stage.onFrame = dt => this._tick(dt);
  }

  // ---- reference character ------------------------------------------------
  setReference(pick) {
    if (this.ref?.model) this.stage.scene.remove(this.ref.model.group);
    const { model, clips } = makeCharacter(pick);
    const rest = captureSourceRest(model);
    const player = new AnimPlayer(model.bones, clips);
    model.group.position.x = -1.05;
    this.stage.scene.add(model.group);
    this.ref = { model, clips, player, rest, pick };
    this.setGhost(this.ghostOn ?? true);
    player.play('idle', { fade: 0, restart: true });
    if (this.model3d) this.rebuild();
    else this._rebuildRetarget();
    return [...clips.keys()];
  }

  setGhost(on) {
    this.ghostOn = on;
    if (this.ref) this.ref.model.group.visible = on;
  }

  // ---- model loading ------------------------------------------------------
  async load(url, label) {
    this.unload();
    const scene = await loadScene(url);
    this.sourceUrl = url;
    this.sourceLabel = label || url.split('/').pop();
    this.model3d = scene;
    scene.traverse(o => { if (o.isMesh || o.isSkinnedMesh) o.frustumCulled = false; });
    this.byName = new Map();
    scene.traverse(o => { if (o.name && !this.byName.has(o.name)) this.byName.set(o.name, o); });
    // normalize the hierarchy off the auto-map BEFORE the baseline is taken —
    // the same first step ?render3d runs, so bench edits replay exactly
    rerigHierarchy(scene, guessBoneMap(scene, this.overrides).map);
    this.nodes = collectBoneNodes(scene);
    this.skeletons = collectSkeletons(scene);
    this.baseline = {
      trs: new Map(),
      inverses: this.skeletons.map(sk => sk.boneInverses.map(m => m.clone())),
      // skin attributes too: a weight op rewrites them in place, and an edit
      // stack that cannot be replayed from a clean state is not an edit stack
      skins: []
    };
    scene.traverse(o => {
      if (!o.isSkinnedMesh) return;
      const g = o.geometry;
      const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
      if (si && sw) this.baseline.skins.push({ g, si: si.array.slice(), sw: sw.array.slice() });
    });
    scene.traverse(o => this.baseline.trs.set(o, {
      p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone()
    }));
    this.wrapper = new THREE.Group();
    this.wrapper.name = 'render3d-bench';
    this.wrapper.add(scene);
    this.stage.scene.add(this.wrapper);
    // the model's own bind height, in its own axes: the unit every pivot fix
    // is expressed in, so a fix survives the model being re-exported
    this.modelHeight = modelBindHeight(scene);
    this.remap();
    // model-space rest position of every joint, for the symmetry pass
    const toModel = new THREE.Matrix4().copy(scene.matrixWorld).invert();
    this.baseModelPos = new Map(this.nodes.map(n =>
      [n, new THREE.Vector3().setFromMatrixPosition(n.matrixWorld).applyMatrix4(toModel)]));
    this.stats = meshStats(scene);
    this.setLift(this.liftOn);          // applies setDqs as its last step
    this.setSkeleton(true);
    return this.mapReport;
  }

  // Load a manifest entry's committed fixes into the edit stack — the exact
  // inverse of exportJson(), so a model opened from the manifest is benched
  // in the state ?render3d actually gives it rather than raw off the file.
  // Without this the bench silently disagrees with the game about any model
  // that needed a fix to ship.
  applyEntry(entry) {
    if (!entry || !this.model3d) return;
    this.overrides = { ...(entry.boneMap || {}) };
    this.jointEdits = { ...(entry.joints || {}) };
    // skin repairs travel with the entry as well, or the bench shows a body
    // the game has already fixed — which is exactly how Nobara's dress looked
    // repaired in play and still glued to her arm here
    this.weightOps = Array.isArray(entry.weights) ? entry.weights.map(o => ({ ...o })) : [];
    this._islandCache = null;
    this.poseEdits = { ...(entry.pose || {}) };
    this.gripEdits = { ...(entry.grips || {}) };
    this.keepProps = entry.keepProps !== false;
    this.rotOffset = Object.fromEntries(
      Object.entries(entry.rotOffset || {}).map(([k, v]) => [k, [...v]]));
    this.fit = {
      scale: entry.scale ?? 1, yOffset: entry.yOffset ?? 0, faceYaw: entry.faceYaw ?? 0
    };
    this.dqs = entry.skinning !== 'linear';
    this.liftOn = entry.lift !== false;
    this.liftOpts = { ...LIFT_DEFAULTS, ...(typeof entry.lift === 'object' ? entry.lift : {}) };
    this.setLift(this.liftOn, this.liftOpts);
    this.remap();
  }

  unload() {
    this.stopPreview();
    this.showWeights(false);
    this.setSkeleton(false);
    this.lift?.restore();
    this.lift = null;
    if (this.wrapper) this.stage.scene.remove(this.wrapper);
    this.detachProps();
    this.keepProps = true;
    this.wrapper = this.model3d = this.baseline = null;
    this.stats = null;
    this.map = {}; this.overrides = {}; this.rotOffset = {};
    this.jointEdits = {}; this.poseEdits = {};
    this.landmarks = {}; this.armedLandmark = null;
    this.weightOps = []; this.pickedIsland = null; this._islandCache = null;
    if (this.lmGroup) { this.stage.scene.remove(this.lmGroup); this.lmGroup = null; }
    this.selected = null;
    this.retargeter = null;
    this.suggestions = null;
  }

  // ---- the edit stack -----------------------------------------------------
  _restoreBaseline() {
    if (!this.baseline) return;
    for (const [o, t] of this.baseline.trs) {
      o.position.copy(t.p); o.quaternion.copy(t.q); o.scale.copy(t.s);
    }
    this.skeletons.forEach((sk, i) => {
      sk.boneInverses.forEach((m, j) => m.copy(this.baseline.inverses[i][j]));
      sk.needsUpdate = true;
    });
    for (const s of this.baseline.skins) {
      const si = s.g.getAttribute('skinIndex'), sw = s.g.getAttribute('skinWeight');
      si.array.set(s.si); sw.array.set(s.sw);
      si.needsUpdate = sw.needsUpdate = true;
    }
    this.model3d.updateMatrixWorld(true);
  }

  // baseline -> joints -> pose -> fit, exactly as render3d.js loads it
  rebuild() {
    if (!this.model3d) return;
    this._restoreBaseline();
    applyJointEdits(this.model3d, this.jointEdits, this.skeletons, this.modelHeight);
    applyWeightOps(this.model3d, this.weightOps, this.map);
    applyRestPose(this.model3d, this.poseEdits);
    this.refit();
    this._rebuildRetarget();
    if (this.weightsOn) this.showWeights(true);
  }

  refit() {
    if (!this.model3d) return;
    const s = fitInto(this.wrapper, this.model3d, this.ref?.model.H ?? 1.8, this.fit);
    this.fitReport = `×${s.toExponential(2)} → ${(this.ref?.model.H ?? 1.8).toFixed(2)} m`;
    this._refreshMarkers();
  }

  // ---- mapping ------------------------------------------------------------
  remap() {
    if (!this.model3d) return;
    const r = guessBoneMap(this.model3d, this.overrides);
    this.map = r.map;
    this.mapReport = r.report;
    this.rebuild();
    return r;
  }

  assign(canonical, nodeName) {
    this.overrides[canonical] = nodeName;   // null drops the bone
    return this.remap();
  }

  // ---- pose ---------------------------------------------------------------
  restoreLoadedPose() { this.poseEdits = {}; this.rebuild(); }

  getNodeEuler(node) {
    const e = new THREE.Euler().setFromQuaternion(node.quaternion, 'XYZ');
    return [e.x / DEG, e.y / DEG, e.z / DEG];
  }
  setNodeEuler(node, deg) {
    this.poseEdits[node.name] = deg.map(v => Math.round(v * 100) / 100);
    this.rebuild();
  }

  // Auto-pose: rotate each mapped bone so its (bone -> canonical child)
  // direction matches a target set, top-down so parents settle before
  // children aim. 'T' is the classic T-pose; 'A' is the game's own bind, read
  // live off the reference character — the pose the retargeter aligns
  // cleanest from. The result is harvested into `poseEdits` so it replays.
  autoPose(kind) {
    if (!this.model3d) return;
    this.stopPreview();
    this.poseEdits = {};
    this.rebuild();
    const dirs = kind === 'T' ? tPoseDirs() : this._gameBindDirs();
    if (!dirs) return;
    const wq = new THREE.Quaternion(), pq = new THREE.Quaternion();
    const cur = new THREE.Vector3(), from = new THREE.Vector3();
    for (const name of CANONICAL) {
      const node = this.map[name], childName = REF_CHILD[name];
      const child = childName && this.map[childName];
      const d = dirs[name];
      if (!node || !child || !d) continue;
      this.wrapper.updateMatrixWorld(true);
      cur.setFromMatrixPosition(child.matrixWorld);
      from.setFromMatrixPosition(node.matrixWorld);
      cur.sub(from);
      if (cur.lengthSq() < 1e-12) continue;
      const arc = new THREE.Quaternion().setFromUnitVectors(cur.normalize(), d.clone().normalize());
      node.getWorldQuaternion(wq);
      node.parent.getWorldQuaternion(pq);
      node.quaternion.copy(pq.invert().multiply(arc.multiply(wq)));
      node.updateWorldMatrix(false, true);
      this.poseEdits[node.name] = this.getNodeEuler(node).map(v => Math.round(v * 100) / 100);
    }
    this.rebuild();
  }

  _gameBindDirs() {
    if (!this.ref) return null;
    const out = {};
    for (const [name, childName] of Object.entries(REF_CHILD)) {
      const a = this.ref.rest.get(name), b = this.ref.rest.get(childName);
      if (a && b) out[name] = b.worldPos.clone().sub(a.worldPos).normalize();
    }
    return out;
  }

  // ---- joint pivots -------------------------------------------------------
  // What the skin says, versus what the bones say. See art/rig3d/joints.js.
  analyze() {
    if (!this.model3d) return null;
    this.stopPreview();
    this.rebuild();
    const r = analyzeJoints(this.model3d, this.map);
    this.suggestions = new Map(r.rows.filter(x => x.want).map(x => [x.canon, x]));
    this.analysis = r;
    return r;
  }

  // Move a pivot toward the weight-derived joint. `strength` 0..1 — the
  // estimate is a measurement of a costume as much as of a body, so it is
  // offered as a pull rather than a jump.
  snapJoint(canonical, strength = 1) {
    const s = this.suggestions?.get(canonical);
    const node = this.map[canonical];
    if (!s || !node) return false;
    const world = new THREE.Vector3().fromArray(s.at)
      .addScaledVector(new THREE.Vector3().fromArray(s.delta), strength);
    this._setJointWorld(canonical, world);
    return true;
  }

  // A world-space target becomes a normalized offset from the model's own
  // rest — the portable form, so the fix survives a re-export of the model.
  _setJointWorld(canonical, world) {
    const node = this.map[canonical];
    if (!node || !this.baseModelPos?.has(node)) return;
    this.model3d.updateMatrixWorld(true);
    const target = world.clone().applyMatrix4(
      new THREE.Matrix4().copy(this.model3d.matrixWorld).invert());
    this.jointEdits[node.name] = target.sub(this.baseModelPos.get(node))
      .divideScalar(this.modelHeight || 1)
      .toArray().map(v => Math.round(v * 1e6) / 1e6);
    this.rebuild();
  }

  // Nudge in WORLD metres — what a slider in the panel means. The model is
  // fitted to the character's height, so a normalized offset of 1 is exactly
  // H metres on screen; the two conversions are that one number.
  nudgeJoint(canonical, deltaWorld) {
    const node = this.map[canonical];
    if (!node || !this.wrapper) return;
    this.wrapper.updateMatrixWorld(true);
    const world = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld)
      .add(new THREE.Vector3().fromArray(deltaWorld));
    this._setJointWorld(canonical, world);
  }

  // the current pivot offset in world metres, for the panel's dials
  jointOffsetOf(canonical) {
    const node = this.map[canonical];
    const cur = node && this.jointEdits[node.name];
    if (!cur) return [0, 0, 0];
    const H = this.ref?.model.H ?? 1.8;
    return new THREE.Vector3().fromArray(cur).multiplyScalar(H)
      .applyQuaternion(this.wrapper.quaternion).toArray();
  }

  // SYMMETRY, APPLIED TO THE CORRECTIONS RATHER THAN TO THE BONES.
  //
  // The obvious version — mirror each pivot's absolute position about the
  // mid-plane — is wrong for any model whose bind pose is not itself
  // symmetric, and Yuji's is not: he ships mid-stride with one leg forward,
  // so forcing his hips and knees to mirror each other tears the stance
  // apart. What SHOULD be symmetric is the fix: if the left shoulder needs
  // lifting 4 cm, so does the right. Since a correction is already stored as
  // an offset in the model's own axes, that is just averaging the pair with x
  // negated across it.
  mirrorJoints() {
    let n = 0;
    for (const [l, r] of mirrorPairs(this.map)) {
      const nl = this.map[l], nr = this.map[r];
      const ol = this.jointEdits[nl.name] ?? [0, 0, 0];
      const or = this.jointEdits[nr.name] ?? [0, 0, 0];
      const avg = [(ol[0] - or[0]) / 2, (ol[1] + or[1]) / 2, (ol[2] + or[2]) / 2];
      if (!avg.some(v => Math.abs(v) > 1e-9)) continue;
      this.jointEdits[nl.name] = avg.map(v => Math.round(v * 1e6) / 1e6);
      this.jointEdits[nr.name] = [-avg[0], avg[1], avg[2]].map(v => Math.round(v * 1e6) / 1e6);
      n++;
    }
    this.rebuild();
    return n;
  }

  resetJoints() { this.jointEdits = {}; this.rebuild(); }

  // ---- retarget preview ---------------------------------------------------
  _rebuildRetarget() {
    this.retargeter = null;
    if (!this.model3d || !this.ref || !this.map.Hips) return;
    try {
      this.retargeter = new Retargeter(
        this.ref.model, this.ref.rest, this.wrapper, this.map,
        { rotOffset: this.rotOffset });
    } catch (e) { console.warn('[bench] retargeter rebuild failed', e); }
  }

  startPreview(clip) {
    if (!this.model3d || !this.ref) return false;
    this.stress = null;
    this.rebuild();                    // always drive from a clean rest
    if (!this.retargeter) { this.preview = false; return false; }
    this.preview = true;
    if (clip) this.ref.player.play(clip, { fade: 0.12, restart: true });
    this.ref.model.gripClip = clip || null;
    this.attachProps();
    return true;
  }

  // A stress pose is the same path with the clip player switched off and the
  // reference skeleton posed by hand.
  startStress(name) {
    const pose = STRESS_POSES[name];
    if (!pose || !this.model3d || !this.ref) return false;
    this.rebuild();
    if (!this.retargeter) return false;
    const { player, model } = this.ref;
    player.play('idle', { fade: 0, restart: true });
    player.update(0.001);
    player.current = null;             // stop the clip driving the rig
    for (const [bone, e] of Object.entries(pose)) {
      if (bone === '_hips') continue;
      const b = model.bones.get(bone);
      if (b) b.quaternion.setFromEuler(new THREE.Euler(e[0] * DEG, e[1] * DEG, e[2] * DEG, 'XYZ'));
    }
    const hips = model.bones.get('Hips');
    if (hips && pose._hips) {
      const bind = this.ref.rest.get('Hips').localPos;
      hips.position.set(bind.x + pose._hips[0], bind.y + pose._hips[1], bind.z + pose._hips[2]);
    }
    this.preview = true;
    this.stress = name;
    this.ref.model.gripClip = null;
    this.retargeter.apply();
    this.attachProps();
    return true;
  }

  // A reference stance (see REFERENCE_POSES): zero the drive rig back to its
  // own bind, then aim each arm segment along a world direction. Aiming rather
  // than setting an angle is what makes the two sides genuinely mirrored and
  // the pose the same on every body.
  startReference(name) {
    const spec = REFERENCE_POSES[name];
    if (!spec || !this.model3d || !this.ref) return false;
    this.rebuild();
    if (!this.retargeter) return false;
    const { player, model, rest } = this.ref;
    player.play('idle', { fade: 0, restart: true });
    player.update(0.001);
    player.current = null;
    // the drive rig's bones rest at identity, so this IS its bind pose:
    // spine upright, legs straight, feet under the hips
    for (const b of model.boneList) b.quaternion.identity();
    const hips = model.bones.get('Hips');
    if (hips) hips.position.copy(rest.get('Hips').localPos);

    // rotation accumulated from the root down to (and excluding) this bone —
    // with identity rest rotations that product is the bone's world rotation
    const chainQ = bone => {
      const q = new THREE.Quaternion();
      for (let b = bone; b && rest.has(b.name); b = b.parent) q.premultiply(b.quaternion);
      return q;
    };
    const aim = (name2, childName, dir) => {
      const a = rest.get(name2), c = rest.get(childName);
      const bone = model.bones.get(name2);
      if (!a || !c || !bone) return;
      const bind = c.worldPos.clone().sub(a.worldPos);
      if (bind.lengthSq() < 1e-12) return;
      const parentQ = chainQ(bone.parent);
      const now = bind.normalize().applyQuaternion(parentQ);
      const arc = new THREE.Quaternion().setFromUnitVectors(now, dir);
      // world = arc · parent  and  world = parent · local  ⟹  local = parent⁻¹ · arc · parent
      bone.quaternion.copy(parentQ.clone().invert().multiply(arc).multiply(parentQ));
    };
    for (const side of ['L', 'R']) {
      const m = side === 'L' ? 1 : -1;
      const dir = new THREE.Vector3(spec.arms[0] * m, spec.arms[1], spec.arms[2]).normalize();
      aim('UpArm' + side, 'LoArm' + side, dir);      // parent first: the
      aim('LoArm' + side, 'Hand' + side, dir);       // forearm inherits it
    }
    this.preview = true;
    this.stress = name;
    this.ref.model.gripClip = null;
    this.retargeter.apply();
    this.attachProps();
    return true;
  }

  // THE NUMBER A REFERENCE POSE EXISTS TO PRODUCE.
  //
  // A T-pose or A-pose is mirror-symmetric by construction — the drive rig is
  // symmetric and both arms are aimed at mirrored directions — so whatever
  // asymmetry comes out the far end is the rig or the bind, not the pose. That
  // is the one defect the eye is worst at: a shoulder pivot 4 cm lower on one
  // side reads as "he looks a bit off" and nothing more.
  //
  // So: mirror the posed mesh in x about its own centre and measure how far
  // each mirrored point lands from the real surface. Reported as a percentage
  // of body height, which makes it comparable across models. Under about 1% is
  // a symmetric character; a few percent is a rig worth looking at; the number
  // is only meaningful in a reference pose.
  poseSymmetry(sample = 4000) {
    if (!this.model3d) return null;
    let mesh = null;
    this.model3d.traverse(o => {
      if (o.isSkinnedMesh && o.geometry?.getAttribute('skinIndex') && !mesh) mesh = o;
    });
    if (!mesh) return null;
    // the retargeter has written quaternions but nothing has rendered yet, so
    // the world matrices restPositions skins from are a frame stale
    this.wrapper?.updateMatrixWorld(true);
    const P = restPositions(mesh);
    const n = P.length / 3;
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) box.expandByPoint(v.set(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]));
    const size = box.getSize(new THREE.Vector3());
    const h = Math.max(1e-6, size.y);
    const midX = (box.min.x + box.max.x) / 2;
    // uniform grid over every vertex, so the mirrored samples have something
    // to be near; one cell per 1% of height keeps the buckets small
    const cell = h * 0.01;
    const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    const grid = new Map();
    for (let i = 0; i < n; i++) {
      const k = key(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
      const b = grid.get(k);
      if (b) b.push(i); else grid.set(k, [i]);
    }
    const step = Math.max(1, Math.floor(n / sample));
    const errs = [];
    for (let i = 0; i < n; i += step) {
      const x = 2 * midX - P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
      let best = Infinity;
      // widen the search until something is found; 3 rings is 6% of height,
      // past which the mirrored point has no counterpart worth reporting
      for (let r = 1; r <= 3 && best === Infinity; r++) {
        for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) {
          if (r > 1 && Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) < r) continue;
          const bucket = grid.get(`${cx + a},${cy + b},${cz + c}`);
          if (!bucket) continue;
          for (const j of bucket) {
            const d = (P[j * 3] - x) ** 2 + (P[j * 3 + 1] - y) ** 2 + (P[j * 3 + 2] - z) ** 2;
            if (d < best) best = d;
          }
        }
      }
      if (best < Infinity) errs.push(Math.sqrt(best) / h);
    }
    if (!errs.length) return null;
    errs.sort((a, b) => a - b);
    const at = f => errs[Math.min(errs.length - 1, Math.floor(f * errs.length))];
    return { median: at(0.5), p90: at(0.9), worst: errs.at(-1), samples: errs.length };
  }

  // ---- weapons on the imported body ---------------------------------------
  // The same move render3d.js makes on the real thing (adoptAttachments), on
  // a CLONE instead of the original: the ghost keeps its own weapon, so the
  // two bodies can be compared holding the same thing. The transform is the
  // adoption identity — the retargeter drives importedWorld = srcWorld ∘
  // align, so a node sitting at `v` from the drive bone belongs at align⁻¹·v
  // from the imported one, with the wrapper's metres-to-model-units scale
  // undone.
  attachProps() {
    this.detachProps();
    if (!this.showProps || !this.keepProps) return 0;
    if (!this.ref || !this.retargeter || !this.wrapper) return 0;
    const s = this.wrapper.scale.x || 1;
    for (const [name, p] of this.ref.model.props ?? []) {
      const node = p.node;
      const bone = node?.parent;
      if (!node?.visible || !bone?.isBone) continue;
      const target = this.map[bone.name];
      const align = this.retargeter.alignOf(bone.name);
      if (!target || !align) continue;
      const clone = node.clone(true);
      const inv = align.clone().invert();
      clone.position.copy(node.position).applyQuaternion(inv).divideScalar(s);
      clone.quaternion.copy(node.quaternion).premultiply(inv);
      clone.scale.copy(node.scale).divideScalar(s);
      target.add(clone);
      this.propClones.push({ name, node: clone, from: node });
    }
    // the solver measures its target off the CLONE, not the original — the
    // original is on the ghost, in a different place on a different body
    const byName = new Map(this.propClones.map(c => [c.name, c.node]));
    this.grips = this.propClones.length
      ? new GripSolver(this.ref.model, this.map, this.gripEdits,
        { nodeOf: n => byName.get(n) ?? null })
      : null;
    return this.propClones.length;
  }

  detachProps() {
    for (const c of this.propClones) c.node.parent?.remove(c.node);
    this.propClones.length = 0;
    this.grips = null;
  }

  setShowProps(on) {
    this.showProps = !!on;
    if (this.preview) this.attachProps(); else this.detachProps();
  }

  // Author the off-hand grip by clicking the weapon: the world point comes
  // back from the surface pick, and what is stored is that point in the
  // PROP'S own space, which is what makes it portable to an imported weapon
  // standing in the same place.
  setGripFromWorld(name, worldPoint, extra = {}) {
    const c = this.propClones.find(x => x.name === name);
    if (!c || !worldPoint) return null;
    c.node.updateMatrixWorld(true);
    const local = c.node.worldToLocal(worldPoint.clone());
    const at = local.toArray().map(v => +v.toFixed(4));
    this.gripEdits[name] = { bone: 'HandL', ...(this.gripEdits[name] || {}), ...extra, at };
    this.grips?.refresh();
    return at;
  }

  clearGrip(name) {
    delete this.gripEdits[name];
    this.grips?.refresh();
  }

  // the first surface hit on the WEAPONS, for grip picking
  pickPropPoint(event) {
    const meshes = [];
    for (const c of this.propClones) c.node.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
    if (!meshes.length) return null;
    const r = this.stage.canvas.getBoundingClientRect();
    this._raycaster.setFromCamera(new THREE.Vector2(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1), this.stage.camera);
    const hit = this._raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    for (const c of this.propClones) {
      let inside = false;
      c.node.traverse(o => { if (o === hit.object) inside = true; });
      if (inside) return { name: c.name, point: hit.point };
    }
    return null;
  }

  stopPreview() {
    if (!this.preview) return;
    this.detachProps();
    this.preview = false;
    this.stress = null;
    this.ref?.player.play('idle', { fade: 0, restart: true });
    this.rebuild();
  }

  setRotOffset(canonical, deg) {
    if (deg && deg.some(v => Math.abs(v) > 0.01)) this.rotOffset[canonical] = deg;
    else delete this.rotOffset[canonical];
    const was = this.preview, st = this.stress;
    this._rebuildRetarget();
    if (was && st) this.startStress(st);
  }

  _tick(dt) {
    if (this.preview && this.ref && this.retargeter) {
      if (!this.stress) {
        this.ref.player.update(dt);
        this.ref.model.update(dt);
      }
      this.retargeter.apply();
      if (this.grips?.active) {
        // the grip target hangs off a bone the retargeter has just moved
        this.wrapper.updateMatrixWorld(true);
        this.grips.apply();
      }
    }
    this._tickMarkers();
  }

  // ---- display ------------------------------------------------------------
  setLift(on, opts) {
    this.liftOn = on;
    if (opts) Object.assign(this.liftOpts, opts);
    if (!this.model3d) return;
    // intensity and grade are live; only toggling needs the material swap
    if (this.lift && on) { this.lift.set(this.liftOpts); return; }
    this.lift?.restore();
    this.lift = null;
    if (on) this.lift = liftMaterials(this.model3d, this.liftOpts);
    this.setDqs(this.dqs);      // the lift swapped the materials the patch was on
    if (this.weightsOn) this.showWeights(true);
  }

  setDqs(on) {
    this.dqs = on;
    if (this.model3d) setDualQuaternionSkinning(this.model3d, on);
  }

  setSkeleton(on) {
    if (this.skeletonHelper) { this.stage.scene.remove(this.skeletonHelper); this.skeletonHelper = null; }
    if (this.markers) { this.stage.scene.remove(this.markers); this.markers = null; }
    if (!on || !this.wrapper) return;
    this.skeletonHelper = new THREE.SkeletonHelper(this.wrapper);
    this.skeletonHelper.material.depthTest = false;
    this.stage.scene.add(this.skeletonHelper);
    this.markers = new THREE.Group();
    this.markers.renderOrder = 10;
    const geo = new THREE.SphereGeometry(0.016, 8, 6);
    for (const node of this.nodes) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ depthTest: false, transparent: true }));
      m.userData.node = node;
      this.markers.add(m);
    }
    this.stage.scene.add(this.markers);
    this._refreshMarkers();
  }

  _refreshMarkers() {
    if (!this.markers) return;
    const mapped = new Map();
    for (const [c, n] of Object.entries(this.map)) mapped.set(n, c);
    for (const m of this.markers.children) {
      const c = mapped.get(m.userData.node);
      const sel = c && c === this.selected;
      const moved = this.jointEdits[m.userData.node.name];
      m.material.color.set(sel ? 0xffd86b : moved ? 0x7fb0ff : c ? 0x7fd0a0 : 0x3a4260);
      m.material.opacity = sel ? 1 : c ? 0.9 : 0.45;
      m.scale.setScalar(sel ? 2.2 : c ? 1.3 : 1);
    }
  }

  _tickMarkers() {
    if (this.lmGroup && Object.keys(this.landmarks).length) this._refreshLandmarks();
    if (!this.markers || !this.wrapper) return;
    this.wrapper.updateMatrixWorld(true);
    for (const m of this.markers.children) {
      m.position.setFromMatrixPosition(m.userData.node.matrixWorld);
    }
  }

  select(canonical) {
    this.selected = canonical;
    this._refreshMarkers();
    if (this.weightsOn) this.showWeights(true);
  }

  pickAt(event) {
    if (!this.markers) return null;
    const r = this.stage.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1);
    this._raycaster.setFromCamera(p, this.stage.camera);
    const hits = this._raycaster.intersectObjects(this.markers.children, false);
    return hits[0]?.object.userData.node ?? null;
  }

  setWireframe(on) {
    this.model3d?.traverse(o => {
      if (o.material) for (const m of [].concat(o.material)) m.wireframe = on;
    });
  }

  // Skin-weight heatmap for the selected canonical bone: every SkinnedMesh is
  // recoloured by how much the bone owns each vertex (black -> red -> yellow).
  // The most direct way to catch a thigh painted onto a coat hem.
  showWeights(on) {
    this.weightsOn = on;
    const node = on && this.selected ? this.map[this.selected] : null;
    this.model3d?.traverse(o => {
      if (!o.isSkinnedMesh) return;
      if (!on) {
        const orig = this._origMats.get(o);
        if (orig) { o.material = orig; this._origMats.delete(o); }
        return;
      }
      if (!this._origMats.has(o)) this._origMats.set(o, o.material);
      const idx = node ? o.skeleton.bones.indexOf(node) : -1;
      const g = o.geometry;
      const n = g.getAttribute('position').count;
      const si = g.getAttribute('skinIndex'), sw = g.getAttribute('skinWeight');
      let colors = g.getAttribute('color');
      if (!colors || colors.itemSize !== 3 || colors.count !== n || !g.userData.benchColors) {
        colors = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
        g.setAttribute('color', colors);
        g.userData.benchColors = true;
      }
      for (let i = 0; i < n; i++) {
        let w = 0;
        if (idx >= 0 && si && sw) {
          for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === idx) w += sw.getComponent(i, k);
        }
        colors.setXYZ(i, 0.09 + 0.91 * Math.min(1, w * 1.6),
          0.09 + 0.91 * Math.max(0, w - 0.5) * 2, 0.11);
      }
      colors.needsUpdate = true;
      o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    });
    if (on) setDualQuaternionSkinning(this.model3d, this.dqs);
  }

  // ---- landmarks ----------------------------------------------------------
  // A click in the view, turned into a point INSIDE the body: the ray is cast
  // through a temporarily double-sided mesh and the entry and exit points are
  // averaged, so clicking the outside of an arm lands in the middle of it
  // rather than on its skin. Sampling the same landmark from two opposite
  // sides averages out whatever that leaves.
  pickSurface(event, maxDepth = 0.35) {
    if (!this.model3d) return null;
    const meshes = [];
    this.model3d.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && o.visible) meshes.push(o); });
    if (!meshes.length) return null;
    const sides = meshes.map(m => [].concat(m.material).map(x => x.side));
    meshes.forEach(m => [].concat(m.material).forEach(x => { x.side = THREE.DoubleSide; }));
    const r = this.stage.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1);
    this._raycaster.setFromCamera(p, this.stage.camera);
    const hits = this._raycaster.intersectObjects(meshes, false);
    meshes.forEach((m, i) => [].concat(m.material).forEach((x, j) => { x.side = sides[i][j]; }));
    if (!hits.length) return null;
    const first = hits[0];
    let last = first;
    for (const h of hits) if (h.distance - first.distance <= maxDepth) last = h;
    return first.point.clone().lerp(last.point, 0.5);
  }

  // stored in MODEL space, so a landmark survives refitting and rescaling
  addLandmarkSample(key, world) {
    if (!this.model3d || !world) return;
    this.model3d.updateMatrixWorld(true);
    const local = world.clone().applyMatrix4(
      new THREE.Matrix4().copy(this.model3d.matrixWorld).invert());
    (this.landmarks[key] ??= []).push(local);
    this._refreshLandmarks();
  }
  clearLandmark(key) { delete this.landmarks[key]; this._refreshLandmarks(); }
  clearLandmarks() { this.landmarks = {}; this._refreshLandmarks(); }

  landmarkModel(key) {
    const s = this.landmarks[key];
    if (!s?.length) return null;
    return s.reduce((a, v) => a.add(v), new THREE.Vector3()).multiplyScalar(1 / s.length);
  }
  landmarkWorld(key) {
    const m = this.landmarkModel(key);
    if (!m || !this.model3d) return null;
    this.model3d.updateMatrixWorld(true);
    return m.applyMatrix4(this.model3d.matrixWorld);
  }

  // THE FIX, in one press: every marked landmark becomes its bone's pivot.
  // Because the alignment is derived from bone positions, correcting the
  // positions corrects every clip at once.
  applyLandmarksToPivots() {
    let n = 0;
    for (const def of LANDMARKS) {
      const w = this.landmarkWorld(def.key);
      if (!w || !this.map[def.bone]) continue;
      this._setJointWorld(def.bone, w);
      n++;
    }
    return n;
  }

  // Is the bone we mapped even the right bone? For each landmark, the nearest
  // skin joint is the model's own answer, and where it disagrees with the map
  // that is a mapping bug rather than a placement one.
  suggestFromLandmarks() {
    const out = [];
    if (!this.model3d) return out;
    this.wrapper.updateMatrixWorld(true);
    for (const def of LANDMARKS) {
      const w = this.landmarkWorld(def.key);
      if (!w) continue;
      let best = null, bestD = Infinity;
      for (const n of this.nodes) {
        const d = w.distanceTo(new THREE.Vector3().setFromMatrixPosition(n.matrixWorld));
        if (d < bestD) { bestD = d; best = n; }
      }
      const cur = this.map[def.bone];
      const curD = cur ? w.distanceTo(
        new THREE.Vector3().setFromMatrixPosition(cur.matrixWorld)) : null;
      out.push({
        key: def.key, bone: def.bone,
        current: cur?.name ?? null, currentCm: curD == null ? null : +(curD * 100).toFixed(1),
        nearest: best?.name ?? null, nearestCm: +(bestD * 100).toFixed(1),
        agrees: !!cur && best === cur
      });
    }
    return out;
  }

  _refreshLandmarks() {
    // marks live in the model's REST frame, so during a pose they would sit
    // where the body no longer is — hide them rather than mislead
    if (this.lmGroup) this.lmGroup.visible = !this.preview;
    if (!this.lmGroup) {
      this.lmGroup = new THREE.Group();
      this.lmGroup.renderOrder = 12;
      this.stage.scene.add(this.lmGroup);
    }
    for (const c of [...this.lmGroup.children]) this.lmGroup.remove(c);
    const geo = new THREE.SphereGeometry(0.022, 10, 8);
    for (const def of LANDMARKS) {
      const w = this.landmarkWorld(def.key);
      if (!w) continue;
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: def.key === this.armedLandmark ? 0xffd86b : 0xff5fc8, depthTest: false
      }));
      m.position.copy(w);
      this.lmGroup.add(m);
      // a line to where the bone currently sits: the error, drawn
      const bone = this.map[def.bone];
      if (!bone) continue;
      const bp = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      const g = new THREE.BufferGeometry().setFromPoints([w, bp]);
      this.lmGroup.add(new THREE.Line(g, new THREE.LineBasicMaterial({
        color: 0xff5fc8, depthTest: false, transparent: true, opacity: 0.6
      })));
    }
  }

  // ---- skin repairs -------------------------------------------------------
  // Click the model, get the piece of geometry under the cursor and what
  // drives it. The unit is the index-buffer island — deliberately NOT the
  // welded surface the `bleed` rule works on, because on a model whose props
  // are modelled into the body (Nobara's hammer is welded to her hand) the
  // whole character welds into one piece and there is nothing left to point
  // at. Charts follow UV seams, which mostly follow the parts a person means
  // by "this bit".
  pickIsland(event) {
    const world = this.pickSurfaceFront(event);
    if (!world || !this.model3d) return null;
    this._islandCache ??= (() => {
      const out = [];
      this.model3d.traverse(m => {
        if (m.isSkinnedMesh && m.geometry?.getAttribute('skinIndex')) {
          const P = restPositions(m);
          out.push({ mesh: m, P, ...meshIslands(m), ...anchorFrame(P) });
        }
      });
      return out;
    })();
    let best = null, bestD = Infinity;
    for (const c of this._islandCache) {
      for (let i = 0; i < c.P.length / 3; i++) {
        const d = (c.P[i * 3] - world.x) ** 2 + (c.P[i * 3 + 1] - world.y) ** 2 +
          (c.P[i * 3 + 2] - world.z) ** 2;
        if (d < bestD) { bestD = d; best = { c, i }; }
      }
    }
    if (!best) return null;
    const verts = best.c.islands[best.c.labels[best.i]];
    const { box, h } = best.c;
    const p = best.i * 3;
    this.pickedIsland = {
      verts: verts.length,
      bones: islandBones(best.c.mesh, verts),
      at: [(best.c.P[p] - box.min.x) / h, (best.c.P[p + 1] - box.min.y) / h,
        (best.c.P[p + 2] - box.min.z) / h].map(x => +x.toFixed(4))
    };
    return this.pickedIsland;
  }

  // the FIRST surface hit, not the interior midpoint the landmarks want
  pickSurfaceFront(event) {
    if (!this.model3d) return null;
    const meshes = [];
    this.model3d.traverse(o => { if (o.isSkinnedMesh && o.visible) meshes.push(o); });
    const r = this.stage.canvas.getBoundingClientRect();
    this._raycaster.setFromCamera(new THREE.Vector2(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1), this.stage.camera);
    return this._raycaster.intersectObjects(meshes, false)[0]?.point ?? null;
  }

  addWeightOp(op) {
    if (!op?.at) return;
    this.weightOps.push(op);
    this._islandCache = null;
    this.rebuild();
  }
  clearWeightOps() { this.weightOps = []; this._islandCache = null; this.rebuild(); }

  // ---- export -------------------------------------------------------------
  exportJson(bench, notes) {
    // every number below describes the REST pose — measuring a landmark
    // against a bone that is currently mid-clip would report the pose as
    // error. The panel stops preview before exporting; this makes it true
    // however the method is reached.
    this.stopPreview();
    const boneMap = {};
    for (const [c, n] of Object.entries(this.overrides)) boneMap[c] = n;
    const entry = {
      _workbench: {
        bench, model: this.sourceLabel, exported: new Date().toISOString(),
        reference: this.ref?.pick ?? null,
        mapping: this.mapReport,
        map: Object.fromEntries(Object.entries(this.map).map(([c, n]) => [c, n.name])),
        jointOffsetsCm: Object.fromEntries([...CANONICAL]
          .filter(c => this.map[c] && this.jointEdits[this.map[c].name])
          .map(c => [c, this.jointOffsetOf(c).map(v => Math.round(v * 1000) / 10)])),
        notes: notes || '',
        // WHAT THE USER POINTED AT. Model-space so it is independent of the
        // fit, plus the error against the bone that is currently mapped and
        // the model's own nearest joint — which between them say whether a
        // bone is misplaced, mis-mapped, or fine.
        landmarks: Object.fromEntries(LANDMARKS
          .filter(d => this.landmarkModel(d.key))
          .map(d => {
            const w = this.landmarkWorld(d.key);
            const bone = this.map[d.bone];
            const bp = bone && new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
            const k = 100;   // centimetres, at the fitted scale
            return [d.key, {
              bone: d.bone, node: bone?.name ?? null,
              model: this.landmarkModel(d.key).toArray().map(v => +v.toFixed(6)),
              // portable: a fraction of the model's own height, so the mark
              // still means the same thing on a re-exported version of it
              norm: this.landmarkModel(d.key).divideScalar(this.modelHeight || 1)
                .toArray().map(v => +v.toFixed(5)),
              samples: this.landmarks[d.key].length,
              errorCm: bp ? w.clone().sub(bp).toArray().map(v => +(v * k).toFixed(1)) : null,
              distCm: bp ? +(w.distanceTo(bp) * k).toFixed(1) : null
            }];
          })),
        landmarkMapping: this.suggestFromLandmarks().filter(r => !r.agrees)
      },
      url: './' + this.sourceLabel
    };
    if (this.fit.scale !== 1) entry.scale = this.fit.scale;
    if (this.fit.yOffset) entry.yOffset = this.fit.yOffset;
    if (this.fit.faceYaw) entry.faceYaw = this.fit.faceYaw;
    if (Object.keys(boneMap).length) entry.boneMap = boneMap;
    if (Object.keys(this.jointEdits).length) entry.joints = this.jointEdits;
    if (this.weightOps.length) entry.weights = this.weightOps;
    if (Object.keys(this.poseEdits).length) entry.pose = this.poseEdits;
    if (Object.keys(this.gripEdits).length) entry.grips = this.gripEdits;
    if (Object.keys(this.rotOffset).length) {
      entry.rotOffset = Object.fromEntries(
        Object.entries(this.rotOffset).map(([k, v]) => [k, v.map(x => Math.round(x * 100) / 100)]));
    }
    if (!this.dqs) entry.skinning = 'linear';
    if (!this.liftOn) entry.lift = false;
    else {
      const diff = {};
      for (const [k, v] of Object.entries(this.liftOpts)) {
        if (JSON.stringify(v) !== JSON.stringify(LIFT_DEFAULTS[k])) diff[k] = v;
      }
      if (Object.keys(diff).length) entry.lift = diff;
    }
    return entry;
  }
}

function tPoseDirs() {
  const up = new THREE.Vector3(0, 1, 0), down = new THREE.Vector3(0, -1, 0);
  const out = { Hips: up, Spine: up, Chest: up, Neck: up };
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const side = new THREE.Vector3(m, 0, 0);
    out['Clav' + s] = side; out['UpArm' + s] = side; out['LoArm' + s] = side;
    out['Thigh' + s] = down; out['Shin' + s] = down;
    out['Foot' + s] = new THREE.Vector3(0, -0.3, 1).normalize();
  }
  return out;
}

// ---------------------------------------------------------------- UI kit ---
// Tiny DOM helpers + the model-loader block, shared so the two benches offer
// the identical three doors: manifest entry, URL, local file (pick or drop —
// nothing has to be committed anywhere to be benched).
export const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
export const sec = (panel, title) => {
  const s = el('div', 'mb-sec', `<div class="mb-sec-head">${title}</div>`);
  panel.append(s);
  return s;
};

export function buildLoaderUI(session, { prefs, save, onLoaded, onReference }) {
  const box = el('div');
  box.append(el('div', 'mb-hint',
    'Drop a .glb/.gltf anywhere on this page, pick a file, or paste a URL. ' +
    'Manifest entries in <b>public/models/</b> are listed when present.'));
  const rowFile = el('div', 'mb-row');
  const fileBtn = el('button', 'mb-btn', '<span>Open file…</span>');
  const fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = '.glb,.gltf,.vrm';
  fileInput.style.display = 'none';
  const urlInput = el('input', 'mb-input'); urlInput.type = 'text';
  urlInput.placeholder = 'URL or models/ filename…'; urlInput.value = prefs.url || '';
  const urlBtn = el('button', 'mb-btn', '<span>Load</span>');
  rowFile.append(fileBtn, urlInput, urlBtn, fileInput);
  const manifestRow = el('div', 'mb-row');
  const status = el('div', 'mb-status', 'No model loaded — the reference body stands alone.');
  box.append(rowFile, manifestRow, status);

  // `entry` is set only for the manifest chips: the character the entry is
  // keyed to becomes the reference (the fit is measured against its H, so it
  // has to be in place BEFORE the load), and the entry's committed fixes are
  // replayed onto the model after it.
  async function loadFrom(url, label, { pick, entry } = {}) {
    status.textContent = 'Loading ' + (label || url) + '…';
    status.classList.remove('err');
    try {
      if (pick) onReference?.(pick);
      const report = await session.load(url, label);
      if (entry) session.applyEntry(entry);
      const t = session.stats?.tris ?? 0;
      status.className = 'mb-status' + (t > TRI_BUDGET ? ' warn' : '');
      status.textContent = `${session.sourceLabel} — ${report}, ${(t / 1000).toFixed(0)}k tris` +
        (t > TRI_BUDGET ? ` — past ${TRI_BUDGET / 1000}k, this looks un-decimated` : '');
      onLoaded?.();
    } catch (e) {
      status.textContent = 'Failed: ' + (e?.message ?? e);
      status.className = 'mb-status err';
    }
  }
  fileBtn.onclick = () => fileInput.click();
  fileInput.onchange = () => {
    const f = fileInput.files[0];
    if (f) loadFrom(URL.createObjectURL(f), f.name);
  };
  urlBtn.onclick = () => {
    let u = urlInput.value.trim();
    if (!u) return;
    if (!/^(https?:|blob:|\/)/.test(u)) u = modelsUrl(u.replace(/^models\//, ''));   // bare filename -> public/models/
    prefs.url = urlInput.value.trim(); save?.(prefs);
    loadFrom(u);
  };
  addEventListener('dragover', e => e.preventDefault());
  addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) loadFrom(URL.createObjectURL(f), f.name);
  });
  fetch(modelsUrl('manifest.json')).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(m => {
    for (const [k, v] of Object.entries(m)) {
      const url = typeof v === 'string' ? v : v?.url;
      if (!url) continue;
      const entry = typeof v === 'string' ? { url: v } : v;
      const b = el('button', 'mb-chip', k);
      b.title = `${url.split('/').pop()} — loaded as the game loads it, for ${k.split(':')[0]}`;
      b.onclick = () => loadFrom(
        new URL(url, modelsUrl('manifest.json')).href, url.split('/').pop(),
        { pick: k, entry });
      manifestRow.append(b);
    }
  });
  return { box, status, loadFrom };
}

export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
