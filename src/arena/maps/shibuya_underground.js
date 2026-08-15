// SHIBUYA STATION — ELEVATED PLATFORM LEVEL.
//
// REFERENCE NOTE (researched): the JR viaduct running above the scramble, an
// island platform between two tracks under a long steel canopy on columns,
// trains standing at the edge, tactile paving along the platform lip, and the
// city carried on past the parapet in every direction. Night, rain, and the
// neon of the crossing throwing colour up onto the underside of the roof.
//
// The layout bones are the good ones: a long central platform, a trench either
// side, a mezzanine ring overhead carried on structural pillars, and several
// ways between the levels. What changed is the SCALE — this was 68 x 52 m and
// by a distance the tightest arena in the set, which made every zoner miserable
// on it — and the standing trains, one of which is now a room.
//
// LAYOUT (96 x 46 m):
//   y = -1.10  TRACK PITS      two trenches flanking the platform, part-filled
//                              by standing trains. Mirrored so each side has
//                              one blocked half and one open half.
//   y = -0.60  THE OPEN CAR    one car in the north trench is a real interior:
//                              floor, ceiling, seats, two door gaps. The
//                              tightest space on the map and the only one with
//                              a roof you can hear the rain on.
//   y =  0.00  PLATFORM        the central engagement space, 66 m of it, two
//                              pillar rows, benches, vending, signage.
//   y =  5.20  CONCOURSE       a mezzanine ring above, ticket gates, reached by
//                              two escalators and two stairs.
//   y = 10.70  ROOF WALK       the top of the exit stair, above the canopy —
//                              the highest ground and fully exposed.
//   VERTICAL                   2 escalators + 2 stairs + 1 exit stair.
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'shibuya_underground',
  name: 'SHIBUYA STATION',
  jp: '渋谷駅 高架ホーム',
  desc: 'Elevated platform. Steel canopy, standing trains, and the city past the parapet.',
  // groundY sits at the trench floor, not 0. Without it the default ground
  // plane (y=0) sits ABOVE the pit slabs and floorAt never returns them, so
  // the "step down into the trench" is visual only and you walk on air across
  // the tracks.
  // The bounds stop where the built floor does. They used to run out past the
  // deepest authored surface, so anyone who walked off the end of a track pit
  // kept going on the invisible ground plane with the city thirteen metres
  // below them. Walking on air is worse than a wall, and this station has a
  // real wall to put there (see the outer trench walls below).
  extent: { minX: -46, maxX: 46, minZ: -18, maxZ: 18, groundY: -1.10 },
  background: 0x0a0e1c,
  fog: { color: 0x141c30, near: 44, far: 150 },
  grade: { vignette: 0.54, tint: [1.00, 0.98, 1.12], lift: 0.004, sat: 1.06 },
  lights: {
    key: { color: 0xcfe0ff, intensity: 1.05, pos: [8, 18, 6] },
    rim: { color: 0xd8688f, intensity: 0.62, pos: [-10, 12, -10] },
    hemi: { sky: 0x46578c, ground: 0x1a1a22, intensity: 0.46 }
  },
  previewCam: { pos: [-44, 6.5, -6.5], look: [8, 1.8, 1] },
  shadowScale: 1.15,
  shrineScale: 0.95,      // a platform with trenches: still the most enclosed map, but no longer cramped
  size: '96 × 46 m · platform + trenches + mezzanine'
};

