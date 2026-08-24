// SHIBUYA STATION — ELEVATED PLATFORM LEVEL.
//
// REFERENCE NOTE (researched): the great nineteenth-century terminus. An island
// platform under a BARREL-VAULTED train shed — a single arched span from
// trackside to trackside with no columns down the middle of it — and, where the
// concourse crosses, a domed ROTUNDA lifted over the platform on a ring of
// columns with an oculus cut through its floor, so the booking hall looks
// straight down onto the trains.
//
// WHY THIS SHAPE. The previous version was a flat slab canopy on two rows of
// posts over a straight platform, with a rectangular mezzanine ring above it:
// three stacked rectangles, and the same three rectangles as half this set. A
// vault has no columns in the middle, so the platform is one clear run instead
// of a slalom; and the rotunda is a round room hanging in the middle of a
// linear map, which gives the map a centre it never had. Everything routes
// through it and everything under it can be seen from it.
//
// It is still a platform between two trenches with trains standing in them.
//
// LAYOUT (96 x 46 m):
//   y = -1.10  TRACK PITS      two trenches flanking the platform, part-filled
//                              by standing trains. Mirrored, so each side has
//                              one blocked half and one open half.
//   y = -0.60  THE OPEN CAR    one car is a real interior. The tightest space
//                              here and the only one with a roof on it.
//   y =  0.00  PLATFORM        66 m of clear run under the vault.
//   y =  5.20  THE ROTUNDA     a drum over the middle of the platform, its
//                              floor an annulus round a 12 m oculus.
//   y = 10.40  THE PARAPET     the walk round the base of the dome. Highest
//                              ground, fully exposed, and a ring.
//   VERTICAL                   2 escalators up through wells in the rotunda
//                              floor, 2 platform stairs, 1 helix to the parapet.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'shibuya_underground',
  name: 'SHIBUYA STATION',
  jp: '渋谷駅 高架ホーム',
  desc: 'A vaulted train shed with a domed rotunda hung over the middle of it.',
  extent: { minX: -46, maxX: 46, minZ: -20, maxZ: 20, groundY: -1.10 },
  background: 0x0a0e1c,
  fog: { color: 0x141c30, near: 44, far: 150 },
  grade: { vignette: 0.54, tint: [1.00, 0.98, 1.12], lift: 0.004, sat: 1.06 },
  lights: {
    key: { color: 0xcfe0ff, intensity: 1.15, pos: [8, 20, 6] },
    rim: { color: 0xd8688f, intensity: 0.66, pos: [-10, 12, -10] },
    hemi: { sky: 0x4a5c92, ground: 0x22222c, intensity: 0.58 }
  },
  previewCam: { pos: [-38, 5.2, -12.5], look: [4, 3.2, 1] },
  shadowScale: 1.15,
  shrineScale: 0.95,
  size: '96 × 46 m · vaulted shed, domed rotunda, trenches, parapet walk'
};

const PX = 33;          // platform half-length
// THE PLATFORM IS THE ARENA. At 18 m wide with two escalators and two flights
// laid down the middle of it, the widest clear box on this map was the six
// metres of ballast between a rail and a trench wall — on the map whose whole
// pitch is "66 m of clear run under the vault". It is 28 m wide now, both
// escalators are tucked against the trench lips, and the flights that used to
// cross the middle are gone: the escalators are the way up.
const PZ = 14;          // platform half-width (the trench lip)
const TZ = 19.5;        // outer edge of the track pits
const TRACK = (14 + 19.5) / 2;   // the rail centreline — DERIVED from the trench,
                                 // not a number typed once and left behind when the
                                 // platform grew, which parked both trains on it
