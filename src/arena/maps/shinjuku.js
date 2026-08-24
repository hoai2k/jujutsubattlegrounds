// SHINJUKU — the Shinjuku Showdown, rebuilt as THE INTERCHANGE.
//
// The old map was a straight boulevard with a straight overpass across it:
// every silhouette on it was a box, and from the stage-select shot it read as
// the same grey street as three other maps. Nothing about the LOCATION changed
// here — it is still Shinjuku, still the widest map in the set, still a fight
// with real distance in it — but the architecture is new from the ground:
//
//   * a SWEEPING ELEVATED EXPRESSWAY, a single 9 m arc of viaduct on a 104 m
//     radius, entering low at both ends and cresting over the middle of the
//     map at 12 m. It is the map's horizon line and its high ground, and you
//     can see the whole street under it through the gap it leaves.
//   * a CIRCULAR SUNKEN PLAZA, 34 m across, cut into the roadway as eight
//     concentric steps. Every step is climbable from every bearing, so the
//     plaza is a bowl you fight down into, never a hole you fall into.
//   * CYLINDRICAL TOWERS instead of the old slab blocks, two of them carrying
//     annular setback decks at mid height.
//
// LAYOUT (136 x 118 m):
//   y = -4.40  PLAZA FLOOR   the bowl, with a lit drum at its centre
//   y = -3.85..-0.55  the eight step rings, walkable in both directions
//   y =  0.00  ROADWAY       one continuous disc of asphalt with the plaza
//                            cut out of it as a true circle
//   y =  6.00  SETBACK DECKS annular terraces round the two near towers
//   y = 12.00  EXPRESSWAY    the arc, its two end pads and the crown
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'shinjuku',
  name: 'SHINJUKU',
  jp: '新宿',
  desc: 'A sweeping viaduct over a sunken plaza, ringed by towers.',
  extent: { minX: -68, maxX: 68, minZ: -59, maxZ: 59 },
  background: 0x0e1424,
  fog: { color: 0x141c30, near: 58, far: 230 },
  grade: { vignette: 0.46, tint: [1.0, 0.99, 1.10], lift: 0, sat: 1.04 },
  lights: {
    key: { color: 0xc0d0f0, intensity: 1.0, pos: [14, 26, 10] },
    rim: { color: 0xff9f6f, intensity: 0.65, pos: [-16, 14, -14] },
    hemi: { sky: 0x4a5c90, ground: 0x241f26, intensity: 0.46 }
  },
  previewCam: { pos: [-33, 23, 50], look: [6, 6.0, -6] },
  shadowScale: 1.7,
  shrineScale: 1.33,
  size: '136 × 118 m · sunken plaza, arc viaduct, tower decks'
};

// ---- the numbers the whole map is cut from -------------------------------
const SY = -4.4;               // plaza floor
const R_PLAZA = 17.2;          // the circular cut in the roadway
const STEPS = 8;               // 8 x 0.55 m: every step under STEP_UP (0.55)
const STEP_R = 1.05;           // radial tread depth

const VY = 12.0;               // expressway deck
const VC = -96;                // the arc's centre, far off the south edge
const VR_IN = 100, VR_OUT = 109;
const VA = 0.615;              // half the swept bearing
const VRC = (VR_IN + VR_OUT) / 2;
const arcX = (a) => Math.sin(a) * VRC;
const arcZ = (a) => VC + Math.cos(a) * VRC;

