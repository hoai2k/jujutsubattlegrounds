// FINISHERS — THE WINNER'S SIGNATURE CLIPS
// ===========================================================================
// One authored clip per character (two for a couple of them): the beat that
// makes the finisher THAT CHARACTER'S finisher and could not be assembled out
// of their existing kit. Everything else in a finisher is choreographed from
// the clips the character already has — their own technique animations are in
// character by construction, already carry the right weight, and already drive
// the model's secondary motion — so this file is deliberately only the moments
// that do not exist yet.
//
// These are compiled per body by retarget.js against the character's OWN
// stance, so a bone a key does not name falls back to that character's posture
// rather than to a T-pose, and the Hips track is scaled to the body.
//
// Authoring conventions are the project's (see art/anim/base.js):
//   limbs hanging down: rx<0 swings the limb forward/up, rx>0 back
//   rz>0 abducts the LEFT arm outward, rz<0 abducts the RIGHT
//   spine/head rx>0 leans forward · Hips_pos is metres, and gets scaled
//   ease lives on the destination key: 'in' anticipation, 'snap'/'out' strike,
//   'hold' a true freeze — and a held frame after an impact matters more than
//   the impact.
// ===========================================================================

const K = (t, pose, e) => ({ t, pose, e });

export const SIGNATURE_CLIPS = {

  // ---- NAOYA — THE HAIR BRUSH -------------------------------------------
  // From the Choso fight: mid-exchange, with someone genuinely trying to kill
  // him, he takes a hand off the fight to put his hair back. The whole joke is
  // that it costs him nothing, so the pose has to be UNHURRIED while the clip
  // around it is not — and it is authored on `hold` keys like the rest of his
  // set, so he ARRIVES at each stage of it rather than travelling there. Four
  // arrivals: the hand goes up, the sweep, the settle, and the chin.
  naoyaBrush: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      // the hand is simply already at his temple
      K(0.083, {
        Hips: [0, 40, 0], Hips_pos: [0, -0.050, -0.032], Chest: [-6, -20, 0], Spine: [-3, -12, 0],
        Neck: [-4, -6, 0], Head: [-12, -16, 2],
        UpArmR: [-118, -12, -38], LoArmR: [-126, -18, -4], HandR: [-30, -70, 0],
        UpArmL: [-6, 10, 12], LoArmL: [-44, 20, 0], HandL: [-8, 30, 0],
        ThighL: [-22, -6, 0], ShinL: [16, 0, 0], ThighR: [20, 8, 0], ShinR: [28, 0, 0]
      }, 'hold'),
      // THE SWEEP. Fingers through it, all the way back over the crown.
      K(0.33, {
        Hips: [0, 44, 0], Hips_pos: [0, -0.046, -0.030], Chest: [-8, -24, 0], Spine: [-4, -14, 0],
        Neck: [-6, -8, 0], Head: [-18, -20, 3],
        UpArmR: [-152, 6, -30], LoArmR: [-84, -10, -4], HandR: [-24, -50, 0],
        UpArmL: [-6, 10, 12], LoArmL: [-44, 20, 0],
        ThighL: [-24, -6, 0], ShinL: [16, 0, 0], ThighR: [22, 8, 0], ShinR: [30, 0, 0]
      }, 'hold'),
      // held there, eyes closed, while something goes past his ear
      K(0.58, {
        Hips: [0, 44, 0], Hips_pos: [0, -0.044, -0.030], Chest: [-8, -24, 0], Head: [-19, -20, 3],
        UpArmR: [-150, 8, -28], LoArmR: [-80, -10, -4],
        UpArmL: [-6, 10, 12], LoArmL: [-44, 20, 0],
        ThighL: [-24, -6, 0], ShinL: [16, 0, 0], ThighR: [22, 8, 0], ShinR: [30, 0, 0]
      }, 'hold'),
      // the hand comes down and finds his pocket. He has not looked at them.
      K(0.83, {
        Hips: [0, 36, 0], Hips_pos: [0, -0.054, -0.034], Chest: [-4, -16, 0], Spine: [-2, -10, 0],
        Neck: [-3, -2, 0], Head: [-10, -6, 0],
        UpArmR: [-14, -14, -16], LoArmR: [-52, -26, 0], HandR: [-10, -40, 0],
        UpArmL: [-6, 10, 12], LoArmL: [-44, 18, 0],
        ThighL: [-24, -6, 0], ShinL: [16, 0, 0], ThighR: [20, 8, 0], ShinR: [28, 0, 0]
      }, 'hold'),
      // CHIN UP. And now he looks.
      K(1.05, {
        Hips: [0, 30, 0], Hips_pos: [0, -0.052, -0.030], Chest: [-5, -10, 0], Spine: [-3, -6, 0],
        Neck: [-4, -2, 0], Head: [-16, -4, 0],
        UpArmR: [-12, -14, -14], LoArmR: [-50, -26, 0],
        UpArmL: [-6, 10, 12], LoArmL: [-44, 18, 0],
        ThighL: [-22, -6, 0], ShinL: [16, 0, 0], ThighR: [20, 8, 0], ShinR: [28, 0, 0]
      }, 'hold'),
      K(1.30, {
        Hips: [0, 30, 0], Hips_pos: [0, -0.052, -0.030], Head: [-16, -4, 0], Chest: [-5, -10, 0],
        UpArmR: [-12, -14, -14], LoArmR: [-50, -26, 0], UpArmL: [-6, 10, 12], LoArmL: [-44, 18, 0]
      }, 'hold')
    ]
  },

  // ---- GOJO — HANDS IN POCKETS ------------------------------------------
  // The Jogo fight. Everything thrown at him stops six inches away and he does
  // not take his hands out. The only things that move in this clip are his
  // head and his weight — which is the entire performance, because stillness
  // only reads as contempt if the frame around it is violent.
  gojoPockets: {
    dur: 1.25, loop: false, keys: [
      K(0, {
        UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0], HandL: [-14, 40, 0],
        UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0], HandR: [-14, -40, 0],
        Hips: [0, 20, 0], Hips_pos: [0, -0.040, 0], Spine: [-2, -6, 0], Chest: [-4, -8, 0],
        Head: [-6, -6, 0]
      }),
      // the head tilts, unhurried, to watch the attack arrive
      K(0.36, {
        UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0], UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0],
        Hips: [0, 22, 0], Hips_pos: [0, -0.038, -0.02], Spine: [-3, -6, 0], Chest: [-5, -10, 0],
        Neck: [-2, -6, 0], Head: [-10, -22, 6]
      }),
      // a single shoulder roll as it stops. Nothing else.
      K(0.62, {
        UpArmL: [-12, 14, 18], LoArmL: [-52, 24, 0], UpArmR: [-6, -10, -12], LoArmR: [-58, -24, 0],
        Hips: [0, 26, 0], Hips_pos: [0, -0.044, -0.01], Chest: [-6, -14, 0], Spine: [-3, -8, 0],
        Head: [-8, -16, 4]
      }, 'snap'),
      // he straightens. Both hands still in his pockets.
      K(0.95, {
        UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0], UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0],
        Hips: [0, 16, 0], Hips_pos: [0, -0.036, 0.01], Spine: [0, -4, 0], Chest: [-1, -6, 0],
        Neck: [0, -2, 0], Head: [-2, -4, 0]
      }, 'out'),
      K(1.25, {
        UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0], UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0],
        Hips: [0, 14, 0], Hips_pos: [0, -0.034, 0.01], Head: [0, -2, 0]
      })
    ]
  },

  // ---- GOJO 【SHINJUKU】 — THE EXCHANGE ----------------------------------
  // The Shinjuku fight is the one where he stops being untouchable and starts
  // being a martial artist: bare hands, at range zero, trading. Six positions
  // in a second and a quarter, all of them contact, none of them a technique.
  gojoCQC: {
    dur: 1.25, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        Hips: [0, 34, 0], Hips_pos: [0, -0.10, 0.03], Chest: [4, 12, 0], Spine: [3, 8, 0],
        UpArmL: [-88, -6, -2], LoArmL: [-8, 0, 0], HandL: [-4, 104, 0],
        UpArmR: [-34, -10, -20], LoArmR: [-108, 0, -6], Head: [4, -12, 0],
        ThighL: [-42, -4, 0], ShinL: [24, 0, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(0.28, {
        Hips: [0, -18, 0], Hips_pos: [0, -0.12, 0.05], Chest: [6, -20, 0], Spine: [4, -12, 0],
        UpArmR: [-92, 8, 0], LoArmR: [-6, 0, 0], HandR: [-6, -168, 0],
        UpArmL: [-30, 12, 18], LoArmL: [-104, 0, 6], Head: [6, 8, 0],
        ThighL: [-30, -4, 0], ShinL: [20, 0, 0], ThighR: [18, 6, 0], ShinR: [36, 0, 0]
      }, 'snap'),
      // the elbow, turned in tight
      K(0.46, {
        Hips: [2, 40, 0], Hips_pos: [0, -0.14, 0.02], Chest: [8, 20, 0], Spine: [5, 12, 0],
        UpArmR: [-70, 26, -16], LoArmR: [-112, 0, -6], HandR: [-20, -70, 0],
        UpArmL: [-26, 14, 20], LoArmL: [-100, 0, 6], Head: [8, -10, 0],
        ThighL: [-46, -4, 0], ShinL: [30, 0, 0], ThighR: [30, 6, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      // and he steps INSIDE, which is the beat: he is not keeping them away
      K(0.70, {
        Hips: [4, 8, 0], Hips_pos: [0, -0.18, 0.14], Chest: [10, -4, 0], Spine: [7, -2, 0],
        UpArmL: [-104, -10, 10], LoArmL: [-16, 0, 4], HandL: [-8, 92, 0],
        UpArmR: [-96, 8, -8], LoArmR: [-14, 0, -4], HandR: [-8, -92, 0],
        Head: [10, 0, 0], Neck: [4, 0, 0],
        ThighL: [-56, -4, 0], ShinL: [38, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.84, {
        Hips: [4, 8, 0], Hips_pos: [0, -0.18, 0.14], Chest: [10, -4, 0], Head: [10, 0, 0],
        UpArmL: [-104, -10, 10], UpArmR: [-96, 8, -8],
        ThighL: [-56, -4, 0], ShinL: [38, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'hold'),
      K(1.25, {}, 'out')
    ]
  },

  // ---- SUKUNA — ARMS FOLDED ---------------------------------------------
  // He does not block and he does not move. All four arms fold, the second
  // pair a beat after the first, and he tilts his head to look at whatever
  // just failed to hurt him. The delay between the two pairs is the whole
  // reason to author this by hand rather than mirror it.
  sukunaFold: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // the upper pair crosses
      K(0.22, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.040, -0.02], Spine: [-2, -6, 0], Chest: [-4, -10, 0],
        Neck: [-2, -2, 0], Head: [-8, -8, 0],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0], HandL: [-20, 80, 0],
        UpArmR: [-60, -28, 20], LoArmR: [-124, -38, 0], HandR: [-20, -80, 0]
      }, 'out'),
      // the lower pair follows, folded UNDER the first
      K(0.44, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.042, -0.02], Chest: [-4, -10, 0], Head: [-9, -10, 0],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmR: [-60, -28, 20], LoArmR: [-124, -38, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0], HandL2: [-18, 70, 0],
        UpArmR2: [-48, -24, 28], LoArmR2: [-118, -34, 0], HandR2: [-18, -70, 0]
      }, 'out'),
      // the head tilt. Four eyes, and none of them impressed.
      K(0.72, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.040, -0.02], Chest: [-5, -12, 0], Spine: [-3, -7, 0],
        Neck: [-3, -4, 2], Head: [-14, -18, 7],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmR: [-60, -28, 20], LoArmR: [-124, -38, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0],
        UpArmR2: [-48, -24, 28], LoArmR2: [-118, -34, 0]
      }),
      K(1.20, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.040, -0.02], Chest: [-5, -12, 0], Head: [-14, -18, 7],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmR: [-60, -28, 20], LoArmR: [-124, -38, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0],
        UpArmR2: [-48, -24, 28], LoArmR2: [-118, -34, 0]
      }, 'hold')
    ]
  },

  // ---- SUKUNA 【FUSHIGURO】 — 開 ------------------------------------------
  // The vessel form has two arms, so the four-armed fan is not available to it
  // — and it does not need it. This is the palm coming up and the world
  // catching fire behind it: one arm out, fingers open, everything else still.
  sukunaFire: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        Hips: [0, 34, 0], Hips_pos: [0, -0.07, -0.04], Spine: [-4, -14, 0], Chest: [-6, -22, 0],
        Head: [-10, -18, 0],
        UpArmR: [-40, -20, -26], LoArmR: [-110, -10, -4], HandR: [-30, -70, 0],
        UpArmL: [-14, 12, 14], LoArmL: [-52, 20, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [28, 0, 0]
      }, 'in'),
      // the palm comes up and opens, level with his own eye
      K(0.46, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.11, 0.03], Spine: [4, -4, 0], Chest: [6, -6, 0],
        Neck: [2, 0, 0], Head: [2, -6, 0],
        UpArmR: [-104, 6, -6], LoArmR: [-16, 0, -2], HandR: [-84, -20, 0],
        UpArmL: [-20, 12, 16], LoArmL: [-70, 18, 0],
        ThighL: [-34, -4, 0], ShinL: [26, 0, 0], ThighR: [24, 6, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      K(0.74, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.11, 0.03], Chest: [6, -6, 0], Head: [2, -6, 0],
        UpArmR: [-106, 6, -6], LoArmR: [-14, 0, -2], HandR: [-86, -20, 0],
        UpArmL: [-20, 12, 16], LoArmL: [-70, 18, 0],
        ThighL: [-34, -4, 0], ShinL: [26, 0, 0], ThighR: [24, 6, 0], ShinR: [40, 0, 0]
      }, 'hold'),
      // the fingers close. That is the trigger.
      K(0.92, {
        Hips: [0, 12, 0], Hips_pos: [0, -0.13, 0.05], Chest: [8, -4, 0], Head: [4, -4, 0],
        UpArmR: [-100, 8, -8], LoArmR: [-22, 0, -2], HandR: [-70, -30, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-76, 18, 0],
        ThighL: [-38, -4, 0], ShinL: [30, 0, 0], ThighR: [28, 6, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(1.30, {}, 'out')
    ]
  },

  // ---- SUKUNA 【ITADORI】 — THE SHRINE GESTURE ---------------------------
  // Shibuya. Both arms cross over the chest and then throw open, and what
  // follows is not aimed at anyone in particular. Two arms, not four.
  sukunaShrine: {
    dur: 1.35, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.06, -0.03], Spine: [-6, -6, 0], Chest: [-10, -10, 0],
        Neck: [-4, 0, 0], Head: [-14, -6, 0],
        UpArmL: [-70, 34, -26], LoArmL: [-124, 44, 0], HandL: [-22, 84, 0],
        UpArmR: [-66, -32, 24], LoArmR: [-128, -42, 0], HandR: [-22, -84, 0]
      }, 'in'),
      K(0.44, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.06, -0.03], Chest: [-10, -10, 0], Head: [-15, -6, 0],
        UpArmL: [-70, 34, -26], LoArmL: [-124, 44, 0],
        UpArmR: [-66, -32, 24], LoArmR: [-128, -42, 0]
      }, 'hold'),
      // OPEN. Everything at once, arms straight out, head back.
      K(0.58, {
        Hips: [-6, 14, 0], Hips_pos: [0, -0.02, -0.06], Spine: [-16, -4, 0], Chest: [-18, -6, 0],
        Neck: [-10, 0, 0], Head: [-28, -2, 0],
        UpArmL: [-96, 4, 62], LoArmL: [-10, 0, 4], HandL: [-20, 30, 0],
        UpArmR: [-92, -2, -64], LoArmR: [-8, 0, -4], HandR: [-20, -30, 0],
        ThighL: [-18, -4, 0], ShinL: [14, 0, 0], ThighR: [14, 6, 0], ShinR: [20, 0, 0]
      }, 'snap'),
      K(0.86, {
        Hips: [-6, 14, 0], Hips_pos: [0, -0.02, -0.06], Chest: [-18, -6, 0], Head: [-28, -2, 0],
        UpArmL: [-96, 4, 62], UpArmR: [-92, -2, -64]
      }, 'hold'),
      K(1.35, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.05, -0.02], Spine: [-4, -6, 0], Chest: [-6, -10, 0],
        Head: [-12, -8, 0],
        UpArmL: [-40, 14, 26], LoArmL: [-70, 10, 0], UpArmR: [-36, -12, -28], LoArmR: [-74, -8, 0]
      }, 'out')
    ]
  },

  // ---- TOJI — BORED ------------------------------------------------------
  // He is not fighting. He is standing there with one hand in a pocket
  // watching someone else fight, and the only tell that he has been paying
  // attention at all is that he moves his head a fraction before he needs to.
  tojiBored: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // weight onto one hip, free hand into a pocket, chin down
      K(0.30, {
        Hips: [0, 22, 6], Hips_pos: [0.04, -0.052, -0.03], Spine: [2, -8, -3], Chest: [3, -12, -4],
        Neck: [2, -2, 0], Head: [6, -14, -3],
        UpArmL: [-10, 14, 14], LoArmL: [-48, 22, 0], HandL: [-10, 34, 0],
        ThighL: [-8, -6, 0], ShinL: [8, 0, 0], ThighR: [14, 8, 0], ShinR: [22, 0, 0]
      }, 'out'),
      // the slip. His head is somewhere else before the punch gets there.
      K(0.52, {
        Hips: [0, 30, 8], Hips_pos: [0.06, -0.070, -0.06], Spine: [4, -12, -6], Chest: [6, -18, -8],
        Neck: [3, -4, -3], Head: [10, -24, -8],
        UpArmL: [-14, 16, 16], LoArmL: [-52, 24, 0],
        ThighL: [-14, -6, 0], ShinL: [12, 0, 0], ThighR: [18, 8, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      // and back, exactly where he was, still bored
      K(0.86, {
        Hips: [0, 22, 6], Hips_pos: [0.04, -0.052, -0.03], Spine: [2, -8, -3], Chest: [3, -12, -4],
        Head: [6, -12, -3],
        UpArmL: [-10, 14, 14], LoArmL: [-48, 22, 0],
        ThighL: [-8, -6, 0], ShinL: [8, 0, 0], ThighR: [14, 8, 0], ShinR: [22, 0, 0]
      }, 'out'),
      K(1.20, {
        Hips: [0, 20, 6], Hips_pos: [0.04, -0.050, -0.03], Head: [4, -10, -2],
        UpArmL: [-10, 14, 14], LoArmL: [-48, 22, 0], Chest: [3, -12, -4]
      })
    ]
  },

  // ---- NANAMI — THE WATCH ------------------------------------------------
  // Grim and administrative. He turns his wrist over, reads the time, and puts
  // the hand back on the sword. Nothing about the pose is a flourish: it is a
  // man confirming that this is going to take four more seconds.
  nanamiWatch: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // the wrist comes up, and only the wrist
      K(0.26, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.048, 0], Spine: [4, -8, 0], Chest: [3, -12, 0],
        Neck: [4, -2, 0], Head: [14, -10, 0],
        UpArmL: [-52, 22, 10], LoArmL: [-118, 34, 0], HandL: [-30, 120, 0],
        UpArmR: [-24, -10, -14], LoArmR: [-84, -20, 0]
      }, 'out'),
      // he reads it. Two full beats of a man looking at a watch.
      K(0.62, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.050, 0], Spine: [5, -8, 0], Chest: [4, -12, 0],
        Neck: [5, -2, 0], Head: [16, -10, 0],
        UpArmL: [-54, 22, 10], LoArmL: [-120, 34, 0], HandL: [-30, 122, 0],
        UpArmR: [-24, -10, -14], LoArmR: [-84, -20, 0]
      }, 'hold'),
      // and the hand goes back onto the grip. Both hands, squared up.
      K(0.92, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.072, 0.02], Spine: [8, -4, 0], Chest: [6, -6, 0],
        Neck: [2, 0, 0], Head: [8, -4, 0],
        UpArmL: [-72, 16, 12], LoArmL: [-96, 16, 0], HandL: [-24, 80, 0],
        UpArmR: [-68, -14, -14], LoArmR: [-100, -14, 0], HandR: [-24, -80, 0],
        ThighL: [-26, -4, 0], ShinL: [22, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }, 'out'),
      K(1.20, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.074, 0.02], Spine: [8, -4, 0], Head: [8, -4, 0],
        UpArmL: [-72, 16, 12], LoArmL: [-96, 16, 0], UpArmR: [-68, -14, -14], LoArmR: [-100, -14, 0],
        ThighL: [-26, -4, 0], ShinL: [22, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }, 'hold')
    ]
  },

  // ---- YUJI — THE BLACK FLASH WIND-UP ------------------------------------
  // The half second before the 0.000001 seconds. Everything coils: the rear
  // foot digs, the hip loads, the fist drops to his own waist, and his head
  // comes DOWN and forward, because he is throwing this from his legs.
  yujiWind: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Hips: [0, 48, 0], Hips_pos: [0, -0.16, -0.06], Spine: [10, -22, 0], Chest: [8, -34, 0],
        Neck: [4, -6, 0], Head: [12, -26, 0],
        UpArmR: [-24, -26, -18], LoArmR: [-124, -8, -6], HandR: [-16, -84, 0],
        UpArmL: [-64, 20, 20], LoArmL: [-96, 8, 6], HandL: [-18, 74, 0],
        ThighL: [-18, -6, 0], ShinL: [20, 0, 0], ThighR: [32, 8, 0], ShinR: [52, 0, 0]
      }, 'in'),
      // the load. Deepest point, nothing moving, the floor cracking under him.
      K(0.42, {
        Hips: [2, 56, 0], Hips_pos: [0, -0.22, -0.09], Spine: [14, -26, 0], Chest: [12, -40, 0],
        Neck: [6, -8, 0], Head: [16, -30, 0],
        UpArmR: [-18, -30, -16], LoArmR: [-130, -10, -6], HandR: [-14, -88, 0],
        UpArmL: [-70, 22, 22], LoArmL: [-90, 10, 6],
        ThighL: [-14, -6, 0], ShinL: [24, 0, 0], ThighR: [38, 8, 0], ShinR: [62, 0, 0]
      }, 'hold'),
      // and it is gone. Full extension, hips square, head snapped up.
      K(0.55, {
        Hips: [0, -12, 0], Hips_pos: [0, -0.14, 0.16], Spine: [6, 20, 0], Chest: [4, 34, 0],
        Neck: [-2, 6, 0], Head: [-6, 8, 0],
        UpArmR: [-92, 10, 0], LoArmR: [-2, 0, 0], HandR: [-4, -172, 0],
        UpArmL: [-28, 12, 18], LoArmL: [-100, 0, 6],
        ThighL: [-48, -6, 0], ShinL: [26, 0, 0], ThighR: [24, 8, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(0.70, {
        Hips: [0, -12, 0], Hips_pos: [0, -0.14, 0.16], Chest: [4, 34, 0], Head: [-6, 8, 0],
        UpArmR: [-92, 10, 0], LoArmR: [-4, 0, 0], UpArmL: [-28, 12, 18],
        ThighL: [-48, -6, 0], ShinL: [26, 0, 0], ThighR: [24, 8, 0], ShinR: [44, 0, 0]
      }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },

  // ---- TODO — THE GRIN ---------------------------------------------------
  // Enormous and delighted. Chest out, both arms thrown wide, head back — a
  // man having the best afternoon of his life in the middle of a fight.
  todoGrin: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        Hips: [0, 30, 0], Hips_pos: [0, -0.09, -0.04], Spine: [-8, -10, 0], Chest: [-12, -14, 0],
        Neck: [-6, -2, 0], Head: [-18, -8, 0],
        UpArmL: [-44, 26, 34], LoArmL: [-92, 12, 6], UpArmR: [-40, -24, -36], LoArmR: [-96, -10, -6],
        ThighL: [-20, -4, 0], ShinL: [18, 0, 0], ThighR: [16, 6, 0], ShinR: [26, 0, 0]
      }, 'in'),
      // ARMS WIDE. All of him.
      K(0.38, {
        Hips: [-10, 12, 0], Hips_pos: [0, 0.02, -0.02], Spine: [-22, -4, 0], Chest: [-26, -6, 0],
        Neck: [-12, 0, 0], Head: [-34, 0, 0],
        UpArmL: [-118, 10, 66], LoArmL: [-18, 0, 6], HandL: [-24, 40, 0],
        UpArmR: [-114, -8, -68], LoArmR: [-16, 0, -6], HandR: [-24, -40, 0],
        ThighL: [-14, -4, 0], ShinL: [10, 0, 0], ThighR: [10, 6, 0], ShinR: [16, 0, 0]
      }, 'snap'),
      // the laugh — two hard shakes of the whole ribcage
      K(0.56, {
        Hips: [-8, 12, 0], Hips_pos: [0, 0.00, -0.02], Spine: [-18, -4, 0], Chest: [-20, -6, 0],
        Head: [-28, 0, 0], UpArmL: [-110, 10, 62], UpArmR: [-106, -8, -64]
      }, 'snap'),
      K(0.72, {
        Hips: [-10, 12, 0], Hips_pos: [0, 0.02, -0.02], Spine: [-22, -4, 0], Chest: [-25, -6, 0],
        Head: [-33, 0, 0], UpArmL: [-118, 10, 66], UpArmR: [-114, -8, -68]
      }, 'snap'),
      // and he points at them, still grinning
      K(0.94, {
        Hips: [0, -14, 0], Hips_pos: [0, -0.08, 0.08], Spine: [6, 12, 0], Chest: [6, 20, 0],
        Neck: [0, 4, 0], Head: [-4, 6, 0],
        UpArmL: [-30, 14, 22], LoArmL: [-84, 0, 6],
        UpArmR: [-96, 6, -4], LoArmR: [-10, 0, -2], HandR: [-20, -100, 0],
        ThighL: [-30, -4, 0], ShinL: [22, 0, 0], ThighR: [22, 6, 0], ShinR: [36, 0, 0]
      }, 'out'),
      K(1.15, {
        Hips: [0, -14, 0], Hips_pos: [0, -0.08, 0.08], Chest: [6, 20, 0], Head: [-4, 6, 0],
        UpArmR: [-96, 6, -4], LoArmR: [-12, 0, -2], UpArmL: [-30, 14, 22], LoArmL: [-84, 0, 6],
        ThighL: [-30, -4, 0], ShinL: [22, 0, 0], ThighR: [22, 6, 0], ShinR: [36, 0, 0]
      }, 'hold')
    ]
  },

  // ---- JOGO — MAXIMUM: METEOR --------------------------------------------
  // Both arms up, head all the way back, the whole body opening toward the
  // sky. He is not aiming it. He is calling it.
  jogoMeteor: {
    dur: 1.45, loop: false, keys: [
      K(0, {}),
      K(0.22, {
        Hips: [10, 14, 0], Hips_pos: [0, -0.16, -0.04], Spine: [18, -6, 0], Chest: [14, -8, 0],
        Neck: [6, 0, 0], Head: [16, -4, 0],
        UpArmL: [-24, 16, 22], LoArmL: [-104, 0, 6], UpArmR: [-20, -14, -24], LoArmR: [-108, 0, -6],
        ThighL: [-28, -4, 0], ShinL: [30, 0, 0], ThighR: [22, 6, 0], ShinR: [40, 0, 0]
      }, 'in'),
      // both arms straight up, and he leans back under the weight of it
      K(0.58, {
        Hips: [-16, 12, 0], Hips_pos: [0, 0.03, -0.10], Spine: [-26, -4, 0], Chest: [-28, -6, 0],
        Neck: [-14, 0, 0], Head: [-42, 0, 0],
        UpArmL: [-172, 6, 22], LoArmL: [-14, 0, 6], HandL: [-30, 30, 0],
        UpArmR: [-170, -4, -24], LoArmR: [-12, 0, -6], HandR: [-30, -30, 0],
        ThighL: [-10, -4, 0], ShinL: [8, 0, 0], ThighR: [8, 6, 0], ShinR: [12, 0, 0]
      }, 'out'),
      // held. The sky is doing the work now.
      K(1.00, {
        Hips: [-17, 12, 0], Hips_pos: [0, 0.035, -0.10], Spine: [-27, -4, 0], Head: [-43, 0, 0],
        UpArmL: [-174, 6, 22], LoArmL: [-12, 0, 6], UpArmR: [-172, -4, -24], LoArmR: [-10, 0, -6],
        ThighL: [-10, -4, 0], ShinL: [8, 0, 0], ThighR: [8, 6, 0], ShinR: [12, 0, 0]
      }, 'hold'),
      // and the arms come down as it arrives
      K(1.20, {
        Hips: [16, 14, 0], Hips_pos: [0, -0.22, 0.06], Spine: [26, -4, 0], Chest: [20, -6, 0],
        Neck: [8, 0, 0], Head: [22, -2, 0],
        UpArmL: [-20, 8, 28], LoArmL: [-30, 0, 6], UpArmR: [-16, -6, -30], LoArmR: [-28, 0, -6],
        ThighL: [-40, -4, 0], ShinL: [44, 0, 0], ThighR: [30, 6, 0], ShinR: [56, 0, 0]
      }, 'snap'),
      K(1.45, {
        Hips: [14, 14, 0], Hips_pos: [0, -0.20, 0.05], Spine: [24, -4, 0], Head: [20, -2, 0],
        UpArmL: [-22, 8, 28], UpArmR: [-18, -6, -30],
        ThighL: [-38, -4, 0], ShinL: [42, 0, 0], ThighR: [28, 6, 0], ShinR: [54, 0, 0]
      }, 'hold')
    ]
  },

  // ---- MAHITO — THE HAND -------------------------------------------------
  // No wind-up, because there is nothing to wind up: he only has to touch
  // them. The arm goes out slowly, palm open, head tilted like a child looking
  // at an insect, and the fingers close on nothing at all.
  mahitoTouch: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        Hips: [0, 24, 0], Hips_pos: [0, -0.05, 0], Spine: [-2, -8, 0], Chest: [-4, -12, 0],
        Neck: [-4, -2, 4], Head: [-10, -14, 10],
        UpArmR: [-52, -14, -18], LoArmR: [-96, -6, -4], HandR: [-40, -60, 0],
        UpArmL: [-18, 12, 16], LoArmL: [-60, 16, 0]
      }, 'out'),
      // the reach. Unhurried, all the way out, fingers spread.
      K(0.66, {
        Hips: [0, 6, 0], Hips_pos: [0, -0.07, 0.06], Spine: [4, -2, 0], Chest: [4, -2, 0],
        Neck: [-2, 0, 5], Head: [-6, -6, 12],
        UpArmR: [-96, 4, -6], LoArmR: [-12, 0, -2], HandR: [-70, -20, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-72, 14, 0],
        ThighL: [-26, -4, 0], ShinL: [20, 0, 0], ThighR: [20, 6, 0], ShinR: [32, 0, 0]
      }, 'out'),
      K(0.90, {
        Hips: [0, 6, 0], Hips_pos: [0, -0.07, 0.06], Chest: [4, -2, 0], Head: [-6, -6, 12],
        UpArmR: [-98, 4, -6], LoArmR: [-10, 0, -2], HandR: [-72, -20, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-72, 14, 0]
      }, 'hold'),
      // and the hand closes
      K(1.02, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.09, 0.05], Chest: [6, -2, 0], Head: [-2, -4, 8],
        UpArmR: [-92, 6, -8], LoArmR: [-24, 0, -2], HandR: [-40, -30, 0],
        UpArmL: [-28, 12, 18], LoArmL: [-78, 14, 0]
      }, 'snap'),
      K(1.30, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.08, 0.03], Head: [-4, -8, 6], Chest: [4, -4, 0],
        UpArmR: [-84, 6, -10], LoArmR: [-36, 0, -2], UpArmL: [-26, 12, 18], LoArmL: [-74, 14, 0]
      }, 'out')
    ]
  },

  // ---- MAHITO 【DISTORTED】 — THE SPREAD ---------------------------------
  // The transformed body does not reach: it opens. Arms flung wide and back,
  // spine arched hard, everything reaching outward at once.
  mahitoDistort: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        Hips: [8, 20, 0], Hips_pos: [0, -0.12, -0.04], Spine: [14, -8, 0], Chest: [10, -12, 0],
        Head: [12, -10, 0],
        UpArmL: [-30, 20, 26], LoArmL: [-96, 6, 6], UpArmR: [-26, -18, -28], LoArmR: [-100, -4, -6]
      }, 'in'),
      K(0.44, {
        Hips: [-22, 16, 0], Hips_pos: [0, 0.04, -0.10], Spine: [-32, -6, 6], Chest: [-30, -8, -6],
        Neck: [-16, 0, 0], Head: [-44, -4, 8],
        UpArmL: [-142, 14, 58], LoArmL: [-22, 0, 8], HandL: [-50, 40, 0],
        UpArmR: [-138, -12, -60], LoArmR: [-20, 0, -8], HandR: [-50, -40, 0],
        ThighL: [-16, -8, 0], ShinL: [12, 0, 0], ThighR: [12, 10, 0], ShinR: [18, 0, 0]
      }, 'snap'),
      K(0.70, {
        Hips: [-21, 16, 0], Hips_pos: [0, 0.04, -0.10], Spine: [-30, -6, 6], Head: [-43, -4, 8],
        UpArmL: [-140, 14, 58], UpArmR: [-136, -12, -60],
        ThighL: [-16, -8, 0], ShinL: [12, 0, 0], ThighR: [12, 10, 0], ShinR: [18, 0, 0]
      }, 'hold'),
      // and it all comes forward at them
      K(0.88, {
        Hips: [14, 12, 0], Hips_pos: [0, -0.14, 0.14], Spine: [26, -4, 0], Chest: [22, -4, 0],
        Neck: [8, 0, 0], Head: [24, -2, 0],
        UpArmL: [-88, -6, 18], LoArmL: [-16, 0, 6], HandL: [-30, 60, 0],
        UpArmR: [-84, 4, -20], LoArmR: [-14, 0, -6], HandR: [-30, -60, 0],
        ThighL: [-46, -6, 0], ShinL: [36, 0, 0], ThighR: [30, 8, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(1.30, {}, 'out')
    ]
  },

  // ---- MEGUMI — THE HAND SIGN AND THE POINT ------------------------------
  // Hands together at his waist, and then one flat palm out at them, low. He
  // does not throw anything; he sends something.
  megumiPoint: {
    dur: 1.25, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.09, -0.02], Spine: [8, -8, 0], Chest: [6, -12, 0],
        Neck: [2, -2, 0], Head: [10, -10, 0],
        UpArmL: [-56, 26, 6], LoArmL: [-116, 34, 0], HandL: [-26, 96, 0],
        UpArmR: [-52, -24, -8], LoArmR: [-120, -32, 0], HandR: [-26, -96, 0],
        ThighL: [-26, -4, 0], ShinL: [24, 0, 0], ThighR: [20, 6, 0], ShinR: [36, 0, 0]
      }, 'in'),
      K(0.50, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.10, -0.02], Spine: [9, -8, 0], Head: [11, -10, 0],
        UpArmL: [-58, 26, 6], LoArmL: [-118, 34, 0], UpArmR: [-54, -24, -8], LoArmR: [-122, -32, 0]
      }, 'hold'),
      // the palm goes out, low and flat, at the floor between them
      K(0.68, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.13, 0.06], Spine: [14, -4, 0], Chest: [10, -4, 0],
        Neck: [4, 0, 0], Head: [14, -4, 0],
        UpArmR: [-72, 4, -8], LoArmR: [-14, 0, -2], HandR: [-92, -10, 0],
        UpArmL: [-30, 14, 18], LoArmL: [-78, 10, 0],
        ThighL: [-40, -4, 0], ShinL: [34, 0, 0], ThighR: [28, 6, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      K(0.88, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.13, 0.06], Spine: [14, -4, 0], Head: [14, -4, 0],
        UpArmR: [-70, 4, -8], LoArmR: [-16, 0, -2], HandR: [-92, -10, 0],
        UpArmL: [-30, 14, 18], LoArmL: [-78, 10, 0],
        ThighL: [-40, -4, 0], ShinL: [34, 0, 0], ThighR: [28, 6, 0], ShinR: [46, 0, 0]
      }, 'hold'),
      K(1.25, {}, 'out')
    ]
  },

  // ---- HIGURUMA — THE GAVEL ----------------------------------------------
  // Raised in one hand, held a beat too long, and brought down. The verdict is
  // not a swing; it is an administrative act performed at speed.
  higurumaGavel: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      K(0.26, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.05, -0.02], Spine: [2, -8, 0], Chest: [0, -12, 0],
        Neck: [-2, -2, 0], Head: [-6, -8, 0],
        UpArmR: [-146, -10, -14], LoArmR: [-56, 0, -4], HandR: [-20, -70, 0],
        UpArmL: [-30, 14, 16], LoArmL: [-84, 6, 0]
      }, 'in'),
      // HELD. This is the beat the whole thing is built on.
      K(0.62, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.05, -0.02], Chest: [0, -12, 0], Head: [-7, -8, 0],
        UpArmR: [-148, -10, -14], LoArmR: [-54, 0, -4],
        UpArmL: [-30, 14, 16], LoArmL: [-84, 6, 0]
      }, 'hold'),
      // down. Short, flat, and the whole torso goes with it.
      K(0.74, {
        Hips: [6, 6, 0], Hips_pos: [0, -0.14, 0.04], Spine: [16, -2, 0], Chest: [14, 8, 0],
        Neck: [6, 0, 0], Head: [16, -2, 0],
        UpArmR: [-62, 8, -4], LoArmR: [-10, 0, -2], HandR: [-30, -120, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-90, 4, 0],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [42, 0, 0]
      }, 'snap'),
      K(0.88, {
        Hips: [6, 6, 0], Hips_pos: [0, -0.14, 0.04], Chest: [14, 8, 0], Head: [16, -2, 0],
        UpArmR: [-60, 8, -4], LoArmR: [-12, 0, -2],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [42, 0, 0]
      }, 'hold'),
      K(1.20, {}, 'out')
    ]
  },

  // ---- HAKARI — THE HEAD COMES BACK --------------------------------------
  // He takes the best shot they have. His head goes with it, all the way over,
  // and then it comes back — and he is laughing. Two beats, and the second one
  // is the whole character.
  hakariHeal: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      // the hit. Head snapped forty degrees off its axis, arms limp.
      K(0.07, {
        Hips: [-10, 26, 0], Hips_pos: [0, -0.04, -0.08], Spine: [-18, -8, 0], Chest: [-20, -12, 4],
        Neck: [-14, -12, 10], Head: [-32, -34, 26],
        UpArmL: [-96, 10, 46], LoArmL: [-22, 0, 6], UpArmR: [-78, -8, -52], LoArmR: [-18, 0, -6],
        ThighL: [-32, -4, 0], ShinL: [26, 0, 0], ThighR: [12, 6, 0], ShinR: [32, 0, 0]
      }, 'snap'),
      K(0.30, {
        Hips: [-9, 26, 0], Hips_pos: [0, -0.05, -0.09], Spine: [-16, -8, 0], Head: [-30, -32, 25],
        UpArmL: [-92, 10, 44], UpArmR: [-74, -8, -50],
        ThighL: [-32, -4, 0], ShinL: [26, 0, 0], ThighR: [12, 6, 0], ShinR: [32, 0, 0]
      }, 'hold'),
      // and it rolls back. Not snaps — ROLLS, like it is being put back on.
      K(0.72, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.06, -0.02], Spine: [-4, -6, 0], Chest: [-6, -8, 0],
        Neck: [-4, 4, -2], Head: [-14, 10, -6],
        UpArmL: [-54, 14, 26], LoArmL: [-80, 6, 6], UpArmR: [-48, -12, -28], LoArmR: [-84, -4, -6],
        ThighL: [-24, -4, 0], ShinL: [20, 0, 0], ThighR: [18, 6, 0], ShinR: [30, 0, 0]
      }, 'out'),
      // THE LAUGH. Head back, arms out, absolutely thrilled.
      K(0.96, {
        Hips: [-14, 14, 0], Hips_pos: [0, 0.01, -0.04], Spine: [-24, -4, 0], Chest: [-26, -6, 0],
        Neck: [-12, 0, 0], Head: [-38, -2, 0],
        UpArmL: [-104, 8, 56], LoArmL: [-30, 0, 6], HandL: [-20, 40, 0],
        UpArmR: [-100, -6, -58], LoArmR: [-28, 0, -6], HandR: [-20, -40, 0],
        ThighL: [-16, -4, 0], ShinL: [12, 0, 0], ThighR: [12, 6, 0], ShinR: [20, 0, 0]
      }, 'snap'),
      K(1.30, {
        Hips: [-6, 16, 0], Hips_pos: [0, -0.04, -0.02], Spine: [-10, -6, 0], Chest: [-12, -8, 0],
        Head: [-22, -6, 0], UpArmL: [-64, 12, 36], LoArmL: [-64, 0, 6],
        UpArmR: [-58, -10, -38], LoArmR: [-68, 0, -6]
      }, 'out')
    ]
  },

  // ---- KASHIMO — THE STAFF ------------------------------------------------
  // One full revolution of the staff overhead and a hard plant into the floor.
  // Everything about him is the wrist and the hips; the feet barely move.
  kashimoSpin: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Hips: [0, 46, 0], Hips_pos: [0, -0.10, -0.04], Spine: [-4, -18, 0], Chest: [-6, -28, 0],
        Head: [-8, -22, 0],
        UpArmR: [-126, -18, -22], LoArmR: [-70, 0, -6], HandR: [-24, -80, 0],
        UpArmL: [-42, 22, 26], LoArmL: [-72, 10, 6],
        ThighL: [-20, -4, 0], ShinL: [18, 0, 0], ThighR: [16, 6, 0], ShinR: [26, 0, 0]
      }, 'in'),
      // the spin — the arms cross over the head and the hips whip round
      K(0.38, {
        Hips: [0, -34, 0], Hips_pos: [0, -0.08, 0], Spine: [-8, 22, 0], Chest: [-10, 34, 0],
        Neck: [-6, 8, 0], Head: [-16, 18, 0],
        UpArmR: [-166, 12, -18], LoArmR: [-40, 0, -6], HandR: [-20, -60, 0],
        UpArmL: [-150, -8, 30], LoArmL: [-52, 0, 6], HandL: [-20, 50, 0],
        ThighL: [-30, -4, 0], ShinL: [24, 0, 0], ThighR: [24, 6, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      // and the plant. Both hands low, staff into the deck, weight on top.
      K(0.58, {
        Hips: [12, 16, 0], Hips_pos: [0, -0.22, 0.06], Spine: [22, -6, 0], Chest: [18, -8, 0],
        Neck: [8, 0, 0], Head: [18, -6, 0],
        UpArmR: [-34, 6, -14], LoArmR: [-30, 0, -4], HandR: [-40, -70, 0],
        UpArmL: [-38, -4, 16], LoArmL: [-26, 0, 4], HandL: [-40, 60, 0],
        ThighL: [-46, -4, 0], ShinL: [44, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'snap'),
      K(0.74, {
        Hips: [12, 16, 0], Hips_pos: [0, -0.22, 0.06], Chest: [18, -8, 0], Head: [18, -6, 0],
        UpArmR: [-34, 6, -14], UpArmL: [-38, -4, 16],
        ThighL: [-46, -4, 0], ShinL: [44, 0, 0], ThighR: [34, 6, 0], ShinR: [58, 0, 0]
      }, 'hold'),
      K(1.10, {}, 'out')
    ]
  },

  // ---- CHOSO — THE GUARD -------------------------------------------------
  // He does not dodge. Both forearms come up across his face, he takes it, and
  // the blood starts moving — the arms come apart and the hand is already
  // shaped for what comes next.
  chosoGuard: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      K(0.12, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.09, -0.03], Spine: [8, -8, 0], Chest: [6, -12, 0],
        Neck: [-2, -2, 0], Head: [-4, -8, 0],
        UpArmL: [-96, 22, 14], LoArmL: [-118, 40, 0], HandL: [-20, 90, 0],
        UpArmR: [-92, -20, -16], LoArmR: [-122, -38, 0], HandR: [-20, -90, 0],
        ThighL: [-28, -4, 0], ShinL: [24, 0, 0], ThighR: [22, 6, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      // the impact drives him back a fraction — the arms hold
      K(0.30, {
        Hips: [-4, 22, 0], Hips_pos: [0, -0.11, -0.10], Spine: [2, -8, 0], Chest: [-2, -12, 0],
        Head: [-12, -8, 0],
        UpArmL: [-86, 24, 18], LoArmL: [-112, 42, 0], UpArmR: [-82, -22, -20], LoArmR: [-116, -40, 0],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0]
      }, 'hold'),
      // the arms come apart and the blood follows them out
      K(0.62, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.10, 0.02], Spine: [4, -4, 0], Chest: [2, -6, 0],
        Neck: [0, 0, 0], Head: [-2, -4, 0],
        UpArmL: [-70, 10, 44], LoArmL: [-56, 0, 6], HandL: [-30, 50, 0],
        UpArmR: [-66, -8, -46], LoArmR: [-52, 0, -6], HandR: [-30, -50, 0],
        ThighL: [-30, -4, 0], ShinL: [26, 0, 0], ThighR: [24, 6, 0], ShinR: [40, 0, 0]
      }, 'out'),
      // two fingers up, aimed. Everything else goes still.
      K(0.86, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.09, 0.01], Spine: [2, -10, 0], Chest: [0, -14, 0],
        Neck: [2, -4, 0], Head: [2, -14, 0],
        UpArmR: [-98, 2, -8], LoArmR: [-18, 0, -2], HandR: [-70, -30, 0],
        UpArmL: [-24, 14, 18], LoArmL: [-74, 12, 0],
        ThighL: [-26, -4, 0], ShinL: [22, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }, 'snap'),
      K(1.20, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.09, 0.01], Chest: [0, -14, 0], Head: [2, -14, 0],
        UpArmR: [-100, 2, -8], LoArmR: [-16, 0, -2], HandR: [-72, -30, 0],
        UpArmL: [-24, 14, 18], LoArmL: [-74, 12, 0]
      }, 'hold')
    ]
  },

  // ---- NOBARA — THE GRIN -------------------------------------------------
  // Hammer up on the shoulder, nail held out at arm's length between two
  // fingers, weight cocked back on one hip. She is enjoying this and she wants
  // them to know it.
  nobaraGrin: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      K(0.22, {
        Hips: [0, 30, -4], Hips_pos: [-0.03, -0.052, -0.02], Spine: [-4, -12, 3], Chest: [-6, -16, 4],
        Neck: [-2, -4, 0], Head: [-10, -12, -4],
        UpArmL: [-88, 30, 16], LoArmL: [-120, 40, 0], HandL: [-24, 92, 0],
        UpArmR: [-20, -12, -18], LoArmR: [-64, -20, 0], HandR: [-14, -50, 0],
        ThighL: [-14, -6, 0], ShinL: [12, 0, 0], ThighR: [18, 8, 0], ShinR: [28, 0, 0]
      }, 'out'),
      // the nail comes up between her fingers, at eye level, dead still
      K(0.52, {
        Hips: [0, 26, -4], Hips_pos: [-0.03, -0.056, -0.02], Spine: [-2, -10, 3], Chest: [-4, -14, 4],
        Neck: [0, -2, 0], Head: [-4, -10, -3],
        UpArmL: [-88, 30, 16], LoArmL: [-120, 40, 0],
        UpArmR: [-108, -4, -10], LoArmR: [-24, 0, -2], HandR: [-50, -40, 0],
        ThighL: [-14, -6, 0], ShinL: [12, 0, 0], ThighR: [18, 8, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      K(0.74, {
        Hips: [0, 26, -4], Hips_pos: [-0.03, -0.056, -0.02], Chest: [-4, -14, 4], Head: [-4, -10, -3],
        UpArmR: [-110, -4, -10], LoArmR: [-22, 0, -2],
        UpArmL: [-88, 30, 16], LoArmL: [-120, 40, 0]
      }, 'hold'),
      // and she flicks it away, chin up
      K(0.92, {
        Hips: [0, 18, -2], Hips_pos: [-0.02, -0.050, 0], Spine: [0, -8, 2], Chest: [-2, -10, 2],
        Neck: [-2, -2, 0], Head: [-12, -6, -2],
        UpArmR: [-56, -10, -30], LoArmR: [-48, 0, -4], HandR: [-20, -60, 0],
        UpArmL: [-84, 30, 18], LoArmL: [-118, 40, 0],
        ThighL: [-16, -6, 0], ShinL: [14, 0, 0], ThighR: [20, 8, 0], ShinR: [30, 0, 0]
      }, 'snap'),
      K(1.15, {
        Hips: [0, 18, -2], Head: [-12, -6, -2], Chest: [-2, -10, 2],
        UpArmR: [-54, -10, -30], LoArmR: [-50, 0, -4], UpArmL: [-84, 30, 18], LoArmL: [-118, 40, 0]
      }, 'hold')
    ]
  },

  // ---- PANDA — THE DRUM --------------------------------------------------
  // Both fists on the chest, four beats, and the whole body rocking into each
  // one. This is the Gorilla core announcing itself and it is the loudest
  // thing in the character.
  pandaDrum: {
    dur: 1.35, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Hips: [-8, 16, 0], Hips_pos: [0, -0.04, -0.06], Spine: [-14, -6, 0], Chest: [-18, -8, 0],
        Neck: [-8, 0, 0], Head: [-24, -4, 0],
        UpArmL: [-120, 16, 44], LoArmL: [-96, 10, 6], HandL: [-20, 60, 0],
        UpArmR: [-116, -14, -46], LoArmR: [-100, -8, -6], HandR: [-20, -60, 0],
        ThighL: [-16, -4, 0], ShinL: [14, 0, 0], ThighR: [12, 6, 0], ShinR: [20, 0, 0]
      }, 'in'),
      // four strikes on the chest, alternating, each one a hard stop
      K(0.34, {
        Hips: [-4, 20, 0], Hips_pos: [0, -0.07, -0.04], Spine: [-8, -8, 0], Chest: [-10, -12, 0],
        Head: [-16, -8, 0],
        UpArmL: [-96, 22, 22], LoArmL: [-126, 24, 0], UpArmR: [-118, -14, -46], LoArmR: [-100, -8, -6]
      }, 'snap'),
      K(0.52, {
        Hips: [-4, 12, 0], Hips_pos: [0, -0.07, -0.04], Chest: [-10, -4, 0], Head: [-16, 0, 0],
        UpArmR: [-92, -20, -24], LoArmR: [-130, -22, 0], UpArmL: [-118, 16, 44], LoArmL: [-98, 10, 6]
      }, 'snap'),
      K(0.68, {
        Hips: [-4, 20, 0], Hips_pos: [0, -0.08, -0.05], Chest: [-12, -12, 0], Head: [-18, -8, 0],
        UpArmL: [-94, 22, 22], LoArmL: [-128, 24, 0], UpArmR: [-118, -14, -46], LoArmR: [-100, -8, -6]
      }, 'snap'),
      K(0.84, {
        Hips: [-4, 12, 0], Hips_pos: [0, -0.08, -0.05], Chest: [-12, -4, 0], Head: [-18, 0, 0],
        UpArmR: [-90, -20, -24], LoArmR: [-132, -22, 0], UpArmL: [-118, 16, 44], LoArmL: [-98, 10, 6]
      }, 'snap'),
      // and he drops onto both fists, shoulders up around his ears
      K(1.06, {
        Hips: [16, 14, 0], Hips_pos: [0, -0.26, 0.08], Spine: [26, -6, 0], Chest: [20, -8, 0],
        Neck: [6, 0, 0], Head: [14, -6, 0],
        UpArmL: [-26, 10, 24], LoArmL: [-34, 0, 6], HandL: [-40, 40, 0],
        UpArmR: [-22, -8, -26], LoArmR: [-30, 0, -6], HandR: [-40, -40, 0],
        ThighL: [-50, -4, 0], ShinL: [50, 0, 0], ThighR: [38, 6, 0], ShinR: [62, 0, 0]
      }, 'snap'),
      K(1.35, {
        Hips: [16, 14, 0], Hips_pos: [0, -0.26, 0.08], Chest: [20, -8, 0], Head: [14, -6, 0],
        UpArmL: [-26, 10, 24], UpArmR: [-22, -8, -26],
        ThighL: [-50, -4, 0], ShinL: [50, 0, 0], ThighR: [38, 6, 0], ShinR: [62, 0, 0]
      }, 'hold')
    ]
  },

  // ---- HANAMI — THE SEED -------------------------------------------------
  // Down onto one knee, one palm flat on the ground, absolutely still while
  // whatever was planted takes. The stillness is the threat.
  hanamiSeed: {
    dur: 1.40, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        Hips: [-6, 16, 0], Hips_pos: [0, -0.30, -0.04], Spine: [16, -6, 0], Chest: [12, -8, 0],
        Neck: [4, 0, 0], Head: [14, -6, 0],
        UpArmR: [-44, -12, -22], LoArmR: [-88, 0, -6], HandR: [-40, -50, 0],
        UpArmL: [-30, 14, 20], LoArmL: [-76, 6, 6],
        ThighL: [-74, -6, 0], ShinL: [92, 0, 0], FootL: [22, -8, 0],
        ThighR: [-24, 8, 0], ShinR: [104, 0, 0], FootR: [14, 8, 0]
      }, 'in'),
      // the palm goes down and stays there
      K(0.58, {
        Hips: [-4, 18, 0], Hips_pos: [0, -0.42, 0.02], Spine: [26, -6, 0], Chest: [20, -8, 0],
        Neck: [6, 0, 0], Head: [20, -8, 0],
        UpArmR: [-14, -6, -18], LoArmR: [-28, 0, -6], HandR: [-80, -30, 0],
        UpArmL: [-26, 12, 24], LoArmL: [-60, 4, 6],
        ThighL: [-88, -6, 0], ShinL: [108, 0, 0], FootL: [26, -8, 0],
        ThighR: [-30, 8, 0], ShinR: [116, 0, 0], FootR: [16, 8, 0]
      }, 'out'),
      K(0.94, {
        Hips: [-4, 18, 0], Hips_pos: [0, -0.43, 0.02], Spine: [27, -6, 0], Head: [21, -8, 0],
        UpArmR: [-13, -6, -18], LoArmR: [-27, 0, -6],
        UpArmL: [-26, 12, 24], LoArmL: [-60, 4, 6],
        ThighL: [-88, -6, 0], ShinL: [108, 0, 0], ThighR: [-30, 8, 0], ShinR: [116, 0, 0]
      }, 'hold'),
      // and he stands up into them
      K(1.16, {
        Hips: [4, 16, 0], Hips_pos: [0, -0.10, 0.06], Spine: [10, -6, 0], Chest: [8, -8, 0],
        Neck: [2, 0, 0], Head: [6, -6, 0],
        UpArmL: [-56, 18, 28], LoArmL: [-84, 6, 6], UpArmR: [-52, -16, -30], LoArmR: [-88, -4, -6],
        ThighL: [-36, -6, 0], ShinL: [34, 0, 0], ThighR: [26, 8, 0], ShinR: [44, 0, 0]
      }, 'out'),
      K(1.40, {}, 'out')
    ]
  },

  // ---- KUROURUSHI — THE REAR ---------------------------------------------
  // Up onto the back of the body, chest opening, all four arms out, and the
  // head goes back to open the maw. Everything about it says the next thing is
  // going to be eaten.
  kuroRear: {
    dur: 1.35, loop: false, keys: [
      K(0, {}),
      K(0.26, {
        Hips: [-14, 14, 0], Hips_pos: [0, 0.04, -0.10], Spine: [-24, -6, 0], Chest: [-26, -8, 0],
        Neck: [-14, 0, 0], Head: [-38, -2, 0],
        UpArmL: [-124, 14, 52], LoArmL: [-40, 0, 6], HandL: [-40, 40, 0],
        UpArmR: [-120, -12, -54], LoArmR: [-38, 0, -6], HandR: [-40, -40, 0],
        UpArmL2: [-96, 12, 62], LoArmL2: [-30, 0, 6],
        UpArmR2: [-92, -10, -64], LoArmR2: [-28, 0, -6],
        ThighL: [-14, -4, 0], ShinL: [12, 0, 0], ThighR: [10, 6, 0], ShinR: [18, 0, 0]
      }, 'out'),
      K(0.62, {
        Hips: [-15, 14, 0], Hips_pos: [0, 0.045, -0.10], Spine: [-25, -6, 0], Head: [-39, -2, 0],
        UpArmL: [-126, 14, 52], UpArmR: [-122, -12, -54],
        UpArmL2: [-98, 12, 62], UpArmR2: [-94, -10, -64],
        ThighL: [-14, -4, 0], ShinL: [12, 0, 0], ThighR: [10, 6, 0], ShinR: [18, 0, 0]
      }, 'hold'),
      // and it comes down over them, all four arms closing
      K(0.86, {
        Hips: [20, 12, 0], Hips_pos: [0, -0.20, 0.14], Spine: [30, -4, 0], Chest: [24, -6, 0],
        Neck: [8, 0, 0], Head: [26, -2, 0],
        UpArmL: [-80, -4, 22], LoArmL: [-70, 0, 6], HandL: [-40, 60, 0],
        UpArmR: [-76, 2, -24], LoArmR: [-66, 0, -6], HandR: [-40, -60, 0],
        UpArmL2: [-72, -6, 30], LoArmL2: [-64, 0, 6],
        UpArmR2: [-68, 4, -32], LoArmR2: [-60, 0, -6],
        ThighL: [-42, -4, 0], ShinL: [38, 0, 0], ThighR: [30, 6, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(1.04, {
        Hips: [20, 12, 0], Hips_pos: [0, -0.20, 0.14], Chest: [24, -6, 0], Head: [26, -2, 0],
        UpArmL: [-80, -4, 22], UpArmR: [-76, 2, -24], UpArmL2: [-72, -6, 30], UpArmR2: [-68, 4, -32],
        ThighL: [-42, -4, 0], ShinL: [38, 0, 0], ThighR: [30, 6, 0], ShinR: [50, 0, 0]
      }, 'hold'),
      K(1.35, {}, 'out')
    ]
  },

  // ---- YUTA — THE CALL ---------------------------------------------------
  // He does not attack. He turns his head and puts one hand out behind him,
  // palm up, and asks. What answers is not in this clip.
  yutaCall: {
    dur: 1.35, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        Hips: [0, 30, 0], Hips_pos: [0, -0.07, -0.03], Spine: [6, -12, 0], Chest: [4, -18, 0],
        Neck: [2, -4, 0], Head: [8, -18, 0],
        UpArmL: [-40, 22, 16], LoArmL: [-96, 22, 0], HandL: [-30, 70, 0],
        UpArmR: [-20, -12, -16], LoArmR: [-70, -22, 0]
      }, 'in'),
      // the arm goes back and OPEN, palm up, and his head turns to it
      K(0.56, {
        Hips: [0, 44, 0], Hips_pos: [0, -0.06, -0.05], Spine: [2, -18, 0], Chest: [-2, -26, 0],
        Neck: [-2, -10, 0], Head: [-10, -34, 0],
        UpArmL: [-64, 34, 10], LoArmL: [-40, 30, 0], HandL: [-70, 30, 0],
        UpArmR: [-16, -10, -14], LoArmR: [-56, -20, 0],
        ThighL: [-20, -4, 0], ShinL: [16, 0, 0], ThighR: [16, 6, 0], ShinR: [26, 0, 0]
      }, 'out'),
      K(0.86, {
        Hips: [0, 44, 0], Hips_pos: [0, -0.06, -0.05], Chest: [-2, -26, 0], Head: [-11, -34, 0],
        UpArmL: [-66, 34, 10], LoArmL: [-38, 30, 0], HandL: [-72, 30, 0],
        UpArmR: [-16, -10, -14], LoArmR: [-56, -20, 0]
      }, 'hold'),
      // and he turns back to the fight with the hand still out
      K(1.10, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.10, 0.02], Spine: [8, -8, 0], Chest: [6, -10, 0],
        Neck: [2, 0, 0], Head: [6, -4, 0],
        UpArmL: [-58, 20, 26], LoArmL: [-52, 14, 0], HandL: [-60, 40, 0],
        UpArmR: [-30, -12, -20], LoArmR: [-86, -14, 0],
        ThighL: [-30, -4, 0], ShinL: [26, 0, 0], ThighR: [24, 6, 0], ShinR: [38, 0, 0]
      }, 'out'),
      K(1.35, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.10, 0.02], Head: [6, -4, 0], Chest: [6, -10, 0],
        UpArmL: [-58, 20, 26], LoArmL: [-52, 14, 0], UpArmR: [-30, -12, -20], LoArmR: [-86, -14, 0]
      }, 'hold')
    ]
  },

  // ---- GETO — THE PALM ---------------------------------------------------
  // One hand up, fingers together, held at shoulder height, and a slow turn of
  // the wrist. He is not casting anything; he is deciding which of them to
  // send. Serene, and the serenity is the horror.
  getoPalm: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.045, -0.02], Spine: [-2, -8, 0], Chest: [-4, -12, 0],
        Neck: [-2, -2, 0], Head: [-6, -10, 0],
        UpArmR: [-88, -6, -12], LoArmR: [-70, -10, -2], HandR: [-40, -60, 0],
        UpArmL: [-14, 12, 14], LoArmL: [-54, 20, 0]
      }, 'out'),
      // the wrist turns over. The only movement in the shot.
      K(0.70, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.045, -0.02], Chest: [-4, -12, 0], Head: [-8, -12, 0],
        UpArmR: [-94, -4, -10], LoArmR: [-60, -6, -2], HandR: [-20, 40, 0],
        UpArmL: [-14, 12, 14], LoArmL: [-54, 20, 0]
      }, 'out'),
      K(0.94, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.046, -0.02], Head: [-8, -12, 0], Chest: [-4, -12, 0],
        UpArmR: [-96, -4, -10], LoArmR: [-58, -6, -2], HandR: [-18, 44, 0],
        UpArmL: [-14, 12, 14], LoArmL: [-54, 20, 0]
      }, 'hold'),
      // and the hand closes into a fist. Everything answers at once.
      K(1.08, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.06, 0.02], Spine: [2, -6, 0], Chest: [2, -8, 0],
        Neck: [0, 0, 0], Head: [0, -6, 0],
        UpArmR: [-100, 0, -8], LoArmR: [-40, 0, -2], HandR: [-30, -10, 0],
        UpArmL: [-20, 12, 16], LoArmL: [-62, 16, 0],
        ThighL: [-24, -4, 0], ShinL: [20, 0, 0], ThighR: [18, 6, 0], ShinR: [30, 0, 0]
      }, 'snap'),
      K(1.30, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.06, 0.02], Head: [0, -6, 0], Chest: [2, -8, 0],
        UpArmR: [-100, 0, -8], LoArmR: [-40, 0, -2], UpArmL: [-20, 12, 16], LoArmL: [-62, 16, 0]
      }, 'hold')
    ]
  },

  // ---- MAHORAGA — THE WHEEL TURNS ----------------------------------------
  // The one on his head does the moving; his body simply stops. Head down, one
  // hand out flat, and then a single deliberate step forward — the step is the
  // threat, because it means the adaptation has finished.
  mahoragaTurn: {
    dur: 1.40, loop: false, keys: [
      K(0, {}),
      K(0.24, {
        Hips: [4, 14, 0], Hips_pos: [0, -0.10, -0.02], Spine: [10, -6, 0], Chest: [8, -8, 0],
        Neck: [6, 0, 0], Head: [18, -4, 0],
        UpArmL: [-30, 14, 22], LoArmL: [-84, 0, 6], UpArmR: [-26, -12, -24], LoArmR: [-88, 0, -6],
        ThighL: [-18, -4, 0], ShinL: [16, 0, 0], ThighR: [14, 6, 0], ShinR: [22, 0, 0]
      }, 'out'),
      // absolutely still while the wheel does its work
      K(0.72, {
        Hips: [4, 14, 0], Hips_pos: [0, -0.10, -0.02], Spine: [10, -6, 0], Head: [19, -4, 0],
        UpArmL: [-30, 14, 22], UpArmR: [-26, -12, -24],
        ThighL: [-18, -4, 0], ShinL: [16, 0, 0], ThighR: [14, 6, 0], ShinR: [22, 0, 0]
      }, 'hold'),
      // the head comes up. It has an answer now.
      K(0.92, {
        Hips: [-2, 16, 0], Hips_pos: [0, -0.06, -0.02], Spine: [-4, -6, 0], Chest: [-6, -8, 0],
        Neck: [-4, 0, 0], Head: [-14, -4, 0],
        UpArmL: [-40, 16, 26], LoArmL: [-74, 0, 6], UpArmR: [-36, -14, -28], LoArmR: [-78, 0, -6]
      }, 'snap'),
      // ONE STEP.
      K(1.14, {
        Hips: [2, 12, 0], Hips_pos: [0, -0.16, 0.10], Spine: [8, -6, 0], Chest: [6, -8, 0],
        Head: [-4, -6, 0],
        UpArmL: [-52, 14, 24], LoArmL: [-86, 0, 6], UpArmR: [-46, -12, -26], LoArmR: [-90, 0, -6],
        ThighL: [-52, -4, 0], ShinL: [44, 0, 0], FootL: [-12, -8, 0],
        ThighR: [34, 6, 0], ShinR: [58, 0, 0], FootR: [20, 8, 0]
      }, 'snap'),
      K(1.40, {
        Hips: [2, 12, 0], Hips_pos: [0, -0.14, 0.09], Chest: [6, -8, 0], Head: [-4, -6, 0],
        UpArmL: [-52, 14, 24], UpArmR: [-46, -12, -26],
        ThighL: [-48, -4, 0], ShinL: [40, 0, 0], ThighR: [30, 6, 0], ShinR: [54, 0, 0]
      }, 'hold')
    ]
  }
};
