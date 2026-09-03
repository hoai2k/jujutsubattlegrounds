// THE SET 持ちネタ — the six scenes of Takaba's ultimate, as REAL PLACES.
//
// ===========================================================================
// WHAT CHANGED, AND WHY
// ===========================================================================
// The first version of this ultimate was three quick-time events behind a
// full-screen panel. It was fine and it was the wrong feature: nothing about
// it was a *place*, both players stopped playing the game for eight seconds,
// and the only skill it tested was reaction time.
//
// This is the rebuild, and the reference is canon rather than invention:
//
//   "Takaba's cursed technique brings him and his opponent into IMAGINARY
//    SCENARIOS manifested from his imagination, causing them to engage in
//    hilarious shenanigans in VARIOUS SIMULATED ENVIRONMENTS — reviving a dead
//    goldfish at a hospital, participating in a GAME SHOW IN A VALLEY, or
//    playing with water on the beach. Any damage incurred to his opponent will
//    persist, but DAMAGE DONE TO TAKABA ARE NOTHING BUT SIMULATIONS TO HIM."
//
// So the ultimate is a **pocket world with scenes in it**, the opponent is
// physically in there and has to get out, and the reason Takaba is safe inside
// is canon rather than a balance dial. Every scene below is lifted from a
// specific panel of the Kenjaku fight (ch.240-242).
//
// ===========================================================================
// WHAT A SCENE IS
// ===========================================================================
// A builder that returns:
//
//   group       THREE.Group of visuals, added to the scene by the caller
//   colliders   the platforms and walls it authored into `bounds`, so the
//               caller can `bounds.drop()` them on teardown. Only STATIC
//               geometry goes in here.
//   spawn       where the contestant starts       {x, z}
//   host        where Takaba starts               {x, z}
//   exit        the goal                          {x, z, r}
//   tick(dt)    advances the scene and returns its live HAZARDS as
//               [{x, y, z, r, kind, push}] — moving things are NOT colliders,
//               they are entities tested against the fighters each frame, the
//               same way every other moving danger in this game works.
//
// ===========================================================================
// THE PLAYSPACE, AND WHY IT RUNS ALONG X
// ===========================================================================
// Every scene is a corridor from x = -13 (start) to x = +13 (exit), 12 m wide
// in z. That fits inside the smallest map in the game (Shibuya Underground is
// ±18 in z but ±46 in x) with room to spare, so the set never has to care
// which arena it opened in.
//
// It is sized against the fighters' real movement numbers rather than by eye:
// jump velocity 8.6 against gravity 26 gives an apex of 1.42 m and 0.66 s of
// airtime, so nothing steps up more than 1.20 m and no gap is wider than
// 2.20 m. A scene you cannot physically clear is not a challenge, it is a bug.
//
// All geometry and animation is original and procedural.
import * as THREE from 'three';
import { roundBox, tGeo, latheY, tubeBetween, shapeExtrude } from '../builders/geo.js';
import { toonMaterial } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3, rand, clamp } from '../../../core/math.js';

export const SET_X0 = -13;     // the start line
export const SET_X1 = 13;      // the exit line
export const SET_HALF_Z = 6;   // the corridor's half width

// ---------------------------------------------------------------------------
// MATERIALS — the studio palette
// ---------------------------------------------------------------------------
// Deliberately BRIGHT and SATURATED against a game whose environments are
// concrete, shadow and blood. A television set is over-lit and made of painted
// flats, and it should look like one from the first frame.
const M = {
  flat: (c) => toonMaterial({ vertexColors: false, color: c, steps: [86, 158, 240, 255], rim: 0.24, rimStart: 0.72, rimColor: 0xfff0d8 }),
  gloss: (c) => toonMaterial({ vertexColors: false, color: c, steps: [50, 128, 210, 255], rim: 0.52, rimStart: 0.62, gloss: 0.7, rimColor: 0xffffff }),
  metal: (c) => toonMaterial({ vertexColors: false, color: c, steps: [40, 118, 205, 255], rim: 0.5, rimStart: 0.62, gloss: 0.62, rimColor: 0xcfd8e8 }),
  cloth: (c) => toonMaterial({ vertexColors: false, color: c, steps: [64, 140, 255], rim: 0.28, rimStart: 0.70, rimColor: 0xffc8c8 }),
  glow: (c, o = 0.5) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
};
const ink = (mesh, t = 0.014) => makeOutline(mesh, { color: 0x140e12, thickness: t });
function put(g, geo, mat, outline = true) {
  const m = new THREE.Mesh(geo, mat);
  g.add(m);
  if (outline) g.add(ink(m));
  return m;
}

