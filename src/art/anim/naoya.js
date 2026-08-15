// NAOYA ZENIN — the SNAP end of the roster, and the deliberate opposite of
// art/anim/geto.js in every choice below.
//
// THE ANIMATION BRIEF: "Naoya is the opposite: nothing in between poses, hard
// snaps, no easing." Plus, from the model brief: "Nothing in the game should
// move like he does — no motion blur, no interpolation. Hard steps."
//
// HOW THAT IS ACTUALLY ACHIEVED, because it is not a matter of taste:
//
//   The clip player supports four easings (art/anim/player.js), and one of
//   them is `hold`, defined as `t => (t >= 1 ? 1 : 0)`. That is a genuine STEP
//   function: the pose does not move at all until the destination key's time
//   is reached, and then it arrives in a single frame. Every other character
//   in the roster uses `hold` sparingly, for the freeze after an impact.
//
//   NAOYA USES IT AS HIS DEFAULT. Nearly every key in this file carries
//   `'hold'`, which means his body does not travel between poses — it EXISTS
//   at one pose, and then it exists at the next one. There is no in-between
//   frame to render, so there is nothing to blur and nothing to interpolate.
//   The result is that a 60 Hz renderer shows him at a handful of discrete
//   positions per action while everyone else is drawn continuously, and that
//   contrast is the visual identity of the character.
//
//   THE 24 FPS GRID. Where a step should read as "one frame of the technique"
//   the keys are placed on multiples of 1/24 s (0.0417) rather than on
//   arbitrary times, because his canon technique divides a second into
//   twenty-four frames and the animation should be drawn on the same grid the
//   mechanic is. See PROJECTION RUSH below, which is literally six positions
//   at 1/24 s apart.
//
//   WHAT IS *NOT* STEPPED. The idle, the walk and the run interpolate
//   normally. This is the whole reason the snapping lands: "movement is
//   unnervingly smooth between attacks and then instantaneous during them."
//   If everything stepped, nothing would.
import { STANCE as BASE } from './base.js';

const K = (t, pose, e) => ({ t, pose, e });

// ---- STANCE ---------------------------------------------------------------
// Relaxed, weight BACK on the rear foot, chin UP, front shoulder dropped, lead
// hand loose and low. This is not a guard; it is a man waiting to be
// disappointed. Compare Geto's stance, which is equally not-a-guard and reads
// as serenity — the difference is entirely in the head angle and the hips.
export const NAOYA_STANCE = {
  ...BASE,
  Hips_pos: [0, -0.052, -0.030],             // weight back
  Hips: [0, 34, 0],                          // strongly bladed — he presents an edge
  Spine: [-2, -10, 0], Chest: [-4, -14, 0], Neck: [-3, -4, 0],
  Head: [-9, -12, 0],                        // CHIN UP. This is the whole read.
  // lead (left) hand hangs loose and low; rear hand cocked but relaxed
  ClavL: [0, 0, 0], UpArmL: [-8, 10, 12], LoArmL: [-46, 20, 0], HandL: [-8, 30, 0],
  ClavR: [0, 0, 0], UpArmR: [-30, -12, -14], LoArmR: [-92, -30, 0], HandR: [-16, -60, 0],
  // rear leg loaded, front leg light — he is already leaving
  ThighL: [-24, -6, 0], ShinL: [16, 0, 0], FootL: [2, -14, 0],
  ThighR: [20, 8, 0], ShinR: [28, 0, 0], FootR: [14, 10, 0]
};

const S = NAOYA_STANCE;

