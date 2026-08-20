// YAGA — heavy, grounded, unhurried, and the only set in the project with a
// SUSTAINED CRAFT LOOP in it.
//
// THE THREE RULES THIS SET IS AUTHORED ON:
//
//   1  HE NEVER RUSHES. Every wind-up is longer than the roster's and every
//      follow-through is longer still. Where Naoya's clips ARRIVE at poses and
//      Miwa's barely move, Yaga's TRAVEL — long eased keys with no snap on the
//      approach and one hard stop on contact. A big man's body has to be
//      started and stopped, and the animation is where that is paid for.
//
//   2  HIS NEUTRAL IS ARMS FOLDED. He is a teacher, not a duelist, and the
//      single most characterful decision in the file is that his idle is not a
//      fighting stance at all. Nothing else in the roster stands like this;
//      Todo's arms are out, Panda's are loose, Dagon's hang. Yaga's are
//      CROSSED, which means every attack has to UNFOLD first — and that
//      unfolding is visible in the first three frames of every clip, which is
//      what makes his startup frames read as slow rather than merely be slow.
//
//   3  THE BUILD IS REAL WORK. `build` is the longest loop in the project at
//      2.6 s and it is the only one authored as a CRAFT ACTION: he is not
//      channelling, he is assembling. Both hands are busy, they are busy at
//      DIFFERENT things at the same time, the shoulders drive from the back
//      rather than the arm, and he leans into the work and comes out of it to
//      look at what he has done. See the note on the clip itself.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — ARMS FOLDED. Feet planted wide and square (no lead foot: he is not
// blading his body at anybody), weight dead centre, chin down, shoulders back.
// He is waiting for an answer.
export const YAGA_STANCE = {
  Hips_pos: [0, -0.035, 0],
  Hips: [0, 8, 0], Spine: [3, -3, 0], Chest: [2, -4, 0], Neck: [-2, -2, 0], Head: [-4, -4, 0],
  ClavL: [0, 0, 6], ClavR: [0, 0, -6],
  // THE FOLD. Elbows low and pulled IN to the ribs (rz negative on the left
  // adducts toward the body, positive on the right), forearms folded up to
  // just past horizontal and swung across the chest by the upper arm's yaw,
  // and the right forearm stacked UNDER the left — which is what makes it read
  // as arms crossed rather than as two arms that happen to be in front of him.
  UpArmL: [-6, -56, 10], LoArmL: [-86, 0, 0], HandL: [-8, 20, 0],
  UpArmR: [2, 52, -10], LoArmR: [-96, 0, 0], HandR: [-8, -20, 0],
  ThighL: [-7, -6, 0], ShinL: [9, 0, 0], FootL: [1, -12, 0],
  ThighR: [7, 6, 0], ShinR: [9, 0, 0], FootR: [1, 12, 0]
};

