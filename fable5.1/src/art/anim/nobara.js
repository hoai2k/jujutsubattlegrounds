// NOBARA — snappy and theatrical. Everything she throws arrives faster than it
// left, every finish is a POSE, and every pose is held a beat longer than the
// move needs. Where Choso is economical and ends on a dead stop, she ends on a
// flourish and dares you to do something about it.
//
// The three rules the whole set is written to:
//   1. anticipation is SHORT and the strike is FAST — she has no long loads.
//   2. every committed move finishes in a shape you could screenshot.
//   3. she never straightens up. The hip stays cocked through everything.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — the hip is cocked hard onto her right leg, the left foot turned out
// and light, the hammer resting on the right shoulder and the left hand on the
// hip. Chin slightly up, head tipped. This is a posture that says the fight is
// already decided; the whole animation set is built off it and never leaves it.
export const NOBARA_STANCE = {
  Hips_pos: [0.018, -0.030, 0],
  Hips: [0, 22, -7], Spine: [2, -6, 5], Chest: [1, -9, 4], Neck: [0, -3, -3], Head: [-4, -7, -6],
  // Right arm: hammer SHOULDERED. Pass 3 had the elbow high and abducted 30
  // degrees, which held the hammer out in the air beside her like a torch —
  // the pose the whole character is built on has the head of the hammer
  // RESTING on her shoulder, so the elbow comes down and forward and the
  // forearm folds right up until the hand is at the collarbone.
  UpArmR: [-18, -20, -10], LoArmR: [-144, -12, 0], HandR: [-14, -62, 0],
  // left arm: hand on the hip, elbow flared
  UpArmL: [12, 26, 40], LoArmL: [-104, 40, 6], HandL: [-24, 72, 0],
  ThighL: [-6, -12, 4], ShinL: [16, 0, 0], FootL: [4, -22, 0],
  ThighR: [4, 4, -2], ShinR: [6, 0, 0], FootR: [3, 6, 0]
};

