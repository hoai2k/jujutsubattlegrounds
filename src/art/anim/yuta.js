// Yuta-specific clips: two-hand katana arcs with committed follow-through,
// the Authentic Mutual Love sign, the in-domain pickup loop (snatch, carry
// run, lunging slash), quiet victory.
const K = (t, pose, e) => ({ t, pose, e });

// two-hand grip helper poses (katana prop rides HandR)
const GRIP_HIGH = { UpArmL: [-96, -34, 8], LoArmL: [-96, -30, 4], HandL: [-30, 20, 0], UpArmR: [-118, 16, -8], LoArmR: [-58, 10, -4], HandR: [-30, -20, 0] };

// STANCE — iaido-ready. Deep knees, big forward lean, left hand up and open to
// read the opponent, right hand hovering low at the hip over the scabbard.
// Coiled and tense: he commits everything to the first cut.
export const YUTA_STANCE = {
  Hips_pos: [0, -0.085, 0],
  Hips: [2, 30, 0], Spine: [13, -9, 0], Chest: [8, -13, 0], Neck: [-3, -5, 0], Head: [-4, -12, 0],
  UpArmL: [-44, 18, 12], LoArmL: [-96, 34, 4], HandL: [-16, 84, 0],
  UpArmR: [-8, -14, -6], LoArmR: [-64, -34, 0], HandR: [-24, -50, 0],
  ThighL: [-27, -5, 0], ShinL: [30, 0, 0], FootL: [2, -13, 0],
  ThighR: [21, 7, 0], ShinR: [34, 0, 0], FootR: [11, 9, 0]
};