export const YAGA_CLIPS = {
  // Slow, deep, deliberate breathing with the arms still folded. 5.2 s — the
  // longest idle in the project (Nanami's 4.2 was the previous longest), and
  // the stillness is doing the same job Nanami's does for a different reason:
  // his is discipline, Yaga's is BULK. He does not fidget because moving costs
  // him something.
  idle: {
    dur: 5.2, loop: true, keys: [
      K(0, {}),
      K(2.1, { Chest: [4, -4, 0], Spine: [5, -3, 0], Hips_pos: [0, -0.048, 0], Head: [-2, -3, 0], UpArmL: [-5, -56, 11], UpArmR: [3, 52, -11] }),
      K(3.7, { Chest: [1, -5, 0], Hips_pos: [0, -0.022, 0], Head: [-5, -6, 0] }),
      K(5.2, {})
    ]
  },

  // A HEAVY WALK. Long, low strides with real weight transfer: the hips drop
  // onto each foot rather than gliding over it. The arms STAY FOLDED — he
  // walks toward you without unfolding, which is the whole read.
  walk: {
    dur: 1.06, loop: true, keys: [
      K(0, { ThighL: [-26, -6, 0], ShinL: [10, 0, 0], FootL: [-6, -12, 0], ThighR: [18, 6, 0], ShinR: [26, 0, 0], FootR: [10, 12, 0], Hips_pos: [0, -0.055, 0], Hips: [0, 12, 0], Spine: [5, -3, 0], UpArmL: [-6, -56, 10], UpArmR: [2, 52, -10] }),
      K(0.265, { ThighL: [-4, -6, 0], ShinL: [18, 0, 0], ThighR: [2, 6, 0], ShinR: [12, 0, 0], Hips_pos: [0, -0.020, 0], Chest: [3, -2, 0] }),
      K(0.53, { ThighL: [20, -6, 0], ShinL: [24, 0, 0], FootL: [10, -12, 0], ThighR: [-24, 6, 0], ShinR: [12, 0, 0], FootR: [-6, 12, 0], Hips_pos: [0, -0.055, 0], Hips: [0, 4, 0], Spine: [5, -3, 0], UpArmL: [-5, -56, 11], UpArmR: [1, 52, -9] }),
      K(0.795, { ThighL: [0, -6, 0], ShinL: [14, 0, 0], ThighR: [-6, 6, 0], ShinR: [20, 0, 0], Hips_pos: [0, -0.020, 0], Chest: [3, -6, 0] }),
      K(1.06, { ThighL: [-26, -6, 0], ShinL: [10, 0, 0], FootL: [-6, -12, 0], ThighR: [18, 6, 0], ShinR: [26, 0, 0], FootR: [10, 12, 0], Hips_pos: [0, -0.055, 0], Hips: [0, 12, 0] })
    ]
  },

  // The run finally unfolds him — arms drive, and the top-heavy mass carries
  // forward of the feet, which is what makes it look like it takes effort to
  // stop. Slowest cadence in the project after Dagon's.
  run: {
    dur: 0.66, loop: true, keys: [
      K(0, { Spine: [18, -2, 0], Chest: [11, -3, 0], Hips: [4, 8, 0], ThighL: [-46, -4, 0], ShinL: [22, 0, 0], FootL: [-12, -8, 0], ThighR: [30, 4, 0], ShinR: [58, 0, 0], FootR: [26, 8, 0], UpArmL: [-26, 12, 14], LoArmL: [-96, 0, 6], UpArmR: [-64, -10, -16], LoArmR: [-88, 0, -6], Hips_pos: [0, -0.038, 0] }),
      K(0.165, { Spine: [16, -2, 0], ThighL: [-8, -4, 0], ShinL: [28, 0, 0], ThighR: [-14, 4, 0], ShinR: [36, 0, 0], Hips_pos: [0, -0.082, 0] }),
      K(0.33, { Spine: [18, -2, 0], Chest: [11, -3, 0], Hips: [4, 8, 0], ThighL: [30, -4, 0], ShinL: [58, 0, 0], FootL: [26, -8, 0], ThighR: [-46, 4, 0], ShinR: [22, 0, 0], FootR: [-12, 8, 0], UpArmL: [-64, 12, 14], LoArmL: [-88, 0, 6], UpArmR: [-26, -10, -16], LoArmR: [-96, 0, -6], Hips_pos: [0, -0.038, 0] }),
      K(0.495, { Spine: [16, -2, 0], ThighL: [-14, -4, 0], ShinL: [36, 0, 0], ThighR: [-8, 4, 0], ShinR: [28, 0, 0], Hips_pos: [0, -0.082, 0] }),
      K(0.66, { Spine: [18, -2, 0], Chest: [11, -3, 0], Hips: [4, 8, 0], ThighL: [-46, -4, 0], ShinL: [22, 0, 0], FootL: [-12, -8, 0], ThighR: [30, 4, 0], ShinR: [58, 0, 0], FootR: [26, 8, 0], UpArmL: [-26, 12, 14], UpArmR: [-64, -10, -16] })
    ]
  },

  // A SHORT HEAVY DASH — a shoulder-first shove of the whole body rather than
  // a step. It goes almost nowhere and it lands hard.
  dash: {
    dur: 0.40, loop: false, keys: [
      K(0, {}),
      K(0.10, { Spine: [26, -2, 0], Chest: [16, -3, 0], Hips_pos: [0, -0.135, 0], ThighL: [-44, -6, 0], ShinL: [34, 0, 0], ThighR: [26, 6, 0], ShinR: [52, 0, 0], UpArmL: [-14, 16, 26], LoArmL: [-58, 0, 6], UpArmR: [-10, -14, -28], LoArmR: [-54, 0, -6], ClavL: [0, 0, 14], ClavR: [0, 0, -14] }, 'out'),
      K(0.40, { Spine: [18, -3, 0], Hips_pos: [0, -0.095, 0], ThighL: [-34, -6, 0], ShinL: [28, 0, 0], ThighR: [18, 6, 0], ShinR: [40, 0, 0], UpArmL: [-34, 20, 22], UpArmR: [-30, -18, -24] })
    ]
  },

  // ---- THE STRING ---------------------------------------------------------
  // HOOK. The fold has to come apart before anything can happen — the first
  // key is the UNFOLD, and it is why the 9-frame startup reads as heavy rather
  // than as sluggish. Then the whole torso goes into it.
  punch1: {
    dur: 0.52, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmR: [-30, -20, -18], LoArmR: [-84, -20, 0], Chest: [2, -18, 0], Hips: [0, 20, 0] }, 'in'),
      K(0.21, { UpArmR: [-60, 30, -6], LoArmR: [-38, 0, 0], HandR: [-16, 120, 0], UpArmL: [-46, 22, 34], LoArmL: [-88, 30, 0], Chest: [8, 26, 0], Spine: [6, 16, 0], Hips: [2, -8, 0], Head: [4, 18, 0], Hips_pos: [0, -0.062, 0], ThighR: [-14, 6, 0] }, 'snap'),
      K(0.29, { UpArmR: [-58, 30, -6], Chest: [8, 26, 0], Hips_pos: [0, -0.062, 0] }, 'hold'),
      K(0.52, {}, 'out')
    ]
  },
  // CROSS. Straight through, from the back foot, and the hips do all of it.
  punch2: {
    dur: 0.56, loop: false, keys: [
      K(0, {}),
      K(0.11, { UpArmL: [-40, 40, 26], LoArmL: [-100, 40, 0], Chest: [2, 22, 0], Hips: [0, -6, 0] }, 'in'),
      K(0.23, { UpArmL: [-86, -18, 10], LoArmL: [-14, 0, 0], HandL: [-14, 168, 0], UpArmR: [-30, -34, -30], LoArmR: [-96, -34, 0], Chest: [10, -26, 0], Spine: [8, -16, 0], Hips: [2, 30, 0], Head: [4, -14, 0], Hips_pos: [0, -0.070, 0], ThighL: [-18, -6, 0] }, 'snap'),
      K(0.31, { UpArmL: [-84, -18, 10], Chest: [10, -26, 0], Hips_pos: [0, -0.070, 0] }, 'hold'),
      K(0.56, {}, 'out')
    ]
  },
  // UPPERCUT. Legs first, then the arm — he lifts them off the ground with his
  // knees, which is the only honest way to animate a launcher on a body this
  // size.
  punch3: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips_pos: [0, -0.145, 0], ThighL: [-38, -6, 0], ShinL: [46, 0, 0], ThighR: [-30, 6, 0], ShinR: [42, 0, 0], Spine: [12, -8, 0], UpArmR: [-14, -24, -22], LoArmR: [-118, -24, 0] }, 'in'),
      K(0.27, { Hips_pos: [0, 0.030, 0], ThighL: [-8, -6, 0], ShinL: [10, 0, 0], ThighR: [4, 6, 0], ShinR: [8, 0, 0], UpArmR: [-158, -10, -14], LoArmR: [-26, 0, 0], HandR: [-30, -20, 0], UpArmL: [-50, 26, 30], Chest: [-16, 14, 0], Spine: [-12, 10, 0], Head: [-14, 8, 0] }, 'snap'),
      K(0.37, { UpArmR: [-156, -10, -14], Chest: [-16, 14, 0], Hips_pos: [0, 0.030, 0] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // SHOULDER DRIVE — the heavy. Not a swing: he puts his whole shoulder
  // through them and finishes standing where they were.
  heavy: {
    dur: 0.94, loop: false, keys: [
      K(0, {}),
      K(0.26, { Chest: [-4, -32, 0], Spine: [-2, -20, 0], Hips: [0, 34, 0], ClavR: [0, 0, -18], UpArmR: [-8, -40, -34], LoArmR: [-118, -40, 0], UpArmL: [-30, 44, 20], Hips_pos: [0, -0.088, 0], ThighR: [16, 8, 0], ShinR: [22, 0, 0] }, 'in'),
      K(0.40, { Chest: [14, 30, 0], Spine: [12, 20, 0], Hips: [4, -18, 0], ClavR: [0, 0, 22], UpArmR: [-34, 30, -14], LoArmR: [-70, 0, 0], UpArmL: [-16, -20, 24], Head: [8, 14, 0], Hips_pos: [0, -0.130, 0], ThighL: [-34, -6, 0], ShinL: [40, 0, 0], ThighR: [26, 8, 0], ShinR: [46, 0, 0] }, 'snap'),
      K(0.54, { Chest: [14, 30, 0], ClavR: [0, 0, 22], UpArmR: [-32, 30, -14], Hips_pos: [0, -0.130, 0] }, 'hold'),
      K(0.94, {}, 'out')
    ]
  },

  // ---- B — THE CONSTRUCTION LOOP -----------------------------------------
  // THE MOST IMPORTANT CLIP IN THE FILE, and the one the whole character
  // stands on. 2.6 s, looping, and it is authored as CRAFT rather than as
  // channelling — the difference being that a channel is one held pose and
  // craft is a SEQUENCE OF DIFFERENT SMALL ACTIONS, each finished before the
  // next starts.
  //
  // The cycle, beat by beat:
  //   0.00  both hands come down and meet in front of the sternum — he is
  //         holding something between them that is not there yet
  //   0.55  the LEFT hand holds position while the RIGHT works out to the side
  //         and back in: a fitting motion, wrist-led, elbow high
  //   1.15  he leans IN over the work. Head down, shoulders round, spine
  //         forward — a man looking closely at his hands
  //   1.70  the hands swap roles: the right holds, the left presses down twice
  //         in quick succession, seating something
  //   2.15  he sits BACK and looks at it. Chin up, shoulders open, hands still.
  //         This beat is why it reads as work rather than as a spell: a
  //         craftsman stops and checks.
  //   2.60  back to the top
  // The two hands are deliberately NEVER doing the same thing on the same
  // frame, which is the single tell that separates work from waving.
  build: {
    dur: 2.60, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.105, 0], Hips: [0, 6, 0], Spine: [16, -2, 0], Chest: [12, -2, 0],
        Neck: [6, 0, 0], Head: [14, -2, 0],
        UpArmL: [-64, 30, 16], LoArmL: [-92, 28, 0], HandL: [-24, 46, 0],
        UpArmR: [-62, -28, -14], LoArmR: [-96, -26, 0], HandR: [-22, -44, 0],
        ThighL: [-14, -8, 0], ShinL: [22, 0, 0], ThighR: [-10, 8, 0], ShinR: [20, 0, 0]
      }),
      K(0.55, {
        UpArmR: [-48, -56, -22], LoArmR: [-74, -46, 0], HandR: [-46, -30, 0],
        UpArmL: [-66, 30, 16], LoArmL: [-94, 28, 0],
        Chest: [13, -6, 0], Head: [15, -6, 0], Hips_pos: [0, -0.098, 0]
      }, 'out'),
      K(0.86, {
        UpArmR: [-70, -18, -8], LoArmR: [-104, -18, 0], HandR: [-10, -58, 0],
        Chest: [14, 2, 0], Head: [16, 2, 0]
      }, 'out'),
      K(1.15, {
        Spine: [26, -1, 0], Chest: [20, -1, 0], Neck: [10, 0, 0], Head: [22, 0, 0],
        ClavL: [0, 0, 10], ClavR: [0, 0, -10],
        UpArmL: [-72, 24, 12], LoArmL: [-100, 22, 0],
        UpArmR: [-70, -22, -10], LoArmR: [-102, -20, 0],
        Hips_pos: [0, -0.130, 0], ThighL: [-20, -8, 0], ShinL: [30, 0, 0], ThighR: [-16, 8, 0], ShinR: [28, 0, 0]
      }, 'in'),
      K(1.70, {
        UpArmL: [-52, 40, 22], LoArmL: [-70, 34, 0], HandL: [-52, 34, 0],
        UpArmR: [-72, -22, -10], LoArmR: [-104, -20, 0],
        Spine: [24, -1, 0], Head: [20, 0, 0]
      }, 'out'),
      K(1.88, {
        UpArmL: [-66, 30, 16], LoArmL: [-96, 26, 0], HandL: [-16, 50, 0]
      }, 'snap'),
      K(2.02, {
        UpArmL: [-54, 38, 20], LoArmL: [-76, 32, 0], HandL: [-46, 36, 0]
      }, 'out'),
      K(2.15, {
        UpArmL: [-66, 30, 16], LoArmL: [-96, 26, 0], HandL: [-16, 50, 0]
      }, 'snap'),
      K(2.38, {
        // HE SITS BACK AND LOOKS AT IT
        Spine: [6, -3, 0], Chest: [3, -3, 0], Neck: [-2, 0, 0], Head: [-6, 0, 0],
        ClavL: [0, 0, 2], ClavR: [0, 0, -2],
        UpArmL: [-50, 26, 22], LoArmL: [-78, 24, 0],
        UpArmR: [-48, -24, -20], LoArmR: [-80, -22, 0],
        Hips_pos: [0, -0.062, 0], ThighL: [-8, -8, 0], ShinL: [12, 0, 0], ThighR: [-6, 8, 0], ShinR: [11, 0, 0]
      }, 'out'),
      K(2.60, {
        Hips_pos: [0, -0.105, 0], Spine: [16, -2, 0], Chest: [12, -2, 0], Neck: [6, 0, 0], Head: [14, -2, 0],
        UpArmL: [-64, 30, 16], LoArmL: [-92, 28, 0], HandL: [-24, 46, 0],
        UpArmR: [-62, -28, -14], LoArmR: [-96, -26, 0], HandR: [-22, -44, 0],
        ThighL: [-14, -8, 0], ShinL: [22, 0, 0], ThighR: [-10, 8, 0], ShinR: [20, 0, 0]
      }, 'in')
    ]
  },

  // THE DEPLOY. He opens both hands and pushes the finished thing away from
  // him — one shove, then he straightens up and folds his arms again, which is
  // the button on the whole sequence.
  deploy: {
    dur: 0.90, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.105, 0], Spine: [16, -2, 0], Chest: [12, -2, 0], Head: [14, -2, 0],
        UpArmL: [-64, 30, 16], LoArmL: [-92, 28, 0], UpArmR: [-62, -28, -14], LoArmR: [-96, -26, 0]
      }),
      K(0.16, {
        UpArmL: [-46, 34, 20], LoArmL: [-112, 32, 0], UpArmR: [-44, -32, -18], LoArmR: [-114, -30, 0],
        Spine: [20, -2, 0], Head: [18, -2, 0], Hips_pos: [0, -0.125, 0]
      }, 'in'),
      K(0.32, {
        UpArmL: [-84, 8, 10], LoArmL: [-22, 6, 0], HandL: [-10, 90, 0],
        UpArmR: [-84, -8, -10], LoArmR: [-22, -6, 0], HandR: [-10, -90, 0],
        Spine: [2, -2, 0], Chest: [0, -2, 0], Head: [-4, -2, 0], Hips_pos: [0, -0.048, 0],
        ThighL: [-6, -8, 0], ShinL: [8, 0, 0], ThighR: [-4, 8, 0], ShinR: [8, 0, 0]
      }, 'snap'),
      K(0.46, { UpArmL: [-82, 8, 10], UpArmR: [-82, -8, -10], Hips_pos: [0, -0.048, 0] }, 'hold'),
      K(0.90, {}, 'out')
    ]
  },

  // ---- RB — COMMAND -------------------------------------------------------
  // He unfolds ONE arm and points. That is all. No flourish, no energy — the
  // corpses are his, and he does not have to ask them twice. The other arm
  // stays folded across his chest for the whole clip, which is the entire
  // characterisation of the move.
  ct1: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmR: [-38, -34, -22], LoArmR: [-98, -34, 0], Chest: [2, -10, 0] }, 'in'),
      K(0.24, {
        UpArmR: [-88, 6, -10], LoArmR: [-8, 0, 0], HandR: [-6, -80, 0],
        Chest: [4, 12, 0], Spine: [3, 8, 0], Head: [2, 10, 0], Hips: [0, 2, 0],
        Hips_pos: [0, -0.042, 0]
      }, 'snap'),
      K(0.44, { UpArmR: [-86, 6, -10], LoArmR: [-8, 0, 0], Chest: [4, 12, 0], Head: [2, 10, 0] }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },

  // ---- RT — HAYMAKER ------------------------------------------------------
  // The most committed swing in his kit and the longest wind-up in the file
  // outside the ultimate. The arm goes all the way back and DOWN behind the
  // hip, the front foot leaves the ground on the way through, and he ends
  // completely turned around with his back to where he was facing. The
  // recovery frames are visible in the animation, which is the honest thing to
  // do with a move priced on them.
  ct2: {
    dur: 1.28, loop: false, keys: [
      K(0, {}),
      K(0.34, {
        Chest: [-10, -44, 0], Spine: [-6, -30, 0], Hips: [0, 46, 0],
        ClavR: [0, 0, -22], UpArmR: [24, -46, -30], LoArmR: [-58, -30, 0], HandR: [-20, -60, 0],
        UpArmL: [-56, 46, 26], LoArmL: [-70, 34, 0],
        Head: [-4, -30, 0], Hips_pos: [0, -0.105, 0],
        ThighR: [22, 10, 0], ShinR: [30, 0, 0], ThighL: [-16, -8, 0], ShinL: [12, 0, 0]
      }, 'in'),
      K(0.52, {
        Chest: [16, 40, 0], Spine: [12, 28, 0], Hips: [6, -34, 0],
        ClavR: [0, 0, 26], UpArmR: [-96, 44, -8], LoArmR: [-10, 0, 0], HandR: [-16, 150, 0],
        UpArmL: [-24, -30, 28], LoArmL: [-66, -20, 0],
        Head: [10, 26, 0], Hips_pos: [0, -0.150, 0],
        ThighL: [-42, -8, 0], ShinL: [52, 0, 0], ThighR: [30, 10, 0], ShinR: [54, 0, 0]
      }, 'snap'),
      K(0.68, { Chest: [16, 40, 0], UpArmR: [-94, 44, -8], Hips_pos: [0, -0.150, 0] }, 'hold'),
      K(0.98, {
        // the follow-through carries him right round — he is facing the wrong
        // way and has to come back, which IS the punish window
        Chest: [10, 68, 0], Spine: [8, 46, 0], Hips: [4, -66, 0], Head: [6, 40, 0],
        UpArmR: [-60, 70, -16], LoArmR: [-40, 0, 0], UpArmL: [-40, -46, 30],
        Hips_pos: [0, -0.118, 0]
      }, 'out'),
      K(1.28, {}, 'out')
    ]
  },

  // ---- D-pad RIGHT — MASTERPIECE -----------------------------------------
  // The ultimate. He drops to ONE KNEE and puts both palms flat on the ground,
  // and the corpse comes up out of the floor in front of him — the only time
  // in the character where the work is already done. It is the biggest,
  // slowest pose in the file and the only one where he is looking UP.
  ult: {
    dur: 2.05, loop: false, keys: [
      K(0, {}),
      K(0.30, {
        UpArmL: [-42, 40, 26], LoArmL: [-96, 36, 0], UpArmR: [-38, -38, -24], LoArmR: [-98, -34, 0],
        Spine: [10, -2, 0], Chest: [8, -2, 0], Head: [6, -2, 0], Hips_pos: [0, -0.075, 0]
      }, 'in'),
      K(0.62, {
        // down on one knee, palms flat
        Hips_pos: [0, -0.330, 0], Hips: [8, 6, 0],
        ThighL: [-88, -10, 0], ShinL: [96, 0, 0], FootL: [18, -12, 0],
        ThighR: [-52, 12, 0], ShinR: [128, 0, 0], FootR: [30, 12, 0],
        Spine: [30, -1, 0], Chest: [22, -1, 0], Neck: [12, 0, 0], Head: [26, 0, 0],
        UpArmL: [-58, 18, 14], LoArmL: [-52, 12, 0], HandL: [-64, 40, 0],
        UpArmR: [-56, -16, -12], LoArmR: [-54, -10, 0], HandR: [-62, -38, 0]
      }, 'snap'),
      K(0.86, { Hips_pos: [0, -0.340, 0], Head: [28, 0, 0] }, 'hold'),
      K(1.30, {
        // he watches it come up, and he stands as it does
        Hips_pos: [0, -0.200, 0], Spine: [4, -1, 0], Chest: [0, -1, 0], Neck: [-8, 0, 0], Head: [-24, 0, 0],
        ThighL: [-52, -10, 0], ShinL: [58, 0, 0], ThighR: [-24, 12, 0], ShinR: [72, 0, 0],
        UpArmL: [-70, 22, 22], LoArmL: [-70, 16, 0], UpArmR: [-68, -20, -20], LoArmR: [-72, -14, 0]
      }, 'out'),
      K(1.62, {
        Hips_pos: [0, -0.040, 0], Head: [-18, -2, 0], Neck: [-6, 0, 0],
        ThighL: [-10, -8, 0], ShinL: [12, 0, 0], ThighR: [-6, 8, 0], ShinR: [10, 0, 0],
        UpArmL: [-8, -54, 10], LoArmL: [-84, 0, 0], UpArmR: [0, 50, -10], LoArmR: [-94, 0, 0]
      }, 'out'),
      K(2.05, {}, 'out')   // back to arms folded
    ]
  },

  // ---- TAUNT — MARKING BAD HOMEWORK --------------------------------------
  // RESEARCHED RATHER THAN INVENTED, as the brief requires. There is no famous
  // Yaga battle quip in the material — he is a headmaster who mostly shouts at
  // students about paperwork and about staying alive — so the line is drawn
  // from the ONE register the source consistently puts him in: the exasperated
  // teacher. "Sit down." is the shortest true thing he says to a room.
  //
  // The clip is the joke, not the line: a SLOW HEAD SHAKE, arms never
  // unfolding, and one long look away at the end — a man who has decided this
  // is not worth the meeting. Nothing about it is a fighting pose.
  taunt: {
    dur: 3.30, loop: false, keys: [
      K(0, {}),
      K(0.55, { Head: [-2, -22, 0], Neck: [0, -8, 0], Chest: [2, -8, 0] }, 'out'),
      K(1.05, { Head: [-2, 22, 0], Neck: [0, 8, 0], Chest: [2, 8, 0] }, 'out'),
      K(1.50, { Head: [-4, -16, 0], Neck: [0, -6, 0], Chest: [2, -6, 0] }, 'out'),
      K(1.86, { Head: [-8, -2, 0], Neck: [-2, 0, 0], Chest: [1, -4, 0], Spine: [2, -3, 0] }, 'out'),
      // the long look away
      K(2.40, { Head: [-6, 34, 0], Neck: [-2, 12, 0], Chest: [2, 10, 0], Hips_pos: [0, -0.028, 0] }, 'out'),
      K(2.95, { Head: [-6, 34, 0], Neck: [-2, 12, 0] }, 'hold'),
      K(3.30, {}, 'out')
    ]
  },

  // Victory: he unfolds, exhales, and folds again. That is the whole
  // celebration, and it is the correct one for a man whose job this is not.
  victory: {
    dur: 3.20, loop: false, keys: [
      K(0, {}),
      K(0.60, {
        UpArmL: [-24, 10, 12], LoArmL: [-38, 8, 0], UpArmR: [-20, -8, -10], LoArmR: [-36, -6, 0],
        Chest: [-4, -2, 0], Spine: [-2, -2, 0], Head: [-10, 0, 0], Hips_pos: [0, -0.020, 0]
      }, 'out'),
      K(1.30, { Chest: [6, -2, 0], Spine: [6, -2, 0], Head: [4, 0, 0], Hips_pos: [0, -0.058, 0] }, 'out'),
      K(2.20, {}, 'out'),
      K(3.20, {}, 'hold')
    ]
  },

  // ---- FINISHER CLIPS -----------------------------------------------------
  // yagaBrace — he sets his feet and takes the hit on his forearms, the pose
  // the finisher's second beat needs.
  yagaBrace: {
    dur: 0.9, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        UpArmL: [-96, 26, 20], LoArmL: [-104, 22, 0], UpArmR: [-94, -24, -18], LoArmR: [-106, -20, 0],
        Chest: [10, 0, 0], Spine: [8, 0, 0], Head: [12, 0, 0],
        Hips_pos: [0, -0.115, 0], ThighL: [-26, -10, 0], ShinL: [36, 0, 0], ThighR: [-20, 10, 0], ShinR: [34, 0, 0]
      }, 'snap'),
      K(0.60, { UpArmL: [-94, 26, 20], UpArmR: [-92, -24, -18], Hips_pos: [0, -0.115, 0] }, 'hold'),
      K(0.9, {}, 'out')
    ]
  },
  // yagaPoint — the single most Yaga thing he does: he does not fight the
  // person in front of him, he tells something else to.
  yagaPoint: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.16, { UpArmR: [-34, -36, -24], LoArmR: [-100, -34, 0], Chest: [2, -14, 0], Head: [0, -10, 0] }, 'in'),
      K(0.28, {
        UpArmR: [-92, 4, -8], LoArmR: [-6, 0, 0], HandR: [-6, -84, 0],
        Chest: [5, 14, 0], Spine: [4, 10, 0], Head: [4, 12, 0], Hips_pos: [0, -0.046, 0]
      }, 'snap'),
      K(0.82, { UpArmR: [-90, 4, -8], Chest: [5, 14, 0], Head: [4, 12, 0] }, 'hold'),
      K(1.10, {}, 'out')
    ]
  },
  // yagaGrade — the outro pose. Arms folded, chin down, one slow nod, the way
  // he'd close a lesson.
  yagaGrade: {
    dur: 2.4, loop: false, keys: [
      K(0, {}),
      K(0.7, { Head: [8, -4, 0], Neck: [3, 0, 0], Chest: [3, -4, 0] }, 'out'),
      K(1.3, { Head: [-6, -4, 0], Neck: [-2, 0, 0] }, 'out'),
      K(2.4, {}, 'hold')
    ]
  }
};
