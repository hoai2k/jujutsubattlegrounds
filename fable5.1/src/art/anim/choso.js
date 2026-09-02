// CHOSO — controlled, economical, and driven from a stable base. Everything he
// does starts at the hips and finishes with a hard stop; nothing overshoots and
// nothing bounces afterwards. He is a hundred and fifty years old and he moves
// like it: no wasted travel, no youthful whip, weight always over the feet.
//
// The deliberate contrast is Nobara, who is snappy, theatrical, and holds her
// finishes a beat too long. If a clip here ever wants a flourish, it belongs to
// her instead.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — squared and settled. Feet apart and flat, weight centred, both
// hands carried LOW and open in front of the waist where the blood comes out.
// Chin level, shoulders down. He is not guarding; he is waiting.
export const CHOSO_STANCE = {
  Hips_pos: [0, -0.055, 0],
  Hips: [0, 18, 0], Spine: [3, -6, 0], Chest: [1, -8, 0], Neck: [0, -3, 0], Head: [0, -6, 0],
  UpArmL: [-14, 10, 10], LoArmL: [-64, 22, 4], HandL: [-18, 44, 0],
  UpArmR: [-12, -8, -12], LoArmR: [-70, -20, 0], HandR: [-20, -46, 0],
  ThighL: [-13, -5, 0], ShinL: [13, 0, 0], FootL: [3, -11, 0],
  ThighR: [11, 7, 0], ShinR: [16, 0, 0], FootR: [7, 8, 0]
};

