// SHIKIGAMI — the Ten Shadows Technique, as the anime draws them.
//
// ======================== SHARED REFERENCE SHEET =========================
// Researched against the Jujutsu Kaisen Wiki pages for each shikigami (Divine
// Dogs 玉犬, Nue 鵺, Toad 蝦蟇, Great Serpent 大蛇, Max Elephant 満象,
// Rabbit Escape 脱兎) plus the anime colour scripts those pages describe. All
// geometry, all texture and all animation below is original and procedural.
//
// SUPERSEDING THE SHADOW-CONSTRUCT PASS. An earlier version of this file gave
// every shikigami one material: a near-black body with a hard cool rim. That
// is not what these creatures look like. They are COLOURED, PATTERNED,
// INDIVIDUALLY DESIGNED animals — a white wolf and a black wolf, an
// orange-feathered owl with a bone mask, a green toad, a white snake with a
// tan belly and black banding, a pale elephant covered in yellow ornament, and
// a swarm of ordinary cream rabbits. Every one of them is now built that way.
//
// WHAT STILL MAKES THEM A FAMILY, now that the bodies diverge:
//   · THE SHADOW EMERGENCE. Each rises out of a shadow pool on summon and
//     sinks back into it on death. That is canon and it is the strongest
//     single tell the set has. `finish()` gives all of them the same one.
//   · THE RIM. Every creature material carries the same cool #8fb6d8 rim
//     (textures/creature.js SHIKI_RIM). It is what reads them as one summoner's
//     work from across the arena, and it is what separates them at a glance
//     from Geto's violet-rimmed curses and Mahito's grey-rimmed flesh.
//   · THE TOON RESPONSE. All of them shade through the archetypes in
//     textures/creature.js, so a wolf's fur and an elephant's hide band the
//     same way even though nothing about their colour agrees.
//   · THE MARKINGS. Nearly every one of these has a canonical marking, and
//     nearly every marking is a magatama/mitsudomoe. Drawing them properly
//     (creature.js `magatama`) is most of what makes the set read as Japanese
//     shikigami rather than as a zoo.
//
// PER-CREATURE (accuracy notes are in the delivery write-up):
//  DIVINE DOGS 玉犬 — a PAIR of twin wolves, one WHITE one BLACK; each wears
//          three dots on its forehead in the OTHER'S colour. Lean wolf build,
//          long muzzle, upright ears, heavy brush tail. Not shadow wolves.
//  NUE 鵺  — large OWL-LIKE body with ORANGE feathers, a WHITE MASK-LIKE
//          SKULL for a face with HUMAN-LIKE TEETH, large wings, TWO SETS of
//          talons, and the same forehead symbol the Great Serpent wears.
//          Its offence is electro-shock wings discharging PURPLE electricity.
//  TOAD 蝦蟇 — a human-sized frog (the wiki's own trivia notes it is drawn as
//          a frog rather than a toad) with MARKS AROUND ITS EYES and a symbol
//          on its STOMACH resembling the Mirror of the Deep. Green, wet.
//  GREAT SERPENT 大蛇 — a gigantic WHITE snake with a TAN-YELLOW UNDERBELLY
//          and BLACK MARKINGS all over its body, including a forehead symbol.
//  MAX ELEPHANT 満象 — a large elephant with markings on its FOREHEAD, the TOP
//          OF ITS HEAD, its BACK and its KNEES: black in the manga, YELLOW in
//          the anime. Built to the anime. Pale hide, heavy ornament.
//  RABBIT ESCAPE 脱兎 — a swarm of ordinary, weak, harmless rabbits. Cream
//          coats, pink inner ears. ONE rabbit in the swarm carries the "Cloth
//          of Various Things" symbol, and killing that one kills all of them —
//          so the marked rabbit is modelled and tracked.
// =========================================================================
import * as THREE from 'three';
import { toonMaterial } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { tubeBetween, coneSpike, roundBox, tGeo, mergeGeos } from '../builders/geo.js';
import { v3, rand } from '../../../core/math.js';
import { bakeStatic, collectOutlines, applyLOD } from '../builders/bake.js';
import {
  projectUV, pelt, scaleMat, dermis, boneMat, glow, voidMat,
  furTex, scaleTex, amphibianTex, featherTex, hideTex, maskTex,
  magatama, mitsudomoe, ornamentTex, tex, SHIKI_RIM
} from '../textures/creature.js';

// ---------------------------------------------------------------------------
// THE LEGACY SHADOW MATERIAL
// ---------------------------------------------------------------------------
// Kept, unchanged, and deliberately NOT used by anything in this file any
// more. Higuruma's JUDGEMAN (art/models/judgeman.js) is a shikigami-family
// construct that genuinely IS a black silhouette with a rim — a set of scales,
// not an animal — and it imports this. Removing it would change a playable
// character's model, which this overhaul is not allowed to do.
let _mat = null;
export function shikigamiMaterial() {
  if (!_mat) {
    _mat = toonMaterial({
      vertexColors: true, steps: [46, 88, 172],
      rim: 0.52, rimStart: 0.64, rimColor: SHIKI_RIM, gloss: 0.12,
      warm: 0x141a26, cool: 0x16203a
    });
  }
  return _mat;
}

// ---------------------------------------------------------------------------
// construction helpers
// ---------------------------------------------------------------------------
// A "joint" is a Group. These creatures do not use the humanoid skeleton — a
// quadruped, a bird, a snake and a swarm share nothing with it — so each body
// plan gets a hierarchy shaped like the animal and an animator written for it.
export function joint(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

// Add a textured mesh to a joint.
//   `uv`      'auto' keeps a geometry's own parameterisation (spheres, lathes)
//             and projects one for the geometry that has none (tubes, cones).
//             Any explicit mode from projectUV forces that projection.
//   `outline` marks the few silhouette-defining masses that earn an
//             inverted-hull pass, keeping the draw-call cost sane.
export function part(parent, geo, mat, opts = {}) {
  const { outline = false, thickness = 0.014, uv = 'auto', uvScale = [1, 1], uvOffset = [0, 0] } = opts;
  if (uv !== 'keep') {
    if (uv === 'auto') {
      if (!geo.getAttribute('uv')) projectUV(geo, 'cylY', { scale: uvScale, offset: uvOffset });
      else if (uvScale[0] !== 1 || uvScale[1] !== 1) {
        // a geometry with its own uv still wants density control
        const a = geo.getAttribute('uv');
        for (let i = 0; i < a.count; i++) {
          a.setXY(i, a.getX(i) * uvScale[0] + uvOffset[0], a.getY(i) * uvScale[1] + uvOffset[1]);
        }
        a.needsUpdate = true;
      }
    } else projectUV(geo, uv, { scale: uvScale, offset: uvOffset });
  }
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  if (outline) parent.add(makeOutline(mesh, { color: 0x0a0b12, thickness }));
  return mesh;
}

export function ellipsoid(rx, ry, rz, seg = 10) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 2));
  g.scale(rx, ry, rz);
  g.computeVertexNormals();
  return g;
}

// A flat billboarded decal — the one honest way to put a canonical MARKING on
// a specific spot of a body without unwrapping the whole animal. Used for the
// Divine Dogs' three dots, the Toad's belly mirror, the Serpent's, Nue's, the
// Ox's and the Deer's jewel symbols, and the marked rabbit's cloth sigil.
export function markDecal(host, size, texture, { pos = [0, 0, 0], rot = [0, 0, 0], opacity = 1 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({
    map: texture, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
  }));
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.set(rot[0], rot[1], rot[2]);
  m.renderOrder = 3;
  host.add(m);
  return m;
}