// The platform half-length and the trench geometry, named once: the floor, the
// canopy, the trains, the concourse bays and the outer walls all have to agree
// about where the platform ends, and eight hand-copied numbers is how they stop
// agreeing.
const PX = 33;          // platform half-length
const PZ = 9;           // platform half-width (the trench lip)
const TZ = 17;          // outer edge of the track pits
const EX = 45;          // outer edge of everything
const CY = 5.2;         // concourse
const RY = 10.4;        // canopy underside
const SY = 10.7;        // roof walk

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const Z = 'station';
  b.zone(Z, { x0: -EX - 1, x1: EX + 1, z0: -TZ - 1, z1: TZ + 1, y0: -2, y1: 16 }, false);

  // ---- the city this thing is standing in --------------------------------
  b.sky(0x060a18, 0x101a38, 0x2a2450);
  b.groundPlane(0x090c14, 300, -14);
  b.skyline(30, 150, { color: 0x0b0f1e, minW: 14, maxW: 34, minH: 34, maxH: 120 });

  // ---- PLATFORM LEVEL -----------------------------------------------------
  b.floor(-PX, -PZ, PX, PZ, 0, { mat: M.tile });
  for (const z of [-PZ, PZ]) {
    const g = new THREE.BoxGeometry(PX * 2, 0.04, 0.7);
    g.translate(0, 0.02, z + (z < 0 ? 0.35 : -0.35));
    b.static_(g, emissive(0xc8a83c), Z);
  }

  // TRACK PITS: a step down either side. Walkable — cornering someone in a
  // trench is a real option — and the only dead ends on the map.
  for (const s of [-1, 1]) {
    const ZC = s * 13;                            // track centreline
    b.floor(-EX, Math.min(s * PZ, s * TZ), EX, Math.max(s * PZ, s * TZ), -1.10, { mat: M.concrete });
    b.wall(-EX, s * PZ, EX, s * PZ, -1.10, 0, { mat: M.concreteWall, thick: 0.4, collide: false });
    const bal = new THREE.BoxGeometry(EX * 2 - 2, 0.12, 4.0);
    bal.translate(0, -1.04, ZC);
    b.static_(bal, M.rust, Z);
    for (const off of [-0.72, 0.72]) {
      const g = new THREE.BoxGeometry(EX * 2 - 2, 0.16, 0.10);
      g.translate(0, -0.94, ZC + off);
      b.static_(g, M.metal, Z);
    }
    const sleepers = [];
    for (let x = -EX + 2; x <= EX - 2; x += 0.95) sleepers.push({ x, y: -1.02, z: ZC });
    b.repeat(new THREE.BoxGeometry(0.26, 0.12, 2.7), M.wood, sleepers);
    // The far side of the pit: the station's outer wall, carrying the mezzanine
    // above it. This is what the trench used to be missing — the slab simply
    // stopped and the fighter carried on into open sky.
    // stopped 0.12 m under the concourse it carries, for the same reason the
    // columns are — a wall topping out at exactly the floor height beside it
    // collides with anyone standing on that floor. Hidden inside the slab.
    b.wall(-EX - 0.4, s * (TZ + 0.4), EX + 0.4, s * (TZ + 0.4), -1.10, CY - 0.12, { mat: M.concreteWall, zone: Z });
  }
  // and the two ends of the pits, for the same reason
  for (const s of [-1, 1]) {
    b.wall(s * (EX + 0.4), -TZ - 0.4, s * (EX + 0.4), TZ + 0.4, -1.10, CY - 0.12, { mat: M.concreteWall, zone: Z });
  }

  // ---- STANDING TRAINS ----------------------------------------------------
  // One rake per trench, mirrored: each side has a blocked half and an open
  // half, so neither player gets a free lane. `open` names the car index whose
  // shell is built as a ROOM instead of a solid block.
  const CARL = 9.0;
  const train = (s, xStart, cars, band, open = -1) => {
    const ZC = s * 13;
    for (let c = 0; c < cars; c++) {
      const cx = xStart + c * (CARL + 0.5) + CARL / 2;
      const enterable = c === open;
      // the shell. An enterable car gets its sides built as wall runs with door
      // gaps in them rather than one merged box, so the body is still solid to
      // look at and hollow to walk into.
      if (!enterable) {
        const body = new THREE.BoxGeometry(CARL, 3.3, 2.94);
        body.translate(cx, 0.75, ZC);
        b.static_(body, M.metal, Z);
        b.bounds.wall(cx - CARL / 2, ZC - 1.55, cx + CARL / 2, ZC + 1.55, -1.10, 2.45,
          { id: 'train' + s + c });
      } else {
        buildOpenCar(b, M, Z, cx, ZC, CARL, s);
      }
      for (const side of [-1, 1]) {
        const win = new THREE.BoxGeometry(CARL - 1.8, 1.0, 0.06);
        win.translate(cx, 1.40, ZC + side * 1.50);
        b.static_(win, emissive(enterable ? 0xd8f0e8 : 0xbfe3d8), Z);
        const bd = new THREE.BoxGeometry(CARL - 0.5, 0.40, 0.05);
        bd.translate(cx, 0.20, ZC + side * 1.52);
        b.static_(bd, emissive(band), Z);
        if (enterable) continue;                   // its doors are holes, not decals
        for (let d = 0; d < 2; d++) {
          const dr = new THREE.BoxGeometry(1.25, 2.0, 0.05);
          dr.translate(cx - CARL / 4 + d * (CARL / 2), 0.70, ZC + side * 1.53);
          b.static_(dr, emissive(0x2b3a44), Z);
        }
      }
      const bo = new THREE.BoxGeometry(2.4, 0.7, 2.5);
      bo.translate(cx, -0.75, ZC);
      b.static_(bo, M.darkMetal, Z);
    }
  };
  train(-1, -34, 4, 0x6fd44a, 2);   // north trench: west half blocked, third car open
  train(1, -2, 4, 0xe8842c);        // south trench: east half blocked

  // ---- CONCOURSE (y = 5.2) ------------------------------------------------
  // A mezzanine ring over the platform edges, open in the middle so the two
  // levels can always see each other. Nine bays a side, one per pillar below,
  // so dropping a pillar leaves a hole rather than deleting a 66 m strip.
  const NB = 9, BW = 7.4, BX0 = -NB * BW / 2;
  const bayId = (i, north) => 'bay' + (north ? 'N' : 'S') + i;
  // ESCALATOR WELLS. One bay a side is the one its escalator comes up through,
  // so that slab is laid with a hole in it. Without the hole the escalator is a
  // flight of steps buried inside a concrete slab that the fighter pops out of
  // the top of.
  const wellN = { x0: -13.0, x1: -7.0, z0: -14.5, z1: -7.0 };
  const wellS = { x0: 7.0, x1: 13.0, z0: 7.0, z1: 14.5 };
  const CZ = 6.5;                     // inner edge of the mezzanine ring
  for (let i = 0; i < NB; i++) {
    const x0 = BX0 + i * BW, x1 = x0 + BW;
    const overN = x1 > wellN.x0 && x0 < wellN.x1;
    const overS = x1 > wellS.x0 && x0 < wellS.x1;
    if (overN) b.floorHole(x0, -TZ, x1, -CZ, CY, wellN, { mat: M.concrete, id: bayId(i, true) });
    else b.floor(x0, -TZ, x1, -CZ, CY, { mat: M.concrete, id: bayId(i, true) });
    if (overS) b.floorHole(x0, CZ, x1, TZ, CY, wellS, { mat: M.concrete, id: bayId(i, false) });
    else b.floor(x0, CZ, x1, TZ, CY, { mat: M.concrete, id: bayId(i, false) });
  }
  // rail the two long sides of each well
  for (const w of [wellN, wellS]) {
    b.railing(w.x0, w.z0, w.x0, w.z1, CY, { zone: Z });
    b.railing(w.x1, w.z0, w.x1, w.z1, CY, { zone: Z });
  }
  b.floor(-PX, -CZ, -20, CZ, CY, { mat: M.concrete, id: 'concW' });
  b.floor(20, -CZ, PX, CZ, CY, { mat: M.concrete, id: 'concE' });

  for (let i = 0; i < NB; i++) {
    const x = BX0 + BW / 2 + i * BW;
    for (const z of [-CZ, CZ]) {
      // A 1.2 m structural column standing in an escalator well is not cover,
      // it is a plug: the flight is unusable with one in it.
      if (z < 0 && x > wellN.x0 - 1 && x < wellN.x1 + 1) continue;
      if (z > 0 && x > wellS.x0 - 1 && x < wellS.x1 + 1) continue;
      // STOP THE COLUMN SHORT OF THE SLAB IT CARRIES. `resolveWalls` skips a
      // wall only when `y > w.y1`, so a column topping out at exactly the
      // concourse height still collides with anyone standing on the concourse
      // beside it — an invisible 1.2 m blocker at the foot of all fourteen
      // columns, on the floor they hold up. The 0.12 m it loses is hidden
      // inside the slab.
      b.pillar(x, z, 0, CY - 0.12, 0.6, {
        square: true, mat: M.concreteWall, hp: 260, zone: Z, drops: [bayId(i, z < 0)]
      });
    }
  }
  // Only across the OPEN middle. z = ±CZ is also the seam between the bays and
  // the two concourse link slabs, and a rail run end to end along it fences
  // every bay off from the only two pieces of concourse the stairs reach.
  for (const [x0, x1] of [[-20, 20]]) {
    b.railing(x0, -CZ, x1, -CZ, CY, { zone: Z });
    b.railing(x0, CZ, x1, CZ, CY, { zone: Z });
  }
  // outer edge of the mezzanine drops to the city — parapet, not a railing
  b.wall(-PX, -TZ, PX, -TZ, CY, CY + 1.15, { mat: M.concreteWall, zone: Z });
  b.wall(-PX, TZ, PX, TZ, CY, CY + 1.15, { mat: M.concreteWall, zone: Z });

  // ---- CANOPY over the platform -------------------------------------------
  // Steel, on columns off the mezzanine, with a slot down the centreline so
  // the rain and the neon get through onto the platform.
  for (let i = 0; i < 12; i++) {
    const x = -PX + 1.5 + i * 6;
    for (const z of [-10.5, 10.5]) {
      const col = new THREE.BoxGeometry(0.26, RY - CY, 0.26);
      col.translate(x, CY + (RY - CY) / 2, z);
      b.static_(col, M.darkMetal, Z);
    }
    const beam = new THREE.BoxGeometry(0.3, 0.34, 22.5);
    beam.translate(x, RY + 0.15, 0);
    b.static_(beam, M.darkMetal, Z);
  }
  b.ceiling(-PX - 3, -TZ, PX + 3, -2.4, RY, { mat: M.darkMetal, zone: Z });
  b.ceiling(-PX - 3, 2.4, PX + 3, TZ, RY, { mat: M.darkMetal, zone: Z });
  for (let i = 0; i < 11; i++) {
    b.stripLight(-PX + 2 + i * 6.3, RY - 0.35, -6.0, 4.6, 'x', 0xdfeaff, i === 7 ? 0.35 : 0);
    b.stripLight(-PX + 2 + i * 6.3, RY - 0.35, 6.0, 4.6, 'x', 0xdfeaff, 0);
  }

  // ---- TICKET GATES across the west concourse link ------------------------
  const gateGeo = new THREE.BoxGeometry(0.5, 1.0, 1.7);
  const gates = [];
  for (let i = 0; i < 6; i++) gates.push({ x: -25.5, y: CY + 0.5, z: -4.5 + i * 1.8 });
  b.repeat(gateGeo, M.paint, gates);
  for (const g of gates) {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 1.74), emissive(0x4fd8a8));
    top.position.set(g.x, g.y + 0.56, g.z);
    b.add(top);
    b.bounds.wall(g.x - 0.3, g.z - 0.9, g.x + 0.3, g.z + 0.9, CY, CY + 1.0, { id: 'gate' + g.z });
  }

  // ---- ESCALATORS + STAIRS ------------------------------------------------
  // The escalators were once authored as LINES — x0 === x1 — so every tread was
  // a box with a zero-length side and the ramp collider had zero area. They
  // were not steep, or misplaced: they did not exist.
  //
  // Both start on the platform, climb out over their trench and surface through
  // the well cut in the bay above (see wellN / wellS), which is how a station
  // actually gets you from a platform to a concourse.
  b.escalator(-13, -4, -7.5, -14, 0, CY, 'z', { zone: Z });
  b.escalator(7.5, 4, 13, 14, 0, CY, 'z', { zone: Z });
  // The west stair used to run entirely underneath the west concourse slab: you
  // climbed five metres inside solid concrete and surfaced through the floor.
  // Both stairs now climb from the open platform and land ON a slab's edge.
  b.stairs(-12, -3, -20, 3, 0, CY, 'x', { zone: Z, mat: M.tile });
  b.railing(-12, -3.2, -20, -3.2, CY - 2.6, { zone: Z, collide: false });
  b.railing(-12, 3.2, -20, 3.2, CY - 2.6, { zone: Z, collide: false });
  b.stairs(12, -3, 20, 3, 0, CY, 'x', { zone: Z, mat: M.tile });
  b.railing(12, -3.2, 20, -3.2, CY - 2.6, { zone: Z, collide: false });
  b.railing(12, 3.2, 20, 3.2, CY - 2.6, { zone: Z, collide: false });

  // ---- EXIT STAIR to the roof walk — the highest ground -------------------
  b.stairs(24, -3, PX, 3, CY, SY, 'x', { zone: Z, mat: M.concrete });
  b.floor(PX, -7, EX, 7, SY, { mat: M.concrete, id: 'roofwalk' });
  b.railing(PX, -7, EX, -7, SY, { zone: Z });
  b.railing(PX, 7, EX, 7, SY, { zone: Z });
  b.railing(EX, -7, EX, 7, SY, { zone: Z });
  for (let i = 0; i < 4; i++) b.stripLight(PX + 2 + i * 3, SY + 3.0, 0, 2.6, 'x', 0xfff0d8);

  // ---- PLATFORM FURNITURE -------------------------------------------------
  for (const x of [-26, -16, -6, 6, 16, 26]) b.bench(x, 0, 0, Math.PI / 2, 3.0);
  b.vending(-30.5, 0, 3.4, Math.PI, 0xd8402c);
  b.vending(-30.5, 0, -3.4, Math.PI, 0x2c78d8);
  b.vending(30.5, 0, 3.4, 0, 0x3ba85a);
  b.vending(30.5, 0, -3.4, 0, 0xd8402c);
  // hanging platform signage under the canopy, readable from both directions
  for (const sx of [-22, 0, 22]) {
    b.sign(sx, RY - 1.6, 0, 4.6, 1.0, 0x1d5a3c, 0);
    b.sign(sx, RY - 1.6, 0, 4.6, 1.0, 0x1d5a3c, Math.PI);
  }
  b.sign(-13, CY + 2.4, -6.4, 5.0, 1.1, 0x1d3f6a, 0);
  b.sign(13, CY + 2.4, 6.4, 5.0, 1.1, 0x1d3f6a, Math.PI);

  // ---- THE CITY PAST THE PARAPET -----------------------------------------
  b.bigScreen(-26, 15, -27.5, 18, 10, 0, 205);
  b.bigScreen(24, 18, -27.5, 16, 9, 0, 320);
  b.bigScreen(-24, 16, 27.5, 16, 9, Math.PI, 150);
  b.bigScreen(26, 13, 27.5, 14, 8, Math.PI, 30);
  for (const [nx, nz, nry] of [[-42, -22, 0], [42, -22, 0], [-42, 22, Math.PI], [42, 22, Math.PI]]) {
    for (let i = 0; i < 3; i++) {
      b.neon(nx, 6 + i * 6.5, nz, 1.4, 5.0, [0xff4f9f, 0x4fd8ff, 0xffd84f][i], nry);
    }
  }

  // ---- RAIN + HAZE --------------------------------------------------------
  // Falls through the slot in the canopy, so the platform reads as open.
  b.particles(700, { x0: -44, x1: 44, y0: 0, y1: 28, z0: -24, z1: 24 },
    { color: 0x9fc0e8, size: 0.05, opacity: 0.30, vy: [-15, -9] });
  b.particles(120, { x0: -38, x1: 38, y0: 0.2, y1: 7, z0: -16, z1: 16 },
    { color: 0xff8fc8, size: 0.09, opacity: 0.20, vy: [0.1, 0.5] });
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(66, 18), glowMaterial(0x3c5f9f, 0.09));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(0, 0.03, 0);
  b.add(sheen);

  b.bounds.spawns = [v3(-16, 0, 0), v3(16, 0, 0), v3(0, 0, -4), v3(0, 0, 4)];
  return b;
}