export const NAOYA_CLIPS = {
  // IDLE — SMOOTH, on purpose. A slow easy sway with the weight rolling back
  // and forward. Nothing here steps, because the snapping only reads as
  // supernatural if his resting state is the most fluid on the roster.
  idle: {
    dur: 3.1, loop: true, keys: [
      K(0, {}),
      K(1.05, { Chest: [-5, -15, 0], Spine: [-3, -11, 0], Hips_pos: [0, -0.060, -0.034], Head: [-10, -10, 0], UpArmL: [-12, 11, 14], UpArmR: [-34, -13, -16] }),
      K(2.10, { Chest: [-3, -13, 0], Hips_pos: [0, -0.046, -0.026], Head: [-8, -14, 0], UpArmL: [-6, 9, 11], UpArmR: [-27, -11, -13] }),
      K(3.1, {})
    ]
  },

  // WALK — a loose, unhurried saunter. Long stride, low arm swing, shoulders
  // rolling. He is not in a hurry to get to you.
  walk: {
    dur: 0.92, loop: true, keys: [
      K(0, { ThighL: [-32, -6, 0], ShinL: [12, 0, 0], FootL: [-8, -14, 0], ThighR: [24, 8, 0], ShinR: [32, 0, 0], FootR: [14, 10, 0], Hips_pos: [0, -0.056, -0.026], UpArmL: [-24, 11, 14], UpArmR: [-40, -13, -16], Chest: [-4, -14, 0] }),
      K(0.23, { ThighL: [-6, -6, 0], ShinL: [22, 0, 0], ThighR: [4, 8, 0], ShinR: [16, 0, 0], Hips_pos: [0, -0.032, -0.020] }),
      K(0.46, { ThighL: [26, -6, 0], ShinL: [30, 0, 0], FootL: [12, -14, 0], ThighR: [-30, 8, 0], ShinR: [14, 0, 0], FootR: [-8, 10, 0], Hips_pos: [0, -0.056, -0.026], UpArmL: [-42, 11, 14], UpArmR: [-22, -13, -16], Chest: [-4, -14, 0] }),
      K(0.69, { ThighL: [2, -6, 0], ShinL: [18, 0, 0], ThighR: [-8, 8, 0], ShinR: [24, 0, 0], Hips_pos: [0, -0.032, -0.020] }),
      K(0.92, { ThighL: [-32, -6, 0], ShinL: [12, 0, 0], FootL: [-8, -14, 0], ThighR: [24, 8, 0], ShinR: [32, 0, 0], FootR: [14, 10, 0], Hips_pos: [0, -0.056, -0.026], UpArmL: [-24, 11, 14], UpArmR: [-40, -13, -16] })
    ]
  },

  // RUN — the fastest cycle in the roster (0.40 s against the base 0.52), and
  // still smooth. He covers ground; he does not blink through it unless he is
  // spending cursed energy to.
  run: {
    dur: 0.40, loop: true, keys: [
      K(0, { Spine: [14, -6, 0], Chest: [8, -8, 0], Hips: [4, 18, 0], ThighL: [-58, -3, 0], ShinL: [22, 0, 0], FootL: [-14, -8, 0], ThighR: [38, 5, 0], ShinR: [70, 0, 0], FootR: [32, 8, 0], UpArmL: [-16, 9, 10], LoArmL: [-112, 0, 4], UpArmR: [-78, -7, -12], LoArmR: [-100, 0, -4], Head: [-4, -10, 0], Hips_pos: [0, -0.026, 0] }),
      K(0.10, { Spine: [13, -6, 0], ThighL: [-8, -3, 0], ShinL: [30, 0, 0], ThighR: [-18, 5, 0], ShinR: [42, 0, 0], Hips_pos: [0, -0.070, 0] }),
      K(0.20, { Spine: [14, -6, 0], Chest: [8, -8, 0], Hips: [4, 18, 0], ThighL: [38, -3, 0], ShinL: [70, 0, 0], FootL: [32, -8, 0], ThighR: [-58, 5, 0], ShinR: [22, 0, 0], FootR: [-14, 8, 0], UpArmL: [-78, 9, 10], LoArmL: [-100, 0, 4], UpArmR: [-16, -7, -12], LoArmR: [-112, 0, -4], Hips_pos: [0, -0.026, 0] }),
      K(0.30, { Spine: [13, -6, 0], ThighL: [-18, -3, 0], ShinL: [42, 0, 0], ThighR: [-8, 5, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.070, 0] }),
      K(0.40, { Spine: [14, -6, 0], ThighL: [-58, -3, 0], ShinL: [22, 0, 0], ThighR: [38, 5, 0], ShinR: [70, 0, 0], UpArmL: [-16, 9, 10], UpArmR: [-78, -7, -12], Hips_pos: [0, -0.026, 0] })
    ]
  },

  // DASH — THE FASTEST IN THE GAME, and the first stepped clip in the file.
  // Three positions, 1/24 s apart, and no in-betweens: a coil, a fully
  // extended lean, and the settle. No i-frames anywhere in the config — he is
  // not dodging, he is simply already elsewhere.
  dash: {
    dur: 0.26, loop: false, keys: [
      K(0, {}),
      K(0.042, { Spine: [30, -6, 0], Chest: [18, -8, 0], Hips_pos: [0, -0.13, 0], ThighL: [-56, -6, 0], ShinL: [34, 0, 0], ThighR: [36, 8, 0], ShinR: [62, 0, 0], UpArmL: [36, 11, 22], LoArmL: [-34, 0, 6], UpArmR: [40, -9, -24], LoArmR: [-30, 0, -6], Head: [4, -10, 0] }, 'hold'),
      K(0.125, { Spine: [22, -6, 0], Chest: [14, -8, 0], Hips_pos: [0, -0.10, 0], ThighL: [-44, -6, 0], ShinL: [28, 0, 0], ThighR: [26, 8, 0], ShinR: [50, 0, 0], UpArmL: [20, 11, 20], UpArmR: [24, -9, -22], Head: [-2, -10, 0] }, 'hold'),
      K(0.26, {}, 'hold')
    ]
  },

  // BLOCK — up in two frames and then completely still. Average guard by the
  // numbers; it just arrives before yours does.
  block: {
    dur: 0.14, loop: false, keys: [
      K(0, {}),
      K(0.042, { UpArmL: [-80, 28, 6], LoArmL: [-120, 32, 0], HandL: [-20, 96, 0], UpArmR: [-72, -24, -8], LoArmR: [-126, -30, 0], HandR: [-20, -96, 0], Spine: [4, -12, 0], Chest: [2, -16, 0], Head: [-4, -12, 0], Hips_pos: [0, -0.080, -0.02], ThighL: [-26, -6, 0], ShinL: [22, 0, 0] }, 'hold'),
      K(0.14, { UpArmL: [-80, 28, 6], LoArmL: [-120, 32, 0], UpArmR: [-72, -24, -8], LoArmR: [-126, -30, 0], Hips_pos: [0, -0.080, -0.02] }, 'hold')
    ]
  },

  // ---- THE PUNCH STRING ----------------------------------------------------
  // THE FASTEST NORMALS IN THE GAME and the lowest damage per hit. Each one is
  // exactly three stepped positions — cocked, extended, returned — placed on
  // the 24 fps grid. There is no arc anywhere: the fist is not out, and then
  // it is out. Total clip lengths are ~0.21 / 0.23 / 0.33 s against the base
  // set's 0.34 / 0.38 / 0.55.
  punch1: {
    dur: 0.21, loop: false, keys: [
      K(0, {}),
      K(0.042, { UpArmL: [-36, 16, 16], LoArmL: [-100, 0, 6], HandL: [-14, 78, 0], Chest: [-2, -26, 0], Hips: [0, 42, 0] }, 'hold'),
      K(0.083, { UpArmL: [-86, -8, -4], LoArmL: [-4, 0, 0], HandL: [-4, 106, 0], Chest: [-2, 6, 0], Hips: [0, 18, 0], Spine: [-1, 2, 0], Head: [-10, -16, 0], UpArmR: [-32, -10, -18], LoArmR: [-112, 0, -6] }, 'hold'),
      K(0.146, { UpArmL: [-86, -8, -4], LoArmL: [-6, 0, 0], HandL: [-4, 106, 0], Chest: [-2, 6, 0], Hips: [0, 18, 0] }, 'hold'),
      K(0.21, {}, 'hold')
    ]
  },
  punch2: {
    dur: 0.23, loop: false, keys: [
      K(0, { UpArmL: [-72, -8, 0], LoArmL: [-38, 0, 0], Chest: [-2, 2, 0] }),
      K(0.042, { UpArmR: [-32, -20, -24], LoArmR: [-118, 0, -6], HandR: [-18, -86, 0], Chest: [-2, -30, 0], Hips: [0, 48, 0], Hips_pos: [0, -0.062, -0.02] }, 'hold'),
      K(0.083, { UpArmR: [-90, 6, 2], LoArmR: [-2, 0, 0], HandR: [-4, -170, 0], Chest: [0, 26, 0], Hips: [0, 6, 0], Spine: [0, 16, 0], Head: [-10, -20, 0], UpArmL: [-38, 12, 16], LoArmL: [-98, 0, 6] }, 'hold'),
      K(0.146, { UpArmR: [-90, 6, 2], LoArmR: [-4, 0, 0], HandR: [-4, -170, 0], Chest: [0, 26, 0], Hips: [0, 6, 0] }, 'hold'),
      K(0.23, {}, 'hold')
    ]
  },
  // third hit LAUNCHES — a rising knee-and-palm that lifts them. Four steps,
  // and the launch frame is held long enough to read before he resets.
  punch3: {
    dur: 0.33, loop: false, keys: [
      K(0, { UpArmR: [-72, 4, 0], LoArmR: [-28, 0, 0] }),
      K(0.042, { UpArmR: [20, -14, -26], LoArmR: [-94, 0, -8], Chest: [10, -34, 0], Spine: [8, -18, 0], Hips: [4, 46, 0], Hips_pos: [0, -0.17, -0.02], ThighL: [-34, -6, 0], ShinL: [36, 0, 0], ThighR: [30, 8, 0], ShinR: [52, 0, 0], Head: [-2, -12, 0] }, 'hold'),
      K(0.104, { UpArmR: [-124, 12, 6], LoArmR: [-40, 0, 0], HandR: [-16, 0, 0], Chest: [-16, 20, 0], Spine: [-12, 12, 0], Hips: [-4, 8, 0], Hips_pos: [0, 0.04, 0.02], ThighL: [-72, -6, 0], ShinL: [88, 0, 0], ThighR: [6, 8, 0], ShinR: [18, 0, 0], FootR: [26, 10, 0], Head: [-14, -14, 0], UpArmL: [-32, 12, 22], LoArmL: [-92, 0, 6] }, 'hold'),
      K(0.188, { UpArmR: [-124, 12, 6], LoArmR: [-42, 0, 0], Chest: [-16, 20, 0], Hips_pos: [0, 0.04, 0.02], ThighL: [-72, -6, 0], ShinL: [88, 0, 0] }, 'hold'),
      K(0.33, {}, 'hold')
    ]
  },

  // HEAVY — a spinning back-heel. Two steps: loaded, and landed. Nothing
  // rotates through the middle; he is facing away and then he is facing you.
  heavy: {
    dur: 0.68, loop: false, keys: [
      K(0, {}),
      K(0.167, { Hips: [0, 150, 0], Chest: [-6, 30, 0], Spine: [-4, 20, 0], Head: [-6, 40, 0], ThighL: [-38, -6, 0], ShinL: [40, 0, 0], ThighR: [24, 8, 0], ShinR: [44, 0, 0], UpArmL: [-40, 30, 30], LoArmL: [-80, 0, 6], UpArmR: [-36, -26, -32], LoArmR: [-84, 0, -6], Hips_pos: [0, -0.09, 0] }, 'hold'),
      K(0.25, { Hips: [0, 20, 0], Chest: [4, -20, 0], Spine: [2, -12, 0], Head: [-10, -18, 0], ThighL: [-30, -6, 0], ShinL: [10, 0, 0], ThighR: [-108, 10, 0], ShinR: [12, 0, 0], FootR: [-18, 10, 0], UpArmL: [-30, 16, 46], LoArmL: [-30, 0, 6], UpArmR: [-26, -14, -48], LoArmR: [-26, 0, -6], Hips_pos: [0, -0.11, 0.06] }, 'hold'),
      K(0.36, { Hips: [0, 20, 0], ThighR: [-106, 10, 0], ShinR: [14, 0, 0], Chest: [4, -20, 0], Hips_pos: [0, -0.11, 0.06] }, 'hold'),
      K(0.68, {}, 'out')
    ]
  },

  // ---- RB · PROJECTION RUSH ------------------------------------------------
  // SIX DISCRETE POSITIONS AT 1/24 s APART, and the clip is authored on that
  // grid literally — 0.042, 0.083, 0.125, 0.167, 0.208, 0.250. Each is a
  // different strike from a different angle, and there is no frame between any
  // pair of them. The combat side places an afterimage at each step (see
  // model.projectionStep in art/models/naoya.js), so what the opponent sees is
  // six frozen Naoyas standing in a line and one real one at the end of it,
  // behind them.
  //
  // This is the clearest statement of the character in the whole project: it
  // is not a fast animation, it is a SEQUENCE OF STILLS.
  rush: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      // 1 — left straight, low
      K(0.042, { Hips: [0, 44, 0], Hips_pos: [0, -0.10, 0], UpArmL: [-84, -6, -2], LoArmL: [-6, 0, 0], HandL: [-4, 104, 0], UpArmR: [-30, -12, -18], LoArmR: [-110, 0, -6], Chest: [2, 8, 0], Head: [-6, -14, 0], ThighL: [-40, -6, 0], ShinL: [26, 0, 0], ThighR: [26, 8, 0], ShinR: [44, 0, 0] }, 'hold'),
      // 2 — right elbow, turned in
      K(0.083, { Hips: [0, -14, 0], Hips_pos: [0, -0.06, 0], UpArmR: [-64, 22, -14], LoArmR: [-104, 0, -6], HandR: [-20, -80, 0], UpArmL: [-26, 14, 18], LoArmL: [-104, 0, 6], Chest: [4, -22, 0], Head: [-8, 10, 0], ThighL: [-14, -6, 0], ShinL: [14, 0, 0], ThighR: [10, 8, 0], ShinR: [20, 0, 0] }, 'hold'),
      // 3 — high left, chin height
      K(0.125, { Hips: [0, 52, 0], Hips_pos: [0, -0.02, 0], UpArmL: [-116, -4, 4], LoArmL: [-10, 0, 0], HandL: [-10, 96, 0], UpArmR: [-40, -14, -20], LoArmR: [-96, 0, -6], Chest: [-8, 12, 0], Spine: [-6, 6, 0], Head: [-16, -18, 0], ThighL: [-28, -6, 0], ShinL: [18, 0, 0], ThighR: [16, 8, 0], ShinR: [30, 0, 0] }, 'hold'),
      // 4 — knee, body folded
      K(0.167, { Hips: [6, 10, 0], Hips_pos: [0, 0.02, 0], UpArmL: [-40, 20, 30], LoArmL: [-70, 0, 6], UpArmR: [-36, -18, -32], LoArmR: [-74, 0, -6], Chest: [16, -6, 0], Spine: [12, -4, 0], Head: [4, -6, 0], ThighL: [-100, -6, 0], ShinL: [98, 0, 0], ThighR: [10, 8, 0], ShinR: [22, 0, 0] }, 'hold'),
      // 5 — right straight, fully extended, behind them now
      K(0.208, { Hips: [0, -40, 0], Hips_pos: [0, -0.08, 0], UpArmR: [-92, 8, 2], LoArmR: [-2, 0, 0], HandR: [-4, -172, 0], UpArmL: [-34, 14, 18], LoArmL: [-100, 0, 6], Chest: [2, 30, 0], Spine: [1, 18, 0], Head: [-10, 22, 0], ThighL: [24, -6, 0], ShinL: [34, 0, 0], ThighR: [-36, 8, 0], ShinR: [22, 0, 0] }, 'hold'),
      // 6 — the settle, side-on, already looking back at them
      K(0.25, { Hips: [0, 60, 0], Hips_pos: [0, -0.09, -0.03], UpArmL: [-16, 12, 14], LoArmL: [-54, 18, 0], UpArmR: [-34, -14, -16], LoArmR: [-96, -32, 0], Chest: [-6, -20, 0], Head: [-12, -26, 0], ThighL: [-30, -6, 0], ShinL: [20, 0, 0], ThighR: [26, 8, 0], ShinR: [34, 0, 0] }, 'hold'),
      K(0.46, {}, 'hold')
    ]
  },

  // ---- RT · FRAME KICK -----------------------------------------------------
  // The one committed move in his kit. A long chambered side kick with huge
  // knockback and reach — his combo ender and his wall-splat tool.
  //
  // It is stepped like everything else, but with a LONGER HOLD on the chamber
  // than anywhere else in the file (0.125 s of absolute stillness with the leg
  // cocked). That hold is the whole balance of the move: it is the only
  // window in his entire kit where a good opponent gets to react to him, and
  // it exists specifically so that the fastest character in the game still has
  // one thing that can be beaten on reaction.
  framekick: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      // chamber — knee up high and tight, body turned side-on, arms down
      K(0.083, { Hips: [0, 84, 0], Hips_pos: [0, -0.05, -0.04], Chest: [-8, -30, 0], Spine: [-5, -18, 0], Head: [-12, -34, 0], ThighL: [-118, -10, 0], ShinL: [124, 0, 0], FootL: [-10, -14, 0], ThighR: [10, 10, 0], ShinR: [14, 0, 0], UpArmL: [-6, 14, 20], LoArmL: [-40, 0, 6], UpArmR: [-14, -12, -22], LoArmR: [-36, 0, -6] }, 'hold'),
      // THE HOLD. Nothing moves. This is the tell and it is deliberate.
      K(0.208, { Hips: [0, 84, 0], Hips_pos: [0, -0.05, -0.04], Chest: [-8, -30, 0], Head: [-12, -34, 0], ThighL: [-118, -10, 0], ShinL: [124, 0, 0], ThighR: [10, 10, 0], ShinR: [14, 0, 0], UpArmL: [-6, 14, 20], UpArmR: [-14, -12, -22] }, 'hold'),
      // the extension — one frame, fully out, everything straight
      K(0.25, { Hips: [-6, 92, 0], Hips_pos: [0, -0.02, 0.12], Chest: [-10, -34, 0], Spine: [-6, -20, 0], Head: [-14, -38, 0], ThighL: [-124, -12, 0], ShinL: [4, 0, 0], FootL: [-30, -16, 0], ThighR: [22, 10, 0], ShinR: [30, 0, 0], UpArmL: [10, 16, 44], LoArmL: [-20, 0, 6], UpArmR: [4, -14, -46], LoArmR: [-18, 0, -6] }, 'hold'),
      K(0.375, { Hips: [-6, 92, 0], Hips_pos: [0, -0.02, 0.12], ThighL: [-122, -12, 0], ShinL: [6, 0, 0], Chest: [-10, -34, 0], Head: [-14, -38, 0], UpArmL: [10, 16, 44], UpArmR: [4, -14, -46] }, 'hold'),
      // and the leg comes down. The ONE eased key in the clip, because a kick
      // that snaps back to stance from full extension reads as a glitch rather
      // than as speed — the recovery is where he is actually vulnerable and it
      // should look like a recovery.
      K(0.72, {}, 'out')
    ]
  },

  // ---- B · PROJECTION STANCE --------------------------------------
  // He plants, drops his hands completely, and turns his PALM out toward the
  // opponent — canon: the technique keys off what his palm touches. The pose
  // is open and undefended on purpose: this is a trap, and a trap that looks
  // like a guard would not be baitable.
  //
  // It loops with a 24th-of-a-second twitch in the fingers and head: he holds
  // one pose, steps a fraction, holds again. The model's ring tell steps on
  // the same grid (art/models/naoya.js), so the character and his VFX are
  // drawn at the same frame rate and neither is smooth.
  stance: {
    dur: 0.5, loop: true, keys: [
      K(0, { Hips: [0, 26, 0], Hips_pos: [0, -0.048, -0.02], Chest: [-6, -12, 0], Spine: [-4, -8, 0], Head: [-12, -10, 0], Neck: [-4, -3, 0], UpArmL: [-72, 6, 10], LoArmL: [-16, 0, 4], HandL: [-88, 20, 0], UpArmR: [-10, -12, -12], LoArmR: [-44, -20, 0], HandR: [-8, -34, 0], ThighL: [-20, -6, 0], ShinL: [16, 0, 0], ThighR: [16, 8, 0], ShinR: [24, 0, 0] }),
      K(0.125, { Hips: [0, 27, 0], Head: [-13, -9, 0], UpArmL: [-74, 6, 10], HandL: [-90, 20, 0], Hips_pos: [0, -0.050, -0.02] }, 'hold'),
      K(0.25, { Hips: [0, 26, 0], Head: [-11, -11, 0], UpArmL: [-72, 6, 10], HandL: [-86, 20, 0], Hips_pos: [0, -0.048, -0.02] }, 'hold'),
      K(0.375, { Hips: [0, 27, 0], Head: [-13, -10, 0], UpArmL: [-74, 6, 10], HandL: [-90, 20, 0], Hips_pos: [0, -0.050, -0.02] }, 'hold'),
      K(0.5, { Hips: [0, 26, 0], Head: [-12, -10, 0], UpArmL: [-72, 6, 10], HandL: [-88, 20, 0], Hips_pos: [0, -0.048, -0.02] }, 'hold')
    ]
  },

  // ---- D-pad Right · MAXIMUM PROJECTION ------------------------------------
  // The non-domain ultimate cast: he enters maximum projection.
  //
  // No beam, no explosion, no summon — the ultimate is a STATE, so the cast is
  // a state change and it is over in a quarter of a second. He simply arrives
  // in a new posture: both palms out, weight forward, chin down for the first
  // time in the match. That last detail is the point. The one thing that ever
  // takes the smugness off his face is being serious about you.
  //
  // Four steps at 1/24 s, and then a held finish. Deliberately the SHORTEST
  // ultimate cast in the game (0.42 s against Uzumaki's 1.95) — non-domain
  // ultimates already get the faster startup, and his is the fastest of those.
  ult: {
    dur: 0.58, loop: false, keys: [
      K(0, {}),
      K(0.042, { Hips: [0, 40, 0], Hips_pos: [0, -0.09, -0.04], Chest: [-10, -18, 0], Head: [-16, -16, 0], UpArmL: [-20, 16, 18], LoArmL: [-84, 0, 6], UpArmR: [-24, -14, -20], LoArmR: [-88, 0, -6] }, 'hold'),
      K(0.083, { Hips: [0, 8, 0], Hips_pos: [0, -0.13, 0.02], Chest: [6, -4, 0], Spine: [4, -2, 0], Head: [2, -4, 0], Neck: [2, 0, 0], UpArmL: [-88, 8, 14], LoArmL: [-10, 0, 4], HandL: [-86, 24, 0], UpArmR: [-86, -6, -15], LoArmR: [-12, 0, -4], HandR: [-86, -24, 0], ThighL: [-34, -6, 0], ShinL: [30, 0, 0], ThighR: [24, 8, 0], ShinR: [38, 0, 0] }, 'hold'),
      // CHIN DOWN. Once per match.
      K(0.167, { Hips: [0, 6, 0], Hips_pos: [0, -0.14, 0.03], Chest: [10, -2, 0], Spine: [7, -1, 0], Neck: [6, 0, 0], Head: [12, -2, 0], UpArmL: [-90, 8, 14], LoArmL: [-8, 0, 4], HandL: [-88, 24, 0], UpArmR: [-88, -6, -15], LoArmR: [-10, 0, -4], HandR: [-88, -24, 0], ThighL: [-36, -6, 0], ShinL: [32, 0, 0], ThighR: [26, 8, 0], ShinR: [40, 0, 0] }, 'hold'),
      K(0.375, { Hips: [0, 6, 0], Hips_pos: [0, -0.14, 0.03], Chest: [10, -2, 0], Head: [12, -2, 0], UpArmL: [-90, 8, 14], UpArmR: [-88, -6, -15], ThighL: [-36, -6, 0], ShinL: [32, 0, 0] }, 'hold'),
      K(0.58, {}, 'hold')
    ]
  },

  // VICTORY — he brushes something off his sleeve and looks away. Stepped, so
  // even the gloating is drawn at 24 fps.
  // ---- TAUNT — "YOU'RE TOO SLOW TO SEE IT." -------------------------------
  // Authored on `hold` keys like the rest of his set, so his body ARRIVES at
  // each beat instead of travelling to it — which is the whole point of him and
  // is what makes an insufferable little grooming routine read as speed rather
  // than as fussing.
  //
  // Four arrivals: collar straightened, dust flicked off the shoulder, a
  // backhanded wave that dismisses you, and back to stance with the chin never
  // once coming down.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // ARRIVAL 1 — both hands at the collar, chin higher still
      K(0.30, {
        UpArmL: [-84, 30, 20], LoArmL: [-128, 44, 0], HandL: [-18, 70, 0],
        UpArmR: [-80, -28, -22], LoArmR: [-132, -42, 0], HandR: [-18, -70, 0],
        Head: [-14, -6, 0], Neck: [-5, -2, 0], Chest: [-6, -12, 0], Spine: [-3, -9, 0]
      }, 'hold'),
      K(0.62, {
        UpArmL: [-80, 26, 26], LoArmL: [-120, 40, 0],
        UpArmR: [-76, -24, -28], LoArmR: [-124, -38, 0],
        Head: [-14, -6, 0], Chest: [-6, -12, 0]
      }, 'hold'),
      // ARRIVAL 2 — the right hand flicks dust off the left shoulder
      K(0.95, {
        UpArmL: [-6, 10, 10], LoArmL: [-44, 18, 0], HandL: [-8, 28, 0],
        UpArmR: [-96, -6, -36], LoArmR: [-118, -50, 0], HandR: [-24, -90, 0],
        Head: [-12, -20, 3], Chest: [-4, -22, 0], Spine: [-2, -14, 0]
      }, 'hold'),
      K(1.20, {
        UpArmL: [-6, 10, 10], LoArmL: [-44, 18, 0],
        UpArmR: [-92, -2, -44], LoArmR: [-104, -56, 0], HandR: [-26, -96, 0],
        Head: [-12, -18, 3], Chest: [-4, -20, 0]
      }, 'hold'),
      // ARRIVAL 3 — THE BACKHAND. A single dismissive wave, arriving already
      // finished, and he is looking away from you while he does it.
      K(1.52, {
        UpArmL: [-6, 10, 10], LoArmL: [-46, 18, 0],
        UpArmR: [-58, -30, -52], LoArmR: [-26, -20, -6], HandR: [-10, -30, 0],
        Head: [-13, 16, -4], Neck: [-4, 6, 0], Chest: [-5, 2, 0], Spine: [-3, 2, 0],
        Hips: [0, 30, 0]
      }, 'hold'),
      K(1.95, {
        UpArmR: [-42, -34, -60], LoArmR: [-18, -16, -6], HandR: [-8, -24, 0],
        UpArmL: [-6, 10, 10], LoArmL: [-46, 18, 0],
        Head: [-13, 20, -5], Chest: [-5, 4, 0], Hips: [0, 30, 0]
      }, 'hold'),
      // and he holds THAT, looking somewhere else entirely, for a full second
      K(2.70, {
        UpArmR: [-40, -34, -58], LoArmR: [-20, -16, -6],
        UpArmL: [-7, 10, 10], LoArmL: [-46, 18, 0],
        Head: [-13, 18, -5], Chest: [-5, 3, 0], Hips: [0, 29, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 2.4, loop: false, keys: [
      K(0, {}),
      K(0.125, { Hips: [0, 44, 0], Chest: [-6, -22, 0], Head: [-14, -24, 0], UpArmL: [-48, 24, 14], LoArmL: [-90, 30, 0], HandL: [-20, 60, 0], UpArmR: [-20, -14, -14], LoArmR: [-70, -26, 0], Hips_pos: [0, -0.050, -0.03] }, 'hold'),
      K(0.375, { Hips: [0, 44, 0], Chest: [-6, -22, 0], Head: [-14, -24, 0], UpArmL: [-44, 26, 14], LoArmL: [-96, 32, 0], UpArmR: [-20, -14, -14], LoArmR: [-70, -26, 0], Hips_pos: [0, -0.050, -0.03] }, 'hold'),
      K(0.583, { Hips: [0, 20, 0], Chest: [-4, -10, 0], Head: [-18, 26, 0], Neck: [-6, 10, 0], UpArmL: [-10, 10, 12], LoArmL: [-46, 18, 0], UpArmR: [-28, -12, -14], LoArmR: [-90, -30, 0], Hips_pos: [0, -0.046, -0.026] }, 'hold'),
      K(2.4, { Hips: [0, 20, 0], Chest: [-4, -10, 0], Head: [-18, 26, 0], Neck: [-6, 10, 0], UpArmL: [-10, 10, 12], LoArmL: [-46, 18, 0], UpArmR: [-28, -12, -14], LoArmR: [-90, -30, 0], Hips_pos: [0, -0.046, -0.026] }, 'hold')
    ]
  }
};