// ---- THE TEN SACRED TREASURE SIGILS ---------------------------------------
// The Ten Shadows markings are, per the wiki, each based on one of the Ten
// Sacred Treasures (十種神宝): the Divine Dogs wear the Jewel of Turning Back
// on the Road and the Jewel of Plenty, Round Deer the Jewel of Resuscitation,
// Piercing Ox the Cloth of the Bees, the Toad the Mirror of the Deep, and the
// marked rabbit the Cloth of Various Things. They are drawn here as a shared
// family of magatama/mitsudomoe glyphs so the whole roster's ornament is
// visibly one system.
export function sigilTex(kind, color, bg = null) {
  return tex('sigil:' + kind + color, 128, (g, S) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, S, S); } else g.clearRect(0, 0, S, S);
    const c = color;
    const M = S / 2;
    switch (kind) {
      case 'threeDots':          // Divine Dogs — three dots in a row
        for (let i = -1; i <= 1; i++) {
          g.fillStyle = c;
          g.beginPath(); g.arc(M + i * S * 0.26, M, S * 0.10, 0, 6.2832); g.fill();
        }
        break;
      case 'mitsudomoe':         // Nue / Great Serpent — the shared forehead mark
        mitsudomoe(g, M, M, S * 0.40, c);
        g.strokeStyle = c; g.lineWidth = S * 0.035;
        g.beginPath(); g.arc(M, M, S * 0.44, 0, 6.2832); g.stroke();
        break;
      case 'mirror':             // Toad — Mirror of the Deep: concentric rings
        for (let i = 3; i >= 1; i--) {
          g.strokeStyle = c; g.lineWidth = S * 0.05;
          g.beginPath(); g.arc(M, M, S * 0.13 * i, 0, 6.2832); g.stroke();
        }
        magatama(g, M, M, S * 0.08, 0.6, c);
        break;
      case 'resuscitation':      // Round Deer — a paired magatama over a bar
        magatama(g, M - S * 0.14, M, S * 0.12, 0.4, c);
        magatama(g, M + S * 0.14, M, S * 0.12, 0.4 + Math.PI, c);
        g.fillStyle = c;
        g.fillRect(M - S * 0.30, M + S * 0.26, S * 0.60, S * 0.07);
        break;
      case 'bees':               // Piercing Ox — Cloth of the Bees: a hex cell
        g.strokeStyle = c; g.lineWidth = S * 0.055;
        for (const [dx, dy] of [[0, 0], [0, -0.30], [0, 0.30]]) {
          g.beginPath();
          for (let i = 0; i <= 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
            const x = M + dx * S + Math.cos(a) * S * 0.17;
            const y = M + dy * S + Math.sin(a) * S * 0.17;
            if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.stroke();
        }
        break;
      case 'variousThings':      // the marked rabbit — a woven cross-hatch disc
        g.strokeStyle = c; g.lineWidth = S * 0.045;
        g.beginPath(); g.arc(M, M, S * 0.38, 0, 6.2832); g.stroke();
        for (let i = -2; i <= 2; i++) {
          g.beginPath();
          g.moveTo(M + i * S * 0.13, M - S * 0.30);
          g.lineTo(M + i * S * 0.13, M + S * 0.30);
          g.stroke();
          g.beginPath();
          g.moveTo(M - S * 0.30, M + i * S * 0.13);
          g.lineTo(M + S * 0.30, M + i * S * 0.13);
          g.stroke();
        }
        break;
      default:
        g.fillStyle = c;
        g.beginPath(); g.arc(M, M, S * 0.3, 0, 6.2832); g.fill();
    }
  }, { wrap: false });
}

// ---------------------------------------------------------------------------
// the shadow pool every shikigami rises out of — the family's summon/death tell
// ---------------------------------------------------------------------------
function shadowPool(radius) {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 22),
    new THREE.MeshBasicMaterial({ color: 0x04050a, transparent: true, opacity: 0.86, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 0.94, radius * 1.06, 24),
    glow(SHIKI_RIM, 0.42));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  g.add(disc, ring);
  g.renderOrder = 2;
  return g;
}

// Wrap a finished body in the shared summon / death presentation. Every builder
// ends with this, so emergence and dissolve are identical across the family
// even though the bodies could not be less alike.
export function finish(body, { height, radius, poolR, tick, extras }) {
  const group = new THREE.Group();
  const pool = shadowPool(poolR ?? radius * 1.15);
  group.add(pool, body);
  // ---- THE STATIC BAKE ----------------------------------------------------
  // Every rigidly-parented mesh on a joint is merged into one before the model
  // is ever handed out — Max Elephant's teeth and tusks, the Serpent's fangs,
  // the mane quills, every outline hull. The JOINTS survive, so every animator
  // above still works exactly as written. See builders/bake.js for what is
  // deliberately left alone (anything unlit, which is anything the builders
  // keep a live reference to).
  bakeStatic(body);
  const hulls = collectOutlines(body);
  let reveal = 0;
  const api = {
    group, body, pool, height, radius, hulls, extras: extras || {},
    // outline hulls are a second full pass over the geometry and they are two
    // pixels wide at range — the summon systems call this with the camera
    // distance each frame
    setLOD(dist) { applyLOD(hulls, dist); },
    // 0 = fully submerged in the shadow, 1 = fully out
    setReveal(k) {
      reveal = Math.max(0, Math.min(1, k));
      const e = reveal * reveal * (3 - 2 * reveal);
      body.position.y = (e - 1) * height * 1.05;
      const s = 0.62 + e * 0.38;
      body.scale.setScalar(s);
      pool.scale.setScalar(0.5 + e * 0.7);
      pool.children[1].material.opacity = 0.18 + (1 - e) * 0.5;
    },
    get reveal() { return reveal; },
    tick
  };
  api.setReveal(0);
  return api;
}

