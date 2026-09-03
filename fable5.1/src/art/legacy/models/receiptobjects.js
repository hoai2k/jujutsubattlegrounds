// ===========================================================================
// REGGIE'S MATERIALISED OBJECTS — 再契象
// ===========================================================================
// Everything Reggie ever attacks with. He has no cursed-energy technique that
// leaves his hands: he burns a receipt and the thing written on it turns up.
//
// ---------------------------------------------------------------------------
// WHAT THESE ARE, AND WHY THEY ARE HERE RATHER THAN IN fx/props.js
// ---------------------------------------------------------------------------
// fx/props.js holds TECHNIQUE geometry — roots, blades, chains, beams. These
// are not techniques. They are a ladder and a moped. They are the only objects
// in the game that are supposed to look like they came out of a car park, and
// putting them in the props file would bury them under a hundred cursed-energy
// constructs that share none of their design problems.
//
// ---------------------------------------------------------------------------
// THE STYLE PROBLEM, STATED, BECAUSE IT IS THE WHOLE JOB
// ---------------------------------------------------------------------------
// A real vending machine dropped into a cel-shaded anime fighter looks like an
// asset from a different game. Four rules keep these inside the house style,
// and every builder below obeys all four:
//
//   1. CHUNKY PROPORTIONS. Everything is shorter and fatter than the real
//      object — a real ladder is 40:1 long-to-wide, this one is 14:1. Anime
//      props are caricatures of objects, not measurements of them.
//   2. FLAT COLOUR BLOCKS, few of them. Three or four values per object, no
//      gradients, no texture. The vending machine is a body colour, a window
//      colour, a glow and a trim — not a photograph of a vending machine.
//   3. HEAVY EDGES. Every object gets the same inverted-hull outline the
//      characters get, at a thickness scaled to the object's size, so it sits
//      in the same drawing as the fighters.
//   4. ONE LOUD IDENTIFYING FEATURE, readable in silhouette at fighting
//      distance. The cone is its stripe. The extinguisher-substitute gas
//      canister is its valve wheel. The moped is its handlebars. If you cannot
//      tell what it is from the black shape alone, it is not finished.
//
// ---------------------------------------------------------------------------
// EVERY BUILDER RETURNS A THREE.Group POINTING +Z (things that fly / drive)
// OR +Y (things that stand / drop), documented per builder, with its origin at
// the point the effect wants to drive it from — usually the grip or the centre
// of mass. The effect owns the animation; nothing here animates itself.
// ---------------------------------------------------------------------------
import * as THREE from 'three';
import { toonMaterial } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { roundBox, tGeo, mergeGeos } from '../builders/geo.js';
import { rand } from '../../../core/math.js';

// ---- SHARED MATERIAL CACHE -------------------------------------------------
// One material per colour per archetype, cached for the process. A round in
// which Reggie throws forty objects would otherwise compile forty shaders.
const _mats = new Map();
function M(kind, color) {
  const k = kind + ':' + color;
  if (_mats.has(k)) return _mats.get(k);
  const base = { vertexColors: false, color };
  const m = kind === 'metal'
    ? toonMaterial({ ...base, steps: [40, 120, 255], rim: 0.55, rimStart: 0.60, gloss: 0.8, rimColor: 0xdfe8ff })
    : kind === 'glass'
      ? toonMaterial({ ...base, steps: [70, 150, 255], rim: 0.70, rimStart: 0.52, gloss: 0.95, rimColor: 0xffffff, transparent: true, opacity: 0.62 })
      : kind === 'glow'
        ? toonMaterial({ ...base, steps: [200, 230, 255], rim: 0.9, rimStart: 0.3, rimColor: color, emissive: color, emissiveIntensity: 0.7 })
        : kind === 'rubber'
          ? toonMaterial({ ...base, steps: [46, 110, 210], rim: 0.14, rimStart: 0.84, rimColor: 0x8898b0 })
          : toonMaterial({ ...base, steps: [64, 140, 255], rim: 0.30, rimStart: 0.68, rimColor: 0xffe8c8 });
  _mats.set(k, m);
  return m;
}

