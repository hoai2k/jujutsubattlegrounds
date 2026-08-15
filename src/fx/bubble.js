// SPEECH BUBBLES — the taunt system's only piece of screen furniture.
//
// A bubble is one camera-facing quad carrying a canvas texture, anchored over
// a fighter's head and following them in 3D. Everything about it is aimed at
// one requirement: it has to be READABLE AT FIGHTING-GAME DISTANCE, over any
// arena, inside any domain, at any body scale in the roster.
//
// The four decisions that requirement forced:
//
// 1. PAPER AND INK, BOTH ACHROMATIC. The domains grade the whole frame through
//    stage.js's GRADES — Sukuna's shrine multiplies red by 1.16 and pulls
//    saturation to 0.68, Megumi's shadow drops saturation to 0.42, Higuruma's
//    courtroom closes a 0.80 vignette. Every one of those is a multiply/lerp
//    that preserves the ratio between two ACHROMATIC values, so a white fill
//    against black ink survives all of them. A tinted bubble would not: the
//    same grade that makes the shrine red would eat a red bubble whole. The
//    character's accent colour is allowed exactly one job — a thin band inside
//    the rim, too thin to be what anything is read against.
//
// 2. DEPTH TEST OFF. A bubble half-buried in a Shibuya shopfront is worse than
//    a bubble that floats. It draws over the world, at a renderOrder above the
//    FX layer, and its anchor keeps it above the head so it never reads as
//    wrongly-sorted.
//
// 3. THE SCALE IS CLAMPED, NOT FIXED. Pure world-space scale becomes unreadable
//    the moment the camera pulls back for Mahoraga; pure screen-space scale
//    stops looking attached to anybody. So the quad scales WITH distance —
//    holding a near-constant screen size — between a floor and a ceiling, which
//    keeps it attached in a tight interior and legible from the Kurourushi
//    pull-back.
//
// 4. THE SHAPE IS DRAWN, NOT ROUNDED-RECT. The outline is a wobbling closed
//    path with a drawn tail, inked in three slightly offset passes. It has to
//    sit in the same world as the cel shader.
import * as THREE from 'three';

// A bubble's texture is generated once per (text, palette) and cached: the same
// character taunting twenty times in a round costs one canvas.
const _cache = new Map();

// Deterministic wobble. A bubble that re-rendered with a different silhouette
// every time it popped would read as a glitch, so the jitter is seeded off the
// text itself and is therefore stable for the life of the string.
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return ((h >>> 0) % 10000) / 10000; };
}

const PAD_X = 54, PAD_Y = 44, TAIL_H = 62;
const LINE_H = 74;

// THE PAPER IS NOT WHITE, AND THAT IS THE WHOLE POINT.
//
// At #fdfdfa this blew straight through the bloom pass: on quality 2 the
// bubble arrived as a glowing white blob with a corona over half the tree line
// and no visible black rim at all — the ink was there, the RIM was not, and the
// shape stopped being a drawn object and became a light source. Dropping the
// paper to an off-white sits it under the bloom threshold while keeping the
// contrast against the ink enormous (0.87 vs 0.07 luminance), which is what
// legibility actually depends on. It also happens to look more like paper.
//
// Do NOT raise this back toward white without re-shooting a bloom-enabled
// frame. See shots/t-gojo-behind.png history.
const PAPER = '#e6e2d6';
const INK = '#12131a';

function wrap(g, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// The hand-drawn outline: an ellipse walked in N steps with a seeded radial
// wobble, closed with a quadratic through each midpoint so the result is a
// continuous drawn line rather than a polygon.
function bubblePath(g, cx, cy, rx, ry, rnd, n = 26) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (rnd() - 0.5) * 0.075;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  g.beginPath();
  g.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  g.closePath();
}

// The tail, drawn as its own filled wedge so it can be inked with the body and
// still overlap it cleanly. It leans, because a symmetrical tail looks printed.
function tailPath(g, cx, baseY, rnd) {
  const lean = (rnd() - 0.5) * 46;
  g.beginPath();
  g.moveTo(cx - 46, baseY - 8);
  g.quadraticCurveTo(cx - 20 + lean, baseY + TAIL_H * 0.55, cx - 6 + lean * 1.5, baseY + TAIL_H);
  g.quadraticCurveTo(cx + 16 + lean, baseY + TAIL_H * 0.4, cx + 44, baseY - 8);
  g.closePath();
}

