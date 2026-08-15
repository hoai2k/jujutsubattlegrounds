// Hakari-specific clips.
//
// Two movement languages in one file, and the contrast between them is the
// point of the character:
//
//   BASE  — heavyweight, grounded, unhurried. Long anticipations, weight
//           carried on the back foot, shoulders rolling rather than snapping.
//           Brash but controlled: he is enjoying himself, he is not showing
//           off yet.
//   JACKPOT (the j* clips) — visibly LOOSER and more manic. Shorter windups,
//           deeper hip rotation, the head thrown around, arms flung past
//           where a careful fighter would stop them. He fights like someone
//           who has stopped budgeting for getting hit, because he has.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — brash and loose. Chin UP (a negative Head rx tips the face back),
// chest open, hands hanging low at hip height. He is not guarding.
export const HAKARI_STANCE = {
  Hips_pos: [0, -0.04, 0],
  Hips: [0, 20, 0], Spine: [3, -7, -2], Chest: [1, -9, -2], Neck: [-3, -3, 0], Head: [-6, -7, 3],
  ClavL: [0, 0, 0], UpArmL: [-8, 8, 15], LoArmL: [-52, 20, 2], HandL: [-14, 44, 0],
  ClavR: [0, 0, 0], UpArmR: [-6, -6, -17], LoArmR: [-48, -18, 0], HandR: [-14, -44, 0],
  ThighL: [-14, -6, 0], ShinL: [14, 0, 0], FootL: [2, -13, 0],
  ThighR: [14, 8, 0], ShinR: [20, 0, 0], FootR: [9, 10, 0]
};