// A mesh plus its outline hull, as one group. `t` is the outline thickness in
// world units — scaled per object, because one value across a knife and a car
// gives either a knife with no edge or a car wrapped in a black balloon.
function part(geo, kind, color, t = 0.02) {
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(geo, M(kind, color));
  g.add(mesh);
  if (t > 0.0005) g.add(makeOutline(mesh, { color: 0x0a0a10, thickness: t }));
  return g;
}
const box = (w, h, d, r = 0.02) => roundBox(w, h, d, r, 1);
const cyl = (r0, r1, h, seg = 8) => new THREE.CylinderGeometry(r0, r1, h, seg);

// ===========================================================================
// THE CHEAP SET — RB, QUICK MATERIALISE
// ===========================================================================
// Small, light, thrown underarm. Four of them, rolled for flavour; the
// MECHANICAL effect is identical for all four (characters/reggie.js says so in
// as many words), so the roll is decoration and never a gamble.

// KITCHEN KNIFE — canon. He materialises kitchen knives from a receipt and
// commands them to fly, which is the single most-cited use of the technique.
// Points +Z. Origin at the grip.
export function buildKnife() {
  const g = new THREE.Group();
  const blade = box(0.030, 0.006, 0.26, 0.002);
  // taper to a point at +Z
  const p = blade.getAttribute('position');
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i);
    if (z > 0.05) { const t = (z - 0.05) / 0.08; p.setX(i, p.getX(i) * (1 - 0.86 * t)); }
  }
  blade.computeVertexNormals();
  blade.translate(0, 0, 0.19);
  g.add(part(blade, 'metal', 0xd8dee8, 0.006));
  g.add(part(tGeo(box(0.024, 0.020, 0.09, 0.008), { pos: [0, 0, 0.02] }), 'solid', 0x2a2118, 0.006));
  g.add(part(tGeo(box(0.044, 0.014, 0.014, 0.005), { pos: [0, 0, 0.068] }), 'metal', 0xb8bec8, 0.005));
  return g;
}

// TRAFFIC CONE. Points +Y. THE STRIPE is the identifying feature — a cone
// without it is a cone-shaped nothing.
export function buildCone() {
  const g = new THREE.Group();
  g.add(part(tGeo(new THREE.ConeGeometry(0.13, 0.44, 10), { pos: [0, 0.24, 0] }), 'solid', 0xf2622a, 0.008));
  g.add(part(tGeo(new THREE.CylinderGeometry(0.145, 0.145, 0.10, 10), { pos: [0, 0.26, 0] }), 'solid', 0xf4f2ea, 0.008));
  g.add(part(tGeo(box(0.32, 0.035, 0.32, 0.012), { pos: [0, 0.018, 0] }), 'solid', 0x28282e, 0.008));
  return g;
}

// PIPE WRENCH. Points +Y (the handle down). The JAW is the read.
export function buildWrench() {
  const g = new THREE.Group();
  g.add(part(tGeo(cyl(0.020, 0.024, 0.34, 7), { pos: [0, 0.17, 0] }), 'metal', 0xc44a2a, 0.006));
  g.add(part(tGeo(box(0.052, 0.09, 0.036, 0.008), { pos: [0, 0.37, 0] }), 'metal', 0xa8aeb8, 0.006));
  g.add(part(tGeo(box(0.11, 0.030, 0.032, 0.006), { pos: [0.03, 0.405, 0] }), 'metal', 0xa8aeb8, 0.006));
  g.add(part(tGeo(box(0.09, 0.028, 0.030, 0.006), { pos: [0.02, 0.335, 0] }), 'metal', 0x8e949e, 0.006));
  return g;
}

