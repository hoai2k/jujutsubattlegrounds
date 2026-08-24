// SHIBUYA — STREET LEVEL / THE SCRAMBLE.
//
// REFERENCE NOTE (researched): the scramble is the pedestrian phase of a great
// urban CIRCUS — a rotary where several roads meet, ringed by commercial towers
// carrying enormous illuminated screens, with the station's sunken concourse
// cut into the middle of it and pedestrian decks bridging over the traffic.
//
// WHY THIS SHAPE. The previous version was a square of asphalt inside a square
// of pavement inside a square of towers, with a rectangular deck along one edge
// and a rectangular hole in one corner: four right angles nested four deep.
// A circus is radial. Six roads come in on six bearings so there is no "along"
// and no "across"; the sunken court is in the MIDDLE, so the lowest ground is
// the centre of the map rather than a corner of it, and the steps down to it
// run the whole way round, so it can be entered and left anywhere; and the
// elevated ring bridges over the traffic as a closed loop, which means high
// ground with no dead end on it.
//
// It is still the widest open floor in the set and still deliberately empty in
// the middle of each quadrant, because that is the map the long-range
// characters need.
//
// LAYOUT (120 x 108 m):
//   y = -4.00  THE COURT     a round sunken concourse in the middle of the
//                            crossing, ringed by eight steps.
//   y =  0.00  THE CIRCUS    the roadway: a disc, with six radial approaches.
//   y =  0.24  PAVEMENT      the ring outside it, and the shop fronts on it.
//   y =  6.00  THE RING      an elevated pedestrian loop over the traffic, on
//                            columns, with four radial flights up to it.
//   y = 12.60  THE DRUM      an observation deck on the west tower, up a helix
//                            off the ring. Highest ground and a dead end.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'shibuya_crossing',
  name: 'SCRAMBLE CROSSING',
  jp: '渋谷スクランブル交差点',
  desc: 'A neon circus at night, with the concourse sunk into the middle of it.',
  extent: { minX: -60, maxX: 60, minZ: -54, maxZ: 54 },
  background: 0x0a0e1c,
  fog: { color: 0x121a30, near: 52, far: 200 },
  grade: { vignette: 0.50, tint: [1.02, 0.98, 1.14], lift: 0.005, sat: 1.12 },
  lights: {
    key: { color: 0x9fb8ff, intensity: 0.9, pos: [10, 22, 8] },
    rim: { color: 0xd8688f, intensity: 0.75, pos: [-14, 12, -12] },
    hemi: { sky: 0x44528c, ground: 0x2a2018, intensity: 0.62 }
  },
  previewCam: { pos: [-8, 11, 46], look: [2, 1.0, -6] },
  shadowScale: 1.45,
  shrineScale: 1.13,
  size: '120 × 108 m · circus, sunken court, elevated ring, tower drum'
};

