// Shared base clips: movement, guard, reactions, 3-hit punch string, the
// heavy knockdown swing and the tech (quick-rise).
// Conventions (bind = world-aligned bones, character faces +Z):
//   limbs hanging down: rx<0 swings forward, rx>0 back; rz>0 abducts toward +X
//   spine/head: rx>0 leans forward, ry turns, Hips_pos offsets in meters.
//   HandL/HandR ry = WRIST PRONATION about the forearm axis. With the arm
//   punched out front, 0 leaves the palm facing up (supinated) — only correct
//   for uppercuts. ~90 = vertical fist, ~170 = knuckles-up straight punch.
// Ease is stored on the destination key: 'in' = anticipation, 'out'/'snap' =
// strike, 'hold' = freeze. Impact keys are followed by a short hold key —
// that read-of-the-hit matters more than the swing itself.

export const STANCE = {
  Hips_pos: [0, -0.045, 0],
  Hips: [0, 24, 0], Spine: [4, -7, 0], Chest: [3, -10, 0], Neck: [0, -4, 0], Head: [2, -8, 0],
  ClavL: [0, 0, 0], UpArmL: [-24, 6, 6], LoArmL: [-102, 26, 0], HandL: [-24, 70, 0],
  ClavR: [0, 0, 0], UpArmR: [-16, -4, -8], LoArmR: [-110, -22, 0], HandR: [-26, -70, 0],
  ThighL: [-17, -4, 0], ShinL: [15, 0, 0], FootL: [3, -12, 0],
  ThighR: [13, 6, 0], ShinR: [21, 0, 0], FootR: [10, 8, 0]
};

const S = STANCE;
const K = (t, pose, e) => ({ t, pose, e });

