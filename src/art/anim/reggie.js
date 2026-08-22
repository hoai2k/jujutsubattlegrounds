// ===========================================================================
// REGGIE STAR — the loosest set in the project, and the only one whose NEUTRAL
// IS NOT A FIGHTING STANCE.
// ===========================================================================
// THE ONE NOTE THAT GOVERNS EVERY CLIP IN THIS FILE:
//
//   *** HE IS NOT A FIGHTER AND HE DOES NOT MOVE LIKE ONE. ***
//
// Every other character on this roster squares up. Reggie stands like a man
// waiting for a lift: weight on one hip, shoulders open, hands doing nothing
// in particular, chin a little up. He never raises a guard he did not have to
// raise. When he throws something he throws it the way a person throws a bag
// of rubbish into a skip — one arm, no hips, no follow-through discipline, and
// a small satisfied settle afterwards.
//
// Yaga's neutral (arms folded) is the nearest thing already in the project and
// it is not the same idea: Yaga is a large calm man who has decided not to
// fight yet. Reggie is a man who has never learned to and does not think he
// needs to.
//
// ---------------------------------------------------------------------------
// THE SECOND NOTE — THE OBJECT'S WEIGHT LIVES ENTIRELY IN THE ANIMATION
// ---------------------------------------------------------------------------
// The models in art/models/receiptobjects.js are the same size on every frame.
// The only thing that tells a player a car is heavier than a fishing rod is
// what his body does, so the seven materialise clips are authored to a
// deliberate scale and the numbers are stated here so they can be checked:
//
//   OBJECT      wind-up   release   settle    hips drop at release
//   rod          0.10 s    0.06 s    0.14 s   0.00 m   — flicks the wrist
//   canister     0.16      0.10      0.20     0.03     — sets it down
//   drone        0.14      0.08      0.16     0.01     — tosses it up
//   ladder       0.22      0.16      0.30     0.06     — a two-handed swing
//   moped        0.26      0.14      0.26     0.05     — shoves it, runs after
//   vending      0.34      0.12      0.34     0.11     — points UP, then flinches
//   car          0.46      0.20      0.52     0.19     — the whole body
//
// Read the `Hips_pos` y down that last column in the clips below and it goes
// 0.00 → -0.19. That is the entire weight system and there is nothing else to
// it.
// ---------------------------------------------------------------------------
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — WEIGHT ON THE BACK HIP, ARMS LOW AND OPEN, CHIN UP.
// The right hand hangs completely dead; the left is half-raised near the waist
// where he keeps reaching for a tag. Feet are square and too close together
// for a fighter, which is the point.
export const REGGIE_STANCE = {
  Hips_pos: [0, -0.030, 0],
  Hips: [-2, 22, 0], Spine: [-2, -6, 0], Chest: [-4, -9, 0], Neck: [2, -3, 0], Head: [-4, -7, 0],
  ClavL: [0, 0, 2], UpArmL: [-12, 12, 12], LoArmL: [-52, 30, 0], HandL: [-14, 40, 0],
  ClavR: [0, 0, -2], UpArmR: [-4, -6, -8], LoArmR: [-24, -14, 0], HandR: [-8, -30, 0],
  ThighL: [-8, -3, 0], ShinL: [7, 0, 0], FootL: [1, -9, 0],
  ThighR: [4, 5, 0], ShinR: [10, 0, 0], FootR: [4, 7, 0]
};

