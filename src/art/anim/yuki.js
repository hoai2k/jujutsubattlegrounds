// ===========================================================================
// YUKI TSUKUMO — ANIMATION
// ===========================================================================
// THE THESIS: heavy and unhurried, with enormous follow-through.
//
// She is the roster's first true heavyweight-by-timing rather than
// heavyweight-by-size. Todo is bigger; Yuki hits harder because of what she
// adds to the hit, and the animation has to carry mass that is not in the
// body. Three rules, applied to every clip in this file:
//
//   1. NOTHING STARTS QUICKLY. Every technique opens on a long `'in'` key —
//      the wind-ups here are the longest in the project, up to a third of a
//      second before anything moves forward. That anticipation IS the mass:
//      a heavy object takes time to get going, and the animation is the only
//      place that can be said.
//
//   2. NOTHING STOPS AT THE TARGET. Every strike overshoots and keeps
//      travelling past the contact frame, then decelerates over a long tail.
//      The follow-through key is usually as long as the strike itself. This is
//      the single biggest difference from every other character in the game,
//      all of whom recover crisply.
//
//   3. THE HIPS LEAD AND THE FEET PLANT. She steps INTO everything, and the
//      planted foot arrives before the hand does. Nobody else in the roster
//      moves their base this much.
//
// AND BETWEEN ACTIONS: SWAGGER. The brief asks for "an easy swagger between
// actions", which is the opposite of the above and has to coexist with it.
// The solve is that the LOCOMOTION is loose and rolling — a big lateral hip
// sway, shoulders counter-rotating, arms swinging wide and late — while the
// ATTACKS are planted and deliberate. She saunters, then she commits. Getting
// that contrast is most of what makes her read as relaxed-but-dangerous rather
// than as slow.
//
// ---------------------------------------------------------------------------
// THE MASS-TELL IN THE POSE
// ---------------------------------------------------------------------------
// At high mass she is armoured and cannot be knocked back, and the model shows
// it with the shimmer and the infalling dust (see models/yuki.js). The
// ANIMATION shows it too, via `idleHeavy` / `walkHeavy`, swapped in by
// combat/fighter.js `_clip` past the armour threshold — the same mechanism
// Kashimo's coiled cycles use. In the heavy set she is lower, wider, her feet
// are further apart and she barely moves at all. It is the posture of somebody
// who currently weighs several tonnes and it is how the opponent reads her
// meter from across the arena without looking at the HUD.
// ===========================================================================

export const YUKI_STANCE = {
  // Tall, upright, and OPEN. Her guard is not much of a guard: hands low,
  // chest square, weight even. That openness is the confidence, and it is also
  // honest — she does not need to protect herself from most things.
  Hips_pos: [0, -0.030, 0],
  Hips: [0, 20, 0], Spine: [1, -5, 0], Chest: [-1, -7, 0], Neck: [0, -3, 0], Head: [-2, -6, 0],
  ClavL: [0, 2, 0], UpArmL: [-14, 8, 14], LoArmL: [-52, 20, 0], HandL: [-10, 46, 0],
  ClavR: [0, -2, 0], UpArmR: [-10, -6, -16], LoArmR: [-46, -16, 0], HandR: [-12, -46, 0],
  ThighL: [-11, -4, 0], ShinL: [10, 0, 0], FootL: [2, -13, 0],
  ThighR: [9, 6, 0], ShinR: [13, 0, 0], FootR: [7, 10, 0]
};

const S = YUKI_STANCE;
const K = (t, pose, e) => ({ t, pose, e });

