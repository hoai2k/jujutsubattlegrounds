// TOKYO JUJUTSU HIGH. The calm counterpoint to Shibuya — the only map in the
// set shot in warm daylight, and the only one where the architecture is timber
// rather than concrete.
//
// REFERENCE NOTE (researched): a mountain campus of traditional single-storey
// timber halls with deep tiled eaves and shoji walls, connected by stone paths
// and long flights of stone steps, set in dense cedar forest. The courtyard is
// gravel and flagstone; a torii marks the approach. It is a CAMPUS — several
// halls scattered across a hillside — which is why the east side now carries a
// second building instead of a strip of lawn.
//
// LAYOUT (108 x 98 m):
//   y = 0.00  COURTYARD    the central engagement space: a big flagstone
//                          square with the torii on its axis.
//   y = 0.45  MAIN HALL    an enterable timber building on the north side —
//                          real interior, tatami floor, shoji walls that break.
//   y = 0.45  THE DOJO     a second, smaller enterable hall on the east side,
//                          open on two faces. Tighter than the main hall and
//                          the only place on the map with a blind corner.
//   y = 4.60  HALL ROOF    the hall's roof deck, reached by the stone steps at
//                          its east end. Walkable, with a ridge for cover.
//   y = 3.90  DOJO ROOF    the same trick one storey lower, and the two roofs
//                          are close enough to make the gap a real decision.
//   y = 6.40  UPPER TERRACE a stone platform above the west steps.
//   FLANKS               the forest paths behind the halls and along the
//                        west treeline.
import { MapBuilder, emissive, glowMaterial, haloMaterial } from '../kit.js';
import { NATURAL } from '../terrain.js';
import * as THREE from 'three';
import { rand, v3 } from '../../core/mathutil.js';

export const DEF = {
  id: 'jujutsu_high',
  name: 'TOKYO JUJUTSU HIGH',
  jp: '東京呪術高専',
  desc: 'Timber halls, stone steps and cedar forest. Warm daylight.',
  extent: { minX: -54, maxX: 54, minZ: -49, maxZ: 49 },
  // TERRAIN: cedar grounds. The lawn is natural, and the paved courtyard, the
  // paths, the halls' floorboards and the roofs are not — so the map has an
  // internal argument about where the fight happens, which is exactly the
  // shape Hanami wants a map to have.
  terrain: NATURAL,
  background: 0x8fb0d8,
  fog: { color: 0x9fb4c8, near: 78, far: 240 },
  grade: { vignette: 0.38, tint: [1.08, 1.04, 0.94], lift: 0.01, sat: 1.06 },
  lights: {
    key: { color: 0xfff0d0, intensity: 1.55, pos: [12, 20, 8] },
    rim: { color: 0x9fd8a8, intensity: 0.75, pos: [-10, 10, -10] },
    hemi: { sky: 0xa8d0f0, ground: 0x4a5a34, intensity: 0.58 }
  },
  // stage-select beauty shot: hand-picked so the preview never ends up
  // inside a wall, above a ceiling or buried in the treeline.
  // On the torii axis, which the forest scatter keeps clear on purpose.
  previewCam: { pos: [0, 18, 62], look: [0, 2.5, -18] },
  shadowScale: 1.1,
  shrineScale: 1.00,      // the reference number: an open courtyard with halls to break into
  size: '108 × 98 m · courtyard, two hall interiors, roofs + terrace'
};

