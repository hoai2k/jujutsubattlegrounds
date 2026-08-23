// SHINJUKU — the Shinjuku Showdown. The biggest map in the set, built for the
// heaviest fights: a wide boulevard between towers with an overpass cutting
// across it, a sunken plaza cut into the roadway, and real distance to cover.
//
// REFERENCE NOTE (researched): broad multi-lane streets walled in by
// skyscrapers, elevated pedestrian overpasses crossing the roadway, dense
// ground-floor retail, sunken pedestrian plazas cut below street level, and the
// towers reading as a background layer with genuine presence rather than a
// painted backdrop.
//
// LAYOUT (136 x 118 m):
//   y = -4.40  SUNKEN PLAZA a pedestrian level cut into the western half of the
//                           roadway, open to the sky, with a flight at each
//                           end. The only below-grade ground on the map and the
//                           only place on it out of the overpass's sightline.
//   y =  0.00  BOULEVARD    an enormous central roadway. This is the map that
//                           makes Jogo and Megumi's shadow work, and the map
//                           Todo and Yuji have to fight uphill on.
//   y =  0.24  ARCADE       covered colonnades either side with storefronts
//   y =  7.20  OVERPASS     a pedestrian bridge across the middle of the
//                           street with stairs at both ends. STRUCTURAL: its
//                           four columns can be destroyed and the deck drops.
//   y =  9.40  SCAFFOLD     a contractor's deck strapped to the east tower —
//                           the east side's answer to the podium roof, and the
//                           one piece of high ground that is not concrete.
//   y = 12.00  PODIUM ROOF  the low tower's roof on the west side
//   BOUNDS                  towers and hoardings; the street ends where the
//                           buildings do.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'shinjuku',
  name: 'SHINJUKU',
  jp: '新宿',
  desc: 'A boulevard between towers, with an overpass you can bring down.',
  extent: { minX: -68, maxX: 68, minZ: -59, maxZ: 59 },
  background: 0x0e1424,
  fog: { color: 0x141c30, near: 58, far: 230 },
  grade: { vignette: 0.46, tint: [1.0, 0.99, 1.10], lift: 0, sat: 1.04 },
  lights: {
    key: { color: 0xc0d0f0, intensity: 1.0, pos: [14, 26, 10] },
    rim: { color: 0xff9f6f, intensity: 0.65, pos: [-16, 14, -14] },
    hemi: { sky: 0x4a5c90, ground: 0x1c1a18, intensity: 0.44 }
  },
  // stage-select beauty shot: hand-picked so the preview never ends up
  // inside a wall, above a ceiling or buried in the treeline
  previewCam: { pos: [-41, 21, 39], look: [8, 1.0, -4] },
  shadowScale: 1.7,          // the widest map gets the widest shadow
  shrineScale: 1.33,      // the widest map gets the widest shrine, and still only reaches a fifth of it
  size: '136 × 118 m · street, sunken plaza, arcades, overpass, roofs'
};

