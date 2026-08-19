// CREATURE TEXTURES — the procedural surface library for everything in the
// game that is summoned rather than played.
//
// ========================== WHY THIS FILE EXISTS ==========================
// Three families of creature — Megumi's shikigami, Mahito's transfigured
// humans and Geto's cursed spirits — used to be carried entirely by geometry
// and flat vertex colours. That works for a silhouette and it does not work
// for a design: Max Elephant's whole read is the ORNAMENT painted across its
// hide, the Great Serpent's is BANDING, Nue's is PLUMAGE, and none of those
// survive being approximated with extra spheres.
//
// So every creature that needs pattern gets a real canvas texture, drawn once
// at runtime and cached forever. Nothing is loaded from a file — the project
// rule (CLAUDE.md) is that nothing rendered inside the game comes from disk,
// and the map kit (arena/kit.js) already established the canvas path. This is
// the same idea aimed at bodies instead of buildings.
//
// ============================ THE THREE RULES =============================
// 1. CACHED BY KEY. `tex()` memoizes on the key string, so the twenty-two
//    rabbits of a Rabbit Escape swarm and the four Agito components all share
//    one canvas each. A texture is generated at most once per page load.
// 2. UV-PROJECTED ON DEMAND. Half the geometry toolkit (tubeBetween,
//    coneSpike) emits position+normal only. `projectUV` fills in a spherical
//    or cylindrical parameterisation so a tapered tube can carry banding.
//    Without this every tube in the project renders as flat `color`.
// 3. ONE SHADING RESPONSE PER FAMILY. The palettes diverge wildly — that is
//    the brief — but the material archetypes below keep the whole cast inside
//    one lighting language, which is what stops the roster looking like three
//    projects stapled together.
// =========================================================================
import * as THREE from 'three';
import { toonMaterial } from '../shaders/toon.js';
import { rand } from '../../core/mathutil.js';

// ---------------------------------------------------------------------------
// the cache
// ---------------------------------------------------------------------------
const _cache = new Map();
export const texStats = { generated: 0, hits: 0, pixels: 0 };

// `draw(ctx, size)` paints the square. `repeat` tiles it across the UV space.
export function tex(key, size, draw, { repeat = [1, 1], wrap = true } = {}) {
  const ck = key + '|' + repeat.join(',');
  const hit = _cache.get(ck);
  if (hit) { texStats.hits++; return hit; }
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  _cache.set(ck, t);
  texStats.generated++;
  texStats.pixels += size * size;
  return t;
}

// Debug/report hook — the performance section of the delivery notes reads this.
export function textureReport() {
  return {
    entries: _cache.size, generated: texStats.generated, reuses: texStats.hits,
    megapixels: +(texStats.pixels / 1e6).toFixed(2)
  };
}

