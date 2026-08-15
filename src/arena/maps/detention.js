// EISHU JUVENILE DETENTION CENTER — Yuji and Megumi's first mission.
//
// REFERENCE NOTE (researched): a derelict detention block surrounded by woods,
// entered through a rusted iron gate. Inside: bare poured concrete, barred
// windows, standing water on the floors, and cell corridors running off a
// central atrium. The lighting is moonlight coming through the broken windows
// and nothing else — the darkest map in the set by a wide margin.
//
// LAYOUT (94 x 86 m):
//   y =  0.00  ATRIUM        the central engagement space, three storeys open
//                            to a broken skylight. Flooded — ankle-deep water
//                            that reacts to everything.
//   y =  0.00  CELL BLOCKS   two corridors east and west, each with two rows of
//                            genuinely modelled cells: real rooms, real
//                            doorways, real partitions between them.
//   y =  0.00  THE GROUNDS   the yard, the forecourt and the service road, all
//                            one continuous walkable surface OUTSIDE the
//                            building. This is what makes the destructible end
//                            walls mean something: break one and you are out.
//   y =  4.80  WALKWAY       a mezzanine ring around the atrium with railings
//                            — sections of it are already collapsed.
//   y =  6.60  TOWER         the watchtower cab over the yard.
//   y =  9.60  UPPER GALLERY the third level, partially fallen in. Highest
//                            ground, and the least floor left to stand on.
//   FLANKS                   both cell corridors, and the grounds around them
//   VERTICAL                 three stairs, one collapsed ramp of rubble, and
//                            the tower stair.
//
// THE GROUND IS ONE SLAB and the building is walls standing on it. The previous
// version laid floor only where a room was and dressed the outside with an
// unwalkable apron, which meant the two destructible steel end walls — the
// map's only structural shortcut — opened onto nothing at all.
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'detention',
  name: 'EISHU DETENTION CENTER',
  jp: '盈舟少年院',
  desc: 'Derelict, flooded and pitch dark. Moonlight through broken glass.',
  extent: { minX: -47, maxX: 47, minZ: -43, maxZ: 43 },
  background: 0x070a12,
  fog: { color: 0x0a0e18, near: 24, far: 100 },
  // Darkest map in the set, but "dark" has to mean SILHOUETTED, not erased:
  // the first tuning pass was genuinely unreadable, so the key and the ambient
  // both come up and the vignette comes off.
  grade: { vignette: 0.62, tint: [0.84, 0.92, 1.20], lift: 0.008, sat: 0.66 },
  lights: {
    key: { color: 0xafcaff, intensity: 1.45, pos: [-8, 22, 10] },
    rim: { color: 0x5f7fb0, intensity: 0.8, pos: [10, 8, -10] },
    hemi: { sky: 0x3d5680, ground: 0x1a1a20, intensity: 0.55 }
  },
  // stage-select beauty shot: hand-picked so the preview never ends up
  // inside a wall, above a ceiling or buried in the treeline.
  // Inside the atrium: from outside, its own south wall blocks the shot, and an
  // earlier position was 40 cm from the face of the south-east pillar, so the
  // stage-select shot was a full-frame close-up of a concrete column.
  previewCam: { pos: [17.0, 7.5, 15.5], look: [-5, 3.0, -5] },
  shadowScale: 0.78,
  shrineScale: 0.87,      // dark and enclosed; a big radius here would leave nowhere to go
  size: '94 × 86 m · 3 levels, flooded ground floor, yard + grounds'
};