// ---------------------------------------------------------------------------
// SHARED FURNITURE — every scene gets the same floor, the same walls and the
// same EXIT, so the contestant learns the grammar once and then only has to
// read what is new. That consistency is what makes three scenes in fourteen
// seconds legible rather than a blur.
// ---------------------------------------------------------------------------
function stageFloor(g, bounds, colliders, { y = 0, x0 = SET_X0 - 3, x1 = SET_X1 + 3 } = {}) {
  const w = x1 - x0, d = SET_HALF_Z * 2;
  put(g, tGeo(roundBox(w, 0.5, d, 0.05), { pos: [(x0 + x1) / 2, y - 0.25, 0] }), M.flat(0x2a2c38), false);
  // the deck boards, so the floor has a direction and the run reads as a run
  for (let i = 0; i < 13; i++) {
    put(g, tGeo(roundBox(w, 0.02, 0.10, 0.01), { pos: [(x0 + x1) / 2, y + 0.005, -SET_HALF_Z + i * (d / 12)] }), M.flat(0x3a3d4c), false);
  }
  colliders.push(bounds.platform(x0, -SET_HALF_Z, x1, SET_HALF_Z, y, { id: 'set:floor' }));
  return y;
}

function sideWalls(g, bounds, colliders, { y = 0, h = 6 } = {}) {
  for (const s of [1, -1]) {
    put(g, tGeo(roundBox(SET_X1 - SET_X0 + 8, h, 0.4, 0.05), { pos: [0, y + h / 2, s * (SET_HALF_Z + 0.2)] }), M.flat(0x1b1d27), false);
    colliders.push(bounds.wall(SET_X0 - 4, s * SET_HALF_Z, SET_X1 + 4, s * SET_HALF_Z, y, y + h, { id: 'set:wall' }));
  }
  // and the two ends, so nobody walks out the back of the set
  for (const s of [1, -1]) {
    colliders.push(bounds.wall(s * (SET_X1 + 3), -SET_HALF_Z, s * (SET_X1 + 3), SET_HALF_Z, y, y + h, { id: 'set:wall' }));
  }
}

// THE EXIT. One object, identical in all six scenes: a lit arch with a green
// floor pad under it. The pad is what the system actually tests, and it is
// drawn at exactly the radius it tests at — the picture and the trigger are
// the same object, which is this project's standing rule for hitboxes.
function exitArch(g, x, y, r) {
  const arch = new THREE.Group();
  for (const s of [1, -1]) put(arch, tGeo(roundBox(0.34, 3.4, 0.34, 0.06), { pos: [0, 1.7, s * 1.7] }), M.metal(0x6fe89a));
  put(arch, tGeo(roundBox(0.34, 0.34, 3.74, 0.06), { pos: [0, 3.4, 0] }), M.metal(0x6fe89a));
  const pad = new THREE.Mesh(new THREE.CircleGeometry(r, 26), M.glow(0x6fe89a, 0.30));
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.03;
  arch.add(pad);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.6, 5.0, 18, 1, true), M.glow(0x6fe89a, 0.10));
  beam.position.y = 2.5;
  arch.add(beam);
  arch.position.set(x, y, 0);
  g.add(arch);
  return { pad, beam, group: arch };
}

// A HAZARD RECORD. Everything that moves is one of these; nothing that moves
// is ever a collider.
const HZ = (x, y, z, r, kind, push = 1) => ({ x, y, z, r, kind, push });