// ---------------------------------------------------------------------------
// UV PROJECTION
// ---------------------------------------------------------------------------
// `tubeBetween` and `coneSpike` build their rings by hand and never write a uv
// attribute; `mergeGeos` actively strips uvs so mixed sets can merge. Either
// way a textured mesh needs one, and a projection is both cheaper and more
// controllable here than teaching the builders to emit their own.
//
//   'sphere' — angle around Y for u, height for v. Bodies, heads, blobs.
//   'cylY'   — angle around Y for u, world y for v. Legs, necks, trunks.
//   'cylZ'   — angle around Z for u, world z for v. Serpent links, tails.
//   'planarXY' / 'planarXZ' — flat unwrap. Wings, fins, ears, membranes.
//
// `scale` sets how many times the texture repeats over the projected extent,
// which is what keeps a 4 m elephant flank and a 0.2 m rabbit ear carrying
// pattern at the same apparent density.
export function projectUV(geo, mode = 'sphere', { scale = [1, 1], offset = [0, 0] } = {}) {
  const pos = geo.getAttribute('position');
  const n = pos.count;
  const uv = new Float32Array(n * 2);
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const spanY = Math.max(1e-4, bb.max.y - bb.min.y);
  const spanZ = Math.max(1e-4, bb.max.z - bb.min.z);
  const spanX = Math.max(1e-4, bb.max.x - bb.min.x);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    let u = 0, v = 0;
    switch (mode) {
      case 'cylY':
        u = (Math.atan2(z, x) / (Math.PI * 2)) + 0.5;
        v = (y - bb.min.y) / spanY;
        break;
      case 'cylZ':
        u = (Math.atan2(y, x) / (Math.PI * 2)) + 0.5;
        v = (z - bb.min.z) / spanZ;
        break;
      case 'planarXY':
        u = (x - bb.min.x) / spanX;
        v = (y - bb.min.y) / spanY;
        break;
      case 'planarXZ':
        u = (x - bb.min.x) / spanX;
        v = (z - bb.min.z) / spanZ;
        break;
      default: {
        const r = Math.hypot(x, y, z) || 1e-4;
        u = (Math.atan2(z, x) / (Math.PI * 2)) + 0.5;
        v = 1 - Math.acos(Math.max(-1, Math.min(1, y / r))) / Math.PI;
        break;
      }
    }
    uv[i * 2] = u * scale[0] + offset[0];
    uv[i * 2 + 1] = v * scale[1] + offset[1];
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

// ---------------------------------------------------------------------------
// MATERIAL ARCHETYPES
// ---------------------------------------------------------------------------
// Every summoned creature in the game shades through one of these, which is
// the "family" half of the brief: the palettes are wildly different and the
// LIGHTING RESPONSE is not. Each is a texture-carrying variant of the
// vocabulary art/shaders/toon.js already established for the playable cast.
const _mats = new Map();
function cachedMat(key, make) {
  let m = _mats.get(key);
  if (!m) { m = make(); _mats.set(key, m); }
  return m;
}

// THE SHARED SHIKIGAMI RIM. Every Ten Shadows creature keeps the cool
// shadow-blue edge the family had when they were black silhouettes — that rim
// is what still reads them as one set now that the bodies underneath are
// coloured. This is the single most important line in the file for Part 0.
export const SHIKI_RIM = 0x8fb6d8;
export const CURSE_RIM = 0x9f7fd0;
export const FLESH_RIM = 0x8b9bab;

// hide / fur / feather: matte, five bands, broad early rim (the fur response
// art/shaders/toon.js documents, aimed at animals rather than at Panda)
export function pelt(map, o = {}) {
  return cachedMat('pelt' + (map?.uuid ?? 'flat') + JSON.stringify(o), () => toonMaterial({
    vertexColors: false, color: 0xffffff, map,
    steps: [96, 138, 178, 218, 255], rim: 0.46, rimStart: 0.56, gloss: 0.0,
    rimColor: SHIKI_RIM, warm: 0x30261c, cool: 0x141c2e, ...o
  }));
}
// scale / chitin / carapace: tight bands, hard early rim, a little gloss
export function scaleMat(map, o = {}) {
  return cachedMat('scale' + (map?.uuid ?? 'flat') + JSON.stringify(o), () => toonMaterial({
    vertexColors: false, color: 0xffffff, map,
    steps: [70, 126, 190, 255], rim: 0.44, rimStart: 0.62, gloss: 0.22,
    rimColor: SHIKI_RIM, warm: 0x2a2418, cool: 0x121c30, ...o
  }));
}
// wet amphibian / soft cursed flesh: high floor, broad rim, glossy
export function dermis(map, o = {}) {
  return cachedMat('derm' + (map?.uuid ?? 'flat') + JSON.stringify(o), () => toonMaterial({
    vertexColors: false, color: 0xffffff, map,
    steps: [88, 150, 210, 255], rim: 0.38, rimStart: 0.60, gloss: 0.34,
    rimColor: SHIKI_RIM, warm: 0x2c2620, cool: 0x101a2a, ...o
  }));
}
// bone / tusk / mask: near-white, hard three-band, no gloss
export function boneMat(map, o = {}) {
  return cachedMat('bone' + (map?.uuid ?? 'flat') + JSON.stringify(o), () => toonMaterial({
    vertexColors: false, color: 0xffffff, map,
    steps: [120, 186, 255], rim: 0.30, rimStart: 0.70, gloss: 0.05,
    rimColor: 0xdfe8f4, warm: 0x33291c, cool: 0x181f2e, ...o
  }));
}
// a flat unlit accent — glowing eyes, cursed-energy marks, mouth interiors
export function glow(color, opacity = 0.55, additive = true) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    side: THREE.DoubleSide
  });
}
export function voidMat(color = 0x120a10) {
  return cachedMat('void' + color, () => new THREE.MeshBasicMaterial({ color }));
}