// ===========================================================================
// 1 — DIVINE DOGS 玉犬 : the twin wolves, one white and one black
// ===========================================================================
// PALETTE. The white twin is a warm off-white (#e6e2d8) shading to grey in the
// undercoat; the black twin is a blue-black (#26282f) that still holds a
// readable band rather than crushing to pure black. Both wear the three dots
// in the other's colour. The first coloured pass had the white dog at pure
// #ffffff and it blew out to a silhouette-free blob under the key light — the
// value is pulled down and the undercoat darkened so the fur bands survive.
export function buildDivineDog(white = false) {
  const S = 0.92;
  const body = new THREE.Group();

  const coat = white
    ? furTex('dogWhite', { base: '#e6e2d8', tip: '#ffffff', under: '#9a9c9e', dorsal: '#b9b6ae', density: 2400 })
    : furTex('dogBlack', { base: '#26282f', tip: '#4c505c', under: '#14161c', dorsal: '#0e1014', density: 2400 });
  const M = pelt(coat);
  // muzzle / paw pads / inner ear are a second value on the same pelt response
  const accent = white
    ? furTex('dogWhiteA', { base: '#cfc9bd', tip: '#e8e4da', under: '#8d8a84', density: 900 })
    : furTex('dogBlackA', { base: '#3a3d47', tip: '#565b68', under: '#1b1d24', density: 900 });
  const MA = pelt(accent);
  const dotSigil = sigilTex('threeDots', white ? '#1b1d24' : '#e8e4da');

  const root = joint(body, 0, 0.50 * S, 0);
  const chest = joint(root, 0, 0, 0.20 * S);
  const waist = joint(root, 0, 0, -0.06 * S);
  const hips = joint(waist, 0, 0, -0.22 * S);
  part(chest, ellipsoid(0.185 * S, 0.185 * S, 0.30 * S, 14), M, { outline: true, uvScale: [2, 2] });
  part(waist, ellipsoid(0.165 * S, 0.165 * S, 0.26 * S, 12), M, { uvScale: [2, 2] });
  part(hips, ellipsoid(0.175 * S, 0.180 * S, 0.24 * S, 12), M, { outline: true, uvScale: [2, 2] });
  // shoulder / haunch masses so the legs do not float off the barrel
  part(chest, tGeo(ellipsoid(0.09 * S, 0.13 * S, 0.13 * S, 8), { pos: [0.155 * S, -0.06 * S, 0.04 * S] }), M);
  part(chest, tGeo(ellipsoid(0.09 * S, 0.13 * S, 0.13 * S, 8), { pos: [-0.155 * S, -0.06 * S, 0.04 * S] }), M);
  // a paler ruff across the chest — wolves have one and it breaks the barrel up
  part(chest, tGeo(ellipsoid(0.20 * S, 0.16 * S, 0.11 * S, 10), { pos: [0, -0.05 * S, 0.20 * S] }), MA);

  const neck = joint(chest, 0, 0.09 * S, 0.24 * S);
  part(neck, tubeBetween(v3(0, 0, 0), v3(0, 0.07 * S, 0.16 * S), [0.125 * S, 0.105 * S], { radial: 9, hSeg: 3 }),
    M, { uv: 'cylY', uvScale: [2, 2] });
  const head = joint(neck, 0, 0.08 * S, 0.18 * S);
  part(head, ellipsoid(0.115 * S, 0.118 * S, 0.135 * S, 12), M, { outline: true, thickness: 0.011, uvScale: [2, 2] });
  part(head, tubeBetween(v3(0, -0.012 * S, 0.06 * S), v3(0, -0.045 * S, 0.215 * S),
    [0.072 * S, 0.036 * S], { radial: 8, hSeg: 3, zScale: 0.85 }), MA, { uv: 'cylZ', uvScale: [2, 2] });
  // the nose: a small dark pad, the one hard black on the white dog
  part(head, tGeo(ellipsoid(0.030 * S, 0.024 * S, 0.022 * S, 7), { pos: [0, -0.040 * S, 0.222 * S] }),
    voidMat(0x14161c));
  const jaw = joint(head, 0, -0.045 * S, 0.055 * S);
  part(jaw, tubeBetween(v3(0, 0, 0), v3(0, -0.012 * S, 0.155 * S), [0.055 * S, 0.028 * S], { radial: 7, hSeg: 2 }),
    MA, { uv: 'cylZ' });
  const fangMat = boneMat(maskTex('fang', { base: '#efe9dc', crack: '#b6ac98', stain: '#c9bda4' }));
  for (const s of [1, -1]) {
    part(jaw, tGeo(coneSpike(0.013 * S, 0.05 * S, v3(), { radial: 4, hSeg: 2 }),
      { rot: [180, 0, 0], pos: [s * 0.032 * S, 0.028 * S, 0.115 * S] }), fangMat, { uv: 'cylY' });
  }
  // ears: tall triangles raked back, with the paler inner surface showing
  for (const s of [1, -1]) {
    part(head, tGeo(coneSpike(0.042 * S, 0.13 * S, v3(s * 0.02 * S, 0, -0.03 * S), { radial: 4, hSeg: 3, zScale: 0.4 }),
      { pos: [s * 0.055 * S, 0.075 * S, -0.02 * S], rot: [-12, 0, s * 16] }), M, { uv: 'cylY' });
    part(head, tGeo(coneSpike(0.026 * S, 0.10 * S, v3(s * 0.015 * S, 0, 0), { radial: 4, hSeg: 2, zScale: 0.4 }),
      { pos: [s * 0.055 * S, 0.080 * S, 0.005 * S], rot: [-12, 0, s * 16] }), MA, { uv: 'cylY' });
  }
  // eyes — a hard slit. The white dog's is dark, the black dog's is lit: both
  // read at fight distance against their own coat, which one shared colour did
  // not do.
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.040 * S, 0.018 * S),
      white ? new THREE.MeshBasicMaterial({ color: 0x2a2c34, side: THREE.DoubleSide })
        : glow(0xcfe4ff, 0.75));
    e.position.set(s * 0.058 * S, 0.012 * S, 0.088 * S);
    e.rotation.set(0, s * 0.5, s * -0.22);
    head.add(e);
  }
  // THE THREE FOREHEAD DOTS, in the opposite colour — a decal, so they sit flat
  // on the skull the way they are drawn rather than as three beads stuck on it.
  // It has to sit ON the skull: at the first placement the plane was inside the
  // head ellipsoid (rz 0.124 against a z of 0.046) and simply never rendered.
  markDecal(head, 0.15 * S, dotSigil, { pos: [0, 0.082 * S, 0.088 * S], rot: [-0.75, 0, 0] });

  // legs
  const legs = [];
  for (const s of [1, -1]) {
    for (const [host, z, up, lo] of [[chest, 0.08 * S, 0.22, 0.19], [hips, -0.04 * S, 0.24, 0.21]]) {
      const hip = joint(host, s * 0.105 * S, -0.09 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -up * S, 0), [0.062 * S, 0.040 * S], { radial: 7, hSeg: 3 }),
        M, { uv: 'cylY', uvScale: [1, 2] });
      const knee = joint(hip, 0, -up * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -lo * S, 0), [0.040 * S, 0.028 * S], { radial: 6, hSeg: 3 }),
        M, { uv: 'cylY', uvScale: [1, 2] });
      const paw = joint(knee, 0, -lo * S, 0);
      part(paw, tGeo(roundBox(0.062 * S, 0.036 * S, 0.088 * S, 0.014 * S), { pos: [0, -0.014 * S, 0.018 * S] }), MA);
      legs.push({ hip, knee, paw, front: host === chest, side: s });
    }
  }

  // tail: a three-link brush that lags behind the body
  const tailA = joint(hips, 0, 0.08 * S, -0.18 * S);
  part(tailA, tubeBetween(v3(0, 0, 0), v3(0, 0.02 * S, -0.16 * S), [0.045 * S, 0.038 * S], { radial: 7, hSeg: 2 }), M, { uv: 'cylZ' });
  const tailB = joint(tailA, 0, 0.02 * S, -0.16 * S);
  part(tailB, tubeBetween(v3(0, 0, 0), v3(0, -0.01 * S, -0.15 * S), [0.038 * S, 0.028 * S], { radial: 6, hSeg: 2 }), M, { uv: 'cylZ' });
  const tailC = joint(tailB, 0, -0.01 * S, -0.15 * S);
  part(tailC, tubeBetween(v3(0, 0, 0), v3(0, -0.03 * S, -0.13 * S), [0.028 * S, 0.008 * S], { radial: 5, hSeg: 2 }), MA, { uv: 'cylZ' });

  // ---- QUADRUPED GAIT -----------------------------------------------------
  // A trot: diagonal pairs move together, so front-left swings with rear-right.
  // The spine counter-rotates and the body bobs at twice the stride rate.
  let t = 0;
  const tick = (dt, st) => {
    const run = Math.min(1, (st.speed ?? 0) / 6);
    t += dt * (2.6 + run * 9);
    const bite = st.action === 'bite' ? st.actionK : 0;
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI) + (L.side > 0 ? 0 : Math.PI));
      const swing = Math.sin(ph);
      const lift = Math.max(0, Math.sin(ph)) * (0.35 + run * 0.55);
      L.hip.rotation.x = swing * (0.42 + run * 0.32) * (L.front ? 1 : -0.86);
      L.knee.rotation.x = -lift * (L.front ? 0.9 : 1.25) - 0.12;
      L.paw.rotation.x = lift * 0.5;
    }
    root.position.y = 0.50 * S + Math.abs(Math.sin(t)) * 0.028 * (0.5 + run);
    root.rotation.z = Math.sin(t) * 0.05 * run;
    chest.rotation.x = -0.06 + Math.sin(t * 2) * 0.04 - bite * 0.25;
    waist.rotation.y = Math.sin(t) * 0.10 * run;
    hips.rotation.x = 0.04 - Math.sin(t * 2) * 0.03;
    neck.rotation.x = -0.18 + Math.sin(t * 2 + 1) * 0.05 + bite * 0.5;
    head.rotation.x = 0.10 - bite * 0.45;
    jaw.rotation.x = 0.05 + (st.action === 'bite' ? Math.sin(st.actionK * Math.PI) * 0.75 : 0);
    tailA.rotation.x = -0.5 + Math.sin(t * 0.9) * 0.10;
    tailA.rotation.y = Math.sin(t * 0.75) * 0.22;
    tailB.rotation.y = Math.sin(t * 0.75 - 0.7) * 0.30;
    tailC.rotation.y = Math.sin(t * 0.75 - 1.4) * 0.36;
    tailB.rotation.x = Math.sin(t * 0.9 - 0.6) * 0.14;
    if (st.hurt) { chest.rotation.x -= 0.3; head.rotation.x += 0.4; }
  };

  return finish(body, { height: 0.95 * S, radius: 0.5 * S, poolR: 0.62 * S, tick, extras: { white } });
}