const EX = 45;          // outer edge of everything
const CY = 5.2;         // rotunda floor, and the vault's springing
const PARA = 10.4;      // the parapet walk round the dome
const R_ROT = 18;       // the rotunda drum
const R_OC = 7;         // the oculus through its floor
// The two escalator wells, PULLED IN off the drum's outer edge. At 10.5 out,
// an escalator long enough to clear the well surfaced past the annulus
// altogether — there was no ring of floor left between the hole and the wall to
// land on.
const WELL = [
  { x: -8.5, z: -12.3, r: 3.1 },
  { x: 8.5, z: 12.3, r: 3.1 }
];
const HELIX = { x: 0, z: -14.6 };   // out at the drum wall, so its landing reaches the parapet ring

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;
  const Z = 'station';
  b.zone(Z, { x0: -EX - 1, x1: EX + 1, z0: -TZ - 1, z1: TZ + 1, y0: -2, y1: 20 }, false);

  // ---- THIS STATION'S OWN MATERIALS --------------------------------------
  // Soot-darkened brick and painted iron, not the set's shared grey concrete.
  const brick = b.tint('concreteWall', 0x6b5a52);
  const brickIn = b.tint('concreteWall', 0x7a6a60, { side: 2 });
  const plat = b.tint('tile', 0x8e9298);
  const iron = b.tint('darkMetal', 0x2b3138, { rim: 0.46 });
  const glassIron = b.tint('metal', 0x8fa4b4, { rim: 0.55, gloss: 0.6 });
  const stone = b.tint('concrete', 0x8a8c86);

  b.sky(0x060a18, 0x101a38, 0x2a2450);
  b.groundPlane(0x090c14, 300, -14);
  b.skyline(30, 150, { color: 0x0b0f1e, minW: 14, maxW: 34, minH: 34, maxH: 120 });

  // ---- PLATFORM LEVEL -----------------------------------------------------
  b.floor(-PX, -PZ, PX, PZ, 0, { mat: plat, id: 'platform' });
  for (const z of [-PZ, PZ]) {
    const g = new THREE.BoxGeometry(PX * 2, 0.04, 0.7);
    g.translate(0, 0.02, z + (z < 0 ? 0.35 : -0.35));
    b.static_(g, emissive(0xc8a83c), Z);
  }

  // TRACK PITS either side, and the outer walls that carry everything above.
  for (const s of [-1, 1]) {
    const ZC = s * TRACK;
    b.floor(-EX, Math.min(s * PZ, s * TZ), EX, Math.max(s * PZ, s * TZ), -1.10, { mat: stone, id: 'trench' + s });
    b.wall(-EX, s * PZ, EX, s * PZ, -1.10, 0, { mat: brick, thick: 0.4, collide: false });
    const bal = new THREE.BoxGeometry(EX * 2 - 2, 0.12, 4.0);
    bal.translate(0, -1.04, ZC);
    b.static_(bal, b.tint('rust', 0x4a3c30), Z);
    for (const off of [-0.72, 0.72]) {
      const g = new THREE.BoxGeometry(EX * 2 - 2, 0.16, 0.10);
      g.translate(0, -0.94, ZC + off);
      b.static_(g, glassIron, Z);
    }
    const sleepers = [];
    for (let x = -EX + 2; x <= EX - 2; x += 0.95) sleepers.push({ x, y: -1.02, z: ZC });
    b.repeat(new THREE.BoxGeometry(0.26, 0.12, 2.7), b.tint('wood', 0x3a2c1e), sleepers);
    // the shed's side wall — it is what the vault springs off
    b.wall(-EX - 0.4, s * (TZ + 0.4), EX + 0.4, s * (TZ + 0.4), -1.10, CY,
      { mat: brick, zone: Z, id: 'sidewall' + s });
  }
  for (const s of [-1, 1]) {
    b.wall(s * (EX + 0.4), -TZ - 0.4, s * (EX + 0.4), TZ + 0.4, -1.10, CY + 4,
      { mat: brick, zone: Z, id: 'endwall' + s });
  }

  // ---- THE TRAIN SHED ----------------------------------------------------
  // ONE ARCH, trackside to trackside, in two runs either side of the rotunda.
  // No columns down the middle: the vault is the whole point, and it is why the
  // platform is a clear run now instead of a slalom between two rows of posts.
  for (const [vx0, vx1] of [[-EX, -R_ROT + 1], [R_ROT - 1, EX]]) {
    b.vault(vx0, -TZ - 0.4, vx1, TZ + 0.4, CY, 7.2, { mat: brickIn, axis: 'x', segs: 15, zone: Z });
    // the ribs that carry it, one every 6 m
    const n = Math.max(1, Math.round((vx1 - vx0) / 6));
    for (let i = 0; i <= n; i++) {
      const x = vx0 + (vx1 - vx0) * (i / n);
      for (let k = 0; k < 13; k++) {
        const a0 = Math.PI * k / 13, a1 = Math.PI * (k + 1) / 13;
        const u0 = -Math.cos(a0) * (TZ + 0.4), u1 = -Math.cos(a1) * (TZ + 0.4);
        const v0 = Math.sin(a0) * 7.2, v1 = Math.sin(a1) * 7.2;
        const L = Math.hypot(u1 - u0, v1 - v0) * 1.06;
        const g = new THREE.BoxGeometry(0.5, 0.38, L);
        g.rotateX(-Math.atan2(v1 - v0, u1 - u0));
        g.translate(x, CY + (v0 + v1) / 2, (u0 + u1) / 2);
        b.static_(g, glassIron, Z);
      }
    }
  }
  // and the glazed strip down the crown, which is what the rain comes through
  for (let i = 0; i < 22; i++) {
    const x = -EX + 2 + i * 4;
    if (Math.abs(x) < R_ROT) continue;
    b.stripLight(x, CY + 6.9, 0, 2.6, 'x', 0xdfeaff, i === 4 ? 0.4 : 0);
  }

  // ---- THE ROTUNDA -------------------------------------------------------
  // A drum lifted over the middle of the platform on a ring of columns, with a
  // 12 m oculus cut through its floor so the booking hall looks straight down
  // onto the trains. It is the centre this map never had.
  b.roundDeck(0, 0, R_ROT, CY, {
    rIn: R_OC, mat: stone, thick: 0.45, zone: Z, id: 'rotunda',
    holes: WELL.map(w => ({ x: w.x, z: w.z, r: w.r }))
  });
  // TWO ROWS OF COLUMNS ALONG THE TRENCH LIPS, not a ring through the middle.
  // A ring of twelve at r = 16.4 puts eight of them out on the open platform,
  // and a colonnade across an arena is an arena with no clear box in it: it
  // held the platform's best rectangle down to 31 x 22 on a floor 66 x 28.
  // Carried on the lips the drum reads the same from underneath and the run
  // between them is unbroken end to end.
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const px = -16 + i * 8, pz = sz * (PZ - 0.7);
      b.pillar(px, pz, 0, CY - 0.12, 0.6, { mat: stone, hp: 260, zone: Z, id: 'rotcol' + sz + i });
    }
    // the longitudinal beam they carry, and the transverse ribs off it
    const beam = new THREE.BoxGeometry(38, 0.9, 1.0);
    beam.translate(0, CY - 0.55, sz * (PZ - 0.7));
    b.static_(beam, stone, Z);
  }
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.BoxGeometry(0.8, 0.7, (PZ - 0.7) * 2);
    rib.translate(-16 + i * 8, CY - 0.7, 0);
    b.static_(rib, stone, Z);
  }
  // the drum wall, with four wide openings so the rotunda is not a box
  for (let q = 0; q < 4; q++) {
    b.arcWall(0, 0, R_ROT + 0.4, q * Math.PI / 2 + 0.34, (q + 1) * Math.PI / 2 - 0.34,
      CY, PARA - 0.12, { mat: brick, thick: 0.8, zone: Z, id: 'drum' + q });
  }
  // THE PARAPET WALK round the base of the dome — the highest ground, a ring,
  // and completely exposed.
  b.roundDeck(0, 0, R_ROT + 1.6, PARA, {
    rIn: R_ROT - 0.6, mat: stone, thick: 0.4, zone: Z, id: 'parapet',
    holes: [{ x: HELIX.x, z: HELIX.z, r: 3.3 }]
  });
  b.arcWall(0, 0, R_ROT + 1.7, 0, Math.PI * 2, PARA + 0.5, PARA + 1.15,
    { mat: iron, thick: 0.12, zone: Z, id: 'pararail', collide: false });
  b.dome(0, 0, PARA, R_ROT - 0.4, { mat: brickIn, rise: 5.4, oculus: 0.16, segs: 36, rings: 12 });
  b.roundTower(0, 0, 2.2, PARA + 4.6, 1.6, { mat: glassIron, segs: 14, cap: true, id: 'lantern' });
  b.beacon(0, PARA + 6.6, 0, 0xff5a6a, { reach: 6.0, rate: 0.8 });

  // ---- GETTING UP --------------------------------------------------------
  // Two escalators from the platform up through the wells, and a helix from the
  // rotunda floor out to the parapet.
  // Each runs from the platform UP THROUGH its well and lands on the annulus
  // beyond it. Stopped inside the well, an escalator ends over a five-metre
  // hole with the floor it climbs to still a metre away.
  WELL.forEach((w, i) => {
    const s = i ? 1 : -1;
    b.escalator(w.x - s * 4.5, w.z - s * 1.7, w.x + s * 3.9, w.z + s * 1.7, 0, CY, 'x',
      { zone: Z, id: 'esc' + i });
  });
  {
    const a = Math.atan2(HELIX.x, HELIX.z);
    b.spiralStair(HELIX.x, HELIX.z, CY, PARA, {
      rIn: 0.6, rOut: 3.0, rise: 0.24, turns: 1, dir: 1, a0: a,
      mat: iron, newelMat: iron, zone: Z, id: 'parahelix'
    });
    // The landing reaches ACROSS the parapet ring rather than just touching its
    // inner edge: a ring collider is conservative on the inside, so a landing
    // that stops where the ring nominally starts lands on nothing.
    const lx = HELIX.x + Math.sin(a) * 3.6, lz = HELIX.z + Math.cos(a) * 3.6;
    b.floor(lx - 2.2, lz - 2.2, lx + 2.2, lz + 2.2, PARA, { mat: stone, zone: Z, id: 'paraland' });
  }
  // RAMPS OUT OF THE TRACK PITS, one at each end of each trench. The lip is a
  // 1.1 m step and STEP_UP is 0.55: anyone thrown down there — and the trains
  // are the reason to go down there — was in a 90 m trough with no way back up
  // that the audit could not see, because an unnamed floor is not checked for
  // reachability. It is named now, and it has four ways out.
  for (const s of [-1, 1]) {
    for (const sx of [-1, 1]) {
      b.slope(sx * 34, s > 0 ? PZ : -PZ - 3.6, sx * 28, s > 0 ? PZ + 3.6 : -PZ,
        s > 0 ? 0 : -1.10, s > 0 ? -1.10 : 0, 'z', { mat: plat, depth: 0.6, zone: Z });
    }
  }

  // ---- STANDING TRAINS ----------------------------------------------------
  const CARL = 9.0;
  const train = (s, xStart, cars, band, open = -1) => {
    const ZC = s * TRACK;
    const shell = b.tint('metal', 0x7d8894, { rim: 0.5, gloss: 0.55 });
    for (let c = 0; c < cars; c++) {
      const cx = xStart + c * (CARL + 0.5) + CARL / 2;
      const enterable = c === open;
      if (!enterable) {
        const body = new THREE.BoxGeometry(CARL, 3.3, 2.94);
        body.translate(cx, 0.75, ZC);
        b.static_(body, shell, Z);
        b.bounds.wall(cx - CARL / 2, ZC - 1.55, cx + CARL / 2, ZC + 1.55, -1.10, 2.28,
          { id: 'train' + s + c });
        b.bounds.platform(cx - CARL / 2, ZC - 1.55, cx + CARL / 2, ZC + 1.55, 2.40,
          { id: 'train' + s + c, prop: true });
      } else {
        buildOpenCar(b, shell, iron, Z, cx, ZC, CARL, s);
      }
      for (const side of [-1, 1]) {
        const win = new THREE.BoxGeometry(CARL - 1.8, 1.0, 0.06);
        win.translate(cx, 1.40, ZC + side * 1.50);
        b.static_(win, emissive(enterable ? 0xd8f0e8 : 0xbfe3d8), Z);
        const bd = new THREE.BoxGeometry(CARL - 0.5, 0.40, 0.05);
        bd.translate(cx, 0.20, ZC + side * 1.52);
        b.static_(bd, emissive(band), Z);
        if (enterable) continue;
        for (let d = 0; d < 2; d++) {
          const dr = new THREE.BoxGeometry(1.25, 2.0, 0.05);
          dr.translate(cx - CARL / 4 + d * (CARL / 2), 0.70, ZC + side * 1.53);
          b.static_(dr, emissive(0x2b3a44), Z);
        }
      }
      const bo = new THREE.BoxGeometry(2.4, 0.7, 2.5);
      bo.translate(cx, -0.75, ZC);
      b.static_(bo, iron, Z);
    }
  };
  train(-1, -40, 3, 0x6fd44a, 1);    // north trench: west half blocked
  train(1, 12, 3, 0xe8842c);         // south trench: east half blocked

  // ---- THE CATENARY -------------------------------------------------------
  for (const s of [-1, 1]) {
    const ZC = s * TRACK;
    for (let i = 0; i < 5; i++) {
      const x0 = -EX + 2 + i * 18, x1 = Math.min(EX - 2, x0 + 18);
      if (x1 - x0 < 2) continue;
      b.cable(v3(x0, 4.4, ZC), v3(x1, 4.4, ZC), { sag: 0.5, r: 0.05, mat: iron });
      b.cable(v3(x0, 3.7, ZC), v3(x1, 3.7, ZC), { sag: 0.34, r: 0.035, mat: iron });
    }
    for (let i = 0; i < 9; i++) {
      const x = -EX + 4 + i * 10.5;
      if (Math.abs(x) < R_ROT - 2) continue;
      const mast = new THREE.BoxGeometry(0.2, 5.6, 0.2);
      mast.translate(x, 1.6, s * (TZ - 0.6));
      b.static_(mast, b.tint('rust', 0x5a4436), Z);
      const arm = new THREE.BoxGeometry(0.14, 0.14, Math.abs(s * (TZ - 0.6) - ZC));
      arm.translate(x, 4.4, (s * (TZ - 0.6) + ZC) / 2);
      b.static_(arm, b.tint('rust', 0x5a4436), Z);
    }
  }

  // ---- LIGHT, SIGNAGE AND THE WARD ---------------------------------------
  b.godRay(0, PARA + 5.2, 0, 5.0, PARA + 5.2 + 1.1, 0xcfe0ff,
    { opacity: 0.10, taper: 0.4, lean: [3.4, -2.6], poolGain: 1.1, range: 110 });
  for (let i = 0; i < 6; i++) {
    const x = -30 + i * 12;
    if (Math.abs(x) < R_ROT) continue;
    b.godRay(x, CY + 6.9, 0, 3.0, CY + 6.9, 0xcfe0ff,
      { opacity: 0.06, taper: 0.35, lean: [(i % 2 ? 1 : -1) * 0.8, 0], range: 90 });
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    b.hangingLamp(Math.sin(a) * (R_ROT - 4), CY + 4.2, Math.cos(a) * (R_ROT - 4),
      1.2, 0xffe6c0, { amp: 0.06, range: 46 });
  }
  b.sigil(0, 0.06, 0, 8.5, 0x8f6aff, { rings: 3, spokes: 14, sides: 6, opacity: 0.26, spin: -0.04 });
  b.sigil(0, PARA + 0.05, 0, 6.0, 0x8f6aff, { rings: 2, spokes: 10, sides: 3, opacity: 0.24, spin: 0.10 });
  for (const [bx, bc] of [[-26, 0xd8324f], [-19, 0x2f7fd8], [19, 0xd8a52f], [26, 0x2fd88a]]) {
    b.banner(bx, CY + 5.6, -6.6, 2.2, 3.4, bc, { ry: 0, amp: 0.09 });
    b.banner(bx, CY + 5.6, 6.6, 2.2, 3.4, bc, { ry: Math.PI, amp: 0.09 });
  }

  // ---- PLATFORM FURNITURE + THE WORKS ------------------------------------
  for (const x of [-27, -20, 20, 27]) b.bench(x, 0, 0, Math.PI / 2, 3.0);
  b.vending(-30.5, 0, 3.4, Math.PI, 0xd8402c);
  b.vending(-30.5, 0, -3.4, Math.PI, 0x2c78d8);
  b.vending(30.5, 0, 3.4, 0, 0x3ba85a);
  for (const sx of [-24, 0, 24]) {
    if (sx === 0) continue;
    b.sign(sx, CY + 3.4, 0, 4.6, 1.0, 0x1d5a3c, 0);
    b.sign(sx, CY + 3.4, 0, 4.6, 1.0, 0x1d5a3c, Math.PI);
  }
  b.crates(24, -1.10, -13, { count: 3 });
  b.crates(26.4, -1.10, -12.2, { count: 2 });
  for (let i = 0; i < 4; i++) b.drum(31 + i * 1.05, -1.10, -13.4, { color: 0xc4562c });
  b.beacon(29, 0.5, -14.6, 0xffa03c, { reach: 4.2 });
  b.crates(-24, -1.10, 13, { count: 3 });
  for (let i = 0; i < 4; i++) b.drum(-31 - i * 1.05, -1.10, 13.4, { color: 0xb8483c });
  b.beacon(-29, 0.5, 14.6, 0xffa03c, { reach: 4.2 });
  for (const s of [-1, 1]) {
    b.mist(-EX + 1, s * (PZ + 0.3), EX - 1, s * (TZ - 0.3), -1.10, 0x8296b4, { opacity: 0.24, scale: 16 });
    b.sparker(s * 21, 4.2, s * TRACK, { color: 0xbfe4ff });
    b.steamVent(s * 8, -1.05, s * 16, { height: 4.6, period: 3.6, opacity: 0.26 });
  }

  // ---- RAIN + HAZE --------------------------------------------------------
  b.particles(500, { x0: -44, x1: 44, y0: 0, y1: 20, z0: -20, z1: 20 },
    { color: 0x9fc0e8, size: 0.05, opacity: 0.26, vy: [-15, -9] });
  b.particles(140, { x0: -R_ROT, x1: R_ROT, y0: 0.2, y1: PARA, z0: -R_ROT, z1: R_ROT },
    { color: 0xffd0a8, size: 0.09, opacity: 0.22, vy: [0.1, 0.5] });
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(66, 18), haloMaterial(0x3c5f9f, 0.12));
  sheen.rotation.x = -Math.PI / 2;
  sheen.position.set(0, 0.03, 0);
  b.add(sheen);

  b.bounds.spawns = [v3(-22, 0, 0), v3(22, 0, 0), v3(0, 0, -5), v3(0, 0, 5)];
  return b;
}

