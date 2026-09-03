// YASOHACHI BRIDGE — the Death Painting fight. Yuji and Nobara against Eso and
// Kechizu, on and under a river crossing at night.
//
// REFERENCE NOTE (researched): a SUSPENSION span. Two tall portal pylons
// standing in the river, a main cable slung between them in a catenary and
// carried on over each backstay to an anchorage on the bank, vertical hangers
// dropping from that cable to a deck that rises to a crown at midspan, and the
// whole thing standing over gravel flats and shallow water.
//
// WHY THIS SHAPE. The previous version was a straight lattice box: a deck, a
// flat top chord over it, and a gantry slung underneath — three parallel
// corridors 80 m long, which made this the most one-dimensional map in the set
// AND the one whose three levels all felt the same. A suspension bridge is a
// CURVE. The deck climbs to a crown in the middle and falls away at both ends,
// so the highest ground is the middle of the map rather than either end of it;
// the cable is a second curve crossing the first, so the gap between them is
// wide at the towers and closes to nothing at the crown; and the two pylons are
// the only vertical objects on the map, which makes them the thing the fight is
// fought around instead of a wall to run along.
//
// It is still the only LINEAR map here, and the low ground is still the wide
// ground.
//
// LAYOUT (128 x 92 m):
//   y = -2.60  RIVERBED     gravel flats and shallow water. The widest floor.
//   y =  1.20  ANCHORAGE    the two backstay blocks on the banks, and the ramps
//                           down off them to the water.
//   y =  3.40  DECK ENDS    where the span meets each bank.
//   y =  7.60  THE CROWN    the middle of the deck, four metres higher than its
//                           ends. The whole span is a slope toward you.
//   y = 10.20  CABLE BAND   the walkable top of the main cable's haunch, off
//                           each pylon — narrow, curved, and the only way to be
//                           above the crown.
//   y = 18.00  PYLON HEADS  the saddle decks. Highest ground, and a dead end.
//   VERTICAL                a ramp off each bank to the water, a stair up each
//                           pylon leg, and the cable haunch between them.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../../core/math.js';

export const DEF = {
  id: 'yasohachi_bridge',
  name: 'YASOHACHI BRIDGE',
  jp: '八十八橋',
  desc: 'A suspension span over black water. The deck climbs to its crown.',
  // groundY is the RIVERBED: the deck, the banks and the flats are authored
  // surfaces, and anywhere they do not cover is the river.
  extent: { minX: -64, maxX: 64, minZ: -46, maxZ: 46, groundY: -2.6 },
  terrain: NATURAL,
  background: 0x0a1220,
  fog: { color: 0x101a2c, near: 54, far: 200 },
  grade: { vignette: 0.52, tint: [0.94, 0.99, 1.14], lift: 0.004, sat: 0.88 },
  lights: {
    key: { color: 0xc4d8ff, intensity: 1.1, pos: [12, 26, 10] },
    rim: { color: 0x6f8fd0, intensity: 0.7, pos: [-14, 9, -12] },
    hemi: { sky: 0x354a78, ground: 0x22261f, intensity: 0.5 }
  },
  previewCam: { pos: [-56, 16.0, 34], look: [4, 8.0, -2] },
  shadowScale: 1.3,
  shrineScale: 1.15,
  size: '128 × 92 m · riverbed, suspension deck, cable haunches, pylon heads'
};

const RB = -2.6;          // riverbed
const ANCH = 1.2;         // anchorage blocks on the banks
const DEND = 3.4;         // deck at the towers
const CROWN = 7.6;        // deck at midspan
const PYX = 26;           // the two pylons
const SPAN = 52;          // deck half-length (bank to bank)
const DW = 7.5;           // deck half-width
const HEAD = 18.0;        // pylon saddle deck
const BANDY = 10.2;       // top of the cable haunch beside each pylon

