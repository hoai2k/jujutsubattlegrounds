// SUKUNA-specific clips.
//
// MOVEMENT LANGUAGE: economical and unhurried. He never looks like he is
// trying. There is almost no anticipation in anything he does — the strike
// simply happens and the arm comes back — and the hips barely move, because
// nothing here is worth putting his weight behind. The deliberate contrast is
// against Yuji's whole-body commitment and Todo's mass: those two swing,
// Sukuna reaches out and something is cut.
//
// FOUR ARMS. The whole base set is re-authored here rather than inherited,
// because the shared clips only know about two. The rule followed throughout:
//   · the UPPER pair leads — it strikes, it guards, it gestures
//   · the LOWER pair is never decoration. It counterweights (swinging opposite
//     the upper pair through the walk and run), it layers the slashes a beat
//     behind the upper ones, and it does the idle work the upper pair is too
//     bored to do — a lower hand flexing, an arm folding behind his back
//   · nothing ever moves all four in unison except the heavy and the domain
//     cast, so those two land as the moments they are meant to be
//
// Bone names for the second pair are the shared ones with a '2' suffix:
// ClavL2 / UpArmL2 / LoArmL2 / HandL2 and the R2 mirror. AnimPlayer skips a
// bone the model does not have, so nothing here can break another character.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — upright, weight back, chin up. The upper arms hang almost relaxed
// (a much lower guard than the roster's) and the lower pair sits wide and
// open, palms turned back. It is not a fighting stance; it is a man waiting
// for you to finish.
export const SUKUNA_STANCE = {
  Hips_pos: [0, -0.030, 0],
  Hips: [0, 20, 0], Spine: [-1, -6, 0], Chest: [-2, -9, 0], Neck: [3, -3, 0], Head: [-4, -7, 0],
  ClavL: [0, 0, 0], UpArmL: [-14, 8, 8], LoArmL: [-78, 22, 0], HandL: [-18, 60, 0],
  ClavR: [0, 0, 0], UpArmR: [-8, -6, -10], LoArmR: [-84, -20, 0], HandR: [-20, -60, 0],
  // The LOWER pair sits forward and further out than the upper pair on
  // purpose: at matched angles the two hid inside each other and the model
  // read as two arms with spare elbows.
  ClavL2: [0, 0, 0], UpArmL2: [-46, 12, 42], LoArmL2: [-52, 20, 8], HandL2: [-12, 44, 0],
  ClavR2: [0, 0, 0], UpArmR2: [-40, -10, -44], LoArmR2: [-58, -18, -8], HandR2: [-12, -44, 0],
  ThighL: [-14, -4, 0], ShinL: [12, 0, 0], FootL: [2, -10, 0],
  ThighR: [10, 6, 0], ShinR: [16, 0, 0], FootR: [8, 8, 0]
};