// ---------------------------------------------------------------------------
// THE OPEN CAR — a carriage you can fight inside.
// ---------------------------------------------------------------------------
// Its floor is 0.50 m above the trench, not the 0.75 m a real deck would be:
// STEP_UP is 0.55, so 0.50 is a threshold the fighter walks over in both
// directions. At 0.75 the doorway is a wall you can see through.
function buildOpenCar(b, shell, iron, Z, cx, ZC, CARL, s) {
  const FY = -0.60, ROOF = 2.30, HW = 1.47;
  const x0 = cx - CARL / 2, x1 = cx + CARL / 2;
  const id = 'car' + s;
  b.floor(x0, ZC - HW, x1, ZC + HW, FY, { mat: iron, zone: Z, id });
  b.ceiling(x0, ZC - HW, x1, ZC + HW, ROOF, { mat: shell, zone: Z });
  b.bounds.platform(x0, ZC - HW, x1, ZC + HW, ROOF + 0.35, { id: id + 'roof', prop: true });
  for (const ex of [x0, x1]) {
    b.wall(ex, ZC - HW, ex, ZC + HW, FY, ROOF, { mat: shell, thick: 0.14, zone: Z, id: id + 'e' + ex });
  }
  const doorW = 1.5;
  const d1 = cx - CARL / 4, d2 = cx + CARL / 4;
  const far = ZC - s * HW, near = ZC + s * HW;
  b.wall(x0, far, x1, far, FY, ROOF, { mat: shell, thick: 0.14, zone: Z, id: id + 'f' });
  for (const [a, c] of [[x0, d1 - doorW / 2], [d1 + doorW / 2, d2 - doorW / 2], [d2 + doorW / 2, x1]]) {
    if (c - a < 0.12) continue;
    b.wall(a, near, c, near, FY, ROOF, { mat: shell, thick: 0.14, zone: Z, id: id + 'n' + Math.round(a) });
  }
  for (const d of [d1, d2]) {
    const g = new THREE.BoxGeometry(doorW, 0.30, 0.16);
    g.translate(d, ROOF - 0.15, near);
    b.static_(g, iron, Z);
  }
  for (const side of [-1, 1]) {
    const g = new THREE.BoxGeometry(CARL - 1.2, 0.12, 0.62);
    g.translate(cx, FY + 0.44, ZC + side * (HW - 0.34));
    b.static_(g, emissive(0x2a4a6a), Z);
  }
  for (let i = 0; i < 4; i++) {
    const g = new THREE.CylinderGeometry(0.05, 0.05, ROOF - FY, 6);
    g.translate(cx - CARL / 2 + 1.5 + i * (CARL - 3) / 3, (FY + ROOF) / 2, ZC);
    b.static_(g, iron, Z);
  }
  b.stripLight(cx - 2, ROOF - 0.18, ZC, 2.6, 'x', 0xeaf4ff);
  b.stripLight(cx + 2, ROOF - 0.18, ZC, 2.6, 'x', 0xeaf4ff);
}