export const NOBARA_CLIPS = {
  // IDLE — a slow weight roll from hip to hip that never actually leaves the
  // right leg, plus the hammer settling on the shoulder. Twice the travel of
  // Choso's idle and half the duration.
  idle: {
    dur: 2.6, loop: true, keys: [
      K(0, {}),
      K(0.9, {
        Hips_pos: [0.022, -0.044, 0], Hips: [0, 24, -9], Chest: [2, -9, 5], Head: [-5, -6, -7],
        UpArmR: [-20, -20, -12], LoArmR: [-148, -12, 0], UpArmL: [13, 26, 42]
      }),
      K(1.7, {
        Hips_pos: [0.012, -0.022, 0], Hips: [0, 20, -5], Chest: [0, -9, 3], Head: [-3, -8, -5],
        UpArmR: [-16, -20, -8], LoArmR: [-140, -12, 0], UpArmL: [11, 26, 38]
      }),
      K(2.6, {})
    ]
  },

  // WALK — a light, quick, slightly bouncy cycle. Short strides, the shoulders
  // counter-rotating more than the roster norm, the hammer riding along.
  walk: {
    dur: 0.74, loop: true, keys: [
      K(0, { ThighL: [-28, -10, 2], ShinL: [14, 0, 0], FootL: [-8, -18, 0], ThighR: [22, 5, 0], ShinR: [28, 0, 0], FootR: [12, 6, 0], Hips_pos: [0.016, -0.036, 0], Hips: [0, 26, -6], Chest: [1, -13, 4], UpArmR: [-18, -20, -10], UpArmL: [10, 24, 38] }),
      K(0.185, { ThighL: [-5, -10, 2], ShinL: [22, 0, 0], ThighR: [3, 5, 0], ShinR: [14, 0, 0], Hips_pos: [0.016, -0.014, 0] }),
      K(0.37, { ThighL: [24, -10, 2], ShinL: [26, 0, 0], FootL: [12, -18, 0], ThighR: [-26, 5, 0], ShinR: [14, 0, 0], FootR: [-8, 6, 0], Hips_pos: [0.016, -0.036, 0], Hips: [0, 18, -8], Chest: [1, -5, 4], UpArmR: [-22, -20, -12], UpArmL: [14, 24, 42] }),
      K(0.555, { ThighL: [1, -10, 2], ShinL: [18, 0, 0], ThighR: [-6, 5, 0], ShinR: [22, 0, 0], Hips_pos: [0.016, -0.014, 0] }),
      K(0.74, { ThighL: [-28, -10, 2], ShinL: [14, 0, 0], FootL: [-8, -18, 0], ThighR: [22, 5, 0], ShinR: [28, 0, 0], FootR: [12, 6, 0], Hips_pos: [0.016, -0.036, 0], Hips: [0, 26, -6], Chest: [1, -13, 4], UpArmR: [-24, -34, -30], UpArmL: [10, 24, 38] })
    ]
  },

  // ---- THE HAMMER STRING --------------------------------------------------
  // Short reach and fast recovery: she is close enough to touch you and she
  // does not stay there. One-handed swings, the free hand counter-balancing.
  // 1: a flat swing off the shoulder, right to left.
  punch1: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.05, { UpArmR: [-20, -48, -34], LoArmR: [-138, -20, 0], Chest: [1, -22, 6], Hips: [0, 34, -8] }, 'in'),
      K(0.115, { UpArmR: [-62, 24, 6], LoArmR: [-46, 10, 0], HandR: [-16, -130, 0], Chest: [3, 16, 2], Hips: [0, 6, -5], Spine: [3, 8, 3], Head: [-2, -14, -4], UpArmL: [-18, 26, 34], LoArmL: [-86, 30, 6] }, 'snap'),
      K(0.175, { UpArmR: [-60, 24, 6], LoArmR: [-48, 10, 0], Chest: [3, 16, 2], Hips: [0, 6, -5] }, 'hold'),
      K(0.30, {}, 'out')
    ]
  },
  // 2: a backhand return, left to right, wrist rolling over.
  punch2: {
    dur: 0.32, loop: false, keys: [
      K(0, { UpArmR: [-56, 20, 4], LoArmR: [-52, 8, 0], Chest: [3, 12, 2] }),
      K(0.055, { UpArmR: [-70, 46, 22], LoArmR: [-70, 20, 0], Chest: [2, 24, 4], Hips: [0, -4, -4] }, 'in'),
      K(0.125, { UpArmR: [-58, -40, -22], LoArmR: [-38, -14, 0], HandR: [-14, -40, 0], Chest: [4, -22, 6], Hips: [0, 40, -9], Spine: [3, -12, 4], Head: [-3, 10, -6], UpArmL: [4, 24, 44], LoArmL: [-96, 36, 6] }, 'snap'),
      K(0.185, { UpArmR: [-56, -40, -22], LoArmR: [-40, -14, 0], Chest: [4, -22, 6], Hips: [0, 40, -9] }, 'hold'),
      K(0.32, {}, 'out')
    ]
  },
  // 3: BOTH hands on the haft and the hammer brought straight DOWN. This is
  // the knockdown ender, so it drops her weight through the floor and she
  // holds the finish with the head down, then flicks her chin up out of it.
  punch3: {
    dur: 0.58, loop: false, keys: [
      K(0, { UpArmR: [-52, -30, -18], LoArmR: [-46, -10, 0] }),
      K(0.11, { UpArmR: [-158, -14, -12], LoArmR: [-52, 0, -4], HandR: [-18, -60, 0], UpArmL: [-146, 20, 22], LoArmL: [-62, 0, 6], HandL: [-18, 60, 0], Chest: [-10, -12, 4], Spine: [-8, -8, 3], Hips: [0, 30, -6], Head: [-8, -8, -4], Hips_pos: [0.014, -0.020, 0] }, 'in'),
      K(0.20, { UpArmR: [-42, 6, -4], LoArmR: [-8, 0, 0], HandR: [-28, -140, 0], UpArmL: [-38, -4, 8], LoArmL: [-10, 0, 4], HandL: [-28, 140, 0], Chest: [24, 4, 2], Spine: [17, 3, 2], Hips: [6, 12, -3], Head: [16, -6, -2], Hips_pos: [0.010, -0.185, 0], ThighL: [-40, -10, 2], ShinL: [50, 0, 0], ThighR: [30, 5, 0], ShinR: [56, 0, 0] }, 'snap'),
      K(0.32, { UpArmR: [-40, 6, -4], LoArmR: [-10, 0, 0], UpArmL: [-36, -4, 8], Chest: [24, 4, 2], Head: [16, -6, -2], Hips_pos: [0.010, -0.185, 0] }, 'hold'),
      // the chin-flick out of it — the pose she actually wants you to see
      K(0.42, { Chest: [6, -6, 4], Spine: [4, -4, 3], Head: [-14, -8, -8], Hips_pos: [0.016, -0.080, 0], UpArmR: [-34, -18, -18], LoArmR: [-58, -8, 0], UpArmL: [-6, 14, 28], LoArmL: [-80, 22, 6] }, 'snap'),
      K(0.58, {}, 'out')
    ]
  },

  // HEAVY — THE FULL SWING: she winds the hammer all the way behind her head
  // and puts her whole body through it, and the follow-through carries her
  // shoulders round past square. Slowest thing she owns.
  heavy: {
    dur: 0.80, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmR: [-14, -70, -46], LoArmR: [-150, -24, 0], HandR: [-22, -50, 0], UpArmL: [-30, 34, 46], LoArmL: [-84, 28, 6], Chest: [-4, -40, 8], Spine: [-3, -22, 5], Hips: [0, 50, -10], Head: [-6, -20, -8], Hips_pos: [0.020, -0.056, 0], ThighL: [-22, -12, 4], ShinL: [24, 0, 0] }, 'in'),
      K(0.30, { UpArmR: [-74, 40, 20], LoArmR: [-30, 12, 0], HandR: [-20, -142, 0], UpArmL: [-16, 18, 30], LoArmL: [-74, 22, 6], Chest: [12, 36, -2], Spine: [8, 20, -1], Hips: [4, -14, -2], Head: [8, -24, -2], Hips_pos: [0.006, -0.150, 0], ThighL: [-36, -10, 2], ShinL: [44, 0, 0], ThighR: [28, 5, 0], ShinR: [52, 0, 0] }, 'snap'),
      K(0.42, { UpArmR: [-72, 40, 20], LoArmR: [-32, 12, 0], Chest: [12, 38, -2], Hips_pos: [0.006, -0.150, 0] }, 'hold'),
      K(0.80, {}, 'out')
    ]
  },

  // ---- CT1 — HAIRPIN 簪 ---------------------------------------------------
  // A pinch-throw: nail flicked from the left hand with a hard wrist snap, the
  // arm barely travelling. Fast in, fast out, and she is already looking at
  // where it is going to land before it gets there.
  ct1: {
    dur: 0.40, loop: false, keys: [
      K(0, {}),
      K(0.07, { UpArmL: [-30, 40, 24], LoArmL: [-118, 46, 6], HandL: [-46, 54, 0], Chest: [2, 16, 6], Hips: [0, 6, -6], Head: [-6, -2, -6] }, 'in'),
      K(0.145, { UpArmL: [-78, -6, 6], LoArmL: [-16, 0, 4], HandL: [-6, 106, 0], Chest: [4, -14, 4], Hips: [0, 32, -8], Spine: [4, -8, 4], Head: [-2, -18, -5] }, 'snap'),
      K(0.21, { UpArmL: [-76, -6, 6], LoArmL: [-18, 0, 4], HandL: [-6, 106, 0], Chest: [4, -14, 4] }, 'hold'),
      K(0.40, {}, 'out')
    ]
  },
  // THE DETONATION. No travel at all: she closes the left fist and the nails go
  // off wherever they are. One frame of motion and a two-beat hold on the
  // closed fist — the smallest, smuggest gesture in the game.
  detonate: {
    dur: 0.40, loop: false, keys: [
      K(0, {}),
      K(0.06, { UpArmL: [-44, 22, 30], LoArmL: [-92, 30, 6], HandL: [-30, 62, 0], Head: [-6, -4, -7], Chest: [1, -4, 5] }, 'in'),
      K(0.11, { UpArmL: [-56, 10, 26], LoArmL: [-108, 20, 6], HandL: [-52, 70, 0], Head: [-9, -6, -8], Chest: [0, -2, 6], Hips: [0, 24, -8] }, 'snap'),
      K(0.26, { UpArmL: [-55, 10, 26], LoArmL: [-107, 20, 6], HandL: [-52, 70, 0], Head: [-9, -6, -8] }, 'hold'),
      K(0.40, {}, 'out')
    ]
  },

  // ---- CT2 — RESONANCE 共鳴 -----------------------------------------------
  // THE TELL, and it is the whole balance of the character. The doll comes up
  // in the left hand, the nail comes up in the right, she sets her feet and
  // then drives the nail home with both hands at chest height. The channel is
  // deliberately BIG and slow-armed — she is standing completely still with
  // both hands occupied and her eyes down on the doll, which is exactly the
  // window an opponent is supposed to kill her in.
  ct2: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      // PASS 3 REPOSE. The first authoring used UpArm rx -74 with the forearm
      // folded to -98, which does not put a hand at the sternum — it puts it
      // beside the ear. Checked in the viewer with the doll actually attached:
      // both hands were up by her head and the doll was behind her hair, so
      // the single most important tell in the game was invisible. The elbows
      // come DOWN and IN now (UpArm ~-40, rz small) and the forearms fold
      // across the body, which lands both hands in front of the chest where
      // the camera can see what is in them.
      //
      // the reveal: doll up, nail up, feet planted square
      // NOTE ON THE LEFT ARM'S NUMBERS. They are not a sign-flip of the right
      // arm's and they are not supposed to look like one. With the upper arm
      // raised past about 50 degrees the shared XYZ euler order stops behaving
      // like abduction/flexion and the two sides diverge badly — authored as a
      // mirror, this pose put the right hand at the sternum and the left hand
      // half a metre out to the side with the doll dangling off frame. These
      // were solved against the right hand's measured world position in the
      // viewer, which is why they look lopsided on the page and symmetric on
      // screen. Anything that edits one arm here has to re-check the other.
      K(0.16, {
        UpArmL: [-66, -10, -36], LoArmL: [-64, 38, 4], HandL: [-24, 66, 0],
        UpArmR: [-50, -12, -10], LoArmR: [-90, -26, 0], HandR: [-26, -62, 0],
        Chest: [8, -6, 2], Spine: [7, -4, 2], Neck: [6, -2, -1], Head: [16, -6, -2],
        Hips: [0, 16, -3], Hips_pos: [0.006, -0.062, 0],
        ThighL: [-14, -8, 2], ShinL: [16, 0, 0], ThighR: [10, 5, 0], ShinR: [18, 0, 0]
      }, 'out'),
      // the channel. Held. Nothing moves but a slow settle downward.
      K(0.54, {
        UpArmL: [-68, -10, -38], LoArmL: [-62, 39, 4], HandL: [-24, 66, 0],
        UpArmR: [-52, -13, -9], LoArmR: [-92, -27, 0], HandR: [-26, -62, 0],
        Chest: [9, -6, 2], Head: [18, -6, -2], Hips_pos: [0.006, -0.074, 0],
        ThighL: [-16, -8, 2], ShinL: [18, 0, 0], ThighR: [12, 5, 0], ShinR: [20, 0, 0]
      }, 'hold'),
      // the drive: both hands snap together at the sternum, hard
      K(0.62, {
        UpArmL: [-80, -30, -50], LoArmL: [-42, 34, 4], HandL: [-16, 78, 0],
        UpArmR: [-50, -30, 0], LoArmR: [-80, -34, 0], HandR: [-16, -78, 0],
        Chest: [-6, 0, 2], Spine: [-5, 0, 2], Neck: [-4, 0, -1], Head: [-14, 0, -3],
        Hips_pos: [0.004, -0.108, 0]
      }, 'snap'),
      // and the hold. She looks up, not at the doll.
      K(0.80, {
        UpArmL: [-78, -30, -50], LoArmL: [-40, 34, 4], UpArmR: [-48, -30, 0], LoArmR: [-78, -34, 0],
        Chest: [-6, -4, 3], Head: [-18, -8, -6], Hips_pos: [0.004, -0.104, 0]
      }, 'hold'),
      K(1.10, {}, 'out')
    ]
  },

  // ---- SPECIAL — the BLACK FLASH attempt ----------------------------------
  // A committed one-handed hammer drive straight down the line. Everything
  // about it is a gamble: the wind-up is visible, the recovery is long, and
  // the payoff only exists if the timing input lands inside the window it
  // opens. She throws it like she is certain.
  bfStrike: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmR: [-18, -60, -40], LoArmR: [-146, -22, 0], HandR: [-20, -56, 0], UpArmL: [-26, 32, 42], LoArmL: [-92, 28, 6], Chest: [-6, -34, 8], Spine: [-4, -18, 5], Hips: [0, 46, -10], Head: [-8, -18, -8], Hips_pos: [0.020, -0.070, 0] }, 'in'),
      K(0.22, { UpArmR: [-96, 6, 0], LoArmR: [-10, 0, 0], HandR: [-14, -150, 0], UpArmL: [-10, 20, 34], LoArmL: [-78, 24, 6], Chest: [14, 12, 0], Spine: [10, 8, 1], Hips: [4, 4, -3], Head: [10, -10, -3], Hips_pos: [0.004, -0.170, 0], ThighL: [-44, -10, 2], ShinL: [30, 0, 0], FootL: [-12, -18, 0], ThighR: [32, 5, 0], ShinR: [36, 0, 0] }, 'snap'),
      K(0.36, { UpArmR: [-94, 6, 0], LoArmR: [-12, 0, 0], Chest: [14, 12, 0], Hips_pos: [0.004, -0.170, 0] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },
  // BLACK FLASH IMPACT — the frame the flash lands on. Played by
  // effects.blackFlash() on the same clip name Yuji's uses, so the shared
  // system needs no branch for her. Everything rigid, one hard convulsion
  // through the whole body, and then a held pose with the chin up.
  bfImpact: {
    dur: 0.52, loop: false, keys: [
      K(0, { UpArmR: [-92, 6, 0], LoArmR: [-12, 0, 0], Chest: [14, 12, 0], Hips_pos: [0.004, -0.170, 0] }),
      K(0.04, { UpArmR: [-104, 10, -4], LoArmR: [-4, 0, 0], HandR: [-8, -160, 0], UpArmL: [-4, 16, 44], LoArmL: [-56, 20, 6], Chest: [22, 18, -2], Spine: [15, 12, -1], Hips: [8, -6, -2], Head: [18, -14, -2], Hips_pos: [0, -0.205, 0], ThighL: [-52, -10, 2], ShinL: [26, 0, 0], ThighR: [38, 5, 0], ShinR: [30, 0, 0] }, 'snap'),
      K(0.20, { UpArmR: [-102, 10, -4], LoArmR: [-6, 0, 0], Chest: [22, 18, -2], Head: [18, -14, -2], Hips_pos: [0, -0.205, 0] }, 'hold'),
      // and up out of it, chin lifted
      K(0.34, { UpArmR: [-42, -16, -20], LoArmR: [-72, -8, 0], UpArmL: [2, 22, 40], LoArmL: [-96, 32, 6], Chest: [2, -8, 6], Spine: [2, -6, 4], Head: [-16, -8, -8], Hips: [0, 26, -8], Hips_pos: [0.016, -0.060, 0] }, 'out'),
      K(0.52, {}, 'out')
    ]
  },

  // ---- ULTIMATE — RESONANCE: FULL RELEASE ---------------------------------
  // Everything she has been holding, all at once. The doll comes up in both
  // hands, she raises the nail overhead in a long theatrical wind — the one
  // moment in her set where she genuinely poses for the camera — and then
  // drives it through the doll two-handed and RIDES it down onto one knee.
  // The hold at the end is the longest in the game for a reason: this is the
  // payoff for a whole round of landing hits and it should feel like a bill
  // being presented.
  ult: {
    dur: 2.40, loop: false, keys: [
      K(0, {}),
      // the doll, held out at arm's length in front of her. She looks at it,
      // not at them. (Same repose as the ct2 channel: elbow down, forearm
      // across the body, so the doll is between her and the camera.)
      K(0.26, {
        UpArmL: [-82, -8, -34], LoArmL: [-42, 34, 4], HandL: [-14, 70, 0],
        UpArmR: [-44, -14, -16], LoArmR: [-92, -22, 0], HandR: [-22, -56, 0],
        Chest: [8, -4, 3], Spine: [7, -3, 2], Head: [18, -6, -3],
        Hips: [0, 18, -5], Hips_pos: [0.010, -0.056, 0]
      }, 'out'),
      // THE WIND. Nail overhead, back arched, hip thrown. Held.
      K(0.66, {
        UpArmL: [-86, -8, -30], LoArmL: [-38, 30, 4],
        UpArmR: [-176, -12, -16], LoArmR: [-28, 0, -4], HandR: [-14, -50, 0],
        Chest: [-16, -10, 8], Spine: [-12, -7, 5], Neck: [-8, -3, -3], Head: [-24, -10, -9],
        Hips: [0, 34, -12], Hips_pos: [0.028, -0.048, 0],
        ThighL: [-20, -16, 6], ShinL: [22, 0, 0], FootL: [4, -26, 0], ThighR: [8, 6, -2], ShinR: [10, 0, 0]
      }, 'in'),
      K(0.96, {
        UpArmR: [-180, -12, -16], LoArmR: [-26, 0, -4], Chest: [-17, -10, 8], Head: [-25, -10, -9],
        Hips: [0, 36, -12], Hips_pos: [0.028, -0.046, 0]
      }, 'hold'),
      // THE DRIVE. Both hands down through the doll, straight onto one knee.
      K(1.10, {
        UpArmL: [-80, -30, -50], LoArmL: [-44, 34, 4], HandL: [-26, 74, 0],
        UpArmR: [-50, -30, 0], LoArmR: [-82, -34, 0], HandR: [-26, -74, 0],
        Chest: [30, 2, 1], Spine: [21, 1, 1], Neck: [8, 0, 0], Head: [26, -4, -1],
        Hips: [10, 14, -2], Hips_pos: [0.004, -0.330, 0],
        ThighL: [-96, -8, 2], ShinL: [112, 0, 0], FootL: [26, -14, 0],
        ThighR: [-24, 6, 0], ShinR: [120, 0, 0], FootR: [16, 6, 0]
      }, 'snap'),
      // the long hold on the knee
      K(1.70, {
        UpArmL: [-78, -30, -50], LoArmL: [-42, 34, 4], UpArmR: [-48, -30, 0], LoArmR: [-80, -34, 0],
        Chest: [30, 2, 1], Head: [26, -4, -1], Hips_pos: [0.004, -0.328, 0],
        ThighL: [-96, -8, 2], ShinL: [112, 0, 0], ThighR: [-24, 6, 0], ShinR: [120, 0, 0]
      }, 'hold'),
      // she stands up out of it slowly, and the last thing that moves is her
      // head coming round to look at them
      K(2.06, {
        Chest: [6, -6, 5], Spine: [5, -4, 4], Head: [0, -6, -6], Hips: [0, 22, -7],
        Hips_pos: [0.014, -0.090, 0],
        UpArmL: [-14, 20, 32], LoArmL: [-92, 28, 6], UpArmR: [-30, -26, -24], LoArmR: [-96, -14, 0],
        ThighL: [-18, -12, 4], ShinL: [26, 0, 0], ThighR: [8, 4, -2], ShinR: [12, 0, 0]
      }, 'out'),
      K(2.40, {}, 'out')
    ]
  },

  // VICTORY — she shoulders the hammer, puts the free hand back on her hip,
  // and tips her head with the smirk. Two beats, both held. She does not need
  // to do anything else.
  // ---- TAUNT — "I LOVE MYSELF." -------------------------------------------
  // The hammer never leaves her shoulder — that pose IS her, and taking it away
  // for a taunt would cost more than the taunt is worth. So the whole thing
  // happens in the LEFT hand: it comes off her hip with a nail spun between the
  // fingers, she looks at her nails past it, blows, and flicks her hair back.
  //
  // Three separate wrist beats, which is unusual for this project and is the
  // point — she is the only character whose taunt is about her hands.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the left hand comes up, palm turned in, fingers spread
      K(0.36, {
        UpArmL: [-72, 30, 26], LoArmL: [-128, 46, 4], HandL: [-34, 96, 0],
        Chest: [0, -12, 5], Spine: [1, -8, 5], Neck: [0, -4, -4], Head: [-2, -12, -8],
        Hips_pos: [0.02, -0.022, 0]
      }, 'out'),
      // she inspects them. Head comes over to the hand, not the hand to the head.
      K(0.85, {
        UpArmL: [-74, 28, 22], LoArmL: [-134, 44, 4], HandL: [-40, 104, 0],
        Chest: [2, -14, 7], Spine: [2, -9, 6], Neck: [2, -6, -6], Head: [8, -18, -13],
        Hips_pos: [0.022, -0.026, 0]
      }, 'hold'),
      // THE BLOW. A small forward push of the head and two degrees of chest.
      K(1.30, {
        UpArmL: [-76, 26, 20], LoArmL: [-136, 42, 4], HandL: [-42, 106, 0],
        Chest: [5, -14, 7], Spine: [4, -9, 6], Neck: [5, -6, -6], Head: [14, -18, -13],
        Hips_pos: [0.022, -0.03, 0.01]
      }, 'snap'),
      K(1.58, {
        UpArmL: [-75, 26, 20], LoArmL: [-135, 42, 4], HandL: [-41, 105, 0],
        Chest: [3, -14, 7], Head: [11, -18, -13], Hips_pos: [0.022, -0.028, 0.008]
      }, 'hold'),
      // THE HAIR FLICK. The hand goes up past the ear and back, the head snaps
      // the other way, and the chin ends up higher than it started.
      K(1.92, {
        UpArmL: [-118, 10, 40], LoArmL: [-96, 20, 6], HandL: [-20, 60, 0],
        Chest: [-4, -4, 2], Spine: [-2, -3, 2], Neck: [-4, 6, 2], Head: [-14, 14, 6],
        Hips: [0, 16, -5], Hips_pos: [0.01, -0.012, 0]
      }, 'snap'),
      // and she holds THAT, chin up, hammer still on the shoulder
      K(2.45, {
        UpArmL: [-40, 22, 44], LoArmL: [-110, 38, 6], HandL: [-24, 74, 0],
        Chest: [-2, -8, 4], Neck: [-3, 2, -1], Head: [-11, 2, -2],
        Hips: [0, 19, -6], Hips_pos: [0.015, -0.02, 0]
      }, 'out'),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.45, {
        UpArmR: [-96, -20, -18], LoArmR: [-58, -10, 0], HandR: [-18, -84, 0],
        UpArmL: [-20, 30, 40], LoArmL: [-92, 34, 6],
        Chest: [2, -14, 6], Spine: [2, -8, 4], Head: [-6, -18, -6], Hips: [0, 32, -9],
        Hips_pos: [0.024, -0.052, 0]
      }, 'snap'),
      K(0.85, {
        UpArmR: [-24, -34, -32], LoArmR: [-132, -18, 0],
        UpArmL: [12, 26, 42], LoArmL: [-104, 40, 6], HandL: [-24, 72, 0],
        Chest: [1, -9, 5], Head: [-10, -8, -10], Hips: [0, 24, -9], Hips_pos: [0.026, -0.036, 0]
      }, 'out'),
      K(1.7, { Head: [-12, -9, -11], Hips_pos: [0.028, -0.044, 0], Chest: [2, -9, 6] }, 'hold'),
      K(2.3, { Head: [-6, -4, -8], Hips_pos: [0.022, -0.028, 0], UpArmR: [-26, -34, -30], Chest: [0, -9, 4] }),
      K(3.0, { Head: [-11, -8, -11], Hips_pos: [0.026, -0.040, 0] }, 'hold')
    ]
  }
};
