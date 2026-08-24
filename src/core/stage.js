// Renderer + scene + post stack (bloom, vignette/grade) + light rig.
// Supports 1 to 4 simultaneous views: full screen, a left/right pair, or a
// 2x2 grid for 3-4 local players. Each eye owns its own composer so the full
// shading stack survives in split mode; the results are blitted into place.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { damp } from './mathutil.js';
import { applyXray } from '../art/shaders/xray.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.55 },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uLift: { value: 0.0 },
    uSat: { value: 1.0 },
    uFlash: { value: 0.0 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette; uniform vec3 uTint; uniform float uLift; uniform float uSat; uniform float uFlash;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb = c.rgb * uTint + uLift;
      float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(g), c.rgb, uSat);
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - smoothstep(0.35, 0.85, d) * uVignette;
      c.rgb += uFlash;
      gl_FragColor = c;
    }`
};

export const GRADES = {
  neutral: { vignette: 0.42, tint: [1, 1, 1], lift: 0, sat: 1.0 },
  void: { vignette: 0.72, tint: [0.82, 0.9, 1.18], lift: -0.015, sat: 0.9 },
  swordfield: { vignette: 0.62, tint: [1.1, 0.98, 0.86], lift: -0.01, sat: 0.82 },
  // Jogo: red-orange heat, crushed shadows; Mahito: drained, cold, sickly
  volcano: { vignette: 0.68, tint: [1.22, 0.92, 0.78], lift: -0.02, sat: 0.95 },
  flesh: { vignette: 0.74, tint: [0.9, 0.98, 1.04], lift: -0.02, sat: 0.68 },
  // Megumi: everything above the shadow line goes cold and desaturated, but
  // the vignette stays comparatively OPEN — this domain has no walls, and the
  // grade should not imply any.
  shadow: { vignette: 0.52, tint: [0.84, 0.92, 1.10], lift: -0.03, sat: 0.42 },
  // SUKUNA. Deep red and black, everything else drained out — and like
  // Megumi's the vignette stays OPEN, because this domain has no barrier
  // either and a closed frame would lie about that. The difference is that
  // his is cold and this one is hot: the ash and the sky get pushed toward
  // blood, the blacks are crushed hard, and colour survives only in the red.
  // Pass 2 pulled the tint most of the way back: at [1.34, 0.80, 0.80] on top
  // of the domain's own red key, every surface in the arena — both fighters
  // included — came out flat pink and nothing was readable.
  shrine: { vignette: 0.46, tint: [1.16, 0.86, 0.88], lift: -0.018, sat: 0.68 },
  // HAKARI. Three grades, and the contrast between them and everything above
  // is the point: his domain is the only one that makes the screen BRIGHTER.
  // `pachinko` lifts and saturates with almost no vignette (a lit room, not a
  // pocket dimension); `reach` pushes it further and pinks it, and is what
  // bleeds out of the corner window on a super reach; `jackpot` floods gold
  // and survives the barrier collapsing, because Jackpot does.
  // TAKABA. THE GAME SHOW, and it is deliberately the brightest grade in the
  // table — brighter than Hakari's parlor, which is the only other one that
  // makes the screen lighter rather than darker. A studio is over-lit, the
  // vignette is almost gone (there is no pocket dimension here, there is a
  // SET), and the saturation is pushed past every other grade because the
  // whole point of the ultimate is that the game has stopped being serious.
  //
  // TUNED DOWN FROM A FIRST PASS AT lift 0.07 / sat 1.42, which blew the whole
  // frame to white and turned both fighters into pale mannequins — a studio is
  // over-lit, not over-exposed, and the panel is already the loudest thing on
  // screen without the arena competing with it.
  // ...and the tint is nearly neutral with a warm bias rather than the first
  // pass's [1.10, 1.02, 1.08], which pushed magenta and turned every grey
  // surface in the set — the rooftops, the taxis, the hospital lino — a flat
  // lavender. A studio is over-lit, not tinted.
  gameshow: { vignette: 0.30, tint: [1.07, 1.02, 0.99], lift: 0.012, sat: 1.20 },
  pachinko: { vignette: 0.30, tint: [1.12, 1.00, 1.10], lift: 0.03, sat: 1.28 },
  reach: { vignette: 0.26, tint: [1.30, 1.02, 1.20], lift: 0.06, sat: 1.48 },
  jackpot: { vignette: 0.34, tint: [1.32, 1.14, 0.80], lift: 0.05, sat: 1.32 },
  // HIGURUMA. Deliberately the least graded domain in the game: a real room
  // with real lighting, barely tinted, almost neutral saturation, and a HARD
  // vignette because everything outside the overhead light is in shadow. Next
  // to Hakari's parlor and Jogo's volcano the restraint is the effect.
  // `sentence` is the execution duel: the colour is pulled most of the way
  // out and the corners close in, so the two bodies in the middle are the only
  // thing on screen.
  courtroom: { vignette: 0.80, tint: [1.04, 1.00, 0.94], lift: -0.02, sat: 0.86 },
  // Saturation is pulled most of the way out and the vignette closes hard, so
  // the two bodies in the middle are the only thing on screen. `lift` is a
  // gentle -0.05: at -0.13 the room went with them and the shot was two
  // figures in a void, which is Gojo's domain, not this one.
  sentence: { vignette: 0.90, tint: [1.02, 0.99, 0.96], lift: -0.05, sat: 0.30 },
  // DAGON. THE ONLY DOMAIN GRADE IN THE GAME THAT IS NOT A THREAT, and the
  // whole character depends on it staying that way: the horror of Horizon of
  // the Captivating Skandha is that it looks like somewhere you would want to
  // be. So it is BRIGHT — the second-most open vignette after Hakari's parlor,
  // a lift rather than a crush, saturation pushed up, and a warm tropical tint
  // rather than a cold one. Next to Jogo's furnace and Mahito's drained flesh
  // it should read as a holiday photograph.
  //
  // Two constraints it also has to satisfy, both of them about somebody else:
  //   · Uro's warp effects are near-colourless, so they have to stay readable
  //     against a bright, warm, high-saturation frame. The tint is kept under
  //     1.12 on red for exactly that reason — see the grade audit in the
  //     delivery report.
  //   · the shikigami are cold blue-grey against warm sand, and the grade
  //     must not close that gap. Saturation up rather than tint hard is what
  //     keeps the creatures legible against the beach.
  shoreline: { vignette: 0.34, tint: [1.10, 1.04, 0.94], lift: 0.035, sat: 1.20 },
  // URO — THE WARPED FIRMAMENT. The palest grade in the game and the only one
  // that LIFTS as hard as it does: the interior is an overexposed sky, so the
  // blacks come up until there are almost none left. Cool tint, low saturation
  // (there is no colour up there), and the lightest vignette of any domain,
  // because a dark frame edge would give the eye an anchor and the whole
  // interior is built on not having one.
  // RETUNED after looking at it: lift 0.075 on top of bloom blew the whole
  // interior to flat white and hid everything in it. 0.018 keeps the "there is
  // no black in the sky" reading without erasing the contents.
  firmament: { vignette: 0.36, tint: [0.94, 1.00, 1.12], lift: 0.018, sat: 0.92 },
  overtime: { vignette: 0.5, tint: [1.12, 1.02, 0.9], lift: 0, sat: 1.05 },
  ko: { vignette: 0.66, tint: [1.05, 0.95, 0.92], lift: 0, sat: 0.6 }
};

// The first of four layers reserved for objects only ONE seat may see. See the
// note in `eyeAt`; `seatLayer(i)` is the accessor everything else should use.
export const SEAT_LAYER = 8;
export function seatLayer(i) { return SEAT_LAYER + Math.max(0, Math.min(3, i | 0)); }

export function createStage() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x232948);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 220);

  // key / fill / rim
  const key = new THREE.DirectionalLight(0xffe2c0, 2.35);
  key.position.set(7, 11, 5);
  const rim = new THREE.DirectionalLight(0x84b0ff, 1.7);
  rim.position.set(-6, 8, -7);
  const hemi = new THREE.HemisphereLight(0x8698cf, 0x4c4036, 0.62);
  scene.add(key, rim, hemi);

  // ---- eyes ---------------------------------------------------------------
  function makeEye(cam) {
    const target = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, cam));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.5, 0.82);
    const grade = new ShaderPass(GradeShader);
    composer.addPass(bloom);
    composer.addPass(grade);
    composer.addPass(new OutputPass());
    return { camera: cam, composer, bloom, grade };
  }

  // Eye 0 owns the shared `camera`; eyes 1-3 are created on demand the first
  // time a match asks for that many views.
  const eyes = [];
  function eyeAt(i) {
    while (eyes.length <= i) {
      const cam = eyes.length ? new THREE.PerspectiveCamera(50, 1, 0.05, 220) : camera;
      // ---- SEAT-PRIVATE OBJECTS -------------------------------------------
      // Everything in the game is drawn from one scene, once per eye, so by
      // default every seat sees everything. A few things must not be shared:
      // a message telling YOU why YOUR button did nothing is noise on the
      // other half of the couch, and in a four-way it is three quarters noise.
      //
      // Layers are how three.js says that. A camera sees layer 0 plus whatever
      // it enables, so eye `i` is given SEAT_LAYER + i and nothing else has to
      // change: an object left on layer 0 is still seen by everybody, and one
      // moved onto a seat's layer is seen by that seat alone. It costs nothing
      // per frame — the test is a bitmask on the object.
      cam.layers.enable(SEAT_LAYER + eyes.length);
      eyes.push(makeEye(cam));
    }
    return eyes[i];
  }
  eyeAt(0);
  let views = 1;

  // Viewport rects in normalized 0..1 space, origin bottom-left (the WebGL
  // viewport convention). 2 views split left/right; 3 gets its own layout —
  // two on top and one full-width underneath, so nobody stares at a dead
  // quadrant; 4 fills the 2x2 grid. Reading order throughout: P1 is top-left.
  function viewRects(n) {
    if (n <= 1) return [{ x: 0, y: 0, w: 1, h: 1 }];
    if (n === 2) return [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }];
    if (n === 3) return [
      { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0, y: 0, w: 1, h: 0.5 }
    ];
    return [
      { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 }
    ];
  }

  // ---- compositor: one quad per view + seams -------------------------------
  const compScene = new THREE.Scene();
  const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const unitQuad = new THREE.PlaneGeometry(1, 1);
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x05070e, depthTest: false, toneMapped: false });
  const quads = [];
  for (let i = 0; i < 4; i++) {
    const q = new THREE.Mesh(unitQuad, new THREE.MeshBasicMaterial({ depthTest: false, toneMapped: false }));
    q.renderOrder = 0;
    q.visible = false;
    compScene.add(q);
    quads.push(q);
  }
  const seamV = new THREE.Mesh(unitQuad, seamMat);
  const seamH = new THREE.Mesh(unitQuad, seamMat);
  seamV.scale.set(0.008, 2, 1);
  seamH.scale.set(2, 0.008, 1);
  seamV.renderOrder = seamH.renderOrder = 1;
  seamV.visible = seamH.visible = false;
  compScene.add(seamV, seamH);

  // place the quads over the current layout (ortho space is -1..1)
  function layoutQuads() {
    const rects = viewRects(views);
    quads.forEach((q, i) => {
      const r = rects[i];
      q.visible = !!r;
      if (!r) return;
      q.scale.set(r.w * 2, r.h * 2, 1);
      q.position.set((r.x + r.w / 2) * 2 - 1, (r.y + r.h / 2) * 2 - 1, 0);
    });
    seamV.visible = views >= 2;
    seamH.visible = views >= 3;
    // with three views the vertical seam only divides the top row
    if (views === 3) { seamV.scale.set(0.008, 1, 1); seamV.position.set(0, 0.5, 0); }
    else { seamV.scale.set(0.008, 2, 1); seamV.position.set(0, 0, 0); }
  }

  // ---- BILLBOARDS ---------------------------------------------------------
  // A camera-facing quad can only face ONE camera, and the scene is drawn once
  // per eye. Orienting them when the world updates therefore aims every
  // billboard in the game at eye 0: correct on one screen, and edge-on — which
  // is to say INVISIBLE — in every other view of a split-screen match. That is
  // exactly what Choso's Blood Edge looked like from seat 2, and it was never
  // his bug: every particle, ring, spark, HP bar and technique flare in the
  // project is built the same way.
  //
  // So the aim moved here, to the only place that knows which eye is about to
  // draw. Anything marked `userData.billboard` is re-aimed immediately before
  // each eye renders (with an optional fixed roll in `userData.bbRoll`), so
  // every view gets its own correct orientation out of the one shared scene.
  // The list is gathered once per frame; the per-eye cost is a quaternion copy.
  const bbList = [];
  function collectBillboards(dt) {
    bbList.length = 0;
    scene.traverse(o => {
      if (o.userData.billboard) bbList.push(o);
      if (o.userData.spin) o.rotation.y += dt * 5;
    });
  }
  // Local orientation is what gets written, so a billboard hanging off
  // something that TURNS — an HP bar on a curse's body, the freeze countdown
  // over a fighter's head — has to cancel its parent out or the plate swings
  // with the body it is labelling. Parents repeat (every particle in the game
  // shares the match root), so each one is solved once per eye and reused.
  const _bbCache = new Map();
  function parentAim(parent, cam) {
    let q = _bbCache.get(parent);
    if (!q) {
      parent.updateWorldMatrix(true, false);
      // world = parent * local, and world has to come out as the camera's
      // orientation, so the local we want is parent⁻¹ * cam.
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

  const gradeState = { ...GRADES.neutral, tint: [...GRADES.neutral.tint] };
  let gradeTarget = GRADES.neutral;
  let flash = 0;
  let quality = 2; // 2 = full post, 1 = no bloom, 0 = raw render

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    const rects = viewRects(views);
    rects.forEach((r, i) => {
      const eye = eyeAt(i);
      const vw = Math.max(2, Math.floor(w * r.w));
      const vh = Math.max(2, Math.floor(h * r.h));
      eye.composer.setSize(vw, vh);
      eye.bloom.setSize(vw, vh);
      eye.camera.aspect = vw / vh;
      eye.camera.updateProjectionMatrix();
    });
    layoutQuads();
  }
  addEventListener('resize', resize);
  resize();

  // dev-only capture hook (pairs with the vite /__shot sink)
  if (import.meta.env?.DEV) {
    window.__stageShot = async (name) => {
      api.render(0);
      const data = canvas.toDataURL('image/png');
      await fetch('/__shot', { method: 'POST', body: JSON.stringify({ name, data }) });
      return 'saved ' + name;
    };
  }

  function applyGrade(eye) {
    const u = eye.grade.uniforms;
    u.uVignette.value = gradeState.vignette;
    u.uLift.value = gradeState.lift;
    u.uSat.value = gradeState.sat;
    u.uTint.value.setRGB(...gradeState.tint);
    u.uFlash.value = flash * flash * 0.55;
    eye.bloom.enabled = quality === 2;
    eye.grade.enabled = quality >= 1;
  }

  const api = {
    renderer, scene, camera, lights: { key, rim, hemi },
    // set by core/match.js — see the note at the call site in `render`
    preRender: null,
    get splitCamera() { return eyeAt(1).camera; },
    cameraFor(i) { return eyeAt(i).camera; },
    get isSplit() { return views > 1; },
    get viewCount() { return views; },
    // 1 = full screen, 2 = left/right, 3-4 = 2x2 grid
    setViews(n) {
      const want = Math.max(1, Math.min(4, n | 0));
      if (views === want) return;
      views = want;
      for (let i = 0; i < views; i++) eyeAt(i);
      resize();
    },
    setSplit(on) { this.setViews(on ? 2 : 1); },
    setGrade(name) { gradeTarget = GRADES[name] || GRADES.neutral; },
    flash(amount) { flash = Math.max(flash, amount); },
    cycleQuality() { quality = (quality + 2) % 3; return ['LOW', 'MEDIUM', 'FULL'][quality]; },
    // Driven by the arena quality profile (arena/index.js): the post stack and
    // the render resolution move with destruction detail and debris budget, so
    // one setting covers everything the frame budget cares about.
    setQuality(q) {
      quality = Math.max(0, Math.min(2, q.post ?? 2));
      renderer.setPixelRatio(Math.min(devicePixelRatio, q.pixelRatioCap ?? 1.75));
      resize();
    },
    get quality() { return quality; },
    render(dt) {
      // ease the grade toward its target
      gradeState.vignette = damp(gradeState.vignette, gradeTarget.vignette, 5, dt);
      gradeState.lift = damp(gradeState.lift, gradeTarget.lift, 5, dt);
      gradeState.sat = damp(gradeState.sat, gradeTarget.sat, 5, dt);
      for (let i = 0; i < 3; i++) gradeState.tint[i] = damp(gradeState.tint[i], gradeTarget.tint[i], 5, dt);
      flash = Math.max(0, flash - dt * 3.2);

      // X-RAY. The occlusion cutout is a set of uniforms shared by every map
      // material, so it has to be pointed at the right subject immediately
      // before each eye draws — in split screen the same materials are drawn
      // once per view, each following a different fighter.
      collectBillboards(dt);

      if (views === 1) {
        applyXray(camera);
        aimBillboards(camera);
        // ---- THE PRE-RENDER HOOK --------------------------------------------
        // One optional callback, invoked with the camera about to draw, before
        // that eye composites. It exists for exactly one customer:
        // fx/warpfx.js, which has to capture the scene WITHOUT its own
        // geometry in it so a refracting shard can sample the arena behind
        // itself. Null for every frame in which nothing is warped, so this
        // line costs one comparison.
        api.preRender?.(camera);
        applyGrade(eyes[0]);
        if (quality === 0) {
          renderer.setRenderTarget(null);
          renderer.setScissorTest(false);
          renderer.render(scene, camera);
        } else {
          eyes[0].composer.renderToScreen = true;
          eyes[0].composer.render();
        }
        return;
      }

      // ---- split (2 up, or a 2x2 grid) ----
      const rects = viewRects(views);
      if (quality === 0) {
        // cheap path: scissor each cell straight to the canvas, no post
        const w = renderer.domElement.width, h = renderer.domElement.height;
        renderer.setRenderTarget(null);
        renderer.setScissorTest(true);
        rects.forEach((r, i) => {
          const vx = Math.floor(r.x * w), vy = Math.floor(r.y * h);
          const vw = Math.floor(r.w * w), vh = Math.floor(r.h * h);
          renderer.setViewport(vx, vy, vw, vh);
          renderer.setScissor(vx, vy, vw, vh);
          applyXray(eyeAt(i).camera);
          aimBillboards(eyeAt(i).camera);
          renderer.render(scene, eyeAt(i).camera);
        });
        renderer.setScissorTest(false);
        renderer.setViewport(0, 0, w, h);
        return;
      }
      for (let i = 0; i < views; i++) {
        const eye = eyeAt(i);
        applyXray(eye.camera);
        aimBillboards(eye.camera);
        // split screen captures per eye too, so a warp shard shows the arena
        // from the viewpoint it is actually being seen from rather than from
        // player one's
        api.preRender?.(eye.camera);
        applyGrade(eye);
        eye.composer.renderToScreen = false;
        eye.composer.render();
        quads[i].material.map = eye.composer.readBuffer.texture;
        quads[i].material.needsUpdate = true;
      }
      renderer.setRenderTarget(null);
      renderer.setScissorTest(false);
      renderer.clear();
      renderer.render(compScene, compCam);
    }
  };
  return api;
}