const HELIX = { x: 0, z: 20.0, rIn: 2.4, rOut: 5.6 };

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const road = b.tint('asphalt', 0x2a2c36);
  const kerb = b.tint('concrete', 0x6c6e78);
  const deckMat = b.tint('concrete', 0x8a8c94);
  const towerMat = b.tint('concreteWall', 0x2a3040);

  b.sky(0x07101f, 0x142240, 0x3a3050, 420);
  b.groundPlane(0x090c14, 340);
  b.skyline(34, 250, { color: 0x0a1020, minW: 18, maxW: 46, minH: 60, maxH: 210 });

  // ---- THE ROADWAY --------------------------------------------------------
  // One disc, not a rectangle, because the hole in it has to be a CIRCLE and
  // `floorHole` only cuts rects — a square cut round a round plaza leaves four
  // corners of pit with nothing drawn over them and nothing to stand on.
  b.roundDeck(0, 0, 96, 0, {
    mat: road, thick: 0.4, segs: 64, band: 1.1, id: 'road',
    holes: [{ x: 0, z: 0, r: R_PLAZA }]
  });
  // lane markings, laid along the arc of the roadway rather than a grid
  for (let ring = 0; ring < 3; ring++) {
    const r = 24 + ring * 11;
    const n = Math.floor(r * 0.9);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const g = new THREE.BoxGeometry(0.26, 0.03, 2.8);
      g.rotateY(a);
      g.translate(Math.sin(a) * r, 0.02, Math.cos(a) * r);
      b.static_(g, emissive(0xdfe4ec));
    }
  }

  // ---- THE SUNKEN PLAZA ---------------------------------------------------
  // `groundY` is 0 for the whole map, so the bowl needs its fallback floor
  // dropped over its own footprint or the fighter stands on the road surface
  // in mid-air above it. The rect is generous; the road platform is higher
  // everywhere outside the circle and `floorAt` takes the highest surface.
  b.pit(-R_PLAZA - 1, -R_PLAZA - 1, R_PLAZA + 1, R_PLAZA + 1, SY);
  for (let i = 0; i < STEPS; i++) {
    const rOut = R_PLAZA - i * STEP_R;
    const y = -0.55 * (i + 1);
    b.roundDeck(0, 0, rOut, y, {
      mat: i % 2 ? kerb : b.tint('tile', 0x8f93a4), rIn: rOut - STEP_R,
      thick: 0.6, segs: 56, band: 0.7, id: 'step' + i
    });
  }
  const R_FLOOR = R_PLAZA - STEPS * STEP_R;
  b.roundDeck(0, 0, R_FLOOR + 0.1, SY, { mat: b.tint('tile', 0x9aa0b4), thick: 0.5, segs: 48, id: 'plaza' });
  // the drum at the middle of the bowl: a lit cylinder you can get on top of
  b.roundTower(0, 0, 3.0, SY, 1.9, { mat: kerb, segs: 24, cap: true, id: 'drumbase' });
  b.roundDeck(0, 0, 3.0, SY + 1.9, { draw: false, prop: true, rIn: 2.4, id: 'drumlip' });
  b.sigil(0, SY + 1.96, 0, 2.6, 0x6ad8ff, { rings: 2, spokes: 12, sides: 6, opacity: 0.3, spin: 0.05 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.hangingLamp(Math.sin(a) * 12.0, 0.2, Math.cos(a) * 12.0, 4.4, 0x9fd8ff, { range: 30 });
  }
  b.mist(-R_FLOOR, -R_FLOOR, R_FLOOR, R_FLOOR, SY, 0x7f96b8, { opacity: 0.22, scale: 12, radius: R_FLOOR });

  // ---- THE EXPRESSWAY -----------------------------------------------------
  // One sector of a 104 m ring, so the deck curves through the whole map
  // instead of crossing it in a straight line. The collider is the kit's
  // conservative cell scan: it can only ever be narrower than the slab.
  b.arcDeck(0, VC, VR_IN, VR_OUT, -VA, VA, VY, { mat: deckMat, thick: 0.8, band: 0.4, id: 'viaduct' });
  // parapets down both edges, drawn as arcs of wall on the same centre
  // Drawn only. A 1.1 m band of solid with no walkable top is a block that
  // shoves anyone who lands on it sideways off the viaduct; the kerb reads as
  // an edge without pretending to be a wall.
  b.arcWall(0, VC, VR_IN - 0.25, -VA, VA, VY, VY + 1.1, { mat: kerb, thick: 0.5, collide: false });
  b.arcWall(0, VC, VR_OUT + 0.25, -VA, VA, VY, VY + 1.1, { mat: kerb, thick: 0.5, collide: false });
  // the piers. Two of them are structural: bring one down and the deck it
  // carries falls into the street.
  for (let i = 0; i <= 8; i++) {
    const a = -VA + (2 * VA) * i / 8;
    const px = arcX(a), pz = arcZ(a);
    b.pylon(px, pz, 0, VY - 0.8, { mat: kerb, axis: Math.abs(px) > 34 ? 'z' : 'x', spread: 6.0, thick: 1.7 });
    b.bounds.wall(px - 1.1, pz - 1.1, px + 1.1, pz + 1.1, 0, VY - 0.8, { id: 'pier' + i });
  }
  // the end pads: axis-aligned aprons where the arc runs off at an angle, so
  // an axis-aligned flight has something square to land on
  for (const s of [-1, 1]) {
    b.floor(s * 64 - (s > 0 ? 10 : 0), -17, s * 64 + (s > 0 ? 0 : 10), -6, VY,
      { mat: deckMat, id: 'pad' + (s > 0 ? 'E' : 'W') });
    // split around the head of the flight: a rail across the one stair that
    // reaches a deck is the deck sealed off, and it looks like a handrail
    b.railing(s * 54, -17, s * 61 - 3.4, -17, VY);
    b.railing(s * 61 + 3.4, -17, s * 64, -17, VY);
    b.railing(s * 54, -6, s * 64, -6, VY);
    b.railing(s * 64, -17, s * 64, -6, VY);
    // the block under the pad, so it is a ramp head and not a floating slab
    // recessed 1.5 m from the pad's south face: the flight's top tread lands
    // on the slab where it cantilevers, not inside the block under it
    const g = new THREE.BoxGeometry(10, VY, 9.5);
    g.translate(s * 59, VY / 2, -10.75);
    b.static_(g, towerMat);
    b.bounds.wall(s * 59 - 5, -15.5, s * 59 + 5, -6, 0, VY - 0.14, { id: 'padblock' + s });
    // EVERY TOP TREAD OVERLAPS ITS LANDING by about 0.3 m. A flight that stops
    // even 0.2 m short leaves a column of grid cells at its head with no floor
    // in them: the fighter drops through and the deck above is unreachable.
    b.stairs(s * 61 - 3, -37, s * 61 + 3, -16.7, 0, VY, 'z', { mat: kerb, id: 'padstair' + s });
    b.beacon(s * 63, VY + 1.6, -7.5, 0xff4a5a, { reach: 4.4, rate: 1.0 });
  }

  // ---- THE CROWN HELIX ----------------------------------------------------
  // The middle of the arc is 60 m from either end pad. Without a way up at the
  // crown the viaduct is a corridor you commit to; with one it is a loop.
  b.roundTower(HELIX.x, HELIX.z, HELIX.rOut + 0.3, 0, 0.35, { mat: kerb, segs: 28, cap: false, id: 'helixfoot' });
  b.spiralStair(HELIX.x, HELIX.z, 0, VY, {
    rIn: HELIX.rIn, rOut: HELIX.rOut, rise: 0.24, turns: 2, dir: 1, a0: Math.PI,
    mat: kerb, newelMat: towerMat, id: 'helix'
  });
  // the connector from the head of the helix onto the arc: the helix tops out
  // on its north-west quadrant, the deck's outer edge is at z = 12.9 on the
  // centreline, and the two overlap by 0.3 m.
  b.floor(-3.2, 12.6, 3.2, HELIX.z - HELIX.rOut + 1.0, VY, { mat: deckMat, id: 'crownlink' });
  b.railing(-3.2, 12.6, -3.2, HELIX.z - HELIX.rOut + 1.0, VY);
  b.railing(3.2, 12.6, 3.2, HELIX.z - HELIX.rOut + 1.0, VY);
  b.pylon(0, 15.5, 0, VY - 0.8, { mat: kerb, axis: 'x', spread: 4.4, thick: 1.2 });

  // ---- THE TOWERS ---------------------------------------------------------
  // Cylinders, not slabs. Two of them carry an annular setback deck at 6 m
  // with a flight up to it; the rest are the boundary and read as one.
  const tower = (x, z, r, h, opts = {}) => {
    b.roundTower(x, z, r, 0, h, { mat: towerMat, segs: 26, taper: opts.taper ?? 0.06, cap: true, id: opts.id });
    const win = [];
    const rows = Math.floor(h / 4.2);
    for (let iy = 0; iy < rows; iy++) {
      for (let i = 0; i < 16; i++) {
        if (Math.random() < 0.45) continue;
        const a = (i / 16) * Math.PI * 2;
        const rr = r * (1 - (opts.taper ?? 0.06) * (iy * 4.2 + 4) / h) + 0.08;
        win.push({ x: x + Math.sin(a) * rr, y: 4 + iy * 4.2, z: z + Math.cos(a) * rr, ry: a });
      }
    }
    b.repeat(new THREE.PlaneGeometry(1.5, 2.0), emissive(Math.random() < 0.5 ? 0xffe0b0 : 0xd0e0ff), win);
  };
  const setback = (x, z, r, sx) => {
    b.roundDeck(x, z, r + 6.2, 6.0, { mat: deckMat, rIn: r, thick: 0.5, segs: 40, band: 0.7, id: 'setback' + x });
    b.roundDeck(x, z, r + 6.2, 6.0, { draw: false, prop: true, rIn: r + 5.6 });
    // `stairs` pairs its first height with the LOWER coordinate on the axis
    // whatever order the corners came in, so the approach side decides which
    // way round the two heights go. Passing them the other way builds a flight
    // that runs downhill into its own landing.
    // and it lands on the ring's OUTER rim, never its inner one: the check
    // that a flight meets its landing probes 0.8 m past the head, and 0.8 m
    // past the inner edge of an annulus is the hole in the middle of it.
    const rO = r + 6.2;
    if (sx > 0) {
      b.stairs(x + rO - 0.9, z - 2.6, x + rO + 13.5, z + 2.6, 6.0, 0, 'x', { mat: kerb, id: 'setstair' + x });
    } else {
      b.stairs(x - rO - 13.5, z - 2.6, x - rO + 0.9, z + 2.6, 0, 6.0, 'x', { mat: kerb, id: 'setstair' + x });
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.6;
      b.stripLight(x + Math.sin(a) * (r + 3), 6.4, z + Math.cos(a) * (r + 3), 2.6, 'x', 0xffe8c0, i === 2 ? 0.4 : 0);
    }
  };
  tower(-46, 42, 9, 54, { id: 'twNW' });
  tower(46, -42, 9, 62, { id: 'twSE' });
  setback(-46, 42, 9, 1);
  setback(46, -42, 9, -1);
  tower(46, 42, 10, 78, { id: 'twNE' });
  tower(-46, -42, 10, 70, { id: 'twSW' });
  tower(0, 52, 11, 92, { id: 'twN' });
  tower(0, -52, 11, 84, { id: 'twS' });
  tower(-64, 8, 8, 46, { id: 'twW' });
  tower(64, 14, 8, 50, { id: 'twE' });

  // ---- THE EDGE OF THE WORLD ---------------------------------------------
  // Hoardings, not invisible planes, and they close every gap between towers.
  for (const s of [-1, 1]) {
    b.wall(s * 67, -57, s * 67, 57, 0, 11, { mat: M.rust });
    b.wall(-67, s * 57, 67, s * 57, 0, 11, { mat: M.rust });
    for (let i = 0; i < 12; i++) {
      b.neon(s * 66.5, 5.0, -50 + i * 9, 0.4, 6, 0x4f7fd8, s > 0 ? -Math.PI / 2 : Math.PI / 2);
      b.neon(-52 + i * 9.4, 5.6, s * 56.5, 7.4, 1.4, [0xff4f7f, 0x4fd8ff, 0xffd84f, 0x8f4fff][i % 4], s > 0 ? Math.PI : 0);
    }
  }

  // ---- STREET LEVEL -------------------------------------------------------
  const cars = [[-34, -26, 0.5], [28, -30, 2.2], [40, 20, 0.9], [-30, 26, 3.6], [8, -34, 1.4], [-14, 36, 2.8], [52, -6, 0.2]];
  const carCols = [0x2a3a6a, 0x6a2a2a, 0x24343c, 0x3a3a44, 0x5a5a64, 0x2a5a4a, 0x50304a];
  cars.forEach(([x, z, ry], i) => b.car(x, 0, z, ry, carCols[i % carCols.length]));
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.22;
    const r = 26 + (i % 3) * 6;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.5, 8), M.darkMetal);
    pole.position.y = 3.75;
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.1), emissive(0xffe0a8));
    lamp.position.set(0, 7.3, 0);
    g.add(pole, lamp);
    g.position.set(x, 0, z);
    b.add(g);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), haloMaterial(0xffc87a, 0.15));
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(x, 0.06, z);
    b.add(halo);
    b.bounds.wall(x - 0.22, z - 0.22, x + 0.22, z + 0.22, 0, 7.5, { id: 'lamp' + i });
    b.breakable(g, { hp: 35, kind: 'metal', center: v3(x, 3.8, z), radius: 0.6, height: 7.5, baseY: 0, colliderIds: ['lamp' + i] });
  }
  // a contractor's compound under the west end of the arc
  b.crates(-40, 0, -34, { count: 3 });
  b.crates(-38.2, 0, -35.6, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(-46 - i * 1.05, 0, -34, { color: 0xc4562c });
  b.crates(34, 0, 34, { count: 3 });
  for (let i = 0; i < 3; i++) b.drum(40 + i * 1.05, 0, 34, { color: 0xb8483c });
  b.sparker(-42, 1.4, -33, { color: 0xbfe4ff });

  // =========================================================================
  // THE SHOWDOWN LOOK
  // =========================================================================
  b.sigil(0, 0.06, -30, 9.0, 0x8f6aff, { rings: 3, spokes: 24, sides: 6, opacity: 0.20, spin: -0.02 });
  b.sigil(-34, 0.06, 22, 6.5, 0xff5a6a, { rings: 2, spokes: 8, sides: 3, opacity: 0.26, spin: 0.10 });
  b.sigil(34, 0.06, 22, 6.5, 0xff5a6a, { rings: 2, spokes: 8, sides: 3, opacity: 0.26, spin: -0.10 });

  // light coming down the gaps between the towers, and the shaft the plaza
  // makes of the hole in the roadway
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    b.godRay(Math.sin(a) * 40, 40, Math.cos(a) * 40, 7.0, 40, 0xbfd0f0,
      { opacity: 0.05, taper: 0.3, lean: [-Math.sin(a) * 8, -Math.cos(a) * 8], range: 170 });
  }
  b.godRay(0, VY - 0.4, 8.4, 6.0, VY - SY - 0.4, 0x9fd8ff, { opacity: 0.07, taper: 0.5, pool: false });

  // feeder cables strung between the towers, over the top of the arc
  b.cable(v3(-46, 30, 42), v3(46, 32, -42), { sag: 8.0, r: 0.07, segs: 20 });
  b.cable(v3(46, 30, 42), v3(-46, 32, -42), { sag: 8.0, r: 0.07, segs: 20 });
  b.cable(v3(-64, 22, 8), v3(64, 22, 14), { sag: 6.0, r: 0.06, segs: 18 });
  b.lanternString(v3(-14, 1.4, 24), v3(14, 1.4, 24), { color: 0xffb86a, sag: 1.4, count: 12 });
  b.lanternString(v3(-14, 1.4, -24), v3(14, 1.4, -24), { color: 0xffb86a, sag: 1.4, count: 12 });
  for (const [sx, sz] of [[-24, -14], [22, -16], [-20, 24], [26, 18], [-40, 4], [42, 2]]) {
    b.steamVent(sx, 0.02, sz, { height: 4.6, period: 3.4 + (sx % 3) * 0.4, opacity: 0.20 });
  }
  b.bigScreen(0, 19.0, 26.0, 13, 7, Math.PI, 340);

  b.particles(280, { x0: -64, x1: 64, y0: 0.4, y1: 28, z0: -54, z1: 54 },
    { color: 0xa8c0e8, size: 0.08, opacity: 0.24, vy: [-0.2, 0.1] });

  b.bounds.spawns = [v3(30, 0, 0), v3(-30, 0, 0), v3(0, 0, -30), v3(0, 0, 33)];
  return b;
}
