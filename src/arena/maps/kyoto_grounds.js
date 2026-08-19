// KYOTO SISTER-SCHOOL EXCHANGE GROUNDS. The forested mountain event site, and
// the only natural map in the set — its whole job is to feel unlike the other
// urban and interior locations.
//
// REFERENCE NOTE (researched): the Goodwill Event's team battle is fought
// across open mountain woodland with steep elevation, exposed rock outcrops
// and a river cutting through it, with a clearing at the centre where the teams
// first meet. The event runs over a whole mountain rather than a courtyard,
// which is why this is the largest natural space in the set.
//
// LAYOUT (116 x 108 m):
//   y =  0.00  CLEARING     the central engagement space — open grass ringed
//                           by trees, and the only flat ground on the map.
//   y = -1.60  THE RIVER    a cut running north-south through the clearing.
//                           Shallow, walkable, and it reacts to combat.
//   y = -1.60  PLUNGE POOL  the river's head in the north, under a cascade off
//                           the plateau shoulder, with a shelf behind the fall.
//   y =  1.90  FOOTBRIDGE   a timber deck over the river at the south end —
//                           the fast crossing, and the map's one choke.
//   y =  3.60  EAST BENCH   a raised shelf of ground reached by two slopes
//   y =  7.40  EAST LOOKOUT a rock knuckle on the bench, so the east side has
//                           high ground of its own rather than ceding it.
//   y =  8.00  ROCK PLATEAU the high ground: a rock formation on the west
//                           side, climbable in two steps.
//   y = 11.60  UPPER CRAG   the summit of the plateau — one small platform,
//                           the best sightline and the worst escape.
//   NO ARCHITECTURE          apart from the bridge: the vertical is terrain.
//
// THE FLOOR IS AUTHORED AROUND THE RIVER, not over it. A single map-wide grass
// slab is the obvious way to write this and it silently deletes the whole river
// — `floorAt` returns the highest surface, so grass at y = 0 beats the bed at
// y = -1.6 everywhere, and the water is visible, lit, animated and impossible
// to stand in. The banks and the pool need `b.pit` under them for the same
// reason: the fallback ground is one map-wide number.
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'kyoto_grounds',
  name: 'KYOTO EXCHANGE GROUNDS',
  jp: '京都姉妹校交流会',
  desc: 'Mountain woodland. Rock, river and dappled green light.',
  extent: { minX: -58, maxX: 58, minZ: -54, maxZ: 54 },
  // TERRAIN: the only map in the set that is natural end to end — grass floor,
  // rock river bed, rock plateau, almost no architecture. It is Hanami's best
  // map by a distance and it is meant to be.
  terrain: NATURAL,
  background: 0x6f8f7a,
  fog: { color: 0x88a08c, near: 74, far: 230 },
  grade: { vignette: 0.46, tint: [0.98, 1.08, 0.94], lift: 0.005, sat: 1.10 },
  lights: {
    key: { color: 0xfff4d0, intensity: 1.5, pos: [10, 24, 6] },
    rim: { color: 0x8fd8a0, intensity: 0.85, pos: [-12, 10, -12] },
    hemi: { sky: 0xbfe0c0, ground: 0x3a4a28, intensity: 0.6 }
  },
  // stage-select beauty shot: hand-picked so the preview never ends up
  // inside a wall, above a ceiling or buried in the treeline.
  // Down the river, which is the one corridor the forest scatter is guaranteed
  // to keep clear (|x| < 8.5 is excluded) — an earlier shot was inside a cedar
  // about half the time, because the trees are placed at random.
  previewCam: { pos: [3.0, 17.0, 41], look: [-8, 2.0, -10] },
  shadowScale: 1.25,
  shrineScale: 1.07,      // a clearing with treeline to escape into
  size: '116 × 108 m · clearing, river, plateau, crag'
};