// The deck's own profile: a parabola with its crown at x = 0 and its ends at
// the towers, carried on out flat to each bank. One function, used by the deck,
// the hangers, the kerbs and the lamps, so none of them can disagree about
// where the road is.
function deckY(x) {
  const t = Math.min(1, Math.abs(x) / PYX);
  return CROWN - (CROWN - DEND) * t * t;
}

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const Z = 'bridge';
  b.zone(Z, { x0: -64, x1: 64, z0: -46, z1: 46, y0: -4, y1: 24 }, false);

  // ---- THE VALLEY'S OWN GROUND -------------------------------------------
  const gravel = b.tint('rock', 0x5a5c58, { rim: 0.14 });
  const bank = b.tint('grass', 0x33452f, { rim: 0.1 });
  const road = b.tint('asphalt', 0x2a2d33, { rim: 0.06 });
  const steel = b.tint('metal', 0x8a99a8, { rim: 0.5, gloss: 0.6 });
  const paint = b.tint('paint', 0x6a4a44, { rim: 0.3 });    // the pylons' oxide red
  const cableM = b.tint('darkMetal', 0x3a4048, { rim: 0.5 });

  b.sky(0x060b18, 0x0e1830, 0x243452, 380);
  b.groundPlane(0x0d1414, 300);
  b.skyline(22, 200, { color: 0x16241e, shape: 'ridge', minW: 80, maxW: 170, minH: 30, maxH: 84 });

  b.floor(-64, -46, 64, 46, RB, { mat: gravel });
  b.water(-64, -16, 64, 16, RB + 0.5, { shallow: 0x4f90b0, deep: 0x0e2c44, opacity: 0.66, caustic: 0.3 });
  for (const [x, z, w, d] of [[-30, 0, 13, 10], [-4, -6, 17, 11], [22, 5, 14, 10], [8, 10, 11, 8]]) {
    b.floor(x - w / 2, z - d / 2, x + w / 2, z + d / 2, RB + 0.62, { mat: gravel });
  }

  // ---- THE BANKS AND THE ANCHORAGES --------------------------------------
  // Each bank is a low block with the backstay cable dead-ending in it, and a
  // ramp off its flank down to the flats. The anchorage is the only place on
  // this map where the deck and the water are one stride apart.
  for (const s of [-1, 1]) {
    const outer = s * 62, inner = s * SPAN;
    b.floor(Math.min(outer, inner), -46, Math.max(outer, inner), 46, ANCH,
      { mat: bank, id: 'bank' + s });
    // THE ABUTMENT, WITH A GAP IN IT. It is a 4 m retaining face running the
    // full width of the map, so built in one piece it seals the bank off from
    // the riverbed completely — the ramp down to the water was on the far side
    // of it and the whole of both banks, anchor blocks included, was somewhere
    // nobody could reach. The gap is where the ramp comes through.
    for (const [z0, z1] of [[-46, 16], [24, 46]]) {
      b.wall(s * (SPAN - 0.5), z0, s * (SPAN + 0.5), z1, RB, ANCH - 0.12,
        { mat: gravel, thick: 1.0, id: 'abut' + s });
      b.lip(s * (SPAN - 0.5), z0, s * (SPAN + 0.5), z1, ANCH, { id: 'abut' + s });
    }
    // the ramp off the bank down to the flats, through that gap
    b.slope(s * 45, 16.6, s * 52.0, 23.4, RB, ANCH, 'x', { mat: gravel, depth: 1.0, zone: Z });

    // THE ANCHOR BLOCK: the mass the backstay pulls against, and the one piece
    // of high ground on either bank. Set OFF the road's centreline — it fills
    // the bank's whole width in x, so on the axis it swallowed the ramp up onto
    // the deck and made both banks unreachable.
    const ax = s * 57, az = -22;
    b.floor(ax - 5, az - 9, ax + 5, az + 9, ANCH + 3.4, { mat: gravel, id: 'anchor' + s });
    b.wall(ax - 5, az - 9, ax + 5, az + 9, ANCH, ANCH + 3.28, { mat: gravel, id: 'anchorblock' + s });
    // UP ITS FLANK, along z. The block fills the bank's whole width in x — 52
    // to 62 either side — so a flight approaching it along x starts out over
    // the river, which is exactly where the first one started.
    // The top tread OVERLAPS the block by 0.2 m. Stopped 0.3 m short of it the
    // flight ended over a 3.4 m drop with the deck it climbs to just out of
    // reach, and the flood fill did what a fighter would: fell back onto the
    // bank.
    b.stairs(ax - 3, az + 14.0, ax + 3, az + 8.8, ANCH, ANCH + 3.4, 'z', { mat: gravel });
    // the deck's approach, running level from the bank out to the tower
    b.floor(Math.min(s * SPAN, s * (PYX + 4)), -DW, Math.max(s * SPAN, s * (PYX + 4)),
      DW, DEND, { mat: road, id: 'approach' + s });
    // and the climb off the bank onto it — from OUTSIDE the span inward, which
    // is the direction the road actually runs
    // Its top tread stops just OUTSIDE the approach slab. A flight whose top
    // is inside the slab it climbs to is buried under it.
    b.stairs(s * 57, -DW + 1, s * (SPAN + 0.3), DW - 1, ANCH, DEND, 'x',
      { mat: road, id: 'onramp' + s });
  }

  // ---- THE DECK ----------------------------------------------------------
  // A parabola, built as segments that step to their own height. The crown at
  // midspan is 4.2 m above the towers' feet, so the whole span is a slope and
  // the middle of the map is the high ground on it.
  {
    const n = 26, x0 = -(PYX + 4), x1 = PYX + 4;
    for (let i = 0; i < n; i++) {
      const a = x0 + (x1 - x0) * (i / n), c = x0 + (x1 - x0) * ((i + 1) / n);
      const y = deckY((a + c) / 2);
      b.floor(a, -DW, c, DW, y, { mat: road, id: 'deck', thick: 0.5, zone: Z });
      // the kerb either side, drawn only
      for (const sz of [-1, 1]) {
        const g = new THREE.BoxGeometry(c - a, 0.3, 0.55);
        g.translate((a + c) / 2, y + 0.15, sz * (DW - 0.3));
        b.static_(g, gravel, Z);
      }
      if (i % 3 === 0) {
        const g = new THREE.BoxGeometry(2.0, 0.03, 0.22);
        g.translate((a + c) / 2, y + 0.03, 0);
        b.static_(g, emissive(0xdfe4ec), Z);
      }
      // the plate girder under it
      const gg = new THREE.BoxGeometry(c - a, 1.0, DW * 2);
      gg.translate((a + c) / 2, y - 0.85, 0);
      b.static_(gg, steel, Z);
    }
    // the step from the parabola's ends onto the level approaches
    for (const s of [-1, 1]) {
      b.lip(s * (PYX + 3.6), -DW, s * (PYX + 4.4), DW, DEND, { id: 'deckjoin' + s });
    }
  }

  // ---- THE TWO PYLONS ----------------------------------------------------
  // Portal frames standing in the river: two legs, two cross-heads, a saddle
  // deck at the top, and a stair up the inside of the upstream leg.
  for (const s of [-1, 1]) {
    const px = s * PYX;
    b.pylon(px, 0, RB, HEAD - RB, {
      mat: paint, axis: 'z', spread: DW * 2 + 2.2, thick: 2.2, segs: 10,
      crossAt: [(DEND - RB) + 1.2, (BANDY - RB), (HEAD - RB) - 1.0], id: 'pylon' + s
    });
    // the saddle deck across the head, wide enough for the helix to land on
    b.floor(px - 9, -DW - 2.2, px + 9, DW + 2.2, HEAD, { mat: steel, id: 'head' + s });
    b.railing(px - 9, -DW - 2.2, px + 9, -DW - 2.2, HEAD, { zone: Z, collide: false });
    b.railing(px - 9, DW + 2.2, px + 9, DW + 2.2, HEAD, { zone: Z });
    b.railing(px - 9, -DW - 2.2, px - 9, DW + 2.2, HEAD, { zone: Z });
    b.railing(px + 9, -DW - 2.2, px + 9, DW + 2.2, HEAD, { zone: Z });

    // THE CLIMB UP THE PYLON is a helix standing beside it, outboard of the
    // deck on the upstream side. A straight flight cannot do this: fourteen
    // metres of rise beside a fifteen-metre-wide deck is either a ladder or a
    // run out over the river, and both were tried.
    //
    // It is offset in X as well as Z, and that is not decoration: a portal
    // pylon's legs straddle the deck, so the leg's own collider sits on the
    // last metre of road at exactly the place a landing would want to cross.
    // Everything at the top of this map was unreachable until the helix and its
    // landings moved clear of the leg in x.
    const hcx = px + s * 6.5, hcz = -16;
    b.spiralStair(hcx, hcz, DEND, HEAD, {
      rIn: 0.6, rOut: 3.1, rise: 0.24, turns: 3, dir: s > 0 ? 1 : -1, a0: 0,
      mat: steel, newelMat: paint, zone: Z, id: 'pylonhelix' + s
    });
    const la = Math.min(px + s * 4.6, px + s * 8.4), lb = Math.max(px + s * 4.6, px + s * 8.4);
    b.floor(la, -18.0, lb, -7.0, DEND, { mat: steel, id: 'helixfoot' + s });
    b.floor(la, -18.0, lb, -9.4, HEAD, { mat: steel, id: 'helixtop' + s });
    b.railing(la, -18.0, lb, -18.0, DEND, { zone: Z, collide: false });
    b.railing(la, -18.0, lb, -18.0, HEAD, { zone: Z, collide: false });
  }

  // ---- THE CABLE, AND THE HAUNCH YOU CAN WALK ----------------------------
  // The main cable is a real catenary from head to head, with the backstays
  // carrying on down to the anchor blocks. Where it runs closest to the deck —
  // the haunch beside each pylon — it is fat enough to be a walkway, and that
  // band is the only route between the deck and the pylon heads.
  // The main cable's own profile: a parabola from head to head, dipping to
  // CABLE_MID over the crown. One function, like `deckY`, so the cable, its
  // hangers and the haunch cannot disagree about where it is.
  const CABLE_MID = CROWN + 3.0;
  const cableY = x => HEAD - (HEAD - CABLE_MID) * (1 - Math.pow(Math.min(1, Math.abs(x) / PYX), 2));
  for (const sz of [-1, 1]) {
    const z = sz * (DW + 2.2);
    // the sag between the two heads
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = -PYX + (PYX * 2) * (i / 24);
      pts.push(new THREE.Vector3(x, cableY(x), z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.34, 8, false), cableM);
    b.add(m);
    // the backstays, head to anchor block
    for (const s of [-1, 1]) {
      b.cable(v3(s * PYX, HEAD, z), v3(s * 57, ANCH + 4.8, -22 + sz * 3.5),
        { sag: 1.2, r: 0.32, mat: cableM, segs: 12 });
    }
    // THE HAUNCH is structure, not a route. It was a walkable band with a flight
    // off the deck onto it, and that flight wanted 4.4 m of rise out of 2.7 m
    // of run — a ladder — while sitting at an x the band did not even cover.
    // The pylon helices are the way up now; the cable is the thing you fight
    // under.
    for (const s of [-1, 1]) {
      const a = s * (PYX - 9), c = s * (PYX - 1.4);
      const g = new THREE.BoxGeometry(Math.abs(c - a), 0.5, 1.5);
      g.translate((a + c) / 2, cableY((a + c) / 2) - 0.3, z);
      b.static_(g, cableM, Z);
    }
    // the hangers: vertical rods from the cable down to the deck
    for (let i = 1; i < 20; i++) {
      const x = -PYX + (PYX * 2) * (i / 20);
      const top = cableY(x);
      const g = new THREE.CylinderGeometry(0.08, 0.08, Math.max(0.4, top - deckY(x)), 6);
      g.translate(x, (top + deckY(x)) / 2, z);
      b.static_(g, cableM, Z);
    }
  }

  // ---- LAMPS, SIGNAGE AND WHAT IS LEFT ON THE SPAN -----------------------
  for (let i = 0; i < 9; i++) {
    for (const sz of [-1, 1]) {
      const x = -PYX + 4 + i * ((PYX * 2 - 8) / 8), z = sz * (DW - 1.0), y = deckY(x);
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.6, 8), cableM);
      pole.position.y = 1.8;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.9), emissive(0xffe0a8));
      head.position.set(0, 3.6, -sz * 0.6);
      g.add(pole, head);
      g.position.set(x, y, z);
      b.add(g);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), haloMaterial(0xffc87a, 0.15));
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(x, y + 0.06, z - sz * 1.6);
      b.add(halo);
      b.bounds.wall(x - 0.2, z - 0.2, x + 0.2, z + 0.2, y, y + 3.6, { id: 'blamp' + i + sz });
      b.breakable(g, {
        hp: 32, kind: 'metal', center: v3(x, y + 1.8, z), radius: 0.5, height: 3.6, baseY: y,
        colliderIds: ['blamp' + i + sz]
      });
      b.godRay(x, y + 3.5, z - sz * 0.6, 2.1, 3.5, 0xffc87a,
        { opacity: 0.10, taper: 0.16, lean: [0, -sz * 1.4], range: 56 });
    }
  }
  b.car(-18, deckY(-18), -4.0, 0, 0x2a3a6a);
  b.car(6, deckY(6), 4.0, Math.PI, 0x5a2a2a);
  b.car(22, deckY(22), -4.0, 0, 0x33383f);
  for (const s of [-1, 1]) b.sign(s * PYX, HEAD + 3.0, 0, 5.2, 1.1, 0x1d3f6a, s > 0 ? Math.PI / 2 : -Math.PI / 2);

  // ---- THE DEATH PAINTING ------------------------------------------------
  b.sigil(0, CROWN + 0.06, 0, 18, 0x9f4ad8, { rings: 3, spokes: 20, sides: 6, opacity: 0.20, spin: -0.02 });
  for (const s of [-1, 1]) {
    b.sigil(s * PYX, RB + 0.04, 0, 7.0, 0xd84a6a, { rings: 2, spokes: 10, sides: 3, opacity: 0.24, spin: s * 0.09 });
    b.beacon(s * PYX, HEAD + 1.6, 0, 0xff4a5a, { reach: 4.6, rate: 0.9 });
    b.sparker(s * (PYX - 5), BANDY + 0.8, DW + 2.2, { color: 0xbfe4ff });
    b.steamVent(s * 34, RB + 0.5, -11, { height: 3.6, period: 4.4, opacity: 0.20, color: 0xbfd4e4 });
    b.waterfall(s * (SPAN - 0.6), ANCH + 0.6, -7, 2.6, 3.2,
      { ry: Math.PI / 2, color: 0x9fc0d8, opacity: 0.42, speed: 2.2 });
  }
  b.mist(-64, -16, 64, 16, RB + 0.55, 0x8fb0c8, { opacity: 0.22, scale: 20 });
  for (let i = 0; i < 5; i++) {
    b.godRay(-30 + i * 15, HEAD + 8, 0, 4.4, HEAD + 8 - RB, 0xc4d8ff,
      { opacity: 0.05, taper: 0.4, lean: [4.5, 3.0], range: 130 });
  }

  // the works compound on the crown, which is this map's choke
  // ON THE LEVEL APPROACHES, not on the crown. The deck is a parabola built as
  // stepped segments, so a drum standing on one step tops out at exactly the
  // height of the step beside it — which is the wall-lip fault, sixteen times
  // over, on the one surface everybody walks.
  b.crates(-38, DEND, 5.4, { count: 3 });
  b.crates(-36.2, DEND, 6.4, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(-43 + i * 1.05, DEND, 5.8, { color: 0xc4562c });
  b.beacon(-34, DEND + 1.4, 6.4, 0xffa03c, { reach: 3.4 });
  b.crates(40, DEND, -5.4, { count: 3 });
  for (let i = 0; i < 3; i++) b.drum(36 + i * 1.05, DEND, -5.8, { color: 0xb8483c });
  b.crates(-44, RB, 22, { count: 2 });
  b.crates(42, RB, -22, { count: 2 });

  for (const [x, z] of [[-48, -28], [-22, 30], [6, -30], [26, 32], [46, -26], [-40, 34], [14, -36], [-10, 36]]) {
    b.rock(x, RB, z, rand(1.0, 1.8));
  }
  {
    const reeds = [];
    for (let i = 0; i < 200; i++) {
      const x = rand(-60, 60), z = rand(-44, 44);
      if (Math.abs(z) < 17) continue;
      if (Math.abs(x) > SPAN - 1) continue;
      reeds.push({ x, y: RB + 0.8, z, ry: rand(0, 3), sy: rand(0.7, 1.5) });
    }
    b.repeat(new THREE.BoxGeometry(0.09, 1.6, 0.09), b.tint('foliage', 0x2d4030), reeds);
  }

  b.particles(560, { x0: -60, x1: 60, y0: -2, y1: 26, z0: -42, z1: 42 },
    { color: 0x9fc0e8, size: 0.05, opacity: 0.28, vy: [-14, -8] });
  b.particles(200, { x0: -60, x1: 60, y0: -2.4, y1: 1.4, z0: -16, z1: 16 },
    { color: 0xa8c8d8, size: 0.14, opacity: 0.16, vy: [0.05, 0.3] });

  b.bounds.spawns = [
    v3(-14, deckY(-14), 0), v3(14, deckY(14), 0),
    v3(-14, RB + 0.62, -6), v3(14, RB + 0.62, 4)
  ];
  return b;
}
