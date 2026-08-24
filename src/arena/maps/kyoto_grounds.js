// KYOTO SISTER-SCHOOL EXCHANGE GROUNDS — the forested mountain event site, and
// the only natural map in the set. Rebuilt as A GORGE IN AN AMPHITHEATRE.
//
// The old version was flat grass with a river slot in it and two rectangular
// shelves bolted on either side: from above it was a plan of boxes, and the
// only thing that said "mountain" was the tree scatter. The location has not
// moved — same event, same woodland, same river through the middle — but the
// LANDFORM is new:
//
//   * the ground is a bowl. Eight concentric rock terraces climb outward from
//     the clearing, each one 0.5 m over the last, so the map rises four metres
//     from its middle to its rim and EVERY step of it is walkable in both
//     directions. There is no cliff anywhere on this map that is not a bank of
//     the river.
//   * the river cuts a VALLEY through those terraces, north to south. The
//     terraces are annular sectors that stop short of it, so the flat corridor
//     beside the water widens as the ground rises around it.
//   * a CONICAL CRAG on the west with a rock ledge spiralling twice round it
//     to a summit at 12 m — the high ground, and the long way up to it.
//   * a TIMBER HIGH BRIDGE at 6 m across the valley, with a flight at each end.
//     The old footbridge was a plank at 1.9 m; this one is a skyline.
//   * a round PLUNGE POOL at the head of the river, under a cascade off the
//     terrace shoulder.
//
// LAYOUT (116 x 108 m):
//   y = -2.10  PLUNGE POOL   the river's head, under the fall
//   y = -1.60  RIVER BED     shallow, walkable, and it reacts to combat
//   y =  0.00  THE VALLEY    the flat corridor either side of the water
//   y =  0.50..4.00  THE TERRACES, eight rings of them
//   y =  6.00  HIGH BRIDGE   over the valley, the map's one choke
//   y = 12.00  CRAG SUMMIT   best sightline on the map, one way down
import { MapBuilder, emissive, glowMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'kyoto_grounds',
  name: 'KYOTO EXCHANGE GROUNDS',
  jp: '京都姉妹校交流会',
  desc: 'A terraced bowl round a river gorge, under a spiral crag.',
  extent: { minX: -58, maxX: 58, minZ: -54, maxZ: 54 },
  terrain: NATURAL,
  background: 0x6f8f7a,
  fog: { color: 0x88a08c, near: 74, far: 230 },
  grade: { vignette: 0.46, tint: [0.98, 1.08, 0.94], lift: 0.005, sat: 1.10 },
  lights: {
    key: { color: 0xfff4d0, intensity: 1.5, pos: [10, 24, 6] },
    rim: { color: 0x8fd8a0, intensity: 0.85, pos: [-12, 10, -12] },
    hemi: { sky: 0xbfe0c0, ground: 0x3a4a28, intensity: 0.6 }
  },
  // straight down the valley, which is the one corridor the forest scatter is
  // guaranteed to keep clear — the trees are placed at random, and an earlier
  // shot on this map was inside a cedar about half the time
  previewCam: { pos: [3.0, 13.0, 45], look: [-6, 1.0, -14] },
  shadowScale: 1.25,
  shrineScale: 1.07,
  size: '116 × 108 m · terraced bowl, river valley, spiral crag'
};

// The river and the valley floor, in one place: the terraces, the pits and the
// tree scatter all have to agree about where the water is, and three
// hand-copied sets of numbers is how they stop agreeing.
const RX = 5.4;            // river half-width
const CW = 9.0;            // the flat valley corridor either side of it
const SY = -1.6;           // river bed
const PY = -2.1;           // plunge pool floor
const POOL = { x: 0, z: -40, r: 8.0 };
const RZ0 = POOL.z + POOL.r - 0.6;   // the river runs from the pool's lip south

