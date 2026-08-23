// TOMBS OF THE STAR CORRIDOR — the mountain shrine where Gojo lost, and then
// did not. The Hidden Inventory job: escort the Star Plasma Vessel to Tengen,
// which means the long torii-lined climb, the shrine at the head of it, and the
// stone burial corridor underneath that the whole site exists to protect.
//
// REFERENCE NOTE (researched): a night-time mountain shrine reached by a
// straight flight of stone steps under a corridor of vermilion torii, cedar
// forest crowding both sides, a stone-flagged shrine terrace at the top with
// lanterns and a small hall — and beneath it, cut into the rock, a low vaulted
// passage of dressed stone leading to a chamber. Cold moonlight above, no
// daylight at all below. A real approach of this length is broken by a landing
// partway up with a chōzuya on it, which is where the middle terrace comes
// from.
//
// WHY THIS MAP EXISTS IN THE SET: it is the only one whose two halves are a
// wide-open exposed climb and a genuinely CLAUSTROPHOBIC interior stacked
// directly on top of each other, and the only stone-and-cedar map that is shot
// at night. It reads as neither Jujutsu High nor the detention centre.
//
// LAYOUT (100 x 92 m):
//   y = -6.20  TOMB         the burial corridor and the vessel chamber, one
//                           level down under the whole shrine terrace. Reached
//                           by the stair in the terrace's own floor.
//   y =  0.00  APPROACH     the forest floor and the foot of the steps — open
//                           ground, the widest part of the map.
//   y =  3.00  MID LANDING  the halfway platform, with the water basin on it.
//                           It splits a 20 m staircase into two fights.
//   y =  7.20  TERRACE      the shrine platform at the head of the climb:
//                           flagstone, lanterns, and the hall on its axis.
//   y = 11.10  HALL ROOF    the highest ground, off the terrace's east steps.
//   VERTICAL                two flights up the climb, the tomb stair down
//                           through the terrace floor, and the roof steps.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'star_tomb',
  name: 'TOMBS OF THE STAR',
  jp: '星漿体の廟',
  desc: 'A torii climb by moonlight, and the stone corridor buried under it.',
  extent: { minX: -50, maxX: 50, minZ: -46, maxZ: 46 },
  // Mountain shrine grounds: forest floor, cut stone, bedrock. Natural by
  // default, and the flagstone terrace and the dressed tomb are the exceptions
  // — so this is a strong map for Hanami on the approach and a poor one for him
  // in the tomb, which is the split the layout is built around anyway.
  terrain: NATURAL,
  background: 0x0b1020,
  fog: { color: 0x121a2e, near: 44, far: 170 },
  grade: { vignette: 0.58, tint: [0.92, 0.98, 1.16], lift: 0.004, sat: 0.84 },
  lights: {
    key: { color: 0xbcd4ff, intensity: 1.25, pos: [-6, 24, 12] },
    rim: { color: 0xd8703c, intensity: 0.62, pos: [10, 7, -12] },   // lantern warmth
    hemi: { sky: 0x36497a, ground: 0x1c2018, intensity: 0.5 }
  },
  // straight up the torii corridor: the scatter keeps the axis clear
  previewCam: { pos: [0, 8.0, 38], look: [0, 6.0, -18] },
  shadowScale: 1.05,
  shrineScale: 0.95,      // long and narrow: plenty of room to run, only one way
  size: '100 × 92 m · torii climb, shrine terrace, buried corridor'
};

