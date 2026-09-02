// ===========================================================================
// TAKUMA INO — FOUR SETS IN ONE FILE, and they are supposed to barely look
// like the same person moving.
// ===========================================================================
// The naming contract is Panda's, because it is the one the clip resolver
// already understands: a stance declares a `clipSuffix` and `Fighter._clip`
// appends it, so `idle` + 'Kai' is `idleKai`. A clip that does not exist for a
// suffix falls through to the base name, which is how the two stances that do
// not need their own version of something share one.
//
//   (none)  MASK OFF. The base set. See the note on it below — it is the most
//           important set in the file and it is the one nobody designs.
//   Kai     獬豸 KAICHI — squared, patient, hands high. A boxer's guard.
//   Rei     霊亀 REIKI  — low, loose, sliding. Nothing is planted.
//   Kir     麒麟 KIRIN  — forward, heavy, no guard at all. He is walking into it.
//
// ---------------------------------------------------------------------------
// THE DIAL EACH SET SITS AT, stated so a lineup can be checked against it
// ---------------------------------------------------------------------------
//                      MASK OFF   KAICHI    REIKI     KIRIN
//   idle duration      3.4 s      3.0 s     2.4 s     3.8 s
//   hands              in pockets high      low/wide  down
//   hips height        -0.030     -0.050    -0.085    -0.070
//   forward lean       0°         4°        10°       16°
//   jab wind-up        —          5 f       3 f       7 f
//   feet               together   squared   staggered planted wide
//   what it says       "oh no"    "come on" "catch me" "hit me"
//
// The largest gap in the project between two sets on the same body: Reiki's
// idle is 2.4 s of continuous motion with nothing ever settling, and Kirin's
// is 3.8 s in which his feet do not move at all.
//
// ---------------------------------------------------------------------------
// *** THE MASK SWAP IS THE SIGNATURE MOMENT AND IT IS AUTHORED AS ONE. ***
// ---------------------------------------------------------------------------
// `maskSwap` is 30 frames and it is built as a real physical action in four
// beats: he reaches up with BOTH hands, gets the hem, PULLS IT DOWN over his
// face — the beat the whole clip is for, held two frames longer than the
// motion needs — and then his hands come away and the new stance's posture
// arrives underneath. The model's `setMask` is driven off the clip's own
// progress by combat/beasts.js, so the knit is genuinely travelling down his
// face while his hands are on it.
//
// `maskOff` is its opposite and it is the ugliest clip in the file on purpose:
// the hat is torn off him, his hands go up too late, and he is left standing
// with his arms half-raised doing nothing.
// ---------------------------------------------------------------------------
const K = (t, pose, e) => ({ t, pose, e });

// ---- BASE STANCE: MASK OFF -------------------------------------------------
// HANDS IN POCKETS, feet close, weight even, shoulders slightly hunched. It is
// the design sheet's own pose and it is also, mechanically, the correct read:
// with the mask off he has no technique and nothing to do, and the neutral
// should say so. This is what the opponent sees when they have earned the
// punish window.
export const INO_STANCE = {
  Hips_pos: [0, -0.030, 0],
  Hips: [0, 20, 0], Spine: [3, -5, 0], Chest: [4, -8, 0], Neck: [1, -3, 0], Head: [3, -6, 0],
  ClavL: [0, 0, -3], UpArmL: [-6, 14, 6], LoArmL: [-58, 34, 0], HandL: [-10, 34, 0],
  ClavR: [0, 0, -3], UpArmR: [-4, -12, -5], LoArmR: [-60, -32, 0], HandR: [-10, -34, 0],
  ThighL: [-6, -3, 0], ShinL: [6, 0, 0], FootL: [2, -8, 0],
  ThighR: [4, 4, 0], ShinR: [8, 0, 0], FootR: [3, 7, 0]
};

const S = INO_STANCE;

