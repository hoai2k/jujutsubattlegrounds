// THE STAGE — renderer, scene, colour management, light rig with a shadow map
// that follows the fight, one post stack per eye (1-4 views), and the grade /
// impact state every system talks to.
//
// Colour: linear working space, sRGB output, ACES filmic. Toon ramps in
// art/shaders/toon.js are authored to land AFTER tone mapping.
import * as THREE from 'three';
import { EyePost } from './post.js';
import { quality, onQuality } from './quality.js';
import { damp, clamp } from '../core/math.js';
import { SHARED } from '../art/shaders/toon.js';

export const GRADES = {
  neutral: { vignette: 0.42, tint: [1, 1, 1], lift: 0, sat: 1.0, contrast: 1.0 },
  ko: { vignette: 0.66, tint: [1.05, 0.95, 0.92], lift: 0, sat: 0.55, contrast: 1.05 },
  pause: { vignette: 0.7, tint: [0.9, 0.94, 1.05], lift: -0.02, sat: 0.35, contrast: 0.95 },
  void: { vignette: 0.72, tint: [0.82, 0.9, 1.18], lift: -0.015, sat: 0.9, contrast: 1.05 },
  shrine: { vignette: 0.46, tint: [1.16, 0.86, 0.88], lift: -0.018, sat: 0.68, contrast: 1.08 },
  volcano: { vignette: 0.68, tint: [1.22, 0.92, 0.78], lift: -0.02, sat: 0.95, contrast: 1.05 },
  flesh: { vignette: 0.74, tint: [0.9, 0.98, 1.04], lift: -0.02, sat: 0.68, contrast: 1.0 },
  shadow: { vignette: 0.52, tint: [0.84, 0.92, 1.10], lift: -0.03, sat: 0.42, contrast: 1.0 },
  pachinko: { vignette: 0.30, tint: [1.12, 1.00, 1.10], lift: 0.03, sat: 1.28, contrast: 1.0 },
  courtroom: { vignette: 0.80, tint: [1.04, 1.00, 0.94], lift: -0.02, sat: 0.86, contrast: 1.0 },
  swordfield: { vignette: 0.62, tint: [1.1, 0.98, 0.86], lift: -0.01, sat: 0.82, contrast: 1.0 },
  shoreline: { vignette: 0.34, tint: [1.10, 1.04, 0.94], lift: 0.035, sat: 1.20, contrast: 1.0 },
  firmament: { vignette: 0.36, tint: [0.94, 1.00, 1.12], lift: 0.018, sat: 0.92, contrast: 1.0 },
  gameshow: { vignette: 0.30, tint: [1.07, 1.02, 0.99], lift: 0.012, sat: 1.20, contrast: 1.0 },
  overtime: { vignette: 0.5, tint: [1.12, 1.02, 0.9], lift: 0, sat: 1.05, contrast: 1.05 }
};

// layers reserved for objects only one seat may see
export const SEAT_LAYER = 8;
export const seatLayer = i => SEAT_LAYER + clamp(i | 0, 0, 3);