// GLASS BOTTLE. Points +Y. Reads by its NECK; it is the one cheap object that
// visibly shatters, so the body is the glass material.
export function buildBottle() {
  const g = new THREE.Group();
  g.add(part(tGeo(cyl(0.052, 0.056, 0.20, 9), { pos: [0, 0.10, 0] }), 'glass', 0x4a8a5e, 0.005));
  g.add(part(tGeo(cyl(0.020, 0.046, 0.09, 9), { pos: [0, 0.245, 0] }), 'glass', 0x4a8a5e, 0.005));
  g.add(part(tGeo(cyl(0.024, 0.024, 0.035, 9), { pos: [0, 0.305, 0] }), 'solid', 0xd8c05a, 0.005));
  g.add(part(tGeo(box(0.072, 0.07, 0.006, 0.004), { pos: [0, 0.11, 0.054] }), 'solid', 0xf4f2ea, 0.004));
  return g;
}

export const JUNK = { knife: buildKnife, cone: buildCone, wrench: buildWrench, bottle: buildBottle };
export const JUNK_KEYS = ['knife', 'cone', 'wrench', 'bottle'];

// ===========================================================================
// THE SEVEN — RT, MATERIALISE
// ===========================================================================

// ---- 1 · ALUMINIUM LADDER --------------------------------------------------
// The longest melee weapon in the game. Points +Y from the grip end, so the
// effect swings it about its own base.
//
// CHUNKY: 3.4 m of ladder at 0.40 m wide is 8.5:1, where a real extension
// ladder is nearer 25:1. At real proportions it read as a wire in the air.
export function buildLadder(len = 3.4) {
  const g = new THREE.Group();
  const W = 0.40;
  for (const s of [-1, 1]) {
    g.add(part(tGeo(box(0.050, len, 0.075, 0.012), { pos: [s * W * 0.5, len * 0.5, 0] }), 'metal', 0xc8ccd4, 0.012));
  }
  const rungs = Math.max(4, Math.round(len / 0.34));
  for (let i = 1; i < rungs; i++) {
    g.add(part(tGeo(box(W, 0.036, 0.048, 0.010), { pos: [0, (i / rungs) * len, 0] }), 'metal', 0xaeb4be, 0.010));
  }
  // rubber feet — the one detail that says "ladder" rather than "frame"
  for (const s of [-1, 1]) {
    g.add(part(tGeo(box(0.070, 0.048, 0.10, 0.014), { pos: [s * W * 0.5, 0.024, 0.01] }), 'rubber', 0x24262e, 0.010));
  }
  return g;
}

// ---- 2 · GAS CANISTER ------------------------------------------------------
// CANON — Reggie's receipt stock explicitly includes GAS. It replaces the fire
// extinguisher the design brief asked for and does the same job: it vents a
// cloud that blocks line of sight.
//
// Points +Y. THE VALVE WHEEL on top is the identifying silhouette.
export function buildCanister() {
  const g = new THREE.Group();
  g.add(part(tGeo(cyl(0.15, 0.15, 0.58, 12), { pos: [0, 0.31, 0] }), 'metal', 0xc4a02a, 0.010));
  g.add(part(tGeo(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), { pos: [0, 0.60, 0] }), 'metal', 0xc4a02a, 0.010));
  g.add(part(tGeo(box(0.34, 0.055, 0.34, 0.014), { pos: [0, 0.030, 0] }), 'metal', 0x8a8f98, 0.010));
  // neck + valve wheel
  g.add(part(tGeo(cyl(0.042, 0.052, 0.10, 8), { pos: [0, 0.665, 0] }), 'metal', 0x9aa0aa, 0.008));
  g.add(part(tGeo(new THREE.TorusGeometry(0.075, 0.018, 6, 12), { rot: [90, 0, 0], pos: [0, 0.725, 0] }), 'metal', 0xc4322a, 0.008));
  for (let i = 0; i < 3; i++) {
    g.add(part(tGeo(box(0.14, 0.016, 0.020, 0.005), { rot: [0, i * 60, 0], pos: [0, 0.725, 0] }), 'metal', 0xc4322a, 0.006));
  }
  // hazard band
  g.add(part(tGeo(cyl(0.153, 0.153, 0.09, 12), { pos: [0, 0.44, 0] }), 'solid', 0x2a2c34, 0.008));
  return g;
}

