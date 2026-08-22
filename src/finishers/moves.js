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

  // =========================================================================
  // THE KILLING BLOWS
  // -------------------------------------------------------------------------
  // The clips below are the LAST action of a finisher, and they exist because
  // the shared fight vocabulary could not carry them. A generic two-handed
  // thrust is not Toji killing Gojo — Toji kills him with a short weapon,
  // underhand, up into the throat, while looking somewhere else, and every
  // part of that sentence is a pose choice the library does not make.
  //
  // Each one is aimed by the director like any other strike (the registry
  // names the bone, the frame and the target), so they LAND rather than mime.
  // =========================================================================

  // ---- TOJI — 天逆鉾, INTO THE NECK --------------------------------------
  // Hidden Inventory. The Inverted Spear of Heaven is a knife, not a lance:
  // he carries it point-up in a reverse grip, closes the distance in one step
  // he does not telegraph, and drives it upward under the jaw. The whole
  // performance is the head — it is turned off the line before the strike and
  // it never comes back, because he is not interested in watching it work.
  tojiSpear: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      // side-on, weapon back by the hip, free hand still in the pocket. He is
      // already looking away.
      K(0.16, {
        Hips: [0, 54, 0], Hips_pos: [0.03, -0.11, -0.07], Spine: [4, -18, -2], Chest: [3, -26, -3],
        Neck: [2, -12, 0], Head: [4, -46, -4],
        UpArmR: [-26, -36, -14], LoArmR: [-108, -18, 0], HandR: [-46, -56, 0],
        UpArmL: [-10, 14, 14], LoArmL: [-48, 22, 0], HandL: [-10, 34, 0],
        ThighL: [-18, -6, 0], ShinL: [16, 0, 0], ThighR: [16, 8, 0], ShinR: [26, 0, 0]
      }, 'in'),
      // IN. One step, the arm drives forward and UP, and the point goes in
      // under the jaw. The head has not turned back.
      //
      // THE HAND STOPS AT THEIR CHEST, not at their throat: the blade comes
      // out of the top of a reverse grip and stands about half a metre proud
      // of the fist, so a hand aimed at the neck puts the point a foot above
      // their scalp. The fist finishes low and the WEAPON covers the rest —
      // which is also why the registry aims this at 'chest'.
      K(0.30, {
        Hips: [0, 12, 0], Hips_pos: [0.02, -0.15, 0.20], Spine: [-4, 8, -2], Chest: [-8, 14, -3],
        Neck: [-2, -16, 0], Head: [0, -42, -6],
        UpArmR: [-62, 12, -10], LoArmR: [-46, 0, 0], HandR: [-56, -92, 0],
        UpArmL: [-12, 14, 14], LoArmL: [-46, 20, 0], HandL: [-10, 34, 0],
        ThighL: [-58, -4, 0], ShinL: [26, 0, 0], FootL: [-12, -10, 0],
        ThighR: [36, 6, 0], ShinR: [60, 0, 0], FootR: [18, 8, 0]
      }, 'snap'),
      // HELD. Two bodies at arm's length, absolutely still, and he is looking
      // at the ground over his own shoulder.
      K(0.56, {
        Hips: [0, 12, 0], Hips_pos: [0.02, -0.15, 0.20], Chest: [-8, 14, -3], Head: [0, -42, -6],
        UpArmR: [-64, 12, -10], LoArmR: [-44, 0, 0], HandR: [-56, -92, 0],
        UpArmL: [-12, 14, 14], LoArmL: [-46, 20, 0],
        ThighL: [-58, -4, 0], ShinL: [26, 0, 0], ThighR: [36, 6, 0], ShinR: [60, 0, 0]
      }, 'hold'),
      // and he takes it back out with a short flick of the wrist
      K(0.74, {
        Hips: [0, 30, 0], Hips_pos: [0.03, -0.10, 0.02], Spine: [2, -10, -2], Chest: [2, -14, -3],
        Neck: [2, -6, 0], Head: [4, -30, -4],
        UpArmR: [-52, -12, -20], LoArmR: [-70, -8, 0], HandR: [-30, -60, 0],
        UpArmL: [-10, 14, 14], LoArmL: [-48, 22, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [30, 0, 0]
      }, 'snap'),
      // arm down. Bored again, which is where he started.
      K(1.15, {
        Hips: [0, 22, 4], Hips_pos: [0.04, -0.052, -0.02], Spine: [2, -8, -3], Chest: [3, -12, -4],
        Neck: [2, -2, 0], Head: [6, -18, -3],
        UpArmR: [-12, -14, -16], LoArmR: [-40, -20, 0], HandR: [-16, -44, 0],
        UpArmL: [-10, 14, 14], LoArmL: [-48, 22, 0],
        ThighL: [-10, -6, 0], ShinL: [8, 0, 0], ThighR: [14, 8, 0], ShinR: [22, 0, 0]
      }, 'out')
    ]
  },

  // ---- YUJI — 黒閃 ---------------------------------------------------------
  // Not a cross with an effect on it. The distance between a punch and a Black
  // Flash is entirely in the body: the rear heel screws into the floor, the
  // hip arrives a frame before the shoulder, the fist finishes PAST where the
  // head was — and then everything stops dead and stays stopped, because the
  // held frame after impact is the panel everybody remembers.
  yujiBlackFlash: {
    dur: 1.05, loop: false, keys: [
      K(0, {}),
      // the coil, deeper than any clip in the fight set
      K(0.14, {
        Hips: [2, 62, 0], Hips_pos: [0, -0.22, -0.10], Spine: [14, -28, 0], Chest: [12, -42, 0],
        Neck: [6, -8, 0], Head: [16, -32, 0],
        UpArmR: [-14, -32, -14], LoArmR: [-134, -12, -6], HandR: [-12, -90, 0],
        UpArmL: [-74, 24, 22], LoArmL: [-88, 12, 6], HandL: [-18, 74, 0],
        ThighL: [-12, -6, 0], ShinL: [26, 0, 0], ThighR: [40, 8, 0], ShinR: [66, 0, 0]
      }, 'in'),
      // IMPACT. Hips fully over, shoulder through the line, arm locked out and
      // the knuckles well past where the face was standing.
      K(0.26, {
        Hips: [-2, -26, 0], Hips_pos: [0, -0.12, 0.26], Spine: [4, 30, 0], Chest: [2, 44, 0],
        Neck: [-4, 10, 0], Head: [-10, 14, 0],
        UpArmR: [-94, 14, 2], LoArmR: [0, 0, 0], HandR: [-4, -176, 0],
        UpArmL: [-22, 14, 20], LoArmL: [-104, 0, 6], HandL: [-18, 70, 0],
        ThighL: [-58, -6, 0], ShinL: [22, 0, 0], FootL: [-16, -10, 0],
        ThighR: [30, 8, 0], ShinR: [54, 0, 0], FootR: [26, 8, 0]
      }, 'snap'),
      // and NOTHING MOVES. A quarter of a second is an eternity here.
      K(0.52, {
        Hips: [-2, -26, 0], Hips_pos: [0, -0.12, 0.26], Chest: [2, 44, 0], Head: [-10, 14, 0],
        UpArmR: [-94, 14, 2], LoArmR: [0, 0, 0], HandR: [-4, -176, 0],
        UpArmL: [-22, 14, 20], LoArmL: [-104, 0, 6],
        ThighL: [-58, -6, 0], ShinL: [22, 0, 0], ThighR: [30, 8, 0], ShinR: [54, 0, 0]
      }, 'hold'),
      // the fist comes back to his own chin and he is already looking for the
      // next one — which is the character, not the technique
      K(0.78, {
        Hips: [0, 24, 0], Hips_pos: [0, -0.14, 0.04], Spine: [6, -8, 0], Chest: [4, -12, 0],
        Neck: [0, -2, 0], Head: [2, -10, 0],
        UpArmR: [-62, -18, -14], LoArmR: [-120, -22, 0], HandR: [-20, -92, 0],
        UpArmL: [-70, 22, 12], LoArmL: [-116, 26, 0], HandL: [-20, 88, 0],
        ThighL: [-32, -6, 0], ShinL: [26, 0, 0], ThighR: [24, 8, 0], ShinR: [42, 0, 0]
      }, 'out'),
      K(1.05, {}, 'out')
    ]
  },

  // ---- GOJO — 虚式・茈 -----------------------------------------------------
  // Both hands finally come out of the pockets. Red on the right, blue on the
  // left, held apart at chest height for exactly as long as it takes to see
  // that they are two different things — and then he brings them together and
  // steps out of the way of what happens next.
  //
  // AUTHORED AS TWO CLIPS, not one. A finisher plays one clip per action and
  // every action RESTARTS what it names — so a single long cast split across
  // three cuts would play its own opening three times. Where a technique needs
  // more than one shot, it is split at the beat the camera cuts on: `Charge`
  // is everything up to the hands being apart, `Fire` is everything from them
  // coming together onward.
  gojoPurpleCharge: {
    dur: 0.80, loop: false, keys: [
      K(0, {}),
      // out of the pockets. Elbows in, palms up, weight even.
      K(0.24, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.06, 0], Spine: [-2, -4, 0], Chest: [-4, -6, 0],
        Neck: [-2, 0, 0], Head: [-6, -4, 0],
        UpArmR: [-54, -10, -30], LoArmR: [-104, -6, -4], HandR: [-70, -40, 0],
        UpArmL: [-58, 12, 32], LoArmL: [-100, 4, 4], HandL: [-70, 40, 0],
        ThighL: [-18, -4, 0], ShinL: [14, 0, 0], ThighR: [14, 6, 0], ShinR: [22, 0, 0]
      }, 'out'),
      // APART. One in each hand, held wide of the body, and he looks at
      // neither of them.
      K(0.52, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.08, 0.02], Spine: [-4, -2, 0], Chest: [-6, -4, 0],
        Neck: [-2, 0, 0], Head: [-8, -2, 0],
        UpArmR: [-84, -6, -46], LoArmR: [-52, 0, -6], HandR: [-80, -30, 0],
        UpArmL: [-88, 8, 48], LoArmL: [-48, 0, 6], HandL: [-80, 30, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      K(0.80, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.08, 0.02], Chest: [-6, -4, 0], Head: [-8, -2, 0],
        UpArmR: [-84, -6, -46], LoArmR: [-52, 0, -6], HandR: [-80, -30, 0],
        UpArmL: [-88, 8, 48], LoArmL: [-48, 0, 6], HandL: [-80, 30, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [28, 0, 0]
      }, 'hold')
    ]
  },

  gojoPurpleFire: {
    dur: 1.30, loop: false, keys: [
      // opens exactly where the charge left off, so the cut between them is
      // a cut and not a pop
      K(0, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.08, 0.02], Spine: [-4, -2, 0], Chest: [-6, -4, 0],
        Neck: [-2, 0, 0], Head: [-8, -2, 0],
        UpArmR: [-84, -6, -46], LoArmR: [-52, 0, -6], HandR: [-80, -30, 0],
        UpArmL: [-88, 8, 48], LoArmL: [-48, 0, 6], HandL: [-80, 30, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [28, 0, 0]
      }),
      // TOGETHER. Both hands close on the same point in front of his sternum.
      K(0.26, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.12, 0.04], Spine: [4, -4, 0], Chest: [4, -6, 0],
        Neck: [2, 0, 0], Head: [6, -4, 0],
        UpArmR: [-96, 4, -8], LoArmR: [-58, 0, -4], HandR: [-60, -50, 0],
        UpArmL: [-98, -2, 10], LoArmL: [-56, 0, 4], HandL: [-60, 50, 0],
        ThighL: [-30, -4, 0], ShinL: [24, 0, 0], ThighR: [22, 6, 0], ShinR: [36, 0, 0]
      }, 'snap'),
      // a beat where nothing in the world moves
      K(0.52, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.12, 0.04], Chest: [4, -6, 0], Head: [6, -4, 0],
        UpArmR: [-96, 4, -8], LoArmR: [-58, 0, -4], UpArmL: [-98, -2, 10], LoArmL: [-56, 0, 4],
        ThighL: [-30, -4, 0], ShinL: [24, 0, 0], ThighR: [22, 6, 0], ShinR: [36, 0, 0]
      }, 'hold'),
      // and it goes. Both arms straight out, the recoil pushing him back onto
      // his heels — the only time in the whole scene he braces for anything.
      K(0.66, {
        Hips: [-8, 12, 0], Hips_pos: [0, -0.10, -0.06], Spine: [-10, -2, 0], Chest: [-10, -4, 0],
        Neck: [-4, 0, 0], Head: [-14, -2, 0],
        UpArmR: [-102, 8, -14], LoArmR: [-4, 0, -2], HandR: [-70, -20, 0],
        UpArmL: [-104, -6, 16], LoArmL: [-2, 0, 2], HandL: [-70, 20, 0],
        ThighL: [-24, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(0.94, {
        Hips: [-8, 12, 0], Hips_pos: [0, -0.10, -0.06], Chest: [-10, -4, 0], Head: [-14, -2, 0],
        UpArmR: [-102, 8, -14], LoArmR: [-4, 0, -2], UpArmL: [-104, -6, 16], LoArmL: [-2, 0, 2],
        ThighL: [-24, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0]
      }, 'hold'),
      // and the hands go back into the pockets
      K(1.30, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.038, 0], Spine: [0, -4, 0], Chest: [-2, -6, 0],
        Neck: [0, -2, 0], Head: [-4, -4, 0],
        UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0], HandL: [-14, 40, 0],
        UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0], HandR: [-14, -40, 0]
      }, 'out')
    ]
  },

  // ---- GOJO 【SHINJUKU】 — 赤, AT RANGE ZERO -------------------------------
  // No wind-up and no distance: the palm is already on their sternum when it
  // fires. He does not even square up to it — one hand, from the hip he is
  // standing on, at the range where a technique should be impossible.
  gojoPointBlank: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      K(0.12, {
        Hips: [0, 36, 0], Hips_pos: [0, -0.12, 0.02], Spine: [6, -14, 0], Chest: [4, -20, 0],
        Neck: [2, -4, 0], Head: [4, -14, 0],
        UpArmR: [-46, -22, -18], LoArmR: [-112, -14, -4], HandR: [-60, -60, 0],
        UpArmL: [-30, 14, 18], LoArmL: [-86, 8, 0],
        ThighL: [-28, -4, 0], ShinL: [22, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }, 'in'),
      // the palm arrives flat on the chest, fingers spread, elbow still bent —
      // it is a push, not a punch, and it has not fired yet
      K(0.24, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.13, 0.14], Spine: [2, -2, 0], Chest: [2, -2, 0],
        Neck: [0, 0, 0], Head: [0, -4, 0],
        UpArmR: [-86, 6, -10], LoArmR: [-34, 0, -2], HandR: [-88, -20, 0],
        UpArmL: [-36, 14, 20], LoArmL: [-92, 6, 0],
        ThighL: [-42, -4, 0], ShinL: [26, 0, 0], ThighR: [28, 6, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      // FIRE. The arm snaps straight and his own body is shoved back by it.
      K(0.34, {
        Hips: [-10, 16, 0], Hips_pos: [0, -0.10, -0.02], Spine: [-12, -4, 0], Chest: [-12, -6, 0],
        Neck: [-6, 0, 0], Head: [-18, -4, 0],
        UpArmR: [-98, 10, -6], LoArmR: [-2, 0, -2], HandR: [-70, -14, 0],
        UpArmL: [-40, 12, 26], LoArmL: [-70, 4, 0],
        ThighL: [-30, -4, 0], ShinL: [34, 0, 0], ThighR: [30, 6, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(0.58, {
        Hips: [-10, 16, 0], Hips_pos: [0, -0.10, -0.02], Chest: [-12, -6, 0], Head: [-18, -4, 0],
        UpArmR: [-98, 10, -6], LoArmR: [-2, 0, -2], UpArmL: [-40, 12, 26], LoArmL: [-70, 4, 0],
        ThighL: [-30, -4, 0], ShinL: [34, 0, 0], ThighR: [30, 6, 0], ShinR: [50, 0, 0]
      }, 'hold'),
      // and the hand goes straight back into the pocket
      K(0.86, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.040, 0], Spine: [-2, -6, 0], Chest: [-4, -8, 0],
        Neck: [0, -2, 0], Head: [-4, -6, 0],
        UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0], HandR: [-14, -40, 0],
        UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0], HandL: [-14, 40, 0]
      }, 'out'),
      K(1.10, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.036, 0], Head: [-2, -4, 0],
        UpArmR: [-8, -12, -14], LoArmR: [-56, -24, 0], UpArmL: [-8, 12, 14], LoArmL: [-56, 24, 0]
      }, 'hold')
    ]
  },

  // ---- SUKUNA — 解 --------------------------------------------------------
  // The reason Dismantle is frightening is that it costs him nothing. He does
  // not step, he does not turn, he does not look up: one hand comes out from
  // the fold, two fingers flick across at waist height, and the arm goes back
  // where it was. Everything else in the shot does the work.
  sukunaDismantle: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      // the arm unfolds — just the one, and only as far as it has to
      K(0.20, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.040, -0.02], Chest: [-5, -12, 0], Head: [-12, -16, 6],
        UpArmR: [-38, -18, -24], LoArmR: [-96, -20, 0], HandR: [-20, -60, 0],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0],
        UpArmR2: [-48, -24, 28], LoArmR2: [-118, -34, 0]
      }, 'in'),
      // THE FLICK. Across, at the speed of a man brushing off a sleeve.
      K(0.30, {
        Hips: [0, 6, 0], Hips_pos: [0, -0.044, 0], Spine: [-2, 6, 0], Chest: [-4, 10, 0],
        Neck: [-2, -2, 0], Head: [-10, -8, 4],
        UpArmR: [-74, 26, -30], LoArmR: [-14, 0, -4], HandR: [-16, -120, 0],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0],
        UpArmR2: [-46, -22, 30], LoArmR2: [-116, -32, 0]
      }, 'snap'),
      K(0.50, {
        Hips: [0, 6, 0], Hips_pos: [0, -0.044, 0], Chest: [-4, 10, 0], Head: [-10, -8, 4],
        UpArmR: [-72, 26, -30], LoArmR: [-16, 0, -4], HandR: [-16, -120, 0],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmL2: [-52, 26, -30], UpArmR2: [-46, -22, 30]
      }, 'hold'),
      // and it folds back into the stack of arms. He never stood up.
      K(0.78, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.040, -0.02], Spine: [-3, -7, 0], Chest: [-5, -12, 0],
        Neck: [-3, -4, 2], Head: [-14, -18, 7],
        UpArmR: [-60, -28, 20], LoArmR: [-124, -38, 0], HandR: [-20, -80, 0],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0],
        UpArmR2: [-48, -24, 28], LoArmR2: [-118, -34, 0]
      }, 'out'),
      K(1.15, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.040, -0.02], Chest: [-5, -12, 0], Head: [-14, -18, 7],
        UpArmL: [-64, 30, -22], LoArmL: [-120, 40, 0],
        UpArmR: [-60, -28, 20], LoArmR: [-124, -38, 0],
        UpArmL2: [-52, 26, -30], LoArmL2: [-114, 36, 0],
        UpArmR2: [-48, -24, 28], LoArmR2: [-118, -34, 0]
      }, 'hold')
    ]
  },

  // ---- NANAMI — 7:3 -------------------------------------------------------
  // A salaryman's swing: no flourish, both hands, straight down, and it stops
  // exactly where he decided it would stop. The blade is blunt, so the whole
  // shot is his shoulders and the fact that he does not follow through past
  // the line — he cuts to a mark, the way a man cuts to a mark at work.
  nanamiRatio: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // up. Both hands, over the shoulder, elbows high, and a half-step in.
      K(0.20, {
        Hips: [-10, 26, 0], Hips_pos: [0, -0.08, -0.06], Spine: [-14, -10, 0], Chest: [-16, -14, 0],
        Neck: [-6, -2, 0], Head: [-18, -10, 0],
        UpArmR: [-166, -12, -16], LoArmR: [-58, -6, -4], HandR: [-24, -74, 0],
        UpArmL: [-160, 16, 18], LoArmL: [-62, 8, 4], HandL: [-24, 74, 0],
        ThighL: [-20, -4, 0], ShinL: [18, 0, 0], ThighR: [16, 6, 0], ShinR: [26, 0, 0]
      }, 'in'),
      // one held frame at the top. He is choosing the line.
      K(0.32, {
        Hips: [-11, 26, 0], Hips_pos: [0, -0.075, -0.06], Spine: [-15, -10, 0], Head: [-19, -10, 0],
        UpArmR: [-168, -12, -16], LoArmR: [-56, -6, -4],
        UpArmL: [-162, 16, 18], LoArmL: [-60, 8, 4],
        ThighL: [-20, -4, 0], ShinL: [18, 0, 0], ThighR: [16, 6, 0], ShinR: [26, 0, 0]
      }, 'hold'),
      // DOWN, and it STOPS. Hands at his own waist height, blade through the
      // seven-three, nothing carried past it.
      // He stays UPRIGHT through it. A cut that ends with the man folded over
      // his own knees is a woodcutter's swing; his is a salaryman's, and the
      // only thing that travels is the blade.
      K(0.44, {
        Hips: [8, 18, 0], Hips_pos: [0, -0.16, 0.10], Spine: [12, -6, 0], Chest: [8, -8, 0],
        Neck: [4, 0, 0], Head: [10, -6, 0],
        UpArmR: [-44, 6, -12], LoArmR: [-24, 0, -2], HandR: [-30, -96, 0],
        UpArmL: [-48, -4, 14], LoArmL: [-22, 0, 2], HandL: [-30, 96, 0],
        ThighL: [-42, -4, 0], ShinL: [38, 0, 0], ThighR: [28, 6, 0], ShinR: [48, 0, 0]
      }, 'snap'),
      K(0.68, {
        Hips: [8, 18, 0], Hips_pos: [0, -0.16, 0.10], Spine: [12, -6, 0], Head: [10, -6, 0],
        UpArmR: [-44, 6, -12], LoArmR: [-24, 0, -2], UpArmL: [-48, -4, 14], LoArmL: [-22, 0, 2],
        ThighL: [-42, -4, 0], ShinL: [38, 0, 0], ThighR: [28, 6, 0], ShinR: [48, 0, 0]
      }, 'hold'),
      // he straightens up, squares the blade off, and that is the job done
      K(0.96, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.07, 0], Spine: [4, -8, 0], Chest: [2, -12, 0],
        Neck: [0, -2, 0], Head: [2, -8, 0],
        UpArmR: [-58, -12, -14], LoArmR: [-92, -12, 0], HandR: [-24, -78, 0],
        UpArmL: [-62, 14, 12], LoArmL: [-88, 14, 0], HandL: [-24, 78, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [28, 0, 0]
      }, 'out'),
      K(1.20, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.07, 0], Head: [2, -8, 0], Chest: [2, -12, 0],
        UpArmR: [-58, -12, -14], LoArmR: [-92, -12, 0], UpArmL: [-62, 14, 12], LoArmL: [-88, 14, 0]
      }, 'hold')
    ]
  },

  // ---- HIGURUMA — 死刑執行 -------------------------------------------------
  // The sentence, not a duel. The Executioner's Sword goes up in both hands
  // over a body that is already on its knees, hangs there for a full beat —
  // that beat is the verdict — and comes down through the top of them.
  higurumaExecute: {
    dur: 1.35, loop: false, keys: [
      K(0, {}),
      // both hands, straight up, blade vertical. The stance is a court's, not
      // a fighter's: square, feet level, no coil at all.
      K(0.26, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.06, 0], Spine: [-8, -2, 0], Chest: [-10, -4, 0],
        Neck: [-4, 0, 0], Head: [-14, -2, 0],
        UpArmR: [-176, -4, -10], LoArmR: [-16, 0, -2], HandR: [-20, -80, 0],
        UpArmL: [-174, 4, 12], LoArmL: [-14, 0, 2], HandL: [-20, 80, 0],
        ThighL: [-14, -4, 0], ShinL: [12, 0, 0], ThighR: [12, 6, 0], ShinR: [18, 0, 0]
      }, 'out'),
      // HELD. A full beat with the blade at the top of frame.
      K(0.62, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.055, 0], Spine: [-9, -2, 0], Head: [-15, -2, 0],
        UpArmR: [-178, -4, -10], LoArmR: [-14, 0, -2],
        UpArmL: [-176, 4, 12], LoArmL: [-12, 0, 2],
        ThighL: [-14, -4, 0], ShinL: [12, 0, 0], ThighR: [12, 6, 0], ShinR: [18, 0, 0]
      }, 'hold'),
      // DOWN. The whole body drops behind it — knees bent, hips under, the
      // blade finishing below his own waist.
      K(0.74, {
        Hips: [18, 10, 0], Hips_pos: [0, -0.30, 0.08], Spine: [28, -2, 0], Chest: [22, -4, 0],
        Neck: [10, 0, 0], Head: [22, -2, 0],
        UpArmR: [-24, 4, -8], LoArmR: [-8, 0, -2], HandR: [-30, -90, 0],
        UpArmL: [-22, -2, 10], LoArmL: [-6, 0, 2], HandL: [-30, 90, 0],
        ThighL: [-62, -4, 0], ShinL: [58, 0, 0], ThighR: [42, 6, 0], ShinR: [70, 0, 0]
      }, 'snap'),
      K(1.00, {
        Hips: [18, 10, 0], Hips_pos: [0, -0.30, 0.08], Spine: [28, -2, 0], Head: [22, -2, 0],
        UpArmR: [-24, 4, -8], LoArmR: [-8, 0, -2], UpArmL: [-22, -2, 10], LoArmL: [-6, 0, 2],
        ThighL: [-62, -4, 0], ShinL: [58, 0, 0], ThighR: [42, 6, 0], ShinR: [70, 0, 0]
      }, 'hold'),
      // and he stands, and lets the blade hang at his side. It is over.
      K(1.35, {
        Hips: [0, 12, 0], Hips_pos: [0, -0.05, 0], Spine: [2, -4, 0], Chest: [0, -6, 0],
        Neck: [-2, 0, 0], Head: [-6, -4, 0],
        UpArmR: [-16, -8, -14], LoArmR: [-34, -6, -2], HandR: [-20, -60, 0],
        UpArmL: [-14, 6, 16], LoArmL: [-30, 4, 2]
      }, 'out')
    ]
  },

  // ---- MAHITO — 無為転変, ON CONTACT ---------------------------------------
  // The horror is that it is not a blow. The palm is laid FLAT on the chest —
  // placed, the way you would steady somebody — held there while he looks at
  // their face with mild interest, and then the fingers press in half an inch.
  // That half inch is the kill.
  mahitoTransfigure: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.22, {
        Hips: [0, 16, 0], Hips_pos: [0, -0.05, 0.04], Spine: [2, -6, 0], Chest: [2, -8, 0],
        Neck: [-2, -2, 6], Head: [-6, -10, 12],
        UpArmR: [-68, -10, -14], LoArmR: [-84, -4, -4], HandR: [-70, -40, 0],
        UpArmL: [-20, 12, 16], LoArmL: [-62, 16, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [18, 6, 0], ShinR: [28, 0, 0]
      }, 'out'),
      // the palm lands, flat, and stops
      K(0.42, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.07, 0.12], Spine: [4, -2, 0], Chest: [4, -2, 0],
        Neck: [-2, 0, 6], Head: [-4, -6, 14],
        UpArmR: [-90, 2, -8], LoArmR: [-28, 0, -2], HandR: [-88, -16, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-70, 14, 0],
        ThighL: [-32, -4, 0], ShinL: [24, 0, 0], ThighR: [24, 6, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      // and it stays there. He tilts his head to see their face better.
      K(0.72, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.07, 0.12], Chest: [4, -2, 0],
        Neck: [-3, 0, 8], Head: [-6, -4, 18],
        UpArmR: [-90, 2, -8], LoArmR: [-28, 0, -2], HandR: [-88, -16, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-70, 14, 0],
        ThighL: [-32, -4, 0], ShinL: [24, 0, 0], ThighR: [24, 6, 0], ShinR: [38, 0, 0]
      }, 'hold'),
      // the fingers press. Nothing else in the body moves at all.
      K(0.84, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.08, 0.14], Chest: [6, -2, 0],
        Neck: [-2, 0, 6], Head: [-4, -6, 14],
        UpArmR: [-92, 2, -8], LoArmR: [-22, 0, -2], HandR: [-64, -24, 0],
        UpArmL: [-26, 12, 18], LoArmL: [-72, 14, 0],
        ThighL: [-34, -4, 0], ShinL: [26, 0, 0], ThighR: [26, 6, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      // and he takes the hand back and looks at it, not at them
      K(1.10, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.06, 0.02], Spine: [-2, -6, 0], Chest: [-2, -8, 0],
        Neck: [-4, -4, 4], Head: [-14, -14, 8],
        UpArmR: [-104, -6, -12], LoArmR: [-64, 0, -4], HandR: [-40, -30, 0],
        UpArmL: [-20, 12, 16], LoArmL: [-60, 16, 0]
      }, 'out'),
      K(1.30, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.06, 0.02], Chest: [-2, -8, 0], Head: [-14, -14, 8],
        UpArmR: [-106, -6, -12], LoArmR: [-62, 0, -4], UpArmL: [-20, 12, 16], LoArmL: [-60, 16, 0]
      }, 'hold')
    ]
  },

  // ---- TODO — 不義遊戯, FROM THE BLIND SIDE --------------------------------
  // The clap is not the attack, it is the setup: he swaps himself into the one
  // place they are not looking and hits them from there. So this clip opens
  // with the hands ALREADY together and finishes with a full-body palm — an
  // enormous man's weight arriving from a direction nobody was watching.
  todoBlindside: {
    dur: 1.05, loop: false, keys: [
      K(0, {}),
      // the clap, at chest height, and he is already grinning at where they
      // are going to be
      K(0.12, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.08, 0.02], Spine: [-4, -6, 0], Chest: [-6, -8, 0],
        Neck: [-4, 0, 0], Head: [-14, -4, 0],
        UpArmR: [-88, 4, -10], LoArmR: [-62, 0, -2], HandR: [-30, -40, 0],
        UpArmL: [-90, -2, 12], LoArmL: [-60, 0, 2], HandL: [-30, 40, 0],
        ThighL: [-20, -4, 0], ShinL: [16, 0, 0], ThighR: [16, 6, 0], ShinR: [26, 0, 0]
      }, 'snap'),
      // and he is somewhere else, turning into it
      K(0.34, {
        Hips: [0, 74, 0], Hips_pos: [0, -0.14, -0.06], Spine: [8, -30, 0], Chest: [6, -44, 0],
        Neck: [2, -10, 0], Head: [6, -34, 0],
        UpArmR: [-40, -30, -22], LoArmR: [-108, -12, -6], HandR: [-30, -70, 0],
        UpArmL: [-54, 24, 20], LoArmL: [-92, 10, 6],
        ThighL: [-26, -4, 0], ShinL: [22, 0, 0], ThighR: [22, 6, 0], ShinR: [36, 0, 0]
      }, 'in'),
      // THE PALM. Both hands, off the back foot, and everything he weighs.
      K(0.48, {
        Hips: [4, 2, 0], Hips_pos: [0, -0.16, 0.20], Spine: [10, 8, 0], Chest: [8, 14, 0],
        Neck: [2, 2, 0], Head: [4, 2, 0],
        UpArmR: [-84, 6, -8], LoArmR: [-6, 0, -2], HandR: [-90, -26, 0],
        UpArmL: [-82, -4, 10], LoArmL: [-8, 0, 2], HandL: [-90, 26, 0],
        ThighL: [-60, -4, 0], ShinL: [32, 0, 0], FootL: [-12, -10, 0],
        ThighR: [38, 6, 0], ShinR: [64, 0, 0], FootR: [22, 8, 0]
      }, 'snap'),
      K(0.72, {
        Hips: [4, 2, 0], Hips_pos: [0, -0.16, 0.20], Chest: [8, 14, 0], Head: [4, 2, 0],
        UpArmR: [-84, 6, -8], LoArmR: [-6, 0, -2], UpArmL: [-82, -4, 10], LoArmL: [-8, 0, 2],
        ThighL: [-60, -4, 0], ShinL: [32, 0, 0], ThighR: [38, 6, 0], ShinR: [64, 0, 0]
      }, 'hold'),
      // and he is laughing before the body has landed
      K(1.05, {
        Hips: [-10, 14, 0], Hips_pos: [0, -0.02, 0], Spine: [-20, -4, 0], Chest: [-24, -6, 0],
        Neck: [-10, 0, 0], Head: [-32, 0, 0],
        UpArmL: [-110, 10, 60], LoArmL: [-20, 0, 6], UpArmR: [-106, -8, -62], LoArmR: [-18, 0, -6]
      }, 'out')
    ]
  },

  // ---- HAKARI — 大当り -----------------------------------------------------
  // He is not fighting any more, he is DANCING — the whole point of Jackpot is
  // that a man with unlimited cursed energy stops being careful. Loose, wide,
  // both feet leaving the floor, and the punch arrives on the beat of the
  // music that is playing in his head.
  hakariJackpot: {
    dur: 1.25, loop: false, keys: [
      K(0, {}),
      // the step. Hips out, arms swinging across, head rolling with it.
      K(0.18, {
        Hips: [0, 44, -10], Hips_pos: [0.06, -0.10, -0.04], Spine: [-6, -18, 6], Chest: [-8, -26, 8],
        Neck: [-4, -6, 0], Head: [-16, -20, -6],
        UpArmR: [-30, -26, -34], LoArmR: [-96, -10, -6], HandR: [-20, -60, 0],
        UpArmL: [-84, 26, 30], LoArmL: [-70, 10, 6], HandL: [-20, 60, 0],
        ThighL: [-24, -6, 0], ShinL: [20, 0, 0], ThighR: [20, 8, 0], ShinR: [34, 0, 0]
      }, 'out'),
      // both feet leave the floor — this is a jump, not a step
      K(0.34, {
        Hips: [-6, 20, -4], Hips_pos: [0.02, 0.10, 0.04], Spine: [-10, -8, 2], Chest: [-12, -12, 4],
        Neck: [-6, -2, 0], Head: [-20, -8, -2],
        UpArmR: [-52, -20, -30], LoArmR: [-104, -8, -6], HandR: [-18, -70, 0],
        UpArmL: [-96, 20, 34], LoArmL: [-56, 8, 6],
        ThighL: [-64, -6, 0], ShinL: [70, 0, 0], ThighR: [-30, 8, 0], ShinR: [80, 0, 0]
      }, 'in'),
      // and it lands — a full overhand right coming DOWN, with all of the
      // jump behind it and the other arm thrown wide for the balance
      K(0.48, {
        Hips: [12, -18, 4], Hips_pos: [0, -0.20, 0.18], Spine: [16, 16, -4], Chest: [14, 24, -6],
        Neck: [4, 4, 0], Head: [10, 8, 4],
        UpArmR: [-116, 12, 4], LoArmR: [-10, 0, 0], HandR: [-10, -160, 0],
        UpArmL: [-40, 10, 54], LoArmL: [-24, 0, 6], HandL: [-16, 50, 0],
        ThighL: [-58, -6, 0], ShinL: [40, 0, 0], FootL: [-14, -10, 0],
        ThighR: [36, 8, 0], ShinR: [62, 0, 0], FootR: [20, 8, 0]
      }, 'snap'),
      K(0.72, {
        Hips: [12, -18, 4], Hips_pos: [0, -0.20, 0.18], Chest: [14, 24, -6], Head: [10, 8, 4],
        UpArmR: [-114, 12, 4], LoArmR: [-12, 0, 0], UpArmL: [-40, 10, 54], LoArmL: [-24, 0, 6],
        ThighL: [-58, -6, 0], ShinL: [40, 0, 0], ThighR: [36, 8, 0], ShinR: [62, 0, 0]
      }, 'hold'),
      // and straight back into the dance, both arms up, delighted
      K(1.00, {
        Hips: [-12, 16, 6], Hips_pos: [-0.04, 0.00, -0.02], Spine: [-22, -6, -4], Chest: [-24, -8, -6],
        Neck: [-10, 0, 0], Head: [-34, -4, 4],
        UpArmL: [-118, 10, 58], LoArmL: [-26, 0, 6], HandL: [-20, 40, 0],
        UpArmR: [-112, -8, -60], LoArmR: [-24, 0, -6], HandR: [-20, -40, 0],
        ThighL: [-18, -6, 0], ShinL: [14, 0, 0], ThighR: [14, 8, 0], ShinR: [22, 0, 0]
      }, 'snap'),
      K(1.25, {
        Hips: [-8, 16, 4], Hips_pos: [-0.03, -0.02, -0.02], Chest: [-20, -8, -4], Head: [-30, -4, 2],
        UpArmL: [-112, 10, 56], LoArmL: [-30, 0, 6], UpArmR: [-106, -8, -58], LoArmR: [-28, 0, -6]
      }, 'hold')
    ]
  },

  // ---- NOBARA — 共鳴り ----------------------------------------------------
  // She is not attacking them; she is doing carpentry, and they happen to be
  // on the other end of it. Doll held out at arm's length in the off hand,
  // nail set into it, hammer swung once — a short, flat, workmanlike swing —
  // and she does not look at the target at all until after it lands.
  nobaraResonance: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // doll out, nail set, hammer cocked back over the shoulder
      K(0.20, {
        Hips: [0, 28, -4], Hips_pos: [-0.03, -0.06, -0.02], Spine: [-2, -12, 3], Chest: [-4, -16, 4],
        Neck: [0, -4, 0], Head: [-6, -14, -2],
        UpArmL: [-96, 10, 14], LoArmL: [-28, 0, 4], HandL: [-40, 60, 0],
        UpArmR: [-146, -14, -18], LoArmR: [-58, -4, -4], HandR: [-24, -70, 0],
        ThighL: [-16, -6, 0], ShinL: [14, 0, 0], ThighR: [18, 8, 0], ShinR: [28, 0, 0]
      }, 'in'),
      // she looks at THE DOLL, not at them
      K(0.36, {
        Hips: [0, 28, -4], Hips_pos: [-0.03, -0.06, -0.02], Chest: [-4, -16, 4],
        Neck: [4, -2, 0], Head: [16, -22, -2],
        UpArmL: [-98, 10, 14], LoArmL: [-26, 0, 4], UpArmR: [-148, -14, -18], LoArmR: [-56, -4, -4],
        ThighL: [-16, -6, 0], ShinL: [14, 0, 0], ThighR: [18, 8, 0], ShinR: [28, 0, 0]
      }, 'hold'),
      // ONE SWING. Short, flat, entirely from the elbow.
      K(0.48, {
        Hips: [4, 20, -2], Hips_pos: [-0.02, -0.10, 0.04], Spine: [8, -8, 2], Chest: [6, -10, 2],
        Neck: [6, -2, 0], Head: [18, -16, -2],
        UpArmL: [-94, 8, 12], LoArmL: [-30, 0, 4], HandL: [-40, 60, 0],
        UpArmR: [-78, 8, -12], LoArmR: [-46, 0, -4], HandR: [-30, -110, 0],
        ThighL: [-30, -6, 0], ShinL: [26, 0, 0], ThighR: [24, 8, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      K(0.68, {
        Hips: [4, 20, -2], Hips_pos: [-0.02, -0.10, 0.04], Chest: [6, -10, 2], Head: [18, -16, -2],
        UpArmL: [-94, 8, 12], LoArmL: [-30, 0, 4], UpArmR: [-76, 8, -12], LoArmR: [-48, 0, -4],
        ThighL: [-30, -6, 0], ShinL: [26, 0, 0], ThighR: [24, 8, 0], ShinR: [40, 0, 0]
      }, 'hold'),
      // NOW she looks up at them, and she is enjoying it enormously
      K(0.92, {
        Hips: [0, 22, -4], Hips_pos: [-0.03, -0.05, 0], Spine: [-2, -10, 3], Chest: [-4, -14, 4],
        Neck: [-2, -2, 0], Head: [-14, -8, -4],
        UpArmL: [-72, 16, 20], LoArmL: [-50, 4, 4], HandL: [-30, 60, 0],
        UpArmR: [-34, -12, -26], LoArmR: [-64, -6, -4], HandR: [-20, -60, 0],
        ThighL: [-16, -6, 0], ShinL: [14, 0, 0], ThighR: [18, 8, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      K(1.20, {
        Hips: [0, 22, -4], Hips_pos: [-0.03, -0.05, 0], Chest: [-4, -14, 4], Head: [-14, -8, -4],
        UpArmL: [-72, 16, 20], LoArmL: [-50, 4, 4], UpArmR: [-34, -12, -26], LoArmR: [-64, -6, -4]
      }, 'hold')
    ]
  },

  // ---- PANDA — 突貫 -------------------------------------------------------
  // The Gorilla core does not box. It gets low, it comes forward off both
  // knuckles, and it arrives as one mass — the shoulder is the weapon and the
  // fist is just the part that touches.
  pandaCharge: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      // down onto the knuckles, weight all the way back
      K(0.18, {
        Hips: [22, 20, 0], Hips_pos: [0, -0.28, -0.10], Spine: [28, -8, 0], Chest: [22, -12, 0],
        Neck: [6, 0, 0], Head: [10, -8, 0],
        UpArmL: [-22, 10, 22], LoArmL: [-30, 0, 6], HandL: [-40, 40, 0],
        UpArmR: [-18, -8, -24], LoArmR: [-26, 0, -6], HandR: [-40, -40, 0],
        ThighL: [-54, -4, 0], ShinL: [56, 0, 0], ThighR: [40, 6, 0], ShinR: [66, 0, 0]
      }, 'in'),
      // and everything goes forward at once. Shoulder first.
      K(0.32, {
        Hips: [10, -6, 0], Hips_pos: [0, -0.18, 0.24], Spine: [18, 14, 0], Chest: [16, 22, 0],
        Neck: [4, 4, 0], Head: [8, 6, 0],
        UpArmR: [-98, 10, 0], LoArmR: [-4, 0, 0], HandR: [-6, -166, 0],
        UpArmL: [-34, 8, 40], LoArmL: [-40, 0, 6],
        ThighL: [-66, -4, 0], ShinL: [34, 0, 0], FootL: [-16, -10, 0],
        ThighR: [42, 6, 0], ShinR: [70, 0, 0], FootR: [24, 8, 0]
      }, 'snap'),
      K(0.56, {
        Hips: [10, -6, 0], Hips_pos: [0, -0.18, 0.24], Chest: [16, 22, 0], Head: [8, 6, 0],
        UpArmR: [-98, 10, 0], LoArmR: [-4, 0, 0], UpArmL: [-34, 8, 40], LoArmL: [-40, 0, 6],
        ThighL: [-66, -4, 0], ShinL: [34, 0, 0], ThighR: [42, 6, 0], ShinR: [70, 0, 0]
      }, 'hold'),
      // up onto both feet, chest out, arms wide. The core is showing.
      K(0.86, {
        Hips: [-14, 14, 0], Hips_pos: [0, 0.02, 0.02], Spine: [-24, -6, 0], Chest: [-28, -8, 0],
        Neck: [-10, 0, 0], Head: [-32, -4, 0],
        UpArmL: [-104, 12, 58], LoArmL: [-40, 0, 6], HandL: [-30, 40, 0],
        UpArmR: [-100, -10, -60], LoArmR: [-38, 0, -6], HandR: [-30, -40, 0],
        ThighL: [-16, -4, 0], ShinL: [14, 0, 0], ThighR: [12, 6, 0], ShinR: [20, 0, 0]
      }, 'snap'),
      K(1.10, {
        Hips: [-10, 14, 0], Hips_pos: [0, 0.00, 0.02], Chest: [-24, -8, 0], Head: [-28, -4, 0],
        UpArmL: [-98, 12, 56], LoArmL: [-46, 0, 6], UpArmR: [-94, -10, -58], LoArmR: [-44, 0, -6]
      }, 'hold')
    ]
  },

  // ---- YUTA — リカと二人で ------------------------------------------------
  // He never swings alone. The cut is a two-handed sword stroke that starts
  // low and finishes high across the body, and the reason it is a finisher is
  // what is standing behind him doing the same thing — so the clip leaves the
  // arms open at the top rather than recovering, because the shot after it
  // belongs to her.
  yutaRikaCut: {
    dur: 1.25, loop: false, keys: [
      K(0, {}),
      // low, both hands, blade back past the hip
      K(0.20, {
        Hips: [0, 58, 0], Hips_pos: [0, -0.16, -0.06], Spine: [10, -22, 0], Chest: [8, -32, 0],
        Neck: [2, -8, 0], Head: [8, -26, 0],
        UpArmR: [-24, -30, -18], LoArmR: [-100, -14, -4], HandR: [-30, -70, 0],
        UpArmL: [-40, 26, 12], LoArmL: [-96, 22, 0], HandL: [-30, 70, 0],
        ThighL: [-30, -4, 0], ShinL: [26, 0, 0], ThighR: [24, 6, 0], ShinR: [40, 0, 0]
      }, 'in'),
      // UP AND ACROSS. Rising diagonal, hips leading, and he finishes with
      // both hands above his own shoulder.
      K(0.34, {
        Hips: [-6, -30, 0], Hips_pos: [0, -0.08, 0.16], Spine: [-14, 26, 0], Chest: [-18, 36, 0],
        Neck: [-8, 8, 0], Head: [-24, 14, 0],
        UpArmR: [-146, 22, -6], LoArmR: [-18, 0, -2], HandR: [-24, -110, 0],
        UpArmL: [-138, -10, 14], LoArmL: [-22, 0, 2], HandL: [-24, 110, 0],
        ThighL: [-48, -4, 0], ShinL: [28, 0, 0], ThighR: [30, 6, 0], ShinR: [52, 0, 0]
      }, 'snap'),
      K(0.58, {
        Hips: [-6, -30, 0], Hips_pos: [0, -0.08, 0.16], Chest: [-18, 36, 0], Head: [-24, 14, 0],
        UpArmR: [-146, 22, -6], LoArmR: [-18, 0, -2], UpArmL: [-138, -10, 14], LoArmL: [-22, 0, 2],
        ThighL: [-48, -4, 0], ShinL: [28, 0, 0], ThighR: [30, 6, 0], ShinR: [52, 0, 0]
      }, 'hold'),
      // the blade comes down to a guard and he turns his head to the empty
      // air beside him, because somebody is standing there
      K(0.90, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.10, 0.02], Spine: [4, -10, 0], Chest: [2, -14, 0],
        Neck: [-2, -10, 0], Head: [-6, -34, 0],
        UpArmR: [-62, -14, -14], LoArmR: [-94, -12, 0], HandR: [-26, -80, 0],
        UpArmL: [-66, 16, 12], LoArmL: [-90, 14, 0], HandL: [-26, 80, 0],
        ThighL: [-26, -4, 0], ShinL: [22, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }, 'out'),
      K(1.25, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.10, 0.02], Chest: [2, -14, 0], Head: [-6, -34, 0],
        UpArmR: [-62, -14, -14], LoArmR: [-94, -12, 0], UpArmL: [-66, 16, 12], LoArmL: [-90, 14, 0]
      }, 'hold')
    ]
  },

  // ---- GETO — 極ノ番・うずまき ---------------------------------------------
  // Serene the whole way. The ball is already assembled above his open palm;
  // all he does is turn the wrist over and let go of it, and the only violent
  // thing in the clip is how little effort it takes.
  getoUzumaki: {
    dur: 1.35, loop: false, keys: [
      K(0, {}),
      // the palm comes up under it, elbow at his own waist
      K(0.24, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.05, 0], Spine: [-2, -8, 0], Chest: [-4, -10, 0],
        Neck: [-2, 0, 0], Head: [-8, -8, 0],
        UpArmR: [-70, -8, -16], LoArmR: [-90, -8, -2], HandR: [-88, -30, 0],
        UpArmL: [-16, 12, 14], LoArmL: [-56, 18, 0]
      }, 'out'),
      // he looks up at it, once, the way you check the weather
      K(0.52, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.05, 0], Chest: [-4, -10, 0],
        Neck: [-6, 0, 0], Head: [-24, -8, 0],
        UpArmR: [-72, -8, -16], LoArmR: [-88, -8, -2], HandR: [-90, -30, 0],
        UpArmL: [-16, 12, 14], LoArmL: [-56, 18, 0]
      }, 'hold'),
      // and he pushes it away from himself. One arm. No effort at all.
      K(0.72, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.09, 0.10], Spine: [6, -2, 0], Chest: [6, -2, 0],
        Neck: [2, 0, 0], Head: [2, -4, 0],
        UpArmR: [-98, 6, -6], LoArmR: [-6, 0, -2], HandR: [-70, -20, 0],
        UpArmL: [-24, 12, 18], LoArmL: [-70, 14, 0],
        ThighL: [-36, -4, 0], ShinL: [28, 0, 0], ThighR: [26, 6, 0], ShinR: [42, 0, 0]
      }, 'snap'),
      K(1.00, {
        Hips: [0, 8, 0], Hips_pos: [0, -0.09, 0.10], Chest: [6, -2, 0], Head: [2, -4, 0],
        UpArmR: [-100, 6, -6], LoArmR: [-4, 0, -2], UpArmL: [-24, 12, 18], LoArmL: [-70, 14, 0],
        ThighL: [-36, -4, 0], ShinL: [28, 0, 0], ThighR: [26, 6, 0], ShinR: [42, 0, 0]
      }, 'hold'),
      // and the hand goes back into his sleeve. He has not moved his feet.
      K(1.35, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.045, -0.02], Spine: [-2, -8, 0], Chest: [-4, -12, 0],
        Neck: [-2, -2, 0], Head: [-8, -10, 0],
        UpArmR: [-22, -12, -16], LoArmR: [-66, -18, 0], HandR: [-20, -50, 0],
        UpArmL: [-16, 12, 14], LoArmL: [-56, 18, 0]
      }, 'out')
    ]
  },

  // ---- KASHIMO — 幻獣琥珀, THROUGH ------------------------------------------
  // Four hundred years of boredom end with him closing the distance himself.
  // The staff is held one-handed, low, and it goes straight through — a
  // fencer's lunge with a lightning rod, and the free hand trails behind him.
  kashimoLance: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      // the coil — staff drawn back level with his own ribs
      K(0.16, {
        Hips: [0, 62, 0], Hips_pos: [0, -0.12, -0.08], Spine: [4, -24, 0], Chest: [2, -34, 0],
        Neck: [0, -10, 0], Head: [2, -28, 0],
        UpArmR: [-40, -34, -16], LoArmR: [-112, -16, -4], HandR: [-24, -66, 0],
        UpArmL: [-32, 26, 18], LoArmL: [-84, 16, 4], HandL: [-20, 60, 0],
        ThighL: [-22, -4, 0], ShinL: [20, 0, 0], ThighR: [18, 6, 0], ShinR: [32, 0, 0]
      }, 'in'),
      // THE LUNGE. Front leg fully out, back leg straight behind, staff arm
      // locked, free arm trailing — everything on one line.
      K(0.30, {
        Hips: [4, 6, 0], Hips_pos: [0, -0.26, 0.28], Spine: [10, 14, 0], Chest: [8, 20, 0],
        Neck: [2, 4, 0], Head: [6, 4, 0],
        UpArmR: [-94, 8, -4], LoArmR: [-2, 0, -2], HandR: [-16, -104, 0],
        UpArmL: [-6, 14, 26], LoArmL: [-16, 0, 4], HandL: [-16, 40, 0],
        ThighL: [-84, -4, 0], ShinL: [34, 0, 0], FootL: [-14, -10, 0],
        ThighR: [46, 6, 0], ShinR: [24, 0, 0], FootR: [30, 8, 0]
      }, 'snap'),
      K(0.54, {
        Hips: [4, 6, 0], Hips_pos: [0, -0.26, 0.28], Chest: [8, 20, 0], Head: [6, 4, 0],
        UpArmR: [-94, 8, -4], LoArmR: [-2, 0, -2], UpArmL: [-6, 14, 26], LoArmL: [-16, 0, 4],
        ThighL: [-84, -4, 0], ShinL: [34, 0, 0], ThighR: [46, 6, 0], ShinR: [24, 0, 0]
      }, 'hold'),
      // he withdraws it and plants the staff — and he is disappointed again
      K(0.84, {
        Hips: [8, 20, 0], Hips_pos: [0, -0.18, 0.04], Spine: [14, -8, 0], Chest: [12, -10, 0],
        Neck: [4, 0, 0], Head: [10, -8, 0],
        UpArmR: [-30, 4, -16], LoArmR: [-34, 0, -4], HandR: [-40, -70, 0],
        UpArmL: [-20, 12, 20], LoArmL: [-50, 0, 4],
        ThighL: [-42, -4, 0], ShinL: [38, 0, 0], ThighR: [30, 6, 0], ShinR: [50, 0, 0]
      }, 'out'),
      K(1.15, {
        Hips: [4, 20, 0], Hips_pos: [0, -0.14, 0.02], Chest: [8, -10, 0], Head: [6, -8, 0],
        UpArmR: [-28, 4, -16], LoArmR: [-36, 0, -4], UpArmL: [-18, 12, 20], LoArmL: [-52, 0, 4]
      }, 'hold')
    ]
  },

  // ---- CHOSO — 穿血 -------------------------------------------------------
  // Two fingers, and the whole body behind them like a rifle. He plants, sets
  // his shoulder, sights down his own arm — and the only thing that moves on
  // the shot is the recoil going back through him.
  chosoPierce: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // the plant. Side-on, shoulder in line, off hand bracing the wrist.
      K(0.22, {
        Hips: [0, 46, 0], Hips_pos: [0, -0.12, -0.02], Spine: [2, -18, 0], Chest: [0, -26, 0],
        Neck: [2, -6, 0], Head: [4, -18, 0],
        UpArmR: [-88, -6, -10], LoArmR: [-30, 0, -2], HandR: [-60, -40, 0],
        UpArmL: [-70, 22, 8], LoArmL: [-96, 26, 0], HandL: [-30, 80, 0],
        ThighL: [-28, -4, 0], ShinL: [24, 0, 0], ThighR: [22, 6, 0], ShinR: [38, 0, 0]
      }, 'in'),
      // sighting. Absolutely still, head down behind the arm.
      K(0.46, {
        Hips: [0, 46, 0], Hips_pos: [0, -0.125, -0.02], Chest: [0, -26, 0],
        Neck: [4, -8, 0], Head: [10, -24, 0],
        UpArmR: [-94, -4, -8], LoArmR: [-18, 0, -2], HandR: [-60, -30, 0],
        UpArmL: [-72, 22, 8], LoArmL: [-94, 26, 0],
        ThighL: [-28, -4, 0], ShinL: [24, 0, 0], ThighR: [22, 6, 0], ShinR: [38, 0, 0]
      }, 'hold'),
      // FIRE. The recoil throws the shoulder back and lifts the arm.
      K(0.58, {
        Hips: [-6, 50, 0], Hips_pos: [0, -0.10, -0.10], Spine: [-8, -20, 0], Chest: [-10, -28, 0],
        Neck: [-4, -6, 0], Head: [-14, -20, 0],
        UpArmR: [-112, -6, -6], LoArmR: [-8, 0, -2], HandR: [-50, -24, 0],
        UpArmL: [-58, 24, 14], LoArmL: [-80, 28, 0],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(0.84, {
        Hips: [-6, 50, 0], Hips_pos: [0, -0.10, -0.10], Chest: [-10, -28, 0], Head: [-14, -20, 0],
        UpArmR: [-112, -6, -6], LoArmR: [-8, 0, -2], UpArmL: [-58, 24, 14], LoArmL: [-80, 28, 0],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [44, 0, 0]
      }, 'hold'),
      // the hand drops and he squares up again. It cost him blood and it shows.
      K(1.20, {
        Hips: [0, 28, 0], Hips_pos: [0, -0.10, 0], Spine: [6, -12, 0], Chest: [4, -16, 0],
        Neck: [2, -2, 0], Head: [6, -12, 0],
        UpArmR: [-30, -14, -20], LoArmR: [-72, -14, 0], HandR: [-20, -60, 0],
        UpArmL: [-34, 16, 22], LoArmL: [-68, 12, 0]
      }, 'out')
    ]
  },

  // ---- HANAMI — 杜 --------------------------------------------------------
  // It does not strike. It closes its hand — the seed is already under them,
  // and the fist is the only instruction the ground needs.
  hanamiClench: {
    dur: 1.10, loop: false, keys: [
      K(0, {}),
      // the arm comes out, palm open, over where the seed went in
      K(0.24, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.08, 0.02], Spine: [6, -6, 0], Chest: [4, -8, 0],
        Neck: [2, 0, 0], Head: [6, -6, 0],
        UpArmR: [-86, 2, -10], LoArmR: [-34, 0, -4], HandR: [-84, -20, 0],
        UpArmL: [-24, 12, 20], LoArmL: [-70, 6, 4],
        ThighL: [-24, -4, 0], ShinL: [20, 0, 0], ThighR: [20, 6, 0], ShinR: [32, 0, 0]
      }, 'out'),
      K(0.52, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.08, 0.02], Chest: [4, -8, 0], Head: [6, -6, 0],
        UpArmR: [-88, 2, -10], LoArmR: [-32, 0, -4], HandR: [-86, -20, 0],
        UpArmL: [-24, 12, 20], LoArmL: [-70, 6, 4]
      }, 'hold'),
      // THE FIST. One movement, and everything under them comes up.
      K(0.64, {
        Hips: [4, 12, 0], Hips_pos: [0, -0.12, 0.04], Spine: [10, -6, 0], Chest: [8, -8, 0],
        Neck: [4, 0, 0], Head: [10, -6, 0],
        UpArmR: [-80, 4, -14], LoArmR: [-58, 0, -4], HandR: [-40, -50, 0],
        UpArmL: [-28, 12, 22], LoArmL: [-76, 6, 4],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [42, 0, 0]
      }, 'snap'),
      K(0.88, {
        Hips: [4, 12, 0], Hips_pos: [0, -0.12, 0.04], Chest: [8, -8, 0], Head: [10, -6, 0],
        UpArmR: [-80, 4, -14], LoArmR: [-58, 0, -4], UpArmL: [-28, 12, 22], LoArmL: [-76, 6, 4],
        ThighL: [-34, -4, 0], ShinL: [30, 0, 0], ThighR: [26, 6, 0], ShinR: [42, 0, 0]
      }, 'hold'),
      K(1.10, {}, 'out')
    ]
  },

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

  // ---- INUMAKI — THE COLLAR COMES DOWN -----------------------------------
  // Not a strike. A DECISION, and the whole finisher turns on it.
  //
  // Everything he does is built to avoid this: the collar is a garment worn so
  // that a technique cannot go off by accident, and taking it off is the one
  // thing he never does casually. So the clip is authored as reluctance
  // followed by commitment — both hands come up, he hesitates with them on it,
  // and then he HAULS it down in a single frame and squares up.
  //
  // The garment itself is not animated here. It is geometry on its own pivot
  // (art/models/inumaki.js `setCollar`), driven from the registry's `fx` hook,
  // so the cloth answers to the beat rather than to this clip's playback rate.
  inumakiCollar: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      // both hands to the collar, head down. He is not looking at them.
      K(0.28, {
        Hips: [0, 32, 0], Hips_pos: [0, -0.075, -0.02],
        Spine: [13, -8, 0], Chest: [15, -10, 0], Neck: [8, -2, 0], Head: [13, -8, 0],
        ClavL: [11, 0, 0], ClavR: [11, 0, 0],
        UpArmL: [-66, 16, -4], LoArmL: [-126, 58, 0], HandL: [-30, 60, 0],
        UpArmR: [-64, -14, 5], LoArmR: [-128, -56, 0], HandR: [-30, -60, 0]
      }, 'in'),
      // the hesitation. Nothing moves for a third of a second.
      K(0.62, {
        Hips: [0, 32, 0], Hips_pos: [0, -0.082, -0.02],
        Spine: [15, -8, 0], Chest: [17, -10, 0], Neck: [9, -2, 0], Head: [15, -8, 0],
        ClavL: [12, 0, 0], ClavR: [12, 0, 0],
        UpArmL: [-68, 16, -4], LoArmL: [-130, 58, 0], HandL: [-31, 60, 0],
        UpArmR: [-66, -14, 5], LoArmR: [-132, -56, 0], HandR: [-31, -60, 0]
      }, 'hold'),
      // DOWN. One frame. The hands drag to the collarbone and the chin comes
      // up for the first time in the fight.
      K(0.76, {
        Hips: [0, 12, 0], Hips_pos: [0, -0.052, 0.03],
        Spine: [2, -4, 0], Chest: [-2, -6, 0], Neck: [-8, -2, 0], Head: [-13, -4, 0],
        ClavL: [-4, 0, 0], ClavR: [-4, 0, 0],
        UpArmL: [-40, 14, 6], LoArmL: [-58, 30, 0], HandL: [-16, 44, 0],
        UpArmR: [-38, -12, -7], LoArmR: [-56, -28, 0], HandR: [-16, -44, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [16, 6, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      // and the hands fall away. He is standing square for the first time.
      K(1.20, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.050, 0.03],
        Spine: [4, -4, 0], Chest: [0, -6, 0], Neck: [-6, -2, 0], Head: [-10, -4, 0],
        ClavL: [-2, 0, 0], ClavR: [-2, 0, 0],
        UpArmL: [-12, 12, 4], LoArmL: [-34, 26, 0], HandL: [-12, 46, 0],
        UpArmR: [-10, -10, -5], LoArmR: [-32, -24, 0], HandR: [-12, -46, 0],
        ThighL: [-22, -4, 0], ShinL: [18, 0, 0], ThighR: [16, 6, 0], ShinR: [28, 0, 0]
      }, 'out')
    ]
  },

  // ---- INUMAKI — THE THROAT GIVES OUT ------------------------------------
  // The beat this whole finisher exists for, and the reason it is HIS.
  //
  // Sourced: at the Kyoto Goodwill Event his throat was bleeding after a
  // handful of commands aimed at a special grade — and he stepped back up and
  // said another one anyway, so Megumi would not have to fight it alone. That
  // is the moment. Not the kill; the price of the kill, taken on purpose.
  //
  // So the clip is a body failing: the knees go, he folds over his own throat,
  // one hand clamps under the jaw, and there is a cough he cannot stop. Then —
  // and this is the only part that matters — he STRAIGHTENS. Not all the way,
  // and not quickly. He gets his chin back up with one hand still on his neck,
  // and the last key is him deciding to say one more word.
  inumakiThroat: {
    dur: 1.60, loop: false, keys: [
      K(0, {}),
      // it goes. The whole frame collapses forward at once.
      //
      // THE FOLD IS 24 DEGREES, NOT 35, and that number was set by looking at
      // it rather than by authoring it: past about twenty-five degrees of
      // combined spine and head lean the camera stops seeing a face and starts
      // seeing a crown, and this is the one beat in the finisher that is
      // entirely about his face. The read comes from the KNEES and the
      // shoulders instead — they carry the collapse, and the head only has to
      // come down enough to agree with them.
      K(0.14, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.145, 0.04],
        Spine: [20, -6, 0], Chest: [22, -8, 0], Neck: [13, -2, 0], Head: [19, -6, 0],
        ClavL: [18, 0, 0], ClavR: [18, 0, 0],
        UpArmR: [-74, -14, 6], LoArmR: [-138, -58, 0], HandR: [-36, -64, 0],
        UpArmL: [-30, 16, 10], LoArmL: [-84, 34, 0], HandL: [-18, 48, 0],
        ThighL: [-30, -6, 0], ShinL: [40, 0, 0], ThighR: [24, 8, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      // the cough. Two hard convulsions through the chest, and nothing else in
      // the body moves — a cough is the ribs, not the arms.
      K(0.36, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.170, 0.05],
        Spine: [25, -6, 0], Chest: [28, -8, 0], Neck: [17, -2, 0], Head: [25, -6, 0],
        ClavL: [21, 0, 0], ClavR: [21, 0, 0],
        UpArmR: [-76, -14, 6], LoArmR: [-140, -58, 0], HandR: [-38, -64, 0],
        UpArmL: [-32, 16, 10], LoArmL: [-86, 34, 0], HandL: [-18, 48, 0],
        ThighL: [-34, -6, 0], ShinL: [44, 0, 0], ThighR: [26, 8, 0], ShinR: [48, 0, 0]
      }, 'snap'),
      K(0.52, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.150, 0.05],
        Spine: [21, -6, 0], Chest: [23, -8, 0], Neck: [14, -2, 0], Head: [20, -6, 0],
        ClavL: [18, 0, 0], ClavR: [18, 0, 0],
        UpArmR: [-74, -14, 6], LoArmR: [-138, -58, 0], HandR: [-36, -64, 0],
        UpArmL: [-30, 16, 10], LoArmL: [-84, 34, 0], HandL: [-18, 48, 0],
        ThighL: [-32, -6, 0], ShinL: [42, 0, 0], ThighR: [25, 8, 0], ShinR: [46, 0, 0]
      }, 'out'),
      K(0.70, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.176, 0.05],
        Spine: [26, -6, 0], Chest: [29, -8, 0], Neck: [18, -2, 0], Head: [27, -6, 0],
        ClavL: [22, 0, 0], ClavR: [22, 0, 0],
        UpArmR: [-77, -14, 6], LoArmR: [-141, -58, 0], HandR: [-39, -64, 0],
        UpArmL: [-33, 16, 10], LoArmL: [-87, 34, 0], HandL: [-18, 48, 0],
        ThighL: [-35, -6, 0], ShinL: [45, 0, 0], ThighR: [27, 8, 0], ShinR: [49, 0, 0]
      }, 'snap'),
      // and he holds there, bent over it, for long enough that it reads as
      // over. That hold is what makes the next key mean something.
      K(1.02, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.168, 0.05],
        Spine: [25, -6, 0], Chest: [28, -8, 0], Neck: [17, -2, 0], Head: [26, -6, 0],
        ClavL: [21, 0, 0], ClavR: [21, 0, 0],
        UpArmR: [-76, -14, 6], LoArmR: [-140, -58, 0], HandR: [-38, -64, 0],
        UpArmL: [-32, 16, 10], LoArmL: [-86, 34, 0], HandL: [-18, 48, 0],
        ThighL: [-34, -6, 0], ShinL: [44, 0, 0], ThighR: [26, 8, 0], ShinR: [48, 0, 0]
      }, 'hold'),
      // HE STRAIGHTENS. Slowly, and not all the way. The right hand stays on
      // his throat the entire time — he is holding it together, not recovered.
      K(1.60, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.088, 0.03],
        Spine: [10, -6, 0], Chest: [8, -8, 0], Neck: [-2, -2, 0], Head: [-4, -6, 0],
        ClavL: [8, 0, 0], ClavR: [12, 0, 0],
        UpArmR: [-62, -14, 4], LoArmR: [-126, -54, 0], HandR: [-30, -58, 0],
        UpArmL: [-14, 14, 6], LoArmL: [-44, 28, 0], HandL: [-12, 48, 0],
        ThighL: [-26, -4, 0], ShinL: [24, 0, 0], ThighR: [18, 6, 0], ShinR: [32, 0, 0]
      }, 'out')
    ]
  },

  // ---- INUMAKI — THE COLLAR GOES BACK UP ---------------------------------
  // The hero pose, and it is deliberately the smallest one in this file.
  //
  // Every other winner in the game is left DOING something — Toji walks off,
  // Todo laughs, Nanami checks his watch, Mahito looks at his own hand. He
  // pulls his collar back over his mouth, puts his hand in his pocket, and
  // looks at the floor. He is not pleased, he is not vindicated, and he has
  // nothing to say about it — which for a character whose entire kit is
  // speaking is the only ending that reads.
  //
  // The last key is his STANCE, exactly: he finishes the match standing the
  // way he started it.
  inumakiCollarUp: {
    dur: 1.55, loop: false, keys: [
      K(0, {}),
      // the hand comes up to the collar — the same gesture as `inumakiCollar`,
      // played backwards, which is the point
      K(0.34, {
        Hips: [0, 22, 0], Hips_pos: [0, -0.070, 0],
        Spine: [10, -8, 0], Chest: [11, -11, 0], Neck: [4, -3, 0], Head: [8, -8, 0],
        ClavR: [12, 0, 0],
        UpArmR: [-60, -14, 4], LoArmR: [-122, -54, 0], HandR: [-32, -58, 0],
        UpArmL: [-12, 12, -4], LoArmL: [-28, 42, 0], HandL: [-10, 56, 0]
      }, 'in'),
      // UP. One movement, and the mouth is covered again.
      K(0.62, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.058, 0],
        Spine: [6, -9, 0], Chest: [6, -12, 0], Neck: [-2, -4, 0], Head: [-2, -10, 0],
        ClavR: [4, 0, 0],
        UpArmR: [-52, -14, 2], LoArmR: [-112, -50, 0], HandR: [-26, -56, 0],
        UpArmL: [-10, 12, -4], LoArmL: [-26, 42, 0], HandL: [-10, 56, 0]
      }, 'snap'),
      // held. He is checking it is closed.
      K(0.88, {
        Hips: [0, 26, 0], Hips_pos: [0, -0.058, 0],
        Spine: [6, -9, 0], Chest: [6, -12, 0], Neck: [-2, -4, 0], Head: [-1, -10, 0],
        ClavR: [4, 0, 0],
        UpArmR: [-50, -14, 2], LoArmR: [-110, -50, 0], HandR: [-25, -56, 0],
        UpArmL: [-10, 12, -4], LoArmL: [-26, 42, 0], HandL: [-10, 56, 0]
      }, 'hold'),
      // the hand goes in the pocket, the chin drops, and that is the character
      K(1.24, {
        Hips: [0, 38, 0], Hips_pos: [0, -0.042, 0],
        Spine: [6, -10, 0], Chest: [7, -13, 0], Neck: [1, -6, 0], Head: [5, -11, 0],
        ClavR: [6, 0, 0], ClavL: [6, 0, 0],
        UpArmR: [-8, -8, 4], LoArmR: [-22, -42, 0], HandR: [-10, -58, 0],
        UpArmL: [-8, 10, -5], LoArmL: [-24, 44, 0], HandL: [-10, 58, 0]
      }, 'out'),
      // NOT quite stance: the chin is two degrees higher than his idle. At
      // stance exactly, his own fringe sits on his eyes under a close lens,
      // and the last frame of the character is a haircut.
      K(1.55, {
        Hips: [0, 40, 0], Hips_pos: [0, -0.038, 0],
        Spine: [6, -10, 0], Chest: [7, -14, 0], Neck: [-1, -6, 0], Head: [0, -12, 0],
        ClavL: [6, 0, 0], ClavR: [6, 0, 0],
        UpArmL: [-5, 10, -5], LoArmL: [-20, 44, 0], HandL: [-10, 58, 0],
        UpArmR: [-3, -8, 4], LoArmR: [-18, -42, 0], HandR: [-10, -58, 0]
      }, 'out')
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
  },

  // =========================================================================
  // THE THREE NEW SIGNATURES
  // =========================================================================

  // ---- MAKI — 釈魂刀, THROUGH THE SOUL -----------------------------------
  // The mirror of `tojiSpear`, and authored to be read against it. He kills
  // side-on, bored, without looking. She kills SQUARE — hips through the cut,
  // eyes on the target the whole way — because the entire point of the
  // character is that she got here by working and he was born there.
  //
  // The other deliberate difference: he never resets and she always does. The
  // last key brings her back to a centred guard rather than letting the pose
  // trail off, which is the same thing every clip in her set does.
  makiSoulCut: {
    dur: 1.25, loop: false, keys: [
      K(0, {}),
      // THE LOAD. Blade drawn back across the body, weight onto the back leg,
      // shoulders squared. This is the longest anticipation in the file — she
      // is not hiding it, she is committing to it.
      K(0.30, {
        Hips: [0, 62, 0], Hips_pos: [-0.02, -0.13, -0.05], Spine: [8, -28, 0], Chest: [6, -34, 0],
        Neck: [1, 8, 0], Head: [2, 16, 0],
        UpArmR: [-18, -34, -20], LoArmR: [-106, -42, 0], HandR: [-14, -80, 0],
        UpArmL: [-40, 34, 12], LoArmL: [-92, 36, 0],
        ThighL: [-16, -6, 0], ShinL: [18, 0, 0], ThighR: [26, 8, 0], ShinR: [36, 0, 0]
      }, 'in'),
      // and a held beat at the top of it. The still frame before a committed
      // cut is worth more than the cut.
      K(0.40, {
        Hips: [0, 64, 0], Hips_pos: [-0.02, -0.135, -0.05], Spine: [8, -29, 0], Chest: [6, -35, 0],
        Neck: [1, 8, 0], Head: [2, 16, 0],
        UpArmR: [-18, -35, -20], LoArmR: [-107, -43, 0], HandR: [-14, -80, 0],
        UpArmL: [-40, 34, 12], LoArmL: [-92, 36, 0],
        ThighL: [-16, -6, 0], ShinL: [18, 0, 0], ThighR: [26, 8, 0], ShinR: [36, 0, 0]
      }, 'hold'),
      // THROUGH. Hips all the way round, arm fully extended across the body,
      // and the head TRACKS IT — she watches the cut land, which he never does.
      K(0.55, {
        Hips: [0, -26, 0], Hips_pos: [0.01, -0.075, 0.16], Spine: [5, 32, 0], Chest: [4, 38, 0],
        Neck: [0, -6, 0], Head: [-2, -12, 0],
        UpArmR: [-96, 30, -4], LoArmR: [-8, 14, 0], HandR: [-4, -34, 0],
        UpArmL: [-54, 36, 14], LoArmL: [-72, 32, 0],
        ThighL: [-34, -6, 0], ShinL: [34, 0, 0], ThighR: [24, 8, 0], ShinR: [28, 0, 0]
      }, 'snap'),
      // the follow-through, held. Nothing moves for a third of a second.
      K(0.88, {
        Hips: [0, -26, 0], Hips_pos: [0.01, -0.075, 0.16], Spine: [5, 32, 0], Chest: [4, 38, 0],
        Neck: [0, -6, 0], Head: [-2, -12, 0],
        UpArmR: [-96, 30, -4], LoArmR: [-8, 14, 0], HandR: [-4, -34, 0],
        UpArmL: [-54, 36, 14], LoArmL: [-72, 32, 0],
        ThighL: [-34, -6, 0], ShinL: [34, 0, 0], ThighR: [24, 8, 0], ShinR: [28, 0, 0]
      }, 'hold'),
      // AND SHE RESETS. He would have kept walking.
      K(1.25, {
        Hips: [0, 20, 0], Hips_pos: [0, -0.03, 0], Spine: [0, -6, 0], Chest: [-1, -8, 0],
        Neck: [0, -3, 0], Head: [-3, -7, 0],
        UpArmR: [-14, -8, -12], LoArmR: [-42, -16, 0],
        UpArmL: [-16, 10, 10], LoArmL: [-44, 18, 0],
        ThighL: [-8, -4, 0], ShinL: [8, 0, 0], ThighR: [7, 6, 0], ShinR: [11, 0, 0]
      }, 'out')
    ]
  },

  // ---- YUKI — THE COMMAND GRAB, ALL THE WAY DOWN --------------------------
  // She catches them one-handed at the throat, holds them there long enough
  // for it to be rude, and then puts them through the floor with her whole
  // body behind it. The pivot is the move: her hips travel further in this
  // clip than in anything else in the project.
  yukiGrabSlam: {
    dur: 1.55, loop: false, keys: [
      K(0, {}),
      // THE REACH. Slow, arm out, palm open, walking into it. The tell.
      K(0.34, {
        Hips: [0, 10, 0], Hips_pos: [0, -0.07, 0.10], Spine: [6, 6, 0], Chest: [4, 8, 0],
        Neck: [0, -2, 0], Head: [0, -4, 0],
        UpArmR: [-88, 10, -10], LoArmR: [-16, 4, 0], HandR: [-18, -74, 0],
        UpArmL: [-20, 14, 20], LoArmL: [-56, 20, 0],
        ThighL: [-30, -6, 0], ShinL: [24, 0, 0], ThighR: [20, 8, 0], ShinR: [28, 0, 0]
      }, 'in'),
      // CAUGHT. The hand closes and the arm LOCKS — elbow straight, shoulder
      // set, and she does not strain, because the mass is doing the work.
      K(0.52, {
        Hips: [0, 6, 0], Hips_pos: [0, -0.09, 0.14], Spine: [7, 4, 0], Chest: [5, 6, 0],
        Neck: [-1, -2, 0], Head: [-2, -4, 0],
        UpArmR: [-94, 12, -6], LoArmR: [-6, 2, 0], HandR: [-8, -96, 0],
        UpArmL: [-24, 16, 22], LoArmL: [-50, 22, 0],
        ThighL: [-32, -6, 0], ShinL: [26, 0, 0], ThighR: [22, 8, 0], ShinR: [30, 0, 0]
      }, 'snap'),
      // held, so the audience understands they are not getting out
      K(0.74, {
        Hips: [0, 6, 0], Hips_pos: [0, -0.09, 0.14], Spine: [7, 4, 0], Chest: [5, 6, 0],
        Neck: [-1, -2, 0], Head: [-2, -4, 0],
        UpArmR: [-94, 12, -6], LoArmR: [-6, 2, 0], HandR: [-8, -96, 0],
        UpArmL: [-24, 16, 22], LoArmL: [-50, 22, 0],
        ThighL: [-32, -6, 0], ShinL: [26, 0, 0], ThighR: [22, 8, 0], ShinR: [30, 0, 0]
      }, 'hold'),
      // THE PIVOT AND THE SLAM. Hips travel 90 degrees and the arm drives down
      // and across. This is the biggest single rotation in the project.
      K(0.96, {
        Hips: [0, 74, 0], Hips_pos: [0, -0.22, 0.06], Spine: [34, -40, 0], Chest: [24, -46, 0],
        Neck: [4, -4, 0], Head: [16, -8, 0],
        UpArmR: [-18, -34, -6], LoArmR: [-22, -24, 0], HandR: [-10, -60, 0],
        UpArmL: [-26, -20, 12], LoArmL: [-34, -14, 0],
        ThighL: [-58, -8, 0], ShinL: [68, 0, 0], ThighR: [46, 10, 0], ShinR: [70, 0, 0]
      }, 'snap'),
      // she stays down over them, hand still on the floor
      K(1.20, {
        Hips: [0, 72, 0], Hips_pos: [0, -0.225, 0.06], Spine: [33, -38, 0], Chest: [23, -44, 0],
        Neck: [4, -4, 0], Head: [15, -8, 0],
        UpArmR: [-16, -34, -6], LoArmR: [-20, -24, 0],
        UpArmL: [-24, -20, 12], LoArmL: [-32, -14, 0],
        ThighL: [-58, -8, 0], ShinL: [68, 0, 0], ThighR: [46, 10, 0], ShinR: [70, 0, 0]
      }, 'hold'),
      // and stands back up, unhurried, shaking the hand out
      K(1.55, {
        Hips: [0, 24, 0], Hips_pos: [0, -0.04, 0], Spine: [2, -6, 0], Chest: [0, -8, 0],
        Neck: [0, -3, 0], Head: [-2, -6, 0],
        UpArmR: [-24, -10, -22], LoArmR: [-54, -14, 0], HandR: [-22, -36, 0],
        UpArmL: [-14, 8, 14], LoArmL: [-50, 20, 0],
        ThighL: [-12, -4, 0], ShinL: [11, 0, 0], ThighR: [10, 6, 0], ShinR: [14, 0, 0]
      }, 'out')
    ]
  },

  // ---- MIWA — 抜刀, ONE CUT ------------------------------------------------
  // The most restrained clip in this file, and it is the whole character. A
  // long, absolutely motionless stance, TWO FRAMES of draw, and a held
  // follow-through. There is no flourish anywhere in it, and the sheathe at
  // the end is the only thing she does that she is unambiguously good at.
  //
  // Compare `makiSoulCut` above, which is also a committed cut and takes half
  // the time: Miwa's is slower because the WAITING is the technique.
  miwaIai: {
    dur: 1.85, loop: false, keys: [
      K(0, {}),
      // into the stance: square, centred, hands on the sword and the saya
      K(0.30, {
        Hips: [0, 34, 0], Hips_pos: [0, -0.11, 0], Spine: [2, -6, 0], Chest: [1, -8, 0],
        Neck: [0, -2, 0], Head: [0, -4, 0],
        UpArmL: [-28, 44, 2], LoArmL: [-98, 58, 0], HandL: [-4, 110, 0],
        UpArmR: [-22, -36, -2], LoArmR: [-92, -54, 0], HandR: [-6, -104, 0],
        ThighL: [-28, -10, 0], ShinL: [32, 0, 0], ThighR: [26, 10, 0], ShinR: [32, 0, 0]
      }, 'in'),
      // ---- AND THEN NOTHING HAPPENS FOR THREE QUARTERS OF A SECOND --------
      // Two identical keys. This is the longest held frame in the project and
      // it is doing all the work: her hair is still settling from the entry,
      // and it is the hair settling against a body that has already stopped
      // that tells the audience the stillness is deliberate.
      K(1.05, {
        Hips: [0, 34, 0], Hips_pos: [0, -0.11, 0], Spine: [2, -6, 0], Chest: [1, -8, 0],
        Neck: [0, -2, 0], Head: [0, -4, 0],
        UpArmL: [-28, 44, 2], LoArmL: [-98, 58, 0], HandL: [-4, 110, 0],
        UpArmR: [-22, -36, -2], LoArmR: [-92, -54, 0], HandR: [-6, -104, 0],
        ThighL: [-28, -10, 0], ShinL: [32, 0, 0], ThighR: [26, 10, 0], ShinR: [32, 0, 0]
      }, 'hold'),
      // ---- THE DRAW. TWO FRAMES. -----------------------------------------
      // The left hand hauls the saya BACK as the right draws — half the draw,
      // and the half that is usually forgotten.
      K(1.075, {
        Hips: [0, 56, 0], Spine: [3, -18, 0], Hips_pos: [0, -0.108, 0],
        UpArmL: [-14, 58, 0], LoArmL: [-106, 70, 0], HandL: [-4, 120, 0],
        UpArmR: [-16, -48, 0], LoArmR: [-98, -64, 0]
      }, 'in'),
      K(1.11, {
        Hips: [0, -26, 0], Hips_pos: [0, -0.09, 0.10], Spine: [4, 34, 0], Chest: [3, 40, 0],
        Neck: [0, 8, 0], Head: [-2, 15, 0],
        UpArmR: [-98, 36, -2], LoArmR: [-6, 16, 0], HandR: [-4, -32, 0],
        UpArmL: [-22, 60, 6], LoArmL: [-120, 72, 0], HandL: [-6, 124, 0],
        ThighL: [-34, -10, 0], ShinL: [36, 0, 0], ThighR: [30, 10, 0], ShinR: [34, 0, 0]
      }, 'snap'),
      // the aftermath, held
      K(1.52, {
        Hips: [0, -26, 0], Hips_pos: [0, -0.09, 0.10], Spine: [4, 34, 0], Chest: [3, 40, 0],
        Neck: [0, 8, 0], Head: [-2, 15, 0],
        UpArmR: [-98, 36, -2], LoArmR: [-6, 16, 0], HandR: [-4, -32, 0],
        UpArmL: [-22, 60, 6], LoArmL: [-120, 72, 0], HandL: [-6, 124, 0],
        ThighL: [-34, -10, 0], ShinL: [36, 0, 0], ThighR: [30, 10, 0], ShinR: [34, 0, 0]
      }, 'hold'),
      // chiburi, and the blade goes home. She watches it in.
      K(1.66, {
        Hips: [0, 12, 0], Spine: [5, 8, 0], Head: [2, -2, 0], Hips_pos: [0, -0.095, 0],
        UpArmR: [-52, 6, -12], LoArmR: [-40, 10, 0], HandR: [-30, -46, 0],
        UpArmL: [-30, 46, 6], LoArmL: [-104, 58, 0]
      }, 'snap'),
      K(1.85, {
        Hips: [0, 34, 0], Hips_pos: [0, -0.10, 0], Head: [12, -6, 0], Neck: [5, -2, 0],
        UpArmL: [-32, 42, 4], LoArmL: [-100, 54, 0], HandL: [-6, 106, 0],
        UpArmR: [-30, -34, -4], LoArmR: [-84, -50, 0], HandR: [-8, -96, 0],
        ThighL: [-24, -8, 0], ShinL: [28, 0, 0], ThighR: [22, 8, 0], ShinR: [28, 0, 0]
      }, 'out')
    ]
  }
};