// ---------------------------------------------------------------------------
// DRAWING PRIMITIVES
// ---------------------------------------------------------------------------
// Small helpers the painters below share. They exist so a marking is written
// once as "a comma-shaped magatama stroke" rather than four times as bezier
// coordinates, which is how the ornament on Max Elephant stayed authorable.
function fill(g, S, css) { g.fillStyle = css; g.fillRect(0, 0, S, S); }

function speckle(g, S, n, colorFn, sizeFn) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colorFn(i);
    const r = sizeFn(i);
    g.beginPath();
    g.arc(rand(0, S), rand(0, S), r, 0, 6.2832);
    g.fill();
  }
}

// A short hair/fibre stroke — the thing that makes a flat fill read as pelt
// rather than as paint. Direction is mostly vertical in UV space, which after
// a cylindrical projection runs along the animal.
function fibres(g, S, n, colorFn, len = 14, jitter = 0.5) {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = rand(0, S), y = rand(0, S);
    const a = -Math.PI / 2 + rand(-jitter, jitter);
    const L = len * rand(0.5, 1.5);
    g.strokeStyle = colorFn(i);
    g.lineWidth = rand(0.8, 2.4);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + rand(-3, 3), y + Math.sin(a) * L * 0.5,
      x + Math.cos(a) * L, y + Math.sin(a) * L);
    g.stroke();
  }
}

// THE MAGATAMA COMMA. Almost every Ten Shadows marking — the Divine Dogs'
// three dots, the jewel symbols on the Serpent, Deer, Ox and Elephant — is a
// comma-shaped tomoe/magatama, and drawing it properly instead of as a circle
// is most of what makes the ornament read as Japanese rather than as tribal.
export function magatama(g, cx, cy, r, rot, css) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  g.fillStyle = css;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.fill();
  // the tail: a tapering hook sweeping off the head
  g.beginPath();
  g.moveTo(0, -r);
  g.quadraticCurveTo(r * 2.3, -r * 1.5, r * 2.9, r * 0.5);
  g.quadraticCurveTo(r * 2.0, -r * 0.15, 0, r);
  g.closePath();
  g.fill();
  g.restore();
}

// A ring of three magatama, which is the mitsudomoe the shikigami markings are
// built out of.
export function mitsudomoe(g, cx, cy, r, css) {
  for (let i = 0; i < 3; i++) magatama(g, cx, cy, r * 0.42, (i / 3) * Math.PI * 2, css);
}

// A soft irregular blotch — patchy skin, lichen, discoloration.
function blotch(g, cx, cy, r, css, lobes = 7) {
  g.fillStyle = css;
  g.beginPath();
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const rr = r * (0.62 + Math.sin(i * 2.7) * 0.2 + rand(0, 0.28));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
}

// ---------------------------------------------------------------------------
// THE PAINTERS
// ---------------------------------------------------------------------------
// Each returns a cached THREE.CanvasTexture. Everything below is authored
// against the reference sheet in the model file that calls it — the notes here
// say what the pattern IS, the notes there say why that creature has it.