// ---- 3 · CAMERA DRONE ------------------------------------------------------
// CANON — drones are in his receipt stock and he flies them in the fight.
// Points +Z. The only object that stays on the field under its own power, so
// it is the only one built with a visibly ACTIVE part: the rotors spin (the
// effect drives `g.rotors`) and the lens glows.
export function buildDrone() {
  const g = new THREE.Group();
  g.add(part(tGeo(box(0.26, 0.085, 0.30, 0.030), { pos: [0, 0, 0] }), 'solid', 0x2e323c, 0.008));
  g.add(part(tGeo(box(0.19, 0.045, 0.20, 0.020), { pos: [0, 0.062, 0] }), 'solid', 0x454a58, 0.007));
  const rotors = new THREE.Group();
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const ax = x * 0.21, az = z * 0.22;
    g.add(part(tGeo(cyl(0.020, 0.020, 0.055, 6), { pos: [ax, 0.03, az] }), 'solid', 0x2e323c, 0.006));
    g.add(part(tGeo(box(0.20, 0.028, 0.055, 0.012), { rot: [0, x * z * 34, 0], pos: [ax * 0.5, 0, az * 0.5] }), 'solid', 0x3a3f4a, 0.006));
    const blade = new THREE.Group();
    blade.position.set(ax, 0.062, az);
    blade.add(part(tGeo(box(0.30, 0.008, 0.030, 0.003), { pos: [0, 0, 0] }), 'solid', 0x1c1e26, 0.004));
    blade.add(part(tGeo(box(0.030, 0.008, 0.30, 0.003), { pos: [0, 0, 0] }), 'solid', 0x1c1e26, 0.004));
    rotors.add(blade);
    g.add(blade);
  }
  // gimbal + lens: the glowing eye is what makes it read as watching you
  g.add(part(tGeo(new THREE.SphereGeometry(0.055, 10, 8), { pos: [0, -0.062, 0.09] }), 'solid', 0x1c1e26, 0.006));
  g.add(part(tGeo(cyl(0.032, 0.032, 0.05, 8), { rot: [90, 0, 0], pos: [0, -0.062, 0.135] }), 'glow', 0xf2622a, 0.005));
  g.rotors = rotors.children;
  return g;
}

// ---- 4 · FISHING ROD -------------------------------------------------------
// Points +Y from the grip. The rod is the handle only — the LINE and the HOOK
// are driven separately by the effect, because a line that is modelled at a
// fixed length cannot reach anybody.
export function buildRod() {
  const g = new THREE.Group();
  g.add(part(tGeo(cyl(0.024, 0.020, 0.30, 8), { pos: [0, 0.15, 0] }), 'rubber', 0x2a2c34, 0.006));
  // the blank, tapering hard — a rod that does not taper is a stick
  const blank = cyl(0.006, 0.019, 1.55, 7);
  blank.translate(0, 0.30 + 1.55 * 0.5, 0);
  g.add(part(blank, 'solid', 0x1c3a2a, 0.005));
  // the reel — the one thing that makes it a fishing rod and not a cane
  g.add(part(tGeo(cyl(0.075, 0.075, 0.055, 10), { rot: [0, 0, 90], pos: [0.075, 0.325, 0] }), 'metal', 0xc8ccd4, 0.006));
  g.add(part(tGeo(box(0.030, 0.11, 0.030, 0.008), { pos: [0.035, 0.325, 0] }), 'metal', 0x9aa0aa, 0.005));
  g.add(part(tGeo(cyl(0.010, 0.010, 0.09, 6), { rot: [0, 0, 90], pos: [0.135, 0.325, 0] }), 'metal', 0xd8c05a, 0.005));
  // line guides down the blank
  for (const f of [0.30, 0.55, 0.80, 0.97]) {
    g.add(part(tGeo(new THREE.TorusGeometry(0.020, 0.005, 5, 8), { rot: [90, 0, 0], pos: [0, 0.30 + 1.55 * f, 0.020] }), 'metal', 0xc8ccd4, 0.003));
  }
  return g;
}

