// HIGURUMA — two animation sets that barely look like the same person.
//
// BEFORE THE SWORD he is sluggish and reluctant. Every action starts late,
// travels further than it needs to, and costs him something on the way back:
// long anticipations, soft stops, recoveries where he has to re-gather
// himself. He is not a fighter and the clips should never once suggest he is.
//
// WITH THE SWORD he is precise and economical. The draw (`swordDraw`) is the
// hinge: the spine straightens, the shoulders come back, the head comes up,
// and from that frame on nothing he does has any wasted travel in it. That
// posture change is half the character.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — the slump. Rounded spine, shoulders rolled forward, head hanging,
// weight dumped on one leg, right arm hanging DEAD at his side with the
// briefcase in it and the left hand shoved in a pocket. There is no guard
// here at all, which is the point: put this next to Nanami's square upright
// wait and they do not read as the same species.
export const HIGURUMA_STANCE = {
  Hips_pos: [0, -0.025, 0],
  Hips: [0, 17, 0], Spine: [13, -5, 0], Chest: [11, -7, 0], Neck: [6, -3, 0], Head: [11, -6, 0],
  // left hand in the pocket: upper arm back and in, forearm folded across
  UpArmL: [7, 5, 7], LoArmL: [-56, 30, 4], HandL: [-8, 58, 0],
  // right arm hanging straight down with the case
  UpArmR: [-4, -3, -5], LoArmR: [-16, -10, 0], HandR: [-14, -80, 0],
  ThighL: [-7, -3, 0], ShinL: [6, 0, 0], FootL: [1, -10, 0],
  ThighR: [5, 5, 0], ShinR: [9, 0, 0], FootR: [4, 7, 0]
};

