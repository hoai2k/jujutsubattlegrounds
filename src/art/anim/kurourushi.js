// KUROURUSHI-specific clips.
//
// MOVEMENT LANGUAGE: SKITTER AND FREEZE. The rules followed throughout:
//   · NOTHING EASES IN. Every key that starts a motion uses 'snap' — he is
//     already moving before you have registered that he started. The eases
//     that DO appear are on the settles, so motion arrives instantly and
//     leaves slowly, which is what makes an insect look like an insect.
//   · EVERY CLIP CONTAINS AT LEAST ONE 'hold'. The stillness is the character.
//     A body that twitches constantly reads as nervous; a body that twitches
//     and then STOPS DEAD, for longer than is comfortable, reads as wrong.
//   · THE LOWER ARM PAIR IS FOLDED AT THE CHEST until it is used, and when it
//     is used it fires a beat AFTER the upper pair, never with it. Four arms
//     moving in unison is a costume; four arms on two clocks is a body plan.
//   · THE BODY IS PITCHED FORWARD off the hips at all times and the head is
//     levelled back up against it. That silhouette — head low and forward,
//     abdomen counterweighting behind — is the opposite of Hanami's vertical
//     and it is deliberate: they must never read as the same kind of creature.
//
// Bone names for the second pair are the shared ones with a '2' suffix, as
// Sukuna's set established. They are declared in the STANCE so that the
// BASE clips (which know nothing about them) still hold them in his fold.
const K = (t, pose, e) => ({ t, pose, e });

export const KUROURUSHI_STANCE = {
  Hips_pos: [0, -0.055, 0],
  // The pitch is real but it is NOT extreme: at the 23 degrees the first pass
  // carried, the head disappeared under the pronotum from every angle a player
  // ever sees him from and the eyes never read at all. 13 keeps the forward
  // insect lean and keeps the face in frame.
  Hips: [5, 22, 0], Spine: [13, -6, 0], Chest: [9, -8, 0], Neck: [-9, -4, 0], Head: [-8, -6, 0],
  ClavL: [0, 0, 0], UpArmL: [-32, 10, 15], LoArmL: [-96, 22, 0], HandL: [-20, 60, 0],
  ClavR: [0, 0, 0], UpArmR: [-28, -8, -16], LoArmR: [-100, -20, 0], HandR: [-20, -60, 0],
  // the lower pair, folded tight and high — a mantis at rest
  ClavL2: [0, 0, 0], UpArmL2: [-62, 26, 10], LoArmL2: [-126, 42, 0], HandL2: [-32, 72, 0],
  ClavR2: [0, 0, 0], UpArmR2: [-58, -24, -12], LoArmR2: [-130, -40, 0], HandR2: [-32, -72, 0],
  ThighL: [-22, -6, 0], ShinL: [36, 0, 0], FootL: [13, -10, 0],
  ThighR: [-16, 8, 0], ShinR: [30, 0, 0], FootR: [11, 10, 0]
};