// THE HOOK, built separately so the effect can fly it. Points +Z.
export function buildHook() {
  const g = new THREE.Group();
  g.add(part(tGeo(new THREE.TorusGeometry(0.055, 0.013, 6, 10, Math.PI * 1.45), { rot: [0, 90, 20] }), 'metal', 0xc8ccd4, 0.005));
  g.add(part(tGeo(cyl(0.012, 0.012, 0.13, 6), { rot: [90, 0, 0], pos: [0, 0.055, -0.055] }), 'metal', 0xc8ccd4, 0.005));
  g.add(part(tGeo(new THREE.ConeGeometry(0.024, 0.06, 6), { rot: [-120, 0, 0], pos: [0, -0.03, 0.055] }), 'metal', 0xe8ecf2, 0.005));
  return g;
}

// ---- 5 · MOPED -------------------------------------------------------------
// CANON — a moped is in his stock. Points +Z (the direction it drives).
// Origin between the wheels at ground level, so the effect can drive it along
// the floor without maths.
//
// THE HANDLEBARS are the silhouette. Everything else about a moped at this
// scale is a lump.
export function buildMoped() {
  const g = new THREE.Group();
  const BODY = 0xd8442e, DARK = 0x2a2c34;
  // wheels
  for (const z of [-0.42, 0.46]) {
    g.add(part(tGeo(new THREE.TorusGeometry(0.26, 0.075, 7, 14), { rot: [0, 90, 0], pos: [0, 0.26, z] }), 'rubber', 0x1c1e24, 0.010));
    g.add(part(tGeo(cyl(0.11, 0.11, 0.07, 9), { rot: [0, 0, 90], pos: [0, 0.26, z] }), 'metal', 0xb8bec8, 0.008));
  }
  // the step-through frame — the shape that says moped rather than motorbike
  g.add(part(tGeo(box(0.28, 0.22, 0.62, 0.070), { pos: [0, 0.44, 0.16] }), 'solid', BODY, 0.012));
  g.add(part(tGeo(box(0.30, 0.10, 0.34, 0.040), { pos: [0, 0.36, -0.20] }), 'solid', DARK, 0.010));
  g.add(part(tGeo(box(0.32, 0.13, 0.30, 0.055), { pos: [0, 0.62, -0.16] }), 'rubber', 0x1c1e24, 0.010));
  // front column and the bars
  g.add(part(tGeo(box(0.14, 0.52, 0.16, 0.040), { rot: [-16, 0, 0], pos: [0, 0.62, 0.46] }), 'solid', BODY, 0.010));
  g.add(part(tGeo(box(0.72, 0.055, 0.055, 0.024), { pos: [0, 0.86, 0.40] }), 'metal', 0xb8bec8, 0.010));
  for (const s of [-1, 1]) {
    g.add(part(tGeo(cyl(0.038, 0.038, 0.13, 7), { rot: [0, 0, 90], pos: [s * 0.30, 0.86, 0.40] }), 'rubber', 0x1c1e24, 0.007));
  }
  // headlight — a round glow, dead centre, and it is the second read
  g.add(part(tGeo(cyl(0.10, 0.10, 0.07, 10), { rot: [90, 0, 0], pos: [0, 0.75, 0.55] }), 'glow', 0xffe8a8, 0.008));
  // exhaust
  g.add(part(tGeo(cyl(0.045, 0.055, 0.46, 7), { rot: [90, 0, 0], pos: [0.16, 0.24, -0.10] }), 'metal', 0x9aa0aa, 0.008));
  return g;
}