export const HAKARI_CLIPS = {
  // idle: a slow shoulder roll and a weight rock onto the back foot, with the
  // head lolling once per cycle. Big and easy — a man who is not worried.
  idle: {
    dur: 3.4, loop: true, keys: [
      K(0, {}),
      K(1.1, { Chest: [3, -9, -1], Spine: [5, -7, -1], Hips_pos: [0, -0.055, 0], Hips: [0, 23, 0], UpArmL: [-11, 8, 18], UpArmR: [-9, -6, -20], Head: [-4, -4, 2] }),
      K(2.1, { Chest: [0, -10, -3], Hips_pos: [0, -0.03, 0], Hips: [0, 17, 0], Head: [-8, -11, 5], UpArmL: [-6, 8, 13], UpArmR: [-4, -6, -15] }),
      K(3.4, {})
    ]
  },

  // ---- BASE KIT ------------------------------------------------------------
  // CURSED ENERGY SMASH: the right arm hauled all the way behind the head,
  // then dropped through the target with the hips. The longest anticipation in
  // his set — this is the move you are supposed to see coming.
  ct1: {
    dur: 0.98, loop: false, keys: [
      K(0, {}),
      K(0.34, { UpArmR: [-168, -12, -8], LoArmR: [-56, 0, -4], HandR: [-24, -50, 0], UpArmL: [-52, 18, 26], LoArmL: [-78, 0, 6], Chest: [-8, -30, 0], Spine: [-5, -16, 0], Hips: [0, 40, 0], Head: [-12, -12, 0], Hips_pos: [0, -0.05, 0], ThighL: [-24, -6, 0], ShinL: [26, 0, 0] }, 'in'),
      K(0.50, { UpArmR: [-64, 10, -2], LoArmR: [-6, 0, 0], HandR: [-34, -140, 0], UpArmL: [-26, 12, 22], LoArmL: [-84, 0, 6], Chest: [16, 22, 0], Spine: [12, 12, 0], Hips: [2, -4, 0], Head: [12, -12, 0], Hips_pos: [0, -0.20, 0], ThighL: [-40, -6, 0], ShinL: [48, 0, 0], ThighR: [32, 8, 0], ShinR: [56, 0, 0] }, 'snap'),
      K(0.62, { UpArmR: [-62, 10, -2], LoArmR: [-8, 0, 0], Chest: [16, 24, 0], Hips_pos: [0, -0.20, 0] }, 'hold'),
      K(0.98, {}, 'out')
    ]
  },

  // RUSH BLOW: a straight thrown off a driving step. Short windup, the whole
  // body behind one line — his only fast button.
  ct2: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.13, { UpArmR: [-26, -18, -26], LoArmR: [-112, 0, -6], HandR: [-16, -80, 0], Chest: [4, -28, 0], Spine: [4, -15, 0], Hips: [0, 40, 0], Hips_pos: [0, -0.07, 0], ThighR: [22, 8, 0], ShinR: [30, 0, 0] }, 'in'),
      K(0.26, { UpArmR: [-90, 8, 0], LoArmR: [-2, 0, 0], HandR: [-4, -170, 0], UpArmL: [-34, 12, 20], LoArmL: [-98, 0, 6], HandL: [-22, 72, 0], Chest: [8, 24, 0], Spine: [8, 14, 0], Hips: [2, 0, 0], Head: [0, -16, 0], Hips_pos: [0, -0.11, 0], ThighL: [-38, -6, 0], ShinL: [30, 0, 0], ThighR: [26, 8, 0], ShinR: [44, 0, 0] }, 'snap'),
      K(0.34, { UpArmR: [-90, 8, 0], LoArmR: [-4, 0, 0], Chest: [8, 24, 0], Hips_pos: [0, -0.11, 0] }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },

  // SHUTTER: he stoops, gets both hands under the rail and hauls it up — one
  // hard vertical drag ending with both arms locked overhead. The rise of the
  // door is the FX; this is the body that pulls it.
  shutter: {
    dur: 0.55, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips_pos: [0, -0.20, 0], Spine: [26, -7, 0], Chest: [16, -9, 0], Head: [14, -7, 0], UpArmL: [-46, 14, 18], LoArmL: [-52, 6, 4], HandL: [-30, 30, 0], UpArmR: [-44, -12, -20], LoArmR: [-50, -6, -4], HandR: [-30, -30, 0], ThighL: [-44, -6, 0], ShinL: [56, 0, 0], ThighR: [-24, 8, 0], ShinR: [50, 0, 0] }, 'in'),
      K(0.30, { Hips_pos: [0, 0.015, 0], Spine: [-8, -7, 0], Chest: [-6, -9, 0], Head: [-14, -7, 0], UpArmL: [-152, 6, 20], LoArmL: [-14, 0, 4], HandL: [-10, 20, 0], UpArmR: [-150, -4, -22], LoArmR: [-14, 0, -4], HandR: [-10, -20, 0], ThighL: [-10, -6, 0], ShinL: [10, 0, 0], ThighR: [8, 8, 0], ShinR: [14, 0, 0] }, 'snap'),
      K(0.40, { UpArmL: [-150, 6, 20], UpArmR: [-148, -4, -22], Spine: [-7, -7, 0] }, 'hold'),
      K(0.55, {}, 'out')
    ]
  },

  // HEAVY — BOOKIE'S HOOK: a wide looping right thrown from behind the hip,
  // the whole torso rotating through it.
  heavy: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.24, { UpArmR: [-30, -40, -66], LoArmR: [-58, -12, -6], HandR: [-24, -60, 0], UpArmL: [-50, 16, 24], LoArmL: [-80, 0, 6], Chest: [4, -40, 0], Spine: [4, -20, 0], Hips: [0, 50, 0], Head: [-6, -18, 4], Hips_pos: [0, -0.06, 0], ThighL: [-26, -6, 0], ShinL: [30, 0, 0] }, 'in'),
      K(0.40, { UpArmR: [-84, 30, 12], LoArmR: [-16, 0, 0], HandR: [-24, -150, 0], UpArmL: [-24, 12, 20], LoArmL: [-88, 0, 6], Chest: [12, 34, 0], Spine: [10, 20, 0], Hips: [2, -8, 0], Head: [6, -6, -3], Hips_pos: [0, -0.15, 0], ThighL: [-38, -6, 0], ShinL: [44, 0, 0], ThighR: [30, 8, 0], ShinR: [52, 0, 0] }, 'snap'),
      K(0.50, { UpArmR: [-86, 32, 12], Chest: [12, 36, 0], Hips_pos: [0, -0.15, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },

  // DOMAIN CAST: the gambler's flourish. He rolls his shoulders back, snaps
  // the right hand DOWN like hauling a machine's lever, then throws both arms
  // wide as the parlor comes up around him. Chin never drops.
  domainCast: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.34, { UpArmR: [-118, -10, -18], LoArmR: [-40, 0, -4], HandR: [-30, -30, 0], UpArmL: [-14, 10, 18], LoArmL: [-56, 18, 2], Chest: [-6, -18, 0], Spine: [-4, -12, 0], Head: [-12, -12, 4], Hips: [0, 30, 0], Hips_pos: [0, -0.02, 0] }, 'in'),
      K(0.62, { UpArmR: [-14, 4, -12], LoArmR: [-64, 0, -2], HandR: [-40, -20, 0], Chest: [10, 6, 0], Spine: [8, 2, 0], Head: [4, -6, 0], Hips: [0, 12, 0], Hips_pos: [0, -0.16, 0], ThighL: [-30, -6, 0], ShinL: [36, 0, 0], ThighR: [24, 8, 0], ShinR: [40, 0, 0] }, 'snap'),
      K(0.78, { UpArmR: [-14, 4, -12], Chest: [10, 6, 0], Hips_pos: [0, -0.16, 0] }, 'hold'),
      K(1.15, { UpArmL: [-88, 6, 62], LoArmL: [-16, 0, 4], HandL: [-14, 0, 0], UpArmR: [-84, -4, -64], LoArmR: [-16, 0, -4], HandR: [-14, 0, 0], Chest: [-14, -6, 0], Spine: [-9, -4, 0], Neck: [-6, -2, 0], Head: [-22, -6, 0], Hips_pos: [0, 0.01, 0], ThighL: [-8, -6, 0], ThighR: [6, 8, 0] }, 'snap'),
      K(1.6, { UpArmL: [-86, 6, 58], UpArmR: [-82, -4, -60], Head: [-20, -6, 0], Chest: [-12, -6, 0] }, 'hold')
    ]
  },

  // RCT HEAL REACTION: whatever just hit him is undone. A shrug that starts in
  // the hips and travels out through both shoulders, head snapping back with
  // a grin. Short, so it can be dropped in on top of the fight without
  // stealing a beat.
  rct: {
    dur: 0.55, loop: false, keys: [
      K(0, {}),
      K(0.10, { Spine: [-10, -7, -2], Chest: [-8, -9, -2], Head: [-18, -4, 6], UpArmL: [-16, 8, 30], LoArmL: [-44, 20, 2], UpArmR: [-14, -6, -32], LoArmR: [-40, -18, 0], Hips_pos: [0, -0.015, 0] }, 'snap'),
      K(0.26, { Spine: [-4, -7, 2], Chest: [-3, -9, 2], Head: [-14, -12, -4], UpArmL: [-4, 8, 22], UpArmR: [-2, -6, -24], Hips: [0, 26, 0], Hips_pos: [0, -0.05, 0] }, 'out'),
      K(0.55, {}, 'out')
    ]
  },

  // ---- JACKPOT SET ---------------------------------------------------------
  // JACKPOT ACTIVATION — the hero pose. Arms flung out and back, chest thrown
  // open, head all the way back, one knee driving up off the floor. He holds
  // it, and the camera holds with him.
  jackpotPose: {
    dur: 1.87, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips_pos: [0, -0.24, 0], Spine: [30, -7, 0], Chest: [20, -9, 0], Head: [22, -7, 0], UpArmL: [10, 12, 8], LoArmL: [-70, 10, 4], UpArmR: [12, -10, -10], LoArmR: [-66, -8, -4], ThighL: [-52, -6, 0], ShinL: [62, 0, 0], ThighR: [-30, 8, 0], ShinR: [58, 0, 0] }, 'in'),
      K(0.40, { Hips_pos: [0, 0.10, 0], Spine: [-26, -7, 0], Chest: [-20, -9, 0], Neck: [-12, -2, 0], Head: [-34, -7, 0], UpArmL: [-136, 10, 74], LoArmL: [-10, 0, 6], HandL: [0, 0, 0], UpArmR: [-132, -8, -76], LoArmR: [-10, 0, -6], HandR: [0, 0, 0], ThighL: [-16, -6, 0], ShinL: [14, 0, 0], ThighR: [10, 8, 0], ShinR: [18, 0, 0] }, 'snap'),
      K(1.20, { Hips_pos: [0, 0.085, 0], Spine: [-24, -7, 0], Chest: [-19, -9, 0], Head: [-32, -7, 0], UpArmL: [-132, 10, 70], UpArmR: [-128, -8, -72] }, 'hold'),
      K(1.87, {}, 'out')
    ]
  },
  // FLURRY: alternating straights thrown from the shoulder with almost no
  // windup, hips whipping the full arc each time. Ten frames each.
  jFlurryL: {
    dur: 0.17, loop: false, keys: [
      K(0, {}),
      K(0.05, { UpArmL: [-92, -8, -6], LoArmL: [-2, 0, 0], HandL: [-4, 168, 0], UpArmR: [-24, -8, -22], LoArmR: [-104, 0, -6], Chest: [4, 16, 0], Spine: [4, 10, 0], Hips: [0, 6, 0], Head: [-4, -12, 0], Hips_pos: [0, -0.05, 0] }, 'snap'),
      K(0.17, { UpArmL: [-56, 0, 4], LoArmL: [-36, 0, 0], Chest: [2, 4, 0], Hips: [0, 14, 0] }, 'out')
    ]
  },
  jFlurryR: {
    dur: 0.17, loop: false, keys: [
      K(0, {}),
      K(0.05, { UpArmR: [-92, 8, 4], LoArmR: [-2, 0, 0], HandR: [-4, -168, 0], UpArmL: [-24, 8, 20], LoArmL: [-104, 0, 6], Chest: [4, -16, 0], Spine: [4, -10, 0], Hips: [0, 34, 0], Head: [-4, -2, 0], Hips_pos: [0, -0.05, 0] }, 'snap'),
      K(0.17, { UpArmR: [-56, 0, -4], LoArmR: [-36, 0, 0], Chest: [2, -4, 0], Hips: [0, 26, 0] }, 'out')
    ]
  },
  // the ender: a rising uppercut that throws him half off the floor
  jFlurryEnd: {
    dur: 0.37, loop: false, keys: [
      K(0, {}),
      K(0.08, { UpArmR: [26, -12, -26], LoArmR: [-90, 0, -8], HandR: [-10, -28, 0], Chest: [14, -30, 0], Spine: [12, -16, 0], Hips: [4, 42, 0], Hips_pos: [0, -0.15, 0], ThighL: [-30, -6, 0], ShinL: [34, 0, 0] }, 'in'),
      K(0.17, { UpArmR: [-126, 12, 8], LoArmR: [-40, 0, 0], HandR: [-18, 0, 0], UpArmL: [-30, 12, 24], LoArmL: [-86, 0, 6], Chest: [-16, 22, 0], Spine: [-12, 14, 0], Head: [-16, -10, 0], Hips: [-4, 4, 0], Hips_pos: [0, 0.055, 0], ThighL: [-10, -6, 0], ShinL: [8, 0, 0], ThighR: [6, 8, 0], ShinR: [14, 0, 0] }, 'snap'),
      K(0.23, { UpArmR: [-128, 12, 8], Chest: [-16, 24, 0], Hips_pos: [0, 0.055, 0] }, 'hold'),
      K(0.37, {}, 'out')
    ]
  },
  // JACKPOT BLAST: both palms shoved forward from the chest, torso square on,
  // heels sliding back under the recoil.
  jBlast: {
    dur: 0.80, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmL: [-44, -22, 14], LoArmL: [-108, -18, 2], HandL: [-70, 30, 0], UpArmR: [-42, 20, -16], LoArmR: [-112, 16, -2], HandR: [-70, -30, 0], Chest: [10, -4, 0], Spine: [8, -6, 0], Head: [6, -7, 0], Hips_pos: [0, -0.11, 0], ThighL: [-30, -6, 0], ShinL: [34, 0, 0], ThighR: [24, 8, 0], ShinR: [38, 0, 0] }, 'in'),
      K(0.36, { UpArmL: [-92, 2, 10], LoArmL: [-4, 0, 2], HandL: [-88, 0, 0], UpArmR: [-90, -2, -12], LoArmR: [-4, 0, -2], HandR: [-88, 0, 0], Chest: [-8, 0, 0], Spine: [-6, -4, 0], Neck: [-4, -2, 0], Head: [-14, -7, 0], Hips_pos: [0, -0.06, 0], ThighL: [-22, -6, 0], ShinL: [24, 0, 0], ThighR: [18, 8, 0], ShinR: [30, 0, 0] }, 'snap'),
      K(0.56, { UpArmL: [-90, 2, 10], UpArmR: [-88, -2, -12], Head: [-12, -7, 0], Hips_pos: [0, -0.06, 0] }, 'hold'),
      K(0.80, {}, 'out')
    ]
  },
  // RCT COUNTER STANCE: arms spread, guard deliberately dropped, chin lifted —
  // an invitation. Then the punish comes back through the same line.
  jCounter: {
    dur: 0.87, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmL: [-30, 6, 58], LoArmL: [-26, 0, 4], HandL: [-10, 0, 0], UpArmR: [-28, -4, -60], LoArmR: [-24, 0, -4], HandR: [-10, 0, 0], Chest: [-14, -6, 0], Spine: [-10, -5, 0], Neck: [-6, -2, 0], Head: [-24, -7, 0], Hips_pos: [0, -0.03, 0] }, 'out'),
      K(0.44, { UpArmL: [-32, 6, 62], UpArmR: [-30, -4, -64], Chest: [-15, -6, 0], Head: [-26, -7, 0], Hips_pos: [0, -0.045, 0] }, 'hold'),
      K(0.58, { UpArmR: [-96, 12, 0], LoArmR: [-6, 0, 0], HandR: [-30, -120, 0], UpArmL: [-20, 10, 18], LoArmL: [-92, 0, 6], Chest: [14, 28, 0], Spine: [11, 16, 0], Hips: [2, -4, 0], Head: [8, -12, 0], Hips_pos: [0, -0.16, 0], ThighL: [-38, -6, 0], ShinL: [44, 0, 0], ThighR: [30, 8, 0], ShinR: [50, 0, 0] }, 'snap'),
      K(0.68, { UpArmR: [-98, 12, 0], Chest: [14, 30, 0], Hips_pos: [0, -0.16, 0] }, 'hold'),
      K(0.87, {}, 'out')
    ]
  },
  // GOLD RUSH: shoulder first, head down, both arms streaming behind him.
  jRush: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.07, { Spine: [32, -7, 0], Chest: [20, -9, 0], Head: [16, -7, 0], Hips_pos: [0, -0.14, 0], UpArmL: [46, 10, 26], LoArmL: [-32, 0, 6], UpArmR: [50, -8, -28], LoArmR: [-28, 0, -6], ThighL: [-56, -6, 0], ShinL: [40, 0, 0], ThighR: [34, 8, 0], ShinR: [60, 0, 0] }, 'snap'),
      K(0.30, { Spine: [30, -7, 0], Chest: [19, -9, 0], Head: [14, -7, 0], Hips_pos: [0, -0.12, 0], UpArmL: [52, 10, 24], UpArmR: [56, -8, -26], ThighL: [34, -6, 0], ShinL: [58, 0, 0], ThighR: [-54, 8, 0], ShinR: [42, 0, 0] }, 'hold'),
      K(0.44, {}, 'out')
    ]
  },

  // victory: both fists thrown up, a shout, then a shrug at the camera —
  // he was always going to win, it was just a question of when the reels landed
  // ---- TAUNT — "WANNA BET?" -----------------------------------------------
  // The pachinko lever. He reaches up for it, hauls it DOWN with his whole
  // body behind it — the only genuinely violent movement in a taunt anywhere in
  // this roster — and then throws both hands out at you while the machine he
  // is imagining does its work.
  //
  // Built on his existing movement language: everything rolls through the
  // shoulders and the hips rather than snapping, right up until the pull, which
  // snaps very hard indeed.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // reach — up and out to the right, weight loading onto the back foot
      K(0.40, {
        UpArmR: [-128, -20, -26], LoArmR: [-30, -12, 0], HandR: [-16, -50, 0],
        UpArmL: [-6, 8, 18], LoArmL: [-48, 20, 2],
        Chest: [-6, -14, -4], Spine: [-3, -11, -3], Head: [-12, -14, 6],
        Hips: [0, 26, 0], Hips_pos: [0.02, -0.02, -0.02],
        ThighR: [17, 8, 0], ShinR: [18, 0, 0]
      }, 'in'),
      // THE PULL. Straight down, and the whole body drops with it.
      K(0.62, {
        UpArmR: [12, -14, -20], LoArmR: [-96, -26, 0], HandR: [-24, -66, 0],
        UpArmL: [-10, 8, 22], LoArmL: [-54, 20, 2],
        Chest: [12, -6, 2], Spine: [10, -5, 1], Head: [6, -4, -2],
        Hips: [0, 14, 0], Hips_pos: [0.01, -0.13, 0.01],
        ThighL: [-24, -6, 0], ShinL: [26, 0, 0], ThighR: [22, 8, 0], ShinR: [30, 0, 0]
      }, 'snap'),
      K(0.80, {
        UpArmR: [14, -14, -20], LoArmR: [-98, -26, 0],
        UpArmL: [-11, 8, 22], LoArmL: [-56, 20, 2],
        Chest: [11, -6, 2], Head: [7, -4, -2], Hips_pos: [0.01, -0.125, 0.01]
      }, 'hold'),
      // AND UP — both hands flung out at you, chest open, chin up. The line
      // lands on the way up rather than at the top, so it reads as delighted
      // rather than announced.
      K(1.20, {
        UpArmL: [-70, 14, 54], LoArmL: [-24, 8, 6], HandL: [-8, 30, 0],
        UpArmR: [-66, -12, -56], LoArmR: [-20, -6, -6], HandR: [-8, -30, 0],
        Chest: [-14, -6, -2], Spine: [-10, -5, -2], Neck: [-6, -2, 0], Head: [-18, -4, 4],
        Hips: [0, 16, 0], Hips_pos: [0, 0.015, 0],
        ThighL: [-12, -6, 0], ShinL: [8, 0, 0], ThighR: [10, 8, 0], ShinR: [12, 0, 0]
      }, 'snap'),
      // he holds it with a shoulder roll going through it — never quite still
      K(1.90, {
        UpArmL: [-64, 14, 48], LoArmL: [-30, 8, 6],
        UpArmR: [-72, -12, -50], LoArmR: [-16, -6, -6],
        Chest: [-12, -10, -3], Head: [-16, 6, 5], Hips: [0, 22, 0], Hips_pos: [0.012, 0.008, 0]
      }),
      K(2.50, {
        UpArmL: [-68, 14, 52], LoArmL: [-26, 8, 6],
        UpArmR: [-64, -12, -54], LoArmR: [-22, -6, -6],
        Chest: [-13, -8, -1], Head: [-17, -6, 4], Hips: [0, 18, 0], Hips_pos: [-0.008, 0.012, 0]
      }),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      K(0.42, { UpArmL: [-158, 8, 22], LoArmL: [-30, 0, 4], HandL: [-14, 30, 0], UpArmR: [-156, -6, -24], LoArmR: [-30, 0, -4], HandR: [-14, -30, 0], Chest: [-16, -9, 0], Spine: [-11, -7, 0], Neck: [-8, -2, 0], Head: [-28, -7, 0], Hips_pos: [0, 0.015, 0] }, 'snap'),
      K(1.30, { UpArmL: [-152, 8, 26], UpArmR: [-150, -6, -28], Head: [-26, -7, 0], Chest: [-15, -9, 0] }, 'hold'),
      K(2.00, { UpArmL: [-16, 10, 40], LoArmL: [-60, 14, 2], HandL: [-30, 20, 0], UpArmR: [-14, -8, -42], LoArmR: [-56, -12, 0], HandR: [-30, -20, 0], Chest: [2, -9, -2], Spine: [3, -7, -2], Head: [-10, -14, 6], Hips: [0, 26, 0], Hips_pos: [0, -0.03, 0] }, 'out'),
      K(2.60, { Head: [-6, 2, -4], Hips: [0, 15, 0] }),
      K(3.2, {})
    ]
  }
};