// THE CONCOURSE IS THE ARENA. At 13 m it was a 26 m circle with a fountain in
// it, ringed by 6 m of steps and then a road — the biggest clear space on the
// busiest crossing in the world was the size of a tennis court.
const R_COURT = 20;      // the sunken concourse
const CY = -3.0;
const NSTEP = 6;
const R_STEPS = R_COURT + NSTEP * 0.85;    // where the steps meet the roadway
const R_ROAD = 38;       // the circus
const R_PAVE = 46;       // outer edge of the pavement ring
const RY = 6.0;          // the elevated ring
const R_RING_IN = 26, R_RING_OUT = 32;
// The observation drum, ON THE SAME BEARING as the helix that reaches it. Sited
// by hand at (-46, 6) it sat on the opposite side of the circus from its own
// stair, and the catwalk between them ran off into the traffic.
const DRUM_A = 2.4, DRUM_R = 43;
const DRUM = { x: Math.sin(DRUM_A) * DRUM_R, z: Math.cos(DRUM_A) * DRUM_R, r: 6.5 };
const DY = 12.6;
const ROADS = 6;         // approaches, on six bearings

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  // ---- THIS CROSSING'S OWN SURFACES --------------------------------------
  const tarmac = b.tint('asphalt', 0x33373f, { rim: 0.08 });
  const paveM = b.tint('concrete', 0x6e727c);
  const court = b.tint('tile', 0x7f8590);
  const clad = b.tint('concreteWall', 0x2e3340);
  const deckM = b.tint('concrete', 0x555a66);
  const iron = b.tint('darkMetal', 0x262b33, { rim: 0.45 });

  b.sky(0x060a18, 0x101a38, 0x2a2450, 380);
  b.groundPlane(0x0b0e16, 300);
  b.skyline(32, 200, { color: 0x0b0f1e, minW: 14, maxW: 38, minH: 40, maxH: 150 });

  // ---- THE CIRCUS --------------------------------------------------------
  // The roadway is an annulus: a disc with the sunken court's steps taken out
  // of the middle of it. Laid as a full disc it would pave the court over, the
  // way every sunken room on this project has been paved at least once.
  b.roundDeck(0, 0, R_ROAD, 0, { rIn: R_STEPS - 0.4, mat: tarmac, thick: 0.35, id: 'circus' });
  b.roundDeck(0, 0, R_PAVE, 0.24, { rIn: R_ROAD - 0.3, mat: paveM, thick: 0.4, id: 'pavement' });
  // and the six radial approaches, running out through the pavement to the edge
  for (let i = 0; i < ROADS; i++) {
    const a = (i / ROADS) * Math.PI * 2;
    const n = 9;
    for (let k = 0; k < n; k++) {
      const r0 = R_ROAD - 1 + (66 - R_ROAD) * (k / n), r1 = R_ROAD - 1 + (66 - R_ROAD) * ((k + 1) / n);
      const rc = (r0 + r1) / 2, len = (r1 - r0) * 1.3;
      const px = Math.sin(a) * rc, pz = Math.cos(a) * rc;
      const g = new THREE.BoxGeometry(13, 0.3, len);
      g.rotateY(a);
      g.translate(px, -0.15, pz);
      b.static_(g, tarmac);
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const hx = (ca * 13 + sa * len) / 2, hz = (sa * 13 + ca * len) / 2;
      b.bounds.platform(px - hx, pz - hz, px + hx, pz + hz, 0, { id: 'road' + i });
      b.bounds.terrain(px - hx, pz - hz, px + hx, pz + hz, 0, 'artificial');
    }
  }

  // ---- THE SUNKEN COURT --------------------------------------------------
  // Eight concentric steps down to it, each one a stride, so the concourse can
  // be entered and left ANYWHERE on its rim rather than at a marked staircase.
  // That is what makes a hole in the middle of a map somewhere to fight rather
  // than somewhere to be trapped.
  b.pit(-R_STEPS, -R_STEPS, R_STEPS, R_STEPS, CY);
  b.roundDeck(0, 0, R_COURT, CY, { mat: court, thick: 0.5, id: 'court' });
  for (let i = 0; i < NSTEP; i++) {
    const ri = R_COURT + i * 0.85, ro = ri + 0.85;
    const y = CY + (i + 1) * (-CY / NSTEP);
    b.roundDeck(0, 0, ro, y, { rIn: ri, mat: court, thick: (-CY / NSTEP) + 0.2, id: 'step' + i });
  }
  b.water(0, 0, 0, 0, CY + 0.06, {
    radius: 7.5, shallow: 0x4f8fb0, deep: 0x123448, opacity: 0.5, caustic: 0.3
  });
  b.mist(0, 0, 0, 0, CY + 0.1, 0x7f96b8, { radius: R_COURT - 1, opacity: 0.26, scale: 12 });
  b.sigil(0, CY + 0.08, 0, R_COURT - 2, 0x8f6aff, { rings: 3, spokes: 18, sides: 6, opacity: 0.30, spin: -0.03 });

  // ---- THE TOWER RING ----------------------------------------------------
  // Cylindrical, not boxes: eight drums round the circus, each carrying a
  // screen. They ARE the boundary, and you can see exactly where the map ends.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const tx = Math.sin(a) * 54, tz = Math.cos(a) * 54;
    const h = 40 + ((i * 37) % 60);
    b.roundTower(tx, tz, 9.5, 0, h, { mat: clad, segs: 18, id: 'tower' + i });
    const win = [];
    for (let iy = 0; iy < Math.floor(h / 3.4); iy++) {
      for (let k = -2; k <= 2; k++) {
        if (Math.random() < 0.35) continue;
        const wa = a + Math.PI + k * 0.14;
        win.push({
          x: tx + Math.sin(wa) * 9.7, y: 4 + iy * 3.4, z: tz + Math.cos(wa) * 9.7, ry: wa
        });
      }
    }
    b.repeat(new THREE.PlaneGeometry(1.5, 1.9), emissive(i % 2 ? 0xffd9a0 : 0xdfe8ff), win);
    b.bigScreen(tx + Math.sin(a + Math.PI) * 9.9, 17 + (i % 3) * 5, tz + Math.cos(a + Math.PI) * 9.9,
      15, 9, a + Math.PI, (i * 47) % 360);
  }
  // the shop fronts, wrapped round the inside of the pavement ring
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const hue = [0xff4f9f, 0x4fd8ff, 0xffd84f, 0x8f4fff, 0x4fe08a, 0xff8f4f][i];
    b.arcWall(0, 0, R_PAVE - 0.4, a - 0.3, a + 0.3, 0.24, 5.6,
      { mat: b.tint('paint', 0x545a66), thick: 0.5, id: 'shop' + i });
    b.neon(Math.sin(a) * (R_PAVE - 1.2), 4.6, Math.cos(a) * (R_PAVE - 1.2), 9, 1.3, hue, a + Math.PI);
    for (let k = -1; k <= 1; k++) {
      const wa = a + k * 0.16;
      b.vending(Math.sin(wa) * (R_PAVE - 2.6), 0.24, Math.cos(wa) * (R_PAVE - 2.6),
        wa + Math.PI, k ? 0xd8402c : 0x2c6ad8);
    }
  }

  // ---- THE ELEVATED RING -------------------------------------------------
  // A closed pedestrian loop over the traffic. High ground with no dead end on
  // it, which the old straight deck could never be.
  // NO WELL IN IT. The helix to the drum climbs UP off this deck rather than
  // through it, so a hole here is a 3.3 m gap between the ring and the first
  // tread with a six-metre drop in it — which is exactly what it was.
  b.roundDeck(0, 0, R_RING_OUT, RY, { rIn: R_RING_IN, mat: deckM, thick: 0.4, id: 'ring' });
  b.arcWall(0, 0, R_RING_IN - 0.1, 0, Math.PI * 2, RY + 0.45, RY + 1.1,
    { mat: iron, thick: 0.12, id: 'ringrailin', collide: false });
  b.arcWall(0, 0, R_RING_OUT + 0.1, 0, Math.PI * 2, RY + 0.45, RY + 1.1,
    { mat: iron, thick: 0.12, id: 'ringrailout', collide: false });
  // structural: twelve columns, and dropping one takes its bay of deck with it
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    b.pillar(Math.sin(a) * 29, Math.cos(a) * 29, 0, RY - 0.34, 0.6,
      { square: true, mat: deckM, hp: 200, id: 'ringcol' + i, drops: ['ring'] });
  }
  // four radial flights up to it, on the bearings between the roads
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const along = Math.abs(Math.sin(a)) > 0.5;
    // Only the cardinal-ish bearings can carry an axis-aligned flight, so the
    // four are placed on ±x and ±z and the six roads are rotated off them.
    const s = i < 2 ? 1 : -1;
    if (i % 2 === 0) b.stairs(s * 44, -2.2, s * R_RING_OUT, 2.2, 0.24, RY, 'x', { mat: deckM, id: 'ringstair' + i });
    else b.stairs(-2.2, s * 44, 2.2, s * R_RING_OUT, 0.24, RY, 'z', { mat: deckM, id: 'ringstair' + i });
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    b.stripLight(Math.sin(a) * 29, RY + 3.2, Math.cos(a) * 29, 3.0,
      Math.abs(Math.sin(a)) > 0.7 ? 'z' : 'x', 0xdfeaff, i === 5 ? 0.45 : 0);
  }

  // ---- THE DRUM ----------------------------------------------------------
  // An observation deck strapped to the west tower, up a helix off the ring.
  // Narrow, exposed and a dead end — the trade for the best sightline here.
  {
    const a = DRUM_A;
    const hx = Math.sin(a) * 29, hz = Math.cos(a) * 29;
    b.spiralStair(hx, hz, RY, DY, {
      rIn: 0.6, rOut: 3.0, rise: 0.24, turns: 1, dir: 1, a0: a,
      mat: iron, newelMat: iron, id: 'drumhelix'
    });
    const lx = hx + Math.sin(a) * 2.9, lz = hz + Math.cos(a) * 2.9;
    b.floor(lx - 1.5, lz - 1.5, lx + 1.5, lz + 1.5, DY, { mat: iron, id: 'drumland' });
    // the catwalk out to the drum, built from radial planks on the bearing
    const n = 8;
    for (let k = 0; k < n; k++) {
      const r0 = 31 + (DRUM_R - DRUM.r + 0.6 - 31) * (k / n);
      const r1 = 31 + (DRUM_R - DRUM.r + 0.6 - 31) * ((k + 1) / n);
      const rc = (r0 + r1) / 2, len = (r1 - r0) * 1.3;
      const px = Math.sin(a) * rc, pz = Math.cos(a) * rc;
      const g = new THREE.BoxGeometry(3.0, 0.2, len);
      g.rotateY(a);
      g.translate(px, DY - 0.1, pz);
      b.static_(g, iron);
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const bx = (ca * 3.0 + sa * len) / 2, bz = (sa * 3.0 + ca * len) / 2;
      b.bounds.platform(px - bx, pz - bz, px + bx, pz + bz, DY, { id: 'drumwalk' });
    }
    b.roundDeck(DRUM.x, DRUM.z, DRUM.r, DY, { mat: iron, thick: 0.35, id: 'drumdeck' });
    b.arcWall(DRUM.x, DRUM.z, DRUM.r + 0.1, a + Math.PI + 0.5, a + Math.PI + Math.PI * 2 - 0.5,
      DY + 0.5, DY + 1.15, { mat: iron, thick: 0.12, id: 'drumrail', collide: false });
    b.roundTower(DRUM.x, DRUM.z, 1.4, 0, DY - 0.12, { mat: clad, segs: 12, id: 'drumleg' });
    b.beacon(DRUM.x, DY + 1.6, DRUM.z, 0xff4a5a, { reach: 5.4, rate: 0.9 });
    b.bigScreen(DRUM.x, DY + 6.5, DRUM.z + 7.2, 16, 8, 0, 275);
  }

  // ---- THE VEIL, THE WIRES AND THE STREET --------------------------------
  b.sigil(0, 0.06, 0, R_ROAD - 5, 0x8f6aff, { rings: 3, spokes: 24, sides: 6, opacity: 0.18, spin: 0.014 });
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + 0.4, a1 = a0 + Math.PI * 0.72;
    b.cable(v3(Math.sin(a0) * 50, 22 + (i % 3) * 4, Math.cos(a0) * 50),
      v3(Math.sin(a1) * 50, 20 + (i % 2) * 5, Math.cos(a1) * 50),
      { sag: 4.0, r: 0.07, segs: 14 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    b.steamVent(Math.sin(a) * 22, 0.02, Math.cos(a) * 22, { height: 4.6, period: 3.2 + (i % 3) * 0.5, opacity: 0.20 });
  }
  b.godRay(0, RY - 0.2, 0, 12, RY + 4.2, 0x9fd8ff, { opacity: 0.07, taper: 0.5, pool: false });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    b.godRay(Math.sin(a) * 30, 34, Math.cos(a) * 30, 5.5, 34, 0xbfd0f0,
      { opacity: 0.05, taper: 0.3, lean: [-5, 4], range: 150 });
  }
  b.lanternString(v3(-30, 5.2, 40), v3(-10, 5.2, 44), { color: 0xffb86a, sag: 1.2, count: 10 });
  b.lanternString(v3(10, 5.2, 44), v3(30, 5.2, 40), { color: 0xffb86a, sag: 1.2, count: 10 });
  b.sparker(Math.sin(DRUM_A) * 31, RY + 2.0, Math.cos(DRUM_A) * 31, { color: 0xbfe4ff });

  // traffic waiting on the approaches, and the works on the pavement
  for (let i = 0; i < ROADS; i++) {
    const a = (i / ROADS) * Math.PI * 2;
    const r = 44 + (i % 2) * 7;
    b.car(Math.sin(a) * r + Math.cos(a) * 3, 0, Math.cos(a) * r - Math.sin(a) * 3,
      a, [0x2a3a6a, 0x6a2a2a, 0x24343c, 0x3a3a44, 0x5a5a64, 0x2a5a4a][i]);
  }
  for (const [ca, cr] of [[0.9, 42], [3.9, 42]]) {
    const cx = Math.sin(ca) * cr, cz = Math.cos(ca) * cr;
    b.crates(cx, 0.24, cz, { count: 3 });
    b.crates(cx + 1.8, 0.24, cz + 1.2, { count: 2 });
    for (let i = 0; i < 4; i++) {
      b.drum(cx - 3 - i * 1.05, 0.24, cz + 0.6, { color: 0xc4562c });
    }
    b.beacon(cx - 1.5, 1.8, cz + 2.4, 0xffa03c, { reach: 3.8 });
  }

  // ---- RAIN + NEON HAZE ---------------------------------------------------
  b.particles(1200, { x0: -58, x1: 58, y0: 0, y1: 38, z0: -52, z1: 52 },
    { color: 0x9fc0e8, size: 0.055, opacity: 0.34, vy: [-16, -9] });
  b.particles(160, { x0: -52, x1: 52, y0: 0.2, y1: 8, z0: -48, z1: 48 },
    { color: 0xff8fc8, size: 0.10, opacity: 0.22, vy: [0.1, 0.5] });
  const sheen = new THREE.Mesh(new THREE.CircleGeometry(R_ROAD, 40), haloMaterial(0x3c5f9f, 0.10));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.y = 0.03;
  b.add(sheen);

  // On the roadway, on the four bearings the flights use — off the roads, off
  // the steps and out of the court.
  b.bounds.spawns = [0, 0.5, 1.0, 1.5].map(k => {
    const a = Math.PI * (k + 0.25);
    return v3(Math.sin(a) * 24, 0, Math.cos(a) * 24);
  });
  return b;
}
