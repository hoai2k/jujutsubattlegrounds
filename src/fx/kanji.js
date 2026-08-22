// THE WORD MADE PHYSICAL — extruded Japanese calligraphy as real geometry.
//
// When Inumaki speaks, the command he says leaves his mouth as the KANJI FOR
// THAT WORD, built as honest 3D solids with depth and thickness, lit by the
// same toon shader the fighters are, wearing the same inverted-hull outline,
// tumbling as they cross the room. Not a billboard. Not a sprite sheet. The
// glyph has a back face, and if the camera swings behind a command in flight
// you see it edge-on.
//
// ---------------------------------------------------------------------------
// HOW A GLYPH BECOMES GEOMETRY WITHOUT SHIPPING A FONT
// ---------------------------------------------------------------------------
// The project rule is absolute: every asset is authored in code, and the only
// binaries in the repo are the music tracks. A .ttf would break that, and
// hand-authoring stroke data for 潰 and 爆 would produce something that is
// either wrong or illegible, which is worse than not doing it.
//
// So the glyphs are TRACED AT RUNTIME:
//
//   1. The character is drawn once into an offscreen 2D canvas at 192px in
//      whatever CJK face the browser has.
//   2. The alpha channel is thresholded into a bitmask.
//   3. The mask is FLOOD-FILL LABELLED into connected components — the ON
//      components are the strokes, and the enclosed OFF components are the
//      counters inside 目, 口, 田 and friends — and each one's boundary is
//      walked with MOORE-NEIGHBOUR TRACING.
//   4. Rings are simplified (Ramer-Douglas-Peucker), each counter is assigned
//      to the stroke that encloses it, and both are handed to THREE.Shape.
//   5. ExtrudeGeometry gives them depth and a bevel, so the front face, the
//      bevel and the side wall all take the toon bands differently and the
//      glyph reads as a carved slab rather than a decal.
//
// The result is a real mesh built from nothing but code and whatever font the
// machine already has. Nothing is written to disk and nothing is downloaded.
//
// EVERY GLYPH IS CACHED by (character, depth) — a command fires the same three
// or four characters over and over, and tracing is the one expensive step.
//
// THE FALLBACK MATTERS. A machine with no CJK font traces an empty mask, and
// an empty mask must not produce an invisible command: `blockGlyph` builds a
// bold abstract seal-slab instead, so the effect degrades to "an unreadable
// cursed sigil flew at me" rather than to "nothing happened".
import * as THREE from 'three';
import { MAT } from '../art/shaders/toon.js';
import { outlineMaterial } from '../art/shaders/outline.js';

const CANVAS_PX = 192;         // trace resolution — high enough for 爆, cheap enough to be free
const ALPHA_CUT = 128;
const RDP_EPS = 1.1;           // contour simplification, in canvas pixels
const FONT_STACK = '"Noto Sans JP","Yu Gothic","Hiragino Kaku Gothic ProN","MS Gothic","Meiryo",sans-serif';

const shapeCache = new Map();   // char -> THREE.Shape[]
const geoCache = new Map();     // char|depth -> BufferGeometry

// ---------------------------------------------------------------------------
// 1-2. RASTERISE
// ---------------------------------------------------------------------------
function rasterise(ch) {
  if (typeof document === 'undefined') return null;
  const cv = document.createElement('canvas');
  cv.width = cv.height = CANVAS_PX;
  const g = cv.getContext('2d', { willReadFrequently: true });
  if (!g) return null;
  g.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // 0.76 leaves a margin all round, which the tracer needs: a stroke that
  // touches the canvas edge would be labelled as reaching the border, and the
  // border test is exactly what tells a counter from the outside world.
  g.font = Math.round(CANVAS_PX * 0.76) + 'px ' + FONT_STACK;
  g.fillText(ch, CANVAS_PX / 2, CANVAS_PX / 2);
  const data = g.getImageData(0, 0, CANVAS_PX, CANVAS_PX).data;
  const mask = new Uint8Array(CANVAS_PX * CANVAS_PX);
  let on = 0;
  for (let i = 0, p = 3; i < mask.length; i++, p += 4) {
    if (data[p] >= ALPHA_CUT) { mask[i] = 1; on++; }
  }
  // A glyph that covers under 1% of the canvas is a tofu box, a space, or a
  // missing font. Treat all three as "no glyph" and take the fallback.
  return on > mask.length * 0.01 ? mask : null;
}