export const KUROURUSHI_CLIPS = {
  // ---- LOCOMOTION ---------------------------------------------------------
  // idle: two twitches and a long dead stop. The antennae keep going after the
  // body stops (they are spring chains on the model) — that overrun IS the
  // read, and it is why the idle can afford to be this still.
  idle: {
    dur: 3.2, loop: true, keys: [
      K(0, {}),
      K(0.18, {
        Head: [-19, -16, 4], Neck: [-15, -8, 0], Chest: [16, -12, 0],
        UpArmL2: [-58, 30, 14], LoArmL2: [-120, 46, 0]
      }, 'snap'),
      K(0.30, { Head: [-18, -14, 3] }, 'hold'),
      K(1.20, { Head: [-14, -2, 0], Chest: [15, -6, 0], Hips_pos: [0, -0.048, 0] }, 'out'),
      K(1.34, {
        Head: [-17, 12, -4], Neck: [-19, 6, 0], Hips: [7, 27, 0],
        UpArmR2: [-54, -28, -16], LoArmR2: [-124, -44, 0], HandR2: [-40, -72, 0]
      }, 'snap'),
      // the dead stop
      K(2.30, { Head: [-17, 12, -4], Neck: [-19, 6, 0], Hips: [7, 27, 0] }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },

  // walk: a low scuttle. Short quick steps, the hips barely rise, the torso
  // stays locked forward, and the lower arms paddle out of phase with the legs.
  walk: {
    dur: 0.66, loop: true, keys: [
      K(0, {
        ThighL: [-38, -6, 0], ShinL: [26, 0, 0], FootL: [-4, -10, 0],
        ThighR: [14, 8, 0], ShinR: [46, 0, 0], FootR: [22, 10, 0],
        Hips_pos: [0, -0.050, 0], Hips: [7, 18, 0],
        UpArmL: [-40, 10, 15], UpArmR: [-20, -8, -16],
        UpArmL2: [-56, 26, 12], UpArmR2: [-66, -24, -10]
      }),
      K(0.165, {
        ThighL: [-14, -6, 0], ShinL: [38, 0, 0], ThighR: [-8, 8, 0], ShinR: [34, 0, 0],
        Hips_pos: [0, -0.068, 0], Hips: [7, 22, 0]
      }, 'snap'),
      K(0.33, {
        ThighL: [14, -6, 0], ShinL: [46, 0, 0], FootL: [22, -10, 0],
        ThighR: [-38, 8, 0], ShinR: [26, 0, 0], FootR: [-4, 10, 0],
        Hips_pos: [0, -0.050, 0], Hips: [7, 26, 0],
        UpArmL: [-20, 10, 15], UpArmR: [-40, -8, -16],
        UpArmL2: [-66, 26, 12], UpArmR2: [-56, -24, -10]
      }),
      K(0.495, {
        ThighL: [-8, -6, 0], ShinL: [34, 0, 0], ThighR: [-14, 8, 0], ShinR: [38, 0, 0],
        Hips_pos: [0, -0.068, 0], Hips: [7, 22, 0]
      }, 'snap'),
      K(0.66, {
        ThighL: [-38, -6, 0], ShinL: [26, 0, 0], FootL: [-4, -10, 0],
        ThighR: [14, 8, 0], ShinR: [46, 0, 0], FootR: [22, 10, 0],
        Hips_pos: [0, -0.050, 0], UpArmL: [-40, 10, 15], UpArmR: [-20, -8, -16],
        UpArmL2: [-56, 26, 12], UpArmR2: [-66, -24, -10]
      })
    ]
  },

  // run: the scuttle opens up. The torso drops FURTHER forward (he is nearly
  // horizontal at speed), all four arms reach, and the stride is very fast for
  // something this size — "unsettlingly fast" is the whole brief for this clip.
  run: {
    dur: 0.44, loop: true, keys: [
      K(0, {
        Spine: [38, -5, 0], Chest: [22, -7, 0], Neck: [-30, -4, 0], Head: [-26, -6, 0],
        Hips: [10, 16, 0], Hips_pos: [0, -0.075, 0],
        ThighL: [-58, -6, 0], ShinL: [30, 0, 0], FootL: [-14, -10, 0],
        ThighR: [26, 8, 0], ShinR: [70, 0, 0], FootR: [30, 10, 0],
        UpArmL: [-14, 10, 22], LoArmL: [-84, 18, 0],
        UpArmR: [-62, -8, -24], LoArmR: [-70, -16, 0],
        UpArmL2: [-30, 30, 26], LoArmL2: [-88, 38, 0],
        UpArmR2: [-84, -28, -28], LoArmR2: [-96, -36, 0]
      }),
      K(0.11, {
        ThighL: [-16, -6, 0], ShinL: [40, 0, 0], ThighR: [-22, 8, 0], ShinR: [46, 0, 0],
        Hips_pos: [0, -0.118, 0], Spine: [36, -5, 0]
      }, 'snap'),
      K(0.22, {
        Spine: [38, -5, 0], Chest: [22, -7, 0], Hips: [10, 28, 0], Hips_pos: [0, -0.075, 0],
        ThighL: [26, -6, 0], ShinL: [70, 0, 0], FootL: [30, -10, 0],
        ThighR: [-58, 8, 0], ShinR: [30, 0, 0], FootR: [-14, 10, 0],
        UpArmL: [-62, 10, 22], LoArmL: [-70, 18, 0],
        UpArmR: [-14, -8, -24], LoArmR: [-84, -16, 0],
        UpArmL2: [-84, 30, 26], LoArmL2: [-96, 38, 0],
        UpArmR2: [-30, -28, -28], LoArmR2: [-88, -36, 0]
      }),
      K(0.33, {
        ThighL: [-22, -6, 0], ShinL: [46, 0, 0], ThighR: [-16, 8, 0], ShinR: [40, 0, 0],
        Hips_pos: [0, -0.118, 0], Spine: [36, -5, 0]
      }, 'snap'),
      K(0.44, {
        Spine: [38, -5, 0], Hips: [10, 16, 0], Hips_pos: [0, -0.075, 0],
        ThighL: [-58, -6, 0], ShinL: [30, 0, 0], FootL: [-14, -10, 0],
        ThighR: [26, 8, 0], ShinR: [70, 0, 0], FootR: [30, 10, 0],
        UpArmL: [-14, 10, 22], UpArmR: [-62, -8, -24],
        UpArmL2: [-30, 30, 26], UpArmR2: [-84, -28, -28]
      })
    ]
  },

  // dash: a LOW SCUTTLING RUSH. He drops almost to the floor and goes, all
  // four arms out in front like a sprinter's start. No wind-up frame at all.
  dash: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.04, {
        Hips_pos: [0, -0.185, 0], Spine: [46, -5, 0], Chest: [26, -7, 0],
        Neck: [-38, -4, 0], Head: [-34, -6, 0],
        ThighL: [-62, -6, 0], ShinL: [44, 0, 0], ThighR: [30, 8, 0], ShinR: [76, 0, 0],
        UpArmL: [12, 12, 24], LoArmL: [-56, 20, 0],
        UpArmR: [16, -10, -26], LoArmR: [-52, -18, 0],
        UpArmL2: [-4, 32, 30], LoArmL2: [-64, 40, 0],
        UpArmR2: [0, -30, -32], LoArmR2: [-60, -38, 0]
      }, 'snap'),
      K(0.18, {
        Hips_pos: [0, -0.150, 0], Spine: [42, -5, 0],
        ThighL: [-44, -6, 0], ShinL: [36, 0, 0], ThighR: [16, 8, 0], ShinR: [62, 0, 0]
      }, 'hold'),
      K(0.30, {}, 'out')
    ]
  },

  jump: {
    dur: 0.46, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.20, 0], Spine: [34, -6, 0],
        ThighL: [-56, -6, 0], ShinL: [70, 0, 0], ThighR: [-48, 8, 0], ShinR: [66, 0, 0]
      }),
      K(0.12, {
        Hips_pos: [0, 0.03, 0], Spine: [8, -6, 0], Chest: [6, -8, 0], Neck: [-6, -4, 0],
        ThighL: [-34, -6, 0], ShinL: [34, 0, 0], FootL: [26, -10, 0],
        ThighR: [-18, 8, 0], ShinR: [40, 0, 0], FootR: [28, 10, 0],
        UpArmL: [-66, 12, 34], LoArmL: [-52, 18, 0],
        UpArmR: [-58, -10, -36], LoArmR: [-56, -16, 0],
        UpArmL2: [-36, 30, 34], UpArmR2: [-32, -28, -36]
      }, 'snap'),
      K(0.46, {
        Hips_pos: [0, 0, 0], ThighL: [-48, -6, 0], ShinL: [58, 0, 0],
        ThighR: [-26, 8, 0], ShinR: [46, 0, 0], UpArmL: [-54, 12, 30], UpArmR: [-48, -10, -32]
      })
    ]
  },
  fall: {
    dur: 0.6, loop: true, keys: [
      K(0, {
        ThighL: [-42, -6, 0], ShinL: [46, 0, 0], ThighR: [-16, 8, 0], ShinR: [36, 0, 0],
        UpArmL: [-64, 12, 40], LoArmL: [-46, 18, 0], UpArmR: [-56, -10, -42], LoArmR: [-50, -16, 0],
        UpArmL2: [-40, 30, 36], UpArmR2: [-36, -28, -38], Spine: [22, -6, 0]
      }),
      K(0.3, {
        ThighL: [-30, -6, 0], ShinL: [38, 0, 0], ThighR: [-28, 8, 0], ShinR: [42, 0, 0],
        UpArmL: [-58, 12, 36], UpArmR: [-62, -10, -38],
        UpArmL2: [-34, 30, 32], UpArmR2: [-42, -28, -34]
      }),
      K(0.6, {
        ThighL: [-42, -6, 0], ShinL: [46, 0, 0], ThighR: [-16, 8, 0], ShinR: [36, 0, 0],
        UpArmL: [-64, 12, 40], UpArmR: [-56, -10, -42],
        UpArmL2: [-40, 30, 36], UpArmR2: [-36, -28, -38]
      })
    ]
  },
  land: {
    dur: 0.24, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.24, 0], Spine: [40, -6, 0], Chest: [24, -8, 0], Neck: [-32, -4, 0],
        ThighL: [-60, -6, 0], ShinL: [76, 0, 0], ThighR: [-44, 8, 0], ShinR: [70, 0, 0],
        UpArmL: [-6, 12, 30], UpArmR: [-2, -10, -32],
        UpArmL2: [-20, 32, 28], UpArmR2: [-16, -30, -30]
      }, 'snap'),
      K(0.10, { Hips_pos: [0, -0.21, 0], Spine: [38, -6, 0] }, 'hold'),
      K(0.24, {}, 'out')
    ]
  },

  // ---- GUARD --------------------------------------------------------------
  // POOR. He does not so much guard as cringe: the upper arms come up in front
  // of the face, the lower pair crosses the thorax, and the plates take what
  // gets through. There is a visible gap and that is the point.
  block: {
    dur: 0.14, loop: false, keys: [
      K(0, {}),
      K(0.08, {
        UpArmL: [-84, 22, 10], LoArmL: [-118, 26, 0], HandL: [-16, 92, 0],
        UpArmR: [-78, -18, -12], LoArmR: [-124, -24, 0], HandR: [-16, -92, 0],
        UpArmL2: [-70, 34, 22], LoArmL2: [-118, 48, 0],
        UpArmR2: [-66, -32, -24], LoArmR2: [-122, -46, 0],
        Spine: [30, -8, 0], Chest: [18, -10, 0], Neck: [-20, -4, 0], Head: [-14, -6, 0],
        Hips_pos: [0, -0.095, 0], ThighL: [-30, -6, 0], ShinL: [44, 0, 0]
      }, 'snap'),
      K(0.14, {
        UpArmL: [-84, 22, 10], LoArmL: [-118, 26, 0], UpArmR: [-78, -18, -12], LoArmR: [-124, -24, 0],
        UpArmL2: [-70, 34, 22], UpArmR2: [-66, -32, -24], Hips_pos: [0, -0.095, 0], Spine: [30, -8, 0]
      })
    ]
  },
  blockHit: {
    dur: 0.22, loop: false, keys: [
      K(0, {
        UpArmL: [-84, 22, 10], LoArmL: [-118, 26, 0], UpArmR: [-78, -18, -12], LoArmR: [-124, -24, 0],
        UpArmL2: [-70, 34, 22], UpArmR2: [-66, -32, -24], Hips_pos: [0, -0.095, 0], Spine: [30, -8, 0]
      }),
      K(0.04, {
        UpArmL: [-62, 22, 10], LoArmL: [-100, 26, 0], UpArmR: [-56, -18, -12], LoArmR: [-106, -24, 0],
        UpArmL2: [-52, 34, 22], UpArmR2: [-48, -32, -24],
        Spine: [40, -8, 0], Head: [-24, -6, 0], Hips_pos: [0, -0.130, 0]
      }, 'snap'),
      K(0.22, {
        UpArmL: [-84, 22, 10], UpArmR: [-78, -18, -12],
        UpArmL2: [-70, 34, 22], UpArmR2: [-66, -32, -24], Hips_pos: [0, -0.095, 0]
      })
    ]
  },
  guardBreak: {
    dur: 0.9, loop: false, keys: [
      K(0, {
        UpArmL: [-84, 22, 10], LoArmL: [-118, 26, 0], UpArmR: [-78, -18, -12], LoArmR: [-124, -24, 0],
        UpArmL2: [-70, 34, 22], UpArmR2: [-66, -32, -24]
      }),
      K(0.08, {
        UpArmL: [-96, 8, 72], LoArmL: [-22, 4, 0], UpArmR: [-88, -6, -76], LoArmR: [-18, -4, 0],
        UpArmL2: [-40, 20, 74], LoArmL2: [-26, 20, 0],
        UpArmR2: [-36, -18, -78], LoArmR2: [-22, -18, 0],
        Spine: [-6, -6, 0], Chest: [-10, -8, 0], Neck: [4, -4, 0], Head: [6, -6, 0],
        Hips: [-8, 22, 0], Hips_pos: [0, -0.015, 0]
      }, 'snap'),
      K(0.34, {
        UpArmL: [-90, 8, 66], UpArmR: [-82, -6, -70],
        UpArmL2: [-36, 20, 68], UpArmR2: [-32, -18, -72], Spine: [-4, -6, 0]
      }, 'hold'),
      K(0.66, {
        Spine: [14, -6, 0], Chest: [10, -8, 0], UpArmL: [-50, 10, 26], UpArmR: [-44, -8, -28],
        UpArmL2: [-56, 26, 18], UpArmR2: [-52, -24, -20], Hips_pos: [0, -0.07, 0]
      }),
      K(0.9, {}, 'out')
    ]
  },

  // ---- THE MULTI-LIMB STRING ----------------------------------------------
  // Fast for a heavyweight and very WIDE horizontally: each hit is a different
  // pair of arms sweeping across, so the string covers a huge arc without any
  // single swing being especially long. The lower pair always lands a beat
  // behind the upper.
  // 1: upper right rakes across
  punch1: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.06, {
        UpArmR: [-24, -34, -46], LoArmR: [-72, -18, 0], HandR: [-16, -70, 0],
        Chest: [14, -26, 0], Hips: [7, 40, 0]
      }, 'snap'),
      K(0.15, {
        UpArmR: [-58, 32, 6], LoArmR: [-18, 0, 0], HandR: [-8, -20, 0],
        UpArmR2: [-46, -14, -22], LoArmR2: [-104, -28, 0],
        Chest: [16, 24, 0], Spine: [24, 14, 0], Hips: [7, 2, 0], Head: [-14, 12, 0]
      }, 'snap'),
      K(0.20, { UpArmR: [-58, 34, 6], Chest: [16, 26, 0], UpArmR2: [-44, -14, -22] }, 'hold'),
      K(0.36, {}, 'out')
    ]
  },
  // 2: upper left comes back the other way, lower left follows through
  punch2: {
    dur: 0.38, loop: false, keys: [
      K(0, { UpArmR: [-44, 16, -8], LoArmR: [-52, 0, 0], Chest: [15, 10, 0] }),
      K(0.06, {
        UpArmL: [-28, 36, 50], LoArmL: [-70, 20, 0], HandL: [-16, 70, 0],
        Chest: [14, 28, 0], Hips: [7, 0, 0]
      }, 'snap'),
      K(0.16, {
        UpArmL: [-62, -30, 8], LoArmL: [-16, 0, 0], HandL: [-8, 20, 0],
        UpArmL2: [-42, 12, 24], LoArmL2: [-100, 30, 0],
        Chest: [17, -26, 0], Spine: [25, -16, 0], Hips: [7, 44, 0], Head: [-14, -14, 0]
      }, 'snap'),
      K(0.21, { UpArmL: [-64, -32, 8], Chest: [17, -28, 0], UpArmL2: [-40, 12, 24] }, 'hold'),
      K(0.38, {}, 'out')
    ]
  },
  // 3: ALL FOUR sweep out at once — the one time they move together, and it
  // knocks down rather than launching.
  punch3: {
    dur: 0.60, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        UpArmL: [-46, 34, 40], LoArmL: [-88, 26, 0], UpArmR: [-42, -32, -42], LoArmR: [-92, -24, 0],
        UpArmL2: [-72, 40, 24], LoArmL2: [-134, 50, 0],
        UpArmR2: [-68, -38, -26], LoArmR2: [-138, -48, 0],
        Spine: [12, -6, 0], Chest: [6, -8, 0], Neck: [-6, -4, 0], Head: [-4, -6, 0],
        Hips_pos: [0, -0.020, 0]
      }, 'in'),
      K(0.22, {
        UpArmL: [-24, -22, 62], LoArmL: [-8, 0, 0], HandL: [-6, 30, 0],
        UpArmR: [-20, 20, -64], LoArmR: [-10, 0, 0], HandR: [-6, -30, 0],
        UpArmL2: [-14, -14, 70], LoArmL2: [-10, 0, 0],
        UpArmR2: [-10, 12, -72], LoArmR2: [-12, 0, 0],
        Spine: [34, -6, 0], Chest: [22, -8, 0], Neck: [-24, -4, 0], Head: [-20, -6, 0],
        Hips_pos: [0, -0.145, 0],
        ThighL: [-42, -6, 0], ShinL: [56, 0, 0], ThighR: [-34, 8, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(0.34, {
        UpArmL: [-22, -24, 64], UpArmR: [-18, 22, -66],
        UpArmL2: [-12, -16, 72], UpArmR2: [-8, 14, -74],
        Spine: [33, -6, 0], Hips_pos: [0, -0.140, 0]
      }, 'hold'),
      K(0.60, {}, 'out')
    ]
  },

  // HEAVY — the whole body driven forward behind the pronotum shield.
  heavy: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        Spine: [2, -6, 0], Chest: [-4, -8, 0], Neck: [4, -4, 0], Head: [8, -6, 0], Hips: [-4, 22, 0],
        UpArmL: [-88, 20, 32], LoArmL: [-120, 24, 0], UpArmR: [-82, -18, -34], LoArmR: [-126, -22, 0],
        UpArmL2: [-78, 32, 20], UpArmR2: [-74, -30, -22],
        Hips_pos: [0, -0.14, 0], ThighL: [-34, -6, 0], ShinL: [50, 0, 0]
      }, 'in'),
      K(0.38, {
        Spine: [48, -6, 0], Chest: [28, -8, 0], Neck: [-36, -4, 0], Head: [-30, -6, 0], Hips: [14, 22, 0],
        UpArmL: [-30, 4, 18], LoArmL: [-14, 0, 0], UpArmR: [-26, -3, -19], LoArmR: [-16, 0, 0],
        UpArmL2: [-24, 16, 26], LoArmL2: [-20, 12, 0],
        UpArmR2: [-20, -14, -28], LoArmR2: [-22, -10, 0],
        Hips_pos: [0, -0.185, 0],
        ThighL: [-52, -6, 0], ShinL: [42, 0, 0], ThighR: [10, 8, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.52, { Spine: [47, -6, 0], Hips_pos: [0, -0.180, 0], UpArmL: [-28, 4, 18], UpArmR: [-24, -3, -19] }, 'hold'),
      K(0.92, {}, 'out')
    ]
  },

  // ---- REACTIONS ----------------------------------------------------------
  hitLight: {
    dur: 0.26, loop: false, keys: [
      K(0, {}),
      K(0.04, {
        Head: [-24, -18, 6], Neck: [-24, -8, 0], Chest: [10, -14, 0], Spine: [19, -8, 0],
        UpArmL2: [-52, 32, 18], UpArmR2: [-48, -30, -20], Hips_pos: [0, -0.078, 0]
      }, 'snap'),
      K(0.10, { Head: [-21, -16, 5], Chest: [12, -13, 0] }, 'hold'),
      K(0.26, {})
    ]
  },
  hitHeavy: {
    dur: 0.5, loop: false, keys: [
      K(0, {}),
      K(0.05, {
        Head: [-34, -12, 10], Neck: [-30, -6, 0], Chest: [-2, -14, 0], Spine: [10, -8, 0],
        Hips: [-4, 26, 0],
        UpArmL: [-88, 10, 46], LoArmL: [-26, 12, 0], UpArmR: [-72, -8, -50], LoArmR: [-20, -10, 0],
        UpArmL2: [-40, 34, 40], UpArmR2: [-36, -32, -42],
        Hips_pos: [0, -0.020, 0], ThighL: [-32, -6, 0], ShinL: [24, 0, 0]
      }, 'snap'),
      K(0.18, { Head: [-30, -12, 9], Chest: [1, -14, 0], UpArmL: [-80, 10, 42], UpArmR: [-66, -8, -46] }, 'hold'),
      K(0.5, {})
    ]
  },
  launched: {
    dur: 0.8, loop: true, keys: [
      K(0, {
        Spine: [-24, -5, 0], Chest: [-14, -7, 0], Neck: [-4, -4, 0], Head: [-14, -6, 0], Hips: [-18, 16, 0],
        ThighL: [-62, -6, 0], ShinL: [48, 0, 0], ThighR: [-28, 8, 0], ShinR: [62, 0, 0],
        UpArmL: [-104, 10, 40], LoArmL: [-28, 12, 0], UpArmR: [-86, -8, -46], LoArmR: [-34, -10, 0],
        UpArmL2: [-72, 34, 44], UpArmR2: [-66, -32, -48]
      }),
      K(0.4, {
        Spine: [-32, -5, 0], Hips: [-24, 16, 0], ThighL: [-50, -6, 0], ThighR: [-38, 8, 0],
        UpArmL: [-96, 10, 46], UpArmR: [-96, -8, -40],
        UpArmL2: [-64, 34, 50], UpArmR2: [-74, -32, -42]
      }),
      K(0.8, {
        Spine: [-24, -5, 0], Hips: [-18, 16, 0], ThighL: [-62, -6, 0], ThighR: [-28, 8, 0],
        UpArmL: [-104, 10, 40], UpArmR: [-86, -8, -46],
        UpArmL2: [-72, 34, 44], UpArmR2: [-66, -32, -48]
      })
    ]
  },
  // knockdown: he goes over onto his SIDE, legs still working — an insect that
  // has been flipped, which is a much worse look for him than lying on his back
  knockdown: {
    dur: 0.5, loop: false, keys: [
      K(0, { Spine: [-16, -5, 0], Hips: [-16, 12, 0], Hips_pos: [0, -0.10, 0] }),
      K(0.20, {
        Hips: [-58, 22, -18], Hips_pos: [0, -0.56, -0.10], Spine: [-8, -6, 10], Chest: [-4, -4, 8],
        Head: [-16, 14, -10],
        ThighL: [-12, -14, 0], ShinL: [18, 0, 0], ThighR: [-6, 16, 0], ShinR: [26, 0, 0],
        UpArmL: [-40, 0, 58], LoArmL: [-24, 8, 0], UpArmR: [-28, 0, -62], LoArmR: [-18, -8, 0],
        UpArmL2: [-56, 20, 62], UpArmR2: [-50, -18, -66]
      }, 'snap'),
      K(0.5, {
        Hips: [-78, 26, -24], Hips_pos: [0, -0.70, -0.14], Spine: [-4, -8, 14], Chest: [-2, -6, 10],
        Head: [-10, 18, -14],
        ThighL: [-14, -18, 0], ShinL: [10, 0, 0], ThighR: [-8, 20, 0], ShinR: [16, 0, 0],
        UpArmL: [-34, 0, 66], UpArmR: [-24, 0, -70],
        UpArmL2: [-48, 22, 70], UpArmR2: [-44, -20, -74]
      }, 'out')
    ]
  },
  // getup: he rights himself with a fast, ugly scramble — all four arms at once
  getup: {
    dur: 0.5, loop: false, keys: [
      K(0, {
        Hips: [-78, 26, -24], Hips_pos: [0, -0.70, -0.14], Spine: [-4, -8, 14],
        ThighL: [-14, -18, 0], ShinL: [10, 0, 0], ThighR: [-8, 20, 0], ShinR: [16, 0, 0],
        UpArmL: [-34, 0, 66], UpArmR: [-24, 0, -70],
        UpArmL2: [-48, 22, 70], UpArmR2: [-44, -20, -74]
      }),
      K(0.16, {
        Hips: [-40, 20, -8], Hips_pos: [0, -0.44, -0.02], Spine: [38, -6, 6],
        ThighL: [-32, -8, 0], ShinL: [88, 0, 0], ThighR: [22, 10, 0], ShinR: [92, 0, 0],
        UpArmL: [6, 10, 40], LoArmL: [-48, 16, 0], UpArmR: [10, -8, -42], LoArmR: [-44, -14, 0],
        UpArmL2: [-4, 30, 44], UpArmR2: [0, -28, -46]
      }, 'snap'),
      K(0.32, {
        Hips: [-8, 20, 0], Hips_pos: [0, -0.14, 0], Spine: [28, -6, 0],
        ThighL: [-42, -6, 0], ShinL: [58, 0, 0], ThighR: [-30, 8, 0], ShinR: [50, 0, 0]
      }, 'out'),
      K(0.5, {}, 'out')
    ]
  },
  techRise: {
    dur: 0.26, loop: false, keys: [
      K(0, {
        Hips: [-72, 24, -20], Hips_pos: [0, -0.64, -0.12], Spine: [-6, -8, 12],
        ThighL: [64, -16, 0], ShinL: [28, 0, 0], ThighR: [74, 18, 0], ShinR: [36, 0, 0],
        UpArmL: [-34, 0, 62], UpArmR: [-24, 0, -66]
      }),
      K(0.08, {
        Hips: [-30, 18, 0], Hips_pos: [0, -0.38, 0.04], Spine: [40, -6, 0], Head: [-30, -6, 0],
        ThighL: [-86, -6, 0], ShinL: [100, 0, 0], ThighR: [-66, 8, 0], ShinR: [96, 0, 0],
        UpArmL: [20, 10, 46], UpArmR: [24, -8, -48],
        UpArmL2: [8, 30, 48], UpArmR2: [12, -28, -50]
      }, 'snap'),
      K(0.16, {
        Hips: [4, 22, 0], Hips_pos: [0, -0.085, 0], Spine: [26, -6, 0], Chest: [16, -8, 0],
        ThighL: [-34, -6, 0], ShinL: [48, 0, 0], ThighR: [-24, 8, 0], ShinR: [42, 0, 0],
        UpArmL: [-40, 10, 20], UpArmR: [-36, -8, -22]
      }, 'out'),
      K(0.26, {}, 'out')
    ]
  },

  // ---- SWARM (CT1) --------------------------------------------------------
  // The thorax splits and they pour out. He rears up off the forward pitch —
  // the ONE time he stands nearly upright — spreads all four arms wide, and
  // holds absolutely still while the wave leaves him.
  ct1: {
    dur: 0.78, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        Spine: [-4, -6, 0], Chest: [-8, -8, 0], Neck: [10, -4, 0], Head: [16, -6, 0],
        UpArmL: [-56, 20, 54], LoArmL: [-56, 22, 0], UpArmR: [-50, -18, -56], LoArmR: [-60, -20, 0],
        UpArmL2: [-30, 34, 58], LoArmL2: [-52, 44, 0],
        UpArmR2: [-26, -32, -60], LoArmR2: [-56, -42, 0],
        Hips_pos: [0, 0.010, 0], ThighL: [-8, -6, 0], ShinL: [16, 0, 0], ThighR: [-4, 8, 0], ShinR: [14, 0, 0]
      }, 'snap'),
      // dead still while the swarm leaves
      K(0.46, {
        Spine: [-4, -6, 0], Chest: [-8, -8, 0], Neck: [10, -4, 0], Head: [16, -6, 0],
        UpArmL: [-58, 20, 56], UpArmR: [-52, -18, -58],
        UpArmL2: [-32, 34, 60], UpArmR2: [-28, -32, -62], Hips_pos: [0, 0.012, 0]
      }, 'hold'),
      K(0.78, {}, 'out')
    ]
  },

  // ---- CORROSIVE SPRAY (CT2) ---------------------------------------------
  // The maw comes forward and he VOMITS. The head thrusts out on the neck, the
  // upper arms clamp back out of the way, and the lower pair braces the thorax
  // — a heaving, unpleasant motion with no dignity in it anywhere.
  ct2: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Spine: [10, -6, 0], Chest: [2, -8, 0], Neck: [10, -4, 0], Head: [18, -6, 0],
        UpArmL: [-70, 24, 40], LoArmL: [-104, 28, 0], UpArmR: [-64, -22, -42], LoArmR: [-110, -26, 0],
        UpArmL2: [-80, 36, 16], LoArmL2: [-134, 50, 0],
        UpArmR2: [-76, -34, -18], LoArmR2: [-138, -48, 0],
        Hips_pos: [0, -0.020, 0]
      }, 'in'),
      // the heave
      K(0.30, {
        Spine: [40, -6, 0], Chest: [26, -8, 0], Neck: [-40, -4, 0], Head: [-36, -6, 0],
        UpArmL: [-30, 10, 68], LoArmL: [-20, 8, 0], UpArmR: [-26, -8, -70], LoArmR: [-22, -6, 0],
        UpArmL2: [-40, 26, 52], LoArmL2: [-56, 34, 0],
        UpArmR2: [-36, -24, -54], LoArmR2: [-60, -32, 0],
        Hips_pos: [0, -0.135, 0],
        ThighL: [-40, -6, 0], ShinL: [54, 0, 0], ThighR: [-32, 8, 0], ShinR: [48, 0, 0]
      }, 'snap'),
      // held: the cone lasts
      K(0.56, {
        Spine: [42, -6, 0], Neck: [-42, -4, 0], Head: [-38, -6, 0], Hips_pos: [0, -0.140, 0],
        UpArmL: [-28, 10, 70], UpArmR: [-24, -8, -72]
      }, 'hold'),
      K(0.86, {}, 'out')
    ]
  },

  // ---- DEVOUR (SPECIAL) — the committed grab ------------------------------
  // Three beats, and it is slow enough at the front to be jumped or dashed:
  //   1. the LUNGE. All four arms open wide, maw already opening.
  //   2. the CLOSE. Everything clamps in at once and the head drives down.
  //   3. the BITE, held — the one moment in the whole game where he is
  //      completely still, and the cinematic camera sits on it.
  devour: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        Spine: [16, -6, 0], Chest: [6, -8, 0], Neck: [4, -4, 0], Head: [6, -6, 0],
        UpArmL: [-52, 26, 68], LoArmL: [-56, 26, 0], HandL: [-30, 70, 0],
        UpArmR: [-46, -24, -70], LoArmR: [-60, -24, 0], HandR: [-30, -70, 0],
        UpArmL2: [-28, 38, 66], LoArmL2: [-58, 46, 0],
        UpArmR2: [-24, -36, -68], LoArmR2: [-62, -44, 0],
        Hips_pos: [0, -0.110, 0], ThighL: [-38, -6, 0], ShinL: [52, 0, 0]
      }, 'in'),
      // the close — everything at once
      K(0.34, {
        Spine: [40, -6, 0], Chest: [26, -8, 0], Neck: [-26, -4, 0], Head: [-18, -6, 0],
        UpArmL: [-88, -18, 12], LoArmL: [-108, -14, 0], HandL: [-40, 40, 0],
        UpArmR: [-84, 16, -14], LoArmR: [-112, 12, 0], HandR: [-40, -40, 0],
        UpArmL2: [-70, -12, 14], LoArmL2: [-116, -10, 0],
        UpArmR2: [-66, 10, -16], LoArmR2: [-120, 8, 0],
        Hips_pos: [0, -0.165, 0],
        ThighL: [-46, -6, 0], ShinL: [60, 0, 0], ThighR: [-38, 8, 0], ShinR: [54, 0, 0]
      }, 'snap'),
      // THE BITE — held, absolutely motionless
      K(0.46, {
        Spine: [46, -6, 0], Chest: [30, -8, 0], Neck: [-16, -4, 0], Head: [10, -6, 0],
        UpArmL: [-92, -20, 10], LoArmL: [-112, -16, 0],
        UpArmR: [-88, 18, -12], LoArmR: [-116, 14, 0],
        UpArmL2: [-74, -14, 12], UpArmR2: [-70, 12, -14],
        Hips_pos: [0, -0.185, 0]
      }, 'snap'),
      K(0.92, {
        Spine: [46, -6, 0], Neck: [-16, -4, 0], Head: [10, -6, 0], Hips_pos: [0, -0.185, 0],
        UpArmL: [-92, -20, 10], UpArmR: [-88, 18, -12]
      }, 'hold'),
      // and he straightens up, satisfied
      K(1.10, {
        Spine: [14, -6, 0], Chest: [8, -8, 0], Neck: [-4, -4, 0], Head: [-6, -6, 0],
        Hips_pos: [0, -0.030, 0],
        UpArmL: [-46, 16, 22], UpArmR: [-42, -14, -24]
      }, 'out'),
      K(1.30, {}, 'out')
    ]
  },

  // SELF-DEVOUR: he crouches, cups the lower pair, and eats his own swarm out
  // of his hands. Short, quiet, and profoundly undignified — which is the
  // point: it is what he does when he cannot reach you.
  selfDevour: {
    dur: 0.90, loop: false, keys: [
      K(0, {}),
      K(0.14, {
        Spine: [34, -6, 0], Chest: [20, -8, 0], Neck: [-20, -4, 0], Head: [-14, -6, 0],
        UpArmL2: [-96, 30, 6], LoArmL2: [-108, 34, 0], HandL2: [-60, 60, 0],
        UpArmR2: [-92, -28, -8], LoArmR2: [-112, -32, 0], HandR2: [-60, -60, 0],
        UpArmL: [-46, 18, 26], UpArmR: [-42, -16, -28],
        Hips_pos: [0, -0.180, 0],
        ThighL: [-46, -6, 0], ShinL: [64, 0, 0], ThighR: [-38, 8, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.38, {
        Neck: [6, -4, 0], Head: [22, -6, 0], Spine: [30, -6, 0],
        UpArmL2: [-104, 26, 4], LoArmL2: [-116, 30, 0],
        UpArmR2: [-100, -24, -6], LoArmR2: [-120, -28, 0], Hips_pos: [0, -0.195, 0]
      }, 'snap'),
      K(0.62, { Neck: [4, -4, 0], Head: [20, -6, 0], Hips_pos: [0, -0.192, 0] }, 'hold'),
      K(0.90, {}, 'out')
    ]
  },

  // GROWTH: the transition between stages. The plates crack apart, everything
  // swells, and he holds the new size for a beat before he moves again. Played
  // over the model's own scale ramp (see setGrowth), so this is the BODY's
  // reaction to growing rather than the growth itself.
  growth: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        Spine: [6, -6, 0], Chest: [-2, -8, 0], Neck: [8, -4, 0], Head: [14, -6, 0],
        UpArmL: [-70, 26, 58], LoArmL: [-58, 26, 0], UpArmR: [-64, -24, -60], LoArmR: [-62, -24, 0],
        UpArmL2: [-44, 38, 62], LoArmL2: [-54, 46, 0],
        UpArmR2: [-40, -36, -64], LoArmR2: [-58, -44, 0],
        Hips_pos: [0, 0.020, 0], Hips: [-6, 22, 0],
        ThighL: [-6, -6, 0], ShinL: [14, 0, 0], ThighR: [-2, 8, 0], ShinR: [12, 0, 0]
      }, 'snap'),
      // the swell — held wide open while the model scales
      K(0.62, {
        Spine: [4, -6, 0], Neck: [10, -4, 0], Head: [18, -6, 0],
        UpArmL: [-76, 28, 64], UpArmR: [-70, -26, -66],
        UpArmL2: [-50, 40, 68], UpArmR2: [-46, -38, -70],
        Hips_pos: [0, 0.032, 0]
      }, 'hold'),
      K(0.80, {
        Spine: [28, -6, 0], Chest: [18, -8, 0], Neck: [-22, -4, 0], Head: [-18, -6, 0],
        Hips_pos: [0, -0.090, 0], UpArmL: [-40, 12, 20], UpArmR: [-36, -10, -22]
      }, 'snap'),
      K(1.10, {}, 'out')
    ]
  },

  // ---- INFESTATION (ULTIMATE) --------------------------------------------
  // No barrier, no chant, no hand sign — he simply OPENS. Wings out, all four
  // arms flung wide, head thrown back, and the map fills. The startup is the
  // fast non-domain tier and the animation gets there in two keys.
  ult: {
    dur: 1.45, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Spine: [26, -6, 0], Chest: [16, -8, 0], Neck: [-18, -4, 0], Head: [-14, -6, 0],
        UpArmL: [-90, 22, 20], LoArmL: [-120, 26, 0], UpArmR: [-84, -20, -22], LoArmR: [-126, -24, 0],
        UpArmL2: [-84, 36, 14], LoArmL2: [-136, 50, 0],
        UpArmR2: [-80, -34, -16], LoArmR2: [-140, -48, 0],
        Hips_pos: [0, -0.150, 0],
        ThighL: [-42, -6, 0], ShinL: [58, 0, 0], ThighR: [-34, 8, 0], ShinR: [52, 0, 0]
      }, 'in'),
      // the opening
      K(0.34, {
        Spine: [-12, -6, 0], Chest: [-14, -8, 0], Neck: [18, -4, 0], Head: [30, -6, 0],
        UpArmL: [-40, 18, 84], LoArmL: [-16, 10, 0], HandL: [-20, 50, 0],
        UpArmR: [-34, -16, -86], LoArmR: [-18, -8, 0], HandR: [-20, -50, 0],
        UpArmL2: [-6, 32, 82], LoArmL2: [-20, 34, 0],
        UpArmR2: [0, -30, -84], LoArmR2: [-22, -32, 0],
        Hips: [-10, 22, 0], Hips_pos: [0, 0.045, 0],
        ThighL: [-4, -6, 0], ShinL: [10, 0, 0], ThighR: [0, 8, 0], ShinR: [8, 0, 0]
      }, 'snap'),
      K(1.00, {
        Spine: [-14, -6, 0], Neck: [20, -4, 0], Head: [32, -6, 0],
        UpArmL: [-42, 18, 88], UpArmR: [-36, -16, -90],
        UpArmL2: [-8, 32, 86], UpArmR2: [2, -30, -88], Hips_pos: [0, 0.052, 0]
      }, 'hold'),
      K(1.45, {}, 'out')
    ]
  },

  // ---- KO / VICTORY -------------------------------------------------------
  // ko: he flips onto his back, legs still cycling, and then they stop. It is
  // the only genuinely undignified death animation in the game and it is the
  // right one for him.
  ko: {
    dur: 1.5, loop: false, keys: [
      K(0, { Spine: [-16, -5, 0], Head: [-12, -6, 0] }),
      K(0.26, {
        Hips: [-64, 10, 0], Hips_pos: [0, -0.58, -0.10], Spine: [-8, -2, 0], Head: [-6, 8, 0],
        ThighL: [-88, -10, 0], ShinL: [70, 0, 0], ThighR: [-96, 12, 0], ShinR: [78, 0, 0],
        UpArmL: [-30, 0, 74], LoArmL: [-56, 10, 0], UpArmR: [-24, 0, -78], LoArmR: [-52, -10, 0],
        UpArmL2: [-20, 20, 78], LoArmL2: [-60, 24, 0],
        UpArmR2: [-16, -18, -82], LoArmR2: [-56, -22, 0]
      }, 'snap'),
      // the legs keep going
      K(0.62, {
        Hips: [-72, 8, 0], Hips_pos: [0, -0.66, -0.14],
        ThighL: [-104, -10, 0], ShinL: [56, 0, 0], ThighR: [-80, 12, 0], ShinR: [90, 0, 0],
        UpArmL: [-24, 0, 80], UpArmR: [-30, 0, -72],
        UpArmL2: [-12, 22, 84], UpArmR2: [-22, -20, -76]
      }, 'snap'),
      K(0.96, {
        ThighL: [-84, -10, 0], ShinL: [86, 0, 0], ThighR: [-100, 12, 0], ShinR: [60, 0, 0],
        UpArmL: [-32, 0, 70], UpArmR: [-20, 0, -84],
        UpArmL2: [-24, 18, 74], UpArmR2: [-10, -22, -88]
      }, 'snap'),
      // and stop
      K(1.5, {
        Hips: [-80, 6, 0], Hips_pos: [0, -0.72, -0.16], Spine: [-4, 0, 0], Chest: [-2, 0, 0],
        Head: [-2, 12, 0],
        ThighL: [-96, -12, 4], ShinL: [72, 0, 0], ThighR: [-92, 14, -4], ShinR: [76, 0, 0],
        UpArmL: [-26, 0, 76], LoArmL: [-48, 10, 0], UpArmR: [-22, 0, -80], LoArmR: [-44, -10, 0],
        UpArmL2: [-16, 20, 80], UpArmR2: [-14, -18, -84],
        HandL: [0, 0, 0], HandR: [0, 0, 0], HandL2: [0, 0, 0], HandR2: [0, 0, 0]
      }, 'out')
    ]
  },

  // victory: he does not celebrate. He looks around for the next thing to eat.
  // ---- TAUNT — NO BUBBLE. INSECT BUSINESS. --------------------------------
  // Not a gesture at you at all — a grooming routine, performed in front of you,
  // which is far more insulting than anything he could say. The mandibles
  // clatter (a fast head shudder), a lower foreleg comes up and draws down an
  // antenna, and the upper pair scrapes once against itself. Then he stops and
  // looks at you as though he had been interrupted.
  //
  // The four arms carry the whole thing: the LOWER pair does the grooming — it
  // is the pair that folds tight to the body — and the upper pair does the
  // scrape, which keeps the two pairs doing recognisably different jobs the way
  // the rest of his set does.
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // THE CLATTER. Four frames of head shudder, driven off the neck.
      K(0.14, {
        Neck: [-15, -8, 0], Head: [-12, -12, 4], Chest: [10, -8, 0],
        Hips_pos: [0, -0.048, 0]
      }, 'snap'),
      K(0.26, {
        Neck: [-4, 2, 0], Head: [-4, 2, -4], Chest: [8, -8, 0],
        Hips_pos: [0, -0.06, 0]
      }, 'snap'),
      K(0.38, {
        Neck: [-12, -6, 0], Head: [-10, -10, 3], Chest: [9, -8, 0],
        Hips_pos: [0, -0.05, 0]
      }, 'snap'),
      // THE GROOM. A lower foreleg comes up past the head and draws down.
      K(0.85, {
        UpArmL2: [-118, 34, 22], LoArmL2: [-84, 50, 0], HandL2: [-40, 84, 0],
        UpArmR2: [-56, -24, -12], LoArmR2: [-128, -40, 0],
        Neck: [-6, -10, 6], Head: [-4, -14, 10], Chest: [11, -10, 0],
        Hips_pos: [0, -0.052, 0]
      }, 'out'),
      K(1.30, {
        UpArmL2: [-64, 40, 16], LoArmL2: [-116, 56, 0], HandL2: [-30, 76, 0],
        UpArmR2: [-57, -24, -12], LoArmR2: [-128, -40, 0],
        Neck: [-10, -6, 3], Head: [-8, -10, 5], Chest: [10, -8, 0],
        Hips_pos: [0, -0.056, 0]
      }, 'out'),
      // THE SCRAPE. The upper pair meets and drags across, once.
      K(1.72, {
        UpArmL: [-58, 30, 4], LoArmL: [-118, 48, 0], HandL: [-24, 74, 0],
        UpArmR: [-54, -28, -6], LoArmR: [-122, -46, 0], HandR: [-24, -74, 0],
        UpArmL2: [-62, 26, 10], LoArmL2: [-126, 42, 0],
        UpArmR2: [-58, -24, -12], LoArmR2: [-130, -40, 0],
        Chest: [12, -6, 0], Spine: [15, -5, 0], Neck: [-8, -4, 0], Head: [-6, -6, 0],
        Hips_pos: [0, -0.062, 0]
      }, 'snap'),
      K(2.05, {
        UpArmL: [-44, 22, 20], LoArmL: [-104, 34, 0],
        UpArmR: [-40, -20, -22], LoArmR: [-108, -32, 0],
        Chest: [10, -7, 0], Head: [-7, -6, 0], Hips_pos: [0, -0.058, 0]
      }, 'out'),
      // and he stops, and looks up at you, as if you had said something
      K(2.55, {
        Neck: [-16, -4, 0], Head: [-15, -6, 0], Chest: [7, -8, 0], Spine: [11, -6, 0],
        UpArmL: [-32, 10, 15], LoArmL: [-96, 22, 0],
        UpArmR: [-28, -8, -16], LoArmR: [-100, -20, 0],
        Hips_pos: [0, -0.05, 0]
      }, 'out'),
      K(2.95, {
        Neck: [-15, -4, 0], Head: [-14, -6, 0], Chest: [8, -8, 0],
        Hips_pos: [0, -0.052, 0]
      }, 'hold'),
      K(3.3, {}, 'out')
    ]
  },
  victory: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      K(0.5, {
        Spine: [12, -6, 0], Chest: [6, -8, 0], Neck: [-4, -4, 0], Head: [-2, -6, 0],
        Hips_pos: [0, -0.020, 0], UpArmL: [-44, 14, 22], UpArmR: [-40, -12, -24],
        UpArmL2: [-58, 28, 14], UpArmR2: [-54, -26, -16]
      }, 'out'),
      K(0.72, { Head: [-6, -34, 8], Neck: [-10, -14, 0], Hips: [7, 6, 0] }, 'snap'),
      K(1.30, { Head: [-6, -34, 8], Hips: [7, 6, 0] }, 'hold'),
      K(1.52, { Head: [-4, 32, -8], Neck: [-8, 14, 0], Hips: [7, 40, 0] }, 'snap'),
      K(2.30, { Head: [-4, 32, -8], Hips: [7, 40, 0] }, 'hold'),
      K(2.60, { Head: [-14, 0, 0], Neck: [-16, -4, 0], Hips: [7, 22, 0], Chest: [14, -8, 0] }, 'snap'),
      K(3.4, {}, 'hold')
    ]
  }
};
