// TOKYO JUJUTSU HIGH. The calm counterpoint to Shibuya — the only map in the
// set shot in warm daylight, and the only one whose architecture is timber.
//
// REFERENCE NOTE (researched): the mountain temple precinct. A tiered circular
// platform of dressed stone with the ground stepping up to it in concentric
// rings, an OCTAGONAL hall on its axis (the yumedono plan — eight faces, a
// pyramidal roof, a finial), a covered colonnade ringing the precinct, a
// smaller octagon off to one side, and the whole thing cut into a hillside with
// a torii approach climbing to it through cedar.
//
// WHY THIS SHAPE. The previous version was a rectangular courtyard with a
// rectangular hall on one side, a rectangular dojo on another and a rectangular
// terrace on a third — the same box arrangement as most of this set, in timber.
// A precinct is CENTRED. The tiered platform means the middle of the map is the
// high ground and you climb toward your opponent from every direction; the
// colonnade is a covered ring you can circle the whole fight in without ever
// being in the open; and an octagon has no corner to be backed into and eight
// faces to be knocked out through.
//
// LAYOUT (108 x 98 m):
//   y = 0.00  THE GROUNDS   gravel and moss under the cedars.
//   y = 0.50  FIRST TIER  \  two concentric rings of dressed stone, each one
//   y = 1.00  SECOND TIER /  a stride, so the precinct is climbable anywhere.
//   y = 1.50  THE PRECINCT  the platform itself, with the great hall on it.
//   y = 2.40  THE COLONNADE a covered ring round the precinct, on posts.
//   y = 6.20  COLONNADE ROOF walkable, and a complete circuit.
//   y = 8.60  HALL ROOF     the octagon's roof deck. Highest ground.
//   y = 6.40  WEST TERRACE  a curved shelf cut into the hillside.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../../core/math.js';

export const DEF = {
  id: 'jujutsu_high',
  name: 'TOKYO JUJUTSU HIGH',
  jp: '東京呪術高専',
  desc: 'A tiered stone precinct with an octagonal hall. Warm daylight, cedar.',
  extent: { minX: -54, maxX: 54, minZ: -49, maxZ: 49 },
  terrain: NATURAL,
  background: 0x8fb0d8,
  fog: { color: 0x9fb4c8, near: 78, far: 240 },
  grade: { vignette: 0.38, tint: [1.08, 1.04, 0.94], lift: 0.01, sat: 1.06 },
  lights: {
    key: { color: 0xfff0d0, intensity: 1.4, pos: [12, 20, 8] },
    rim: { color: 0x9fd8a8, intensity: 0.75, pos: [-10, 10, -10] },
    hemi: { sky: 0xa8d0f0, ground: 0x5a6440, intensity: 0.62 }
  },
  previewCam: { pos: [0, 13.5, 46], look: [0, 4.0, -6] },
  shadowScale: 1.1,
  shrineScale: 1.00,
  size: '108 × 98 m · tiered precinct, octagonal hall, colonnade ring, terrace'
};

