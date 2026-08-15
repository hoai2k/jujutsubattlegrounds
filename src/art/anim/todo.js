// Todo-specific clips. Movement language: heavy, grounded, deliberate — long
// anticipation, enormous follow-through, the floor registers every step. The
// one exception is the Boogie Woogie clap, which is instantaneous on purpose:
// the snap contrasts with everything else he does.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — the heavyweight. Feet planted wide, chest open, arms held out from
// the lats because they physically cannot hang closer. Chin down, patient.
export const TODO_STANCE = {
  Hips_pos: [0, -0.05, 0],
  Hips: [0, 18, 0], Spine: [5, -6, 0], Chest: [4, -8, 0], Neck: [0, -3, 0], Head: [2, -7, 0],
  UpArmL: [-16, 10, 22], LoArmL: [-58, 18, 2], HandL: [-16, 50, 0],
  UpArmR: [-12, -8, -24], LoArmR: [-64, -16, 0], HandR: [-18, -50, 0],
  ThighL: [-16, -8, 0], ShinL: [16, 0, 0], FootL: [2, -14, 0],
  ThighR: [13, 9, 0], ShinR: [20, 0, 0], FootR: [8, 11, 0]
};

export const TODO_CLIPS = {
  // idle: slow, massive breathing — shoulders rise as one block. He shifts
  // his weight once per cycle like a truck settling on its suspension.
  idle: {
    dur: 3.2, loop: true, keys: [
      K(0, {}),
      K(1.0, { Chest: [6, -8, 0], Spine: [7, -6, 0], Hips_pos: [0, -0.066, 0], UpArmL: [-19, 10, 24], UpArmR: [-15, -8, -26], Head: [3, -5, 0] }),
      K(2.1, { Chest: [3, -9, 0], Hips_pos: [0, -0.042, 0], Hips: [0, 22, 0], Head: [1, -10, 0] }),
      K(3.2, {})
    ]
  },
  // CLAP COMBO: both arms hauled back behind the hips, a rushing double-palm
  // drive, ending with the hands smashed together in the clap
  ct1: {
    dur: 0.88, loop: false, keys: [
      K(0, {}),
      K(0.24, { UpArmL: [26, 14, 30], LoArmL: [-30, 10, 4], UpArmR: [30, -12, -32], LoArmR: [-26, -8, -4], Chest: [10, -6, 0], Spine: [8, -4, 0], Head: [6, -6, 0], Hips_pos: [0, -0.12, 0], ThighL: [-30, -8, 0], ShinL: [34, 0, 0], ThighR: [24, 9, 0], ShinR: [40, 0, 0] }, 'in'),
      K(0.40, { UpArmL: [-78, -18, 10], LoArmL: [-20, 30, 0], HandL: [-20, 60, 0], UpArmR: [-78, 18, -10], LoArmR: [-20, -30, 0], HandR: [-20, -60, 0], Chest: [12, 0, 0], Spine: [10, 0, 0], Head: [4, -4, 0], Hips_pos: [0, -0.075, 0], ThighL: [-36, -8, 0], ShinL: [30, 0, 0], ThighR: [30, 9, 0], ShinR: [50, 0, 0] }, 'snap'),
      K(0.52, { UpArmL: [-80, -22, 10], LoArmL: [-18, 34, 0], UpArmR: [-80, 22, -10], LoArmR: [-18, -34, 0], Chest: [12, 0, 0], Hips_pos: [0, -0.08, 0] }, 'hold'),
      K(0.88, {}, 'out')
    ]
  },
  // VICE GRAB: a lunging one-armed snatch, hoist, then the whole upper body
  // brought down for the slam — the deepest hip drop in his set
  ct2: {
    dur: 1.0, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-24, -16, -30], LoArmR: [-70, -10, -4], HandR: [-40, -40, 0], Chest: [8, -30, 0], Spine: [7, -16, 0], Hips: [2, 38, 0], Head: [4, -12, 0], Hips_pos: [0, -0.10, 0], ThighL: [-28, -8, 0], ShinL: [32, 0, 0], ThighR: [22, 9, 0], ShinR: [38, 0, 0] }, 'in'),
      K(0.38, { UpArmR: [-128, 6, -8], LoArmR: [-46, 0, 0], HandR: [-30, 0, 0], UpArmL: [-58, 14, 22], LoArmL: [-64, 0, 4], Chest: [-12, 8, 0], Spine: [-8, 4, 0], Head: [-10, -4, 0], Hips_pos: [0, 0.015, 0] }, 'snap'),
      K(0.56, { UpArmR: [-52, -6, -10], LoArmR: [-16, 0, 0], HandR: [-40, 0, 0], UpArmL: [-30, 12, 18], Chest: [22, 4, 0], Spine: [16, 2, 0], Head: [10, -8, 0], Hips: [4, 24, 0], Hips_pos: [0, -0.20, 0], ThighL: [-44, -8, 0], ShinL: [52, 0, 0], ThighR: [36, 9, 0], ShinR: [58, 0, 0] }, 'snap'),
      K(0.68, { UpArmR: [-50, -6, -10], Chest: [22, 4, 0], Hips_pos: [0, -0.20, 0] }, 'hold'),
      K(1.0, {}, 'out')
    ]
  },
  // BOOGIE WOOGIE: the clap. Fast for a man this size — hands snap together
  // in front of the chest and that's the whole tell.
  boogie: {
    dur: 0.32, loop: false, keys: [
      K(0, {}),
      K(0.07, { UpArmL: [-64, -26, 12], LoArmL: [-30, 34, 0], HandL: [-16, 60, 0], UpArmR: [-64, 26, -12], LoArmR: [-30, -34, 0], HandR: [-16, -60, 0], Chest: [2, -6, 0], Head: [0, -6, 0], Hips_pos: [0, -0.06, 0] }, 'snap'),
      K(0.16, { UpArmL: [-66, -30, 12], LoArmL: [-28, 38, 0], UpArmR: [-66, 30, -12], LoArmR: [-28, -38, 0] }, 'hold'),
      K(0.32, {}, 'out')
    ]
  },
  // MOUNTAIN SPLITTER (heavy): both fists locked together overhead, brought
  // down like felling a tree, deep knee absorb on the stop
  heavy: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.28, { UpArmL: [-152, -10, 12], LoArmL: [-44, 0, 4], HandL: [-20, 0, 0], UpArmR: [-154, 10, -12], LoArmR: [-44, 0, -4], HandR: [-20, 0, 0], Chest: [-16, -4, 0], Spine: [-10, -2, 0], Head: [-12, 0, 0], Hips: [0, 20, 0], Hips_pos: [0, -0.03, 0] }, 'in'),
      K(0.42, { UpArmL: [-56, -8, 14], LoArmL: [-16, 0, 4], UpArmR: [-58, 8, -16], LoArmR: [-16, 0, -4], Chest: [16, 2, 0], Spine: [12, 0, 0], Head: [8, -6, 0], Hips: [2, 22, 0], Hips_pos: [0, -0.19, 0], ThighL: [-42, -8, 0], ShinL: [50, 0, 0], ThighR: [34, 9, 0], ShinR: [56, 0, 0] }, 'snap'),
      K(0.54, { UpArmL: [-54, -8, 14], UpArmR: [-56, 8, -16], Chest: [16, 2, 0], Hips_pos: [0, -0.19, 0] }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },
  // BROTHERHOOD: the opening clap held overhead, then a planted power stance
  // while the swap-barrage entity does the traveling (the clip stretches over
  // the whole active window)
  ult: {
    dur: 1.3, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmL: [-150, -18, 12], LoArmL: [-40, 30, 0], HandL: [-16, 40, 0], UpArmR: [-152, 18, -12], LoArmR: [-40, -30, 0], HandR: [-16, -40, 0], Chest: [-10, -4, 0], Head: [-14, 0, 0], Hips_pos: [0, -0.04, 0] }, 'in'),
      K(0.34, { UpArmL: [-70, -28, 12], LoArmL: [-26, 36, 0], UpArmR: [-70, 28, -12], LoArmR: [-26, -36, 0], Chest: [4, -4, 0], Head: [-2, -4, 0], Hips_pos: [0, -0.09, 0] }, 'snap'),
      K(0.7, { UpArmL: [-30, 10, 26], LoArmL: [-70, 14, 2], UpArmR: [-26, -8, -28], LoArmR: [-74, -12, 0], Chest: [8, -14, 0], Spine: [7, -8, 0], Hips: [0, 26, 0], Head: [3, -10, 0], Hips_pos: [0, -0.09, 0], ThighL: [-24, -8, 0], ShinL: [26, 0, 0], ThighR: [20, 9, 0], ShinR: [30, 0, 0] }, 'hold'),
      K(1.3, {}, 'out')
    ]
  },
  // victory: arms crossed over the chest, one slow approving nod
  // ---- TAUNT — "WHAT'S YOUR TYPE?!" ---------------------------------------
  // THE BIGGEST ANIMATION IN THE FEATURE, and it should be. Todo does not have
  // a small setting. A deep wind-up with both arms swung all the way back and
  // the knees loaded, ONE enormous clap, and then both hands thrown out at the
  // opponent with a knee driving off the floor and the chest wide open.
  //
  // The travel is the joke: he covers more angular distance in this taunt than
  // most characters do in their ultimate, for no gameplay reason whatsoever.
  taunt: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      // WIND UP — both arms all the way back and out, weight down into both
      // legs, chest thrown open, head back
      K(0.42, {
        UpArmL: [58, 18, 46], LoArmL: [-24, 12, 6], HandL: [-12, 40, 0],
        UpArmR: [62, -16, -48], LoArmR: [-20, -10, -6], HandR: [-12, -40, 0],
        Chest: [-16, -8, 0], Spine: [-12, -6, 0], Neck: [-8, -3, 0], Head: [-20, -7, 0],
        Hips: [0, 14, 0], Hips_pos: [0, -0.14, -0.03],
        ThighL: [-30, -8, 0], ShinL: [34, 0, 0], ThighR: [24, 9, 0], ShinR: [38, 0, 0]
      }, 'in'),
      // THE CLAP. Everything arrives at the centre line at once.
      K(0.62, {
        UpArmL: [-78, 28, 6], LoArmL: [-104, 44, 0], HandL: [-18, 84, 0],
        UpArmR: [-74, -26, -6], LoArmR: [-108, -42, 0], HandR: [-18, -84, 0],
        Chest: [16, -6, 0], Spine: [13, -4, 0], Neck: [4, -2, 0], Head: [10, -5, 0],
        Hips: [0, 10, 0], Hips_pos: [0, -0.06, 0.03],
        ThighL: [-18, -8, 0], ShinL: [18, 0, 0], ThighR: [14, 9, 0], ShinR: [22, 0, 0]
      }, 'snap'),
      K(0.76, {
        UpArmL: [-76, 28, 6], LoArmL: [-102, 44, 0],
        UpArmR: [-72, -26, -6], LoArmR: [-106, -42, 0],
        Chest: [15, -6, 0], Head: [9, -5, 0], Hips_pos: [0, -0.058, 0.028]
      }, 'hold'),
      // THE POINT. Both hands out at the opponent, knee up, chest open, and he
      // is a foot taller than he was two beats ago.
      K(1.10, {
        UpArmL: [-92, 6, 22], LoArmL: [-8, 4, 4], HandL: [-8, 26, 0],
        UpArmR: [-90, -4, -24], LoArmR: [-6, -2, -4], HandR: [-8, -26, 0],
        Chest: [-14, 0, 0], Spine: [-10, 0, 0], Neck: [-6, 0, 0], Head: [-18, 0, 0],
        Hips: [0, 6, 0], Hips_pos: [0, 0.035, 0.05],
        ThighL: [-96, -8, 0], ShinL: [72, 0, 0], FootL: [-16, -14, 0],
        ThighR: [4, 9, 0], ShinR: [6, 0, 0], FootR: [6, 11, 0]
      }, 'snap'),
      // the foot comes down and the pose SETTLES rather than ending — arms stay
      // out, the whole body drops onto both legs with a real thud
      K(1.42, {
        UpArmL: [-86, 6, 26], LoArmL: [-14, 4, 4],
        UpArmR: [-84, -4, -28], LoArmR: [-12, -2, -4],
        Chest: [-8, -2, 0], Spine: [-6, -2, 0], Head: [-14, -2, 0],
        Hips_pos: [0, -0.09, 0.045],
        ThighL: [-28, -8, 0], ShinL: [30, 0, 0], FootL: [4, -14, 0],
        ThighR: [20, 9, 0], ShinR: [26, 0, 0]
      }, 'snap'),
      K(2.10, {
        UpArmL: [-88, 6, 24], LoArmL: [-12, 4, 4],
        UpArmR: [-86, -4, -26], LoArmR: [-10, -2, -4],
        Chest: [-11, -2, 0], Head: [-16, -2, 0], Hips_pos: [0, -0.04, 0.04],
        ThighL: [-20, -8, 0], ShinL: [22, 0, 0], ThighR: [16, 9, 0], ShinR: [20, 0, 0]
      }, 'hold'),
      // breathing, because that took something out of him
      K(2.70, {
        UpArmL: [-80, 8, 26], LoArmL: [-20, 6, 4],
        UpArmR: [-78, -6, -28], LoArmR: [-18, -4, -4],
        Chest: [-6, -4, 0], Head: [-12, -4, 0], Hips_pos: [0, -0.055, 0.02]
      }),
      K(3.4, {}, 'out')
    ]
  },
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.7, { UpArmL: [-58, -34, 8], LoArmL: [-108, 44, 0], HandL: [-20, 40, 0], UpArmR: [-62, 34, -8], LoArmR: [-104, -44, 0], HandR: [-20, -40, 0], Chest: [-6, -4, 0], Spine: [-4, -2, 0], Head: [-6, -4, 0], Hips_pos: [0, -0.02, 0] }, 'out'),
      K(1.6, { Head: [8, -4, 0], Chest: [-4, -4, 0] }),
      K(2.2, { Head: [-4, -4, 0] }),
      K(3.0, { Head: [0, -6, 0] })
    ]
  }
};
