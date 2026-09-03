// SENDAI COLONY — SCHOOL. The Culling Game site where Megumi fought Reggie
// Star, and the map he was specifically requested to have.
//
// REFERENCE NOTE (researched): the fight runs through a school gymnasium and
// then drops through the floor into the swimming pool underneath it, finishing
// back on the boards. Those two rooms are therefore built as CONNECTED interior
// spaces sharing a wall, with the pool one level down — the vertical
// relationship between them is the map's identity, so the gym floor over the
// pool is a destructible slab you can genuinely put someone through.
//
// WHY THIS SHAPE. The previous version was four rectangles in a row: a
// rectangular gym, a rectangular pool hall under half of it, a straight
// corridor with rectangular classrooms off it, and a rectangular field. What
// changed is the SECTION and the PLAN, not the idea:
//   · the gym is a BARREL-VAULTED hall now — one arch across 32 m with nothing
//     under the middle of it, so the shot down the court is clear and the
//     catwalks are hung off the springing rather than standing on posts
//   · the pool hall is ROUND, with a circular basin ringed by steps under a
//     coffered dome, so falling through the gym floor drops you into the middle
//     of a rotunda rather than into a corner of a box
//   · the classrooms are a CRESCENT wrapping the gym's north side, with the
//     corridor on its inside face, so the flank is a curve you are chased along
//   · the field has a real oval track on it
//
// LAYOUT (104 x 88 m):
//   y = -6.10  THE BASIN    the pool itself, ringed by steps.
//   y = -4.20  POOL DECK    the rotunda floor round it.
//   y =  0.00  GYM          a full court under the vault. Its west half is the
//                           pool hall's roof, and it breaks.
//   y =  0.00  THE GROUND   the field, the track and the yard.
//   y =  4.60  CATWALKS     hung off the vault's springing, both long sides.
//   y =  4.60  UPPER CRESCENT the classroom wing's second storey.
//   y =  9.20  THE LOOKOUT  a drum in the courtyard between the gym and the
//                           crescent, up a helix. Highest ground, and a dead end.
//   y =  9.20  WING ROOF    solid to land on; nothing climbs to it.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../../core/math.js';

export const DEF = {
  id: 'sendai_school',
  name: 'SENDAI COLONY SCHOOL',
  jp: '仙台結界 学校',
  desc: 'A vaulted gym over a round pool hall. Break the floor and it goes swimming.',
  extent: { minX: -52, maxX: 52, minZ: -44, maxZ: 44 },
  terrain: NATURAL,
  background: 0x1a2030,
  fog: { color: 0x1e2534, near: 58, far: 180 },
  grade: { vignette: 0.54, tint: [0.98, 1.0, 1.04], lift: 0, sat: 0.92 },
  lights: {
    key: { color: 0xf0f4ff, intensity: 1.2, pos: [8, 20, 6] },
    rim: { color: 0x7fa0d0, intensity: 0.72, pos: [-10, 12, -8] },
    hemi: { sky: 0xa8bcd8, ground: 0x585044, intensity: 0.72 }
  },
  previewCam: { pos: [18.5, 7.2, -13.5], look: [-5, 2.8, 4] },
  shadowScale: 0.9,
  shrineScale: 0.93,
  size: '104 × 88 m · vaulted gym, domed pool rotunda, crescent wing, track'
};