// ---------------------------------------------------------------------------
// 3. CONNECTED COMPONENTS, THEN MOORE BOUNDARY TRACING
// ---------------------------------------------------------------------------
// The first version of this used marching squares, and it did not work: on 潰
// at 146 px it produced ONE HUNDRED AND ONE fragments of eighty points each
// instead of a dozen clean stroke outlines, because the walk's `seen` marking
// terminated a contour every time it met a cell another contour had already
// touched. Every glyph in the game rendered as the abstract fallback slab and
// the effect's whole signature — "you can read the word that is flying at
// you" — was silently missing. It looked deliberate, which is why it survived
// as long as it did.
//
// The replacement is the boring, correct pair:
//
//   1. FLOOD-FILL LABELLING (4-connected) over the mask. ON components are the
//      strokes; OFF components that do NOT touch the canvas edge are the
//      counters inside 目, 口, 田 and the rest.
//   2. MOORE-NEIGHBOUR TRACING around each component, started from its
//      top-left-most pixel (whose west and north neighbours are guaranteed
//      outside it, which is what makes the initial backtrack direction safe).
//
// This produces exactly one closed ring per stroke and one per counter, in the
// right order, every time — and it does not care how thin the strokes get.
const N = CANVAS_PX;

// Clockwise in screen space (y grows downward): E, SE, S, SW, W, NW, N, NE.
const DIRS8 = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

function labelComponents(mask, target) {
  const lab = new Int32Array(N * N).fill(-1);
  const comps = [];
  const stack = [];
  for (let i = 0; i < N * N; i++) {
    if (mask[i] !== target || lab[i] !== -1) continue;
    const id = comps.length;
    const c = { id, area: 0, start: i, border: false };
    lab[i] = id;
    stack.push(i);
    while (stack.length) {
      const q = stack.pop();
      c.area++;
      const x = q % N, y = (q / N) | 0;
      if (x === 0 || y === 0 || x === N - 1 || y === N - 1) c.border = true;
      if (x > 0 && mask[q - 1] === target && lab[q - 1] === -1) { lab[q - 1] = id; stack.push(q - 1); }
      if (x < N - 1 && mask[q + 1] === target && lab[q + 1] === -1) { lab[q + 1] = id; stack.push(q + 1); }
      if (y > 0 && mask[q - N] === target && lab[q - N] === -1) { lab[q - N] = id; stack.push(q - N); }
      if (y < N - 1 && mask[q + N] === target && lab[q + N] === -1) { lab[q + N] = id; stack.push(q + N); }
    }
    comps.push(c);
  }
  return { lab, comps };
}

// The boundary ring of one labelled component, as pixel coordinates.
function traceComponent(lab, id, start) {
  const pts = [];
  const sx = start % N, sy = (start / N) | 0;
  let px = sx, py = sy;
  // The start pixel is the component's first in row-major order, so its WEST
  // neighbour is outside it — which makes W (index 4) a valid initial
  // backtrack direction without having to search for one.
  let back = 4;
  const guard = N * N * 4;
  for (let step = 0; step < guard; step++) {
    pts.push([px, py]);
    let nx = -1, ny = -1, foundDir = -1;
    for (let k = 1; k <= 8; k++) {
      const dir = (back + k) % 8;
      const tx = px + DIRS8[dir][0], ty = py + DIRS8[dir][1];
      if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
      if (lab[ty * N + tx] !== id) continue;
      nx = tx; ny = ty; foundDir = dir;
      break;
    }
    if (foundDir < 0) break;                 // a single isolated pixel
    back = (foundDir + 4) % 8;               // point back the way we came
    px = nx; py = ny;
    if (px === sx && py === sy) break;       // closed
  }
  return pts;
}

