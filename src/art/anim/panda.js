// PANDA — THREE COMPLETE ANIMATION SETS ON ONE SKELETON.
//
// This is the largest clip file in the project and the reason is structural
// rather than ambitious: he is not one character with three costumes, he is
// three characters sharing a health system, and the brief is explicit that the
// stances must feel different IN THE HANDS. So the base set (idle / walk / run
// / dash / block / three punches / heavy) is authored THREE TIMES rather than
// once with a tint.
//
// THE NAMING CONTRACT. `Fighter._clip` appends the active core's `clipSuffix`
// and falls through when the clip is absent:
//   PANDA        no suffix   —  `idle`, `walk`, `punch1` …   (this IS the base)
//   GORILLA      'Gor'       —  `idleGor`, `walkGor`, `punch1Gor` …
//   TRICERATOPS  'Tri'       —  `idleTri`, `walkTri`, `punch1Tri` …
// That fall-through is what makes a half-authored stance degrade to the base
// clip instead of throwing, and it is why the balanced core costs no lookups —
// its suffix is the empty string, so it never enters the branch at all.
//
// THE THREE VOICES, and every pose below is chosen to hold one of them:
//
//   PANDA is the closest thing to normal in the roster, and it is COMIC. Not
//   silly — comic. He is a bear doing martial arts and he is slightly too round
//   to be doing it: the weight lands a beat late, the belly leads the turn, and
//   every recovery has a small settle in it where the mass catches up. The
//   humour is in the TIMING, never in the pose, because a character who mugs is
//   not dangerous and this one has to be both.
//
//   GORILLA is HEAVY AND GROUNDED and it is the deliberate opposite of Kashimo
//   in every choice. Everything starts from the floor: hips drop first, the
//   blow follows, and the recovery is long and low. He never comes fully
//   upright — the stance sits at Hips_pos -0.16 against the roster's -0.045 —
//   and both arms hang forward of the body in a knuckle-carry. Where Kashimo
//   snaps out and drifts back, Gorilla WINDS UP and then arrives; the two are
//   the ends of the weight spectrum the brief asks for, and they are on the
//   same skeleton so the comparison is real.
//
//   TRICERATOPS is LOW AND FORWARD, all horn. Short quick steps, the head
//   driving every motion, and the body following it — the exact inverse of
//   Gorilla, where the hips lead and the arms follow. Canon makes this body
//   "more slender", so the stance is narrow and upright-shouldered where the
//   other two are wide.
//
// A NOTE ON WHAT IS *NOT* HERE. There is no separate reaction set per stance
// (hitLight, launched, knockdown, getup). Those are inherited from base.js by
// all three, deliberately: being hit is not something he does, it is something
// that happens to him, and three sets of flinches would have been three times
// the work for a difference nobody can act on. The brief asks that the stances
// feel different IN THE HANDS, and hitstun is the one place the hands are not
// involved.
import { STANCE as BASE } from './base.js';

const K = (t, pose, e) => ({ t, pose, e });

// ---- STANCE — THE BALANCED CORE -------------------------------------------
// Upright, wide, arms out and low, weight even. A big round guard. The head is
// deliberately level: this core is the level-headed one and the neck is where
// that shows.
export const PANDA_STANCE = {
  ...BASE,
  Hips_pos: [0, -0.070, 0],
  Hips: [0, 16, 0],
  Spine: [5, -5, 0], Chest: [4, -7, 0], Neck: [0, -3, 0], Head: [1, -5, 0],
  // arms hang WIDE — he is barrel-chested and the arms cannot come in
  ClavL: [0, 0, 0], UpArmL: [-16, 8, 30], LoArmL: [-72, 22, 0], HandL: [-16, 60, 0],
  ClavR: [0, 0, 0], UpArmR: [-14, -6, -32], LoArmR: [-76, -20, 0], HandR: [-16, -60, 0],
  ThighL: [-14, -6, 4], ShinL: [16, 0, 0], FootL: [3, -12, 0],
  ThighR: [10, 8, -4], ShinR: [20, 0, 0], FootR: [8, 10, 0]
};

const S = PANDA_STANCE;