// ===========================================================================
// 1 · THE QUIZ DOORS 二択 — ch.242, the quiz where they must pick the door
// ===========================================================================
// A wall of five doors across the corridor. Exactly one opens. The right one
// lights a beat before it unlocks, so this is a READ under a clock rather than
// a guess — walking into a wrong door bounces you back and costs you the run.
// Three walls of doors, one after another.
function buildQuizDoors(bounds, colliders, tier) {
  const g = new THREE.Group();
  stageFloor(g, bounds, colliders);
  sideWalls(g, bounds, colliders);
  const T = [{ tell: 0.85, gap: 2.4 }, { tell: 0.60, gap: 2.2 }, { tell: 0.42, gap: 2.0 }][tier];

  const banks = [];
  // The first bank sits well clear of the start line: at the tier-1 run speed
  // the old -5.5 arrived about a second and a half in, which is not enough
  // time to read a lit door while still accelerating.
  const XS = [-3.5, 2.0, 7.5];
  for (let b = 0; b < XS.length; b++) {
    const x = XS[b];
    const open = 1 + ((b * 2 + 1) % 3);          // which of five is real (0..4)
    const doors = [];
    for (let i = 0; i < 5; i++) {
      const z = -4.8 + i * 2.4;
      const d = new THREE.Group();
      put(d, tGeo(roundBox(0.30, 3.0, 2.16, 0.06), { pos: [0, 1.5, 0] }), M.flat(i === open ? 0x2f63b0 : 0x8a2f3a));
      put(d, tGeo(roundBox(0.34, 0.16, 2.20, 0.03), { pos: [0, 2.90, 0] }), M.metal(0xd8b45a));
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.26, 16), M.glow(0xffd84a, 0.0));
      lamp.rotation.y = -Math.PI / 2;
      lamp.position.set(-0.17, 2.30, 0);
      d.add(lamp);
      d.position.set(x, 0, z);
      g.add(d);
      // every door is a WALL until it opens; the open one is dropped from the
      // colliders the moment its tell fires
      const w = bounds.wall(x, z - 1.08, x, z + 1.08, 0, 3.0, { id: 'set:door' });
      colliders.push(w);
      doors.push({ node: d, lamp, wall: w, real: i === open, z });
    }
    banks.push({ x, doors, opened: false });
  }
  const exit = exitArch(g, SET_X1, 0, 1.5);

  let t = 0;
  const tick = (dt, ctx) => {
    t += dt;
    const hz = [];
    for (const bank of banks) {
      // the tell fires when the contestant is `tell` seconds of running away
      const dist = ctx.runner ? bank.x - ctx.runner.x : 99;
      const lead = T.tell * 5.2 + 2.0;
      const live = dist > -1.5 && dist < lead;
      for (const d of bank.doors) {
        d.lamp.material.opacity = (live && d.real) ? 0.55 + Math.sin(t * 14) * 0.3 : 0;
        if (live && d.real && d.wall.live) { d.wall.live = false; bank.opened = true; }
        if (!live && d.real && !d.wall.live && dist < -1.5) d.wall.live = true;  // shuts behind them
        d.node.position.x = bank.x + (d.real && !d.wall.live ? 0 : 0);
      }
      // the closed doors SLAM — a shove, not damage, so a wrong read costs
      // tempo rather than health
      for (const d of bank.doors) {
        if (d.real) continue;
        hz.push(HZ(bank.x, 1.2, d.z, 0.9, 'door', 1.4));
      }
    }
    exit.pad.material.opacity = 0.24 + Math.sin(t * 5) * 0.10;
    return hz;
  };
  // WHERE A PLAYER WOULD BE LOOKING. A human reads the lit door; the CPU
  // contestant has no eyes, so the scene tells it. Without this it treats the
  // bank as a wall of hazards, swerves off the only opening, and loses every
  // run at every tier — which is a bot that cannot see, not a hard scene.
  const aim = (r) => {
    let best = null;
    for (const bank of banks) {
      const d = bank.x - r.x;
      if (d < -0.8 || d > 9) continue;
      if (!best || bank.x < best.x) best = bank;
    }
    if (!best) return null;
    const door = best.doors.find(d => d.real);
    return door ? door.z : null;
  };
  return { group: g, tick, aim, exit: { x: SET_X1, z: 0, r: 1.5 }, spawn: { x: SET_X0, z: 0 }, host: { x: SET_X0 - 2, z: 3 } };
}

