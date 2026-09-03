// ===========================================================================
// KASUMI MIWA — ANIMATION
// ===========================================================================
// THE THESIS: small, fast and precise, with real stillness in the stance —
// the only character in the game who fully stops moving.
//
// ---------------------------------------------------------------------------
// THE TWO POSTURES, and why they are the character
// ---------------------------------------------------------------------------
// Everything in this file is one of two things, and they do not blend:
//
//   THE STUDENT.  Idle, walk, run, hit reactions, taunt, victory. Narrow,
//                 closed, weight on the back foot, shoulders slightly up,
//                 head fractionally forward and down. Her hands fidget. The
//                 idle has the HIGHEST FREQUENCY on the roster (1.55 s, where
//                 Yuki's is 3.4) and the smallest amplitude — a body that is
//                 nervous rather than relaxed. Elbows in, chin tucked, sword
//                 not drawn.
//
//   THE SWORDSWOMAN. The sheathe stance, the draw, the parry, the ultimate.
//                 Completely transformed: square, centred, weight dead even
//                 between the feet, spine stacked, chin level, eyes front.
//                 And STILL — see below.
//
// The transformation happening in a quarter of a second, on a button, is the
// entire read of this character, and it is why the two postures are authored
// as far apart as they are rather than as variations on one neutral.
//
// ---------------------------------------------------------------------------
// THE STILLNESS, which is a real technical decision and not a figure of speech
// ---------------------------------------------------------------------------
// `stance` (RT held) is the only LOOPING clip in this project with two
// IDENTICAL keys and nothing between them. Every other idle in the game
// breathes; this one does not move at all. Not a small amplitude — zero.
//
// That is deliberate and it took holding the nerve to keep. A perfectly static
// character normally reads as a bug, and the instinct is to add a two-degree
// breath to prove the game has not frozen. But the whole point of an iai
// stance is that nothing moves until everything does, and every frame of
// motion in there is a frame of tell. It works because of what is around it:
// her hair is on SPRING CHAINS (see models/miwa.js), so when she arrives in
// the stance the hair keeps travelling for another third of a second and then
// settles — and it is that settling, against a body that has already stopped
// dead, that tells the player the game is running. The springs are doing the
// job the breath normally does, and they are doing it better, because they
// stop.
//
// The charge tiers are shown by the model and the FX, not by the body: see
// combat/newshadow.js. The body just waits.
//
// ---------------------------------------------------------------------------
// THE DRAW — the single most important clip on this character
// ---------------------------------------------------------------------------
// The brief: "one frame of blur and a held follow-through, in the classic iai
// shape." Built exactly that way, and the timing is the whole thing:
//
//   0.00 – 0.34   THE STANCE. Nothing moves. (This is the startup the config
//                 charges 20 frames for, and it is the reason the move is
//                 punishable.)
//   0.34 – 0.37   THE DRAW. TWO FRAMES. One `'in'` key that loads the left
//                 hand back onto the saya, then one `'snap'` key at full
//                 extension. There is no key in between — the blade is at the
//                 hip and then it is through them, and the engine's own
//                 interpolation over two frames at 60 Hz is the blur.
//   0.37 – 0.86   THE FOLLOW-THROUGH, HELD. Half a second of not moving, arm
//                 fully extended across the body, hips still rotated, head
//                 turned to follow the cut. This is where all the weight of
//                 the move actually lives.
//   0.86 – 1.15   CHIBURI AND NOTO — she flicks the blade clean and returns it
//                 to the scabbard, and only THEN does her posture come back
//                 down to the student.
//
// The chiburi/noto tail matters and is not decoration: it is what makes the
// move feel finished rather than interrupted, and it is the recovery the frame
// data is charging for, so the animation and the config agree about what the
// player is paying.
//
// ---------------------------------------------------------------------------
// THE SAYA IS ANIMATED TOO
// ---------------------------------------------------------------------------
// models/miwa.js gives the scabbard its own prop with a `hand` attachment on
// HandL. The draw and the sheathe both call `setSayaHeld(true)` so the left
// hand genuinely grips it and pulls it back as the right draws — the classic
// two-handed iai action, where the scabbard moves as much as the blade does.
// Animating only the sword and leaving the sheath welded to the hip is the
// most common way a procedural draw looks wrong, and it is avoided here.
// ===========================================================================

export const MIWA_STANCE = {
  // THE STUDENT. Narrow, closed, back-weighted. Compare Yuki's open square
  // stance — these two are the extremes of the roster's confidence axis and
  // they are authored to be read against each other.
  Hips_pos: [0, -0.052, 0],
  Hips: [0, 30, 0], Spine: [7, -10, 0], Chest: [6, -13, 0], Neck: [2, -5, 0], Head: [6, -10, 0],
  ClavL: [0, 3, 0], UpArmL: [-26, 14, 6], LoArmL: [-104, 32, 0], HandL: [-20, 78, 0],
  ClavR: [0, -3, 0], UpArmR: [-20, -8, -8], LoArmR: [-110, -28, 0], HandR: [-22, -78, 0],
  ThighL: [-16, -4, 0], ShinL: [17, 0, 0], FootL: [3, -13, 0],
  ThighR: [14, 6, 0], ShinR: [22, 0, 0], FootR: [10, 10, 0]
};