export const SUKUNA_CLIPS = {
  // ---- LOCOMOTION ---------------------------------------------------------
  // idle: the breath is in the chest and almost nowhere else. The lower left
  // hand opens and closes once a cycle — the only impatience he shows.
  idle: {
    dur: 3.6, loop: true, keys: [
      K(0, {}),
      K(1.1, {
        Chest: [-1, -9, 0], Spine: [0, -6, 0], Hips_pos: [0, -0.038, 0],
        UpArmL: [-18, 8, 12], UpArmR: [-11, -6, -14], Head: [-3, -4, 0],
        UpArmL2: [4, 10, 26], LoArmL2: [-44, 18, 4], HandL2: [-28, 40, 0]
      }),
      K(2.2, {
        Chest: [-3, -9, 0], Head: [-5, -11, 0], Hips_pos: [0, -0.026, 0],
        UpArmL2: [7, 10, 23], LoArmL2: [-30, 18, 4], HandL2: [-4, 40, 0],
        UpArmR2: [12, -8, -27], LoArmR2: [-46, -16, -4]
      }),
      K(3.6, {})
    ]
  },

  // walk: an unhurried stroll. The upper arms barely swing; the LOWER pair
  // does the counterweighting, which is what makes the gait read as wrong.
  walk: {
    dur: 0.94, loop: true, keys: [
      K(0, {
        ThighL: [-26, -4, 0], ShinL: [10, 0, 0], FootL: [-6, -10, 0],
        ThighR: [20, 6, 0], ShinR: [26, 0, 0], FootR: [12, 8, 0], Hips_pos: [0, -0.034, 0],
        UpArmL: [-20, 8, 11], UpArmR: [-4, -6, -13],
        UpArmL2: [16, 10, 24], LoArmL2: [-30, 18, 4],
        UpArmR2: [-2, -8, -26], LoArmR2: [-46, -16, -4]
      }),
      K(0.235, { ThighL: [-4, -4, 0], ShinL: [18, 0, 0], ThighR: [2, 6, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.016, 0] }),
      K(0.47, {
        ThighL: [20, -4, 0], ShinL: [24, 0, 0], FootL: [10, -10, 0],
        ThighR: [-24, 6, 0], ShinR: [12, 0, 0], FootR: [-6, 8, 0], Hips_pos: [0, -0.034, 0],
        UpArmL: [-6, 8, 11], UpArmR: [-18, -6, -13],
        UpArmL2: [-2, 10, 24], LoArmL2: [-46, 18, 4],
        UpArmR2: [18, -8, -26], LoArmR2: [-30, -16, -4]
      }),
      K(0.705, { ThighL: [0, -4, 0], ShinL: [14, 0, 0], ThighR: [-6, 6, 0], ShinR: [20, 0, 0], Hips_pos: [0, -0.016, 0] }),
      K(0.94, {
        ThighL: [-26, -4, 0], ShinL: [10, 0, 0], FootL: [-6, -10, 0],
        ThighR: [20, 6, 0], ShinR: [26, 0, 0], FootR: [12, 8, 0], Hips_pos: [0, -0.034, 0],
        UpArmL: [-20, 8, 11], UpArmR: [-4, -6, -13],
        UpArmL2: [16, 10, 24], LoArmL2: [-30, 18, 4],
        UpArmR2: [-2, -8, -26], LoArmR2: [-46, -16, -4]
      })
    ]
  },

  // run: he still does not commit. The torso tips a little, the upper arms
  // trail back rather than pumping, and the lower pair is pinned behind him
  // like a coat in the wind.
  run: {
    dur: 0.54, loop: true, keys: [
      K(0, {
        Spine: [11, -4, 0], Chest: [6, -6, 0], Hips: [3, 12, 0], Hips_pos: [0, -0.022, 0],
        ThighL: [-50, -2, 0], ShinL: [22, 0, 0], FootL: [-12, -6, 0],
        ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [28, 6, 0],
        UpArmL: [-8, 8, 12], LoArmL: [-72, 18, 0],
        UpArmR: [34, -6, -14], LoArmR: [-52, -16, 0],
        UpArmL2: [40, 10, 20], LoArmL2: [-26, 16, 4],
        UpArmR2: [34, -8, -22], LoArmR2: [-30, -14, -4]
      }),
      K(0.135, { Spine: [10, -4, 0], ThighL: [-8, -2, 0], ShinL: [28, 0, 0], ThighR: [-14, 4, 0], ShinR: [38, 0, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.27, {
        Spine: [11, -4, 0], Chest: [6, -6, 0], Hips: [3, 12, 0], Hips_pos: [0, -0.022, 0],
        ThighL: [32, -2, 0], ShinL: [62, 0, 0], FootL: [28, -6, 0],
        ThighR: [-50, 4, 0], ShinR: [22, 0, 0], FootR: [-12, 6, 0],
        UpArmL: [30, 8, 12], LoArmL: [-52, 18, 0],
        UpArmR: [-4, -6, -14], LoArmR: [-72, -16, 0],
        UpArmL2: [34, 10, 20], LoArmL2: [-30, 16, 4],
        UpArmR2: [40, -8, -22], LoArmR2: [-26, -14, -4]
      }),
      K(0.405, { Spine: [10, -4, 0], ThighL: [-14, -2, 0], ShinL: [38, 0, 0], ThighR: [-8, 4, 0], ShinR: [28, 0, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.54, {
        Spine: [11, -4, 0], Hips: [3, 12, 0], Hips_pos: [0, -0.022, 0],
        ThighL: [-50, -2, 0], ShinL: [22, 0, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0],
        UpArmL: [-8, 8, 12], UpArmR: [34, -6, -14],
        UpArmL2: [40, 10, 20], UpArmR2: [34, -8, -22]
      })
    ]
  },

  // dash: LB is pure movement — no invulnerability anywhere in it. All four
  // arms sweep back at once and the body knifes forward.
  dash: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.07, {
        Spine: [20, -4, 0], Chest: [12, -6, 0], Hips_pos: [0, -0.10, 0],
        ThighL: [-46, -4, 0], ShinL: [28, 0, 0], ThighR: [28, 6, 0], ShinR: [52, 0, 0],
        UpArmL: [46, 8, 16], LoArmL: [-30, 14, 0], UpArmR: [50, -6, -18], LoArmR: [-26, -12, 0],
        UpArmL2: [56, 10, 18], LoArmL2: [-18, 14, 4], UpArmR2: [58, -8, -20], LoArmR2: [-16, -12, -4]
      }, 'out'),
      K(0.34, {
        Spine: [15, -5, 0], Hips_pos: [0, -0.07, 0],
        ThighL: [-36, -4, 0], ShinL: [24, 0, 0], ThighR: [20, 6, 0], ShinR: [40, 0, 0],
        UpArmL: [26, 8, 14], UpArmR: [30, -6, -16], UpArmL2: [34, 10, 20], UpArmR2: [36, -8, -22]
      })
    ]
  },

  jump: {
    dur: 0.5, loop: false, keys: [
      K(0, { Hips_pos: [0, -0.14, 0], Spine: [14, -6, 0], ThighL: [-48, -4, 0], ShinL: [52, 0, 0], ThighR: [-40, 6, 0], ShinR: [56, 0, 0] }),
      K(0.15, {
        Hips_pos: [0, 0.03, 0], Spine: [-8, -6, 0], Chest: [-6, -9, 0],
        ThighL: [-26, -4, 0], ShinL: [28, 0, 0], FootL: [22, -10, 0], ThighR: [8, 6, 0], ShinR: [32, 0, 0],
        UpArmL: [-58, 8, 26], LoArmL: [-42, 18, 0], UpArmR: [-50, -6, -28], LoArmR: [-48, -16, 0],
        UpArmL2: [-30, 10, 36], LoArmL2: [-24, 16, 4], UpArmR2: [-24, -8, -38], LoArmR2: [-28, -14, -4]
      }, 'out'),
      K(0.5, {
        Hips_pos: [0, 0, 0], ThighL: [-42, -4, 0], ShinL: [54, 0, 0], ThighR: [-18, 6, 0], ShinR: [40, 0, 0],
        UpArmL: [-46, 8, 22], UpArmR: [-38, -6, -24], UpArmL2: [-20, 10, 32], UpArmR2: [-16, -8, -34]
      })
    ]
  },

  fall: {
    dur: 0.72, loop: true, keys: [
      K(0, {
        ThighL: [-34, -4, 0], ShinL: [38, 0, 0], ThighR: [-10, 6, 0], ShinR: [28, 0, 0], Spine: [5, -6, 0],
        UpArmL: [-56, 8, 34], LoArmL: [-38, 18, 0], UpArmR: [-46, -6, -36], LoArmR: [-44, -16, 0],
        UpArmL2: [-24, 10, 40], LoArmL2: [-22, 16, 4], UpArmR2: [-18, -8, -42], LoArmR2: [-26, -14, -4]
      }),
      K(0.36, {
        ThighL: [-28, -4, 0], ThighR: [-18, 6, 0],
        UpArmL: [-50, 8, 30], UpArmR: [-52, -6, -32],
        UpArmL2: [-30, 10, 44], UpArmR2: [-12, -8, -38]
      }),
      K(0.72, {
        ThighL: [-34, -4, 0], ThighR: [-10, 6, 0],
        UpArmL: [-56, 8, 34], UpArmR: [-46, -6, -36],
        UpArmL2: [-24, 10, 40], UpArmR2: [-18, -8, -42]
      })
    ]
  },

  land: {
    dur: 0.24, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.17, 0], Spine: [18, -6, 0], Chest: [10, -9, 0],
        ThighL: [-56, -4, 0], ShinL: [66, 0, 0], ThighR: [-36, 6, 0], ShinR: [60, 0, 0],
        UpArmL: [-24, 8, 20], UpArmR: [-16, -6, -22],
        UpArmL2: [20, 10, 30], LoArmL2: [-20, 16, 4], UpArmR2: [24, -8, -32], LoArmR2: [-24, -14, -4]
      }, 'snap'),
      K(0.24, {})
    ]
  },

  // ---- GUARD ---------------------------------------------------------------
  // Average guard, and it looks average: the UPPER pair crosses in front, and
  // the lower pair braces at the ribs. Two arms doing the work of two.
  block: {
    dur: 0.16, loop: false, keys: [
      K(0, {}),
      K(0.11, {
        UpArmL: [-72, 24, 8], LoArmL: [-112, 28, 0], HandL: [-18, 92, 0],
        UpArmR: [-66, -20, -10], LoArmR: [-118, -26, 0], HandR: [-18, -92, 0],
        UpArmL2: [-30, 12, 26], LoArmL2: [-86, 20, 4], HandL2: [-16, 60, 0],
        UpArmR2: [-26, -10, -28], LoArmR2: [-90, -18, -4], HandR2: [-16, -60, 0],
        Spine: [6, -6, 0], Chest: [4, -9, 0], Head: [6, -7, 0], Hips_pos: [0, -0.062, 0],
        ThighL: [-18, -4, 0], ShinL: [18, 0, 0]
      }, 'out'),
      K(0.16, {
        UpArmL: [-72, 24, 8], LoArmL: [-112, 28, 0], UpArmR: [-66, -20, -10], LoArmR: [-118, -26, 0],
        UpArmL2: [-30, 12, 26], LoArmL2: [-86, 20, 4], UpArmR2: [-26, -10, -28], LoArmR2: [-90, -18, -4],
        Hips_pos: [0, -0.062, 0]
      })
    ]
  },

  blockHit: {
    dur: 0.2, loop: false, keys: [
      K(0, {
        UpArmL: [-72, 24, 8], LoArmL: [-112, 28, 0], UpArmR: [-66, -20, -10], LoArmR: [-118, -26, 0],
        UpArmL2: [-30, 12, 26], LoArmL2: [-86, 20, 4], UpArmR2: [-26, -10, -28], LoArmR2: [-90, -18, -4],
        Hips_pos: [0, -0.062, 0], Spine: [6, -6, 0]
      }),
      K(0.05, {
        UpArmL: [-58, 24, 8], LoArmL: [-104, 28, 0], UpArmR: [-54, -20, -10], LoArmR: [-110, -26, 0],
        UpArmL2: [-18, 12, 28], LoArmL2: [-78, 20, 4], UpArmR2: [-14, -10, -30], LoArmR2: [-82, -18, -4],
        Spine: [13, -6, 0], Head: [10, -7, 0], Hips_pos: [0, -0.078, 0]
      }, 'snap'),
      K(0.2, {
        UpArmL: [-72, 24, 8], LoArmL: [-112, 28, 0], UpArmR: [-66, -20, -10], LoArmR: [-118, -26, 0],
        UpArmL2: [-30, 12, 26], UpArmR2: [-26, -10, -28], Hips_pos: [0, -0.062, 0]
      })
    ]
  },

  guardBreak: {
    dur: 0.95, loop: false, keys: [
      K(0, {
        UpArmL: [-72, 24, 8], LoArmL: [-112, 28, 0], UpArmR: [-66, -20, -10], LoArmR: [-118, -26, 0],
        UpArmL2: [-30, 12, 26], UpArmR2: [-26, -10, -28]
      }),
      K(0.12, {
        UpArmL: [-86, 8, 62], LoArmL: [-26, 0, 6], UpArmR: [-76, -6, -68], LoArmR: [-20, 0, -6],
        UpArmL2: [-52, 8, 66], LoArmL2: [-14, 0, 4], UpArmR2: [-44, -6, -70], LoArmR2: [-12, 0, -4],
        Spine: [-16, -4, 0], Chest: [-10, -6, 0], Head: [-14, -6, 0], Hips_pos: [0, -0.01, 0]
      }, 'snap'),
      K(0.32, {
        UpArmL: [-80, 8, 56], UpArmR: [-70, -6, -62], UpArmL2: [-46, 8, 60], UpArmR2: [-38, -6, -64],
        Spine: [-13, -4, 0], Head: [-11, -6, 0]
      }, 'hold'),
      K(0.72, {
        Spine: [-6, -5, 0], UpArmL: [-52, 8, 28], UpArmR: [-42, -6, -32],
        UpArmL2: [-20, 10, 34], UpArmR2: [-14, -8, -36], Hips_pos: [0, -0.04, 0]
      }),
      K(0.95, {})
    ]
  },

  // ---- REACTIONS -----------------------------------------------------------
  // He is not used to this. The recoil is SMALL and the recovery is fast —
  // being hit reads as an inconvenience, not a crisis.
  hitLight: {
    dur: 0.28, loop: false, keys: [
      K(0, {}),
      K(0.05, {
        Head: [-11, -12, 0], Neck: [-6, -3, 0], Chest: [-6, -12, 0], Spine: [-4, -7, 0],
        UpArmL: [-22, 8, 16], UpArmR: [-16, -6, -18],
        UpArmL2: [-2, 10, 30], UpArmR2: [2, -8, -32], Hips_pos: [0, -0.020, 0]
      }, 'snap'),
      K(0.12, { Head: [-8, -10, 0], Chest: [-5, -11, 0] }, 'hold'),
      K(0.28, {})
    ]
  },

  hitHeavy: {
    dur: 0.52, loop: false, keys: [
      K(0, {}),
      K(0.06, {
        Head: [-24, -8, 5], Neck: [-12, -3, 0], Chest: [-20, -11, 0], Spine: [-14, -5, 0], Hips: [-5, 17, 0],
        UpArmL: [-80, 8, 40], LoArmL: [-20, 14, 0], UpArmR: [-64, -6, -46], LoArmR: [-16, -12, 0],
        UpArmL2: [-40, 10, 48], LoArmL2: [-14, 14, 4], UpArmR2: [-32, -8, -52], LoArmR2: [-12, -12, -4],
        ThighL: [-28, -4, 0], ShinL: [20, 0, 0], Hips_pos: [0, -0.012, 0]
      }, 'snap'),
      K(0.2, {
        Head: [-19, -8, 4], Chest: [-16, -11, 0], Spine: [-11, -5, 0],
        UpArmL: [-72, 8, 36], UpArmR: [-58, -6, -42], UpArmL2: [-34, 10, 44], UpArmR2: [-26, -8, -48]
      }, 'hold'),
      K(0.52, {})
    ]
  },

  launched: {
    dur: 0.8, loop: true, keys: [
      K(0, {
        Spine: [-28, -4, 0], Chest: [-16, -6, 0], Head: [-20, -6, 0], Hips: [-18, 14, 0],
        ThighL: [-62, -4, 0], ShinL: [48, 0, 0], ThighR: [-28, 6, 0], ShinR: [62, 0, 0],
        UpArmL: [-104, 8, 38], LoArmL: [-26, 14, 0], UpArmR: [-86, -6, -44], LoArmR: [-32, -12, 0],
        UpArmL2: [-62, 10, 50], LoArmL2: [-18, 14, 4], UpArmR2: [-54, -8, -54], LoArmR2: [-22, -12, -4]
      }),
      K(0.4, {
        Spine: [-34, -4, 0], Hips: [-24, 14, 0], ThighL: [-50, -4, 0], ThighR: [-38, 6, 0],
        UpArmL: [-96, 8, 44], UpArmR: [-96, -6, -38], UpArmL2: [-54, 10, 56], UpArmR2: [-62, -8, -48]
      }),
      K(0.8, {
        Spine: [-28, -4, 0], Hips: [-18, 14, 0], ThighL: [-62, -4, 0], ThighR: [-28, 6, 0],
        UpArmL: [-104, 8, 38], UpArmR: [-86, -6, -44], UpArmL2: [-62, 10, 50], UpArmR2: [-54, -8, -54]
      })
    ]
  },

  knockdown: {
    dur: 0.5, loop: false, keys: [
      K(0, { Spine: [-22, -4, 0], Hips: [-18, 12, 0], Hips_pos: [0, -0.09, 0] }),
      K(0.22, {
        Hips: [-68, 6, 0], Hips_pos: [0, -0.62, -0.10], Spine: [-12, -2, 0], Chest: [-6, -2, 0], Head: [-16, 0, 0],
        ThighL: [-2, -4, 0], ShinL: [14, 0, 0], ThighR: [4, 6, 0], ShinR: [22, 0, 0],
        UpArmL: [-38, 0, 54], LoArmL: [-18, 0, 6], UpArmR: [-28, 0, -58], LoArmR: [-14, 0, -6],
        UpArmL2: [-14, 0, 66], LoArmL2: [-10, 0, 4], UpArmR2: [-6, 0, -70], LoArmR2: [-8, 0, -4]
      }, 'snap'),
      K(0.5, {
        Hips: [-80, 4, 0], Hips_pos: [0, -0.72, -0.14], Spine: [-6, -2, 0], Head: [-8, 0, 0],
        ThighL: [-12, -4, 0], ShinL: [8, 0, 0], ThighR: [-6, 6, 0], ShinR: [14, 0, 0],
        UpArmL: [-34, 0, 60], UpArmR: [-24, 0, -64], UpArmL2: [-10, 0, 72], UpArmR2: [-2, 0, -76]
      }, 'out')
    ]
  },

  // getup: he does not scramble. The two LOWER arms plant and push the whole
  // body up in one motion while the upper pair stays exactly where it was.
  getup: {
    dur: 0.6, loop: false, keys: [
      K(0, {
        Hips: [-80, 4, 0], Hips_pos: [0, -0.72, -0.14],
        ThighL: [-12, -4, 0], ShinL: [8, 0, 0], ThighR: [-6, 6, 0], ShinR: [14, 0, 0],
        UpArmL: [-34, 0, 60], UpArmR: [-24, 0, -64], UpArmL2: [-10, 0, 72], UpArmR2: [-2, 0, -76]
      }),
      K(0.3, {
        Hips: [-26, 14, 0], Hips_pos: [0, -0.32, -0.05], Spine: [20, -6, 0],
        ThighL: [-38, -4, 0], ShinL: [66, 0, 0], ThighR: [28, 6, 0], ShinR: [76, 0, 0],
        UpArmL: [-20, 8, 16], UpArmR: [-14, -6, -18],
        UpArmL2: [-64, 10, 34], LoArmL2: [-40, 16, 4], UpArmR2: [-58, -8, -36], LoArmR2: [-44, -14, -4]
      }),
      K(0.6, {}, 'out')
    ]
  },

  techRise: {
    dur: 0.3, loop: false, keys: [
      K(0, {
        Hips: [-76, 4, 0], Hips_pos: [0, -0.66, -0.12], Spine: [-6, -2, 0],
        ThighL: [58, -4, 0], ShinL: [18, 0, 0], ThighR: [68, 6, 0], ShinR: [26, 0, 0],
        UpArmL: [-34, 0, 58], UpArmR: [-24, 0, -62], UpArmL2: [-10, 0, 70], UpArmR2: [-2, 0, -74]
      }),
      K(0.10, {
        Hips: [-60, 8, 0], Hips_pos: [0, -0.52, 0.05], Spine: [4, -2, 0],
        ThighL: [108, -4, 0], ShinL: [78, 0, 0], ThighR: [114, 6, 0], ShinR: [84, 0, 0],
        UpArmL: [30, 6, 44], LoArmL: [-22, 0, 6], UpArmR: [36, -6, -48], LoArmR: [-18, 0, -6],
        UpArmL2: [-70, 8, 40], LoArmL2: [-30, 0, 4], UpArmR2: [-64, -6, -44], LoArmR2: [-26, 0, -4]
      }, 'in'),
      K(0.19, {
        Hips: [-6, 20, 0], Hips_pos: [0, -0.09, 0], Spine: [10, -6, 0], Chest: [6, -9, 0],
        ThighL: [-42, -4, 0], ShinL: [58, 0, 0], ThighR: [10, 6, 0], ShinR: [38, 0, 0],
        UpArmL: [-46, 8, 22], LoArmL: [-70, 18, 0], UpArmR: [-38, -6, -24], LoArmR: [-76, -16, 0],
        UpArmL2: [-14, 10, 32], UpArmR2: [-8, -8, -34]
      }, 'snap'),
      K(0.3, {}, 'out')
    ]
  },

  ko: {
    dur: 0.9, loop: false, keys: [
      K(0, { Spine: [-22, -4, 0], Head: [-18, -6, 0] }),
      K(0.3, {
        Hips: [-72, 6, 0], Hips_pos: [0, -0.60, -0.12], Spine: [-8, -2, 0], Head: [-12, 8, 0],
        ThighL: [54, -4, 0], ShinL: [18, 0, 0], ThighR: [64, 6, 0], ShinR: [28, 0, 0],
        UpArmL: [-48, 0, 68], LoArmL: [-10, 0, 6], UpArmR: [-18, 0, -72], LoArmR: [-6, 0, -6],
        UpArmL2: [-20, 0, 74], LoArmL2: [-8, 0, 4], UpArmR2: [-8, 0, -78], LoArmR2: [-6, 0, -4]
      }, 'snap'),
      K(0.9, {
        Hips: [-84, 2, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-4, 0, 0], Head: [-4, 14, 0],
        ThighL: [70, -6, 4], ShinL: [10, 0, 0], ThighR: [78, 8, -4], ShinR: [16, 0, 0],
        UpArmL: [-44, 0, 76], UpArmR: [-14, 0, -78], UpArmL2: [-16, 0, 80], UpArmR2: [-4, 0, -82],
        HandL: [0, 0, 0], HandR: [0, 0, 0], HandL2: [0, 0, 0], HandR2: [0, 0, 0]
      }, 'out')
    ]
  },

  defeat: {
    dur: 1.5, loop: false, keys: [
      K(0, {}),
      K(0.14, {
        Spine: [-18, -4, 0], Chest: [-14, -8, 0], Head: [-24, -6, 4], Hips: [-6, 18, 0],
        UpArmL: [-90, 8, 42], LoArmL: [-18, 14, 0], UpArmR: [-78, -6, -48], LoArmR: [-14, -12, 0],
        UpArmL2: [-48, 10, 52], LoArmL2: [-12, 14, 4], UpArmR2: [-40, -8, -56], LoArmR2: [-10, -12, -4],
        ThighL: [-22, -4, 0], ShinL: [16, 0, 0], Hips_pos: [0, -0.02, 0]
      }, 'snap'),
      K(0.36, {
        Spine: [8, -4, 0], Chest: [6, -8, 0], Head: [16, -4, 0], Hips: [-3, 17, 0],
        UpArmL: [-26, 8, 18], LoArmL: [-50, 14, 0], UpArmR: [-20, -6, -22], LoArmR: [-46, -12, 0],
        UpArmL2: [-58, 10, 30], LoArmL2: [-34, 14, 4], UpArmR2: [-52, -8, -32], LoArmR2: [-30, -12, -4],
        ThighL: [-56, -4, 0], ShinL: [84, 0, 0], ThighR: [-46, 6, 0], ShinR: [90, 0, 0], Hips_pos: [0, -0.35, 0]
      }, 'in'),
      K(0.64, {
        Spine: [-5, -2, 0], Head: [-6, 4, 0], Hips: [-50, 10, 0], Hips_pos: [0, -0.56, -0.10],
        ThighL: [42, -4, 0], ShinL: [32, 0, 0], ThighR: [52, 6, 0], ShinR: [38, 0, 0],
        UpArmL: [-50, 0, 58], UpArmR: [-28, 0, -62], UpArmL2: [-22, 0, 66], UpArmR2: [-12, 0, -70]
      }),
      K(0.94, {
        Hips: [-82, 4, 0], Hips_pos: [0, -0.72, -0.15], Spine: [-5, 0, 0], Head: [-8, 10, 0],
        ThighL: [68, -6, 4], ShinL: [14, 0, 0], ThighR: [76, 8, -4], ShinR: [20, 0, 0],
        UpArmL: [-44, 0, 74], UpArmR: [-16, 0, -76], UpArmL2: [-16, 0, 78], UpArmR2: [-4, 0, -80]
      }, 'out'),
      K(1.5, {
        Hips: [-84, 2, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-4, 0, 0], Head: [-4, 14, 0],
        ThighL: [70, -6, 4], ShinL: [10, 0, 0], ThighR: [78, 8, -4], ShinR: [16, 0, 0],
        UpArmL: [-44, 0, 76], UpArmR: [-14, 0, -78], UpArmL2: [-16, 0, 80], UpArmR2: [-4, 0, -82],
        HandL: [0, 0, 0], HandR: [0, 0, 0], HandL2: [0, 0, 0], HandR2: [0, 0, 0]
      }, 'out')
    ]
  },

  stunned: {
    dur: 1.6, loop: true, keys: [
      K(0, {
        Head: [-16, -4, 3], Neck: [-8, 0, 0], Spine: [-5, -4, 0], Chest: [-4, -5, 0],
        UpArmL: [-16, 4, 18], LoArmL: [-26, 14, 0], UpArmR: [-12, -4, -20], LoArmR: [-22, -12, 0],
        UpArmL2: [-2, 8, 30], LoArmL2: [-16, 14, 4], UpArmR2: [2, -6, -32], LoArmR2: [-14, -12, -4],
        Hips_pos: [0, -0.05, 0], ThighL: [-8, -4, 0], ThighR: [6, 6, 0]
      }),
      K(0.8, {
        Head: [-19, 2, -3], Spine: [-6, -3, 0], UpArmL: [-18, 4, 20], UpArmR: [-14, -4, -22],
        UpArmL2: [-6, 8, 33], UpArmR2: [6, -6, -35], Hips_pos: [0, -0.06, 0]
      }),
      K(1.6, {
        Head: [-16, -4, 3], UpArmL: [-16, 4, 18], UpArmR: [-12, -4, -20],
        UpArmL2: [-2, 8, 30], UpArmR2: [2, -6, -32], Hips_pos: [0, -0.05, 0]
      })
    ]
  },

  // Simple Domain and Barrier Break, inside somebody ELSE's domain. Both are
  // authored with the lower pair carrying the technique and the upper pair
  // braced — the one place he visibly has to work at something.
  simpleDomain: {
    dur: 1.2, loop: true, keys: [
      K(0, {
        UpArmL: [-58, 22, 8], LoArmL: [-106, 24, 0], HandL: [-28, 96, 0],
        UpArmR: [-52, -18, -10], LoArmR: [-112, -22, 0], HandR: [-28, -96, 0],
        UpArmL2: [-84, 12, 22], LoArmL2: [-40, 16, 4], HandL2: [-40, 50, 0],
        UpArmR2: [-80, -10, -24], LoArmR2: [-44, -14, -4], HandR2: [-40, -50, 0],
        Spine: [8, -6, 0], Head: [4, -7, 0], Hips_pos: [0, -0.085, 0],
        ThighL: [-22, -4, 0], ShinL: [24, 0, 0], ThighR: [16, 6, 0], ShinR: [28, 0, 0]
      }),
      K(0.6, { Hips_pos: [0, -0.10, 0], Spine: [9, -6, 0], UpArmL2: [-88, 12, 20], UpArmR2: [-84, -10, -22] }),
      K(1.2, { Hips_pos: [0, -0.085, 0], Spine: [8, -6, 0], UpArmL2: [-84, 12, 22], UpArmR2: [-80, -10, -24] })
    ]
  },

  barrierBreak: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        UpArmL: [-92, 4, 10], LoArmL: [-22, 0, 4], HandL: [-38, 0, 0],
        UpArmR: [-88, -2, -12], LoArmR: [-26, 0, -4], HandR: [-38, 0, 0],
        UpArmL2: [-64, 6, 18], LoArmL2: [-34, 0, 4], UpArmR2: [-60, -4, -20], LoArmR2: [-38, 0, -4],
        Spine: [13, -4, 0], Chest: [8, -4, 0], Head: [6, -4, 0], Hips_pos: [0, -0.08, 0],
        ThighL: [-26, -4, 0], ShinL: [24, 0, 0], ThighR: [20, 6, 0], ShinR: [32, 0, 0]
      }),
      K(0.45, {
        UpArmL: [-96, 4, 8], UpArmR: [-92, -2, -10], UpArmL2: [-68, 6, 16], UpArmR2: [-64, -4, -18],
        Spine: [15, -4, 0], Hips_pos: [0, -0.09, 0]
      }),
      K(0.9, {
        UpArmL: [-92, 4, 10], UpArmR: [-88, -2, -12], UpArmL2: [-64, 6, 18], UpArmR2: [-60, -4, -20],
        Spine: [13, -4, 0], Hips_pos: [0, -0.08, 0]
      })
    ]
  },

  // ---- X · THE CLAW STRING -------------------------------------------------
  // Three rends. Almost no wind-up on any of them: the arm is out and back
  // before the body has finished registering it. Every hit is LAYERED — the
  // upper arm strikes and the diagonally opposite LOWER arm rakes through a
  // beat behind it, which is what sells four arms rather than two plus two.

  // 1: upper-left backhand rake, lower-right raking under it.
  punch1: {
    dur: 0.317, loop: false, keys: [   // 19f
      K(0, {}),
      K(0.05, {
        UpArmL: [-34, 12, 14], LoArmL: [-84, 20, 0], HandL: [-14, 70, 0], Chest: [-2, -18, 0], Hips: [0, 26, 0],
        UpArmR2: [4, -8, -30], LoArmR2: [-52, -16, -4]
      }, 'in'),
      K(0.083, {
        UpArmL: [-80, -8, -6], LoArmL: [-8, 0, 0], HandL: [-4, 100, 0],
        Chest: [-1, 12, 0], Hips: [0, 10, 0], Spine: [0, 6, 0], Head: [-4, -12, 0],
        UpArmR: [-10, -6, -14], LoArmR: [-72, -20, 0],
        UpArmR2: [-52, -6, -14], LoArmR2: [-16, -8, -4], HandR2: [-20, -50, 0],
        UpArmL2: [14, 10, 28], LoArmL2: [-30, 18, 4]
      }, 'snap'),
      K(0.117, {
        UpArmL: [-80, -8, -6], LoArmL: [-10, 0, 0], Chest: [-1, 12, 0], Hips: [0, 10, 0],
        UpArmR2: [-54, -6, -14], LoArmR2: [-18, -8, -4]
      }, 'hold'),
      K(0.317, {}, 'out')
    ]
  },

  // 2: upper-right cross, lower-left tearing across the other way.
  punch2: {
    dur: 0.367, loop: false, keys: [   // 22f
      K(0, { UpArmL: [-64, -6, 0], LoArmL: [-32, 0, 0], Chest: [-1, 6, 0] }),
      K(0.05, {
        UpArmR: [-26, -16, -20], LoArmR: [-96, -18, 0], HandR: [-16, -80, 0],
        Chest: [-2, -22, 0], Hips: [0, 32, 0], Hips_pos: [0, -0.042, 0],
        UpArmL2: [10, 10, 30], LoArmL2: [-52, 18, 4]
      }, 'in'),
      K(0.10, {
        UpArmR: [-84, 8, 2], LoArmR: [-4, 0, 0], HandR: [-4, -160, 0],
        Chest: [-1, 20, 0], Hips: [0, 2, 0], Spine: [0, 12, 0], Head: [-4, -16, 0],
        UpArmL: [-26, 10, 12], LoArmL: [-78, 20, 0], HandL: [-20, 70, 0],
        UpArmL2: [-48, 8, 16], LoArmL2: [-14, 10, 4], HandL2: [-20, 50, 0],
        UpArmR2: [16, -8, -28], LoArmR2: [-34, -16, -4]
      }, 'snap'),
      K(0.147, {
        UpArmR: [-84, 8, 2], LoArmR: [-6, 0, 0], Chest: [-1, 20, 0], Hips: [0, 2, 0],
        UpArmL2: [-50, 8, 16], LoArmL2: [-16, 10, 4]
      }, 'hold'),
      K(0.367, {}, 'out')
    ]
  },

  // 3: the launcher. BOTH RIGHT ARMS come up together in one rising tear —
  // the only place in the string where two arms agree on anything.
  punch3: {
    dur: 0.533, loop: false, keys: [   // 32f
      K(0, { UpArmR: [-64, 4, 0], LoArmR: [-26, 0, 0] }),
      K(0.09, {
        UpArmR: [20, -10, -22], LoArmR: [-80, -14, 0], HandR: [-8, -28, 0],
        UpArmR2: [40, -8, -26], LoArmR2: [-46, -14, -4],
        Chest: [4, -26, 0], Spine: [4, -14, 0], Hips: [3, 34, 0], Hips_pos: [0, -0.11, 0],
        ThighL: [-26, -4, 0], ShinL: [30, 0, 0], ThighR: [22, 6, 0], ShinR: [42, 0, 0], Head: [0, -10, 0]
      }, 'in'),
      K(0.15, {
        UpArmR: [-114, 10, 6], LoArmR: [-40, 0, 0], HandR: [-16, 0, 0],
        UpArmR2: [-92, 8, -10], LoArmR2: [-26, 0, -4], HandR2: [-14, -20, 0],
        Chest: [-8, 16, 0], Spine: [-6, 8, 0], Hips: [-2, 6, 0], Hips_pos: [0, 0.03, 0],
        ThighL: [-12, -4, 0], ShinL: [10, 0, 0], ThighR: [6, 6, 0], ShinR: [18, 0, 0], FootR: [22, 8, 0],
        Head: [-8, -12, 0], UpArmL: [-26, 10, 18], LoArmL: [-84, 20, 0],
        UpArmL2: [2, 10, 34], LoArmL2: [-26, 18, 4]
      }, 'snap'),
      K(0.20, {
        UpArmR: [-116, 10, 6], LoArmR: [-42, 0, 0], UpArmR2: [-94, 8, -10], LoArmR2: [-28, 0, -4],
        Chest: [-8, 16, 0], Hips_pos: [0, 0.03, 0]
      }, 'hold'),
      K(0.533, {}, 'out')
    ]
  },

  // HEAVY — RENDING SWEEP: the one clip where all four arms move as one. He
  // raises the whole set and brings them down together. It is slow because it
  // is the only thing he does with his whole body.
  heavy: {
    dur: 0.85, loop: false, keys: [   // 51f
      K(0, {}),
      K(0.24, {
        UpArmL: [-146, 12, 14], LoArmL: [-46, 14, 0], HandL: [-16, 60, 0],
        UpArmR: [-152, -10, -16], LoArmR: [-42, -12, 0], HandR: [-16, -60, 0],
        UpArmL2: [-120, 12, 26], LoArmL2: [-36, 14, 4], HandL2: [-16, 40, 0],
        UpArmR2: [-124, -10, -28], LoArmR2: [-34, -12, -4], HandR2: [-16, -40, 0],
        Chest: [-6, -4, 0], Spine: [-4, -6, 0], Head: [-10, -6, 0], Hips_pos: [0, -0.02, 0]
      }, 'in'),
      K(0.36, {
        UpArmL: [-34, 6, 10], LoArmL: [-8, 0, 0], HandL: [-30, 90, 0],
        UpArmR: [-30, -4, -12], LoArmR: [-6, 0, 0], HandR: [-30, -90, 0],
        UpArmL2: [-14, 6, 18], LoArmL2: [-6, 0, 4], HandL2: [-30, 50, 0],
        UpArmR2: [-10, -4, -20], LoArmR2: [-4, 0, -4], HandR2: [-30, -50, 0],
        Chest: [16, -6, 0], Spine: [12, -4, 0], Head: [12, -6, 0], Hips_pos: [0, -0.14, 0],
        ThighL: [-32, -4, 0], ShinL: [36, 0, 0], ThighR: [24, 6, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      K(0.46, {
        UpArmL: [-32, 6, 10], UpArmR: [-28, -4, -12], UpArmL2: [-12, 6, 18], UpArmR2: [-8, -4, -20],
        Chest: [15, -6, 0], Hips_pos: [0, -0.14, 0]
      }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },

  // ---- RB · DISMANTLE ------------------------------------------------------
  // He raises one hand and the world is cut. The gesture is TINY — an
  // upper-right flick across the body — and the two lower arms complete the
  // cross a beat later, which is what the crossing slash actually is.
  ct1: {
    dur: 0.85, loop: false, keys: [   // 51f
      K(0, {}),
      K(0.20, {
        UpArmR: [-70, -18, -22], LoArmR: [-60, -14, 0], HandR: [-20, -70, 0],
        UpArmL2: [-30, 10, 34], LoArmL2: [-46, 16, 4],
        Chest: [-3, -16, 0], Hips: [0, 26, 0], Head: [-6, -10, 0]
      }, 'in'),
      K(0.333, {
        UpArmR: [-96, 22, 6], LoArmR: [-10, 0, 0], HandR: [-40, -30, 0],
        UpArmL: [-20, 10, 14], LoArmL: [-70, 20, 0],
        UpArmL2: [-86, 10, 20], LoArmL2: [-12, 12, 4], HandL2: [-30, 30, 0],
        UpArmR2: [-14, -8, -30], LoArmR2: [-40, -16, -4],
        Chest: [-1, 16, 0], Spine: [0, 10, 0], Hips: [0, 8, 0], Head: [-2, -14, 0]
      }, 'snap'),
      K(0.42, {
        UpArmR: [-98, 24, 6], LoArmR: [-12, 0, 0], UpArmL2: [-88, 10, 20], LoArmL2: [-14, 12, 4],
        Chest: [-1, 16, 0]
      }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },

  // ---- RT · CLEAVE ---------------------------------------------------------
  // Close range and committed. He steps in and the upper-left arm comes across
  // in a full horizontal cut with both lower arms drawn back and open — the
  // recovery pose is deliberately wide and slow to leave, because 32 frames of
  // it is the whole reason the move is fair.
  ct2: {
    dur: 0.883, loop: false, keys: [   // 53f
      K(0, {}),
      K(0.15, {
        UpArmL: [-46, 26, 24], LoArmL: [-100, 26, 0], HandL: [-16, 80, 0],
        UpArmR2: [-6, -8, -36], LoArmR2: [-56, -16, -4],
        UpArmL2: [24, 10, 18], LoArmL2: [-20, 14, 4],
        Chest: [-4, -28, 0], Spine: [-2, -16, 0], Hips: [0, 40, 0], Head: [-6, -6, 0]
      }, 'in'),
      K(0.267, {
        UpArmL: [-88, -20, -12], LoArmL: [-6, 0, 0], HandL: [-10, 120, 0],
        UpArmR: [-14, -6, -18], LoArmR: [-64, -20, 0],
        UpArmL2: [-64, -12, -6], LoArmL2: [-10, 8, 4], HandL2: [-20, 70, 0],
        UpArmR2: [26, -8, -22], LoArmR2: [-24, -14, -4],
        Chest: [-2, 26, 0], Spine: [0, 14, 0], Hips: [0, -4, 0], Head: [-4, -20, 0],
        Hips_pos: [0, -0.055, 0], ThighL: [-26, -4, 0], ShinL: [24, 0, 0]
      }, 'snap'),
      K(0.383, {
        UpArmL: [-90, -22, -12], LoArmL: [-8, 0, 0], UpArmL2: [-66, -14, -6], LoArmL2: [-12, 8, 4],
        Chest: [-2, 26, 0], Hips: [0, -4, 0], Hips_pos: [0, -0.055, 0]
      }, 'hold'),
      // the long, open recovery — this is the punish window, and it looks like it
      K(0.65, {
        UpArmL: [-70, -14, 6], LoArmL: [-30, 0, 0], UpArmR: [-16, -6, -16],
        UpArmL2: [-44, -6, 4], LoArmL2: [-26, 8, 4], UpArmR2: [18, -8, -24],
        Chest: [-2, 16, 0], Hips: [0, 6, 0], Hips_pos: [0, -0.042, 0]
      }),
      K(0.883, {}, 'out')
    ]
  },

  // ---- HOLD RT · FIRE ARROW ------------------------------------------------
  // THE CHARGE. Loops for as long as it is held, and it is the biggest,
  // slowest tell in his kit: the upper arms draw the bow, the lower pair
  // braces the stance, and the whole body opens toward the target. Everything
  // about the read is "you have about a second".
  fireCharge: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        UpArmR: [-94, 18, -4], LoArmR: [-18, 0, 0], HandR: [-30, -20, 0],
        UpArmL: [-88, -22, 6], LoArmL: [-58, 12, 0], HandL: [-24, 80, 0],
        UpArmL2: [-40, 8, 30], LoArmL2: [-58, 14, 4], HandL2: [-30, 40, 0],
        UpArmR2: [-36, -6, -32], LoArmR2: [-62, -12, -4], HandR2: [-30, -40, 0],
        Chest: [-4, -6, 0], Spine: [-2, -4, 0], Head: [-6, -4, 0], Hips_pos: [0, -0.06, 0],
        ThighL: [-30, -4, 0], ShinL: [30, 0, 0], ThighR: [24, 6, 0], ShinR: [34, 0, 0]
      }),
      K(0.45, {
        UpArmR: [-98, 20, -4], LoArmR: [-14, 0, 0],
        UpArmL: [-92, -24, 6], LoArmL: [-52, 12, 0],
        UpArmL2: [-44, 8, 33], UpArmR2: [-40, -6, -35],
        Chest: [-6, -6, 0], Head: [-9, -4, 0], Hips_pos: [0, -0.072, 0]
      }),
      K(0.9, {
        UpArmR: [-94, 18, -4], LoArmR: [-18, 0, 0],
        UpArmL: [-88, -22, 6], LoArmL: [-58, 12, 0],
        UpArmL2: [-40, 8, 30], UpArmR2: [-36, -6, -32],
        Chest: [-4, -6, 0], Head: [-6, -4, 0], Hips_pos: [0, -0.06, 0]
      })
    ]
  },

  // THE RELEASE. The drawn hand opens and the beam leaves. He holds the
  // follow-through for a long time — 42 frames of recovery on the single
  // biggest thing in the game.
  fireArrow: {
    dur: 0.967, loop: false, keys: [   // 58f
      K(0, {
        UpArmR: [-94, 18, -4], LoArmR: [-18, 0, 0], UpArmL: [-88, -22, 6], LoArmL: [-58, 12, 0],
        UpArmL2: [-40, 8, 30], LoArmL2: [-58, 14, 4], UpArmR2: [-36, -6, -32], LoArmR2: [-62, -12, -4],
        Hips_pos: [0, -0.06, 0], ThighL: [-30, -4, 0], ShinL: [30, 0, 0]
      }),
      K(0.167, {
        UpArmR: [-92, 8, -2], LoArmR: [-4, 0, 0], HandR: [-60, 0, 0],
        UpArmL: [-84, 4, 2], LoArmL: [-8, 0, 0], HandL: [-60, 20, 0],
        UpArmL2: [-70, 6, 16], LoArmL2: [-14, 8, 4], UpArmR2: [-66, -4, -18], LoArmR2: [-16, -6, -4],
        Chest: [4, 2, 0], Spine: [3, 0, 0], Head: [2, -2, 0], Hips_pos: [0, -0.09, 0],
        ThighL: [-36, -4, 0], ShinL: [34, 0, 0], ThighR: [28, 6, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      K(0.45, {
        UpArmR: [-90, 8, -2], LoArmR: [-6, 0, 0], UpArmL: [-82, 4, 2], LoArmL: [-10, 0, 0],
        UpArmL2: [-68, 6, 16], UpArmR2: [-64, -4, -18], Chest: [4, 2, 0], Hips_pos: [0, -0.09, 0]
      }, 'hold'),
      K(0.967, {}, 'out')
    ]
  },

  // ---- B · CONSUME A FINGER --------------------------------------
  // 58 frames in which he can do nothing. The upper-right hand comes to his
  // mouth, the head tips back, and every other arm hangs completely open. The
  // whole point of the pose is that it is an invitation.
  finger: {
    dur: 0.967, loop: false, keys: [   // 58f
      K(0, {}),
      K(0.20, {
        UpArmR: [-100, 26, 4], LoArmR: [-104, -6, 0], HandR: [-40, -20, 0],
        UpArmL: [-6, 8, 16], LoArmL: [-40, 20, 0],
        UpArmL2: [16, 10, 32], LoArmL2: [-20, 16, 4], UpArmR2: [20, -8, -34], LoArmR2: [-18, -14, -4],
        Head: [-14, 4, 0], Neck: [-8, 2, 0], Chest: [-4, 4, 0], Hips_pos: [0, -0.02, 0]
      }, 'in'),
      // the bite
      K(0.35, {
        UpArmR: [-118, 30, 2], LoArmR: [-128, -8, 0], HandR: [-56, -10, 0],
        Head: [-26, 2, 0], Neck: [-14, 0, 0], Chest: [-8, 2, 0], Spine: [-4, -2, 0],
        UpArmL: [-2, 8, 18], UpArmL2: [20, 10, 34], UpArmR2: [24, -8, -36],
        Hips_pos: [0, -0.01, 0]
      }, 'snap'),
      K(0.55, {
        UpArmR: [-116, 30, 2], LoArmR: [-126, -8, 0], Head: [-24, 2, 0], Chest: [-8, 2, 0]
      }, 'hold'),
      // and it takes. The spine arches, all four arms spread, and he holds it
      K(0.72, {
        UpArmR: [-70, 10, -20], LoArmR: [-30, 0, 0], UpArmL: [-64, -8, 24], LoArmL: [-28, 0, 0],
        UpArmL2: [-40, 8, 50], LoArmL2: [-16, 0, 4], UpArmR2: [-36, -6, -52], LoArmR2: [-14, 0, -4],
        Head: [-32, 0, 0], Neck: [-16, 0, 0], Chest: [-14, 0, 0], Spine: [-8, -2, 0],
        Hips_pos: [0, 0.01, 0], ThighL: [-16, -4, 0], ThighR: [12, 6, 0]
      }, 'snap'),
      K(0.85, {
        UpArmR: [-66, 10, -18], UpArmL: [-60, -8, 22], UpArmL2: [-36, 8, 48], UpArmR2: [-32, -6, -50],
        Head: [-28, 0, 0], Chest: [-12, 0, 0]
      }, 'hold'),
      K(0.967, {}, 'out')
    ]
  },

  // ---- DOMAIN CAST — MALEVOLENT SHRINE ------------------------------------
  // No hand sign held at the chest and no incantation: he does not need to ask
  // permission. The upper hands come together once, and then all four arms
  // open outward as the shrine comes up through the floor around him. The
  // second half is a HOLD — he stands there with his arms out while the world
  // rearranges itself, which is exactly the read a barrierless domain wants.
  domainCast: {
    dur: 1.667, loop: false, keys: [   // 100f
      K(0, {}),
      K(0.35, {
        UpArmL: [-72, -24, 8], LoArmL: [-96, -14, 4], HandL: [-26, 26, 0],
        UpArmR: [-68, 22, -10], LoArmR: [-100, 16, -4], HandR: [-26, -26, 0],
        UpArmL2: [-20, 10, 26], LoArmL2: [-64, 16, 4], UpArmR2: [-16, -8, -28], LoArmR2: [-68, -14, -4],
        Head: [-10, -4, 0], Chest: [-4, -4, 0], Hips_pos: [0, -0.04, 0]
      }, 'out'),
      K(0.62, {
        UpArmL: [-72, -24, 8], LoArmL: [-96, -14, 4], UpArmR: [-68, 22, -10], LoArmR: [-100, 16, -4],
        UpArmL2: [-22, 10, 26], UpArmR2: [-18, -8, -28], Head: [-13, -4, 0]
      }, 'hold'),
      // the opening: all four arms out, palms down, head level
      K(0.92, {
        UpArmL: [-78, 10, 72], LoArmL: [-10, 0, 4], HandL: [-14, 20, 0],
        UpArmR: [-74, -10, -76], LoArmR: [-10, 0, -4], HandR: [-14, -20, 0],
        UpArmL2: [-30, 8, 84], LoArmL2: [-8, 0, 4], HandL2: [-12, 20, 0],
        UpArmR2: [-26, -6, -88], LoArmR2: [-8, 0, -4], HandR2: [-12, -20, 0],
        Head: [-6, -2, 0], Neck: [-4, 0, 0], Chest: [-8, -2, 0], Spine: [-4, -2, 0],
        Hips_pos: [0, -0.01, 0], ThighL: [-16, -4, 0], ThighR: [12, 6, 0]
      }, 'snap'),
      K(1.667, {
        UpArmL: [-76, 10, 70], LoArmL: [-12, 0, 4], UpArmR: [-72, -10, -74], LoArmR: [-12, 0, -4],
        UpArmL2: [-28, 8, 82], UpArmR2: [-24, -6, -86],
        Head: [-5, -2, 0], Chest: [-7, -2, 0], Hips_pos: [0, -0.01, 0]
      }, 'hold')
    ]
  },

  // generic cast fallback (Yuta's Copy fires this on him, and nothing else)
  cast: {
    dur: 0.5, loop: false, keys: [
      K(0, {}),
      K(0.1, {
        UpArmR: [-26, -14, -18], LoArmR: [-96, -16, 0], Chest: [-2, -18, 0], Hips: [0, 28, 0],
        UpArmL2: [-24, 10, 32], LoArmL2: [-44, 16, 4]
      }, 'in'),
      K(0.2, {
        UpArmR: [-88, 6, 0], LoArmR: [-10, 0, 0], HandR: [-84, 0, 0], Chest: [-1, 12, 0], Hips: [0, 6, 0],
        UpArmL2: [-70, 10, 22], LoArmL2: [-14, 12, 4], Head: [-4, -12, 0]
      }, 'snap'),
      K(0.32, { UpArmR: [-88, 6, 0], LoArmR: [-12, 0, 0], UpArmL2: [-72, 10, 22] }, 'hold'),
      K(0.5, {}, 'out')
    ]
  },

  // ---- ON THE RECEIVING END ------------------------------------------------
  // TRANSFIGURED / SENTENCED / EXECUTED / EXEC ESCAPE live in the BASE set,
  // because any character can be the one it happens to and the shared skeleton
  // retargets them for free. That free retarget is exactly what does NOT cover
  // a second pair of arms: played unmodified, Sukuna's lower arms hold their
  // stance pose while the rest of him convulses, which looks like a bug at the
  // single most cinematic moment in the game. These four are re-authored so
  // all four arms are part of it — same timings and same silhouette as the
  // base clips, with the lower pair carrying its own beat.
  transfigured: {
    dur: 2.0, loop: false, keys: [
      K(0, {}),
      K(0.15, {
        Spine: [-14, -4, 0], Chest: [-12, -6, 0], Head: [-24, -8, 0],
        UpArmL: [-80, 10, 50], LoArmL: [-30, 0, 6], UpArmR: [-70, -8, -56], LoArmR: [-24, 0, -6],
        UpArmL2: [-52, 8, 58], LoArmL2: [-18, 0, 4], HandL2: [-60, 0, 0],
        UpArmR2: [-44, -6, -62], LoArmR2: [-14, 0, -4], HandR2: [-60, 0, 0],
        HandL: [-60, 0, 0], HandR: [-60, 0, 0], Hips_pos: [0, -0.02, 0]
      }, 'snap'),
      K(0.5, {
        Spine: [10, 24, -14], Chest: [8, 18, 10], Head: [18, -30, 22], Neck: [10, 12, -8],
        UpArmL: [-120, 40, 70], LoArmL: [-10, 0, 6], UpArmR: [30, -30, -70], LoArmR: [-100, 0, -6],
        UpArmL2: [20, 34, 66], LoArmL2: [-96, 0, 4], UpArmR2: [-114, -26, -58], LoArmR2: [-12, 0, -4],
        Hips: [-6, 40, 8], ThighL: [-30, -14, 0], ShinL: [40, 0, 0], Hips_pos: [0, -0.08, 0]
      }, 'snap'),
      K(0.9, {
        Spine: [-8, -20, 16], Chest: [-6, -14, -12], Head: [-26, 24, -18], Neck: [-8, -10, 6],
        UpArmL: [20, -20, 80], LoArmL: [-90, 0, 6], UpArmR: [-130, 30, -60], LoArmR: [-16, 0, -6],
        UpArmL2: [-122, 26, 54], LoArmL2: [-14, 0, 4], UpArmR2: [16, -30, -76], LoArmR2: [-88, 0, -4],
        Hips: [4, 4, -10], ThighR: [-24, 18, 0], ShinR: [34, 0, 0], Hips_pos: [0, -0.05, 0]
      }, 'snap'),
      K(1.25, {
        Spine: [16, 10, -8], Head: [22, -12, 14], UpArmL: [-100, 20, 60], UpArmR: [-90, -16, -64],
        UpArmL2: [-70, 16, 68], UpArmR2: [-62, -14, -72], LoArmL2: [-30, 0, 4], LoArmR2: [-26, 0, -4],
        Hips_pos: [0, -0.12, 0], ThighL: [-40, -6, 0], ShinL: [50, 0, 0], ThighR: [-30, 8, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      K(1.7, {
        Hips: [-70, 6, 0], Hips_pos: [0, -0.58, -0.1], Spine: [-10, -2, 0], Chest: [-6, -2, 0], Head: [-14, 6, 0],
        ThighL: [52, -4, 0], ShinL: [22, 0, 0], ThighR: [62, 6, 0], ShinR: [32, 0, 0],
        UpArmL: [-46, 0, 68], LoArmL: [-12, 0, 6], UpArmR: [-22, 0, -72], LoArmR: [-8, 0, -6],
        UpArmL2: [-18, 0, 74], LoArmL2: [-8, 0, 4], UpArmR2: [-6, 0, -78], LoArmR2: [-6, 0, -4]
      }, 'out'),
      K(2.0, {
        Hips: [-84, 2, 0], Hips_pos: [0, -0.72, -0.15], Spine: [-4, 0, 0], Head: [-8, 12, 0],
        ThighL: [70, -6, 4], ShinL: [12, 0, 0], ThighR: [78, 8, -4], ShinR: [18, 0, 0],
        UpArmL: [-44, 0, 76], UpArmR: [-16, 0, -78], UpArmL2: [-16, 0, 80], UpArmR2: [-4, 0, -82]
      }, 'out')
    ]
  },

  // SENTENCED — driven to his knees and hating it. The upper pair does what
  // the base clip does; the LOWER pair is planted on the floor taking his
  // weight, which is the only reason he is still upright at all.
  sentenced: {
    dur: 1.1, loop: true, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Neck: [-6, -2, 0], Head: [-14, -4, 0],
        ThighL: [-84, -6, 0], ShinL: [96, 0, 0], FootL: [26, -10, 0],
        ThighR: [-30, 8, 0], ShinR: [112, 0, 0], FootR: [18, 8, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], HandL: [-30, 40, 0],
        UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6], HandR: [-34, -40, 0],
        UpArmL2: [-8, 8, 40], LoArmL2: [-16, 0, 4], HandL2: [-50, 20, 0],
        UpArmR2: [-4, -6, -44], LoArmR2: [-12, 0, -4], HandR2: [-50, -20, 0]
      }),
      K(0.55, {
        Hips: [-19, 14, 0], Hips_pos: [0, -0.45, 0.02], Spine: [25, -6, 0], Head: [-11, -4, 0],
        UpArmL: [-36, 10, 33], UpArmR: [-88, -14, -29], LoArmR: [-84, 0, -6],
        UpArmL2: [-12, 8, 37], UpArmR2: [-8, -6, -41], LoArmL2: [-22, 0, 4]
      }),
      K(1.1, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Head: [-14, -4, 0],
        UpArmL: [-40, 10, 30], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6],
        UpArmL2: [-8, 8, 40], UpArmR2: [-4, -6, -44], LoArmL2: [-16, 0, 4]
      })
    ]
  },

  // EXECUTED — the jolt, the stillness, and then nothing holding him up. All
  // four arms go rigid together and all four let go together.
  executed: {
    dur: 1.6, loop: false, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Head: [-14, -4, 0], ThighL: [-84, -6, 0], ShinL: [96, 0, 0], ThighR: [-30, 8, 0], ShinR: [112, 0, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6],
        UpArmL2: [-8, 8, 40], LoArmL2: [-16, 0, 4], UpArmR2: [-4, -6, -44], LoArmR2: [-12, 0, -4]
      }),
      K(0.05, {
        Hips: [-4, 12, 0], Hips_pos: [0, -0.34, 0], Spine: [-6, -2, 0], Chest: [-8, -2, 0],
        Neck: [-10, 0, 0], Head: [-22, 0, 0],
        ThighL: [-70, -4, 0], ShinL: [80, 0, 0], ThighR: [-22, 6, 0], ShinR: [96, 0, 0],
        UpArmL: [-16, 4, 62], LoArmL: [-8, 0, 4], HandL: [0, 0, 0],
        UpArmR: [-14, -4, -64], LoArmR: [-6, 0, -4], HandR: [0, 0, 0],
        UpArmL2: [-6, 4, 70], LoArmL2: [-4, 0, 4], HandL2: [0, 0, 0],
        UpArmR2: [-4, -4, -72], LoArmR2: [-3, 0, -4], HandR2: [0, 0, 0]
      }, 'snap'),
      K(0.42, {
        Hips: [-5, 12, 0], Hips_pos: [0, -0.35, 0], Spine: [-5, -2, 0], Head: [-21, 0, 0],
        ThighL: [-70, -4, 0], ShinL: [80, 0, 0], ThighR: [-22, 6, 0], ShinR: [96, 0, 0],
        UpArmL: [-15, 4, 61], UpArmR: [-13, -4, -63], UpArmL2: [-5, 4, 69], UpArmR2: [-3, -4, -71]
      }, 'hold'),
      K(0.72, {
        Hips: [-40, 18, -6], Hips_pos: [0, -0.52, -0.04], Spine: [14, -6, 8], Chest: [10, -6, 6],
        Head: [16, 10, -10], Neck: [8, 4, -4],
        ThighL: [-40, -8, 0], ShinL: [58, 0, 0], ThighR: [8, 10, 0], ShinR: [72, 0, 0],
        UpArmL: [-30, 0, 46], LoArmL: [-24, 0, 6], UpArmR: [-24, 0, -50], LoArmR: [-20, 0, -6],
        UpArmL2: [-12, 0, 56], LoArmL2: [-14, 0, 4], UpArmR2: [-8, 0, -60], LoArmR2: [-12, 0, -4]
      }, 'in'),
      K(1.05, {
        Hips: [-74, 8, 0], Hips_pos: [0, -0.66, -0.12], Spine: [-6, -2, 0], Chest: [-4, -2, 0],
        Head: [-10, 8, 0], ThighL: [58, -4, 0], ShinL: [20, 0, 0], ThighR: [68, 6, 0], ShinR: [30, 0, 0],
        UpArmL: [-48, 0, 72], LoArmL: [-10, 0, 6], UpArmR: [-20, 0, -76], LoArmR: [-8, 0, -6],
        UpArmL2: [-20, 0, 78], LoArmL2: [-8, 0, 4], UpArmR2: [-8, 0, -80], LoArmR2: [-6, 0, -4]
      }, 'out'),
      K(1.6, {
        Hips: [-86, 2, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-4, 0, 0], Chest: [-2, 0, 0],
        Head: [-6, 14, 0], ThighL: [72, -6, 4], ShinL: [10, 0, 0], ThighR: [80, 8, -4], ShinR: [16, 0, 0],
        UpArmL: [-46, 0, 78], LoArmL: [-8, 0, 6], UpArmR: [-16, 0, -80], LoArmR: [-6, 0, -6],
        UpArmL2: [-18, 0, 82], LoArmL2: [-6, 0, 4], UpArmR2: [-6, 0, -84], LoArmR2: [-4, 0, -4],
        HandL: [0, 0, 0], HandR: [0, 0, 0], HandL2: [0, 0, 0], HandR2: [0, 0, 0]
      }, 'out')
    ]
  },

  // EXEC ESCAPE — he refuses the verdict. The LOWER pair is what does it here:
  // both lower arms slam into the floor and throw the whole body clear while
  // the upper pair is still pinned.
  execEscape: {
    dur: 0.85, loop: false, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Head: [-14, -4, 0], ThighL: [-84, -6, 0], ShinL: [96, 0, 0], ThighR: [-30, 8, 0], ShinR: [112, 0, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6],
        UpArmL2: [-8, 8, 40], LoArmL2: [-16, 0, 4], UpArmR2: [-4, -6, -44], LoArmR2: [-12, 0, -4]
      }),
      K(0.10, {
        Hips: [-24, 16, 0], Hips_pos: [0, -0.50, 0.06], Spine: [30, -6, 0], Head: [-6, -4, 0],
        ThighL: [-108, -6, 0], ShinL: [120, 0, 0], ThighR: [-40, 8, 0], ShinR: [126, 0, 0],
        UpArmL: [-24, 10, 26], LoArmL: [-70, 0, 6], UpArmR: [-70, -14, -22], LoArmR: [-96, 0, -6],
        UpArmL2: [24, 8, 30], LoArmL2: [-40, 0, 4], UpArmR2: [28, -6, -34], LoArmR2: [-36, 0, -4]
      }, 'in'),
      K(0.22, {
        Hips: [-34, 12, 0], Hips_pos: [0, -0.40, -0.06], Spine: [-10, -4, 0], Chest: [-14, -6, 0],
        Head: [-20, 0, 0], Neck: [-8, 0, 0],
        ThighL: [-128, -4, 0], ShinL: [10, 0, 0], FootL: [-24, -8, 0],
        ThighR: [-30, 8, 0], ShinR: [104, 0, 0],
        UpArmL: [-20, 6, 54], LoArmL: [-20, 0, 6], UpArmR: [-16, -6, -58], LoArmR: [-18, 0, -6],
        UpArmL2: [64, 6, 26], LoArmL2: [-6, 0, 4], HandL2: [-70, 0, 0],
        UpArmR2: [68, -6, -28], LoArmR2: [-5, 0, -4], HandR2: [-70, 0, 0]
      }, 'snap'),
      K(0.30, {
        Hips: [-34, 12, 0], Hips_pos: [0, -0.40, -0.06], ThighL: [-126, -4, 0], ShinL: [12, 0, 0],
        Spine: [-10, -4, 0], Head: [-19, 0, 0], UpArmL2: [62, 6, 26], UpArmR2: [66, -6, -28]
      }, 'hold'),
      K(0.58, {
        Hips: [-6, 20, 0], Hips_pos: [0, -0.16, 0], Spine: [14, -6, 0], Chest: [10, -9, 0],
        Head: [4, -8, 0], ThighL: [-40, -4, 0], ShinL: [54, 0, 0], ThighR: [14, 6, 0], ShinR: [40, 0, 0],
        UpArmL: [-58, 12, 22], LoArmL: [-92, 0, 6], UpArmR: [-50, -10, -24], LoArmR: [-98, 0, -6],
        UpArmL2: [-24, 10, 38], LoArmL2: [-46, 0, 4], UpArmR2: [-18, -8, -42], LoArmR2: [-50, 0, -4]
      }, 'out'),
      K(0.85, {}, 'out')
    ]
  },

  // ---- VICTORY -------------------------------------------------------------
  // He does not celebrate. He turns his head away, and the lower left hand
  // flicks the fight off his fingers.
  // ---- TAUNT — "KNOW YOUR PLACE." -----------------------------------------
  // Contempt, and four arms to express it with. The upper pair FOLDS — slowly,
  // and only because folding them is less effort than leaving them out — while
  // the lower pair goes to the hips, which is the only moment in his whole set
  // where all four arms end up doing something domestic. He then looks DOWN at
  // you, and the last thing that moves is one lower hand opening and closing
  // once, bored, while the rest of him is dead still.
  //
  // No anticipation on the fold, per his movement language: he does not wind up
  // for anything. The ANTICIPATION in this clip is in the HEAD instead — it
  // goes fractionally up before it comes down, which is what makes the look
  // down read as a decision rather than a droop.
  taunt: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      // upper pair folds, lower pair to the hips, chin lifts a fraction
      K(0.55, {
        Head: [-9, -4, 0], Neck: [1, -2, 0], Chest: [-4, -6, 0], Spine: [-3, -4, 0],
        UpArmL: [-58, 30, 12], LoArmL: [-124, 48, 0], HandL: [-16, 40, 0],
        UpArmR: [-52, -28, -14], LoArmR: [-130, -44, 0], HandR: [-16, -40, 0],
        UpArmL2: [8, 20, 46], LoArmL2: [-96, 44, 10], HandL2: [-18, 56, 0],
        UpArmR2: [10, -18, -48], LoArmR2: [-100, -42, -10], HandR2: [-18, -56, 0],
        Hips_pos: [0, -0.018, 0], Hips: [0, 24, 0]
      }, 'out'),
      // and the head comes down on you. Nothing else moves on this key.
      K(1.15, {
        Head: [13, 2, 0], Neck: [5, 1, 0], Chest: [-2, -5, 0], Spine: [-2, -4, 0],
        UpArmL: [-58, 30, 12], LoArmL: [-124, 48, 0], HandL: [-16, 40, 0],
        UpArmR: [-52, -28, -14], LoArmR: [-130, -44, 0], HandR: [-16, -40, 0],
        UpArmL2: [8, 20, 46], LoArmL2: [-96, 44, 10], HandL2: [-18, 56, 0],
        UpArmR2: [10, -18, -48], LoArmR2: [-100, -42, -10], HandR2: [-18, -56, 0],
        Hips_pos: [0, -0.018, 0], Hips: [0, 24, 0]
      }, 'out'),
      K(1.50, {
        Head: [14, 2, 0], Neck: [5, 1, 0], Chest: [-2, -5, 0],
        UpArmL: [-58, 30, 12], LoArmL: [-124, 48, 0],
        UpArmR: [-52, -28, -14], LoArmR: [-130, -44, 0],
        UpArmL2: [8, 20, 46], LoArmL2: [-96, 44, 10], HandL2: [-18, 56, 0],
        UpArmR2: [10, -18, -48], LoArmR2: [-100, -42, -10], HandR2: [-18, -56, 0],
        Hips_pos: [0, -0.018, 0]
      }, 'hold'),
      // the ONE moving thing in the hold: a lower hand flexes, and stops
      K(2.15, {
        Head: [14, 2, 0], Chest: [-2, -5, 0],
        UpArmL: [-58, 30, 12], LoArmL: [-124, 48, 0],
        UpArmR: [-52, -28, -14], LoArmR: [-130, -44, 0],
        UpArmL2: [8, 20, 46], LoArmL2: [-96, 44, 10], HandL2: [-34, 78, 0],
        UpArmR2: [10, -18, -48], LoArmR2: [-100, -42, -10], HandR2: [-18, -56, 0],
        Hips_pos: [0, -0.018, 0]
      }),
      K(3.0, {}, 'out')
    ]
  },
  victory: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      K(0.55, {
        Chest: [-4, 14, 0], Spine: [-2, 8, 0], Head: [-6, 26, 0], Neck: [2, 8, 0],
        UpArmL: [-12, 8, 8], UpArmR: [-6, -6, -10],
        UpArmL2: [-24, 10, 28], LoArmL2: [-60, 16, 4], HandL2: [-30, 50, 0],
        Hips_pos: [0, -0.026, 0]
      }, 'out'),
      K(0.85, {
        UpArmL2: [-18, 10, 30], LoArmL2: [-20, 16, 4], HandL2: [10, 40, 0], Head: [-6, 28, 0]
      }, 'snap'),
      K(1.9, {
        Chest: [-3, 6, 0], Head: [-8, -4, 0], Neck: [3, -2, 0],
        UpArmL2: [8, 10, 24], LoArmL2: [-34, 18, 4], HandL2: [-10, 40, 0], Hips_pos: [0, -0.034, 0]
      }),
      K(3.4, { Head: [-5, -9, 0], Chest: [-2, -9, 0] })
    ]
  }
};
