// MAKI'S OWN TOOLS
// ===========================================================================
// Playful Cloud and the Split Soul Katana are Toji's builders, imported
// unchanged (see art/models/maki.js). This file is for the ones that are
// hers, and there is one: the NAGINATA.
//
// She is a polearm fighter before she is anything else — the Kyoto Goodwill
// Event fight is her with a naginata, and the reference art keeps putting one
// in her hands. It is also the weapon the roster was missing a shape for.
// Against her other two it is the RANGE pick, and the three of them cover
// three distances on purpose:
//
//   Split Soul Katana   short, fast, a line rather than an arc
//   Playful Cloud       middle, blunt, and it folds around a guard
//   Naginata            long, and everything it does is a circle
//
// PROPORTIONS. A real naginata runs 2.0-2.2 m overall — a shaft a little
// taller than the wielder plus 30-60 cm of blade. That is longer than
// anything else on this roster and it is meant to be: at 1.12·H the whole
// thing is 1.95 m on her 1.74 m frame, so it reads as out-reaching every
// weapon it meets, which is the only reason to carry one.
import * as THREE from 'three';
import { shapeExtrude } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';

const NG = {
  shaft: 0x2a2119,     // dark lacquered oak, warmer than the staff's black
  wrap: 0x14242e,      // the cord over the grip zone
  collar: 0xb08a3c,    // brass habaki and the fittings
  butt: 0x6a6f78,      // the ishizuki, plain steel
  edge: 0xdfe6ef,      // the blade
  ridge: 0x8f9aa8      // the shinogi line down it
};
const OUT = { color: 0x14161c, thickness: 0.009 };

/**
 * Naginata, built up +Y from the butt cap: shaft, cord-wrapped grip zone,
 * brass collar, curved single-edged blade.
 *
 * The origin is the BUTT (`ishizuki`), the same convention as
 * buildPlayfulCloud, so an attachment solved for one is solved the same way
 * for the other and the two-handed grip maths in rig3d/grip.js — which
 * measures the off hand's hold as a distance up the weapon's own +Y — reads
 * both without knowing which it is holding.
 */
export function buildNaginata(H = 1.74, { total = 1.12 } = {}) {
  const g = new THREE.Group();
  g.name = 'naginata';
  const shaftMat = MAT.cloth({ vertexColors: false, color: NG.shaft, rimColor: 0xc9a678 });
  const wrapMat = MAT.cloth({ vertexColors: false, color: NG.wrap, rimColor: 0x7fa8c4 });
  const brassMat = MAT.metal({ vertexColors: false, color: NG.collar, rimColor: 0xffe2a0 });
  const steelMat = MAT.metal({ vertexColors: false, color: NG.butt });
  const edgeMat = MAT.metal({ vertexColors: false, color: NG.edge, rimColor: 0xffffff });
  const ridgeMat = MAT.metal({ vertexColors: false, color: NG.ridge });

  const L = total * H;               // overall
  const bladeLen = 0.26 * L;         // ~0.50 m of blade on a 1.95 m weapon
  const shaftLen = L - bladeLen;
  const R = 0.0105 * H;

  // ---- shaft. Slightly thicker at the grip than at the collar, which is
  // what an oval-sectioned naginata shaft does and what stops it reading as
  // a broom handle at distance.
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.86, R * 1.06, shaftLen, 10), shaftMat);
  shaft.position.y = shaftLen / 2;
  shaft.add(makeOutline(shaft, OUT));
  g.add(shaft);

  // ---- ishizuki: the steel butt cap she plants and strikes with
  const butt = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.15, R * 0.9, 0.055 * H, 10), steelMat);
  butt.position.y = 0.026 * H;
  g.add(butt);

  // ---- the cord over the grip zone. THIS IS THE READ FOR WHERE THE HANDS
  // GO: the two-handed grip sits in the rear third, and the wrap says so
  // before anyone has seen her hold it. Ten bands rather than a tube so it
  // reads as winding.
  const gripFrom = 0.10 * L, gripTo = 0.42 * L;
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.10, R * 1.10, 0.013 * H, 8), wrapMat);
    band.position.y = gripFrom + t * (gripTo - gripFrom);
    band.rotation.z = 0.12;
    g.add(band);
  }

  // ---- brass fittings: one at each end of the grip zone, one at the collar
  for (const y of [gripFrom - 0.012 * H, gripTo + 0.012 * H, shaftLen - 0.018 * H]) {
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.2, R * 1.2, 0.022 * H, 10), brassMat);
    ring.position.y = y;
    g.add(ring);
  }
  // the habaki proper, where the tang enters the shaft
  const habaki = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 1.26, R * 1.34, 0.052 * H, 10), brassMat);
  habaki.position.y = shaftLen + 0.014 * H;
  g.add(habaki);

  // ---- THE BLADE. Traced as one closed outline and extruded, the same way
  // the Split Soul's is — nine stacked slabs came out as a staircase there
  // and would here. A naginata blade is broader and more strongly curved than
  // a katana's, and it widens toward the tip rather than tapering to it,
  // which is the single feature that tells the two apart in silhouette.
  const halfW = 0.030 * H;
  const N = 14;
  const y0 = shaftLen + 0.030 * H;
  const curveAt = t => -Math.pow(t, 1.45) * 0.105 * H;         // sweeps back
  const widthAt = t => halfW * (0.62 + 0.52 * Math.sin(t * Math.PI * 0.86));
  const yAt = t => y0 + t * bladeLen;
  const front = [], back = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    front.push([curveAt(t) + widthAt(t), yAt(t)]);
    back.push([curveAt(t) - widthAt(t), yAt(t)]);
  }
  const blade = new THREE.Mesh(shapeExtrude([...front, ...back.reverse()], 0.0095 * H), edgeMat);
  blade.add(makeOutline(blade, OUT));
  g.add(blade);

  // the shinogi: a dull band along the back of the edge, so the blade has a
  // direction at a glance instead of reading as a flat leaf
  const rFront = [], rBack = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    rFront.push([curveAt(t) - widthAt(t) * 0.30, yAt(t)]);
    rBack.push([curveAt(t) - widthAt(t) * 0.92, yAt(t)]);
  }
  const ridge = new THREE.Mesh(
    shapeExtrude([...rFront, ...rBack.reverse()], 0.0104 * H), ridgeMat);
  g.add(ridge);

  return g;
}
