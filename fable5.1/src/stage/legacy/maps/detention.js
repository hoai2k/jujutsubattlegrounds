// EISHU JUVENILE DETENTION CENTER — Yuji and Megumi's first mission.
//
// REFERENCE NOTE (researched): the PANOPTICON, which is what a purpose-built
// nineteenth-century detention block actually is — a drum of cells stacked in
// rings around one open rotunda, every door in the building visible from a
// single watch post standing in the middle of it, iron galleries running round
// each level and bridges spoking out to the post. Derelict, flooded, and lit by
// whatever gets through the broken roof.
//
// WHY THIS SHAPE. The previous version was a square atrium with a straight cell
// corridor out of either side: a plan with four corners, two dead ends and one
// axis, which is the same plan as half the other maps in this set. A panopticon
// is the opposite of all three. There is no corner to be held. Every cell mouth
// on every level looks at the same point, so height does not hide you — it puts
// you on a balcony in front of forty doorways. And the watch post in the middle
// is the only thing on the map that everything else is arranged around, which
// gives an open room a subject.
//
// LAYOUT (100 x 94 m):
//   y =  0.00  ROTUNDA     the flooded drum floor, ankle-deep and reacting.
//                          Open to the sky through the broken roof.
//   y =  0.00  GROUND RING sixteen cells round the rotunda, each a real room
//                          with a real doorway onto the floor.
//   y =  0.00  THE YARD    everything outside the drum: exercise ground, the
//                          service road, and the wall round the lot.
//   y =  4.80  FIRST GALLERY  the iron balcony and the second ring of cells.
//   y =  9.60  SECOND GALLERY the third ring, and the bridges to the post.
//   y =  9.60  WATCH POST  the top of the drum in the middle. Everything on
//                          this map can see it and it can see everything.
//   VERTICAL               two straight flights up to the first gallery, two
//                          helical stairs up to the second, four bridges in.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../../core/math.js';

export const DEF = {
  id: 'detention',
  name: 'EISHU DETENTION CENTER',
  jp: '盈舟少年院',
  desc: 'A flooded panopticon. Three rings of cells and one watch post.',
  extent: { minX: -50, maxX: 50, minZ: -47, maxZ: 47 },
  background: 0x070a12,
  fog: { color: 0x0a0e18, near: 26, far: 110 },
  // Darkest map in the set, but "dark" has to mean SILHOUETTED, not erased.
  grade: { vignette: 0.60, tint: [0.86, 0.93, 1.18], lift: 0.010, sat: 0.70 },
  lights: {
    key: { color: 0xb4ceff, intensity: 1.55, pos: [-8, 24, 10] },
    rim: { color: 0x6f8fc0, intensity: 0.9, pos: [10, 8, -10] },
    hemi: { sky: 0x44608c, ground: 0x2a2620, intensity: 0.68 }
  },
  // On the first gallery, looking across the rotunda at the watch post.
  previewCam: { pos: [3, 11, 18], look: [-2, 1.2, -12] },
  shadowScale: 0.82,
  shrineScale: 0.90,
  size: '100 × 94 m · panopticon rotunda, 3 cell rings, watch post, yard'
};

const R_DRUM = 4.4;        // the watch post
// THE ROTUNDA IS THE ARENA, so it is sized like one. It used to be a 17 m void
// with a solid 4.4 m post planted in the middle of it and two helices standing
// in the floor: the largest clear box anywhere on this map was six metres wide.
// The rings have all moved out, the post stands on legs from the first gallery
// up, and the ground floor is one open disc nearly fifty metres across.
const R_VOID = 21;         // gallery inner edge — the balcony lip
const R_CELL0 = 24.5;      // cell fronts
const R_CELL1 = 33;        // cell backs
const R_SHELL = 33.8;      // outer face of the drum
const G = 0, W = 4.8, U = 9.6;
const CAB = 13.4;          // top of the watch post's cabin
const ROOF = 14.6;         // the cell ring's roof
const NCELL = 16;
// TWO CELLS ON THE GROUND RING ARE PASSAGES, not cells: no back wall, and a
// matching gap in the shell behind each. Without them the drum is sealed —
// every spawn is inside it, the yard is outside it, and the reachability pass
// reported the whole exterior, watchtower included, as somewhere nobody can go.
// They are on opposite bearings so neither side of the building is the way out.
const THRU = [3, 11];
const THRU_A = THRU.map(i => (i + 0.5) / NCELL * Math.PI * 2);

