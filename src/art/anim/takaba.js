// TAKABA — loose, unathletic, and timed like a stand-up rather than a fighter.
//
// THE RULES THIS SET IS AUTHORED ON, and they are the opposite of every other
// file in this folder:
//
//   1  HE HAS NO FIGHTING FORM. His guard is not up, his feet are not set, his
//      weight is on one hip. Every other character in this project stands
//      ready; his neutral is a man waiting to be introduced. That contrast is
//      the design and it has to survive into every frame — so nothing in this
//      file is allowed to look trained.
//
//   2  BEATS, NOT SNAPS. A fighting-game clip is anticipation -> impact ->
//      hold. A stand-up's timing is SET-UP -> PAUSE -> PUNCHLINE, and the
//      pause is the part that does the work. Every bit clip below has a beat
//      of stillness between the gesture and the outcome, and that beat is
//      deliberately a frame or two LONGER than reads as comfortable.
//
//   3  HE REACTS TO HIS OWN MATERIAL. He is the only character in the project
//      who looks at what just happened. Half these clips end with him checking
//      the result — a glance, a shrug, a small delighted double-take — rather
//      than recovering to guard.
//
//   4  THE METER CHANGES HIS POSTURE, NOT HIS FRAMES. `idle`, `idleWarm` and
//      `idleKilling` are three genuinely different bodies (apologetic, level,
//      expansive) selected by tier through the same `_clip` swap Kashimo's
//      charged cycles, Inumaki's throat idles, Maki's stage neutrals and
//      Panda's per-stance sets already use. Nothing about his frame data
//      changes; only how sure of himself he looks.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — WEIGHT ON ONE HIP, SHOULDERS SLIGHTLY ROUNDED, HANDS LOW AND OPEN.
// Not a guard. His lead hand is at waist height with the palm turned out, the
// way somebody stands when they are about to say "so anyway".
export const TAKABA_STANCE = {
  Hips_pos: [0, -0.052, 0],
  Hips: [0, 18, 4], Spine: [6, -6, -2], Chest: [4, -8, -3], Neck: [2, -3, 0], Head: [4, -6, 2],
  UpArmL: [-18, 12, 10], LoArmL: [-58, 20, 0], HandL: [-14, 40, 0],
  UpArmR: [-12, -8, -12], LoArmR: [-48, -16, 0], HandR: [-10, -34, 0],
  ThighL: [-6, -8, 0], ShinL: [14, 0, 0], FootL: [4, -14, 0],
  ThighR: [10, 4, 0], ShinR: [6, 0, 0], FootR: [2, 10, 0]
};

// A BIT is a four-beat shape: the SET-UP (he gestures), the PAUSE (he stops
// and waits, which is where the outcome arrives), the PUNCHLINE (the reaction
// on his body) and the CHECK (he looks at it). The helper enforces the timing;
// every bit supplies its own poses, so no two look alike.
const bit = (dur, setup, pause, punch, check, checkAt) => ({
  dur, loop: false, keys: [
    K(0, {}),
    K(dur * 0.20, setup, 'out'),
    K(dur * 0.36, pause, 'hold'),
    K(dur * 0.50, punch, 'snap'),
    K(dur * (checkAt ?? 0.68), check ?? {}, 'out'),
    K(dur, {}, 'out')
  ]
});