export const YUTA_CLIPS = {
  // idle: tight, quick breathing in a low crouch — nervous energy, never still.
  // Faster cycle than the others; he is the one who is afraid and pushing anyway.
  idle: {
    dur: 1.9, loop: true, keys: [
      K(0, {}),
      K(0.62, { Hips_pos: [0, -0.10, 0], Spine: [15, -9, 0], Chest: [9, -13, 0], UpArmL: [-47, 18, 13], LoArmL: [-99, 34, 4], Head: [-5, -12, 0] }),
      K(1.25, { Hips_pos: [0, -0.076, 0], Spine: [12, -8, 0], Chest: [7, -12, 0], UpArmL: [-42, 18, 11], UpArmR: [-6, -14, -7], Head: [-2, -10, 0] }),
      K(1.9, {})
    ]
  },
  // Rika-backed horizontal cleave: slow armored windup, wide follow-through
  ct1: {
    dur: 1.05, loop: false, keys: [
      K(0, {}),
      K(0.30, { ...GRIP_HIGH, Chest: [-6, -38, 0], Spine: [-4, -20, 0], Hips: [0, 46, 0], Head: [0, -16, 0], Hips_pos: [0, -0.10, 0], ThighL: [-26, -4, 0], ShinL: [28, 0, 0] }, 'in'),
      K(0.44, { UpArmR: [-84, -34, -10], LoArmR: [-10, 0, 0], HandR: [-50, 0, 90], UpArmL: [-60, 20, 30], LoArmL: [-70, 0, 6], Chest: [8, 34, 0], Spine: [6, 20, 0], Hips: [0, -6, 0], Head: [2, -20, 0], Hips_pos: [0, -0.07, 0] }, 'snap'),
      K(0.54, { UpArmR: [-80, -44, -12], LoArmR: [-12, 0, 0], HandR: [-50, 0, 90], Chest: [8, 40, 0], Hips: [0, -10, 0] }, 'hold'),
      K(1.05, {}, 'out')
    ]
  },
  // Rika-empowered lunge: coiled crouch, forward stab
  ct2: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmR: [-40, -30, -24], LoArmR: [-110, 0, -8], Chest: [6, -34, 0], Hips: [4, 44, 0], Hips_pos: [0, -0.14, 0], ThighL: [-40, -4, 0], ShinL: [44, 0, 0], ThighR: [30, 6, 0], ShinR: [56, 0, 0] }, 'in'),
      K(0.22, { UpArmR: [-88, -2, -2], LoArmR: [-6, 0, 0], HandR: [-20, 0, 90], UpArmL: [-20, 10, 24], LoArmL: [-70, 0, 6], Chest: [12, 20, 0], Spine: [10, 12, 0], Hips: [2, 0, 0], Hips_pos: [0, -0.08, 0], ThighL: [-46, -4, 0], ShinL: [30, 0, 0], ThighR: [36, 6, 0], ShinR: [62, 0, 0] }, 'snap'),
      K(0.32, { UpArmR: [-90, -2, -2], LoArmR: [-8, 0, 0], HandR: [-20, 0, 90], Chest: [12, 20, 0], Hips_pos: [0, -0.08, 0] }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },
  // RIKA SLAM: both arms hauled overhead and hammered straight down — his
  // hands lead, hers land it. Deep knee absorb on the stop, head driven down
  // after the impact point.
  heavy: {
    dur: 0.88, loop: false, keys: [
      K(0, {}),
      K(0.24, { UpArmL: [-150, -14, 10], LoArmL: [-40, 0, 4], HandL: [-20, 0, 0], UpArmR: [-152, 14, -10], LoArmR: [-40, 0, -4], HandR: [-20, 0, 0], Chest: [-14, -6, 0], Spine: [-9, -4, 0], Head: [-10, 0, 0], Hips: [0, 22, 0], Hips_pos: [0, -0.04, 0], ThighL: [-18, -4, 0], ShinL: [20, 0, 0] }, 'in'),
      K(0.36, { UpArmL: [-60, 8, 14], LoArmL: [-14, 0, 4], HandL: [-40, 0, 0], UpArmR: [-58, -8, -16], LoArmR: [-14, 0, -4], HandR: [-40, 0, 0], Chest: [13, 2, 0], Spine: [10, 0, 0], Head: [8, -6, 0], Hips: [4, 26, 0], Hips_pos: [0, -0.17, 0], ThighL: [-40, -4, 0], ShinL: [48, 0, 0], ThighR: [32, 6, 0], ShinR: [58, 0, 0] }, 'snap'),
      K(0.46, { UpArmL: [-58, 8, 14], LoArmL: [-16, 0, 4], UpArmR: [-56, -8, -16], LoArmR: [-16, 0, -4], Chest: [13, 2, 0], Hips_pos: [0, -0.17, 0] }, 'hold'),
      K(0.88, {}, 'out')
    ]
  },
  // Authentic Mutual Love: katana raised before the face, then a down-slash
  domainCast: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.4, { UpArmR: [-116, 6, -6], LoArmR: [-96, 0, -4], HandR: [-20, 0, 0], UpArmL: [-70, -26, 8], LoArmL: [-110, -20, 4], HandL: [-30, 10, 0], Head: [8, -4, 0], Chest: [2, -6, 0], Hips_pos: [0, -0.06, 0] }, 'out'),
      K(0.9, { UpArmR: [-118, 6, -6], LoArmR: [-98, 0, -4], Head: [12, -4, 0], Hips_pos: [0, -0.075, 0] }, 'hold'),
      K(1.2, { UpArmR: [-64, -18, -10], LoArmR: [-8, 0, 0], HandR: [-60, 0, 90], UpArmL: [-40, 12, 22], LoArmL: [-60, 0, 6], Chest: [14, 16, 0], Spine: [10, 10, 0], Head: [4, -10, 0], Hips_pos: [0, -0.10, 0] }, 'snap'),
      K(1.6, { UpArmR: [-66, -18, -10], LoArmR: [-10, 0, 0], HandR: [-60, 0, 90], Chest: [14, 16, 0], Hips_pos: [0, -0.10, 0] }, 'hold')
    ]
  },
  // in-domain pickup snatch: dip low mid-stride, rip the blade free
  swordPickup: {
    dur: 0.5, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips_pos: [0, -0.28, 0], Spine: [30, -8, 0], Chest: [18, -8, 0], UpArmR: [-10, -10, -10], LoArmR: [-30, 0, -4], Head: [16, -8, 0], ThighL: [-56, -4, 0], ShinL: [66, 0, 0], ThighR: [40, 6, 0], ShinR: [78, 0, 0] }, 'in'),
      K(0.28, { Hips_pos: [0, -0.04, 0], Spine: [-8, 4, 0], Chest: [-10, 8, 0], UpArmR: [-118, 4, -6], LoArmR: [-34, 0, 0], HandR: [-20, 0, 90], UpArmL: [-40, 10, 20], Head: [-6, -8, 0] }, 'snap'),
      K(0.5, {}, 'out')
    ]
  },
  // sword-carry run: blade trailing low behind the right hip, torso driven
  // forward — the "run them down" phase reads fast and aggressive
  swordRun: {
    dur: 0.48, loop: true, keys: [
      K(0, { Spine: [20, -6, 0], Chest: [12, -8, 0], Hips: [4, 16, 0], ThighL: [-54, -2, 0], ShinL: [26, 0, 0], FootL: [-14, -6, 0], ThighR: [36, 4, 0], ShinR: [68, 0, 0], FootR: [30, 6, 0], UpArmL: [-56, 12, 14], LoArmL: [-92, 0, 4], UpArmR: [18, -22, -14], LoArmR: [-44, -10, -4], HandR: [-24, -20, 40], Hips_pos: [0, -0.03, 0] }),
      K(0.12, { Spine: [18, -6, 0], ThighL: [-12, -2, 0], ShinL: [32, 0, 0], ThighR: [-16, 4, 0], ShinR: [42, 0, 0], Hips_pos: [0, -0.065, 0] }),
      K(0.24, { Spine: [20, -6, 0], Chest: [12, -8, 0], Hips: [4, 16, 0], ThighL: [36, -2, 0], ShinL: [68, 0, 0], FootL: [30, -6, 0], ThighR: [-54, 4, 0], ShinR: [26, 0, 0], FootR: [-14, 6, 0], UpArmL: [-24, 12, 14], LoArmL: [-100, 0, 4], UpArmR: [26, -24, -16], LoArmR: [-38, -10, -4], Hips_pos: [0, -0.03, 0] }),
      K(0.36, { Spine: [18, -6, 0], ThighL: [-16, -2, 0], ShinL: [42, 0, 0], ThighR: [-12, 4, 0], ShinR: [32, 0, 0], Hips_pos: [0, -0.065, 0] }),
      K(0.48, { Spine: [20, -6, 0], Chest: [12, -8, 0], Hips: [4, 16, 0], ThighL: [-54, -2, 0], ShinL: [26, 0, 0], FootL: [-14, -6, 0], ThighR: [36, 4, 0], ShinR: [68, 0, 0], FootR: [30, 6, 0], UpArmL: [-56, 12, 14], LoArmL: [-92, 0, 4], UpArmR: [18, -22, -14], LoArmR: [-44, -10, -4] })
    ]
  },
  // committed lunging slash: big coil, full-body diagonal cut, long settle —
  // the recovery tail is the whiff punish window
  swordSlash: {
    dur: 0.8, loop: false, keys: [
      K(0, {}),
      K(0.16, { ...GRIP_HIGH, Chest: [-8, -42, 0], Spine: [-4, -24, 0], Hips: [2, 48, 0], Head: [0, -18, 0], Hips_pos: [0, -0.14, 0], ThighL: [-42, -4, 0], ShinL: [46, 0, 0], ThighR: [32, 6, 0], ShinR: [58, 0, 0] }, 'in'),
      K(0.28, { UpArmR: [-70, -40, -14], LoArmR: [-8, 0, 0], HandR: [-54, 0, 90], UpArmL: [-52, 18, 28], LoArmL: [-64, 0, 6], Chest: [16, 38, 0], Spine: [12, 22, 0], Hips: [2, -8, 0], Head: [4, -22, 0], Hips_pos: [0, -0.06, 0], ThighL: [-50, -4, 0], ShinL: [34, 0, 0], ThighR: [40, 6, 0], ShinR: [64, 0, 0] }, 'snap'),
      K(0.40, { UpArmR: [-64, -50, -16], LoArmR: [-12, 0, 0], HandR: [-54, 0, 90], Chest: [16, 44, 0], Hips: [2, -12, 0], Hips_pos: [0, -0.08, 0] }, 'hold'),
      K(0.8, {}, 'out')
    ]
  },
  // ---- TAUNT — "SORRY. I CAN'T LOSE." -------------------------------------
  // The most apologetic taunt in the game, and the only one where the body
  // language argues with the line. He half-bows — an actual bow, from a boy who
  // bows at people — rubs the back of his neck, and then comes up out of it
  // into a guard that is noticeably tighter than the one he started in. The
  // apology is sincere. So is the second half.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the bow: spine folds, hands come off the guard and go down and in
      K(0.42, {
        Spine: [34, -9, 0], Chest: [20, -13, 0], Neck: [-8, -5, 0], Head: [-14, -12, 0],
        UpArmL: [12, 16, 6], LoArmL: [-34, 26, 2], HandL: [-10, 40, 0],
        UpArmR: [14, -14, -6], LoArmR: [-30, -24, 0], HandR: [-10, -40, 0],
        Hips_pos: [0, -0.11, 0], Hips: [2, 24, 0]
      }, 'in'),
      K(0.72, {
        Spine: [30, -9, 0], Chest: [18, -13, 0], Head: [-12, -12, 0],
        UpArmL: [10, 16, 6], LoArmL: [-36, 26, 2],
        UpArmR: [12, -14, -6], LoArmR: [-32, -24, 0],
        Hips_pos: [0, -0.10, 0]
      }, 'hold'),
      // straightens, and the hand goes to the back of the neck — the tell
      K(1.15, {
        Spine: [8, -9, 0], Chest: [4, -13, 0], Neck: [-2, -5, 0], Head: [-2, -16, 4],
        UpArmR: [-104, -24, -30], LoArmR: [-126, -60, 0], HandR: [-20, -80, 0],
        UpArmL: [-16, 16, 8], LoArmL: [-52, 26, 2],
        Hips_pos: [0, -0.075, 0], Hips: [2, 26, 0]
      }, 'out'),
      K(1.75, {
        Spine: [6, -9, 0], Chest: [3, -13, 0], Head: [-3, -14, 5],
        UpArmR: [-100, -22, -34], LoArmR: [-122, -58, 0], HandR: [-20, -80, 0],
        UpArmL: [-18, 16, 8], LoArmL: [-54, 26, 2],
        Hips_pos: [0, -0.08, 0]
      }, 'hold'),
      // and the hand comes down into a guard TIGHTER than the one he started
      // in. That is the whole second half of the line, done with the arms.
      K(2.25, {
        Spine: [15, -9, 0], Chest: [10, -13, 0], Neck: [-4, -5, 0], Head: [-6, -10, 0],
        UpArmL: [-50, 20, 10], LoArmL: [-104, 38, 4], HandL: [-16, 88, 0],
        UpArmR: [-16, -16, -6], LoArmR: [-76, -38, 0], HandR: [-26, -56, 0],
        Hips_pos: [0, -0.095, 0], Hips: [2, 32, 0]
      }, 'snap'),
      K(2.70, {
        Spine: [14, -9, 0], Chest: [9, -13, 0], Head: [-5, -11, 0],
        UpArmL: [-48, 20, 10], LoArmL: [-102, 38, 4],
        UpArmR: [-15, -16, -6], LoArmR: [-74, -38, 0],
        Hips_pos: [0, -0.09, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.6, { UpArmR: [-60, -20, -10], LoArmR: [-70, 0, -4], UpArmL: [-30, 20, 10], LoArmL: [-80, 10, 4], Head: [14, 0, 0], Chest: [6, -4, 0], Spine: [4, -2, 0], Hips_pos: [0, -0.06, 0] }, 'out'),
      K(1.6, { UpArmR: [-20, -6, -10], LoArmR: [-30, 0, -4], UpArmL: [-16, 8, 8], LoArmL: [-34, 0, 4], Head: [-6, 0, 0], Chest: [-4, 0, 0], Spine: [-2, 0, 0], Hips_pos: [0, -0.03, 0] }),
      K(3.0, { Head: [-4, 8, 0] })
    ]
  }
};