// The river trench and the two bank cuts, in one place: the grass floor, the
// pits and the tree scatter all have to agree about where the water is, and
// three hand-copied sets of numbers is how they stop agreeing.
const RX = 6;              // river half-width
const BX = 11;             // outer edge of the bank slopes
const BZ = 9;              // how far the bank cuts run along the river
const SY = -1.6;           // river bed
const PZ0 = -50, PZ1 = -32; // plunge pool, at the head of the river

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  b.sky(0x4f86c8, 0x9fc0d8, 0xd8e0c8, 380);
  b.groundPlane(0x25381f, 300);
  b.skyline(18, 190, { color: 0x2c4432, shape: 'ridge', minW: 90, maxW: 200, minH: 40, maxH: 100 });

  // ---- GRASS, cut around the water ---------------------------------------
  // West and east of the river, each with the bank slope's footprint punched
  // out of it so the slope is not paved over by the field it climbs to.
  b.floorHole(-58, -54, -RX, 54, 0, { x0: -BX, z0: -BZ, x1: -RX, z1: BZ },
    { mat: M.grass });
  b.floorHole(RX, -54, 58, 54, 0, { x0: RX, z0: -BZ, x1: BX, z1: BZ },
    { mat: M.grass });

  // ---- THE RIVER ----------------------------------------------------------
  // The fallback ground is one number for the whole map, and it is 0 — so the
  // bed, the bank cuts and the pool each need their own pit or the fighter
  // stands on thin air at grass level above the water.
  b.pit(-RX, PZ0, RX, 54, SY);
  b.pit(-RX, PZ0, RX, PZ1, SY - 0.5);     // lowest pit wins, so the pool basin
  b.pit(-BX, -BZ, -RX, BZ, SY);
  b.pit(RX, -BZ, BX, BZ, SY);
  b.floor(-RX, PZ1, RX, 54, SY, { mat: M.rock });
  // OPACITY IS LOAD-BEARING HERE, not a look. The river is knee-deep and runs
  // down the middle of the map, so most fights cross it — and at 0.62 the
  // surface swallowed everything under it, which turned a fighter standing in
  // the water into a fighter buried to the thigh in green ground. At 0.42 the
  // submerged half of the body reads through the surface, and reading the legs
  // is what tells you it is water rather than a hole. The plunge pool keeps a
  // heavier surface: it is deeper, it is meant to hide its floor, and nobody
  // fights standing in it.
  b.water(-RX + 0.3, PZ1, RX - 0.3, 54, SY + 0.48,
    { shallow: 0x8fd0e0, deep: 0x2a6a7a, opacity: 0.42, caustic: 0.4 });

  // BANK SLOPES so you can always get out of the water, one per side. Authored
  // low-end-first in both directions: `bounds.ramp` pins yLow to the MINIMUM
  // corner regardless, which is what `b.slope` corrects for — but the authoring
  // still has to name the low end first or the correction has nothing to work
  // with. The west bank once ran the other way and climbing out of the river on
  // that side took you further down.
  b.slope(RX, -BZ, BX, BZ, SY, 0, 'x', { mat: M.rock, depth: 1.1 });
  b.slope(-RX, -BZ, -BX, BZ, SY, 0, 'x', { mat: M.rock, depth: 1.1 });

  // STEPPING STONES at the crossing point, so the river is not a wall.
  // Authored ONCE. They used to live inside the two-sided bank loop, which
  // built and registered every stone twice — six cylinders in three places,
  // z-fighting with themselves and paying for it in both draw calls and
  // collision.
  for (let i = 0; i < 4; i++) {
    const x = -4.2 + i * 2.8;
    b.bounds.platform(x - 1.05, -1.5, x + 1.05, 1.5, SY + 0.62);
    const g = new THREE.CylinderGeometry(1.15, 1.25, 1.9, 8);
    g.translate(x, SY - 0.32, 0);
    b.static_(g, M.rock);
  }

  // THE PLUNGE POOL AND CASCADE (north). The river has to come from somewhere,
  // and a waterfall gives the map a landmark at the end of its longest
  // sightline.
  //
  // The basin is only 0.5 m below the bed on purpose: STEP_UP is 0.55, so the
  // lip between pool and river is a step the fighter takes in both directions
  // without a ramp. A deeper, prettier basin would need one, and a basin you
  // can fall into and not climb out of is worse than a shallow one.
  b.floor(-RX, PZ0, RX, PZ1, SY - 0.5, { mat: M.rock, id: 'pool' });
  b.water(-RX + 0.3, PZ0 + 0.5, RX - 0.3, PZ1, SY + 0.34,
    { shallow: 0xa8e0ec, deep: 0x256878, opacity: 0.56, caustic: 0.55 });
  // the grass closes over the head of the channel, so the top of the fall is
  // walkable ground rather than a hole in the map edge
  b.floor(-RX, -54, RX, PZ0, 0, { mat: M.grass });
  // the rock head-wall the water comes off
  b.wall(-RX, PZ0, RX, PZ0, SY - 0.5, 3.2, { mat: M.rock, thick: 0.8 });
  // the fall itself: two translucent sheets and a spray haze
  for (const [w, op, zo] of [[10.4, 0.42, 0.55], [8.0, 0.30, 0.85]]) {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.4), glowMaterial(0xcfeef8, op));
    sheet.position.set(0, SY + 0.9, PZ0 + zo);
    b.add(sheet);
  }
  b.particles(220, { x0: -5.4, x1: 5.4, y0: SY, y1: SY + 2.3, z0: PZ0, z1: PZ0 + 3 },
    { color: 0xdff4ff, size: 0.09, opacity: 0.4, vy: [-5, -2] });

  // ---- THE FOOTBRIDGE (south) ---------------------------------------------
  // A timber deck over the river, high enough to fight under. Its approach
  // ramps sit on the grass rather than cutting into it, so nothing here can
  // pave over the bank.
  const FZ = 22, FY = 1.9;
  b.floor(-RX - 1, FZ - 2.2, RX + 1, FZ + 2.2, FY, { mat: M.wood, id: 'bridge' });
  b.railing(-RX - 1, FZ - 2.2, RX + 1, FZ - 2.2, FY);
  b.railing(-RX - 1, FZ + 2.2, RX + 1, FZ + 2.2, FY);
  b.slope(-BX - 3, FZ - 2.2, -RX - 1, FZ + 2.2, 0, FY, 'x', { mat: M.wood, depth: 0.5, segs: 10 });
  b.slope(BX + 3, FZ - 2.2, RX + 1, FZ + 2.2, 0, FY, 'x', { mat: M.wood, depth: 0.5, segs: 10 });
  for (const x of [-RX + 0.6, RX - 0.6]) {
    const g = new THREE.CylinderGeometry(0.32, 0.36, FY - SY, 8);
    g.translate(x, SY + (FY - SY) / 2, FZ);
    b.static_(g, M.trunk);
  }

  // ---- EAST BENCH — a shelf of raised ground ------------------------------
  //
  // Every slope on this map was once a bare `bounds.ramp` with no geometry
  // behind it: invisible ramps the fighter walked up through open air, on the
  // one map whose entire vertical structure is terrain. They are all `b.slope`
  // now, which draws the bank it registers.
  const BY = 3.6;
  b.floor(18, -28, 52, 28, BY, { mat: M.grass, id: 'bench' });
  b.slope(BX, -11, 18, 11, 0, BY, 'x', { mat: M.rock, depth: 0.7 });
  // The visible bank face, split around the slope so it does not wall it off.
  // `bankFace` rather than bare geometry: the face stands 0.8 m proud of the
  // bench floor it edges, and drawn on its own that overhang was grass you
  // could see, walk onto and drop 3.6 m through. It carries the deck out to
  // its own edge now, and it is solid, so the bench cannot be walked into from
  // the clearing either.
  for (const [z0, z1] of [[-28, -11], [11, 28]])
    b.bankFace(17.2, z0, 18.2, z1, BY, -0.5, { mat: M.rock });
  // and a second slope round the north end so it is not a single choke
  b.slope(26, 28, 38, 38, BY, 0, 'z', { mat: M.grass, depth: 0.9 });

  // EAST LOOKOUT — a rock knuckle standing on the bench. Before this the whole
  // west side had two tiers of high ground and the east side had one, and every
  // fight drifted west because that is where the sightlines were.
  const LY = 7.4;
  b.floor(34, -9, 48, 9, LY, { mat: M.rock, id: 'lookout' });
  b.slope(28, -5, 34, 5, BY, LY, 'x', { mat: M.rock, depth: 1.0 });
  for (const [z0, z1] of [[-9.4, -5.2], [5.2, 9.4]])
    b.bankFace(33.7, z0, 48.3, z1, LY, BY - 0.3, { mat: M.rock });
  // split around the slope mouth, like every other face here: a lip laid across
  // the top of a flight buries it, and the fighter surfaces through solid rock
  for (const [z0, z1] of [[-9.5, -5.2], [5.2, 9.5]])
    b.bankFace(33.1, z0, 34.3, z1, LY, BY - 0.3, { mat: M.rock });

  // ---- ROCK PLATEAU (west) — the high ground, two steps up ----------------
  const PY = 8.0, UY = 11.6;
  b.floor(-52, -20, -20, 20, PY, { mat: M.rock, id: 'plateau' });
  // The plateau is at x <= -20, so this slope has to be HIGH at -20 and low out
  // in the clearing at -11. It was once the other way round: a climb that took
  // you up as you walked AWAY from the rock and dropped you back on the grass
  // at the foot of a cliff you could not get onto.
  b.slope(-BX, -8, -20, 8, 0, PY, 'x', { mat: M.rock, depth: 1.8 });
  // the cliff face, split around the slope
  for (const [z0, z1] of [[-20, -8.2], [8.2, 20]])
    b.bankFace(-20.25, z0, -18.95, z1, PY, -0.7, { mat: M.rock });
  for (const z of [-19.6, 19.6])
    b.bankFace(-52, z - 0.65, -20, z + 0.65, PY, -0.7, { mat: M.rock });
  // THE CRAG on top. Same inversion trap again: the crag is at x <= -30, so the
  // second step up has to be high at -30, not at -24.
  b.floor(-46, -9, -30, 9, UY, { mat: M.rock, id: 'crag' });
  b.slope(-24, -5, -30, 5, PY, UY, 'x', { mat: M.rock, depth: 0.9 });
  for (const [z0, z1] of [[-9.5, -5.2], [5.2, 9.5]])
    b.bankFace(-46, z0, -30, z1, UY, PY - 0.3, { mat: M.rock });
  for (const [z0, z1] of [[-9.5, -5.2], [5.2, 9.5]])
    b.bankFace(-30.25, z0, -28.95, z1, UY, PY - 0.3, { mat: M.rock });

  // scattered outcrops — cover, and they double as low platforms
  const outcrops = [[-14, -26], [13, -34], [28, 16], [-9, 36], [40, -18], [-26, 32],
  [24, 40], [-44, -34], [16, -8], [-15, 8], [46, 34], [-40, 44]];
  for (const [x, z] of outcrops) b.rock(x, 0, z, rand(1.0, 1.9));
  b.rock(-34, PY, 13, 1.5);
  b.rock(-42, PY, -12, 1.2);
  b.rock(44, BY, -20, 1.3);
  b.rock(24, BY, 22, 1.1);

  // ---- FOREST -------------------------------------------------------------
  // Dense at the edges, thinning toward the clearing. The near ring is
  // breakable (a launched body genuinely takes trees down); the far ring is
  // instanced scenery and never breaks.
  // THE SPAWN CLEARANCE. The scatter is random and the spawns are inside its
  // radius, so a cedar can land on top of one — and a tree carries a collider,
  // so the fighter starts the round standing inside it and is shoved out of it
  // on the first frame. It showed up as an intermittent map-check failure
  // (spawn 1 "inside a wall" on maybe one build in three), which is exactly
  // what a random placement fault looks like. Anything within 4 m of a spawn
  // is dropped, here rather than in the tree helper: the spawns are this map's
  // to know about.
  const SPAWNS = [[-15, -16], [15, 16], [15, -16], [-15, 16]];
  const nearSpawn = (x, z) => SPAWNS.some(([sx, sz]) => Math.hypot(x - sx, z - sz) < 4);
  const near = [], far = [];
  for (let i = 0; i < 230; i++) {
    const a = rand(0, Math.PI * 2), r = rand(13, 56);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (nearSpawn(x, z)) continue;                           // keep the spawns clear
    if (Math.abs(x) < BX + 2.5) continue;                    // keep the river clear
    if (x > 17 && x < 53 && Math.abs(z) < 29) { if (Math.random() < 0.62) continue; }
    if (x > 33 && x < 49 && Math.abs(z) < 10) continue;      // keep the lookout clear
    if (x < -19 && x > -53 && Math.abs(z) < 21) continue;    // keep the plateau clear
    if (z < PZ1 + 2 && Math.abs(x) < BX + 3) continue;       // keep the pool clear
    const y = x < -20 && Math.abs(z) < 20 ? PY
      : (x > 34 && x < 48 && Math.abs(z) < 9 ? LY
        : (x > 18 && x < 52 && Math.abs(z) < 28 ? BY : 0));
    (r < 24 && near.length < 22 ? near : far).push([x, y, z]);
  }
  for (const [x, y, z] of near) b.tree(x, y, z, rand(1.1, 1.9));
  const fi = far.map(([x, y, z]) => ({ x, y, z, s: rand(1.2, 2.4), ry: rand(0, 6.3) }));
  b.repeat(new THREE.CylinderGeometry(0.22, 0.38, 4.4, 6), M.trunk,
    fi.map(f => ({ ...f, y: f.y + 2.2 * f.s, s: f.s, sy: f.s })));
  b.repeat(new THREE.SphereGeometry(2.1, 8, 6), M.foliage,
    fi.map(f => ({ ...f, y: f.y + 5.8 * f.s, s: f.s })));
  b.repeat(new THREE.SphereGeometry(1.6, 8, 6), M.foliage,
    fi.map(f => ({ ...f, x: f.x + 0.8, y: f.y + 7.4 * f.s, s: f.s * 0.8 })));

  // fallen logs across the clearing — cover you can vault
  for (const [lx, lz, len] of [[-13, 17, 10], [21, -22, 8]]) {
    const g = new THREE.CylinderGeometry(0.6, 0.7, len, 9);
    g.rotateZ(Math.PI / 2);
    g.translate(lx, 0.6, lz);
    b.static_(g, M.trunk);
    b.bounds.wall(lx - len / 2, lz - 0.6, lx + len / 2, lz + 0.6, 0, 1.1, { id: 'log' + lx });
    b.bounds.platform(lx - len / 2, lz - 0.6, lx + len / 2, lz + 0.6, 1.2);
  }

  // ---- DAPPLED LIGHT + AMBIENT LIFE --------------------------------------
  // the map's signature: broken shafts of sun through the canopy
  for (let i = 0; i < 22; i++) {
    const a = rand(0, Math.PI * 2), r = rand(8, 46);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 3.2, 20, 8, 1, true),
      glowMaterial(0xe8f0b0, 0.055));
    shaft.position.set(x, 10, z);
    shaft.rotation.z = rand(-0.14, 0.14);
    b.add(shaft);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(rand(2, 3.6), 16), glowMaterial(0xe8f0b0, 0.10));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.06, z);
    b.add(pool);
  }
  b.particles(340, { x0: -54, x1: 54, y0: 0.3, y1: 20, z0: -52, z1: 52 },
    { color: 0xd8e8a0, size: 0.12, opacity: 0.45, vy: [-0.8, -0.25] });   // falling leaves
  b.particles(200, { x0: -54, x1: 54, y0: 0.5, y1: 12, z0: -52, z1: 52 },
    { color: 0xfff8d0, size: 0.06, opacity: 0.35, vy: [0.05, 0.4] });     // pollen

  // Off the z axis and off the banks on purpose: the strip from x -20 to +18 at
  // z = 0 is river, bank slope or the foot of the plateau, so a spawn pair on
  // that line drops both fighters onto a 40 degree bank.
  b.bounds.spawns = SPAWNS.map(([x, z]) => v3(x, 0, z));
  return b;
}
