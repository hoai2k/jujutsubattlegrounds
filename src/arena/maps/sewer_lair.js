// THE SEWER — Mahito's hideout. Where he kept Junpei, and where the
// transfigured humans were stacked in the dark waiting to be used.
//
// REFERENCE NOTE (researched): the Victorian-era covered reservoir — a brick
// CISTERN. A circular chamber under a shallow brick dome carried on a ring of
// squat columns, a round basin of black water sunk into the middle of it with
// the floor stepping down to the waterline in concentric rings, radial bores
// running out of it at the cardinal points, and a stair turret in the wall.
// Damp brick, green light, standing water.
//
// WHY THIS SHAPE. The previous version was a square room with four square
// tunnels and a straight channel down the middle, which is what every other map
// in this set is: an arrangement of boxes. A cistern is round, and being round
// changes how the fight works rather than only how it looks — there is no
// corner to be cornered in, every sightline across the middle is the same
// length, the drop to the water is a step down anywhere on the rim instead of
// at four marked staircases, and the columns break the room into a ring of
// bays that you circle rather than a grid you cross.
//
// It is still the lowest-ceilinged map here and still the one that punishes
// zoners: the dome springs at 5.2 and the columns are close enough together
// that nothing crosses the room without passing one.
//
// LAYOUT (76 x 70 m):
//   y = -4.20  THE SUMP    a round pit off the west bore, two and a half metres
//                          under the basin. The lowest ground in the game.
//   y = -1.40  THE BASIN   a disc of black water 18 m across in the middle of
//                          the chamber. Walkable, and the low ground.
//   y = -0.93  \ THE STEPS three concentric rings between the basin and the
//   y = -0.47  /           ring floor. Every one is a stride, so the water is
//                          reachable from anywhere on the rim.
//   y =  0.00  RING FLOOR  the walking level: an annulus round the basin, with
//                          the column ring standing on it.
//   y =  4.60  GALLERY     a brick balcony ringing the chamber, off two spiral
//                          stairs that come up through wells cut in it.
//   VERTICAL               two helical stairs, and the steps into the basin.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'sewer_lair',
  name: 'THE SEWER',
  jp: '下水道',
  desc: "Mahito's cistern. A brick dome, black water, and a ceiling too close overhead.",
  // groundY is the BASIN floor: the ring, the steps and the gallery are all
  // authored on top of it, so anywhere unpaved is water rather than a shelf of
  // nothing at ring level.
  extent: { minX: -38, maxX: 38, minZ: -35, maxZ: 35, groundY: -1.4 },
  background: 0x060c0a,
  fog: { color: 0x0a1412, near: 18, far: 78 },
  grade: { vignette: 0.70, tint: [0.88, 1.06, 0.96], lift: 0.006, sat: 0.74 },
  lights: {
    key: { color: 0xcfeedd, intensity: 1.35, pos: [2, 16, 4] },
    rim: { color: 0x5fa88e, intensity: 0.85, pos: [-9, 6, -9] },
    hemi: { sky: 0x40685a, ground: 0x5a4a3c, intensity: 0.85 }
  },
  previewCam: { pos: [0, 2.5, 21], look: [0, -0.9, -3] },
  shadowScale: 0.72,
  shrineScale: 0.78,      // the most enclosed map in the set — the shrine has to be too
  size: '76 × 70 m · domed cistern, basin, column ring, gallery'
};

const R_CHAMBER = 23;     // inside face of the brick wall
// THE BASIN IS THE FLOOR OF THIS ROOM and it was 18 m across in a 46 m chamber,
// with a ring of columns closed in around it: the largest circle that fitted
// anywhere in the lair was 17 m. The water is 26 m across now and the columns
// stand four metres further out, against the gallery.
const R_BASIN = 12;       // the water
const R_COL = 16.6;       // the column ring
const R_GALL_IN = 17.6;   // gallery inner edge
const CY = -1.4;          // basin floor
const LY = 0.0;           // ring floor
const GY = 4.6;           // gallery
const SPRING = 5.2;       // where the dome springs
const SUMPY = -4.2;
const BORE = 5.5;         // half-width of a radial bore