// ===========================================================================
// 2 — NUE 鵺 : orange plumage, white bone mask, human teeth, purple lightning
// ===========================================================================
export function buildNue() {
  const S = 1.05;
  const body = new THREE.Group();
  const root = joint(body, 0, 1.5 * S, 0);

  // ORANGE. The wiki is unambiguous — "orange feathers" — and the anime pushes
  // it to a burnt amber that still separates from the mask. Body plumage is the
  // hot value, the wing coverts a darker rust so the wings read as separate
  // masses against the torso rather than as one silhouette.
  const plumeTex = featherTex('nue', { base: '#c46f28', tip: '#e39a4a', shaft: '#7a3c12', rows: 15 });
  const covertTex = featherTex('nueCovert', { base: '#8f4a1a', tip: '#c07434', shaft: '#5a2a0c', rows: 11 });
  const PL = pelt(plumeTex);
  const CV = pelt(covertTex);
  const MASK = boneMat(maskTex('nueMask', { base: '#e8e2d2', crack: '#a89880', stain: '#c8b898' }));
  const markSig = sigilTex('mitsudomoe', '#3b2a1a');

  const torso = joint(root, 0, 0, 0);
  part(torso, ellipsoid(0.26 * S, 0.32 * S, 0.28 * S, 14), PL, { outline: true, uvScale: [2, 2] });
  for (let i = 0; i < 3; i++) {
    part(torso, tGeo(ellipsoid(0.22 * S - i * 0.03 * S, 0.11 * S, 0.18 * S, 9),
      { pos: [0, -0.06 * S - i * 0.10 * S, 0.06 * S] }), i % 2 ? CV : PL, { uvScale: [2, 1] });
  }

  // HEAD — the white mask-like skull with human teeth. This is THE read, so it
  // is deliberately oversized relative to the body: a small mask disappears at
  // fight distance and the whole design goes with it.
  const neck = joint(torso, 0, 0.26 * S, 0.08 * S);
  const head = joint(neck, 0, 0.13 * S, 0.05 * S);
  part(head, ellipsoid(0.22 * S, 0.21 * S, 0.20 * S, 12), CV, { outline: true, thickness: 0.013, uvScale: [2, 2] });
  // THE MASK HAS TO CLEAR THE SKULL. At its first placement it sat at z 0.13
  // inside a skull of half-depth 0.20 and poked out by fifteen millimetres —
  // the single most important read on the creature, invisible. It is pushed
  // forward and deepened so the whole pale plate stands proud of the plumage.
  const mask = joint(head, 0, 0.005 * S, 0.185 * S);
  part(mask, ellipsoid(0.205 * S, 0.205 * S, 0.115 * S, 16), MASK, { outline: true, thickness: 0.011 });
  // two sunken eye pits — amber, because a purple eye would fight the purple
  // electricity that is the creature's actual signature
  for (const s of [1, -1]) {
    const pit = new THREE.Mesh(new THREE.CircleGeometry(0.062 * S, 12), voidMat(0x22190e));
    pit.position.set(s * 0.082 * S, 0.048 * S, 0.104 * S);
    mask.add(pit);
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.042 * S, 12), glow(0xd8a04c, 0.7));
    e.position.set(s * 0.082 * S, 0.048 * S, 0.108 * S);
    mask.add(e);
  }
  // HUMAN-LIKE TEETH: a straight even row, which is precisely the wrong shape
  // for a bird and precisely why the design is unsettling
  // the dark mouth line the teeth sit in, so the row reads as a mouth rather
  // than as seven pale blocks glued to a plate
  const gum = new THREE.Mesh(new THREE.PlaneGeometry(0.24 * S, 0.055 * S), voidMat(0x1a1208));
  gum.position.set(0, -0.115 * S, 0.096 * S);
  mask.add(gum);
  for (let i = -3; i <= 3; i++) {
    part(mask, tGeo(roundBox(0.026 * S, 0.036 * S, 0.014 * S, 0.004),
      { pos: [i * 0.030 * S, -0.115 * S, 0.100 * S] }), MASK);
  }
  // the forehead mark, matching the Great Serpent's
  markDecal(mask, 0.15 * S, markSig, { pos: [0, 0.128 * S, 0.088 * S], rot: [-0.55, 0, 0] });

  // WINGS — three segments a side so the flap can lag outward along the span.
  const wings = [];
  for (const s of [1, -1]) {
    const shoulder = joint(torso, s * 0.20 * S, 0.12 * S, 0);
    part(shoulder, tubeBetween(v3(0, 0, 0), v3(s * 0.52 * S, 0.07 * S, 0), [0.085 * S, 0.062 * S], { radial: 7, hSeg: 3 }),
      CV, { outline: true, thickness: 0.011, uv: 'cylY' });
    // THE INNER WING IS A SURFACE, not a bone with feathers on the end. The
    // first pass had one thin covert disc and the whole wing read as a brown
    // arm; the coverts are widened and doubled so there is a continuous
    // membrane from shoulder to wrist for the primaries to grow out of.
    part(shoulder, tGeo(ellipsoid(0.34 * S, 0.034 * S, 0.32 * S, 12), { pos: [s * 0.28 * S, 0.01 * S, -0.09 * S] }),
      CV, { uv: 'planarXZ', uvScale: [2, 2] });
    part(shoulder, tGeo(ellipsoid(0.26 * S, 0.028 * S, 0.20 * S, 10), { pos: [s * 0.26 * S, 0.03 * S, 0.06 * S] }),
      PL, { uv: 'planarXZ', uvScale: [2, 2] });
    const elbow = joint(shoulder, s * 0.52 * S, 0.07 * S, 0);
    part(elbow, tubeBetween(v3(0, 0, 0), v3(s * 0.48 * S, -0.03 * S, 0), [0.062 * S, 0.042 * S], { radial: 6, hSeg: 3 }),
      CV, { outline: true, thickness: 0.010, uv: 'cylY' });
    part(elbow, tGeo(ellipsoid(0.28 * S, 0.028 * S, 0.26 * S, 11), { pos: [s * 0.24 * S, 0, -0.07 * S] }),
      PL, { uv: 'planarXZ', uvScale: [2, 2] });
    const wrist = joint(elbow, s * 0.48 * S, -0.03 * S, 0);
    const feathers = [];
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const f = joint(wrist, 0, 0, 0);
      f.rotation.y = s * (-0.34 + k * 1.15);
      part(f, tGeo(coneSpike(0.055 * S, (0.78 - k * 0.26) * S, v3(0, 0, 0), { radial: 4, hSeg: 3, zScale: 0.16 }),
        { rot: [0, 0, s * -94] }), i % 2 ? CV : PL, { outline: i === 3, thickness: 0.010, uv: 'cylY', uvScale: [1, 3] });
      feathers.push(f);
    }
    wings.push({ shoulder, elbow, wrist, feathers, side: s });
  }

  // THE ELECTRO-SHOCK ARCS. Purple, per the wiki, and they live on the wings
  // because that is where the discharge comes from. Hidden at rest, driven by
  // `st.charge` so the dive telegraphs itself before it arrives.
  const arcs = [];
  for (const w of wings) {
    for (let i = 0; i < 3; i++) {
      const a = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * S, 0.05 * S), glow(0xc8a8ff, 0.0));
      a.position.set(w.side * (0.45 + i * 0.22) * S, rand(-0.1, 0.16) * S, rand(-0.08, 0.08) * S);
      a.rotation.z = rand(-0.4, 0.4);
      w.shoulder.add(a);
      arcs.push(a);
    }
  }

  // TWO SETS OF TALONS, as the design has
  const talons = [];
  const clawMat = boneMat(maskTex('nueClaw', { base: '#d8d0be', crack: '#9a8f78', stain: '#b8a98c' }));
  for (const s of [1, -1]) {
    for (const z of [0.09 * S, -0.08 * S]) {
      const hip = joint(torso, s * 0.11 * S, -0.24 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.20 * S, 0), [0.038 * S, 0.028 * S], { radial: 6, hSeg: 2 }),
        CV, { uv: 'cylY' });
      const foot = joint(hip, 0, -0.20 * S, 0);
      for (let i = -1; i <= 1; i++) {
        part(foot, tGeo(coneSpike(0.013 * S, 0.075 * S, v3(0, 0, 0.02 * S), { radial: 4, hSeg: 2 }),
          { rot: [110, 0, 0], pos: [i * 0.022 * S, 0, 0.012 * S] }), clawMat, { uv: 'cylY' });
      }
      talons.push({ hip, foot });
    }
  }
  const tail = joint(torso, 0, -0.10 * S, -0.22 * S);
  for (let i = -2; i <= 2; i++) {
    part(tail, tGeo(coneSpike(0.030 * S, 0.30 * S, v3(), { radial: 4, hSeg: 2, zScale: 0.25 }),
      { rot: [96, 0, 0], pos: [i * 0.030 * S, 0, 0] }), i % 2 ? CV : PL, { uv: 'cylY', uvScale: [1, 2] });
  }

  // ---- FLIGHT CYCLE -------------------------------------------------------
  // Down-stroke fast and shallow, up-stroke slow and deep; the elbow lags the
  // shoulder and the primaries lag the elbow.
  let t = 0;
  const tick = (dt, st) => {
    const dive = st.action === 'dive' ? st.actionK : 0;
    t += dt * (st.action === 'dive' ? 11 : 6.2);
    const raw = Math.sin(t);
    const flap = Math.sign(raw) * Math.pow(Math.abs(raw), 0.65);
    for (const w of wings) {
      const tuck = dive * 1.15;
      w.shoulder.rotation.z = w.side * (flap * 0.55 + 0.10 - tuck * 0.5);
      w.shoulder.rotation.y = w.side * (-tuck * 0.85);
      w.elbow.rotation.z = w.side * (Math.sin(t - 0.55) * 0.42 - tuck * 0.35);
      w.wrist.rotation.z = w.side * (Math.sin(t - 1.05) * 0.34);
      w.feathers.forEach((f, i) => { f.rotation.z = w.side * Math.sin(t - 1.3 - i * 0.13) * 0.22; });
    }
    // the discharge: strongest through the dive, flickering rather than steady
    const charge = Math.max(dive, st.charge ?? 0);
    arcs.forEach((a, i) => {
      a.material.opacity = charge * (0.35 + 0.45 * Math.abs(Math.sin(t * 21 + i * 2.1)));
      a.scale.x = 0.6 + charge * (0.6 + Math.sin(t * 17 + i) * 0.3);
    });
    root.position.y = 1.5 * S + Math.sin(t) * 0.10 - dive * 0.9;
    torso.rotation.x = 0.10 + Math.sin(t * 2) * 0.05 + dive * 0.85;
    neck.rotation.x = -0.16 - dive * 0.35;
    head.rotation.x = Math.sin(t * 0.7) * 0.08 + dive * 0.55;
    head.rotation.y = Math.sin(t * 0.4) * 0.25 * (1 - dive);
    for (const L of talons) {
      L.hip.rotation.x = 0.55 - dive * 1.5 + Math.sin(t - 0.4) * 0.10;
      L.foot.rotation.x = -0.7 + dive * 1.1;
    }
    tail.rotation.x = 0.30 + Math.sin(t - 0.8) * 0.12 + dive * 0.4;
    if (st.hurt) { torso.rotation.x -= 0.4; }
  };

  return finish(body, { height: 2.1 * S, radius: 0.75 * S, poolR: 0.8 * S, tick });
}