export function createStage(canvas = document.getElementById('game-canvas')) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = true;
  // counters survive to the next frame so the perf overlay / harnesses can read them
  renderer.info.autoReset = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a2036);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 260);

  // ---- light rig ----------------------------------------------------------
  const key = new THREE.DirectionalLight(0xffe4c4, 2.6);
  key.position.set(6, 12, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 60;
  key.shadow.camera.left = key.shadow.camera.bottom = -9;
  key.shadow.camera.right = key.shadow.camera.top = 9;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  const keyTarget = new THREE.Object3D();
  scene.add(keyTarget);
  key.target = keyTarget;
  const rim = new THREE.DirectionalLight(0x86b4ff, 1.9);
  rim.position.set(-7, 7, -8);
  const fill = new THREE.DirectionalLight(0x8fa6d8, 0.55);
  fill.position.set(-4, 3, 6);
  const hemi = new THREE.HemisphereLight(0x8ea0d6, 0x4a4036, 0.95);
  scene.add(key, rim, fill, hemi);

  // The shadow frustum follows the fight: `focus` is where the fighters are.
  const focus = new THREE.Vector3();
  const keyDir = new THREE.Vector3(6, 12, 7).normalize();
  function followShadow() {
    keyTarget.position.copy(focus);
    key.position.copy(focus).addScaledVector(keyDir, 26);
  }

  // ---- eyes ---------------------------------------------------------------
  const eyes = [];
  function makeEye(cam) {
    const post = new EyePost(renderer, scene, cam);
    post.configure(quality());
    return { camera: cam, post };
  }
  function eyeAt(i) {
    while (eyes.length <= i) {
      const cam = eyes.length ? new THREE.PerspectiveCamera(48, 1, 0.05, 260) : camera;
      cam.layers.enable(SEAT_LAYER + eyes.length);
      eyes.push(makeEye(cam));
    }
    return eyes[i];
  }
  eyeAt(0);
  let views = 1;

  function viewRects(n) {
    if (n <= 1) return [{ x: 0, y: 0, w: 1, h: 1 }];
    if (n === 2) return [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }];
    if (n === 3) return [{ x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }, { x: 0, y: 0, w: 1, h: 0.5 }];
    return [{ x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }, { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }];
  }

  // ---- compositor for split views ---------------------------------------
  const compScene = new THREE.Scene();
  const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const unitQuad = new THREE.PlaneGeometry(1, 1);
  const quads = [];
  for (let i = 0; i < 4; i++) {
    // toneMapped: the eye buffers hold linear HDR (three only tone-maps and
    // encodes when drawing to the screen), so the quad is where ACES happens
    // in split mode — the OutputPass is disabled per eye for the same reason.
    const q = new THREE.Mesh(unitQuad, new THREE.MeshBasicMaterial({ depthTest: false, toneMapped: true }));
    q.visible = false; compScene.add(q); quads.push(q);
  }
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x05070e, depthTest: false, toneMapped: false });
  const seamV = new THREE.Mesh(unitQuad, seamMat), seamH = new THREE.Mesh(unitQuad, seamMat);
  seamV.renderOrder = seamH.renderOrder = 1; seamV.visible = seamH.visible = false;
  compScene.add(seamV, seamH);
  function layoutQuads() {
    const rects = viewRects(views);
    quads.forEach((q, i) => {
      const r = rects[i]; q.visible = !!r; if (!r) return;
      q.scale.set(r.w * 2, r.h * 2, 1);
      q.position.set((r.x + r.w / 2) * 2 - 1, (r.y + r.h / 2) * 2 - 1, 0);
    });
    seamV.visible = views >= 2; seamH.visible = views >= 3;
    if (views === 3) { seamV.scale.set(0.006, 1, 1); seamV.position.set(0, 0.5, 0); }
    else { seamV.scale.set(0.006, 2, 1); seamV.position.set(0, 0, 0); }
    seamH.scale.set(2, 0.006, 1);
  }
  const eyeTargets = [];

  // ---- billboards ---------------------------------------------------------
  const bbList = [];
  const _bbCache = new Map();
  function collectBillboards(dt) {
    bbList.length = 0;
    scene.traverse(o => {
      if (o.userData.billboard) bbList.push(o);
      if (o.userData.spin) o.rotation.y += dt * o.userData.spin;
    });
  }
  function parentAim(parent, cam) {
    let q = _bbCache.get(parent);
    if (!q) {
      parent.updateWorldMatrix(true, false);
      q = parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(cam.quaternion);
      _bbCache.set(parent, q);
    }
    return q;
  }
  function aimBillboards(cam) {
    _bbCache.clear();
    for (const o of bbList) {
      if (o.parent && o.parent !== scene) o.quaternion.copy(parentAim(o.parent, cam));
      else o.quaternion.copy(cam.quaternion);
      if (o.userData.bbRoll) o.rotateZ(o.userData.bbRoll);
    }
  }

  // ---- grade / impact state -----------------------------------------------
  const gradeState = { ...GRADES.neutral, tint: [...GRADES.neutral.tint] };
  let gradeTarget = GRADES.neutral;
  const fx = {
    flash: 0, flashColor: new THREE.Color(1, 1, 1),
    aberration: 0, radial: 0, zoom: 0, impact: 0, impactFrames: 0, desat: 0, desatTarget: 0,
    center: new THREE.Vector2(0.5, 0.5),
    ink: new THREE.Color(0.02, 0.02, 0.04), paper: new THREE.Color(1, 0.96, 0.9)
  };
  let tier = quality();

  function resize() {
    const w = innerWidth, h = innerHeight;
    const pr = Math.min(devicePixelRatio || 1, tier.pixelRatioCap);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    const rects = viewRects(views);
    rects.forEach((r, i) => {
      const eye = eyeAt(i);
      const vw = Math.max(2, Math.floor(w * r.w)), vh = Math.max(2, Math.floor(h * r.h));
      eye.post.setSize(vw, vh, pr);
      eye.camera.aspect = vw / vh;
      eye.camera.updateProjectionMatrix();
      if (views > 1) {
        if (!eyeTargets[i]) eyeTargets[i] = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
        eyeTargets[i].setSize(Math.floor(vw * pr), Math.floor(vh * pr));
      }
    });
    layoutQuads();
  }
  function applyTier(t) {
    tier = t;
    renderer.shadowMap.enabled = t.shadow > 0;
    key.castShadow = t.shadow > 0;
    if (t.shadow > 0 && key.shadow.mapSize.x !== t.shadow) {
      key.shadow.mapSize.set(t.shadow, t.shadow);
      if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
    }
    for (const e of eyes) e.post.configure(t);
    resize();
  }
  addEventListener('resize', resize);
  onQuality(applyTier);
  applyTier(tier);

  function applyLook(eye) {
    const u = eye.post.look.uniforms;
    u.uVignette.value = gradeState.vignette;
    u.uLift.value = gradeState.lift;
    u.uSat.value = gradeState.sat;
    u.uContrast.value = gradeState.contrast;
    u.uTint.value.setRGB(gradeState.tint[0], gradeState.tint[1], gradeState.tint[2]);
    u.uFlash.value = fx.flash * fx.flash * 0.6;
    u.uFlashColor.value.copy(fx.flashColor);
    u.uAberration.value = tier.aberration ? fx.aberration : 0;
    u.uRadial.value = tier.aberration ? fx.radial : 0;
    u.uZoom.value = fx.zoom;
    u.uCenter.value.copy(fx.center);
    u.uImpact.value = tier.impactFrame ? fx.impact : 0;
    u.uInk.value.copy(fx.ink); u.uPaper.value.copy(fx.paper);
    u.uDesat.value = fx.desat;
  }

  function renderEye(i, split) {
    const eye = eyes[i];
    eye.camera.updateMatrixWorld();
    SHARED.keyDirView.value.copy(keyDir).transformDirection(eye.camera.matrixWorldInverse);
    aimBillboards(eye.camera);
    api.preRender?.(eye.camera, i);
    if (!tier.post) {
      renderer.setRenderTarget(split ? eyeTargets[i] : null);
      renderer.render(scene, eye.camera);
      if (split) quads[i].material.map = eyeTargets[i].texture;
      return;
    }
    applyLook(eye);
    eye.post.output.enabled = !split;
    if (split) {
      eye.post.composer.renderToScreen = false;
      eye.post.composer.render();
      quads[i].material.map = eye.post.composer.readBuffer.texture;
    } else {
      eye.post.render();
    }
  }

  const api = {
    renderer, scene, camera, lights: { key, rim, fill, hemi }, focus, fx, _eyes: eyes,
    preRender: null,
    cameraFor(i) { return eyeAt(i).camera; },
    get isSplit() { return views > 1; },
    get viewCount() { return views; },
    get tier() { return tier; },
    setViews(n) {
      const want = clamp(n | 0, 1, 4);
      if (views === want) return;
      views = want;
      for (let i = 0; i < views; i++) eyeAt(i);
      resize();
    },
    setGrade(name) { gradeTarget = GRADES[name] || (typeof name === 'object' ? name : GRADES.neutral); },
    // ---- impact API — the whole game talks to the frame through these -----
    flash(amount, color) { fx.flash = Math.max(fx.flash, amount); if (color) fx.flashColor.set(color); else fx.flashColor.set(0xffffff); },
    // screen-space punch: aberration + radial blur + zoom from `center` (0..1)
    punch(amount, center) {
      fx.aberration = Math.max(fx.aberration, amount);
      fx.radial = Math.max(fx.radial, amount * 0.7);
      fx.zoom = Math.max(fx.zoom, amount * 0.035);
      if (center) fx.center.set(center.x, center.y);
    },
    // dash speed lines: radial blur only, sustained while `on`
    speed(amount, center) { fx.radial = Math.max(fx.radial, amount); if (center) fx.center.set(center.x, center.y); },
    // ink frame for n frames (at 60Hz)
    impactFrame(frames = 3, ink, paper) {
      fx.impactFrames = Math.max(fx.impactFrames, frames);
      fx.impact = 1;
      if (ink) fx.ink.set(ink); else fx.ink.set(0x05050a);
      if (paper) fx.paper.set(paper); else fx.paper.set(0xfff6e6);
    },
    desaturate(v) { fx.desatTarget = v; },
    // world -> screen (0..1, y up) for the impact centre
    project(v, i = 0) {
      const cam = eyeAt(i).camera;
      const p = v.clone().project(cam);
      return { x: p.x * 0.5 + 0.5, y: p.y * 0.5 + 0.5 };
    },
    render(dt) {
      // a rAF timestamp can trail performance.now() on a throttled tab; a
      // negative dt would GROW every decaying effect below
      dt = Math.max(0, Math.min(0.1, dt || 0));
      gradeState.vignette = damp(gradeState.vignette, gradeTarget.vignette, 5, dt);
      gradeState.lift = damp(gradeState.lift, gradeTarget.lift, 5, dt);
      gradeState.sat = damp(gradeState.sat, gradeTarget.sat, 5, dt);
      gradeState.contrast = damp(gradeState.contrast, gradeTarget.contrast ?? 1, 5, dt);
      for (let i = 0; i < 3; i++) gradeState.tint[i] = damp(gradeState.tint[i], gradeTarget.tint[i], 5, dt);
      fx.flash = Math.max(0, fx.flash - dt * 3.4);
      fx.aberration = Math.max(0, fx.aberration - dt * 4.5);
      fx.radial = Math.max(0, fx.radial - dt * 5.0);
      fx.zoom = Math.max(0, fx.zoom - dt * 0.24);
      fx.desat = damp(fx.desat, fx.desatTarget, 6, dt);
      if (fx.impactFrames > 0) { fx.impactFrames -= dt * 60; if (fx.impactFrames <= 0) { fx.impact = 0; fx.impactFrames = 0; } }
      renderer.info.reset();
      followShadow();
      collectBillboards(dt);

      if (views === 1) { renderEye(0, false); return; }
      for (let i = 0; i < views; i++) renderEye(i, true);
      renderer.setRenderTarget(null);
      renderer.setScissorTest(false);
      renderer.render(compScene, compCam);
    },
    shot() { return renderer.domElement.toDataURL('image/png'); }
  };
  return api;
}