export const YUKI_CLIPS = {
  // ---- IDLE: the slowest breath on the roster bar Maki's awakened one -----
  // 3.4 s, and the amplitude is large: a big person breathing easily. The
  // WEIGHT SHIFT is the detail — she rocks slightly from foot to foot across
  // the cycle rather than bobbing straight up and down, which is what stops a
  // tall idle reading as a lamppost.
  idle: {
    dur: 3.40, loop: true, keys: [
      K(0, {}),
      K(0.85, { Hips_pos: [0.020, -0.042, 0], Hips: [0, 23, 0], Chest: [1, -7, 0], Spine: [3, -5, 0], Head: [-1, -4, 0], UpArmL: [-20, 8, 18], UpArmR: [-14, -6, -19], ThighL: [-14, -4, 0], ThighR: [11, 6, 0] }),
      K(1.70, { Hips_pos: [0, -0.030, 0] }),
      K(2.55, { Hips_pos: [-0.020, -0.042, 0], Hips: [0, 17, 0], Chest: [1, -7, 0], Spine: [3, -5, 0], Head: [-1, -8, 0], UpArmL: [-14, 8, 18], UpArmR: [-20, -6, -19], ThighL: [-8, -4, 0], ThighR: [6, 6, 0] }),
      K(3.40, {})
    ]
  },

  // ---- IDLE AT HIGH MASS -------------------------------------------------
  // Lower, wider, and almost completely still — the breath amplitude drops to
  // a third. She weighs a building and the animation says so by REFUSING TO
  // MOVE, which is far more effective than any amount of straining.
  idleHeavy: {
    dur: 4.20, loop: true, keys: [
      K(0, { Hips_pos: [0, -0.098, 0], Hips: [0, 22, 0], Spine: [6, -5, 0], Chest: [4, -7, 0], Head: [1, -6, 0], UpArmL: [-22, 12, 22], LoArmL: [-64, 24, 0], UpArmR: [-18, -9, -24], LoArmR: [-58, -20, 0], ThighL: [-24, -8, 0], ShinL: [26, 0, 0], FootL: [4, -18, 0], ThighR: [20, 10, 0], ShinR: [28, 0, 0], FootR: [10, 15, 0] }),
      K(2.10, { Hips_pos: [0, -0.104, 0], Hips: [0, 22, 0], Spine: [7, -5, 0], Chest: [5, -7, 0], Head: [2, -6, 0], UpArmL: [-25, 12, 23], LoArmL: [-64, 24, 0], UpArmR: [-21, -9, -25], LoArmR: [-58, -20, 0], ThighL: [-24, -8, 0], ShinL: [26, 0, 0], FootL: [4, -18, 0], ThighR: [20, 10, 0], ShinR: [28, 0, 0], FootR: [10, 15, 0] }),
      K(4.20, { Hips_pos: [0, -0.098, 0], Hips: [0, 22, 0], Spine: [6, -5, 0], Chest: [4, -7, 0], Head: [1, -6, 0], UpArmL: [-22, 12, 22], LoArmL: [-64, 24, 0], UpArmR: [-18, -9, -24], LoArmR: [-58, -20, 0], ThighL: [-24, -8, 0], ShinL: [26, 0, 0], FootL: [4, -18, 0], ThighR: [20, 10, 0], ShinR: [28, 0, 0], FootR: [10, 15, 0] })
    ]
  },

  // ---- WALK: THE SWAGGER -------------------------------------------------
  // A big lateral hip sway (Hips_pos X swings ±3.2 cm — the largest in the
  // project), shoulders counter-rotating against it, and the arms swinging
  // WIDE and arriving LATE. Long cycle, long stride. This is the clip that
  // has to read as "relaxed in a way that reads as earned", and it does the
  // job the face cannot do at gameplay distance.
  walk: {
    dur: 1.02, loop: true, keys: [
      K(0, { ThighL: [-32, -4, 0], ShinL: [12, 0, 0], FootL: [-9, -12, 0], ThighR: [25, 6, 0], ShinR: [30, 0, 0], FootR: [16, 10, 0], Hips_pos: [0.032, -0.034, 0], Hips: [0, 30, 0], Chest: [-1, -16, 0], Spine: [2, -10, 0], UpArmL: [-34, 12, 20], LoArmL: [-40, 18, 0], UpArmR: [-42, -8, -22], LoArmR: [-36, -14, 0] }),
      K(0.255, { ThighL: [-8, -4, 0], ShinL: [22, 0, 0], ThighR: [3, 6, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.010, 0], Hips: [0, 20, 0], Chest: [-1, -7, 0] }),
      K(0.51, { ThighL: [25, -4, 0], ShinL: [30, 0, 0], FootL: [16, -12, 0], ThighR: [-32, 6, 0], ShinR: [12, 0, 0], FootR: [-9, 10, 0], Hips_pos: [-0.032, -0.034, 0], Hips: [0, 10, 0], Chest: [-1, 2, 0], Spine: [2, 0, 0], UpArmL: [-42, 12, 20], LoArmL: [-36, 18, 0], UpArmR: [-34, -8, -22], LoArmR: [-40, -14, 0] }),
      K(0.765, { ThighL: [3, -4, 0], ShinL: [14, 0, 0], ThighR: [-8, 6, 0], ShinR: [22, 0, 0], Hips_pos: [0, -0.010, 0], Hips: [0, 20, 0], Chest: [-1, -7, 0] }),
      K(1.02, { ThighL: [-32, -4, 0], ShinL: [12, 0, 0], FootL: [-9, -12, 0], ThighR: [25, 6, 0], ShinR: [30, 0, 0], FootR: [16, 10, 0], Hips_pos: [0.032, -0.034, 0], Hips: [0, 30, 0], Chest: [-1, -16, 0], UpArmL: [-34, 12, 20], UpArmR: [-42, -8, -22] })
    ]
  },
  // AT HIGH MASS the swagger is gone entirely. Short strides, feet barely
  // leaving the floor, hips almost level — she is dragging herself, and the
  // trade she is making is visible without a HUD.
  walkHeavy: {
    dur: 1.30, loop: true, keys: [
      K(0, { ThighL: [-16, -8, 0], ShinL: [16, 0, 0], FootL: [-3, -18, 0], ThighR: [13, 10, 0], ShinR: [22, 0, 0], FootR: [8, 15, 0], Hips_pos: [0.008, -0.100, 0], Hips: [0, 23, 0], Spine: [7, -6, 0], Chest: [5, -8, 0], UpArmL: [-22, 12, 22], LoArmL: [-62, 24, 0], UpArmR: [-19, -9, -24], LoArmR: [-58, -20, 0] }),
      K(0.325, { ThighL: [-4, -8, 0], ShinL: [20, 0, 0], ThighR: [1, 10, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.086, 0] }),
      K(0.65, { ThighL: [13, -8, 0], ShinL: [22, 0, 0], FootL: [8, -18, 0], ThighR: [-16, 10, 0], ShinR: [16, 0, 0], FootR: [-3, 15, 0], Hips_pos: [-0.008, -0.100, 0], Hips: [0, 21, 0], Spine: [7, -6, 0], Chest: [5, -8, 0], UpArmL: [-19, 12, 22], UpArmR: [-22, -9, -24] }),
      K(0.975, { ThighL: [1, -8, 0], ShinL: [14, 0, 0], ThighR: [-4, 10, 0], ShinR: [20, 0, 0], Hips_pos: [0, -0.086, 0] }),
      K(1.30, { ThighL: [-16, -8, 0], ShinL: [16, 0, 0], FootL: [-3, -18, 0], ThighR: [13, 10, 0], ShinR: [22, 0, 0], FootR: [8, 15, 0], Hips_pos: [0.008, -0.100, 0], Hips: [0, 23, 0], UpArmL: [-22, 12, 22], UpArmR: [-19, -9, -24] })
    ]
  },

  // ---- RUN: long, loping, and not in a hurry -----------------------------
  run: {
    dur: 0.64, loop: true, keys: [
      K(0, { Spine: [12, -4, 0], Chest: [7, -6, 0], Hips: [4, 16, 0], ThighL: [-50, -2, 0], ShinL: [22, 0, 0], FootL: [-14, -8, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [30, 8, 0], UpArmL: [-24, 10, 14], LoArmL: [-88, 0, 6], UpArmR: [-66, -8, -16], LoArmR: [-80, 0, -6], Hips_pos: [0, -0.028, 0] }),
      K(0.16, { Spine: [11, -4, 0], ThighL: [-10, -2, 0], ShinL: [28, 0, 0], ThighR: [-14, 4, 0], ShinR: [36, 0, 0], Hips_pos: [0, -0.072, 0] }),
      K(0.32, { Spine: [12, -4, 0], Chest: [7, -6, 0], Hips: [4, 16, 0], ThighL: [32, -2, 0], ShinL: [62, 0, 0], FootL: [30, -8, 0], ThighR: [-50, 4, 0], ShinR: [22, 0, 0], FootR: [-14, 8, 0], UpArmL: [-66, 10, 14], LoArmL: [-80, 0, 6], UpArmR: [-24, -8, -16], LoArmR: [-88, 0, -6], Hips_pos: [0, -0.028, 0] }),
      K(0.48, { Spine: [11, -4, 0], ThighL: [-14, -2, 0], ShinL: [36, 0, 0], ThighR: [-10, 4, 0], ShinR: [28, 0, 0], Hips_pos: [0, -0.072, 0] }),
      K(0.64, { Spine: [12, -4, 0], Chest: [7, -6, 0], Hips: [4, 16, 0], ThighL: [-50, -2, 0], ShinL: [22, 0, 0], FootL: [-14, -8, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [30, 8, 0], UpArmL: [-24, 10, 14], UpArmR: [-66, -8, -16] })
    ]
  },

  // ---- DASH: a heave, not a dart -----------------------------------------
  // Her dash is the worst in the game and the animation refuses to hide it:
  // she leans, then arrives. There is a visible frame where she is committed
  // to going and has not gone yet.
  dash: {
    dur: 0.42, loop: false, keys: [
      K(0, {}),
      K(0.09, { Spine: [16, -5, 0], Hips_pos: [0, -0.086, 0], ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [22, 6, 0], ShinR: [42, 0, 0], UpArmL: [-4, 12, 22], UpArmR: [0, -9, -24] }, 'in'),
      K(0.17, { Spine: [26, -5, 0], Chest: [15, -7, 0], Hips_pos: [0, -0.120, 0], ThighL: [-52, -4, 0], ShinL: [32, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0], UpArmL: [30, 12, 20], LoArmL: [-44, 0, 6], UpArmR: [34, -9, -22], LoArmR: [-40, 0, -6] }, 'out'),
      K(0.42, { Spine: [16, -6, 0], Hips_pos: [0, -0.078, 0], ThighL: [-32, -4, 0], ShinL: [24, 0, 0], ThighR: [20, 6, 0], ShinR: [38, 0, 0], UpArmL: [8, 12, 18], UpArmR: [12, -9, -20] })
    ]
  },

  // ---- BLOCK: excellent, and slow to raise -------------------------------
  // The 0.26 s raise is the longest guard in the project — the config's
  // frame data says the guard is slow, and the clip has to agree or the move
  // will feel like it is lying. Once it IS up, it is a wall: forearms
  // crossed, weight fully planted, head down.
  block: {
    dur: 0.26, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmL: [-40, 20, 16], UpArmR: [-34, -16, -18], Spine: [4, -6, 0] }, 'in'),
      K(0.22, { UpArmL: [-84, 30, 12], LoArmL: [-116, 34, 0], HandL: [-18, 100, 0], UpArmR: [-78, -26, -14], LoArmR: [-122, -32, 0], HandR: [-18, -100, 0], Spine: [10, -6, 0], Chest: [8, -9, 0], Head: [9, -6, 0], Hips_pos: [0, -0.096, 0], ThighL: [-24, -6, 0], ShinL: [26, 0, 0], ThighR: [20, 8, 0], ShinR: [28, 0, 0] }, 'out'),
      K(0.26, { UpArmL: [-84, 30, 12], LoArmL: [-116, 34, 0], UpArmR: [-78, -26, -14], LoArmR: [-122, -32, 0], Hips_pos: [0, -0.096, 0] })
    ]
  },

  // =========================================================================
  // THE PUNCH STRING — slow, enormous reach, and the first hit has armour
  // =========================================================================
  // Long limbs used at full extension. Each of the three steps INTO the hit
  // with the opposite foot, and each one keeps travelling for as long again
  // after contact. The armour on hit 1 is expressed by her NOT REACTING to
  // anything — the clip has no flinch in it anywhere, which is what armour
  // looks like from outside.
  punch1: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      // the long load — 0.13 s of nothing but weight moving back
      K(0.13, { Hips: [0, 40, 0], Spine: [2, -18, 0], Chest: [0, -24, 0], UpArmR: [-24, -22, -26], LoArmR: [-72, -26, 0], Hips_pos: [0, -0.062, 0], ThighR: [18, 8, 0] }, 'in'),
      K(0.24, { Hips: [0, -8, 0], Spine: [6, 16, 0], Chest: [4, 22, 0], UpArmR: [-88, 14, -8], LoArmR: [-10, 6, 0], HandR: [-6, -168, 0], UpArmL: [-6, 14, 22], LoArmL: [-64, 22, 0], Hips_pos: [0, -0.052, 0], ThighL: [-30, -4, 0], ThighR: [22, 6, 0] }, 'snap'),
      // THE OVERSHOOT — the arm keeps going past full extension and the torso
      // follows it round
      K(0.31, { Hips: [0, -20, 0], Spine: [7, 26, 0], Chest: [5, 32, 0], UpArmR: [-92, 22, -4], LoArmR: [-6, 8, 0], Hips_pos: [0, -0.048, 0] }, 'out'),
      K(0.46, {})
    ]
  },
  punch2: {
    dur: 0.50, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips: [0, -2, 0], Spine: [2, 18, 0], Chest: [0, 24, 0], UpArmL: [-20, 26, 22], LoArmL: [-78, 28, 0], Hips_pos: [0, -0.062, 0], ThighL: [-20, -4, 0] }, 'in'),
      K(0.26, { Hips: [0, 46, 0], Spine: [6, -20, 0], Chest: [4, -26, 0], UpArmL: [-84, -14, 12], LoArmL: [-8, 4, 0], HandL: [-6, 168, 0], UpArmR: [-8, -14, -24], LoArmR: [-58, -20, 0], Hips_pos: [0, -0.052, 0], ThighR: [-28, 6, 0], ThighL: [20, -4, 0] }, 'snap'),
      K(0.34, { Hips: [0, 56, 0], Spine: [7, -28, 0], Chest: [5, -34, 0], UpArmL: [-88, -20, 8], LoArmL: [-4, 4, 0] }, 'out'),
      K(0.50, {})
    ]
  },
  punch3: {
    // THE LAUNCHER — a full-body uppercut. Her hips drop, everything loads,
    // and then the whole body goes up as one piece with the arm last. The
    // longest wind-up in the project at 0.18 s.
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.18, { Hips: [0, 38, 0], Spine: [16, -16, 0], Chest: [12, -22, 0], Head: [8, -6, 0], Hips_pos: [0, -0.155, 0], UpArmR: [8, -20, -22], LoArmR: [-102, -28, 0], ThighL: [-40, -4, 0], ShinL: [44, 0, 0], ThighR: [32, 6, 0], ShinR: [48, 0, 0] }, 'in'),
      K(0.34, { Hips: [0, -14, 0], Spine: [-20, 18, 0], Chest: [-18, 24, 0], Neck: [-6, -3, 0], Head: [-14, -6, 0], UpArmR: [-166, 10, -14], LoArmR: [-16, 4, 0], HandR: [-4, -60, 0], UpArmL: [-52, 20, 26], Hips_pos: [0, 0.026, 0], ThighL: [-12, -4, 0], ThighR: [-4, 6, 0] }, 'snap'),
      // she is briefly OFF THE FLOOR and comes down over the next 0.14 s
      K(0.48, { Hips: [0, -10, 0], Spine: [-16, 14, 0], Chest: [-14, 20, 0], UpArmR: [-160, 8, -14], Hips_pos: [0, -0.010, 0] }, 'out'),
      K(0.72, {})
    ]
  },

  // ---- HEAVY: a plain, enormous downward hammer --------------------------
  heavy: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.22, { Spine: [-24, -5, 0], Chest: [-20, -7, 0], Neck: [-8, -3, 0], Head: [-16, -6, 0], UpArmL: [-172, 12, 20], LoArmL: [-14, 8, 0], UpArmR: [-176, -10, -18], LoArmR: [-12, -6, 0], Hips_pos: [0, 0.010, 0], ThighL: [-4, -4, 0], ThighR: [3, 6, 0] }, 'in'),
      K(0.38, { Spine: [40, -5, 0], Chest: [28, -8, 0], Neck: [8, -3, 0], Head: [20, -6, 0], UpArmL: [-40, 18, 12], LoArmL: [-38, 20, 0], UpArmR: [-44, -12, -10], LoArmR: [-34, -16, 0], Hips_pos: [0, -0.185, 0], ThighL: [-48, -6, 0], ShinL: [56, 0, 0], ThighR: [38, 8, 0], ShinR: [60, 0, 0] }, 'snap'),
      K(0.56, { Spine: [38, -5, 0], Chest: [27, -8, 0], Hips_pos: [0, -0.180, 0], UpArmL: [-38, 18, 12], UpArmR: [-42, -12, -10] }, 'hold'),
      K(0.86, {})
    ]
  },

  // =========================================================================
  // MASS CHARGE — held on RB, the meter filling
  // =========================================================================
  // A LOOP, because it is held. She plants, drops her weight, and pulls her
  // fists in toward her chest as though hauling something enormous toward
  // herself — which is exactly what Star Rage is. The loop is a slow
  // compression and release, with the amplitude deliberately SMALL: a body
  // under load does not thrash, it trembles.
  massCharge: {
    dur: 0.90, loop: true, keys: [
      K(0, { Hips_pos: [0, -0.130, 0], Spine: [14, -5, 0], Chest: [11, -7, 0], Head: [6, -6, 0], UpArmL: [-56, 28, 18], LoArmL: [-108, 32, 0], HandL: [-14, 92, 0], UpArmR: [-50, -24, -20], LoArmR: [-114, -28, 0], HandR: [-14, -92, 0], ThighL: [-32, -8, 0], ShinL: [34, 0, 0], FootL: [6, -18, 0], ThighR: [26, 10, 0], ShinR: [36, 0, 0], FootR: [12, 15, 0] }),
      K(0.45, { Hips_pos: [0, -0.146, 0], Spine: [17, -5, 0], Chest: [14, -7, 0], Head: [9, -6, 0], UpArmL: [-62, 32, 15], LoArmL: [-116, 36, 0], UpArmR: [-56, -28, -17], LoArmR: [-122, -32, 0], ThighL: [-36, -8, 0], ShinL: [38, 0, 0], ThighR: [30, 10, 0], ShinR: [40, 0, 0] }),
      K(0.90, { Hips_pos: [0, -0.130, 0], Spine: [14, -5, 0], Chest: [11, -7, 0], Head: [6, -6, 0], UpArmL: [-56, 28, 18], LoArmL: [-108, 32, 0], UpArmR: [-50, -24, -20], LoArmR: [-114, -28, 0], ThighL: [-32, -8, 0], ShinL: [34, 0, 0], ThighR: [26, 10, 0], ShinR: [36, 0, 0] })
    ]
  },

  // ---- CT1: MASS SLAM ----------------------------------------------------
  // The release of the charge. Two-handed, straight down, and the impact key
  // takes her all the way to the floor — the deepest `Hips_pos` in the
  // project at -0.24. She finishes in a crouch with both fists on the deck
  // and takes a long time to stand back up, which is the recovery the config
  // charges for.
  ct1: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.26, { Spine: [-26, -5, 0], Chest: [-22, -7, 0], Neck: [-9, -3, 0], Head: [-18, -6, 0], UpArmL: [-176, 14, 18], LoArmL: [-10, 6, 0], UpArmR: [-178, -12, -16], LoArmR: [-8, -4, 0], Hips_pos: [0, 0.032, 0], ThighL: [-2, -4, 0], ThighR: [1, 6, 0] }, 'in'),
      K(0.34, { Spine: [-28, -5, 0], Hips_pos: [0, 0.036, 0], UpArmL: [-178, 14, 18], UpArmR: [-180, -12, -16] }, 'hold'),
      K(0.46, { Spine: [52, -5, 0], Chest: [34, -8, 0], Neck: [10, -3, 0], Head: [24, -6, 0], UpArmL: [-24, 20, 8], LoArmL: [-26, 22, 0], UpArmR: [-28, -14, -6], LoArmR: [-22, -18, 0], Hips_pos: [0, -0.240, 0], ThighL: [-62, -8, 0], ShinL: [76, 0, 0], FootL: [16, -18, 0], ThighR: [50, 10, 0], ShinR: [78, 0, 0], FootR: [22, 15, 0] }, 'snap'),
      K(0.70, { Spine: [50, -5, 0], Chest: [33, -8, 0], Hips_pos: [0, -0.234, 0], UpArmL: [-22, 20, 8], UpArmR: [-26, -14, -6], ThighL: [-60, -8, 0], ShinL: [74, 0, 0], ThighR: [48, 10, 0], ShinR: [76, 0, 0] }, 'hold'),
      K(1.10, {})
    ]
  },

  // ---- CT2: THE COMMAND GRAB ---------------------------------------------
  // The reach, the catch, and the slam, in one clip. Deliberately readable in
  // three distinct beats so a player can learn to jump it: a long telegraphed
  // step forward with the arm out (0.30 s of it), the close, and then the
  // whole body pivoting over to put them into the floor.
  ct2: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      // THE TELL — arm out, palm open, walking into it. Slow on purpose.
      K(0.18, { Hips: [0, 8, 0], Spine: [6, 6, 0], Chest: [4, 8, 0], UpArmR: [-70, 6, -14], LoArmR: [-28, 4, 0], HandR: [-16, -70, 0], Hips_pos: [0, -0.064, 0], ThighL: [-26, -4, 0] }, 'in'),
      K(0.30, { Hips: [0, 4, 0], Spine: [8, 8, 0], UpArmR: [-86, 10, -10], LoArmR: [-14, 4, 0], HandR: [-18, -76, 0], Hips_pos: [0, -0.058, 0], ThighL: [-32, -4, 0], ThighR: [24, 6, 0] }, 'hold'),
      // THE CATCH — both hands close, and she starts to turn
      K(0.44, { Hips: [0, -22, 0], Spine: [10, 22, 0], Chest: [8, 28, 0], UpArmR: [-92, 20, -6], LoArmR: [-30, 10, 0], HandR: [-8, -100, 0], UpArmL: [-88, 18, 20], LoArmL: [-36, 16, 0], HandL: [-8, 100, 0], Hips_pos: [0, -0.080, 0] }, 'snap'),
      // THE SLAM — she pivots the whole body and drives down and across
      K(0.72, { Hips: [0, 62, 0], Spine: [30, -34, 0], Chest: [22, -40, 0], Head: [14, -6, 0], UpArmL: [-30, -24, 10], LoArmL: [-30, -14, 0], UpArmR: [-26, -30, -8], LoArmR: [-26, -22, 0], Hips_pos: [0, -0.210, 0], ThighL: [-56, -8, 0], ShinL: [66, 0, 0], ThighR: [44, 10, 0], ShinR: [68, 0, 0] }, 'snap'),
      K(0.94, { Hips: [0, 60, 0], Spine: [28, -32, 0], Hips_pos: [0, -0.204, 0], UpArmL: [-28, -24, 10], UpArmR: [-24, -30, -8] }, 'hold'),
      K(1.30, {})
    ]
  },

  // ---- COMMAND GARUDA (B) ------------------------------------------------
  // She does not gesture grandly. One short flick of the chin and two fingers
  // in the direction she wants it to go — the relationship is old and casual,
  // and a big summoning pose would say the opposite. This is the shortest
  // special clip in the project and that is the character note.
  command: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmR: [-40, -12, -20], LoArmR: [-86, -20, 0] }, 'in'),
      K(0.20, { UpArmR: [-96, 12, -8], LoArmR: [-22, 8, 0], HandR: [-8, -80, 0], Head: [4, -14, 0], Neck: [2, -6, 0], Chest: [-1, -11, 0], Hips: [0, 15, 0] }, 'snap'),
      K(0.30, { UpArmR: [-92, 10, -8], LoArmR: [-24, 8, 0], Head: [3, -13, 0] }, 'hold'),
      K(0.46, {})
    ]
  },

  // =========================================================================
  // THE ULTIMATE — BLACK HOLE
  // =========================================================================
  // Her strongest shown technique in canon, and in canon it kills her. Here it
  // does not, but the animation is honest about what it is: she stops
  // fighting, plants, brings both hands together at her sternum, and then
  // simply LETS GO. There is no throw, no swing and no follow-through — the
  // only clip in her set with none — because the move is not a strike. It is
  // her adding mass to herself until the mass does the work.
  //
  // The long hold at the end is the collapse. She is standing perfectly still
  // in the middle of it, and the arena is being pulled past her.
  ult: {
    dur: 2.60, loop: false, keys: [
      K(0, {}),
      // plant, and go still
      K(0.30, { Hips_pos: [0, -0.110, 0], Spine: [8, -5, 0], Chest: [6, -7, 0], Head: [2, -6, 0], UpArmL: [-30, 20, 16], LoArmL: [-80, 24, 0], UpArmR: [-26, -16, -18], LoArmR: [-76, -20, 0], ThighL: [-28, -8, 0], ShinL: [30, 0, 0], ThighR: [24, 10, 0], ShinR: [32, 0, 0] }, 'in'),
      // hands to the sternum, palms in
      K(0.62, { Hips_pos: [0, -0.124, 0], Spine: [4, -5, 0], Chest: [2, -7, 0], Neck: [-2, -3, 0], Head: [-6, -6, 0], UpArmL: [-70, 34, 10], LoArmL: [-116, 40, 0], HandL: [-10, 104, 0], UpArmR: [-66, -30, -12], LoArmR: [-120, -36, 0], HandR: [-10, -104, 0], ThighL: [-30, -8, 0], ThighR: [26, 10, 0] }, 'in'),
      // the compression: everything pulls IN toward the sternum, and this is
      // the frame the singularity forms on
      K(0.92, { Hips_pos: [0, -0.140, 0], Spine: [12, -5, 0], Chest: [10, -7, 0], Neck: [2, -3, 0], Head: [6, -6, 0], UpArmL: [-78, 40, 4], LoArmL: [-128, 46, 0], UpArmR: [-74, -36, -6], LoArmR: [-132, -42, 0], ThighL: [-36, -8, 0], ShinL: [38, 0, 0], ThighR: [30, 10, 0], ShinR: [40, 0, 0] }, 'snap'),
      // AND THEN SHE DOES NOT MOVE. 1.1 seconds of held stillness while the
      // world comes apart around her. This is the whole effect.
      K(1.30, { Hips_pos: [0, -0.138, 0], Spine: [12, -5, 0], Chest: [10, -7, 0], Head: [6, -6, 0], UpArmL: [-78, 40, 4], LoArmL: [-128, 46, 0], UpArmR: [-74, -36, -6], LoArmR: [-132, -42, 0], ThighL: [-36, -8, 0], ShinL: [38, 0, 0], ThighR: [30, 10, 0], ShinR: [40, 0, 0] }, 'hold'),
      K(2.00, { Hips_pos: [0, -0.136, 0], Spine: [11, -5, 0], Chest: [9, -7, 0], Head: [5, -6, 0], UpArmL: [-76, 39, 5], LoArmL: [-126, 45, 0], UpArmR: [-72, -35, -7], LoArmR: [-130, -41, 0], ThighL: [-35, -8, 0], ShinL: [37, 0, 0], ThighR: [29, 10, 0], ShinR: [39, 0, 0] }, 'hold'),
      // the release, and she is winded — the backlash, drawn
      K(2.24, { Hips_pos: [0, -0.170, 0], Spine: [26, -5, 0], Chest: [20, -7, 0], Head: [14, -6, 0], UpArmL: [-24, 16, 20], LoArmL: [-56, 20, 0], UpArmR: [-20, -12, -22], LoArmR: [-52, -16, 0], ThighL: [-40, -6, 0], ShinL: [44, 0, 0], ThighR: [34, 8, 0], ShinR: [46, 0, 0] }, 'out'),
      K(2.60, { Hips_pos: [0, -0.086, 0], Spine: [14, -5, 0], Chest: [10, -7, 0], Head: [6, -6, 0] })
    ]
  },

  // ---- TAUNT: D-pad Left -------------------------------------------------
  // She rolls her shoulders, shakes out one hand, and grins. Casual to the
  // point of rudeness, and completely without aggression — which is the
  // distinction from Naoya's contempt and Gojo's showmanship.
  taunt: {
    dur: 1.50, loop: false, keys: [
      K(0, {}),
      K(0.30, { ClavL: [0, 8, 0], ClavR: [0, -8, 0], UpArmL: [-42, 18, 30], UpArmR: [-38, -14, -32], Chest: [-4, -7, 0], Head: [-6, -6, 0], Neck: [-2, -3, 0] }, 'in'),
      K(0.56, { ClavL: [0, -4, 0], ClavR: [0, 4, 0], UpArmL: [-6, 4, 6], UpArmR: [-4, -3, -7], Chest: [2, -7, 0], Head: [2, -6, 0] }, 'out'),
      // the hand shake-out
      K(0.78, { UpArmR: [-30, -8, -26], LoArmR: [-62, -14, 0], HandR: [-24, -30, 0] }, 'snap'),
      K(0.92, { UpArmR: [-30, -8, -26], LoArmR: [-62, -14, 0], HandR: [-4, -76, 0] }, 'snap'),
      K(1.06, { UpArmR: [-30, -8, -26], LoArmR: [-62, -14, 0], HandR: [-26, -34, 0] }, 'snap'),
      K(1.50, {})
    ]
  },

  // ---- VICTORY -----------------------------------------------------------
  victory: {
    dur: 2.80, loop: false, keys: [
      K(0, {}),
      K(0.44, { Hips: [0, 26, 0], Hips_pos: [0.024, -0.026, 0], Chest: [-3, -12, 0], Head: [-6, -10, 0], UpArmL: [-30, 16, 26], LoArmL: [-58, 22, 0], UpArmR: [-24, -12, -28], LoArmR: [-52, -18, 0] }, 'in'),
      // one hand up, palm open, to somebody off screen
      K(1.00, { Hips: [0, 24, 0], Hips_pos: [0.020, -0.024, 0], Head: [-8, -4, 0], Neck: [-3, -2, 0], UpArmR: [-134, -6, -22], LoArmR: [-30, -8, 0], HandR: [-10, -60, 0], UpArmL: [-16, 12, 20] }, 'out'),
      K(1.60, { Hips: [0, 24, 0], Hips_pos: [0.018, -0.028, 0], Head: [-7, -4, 0], UpArmR: [-130, -6, -22], LoArmR: [-34, -8, 0] }, 'hold'),
      K(2.80, { Hips: [0, 22, 0], Hips_pos: [0, -0.030, 0] })
    ]
  }
};