const MY = 3.0;                     // mid landing
const TY = 7.2;                     // shrine terrace
const BY = -6.2;                    // tomb floor
const TX = 26, TZ0 = -34, TZ1 = -8; // terrace footprint

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const TOMB = 'tomb';

  b.sky(0x060a16, 0x0d1730, 0x243050, 360);
  b.groundPlane(0x141c14, 300);
  b.skyline(18, 200, { color: 0x141f28, shape: 'ridge', minW: 80, maxW: 170, minH: 46, maxH: 110 });

  // ---- APPROACH -----------------------------------------------------------
  // Laid with the shrine's footprint cut out of it. The forest floor is a
  // single slab over the whole map, and a single slab at y = 0 sits directly
  // between the terrace above and the tomb below — `floorAt` takes the highest
  // surface, so the tomb stair descended to y = 0 and stopped there, in mid-air
  // inside the hill. Under the terrace there is no ground: there is a tomb.
  b.floorHole(-50, -46, 50, 46, 0, { x0: -TX, z0: TZ0, x1: TX, z1: TZ1 }, { mat: M.grass });
  // the gravel path running up the axis to the foot of the steps
  b.floor(-5.5, 14, 5.5, 44, 0.05, { mat: M.concrete });

  // ---- THE CLIMB: two flights and a landing -------------------------------
  // Authored bottom-first — (x0,z0) is the end at yLow — so each flight climbs
  // north as you walk it. A single 20 m staircase was one long committed run
  // with nothing to fight over; the landing gives the climb a middle.
  b.stairs(-6, 14, 6, 8, 0.05, MY, 'z', { mat: M.concrete });
  b.floor(-9, 2, 9, 8, MY, { mat: M.concrete, id: 'landing' });
  b.stairs(-6, 2, 6, -8, MY, TY, 'z', { mat: M.concrete });
  stairCheeks(b, M, -6, 14, 6, 8, 0.05, MY);
  stairCheeks(b, M, -6, 2, 6, -8, MY, TY);
  // the landing's own retaining face, so it is cut into the bank rather than
  // hovering over the forest floor. Drawn only — the flights are the way on
  // and off, and a collider here would fence them.
  // Each is 0.7 m thick and drawn to the landing's own height, so it stands
  // proud of the deck it retains on three sides — 34 cells of visible stone rim
  // with a 3 m drop under it. Drawn only, as the comment above says, but a lip
  // is not a blocker: it puts a floor on what is already drawn without fencing
  // the flights.
  for (const [x0, z0, x1, z1] of [[-9.4, 2, -9.4, 8], [9.4, 2, 9.4, 8], [-9.4, 8.4, 9.4, 8.4]]) {
    b.wall(x0, z0, x1, z1, 0, MY, { mat: M.rock, thick: 0.7, collide: false });
  }
  // The lip on those three faces, SPLIT AROUND THE FLIGHT. The south face is
  // drawn straight across the head of the lower staircase, so a lip laid along
  // the whole of it wins the `floorAt` query while the fighter is still on the
  // top treads and the flight surfaces through solid rock — the validator
  // called it BURIED the moment the first version went in, which is the same
  // fault the hall roof's eave lip had two hundred lines up and the reason
  // both are written out rather than looped.
  for (const sx of [-9.75, 9.05]) b.lip(sx, 1.65, sx + 0.7, 8.75, MY);
  for (const [a, c] of [[-9.75, -6.5], [6.5, 9.75]]) b.lip(a, 8.05, c, 8.75, MY);
  // THE CHŌZUYA — the water basin every shrine approach has a landing for.
  {
    const bas = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 1.5), M.rock);
    bas.position.set(6.6, MY + 0.45, 5);
    b.add(bas);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.2), glowMaterial(0x7fc8e0, 0.4));
    w.rotation.x = -Math.PI / 2;
    w.position.set(6.6, MY + 0.92, 5);
    b.add(w);
    b.bounds.wall(5.4, 4.25, 7.8, 5.75, MY, MY + 0.9, { id: 'basin' });
    b.bounds.platform(5.4, 4.25, 7.8, 5.75, MY + 0.9);
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.4, 6), M.wood);
      p.position.set(5.6 + (i % 2) * 2.0, MY + 1.2, 4.4 + ((i / 2) | 0) * 1.2);
      b.add(p);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.24, 2.4), M.rock);
    roof.position.set(6.6, MY + 2.5, 5);
    b.add(roof);
  }

  // TORII CORRIDOR straddling the climb. Each gate stands on the step under it,
  // so they march up the flights rather than hanging over them.
  const gate = (z, y, s = 1) => {
    const g = new THREE.Group();
    const vermilion = new THREE.MeshBasicMaterial({ color: 0x9c2f33 });
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 3.7 * s, 8), vermilion);
      p.position.set(sx * 2.3, 1.85 * s, 0);
      g.add(p);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.28, 0.44), vermilion);
    top.position.y = 3.65 * s;
    const mid = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.21, 0.32), vermilion);
    mid.position.y = 3.0 * s;
    g.add(top, mid);
    g.position.set(0, y, z);
    b.add(g);
    // Deliberately NOT collidable. Gate legs 4.6 m apart down the only route
    // between the two halves of the map would make the climb a slalom; they are
    // dressing on a corridor, and the corridor has to stay one.
  };
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    gate(14 - 6 * t, 0.05 + (MY - 0.05) * t);
  }
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12;
    gate(2 - 10 * t, MY + (TY - MY) * t);
  }

  // ---- SHRINE TERRACE -----------------------------------------------------
  // The stair lands on the terrace's south edge, and the terrace is laid with
  // the tomb stairwell already cut out of it.
  const TWELL = { x0: 17, z0: -28, x1: 23, z1: -12 };
  b.floorHole(-TX, TZ0, TX, TZ1, TY, TWELL, { mat: M.concrete, id: 'terrace' });
  // The terrace's retaining wall, split where the great stair arrives, and
  // STOPPED 0.12 m BELOW the deck it holds up: `resolveWalls` skips a wall only
  // when `y > w.y1`, so a retaining wall topping out at exactly the terrace
  // height shoves anyone standing on that edge back off it.
  for (const [x0, x1] of [[-TX, -6.6], [6.6, TX]]) {
    b.wall(x0, TZ1, x1, TZ1, 0, TY, { mat: M.rock, thick: 0.7, collide: false });
    b.bounds.wall(x0, TZ1 - 0.5, x1, TZ1 + 0.4, 0, TY - 0.12, { id: 'terrwall' + x0 });
  }
  for (const s of [-1, 1]) {
    b.wall(s * TX, TZ0, s * TX, TZ1, 0, TY, { mat: M.rock, thick: 0.7, collide: false });
    b.bounds.wall(s * TX - 0.4, TZ0, s * TX + 0.4, TZ1, 0, TY - 0.12, { id: 'terrside' + s });
  }
  b.wall(-TX, TZ0, TX, TZ0, 0, TY, { mat: M.rock, thick: 0.7, collide: false });
  b.bounds.wall(-TX, TZ0 - 0.4, TX, TZ0 + 0.4, 0, TY - 0.12, { id: 'terrback' });
  // rails down the two long sides of the tomb well and its far end only. The
  // near end is the head of the stair — railing it off is how you build a
  // staircase nobody can use, and it is the single most common way to do it.
  b.railing(TWELL.x0, TWELL.z0, TWELL.x0, TWELL.z1, TY);
  b.railing(TWELL.x1, TWELL.z0, TWELL.x1, TWELL.z1, TY);
  b.railing(TWELL.x0, TWELL.z1, TWELL.x1, TWELL.z1, TY);

  // stone lanterns down both sides of the terrace
  for (let i = 0; i < 7; i++) {
    for (const s of [-1, 1]) {
      // the east row sits at 14, not 20: 20 is inside the tomb well
      const x = s > 0 ? 14 : -22, z = -11 - i * 3.2;
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.7, 6), M.rock);
      post.position.y = 0.85;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.44, 0.38, 4), M.rock);
      cap.position.y = 2.2;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), emissive(0xffb45e));
      box.position.y = 1.88;
      g.add(post, cap, box);
      g.position.set(x, TY, z);
      b.add(g);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), haloMaterial(0xff9c4e, 0.26));
      halo.position.set(x, TY + 1.9, z);
      b.add(halo);
      b.breakable(g, { hp: 20, kind: 'concrete', center: v3(x, TY + 1.1, z), radius: 0.5, height: 2.4, baseY: TY });
    }
  }

  // ---- THE HALL, on the terrace's axis ------------------------------------
  const HY = 11.1;
  const HX0 = -14, HX1 = 6, HZ0 = -31, HZ1 = -17;
  b.wall(HX0, HZ0, HX0, HZ1, TY, HY - 0.4, { mat: M.wood });
  b.wall(HX1, HZ0, HX1, HZ1, TY, HY - 0.4, { mat: M.wood });
  b.wall(HX0, HZ0, HX1, HZ0, TY, HY - 0.4, { mat: M.wood });
  // the south face is shoji: it breaks, and the hall opens onto the terrace
  for (let i = 0; i < 3; i++) {
    const x0 = HX0 + 0.6 + i * 6.4;
    b.windows(x0, HZ1, x0 + 5.8, HZ1, TY, HY - 0.6, {
      hp: 14, id: 'starshoji' + i,
      mat: new THREE.MeshBasicMaterial({ color: 0xe8e0cc, transparent: true, opacity: 0.85 })
    });
  }
  b.floor(HX0, HZ0, HX1, HZ1, TY + 0.1, { mat: M.wood });
  b.ceiling(HX0, HZ0, HX1, HZ1, HY - 0.5, { mat: M.wood });
  // HALL ROOF — the highest ground. Flat and walkable, pitch on the perimeter.
  b.floor(HX0 - 1.8, HZ0 - 1.8, HX1 + 1.8, HZ1 + 1.8, HY, { mat: M.rock, id: 'starroof' });
  // THE EAVES, and the lip they need. Each is drawn 1.8 m oversized so the tiled
  // edge reads as a deep overhang, which means it stands proud of the roof deck
  // on every side — 314 cells of visible tile you could see, land on and drop
  // eleven metres through. The biggest rim on this map and the second biggest
  // in the set. The eave top is 0.34 m BELOW the deck, so lipping it does not
  // add high ground; it adds a floor to the fringe that was already drawn.
  for (const [x0, z0, x1, z1] of [
    [HX0 - 1.8, HZ0 - 1.8, HX0 - 0.4, HZ1 + 1.8], [HX1 + 0.4, HZ0 - 1.8, HX1 + 1.8, HZ1 + 1.8],
    [HX0 - 1.8, HZ0 - 1.8, HX1 + 1.8, HZ0 - 0.4], [HX0 - 1.8, HZ1 + 0.4, HX1 + 1.8, HZ1 + 1.8]
  ]) {
    const g = new THREE.BoxGeometry(x1 - x0 + 1.8, 0.32, z1 - z0 + 1.8);
    g.translate((x0 + x1) / 2, HY - 0.5, (z0 + z1) / 2);
    b.static_(g, M.rock);
  }
  // The lip, authored as its own rects rather than inside the loop above, so
  // the EAST eave can be split around the flight that lands on this roof. The
  // stair's top tread is at HY and the eave top is 0.34 m under it, so a lip
  // laid straight across the stair head wins the `floorAt` query while the
  // fighter is still on the treads — the flight surfaces through solid tile,
  // which is the exact fault `floorHole` exists for and which the validator
  // caught the moment the first version of this lip went in.
  const EX0 = HX0 - 2.7, EX1 = HX1 + 2.7, EZ0 = HZ0 - 2.7, EZ1 = HZ1 + 2.7;
  const EY = HY - 0.18;
  b.lip(EX0, EZ0, HX0 - 0.4, EZ1, EY);                    // west eave
  b.lip(EX0, EZ0, EX1, HZ0 - 0.4, EY);                    // north eave
  b.lip(EX0, HZ1 + 0.4, EX1, EZ1, EY);                    // south eave
  for (const [z0, z1] of [[EZ0, -26.2], [-18.8, EZ1]]) {  // east eave, split
    b.lip(HX1 + 0.4, z0, EX1, z1, EY);
  }
  // steps up the hall's east side, landing on the roof's edge (and clear of
  // the tomb well, which is further east again)
  b.stairs(15, -26, HX1 + 1.8, -19, TY, HY, 'x', { mat: M.rock });
  for (let i = 0; i < 4; i++) b.stripLight(HX0 + 3.5 + i * 4.5, HY - 1.4, (HZ0 + HZ1) / 2, 2.6, 'x', 0xffc98a);

  // ---- THE TOMB, one level down under the terrace -------------------------
  // Same trap the pool hall fell into: a room below the map's single `groundY`
  // is unreachable until the fallback floor is lowered over its footprint.
  b.zone(TOMB, { x0: -TX - 1, x1: TX + 1, z0: TZ0 - 1, z1: TZ1 + 1, y0: -8, y1: 1 });
  b.pit(-TX + 0.4, TZ0 + 0.4, TX - 0.4, TZ1 - 0.4, BY);
  b.floor(-25, TZ0 + 1, 25, TZ1 - 1, BY, { mat: M.tile, zone: TOMB });
  // THE CEILING IS LAID AROUND THE STAIRWELL. As one slab it ran straight
  // across the well cut in the terrace above it, so the only way into the tomb
  // was a flight descending through a metre of drawn concrete — and the slab's
  // cut edge sat inside the opening as a ledge with the whole tomb under it.
  // Same rule the floors on every map in this set already follow: if there is a
  // hole, the thing spanning it has the hole in it too.
  for (const [cx0, cz0, cx1, cz1] of [
    [-25, TZ0 + 1, TWELL.x0, TZ1 - 1], [TWELL.x1, TZ0 + 1, 25, TZ1 - 1],
    [TWELL.x0, TZ0 + 1, TWELL.x1, TWELL.z0], [TWELL.x0, TWELL.z1, TWELL.x1, TZ1 - 1]
  ]) {
    if (cx1 - cx0 < 0.05 || cz1 - cz0 < 0.05) continue;
    b.ceiling(cx0, cz0, cx1, cz1, TY - 1.0, { mat: M.concreteWall, zone: TOMB });
  }
  for (const [x0, z0, x1, z1] of [
    [-25.4, TZ0 + 1, -25.4, TZ1 - 1], [25.4, TZ0 + 1, 25.4, TZ1 - 1],
    [-25, TZ0 + 0.6, 25, TZ0 + 0.6], [-25, TZ1 - 0.6, 25, TZ1 - 0.6]
  ]) b.wall(x0, z0, x1, z1, BY, TY - 1.0, { mat: M.tileWall, zone: TOMB });

  // THE STAIR DOWN, through the well cut in the terrace. Authored bottom-first.
  // The top tread meets the terrace's own edge exactly: half a metre of
  // daylight at the head of a flight is a hole to fall down, not a landing.
  b.stairs(TWELL.x0 + 0.6, TWELL.z1 - 0.6, TWELL.x1 - 0.6, TWELL.z0, BY, TY, 'z',
    { mat: M.tile, zone: TOMB });

  // Vaulted bays down the corridor. Kept west of the stairwell so none of them
  // stands in the only flight — a 1.1 m column in the middle of it would plug
  // it as surely as a wall.
  for (let i = 0; i < 6; i++) {
    const x = -20 + i * 7;
    for (const z of [TZ0 + 6, TZ1 - 6]) {
      b.pillar(x, z, BY, TY - 1.0 - BY, 0.55, { square: true, mat: M.tileWall, hp: 240, zone: TOMB });
    }
    b.stripLight(x, TY - 1.6, (TZ0 + TZ1) / 2, 3.0, 'x', 0x8fd8c0, i === 2 ? 0.55 : 0);
  }

  // THE VESSEL CHAMBER at the west end: a raised stone dais, and the one thing
  // in the tomb worth standing on.
  b.floor(-22, -28, -12, -18, BY + 1.3, { mat: M.rock, id: 'dais' });
  b.slope(-8, -26, -12, -20, BY, BY + 1.3, 'x', { mat: M.rock, depth: 0.5, zone: TOMB });
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.1, 6, 32), emissive(0x6fe0c8));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-17, BY + 1.35, -23);
    b.add(ring);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(4.4, 24), haloMaterial(0x4fd8b8, 0.24));
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(-17, BY + 1.4, -23);
    b.add(glow);
    let t = 0;
    b.tickers.push(dt => { t += dt; glow.material.opacity = 0.12 + Math.sin(t * 1.3) * 0.07; });
  }

  // ---- FOREST + AMBIENT ---------------------------------------------------
  const near = [], far = [];
  for (let i = 0; i < 150; i++) {
    const a = rand(0, Math.PI * 2), r = rand(16, 48);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 11 && z > -6) continue;             // keep the climb clear
    if (x > -TX - 3 && x < TX + 3 && z < TZ1 + 2) continue; // keep the terrace clear
    (r < 28 && near.length < 16 ? near : far).push([x, z]);
  }
  for (const [x, z] of near) b.tree(x, 0, z, rand(1.2, 2.0));
  const fi = far.map(([x, z]) => ({ x, y: 0, z, s: rand(1.3, 2.4), ry: rand(0, 6.3) }));
  b.repeat(new THREE.CylinderGeometry(0.2, 0.36, 4.4, 6), M.trunk,
    fi.map(f => ({ ...f, y: 2.2 * f.s, s: f.s, sy: f.s })));
  b.repeat(new THREE.SphereGeometry(2.0, 8, 6), M.foliage,
    fi.map(f => ({ ...f, y: 5.8 * f.s, s: f.s })));

  // =========================================================================
  // MOONLIGHT, LANTERNS, AND WHAT IS SEALED DOWN THERE
  // =========================================================================
  // The two halves of this map are an exposed climb under an open night sky and
  // a sealed stone corridor with no daylight in it at all, and neither of them
  // was lit like that: the climb had lanterns on the terrace only and the tomb
  // had six strip lights. What follows is the difference between the two, said
  // in light.

  // ---- THE CLIMB ----------------------------------------------------------
  // Moonlight coming down through the cedar either side of the torii corridor,
  // and lanterns hung under the gates so the corridor has a colour of its own
  // to be seen against.
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.7;
    const r = 20 + (i % 3) * 9;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 10 && z > -6) continue;               // the corridor stays clear
    if (x > -TX - 3 && x < TX + 3 && z < TZ1 + 2) continue; // and so does the terrace
    b.godRay(x, 20, z, 2.8, 20, 0xbcd4ff,
      { opacity: 0.055, taper: 0.3, lean: [2.2, -3.2], range: 90 });
  }
  // and three down the corridor itself. The gates are the one thing on this map
  // worth backlighting, and the scatter rule above deliberately keeps the axis
  // clear of geometry — which had left the whole approach unlit as well.
  b.godRay(-2, 24, 34, 5.5, 24, 0xbcd4ff, { opacity: 0.06, taper: 0.34, lean: [3.0, -5.0], range: 120 });
  b.godRay(4, 22, 20, 3.6, 22, 0xbcd4ff, { opacity: 0.06, taper: 0.3, lean: [2.0, -3.4], range: 110 });
  b.godRay(-3, 20, 6, 3.0, 17, 0xbcd4ff, { opacity: 0.06, taper: 0.3, lean: [1.6, -2.6], range: 100 });
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8;
    const z = 14 - 6 * t, y = 0.05 + (MY - 0.05) * t;
    b.lanternString(v3(-2.2, y + 2.7, z), v3(2.2, y + 2.7, z), { color: 0xff9c4e, sag: 0.28, count: 2 });
  }
  for (let i = 0; i < 11; i++) {
    const t = (i + 0.5) / 11;
    const z = 2 - 10 * t, y = MY + (TY - MY) * t;
    b.lanternString(v3(-2.2, y + 2.7, z), v3(2.2, y + 2.7, z), { color: 0xff9c4e, sag: 0.28, count: 2 });
  }
  // ground mist lying in the forest and pouring down the steps, which is what
  // a mountain shrine at night actually looks like
  b.mist(-48, 10, 48, 44, 0, 0x8fa8c8, { opacity: 0.16, scale: 26 });
  b.mist(-48, -44, -30, 20, 0, 0x8fa8c8, { opacity: 0.16, scale: 26 });
  b.mist(30, -44, 48, 20, 0, 0x8fa8c8, { opacity: 0.16, scale: 26 });
  b.mist(-TX, TZ0, TX, TZ1, TY, 0x9fb4d8, { opacity: 0.13, scale: 14 });

  // ---- THE CHŌZUYA RUNS ---------------------------------------------------
  // A spout with water actually coming out of it. The basin had a flat blue
  // rectangle laid on it and nothing feeding it.
  b.waterfall(6.6, MY + 1.75, 5.5, 0.34, 0.85, { color: 0xcfeef8, opacity: 0.6, speed: 3.0 });
  b.steamVent(6.6, MY + 0.95, 5, { height: 1.4, period: 4.6, opacity: 0.16, color: 0xcfe4f0, spread: 1.2 });

  // ---- THE SHRINE ---------------------------------------------------------
  // Noren across the hall's shoji face, shide streamers off the terrace
  // lanterns' line, and the ward drawn on the flagstones.
  for (let i = 0; i < 3; i++) {
    b.banner(HX0 + 3.4 + i * 6.4, HY - 0.9, HZ1 + 0.25, 4.6, 1.4, 0x7a1f2c, { ry: 0, amp: 0.08 });
  }
  b.sigil(-4, TY + 0.04, -14, 8.5, 0x6fe0c8, { rings: 3, spokes: 16, sides: 6, opacity: 0.22, spin: -0.03 });
  b.sigil(0, MY + 0.04, 5, 3.2, 0xffb45e, { rings: 2, spokes: 8, sides: 4, opacity: 0.26, spin: 0.12 });
  b.sigil(0, 0.06, 30, 6.0, 0xffb45e, { rings: 2, spokes: 10, sides: 3, opacity: 0.20, spin: -0.06 });

  // ---- THE TOMB -----------------------------------------------------------
  // The one shaft of anything that reaches this room comes down its own
  // stairwell, and it is the only reason the corridor has a far end.
  b.godRay(20, TY - 0.2, -20, 3.4, TY - BY - 0.2, 0xbcd4ff,
    { opacity: 0.10, taper: 0.5, lean: [-1.4, -2.0], poolGain: 1.2, range: 60 });
  for (let i = 0; i < 5; i++) {
    b.hangingLamp(-18 + i * 8.5, TY - 1.2, -21, 1.6, 0x6fe0c8, { amp: 0.035, range: 44 });
  }
  b.mist(-24, TZ0 + 2, 24, TZ1 - 2, BY, 0x3f7f74, { opacity: 0.22, scale: 11 });
  // the ward around the dais, and the two that hold the corridor shut
  b.sigil(-17, BY + 1.36, -23, 5.6, 0x4fd8b8, { rings: 3, spokes: 14, sides: 5, opacity: 0.34, spin: 0.07 });
  b.sigil(6, BY + 0.03, -21, 4.4, 0x4fd8b8, { rings: 2, spokes: 10, sides: 3, opacity: 0.24, spin: -0.10 });
  b.sigil(22, BY + 0.03, -21, 3.4, 0x4fd8b8, { rings: 2, spokes: 8, sides: 3, opacity: 0.24, spin: 0.10 });

  // ---- WHAT WAS LEFT IN HERE ---------------------------------------------
  // Sealed vessels down the corridor and crates in the bays. The vessels are
  // `drum` under the paint — a warded jar in a burial corridor goes off exactly
  // as hard as a fuel drum does, and this is the tightest room in the set to be
  // standing in when a row of them does.
  for (let i = 0; i < 4; i++) b.drum(2 + i * 1.05, BY, -21, { color: 0x4a5a52, markColor: 0x6fe0c8 });
  for (let i = 0; i < 3; i++) b.drum(-3 - i * 1.05, BY, -31, { color: 0x4a5a52, markColor: 0x6fe0c8 });
  b.crates(11, BY, -30.5, { count: 2 });
  b.crates(12.8, BY, -31.8, { count: 1 });
  b.crates(-21, BY, -12, { count: 3 });
  b.crates(-19.2, BY, -13.4, { count: 2 });
  // and the porters' kit at the foot of the climb, off the gravel path
  b.crates(11, 0, 22, { count: 3 });
  b.crates(12.8, 0, 20.6, { count: 2 });
  b.crates(-11, 0, 26, { count: 2 });

  // moonlight in the cedar, and cold dust in the tomb
  b.particles(260, { x0: -48, x1: 48, y0: 0.4, y1: 22, z0: -44, z1: 44 },
    { color: 0xbfd0f0, size: 0.07, opacity: 0.26, vy: [-0.5, -0.1] });
  b.particles(120, { x0: -24, x1: 24, y0: -6, y1: 5, z0: TZ0 + 2, z1: TZ1 - 2 },
    { color: 0x8fd8c0, size: 0.06, opacity: 0.3, vy: [0.05, 0.35] });

  b.bounds.spawns = [v3(-4, 0.05, 20), v3(4, 0.05, 20), v3(-12, TY, -14), v3(15, TY, -14)];
  return b;
}