export const BASE_CLIPS = {
  // idle: the breath, and under it a slow shift of weight onto the lead hip —
  // a body standing still is never still on both feet at once
  idle: {
    dur: 2.8, loop: true, keys: [
      K(0, {}),
      K(1.4, { Chest: [5, -10, 0], Spine: [5, -7, 0], Hips_pos: [0.010, -0.055, 0], 'Hips+': [0, 0, 1.5], 'Chest+': [0, 0, -1], UpArmL: [-49, 10, 16], UpArmR: [-37, -8, -18], Head: [3, -7, 0] }),
      K(2.8, {})
    ]
  },

  // WALK. The legs were the whole walk before; the rest of the body was bolted
  // to the pelvis. What a walk actually is, above the knee:
  //   pelvis yaw     the hip of the leading leg swings forward (`Hips+` ry,
  //                  relative — see player.js — so it rides each character's
  //                  own stance angle instead of squaring them up)
  //   counter-twist  the chest turns the other way, which is where arm swing
  //                  comes from even with the guard up
  //   hip drop       at mid-stance the free side of the pelvis sags and the
  //                  chest levels against it
  //   sway           the whole body shifts a centimetre over the planted foot
  //   foot roll      heel strike with the toe up, toe-off with the heel up,
  //                  flat only when the foot is under the body
  // Head counters the chest so the eyes stay on the opponent.
  walk: {
    dur: 0.86, loop: true, keys: [
      K(0, { ThighL: [-30, -4, 0], ShinL: [12, 0, 0], FootL: [-14, -8, 0], ThighR: [22, 6, 0], ShinR: [30, 0, 0], FootR: [24, 8, 0], Hips_pos: [0, -0.05, 0], 'Hips+': [0, -7, 0], 'Chest+': [0, 6, 0], 'Head+': [0, -3, 0], UpArmL: [-44, 10, 14], UpArmR: [-48, -8, -16], Spine: [6, -7, 0] }),
      K(0.215, { ThighL: [-6, -4, 0], ShinL: [22, 0, 0], FootL: [2, -8, 0], ThighR: [4, 6, 0], ShinR: [16, 0, 0], FootR: [8, 8, 0], Hips_pos: [0.012, -0.028, 0], 'Hips+': [0, 0, 3], 'Chest+': [0, 0, -2] }),
      K(0.43, { ThighL: [24, -4, 0], ShinL: [28, 0, 0], FootL: [24, -8, 0], ThighR: [-28, 6, 0], ShinR: [14, 0, 0], FootR: [-14, 8, 0], Hips_pos: [0, -0.05, 0], 'Hips+': [0, 7, 0], 'Chest+': [0, -6, 0], 'Head+': [0, 3, 0], UpArmL: [-58, 10, 14], UpArmR: [-34, -8, -16], Spine: [6, -7, 0] }),
      K(0.645, { ThighL: [2, -4, 0], ShinL: [18, 0, 0], FootL: [8, -8, 0], ThighR: [-8, 6, 0], ShinR: [24, 0, 0], FootR: [2, 8, 0], Hips_pos: [-0.012, -0.028, 0], 'Hips+': [0, 0, -3], 'Chest+': [0, 0, 2] }),
      K(0.86, { ThighL: [-30, -4, 0], ShinL: [12, 0, 0], FootL: [-14, -8, 0], ThighR: [22, 6, 0], ShinR: [30, 0, 0], FootR: [24, 8, 0], Hips_pos: [0, -0.05, 0], 'Hips+': [0, -7, 0], 'Chest+': [0, 6, 0], 'Head+': [0, -3, 0], UpArmL: [-44, 10, 14], UpArmR: [-48, -8, -16] })
    ]
  },

  // RUN. Same anatomy as the walk, bigger: the pelvis swings twice as far and
  // the chest twists hard against it, which is what makes the arms pump
  // instead of merely alternate. The head holds level against the forward
  // lean of the spine so he runs AT the opponent rather than at the floor.
  run: {
    dur: 0.52, loop: true, keys: [
      K(0, { Spine: [16, -4, 0], Chest: [10, -6, 0], Hips: [4, 12, 0], 'Hips+': [0, -12, 0], 'Chest+': [0, 11, 0], 'Head+': [-8, -4, 0], ThighL: [-52, -2, 0], ShinL: [24, 0, 0], FootL: [-14, -6, 0], ThighR: [34, 4, 0], ShinR: [66, 0, 0], FootR: [34, 6, 0], UpArmL: [-20, 8, 10], LoArmL: [-108, 0, 4], UpArmR: [-72, -6, -12], LoArmR: [-96, 0, -4], Hips_pos: [0, -0.03, 0] }),
      K(0.13, { Spine: [14, -4, 0], 'Hips+': [0, 0, 3], 'Chest+': [0, 0, -2], 'Head+': [-7, 0, 0], ThighL: [-10, -2, 0], ShinL: [30, 0, 0], FootL: [4, -6, 0], ThighR: [-16, 4, 0], ShinR: [40, 0, 0], Hips_pos: [0.008, -0.065, 0] }),
      K(0.26, { Spine: [16, -4, 0], Chest: [10, -6, 0], Hips: [4, 12, 0], 'Hips+': [0, 12, 0], 'Chest+': [0, -11, 0], 'Head+': [-8, 4, 0], ThighL: [34, -2, 0], ShinL: [66, 0, 0], FootL: [34, -6, 0], ThighR: [-52, 4, 0], ShinR: [24, 0, 0], FootR: [-14, 6, 0], UpArmL: [-72, 8, 10], LoArmL: [-96, 0, 4], UpArmR: [-20, -6, -12], LoArmR: [-108, 0, -4], Hips_pos: [0, -0.03, 0] }),
      K(0.39, { Spine: [14, -4, 0], 'Hips+': [0, 0, -3], 'Chest+': [0, 0, 2], 'Head+': [-7, 0, 0], ThighL: [-16, -2, 0], ShinL: [40, 0, 0], ThighR: [-10, 4, 0], ShinR: [30, 0, 0], FootR: [4, 6, 0], Hips_pos: [-0.008, -0.065, 0] }),
      K(0.52, { Spine: [16, -4, 0], Chest: [10, -6, 0], Hips: [4, 12, 0], 'Hips+': [0, -12, 0], 'Chest+': [0, 11, 0], 'Head+': [-8, -4, 0], ThighL: [-52, -2, 0], ShinL: [24, 0, 0], FootL: [-14, -6, 0], ThighR: [34, 4, 0], ShinR: [66, 0, 0], FootR: [34, 6, 0], UpArmL: [-20, 8, 10], LoArmL: [-108, 0, 4], UpArmR: [-72, -6, -12], LoArmR: [-96, 0, -4] })
    ]
  },

  dash: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.08, { Spine: [24, -4, 0], Chest: [14, -6, 0], Hips_pos: [0, -0.12, 0], ThighL: [-48, -4, 0], ShinL: [30, 0, 0], ThighR: [30, 6, 0], ShinR: [56, 0, 0], UpArmL: [30, 10, 20], LoArmL: [-40, 0, 6], UpArmR: [34, -8, -22], LoArmR: [-36, 0, -6] }, 'out'),
      K(0.34, { Spine: [18, -5, 0], Hips_pos: [0, -0.09, 0], ThighL: [-38, -4, 0], ShinL: [26, 0, 0], ThighR: [22, 6, 0], ShinR: [44, 0, 0], UpArmL: [16, 10, 18], UpArmR: [20, -8, -20] })
    ]
  },

  jump: {
    dur: 0.5, loop: false, keys: [
      K(0, { Hips_pos: [0, -0.16, 0], Spine: [18, -7, 0], ThighL: [-52, -4, 0], ShinL: [56, 0, 0], ThighR: [-44, 6, 0], ShinR: [60, 0, 0] }),
      K(0.16, { Hips_pos: [0, 0.02, 0], Spine: [-6, -7, 0], Chest: [-4, -10, 0], ThighL: [-28, -4, 0], ShinL: [30, 0, 0], FootL: [24, -12, 0], ThighR: [10, 6, 0], ShinR: [34, 0, 0], FootR: [28, 8, 0], UpArmL: [-72, 10, 30], UpArmR: [-60, -8, -32], LoArmL: [-60, 0, 6], LoArmR: [-70, 0, -6] }, 'out'),
      K(0.5, { Hips_pos: [0, 0, 0], ThighL: [-46, -4, 0], ShinL: [58, 0, 0], ThighR: [-20, 6, 0], ShinR: [44, 0, 0], UpArmL: [-58, 10, 26], UpArmR: [-46, -8, -28] })
    ]
  },

  fall: {
    dur: 0.7, loop: true, keys: [
      K(0, { ThighL: [-38, -4, 0], ShinL: [40, 0, 0], ThighR: [-12, 6, 0], ShinR: [30, 0, 0], UpArmL: [-70, 10, 42], LoArmL: [-50, 0, 6], UpArmR: [-58, -8, -44], LoArmR: [-58, 0, -6], Spine: [8, -7, 0] }),
      K(0.35, { ThighL: [-30, -4, 0], ShinL: [34, 0, 0], ThighR: [-20, 6, 0], ShinR: [36, 0, 0], UpArmL: [-64, 10, 38], UpArmR: [-64, -8, -40] }),
      K(0.7, { ThighL: [-38, -4, 0], ShinL: [40, 0, 0], ThighR: [-12, 6, 0], ShinR: [30, 0, 0], UpArmL: [-70, 10, 42], UpArmR: [-58, -8, -44] })
    ]
  },

  land: {
    dur: 0.26, loop: false, keys: [
      K(0, { Hips_pos: [0, -0.20, 0], Spine: [22, -7, 0], Chest: [12, -10, 0], ThighL: [-60, -4, 0], ShinL: [70, 0, 0], ThighR: [-40, 6, 0], ShinR: [64, 0, 0], UpArmL: [-30, 10, 24], UpArmR: [-22, -8, -26] }, 'snap'),
      K(0.26, {})
    ]
  },

  block: {
    dur: 0.16, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmL: [-78, 26, 6], LoArmL: [-118, 30, 0], HandL: [-20, 96, 0], UpArmR: [-70, -22, -8], LoArmR: [-124, -28, 0], HandR: [-20, -96, 0], Spine: [8, -7, 0], Chest: [6, -10, 0], Head: [8, -8, 0], Hips_pos: [0, -0.075, 0], ThighL: [-20, -4, 0], ShinL: [20, 0, 0] }, 'out'),
      K(0.16, { UpArmL: [-78, 26, 6], LoArmL: [-118, 30, 0], UpArmR: [-70, -22, -8], LoArmR: [-124, -28, 0], Hips_pos: [0, -0.075, 0] })
    ]
  },

  blockHit: {
    dur: 0.2, loop: false, keys: [
      K(0, { UpArmL: [-78, 26, 6], LoArmL: [-118, 30, 0], UpArmR: [-70, -22, -8], LoArmR: [-124, -28, 0], Hips_pos: [0, -0.075, 0], Spine: [8, -7, 0] }),
      K(0.05, { UpArmL: [-64, 26, 6], LoArmL: [-110, 30, 0], UpArmR: [-58, -22, -8], LoArmR: [-116, -28, 0], Spine: [16, -7, 0], Head: [12, -8, 0], Hips_pos: [0, -0.09, 0] }, 'snap'),
      K(0.2, { UpArmL: [-78, 26, 6], LoArmL: [-118, 30, 0], UpArmR: [-70, -22, -8], LoArmR: [-124, -28, 0], Hips_pos: [0, -0.075, 0] })
    ]
  },

  guardBreak: {
    dur: 0.95, loop: false, keys: [
      K(0, { UpArmL: [-78, 26, 6], LoArmL: [-118, 30, 0], UpArmR: [-70, -22, -8], LoArmR: [-124, -28, 0] }),
      K(0.12, { UpArmL: [-90, 10, 64], LoArmL: [-30, 0, 6], UpArmR: [-80, -8, -70], LoArmR: [-24, 0, -6], Spine: [-18, -4, 0], Chest: [-12, -6, 0], Head: [-16, -6, 0], Hips_pos: [0, -0.02, 0] }, 'snap'),
      K(0.30, { UpArmL: [-84, 10, 58], LoArmL: [-34, 0, 6], UpArmR: [-74, -8, -64], LoArmR: [-28, 0, -6], Spine: [-15, -4, 0], Head: [-13, -6, 0] }, 'hold'),
      K(0.7, { Spine: [-8, -5, 0], UpArmL: [-60, 10, 30], UpArmR: [-50, -8, -34], LoArmL: [-60, 0, 6], LoArmR: [-66, 0, -6], Hips_pos: [0, -0.05, 0] }),
      K(0.95, {})
    ]
  },

  hitLight: {
    dur: 0.3, loop: false, keys: [
      K(0, {}),
      K(0.05, { Head: [-14, -14, 0], Neck: [-8, -4, 0], Chest: [-8, -14, 0], Spine: [-6, -8, 0], UpArmL: [-30, 10, 20], UpArmR: [-24, -8, -22], Hips_pos: [0, -0.03, 0] }, 'snap'),
      K(0.12, { Head: [-11, -12, 0], Chest: [-7, -13, 0], Spine: [-5, -8, 0] }, 'hold'),
      K(0.3, {})
    ]
  },

  hitHeavy: {
    dur: 0.55, loop: false, keys: [
      K(0, {}),
      K(0.06, { Head: [-26, -10, 6], Neck: [-14, -4, 0], Chest: [-22, -12, 0], Spine: [-16, -6, 0], Hips: [-6, 20, 0], UpArmL: [-88, 10, 44], LoArmL: [-24, 0, 6], UpArmR: [-70, -8, -50], LoArmR: [-18, 0, -6], ThighL: [-30, -4, 0], ShinL: [22, 0, 0], Hips_pos: [0, -0.02, 0] }, 'snap'),
      K(0.2, { Head: [-22, -10, 5], Chest: [-19, -12, 0], Spine: [-14, -6, 0], UpArmL: [-80, 10, 40], UpArmR: [-64, -8, -46] }, 'hold'),
      K(0.55, {})
    ]
  },

  launched: {
    dur: 0.8, loop: true, keys: [
      K(0, { Spine: [-30, -4, 0], Chest: [-18, -6, 0], Head: [-22, -6, 0], Hips: [-20, 16, 0], ThighL: [-64, -4, 0], ShinL: [50, 0, 0], ThighR: [-30, 6, 0], ShinR: [64, 0, 0], UpArmL: [-110, 10, 40], LoArmL: [-30, 0, 6], UpArmR: [-90, -8, -46], LoArmR: [-36, 0, -6] }),
      K(0.4, { Spine: [-36, -4, 0], Hips: [-26, 16, 0], ThighL: [-52, -4, 0], ThighR: [-40, 6, 0], UpArmL: [-100, 10, 46], UpArmR: [-100, -8, -40] }),
      K(0.8, { Spine: [-30, -4, 0], Hips: [-20, 16, 0], ThighL: [-64, -4, 0], ThighR: [-30, 6, 0], UpArmL: [-110, 10, 40], UpArmR: [-90, -8, -46] })
    ]
  },

  knockdown: {
    dur: 0.5, loop: false, keys: [
      K(0, { Spine: [-24, -4, 0], Hips: [-20, 12, 0], Hips_pos: [0, -0.1, 0] }),
      K(0.22, { Hips: [-70, 6, 0], Hips_pos: [0, -0.62, -0.1], Spine: [-14, -2, 0], Chest: [-8, -2, 0], Head: [-18, 0, 0], ThighL: [0, -4, 0], ShinL: [14, 0, 0], ThighR: [6, 6, 0], ShinR: [20, 0, 0], UpArmL: [-40, 0, 56], LoArmL: [-20, 0, 6], UpArmR: [-30, 0, -60], LoArmR: [-16, 0, -6] }, 'snap'),
      K(0.5, { Hips: [-82, 4, 0], Hips_pos: [0, -0.72, -0.14], Spine: [-8, -2, 0], Chest: [-4, -2, 0], Head: [-10, 0, 0], ThighL: [-10, -4, 0], ShinL: [2, 0, 0], ThighR: [-4, 6, 0], ShinR: [6, 0, 0], UpArmL: [-36, 0, 62], LoArmL: [-14, 0, 6], UpArmR: [-26, 0, -66], LoArmR: [-10, 0, -6] }, 'out')
    ]
  },

  getup: {
    dur: 0.6, loop: false, keys: [
      K(0, { Hips: [-82, 4, 0], Hips_pos: [0, -0.72, -0.14], ThighL: [-10, -4, 0], ShinL: [2, 0, 0], ThighR: [-4, 6, 0], ShinR: [6, 0, 0], UpArmL: [-36, 0, 62], UpArmR: [-26, 0, -66] }),
      K(0.3, { Hips: [-30, 14, 0], Hips_pos: [0, -0.34, -0.06], Spine: [26, -7, 0], ThighL: [-40, -4, 0], ShinL: [70, 0, 0], ThighR: [30, 6, 0], ShinR: [80, 0, 0], UpArmL: [-20, 10, 20], UpArmR: [-14, -8, -22] }),
      K(0.6, {}, 'out')
    ]
  },

  ko: {
    dur: 0.9, loop: false, keys: [
      K(0, { Spine: [-24, -4, 0], Head: [-20, -6, 0] }),
      K(0.3, { Hips: [-74, 6, 0], Hips_pos: [0, -0.6, -0.12], Spine: [-10, -2, 0], Head: [-14, 8, 0], ThighL: [56, -4, 0], ShinL: [20, 0, 0], ThighR: [66, 6, 0], ShinR: [30, 0, 0], UpArmL: [-50, 0, 70], LoArmL: [-12, 0, 6], UpArmR: [-20, 0, -74], LoArmR: [-8, 0, -6] }, 'snap'),
      K(0.9, { Hips: [-86, 2, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-4, 0, 0], Chest: [-2, 0, 0], Head: [-6, 14, 0], ThighL: [72, -6, 4], ShinL: [10, 0, 0], ThighR: [80, 8, -4], ShinR: [16, 0, 0], UpArmL: [-46, 0, 78], LoArmL: [-8, 0, 6], UpArmR: [-16, 0, -80], LoArmR: [-6, 0, -6], HandL: [0, 0, 0], HandR: [0, 0, 0] }, 'out')
    ]
  },

  // DEFEAT: the mid-round death in a free-for-all. Longer and heavier than the
  // round-ending `ko` — the hit lands, he staggers, the knees go, and he folds
  // onto his back and stays there. The final key matches `ko`'s settled pose so
  // a body downed early and a body downed at the buzzer read the same.
  defeat: {
    dur: 1.5, loop: false, keys: [
      K(0, {}),
      K(0.13, { Spine: [-20, -4, 0], Chest: [-16, -8, 0], Head: [-26, -6, 4], Neck: [-12, -4, 0], Hips: [-8, 20, 0], UpArmL: [-96, 10, 46], LoArmL: [-20, 0, 6], UpArmR: [-84, -8, -52], LoArmR: [-16, 0, -6], ThighL: [-24, -4, 0], ShinL: [18, 0, 0], Hips_pos: [0, -0.03, 0] }, 'snap'),
      K(0.34, { Spine: [10, -4, 0], Chest: [8, -8, 0], Head: [18, -4, 0], Hips: [-4, 18, 0], UpArmL: [-30, 10, 22], LoArmL: [-56, 0, 6], UpArmR: [-24, -8, -26], LoArmR: [-50, 0, -6], ThighL: [-58, -4, 0], ShinL: [86, 0, 0], ThighR: [-48, 6, 0], ShinR: [92, 0, 0], Hips_pos: [0, -0.36, 0] }, 'in'),
      K(0.62, { Spine: [-6, -2, 0], Chest: [-4, -4, 0], Head: [-8, 4, 0], Hips: [-52, 10, 0], UpArmL: [-52, 0, 60], LoArmL: [-16, 0, 6], UpArmR: [-30, 0, -64], LoArmR: [-12, 0, -6], ThighL: [44, -4, 0], ShinL: [34, 0, 0], ThighR: [54, 6, 0], ShinR: [40, 0, 0], Hips_pos: [0, -0.56, -0.1] }),
      K(0.92, { Spine: [-6, 0, 0], Chest: [-3, 0, 0], Head: [-10, 10, 0], Hips: [-84, 4, 0], UpArmL: [-46, 0, 76], LoArmL: [-10, 0, 6], UpArmR: [-18, 0, -78], LoArmR: [-8, 0, -6], ThighL: [70, -6, 4], ShinL: [14, 0, 0], ThighR: [78, 8, -4], ShinR: [20, 0, 0], Hips_pos: [0, -0.72, -0.15] }, 'out'),
      K(1.5, { Spine: [-4, 0, 0], Chest: [-2, 0, 0], Head: [-6, 14, 0], Hips: [-86, 2, 0], Hips_pos: [0, -0.74, -0.16], ThighL: [72, -6, 4], ShinL: [10, 0, 0], ThighR: [80, 8, -4], ShinR: [16, 0, 0], UpArmL: [-46, 0, 78], LoArmL: [-8, 0, 6], UpArmR: [-16, 0, -80], LoArmR: [-6, 0, -6], HandL: [0, 0, 0], HandR: [0, 0, 0] }, 'out')
    ]
  },

  stunned: {
    dur: 1.6, loop: true, keys: [
      K(0, { Head: [-18, -4, 3], Neck: [-10, 0, 0], Spine: [-6, -4, 0], Chest: [-5, -5, 0], UpArmL: [-20, 4, 22], LoArmL: [-30, 0, 4], UpArmR: [-16, -4, -24], LoArmR: [-26, 0, -4], HandL: [10, 0, 0], HandR: [10, 0, 0], Hips_pos: [0, -0.06, 0], ThighL: [-8, -4, 0], ThighR: [6, 6, 0] }),
      K(0.8, { Head: [-21, 2, -3], Spine: [-7, -3, 0], UpArmL: [-22, 4, 24], UpArmR: [-18, -4, -26], Hips_pos: [0, -0.07, 0] }),
      K(1.6, { Head: [-18, -4, 3], Spine: [-6, -4, 0], UpArmL: [-20, 4, 22], UpArmR: [-16, -4, -24], Hips_pos: [0, -0.06, 0] })
    ]
  },

  // FROZEN — the victim of Naoya's Projection Sorcery, played by ANY
  // character for exactly the reason `transfigured`, `devoured` and
  // `sentenced` live here: any of them can be the one it happens to, and
  // authoring it once on the shared skeleton retargets it across the whole
  // roster (and Mahoraga, at twice the height) for free.
  //
  // EXTENDED FROM `stunned`, NOT BUILT FRESH. The brief asked for a reuse of
  // whatever already answers "you cannot move" — that is `stunned`, which
  // Yuta's DON'T MOVE, Nue's shock and the Great Serpent's coil all already
  // play through the `rooted` state. This clip is that pose with the slack
  // taken out of it, and the difference is the whole mechanic:
  //
  //   `stunned`  — the body sags and drifts. Somebody staggered is still a
  //                body, and it keeps moving because bodies do.
  //   `frozen`   — the body is RIGID and it STEPS. Every key carries the
  //                `hold` easing (a true step function: see player.js), and
  //                the keys sit on 24ths of a second, so a frozen fighter is
  //                literally being drawn at 24 fps inside a 60 fps game while
  //                everyone else around them moves continuously. That reads
  //                as "trapped in a frame" without a single line of shader.
  //
  // The pose itself is a body caught MID-STEP and abandoned there: one foot
  // off the floor, weight committed forward, arms half-raised, head turned.
  // It is deliberately an unbalanced pose — a person cannot hold it, which is
  // precisely why holding it is unsettling. It loops for the full second and
  // the fighter is handed straight back to `idle` when the timer expires.
  frozen: {
    dur: 0.5, loop: true, keys: [
      K(0, {
        Hips: [2, 18, 0], Hips_pos: [0, -0.038, 0.02], Spine: [7, -6, 0], Chest: [5, -8, 0],
        Neck: [1, -2, 0], Head: [3, -16, 2],
        ThighL: [-36, -4, 0], ShinL: [30, 0, 0], FootL: [-6, -10, 0],
        ThighR: [20, 6, 0], ShinR: [24, 0, 0], FootR: [12, 8, 0],
        UpArmL: [-48, 14, 22], LoArmL: [-72, 8, 4], HandL: [-14, 46, 0],
        UpArmR: [-38, -12, -24], LoArmR: [-80, -10, -4], HandR: [-14, -46, 0]
      }),
      // the stutter. Sub-degree steps on the 24 fps grid — not a movement, a
      // FLICKER, as though the frame it is trapped in is not quite stable.
      K(0.125, { Head: [3, -15, 2], Chest: [5, -9, 0], Hips_pos: [0, -0.036, 0.02] }, 'hold'),
      K(0.25, { Head: [4, -16, 3], Chest: [6, -8, 0], Hips_pos: [0, -0.039, 0.02] }, 'hold'),
      K(0.375, { Head: [3, -17, 2], Chest: [5, -8, 0], Hips_pos: [0, -0.037, 0.02] }, 'hold'),
      K(0.5, { Head: [3, -16, 2], Chest: [5, -8, 0], Hips_pos: [0, -0.038, 0.02] }, 'hold')
    ]
  },

  simpleDomain: {
    dur: 1.2, loop: true, keys: [
      K(0, { UpArmL: [-64, 24, 8], LoArmL: [-112, 26, 0], HandL: [-30, 100, 0], UpArmR: [-58, -20, -10], LoArmR: [-118, -24, 0], HandR: [-30, -100, 0], Spine: [10, -7, 0], Head: [6, -8, 0], Hips_pos: [0, -0.10, 0], ThighL: [-24, -4, 0], ShinL: [26, 0, 0], ThighR: [18, 6, 0], ShinR: [30, 0, 0] }),
      K(0.6, { Hips_pos: [0, -0.115, 0], Spine: [11, -7, 0] }),
      K(1.2, { Hips_pos: [0, -0.10, 0], Spine: [10, -7, 0] })
    ]
  },

  barrierBreak: {
    dur: 0.9, loop: true, keys: [
      K(0, { UpArmL: [-96, 4, 10], LoArmL: [-24, 0, 4], HandL: [-40, 0, 0], UpArmR: [-92, -2, -12], LoArmR: [-28, 0, -4], HandR: [-40, 0, 0], Spine: [16, -4, 0], Chest: [10, -4, 0], Head: [8, -4, 0], Hips_pos: [0, -0.09, 0], ThighL: [-28, -4, 0], ShinL: [26, 0, 0], ThighR: [22, 6, 0], ShinR: [34, 0, 0] }),
      K(0.45, { UpArmL: [-100, 4, 8], UpArmR: [-96, -2, -10], Spine: [18, -4, 0], Hips_pos: [0, -0.10, 0] }),
      K(0.9, { UpArmL: [-96, 4, 10], UpArmR: [-92, -2, -12], Spine: [16, -4, 0], Hips_pos: [0, -0.09, 0] })
    ]
  },

  // 3-hit string: jab (L) -> cross (R) -> rising uppercut launcher (R).
  // Jab lands on a vertical fist, the cross rolls over to knuckles-up, and
  // only the uppercut keeps the palm turned up — where it belongs.
  punch1: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.07, { UpArmL: [-40, 14, 18], LoArmL: [-104, 0, 6], HandL: [-16, 80, 0], Chest: [2, -22, 0], Hips: [0, 30, 0], Spine: [3, -12, 0] }, 'in'),
      K(0.13, { UpArmL: [-84, -6, -4], LoArmL: [-6, 0, 0], HandL: [-4, 104, 0], Chest: [4, 10, 0], Hips: [0, 12, 0], Spine: [4, 6, 0], Head: [2, -14, 0], UpArmR: [-30, -8, -18], LoArmR: [-110, 0, -6], HandR: [-26, -76, 0] }, 'snap'),
      K(0.17, { UpArmL: [-84, -6, -4], LoArmL: [-8, 0, 0], HandL: [-4, 104, 0], Chest: [4, 10, 0], Hips: [0, 12, 0] }, 'hold'),
      K(0.34, {}, 'out')
    ]
  },

  punch2: {
    dur: 0.38, loop: false, keys: [
      K(0, { UpArmL: [-70, -6, 0], LoArmL: [-40, 0, 0], Chest: [4, 4, 0] }),
      K(0.08, { UpArmR: [-30, -18, -24], LoArmR: [-116, 0, -6], HandR: [-18, -84, 0], Chest: [4, -26, 0], Hips: [0, 38, 0], Spine: [4, -14, 0], Hips_pos: [0, -0.06, 0] }, 'in'),
      K(0.15, { UpArmR: [-88, 8, 2], LoArmR: [-4, 0, 0], HandR: [-4, -168, 0], Chest: [6, 22, 0], Hips: [0, 2, 0], Spine: [6, 14, 0], Head: [2, -18, 0], UpArmL: [-36, 10, 16], LoArmL: [-96, 0, 6], HandL: [-24, 76, 0] }, 'snap'),
      K(0.20, { UpArmR: [-88, 8, 2], LoArmR: [-6, 0, 0], HandR: [-4, -168, 0], Chest: [6, 22, 0], Hips: [0, 2, 0] }, 'hold'),
      K(0.38, {}, 'out')
    ]
  },

  punch3: {
    dur: 0.55, loop: false, keys: [
      K(0, { UpArmR: [-70, 4, 0], LoArmR: [-30, 0, 0] }),
      K(0.14, { UpArmR: [24, -12, -26], LoArmR: [-92, 0, -8], HandR: [-10, -30, 0], Chest: [14, -30, 0], Spine: [12, -16, 0], Hips: [4, 40, 0], Hips_pos: [0, -0.16, 0], ThighL: [-30, -4, 0], ShinL: [34, 0, 0], ThighR: [26, 6, 0], ShinR: [48, 0, 0], Head: [6, -10, 0] }, 'in'),
      // uppercut: palm stays turned up (ry ~0) — the one place it is correct
      K(0.24, { UpArmR: [-118, 10, 6], LoArmR: [-44, 0, 0], HandR: [-18, 0, 0], Chest: [-10, 18, 0], Spine: [-8, 10, 0], Hips: [-2, 6, 0], Hips_pos: [0, 0.02, 0], ThighL: [-14, -4, 0], ShinL: [12, 0, 0], ThighR: [8, 6, 0], ShinR: [20, 0, 0], FootR: [24, 8, 0], Head: [-4, -12, 0], UpArmL: [-30, 10, 20], LoArmL: [-90, 0, 6], HandL: [-20, 64, 0] }, 'snap'),
      K(0.30, { UpArmR: [-120, 10, 6], LoArmR: [-46, 0, 0], HandR: [-18, 0, 0], Chest: [-10, 18, 0], Hips_pos: [0, 0.02, 0] }, 'hold'),
      K(0.55, {}, 'out')
    ]
  },

  // HEAVY fallback: a coiled overhand right dropped through the target with the
  // whole body behind it. Long anticipation, hard stop, long settle — the read
  // is "this is going to put someone down". Characters override it by name.
  heavy: {
    dur: 0.82, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-160, -14, -10], LoArmR: [-60, 0, -4], HandR: [-20, -60, 0], UpArmL: [-56, 16, 22], LoArmL: [-84, 0, 6], Chest: [-4, -32, 0], Spine: [-3, -17, 0], Hips: [0, 42, 0], Head: [-2, -14, 0], Hips_pos: [0, -0.06, 0], ThighL: [-26, -4, 0], ShinL: [28, 0, 0] }, 'in'),
      K(0.34, { UpArmR: [-74, 10, -2], LoArmR: [-8, 0, 0], HandR: [-30, -140, 0], UpArmL: [-30, 12, 20], LoArmL: [-88, 0, 6], Chest: [12, 24, 0], Spine: [9, 14, 0], Hips: [4, -4, 0], Head: [8, -14, 0], Hips_pos: [0, -0.16, 0], ThighL: [-36, -4, 0], ShinL: [42, 0, 0], ThighR: [28, 6, 0], ShinR: [54, 0, 0] }, 'snap'),
      K(0.44, { UpArmR: [-72, 10, -2], LoArmR: [-10, 0, 0], HandR: [-30, -140, 0], Chest: [12, 26, 0], Hips_pos: [0, -0.16, 0] }, 'hold'),
      K(0.82, {}, 'out')
    ]
  },

  // TECH / quick-rise: jump timed onto the floor. Legs whip under the hips and
  // the whole body springs back to stance in a quarter of a second — the
  // opposite read of the slow, heavy `getup`.
  techRise: {
    dur: 0.3, loop: false, keys: [
      K(0, { Hips: [-78, 4, 0], Hips_pos: [0, -0.66, -0.12], Spine: [-8, -2, 0], Head: [-10, 0, 0], ThighL: [60, -4, 0], ShinL: [20, 0, 0], ThighR: [70, 6, 0], ShinR: [28, 0, 0], UpArmL: [-36, 0, 60], LoArmL: [-14, 0, 6], UpArmR: [-26, 0, -64], LoArmR: [-10, 0, -6] }),
      K(0.10, { Hips: [-64, 8, 0], Hips_pos: [0, -0.54, 0.05], Spine: [6, -2, 0], Head: [12, 0, 0], ThighL: [112, -4, 0], ShinL: [82, 0, 0], ThighR: [118, 6, 0], ShinR: [88, 0, 0], UpArmL: [38, 6, 48], LoArmL: [-24, 0, 6], UpArmR: [44, -6, -52], LoArmR: [-20, 0, -6] }, 'in'),
      K(0.19, { Hips: [-8, 22, 0], Hips_pos: [0, -0.11, 0], Spine: [14, -6, 0], Chest: [9, -9, 0], Head: [4, -8, 0], ThighL: [-46, -4, 0], ShinL: [62, 0, 0], ThighR: [12, 6, 0], ShinR: [42, 0, 0], UpArmL: [-56, 10, 26], LoArmL: [-80, 0, 6], UpArmR: [-48, -8, -28], LoArmR: [-86, 0, -6] }, 'snap'),
      K(0.3, {}, 'out')
    ]
  },

  // TRANSFIGURED — the victim of Mahito's domain payload, played by ANY
  // character (shared skeleton = free retarget). Stylized, not gory: the body
  // seizes, wrenches through wrong angles as the soul is reshaped, then folds.
  // The KO itself lands when the cinematic ends (domains._tickTransfigKO).
  transfigured: {
    dur: 2.0, loop: false, keys: [
      K(0, {}),
      K(0.15, { Spine: [-14, -4, 0], Chest: [-12, -6, 0], Head: [-24, -8, 0], UpArmL: [-80, 10, 50], LoArmL: [-30, 0, 6], UpArmR: [-70, -8, -56], LoArmR: [-24, 0, -6], HandL: [-60, 0, 0], HandR: [-60, 0, 0], Hips_pos: [0, -0.02, 0] }, 'snap'),
      // the wrongness: joints pulling in directions joints do not go
      K(0.5, { Spine: [10, 24, -14], Chest: [8, 18, 10], Head: [18, -30, 22], Neck: [10, 12, -8], UpArmL: [-120, 40, 70], LoArmL: [-10, 0, 6], UpArmR: [30, -30, -70], LoArmR: [-100, 0, -6], Hips: [-6, 40, 8], ThighL: [-30, -14, 0], ShinL: [40, 0, 0], Hips_pos: [0, -0.08, 0] }, 'snap'),
      K(0.9, { Spine: [-8, -20, 16], Chest: [-6, -14, -12], Head: [-26, 24, -18], Neck: [-8, -10, 6], UpArmL: [20, -20, 80], LoArmL: [-90, 0, 6], UpArmR: [-130, 30, -60], LoArmR: [-16, 0, -6], Hips: [4, 4, -10], ThighR: [-24, 18, 0], ShinR: [34, 0, 0], Hips_pos: [0, -0.05, 0] }, 'snap'),
      K(1.25, { Spine: [16, 10, -8], Head: [22, -12, 14], UpArmL: [-100, 20, 60], UpArmR: [-90, -16, -64], Hips_pos: [0, -0.12, 0], ThighL: [-40, -6, 0], ShinL: [50, 0, 0], ThighR: [-30, 8, 0], ShinR: [46, 0, 0] }, 'snap'),
      // the fold: it's over
      K(1.7, { Hips: [-70, 6, 0], Hips_pos: [0, -0.58, -0.1], Spine: [-10, -2, 0], Chest: [-6, -2, 0], Head: [-14, 6, 0], ThighL: [52, -4, 0], ShinL: [22, 0, 0], ThighR: [62, 6, 0], ShinR: [32, 0, 0], UpArmL: [-46, 0, 68], LoArmL: [-12, 0, 6], UpArmR: [-22, 0, -72], LoArmR: [-8, 0, -6] }, 'out'),
      K(2.0, { Hips: [-84, 2, 0], Hips_pos: [0, -0.72, -0.15], Spine: [-4, 0, 0], Head: [-8, 12, 0], ThighL: [70, -6, 4], ShinL: [12, 0, 0], ThighR: [78, 8, -4], ShinR: [18, 0, 0], UpArmL: [-44, 0, 76], UpArmR: [-16, 0, -78] }, 'out')
    ]
  },

  // DEVOURED — the victim of Kurourushi's DEVOUR grab, played by ANY character
  // for the same reason `transfigured` is: any of them can be the one in the
  // maw, and authoring it once on the shared skeleton means the whole roster
  // (and Mahoraga, at twice the height) gets it correctly retargeted for free.
  //
  // STYLIZED, NOT GORY. There is no blood, nothing comes off, and the camera
  // never gets a reason to look for a wound. What sells it is entirely
  // POSTURE: the body is seized side-on and lifted off its feet, the limbs
  // splay and lose all authority, there are two hard shakes, and then it is
  // simply dropped — the legs are still running when it hits the floor. The
  // horror is that the victim is being HANDLED, not that they are being cut.
  devoured: {
    dur: 1.3, loop: false, keys: [
      K(0, {}),
      // seized: the whole body jerks sideways and up, feet leaving the floor
      K(0.10, {
        Hips: [-8, 36, -18], Hips_pos: [0, 0.12, -0.08],
        Spine: [-16, 10, 14], Chest: [-12, 6, 10], Neck: [-10, -6, -8], Head: [-24, -14, -12],
        ThighL: [-52, -14, 0], ShinL: [72, 0, 0], FootL: [-16, -8, 0],
        ThighR: [-30, 16, 0], ShinR: [58, 0, 0], FootR: [-12, 8, 0],
        UpArmL: [-96, 22, 52], LoArmL: [-46, 0, 6], HandL: [-40, 50, 0],
        UpArmR: [-84, -20, -56], LoArmR: [-40, 0, -6], HandR: [-40, -50, 0]
      }, 'snap'),
      // shake one
      K(0.30, {
        Hips: [-14, 20, -26], Hips_pos: [0, 0.14, -0.10],
        Spine: [-8, -14, 20], Chest: [-6, -10, 16], Head: [-14, 22, -18],
        ThighL: [-70, -18, 0], ShinL: [46, 0, 0], ThighR: [-16, 20, 0], ShinR: [80, 0, 0],
        UpArmL: [-112, 16, 40], UpArmR: [-70, -14, -68]
      }, 'snap'),
      // shake two, the other way
      K(0.48, {
        Hips: [-4, 48, -10], Hips_pos: [0, 0.15, -0.09],
        Spine: [-20, 18, 8], Chest: [-14, 14, 4], Head: [-30, -26, -6],
        ThighL: [-22, -10, 0], ShinL: [84, 0, 0], ThighR: [-66, 12, 0], ShinR: [44, 0, 0],
        UpArmL: [-72, 20, 66], UpArmR: [-108, -18, -42]
      }, 'snap'),
      // the pause. Nothing is moving and it lasts a fraction too long.
      K(0.74, {
        Hips: [-6, 44, -12], Hips_pos: [0, 0.145, -0.09],
        Spine: [-18, 16, 9], Head: [-28, -22, -7],
        ThighL: [-26, -10, 0], ShinL: [80, 0, 0], ThighR: [-62, 12, 0], ShinR: [48, 0, 0],
        UpArmL: [-74, 20, 64], UpArmR: [-106, -18, -44]
      }, 'hold'),
      // dropped — the legs are still going when they hit
      K(0.92, {
        Hips: [-46, 20, -6], Hips_pos: [0, -0.38, -0.06],
        Spine: [10, 6, 4], Chest: [6, 4, 2], Head: [14, 8, -4],
        ThighL: [-48, -8, 0], ShinL: [66, 0, 0], ThighR: [-10, 10, 0], ShinR: [74, 0, 0],
        UpArmL: [-40, 6, 50], LoArmL: [-30, 0, 6], UpArmR: [-34, -6, -54], LoArmR: [-26, 0, -6]
      }, 'in'),
      K(1.3, {
        Hips: [-84, 4, 0], Hips_pos: [0, -0.72, -0.16], Spine: [-6, 0, 0], Chest: [-3, 0, 0],
        Head: [-8, 10, 0], ThighL: [68, -6, 4], ShinL: [14, 0, 0], ThighR: [76, 8, -4], ShinR: [20, 0, 0],
        UpArmL: [-44, 0, 74], LoArmL: [-10, 0, 6], UpArmR: [-18, 0, -78], LoArmR: [-8, 0, -6],
        HandL: [0, 0, 0], HandR: [0, 0, 0]
      }, 'out')
    ]
  },

  // ---- DEADLY SENTENCING: the victim's side ------------------------------
  // All three live in the BASE set, not in Higuruma's, because ANY character
  // can be the one under the blade — and like `transfigured`, authoring them
  // on the shared skeleton means every fighter in the roster (and Mahoraga,
  // at twice the height) gets them for free and correctly retargeted.

  // SENTENCED — the hold while the execution duel runs. Driven to their knees
  // by the thrust, one hand on the floor, the other up in front of their face:
  // still fighting it, and losing. Loops for as long as the contest does.
  sentenced: {
    dur: 1.1, loop: true, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Neck: [-6, -2, 0], Head: [-14, -4, 0],
        ThighL: [-84, -6, 0], ShinL: [96, 0, 0], FootL: [26, -10, 0],
        ThighR: [-30, 8, 0], ShinR: [112, 0, 0], FootR: [18, 8, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], HandL: [-30, 40, 0],
        UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6], HandR: [-34, -40, 0]
      }),
      K(0.55, {
        Hips: [-19, 14, 0], Hips_pos: [0, -0.45, 0.02], Spine: [25, -6, 0], Head: [-11, -4, 0],
        UpArmL: [-36, 10, 33], UpArmR: [-88, -14, -29], LoArmR: [-84, 0, -6]
      }),
      K(1.1, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Head: [-14, -4, 0],
        UpArmL: [-40, 10, 30], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6]
      })
    ]
  },

  // EXECUTED — the sentence is carried out. Deliberately ABRUPT and NOT gory:
  // the blade lands, one hard convulsion straight up through the spine, a beat
  // of absolute stillness (the read is the stillness, not the impact), and the
  // body goes out of the pose all at once and folds sideways to the floor. It
  // ends on the same settled shape as `ko` so the aftermath frames identically
  // whoever it happened to.
  executed: {
    dur: 1.6, loop: false, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Head: [-14, -4, 0], ThighL: [-84, -6, 0], ShinL: [96, 0, 0], ThighR: [-30, 8, 0], ShinR: [112, 0, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6]
      }),
      // the jolt: everything snaps rigid and straight for two frames
      K(0.05, {
        Hips: [-4, 12, 0], Hips_pos: [0, -0.34, 0], Spine: [-6, -2, 0], Chest: [-8, -2, 0],
        Neck: [-10, 0, 0], Head: [-22, 0, 0],
        ThighL: [-70, -4, 0], ShinL: [80, 0, 0], ThighR: [-22, 6, 0], ShinR: [96, 0, 0],
        UpArmL: [-16, 4, 62], LoArmL: [-8, 0, 4], HandL: [0, 0, 0],
        UpArmR: [-14, -4, -64], LoArmR: [-6, 0, -4], HandR: [0, 0, 0]
      }, 'snap'),
      // stillness. This hold is the whole shot.
      K(0.42, {
        Hips: [-5, 12, 0], Hips_pos: [0, -0.35, 0], Spine: [-5, -2, 0], Head: [-21, 0, 0],
        ThighL: [-70, -4, 0], ShinL: [80, 0, 0], ThighR: [-22, 6, 0], ShinR: [96, 0, 0],
        UpArmL: [-15, 4, 61], UpArmR: [-13, -4, -63]
      }, 'hold'),
      // and then nothing is holding it up
      K(0.72, {
        Hips: [-40, 18, -6], Hips_pos: [0, -0.52, -0.04], Spine: [14, -6, 8], Chest: [10, -6, 6],
        Head: [16, 10, -10], Neck: [8, 4, -4],
        ThighL: [-40, -8, 0], ShinL: [58, 0, 0], ThighR: [8, 10, 0], ShinR: [72, 0, 0],
        UpArmL: [-30, 0, 46], LoArmL: [-24, 0, 6], UpArmR: [-24, 0, -50], LoArmR: [-20, 0, -6]
      }, 'in'),
      K(1.05, {
        Hips: [-74, 8, 0], Hips_pos: [0, -0.66, -0.12], Spine: [-6, -2, 0], Chest: [-4, -2, 0],
        Head: [-10, 8, 0], ThighL: [58, -4, 0], ShinL: [20, 0, 0], ThighR: [68, 6, 0], ShinR: [30, 0, 0],
        UpArmL: [-48, 0, 72], LoArmL: [-10, 0, 6], UpArmR: [-20, 0, -76], LoArmR: [-8, 0, -6]
      }, 'out'),
      K(1.6, {
        Hips: [-86, 2, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-4, 0, 0], Chest: [-2, 0, 0],
        Head: [-6, 14, 0], ThighL: [72, -6, 4], ShinL: [10, 0, 0], ThighR: [80, 8, -4], ShinR: [16, 0, 0],
        UpArmL: [-46, 0, 78], LoArmL: [-8, 0, 6], UpArmR: [-16, 0, -80], LoArmR: [-6, 0, -6],
        HandL: [0, 0, 0], HandR: [0, 0, 0]
      }, 'out')
    ]
  },

  // EXEC ESCAPE — they win the contest. A coiled leg drives out of the kneel
  // into the executioner's chest and they roll clear of the blade. Explosive,
  // one beat, no flourish: this is a body refusing a verdict.
  execEscape: {
    dur: 0.85, loop: false, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Head: [-14, -4, 0], ThighL: [-84, -6, 0], ShinL: [96, 0, 0], ThighR: [-30, 8, 0], ShinR: [112, 0, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6]
      }),
      // coil
      K(0.10, {
        Hips: [-24, 16, 0], Hips_pos: [0, -0.50, 0.06], Spine: [30, -6, 0], Head: [-6, -4, 0],
        ThighL: [-108, -6, 0], ShinL: [120, 0, 0], ThighR: [-40, 8, 0], ShinR: [126, 0, 0],
        UpArmL: [-24, 10, 26], LoArmL: [-70, 0, 6], UpArmR: [-70, -14, -22], LoArmR: [-96, 0, -6]
      }, 'in'),
      // the kick — the leg goes through where he is standing
      K(0.22, {
        Hips: [-34, 12, 0], Hips_pos: [0, -0.40, -0.06], Spine: [-10, -4, 0], Chest: [-14, -6, 0],
        Head: [-20, 0, 0], Neck: [-8, 0, 0],
        ThighL: [-128, -4, 0], ShinL: [10, 0, 0], FootL: [-24, -8, 0],
        ThighR: [-30, 8, 0], ShinR: [104, 0, 0],
        UpArmL: [-20, 6, 54], LoArmL: [-20, 0, 6], UpArmR: [-16, -6, -58], LoArmR: [-18, 0, -6]
      }, 'snap'),
      K(0.30, {
        Hips: [-34, 12, 0], Hips_pos: [0, -0.40, -0.06], ThighL: [-126, -4, 0], ShinL: [12, 0, 0],
        Spine: [-10, -4, 0], Head: [-19, 0, 0]
      }, 'hold'),
      // and back onto their feet, guard up, breathing hard
      K(0.58, {
        Hips: [-6, 20, 0], Hips_pos: [0, -0.16, 0], Spine: [14, -6, 0], Chest: [10, -9, 0],
        Head: [4, -8, 0], ThighL: [-40, -4, 0], ShinL: [54, 0, 0], ThighR: [14, 6, 0], ShinR: [40, 0, 0],
        UpArmL: [-58, 12, 22], LoArmL: [-92, 0, 6], UpArmR: [-50, -10, -24], LoArmR: [-98, 0, -6]
      }, 'out'),
      K(0.85, {}, 'out')
    ]
  },

  // generic quick cast (Yuta's copy, fallbacks)
  cast: {
    dur: 0.5, loop: false, keys: [
      K(0, {}),
      K(0.1, { UpArmR: [-30, -16, -20], LoArmR: [-110, 0, -6], Chest: [2, -20, 0], Hips: [0, 32, 0] }, 'in'),
      K(0.2, { UpArmR: [-92, 6, 0], LoArmR: [-10, 0, 0], HandR: [-90, 0, 0], Chest: [4, 14, 0], Hips: [0, 8, 0], Head: [0, -14, 0] }, 'snap'),
      K(0.32, { UpArmR: [-92, 6, 0], LoArmR: [-12, 0, 0], HandR: [-90, 0, 0] }, 'hold'),
      K(0.5, {}, 'out')
    ]
  }
};