// The eight terraces. Every rise is 0.5 m — under STEP_UP (0.55) — so the bowl
// is climbable from any bearing without a single stair cut into it.
// THE CLEARING IS THE ARENA and the first bench used to start 20 m out, so
// each side of the river was an eleven-metre lane between the water and a
// staircase of rock. The bowl starts at 30 m now: two open greens either side
// of the water, each wide enough to fight a whole round in without touching a
// terrace.
const TERRACES = [
  [38, 44, 0.5], [44, 50, 1.0], [50, 56, 1.5], [56, 62, 2.0],
  [62, 70, 2.5], [70, 82, 3.0]
];
// OUT OF THE GREEN. A crag whose base is 24 m across, standing in the middle of
// the west side, is the same mistake as a hall in the middle of a courtyard.
const CRAG = { x: -44, z: 20, rIn: 8.2, rOut: 12.0, top: 12.0, foot: 0.0 };
const BR = { y: 6.0, z0: 12, z1: 16, x: 16.6 };   // the high bridge

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const rockLo = b.tint('rock', 0x77786a);
  const grass = M.grass;

  b.sky(0x4f86c8, 0x9fc0d8, 0xd8e0c8, 380);
  b.groundPlane(0x25381f, 300);
  b.skyline(18, 190, { color: 0x2c4432, shape: 'ridge', minW: 90, maxW: 200, minH: 40, maxH: 100 });

  // ---- THE BOWL -----------------------------------------------------------
  // Each terrace is TWO annular sectors, east and west, with the valley taken
  // out between them. The gap is set from the ring's INNER radius, so the
  // corridor flares slightly across each terrace and steps back in at the next
  // one — which is what a river cutting through a bench actually looks like,
  // and it means the corridor is never pinched narrower than the water.
  //
  // The slab is as THICK as it is high, so its extruded side face is the rock
  // wall of the terrace. Drawn 0.3 m thick, every bench on the map would be a
  // biscuit floating over a gap.
  const VZ = POOL.z + 6;              // the valley starts at the pool's shoulder
  // The valley is cut out of every ring by FOOTPRINT, not by bearing. Two
  // bearings describe a wedge, and a wedge through concentric terraces is wider
  // at every ring than at the last one — the corridor would fan out into the
  // trees and each ring would end in a sliver of bench with nothing next to it.
  // Intersection, not containment: a cell that merely OVERLAPS the valley still
  // has to go. Half a metre of bench hanging over the head of a shelving ramp
  // is a slab the ramp runs under, and the ramp is what it is hanging over.
  const valley = (x0, z0, x1, z1) => {
    const px = Math.max(x0, Math.min(POOL.x, x1)), pz = Math.max(z0, Math.min(POOL.z, z1));
    if (Math.hypot(px - POOL.x, pz - POOL.z) < POOL.r + 0.9) return true;
    return z1 > VZ && x0 < CW && x1 > -CW;
  };
  const bench = (rIn, rOut, y, id) => {
    const mat = y >= 3.0 ? grass : (y >= 1.5 ? b.tint('grass', 0x5f7a3e) : grass);
    b.arcDeck(0, 0, rIn, rOut, 0, Math.PI * 2, y,
      { mat, thick: y + 0.5, band: 0.5, segs: 48, cutX: CW, omit: valley, inset: 3.2, id });
  };
  // the clearing itself: the flat ground inside the first terrace
  bench(0.5, 38, 0, 'clearing');
  // EVERY TERRACE OVERLAPS THE ONE BELOW IT by 0.6 m. The cell scan only calls
  // a cell walkable when all four of its corners are inside the ring, so two
  // rings that merely touch at a shared radius BOTH reject the cells straddling
  // it — a half-metre gutter of nothing right round the map at every step, and
  // the whole bowl above the second terrace unreachable on the side where no
  // boulder happened to bridge it.
  TERRACES.forEach(([rIn, rOut, y], i) => bench(rIn - 0.6, rOut, y, 'bench' + i));
  // the valley floor either side of the water, in the gaps between the shelving
  // ramps down to the bed — a slab laid straight over a ramp buries it
  for (const s of [-1, 1]) {
    for (const [z0, z1] of [[VZ, -27], [-21, -1], [5, 25], [31, 54]]) {
      b.floor(s > 0 ? RX : -CW, z0, s > 0 ? CW : -RX, z1, 0, { mat: grass, id: 'valley' + s + z0 });
    }
  }
  // No ramps up the back of the bowl: every rise on it is 0.5 m, under STEP_UP,
  // so the whole thing is already climbable from any bearing. The two that were
  // here were cut for terrace heights that no longer exist.

  // ---- THE RIVER ----------------------------------------------------------
  // `groundY` is one number for the whole map and it is 0, so the channel needs
  // its fallback floor dropped over its own footprint or the fighter stands on
  // thin air above the water.
  b.pit(-RX - 0.4, RZ0 - 1, RX + 0.4, 54, SY);
  b.pit(POOL.x - POOL.r - 0.4, POOL.z - POOL.r - 0.4, POOL.x + POOL.r + 0.4, POOL.z + POOL.r + 0.4, PY);
  // and under the shelving ramps: a ramp that dips below the fallback ground is
  // a ramp running inside the hill, whatever is drawn over it
  for (const z of [-24, 2, 28]) b.pit(-CW - 0.6, z - 3.4, CW + 0.6, z + 3.4, SY);
  b.floor(-RX, RZ0, RX, 54, SY, { mat: rockLo, id: 'riverbed' });
  b.roundDeck(POOL.x, POOL.z, POOL.r, PY, { mat: rockLo, thick: 0.5, segs: 40, band: 0.5, id: 'pool' });
  b.water(-RX + 0.3, RZ0 + 0.4, RX - 0.3, 54, SY + 0.46,
    { color: 0x8fd8e8, opacity: 0.62, speed: 0.9, reactive: true });
  b.water(POOL.x, POOL.z, POOL.x, POOL.z, PY + 0.5,
    { color: 0xa8e4f0, opacity: 0.58, speed: 0.6, radius: POOL.r - 0.4, reactive: true });
  // The banks are DRAWN, not solid. A 1.6 m wall down both sides of the water
  // turns the river into a trench with three ways out; a drawn face you can
  // walk off means the water is always one step away, and the shelving ramps
  // below are how you get back.
  for (const s of [-1, 1]) {
    b.bankFace(s * RX, RZ0, s * RX, 54, 0, SY - 0.4, { mat: rockLo, collide: false, thick: 0.5 });
    for (const z of [-24, 2, 28]) {
      b.slope(s > 0 ? RX : -CW, z - 3, s > 0 ? CW : -RX, z + 3,
        s > 0 ? SY : 0, s > 0 ? 0 : SY, 'x', { mat: rockLo, depth: 1.0, segs: 14 });
    }
  }
  // There is no way out of the pool at its north end and that is deliberate:
  // the water leaves the same way you do, south into the river bed, which is
  // half a step up from the pool floor. A ramp cut into the terraces above it
  // would be a ramp running under two metres of hillside.
  // and the fall itself, off the shoulder of the third terrace
  b.waterfall(-6.4, 2.1, POOL.z - 1.0, 7.2, 4.4, { color: 0xcfeef8, opacity: 0.55, speed: 2.6 });
  b.waterfall(-6.4, 2.1, POOL.z - 1.4, 4.8, 4.4, { color: 0xeaf8ff, opacity: 0.38, speed: 3.4 });
  b.waterfall(-8.0, 2.1, POOL.z - 1.8, 2.0, 4.4, { color: 0xffffff, opacity: 0.26, speed: 4.2 });
  for (let i = 0; i < 5; i++) {
    b.rock(-10 - i * 1.6, 1.2 - i * 0.7, POOL.z - 2 + i * 1.5, 1.5 + (i % 2) * 0.5);
  }

  // ---- THE CRAG -----------------------------------------------------------
  // A rock cone with a ledge spiralling twice round it. The path starts on the
  // first terrace, on the crag's map-facing side, and the summit is a deck laid
  // over the cone's top so the last tread has something to step onto — a
  // tapered cylinder's own cap is metres narrower than the ledge that reaches
  // it, and the gap between the two is a fall.
  b.roundTower(CRAG.x, CRAG.z, CRAG.rIn, -2, CRAG.top + 1.4,
    { mat: M.rock, segs: 26, taper: 0.12, cap: false, id: 'cragcore' });
  b.spiralStair(CRAG.x, CRAG.z, CRAG.foot, CRAG.top, {
    rIn: CRAG.rIn, rOut: CRAG.rOut, rise: 0.24, turns: 2, dir: 1, a0: 1.96,
    mat: rockLo, newelMat: M.rock, id: 'cragpath'
  });
  b.roundDeck(CRAG.x, CRAG.z, CRAG.rIn + 0.2, CRAG.top,
    { mat: rockLo, thick: 0.5, segs: 30, band: 0.5, id: 'cragtop' });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    b.rock(CRAG.x + Math.sin(a) * 5.4, CRAG.top, CRAG.z + Math.cos(a) * 5.4, 0.9 + (i % 3) * 0.35);
  }
  b.sigil(CRAG.x, CRAG.top + 0.06, CRAG.z, 4.2, 0x8fd8a0, { rings: 2, spokes: 6, sides: 3, opacity: 0.26, spin: -0.09 });

  // ---- THE HIGH BRIDGE ----------------------------------------------------
  // Six metres over the water, with a flight up from the second terrace at each
  // end. Both flights land on the ring they stand on — the check that a stair
  // meets its landing probes 0.8 m past the head, and a flight whose foot is on
  // the boundary between two benches has a 0.5 m lie under it either way.
  b.floor(-BR.x, BR.z0, BR.x, BR.z1, BR.y, { mat: M.wood, id: 'bridge' });
  b.railing(-BR.x, BR.z0, BR.x, BR.z0, BR.y);
  b.railing(-BR.x, BR.z1, BR.x, BR.z1, BR.y);
  b.stairs(-30, BR.z0, -BR.x + 0.3, BR.z1, 0, BR.y, 'x', { mat: M.wood, id: 'bridgeW' });
  b.stairs(BR.x - 0.3, BR.z0, 30, BR.z1, BR.y, 0, 'x', { mat: M.wood, id: 'bridgeE' });
  // the trestles, both of them standing on the valley floor clear of the water
  for (const s of [-1, 1]) {
    for (const z of [BR.z0 + 0.9, BR.z1 - 0.9]) {
      const g = new THREE.BoxGeometry(0.5, BR.y, 0.5);
      g.translate(s * 8.2, BR.y / 2, z);
      b.static_(g, M.trunk);
    }
    const x = new THREE.BoxGeometry(0.32, 0.32, BR.z1 - BR.z0);
    x.translate(s * 8.2, BR.y - 1.4, (BR.z0 + BR.z1) / 2);
    b.static_(x, M.trunk);
    b.bounds.wall(s * 8.2 - 0.3, BR.z0 + 0.6, s * 8.2 + 0.3, BR.z1 - 0.6, 0, BR.y - 0.2, { id: 'trestle' + s });
  }
  b.lanternString(v3(-BR.x + 1, BR.y + 2.4, 14), v3(BR.x - 1, BR.y + 2.4, 14),
    { color: 0xffc87a, sag: 1.2, count: 12 });

  // ---- THE FOREST ---------------------------------------------------------
  // Scattered on the terraces and kept out of the valley, off the crag and off
  // the bridge line, with each tree standing at the height of the bench it is
  // on rather than at zero.
  const benchY = (x, z) => {
    const r = Math.hypot(x, z);
    let y = 0;
    for (const [rIn, rOut, ty] of TERRACES) if (r >= rIn && r < rOut) y = ty;
    if (r >= 82) y = 4.0;
    return y;
  };
  for (let i = 0; i < 190; i++) {
    const a = rand(0, Math.PI * 2), r = rand(21, 62);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < CW * (r / 20) * 0.55) continue;              // the valley
    if (Math.hypot(x - CRAG.x, z - CRAG.z) < CRAG.rOut + 2.5) continue;
    if (Math.abs(z - 14) < 6 && Math.abs(x) < 32) continue;        // the bridge line
    b.tree(x, benchY(x, z), z, rand(0.9, 1.7));
  }
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2), r = rand(20, 56);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < CW) continue;
    if (Math.hypot(x - CRAG.x, z - CRAG.z) < CRAG.rOut + 2) continue;
    // seated a random few centimetres into the bench. The scatter is random and
    // the terraces are 0.5 m apart, so a boulder now and then came out with its
    // top exactly level with the bench above it — a wall tying with a floor,
    // which the engine forgives only until the next edit. A fixed offset just
    // moves which scales tie; a jittered one makes the tie a measure-zero event.
    b.rock(x, benchY(x, z) - rand(0.06, 0.26), z, rand(0.8, 1.9));
  }
  // and the boulders in the water, which is where a river actually puts them
  for (let i = 0; i < 7; i++) b.rock(rand(-3.4, 3.4), SY, rand(RZ0 + 6, 50), rand(0.5, 1.0));

  // ---- THE RIM ------------------------------------------------------------
  // The map ends where the mountain does. Rock, not an invisible plane.
  for (const s of [-1, 1]) {
    b.wall(s * 57, -53, s * 57, 53, 3.5, 14, { mat: M.rock, thick: 2.0 });
    b.wall(-57, s * 53, 57, s * 53, 3.5, 14, { mat: M.rock, thick: 2.0 });
  }

  // =========================================================================
  // THE EVENT IS RUNNING
  // =========================================================================
  b.sigil(0, 0.05, 0, 16, 0x8fd8a0, { rings: 3, spokes: 16, sides: 5, opacity: 0.20, spin: 0.02 });
  b.sigil(0, BR.y + 0.05, 14, 3.4, 0xffd08a, { rings: 2, spokes: 8, sides: 4, opacity: 0.24, spin: 0.13 });
  b.sigil(0, PY + 0.05, POOL.z, 5.2, 0x8fd8a0, { rings: 2, spokes: 10, sides: 6, opacity: 0.22, spin: -0.05 });
  for (let i = 0; i < 3; i++) {
    b.banner(-22 - i * 5, 2.6, 9.0, 1.4, 2.6, 0x2f6ad8, { ry: Math.PI / 2, amp: 0.11 });
    b.banner(22 + i * 5, 2.6, 19.0, 1.4, 2.6, 0xd83c4a, { ry: Math.PI / 2, amp: 0.11 });
    for (const [bx, bz] of [[-22 - i * 5, 9.0], [22 + i * 5, 19.0]]) {
      const post = new THREE.BoxGeometry(0.14, 3.0, 0.14);
      post.translate(bx, benchY(bx, bz) + 1.5, bz);
      b.static_(post, M.trunk);
    }
  }
  b.crates(26, benchY(26, -22), -22, { count: 3 });
  b.crates(27.8, benchY(26, -22), -23.6, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(21 - i * 1.05, benchY(21, -22), -22.4, { color: 0x4a7a3c });
  b.crates(CRAG.x + 2, CRAG.top, CRAG.z + 2, { count: 2 });
  for (let i = 0; i < 3; i++) b.drum(CRAG.x - 3 - i * 1.05, CRAG.top, CRAG.z - 2, { color: 0x4a7a3c });

  // ---- LIGHT AND AIR ------------------------------------------------------
  // Shafts through the canopy, landing at the height of the ground under them —
  // a shaft that pools at y = 0 over the third terrace is a disc of light
  // buried a metre and a half inside the hill.
  for (let i = 0; i < 26; i++) {
    const a = rand(0, Math.PI * 2), r = rand(10, 52);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    const gy = Math.hypot(x - CRAG.x, z - CRAG.z) < CRAG.rOut ? CRAG.top : benchY(x, z);
    b.godRay(x, gy + 19, z, rand(2.2, 3.6), 19, 0xe8f0b0,
      { opacity: 0.05, taper: 0.34, lean: [rand(-4, -1.5), rand(0.5, 2.5)], range: 84 });
  }
  b.mist(-RX, RZ0, RX, 54, SY + 0.5, 0xcfe8ec, { opacity: 0.13, scale: 12 });
  b.mist(POOL.x - POOL.r, POOL.z - POOL.r, POOL.x + POOL.r, POOL.z + POOL.r, PY + 0.4,
    0xdff4ff, { opacity: 0.28, scale: 7, radius: POOL.r - 0.5 });
  b.steamVent(-4.6, SY + 0.4, RZ0 + 8, { height: 4.0, period: 3.4, opacity: 0.26, color: 0xdff4ff });
  b.steamVent(4.6, SY + 0.4, RZ0 + 16, { height: 3.4, period: 4.2, opacity: 0.24, color: 0xdff4ff });
  b.steamVent(0, SY + 0.4, 20, { height: 2.8, period: 5.0, opacity: 0.18, color: 0xdff4ff });
  b.particles(90, { x0: -RX, x1: RX, y0: SY + 0.6, y1: SY + 3.0, z0: POOL.z, z1: 50 },
    { color: 0xbfffd8, size: 0.10, opacity: 0.5, vy: [-0.15, 0.15] });   // fireflies
  b.particles(340, { x0: -54, x1: 54, y0: 0.3, y1: 20, z0: -52, z1: 52 },
    { color: 0xd8e8a0, size: 0.12, opacity: 0.45, vy: [-0.8, -0.25] });  // falling leaves
  b.particles(200, { x0: -54, x1: 54, y0: 0.5, y1: 12, z0: -52, z1: 52 },
    { color: 0xfff8d0, size: 0.06, opacity: 0.35, vy: [0.05, 0.4] });    // pollen

  // Off the water and off the bank slopes on purpose: a spawn pair on the z
  // axis drops both fighters into the river.
  b.bounds.spawns = [v3(13, 0, -6), v3(-13, 0, 6), v3(15, 0, 10), v3(-15, 0, -10)];
  return b;
}
