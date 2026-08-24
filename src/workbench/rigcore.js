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
  analyzeJoints, applyJointEdits, collectSkeletons, moveBonePivot, worldToLocalPos, mirrorPairs
} from '../art/rig3d/joints.js';
import { liftMaterials, LIFT_DEFAULTS } from '../art/rig3d/lift.js';
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
  const cam = { yaw: 0.5, pitch: 0.14, dist: 4.4, height: 1.0 };

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

  let dragging = false, px = 0, py = 0, moved = 0;
  canvas.addEventListener('pointerdown', e => { dragging = true; moved = 0; px = e.clientX; py = e.clientY; });
  addEventListener('pointerup', () => { dragging = false; });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
    cam.yaw -= (e.clientX - px) * 0.008;
    cam.pitch = Math.max(-0.5, Math.min(1.25, cam.pitch + (e.clientY - py) * 0.005));
    px = e.clientX; py = e.clientY;
  });
  canvas.addEventListener('wheel', e => {
    cam.dist = Math.max(1.0, Math.min(20, cam.dist + e.deltaY * 0.005));
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
    // the click-to-pick path uses it to ignore drag-ends
    wasClick: () => moved < 6,
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
      Math.sin(cam.yaw) * cam.dist * Math.cos(cam.pitch),
      cam.height + Math.sin(cam.pitch) * cam.dist,
      Math.cos(cam.yaw) * cam.dist * Math.cos(cam.pitch));
    camera.lookAt(0, cam.height, 0);
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
    this.jointEdits = {};      // nodeName -> [x,y,z] local pivot position
    this.poseEdits = {};       // nodeName -> [x,y,z] local euler degrees
    this.fit = { scale: 1, yOffset: 0, faceYaw: 0 };
    this.baseline = null;      // {trs: Map, inverses: Map}
    this.sourceUrl = '';
    this.sourceLabel = '';
    this.fitReport = '';

    this.ref = null;           // {model, clips, player, rest, pick}
    this.retargeter = null;
    this.preview = false;
    this.stress = null;

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
      inverses: this.skeletons.map(sk => sk.boneInverses.map(m => m.clone()))
    };
    scene.traverse(o => this.baseline.trs.set(o, {
      p: o.position.clone(), q: o.quaternion.clone(), s: o.scale.clone()
    }));
    this.wrapper = new THREE.Group();
    this.wrapper.name = 'render3d-bench';
    this.wrapper.add(scene);
    this.stage.scene.add(this.wrapper);
    this.remap();
    // model-space rest position of every joint, for the symmetry pass
    const toModel = new THREE.Matrix4().copy(scene.matrixWorld).invert();
    this.baseModelPos = new Map(this.nodes.map(n =>
      [n, new THREE.Vector3().setFromMatrixPosition(n.matrixWorld).applyMatrix4(toModel)]));
    this.setLift(this.liftOn);
    this.setSkeleton(true);
    return this.mapReport;
  }

  unload() {
    this.stopPreview();
    this.showWeights(false);
    this.setSkeleton(false);
    this.lift?.restore();
    this.lift = null;
    if (this.wrapper) this.stage.scene.remove(this.wrapper);
    this.wrapper = this.model3d = this.baseline = null;
    this.map = {}; this.overrides = {}; this.rotOffset = {};
    this.jointEdits = {}; this.poseEdits = {};
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
    this.model3d.updateMatrixWorld(true);
  }

  // baseline -> joints -> pose -> fit, exactly as render3d.js loads it
  rebuild() {
    if (!this.model3d) return;
    this._restoreBaseline();
    applyJointEdits(this.model3d, this.jointEdits, this.skeletons);
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

  _setJointWorld(canonical, world) {
    const node = this.map[canonical];
    if (!node) return;
    this.jointEdits[node.name] = worldToLocalPos(node, world).toArray()
      .map(v => Math.round(v * 1e6) / 1e6);
    this.rebuild();
  }

  // Nudge in WORLD metres — what a slider in the panel means.
  nudgeJoint(canonical, deltaWorld) {
    const node = this.map[canonical];
    if (!node || !this.wrapper) return;
    this.wrapper.updateMatrixWorld(true);
    // the wrapper scales the model to the character's height, so a metre of
    // slider has to come back through that scale to be a metre on screen
    const k = 1 / (this.wrapper.scale.x || 1);
    const world = new THREE.Vector3().setFromMatrixPosition(node.matrixWorld)
      .add(new THREE.Vector3().fromArray(deltaWorld).multiplyScalar(k));
    this._setJointWorld(canonical, world);
  }

  jointOffsetOf(canonical) {
    const node = this.map[canonical];
    if (!node || !this.baseline) return [0, 0, 0];
    const base = this.baseline.trs.get(node);
    const cur = this.jointEdits[node.name];
    if (!base || !cur) return [0, 0, 0];
    const k = this.wrapper?.scale.x ?? 1;
    return [(cur[0] - base.p.x) * k, (cur[1] - base.p.y) * k, (cur[2] - base.p.z) * k];
  }

  // SYMMETRY, APPLIED TO THE CORRECTIONS RATHER THAN TO THE BONES.
  //
  // The obvious version — mirror each pivot's absolute position about the
  // mid-plane — is wrong for any model whose bind pose is not itself
  // symmetric, and Yuji's is not: he ships mid-stride with one leg forward,
  // so forcing his hips and knees to mirror each other tears the stance
  // apart. What SHOULD be symmetric is the fix: if the left shoulder needs
  // lifting 4 cm, so does the right. So the left and right OFFSETS from the
  // model's own rest are averaged (with x negated across the pair) and
  // applied back to both, leaving the asymmetric bind exactly as authored.
  mirrorJoints() {
    if (!this.model3d || !this.baseModelPos) return 0;
    this.wrapper.updateMatrixWorld(true);
    const toModel = new THREE.Matrix4().copy(this.model3d.matrixWorld).invert();
    const modelPos = n => new THREE.Vector3().setFromMatrixPosition(n.matrixWorld).applyMatrix4(toModel);
    const toWorld = v => v.clone().applyMatrix4(this.model3d.matrixWorld);
    let n = 0;
    for (const [l, r] of mirrorPairs(this.map)) {
      const nl = this.map[l], nr = this.map[r];
      const bl = this.baseModelPos.get(nl), br = this.baseModelPos.get(nr);
      if (!bl || !br) continue;
      const ol = modelPos(nl).sub(bl), or = modelPos(nr).sub(br);
      const avg = new THREE.Vector3((ol.x - or.x) / 2, (ol.y + or.y) / 2, (ol.z + or.z) / 2);
      if (avg.lengthSq() < 1e-12) continue;
      this.jointEdits[nl.name] = worldToLocalPos(nl, toWorld(bl.clone().add(avg))).toArray();
      this.jointEdits[nr.name] = worldToLocalPos(nr,
        toWorld(br.clone().add(new THREE.Vector3(-avg.x, avg.y, avg.z)))).toArray();
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
    this.retargeter.apply();
    return true;
  }

  stopPreview() {
    if (!this.preview) return;
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
    if (this.weightsOn) this.showWeights(true);
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
  }

  // ---- export -------------------------------------------------------------
  exportJson(bench, notes) {
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
        notes: notes || ''
      },
      url: './' + this.sourceLabel
    };
    if (this.fit.scale !== 1) entry.scale = this.fit.scale;
    if (this.fit.yOffset) entry.yOffset = this.fit.yOffset;
    if (this.fit.faceYaw) entry.faceYaw = this.fit.faceYaw;
    if (Object.keys(boneMap).length) entry.boneMap = boneMap;
    if (Object.keys(this.jointEdits).length) entry.joints = this.jointEdits;
    if (Object.keys(this.poseEdits).length) entry.pose = this.poseEdits;
    if (Object.keys(this.rotOffset).length) {
      entry.rotOffset = Object.fromEntries(
        Object.entries(this.rotOffset).map(([k, v]) => [k, v.map(x => Math.round(x * 100) / 100)]));
    }
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

export function buildLoaderUI(session, { prefs, save, onLoaded }) {
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

  async function loadFrom(url, label) {
    status.textContent = 'Loading ' + (label || url) + '…';
    status.classList.remove('err');
    try {
      const report = await session.load(url, label);
      const t = session.stats?.tris ?? 0;
      status.className = 'mb-status' + (t > TRI_BUDGET ? ' warn' : '');
      status.textContent = `${session.sourceLabel} — ${report}, ${(t / 1000).toFixed(0)}k tris` +
        (t > TRI_BUDGET ? ` (over the ~${TRI_BUDGET / 1000}k a fighter should cost — decimate before shipping)` : '');
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
      const b = el('button', 'mb-chip', k);
      b.onclick = () => loadFrom(
        new URL(url, modelsUrl('manifest.json')).href, url.split('/').pop());
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