// ===========================================================================
// 3 — TOAD 蝦蟇 : green wet amphibian, eye markings, the Mirror on its stomach
// ===========================================================================
export function buildToad() {
  const S = 1.15;
  const body = new THREE.Group();

  // GREEN, and wet. The wiki's own trivia note is that it is drawn as a FROG —
  // smooth moist skin — despite being named for a toad, so the surface is a
  // glossy mottled dermis rather than the dry warty one the name implies. The
  // warts are kept but small: they are the compromise between the name and the
  // drawing, and the anime does show a bumpy dorsal ridge.
  const skin = amphibianTex('toad', {
    base: '#5f7f3e', mottle: '#33502a', wart: '#7c9a4e', belly: '#d6cf9e'
  });
  const SK = dermis(skin);
  const dark = dermis(amphibianTex('toadDk', {
    base: '#3d5a2a', mottle: '#22381c', wart: '#4e6c33', belly: '#8f9a63'
  }));
  const mirrorSig = sigilTex('mirror', '#2a3a18');
  const eyeMarkSig = sigilTex('threeDots', '#2a3a18');

  const root = joint(body, 0, 0.30 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, ellipsoid(0.42 * S, 0.28 * S, 0.46 * S, 16), SK, { outline: true, uvScale: [2, 2] });
  // dorsal bumps — kept sparse
  for (let i = 0; i < 10; i++) {
    const a = rand(0, Math.PI * 2), r = rand(0.12, 0.34) * S;
    part(torso, tGeo(new THREE.SphereGeometry(rand(0.03, 0.058) * S, 6, 5),
      { pos: [Math.cos(a) * r, 0.20 * S + rand(-0.03, 0.04) * S, Math.sin(a) * r] }), dark);
  }
  // THE STOMACH SYMBOL — the Mirror of the Deep, on the underside where the
  // design puts it. Visible when it rears for the tongue, which is the only
  // time the belly is presented anyway.
  markDecal(torso, 0.42 * S, mirrorSig, { pos: [0, -0.275 * S, 0.02 * S], rot: [Math.PI / 2, 0, 0] });

  const head = joint(torso, 0, 0.05 * S, 0.34 * S);
  part(head, ellipsoid(0.30 * S, 0.20 * S, 0.20 * S, 14), SK, { outline: true, thickness: 0.012, uvScale: [2, 2] });
  const jaw = joint(head, 0, -0.08 * S, -0.02 * S);
  part(jaw, tGeo(ellipsoid(0.28 * S, 0.09 * S, 0.19 * S, 12), { pos: [0, 0, 0.02 * S] }), dark);
  for (const s of [1, -1]) {
    const eye = joint(head, s * 0.155 * S, 0.145 * S, 0.02 * S);
    part(eye, new THREE.SphereGeometry(0.075 * S, 10, 8), dark);
    // a real frog eye: gold iris, horizontal slit pupil
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.046 * S, 12),
      new THREE.MeshBasicMaterial({ color: 0xd8b83c, side: THREE.DoubleSide }));
    iris.position.set(s * 0.03 * S, 0.02 * S, 0.062 * S);
    iris.rotation.y = s * 0.4;
    eye.add(iris);
    const pupil = new THREE.Mesh(new THREE.PlaneGeometry(0.052 * S, 0.014 * S), voidMat(0x0e1408));
    pupil.position.set(s * 0.032 * S, 0.02 * S, 0.066 * S);
    pupil.rotation.y = s * 0.4;
    eye.add(pupil);
    // brow ridge
    part(head, tGeo(ellipsoid(0.10 * S, 0.045 * S, 0.09 * S, 8),
      { pos: [s * 0.155 * S, 0.20 * S, 0.01 * S] }), SK);
    // THE MARKS AROUND ITS EYES, which the wiki calls out explicitly
    markDecal(head, 0.20 * S, eyeMarkSig,
      { pos: [s * 0.16 * S, 0.215 * S, 0.03 * S], rot: [-1.25, 0, s * 0.5], opacity: 0.85 });
  }

  // THE TONGUE: a chain of shrinking links kept inside the mouth until fired
  const tongueMat = dermis(amphibianTex('tongue', {
    base: '#b8595f', mottle: '#8e3a44', wart: '#c97078', belly: '#d99098'
  }));
  const tongueLinks = [];
  let tongueRoot;
  {
    let host = tongueRoot = joint(jaw, 0, 0.03 * S, 0.16 * S);
    for (let i = 0; i < 10; i++) {
      const r = (0.052 - i * 0.0034) * S;
      part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, 0.30 * S), [r, r * 0.94], { radial: 6, hSeg: 2 }),
        tongueMat, { uv: 'cylZ' });
      host = joint(host, 0, 0, 0.30 * S);
      tongueLinks.push(host);
    }
    part(host, ellipsoid(0.06 * S, 0.03 * S, 0.07 * S, 8), tongueMat);
  }
  // squat legs
  const legs = [];
  for (const s of [1, -1]) {
    const rear = joint(torso, s * 0.30 * S, -0.16 * S, -0.20 * S);
    part(rear, tubeBetween(v3(0, 0, 0), v3(s * 0.12 * S, -0.02 * S, -0.16 * S), [0.10 * S, 0.06 * S], { radial: 7, hSeg: 2 }), SK, { uv: 'cylY' });
    const shin = joint(rear, s * 0.12 * S, -0.02 * S, -0.16 * S);
    part(shin, tubeBetween(v3(0, 0, 0), v3(s * 0.03 * S, -0.20 * S, 0.10 * S), [0.055 * S, 0.038 * S], { radial: 6, hSeg: 2 }), SK, { uv: 'cylY' });
    const foot = joint(shin, s * 0.03 * S, -0.20 * S, 0.10 * S);
    part(foot, tGeo(ellipsoid(0.07 * S, 0.024 * S, 0.11 * S, 8), { pos: [0, 0, 0.03 * S] }), dark);
    const front = joint(torso, s * 0.26 * S, -0.18 * S, 0.24 * S);
    part(front, tubeBetween(v3(0, 0, 0), v3(s * 0.03 * S, -0.14 * S, 0.03 * S), [0.052 * S, 0.036 * S], { radial: 6, hSeg: 2 }), SK, { uv: 'cylY' });
    const hand = joint(front, s * 0.03 * S, -0.14 * S, 0.03 * S);
    part(hand, tGeo(ellipsoid(0.055 * S, 0.020 * S, 0.075 * S, 7), { pos: [0, 0, 0.025 * S] }), dark);
    legs.push({ rear, shin, foot, front, hand, side: s });
  }

  // ---- BREATHE / HOP / TONGUE ---------------------------------------------
  let t = 0, hop = 0;
  const tick = (dt, st) => {
    t += dt * 2.0;
    const breathe = Math.sin(t) * 0.5 + 0.5;
    torso.scale.set(1 + breathe * 0.05, 1 - breathe * 0.03, 1 + breathe * 0.04);
    jaw.rotation.x = 0.04 + breathe * 0.05;
    head.rotation.x = -0.05 + breathe * 0.04;
    if ((st.speed ?? 0) > 0.4) hop += dt * 4.2; else hop = 0;
    const h = hop > 0 ? Math.max(0, Math.sin(hop)) : 0;
    root.position.y = 0.30 * S + h * 0.30 * S;
    torso.rotation.x = -h * 0.28;
    for (const L of legs) {
      L.rear.rotation.x = 0.2 - h * 1.0;
      L.shin.rotation.x = -0.5 + h * 1.2;
      L.front.rotation.x = -0.1 + h * 0.5;
    }
    const reach = st.tongue ?? 0;
    tongueRoot.visible = reach > 0.02;
    tongueLinks.forEach((l, i) => {
      l.position.z = 0.30 * S * (0.02 + reach * 0.98);
      l.rotation.y = Math.sin(t * 5 + i * 0.5) * 0.05 * reach;
      l.rotation.x = Math.sin(t * 4 + i * 0.4) * 0.03 * reach;
      l.visible = reach > 0.02;
    });
    if (reach > 0.02) jaw.rotation.x = 0.75;
    if (st.hurt) torso.rotation.x -= 0.25;
  };

  return finish(body, { height: 0.85 * S, radius: 0.62 * S, poolR: 0.72 * S, tick, extras: { tongueLinks } });
}

