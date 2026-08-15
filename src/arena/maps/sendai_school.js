// SENDAI COLONY — SCHOOL. The Culling Game site where Megumi fought Reggie
// Star, and the map he was specifically requested to have.
//
// REFERENCE NOTE (researched): the fight runs through a school gymnasium and
// then drops through the floor into the indoor swimming pool underneath it,
// finishing back on the gym boards. Those two rooms are therefore built as
// CONNECTED interior spaces sharing a wall, with the pool one level down —
// the vertical relationship between them is the map's identity, so the gym
// floor over the pool is a destructible slab you can genuinely put someone
// through.
//
// LAYOUT (104 x 88 m):
//   y = -4.20  POOL HALL   directly beneath the gym's west half. Water reacts.
//   y =  0.00  GROUND      corridor spine running east-west, classrooms off it
//   y =  0.00  GYMNASIUM   full basketball court, bleachers, hoops
//   y =  0.00  THE GROUND  the school's own sports field, south of the gym:
//                          open ground, a running track, a backstop and the
//                          perimeter wall. The map used to end at the gym's
//                          south wall with a strip of unwalkable grass past it.
//   y =  4.60  UPPER FLOOR classroom balcony + gym catwalk + stair landing
//   y =  9.20  ROOF        via the stairwell; open sky, the highest ground
//   CENTRAL SPACE          the gym. FLANKS: the corridor, the pool deck, the
//                          field.
//   VERTICAL               stairwell (2 flights + a real landing), gym catwalk
//                          flights, and the hole you make in the gym floor.
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'sendai_school',
  name: 'SENDAI COLONY SCHOOL',
  jp: '仙台結界 学校',
  desc: 'Gymnasium over the pool hall. Break the floor and the fight goes swimming.',
  extent: { minX: -52, maxX: 52, minZ: -44, maxZ: 44 },
  // TERRAIN: school GROUNDS outside, a building inside. Everything the fight
  // actually happens on indoors — gym boards, catwalk plate, pool tile,
  // corridor tile, classroom boards, the roof — is artificial; the field and
  // the grounds around the building are not. Hanami is weak inside and strong
  // the moment the fight goes out of the south doors.
  terrain: NATURAL,
  background: 0x1a2030,
  fog: { color: 0x1e2534, near: 58, far: 180 },
  grade: { vignette: 0.54, tint: [0.98, 1.0, 1.04], lift: 0, sat: 0.92 },
  lights: {
    key: { color: 0xf0f4ff, intensity: 1.2, pos: [8, 18, 6] },
    rim: { color: 0x7fa0d0, intensity: 0.72, pos: [-10, 12, -8] },
    hemi: { sky: 0x9fb0d0, ground: 0x3a3a3a, intensity: 0.5 }
  },
  // stage-select beauty shot: hand-picked so the preview never ends up
  // inside a wall, above a ceiling or buried in the treeline
  previewCam: { pos: [17.5, 9.5, 13.0], look: [-8, 1.6, -3] },
  shadowScale: 0.9,
  shrineScale: 0.93,      // four levels of interior — running works vertically here as well as flat
  size: '104 × 88 m · 4 levels incl. sunken pool hall + sports field'
};