// ---- 6 · VENDING MACHINE ---------------------------------------------------
// Points +Y, origin at the base. Dropped from above onto a marked spot, and
// the WRECK it leaves is cover — so it is built as a box with a clearly
// separable front, and `buildVendingWreck` below is the same object on its
// side with the glass gone.
//
// THE LIT WINDOW WITH ROWS OF CANS is the whole read. A grey box is a grey box.
export function buildVending() {
  const g = new THREE.Group();
  const W = 1.02, H = 1.86, D = 0.76;
  const BODY = 0xc4322a;
  g.add(part(tGeo(box(W, H, D, 0.045), { pos: [0, H * 0.5, 0] }), 'solid', BODY, 0.016));
  // the lit front window, recessed
  g.add(part(tGeo(box(W * 0.66, H * 0.56, 0.05, 0.020), { pos: [-W * 0.10, H * 0.62, D * 0.5 + 0.01] }), 'glow', 0xfff0c0, 0.010));
  g.add(part(tGeo(box(W * 0.70, H * 0.60, 0.035, 0.020), { pos: [-W * 0.10, H * 0.62, D * 0.5 - 0.005] }), 'solid', 0x1c1e26, 0.010));
  // rows of cans behind the glass — four shelves, five cans each
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      const cc = [0x2a6cc8, 0xd8442e, 0x4a8a5e, 0xd8c05a, 0xf4f2ea][(r * 5 + c) % 5];
      g.add(part(tGeo(cyl(0.048, 0.048, 0.11, 7), {
        pos: [-W * 0.10 + (c - 2) * W * 0.125, H * 0.40 + r * H * 0.115, D * 0.5 + 0.035]
      }), 'solid', cc, 0.004));
    }
  }
  // the service column: coin slot, buttons, the tray
  g.add(part(tGeo(box(W * 0.22, H * 0.62, 0.04, 0.014), { pos: [W * 0.34, H * 0.60, D * 0.5 + 0.012] }), 'solid', 0x2a2c34, 0.008));
  for (let i = 0; i < 4; i++) {
    g.add(part(tGeo(cyl(0.032, 0.032, 0.03, 8), { rot: [90, 0, 0], pos: [W * 0.34, H * 0.44 + i * 0.12, D * 0.5 + 0.035] }), 'glow', 0xff9a3c, 0.005));
  }
  g.add(part(tGeo(box(W * 0.52, H * 0.12, 0.10, 0.016), { pos: [-W * 0.14, H * 0.16, D * 0.5 - 0.02] }), 'solid', 0x1c1e26, 0.010));
  // plinth
  g.add(part(tGeo(box(W * 1.02, 0.08, D * 1.03, 0.016), { pos: [0, 0.04, 0] }), 'solid', 0x2a2c34, 0.012));
  return g;
}

// THE WRECK. The same machine on its side with the window blown out and the
// cans spilled — this is what stays on the field as cover, so it is built low
// and wide and it does NOT glow: a wreck with a lit window reads as working.
export function buildVendingWreck() {
  const g = new THREE.Group();
  const W = 1.02, H = 1.86, D = 0.76;
  const body = new THREE.Group();
  body.add(part(tGeo(box(W, H, D, 0.045), { pos: [0, 0, 0] }), 'solid', 0x8e2a24, 0.016));
  body.add(part(tGeo(box(W * 0.70, H * 0.60, 0.05, 0.020), { pos: [-W * 0.10, H * 0.10, D * 0.5] }), 'solid', 0x14161c, 0.010));
  // buckled panel
  body.add(part(tGeo(box(W * 0.9, H * 0.16, D * 0.9, 0.03), { rot: [0, 0, 6], pos: [0, -H * 0.30, 0] }), 'solid', 0x6e211c, 0.012));
  body.rotation.z = Math.PI * 0.5;
  body.position.set(0, W * 0.52, 0);
  g.add(body);
  // spilled cans
  for (let i = 0; i < 9; i++) {
    const cc = [0x2a6cc8, 0xd8442e, 0x4a8a5e, 0xd8c05a, 0xf4f2ea][i % 5];
    const c = part(tGeo(cyl(0.048, 0.048, 0.11, 7), {}), 'solid', cc, 0.004);
    c.position.set(rand(-1.1, 1.1), 0.05, rand(-0.7, 0.7));
    c.rotation.set(Math.PI * 0.5, rand(0, 6), rand(0, 6));
    g.add(c);
  }
  // broken glass shards around the front
  for (let i = 0; i < 7; i++) {
    const s = part(tGeo(box(rand(0.06, 0.16), 0.012, rand(0.05, 0.12), 0.004), {}), 'glass', 0xbfe0f0, 0.003);
    s.position.set(rand(-1.0, 1.0), 0.012, rand(-0.6, 0.9));
    s.rotation.y = rand(0, 6);
    g.add(s);
  }
  return g;
}

