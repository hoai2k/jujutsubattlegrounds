// FINISHERS — THE CAMERA
// ===========================================================================
// A shot vocabulary, not a shot list. Each entry is a factory returning a
// per-frame function `(ctx, u) => {pos, look, fov}` where `u` runs 0..1 across
// the ACTION that owns it — so every shot is a move, and a finisher is a
// sequence of hard cuts between moving cameras, one cut per exchange. None of
// them is the gameplay camera.
//
// EVERYTHING SCALES. `ctx.s` is the average proportion of the two bodies in
// frame (1 for two humans, 1.5 for a human standing over Mahoraga) and every
// distance and height below is expressed in it — which is what stops a shot
// composed on two 1.8 m fighters from framing a giant's knee.
//
// THE STAGE FRAME is rebuilt every frame from the two bodies (index.js
// _camCtx), so coverage composed on "between them" stays composed while they
// move around each other:
//   ctx.origin  midpoint of the two fighters, on the floor
//   ctx.fwd     unit vector from the WINNER toward the LOSER
//   ctx.right   the horizontal perpendicular
//   ctx.deck    floor height
//   ctx.bone(f, name)  world position of a bone, for aiming at faces and fists
//
// Distances here were all calibrated against captures — the first pass was
// composed on paper and framed roughly a third too tight everywhere.
// ===========================================================================
import * as THREE from 'three';
import { smoothstep, clamp } from '../core/math.js';

const _p = new THREE.Vector3();
const _l = new THREE.Vector3();

const at = (pos, look, fov) => ({ pos, look, fov });
const ease = u => smoothstep(clamp(u, 0, 1));

// A point in the stage frame: `f` metres along fwd from the midpoint, `r`
// along right, `y` above the deck — all scaled by the bodies in frame.
function P(ctx, f, r, y) {
  const k = ctx.s;
  return _p.copy(ctx.origin)
    .addScaledVector(ctx.fwd, f * k)
    .addScaledVector(ctx.right, r * k)
    .setY(ctx.deck + y * k).clone();
}

// ---------------------------------------------------------------------------
// THE VOCABULARY
// ---------------------------------------------------------------------------

// WIDE, LOW, THREE-QUARTER. The establishing lens, and the one that survives a
// wrecked arena: the eye sits under a metre and a half, so the frame is floor,
// two bodies and sky rather than floor, two bodies and a collapsed building.
export function wide({ d = 4.8, side = 1, y = 0.68, fov = 45, push = 1.0, rise = 0.1 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const dist = d - push * k;
    return at(
      P(ctx, -dist * 0.42, side * dist * 0.86, y + rise * k),
      P(ctx, 0.1, 0, 0.95 + 0.1 * k),
      fov);
  };
}

// The workhorse of a fight scene: a medium two-shot, slightly off the line,
// close enough to read a face and wide enough to hold both bodies.
export function two({ d = 3.6, side = 1, y = 1.05, fov = 44, push = 0.5, drift = 0 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const dist = d - push * k;
    return at(
      P(ctx, -dist * 0.5, side * dist * 0.92 + drift * k, y),
      P(ctx, 0, 0, 1.15),
      fov);
  };
}

// GROUND LEVEL, LOOKING UP. Everything in frame is taller than the lens — the
// cheapest way there is to make a body look dangerous, and the only way a
// 3.6 m opponent reads as 3.6 m.
export function groundUp({ d = 3.4, side = -1, fov = 46, aim = 1.5, push = 0.7 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const dist = d - push * k;
    return at(
      P(ctx, -dist * 0.78, side * dist * 1.12, 0.30),
      P(ctx, 0.1, 0, aim + 0.35 * k),
      fov);
  };
}

// CLOSE-UP on a bone — a face, a fist, a blade. Tracks the bone itself, so it
// stays framed on a body of any size and any proportion.
export function closeOn(who, boneName, { d = 1.15, side = 0.5, y = 0.06, fov = 34, push = 0.16, lead = 0 } = {}) {
  // A bone sits at the BASE of the part it drives — the Head bone is the top of
  // the neck, so aiming straight at it centres the frame on a chin and puts the
  // skull out of shot. Faces get looked at slightly above their bone.
  const aimUp = boneName === 'Head' ? 0.13 : boneName === 'Chest' ? 0.06 : 0;
  return (ctx, u) => {
    const k = ease(u);
    const f = who === 'lose' ? ctx.lose : ctx.win;
    const target = ctx.bone(f, boneName);
    const dir = who === 'lose' ? -1 : 1;   // stand in front of whoever it is
    const dist = (d - push * k) * ctx.s * 1.2;
    const look = target.clone().setY(target.y + aimUp * ctx.s);
    // WELL OFF THE FIGHT LINE. Now that the two of them exchange at eight tenths
    // of a metre, a close-up placed straight in front of a face is placed inside
    // the other fighter's head — so the lateral offset is nearly the whole
    // throw, and the shot looks PAST the opponent's shoulder instead of through
    // their skull.
    return at(
      _p.copy(target)
        .addScaledVector(ctx.fwd, dir * dist * 0.55)
        .addScaledVector(ctx.right, side * dist * 1.05)
        .setY(target.y + (y + aimUp + lead * k) * ctx.s).clone(),
      look,
      fov);
  };
}