function makeTexture(text, accent) {
  const key = text + '|' + accent;
  if (_cache.has(key)) return _cache.get(key);

  const measure = document.createElement('canvas').getContext('2d');
  const FONT = '800 62px "Arial Black", "Helvetica Neue", Impact, sans-serif';
  measure.font = FONT;
  const lines = wrap(measure, text, 620);
  const textW = Math.max(...lines.map(l => measure.measureText(l).width));
  const textH = lines.length * LINE_H;

  const w = Math.ceil((textW + PAD_X * 2 + 90) / 4) * 4;
  const h = Math.ceil((textH + PAD_Y * 2 + TAIL_H + 70) / 4) * 4;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const rnd = seeded(text);

  const cx = w / 2;
  const bodyH = textH + PAD_Y * 2;
  const cy = 34 + bodyH / 2;
  const rx = (textW + PAD_X * 2) / 2;
  const ry = bodyH / 2;

  // ---- the ink pass -------------------------------------------------------
  // Body and tail are stroked TOGETHER, three times with sub-pixel offsets, so
  // the line has the weight and slight doubling of a drawn one instead of the
  // dead evenness of a single vector stroke.
  g.lineJoin = g.lineCap = 'round';
  for (const [ox, oy, lw, alpha] of [[0, 0, 15, 1], [1.6, -1.2, 11, 0.75], [-1.4, 1.4, 9, 0.6]]) {
    g.save();
    g.translate(ox, oy);
    g.strokeStyle = `rgba(8,9,14,${alpha})`;
    g.lineWidth = lw;
    tailPath(g, cx, cy + ry - 6, seeded(text));
    g.stroke();
    bubblePath(g, cx, cy, rx, ry, seeded(text));
    g.stroke();
    g.restore();
  }

  // ---- the paper ----------------------------------------------------------
  g.fillStyle = PAPER;
  tailPath(g, cx, cy + ry - 6, seeded(text));
  g.fill();
  bubblePath(g, cx, cy, rx, ry, seeded(text));
  g.fill();

  // The accent band: a thin inner ring in the character's colour. Kept inside
  // the ink and well away from the text, so it identifies the speaker without
  // ever being the thing legibility depends on.
  g.save();
  bubblePath(g, cx, cy, rx - 13, ry - 13, seeded(text));
  g.strokeStyle = accent;
  g.lineWidth = 5;
  g.globalAlpha = 0.85;
  g.stroke();
  g.restore();

  // ---- the text -----------------------------------------------------------
  // THREE PASSES, and the order matters. This quad is MINIFIED hard — at
  // fighting-game distance a 62px glyph lands on maybe a dozen screen pixels,
  // and the mip chain averages a thin black stem against a white page straight
  // to mid-grey. The first version of this did exactly that and read as a
  // smudge from anywhere further than a throw away.
  //
  //   1. a white halo, kept NARROW. A wide centred stroke eats inward from the
  //      glyph outline as much as it grows outward, and on a bold face that is
  //      most of the stem — which is what made pass one look thin.
  //   2. black FILL
  //   3. black STROKE over the fill, which is the actual fix: it fattens every
  //      stem by a couple of pixels, so there is enough black left after four
  //      mip levels of averaging for the word to survive.
  g.font = FONT;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = g.lineCap = 'round';
  const top = cy - textH / 2 + LINE_H / 2;
  lines.forEach((line, i) => {
    const y = top + i * LINE_H;
    g.strokeStyle = PAPER; g.lineWidth = 6; g.strokeText(line, cx, y);
    g.fillStyle = INK; g.fillText(line, cx, y);
    g.strokeStyle = INK; g.lineWidth = 4.5; g.strokeText(line, cx, y);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const out = { tex, aspect: w / h };
  _cache.set(key, out);
  return out;
}

// Pop-in with a snap, hold, fade. The overshoot is doing the "snap": the quad
// arrives 14% too big and settles back over three frames, which is what stops a
// scale-from-zero reading as a fade-in.
const POP = 0.13, FADE = 0.26;

export class BubbleSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.live = [];        // {mesh, fighter, t, hold, aspect, anchor}
  }

  // `fighter` may be any object with `pos` and `hurtBox` — the victory screen
  // and the character-select preview both pass in stand-ins rather than real
  // Fighters, which is why nothing here touches the state machine.
  // `cam` is the eye this bubble BILLBOARDS TO. It matters only in split-screen,
  // where there is more than one, and the caller passes the taunting fighter's
  // OWN eye — see the note in `update`.
  say(fighter, text, { hold = 1.4, accent = '#ff5f74', cam = null } = {}) {
    if (!text) return null;
    this.clearFor(fighter);
    const { tex, aspect } = makeTexture(text, accent);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(aspect, 1),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthTest: false, depthWrite: false,
        toneMapped: false,                     // the grade pass owns the look
        // DOUBLE-SIDED, and this is not cosmetic. The quad billboards to ONE
        // camera; on a single-sided plane every other eye in a split-screen
        // match sees the back face, which is to say sees NOTHING. Caught by
        // shooting the same taunt from the opposite side and finding an empty
        // sky where the bubble was. Double-siding costs nothing and turns the
        // worst case from "invisible" into "read at an angle".
        side: THREE.DoubleSide
      }));
    mesh.renderOrder = 900;                    // over the world, over the FX
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    const b = { mesh, fighter, t: 0, hold, aspect, cam };
    this.live.push(b);
    return b;
  }

  clearFor(fighter) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      if (this.live[i].fighter === fighter) this._kill(i);
    }
  }

  // An interrupted taunt kills the bubble IMMEDIATELY — no fade. That is the
  // read: the hit landed and the line was cut off mid-word.
  cut(fighter) { this.clearFor(fighter); }

  _kill(i) {
    const b = this.live[i];
    this.scene.remove(b.mesh);
    b.mesh.geometry.dispose();
    b.mesh.material.dispose();               // the TEXTURE is cached, not owned
    this.live.splice(i, 1);
  }

  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const b = this.live[i];
      // THE EYE THIS BUBBLE BELONGS TO. One shared scene is rendered once per
      // eye, so a billboard can only face one of them — and the right one to
      // pick is the TAUNTING PLAYER'S own. They are the person who pressed the
      // button and the person watching their own joke land; they get it dead
      // on. Other seats see it turned, and (being double-sided) still see it.
      const cam = b.cam || this.camera;
      b.t += dt;
      const f = b.fighter;

      // ---- anchor -------------------------------------------------------
      // Off the hurt capsule rather than a constant, so it sits correctly over
      // Mahoraga and over a stage-3 Kurourushi (whose capsule scales with
      // growth) without either of them needing a special case.
      const hb = f.hurtBox || { center: 1.05, height: 1.45 };
      const headY = (f.pos?.y ?? 0) + hb.center + hb.height * 0.5;

      // ---- scale --------------------------------------------------------
      const dist = cam.position.distanceTo(
        new THREE.Vector3(f.pos.x, headY, f.pos.z));
      // Near-constant screen size, clamped at both ends (see the header note).
      // The floor is what keeps it legible in a tight interior where the camera
      // is 3 m away; the ceiling is what stops it swallowing the screen on the
      // Mahoraga and grown-Kurourushi pull-backs, where `dist` gets large.
      const s = Math.min(2.4, Math.max(0.95, dist * 0.102));

      // ---- the life curve ------------------------------------------------
      let k = 1, alpha = 1;
      if (b.t < POP) {
        const u = b.t / POP;
        k = 0.28 + 1.14 * u * (2 - u);          // overshoot to ~1.14
        alpha = Math.min(1, u * 2.4);
      } else if (b.t < POP + 0.09) {
        k = 1.14 - 0.14 * ((b.t - POP) / 0.09); // settle back
      } else if (b.t > POP + b.hold) {
        const u = (b.t - POP - b.hold) / FADE;
        if (u >= 1) { this._kill(i); continue; }
        alpha = 1 - u;
        k = 1 + u * 0.06;                        // drifts very slightly larger
      }

      b.mesh.material.opacity = alpha;
      b.mesh.position.set(f.pos.x, headY + 0.34 * s * k + 0.5 * s * k, f.pos.z);
      b.mesh.scale.set(s * k, s * k, s * k);
      // Billboard off the MAIN camera, the same rule every other world-space
      // readout in this project follows (the curse HP bars, the reach markers).
      // In split-screen that means the off-eye sees the bubble slightly turned
      // rather than dead-on; it stays legible because the quad is textured on
      // both faces of a plane facing the shared camera, and a per-eye copy
      // would mean four canvases per bubble for a difference the players do not
      // look at while reading a joke.
      b.mesh.quaternion.copy(cam.quaternion);
    }
  }

  dispose() {
    while (this.live.length) this._kill(this.live.length - 1);
  }
}