// The retaining cheeks either side of a flight, so it reads as cut into a bank
// rather than sitting on the grass. Drawn only — a collider on the cheek of a
// staircase narrows the staircase.
function stairCheeks(b, M, x0, z0, x1, z1, yLow, yHigh) {
  const n = 16;
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const y = yLow + (yHigh - yLow) * (t0 + t1) / 2;
      const cx = s < 0 ? Math.min(x0, x1) - 0.6 : Math.max(x0, x1) + 0.6;
      const cz = z0 + (z1 - z0) * (t0 + t1) / 2;
      const len = Math.abs(z1 - z0) / n;
      const g = new THREE.BoxGeometry(1.2, y + 1.4, len);
      g.translate(cx, (y + 1.2) / 2 - 0.7, cz);
      b.static_(g, M.rock);
      // AND A TOP ON IT. Each cheek is a 1.2 m wide stone parapet whose drawn
      // top sits 0.6 m above the tread beside it — over STEP_UP, so it is not
      // somewhere you can walk onto, and squarely somewhere you can be thrown
      // onto. Without this it is 1.2 m of visible masonry running the whole
      // length of both flights that a fighter lands on and falls straight
      // through, onto the steps or off the side of the climb. `mapcheck.rims()`
      // reported it as fourteen separate findings, one per height band, which
      // is what one continuous fault on a slope looks like from a grid probe.
      //
      // A LIP AND NOT A WALL, deliberately: the cheeks carry no blocker on
      // purpose (a collider on the cheek of a staircase narrows the staircase)
      // and that has to stay true.
      b.lip(cx - 0.6, cz - len / 2, cx + 0.6, cz + len / 2, y + 0.6);
    }
  }
}