// HALF A METRE A TIER, not 0.6. STEP_UP is 0.55, so at 0.6 each ring was one
// centimetre too tall to walk up — the whole precinct, the hall, both its
// flights and its roof were unreachable, and every one of them looked perfect.
// This is the reason the tiers exist at all: the middle of the map has to be
// climbable from any bearing.
const T1 = 0.5, T2 = 1.0, PREC = 1.5;
const R_PREC = 23, R_T2 = 27, R_T1 = 31;
const COL_R = 33.5, COL_Y = 2.4, COL_ROOF = 6.2;   // the colonnade
const HALL_R = 8.5, HALL_EAVE = 6.4, HALL_ROOF = 8.6;
// THE HALL STANDS AT THE HEAD OF THE PRECINCT, not in the middle of it. A
// 17 m precinct with an 8.5 m hall planted at its centre is an 8 m ring to
// fight in, and that is what this map was: a courtyard with no courtyard. It
// is the way a temple is actually laid out, too — the hall faces you down the
// approach across an open forecourt, it does not sit in the middle of one.
const HC = { x: 0, z: -13.5 };
// Pushed out past the colonnade's outer edge: at 36 the ring ran between the
// precinct and the dojo, so the dojo's own stair started on the colonnade roof
// instead of on the ground.
const DOJO = { x: 42, z: -16, r: 6.0 };
// The shelf, moved to the WEST bearing and pushed out clear of the colonnade.
// On -z at rIn = 30 its own deck lay over the helix that climbs to it.
const TERR = { y: 6.4, rIn: 36, rOut: 48, a0: Math.PI * 1.34, a1: Math.PI * 1.66 };
const TERR_HELIX = { r: 33, a: Math.PI * 1.5 };

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  // ---- THIS PRECINCT'S OWN MATERIALS -------------------------------------
  const moss = b.tint('grass', 0x3f5a38, { rim: 0.1 });
  const gravel = b.tint('concrete', 0x9a9382);
  const dressed = b.tint('rock', 0x8c8474, { rim: 0.18 });
  const timber = b.tint('wood', 0x6b4426, { rim: 0.22 });
  const timberIn = b.tint('wood', 0x7a5030, { rim: 0.22, side: 2 });
  const tileRoof = b.tint('rock', 0x3f4650, { rim: 0.24 });
  const vermilion = new THREE.MeshBasicMaterial({ color: 0x8a2c34 });

  b.sky(0x3f6fc0, 0x86aede, 0xd8e0e8, 360);
  b.groundPlane(0x2a3f2c, 300);
  b.skyline(20, 200, { color: 0x2c4a3c, shape: 'ridge', minW: 70, maxW: 150, minH: 34, maxH: 88 });

  // ---- THE GROUNDS AND THE TIERS -----------------------------------------
  b.floor(-54, -49, 54, 49, 0, { mat: moss });
  b.floor(-4.5, R_T1, 4.5, 48, 0.05, { mat: gravel });      // the approach
  b.roundDeck(0, 0, R_T1, T1, { rIn: R_T2 - 0.4, mat: dressed, thick: 0.72, id: 'tier1' });
  b.roundDeck(0, 0, R_T2, T2, { rIn: R_PREC - 0.4, mat: dressed, thick: 0.72, id: 'tier2' });
  b.roundDeck(0, 0, R_PREC, PREC, { mat: gravel, thick: 0.72, id: 'precinct' });
  // Each tier is 0.6 m — one stride — so the precinct is climbable from ANY
  // bearing. That is the whole idea: the high ground is the middle of the map
  // and there is no staircase to hold.

  // ---- THE GREAT HALL: an octagon ----------------------------------------
  // Eight faces, no corner to be backed into, and one of them is shoji that
  // breaks — so the hall opens onto the precinct wherever it is hit.
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
    if (i === 0) continue;                       // the doorway, on the approach axis
    if (i === 3 || i === 5) {
      const p0 = v3(HC.x + Math.sin(a0) * HALL_R, 0, HC.z + Math.cos(a0) * HALL_R);
      const p1 = v3(HC.x + Math.sin(a1) * HALL_R, 0, HC.z + Math.cos(a1) * HALL_R);
      b.windows(p0.x, p0.z, p1.x, p1.z, PREC, HALL_EAVE - 0.8, {
        hp: 14, id: 'shoji' + i,
        mat: new THREE.MeshBasicMaterial({ color: 0xe8e0cc, transparent: true, opacity: 0.85 })
      });
      continue;
    }
    b.arcWall(HC.x, HC.z, HALL_R, a0, a1, PREC, HALL_EAVE - 0.6,
      { mat: timber, thick: 0.45, segs: 1, id: 'hall' + i });
  }
  // the eight posts at the corners, and the beam ring they carry
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    b.roundTower(HC.x + Math.sin(a) * HALL_R, HC.z + Math.cos(a) * HALL_R, 0.34, PREC, HALL_EAVE - PREC - 0.12,
      { mat: timber, segs: 8, id: 'hallpost' + i });
  }
  b.roundDeck(HC.x, HC.z, HALL_R - 0.6, PREC + 0.08, { mat: timber, thick: 0.2, walk: false });
  // the roof: a deep octagonal eave, then the deck, then the finial
  b.roundDeck(HC.x, HC.z, HALL_R + 3.2, HALL_EAVE, { mat: tileRoof, thick: 0.5, segs: 8, id: 'halleave' });
  b.roundDeck(HC.x, HC.z, HALL_R - 1.0, HALL_ROOF, { mat: tileRoof, thick: 0.5, segs: 8, id: 'hallroof' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const g = new THREE.BoxGeometry(0.5, 0.5, 4.6);
    g.rotateY(a);
    g.translate(HC.x + Math.sin(a) * (HALL_R + 0.6), (HALL_EAVE + HALL_ROOF) / 2, HC.z + Math.cos(a) * (HALL_R + 0.6));
    b.static_(g, tileRoof);
  }
  b.roundTower(HC.x, HC.z, 1.1, HALL_ROOF, 2.4, { mat: tileRoof, taper: 0.2, segs: 8, cap: true, id: 'finial' });
  // the flight up onto the eave, and on to the roof, both on +x where the
  // radius runs along an axis and an axis-aligned stair fits
  // EVERY TOP TREAD OVERLAPS ITS LANDING by about 0.3 m. Stopped just outside
  // the slab — even 0.2 m outside — there is a column of grid cells at the head
  // of the flight where neither the treads nor the deck exist, the fighter
  // drops through it, and the deck above is unreachable. It cost four platforms
  // on this map. The overlap is small enough that the BURIED probe at t = 0.1
  // still lands clear of the slab.
  b.stairs(HC.x + HALL_R + 7.0, HC.z - 1.8, HC.x + HALL_R + 2.9, HC.z + 1.8, PREC, HALL_EAVE, 'x', { mat: dressed, id: 'eavestair' });
  // On the opposite bearing from eavestair: two flights sharing +x at the same z
  // band means the low end of the upper one probes onto the treads of the lower.
  b.stairs(HC.x - HALL_R - 1.8, HC.z - 1.8, HC.x - HALL_R + 1.3, HC.z + 1.8, HALL_EAVE, HALL_ROOF, 'x', { mat: tileRoof, id: 'roofstair' });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    b.hangingLamp(HC.x + Math.sin(a) * 5.4, HALL_EAVE - 1.4, HC.z + Math.cos(a) * 5.4, 1.0, 0xffd08a, { range: 44 });
  }

  // ---- THE COLONNADE -----------------------------------------------------
  // A covered ring round the precinct: a raised timber walk on posts, with a
  // roof you can also walk. Circle the whole fight without being in the open.
  b.roundDeck(0, 0, COL_R + 2.6, COL_Y, { rIn: COL_R - 2.6, mat: timber, thick: 0.4, id: 'colonnade' });
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    for (const rr of [COL_R - 2.2, COL_R + 2.2]) {
      b.roundTower(Math.sin(a) * rr, Math.cos(a) * rr, 0.26, COL_Y, COL_ROOF - COL_Y - 0.14,
        { mat: timber, segs: 6, id: 'colpost' + i + rr });
    }
  }
  // WITH A WELL FOR ITS OWN FLIGHT. The roof is an annulus and the stair up to
  // it is radial, so the flight is inside the roof's band for its whole length:
  // there is no way to land on this slab from underneath it without a hole.
  b.roundDeck(0, 0, COL_R + 4.0, COL_ROOF, {
    rIn: COL_R - 4.0, mat: tileRoof, thick: 0.5, id: 'colroof',
    holes: [{ x: 0, z: COL_R - 1.0, r: 3.0 }]
  });
  // one flight from the tier up onto the walk, and one from the walk to its
  // roof, on opposite bearings so the circuit has two ways into it
  b.stairs(21.6, -2.2, COL_R - 2.4, 2.2, T1, COL_Y, 'x', { mat: timber, id: 'colstair0' });
  b.stairs(-21.6, -2.2, -(COL_R - 2.4), 2.2, T1, COL_Y, 'x', { mat: timber, id: 'colstair1' });
  b.stairs(-2.2, COL_R - 1.3, 2.2, COL_R + 2.3, COL_Y, COL_ROOF, 'z', { mat: tileRoof, id: 'colroofstair' });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.22;
    b.lanternString(v3(Math.sin(a) * (COL_R - 2.0), COL_ROOF - 0.9, Math.cos(a) * (COL_R - 2.0)),
      v3(Math.sin(a) * (COL_R + 2.0), COL_ROOF - 0.9, Math.cos(a) * (COL_R + 2.0)),
      { color: 0xffb45e, sag: 0.24, count: 2 });
  }

  // ---- THE TORII APPROACH ------------------------------------------------
  for (let i = 0; i < 8; i++) {
    const z = 46 - i * 2.6;
    const g = new THREE.Group();
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 5.4, 8), vermilion);
      p.position.set(sx * 3.1, 2.7, 0);
      g.add(p);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.4, 0.6), vermilion);
    top.position.y = 5.3;
    const mid = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.3, 0.44), vermilion);
    mid.position.y = 4.4;
    g.add(top, mid);
    g.position.set(0, 0.05, z);
    b.add(g);
  }
  b.lanternString(v3(-3.1, 4.0, 46), v3(-3.1, 4.0, 28), { color: 0xffb45e, sag: 0.8, count: 8 });
  b.lanternString(v3(3.1, 4.0, 46), v3(3.1, 4.0, 28), { color: 0xffb45e, sag: 0.8, count: 8 });

  // ---- THE DOJO ----------------------------------------------------------
  // A second, smaller octagon off the precinct's east side — the only place on
  // this map with a blind corner in it, and a roof of its own.
  {
    const D = DOJO;
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
      if (i === 4) continue;                       // open toward the precinct
      b.arcWall(D.x, D.z, D.r, a0, a1, 0, 4.2, { mat: timber, thick: 0.4, segs: 1, id: 'dojo' + i });
    }
    b.roundDeck(D.x, D.z, D.r - 0.5, 0.12, { mat: timber, thick: 0.24, id: 'dojofloor' });
    b.roundDeck(D.x, D.z, D.r + 2.4, 4.6, { mat: tileRoof, thick: 0.5, segs: 8, id: 'dojoroof' });
    b.roundTower(D.x, D.z, 0.9, 4.6, 1.8, { mat: tileRoof, taper: 0.2, segs: 8, cap: true });
    // ALONG Z, and from the ground. Along x it had 0.4 m of run for 4.6 m of
    // rise and its top tread was inside the roof it climbed to.
    b.stairs(D.x - 1.8, D.z - 14, D.x + 1.8, D.z - D.r - 1.9, 0, 4.6, 'z', { mat: dressed, id: 'dojostair' });
    b.hangingLamp(D.x, 4.0, D.z, 0.9, 0xffd08a, { range: 40 });
  }

  // ---- THE WEST TERRACE --------------------------------------------------
  // A curved shelf cut into the hillside, reached by a helix off the colonnade
  // roof — the one place up here that is not a ring.
  {
    const T = TERR;
    for (let k = 0; k < 20; k++) {
      const a0 = T.a0 + (T.a1 - T.a0) * (k / 20), a1 = T.a0 + (T.a1 - T.a0) * ((k + 1) / 20);
      const am = (a0 + a1) / 2;
      const rc = (T.rIn + T.rOut) / 2, depth = T.rOut - T.rIn;
      const chord = 2 * rc * Math.sin((T.a1 - T.a0) / 40) * 1.3;
      const px = Math.sin(am) * rc, pz = Math.cos(am) * rc;
      const g = new THREE.BoxGeometry(chord, 0.6, depth);
      g.rotateY(am);
      g.translate(px, T.y - 0.3, pz);
      b.static_(g, dressed);
      const ca = Math.abs(Math.cos(am)), sa = Math.abs(Math.sin(am));
      const hx = (ca * chord + sa * depth) / 2, hz = (sa * chord + ca * depth) / 2;
      b.bounds.platform(px - hx, pz - hz, px + hx, pz + hz, T.y, { id: 'terrace' });
      b.bounds.terrain(px - hx, pz - hz, px + hx, pz + hz, T.y, NATURAL);
    }
    // the rock face it is cut into, through the helper that knows how to bound
    // an arc rather than by hand
    b.arcWall(0, 0, T.rIn, T.a0, T.a1, 0, T.y - 0.12,
      { mat: b.tint('rock', 0x6a6656), thick: 1.4, id: 'terrface' });
    // THE HELIX UP TO IT, standing in the gap between the colonnade's roof and
    // the terrace's face — the only band of open ground on that bearing.
    const hx = Math.sin(TERR_HELIX.a) * TERR_HELIX.r, hz = Math.cos(TERR_HELIX.a) * TERR_HELIX.r;
    b.spiralStair(hx, hz, 0, T.y, {
      rIn: 0.7, rOut: 2.0, rise: 0.24, turns: 2, dir: 1, a0: TERR_HELIX.a,
      mat: dressed, newelMat: timber, id: 'terrhelix'
    });
    const lx = hx + Math.sin(TERR_HELIX.a) * 2.4, lz = hz + Math.cos(TERR_HELIX.a) * 2.4;
    b.floor(lx - 1.8, lz - 1.8, lx + 1.8, lz + 1.8, T.y, { mat: dressed, id: 'terrland' });
    for (let i = 0; i < 5; i++) {
      const a = T.a0 + (T.a1 - T.a0) * ((i + 0.5) / 5);
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.9, 6), dressed);
      post.position.y = 0.95;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.44, 0.4, 4), dressed);
      cap.position.y = 2.4;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), emissive(0xffc36a));
      box.position.y = 2.05;
      g.add(post, cap, box);
      g.position.set(Math.sin(a) * (T.rOut - 3), T.y, Math.cos(a) * (T.rOut - 3));
      b.add(g);
      b.breakable(g, { hp: 22, kind: 'concrete', center: v3(g.position.x, T.y + 1.2, g.position.z), radius: 0.5, height: 2.5, baseY: T.y });
    }
  }

  // ---- THE WARD, THE LIGHT AND THE FOREST --------------------------------
  b.sigil(0, PREC + 0.06, 0, HALL_R + 6, 0x7fd0ff, { rings: 3, spokes: 20, sides: 8, opacity: 0.22, spin: 0.018 });
  b.sigil(0, 0.07, 30, 5.0, 0xffb45e, { rings: 2, spokes: 12, sides: 3, opacity: 0.24, spin: -0.05 });
  b.sigil(DOJO.x, 0.2, DOJO.z, 4.2, 0x7fd0ff, { rings: 2, spokes: 6, sides: 4, opacity: 0.26, spin: 0.09 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.4;
    const r = 34 + (i % 3) * 7;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 7 && z > 18) continue;
    b.godRay(x, 16, z, 2.6, 16, 0xfff0c0, { opacity: 0.07, taper: 0.3, lean: [-3.2, 1.6], range: 80 });
  }
  b.godRay(0, 18, 34, 5.0, 18, 0xfff4d0, { opacity: 0.06, taper: 0.45, lean: [-3.4, 1.8], range: 110 });
  for (const [mx0, mz0, mx1, mz1] of [
    [-54, 33, 54, 49], [-54, -49, 54, -40], [-54, -40, -42, 33], [42, -40, 54, 33]
  ]) b.mist(mx0, mz0, mx1, mz1, 0, 0xcfe0d8, { opacity: 0.13, scale: 17 });

  const near = [], far = [];
  for (let i = 0; i < 150; i++) {
    const a = rand(0, Math.PI * 2), r = rand(34, 52);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 6 && z > 18) continue;
    if (x > DOJO.x - 12 && x < DOJO.x + 12 && z > DOJO.z - 12 && z < DOJO.z + 12) continue;
    if (a > TERR.a0 - 0.2 && a < TERR.a1 + 0.2 && r < TERR.rOut + 3) continue;
    (r < 40 && near.length < 14 ? near : far).push([x, z]);
  }
  for (const [x, z] of near) b.tree(x, 0, z, rand(1.0, 1.7));
  const fi = far.map(([x, z]) => ({ x, y: 0, z, s: rand(1.2, 2.2), ry: rand(0, 6.3) }));
  b.repeat(new THREE.CylinderGeometry(0.2, 0.34, 4.2, 6), b.tint('trunk', 0x33241a),
    fi.map(f => ({ ...f, y: 2.1 * f.s, sy: f.s, s: f.s })));
  b.repeat(new THREE.SphereGeometry(1.9, 8, 6), b.tint('foliage', 0x22381f),
    fi.map(f => ({ ...f, y: 5.4 * f.s, s: f.s })));

  // the storehouse behind the dojo, and its sealed vessels
  b.crates(DOJO.x + 3, 0, DOJO.z - 11, { count: 3 });
  b.crates(DOJO.x + 4.8, 0, DOJO.z - 12.4, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(DOJO.x - 2 - i * 1.05, 0, DOJO.z - 11.4, { color: 0x6a5a44, markColor: 0xff5ad8 });
  b.crates(-41, TERR.y, 3, { count: 2 });
  b.crates(-43, TERR.y, 1.4, { count: 1 });

  b.particles(280, { x0: -52, x1: 52, y0: 0.4, y1: 18, z0: -47, z1: 47 },
    { color: 0xd8e8a0, size: 0.11, opacity: 0.42, vy: [-0.7, -0.2] });
  b.particles(160, { x0: -52, x1: 52, y0: 1, y1: 14, z0: -47, z1: 47 },
    { color: 0xfff0c0, size: 0.07, opacity: 0.30, vy: [0.05, 0.3] });

  // On the second tier, off the hall's doorway axis and off the two flights.
  b.bounds.spawns = [0.25, 0.75, 1.25, 1.75].map(k => {
    const a = Math.PI * k;
    return v3(Math.sin(a) * 19, T2, Math.cos(a) * 19);
  });
  return b;
}