function traceContours(mask) {
  const on = labelComponents(mask, 1);
  const off = labelComponents(mask, 0);
  // A stroke has to be worth drawing: under ~0.05% of the canvas is an
  // antialiasing crumb, and extruding it costs more than it shows.
  const MIN_AREA = Math.max(12, (N * N) * 0.0005);
  const shells = on.comps
    .filter(c => c.area >= MIN_AREA)
    .map(c => ({ ring: traceComponent(on.lab, c.id, c.start), area: c.area, hole: false }))
    .filter(r => r.ring.length > 7);
  // A counter is an OFF component that does NOT reach the canvas edge — which
  // is precisely the definition of "enclosed", and needs no geometry at all.
  const holes = off.comps
    .filter(c => !c.border && c.area >= MIN_AREA * 0.5)
    .map(c => ({ ring: traceComponent(off.lab, c.id, c.start), area: c.area, hole: true }))
    .filter(r => r.ring.length > 7);
  return { shells, holes };
}

// ---------------------------------------------------------------------------
// 4. SIMPLIFY
// ---------------------------------------------------------------------------
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let maxD = 0, idx = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  return rdp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(pts.slice(idx), eps));
}

function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1])
      && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi + 1e-9) + xi) inside = !inside;
  }
  return inside;
}

// Canvas space (y down, 0..N) -> glyph space (y up, centred, roughly -0.5..0.5)
const toGlyph = ([x, y]) => new THREE.Vector2(x / N - 0.5, 0.5 - y / N);

function shapesFor(ch) {
  if (shapeCache.has(ch)) return shapeCache.get(ch);
  let shapes = [];
  const mask = rasterise(ch);
  if (mask) {
    const { shells, holes } = traceContours(mask);
    const simp = r => rdp(r, RDP_EPS);
    // biggest first, so a counter is always tested against the stroke that
    // owns it before any smaller stroke that merely overlaps its bounding box
    const S = shells.map(r => ({ ...r, ring: simp(r.ring) }))
      .filter(r => r.ring.length > 3)
      .sort((a, b) => b.area - a.area)
      .map(r => ({ ring: r.ring, holes: [] }));
    for (const h of holes) {
      const ring = simp(h.ring);
      if (ring.length < 4) continue;
      const probe = ring[(ring.length / 3) | 0];
      const owner = S.find(sh => pointInPoly(probe, sh.ring));
      if (owner) owner.holes.push(ring);
    }
    shapes = S.map(sh => {
      const shape = new THREE.Shape(sh.ring.map(toGlyph));
      for (const h of sh.holes) shape.holes.push(new THREE.Path(h.map(toGlyph)));
      return shape;
    });
  }
  if (!shapes.length) shapes = [blockShape(ch)];
  shapeCache.set(ch, shapes);
  return shapes;
}

