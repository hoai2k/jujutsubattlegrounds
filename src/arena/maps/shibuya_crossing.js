// SHIBUYA — STREET LEVEL / SCRAMBLE CROSSING.
//
// REFERENCE NOTE (researched): the crossing itself with its diagonal painted
// lanes, ringed by commercial towers carrying enormous illuminated screens,
// storefronts at pavement level, traffic signals on every corner, and the
// station entrances dropping away below the pavement. Night, saturated neon,
// wet asphalt.
//
// LAYOUT (120 x 108 m — the widest open floor in the set):
//   y = -3.60  STATION MOUTH   a sunken entrance plaza in the north-east
//                              corner: a hole in the floor with stairs.
//   y =  0.00  THE CROSSING    a vast open engagement space, deliberately
//                              empty in the middle so the long-range
//                              characters get a map that suits them.
//   y =  0.24  PAVEMENT RING   the kerbed ring around the crossing.
//   y =  0.24  STOREFRONTS     six enterable ground-floor units around the
//                              perimeter, genuinely modelled inside.
//   y =  5.40  PEDESTRIAN DECK a covered walkway along the south edge with
//                              two stair connections — the flanking route.
//   y = 10.80  SIGN GANTRY     the maintenance catwalk behind the big screen
//                              on the south tower, off the deck's east stair.
//                              The only place on this map above the deck.
//   BOUNDS                     buildings on all four sides. No invisible
//                              walls anywhere on open pavement.
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'shibuya_crossing',
  name: 'SCRAMBLE CROSSING',
  jp: '渋谷スクランブル交差点',
  desc: 'Street level at night. Neon, rain, and the biggest open floor here.',
  extent: { minX: -60, maxX: 60, minZ: -54, maxZ: 54 },
  background: 0x0a0e1c,
  fog: { color: 0x121a30, near: 52, far: 200 },
  grade: { vignette: 0.50, tint: [1.02, 0.98, 1.14], lift: 0.005, sat: 1.12 },
  lights: {
    key: { color: 0x9fb8ff, intensity: 0.85, pos: [10, 20, 8] },
    rim: { color: 0xd8688f, intensity: 0.70, pos: [-14, 12, -12] },
    hemi: { sky: 0x3c4a80, ground: 0x18120e, intensity: 0.44 }
  },
  // stage-select beauty shot: hand-picked so the preview never ends up
  // inside a wall, above a ceiling or buried in the treeline
  previewCam: { pos: [-28, 19, 33], look: [3, 1.0, 0] },
  shadowScale: 1.45,
  shrineScale: 1.13,      // an open crossing plus a deck to flee onto
  size: '120 × 108 m · street + deck + gantry + sunken plaza'
};