// ---- FUR ------------------------------------------------------------------
// Layered fibre passes over a base, with an optional darker dorsal band. Used
// for the Divine Dogs, the rabbits, the Ox, the Deer and Tiger Funeral.
export function furTex(key, { base, tip, under, dorsal = null, density = 2200, S = 256 } = {}) {
  return tex('fur:' + key, S, (g, s) => {
    fill(g, s, base);
    // undercoat blotching so the flat fill is never visible as a flat fill
    for (let i = 0; i < 26; i++) blotch(g, rand(0, s), rand(0, s), rand(s * 0.05, s * 0.16), under + '55');
    if (dorsal) {
      // a darker stripe down the animal's back: in cylindrical UV that is a
      // horizontal band at v ~ 0.5, which after projection lands on the spine
      const grad = g.createLinearGradient(0, s * 0.18, 0, s * 0.82);
      grad.addColorStop(0, dorsal + '00');
      grad.addColorStop(0.5, dorsal + 'aa');
      grad.addColorStop(1, dorsal + '00');
      g.fillStyle = grad;
      g.fillRect(0, s * 0.18, s, s * 0.64);
    }
    fibres(g, s, density, () => (Math.random() < 0.45 ? tip : under) + (Math.random() < 0.5 ? '66' : '33'),
      s * 0.055, 0.42);
    fibres(g, s, density * 0.25, () => tip + '88', s * 0.03, 0.7);
  }, { repeat: [1, 1] });
}

// ---- SCALES ---------------------------------------------------------------
// Overlapping half-round scutes in offset rows, with a banded overlay. This is
// the Great Serpent's whole surface and it is also what the Agito tail and the
// dragon are built on.
export function scaleTex(key, { base, edge, dark, band = null, bandEvery = 0, rows = 20, S = 256 } = {}) {
  return tex('scale:' + key, S, (g, s) => {
    fill(g, s, base);
    const h = s / rows, w = h * 1.35;
    for (let r = -1; r <= rows; r++) {
      const off = (r % 2) * w * 0.5;
      for (let c = -1; c <= s / w + 1; c++) {
        const x = c * w + off, y = r * h;
        const v = rand(-14, 14) | 0;
        g.fillStyle = shade(base, v);
        g.beginPath();
        g.moveTo(x, y + h);
        g.quadraticCurveTo(x, y - h * 0.15, x + w * 0.5, y - h * 0.15);
        g.quadraticCurveTo(x + w, y - h * 0.15, x + w, y + h);
        g.closePath();
        g.fill();
        g.strokeStyle = edge + '55';
        g.lineWidth = 1;
        g.stroke();
      }
    }
    // the banding: irregular dark saddles crossing the scale field
    if (band && bandEvery > 0) {
      for (let i = 0; i < bandEvery; i++) {
        const y = (i / bandEvery) * s + rand(-6, 6);
        const hh = s / bandEvery * rand(0.16, 0.34);
        g.fillStyle = band + 'cc';
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= s; x += s / 8) g.lineTo(x, y + Math.sin(x * 0.05 + i) * hh * 0.35);
        for (let x = s; x >= 0; x -= s / 8) g.lineTo(x, y + hh + Math.cos(x * 0.04 + i) * hh * 0.3);
        g.closePath();
        g.fill();
      }
    }
    speckle(g, s, 220, () => dark + '33', () => rand(1, 4));
  }, { repeat: [1, 1] });
}