export const INO_CLIPS = {
  // =========================================================================
  // MASK OFF — the base set
  // =========================================================================
  // Slow, small, and slightly apologetic. He rocks, he glances at where his
  // hat went, and there is nothing in the pose that threatens anybody.
  idle: {
    dur: 3.4, loop: true, keys: [
      K(0, {}),
      K(1.1, { Chest: [5, -8, 0], Hips_pos: [0, -0.042, 0], Head: [4, -5, 0], UpArmL: [-8, 14, 8], UpArmR: [-6, -12, -7] }),
      K(2.0, { Neck: [2, 8, 0], Head: [6, 14, 0], Chest: [5, -12, 0], Hips_pos: [0, -0.034, 0] }, 'out'),
      K(2.7, { Head: [3, -2, 0], Neck: [1, 0, 0], Chest: [4, -8, 0] }),
      K(3.4, {})
    ]
  },
  walk: {
    dur: 0.92, loop: true, keys: [
      K(0, { ThighL: [-26, -3, 0], ShinL: [11, 0, 0], FootL: [-6, -8, 0], ThighR: [19, 4, 0], ShinR: [26, 0, 0], FootR: [12, 7, 0], Hips_pos: [0, -0.042, 0], UpArmL: [-8, 14, 7], UpArmR: [-8, -12, -6] }),
      K(0.23, { ThighL: [-4, -3, 0], ShinL: [19, 0, 0], ThighR: [3, 4, 0], ShinR: [13, 0, 0], Hips_pos: [0, -0.020, 0] }),
      K(0.46, { ThighL: [19, -3, 0], ShinL: [24, 0, 0], FootL: [10, -8, 0], ThighR: [-25, 4, 0], ShinR: [12, 0, 0], FootR: [-6, 7, 0], Hips_pos: [0, -0.042, 0], UpArmL: [-6, 14, 7], UpArmR: [-10, -12, -6] }),
      K(0.69, { ThighL: [2, -3, 0], ShinL: [15, 0, 0], ThighR: [-6, 4, 0], ShinR: [20, 0, 0], Hips_pos: [0, -0.020, 0] }),
      K(0.92, { ThighL: [-26, -3, 0], ShinL: [11, 0, 0], FootL: [-6, -8, 0], ThighR: [19, 4, 0], ShinR: [26, 0, 0], FootR: [12, 7, 0], Hips_pos: [0, -0.042, 0], UpArmL: [-8, 14, 7], UpArmR: [-8, -12, -6] })
    ]
  },

  // =========================================================================
  // 獬豸 KAICHI — squared, patient, hands high
  // =========================================================================
  // A textbook guard. Feet square, both hands up at cheek height, chin tucked,
  // elbows in. He is the only one of the three who looks like he has been
  // taught to fight, and it is the stance where he is content to wait — which
  // is exactly right for the beast whose technique arrives from fifteen metres
  // away.
  idleKai: {
    dur: 3.0, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.050, 0], Hips: [0, 24, 0], Spine: [4, -6, 0], Chest: [4, -10, 0], Head: [5, -8, 0],
        UpArmL: [-52, 20, 14], LoArmL: [-104, 32, 0], HandL: [-12, 78, 0],
        UpArmR: [-48, -16, -12], LoArmR: [-106, -30, 0], HandR: [-12, -78, 0],
        ThighL: [-12, -4, 0], ShinL: [12, 0, 0], ThighR: [9, 5, 0], ShinR: [14, 0, 0]
      }),
      K(1.5, {
        Hips_pos: [0, -0.062, 0], Chest: [5, -11, 0], Head: [6, -8, 0],
        UpArmL: [-56, 20, 16], LoArmL: [-108, 33, 0],
        UpArmR: [-52, -16, -14], LoArmR: [-110, -31, 0]
      }),
      K(3.0, {
        Hips_pos: [0, -0.050, 0], Hips: [0, 24, 0], Spine: [4, -6, 0], Chest: [4, -10, 0], Head: [5, -8, 0],
        UpArmL: [-52, 20, 14], LoArmL: [-104, 32, 0], HandL: [-12, 78, 0],
        UpArmR: [-48, -16, -12], LoArmR: [-106, -30, 0], HandR: [-12, -78, 0],
        ThighL: [-12, -4, 0], ShinL: [12, 0, 0], ThighR: [9, 5, 0], ShinR: [14, 0, 0]
      })
    ]
  },
  walkKai: {
    dur: 0.88, loop: true, keys: [
      K(0, { ThighL: [-24, -4, 0], ShinL: [12, 0, 0], ThighR: [18, 5, 0], ShinR: [26, 0, 0], Hips_pos: [0, -0.056, 0], UpArmL: [-52, 20, 14], LoArmL: [-104, 32, 0], UpArmR: [-48, -16, -12], LoArmR: [-106, -30, 0], Chest: [4, -10, 0] }),
      K(0.22, { ThighL: [-4, -4, 0], ShinL: [18, 0, 0], ThighR: [3, 5, 0], ShinR: [13, 0, 0], Hips_pos: [0, -0.038, 0] }),
      K(0.44, { ThighL: [18, -4, 0], ShinL: [24, 0, 0], ThighR: [-23, 5, 0], ShinR: [12, 0, 0], Hips_pos: [0, -0.056, 0], UpArmL: [-50, 20, 14], UpArmR: [-50, -16, -12] }),
      K(0.66, { ThighL: [2, -4, 0], ShinL: [15, 0, 0], ThighR: [-5, 5, 0], ShinR: [19, 0, 0], Hips_pos: [0, -0.038, 0] }),
      K(0.88, { ThighL: [-24, -4, 0], ShinL: [12, 0, 0], ThighR: [18, 5, 0], ShinR: [26, 0, 0], Hips_pos: [0, -0.056, 0], UpArmL: [-52, 20, 14], UpArmR: [-48, -16, -12] })
    ]
  },
  punch1Kai: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.07, { UpArmL: [-56, 24, 16], LoArmL: [-110, 34, 0], Chest: [4, -20, 0], Hips: [0, 30, 0] }, 'in'),
      K(0.135, { UpArmL: [-84, -4, 4], LoArmL: [-8, 0, 0], HandL: [-6, 104, 0], Chest: [4, 12, 0], Hips: [0, 8, 0], Head: [4, -14, 0] }, 'snap'),
      K(0.19, { UpArmL: [-80, -4, 4], LoArmL: [-14, 0, 0], Chest: [4, 10, 0] }, 'hold'),
      K(0.36, {})
    ]
  },
  punch2Kai: {
    dur: 0.38, loop: false, keys: [
      K(0, {}),
      K(0.075, { UpArmR: [-52, -20, -14], LoArmR: [-112, -32, 0], Chest: [4, 6, 0], Hips: [0, 12, 0] }, 'in'),
      K(0.145, { UpArmR: [-82, 4, -4], LoArmR: [-8, 0, 0], HandR: [-6, -104, 0], Chest: [4, -24, 0], Hips: [0, 34, 0], Head: [4, 8, 0] }, 'snap'),
      K(0.20, { UpArmR: [-78, 4, -4], LoArmR: [-14, 0, 0], Chest: [4, -22, 0] }, 'hold'),
      K(0.38, {})
    ]
  },
  punch3Kai: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.10, { Hips_pos: [0, -0.095, 0], UpArmL: [-24, 22, 10], LoArmL: [-118, 34, 0], Chest: [8, -14, 0], ThighL: [-22, -4, 0], ShinL: [24, 0, 0] }, 'in'),
      K(0.185, { Hips_pos: [0, 0.020, 0], UpArmL: [-120, 4, 12], LoArmL: [-24, 0, 0], HandL: [-4, 20, 0], Chest: [-12, -4, 0], Spine: [-10, -6, 0], Head: [-14, -6, 0], ThighL: [-4, -4, 0], ShinL: [4, 0, 0] }, 'snap'),
      K(0.25, { Hips_pos: [0, 0.010, 0], UpArmL: [-114, 4, 12], Chest: [-10, -4, 0] }, 'hold'),
      K(0.46, {})
    ]
  },
  heavyKai: {
    dur: 0.78, loop: false, keys: [
      K(0, {}),
      K(0.22, { Hips: [0, 54, 0], Chest: [4, 26, 0], Hips_pos: [-0.04, -0.075, -0.05], UpArmR: [-20, -30, -30], LoArmR: [-100, -34, 0], ThighR: [14, 5, 0], ShinR: [22, 0, 0] }, 'in'),
      K(0.36, { Hips: [0, -30, 0], Chest: [4, -28, 0], Hips_pos: [0.04, -0.048, 0.06], UpArmR: [-88, 14, -8], LoArmR: [-10, 0, 0], HandR: [-4, -100, 0], ThighR: [-16, 5, 0], ShinR: [12, 0, 0] }, 'snap'),
      K(0.44, { Hips: [0, -34, 0], Chest: [4, -30, 0] }, 'hold'),
      K(0.78, {})
    ]
  },
  // CT1 — he points, and the beast's horn goes. His own body barely moves,
  // which is the read that the technique is not his.
  ct1Kai: {
    dur: 0.60, loop: false, keys: [
      K(0, {}),
      K(0.13, { UpArmL: [-70, 26, 18], LoArmL: [-96, 36, 0], Chest: [4, -14, 0], Head: [4, -10, 0] }, 'in'),
      K(0.24, { UpArmL: [-92, -2, 8], LoArmL: [-10, 4, 0], HandL: [-4, 40, 0], Chest: [4, 6, 0], Head: [4, -4, 0], Hips_pos: [0, -0.062, 0] }, 'snap'),
      K(0.42, { UpArmL: [-90, -2, 8], LoArmL: [-14, 4, 0] }, 'hold'),
      K(0.60, {})
    ]
  },
  // CT2 — THE JUDGEMENT HORN. 34 frames of him standing perfectly still with
  // both arms out and down while the beast winds up behind him. The stillness
  // IS the telegraph, and it is the longest static hold in his set.
  ct2Kai: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        Hips_pos: [0, -0.078, 0], Spine: [8, -6, 0], Chest: [8, -10, 0], Head: [2, -8, 0],
        UpArmL: [-16, 30, 34], LoArmL: [-40, 30, 0], HandL: [-8, 20, 0],
        UpArmR: [-14, -26, -32], LoArmR: [-38, -28, 0], HandR: [-8, -20, 0],
        ThighL: [-18, -4, 0], ShinL: [18, 0, 0], ThighR: [-8, 5, 0], ShinR: [16, 0, 0]
      }, 'in'),
      // the hold. Nothing at all for a third of a second.
      K(0.58, {
        Hips_pos: [0, -0.080, 0], Spine: [8, -6, 0], Chest: [8, -10, 0], Head: [2, -8, 0],
        UpArmL: [-16, 30, 34], UpArmR: [-14, -26, -32],
        ThighL: [-18, -4, 0], ShinL: [18, 0, 0]
      }, 'hold'),
      // the release: everything snaps forward at once
      K(0.68, {
        Hips_pos: [0, -0.020, 0], Spine: [-12, -6, 0], Chest: [-10, -10, 0], Head: [-12, -8, 0],
        UpArmL: [-104, 6, 22], LoArmL: [-12, 6, 0], UpArmR: [-102, -4, -20], LoArmR: [-10, -6, 0],
        ThighL: [-6, -4, 0], ShinL: [6, 0, 0]
      }, 'snap'),
      K(0.82, { Spine: [-8, -6, 0], UpArmL: [-98, 6, 24], UpArmR: [-96, -4, -22] }, 'hold'),
      K(1.15, {})
    ]
  },

  // =========================================================================
  // 霊亀 REIKI — low, loose, and nothing is ever planted
  // =========================================================================
  // The shortest idle in his set (2.4 s) and the only one with NO STILL FRAME
  // in it: the hips are moving on every key, the feet shift, and the hands
  // swing loose and low. He is not guarding, he is keeping his balance on a
  // surface that is slippery — which is literally true, because he is standing
  // on his own water.
  idleRei: {
    dur: 2.4, loop: true, keys: [
      K(0, {
        Hips_pos: [-0.03, -0.085, 0], Hips: [0, 28, 0], Spine: [10, -6, 0], Chest: [8, -12, 0], Head: [6, -10, 0],
        UpArmL: [-20, 24, 22], LoArmL: [-64, 30, 0], HandL: [-6, 30, 0],
        UpArmR: [-16, -20, -20], LoArmR: [-58, -28, 0], HandR: [-6, -30, 0],
        ThighL: [-22, -6, 0], ShinL: [24, 0, 0], FootL: [4, -10, 0],
        ThighR: [16, 8, 0], ShinR: [26, 0, 0], FootR: [8, 9, 0]
      }),
      K(0.6, {
        Hips_pos: [0.03, -0.070, 0.02], Hips: [0, 18, 0], Chest: [8, -6, 0],
        UpArmL: [-14, 24, 18], UpArmR: [-22, -20, -24], Head: [6, -4, 0],
        ThighL: [-12, -6, 0], ShinL: [16, 0, 0], ThighR: [22, 8, 0], ShinR: [32, 0, 0]
      }, 'out'),
      K(1.2, {
        Hips_pos: [0.03, -0.092, -0.02], Hips: [0, 34, 0], Chest: [9, -16, 0],
        UpArmL: [-24, 24, 26], UpArmR: [-12, -20, -16], Head: [7, -14, 0],
        ThighL: [-26, -6, 0], ShinL: [28, 0, 0], ThighR: [12, 8, 0], ShinR: [20, 0, 0]
      }, 'out'),
      K(1.8, {
        Hips_pos: [-0.03, -0.072, 0.02], Hips: [0, 22, 0], Chest: [8, -9, 0],
        UpArmL: [-18, 24, 20], UpArmR: [-20, -20, -22], Head: [6, -7, 0],
        ThighL: [-16, -6, 0], ShinL: [19, 0, 0], ThighR: [19, 8, 0], ShinR: [28, 0, 0]
      }, 'out'),
      K(2.4, {
        Hips_pos: [-0.03, -0.085, 0], Hips: [0, 28, 0], Spine: [10, -6, 0], Chest: [8, -12, 0], Head: [6, -10, 0],
        UpArmL: [-20, 24, 22], LoArmL: [-64, 30, 0], UpArmR: [-16, -20, -20], LoArmR: [-58, -28, 0],
        ThighL: [-22, -6, 0], ShinL: [24, 0, 0], ThighR: [16, 8, 0], ShinR: [26, 0, 0]
      })
    ]
  },
  // RUN — a GLIDE, and it is the only locomotion clip in the project where the
  // feet do not alternate: they stay staggered and the whole body leans and
  // sways while the ground goes past. He is skating.
  runRei: {
    dur: 0.62, loop: true, keys: [
      K(0, {
        Spine: [22, -6, 0], Chest: [14, -10, 0], Head: [-4, -8, 0], Hips: [0, 20, 0], Hips_pos: [-0.05, -0.100, 0],
        ThighL: [-40, -8, 0], ShinL: [22, 0, 0], FootL: [-4, -12, 0],
        ThighR: [26, 10, 0], ShinR: [30, 0, 0], FootR: [10, 12, 0],
        UpArmL: [-30, 26, 34], LoArmL: [-56, 26, 0], UpArmR: [-26, -22, -32], LoArmR: [-52, -24, 0]
      }),
      K(0.31, {
        Spine: [22, -6, 0], Chest: [14, -10, 0], Head: [-4, -8, 0], Hips: [0, 32, 0], Hips_pos: [0.05, -0.088, 0],
        ThighL: [-32, -8, 0], ShinL: [18, 0, 0], ThighR: [20, 10, 0], ShinR: [26, 0, 0],
        UpArmL: [-22, 26, 28], UpArmR: [-34, -22, -38]
      }, 'out'),
      K(0.62, {
        Spine: [22, -6, 0], Chest: [14, -10, 0], Hips: [0, 20, 0], Hips_pos: [-0.05, -0.100, 0],
        ThighL: [-40, -8, 0], ShinL: [22, 0, 0], ThighR: [26, 10, 0], ShinR: [30, 0, 0],
        UpArmL: [-30, 26, 34], UpArmR: [-26, -22, -32]
      })
    ]
  },
  walkRei: {
    dur: 0.72, loop: true, keys: [
      K(0, { Hips_pos: [-0.03, -0.088, 0], Hips: [0, 26, 0], Spine: [10, -6, 0], ThighL: [-24, -6, 0], ShinL: [16, 0, 0], ThighR: [16, 8, 0], ShinR: [24, 0, 0], UpArmL: [-22, 24, 22], UpArmR: [-16, -20, -20] }),
      K(0.36, { Hips_pos: [0.03, -0.088, 0], Hips: [0, 30, 0], Spine: [10, -6, 0], ThighL: [16, -6, 0], ShinL: [24, 0, 0], ThighR: [-24, 8, 0], ShinR: [16, 0, 0], UpArmL: [-16, 24, 18], UpArmR: [-22, -20, -24] }, 'out'),
      K(0.72, { Hips_pos: [-0.03, -0.088, 0], Hips: [0, 26, 0], ThighL: [-24, -6, 0], ShinL: [16, 0, 0], ThighR: [16, 8, 0], ShinR: [24, 0, 0], UpArmL: [-22, 24, 22], UpArmR: [-16, -20, -20] })
    ]
  },
  dashRei: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.06, { Spine: [30, -6, 0], Chest: [18, -10, 0], Hips_pos: [-0.04, -0.150, 0], ThighL: [-52, -8, 0], ShinL: [30, 0, 0], ThighR: [30, 10, 0], ShinR: [52, 0, 0], UpArmL: [10, 28, 40], UpArmR: [14, -24, -42] }, 'out'),
      K(0.30, { Spine: [24, -6, 0], Hips_pos: [0, -0.110, 0], ThighL: [-38, -8, 0], ShinL: [24, 0, 0], ThighR: [22, 10, 0], ShinR: [40, 0, 0], UpArmL: [-4, 26, 32], UpArmR: [0, -22, -34] })
    ]
  },
  punch1Rei: {
    dur: 0.28, loop: false, keys: [
      K(0, {}),
      K(0.05, { UpArmL: [-24, 28, 24], LoArmL: [-72, 32, 0], Hips: [0, 34, 0] }, 'in'),
      K(0.105, { UpArmL: [-70, -6, 14], LoArmL: [-10, 2, 0], HandL: [-4, 96, 0], Hips: [0, 12, 0], Chest: [8, 10, 0] }, 'snap'),
      K(0.16, { UpArmL: [-64, -4, 14], LoArmL: [-18, 2, 0] }, 'hold'),
      K(0.28, {})
    ]
  },
  punch2Rei: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.055, { UpArmR: [-20, -24, -22], LoArmR: [-70, -30, 0], Hips: [0, 14, 0] }, 'in'),
      K(0.115, { UpArmR: [-68, 6, -12], LoArmR: [-10, -2, 0], HandR: [-4, -96, 0], Hips: [0, 36, 0], Chest: [8, -22, 0] }, 'snap'),
      K(0.17, { UpArmR: [-62, 4, -12], LoArmR: [-18, -2, 0] }, 'hold'),
      K(0.30, {})
    ]
  },
  punch3Rei: {
    dur: 0.38, loop: false, keys: [
      K(0, {}),
      K(0.075, { Hips_pos: [-0.03, -0.135, 0], Chest: [16, -12, 0], UpArmL: [-6, 26, 12], LoArmL: [-104, 30, 0], ThighL: [-30, -6, 0], ShinL: [32, 0, 0] }, 'in'),
      K(0.145, { Hips_pos: [0.02, 0.000, 0], Chest: [-10, -8, 0], Spine: [-6, -6, 0], Head: [-12, -8, 0], UpArmL: [-116, 6, 18], LoArmL: [-20, 4, 0], ThighL: [-6, -6, 0], ShinL: [6, 0, 0] }, 'snap'),
      K(0.20, { UpArmL: [-110, 6, 18], Chest: [-8, -8, 0] }, 'hold'),
      K(0.38, {})
    ]
  },
  heavyRei: {
    dur: 0.68, loop: false, keys: [
      K(0, {}),
      K(0.18, { Hips: [0, 46, 0], Hips_pos: [-0.06, -0.115, -0.04], Chest: [12, 22, 0], UpArmL: [-12, 32, 26], LoArmL: [-88, 34, 0], ThighL: [-30, -6, 0], ShinL: [30, 0, 0] }, 'in'),
      K(0.30, { Hips: [0, -26, 0], Hips_pos: [0.06, -0.070, 0.10], Chest: [10, -26, 0], UpArmL: [-56, 0, 40], LoArmL: [-30, 8, 0], ThighL: [8, -6, 0], ShinL: [14, 0, 0] }, 'snap'),
      K(0.38, { Hips: [0, -30, 0], Hips_pos: [0.07, -0.076, 0.11] }, 'hold'),
      K(0.68, {})
    ]
  },
  // CT1 — THE GLIDE. He drops into a crouch and travels, one shoulder leading,
  // the trailing hand skimming the floor. It is the lowest pose in his set.
  ct1Rei: {
    dur: 0.65, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        Hips_pos: [0, -0.170, -0.04], Spine: [34, -6, 0], Chest: [20, -12, 0], Head: [-10, -8, 0],
        UpArmL: [-34, 30, 30], LoArmL: [-46, 24, 0],
        UpArmR: [30, -20, -30], LoArmR: [-30, -20, 0], HandR: [-10, -20, 0],
        ThighL: [-58, -8, 0], ShinL: [50, 0, 0], ThighR: [-20, 10, 0], ShinR: [46, 0, 0]
      }, 'out'),
      K(0.34, {
        Hips_pos: [0.02, -0.180, 0.06], Spine: [36, -6, 0], Chest: [22, -14, 0], Head: [-12, -8, 0],
        UpArmL: [-70, 22, 22], LoArmL: [-14, 8, 0],
        UpArmR: [36, -20, -32], LoArmR: [-24, -20, 0],
        ThighL: [-54, -8, 0], ShinL: [44, 0, 0], ThighR: [-14, 10, 0], ShinR: [40, 0, 0]
      }, 'hold'),
      K(0.65, {})
    ]
  },
  // CT2 — THE SHELL. He plants, crosses both arms and drops his head, and the
  // turtle brings the water up around him. A pure defensive pose, held.
  ct2Rei: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.11, {
        Hips_pos: [0, -0.120, 0], Spine: [16, -6, 0], Chest: [14, -10, 0], Neck: [8, -3, 0], Head: [18, -8, 0],
        ClavL: [0, 0, 12], ClavR: [0, 0, -12],
        UpArmL: [-70, 34, 30], LoArmL: [-124, 44, 0], HandL: [-12, 60, 0],
        UpArmR: [-68, -30, -28], LoArmR: [-126, -42, 0], HandR: [-12, -60, 0],
        ThighL: [-26, -6, 0], ShinL: [28, 0, 0], ThighR: [-14, 8, 0], ShinR: [26, 0, 0]
      }, 'out'),
      K(0.50, {
        Hips_pos: [0, -0.124, 0], Head: [18, -8, 0],
        UpArmL: [-70, 34, 30], LoArmL: [-124, 44, 0], UpArmR: [-68, -30, -28], LoArmR: [-126, -42, 0],
        ThighL: [-26, -6, 0], ShinL: [28, 0, 0]
      }, 'hold'),
      K(0.72, {})
    ]
  },
  blockRei: {
    dur: 0.14, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        UpArmL: [-84, 30, 22], LoArmL: [-120, 36, 0], UpArmR: [-80, -26, -20], LoArmR: [-122, -34, 0],
        Chest: [12, -12, 0], Head: [12, -10, 0], Hips_pos: [-0.02, -0.110, 0],
        ThighL: [-26, -6, 0], ShinL: [26, 0, 0]
      }, 'out'),
      K(0.14, { UpArmL: [-84, 30, 22], UpArmR: [-80, -26, -20], Hips_pos: [-0.02, -0.110, 0] })
    ]
  },

  // =========================================================================
  // 麒麟 KIRIN — forward, heavy, and there is no guard in it at all
  // =========================================================================
  // 3.8 s and HIS FEET DO NOT MOVE ONCE. The only motion is a slow, deep
  // breath and a very slight sway of the shoulders. Both arms hang. He is
  // leaning 16° forward with his chin up and his hands down, which is the pose
  // of somebody who has decided that being hit does not matter — and it does
  // not, because the beast has switched his pain off.
  //
  // It is the exact opposite of the base MASK OFF idle in every axis, which is
  // the point: those two are the poses the opponent has to tell apart
  // instantly, because one of them is a free punish and the other is a trap.
  idleKir: {
    dur: 3.8, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.070, 0.03], Hips: [4, 16, 0], Spine: [16, -5, 0], Chest: [10, -8, 0], Neck: [-6, -3, 0], Head: [-10, -6, 0],
        UpArmL: [6, 16, 14], LoArmL: [-26, 20, 0], HandL: [-6, 22, 0],
        UpArmR: [8, -14, -13], LoArmR: [-22, -18, 0], HandR: [-6, -22, 0],
        ThighL: [-14, -8, 0], ShinL: [12, 0, 0], FootL: [2, -12, 0],
        ThighR: [10, 10, 0], ShinR: [14, 0, 0], FootR: [4, 11, 0]
      }),
      K(1.9, {
        Hips_pos: [0, -0.056, 0.03], Spine: [18, -5, 0], Chest: [12, -10, 0], Head: [-12, -6, 0],
        ClavL: [0, 0, 5], ClavR: [0, 0, -5],
        UpArmL: [2, 16, 18], UpArmR: [4, -14, -17],
        ThighL: [-14, -8, 0], ShinL: [12, 0, 0], ThighR: [10, 10, 0], ShinR: [14, 0, 0]
      }, 'out'),
      K(3.8, {
        Hips_pos: [0, -0.070, 0.03], Hips: [4, 16, 0], Spine: [16, -5, 0], Chest: [10, -8, 0], Head: [-10, -6, 0],
        UpArmL: [6, 16, 14], LoArmL: [-26, 20, 0], UpArmR: [8, -14, -13], LoArmR: [-22, -18, 0],
        ThighL: [-14, -8, 0], ShinL: [12, 0, 0], ThighR: [10, 10, 0], ShinR: [14, 0, 0]
      })
    ]
  },
  walkKir: {
    dur: 1.18, loop: true, keys: [
      K(0, { ThighL: [-26, -8, 0], ShinL: [10, 0, 0], FootL: [-6, -12, 0], ThighR: [20, 10, 0], ShinR: [28, 0, 0], FootR: [12, 11, 0], Hips_pos: [0, -0.082, 0.03], Spine: [16, -5, 0], UpArmL: [6, 16, 14], UpArmR: [8, -14, -13], Head: [-10, -6, 0] }),
      K(0.295, { ThighL: [-4, -8, 0], ShinL: [20, 0, 0], ThighR: [4, 10, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.052, 0.03] }),
      K(0.59, { ThighL: [20, -8, 0], ShinL: [26, 0, 0], FootL: [10, -12, 0], ThighR: [-25, 10, 0], ShinR: [12, 0, 0], FootR: [-6, 11, 0], Hips_pos: [0, -0.082, 0.03], Spine: [16, -5, 0], UpArmL: [10, 16, 14], UpArmR: [4, -14, -13] }),
      K(0.885, { ThighL: [3, -8, 0], ShinL: [16, 0, 0], ThighR: [-6, 10, 0], ShinR: [21, 0, 0], Hips_pos: [0, -0.052, 0.03] }),
      K(1.18, { ThighL: [-26, -8, 0], ShinL: [10, 0, 0], ThighR: [20, 10, 0], ShinR: [28, 0, 0], Hips_pos: [0, -0.082, 0.03], UpArmL: [6, 16, 14], UpArmR: [8, -14, -13] })
    ]
  },
  punch1Kir: {
    dur: 0.52, loop: false, keys: [
      K(0, {}),
      K(0.11, { UpArmR: [26, -22, -26], LoArmR: [-58, -30, 0], Chest: [10, 16, 0], Hips: [4, 34, 0], Hips_pos: [0, -0.095, 0.03] }, 'in'),
      K(0.19, { UpArmR: [-74, 8, -8], LoArmR: [-8, -2, 0], HandR: [-4, -100, 0], Chest: [10, -24, 0], Hips: [4, -6, 0], Head: [-8, 8, 0], Hips_pos: [0, -0.060, 0.08] }, 'snap'),
      K(0.27, { UpArmR: [-70, 8, -8], Chest: [10, -22, 0] }, 'hold'),
      K(0.52, {})
    ]
  },
  punch2Kir: {
    dur: 0.55, loop: false, keys: [
      K(0, {}),
      K(0.115, { UpArmL: [24, 24, 28], LoArmL: [-62, 32, 0], Chest: [10, -20, 0], Hips: [4, -6, 0], Hips_pos: [0, -0.095, 0.03] }, 'in'),
      K(0.20, { UpArmL: [-76, -6, 10], LoArmL: [-8, 2, 0], HandL: [-4, 100, 0], Chest: [10, 20, 0], Hips: [4, 36, 0], Head: [-8, -12, 0], Hips_pos: [0, -0.060, 0.08] }, 'snap'),
      K(0.28, { UpArmL: [-72, -6, 10], Chest: [10, 18, 0] }, 'hold'),
      K(0.55, {})
    ]
  },
  punch3Kir: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.15, {
        Hips_pos: [0, -0.150, 0], Spine: [30, -5, 0], Chest: [20, -8, 0], Head: [10, -6, 0],
        UpArmL: [34, 22, 12], LoArmL: [-40, 26, 0], UpArmR: [36, -20, -11], LoArmR: [-38, -24, 0],
        ThighL: [-34, -8, 0], ShinL: [38, 0, 0], ThighR: [-20, 10, 0], ShinR: [36, 0, 0]
      }, 'in'),
      K(0.25, {
        Hips_pos: [0, 0.055, 0.06], Spine: [-22, -5, 0], Chest: [-18, -8, 0], Neck: [-10, -3, 0], Head: [-26, -6, 0],
        UpArmL: [-150, -2, 26], LoArmL: [-10, 6, 0], UpArmR: [-152, 0, -24], LoArmR: [-8, -6, 0],
        ThighL: [-6, -8, 0], ShinL: [6, 0, 0], ThighR: [8, 10, 0], ShinR: [8, 0, 0]
      }, 'snap'),
      K(0.35, { Hips_pos: [0, 0.030, 0.05], UpArmL: [-144, -2, 28], UpArmR: [-146, 0, -26] }, 'hold'),
      K(0.72, {})
    ]
  },
  heavyKir: {
    dur: 0.96, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        Hips: [4, 62, 0], Spine: [22, 26, 0], Chest: [14, 30, 0], Head: [-6, -22, 0],
        Hips_pos: [-0.06, -0.135, -0.04],
        UpArmR: [40, -30, -36], LoArmR: [-48, -34, 0], UpArmL: [-20, 26, 20], LoArmL: [-56, 30, 0],
        ThighR: [18, 10, 0], ShinR: [28, 0, 0], ThighL: [-26, -8, 0], ShinL: [22, 0, 0]
      }, 'in'),
      K(0.44, {
        Hips: [4, -34, 0], Spine: [18, -24, 0], Chest: [10, -30, 0], Head: [-8, 20, 0],
        Hips_pos: [0.06, -0.086, 0.10],
        UpArmR: [-92, 20, -12], LoArmR: [-8, -4, 0], HandR: [-4, -104, 0], UpArmL: [16, 20, 30], LoArmL: [-38, 22, 0],
        ThighR: [-20, 10, 0], ShinR: [14, 0, 0], ThighL: [12, -8, 0], ShinL: [16, 0, 0]
      }, 'snap'),
      K(0.54, { Hips: [4, -40, 0], Chest: [10, -34, 0], Hips_pos: [0.07, -0.100, 0.11] }, 'hold'),
      K(0.96, {})
    ]
  },
  // CT1 — HORN RUSH. Head down, one shoulder leading, and he does not stop.
  ct1Kir: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips_pos: [0, -0.130, -0.05], Spine: [30, -5, 0], Chest: [22, -8, 0], Neck: [10, -3, 0], Head: [16, -6, 0], ThighL: [-32, -8, 0], ShinL: [34, 0, 0], UpArmL: [22, 22, 8], UpArmR: [24, -20, -7] }, 'in'),
      K(0.28, { Hips_pos: [0, -0.100, 0.14], Spine: [34, -5, 0], Chest: [24, -8, 0], Head: [18, -6, 0], ThighL: [-16, -8, 0], ShinL: [18, 0, 0], ThighR: [-30, 10, 0], ShinR: [30, 0, 0], UpArmL: [32, 22, 6], UpArmR: [34, -20, -5] }, 'out'),
      K(0.56, { Hips_pos: [0, -0.104, 0.16], Spine: [34, -5, 0], Head: [18, -6, 0], ThighL: [-28, -8, 0], ShinL: [28, 0, 0], ThighR: [-14, 10, 0], ShinR: [20, 0, 0] }, 'hold'),
      K(0.85, {})
    ]
  },
  // CT2 — THE DOPING STRIKE. He takes the hit and swings anyway. The tell is
  // that he never guards: his arms come back and stay back through the whole
  // wind-up, deliberately leaving his chest open.
  ct2Kir: {
    dur: 1.05, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        Hips: [4, 56, 0], Spine: [12, 24, 0], Chest: [4, 30, 0], Neck: [-8, -3, 0], Head: [-16, -20, 0],
        Hips_pos: [-0.05, -0.100, -0.05],
        ClavL: [0, 0, -10], ClavR: [0, 0, 10],
        UpArmR: [54, -28, -30], LoArmR: [-30, -30, 0], UpArmL: [40, 24, 24], LoArmL: [-26, 26, 0],
        ThighR: [16, 10, 0], ShinR: [26, 0, 0]
      }, 'in'),
      // the hold — chest open, both arms back. This is the frame the opponent
      // is supposed to hit him in, and the frame he is counting on.
      K(0.38, {
        Hips: [4, 58, 0], Chest: [4, 32, 0], Head: [-18, -22, 0], Hips_pos: [-0.05, -0.104, -0.05],
        UpArmR: [58, -28, -32], UpArmL: [44, 24, 26]
      }, 'hold'),
      K(0.50, {
        Hips: [4, -36, 0], Spine: [16, -26, 0], Chest: [8, -32, 0], Head: [-10, 22, 0],
        Hips_pos: [0.06, -0.060, 0.14],
        UpArmR: [-100, 18, -10], LoArmR: [-6, -4, 0], HandR: [-2, -108, 0],
        UpArmL: [10, 22, 34], LoArmL: [-32, 22, 0],
        ThighR: [-24, 10, 0], ShinR: [12, 0, 0], ThighL: [14, -8, 0], ShinL: [16, 0, 0]
      }, 'snap'),
      K(0.62, { Hips: [4, -42, 0], Chest: [8, -36, 0], Hips_pos: [0.07, -0.070, 0.15] }, 'hold'),
      K(1.05, {})
    ]
  },
  blockKir: {
    dur: 0.22, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        UpArmL: [-46, 22, 18], LoArmL: [-96, 30, 0], UpArmR: [-42, -18, -16], LoArmR: [-98, -28, 0],
        Chest: [14, -8, 0], Head: [-4, -6, 0], Hips_pos: [0, -0.080, 0.03], Spine: [18, -5, 0]
      }, 'out'),
      K(0.22, { UpArmL: [-46, 22, 18], UpArmR: [-42, -18, -16], Hips_pos: [0, -0.080, 0.03] })
    ]
  },

  // =========================================================================
  // THE MASK
  // =========================================================================
  // *** THE SIGNATURE MOMENT. *** 30 frames (0.50 s), four beats:
  //   0.00-0.12  BOTH HANDS GO UP. Elbows out, wrists high, and he takes hold
  //              of the rolled hem with his fingertips.
  //   0.12-0.28  THE PULL. Hands travel straight down past his eyes to the
  //              chin. His head tips back very slightly, which is what a
  //              person actually does pulling a hat over their face.
  //   0.28-0.40  THE HOLD. Two frames longer than the motion needs, hands
  //              still at the chin, and this is where the model's `setMask`
  //              reaches 1 and the eye slot lights up.
  //   0.40-0.50  the hands drop away and the NEW stance's posture arrives
  //              underneath, which is why this clip ends at the base pose
  //              rather than at its own — the stance blend does the rest.
  maskSwap: {
    dur: 0.50, loop: false, keys: [
      K(0, {}),
      K(0.12, {
        ClavL: [0, 0, 14], ClavR: [0, 0, -14],
        UpArmL: [-142, 22, 30], LoArmL: [-56, 30, 0], HandL: [-20, 40, 0],
        UpArmR: [-140, -18, -28], LoArmR: [-54, -28, 0], HandR: [-20, -40, 0],
        Neck: [-4, -3, 0], Head: [-8, -6, 0], Chest: [-2, -8, 0], Hips_pos: [0, -0.020, 0]
      }, 'out'),
      K(0.28, {
        ClavL: [0, 0, 6], ClavR: [0, 0, -6],
        UpArmL: [-74, 26, 22], LoArmL: [-118, 40, 0], HandL: [-16, 56, 0],
        UpArmR: [-72, -22, -20], LoArmR: [-120, -38, 0], HandR: [-16, -56, 0],
        Neck: [-8, -3, 0], Head: [-16, -6, 0], Chest: [-4, -8, 0], Hips_pos: [0, -0.052, 0],
        ThighL: [-10, -3, 0], ShinL: [10, 0, 0]
      }, 'snap'),
      K(0.40, {
        UpArmL: [-70, 26, 20], LoArmL: [-116, 40, 0], UpArmR: [-68, -22, -18], LoArmR: [-118, -38, 0],
        Head: [-14, -6, 0], Neck: [-7, -3, 0], Hips_pos: [0, -0.056, 0]
      }, 'hold'),
      K(0.50, {})
    ]
  },

  // THE MASK COMING OFF. Deliberately the ugliest clip in the file: his head
  // is snapped sideways, his hands go up a beat TOO LATE and grab at nothing,
  // and he ends standing with his arms half-raised and his guard nowhere.
  // Everything about it should read as a mistake he is still catching up to.
  maskOff: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.07, {
        Neck: [-6, 26, 0], Head: [-14, 40, 0], Chest: [2, 18, 0], Spine: [2, 12, 0],
        Hips_pos: [0, -0.045, -0.03], Hips: [0, 30, 0]
      }, 'snap'),
      K(0.22, {
        ClavL: [0, 0, 10], ClavR: [0, 0, -10],
        UpArmL: [-118, 20, 26], LoArmL: [-70, 28, 0], HandL: [-16, 30, 0],
        UpArmR: [-114, -16, -24], LoArmR: [-68, -26, 0], HandR: [-16, -30, 0],
        Neck: [-2, 14, 0], Head: [-6, 22, 0], Chest: [4, 8, 0]
      }, 'out'),
      // grabbing at nothing
      K(0.36, {
        UpArmL: [-104, 18, 22], LoArmL: [-84, 26, 0], UpArmR: [-100, -14, -20], LoArmR: [-82, -24, 0],
        Neck: [0, 6, 0], Head: [0, 10, 0], Chest: [5, 2, 0]
      }, 'hold'),
      // and left standing there
      K(0.62, {
        UpArmL: [-46, 16, 14], LoArmL: [-78, 30, 0], UpArmR: [-44, -14, -13], LoArmR: [-76, -28, 0],
        Chest: [6, -8, 0], Head: [6, -6, 0], Hips_pos: [0, -0.038, 0]
      })
    ]
  },

  // The radial hold pose: both hands at the hem, waiting. It loops inside the
  // wheel's slow-motion.
  maskWheel: {
    dur: 0.8, loop: true, keys: [
      K(0, {
        ClavL: [0, 0, 12], ClavR: [0, 0, -12],
        UpArmL: [-136, 22, 28], LoArmL: [-60, 30, 0], HandL: [-18, 38, 0],
        UpArmR: [-134, -18, -26], LoArmR: [-58, -28, 0], HandR: [-18, -38, 0],
        Neck: [-3, -3, 0], Head: [-6, -6, 0], Hips_pos: [0, -0.026, 0]
      }),
      K(0.4, {
        UpArmL: [-140, 22, 30], LoArmL: [-56, 30, 0], UpArmR: [-138, -18, -28], LoArmR: [-54, -28, 0],
        Head: [-8, -6, 0], Hips_pos: [0, -0.034, 0]
      }),
      K(0.8, {
        UpArmL: [-136, 22, 28], LoArmL: [-60, 30, 0], UpArmR: [-134, -18, -26], LoArmR: [-58, -28, 0],
        Head: [-6, -6, 0], Hips_pos: [0, -0.026, 0]
      })
    ]
  },

  // ---- D-pad RIGHT · THE DRAGON -------------------------------------------
  // He pulls the mask ALL the way down — further than a swap, both hands
  // dragging it past the chin — and then his arms go out and up and he stands
  // with his head back while the dragon comes down over his shoulder. The pose
  // he holds is the only genuinely open, unguarded, arms-wide pose in his
  // entire set, and it is the one frame in the character where he looks like
  // somebody who is not afraid of anything.
  ult: {
    dur: 1.55, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        ClavL: [0, 0, 14], ClavR: [0, 0, -14],
        UpArmL: [-146, 22, 30], LoArmL: [-52, 30, 0], HandL: [-20, 42, 0],
        UpArmR: [-144, -18, -28], LoArmR: [-50, -28, 0], HandR: [-20, -42, 0],
        Head: [-10, -6, 0], Neck: [-5, -3, 0], Hips_pos: [0, -0.018, 0]
      }, 'out'),
      // the full pull, past the chin
      K(0.40, {
        ClavL: [0, 0, 2], ClavR: [0, 0, -2],
        UpArmL: [-42, 26, 18], LoArmL: [-118, 42, 0], HandL: [-14, 60, 0],
        UpArmR: [-40, -22, -16], LoArmR: [-120, -40, 0], HandR: [-14, -60, 0],
        Head: [-20, -6, 0], Neck: [-10, -3, 0], Chest: [-6, -8, 0],
        Hips_pos: [0, -0.088, 0], ThighL: [-16, -3, 0], ShinL: [16, 0, 0], ThighR: [-6, 4, 0], ShinR: [14, 0, 0]
      }, 'snap'),
      K(0.56, { Head: [-22, -6, 0], Hips_pos: [0, -0.092, 0] }, 'hold'),
      // and then everything opens
      K(0.86, {
        ClavL: [0, 0, 18], ClavR: [0, 0, -18],
        UpArmL: [-96, 14, 74], LoArmL: [-18, 12, 0], HandL: [-6, 24, 0],
        UpArmR: [-94, -10, -72], LoArmR: [-16, -10, 0], HandR: [-6, -24, 0],
        Spine: [-16, -5, 0], Chest: [-16, -8, 0], Neck: [-12, -3, 0], Head: [-30, -6, 0],
        Hips_pos: [0, 0.010, 0], ThighL: [-4, -3, 0], ShinL: [4, 0, 0], ThighR: [2, 4, 0], ShinR: [6, 0, 0]
      }, 'snap'),
      K(1.20, {
        UpArmL: [-92, 16, 70], UpArmR: [-90, -12, -68],
        Chest: [-14, -12, 0], Head: [-28, -8, 0], Hips_pos: [0, -0.004, 0]
      }, 'hold'),
      K(1.55, {
        UpArmL: [-58, 18, 34], LoArmL: [-46, 20, 0], UpArmR: [-56, -14, -32], LoArmR: [-44, -18, 0],
        Chest: [-4, -8, 0], Head: [-10, -6, 0], Hips_pos: [0, -0.030, 0]
      })
    ]
  },

  // ---- D-pad LEFT · THE TAUNT ---------------------------------------------
  // *** HE IS THE MOST EARNEST PERSON IN THE CAST AND THE TAUNT IS ABOUT
  // NANAMI. *** Canon: "whenever Ino finds himself in a tough situation, he
  // asks himself what would Nanami do", and he refuses to advance to grade 1
  // without Nanami's approval.
  //
  // So the taunt is: he pushes the mask UP off his mouth with one thumb — a
  // small, unheroic, practical gesture — says the line, and pulls it back
  // down. Nothing about it is aimed at the opponent, which is what makes it
  // his: every other taunt in this game is contempt and this one is a man
  // giving himself a pep talk in the middle of a fight.
  //
  // The beast reacts. See `tauntReact` in combat/beasts.js: whichever beast is
  // up turns its head to look at him on the line, which is the one moment in
  // the character where the creature acknowledges him.
  taunt: {
    dur: 3.20, loop: false, keys: [
      K(0, {}),
      // the thumb goes up and hooks the hem
      K(0.34, {
        UpArmR: [-96, -14, -22], LoArmR: [-108, -34, 0], HandR: [-14, -50, 0],
        Neck: [2, -3, 0], Head: [4, -6, 0], Chest: [2, -10, 0]
      }, 'out'),
      // pushes it up off the mouth, and holds
      K(0.62, {
        UpArmR: [-108, -12, -20], LoArmR: [-116, -36, 0], HandR: [-22, -54, 0],
        Head: [0, -6, 0], Neck: [-1, -3, 0], Hips_pos: [0, -0.038, 0]
      }, 'out'),
      // the line. He looks slightly DOWN and away while he says it, because it
      // is not addressed to the person he is fighting.
      K(1.05, { Neck: [6, 12, 0], Head: [10, 18, 0], Chest: [4, -14, 0] }, 'out'),
      K(1.70, { Neck: [6, 12, 0], Head: [10, 18, 0] }, 'hold'),
      // a small nod. He has convinced himself.
      K(1.95, { Neck: [10, 8, 0], Head: [16, 12, 0] }, 'snap'),
      K(2.15, { Neck: [2, 4, 0], Head: [2, 6, 0] }, 'out'),
      // and the mask comes back down
      K(2.55, {
        UpArmR: [-100, -14, -22], LoArmR: [-112, -34, 0], HandR: [-14, -50, 0],
        Neck: [-4, -3, 0], Head: [-8, -6, 0], Hips_pos: [0, -0.048, 0]
      }, 'out'),
      K(2.85, { UpArmR: [-40, -14, -12], LoArmR: [-70, -30, 0], Head: [2, -6, 0] }),
      K(3.20, {})
    ]
  },

  // KO — he goes down forward, one arm out to catch himself, and it does not
  // catch him. The mask stays on.
  ko: {
    dur: 1.05, loop: false, keys: [
      K(0, {}),
      K(0.12, {
        Hips_pos: [0, -0.030, -0.06], Spine: [-14, -5, 0], Chest: [-10, -8, 0], Head: [-16, -6, 0],
        UpArmL: [-90, 18, 34], UpArmR: [-88, -14, -32],
        ThighL: [-22, -3, 0], ShinL: [14, 0, 0]
      }, 'snap'),
      K(0.42, {
        Hips_pos: [0, -0.34, 0.16], Hips: [46, 18, 0], Spine: [26, -5, 0], Chest: [16, -8, 0], Head: [20, -6, 0],
        UpArmL: [-120, 14, 22], LoArmL: [-40, 14, 0],
        UpArmR: [-40, -20, -30], LoArmR: [-60, -22, 0],
        ThighL: [-44, -3, 0], ShinL: [46, 0, 0], ThighR: [-30, 4, 0], ShinR: [40, 0, 0]
      }),
      K(0.74, {
        Hips_pos: [0, -0.62, 0.34], Hips: [78, 16, 0], Spine: [16, -5, 0], Chest: [8, -8, 0], Head: [10, -6, 0],
        UpArmL: [-134, 10, 16], LoArmL: [-20, 8, 0],
        UpArmR: [-24, -22, -40], LoArmR: [-30, -18, 0],
        ThighL: [-48, -3, 0], ShinL: [56, 0, 0], ThighR: [-34, 4, 0], ShinR: [50, 0, 0]
      }, 'out'),
      K(1.05, {
        Hips_pos: [0, -0.66, 0.36], Hips: [82, 16, 0], Head: [8, -6, 0],
        UpArmL: [-136, 10, 14], UpArmR: [-20, -22, -42],
        ThighL: [-50, -3, 0], ShinL: [58, 0, 0], ThighR: [-36, 4, 0], ShinR: [52, 0, 0]
      })
    ]
  },

  // VICTORY — he pushes the mask up, breathes out hard, and puts both hands on
  // his knees for a second. He won and he is not pleased about it, he is
  // relieved, which is exactly who he is.
  victory: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      K(0.50, {
        UpArmR: [-104, -12, -20], LoArmR: [-114, -36, 0], HandR: [-20, -54, 0],
        Neck: [-2, -3, 0], Head: [-6, -6, 0], Chest: [2, -10, 0]
      }, 'out'),
      K(0.90, {
        UpArmR: [-30, -14, -12], LoArmR: [-64, -30, 0],
        Hips_pos: [0, -0.115, 0], Spine: [30, -5, 0], Chest: [20, -8, 0], Neck: [8, -3, 0], Head: [18, -6, 0],
        UpArmL: [12, 22, 12], LoArmL: [-56, 30, 0], HandL: [-14, 34, 0],
        ThighL: [-30, -3, 0], ShinL: [32, 0, 0], ThighR: [-18, 4, 0], ShinR: [30, 0, 0]
      }, 'out'),
      // two breaths, hands on knees
      K(1.45, { Spine: [34, -5, 0], Chest: [22, -8, 0], Hips_pos: [0, -0.128, 0] }),
      K(1.90, { Spine: [28, -5, 0], Chest: [18, -8, 0], Hips_pos: [0, -0.108, 0] }),
      K(2.40, {
        Hips_pos: [0, -0.038, 0], Spine: [4, -5, 0], Chest: [4, -8, 0], Neck: [1, -3, 0], Head: [3, -6, 0],
        UpArmL: [-8, 14, 8], LoArmL: [-58, 34, 0],
        ThighL: [-8, -3, 0], ShinL: [8, 0, 0], ThighR: [4, 4, 0], ShinR: [8, 0, 0]
      }, 'out'),
      K(3.2, {})
    ]
  }
};