// ---- 7 · CAR ---------------------------------------------------------------
// CANON, and his biggest object. Points +Z. Origin at ground level between the
// axles.
//
// A KEI HATCHBACK, not a saloon: short, tall, upright, boxy. It is the right
// car for the joke (he did not buy a supercar, he kept a receipt for a shopping
// car) and it is also the easiest car shape to read in silhouette.
export function buildCar() {
  const g = new THREE.Group();
  const BODY = 0x4a8ac8, DARK = 0x22252e;
  const L = 3.30, W = 1.52, HB = 0.62;
  // lower body
  g.add(part(tGeo(box(W, HB, L, 0.13), { pos: [0, 0.62, 0] }), 'solid', BODY, 0.020));
  // cabin — set back and narrower, which is what makes it a car and not a brick
  g.add(part(tGeo(box(W * 0.90, 0.62, L * 0.52, 0.11), { pos: [0, 1.20, -0.16] }), 'solid', BODY, 0.018));
  // glass: windscreen, rear, two sides
  g.add(part(tGeo(box(W * 0.80, 0.46, 0.06, 0.02), { rot: [-24, 0, 0], pos: [0, 1.22, L * 0.10] }), 'glass', 0x9fd0e8, 0.010));
  g.add(part(tGeo(box(W * 0.80, 0.44, 0.06, 0.02), { rot: [22, 0, 0], pos: [0, 1.22, -L * 0.42] }), 'glass', 0x9fd0e8, 0.010));
  for (const s of [-1, 1]) {
    g.add(part(tGeo(box(0.05, 0.40, L * 0.40, 0.02), { pos: [s * W * 0.455, 1.22, -0.16] }), 'glass', 0x9fd0e8, 0.010));
    g.add(part(tGeo(box(0.06, 0.10, L * 0.44, 0.02), { pos: [s * W * 0.47, 0.98, -0.14] }), 'solid', DARK, 0.008));
    // mirror
    g.add(part(tGeo(box(0.13, 0.09, 0.07, 0.02), { pos: [s * W * 0.56, 1.14, L * 0.16] }), 'solid', DARK, 0.007));
  }
  // wheels — four, and they are what stop it reading as a fridge
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    g.add(part(tGeo(new THREE.TorusGeometry(0.34, 0.13, 7, 14), { rot: [0, 90, 0], pos: [sx * W * 0.50, 0.34, sz * L * 0.30] }), 'rubber', 0x1c1e24, 0.012));
    g.add(part(tGeo(cyl(0.17, 0.17, 0.13, 9), { rot: [0, 0, 90], pos: [sx * W * 0.50, 0.34, sz * L * 0.30] }), 'metal', 0xc8ccd4, 0.010));
    g.add(part(tGeo(box(W * 0.24, 0.34, 0.86, 0.05), { pos: [sx * W * 0.44, 0.62, sz * L * 0.30] }), 'solid', 0x3a6ea0, 0.010));
  }
  // lights — the front pair glow, the rear pair are red. Both are needed:
  // which end is coming at you has to be readable mid-flight.
  for (const s of [-1, 1]) {
    g.add(part(tGeo(box(0.34, 0.16, 0.09, 0.03), { pos: [s * W * 0.30, 0.76, L * 0.495] }), 'glow', 0xfff0c0, 0.008));
    g.add(part(tGeo(box(0.30, 0.18, 0.09, 0.03), { pos: [s * W * 0.31, 0.86, -L * 0.495] }), 'glow', 0xd8442e, 0.008));
  }
  // bumpers + grille
  g.add(part(tGeo(box(W * 1.01, 0.20, 0.12, 0.04), { pos: [0, 0.55, L * 0.49] }), 'solid', DARK, 0.010));
  g.add(part(tGeo(box(W * 1.01, 0.20, 0.12, 0.04), { pos: [0, 0.55, -L * 0.49] }), 'solid', DARK, 0.010));
  g.add(part(tGeo(box(W * 0.56, 0.13, 0.06, 0.02), { pos: [0, 0.90, L * 0.50] }), 'solid', DARK, 0.008));
  return g;
}