// ---- AMPHIBIAN ------------------------------------------------------------
// Wet mottled skin: a two-tone marbling with wart bumps and a pale ventral
// gradient. The Toad and the winged toads use it.
export function amphibianTex(key, { base, mottle, wart, belly, S = 256 } = {}) {
  return tex('amph:' + key, S, (g, s) => {
    fill(g, s, base);
    for (let i = 0; i < 40; i++) {
      blotch(g, rand(0, s), rand(0, s), rand(s * 0.04, s * 0.15), mottle + 'bb', 9);
    }
    // ventral pale: bottom of the v range, which projects to the underside
    const grad = g.createLinearGradient(0, s, 0, s * 0.55);
    grad.addColorStop(0, belly + 'ee');
    grad.addColorStop(1, belly + '00');
    g.fillStyle = grad;
    g.fillRect(0, s * 0.55, s, s * 0.45);
    // warts: a ring-lit bump reads as raised even on a flat cel band
    for (let i = 0; i < 130; i++) {
      const x = rand(0, s), y = rand(0, s * 0.7), r = rand(2, 7);
      g.fillStyle = wart + 'cc';
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
      g.fillStyle = '#ffffff22';
      g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, 6.2832); g.fill();
    }
    speckle(g, s, 300, () => mottle + '44', () => rand(1, 3));
  }, { repeat: [1, 1] });
}

// ---- PLUMAGE --------------------------------------------------------------
// Rows of overlapping feather tips. Nue's body and Agito's mane and arms.
export function featherTex(key, { base, tip, shaft, rows = 14, S = 256 } = {}) {
  return tex('feather:' + key, S, (g, s) => {
    fill(g, s, base);
    const h = s / rows, w = h * 0.85;
    for (let r = -1; r <= rows; r++) {
      const off = (r % 2) * w * 0.5;
      for (let c = -1; c <= s / w + 1; c++) {
        const x = c * w + off, y = r * h;
        g.fillStyle = shade(base, rand(-18, 20) | 0);
        g.beginPath();
        g.moveTo(x + w * 0.5, y);
        g.quadraticCurveTo(x + w * 1.05, y + h * 0.55, x + w * 0.5, y + h * 1.05);
        g.quadraticCurveTo(x - w * 0.05, y + h * 0.55, x + w * 0.5, y);
        g.closePath();
        g.fill();
        g.strokeStyle = tip + '66';
        g.lineWidth = 1.2;
        g.stroke();
        // the rachis down the middle of each feather
        g.strokeStyle = shaft + '55';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + w * 0.5, y + h * 0.05);
        g.lineTo(x + w * 0.5, y + h * 0.95);
        g.stroke();
      }
    }
  }, { repeat: [1, 1] });
}

// ---- ORNAMENT -------------------------------------------------------------
// THE MAX ELEPHANT MOTIF SET, factored out so the same four glyphs can be
// baked into a wrapping hide texture (the knee cuffs, where a cylindrical
// unwrap genuinely wraps) OR drawn on a transparent canvas and applied as a
// flat decal (the forehead, the crown and the spine, where it must land on an
// exact spot and no unwrap of a sphere will put it there without stretching).
//
// Learned the hard way: a spherical unwrap smears anything near the poles into
// a band, and a cylindrical unwrap of a SphereGeometry collapses its two
// z-facing caps. A marking that the reference describes as being "on the
// forehead" has to be placed, not projected.
export function drawOrnament(g, kind, cx, cy, r, c1, c2) {
  switch (kind) {
    case 'mitsudomoe':
      mitsudomoe(g, cx, cy, r, c1);
      g.strokeStyle = c2; g.lineWidth = r * 0.09;
      g.beginPath(); g.arc(cx, cy, r * 0.92, 0, 6.2832); g.stroke();
      break;
    case 'arcs':                       // stacked crescents — the crown/back motif
      for (let i = 0; i < 4; i++) {
        g.strokeStyle = i % 2 ? c2 : c1;
        g.lineWidth = r * (0.16 - i * 0.02);
        g.beginPath();
        g.arc(cx, cy + r * 0.4, r * (0.35 + i * 0.22), Math.PI * 1.12, Math.PI * 1.88);
        g.stroke();
      }
      break;
    case 'band':                       // a painted cuff with a hatched inner edge
      g.fillStyle = c1;
      g.fillRect(cx - r, cy - r * 0.34, r * 2, r * 0.68);
      g.fillStyle = c2;
      for (let i = 0; i < 9; i++) g.fillRect(cx - r + (i / 9) * r * 2, cy - r * 0.34, r * 0.09, r * 0.68);
      break;
    case 'rays': {                     // a sunburst — the forehead centrepiece
      g.fillStyle = c1;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.save(); g.translate(cx, cy); g.rotate(a);
        g.beginPath();
        g.moveTo(-r * 0.10, r * 0.30);
        g.lineTo(0, r);
        g.lineTo(r * 0.10, r * 0.30);
        g.closePath(); g.fill();
        g.restore();
      }
      g.fillStyle = c2;
      g.beginPath(); g.arc(cx, cy, r * 0.34, 0, 6.2832); g.fill();
      g.fillStyle = c1;
      g.beginPath(); g.arc(cx, cy, r * 0.18, 0, 6.2832); g.fill();
      break;
    }
    default:
      g.fillStyle = c1;
      g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fill();
  }
}

