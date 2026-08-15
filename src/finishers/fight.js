// FINISHERS — THE FIGHT VOCABULARY
// ===========================================================================
// The first pass of this feature staged two bodies a metre and a half apart
// and played a technique clip on one of them. Nothing ever connected, because
// nothing was ever AIMED: a 0.2 s gameplay jab thrown at a fixed mark is a
// hand moving in the air next to somebody. This file is the fix.
//
// Every entry here is a real strike, block or reaction, authored the way the
// project authors its combat clips (anticipation → impact → a held frame →
// follow-through, easing on the destination key), and every offensive one
// carries CONTACT METADATA:
//
//   contact: { bone, at, aim, reach, power, kind }
//     bone   which bone actually lands — HandR for a cross, FootR for a
//            roundhouse, ShinR for a knee (the shin's origin IS the knee)
//     at     seconds into the clip when it lands
//     aim    where on the victim: 'head' | 'chin' | 'chest' | 'gut' | 'guard'
//     reach  metres to stop short, so a fist arrives ON a face and not inside
//     power  drives hitstop, screen shake, and how far the victim is moved
//     kind   'punch' | 'kick' | 'blade' | 'blast' | 'grab' — picks the sound
//
// The director samples the striking bone at `at` (retarget.js strikeOffset)
// and places the attacker so that the bone lands exactly on the target point.
// That single change is the difference between the two of them posing and the
// two of them fighting: the fist arrives at the face, the reaction fires on
// the frame it arrives, and the body it hits is moved by it.
//
// SHARED, on purpose. Twenty-six finishers are choreographed out of this one
// vocabulary plus a per-character signature — which is how fight scenes are
// actually built, and it means a new finisher is a list of moves rather than a
// new pile of animation.
//
// Conventions (art/anim/base.js): character faces +Z; on a hanging limb rx<0
// swings it forward/up; rz>0 abducts LEFT, rz<0 abducts RIGHT; spine/head rx>0
// leans forward; HandL/R ry is wrist pronation (~±90 vertical fist, ~±170
// knuckles-up); Hips_pos is metres and gets scaled to the body.
// ===========================================================================

const K = (t, pose, e) => ({ t, pose, e });

// ---------------------------------------------------------------------------
// SHARED POSES. Named so the whole library agrees on what a guard is, which is
// what lets any move cut to any other move without a pop.
// ---------------------------------------------------------------------------
const GUARD = {
  UpArmL: [-80, 26, 8], LoArmL: [-120, 30, 0], HandL: [-20, 96, 0],
  UpArmR: [-72, -22, -10], LoArmR: [-126, -28, 0], HandR: [-20, -96, 0],
  Hips: [0, 30, 0], Spine: [6, -10, 0], Chest: [4, -16, 0], Head: [4, -12, 0],
  Hips_pos: [0, -0.10, 0],
  ThighL: [-30, -4, 0], ShinL: [24, 0, 0], FootL: [-4, -10, 0],
  ThighR: [22, 6, 0], ShinR: [40, 0, 0], FootR: [12, 8, 0]
};

// the settled floor pose — identical to base.js `ko`, so a finisher and an
// ordinary knockout leave the body in the same shape
const SETTLED = {
  Hips: [-86, 2, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-4, 0, 0], Chest: [-2, 0, 0],
  Neck: [0, 0, 0], Head: [-6, 14, 0],
  ThighL: [72, -6, 4], ShinL: [10, 0, 0], FootL: [0, -8, 0],
  ThighR: [80, 8, -4], ShinR: [16, 0, 0], FootR: [0, 8, 0],
  UpArmL: [-46, 0, 78], LoArmL: [-8, 0, 6], HandL: [0, 0, 0],
  UpArmR: [-16, 0, -80], LoArmR: [-6, 0, -6], HandR: [0, 0, 0]
};