// The station mouth's opening, named once. The road is laid AROUND it and the
// pit is sunk under it, and the two have to agree exactly.
const MX0 = 21, MX1 = 40, MZ0 = -38, MZ1 = -21, MSX = 32.5, MSZ = -13;
const PY = -3.6;
const DY = 5.4;         // pedestrian deck
const GY = 10.8;        // sign gantry

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  b.sky(0x060a18, 0x101a38, 0x2a2450, 380);
  b.groundPlane(0x0b0e16, 300);
  b.skyline(32, 200, { color: 0x0b0f1e, minW: 14, maxW: 38, minH: 40, maxH: 150 });

  // ---- the road surface ---------------------------------------------------
  // Laid AROUND the station mouth rather than over it. A single slab is what
  // the first pass used, and because `floorAt` takes the highest surface, the
  // road at y = 0 won every query inside the sunken plaza: the hole in the
  // ground was visible, lit, furnished — and paved over. You stood on thin air
  // above it and the stairs went nowhere.
  //
  // The opening is L-shaped: the plaza itself, plus the slot its stair climbs
  // out through (the stair does not clear road level until z ~ -13).
  for (const [x0, z0, x1, z1] of [
    [-60, -54, MX0, 54], [MX1, -54, 60, 54],
    [MX0, -54, MX1, MZ0], [MX0, MSZ, MX1, 54], [MSX, MZ1, MX1, MSZ]
  ]) b.floor(x0, z0, x1, z1, 0, { mat: M.asphalt });
  // the scramble: painted lanes, including the two diagonals
  const paint = emissive(0xe4e8f0);
  const stripe = (cx, cz, len, wide, ang) => {
    const n = Math.max(1, Math.round(len / 1.4));
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * len;
      const g = new THREE.BoxGeometry(0.72, 0.03, wide);
      g.rotateY(ang);
      g.translate(cx + Math.cos(ang) * t, 0.015, cz - Math.sin(ang) * t);
      b.static_(g, paint);
    }
  };
  stripe(0, -19, 34, 6.5, 0);
  stripe(0, 19, 34, 6.5, 0);
  stripe(-19, 0, 34, 6.5, Math.PI / 2);
  stripe(19, 0, 34, 6.5, Math.PI / 2);
  stripe(0, 0, 46, 6.0, Math.PI / 4);
  stripe(0, 0, 46, 6.0, -Math.PI / 4);

  // kerbs marking the pavement ring (diegetic edge, not an invisible wall)
  for (const [x0, z0, x1, z1] of [
    [-40, -40, 40, -40], [-40, 40, 40, 40], [-40, -40, -40, 40], [40, -40, 40, 40]
  ]) {
    const g = new THREE.BoxGeometry(Math.max(0.4, Math.abs(x1 - x0)), 0.22, Math.max(0.4, Math.abs(z1 - z0)));
    g.translate((x0 + x1) / 2, 0.11, (z0 + z1) / 2);
    b.static_(g, M.concrete);
  }
  b.floor(-56, -56, 56, -40, 0.22, { mat: M.concrete });
  b.floor(-56, 40, 56, 56, 0.22, { mat: M.concrete });
  b.floor(-56, -40, -40, 40, 0.22, { mat: M.concrete });
  b.floor(40, -40, 56, 40, 0.22, { mat: M.concrete });

  // ---- the tower ring -----------------------------------------------------
  // Each side is a slab with a storefront cut into the ground floor. The
  // buildings ARE the boundary; you can see exactly where the map ends.
  //
  // GROUND FLOOR. The towers used to begin at y = 4.2 with nothing under them
  // and no collider below that height, so the pavement ran straight on into a
  // fifty-metre slab floating over the fighter's head — you could stand two
  // thirds of the way inside a building. Each tower now carries its own storey
  // down to the road, with a rectangular bite taken out of it wherever one of
  // the enterable shop units sits inside the footprint. That bite is what makes
  // the shop read as a recess in the building line rather than a shed parked
  // against it.
  const podium = (x, z, w, d, cut) => {
    const X0 = x - w / 2, X1 = x + w / 2, Z0 = z - d / 2, Z1 = z + d / 2;
    let parts = [[X0, Z0, X1, Z1]];
    if (cut) {
      // clamp the bite to the footprint, or the strips beside it run out past
      // the wall of the building they belong to
      const cx0 = Math.max(X0, cut.x0), cx1 = Math.min(X1, cut.x1);
      const cz0 = Math.max(Z0, cut.z0), cz1 = Math.min(Z1, cut.z1);
      parts = [
        [X0, Z0, X1, cz0], [X0, cz1, X1, Z1],
        [X0, cz0, cx0, cz1], [cx1, cz0, X1, cz1]
      ];
    }
    for (const [a, c, e, f] of parts) {
      if (e - a < 0.05 || f - c < 0.05) continue;
      const pg = new THREE.BoxGeometry(e - a, 4.6, f - c);
      pg.translate((a + e) / 2, 2.3, (c + f) / 2);
      b.static_(pg, M.concreteWall);
      b.bounds.wall(a, c, e, f, 0, 4.6);
    }
  };

  const tower = (x, z, w, d, h, cut, hue) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, h / 2 + 4.6, z);
    b.static_(g, M.concreteWall);
    b.bounds.wall(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 4.6, h + 4.6);
    podium(x, z, w, d, cut);
    // lit window grid
    const win = [];
    for (let iy = 0; iy < Math.floor(h / 3.4); iy++) {
      for (let ix = 0; ix < Math.floor(w / 3.0); ix++) {
        if (Math.random() < 0.35) continue;
        win.push({
          x: x - w / 2 + 1.5 + ix * 3.0, y: 7.5 + iy * 3.4,
          z: z + (z < 0 ? d / 2 + 0.06 : -d / 2 - 0.06), ry: z < 0 ? 0 : Math.PI, s: 1
        });
      }
    }
    b.repeat(new THREE.PlaneGeometry(1.5, 1.9), emissive(hue), win);
  };
  // the `cut` rects are the shop units below, which sit inside these footprints
  tower(-32, -49, 32, 14, 58, { x0: -24.2, z0: -49.7, x1: -7.8, z1: -41.3 }, 0xffd9a0);
  tower(28, -49, 30, 14, 72, null, 0xdfe8ff);
  tower(-34, 49, 30, 14, 50, { x0: -26.2, z0: 41.3, x1: -9.8, z1: 49.7 }, 0xffc8a0);
  tower(32, 49, 32, 14, 64, { x0: 7.8, z0: 41.3, x1: 24.2, z1: 49.7 }, 0xcfe0ff);
  tower(-51, 5, 14, 56, 54, { x0: -51.7, z0: -24.2, x1: -43.3, z1: -7.8 }, 0xffd9a0);
  tower(51, -8, 14, 52, 68, { x0: 43.3, z0: 7.8, x1: 51.7, z1: 24.2 }, 0xdfe8ff);

  // BIG SCREENS — the thing that makes it read as Shibuya
  b.bigScreen(-32, 18, -41.6, 24, 13, 0, 205);
  b.bigScreen(28, 25, -41.6, 20, 11, 0, 320);
  b.bigScreen(-42.6, 16, 5, 17, 11, Math.PI / 2, 150);
  b.bigScreen(42.6, 21, -8, 19, 12, -Math.PI / 2, 30);
  b.bigScreen(-34, 20, 41.6, 20, 11, Math.PI, 95);

  // ---- STOREFRONTS: genuinely enterable ----------------------------------
  // Six units, each a real room with a floor, a ceiling, back wall, shelving
  // and a glass front that breaks and opens the room to the street.
  const shop = (cx, cz, w, d, face, hue) => {
    const zone = 'shop' + cx + '_' + cz;
    b.zone(zone, { x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, y0: 0, y1: 5 });
    b.floor(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 0.24, { mat: M.tile, zone });
    b.ceiling(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 4.2, { mat: M.paint, zone });
    // three solid walls, glass on the street side
    const s = face;   // +1 = opens toward +z
    b.wall(cx - w / 2, cz - s * d / 2, cx + w / 2, cz - s * d / 2, 0.24, 4.2, { mat: M.paint, zone });
    b.wall(cx - w / 2, cz - d / 2, cx - w / 2, cz + d / 2, 0.24, 4.2, { mat: M.paint, zone });
    b.wall(cx + w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 0.24, 4.2, { mat: M.paint, zone });
    b.windows(cx - w / 2 + 0.4, cz + s * d / 2, cx + w / 2 - 0.4, cz + s * d / 2, 0.24, 3.8,
      { zone, hp: 26, id: 'shopglass' + cx + '_' + cz });
    // shelving + counter
    for (let i = 0; i < 4; i++) {
      b.lockerBank(cx - w / 2 + 1.8 + i * 2.6, 0.24, cz - s * (d / 2 - 1.2), 0, 4);
    }
    b.bench(cx, 0.24, cz + s * (d / 2 - 2.2), 0, w * 0.5);
    for (let i = 0; i < 3; i++) b.stripLight(cx - w / 3 + i * (w / 3), 4.05, cz, w / 3.4, 'x', 0xfff0d8);
    b.neon(cx, 4.8, cz + s * (d / 2 + 0.2), w * 0.7, 1.1, hue, s > 0 ? 0 : Math.PI);
  };
  shop(-16, -45.5, 16, 8, 1, 0xff4f9f);
  shop(-18, 45.5, 16, 8, -1, 0x4fd8ff);
  shop(16, 45.5, 16, 8, -1, 0xffd84f);
  shop(-47.5, -16, 8, 16, 1, 0x8f4fff);
  shop(47.5, 16, 8, 16, -1, 0x4fe08a);
  shop(-47.5, 20, 8, 14, 1, 0xff8f4f);

  // ---- PEDESTRIAN DECK (south edge) --------------------------------------
  b.floor(-38, 30, 38, 38, DY, { mat: M.concrete, id: 'deck' });
  // gapped where the two flights arrive — a continuous rail along this edge
  // sealed the deck off completely
  b.railing(-30, 30, 30, 30, DY);
  // the deck's canopy, in two runs: the gantry stair climbs up through the slot
  // between them
  b.ceiling(-38, 30, 6, 38, DY + 3.6, { mat: M.darkMetal });
  b.ceiling(14, 30, 38, 38, DY + 3.6, { mat: M.darkMetal });
  b.stairs(-38, 23, -30, 30, 0.22, DY, 'z');
  b.stairs(30, 23, 38, 30, 0.22, DY, 'z');
  for (let i = 0; i < 9; i++) b.stripLight(-32 + i * 8, DY + 3.3, 34, 4, 'x', 0xdfeaff, i === 5 ? 0.4 : 0);
  // structural: the deck is carried by six columns. Drop them and the deck
  // section goes with them. Each stops 0.12 m under the slab — a column topping
  // out at exactly the deck height collides with anyone standing on the deck
  // beside it, which is an invisible blocker at the foot of every column.
  for (let i = 0; i < 6; i++) {
    b.pillar(-25 + i * 10, 34, 0.22, DY - 0.34, 0.5, { square: true, hp: 200, drops: ['deck'] });
  }

  // ---- THE SIGN GANTRY ---------------------------------------------------
  // The maintenance catwalk behind the south-east tower's screen. The deck was
  // the only thing above street level on a map 120 m across, so every fight
  // that wanted height had exactly one place to go and everyone knew where the
  // other player was. This is a second one, it is narrow, and it is a dead end
  // — which is the trade for the best sightline on the map.
  b.floor(6, 40.4, 34, 44, GY, { mat: M.darkMetal, id: 'gantry' });
  // The flight climbs OFF THE DECK, along z, and its top tread is the gantry's
  // own south edge. The first version ran along x through the strip of nothing
  // beyond the deck's north edge, so it started five metres above the pavement
  // and ended beside the gantry rather than on it — unreachable at both ends.
  b.stairs(8, 32, 12, 40.4, DY, GY, 'z', { mat: M.darkMetal });
  // the south rail, split around the stair head
  b.railing(12.5, 40.4, 34, 40.4, GY);
  b.railing(6, 44, 34, 44, GY, { collide: false });
  b.railing(6, 40.4, 6, 44, GY);
  b.railing(34, 40.4, 34, 44, GY);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.BoxGeometry(0.16, GY - DY, 0.16);
    g.translate(10 + i * 8, (GY + DY) / 2, 43.6);
    b.static_(g, M.metal);
  }
  for (let i = 0; i < 3; i++) b.stripLight(12 + i * 9, GY + 2.4, 42, 3.0, 'x', 0xffe0b0, i === 1 ? 0.5 : 0);
  b.bigScreen(20, GY + 4.4, 40.0, 24, 8, Math.PI, 275);

  // ---- SUNKEN STATION MOUTH (north-east) ---------------------------------
  // Cutting the road open is only half of it: `floorAt` falls back to a single
  // map-wide `groundY`, which is 0 here, and 0 beats -3.6 — so even through the
  // hole the fighter stood on the ground plane at street level. The plaza needs
  // the fallback lowered over its own footprint (and over the stair slot).
  b.pit(MX0, MZ0, MX1, MSZ, PY);
  b.floor(MX0 + 0.4, MZ0 + 0.4, MX1 - 0.4, MZ1, PY, { mat: M.tile, id: 'station' });
  b.stairs(MX0 + 0.4, MZ1, MSX, MSZ, PY, 0.22, 'z');
  b.wall(MX0, MZ0, MX0, MZ1, PY, 0.4, { mat: M.tileWall });
  b.wall(MX1, MZ0, MX1, MZ1, PY, 0.4, { mat: M.tileWall });
  b.wall(MX0, MZ0, MX1, MZ0, PY, 0.4, { mat: M.tileWall });
  // the lip of the hole, all the way round the opening cut above
  b.railing(MX0, MSZ, MX0, MZ0, 0.22, { collide: false });
  b.railing(MX1, MSZ, MX1, MZ0, 0.22, { collide: false });
  b.railing(MX0, MZ0, MX1, MZ0, 0.22, { collide: false });
  b.railing(MSX, MZ1, MX1, MZ1, 0.22, { collide: false });
  for (let i = 0; i < 4; i++) b.stripLight(24 + i * 4.5, 2.4, -30, 3.2, 'x', 0xcfe0f4);
  b.sign(30, 1.2, MZ1 - 0.4, 5, 1.1, 0x1d5a3c, 0);
  // benches and a kiosk down on the plaza, so it is a place and not a hole
  b.bench(26, PY, -34, 0, 3.0);
  b.bench(35, PY, -34, 0, 3.0);
  b.vending(24, PY, -25, Math.PI / 2, 0x2c78d8);
  b.vending(24, PY, -28, Math.PI / 2, 0xd8402c);

  // ---- STREET FURNITURE ---------------------------------------------------
  // Kept off z = ±34, which is under the pedestrian deck: a 5.4 m signal
  // standing under a 5.4 m slab tops out at exactly the deck's floor height,
  // and a collider whose top equals the floor beside it pushes anyone standing
  // there off the edge.
  for (const [x, z, ry] of [[-27, -34, 0], [27, -34, 0], [-27, 27, Math.PI], [27, 27, Math.PI]]) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 5.4, 8), M.darkMetal);
    pole.position.y = 2.7;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 0.34), M.darkMetal);
    head.position.set(0, 5.0, 0.2);
    g.add(pole, head);
    for (let i = 0; i < 3; i++) {
      const l = new THREE.Mesh(new THREE.CircleGeometry(0.12, 10), emissive([0xff3c3c, 0xffd84f, 0x4fe08a][i]));
      l.position.set(0, 5.4 - i * 0.34, 0.38);
      g.add(l);
    }
    g.position.set(x, 0.22, z);
    g.rotation.y = ry;
    b.add(g);
    b.bounds.wall(x - 0.25, z - 0.25, x + 0.25, z + 0.25, 0, 5.4, { id: 'sig' + x + '_' + z });
    b.breakable(g, {
      hp: 40, kind: 'metal', center: v3(x, 2.7, z), radius: 0.6, height: 5.4, baseY: 0.22,
      colliderIds: ['sig' + x + '_' + z]
    });
  }
  // parked cars along the kerb
  b.car(-44, 0.22, -26, 0, 0x2a3a6a);
  b.car(-44, 0.22, -6, 0, 0x6a2a2a);
  b.car(44, 0.22, 10, Math.PI, 0x24343c);
  b.car(-34, 0.22, 44, Math.PI / 2, 0x3a3a44);
  b.car(10, 0.22, -44, Math.PI / 2, 0x5a5a64);
  b.car(-8, 0.22, 44, Math.PI / 2, 0x2a5a4a);

  // ---- THE VEIL -----------------------------------------------------------
  // A curtain is what closes a district off so a fight can happen in the middle
  // of one of the busiest crossings on earth, and until now not one map in the
  // set showed the slightest sign of being a jujutsu site. This is the ward
  // laid over the scramble: a sigil burnt across the diagonals, big enough to
  // read from the pedestrian deck, and a second smaller one under the gantry.
  b.sigil(0, 0.05, 0, 26, 0x8f6aff, { rings: 3, spokes: 16, sides: 6, opacity: 0.30, spin: -0.03 });
  b.sigil(20, GY + 0.05, 42, 5.5, 0xff5a9f, { rings: 2, spokes: 8, sides: 3, opacity: 0.34, spin: 0.14 });

  // ---- OVERHEAD RUN -------------------------------------------------------
  // Feeder cables strung tower to tower across the crossing. They sit at 26 m,
  // well over anything anyone can reach, and they exist to give the sky over
  // the scramble something in it: the map's ceiling used to be one flat gap
  // between the rooflines.
  b.cable(v3(-32, 27, -42), v3(28, 25, -42), { sag: 2.4, r: 0.07 });
  b.cable(v3(-42, 24, 5), v3(-34, 26, 42), { sag: 2.0, r: 0.06 });
  b.cable(v3(42, 26, -8), v3(32, 25, 42), { sag: 2.2, r: 0.06 });
  b.cable(v3(-32, 22, -42), v3(42, 20, -8), { sag: 3.4, r: 0.05 });

  // ---- STREET LIFE --------------------------------------------------------
  // Awnings over the shop fronts, so the building line has something soft on
  // it, and a lantern run down the west pavement.
  for (const [ax, az, aw, ary, ac] of [
    [-16, -41.2, 15, 0, 0xd8324f], [-18, 41.8, 15, Math.PI, 0x2f7fd8],
    [16, 41.8, 15, Math.PI, 0xd8a52f], [-43.2, -16, 15, Math.PI / 2, 0x6a2fd8],
    [43.2, 16, 15, -Math.PI / 2, 0x2fd88a]
  ]) b.banner(ax, 4.9, az, aw, 1.5, ac, { ry: ary, amp: 0.10 });
  b.lanternString(v3(-52, 6.4, -30), v3(-52, 6.4, -10), { color: 0xffb86a });
  b.lanternString(v3(-52, 6.4, -10), v3(-52, 6.4, 10), { color: 0xffb86a });

  // ---- ROADWORKS (north-west pavement) ------------------------------------
  // Cover on a map whose defining feature is having none, deliberately placed
  // OFF the crossing itself: the open middle is the reason the long-range
  // characters have a map here at all and nothing is allowed on it. The drums
  // are the gimmick — break one and the row goes up, and the whole barricade
  // and the crate stacks behind it stop existing.
  for (let i = 0; i < 4; i++) b.drum(-46 + i * 1.1, 0.22, -34, { color: 0xc4562c });
  b.crates(-46, 0.22, -30, { count: 3 });
  b.crates(-44.2, 0.22, -31.4, { count: 2 });
  b.crates(46, 0.22, 30, { count: 3 });
  b.crates(44.2, 0.22, 31.6, { count: 2 });
  for (let i = 0; i < 3; i++) b.drum(44 + i * 1.1, 0.22, 34, { color: 0xb8483c });
  b.beacon(-46, 1.6, -36, 0xffa03c, { reach: 4.0 });
  b.beacon(46, 1.6, 36, 0xffa03c, { reach: 4.0 });

  // ---- THE BROKEN MAIN ----------------------------------------------------
  // A burst water main pouring off the lip of the station mouth into the plaza
  // below, with the steam of the district coming up through the road beside it.
  b.waterfall(MX0 + 5, 0.1, MZ0 + 0.3, 3.0, 3.6, { ry: 0, color: 0x8fc8e0, speed: 2.1 });
  b.mist(MX0, MZ0, MX1, MZ1, PY, 0x7f96b8, { opacity: 0.30, scale: 14 });
  b.godRay(30, 0.4, -30, 4.5, 3.8, 0xcfe0ff, { opacity: 0.10, taper: 0.5 });
  for (const [sx, sz] of [[-12, -30], [8, 26], [-30, 12], [36, -4]]) {
    b.steamVent(sx, 0.24, sz, { height: 4.2, period: 3.2, opacity: 0.24, color: 0xc8d4e4 });
  }
  b.sparker(20, GY + 3.0, 43.4, { color: 0xbfe4ff });
  b.sparker(-38, 5.6, 30.4, { color: 0xbfe4ff });

  // ---- RAIN + NEON HAZE ---------------------------------------------------
  b.particles(1200, { x0: -58, x1: 58, y0: 0, y1: 38, z0: -52, z1: 52 },
    { color: 0x9fc0e8, size: 0.055, opacity: 0.34, vy: [-16, -9] });
  b.particles(160, { x0: -52, x1: 52, y0: 0.2, y1: 8, z0: -48, z1: 48 },
    { color: 0xff8fc8, size: 0.10, opacity: 0.22, vy: [0.1, 0.5] });
  // wet asphalt: a broad specular sheet catching the signs
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(92, 84), glowMaterial(0x3c5f9f, 0.10));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.y = 0.03;
  b.add(sheen);

  b.bounds.spawns = [v3(-10, 0, 0), v3(10, 0, 0), v3(0, 0, -11), v3(0, 0, 11)];
  return b;
}