// ===========================================================================
// 4 — GREAT SERPENT 大蛇 : white scales, tan-yellow belly, black markings
// ===========================================================================
export function buildGreatSerpent() {
  const S = 1.0;
  const LINKS = 16;
  const body = new THREE.Group();

  // THE THREE COLOURS THE WIKI NAMES, and they all have to be visible at once:
  // a WHITE dorsal, a TAN-YELLOW ventral, and BLACK MARKINGS running the body.
  // The scale texture carries the white and the banding; the belly is a second
  // material on a separate ventral strip, because a single cylindrical unwrap
  // cannot put a hard-edged belly stripe on a taper without visible pinching.
  const dorsal = scaleMat(scaleTex('serpent', {
    base: '#e0dbcf', edge: '#a9a396', dark: '#6f6a5e', band: '#1b1d22', bandEvery: 4, rows: 22
  }));
  const ventral = scaleMat(scaleTex('serpentBelly', {
    base: '#cdae66', edge: '#a2884c', dark: '#7a6432', rows: 30
  }));
  const markSig = sigilTex('mitsudomoe', '#1b1d22');

  const root = joint(body, 0, 0.30 * S, 0);
  const links = [];
  let host = root;
  for (let i = 0; i < LINKS; i++) {
    const k = i / (LINKS - 1);
    const r = (0.19 - Math.pow(k, 1.5) * 0.16) * S * (i < 2 ? 0.9 + i * 0.06 : 1);
    const len = 0.34 * S;
    // EACH LINK SAMPLES ITS OWN SLICE of the scale texture, stepping the v
    // offset link by link. Mapping the whole texture onto every 0.34 m link
    // put four black saddles inside every segment and the banding vanished
    // into noise; stepping it means the saddles run CONTINUOUSLY down the
    // animal, which is what "black markings all over its body" looks like.
    part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, -len), [r, r * 0.93], { radial: 10, hSeg: 2 }),
      dorsal, { outline: i % 4 === 0, thickness: 0.012, uv: 'cylZ', uvScale: [1, 0.30], uvOffset: [0, i * 0.30] });
    // the belly: a flattened strip riding under each link
    part(host, tGeo(ellipsoid(r * 0.72, r * 0.30, len * 0.52, 8), { pos: [0, -r * 0.72, -len * 0.5] }),
      ventral, { uvScale: [1, 2] });
    const next = joint(host, 0, 0, -len);
    links.push(next);
    host = next;
  }
  // head: a flat wedge, jaw, forehead mark
  const head = joint(root, 0, 0, 0.10 * S);
  part(head, tGeo(ellipsoid(0.19 * S, 0.13 * S, 0.26 * S, 12), { pos: [0, 0, 0.14 * S] }), dorsal,
    { outline: true, uvScale: [2, 2] });
  const jaw = joint(head, 0, -0.06 * S, 0.10 * S);
  part(jaw, tGeo(ellipsoid(0.16 * S, 0.05 * S, 0.20 * S, 10), { pos: [0, 0, 0.13 * S] }), ventral);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.13 * S, 12), voidMat(0x2a1418));
  mouth.position.set(0, 0.01 * S, 0.16 * S);
  mouth.rotation.x = -1.35;
  jaw.add(mouth);
  const fangMat = boneMat(maskTex('serpFang', { base: '#efe9dc', crack: '#b6ac98', stain: '#c9bda4' }));
  for (const s of [1, -1]) {
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.035 * S, 10),
      new THREE.MeshBasicMaterial({ color: 0xd8b06a, side: THREE.DoubleSide }));
    e.position.set(s * 0.12 * S, 0.05 * S, 0.20 * S);
    e.rotation.y = s * 0.85;
    head.add(e);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.010 * S, 0.048 * S), voidMat(0x140f08));
    p.position.set(s * 0.126 * S, 0.05 * S, 0.204 * S);
    p.rotation.y = s * 0.85;
    head.add(p);
    part(jaw, tGeo(coneSpike(0.016 * S, 0.075 * S, v3(), { radial: 4, hSeg: 2 }),
      { rot: [176, 0, 0], pos: [s * 0.06 * S, 0.05 * S, 0.20 * S] }), fangMat, { uv: 'cylY' });
  }
  markDecal(head, 0.20 * S, markSig, { pos: [0, 0.115 * S, 0.14 * S], rot: [-1.2, 0, 0] });

  // ---- SERPENTINE MOTION --------------------------------------------------
  // One sine travelling tail-ward along the chain. `st.coil` folds the wave
  // into a tightening spiral for the constriction, `st.rush` flattens it into a
  // straight ground-hugging charge.
  let t = 0;
  const tick = (dt, st) => {
    const rush = st.rush ?? 0, coil = st.coil ?? 0;
    t += dt * (2.6 + rush * 5.5 + (st.speed ?? 0) * 0.5);
    links.forEach((l, i) => {
      const k = i / (LINKS - 1);
      const wave = Math.sin(t - i * 0.55);
      l.rotation.y = wave * (0.10 + 0.28 * k) * (1 - rush * 0.6) + coil * 0.34;
      l.rotation.x = Math.cos(t * 0.9 - i * 0.4) * 0.045 * (1 - rush * 0.5) - coil * 0.10;
    });
    root.position.y = 0.30 * S + Math.sin(t * 1.4) * 0.05 - rush * 0.16 + coil * 0.55;
    root.rotation.x = -rush * 0.12;
    head.rotation.x = Math.sin(t * 1.2) * 0.06 - rush * 0.10;
    head.rotation.y = Math.sin(t * 0.8) * 0.10 * (1 - rush);
    jaw.rotation.x = 0.06 + (st.action === 'bite' ? Math.sin(st.actionK * Math.PI) * 0.8 : Math.sin(t * 0.6) * 0.04);
    if (st.hurt) head.rotation.x -= 0.3;
  };

  return finish(body, { height: 0.8 * S, radius: 0.7 * S, poolR: 0.9 * S, tick, extras: { links } });
}