// The gym shell, named once. Every slab, wall, catwalk and light in the hall is
// measured off these, and the pool hall underneath has to line up with them.
const GX = 22, GZ_ = 16;        // gym half-extents (interior)
const WALLX = GX + 0.4, WALLZ = GZ_ + 0.4;

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  b.sky(0x2c3a58, 0x4a5878, 0x7f8ea8, 320);
  b.groundPlane(0x1f2a1f, 260);

  // =========================================================================
  // GYMNASIUM — the central engagement space (44 x 32, boards)
  // =========================================================================
  const GZ = 'gym';
  b.zone(GZ, { x0: -GX, x1: GX, z0: -GZ_, z1: GZ_, y0: -1, y1: 13 });
  // The floor is built in slabs so a section over the pool can be destroyed
  // and dropped. West half sits over the pool hall.
  // STAIRWELL. One slab is laid with a hole in it, and that hole is the only
  // way down to the pool hall. The map used to try to reach the pool with a
  // flight that was outside the pool deck entirely and buried under the gym
  // floor on the way — so the signature room could be seen through the water
  // and never entered on foot.
  const WELL = { x0: -20.5, z0: 6, x1: -15, z1: 13.5 };
  const slabIds = [];
  const NI = 5, NJ = 4, SW = (GX * 2 - 2) / NI, SD = (GZ_ * 2 - 2) / NJ;
  for (let i = 0; i < NI; i++) {
    for (let j = 0; j < NJ; j++) {
      const x0 = -GX + 1 + i * SW, z0 = -GZ_ + 1 + j * SD;
      const id = 'gymslab' + i + j;
      const well = x0 < WELL.x1 && x0 + SW > WELL.x0 && z0 < WELL.z1 && z0 + SD > WELL.z0;
      // the stairwell slab is the one bit of gym floor that does NOT drop into
      // the pool: it is the route, and a route you can delete is not one
      slabIds.push({ id, x0, z0, x1: x0 + SW, z1: z0 + SD, overPool: x0 < -1 && !well });
      if (well) b.floorHole(x0, z0, x0 + SW, z0 + SD, 0, WELL, { mat: M.wood, id });
      else b.floor(x0, z0, x0 + SW, z0 + SD, 0, { mat: M.wood, id });
    }
  }
  // The slab grid stops 1 m short of the shell on every side, and that slot
  // used to be nothing at all. It went unnoticed while the ground plane paved
  // the whole map at y = 0; with the pool hall a real pit underneath (see
  // `b.pit`) the west slot became a hole you fall down.
  b.floor(-WALLX, -WALLZ, -GX + 1, WALLZ, 0, { mat: M.wood });
  b.floor(GX - 1, -WALLZ, WALLX, WALLZ, 0, { mat: M.wood });
  b.floor(-GX + 1, -WALLZ, GX - 1, -GZ_ + 1, 0, { mat: M.wood });
  b.floor(-GX + 1, GZ_ - 1, GX - 1, WALLZ, 0, { mat: M.wood });
  // court lines
  const line = emissive(0xe8b04a);
  const courtLine = (x0, z0, x1, z1) => {
    const g = new THREE.BoxGeometry(Math.max(0.1, Math.abs(x1 - x0)), 0.02, Math.max(0.1, Math.abs(z1 - z0)));
    g.translate((x0 + x1) / 2, 0.012, (z0 + z1) / 2);
    b.static_(g, line, GZ);
  };
  courtLine(-18, -13, 18, -13); courtLine(-18, 13, 18, 13);
  courtLine(-18, -13, -18, 13); courtLine(18, -13, 18, 13);
  courtLine(0, -13, 0, 13);
  {
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.16, 28), line);
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012;
    b.add(ring);
  }
  // hoops at both ends
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.6, 8), M.darkMetal);
    post.position.set(s * 20.4, 1.8, 0);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.05, 1.8), M.glass);
    board.position.set(s * 19.3, 3.1, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 6, 18), emissive(0xd8622c));
    rim.rotation.x = Math.PI / 2;
    rim.position.set(s * 18.8, 3.05, 0);
    g.add(post, board, rim);
    b.add(g);
    b.bounds.wall(s * 20.4 - 0.3, -0.3, s * 20.4 + 0.3, 0.3, 0, 3.6, { id: 'hoop' + s });
    b.breakable(g, { hp: 45, kind: 'metal', center: v3(s * 19.6, 2.4, 0), radius: 1.4, height: 3.6, baseY: 0, colliderIds: ['hoop' + s] });
  }
  // bleachers along the north wall — a raised flank inside the gym
  for (let i = 0; i < 6; i++) {
    const y = 0.42 * (i + 1);
    b.floor(-19, -GZ_ + i * 0.9, 19, -GZ_ + (i + 1) * 0.9, y, { mat: M.wood });
  }
  // ---- gym shell ---------------------------------------------------------
  // THE CEILING SPANS THE WALLS, not the slab grid. It used to be authored to
  // the interior dimension while the walls stood 0.4 m outside it, which left a
  // 0.4 m slot of open sky running right round the top of the hall. A magenta
  // background render is the only way that shows up: lit, it reads as a bright
  // architectural band, which is exactly what a clerestory would look like.
  b.ceiling(-WALLX, -WALLZ, WALLX, WALLZ, 12, { mat: M.paint, zone: GZ });
  // ...and the side walls run the FULL depth, out to the north and south faces.
  // Stopping them at the interior depth leaves a 0.4 m vertical slot at each of
  // the four corners, which is the same leak one axis over.
  b.wall(-WALLX, -WALLZ, -WALLX, WALLZ, 0, 12, { mat: M.paint, zone: GZ });
  b.wall(WALLX, -WALLZ, WALLX, WALLZ, 0, 12, { mat: M.paint, zone: GZ });
  // SOUTH FACE: solid to the corners, a band of high windows, a doorway into
  // the corridor, and a closing course above all of it. Every piece of this
  // face has to be accounted for or the gap becomes a hole in the building.
  b.windows(-19, WALLZ, -5, WALLZ, 5.6, 9.4, { zone: GZ, hp: 22, id: 'gymwin1' });
  b.windows(5, WALLZ, 19, WALLZ, 5.6, 9.4, { zone: GZ, hp: 22, id: 'gymwin2' });
  // Each run reaches WALLX, not GX: the side walls stand 0.4 m outside the
  // interior, so a face that stops at the interior dimension leaves a slot at
  // the corner exactly as wide as that offset.
  for (const [a, c] of [[-WALLX, -5], [5, WALLX]]) {
    b.wall(a, WALLZ, c, WALLZ, 0, 5.6, { mat: M.paint, zone: GZ });     // below the glass
    b.wall(a, WALLZ, c, WALLZ, 9.4, 12, { mat: M.paint, zone: GZ });    // above it
  }
  for (const [a, c] of [[-WALLX, -19], [19, WALLX]]) {
    b.wall(a, WALLZ, c, WALLZ, 5.6, 9.4, { mat: M.paint, zone: GZ });   // beside it
  }
  // the doorway into the corridor is the 10 m gap at 0..4.2; above it is wall
  b.wall(-5, WALLZ, 5, WALLZ, 4.2, 12, { mat: M.paint, zone: GZ });
  // NORTH FACE: the same treatment, with the doors out onto the field
  b.wall(-WALLX, -WALLZ, -6, -WALLZ, 0, 12, { mat: M.paint, zone: GZ });
  b.wall(6, -WALLZ, WALLX, -WALLZ, 0, 12, { mat: M.paint, zone: GZ });
  b.wall(-6, -WALLZ, 6, -WALLZ, 4.2, 12, { mat: M.paint, zone: GZ });

  // gym catwalk: a maintenance walkway ringing the hall at 4.6
  const CY = 4.6;
  // Each catwalk stops short at one end and the flight up to it occupies the
  // rest of the run. Both flights used to sit INSIDE the catwalk's own
  // footprint — you climbed 4.6 m through the underside of the plate you were
  // climbing to. The east one also had its ends the wrong way round, so its
  // collider sloped against its own steps.
  b.floor(-WALLX, -GZ_, -18, 7, CY, { mat: M.darkMetal, id: 'catwalkW' });
  b.floor(18, -7, WALLX, GZ_, CY, { mat: M.darkMetal, id: 'catwalkE' });
  b.railing(-18, -GZ_, -18, 7, CY, { zone: GZ });
  b.railing(18, -7, 18, GZ_, CY, { zone: GZ });
  // the top tread meets the plate exactly; half a metre of daylight between
  // them is a flight that ends in a gap you fall through
  b.stairs(-WALLX, GZ_ - 1, -18, 7, 0, CY, 'z', { zone: GZ, mat: M.darkMetal });
  b.stairs(18, -GZ_ + 1, WALLX, -7, 0, CY, 'z', { zone: GZ, mat: M.darkMetal });
  // gym lighting: high bays
  for (let i = 0; i < 5; i++) for (const z of [-7, 7]) {
    b.stripLight(-16 + i * 8, 11.5, z, 3.2, 'x', 0xf4f8ff, i === 2 && z > 0 ? 0.35 : 0);
  }

  // =========================================================================
  // POOL HALL — one level down, under the gym's west half
  // =========================================================================
  const PZ = 'pool';
  const PY = -4.2;
  b.zone(PZ, { x0: -25, x1: 1, z0: -17, z1: 17, y0: -7, y1: 1 });
  // THE FLOOR OF THE MAP IS NOT ONE HEIGHT. `groundY` is a single number, so
  // wherever no authored surface answers, `floorAt` returns y = 0 — including
  // everywhere inside this room, four metres below it. The pool hall was
  // visible, lit, textured and impossible to stand in: you hovered at gym level
  // on the invisible ground plane, and if a gym slab dropped you into the water
  // you landed on nothing. Two pits: the deck, and the basin under it.
  b.pit(-24, -WALLZ, 0, WALLZ, PY);
  b.pit(-20, -11, -5, 11, PY - 1.9);
  b.floor(-24, -GZ_, 0, GZ_, PY, { mat: M.poolTile, zone: PZ });
  // the pool basin: a real hole in the deck
  b.floor(-20, -11, -5, 11, PY - 1.9, { mat: M.poolTile, zone: PZ });
  for (const [x0, z0, x1, z1] of [[-20, -11, -20, 11], [-5, -11, -5, 11], [-20, -11, -5, -11], [-20, 11, -5, 11]]) {
    b.wall(x0, z0, x1, z1, PY - 1.9, PY, { mat: M.poolTile, thick: 0.35, zone: PZ, collide: false });
  }
  b.water(-20, -11, -5, 11, PY - 0.55, { shallow: 0x6fc0e0, deep: 0x14506e });
  // lane ropes
  for (let i = 1; i < 5; i++) {
    const g = new THREE.BoxGeometry(14.6, 0.09, 0.09);
    g.translate(-12.5, PY - 0.45, -11 + i * 4.4);
    b.static_(g, emissive(0xd8d84a), PZ);
  }
  // deck walls + the destructible tiled surround.
  // STOPPED 0.12 m SHORT OF y = 0. `resolveWalls` skips a wall only when
  // `y > w.y1`, so a wall topping out at exactly the gym floor height collides
  // with anyone standing at that height beside it — an invisible skirt round
  // the whole building at ground level.
  b.wall(-24.4, -GZ_, -24.4, GZ_, PY, -0.12, { mat: M.poolTile, zone: PZ });
  b.wall(-24, -WALLZ, 0, -WALLZ, PY, -0.12, { mat: M.poolTile, zone: PZ });
  b.wall(-24, WALLZ, 0, WALLZ, PY, -0.12, { mat: M.poolTile, zone: PZ });
  for (let i = 0; i < 3; i++) {
    b.wall(-22 + i * 7, -GZ_ + 0.4, -16 + i * 7, -GZ_ + 0.4, PY, PY + 3.2,
      { mat: M.poolTile, destructible: true, hp: 90, kind: 'tile', zone: PZ, id: 'ptile' + i });
  }
  // THE STAIR DOWN, through the hole cut in the gym floor above (see WELL).
  // Authored bottom-first — (x0,z0) is the end at yLow — so walking south out
  // of the hall takes you up into the gym.
  b.stairs(WELL.x0, WELL.z1, WELL.x1, WELL.z0, PY, 0, 'z', { zone: PZ, mat: M.tile });
  // guard rails down both long sides of the well; the ends stay open because
  // the ends are the stair
  b.railing(WELL.x1, WELL.z0, WELL.x1, WELL.z1, 0, { zone: GZ });
  b.railing(WELL.x0, WELL.z0, WELL.x0, WELL.z1, 0, { zone: GZ, collide: false });
  for (let i = 0; i < 5; i++) b.stripLight(-21 + i * 5, -0.5, i % 2 ? -13 : 13, 3.4, 'x', 0xcfe8f4, i === 1 ? 0.5 : 0);
  // caustics thrown on the deck
  const caustic = new THREE.Mesh(new THREE.PlaneGeometry(17, 24), glowMaterial(0x5fb4d8, 0.16));
  caustic.rotation.x = -Math.PI / 2;
  caustic.position.set(-12.5, PY + 0.03, 0);
  b.add(caustic);
  let ct = 0;
  b.tickers.push(dt => { ct += dt; caustic.material.opacity = 0.11 + Math.sin(ct * 1.6) * 0.05; });
  b.lockerBank(-22.5, PY, 10, Math.PI / 2, 6);
  b.lockerBank(-22.5, PY, -10, Math.PI / 2, 6);

  // GYM FLOOR OVER THE POOL: those west slabs are destructible, and dropping
  // one puts both fighters in the water. This is the map's signature move.
  for (const s of slabIds) {
    if (!s.overPool) continue;
    const grp = new THREE.Group();
    const boards = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(SW / 3 - 0.06, 0.28, SD - 0.1), M.wood);
      m.position.set(s.x0 + SW / 6 + i * (SW / 3), -0.15, (s.z0 + s.z1) / 2);
      m.userData.home = m.position.clone();
      m.userData.homeRot = m.rotation.clone();
      grp.add(m);
      boards.push(m);
    }
    b.add(grp);
    b.destructReg.push({
      group: grp, chunks: boards, hp: 150, kind: 'wood',
      center: v3((s.x0 + s.x1) / 2, 0, (s.z0 + s.z1) / 2), radius: 4.4, height: 0.3, baseY: -0.3,
      colliderIds: [], dropPlatformIds: [s.id], dropMeshes: [], debrisScale: 1.5
    });
  }

  // =========================================================================
  // CORRIDOR SPINE + CLASSROOMS
  // =========================================================================
  const CZ = 'corridor';
  b.zone(CZ, { x0: -44, x1: 44, z0: 16, z1: 38, y0: -1, y1: 11 });
  b.floor(-44, 17, 44, 25, 0, { mat: M.tile, zone: CZ });
  // stops short of x 36: the stairwell to the upper floor climbs through here
  b.ceiling(-44, 17, 36, 25, 4.0, { mat: M.paint, zone: CZ });
  b.wall(-44, 25.4, 44, 25.4, 0, 4.0, { mat: M.paint, zone: CZ });
  b.wall(-44.4, 17, -44.4, 36, 0, 9.4, { mat: M.paint });
  b.wall(44.4, 17, 44.4, 36, 0, 9.4, { mat: M.paint });
  for (let i = 0; i < 12; i++) b.stripLight(-40 + i * 7.3, 3.85, 21, 3.4, 'x', 0xeaf2ff, i === 3 || i === 8 ? 0.45 : 0);

  // classrooms off the north side of the corridor
  const classroom = (cx, w = 12, d = 10) => {
    const zn = 'class' + cx;
    b.zone(zn, { x0: cx - w / 2, x1: cx + w / 2, z0: 25, z1: 25.4 + d, y0: -1, y1: 5 });
    b.floor(cx - w / 2, 25.4, cx + w / 2, 25.4 + d, 0, { mat: M.wood, zone: zn });
    b.ceiling(cx - w / 2, 25.4, cx + w / 2, 25.4 + d, 3.9, { mat: M.paint, zone: zn });
    b.wall(cx - w / 2, 25.4 + d, cx + w / 2, 25.4 + d, 0, 3.9, { mat: M.paint, zone: zn, collide: false });
    b.wall(cx - w / 2, 25.4, cx - w / 2, 25.4 + d, 0, 3.9, { mat: M.paint, zone: zn });
    b.wall(cx + w / 2, 25.4, cx + w / 2, 25.4 + d, 0, 3.9, { mat: M.paint, zone: zn });
    b.windows(cx - w / 2 + 0.6, 25.4 + d, cx + w / 2 - 0.6, 25.4 + d, 1.1, 3.2, { zone: zn, hp: 18 });
    // desks — instanced, they are scenery not obstacles
    const desks = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      desks.push({ x: cx - 3.4 + i * 2.3, y: 0.72, z: 27.6 + j * 2.3 });
    }
    b.repeat(new THREE.BoxGeometry(1.1, 0.06, 0.62), M.wood, desks);
    b.repeat(new THREE.BoxGeometry(1.0, 0.7, 0.06), M.darkMetal, desks.map(d => ({ ...d, y: 0.38, z: d.z - 0.3 })));
    b.stripLight(cx, 3.75, 30, 4, 'x', 0xeaf2ff);
    // (the wall between corridor and classroom is deliberately open — the
    //  gap in the corridor's north wall IS the door)
  };
  for (const cx of [-30, -14, 2, 18, 34]) classroom(cx);
  for (const cx of [-30, -14, 2, 18, 34]) {
    b.wall(cx - 8.5, 25.4, cx - 6.1, 25.4, 0, 3.9, { mat: M.paint, zone: CZ });
  }

  // =========================================================================
  // STAIRWELL + UPPER FLOOR + ROOF
  // =========================================================================
  const UY = 4.6, RY = 9.2;
  // A REAL STAIRWELL, with a real landing between the flights.
  //
  // Both flights used to be drawn inside the slab they were climbing to — the
  // ground flight under the whole of 'upper', the next one under the whole of
  // the roof — so each one ended by passing the fighter through 30 cm of solid
  // floor. Worse, the second flight covered the entire upper landing, so there
  // was nowhere on that level to stand: you came off flight one already on
  // flight two.
  //
  // Now each landing carries the opening ITS OWN flight comes up through, and
  // the two flights are at opposite ends of the landing so the landing exists.
  const UWELL = { x0: 36, z0: 18, x1: 44, z1: 25 };     // flight 1 comes up here
  const RWELL = { x0: 17.5, z0: 17.5, x1: 26, z1: 24.5 }; // flight 2 comes up here
  b.stairs(36, 25, 44, 18, 0, UY, 'z', { mat: M.tile });
  b.floorHole(16, 17, 44, 25, UY, UWELL, { mat: M.tile, id: 'upper' });
  b.railing(36, 18, 36, 25, UY);
  b.railing(16, 17, 16, 25, UY);
  // flight 2 climbs along X out of the landing's west end, clear of flight 1
  b.stairs(18, 18, 26, 24, UY, RY, 'x', { mat: M.tile });
  // ROOF — over the corridor and classrooms, open sky
  b.floorHole(-44, 17, 44, 36, RY, RWELL, { mat: M.concrete, id: 'roof' });
  b.railing(RWELL.x0, RWELL.z0, RWELL.x0, RWELL.z1, RY);
  b.railing(RWELL.x0, RWELL.z0, RWELL.x1, RWELL.z0, RY, { collide: false });
  b.railing(RWELL.x0, RWELL.z1, RWELL.x1, RWELL.z1, RY, { collide: false });
  for (const [x0, z0, x1, z1] of [[-44, 17, 44, 17], [-44, 36, 44, 36], [-44, 17, -44, 36], [44, 17, 44, 36]]) {
    b.railing(x0, z0, x1, z1, RY);
  }
  // rooftop vents (cover)
  for (let i = 0; i < 6; i++) {
    const x = -34 + i * 14;
    const g = new THREE.BoxGeometry(2.4, 1.5, 2.4);
    g.translate(x, RY + 0.75, 30);
    b.static_(g, M.rust);
    b.bounds.wall(x - 1.2, 28.8, x + 1.2, 31.2, RY, RY + 1.5, { id: 'vent' + i });
    b.bounds.platform(x - 1.2, 28.8, x + 1.2, 31.2, RY + 1.5);
  }

  // =========================================================================
  // THE GROUND — the school's sports field, south of the gym
  // =========================================================================
  // The map used to stop at the gym's south wall and lay a strip of decorative,
  // unwalkable grass past it. That is half a school: the Culling Game fight is
  // as much about being chased across open ground as it is about the gym, and
  // the outdoor half is also the only place Hanami's terrain is worth anything.
  b.floor(-48, -40, 48, -WALLZ, 0, { mat: M.grass, id: 'field' });
  b.floor(-48, -WALLZ, -WALLX, 40, 0, { mat: M.grass });
  b.floor(WALLX, -WALLZ, 48, 17, 0, { mat: M.grass });
  // the running track: a flattened dirt oval, drawn not collided
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const g = new THREE.BoxGeometry(2.6, 0.03, 2.6);
    g.translate(Math.sin(a) * 30, 0.016, -27 + Math.cos(a) * 10.5);
    b.static_(g, M.rust);
  }
  // perimeter wall, so the field reads as school grounds rather than as a void
  b.wall(-48.4, -40.4, 48.4, -40.4, 0, 2.6, { mat: M.concreteWall });
  b.wall(-48.4, -40.4, -48.4, 40, 0, 2.6, { mat: M.concreteWall });
  b.wall(48.4, -40.4, 48.4, 17, 0, 2.6, { mat: M.concreteWall });
  // a backstop cage behind home plate — cover, and a thing to be thrown into
  for (const [bx, bz] of [[-34, -32], [34, -32]]) {
    for (let i = 0; i < 5; i++) {
      const g = new THREE.BoxGeometry(0.12, 5.0, 0.12);
      g.translate(bx - 3 + i * 1.5, 2.5, bz);
      b.static_(g, M.metal);
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 5.0),
      glowMaterial(0x8fa0b0, 0.12));
    mesh.position.set(bx, 2.5, bz + 0.06);
    b.add(mesh);
    b.bounds.wall(bx - 3.2, bz - 0.2, bx + 3.2, bz + 0.2, 0, 5.0, { id: 'cage' + bx });
  }
  // a small stand of trees along the wall, and the school's own bike shelter
  for (let i = 0; i < 14; i++) {
    b.tree(-44 + i * 6.6, 0, -37 + rand(-1.5, 1.5), rand(1.1, 1.7));
  }
  {
    const SHY = 2.8;
    b.floor(-14, -25, 2, -19, SHY, { mat: M.rust, id: 'shelter' });
    for (const [px, pz] of [[-13, -24], [1, -24], [-13, -20], [1, -20], [-6, -24], [-6, -20]]) {
      b.pillar(px, pz, 0, SHY - 0.12, 0.16, { mat: M.metal, hp: 60, drops: ['shelter'] });
    }
    b.slope(4, -25, 2, -19, 0, SHY, 'x', { mat: M.rust, depth: 0.4, segs: 12 });
  }

  // ambient: dust in the gym light, chlorine haze over the water
  b.particles(160, { x0: -GX, x1: GX, y0: 0.5, y1: 11, z0: -GZ_, z1: GZ_ },
    { color: 0xdfe8f4, size: 0.06, opacity: 0.28, vy: [-0.08, 0.06] });
  b.particles(80, { x0: -22, x1: -3, y0: -4.5, y1: -1.5, z0: -13, z1: 13 },
    { color: 0x8fd0e8, size: 0.09, opacity: 0.30, vy: [0.05, 0.3] });

  b.bounds.spawns = [v3(-9, 0, 0), v3(9, 0, 0), v3(0, 0, -9), v3(0, 0, 9)];
  return b;
}
