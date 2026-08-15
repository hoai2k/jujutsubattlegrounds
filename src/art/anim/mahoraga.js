// MAHORAGA — the animation set.
//
// Movement language: MASS. Every rule the human roster follows is inverted.
//   · Enormous anticipation. Nothing starts on the frame it is pressed; the
//     body loads first, and the load is visible from across the arena.
//   · He is only ever fast in the single instant of a strike. Between the
//     wind-up and the impact there is one snap key and nothing else.
//   · Long follow-through. Where a human settles in 0.2s he takes 0.5s, and
//     the settle overshoots before it comes back.
//   · Ground impact on every heavy action — the hips drop hard and the shins
//     brace, which is what the camera shake is timed against.
//
// SCALE NOTE. Hips_pos is in METRES, not fractions, and his Hips bind height
// is 0.515 * 3.6 = 1.854 m against ~0.93 m for a human. Every clip in the base
// set that puts a body on the floor (knockdown, getup, ko, defeat, techRise)
// is therefore overridden here with his own numbers — inherited ones would
// leave him lying a metre in the air.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — wide, low, shoulders forward, arms hanging clear of a chest that is
// too deep for them to hang beside. The head is tilted DOWN: he is looking at
// something less than half his height, and that alone reads as a threat.
export const MAHORAGA_STANCE = {
  Hips_pos: [0, -0.16, 0],
  Hips: [2, 18, 0], Spine: [7, -5, 0], Chest: [6, -8, 0], Neck: [4, -3, 0], Head: [9, -6, 0],
  // Arms hang CLOSE. The bind pose already carries a 13 deg A-pose spread, so
  // the extra abduction here is small — at 23/25 the first pass had him
  // standing like a scarecrow.
  ClavL: [0, 0, 0], UpArmL: [-7, 8, 12], LoArmL: [-30, 16, 0], HandL: [-14, 40, 0],
  ClavR: [0, 0, 0], UpArmR: [-5, -6, -13], LoArmR: [-26, -13, 0], HandR: [-12, -36, 0],
  ThighL: [-10, -6, 4], ShinL: [16, 0, 0], FootL: [0, -14, 0],
  ThighR: [8, 8, -4], ShinR: [20, 0, 0], FootR: [6, 10, 0]
};