// One motif on a transparent square, ready to be hung on a body as a decal.
export function ornamentTex(kind, c1, c2, S = 256) {
  return tex('orn:' + kind + c1 + c2, S, (g, s) => {
    g.clearRect(0, 0, s, s);
    drawOrnament(g, kind, s / 2, s / 2, s * 0.42, c1, c2);
  }, { wrap: false });
}

// ---- ORNAMENTED HIDE ------------------------------------------------------
// THE MAX ELEPHANT SURFACE, and the one texture in this file that exists for a
// single creature. A pale wrinkled hide carrying a large painted ornament:
// concentric arcs, magatama rings and stroked bands, in the anime's yellow.
// `marks` is a list of {x, y, r, kind} in 0..1 UV space so the model file can
// place the ornament on the forehead, crown, back and knees exactly where the
// design has it.
export function hideTex(key, { base, crease, mark, mark2, marks = [], S = 512 } = {}) {
  return tex('hide:' + key, S, (g, s) => {
    fill(g, s, base);
    // hide creasing: a dense irregular crackle, the thing that says "elephant"
    // before any of the colour does
    g.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = rand(0, s), y = rand(0, s), a = rand(0, Math.PI * 2), L = rand(6, 30);
      g.strokeStyle = crease + (Math.random() < 0.5 ? '44' : '22');
      g.lineWidth = rand(0.6, 2.2);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.stroke();
    }
    for (let i = 0; i < 30; i++) blotch(g, rand(0, s), rand(0, s), rand(s * 0.03, s * 0.1), crease + '18');

    // THE ORNAMENT — only for surfaces whose unwrap genuinely wraps (limb
    // cuffs). Everything that has to land on a named spot is a decal instead;
    // see `ornamentTex`.
    for (const m of marks) {
      const cx = m.x * s, cy = m.y * s;
      g.save();
      g.translate(cx, cy);
      g.rotate(m.rot ?? 0);
      g.translate(-cx, -cy);
      drawOrnament(g, m.kind, cx, cy, m.r * s, m.alt ? mark2 : mark, m.alt ? mark : mark2);
      g.restore();
    }
  }, { repeat: [1, 1] });
}