// ===========================================================================
// 2 · THE CROSSING 横断歩道 — ch.242, the cat in the road and the taxi
// ===========================================================================
// Four lanes of traffic sliding across the corridor. Get to the far kerb. The
// cabs knock you flat; the timing between them is the whole scene. There is a
// cat sitting in lane three, because there is a cat in the panel.
function buildCrossing(bounds, colliders, tier) {
  const g = new THREE.Group();
  stageFloor(g, bounds, colliders);
  sideWalls(g, bounds, colliders, { h: 5 });
  const T = [{ speed: 9, gap: 5.6 }, { speed: 12, gap: 4.6 }, { speed: 15, gap: 3.8 }][tier];

  // the road surface and its lane markings
  put(g, tGeo(roundBox(16, 0.06, 12, 0.02), { pos: [0.5, 0.04, 0] }), M.flat(0x24262e), false);
  for (let i = 0; i < 24; i++) {
    put(g, tGeo(roundBox(0.5, 0.02, 0.14, 0.01), { pos: [-7 + i * 0.7, 0.075, 0] }), M.flat(0xe8e2c8), false);
  }
  // the two kerbs — a real 0.35 m step up, which is inside STEP_UP so it never
  // becomes an invisible wall
  for (const x of [SET_X0 + 2.5, SET_X1 - 2.5]) {
    put(g, tGeo(roundBox(1.6, 0.35, 12, 0.04), { pos: [x, 0.175, 0] }), M.flat(0x4a4d58));
    colliders.push(bounds.platform(x - 0.8, -SET_HALF_Z, x + 0.8, SET_HALF_Z, 0.35, { id: 'set:kerb' }));
  }

  // THE CAT. It does nothing. It is in the panel, so it is in the scene.
  const cat = new THREE.Group();
  put(cat, tGeo(latheY([[0.16, 0], [0.22, 0.14], [0.14, 0.30]], 12, 1.5), {}), M.cloth(0x2a2a30));
  put(cat, tGeo(new THREE.SphereGeometry(0.17, 10, 8), { pos: [0, 0.40, 0.14] }), M.cloth(0x2a2a30));
  for (const s of [1, -1]) put(cat, tGeo(new THREE.ConeGeometry(0.07, 0.14, 4), { pos: [s * 0.09, 0.54, 0.12] }), M.cloth(0x2a2a30));
  cat.position.set(1.2, 0, 2.2);
  g.add(cat);

  const CABS = [];
  const LANES = [-3.6, -1.2, 1.2, 3.6];
  LANES.forEach((z, i) => {
    for (let k = 0; k < 2; k++) {
      const cab = new THREE.Group();
      put(cab, tGeo(roundBox(3.6, 0.9, 1.6, 0.20), { pos: [0, 0.62, 0] }), M.gloss(0xf0c22a));
      // the cabin is FLAT and dark: under the set's lift the glossy version
      // blew out to a pale box and the whole rank read as a row of beds
      put(cab, tGeo(roundBox(1.9, 0.7, 1.5, 0.18), { pos: [-0.25, 1.36, 0] }), M.flat(0x1c1e26));
      put(cab, tGeo(roundBox(1.7, 0.42, 1.42, 0.10), { pos: [-0.25, 1.42, 0] }), M.glow(0x8ad0f0, 0.35));
      put(cab, tGeo(roundBox(0.42, 0.18, 0.62, 0.05), { pos: [0.5, 1.78, 0] }), M.flat(0xf0c22a));
      for (const sx of [1.2, -1.2]) for (const sz of [0.78, -0.78]) {
        put(cab, tGeo(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12), { rot: [90, 0, 0], pos: [sx, 0.34, sz] }), M.flat(0x16181e));
      }
      cab.rotation.y = (i % 2) ? Math.PI : 0;
      g.add(cab);
      CABS.push({ node: cab, z, dir: (i % 2) ? -1 : 1, phase: (i * 0.5 + k) * T.gap });
    }
  });
  const exit = exitArch(g, SET_X1, 0.35, 1.5);

  let t = 0;
  const span = 22;
  const tick = (dt) => {
    t += dt;
    const hz = [];
    for (const c of CABS) {
      const u = ((t * T.speed + c.phase * T.speed) % span) / span;
      const x = c.dir > 0 ? -11 + u * span : 11 - u * span;
      c.node.position.set(x, 0, c.z);
      if (x > -12 && x < 12) hz.push(HZ(x, 0.9, c.z, 1.5, 'cab', 1.5));
    }
    exit.pad.material.opacity = 0.24 + Math.sin(t * 5) * 0.10;
    return hz;
  };
  return { group: g, tick, exit: { x: SET_X1, z: 0, r: 1.5 }, spawn: { x: SET_X0, z: 0 }, host: { x: SET_X0 - 2, z: -3.4 } };
}

// ===========================================================================
// 3 · THE WARD 病棟 — ch.242, the dead goldfish and the futile resuscitation
// ===========================================================================
// A hospital corridor. Gurneys come out of the side rooms and slide straight
// across it. The goldfish bowl is on a plinth in the middle, on a pedestal you
// have to go over rather than around.
function buildWard(bounds, colliders, tier) {
  const g = new THREE.Group();
  stageFloor(g, bounds, colliders);
  sideWalls(g, bounds, colliders, { h: 4 });
  const T = [{ speed: 6.5, every: 2.4 }, { speed: 8.5, every: 1.9 }, { speed: 10.5, every: 1.5 }][tier];

  // lino, and the doorways the gurneys come out of
  put(g, tGeo(roundBox(30, 0.04, 12, 0.02), { pos: [0, 0.03, 0] }), M.flat(0xd8dcd4), false);
  for (let i = 0; i < 6; i++) {
    const x = -9 + i * 3.6;
    for (const s of [1, -1]) {
      put(g, tGeo(roundBox(2.0, 2.6, 0.18, 0.04), { pos: [x, 1.3, s * (SET_HALF_Z - 0.1)] }), M.flat(0x8fb8a8));
    }
  }
  // the strip lights, which is what makes a corridor read as a hospital
  for (let i = 0; i < 8; i++) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.4), M.glow(0xf2fff8, 0.35));
    l.rotation.x = Math.PI / 2;
    l.position.set(-11 + i * 3.2, 3.9, 0);
    g.add(l);
  }

  // THE PLINTH AND THE BOWL. A 1.1 m step in the middle of the run, inside the
  // 1.42 m jump apex, so it is a real obstacle you clear rather than a wall.
  put(g, tGeo(roundBox(3.2, 1.1, 3.2, 0.10), { pos: [0.5, 0.55, 0] }), M.flat(0xc4b89a));
  colliders.push(bounds.platform(-1.1, -1.6, 2.1, 1.6, 1.1, { id: 'set:plinth' }));
  const bowl = put(g, tGeo(latheY([[0.34, 0], [0.46, 0.24], [0.36, 0.50]], 16, 1), { pos: [0.5, 1.1, 0] }), M.glow(0x8ad0f0, 0.5), false);
  const fish = put(g, tGeo(new THREE.SphereGeometry(0.09, 8, 6), { scale: [1.6, 0.8, 0.7], pos: [0.5, 1.36, 0] }), M.flat(0xff8a3a), false);

  const GURNEYS = [];
  for (let i = 0; i < 5; i++) {
    const gy = new THREE.Group();
    put(gy, tGeo(roundBox(2.2, 0.16, 0.9, 0.05), { pos: [0, 0.86, 0] }), M.flat(0xf2f2ee));
    put(gy, tGeo(roundBox(2.0, 0.30, 0.85, 0.10), { pos: [0, 1.05, 0] }), M.cloth(0x9fd8c8));
    for (const sx of [0.9, -0.9]) for (const sz of [0.38, -0.38]) {
      put(gy, tGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 6), { pos: [sx, 0.44, sz] }), M.metal(0xb0b4bc));
      put(gy, tGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 8), { rot: [90, 0, 0], pos: [sx, 0.09, sz] }), M.flat(0x2a2c34));
    }
    g.add(gy);
    GURNEYS.push({ node: gy, x: -9 + i * 4.2, dir: i % 2 ? 1 : -1, phase: i * T.every * 0.62 });
  }
  const exit = exitArch(g, SET_X1, 0, 1.5);

  let t = 0;
  const span = 14;
  const tick = (dt) => {
    t += dt;
    const hz = [];
    for (const gy of GURNEYS) {
      const u = (((t + gy.phase) * T.speed) % span) / span;
      const z = gy.dir > 0 ? -7 + u * span : 7 - u * span;
      gy.node.position.set(gy.x, 0, z);
      gy.node.rotation.y = Math.PI / 2;
      if (z > -6.5 && z < 6.5) hz.push(HZ(gy.x, 1.0, z, 1.1, 'gurney', 1.7));
    }
    fish.position.y = 1.36 + Math.sin(t * 2) * 0.01;   // it is not moving. it is dead.
    exit.pad.material.opacity = 0.24 + Math.sin(t * 5) * 0.10;
    return hz;
  };
  return { group: g, tick, exit: { x: SET_X1, z: 0, r: 1.5 }, spawn: { x: SET_X0, z: 0 }, host: { x: SET_X0 - 2, z: 3.4 } };
}