// The two helices up to the second gallery, on the z axis; the two straight
// flights up to the first are on the x axis. Nothing shares a bearing.
const HELIX = [{ a: 0, dir: 1 }, { a: Math.PI, dir: -1 }];
// PULLED IN TO 15.5. At 21.5 the helices straddled r = 20 — the cell fronts —
// so their upper treads ran under the cell ring's own floor at the level above,
// which is a floor with no hole in it. Both stairs dead-ended inside the
// building's structure and every platform at the second level, bridges and
// watch post included, was unreachable. At 15.5 the whole helix lives over the
// rotunda void and only its arrival needs a well cut for it.
const HELIX_R = 19.0, HELIX_ROUT = 3.0, HELIX_WELL = 3.3;

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const AZ = 'rotunda';
  b.zone(AZ, { x0: -50, x1: 50, z0: -47, z1: 47, y0: -2, y1: 22 }, false);

  // ---- THIS BUILDING'S OWN STONE -----------------------------------------
  // Soot-black brick outside, limewashed brick inside, iron everywhere else.
  // The set's shared grey concrete is what made this place read as the same
  // material as Shibuya Station.
  const soot = b.tint('concrete', 0x3e4148);
  const lime = b.tint('concrete', 0x8e9294);
  const limeWall = b.tint('concreteWall', 0x7e8286);
  const wet = b.tint('tile', 0x4a5560);
  const iron = b.tint('darkMetal', 0x272c31, { rim: 0.5 });
  const rustIron = b.tint('rust', 0x5c4438, { rim: 0.34 });
  const domeIn = b.tint('concrete', 0x6e7276, { side: 2 });

  b.sky(0x050812, 0x0b1226, 0x1a2440, 320);
  b.groundPlane(0x0a0f14, 260);
  b.skyline(20, 150, { color: 0x060a12, minW: 20, maxW: 50, minH: 18, maxH: 44 });

  // ---- THE GROUND --------------------------------------------------------
  // One slab under the whole lot: inside the drum it is the rotunda floor,
  // outside it is the yard. Break a cell's back wall and you are out on it.
  b.floor(-48.6, -45.6, 48.6, 45.6, G, { mat: soot, id: 'ground' });
  b.roundDeck(0, 0, R_SHELL, G, { mat: wet, thick: 0.35, zone: AZ, id: 'drumfloor' });

  // standing water across the whole rotunda, ankle deep and reacting
  b.water(0, 0, 0, 0, 0.14, {
    radius: R_VOID + 1.5, shallow: 0x3f6f8a, deep: 0x0e1e2c, opacity: 0.42, caustic: 0.18
  });

  // ---- THE WATCH POST ----------------------------------------------------
  // A solid drum up to the second gallery with a glazed cabin on top of it.
  // Everything else on this map is arranged round it.
  b.roundTower(0, 0, R_DRUM, W, U - W, { mat: lime, segs: 22, cap: true, id: 'post' });
  // IT IS CARRIED FROM THE RIM. Four legs under the drum itself are four things
  // in the exact middle of the arena, and a floor with anything in the middle
  // of it has no big rectangle in it at all — that is what an arena is. So the
  // legs stand at the balcony lip on the diagonals, and four raking struts run
  // from their heads up to the underside of the drum, over everyone's heads.
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const lx = Math.sin(a) * (R_VOID - 0.8), lz = Math.cos(a) * (R_VOID - 0.8);
    b.roundTower(lx, lz, 0.55, G, W - 0.12, { mat: lime, segs: 10, id: 'postleg' + i });
    const dx = Math.sin(a) * R_DRUM - lx, dz = Math.cos(a) * R_DRUM - lz, dy = W - 0.2;
    const len = Math.hypot(dx, dz, dy);
    const strut = new THREE.BoxGeometry(0.5, len, 0.5);
    strut.translate(0, len / 2, 0);
    const m = new THREE.Mesh(strut, lime);
    m.position.set(lx, W - 0.2, lz);
    m.lookAt(Math.sin(a) * R_DRUM, W * 2 - 0.4, Math.cos(a) * R_DRUM);
    m.rotateX(Math.PI / 2);
    b.add(m);
  }
  // the cabin: an iron ring with four wide windows, one down each bridge
  for (let q = 0; q < 4; q++) {
    b.arcWall(0, 0, R_DRUM - 0.1, q * Math.PI / 2 + 0.32, (q + 1) * Math.PI / 2 - 0.32,
      U, CAB - 1.0, { mat: iron, thick: 0.3, segs: 6, zone: AZ, id: 'cab' + q });
  }
  for (let q = 0; q < 4; q++) {
    b.arcWall(0, 0, R_DRUM - 0.1, q * Math.PI / 2 + 0.32, (q + 1) * Math.PI / 2 - 0.32,
      CAB - 1.0, CAB, { mat: iron, thick: 0.3, segs: 6, zone: AZ, collide: false });
  }
  b.roundDeck(0, 0, R_DRUM + 1.1, CAB, { mat: iron, thick: 0.3, zone: AZ, walk: false });
  b.lip(-R_DRUM - 1.1, -R_DRUM - 1.1, R_DRUM + 1.1, R_DRUM + 1.1, CAB);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    b.stripLight(Math.sin(a) * 2.4, CAB - 1.3, Math.cos(a) * 2.4, 2.0,
      Math.abs(Math.sin(a)) > 0.7 ? 'z' : 'x', 0xa8c0d8, i === 1 ? 0.7 : 0);
  }
  b.beacon(0, CAB + 1.2, 0, 0xd8402c, { reach: 6.0, rate: 0.7 });

  // ---- THREE RINGS OF CELLS ----------------------------------------------
  // Each level is the same ring: a floor, sixteen radial partitions, a back
  // wall, and a front wall with a doorway punched through it per cell. The
  // doorways are what make the panopticon a panopticon — every one of them is
  // visible from the post.
  const cellRing = (y, level) => {
    b.roundDeck(0, 0, R_CELL1, y, {
      rIn: R_CELL0 - 0.4, mat: lime, thick: 0.4, zone: AZ, id: 'cells' + level
    });
    for (let i = 0; i < NCELL; i++) {
      const a = (i / NCELL) * Math.PI * 2;
      b.radialWall(0, 0, a, R_CELL0, R_CELL1, y, y + 4.2,
        { mat: limeWall, thick: 0.45, zone: AZ, id: 'part' + level + i });
      // the front, split around a doorway on the cell's own centreline
      const c = a + Math.PI / NCELL;
      const half = Math.PI / NCELL;
      const door = 0.052;                    // half-angle of the opening
      b.arcWall(0, 0, R_CELL0, c - half + 0.01, c - door, y, y + 4.2,
        { mat: limeWall, thick: 0.5, segs: 3, zone: AZ, id: 'fr' + level + i + 'a' });
      b.arcWall(0, 0, R_CELL0, c + door, c + half - 0.01, y, y + 4.2,
        { mat: limeWall, thick: 0.5, segs: 3, zone: AZ, id: 'fr' + level + i + 'b' });
      // the lintel over the doorway, so it reads as a door and not as a gap
      b.arcWall(0, 0, R_CELL0, c - door, c + door, y + 2.6, y + 4.2,
        { mat: limeWall, thick: 0.5, segs: 2, zone: AZ, collide: false });
      // the barred window in the back wall, and the moonlight through it —
      // except on the ground ring's two passages, which have no back at all
      if (level === 0 && THRU.includes(i)) continue;
      const win = i % 2 === 0;
      b.arcWall(0, 0, R_CELL1, c - half + 0.01, c + half - 0.01, y, y + 4.2, {
        mat: win ? rustIron : soot, thick: 0.7, segs: 4, zone: AZ,
        id: 'back' + level + i
      });
      if (win) {
        const bars = [];
        for (let k = 0; k < 5; k++) {
          const ba = c - 0.055 + k * 0.0275;
          bars.push({
            x: Math.sin(ba) * (R_CELL1 - 0.5), y: y + 2.0,
            z: Math.cos(ba) * (R_CELL1 - 0.5), ry: ba
          });
        }
        b.repeat(new THREE.BoxGeometry(0.09, 1.9, 0.14), rustIron, bars);
      }
    }
  };
  cellRing(G, 0);
  cellRing(W, 1);
  cellRing(U, 2);

  // ---- THE GALLERIES -----------------------------------------------------
  // An iron balcony hung off the cell fronts at each upper level, with the
  // helix wells cut through the second one. Its lip is the drop into the
  // rotunda: no rail on the inside, because a balcony you cannot be thrown off
  // is not worth standing on.
  b.roundDeck(0, 0, R_CELL0 + 0.1, W, {
    rIn: R_VOID, mat: iron, thick: 0.22, zone: AZ, id: 'gall1'
  });
  b.roundDeck(0, 0, R_CELL0 + 0.1, U, {
    rIn: R_VOID, mat: iron, thick: 0.22, zone: AZ, id: 'gall2',
    holes: HELIX.map(h => ({
      x: Math.sin(h.a) * HELIX_R, z: Math.cos(h.a) * HELIX_R, r: HELIX_WELL
    }))
  });
  // brackets under each, off the cell fronts
  for (const y of [W, U]) {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const px = Math.sin(a) * (R_CELL0 - 1.2), pz = Math.cos(a) * (R_CELL0 - 1.2);
      const g = new THREE.BoxGeometry(0.34, 0.34, 3.6);
      g.rotateY(a);
      g.translate(px, y - 0.5, pz);
      b.static_(g, iron, AZ);
    }
  }

  // ---- GETTING UP --------------------------------------------------------
  // Straight flights on the x axis to the first gallery, helices on the z axis
  // to the second. Nothing shares a bearing with anything else, so no route is
  // a shortcut past another.
  // Both flights hug the balcony lip. Run out to eleven metres from the middle
  // — which is what a comfortable 1-in-2 climb wants — and the two of them cut
  // the rotunda into three pieces and there is no arena left. Steep and against
  // the wall beats gentle and through the middle of the fight.
  for (const s of [-1, 1]) {
    b.stairs(s * 14.6, -1.7, s * R_VOID, 1.7, G, W, 'x', { mat: lime, zone: AZ });
    b.railing(s * 14.6, -1.9, s * R_VOID, -1.9, W - 2.4, { zone: AZ, collide: false });
    b.railing(s * 14.6, 1.9, s * R_VOID, 1.9, W - 2.4, { zone: AZ, collide: false });
  }
  HELIX.forEach((h, i) => {
    const hx = Math.sin(h.a) * HELIX_R, hz = Math.cos(h.a) * HELIX_R;
    b.spiralStair(hx, hz, W, U, {
      rIn: 0.55, rOut: HELIX_ROUT, rise: 0.24, turns: 1, dir: h.dir, a0: h.a,
      mat: iron, newelMat: iron, zone: AZ, id: 'helix' + i
    });
    // the landing that carries the top tread out to the gallery deck: the well
    // is 3.3 m across and the helix only reaches 3.0
    const lx = hx + Math.sin(h.a) * 2.9, lz = hz + Math.cos(h.a) * 2.9;
    b.floor(lx - 1.4, lz - 1.4, lx + 1.4, lz + 1.4, U, { mat: iron, zone: AZ, id: 'hland' + i });
  });

  // ---- THE BRIDGES -------------------------------------------------------
  // Four spokes from the second gallery to the watch post, on the diagonals so
  // they do not sit over the helices or the flights below.
  for (let q = 0; q < 4; q++) {
    const a = q * Math.PI / 2 + Math.PI / 4;
    const along = Math.abs(Math.sin(a)) > 0.5;
    // Axis-aligned decks would run off the diagonal, so each bridge is built
    // from its own short radial planks — a plank is a box, and a box on a
    // bearing is what `radialWall` and the helix treads already are.
    const n = 9;
    for (let k = 0; k < n; k++) {
      const r0 = R_DRUM - 0.3 + (R_VOID + 0.4 - R_DRUM + 0.3) * (k / n);
      const r1 = R_DRUM - 0.3 + (R_VOID + 0.4 - R_DRUM + 0.3) * ((k + 1) / n);
      const rc = (r0 + r1) / 2, len = (r1 - r0) * 1.25;
      const px = Math.sin(a) * rc, pz = Math.cos(a) * rc;
      const g = new THREE.BoxGeometry(2.6, 0.2, len);
      g.rotateY(a);
      g.translate(px, U - 0.1, pz);
      b.static_(g, iron, AZ);
      const ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const hx = (ca * 2.6 + sa * len) / 2, hz = (sa * 2.6 + ca * len) / 2;
      b.bounds.platform(px - hx, pz - hz, px + hx, pz + hz, U, { id: 'bridge' + q });
      // the handrail, drawn only: a collider on a 2.6 m walkway narrows it to
      // nothing and this is the only way onto the post
      for (const sgn of [-1, 1]) {
        const rg = new THREE.BoxGeometry(0.1, 1.0, len);
        rg.rotateY(a);
        rg.translate(px + Math.cos(a) * sgn * 1.3, U + 0.5, pz - Math.sin(a) * sgn * 1.3);
        b.static_(rg, iron, AZ);
      }
    }
  }

  // ---- THE SHELL AND WHAT IS LEFT OF THE ROOF ----------------------------
  // Stops 0.12 m under the roof it carries, for the reason every wall in this
  // kit does. Built as the arcs BETWEEN the two passage bearings, so the way
  // out of the building is a way out of the collision too.
  {
    const g = 0.085;                       // half-angle of a passage mouth
    const [p0, p1] = THRU_A;
    for (const [a0, a1] of [[p0 + g, p1 - g], [p1 + g, p0 + Math.PI * 2 - g]]) {
      b.arcWall(0, 0, R_SHELL, a0, a1, G, ROOF - 0.12,
        { mat: soot, thick: 1.0, zone: AZ, id: 'shell' });
    }
    // and the head above each mouth, so a passage reads as a doorway
    for (const a of THRU_A) {
      b.arcWall(0, 0, R_SHELL, a - g, a + g, 4.2, ROOF - 0.12,
        { mat: soot, thick: 1.0, zone: AZ, id: 'shellhead' });
    }
  }
  // the roof survives over the cell ring and has fallen in over the rotunda —
  // which is where all the light on this map comes from
  b.roundDeck(0, 0, R_SHELL, ROOF, { rIn: R_VOID - 1, mat: soot, thick: 0.5, zone: AZ, walk: false });
  b.lip(-R_SHELL, -R_SHELL, R_SHELL, R_SHELL, ROOF);
  b.dome(0, 0, ROOF - 0.4, R_SHELL, { mat: domeIn, rise: 5.0, oculus: 0.62, segs: 40, rings: 10 });
  // jagged slate round the hole
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const g = new THREE.ConeGeometry(0.4, rand(0.9, 2.2), 3);
    g.rotateX(Math.PI);
    g.translate(Math.sin(a) * (R_VOID - 0.6), ROOF + 0.4, Math.cos(a) * (R_VOID - 0.6));
    b.static_(g, soot, AZ);
  }
  b.godRay(0, ROOF + 0.4, 0, R_VOID - 2, ROOF + 0.4, 0xb4ceff,
    { opacity: 0.075, taper: 0.55, lean: [-6.5, 5.0], poolGain: 1.0, range: 140 });
  b.waterfall(-2.2, ROOF, 2.0, 3.0, ROOF - 0.3, { color: 0x8fb0d8, opacity: 0.26, speed: 3.6 });

  // ---- THE YARD ----------------------------------------------------------
  // A wall round the lot, a gate on the south side, and a watchtower in the
  // corner. The drum sits in the middle of it.
  // A RECTANGLE ON THE PROPERTY LINE, not a circle inside it. The round wall
  // stood at r = 44 on a 100 x 94 m lot, so it left a six-metre ring of yard
  // OUTSIDE itself that went all the way round the map — reachable, pointless,
  // and the largest clear box on the map.
  for (const sx of [-1, 1]) b.wall(sx * 48, -45, sx * 48, 45, G, 7.5, { mat: soot, thick: 1.0, id: 'perim' });
  b.wall(-48, -45, 48, -45, G, 7.5, { mat: soot, thick: 1.0, id: 'perim' });
  for (const [x0, x1] of [[-48, -4.6], [4.6, 48]]) {
    b.wall(x0, 45, x1, 45, G, 7.5, { mat: soot, thick: 1.0, id: 'perim' });
  }
  for (let i = 0; i < 40; i++) {
    const t = i / 39;
    for (const [px, pz] of [[-48 + 96 * t, -45], [-48 + 96 * t, 45], [-48, -45 + 90 * t], [48, -45 + 90 * t]]) {
      const g = new THREE.TorusGeometry(0.35, 0.03, 4, 8);
      g.rotateY(Math.abs(pz) === 45 ? 0 : Math.PI / 2);
      g.translate(px, 7.9, pz);
      b.static_(g, rustIron);
    }
  }
  // the gate, in the gap the wall leaves
  b.wall(-4.6, 45, 4.6, 45, G, 7, { mat: rustIron, destructible: true, hp: 110, id: 'gate' });
  for (const s of [-1, 1]) b.roundTower(s * 5.4, 45, 1.0, G, 8.4, { mat: soot, segs: 12 });
  // the watchtower over the yard
  {
    const TY = 7.2;
    b.roundDeck(-40, -36, 4.4, TY, { mat: rustIron, thick: 0.3, id: 'tower' });
    b.roundTower(-40, -36, 1.1, G, TY - 0.12, { mat: soot, segs: 14, id: 'towerleg' });
    b.spiralStair(-40, -36, G, TY, {
      rIn: 1.6, rOut: 4.2, rise: 0.24, turns: 1, dir: 1, a0: Math.PI * 0.75,
      mat: rustIron, newel: false, id: 'towerstair'
    });
    // SPLIT AROUND THE STAIR HEAD. A rail run the whole way round a deck whose
    // only way up arrives through it is how you build a platform nobody can
    // stand on, and the reachability pass said exactly that.
    b.arcWall(-40, -36, 4.5, Math.PI * 0.75 + 0.55, Math.PI * 0.75 + Math.PI * 2 - 0.55,
      TY + 0.5, TY + 1.1, { mat: rustIron, thick: 0.1, segs: 16, id: 'towerrail' });
    b.roundDeck(-40, -36, 5.2, TY + 3.0, { mat: rustIron, thick: 0.25, walk: false });
    b.lip(-45.2, -41.2, -34.8, -30.8, TY + 3.0);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const g = new THREE.BoxGeometry(0.16, 3.0, 0.16);
      g.translate(-40 + Math.sin(a) * 3.6, TY + 1.5, -36 + Math.cos(a) * 3.6);
      b.static_(g, rustIron);
    }
    b.beacon(-26, TY + 2.4, -22, 0xffa03c, { reach: 5.2, rate: 1.0 });
  }

  // ---- WHAT WAS SEALED IN HERE -------------------------------------------
  b.sigil(0, 0.16, 0, R_VOID - 3, 0xd83c5a, { rings: 3, spokes: 16, sides: 3, opacity: 0.24, spin: -0.04 });
  b.sigil(0, U + 0.05, 0, R_DRUM * 0.8, 0xd83c5a, { rings: 2, spokes: 8, sides: 3, opacity: 0.30, spin: 0.14 });
  b.mist(0, 0, 0, 0, 0.16, 0x6a86a8, { radius: R_VOID, opacity: 0.28, scale: 11 });

  // dead services strung across the drum, and the arcing where they parted
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    b.cable(v3(Math.sin(a) * R_VOID, W + 3.4, Math.cos(a) * R_VOID),
      v3(Math.sin(a + 2.3) * R_VOID, U + 1.4, Math.cos(a + 2.3) * R_VOID),
      { sag: 2.6, r: 0.05, mat: iron });
  }
  b.sparker(-R_VOID + 1.5, W + 1.4, 3, { color: 0xbfe4ff });
  b.sparker(R_VOID - 2, U + 1.2, -4, { color: 0xbfe4ff });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    b.hangingLamp(Math.sin(a) * (R_CELL0 - 1.6), W - 0.4, Math.cos(a) * (R_CELL0 - 1.6),
      1.0, 0x9fc0e0, { amp: 0.09, range: 42 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    b.stripLight(Math.sin(a) * (R_CELL0 + 4), U + 3.9, Math.cos(a) * (R_CELL0 + 4), 2.4,
      Math.abs(Math.sin(a)) > 0.7 ? 'z' : 'x', 0xa8c0d8, i === 5 ? 0.75 : 0);
  }

  // stores dumped in the yard, and a fuel dump on the service road
  b.crates(-16, G, 36, { count: 3 });
  b.crates(-14.2, G, 37.4, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(-21 - i * 1.05, G, 36, { color: 0x7a5a2c });
  b.beacon(-19, G + 1.6, 34, 0xffa03c, { reach: 3.6 });
  b.crates(34, G, -20, { count: 3 });
  for (let i = 0; i < 3; i++) b.drum(29 - i * 1.05, G, -20, { color: 0x6a4a2c });
  b.car(24, G, 30, 0.4, 0x2c2a26);
  b.car(-36, G, 8, Math.PI * 0.6, 0x3a2c26);
  for (const [tx, tz] of [[-40, 30], [38, 32], [-42, -14], [42, -20], [8, -40], [-10, -41]]) {
    b.tree(tx, G, tz, rand(0.9, 1.4));
  }

  // ---- AMBIENT ------------------------------------------------------------
  b.particles(220, { x0: -46, x1: 46, y0: 0.3, y1: 16, z0: -44, z1: 44 },
    { color: 0x8fa8c8, size: 0.07, opacity: 0.26, vy: [-0.15, 0.04] });
  b.particles(300, { x0: -R_VOID, x1: R_VOID, y0: 0.3, y1: ROOF, z0: -R_VOID, z1: R_VOID },
    { color: 0xa8c8ff, size: 0.05, opacity: 0.5, vy: [-5.5, -2.5] });     // the drip

  // On the rotunda floor, off the two stair feet and out from under the
  // bridges — the four half-diagonals are the only bearings with nothing on
  // them at every level.
  b.bounds.spawns = [0.125, 0.625, 1.125, 1.625].map(k => {
    const a = Math.PI * k;
    return v3(Math.sin(a) * 12, G, Math.cos(a) * 12);
  });
  return b;
}