// The two stair turrets, on the diagonals so neither stands in a bore mouth.
const TURRET = [
  { x: Math.sin(Math.PI * 0.25) * 19.5, z: Math.cos(Math.PI * 0.25) * 19.5 },
  { x: Math.sin(Math.PI * 1.25) * 19.5, z: Math.cos(Math.PI * 1.25) * 19.5 }
];

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const CH = 'chamber';
  b.zone(CH, { x0: -38, x1: 38, z0: -35, z1: 35, y0: -6, y1: 12 }, false);

  // ---- THIS MAP'S OWN BRICK ----------------------------------------------
  // The set shared fifteen grey materials and every location was made of them.
  // A cistern is BRICK: warm red-brown where it is dry, black-green where the
  // water has been up it, and the difference between the two is most of what
  // says how deep this room floods.
  const brick = b.tint('rust', 0x9a6a52, { rim: 0.24 });
  // the dome is seen from inside, so it needs the faces that point away from us
  const brickIn = b.tint('rust', 0xb08268, { rim: 0.28, side: 2 });
  const wetBrick = b.tint('rust', 0x4e6656, { rim: 0.36 });
  const stone = b.tint('concrete', 0x8a938a);
  const wetStone = b.tint('concrete', 0x5e6f62);
  const iron = b.tint('darkMetal', 0x2b3134, { rim: 0.45 });

  b.sky(0x03060a, 0x061010, 0x0c1a16, 240);
  b.groundPlane(0x05100c, 160, -10);

  // ---- THE BASIN AND THE STEPS DOWN TO IT --------------------------------
  // Concentric rings, each one stride high, so the waterline is reachable from
  // anywhere on the rim rather than at four marked staircases. This is the
  // change that makes the room round in PLAY and not only in plan.
  b.roundDeck(0, 0, R_BASIN, CY, { mat: wetStone, thick: 0.5, zone: CH });
  const STEP = [
    [R_BASIN, R_BASIN + 1.6, -0.93],
    [R_BASIN + 1.6, R_BASIN + 3.2, -0.47]
  ];
  for (const [ri, ro, sy] of STEP) {
    b.roundDeck(0, 0, ro, sy, { rIn: ri, mat: wetBrick, thick: 0.62, zone: CH });
  }

  // the water itself, and the sheen of it on the lowest step
  b.water(0, 0, 0, 0, CY + 0.34, {
    radius: R_BASIN - 0.35,
    shallow: 0x4f8f78, deep: 0x0a1c18, opacity: 0.7, caustic: 0.22
  });

  // ---- THE RING FLOOR ----------------------------------------------------
  // An annulus from the top step out to the chamber wall, with a well cut in it
  // for each stair turret so the helices are not buried under the slab they
  // climb from.
  // The well for the sump is cut here as well as declared below, because a slab
  // is only a hole if the hole is in the slab.
  // Pulled in to r = 17.5 and cut to 4.4 m. At 18 m out and 5.2 across, the far
  // side of its rim landed past the ring floor's own outer edge — a lip of well
  // wall standing in the gap between the floor and the chamber wall.
  const SUMP_A = Math.PI * 0.75;
  const SUMP = { x: Math.sin(SUMP_A) * 19.0, z: Math.cos(SUMP_A) * 19.0, r: 3.2 };
  b.roundDeck(0, 0, R_CHAMBER, LY, {
    rIn: R_BASIN + 3.2, mat: brick, thick: 0.4, zone: CH, id: 'ring',
    holes: [{ x: SUMP.x, z: SUMP.z, r: SUMP.r }]
  });

  // ---- THE COLUMN RING ---------------------------------------------------
  // Sixteen squat brick columns carrying the dome. Close enough together that
  // nothing crosses the chamber without passing one, which is the whole reason
  // an open round room still has cover in it.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    const px = Math.sin(a) * R_COL, pz = Math.cos(a) * R_COL;
    b.pillar(px, pz, LY, SPRING - LY - 0.1, 0.85, {
      mat: brick, hp: 260, zone: CH, id: 'col' + i
    });
    // the impost each arch springs from
    const cap = new THREE.CylinderGeometry(1.15, 0.95, 0.45, 12);
    cap.translate(px, SPRING - 0.2, pz);
    b.static_(cap, stone, CH);
  }
  // the arcade: an arched hoop tying the column heads together
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2 + Math.PI / 16;
    const a1 = ((i + 1) / 16) * Math.PI * 2 + Math.PI / 16;
    for (let k = 0; k < 5; k++) {
      const t0 = k / 5, t1 = (k + 1) / 5;
      const am = a0 + (a1 - a0) * (t0 + t1) / 2;
      const lift = Math.sin(((t0 + t1) / 2) * Math.PI) * 0.85;
      const px = Math.sin(am) * R_COL, pz = Math.cos(am) * R_COL;
      const g = new THREE.BoxGeometry(2 * R_COL * Math.sin((a1 - a0) / 10) * 1.2, 0.55, 0.9);
      g.rotateY(am);
      g.translate(px, SPRING + 0.25 + lift, pz);
      b.static_(g, brick, CH);
    }
  }

  // ---- THE CHAMBER WALL AND ITS FOUR BORES -------------------------------
  // The wall is an arc with a gap at each cardinal bearing, and each gap is a
  // tunnel mouth. Built as four arcs rather than as one, so the openings are
  // openings in the collision too.
  const MOUTH = Math.asin(BORE / R_CHAMBER);      // half-angle a bore subtends
  for (let q = 0; q < 4; q++) {
    const a0 = q * Math.PI / 2 + MOUTH;
    const a1 = (q + 1) * Math.PI / 2 - MOUTH;
    b.arcWall(0, 0, R_CHAMBER + 0.5, a0, a1, CY, SPRING + 2.4,
      { mat: brick, thick: 1.0, zone: CH, id: 'wall' + q });
  }
  // the arch over each mouth, so a bore reads as a bore and not as a slot
  for (let q = 0; q < 4; q++) {
    const a = q * Math.PI / 2;
    b.arcWall(0, 0, R_CHAMBER + 0.5, a - MOUTH, a + MOUTH, 4.6, SPRING + 2.4,
      { mat: brick, thick: 1.0, zone: CH, id: 'arch' + q });
  }

  // ---- THE DOME ----------------------------------------------------------
  // Shallow, brick, with an oculus over the water. It springs at 5.2 — low, and
  // that is the point of this map.
  b.dome(0, 0, SPRING, R_CHAMBER + 1.5, { mat: brickIn, rise: 6.2, oculus: 0.14, segs: 40, rings: 16 });
  {
    // the oculus ring, and the shaft of daylight that comes down it onto the
    // basin: the one clean colour in a map lit entirely in sick green
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.34, 8, 26), stone);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, SPRING + 5.9, 0);
    b.add(ring);
    b.godRay(0, SPRING + 5.9, 0, 3.0, SPRING + 5.9 - CY, 0xd8f0c0,
      { opacity: 0.11, taper: 0.34, lean: [2.6, -3.2], poolGain: 1.2, range: 70 });
  }

  // ---- THE FOUR BORES ----------------------------------------------------
  // Each runs out from a mouth on a cardinal axis: a barrel-vaulted corridor
  // with a channel of water down the middle of it and a ledge either side.
  const bore = (axis, sign, len) => {
    const zn = 'bore' + axis + sign;
    const along = axis === 'x';
    const a0 = R_CHAMBER - 1, a1 = R_CHAMBER + len;
    const box = along
      ? { x0: sign > 0 ? a0 : -a1, x1: sign > 0 ? a1 : -a0, z0: -BORE, z1: BORE }
      : { x0: -BORE, x1: BORE, z0: sign > 0 ? a0 : -a1, z1: sign > 0 ? a1 : -a0 };
    // NOT an interior zone: a bore is visible through an open mouth from
    // anywhere in the chamber, and culled it becomes a hole in the wall.
    b.zone(zn, { ...box, y0: -3, y1: 8 }, false);
    const CHW = 2.2;
    if (along) {
      b.floor(box.x0, -BORE + 0.4, box.x1, -CHW, LY, { mat: brick, zone: zn });
      b.floor(box.x0, CHW, box.x1, BORE - 0.4, LY, { mat: brick, zone: zn });
      b.floor(box.x0, -CHW, box.x1, CHW, CY, { mat: wetStone, zone: zn });
      b.wall(box.x0, -BORE, box.x1, -BORE, CY, 5.0, { mat: brick, zone: zn });
      b.wall(box.x0, BORE, box.x1, BORE, CY, 5.0, { mat: brick, zone: zn });
      b.vault(box.x0, -BORE, box.x1, BORE, 4.4, 2.0, { mat: brick, axis: 'x', zone: zn, segs: 9 });
      b.wall(sign > 0 ? a1 : -a1, -BORE - 0.3, sign > 0 ? a1 : -a1, BORE + 0.3, CY, 7.0,
        { mat: brick, zone: zn });
      b.water(box.x0 + 0.5, -CHW + 0.3, box.x1 - 0.5, CHW - 0.3, CY + 0.3,
        { shallow: 0x4f8f78, deep: 0x0a1c18, opacity: 0.72, caustic: 0.2 });
    } else {
      b.floor(-BORE + 0.4, box.z0, -CHW, box.z1, LY, { mat: brick, zone: zn });
      b.floor(CHW, box.z0, BORE - 0.4, box.z1, LY, { mat: brick, zone: zn });
      b.floor(-CHW, box.z0, CHW, box.z1, CY, { mat: wetStone, zone: zn });
      b.wall(-BORE, box.z0, -BORE, box.z1, CY, 5.0, { mat: brick, zone: zn });
      b.wall(BORE, box.z0, BORE, box.z1, CY, 5.0, { mat: brick, zone: zn });
      b.vault(-BORE, box.z0, BORE, box.z1, 4.4, 2.0, { mat: brick, axis: 'z', zone: zn, segs: 9 });
      b.wall(-BORE - 0.3, sign > 0 ? a1 : -a1, BORE + 0.3, sign > 0 ? a1 : -a1, CY, 7.0,
        { mat: brick, zone: zn });
      b.water(-CHW + 0.3, box.z0 + 0.5, CHW - 0.3, box.z1 - 0.5, CY + 0.3,
        { shallow: 0x4f8f78, deep: 0x0a1c18, opacity: 0.72, caustic: 0.2 });
    }
    // THE STEPS DOWN INTO THE CHANNEL, and which side of the lip they sit on is
    // the whole of it. Built running outward onto the LEDGE they were buried
    // under it — the ledge is a continuous slab the length of the bore, so a
    // flight inside its footprint is a flight under a floor. They descend into
    // the CHANNEL instead: the channel's own floor is 1.4 m below them, so
    // there is nothing over the treads and the flight lands on real water-level
    // floor at the bottom.
    const m = (box.x0 + box.x1) / 2, mz = (box.z0 + box.z1) / 2;
    for (const s of [-1, 1]) {
      if (along) b.stairs(m - 1.4, s * 0.7, m + 1.4, s * (CHW + 0.05), CY, LY, 'z', { mat: wetBrick, zone: zn });
      else b.stairs(s * 0.7, mz - 1.4, s * (CHW + 0.05), mz + 1.4, CY, LY, 'x', { mat: wetBrick, zone: zn });
    }
    for (let i = 0; i < Math.floor(len / 4); i++) {
      const d = a0 + 2.5 + i * 4;
      b.stripLight(along ? sign * d : 0, 4.2, along ? 0 : sign * d, 1.6,
        along ? 'z' : 'x', 0x6fe0a8, i === 1 ? 0.55 : 0);
    }
  };
  bore('x', -1, 13);
  bore('x', 1, 13);
  bore('z', -1, 11);
  bore('z', 1, 11);

  // ---- THE GALLERY -------------------------------------------------------
  // A brick balcony ringing the chamber at 4.6, laid with a WELL over each
  // stair turret so the helix comes up through it rather than into its
  // underside.
  b.roundDeck(0, 0, R_CHAMBER + 0.4, GY, {
    rIn: R_GALL_IN, mat: brick, thick: 0.4, zone: CH, id: 'gallery',
    holes: TURRET.map(t => ({ x: t.x, z: t.z, r: 3.2 }))
  });
  // its inner rail, gapped at the four bore mouths so the gallery can see down
  for (let q = 0; q < 4; q++) {
    const a0 = q * Math.PI / 2 + 0.16, a1 = (q + 1) * Math.PI / 2 - 0.16;
    b.arcWall(0, 0, R_GALL_IN + 0.1, a0, a1, GY + 0.45, GY + 1.05,
      { mat: iron, thick: 0.12, segs: 12, zone: CH, id: 'grail' + q });
  }
  // corbels carrying it off the wall
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const px = Math.sin(a) * (R_CHAMBER - 2.4), pz = Math.cos(a) * (R_CHAMBER - 2.4);
    const g = new THREE.BoxGeometry(0.5, 0.5, 4.4);
    g.rotateY(a);
    g.translate(px, GY - 0.6, pz);
    b.static_(g, stone, CH);
  }

  // ---- THE TWO STAIR TURRETS ---------------------------------------------
  // Helices, on the diagonals so neither stands in a bore mouth. Each climbs
  // from the ring floor and surfaces through its own well in the gallery.
  TURRET.forEach((t, i) => {
    // EXACTLY ONE TURN, so the top tread comes back round to the bearing it
    // started on and the landing that carries it out to the gallery can be laid
    // in one known place. A helix that stops at 1.15 turns finishes wherever
    // the arithmetic left it, which is how the first version of this reached
    // the gallery's well and nothing else — the validator called the whole
    // balcony unreachable and it was exactly that.
    const a = Math.atan2(t.x, t.z);          // outward, away from the chamber
    b.spiralStair(t.x, t.z, LY, GY, {
      rIn: 0.55, rOut: 3.0, rise: 0.23, turns: 1, dir: i ? -1 : 1,
      a0: a, mat: stone, newelMat: iron, zone: CH, id: 'helix' + i
    });
    // THE LANDING. The well cut for the helix is 3.2 m across and the helix
    // itself only reaches 3.0, so without this the top tread and the gallery
    // are 20 cm apart over a 4.6 m drop.
    const lx = t.x + Math.sin(a) * 2.9, lz = t.z + Math.cos(a) * 2.9;
    b.floor(lx - 1.5, lz - 1.5, lx + 1.5, lz + 1.5, GY, { mat: stone, zone: CH, id: 'landing' + i });
    // NO SHELL AROUND IT. The first version wrapped each helix in a brick
    // turret with one opening, and the opening faced the chamber wall — 50 cm
    // of gap between the turret's skin and the wall's inner face, which is to
    // say no gap. Both stairs, and therefore the whole gallery, were sealed
    // off, and the reachability pass said so. A helix standing free in a round
    // room reads better than a turret anyway: you can see the climb from
    // anywhere on the floor, and so can whoever is chasing you up it.
    b.hangingLamp(t.x, GY + 1.0, t.z, 1.0, 0x8fe8b8, { amp: 0.09, range: 40 });
  });

  // ---- THE SUMP ----------------------------------------------------------
  // A WELL cut through the ring floor, with the descent spiralling down its
  // wall onto a small round floor at the bottom. It replaces the rectangular
  // pit off the end of a tunnel that this map used to have, and it is the one
  // place in the game with walls the whole way round and a single way out.
  //
  // Cut at a bearing with nothing else on it: the four bores are on the
  // cardinals and the two stair turrets are on two of the diagonals, which
  // leaves this one.
  {
    const SA = SUMP_A, SX = SUMP.x, SZ = SUMP.z, SR = SUMP.r;
    // The fallback floor has to come down under the whole well or the ring
    // above pages straight over it — the same trap every sunken room on this
    // project has fallen into at least once.
    b.pit(SX - SR, SZ - SR, SX + SR, SZ + SR, SUMPY);
    b.roundDeck(SX, SZ, 2.3, SUMPY, { mat: wetStone, thick: 0.5, zone: CH, id: 'sumpfloor' });
    b.spiralStair(SX, SZ, LY, SUMPY, {
      rIn: 2.1, rOut: 4.2, rise: 0.23, turns: 1, dir: -1, a0: SA + Math.PI,
      mat: wetStone, newel: false, zone: CH, id: 'sumpstair'
    });
    b.arcWall(SX, SZ, SR + 0.3, 0, Math.PI * 2, SUMPY - 0.6, LY - 0.12,
      { mat: wetBrick, thick: 0.6, segs: 20, zone: CH, id: 'sumpwall' });
    b.water(SX, SZ, SX, SZ, SUMPY + 0.5,
      { radius: 2.2, shallow: 0x3f7a66, deep: 0x061412, opacity: 0.78, caustic: 0.3 });
    b.beacon(SX, SUMPY + 3.0, SZ, 0xd8402c, { reach: 3.4, rate: 0.8 });
    b.mist(SX, SZ, SX, SZ, SUMPY + 0.55, 0x5f9880, { radius: 2.3, opacity: 0.40, scale: 5 });
    b.sigil(SX, SUMPY + 0.05, SZ, 2.0, 0xd85a9f, { rings: 2, spokes: 6, sides: 3, opacity: 0.32, spin: 0.16 });
    // the pump that gives the well a reason to exist, and its rising main
    const pipe = new THREE.CylinderGeometry(0.34, 0.34, SPRING - SUMPY + 2, 8);
    pipe.translate(SX + 1.2, (SUMPY + SPRING) / 2 + 1, SZ + 1.2);
    b.static_(pipe, M.metal);
  }

  // ---- WHAT LIVES HERE ---------------------------------------------------
  b.sigil(0, CY + 0.05, 0, 8.0, 0x9f5ad8, { rings: 3, spokes: 12, sides: 3, opacity: 0.26, spin: -0.06 });
  b.mist(0, 0, 0, 0, CY + 0.4, 0x6fa890, { radius: R_BASIN - 0.3, opacity: 0.30, scale: 9 });

  // outfalls pouring into the basin from two of the bore mouths
  for (const [ox, oz, ry] of [[R_CHAMBER - 1.2, 0, Math.PI / 2], [0, -(R_CHAMBER - 1.2), 0]]) {
    b.waterfall(ox, 3.2, oz, 1.6, 4.4, { ry, color: 0x8fd8b8, opacity: 0.42, speed: 2.4 });
  }
  b.steamVent(4.5, CY + 0.4, 2, { height: 3.2, period: 3.6, opacity: 0.22, color: 0xbfe8cc });
  b.steamVent(-5, CY + 0.4, -3, { height: 2.8, period: 4.4, opacity: 0.22, color: 0xbfe8cc });

  // cable slung under the dome, and the arcing where it has parted
  b.cable(v3(-R_COL, SPRING + 3.2, 0), v3(R_COL, SPRING + 2.4, 4), { sag: 2.2, r: 0.05, mat: iron });
  b.cable(v3(0, SPRING + 2.6, -R_COL), v3(4, SPRING + 3.4, R_COL), { sag: 2.0, r: 0.04, mat: iron });
  b.sparker(R_COL - 1, 3.2, 3, { color: 0xbfe4ff });
  b.sparker(-R_COL + 2, GY + 1.4, -4, { color: 0xbfe4ff });

  // his stock, in the bays between the columns
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5;
    const px = Math.sin(a) * 19.5, pz = Math.cos(a) * 19.5;
    if (TURRET.some(t => Math.hypot(t.x - px, t.z - pz) < 6)) continue;
    if (Math.hypot(SUMP.x - px, SUMP.z - pz) < 7.5) continue;
    b.crates(px, LY, pz, { count: 2 + (i % 2) });
    b.drum(px + Math.cos(a) * 1.6, LY, pz - Math.sin(a) * 1.6,
      { color: 0x4a6a4c, markColor: 0xd85a9f });
    b.drum(px + Math.cos(a) * 2.7, LY, pz - Math.sin(a) * 2.7,
      { color: 0x4a6a4c, markColor: 0xd85a9f });
  }
  b.lockerBank(0, LY, 20.5, 0, 5);
  b.lockerBank(0, LY, -20.5, Math.PI, 5);

  // brick lamps in the bays, and the flickering strip over the water
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    b.stripLight(Math.sin(a) * 12.5, 4.4, Math.cos(a) * 12.5, 2.2,
      Math.abs(Math.sin(a)) > 0.7 ? 'z' : 'x', 0x8fe8b8, i === 3 ? 0.7 : 0);
  }

  // ---- AMBIENT ------------------------------------------------------------
  b.particles(280, { x0: -22, x1: 22, y0: -1.2, y1: 9.0, z0: -22, z1: 22 },
    { color: 0x9fe0c0, size: 0.05, opacity: 0.42, vy: [-5.0, -2.2] });
  b.particles(150, { x0: -20, x1: 20, y0: -1.0, y1: 3.2, z0: -20, z1: 20 },
    { color: 0x6fb090, size: 0.11, opacity: 0.16, vy: [0.05, 0.3] });

  // ON THE RING FLOOR, on the bearings that have nothing on them. The four
  // bores take the cardinals, the two helices take two diagonals and the sump
  // well takes a third — so the spawns sit on the half-diagonals between them,
  // out past the column ring where there is room to open on.
  b.bounds.spawns = [0.125, 0.625, 1.125, 1.625].map(k => {
    const a = Math.PI * k;
    return v3(Math.sin(a) * 19, LY, Math.cos(a) * 19);
  });
  return b;
}
