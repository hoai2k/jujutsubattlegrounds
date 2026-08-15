// Yuji-specific clips. Movement language: loose and athletic — big
// anticipation, heavy follow-through, whole body thrown into every swing.
// Nothing measured (Nanami) or casual (Gojo): he commits.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — boxer-loose: weight low and forward, fists up but open guard,
// shoulders rolled in. Bouncy, ready to step.
export const YUJI_STANCE = {
  Hips_pos: [0, -0.06, 0],
  Hips: [1, 26, 0], Spine: [8, -8, 0], Chest: [6, -11, 0], Neck: [-1, -4, 0], Head: [0, -10, 0],
  UpArmL: [-38, 14, 10], LoArmL: [-108, 28, 0], HandL: [-22, 76, 0],
  UpArmR: [-26, -10, -10], LoArmR: [-116, -24, 0], HandR: [-24, -74, 0],
  ThighL: [-20, -5, 0], ShinL: [20, 0, 0], FootL: [2, -12, 0],
  ThighR: [16, 7, 0], ShinR: [26, 0, 0], FootR: [10, 8, 0]
};

export const YUJI_CLIPS = {
  // idle: constant small bounce — he never sits still in a fight
  idle: {
    dur: 1.6, loop: true, keys: [
      K(0, {}),
      K(0.4, { Hips_pos: [0, -0.075, 0], Spine: [10, -8, 0], UpArmL: [-42, 14, 11], UpArmR: [-30, -10, -11], Head: [1, -9, 0] }),
      K(0.8, { Hips_pos: [0, -0.055, 0], Spine: [7, -8, 0], Chest: [5, -10, 0], Head: [-1, -11, 0] }),
      K(1.2, { Hips_pos: [0, -0.07, 0], Spine: [9, -8, 0], UpArmL: [-40, 14, 12], UpArmR: [-28, -10, -12] }),
      K(1.6, {})
    ]
  },
  // DIVERGENT FIST: huge wind-back, full-body straight, held follow-through
  // (the delayed shockwave lands during the hold — the pose sells the lag)
  ct1: {
    dur: 0.6, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmR: [-24, -20, -28], LoArmR: [-126, 0, -8], HandR: [-16, -90, 0], Chest: [4, -40, 0], Spine: [4, -22, 0], Hips: [0, 46, 0], Hips_pos: [0, -0.10, 0], ThighL: [-30, -4, 0], ShinL: [34, 0, 0], Head: [2, -14, 0] }, 'in'),
      K(0.24, { UpArmR: [-90, 6, 0], LoArmR: [-4, 0, 0], HandR: [-4, -168, 0], UpArmL: [-34, 12, 18], LoArmL: [-98, 0, 6], Chest: [8, 30, 0], Spine: [8, 18, 0], Hips: [0, -4, 0], Hips_pos: [0, -0.07, 0], Head: [2, -20, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0] }, 'snap'),
      K(0.40, { UpArmR: [-92, 6, 0], LoArmR: [-6, 0, 0], HandR: [-4, -168, 0], Chest: [9, 32, 0], Hips: [0, -6, 0] }, 'hold'),
      K(0.6, {}, 'out')
    ]
  },
  // MANJI KICK: coiled spin into a leaping roundhouse — whole torso whips
  ct2: {
    dur: 0.82, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips: [4, -52, 0], Spine: [10, -26, 0], Chest: [8, -20, 0], Hips_pos: [0, -0.15, 0], ThighL: [-44, -4, 0], ShinL: [52, 0, 0], ThighR: [26, 6, 0], ShinR: [50, 0, 0], UpArmL: [-50, 16, 20], LoArmL: [-90, 0, 6], UpArmR: [-10, -14, -18], LoArmR: [-60, 0, -6], Head: [4, -18, 0] }, 'in'),
      K(0.30, { Hips: [-6, 48, 0], Spine: [-12, 26, 0], Chest: [-10, 22, 0], Hips_pos: [0, 0.02, 0], ThighR: [-102, 4, -8], ShinR: [8, 0, 0], FootR: [24, 6, 0], ThighL: [-16, -4, 0], ShinL: [30, 0, 0], UpArmL: [-70, 14, 32], LoArmL: [-40, 0, 6], UpArmR: [30, -12, -34], LoArmR: [-24, 0, -6], Head: [-4, 14, 0] }, 'snap'),
      K(0.44, { ThighR: [-96, 4, -8], ShinR: [12, 0, 0], Hips: [-4, 42, 0], Hips_pos: [0, -0.01, 0] }, 'hold'),
      K(0.82, {}, 'out')
    ]
  },
  // OVERHAND SMASH: the fist cocked all the way back behind the hip, then the
  // hips, spine and shoulder fired in sequence and driven down through the
  // target. He sinks a foot into the floor on impact. Nothing held back.
  heavy: {
    dur: 0.9, loop: false, keys: [
      K(0, {}),
      K(0.26, { UpArmR: [44, -20, -40], LoArmR: [-100, 0, -10], HandR: [-20, -80, 0], UpArmL: [-50, 16, 22], LoArmL: [-90, 0, 6], Chest: [6, -42, 0], Spine: [5, -22, 0], Hips: [2, 48, 0], Head: [2, -16, 0], Hips_pos: [0, -0.12, 0], ThighL: [-32, -4, 0], ShinL: [38, 0, 0], ThighR: [28, 6, 0], ShinR: [52, 0, 0] }, 'in'),
      K(0.38, { UpArmR: [-72, 12, 4], LoArmR: [-6, 0, 0], HandR: [-30, -150, 0], UpArmL: [-24, 12, 16], LoArmL: [-96, 0, 6], Chest: [12, 26, 0], Spine: [9, 15, 0], Hips: [6, -6, 0], Head: [8, -18, 0], Hips_pos: [0, -0.17, 0], ThighL: [-42, -4, 0], ShinL: [48, 0, 0], ThighR: [34, 6, 0], ShinR: [60, 0, 0] }, 'snap'),
      K(0.5, { UpArmR: [-70, 12, 4], LoArmR: [-8, 0, 0], HandR: [-30, -150, 0], Chest: [12, 28, 0], Hips: [6, -8, 0], Hips_pos: [0, -0.17, 0] }, 'hold'),
      K(0.9, {}, 'out')
    ]
  },
  // RESOLVE: plant, clench both fists at the ribs, chest opens — a breath
  resolve: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmL: [-30, 20, 14], LoArmL: [-120, 20, 0], HandL: [-30, 80, 0], UpArmR: [-30, -20, -14], LoArmR: [-120, -20, 0], HandR: [-30, -80, 0], Chest: [-8, -6, 0], Spine: [-4, -4, 0], Head: [-6, -6, 0], Hips_pos: [0, -0.10, 0], ThighL: [-26, -4, 0], ShinL: [30, 0, 0], ThighR: [22, 6, 0], ShinR: [34, 0, 0] }, 'snap'),
      K(0.22, { Chest: [-10, -4, 0], Hips_pos: [0, -0.105, 0] }, 'hold'),
      K(0.36, {}, 'out')
    ]
  },
  // SUKUNA'S MANIFESTATION: hunch and grip the face, then thrown wide open —
  // head back, arms flared, something else looking out
  sukuna: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.22, { Spine: [26, -6, 0], Chest: [16, -6, 0], Head: [22, -4, 0], UpArmR: [-118, 2, -8], LoArmR: [-118, 0, -4], HandR: [-40, 0, 0], UpArmL: [-40, 14, 16], LoArmL: [-80, 0, 6], Hips_pos: [0, -0.15, 0], ThighL: [-34, -4, 0], ShinL: [40, 0, 0], ThighR: [28, 6, 0], ShinR: [44, 0, 0] }, 'in'),
      K(0.40, { Spine: [-18, -2, 0], Chest: [-14, -2, 0], Head: [-24, 0, 0], UpArmL: [-84, 10, 66], LoArmL: [-16, 0, 6], HandL: [10, 0, 0], UpArmR: [-80, -8, -70], LoArmR: [-12, 0, -6], HandR: [10, 0, 0], Hips_pos: [0, -0.02, 0], ThighL: [-14, -6, 0], ShinL: [14, 0, 0], ThighR: [10, 8, 0], ShinR: [18, 0, 0] }, 'snap'),
      K(0.62, { Spine: [-16, -2, 0], Head: [-20, 0, 0], UpArmL: [-80, 10, 62], UpArmR: [-76, -8, -66], Hips_pos: [0, -0.03, 0] }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },
  // DISMANTLE string: open-hand slashing arcs — faster and wider than the
  // punch string, palm-blade instead of fist
  slash1: {
    dur: 0.28, loop: false, keys: [
      K(0, {}),
      K(0.05, { UpArmR: [-50, -26, -18], LoArmR: [-70, 0, -6], HandR: [-40, -40, 60], Chest: [2, -30, 0], Hips: [0, 36, 0] }, 'in'),
      K(0.11, { UpArmR: [-86, 18, 4], LoArmR: [-10, 0, 0], HandR: [-30, 20, 90], Chest: [6, 24, 0], Spine: [5, 14, 0], Hips: [0, 0, 0], Head: [2, -16, 0], UpArmL: [-34, 12, 16], LoArmL: [-96, 0, 6] }, 'snap'),
      K(0.15, { UpArmR: [-86, 22, 4], LoArmR: [-12, 0, 0], HandR: [-30, 20, 90], Chest: [6, 26, 0] }, 'hold'),
      K(0.28, {}, 'out')
    ]
  },
  slash2: {
    dur: 0.3, loop: false, keys: [
      K(0, { UpArmR: [-70, 10, 0], LoArmR: [-30, 0, 0], Chest: [4, 12, 0] }),
      K(0.06, { UpArmL: [-46, 30, 22], LoArmL: [-84, 0, 6], HandL: [-40, 50, -60], Chest: [4, 32, 0], Hips: [0, -30, 0], Spine: [4, 16, 0] }, 'in'),
      K(0.12, { UpArmL: [-88, -16, -2], LoArmL: [-8, 0, 0], HandL: [-30, -20, -90], Chest: [6, -26, 0], Spine: [5, -14, 0], Hips: [0, 8, 0], Head: [2, -12, 0], UpArmR: [-30, -12, -16], LoArmR: [-100, 0, -6] }, 'snap'),
      K(0.17, { UpArmL: [-88, -20, -2], LoArmL: [-10, 0, 0], HandL: [-30, -20, -90], Chest: [6, -28, 0] }, 'hold'),
      K(0.3, {}, 'out')
    ]
  },
  slash3: {
    dur: 0.44, loop: false, keys: [
      K(0, { UpArmL: [-70, -10, 0], LoArmL: [-30, 0, 0] }),
      K(0.10, { UpArmR: [20, -14, -30], LoArmR: [-100, 0, -8], HandR: [-30, -40, 40], Chest: [12, -34, 0], Spine: [10, -18, 0], Hips: [4, 42, 0], Hips_pos: [0, -0.14, 0], ThighL: [-32, -4, 0], ShinL: [38, 0, 0], ThighR: [28, 6, 0], ShinR: [50, 0, 0] }, 'in'),
      K(0.19, { UpArmR: [-124, 12, 6], LoArmR: [-36, 0, 0], HandR: [-16, 0, 60], Chest: [-12, 20, 0], Spine: [-9, 12, 0], Hips: [-2, 4, 0], Hips_pos: [0, 0.02, 0], ThighL: [-12, -4, 0], ShinL: [10, 0, 0], ThighR: [6, 6, 0], ShinR: [16, 0, 0], FootR: [22, 8, 0], Head: [-6, -10, 0], UpArmL: [-32, 12, 18], LoArmL: [-88, 0, 6] }, 'snap'),
      K(0.25, { UpArmR: [-126, 12, 6], LoArmR: [-38, 0, 0], Chest: [-12, 22, 0], Hips_pos: [0, 0.02, 0] }, 'hold'),
      K(0.44, {}, 'out')
    ]
  },
  // BLACK FLASH impact accent: a violent full-torque cross, snapped and held —
  // played over whatever state he's in when the timing lands
  bfImpact: {
    dur: 0.32, loop: false, keys: [
      K(0, { UpArmR: [-30, -18, -24], LoArmR: [-110, 0, -6], Chest: [4, -34, 0], Hips: [0, 40, 0] }),
      K(0.06, { UpArmR: [-88, 10, 2], LoArmR: [-2, 0, 0], HandR: [-4, -168, 0], UpArmL: [-40, 14, 20], LoArmL: [-100, 0, 6], Chest: [10, 34, 0], Spine: [9, 20, 0], Hips: [0, -8, 0], Head: [3, -22, 0], Hips_pos: [0, -0.09, 0], ThighL: [-28, -4, 0], ShinL: [32, 0, 0], ThighR: [24, 6, 0], ShinR: [42, 0, 0] }, 'snap'),
      K(0.18, { UpArmR: [-90, 10, 2], LoArmR: [-4, 0, 0], HandR: [-4, -168, 0], Chest: [11, 36, 0], Hips: [0, -10, 0] }, 'hold'),
      K(0.32, {}, 'out')
    ]
  },
  // ---- TAUNT — "YOU'RE NOT GETTING PAST ME." ------------------------------
  // A full shoulder windmill, then a point. Nothing clever: Yuji is the one
  // character whose taunt should look like a kid on a sports field, and the
  // whole-body commitment is the deliberate contrast against Sukuna's four
  // arms not bothering to move.
  taunt: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      // the arm goes back and up — big, loose, no guard at all
      K(0.32, {
        UpArmR: [56, -14, -30], LoArmR: [-16, -10, 0], HandR: [-10, -40, 0],
        UpArmL: [-30, 14, 14], LoArmL: [-96, 28, 0],
        Chest: [-2, -20, 0], Spine: [0, -14, 0], Head: [-4, -16, 0],
        Hips: [1, 34, 0], Hips_pos: [0, -0.045, 0]
      }, 'in'),
      // over the top
      K(0.55, {
        UpArmR: [-146, -6, -20], LoArmR: [-10, -6, 0], HandR: [-8, -36, 0],
        UpArmL: [-34, 14, 14], LoArmL: [-100, 28, 0],
        Chest: [-8, -6, 0], Spine: [-5, -4, 0], Head: [-10, -6, 0],
        Hips: [1, 22, 0], Hips_pos: [0, -0.03, 0]
      }, 'out'),
      // and down through — the shoulder rolls right around and the hips follow
      K(0.85, {
        UpArmR: [-6, -12, -16], LoArmR: [-40, -18, 0], HandR: [-14, -46, 0],
        UpArmL: [-36, 14, 12], LoArmL: [-104, 28, 0],
        Chest: [10, -14, 0], Spine: [10, -10, 0], Head: [4, -12, 0],
        Hips: [1, 26, 0], Hips_pos: [0, -0.075, 0]
      }, 'snap'),
      // THE POINT. Straight arm, weight onto the front foot, grin.
      K(1.20, {
        UpArmR: [-92, -6, -8], LoArmR: [-6, -4, 0], HandR: [-10, -30, 0],
        UpArmL: [-26, 14, 16], LoArmL: [-100, 28, 0], HandL: [-20, 76, 0],
        Chest: [4, 4, 0], Spine: [4, 2, 0], Neck: [-2, 2, 0], Head: [-4, 2, 0],
        Hips: [1, 12, 0], Hips_pos: [0, -0.05, 0.045],
        ThighL: [-26, -5, 0], ShinL: [22, 0, 0], ThighR: [10, 7, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      K(1.85, {
        UpArmR: [-90, -6, -8], LoArmR: [-8, -4, 0],
        UpArmL: [-27, 14, 16], LoArmL: [-100, 28, 0],
        Chest: [4, 4, 0], Head: [-5, 2, 0], Hips_pos: [0, -0.055, 0.042]
      }, 'hold'),
      // he drops the arm and comes back onto the guard, still grinning
      K(2.40, {
        UpArmR: [-30, -10, -10], LoArmR: [-110, -24, 0],
        UpArmL: [-36, 14, 10], LoArmL: [-106, 28, 0],
        Chest: [6, -9, 0], Head: [-2, -8, 0], Hips_pos: [0, -0.062, 0.01]
      }),
      K(3.0, {}, 'out')
    ]
  },
  // ---- TAUNT — YUJI 【SHINJUKU】: NO BUBBLE -------------------------------
  // Deliberately silent. Base Yuji winds up and points and grins; this one
  // wipes his mouth, spits, and resets his stance lower than he started. The
  // silence next to the base taunt IS the characterisation — putting a line on
  // it would undo the only thing it is for.
  tauntShinjuku: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the head comes down and the back of the wrist goes across the mouth
      K(0.40, {
        UpArmR: [-96, -18, -14], LoArmR: [-124, -40, 0], HandR: [-30, -96, 0],
        UpArmL: [-24, 14, 8], LoArmL: [-92, 28, 0],
        Chest: [14, -14, 0], Spine: [14, -10, 0], Neck: [4, -4, 0], Head: [12, -12, 0],
        Hips_pos: [0, -0.085, 0]
      }, 'in'),
      // the wipe: one lateral drag, and the head turns with it
      K(0.72, {
        UpArmR: [-88, 12, -22], LoArmR: [-118, -14, 0], HandR: [-28, -70, 0],
        UpArmL: [-25, 14, 8], LoArmL: [-94, 28, 0],
        Chest: [13, -2, 0], Spine: [13, -2, 0], Head: [11, 8, -3],
        Hips_pos: [0, -0.082, 0]
      }, 'out'),
      // he looks at his own hand. Beat. He does not react to what is on it.
      K(1.25, {
        UpArmR: [-104, -8, -18], LoArmR: [-96, -30, 0], HandR: [-10, -50, 0],
        UpArmL: [-26, 14, 8], LoArmL: [-96, 28, 0],
        Chest: [10, -12, 0], Head: [18, -10, 2], Neck: [6, -4, 0],
        Hips_pos: [0, -0.078, 0]
      }, 'out'),
      K(1.85, {
        UpArmR: [-102, -8, -18], LoArmR: [-98, -30, 0],
        Chest: [10, -12, 0], Head: [19, -10, 2], Hips_pos: [0, -0.08, 0]
      }, 'hold'),
      // and the stance comes back LOWER and tighter than the one he started in
      K(2.35, {
        UpArmL: [-46, 16, 8], LoArmL: [-116, 30, 0], HandL: [-22, 80, 0],
        UpArmR: [-34, -12, -8], LoArmR: [-124, -26, 0], HandR: [-24, -78, 0],
        Chest: [11, -13, 0], Spine: [13, -9, 0], Head: [2, -12, 0],
        Hips: [1, 30, 0], Hips_pos: [0, -0.105, 0],
        ThighL: [-25, -5, 0], ShinL: [26, 0, 0], ThighR: [20, 7, 0], ShinR: [31, 0, 0]
      }, 'snap'),
      K(2.85, {
        UpArmL: [-45, 16, 8], LoArmL: [-115, 30, 0],
        UpArmR: [-33, -12, -8], LoArmR: [-123, -26, 0],
        Chest: [10, -13, 0], Head: [1, -12, 0], Hips_pos: [0, -0.10, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },
  // ---- TAUNT — YUJI 【MODULO】 --------------------------------------------
  // Sixty-eight years later. The same warm body language, slowed right down and
  // with all the hurry taken out of it: he rolls one shoulder, turns his own
  // forearm over and watches the cursed markings move on it with mild interest,
  // and then looks up at you as if he had forgotten you were there.
  tauntModulo: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      K(0.45, {
        UpArmR: [-42, -18, -18], LoArmR: [-96, -34, 0], HandR: [-16, -44, 0],
        UpArmL: [-30, 14, 12], LoArmL: [-98, 28, 0],
        Chest: [4, -14, 0], Spine: [6, -10, 0], Head: [6, -14, 2],
        Hips_pos: [0, -0.05, 0]
      }, 'in'),
      // the forearm turns over, slowly — the wrist does most of the work
      K(1.05, {
        UpArmR: [-66, -14, -22], LoArmR: [-112, -20, 0], HandR: [8, 30, 0],
        UpArmL: [-31, 14, 12], LoArmL: [-100, 28, 0],
        Chest: [6, -12, 0], Spine: [7, -9, 0], Neck: [4, -4, 0], Head: [16, -10, 3],
        Hips_pos: [0, -0.048, 0]
      }, 'out'),
      K(1.75, {
        UpArmR: [-68, -14, -22], LoArmR: [-114, -18, 0], HandR: [10, 34, 0],
        Chest: [6, -12, 0], Head: [17, -10, 3], Hips_pos: [0, -0.05, 0],
        UpArmL: [-31, 14, 12], LoArmL: [-100, 28, 0]
      }, 'hold'),
      // and he looks up at you, unhurried, and lets the arm fall
      K(2.35, {
        UpArmR: [-28, -12, -12], LoArmR: [-114, -26, 0], HandR: [-22, -72, 0],
        UpArmL: [-34, 14, 10], LoArmL: [-104, 28, 0],
        Chest: [2, -10, 0], Spine: [4, -7, 0], Neck: [-3, -3, 0], Head: [-6, -8, 0],
        Hips_pos: [0, -0.04, 0]
      }, 'out'),
      K(2.85, {
        UpArmR: [-27, -12, -12], LoArmR: [-115, -26, 0],
        Chest: [2, -10, 0], Head: [-7, -8, 0], Hips_pos: [0, -0.042, 0]
      }, 'hold'),
      K(3.4, {}, 'out')
    ]
  },
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.5, { UpArmR: [-150, -8, -6], LoArmR: [-40, 0, 0], HandR: [-20, -90, 0], UpArmL: [-20, 12, 10], LoArmL: [-50, 0, 4], Chest: [-8, -4, 0], Spine: [-5, -2, 0], Head: [-10, 0, 0], Hips_pos: [0, -0.03, 0] }, 'out'),
      K(1.5, { UpArmR: [-146, -8, -6], LoArmR: [-44, 0, 0], Head: [-6, 8, 0] }),
      K(2.2, { UpArmR: [-40, -10, -8], LoArmR: [-60, 0, -2], UpArmL: [-24, 12, 10], Head: [2, -6, 0], Chest: [2, -8, 0], Spine: [2, -5, 0] }),
      K(3.0, { Head: [0, -12, 0] })
    ]
  }
};