// THE SWORDSWOMAN. Square, centred, level, stacked. Weight is dead even —
// note `Hips_pos` X at exactly 0 and the two thigh angles nearly mirrored,
// which no other pose in this file has.
const CENTRED = {
  Hips_pos: [0, -0.086, 0],
  Hips: [0, 34, 0], Spine: [2, -6, 0], Chest: [1, -8, 0], Neck: [0, -2, 0], Head: [0, -4, 0],
  ClavL: [0, 2, 0], UpArmL: [-46, 30, 8], LoArmL: [-112, 40, 0], HandL: [-12, 92, 0],
  ClavR: [0, -2, 0], UpArmR: [-38, -16, -10], LoArmR: [-104, -34, 0], HandR: [-14, -88, 0],
  ThighL: [-22, -8, 0], ShinL: [26, 0, 0], FootL: [4, -16, 0],
  ThighR: [20, 8, 0], ShinR: [26, 0, 0], FootR: [8, 16, 0]
};

const K = (t, pose, e) => ({ t, pose, e });

export const MIWA_CLIPS = {
  // ---- IDLE: THE FASTEST, SMALLEST BREATH ON THE ROSTER ------------------
  // 1.55 s. Yuki's is 3.40 and Maki's awakened is 3.60. The amplitude is tiny
  // — under a centimetre of hip travel — and there is a small extra motion on
  // the hands, which do not quite settle. Nervous, not tired.
  idle: {
    dur: 1.55, loop: true, keys: [
      K(0, {}),
      K(0.42, { Hips_pos: [0, -0.060, 0], Chest: [7, -13, 0], Spine: [8, -10, 0], Head: [7, -10, 0], UpArmL: [-30, 14, 8], UpArmR: [-24, -8, -10], HandL: [-22, 82, 0] }),
      K(0.86, { Hips_pos: [0, -0.050, 0], HandR: [-26, -74, 0], Head: [6, -12, 0] }),
      K(1.24, { Hips_pos: [0, -0.058, 0], Chest: [7, -13, 0], HandL: [-18, 74, 0], Head: [6, -8, 0] }),
      K(1.55, {})
    ]
  },

  // ---- WALK: short, quick, careful steps ---------------------------------
  // The shortest stride in the game and the highest cadence. She takes small
  // steps because she is not sure she wants to go there.
  walk: {
    dur: 0.72, loop: true, keys: [
      K(0, { ThighL: [-24, -4, 0], ShinL: [16, 0, 0], FootL: [-6, -10, 0], ThighR: [18, 6, 0], ShinR: [26, 0, 0], FootR: [11, 10, 0], Hips_pos: [0, -0.056, 0], UpArmL: [-28, 14, 7], UpArmR: [-24, -8, -9], Spine: [8, -10, 0] }),
      K(0.18, { ThighL: [-6, -4, 0], ShinL: [20, 0, 0], ThighR: [3, 6, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.040, 0] }),
      K(0.36, { ThighL: [18, -4, 0], ShinL: [26, 0, 0], FootL: [11, -10, 0], ThighR: [-24, 6, 0], ShinR: [16, 0, 0], FootR: [-6, 10, 0], Hips_pos: [0, -0.056, 0], UpArmL: [-24, 14, 7], UpArmR: [-28, -8, -9], Spine: [8, -10, 0] }),
      K(0.54, { ThighL: [3, -4, 0], ShinL: [14, 0, 0], ThighR: [-6, 6, 0], ShinR: [20, 0, 0], Hips_pos: [0, -0.040, 0] }),
      K(0.72, { ThighL: [-24, -4, 0], ShinL: [16, 0, 0], FootL: [-6, -10, 0], ThighR: [18, 6, 0], ShinR: [26, 0, 0], FootR: [11, 10, 0], Hips_pos: [0, -0.056, 0], UpArmL: [-28, 14, 7], UpArmR: [-24, -8, -9] })
    ]
  },

  run: {
    dur: 0.44, loop: true, keys: [
      K(0, { Spine: [20, -6, 0], Chest: [13, -9, 0], Hips: [4, 22, 0], ThighL: [-50, -3, 0], ShinL: [28, 0, 0], FootL: [-13, -8, 0], ThighR: [32, 5, 0], ShinR: [66, 0, 0], FootR: [29, 8, 0], UpArmL: [-18, 10, 8], LoArmL: [-112, 0, 4], UpArmR: [-70, -8, -10], LoArmR: [-100, 0, -4], Hips_pos: [0, -0.038, 0] }),
      K(0.11, { Spine: [18, -6, 0], ThighL: [-10, -3, 0], ShinL: [30, 0, 0], ThighR: [-16, 5, 0], ShinR: [40, 0, 0], Hips_pos: [0, -0.074, 0] }),
      K(0.22, { Spine: [20, -6, 0], Chest: [13, -9, 0], Hips: [4, 22, 0], ThighL: [32, -3, 0], ShinL: [66, 0, 0], FootL: [29, -8, 0], ThighR: [-50, 5, 0], ShinR: [28, 0, 0], FootR: [-13, 8, 0], UpArmL: [-70, 10, 8], LoArmL: [-100, 0, 4], UpArmR: [-18, -8, -10], LoArmR: [-112, 0, -4], Hips_pos: [0, -0.038, 0] }),
      K(0.33, { Spine: [18, -6, 0], ThighL: [-16, -3, 0], ShinL: [40, 0, 0], ThighR: [-10, 5, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.074, 0] }),
      K(0.44, { Spine: [20, -6, 0], Chest: [13, -9, 0], Hips: [4, 22, 0], ThighL: [-50, -3, 0], ShinL: [28, 0, 0], FootL: [-13, -8, 0], ThighR: [32, 5, 0], ShinR: [66, 0, 0], FootR: [29, 8, 0], UpArmL: [-18, 10, 8], UpArmR: [-70, -8, -10] })
    ]
  },

  // ---- DASH, and the STEP-BACK -------------------------------------------
  dash: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.07, { Spine: [22, -6, 0], Chest: [13, -9, 0], Hips_pos: [0, -0.116, 0], ThighL: [-46, -4, 0], ShinL: [32, 0, 0], ThighR: [28, 6, 0], ShinR: [54, 0, 0], UpArmL: [22, 12, 14], LoArmL: [-48, 0, 6], UpArmR: [26, -8, -16], LoArmR: [-44, 0, -6] }, 'out'),
      K(0.30, { Spine: [16, -8, 0], Hips_pos: [0, -0.082, 0], ThighL: [-34, -4, 0], ShinL: [24, 0, 0], ThighR: [20, 6, 0], ShinR: [40, 0, 0], UpArmL: [10, 12, 12], UpArmR: [14, -8, -14] })
    ]
  },
  // THE STEP-BACK. Her retreat option, and it is a swordsman's retreat: she
  // does not turn, she slides back on the same line with the guard unchanged.
  // Facing preserved, weight pushed onto the rear foot, and she is already
  // ready when it ends. That is what makes it a spacing tool rather than a
  // panic button.
  stepBack: {
    dur: 0.32, loop: false, keys: [
      K(0, {}),
      K(0.08, { Hips_pos: [0, -0.078, 0], Spine: [3, -10, 0], Chest: [2, -13, 0], Head: [2, -10, 0], ThighL: [8, -4, 0], ShinL: [22, 0, 0], ThighR: [-22, 6, 0], ShinR: [30, 0, 0], UpArmL: [-38, 20, 8], LoArmL: [-110, 36, 0], UpArmR: [-30, -12, -10] }, 'out'),
      K(0.32, {})
    ]
  },

  // ---- BLOCK, and the PARRY ----------------------------------------------
  // Blade up across the body, both hands on the hilt. Real fundamentals — she
  // is the only character on the roster who guards WITH something and knows
  // how.
  block: {
    dur: 0.14, loop: false, keys: [
      K(0, {}),
      K(0.09, { UpArmL: [-70, 34, 10], LoArmL: [-100, 42, 0], HandL: [-12, 96, 0], UpArmR: [-80, -22, -10], LoArmR: [-98, -38, 0], HandR: [-12, -100, 0], Spine: [8, -10, 0], Chest: [7, -13, 0], Head: [8, -10, 0], Hips_pos: [0, -0.082, 0], ThighL: [-22, -4, 0], ShinL: [24, 0, 0] }, 'out'),
      K(0.14, { UpArmL: [-70, 34, 10], LoArmL: [-100, 42, 0], UpArmR: [-80, -22, -10], LoArmR: [-98, -38, 0], Hips_pos: [0, -0.082, 0] })
    ]
  },
  // THE PARRY — a well-timed input on the guard. A short, sharp DEFLECTION:
  // the blade rolls off the line and her whole body turns a few degrees with
  // it, which is what a parry is (redirecting) rather than what a block is
  // (absorbing). Fast in, fast out, and she finishes in the centred posture
  // rather than back in the guard, because a successful parry is an opening.
  parry: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.06, { Hips: [0, 46, 0], Spine: [4, -22, 0], Chest: [3, -26, 0], UpArmL: [-82, 22, 14], LoArmL: [-86, 30, 0], UpArmR: [-92, -30, -6], LoArmR: [-82, -44, 0], HandR: [-8, -110, 0], Hips_pos: [0, -0.090, 0] }, 'snap'),
      K(0.13, { Hips: [0, 42, 0], Spine: [4, -20, 0], UpArmL: [-80, 20, 14], UpArmR: [-90, -28, -6] }, 'hold'),
      K(0.34, CENTRED)
    ]
  },

  // =========================================================================
  // THE SWORD STRING — fast, clean, low damage
  // =========================================================================
  // Short travel, high frequency, and every cut ends ON A LINE rather than
  // trailing off. She is precise. The whole string is 0.62 s of clip against
  // Yuki's 1.68 for the same three hits.
  punch1: {
    dur: 0.20, loop: false, keys: [
      K(0, {}),
      K(0.04, { Hips: [0, 44, 0], UpArmR: [-46, -22, -14], LoArmR: [-92, -30, 0] }, 'in'),
      K(0.09, { Hips: [0, 16, 0], Spine: [8, -2, 0], UpArmR: [-84, 8, -6], LoArmR: [-30, 6, 0], HandR: [-6, -50, 0], Hips_pos: [0, -0.056, 0] }, 'snap'),
      K(0.13, { Hips: [0, 18, 0], UpArmR: [-80, 7, -6] }, 'hold'),
      K(0.20, {})
    ]
  },
  punch2: {
    dur: 0.21, loop: false, keys: [
      K(0, {}),
      K(0.04, { Hips: [0, 14, 0], UpArmR: [-98, 10, -4], LoArmR: [-44, 12, 0] }, 'in'),
      K(0.10, { Hips: [0, 42, 0], Spine: [9, -14, 0], UpArmR: [-44, -20, -16], LoArmR: [-54, -24, 0], HandR: [-10, -64, 0], Hips_pos: [0, -0.056, 0] }, 'snap'),
      K(0.14, { Hips: [0, 40, 0], UpArmR: [-46, -18, -16] }, 'hold'),
      K(0.21, {})
    ]
  },
  punch3: {
    // THE KNOCKDOWN — a descending diagonal (kesagiri), high-right to
    // low-left, finishing with the point at the floor. Not a launcher: she
    // cuts people down, she does not lift them.
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.07, { Hips: [0, 12, 0], Spine: [-10, 8, 0], Chest: [-8, 10, 0], Head: [-4, -8, 0], UpArmR: [-152, 8, -10], LoArmR: [-26, 6, 0], UpArmL: [-120, 24, 12], Hips_pos: [0, -0.030, 0] }, 'in'),
      K(0.16, { Hips: [0, 52, 0], Spine: [22, -20, 0], Chest: [17, -24, 0], Head: [14, -10, 0], UpArmR: [-24, -22, -18], LoArmR: [-44, -26, 0], HandR: [-14, -60, 0], UpArmL: [-30, 26, 10], Hips_pos: [0, -0.128, 0], ThighL: [-32, -4, 0], ShinL: [36, 0, 0], ThighR: [26, 6, 0], ShinR: [38, 0, 0] }, 'snap'),
      K(0.22, { Hips: [0, 50, 0], Spine: [21, -18, 0], Hips_pos: [0, -0.124, 0], UpArmR: [-26, -20, -18] }, 'hold'),
      K(0.34, {})
    ]
  },

  heavy: {
    dur: 0.60, loop: false, keys: [
      K(0, {}),
      K(0.13, { Spine: [-18, -8, 0], Chest: [-15, -10, 0], Head: [-9, -10, 0], UpArmL: [-158, 22, 12], LoArmL: [-26, 18, 0], UpArmR: [-162, -16, -10], LoArmR: [-22, -12, 0], Hips_pos: [0, -0.014, 0] }, 'in'),
      K(0.25, { Spine: [30, -8, 0], Chest: [21, -11, 0], Head: [14, -10, 0], UpArmL: [-44, 26, 8], LoArmL: [-46, 28, 0], UpArmR: [-48, -18, -8], LoArmR: [-42, -22, 0], Hips_pos: [0, -0.130, 0], ThighL: [-34, -4, 0], ShinL: [38, 0, 0], ThighR: [28, 6, 0], ShinR: [40, 0, 0] }, 'snap'),
      K(0.34, { Spine: [28, -8, 0], Hips_pos: [0, -0.126, 0], UpArmL: [-42, 26, 8], UpArmR: [-46, -18, -8] }, 'hold'),
      K(0.60, {})
    ]
  },

  // =========================================================================
  // THE SHEATHE STANCE — RT held. THE STILLNESS.
  // =========================================================================
  // Two identical keys and nothing between them. See the header: this is the
  // only clip in the project that genuinely does not move, and the hair
  // springs are what keep it from reading as a freeze.
  //
  // The pose itself is the classic iai kamae: left hand at the koiguchi with
  // the thumb on the guard, right hand hovering at the hilt without gripping
  // it, blade horizontal at the left hip, edge up, hips squared to the target.
  stance: {
    dur: 1.00, loop: true, keys: [
      K(0, {
        ...CENTRED,
        // the left hand takes the scabbard; the right waits at the hilt
        UpArmL: [-30, 40, 4], LoArmL: [-96, 52, 0], HandL: [-6, 104, 0],
        UpArmR: [-24, -30, -4], LoArmR: [-88, -48, 0], HandR: [-8, -100, 0]
      }),
      K(1.00, {
        ...CENTRED,
        UpArmL: [-30, 40, 4], LoArmL: [-96, 52, 0], HandL: [-6, 104, 0],
        UpArmR: [-24, -30, -4], LoArmR: [-88, -48, 0], HandR: [-8, -100, 0]
      })
    ]
  },
  // The entry into it. A quarter of a second, and it is the transformation:
  // she goes from the closed nervous neutral to square and centred in one
  // motion, and then stops.
  stanceEnter: {
    dur: 0.26, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        ...CENTRED,
        UpArmL: [-30, 40, 4], LoArmL: [-96, 52, 0], HandL: [-6, 104, 0],
        UpArmR: [-24, -30, -4], LoArmR: [-88, -48, 0], HandR: [-8, -100, 0]
      }, 'out'),
      K(0.26, {
        ...CENTRED,
        UpArmL: [-30, 40, 4], LoArmL: [-96, 52, 0], HandL: [-6, 104, 0],
        UpArmR: [-24, -30, -4], LoArmR: [-88, -48, 0], HandR: [-8, -100, 0]
      }, 'hold')
    ]
  },

  // =========================================================================
  // THE DRAW — NEW SHADOW STYLE. The most important clip on this character.
  // =========================================================================
  // See the header for the beat-by-beat timing and why it is built this way.
  // The load-bearing detail is that there is NO KEY between 0.34 and 0.37:
  // the blade is at the hip on one frame and fully extended two frames later,
  // and the interpolation across that gap is the blur. Adding a mid-swing key
  // — which is the instinct — would turn an iai draw into a normal sword
  // swing and lose the entire move.
  ct1: {
    dur: 1.15, loop: false, keys: [
      // ---- 0.00–0.34: THE STANCE. Nothing moves. --------------------------
      K(0, {
        ...CENTRED,
        UpArmL: [-30, 40, 4], LoArmL: [-96, 52, 0], HandL: [-6, 104, 0],
        UpArmR: [-24, -30, -4], LoArmR: [-88, -48, 0], HandR: [-8, -100, 0]
      }),
      K(0.34, {
        ...CENTRED,
        UpArmL: [-30, 40, 4], LoArmL: [-96, 52, 0], HandL: [-6, 104, 0],
        UpArmR: [-24, -30, -4], LoArmR: [-88, -48, 0], HandR: [-8, -100, 0]
      }, 'hold'),
      // ---- 0.34–0.37: THE DRAW. TWO FRAMES. -------------------------------
      // the left hand hauls the saya BACK — this is half the draw and it is
      // the half that is usually forgotten
      K(0.353, {
        ...CENTRED,
        Hips: [0, 52, 0], Spine: [3, -16, 0],
        UpArmL: [-16, 54, 2], LoArmL: [-104, 66, 0], HandL: [-4, 116, 0],
        UpArmR: [-18, -44, -2], LoArmR: [-96, -60, 0]
      }, 'in'),
      K(0.37, {
        // FULL EXTENSION. Hips fully rotated through, arm straight across the
        // body, head turned to follow the point. This is the contact frame.
        Hips: [0, -18, 0], Spine: [4, 28, 0], Chest: [3, 34, 0], Neck: [0, 6, 0], Head: [-2, 12, 0],
        UpArmR: [-96, 30, -4], LoArmR: [-8, 14, 0], HandR: [-4, -36, 0],
        UpArmL: [-24, 56, 6], LoArmL: [-118, 68, 0], HandL: [-6, 120, 0],
        Hips_pos: [0, -0.078, 0],
        ThighL: [-30, -8, 0], ShinL: [32, 0, 0], FootL: [4, -16, 0],
        ThighR: [26, 8, 0], ShinR: [30, 0, 0], FootR: [8, 16, 0]
      }, 'snap'),
      // ---- 0.37–0.86: THE FOLLOW-THROUGH, HELD ---------------------------
      // Half a second of stone. Everything that makes this move feel like it
      // mattered happens here, and it happens by nothing happening.
      K(0.86, {
        Hips: [0, -18, 0], Spine: [4, 28, 0], Chest: [3, 34, 0], Neck: [0, 6, 0], Head: [-2, 12, 0],
        UpArmR: [-96, 30, -4], LoArmR: [-8, 14, 0], HandR: [-4, -36, 0],
        UpArmL: [-24, 56, 6], LoArmL: [-118, 68, 0], HandL: [-6, 120, 0],
        Hips_pos: [0, -0.078, 0],
        ThighL: [-30, -8, 0], ShinL: [32, 0, 0], FootL: [4, -16, 0],
        ThighR: [26, 8, 0], ShinR: [30, 0, 0], FootR: [8, 16, 0]
      }, 'hold'),
      // ---- 0.86–1.15: CHIBURI AND NOTO -----------------------------------
      // the blood flick: a short sharp snap of the wrist down and out
      K(0.94, {
        Hips: [0, 10, 0], Spine: [5, 8, 0], Chest: [4, 10, 0], Head: [2, -2, 0],
        UpArmR: [-52, 6, -12], LoArmR: [-40, 10, 0], HandR: [-30, -46, 0],
        UpArmL: [-30, 44, 6], LoArmL: [-104, 56, 0], Hips_pos: [0, -0.082, 0]
      }, 'snap'),
      // ...and the blade goes home. She watches it in, which is what a trained
      // swordsman does and an untrained one does not.
      K(1.06, {
        ...CENTRED, Head: [10, -6, 0], Neck: [4, -2, 0],
        UpArmL: [-32, 42, 4], LoArmL: [-100, 54, 0], HandL: [-6, 106, 0],
        UpArmR: [-30, -34, -4], LoArmR: [-84, -50, 0], HandR: [-8, -96, 0]
      }, 'out'),
      // and only now does the student come back
      K(1.15, {})
    ]
  },

  // =========================================================================
  // SIMPLE DOMAIN — B. The circle, inscribed.
  // =========================================================================
  // The brief asks for the ring to be "drawn rather than appearing", and the
  // BODY has to be what draws it. So: she plants, and sweeps the blade in one
  // hard horizontal arc all the way around herself at hip height, turning
  // through the full rotation with it. The ring in combat/newshadow.js is
  // inscribed in step with this sweep — the geometry follows the blade tip,
  // so the two are the same motion.
  //
  // She finishes low and centred, which is the posture she has to hold for as
  // long as the circle is up.
  special: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      // load: blade drawn back across the body, weight dropped
      K(0.14, { Hips: [0, 68, 0], Spine: [6, -30, 0], Chest: [5, -36, 0], Head: [4, -14, 0], UpArmR: [-40, -34, -12], LoArmR: [-88, -44, 0], UpArmL: [-46, 40, 8], Hips_pos: [0, -0.120, 0], ThighL: [-30, -6, 0], ShinL: [34, 0, 0], ThighR: [26, 8, 0], ShinR: [34, 0, 0] }, 'in'),
      // THE SWEEP — a full turn, blade level at hip height. `Hips` ry runs all
      // the way from 68 to -60, which is the largest single rotation in the
      // project, and it is what inscribes the ring.
      K(0.34, { Hips: [0, 0, 0], Spine: [4, 6, 0], Chest: [3, 8, 0], Head: [0, 4, 0], UpArmR: [-84, 4, -14], LoArmR: [-30, 10, 0], HandR: [-8, -60, 0], UpArmL: [-52, 24, 10], Hips_pos: [0, -0.112, 0] }, 'snap'),
      K(0.46, { Hips: [0, -60, 0], Spine: [4, 34, 0], Chest: [3, 40, 0], Neck: [0, 8, 0], Head: [-2, 14, 0], UpArmR: [-92, 34, -4], LoArmR: [-16, 16, 0], HandR: [-6, -44, 0], UpArmL: [-40, 50, 12], LoArmL: [-96, 58, 0], Hips_pos: [0, -0.108, 0], ThighL: [-28, -8, 0], ThighR: [24, 8, 0] }, 'snap'),
      K(0.54, { Hips: [0, -56, 0], Spine: [4, 32, 0], UpArmR: [-90, 32, -4] }, 'hold'),
      // and she settles into the hold posture: low, centred, blade out, ready
      // for anything that crosses the line
      K(0.72, { ...CENTRED, Hips_pos: [0, -0.104, 0], UpArmR: [-62, -6, -12], LoArmR: [-64, -20, 0], HandR: [-12, -70, 0], UpArmL: [-48, 32, 8], LoArmL: [-100, 42, 0] })
    ]
  },
  // THE HOLD, while the circle is up. A slow, tiny sway — she IS moving here,
  // unlike in the sheathe stance, because she is watching the perimeter and a
  // completely static figure inside a rotating ring reads as a statue. The
  // amplitude is still under a centimetre.
  sdHold: {
    dur: 2.20, loop: true, keys: [
      K(0, { ...CENTRED, Hips_pos: [0, -0.104, 0], UpArmR: [-62, -6, -12], LoArmR: [-64, -20, 0], HandR: [-12, -70, 0], UpArmL: [-48, 32, 8], LoArmL: [-100, 42, 0] }),
      K(0.55, { ...CENTRED, Hips_pos: [0, -0.110, 0], Hips: [0, 44, 0], Head: [0, -14, 0], Neck: [0, -6, 0], UpArmR: [-64, -8, -12], LoArmR: [-64, -20, 0], UpArmL: [-46, 32, 8], LoArmL: [-100, 42, 0] }),
      K(1.10, { ...CENTRED, Hips_pos: [0, -0.104, 0], UpArmR: [-62, -6, -12], LoArmR: [-64, -20, 0], UpArmL: [-48, 32, 8], LoArmL: [-100, 42, 0] }),
      K(1.65, { ...CENTRED, Hips_pos: [0, -0.110, 0], Hips: [0, 24, 0], Head: [0, 6, 0], Neck: [0, 2, 0], UpArmR: [-60, -4, -12], LoArmR: [-64, -20, 0], UpArmL: [-50, 32, 8], LoArmL: [-100, 42, 0] }),
      K(2.20, { ...CENTRED, Hips_pos: [0, -0.104, 0], UpArmR: [-62, -6, -12], LoArmR: [-64, -20, 0], UpArmL: [-48, 32, 8], LoArmL: [-100, 42, 0] })
    ]
  },
  // THE AUTO-COUNTER. Fired by the circle, not by the player, so it has to be
  // SHORT — it interleaves with whatever she is doing and must never take the
  // body away from her for long. 0.22 s, one clean arc, straight back to the
  // hold. Restraint reads as skill here, which is the same note the visual
  // effect is built on.
  counter: {
    dur: 0.22, loop: false, keys: [
      K(0, {}),
      K(0.05, { Hips: [0, 54, 0], UpArmR: [-48, -26, -12], LoArmR: [-78, -32, 0] }, 'in'),
      K(0.10, { Hips: [0, 4, 0], Spine: [4, 16, 0], UpArmR: [-90, 20, -6], LoArmR: [-20, 12, 0], HandR: [-6, -48, 0] }, 'snap'),
      K(0.14, { Hips: [0, 6, 0], UpArmR: [-88, 18, -6] }, 'hold'),
      K(0.22, { ...CENTRED, Hips_pos: [0, -0.104, 0], UpArmR: [-62, -6, -12], LoArmR: [-64, -20, 0], UpArmL: [-48, 32, 8], LoArmL: [-100, 42, 0] })
    ]
  },

  // =========================================================================
  // THE ULTIMATE — the maximum draw, at Simple Domain range
  // =========================================================================
  // "One frame of contact, one clean line, then the aftermath. Understated and
  // lethal — the opposite of Todo's or Yuki's ultimates."
  //
  // So it is the DRAW again, stretched: a much longer stance (1.1 s of
  // absolute stillness while the circle expands around her), the same
  // two-frame draw, and then a follow-through held for nearly a second. There
  // is no flourish anywhere in this clip and no second hit. The restraint is
  // the point, and it is why this is the shortest ULT clip in the project by
  // key count and one of the longest by duration.
  ult: {
    dur: 3.00, loop: false, keys: [
      K(0, {}),
      // she settles into the deepest stance in her set
      K(0.30, {
        ...CENTRED, Hips_pos: [0, -0.118, 0],
        UpArmL: [-28, 44, 2], LoArmL: [-98, 58, 0], HandL: [-4, 110, 0],
        UpArmR: [-22, -36, -2], LoArmR: [-92, -54, 0], HandR: [-6, -104, 0],
        ThighL: [-30, -10, 0], ShinL: [34, 0, 0], ThighR: [28, 10, 0], ShinR: [34, 0, 0]
      }, 'in'),
      // ---- 1.1 SECONDS OF NOTHING. The circle is expanding; she is not
      // moving. This is the longest held key in the project.
      K(1.42, {
        ...CENTRED, Hips_pos: [0, -0.118, 0],
        UpArmL: [-28, 44, 2], LoArmL: [-98, 58, 0], HandL: [-4, 110, 0],
        UpArmR: [-22, -36, -2], LoArmR: [-92, -54, 0], HandR: [-6, -104, 0],
        ThighL: [-30, -10, 0], ShinL: [34, 0, 0], ThighR: [28, 10, 0], ShinR: [34, 0, 0]
      }, 'hold'),
      // ---- THE DRAW. Two frames, exactly as ct1. -------------------------
      K(1.437, {
        ...CENTRED, Hips: [0, 56, 0], Spine: [3, -18, 0], Hips_pos: [0, -0.116, 0],
        UpArmL: [-14, 58, 0], LoArmL: [-106, 70, 0], HandL: [-4, 120, 0],
        UpArmR: [-16, -48, 0], LoArmR: [-98, -64, 0]
      }, 'in'),
      K(1.47, {
        Hips: [0, -26, 0], Spine: [4, 34, 0], Chest: [3, 40, 0], Neck: [0, 8, 0], Head: [-2, 15, 0],
        UpArmR: [-98, 36, -2], LoArmR: [-6, 16, 0], HandR: [-4, -32, 0],
        UpArmL: [-22, 60, 6], LoArmL: [-120, 72, 0], HandL: [-6, 124, 0],
        Hips_pos: [0, -0.094, 0],
        ThighL: [-34, -10, 0], ShinL: [36, 0, 0], FootL: [4, -18, 0],
        ThighR: [30, 10, 0], ShinR: [34, 0, 0], FootR: [8, 18, 0]
      }, 'snap'),
      // ---- THE AFTERMATH. Held, and held, and held. ----------------------
      K(2.36, {
        Hips: [0, -26, 0], Spine: [4, 34, 0], Chest: [3, 40, 0], Neck: [0, 8, 0], Head: [-2, 15, 0],
        UpArmR: [-98, 36, -2], LoArmR: [-6, 16, 0], HandR: [-4, -32, 0],
        UpArmL: [-22, 60, 6], LoArmL: [-120, 72, 0], HandL: [-6, 124, 0],
        Hips_pos: [0, -0.094, 0],
        ThighL: [-34, -10, 0], ShinL: [36, 0, 0], FootL: [4, -18, 0],
        ThighR: [30, 10, 0], ShinR: [34, 0, 0], FootR: [8, 18, 0]
      }, 'hold'),
      // chiburi, noto, and the student comes back — she is immediately
      // embarrassed about it, which is the joke and the character
      K(2.52, {
        Hips: [0, 12, 0], Spine: [5, 8, 0], Head: [2, -2, 0],
        UpArmR: [-52, 6, -12], LoArmR: [-40, 10, 0], HandR: [-30, -46, 0],
        UpArmL: [-30, 46, 6], LoArmL: [-104, 58, 0], Hips_pos: [0, -0.096, 0]
      }, 'snap'),
      K(2.72, { ...CENTRED, Head: [12, -6, 0], Neck: [5, -2, 0] }, 'out'),
      K(3.00, {})
    ]
  },

  // ---- TAUNT: D-pad Left -------------------------------------------------
  // She points the sword at them, holds it for a beat, realises what she has
  // done, and lowers it slightly. The only taunt in the game that RETREATS
  // halfway through, and it is the funniest and truest thing about her.
  taunt: {
    dur: 1.60, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-88, 12, -6], LoArmR: [-18, 8, 0], HandR: [-6, -48, 0], Spine: [3, -4, 0], Chest: [2, -6, 0], Head: [0, -4, 0], Neck: [0, -2, 0], Hips_pos: [0, -0.068, 0] }, 'snap'),
      K(0.52, { UpArmR: [-90, 13, -6], LoArmR: [-17, 8, 0], Head: [0, -4, 0] }, 'hold'),
      // the second thoughts
      K(0.80, { UpArmR: [-74, 8, -8], LoArmR: [-34, 8, 0], Head: [5, -8, 0], Neck: [2, -4, 0], Chest: [4, -10, 0] }, 'in'),
      K(1.06, { UpArmR: [-58, 2, -10], LoArmR: [-58, -6, 0], Head: [7, -10, 0], Chest: [6, -13, 0], Hips_pos: [0, -0.056, 0] }, 'out'),
      K(1.60, {})
    ]
  },

  // ---- VICTORY -----------------------------------------------------------
  // She sheathes the blade properly — the one thing she is genuinely good at
  // — and then immediately goes back to standing like a worried student.
  victory: {
    dur: 2.80, loop: false, keys: [
      K(0, {}),
      K(0.34, { ...CENTRED, Head: [4, -6, 0] }, 'in'),
      K(0.70, { ...CENTRED, Head: [8, -6, 0], UpArmL: [-32, 44, 4], LoArmL: [-102, 56, 0], UpArmR: [-30, -36, -4], LoArmR: [-86, -52, 0] }, 'out'),
      K(1.10, { ...CENTRED, Head: [10, -6, 0] }, 'hold'),
      // ...and then the shoulders come back up and she is herself again
      K(1.70, { Hips_pos: [0, -0.050, 0], Spine: [7, -10, 0], Chest: [6, -13, 0], Head: [7, -10, 0], UpArmL: [-26, 14, 6], UpArmR: [-20, -8, -8] }, 'out'),
      K(2.80, {})
    ]
  }
};