// ---- CURSED FLESH ---------------------------------------------------------
// Geto's stable and Mahito's minions both live here: sickly uneven skin with
// visible seams, blooms of discoloration and a violet subdermal bloom. `seams`
// draws the stitched joins that make a transfigured human read as Mahito's
// work rather than as a generic mutant.
export function fleshTex(key, { base, blotchA, blotchB, seam = null, seams = 0, veins = 0, bloom = null, S = 256 } = {}) {
  return tex('flesh:' + key, S, (g, s) => {
    fill(g, s, base);
    for (let i = 0; i < 34; i++) {
      blotch(g, rand(0, s), rand(0, s), rand(s * 0.05, s * 0.2),
        (Math.random() < 0.5 ? blotchA : blotchB) + '88', 8);
    }
    if (bloom) {
      const grad = g.createRadialGradient(s * 0.62, s * 0.38, 0, s * 0.62, s * 0.38, s * 0.55);
      grad.addColorStop(0, bloom + '55');
      grad.addColorStop(1, bloom + '00');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    }
    // veins: branching thin lines, drawn as a two-generation walk
    for (let i = 0; i < veins; i++) {
      let x = rand(0, s), y = rand(0, s), a = rand(0, Math.PI * 2);
      g.strokeStyle = blotchB + '66';
      g.lineWidth = rand(0.8, 1.8);
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 7; k++) {
        a += rand(-0.7, 0.7);
        x += Math.cos(a) * rand(4, 12); y += Math.sin(a) * rand(4, 12);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // THE SEAMS. A dark join line with cross-stitches over it — the same
    // stitching language Mahito's own patchwork body uses, which is what makes
    // the whole set read as coming off one pair of hands.
    for (let i = 0; i < seams; i++) {
      const x0 = rand(0, s), y0 = rand(0, s), a = rand(0, Math.PI * 2), L = rand(s * 0.2, s * 0.7);
      const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L;
      g.strokeStyle = (seam ?? '#4a2f34') + 'cc';
      g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      const n = Math.max(3, (L / 11) | 0);
      g.lineWidth = 1.5;
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
        const px = -Math.sin(a) * 4.5, py = Math.cos(a) * 4.5;
        g.strokeStyle = (seam ?? '#4a2f34') + 'aa';
        g.beginPath();
        g.moveTo(cx - px - Math.cos(a) * 2, cy - py - Math.sin(a) * 2);
        g.lineTo(cx + px + Math.cos(a) * 2, cy + py + Math.sin(a) * 2);
        g.stroke();
      }
    }
    speckle(g, s, 400, () => blotchA + '30', () => rand(1, 3));
  }, { repeat: [1, 1] });
}

// ---- CHITIN ---------------------------------------------------------------
// Segmented insect plate: banded plates with a waxy sheen line. Used by the
// grasshopper curse, the centipedes and the hookworm.
export function chitinTex(key, { base, plate, rim, bands = 16, S = 256 } = {}) {
  return tex('chitin:' + key, S, (g, s) => {
    fill(g, s, base);
    const h = s / bands;
    for (let i = 0; i < bands; i++) {
      g.fillStyle = i % 2 ? plate : shade(plate, -18);
      g.fillRect(0, i * h, s, h * 0.86);
      const grad = g.createLinearGradient(0, i * h, 0, i * h + h * 0.86);
      grad.addColorStop(0, '#ffffff26');
      grad.addColorStop(0.4, '#ffffff00');
      g.fillStyle = grad;
      g.fillRect(0, i * h, s, h * 0.86);
      g.strokeStyle = rim + '99';
      g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, i * h + h * 0.86); g.lineTo(s, i * h + h * 0.86); g.stroke();
    }
    speckle(g, s, 240, () => rim + '2a', () => rand(1, 3));
  }, { repeat: [1, 1] });
}

// ---- MEMBRANE -------------------------------------------------------------
// A thin stretched sheet with visible ribbing and a translucent-looking
// gradient. The manta ray's wings, the fungus curse's caps, wing webbing.
export function membraneTex(key, { base, rib, edge, ribs = 11, S = 256 } = {}) {
  return tex('memb:' + key, S, (g, s) => {
    const grad = g.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0, base);
    grad.addColorStop(1, shade(base, -34));
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    for (let i = 0; i <= ribs; i++) {
      const x = (i / ribs) * s;
      g.strokeStyle = rib + '99';
      g.lineWidth = rand(1.5, 3.4);
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + rand(-14, 14), s * 0.5, x + rand(-8, 8), s);
      g.stroke();
    }
    g.strokeStyle = edge + 'aa';
    g.lineWidth = s * 0.05;
    g.strokeRect(0, 0, s, s);
    speckle(g, s, 160, () => rib + '25', () => rand(1, 5));
  }, { repeat: [1, 1] });
}