// ===========================================================================
// 4 · THE SURF 波 — ch.242, drowning while Kenjaku paddles out on a surfboard
// ===========================================================================
// THE MOST VERTICAL OF THE SIX. The floor floods and the water RISES on a
// clock. Bobbing platforms are the only way across, and the ones behind you go
// under first — so it is a run forward with a deadline attached to the ground.
function buildSurf(bounds, colliders, tier) {
  const g = new THREE.Group();
  stageFloor(g, bounds, colliders, { y: -0.6 });
  sideWalls(g, bounds, colliders, { y: -0.6, h: 7 });
  const T = [{ rise: 0.26, bob: 0.10 }, { rise: 0.36, bob: 0.16 }, { rise: 0.46, bob: 0.22 }][tier];

  const water = new THREE.Mesh(new THREE.PlaneGeometry(34, 13, 24, 8), M.glow(0x2f8fd0, 0.42));
  water.rotation.x = -Math.PI / 2;
  g.add(water);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(34, 13, 24, 8), M.glow(0xbfe8ff, 0.18));
  foam.rotation.x = -Math.PI / 2;
  g.add(foam);

  // eight bobbing rafts, alternating sides, gaps under 2.2 m
  const RAFTS = [];
  const PLAN = [
    { x: -10.4, z: 0, y: 0.5 }, { x: -8.2, z: -1.9, y: 0.8 }, { x: -6.0, z: 1.6, y: 1.1 },
    { x: -3.6, z: -1.2, y: 1.4 }, { x: -1.2, z: 1.9, y: 1.7 }, { x: 1.4, z: -1.6, y: 2.0 },
    { x: 4.0, z: 1.2, y: 2.0 }, { x: 6.6, z: -0.6, y: 1.8 }, { x: 9.2, z: 0.4, y: 1.4 }
  ];
  for (const p of PLAN) {
    const raft = new THREE.Group();
    put(raft, tGeo(roundBox(2.3, 0.24, 2.3, 0.08), { pos: [0, 0, 0] }), M.flat(0xb8905a));
    for (let i = -1; i <= 1; i++) put(raft, tGeo(roundBox(2.3, 0.06, 0.6, 0.03), { pos: [0, 0.14, i * 0.75] }), M.flat(0xd8ac6a), false);
    raft.position.set(p.x, p.y, p.z);
    g.add(raft);
    const col = bounds.platform(p.x - 1.15, p.z - 1.15, p.x + 1.15, p.z + 1.15, p.y, { id: 'set:raft', prop: true });
    colliders.push(col);
    RAFTS.push({ node: raft, col, base: p.y, phase: rand(0, 6.28), x: p.x, z: p.z });
  }
  // A DRY START. The first pass spawned the contestant on the sunken stage
  // floor, already in the water, before they had done anything wrong — a scene
  // whose failure state is live on frame one is not a scene.
  put(g, tGeo(roundBox(4.4, 0.3, 4.8, 0.08), { pos: [SET_X0, 0.35, 0] }), M.flat(0xb8905a));
  colliders.push(bounds.platform(SET_X0 - 2.2, -2.4, SET_X0 + 2.2, 2.4, 0.5, { id: 'set:jetty' }));
  // the exit is a jetty at the far end, above the water line
  put(g, tGeo(roundBox(4.0, 0.3, 4.4, 0.08), { pos: [SET_X1, 1.15, 0] }), M.flat(0xb8905a));
  colliders.push(bounds.platform(SET_X1 - 2, -2.2, SET_X1 + 2, 2.2, 1.3, { id: 'set:jetty' }));
  const exit = exitArch(g, SET_X1, 1.3, 1.6);

  let t = 0;
  const tick = (dt) => {
    t += dt;
    const level = -0.5 + t * T.rise;
    water.position.y = level;
    foam.position.y = level + 0.03;
    water.material.opacity = 0.38 + Math.sin(t * 3) * 0.06;
    const hz = [];
    for (const r of RAFTS) {
      // BOBBING PLATFORMS MOVE VISUALLY BUT THEIR COLLIDER DOES NOT. A collider
      // that changed height every frame would fight the spatial grid and drop
      // a fighter through the floor; the bob is presentation and the platform
      // is honest, which is the same split the hazards get.
      r.node.position.y = r.base + Math.sin(t * 2.2 + r.phase) * T.bob;
      // ...and it goes UNDER when the water passes it: the collider dies, so
      // the route behind you genuinely stops existing.
      if (r.col.live && level > r.base + 0.20) {
        r.col.live = false;
        r.node.position.y = r.base - 0.35;
      }
    }
    // the water itself is the hazard: a wide flat one at its own height
    hz.push({ x: 0, y: level, z: 0, r: 99, kind: 'water', push: 0, plane: level });
    exit.pad.material.opacity = 0.24 + Math.sin(t * 5) * 0.10;
    return hz;
  };
  return { group: g, tick, exit: { x: SET_X1, z: 0, r: 1.6 }, spawn: { x: SET_X0, z: 0 }, host: { x: SET_X0 - 2, z: 3.4 } };
}

