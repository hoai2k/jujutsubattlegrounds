// TOMBS OF THE STAR CORRIDOR — the mountain shrine where Gojo lost, and then
// did not. The Hidden Inventory job: escort the Star Plasma Vessel to Tengen.
//
// REFERENCE NOTE (researched): the KOFUN — a burial mound. A stepped earthwork
// of concentric terraces rising to a shrine on its summit, a torii-lined
// processional stair climbing one face of it, and the thing the whole mound
// exists to cover buried underneath: a round stone chamber under a corbelled
// dome, ringed with pillars, reached by one shaft cut down through the summit.
//
// WHY THIS SHAPE. The previous version was a straight flight between two
// rectangular retaining walls up to a rectangular terrace with a rectangular
// hall on it, over a rectangular corridor — four boxes stacked, which is what
// most of this set was. A mound is the opposite idea: you go UP by going
// AROUND, every terrace is a ring you can be chased along, the summit is small
// and exposed because it is the top of a hill rather than the end of a
// corridor, and the tomb underneath is one round room with a dome on it.
//
// The map's identity survives it: it is still a torii climb by moonlight with a
// buried stone chamber under it, and it is still the only map here whose two
// halves are an exposed climb and a sealed interior stacked on each other.
//
// LAYOUT (108 x 100 m):
//   y = -7.20  THE CHAMBER   a round stone room under a corbelled dome, ringed
//                            with pillars, with the vessel's dais in the middle.
//   y =  0.00  APPROACH      forest floor round the foot of the mound.
//   y =  2.40  FIRST TERRACE the mound's lowest ring.
//   y =  4.80  SECOND TERRACE
//   y =  7.20  THE SUMMIT    the shrine platform: an octagonal hall, the
//                            lantern ring, and the shaft down into the chamber.
//   VERTICAL                 the torii stair up the south face, one flight
//                            between each terrace on a different bearing, and
//                            the helical shaft down to the tomb.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'star_tomb',
  name: 'TOMBS OF THE STAR',
  jp: '星漿体の廟',
  desc: 'A stepped burial mound by moonlight, and the domed chamber under it.',
  extent: { minX: -54, maxX: 54, minZ: -50, maxZ: 50 },
  // Mound and forest: earth, turf and cut stone. Natural by default, and the
  // summit's flagstones and the dressed tomb are the exceptions — so this is a
  // strong map for Hanami on the climb and a poor one for him underneath it.
  terrain: NATURAL,
  background: 0x0b1020,
  fog: { color: 0x121a2e, near: 46, far: 180 },
  grade: { vignette: 0.56, tint: [0.92, 0.98, 1.16], lift: 0.006, sat: 0.86 },
  lights: {
    key: { color: 0xbcd4ff, intensity: 1.05, pos: [-6, 24, 12] },
    rim: { color: 0xd8703c, intensity: 0.68, pos: [10, 7, -12] },   // lantern warmth
    hemi: { sky: 0x3a4f82, ground: 0x2c2a1e, intensity: 0.62 }
  },
  // straight up the torii stair, which is the one bearing the scatter keeps clear
  previewCam: { pos: [0, 12.5, 48], look: [0, 6.5, -4] },
  shadowScale: 1.05,
  shrineScale: 0.95,
  size: '108 × 100 m · stepped mound, octagonal shrine, domed burial chamber'
};