export const HIGURUMA_CLIPS = {
  // IDLE — a long, tired breath and a weight shift he does not commit to.
  // 4.6 s: the slowest idle in the roster.
  idle: {
    dur: 4.6, loop: true, keys: [
      K(0, {}),
      K(1.8, {
        Spine: [15, -5, 0], Chest: [13, -7, 0], Head: [13, -5, 0], Hips_pos: [0, -0.042, 0],
        UpArmR: [-2, -3, -6], LoArmR: [-19, -10, 0], UpArmL: [8, 5, 8]
      }),
      K(3.1, {
        Spine: [12, -4, 0], Head: [9, -8, 0], Hips: [0, 20, 0], Hips_pos: [0, -0.014, 0],
        ThighL: [-4, -3, 0], ThighR: [3, 5, 0]
      }),
      K(4.6, {})
    ]
  },

  // ---- BRIEFCASE STRING ---------------------------------------------------
  // Two graceless swipes with the case and a two-handed downward swing. Note
  // how far the arm travels for how little happens: he is throwing the whole
  // object rather than hitting with it, and the third one puts him off balance.
  punch1: {
    dur: 0.42, loop: false, keys: [
      K(0, {}),
      K(0.11, { UpArmR: [10, -14, -18], LoArmR: [-34, -10, -4], Chest: [12, -26, 0], Hips: [0, 34, 0], Spine: [14, -14, 0] }, 'in'),
      K(0.19, { UpArmR: [-64, 4, -6], LoArmR: [-26, 0, 0], HandR: [-20, -110, 0], Chest: [10, 14, 0], Hips: [0, 6, 0], Spine: [12, 8, 0], Head: [8, -12, 0] }, 'snap'),
      K(0.24, { UpArmR: [-62, 4, -6], LoArmR: [-28, 0, 0], Chest: [10, 14, 0] }, 'hold'),
      K(0.42, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.46, loop: false, keys: [
      K(0, { UpArmR: [-48, 0, -6], LoArmR: [-30, 0, 0], Chest: [10, 8, 0] }),
      K(0.12, { UpArmR: [-44, 24, 10], LoArmR: [-40, 0, 4], Chest: [12, 24, 0], Hips: [0, -6, 0], Spine: [14, 12, 0], Hips_pos: [0, -0.05, 0] }, 'in'),
      K(0.21, { UpArmR: [-56, -26, -22], LoArmR: [-22, 0, -4], HandR: [-20, -60, 0], Chest: [10, -22, 0], Hips: [0, 36, 0], Spine: [12, -12, 0], Head: [10, 10, 0] }, 'snap'),
      K(0.27, { UpArmR: [-54, -26, -22], Chest: [10, -22, 0] }, 'hold'),
      K(0.46, {}, 'out')
    ]
  },
  // the ender: both hands on the case, hauled up and driven down. It lands
  // like a piece of luggage, and it leaves him bent over it.
  punch3: {
    dur: 0.70, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        UpArmR: [-150, -10, -12], LoArmR: [-44, 0, -4], UpArmL: [-138, 12, 22], LoArmL: [-50, 0, 6],
        Chest: [-6, -10, 0], Spine: [-4, -6, 0], Hips: [0, 22, 0], Head: [-6, -6, 0], Hips_pos: [0, -0.02, 0]
      }, 'in'),
      K(0.32, {
        UpArmR: [-16, 4, -4], LoArmR: [-12, 0, 0], HandR: [-40, -90, 0], UpArmL: [-14, -4, 6], LoArmL: [-16, 0, 4],
        Chest: [30, 6, 0], Spine: [24, 4, 0], Hips: [8, 4, 0], Head: [22, -6, 0], Hips_pos: [0, -0.19, 0],
        ThighL: [-40, -4, 0], ShinL: [50, 0, 0], ThighR: [26, 6, 0], ShinR: [56, 0, 0]
      }, 'snap'),
      K(0.42, { UpArmR: [-14, 4, -4], Chest: [31, 6, 0], Spine: [25, 4, 0], Hips_pos: [0, -0.20, 0] }, 'hold'),
      // he has to push himself back upright — the recovery is the punish
      K(0.70, {}, 'out')
    ]
  },

  // HEAVY — CASE SWING: the briefcase taken in both hands and thrown sideways
  // with everything he has, which is not much. Enormous wind-up, and he spins
  // himself half off his feet finishing it.
  heavy: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.26, {
        UpArmR: [-40, 44, 26], LoArmR: [-58, 0, 6], UpArmL: [-52, 30, 34], LoArmL: [-64, 0, 6],
        Chest: [8, 40, 0], Spine: [10, 22, 0], Hips: [0, -18, 0], Head: [6, 24, 0], Hips_pos: [0, -0.06, 0],
        ThighL: [-14, -4, 0], ThighR: [10, 6, 0]
      }, 'in'),
      K(0.40, {
        UpArmR: [-74, -44, -34], LoArmR: [-18, 0, -6], HandR: [-24, -70, 0], UpArmL: [-40, -26, -10], LoArmL: [-40, 0, 4],
        Chest: [12, -40, 0], Spine: [12, -24, 0], Hips: [4, 46, 0], Head: [12, -20, 0], Hips_pos: [0, -0.15, 0],
        ThighL: [-32, -4, 0], ShinL: [40, 0, 0], ThighR: [24, 6, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(0.50, { UpArmR: [-72, -44, -34], Chest: [12, -40, 0], Hips: [4, 46, 0], Hips_pos: [0, -0.15, 0] }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },

  // ---- GAVEL STRIKE -------------------------------------------------------
  // Both hands close on a gavel that is not there until it is. Raised
  // overhead, held a beat too long (26 frames of startup — you can see it
  // coming from across the map), and brought down through the floor.
  ct1: {
    dur: 0.98, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        UpArmR: [-96, -6, -10], LoArmR: [-92, 0, -6], HandR: [-30, -90, 0],
        UpArmL: [-88, 8, 14], LoArmL: [-96, 0, 6], HandL: [-30, 90, 0],
        Chest: [6, -6, 0], Spine: [8, -4, 0], Head: [2, -4, 0], Hips_pos: [0, -0.05, 0]
      }, 'in'),
      // the gavel is up, and he waits with it up
      K(0.34, {
        UpArmR: [-172, -8, -6], LoArmR: [-30, 0, -4], HandR: [-20, -90, 0],
        UpArmL: [-166, 10, 10], LoArmL: [-34, 0, 6], HandL: [-20, 90, 0],
        Chest: [-14, -4, 0], Spine: [-10, -2, 0], Neck: [-4, -2, 0], Head: [-12, -2, 0],
        Hips: [0, 16, 0], Hips_pos: [0, 0.01, 0], ThighL: [-10, -3, 0], ThighR: [6, 5, 0]
      }, 'in'),
      K(0.44, {
        UpArmR: [-170, -8, -6], UpArmL: [-164, 10, 10], Chest: [-15, -4, 0], Head: [-13, -2, 0]
      }, 'hold'),
      // down
      K(0.54, {
        UpArmR: [-24, 2, -4], LoArmR: [-10, 0, 0], HandR: [-60, -90, 0],
        UpArmL: [-20, -2, 4], LoArmL: [-12, 0, 4], HandL: [-60, 90, 0],
        Chest: [34, 0, 0], Spine: [26, 0, 0], Neck: [6, 0, 0], Head: [24, 0, 0],
        Hips: [10, 16, 0], Hips_pos: [0, -0.24, 0],
        ThighL: [-52, -4, 0], ShinL: [66, 0, 0], ThighR: [34, 6, 0], ShinR: [70, 0, 0]
      }, 'snap'),
      K(0.66, { UpArmR: [-22, 2, -4], Chest: [35, 0, 0], Hips_pos: [0, -0.25, 0] }, 'hold'),
      K(0.98, {}, 'out')
    ]
  },

  // ---- CONFISCATION -------------------------------------------------------
  // No swing. He reaches out flat-palmed and TAKES it — the gesture of a man
  // serving papers, held at the end like he is waiting for a signature. The
  // one moment in the base kit where he looks like he knows what he is doing.
  ct2: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.12, {
        UpArmR: [-24, -22, -14], LoArmR: [-88, -12, -4], HandR: [-40, -60, 0],
        Chest: [10, -18, 0], Spine: [12, -10, 0], Hips: [0, 28, 0], Head: [6, -14, 0]
      }, 'in'),
      K(0.24, {
        UpArmR: [-86, 4, -4], LoArmR: [-10, 0, 0], HandR: [-88, -90, 0],
        Chest: [6, 12, 0], Spine: [8, 8, 0], Hips: [0, 10, 0], Head: [0, -8, 0], Neck: [-2, -2, 0],
        Hips_pos: [0, -0.05, 0], ThighL: [-16, -3, 0], ShinL: [16, 0, 0]
      }, 'snap'),
      // the hold — palm open, waiting
      K(0.42, { UpArmR: [-84, 4, -4], LoArmR: [-12, 0, 0], HandR: [-88, -90, 0], Head: [0, -8, 0] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // ---- SUMMON JUDGEMAN ----------------------------------------------------
  // He sets the case down against his leg and opens one hand at the floor.
  // Formal, unhurried, and completely unguarded — the summon is a liability
  // to throw in someone's face.
  summon: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.20, {
        UpArmL: [-30, 16, 16], LoArmL: [-92, 20, 6], HandL: [-70, 70, 0],
        Chest: [16, -10, 0], Spine: [16, -6, 0], Head: [18, -6, 0], Hips_pos: [0, -0.09, 0],
        ThighL: [-20, -3, 0], ShinL: [22, 0, 0], ThighR: [14, 5, 0], ShinR: [24, 0, 0]
      }, 'in'),
      K(0.40, {
        UpArmL: [-56, 6, 24], LoArmL: [-52, 0, 6], HandL: [-90, 40, 0],
        Chest: [6, -4, 0], Spine: [8, -3, 0], Head: [4, -4, 0], Neck: [-2, -2, 0], Hips_pos: [0, -0.04, 0]
      }, 'out'),
      K(0.58, { UpArmL: [-54, 6, 24], HandL: [-90, 40, 0], Head: [4, -4, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },

  // ---- DOMAIN CAST --------------------------------------------------------
  // RELUCTANT. He does not throw his arms wide; he lowers his head, closes
  // his eyes, and makes the sign like a man reading a sentence he wishes he
  // did not have to read. The barrier goes up around a bow.
  domainCast: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.34, {
        UpArmR: [-58, -20, -10], LoArmR: [-86, -16, -4], HandR: [-56, -70, 0],
        UpArmL: [-52, 22, 12], LoArmL: [-90, 18, 6], HandL: [-56, 70, 0],
        Chest: [18, -4, 0], Spine: [18, -3, 0], Neck: [10, 0, 0], Head: [22, 0, 0],
        Hips_pos: [0, -0.07, 0]
      }, 'in'),
      // the two hands come together at the chest, head bowed over them
      K(0.62, {
        UpArmR: [-74, -6, -4], LoArmR: [-100, -6, -2], HandR: [-40, -90, 0],
        UpArmL: [-70, 8, 6], LoArmL: [-102, 6, 4], HandL: [-40, 90, 0],
        Chest: [22, 0, 0], Spine: [20, 0, 0], Neck: [12, 0, 0], Head: [26, 0, 0],
        Hips_pos: [0, -0.10, 0], ThighL: [-14, -3, 0], ShinL: [14, 0, 0]
      }, 'out'),
      K(0.98, {
        Chest: [23, 0, 0], Head: [27, 0, 0], UpArmR: [-76, -6, -4], UpArmL: [-72, 8, 6],
        Hips_pos: [0, -0.11, 0]
      }, 'hold'),
      // and then he looks up. The barrier is already closed.
      K(1.24, {
        UpArmR: [-40, -10, -8], LoArmR: [-56, 0, -4], UpArmL: [-36, 12, 10], LoArmL: [-58, 0, 6],
        Chest: [-6, -4, 0], Spine: [-4, -2, 0], Neck: [-4, -2, 0], Head: [-10, -2, 0],
        Hips_pos: [0, -0.02, 0]
      }, 'snap'),
      K(1.6, { Chest: [-4, -5, 0], Spine: [-2, -3, 0], Head: [-6, -4, 0], Hips_pos: [0, -0.03, 0] }, 'out')
    ]
  },

  // ======================= WITH THE SWORD ==================================

  // SWORD DRAW — THE HINGE. The blade forms in his hand and he stands up
  // inside his own suit. Slumped -> upright in a quarter of a second, and
  // then he does not move again. Everything after this is economical.
  swordDraw: {
    dur: 1.05, loop: false, keys: [
      K(0, {}),
      // the weight of it arrives first: the arm drops, the knees give slightly
      K(0.16, {
        UpArmR: [6, -6, -8], LoArmR: [-6, -6, 0], HandR: [-8, -84, 0],
        Chest: [16, -6, 0], Spine: [17, -4, 0], Head: [16, -6, 0], Hips_pos: [0, -0.10, 0],
        ThighL: [-14, -3, 0], ShinL: [16, 0, 0], ThighR: [10, 5, 0], ShinR: [18, 0, 0]
      }, 'in'),
      // and then he straightens. Spine, shoulders, chin — in that order.
      K(0.44, {
        UpArmR: [-14, -6, -8], LoArmR: [-34, -12, 0], HandR: [-18, -82, 0],
        UpArmL: [-6, 4, 6], LoArmL: [-16, 8, 2], HandL: [-8, 30, 0],
        Chest: [-2, -6, 0], Spine: [0, -4, 0], Neck: [-2, -2, 0], Head: [-2, -5, 0],
        Hips: [0, 12, 0], Hips_pos: [0, -0.03, 0],
        ThighL: [-4, -2, 0], ShinL: [3, 0, 0], ThighR: [3, 3, 0], ShinR: [4, 0, 0]
      }, 'out'),
      // one slow lift of the blade to look at it, then down to guard
      K(0.72, {
        UpArmR: [-52, -10, -6], LoArmR: [-54, -10, 0], HandR: [-24, -86, 0],
        Chest: [-3, -5, 0], Head: [-6, -6, 0], Neck: [-3, -2, 0]
      }, 'out'),
      K(1.05, {
        UpArmR: [-24, -5, -7], LoArmR: [-30, -14, 0], HandR: [-20, -80, 0],
        UpArmL: [-3, 4, 5], LoArmL: [-11, 9, 2],
        Chest: [-2, -6, 0], Spine: [0, -4, 0], Head: [-2, -5, 0], Hips_pos: [0, -0.03, 0]
      }, 'out')
    ]
  },

  // SWORD IDLE — upright, composed, formal. Almost no motion at all: the
  // stillness is the threat, and it is the exact opposite of the base idle's
  // tired sag. The blade hangs point-down and forward.
  swordIdle: {
    dur: 3.4, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.03, 0], Hips: [0, 12, 0], Spine: [0, -4, 0], Chest: [-2, -6, 0],
        Neck: [-2, -2, 0], Head: [-2, -5, 0],
        UpArmL: [-3, 4, 5], LoArmL: [-11, 9, 2], HandL: [-6, 26, 0],
        UpArmR: [-24, -5, -7], LoArmR: [-30, -14, 0], HandR: [-20, -80, 0],
        ThighL: [-4, -2, 0], ShinL: [3, 0, 0], FootL: [0, -8, 0],
        ThighR: [3, 3, 0], ShinR: [4, 0, 0], FootR: [2, 6, 0]
      }),
      K(1.7, {
        Hips_pos: [0, -0.042, 0], Chest: [-1, -6, 0], Head: [-1, -5, 0],
        UpArmR: [-11, -4, -6], LoArmR: [-42, -14, 0]
      }),
      K(3.4, { Hips_pos: [0, -0.03, 0], Chest: [-2, -6, 0], Head: [-2, -5, 0], UpArmR: [-24, -5, -7], LoArmR: [-30, -14, 0] })
    ]
  },

  // SWORD WALK / RUN — the blade carried level, no swing in the arms. He does
  // not jog with it; he closes distance with it.
  swordWalk: {
    dur: 0.80, loop: true, keys: [
      K(0, {
        ThighL: [-26, -4, 0], ShinL: [10, 0, 0], FootL: [-6, -8, 0], ThighR: [20, 6, 0], ShinR: [26, 0, 0], FootR: [12, 8, 0],
        Hips_pos: [0, -0.04, 0], Spine: [2, -5, 0], Chest: [0, -7, 0],
        UpArmL: [-6, 5, 8], LoArmL: [-14, 9, 2], UpArmR: [-16, -5, -6], LoArmR: [-44, -14, 0], HandR: [-20, -80, 0]
      }),
      K(0.20, { ThighL: [-5, -4, 0], ShinL: [20, 0, 0], ThighR: [3, 6, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.02, 0] }),
      K(0.40, {
        ThighL: [22, -4, 0], ShinL: [26, 0, 0], FootL: [10, -8, 0], ThighR: [-24, 6, 0], ShinR: [12, 0, 0], FootR: [-6, 8, 0],
        Hips_pos: [0, -0.04, 0], Spine: [2, -5, 0],
        UpArmL: [-6, 5, 8], UpArmR: [-16, -5, -6], LoArmR: [-44, -14, 0]
      }),
      K(0.60, { ThighL: [2, -4, 0], ShinL: [16, 0, 0], ThighR: [-6, 6, 0], ShinR: [22, 0, 0], Hips_pos: [0, -0.02, 0] }),
      K(0.80, {
        ThighL: [-26, -4, 0], ShinL: [10, 0, 0], FootL: [-6, -8, 0], ThighR: [20, 6, 0], ShinR: [26, 0, 0], FootR: [12, 8, 0],
        Hips_pos: [0, -0.04, 0]
      })
    ]
  },
  swordRun: {
    dur: 0.54, loop: true, keys: [
      K(0, {
        Spine: [12, -4, 0], Chest: [8, -6, 0], Hips: [2, 10, 0],
        ThighL: [-48, -2, 0], ShinL: [22, 0, 0], FootL: [-12, -6, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0], FootR: [28, 6, 0],
        UpArmL: [-26, 8, 12], LoArmL: [-70, 0, 4],
        UpArmR: [-30, -6, -8], LoArmR: [-52, -12, 0], HandR: [-22, -80, 0], Hips_pos: [0, -0.03, 0]
      }),
      K(0.135, { Spine: [11, -4, 0], ThighL: [-10, -2, 0], ShinL: [28, 0, 0], ThighR: [-14, 4, 0], ShinR: [38, 0, 0], Hips_pos: [0, -0.062, 0] }),
      K(0.27, {
        Spine: [12, -4, 0], Chest: [8, -6, 0], Hips: [2, 10, 0],
        ThighL: [32, -2, 0], ShinL: [62, 0, 0], FootL: [28, -6, 0], ThighR: [-48, 4, 0], ShinR: [22, 0, 0], FootR: [-12, 6, 0],
        UpArmL: [-30, 8, 12], UpArmR: [-30, -6, -8], LoArmR: [-52, -12, 0], Hips_pos: [0, -0.03, 0]
      }),
      K(0.405, { Spine: [11, -4, 0], ThighL: [-14, -2, 0], ShinL: [38, 0, 0], ThighR: [-10, 4, 0], ShinR: [28, 0, 0], Hips_pos: [0, -0.062, 0] }),
      K(0.54, {
        Spine: [12, -4, 0], ThighL: [-48, -2, 0], ShinL: [22, 0, 0], ThighR: [32, 4, 0], ShinR: [62, 0, 0],
        UpArmL: [-26, 8, 12], UpArmR: [-30, -6, -8], Hips_pos: [0, -0.03, 0]
      })
    ]
  },

  // JUDGMENT SLASH — one wide horizontal sweep through everything in front of
  // him, turned from the hips. Short anticipation (12 frames — it is meant to
  // be usable in neutral), a hard stop, and he is back in stance immediately.
  swordSlash: {
    dur: 0.65, loop: false, keys: [
      K(0, {}),
      K(0.11, {
        UpArmR: [-46, 42, 22], LoArmR: [-40, 0, 4], HandR: [-24, -70, 0],
        UpArmL: [-30, 22, 22], LoArmL: [-40, 0, 6],
        Chest: [-2, 34, 0], Spine: [0, 20, 0], Hips: [0, -14, 0], Head: [-2, 20, 0], Hips_pos: [0, -0.05, 0]
      }, 'in'),
      K(0.22, {
        UpArmR: [-80, -46, -30], LoArmR: [-12, 0, -4], HandR: [-26, -100, 0],
        UpArmL: [-44, -24, -8], LoArmL: [-34, 0, 4],
        Chest: [-2, -40, 0], Spine: [0, -24, 0], Hips: [2, 46, 0], Head: [-4, -22, 0],
        Hips_pos: [0, -0.10, 0], ThighL: [-28, -4, 0], ShinL: [30, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }, 'snap'),
      K(0.30, { UpArmR: [-78, -46, -30], Chest: [-2, -40, 0], Hips: [2, 46, 0], Hips_pos: [0, -0.10, 0] }, 'hold'),
      K(0.65, {
        UpArmR: [-24, -5, -7], LoArmR: [-30, -14, 0], HandR: [-20, -80, 0],
        Chest: [-2, -6, 0], Spine: [0, -4, 0], Head: [-2, -5, 0], Hips_pos: [0, -0.03, 0]
      }, 'out')
    ]
  },

  // EXECUTION — the committed one. Blade taken straight overhead in both
  // hands, held (this is the 30 frames of startup, and it is meant to be
  // read), then driven DOWN and forward with a long step behind it. Whiffing
  // it leaves him bent over with the point in the floor for 40 frames.
  swordExec: {
    dur: 1.28, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        UpArmR: [-96, -10, -8], LoArmR: [-84, -6, -4], HandR: [-24, -90, 0],
        UpArmL: [-92, 12, 12], LoArmL: [-88, 6, 6], HandL: [-24, 90, 0],
        Chest: [-4, -6, 0], Spine: [-2, -4, 0], Head: [-4, -4, 0], Hips_pos: [0, -0.04, 0]
      }, 'in'),
      // overhead, both hands, and he holds it there
      K(0.36, {
        UpArmR: [-176, -8, -4], LoArmR: [-22, 0, -4], HandR: [-14, -90, 0],
        UpArmL: [-172, 10, 8], LoArmL: [-24, 0, 6], HandL: [-14, 90, 0],
        Chest: [-16, -4, 0], Spine: [-12, -2, 0], Neck: [-6, 0, 0], Head: [-16, -2, 0],
        Hips: [0, 12, 0], Hips_pos: [0, 0.02, 0],
        ThighL: [-8, -2, 0], ShinL: [4, 0, 0], ThighR: [6, 4, 0], ShinR: [6, 0, 0]
      }, 'out'),
      K(0.52, { UpArmR: [-178, -8, -4], UpArmL: [-174, 10, 8], Chest: [-17, -4, 0], Head: [-17, -2, 0], Hips_pos: [0, 0.025, 0] }, 'hold'),
      // down, with the whole body behind it and a long step
      K(0.64, {
        UpArmR: [-30, 2, -4], LoArmR: [-8, 0, 0], HandR: [-56, -90, 0],
        UpArmL: [-26, -2, 4], LoArmL: [-10, 0, 4], HandL: [-56, 90, 0],
        Chest: [40, 0, 0], Spine: [30, 0, 0], Neck: [8, 0, 0], Head: [30, 0, 0],
        Hips: [14, 12, 0], Hips_pos: [0, -0.30, 0],
        ThighL: [-70, -4, 0], ShinL: [56, 0, 0], FootL: [16, -10, 0],
        ThighR: [42, 6, 0], ShinR: [64, 0, 0], FootR: [22, 8, 0]
      }, 'snap'),
      K(0.78, { Chest: [41, 0, 0], Spine: [31, 0, 0], Head: [31, 0, 0], Hips_pos: [0, -0.31, 0], UpArmR: [-28, 2, -4] }, 'hold'),
      // the long recovery: he has to pull the blade back out of the ground
      K(1.02, {
        UpArmR: [-20, 0, -6], LoArmR: [-26, -6, 0], Chest: [22, -2, 0], Spine: [18, -2, 0], Head: [18, -2, 0],
        Hips_pos: [0, -0.20, 0], ThighL: [-40, -4, 0], ShinL: [40, 0, 0], ThighR: [24, 6, 0], ShinR: [40, 0, 0]
      }),
      K(1.28, {
        UpArmR: [-24, -5, -7], LoArmR: [-30, -14, 0], HandR: [-20, -80, 0],
        Chest: [-2, -6, 0], Spine: [0, -4, 0], Head: [-2, -5, 0], Hips_pos: [0, -0.03, 0]
      }, 'out')
    ]
  },

  // ---- THE DUEL -----------------------------------------------------------
  // EXEC HOLD: the blade up over a body that is already down, both hands, arms
  // locked, absolutely still except for the strain. This loops for as long as
  // the contest runs, so it has to hold up under a stare.
  execHold: {
    dur: 1.4, loop: true, keys: [
      K(0, {
        UpArmR: [-172, -10, -6], LoArmR: [-26, 0, -4], HandR: [-16, -90, 0],
        UpArmL: [-168, 12, 10], LoArmL: [-28, 0, 6], HandL: [-16, 90, 0],
        Chest: [-14, -4, 0], Spine: [-10, -2, 0], Neck: [-2, 0, 0], Head: [10, 0, 0],
        Hips: [4, 12, 0], Hips_pos: [0, -0.10, 0],
        ThighL: [-30, -4, 0], ShinL: [30, 0, 0], FootL: [8, -8, 0],
        ThighR: [20, 6, 0], ShinR: [34, 0, 0], FootR: [10, 8, 0]
      }),
      K(0.7, {
        UpArmR: [-176, -10, -6], LoArmR: [-22, 0, -4],
        UpArmL: [-172, 12, 10], LoArmL: [-24, 0, 6],
        Chest: [-16, -4, 0], Head: [12, 0, 0], Hips_pos: [0, -0.115, 0]
      }),
      K(1.4, {
        UpArmR: [-172, -10, -6], LoArmR: [-26, 0, -4],
        UpArmL: [-168, 12, 10], LoArmL: [-28, 0, 6],
        Chest: [-14, -4, 0], Head: [10, 0, 0], Hips_pos: [0, -0.10, 0]
      })
    ]
  },

  // EXEC FALL: the sentence. One motion, no follow-through, and he does not
  // watch it land — the head turns away on the frame the blade arrives.
  execFall: {
    dur: 1.5, loop: false, keys: [
      K(0, {
        UpArmR: [-172, -10, -6], LoArmR: [-26, 0, -4], HandR: [-16, -90, 0],
        UpArmL: [-168, 12, 10], LoArmL: [-28, 0, 6], HandL: [-16, 90, 0],
        Chest: [-14, -4, 0], Spine: [-10, -2, 0], Head: [10, 0, 0], Hips: [4, 12, 0], Hips_pos: [0, -0.10, 0],
        ThighL: [-30, -4, 0], ShinL: [30, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }),
      K(0.10, {
        UpArmR: [-16, 2, -4], LoArmR: [-6, 0, 0], HandR: [-60, -90, 0],
        UpArmL: [-12, -2, 4], LoArmL: [-8, 0, 4], HandL: [-60, 90, 0],
        Chest: [34, 0, -6], Spine: [26, 0, -4], Neck: [4, -14, 0], Head: [16, -30, 0],
        Hips: [16, 12, 0], Hips_pos: [0, -0.32, 0],
        ThighL: [-58, -4, 0], ShinL: [58, 0, 0], ThighR: [36, 6, 0], ShinR: [62, 0, 0]
      }, 'snap'),
      // he stays down there, not looking
      K(0.55, {
        UpArmR: [-15, 2, -4], Chest: [33, 0, -6], Head: [15, -30, 0], Hips_pos: [0, -0.33, 0]
      }, 'hold'),
      // and stands up out of it slowly, blade at his side, still not looking
      K(1.10, {
        UpArmR: [-25, -5, -7], LoArmR: [-29, -13, 0], HandR: [-20, -80, 0],
        UpArmL: [-4, 4, 5], LoArmL: [-12, 9, 2],
        Chest: [-2, -8, 0], Spine: [0, -5, 0], Neck: [-2, -6, 0], Head: [-2, -14, 0], Hips_pos: [0, -0.04, 0],
        ThighL: [-6, -2, 0], ShinL: [4, 0, 0], ThighR: [4, 3, 0], ShinR: [5, 0, 0]
      }, 'out'),
      K(1.5, {
        Chest: [-2, -6, 0], Head: [-2, -8, 0], UpArmR: [-24, -5, -7], LoArmR: [-30, -14, 0], Hips_pos: [0, -0.03, 0]
      }, 'out')
    ]
  },

  // EXEC RECOIL: he loses the contest. The foot arrives in his chest, the
  // blade goes wide, and he is put on his back foot with nothing to show. He
  // comes back up into the SLUMP, not the sword stance — it is already gone.
  execRecoil: {
    dur: 1.15, loop: false, keys: [
      K(0, {
        UpArmR: [-172, -10, -6], LoArmR: [-26, 0, -4], UpArmL: [-168, 12, 10], LoArmL: [-28, 0, 6],
        Chest: [-14, -4, 0], Spine: [-10, -2, 0], Head: [10, 0, 0], Hips: [4, 12, 0], Hips_pos: [0, -0.10, 0],
        ThighL: [-30, -4, 0], ShinL: [30, 0, 0], ThighR: [20, 6, 0], ShinR: [34, 0, 0]
      }),
      K(0.09, {
        UpArmR: [-140, -50, -34], LoArmR: [-20, 0, -4], UpArmL: [-130, 46, 40], LoArmL: [-22, 0, 6],
        Chest: [-30, -10, 6], Spine: [-22, -6, 4], Neck: [-14, 0, 0], Head: [-30, -6, 4],
        Hips: [-14, 18, 0], Hips_pos: [0, -0.05, -0.06],
        ThighL: [-20, -6, 0], ShinL: [24, 0, 0], ThighR: [-6, 8, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      K(0.24, {
        UpArmR: [-118, -40, -28], UpArmL: [-110, 38, 34], Chest: [-26, -10, 5], Head: [-26, -6, 3],
        Hips_pos: [0, -0.08, -0.04]
      }, 'hold'),
      // staggering back, catching himself, and the blade is not in his hand
      K(0.60, {
        UpArmR: [-40, -14, -18], LoArmR: [-56, 0, -6], UpArmL: [-44, 16, 22], LoArmL: [-60, 0, 6],
        Chest: [8, -8, 0], Spine: [10, -5, 0], Head: [6, -6, 0], Hips: [0, 16, 0], Hips_pos: [0, -0.13, 0],
        ThighL: [-34, -4, 0], ShinL: [38, 0, 0], ThighR: [22, 6, 0], ShinR: [40, 0, 0]
      }),
      K(1.15, {}, 'out')   // back to the slump — see HIGURUMA_STANCE
    ]
  },

  // VICTORY — no celebration whatsoever. He straightens his jacket, picks the
  // case back up, and looks away. It was work.
  // ---- TAUNT — "GUILTY." --------------------------------------------------
  // The gavel, and the one hinge his whole animation set is built on: he
  // STRAIGHTENS. His stance is a slump (13 degrees of spine, head down); for a
  // second and a half he is upright and economical, the way he only otherwise
  // is while holding the Executioner's Sword — and then he goes straight back
  // to the slump, which is the sad half of the joke.
  //
  // The tap is a single frame of contact with a hold on it. Everything before
  // it is load, everything after it is collapse.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // THE HINGE. Spine straightens, shoulders back, head comes up.
      K(0.45, {
        Spine: [-4, -5, 0], Chest: [-5, -7, 0], Neck: [-2, -3, 0], Head: [-7, -6, 0],
        UpArmL: [4, 8, 9], LoArmL: [-62, 34, 4],
        UpArmR: [-30, -10, -8], LoArmR: [-64, -24, 0], HandR: [-16, -60, 0],
        Hips_pos: [0, 0.008, 0], Hips: [0, 14, 0]
      }, 'in'),
      // the gavel raised — hand comes up and back, left palm turns to receive
      K(0.90, {
        Spine: [-6, -5, 0], Chest: [-7, -7, 0], Head: [-9, -8, 0],
        UpArmR: [-102, -16, -20], LoArmR: [-92, -34, 0], HandR: [-30, -72, 0],
        UpArmL: [-46, 22, 16], LoArmL: [-104, 40, 4], HandL: [4, 50, 0],
        Hips_pos: [0, 0.012, 0]
      }, 'in'),
      // THE TAP. One frame of contact, and a hold on it — the bubble lands here.
      K(1.10, {
        Spine: [4, -5, 0], Chest: [3, -7, 0], Head: [4, -6, 0], Neck: [2, -3, 0],
        UpArmR: [-58, -18, -14], LoArmR: [-108, -30, 0], HandR: [-24, -66, 0],
        UpArmL: [-46, 22, 16], LoArmL: [-106, 40, 4], HandL: [4, 50, 0],
        Hips_pos: [0, -0.018, 0]
      }, 'snap'),
      K(1.55, {
        Spine: [3, -5, 0], Chest: [2, -7, 0], Head: [3, -6, 0],
        UpArmR: [-56, -18, -14], LoArmR: [-108, -30, 0],
        UpArmL: [-45, 22, 16], LoArmL: [-106, 40, 4],
        Hips_pos: [0, -0.015, 0]
      }, 'hold'),
      // and the slump comes back. Slowly. He is tired.
      K(2.45, {
        Spine: [11, -5, 0], Chest: [9, -7, 0], Neck: [5, -3, 0], Head: [9, -6, 0],
        UpArmR: [-16, -6, -7], LoArmR: [-30, -14, 0], HandR: [-14, -76, 0],
        UpArmL: [5, 6, 8], LoArmL: [-58, 30, 4],
        Hips_pos: [0, -0.03, 0]
      }),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      K(0.7, {
        UpArmL: [-64, -30, 8], LoArmL: [-104, -20, 4], HandL: [-40, 30, 0],
        Chest: [6, -6, 0], Spine: [8, -4, 0], Head: [8, -4, 0], Hips_pos: [0, -0.05, 0]
      }, 'out'),
      K(1.3, { UpArmL: [-56, -26, 8], LoArmL: [-96, -18, 4], Head: [6, -6, 0] }, 'hold'),
      K(2.0, {
        UpArmL: [4, 5, 7], LoArmL: [-54, 30, 4],
        UpArmR: [-6, -3, -5], LoArmR: [-20, -10, 0],
        Chest: [10, -8, 0], Spine: [12, -5, 0], Head: [12, -10, 0], Hips_pos: [0, -0.03, 0]
      }),
      K(2.7, { Head: [10, -22, 0], Neck: [4, -10, 0], Chest: [11, -12, 0], Hips: [0, 12, 0] }, 'out'),
      K(3.4, { Head: [12, -20, 0], Chest: [11, -10, 0], Hips: [0, 14, 0], Hips_pos: [0, -0.02, 0] })
    ]
  }
};
