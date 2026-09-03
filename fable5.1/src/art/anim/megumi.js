// Megumi-specific clips. Movement language: CLOSED. Where Yuji is loose and
// Gojo is all swagger, Megumi holds everything in — square shoulders, elbows
// tucked, chin down, and almost no idle motion at all. He does not gesture.
// The only time he opens up is the instant a summon leaves his hands, and he
// shuts again immediately after.
//
// The summon clips are deliberately four different shapes rather than one
// recycled cast, because which shikigami is bound is supposed to be readable
// from across the screen: palm to the floor for the low ones, the wing-shaped
// clap for Nue (the canonical gesture), a two-finger point for the Serpent,
// and both hands driven down for Max Elephant.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — narrow, bladed, weight back. Sword hand low and ready at the hip,
// off hand tucked across the body. Nothing raised, nothing offered.
export const MEGUMI_STANCE = {
  Hips_pos: [0, -0.05, 0],
  Hips: [0, 28, 0], Spine: [6, -9, 0], Chest: [4, -13, 0], Neck: [1, -4, 0], Head: [4, -10, 0],
  ClavL: [0, 0, 0], UpArmL: [-18, 10, 8], LoArmL: [-96, 34, 0], HandL: [-16, 62, 0],
  ClavR: [0, 0, 0], UpArmR: [-10, -8, -6], LoArmR: [-74, -18, 0], HandR: [-14, -50, 0],
  ThighL: [-20, -5, 0], ShinL: [18, 0, 0], FootL: [3, -14, 0],
  ThighR: [15, 7, 0], ShinR: [24, 0, 0], FootR: [11, 9, 0]
};