// ===========================================================================
// 5 — MAX ELEPHANT 満象 : THE PRIORITY. Pale hide, ornate yellow markings.
// ===========================================================================
// REFERENCE. "A large elephant with black markings (yellow in the anime) on its
// FOREHEAD, the TOP OF ITS HEAD, its BACK, and its KNEES." Four placements,
// named explicitly, and they are the design — an unmarked elephant is just an
// elephant. Built to the ANIME, so the ornament is the warm yellow (#e8b93c)
// against a pale grey-fawn hide (#b6b0a4) rather than black on grey.
//
// The ornament is painted into the hide texture rather than assembled from
// geometry, because it is a PAINTED marking on a wrinkled surface — arcs,
// magatama rings and stroked bands that follow the body — and geometry cannot
// carry that. `hideTex` takes marks in UV space, and the placements below are
// the four the wiki names, on the four separately-unwrapped masses that own
// them: skull (forehead + crown), torso (back), and the knee segments.
export function buildMaxElephant() {
  const S = 1.9;
  const body = new THREE.Group();

  const HIDE = '#b6b0a4', CREASE = '#7d786d', GOLD = '#e8b93c', DEEP = '#a8781c';

  // HOW THE ORNAMENT IS APPLIED, which took two passes to get right.
  //
  // The KNEES get theirs baked into the texture, because a knee is a tube and
  // `projectUV('cylY')` genuinely wraps a tube: a horizontal band in UV space
  // comes out as a cuff all the way round the leg, which is exactly what the
  // design has.
  //
  // The FOREHEAD, the CROWN and the BACK do NOT. They are named placements on
  // rounded masses, and neither unwrap of a sphere will put a glyph on a named
  // spot: the spherical one smears anything near a pole into a band, and the
  // cylindrical one collapses the two caps. Both were tried and both looked
  // like a gold smear rather than a marking. So those three are DECALS —
  // flat, placed, crisp, and exactly where the reference says they are.
  const kneeHide = pelt(hideTex('elephantKnee', {
    base: HIDE, crease: CREASE, mark: GOLD, mark2: DEEP,
    marks: [
      { x: 0.5, y: 0.30, r: 0.55, kind: 'band' },
      { x: 0.5, y: 0.52, r: 0.40, kind: 'band' }
    ]
  }));
  const ornRays = ornamentTex('rays', GOLD, DEEP);
  const ornArcs = ornamentTex('arcs', GOLD, DEEP);
  const ornRing = ornamentTex('mitsudomoe', GOLD, DEEP);
  // plain hide for the parts the design leaves bare
  const plainHide = pelt(hideTex('elephantPlain', { base: HIDE, crease: CREASE, mark: GOLD, mark2: DEEP }));
  // the ears are left BARE: the wiki names four placements — forehead, crown,
  // back, knees — and putting ornament on the ears too would be inventing a
  // fifth, which on the one creature the brief singles out for accuracy is
  // exactly the wrong call.
  const earHide = pelt(hideTex('elephantEar', { base: '#a8a296', crease: '#6f6a60', mark: GOLD, mark2: DEEP }));
  const TUSK = boneMat(maskTex('tusk', { base: '#efe7d4', crack: '#b8ab90', stain: '#cdbf9e' }));

  const root = joint(body, 0, 0.98 * S, 0);
  const torso = joint(root, 0, 0, 0);
  part(torso, ellipsoid(0.52 * S, 0.50 * S, 0.72 * S, 18), plainHide, { outline: true, thickness: 0.018, uvScale: [3, 3] });
  part(torso, tGeo(ellipsoid(0.44 * S, 0.42 * S, 0.30 * S, 12), { pos: [0, 0.06 * S, -0.55 * S] }), plainHide, { uvScale: [3, 3] });
  // THE BACK: a magatama ring at the withers with stacked crescents behind it,
  // lying flat on the spine and slightly proud of it so they never z-fight.
  markDecal(torso, 0.52 * S, ornRing, { pos: [0, 0.505 * S, 0.30 * S], rot: [-Math.PI / 2, 0, 0] });
  markDecal(torso, 0.62 * S, ornArcs, { pos: [0, 0.508 * S, -0.06 * S], rot: [-Math.PI / 2, 0, 0] });
  markDecal(torso, 0.52 * S, ornArcs, { pos: [0, 0.500 * S, -0.42 * S], rot: [-Math.PI / 2, 0, Math.PI] });

  const neck = joint(torso, 0, 0.16 * S, 0.60 * S);
  const head = joint(neck, 0, 0.02 * S, 0.16 * S);
  part(head, ellipsoid(0.34 * S, 0.36 * S, 0.30 * S, 16), plainHide, { outline: true, thickness: 0.016, uvScale: [2, 2] });
  const brow = part(head, tGeo(ellipsoid(0.26 * S, 0.16 * S, 0.12 * S, 10), { pos: [0, 0.26 * S, 0.04 * S] }),
    plainHide, { uvScale: [2, 2] });
  // THE FOREHEAD sunburst, facing the player, and THE TOP OF THE HEAD arcs.
  markDecal(head, 0.44 * S, ornRays, { pos: [0, 0.135 * S, 0.285 * S], rot: [-0.32, 0, 0] });
  markDecal(head, 0.40 * S, ornArcs, { pos: [0, 0.365 * S, 0.045 * S], rot: [-Math.PI / 2 + 0.18, 0, 0] });
  const ears = [];
  for (const s of [1, -1]) {
    const ear = joint(head, s * 0.30 * S, 0.06 * S, -0.06 * S);
    part(ear, tGeo(ellipsoid(0.30 * S, 0.34 * S, 0.035 * S, 12), { pos: [s * 0.26 * S, -0.02 * S, -0.10 * S] }),
      earHide, { outline: true, thickness: 0.014, uv: 'planarXY' });
    ears.push(ear);
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.045 * S, 10),
      new THREE.MeshBasicMaterial({ color: 0x6a5330, side: THREE.DoubleSide }));
    e.position.set(s * 0.20 * S, 0.06 * S, 0.26 * S);
    e.rotation.y = s * 0.5;
    head.add(e);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.022 * S, 8), voidMat(0x18120a));
    pupil.position.set(s * 0.204 * S, 0.06 * S, 0.264 * S);
    pupil.rotation.y = s * 0.5;
    head.add(pupil);
    // TUSKS: long, curving forward and up
    // NO OUTLINE HULL ON THE TUSKS. An inverted hull on a long, thin, BENT
    // spike turns itself inside out along the bend — the backface shell ends up
    // in front of the tusk instead of behind it and the whole thing renders as
    // a black blade. It cost a pass to find; the tusks read fine on their own
    // because they are the brightest value on the animal.
    part(head, tGeo(coneSpike(0.055 * S, 0.62 * S, v3(s * 0.10 * S, 0.28 * S, 0.16 * S), { radial: 8, hSeg: 5 }),
      { rot: [72, 0, s * 12], pos: [s * 0.17 * S, -0.22 * S, 0.22 * S] }), TUSK,
      { uv: 'cylY', uvScale: [1, 2] });
  }

  // TRUNK: eight links, tapering, hung off the front of the skull. Ringed —
  // the horizontal creasing is what says trunk at any distance.
  const trunkHide = pelt(hideTex('elephantTrunk', { base: HIDE, crease: CREASE, mark: GOLD, mark2: DEEP }));
  const trunk = [];
  {
    let host = joint(head, 0, -0.14 * S, 0.28 * S);
    for (let i = 0; i < 8; i++) {
      const r = (0.115 - i * 0.010) * S;
      part(host, tubeBetween(v3(0, 0, 0), v3(0, -0.17 * S, 0), [r, r * 0.92], { radial: 9, hSeg: 3 }),
        trunkHide, { uv: 'cylY', uvScale: [2, 3] });
      host = joint(host, 0, -0.17 * S, 0);
      trunk.push(host);
    }
  }

  // legs: four columns, and THE KNEE BAND is on the lower segment
  const legs = [];
  for (const s of [1, -1]) {
    for (const z of [0.36 * S, -0.42 * S]) {
      const hip = joint(torso, s * 0.34 * S, -0.34 * S, z);
      part(hip, tubeBetween(v3(0, 0, 0), v3(0, -0.34 * S, 0), [0.17 * S, 0.15 * S], { radial: 10, hSeg: 2 }),
        plainHide, { outline: true, thickness: 0.014, uv: 'cylY' });
      const knee = joint(hip, 0, -0.34 * S, 0);
      part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.30 * S, 0), [0.15 * S, 0.16 * S], { radial: 10, hSeg: 3 }),
        kneeHide, { uv: 'cylY' });
      const foot = joint(knee, 0, -0.30 * S, 0);
      part(foot, tGeo(ellipsoid(0.18 * S, 0.07 * S, 0.19 * S, 10), { pos: [0, -0.02 * S, 0.01 * S] }), plainHide);
      legs.push({ hip, knee, foot, front: z > 0, side: s });
    }
  }
  const tail = joint(torso, 0, 0.18 * S, -0.78 * S);
  part(tail, tubeBetween(v3(0, 0, 0), v3(0, -0.34 * S, -0.06 * S), [0.045 * S, 0.022 * S], { radial: 6, hSeg: 2 }),
    plainHide, { uv: 'cylY' });

  // ---- HEAVY PLOD + TORRENT ------------------------------------------------
  let t = 0;
  const tick = (dt, st) => {
    t += dt * (1.5 + Math.min(1, (st.speed ?? 0) / 2.5) * 2.0);
    const tor = st.torrent ?? 0;
    for (const L of legs) {
      const ph = t + ((L.front ? 0 : Math.PI) + (L.side > 0 ? 0 : Math.PI));
      const sw = Math.sin(ph);
      const lift = Math.max(0, sw);
      L.hip.rotation.x = sw * 0.24 * (L.front ? 1 : -0.9);
      L.knee.rotation.x = -lift * 0.34;
      L.foot.rotation.x = lift * 0.18;
    }
    root.position.y = 0.98 * S - Math.abs(Math.sin(t)) * 0.035 * S;
    torso.rotation.z = Math.sin(t) * 0.035;
    torso.rotation.x = -0.02 + Math.sin(t * 2) * 0.02;
    ears.forEach((e, i) => { e.rotation.y = (i ? -1 : 1) * (0.2 + Math.sin(t * 0.8 + i) * 0.30); });
    neck.rotation.x = -0.05 - tor * 0.55;
    head.rotation.x = Math.sin(t * 0.9) * 0.05 - tor * 0.30;
    trunk.forEach((l, i) => {
      const k = i / 7;
      l.rotation.x = (0.10 + Math.sin(t * 1.3 - i * 0.35) * 0.09) * (1 - tor) - tor * (1.05 - k * 0.55);
      l.rotation.z = Math.sin(t * 0.9 - i * 0.3) * 0.07 * (1 - tor);
    });
    tail.rotation.z = Math.sin(t * 1.1) * 0.18;
    if (st.hurt) { torso.rotation.x -= 0.12; head.rotation.x -= 0.2; }
  };

  return finish(body, {
    height: 2.5 * S, radius: 1.25 * S, poolR: 1.5 * S, tick,
    extras: { trunk, trunkTip: trunk[trunk.length - 1] }
  });
}