// =========================================================================
// OFFENSE — the strikes. Used by BOTH fighters: the loser throws these too,
// which is what makes the exchange two-sided.
// =========================================================================
export const MOVES = {

  // ---- HANDS -------------------------------------------------------------
  // Lead jab. Short, fast, and it is a RANGE FINDER — most exchanges here open
  // with one because that is how a fight opens.
  fJab: {
    dur: 0.46, contact: { bone: 'HandL', at: 0.17, aim: 'head', reach: 0.09, power: 0.5, kind: 'punch', blade: 30 },
    keys: [
      K(0, GUARD),
      K(0.09, { ...GUARD, Hips: [0, 40, 0], Chest: [2, -24, 0], Spine: [4, -14, 0], Hips_pos: [0, -0.12, -0.03], UpArmL: [-52, 16, 12], LoArmL: [-104, 8, 0] }, 'in'),
      K(0.17, {
        Hips: [0, 12, 0], Spine: [5, 8, 0], Chest: [4, 12, 0], Head: [2, -6, 0], Hips_pos: [0, -0.11, 0.06],
        UpArmL: [-88, -8, -4], LoArmL: [-4, 0, 0], HandL: [-4, 104, 0],
        UpArmR: [-70, -24, -12], LoArmR: [-124, -30, 0], HandR: [-20, -96, 0],
        ThighL: [-40, -4, 0], ShinL: [26, 0, 0], ThighR: [26, 6, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      K(0.24, { Hips: [0, 12, 0], Chest: [4, 12, 0], Hips_pos: [0, -0.11, 0.06], UpArmL: [-88, -8, -4], LoArmL: [-6, 0, 0], HandL: [-4, 104, 0], UpArmR: [-70, -24, -12], LoArmR: [-124, -30, 0] }, 'hold'),
      K(0.46, GUARD, 'out')
    ]
  },

  // Rear cross. The whole body turns over it — hips first, then the shoulder.
  fCross: {
    dur: 0.58, contact: { bone: 'HandR', at: 0.22, aim: 'head', reach: 0.09, power: 1.0, kind: 'punch' },
    keys: [
      K(0, GUARD),
      K(0.11, { ...GUARD, Hips: [0, 50, 0], Chest: [2, -30, 0], Spine: [4, -18, 0], Head: [4, -20, 0], Hips_pos: [0, -0.14, -0.05], UpArmR: [-40, -26, -20], LoArmR: [-118, -10, 0], HandR: [-18, -86, 0] }, 'in'),
      K(0.22, {
        Hips: [0, -6, 0], Spine: [6, 16, 0], Chest: [6, 26, 0], Head: [2, 6, 0], Neck: [0, 4, 0], Hips_pos: [0, -0.13, 0.10],
        UpArmR: [-90, 8, 2], LoArmR: [-2, 0, 0], HandR: [-4, -170, 0],
        UpArmL: [-38, 14, 16], LoArmL: [-100, 6, 0], HandL: [-20, 80, 0],
        ThighL: [-46, -4, 0], ShinL: [24, 0, 0], FootL: [-8, -10, 0],
        ThighR: [30, 6, 0], ShinR: [54, 0, 0], FootR: [18, 8, 0]
      }, 'snap'),
      K(0.30, { Hips: [0, -6, 0], Chest: [6, 26, 0], Hips_pos: [0, -0.13, 0.10], UpArmR: [-88, 8, 2], LoArmR: [-6, 0, 0], HandR: [-4, -170, 0], UpArmL: [-38, 14, 16], LoArmL: [-100, 6, 0], ThighL: [-46, -4, 0], ShinL: [24, 0, 0] }, 'hold'),
      K(0.58, GUARD, 'out')
    ]
  },

  // Lead hook. Elbow up, shoulder through it, and it turns the head.
  fHook: {
    dur: 0.60, contact: { bone: 'HandL', at: 0.23, aim: 'head', reach: 0.10, power: 1.1, kind: 'punch', blade: 40 },
    keys: [
      K(0, GUARD),
      K(0.11, { ...GUARD, Hips: [0, 54, 0], Chest: [-4, -32, 0], Spine: [-2, -18, 0], Hips_pos: [0, -0.13, -0.04], UpArmL: [-84, 34, 24], LoArmL: [-96, 22, 0] }, 'in'),
      K(0.23, {
        Hips: [2, -22, 0], Spine: [8, 20, 0], Chest: [8, 30, 0], Head: [4, 14, 0], Hips_pos: [0, -0.14, 0.06],
        UpArmL: [-76, -16, 34], LoArmL: [-36, 0, 6], HandL: [-12, 112, 0],
        UpArmR: [-58, -20, -14], LoArmR: [-116, -26, 0], HandR: [-20, -92, 0],
        ThighL: [-48, -6, 0], ShinL: [30, 0, 0], ThighR: [28, 8, 0], ShinR: [52, 0, 0]
      }, 'snap'),
      K(0.31, { Hips: [2, -22, 0], Chest: [8, 30, 0], Hips_pos: [0, -0.14, 0.06], UpArmL: [-74, -16, 32], LoArmL: [-38, 0, 6], UpArmR: [-58, -20, -14], ThighL: [-48, -6, 0], ShinL: [30, 0, 0] }, 'hold'),
      K(0.60, GUARD, 'out')
    ]
  },

  // Uppercut. Drops, then drives up off the back leg — the launcher.
  fUpper: {
    dur: 0.66, contact: { bone: 'HandR', at: 0.178, aim: 'chin', reach: 0.10, power: 1.3, kind: 'punch' },
    keys: [
      K(0, GUARD),
      K(0.13, { ...GUARD, Hips: [6, 46, 0], Spine: [16, -18, 0], Chest: [14, -28, 0], Head: [10, -18, 0], Hips_pos: [0, -0.24, -0.04], UpArmR: [16, -14, -24], LoArmR: [-96, 0, -6], ThighL: [-40, -4, 0], ShinL: [40, 0, 0], ThighR: [30, 6, 0], ShinR: [56, 0, 0] }, 'in'),
      K(0.26, {
        Hips: [-8, 6, 0], Spine: [-10, 10, 0], Chest: [-12, 18, 0], Head: [-14, 2, 0], Neck: [-6, 0, 0], Hips_pos: [0, 0.03, 0.06],
        UpArmR: [-122, 10, 6], LoArmR: [-44, 0, 0], HandR: [-18, 0, 0],
        UpArmL: [-34, 12, 20], LoArmL: [-92, 4, 0], HandL: [-20, 70, 0],
        ThighL: [-16, -4, 0], ShinL: [12, 0, 0], ThighR: [6, 6, 0], ShinR: [18, 0, 0], FootR: [24, 8, 0]
      }, 'snap'),
      K(0.34, { Hips: [-8, 6, 0], Chest: [-12, 18, 0], Hips_pos: [0, 0.03, 0.06], UpArmR: [-124, 10, 6], LoArmR: [-46, 0, 0], UpArmL: [-34, 12, 20], ThighL: [-16, -4, 0], ShinL: [12, 0, 0] }, 'hold'),
      K(0.66, GUARD, 'out')
    ]
  },

  // Hook to the body. Bends the knees, digs in under the ribs.
  fBodyRip: {
    dur: 0.58, contact: { bone: 'HandR', at: 0.22, aim: 'gut', reach: 0.10, power: 0.9, kind: 'punch' },
    keys: [
      K(0, GUARD),
      K(0.10, { ...GUARD, Hips: [10, 48, 0], Spine: [18, -18, 0], Chest: [14, -26, 0], Hips_pos: [0, -0.22, -0.03], UpArmR: [-30, -26, -22], LoArmR: [-112, -6, 0] }, 'in'),
      K(0.22, {
        Hips: [12, -4, 0], Spine: [14, 14, 0], Chest: [12, 22, 0], Head: [10, 6, 0], Hips_pos: [0, -0.16, 0.08],
        UpArmR: [-96, 6, -6], LoArmR: [-22, 0, 0], HandR: [-8, -150, 0],
        UpArmL: [-46, 14, 18], LoArmL: [-104, 8, 0],
        ThighL: [-52, -4, 0], ShinL: [42, 0, 0], ThighR: [32, 6, 0], ShinR: [60, 0, 0]
      }, 'snap'),
      K(0.30, { Hips: [12, -4, 0], Chest: [12, 22, 0], Hips_pos: [0, -0.16, 0.08], UpArmR: [-94, 6, -6], LoArmR: [-24, 0, 0], ThighL: [-52, -4, 0], ShinL: [42, 0, 0] }, 'hold'),
      K(0.58, GUARD, 'out')
    ]
  },

  // Spinning back elbow. Turns his back on them and comes round with it.
  fElbow: {
    dur: 0.70, contact: { bone: 'LoArmR', at: 0.30, aim: 'head', reach: 0.10, power: 1.2, kind: 'punch', blade: 45 },
    keys: [
      K(0, GUARD),
      K(0.14, { Hips: [0, 130, 0], Chest: [-4, 30, 0], Spine: [-2, 20, 0], Head: [-2, 60, 0], Hips_pos: [0, -0.12, -0.02], UpArmL: [-46, 30, 24], LoArmL: [-92, 10, 0], UpArmR: [-40, -26, -26], LoArmR: [-96, -8, 0], ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [24, 6, 0], ShinR: [44, 0, 0] }, 'in'),
      K(0.30, {
        Hips: [0, 26, 0], Spine: [6, 14, 0], Chest: [6, 22, 0], Head: [4, -8, 0], Hips_pos: [0, -0.14, 0.08],
        UpArmR: [-86, 18, -14], LoArmR: [-108, 0, -4], HandR: [-20, -70, 0],
        UpArmL: [-30, 14, 18], LoArmL: [-98, 6, 0],
        ThighL: [-44, -4, 0], ShinL: [28, 0, 0], ThighR: [28, 6, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(0.38, { Hips: [0, 26, 0], Chest: [6, 22, 0], Hips_pos: [0, -0.14, 0.08], UpArmR: [-84, 18, -14], LoArmR: [-110, 0, -4], ThighL: [-44, -4, 0], ShinL: [28, 0, 0] }, 'hold'),
      K(0.70, GUARD, 'out')
    ]
  },

  // Knee to the body. The contact bone is the SHIN, whose origin is the knee.
  fKnee: {
    dur: 0.62, contact: { bone: 'ShinR', at: 0.24, aim: 'gut', reach: 0.12, power: 1.2, kind: 'kick' },
    keys: [
      K(0, GUARD),
      K(0.12, { ...GUARD, Hips: [-6, 34, 0], Spine: [-8, -12, 0], Chest: [-10, -18, 0], Hips_pos: [0, -0.06, -0.06], ThighR: [-20, 8, 0], ShinR: [56, 0, 0], UpArmL: [-70, 30, 14], UpArmR: [-64, -26, -16] }, 'in'),
      K(0.24, {
        Hips: [16, 10, 0], Spine: [20, -4, 0], Chest: [16, -6, 0], Head: [14, -4, 0], Hips_pos: [0, -0.02, 0.06],
        ThighR: [-118, 10, 0], ShinR: [86, 0, 0], FootR: [-20, 8, 0],
        ThighL: [-14, -4, 0], ShinL: [16, 0, 0],
        UpArmL: [-52, 20, 34], LoArmL: [-60, 0, 6], HandL: [-16, 60, 0],
        UpArmR: [-46, -18, -36], LoArmR: [-56, 0, -6], HandR: [-16, -60, 0]
      }, 'snap'),
      K(0.32, { Hips: [16, 10, 0], Hips_pos: [0, -0.02, 0.06], ThighR: [-116, 10, 0], ShinR: [88, 0, 0], Spine: [20, -4, 0], UpArmL: [-52, 20, 34], UpArmR: [-46, -18, -36] }, 'hold'),
      K(0.62, GUARD, 'out')
    ]
  },

  // Roundhouse to the head. The shin travels, the hip turns all the way over.
  fRound: {
    dur: 0.76, contact: { bone: 'FootR', at: 0.30, aim: 'head', reach: 0.14, power: 1.4, kind: 'kick', blade: 55 },
    keys: [
      K(0, GUARD),
      K(0.14, { ...GUARD, Hips: [0, 62, 0], Chest: [-6, -34, 0], Spine: [-4, -20, 0], Hips_pos: [0, -0.14, -0.06], ThighR: [-42, 14, 0], ShinR: [96, 0, 0], UpArmL: [-60, 28, 18], UpArmR: [-40, -22, -30] }, 'in'),
      K(0.30, {
        Hips: [-4, -34, 0], Spine: [-16, 22, 0], Chest: [-16, 30, 0], Head: [-8, 16, 0], Hips_pos: [0, -0.02, 0.04],
        ThighR: [-128, 40, -26], ShinR: [4, 0, 0], FootR: [-24, 10, 0],
        ThighL: [10, -8, 0], ShinL: [16, 0, 0], FootL: [10, -10, 0],
        UpArmL: [-30, 10, 46], LoArmL: [-26, 0, 6], UpArmR: [-24, -8, -50], LoArmR: [-22, 0, -6]
      }, 'snap'),
      K(0.40, { Hips: [-4, -34, 0], Hips_pos: [0, -0.04, 0.04], ThighR: [-126, 40, -26], ShinR: [6, 0, 0], Chest: [-14, 30, 0], Spine: [-14, 22, 0], UpArmL: [-30, 10, 46], UpArmR: [-24, -8, -50] }, 'hold'),
      K(0.76, GUARD, 'out')
    ]
  },

  // Side kick to the chest. Chambered, held a beat, then straight through.
  fSide: {
    dur: 0.74, contact: { bone: 'FootL', at: 0.30, aim: 'chest', reach: 0.14, power: 1.5, kind: 'kick', blade: 85 },
    keys: [
      K(0, GUARD),
      K(0.13, { Hips: [0, 84, 0], Chest: [-8, -30, 0], Spine: [-5, -18, 0], Head: [-6, -34, 0], Hips_pos: [0, -0.08, -0.04], ThighL: [-116, -10, 0], ShinL: [124, 0, 0], FootL: [-10, -14, 0], ThighR: [10, 10, 0], ShinR: [16, 0, 0], UpArmL: [-14, 14, 20], LoArmL: [-44, 0, 6], UpArmR: [-20, -12, -22], LoArmR: [-40, 0, -6] }, 'in'),
      K(0.22, { Hips: [0, 84, 0], Chest: [-8, -30, 0], Head: [-6, -34, 0], Hips_pos: [0, -0.08, -0.04], ThighL: [-118, -10, 0], ShinL: [126, 0, 0], ThighR: [10, 10, 0], ShinR: [16, 0, 0], UpArmL: [-14, 14, 20], UpArmR: [-20, -12, -22] }, 'hold'),
      K(0.30, {
        Hips: [-8, 92, 0], Chest: [-12, -34, 0], Spine: [-8, -20, 0], Head: [-10, -38, 0], Hips_pos: [0, -0.04, 0.12],
        ThighL: [-122, -12, 0], ShinL: [4, 0, 0], FootL: [-28, -16, 0],
        ThighR: [24, 10, 0], ShinR: [32, 0, 0], FootR: [16, 10, 0],
        UpArmL: [10, 16, 44], LoArmL: [-20, 0, 6], UpArmR: [4, -14, -46], LoArmR: [-18, 0, -6]
      }, 'snap'),
      K(0.40, { Hips: [-8, 92, 0], Hips_pos: [0, -0.04, 0.12], ThighL: [-120, -12, 0], ShinL: [6, 0, 0], Chest: [-12, -34, 0], UpArmL: [10, 16, 44], UpArmR: [4, -14, -46] }, 'hold'),
      K(0.74, GUARD, 'out')
    ]
  },

  // Axe kick. Comes down from above the head — the shot that ends people.
  fAxe: {
    dur: 0.80, contact: { bone: 'FootR', at: 0.281, aim: 'head', reach: 0.12, power: 1.6, kind: 'kick' },
    keys: [
      K(0, GUARD),
      K(0.16, { ...GUARD, Hips: [-10, 30, 0], Spine: [-12, -10, 0], Chest: [-14, -16, 0], Hips_pos: [0, -0.10, -0.06], ThighR: [-150, 12, 0], ShinR: [40, 0, 0], ThighL: [-16, -4, 0], ShinL: [14, 0, 0] }, 'in'),
      K(0.24, { Hips: [-16, 26, 0], Spine: [-18, -8, 0], Chest: [-20, -12, 0], Head: [-22, -8, 0], Hips_pos: [0, -0.06, -0.04], ThighR: [-174, 12, 0], ShinR: [16, 0, 0], FootR: [-20, 8, 0], ThighL: [-12, -4, 0], ShinL: [10, 0, 0], UpArmL: [-90, 20, 40], LoArmL: [-40, 0, 6], UpArmR: [-84, -16, -44], LoArmR: [-36, 0, -6] }, 'hold'),
      // IMPACT — the heel is at head height and the leg is still straight.
      K(0.268, {
        Hips: [4, 22, 0], Spine: [6, -6, 0], Chest: [4, -8, 0], Head: [2, -6, 0], Hips_pos: [0, -0.08, 0],
        ThighR: [-132, 10, 0], ShinR: [2, 0, 0], FootR: [-6, 8, 0],
        ThighL: [-20, -4, 0], ShinL: [18, 0, 0],
        UpArmL: [-52, 16, 34], LoArmL: [-40, 0, 6], UpArmR: [-46, -14, -38], LoArmR: [-36, 0, -6]
      }, 'snap'),
      K(0.30, {
        Hips: [6, 22, 0], Spine: [8, -6, 0], Head: [4, -6, 0], Hips_pos: [0, -0.09, 0],
        ThighR: [-128, 10, 0], ShinR: [4, 0, 0], ThighL: [-20, -4, 0], ShinL: [18, 0, 0],
        UpArmL: [-52, 16, 34], UpArmR: [-46, -14, -38]
      }, 'hold'),
      K(0.42, {
        Hips: [26, 20, 0], Spine: [30, -6, 0], Chest: [24, -8, 0], Head: [20, -6, 0], Hips_pos: [0, -0.16, 0.04],
        ThighR: [-56, 10, 0], ShinR: [4, 0, 0], FootR: [22, 8, 0],
        ThighL: [-34, -4, 0], ShinL: [36, 0, 0],
        UpArmL: [-24, 12, 26], LoArmL: [-52, 0, 6], UpArmR: [-20, -10, -28], LoArmR: [-48, 0, -6]
      }, 'snap'),
      K(0.52, { Hips: [26, 20, 0], Hips_pos: [0, -0.16, 0.04], ThighR: [-54, 10, 0], ShinR: [6, 0, 0], Spine: [30, -6, 0], UpArmL: [-24, 12, 26], UpArmR: [-20, -10, -28] }, 'hold'),
      K(0.80, GUARD, 'out')
    ]
  },

  // Open palm, both hands, to the chest. The "and stay down" shot.
  fPalm: {
    dur: 0.68, contact: { bone: 'HandR', at: 0.26, aim: 'chest', reach: 0.10, power: 1.6, kind: 'punch' },
    keys: [
      K(0, GUARD),
      K(0.14, { ...GUARD, Hips: [4, 44, 0], Spine: [10, -20, 0], Chest: [8, -30, 0], Hips_pos: [0, -0.20, -0.08], UpArmL: [-56, 30, 16], LoArmL: [-118, 26, 0], HandL: [-70, 60, 0], UpArmR: [-50, -28, -18], LoArmR: [-122, -24, 0], HandR: [-70, -60, 0] }, 'in'),
      K(0.26, {
        Hips: [0, 6, 0], Spine: [4, 4, 0], Chest: [2, 8, 0], Head: [0, 0, 0], Hips_pos: [0, -0.14, 0.12],
        UpArmL: [-74, -2, 6], LoArmL: [-10, 0, 4], HandL: [-84, 30, 0],
        UpArmR: [-74, 2, -6], LoArmR: [-10, 0, -4], HandR: [-84, -30, 0],
        ThighL: [-50, -4, 0], ShinL: [30, 0, 0], ThighR: [32, 6, 0], ShinR: [56, 0, 0]
      }, 'snap'),
      K(0.36, { Hips: [0, 6, 0], Hips_pos: [0, -0.14, 0.12], UpArmL: [-72, -2, 6], UpArmR: [-72, 2, -6], LoArmL: [-12, 0, 4], LoArmR: [-12, 0, -4], ThighL: [-50, -4, 0], ShinL: [30, 0, 0] }, 'hold'),
      K(0.68, GUARD, 'out')
    ]
  },

  // A straight thrust — a blade, a spear, a straightened arm. Long reach.
  fThrust: {
    dur: 0.66, contact: { bone: 'HandR', at: 0.24, aim: 'chest', reach: 0.34, power: 1.5, kind: 'blade' },
    keys: [
      K(0, GUARD),
      K(0.12, { Hips: [0, 58, 0], Chest: [-2, -34, 0], Spine: [0, -20, 0], Head: [0, -22, 0], Hips_pos: [0, -0.14, -0.08], UpArmR: [-46, -30, -14], LoArmR: [-118, -12, 0], HandR: [-10, -70, 0], UpArmL: [-40, 24, 14], LoArmL: [-100, 14, 0], ThighL: [-24, -4, 0], ShinL: [20, 0, 0], ThighR: [18, 6, 0], ShinR: [34, 0, 0] }, 'in'),
      K(0.24, {
        Hips: [0, 4, 0], Spine: [8, 12, 0], Chest: [6, 18, 0], Head: [4, 2, 0], Hips_pos: [0, -0.16, 0.16],
        UpArmR: [-92, 6, 0], LoArmR: [0, 0, 0], HandR: [-6, -100, 0],
        UpArmL: [-34, 16, 20], LoArmL: [-88, 8, 0],
        ThighL: [-56, -4, 0], ShinL: [26, 0, 0], FootL: [-10, -10, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.36, { Hips: [0, 4, 0], Hips_pos: [0, -0.16, 0.16], UpArmR: [-90, 6, 0], LoArmR: [-2, 0, 0], HandR: [-6, -100, 0], Chest: [6, 18, 0], ThighL: [-56, -4, 0], ShinL: [26, 0, 0] }, 'hold'),
      K(0.66, GUARD, 'out')
    ]
  },

  // A horizontal cut, both hands — a blunt sword, a cleaver, a club arm.
  fCleave: {
    dur: 0.78, contact: { bone: 'HandR', at: 0.308, aim: 'chest', reach: 0.42, power: 1.7, kind: 'blade' },
    keys: [
      K(0, GUARD),
      K(0.15, { Hips: [0, 70, 0], Chest: [-8, -38, 0], Spine: [-4, -22, 0], Head: [-6, -30, 0], Hips_pos: [0, -0.16, -0.08], UpArmR: [-118, -30, -10], LoArmR: [-70, -14, 0], HandR: [-20, -80, 0], UpArmL: [-96, 40, 8], LoArmL: [-84, 26, 0], HandL: [-20, 80, 0], ThighL: [-22, -4, 0], ShinL: [20, 0, 0], ThighR: [18, 6, 0], ShinR: [36, 0, 0] }, 'in'),
      K(0.30, {
        Hips: [2, -26, 0], Spine: [12, 18, 0], Chest: [10, 26, 0], Head: [6, 10, 0], Hips_pos: [0, -0.20, 0.10],
        UpArmR: [-84, 24, -6], LoArmR: [-16, 0, -2], HandR: [-16, -120, 0],
        UpArmL: [-78, -12, 16], LoArmL: [-22, 0, 4], HandL: [-16, 100, 0],
        ThighL: [-54, -4, 0], ShinL: [34, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.315, {
        Hips: [2, -26, 0], Hips_pos: [0, -0.20, 0.10], Spine: [12, 18, 0], Chest: [10, 26, 0], Head: [6, 10, 0],
        UpArmR: [-84, 24, -6], LoArmR: [-16, 0, -2], HandR: [-16, -120, 0],
        UpArmL: [-78, -12, 16], LoArmL: [-22, 0, 4], HandL: [-16, 100, 0],
        ThighL: [-54, -4, 0], ShinL: [34, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'hold'),
      K(0.46, { Hips: [2, -30, 0], Hips_pos: [0, -0.20, 0.10], UpArmR: [-80, 26, -6], UpArmL: [-74, -14, 16], Chest: [10, 28, 0], ThighL: [-54, -4, 0], ShinL: [34, 0, 0] }, 'hold'),
      K(0.78, GUARD, 'out')
    ]
  },

  // Both hands, straight down, through the top of them. Executions and slams.
  fOverhead: {
    dur: 0.82, contact: { bone: 'HandR', at: 0.285, aim: 'head', reach: 0.30, power: 1.8, kind: 'blade' },
    keys: [
      K(0, GUARD),
      K(0.16, { Hips: [-14, 22, 0], Spine: [-18, -8, 0], Chest: [-20, -12, 0], Neck: [-8, 0, 0], Head: [-24, -6, 0], Hips_pos: [0, -0.08, -0.08], UpArmR: [-172, -8, -12], LoArmR: [-44, 0, -4], HandR: [-24, -60, 0], UpArmL: [-166, 10, 14], LoArmL: [-48, 0, 4], HandL: [-24, 60, 0], ThighL: [-18, -4, 0], ShinL: [16, 0, 0], ThighR: [14, 6, 0], ShinR: [26, 0, 0] }, 'in'),
      K(0.24, { Hips: [-16, 22, 0], Spine: [-20, -8, 0], Head: [-26, -6, 0], Hips_pos: [0, -0.06, -0.08], UpArmR: [-176, -8, -12], UpArmL: [-170, 10, 14], LoArmR: [-42, 0, -4], LoArmL: [-46, 0, 4], ThighL: [-18, -4, 0], ShinL: [16, 0, 0] }, 'hold'),
      // IMPACT — the blade is through the top of them and the hands are still
      // at head height. Held for two frames: this is the frame that lands.
      K(0.272, {
        Hips: [8, 18, 0], Spine: [14, -4, 0], Chest: [10, -6, 0], Neck: [2, 0, 0], Head: [6, -4, 0], Hips_pos: [0, -0.12, 0.06],
        UpArmR: [-116, -2, -10], LoArmR: [-22, 0, -2], HandR: [-28, -80, 0],
        UpArmL: [-112, 4, 12], LoArmL: [-24, 0, 2], HandL: [-28, 80, 0],
        ThighL: [-40, -4, 0], ShinL: [34, 0, 0], ThighR: [26, 6, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      K(0.30, {
        Hips: [10, 18, 0], Spine: [16, -4, 0], Chest: [12, -6, 0], Head: [8, -4, 0], Hips_pos: [0, -0.13, 0.07],
        UpArmR: [-114, -2, -10], LoArmR: [-24, 0, -2], UpArmL: [-110, 4, 12], LoArmL: [-26, 0, 2],
        ThighL: [-40, -4, 0], ShinL: [34, 0, 0], ThighR: [26, 6, 0], ShinR: [46, 0, 0]
      }, 'hold'),
      K(0.40, {
        Hips: [24, 16, 0], Spine: [30, -4, 0], Chest: [24, -6, 0], Neck: [8, 0, 0], Head: [18, -4, 0], Hips_pos: [0, -0.24, 0.10],
        UpArmR: [-56, 4, -8], LoArmR: [-8, 0, -2], HandR: [-30, -90, 0],
        UpArmL: [-52, -2, 10], LoArmL: [-10, 0, 2], HandL: [-30, 90, 0],
        ThighL: [-52, -4, 0], ShinL: [48, 0, 0], ThighR: [34, 6, 0], ShinR: [62, 0, 0]
      }, 'snap'),
      K(0.50, { Hips: [24, 16, 0], Hips_pos: [0, -0.24, 0.10], UpArmR: [-54, 4, -8], UpArmL: [-50, -2, 10], Spine: [30, -4, 0], ThighL: [-52, -4, 0], ShinL: [48, 0, 0] }, 'hold'),
      K(0.82, GUARD, 'out')
    ]
  },

  // Grab the collar and pull them in. No damage — it sets up what follows.
  fGrab: {
    dur: 0.50, contact: { bone: 'HandL', at: 0.18, aim: 'head', reach: 0.16, power: 0.4, kind: 'grab', blade: 35 },
    keys: [
      K(0, GUARD),
      K(0.09, { ...GUARD, Hips: [0, 44, 0], Hips_pos: [0, -0.13, -0.02], UpArmL: [-64, 22, 10], LoArmL: [-92, 14, 0], HandL: [-30, 70, 0] }, 'in'),
      K(0.18, {
        Hips: [0, 16, 0], Spine: [8, 6, 0], Chest: [6, 10, 0], Head: [6, -4, 0], Hips_pos: [0, -0.14, 0.10],
        UpArmL: [-92, -6, 4], LoArmL: [-14, 0, 2], HandL: [-40, 60, 0],
        UpArmR: [-66, -22, -12], LoArmR: [-120, -26, 0],
        ThighL: [-44, -4, 0], ShinL: [26, 0, 0], ThighR: [28, 6, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(0.30, { Hips: [0, 24, 0], Spine: [2, 6, 0], Hips_pos: [0, -0.16, 0.02], UpArmL: [-76, 4, 8], LoArmL: [-42, 0, 2], HandL: [-40, 60, 0], UpArmR: [-66, -22, -12], ThighL: [-40, -4, 0], ShinL: [30, 0, 0] }, 'out'),
      K(0.50, GUARD, 'out')
    ]
  },

  // ---- DEFENCE ------------------------------------------------------------
  // Knocks the strike off-line with the forearm. Contact on THEIR arm.
  fParry: {
    dur: 0.44,
    keys: [
      K(0, GUARD),
      K(0.10, {
        ...GUARD, Hips: [0, 40, 0], Chest: [2, -22, 0], Head: [2, -18, 0], Hips_pos: [0, -0.13, -0.04],
        UpArmL: [-96, 10, 26], LoArmL: [-64, 30, 0], HandL: [-20, 70, 0]
      }, 'snap'),
      K(0.18, { ...GUARD, Hips: [0, 22, 0], Chest: [2, -10, 0], Hips_pos: [0, -0.12, -0.02], UpArmL: [-88, -6, 34], LoArmL: [-58, 20, 0], HandL: [-16, 60, 0] }, 'out'),
      K(0.44, GUARD, 'out')
    ]
  },

  // Ducks under a head-height swing. The head leaves the line completely.
  fDuck: {
    dur: 0.52,
    keys: [
      K(0, GUARD),
      K(0.12, {
        Hips: [22, 30, 0], Spine: [26, -12, 0], Chest: [22, -18, 0], Neck: [8, -4, 0], Head: [16, -14, 0],
        Hips_pos: [0, -0.34, 0.04],
        ThighL: [-72, -4, 0], ShinL: [76, 0, 0], ThighR: [30, 6, 0], ShinR: [86, 0, 0],
        UpArmL: [-56, 24, 16], LoArmL: [-104, 20, 0], HandL: [-20, 80, 0],
        UpArmR: [-50, -20, -18], LoArmR: [-110, -22, 0], HandR: [-20, -80, 0]
      }, 'snap'),
      K(0.26, { Hips: [24, 26, 0], Spine: [28, -12, 0], Head: [18, -12, 0], Hips_pos: [0, -0.36, 0.02], ThighL: [-74, -4, 0], ShinL: [78, 0, 0], ThighR: [32, 6, 0], ShinR: [88, 0, 0], UpArmL: [-56, 24, 16], UpArmR: [-50, -20, -18] }, 'hold'),
      K(0.52, GUARD, 'out')
    ]
  },

  // Slips the head off-line without moving the feet. For the untouchable ones.
  fSlip: {
    dur: 0.50,
    keys: [
      K(0, GUARD),
      K(0.10, {
        ...GUARD, Hips: [0, 40, 6], Hips_pos: [0.05, -0.12, -0.05], Spine: [4, -14, -8], Chest: [2, -20, -10],
        Neck: [0, -6, -4], Head: [2, -26, -12]
      }, 'snap'),
      K(0.24, { ...GUARD, Hips: [0, 38, 5], Hips_pos: [0.05, -0.12, -0.05], Chest: [2, -20, -10], Head: [2, -24, -11] }, 'hold'),
      K(0.50, GUARD, 'out')
    ]
  },

  // Takes it on the guard. Slides back, arms hold.
  fGuardUp: {
    dur: 0.46,
    keys: [
      K(0, GUARD),
      K(0.08, { ...GUARD, UpArmL: [-92, 30, 6], LoArmL: [-126, 34, 0], UpArmR: [-86, -26, -8], LoArmR: [-130, -32, 0], Head: [8, -10, 0], Chest: [8, -18, 0], Hips_pos: [0, -0.13, -0.02] }, 'snap'),
      K(0.20, { ...GUARD, UpArmL: [-90, 30, 6], LoArmL: [-124, 34, 0], UpArmR: [-84, -26, -8], LoArmR: [-128, -32, 0], Hips_pos: [0, -0.14, -0.06] }, 'hold'),
      K(0.46, GUARD, 'out')
    ]
  },

  // Catches the incoming wrist and holds it. Contact on their hand.
  fCatch: {
    dur: 0.56, contact: { bone: 'HandR', at: 0.16, aim: 'guard', reach: 0.06, power: 0.3, kind: 'grab' },
    keys: [
      K(0, GUARD),
      K(0.16, {
        Hips: [0, 26, 0], Spine: [4, -6, 0], Chest: [2, -10, 0], Head: [2, -8, 0], Hips_pos: [0, -0.12, 0.02],
        UpArmR: [-78, 4, -8], LoArmR: [-30, 0, -2], HandR: [-40, -50, 0],
        UpArmL: [-64, 24, 12], LoArmL: [-116, 26, 0], HandL: [-20, 90, 0],
        ThighL: [-34, -4, 0], ShinL: [26, 0, 0], ThighR: [24, 6, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(0.32, { Hips: [0, 30, 0], Chest: [0, -12, 0], Hips_pos: [0, -0.14, 0], UpArmR: [-72, 8, -10], LoArmR: [-40, 0, -2], HandR: [-40, -50, 0], UpArmL: [-64, 24, 12], ThighL: [-34, -4, 0], ShinL: [26, 0, 0] }, 'hold'),
      K(0.56, GUARD, 'out')
    ]
  },

  // Steps THROUGH them — the blink the fast characters do. No contact.
  fStepThrough: {
    dur: 0.44,
    keys: [
      K(0, GUARD),
      K(0.08, { Hips: [0, 30, 0], Spine: [18, -8, 0], Chest: [12, -12, 0], Head: [8, -10, 0], Hips_pos: [0, -0.16, 0.06], ThighL: [-58, -4, 0], ShinL: [34, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0], UpArmL: [-30, 14, 18], LoArmL: [-70, 6, 0], UpArmR: [-26, -12, -20], LoArmR: [-74, 0, 0] }, 'snap'),
      K(0.22, { Hips: [0, -40, 0], Spine: [10, 10, 0], Chest: [6, 16, 0], Head: [4, 22, 0], Hips_pos: [0, -0.12, 0.02], ThighL: [26, -4, 0], ShinL: [40, 0, 0], ThighR: [-34, 6, 0], ShinR: [24, 0, 0], UpArmL: [-20, 10, 14], UpArmR: [-18, -8, -16] }, 'out'),
      K(0.44, GUARD, 'out')
    ]
  },

  // ---- GIANT OFFENSE ------------------------------------------------------
  // Authored on a 3.6 m body (see FIGHT_GIANT below): both fists straight down
  // through where a person is standing.
  gSmash: {
    dur: 0.90, contact: { bone: 'HandR', at: 0.40, aim: 'head', reach: 0.30, power: 1.8, kind: 'punch' },
    keys: [
      K(0, { UpArmL: [-52, 16, 26], LoArmL: [-92, 0, 6], UpArmR: [-48, -14, -28], LoArmR: [-96, 0, -6], Hips: [0, 18, 0], Spine: [4, -6, 0], Chest: [3, -8, 0] }),
      K(0.22, { Hips: [-10, 16, 0], Hips_pos: [0, 0.04, -0.06], Spine: [-18, -4, 0], Chest: [-16, -6, 0], Neck: [-10, 0, 0], Head: [-26, 0, 0], UpArmL: [-172, 10, 30], LoArmL: [-46, 0, 6], HandL: [-30, 40, 0], UpArmR: [-170, -8, -32], LoArmR: [-48, 0, -6], HandR: [-30, -40, 0], ThighL: [-14, -4, 0], ShinL: [12, 0, 0], ThighR: [10, 6, 0], ShinR: [16, 0, 0] }, 'in'),
      K(0.40, {
        Hips: [24, 12, 0], Hips_pos: [0, -0.28, 0.12], Spine: [32, -4, 0], Chest: [26, -4, 0], Neck: [12, 0, 0], Head: [28, 0, 0],
        UpArmL: [-34, 6, 16], LoArmL: [-20, 0, 6], HandL: [-40, 30, 0],
        UpArmR: [-32, -6, -18], LoArmR: [-22, 0, -6], HandR: [-40, -30, 0],
        ThighL: [-46, -4, 0], ShinL: [40, 0, 0], FootL: [-10, -8, 0], ThighR: [26, 6, 0], ShinR: [54, 0, 0]
      }, 'snap'),
      K(0.54, { Hips: [26, 12, 0], Hips_pos: [0, -0.30, 0.13], Spine: [34, -4, 0], Head: [30, 0, 0], UpArmL: [-32, 6, 16], UpArmR: [-30, -6, -18], ThighL: [-46, -4, 0], ShinL: [40, 0, 0] }, 'hold'),
      K(0.90, { Hips: [10, 16, 0], Hips_pos: [0, -0.14, 0.04], Spine: [16, -6, 0], Chest: [12, -8, 0], Head: [10, -6, 0], UpArmL: [-48, 12, 22], LoArmL: [-60, 0, 6], UpArmR: [-44, -10, -24], LoArmR: [-64, 0, -6], ThighL: [-30, -4, 0], ShinL: [26, 0, 0], ThighR: [20, 6, 0], ShinR: [36, 0, 0] }, 'out')
    ]
  },

  // A straight arm across, at the height of a standing person's head.
  gSweep: {
    dur: 0.86, contact: { bone: 'HandR', at: 0.34, aim: 'head', reach: 0.26, power: 1.6, kind: 'punch' },
    keys: [
      K(0, { UpArmL: [-52, 16, 26], LoArmL: [-92, 0, 6], UpArmR: [-48, -14, -28], LoArmR: [-96, 0, -6], Hips: [0, 18, 0] }),
      K(0.18, { Hips: [0, 62, 0], Hips_pos: [0, -0.10, -0.06], Spine: [6, -26, 0], Chest: [2, -38, 0], Head: [0, -30, 0], UpArmR: [-74, -42, -38], LoArmR: [-106, -20, -6], HandR: [-20, -70, 0], UpArmL: [-40, 20, 24], LoArmL: [-80, 0, 6] }, 'in'),
      K(0.34, {
        Hips: [2, -48, 0], Hips_pos: [0, -0.12, 0.06], Spine: [8, 28, 0], Chest: [6, 42, 0], Head: [4, 26, 0], Neck: [2, 8, 0],
        UpArmR: [-90, 42, -4], LoArmR: [-6, 0, -4], HandR: [-16, -110, 0],
        UpArmL: [-26, 14, 20], LoArmL: [-96, 0, 6],
        ThighL: [-38, -4, 0], ShinL: [34, 0, 0], ThighR: [24, 6, 0], ShinR: [48, 0, 0]
      }, 'snap'),
      K(0.46, { Hips: [2, -48, 0], Hips_pos: [0, -0.12, 0.06], Chest: [6, 42, 0], Head: [4, 26, 0], UpArmR: [-88, 42, -4], UpArmL: [-26, 14, 20], ThighL: [-38, -4, 0], ShinL: [34, 0, 0] }, 'hold'),
      K(0.86, { Hips: [4, -12, 0], Hips_pos: [0, -0.16, 0], Spine: [14, 10, 0], Chest: [12, 16, 0], Head: [8, 4, 0], UpArmL: [-46, 14, 24], LoArmL: [-78, 0, 6], UpArmR: [-56, 14, -22], LoArmR: [-68, 0, -6], ThighL: [-44, -4, 0], ShinL: [42, 0, 0], ThighR: [-16, 6, 0], ShinR: [52, 0, 0] }, 'out')
    ]
  },

  // A backhand that comes down on them from above and to the side.
  gBackhand: {
    dur: 0.84, contact: { bone: 'HandL', at: 0.32, aim: 'chest', reach: 0.28, power: 1.7, kind: 'punch' },
    keys: [
      K(0, { UpArmL: [-52, 16, 26], LoArmL: [-92, 0, 6], UpArmR: [-48, -14, -28], LoArmR: [-96, 0, -6], Hips: [0, 18, 0] }),
      K(0.18, { Hips: [0, -30, 0], Hips_pos: [0, -0.08, -0.04], Spine: [-4, 20, 0], Chest: [-8, 30, 0], Head: [-6, 22, 0], UpArmL: [-158, -16, 44], LoArmL: [-52, 0, 6], HandL: [-24, 50, 0], UpArmR: [-34, -10, -22], LoArmR: [-86, 0, -6] }, 'in'),
      K(0.32, {
        Hips: [8, 44, 0], Hips_pos: [0, -0.18, 0.08], Spine: [16, -22, 0], Chest: [12, -32, 0], Head: [10, -24, 0],
        UpArmL: [-58, 12, 34], LoArmL: [-18, 0, 6], HandL: [-40, 70, 0],
        UpArmR: [-30, -8, -20], LoArmR: [-70, 0, -6],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [22, 6, 0], ShinR: [42, 0, 0]
      }, 'snap'),
      K(0.44, { Hips: [8, 44, 0], Hips_pos: [0, -0.18, 0.08], Chest: [12, -32, 0], UpArmL: [-56, 12, 34], LoArmL: [-20, 0, 6], ThighL: [-34, -4, 0], ShinL: [30, 0, 0] }, 'hold'),
      K(0.84, { Hips: [2, 20, 0], Hips_pos: [0, -0.10, 0.02], Spine: [8, -6, 0], Chest: [6, -8, 0], Head: [4, -6, 0], UpArmL: [-50, 14, 24], LoArmL: [-70, 0, 6], UpArmR: [-46, -12, -26], LoArmR: [-74, 0, -6] }, 'out')
    ]
  }
};

// =========================================================================
// REACTIONS — what being hit looks like. Played on the frame of contact, not
// on a beat boundary, and chosen by what hit you and where.
// =========================================================================
export const REACTIONS = {

  // A punch to the head. The head goes first, the spine follows it, one foot
  // gives ground. Ends back in a guard: they are still in the fight.
  rSnapHead: {
    dur: 0.62, keys: [
      K(0, GUARD),
      K(0.05, {
        Head: [-34, -20, 10], Neck: [-18, -6, 4], Chest: [-24, -16, 0], Spine: [-16, -8, 0],
        Hips: [-6, 24, 0], Hips_pos: [0, -0.07, -0.06],
        UpArmL: [-92, 12, 46], LoArmL: [-24, 0, 6], HandL: [-10, 30, 0],
        UpArmR: [-72, -10, -52], LoArmR: [-18, 0, -6], HandR: [-10, -30, 0],
        ThighL: [-34, -4, 0], ShinL: [26, 0, 0], ThighR: [12, 6, 0], ShinR: [32, 0, 0]
      }, 'snap'),
      K(0.16, { Head: [-28, -16, 8], Chest: [-20, -14, 0], Spine: [-13, -8, 0], Hips_pos: [0, -0.10, -0.14], UpArmL: [-84, 12, 42], UpArmR: [-66, -10, -48], ThighL: [-42, -4, 0], ShinL: [34, 0, 0], ThighR: [18, 6, 0], ShinR: [40, 0, 0] }, 'hold'),
      K(0.38, { Head: [-8, -10, 2], Chest: [-6, -14, 0], Spine: [-2, -8, 0], Hips: [0, 28, 0], Hips_pos: [0, -0.16, -0.10], UpArmL: [-64, 18, 26], LoArmL: [-96, 12, 0], UpArmR: [-56, -16, -28], LoArmR: [-102, -14, 0], ThighL: [-46, -4, 0], ShinL: [40, 0, 0], ThighR: [26, 6, 0], ShinR: [48, 0, 0] }, 'out'),
      K(0.62, GUARD, 'out')
    ]
  },

  // A shot to the body. Folds around it, air goes out, the head drops.
  rFoldGut: {
    dur: 0.66, keys: [
      K(0, GUARD),
      K(0.05, {
        Hips: [22, 26, 0], Hips_pos: [0, -0.20, -0.08], Spine: [30, -6, 0], Chest: [26, -10, 0],
        Neck: [10, 0, 0], Head: [26, -6, 0],
        UpArmL: [-52, 20, 20], LoArmL: [-118, 14, 0], HandL: [-20, 70, 0],
        UpArmR: [-46, -18, -22], LoArmR: [-122, -12, 0], HandR: [-20, -70, 0],
        ThighL: [-52, -4, 0], ShinL: [50, 0, 0], ThighR: [24, 6, 0], ShinR: [56, 0, 0]
      }, 'snap'),
      K(0.22, { Hips: [26, 26, 0], Hips_pos: [0, -0.26, -0.14], Spine: [34, -6, 0], Chest: [28, -10, 0], Head: [30, -6, 0], UpArmL: [-48, 20, 18], UpArmR: [-42, -18, -20], ThighL: [-58, -4, 0], ShinL: [56, 0, 0], ThighR: [28, 6, 0], ShinR: [62, 0, 0] }, 'hold'),
      K(0.44, { Hips: [14, 28, 0], Hips_pos: [0, -0.24, -0.10], Spine: [22, -8, 0], Chest: [18, -12, 0], Head: [18, -8, 0], UpArmL: [-58, 22, 20], LoArmL: [-108, 16, 0], UpArmR: [-52, -20, -22], LoArmR: [-112, -14, 0], ThighL: [-50, -4, 0], ShinL: [46, 0, 0] }, 'out'),
      K(0.66, { ...GUARD, Hips_pos: [0, -0.16, -0.04], Spine: [12, -10, 0], Chest: [10, -16, 0], Head: [10, -12, 0] }, 'out')
    ]
  },

  // A hook. Spun most of the way round, arms trailing, one foot crossing over.
  rSpin: {
    dur: 0.78, keys: [
      K(0, GUARD),
      K(0.06, {
        Hips: [-4, -46, 0], Hips_pos: [0, -0.08, -0.06], Spine: [-10, 34, 0], Chest: [-14, 44, 0],
        Neck: [-8, 14, 0], Head: [-24, 40, -14],
        UpArmL: [-46, 26, 62], LoArmL: [-20, 0, 6], UpArmR: [-104, -10, -34], LoArmR: [-14, 0, -6],
        ThighL: [-28, -4, 0], ShinL: [24, 0, 0], ThighR: [20, 6, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      K(0.24, { Hips: [-6, -96, 0], Hips_pos: [0, -0.14, -0.14], Spine: [-8, 50, 0], Chest: [-10, 56, 0], Head: [-18, 44, -10], UpArmL: [-30, 20, 70], UpArmR: [-118, -6, -26], ThighL: [-46, -4, 0], ShinL: [40, 0, 0], ThighR: [34, 6, 0], ShinR: [56, 0, 0] }, 'out'),
      K(0.50, { Hips: [2, -140, 0], Hips_pos: [0, -0.22, -0.18], Spine: [10, 26, 0], Chest: [8, 30, 0], Head: [4, 10, 0], UpArmL: [-44, 18, 40], LoArmL: [-70, 0, 6], UpArmR: [-70, -8, -34], LoArmR: [-64, 0, -6], ThighL: [-56, -4, 0], ShinL: [56, 0, 0], ThighR: [-24, 6, 0], ShinR: [64, 0, 0] }, 'out'),
      K(0.78, { ...GUARD, Hips: [0, -104, 0], Hips_pos: [0, -0.18, -0.14], Chest: [6, -10, 0], Head: [4, -14, 0] }, 'out')
    ]
  },

  // Launched. Feet leave the floor, the body opens, and it hangs a beat.
  rLaunch: {
    dur: 0.92, keys: [
      K(0, GUARD),
      K(0.05, {
        Hips: [-18, 18, 0], Hips_pos: [0, 0.10, -0.14], Spine: [-36, -4, 0], Chest: [-30, -8, 0],
        Neck: [-18, -2, 0], Head: [-40, -8, 6],
        UpArmL: [-120, 14, 52], LoArmL: [-18, 0, 6], HandL: [-6, 20, 0],
        UpArmR: [-98, -12, -58], LoArmR: [-14, 0, -6], HandR: [-6, -20, 0],
        ThighL: [-72, -6, 0], ShinL: [58, 0, 0], FootL: [-18, -10, 0],
        ThighR: [-42, 8, 0], ShinR: [72, 0, 0], FootR: [-12, 8, 0]
      }, 'snap'),
      K(0.34, { Hips: [-20, 18, 0], Hips_pos: [0, 0.14, -0.22], Spine: [-38, -4, 0], Head: [-42, -8, 6], UpArmL: [-118, 14, 52], UpArmR: [-96, -12, -58], ThighL: [-70, -6, 0], ShinL: [56, 0, 0], ThighR: [-40, 8, 0], ShinR: [70, 0, 0] }, 'hold'),
      K(0.62, { Hips: [-34, 14, 0], Hips_pos: [0, -0.16, -0.34], Spine: [-22, -2, 0], Chest: [-16, -4, 0], Head: [-24, 4, 0], UpArmL: [-88, 6, 62], LoArmL: [-14, 0, 6], UpArmR: [-60, -6, -68], LoArmR: [-10, 0, -6], ThighL: [-20, -6, 0], ShinL: [50, 0, 0], ThighR: [-4, 8, 0], ShinR: [58, 0, 0] }, 'in'),
      K(0.92, { Hips: [-62, 10, 0], Hips_pos: [0, -0.50, -0.30], Spine: [-14, -2, 0], Chest: [-10, -2, 0], Head: [-16, 8, 0], ThighL: [24, -6, 2], ShinL: [40, 0, 0], ThighR: [38, 8, -2], ShinR: [46, 0, 0], UpArmL: [-62, 2, 70], LoArmL: [-12, 0, 6], UpArmR: [-34, -2, -74], LoArmR: [-8, 0, -6] }, 'out')
    ]
  },

  // Driven straight down into the floor.
  rSlam: {
    dur: 0.80, keys: [
      K(0, GUARD),
      K(0.06, { Hips: [30, 20, 0], Hips_pos: [0, -0.30, 0.06], Spine: [34, -6, 0], Chest: [28, -8, 0], Neck: [12, 0, 0], Head: [30, -4, 0], UpArmL: [-60, 16, 40], LoArmL: [-40, 0, 6], UpArmR: [-54, -14, -44], LoArmR: [-36, 0, -6], ThighL: [-64, -4, 0], ShinL: [70, 0, 0], ThighR: [-30, 6, 0], ShinR: [76, 0, 0] }, 'snap'),
      K(0.20, { Hips: [58, 12, 0], Hips_pos: [0, -0.62, 0.14], Spine: [26, -4, 0], Chest: [18, -4, 0], Head: [16, 4, 0], UpArmL: [-52, 6, 56], LoArmL: [-20, 0, 6], UpArmR: [-40, -6, -60], LoArmR: [-16, 0, -6], ThighL: [-30, -6, 0], ShinL: [50, 0, 0], ThighR: [-10, 8, 0], ShinR: [54, 0, 0] }, 'snap'),
      K(0.34, { Hips: [72, 8, 0], Hips_pos: [0, -0.72, 0.22], Spine: [16, -2, 0], Chest: [10, -2, 0], Head: [6, 10, 0], UpArmL: [-44, 2, 64], UpArmR: [-30, -2, -68], ThighL: [-14, -6, 2], ShinL: [30, 0, 0], ThighR: [0, 8, -2], ShinR: [26, 0, 0] }, 'hold'),
      K(0.80, SETTLED, 'out')
    ]
  },

  // It landed on the guard. Both arms absorb it and the feet skid.
  rBlockPush: {
    dur: 0.52, keys: [
      K(0, GUARD),
      K(0.06, { ...GUARD, UpArmL: [-64, 30, 12], LoArmL: [-108, 34, 0], UpArmR: [-58, -26, -14], LoArmR: [-114, -32, 0], Spine: [14, -10, 0], Chest: [12, -16, 0], Head: [12, -12, 0], Hips_pos: [0, -0.09, -0.04] }, 'snap'),
      K(0.22, { ...GUARD, UpArmL: [-72, 28, 10], LoArmL: [-114, 32, 0], UpArmR: [-66, -24, -12], LoArmR: [-120, -30, 0], Spine: [10, -10, 0], Hips_pos: [0, -0.16, -0.16], ThighL: [-46, -4, 0], ShinL: [40, 0, 0], ThighR: [28, 6, 0], ShinR: [50, 0, 0] }, 'out'),
      K(0.52, GUARD, 'out')
    ]
  },

  // Their own attack went through empty air. The overbalance IS the reaction.
  rWhiff: {
    dur: 0.62, keys: [
      K(0, GUARD),
      K(0.18, {
        Hips: [8, -60, 0], Hips_pos: [0, -0.22, 0.18], Spine: [20, 34, 0], Chest: [18, 42, 0],
        Neck: [6, 10, 0], Head: [14, 30, 0],
        UpArmL: [-48, 28, 12], LoArmL: [-30, 0, 6], UpArmR: [-16, 10, -20], LoArmR: [-96, 0, -6],
        ThighL: [-54, -4, 0], ShinL: [30, 0, 0], FootL: [-14, -10, 0], ThighR: [44, 8, 0], ShinR: [68, 0, 0]
      }, 'out'),
      K(0.36, { Hips: [4, -70, 0], Hips_pos: [0, -0.20, 0.14], Spine: [16, 30, 0], Chest: [14, 38, 0], Head: [6, -20, 0], Neck: [2, -12, 0], UpArmL: [-40, 24, 16], UpArmR: [-24, 8, -22], ThighL: [-48, -4, 0], ShinL: [28, 0, 0], ThighR: [38, 8, 0], ShinR: [62, 0, 0] }, 'hold'),
      K(0.62, { ...GUARD, Hips: [0, 36, 0], Chest: [4, -18, 0], Head: [2, -16, 0] }, 'out')
    ]
  },

  // THE FINISH. Folded around it, lifted, and then absolutely still — the
  // stillness is the shot, not the impact.
  rFinish: {
    dur: 0.82, keys: [
      K(0, GUARD),
      K(0.05, {
        Hips: [-14, 18, 0], Hips_pos: [0, 0.06, -0.14], Spine: [-34, -4, 0], Chest: [-28, -8, 0],
        Neck: [-18, -2, 0], Head: [-38, -8, 6],
        UpArmL: [-118, 14, 52], LoArmL: [-18, 0, 6], HandL: [-6, 20, 0],
        UpArmR: [-96, -12, -58], LoArmR: [-14, 0, -6], HandR: [-6, -20, 0],
        ThighL: [-70, -6, 0], ShinL: [56, 0, 0], FootL: [-18, -10, 0],
        ThighR: [-40, 8, 0], ShinR: [70, 0, 0], FootR: [-12, 8, 0]
      }, 'snap'),
      K(0.40, { Hips: [-15, 18, 0], Hips_pos: [0, 0.05, -0.15], Spine: [-33, -4, 0], Chest: [-27, -8, 0], Head: [-37, -8, 6], UpArmL: [-117, 14, 52], UpArmR: [-95, -12, -58], ThighL: [-70, -6, 0], ShinL: [56, 0, 0], ThighR: [-40, 8, 0], ShinR: [70, 0, 0] }, 'hold'),
      K(0.82, { Hips: [-40, 14, 0], Hips_pos: [0, -0.30, -0.24], Spine: [-18, -2, 0], Chest: [-14, -4, 0], Head: [-22, 4, 0], UpArmL: [-84, 6, 64], LoArmL: [-14, 0, 6], UpArmR: [-56, -6, -70], LoArmR: [-10, 0, -6], ThighL: [-10, -6, 0], ShinL: [46, 0, 0], ThighR: [6, 8, 0], ShinR: [54, 0, 0] }, 'in')
    ]
  },

  // Down, and settled on the game's own KO pose. One late twitch of the hand.
  rFall: {
    dur: 1.5, keys: [
      K(0, { Hips: [-40, 14, 0], Hips_pos: [0, -0.30, -0.24], Spine: [-18, -2, 0], Chest: [-14, -4, 0], Head: [-22, 4, 0], UpArmL: [-84, 6, 64], LoArmL: [-14, 0, 6], UpArmR: [-56, -6, -70], LoArmR: [-10, 0, -6], ThighL: [-10, -6, 0], ShinL: [46, 0, 0], ThighR: [6, 8, 0], ShinR: [54, 0, 0] }),
      K(0.24, { Hips: [-72, 8, 0], Hips_pos: [0, -0.62, -0.20], Spine: [-10, -2, 0], Chest: [-6, -2, 0], Head: [-16, 8, 0], ThighL: [46, -6, 2], ShinL: [26, 0, 0], ThighR: [58, 8, -2], ShinR: [34, 0, 0], UpArmL: [-54, 2, 72], LoArmL: [-12, 0, 6], UpArmR: [-24, -2, -76], LoArmR: [-8, 0, -6] }, 'snap'),
      K(0.40, { Hips: [-80, 4, 0], Hips_pos: [0, -0.70, -0.17], Spine: [-6, 0, 0], Head: [-10, 12, 0], ThighL: [64, -6, 4], ShinL: [16, 0, 0], ThighR: [72, 8, -4], ShinR: [22, 0, 0], UpArmL: [-48, 0, 76], UpArmR: [-18, 0, -78] }, 'out'),
      K(0.86, { ...SETTLED, HandL: [-16, 20, 0], UpArmL: [-50, 0, 74] }),
      K(1.5, SETTLED, 'out')
    ]
  },

  // ---- GIANT REACTIONS ----------------------------------------------------
  // Nothing a person does launches a body this size. It rocks, it loses height,
  // and it ends up closer to the floor than it started — which is what brings
  // its head into a human's range for the finish.
  rgRock: {
    dur: 0.72, keys: [
      K(0, { UpArmL: [-52, 16, 26], LoArmL: [-92, 0, 6], UpArmR: [-48, -14, -28], LoArmR: [-96, 0, -6], Hips: [0, 18, 0], Spine: [4, -6, 0] }),
      K(0.06, { Hips: [-12, 18, 0], Hips_pos: [0, -0.06, -0.10], Spine: [-22, -4, 0], Chest: [-20, -6, 0], Neck: [-12, -2, 0], Head: [-32, -6, 6], UpArmL: [-106, 10, 44], LoArmL: [-22, 0, 6], UpArmR: [-90, -8, -50], LoArmR: [-18, 0, -6], ThighL: [-26, -4, 0], ShinL: [22, 0, 0], ThighR: [8, 6, 0], ShinR: [26, 0, 0] }, 'snap'),
      K(0.22, { Hips: [-10, 18, 0], Hips_pos: [0, -0.10, -0.14], Spine: [-18, -4, 0], Head: [-28, -6, 6], UpArmL: [-100, 10, 42], UpArmR: [-84, -8, -48] }, 'hold'),
      K(0.72, { Hips: [8, 20, 0], Hips_pos: [0, -0.24, -0.10], Spine: [16, -6, 0], Chest: [12, -8, 0], Head: [4, -10, 0], UpArmL: [-56, 16, 28], LoArmL: [-80, 0, 6], UpArmR: [-50, -14, -30], LoArmR: [-84, 0, -6], ThighL: [-44, -4, 0], ShinL: [46, 0, 0], ThighR: [-20, 6, 0], ShinR: [52, 0, 0] }, 'out')
    ]
  },

  // The finish drops it onto one knee, head level with a person's, held still.
  rgKneel: {
    dur: 0.86, keys: [
      K(0, { Hips: [8, 20, 0], Hips_pos: [0, -0.24, -0.10], Spine: [16, -6, 0], Chest: [12, -8, 0], UpArmL: [-56, 16, 28], UpArmR: [-50, -14, -30] }),
      K(0.07, { Hips: [-6, 12, 0], Hips_pos: [0, -0.18, -0.16], Spine: [-24, -4, 0], Chest: [-22, -6, 0], Neck: [-14, 0, 0], Head: [-34, -4, 4], UpArmL: [-112, 8, 50], LoArmL: [-16, 0, 6], UpArmR: [-94, -6, -56], LoArmR: [-12, 0, -6], ThighL: [-40, -4, 0], ShinL: [40, 0, 0], ThighR: [-10, 6, 0], ShinR: [46, 0, 0] }, 'snap'),
      K(0.26, {
        Hips: [-4, 14, 0], Hips_pos: [0, -0.44, -0.10], Spine: [16, -4, 0], Chest: [12, -6, 0], Neck: [4, 0, 0], Head: [6, -6, 0],
        UpArmL: [-40, 8, 34], LoArmL: [-40, 0, 6], HandL: [-30, 20, 0],
        UpArmR: [-34, -6, -38], LoArmR: [-36, 0, -6], HandR: [-30, -20, 0],
        ThighL: [-96, -6, 0], ShinL: [116, 0, 0], FootL: [24, -8, 0],
        ThighR: [-26, 8, 0], ShinR: [104, 0, 0], FootR: [16, 8, 0]
      }, 'snap'),
      K(0.60, { Hips: [-4, 14, 0], Hips_pos: [0, -0.45, -0.10], Spine: [17, -4, 0], Head: [6, -6, 0], UpArmL: [-39, 8, 34], UpArmR: [-33, -6, -38], ThighL: [-96, -6, 0], ShinL: [116, 0, 0], ThighR: [-26, 8, 0], ShinR: [104, 0, 0] }, 'hold'),
      K(0.86, { Hips: [10, 12, 0], Hips_pos: [0, -0.48, -0.06], Spine: [26, -4, 0], Chest: [20, -6, 0], Head: [16, -4, 0], UpArmL: [-30, 6, 30], LoArmL: [-32, 0, 6], UpArmR: [-24, -4, -34], LoArmR: [-28, 0, -6], ThighL: [-96, -6, 0], ShinL: [118, 0, 0], ThighR: [-22, 8, 0], ShinR: [106, 0, 0] }, 'in')
    ]
  },

  // And forward onto its face, which is the only way something that big falls
  // from a kneel.
  rgTopple: {
    dur: 1.5, keys: [
      K(0, { Hips: [10, 12, 0], Hips_pos: [0, -0.48, -0.06], Spine: [26, -4, 0], Chest: [20, -6, 0], Head: [16, -4, 0], UpArmL: [-30, 6, 30], UpArmR: [-24, -4, -34], ThighL: [-96, -6, 0], ShinL: [118, 0, 0], ThighR: [-22, 8, 0], ShinR: [106, 0, 0] }),
      K(0.30, { Hips: [46, 10, 0], Hips_pos: [0, -0.52, 0.10], Spine: [40, -4, 0], Chest: [30, -4, 0], Neck: [8, 0, 0], Head: [22, -2, 0], UpArmL: [-84, 10, 24], LoArmL: [-20, 0, 6], HandL: [-40, 20, 0], UpArmR: [-80, -8, -26], LoArmR: [-18, 0, -6], HandR: [-40, -20, 0], ThighL: [-70, -6, 0], ShinL: [96, 0, 0], ThighR: [-16, 8, 0], ShinR: [92, 0, 0] }, 'in'),
      K(0.56, { Hips: [76, 6, 0], Hips_pos: [0, -0.58, 0.20], Spine: [26, -2, 0], Chest: [18, -2, 0], Head: [10, 8, 0], UpArmL: [-56, 4, 46], LoArmL: [-14, 0, 6], UpArmR: [-52, -4, -50], LoArmR: [-12, 0, -6], ThighL: [-30, -6, 0], ShinL: [46, 0, 0], ThighR: [-8, 8, 0], ShinR: [42, 0, 0] }, 'snap'),
      K(0.92, { Hips: [86, 2, 0], Hips_pos: [0, -0.62, 0.24], Spine: [14, 0, 0], Chest: [8, 0, 0], Head: [2, 14, 0], UpArmL: [-40, 0, 60], LoArmL: [-10, 0, 6], UpArmR: [-30, 0, -64], LoArmR: [-8, 0, -6], ThighL: [-8, -6, 4], ShinL: [16, 0, 0], ThighR: [4, 8, -4], ShinR: [12, 0, 0] }, 'out'),
      K(1.5, { Hips: [88, 2, 0], Hips_pos: [0, -0.63, 0.25], Spine: [12, 0, 0], Chest: [6, 0, 0], Head: [0, 16, 0], UpArmL: [-38, 0, 62], LoArmL: [-8, 0, 6], HandL: [0, 0, 0], UpArmR: [-28, 0, -66], LoArmR: [-6, 0, -6], HandR: [0, 0, 0], ThighL: [-6, -6, 4], ShinL: [14, 0, 0], ThighR: [2, 8, -4], ShinR: [10, 0, 0] }, 'out')
    ]
  }
};

// Which bone a strike is aimed at, and how high up the body it sits. The
// height fractions are of the VICTIM's own height, so a shot to the head goes
// to the head whether that is at 1.3 m or 3.0 m.
export const AIM_BONE = {
  head: 'Head', chin: 'Head', chest: 'Chest', gut: 'Spine', guard: 'HandL'
};

// The two authoring scales. Everything above is written on a 1.8 m body except
// the `g*` moves and `rg*` reactions, which are written on a 3.6 m one —
// retarget.js divides by the declared height, so both sets stay proportional
// on whatever body performs them. Split here rather than guessed by prefix so
// a new giant move has to say which it is.
const GIANT_NAMES = ['gSmash', 'gSweep', 'gBackhand', 'rgRock', 'rgKneel', 'rgTopple'];

export const FIGHT_HUMAN = {};
export const FIGHT_GIANT = {};
for (const [name, def] of Object.entries({ ...MOVES, ...REACTIONS })) {
  (GIANT_NAMES.includes(name) ? FIGHT_GIANT : FIGHT_HUMAN)[name] = def;
}

export function contactOf(name) { return MOVES[name]?.contact || null; }