// ===========================================================================
// 5 · THE CONVEYOR 工場 — the classic, and the one pure platforming scene
// ===========================================================================
// A belt running the WRONG WAY, with crates dropping onto it from a hopper.
// Standing still loses ground. It is the only scene that punishes hesitation
// directly rather than through a hazard.
function buildConveyor(bounds, colliders, tier) {
  const g = new THREE.Group();
  stageFloor(g, bounds, colliders);
  sideWalls(g, bounds, colliders, { h: 6 });
  const T = [{ belt: 1.5, every: 1.15, fall: 7 }, { belt: 2.3, every: 0.9, fall: 9 }, { belt: 3.1, every: 0.7, fall: 11 }][tier];

  // the belt deck, raised 0.4 m so its edge reads
  put(g, tGeo(roundBox(22, 0.4, 6.4, 0.06), { pos: [0, 0.2, 0] }), M.metal(0x3a3d48));
  colliders.push(bounds.platform(-11, -3.2, 11, 3.2, 0.4, { id: 'set:belt' }));
  const slats = [];
  for (let i = 0; i < 30; i++) {
    const s = put(g, tGeo(roundBox(0.5, 0.08, 6.2, 0.02), { pos: [-11 + i * 0.75, 0.44, 0] }), M.flat(0x585c6a), false);
    slats.push(s);
  }
  for (const s of [1, -1]) {
    put(g, tGeo(new THREE.CylinderGeometry(0.5, 0.5, 6.6, 14), { rot: [90, 0, 0], pos: [s * 11, 0.2, 0] }), M.metal(0x6a6f7c));
  }
  // the hopper the crates come out of
  put(g, tGeo(latheY([[2.2, 0], [1.6, 1.2], [0.8, 1.8]], 4, 1), { rot: [180, 45, 0], pos: [2.0, 6.4, 0] }), M.metal(0x4a4f5c));

  const CRATES = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Group();
    put(c, tGeo(roundBox(1.5, 1.5, 1.5, 0.08), {}), M.flat(0xa87a44));
    for (const a of [[0, 0, 1], [1, 0, 0]]) {
      put(c, tGeo(roundBox(a[2] ? 1.56 : 0.16, 0.16, a[2] ? 0.16 : 1.56, 0.03), { pos: [0, 0, 0] }), M.flat(0x6a4a24), false);
    }
    c.visible = false;
    g.add(c);
    CRATES.push({ node: c, t: -i * T.every, x: 0, z: 0 });
  }
  const exit = exitArch(g, SET_X1, 0, 1.5);

  let t = 0;
  const tick = (dt, ctx) => {
    t += dt;
    for (let i = 0; i < slats.length; i++) {
      slats[i].position.x = -11 + (((i * 0.75) - t * T.belt * 2) % 22.5 + 22.5) % 22.5;
    }
    // THE BELT DRAGS. Applied by the caller through `beltPush` — it is a
    // velocity on anything standing on the deck, not a hazard.
    const hz = [];
    for (const c of CRATES) {
      c.t += dt;
      if (c.t < 0) { c.node.visible = false; continue; }
      const cycle = T.every * CRATES.length;
      if (c.t === dt || c.t > cycle) { c.t = 0; c.x = rand(-8, 8); c.z = rand(-2.4, 2.4); }
      const fallT = c.t;
      const y = 7.2 - 0.5 * T.fall * fallT * fallT;
      c.node.visible = true;
      if (y <= 1.15) {
        c.node.position.set(c.x, 1.15, c.z);
        c.node.rotation.y += dt * 0.4;
        if (fallT < 1.9) hz.push(HZ(c.x, 1.1, c.z, 1.15, 'crate', 1.6));
        else { c.t = -0.01; c.node.visible = false; }
      } else {
        c.node.position.set(c.x, y, c.z);
        c.node.rotation.y += dt * 2.2;
        // the shadow it is about to land in, so it can be read before it lands
        hz.push({ x: c.x, y: 0.42, z: c.z, r: 1.15, kind: 'crateTell', push: 0, tell: true });
      }
    }
    exit.pad.material.opacity = 0.24 + Math.sin(t * 5) * 0.10;
    return hz;
  };
  return {
    group: g, tick, exit: { x: SET_X1, z: 0, r: 1.5 },
    spawn: { x: SET_X0, z: 0 }, host: { x: SET_X0 - 2, z: 3.4 },
    // the belt's drag, read by the system each frame
    belt: { x0: -11, x1: 11, z0: -3.2, z1: 3.2, y: 0.4, push: -T.belt }
  };
}