const GX = 22, GZ_ = 16;            // gym half-extents (interior)
const WALLX = GX + 0.4, WALLZ = GZ_ + 0.4;
const SPRING = 5.6, VRISE = 6.6;    // the vault
const CY = 4.6;                     // catwalks and the wing's upper floor
const POOL = { x: -12, z: 0, r: 13.5 };   // the rotunda under the gym's west half
const PDECK = -4.2, PBASIN = -6.1;
const WELL = { x: -18.5, z: 9.5, r: 3.3 };   // the way down, through the gym floor
// The crescent, centred on the gym and wrapping its EAST side. Pushed out to
// r = 38 so there is an 8 m courtyard between the gym's wall and the wing's
// inner edge — which is where the stair tower stands, and the only place on
// this map with nothing above it to be buried under.
const WING_R = 38, WING_A = Math.PI / 2;
// The stair tower, set OFF the courtyard's midpoint. Centred on it at 4.2 m it
// filled the 8 m gap wall to wall and left no room for the wing's own flight.
const TOWER = { x: 26.5, z: -10, r: 3.5 };
const WY = 9.2;

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const GZ = 'gym', PZ = 'pool', CZ = 'wing';

  // ---- THIS SCHOOL'S OWN SURFACES ----------------------------------------
  const boards = b.tint('wood', 0xd49a55, { rim: 0.22 });
  const render = b.tint('paint', 0x9aa0a4);
  const renderIn = b.tint('paint', 0x8e9498, { side: 2 });
  const tileM = b.tint('tile', 0x8a9298);
  const poolM = b.tint('poolTile', 0x2f7f9a, { rim: 0.34 });
  const turf = b.tint('grass', 0x38542f, { rim: 0.1 });
  const track = b.tint('asphalt', 0x6a3a30, { rim: 0.1 });
  const iron = b.tint('darkMetal', 0x2f343e, { rim: 0.42 });

  b.sky(0x2c3a58, 0x4a5878, 0x7f8ea8, 320);
  b.groundPlane(0x1f2a1f, 260);

  // =========================================================================
  // THE GYMNASIUM — one arch, no columns
  // =========================================================================
  b.zone(GZ, { x0: -WALLX - 1, x1: WALLX + 1, z0: -WALLZ - 1, z1: WALLZ + 1, y0: -1, y1: 16 });
  // The floor is laid in slabs so the west ones — the pool rotunda's roof — can
  // be dropped, and with the stair well cut through one of them.
  const slabIds = [];
  const NI = 5, NJ = 4, SW = (GX * 2 - 2) / NI, SD = (GZ_ * 2 - 2) / NJ;
  for (let i = 0; i < NI; i++) {
    for (let j = 0; j < NJ; j++) {
      const x0 = -GX + 1 + i * SW, z0 = -GZ_ + 1 + j * SD;
      const id = 'gymslab' + i + j;
      const overPool = Math.hypot((x0 + SW / 2) - POOL.x, (z0 + SD / 2) - POOL.z) < POOL.r - 1;
      const holed = x0 < WELL.x + WELL.r && x0 + SW > WELL.x - WELL.r
        && z0 < WELL.z + WELL.r && z0 + SD > WELL.z - WELL.r;
      slabIds.push({ id, x0, z0, x1: x0 + SW, z1: z0 + SD, overPool });
      if (holed) {
        b.floorHole(x0, z0, x0 + SW, z0 + SD, 0,
          { x0: WELL.x - WELL.r, z0: WELL.z - WELL.r, x1: WELL.x + WELL.r, z1: WELL.z + WELL.r },
          { mat: boards, id });
      } else b.floor(x0, z0, x0 + SW, z0 + SD, 0, { mat: boards, id });
    }
  }
  b.floor(-WALLX, -WALLZ, -GX + 1, WALLZ, 0, { mat: boards });
  b.floor(GX - 1, -WALLZ, WALLX, WALLZ, 0, { mat: boards });
  b.floor(-GX + 1, -WALLZ, GX - 1, -GZ_ + 1, 0, { mat: boards });
  b.floor(-GX + 1, GZ_ - 1, GX - 1, WALLZ, 0, { mat: boards });
  // court markings
  const line = emissive(0xe8b04a);
  for (const [x0, z0, x1, z1] of [[-19, -13, 19, -13], [-19, 13, 19, 13], [-19, -13, -19, 13],
  [19, -13, 19, 13], [0, -13, 0, 13]]) {
    const g = new THREE.BoxGeometry(Math.max(0.1, Math.abs(x1 - x0)), 0.02, Math.max(0.1, Math.abs(z1 - z0)));
    g.translate((x0 + x1) / 2, 0.02, (z0 + z1) / 2);
    b.static_(g, line);
  }
  {
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.16, 28), line);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    b.add(ring);
  }
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.6, 8), iron);
    post.position.y = 1.8;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 1.8), M.glass);
    board.position.set(s * -0.2, 3.2, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 6, 18), emissive(0xd8622c));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(s * -0.7, 2.9, 0);
    g.add(post, board, rim);
    g.position.set(s * 20, 0, 0);
    b.add(g);
    b.bounds.wall(s * 20 - 0.25, -0.25, s * 20 + 0.25, 0.25, 0, 3.6, { id: 'hoop' + s });
  }

  // THE SHELL AND THE VAULT. The side walls carry the springing; the vault is
  // one arch across the full 32 m with nothing under the middle of it.
  b.wall(-WALLX, -WALLZ, -WALLX, WALLZ, 0, SPRING, { mat: render, zone: GZ });
  b.wall(WALLX, -WALLZ, WALLX, WALLZ, 0, SPRING, { mat: render, zone: GZ });
  b.vault(-WALLX, -WALLZ, WALLX, WALLZ, SPRING, VRISE, { mat: renderIn, axis: 'x', segs: 16, zone: GZ });
  // THE LONG SIDES carry the springing: solid to 5.0, a band of high glass up to
  // the springing itself, and a doorway in the middle of each.
  for (const sz of [-1, 1]) {
    for (const [a, c] of [[-WALLX, -5], [5, WALLX]]) {
      b.wall(a, sz * WALLZ, c, sz * WALLZ, 0, 5.0, { mat: render, zone: GZ });
    }
    b.windows(-WALLX + 1, sz * WALLZ, -5.4, sz * WALLZ, 5.0, SPRING,
      { zone: GZ, hp: 22, id: 'gymwinA' + sz });
    b.windows(5.4, sz * WALLZ, WALLX - 1, sz * WALLZ, 5.0, SPRING,
      { zone: GZ, hp: 22, id: 'gymwinB' + sz });
    b.wall(-5, sz * WALLZ, 5, sz * WALLZ, 4.2, SPRING, { mat: render, zone: GZ });
  }
  // THE GABLE ENDS ARE THE VAULT'S ENDS, and the vault runs along X — so they
  // are the EAST and WEST walls, not the north and south ones. Walled only to
  // the springing they left the whole arch open at both ends: from inside the
  // hall, a dark ellipse of night sky where the roof should be. Each is filled
  // with a fan of chords following the same arch the vault does.
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 20; k++) {
      const a0 = Math.PI * k / 20, a1 = Math.PI * (k + 1) / 20;
      const u0 = -Math.cos(a0) * WALLZ, u1 = -Math.cos(a1) * WALLZ;
      const v = Math.min(Math.sin(a0), Math.sin(a1)) * VRISE;
      const h = Math.max(0.5, v + 0.6);
      const g = new THREE.BoxGeometry(0.5, h, Math.abs(u1 - u0) + 0.5);
      g.translate(sx * WALLX, SPRING + h / 2 - 0.3, (u0 + u1) / 2);
      b.static_(g, render, GZ);
    }
  }

  // CATWALKS hung off the springing, both long sides, with a flight at one end
  for (const s of [-1, 1]) {
    b.floor(-WALLX, s * (GZ_ - 3.4), WALLX, s * WALLZ, CY, { mat: iron, id: 'catwalk' + s });
    // THE RAIL IS SPLIT AROUND THE STAIR HEAD. Run the length of the catwalk it
    // fences off the one flight that reaches it, which is how you build a
    // walkway nobody can stand on — and the reachability pass said so.
    const sx = s < 0 ? -WALLX + 1.0 : WALLX - 4.6, ex = s < 0 ? -WALLX + 4.6 : WALLX - 1.0;
    b.railing(-WALLX, s * (GZ_ - 3.4), sx, s * (GZ_ - 3.4), CY, { zone: GZ });
    b.railing(ex, s * (GZ_ - 3.4), WALLX, s * (GZ_ - 3.4), CY, { zone: GZ });
    for (let i = 0; i <= 10; i++) {
      const g = new THREE.BoxGeometry(0.18, 0.18, 3.6);
      g.translate(-WALLX + i * (WALLX * 2 / 10), CY - 0.5, s * (GZ_ - 1.6));
      b.static_(g, iron, GZ);
    }
  }
  // A REAL WIDTH ACROSS THE CLIMB, and a top tread at the catwalk's INNER edge.
  // Authored with x0 === x1 both flights drew treads with a zero-length side
  // and registered a ramp with zero area — they did not exist — and aimed at
  // the catwalk's outer edge they ran their whole length underneath it.
  b.stairs(-WALLX + 1.0, -6.0, -WALLX + 4.6, -(GZ_ - 3.4), 0, CY, 'z', { zone: GZ, mat: iron });
  b.stairs(WALLX - 1.0, 6.0, WALLX - 4.6, GZ_ - 3.4, 0, CY, 'z', { zone: GZ, mat: iron });
  for (let i = 0; i < 5; i++) for (const z of [-8, 8]) {
    b.stripLight(-16 + i * 8, SPRING + VRISE - 1.4, z, 3.2, 'x', 0xf4f8ff, i === 2 && z > 0 ? 0.35 : 0);
  }
  for (let i = 0; i < 5; i++) {
    b.godRay(-16 + i * 8, SPRING - 0.3, WALLZ - 1.2, 2.3, SPRING - 0.3, 0xfff4dc,
      { opacity: 0.065, taper: 0.4, lean: [1.0, -13], range: 80 });
  }
  b.particles(220, { x0: -GX, x1: GX, y0: 0.4, y1: 11, z0: -GZ_, z1: GZ_ },
    { color: 0xfff4dc, size: 0.05, opacity: 0.30, vy: [-0.05, 0.05] });

  // =========================================================================
  // THE POOL ROTUNDA — one level down, under the gym's west half
  // =========================================================================
  b.zone(PZ, { x0: POOL.x - POOL.r - 2, x1: POOL.x + POOL.r + 2, z0: POOL.z - POOL.r - 2, z1: POOL.z + POOL.r + 2, y0: -9, y1: 1 });
  b.pit(POOL.x - POOL.r, POOL.z - POOL.r, POOL.x + POOL.r, POOL.z + POOL.r, PBASIN);
  b.roundDeck(POOL.x, POOL.z, POOL.r, PDECK, { rIn: 9.1, mat: tileM, thick: 0.4, zone: PZ, id: 'pooldeck' });
  // THE BASIN, ringed by four strides. Three put 0.63 m between the deck and
  // the top step — over STEP_UP, which makes the last one a wall and the whole
  // pool a hole you can see into and not get out of.
  b.roundDeck(POOL.x, POOL.z, 7.0, PBASIN, { mat: poolM, thick: 0.5, zone: PZ, id: 'basin' });
  for (let i = 0; i < 3; i++) {
    const ri = 7.0 + i * 0.7, ro = ri + 0.7;
    b.roundDeck(POOL.x, POOL.z, ro, PBASIN + (i + 1) * (PDECK - PBASIN) / 4,
      { rIn: ri, mat: poolM, thick: 0.62, zone: PZ, id: 'poolstep' + i });
  }
  b.water(POOL.x, POOL.z, POOL.x, POOL.z, PBASIN + 1.5, {
    radius: 8.2, shallow: 0x5fb4d8, deep: 0x14486e, opacity: 0.6, caustic: 0.5
  });
  b.arcWall(POOL.x, POOL.z, POOL.r + 0.4, 0, Math.PI * 2, PBASIN, -0.6,
    { mat: tileM, thick: 0.8, segs: 30, zone: PZ, id: 'poolwall' });
  b.mist(POOL.x, POOL.z, POOL.x, POOL.z, PBASIN + 1.6, 0x9fd0e0, { radius: 8.0, opacity: 0.24, scale: 8 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    b.hangingLamp(POOL.x + Math.sin(a) * 11, -0.7, POOL.z + Math.cos(a) * 11, 1.1, 0xcfe8f4, { range: 40 });
  }
  b.lockerBank(POOL.x - 11.5, PDECK, POOL.z + 4, Math.PI / 2, 5);
  b.lockerBank(POOL.x - 11.5, PDECK, POOL.z - 4, Math.PI / 2, 5);
  b.godRay(WELL.x, 0, WELL.z, 3.0, 4.4, 0xdfeef4, { opacity: 0.11, taper: 0.6, pool: false });

  // THE WAY DOWN: a helix through the well cut in the gym floor.
  {
    const a = Math.atan2(WELL.x - POOL.x, WELL.z - POOL.z);
    b.spiralStair(WELL.x, WELL.z, 0, PDECK, {
      rIn: 0.6, rOut: 3.0, rise: 0.24, turns: 1, dir: -1, a0: a,
      mat: tileM, newelMat: iron, zone: PZ, id: 'poolhelix'
    });
  }

  // GYM FLOOR OVER THE POOL: those slabs are destructible, and dropping one
  // puts both fighters in the water. This is the map's signature move.
  for (const s of slabIds) {
    if (!s.overPool) continue;
    const grp = new THREE.Group();
    const planks = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(SW / 3 - 0.06, 0.28, SD - 0.1), boards);
      m.position.set(s.x0 + SW / 6 + i * (SW / 3), -0.15, (s.z0 + s.z1) / 2);
      m.userData.home = m.position.clone();
      m.userData.homeRot = m.rotation.clone();
      grp.add(m);
      planks.push(m);
    }
    b.add(grp);
    b.destructReg.push({
      group: grp, chunks: planks, hp: 150, kind: 'wood',
      center: v3((s.x0 + s.x1) / 2, 0, (s.z0 + s.z1) / 2), radius: 4.4, height: 0.3, baseY: -0.3,
      colliderIds: [], dropPlatformIds: [s.id], dropMeshes: [], debrisScale: 1.5
    });
  }

  // =========================================================================
  // THE CRESCENT — the classroom wing, wrapped round the gym's north side
  // =========================================================================
  b.zone(CZ, { x0: 18, x1: 50, z0: -44, z1: 44, y0: -1, y1: 12 }, false);
  const A0 = WING_A - 0.85, A1 = WING_A + 0.85;    // the arc it spans, about -z
  const wingAt = (a, r) => v3(Math.sin(a) * r, 0, -Math.cos(a) * r);
  const NROOM = 7;
  for (const [lvl, y] of [[0, 0], [1, CY]]) {
    // the deck: corridor on the inside, rooms on the outside
    for (let k = 0; k < 22; k++) {
      const a0 = A0 + (A1 - A0) * (k / 22), a1 = A0 + (A1 - A0) * ((k + 1) / 22);
      const am = (a0 + a1) / 2;
      const chord = 2 * WING_R * Math.sin((A1 - A0) / 44) * 1.3;
      const p = wingAt(am, WING_R);
      const g = new THREE.BoxGeometry(chord, 0.4, 15);
      g.rotateY(-am);
      g.translate(p.x, y - 0.2, p.z);
      b.static_(g, tileM, CZ);
      const ca = Math.abs(Math.cos(am)), sa = Math.abs(Math.sin(am));
      const hx = (ca * chord + sa * 15) / 2, hz = (sa * chord + ca * 15) / 2;
      b.bounds.platform(p.x - hx, p.z - hz, p.x + hx, p.z + hz, y, { id: 'wing' + lvl });
      b.bounds.terrain(p.x - hx, p.z - hz, p.x + hx, p.z + hz, y, 'artificial');
    }
    // the partitions between rooms, and the glazed outer face
    for (let i = 0; i <= NROOM; i++) {
      const a = A0 + (A1 - A0) * (i / NROOM);
      const p0 = wingAt(a, WING_R - 3), p1 = wingAt(a, WING_R + 7.5);
      b.wall(p0.x, p0.z, p1.x, p1.z, y, y + 4.2,
        { mat: render, thick: 0.5, zone: CZ, collide: i > 0 && i < NROOM });
    }
    // the corridor wall, with a doorway per room. The wing's arc is measured
    // about -z, so its bearings are the kit's own minus PI.
    for (let i = 0; i < NROOM; i++) {
      const c = A0 + (A1 - A0) * ((i + 0.5) / NROOM);
      const half = (A1 - A0) / (NROOM * 2);
      for (const [w0, w1] of [[c - half + 0.012, c - 0.03], [c + 0.03, c + half - 0.012]]) {
        b.arcWall(0, 0, WING_R - 3.2, Math.PI - w1, Math.PI - w0, y, y + 4.2,
          { mat: render, thick: 0.4, zone: CZ, id: 'wingfront' + lvl + i });
      }
    }
  }
  // the wing's roof — a curve, and the highest ground on the map
  for (let k = 0; k < 22; k++) {
    const a0 = A0 + (A1 - A0) * (k / 22), a1 = A0 + (A1 - A0) * ((k + 1) / 22);
    const am = (a0 + a1) / 2;
    const chord = 2 * WING_R * Math.sin((A1 - A0) / 44) * 1.3;
    const p = wingAt(am, WING_R);
    const g = new THREE.BoxGeometry(chord, 0.4, 15);
    g.rotateY(-am);
    g.translate(p.x, WY - 0.2, p.z);
    b.static_(g, render, CZ);
    const ca = Math.abs(Math.cos(am)), sa = Math.abs(Math.sin(am));
    const hx = (ca * chord + sa * 15) / 2, hz = (sa * chord + ca * 15) / 2;
    // solid to land on, but not a route: nothing climbs to it, and a slab with
    // no way onto it is exactly what the reachability pass is for
    b.bounds.platform(p.x - hx, p.z - hz, p.x + hx, p.z + hz, WY, { id: 'wingroof', prop: true });
  }
  // GETTING UP THE CRESCENT. One radial flight at the arc's midpoint, where the
  // radius runs along +x and an axis-aligned stair fits, landing on the deck's
  // inner edge; and a helix in the courtyard for the top.
  //
  // Flights at the arc's ENDS were tried and cannot work: the radius there is
  // on no axis, so an axis-aligned flight crosses the wing's own footprint
  // diagonally and every one of them ran under the deck it was climbing to.
  // At the arc's midpoint, where the radius runs along +x. Authored between two
  // expressions that both came to 31.0 it had zero width across the climb:
  // treads with a zero-length side and a ramp with no area, which is to say no
  // stair at all.
  b.stairs(22.8, -2.6, 30.4, 2.6, 0, CY, 'x', { mat: tileM, zone: CZ, id: 'wingstair' });
  {
    b.spiralStair(TOWER.x, TOWER.z, 0, WY, {
      rIn: 0.7, rOut: TOWER.r - 0.7, rise: 0.24, turns: 2, dir: 1, a0: Math.PI,
      mat: tileM, newelMat: iron, id: 'towerhelix'
    });
    b.roundDeck(TOWER.x, TOWER.z, TOWER.r + 0.5, WY, { mat: tileM, thick: 0.35, id: 'lookout' });
    b.arcWall(TOWER.x, TOWER.z, TOWER.r + 0.6, Math.PI + 0.55, Math.PI + Math.PI * 2 - 0.55,
      WY + 0.5, WY + 1.15, { mat: iron, thick: 0.1, segs: 14, id: 'lookoutrail', collide: false });
    b.beacon(TOWER.x, WY + 1.6, TOWER.z, 0xffa03c, { reach: 4.4 });
  }

  // =========================================================================
  // THE GROUNDS
  // =========================================================================
  b.floor(-52, -44, 52, 44, 0, { mat: turf, id: 'field' });
  // the running track: a real oval, south of the gym
  b.roundDeck(0, -30, 17, 0.02, { rIn: 12.5, mat: track, thick: 0.16, walk: false, id: 'track' });
  b.sigil(0, 0.04, -30, 11, 0x6ad8a8, { rings: 3, spokes: 18, sides: 4, opacity: 0.26, spin: 0.02 });
  b.mist(-52, -44, 52, -WALLZ, 0, 0xb4c4c8, { opacity: 0.16, scale: 30 });
  for (let i = 0; i < 12; i++) {
    b.tree(-46 + i * 8.4, 0, -41 + rand(-1.5, 1.5), rand(1.1, 1.7));
  }
  for (const [gx, gz] of [[-38, 18], [38, 18]]) {
    b.crates(gx, 0, gz, { count: 3 });
    b.crates(gx + 1.8, 0, gz - 1.4, { count: 2 });
    for (let i = 0; i < 3; i++) b.drum(gx + 4 + i * 1.05, 0, gz, { color: 0x4a7a3c });
  }
  b.sparker(-WALLX + 0.5, CY + 1.4, 0, { color: 0xdfeaff });
  for (const [bx, bc] of [[-14, 0xd8425a], [-4, 0xdfe4ea], [6, 0x3a72c8], [16, 0xe8b04a]]) {
    b.banner(bx, SPRING + 3.4, -GZ_ + 0.5, 2.4, 4.0, bc, { ry: 0, amp: 0.08 });
  }

  b.particles(160, { x0: -50, x1: 50, y0: 0.4, y1: 14, z0: -42, z1: 42 },
    { color: 0xdfe8f4, size: 0.06, opacity: 0.22, vy: [-0.08, 0.06] });

  b.bounds.spawns = [v3(-9, 0, 0), v3(9, 0, 0), v3(0, 0, -9), v3(0, 0, 9)];
  return b;
}