const AX = 19;              // atrium half-extent
const WY = 4.8, GY = 9.6;   // walkway, upper gallery
const BLK_IN = AX + 0.4, BLK_OUT = 42;   // cell block, inner and outer x
const BLK_Z = 14;           // cell block half-depth

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  b.sky(0x050812, 0x0b1226, 0x1a2440, 320);
  b.groundPlane(0x0a0f14, 260);
  b.skyline(20, 150, { color: 0x060a12, minW: 20, maxW: 50, minH: 18, maxH: 44 });

  // ---- THE GROUND ---------------------------------------------------------
  // One slab under the whole map. Inside the shell it is the building's floor;
  // outside it is the yard, the forecourt and the service road.
  b.floor(-47, -43, 47, 43, 0, { mat: M.concrete, id: 'ground' });

  // ---- ATRIUM -------------------------------------------------------------
  const AZ = 'atrium';
  b.zone(AZ, { x0: -AX, x1: AX, z0: -AX, z1: AX, y0: -1, y1: 18 }, false);
  // standing water, ankle deep — the whole floor reacts to combat
  b.water(-AX + 0.4, -AX + 0.4, AX - 0.4, AX - 0.4, 0.14,
    { shallow: 0x3f6f8a, deep: 0x0e1e2c, opacity: 0.40, caustic: 0.16 });

  // structural columns carrying the walkway and gallery
  for (const [x, z] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) {
    b.pillar(x, z, 0, 16.2, 0.7, {
      square: true, mat: M.concrete, hp: 300,
      drops: [x < 0 ? (z < 0 ? 'wkNW' : 'wkSW') : (z < 0 ? 'wkNE' : 'wkSE')]
    });
  }
  // Atrium shell. The NORTH wall carries the doorway out to the exercise yard
  // and the SOUTH wall the doorway to the forecourt, so each is authored as the
  // two runs either side of its opening. The east and west walls are the cell
  // blocks' inner walls (built with the blocks).
  for (const [a, c] of [[-AX, -5], [5, AX]]) {
    b.wall(a, -AX - 0.4, c, -AX - 0.4, 0, 17, { mat: M.rust, zone: AZ });
    b.wall(a, AX + 0.4, c, AX + 0.4, 0, 17, { mat: M.rust, zone: AZ });
  }

  // BROKEN SKYLIGHT — the only real light source, and the shaft it throws
  {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 9.0, 17, 14, 1, true),
      glowMaterial(0xa8c8ff, 0.085));
    shaft.position.set(2, 8.5, -1.5);
    b.add(shaft);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(8.6, 26), glowMaterial(0xa8c8ff, 0.09));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(2, 0.2, -1.5);
    b.add(pool);
    // jagged glass teeth around the opening
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const g = new THREE.ConeGeometry(0.3, rand(0.7, 1.7), 3);
      g.rotateX(Math.PI);
      g.translate(2 + Math.sin(a) * 3.8, 16.6, -1.5 + Math.cos(a) * 3.8);
      b.static_(g, M.glass);
    }
  }

  // ---- WALKWAY (y = 4.8) — with sections already gone ---------------------
  b.floor(-AX, -AX, -8, -8, WY, { mat: M.concrete, id: 'wkNW' });
  b.floor(8, -AX, AX, -8, WY, { mat: M.concrete, id: 'wkNE' });
  b.floor(-AX, 8, -8, AX, WY, { mat: M.concrete, id: 'wkSW' });
  b.floor(8, 8, AX, AX, WY, { mat: M.concrete, id: 'wkSE' });
  // the north and south connecting runs survive; east and west do not — that
  // gap is authored, and the fight has to route around it
  b.floor(-8, -AX, 8, -12, WY, { mat: M.concrete, id: 'wkN' });
  b.floor(-8, 12, 8, AX, WY, { mat: M.concrete, id: 'wkS' });
  for (const [x0, z0, x1, z1] of [
    [-8, -12, 8, -12], [-8, 12, 8, 12], [-8, -12, -8, -8], [8, -12, 8, -8]
  ]) b.railing(x0, z0, x1, z1, WY);
  b.railing(-8, -8, -8, 8, WY);
  b.railing(8, -8, 8, 8, WY);
  // RUBBLE RAMP where the west run fell in. It used to climb eastward out into
  // the middle of the atrium and stop in mid-air — a route to nowhere, a metre
  // short of the walkway it was supposed to reach. It now climbs north into the
  // gap and lands on the north-west section's south edge, which is the only
  // walkway edge on this side of the building.
  b.stairs(-17.5, 3, -12, -8, 0, WY, 'z', { mat: M.concrete, steps: 11 });
  for (let i = 0; i < 14; i++) {
    const s = rand(0.5, 1.4);
    const g = new THREE.BoxGeometry(s, s * 0.7, s);
    g.rotateY(rand(0, 3));
    g.translate(rand(-18, -11), rand(0.2, 1.4), rand(-8, 4));
    b.static_(g, M.concrete, AZ);
  }

  // ---- UPPER GALLERY (y = 9.6) — mostly gone ------------------------------
  b.floor(-AX, -AX, -9, 0, GY, { mat: M.concrete, id: 'gW' });
  b.floor(9, 2, AX, AX, GY, { mat: M.concrete, id: 'gE' });
  b.railing(-9, -AX, -9, 0, GY);
  b.railing(9, 2, 9, AX, GY);
  // THE TWO FLIGHTS UP TO THE GALLERY. Both were once pointed at open air: the
  // west one climbed to gallery height where the west gallery does not exist,
  // and the east one likewise. Both now land on the edge of the slab they are
  // for.
  b.stairs(-AX, 8, -12, 0, WY, GY, 'z', { mat: M.concrete });
  b.stairs(12, -8, AX, 2, WY, GY, 'z', { mat: M.concrete });
  // The two ground-to-walkway flights were both drawn inside the walkway
  // sections they climbed to. There is exactly one place on each side with
  // clear air above it — the gaps in the ring — and the east flight goes there.
  // (The west route is the rubble ramp above.)
  b.stairs(10.5, -1, 17, 8, 0, WY, 'z', { mat: M.concrete });

  // ---- CELL BLOCKS (east + west) -----------------------------------------
  cellBlock(b, M, -1);
  cellBlock(b, M, 1);

  // ---- THE EXERCISE YARD (north) -----------------------------------------
  // Open sky, a wall round it, and a watchtower in the corner. This map is the
  // most enclosed in the set and that is the point of it — but three levels of
  // the same twenty-metre room is monotony rather than claustrophobia, and the
  // yard is what the interior is claustrophobic COMPARED TO.
  b.wall(-25, -41, -25, -AX, 0, 7.5, { mat: M.concrete });
  b.wall(25, -41, 25, -AX, 0, 7.5, { mat: M.concrete });
  b.wall(-25, -41, 25, -41, 0, 7.5, { mat: M.concrete });
  // razor wire along the top of the wall, drawn only
  for (let i = 0; i < 34; i++) {
    const g = new THREE.TorusGeometry(0.35, 0.03, 4, 8);
    g.rotateY(Math.PI / 2);
    g.translate(-24 + i * 1.45, 7.9, -41);
    b.static_(g, M.rust);
  }
  // court markings, a hoop nobody has used in years, and two benches
  {
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.55, 24), emissive(0x6a7a86));
    ring.rotation.x = -Math.PI / 2; ring.position.set(-6, 0.02, -30);
    b.add(ring);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.4, 8), M.rust);
    post.position.set(-14, 1.7, -34);
    b.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 0.09), M.wood);
    board.position.set(-14, 3.0, -33.6);
    b.add(board);
    b.bounds.wall(-14.3, -34.3, -13.7, -33.7, 0, 3.4, { id: 'yardhoop' });
  }
  b.bench(8, 0, -37, 0, 3.2);
  b.bench(14, 0, -37, 0, 3.2);
  // THE WATCHTOWER. Its cab is the only high ground outside the building, and
  // its posts stop 0.12 m short of the deck they carry — a post topping out at
  // exactly the deck height collides with anyone standing on the deck.
  const TY = 6.6;
  b.floor(15, -34, 23, -26, TY, { mat: M.rust, id: 'tower' });
  for (const [x0, z0, x1, z1] of [[15, -34, 23, -34], [23, -34, 23, -26], [15, -26, 23, -26]]) {
    b.railing(x0, z0, x1, z1, TY);
  }
  for (const [px, pz] of [[15.6, -33.4], [22.4, -33.4], [15.6, -26.6], [22.4, -26.6]]) {
    b.pillar(px, pz, 0, TY - 0.12, 0.22, { mat: M.rust, hp: 90, drops: ['tower'] });
  }
  b.stairs(8, -30.4, 15, -29.6, 0, TY, 'x', { mat: M.rust });
  b.stripLight(19, TY + 2.6, -30, 3.0, 'x', 0xa8c0d8, 0.65);
  {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9, 0.22, 9), M.rust);
    roof.position.set(19, TY + 3.0, -30);
    b.add(roof);
    for (const [px, pz] of [[15.6, -33.4], [22.4, -33.4], [15.6, -26.6], [22.4, -26.6]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.0, 6), M.rust);
      p.position.set(px, TY + 1.5, pz);
      b.add(p);
    }
  }

  // ---- the rusted iron gate, south forecourt -----------------------------
  b.wall(-13, 39, 13, 39, 0, 7, { mat: M.rust, destructible: true, hp: 110, id: 'gate' });
  for (const s of [-1, 1]) b.pillar(s * 13.6, 39, 0, 7.6, 0.6, { square: true, mat: M.concrete, hp: 180 });
  for (const s of [-1, 1]) {
    b.wall(s * 13.6, 39, s * 46, 39, 0, 5.5, { mat: M.concrete });
  }
  // the perimeter fence down the two long sides, so the grounds are grounds
  for (const s of [-1, 1]) {
    b.wall(s * 46, -41, s * 46, 39, 0, 5.5, { mat: M.concrete });
  }
  // a few dead trees and a burnt-out van on the service road
  for (const [tx, tz] of [[-38, 24], [-31, 33], [37, 26], [30, 34], [-42, -8], [44, -14]]) {
    b.tree(tx, 0, tz, rand(0.9, 1.4));
  }
  b.car(-30, 0, 20, 0.4, 0x2c2a26);
  b.car(33, 0, 16, Math.PI * 0.6, 0x3a2c26);

  // ---- ambient: dripping water, drifting dust, one failing lamp ----------
  b.particles(200, { x0: -44, x1: 44, y0: 0.3, y1: 14, z0: -40, z1: 40 },
    { color: 0x8fa8c8, size: 0.07, opacity: 0.26, vy: [-0.15, 0.04] });
  b.particles(280, { x0: -AX + 2, x1: AX - 2, y0: 0.3, y1: 16, z0: -AX + 2, z1: AX - 2 },
    { color: 0xa8c8ff, size: 0.05, opacity: 0.5, vy: [-5.5, -2.5] });     // the drip
  b.stripLight(-AX, 4.6, 0, 2.0, 'z', 0xa8c0d8, 0.8);
  b.stripLight(AX, 4.6, 0, 2.0, 'z', 0xa8c0d8, 0.72);

  b.bounds.spawns = [v3(-8, 0, 5), v3(8, 0, -5), v3(0, 0, -13), v3(0, 0, 13)];
  return b;
}