// ===========================================================================
// 6 · THE ROOFTOPS 屋上 — gaps, and his own foam finger sweeping across them
// ===========================================================================
// Five roofs with real gaps between them, and the ENORMOUS FOAM FINGER from
// his own RT swinging across the middle three on a clock. The one scene built
// out of his own kit rather than out of a panel.
function buildRooftops(bounds, colliders, tier) {
  const g = new THREE.Group();
  const T = [{ sweep: 3.4, gap: 1.7 }, { sweep: 2.6, gap: 2.0 }, { sweep: 2.0, gap: 2.2 }][tier];
  sideWalls(g, bounds, colliders, { y: -8, h: 20 });

  // NO FLOOR AT ALL: falling off IS the failure, and the system catches them at
  // voidY. The layout is COMPUTED from the tier's gap rather than typed out,
  // because the first pass had the roofs hand-placed at 0.9-1.4 m apart —
  // gaps you cross by walking, which read on screen as seams in one slab
  // rather than as a route with holes in it. Derived, they are exactly the
  // tier's gap every time, and every one of them is inside the 3.3 m a
  // fighter can actually clear (jump 8.6 against gravity 26).
  const WID = [5.0, 4.6, 4.6, 4.6, 5.0];
  const HGT = [0.0, 0.9, 1.6, 0.9, 0.0];
  const span = WID.reduce((a, b) => a + b, 0) + T.gap * 4;
  const ROOFS = [];
  let cursor = -span / 2;
  for (let i = 0; i < WID.length; i++) {
    ROOFS.push({ x: cursor + WID[i] / 2, w: WID[i], y: HGT[i] });
    cursor += WID[i] + T.gap;
  }
  const ROOF_TOP = [0x6a6d78, 0x7a6a58, 0x5c6a78, 0x78685c, 0x6a6d78];
  const ROOF_SIDE = [0x3a3d48, 0x4a3f34, 0x36404c, 0x483e34, 0x3a3d48];
  ROOFS.forEach((r, i) => {
    put(g, tGeo(roundBox(r.w, 6.0, 8.4, 0.08), { pos: [r.x, r.y - 3.0, 0] }), M.flat(ROOF_SIDE[i]));
    put(g, tGeo(roundBox(r.w + 0.3, 0.30, 8.7, 0.05), { pos: [r.x, r.y + 0.15, 0] }), M.flat(ROOF_TOP[i]), false);
    // the parapet, so the roof reads as a roof and the edge is legible
    for (const s of [1, -1]) put(g, tGeo(roundBox(r.w + 0.3, 0.5, 0.24, 0.04), { pos: [r.x, r.y + 0.25, s * 4.3] }), M.flat(0x3a3d48));
    colliders.push(bounds.platform(r.x - r.w / 2, -4.2, r.x + r.w / 2, 4.2, r.y, { id: 'set:roof', prop: true }));
    // an aircon box on the middle three, because a flat rectangle is not a roof
    if (i > 0 && i < 4) {
      put(g, tGeo(roundBox(1.2, 0.8, 1.2, 0.06), { pos: [r.x, r.y + 0.55, -2.6] }), M.metal(0x8a8f9a));
      colliders.push(bounds.platform(r.x - 0.6, -3.2, r.x + 0.6, -2.0, r.y + 0.95, { id: 'set:ac', prop: true }));
    }
  });

  // THE FOAM FINGER, on a pivot below the corridor, sweeping across it
  const pivot = new THREE.Group();
  const arm = new THREE.Group();
  put(arm, tGeo(roundBox(1.10, 1.35, 0.42, 0.18), { pos: [0, 0, 7.0] }), M.cloth(0xf05a8a));
  put(arm, tGeo(roundBox(0.44, 1.55, 0.40, 0.18), { pos: [0.30, 1.30, 7.0] }), M.cloth(0xf05a8a));
  put(arm, tGeo(roundBox(0.42, 0.85, 0.38, 0.16), { rot: [0, 0, 36], pos: [-0.66, 0.30, 7.0] }), M.cloth(0xf05a8a));
  put(arm, tGeo(roundBox(1.14, 0.30, 0.44, 0.06), { pos: [0, -0.52, 7.0] }), M.flat(0xf2f2ee));
  put(arm, tubeBetween(v3(0, 0, 0), v3(0, 0, 6.6), [0.16, 0.24], { radial: 8, hSeg: 3 }), M.cloth(0xc44878));
  pivot.add(arm);
  pivot.position.set(ROOFS[2].x, ROOFS[2].y + 2.2, 0);
  g.add(pivot);
  const exit = exitArch(g, ROOFS[4].x, ROOFS[4].y, 1.6);

  let t = 0;
  const tick = (dt) => {
    t += dt;
    const u = (t % T.sweep) / T.sweep;
    const a = Math.sin(u * Math.PI * 2) * 1.35;
    pivot.rotation.y = a;
    const hz = [];
    // the finger's tip, wherever it currently is
    const tipX = ROOFS[2].x + Math.sin(a) * 7.0, tipZ = Math.cos(a) * 7.0;
    hz.push(HZ(tipX, ROOFS[2].y + 2.6, tipZ, 1.6, 'finger', 2.0));
    // and its middle, so ducking under the tip does not walk you through the arm
    hz.push(HZ(ROOFS[2].x + Math.sin(a) * 3.6, ROOFS[2].y + 2.4, Math.cos(a) * 3.6, 0.9, 'finger', 1.8));
    exit.pad.material.opacity = 0.24 + Math.sin(t * 5) * 0.10;
    return hz;
  };
  return {
    group: g, tick, exit: { x: ROOFS[4].x, z: 0, r: 1.6 },
    spawn: { x: ROOFS[0].x, z: 0 }, host: { x: ROOFS[0].x - 1.6, z: 2.6 },
    // falling off a roof is the failure state this scene owns
    voidY: -6
  };
}

