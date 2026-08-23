// YASOHACHI BRIDGE — the Death Painting fight. Yuji and Nobara against Eso and
// Kechizu, on and under a river crossing at night.
//
// REFERENCE NOTE (researched): a long steel road bridge over a wide, shallow
// river, carried on concrete piers, with a lattice truss standing over the deck
// and a stepped embankment either side down to gravel flats at the waterline.
// The fight uses all three: the deck, the truss overhead, and the riverbed.
//
// WHY THIS MAP EXISTS IN THE SET: it is the only LINEAR one. Every other map is
// a room, a plaza or a clearing with flanks; this is a corridor 80 m long and
// 16 m wide with a drop off both sides of it, so range and spacing mean
// something completely different here — and it is the only map where the low
// ground is the wide ground and the high ground is the choke.
//
// LAYOUT (124 x 88 m):
//   y = -2.60  RIVERBED     gravel flats and shallow water under the bridge —
//                           the widest floor on the map, and the safest.
//   y =  0.90  SERVICE WALK a maintenance gantry slung UNDER the deck, running
//                           the length of the span on the centreline. Two and a
//                           half metres of headroom, no way off it except its
//                           two ends, and nobody on the deck can see you.
//   y =  3.40  DECK         the bridge itself: two lanes, kerbs, lamp standards.
//   y =  9.60  TRUSS WALK   the top chord of the lattice. Narrow, exposed, and
//                           the only way to be above everything.
//   VERTICAL                an embankment slope at each end (riverbed -> deck),
//                           a stair at each end of the gantry, and a
//                           maintenance stair up each portal to the truss.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'yasohachi_bridge',
  name: 'YASOHACHI BRIDGE',
  jp: '八十八橋',
  desc: 'A steel span over black water. Deck, truss, gantry, and the riverbed below.',
  // groundY is the RIVERBED, not the deck. The deck, the banks and the flats
  // are all authored surfaces; anywhere they do not cover is the river, and the
  // river is the bottom of the map.
  extent: { minX: -62, maxX: 62, minZ: -44, maxZ: 44, groundY: -2.6 },
  // A river valley: gravel, water and grass banks, with one steel object laid
  // across it. Natural everywhere except the bridge — so the deck is the one
  // place on this map Hanami cannot feed, and it is the place worth holding.
  terrain: NATURAL,
  background: 0x0a1220,
  fog: { color: 0x101a2c, near: 52, far: 190 },
  grade: { vignette: 0.52, tint: [0.94, 0.99, 1.14], lift: 0.004, sat: 0.88 },
  lights: {
    key: { color: 0xc4d8ff, intensity: 1.1, pos: [12, 22, 10] },
    rim: { color: 0x6f8fd0, intensity: 0.7, pos: [-14, 9, -12] },
    hemi: { sky: 0x354a78, ground: 0x22261f, intensity: 0.48 }
  },
  previewCam: { pos: [-44, 11.0, 30], look: [8, 4.0, 0] },
  shadowScale: 1.3,
  shrineScale: 1.15,      // long, and the low ground is genuinely open
  size: '124 × 88 m · riverbed, gantry, bridge deck, truss walk'
};

