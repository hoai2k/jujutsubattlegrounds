// Nanami-specific clips: measured, economical cleaves — no wasted motion,
// hard stops on impact. Overtime tie-adjust, Collapse multi-cleave, victory.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — the salaryman. Square, upright, feet close, no wasted motion. Left
// hand hangs dead at his side, right forearm carried level across the body
// where the blade would be. He does not bounce; he waits and measures.
export const NANAMI_STANCE = {
  Hips_pos: [0, -0.03, 0],
  Hips: [0, 16, 0], Spine: [2, -5, 0], Chest: [1, -7, 0], Neck: [0, -3, 0], Head: [-1, -6, 0],
  UpArmL: [-8, 6, 3], LoArmL: [-32, 12, 2], HandL: [-12, 34, 0],
  UpArmR: [-22, -8, -4], LoArmR: [-88, -30, 0], HandR: [-16, -88, 0],
  ThighL: [-11, -3, 0], ShinL: [10, 0, 0], FootL: [2, -9, 0],
  ThighR: [9, 5, 0], ShinR: [13, 0, 0], FootR: [6, 6, 0]
};

export const NANAMI_CLIPS = {
  // 7:3 TIMING: the blade raised level in front of his eyes while he measures
  // the ratio point — held, exposed, deliberate. Loops until the second press.
  ratioFocus: {
    dur: 0.9, loop: true, keys: [
      K(0, { UpArmR: [-72, -12, -4], LoArmR: [-58, -12, 0], HandR: [-16, -88, 0], UpArmL: [-16, 8, 4], LoArmL: [-46, 12, 2], Head: [4, -8, 0], Chest: [3, -8, 0], Spine: [3, -5, 0], Hips_pos: [0, -0.045, 0] }),
      K(0.45, { UpArmR: [-74, -12, -4], LoArmR: [-60, -12, 0], Head: [5, -7, 0], Hips_pos: [0, -0.052, 0] }),
      K(0.9, { UpArmR: [-72, -12, -4], LoArmR: [-58, -12, 0], Head: [4, -8, 0], Hips_pos: [0, -0.045, 0] })
    ]
  },
  // idle: a long, slow, controlled breath. Barely any travel — the stillness
  // is the characterization.
  idle: {
    dur: 4.2, loop: true, keys: [
      K(0, {}),
      K(1.7, { Chest: [2, -7, 0], Spine: [3, -5, 0], Hips_pos: [0, -0.042, 0], UpArmR: [-24, -8, -5], LoArmR: [-90, -30, 0], Head: [-1, -4, 0] }),
      K(3.0, { Chest: [0, -8, 0], Hips_pos: [0, -0.024, 0], UpArmL: [-10, 6, 4], Head: [0, -9, 0] }),
      K(4.2, {})
    ]
  },

  // Ratio cleave: blade overhead, one clean diagonal down-cut (7:3 line)
  ct1: {
    dur: 0.75, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmR: [-150, -20, -14], LoArmR: [-40, 0, -4], HandR: [-20, 0, 0], UpArmL: [-60, 16, 20], Chest: [-8, -26, 0], Spine: [-6, -14, 0], Hips: [0, 38, 0], Head: [0, -12, 0], Hips_pos: [0, -0.06, 0] }, 'in'),
      K(0.32, { UpArmR: [-46, 18, -6], LoArmR: [-8, 0, 0], HandR: [-70, 0, 45], Chest: [16, 22, 0], Spine: [12, 14, 0], Hips: [2, -2, 0], Head: [6, -16, 0], Hips_pos: [0, -0.10, 0], ThighL: [-30, -4, 0], ShinL: [34, 0, 0] }, 'snap'),
      K(0.40, { UpArmR: [-44, 18, -6], LoArmR: [-10, 0, 0], HandR: [-70, 0, 45], Chest: [16, 22, 0], Hips_pos: [0, -0.10, 0] }, 'hold'),
      K(0.75, {}, 'out')
    ]
  },
  // BLUNT DESCENT: blade taken straight overhead and brought down on the same
  // 7:3 line as the cleave — no flourish, one clean vertical, knees absorbing
  // the stop. The most economical knockdown in the roster.
  heavy: {
    dur: 0.83, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-162, -16, -10], LoArmR: [-52, 0, -4], HandR: [-16, -40, 0], UpArmL: [-70, 18, 22], LoArmL: [-70, 0, 6], Chest: [-10, -14, 0], Spine: [-7, -8, 0], Hips: [0, 26, 0], Head: [-4, -8, 0], Hips_pos: [0, -0.05, 0] }, 'in'),
      K(0.34, { UpArmR: [-48, 6, -2], LoArmR: [-6, 0, 0], HandR: [-52, 0, 0], UpArmL: [-30, 12, 18], LoArmL: [-84, 0, 6], Chest: [12, 10, 0], Spine: [9, 6, 0], Hips: [4, -2, 0], Head: [7, -10, 0], Hips_pos: [0, -0.14, 0], ThighL: [-34, -4, 0], ShinL: [40, 0, 0], ThighR: [28, 6, 0], ShinR: [52, 0, 0] }, 'snap'),
      K(0.44, { UpArmR: [-46, 6, -2], LoArmR: [-8, 0, 0], HandR: [-52, 0, 0], Chest: [12, 10, 0], Hips_pos: [0, -0.14, 0] }, 'hold'),
      K(0.83, {}, 'out')
    ]
  },
  // Overtime: left hand straightens the tie, shoulders set, stance drops
  ct2: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.25, { UpArmL: [-84, -34, 6], LoArmL: [-118, -24, 4], HandL: [-40, 20, 0], Head: [8, -2, 0], Chest: [0, -6, 0], UpArmR: [-20, -8, -14], LoArmR: [-50, 0, -4] }, 'out'),
      K(0.55, { UpArmL: [-70, -30, 6], LoArmL: [-100, -20, 4], Head: [4, -2, 0] }, 'hold'),
      K(0.78, { UpArmL: [-56, 12, 14], LoArmL: [-90, 0, 6], UpArmR: [-44, -8, -18], LoArmR: [-104, 0, -6], Head: [0, -10, 0], Chest: [4, -12, 0], Hips_pos: [0, -0.075, 0] }, 'snap'),
      K(0.95, {}, 'out')
    ]
  },
  // Collapse: three maximum-output cleaves — right, left, overhead finisher
  ult: {
    dur: 1.9, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-140, -26, -14], LoArmR: [-44, 0, -4], Chest: [-8, -30, 0], Hips: [0, 42, 0], Hips_pos: [0, -0.07, 0] }, 'in'),
      K(0.34, { UpArmR: [-50, 20, -4], LoArmR: [-8, 0, 0], HandR: [-70, 0, 45], Chest: [14, 24, 0], Hips: [2, -4, 0], Hips_pos: [0, -0.10, 0] }, 'snap'),
      K(0.42, { UpArmR: [-48, 20, -4], Chest: [14, 24, 0] }, 'hold'),
      K(0.62, { UpArmR: [-60, 40, -30], LoArmR: [-60, 0, -6], Chest: [-4, 34, 0], Hips: [0, -8, 0], Hips_pos: [0, -0.08, 0] }, 'in'),
      K(0.76, { UpArmR: [-84, -30, 10], LoArmR: [-10, 0, 0], HandR: [-70, 0, -45], Chest: [12, -26, 0], Hips: [0, 34, 0], Hips_pos: [0, -0.11, 0] }, 'snap'),
      K(0.84, { UpArmR: [-86, -30, 10], Chest: [12, -26, 0] }, 'hold'),
      K(1.10, { UpArmR: [-158, -8, -8], LoArmR: [-50, 0, -4], UpArmL: [-80, 14, 24], Chest: [-14, -10, 0], Spine: [-10, -6, 0], Hips_pos: [0, -0.04, 0] }, 'in'),
      K(1.26, { UpArmR: [-40, 6, -2], LoArmR: [-6, 0, 0], HandR: [-80, 0, 0], Chest: [22, 12, 0], Spine: [16, 8, 0], Head: [10, -12, 0], Hips_pos: [0, -0.14, 0], ThighL: [-34, -4, 0], ShinL: [40, 0, 0], ThighR: [28, 6, 0], ShinR: [52, 0, 0] }, 'snap'),
      K(1.42, { UpArmR: [-38, 6, -2], Chest: [22, 12, 0], Hips_pos: [0, -0.14, 0] }, 'hold'),
      K(1.9, {}, 'out')
    ]
  },
  // ---- TAUNT — "I'D RATHER BE AT THE BAKERY." -----------------------------
  // Dry and weary, and built entirely around the WATCH — the one object that
  // says everything about him. He checks it, and then he keeps looking at it a
  // beat too long, which is the joke: he is not timing you, he is counting how
  // much of his day this is costing.
  //
  // The exhale at 2.15 is the most important key in the clip. It is a two-
  // centimetre drop through the hips and four degrees of chest, and without it
  // the whole thing is a man looking at his wrist.
  taunt: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      // the left wrist comes up and across — a small economical movement
      K(0.38, {
        UpArmL: [-64, 24, 12], LoArmL: [-126, 40, 0], HandL: [-22, 96, 0],
        UpArmR: [-20, -8, -4], LoArmR: [-84, -28, 0],
        Chest: [4, -12, 0], Spine: [4, -8, 0], Neck: [4, -4, 0], Head: [10, -12, 0],
        Hips_pos: [0, -0.038, 0]
      }, 'out'),
      // he reads it. And keeps reading it.
      K(0.85, {
        UpArmL: [-66, 22, 10], LoArmL: [-130, 38, 0], HandL: [-24, 100, 0],
        Chest: [5, -12, 0], Neck: [5, -4, 0], Head: [13, -13, 0],
        UpArmR: [-20, -8, -4], LoArmR: [-84, -28, 0], Hips_pos: [0, -0.04, 0]
      }, 'hold'),
      K(1.60, {
        UpArmL: [-65, 22, 10], LoArmL: [-129, 38, 0],
        Chest: [5, -12, 0], Head: [13, -12, 0],
        UpArmR: [-20, -8, -4], LoArmR: [-84, -28, 0], Hips_pos: [0, -0.042, 0]
      }, 'hold'),
      // THE EXHALE. Arm falls, shoulders drop, and he looks off to one side.
      K(2.15, {
        UpArmL: [-4, 6, 3], LoArmL: [-26, 12, 2], HandL: [-12, 34, 0],
        UpArmR: [-18, -8, -4], LoArmR: [-80, -30, 0],
        Chest: [7, -14, 0], Spine: [6, -9, 0], Neck: [2, -6, 0], Head: [4, -20, 2],
        Hips_pos: [0, -0.058, 0], Hips: [0, 18, 0]
      }, 'out'),
      // the tie, straightened. Because of course it is.
      K(2.68, {
        UpArmR: [-92, -14, -22], LoArmR: [-116, -54, 0], HandR: [-18, -70, 0],
        UpArmL: [-5, 6, 3], LoArmL: [-28, 12, 2],
        Chest: [4, -10, 0], Spine: [4, -7, 0], Head: [0, -10, 0],
        Hips_pos: [0, -0.046, 0]
      }, 'out'),
      K(3.4, {}, 'out')
    ]
  },
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.6, { UpArmR: [-96, 24, -6], LoArmR: [-124, 26, -4], HandR: [-30, -20, 0], Head: [4, -4, 0], Chest: [0, -4, 0] }, 'out'),
      K(1.3, { UpArmR: [-96, 24, -6], LoArmR: [-124, 26, -4], Head: [2, 6, 0] }, 'hold'),
      K(2.0, { UpArmR: [-40, -8, -16], LoArmR: [-100, 0, -6], UpArmL: [-84, -34, 6], LoArmL: [-118, -24, 4], HandL: [-40, 20, 0], Head: [6, 0, 0] }),
      K(3.0, { UpArmL: [-52, 10, 14], LoArmL: [-86, 0, 6], Head: [0, -4, 0] })
    ]
  }
};