// OVER THE SHOULDER — the classic exchange coverage. BEHIND the near shoulder
// and only a little off its axis: too far to the side and "over the shoulder"
// becomes "past the hip".
export function ots({ from = 'lose', d = 2.2, side = 0.9, y = 1.45, fov = 42, push = 0.35 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const near = from === 'lose' ? ctx.lose : ctx.win;
    const far = from === 'lose' ? ctx.win : ctx.lose;
    const dir = from === 'lose' ? 1 : -1;
    const dist = (d - push * k) * ctx.s;
    return at(
      _p.copy(near.pos)
        .addScaledVector(ctx.fwd, dir * dist * 0.78)
        .addScaledVector(ctx.right, side * dist * 0.40)
        .setY(ctx.deck + (y + 0.10 * k) * ctx.s).clone(),
      _l.copy(far.pos).setY(ctx.deck + 1.34 * ctx.s).clone(),
      fov);
  };
}

// A LATERAL DOLLY across the fight line — the two bodies pass each other in
// frame and the parallax does the work.
export function dolly({ d = 3.4, from = -1.0, to = 0.5, y = 1.15, fov = 43, aim = 1.2 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const r = from + (to - from) * k;
    return at(
      P(ctx, -d * 0.68, r * d * 0.9, y),
      P(ctx, 0, r * 0.18, aim),
      fov);
  };
}

// A CRANE that drops to the deck and tilts up past where the eye expects it to
// stop. For the finishes that go UP — a launch, a summon, a beam.
export function crane({ d = 5.0, side = 0.8, fov = 44, top = 4.2 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    return at(
      P(ctx, -d * (0.7 + 0.18 * k), side * d * 0.5, 1.5 - 1.15 * k),
      P(ctx, 0.2, 0, 0.9 + k * k * top),
      fov + k * 6);
  };
}

// THE IMPACT PUSH. A hard shove toward the contact on the beat it lands. The
// push is deliberately SHORT — a long one ends inside the winner's face with
// the loser hidden behind his shoulder.
export function impact({ d = 2.6, side = -0.55, y = 1.25, fov = 52, punch = 0.5 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const dist = (d - punch * k) * 1.25;
    return at(
      P(ctx, -dist * 0.40, side * dist * 1.30, y - 0.10 * k),
      P(ctx, 0.10, 0, 1.15),
      fov - k * 5);
  };
}

// THE HERO SHOT. A slow low orbit around the winner with the body in the
// bottom of frame.
export function hero({ d = 4.2, from = 0.55, sweep = 0.5, y = 0.62, fov = 42 } = {}) {
  return (ctx, u) => {
    const k = ease(u);
    const a = from + sweep * k;
    const c = Math.cos(a), s = Math.sin(a);
    return at(
      _p.copy(ctx.win.pos)
        .addScaledVector(ctx.fwd, -c * d * ctx.s)
        .addScaledVector(ctx.right, s * d * ctx.s)
        .setY(ctx.deck + (y + 0.3 * k) * ctx.s).clone(),
      _l.copy(ctx.win.pos).setY(ctx.deck + (1.1 + 0.1 * k) * ctx.s).clone(),
      fov);
  };
}

// ---------------------------------------------------------------------------
// READY-MADE COVERAGE. The registry reads as a shot list rather than as a pile
// of numbers, and every finisher is cut from the same lens set — which is what
// makes twenty-six of them feel like one show.
// ---------------------------------------------------------------------------
export const S = {
  // establishing / breathing room
  wide: (o) => wide(o),
  wideL: () => wide({ d: 5.0, side: -1, y: 0.66 }),
  wideR: () => wide({ d: 5.0, side: 1, y: 0.66 }),
  // the standard exchange two-shot, left and right of the line
  midL: () => two({ d: 3.6, side: -1, push: 0.45 }),
  midR: () => two({ d: 3.6, side: 1, push: 0.45 }),
  // low and up — power, and the only lens that reads a giant
  lowL: (aim) => groundUp({ d: 3.6, side: -1, aim: aim ?? 1.45 }),
  lowR: (aim) => groundUp({ d: 3.6, side: 1, aim: aim ?? 1.45 }),
  // over each shoulder
  otsWin: () => ots({ from: 'win', d: 2.3, side: -0.9 }),
  otsLose: () => ots({ from: 'lose', d: 2.3, side: 0.9 }),
  // faces
  faceWin: (o) => closeOn('win', 'Head', { d: 1.2, side: 0.55, fov: 35, ...o }),
  faceLose: (o) => closeOn('lose', 'Head', { d: 1.2, side: -0.5, fov: 35, ...o }),
  handWin: (o) => closeOn('win', 'HandR', { d: 1.05, side: 0.5, fov: 36, ...o }),
  // impacts
  hitL: () => impact({ d: 2.7, side: -0.6 }),
  hitR: () => impact({ d: 2.7, side: 0.6 }),
  bigHit: () => impact({ d: 3.0, side: -0.5, y: 1.35, fov: 54, punch: 0.7 }),
  // movement
  dollyL: () => dolly({ from: -1.0, to: 0.4 }),
  dollyR: () => dolly({ from: 1.0, to: -0.4 }),
  crane: (o) => crane(o),
  hero: (o) => hero(o)
};

// The lens an action gets when it names none.
export const DEFAULT_SHOTS = { mid: two({ d: 3.8, side: 1 }) };