export const MEGUMI_CLIPS = {
  // idle: the stillest in the roster on purpose. A slow breath, one small
  // weight shift, the head turning a few degrees and back. That is all.
  idle: {
    dur: 3.6, loop: true, keys: [
      K(0, {}),
      K(1.5, { Chest: [6, -13, 0], Spine: [7, -9, 0], Hips_pos: [0, -0.058, 0], Head: [5, -12, 0], UpArmL: [-20, 10, 9], UpArmR: [-12, -8, -7] }),
      K(2.6, { Head: [3, -4, -2], Chest: [5, -13, 0], Hips_pos: [0, -0.046, 0] }),
      K(3.6, {})
    ]
  },

  // ---- the cursed-tool string ---------------------------------------------
  // Three blade cuts, not fists: a low draw-cut, a return cut across, and a
  // rising diagonal that launches. Reach comes from the weapon, so the body
  // stays compact and only the arm travels.
  punch1: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.07, { UpArmR: [-26, -22, -18], LoArmR: [-96, -14, 0], HandR: [-20, -66, 0], Chest: [4, -30, 0], Hips: [0, 40, 0], Spine: [6, -16, 0] }, 'in'),
      K(0.13, { UpArmR: [-70, 16, 4], LoArmR: [-16, 0, 0], HandR: [-12, -104, 0], Chest: [6, 16, 0], Hips: [0, 12, 0], Spine: [7, 10, 0], Head: [4, -18, 0], UpArmL: [-24, 12, 12], LoArmL: [-88, 30, 0] }, 'snap'),
      K(0.17, { UpArmR: [-72, 16, 4], LoArmR: [-18, 0, 0], Chest: [6, 16, 0], Hips: [0, 12, 0] }, 'hold'),
      K(0.34, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.38, loop: false, keys: [
      K(0, { UpArmR: [-60, 10, 0], LoArmR: [-30, 0, 0], Chest: [5, 10, 0] }),
      K(0.08, { UpArmR: [-56, 30, 16], LoArmR: [-40, 10, 0], HandR: [-20, -30, 0], Chest: [4, 26, 0], Hips: [0, 6, 0], Spine: [6, 14, 0], Hips_pos: [0, -0.062, 0] }, 'in'),
      K(0.15, { UpArmR: [-76, -20, -10], LoArmR: [-14, 0, 0], HandR: [-10, -130, 0], Chest: [6, -26, 0], Hips: [0, 44, 0], Spine: [7, -16, 0], Head: [4, 8, 0], UpArmL: [-30, 8, 18], LoArmL: [-80, 26, 0] }, 'snap'),
      K(0.20, { UpArmR: [-78, -20, -10], LoArmR: [-16, 0, 0], Chest: [6, -28, 0] }, 'hold'),
      K(0.38, {}, 'out')
    ]
  },
  // rising diagonal — the launcher. Deep dip, then the blade goes up.
  punch3: {
    dur: 0.55, loop: false, keys: [
      K(0, { UpArmR: [-60, -12, 0], LoArmR: [-26, 0, 0] }),
      K(0.14, { UpArmR: [10, -26, -18], LoArmR: [-84, -8, -4], HandR: [-14, -40, 0], Chest: [14, -32, 0], Spine: [12, -18, 0], Hips: [4, 44, 0], Hips_pos: [0, -0.17, 0], ThighL: [-32, -5, 0], ShinL: [36, 0, 0], ThighR: [28, 7, 0], ShinR: [50, 0, 0], Head: [8, -12, 0] }, 'in'),
      K(0.24, { UpArmR: [-128, 18, 10], LoArmR: [-30, 0, 0], HandR: [-16, -20, 0], Chest: [-12, 22, 0], Spine: [-9, 12, 0], Hips: [-2, 4, 0], Hips_pos: [0, 0.03, 0], ThighL: [-12, -5, 0], ShinL: [10, 0, 0], ThighR: [6, 7, 0], ShinR: [18, 0, 0], FootR: [26, 9, 0], Head: [-6, -14, 0], UpArmL: [-34, 10, 22], LoArmL: [-84, 26, 0] }, 'snap'),
      K(0.30, { UpArmR: [-130, 18, 10], LoArmR: [-32, 0, 0], Chest: [-12, 22, 0], Hips_pos: [0, 0.03, 0] }, 'hold'),
      K(0.55, {}, 'out')
    ]
  },
  // HEAVY — a two-handed overhead chop brought all the way through
  heavy: {
    dur: 0.82, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-166, -8, -6], LoArmR: [-52, 0, -2], HandR: [-16, -40, 0], UpArmL: [-150, 10, 14], LoArmL: [-56, 0, 4], Chest: [-6, -14, 0], Spine: [-4, -10, 0], Hips: [0, 30, 0], Head: [-6, -8, 0], Hips_pos: [0, -0.055, 0], ThighL: [-24, -5, 0], ShinL: [26, 0, 0] }, 'in'),
      K(0.34, { UpArmR: [-64, 8, -2], LoArmR: [-10, 0, 0], HandR: [-24, -60, 0], UpArmL: [-58, -6, 8], LoArmL: [-16, 0, 0], Chest: [20, 4, 0], Spine: [15, 2, 0], Hips: [4, 8, 0], Head: [14, -8, 0], Hips_pos: [0, -0.18, 0], ThighL: [-38, -5, 0], ShinL: [46, 0, 0], ThighR: [30, 7, 0], ShinR: [56, 0, 0] }, 'snap'),
      K(0.44, { UpArmR: [-62, 8, -2], LoArmR: [-12, 0, 0], Chest: [20, 6, 0], Hips_pos: [0, -0.18, 0] }, 'hold'),
      K(0.82, {}, 'out')
    ]
  },

  // ---- summon shapes -------------------------------------------------------
  // LOW: a drop to one knee, palm pressed flat to the floor. Dogs, Toad,
  // Rabbits all come up out of the ground where he touched it.
  summonLow: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips_pos: [0, -0.30, 0], Spine: [26, -9, 0], Chest: [16, -12, 0], Head: [12, -8, 0], ThighL: [-72, -5, 0], ShinL: [84, 0, 0], ThighR: [-48, 7, 0], ShinR: [92, 0, 0], UpArmR: [-56, -6, -12], LoArmR: [-24, 0, 0], HandR: [-76, 0, 0], UpArmL: [-14, 10, 12], LoArmL: [-40, 22, 0] }, 'snap'),
      K(0.30, { Hips_pos: [0, -0.32, 0], Spine: [28, -9, 0], Head: [10, -9, 0], UpArmR: [-60, -6, -12], HandR: [-80, 0, 0] }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },
  // CLAP: hands brought together in front of the chest and opened into a
  // wing shape — Nue's canonical summoning gesture.
  summonClap: {
    dur: 0.68, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmL: [-64, -26, 10], LoArmL: [-84, -20, 0], HandL: [-30, 26, 0], UpArmR: [-60, 24, -12], LoArmR: [-88, 20, 0], HandR: [-30, -26, 0], Chest: [4, -4, 0], Head: [2, -6, 0], Hips_pos: [0, -0.07, 0] }, 'in'),
      K(0.24, { UpArmL: [-78, -6, 34], LoArmL: [-30, 0, 4], HandL: [-24, 10, 0], UpArmR: [-74, 6, -36], LoArmR: [-30, 0, -4], HandR: [-24, -10, 0], Chest: [-4, -8, 0], Spine: [-3, -6, 0], Head: [-8, -8, 0], Hips_pos: [0, -0.03, 0] }, 'snap'),
      K(0.36, { UpArmL: [-80, -6, 38], UpArmR: [-76, 6, -40], Head: [-10, -8, 0] }, 'hold'),
      K(0.68, {}, 'out')
    ]
  },
  // POINT: two fingers thrown forward, the arm locked straight — the Serpent
  // tears out of the ground along that line.
  summonPoint: {
    dur: 0.74, loop: false, keys: [
      K(0, {}),
      K(0.16, { UpArmR: [-24, -26, -22], LoArmR: [-112, -8, -4], HandR: [-40, -60, 0], Chest: [4, -34, 0], Spine: [6, -18, 0], Hips: [0, 46, 0], Hips_pos: [0, -0.07, 0], Head: [4, -16, 0] }, 'in'),
      K(0.28, { UpArmR: [-88, 8, 2], LoArmR: [-4, 0, 0], HandR: [-16, -90, 0], Chest: [8, 20, 0], Spine: [9, 12, 0], Hips: [0, 6, 0], Head: [4, -16, 0], Hips_pos: [0, -0.11, 0], ThighR: [30, 7, 0], ShinR: [40, 0, 0], UpArmL: [-30, 12, 16], LoArmL: [-90, 28, 0] }, 'snap'),
      K(0.42, { UpArmR: [-90, 8, 2], LoArmR: [-6, 0, 0], Chest: [8, 22, 0], Hips_pos: [0, -0.11, 0] }, 'hold'),
      K(0.74, {}, 'out')
    ]
  },
  // BOTH: both palms driven down into the floor. The one summon he has to
  // commit his whole body to.
  summonBoth: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmL: [-140, 8, 22], LoArmL: [-40, 0, 4], UpArmR: [-146, -6, -20], LoArmR: [-36, 0, -4], Chest: [-14, -6, 0], Spine: [-9, -6, 0], Head: [-14, -8, 0], Hips_pos: [0, -0.02, 0] }, 'in'),
      K(0.38, { UpArmL: [-6, 6, 14], LoArmL: [-16, 0, 4], HandL: [-80, 0, 0], UpArmR: [-2, -6, -12], LoArmR: [-14, 0, -4], HandR: [-80, 0, 0], Chest: [30, 0, 0], Spine: [24, 0, 0], Head: [18, -6, 0], Hips_pos: [0, -0.30, 0], ThighL: [-62, -5, 0], ShinL: [76, 0, 0], ThighR: [-52, 7, 0], ShinR: [80, 0, 0] }, 'snap'),
      K(0.56, { Chest: [30, 0, 0], Head: [16, -6, 0], Hips_pos: [0, -0.32, 0], UpArmL: [-8, 6, 14], UpArmR: [-4, -6, -12] }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },

  // WHEEL — held while the radial selector is open. One hand out low, palm
  // down over his own shadow, everything else braced. He is exposed here and
  // the pose should say so.
  wheel: {
    dur: 0.9, loop: true, keys: [
      K(0, { UpArmR: [-52, -10, -16], LoArmR: [-46, 0, 0], HandR: [-70, -20, 0], UpArmL: [-16, 10, 10], LoArmL: [-100, 30, 0], Chest: [10, -14, 0], Spine: [10, -10, 0], Head: [12, -10, 0], Hips_pos: [0, -0.10, 0], ThighL: [-26, -5, 0], ShinL: [28, 0, 0], ThighR: [20, 7, 0], ShinR: [32, 0, 0] }),
      K(0.45, { UpArmR: [-56, -10, -18], HandR: [-76, -20, 0], Chest: [11, -14, 0], Head: [13, -10, 0], Hips_pos: [0, -0.115, 0] }),
      K(0.9, { UpArmR: [-52, -10, -16], HandR: [-70, -20, 0], Chest: [10, -14, 0], Head: [12, -10, 0], Hips_pos: [0, -0.10, 0] })
    ]
  },

  // SHADOW TRAVEL — he folds down into his own shadow. Short, and the pose
  // reads as sinking rather than as ducking.
  shadowDive: {
    dur: 0.3, loop: false, keys: [
      K(0, {}),
      K(0.12, { Hips_pos: [0, -0.34, 0], Spine: [30, -9, 0], Chest: [20, -12, 0], Head: [16, -8, 0], ThighL: [-76, -5, 0], ShinL: [90, 0, 0], ThighR: [-60, 7, 0], ShinR: [96, 0, 0], UpArmL: [-40, 14, 26], LoArmL: [-60, 20, 0], UpArmR: [-36, -12, -24], LoArmR: [-56, -16, 0] }, 'snap'),
      K(0.3, { Hips_pos: [0, -0.40, 0], Spine: [34, -9, 0], Head: [18, -8, 0], ThighL: [-80, -5, 0], ShinL: [96, 0, 0], ThighR: [-66, 7, 0], ShinR: [100, 0, 0] }, 'hold')
    ]
  },
  shadowRise: {
    dur: 0.26, loop: false, keys: [
      K(0, { Hips_pos: [0, -0.40, 0], Spine: [34, -9, 0], Head: [18, -8, 0], ThighL: [-80, -5, 0], ShinL: [96, 0, 0], ThighR: [-66, 7, 0], ShinR: [100, 0, 0], UpArmL: [-40, 14, 26], UpArmR: [-36, -12, -24] }),
      K(0.12, { Hips_pos: [0, -0.02, 0], Spine: [-6, -9, 0], Chest: [-4, -13, 0], Head: [-6, -10, 0], ThighL: [-14, -5, 0], ShinL: [12, 0, 0], ThighR: [10, 7, 0], ShinR: [16, 0, 0], UpArmL: [-34, 10, 20], UpArmR: [-26, -8, -18] }, 'snap'),
      K(0.26, {}, 'out')
    ]
  },

  // DOMAIN CAST — the hand sign, then the shadow going out from under him.
  // Note the ending: he does NOT throw his arms wide the way a completed
  // domain does. The gesture stalls halfway, because the barrier never closes.
  domainCast: {
    dur: 1.4, loop: false, keys: [
      K(0, {}),
      K(0.30, { UpArmL: [-72, -22, 12], LoArmL: [-104, -18, 0], HandL: [-40, 30, 0], UpArmR: [-70, 20, -14], LoArmR: [-100, 16, 0], HandR: [-40, -30, 0], Chest: [8, -6, 0], Spine: [6, -6, 0], Head: [6, -6, 0], Hips_pos: [0, -0.09, 0] }, 'in'),
      K(0.62, { UpArmL: [-84, -10, 16], LoArmL: [-96, -10, 0], HandL: [-46, 24, 0], UpArmR: [-82, 8, -18], LoArmR: [-94, 8, 0], HandR: [-46, -24, 0], Chest: [2, -6, 0], Head: [-2, -6, 0], Hips_pos: [0, -0.075, 0] }, 'hold'),
      // the sign breaks open — but only partway
      K(0.92, { UpArmL: [-54, 4, 40], LoArmL: [-40, 0, 4], HandL: [-60, 0, 0], UpArmR: [-50, -4, -42], LoArmR: [-38, 0, -4], HandR: [-60, 0, 0], Chest: [12, -8, 0], Spine: [10, -8, 0], Head: [10, -8, 0], Hips_pos: [0, -0.14, 0], ThighL: [-28, -5, 0], ShinL: [30, 0, 0], ThighR: [22, 7, 0], ShinR: [34, 0, 0] }, 'snap'),
      K(1.4, { UpArmL: [-50, 4, 36], LoArmL: [-44, 0, 4], UpArmR: [-46, -4, -38], LoArmR: [-42, 0, -4], Chest: [11, -9, 0], Head: [9, -9, 0], Hips_pos: [0, -0.12, 0] }, 'hold')
    ]
  },

  // victory: he does not celebrate. He turns his shoulder to the camera, the
  // sword goes down, and he looks away.
  // ---- TAUNT — NO BUBBLE. A HAND SIGN AND A DOG. --------------------------
  // Megumi does not trash-talk, so his taunt is a piece of BUSINESS instead: he
  // makes the Ten Shadows sign out of habit, something arrives in the shadow at
  // his feet uninvited, he looks down at it, and he puts it away again. The
  // whole joke is that he is embarrassed about it. (The shadow FX is fired from
  // match.js on `tauntStart`; this clip is the half of it that is his body.)
  //
  // Note the ORDER. The sign is the anticipation and the glance down is the
  // payoff, so the timing is inverted from every other taunt in the game —
  // this one gets slower as it goes.
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // the sign, formed fast and cleanly. He has done this ten thousand times.
      K(0.30, {
        UpArmL: [-72, 28, 10], LoArmL: [-122, 46, 0], HandL: [-14, 76, 0],
        UpArmR: [-68, -26, -12], LoArmR: [-126, -44, 0], HandR: [-14, -76, 0],
        Chest: [6, -14, 0], Spine: [8, -10, 0], Head: [2, -8, 0],
        Hips_pos: [0, -0.062, 0]
      }, 'snap'),
      K(0.62, {
        UpArmL: [-70, 26, 10], LoArmL: [-120, 44, 0],
        UpArmR: [-66, -24, -12], LoArmR: [-124, -42, 0],
        Chest: [5, -14, 0], Head: [3, -8, 0], Hips_pos: [0, -0.06, 0]
      }, 'hold'),
      // he looks DOWN at his own shadow, and the hands come apart
      K(1.10, {
        Head: [30, -4, -6], Neck: [12, -2, -2], Chest: [12, -10, 0], Spine: [14, -8, 0],
        UpArmL: [-24, 14, 12], LoArmL: [-84, 30, 2], HandL: [-14, 54, 0],
        UpArmR: [-20, -12, -10], LoArmR: [-70, -22, 0], HandR: [-14, -48, 0],
        Hips_pos: [0, -0.055, 0]
      }, 'out'),
      // the beat where he is just looking at it
      K(1.75, {
        Head: [32, -6, -7], Neck: [12, -3, -2], Chest: [13, -10, 0],
        UpArmL: [-22, 14, 12], LoArmL: [-86, 30, 2],
        UpArmR: [-19, -12, -10], LoArmR: [-72, -22, 0],
        Hips_pos: [0, -0.05, 0]
      }, 'hold'),
      // and the flat palm that puts it away — down, once, unhurried
      K(2.25, {
        Head: [24, -6, -4], Neck: [9, -3, -1], Chest: [9, -12, 0], Spine: [11, -9, 0],
        UpArmR: [6, -14, -18], LoArmR: [-30, -20, 0], HandR: [-38, -80, 0],
        UpArmL: [-20, 12, 10], LoArmL: [-90, 30, 2],
        Hips_pos: [0, -0.07, 0]
      }, 'snap'),
      K(2.65, {
        Head: [16, -8, -2], Chest: [7, -13, 0],
        UpArmR: [2, -12, -14], LoArmR: [-40, -18, 0], HandR: [-28, -70, 0],
        UpArmL: [-19, 11, 9], LoArmL: [-92, 30, 2], Hips_pos: [0, -0.06, 0]
      }),
      K(3.3, {}, 'out')
    ]
  },
  victory: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      K(0.7, { Hips: [0, 52, 0], Chest: [4, -22, 0], Spine: [6, -14, 0], Head: [6, -26, 0], UpArmR: [-6, -6, -6], LoArmR: [-28, -14, 0], UpArmL: [-10, 8, 6], LoArmL: [-40, 22, 0], Hips_pos: [0, -0.045, 0] }, 'out'),
      K(1.8, { Hips: [0, 58, 0], Head: [8, -34, 0], Chest: [3, -24, 0] }),
      K(3.2, { Hips: [0, 56, 0], Head: [6, -30, 0], Chest: [4, -23, 0] })
    ]
  }
};