export const TAKABA_CLIPS = {
  // ---- THREE IDLES, ONE PER COMEDY TIER ----------------------------------
  // OPEN MIC — apologetic. Shoulders in, chin down, hands fidgeting at his
  // own sleeve, weight shifting because he does not know where to put it.
  idle: {
    dur: 3.1, loop: true, keys: [
      K(0, {}),
      K(0.9, { Chest: [7, -9, -4], Spine: [8, -7, -3], Head: [7, -8, 2], Hips_pos: [0, -0.060, 0], UpArmL: [-20, 14, 8], LoArmL: [-64, 24, 0] }),
      K(1.7, { Head: [5, 4, 1], Chest: [5, -4, -2], Hips: [0, 22, 3], Hips_pos: [0, -0.044, 0], HandL: [-22, 48, 0], HandR: [-16, -40, 0] }),
      K(2.4, { Head: [8, -10, 3], Chest: [6, -10, -4], Hips_pos: [0, -0.058, 0] }),
      K(3.1, {})
    ]
  },
  // WARMING UP — level. He has stopped apologising. Shoulders open, head up,
  // a small rocking bounce on the balls of his feet. This is the neutral the
  // frame data is actually authored against.
  idleWarm: {
    dur: 2.6, loop: true, keys: [
      K(0, { Chest: [2, -8, -1], Spine: [3, -6, -1], Head: [0, -6, 0], Hips_pos: [0, -0.046, 0], UpArmL: [-22, 14, 14], UpArmR: [-16, -10, -16] }),
      K(0.8, { Chest: [4, -8, -1], Hips_pos: [0, -0.030, 0], Head: [-2, -4, 0], UpArmL: [-26, 14, 16], UpArmR: [-20, -10, -18] }),
      K(1.6, { Chest: [1, -9, -1], Hips_pos: [0, -0.052, 0], Head: [2, -8, 0] }),
      K(2.6, { Chest: [2, -8, -1], Spine: [3, -6, -1], Head: [0, -6, 0], Hips_pos: [0, -0.046, 0], UpArmL: [-22, 14, 14], UpArmR: [-16, -10, -16] })
    ]
  },
  // KILLING — expansive. Chest out, chin up, arms wide and loose, one hand
  // permanently half-raised as though he is about to take a question from the
  // audience. He is a showman now and the body has to say so before the
  // spotlight does.
  idleKilling: {
    dur: 2.2, loop: true, keys: [
      K(0, { Chest: [-4, -6, 0], Spine: [-3, -5, 0], Neck: [-3, 0, 0], Head: [-8, -4, 0], Hips_pos: [0, -0.030, 0], Hips: [0, 14, 0], UpArmL: [-42, 18, 34], LoArmL: [-52, 22, 0], HandL: [-8, 62, 0], UpArmR: [-30, -14, -30], LoArmR: [-44, -18, 0] }),
      K(0.7, { Chest: [-6, -6, 0], Head: [-11, -2, 0], Hips_pos: [0, -0.014, 0], UpArmL: [-50, 18, 38], UpArmR: [-36, -14, -34] }),
      K(1.5, { Chest: [-2, -7, 0], Head: [-6, -6, 0], Hips_pos: [0, -0.038, 0], UpArmL: [-38, 18, 32] }),
      K(2.2, { Chest: [-4, -6, 0], Spine: [-3, -5, 0], Neck: [-3, 0, 0], Head: [-8, -4, 0], Hips_pos: [0, -0.030, 0], UpArmL: [-42, 18, 34], LoArmL: [-52, 22, 0], HandL: [-8, 62, 0], UpArmR: [-30, -14, -30], LoArmR: [-44, -18, 0] })
    ]
  },

  // A slightly bouncy, slightly comic walk — the hips lead and the arms swing
  // wider than they need to. Nothing about it is efficient.
  walk: {
    dur: 0.82, loop: true, keys: [
      K(0, { ThighL: [-32, -8, 0], ShinL: [14, 0, 0], FootL: [-10, -14, 0], ThighR: [24, 4, 0], ShinR: [30, 0, 0], FootR: [14, 10, 0], Hips_pos: [0, -0.056, 0], Hips: [0, 26, 4], UpArmL: [-48, 14, 14], UpArmR: [-52, -10, -16], Spine: [7, -6, -2] }),
      K(0.205, { ThighL: [-6, -8, 0], ShinL: [24, 0, 0], ThighR: [4, 4, 0], ShinR: [16, 0, 0], Hips_pos: [0, -0.024, 0], Head: [2, -4, 2] }),
      K(0.41, { ThighL: [26, -8, 0], ShinL: [30, 0, 0], FootL: [14, -14, 0], ThighR: [-30, 4, 0], ShinR: [14, 0, 0], FootR: [-10, 10, 0], Hips_pos: [0, -0.056, 0], Hips: [0, 10, -4], UpArmL: [-56, 14, 14], UpArmR: [-40, -10, -16], Spine: [7, -6, 2] }),
      K(0.615, { ThighL: [2, -8, 0], ShinL: [18, 0, 0], ThighR: [-8, 4, 0], ShinR: [26, 0, 0], Hips_pos: [0, -0.024, 0], Head: [4, -8, 0] }),
      K(0.82, { ThighL: [-32, -8, 0], ShinL: [14, 0, 0], FootL: [-10, -14, 0], ThighR: [24, 4, 0], ShinR: [30, 0, 0], FootR: [14, 10, 0], Hips_pos: [0, -0.056, 0], Hips: [0, 26, 4], UpArmL: [-48, 14, 14], UpArmR: [-52, -10, -16] })
    ]
  },
  // AN UNTRAINED RUN. The elbows are out, the head bobs, and the hands are
  // flat rather than fisted. He runs like a man late for a train.
  run: {
    dur: 0.50, loop: true, keys: [
      K(0, { Spine: [20, -4, 0], Chest: [12, -6, 0], Hips: [4, 14, 0], Head: [8, -4, 0], ThighL: [-50, -4, 0], ShinL: [26, 0, 0], FootL: [-14, -8, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [28, 8, 0], UpArmL: [-24, 20, 30], LoArmL: [-92, 0, 8], HandL: [-6, 30, 0], UpArmR: [-68, -18, -32], LoArmR: [-84, 0, -8], Hips_pos: [0, -0.034, 0] }),
      K(0.125, { Spine: [18, -4, 0], Head: [4, -4, 0], ThighL: [-10, -4, 0], ShinL: [30, 0, 0], ThighR: [-16, 4, 0], ShinR: [40, 0, 0], Hips_pos: [0, -0.070, 0] }),
      K(0.25, { Spine: [20, -4, 0], Chest: [12, -6, 0], Hips: [4, 14, 0], Head: [8, -4, 0], ThighL: [32, -4, 0], ShinL: [62, 0, 0], FootL: [28, -8, 0], ThighR: [-50, 4, 0], ShinR: [26, 0, 0], FootR: [-14, 8, 0], UpArmL: [-68, 20, 30], LoArmL: [-84, 0, 8], UpArmR: [-24, -18, -32], LoArmR: [-92, 0, -8], Hips_pos: [0, -0.034, 0] }),
      K(0.375, { Spine: [18, -4, 0], Head: [4, -4, 0], ThighL: [-16, -4, 0], ShinL: [40, 0, 0], ThighR: [-10, 4, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.070, 0] }),
      K(0.50, { Spine: [20, -4, 0], Chest: [12, -6, 0], Hips: [4, 14, 0], Head: [8, -4, 0], ThighL: [-50, -4, 0], ShinL: [26, 0, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], UpArmL: [-24, 20, 30], UpArmR: [-68, -18, -32] })
    ]
  },
  dash: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.08, { Spine: [22, -5, 0], Chest: [13, -7, 0], Hips_pos: [0, -0.110, 0], Head: [10, -4, 0], ThighL: [-46, -8, 0], ShinL: [30, 0, 0], ThighR: [28, 4, 0], ShinR: [52, 0, 0], UpArmL: [28, 16, 26], LoArmL: [-42, 0, 8], UpArmR: [32, -12, -28], LoArmR: [-38, 0, -8] }, 'out'),
      K(0.34, { Spine: [16, -6, -1], Hips_pos: [0, -0.086, 0], ThighL: [-36, -8, 0], ShinL: [26, 0, 0], ThighR: [20, 4, 0], ShinR: [42, 0, 0], UpArmL: [14, 14, 20], UpArmR: [18, -10, -22] })
    ]
  },

  // ---- THE MOST NORMAL PUNCH IN THE GAME ---------------------------------
  // Deliberately unremarkable and slightly wrong: the elbow flares, the
  // shoulder does not follow through, and he pulls it back too early. It looks
  // like a man who has never hit anything.
  punch1: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.09, { UpArmR: [-16, -22, -20], LoArmR: [-72, -22, 0], Chest: [4, -14, -2] }, 'in'),
      K(0.18, { UpArmR: [-72, 14, -18], LoArmR: [-20, 0, 0], HandR: [-14, 150, 0], Chest: [6, 16, 0], Hips: [0, 6, 0], Head: [6, 8, 0], Hips_pos: [0, -0.058, 0] }, 'snap'),
      K(0.25, { UpArmR: [-70, 14, -18], Chest: [6, 16, 0] }, 'hold'),
      K(0.44, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.09, { UpArmL: [-18, 26, 18], LoArmL: [-78, 26, 0], Chest: [4, 12, 2] }, 'in'),
      K(0.19, { UpArmL: [-76, -10, 16], LoArmL: [-18, 0, 0], HandL: [-12, -140, 0], Chest: [6, -16, 0], Hips: [0, 28, 0], Head: [6, -8, 0], Hips_pos: [0, -0.060, 0] }, 'snap'),
      K(0.26, { UpArmL: [-74, -10, 16], Chest: [6, -16, 0] }, 'hold'),
      K(0.46, {}, 'out')
    ]
  },
  punch3: {
    dur: 0.58, loop: false, keys: [
      K(0, {}),
      K(0.12, { Hips_pos: [0, -0.115, 0], ThighL: [-30, -8, 0], ShinL: [38, 0, 0], Spine: [12, -6, 0], UpArmR: [-8, -20, -16], LoArmR: [-104, -20, 0] }, 'in'),
      K(0.23, { Hips_pos: [0, 0.020, 0], UpArmR: [-146, -8, -12], LoArmR: [-24, 0, 0], HandR: [-26, -20, 0], UpArmL: [-40, 22, 26], Chest: [-12, 12, 0], Spine: [-9, 8, 0], Head: [-12, 6, 0], ThighL: [-6, -8, 0], ShinL: [8, 0, 0] }, 'snap'),
      K(0.31, { UpArmR: [-144, -8, -12], Chest: [-12, 12, 0], Hips_pos: [0, 0.020, 0] }, 'hold'),
      K(0.58, {}, 'out')
    ]
  },
  heavy: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.24, { Chest: [-6, -34, 0], Spine: [-3, -22, 0], Hips: [0, 40, 0], UpArmR: [10, -40, -28], LoArmR: [-66, -28, 0], UpArmL: [-46, 40, 22], Hips_pos: [0, -0.090, 0] }, 'in'),
      K(0.38, { Chest: [14, 34, 0], Spine: [10, 22, 0], Hips: [4, -22, 0], UpArmR: [-84, 40, -10], LoArmR: [-16, 0, 0], HandR: [-14, 140, 0], UpArmL: [-18, -26, 24], Head: [10, 22, 0], Hips_pos: [0, -0.126, 0], ThighL: [-32, -8, 0], ShinL: [42, 0, 0] }, 'snap'),
      K(0.50, { Chest: [14, 34, 0], UpArmR: [-82, 40, -10], Hips_pos: [0, -0.126, 0] }, 'hold'),
      // he nearly falls over. That is the punish window, animated.
      K(0.66, { Chest: [12, 56, 0], Hips: [4, -46, 0], Head: [8, 34, 0], Hips_pos: [0, -0.100, 0], ThighR: [-16, 4, 0] }, 'out'),
      K(0.86, {}, 'out')
    ]
  },

  // ---- B — THE RIFF ------------------------------------------------------
  // He turns to the crowd and works it. Both arms out, palms up, chin up,
  // rocking from foot to foot, and one big open-handed gesture at the end.
  // He is looking AWAY from the fight for the entire clip, which is the
  // vulnerability stated in animation rather than in a stat.
  riff: {
    dur: 1.35, loop: true, keys: [
      K(0, {}),
      K(0.22, {
        Hips: [0, 52, 0], Chest: [-6, 24, 0], Spine: [-4, 18, 0], Neck: [-4, 8, 0], Head: [-12, 26, 0],
        UpArmL: [-64, 34, 44], LoArmL: [-30, 20, 0], HandL: [-40, 60, 0],
        UpArmR: [-58, -30, -42], LoArmR: [-28, -18, 0], HandR: [-38, -56, 0],
        Hips_pos: [0, -0.024, 0]
      }, 'out'),
      K(0.55, {
        Head: [-14, 48, 0], Chest: [-7, 34, 0], Hips: [0, 62, 0],
        UpArmL: [-72, 34, 48], UpArmR: [-50, -30, -38], Hips_pos: [0, -0.010, 0]
      }, 'out'),
      K(0.84, {
        Head: [-10, 8, 0], Chest: [-5, 12, 0], Hips: [0, 40, 0],
        UpArmL: [-56, 34, 40], UpArmR: [-64, -30, -46], Hips_pos: [0, -0.034, 0]
      }, 'out'),
      K(1.10, {
        // the big open-handed "am I right?"
        Head: [-16, 30, 0], Chest: [-9, 26, 0], Neck: [-6, 10, 0],
        UpArmL: [-92, 26, 56], LoArmL: [-12, 12, 0], HandL: [-52, 70, 0],
        UpArmR: [-88, -24, -54], LoArmR: [-10, -10, 0], HandR: [-50, -66, 0],
        Hips_pos: [0, 0.004, 0]
      }, 'snap'),
      K(1.35, {
        Hips: [0, 52, 0], Chest: [-6, 24, 0], Spine: [-4, 18, 0], Neck: [-4, 8, 0], Head: [-12, 26, 0],
        UpArmL: [-64, 34, 44], LoArmL: [-30, 20, 0], HandL: [-40, 60, 0],
        UpArmR: [-58, -30, -42], LoArmR: [-28, -18, 0], HandR: [-38, -56, 0],
        Hips_pos: [0, -0.024, 0]
      }, 'out')
    ]
  },

  // ---- THE EIGHT BITS (RB) -----------------------------------------------
  // ct1 is the FALLBACK only — the roll stamps one of the eight below onto the
  // move at press time (see startCT). It is a plain point, and if a player
  // ever sees it something has gone wrong.
  ct1: bit(0.62,
    { UpArmR: [-56, -10, -16], LoArmR: [-40, -8, 0], Chest: [3, 6, 0] },
    { UpArmR: [-58, -10, -16] },
    { UpArmR: [-84, 4, -10], LoArmR: [-8, 0, 0], HandR: [-6, -80, 0], Chest: [5, 12, 0] },
    { Head: [6, 14, 0] }),

  // GLOVE — he cranks it like a jack-in-the-box: two quick winds of the wrist,
  // a beat, and then he flinches away from his own spring.
  bit_glove: {
    dur: 0.66, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmR: [-58, -6, -14], LoArmR: [-64, -6, 0], HandR: [-8, -110, 0], Chest: [4, 6, 0] }, 'out'),
      K(0.17, { HandR: [-8, -20, 0] }, 'snap'),
      K(0.24, { HandR: [-8, -110, 0] }, 'snap'),
      K(0.34, { HandR: [-8, -60, 0] }, 'hold'),
      K(0.42, { UpArmL: [-58, 30, 40], LoArmL: [-70, 24, 0], Chest: [8, -18, 0], Hips: [0, 34, 0], Head: [10, -20, 0], Hips_pos: [0, -0.070, 0] }, 'snap'),
      K(0.66, {}, 'out')
    ]
  },
  // MALLET — both hands come up over his head holding something that is not
  // there, and he brings them down with a comically overcommitted follow.
  bit_mallet: bit(0.70,
    { UpArmL: [-152, 20, 18], LoArmL: [-40, 0, 0], UpArmR: [-150, -18, -16], LoArmR: [-42, 0, 0], Chest: [-12, 0, 0], Spine: [-8, 0, 0], Head: [-14, 0, 0], Hips_pos: [0, -0.020, 0] },
    { UpArmL: [-156, 20, 18], UpArmR: [-154, -18, -16] },
    { UpArmL: [-30, 12, 14], LoArmL: [-8, 0, 0], UpArmR: [-28, -10, -12], LoArmR: [-8, 0, 0], Chest: [26, 0, 0], Spine: [18, 0, 0], Head: [22, 0, 0], Hips_pos: [0, -0.140, 0], ThighL: [-34, -8, 0], ShinL: [44, 0, 0], ThighR: [-28, 4, 0], ShinR: [40, 0, 0] },
    { Chest: [14, 0, 0], Head: [16, 0, 0], Hips_pos: [0, -0.090, 0] }),
  // BANANA — the smallest gesture in his kit: an underhand flick, low and to
  // the side, and then he simply WATCHES. The pause is the longest in the file
  // because the joke is entirely in the waiting.
  bit_banana: {
    dur: 0.78, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmR: [-4, -18, -14], LoArmR: [-42, -14, 0], HandR: [-30, -50, 0], Chest: [8, -4, 0], Head: [8, -6, 0] }, 'out'),
      K(0.22, { UpArmR: [-26, -6, -18], LoArmR: [-26, 0, 0], HandR: [-6, -20, 0], Chest: [5, 6, 0] }, 'snap'),
      // ...and he waits.
      K(0.30, { UpArmR: [-24, -6, -18], Head: [4, 10, 0] }, 'hold'),
      K(0.56, { Head: [2, 14, 0], Chest: [3, 8, 0], UpArmR: [-20, -8, -16] }, 'hold'),
      // the delighted little rise onto his toes when it works
      K(0.66, { Hips_pos: [0, -0.020, 0], Chest: [-4, 8, 0], Head: [-8, 12, 0], UpArmL: [-46, 22, 32], UpArmR: [-40, -18, -30] }, 'snap'),
      K(0.78, {}, 'out')
    ]
  },
  // BUCKET — he mimes putting something over his own head first, checks that
  // the audience is following, and then points.
  bit_bucket: bit(0.68,
    { UpArmL: [-128, 22, 24], LoArmL: [-70, 14, 0], UpArmR: [-124, -20, -22], LoArmR: [-72, -12, 0], Head: [-6, 0, 0], Chest: [-4, 0, 0] },
    { UpArmL: [-132, 22, 24], UpArmR: [-128, -20, -22], Head: [-8, 0, 0] },
    { UpArmL: [-70, 10, 18], LoArmL: [-16, 0, 0], UpArmR: [-68, -8, -16], LoArmR: [-16, 0, 0], Chest: [6, 6, 0], Head: [8, 8, 0], Hips_pos: [0, -0.068, 0] },
    { Head: [6, 18, 0], UpArmL: [-34, 16, 22] }),
  // PIE — a genuine throw, and it is the only bit where his whole body
  // commits. Wind up from the hip, big follow-through, and he ends turned.
  bit_pie: bit(0.60,
    { UpArmR: [4, -34, -22], LoArmR: [-56, -24, 0], HandR: [-40, -40, 0], Chest: [-4, -30, 0], Hips: [0, 40, 0], Hips_pos: [0, -0.062, 0] },
    { UpArmR: [2, -34, -22], Chest: [-5, -32, 0] },
    { UpArmR: [-104, 30, -8], LoArmR: [-12, 0, 0], HandR: [-8, 60, 0], Chest: [12, 30, 0], Spine: [9, 20, 0], Hips: [4, -12, 0], Head: [8, 22, 0], Hips_pos: [0, -0.096, 0], ThighL: [-28, -8, 0], ShinL: [36, 0, 0] },
    { UpArmR: [-70, 44, -14], Chest: [8, 44, 0], Head: [6, 30, 0] }),
  // RAKE — he does not throw anything. He gestures at the FLOOR, palm down,
  // once, and then puts his hands behind his back and waits, which is the
  // single most smug thing he does.
  bit_rake: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmR: [-36, -12, -18], LoArmR: [-52, -10, 0], HandR: [-60, -40, 0], Chest: [10, 4, 0], Head: [14, 4, 0], Hips_pos: [0, -0.066, 0] }, 'out'),
      K(0.22, { UpArmR: [-16, -10, -20], LoArmR: [-34, -6, 0], HandR: [-72, -30, 0], Chest: [14, 6, 0], Head: [18, 6, 0] }, 'snap'),
      K(0.36, {
        UpArmL: [26, 22, 12], LoArmL: [-96, 14, 0], UpArmR: [28, -20, -10], LoArmR: [-98, -12, 0],
        Chest: [-6, 2, 0], Spine: [-4, 2, 0], Head: [-8, 2, 0], Hips_pos: [0, -0.032, 0]
      }, 'out'),
      K(0.56, { Head: [-6, 10, 0], Chest: [-6, 4, 0] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },
  // TRAPDOOR — one flat stamp of the foot, and he leans over to look down the
  // hole afterwards. The look is the punchline.
  bit_trapdoor: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.12, { ThighR: [-48, 4, 0], ShinR: [56, 0, 0], FootR: [-16, 10, 0], Hips_pos: [0, -0.022, 0], Chest: [-4, 0, 0], UpArmL: [-38, 20, 26], UpArmR: [-34, -16, -24] }, 'in'),
      K(0.22, { ThighR: [6, 4, 0], ShinR: [4, 0, 0], FootR: [8, 10, 0], Hips_pos: [0, -0.086, 0], Chest: [10, 0, 0], Spine: [8, 0, 0], Head: [10, 0, 0], UpArmL: [-14, 16, 20], UpArmR: [-12, -14, -18] }, 'snap'),
      K(0.34, { Hips_pos: [0, -0.060, 0], Chest: [6, 0, 0] }, 'hold'),
      // he leans over the hole
      K(0.56, { Spine: [30, -4, 0], Chest: [22, -4, 0], Neck: [12, 0, 0], Head: [26, 2, 0], Hips_pos: [0, -0.100, 0], UpArmL: [26, 20, 14], LoArmL: [-88, 12, 0], UpArmR: [28, -18, -12], LoArmR: [-90, -10, 0] }, 'out'),
      K(0.72, { Spine: [32, -4, 0], Head: [28, -6, 0] }, 'hold'),
      K(0.86, {}, 'out')
    ]
  },
  // STAGE LIGHT — he looks UP, points UP, and then covers his own head. The
  // only bit whose gesture leaves the horizontal plane.
  bit_stagelight: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.14, { Neck: [-14, 0, 0], Head: [-34, 0, 0], Chest: [-8, 0, 0], Spine: [-6, 0, 0], Hips_pos: [0, -0.036, 0] }, 'out'),
      K(0.26, { UpArmR: [-158, -8, -14], LoArmR: [-16, 0, 0], HandR: [-12, -70, 0], Neck: [-16, 0, 0], Head: [-38, 4, 0], Chest: [-10, 4, 0] }, 'snap'),
      K(0.42, { UpArmR: [-160, -8, -14], Head: [-38, 4, 0] }, 'hold'),
      // and he covers up, which is funnier than watching it land
      K(0.58, {
        UpArmL: [-140, 26, 34], LoArmL: [-84, 18, 0], UpArmR: [-138, -24, -32], LoArmR: [-86, -16, 0],
        Neck: [12, 0, 0], Head: [24, 0, 0], Chest: [16, 0, 0], Spine: [12, 0, 0], Hips_pos: [0, -0.104, 0],
        ThighL: [-26, -8, 0], ShinL: [34, 0, 0], ThighR: [-22, 4, 0], ShinR: [30, 0, 0]
      }, 'snap'),
      K(0.76, { UpArmL: [-136, 26, 34], Head: [22, 0, 0], Hips_pos: [0, -0.104, 0] }, 'hold'),
      K(0.92, {}, 'out')
    ]
  },

  // ---- THE SIX BIG ONES (RT) ---------------------------------------------
  // All six are slower, wider and MORE COMMITTED than the bits — the shape of
  // an RT rather than an RB — and every one of them ends with him still
  // watching, because he never quite believes it either.
  ct2: bit(0.98,
    { UpArmL: [-120, 22, 22], LoArmL: [-56, 14, 0], UpArmR: [-118, -20, -20], LoArmR: [-58, -12, 0], Chest: [-8, 0, 0] },
    { UpArmL: [-124, 22, 22], UpArmR: [-122, -20, -20] },
    { UpArmL: [-44, 12, 16], LoArmL: [-12, 0, 0], UpArmR: [-42, -10, -14], LoArmR: [-12, 0, 0], Chest: [18, 0, 0], Hips_pos: [0, -0.120, 0] },
    { Chest: [8, 0, 0], Head: [10, 0, 0] }),

  // ANVIL — both hands up flat as though he is holding a ceiling, then he
  // drops them and steps smartly back out of the way.
  big_anvil: {
    dur: 1.02, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmL: [-150, 20, 26], LoArmL: [-34, 8, 0], HandL: [-70, 40, 0], UpArmR: [-148, -18, -24], LoArmR: [-36, -8, 0], HandR: [-68, -38, 0], Neck: [-10, 0, 0], Head: [-26, 0, 0], Chest: [-8, 0, 0], Hips_pos: [0, -0.022, 0] }, 'out'),
      K(0.38, { UpArmL: [-154, 20, 26], UpArmR: [-152, -18, -24], Head: [-28, 0, 0] }, 'hold'),
      K(0.50, { UpArmL: [-58, 16, 22], LoArmL: [-40, 0, 0], UpArmR: [-56, -14, -20], LoArmR: [-42, 0, 0], Chest: [8, 0, 0], Head: [4, 0, 0], Hips_pos: [0, -0.074, 0] }, 'snap'),
      K(0.68, { Hips_pos: [0, -0.096, 0], ThighL: [-22, -8, 0], ShinL: [28, 0, 0], ThighR: [16, 4, 0], ShinR: [24, 0, 0], Chest: [-4, 0, 0], Head: [-8, 6, 0], UpArmL: [-30, 20, 30], UpArmR: [-26, -18, -28] }, 'out'),
      K(1.02, {}, 'out')
    ]
  },
  // SAFE — he mimes a combination dial with one hand, listens to it, then
  // shrugs. The listening beat is the joke.
  big_safe: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.18, { UpArmR: [-72, -6, -22], LoArmR: [-58, -6, 0], HandR: [-20, -40, 0], Neck: [0, -14, 0], Head: [4, -26, 0], Chest: [4, -10, 0] }, 'out'),
      K(0.30, { HandR: [-20, -110, 0] }, 'snap'),
      K(0.40, { HandR: [-20, -30, 0] }, 'snap'),
      K(0.54, { Neck: [2, -20, 0], Head: [8, -34, 0], UpArmR: [-70, -6, -22] }, 'hold'),
      K(0.68, { UpArmL: [-64, 34, 44], LoArmL: [-24, 22, 0], HandL: [-44, 62, 0], UpArmR: [-60, -30, -42], LoArmR: [-22, -18, 0], HandR: [-42, -58, 0], ClavL: [0, 0, 16], ClavR: [0, 0, -16], Head: [-6, 0, 0], Chest: [-6, 0, 0] }, 'snap'),
      K(0.88, { UpArmL: [-60, 34, 42], UpArmR: [-56, -30, -40], Head: [-4, 8, 0] }, 'hold'),
      K(1.10, {}, 'out')
    ]
  },
  // CURTAIN — one enormous sweeping pull across his body, like a stagehand
  // hauling a rope, and he takes a small bow at the end.
  big_curtain: {
    dur: 1.16, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmR: [-130, -30, -10], LoArmR: [-52, -20, 0], HandR: [-24, -60, 0], Chest: [-6, -32, 0], Hips: [0, 44, 0], Hips_pos: [0, -0.036, 0] }, 'out'),
      K(0.34, { UpArmR: [-132, -30, -10] }, 'hold'),
      K(0.50, { UpArmR: [-52, 56, -16], LoArmR: [-30, 0, 0], HandR: [-20, 40, 0], Chest: [10, 42, 0], Spine: [8, 28, 0], Hips: [4, -22, 0], Head: [6, 30, 0], Hips_pos: [0, -0.104, 0], ThighL: [-26, -8, 0], ShinL: [32, 0, 0] }, 'snap'),
      K(0.66, { UpArmR: [-48, 60, -16], Chest: [10, 46, 0] }, 'hold'),
      // the bow
      K(0.88, { Spine: [40, -4, 0], Chest: [28, -4, 0], Neck: [10, 0, 0], Head: [20, 0, 0], Hips: [0, 16, 0], UpArmL: [-16, 30, 20], LoArmL: [-80, 22, 0], UpArmR: [-14, -26, -18], LoArmR: [-82, -20, 0], Hips_pos: [0, -0.060, 0] }, 'out'),
      K(1.16, {}, 'out')
    ]
  },
  // FIRE HOSE — he braces against the recoil with both hands, feet planted
  // wide, and gets shoved backwards by it. The only Big One where the RECOIL
  // is the animation.
  big_firehose: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      K(0.18, { UpArmL: [-84, 22, 20], LoArmL: [-52, 14, 0], HandL: [-20, 50, 0], UpArmR: [-80, -20, -18], LoArmR: [-50, -12, 0], HandR: [-18, -46, 0], Chest: [6, 0, 0], Hips_pos: [0, -0.086, 0], ThighL: [-24, -12, 0], ShinL: [30, 0, 0], ThighR: [18, 8, 0], ShinR: [26, 0, 0] }, 'out'),
      K(0.32, { UpArmL: [-86, 22, 20], UpArmR: [-82, -20, -18] }, 'hold'),
      K(0.44, { Chest: [-14, 0, 0], Spine: [-10, 0, 0], Head: [-16, 0, 0], UpArmL: [-96, 20, 18], UpArmR: [-92, -18, -16], Hips_pos: [0, -0.110, 0] }, 'snap'),
      K(0.66, { Chest: [-18, 4, 0], Head: [-20, -4, 0], Hips_pos: [0, -0.122, 0], ThighL: [-30, -12, 0], ShinL: [38, 0, 0], ThighR: [24, 8, 0], ShinR: [32, 0, 0] }, 'out'),
      K(0.88, { Chest: [-12, -4, 0], Head: [-14, 4, 0], Hips_pos: [0, -0.100, 0] }, 'out'),
      K(1.20, {}, 'out')
    ]
  },
  // FOAM FINGER — a full baseball swing, both hands, all the way round, and he
  // ends up wound completely off his own feet.
  big_foamfinger: {
    dur: 1.14, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmL: [-120, 44, 10], LoArmL: [-70, 30, 0], UpArmR: [-116, -40, -8], LoArmR: [-72, -28, 0], Chest: [-8, -46, 0], Spine: [-5, -30, 0], Hips: [0, 52, 0], Head: [-4, -30, 0], Hips_pos: [0, -0.070, 0] }, 'in'),
      K(0.36, { UpArmL: [-124, 46, 10], UpArmR: [-120, -42, -8], Chest: [-9, -50, 0] }, 'hold'),
      K(0.50, { UpArmL: [-94, -34, 22], LoArmL: [-18, 0, 0], UpArmR: [-90, 30, -20], LoArmR: [-18, 0, 0], Chest: [12, 48, 0], Spine: [9, 32, 0], Hips: [4, -30, 0], Head: [8, 34, 0], Hips_pos: [0, -0.116, 0], ThighL: [-32, -8, 0], ShinL: [40, 0, 0], ThighR: [24, 4, 0], ShinR: [46, 0, 0] }, 'snap'),
      K(0.70, { Chest: [10, 76, 0], Hips: [4, -60, 0], Head: [6, 48, 0], UpArmL: [-60, -50, 26], UpArmR: [-56, 44, -24], Hips_pos: [0, -0.092, 0] }, 'out'),
      K(1.14, {}, 'out')
    ]
  },
  // PIANO — the biggest and the stillest. He points up with ONE finger,
  // holds it, and does not move again until it lands. Then he winces.
  big_piano: {
    dur: 1.26, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-166, -6, -10], LoArmR: [-10, 0, 0], HandR: [-8, -70, 0], Neck: [-12, 0, 0], Head: [-32, 2, 0], Chest: [-8, 2, 0], Spine: [-5, 2, 0], Hips_pos: [0, -0.026, 0] }, 'out'),
      K(0.52, { UpArmR: [-168, -6, -10], Head: [-34, 2, 0] }, 'hold'),
      K(0.66, { UpArmR: [-168, -6, -10], Head: [-34, 2, 0] }, 'hold'),
      K(0.78, {
        // the wince — shoulders up, eyes away, one hand half-raised
        ClavL: [0, 0, 22], ClavR: [0, 0, -22],
        UpArmL: [-70, 30, 40], LoArmL: [-96, 24, 0], UpArmR: [-96, -24, -34], LoArmR: [-84, -18, 0],
        Neck: [8, -12, 0], Head: [16, -30, 0], Chest: [12, -12, 0], Spine: [9, -8, 0], Hips_pos: [0, -0.108, 0],
        ThighL: [-24, -8, 0], ShinL: [32, 0, 0], ThighR: [-20, 4, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      K(1.00, { Head: [12, -22, 0], Chest: [8, -8, 0], Hips_pos: [0, -0.090, 0] }, 'hold'),
      K(1.26, {}, 'out')
    ]
  },

  // ---- D-pad RIGHT — THE GAME SHOW ---------------------------------------
  // He throws both arms wide and PRESENTS. This is the only clip in the file
  // where he looks completely confident from the first frame, and it holds
  // that pose for a long time because the arena is changing behind him.
  ult: {
    dur: 1.80, loop: false, keys: [
      K(0, {}),
      K(0.24, { UpArmL: [-30, 24, 16], LoArmL: [-84, 20, 0], UpArmR: [-26, -20, -14], LoArmR: [-86, -18, 0], Chest: [8, 0, 0], Head: [10, 0, 0], Hips_pos: [0, -0.086, 0] }, 'in'),
      K(0.46, {
        ClavL: [0, 0, 22], ClavR: [0, 0, -22],
        UpArmL: [-104, 20, 62], LoArmL: [-10, 10, 0], HandL: [-30, 74, 0],
        UpArmR: [-100, -18, -60], LoArmR: [-10, -8, 0], HandR: [-28, -70, 0],
        Chest: [-16, 0, 0], Spine: [-11, 0, 0], Neck: [-8, 0, 0], Head: [-22, 0, 0],
        Hips_pos: [0, -0.006, 0], ThighL: [-4, -10, 0], ShinL: [4, 0, 0], ThighR: [-2, 6, 0], ShinR: [4, 0, 0]
      }, 'snap'),
      K(1.35, { UpArmL: [-108, 20, 64], UpArmR: [-104, -18, -62], Head: [-24, 0, 0], Chest: [-17, 0, 0] }, 'hold'),
      K(1.80, {}, 'out')
    ]
  },

  // ---- THE GAME SHOW HOST SET --------------------------------------------
  // ANNOUNCING — one arm out toward the contestant, the other holding an
  // imaginary card at chest height. He reads the question off it.
  hostAnnounce: {
    dur: 1.0, loop: true, keys: [
      K(0, {
        UpArmL: [-64, 20, 18], LoArmL: [-96, 16, 0], HandL: [-30, 46, 0],
        UpArmR: [-86, 6, -34], LoArmR: [-16, 0, 0], HandR: [-14, -64, 0],
        Chest: [-4, 8, 0], Neck: [-2, 4, 0], Head: [-8, 10, 0], Hips_pos: [0, -0.034, 0]
      }),
      K(0.5, { UpArmR: [-94, 10, -38], Head: [-10, 16, 0], Chest: [-5, 12, 0], Hips_pos: [0, -0.024, 0] }),
      K(1.0, {
        UpArmL: [-64, 20, 18], LoArmL: [-96, 16, 0], HandL: [-30, 46, 0],
        UpArmR: [-86, 6, -34], LoArmR: [-16, 0, 0], HandR: [-14, -64, 0],
        Chest: [-4, 8, 0], Neck: [-2, 4, 0], Head: [-8, 10, 0], Hips_pos: [0, -0.034, 0]
      })
    ]
  },
  // REACTING WELL — the contestant is doing fine and he is enjoying it far too
  // much: he leans in, hands clasped, bouncing.
  hostGood: {
    dur: 0.9, loop: true, keys: [
      K(0, { UpArmL: [-72, 28, 20], LoArmL: [-96, 22, 0], UpArmR: [-70, -24, -18], LoArmR: [-98, -20, 0], Spine: [16, -2, 0], Chest: [12, -2, 0], Head: [14, 4, 0], Hips_pos: [0, -0.072, 0] }),
      K(0.45, { Spine: [12, -2, 0], Chest: [8, -2, 0], Head: [10, -2, 0], Hips_pos: [0, -0.044, 0], UpArmL: [-66, 28, 24] }),
      K(0.9, { UpArmL: [-72, 28, 20], LoArmL: [-96, 22, 0], UpArmR: [-70, -24, -18], LoArmR: [-98, -20, 0], Spine: [16, -2, 0], Chest: [12, -2, 0], Head: [14, 4, 0], Hips_pos: [0, -0.072, 0] })
    ]
  },
  // REACTING BADLY — they are struggling, and he is doing the exaggerated
  // sympathetic wince a host does when somebody is about to lose everything.
  hostBad: {
    dur: 0.9, loop: true, keys: [
      K(0, { ClavL: [0, 0, 18], ClavR: [0, 0, -18], UpArmL: [-40, 26, 30], LoArmL: [-70, 20, 0], HandL: [-40, 54, 0], UpArmR: [-36, -22, -28], LoArmR: [-68, -18, 0], Neck: [4, -8, 0], Head: [8, -18, 0], Chest: [6, -8, 0] }),
      K(0.45, { Head: [10, -24, 0], Neck: [5, -10, 0], ClavL: [0, 0, 22], ClavR: [0, 0, -22] }),
      K(0.9, { ClavL: [0, 0, 18], ClavR: [0, 0, -18], UpArmL: [-40, 26, 30], LoArmL: [-70, 20, 0], HandL: [-40, 54, 0], UpArmR: [-36, -22, -28], LoArmR: [-68, -18, 0], Neck: [4, -8, 0], Head: [8, -18, 0], Chest: [6, -8, 0] })
    ]
  },
  // CELEBRATING A FAILURE — both arms straight up, head back. Genuinely
  // delighted. This is the pose the instant KO holds.
  hostCelebrate: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.18, { Hips_pos: [0, -0.100, 0], ThighL: [-24, -10, 0], ShinL: [32, 0, 0], ThighR: [-20, 6, 0], ShinR: [28, 0, 0], UpArmL: [-20, 22, 18], UpArmR: [-18, -18, -16], Chest: [10, 0, 0] }, 'in'),
      K(0.34, {
        Hips_pos: [0, 0.055, 0],
        UpArmL: [-176, 12, 24], LoArmL: [-8, 0, 0], HandL: [-6, 40, 0],
        UpArmR: [-174, -10, -22], LoArmR: [-8, 0, 0], HandR: [-6, -38, 0],
        Chest: [-20, 0, 0], Spine: [-14, 0, 0], Neck: [-10, 0, 0], Head: [-30, 0, 0],
        ThighL: [-16, -10, 0], ShinL: [22, 0, 0], ThighR: [-12, 6, 0], ShinR: [18, 0, 0]
      }, 'snap'),
      K(1.10, { UpArmL: [-178, 12, 24], UpArmR: [-176, -10, -22], Head: [-32, 0, 0], Hips_pos: [0, 0.010, 0] }, 'hold'),
      K(1.6, {}, 'out')
    ]
  },
  // SULKING AT A CLEAN PASS — hands in nonexistent pockets, shoulders down,
  // scuffing the floor with one shoe. He is a small boy who lost a bet.
  hostSulk: {
    dur: 1.8, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        ClavL: [0, 0, -8], ClavR: [0, 0, 8],
        UpArmL: [-6, 16, 6], LoArmL: [-42, 12, 0], HandL: [-20, 30, 0],
        UpArmR: [-4, -14, -6], LoArmR: [-40, -10, 0], HandR: [-18, -28, 0],
        Spine: [14, -4, 0], Chest: [11, -4, 0], Neck: [6, 0, 0], Head: [18, -6, 0],
        Hips_pos: [0, -0.070, 0]
      }, 'out'),
      K(0.80, { ThighR: [-18, 6, 0], ShinR: [22, 0, 0], FootR: [-14, 8, 0], Head: [20, -10, 0] }, 'out'),
      K(1.15, { ThighR: [8, 6, 0], ShinR: [6, 0, 0], FootR: [10, 8, 0], Head: [18, -4, 0] }, 'out'),
      K(1.55, { Head: [16, 8, 0], Spine: [13, -3, 0] }, 'out'),
      K(1.8, { Head: [18, -2, 0] }, 'hold')
    ]
  },

  // ---- TAUNT — AN ACTUAL JOKE --------------------------------------------
  // He turns to CAMERA — not to the opponent — takes his time, delivers, and
  // then does the little open-handed "thank you, you've been great" at the end
  // while the rimshot plays. The turn-to-camera is the whole gag and it is why
  // the Hips key is a full 90 degrees: nobody else in the roster does this.
  taunt: {
    dur: 3.6, loop: false, keys: [
      K(0, {}),
      K(0.45, { Hips: [0, 88, 0], Chest: [-4, 30, 0], Spine: [-2, 22, 0], Neck: [-2, 10, 0], Head: [-6, 34, 0], UpArmL: [-40, 22, 26], LoArmL: [-58, 18, 0], Hips_pos: [0, -0.036, 0] }, 'out'),
      // the set-up
      K(1.05, { UpArmL: [-72, 26, 40], LoArmL: [-34, 20, 0], HandL: [-40, 58, 0], Head: [-10, 38, 0], Chest: [-6, 34, 0] }, 'out'),
      // THE PAUSE. Longer than is comfortable, which is the joke.
      K(1.60, { UpArmL: [-70, 26, 38], Head: [-8, 36, 0] }, 'hold'),
      // the punchline, with the whole body
      K(1.86, {
        ClavL: [0, 0, 20], ClavR: [0, 0, -20],
        UpArmL: [-96, 22, 58], LoArmL: [-12, 12, 0], HandL: [-46, 72, 0],
        UpArmR: [-90, -20, -54], LoArmR: [-12, -10, 0], HandR: [-44, -68, 0],
        Chest: [-14, 30, 0], Neck: [-8, 10, 0], Head: [-24, 34, 0], Hips_pos: [0, 0.004, 0]
      }, 'snap'),
      K(2.30, { UpArmL: [-92, 22, 56], UpArmR: [-86, -20, -52], Head: [-22, 34, 0] }, 'hold'),
      // "you've been great"
      K(2.72, { UpArmL: [-64, 24, 34], LoArmL: [-40, 18, 0], UpArmR: [-58, -22, -32], LoArmR: [-38, -16, 0], Head: [-12, 30, 0], Chest: [-6, 28, 0], Spine: [-3, 20, 0], Hips_pos: [0, -0.030, 0] }, 'out'),
      K(3.15, { Hips: [0, 40, 0], Chest: [0, 8, 0], Head: [0, 12, 0] }, 'out'),
      K(3.6, {}, 'out')
    ]
  },

  // Victory: a bow, and then he waits for applause that may not come.
  victory: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      K(0.55, { Spine: [42, -4, 0], Chest: [30, -4, 0], Neck: [10, 0, 0], Head: [22, 0, 0], UpArmL: [-14, 30, 18], LoArmL: [-84, 22, 0], UpArmR: [-12, -26, -16], LoArmR: [-86, -20, 0], Hips_pos: [0, -0.060, 0] }, 'out'),
      K(1.10, { Spine: [44, -4, 0], Head: [24, 0, 0] }, 'hold'),
      K(1.60, { Chest: [-6, -6, 0], Head: [-10, -4, 0], UpArmL: [-52, 22, 36], UpArmR: [-46, -18, -34], Hips_pos: [0, -0.028, 0] }, 'out'),
      K(2.40, { Head: [-8, 18, 0], Chest: [-4, 6, 0] }, 'out'),
      K(3.4, {}, 'hold')
    ]
  },

  // ---- FINISHER CLIPS -----------------------------------------------------
  // takabaShrug — the "I don't know either" that the finisher opens on.
  takabaShrug: {
    dur: 0.9, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        ClavL: [0, 0, 22], ClavR: [0, 0, -22],
        UpArmL: [-52, 28, 40], LoArmL: [-26, 22, 0], HandL: [-46, 62, 0],
        UpArmR: [-48, -24, -38], LoArmR: [-24, -20, 0], HandR: [-44, -58, 0],
        Head: [4, 6, 0], Chest: [2, 4, 0], Hips_pos: [0, -0.030, 0]
      }, 'snap'),
      K(0.62, { ClavL: [0, 0, 24], ClavR: [0, 0, -24], Head: [4, -8, 0] }, 'hold'),
      K(0.9, {}, 'out')
    ]
  },
  // takabaPresent — the game-show present, held, for the finisher's big beat.
  takabaPresent: {
    dur: 1.4, loop: false, keys: [
      K(0, {}),
      K(0.26, {
        UpArmL: [-104, 20, 62], LoArmL: [-10, 10, 0], HandL: [-30, 74, 0],
        UpArmR: [-100, -18, -60], LoArmR: [-10, -8, 0], HandR: [-28, -70, 0],
        Chest: [-16, 0, 0], Neck: [-8, 0, 0], Head: [-22, 0, 0], Hips_pos: [0, -0.008, 0]
      }, 'snap'),
      K(1.05, { UpArmL: [-108, 20, 64], UpArmR: [-104, -18, -62], Head: [-24, 0, 0] }, 'hold'),
      K(1.4, {}, 'out')
    ]
  },
  // takabaLaugh — genuinely delighted, doubled over. The outro.
  takabaLaugh: {
    dur: 2.2, loop: false, keys: [
      K(0, {}),
      K(0.30, { Spine: [34, -4, 0], Chest: [24, -4, 0], Neck: [8, 0, 0], Head: [18, 0, 0], UpArmL: [-30, 26, 24], LoArmL: [-102, 20, 0], UpArmR: [-26, -22, -22], LoArmR: [-104, -18, 0], Hips_pos: [0, -0.084, 0] }, 'out'),
      K(0.52, { Spine: [24, -4, 0], Chest: [16, -4, 0], Head: [10, 0, 0], Hips_pos: [0, -0.056, 0] }, 'out'),
      K(0.74, { Spine: [36, -4, 0], Chest: [26, -4, 0], Head: [20, 0, 0], Hips_pos: [0, -0.090, 0] }, 'out'),
      K(0.96, { Spine: [26, -4, 0], Chest: [17, -4, 0], Head: [11, 0, 0], Hips_pos: [0, -0.058, 0] }, 'out'),
      K(1.40, { Spine: [10, -5, 0], Chest: [6, -6, 0], Head: [0, 6, 0], Hips_pos: [0, -0.040, 0], UpArmL: [-40, 24, 30] }, 'out'),
      K(2.2, {}, 'hold')
    ]
  }
};