// The sunken plaza's footprint, named once. The roadway, the two pavements and
// the pit all have to cut the SAME rect out of themselves: a slab that forgets
// leaves the plaza visible, lit and paved over, because `floorAt` returns the
// highest surface and street level always wins.
const SP = { x0: -34, z0: -24, x1: -18, z1: 24 };
const SY = -4.4;

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  b.sky(0x07101f, 0x142240, 0x3a3050, 420);
  b.groundPlane(0x090c14, 340);
  b.skyline(36, 240, { color: 0x0a1020, minW: 18, maxW: 46, minH: 60, maxH: 210 });

  // ---- the boulevard ------------------------------------------------------
  b.floorHole(-68, -59, 68, 59, 0, SP, { mat: M.asphalt });
  // lane markings running the length of the street
  for (const z of [-11, 0, 11]) {
    for (let i = 0; i < 27; i++) {
      const x = -64 + i * 5;
      if (x > SP.x0 - 2 && x < SP.x1 + 2) continue;   // not across the plaza
      const g = new THREE.BoxGeometry(2.6, 0.03, 0.24);
      g.translate(x, 0.016, z);
      b.static_(g, emissive(0xdfe4ec));
    }
  }
  // raised pavements either side (the flanking routes), each cut for the plaza
  b.floorHole(-68, -38, 68, -18, 0.24, { x0: SP.x0, z0: SP.z0, x1: SP.x1, z1: -18 },
    { mat: M.concrete });
  b.floorHole(-68, 18, 68, 38, 0.24, { x0: SP.x0, z0: 18, x1: SP.x1, z1: SP.z1 },
    { mat: M.concrete });
  for (const z of [-18, 18]) {
    for (const [a, c] of [[-68, SP.x0], [SP.x1, 68]]) {
      const g = new THREE.BoxGeometry(c - a, 0.26, 0.4);
      g.translate((a + c) / 2, 0.13, z);
      b.static_(g, M.concrete);
    }
  }

  // ---- THE SUNKEN PLAZA ---------------------------------------------------
  // `groundY` is one number for the whole map and it is 0, so a room below it
  // needs its fallback floor lowered over its own footprint or the fighter
  // stands on the road surface in mid-air above it.
  b.pit(SP.x0, SP.z0, SP.x1, SP.z1, SY);
  b.floor(SP.x0, SP.z0, SP.x1, SP.z1, SY, { mat: M.tile, id: 'sunken' });
  // The retaining walls stop 0.12 m BELOW street level on purpose, and that is
  // not the usual wall-lip fix — it is what makes the plaza an open cut rather
  // than a walled box. Anyone at street level walks over the lip and drops in;
  // anyone in the plaza is held by it and has to use a flight.
  for (const [x0, z0, x1, z1] of [
    [SP.x0, SP.z0, SP.x0, SP.z1], [SP.x1, SP.z0, SP.x1, SP.z1],
    [SP.x0, SP.z0, SP.x1, SP.z0], [SP.x0, SP.z1, SP.x1, SP.z1]
  ]) b.wall(x0, z0, x1, z1, SY, -0.12, { mat: M.tileWall, thick: 0.5 });
  // a flight at each end. Authored low-end-first: the low end is the plaza.
  b.stairs(SP.x0 + 3, -18, SP.x0 + 12, SP.z0, SY, 0.24, 'z', { mat: M.tile });
  b.stairs(SP.x0 + 3, 18, SP.x0 + 12, SP.z1, SY, 0.24, 'z', { mat: M.tile });
  // the lip railing, split where the flights arrive
  for (const s of [-1, 1]) {
    b.railing(SP.x0 + 12, s * 24, SP.x1, s * 24, 0.24, { collide: false });
  }
  b.railing(SP.x1, SP.z0, SP.x1, SP.z1, 0.24, { collide: false });
  for (let i = 0; i < 6; i++) {
    b.stripLight(SP.x0 + 3 + i * 2.2, SY + 4.0, -8 + (i % 3) * 8, 3.0, 'x', 0xdfeaff, i === 2 ? 0.4 : 0);
  }
  // planters down the middle, so a 16 x 48 pit is not a bare box
  for (let i = 0; i < 5; i++) {
    const z = -18 + i * 9;
    const g = new THREE.BoxGeometry(4.0, 0.9, 3.4);
    g.translate(-24, SY + 0.45, z);
    b.static_(g, M.concrete);
    b.bounds.wall(-26, z - 1.7, -22, z + 1.7, SY, SY + 0.9, { id: 'planter' + i });
    b.bounds.platform(-26, z - 1.7, -22, z + 1.7, SY + 0.9);
    const t = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), M.foliage);
    t.position.set(-24, SY + 1.9, z);
    t.scale.set(1, 0.8, 1);
    b.add(t);
  }

  // ---- ARCADES: covered colonnades with enterable units ------------------
  const arcade = (sz) => {
    const zn = 'arcade' + sz;
    const z0 = sz * 28, z1 = sz * 38;
    b.zone(zn, { x0: -62, x1: 62, z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0: -1, y1: 8 });
    b.ceiling(-62, Math.min(z0, z1), 62, Math.max(z0, z1), 5.6, { mat: M.concrete, zone: zn });
    // colonnade
    for (let i = 0; i < 15; i++) {
      b.pillar(-58 + i * 8.4, sz * 28, 0.24, 5.4, 0.45, { square: true, mat: M.concrete, hp: 170, zone: zn });
    }
    // The back of the arcade, in one piece. It used to be five units with 2 m
    // gaps between them, and each of those gaps was a slot you could walk
    // through to the far side — out under the towers, which have no collider
    // below 5.8 m, and on to the edge of the world.
    b.wall(-62, sz * 38.4, 62, sz * 38.4, 0.24, 5.6, { mat: M.paint, zone: zn });
    // shop units behind
    for (let i = 0; i < 6; i++) {
      const cx = -50 + i * 20;
      b.windows(cx - 8, sz * 34, cx + 8, sz * 34, 0.7, 4.4, { zone: zn, hp: 22, id: 'sjw' + sz + i });
      b.floor(cx - 9, sz > 0 ? 34 : -38.4, cx + 9, sz > 0 ? 38.4 : -34, 0.24, { mat: M.tile, zone: zn });
      for (let k = 0; k < 3; k++) b.stripLight(cx - 5 + k * 5, 5.4, sz * 33, 3.4, 'x', 0xfff0d8, (i + k) % 7 === 0 ? 0.4 : 0);
      b.neon(cx, 5.9, sz * 27.5, 9, 1.3, [0xff4f7f, 0x4fd8ff, 0xffd84f, 0x8f4fff, 0x4fe08a, 0xff8f4f][i], sz > 0 ? Math.PI : 0);
    }
    for (let i = 0; i < 7; i++) b.vending(-50 + i * 16, 0.24, sz * 31, sz > 0 ? Math.PI : 0, i % 2 ? 0xd8402c : 0x2c6ad8);
  };
  arcade(-1);
  arcade(1);

  // ---- the tower wall (the boundary, and it reads as one) ----------------
  const tower = (x, z, w, d, h) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, h / 2 + 5.8, z);
    b.static_(g, M.concreteWall);
    b.bounds.wall(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 5.8, h + 5.8);
    const win = [];
    for (let iy = 0; iy < Math.floor(h / 3.6); iy++) {
      for (let ix = 0; ix < Math.floor(w / 3.2); ix++) {
        if (Math.random() < 0.42) continue;
        win.push({
          x: x - w / 2 + 1.6 + ix * 3.2, y: 9 + iy * 3.6,
          z: z + (z < 0 ? d / 2 + 0.07 : -d / 2 - 0.07), ry: z < 0 ? 0 : Math.PI
        });
      }
    }
    b.repeat(new THREE.PlaneGeometry(1.6, 2.1), emissive(Math.random() < 0.5 ? 0xffe0b0 : 0xd0e0ff), win);
  };
  for (let i = 0; i < 6; i++) {
    tower(-55 + i * 22, -50, 20, 18, 62 + i * 26);
    tower(-55 + i * 22, 50, 20, 18, 50 + ((i * 37) % 90));
  }
  // end walls: hoardings, not invisible planes
  for (const s of [-1, 1]) {
    b.wall(s * 67, -42, s * 67, 42, 0, 9, { mat: M.rust });
    for (let i = 0; i < 10; i++) b.neon(s * 66.6, 4.5, -36 + i * 8, 0.4, 6, 0x4f7fd8, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  }

  // ---- OVERPASS -----------------------------------------------------------
  // The centrepiece: an elevated crossing over the street. Its four columns
  // are structural — bring them down and the deck falls into the road.
  const OY = 7.2;
  b.floor(-7, -26, 7, 26, OY, { mat: M.concrete, id: 'overpass' });
  b.railing(-7, -26, -7, 26, OY);
  b.railing(7, -26, 7, 26, OY);
  b.ceiling(-7, -26, 7, 26, OY + 3.2, { mat: M.darkMetal });
  for (const [x, z] of [[-6, -18], [6, -18], [-6, 18], [6, 18]]) {
    b.pillar(x, z, 0, OY - 0.3, 0.55, { square: true, mat: M.concrete, hp: 220, drops: ['overpass'] });
  }
  b.stairs(-7, -33, 7, -26, 0.24, OY, 'z');
  b.stairs(-7, 26, 7, 33, OY, 0.24, 'z');
  for (let i = 0; i < 9; i++) b.stripLight(0, OY + 2.9, -24 + i * 6, 3.4, 'x', 0xdfeaff, i === 4 ? 0.5 : 0);
  b.bigScreen(0, OY + 5.2, -26.4, 11, 6, 0, 340);

  // ---- PODIUM ROOF (west) ------------------------------------------------
  const RY = 12;
  // The building the roof belongs to. Without it the podium is a slab floating
  // twelve metres over the road with clear air underneath.
  {
    // Notched on the east face where the stair arrives: a flush wall stops the
    // fighter 34 cm short of the top tread, which is 40 cm below the roof, so
    // the climb dead-ends within touching distance of the deck.
    for (const [x0, z0, x1, z1] of [
      [-66, -15, -44, -10.4], [-66, 10.4, -44, 15], [-66, -10.4, -46.5, 10.4]
    ]) {
      const g = new THREE.BoxGeometry(x1 - x0, RY, z1 - z0);
      g.translate((x0 + x1) / 2, RY / 2, (z0 + z1) / 2);
      b.static_(g, M.concreteWall);
      b.bounds.wall(x0, z0, x1, z1, 0, RY - 0.12, { id: 'podiumBlock' });
    }
    // the recess under the stair head, so the notch is not an open hole
    const u = new THREE.BoxGeometry(2.5, RY - 6, 20.8);
    u.translate(-45.25, (RY - 6) / 2, 0);
    b.static_(u, M.concreteWall);
    const win = [];
    for (let iy = 0; iy < 3; iy++) for (let iz = 0; iz < 7; iz++) {
      win.push({ x: -43.9, y: 2.6 + iy * 3.2, z: -9 + iz * 3, ry: Math.PI / 2 });
    }
    b.repeat(new THREE.PlaneGeometry(2.0, 1.9), emissive(0xffe0b0), win);
  }
  b.floor(-66, -15, -44, 15, RY, { mat: M.concrete, id: 'podium' });
  // the east rail is split around the stair head
  for (const [x0, z0, x1, z1] of [
    [-66, -15, -44, -15], [-66, 15, -44, 15], [-44, -15, -44, -10.3], [-44, 10.3, -44, 15]
  ]) b.railing(x0, z0, x1, z1, RY);
  // THE CLIMB TO THE PODIUM. The podium is at x <= -44, so this has to run west
  // onto it; it once ran east instead, topping out at 12 m over the middle of
  // the road. And 6 m of run for 11.8 m of rise was a 63 degree ladder even if
  // it had been pointed the right way — it gets 18 m now.
  //
  // The flight lands OUTSIDE the sunken plaza's cut (which starts at x = -34):
  // a staircase whose foot is a four-metre drop is not a staircase.
  b.stairs(-16, -10, -44, 10, 0.24, RY, 'x');
  b.railing(-16, -10.2, -44, -10.2, RY - 5.8, { collide: false });
  b.railing(-16, 10.2, -44, 10.2, RY - 5.8, { collide: false });
  for (let i = 0; i < 5; i++) {
    const x = -62 + i * 4;
    const g = new THREE.BoxGeometry(3.0, 1.8, 3.0);
    g.translate(x, RY + 0.9, 8);
    b.static_(g, M.rust);
    b.bounds.wall(x - 1.5, 6.5, x + 1.5, 9.5, RY, RY + 1.8, { id: 'pv' + i });
    b.bounds.platform(x - 1.5, 6.5, x + 1.5, 9.5, RY + 1.8);
  }

  // ---- SCAFFOLD DECK (east) ----------------------------------------------
  // The east half had no high ground at all: the overpass sat on the
  // centreline and the podium was west of it, so every fight that went vertical
  // went west. A contractor's scaffold up the east tower fixes that without
  // building a second podium, and a lattice of poles reads completely
  // differently from a concrete deck at a glance, which matters more than
  // symmetry does.
  const KY = 9.4;
  const KX0 = 44, KX1 = 64, KZ0 = -13, KZ1 = 13;
  b.floor(KX0, KZ0, KX1, KZ1, KY, { mat: M.wood, id: 'scaffold' });
  for (const [x0, z0, x1, z1] of [
    [KX0, KZ0, KX1, KZ0], [KX0, KZ1, KX1, KZ1], [KX1, KZ0, KX1, KZ1]
  ]) b.railing(x0, z0, x1, z1, KY);
  b.railing(KX0, KZ0, KX0, -5.3, KY);
  b.railing(KX0, 5.3, KX0, KZ1, KY);
  // the frame: standards, ledgers and diagonal bracing
  for (let i = 0; i <= 5; i++) {
    const x = KX0 + i * (KX1 - KX0) / 5;
    for (const z of [KZ0, KZ1]) {
      const g = new THREE.BoxGeometry(0.16, KY + 3, 0.16);
      g.translate(x, (KY + 3) / 2, z);
      b.static_(g, M.metal);
    }
  }
  for (const y of [3.2, 6.3, KY, KY + 2.8]) {
    for (const z of [KZ0, KZ1]) {
      const g = new THREE.BoxGeometry(KX1 - KX0, 0.13, 0.13);
      g.translate((KX0 + KX1) / 2, y, z);
      b.static_(g, M.metal);
    }
  }
  // the sheeting that makes it read as a building site rather than a jungle gym
  for (const z of [KZ0 - 0.12, KZ1 + 0.12]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(KX1 - KX0, KY + 2.6),
      glowMaterial(0x6f8faf, 0.13));
    s.position.set((KX0 + KX1) / 2, (KY + 2.6) / 2, z);
    b.add(s);
  }
  // the ladder run up to it, off the east pavement, authored bottom-first
  b.stairs(38, -5, KX0, 5, 0.24, KY, 'x', { mat: M.metal });
  for (let i = 0; i < 3; i++) b.stripLight(KX0 + 4 + i * 6, KY + 2.6, 0, 3.0, 'x', 0xffe8c0, i === 1 ? 0.5 : 0);

  // ---- traffic + street furniture ----------------------------------------
  const cars = [[-52, -6, 0], [-8, 6, Math.PI], [18, -6, 0], [40, 6, Math.PI], [56, -6, 0], [6, -13, 0], [30, 13, Math.PI]];
  const carCols = [0x2a3a6a, 0x6a2a2a, 0x24343c, 0x3a3a44, 0x5a5a64, 0x2a5a4a, 0x50304a];
  cars.forEach(([x, z, ry], i) => b.car(x, 0, z, ry, carCols[i % carCols.length]));
  for (let i = 0; i < 10; i++) {
    for (const sz of [-1, 1]) {
      const x = -56 + i * 12.6, z = sz * 19.6;
      if (x > SP.x0 - 2 && x < SP.x1 + 2) continue;      // not standing in the plaza cut
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7.5, 8), M.darkMetal);
      pole.position.y = 3.75;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.4), M.darkMetal);
      arm.position.set(0, 7.4, -sz * 1.2);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 1.1), emissive(0xffe0a8));
      lamp.position.set(0, 7.24, -sz * 2.2);
      g.add(pole, arm, lamp);
      g.position.set(x, 0.24, z);
      b.add(g);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), haloMaterial(0xffc87a, 0.16));
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(x, 0.3, z - sz * 2.2);
      b.add(halo);
      b.bounds.wall(x - 0.22, z - 0.22, x + 0.22, z + 0.22, 0, 7.5, { id: 'lamp' + i + sz });
      b.breakable(g, { hp: 35, kind: 'metal', center: v3(x, 3.8, z), radius: 0.6, height: 7.5, baseY: 0.24, colliderIds: ['lamp' + i + sz] });
    }
  }

  // =========================================================================
  // THE SHOWDOWN LOOK
  // =========================================================================
  // The biggest map in the set and the one with the least in the air: 136 m of
  // correct street with two lit signs and a haze plane over it. What it wanted
  // was VOLUME — the light doing something between the towers — and a reason to
  // believe a fight of this size is happening on it.

  // ---- THE CURTAIN --------------------------------------------------------
  // The largest ward on any of these maps, because this is the largest street.
  // It runs the length of the boulevard, with anchors under each end of the
  // overpass where the columns come down.
  b.sigil(4, 0.06, 0, 34, 0x8f6aff, { rings: 3, spokes: 24, sides: 6, opacity: 0.20, spin: -0.016 });
  b.sigil(0, 0.06, -30, 6.5, 0xff5a6a, { rings: 2, spokes: 8, sides: 3, opacity: 0.28, spin: 0.10 });
  b.sigil(0, 0.06, 30, 6.5, 0xff5a6a, { rings: 2, spokes: 8, sides: 3, opacity: 0.28, spin: -0.10 });
  b.sigil(-26, SY + 0.04, 0, 7.0, 0x6ad8ff, { rings: 3, spokes: 10, sides: 5, opacity: 0.24, spin: 0.06 });

  // ---- LIGHT BETWEEN THE TOWERS ------------------------------------------
  // Shafts down the two tower gaps onto the roadway, leaning the way the key
  // light does, plus the pool the overpass screen throws under itself.
  for (let i = 0; i < 5; i++) {
    const x = -55 + i * 22 + 11;
    b.godRay(x, 34, -41, 6.0, 34, 0xbfd0f0, { opacity: 0.05, taper: 0.28, lean: [-6, 16], range: 150 });
  }
  b.godRay(0, OY - 0.2, 0, 5.5, OY, 0xdfeaff, { opacity: 0.07, taper: 0.5, pool: false });
  b.godRay(-26, 0.1, 0, 7.5, 4.5, 0x9fd8ff, { opacity: 0.08, taper: 0.55, pool: false });

  // ---- OVERHEAD RUN + THE SITE -------------------------------------------
  // Feeder cables across the boulevard, and the east scaffold given the rest of
  // the kit a live building site has: sheeting, a beacon, drums and a stack.
  for (let i = 0; i < 5; i++) {
    const x = -55 + i * 22;
    b.cable(v3(x, 22, -41), v3(x + 6, 21, 41), { sag: 5.0, r: 0.07, segs: 14 });
  }
  b.cable(v3(-44, 14, -20), v3(44, 13, -20), { sag: 4.0, r: 0.06, segs: 14 });
  b.cable(v3(-44, 14, 20), v3(44, 13, 20), { sag: 4.0, r: 0.06, segs: 14 });
  b.beacon(KX1 - 1.5, KY + 3.6, 0, 0xffa03c, { reach: 5.0 });
  b.beacon(-45.5, RY + 1.6, -13, 0xff4a5a, { reach: 4.4, rate: 1.0 });
  b.crates(KX0 + 4, KY, KZ0 + 3, { count: 2 });
  b.crates(KX0 + 5.8, KY, KZ0 + 4.4, { count: 1 });
  for (let i = 0; i < 3; i++) b.drum(KX1 - 2 - i * 1.05, KY, KZ1 - 2.5, { color: 0xc4562c });
  b.sparker(KX0 + 10, KY + 2.4, KZ1, { color: 0xbfe4ff });
  // and the compound at the foot of it, on the pavement out of the traffic lanes
  b.crates(40, 0.24, -30, { count: 3 });
  b.crates(41.8, 0.24, -31.6, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(46 + i * 1.05, 0.24, -30, { color: 0xc4562c });
  b.crates(-40, 0.24, 30, { count: 3 });
  for (let i = 0; i < 3; i++) b.drum(-46 - i * 1.05, 0.24, 30, { color: 0xb8483c });

  // ---- SIGNAGE ------------------------------------------------------------
  // Vertical shop banners down both arcades, which is what a Shinjuku street
  // frontage actually looks like from the road.
  for (let i = 0; i < 6; i++) {
    const cx = -50 + i * 20;
    const hue = [0xff4f7f, 0x4fd8ff, 0xffd84f, 0x8f4fff, 0x4fe08a, 0xff8f4f][i];
    b.banner(cx - 6, 5.4, -27.6, 1.5, 3.6, hue, { ry: 0, amp: 0.07 });
    b.banner(cx + 6, 5.4, 27.6, 1.5, 3.6, hue, { ry: Math.PI, amp: 0.07 });
  }
  b.lanternString(v3(-33, 4.6, -19.6), v3(-9, 4.6, -19.6), { color: 0xffb86a, sag: 1.4, count: 12 });
  b.lanternString(v3(9, 4.6, 19.6), v3(33, 4.6, 19.6), { color: 0xffb86a, sag: 1.4, count: 12 });

  // ---- STREET-LEVEL AIR ---------------------------------------------------
  b.mist(SP.x0, SP.z0, SP.x1, SP.z1, SY, 0x7f96b8, { opacity: 0.26, scale: 15 });
  for (const [sx, sz] of [[-48, -8], [-4, 9], [24, -9], [52, 8], [12, -21], [-14, 21]]) {
    b.steamVent(sx, 0.02, sz, { height: 4.6, period: 3.4 + (sx % 3) * 0.4, opacity: 0.20 });
  }
  b.sparker(0, OY + 2.6, -20, { color: 0xbfe4ff });
  b.sparker(-52, 8.6, 19.6, { color: 0xbfe4ff });

  // ---- ambient ------------------------------------------------------------
  b.particles(260, { x0: -64, x1: 64, y0: 0.4, y1: 26, z0: -54, z1: 54 },
    { color: 0xa8c0e8, size: 0.08, opacity: 0.24, vy: [-0.2, 0.1] });
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(136, 36), glowMaterial(0x4f6fa8, 0.07));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.y = 0.03;
  b.add(sheen);

  b.bounds.spawns = [v3(-10, 0, 0), v3(16, 0, 0), v3(2, 0, -10), v3(2, 0, 10)];
  return b;
}