export const MAHORAGA_CLIPS = {
  // IDLE — a 5.2s breath. One slow weight transfer hip to hip, the chest
  // filling and emptying, the head turning a few degrees and coming back. He
  // does not fidget and he does not bounce; the only fast thing in it is the
  // moment the weight arrives on the far foot.
  idle: {
    dur: 5.2, loop: true, keys: [
      K(0, {}),
      K(1.5, {
        Hips_pos: [0, -0.13, 0], Chest: [8, -8, 0], Spine: [8, -5, 0], Neck: [5, -3, 0],
        UpArmL: [-10, 8, 26], UpArmR: [-8, -6, -28], Head: [8, -8, 0]
      }),
      K(2.6, {
        Hips_pos: [-0.05, -0.20, 0], Hips: [2, 22, 0], Spine: [6, -6, -3], Chest: [5, -9, -2],
        Head: [10, -2, 2], ThighL: [-6, -6, 6], ShinL: [12, 0, 0], ThighR: [12, 8, -6], ShinR: [26, 0, 0],
        UpArmL: [-6, 8, 20], UpArmR: [-4, -6, -22]
      }, 'out'),
      K(4.0, {
        Hips_pos: [-0.03, -0.16, 0], Chest: [7, -8, -1], Head: [9, -10, 1],
        UpArmL: [-9, 8, 24], UpArmR: [-7, -6, -26]
      }),
      K(5.2, {})
    ]
  },

  // WALK — 1.5s a cycle. Long strides, a heavy heel-first plant, and a real
  // drop into each footfall. The arms barely swing: the mass of the upper body
  // is what carries and it does not want to move.
  walk: {
    dur: 1.5, loop: true, keys: [
      K(0, {
        ThighL: [-30, -6, 4], ShinL: [10, 0, 0], FootL: [-14, -14, 0],
        ThighR: [22, 8, -4], ShinR: [34, 0, 0], FootR: [18, 10, 0],
        Hips_pos: [0, -0.13, 0], Hips: [3, 21, 0], Spine: [9, -5, 0],
        UpArmL: [-14, 8, 21], UpArmR: [-2, -6, -27]
      }),
      // the plant: hips drop, everything compresses
      K(0.16, {
        ThighL: [-16, -6, 4], ShinL: [16, 0, 0], FootL: [-2, -14, 0],
        ThighR: [16, 8, -4], ShinR: [30, 0, 0],
        Hips_pos: [0, -0.30, 0], Spine: [11, -5, 0], Chest: [8, -8, 0], Head: [11, -6, 0]
      }, 'snap'),
      K(0.42, {
        ThighL: [-2, -6, 4], ShinL: [18, 0, 0], ThighR: [2, 8, -4], ShinR: [20, 0, 0],
        Hips_pos: [0, -0.10, 0], Spine: [7, -5, 0]
      }),
      K(0.75, {
        ThighL: [24, -6, 4], ShinL: [32, 0, 0], FootL: [18, -14, 0],
        ThighR: [-30, 8, -4], ShinR: [12, 0, 0], FootR: [-14, 10, 0],
        Hips_pos: [0, -0.13, 0], Hips: [3, 15, 0], Spine: [9, -5, 0],
        UpArmL: [-2, 8, 21], UpArmR: [-14, -6, -27]
      }),
      K(0.91, {
        ThighL: [16, -6, 4], ShinL: [28, 0, 0],
        ThighR: [-16, 8, -4], ShinR: [18, 0, 0], FootR: [-2, 10, 0],
        Hips_pos: [0, -0.30, 0], Spine: [11, -5, 0], Chest: [8, -8, 0], Head: [11, -6, 0]
      }, 'snap'),
      K(1.17, {
        ThighL: [2, -6, 4], ShinL: [20, 0, 0], ThighR: [-2, 8, -4], ShinR: [18, 0, 0],
        Hips_pos: [0, -0.10, 0], Spine: [7, -5, 0]
      }),
      K(1.5, {
        ThighL: [-30, -6, 4], ShinL: [10, 0, 0], FootL: [-14, -14, 0],
        ThighR: [22, 8, -4], ShinR: [34, 0, 0], FootR: [18, 10, 0],
        Hips_pos: [0, -0.13, 0], Hips: [3, 21, 0],
        UpArmL: [-14, 8, 21], UpArmR: [-2, -6, -27]
      })
    ]
  },

  // RUN — he does not run, he STRIDES. Barely faster than the walk in cadence
  // (0.98s), but the stride is enormous and the lean is real. The camera shake
  // in match.js is keyed to the two plant frames.
  run: {
    dur: 0.98, loop: true, keys: [
      K(0, {
        Spine: [17, -4, 0], Chest: [12, -7, 0], Hips: [5, 16, 0], Head: [4, -6, 0],
        ThighL: [-48, -6, 4], ShinL: [20, 0, 0], FootL: [-20, -12, 0],
        ThighR: [34, 8, -4], ShinR: [62, 0, 0], FootR: [30, 10, 0],
        UpArmL: [-24, 8, 18], LoArmL: [-52, 12, 0], UpArmR: [8, -6, -22], LoArmR: [-38, -10, 0],
        Hips_pos: [0, -0.12, 0]
      }),
      K(0.20, {
        Spine: [19, -4, 0], ThighL: [-14, -6, 4], ShinL: [26, 0, 0],
        ThighR: [-8, 8, -4], ShinR: [40, 0, 0], Hips_pos: [0, -0.34, 0], Head: [8, -6, 0]
      }, 'snap'),
      K(0.49, {
        Spine: [17, -4, 0], Chest: [12, -7, 0], Hips: [5, 16, 0], Head: [4, -6, 0],
        ThighL: [34, -6, 4], ShinL: [62, 0, 0], FootL: [30, -12, 0],
        ThighR: [-48, 8, -4], ShinR: [20, 0, 0], FootR: [-20, 10, 0],
        UpArmL: [8, 8, 18], LoArmL: [-38, 12, 0], UpArmR: [-24, -6, -22], LoArmR: [-52, -10, 0],
        Hips_pos: [0, -0.12, 0]
      }),
      K(0.69, {
        Spine: [19, -4, 0], ThighL: [-8, -6, 4], ShinL: [40, 0, 0],
        ThighR: [-14, 8, -4], ShinR: [26, 0, 0], Hips_pos: [0, -0.34, 0], Head: [8, -6, 0]
      }, 'snap'),
      K(0.98, {
        Spine: [17, -4, 0], Hips: [5, 16, 0],
        ThighL: [-48, -6, 4], ShinL: [20, 0, 0], FootL: [-20, -12, 0],
        ThighR: [34, 8, -4], ShinR: [62, 0, 0], FootR: [30, 10, 0],
        UpArmL: [-24, 8, 18], UpArmR: [8, -6, -22], Hips_pos: [0, -0.12, 0]
      })
    ]
  },

  // DASH -> HEAVY CHARGE. He does not dash like a person. This is a committed
  // shoulder-first drive: a deep load onto the back leg, then the whole body
  // thrown forward behind the left shoulder, both arms trailing. Once it
  // starts the pose barely changes — he cannot turn out of it and the clip
  // says so.
  dash: {
    dur: 0.9, loop: false, keys: [
      K(0, {}),
      // LOAD — the tell. A full quarter of a second of coiling.
      K(0.22, {
        Hips_pos: [0, -0.46, 0], Spine: [4, -12, 0], Chest: [2, -18, 0], Head: [6, -14, 0],
        Hips: [0, 34, 0],
        ThighL: [-46, -6, 4], ShinL: [56, 0, 0], ThighR: [30, 8, -4], ShinR: [66, 0, 0],
        UpArmL: [26, 12, 26], LoArmL: [-46, 16, 0], UpArmR: [30, -10, -28], LoArmR: [-40, -14, 0]
      }, 'in'),
      // GO — shoulder first, spine flat, head tucked behind it
      K(0.34, {
        Hips_pos: [0, -0.22, 0], Spine: [30, 8, -6], Chest: [22, 14, -4], Neck: [-8, 4, 0], Head: [-6, 8, 2],
        Hips: [6, 6, 0],
        ThighL: [-30, -6, 4], ShinL: [26, 0, 0], ThighR: [26, 8, -4], ShinR: [44, 0, 0],
        UpArmL: [36, 10, 14], LoArmL: [-30, 10, 0], UpArmR: [40, -8, -16], LoArmR: [-26, -8, 0]
      }, 'snap'),
      K(0.66, {
        Hips_pos: [0, -0.20, 0], Spine: [28, 8, -6], Chest: [21, 14, -4], Head: [-5, 8, 2],
        ThighL: [-22, -6, 4], ShinL: [22, 0, 0], ThighR: [20, 8, -4], ShinR: [38, 0, 0],
        UpArmL: [30, 10, 14], UpArmR: [34, -8, -16]
      }, 'hold'),
      K(0.9, {
        Hips_pos: [0, -0.24, 0], Spine: [22, 4, -3], Chest: [16, 8, -2],
        UpArmL: [16, 10, 18], UpArmR: [20, -8, -20]
      })
    ]
  },

  jump: {
    dur: 0.7, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.52, 0], Spine: [16, -5, 0],
        ThighL: [-54, -6, 4], ShinL: [64, 0, 0], ThighR: [-46, 8, -4], ShinR: [68, 0, 0],
        UpArmL: [24, 10, 26], UpArmR: [28, -8, -28]
      }),
      K(0.22, {
        Hips_pos: [0, 0.04, 0], Spine: [-8, -5, 0], Chest: [-6, -8, 0],
        ThighL: [-26, -6, 4], ShinL: [26, 0, 0], FootL: [26, -14, 0],
        ThighR: [10, 8, -4], ShinR: [30, 0, 0], FootR: [28, 10, 0],
        UpArmL: [-52, 10, 34], LoArmL: [-40, 12, 0], UpArmR: [-46, -8, -36], LoArmR: [-44, -10, 0]
      }, 'out'),
      K(0.7, {
        Hips_pos: [0, 0, 0],
        ThighL: [-42, -6, 4], ShinL: [54, 0, 0], ThighR: [-18, 8, -4], ShinR: [42, 0, 0],
        UpArmL: [-40, 10, 30], UpArmR: [-34, -8, -32]
      })
    ]
  },

  fall: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        ThighL: [-34, -6, 4], ShinL: [38, 0, 0], ThighR: [-10, 8, -4], ShinR: [28, 0, 0],
        UpArmL: [-48, 10, 40], LoArmL: [-34, 12, 0], UpArmR: [-40, -8, -42], LoArmR: [-40, -10, 0],
        Spine: [10, -5, 0]
      }),
      K(0.45, {
        ThighL: [-26, -6, 4], ShinL: [32, 0, 0], ThighR: [-18, 8, -4], ShinR: [34, 0, 0],
        UpArmL: [-44, 10, 36], UpArmR: [-46, -8, -38]
      }),
      K(0.9, {
        ThighL: [-34, -6, 4], ShinL: [38, 0, 0], ThighR: [-10, 8, -4], ShinR: [28, 0, 0],
        UpArmL: [-48, 10, 40], UpArmR: [-40, -8, -42]
      })
    ]
  },

  // LAND — the ground impact. A crater key, held, then a long settle. This is
  // the pose the landing camera shake is cut against.
  land: {
    dur: 0.62, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.68, 0], Spine: [24, -5, 0], Chest: [16, -8, 0], Head: [16, -6, 0],
        ThighL: [-64, -6, 8], ShinL: [78, 0, 0], FootL: [-14, -18, 0],
        ThighR: [-48, 8, -8], ShinR: [74, 0, 0], FootR: [-10, 14, 0],
        UpArmL: [10, 14, 34], LoArmL: [-64, 18, 0], UpArmR: [14, -12, -36], LoArmR: [-58, -14, 0]
      }, 'snap'),
      K(0.20, {
        Hips_pos: [0, -0.60, 0], Spine: [21, -5, 0], Head: [14, -6, 0],
        ThighL: [-56, -6, 8], ShinL: [70, 0, 0], ThighR: [-42, 8, -8], ShinR: [66, 0, 0]
      }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },

  // BLOCK — VERY slow to raise: 0.42s of forearm travel against a human's
  // 0.12s. The config gives it blockStartupFrames to match, so the animation
  // and the rules agree: pressing guard late does not save him.
  block: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        UpArmL: [-28, 16, 30], LoArmL: [-70, 24, 0], UpArmR: [-24, -14, -32], LoArmR: [-64, -20, 0],
        Spine: [10, -5, 0], Hips_pos: [0, -0.24, 0]
      }, 'in'),
      K(0.42, {
        UpArmL: [-62, 30, 16], LoArmL: [-116, 34, 0], HandL: [-24, 92, 0],
        UpArmR: [-56, -26, -18], LoArmR: [-122, -30, 0], HandR: [-24, -92, 0],
        Spine: [14, -5, 0], Chest: [10, -8, 0], Head: [14, -6, 0], Hips_pos: [0, -0.38, 0],
        ThighL: [-24, -6, 6], ShinL: [30, 0, 0], ThighR: [18, 8, -6], ShinR: [34, 0, 0]
      }, 'out'),
      K(0.46, {
        UpArmL: [-62, 30, 16], LoArmL: [-116, 34, 0], UpArmR: [-56, -26, -18], LoArmR: [-122, -30, 0],
        Hips_pos: [0, -0.38, 0]
      })
    ]
  },

  blockHit: {
    dur: 0.28, loop: false, keys: [
      K(0, {
        UpArmL: [-62, 30, 16], LoArmL: [-116, 34, 0], UpArmR: [-56, -26, -18], LoArmR: [-122, -30, 0],
        Hips_pos: [0, -0.38, 0], Spine: [14, -5, 0]
      }),
      K(0.06, {
        UpArmL: [-54, 30, 16], LoArmL: [-108, 34, 0], UpArmR: [-48, -26, -18], LoArmR: [-114, -30, 0],
        Spine: [19, -5, 0], Head: [18, -6, 0], Hips_pos: [0, -0.44, 0]
      }, 'snap'),
      K(0.28, {
        UpArmL: [-62, 30, 16], LoArmL: [-116, 34, 0], UpArmR: [-56, -26, -18], LoArmR: [-122, -30, 0],
        Hips_pos: [0, -0.38, 0]
      })
    ]
  },

  guardBreak: {
    dur: 1.25, loop: false, keys: [
      K(0, { UpArmL: [-62, 30, 16], LoArmL: [-116, 34, 0], UpArmR: [-56, -26, -18], LoArmR: [-122, -30, 0], Hips_pos: [0, -0.38, 0] }),
      K(0.14, {
        UpArmL: [-86, 10, 72], LoArmL: [-22, 0, 6], UpArmR: [-76, -8, -76], LoArmR: [-18, 0, -6],
        Spine: [-20, -4, 0], Chest: [-14, -6, 0], Head: [-20, -6, 0], Hips_pos: [0, -0.06, 0]
      }, 'snap'),
      K(0.42, {
        UpArmL: [-80, 10, 66], LoArmL: [-26, 0, 6], UpArmR: [-70, -8, -70], LoArmR: [-22, 0, -6],
        Spine: [-17, -4, 0], Head: [-16, -6, 0]
      }, 'hold'),
      K(0.9, {
        Spine: [-6, -5, 0], UpArmL: [-40, 10, 34], UpArmR: [-32, -8, -36],
        LoArmL: [-50, 12, 0], LoArmR: [-56, -10, 0], Hips_pos: [0, -0.24, 0]
      }),
      K(1.25, {})
    ]
  },

  // ---- THE CLAW STRING ----------------------------------------------------
  // Three hits, all with the open hand, all enormous. 1 and 2 are horizontal
  // rakes on alternating sides; 3 is an upward tear that launches. The reach
  // comes from the shoulder travelling, not the elbow — the whole torso
  // rotates through each one.

  // 1 — right-hand backhand rake. Armoured on the wind-up (see the config):
  // the pose deliberately leaves his chest open, because he does not care.
  punch1: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        UpArmR: [-34, -46, -44], LoArmR: [-64, -22, 0], HandR: [-20, -70, 0],
        Chest: [6, -34, 0], Spine: [8, -20, 0], Hips: [2, 48, 0], Head: [10, -22, 0],
        Hips_pos: [0, -0.22, 0], ThighL: [-18, -6, 4], ShinL: [24, 0, 0]
      }, 'in'),
      K(0.36, {
        UpArmR: [-64, 34, 22], LoArmR: [-14, 0, 0], HandR: [-6, 10, 0],
        Chest: [4, 30, 0], Spine: [6, 18, 0], Hips: [2, -12, 0], Head: [8, 16, 0],
        Hips_pos: [0, -0.30, 0], UpArmL: [-16, 8, 30], LoArmL: [-46, 18, 0],
        ThighR: [22, 8, -4], ShinR: [30, 0, 0]
      }, 'snap'),
      K(0.44, {
        UpArmR: [-66, 36, 22], LoArmR: [-16, 0, 0], Chest: [4, 32, 0], Hips_pos: [0, -0.30, 0]
      }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // 2 — left-hand rake back across the same line
  punch2: {
    dur: 0.76, loop: false, keys: [
      K(0, { UpArmR: [-50, 24, 22], LoArmR: [-24, 0, 0], Chest: [5, 22, 0], Hips: [2, 0, 0] }),
      K(0.24, {
        UpArmL: [-32, 44, 44], LoArmL: [-60, 26, 0], HandL: [-18, 66, 0],
        Chest: [6, 32, 0], Spine: [8, 18, 0], Hips: [2, -12, 0], Head: [10, 20, 0],
        Hips_pos: [0, -0.24, 0], ThighR: [18, 8, -4], ShinR: [26, 0, 0]
      }, 'in'),
      K(0.38, {
        UpArmL: [-62, -32, -20], LoArmL: [-12, 0, 0], HandL: [-6, -8, 0],
        Chest: [4, -32, 0], Spine: [6, -20, 0], Hips: [2, 52, 0], Head: [8, -20, 0],
        Hips_pos: [0, -0.32, 0], UpArmR: [-14, -8, -32], LoArmR: [-44, -16, 0],
        ThighL: [-22, -6, 4], ShinL: [28, 0, 0]
      }, 'snap'),
      K(0.47, {
        UpArmL: [-64, -34, -20], LoArmL: [-14, 0, 0], Chest: [4, -34, 0], Hips_pos: [0, -0.32, 0]
      }, 'hold'),
      K(0.76, {}, 'out')
    ]
  },

  // 3 — the launcher. He drops almost to a knee, then tears upward with the
  // whole body and comes off the floor at the top. The deepest anticipation in
  // the set: 0.34s of load for a single frame of contact.
  punch3: {
    dur: 1.05, loop: false, keys: [
      K(0, { UpArmL: [-48, -22, -20], LoArmL: [-24, 0, 0], Chest: [5, -24, 0] }),
      K(0.34, {
        UpArmR: [42, -30, -34], LoArmR: [-70, -14, -4], HandR: [-12, -40, 0],
        Chest: [22, -36, 0], Spine: [18, -20, 0], Hips: [8, 50, 0], Head: [16, -18, 0],
        Hips_pos: [0, -0.62, 0],
        ThighL: [-52, -6, 6], ShinL: [66, 0, 0], ThighR: [34, 8, -6], ShinR: [72, 0, 0],
        UpArmL: [24, 10, 30], LoArmL: [-52, 14, 0]
      }, 'in'),
      K(0.50, {
        UpArmR: [-138, 22, 14], LoArmR: [-28, 0, 0], HandR: [-24, 6, 0],
        Chest: [-18, 26, 0], Spine: [-14, 16, 0], Hips: [-6, 4, 0], Head: [-14, -8, 0],
        Hips_pos: [0, 0.10, 0],
        ThighL: [-16, -6, 4], ShinL: [12, 0, 0], ThighR: [4, 8, -4], ShinR: [16, 0, 0], FootR: [30, 10, 0],
        UpArmL: [-30, 10, 28], LoArmL: [-76, 14, 0]
      }, 'snap'),
      K(0.60, {
        UpArmR: [-142, 22, 14], LoArmR: [-30, 0, 0], Chest: [-18, 28, 0], Hips_pos: [0, 0.10, 0], Head: [-16, -8, 0]
      }, 'hold'),
      // the landing out of it — he came off the ground, he has to come back
      K(0.80, {
        Hips_pos: [0, -0.46, 0], Spine: [16, -5, 0], Chest: [10, -8, 0],
        ThighL: [-44, -6, 6], ShinL: [54, 0, 0], ThighR: [-30, 8, -6], ShinR: [50, 0, 0],
        UpArmL: [4, 12, 30], UpArmR: [-30, -10, -30]
      }, 'snap'),
      K(1.05, {}, 'out')
    ]
  },

  // HEAVY — a two-handed hammer-fist brought straight down through the target.
  // The single most committed thing he does that is not a technique.
  heavy: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      K(0.38, {
        UpArmL: [-168, 12, 20], LoArmL: [-46, 0, 4], HandL: [-20, 40, 0],
        UpArmR: [-172, -10, -18], LoArmR: [-42, 0, -4], HandR: [-20, -40, 0],
        Chest: [-14, -6, 0], Spine: [-10, -5, 0], Head: [-16, -6, 0], Hips: [0, 24, 0],
        Hips_pos: [0, -0.06, 0], ThighL: [-20, -6, 4], ShinL: [22, 0, 0]
      }, 'in'),
      K(0.54, {
        UpArmL: [-14, 8, 16], LoArmL: [-12, 0, 4], HandL: [-70, 20, 0],
        UpArmR: [-10, -6, -14], LoArmR: [-10, 0, -4], HandR: [-70, -20, 0],
        Chest: [34, 0, 0], Spine: [26, 0, 0], Head: [22, -6, 0], Hips: [8, 8, 0],
        Hips_pos: [0, -0.66, 0],
        ThighL: [-58, -6, 8], ShinL: [72, 0, 0], ThighR: [-44, 8, -8], ShinR: [70, 0, 0]
      }, 'snap'),
      K(0.70, {
        UpArmL: [-16, 8, 16], LoArmL: [-14, 0, 4], UpArmR: [-12, -6, -14], LoArmR: [-12, 0, -4],
        Chest: [34, 0, 0], Hips_pos: [0, -0.64, 0], Head: [22, -6, 0]
      }, 'hold'),
      K(1.15, {}, 'out')
    ]
  },

  // ---- CT1 · WHEEL SLASH --------------------------------------------------
  // The blade taken in a single flat arc across everything in front of him.
  // The wind-up carries the sword all the way behind his back; the swing
  // travels ~200 degrees of body rotation in five frames.
  wheelSlash: {
    dur: 0.98, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        UpArmR: [-52, -68, -52], LoArmR: [-40, -30, 0], HandR: [-10, -84, 0],
        Chest: [4, -40, 0], Spine: [6, -24, 0], Hips: [2, 58, 0], Head: [8, -28, 0],
        Hips_pos: [0, -0.34, 0],
        ThighL: [-26, -6, 6], ShinL: [32, 0, 0], ThighR: [22, 8, -6], ShinR: [34, 0, 0],
        UpArmL: [-24, 16, 34], LoArmL: [-64, 22, 0]
      }, 'in'),
      K(0.44, {
        UpArmR: [-78, 62, 34], LoArmR: [-8, 0, 0], HandR: [-4, 40, 0],
        Chest: [2, 44, 0], Spine: [4, 26, 0], Hips: [2, -26, 0], Head: [6, 26, 0],
        Hips_pos: [0, -0.40, 0],
        ThighL: [22, -6, 6], ShinL: [28, 0, 0], ThighR: [-24, 8, -6], ShinR: [30, 0, 0],
        UpArmL: [-6, -14, 18], LoArmL: [-30, -10, 0]
      }, 'snap'),
      K(0.56, {
        UpArmR: [-80, 66, 34], LoArmR: [-10, 0, 0], Chest: [2, 46, 0], Hips: [2, -28, 0],
        Hips_pos: [0, -0.40, 0]
      }, 'hold'),
      K(0.98, {}, 'out')
    ]
  },

  // ---- CT2 · WORLD-CUTTING SLASH -----------------------------------------
  // 46 frames of startup, and the pose has to justify every one of them. The
  // blade goes up over the head in both hands and STOPS — a real hold, dead
  // still, while the cut line writes itself across the world. Then it comes
  // down through everything.
  worldCut: {
    dur: 2.0, loop: false, keys: [
      K(0, {}),
      // the raise: slow, both hands, the whole body opening upward
      K(0.30, {
        UpArmR: [-118, 10, -6], LoArmR: [-56, 0, -4], HandR: [-16, -30, 0],
        UpArmL: [-104, -14, 12], LoArmL: [-62, -8, 4], HandL: [-16, 26, 0],
        Chest: [-8, -10, 0], Spine: [-6, -6, 0], Head: [-8, -8, 0], Hips_pos: [0, -0.22, 0]
      }, 'in'),
      // full extension overhead — the telegraph
      K(0.50, {
        UpArmR: [-174, 6, -4], LoArmR: [-20, 0, -2], HandR: [-10, -20, 0],
        UpArmL: [-170, -8, 8], LoArmL: [-24, -4, 2], HandL: [-10, 18, 0],
        Chest: [-22, -4, 0], Spine: [-16, -3, 0], Neck: [-8, 0, 0], Head: [-24, -4, 0],
        Hips: [-6, 20, 0], Hips_pos: [0, 0.02, 0],
        ThighL: [-16, -6, 6], ShinL: [14, 0, 0], ThighR: [10, 8, -6], ShinR: [18, 0, 0]
      }, 'out'),
      // THE HOLD. Nothing moves. This is where the player gets to react.
      K(0.72, {
        UpArmR: [-176, 6, -4], LoArmR: [-18, 0, -2],
        UpArmL: [-172, -8, 8], LoArmL: [-22, -4, 2],
        Chest: [-23, -4, 0], Spine: [-17, -3, 0], Head: [-25, -4, 0], Hips_pos: [0, 0.03, 0]
      }, 'hold'),
      // the cut — the single fastest frame in the whole character.
      // 0.767 s = frame 46 = the move's `startup`, so the blade and the
      // damage land on the same frame.
      K(0.767, {
        UpArmR: [-8, 4, -10], LoArmR: [-8, 0, -2], HandR: [-76, -14, 0],
        UpArmL: [-4, -2, 10], LoArmL: [-10, 0, 2], HandL: [-76, 12, 0],
        Chest: [40, 0, 0], Spine: [30, 0, 0], Neck: [10, 0, 0], Head: [26, -4, 0],
        Hips: [12, 6, 0], Hips_pos: [0, -0.80, 0],
        ThighL: [-62, -6, 10], ShinL: [78, 0, 0], FootL: [-16, -20, 0],
        ThighR: [-50, 8, -10], ShinR: [74, 0, 0], FootR: [-12, 16, 0]
      }, 'snap'),
      // impact hold — down on one knee with the blade through the floor
      K(1.05, {
        UpArmR: [-10, 4, -10], LoArmR: [-10, 0, -2], UpArmL: [-6, -2, 10], LoArmL: [-12, 0, 2],
        Chest: [40, 0, 0], Spine: [30, 0, 0], Head: [26, -4, 0], Hips_pos: [0, -0.78, 0],
        ThighL: [-62, -6, 10], ShinL: [78, 0, 0], ThighR: [-50, 8, -10], ShinR: [74, 0, 0]
      }, 'hold'),
      // the long, heavy recovery back to stance
      K(1.55, {
        Chest: [22, -4, 0], Spine: [16, -4, 0], Head: [16, -6, 0], Hips_pos: [0, -0.46, 0],
        UpArmR: [-22, -6, -22], LoArmR: [-30, -10, 0], UpArmL: [-20, 8, 24], LoArmL: [-34, 12, 0],
        ThighL: [-40, -6, 8], ShinL: [50, 0, 0], ThighR: [-26, 8, -8], ShinR: [46, 0, 0]
      }),
      K(2.0, {}, 'out')
    ]
  },

  // ---- ADAPTATION REACTION ------------------------------------------------
  // The wheel spins and locks; his body answers with a single hard shudder
  // through the spine and a head snap up. Short — it must never eat a turn.
  adapt: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.08, {
        Neck: [-10, -2, 0], Head: [-16, -4, 0], Chest: [-4, -8, 0], Spine: [-2, -5, 0],
        UpArmL: [-14, 8, 30], UpArmR: [-12, -6, -32], Hips_pos: [0, -0.12, 0]
      }, 'snap'),
      K(0.26, {
        Neck: [-6, -2, 0], Head: [-12, -4, 0], Chest: [10, -8, 0], Spine: [10, -5, 0],
        UpArmL: [-4, 8, 18], UpArmR: [-2, -6, -20], Hips_pos: [0, -0.24, 0]
      }, 'snap'),
      K(0.44, {
        Head: [-4, -6, 0], Chest: [7, -8, 0], Hips_pos: [0, -0.18, 0]
      }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // ---- EMERGENCE (driven by the ritual cutscene) --------------------------
  // Played while the model is being raised out of the shadow by setEmerge().
  // He comes up folded — head down, arms crossed low, knees deep — and then
  // opens: the head comes up LAST, and the camera is tilting with it.
  emerge: {
    dur: 3.4, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.90, 0], Hips: [0, 0, 0], Spine: [42, 0, 0], Chest: [30, 0, 0],
        Neck: [26, 0, 0], Head: [40, 0, 0],
        UpArmL: [-58, 30, 6], LoArmL: [-136, 40, 0], HandL: [-30, 60, 0],
        UpArmR: [-54, -28, -6], LoArmR: [-132, -38, 0], HandR: [-30, -60, 0],
        ThighL: [-72, -6, 10], ShinL: [104, 0, 0], ThighR: [-64, 8, -10], ShinR: [100, 0, 0]
      }),
      K(1.30, {
        Hips_pos: [0, -0.74, 0], Spine: [38, 0, 0], Chest: [27, 0, 0], Head: [38, 0, 0],
        UpArmL: [-56, 28, 8], LoArmL: [-130, 38, 0],
        UpArmR: [-52, -26, -8], LoArmR: [-126, -36, 0],
        ThighL: [-68, -6, 10], ShinL: [98, 0, 0], ThighR: [-60, 8, -10], ShinR: [96, 0, 0]
      }),
      // the legs straighten — he is standing up out of the floor
      K(2.30, {
        Hips_pos: [0, -0.34, 0], Spine: [22, -3, 0], Chest: [16, -5, 0], Head: [26, -2, 0],
        UpArmL: [-30, 18, 18], LoArmL: [-86, 26, 0],
        UpArmR: [-26, -16, -20], LoArmR: [-82, -24, 0],
        ThighL: [-34, -6, 8], ShinL: [46, 0, 0], ThighR: [-20, 8, -8], ShinR: [40, 0, 0]
      }, 'out'),
      // the arms drop open
      K(2.85, {
        Hips_pos: [0, -0.20, 0], Spine: [9, -5, 0], Chest: [8, -8, 0], Head: [20, -6, 0],
        UpArmL: [-8, 10, 30], LoArmL: [-30, 16, 0],
        UpArmR: [-6, -8, -32], LoArmR: [-26, -14, 0],
        ThighL: [-12, -6, 4], ShinL: [18, 0, 0], ThighR: [10, 8, -4], ShinR: [22, 0, 0]
      }, 'out'),
      // THE HEAD COMES UP. Last thing to move, and the shot holds on it.
      K(3.10, {
        Hips_pos: [0, -0.10, 0], Neck: [-6, -3, 0], Head: [-14, -6, 0],
        Chest: [4, -8, 0], Spine: [5, -5, 0],
        UpArmL: [-10, 8, 26], UpArmR: [-8, -6, -28]
      }, 'snap'),
      K(3.4, {}, 'out')
    ]
  },

  // ---- FLOOR CLIPS, RE-AUTHORED AT HIS SCALE ------------------------------
  // (his Hips bind sits at 1.854 m; the inherited -0.72 m offsets would leave
  // him lying a metre off the ground)
  knockdown: {
    dur: 0.72, loop: false, keys: [
      K(0, { Spine: [-22, -4, 0], Hips: [-18, 12, 0], Hips_pos: [0, -0.26, 0] }),
      K(0.30, {
        Hips: [-68, 6, 0], Hips_pos: [0, -1.30, -0.22], Spine: [-14, -2, 0], Chest: [-8, -2, 0], Head: [-16, 0, 0],
        ThighL: [-2, -6, 6], ShinL: [14, 0, 0], ThighR: [4, 8, -6], ShinR: [22, 0, 0],
        UpArmL: [-38, 0, 60], LoArmL: [-18, 0, 6], UpArmR: [-28, 0, -64], LoArmR: [-14, 0, -6]
      }, 'snap'),
      K(0.72, {
        Hips: [-82, 4, 0], Hips_pos: [0, -1.53, -0.30], Spine: [-8, -2, 0], Chest: [-4, -2, 0], Head: [-10, 0, 0],
        ThighL: [-10, -6, 6], ShinL: [8, 0, 0], ThighR: [-4, 8, -6], ShinR: [14, 0, 0],
        UpArmL: [-34, 0, 66], LoArmL: [-12, 0, 6], UpArmR: [-24, 0, -70], LoArmR: [-8, 0, -6]
      }, 'out')
    ]
  },

  getup: {
    dur: 0.95, loop: false, keys: [
      K(0, {
        Hips: [-82, 4, 0], Hips_pos: [0, -1.53, -0.30],
        ThighL: [-10, -6, 6], ShinL: [8, 0, 0], ThighR: [-4, 8, -6], ShinR: [14, 0, 0],
        UpArmL: [-34, 0, 66], UpArmR: [-24, 0, -70]
      }),
      K(0.42, {
        Hips: [-34, 14, 0], Hips_pos: [0, -0.86, -0.14], Spine: [26, -5, 0],
        ThighL: [-42, -6, 6], ShinL: [76, 0, 0], ThighR: [30, 8, -6], ShinR: [84, 0, 0],
        UpArmL: [-14, 10, 24], UpArmR: [-10, -8, -26]
      }),
      K(0.70, {
        Hips: [-8, 20, 0], Hips_pos: [0, -0.40, 0], Spine: [16, -5, 0], Chest: [11, -8, 0],
        ThighL: [-40, -6, 6], ShinL: [50, 0, 0], ThighR: [-14, 8, -6], ShinR: [40, 0, 0]
      }),
      K(0.95, {}, 'out')
    ]
  },

  ko: {
    dur: 1.5, loop: false, keys: [
      K(0, { Spine: [-22, -4, 0], Head: [-18, -6, 0] }),
      K(0.42, {
        Hips: [-72, 6, 0], Hips_pos: [0, -1.24, -0.26], Spine: [-10, -2, 0], Head: [-14, 8, 0],
        ThighL: [54, -6, 6], ShinL: [20, 0, 0], ThighR: [64, 8, -6], ShinR: [30, 0, 0],
        UpArmL: [-48, 0, 72], LoArmL: [-12, 0, 6], UpArmR: [-20, 0, -76], LoArmR: [-8, 0, -6]
      }, 'snap'),
      K(1.5, {
        Hips: [-86, 2, 0], Hips_pos: [0, -1.56, -0.34], Spine: [-4, 0, 0], Chest: [-2, 0, 0], Head: [-6, 14, 0],
        ThighL: [72, -8, 8], ShinL: [10, 0, 0], ThighR: [80, 10, -8], ShinR: [16, 0, 0],
        UpArmL: [-46, 0, 80], LoArmL: [-8, 0, 6], UpArmR: [-16, 0, -82], LoArmR: [-6, 0, -6],
        HandL: [0, 0, 0], HandR: [0, 0, 0]
      }, 'out')
    ]
  },

  defeat: {
    dur: 2.3, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        Spine: [-18, -4, 0], Chest: [-14, -8, 0], Head: [-24, -6, 4], Neck: [-10, -3, 0],
        UpArmL: [-84, 10, 48], LoArmL: [-18, 0, 6], UpArmR: [-74, -8, -54], LoArmR: [-14, 0, -6],
        Hips_pos: [0, -0.20, 0]
      }, 'snap'),
      K(0.60, {
        Spine: [12, -4, 0], Chest: [10, -8, 0], Head: [20, -4, 0], Hips: [-4, 18, 0],
        UpArmL: [-24, 10, 24], LoArmL: [-50, 12, 0], UpArmR: [-18, -8, -28], LoArmR: [-44, -10, 0],
        ThighL: [-58, -6, 8], ShinL: [88, 0, 0], ThighR: [-48, 8, -8], ShinR: [92, 0, 0],
        Hips_pos: [0, -0.80, 0]
      }, 'in'),
      K(1.05, {
        Spine: [-6, -2, 0], Head: [-8, 4, 0], Hips: [-52, 10, 0],
        UpArmL: [-50, 0, 62], LoArmL: [-14, 0, 6], UpArmR: [-28, 0, -66], LoArmR: [-10, 0, -6],
        ThighL: [44, -6, 6], ShinL: [34, 0, 0], ThighR: [54, 8, -6], ShinR: [40, 0, 0],
        Hips_pos: [0, -1.18, -0.22]
      }),
      K(1.55, {
        Spine: [-6, 0, 0], Head: [-10, 10, 0], Hips: [-84, 4, 0],
        UpArmL: [-46, 0, 78], UpArmR: [-18, 0, -80],
        ThighL: [70, -8, 8], ShinL: [14, 0, 0], ThighR: [78, 10, -8], ShinR: [20, 0, 0],
        Hips_pos: [0, -1.52, -0.32]
      }, 'out'),
      K(2.3, {
        Spine: [-4, 0, 0], Head: [-6, 14, 0], Hips: [-86, 2, 0], Hips_pos: [0, -1.56, -0.34],
        ThighL: [72, -8, 8], ShinL: [10, 0, 0], ThighR: [80, 10, -8], ShinR: [16, 0, 0],
        UpArmL: [-46, 0, 80], UpArmR: [-16, 0, -82], HandL: [0, 0, 0], HandR: [0, 0, 0]
      }, 'out')
    ]
  },

  techRise: {
    dur: 0.5, loop: false, keys: [
      K(0, {
        Hips: [-78, 4, 0], Hips_pos: [0, -1.42, -0.26], Spine: [-8, -2, 0], Head: [-10, 0, 0],
        ThighL: [60, -6, 6], ShinL: [20, 0, 0], ThighR: [70, 8, -6], ShinR: [28, 0, 0],
        UpArmL: [-34, 0, 62], UpArmR: [-24, 0, -66]
      }),
      K(0.18, {
        Hips: [-62, 8, 0], Hips_pos: [0, -1.14, 0.10], Spine: [6, -2, 0], Head: [12, 0, 0],
        ThighL: [108, -6, 6], ShinL: [82, 0, 0], ThighR: [114, 8, -6], ShinR: [88, 0, 0],
        UpArmL: [32, 8, 44], LoArmL: [-22, 8, 0], UpArmR: [38, -6, -48], LoArmR: [-18, -6, 0]
      }, 'in'),
      K(0.33, {
        Hips: [-8, 20, 0], Hips_pos: [0, -0.34, 0], Spine: [14, -5, 0], Chest: [9, -8, 0],
        ThighL: [-44, -6, 6], ShinL: [60, 0, 0], ThighR: [12, 8, -6], ShinR: [42, 0, 0],
        UpArmL: [-30, 10, 28], LoArmL: [-58, 14, 0], UpArmR: [-24, -8, -30], LoArmR: [-62, -12, 0]
      }, 'snap'),
      K(0.5, {}, 'out')
    ]
  },

  // hit reactions: a body this heavy barely moves, and that IS the read
  hitLight: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.06, {
        Head: [2, -10, 2], Neck: [-4, -2, 0], Chest: [2, -12, 0], Spine: [5, -6, 0],
        UpArmL: [-12, 8, 28], UpArmR: [-10, -6, -30], Hips_pos: [0, -0.20, 0]
      }, 'snap'),
      K(0.16, { Head: [5, -8, 1], Chest: [4, -10, 0], Hips_pos: [0, -0.18, 0] }, 'hold'),
      K(0.34, {})
    ]
  },

  hitHeavy: {
    dur: 0.6, loop: false, keys: [
      K(0, {}),
      K(0.08, {
        Head: [-14, -8, 5], Neck: [-10, -3, 0], Chest: [-12, -12, 0], Spine: [-8, -6, 0],
        Hips: [-4, 24, 0], UpArmL: [-58, 10, 42], LoArmL: [-20, 8, 0],
        UpArmR: [-48, -8, -46], LoArmR: [-16, -6, 0],
        ThighL: [-24, -6, 6], ShinL: [24, 0, 0], Hips_pos: [0, -0.24, 0]
      }, 'snap'),
      K(0.24, {
        Head: [-10, -8, 4], Chest: [-9, -12, 0], Spine: [-6, -6, 0],
        UpArmL: [-52, 10, 38], UpArmR: [-42, -8, -42]
      }, 'hold'),
      K(0.6, {})
    ]
  },

  launched: {
    dur: 0.95, loop: true, keys: [
      K(0, {
        Spine: [-26, -4, 0], Chest: [-16, -6, 0], Head: [-20, -6, 0], Hips: [-18, 16, 0],
        ThighL: [-58, -6, 6], ShinL: [46, 0, 0], ThighR: [-26, 8, -6], ShinR: [58, 0, 0],
        UpArmL: [-96, 10, 38], LoArmL: [-26, 8, 0], UpArmR: [-80, -8, -44], LoArmR: [-32, -6, 0],
        Hips_pos: [0, -0.10, 0]
      }),
      K(0.48, {
        Spine: [-32, -4, 0], Hips: [-24, 16, 0], ThighL: [-46, -6, 6], ThighR: [-36, 8, -6],
        UpArmL: [-88, 10, 44], UpArmR: [-88, -8, -38]
      }),
      K(0.95, {
        Spine: [-26, -4, 0], Hips: [-18, 16, 0], ThighL: [-58, -6, 6], ThighR: [-26, 8, -6],
        UpArmL: [-96, 10, 38], UpArmR: [-80, -8, -44]
      })
    ]
  },

  // VICTORY — he does not celebrate either. The wheel is still turning, the
  // head comes round to the camera, and that is the whole pose.
  // ---- TAUNT — NO BUBBLE. THE WHEEL TURNS, AND HE TILTS HIS HEAD. ---------
  // He has no face to make and nothing to say, so the taunt is the one part of
  // him that moves on its own: he drops his head so the wheel is presented, the
  // wheel takes a full turn (match.js calls `model.spinWheel` on `tauntStart`),
  // it CLUNKS to a stop through his whole body, and then he tilts his head at
  // you — the same tilt an animal gives a noise it cannot place.
  //
  // The clunk borrows its shape from the `adapt` clip above on purpose: this is
  // the same machine doing the same thing for no reason.
  taunt: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      // the head drops and the wheel is presented — slow, mechanical
      K(0.55, {
        Neck: [16, -3, 0], Head: [28, -6, 0], Chest: [10, -8, 0], Spine: [11, -5, 0],
        UpArmL: [-3, 8, 8], LoArmL: [-22, 16, 0],
        UpArmR: [-2, -6, -9], LoArmR: [-18, -13, 0],
        Hips_pos: [0, -0.20, 0]
      }, 'in'),
      // and it turns, and nothing else does. A full second of one moving part.
      K(1.70, {
        Neck: [17, -3, 0], Head: [29, -6, 0], Chest: [10, -8, 0],
        UpArmL: [-3, 8, 8], LoArmL: [-22, 16, 0],
        UpArmR: [-2, -6, -9], LoArmR: [-18, -13, 0],
        Hips_pos: [0, -0.205, 0]
      }, 'hold'),
      // THE CLUNK. One hard shudder up the spine, exactly like the adaptation.
      K(1.86, {
        Neck: [-8, -3, 0], Head: [-6, -6, 0], Chest: [-6, -8, 0], Spine: [-3, -5, 0],
        UpArmL: [-12, 8, 26], UpArmR: [-10, -6, -28],
        Hips_pos: [0, -0.10, 0]
      }, 'snap'),
      K(2.02, {
        Neck: [8, -3, 0], Head: [12, -6, 0], Chest: [9, -8, 0], Spine: [10, -5, 0],
        UpArmL: [-5, 8, 14], UpArmR: [-3, -6, -15],
        Hips_pos: [0, -0.22, 0]
      }, 'snap'),
      // THE TILT. Right over, and held. It is the only expressive frame he has.
      K(2.45, {
        Neck: [2, -3, 11], Head: [4, -6, 26], Chest: [6, -8, 0], Spine: [7, -5, 0],
        UpArmL: [-7, 8, 12], LoArmL: [-30, 16, 0],
        UpArmR: [-5, -6, -13], LoArmR: [-26, -13, 0],
        Hips_pos: [0, -0.165, 0]
      }, 'out'),
      K(2.95, {
        Neck: [2, -3, 12], Head: [4, -6, 28], Chest: [6, -8, 0],
        Hips_pos: [0, -0.168, 0]
      }, 'hold'),
      K(3.4, {}, 'out')
    ]
  },
  victory: {
    dur: 4.0, loop: false, keys: [
      K(0, {}),
      K(0.9, {
        Hips: [2, 34, 0], Chest: [4, -20, 0], Spine: [6, -12, 0], Neck: [-2, -6, 0], Head: [-6, -22, 0],
        UpArmL: [-6, 8, 20], UpArmR: [-4, -6, -22], Hips_pos: [0, -0.20, 0]
      }, 'out'),
      K(1.9, { Hips: [2, 30, 0], Head: [-10, -14, 2], Chest: [3, -18, 0], Hips_pos: [0, -0.14, 0] }),
      K(4.0, { Hips: [2, 32, 0], Head: [-8, -18, 0], Chest: [4, -19, 0], Hips_pos: [0, -0.17, 0] })
    ]
  },

  // ---- DEADLY SENTENCING: the victim's side, re-authored at his mass -------
  // The shared versions of these three live in anim/base.js and are correct
  // for every human on the roster. They are NOT correct for him, and the
  // reason is mechanical rather than artistic: joint ANGLES are scale-free but
  // `Hips_pos` is in METRES, so a -0.42 m hip drop that puts a 1.8 m body on
  // its knees leaves a 3.6 m body standing with a slight lean. Played straight
  // he read as bored rather than condemned, and the blade came down level with
  // his chest instead of over him.
  //
  // Everything here is the same POSE with the vertical travel doubled to match
  // his frame, plus a wider stance and heavier settle — the same treatment the
  // rest of this file gives every base clip it overrides. The staging distance
  // and the camera are scaled separately, off his hurt capsule, in
  // domains/sentencing.js (_victimScale).

  // SENTENCED — forced down onto one knee. Even kneeling he is taller than the
  // man holding the sword, which is the correct read: this is not a small
  // thing being executed, it is a large thing that has been made to kneel.
  sentenced: {
    dur: 1.3, loop: true, keys: [
      K(0, {
        Hips: [-14, 14, 0], Hips_pos: [0, -0.92, 0.06], Spine: [24, -5, 0], Chest: [18, -7, 0],
        Neck: [-6, -2, 0], Head: [-16, -4, 0],
        ThighL: [-88, -8, 6], ShinL: [104, 0, 0], FootL: [28, -12, 0],
        ThighR: [-26, 10, -6], ShinR: [118, 0, 0], FootR: [16, 10, 0],
        UpArmL: [-34, 10, 34], LoArmL: [-36, 0, 6], HandL: [-30, 40, 0],
        UpArmR: [-86, -14, -30], LoArmR: [-74, 0, -6], HandR: [-34, -40, 0]
      }),
      K(0.65, {
        Hips: [-17, 14, 0], Hips_pos: [0, -0.99, 0.06], Spine: [27, -5, 0], Head: [-13, -4, 0],
        UpArmL: [-30, 10, 37], UpArmR: [-82, -14, -33], LoArmR: [-80, 0, -6]
      }),
      K(1.3, {
        Hips: [-14, 14, 0], Hips_pos: [0, -0.92, 0.06], Spine: [24, -5, 0], Head: [-16, -4, 0],
        UpArmL: [-34, 10, 34], UpArmR: [-86, -14, -30], LoArmR: [-74, 0, -6]
      })
    ]
  },

  // EXECUTED — the same beat structure as the shared clip (jolt, stillness,
  // collapse) with his travel. The final key matches this file's own `ko`
  // settle so a body downed by the blade and a body downed by the buzzer read
  // identically.
  executed: {
    dur: 1.9, loop: false, keys: [
      K(0, {
        Hips: [-14, 14, 0], Hips_pos: [0, -0.92, 0.06], Spine: [24, -5, 0], Chest: [18, -7, 0],
        Head: [-16, -4, 0], ThighL: [-88, -8, 6], ShinL: [104, 0, 0], ThighR: [-26, 10, -6], ShinR: [118, 0, 0],
        UpArmL: [-34, 10, 34], LoArmL: [-36, 0, 6], UpArmR: [-86, -14, -30], LoArmR: [-74, 0, -6]
      }),
      K(0.06, {
        Hips: [-4, 12, 0], Hips_pos: [0, -0.74, 0], Spine: [-6, -2, 0], Chest: [-8, -2, 0],
        Neck: [-10, 0, 0], Head: [-24, 0, 0],
        ThighL: [-74, -6, 6], ShinL: [86, 0, 0], ThighR: [-20, 8, -6], ShinR: [100, 0, 0],
        UpArmL: [-14, 4, 64], LoArmL: [-8, 0, 4], UpArmR: [-12, -4, -66], LoArmR: [-6, 0, -4]
      }, 'snap'),
      K(0.50, {
        Hips: [-5, 12, 0], Hips_pos: [0, -0.76, 0], Spine: [-5, -2, 0], Head: [-23, 0, 0],
        ThighL: [-74, -6, 6], ShinL: [86, 0, 0], ThighR: [-20, 8, -6], ShinR: [100, 0, 0],
        UpArmL: [-13, 4, 63], UpArmR: [-11, -4, -65]
      }, 'hold'),
      K(0.86, {
        Hips: [-38, 18, -6], Hips_pos: [0, -1.05, -0.10], Spine: [14, -6, 8], Chest: [10, -6, 6],
        Head: [16, 10, -10], Neck: [8, 4, -4],
        ThighL: [-34, -8, 6], ShinL: [56, 0, 0], ThighR: [10, 10, -6], ShinR: [70, 0, 0],
        UpArmL: [-30, 0, 48], LoArmL: [-24, 0, 6], UpArmR: [-24, 0, -52], LoArmR: [-20, 0, -6]
      }, 'in'),
      K(1.28, {
        Hips: [-72, 6, 0], Hips_pos: [0, -1.24, -0.26], Spine: [-10, -2, 0], Chest: [-6, -2, 0],
        Head: [-14, 8, 0], ThighL: [54, -6, 6], ShinL: [20, 0, 0], ThighR: [64, 8, -6], ShinR: [30, 0, 0],
        UpArmL: [-48, 0, 72], LoArmL: [-12, 0, 6], UpArmR: [-20, 0, -76], LoArmR: [-8, 0, -6]
      }, 'out'),
      K(1.9, {
        Hips: [-84, 2, 0], Hips_pos: [0, -1.50, -0.30], Spine: [-4, 0, 0], Chest: [-2, 0, 0],
        Head: [-6, 14, 0], ThighL: [70, -8, 8], ShinL: [12, 0, 0], ThighR: [78, 10, -8], ShinR: [18, 0, 0],
        UpArmL: [-46, 0, 78], LoArmL: [-8, 0, 6], UpArmR: [-16, 0, -80], LoArmR: [-6, 0, -6],
        HandL: [0, 0, 0], HandR: [0, 0, 0]
      }, 'out')
    ]
  },

  // EXEC ESCAPE — he does not scramble. He simply stands up, and the man in
  // front of him goes with it. Same three beats, no panic in any of them.
  execEscape: {
    dur: 1.0, loop: false, keys: [
      K(0, {
        Hips: [-14, 14, 0], Hips_pos: [0, -0.92, 0.06], Spine: [24, -5, 0], Chest: [18, -7, 0],
        Head: [-16, -4, 0], ThighL: [-88, -8, 6], ShinL: [104, 0, 0], ThighR: [-26, 10, -6], ShinR: [118, 0, 0],
        UpArmL: [-34, 10, 34], LoArmL: [-36, 0, 6], UpArmR: [-86, -14, -30], LoArmR: [-74, 0, -6]
      }),
      K(0.12, {
        Hips: [-22, 16, 0], Hips_pos: [0, -1.06, 0.12], Spine: [30, -5, 0], Head: [-6, -4, 0],
        ThighL: [-112, -8, 6], ShinL: [124, 0, 0], ThighR: [-38, 10, -6], ShinR: [130, 0, 0],
        UpArmL: [-20, 10, 28], LoArmL: [-68, 0, 6], UpArmR: [-64, -14, -24], LoArmR: [-92, 0, -6]
      }, 'in'),
      K(0.26, {
        Hips: [-30, 12, 0], Hips_pos: [0, -0.80, -0.14], Spine: [-10, -4, 0], Chest: [-14, -6, 0],
        Head: [-20, 0, 0], Neck: [-8, 0, 0],
        ThighL: [-124, -6, 6], ShinL: [12, 0, 0], FootL: [-24, -12, 0],
        ThighR: [-28, 10, -6], ShinR: [106, 0, 0],
        UpArmL: [-20, 6, 56], LoArmL: [-20, 0, 6], UpArmR: [-16, -6, -60], LoArmR: [-18, 0, -6]
      }, 'snap'),
      K(0.36, {
        Hips: [-30, 12, 0], Hips_pos: [0, -0.80, -0.14], ThighL: [-122, -6, 6], ShinL: [14, 0, 0],
        Spine: [-10, -4, 0], Head: [-19, 0, 0]
      }, 'hold'),
      K(0.70, {
        Hips: [-4, 20, 0], Hips_pos: [0, -0.34, 0], Spine: [14, -5, 0], Chest: [10, -8, 0],
        Head: [4, -6, 0], ThighL: [-38, -6, 4], ShinL: [52, 0, 0], ThighR: [12, 8, -4], ShinR: [40, 0, 0],
        UpArmL: [-24, 10, 26], LoArmL: [-56, 0, 6], UpArmR: [-20, -8, -28], LoArmR: [-52, 0, -6]
      }, 'out'),
      K(1.0, {}, 'out')
    ]
  }
};