// ---------------------------------------------------------------------------
// ONE CELL BLOCK
// ---------------------------------------------------------------------------
// A corridor running out from the atrium with a row of cells down each side.
// Each cell is a real room: two partitions, a back wall, and a doorway onto the
// corridor. The previous version was a single-iteration loop with a `break` in
// it and three unused locals — it laid one row of floor slabs and one dividing
// wall, so most of the "cell block" was an empty rectangle with a ceiling on it.
function cellBlock(b, M, sx) {
  const zn = 'cells' + sx;
  const IN = sx * BLK_IN, OUT = sx * BLK_OUT;
  const lo = Math.min(IN, OUT), hi = Math.max(IN, OUT);
  const NC = 4, CW = (hi - lo - 2) / NC;      // cells per side, and their width
  b.zone(zn, { x0: lo - 1, x1: hi + 1, z0: -BLK_Z - 1, z1: BLK_Z + 1, y0: -1, y1: 7 });

  b.ceiling(lo, -BLK_Z, hi, BLK_Z, 5.0, { mat: M.concrete, zone: zn });
  b.water(lo + 0.4, -4.6, hi - 0.4, 4.6, 0.12,
    { shallow: 0x3f6f8a, deep: 0x0e1e2c, opacity: 0.40, caustic: 0.16 });

  // the cell fronts: a run of wall per cell with a doorway punched in it
  for (const s of [-1, 1]) {
    for (let i = 0; i < NC; i++) {
      const a = lo + 1 + i * CW;
      const door = a + CW / 2;
      b.wall(a, s * 5, door - 0.9, s * 5, 0, 5.0, { mat: M.concrete, zone: zn });
      b.wall(door + 0.9, s * 5, a + CW, s * 5, 0, 5.0, { mat: M.concrete, zone: zn });
    }
    // the partitions between cells, and the two ends of the row
    for (let i = 0; i <= NC; i++) {
      const x = lo + 1 + i * CW;
      b.wall(x, s * 5, x, s * BLK_Z, 0, 5.0, { mat: M.concrete, zone: zn });
    }
    // the outer wall of the row, carrying the BARRED WINDOWS the moonlight
    // comes through — one per cell, so every cell is lit by its own window
    for (let i = 0; i < NC; i++) {
      const a = lo + 1 + i * CW, c = a + CW;
      const wx = a + CW / 2;
      b.wall(a, s * BLK_Z, wx - 1.5, s * BLK_Z, 0, 5.8, { mat: M.rust, zone: zn });
      b.wall(wx + 1.5, s * BLK_Z, c, s * BLK_Z, 0, 5.8, { mat: M.rust, zone: zn });
      const bars = [];
      for (let k = 0; k < 7; k++) bars.push({ x: wx - 1.32 + k * 0.44, y: 2.8, z: s * BLK_Z });
      b.repeat(new THREE.BoxGeometry(0.09, 2.2, 0.16), M.rust, bars);
      b.bounds.wall(wx - 1.5, s * BLK_Z - 0.3, wx + 1.5, s * BLK_Z + 0.3, 0, 5.8,
        { id: 'bar' + sx + s + i });
      // the shaft of moonlight it throws across the cell
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 8.5), glowMaterial(0x9fc0ff, 0.11));
      beam.rotation.set(s > 0 ? Math.PI / 3 : -Math.PI / 3, 0, 0);
      beam.position.set(wx, 2.6, s * (BLK_Z - 3.4));
      b.add(beam);
    }
  }

  // the block's inner wall, either side of the doorway into the atrium
  b.wall(IN, -BLK_Z, IN, -6, 0, 17, { mat: M.rust, zone: zn });
  b.wall(IN, 6, IN, BLK_Z, 0, 17, { mat: M.rust, zone: zn });
  // THE FAR END. A destructible steel shutter — and now that the grounds
  // outside are real walkable floor rather than a decorative apron, breaking it
  // is a genuine shortcut out of the building instead of a hole into nothing.
  b.wall(OUT, -BLK_Z, OUT, BLK_Z, 0, 5.8,
    { mat: M.rust, destructible: true, hp: 150, zone: zn, id: 'cellend' + sx });

  // lockers and debris down the corridor
  b.lockerBank(sx * 26, 0, 4.2, sx > 0 ? Math.PI / 2 : -Math.PI / 2, 5);
  b.lockerBank(sx * 34, 0, -4.2, sx > 0 ? Math.PI / 2 : -Math.PI / 2, 5);
  for (let i = 0; i < 4; i++) {
    b.stripLight(lo + 3 + i * (hi - lo - 6) / 3, 4.8, 0, 2.6, 'x', 0xa8c0d8, i === 1 ? 0.7 : 0);
  }
}