// THE FALLBACK. Not a rectangle — a seal-stone slab with a notched corner and a
// window through it, so that on a machine with no CJK font the command still
// arrives as an object with a silhouette rather than as a blank tile.
function blockShape(ch) {
  const n = (ch.codePointAt(0) ?? 0) % 4;
  const s = new THREE.Shape();
  const w = 0.40, h = 0.46, cut = 0.10 + n * 0.02;
  s.moveTo(-w, -h);
  s.lineTo(w - cut, -h);
  s.lineTo(w, -h + cut);
  s.lineTo(w, h);
  s.lineTo(-w + cut, h);
  s.lineTo(-w, h - cut);
  s.closePath();
  const hole = new THREE.Path();
  const iw = 0.18, ih = 0.13 + n * 0.03;
  hole.moveTo(-iw, -ih); hole.lineTo(iw, -ih); hole.lineTo(iw, ih); hole.lineTo(-iw, ih);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

// ---------------------------------------------------------------------------
// 5. EXTRUDE
// ---------------------------------------------------------------------------
export function glyphGeometry(ch, depth = 0.16) {
  const key = ch + '|' + depth;
  if (geoCache.has(key)) return geoCache.get(key);
  const geo = new THREE.ExtrudeGeometry(shapesFor(ch), {
    depth, bevelEnabled: true,
    bevelThickness: depth * 0.30, bevelSize: 0.012, bevelSegments: 2,
    curveSegments: 1, steps: 1
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  geoCache.set(key, geo);
  return geo;
}

// ---------------------------------------------------------------------------
// ONE GLYPH, AS A SCENE OBJECT
// ---------------------------------------------------------------------------
// Two materials on purpose. The body is `metal` — the highest gloss and the
// hardest rim in the toon set, which is what makes an edge-lit slab of a
// character read across a dark room. On top of it sits an EMISSIVE CORE mesh,
// very slightly inset, that carries the command colour at full brightness so
// the glyph survives a domain's colour grade (see the domain audit note).
//
// `scale` is the glyph's height in metres.
export function makeGlyph(ch, {
  color = 0xffffff, scale = 1.0, depth = 0.16, outline = true, glow = 1
} = {}) {
  const g = new THREE.Group();
  const geo = glyphGeometry(ch, depth);
  const body = new THREE.Mesh(geo, MAT.metal({
    vertexColors: false, color, rimColor: 0xffffff, emissive: color, emissiveIntensity: 0.45 * glow
  }));
  g.add(body);
  // THE CORE. Same geometry, drawn additively, so the stroke centres lift. It
  // is what keeps the word legible inside Gojo's black void and Jogo's red one.
  //
  // THE OPACITY IS 0.20 AND IT USED TO BE 0.55, WHICH WAS THE BUG. A kanji is
  // mostly thin strokes; blown out additively at half opacity they fuse into
  // one glowing lozenge and the word becomes an abstract slab at any distance
  // past four metres. Same failure the hair cards had, arrived at from the
  // other direction — see the note on the fringe in art/models/inumaki.js.
  const core = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.20 * glow, blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  core.scale.setScalar(0.99);
  g.add(core);
  if (outline) {
    // ...and the outline was 0.018, which is THICKER THAN THE STROKES. The
    // inverted hull grows along the normals, so at that thickness every
    // counter in 潰 filled in solid. It has to stay well under the stroke
    // width or the outline IS the glyph.
    const hull = new THREE.Mesh(geo, outlineMaterial({ color: 0x07060c, thickness: 0.0055 }));
    g.add(hull);
  }
  g.scale.setScalar(scale);
  g.userData.body = body;
  g.userData.core = core;
  return g;
}

// A whole command: every character of `text`, laid out along the caster's
// right so the word reads left-to-right from the fight camera, each glyph on
// its own transform so they can tumble independently.
export function makeWord(text, opts = {}) {
  const chars = [...text];
  const scale = opts.scale ?? 1.0;
  const gap = (opts.gap ?? 1.14) * scale;
  const g = new THREE.Group();
  const off = (chars.length - 1) / 2;
  chars.forEach((ch, i) => {
    const m = makeGlyph(ch, opts);
    m.position.x = (i - off) * gap;
    m.userData.idx = i;
    // a tiny per-glyph rest tilt, so a word never reads as a decal even before
    // the wobble starts. Stored as `rest` because the wobble in fx/speechfx.js
    // oscillates AROUND it rather than replacing it.
    m.userData.rest = ((i % 2) ? 1 : -1) * 0.045;
    m.rotation.z = m.userData.rest;
    g.add(m);
  });
  g.userData.glyphs = g.children.slice();
  return g;
}

// Dispose the meshes of a word without touching the shared cached geometry.
export function disposeWord(node) {
  node.traverse(o => { if (o.isMesh && o.material) o.material.dispose?.(); });
}