const T1 = 2.4, T2 = 4.8, SUM = 7.2;     // the three terraces
const BY = -7.2;                          // the chamber floor
// THE TERRACES TILE THE MOUND, each a RING that starts where the next one up
// ends. Built as solid discs they paved over everything under them — the T2
// disc alone was a lid at 4.8 across the whole shaft and the whole burial
// chamber, so the way down led to the inside of a terrace and the room the map
// exists for was sealed.
const R_MOUND = 32;                       // foot of the mound, and T1's outer edge
const R_T1 = 32, R_T2 = 24, R_SUM = 17;   // outer edge of each terrace
const R_CH = 15;                          // the chamber
const SHAFT = { x: 8.5, z: -8.5, r: 3.6 };  // the way down, off the summit's axis
const STAIRW = 3.4;                       // half-width of the processional stair

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const TOMB = 'tomb';

  // ---- THIS SITE'S OWN STONE ---------------------------------------------
  const turf = b.tint('grass', 0x2c4530, { rim: 0.12 });
  const revet = b.tint('rock', 0x5b5545, { rim: 0.2 });      // the terrace facing
  const flag = b.tint('concrete', 0x7d7a6e);                 // summit flagstone
  const dressed = b.tint('tile', 0x9a9484, { rim: 0.22 });   // the tomb's ashlar
  const dressedIn = b.tint('tile', 0x8e8878, { rim: 0.22, side: 2 });
  const timber = b.tint('wood', 0x4a3524, { rim: 0.2 });
  const vermilion = new THREE.MeshBasicMaterial({ color: 0x9c2f33 });

  b.sky(0x060a16, 0x0d1730, 0x243050, 360);
  b.groundPlane(0x141c14, 300);
  b.skyline(18, 200, { color: 0x141f28, shape: 'ridge', minW: 80, maxW: 170, minH: 46, maxH: 110 });

  // ---- THE APPROACH ------------------------------------------------------
  // Laid AROUND the mound. A single slab at y = 0 across the whole map sits
  // directly between the summit above and the chamber below, and `floorAt`
  // takes the highest surface — so the tomb had a lawn over the top of it.
  b.floorHole(-54, -50, 54, 50, 0, { x0: -R_MOUND, z0: -R_MOUND, x1: R_MOUND, z1: R_MOUND },
    { mat: turf });
  // and the ring that fills the corners the square cut left behind
  b.roundDeck(0, 0, 47, 0, { rIn: R_MOUND - 0.4, mat: turf, thick: 0.4 });
  // the gravel forecourt at the foot of the stair
  b.floor(-9, R_MOUND, 9, 48, 0.05, { mat: flag });

  // ---- THE MOUND ---------------------------------------------------------
  // Three concentric terraces, each a walkable ring with a revetted face under
  // it. The face is drawn PROUD of the deck it edges, so every one of them gets
  // its lip carried out to the drawn edge — the fault that put a strip of
  // visible ground with nothing under it round every raised deck in this set.
  const terrace = (rOut, y, rIn, id) => {
    b.roundDeck(0, 0, rOut, y, { rIn, mat: turf, thick: 0.5, id });
    for (const [a0, a1] of stairGaps(id)) {
      b.arcWall(0, 0, rOut + 0.35, a0, a1, y - 3.0, y - 0.12,
        { mat: revet, thick: 0.7, id: id + 'face' });
      b.arcWall(0, 0, rOut + 0.35, a0, a1, y - 0.12, y,
        { mat: revet, thick: 0.7, collide: false });
    }
    // the lip on the drawn face, as a RING. `lip` takes a rect, and a rect round
    // a circle is four corners of walkable air.
    // WITH THE STAIR HEAD CUT OUT OF IT. A lip ring run the whole way round a
    // terrace lies across the top of the one flight that climbs to it, and
    // `floorAt` prefers the lip while the fighter is still on the treads — the
    // flight surfaces through solid ground. Same rule as `floorHole`.
    const ga = stairBearing(id);
    b.roundDeck(0, 0, rOut + 0.75, y, {
      rIn: rOut - 0.4, draw: false, prop: true, id: id + 'lip',
      holes: [{ x: Math.sin(ga) * rOut, z: Math.cos(ga) * rOut, r: STAIRW + 1.4 }]
    });
  };
  // Each terrace's face is split around the one flight that climbs it, and each
  // flight is on a DIFFERENT bearing — so the climb circles the mound instead
  // of running straight up it, which is what a processional route does and what
  // makes a ring worth being chased along.
  const GAP = 0.16;
  function stairBearing(id) {
    return id === 'terr1' ? 0 : id === 'terr2' ? Math.PI / 2 : Math.PI;
  }
  function stairGaps(id) {
    const a = stairBearing(id);
    return [[a + GAP, a + Math.PI * 2 - GAP]];
  }
  terrace(R_T1, T1, R_T2 - 0.4, 'terr1');
  terrace(R_T2, T2, R_SUM - 0.4, 'terr2');
  b.roundDeck(0, 0, R_SUM, SUM, {
    mat: flag, thick: 0.5, id: 'summit', holes: [{ x: SHAFT.x, z: SHAFT.z, r: SHAFT.r }]
  });
  for (const [a0, a1] of [[Math.PI + GAP, Math.PI * 3 - GAP]]) {
    b.arcWall(0, 0, R_SUM + 0.35, a0, a1, SUM - 3.0, SUM - 0.12,
      { mat: revet, thick: 0.7, id: 'summitface' });
  }
  b.roundDeck(0, 0, R_SUM + 0.75, SUM, {
    rIn: R_SUM - 0.4, draw: false, prop: true, id: 'summitlip',
    holes: [{ x: 0, z: -R_SUM, r: STAIRW + 1.4 }, { x: SHAFT.x, z: SHAFT.z, r: SHAFT.r }]
  });

  // THE THREE FLIGHTS, one per face, each on its own bearing.
  // Ground -> first terrace, on +z: the torii stair.
  b.stairs(-STAIRW, R_T1 + 6.5, STAIRW, R_T1 - 0.6, 0.05, T1, 'z', { mat: flag });
  // first -> second, on +x
  b.stairs(R_T1 - 1.2, -STAIRW, R_T2 - 0.6, STAIRW, T1, T2, 'x', { mat: flag });
  // second -> summit, on -z
  b.stairs(-STAIRW, -(R_T2 - 1.2), STAIRW, -(R_SUM - 0.6), T2, SUM, 'z', { mat: flag });

  // ---- THE TORII CORRIDOR ------------------------------------------------
  // Straddling the long approach and the first flight, standing on whatever is
  // under each gate rather than hanging over it.
  const gate = (z, y, s = 1) => {
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 4.1 * s, 8), vermilion);
      p.position.set(sx * 2.6, 2.05 * s, 0);
      g.add(p);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.3, 0.48), vermilion);
    top.position.y = 4.05 * s;
    const mid = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.23, 0.35), vermilion);
    mid.position.y = 3.3 * s;
    g.add(top, mid);
    g.position.set(0, y, z);
    b.add(g);
    // Deliberately NOT collidable: gate legs 5 m apart down the only route
    // between the two halves of the map would make the climb a slalom.
  };
  for (let i = 0; i < 5; i++) gate(43 - i * 2.2, 0.05);
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8;
    gate(R_T1 + 6.5 - 7.1 * t, 0.05 + (T1 - 0.05) * t);
  }
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8;
    const z = R_T1 - 1.0, y = T1;
    b.lanternString(v3(-2.6, y + 3.2, z - i * 1.6), v3(2.6, y + 3.2, z - i * 1.6),
      { color: 0xff9c4e, sag: 0.3, count: 2 });
  }

  // ---- THE SUMMIT --------------------------------------------------------
  // An octagonal hall on the mound's axis, a ring of stone lanterns round it,
  // and the shaft down into the chamber cut through the flagstones.
  const HALLR = 7.0, HALLY = SUM + 4.6;
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
    // one face of the octagon is the doorway, and one is shoji that breaks
    if (i === 5) continue;
    if (i === 4) {
      b.windows(
        Math.sin(a0) * HALLR, Math.cos(a0) * HALLR,
        Math.sin(a1) * HALLR, Math.cos(a1) * HALLR, SUM, HALLY - 0.8,
        { hp: 14, id: 'starshoji', mat: new THREE.MeshBasicMaterial({ color: 0xe8e0cc, transparent: true, opacity: 0.85 }) });
      continue;
    }
    b.arcWall(0, 0, HALLR, a0, a1, SUM, HALLY - 0.6,
      { mat: timber, thick: 0.4, segs: 1, id: 'hall' + i });
  }
  b.roundDeck(0, 0, HALLR - 0.5, SUM + 0.08, { mat: timber, thick: 0.2, walk: false });
  // the roof: eight rafters to a finial, and a walkable deck on top of it
  b.roundDeck(0, 0, HALLR + 2.2, HALLY, { mat: revet, thick: 0.4, id: 'hallroof' });

  b.roundTower(0, 0, 1.4, HALLY, 2.6, { mat: revet, taper: 0.2, segs: 8, cap: true, id: 'finial' });
  // the steps up onto the roof, off the summit on the +x face
  b.stairs(HALLR + 6.5, -1.6, HALLR + 1.8, 1.6, SUM, HALLY, 'x', { mat: revet });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.31;
    const lx = Math.sin(a) * 12.2, lz = Math.cos(a) * 12.2;
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.7, 6), revet);
    post.position.y = 0.85;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.48, 0.4, 4), revet);
    cap.position.y = 2.2;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), emissive(0xffb45e));
    box.position.y = 1.88;
    g.add(post, cap, box);
    g.position.set(lx, SUM, lz);
    b.add(g);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), haloMaterial(0xff9c4e, 0.26));
    halo.position.set(lx, SUM + 1.9, lz);
    halo.userData.billboard = true;
    b.add(halo);
    b.breakable(g, { hp: 20, kind: 'concrete', center: v3(lx, SUM + 1.1, lz), radius: 0.5, height: 2.4, baseY: SUM });
  }

  // ---- THE CHAMBER -------------------------------------------------------
  // One round room of dressed stone under a corbelled dome, with a ring of
  // pillars and the vessel's dais in the middle. The fallback floor has to come
  // down under all of it or the mound above pages straight over the room.
  b.zone(TOMB, { x0: -R_CH - 2, x1: R_CH + 2, z0: -R_CH - 2, z1: R_CH + 2, y0: -9, y1: SUM }, false);
  b.pit(-R_CH, -R_CH, R_CH, R_CH, BY);
  b.roundDeck(0, 0, R_CH, BY, { mat: dressed, thick: 0.5, zone: TOMB, id: 'chamber' });
  b.arcWall(0, 0, R_CH + 0.4, 0, Math.PI * 2, BY, SUM - 2.2,
    { mat: dressed, thick: 1.0, zone: TOMB, id: 'chamberwall' });
  b.dome(0, 0, SUM - 2.2, R_CH + 0.4, { mat: dressedIn, rise: 3.6, oculus: 0.1, segs: 34, rings: 10 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 10;
    const px = Math.sin(a) * 10.5, pz = Math.cos(a) * 10.5;
    if (Math.hypot(px - SHAFT.x, pz - SHAFT.z) < SHAFT.r + 1.4) continue;
    b.pillar(px, pz, BY, SUM - 2.2 - BY - 0.1, 0.7, {
      mat: dressed, hp: 240, zone: TOMB, id: 'tp' + i
    });
  }
  // THE DAIS. A raised stone platform in the middle, and the one thing in the
  // tomb worth standing on.
  b.roundDeck(0, 0, 4.6, BY + 1.3, { mat: revet, thick: 0.5, zone: TOMB, id: 'dais' });
  // Drawn INSIDE the deck's own radius so the deck caps it, and split around
  // the ramp's bearing so the face does not wall off the only way up onto it.
  b.arcWall(0, 0, 4.35, Math.PI / 2 + 0.5, Math.PI / 2 + Math.PI * 2 - 0.5, BY, BY + 1.18,
    { mat: revet, thick: 0.5, zone: TOMB, id: 'daisface' });
  b.slope(6.6, -1.6, 4.4, 1.6, BY, BY + 1.3, 'x', { mat: revet, depth: 0.5, zone: TOMB });
  {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.1, 6, 32), emissive(0x6fe0c8));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, BY + 1.38, 0);
    b.add(ring);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(4.4, 24), haloMaterial(0x4fd8b8, 0.24));
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, BY + 1.4, 0);
    b.add(glow);
    let t = 0;
    b.tickers.push(dt => { t += dt; glow.material.opacity = 0.16 + Math.sin(t * 1.3) * 0.08; });
  }

  // ---- THE SHAFT ---------------------------------------------------------
  // The way down: a helix cut through the summit's flagstones and the mound
  // under them, landing on the chamber floor. One turn exactly, so its top
  // tread comes back to the bearing its landing is laid on.
  {
    const a = Math.atan2(SHAFT.x, SHAFT.z);
    b.spiralStair(SHAFT.x, SHAFT.z, SUM, BY, {
      rIn: 0.6, rOut: 3.3, rise: 0.24, turns: 2, dir: -1, a0: a,
      mat: dressed, newelMat: dressed, zone: TOMB, id: 'shaft'
    });
    b.arcWall(SHAFT.x, SHAFT.z, SHAFT.r + 0.5, 0, Math.PI * 2, BY, SUM - 0.12,
      { mat: dressed, thick: 0.7, segs: 18, zone: TOMB, id: 'shaftwall', collide: false });
    b.godRay(SHAFT.x, SUM, SHAFT.z, 3.0, SUM - BY, 0xbcd4ff,
      { opacity: 0.10, taper: 0.5, lean: [-1.6, -2.2], poolGain: 1.2, range: 70 });
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.6;
    b.hangingLamp(Math.sin(a) * 8, SUM - 2.6, Math.cos(a) * 8, 1.6, 0x6fe0c8, { amp: 0.035, range: 44 });
  }
  b.mist(0, 0, 0, 0, BY, 0x3f7f74, { radius: R_CH - 1, opacity: 0.22, scale: 11 });
  b.sigil(0, BY + 1.36, 0, 4.2, 0x4fd8b8, { rings: 3, spokes: 14, sides: 5, opacity: 0.34, spin: 0.07 });
  b.sigil(0, SUM + 0.05, 0, 13, 0x6fe0c8, { rings: 3, spokes: 16, sides: 6, opacity: 0.20, spin: -0.03 });

  // ---- MOONLIGHT AND THE FOREST ------------------------------------------
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.4;
    const r = 38 + (i % 3) * 6;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 10 && z > 20) continue;
    b.godRay(x, 20, z, 2.8, 20, 0xbcd4ff, { opacity: 0.055, taper: 0.3, lean: [2.2, -3.2], range: 90 });
  }
  b.godRay(-2, 24, 40, 5.5, 24, 0xbcd4ff, { opacity: 0.06, taper: 0.34, lean: [3.0, -5.0], range: 120 });
  b.mist(-54, 20, 54, 50, 0, 0x8fa8c8, { opacity: 0.15, scale: 26 });
  b.mist(-54, -50, -34, 30, 0, 0x8fa8c8, { opacity: 0.15, scale: 26 });
  b.mist(34, -50, 54, 30, 0, 0x8fa8c8, { opacity: 0.15, scale: 26 });

  const near = [], far = [];
  for (let i = 0; i < 170; i++) {
    const a = rand(0, Math.PI * 2), r = rand(R_MOUND + 3, 52);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 11 && z > 0) continue;               // keep the approach clear
    (r < R_MOUND + 12 && near.length < 16 ? near : far).push([x, z]);
  }
  for (const [x, z] of near) b.tree(x, 0, z, rand(1.2, 2.0));
  const fi = far.map(([x, z]) => ({ x, y: 0, z, s: rand(1.3, 2.4), ry: rand(0, 6.3) }));
  b.repeat(new THREE.CylinderGeometry(0.2, 0.36, 4.4, 6), b.tint('trunk', 0x2b2418),
    fi.map(f => ({ ...f, y: 2.2 * f.s, s: f.s, sy: f.s })));
  b.repeat(new THREE.SphereGeometry(2.0, 8, 6), b.tint('foliage', 0x1f3324),
    fi.map(f => ({ ...f, y: 5.8 * f.s, s: f.s })));

  // the porters' kit at the foot of the climb, and the sealed vessels below
  b.crates(12, 0, 30, { count: 3 });
  b.crates(13.8, 0, 28.6, { count: 2 });
  b.crates(-12, 0, 34, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(-7 - i * 1.05, BY, 9, { color: 0x4a5a52, markColor: 0x6fe0c8 });
  for (let i = 0; i < 3; i++) b.drum(7 + i * 1.05, BY, 9.6, { color: 0x4a5a52, markColor: 0x6fe0c8 });
  b.crates(-11, BY, -6, { count: 3 });
  b.crates(-9.2, BY, -7.4, { count: 2 });

  b.particles(260, { x0: -50, x1: 50, y0: 0.4, y1: 24, z0: -46, z1: 46 },
    { color: 0xbfd0f0, size: 0.07, opacity: 0.26, vy: [-0.5, -0.1] });
  b.particles(120, { x0: -13, x1: 13, y0: BY, y1: SUM - 3, z0: -13, z1: 13 },
    { color: 0x8fd8c0, size: 0.06, opacity: 0.3, vy: [0.05, 0.35] });

  // At the foot of the torii stair, and on the first terrace either side of it.
  // At the foot of the torii stair, and out on the first terrace either side of
  // it — clear of the second terrace's revetment, whose face stands proud of
  // the ring it edges and reaches a good half metre further in than it looks.
  b.bounds.spawns = [
    v3(-4.5, 0.05, 38), v3(4.5, 0.05, 38),
    v3(-13, T1, 26), v3(13, T1, 26)
  ];
  return b;
}