export const CHOSO_CLIPS = {
  // IDLE — one long breath and a slow settle. Almost no travel; the read is
  // that he is not in a hurry and does not intend to be.
  idle: {
    dur: 4.6, loop: true, keys: [
      K(0, {}),
      K(1.9, {
        Chest: [3, -8, 0], Spine: [4, -6, 0], Hips_pos: [0, -0.068, 0],
        UpArmL: [-17, 10, 11], LoArmL: [-67, 22, 4],
        UpArmR: [-15, -8, -13], LoArmR: [-73, -20, 0], Head: [1, -5, 0]
      }),
      K(3.2, { Chest: [0, -9, 0], Hips_pos: [0, -0.044, 0], Head: [-1, -7, 0] }),
      K(4.6, {})
    ]
  },

  // WALK — a heavier, shorter-strided cycle than the shared one. The arms
  // barely swing: he carries them where the stance leaves them.
  walk: {
    dur: 0.98, loop: true, keys: [
      K(0, { ThighL: [-25, -5, 0], ShinL: [12, 0, 0], FootL: [-6, -10, 0], ThighR: [19, 7, 0], ShinR: [26, 0, 0], FootR: [12, 8, 0], Hips_pos: [0, -0.062, 0], UpArmL: [-20, 10, 11], UpArmR: [-20, -8, -13], Spine: [4, -6, 0] }),
      K(0.245, { ThighL: [-5, -5, 0], ShinL: [20, 0, 0], ThighR: [3, 7, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.040, 0] }),
      K(0.49, { ThighL: [20, -5, 0], ShinL: [24, 0, 0], FootL: [10, -10, 0], ThighR: [-23, 7, 0], ShinR: [13, 0, 0], FootR: [-6, 8, 0], Hips_pos: [0, -0.062, 0], UpArmL: [-26, 10, 11], UpArmR: [-14, -8, -13], Spine: [4, -6, 0] }),
      K(0.735, { ThighL: [1, -5, 0], ShinL: [16, 0, 0], ThighR: [-7, 7, 0], ShinR: [21, 0, 0], Hips_pos: [0, -0.040, 0] }),
      K(0.98, { ThighL: [-25, -5, 0], ShinL: [12, 0, 0], FootL: [-6, -10, 0], ThighR: [19, 7, 0], ShinR: [26, 0, 0], FootR: [12, 8, 0], Hips_pos: [0, -0.062, 0], UpArmL: [-20, 10, 11], UpArmR: [-20, -8, -13] })
    ]
  },

  // ---- THE STRING ---------------------------------------------------------
  // Solid, unremarkable, and it is meant to be. Three straight punches thrown
  // from the shoulder with the hips behind them and no shoulder roll — the
  // brief says his fists are not the point, so they read as competent rather
  // than as a fighting style.
  punch1: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.08, { UpArmL: [-30, 14, 14], LoArmL: [-86, 10, 4], HandL: [-14, 66, 0], Chest: [1, -20, 0], Hips: [0, 26, 0] }, 'in'),
      K(0.145, { UpArmL: [-80, -4, -2], LoArmL: [-6, 0, 0], HandL: [-4, 100, 0], Chest: [3, 10, 0], Hips: [0, 8, 0], Spine: [4, 5, 0], Head: [0, -12, 0], UpArmR: [-18, -8, -14], LoArmR: [-76, -18, 0] }, 'snap'),
      K(0.20, { UpArmL: [-80, -4, -2], LoArmL: [-8, 0, 0], HandL: [-4, 100, 0], Chest: [3, 10, 0], Hips: [0, 8, 0] }, 'hold'),
      K(0.36, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.40, loop: false, keys: [
      K(0, { UpArmL: [-64, -4, 0], LoArmL: [-36, 0, 0], Chest: [3, 4, 0] }),
      K(0.09, { UpArmR: [-24, -16, -22], LoArmR: [-96, 0, -4], HandR: [-16, -76, 0], Chest: [3, -24, 0], Hips: [0, 34, 0], Hips_pos: [0, -0.070, 0] }, 'in'),
      K(0.165, { UpArmR: [-84, 6, 2], LoArmR: [-4, 0, 0], HandR: [-4, -166, 0], Chest: [5, 20, 0], Hips: [0, 0, 0], Spine: [5, 12, 0], Head: [0, -16, 0], UpArmL: [-30, 10, 12], LoArmL: [-78, 0, 4] }, 'snap'),
      K(0.225, { UpArmR: [-84, 6, 2], LoArmR: [-6, 0, 0], HandR: [-4, -166, 0], Chest: [5, 20, 0], Hips: [0, 0, 0] }, 'hold'),
      K(0.40, {}, 'out')
    ]
  },
  // THE LAUNCHER — not an uppercut but a rising palm strike driven off the
  // back leg, which is the only place in his kit he ever fully extends.
  punch3: {
    dur: 0.60, loop: false, keys: [
      K(0, { UpArmR: [-62, 4, 0], LoArmR: [-28, 0, 0] }),
      K(0.16, { UpArmR: [14, -10, -22], LoArmR: [-80, 0, -6], HandR: [-8, -26, 0], Chest: [10, -26, 0], Spine: [9, -14, 0], Hips: [3, 34, 0], Hips_pos: [0, -0.18, 0], ThighL: [-26, -5, 0], ShinL: [30, 0, 0], ThighR: [24, 7, 0], ShinR: [44, 0, 0], Head: [4, -9, 0] }, 'in'),
      K(0.27, { UpArmR: [-114, 8, 6], LoArmR: [-38, 0, 0], HandR: [-24, 0, 0], Chest: [-8, 16, 0], Spine: [-6, 9, 0], Hips: [-2, 4, 0], Hips_pos: [0, 0.01, 0], ThighL: [-12, -5, 0], ShinL: [10, 0, 0], ThighR: [6, 7, 0], ShinR: [18, 0, 0], FootR: [22, 8, 0], Head: [-3, -11, 0], UpArmL: [-26, 10, 16], LoArmL: [-82, 0, 4] }, 'snap'),
      K(0.34, { UpArmR: [-116, 8, 6], LoArmR: [-40, 0, 0], HandR: [-24, 0, 0], Chest: [-8, 16, 0], Hips_pos: [0, 0.01, 0] }, 'hold'),
      K(0.60, {}, 'out')
    ]
  },

  // HEAVY — BLOOD CLUB: a hooking forearm swung with the whole hip, the blood
  // hardening around the arm on the way through. Long wind, short travel, dead
  // stop — the most economical knockdown in the roster after Nanami's.
  heavy: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.24, { UpArmR: [-40, -46, -30], LoArmR: [-120, 0, -6], HandR: [-24, -60, 0], UpArmL: [-48, 18, 20], LoArmL: [-86, 0, 4], Chest: [-4, -36, 0], Spine: [-3, -19, 0], Hips: [0, 44, 0], Head: [-2, -16, 0], Hips_pos: [0, -0.080, 0], ThighL: [-24, -5, 0], ShinL: [26, 0, 0] }, 'in'),
      K(0.37, { UpArmR: [-70, 34, 16], LoArmR: [-52, 0, 0], HandR: [-28, -120, 0], UpArmL: [-26, 12, 18], LoArmL: [-84, 0, 4], Chest: [10, 30, 0], Spine: [8, 16, 0], Hips: [4, -8, 0], Head: [6, -18, 0], Hips_pos: [0, -0.150, 0], ThighL: [-34, -5, 0], ShinL: [40, 0, 0], ThighR: [26, 7, 0], ShinR: [50, 0, 0] }, 'snap'),
      K(0.47, { UpArmR: [-68, 34, 16], LoArmR: [-54, 0, 0], Chest: [10, 32, 0], Hips_pos: [0, -0.150, 0] }, 'hold'),
      K(0.86, {}, 'out')
    ]
  },

  // ---- CT1 — BLOOD EDGE 血刃 ----------------------------------------------
  // A short flick of the right hand across the body, palm turning over as it
  // goes. The blade forms on the outward stroke and leaves. Low commitment,
  // and the animation has to say so: no wind-up past the shoulder, no follow
  // through past centre.
  ct1: {
    dur: 0.48, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmR: [-34, -34, -22], LoArmR: [-104, -18, -4], HandR: [-30, -30, 0], Chest: [1, -22, 0], Hips: [0, 30, 0], Head: [0, -12, 0] }, 'in'),
      K(0.19, { UpArmR: [-66, 30, 12], LoArmR: [-30, 12, 0], HandR: [-16, -150, 0], Chest: [4, 18, 0], Spine: [4, 10, 0], Hips: [0, 4, 0], Head: [2, -16, 0], UpArmL: [-20, 12, 14], LoArmL: [-72, 16, 4] }, 'snap'),
      K(0.25, { UpArmR: [-64, 30, 12], LoArmR: [-32, 12, 0], Chest: [4, 18, 0] }, 'hold'),
      K(0.48, {}, 'out')
    ]
  },

  // ---- CT2 — PIERCING BLOOD 穿血 ------------------------------------------
  // The committed one, and the animation IS the tell. He plants, draws BOTH
  // hands back to the right hip in a long slow load, drops his weight, and then
  // fires the lance straight down the line off a hard front-foot plant. The
  // load is deliberately the longest single key in his set — this is the move
  // the opponent is supposed to see coming and get out of.
  ct2: {
    dur: 1.02, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips: [0, 40, 0], Chest: [2, -28, 0], Spine: [4, -16, 0], Hips_pos: [0, -0.100, 0], ThighL: [-30, -5, 0], ShinL: [32, 0, 0], ThighR: [22, 7, 0], ShinR: [40, 0, 0], UpArmR: [-16, -40, -26], LoArmR: [-116, -22, -4], HandR: [-30, -20, 0], UpArmL: [-28, -20, 4], LoArmL: [-104, -14, 4], HandL: [-26, 20, 0], Head: [2, -22, 0] }, 'in'),
      // the load. Nothing moves for a quarter of a second except his breathing.
      K(0.42, { Hips: [0, 44, 0], Chest: [1, -31, 0], Spine: [3, -18, 0], Hips_pos: [0, -0.128, 0], ThighL: [-34, -5, 0], ShinL: [38, 0, 0], ThighR: [26, 7, 0], ShinR: [46, 0, 0], UpArmR: [-12, -44, -28], LoArmR: [-122, -24, -4], UpArmL: [-24, -24, 4], LoArmL: [-110, -16, 4], Head: [3, -24, 0] }, 'hold'),
      // the fire: both arms straighten down the line, hips square, front foot
      // slams flat. Hands finish level with the sternum, not above the head.
      K(0.52, { Hips: [2, 2, 0], Chest: [6, 6, 0], Spine: [6, 4, 0], Hips_pos: [0, -0.160, 0], ThighL: [-44, -5, 0], ShinL: [26, 0, 0], FootL: [-10, -10, 0], ThighR: [30, 7, 0], ShinR: [30, 0, 0], UpArmR: [-92, 4, -2], LoArmR: [-4, 0, 0], HandR: [-8, -100, 0], UpArmL: [-88, 2, 2], LoArmL: [-6, 0, 0], HandL: [-8, 100, 0], Head: [4, -4, 0] }, 'snap'),
      K(0.66, { Hips: [2, 2, 0], Chest: [7, 6, 0], Hips_pos: [0, -0.162, 0], UpArmR: [-90, 4, -2], LoArmR: [-6, 0, 0], UpArmL: [-86, 2, 2], LoArmL: [-8, 0, 0] }, 'hold'),
      K(1.02, {}, 'out')
    ]
  },

  // ---- SPECIAL — FLOWING RED SCALE 赤鱗躍動 -------------------------------
  // The activation window the brief asks for, made visible. He plants both
  // feet, drops into a wide base, clenches both fists at his sides and drives
  // his shoulders DOWN — the opposite of a power-up pose that opens outward.
  // His head goes back at the peak and stays there a beat. He is completely
  // open for the whole thing and it must look like it.
  redScale: {
    dur: 1.00, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips_pos: [0, -0.100, 0], Hips: [0, 22, 0], Spine: [8, -6, 0], Chest: [6, -8, 0], Head: [8, -6, 0], UpArmL: [-6, 8, 22], LoArmL: [-46, 14, 4], HandL: [-30, 30, 0], UpArmR: [-4, -6, -24], LoArmR: [-50, -12, 0], HandR: [-30, -32, 0], ThighL: [-22, -8, 0], ShinL: [26, 0, 0], ThighR: [18, 10, 0], ShinR: [30, 0, 0] }, 'in'),
      // the boil: fists clench, elbows drive back, chest opens, head goes back
      K(0.38, { Hips_pos: [0, -0.145, 0], Hips: [0, 20, 0], Spine: [-10, -4, 0], Chest: [-12, -6, 0], Neck: [-8, -2, 0], Head: [-22, -4, 0], UpArmL: [22, 6, 26], LoArmL: [-96, 10, 4], HandL: [-40, 20, 0], UpArmR: [24, -4, -28], LoArmR: [-100, -8, 0], HandR: [-40, -22, 0], ThighL: [-28, -10, 0], ShinL: [34, 0, 0], ThighR: [24, 12, 0], ShinR: [38, 0, 0] }, 'snap'),
      // held. This is the punish window.
      K(0.66, { Hips_pos: [0, -0.150, 0], Spine: [-11, -4, 0], Chest: [-13, -6, 0], Head: [-23, -4, 0], UpArmL: [24, 6, 27], LoArmL: [-98, 10, 4], UpArmR: [26, -4, -29], LoArmR: [-102, -8, 0], ThighL: [-28, -10, 0], ThighR: [24, 12, 0] }, 'hold'),
      // and he simply straightens up. No flourish, no shout pose.
      K(0.84, { Hips_pos: [0, -0.075, 0], Spine: [5, -6, 0], Chest: [3, -8, 0], Head: [2, -6, 0], UpArmL: [-18, 10, 12], LoArmL: [-70, 20, 4], UpArmR: [-16, -8, -14], LoArmR: [-76, -18, 0] }, 'out'),
      K(1.00, {}, 'out')
    ]
  },

  // ---- ULTIMATE — SUPERNOVA 超新星 ----------------------------------------
  // Convergence first, then the release. He brings both hands together at the
  // sternum and compresses — the hands come TOWARD each other over a long
  // beat, which is what makes the mass read as dense — then opens them and
  // pushes the whole thing away down the aim line with a step through.
  ult: {
    dur: 1.80, loop: false, keys: [
      K(0, {}),
      // gather: hands out and low, palms up
      K(0.24, { UpArmL: [-52, 22, 30], LoArmL: [-70, 26, 6], HandL: [-52, 10, 0], UpArmR: [-50, -18, -32], LoArmR: [-74, -22, 0], HandR: [-52, -12, 0], Spine: [6, -6, 0], Chest: [4, -8, 0], Head: [6, -6, 0], Hips_pos: [0, -0.090, 0], ThighL: [-20, -6, 0], ShinL: [24, 0, 0], ThighR: [16, 8, 0], ShinR: [28, 0, 0] }, 'in'),
      // CONVERGENCE: the hands close on each other at the sternum. Slow.
      K(0.62, { UpArmL: [-76, 34, 12], LoArmL: [-102, 34, 6], HandL: [-40, 60, 0], UpArmR: [-74, -30, -14], LoArmR: [-106, -30, 0], HandR: [-40, -62, 0], Spine: [-4, -4, 0], Chest: [-6, -6, 0], Neck: [-4, -2, 0], Head: [-10, -4, 0], Hips_pos: [0, -0.120, 0] }, 'in'),
      K(0.94, { UpArmL: [-80, 38, 8], LoArmL: [-110, 38, 6], HandL: [-38, 66, 0], UpArmR: [-78, -34, -10], LoArmR: [-114, -34, 0], HandR: [-38, -68, 0], Spine: [-6, -4, 0], Chest: [-8, -6, 0], Head: [-13, -4, 0], Hips_pos: [0, -0.132, 0] }, 'hold'),
      // the throw: a hard step through, both palms driving out down the line
      K(1.10, { UpArmL: [-94, 4, 6], LoArmL: [-8, 0, 4], HandL: [-14, 92, 0], UpArmR: [-92, -2, -6], LoArmR: [-10, 0, 0], HandR: [-14, -94, 0], Spine: [12, -4, 0], Chest: [10, -6, 0], Head: [8, -4, 0], Hips: [0, 6, 0], Hips_pos: [0, -0.155, 0], ThighL: [-46, -6, 0], ShinL: [28, 0, 0], FootL: [-12, -10, 0], ThighR: [32, 8, 0], ShinR: [32, 0, 0] }, 'snap'),
      K(1.34, { UpArmL: [-92, 4, 6], LoArmL: [-10, 0, 4], UpArmR: [-90, -2, -6], LoArmR: [-12, 0, 0], Spine: [12, -4, 0], Hips_pos: [0, -0.155, 0] }, 'hold'),
      K(1.80, {}, 'out')
    ]
  },

  // VICTORY — he does not celebrate. He lowers his hands, looks at where the
  // opponent was, and turns his head away. Three keys, no pose held for the
  // camera: the whole point of him is that this was not personal.
  // ---- TAUNT — "…MY BROTHER?" ---------------------------------------------
  // Played completely straight, which is the only way it is funny. He points at
  // the opponent, tilts his head a very long way over, and HOLDS it — genuinely
  // trying to work out whether this person is one of his. The hand comes down
  // uncertainly rather than being withdrawn.
  //
  // There is no comic timing anywhere in the body. Every ease is a slow one and
  // the pauses are too long. Choso does not know he is doing a bit.
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // the hand comes up — not a jab, a slow reach
      K(0.55, {
        UpArmR: [-70, -16, -14], LoArmR: [-46, -22, 0], HandR: [-14, -38, 0],
        UpArmL: [-16, 10, 10], LoArmL: [-66, 22, 4],
        Chest: [2, -10, 0], Spine: [3, -7, 0], Head: [2, -10, 0],
        Hips_pos: [0, -0.05, 0]
      }, 'in'),
      // the point lands, and he leans a fraction into it
      K(1.00, {
        UpArmR: [-88, -6, -6], LoArmR: [-10, -6, 0], HandR: [-8, -28, 0],
        UpArmL: [-16, 10, 10], LoArmL: [-68, 22, 4],
        Chest: [5, -4, 0], Spine: [5, -3, 0], Neck: [1, -1, 0], Head: [2, -2, 0],
        Hips: [0, 12, 0], Hips_pos: [0, -0.05, 0.025]
      }, 'out'),
      // THE TILT. All the way over, and it keeps going after the body stops.
      K(1.60, {
        UpArmR: [-88, -6, -6], LoArmR: [-10, -6, 0],
        UpArmL: [-16, 10, 10], LoArmL: [-68, 22, 4],
        Chest: [5, -4, 0], Neck: [-2, 0, 12], Head: [-4, 0, 27],
        Hips: [0, 12, 0], Hips_pos: [0, -0.05, 0.025]
      }, 'out'),
      // and he holds it. Too long. On purpose.
      K(2.35, {
        UpArmR: [-87, -6, -6], LoArmR: [-11, -6, 0],
        Chest: [5, -4, 0], Neck: [-2, 0, 13], Head: [-4, 0, 29],
        Hips_pos: [0, -0.052, 0.024]
      }, 'hold'),
      // the arm comes down without an answer, and the head straightens last
      K(2.85, {
        UpArmR: [-30, -10, -12], LoArmR: [-62, -20, 0], HandR: [-18, -44, 0],
        UpArmL: [-15, 10, 10], LoArmL: [-66, 22, 4],
        Chest: [2, -7, 0], Neck: [-1, -2, 6], Head: [-1, -4, 14],
        Hips: [0, 16, 0], Hips_pos: [0, -0.054, 0.008]
      }),
      K(3.3, {}, 'out')
    ]
  },
  victory: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      K(0.7, { UpArmL: [-8, 8, 8], LoArmL: [-28, 14, 4], HandL: [-8, 26, 0], UpArmR: [-6, -6, -10], LoArmR: [-30, -12, 0], HandR: [-8, -28, 0], Spine: [2, -6, 0], Chest: [0, -8, 0], Head: [6, -6, 0], Hips_pos: [0, -0.048, 0] }, 'out'),
      K(1.6, { Head: [4, -6, 0], Neck: [2, -3, 0], Chest: [0, -8, 0] }, 'hold'),
      K(2.4, { Head: [-2, 26, 0], Neck: [-1, 12, 0], Chest: [1, -2, 0], Spine: [3, -1, 0], UpArmL: [-12, 10, 10], UpArmR: [-10, -8, -12] }, 'out'),
      K(3.2, { Head: [-2, 24, 0], Neck: [-1, 11, 0] }, 'hold')
    ]
  }
};