// ===========================================================================
// 6 — RABBIT ESCAPE 脱兎 : the swarm, and the ONE MARKED RABBIT
// ===========================================================================
// The individual rabbit is deliberately plain — the wiki calls them "weak and
// harmless", and the design is the NUMBER. One InstancedMesh means a swarm of
// two dozen costs a single draw call, which is what makes this affordable.
//
// WHAT IS NEW BESIDES THE COLOUR: one rabbit in the swarm carries the "Cloth of
// Various Things" symbol, and per canon, destroying THAT rabbit destroys the
// whole swarm. It is built as a separate, slightly larger, individually visible
// body with the sigil on its flank, and combat/shikigami.js reads it.
export function buildRabbitSwarm(count = 22) {
  const S = 0.42;
  const geos = [];
  geos.push(tGeo(ellipsoid(0.24 * S, 0.22 * S, 0.34 * S, 8), { pos: [0, 0.24 * S, 0] }));
  geos.push(tGeo(ellipsoid(0.16 * S, 0.16 * S, 0.17 * S, 8), { pos: [0, 0.40 * S, 0.26 * S] }));
  for (const s of [1, -1]) {
    geos.push(tGeo(coneSpike(0.055 * S, 0.46 * S, v3(s * 0.06 * S, 0, -0.05 * S), { radial: 4, hSeg: 3, zScale: 0.45 }),
      { pos: [s * 0.07 * S, 0.48 * S, 0.20 * S], rot: [-10, 0, s * 9] }));
    geos.push(tGeo(ellipsoid(0.07 * S, 0.09 * S, 0.09 * S, 6), { pos: [s * 0.15 * S, 0.13 * S, -0.16 * S] }));
  }
  geos.push(tGeo(new THREE.SphereGeometry(0.10 * S, 6, 5), { pos: [0, 0.28 * S, -0.32 * S] }));

  // mergeGeometries refuses a set whose attributes disagree, and the toolkit
  // mixes sphere-derived geometry (position/normal/uv) with cone-derived
  // geometry (position/normal). Strip uv first, then project one over the whole
  // merged body so the pelt texture lands on all of it at once.
  for (const g of geos) for (const k of ['uv', 'uv1', 'uv2']) if (g.getAttribute(k)) g.deleteAttribute(k);
  const merged = mergeGeos(geos);
  projectUV(merged, 'sphere', { scale: [2, 2] });

  // CREAM, not black. Ordinary rabbits.
  const coatTex = furTex('rabbit', {
    base: '#ddd6c6', tip: '#f4efe2', under: '#a49c8c', density: 1400
  });
  const mesh = new THREE.InstancedMesh(merged, pelt(coatTex), count);
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const body = new THREE.Group();
  body.add(mesh);

  // THE MARKED RABBIT — its own body, 1.35x, with the Cloth of Various Things
  // on its flank and a warm accent so a player can pick it out of the flood.
  const markedTex = furTex('rabbitMarked', {
    base: '#efe8d6', tip: '#ffffff', under: '#b9ad92', density: 1400
  });
  const marked = new THREE.Group();
  const mBody = new THREE.Mesh(merged, pelt(markedTex));
  mBody.scale.setScalar(1.35);
  marked.add(mBody);
  const sig = sigilTex('variousThings', '#8a2f3a');
  for (const s of [1, -1]) {
    markDecal(marked, 0.26 * S, sig, { pos: [s * 0.30 * S, 0.30 * S, 0], rot: [0, s * Math.PI / 2, 0] });
  }
  body.add(marked);

  // each rabbit gets its own heading, speed and hop phase
  const units = Array.from({ length: count }, (_, i) => ({
    x: 0, z: 0, y: 0, yaw: (i / count) * Math.PI * 2 + rand(-0.3, 0.3),
    sp: rand(3.2, 6.4), ph: rand(0, Math.PI * 2), alive: true
  }));
  const lead = { x: 0, z: 0, y: 0, yaw: rand(0, 6.28), sp: 4.2, ph: rand(0, 6.28) };

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1, 1, 1);
  let t = 0;
  const tick = (dt, st) => {
    t += dt;
    const spread = st.spread ?? 1;
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      const drive = Math.max(0.25, 1 - t * 0.5);
      u.x += Math.sin(u.yaw) * u.sp * drive * dt;
      u.z += Math.cos(u.yaw) * u.sp * drive * dt;
      u.yaw += Math.sin(t * 2.2 + i) * dt * 1.4;
      const hop = Math.abs(Math.sin(t * 7 + u.ph));
      u.y = hop * 0.34;
      e.set(-hop * 0.5, u.yaw, 0);
      q.setFromEuler(e);
      const s = u.alive ? spread : 0.001;
      sc.set(s, s, s);
      m4.compose({ x: u.x, y: u.y, z: u.z }, q, sc);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
    // the marked one keeps to the middle of the flood — it is the swarm's
    // heart, so it does not run to the edge where it would be easy to pick off
    lead.yaw += Math.sin(t * 1.3) * dt * 1.1;
    const r = 1.1 + Math.sin(t * 0.7) * 0.5;
    lead.x = Math.sin(lead.yaw) * r;
    lead.z = Math.cos(lead.yaw) * r;
    const hop = Math.abs(Math.sin(t * 6 + lead.ph));
    marked.position.set(lead.x, hop * 0.30, lead.z);
    marked.rotation.set(-hop * 0.4, lead.yaw + Math.PI / 2, 0);
    marked.visible = spread > 0.05;
  };

  return finish(body, {
    height: 0.5, radius: 3.0, poolR: 1.4, tick,
    extras: { units, mesh, marked, lead }
  });
}

export const SHIKIGAMI_BUILDERS = {
  divineDogs: () => buildDivineDog(false),
  divineDogWhite: () => buildDivineDog(true),
  nue: buildNue,
  toad: buildToad,
  serpent: buildGreatSerpent,
  elephant: buildMaxElephant,
  rabbits: buildRabbitSwarm
};