// ===========================================================================
// THE RECEIPT ITSELF
// ===========================================================================
// Every materialisation is preceded by ONE OF THESE unfurling and burning.
// It is the most important object in the file: it is the thing that tells the
// player where a car came from. See the note in combat/receipts.js about why
// the burn always plays even when the object is instant.
//
// Points +Y, origin at the top edge (it hangs down, the way a receipt does
// when you hold it up). `scaleY` from 0 to unfurl it.
export function buildReceipt(len = 0.52, w = 0.13) {
  const g = new THREE.Group();
  const paper = toonMaterial({
    vertexColors: false, color: 0xf8f6ee, steps: [140, 200, 255],
    rim: 0.5, rimStart: 0.55, rimColor: 0xfff4d0
  });
  const strip = new THREE.Mesh(tGeo(box(w, len, 0.006, 0.002), { pos: [0, -len * 0.5, 0] }), paper);
  g.add(strip);
  g.add(makeOutline(strip, { color: 0x2a2418, thickness: 0.006 }));
  // the print: eight ruled lines and a total bar, in the mint the design sheet
  // puts on his tags
  const ink = toonMaterial({ vertexColors: false, color: 0x7fa890, steps: [200, 240, 255], rim: 0 });
  for (let i = 0; i < 8; i++) {
    const wl = w * (0.34 + (i % 3) * 0.20);
    const bar = new THREE.Mesh(tGeo(box(wl, len * 0.026, 0.003, 0.001),
      { pos: [-w * 0.5 + wl * 0.5 + w * 0.09, -len * (0.14 + i * 0.088), 0.005] }), ink);
    g.add(bar);
  }
  g.add(new THREE.Mesh(tGeo(box(w * 0.74, len * 0.045, 0.003, 0.001), { pos: [0, -len * 0.90, 0.005] }), ink));
  // the torn top edge
  for (const dx of [-0.28, 0.06, 0.32]) {
    g.add(new THREE.Mesh(tGeo(box(w * 0.22, len * 0.035, 0.006, 0.002), { pos: [w * dx, len * 0.012, 0] }), paper));
  }
  g.paperMat = paper;
  g.inkMat = ink;
  return g;
}

// ===========================================================================
// THE REGISTRY
// ===========================================================================
// Keyed by the object ids in characters/reggie.js. Nothing here knows what an
// object COSTS or what it DOES — that is entirely the config's business — so
// adding an object is a builder here and an entry there.
export const OBJECT_MODELS = {
  ladder: buildLadder,
  canister: buildCanister,
  drone: buildDrone,
  rod: buildRod,
  moped: buildMoped,
  vending: buildVending,
  car: buildCar
};

export function buildObject(key, ...args) {
  const fn = OBJECT_MODELS[key];
  return fn ? fn(...args) : null;
}
export function buildJunk(key) {
  const fn = JUNK[key];
  return fn ? fn() : buildCone();
}