// ===========================================================================
// THE POOL
// ===========================================================================
// `time` is the clock at each tier. Every scene is beatable with room to spare
// at OPEN MIC and is a genuine sprint at KILLING — the numbers are in the
// delivery notes and were measured by driving a bot through each one.
export const SCENES = [
  { key: 'doors', name: 'PICK A DOOR', jp: '二択', blurb: 'ONE OF THEM OPENS', build: buildQuizDoors, time: [5.0, 4.4, 3.8], ref: 'ch.242 — the quiz, and the question about college recommendations' },
  { key: 'crossing', name: 'MIND THE TRAFFIC', jp: '横断歩道', blurb: 'GET TO THE OTHER SIDE', build: buildCrossing, time: [5.2, 4.6, 4.0], ref: 'ch.242 — the cat in the road and the taxi that is about to hit it' },
  { key: 'ward', name: 'CODE BLUE', jp: '病棟', blurb: 'DOWN THE CORRIDOR', build: buildWard, time: [5.0, 4.4, 3.8], ref: 'ch.242 — the dead goldfish, and two men in scrubs failing to revive it' },
  { key: 'surf', name: 'IT IS RISING', jp: '波', blurb: 'GET ABOVE THE WATER', build: buildSurf, time: [6.0, 5.2, 4.6], ref: 'ch.242 — Takaba drowning while Kenjaku paddles out on a surfboard' },
  { key: 'conveyor', name: 'THE WRONG WAY', jp: '工場', blurb: 'THE BELT IS AGAINST YOU', build: buildConveyor, time: [5.4, 4.8, 4.2], ref: 'the oldest gag in physical comedy, and the only pure platforming scene' },
  { key: 'roofs', name: 'DO NOT LOOK DOWN', jp: '屋上', blurb: 'MIND THE GAP', build: buildRooftops, time: [5.6, 4.8, 4.2], ref: 'his own foam finger, turned into level geometry' }
];

export const SCENE_BY_KEY = Object.fromEntries(SCENES.map(s => [s.key, s]));

export function buildScene(key, bounds, tier) {
  const def = SCENE_BY_KEY[key] ?? SCENES[0];
  const colliders = [];
  const built = def.build(bounds, colliders, clamp(tier, 0, 2));
  return { def, colliders, ...built, time: def.time[clamp(tier, 0, 2)] };
}