export const REGGIE_CLIPS = {
  // IDLE — 4.2 s, and the beat that matters is at 2.4: he ROLLS A SHOULDER and
  // glances off to one side, as if something over there is more interesting
  // than the fight. It is the whole personality in one key.
  idle: {
    dur: 4.2, loop: true, keys: [
      K(0, {}),
      K(1.3, {
        Chest: [-3, -9, 0], Hips_pos: [0, -0.042, 0],
        UpArmL: [-15, 12, 14], LoArmL: [-56, 30, 0], UpArmR: [-6, -6, -10], Head: [-3, -6, 0]
      }),
      K(2.4, {
        Hips: [-2, 26, 0], Chest: [-5, -16, 0], Neck: [2, 6, 0], Head: [-6, 12, 0],
        ClavL: [0, 0, 8], UpArmL: [-9, 14, 20], LoArmL: [-48, 30, 0],
        UpArmR: [-2, -6, -6], Hips_pos: [0, -0.026, 0]
      }, 'out'),
      K(3.2, { Chest: [-4, -11, 0], Head: [-4, -2, 0], Hips_pos: [0, -0.038, 0] }),
      K(4.2, {})
    ]
  },

  // WALK — an amble. Long, slow stride, arms barely moving, hips leading. He
  // is not closing distance, he is strolling toward you.
  walk: {
    dur: 1.06, loop: true, keys: [
      K(0, { ThighL: [-26, -3, 0], ShinL: [10, 0, 0], FootL: [-6, -9, 0], ThighR: [18, 5, 0], ShinR: [24, 0, 0], FootR: [11, 7, 0], Hips_pos: [0, -0.040, 0], Hips: [-2, 26, 0], UpArmL: [-16, 12, 13], UpArmR: [-9, -6, -9] }),
      K(0.265, { ThighL: [-4, -3, 0], ShinL: [18, 0, 0], ThighR: [2, 5, 0], ShinR: [12, 0, 0], Hips_pos: [0, -0.018, 0], Chest: [-4, -6, 0] }),
      K(0.53, { ThighL: [18, -3, 0], ShinL: [22, 0, 0], FootL: [9, -9, 0], ThighR: [-24, 5, 0], ShinR: [11, 0, 0], FootR: [-6, 7, 0], Hips_pos: [0, -0.040, 0], Hips: [-2, 18, 0], UpArmL: [-10, 12, 13], UpArmR: [-14, -6, -9] }),
      K(0.795, { ThighL: [1, -3, 0], ShinL: [14, 0, 0], ThighR: [-6, 5, 0], ShinR: [19, 0, 0], Hips_pos: [0, -0.018, 0], Chest: [-4, -12, 0] }),
      K(1.06, { ThighL: [-26, -3, 0], ShinL: [10, 0, 0], FootL: [-6, -9, 0], ThighR: [18, 5, 0], ShinR: [24, 0, 0], FootR: [11, 7, 0], Hips_pos: [0, -0.040, 0], UpArmL: [-16, 12, 13], UpArmR: [-9, -6, -9] })
    ]
  },

  // RUN — and this is the second-funniest clip in the file. He runs like a man
  // late for something rather than like a fighter closing: upright, arms
  // pumping too wide, chin up. A sprint with no forward lean, which reads as
  // undignified from every angle. That is intentional.
  run: {
    dur: 0.54, loop: true, keys: [
      K(0, { Spine: [7, -4, 0], Chest: [3, -6, 0], Hips: [2, 12, 0], ThighL: [-48, -2, 0], ShinL: [26, 0, 0], FootL: [-12, -6, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [26, 6, 0], UpArmL: [-24, 16, 26], LoArmL: [-96, 6, 6], UpArmR: [-64, -12, -28], LoArmR: [-86, -4, -6], Head: [-6, -6, 0], Hips_pos: [0, -0.022, 0] }),
      K(0.135, { Spine: [6, -4, 0], ThighL: [-8, -2, 0], ShinL: [30, 0, 0], ThighR: [-14, 4, 0], ShinR: [38, 0, 0], Hips_pos: [0, -0.058, 0] }),
      K(0.27, { Spine: [7, -4, 0], Chest: [3, -6, 0], Hips: [2, 12, 0], ThighL: [32, -2, 0], ShinL: [62, 0, 0], FootL: [26, -6, 0], ThighR: [-48, 4, 0], ShinR: [26, 0, 0], FootR: [-12, 6, 0], UpArmL: [-64, 16, 26], LoArmL: [-86, 6, 6], UpArmR: [-24, -12, -28], LoArmR: [-96, -4, -6], Head: [-6, -6, 0], Hips_pos: [0, -0.022, 0] }),
      K(0.405, { Spine: [6, -4, 0], ThighL: [-14, -2, 0], ShinL: [38, 0, 0], ThighR: [-8, 4, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.058, 0] }),
      K(0.54, { Spine: [7, -4, 0], Chest: [3, -6, 0], Hips: [2, 12, 0], ThighL: [-48, -2, 0], ShinL: [26, 0, 0], FootL: [-12, -6, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [26, 6, 0], UpArmL: [-24, 16, 26], UpArmR: [-64, -12, -28] })
    ]
  },

  // ---- THE STRING ---------------------------------------------------------
  // Sloppy, wide, and effective anyway. He does not jab — he SWATS. All three
  // hits come off the shoulder with an open-ish hand and no hip rotation to
  // speak of, and the third is a shove rather than an uppercut, so the
  // launcher reads as a man pushing somebody over.
  //
  // THE THIRD HIT CARRIES A MATERIALISED OBJECT (see characters/reggie.js —
  // `junkOnThird`), which is why punch3's right hand comes up EMPTY at 0.06
  // and finishes CLOSED at 0.14: the effect drops the model into that hand on
  // the frame between.
  punch1: {
    dur: 0.35, loop: false, keys: [
      K(0, {}),
      K(0.075, { UpArmL: [-16, 20, 24], LoArmL: [-64, 34, 0], Chest: [-4, -22, 0], Hips: [-2, 30, 0] }, 'in'),
      K(0.14, { UpArmL: [-62, -8, 30], LoArmL: [-18, 6, 0], HandL: [-6, 84, 0], Chest: [0, 12, 0], Hips: [0, 8, 0], Spine: [0, 6, 0], Head: [-2, -14, 0] }, 'snap'),
      K(0.20, { UpArmL: [-58, -6, 28], LoArmL: [-22, 6, 0], Chest: [0, 10, 0], Hips: [0, 10, 0] }, 'hold'),
      K(0.35, {})
    ]
  },
  punch2: {
    dur: 0.38, loop: false, keys: [
      K(0, {}),
      K(0.08, { UpArmR: [-12, -18, -22], LoArmR: [-40, -30, 0], Chest: [-4, 8, 0], Hips: [-2, 12, 0] }, 'in'),
      K(0.155, { UpArmR: [-56, 10, -34], LoArmR: [-14, -6, 0], HandR: [-6, -88, 0], Chest: [0, -26, 0], Hips: [0, 32, 0], Spine: [0, -8, 0], Head: [-2, 8, 0] }, 'snap'),
      K(0.22, { UpArmR: [-52, 8, -32], LoArmR: [-18, -6, 0], Chest: [0, -24, 0], Hips: [0, 30, 0] }, 'hold'),
      K(0.38, {})
    ]
  },
  // THE SHOVE. Two hands, low to high, no rotation. He is not punching them
  // into the air, he is heaving them off him — and the object appears between
  // his palms as it happens.
  punch3: {
    dur: 0.52, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        Hips_pos: [0, -0.090, 0], Spine: [12, -6, 0], Chest: [10, -9, 0], Head: [8, -7, 0],
        UpArmL: [12, 20, 16], LoArmL: [-74, 30, 0], UpArmR: [16, -16, -14], LoArmR: [-70, -26, 0],
        ThighL: [-20, -3, 0], ShinL: [22, 0, 0], ThighR: [-8, 5, 0], ShinR: [24, 0, 0]
      }, 'in'),
      K(0.155, { HandL: [-10, 46, 0], HandR: [-10, -46, 0] }),
      K(0.235, {
        Hips_pos: [0, 0.030, 0], Spine: [-16, -6, 0], Chest: [-14, -9, 0], Head: [-14, -7, 0],
        UpArmL: [-96, 6, 24], LoArmL: [-14, 8, 0], HandL: [-4, 70, 0],
        UpArmR: [-92, -4, -22], LoArmR: [-16, -8, 0], HandR: [-4, -70, 0],
        ThighL: [-4, -3, 0], ShinL: [4, 0, 0], ThighR: [6, 5, 0], ShinR: [6, 0, 0]
      }, 'snap'),
      K(0.31, { Hips_pos: [0, 0.014, 0], Spine: [-12, -6, 0], UpArmL: [-88, 6, 26], UpArmR: [-84, -4, -24] }, 'hold'),
      K(0.52, {})
    ]
  },

  // HEAVY — a full-body haymaker with terrible form. He winds the whole torso
  // back, plants, and swings the arm through with the shoulder leading. It is
  // slow because he telegraphs it enormously, and he nearly falls over
  // afterwards, which is the recovery.
  heavy: {
    dur: 0.82, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        Hips: [-4, 62, 0], Spine: [-6, 26, 0], Chest: [-10, 30, 0], Head: [-4, -20, 0],
        Hips_pos: [-0.05, -0.075, -0.06],
        UpArmR: [26, -26, -44], LoArmR: [-58, -34, 0], HandR: [-12, -50, 0],
        UpArmL: [-24, 26, 22], LoArmL: [-60, 34, 0],
        ThighR: [16, 5, 0], ShinR: [26, 0, 0], ThighL: [-22, -3, 0], ShinL: [18, 0, 0]
      }, 'in'),
      K(0.38, {
        Hips: [2, -34, 0], Spine: [4, -22, 0], Chest: [6, -30, 0], Head: [0, 18, 0],
        Hips_pos: [0.05, -0.045, 0.07],
        UpArmR: [-76, 22, -18], LoArmR: [-10, -4, 0], HandR: [-4, -96, 0],
        UpArmL: [10, 18, 30], LoArmL: [-44, 22, 0],
        ThighR: [-16, 5, 0], ShinR: [12, 0, 0], ThighL: [10, -3, 0], ShinL: [16, 0, 0]
      }, 'snap'),
      K(0.46, { Hips: [2, -40, 0], Chest: [8, -34, 0], UpArmR: [-70, 20, -16] }, 'hold'),
      // the near-fall
      K(0.62, { Hips: [0, -18, 0], Spine: [10, -12, 0], Chest: [8, -16, 0], Hips_pos: [0.03, -0.095, 0.05], Head: [10, 6, 0], UpArmR: [-30, 6, -14] }),
      K(0.82, {})
    ]
  },

  // ---- BLOCK — HE FLINCHES ------------------------------------------------
  // Every other character on the roster brings a structured guard up. He
  // covers his head with one arm and turns his face away. It works — the
  // numbers in the config are average — but it does not look like it should.
  block: {
    dur: 0.16, loop: false, keys: [
      K(0, {}),
      K(0.11, {
        UpArmL: [-96, 30, 34], LoArmL: [-116, 40, 0], HandL: [-14, 90, 0],
        UpArmR: [-58, -18, -18], LoArmR: [-108, -30, 0], HandR: [-14, -80, 0],
        Chest: [8, -22, 0], Spine: [7, -14, 0], Neck: [4, -12, 0], Head: [14, -22, 0],
        Hips_pos: [0, -0.065, 0], ThighL: [-18, -3, 0], ShinL: [18, 0, 0]
      }, 'out'),
      K(0.16, { UpArmL: [-96, 30, 34], LoArmL: [-116, 40, 0], UpArmR: [-58, -18, -18], LoArmR: [-108, -30, 0], Head: [14, -22, 0], Hips_pos: [0, -0.065, 0] })
    ]
  },

  // ---- RB · QUICK MATERIALISE ---------------------------------------------
  // The single loosest attack animation in the game. A flick of the left wrist
  // — the tag comes off his chest, catches, and whatever it was is already in
  // the air. 18 frames start to finish and his feet never move.
  ct1: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.075, {
        UpArmL: [-30, 30, 22], LoArmL: [-92, 44, 0], HandL: [-20, 20, 0],
        Chest: [-4, -20, 0], Head: [-2, -14, 0]
      }, 'in'),
      K(0.145, {
        UpArmL: [-58, -14, 26], LoArmL: [-30, 4, 0], HandL: [10, 96, 0],
        Chest: [-2, 10, 0], Hips: [-2, 12, 0], Head: [-4, -2, 0]
      }, 'snap'),
      K(0.21, { UpArmL: [-50, -10, 24], LoArmL: [-38, 4, 0], HandL: [6, 88, 0] }, 'hold'),
      K(0.36, {})
    ]
  },

  // ---- THE RECEIPT WHEEL (B, held) ----------------------------------------
  // He holds a fan of tags up at eye level and reads them, one eyebrow up. The
  // clip is short and loops in the radial's slow-motion; the pose is what
  // matters, not the motion.
  wheel: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        UpArmL: [-64, 22, 20], LoArmL: [-96, 44, 0], HandL: [-14, 30, 0],
        UpArmR: [-14, -8, -10], LoArmR: [-38, -20, 0],
        Chest: [-6, -14, 0], Neck: [6, -6, 0], Head: [6, -10, 0], Hips_pos: [0, -0.028, 0]
      }),
      K(0.45, {
        UpArmL: [-70, 24, 22], LoArmL: [-100, 46, 0], HandL: [-8, 42, 0],
        Chest: [-7, -16, 0], Head: [8, -14, 0], Hips_pos: [0, -0.036, 0]
      }),
      K(0.9, {
        UpArmL: [-64, 22, 20], LoArmL: [-96, 44, 0], HandL: [-14, 30, 0],
        Chest: [-6, -14, 0], Head: [6, -10, 0], Hips_pos: [0, -0.028, 0]
      })
    ]
  },

  // =========================================================================
  // THE SEVEN MATERIALISE CLIPS
  // =========================================================================
  // Ordered lightest to heaviest, and they are meant to be read that way. See
  // the weight table at the top of this file.

  // 1 · FISHING ROD — a wrist flick. He does not even look at it properly.
  mRod: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmR: [-38, -20, -18], LoArmR: [-84, -30, 0], HandR: [-14, -40, 0], Chest: [-4, 12, 0] }, 'in'),
      K(0.16, { UpArmR: [-64, -4, -22], LoArmR: [-24, -8, 0], HandR: [14, -100, 0], Chest: [-2, -8, 0], Hips: [-2, 28, 0] }, 'snap'),
      K(0.30, { UpArmR: [-46, -10, -20], LoArmR: [-52, -14, 0], HandR: [-2, -76, 0], Chest: [-3, 4, 0] }),
      K(0.44, {})
    ]
  },

  // 2 · GAS CANISTER — he sets it down and kicks it. Low, two-handed, and the
  // one clip where he bends his knees properly.
  mCanister: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Hips_pos: [0, -0.115, 0], Spine: [22, -6, 0], Chest: [16, -9, 0], Head: [16, -7, 0],
        UpArmL: [10, 22, 12], LoArmL: [-58, 30, 0], UpArmR: [12, -18, -10], LoArmR: [-56, -26, 0],
        ThighL: [-34, -3, 0], ShinL: [42, 0, 0], ThighR: [-24, 5, 0], ShinR: [40, 0, 0]
      }, 'in'),
      K(0.26, { Hips_pos: [0, -0.130, 0], UpArmL: [4, 20, 10], UpArmR: [6, -16, -8], Spine: [26, -6, 0] }, 'hold'),
      // the kick
      K(0.36, {
        Hips_pos: [0, -0.050, 0], Spine: [-4, -6, 0], Chest: [-6, -9, 0],
        ThighR: [-52, 5, 0], ShinR: [-14, 0, 0], FootR: [22, 7, 0],
        UpArmL: [-26, 22, 26], UpArmR: [-20, -18, -24]
      }, 'snap'),
      K(0.46, { Hips_pos: [0, -0.040, 0], ThighR: [-30, 5, 0], ShinR: [10, 0, 0] }),
      K(0.62, {})
    ]
  },

  // 3 · DRONE — an underarm toss straight up, and then he watches it go with
  // his hand still in the air. The follow-look is the character.
  mDrone: {
    dur: 0.60, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmR: [20, -14, -12], LoArmR: [-54, -22, 0], HandR: [-16, -34, 0], Chest: [-4, 6, 0], Hips_pos: [0, -0.055, 0] }, 'in'),
      K(0.22, { UpArmR: [-118, -2, -30], LoArmR: [-8, -4, 0], HandR: [-2, -60, 0], Chest: [-10, -4, 0], Neck: [-8, 0, 0], Head: [-18, -6, 0], Hips_pos: [0, -0.012, 0] }, 'snap'),
      K(0.40, { UpArmR: [-112, -2, -30], LoArmR: [-14, -4, 0], Head: [-22, -6, 0], Neck: [-10, 0, 0] }, 'hold'),
      K(0.60, {})
    ]
  },

  // 4 · LADDER — TWO HANDS, and the longest reach in the game. He gets the
  // grip, hauls it round in a flat horizontal arc, and it drags him a step
  // sideways because he is not strong enough to stop it cleanly.
  mLadder: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.22, {
        Hips: [-4, 66, 0], Spine: [-4, 28, 0], Chest: [-8, 32, 0], Head: [-2, -24, 0],
        Hips_pos: [-0.06, -0.060, -0.05],
        UpArmR: [-48, -30, -34], LoArmR: [-58, -30, 0], HandR: [-10, -56, 0],
        UpArmL: [-44, 34, 20], LoArmL: [-72, 36, 0], HandL: [-10, 48, 0],
        ThighR: [14, 5, 0], ShinR: [22, 0, 0], ThighL: [-20, -3, 0], ShinL: [16, 0, 0]
      }, 'in'),
      K(0.38, {
        Hips: [2, -44, 0], Spine: [4, -26, 0], Chest: [6, -34, 0], Head: [2, 22, 0],
        Hips_pos: [0.07, -0.048, 0.06],
        UpArmR: [-84, 26, -14], LoArmR: [-16, -4, 0], HandR: [-4, -92, 0],
        UpArmL: [-70, 8, 34], LoArmL: [-30, 10, 0], HandL: [-4, 76, 0],
        ThighR: [-18, 5, 0], ShinR: [14, 0, 0], ThighL: [12, -3, 0], ShinL: [14, 0, 0]
      }, 'snap'),
      K(0.48, { Hips: [2, -54, 0], Chest: [8, -40, 0], Hips_pos: [0.09, -0.052, 0.07] }, 'hold'),
      // dragged round by the weight — a full extra step he did not intend
      K(0.66, { Hips: [0, -70, 0], Spine: [10, -30, 0], Chest: [6, -44, 0], Hips_pos: [0.12, -0.086, 0.03], Head: [10, 26, 0], ThighL: [22, -3, 0], ShinL: [26, 0, 0] }),
      K(0.86, {})
    ]
  },

  // 5 · MOPED — he shoves it forward two-handed like a shopping trolley and
  // then jogs a step after it. Chest low, arms locked out.
  mMoped: {
    dur: 0.84, loop: false, keys: [
      K(0, {}),
      K(0.26, {
        Hips_pos: [0, -0.095, -0.05], Spine: [16, -6, 0], Chest: [12, -9, 0], Head: [10, -7, 0],
        UpArmL: [-42, 24, 14], LoArmL: [-80, 32, 0], HandL: [-12, 54, 0],
        UpArmR: [-38, -20, -12], LoArmR: [-78, -28, 0], HandR: [-12, -54, 0],
        ThighR: [16, 5, 0], ShinR: [30, 0, 0], ThighL: [-26, -3, 0], ShinL: [22, 0, 0]
      }, 'in'),
      K(0.40, {
        Hips_pos: [0, -0.055, 0.10], Spine: [20, -6, 0], Chest: [16, -9, 0], Head: [12, -7, 0],
        UpArmL: [-78, 8, 18], LoArmL: [-10, 6, 0], HandL: [-6, 72, 0],
        UpArmR: [-76, -6, -16], LoArmR: [-12, -6, 0], HandR: [-6, -72, 0],
        ThighR: [-30, 5, 0], ShinR: [16, 0, 0], ThighL: [10, -3, 0], ShinL: [18, 0, 0]
      }, 'snap'),
      K(0.54, { Hips_pos: [0, -0.070, 0.14], Spine: [22, -6, 0], UpArmL: [-72, 8, 20], UpArmR: [-70, -6, -18], ThighL: [-34, -3, 0], ShinL: [30, 0, 0] }),
      K(0.84, {})
    ]
  },

  // 6 · VENDING MACHINE — HE POINTS UP, AND THEN HE FLINCHES.
  // The entire read of this move is that the thing arrives from above and he
  // does not want to be under it either. One arm goes up and holds; on the
  // frame the machine lands his shoulders come up around his ears.
  mVending: {
    dur: 1.02, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmR: [-40, -16, -14], LoArmR: [-70, -24, 0], Chest: [-6, 8, 0], Hips_pos: [0, -0.060, 0] }, 'in'),
      K(0.34, {
        UpArmR: [-158, 4, -26], LoArmR: [-6, -2, 0], HandR: [0, -50, 0],
        Neck: [-10, -2, 0], Head: [-26, -6, 0], Chest: [-12, -4, 0], Spine: [-8, -6, 0],
        Hips_pos: [0, 0.010, 0]
      }, 'snap'),
      K(0.56, { UpArmR: [-156, 4, -26], Head: [-28, -6, 0], Neck: [-11, -2, 0] }, 'hold'),
      // the flinch, on the landing frame
      K(0.68, {
        Hips_pos: [0, -0.110, -0.04], Spine: [16, -6, 0], Chest: [14, -9, 0], Neck: [10, -3, 0], Head: [20, -7, 0],
        ClavL: [0, 0, 16], ClavR: [0, 0, -16],
        UpArmR: [-64, -14, -34], LoArmR: [-96, -26, 0], UpArmL: [-58, 18, 32], LoArmL: [-100, 30, 0],
        ThighL: [-28, -3, 0], ShinL: [30, 0, 0], ThighR: [-18, 5, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      K(0.80, { Hips_pos: [0, -0.090, -0.03], Chest: [10, -9, 0], Head: [16, -7, 0] }),
      K(1.02, {})
    ]
  },

  // 7 · CAR — THE HEAVIEST ANIMATION IN THE PROJECT.
  // 0.46 s of wind-up, the hips drop 19 cm, both arms go behind him, and he
  // throws with his whole spine like a man launching a caber. He is
  // out of position for half a second afterwards and that is the punish
  // window the config prices it on.
  mCar: {
    dur: 1.28, loop: false, keys: [
      K(0, {}),
      // 1 — the reach. Both arms out and DOWN, chest opening, weight going back.
      K(0.18, {
        Hips_pos: [0, -0.120, -0.08], Hips: [-4, 34, 0], Spine: [14, -6, 0], Chest: [10, -12, 0], Head: [6, -8, 0],
        UpArmL: [14, 26, 18], LoArmL: [-44, 30, 0], UpArmR: [16, -22, -16], LoArmR: [-42, -28, 0],
        ThighL: [-30, -3, 0], ShinL: [34, 0, 0], ThighR: [-16, 5, 0], ShinR: [30, 0, 0]
      }, 'in'),
      // 2 — the load. Everything goes back and down. This is the deepest hip
      // drop in the project (-0.190) and it is the whole weight read.
      K(0.46, {
        Hips_pos: [0, -0.190, -0.14], Hips: [-6, 46, 0], Spine: [26, -6, 0], Chest: [20, -16, 0], Neck: [8, -3, 0], Head: [14, -8, 0],
        UpArmL: [58, 30, 14], LoArmL: [-30, 26, 0], HandL: [-14, 34, 0],
        UpArmR: [60, -26, -12], LoArmR: [-28, -24, 0], HandR: [-14, -34, 0],
        ThighL: [-48, -3, 0], ShinL: [56, 0, 0], FootL: [16, -9, 0],
        ThighR: [-30, 5, 0], ShinR: [48, 0, 0], FootR: [14, 7, 0]
      }, 'in'),
      // 3 — the throw. Spine whips through, arms come over the top, and he
      // comes off the back foot entirely.
      K(0.66, {
        Hips_pos: [0, 0.040, 0.16], Hips: [4, -14, 0], Spine: [-24, -6, 0], Chest: [-20, -4, 0], Neck: [-10, -3, 0], Head: [-22, -6, 0],
        UpArmL: [-146, -4, 26], LoArmL: [-12, 8, 0], HandL: [-2, 76, 0],
        UpArmR: [-148, 2, -24], LoArmR: [-10, -8, 0], HandR: [-2, -76, 0],
        ThighL: [-14, -3, 0], ShinL: [10, 0, 0], ThighR: [26, 5, 0], ShinR: [12, 0, 0], FootR: [-24, 7, 0]
      }, 'snap'),
      K(0.78, { Hips_pos: [0, 0.020, 0.14], UpArmL: [-140, -4, 28], UpArmR: [-142, 2, -26], Head: [-24, -6, 0] }, 'hold'),
      // 4 — the settle. He is completely out of shape and takes a full step to
      // get back over his feet.
      K(1.00, {
        Hips_pos: [0, -0.120, 0.06], Hips: [2, 6, 0], Spine: [18, -6, 0], Chest: [12, -8, 0], Head: [16, -7, 0],
        UpArmL: [-34, 14, 22], LoArmL: [-62, 24, 0], UpArmR: [-30, -10, -20], LoArmR: [-58, -20, 0],
        ThighL: [10, -3, 0], ShinL: [22, 0, 0], ThighR: [-24, 5, 0], ShinR: [26, 0, 0]
      }),
      K(1.28, {})
    ]
  },

  // ---- D-pad RIGHT · CLEARING THE REGISTER --------------------------------
  // The ultimate cast. He rips every tag off his chest at once with both
  // hands, throws them UP, and stands underneath the shower of them with his
  // arms out — and then the barrage starts and he just keeps throwing, which
  // is the loop at the end.
  ult: {
    dur: 1.40, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Hips_pos: [0, -0.075, 0], Spine: [12, -6, 0], Chest: [10, -9, 0], Head: [8, -7, 0],
        UpArmL: [-46, 26, 18], LoArmL: [-104, 38, 0], HandL: [-16, 40, 0],
        UpArmR: [-44, -22, -16], LoArmR: [-102, -34, 0], HandR: [-16, -40, 0]
      }, 'in'),
      // the rip — both hands tear outward across the chest
      K(0.32, {
        Hips_pos: [0, -0.030, 0], Chest: [-6, -9, 0], Spine: [-4, -6, 0],
        UpArmL: [-30, 40, 54], LoArmL: [-56, 44, 0], HandL: [-10, 20, 0],
        UpArmR: [-28, -36, -52], LoArmR: [-54, -40, 0], HandR: [-10, -20, 0]
      }, 'snap'),
      // the throw up
      K(0.52, {
        Hips_pos: [0, 0.030, 0], Spine: [-18, -6, 0], Chest: [-16, -9, 0], Neck: [-10, -3, 0], Head: [-24, -7, 0],
        UpArmL: [-166, 8, 30], LoArmL: [-8, 6, 0], UpArmR: [-166, -6, -28], LoArmR: [-8, -6, 0],
        ThighL: [-6, -3, 0], ShinL: [4, 0, 0], ThighR: [2, 5, 0], ShinR: [6, 0, 0]
      }, 'snap'),
      // standing in the rain of receipts, arms out, chin up. He is delighted.
      K(0.86, {
        Hips_pos: [0, -0.020, 0], Spine: [-10, -6, 0], Chest: [-10, -9, 0], Head: [-16, -7, 0],
        UpArmL: [-96, 16, 66], LoArmL: [-24, 14, 0], HandL: [-8, 30, 0],
        UpArmR: [-94, -12, -64], LoArmR: [-22, -12, 0], HandR: [-8, -30, 0]
      }, 'out'),
      K(1.10, { Chest: [-8, -14, 0], Head: [-14, -12, 0], UpArmL: [-92, 18, 62], UpArmR: [-98, -14, -66] }),
      K(1.40, {
        Chest: [-6, -9, 0], Head: [-10, -7, 0],
        UpArmL: [-60, 14, 34], LoArmL: [-48, 20, 0], UpArmR: [-58, -10, -32], LoArmR: [-46, -18, 0]
      })
    ]
  },

  // THE BARRAGE LOOP — played for the duration of the ultimate. Alternating
  // one-armed throws, faster than any of his real animations, with no settle
  // between them. He is emptying the register.
  ultThrow: {
    dur: 0.44, loop: true, keys: [
      K(0, { UpArmL: [-34, 28, 22], LoArmL: [-88, 40, 0], UpArmR: [-64, -6, -24], LoArmR: [-22, -6, 0], Chest: [-4, -18, 0], Hips: [-2, 30, 0] }),
      K(0.11, { UpArmL: [-62, -12, 26], LoArmL: [-24, 6, 0], HandL: [8, 92, 0], UpArmR: [-32, -24, -20], LoArmR: [-84, -36, 0], Chest: [-2, 10, 0], Hips: [-2, 12, 0] }, 'snap'),
      K(0.22, { UpArmL: [-40, 24, 20], LoArmL: [-80, 36, 0], UpArmR: [-60, 4, -26], LoArmR: [-26, -6, 0], Chest: [-4, 6, 0], Hips: [-2, 18, 0] }),
      K(0.33, { UpArmR: [-64, 10, -28], LoArmR: [-20, -6, 0], HandR: [8, -92, 0], UpArmL: [-30, 30, 24], LoArmL: [-90, 42, 0], Chest: [-2, -22, 0], Hips: [-2, 34, 0] }, 'snap'),
      K(0.44, { UpArmL: [-34, 28, 22], LoArmL: [-88, 40, 0], UpArmR: [-64, -6, -24], LoArmR: [-22, -6, 0], Chest: [-4, -18, 0], Hips: [-2, 30, 0] })
    ]
  },

  // ---- D-pad LEFT · THE TAUNT ---------------------------------------------
  // He materialises one receipt, holds it up, READS IT — with a beat of
  // genuine attention, which is what makes it funny — checks the total, and
  // then flicks it away over his shoulder without looking where it goes.
  //
  // The timing is stand-up timing rather than fighting-game timing: the read
  // is held two frames longer than is comfortable before the flick.
  taunt: {
    dur: 3.30, loop: false, keys: [
      K(0, {}),
      // reach across and pull one off the chest
      K(0.30, {
        UpArmR: [-34, -26, -18], LoArmR: [-96, -38, 0], HandR: [-14, -30, 0],
        Chest: [-6, 14, 0], Head: [2, 10, 0]
      }, 'out'),
      // hold it up at eye level, both hands, and READ it
      K(0.75, {
        UpArmL: [-70, 24, 22], LoArmL: [-104, 46, 0], HandL: [-10, 34, 0],
        UpArmR: [-72, -20, -20], LoArmR: [-106, -42, 0], HandR: [-10, -34, 0],
        Chest: [-8, -6, 0], Neck: [8, -2, 0], Head: [12, -4, 0], Hips_pos: [0, -0.036, 0]
      }, 'out'),
      // the scan down the total — head drops a few degrees, twice
      K(1.20, { Head: [16, -4, 0], Neck: [9, -2, 0] }),
      K(1.55, { Head: [10, -4, 0], Neck: [6, -2, 0], Chest: [-9, -8, 0] }),
      // the beat. Nothing moves. This is the joke.
      K(1.95, { Head: [10, -4, 0] }, 'hold'),
      // one eyebrow's worth of a nod, and then the flick
      K(2.15, { Head: [4, -8, 0], Chest: [-6, -10, 0], Hips_pos: [0, -0.024, 0] }, 'out'),
      K(2.42, {
        UpArmR: [-40, -10, -40], LoArmR: [-56, -20, 0], HandR: [12, -70, 0],
        UpArmL: [-24, 16, 16], LoArmL: [-58, 26, 0],
        Chest: [-6, -22, 0], Hips: [-2, 32, 0], Head: [-2, -20, 0]
      }, 'snap'),
      // and he has already stopped caring — hand back down, look away
      K(2.75, {
        UpArmR: [-6, -6, -8], LoArmR: [-26, -14, 0],
        Chest: [-5, -14, 0], Neck: [2, 4, 0], Head: [-4, 10, 0]
      }),
      K(3.30, {})
    ]
  },

  // KO — no dignity in it. He goes over backwards with his arms still up,
  // which reads as surprise rather than as defeat.
  ko: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.14, {
        Hips_pos: [0, 0.020, -0.10], Spine: [-18, -6, 0], Chest: [-14, -9, 0], Head: [-18, -7, 0],
        UpArmL: [-104, 20, 44], LoArmL: [-36, 16, 0], UpArmR: [-102, -16, -42], LoArmR: [-34, -14, 0],
        ThighL: [-28, -3, 0], ShinL: [16, 0, 0], ThighR: [-16, 5, 0], ShinR: [14, 0, 0]
      }, 'snap'),
      K(0.46, {
        Hips_pos: [0, -0.42, -0.34], Hips: [-56, 22, 0], Spine: [-20, -6, 0], Chest: [-12, -9, 0], Head: [-10, -7, 0],
        UpArmL: [-70, 24, 60], UpArmR: [-68, -20, -58],
        ThighL: [-52, -3, 0], ShinL: [40, 0, 0], ThighR: [-40, 5, 0], ShinR: [36, 0, 0]
      }),
      K(0.78, {
        Hips_pos: [0, -0.66, -0.48], Hips: [-84, 20, 0], Spine: [-10, -6, 0], Chest: [-4, -9, 0], Head: [6, -7, 0],
        UpArmL: [-40, 26, 74], LoArmL: [-20, 10, 0], UpArmR: [-38, -22, -72], LoArmR: [-18, -8, 0],
        ThighL: [-56, -3, 0], ShinL: [52, 0, 0], ThighR: [-44, 5, 0], ShinR: [46, 0, 0]
      }, 'out'),
      K(1.10, {
        Hips_pos: [0, -0.70, -0.50], Hips: [-88, 20, 0], Head: [10, -7, 0],
        UpArmL: [-34, 26, 76], UpArmR: [-32, -22, -74],
        ThighL: [-58, -3, 0], ShinL: [54, 0, 0], ThighR: [-46, 5, 0], ShinR: [48, 0, 0]
      })
    ]
  },

  // VICTORY — he does not celebrate. He checks his remaining tags, finds one
  // he did not spend, and looks pleased about the margin.
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.55, {
        UpArmL: [-56, 22, 18], LoArmL: [-98, 42, 0], HandL: [-12, 34, 0],
        Chest: [-8, -10, 0], Neck: [6, -4, 0], Head: [10, -8, 0], Hips_pos: [0, -0.038, 0]
      }, 'out'),
      K(1.30, { Head: [14, -6, 0], Neck: [8, -3, 0], LoArmL: [-102, 46, 0] }),
      K(1.90, {
        Chest: [-5, -16, 0], Neck: [2, 6, 0], Head: [-6, 14, 0],
        UpArmL: [-34, 18, 14], LoArmL: [-62, 30, 0], Hips: [-2, 28, 0], Hips_pos: [0, -0.024, 0]
      }, 'out'),
      K(3.0, {})
    ]
  }
};