// ---- STRIPES --------------------------------------------------------------
// Tiger banding: irregular tapering bars, forked at the ends the way real
// tiger stripes fork. Tiger Funeral and Agito's torso.
export function stripeTex(key, { base, stripe, under, bars = 13, S = 256 } = {}) {
  return tex('stripe:' + key, S, (g, s) => {
    fill(g, s, base);
    const grad = g.createLinearGradient(0, s, 0, s * 0.45);
    grad.addColorStop(0, under + 'ee');
    grad.addColorStop(1, under + '00');
    g.fillStyle = grad;
    g.fillRect(0, s * 0.45, s, s * 0.55);
    fibres(g, s, 900, () => shade(base, rand(-20, 20) | 0) + '55', s * 0.04, 0.4);
    for (let i = 0; i < bars; i++) {
      const x = (i / bars) * s + rand(-6, 6);
      const w = s * rand(0.018, 0.045);
      g.fillStyle = stripe + 'ee';
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + rand(-10, 10), s * 0.35, x + rand(-6, 6), s * 0.62);
      g.lineTo(x + w, s * 0.62);
      g.quadraticCurveTo(x + w + rand(-10, 10), s * 0.35, x + w, 0);
      g.closePath();
      g.fill();
      // the fork
      if (i % 2 === 0) {
        g.beginPath();
        g.moveTo(x, s * 0.60);
        g.quadraticCurveTo(x - w * 2.4, s * 0.76, x - w * 3.2, s * 0.88);
        g.lineTo(x - w * 1.9, s * 0.88);
        g.quadraticCurveTo(x - w * 0.7, s * 0.74, x + w, s * 0.60);
        g.closePath();
        g.fill();
      }
    }
  }, { repeat: [1, 1] });
}

// ---- MASK / BONE ----------------------------------------------------------
// A pale skull plate with hairline fractures and a stained hollow. Nue's face,
// Agito's mask, tusks.
export function maskTex(key, { base, crack, stain, S = 256 } = {}) {
  return tex('mask:' + key, S, (g, s) => {
    fill(g, s, base);
    for (let i = 0; i < 22; i++) blotch(g, rand(0, s), rand(0, s), rand(s * 0.04, s * 0.13), stain + '44', 8);
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      let x = rand(0, s), y = rand(0, s), a = rand(0, Math.PI * 2);
      g.strokeStyle = crack + '66';
      g.lineWidth = rand(0.7, 1.7);
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        a += rand(-0.8, 0.8);
        x += Math.cos(a) * rand(5, 18); y += Math.sin(a) * rand(5, 18);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    speckle(g, s, 260, () => stain + '28', () => rand(1, 3));
  }, { repeat: [1, 1] });
}

// ---- CURSED ENERGY --------------------------------------------------------
// A swirling violet field for the parts of a curse that are energy rather than
// meat — wisp cores, the manta's underside glow, cursed-womb sacs.
export function energyTex(key, { base, hot, S = 256 } = {}) {
  return tex('energy:' + key, S, (g, s) => {
    fill(g, s, base);
    for (let i = 0; i < 26; i++) {
      const cx = rand(0, s), cy = rand(0, s), r = rand(s * 0.06, s * 0.3);
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, hot + 'aa');
      grad.addColorStop(1, hot + '00');
      g.fillStyle = grad;
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = hot + '55';
      g.lineWidth = rand(1, 4);
      g.beginPath();
      let x = rand(0, s), y = rand(0, s), a = rand(0, 6.28);
      g.moveTo(x, y);
      for (let k = 0; k < 9; k++) {
        a += rand(-0.55, 0.55);
        x += Math.cos(a) * 14; y += Math.sin(a) * 14;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }, { repeat: [1, 1] });
}

// ---------------------------------------------------------------------------
// colour utility — shift a #rrggbb string by a signed amount per channel
// ---------------------------------------------------------------------------
export function shade(css, d) {
  const n = parseInt(css.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + d));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + d));
  const b = Math.max(0, Math.min(255, (n & 255) + d));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
export function hexOf(css) { return parseInt(css.slice(1), 16); }