export function build(quality) {
  const b = new MapBuilder(DEF);
  const M = b.mats;

  b.sky(0x3f6fc0, 0x86aede, 0xd8e0e8, 360);
  b.groundPlane(0x2a3f2c, 300);
  b.skyline(20, 200, { color: 0x2c4a3c, shape: 'ridge', minW: 70, maxW: 150, minH: 34, maxH: 88 });

  // ---- ground -------------------------------------------------------------
  b.floor(-54, -49, 54, 49, 0, { mat: M.grass });
  // flagstone courtyard
  b.floor(-24, -21, 24, 21, 0.06, { mat: M.concrete });
  // stone paths running out of it on all four axes
  b.floor(-3.2, 21, 3.2, 46, 0.05, { mat: M.concrete });
  b.floor(-3.2, -46, 3.2, -21, 0.05, { mat: M.concrete });
  b.floor(-50, -3.2, -24, 3.2, 0.05, { mat: M.concrete });
  b.floor(24, -3.2, 50, 3.2, 0.05, { mat: M.concrete });

  // ---- TORII on the south axis -------------------------------------------
  {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0x8a2c34 });
    // The group is moved down the axis at the end of this block, so the
    // colliders have to be authored THERE too. They were once registered at
    // z = 0 — twenty-four metres up the courtyard from the posts they belong
    // to, which put two invisible pillars in the middle of the open ground and
    // left the torii itself something you walk straight through.
    const TZ = 31;
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 8.4, 10), mat);
      p.position.set(s * 4.0, 4.2, 0);
      g.add(p);
      b.bounds.wall(s * 4.0 - 0.48, TZ - 0.48, s * 4.0 + 0.48, TZ + 0.48, 0, 8.4, { id: 'torii' + s });
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.64, 0.9), mat);
    top.position.y = 8.2;
    const top2 = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.44, 0.7), mat);
    top2.position.y = 8.85;
    const mid = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.46, 0.64), mat);
    mid.position.y = 6.5;
    g.add(top, top2, mid);
    g.position.set(0, 0, TZ);
    b.add(g);
    b.breakable(g, {
      hp: 190, kind: 'wood', center: v3(0, 4.4, TZ), radius: 6.2, height: 8.9, baseY: 0,
      colliderIds: ['torii-1', 'torii1'], debrisScale: 1.6
    });
  }

  // ---- MAIN HALL (north) — a real interior --------------------------------
  const HZ = 'hall';
  const HX0 = -21, HX1 = 21, HZ0 = -40, HZ1 = -23;
  b.zone(HZ, { x0: HX0 - 3, x1: HX1 + 3, z0: HZ0 - 3, z1: HZ1 + 3, y0: -1, y1: 9 });
  b.floor(HX0, HZ0, HX1, HZ1, 0.45, { mat: M.wood, zone: HZ });
  b.ceiling(HX0, HZ0, HX1, HZ1, 4.2, { mat: M.wood, zone: HZ });
  // the engawa (veranda) wrapping the south face — a raised flanking ledge
  b.floor(HX0 - 2, HZ1, HX1 + 2, HZ1 + 2, 0.45, { mat: M.wood });
  // structure: timber posts, and they hold the roof up
  for (let i = 0; i <= 8; i++) {
    const x = HX0 + (HX1 - HX0) * (i / 8);
    for (const z of [HZ0 + 0.4, HZ1 - 0.4]) {
      b.pillar(x, z, 0.45, 3.75, 0.22, { mat: M.wood, hp: 120, zone: HZ, drops: i === 4 ? ['hallroof'] : [] });
    }
  }
  // shoji walls — paper panels that break to open the hall on every side
  for (let i = 0; i < 6; i++) {
    const x0 = HX0 + 0.9 + i * 6.7;
    b.windows(x0, HZ1, x0 + 5.8, HZ1, 0.45, 3.9, {
      zone: HZ, hp: 14, id: 'shoji' + i,
      mat: new THREE.MeshBasicMaterial({ color: 0xe8e0cc, transparent: true, opacity: 0.85 })
    });
  }
  b.wall(HX0 - 0.3, HZ0, HX0 - 0.3, HZ1, 0.45, 4.2, { mat: M.wood, zone: HZ });
  b.wall(HX1 + 0.3, HZ0, HX1 + 0.3, HZ1, 0.45, 4.2, { mat: M.wood, zone: HZ });
  b.wall(HX0, HZ0 - 0.3, HX1, HZ0 - 0.3, 0.45, 4.2, { mat: M.wood, zone: HZ });
  // interior furniture
  for (let i = 0; i < 4; i++) b.bench(HX0 + 5 + i * 10, 0.45, HZ0 + 4.5, 0, 3.0);
  // hanging paper lanterns
  for (let i = 0; i < 6; i++) {
    const x = HX0 + 3.5 + i * 6.8;
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.62, 10), emissive(0xffd08a));
    l.position.set(x, 3.3, (HZ0 + HZ1) / 2);
    b.add(l);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), haloMaterial(0xffb45e, 0.26));
    halo.position.copy(l.position);
    halo.userData.billboard = true;
    b.add(halo);
  }

  // HALL ROOF — deep tiled eaves, and it is walkable
  const RY = 4.6;
  b.floor(HX0 - 2.5, HZ0 - 2.5, HX1 + 2.5, HZ1 + 2.5, RY, { mat: M.concrete, id: 'hallroof' });
  tiledRoof(b, M, HX0 - 2.5, HZ0 - 2.5, HX1 + 2.5, HZ1 + 2.5, RY, 'ridgeH');
  // STONE STEPS up to the roof at the east end. They used to run east AWAY from
  // the building, climbing to roof height over open grass 8 m past the eaves.
  // Authored ground-end first, they now climb west onto the roof's edge.
  b.stairs(HX1 + 11, HZ1 - 7, HX1 + 2.5, HZ1 + 1, 0.06, RY, 'x', { mat: M.concrete });

  // ---- THE DOJO (east) — the second interior ------------------------------
  // A smaller hall, open on its west and south faces, standing between the
  // courtyard and the east treeline. The east half of this campus was a lawn
  // with four trees on it, which on a map whose whole idea is "buildings you
  // fight through" was the weakest ground in the set.
  const DZ = 'dojo';
  const DX0 = 28, DX1 = 48, DZ0 = -16, DZ1 = 2;
  const DRY = 3.9;
  b.zone(DZ, { x0: DX0 - 3, x1: DX1 + 3, z0: DZ0 - 3, z1: DZ1 + 3, y0: -1, y1: 8 });
  b.floor(DX0, DZ0, DX1, DZ1, 0.45, { mat: M.wood, zone: DZ });
  b.ceiling(DX0, DZ0, DX1, DZ1, 3.5, { mat: M.wood, zone: DZ });
  b.floor(DX0 - 2, DZ0, DX0, DZ1, 0.45, { mat: M.wood });          // west engawa
  b.wall(DX1 + 0.3, DZ0, DX1 + 0.3, DZ1, 0.45, 3.5, { mat: M.wood, zone: DZ });
  b.wall(DX0, DZ0 - 0.3, DX1, DZ0 - 0.3, 0.45, 3.5, { mat: M.wood, zone: DZ });
  for (let i = 0; i < 3; i++) {
    b.windows(DX0 + 0.8 + i * 6.5, DZ1, DX0 + 6.0 + i * 6.5, DZ1, 0.45, 3.2, {
      zone: DZ, hp: 14, id: 'dshoji' + i,
      mat: new THREE.MeshBasicMaterial({ color: 0xe8e0cc, transparent: true, opacity: 0.85 })
    });
  }
  for (let i = 0; i <= 4; i++) {
    const x = DX0 + (DX1 - DX0) * (i / 4);
    for (const z of [DZ0 + 0.4, DZ1 - 0.4]) {
      b.pillar(x, z, 0.45, DRY - 0.57, 0.2, { mat: M.wood, hp: 100, zone: DZ, drops: i === 2 ? ['dojoroof'] : [] });
    }
  }
  for (let i = 0; i < 4; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.56, 10), emissive(0xffd08a));
    l.position.set(DX0 + 3 + i * 4.8, 2.8, (DZ0 + DZ1) / 2);
    b.add(l);
  }
  b.floor(DX0 - 2.2, DZ0 - 2.2, DX1 + 2.2, DZ1 + 2.2, DRY, { mat: M.concrete, id: 'dojoroof' });
  tiledRoof(b, M, DX0 - 2.2, DZ0 - 2.2, DX1 + 2.2, DZ1 + 2.2, DRY, 'ridgeD');
  // its own flight, off the south end, so both roofs have their own way up.
  // Authored with a real WIDTH across the climb: a flight whose two x values
  // are equal draws treads with a zero-length side and registers a ramp with
  // zero area — the kit warns about it now, but it shipped twice before it did.
  // It climbs along X and STOPS ON the deck's own x range rather than at its
  // corner: a flight that meets a slab only at the diagonal is a flight you
  // step off sideways if you are lucky and fall off if you are not.
  b.stairs(DX0 - 8, -4, DX0 - 2.2, 1, 0.06, DRY, 'x', { mat: M.concrete });

  // ---- UPPER TERRACE (west) ----------------------------------------------
  const TY = 6.4;
  // The flight was once authored wholly inside the terrace it climbs to: six
  // metres of stone steps under a stone slab. It starts out on the courtyard
  // side and lands on the terrace's edge.
  b.stairs(-23, -10, -34, 10, 0.05, TY, 'x', { mat: M.concrete });
  b.floor(-54, -15, -34, 15, TY, { mat: M.concrete, id: 'terrace' });
  // The retaining face the terrace stands on, so it is a plateau and not a slab
  // hovering over the lawn. `bankFace`, because the face is drawn 0.25 m proud
  // of the deck it edges and on its own that overhang was a strip of terrace
  // you could see and stand on with nothing under it — walk to the north or
  // south edge and you drop 6.4 m through the rim. It carries the deck out to
  // the drawn edge, and it is solid: the terrace is rock, not a curtain.
  for (const [x0, z0, x1, z1] of [[-54, -15, -34, -15], [-54, 15, -34, 15]])
    b.bankFace(x0, z0, x1, z1, TY, 0, { mat: M.rock, thick: 0.5 });
  // STOPPED SHORT OF THE DECK IT HOLDS UP, and carrying that deck across its
  // own top. `bankFace` does both: the blocker still tops out 0.12 m under the
  // terrace (a wall level with the floor beside it collides with anyone
  // standing there), and the 0.6 m of rim it draws above the lawn is walkable
  // instead of being a strip of terrace you drop through — which is where the
  // stairs land, so it is a strip everybody walks over.
  for (const [z0, z1] of [[-15, -10.4], [10.4, 15]])
    b.bankFace(-33.7, z0, -33.7, z1, TY, 0, { mat: M.rock, thick: 0.6 });
  // split around the steps: a rail run along the whole edge walls off the only
  // way up onto the terrace
  b.railing(-34, -15, -34, -10.3, TY);
  b.railing(-34, 10.3, -34, 15, TY);
  for (let i = 0; i < 5; i++) {
    // stone lanterns along the terrace edge
    const x = -50 + i * 4.5, z = 13;
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.9, 6), M.rock);
    post.position.y = 0.95;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.42, 0.4, 4), M.rock);
    cap.position.y = 2.4;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), emissive(0xffc36a));
    box.position.y = 2.05;
    g.add(post, cap, box);
    g.position.set(x, TY, z);
    b.add(g);
    b.breakable(g, { hp: 22, kind: 'concrete', center: v3(x, TY + 1.2, z), radius: 0.5, height: 2.5, baseY: TY });
  }

  // ---- FOREST -------------------------------------------------------------
  // dense cedar around the whole edge, thinning into the courtyard
  const treeSpots = [];
  for (let i = 0; i < 80; i++) {
    const a = rand(0, Math.PI * 2), r = rand(28, 52);
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 5 && z > 18) continue;                 // keep the torii axis clear
    if (x > HX0 - 5 && x < HX1 + 14 && z > HZ0 - 7 && z < HZ1 + 5) continue;
    if (x > DX0 - 8 && x < DX1 + 5 && z > DZ0 - 5 && z < DZ1 + 11) continue;
    if (x < -32 && Math.abs(z) < 16) continue;               // keep the terrace clear
    treeSpots.push([x, z]);
  }
  // the near ones are breakable; the far ring is instanced scenery
  treeSpots.slice(0, 18).forEach(([x, z]) => b.tree(x, 0, z, rand(1.0, 1.7)));
  const far = treeSpots.slice(18).map(([x, z]) => ({ x, y: 0, z, s: rand(1.2, 2.2), ry: rand(0, 6.3) }));
  b.repeat(new THREE.CylinderGeometry(0.2, 0.34, 4.2, 6), M.trunk, far.map(f => ({ ...f, y: 2.1 * f.s, sy: f.s, s: f.s })));
  b.repeat(new THREE.SphereGeometry(1.9, 8, 6), M.foliage, far.map(f => ({ ...f, y: 5.4 * f.s, s: f.s })));

  // =========================================================================
  // THE CAMPUS AS A JUJUTSU SITE
  // =========================================================================
  // This is the warm-daylight map and the only one with a forest on it, and it
  // was lit like a lawn: one key light, one rim, and eighty cedars casting
  // nothing between them. Everything below is about the light coming DOWN
  // through that canopy, and about the fact that a school of sorcerers would
  // have wards on its own ground.

  // ---- THE VEIL ON THE COURTYARD -----------------------------------------
  // The school's own barrier, drawn on the flagstones under the torii axis,
  // with anchor glyphs at the two hall thresholds.
  b.sigil(0, 0.08, 0, 19, 0x7fd0ff, { rings: 3, spokes: 20, sides: 8, opacity: 0.20, spin: 0.018 });
  b.sigil(0, 0.07, -22.4, 4.2, 0x7fd0ff, { rings: 2, spokes: 6, sides: 4, opacity: 0.26, spin: -0.09 });
  b.sigil(26.5, 0.07, -7, 3.6, 0x7fd0ff, { rings: 2, spokes: 6, sides: 4, opacity: 0.26, spin: 0.09 });
  b.sigil(0, 0.07, 30.8, 5.0, 0xffb45e, { rings: 2, spokes: 12, sides: 3, opacity: 0.24, spin: -0.05 });

  // ---- LIGHT THROUGH THE CEDARS ------------------------------------------
  // Shafts standing in the forest ring, leaning the way the key light does
  // (from +x/+y), and a broader one down the torii approach so the walk into
  // the courtyard has a direction.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.4;
    const r = 30 + (i % 3) * 7;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(x) < 6 && z > 18) continue;              // the torii axis stays clear
    b.godRay(x, 15, z, 2.6, 15, 0xfff0c0, { opacity: 0.07, taper: 0.3, lean: [-3.2, 1.6], range: 80 });
  }
  b.godRay(0, 17, 34, 5.0, 17, 0xfff4d0, { opacity: 0.06, taper: 0.45, lean: [-3.4, 1.8], range: 110 });
  b.godRay(-42, 15, 0, 4.0, 8.6, 0xfff0c0, { opacity: 0.07, taper: 0.4, lean: [-1.6, 0.8] });
  // haze along the treeline, so the forest has depth rather than a hard edge
  for (const [mx0, mz0, mx1, mz1] of [
    [-54, 33, 54, 49], [-54, -49, 54, -42], [-54, -42, -40, 33], [40, -42, 54, 33]
  ]) b.mist(mx0, mz0, mx1, mz1, 0, 0xcfe0d8, { opacity: 0.13, scale: 17 });

  // ---- THE SPRING UNDER THE TERRACE --------------------------------------
  // Two falls off the retaining face, either side of the steps, into stone
  // basins on the lawn. A mountain campus with a 6.4 m rock face on it and no
  // water coming off it anywhere was the one thing the west side was missing.
  // Purely visual — a fighter walks through the fall and through the basin, and
  // nothing here registers a collider that could hold anyone still.
  for (const wz of [-12.6, 12.6]) {
    b.waterfall(-33.4, TY - 0.2, wz, 2.2, 6.4, { color: 0x9fd8ea, opacity: 0.55, speed: 2.4 });
    b.water(-34.4, wz - 2.6, -28.5, wz + 2.6, 0.11, {
      shallow: 0x6fc0d8, deep: 0x1e5a72, opacity: 0.7, caustic: 0.3
    });
    b.rock(-30.2, 0, wz - 3.4, 0.55);
    b.rock(-29.4, 0, wz + 3.6, 0.45);
    b.steamVent(-32.6, 0.2, wz, { height: 2.4, period: 3.8, opacity: 0.22, color: 0xdfeef4 });
  }

  // ---- THE APPROACH -------------------------------------------------------
  // Lanterns strung down the torii path and noren hanging in both hall
  // thresholds. The approach was a paved strip between two rows of trees.
  for (let i = 0; i < 4; i++) {
    const z0 = 22 + i * 6, z1 = z0 + 6;
    b.lanternString(v3(-3.6, 4.4, z0), v3(-3.6, 4.4, z1), { color: 0xffb45e, sag: 0.7 });
    b.lanternString(v3(3.6, 4.4, z0), v3(3.6, 4.4, z1), { color: 0xffb45e, sag: 0.7 });
  }
  for (let i = 0; i < 5; i++) {
    for (const s of [-1, 1]) {
      const post = new THREE.BoxGeometry(0.18, 4.6, 0.18);
      post.translate(s * 3.6, 2.3, 22 + i * 6);
      b.static_(post, M.trunk);
    }
  }
  // noren over the hall's south face and the dojo's west face
  for (let i = 0; i < 5; i++) {
    b.banner(HX0 + 4 + i * 8.5, 4.05, HZ1 + 1.9, 3.2, 1.5, 0x24486e, { ry: 0, amp: 0.09 });
  }
  for (let i = 0; i < 3; i++) {
    b.banner(DX0 - 1.9, 3.35, DZ0 + 3.5 + i * 5.2, 3.0, 1.4, 0x6a2434, { ry: Math.PI / 2, amp: 0.09 });
  }
  b.hangingLamp(DX0 + 5, 3.4, -7, 0.9, 0xffd08a);
  b.hangingLamp(DX0 + 14, 3.4, -7, 0.9, 0xffd08a);

  // ---- THE STOREHOUSE -----------------------------------------------------
  // Crates and sealed vessels behind the dojo, off the north-east corner. The
  // vessels are the map's gimmick, and they are drums under the paint: a warded
  // jar full of something a jujutsu school seals rather than throws away goes
  // off exactly as hard as a fuel drum and takes its neighbours with it. Set
  // well behind the building so nothing on a route is narrowed by them.
  b.crates(DX1 + 4, 0, DZ0 - 6, { count: 3 });
  b.crates(DX1 + 5.8, 0, DZ0 - 7.4, { count: 2 });
  b.crates(DX1 + 2.4, 0, DZ0 - 7.6, { count: 1 });
  for (let i = 0; i < 4; i++) {
    b.drum(DX1 - 1 - i * 1.05, 0, DZ0 - 6.4, { color: 0x6a5a44, markColor: 0xff5ad8 });
  }
  b.crates(-46, TY, -11, { count: 2 });
  b.crates(-48, TY, -12.4, { count: 1 });

  // ---- ambient life: leaves, pollen, warm haze ----------------------------
  b.particles(280, { x0: -52, x1: 52, y0: 0.4, y1: 18, z0: -47, z1: 47 },
    { color: 0xd8e8a0, size: 0.11, opacity: 0.42, vy: [-0.7, -0.2] });
  b.particles(160, { x0: -52, x1: 52, y0: 1, y1: 14, z0: -47, z1: 47 },
    { color: 0xfff0c0, size: 0.07, opacity: 0.30, vy: [0.05, 0.3] });

  b.bounds.spawns = [v3(-9, 0.06, 3), v3(9, 0.06, 3), v3(0, 0.06, -9), v3(0, 0.06, 13)];
  return b;
}

