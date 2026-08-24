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
import { loadScene, applyRestPose, fitInto, modelsUrl } from '../art/rig3d/render3d.js';
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

// -------------------------------------------------------------- session ----
// One loaded model + one reference character + everything both benches do to
// the pair. The session owns three exclusive display states: EDIT (the bench
// pose, hand-adjustable), PREVIEW (the retargeter is driving), and whatever
// weight/wireframe overlays are stacked on top of either.
export class RigSession {
  constructor(stage) {
    this.stage = stage;
    this.wrapper = null;       // normalized parent of the model
    this.model3d = null;       // the loaded scene
    this.nodes = [];           // candidate bone nodes
    this.byName = new Map();
    this.map = {};             // canonical -> node
    this.mapReport = '';
    this.overrides = {};       // canonical -> nodeName|null (user picks)
    this.rotOffset = {};       // canonical -> [x,y,z] degrees
    this.fit = { scale: 1, yOffset: 0, faceYaw: 0 };
    this.loadedPose = null;    // Map node -> quaternion as the file shipped
    this.sourceUrl = '';
    this.sourceLabel = '';

    this.ref = null;           // {model, clips, player, rest, pick}
    this.retargeter = null;
    this.preview = false;
    this.editPose = null;      // Map node -> quaternion while previewing

    this.skeletonHelper = null;
    this.markers = null;       // joint marker spheres for pick/highlight
    this.selected = null;      // canonical name under edit
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
    if (this.model3d) this.refit();       // a new reference means a new height
    this._rebuildRetarget();
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
    this.nodes = collectBoneNodes(scene);
    this.byName = new Map();
    scene.traverse(o => { if (o.name && !this.byName.has(o.name)) this.byName.set(o.name, o); });
    // normalize the hierarchy off the auto-map before anything snapshots or
    // measures — the same order ?render3d runs, so bench poses replay exactly
    rerigHierarchy(scene, guessBoneMap(scene, this.overrides).map);
    this.loadedPose = this._snapshot();
    this.wrapper = new THREE.Group();
    this.wrapper.name = 'render3d-bench';
    this.refit();
    this.stage.scene.add(this.wrapper);
    this.remap();
    this.setSkeleton(true);
    return this.mapReport;
  }

  unload() {
    this.stopPreview();
    this.showWeights(false);
    this.setSkeleton(false);
    if (this.wrapper) this.stage.scene.remove(this.wrapper);
    this.wrapper = this.model3d = null;
    this.map = {}; this.overrides = {}; this.rotOffset = {};
    this.selected = null;
    this.retargeter = null;
  }

  refit() {
    if (!this.model3d) return;
    fitInto(this.wrapper, this.model3d, this.ref?.model.H ?? 1.8, this.fit);
    this._refreshMarkers();
  }

  // ---- mapping ------------------------------------------------------------
  remap() {
    if (!this.model3d) return;
    const r = guessBoneMap(this.model3d, this.overrides);
    this.map = r.map;
    this.mapReport = r.report;
    this._rebuildRetarget();
    this._refreshMarkers();
    return r;
  }

  assign(canonical, nodeName) {
    this.overrides[canonical] = nodeName;   // null drops the bone
    return this.remap();
  }

  // ---- pose ---------------------------------------------------------------
  _snapshot() {
    const m = new Map();
    this.model3d?.traverse(o => m.set(o, o.quaternion.clone()));
    return m;
  }
  _restore(snap) {
    if (!snap) return;
    for (const [o, q] of snap) o.quaternion.copy(q);
  }

  restoreLoadedPose() { this._restore(this.loadedPose); this.refit(); }

  applyPoseJson(pose) { applyRestPose(this.model3d, pose); this.refit(); }

  // Auto-pose: rotate each mapped bone so its (bone -> canonical child)
  // direction matches a target direction set, top-down so parents settle
  // before children aim. 'T' is the classic T-pose; 'A' is the game's own
  // bind, read live off the reference character's rest joints — the pose the
  // retargeter aligns cleanest from.
  autoPose(kind) {
    if (!this.model3d) return;
    const dirs = kind === 'T' ? tPoseDirs() : this._gameBindDirs();
    if (!dirs) return;
    const wq = new THREE.Quaternion(), pq = new THREE.Quaternion();
    const cur = new THREE.Vector3(), want = new THREE.Vector3();
    for (const name of CANONICAL) {
      const node = this.map[name], childName = REF_CHILD[name];
      const child = childName && this.map[childName];
      const d = dirs[name];
      if (!node || !child || !d) continue;
      this.wrapper.updateMatrixWorld(true);
      cur.setFromMatrixPosition(child.matrixWorld)
        .sub(new THREE.Vector3().setFromMatrixPosition(node.matrixWorld));
      if (cur.lengthSq() < 1e-10) continue;
      want.copy(d);
      const arc = new THREE.Quaternion().setFromUnitVectors(cur.normalize(), want.normalize());
      node.getWorldQuaternion(wq);
      node.parent.getWorldQuaternion(pq);
      node.quaternion.copy(pq.invert().multiply(arc.multiply(wq)));
    }
    this.refit();
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

  // per-node local euler (degrees) for the panel sliders
  getNodeEuler(node) {
    const e = new THREE.Euler().setFromQuaternion(node.quaternion, 'XYZ');
    return [e.x / DEG, e.y / DEG, e.z / DEG];
  }
  setNodeEuler(node, deg) {
    node.quaternion.setFromEuler(new THREE.Euler(deg[0] * DEG, deg[1] * DEG, deg[2] * DEG, 'XYZ'));
  }

  // every node whose rotation differs from the file's — this IS the manifest
  // `pose` field
  poseDiff() {
    const out = {};
    if (!this.model3d || !this.loadedPose) return out;
    this.model3d.traverse(o => {
      const was = this.loadedPose.get(o);
      if (!was || !o.name) return;
      if (Math.abs(1 - Math.abs(was.dot(o.quaternion))) < 1e-7) return;
      const e = this.getNodeEuler(o);
      out[o.name] = e.map(v => Math.round(v * 100) / 100);
    });
    return out;
  }

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
    if (!this.preview) this.editPose = this._snapshot();
    // the retargeter treats the CURRENT bench pose as the model's rest, so it
    // must be built from the edit pose, not from a half-driven one
    this._restore(this.editPose);
    this._rebuildRetarget();
    if (!this.retargeter) { this.preview = false; return false; }
    this.preview = true;
    if (clip) this.ref.player.play(clip, { fade: 0.12, restart: true });
    return true;
  }

