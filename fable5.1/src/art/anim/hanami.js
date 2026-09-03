// HANAMI-specific clips.
//
// MOVEMENT LANGUAGE: ROOTED. Everything he does starts at the feet and takes
// its time getting anywhere else. The rules followed throughout:
//   · THE FEET NEVER LEAVE THE FLOOR IF THEY CAN AVOID IT. The walk is a
//     shove-and-plant, not a stride: the back foot pushes, the front foot goes
//     down flat and heavy, and there is a beat of stillness on every plant.
//     Where the roster's walk cycle lifts the knee, his slides the foot.
//   · THE HIPS SINK BEFORE ANYTHING MOVES. Every attack, every technique and
//     every step drops Hips_pos first. He is always pushing down into the
//     ground, which is the whole read of a character who takes his strength
//     from it.
//   · THE ARMS ARE WEIGHT. The clubs swing on their own momentum and overshoot
//     on every follow-through, then settle back — they are never placed.
//   · NO SNAP EASES ANYWHERE except the two impact frames of the heavy. He has
//     the slowest attack profile in the game and the animation has to say so
//     before the frame data does.
// The deliberate contrast is Kurourushi: he skitters and freezes, Hanami
// grows and settles. They must never read as the same kind of creature.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — planted wide, knees deep, torso pitched forward over the feet, head
// thrust low and forward on almost no neck. The clubs hang off the shoulders
// held out by their own mass. Nothing about this pose is ready to move.
export const HANAMI_STANCE = {
  Hips_pos: [0, -0.105, 0],
  Hips: [0, 16, 0], Spine: [11, -6, 0], Chest: [9, -8, 0], Neck: [5, -3, 0], Head: [9, -6, 0],
  ClavL: [0, 0, 0], UpArmL: [-10, 5, 19], LoArmL: [-36, 12, 0], HandL: [-8, 40, 0],
  ClavR: [0, 0, 0], UpArmR: [-7, -4, -20], LoArmR: [-40, -10, 0], HandR: [-8, -40, 0],
  ThighL: [-27, -7, 0], ShinL: [42, 0, 0], FootL: [11, -11, 0],
  ThighR: [-21, 9, 0], ShinR: [36, 0, 0], FootR: [9, 11, 0]
};