const RB = -2.6;        // riverbed
const GY = 0.90;        // service gantry under the deck
const DY = 3.4;         // deck
const TY = 9.6;         // top chord
const SPAN = 40;        // deck half-length
const DW = 8;           // deck half-width

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const Z = 'bridge';
  b.zone(Z, { x0: -62, x1: 62, z0: -44, z1: 44, y0: -4, y1: 16 }, false);

  b.sky(0x060b18, 0x0e1830, 0x243452, 380);
  b.groundPlane(0x0d1414, 300);
  b.skyline(22, 200, { color: 0x16241e, shape: 'ridge', minW: 80, maxW: 170, minH: 30, maxH: 84 });

  // ---- THE VALLEY ---------------------------------------------------------
  // Gravel flats either side of the channel, then the grass banks climbing away
  // to the road level at each end.
  b.floor(-62, -44, 62, 44, RB, { mat: M.rock });
  b.water(-62, -14, 62, 14, RB + 0.5, { shallow: 0x4f90b0, deep: 0x0e2c44, opacity: 0.66, caustic: 0.3 });
  // Gravel bars standing out of the water, so the channel is crossable on foot.
  // Kept clear of |x| 32..40, where the gantry stairs come down: a 0.62 m bar
  // laid across the foot of a flight buries the bottom of it.
  for (const [x, z, w, d] of [[-24, 0, 12, 9], [-2, -5, 16, 10], [24, 4, 13, 9], [10, 9, 10, 7]]) {
    b.floor(x - w / 2, z - d / 2, x + w / 2, z + d / 2, RB + 0.62, { mat: M.rock });
  }

  // ---- THE EMBANKMENTS ----------------------------------------------------
  // One at each end of the span, riverbed up to road level. `b.slope` rather
  // than a bare ramp so there is something under the fighter's feet.
  // The descent runs down the OUTSIDE of each bank, not under the deck. A ramp
  // tucked beneath the span would be unreachable however carefully it was
  // graded: `floorAt` takes the highest surface at or below the fighter, and
  // the deck is always the higher one — you would walk out over the top of the
  // ramp every time and never find it. So the bank is laid with the ramp's
  // corridor cut out of it, the same way a stairwell is.
  for (const s of [-1, 1]) {
    const outer = s * 60, inner = s * SPAN;
    const rx = s * 50;
    const cut = { x0: rx - 5, z0: 14, x1: rx + 5, z1: 44 };
    b.floorHole(Math.min(outer, inner), -44, Math.max(outer, inner), 44, DY, cut,
      { mat: M.grass, id: 'bank' + s });
    b.slope(rx - 5, 40, rx + 5, 14, RB, DY, 'z', { mat: M.rock, depth: 1.4, zone: Z });
    // the abutment face, holding the road up over the riverbed
    const g = new THREE.BoxGeometry(1.0, DY - RB, 88);
    g.translate(s * (SPAN - 0.1), (DY + RB) / 2, 0);
    b.static_(g, M.rock);
    // Stops just under road level. A collider whose top is exactly the deck
    // height still catches anyone standing on the deck, and this one runs the
    // full width of the map — it would wall the deck off from both banks.
    b.bounds.wall(s * (SPAN - 0.6), -44, s * (SPAN + 0.4), 44, RB, DY - 0.12, { id: 'bankface' + s });
    // AND A LIP ACROSS ITS DRAWN TOP. The abutment is drawn from x = 39.4 to
    // 40.4 and the bank floor beside it starts at 40.0, so 0.6 m of it stood
    // proud of everything: 88 m of visible road-level stone, either side of the
    // span, with a 6 m drop to the riverbed under it and the bank one step
    // east. `mapcheck.rims()` found 280 cells of it — the largest single rim in
    // the set, and the map validated clean the whole time, because every other
    // check starts from the colliders and here the collider was what was
    // missing.
    b.lip(s * (SPAN - 0.6), -44, s * (SPAN + 0.4), 44, DY, { id: 'bankface' + s });
    // and the cheeks of the cutting the ramp runs down. Same 0.12 m: their tops
    // used to sit exactly at bank level, which put an invisible kerb along both
    // sides of every approach ramp.
    for (const cx of [rx - 5.5, rx + 5.5]) {
      const c = new THREE.BoxGeometry(1.0, DY - RB, 30);
      c.translate(cx, (DY + RB) / 2, 29);
      b.static_(c, M.rock);
      b.bounds.wall(cx - 0.5, 13.5, cx + 0.5, 44, RB, DY - 0.12, { id: 'rampcheek' + cx });
    }
  }

  // ---- THE DECK -----------------------------------------------------------
  // 80 m of steel between the two abutments, 16 m wide.
  b.floor(-SPAN, -DW, SPAN, DW, DY, { mat: M.asphalt, id: 'deck' });
  // kerbs and the centre line
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(SPAN * 2, 0.26, 0.5);
    g.translate(0, DY + 0.13, s * (DW - 0.3));
    b.static_(g, M.concrete, Z);
  }
  for (let i = 0; i < 26; i++) {
    const g = new THREE.BoxGeometry(1.8, 0.03, 0.2);
    g.translate(-38 + i * 3, DY + 0.02, 0);
    b.static_(g, emissive(0xdfe4ec), Z);
  }
  // the plate girders carrying the deck, and the underside between them
  for (const s of [-1, 1]) {
    const g = new THREE.BoxGeometry(SPAN * 2, 1.1, 0.5);
    g.translate(0, DY - 0.75, s * (DW - 1.1));
    b.static_(g, M.rust, Z);
  }
  // PIERS. Four in the channel; they are the only cover under the bridge.
  for (const x of [-16, 16]) {
    for (const z of [-4.2, 4.2]) {
      b.pillar(x, z, RB, DY - 0.3, 1.5, { square: true, mat: M.concrete, hp: 380, zone: Z });
    }
    const cap = new THREE.BoxGeometry(4.4, 0.7, 14);
    cap.translate(x, DY - 1.5, 0);
    b.static_(cap, M.concrete, Z);
  }

  // ---- THE SERVICE GANTRY, slung under the deck ---------------------------
  // The one place on this map nobody can see into. The deck is a shooting
  // gallery and the riverbed is wide open; a covered corridor directly between
  // them gives the map a third kind of space, and it is the natural thing to
  // hang under a truss bridge anyway.
  //
  // Its ONLY ways on and off are the two end stairs. That is the point: it is a
  // committed route, not a shortcut, and everything about the map's spacing
  // depends on it being one.
  const GX = SPAN - 7;
  b.floor(-GX, -1.9, GX, 1.9, GY, { mat: M.darkMetal, id: 'gantry', zone: Z });
  for (const s of [-1, 1]) {
    b.railing(-GX, s * 1.9, GX, s * 1.9, GY, { zone: Z, collide: false });
    // hangers back up to the girders, every panel
    for (let i = 0; i <= 12; i++) {
      const g = new THREE.BoxGeometry(0.14, DY - GY - 0.3, 0.14);
      g.translate(-GX + i * GX * 2 / 12, (GY + DY) / 2, s * 1.8);
      b.static_(g, M.rust, Z);
    }
  }
  // The two end stairs, down off the gantry onto the RIVERBED — not onto a
  // gravel bar, and not past the abutment.
  //
  // Both details cost a rebuild. A flight bottoming out on a 0.62 m bar is a
  // 0.62 m step at its foot, which is over STEP_UP and therefore a wall; and
  // the first version reached a metre PAST the abutment, whose collider runs
  // the full width of the map, so the only route onto the gantry started inside
  // a wall. The validator called it unreachable and it was exactly that.
  for (const s of [-1, 1]) {
    b.stairs(s * (GX + 6), -1.9, s * GX, 1.9, RB, GY, 'x', { mat: M.darkMetal, zone: Z });
  }
  for (let i = 0; i < 7; i++) {
    b.stripLight(-33 + i * 11, DY - 0.55, 0, 3.0, 'x', 0x9fd8c8, i === 3 ? 0.6 : 0);
  }

  // ---- THE TRUSS ----------------------------------------------------------
  // Verticals at every panel point, diagonals between them, and a top chord you
  // can walk. The top chord IS the third level, so it gets real platforms.
  const PANEL = 8, N = 10;
  for (let i = 0; i <= N; i++) {
    const x = -SPAN + i * PANEL;
    for (const s of [-1, 1]) {
      const v = new THREE.BoxGeometry(0.34, TY - DY, 0.34);
      v.translate(x, (TY + DY) / 2, s * (DW - 0.3));
      b.static_(v, M.rust, Z);
      if (i < N) {
        // the diagonal to the next panel point, alternating direction
        const up = i % 2 === 0;
        const len = Math.hypot(PANEL, TY - DY);
        const d = new THREE.BoxGeometry(len, 0.26, 0.26);
        d.rotateZ(up ? -Math.atan2(TY - DY, PANEL) : Math.atan2(TY - DY, PANEL));
        d.translate(x + PANEL / 2, (TY + DY) / 2, s * (DW - 0.3));
        b.static_(d, M.rust, Z);
      }
    }
    // the portal bracing overhead
    const t = new THREE.BoxGeometry(0.3, 0.3, DW * 2);
    t.translate(x, TY + 0.3, 0);
    b.static_(t, M.rust, Z);
  }
  // the two top chords: narrow, exposed, and the best sightline on the map
  for (const s of [-1, 1]) {
    b.floor(-SPAN, s * (DW - 0.3) - 0.75, SPAN, s * (DW - 0.3) + 0.75, TY, { mat: M.rust, id: 'chord' + s });
  }
  // a few cross walks so the two chords are one route and not two
  for (const x of [-20, 0, 20]) {
    b.floor(x - 0.75, -DW + 0.3, x + 0.75, DW - 0.3, TY, { mat: M.rust, id: 'cross' + x });
  }

  // MAINTENANCE STAIRS up to the truss. They climb from the BANK, outside the
  // span, and their top tread is the chord's end tread — a flight that landed
  // anywhere along the chord would be buried inside it.
  for (const s of [-1, 1]) {
    b.stairs(s * 51, s * (DW - 0.3) - 0.75, s * SPAN, s * (DW - 0.3) + 0.75, DY, TY, 'x',
      { mat: M.darkMetal, zone: Z });
  }

  // ---- LAMPS + DRESSING ---------------------------------------------------
  for (let i = 0; i < 8; i++) {
    for (const s of [-1, 1]) {
      const x = -35 + i * 10, z = s * (DW - 0.9);
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 3.6, 8), M.darkMetal);
      pole.position.y = 1.8;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.9), emissive(0xffe0a8));
      head.position.set(0, 3.6, -s * 0.6);
      g.add(pole, head);
      g.position.set(x, DY, z);
      b.add(g);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), haloMaterial(0xffc87a, 0.15));
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(x, DY + 0.06, z - s * 1.6);
      b.add(halo);
      b.bounds.wall(x - 0.2, z - 0.2, x + 0.2, z + 0.2, DY, DY + 3.6, { id: 'blamp' + i + s });
      b.breakable(g, {
        hp: 32, kind: 'metal', center: v3(x, DY + 1.8, z), radius: 0.5, height: 3.6, baseY: DY,
        colliderIds: ['blamp' + i + s]
      });
    }
  }
  // abandoned traffic on the span
  b.car(-26, DY, -4.2, 0, 0x2a3a6a);
  b.car(8, DY, 4.2, Math.PI, 0x5a2a2a);
  b.car(31, DY, -4.2, 0, 0x33383f);
  b.car(-6, DY, 4.2, Math.PI, 0x3a4a3a);
  // a name plate on each portal
  for (const s of [-1, 1]) b.sign(s * SPAN, DY + 4.6, 0, 5.2, 1.1, 0x1d3f6a, s > 0 ? Math.PI / 2 : -Math.PI / 2);

  // boulders on the flats, so the low ground has cover of its own
  for (const [x, z] of [[-46, -26], [-20, 28], [6, -28], [24, 30], [44, -24], [-38, 32], [12, -34], [-8, 34]]) {
    b.rock(x, RB, z, rand(1.0, 1.8));
  }
  {
    // reeds on the flats — one instanced draw, not two hundred
    const reeds = [];
    for (let i = 0; i < 200; i++) {
      const x = rand(-58, 58), z = rand(-42, 42);
      if (Math.abs(z) < 15) continue;                   // keep the channel clear
      if (Math.abs(x) > SPAN - 1) continue;             // and the banks
      reeds.push({ x, y: RB + 0.8, z, ry: rand(0, 3), sy: rand(0.7, 1.5) });
    }
    b.repeat(new THREE.BoxGeometry(0.09, 1.6, 0.09), M.foliage, reeds);
  }

  // =========================================================================
  // NIGHT ON THE RIVER
  // =========================================================================
  // Three levels of correct steel with a drizzle over it. What the map was
  // short of is the thing a bridge at night is entirely made of — light falling
  // through a lattice onto moving water — plus any evidence at all that
  // something happened here.

  // ---- WHAT THE LAMPS DO --------------------------------------------------
  // The deck lamps threw a flat halo disc and stopped. These are the cones they
  // stand in, and the light that gets past the deck to the gantry and the
  // riverbed through the gaps between the girders.
  for (let i = 0; i < 8; i++) {
    for (const s of [-1, 1]) {
      const x = -35 + i * 10, z = s * (DW - 0.9);
      b.godRay(x, DY + 3.5, z - s * 0.6, 2.1, 3.5, 0xffc87a,
        { opacity: 0.10, taper: 0.16, lean: [0, -s * 1.4], range: 56 });
    }
  }
  // and the moon coming down through the truss, which is the map's own ceiling
  for (let i = 0; i < 6; i++) {
    b.godRay(-34 + i * 14, TY + 6, 0, 4.4, TY + 6 - RB, 0xc4d8ff,
      { opacity: 0.05, taper: 0.4, lean: [4.5, 3.0], range: 130 });
  }

  // ---- THE WATER ----------------------------------------------------------
  // Mist lying on the channel and rolling over the gravel bars, and the spill
  // off the abutment weirs at each end of the span.
  b.mist(-62, -15, 62, 15, RB + 0.55, 0x8fb0c8, { opacity: 0.24, scale: 20 });
  for (const s of [-1, 1]) {
    b.waterfall(s * (SPAN - 0.7), RB + 2.4, -6, 2.6, 2.9,
      { ry: Math.PI / 2, color: 0x9fc0d8, opacity: 0.42, speed: 2.2 });
    b.waterfall(s * (SPAN - 0.7), RB + 2.4, 7, 2.2, 2.9,
      { ry: Math.PI / 2, color: 0x9fc0d8, opacity: 0.42, speed: 2.6 });
    b.steamVent(s * 34, RB + 0.5, -10, { height: 3.6, period: 4.4, opacity: 0.20, color: 0xbfd4e4 });
  }

  // ---- THE DEATH PAINTING ------------------------------------------------
  // A veil went up over this crossing before the fight, and the map never said
  // so. The great ward runs the length of the span at deck level; the two
  // anchors are on the riverbed under the piers, which is where anyone who gets
  // knocked off the deck lands.
  b.sigil(0, DY + 0.05, 0, 22, 0x9f4ad8, { rings: 3, spokes: 20, sides: 6, opacity: 0.20, spin: -0.02 });
  b.sigil(-16, RB + 0.04, 0, 6.5, 0xd84a6a, { rings: 2, spokes: 10, sides: 3, opacity: 0.24, spin: 0.09 });
  b.sigil(16, RB + 0.04, 0, 6.5, 0xd84a6a, { rings: 2, spokes: 10, sides: 3, opacity: 0.24, spin: -0.09 });
  b.sigil(0, GY + 0.04, 0, 1.8, 0x9f4ad8, { rings: 2, spokes: 6, sides: 3, opacity: 0.30, spin: 0.18 });

  // ---- THE SPAN IS DERELICT ----------------------------------------------
  // Feeders slung under the truss and arcing where they have parted, a beacon
  // on each portal, and the works compound at the north end of the deck. The
  // drums are the gimmick and they are on the DECK, which is the map's choke:
  // this is the one place in the set where blowing a row of them mid-crossing
  // is a real thing to do to somebody.
  for (const s of [-1, 1]) {
    b.cable(v3(-SPAN, TY - 0.6, s * (DW - 0.3)), v3(0, TY - 2.2, s * (DW - 0.3)), { sag: 1.2, r: 0.05 });
    b.cable(v3(0, TY - 2.2, s * (DW - 0.3)), v3(SPAN, TY - 0.6, s * (DW - 0.3)), { sag: 1.2, r: 0.05 });
    b.beacon(s * (SPAN - 1.2), TY + 1.4, 0, 0xff4a5a, { reach: 4.6, rate: 0.9 });
    b.sparker(s * 22, TY - 2.6, s * (DW - 0.3), { color: 0xbfe4ff });
  }
  b.sparker(0, DY - 0.8, 1.9, { color: 0xbfe4ff });
  b.crates(-33, DY, 5.4, { count: 3 });
  b.crates(-31.2, DY, 6.6, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(-36 + i * 1.05, DY, 5.8, { color: 0xc4562c });
  b.beacon(-29, DY + 1.4, 6.4, 0xffa03c, { reach: 3.4 });
  b.crates(34, DY, -5.4, { count: 3 });
  for (let i = 0; i < 3; i++) b.drum(29 + i * 1.05, DY, -5.8, { color: 0xb8483c });
  b.beacon(27, DY + 1.4, -6.4, 0xffa03c, { reach: 3.4 });
  // and a stack on the flats, so the low ground has something to break too
  b.crates(-42, RB, 20, { count: 2 });
  b.crates(40, RB, -20, { count: 2 });

  // ---- AMBIENT ------------------------------------------------------------
  // river mist along the water, and the drizzle the whole fight happens in
  b.particles(560, { x0: -58, x1: 58, y0: -2, y1: 24, z0: -40, z1: 40 },
    { color: 0x9fc0e8, size: 0.05, opacity: 0.28, vy: [-14, -8] });
  b.particles(200, { x0: -58, x1: 58, y0: -2.4, y1: 1.4, z0: -15, z1: 15 },
    { color: 0xa8c8d8, size: 0.14, opacity: 0.16, vy: [0.05, 0.3] });

  b.bounds.spawns = [v3(-12, DY, 0), v3(12, DY, 0), v3(-12, RB + 0.62, -5), v3(12, RB + 0.62, -5)];
  return b;
}