export const PANDA_CLIPS = {
  // ======================================================================
  // 1 · THE BALANCED CORE — comic timing, normal shapes
  // ======================================================================
  // IDLE. A slow breathing sway with ONE joke in it: the belly leads and the
  // shoulders follow half a beat later, so he always looks fractionally out of
  // sync with himself. Nothing else about the pose is funny.
  idle: {
    dur: 3.0, loop: true, keys: [
      K(0, {}),
      K(0.75, { Spine: [8, -5, 0], Hips_pos: [0, -0.058, 0.008], Chest: [3, -7, 0], Head: [3, -5, 0], UpArmL: [-20, 9, 32], UpArmR: [-18, -7, -34] }),
      // the shoulders arrive here, after the belly already went
      K(1.10, { Chest: [7, -8, 0], UpArmL: [-24, 10, 34], UpArmR: [-22, -8, -36], Head: [2, -4, 0] }),
      K(1.85, { Spine: [3, -5, 0], Hips_pos: [0, -0.080, -0.004], Chest: [2, -6, 0], Head: [0, -6, 0], UpArmL: [-13, 7, 28], UpArmR: [-11, -5, -30] }),
      K(2.25, { Chest: [3, -6, 0], UpArmL: [-15, 8, 29], UpArmR: [-13, -6, -31] }),
      K(3.0, {})
    ]
  },

  walk: {
    dur: 0.90, loop: true, keys: [
      K(0, { ThighL: [-26, -6, 4], ShinL: [14, 0, 0], FootL: [-6, -12, 0], ThighR: [20, 8, -4], ShinR: [26, 0, 0], FootR: [12, 10, 0], Hips_pos: [0.012, -0.078, 0], Hips: [0, 19, 0], UpArmL: [-24, 9, 32], UpArmR: [-12, -6, -30], Spine: [6, -5, 0] }),
      K(0.225, { ThighL: [-4, -6, 4], ShinL: [20, 0, 0], ThighR: [2, 8, -4], ShinR: [14, 0, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.45, { ThighL: [22, -6, 4], ShinL: [24, 0, 0], FootL: [10, -12, 0], ThighR: [-26, 8, -4], ShinR: [12, 0, 0], FootR: [-6, 10, 0], Hips_pos: [-0.012, -0.078, 0], Hips: [0, 13, 0], UpArmL: [-12, 9, 30], UpArmR: [-24, -6, -32], Spine: [6, -5, 0] }),
      K(0.675, { ThighL: [2, -6, 4], ShinL: [18, 0, 0], ThighR: [-4, 8, -4], ShinR: [22, 0, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.90, { ThighL: [-26, -6, 4], ShinL: [14, 0, 0], FootL: [-6, -12, 0], ThighR: [20, 8, -4], ShinR: [26, 0, 0], FootR: [12, 10, 0], Hips_pos: [0.012, -0.078, 0], UpArmL: [-24, 9, 32], UpArmR: [-12, -6, -30] })
    ]
  },

  run: {
    dur: 0.54, loop: true, keys: [
      K(0, { Spine: [15, -4, 0], Chest: [9, -6, 0], Hips: [4, 14, 0], ThighL: [-50, -4, 4], ShinL: [26, 0, 0], FootL: [-12, -10, 0], ThighR: [34, 6, -4], ShinR: [62, 0, 0], FootR: [28, 8, 0], UpArmL: [-30, 10, 26], LoArmL: [-92, 8, 0], UpArmR: [-64, -8, -28], LoArmR: [-84, -8, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.135, { Spine: [13, -4, 0], ThighL: [-8, -4, 4], ShinL: [30, 0, 0], ThighR: [-12, 6, -4], ShinR: [38, 0, 0], Hips_pos: [0, -0.098, 0] }),
      K(0.27, { Spine: [15, -4, 0], Chest: [9, -6, 0], Hips: [4, 14, 0], ThighL: [34, -4, 4], ShinL: [62, 0, 0], FootL: [28, -10, 0], ThighR: [-50, 6, -4], ShinR: [26, 0, 0], FootR: [-12, 8, 0], UpArmL: [-64, 10, 26], LoArmL: [-84, 8, 0], UpArmR: [-30, -8, -28], LoArmR: [-92, -8, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.405, { Spine: [13, -4, 0], ThighL: [-12, -4, 4], ShinL: [38, 0, 0], ThighR: [-8, 6, -4], ShinR: [30, 0, 0], Hips_pos: [0, -0.098, 0] }),
      K(0.54, { Spine: [15, -4, 0], Chest: [9, -6, 0], ThighL: [-50, -4, 4], ShinL: [26, 0, 0], ThighR: [34, 6, -4], ShinR: [62, 0, 0], UpArmL: [-30, 10, 26], UpArmR: [-64, -8, -28], Hips_pos: [0, -0.056, 0] })
    ]
  },

  dash: {
    dur: 0.32, loop: false, keys: [
      K(0, {}),
      K(0.07, { Spine: [24, -4, 0], Chest: [14, -6, 0], Hips_pos: [0, -0.15, 0.02], ThighL: [-46, -6, 4], ShinL: [32, 0, 0], ThighR: [30, 8, -4], ShinR: [56, 0, 0], UpArmL: [22, 12, 36], LoArmL: [-44, 12, 0], UpArmR: [26, -10, -38], LoArmR: [-40, -12, 0] }, 'out'),
      K(0.32, { Spine: [18, -5, 0], Hips_pos: [0, -0.12, 0.014], ThighL: [-36, -6, 4], ShinL: [26, 0, 0], ThighR: [22, 8, -4], ShinR: [44, 0, 0], UpArmL: [10, 11, 32], UpArmR: [14, -9, -34] })
    ]
  },

  // THE STRING. Paw jab, paw cross, double-palm launcher. Round shapes, wide
  // arcs, and a small settle on every recovery where the mass catches up —
  // that settle is the entire comic register of the character and it is worth
  // exactly one key each time.
  punch1: {
    dur: 0.38, loop: false, keys: [
      K(0, {}),
      K(0.07, { Hips: [0, 34, 0], Chest: [4, -18, 0], UpArmR: [-24, -18, -26], LoArmR: [-96, -28, 0] }, 'in'),
      K(0.13, { Hips: [0, 2, 0], Chest: [7, 6, 0], Spine: [8, 3, 0], UpArmR: [-74, 2, -12], LoArmR: [-16, -6, 0], HandR: [-14, -164, 0], UpArmL: [-10, 8, 26], Hips_pos: [0, -0.066, 0.048] }, 'snap'),
      K(0.20, { Hips: [0, 8, 0], UpArmR: [-66, 0, -14], LoArmR: [-30, -8, 0], Hips_pos: [0, -0.068, 0.036] }, 'hold'),
      // THE SETTLE — the body arrives after the arm has already stopped
      K(0.30, { Hips: [0, 14, 0], Chest: [6, -4, 0], Hips_pos: [0, -0.082, 0.014], UpArmR: [-40, -6, -24], LoArmR: [-58, -14, 0] }),
      K(0.38, {})
    ]
  },

  punch2: {
    dur: 0.40, loop: false, keys: [
      K(0, {}),
      K(0.07, { Hips: [0, -12, 0], Chest: [4, 20, 0], UpArmL: [-20, 26, 34], LoArmL: [-88, 34, 0] }, 'in'),
      K(0.14, { Hips: [0, 40, 0], Chest: [7, -22, 0], Spine: [8, -12, 0], UpArmL: [-78, -4, 22], LoArmL: [-20, -8, 0], HandL: [-14, 160, 0], UpArmR: [-8, -6, -26], Hips_pos: [0.014, -0.066, 0.044] }, 'snap'),
      K(0.21, { Hips: [0, 34, 0], UpArmL: [-70, -2, 24], LoArmL: [-32, -10, 0], Hips_pos: [0.010, -0.068, 0.034] }, 'hold'),
      K(0.31, { Hips: [0, 20, 0], Chest: [5, -8, 0], Hips_pos: [0, -0.086, 0.010], UpArmL: [-40, 12, 30], LoArmL: [-62, 18, 0] }),
      K(0.40, {})
    ]
  },

  punch3: {
    dur: 0.56, loop: false, keys: [
      K(0, {}),
      // he SQUATS to load it. A round character launching someone has to look
      // like he pushed off the floor, or the launch reads as magic.
      K(0.11, { Hips: [0, 22, 0], Chest: [16, -12, 0], Spine: [18, -8, 0], Head: [12, -8, 0], UpArmL: [10, 20, 20], LoArmL: [-74, 26, 0], UpArmR: [12, -18, -22], LoArmR: [-78, -24, 0], Hips_pos: [0, -0.140, 0.012], ThighL: [-32, -6, 4], ShinL: [40, 0, 0], ThighR: [26, 8, -4], ShinR: [44, 0, 0] }, 'in'),
      K(0.20, { Hips: [0, 6, -3], Chest: [-16, -4, 0], Spine: [-12, -2, 0], Head: [-12, -2, 0], UpArmL: [-152, 6, 30], LoArmL: [-14, 4, 0], HandL: [-8, 60, 0], UpArmR: [-150, -4, -32], LoArmR: [-16, -4, 0], HandR: [-8, -60, 0], Hips_pos: [0, 0.010, 0.030], ThighL: [-12, -6, 4], ShinL: [8, 0, 0], ThighR: [-4, 8, -4], ShinR: [12, 0, 0] }, 'snap'),
      K(0.29, { Hips: [0, 8, -2], Chest: [-12, -5, 0], UpArmL: [-142, 6, 28], UpArmR: [-140, -4, -30], Hips_pos: [0, 0.002, 0.024] }, 'hold'),
      K(0.42, { Hips: [0, 14, 0], Chest: [4, -6, 0], Hips_pos: [0, -0.086, 0.008], UpArmL: [-40, 10, 30], UpArmR: [-38, -8, -32] }),
      K(0.56, {})
    ]
  },

  heavy: {
    dur: 0.88, loop: false, keys: [
      K(0, {}),
      K(0.17, { Hips: [0, 30, 0], Chest: [12, -20, 0], Spine: [14, -12, 0], UpArmL: [24, 22, 26], LoArmL: [-72, 28, 0], UpArmR: [26, -20, -28], LoArmR: [-76, -26, 0], Hips_pos: [-0.010, -0.128, -0.024], ThighL: [-30, -6, 4], ShinL: [34, 0, 0] }, 'in'),
      K(0.26, { Hips: [0, 34, 0], Chest: [13, -22, 0], Hips_pos: [-0.012, -0.134, -0.028] }, 'hold'),
      K(0.35, { Hips: [0, -4, 0], Chest: [16, 10, 0], Spine: [18, 6, 0], Head: [10, 4, 0], UpArmL: [-70, 2, 18], LoArmL: [-14, 2, 0], UpArmR: [-72, -2, -20], LoArmR: [-16, -2, 0], Hips_pos: [0.010, -0.070, 0.088], ThighL: [-42, -6, 4], ThighR: [30, 8, -4] }, 'snap'),
      K(0.46, { Hips: [0, 0, 0], Chest: [15, 8, 0], UpArmL: [-62, 2, 20], UpArmR: [-64, -2, -22], Hips_pos: [0.008, -0.076, 0.076] }, 'hold'),
      K(0.88, {})
    ]
  },

  // BALANCED · CURSED PALM. Both paws down and out, and the ground answers.
  ct1: {
    dur: 0.68, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips: [0, 16, 0], Chest: [-14, -8, 0], Spine: [-10, -4, 0], Head: [-10, -6, 0], UpArmL: [-138, 12, 34], LoArmL: [-30, 14, 0], UpArmR: [-136, -10, -36], LoArmR: [-32, -12, 0], Hips_pos: [0, -0.040, 0] }, 'in'),
      K(0.235, { Hips: [0, 16, 0], Chest: [24, -8, 0], Spine: [22, -4, 0], Head: [16, -6, 0], UpArmL: [-34, 10, 22], LoArmL: [-16, 10, 0], HandL: [-40, 80, 0], UpArmR: [-32, -8, -24], LoArmR: [-18, -8, 0], HandR: [-40, -80, 0], Hips_pos: [0, -0.146, 0.036], ThighL: [-34, -6, 4], ShinL: [40, 0, 0], ThighR: [28, 8, -4], ShinR: [42, 0, 0] }, 'snap'),
      K(0.34, { Chest: [22, -8, 0], UpArmL: [-30, 10, 22], UpArmR: [-28, -8, -24], Hips_pos: [0, -0.150, 0.030] }, 'hold'),
      K(0.68, {})
    ]
  },

  // BALANCED · ROLLING PRESS. He tucks into a ball, rolls, and lands on them.
  // The tuck is real — the spine folds and the knees come to the chest.
  ct2: {
    dur: 0.84, loop: false, keys: [
      K(0, {}),
      K(0.13, { Hips: [0, 16, 0], Spine: [30, -4, 0], Chest: [22, -6, 0], Head: [22, -4, 0], ThighL: [-72, -6, 4], ShinL: [80, 0, 0], ThighR: [-64, 8, -4], ShinR: [76, 0, 0], UpArmL: [-40, 20, 20], LoArmL: [-124, 26, 0], UpArmR: [-38, -18, -22], LoArmR: [-126, -24, 0], Hips_pos: [0, -0.160, 0.026] }, 'in'),
      // the roll itself — the whole body pitched forward over the hips
      K(0.28, { Hips: [56, 16, 0], Spine: [34, -4, 0], Chest: [26, -6, 0], Head: [26, -4, 0], ThighL: [-88, -6, 4], ShinL: [96, 0, 0], ThighR: [-84, 8, -4], ShinR: [94, 0, 0], Hips_pos: [0, -0.220, 0.100] }, 'out'),
      // and the press: he unfolds onto them
      K(0.40, { Hips: [-6, 16, 0], Spine: [16, -4, 0], Chest: [10, -6, 0], Head: [4, -4, 0], ThighL: [-40, -6, 4], ShinL: [30, 0, 0], ThighR: [22, 8, -4], ShinR: [34, 0, 0], UpArmL: [-96, 14, 34], LoArmL: [-26, 12, 0], UpArmR: [-94, -12, -36], LoArmR: [-28, -10, 0], Hips_pos: [0, -0.104, 0.150] }, 'snap'),
      K(0.52, { Hips: [-2, 16, 0], Chest: [8, -6, 0], UpArmL: [-84, 14, 32], UpArmR: [-82, -12, -34], Hips_pos: [0, -0.110, 0.132] }, 'hold'),
      K(0.84, {})
    ]
  },

  // ======================================================================
  // 2 · GORILLA — heavy, grounded, everything starts from the floor
  // ======================================================================
  // The stance IS the transformation, along with the geometry the model
  // switches on. Hips dropped a full 0.16, both arms hung forward and low in a
  // knuckle carry, chest pitched over them, head down between the shoulders.
  idleGor: {
    dur: 2.2, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.160, 0.030], Hips: [0, 12, 0],
        Spine: [22, -4, 0], Chest: [18, -6, 0], Neck: [8, -2, 0], Head: [14, -4, 0],
        UpArmL: [-46, 16, 26], LoArmL: [-58, 20, 0], HandL: [-30, 50, 0],
        UpArmR: [-44, -14, -28], LoArmR: [-60, -18, 0], HandR: [-30, -50, 0],
        ThighL: [-24, -8, 6], ShinL: [30, 0, 0], FootL: [4, -14, 0],
        ThighR: [18, 10, -6], ShinR: [32, 0, 0], FootR: [10, 12, 0]
      }),
      // a slow shift of weight from knuckle to knuckle. It is the only thing
      // he does at rest and it takes over a second.
      K(0.9, {
        Hips_pos: [0.020, -0.168, 0.030], Hips: [0, 16, 0], Chest: [20, -8, 0],
        UpArmL: [-52, 18, 28], LoArmL: [-52, 22, 0],
        UpArmR: [-38, -12, -26], LoArmR: [-66, -16, 0], Head: [15, -6, 0]
      }),
      K(1.6, {
        Hips_pos: [-0.020, -0.168, 0.030], Hips: [0, 8, 0], Chest: [20, -4, 0],
        UpArmL: [-38, 14, 24], LoArmL: [-66, 18, 0],
        UpArmR: [-52, -16, -30], LoArmR: [-52, -20, 0], Head: [15, -2, 0]
      }),
      K(2.2, {})
    ]
  },

  walkGor: {
    dur: 1.06, loop: true, keys: [
      K(0, { Hips_pos: [0.016, -0.170, 0.030], Hips: [0, 15, 0], Spine: [24, -4, 0], Chest: [19, -6, 0], Head: [15, -4, 0], ThighL: [-24, -8, 6], ShinL: [22, 0, 0], FootL: [-4, -14, 0], ThighR: [18, 10, -6], ShinR: [28, 0, 0], FootR: [12, 12, 0], UpArmL: [-56, 16, 26], LoArmL: [-48, 20, 0], UpArmR: [-32, -14, -28], LoArmR: [-70, -18, 0] }),
      K(0.265, { ThighL: [-4, -8, 6], ShinL: [26, 0, 0], ThighR: [0, 10, -6], ShinR: [18, 0, 0], Hips_pos: [0, -0.146, 0.030] }),
      K(0.53, { Hips_pos: [-0.016, -0.170, 0.030], Hips: [0, 9, 0], Spine: [24, -4, 0], Chest: [19, -6, 0], Head: [15, -4, 0], ThighL: [20, -8, 6], ShinL: [28, 0, 0], FootL: [12, -14, 0], ThighR: [-24, 10, -6], ShinR: [22, 0, 0], FootR: [-4, 12, 0], UpArmL: [-32, 16, 24], LoArmL: [-70, 20, 0], UpArmR: [-56, -14, -30], LoArmR: [-48, -18, 0] }),
      K(0.795, { ThighL: [0, -8, 6], ShinL: [18, 0, 0], ThighR: [-4, 10, -6], ShinR: [26, 0, 0], Hips_pos: [0, -0.146, 0.030] }),
      K(1.06, { Hips_pos: [0.016, -0.170, 0.030], Hips: [0, 15, 0], ThighL: [-24, -8, 6], ShinL: [22, 0, 0], ThighR: [18, 10, -6], ShinR: [28, 0, 0], UpArmL: [-56, 16, 26], UpArmR: [-32, -14, -28] })
    ]
  },

  // A GORILLA DOES NOT RUN UPRIGHT. The cycle is a four-beat lope with the
  // knuckles genuinely reaching the floor on the down beats, which is what
  // makes 4.00 m/s look like an animal moving fast rather than a man moving
  // slowly.
  runGor: {
    dur: 0.66, loop: true, keys: [
      K(0, { Hips_pos: [0, -0.176, 0.070], Hips: [8, 12, 0], Spine: [34, -4, 0], Chest: [24, -6, 0], Head: [18, -4, 0], ThighL: [-44, -8, 6], ShinL: [30, 0, 0], ThighR: [26, 10, -6], ShinR: [48, 0, 0], UpArmL: [-88, 14, 22], LoArmL: [-24, 16, 0], UpArmR: [-30, -12, -26], LoArmR: [-64, -16, 0] }),
      K(0.165, { Hips_pos: [0, -0.210, 0.070], Hips: [12, 12, 0], Spine: [38, -4, 0], ThighL: [-14, -8, 6], ShinL: [40, 0, 0], ThighR: [-8, 10, -6], ShinR: [40, 0, 0], UpArmL: [-104, 14, 20], LoArmL: [-12, 16, 0], UpArmR: [-96, -12, -22], LoArmR: [-16, -16, 0] }),
      K(0.33, { Hips_pos: [0, -0.176, 0.070], Hips: [8, 12, 0], Spine: [34, -4, 0], Chest: [24, -6, 0], Head: [18, -4, 0], ThighL: [26, -8, 6], ShinL: [48, 0, 0], ThighR: [-44, 10, -6], ShinR: [30, 0, 0], UpArmL: [-30, 14, 22], LoArmL: [-64, 16, 0], UpArmR: [-88, -12, -26], LoArmR: [-24, -16, 0] }),
      K(0.495, { Hips_pos: [0, -0.210, 0.070], Hips: [12, 12, 0], Spine: [38, -4, 0], ThighL: [-8, -8, 6], ShinL: [40, 0, 0], ThighR: [-14, 10, -6], ShinR: [40, 0, 0], UpArmL: [-96, 14, 20], UpArmR: [-104, -12, -22] }),
      K(0.66, { Hips_pos: [0, -0.176, 0.070], Hips: [8, 12, 0], Spine: [34, -4, 0], ThighL: [-44, -8, 6], ShinL: [30, 0, 0], ThighR: [26, 10, -6], ShinR: [48, 0, 0], UpArmL: [-88, 14, 22], UpArmR: [-30, -12, -26] })
    ]
  },

  // Not a dash — a LUNGE off both knuckles. He does not have a dash in him.
  dashGor: {
    dur: 0.40, loop: false, keys: [
      K(0, {}),
      K(0.10, { Hips_pos: [0, -0.230, 0.090], Hips: [14, 12, 0], Spine: [40, -4, 0], Chest: [26, -6, 0], ThighL: [-40, -8, 6], ShinL: [44, 0, 0], ThighR: [24, 10, -6], ShinR: [50, 0, 0], UpArmL: [-104, 14, 22], LoArmL: [-16, 16, 0], UpArmR: [-100, -12, -24], LoArmR: [-18, -16, 0] }, 'out'),
      K(0.40, { Hips_pos: [0, -0.186, 0.056], Hips: [8, 12, 0], Spine: [30, -4, 0], ThighL: [-30, -8, 6], ShinL: [34, 0, 0], ThighR: [18, 10, -6], ShinR: [38, 0, 0], UpArmL: [-72, 14, 24], UpArmR: [-68, -12, -26] })
    ]
  },

  blockGor: {
    dur: 0.20, loop: false, keys: [
      K(0, {}),
      K(0.15, { UpArmL: [-70, 30, 12], LoArmL: [-126, 36, 0], HandL: [-24, 100, 0], UpArmR: [-64, -26, -14], LoArmR: [-132, -34, 0], HandR: [-24, -100, 0], Spine: [26, -4, 0], Chest: [22, -6, 0], Head: [20, -4, 0], Hips_pos: [0, -0.196, 0.024], ThighL: [-30, -8, 6], ShinL: [36, 0, 0], ThighR: [24, 10, -6], ShinR: [38, 0, 0] }, 'out'),
      K(0.20, { UpArmL: [-70, 30, 12], LoArmL: [-126, 36, 0], UpArmR: [-64, -26, -14], LoArmR: [-132, -34, 0], Hips_pos: [0, -0.196, 0.024] })
    ]
  },

  // THE STRING. Overhand hammer, back fist, and a two-handed uproot that
  // launches. Every one of them starts at the FLOOR — the hips drop on the
  // anticipation key and the blow follows the ground up.
  punch1Gor: {
    dur: 0.56, loop: false, keys: [
      K(0, {}),
      K(0.11, { Hips_pos: [0, -0.216, 0.010], Hips: [0, 28, 0], Chest: [16, -20, 0], UpArmR: [-148, -14, -22], LoArmR: [-34, -18, 0], HandR: [-24, -70, 0], ThighL: [-30, -8, 6], ShinL: [38, 0, 0] }, 'in'),
      K(0.19, { Hips_pos: [0, -0.150, 0.070], Hips: [0, -2, 0], Chest: [30, 6, 0], Spine: [32, 4, 0], Head: [22, 2, 0], UpArmR: [-16, 2, -14], LoArmR: [-30, -6, 0], HandR: [-30, -110, 0], UpArmL: [-30, 14, 24], ThighR: [30, 10, -6] }, 'snap'),
      K(0.28, { Hips_pos: [0, -0.156, 0.058], Chest: [28, 4, 0], UpArmR: [-22, 2, -16], LoArmR: [-38, -8, 0] }, 'hold'),
      K(0.56, {})
    ]
  },

  punch2Gor: {
    dur: 0.60, loop: false, keys: [
      K(0, {}),
      K(0.12, { Hips_pos: [-0.016, -0.212, 0.010], Hips: [0, -18, 0], Chest: [18, 26, 0], Spine: [20, 16, 0], UpArmL: [-40, 34, 14], LoArmL: [-108, 40, 0], HandL: [-24, 120, 0] }, 'in'),
      K(0.20, { Hips_pos: [0.018, -0.152, 0.062], Hips: [0, 40, 0], Chest: [26, -24, 0], Spine: [28, -14, 0], Head: [20, -16, 0], UpArmL: [-72, -12, 28], LoArmL: [-22, -10, 0], HandL: [-24, 40, 0], UpArmR: [-26, -12, -24] }, 'snap'),
      K(0.30, { Hips: [0, 34, 0], Chest: [24, -20, 0], UpArmL: [-64, -10, 30], LoArmL: [-32, -12, 0], Hips_pos: [0.014, -0.158, 0.052] }, 'hold'),
      K(0.60, {})
    ]
  },

  punch3Gor: {
    dur: 0.76, loop: false, keys: [
      K(0, {}),
      // both hands to the floor, and then the whole animal comes up
      K(0.14, { Hips_pos: [0, -0.250, 0.060], Hips: [16, 12, 0], Spine: [46, -4, 0], Chest: [30, -6, 0], Head: [26, -4, 0], UpArmL: [-120, 16, 16], LoArmL: [-12, 18, 0], UpArmR: [-118, -14, -18], LoArmR: [-14, -16, 0], ThighL: [-46, -8, 6], ShinL: [56, 0, 0], ThighR: [-38, 10, -6], ShinR: [54, 0, 0] }, 'in'),
      K(0.25, { Hips_pos: [0, 0.020, 0.024], Hips: [-6, 12, -4], Spine: [-16, -4, 0], Chest: [-14, -6, 0], Head: [-16, -4, 0], UpArmL: [-166, 8, 26], LoArmL: [-10, 6, 0], UpArmR: [-164, -6, -28], LoArmR: [-12, -6, 0], ThighL: [-12, -8, 6], ShinL: [8, 0, 0], ThighR: [-4, 10, -6], ShinR: [10, 0, 0] }, 'snap'),
      K(0.36, { Hips_pos: [0, 0.006, 0.020], Chest: [-10, -6, 0], UpArmL: [-156, 8, 26], UpArmR: [-154, -6, -28] }, 'hold'),
      K(0.76, {})
    ]
  },

  heavyGor: {
    dur: 1.06, loop: false, keys: [
      K(0, {}),
      // MOUNTAIN FIST. Both fists over the head, and a long hold on it — this
      // is a 21-frame startup and the animation has to sell every one of them.
      K(0.22, { Hips_pos: [0, -0.120, -0.030], Hips: [0, 14, 0], Spine: [-16, -4, 0], Chest: [-14, -6, 0], Head: [-14, -4, 0], UpArmL: [-170, 10, 22], LoArmL: [-16, 8, 0], UpArmR: [-168, -8, -24], LoArmR: [-18, -8, 0], ThighL: [-20, -8, 6], ShinL: [22, 0, 0] }, 'in'),
      K(0.36, { Hips_pos: [0, -0.116, -0.034], Spine: [-18, -4, 0], UpArmL: [-174, 10, 22], UpArmR: [-172, -8, -24] }, 'hold'),
      K(0.44, { Hips_pos: [0, -0.230, 0.086], Hips: [10, 12, 0], Spine: [46, -4, 0], Chest: [30, -6, 0], Head: [26, -4, 0], UpArmL: [-16, 12, 20], LoArmL: [-14, 10, 0], UpArmR: [-14, -10, -22], LoArmR: [-16, -10, 0], ThighL: [-44, -8, 6], ShinL: [50, 0, 0], ThighR: [32, 10, -6], ShinR: [48, 0, 0] }, 'snap'),
      K(0.58, { Hips_pos: [0, -0.236, 0.076], Spine: [44, -4, 0], UpArmL: [-14, 12, 20], UpArmR: [-12, -10, -22] }, 'hold'),
      K(1.06, {})
    ]
  },

  // GORILLA · UNBLOCKABLE DRUMMING BEAT. He rises, and then both fists come
  // down on his own chest, twice, fast. The rise is the tell and the two
  // impacts are the technique.
  ct1Gor: {
    dur: 0.84, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips_pos: [0, -0.070, -0.020], Hips: [0, 14, 0], Spine: [-14, -4, 0], Chest: [-16, -6, 0], Head: [-18, -4, 0], UpArmL: [-140, 22, 34], LoArmL: [-70, 26, 0], UpArmR: [-138, -20, -36], LoArmR: [-72, -24, 0] }, 'in'),
      // BEAT ONE
      K(0.245, { Hips_pos: [0, -0.100, 0.006], Chest: [-4, -6, 0], UpArmL: [-104, 16, 12], LoArmL: [-124, 20, 0], HandL: [-20, 96, 0], UpArmR: [-102, -14, -14], LoArmR: [-126, -18, 0], HandR: [-20, -96, 0] }, 'snap'),
      K(0.30, { UpArmL: [-124, 20, 26], LoArmL: [-92, 24, 0], UpArmR: [-122, -18, -28], LoArmR: [-94, -22, 0], Chest: [-10, -6, 0] }),
      // BEAT TWO — harder, and the hips drop into it
      K(0.36, { Hips_pos: [0, -0.150, 0.012], Chest: [2, -6, 0], Spine: [8, -4, 0], UpArmL: [-100, 14, 8], LoArmL: [-130, 18, 0], UpArmR: [-98, -12, -10], LoArmR: [-132, -16, 0], Head: [-8, -4, 0] }, 'snap'),
      K(0.46, { Hips_pos: [0, -0.156, 0.008], Chest: [0, -6, 0], UpArmL: [-96, 14, 10], UpArmR: [-94, -12, -12] }, 'hold'),
      K(0.84, {})
    ]
  },

  // GORILLA · SLAM. The overhead, and the longest windup in his set.
  ct2Gor: {
    dur: 1.14, loop: false, keys: [
      K(0, {}),
      K(0.26, { Hips_pos: [0, -0.100, -0.044], Hips: [0, 22, 0], Spine: [-22, -4, 0], Chest: [-20, -6, 0], Head: [-20, -4, 0], UpArmL: [-176, 8, 18], LoArmL: [-10, 6, 0], UpArmR: [-174, -6, -20], LoArmR: [-12, -6, 0], ThighL: [-16, -8, 6], ShinL: [18, 0, 0], ThighR: [-8, 10, -6], ShinR: [16, 0, 0] }, 'in'),
      K(0.42, { Hips_pos: [0, -0.096, -0.048], Spine: [-24, -4, 0], UpArmL: [-180, 8, 18], UpArmR: [-178, -6, -20] }, 'hold'),
      K(0.50, { Hips_pos: [0, -0.256, 0.106], Hips: [14, 12, 0], Spine: [52, -4, 0], Chest: [34, -6, 0], Head: [30, -4, 0], UpArmL: [-8, 10, 16], LoArmL: [-10, 8, 0], UpArmR: [-6, -8, -18], LoArmR: [-12, -8, 0], ThighL: [-50, -8, 6], ShinL: [58, 0, 0], ThighR: [36, 10, -6], ShinR: [54, 0, 0] }, 'snap'),
      K(0.66, { Hips_pos: [0, -0.262, 0.098], Spine: [50, -4, 0], UpArmL: [-6, 10, 16], UpArmR: [-4, -8, -18] }, 'hold'),
      K(1.14, {})
    ]
  },

  // ======================================================================
  // 3 · TRICERATOPS — low, forward, all horn
  // ======================================================================
  // Narrow where the other two are wide, head-led where Gorilla is hip-led.
  // The arms are pulled IN and back out of the way, because on this body they
  // are not what he fights with.
  idleTri: {
    dur: 1.5, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.096, 0.044], Hips: [0, 24, 0],
        Spine: [24, -6, 0], Chest: [18, -8, 0], Neck: [10, -3, 0], Head: [18, -6, 0],
        UpArmL: [-16, 18, 10], LoArmL: [-108, 26, 0], HandL: [-14, 66, 0],
        UpArmR: [-14, -16, -12], LoArmR: [-110, -24, 0], HandR: [-14, -66, 0],
        ThighL: [-20, -4, 2], ShinL: [24, 0, 0], FootL: [4, -10, 0],
        ThighR: [14, 6, -2], ShinR: [26, 0, 0], FootR: [8, 8, 0]
      }),
      // a quick head bob — she is always sighting the target
      K(0.34, { Head: [24, -10, 0], Neck: [12, -5, 0], Chest: [20, -10, 0], Hips_pos: [0, -0.104, 0.050] }),
      K(0.62, { Head: [15, -3, 0], Neck: [8, -1, 0], Chest: [17, -6, 0], Hips_pos: [0, -0.090, 0.040] }),
      K(0.95, { Head: [22, -8, 0], Chest: [19, -9, 0], Hips_pos: [0, -0.100, 0.048], ThighL: [-23, -4, 2], ThighR: [16, 6, -2] }),
      K(1.25, { Head: [16, -4, 0], Chest: [18, -7, 0], Hips_pos: [0, -0.092, 0.042] }),
      K(1.5, {})
    ]
  },

  walkTri: {
    dur: 0.66, loop: true, keys: [
      K(0, { ThighL: [-26, -4, 2], ShinL: [16, 0, 0], FootL: [-6, -10, 0], ThighR: [20, 6, -2], ShinR: [26, 0, 0], FootR: [12, 8, 0], Hips_pos: [0, -0.100, 0.044], Head: [20, -6, 0], Spine: [25, -6, 0] }),
      K(0.165, { ThighL: [-4, -4, 2], ShinL: [22, 0, 0], ThighR: [2, 6, -2], ShinR: [14, 0, 0], Hips_pos: [0, -0.078, 0.048], Head: [17, -6, 0] }),
      K(0.33, { ThighL: [22, -4, 2], ShinL: [26, 0, 0], FootL: [10, -10, 0], ThighR: [-26, 6, -2], ShinR: [16, 0, 0], FootR: [-6, 8, 0], Hips_pos: [0, -0.100, 0.044], Head: [20, -6, 0], Spine: [25, -6, 0] }),
      K(0.495, { ThighL: [2, -4, 2], ShinL: [18, 0, 0], ThighR: [-4, 6, -2], ShinR: [22, 0, 0], Hips_pos: [0, -0.078, 0.048], Head: [17, -6, 0] }),
      K(0.66, { ThighL: [-26, -4, 2], ShinL: [16, 0, 0], ThighR: [20, 6, -2], ShinR: [26, 0, 0], Hips_pos: [0, -0.100, 0.044] })
    ]
  },

  // THE FASTEST CYCLE IN HIS KIT and it is head-first: the neck leads, the
  // shoulders follow, the legs are a blur underneath.
  runTri: {
    dur: 0.40, loop: true, keys: [
      K(0, { Spine: [34, -5, 0], Chest: [24, -7, 0], Head: [26, -5, 0], Hips: [4, 22, 0], ThighL: [-56, -4, 2], ShinL: [24, 0, 0], FootL: [-14, -8, 0], ThighR: [38, 6, -2], ShinR: [68, 0, 0], FootR: [30, 8, 0], UpArmL: [-24, 16, 12], LoArmL: [-104, 22, 0], UpArmR: [-58, -14, -14], LoArmR: [-90, -20, 0], Hips_pos: [0, -0.086, 0.052] }),
      K(0.10, { Spine: [32, -5, 0], ThighL: [-10, -4, 2], ShinL: [30, 0, 0], ThighR: [-14, 6, -2], ShinR: [42, 0, 0], Hips_pos: [0, -0.124, 0.052] }),
      K(0.20, { Spine: [34, -5, 0], Chest: [24, -7, 0], Head: [26, -5, 0], Hips: [4, 22, 0], ThighL: [38, -4, 2], ShinL: [68, 0, 0], FootL: [30, -8, 0], ThighR: [-56, 6, -2], ShinR: [24, 0, 0], FootR: [-14, 8, 0], UpArmL: [-58, 16, 12], LoArmL: [-90, 22, 0], UpArmR: [-24, -14, -14], LoArmR: [-104, -20, 0], Hips_pos: [0, -0.086, 0.052] }),
      K(0.30, { Spine: [32, -5, 0], ThighL: [-14, -4, 2], ShinL: [42, 0, 0], ThighR: [-10, 6, -2], ShinR: [30, 0, 0], Hips_pos: [0, -0.124, 0.052] }),
      K(0.40, { Spine: [34, -5, 0], Chest: [24, -7, 0], ThighL: [-56, -4, 2], ShinL: [24, 0, 0], ThighR: [38, 6, -2], ShinR: [68, 0, 0], UpArmL: [-24, 16, 12], UpArmR: [-58, -14, -14], Hips_pos: [0, -0.086, 0.052] })
    ]
  },

  dashTri: {
    dur: 0.26, loop: false, keys: [
      K(0, {}),
      K(0.05, { Spine: [40, -5, 0], Chest: [26, -7, 0], Head: [30, -5, 0], Hips_pos: [0, -0.140, 0.086], ThighL: [-58, -4, 2], ShinL: [34, 0, 0], ThighR: [38, 6, -2], ShinR: [62, 0, 0], UpArmL: [16, 18, 16], LoArmL: [-52, 20, 0], UpArmR: [20, -16, -18], LoArmR: [-48, -18, 0] }, 'snap'),
      K(0.26, { Spine: [30, -5, 0], Chest: [21, -7, 0], Hips_pos: [0, -0.110, 0.064], ThighL: [-42, -4, 2], ShinL: [28, 0, 0], ThighR: [26, 6, -2], ShinR: [46, 0, 0], UpArmL: [4, 17, 13], UpArmR: [8, -15, -15] })
    ]
  },

  blockTri: {
    dur: 0.16, loop: false, keys: [
      K(0, {}),
      // she does not raise her arms — she puts the FRILL in the way. The head
      // comes down and forward and the shoulders come up behind it.
      K(0.12, { Head: [40, -4, 0], Neck: [18, -2, 0], Chest: [28, -8, 0], Spine: [32, -6, 0], UpArmL: [-40, 24, 18], LoArmL: [-118, 30, 0], UpArmR: [-38, -22, -20], LoArmR: [-120, -28, 0], Hips_pos: [0, -0.130, 0.058], ThighL: [-26, -4, 2], ShinL: [30, 0, 0] }, 'out'),
      K(0.16, { Head: [40, -4, 0], Chest: [28, -8, 0], UpArmL: [-40, 24, 18], UpArmR: [-38, -22, -20], Hips_pos: [0, -0.130, 0.058] })
    ]
  },

  // THE STRING. Three short horn strikes, all led by the head — a jab, a hook
  // across, and a lift that tosses. Nothing here uses the arms as weapons.
  punch1Tri: {
    dur: 0.28, loop: false, keys: [
      K(0, {}),
      K(0.05, { Head: [8, -8, 0], Neck: [2, -4, 0], Chest: [12, -10, 0], Hips_pos: [0, -0.086, 0.030] }, 'in'),
      K(0.10, { Head: [34, -2, 0], Neck: [16, -1, 0], Chest: [30, -4, 0], Spine: [34, -3, 0], Hips_pos: [0, -0.098, 0.098] }, 'snap'),
      K(0.15, { Head: [30, -3, 0], Chest: [27, -5, 0], Hips_pos: [0, -0.098, 0.082] }, 'hold'),
      K(0.28, {})
    ]
  },

  punch2Tri: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.05, { Head: [14, 20, 0], Neck: [6, 10, 0], Hips: [0, 4, 0], Chest: [16, 12, 0] }, 'in'),
      K(0.11, { Head: [30, -26, 0], Neck: [14, -12, 0], Hips: [0, 42, 0], Chest: [28, -20, 0], Spine: [32, -12, 0], Hips_pos: [0.012, -0.098, 0.086] }, 'snap'),
      K(0.17, { Head: [27, -22, 0], Hips: [0, 36, 0], Chest: [25, -17, 0], Hips_pos: [0.010, -0.098, 0.074] }, 'hold'),
      K(0.30, {})
    ]
  },

  punch3Tri: {
    dur: 0.42, loop: false, keys: [
      K(0, {}),
      K(0.07, { Head: [38, -6, 0], Neck: [18, -3, 0], Spine: [40, -6, 0], Chest: [32, -8, 0], Hips_pos: [0, -0.150, 0.058], ThighL: [-32, -4, 2], ShinL: [38, 0, 0] }, 'in'),
      // the toss: head snaps UP and the whole body follows it
      K(0.135, { Head: [-32, -4, 0], Neck: [-16, -2, 0], Spine: [-14, -4, 0], Chest: [-16, -6, 0], Hips_pos: [0, 0.014, 0.052], ThighL: [-12, -4, 2], ShinL: [8, 0, 0], ThighR: [-4, 6, -2], ShinR: [10, 0, 0], UpArmL: [-60, 20, 26], UpArmR: [-58, -18, -28] }, 'snap'),
      K(0.21, { Head: [-26, -4, 0], Spine: [-10, -4, 0], Hips_pos: [0, 0.004, 0.044] }, 'hold'),
      K(0.42, {})
    ]
  },

  heavyTri: {
    dur: 0.78, loop: false, keys: [
      K(0, {}),
      K(0.15, { Head: [-24, -6, 0], Neck: [-12, -3, 0], Spine: [-6, -6, 0], Chest: [-10, -8, 0], Hips_pos: [0, -0.060, -0.010] }, 'in'),
      K(0.24, { Head: [46, -4, 0], Neck: [22, -2, 0], Spine: [44, -5, 0], Chest: [34, -7, 0], Hips_pos: [0, -0.150, 0.120], ThighL: [-44, -4, 2], ShinL: [40, 0, 0], ThighR: [30, 6, -2], ShinR: [42, 0, 0], UpArmL: [-30, 20, 18], UpArmR: [-28, -18, -20] }, 'snap'),
      K(0.34, { Head: [42, -4, 0], Spine: [40, -5, 0], Hips_pos: [0, -0.154, 0.104] }, 'hold'),
      K(0.78, {})
    ]
  },

  // TRICERATOPS · GORE CHARGE. Head down, and then fourteen active frames of
  // actually travelling. The clip holds the charging pose for most of its
  // length because that is what the move is.
  ct1Tri: {
    dur: 0.76, loop: false, keys: [
      K(0, {}),
      K(0.10, { Head: [46, -4, 0], Neck: [22, -2, 0], Spine: [46, -6, 0], Chest: [36, -8, 0], Hips_pos: [0, -0.170, 0.070], ThighL: [-40, -4, 2], ShinL: [46, 0, 0], ThighR: [30, 6, -2], ShinR: [44, 0, 0], UpArmL: [-6, 20, 14], LoArmL: [-116, 24, 0], UpArmR: [-4, -18, -16], LoArmR: [-118, -22, 0] }, 'in'),
      K(0.19, { Head: [52, -4, 0], Spine: [50, -6, 0], Chest: [38, -8, 0], Hips_pos: [0, -0.156, 0.130], ThighL: [-52, -4, 2], ShinL: [30, 0, 0], ThighR: [36, 6, -2], ShinR: [56, 0, 0] }, 'out'),
      // the run-through, two strides, held low
      K(0.31, { Hips_pos: [0, -0.150, 0.130], ThighL: [36, -4, 2], ShinL: [56, 0, 0], ThighR: [-52, 6, -2], ShinR: [30, 0, 0], Head: [52, -4, 0] }),
      K(0.43, { Hips_pos: [0, -0.156, 0.130], ThighL: [-52, -4, 2], ShinL: [30, 0, 0], ThighR: [36, 6, -2], ShinR: [56, 0, 0], Head: [52, -4, 0] }),
      K(0.55, { Hips_pos: [0, -0.150, 0.130], ThighL: [36, -4, 2], ShinL: [56, 0, 0], ThighR: [-52, 6, -2], ShinR: [30, 0, 0], Head: [50, -4, 0] }),
      K(0.76, {})
    ]
  },

  // TRICERATOPS · CREST ROLL. A backward shoulder roll behind the frill, and
  // the invulnerable frames are the middle of it.
  ct2Tri: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.06, { Head: [34, -6, 0], Spine: [34, -6, 0], Chest: [26, -8, 0], Hips_pos: [0, -0.150, 0.020], ThighL: [-34, -4, 2], ShinL: [42, 0, 0], ThighR: [26, 6, -2], ShinR: [40, 0, 0] }, 'in'),
      // tucked and airborne, spun about the hips
      K(0.16, { Hips: [-72, 24, 0], Head: [30, -6, 0], Spine: [36, -6, 0], Chest: [28, -8, 0], ThighL: [-84, -4, 2], ShinL: [92, 0, 0], ThighR: [-78, 6, -2], ShinR: [88, 0, 0], UpArmL: [-40, 24, 14], LoArmL: [-126, 28, 0], UpArmR: [-38, -22, -16], LoArmR: [-128, -26, 0], Hips_pos: [0, -0.180, -0.040] }, 'out'),
      K(0.26, { Hips: [-16, 24, 0], Head: [24, -6, 0], ThighL: [-46, -4, 2], ShinL: [50, 0, 0], ThighR: [-30, 6, -2], ShinR: [46, 0, 0], Hips_pos: [0, -0.140, -0.030] }),
      K(0.46, {})
    ]
  },

  // ======================================================================
  // 4 · THE SHARED ONES
  // ======================================================================
  // THE SWAP. 26 frames, no armour, no cancel — and the animation has to make
  // that legible, so it is one big open gesture rather than a quick shrug. He
  // plants, throws his head back, and the core changes at the halfway point
  // (which is where the fighter actually swaps it, so the pose and the rule
  // agree).
  swap: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.10, { Hips_pos: [0, -0.130, -0.020], Spine: [-12, -5, 0], Chest: [-14, -7, 0], Head: [-16, -5, 0], Neck: [-8, -3, 0], UpArmL: [-56, 26, 40], LoArmL: [-80, 30, 0], UpArmR: [-54, -24, -42], LoArmR: [-82, -28, 0], ThighL: [-24, -6, 4], ShinL: [30, 0, 0], ThighR: [18, 8, -4], ShinR: [30, 0, 0] }, 'in'),
      // THE MOMENT — arms flung wide, chest open, head all the way back. This
      // key sits at the frame the core actually changes.
      K(0.22, { Hips_pos: [0, -0.056, 0.010], Spine: [-26, -5, 0], Chest: [-28, -7, 0], Head: [-34, -5, 0], Neck: [-16, -3, 0], UpArmL: [-96, 12, 74], LoArmL: [-16, 8, 0], HandL: [-10, 30, 0], UpArmR: [-94, -10, -76], LoArmR: [-18, -8, 0], HandR: [-10, -30, 0], ThighL: [-14, -6, 4], ShinL: [12, 0, 0], ThighR: [8, 8, -4], ShinR: [14, 0, 0] }, 'snap'),
      K(0.30, { Hips_pos: [0, -0.062, 0.006], Spine: [-22, -5, 0], Chest: [-24, -7, 0], Head: [-28, -5, 0], UpArmL: [-88, 12, 68], UpArmR: [-86, -10, -70] }, 'hold'),
      K(0.44, {})
    ]
  },

  // A CORE HAS BEEN DESTROYED. Not a hit reaction — a SYSTEM FAILURE. He is
  // thrown sideways, one arm clutches the chest, and he comes back up
  // fractionally wrong. It runs 40 frames and it deliberately does not settle
  // into neutral at the end, because he is not the same fighter any more.
  coreBreak: {
    dur: 0.70, loop: false, keys: [
      K(0, {}),
      K(0.06, { Hips_pos: [0.030, -0.110, -0.030], Hips: [0, 34, 0], Spine: [-18, -8, 0], Chest: [-22, -14, 0], Head: [-26, -16, 4], Neck: [-12, -6, 0], UpArmL: [-104, 18, 52], LoArmL: [-30, 14, 0], UpArmR: [-40, -20, -18], LoArmR: [-118, -26, 0], HandR: [-24, -70, 0], ThighL: [-34, -8, 6], ShinL: [30, 0, 0], ThighR: [24, 10, -6], ShinR: [34, 0, 0] }, 'snap'),
      K(0.18, { Hips_pos: [0.024, -0.150, -0.020], Hips: [0, 30, 0], Chest: [-18, -12, 0], Head: [-20, -14, 3], UpArmL: [-92, 18, 46], UpArmR: [-44, -20, -20], LoArmR: [-112, -26, 0] }, 'hold'),
      // the shudder
      K(0.30, { Hips_pos: [-0.014, -0.170, 0.010], Hips: [0, 10, 0], Spine: [16, -6, 0], Chest: [12, -8, 0], Head: [16, -4, 0], UpArmL: [-52, 16, 30], LoArmL: [-76, 20, 0], UpArmR: [-50, -14, -32], LoArmR: [-78, -18, 0], ThighL: [-26, -8, 6], ShinL: [34, 0, 0] }),
      K(0.44, { Hips_pos: [0.008, -0.140, 0.020], Hips: [0, 20, 0], Spine: [10, -6, 0], Chest: [6, -8, 0], Head: [8, -6, 0], UpArmL: [-34, 12, 30], UpArmR: [-32, -10, -32] }),
      K(0.70, {})
    ]
  },

  // THE ULTIMATE. All three cores at once, so the cast is all three postures
  // in sequence — panda, gorilla, triceratops — and then he settles into the
  // gorilla-forward one the `all` stance actually uses.
  ult: {
    dur: 1.50, loop: false, keys: [
      K(0, {}),
      K(0.13, { Hips_pos: [0, -0.120, -0.020], Spine: [-16, -5, 0], Chest: [-18, -7, 0], Head: [-20, -5, 0], UpArmL: [-70, 22, 46], LoArmL: [-60, 26, 0], UpArmR: [-68, -20, -48], LoArmR: [-62, -24, 0] }, 'in'),
      // PANDA
      K(0.30, { Hips_pos: [0, -0.070, 0.010], Spine: [5, -5, 0], Chest: [4, -7, 0], Head: [1, -5, 0], UpArmL: [-16, 8, 30], LoArmL: [-72, 22, 0], UpArmR: [-14, -6, -32], LoArmR: [-76, -20, 0] }, 'snap'),
      // GORILLA
      K(0.46, { Hips_pos: [0, -0.190, 0.040], Hips: [8, 12, 0], Spine: [32, -4, 0], Chest: [24, -6, 0], Head: [20, -4, 0], UpArmL: [-72, 16, 22], LoArmL: [-40, 20, 0], UpArmR: [-70, -14, -24], LoArmR: [-42, -18, 0], ThighL: [-30, -8, 6], ShinL: [36, 0, 0], ThighR: [24, 10, -6], ShinR: [36, 0, 0] }, 'snap'),
      // TRICERATOPS
      K(0.62, { Hips_pos: [0, -0.110, 0.070], Hips: [0, 24, 0], Spine: [36, -6, 0], Chest: [26, -8, 0], Head: [30, -6, 0], Neck: [14, -3, 0], UpArmL: [-14, 18, 10], LoArmL: [-112, 26, 0], UpArmR: [-12, -16, -12], LoArmR: [-114, -24, 0], ThighL: [-22, -4, 2], ShinL: [26, 0, 0], ThighR: [16, 6, -2], ShinR: [28, 0, 0] }, 'snap'),
      // ALL THREE — and he stands up into it, which is the only time in the
      // whole set that this character comes fully upright
      K(0.86, { Hips_pos: [0, -0.030, 0.020], Hips: [0, 14, 0], Spine: [-8, -5, 0], Chest: [-10, -7, 0], Head: [-14, -5, 0], Neck: [-6, -3, 0], UpArmL: [-52, 16, 56], LoArmL: [-40, 18, 0], UpArmR: [-50, -14, -58], LoArmR: [-42, -16, 0], ThighL: [-12, -6, 4], ShinL: [10, 0, 0], ThighR: [6, 8, -4], ShinR: [12, 0, 0] }, 'out'),
      K(1.10, { Hips_pos: [0, -0.036, 0.024], Spine: [-6, -5, 0], Chest: [-8, -7, 0], Head: [-12, -5, 0], UpArmL: [-48, 16, 52], UpArmR: [-46, -14, -54] }, 'hold'),
      K(1.50, {})
    ]
  },

  // ---- TAUNT --------------------------------------------------------------
  // He is the funniest character in the roster and the animation knows it
  // WITHOUT undercutting that he is dangerous — which is a real constraint and
  // it is solved by making the joke a PHYSICAL one at his own expense rather
  // than a mocking gesture at the opponent. He crosses his arms, gives a
  // completely earnest little nod, and then — because he is a bear and the
  // centre of mass is wrong — has to take a small step to stop toppling
  // forward. He recovers with perfect dignity and does not acknowledge it.
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // ARMS CROSSED, chin up, absolutely serious
      K(0.42, {
        UpArmL: [-64, 30, 20], LoArmL: [-132, 40, 0], HandL: [-16, 74, 0],
        UpArmR: [-62, -28, -22], LoArmR: [-134, -38, 0], HandR: [-16, -74, 0],
        Chest: [-6, -7, 0], Spine: [-2, -5, 0], Head: [-10, -5, 0], Neck: [-5, -3, 0],
        Hips_pos: [0, -0.058, -0.006]
      }, 'out'),
      // THE NOD. One, slow, and entirely sincere.
      K(0.92, { Head: [14, -5, 0], Neck: [7, -3, 0], Chest: [-2, -7, 0] }),
      K(1.16, { Head: [-12, -5, 0], Neck: [-6, -3, 0], Chest: [-7, -7, 0] }),
      // ...and the mass keeps going. He pitches forward.
      K(1.42, {
        Spine: [22, -5, 0], Chest: [16, -7, 0], Head: [10, -5, 0],
        Hips_pos: [0, -0.070, 0.070], ThighL: [-30, -6, 4], ShinL: [10, 0, 0]
      }, 'out'),
      // THE STEP. One foot goes out to catch it, arms still crossed.
      K(1.62, {
        Spine: [14, -5, 0], Chest: [10, -7, 0], Head: [6, -5, 0],
        Hips_pos: [0.020, -0.092, 0.050],
        ThighL: [-46, -6, 4], ShinL: [24, 0, 0], FootL: [-10, -12, 0],
        ThighR: [26, 8, -4], ShinR: [30, 0, 0]
      }, 'snap'),
      // and back to standing as though nothing had happened
      K(2.10, {
        UpArmL: [-64, 30, 20], LoArmL: [-132, 40, 0],
        UpArmR: [-62, -28, -22], LoArmR: [-134, -38, 0],
        Spine: [-2, -5, 0], Chest: [-6, -7, 0], Head: [-10, -5, 0],
        Hips_pos: [0, -0.058, -0.006],
        ThighL: [-14, -6, 4], ShinL: [16, 0, 0], ThighR: [10, 8, -4], ShinR: [20, 0, 0]
      }, 'out'),
      K(3.3, {})
    ]
  },

  // ---- VICTORY ------------------------------------------------------------
  // Both arms up, a genuinely delighted bounce, and then he remembers himself
  // and folds them again. Same joke, same dignity.
  victory: {
    dur: 2.6, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmL: [-158, 10, 44], LoArmL: [-20, 8, 0], UpArmR: [-156, -8, -46], LoArmR: [-22, -8, 0], Chest: [-14, -7, 0], Spine: [-8, -5, 0], Head: [-16, -5, 0], Hips_pos: [0, -0.020, 0] }, 'snap'),
      K(0.42, { Hips_pos: [0, -0.100, 0], ThighL: [-24, -6, 4], ShinL: [30, 0, 0], ThighR: [18, 8, -4], ShinR: [32, 0, 0], UpArmL: [-140, 10, 40], UpArmR: [-138, -8, -42], Chest: [-8, -7, 0] }),
      K(0.62, { Hips_pos: [0, 0.020, 0], ThighL: [-8, -6, 4], ShinL: [6, 0, 0], ThighR: [2, 8, -4], ShinR: [8, 0, 0], UpArmL: [-162, 10, 46], UpArmR: [-160, -8, -48], Chest: [-16, -7, 0] }, 'out'),
      K(0.84, { Hips_pos: [0, -0.092, 0], ThighL: [-22, -6, 4], ShinL: [28, 0, 0], ThighR: [16, 8, -4], ShinR: [30, 0, 0], UpArmL: [-144, 10, 42], UpArmR: [-142, -8, -44] }),
      // and folded again, chin up, as though he had not just done that
      K(1.30, { UpArmL: [-64, 30, 20], LoArmL: [-132, 40, 0], UpArmR: [-62, -28, -22], LoArmR: [-134, -38, 0], Chest: [-6, -7, 0], Head: [-10, -5, 0], Hips_pos: [0, -0.058, -0.006] }, 'out'),
      K(2.6, { UpArmL: [-64, 30, 20], LoArmL: [-132, 40, 0], UpArmR: [-62, -28, -22], LoArmR: [-134, -38, 0], Chest: [-6, -7, 0], Head: [-10, -5, 0], Hips_pos: [0, -0.058, -0.006] })
    ]
  }
};