export const HANAMI_CLIPS = {
  // ---- LOCOMOTION ---------------------------------------------------------
  // idle: one very long breath through the whole trunk, and the clubs drift a
  // few degrees on their own weight a beat behind it. 4.6 s — the slowest idle
  // in the game by half again.
  idle: {
    dur: 4.6, loop: true, keys: [
      K(0, {}),
      K(1.6, {
        Hips_pos: [0, -0.088, 0], Spine: [13, -6, 0], Chest: [11, -8, 0], Head: [7, -6, 0],
        UpArmL: [-13, 5, 21], UpArmR: [-10, -4, -22], LoArmL: [-33, 12, 0], LoArmR: [-37, -10, 0]
      }),
      K(2.9, {
        Hips_pos: [0, -0.112, 0], Spine: [10, -6, 0], Head: [11, -5, 2],
        UpArmL: [-8, 5, 17], UpArmR: [-6, -4, -18]
      }),
      K(4.6, {})
    ]
  },

  // walk: a SHOVE AND A PLANT. The back foot drives, the body travels as one
  // block, the front foot arrives flat, and the whole thing stops for a frame
  // before the other side takes over. 1.5 s per cycle.
  walk: {
    dur: 1.5, loop: true, keys: [
      K(0, {
        ThighL: [-38, -7, 0], ShinL: [30, 0, 0], FootL: [4, -11, 0],
        ThighR: [-4, 9, 0], ShinR: [48, 0, 0], FootR: [22, 11, 0],
        Hips_pos: [0, -0.098, 0], Hips: [0, 16, 0], Spine: [13, -6, 0],
        UpArmL: [-16, 5, 20], UpArmR: [-4, -4, -21]
      }),
      // the plant: everything stops and drops
      K(0.22, {
        ThighL: [-30, -7, 0], ShinL: [40, 0, 0], FootL: [12, -11, 0],
        ThighR: [-14, 9, 0], ShinR: [42, 0, 0],
        Hips_pos: [0, -0.132, 0], Spine: [14, -6, 0], Head: [11, -6, 0]
      }, 'out'),
      K(0.42, { Hips_pos: [0, -0.126, 0] }, 'hold'),
      K(0.75, {
        ThighL: [-4, -7, 0], ShinL: [48, 0, 0], FootL: [22, -11, 0],
        ThighR: [-38, 9, 0], ShinR: [30, 0, 0], FootR: [4, 11, 0],
        Hips_pos: [0, -0.098, 0], Spine: [13, -6, 0],
        UpArmL: [-4, 5, 20], UpArmR: [-16, -4, -21]
      }),
      K(0.97, {
        ThighL: [-14, -7, 0], ShinL: [42, 0, 0],
        ThighR: [-30, 9, 0], ShinR: [40, 0, 0], FootR: [12, 11, 0],
        Hips_pos: [0, -0.132, 0], Spine: [14, -6, 0], Head: [11, -6, 0]
      }, 'out'),
      K(1.17, { Hips_pos: [0, -0.126, 0] }, 'hold'),
      K(1.5, {
        ThighL: [-38, -7, 0], ShinL: [30, 0, 0], FootL: [4, -11, 0],
        ThighR: [-4, 9, 0], ShinR: [48, 0, 0], FootR: [22, 11, 0],
        Hips_pos: [0, -0.098, 0], UpArmL: [-16, 5, 20], UpArmR: [-4, -4, -21]
      })
    ]
  },

  // run: it is not a run, it is a lumber. The stride lengthens and the torso
  // pitches further over the front foot, but the contact never leaves the
  // floor for long and the arms just swing on their hinges.
  run: {
    dur: 1.0, loop: true, keys: [
      K(0, {
        Spine: [21, -5, 0], Chest: [15, -7, 0], Head: [6, -6, 0], Hips: [3, 14, 0],
        ThighL: [-54, -7, 0], ShinL: [34, 0, 0], FootL: [-2, -11, 0],
        ThighR: [16, 9, 0], ShinR: [66, 0, 0], FootR: [26, 11, 0],
        UpArmL: [-30, 6, 22], LoArmL: [-50, 12, 0], UpArmR: [6, -5, -24], LoArmR: [-28, -10, 0],
        Hips_pos: [0, -0.088, 0]
      }),
      K(0.24, {
        ThighL: [-24, -7, 0], ShinL: [46, 0, 0], ThighR: [-16, 9, 0], ShinR: [54, 0, 0],
        Hips_pos: [0, -0.140, 0], Spine: [23, -5, 0]
      }, 'out'),
      K(0.5, {
        Spine: [21, -5, 0], Chest: [15, -7, 0], Hips: [3, 14, 0],
        ThighL: [16, -7, 0], ShinL: [66, 0, 0], FootL: [26, -11, 0],
        ThighR: [-54, 9, 0], ShinR: [34, 0, 0], FootR: [-2, 11, 0],
        UpArmL: [6, 6, 22], LoArmL: [-28, 12, 0], UpArmR: [-30, -5, -24], LoArmR: [-50, -10, 0],
        Hips_pos: [0, -0.088, 0]
      }),
      K(0.74, {
        ThighL: [-16, -7, 0], ShinL: [54, 0, 0], ThighR: [-24, 9, 0], ShinR: [46, 0, 0],
        Hips_pos: [0, -0.140, 0], Spine: [23, -5, 0]
      }, 'out'),
      K(1.0, {
        Spine: [21, -5, 0], ThighL: [-54, -7, 0], ShinL: [34, 0, 0], FootL: [-2, -11, 0],
        ThighR: [16, 9, 0], ShinR: [66, 0, 0], FootR: [26, 11, 0],
        UpArmL: [-30, 6, 22], UpArmR: [6, -5, -24], Hips_pos: [0, -0.088, 0]
      })
    ]
  },

  // dash: a heavy lurch. He drops, shoves off one leg, and travels barely
  // further than a walk step. There is no crispness anywhere in it — this is
  // the worst dash in the game and it looks like it.
  dash: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        Hips_pos: [0, -0.175, 0], Spine: [18, -6, 0], Chest: [13, -8, 0],
        ThighL: [-44, -7, 0], ShinL: [58, 0, 0], ThighR: [-30, 9, 0], ShinR: [52, 0, 0],
        UpArmL: [4, 6, 24], UpArmR: [8, -5, -26]
      }, 'in'),
      K(0.22, {
        Hips_pos: [0, -0.088, 0], Spine: [24, -5, 0], Chest: [17, -7, 0], Head: [4, -6, 0],
        ThighL: [-52, -7, 0], ShinL: [30, 0, 0], ThighR: [10, 9, 0], ShinR: [58, 0, 0],
        UpArmL: [-22, 6, 20], UpArmR: [-18, -5, -22]
      }, 'out'),
      K(0.46, {}, 'out')
    ]
  },

  // jump / fall / land: he barely leaves the ground and he arrives like a
  // dropped log. The landing squat is the deepest on the roster.
  jump: {
    dur: 0.55, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.22, 0], Spine: [20, -6, 0],
        ThighL: [-58, -7, 0], ShinL: [70, 0, 0], ThighR: [-50, 9, 0], ShinR: [66, 0, 0]
      }),
      K(0.20, {
        Hips_pos: [0, -0.02, 0], Spine: [4, -6, 0], Chest: [2, -8, 0],
        ThighL: [-26, -7, 0], ShinL: [30, 0, 0], FootL: [26, -11, 0],
        ThighR: [-12, 9, 0], ShinR: [34, 0, 0], FootR: [28, 11, 0],
        UpArmL: [-46, 8, 30], LoArmL: [-30, 12, 0], UpArmR: [-40, -6, -32], LoArmR: [-34, -10, 0]
      }, 'out'),
      K(0.55, {
        Hips_pos: [0, -0.04, 0], ThighL: [-44, -7, 0], ShinL: [56, 0, 0],
        ThighR: [-26, 9, 0], ShinR: [46, 0, 0], UpArmL: [-36, 8, 26], UpArmR: [-30, -6, -28]
      })
    ]
  },
  fall: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        ThighL: [-40, -7, 0], ShinL: [44, 0, 0], ThighR: [-16, 9, 0], ShinR: [34, 0, 0],
        UpArmL: [-46, 8, 36], LoArmL: [-34, 12, 0], UpArmR: [-40, -6, -38], LoArmR: [-38, -10, 0],
        Spine: [12, -6, 0]
      }),
      K(0.45, {
        ThighL: [-32, -7, 0], ShinL: [38, 0, 0], ThighR: [-24, 9, 0], ShinR: [40, 0, 0],
        UpArmL: [-42, 8, 33], UpArmR: [-46, -6, -35]
      }),
      K(0.9, {
        ThighL: [-40, -7, 0], ShinL: [44, 0, 0], ThighR: [-16, 9, 0], ShinR: [34, 0, 0],
        UpArmL: [-46, 8, 36], UpArmR: [-40, -6, -38]
      })
    ]
  },
  land: {
    dur: 0.38, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.30, 0], Spine: [26, -6, 0], Chest: [16, -8, 0], Head: [14, -6, 0],
        ThighL: [-64, -7, 0], ShinL: [78, 0, 0], ThighR: [-48, 9, 0], ShinR: [72, 0, 0],
        UpArmL: [-14, 8, 28], UpArmR: [-10, -6, -30]
      }, 'snap'),
      K(0.14, { Hips_pos: [0, -0.26, 0], Spine: [24, -6, 0] }, 'hold'),
      K(0.38, {}, 'out')
    ]
  },

  // ---- GUARD --------------------------------------------------------------
  // The best guard in the game, and it is not a boxer's guard: he turns his
  // shoulder plate into the hit and brings both clubs up as one wall. The
  // stance widens rather than backing off — he does not give ground.
  block: {
    dur: 0.22, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        UpArmL: [-58, 22, 14], LoArmL: [-108, 26, 0], HandL: [-14, 88, 0],
        UpArmR: [-52, -18, -16], LoArmR: [-114, -24, 0], HandR: [-14, -88, 0],
        Spine: [16, -14, 0], Chest: [12, -18, 0], Head: [14, -10, 0],
        Hips: [0, 26, 0], Hips_pos: [0, -0.145, 0],
        ThighL: [-34, -9, 0], ShinL: [50, 0, 0], ThighR: [-26, 11, 0], ShinR: [44, 0, 0]
      }, 'out'),
      K(0.22, {
        UpArmL: [-58, 22, 14], LoArmL: [-108, 26, 0], UpArmR: [-52, -18, -16], LoArmR: [-114, -24, 0],
        Hips_pos: [0, -0.145, 0], Spine: [16, -14, 0]
      })
    ]
  },
  blockHit: {
    dur: 0.24, loop: false, keys: [
      K(0, {
        UpArmL: [-58, 22, 14], LoArmL: [-108, 26, 0], UpArmR: [-52, -18, -16], LoArmR: [-114, -24, 0],
        Hips_pos: [0, -0.145, 0], Spine: [16, -14, 0]
      }),
      // he does not rock back — the ground takes it and only the plates move
      K(0.05, {
        UpArmL: [-52, 22, 14], LoArmL: [-102, 26, 0], UpArmR: [-46, -18, -16], LoArmR: [-108, -24, 0],
        Spine: [19, -14, 0], Head: [17, -10, 0], Hips_pos: [0, -0.162, 0]
      }, 'snap'),
      K(0.24, {
        UpArmL: [-58, 22, 14], LoArmL: [-108, 26, 0], UpArmR: [-52, -18, -16], LoArmR: [-114, -24, 0],
        Hips_pos: [0, -0.145, 0]
      })
    ]
  },
  guardBreak: {
    dur: 1.15, loop: false, keys: [
      K(0, {
        UpArmL: [-58, 22, 14], LoArmL: [-108, 26, 0], UpArmR: [-52, -18, -16], LoArmR: [-114, -24, 0],
        Hips_pos: [0, -0.145, 0]
      }),
      // the wall comes apart slowly, which is worse than it coming apart fast
      K(0.16, {
        UpArmL: [-74, 10, 62], LoArmL: [-26, 6, 0], UpArmR: [-66, -8, -66], LoArmR: [-22, -6, 0],
        Spine: [-10, -5, 0], Chest: [-8, -6, 0], Head: [-12, -6, 0], Hips_pos: [0, -0.06, 0]
      }, 'snap'),
      K(0.40, {
        UpArmL: [-70, 10, 56], UpArmR: [-62, -8, -60], Spine: [-8, -5, 0], Head: [-10, -6, 0]
      }, 'hold'),
      K(0.85, {
        Spine: [4, -6, 0], UpArmL: [-40, 8, 32], UpArmR: [-34, -6, -34],
        LoArmL: [-40, 12, 0], LoArmR: [-44, -10, 0], Hips_pos: [0, -0.12, 0]
      }),
      K(1.15, {}, 'out')
    ]
  },

  // ---- THE CLUB STRING ----------------------------------------------------
  // Three swings with an enormous arc and an enormous amount of follow-through.
  // Every one of them is thrown from the hips and every one of them overshoots
  // and has to be hauled back — that recovery is the punish window and it is
  // drawn honestly.
  // 1: the RIGHT club, a low backhand sweep across the body.
  punch1: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        UpArmR: [-6, -40, -52], LoArmR: [-56, -18, 0], HandR: [-10, -70, 0],
        Chest: [8, -34, 0], Spine: [10, -20, 0], Hips: [0, 44, 0], Hips_pos: [0, -0.135, 0]
      }, 'in'),
      K(0.34, {
        UpArmR: [-34, 34, 10], LoArmR: [-16, 0, 0], HandR: [-8, -30, 0],
        Chest: [10, 26, 0], Spine: [12, 16, 0], Hips: [0, -8, 0], Head: [10, -18, 0],
        Hips_pos: [0, -0.115, 0], ThighR: [-26, 9, 0]
      }, 'out'),
      // the overshoot: the mass carries past and has to be gathered back
      K(0.44, { UpArmR: [-38, 42, 6], LoArmR: [-12, 0, 0], Chest: [10, 32, 0], Hips: [0, -14, 0] }, 'out'),
      K(0.62, {}, 'out')
    ]
  },
  // 2: the LEFT (black) club, an overhand hook the other way.
  punch2: {
    dur: 0.68, loop: false, keys: [
      K(0, { UpArmR: [-20, 10, -14], LoArmR: [-30, 0, 0], Chest: [9, 12, 0] }),
      K(0.22, {
        UpArmL: [-30, 44, 56], LoArmL: [-52, 20, 0], HandL: [-10, 70, 0],
        Chest: [8, 36, 0], Spine: [10, 20, 0], Hips: [0, -14, 0], Hips_pos: [0, -0.140, 0]
      }, 'in'),
      K(0.38, {
        UpArmL: [-62, -26, 10], LoArmL: [-14, 0, 0], HandL: [-6, 30, 0],
        Chest: [12, -28, 0], Spine: [14, -18, 0], Hips: [0, 44, 0], Head: [10, 16, 0],
        Hips_pos: [0, -0.112, 0], ThighL: [-34, -7, 0]
      }, 'out'),
      K(0.48, { UpArmL: [-68, -34, 6], LoArmL: [-10, 0, 0], Chest: [12, -34, 0], Hips: [0, 50, 0] }, 'out'),
      K(0.68, {}, 'out')
    ]
  },
  // 3: BOTH clubs raised and driven straight down. A knockdown, NOT a
  // launcher — nothing he does puts you in the air, it puts you on the floor.
  punch3: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        UpArmL: [-152, 14, 26], LoArmL: [-30, 10, 0], HandL: [-16, 44, 0],
        UpArmR: [-148, -12, -28], LoArmR: [-34, -8, 0], HandR: [-16, -44, 0],
        Spine: [-6, -6, 0], Chest: [-8, -8, 0], Head: [-8, -6, 0],
        Hips_pos: [0, -0.045, 0], ThighL: [-14, -7, 0], ShinL: [22, 0, 0]
      }, 'in'),
      K(0.46, {
        UpArmL: [-34, 8, 18], LoArmL: [-14, 4, 0], HandL: [-4, 40, 0],
        UpArmR: [-30, -6, -19], LoArmR: [-16, -4, 0], HandR: [-4, -40, 0],
        Spine: [30, -6, 0], Chest: [22, -8, 0], Head: [22, -6, 0],
        Hips_pos: [0, -0.215, 0],
        ThighL: [-46, -7, 0], ShinL: [62, 0, 0], ThighR: [-38, 9, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.60, { Spine: [29, -6, 0], Hips_pos: [0, -0.205, 0], UpArmL: [-32, 8, 18], UpArmR: [-28, -6, -19] }, 'hold'),
      K(0.92, {}, 'out')
    ]
  },

  // HEAVY — ROOT SLAM: he rears the whole trunk back, then drives both clubs
  // through the floor. The only 'snap' eases in his entire set are here.
  heavy: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      K(0.38, {
        UpArmL: [-160, 18, 34], LoArmL: [-40, 12, 0], HandL: [-20, 46, 0],
        UpArmR: [-156, -16, -36], LoArmR: [-44, -10, 0], HandR: [-20, -46, 0],
        Spine: [-16, -6, 0], Chest: [-14, -8, 0], Head: [-16, -6, 0], Neck: [-8, -3, 0],
        Hips_pos: [0, 0.01, 0], ThighL: [-8, -7, 0], ShinL: [14, 0, 0], ThighR: [-4, 9, 0], ShinR: [12, 0, 0]
      }, 'in'),
      K(0.56, {
        UpArmL: [-22, 6, 14], LoArmL: [-10, 2, 0], HandL: [0, 36, 0],
        UpArmR: [-18, -5, -15], LoArmR: [-12, -2, 0], HandR: [0, -36, 0],
        Spine: [36, -6, 0], Chest: [26, -8, 0], Head: [26, -6, 0], Neck: [8, -3, 0],
        Hips_pos: [0, -0.255, 0],
        ThighL: [-54, -7, 0], ShinL: [74, 0, 0], FootL: [16, -11, 0],
        ThighR: [-46, 9, 0], ShinR: [70, 0, 0], FootR: [14, 11, 0]
      }, 'snap'),
      K(0.74, { Spine: [35, -6, 0], Hips_pos: [0, -0.248, 0], UpArmL: [-20, 6, 14], UpArmR: [-16, -5, -15] }, 'hold'),
      K(1.15, {}, 'out')
    ]
  },

  // ---- REACTIONS ----------------------------------------------------------
  // He barely moves when he is hit. The head snaps and the plates take the
  // rest — a fighter whose whole identity is "I am a wall" cannot be seen
  // rocking backwards off a jab.
  hitLight: {
    dur: 0.32, loop: false, keys: [
      K(0, {}),
      K(0.05, {
        Head: [0, -16, 4], Neck: [-4, -4, 0], Chest: [5, -14, 0], Spine: [9, -8, 0],
        Hips_pos: [0, -0.118, 0]
      }, 'snap'),
      K(0.14, { Head: [3, -13, 3], Chest: [6, -13, 0] }, 'hold'),
      K(0.32, {})
    ]
  },
  hitHeavy: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.07, {
        Head: [-10, -12, 7], Neck: [-8, -4, 0], Chest: [-6, -14, 0], Spine: [1, -8, 0],
        Hips: [-4, 22, 0], UpArmL: [-52, 8, 40], LoArmL: [-22, 10, 0],
        UpArmR: [-44, -6, -44], LoArmR: [-18, -8, 0],
        Hips_pos: [0, -0.075, 0], ThighL: [-34, -7, 0], ShinL: [48, 0, 0]
      }, 'snap'),
      K(0.24, { Head: [-6, -12, 6], Chest: [-3, -14, 0], UpArmL: [-46, 8, 36], UpArmR: [-38, -6, -40] }, 'hold'),
      K(0.62, {})
    ]
  },
  launched: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        Spine: [-22, -5, 0], Chest: [-14, -7, 0], Head: [-16, -6, 0], Hips: [-14, 14, 0],
        ThighL: [-50, -7, 0], ShinL: [40, 0, 0], ThighR: [-22, 9, 0], ShinR: [52, 0, 0],
        UpArmL: [-92, 8, 34], LoArmL: [-26, 12, 0], UpArmR: [-78, -6, -38], LoArmR: [-30, -10, 0]
      }),
      K(0.45, {
        Spine: [-28, -5, 0], Hips: [-20, 14, 0], ThighL: [-40, -7, 0], ThighR: [-32, 9, 0],
        UpArmL: [-84, 8, 40], UpArmR: [-86, -6, -34]
      }),
      K(0.9, {
        Spine: [-22, -5, 0], Hips: [-14, 14, 0], ThighL: [-50, -7, 0], ThighR: [-22, 9, 0],
        UpArmL: [-92, 8, 34], UpArmR: [-78, -6, -38]
      })
    ]
  },
  // knockdown: a felled tree. He goes over as one piece and hits flat.
  knockdown: {
    dur: 0.62, loop: false, keys: [
      K(0, { Spine: [-18, -5, 0], Hips: [-14, 12, 0], Hips_pos: [0, -0.14, 0] }),
      K(0.26, {
        Hips: [-66, 6, 0], Hips_pos: [0, -0.60, -0.10], Spine: [-12, -2, 0], Chest: [-6, -2, 0],
        Head: [-14, 0, 0], ThighL: [-4, -6, 0], ShinL: [16, 0, 0], ThighR: [2, 8, 0], ShinR: [22, 0, 0],
        UpArmL: [-34, 0, 52], LoArmL: [-16, 6, 0], UpArmR: [-26, 0, -56], LoArmR: [-12, -6, 0]
      }, 'snap'),
      K(0.62, {
        Hips: [-82, 4, 0], Hips_pos: [0, -0.74, -0.16], Spine: [-6, -2, 0], Chest: [-3, -2, 0],
        Head: [-8, 0, 0], ThighL: [-10, -6, 0], ShinL: [8, 0, 0], ThighR: [-4, 8, 0], ShinR: [14, 0, 0],
        UpArmL: [-30, 0, 60], LoArmL: [-10, 6, 0], UpArmR: [-22, 0, -64], LoArmR: [-8, -6, 0]
      }, 'out')
    ]
  },
  // getup: he does not kip up, he GROWS back up — one leg under him, then the
  // trunk levers itself vertical.
  getup: {
    dur: 0.85, loop: false, keys: [
      K(0, {
        Hips: [-82, 4, 0], Hips_pos: [0, -0.74, -0.16], ThighL: [-10, -6, 0], ShinL: [8, 0, 0],
        ThighR: [-4, 8, 0], ShinR: [14, 0, 0], UpArmL: [-30, 0, 60], UpArmR: [-22, 0, -64]
      }),
      K(0.34, {
        Hips: [-52, 10, 0], Hips_pos: [0, -0.50, -0.06], Spine: [30, -6, 0],
        ThighL: [-30, -7, 0], ShinL: [82, 0, 0], ThighR: [26, 9, 0], ShinR: [88, 0, 0],
        UpArmL: [-20, 8, 26], LoArmL: [-56, 12, 0], UpArmR: [-14, -6, -28], LoArmR: [-52, -10, 0]
      }),
      K(0.62, {
        Hips: [-16, 16, 0], Hips_pos: [0, -0.24, 0], Spine: [20, -6, 0],
        ThighL: [-46, -7, 0], ShinL: [64, 0, 0], ThighR: [-32, 9, 0], ShinR: [56, 0, 0]
      }),
      K(0.85, {}, 'out')
    ]
  },
  // techRise: even his quick-rise is heavy — he rolls the mass over one
  // shoulder rather than springing.
  techRise: {
    dur: 0.34, loop: false, keys: [
      K(0, {
        Hips: [-76, 4, 0], Hips_pos: [0, -0.68, -0.12], Spine: [-8, -2, 0],
        ThighL: [58, -6, 0], ShinL: [20, 0, 0], ThighR: [68, 8, 0], ShinR: [28, 0, 0],
        UpArmL: [-32, 0, 58], UpArmR: [-24, 0, -62]
      }),
      K(0.13, {
        Hips: [-48, 12, 0], Hips_pos: [0, -0.44, 0.04], Spine: [22, -6, 0], Head: [16, -6, 0],
        ThighL: [-84, -7, 0], ShinL: [96, 0, 0], ThighR: [-64, 9, 0], ShinR: [92, 0, 0],
        UpArmL: [14, 6, 44], UpArmR: [18, -5, -48]
      }, 'in'),
      K(0.24, {
        Hips: [-6, 18, 0], Hips_pos: [0, -0.145, 0], Spine: [14, -6, 0], Chest: [11, -8, 0],
        ThighL: [-40, -7, 0], ShinL: [56, 0, 0], ThighR: [-28, 9, 0], ShinR: [48, 0, 0],
        UpArmL: [-24, 6, 24], LoArmL: [-46, 12, 0], UpArmR: [-20, -5, -26], LoArmR: [-50, -10, 0]
      }, 'out'),
      K(0.34, {}, 'out')
    ]
  },

  // ---- ROOT ERUPTION (CT1) ------------------------------------------------
  // He drives the right club into the ground palm-down and HOLDS it there.
  // The spikes come up somewhere else — the whole animation is one long push
  // downward, which is the read: he does not throw the attack, he plants it.
  ct1: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        UpArmR: [-134, -14, -22], LoArmR: [-38, -10, 0], HandR: [-18, -40, 0],
        UpArmL: [-24, 8, 26], LoArmL: [-46, 12, 0],
        Spine: [-2, -6, 0], Chest: [-4, -8, 0], Head: [-4, -6, 0], Hips_pos: [0, -0.04, 0]
      }, 'in'),
      K(0.42, {
        UpArmR: [-4, 6, -6], LoArmR: [-8, 0, 0], HandR: [10, -20, 0],
        UpArmL: [-16, 8, 20], LoArmL: [-38, 12, 0],
        Spine: [34, -6, 0], Chest: [24, -8, 0], Head: [26, -6, 0], Neck: [6, -3, 0],
        Hips_pos: [0, -0.245, 0],
        ThighL: [-52, -7, 0], ShinL: [72, 0, 0], ThighR: [-44, 9, 0], ShinR: [68, 0, 0]
      }, 'out'),
      // the hold: the club stays in the floor while the roots travel
      K(0.66, {
        UpArmR: [-3, 6, -6], LoArmR: [-8, 0, 0], Spine: [34, -6, 0], Hips_pos: [0, -0.250, 0]
      }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },

  // ---- CURSED BUD (CT2) ---------------------------------------------------
  // The one quick thing he does. The left hand opens, the white fingers spread,
  // and the seed goes out on a flick of the wrist — no wind-up worth the name,
  // because the move is not the threat, the six seconds after it are.
  ct2: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        UpArmL: [-48, 26, 30], LoArmL: [-96, 30, 0], HandL: [-30, 70, 0],
        Chest: [8, -20, 0], Hips: [0, 30, 0], Head: [8, -14, 0], Hips_pos: [0, -0.125, 0]
      }, 'in'),
      K(0.30, {
        UpArmL: [-84, 6, 8], LoArmL: [-12, 0, 0], HandL: [-52, 10, 0],
        Chest: [10, 14, 0], Spine: [13, 8, 0], Hips: [0, 4, 0], Head: [8, 6, 0],
        Hips_pos: [0, -0.105, 0]
      }, 'out'),
      K(0.42, { UpArmL: [-86, 8, 8], LoArmL: [-14, 0, 0], HandL: [-54, 10, 0], Chest: [10, 16, 0] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // ---- ROOT FIELD (SPECIAL) -----------------------------------------------
  // Both clubs planted, the head bowed almost to the floor, everything sinking.
  // He is not casting a spell at the ground, he is pushing himself into it —
  // and the field comes up around him because of that, not in spite of it.
  rootField: {
    dur: 1.25, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        UpArmL: [-118, 20, 40], LoArmL: [-44, 14, 0], UpArmR: [-114, -18, -42], LoArmR: [-48, -12, 0],
        Spine: [-8, -6, 0], Chest: [-8, -8, 0], Head: [-10, -6, 0], Hips_pos: [0, -0.02, 0]
      }, 'in'),
      K(0.56, {
        UpArmL: [0, 10, 16], LoArmL: [-6, 4, 0], HandL: [16, 30, 0],
        UpArmR: [4, -8, -17], LoArmR: [-8, -4, 0], HandR: [16, -30, 0],
        Spine: [44, -6, 0], Chest: [30, -8, 0], Neck: [12, -3, 0], Head: [30, -6, 0],
        Hips_pos: [0, -0.290, 0],
        ThighL: [-58, -9, 0], ShinL: [82, 0, 0], FootL: [18, -11, 0],
        ThighR: [-50, 11, 0], ShinR: [78, 0, 0], FootR: [16, 11, 0]
      }, 'out'),
      K(0.95, {
        Spine: [45, -6, 0], Hips_pos: [0, -0.300, 0], Head: [31, -6, 0],
        UpArmL: [1, 10, 16], UpArmR: [5, -8, -17]
      }, 'hold'),
      K(1.25, {}, 'out')
    ]
  },

  // ---- WOODEN BALL (ULTIMATE) ---------------------------------------------
  // 木の鞠. Both arms hauled overhead as the mass condenses, a long strained
  // hold while it grows, then the whole body heaves it down. There is no
  // barrier and no chant — this is a non-domain ultimate and it is fast for
  // what it is, but it is still HIM doing it, so it is fast the way a falling
  // tree is fast.
  ult: {
    dur: 1.55, loop: false, keys: [
      K(0, {}),
      K(0.26, {
        UpArmL: [-166, 10, 22], LoArmL: [-24, 8, 0], HandL: [-10, 40, 0],
        UpArmR: [-162, -8, -24], LoArmR: [-28, -6, 0], HandR: [-10, -40, 0],
        Spine: [-18, -6, 0], Chest: [-16, -8, 0], Head: [-22, -6, 0], Neck: [-10, -3, 0],
        Hips_pos: [0, -0.02, 0], ThighL: [-10, -7, 0], ShinL: [16, 0, 0], ThighR: [-6, 9, 0], ShinR: [14, 0, 0]
      }, 'out'),
      // the strain: it is getting heavier
      K(0.62, {
        UpArmL: [-172, 6, 18], LoArmL: [-20, 8, 0], UpArmR: [-168, -4, -20], LoArmR: [-24, -6, 0],
        Spine: [-14, -6, 0], Head: [-24, -6, 0], Hips_pos: [0, -0.115, 0],
        ThighL: [-26, -7, 0], ShinL: [38, 0, 0], ThighR: [-22, 9, 0], ShinR: [34, 0, 0]
      }, 'hold'),
      K(0.86, {
        UpArmL: [-176, 4, 16], UpArmR: [-172, -2, -18], Spine: [-12, -6, 0],
        Hips_pos: [0, -0.165, 0], ThighL: [-36, -7, 0], ShinL: [50, 0, 0], ThighR: [-30, 9, 0], ShinR: [46, 0, 0]
      }, 'hold'),
      // the drop
      K(1.02, {
        UpArmL: [-16, 6, 12], LoArmL: [-8, 2, 0], HandL: [4, 34, 0],
        UpArmR: [-12, -5, -13], LoArmR: [-10, -2, 0], HandR: [4, -34, 0],
        Spine: [40, -6, 0], Chest: [28, -8, 0], Head: [30, -6, 0],
        Hips_pos: [0, -0.275, 0],
        ThighL: [-56, -7, 0], ShinL: [78, 0, 0], ThighR: [-48, 9, 0], ShinR: [74, 0, 0]
      }, 'snap'),
      K(1.20, { Spine: [39, -6, 0], Hips_pos: [0, -0.268, 0], UpArmL: [-14, 6, 12], UpArmR: [-10, -5, -13] }, 'hold'),
      K(1.55, {}, 'out')
    ]
  },

  // ---- KO / VICTORY -------------------------------------------------------
  // ko: the tree comes down. One long topple, no flailing.
  ko: {
    dur: 1.15, loop: false, keys: [
      K(0, { Spine: [-14, -5, 0], Head: [-16, -6, 0] }),
      K(0.40, {
        Hips: [-62, 6, 0], Hips_pos: [0, -0.56, -0.10], Spine: [-10, -2, 0], Head: [-12, 8, 0],
        ThighL: [48, -6, 0], ShinL: [20, 0, 0], ThighR: [58, 8, 0], ShinR: [28, 0, 0],
        UpArmL: [-40, 0, 62], LoArmL: [-12, 6, 0], UpArmR: [-18, 0, -66], LoArmR: [-8, -6, 0]
      }, 'snap'),
      K(1.15, {
        Hips: [-86, 2, 0], Hips_pos: [0, -0.76, -0.18], Spine: [-4, 0, 0], Chest: [-2, 0, 0],
        Head: [-6, 14, 0], ThighL: [70, -8, 4], ShinL: [10, 0, 0], ThighR: [78, 10, -4], ShinR: [16, 0, 0],
        UpArmL: [-42, 0, 72], LoArmL: [-8, 6, 0], UpArmR: [-14, 0, -76], LoArmR: [-6, -6, 0],
        HandL: [0, 0, 0], HandR: [0, 0, 0]
      }, 'out')
    ]
  },
  // victory: he simply stops, straightens a little, and stands there. The
  // flowers do the celebrating (see the model's setVitality).
  // ---- TAUNT — NO BUBBLE. HE GROWS SOMETHING. -----------------------------
  // The gentlest taunt in the game, from the character with the highest raw
  // damage in his weight class. He goes down to one knee, presses a palm flat
  // to the ground, waits — and then CUPS whatever came up, and brings it to his
  // face. He is not showing it to you. That is the point: you are not what he
  // is fighting for, the ground is.
  //
  // Authored in his own language throughout: the shove-and-plant weight, the
  // overshoot on every follow-through, and the settle that is never placed. The
  // kneel takes almost a second because nothing about Hanami is quick.
  taunt: {
    dur: 3.6, loop: false, keys: [
      K(0, {}),
      // the descent — the mass goes down before the knee does
      K(0.50, {
        Spine: [26, -6, 0], Chest: [20, -8, 0], Neck: [8, -3, 0], Head: [18, -6, 0],
        UpArmL: [-16, 6, 14], LoArmL: [-52, 14, 0],
        UpArmR: [-14, -5, -15], LoArmR: [-56, -12, 0],
        Hips_pos: [0, -0.28, 0.04], Hips: [4, 16, 0],
        ThighL: [-58, -7, 0], ShinL: [74, 0, 0], FootL: [16, -11, 0],
        ThighR: [-44, 9, 0], ShinR: [66, 0, 0], FootR: [14, 11, 0]
      }, 'in'),
      // the palm goes flat to the floor. Fully committed — no hover.
      K(0.95, {
        Spine: [38, -6, 0], Chest: [28, -8, 0], Neck: [10, -3, 0], Head: [26, -6, 0],
        UpArmR: [-58, -8, -10], LoArmR: [-22, -6, 0], HandR: [40, -30, 0],
        UpArmL: [-12, 6, 16], LoArmL: [-46, 14, 0],
        Hips_pos: [0, -0.44, 0.09], Hips: [8, 14, 0],
        ThighL: [-88, -7, 0], ShinL: [104, 0, 0], FootL: [22, -11, 0],
        ThighR: [-66, 9, 0], ShinR: [92, 0, 0], FootR: [20, 11, 0]
      }, 'out'),
      // and he waits. The only movement is a slow breath through the back.
      K(1.85, {
        Spine: [36, -6, 0], Chest: [27, -8, 0], Head: [27, -6, 0],
        UpArmR: [-58, -8, -10], LoArmR: [-22, -6, 0], HandR: [40, -30, 0],
        UpArmL: [-12, 6, 16], LoArmL: [-46, 14, 0],
        Hips_pos: [0, -0.42, 0.085]
      }, 'hold'),
      // THE CUP. The hand turns over and lifts, and the head comes down to
      // meet it rather than the hand coming up to the head.
      K(2.40, {
        Spine: [32, -6, 0], Chest: [24, -8, 0], Neck: [4, -3, 0], Head: [30, -4, -6],
        UpArmR: [-76, -14, -18], LoArmR: [-72, -22, 0], HandR: [26, -10, 0],
        UpArmL: [-14, 6, 15], LoArmL: [-48, 14, 0],
        Hips_pos: [0, -0.40, 0.07], Hips: [8, 16, 0]
      }, 'out'),
      K(2.90, {
        Spine: [31, -6, 0], Chest: [24, -8, 0], Head: [31, -4, -6],
        UpArmR: [-78, -14, -18], LoArmR: [-74, -22, 0], HandR: [26, -10, 0],
        UpArmL: [-14, 6, 15], LoArmL: [-48, 14, 0],
        Hips_pos: [0, -0.41, 0.068]
      }, 'hold'),
      // and he GROWS back up, exactly as his getup does — one leg, then the
      // rest — with the overshoot his whole set is built on
      K(3.25, {
        Spine: [6, -6, 0], Chest: [5, -8, 0], Neck: [3, -3, 0], Head: [4, -6, 0],
        UpArmL: [-8, 5, 21], LoArmL: [-32, 12, 0],
        UpArmR: [-6, -4, -22], LoArmR: [-36, -10, 0],
        Hips_pos: [0, -0.06, -0.02],
        ThighL: [-22, -7, 0], ShinL: [36, 0, 0], ThighR: [-17, 9, 0], ShinR: [31, 0, 0]
      }, 'snap'),
      K(3.6, {}, 'out')
    ]
  },
  victory: {
    dur: 3.6, loop: false, keys: [
      K(0, {}),
      K(0.9, {
        Spine: [4, -6, 0], Chest: [3, -8, 0], Neck: [0, -3, 0], Head: [-4, -6, 0],
        Hips_pos: [0, -0.070, 0], UpArmL: [-6, 5, 15], UpArmR: [-4, -4, -16],
        ThighL: [-14, -7, 0], ShinL: [24, 0, 0], ThighR: [-10, 9, 0], ShinR: [20, 0, 0]
      }, 'out'),
      K(2.2, { Head: [-2, 12, 0], Chest: [4, -8, 0], Hips_pos: [0, -0.062, 0] }),
      K(3.6, { Head: [-6, -8, 0], Hips_pos: [0, -0.075, 0] })
    ]
  }
};