// ---------------------------------------------------------------------------
// THE OPEN CAR
// ---------------------------------------------------------------------------
// A carriage you can fight inside: floor, ceiling, bench seats, grab poles, and
// two door gaps on the platform side. It is the one genuinely enclosed room on
// an otherwise wide-open map, which is what makes it worth having.
//
// The floor sits 0.50 m above the trench, not the 0.75 m a real car's deck
// would be: STEP_UP is 0.55, so 0.50 is a threshold the fighter walks over from
// the ballast in both directions. At 0.75 the doorway is a wall you can see
// through, which is worse than no doorway at all.
function buildOpenCar(b, M, Z, cx, ZC, CARL, s) {
  const FY = -0.60, ROOF = 2.30;
  const HW = 1.47;                          // body half-width
  const x0 = cx - CARL / 2, x1 = cx + CARL / 2;
  const id = 'car' + s;

  b.floor(x0, ZC - HW, x1, ZC + HW, FY, { mat: M.darkMetal, zone: Z, id });
  b.ceiling(x0, ZC - HW, x1, ZC + HW, ROOF, { mat: M.metal, zone: Z });
  // the ends
  for (const ex of [x0, x1]) {
    b.wall(ex, ZC - HW, ex, ZC + HW, FY, ROOF, { mat: M.metal, thick: 0.14, zone: Z, id: id + 'e' + ex });
  }
  // THE SIDES. The far side is solid; the platform side carries the two door
  // gaps. Each side is authored as the runs BETWEEN the openings, so the holes
  // are holes in the collision too and not just in the art.
  const doorW = 1.5;
  const d1 = cx - CARL / 4, d2 = cx + CARL / 4;
  const far = ZC - s * HW, near = ZC + s * HW;
  b.wall(x0, far, x1, far, FY, ROOF, { mat: M.metal, thick: 0.14, zone: Z, id: id + 'f' });
  for (const [a, c] of [[x0, d1 - doorW / 2], [d1 + doorW / 2, d2 - doorW / 2], [d2 + doorW / 2, x1]]) {
    if (c - a < 0.12) continue;
    b.wall(a, near, c, near, FY, ROOF, { mat: M.metal, thick: 0.14, zone: Z, id: id + 'n' + Math.round(a) });
  }
  // the door head, so the openings read as doors rather than as missing wall
  for (const d of [d1, d2]) {
    const g = new THREE.BoxGeometry(doorW, 0.30, 0.16);
    g.translate(d, ROOF - 0.15, near);
    b.static_(g, M.darkMetal, Z);
  }
  // bench seats down both sides, and grab poles
  for (const side of [-1, 1]) {
    const g = new THREE.BoxGeometry(CARL - 1.2, 0.12, 0.62);
    g.translate(cx, FY + 0.44, ZC + side * (HW - 0.34));
    b.static_(g, emissive(0x2a4a6a), Z);
    const back = new THREE.BoxGeometry(CARL - 1.2, 0.70, 0.10);
    back.translate(cx, FY + 0.80, ZC + side * (HW - 0.06));
    b.static_(back, M.paint, Z);
  }
  for (let i = 0; i < 4; i++) {
    const g = new THREE.CylinderGeometry(0.05, 0.05, ROOF - FY, 6);
    g.translate(cx - CARL / 2 + 1.5 + i * (CARL - 3) / 3, (FY + ROOF) / 2, ZC);
    b.static_(g, M.metal, Z);
  }
  b.stripLight(cx - 2, ROOF - 0.18, ZC, 2.6, 'x', 0xeaf4ff);
  b.stripLight(cx + 2, ROOF - 0.18, ZC, 2.6, 'x', 0xeaf4ff);
}