  stopPreview() {
    if (!this.preview) return;
    this.preview = false;
    this._restore(this.editPose);
    this.editPose = null;
    this.ref?.player.play('idle', { fade: 0, restart: true });
    this.refit();
  }

  setRotOffset(canonical, deg) {
    if (deg && deg.some(v => Math.abs(v) > 0.01)) this.rotOffset[canonical] = deg;
    else delete this.rotOffset[canonical];
    if (this.preview) { this._restore(this.editPose); this._rebuildRetarget(); }
  }

  _tick(dt) {
    if (this.preview && this.ref && this.retargeter) {
      this.ref.player.update(dt);
      this.ref.model.update(dt);
      this.retargeter.apply();
    }
    this._tickMarkers();
  }

  // ---- display: skeleton, markers, weights, wireframe ---------------------
  setSkeleton(on) {
    if (this.skeletonHelper) { this.stage.scene.remove(this.skeletonHelper); this.skeletonHelper = null; }
    if (this.markers) { this.stage.scene.remove(this.markers); this.markers = null; }
    if (!on || !this.wrapper) return;
    this.skeletonHelper = new THREE.SkeletonHelper(this.wrapper);
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
    const mapped = new Map();          // node -> canonical
    for (const [c, n] of Object.entries(this.map)) mapped.set(n, c);
    for (const m of this.markers.children) {
      const c = mapped.get(m.userData.node);
      const sel = c && c === this.selected;
      m.material.color.set(sel ? 0xffd86b : c ? 0x7fd0a0 : 0x3a4260);
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

  // click in the 3D view -> nearest joint marker, for "this is the elbow"
  pickAt(event) {
    if (!this.markers) return null;
    const r = this.stage.canvas.getBoundingClientRect();
    const p = new THREE.Vector2(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      -((event.clientY - r.top) / r.height) * 2 + 1);
    this._raycaster.setFromCamera(p, this.stage.camera);
    this._raycaster.params.Points = {};
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
  // The single most direct way to catch a thigh painted onto a coat, which no
  // amount of pose-watching reveals as fast.
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
        // heat ramp: charcoal -> red -> yellow
        colors.setXYZ(i, 0.09 + 0.91 * Math.min(1, w * 1.6),
          0.09 + 0.91 * Math.max(0, w - 0.5) * 2, 0.11);
      }
      colors.needsUpdate = true;
      o.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
    });
  }

  // ---- export -------------------------------------------------------------
  // The whole point of the rig bench: everything the user changed, as one
  // manifest-entry-shaped JSON they can hand back.
  exportJson(bench, notes) {
    const pose = this.poseDiff();
    const boneMap = {};
    for (const [c, n] of Object.entries(this.overrides)) boneMap[c] = n;
    const entry = {
      _workbench: {
        bench, model: this.sourceLabel, exported: new Date().toISOString(),
        reference: this.ref?.pick ?? null,
        mapping: this.mapReport,
        map: Object.fromEntries(Object.entries(this.map).map(([c, n]) => [c, n.name])),
        notes: notes || ''
      },
      url: './' + this.sourceLabel
    };
    if (this.fit.scale !== 1) entry.scale = this.fit.scale;
    if (this.fit.yOffset) entry.yOffset = this.fit.yOffset;
    if (this.fit.faceYaw) entry.faceYaw = this.fit.faceYaw;
    if (Object.keys(boneMap).length) entry.boneMap = boneMap;
    if (Object.keys(pose).length) entry.pose = pose;
    if (Object.keys(this.rotOffset).length) {
      entry.rotOffset = Object.fromEntries(
        Object.entries(this.rotOffset).map(([k, v]) => [k, v.map(x => Math.round(x * 100) / 100)]));
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
      status.textContent = `${session.sourceLabel} — ${report}`;
      onLoaded?.();
    } catch (e) {
      status.textContent = 'Failed: ' + (e?.message ?? e);
      status.classList.add('err');
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