// ---------------------------------------------------------------------------
// A TILED ROOF whose pitch is on the PERIMETER.
// ---------------------------------------------------------------------------
// The hall roof used to carry a four-sided cone sitting on the middle of the
// deck, described in its own comment as "visual only — you stand on the flat".
// But the flat IS the middle, so standing anywhere on the roof put the fighter
// inside two and a half metres of solid roof. The pitch belongs on the edge,
// outside the walkable rect, where a deep eave belongs on this building — and
// the ridge down the centre is cover rather than an obstruction because it is
// registered as a wall AND as a platform on top of it.
function tiledRoof(b, M, x0, z0, x1, z1, y, ridgeId) {
  const cz = (z0 + z1) / 2;
  // EVERY PIECE AN EAVE DRAWS GETS A TOP. Both tiers of this roof edge stand
  // proud of the deck they trim — the upper course by 0.37 m and the skirt
  // 1.4 m outboard of the building line — so between them they put a ring of
  // visible tile round both halls that a fighter could see, land on and drop
  // straight through onto the courtyard. `mapcheck.rims()` reported 36 cells of
  // it across the two roofs. The lip is a platform and nothing else, so neither
  // tier becomes something you walk into.
  const eave = (a, c, e, f, drop) => {
    const g = new THREE.BoxGeometry(Math.abs(e - a), 0.34, Math.abs(f - c));
    g.translate((a + e) / 2, y + 0.2, (c + f) / 2);
    b.static_(g, M.rock);
    b.lip(a, c, e, f, y + 0.37);
    const sw = Math.abs(e - a) + (drop === 'x' ? 0 : 3.0);
    const sd = Math.abs(f - c) + (drop === 'z' ? 0 : 3.0);
    const sx = (a + e) / 2 + (drop === 'x' ? Math.sign((a + e) / 2 || 1) * 1.4 : 0);
    const sz = (c + f) / 2 + (drop === 'z' ? Math.sign((c + f) / 2 - cz || 1) * 1.4 : 0);
    const s = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.3, sd), M.rock);
    s.position.set(sx, y - 0.55, sz);
    b.add(s);
    b.lip(sx - sw / 2, sz - sd / 2, sx + sw / 2, sz + sd / 2, y - 0.40);
  };
  eave(x0, z0, x0 + 1.2, z1, 'x');
  eave(x1 - 1.2, z0, x1, z1, 'x');
  eave(x0, z0, x1, z0 + 1.2, 'z');
  eave(x0, z1 - 1.2, x1, z1, 'z');
  const ridge = new THREE.BoxGeometry(x1 - x0 - 4, 0.55, 1.1);
  ridge.translate((x0 + x1) / 2, y + 0.28, cz);
  b.static_(ridge, M.rock);
  b.bounds.wall(x0 + 2, cz - 0.55, x1 - 2, cz + 0.55, y, y + 0.55, { id: ridgeId });
  b.bounds.platform(x0 + 2, cz - 0.55, x1 - 2, cz + 0.55, y + 0.55);
}
