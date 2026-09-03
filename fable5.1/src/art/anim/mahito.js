// Mahito-specific clips. Movement language: loose, fluid, far too relaxed —
// weight slouched onto one hip, head tilted, hands idle. Nothing about his
// posture says "fight" until the limb has already stretched. Deliberately the
// opposite of Jogo's rigid hover: Mahito is all slack.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — the casual slouch: hips cocked, one shoulder dropped, head tilted,
// arms dangling. He looks like he's waiting for a bus.
export const MAHITO_STANCE = {
  Hips_pos: [0, -0.03, 0],
  Hips: [-2, 22, 4], Spine: [2, -8, -3], Chest: [1, -10, -2], Neck: [0, -4, 2], Head: [-2, -6, 9],
  ClavL: [0, 0, 0], UpArmL: [-4, 8, 10], LoArmL: [-22, 16, 2], HandL: [-8, 40, 0],
  ClavR: [0, 0, 0], UpArmR: [-2, -6, -12], LoArmR: [-18, -12, 0], HandR: [-8, -40, 0],
  ThighL: [-12, -6, 0], ShinL: [10, 0, 0], FootL: [2, -14, 0],
  ThighR: [10, 8, 2], ShinR: [16, 0, 0], FootR: [7, 10, 0]
};

export const MAHITO_CLIPS = {
  // idle: lazy weight shifts, the head rolling from tilt to tilt — curiosity,
  // not readiness
  idle: {
    dur: 4.2, loop: true, keys: [
      K(0, {}),
      K(1.1, { Head: [-3, 10, -6], Hips: [-2, 24, -3], Hips_pos: [0, -0.045, 0], Chest: [2, -10, 2], UpArmL: [-6, 8, 12], UpArmR: [-4, -6, -10] }),
      K(2.2, { Head: [2, -16, 7], Spine: [3, -8, 2], Hips_pos: [0, -0.025, 0] }),
      K(3.2, { Head: [-4, 2, 10], Hips: [-2, 20, 5], Chest: [0, -10, -3] }),
      K(4.2, {})
    ]
  },
  // SOUL TOUCH: a sudden elastic lunge — the open palm shoots out much
  // further than an arm should reach, the rest of him barely bothering
  ct1: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmR: [-20, -18, -24], LoArmR: [-96, -6, -4], HandR: [-60, -40, 0], Chest: [2, -24, 0], Hips: [-2, 34, 4], Head: [-2, -12, 8] }, 'in'),
      K(0.24, { UpArmR: [-88, 10, 0], LoArmR: [-2, 0, 0], HandR: [-88, 0, 0], Chest: [6, 18, 0], Spine: [6, 10, -2], Hips: [-2, 8, 4], Head: [0, -16, 5], Hips_pos: [0, -0.06, 0], ThighR: [24, 8, 2], ShinR: [30, 0, 0] }, 'snap'),
      K(0.36, { UpArmR: [-90, 10, 0], LoArmR: [-4, 0, 0], HandR: [-88, 0, 0], Chest: [6, 18, 0] }, 'hold'),
      K(0.85, {}, 'out')  // the long whiff recovery is the read he paid for
    ]
  },
  // BODY WEAPON — BLADE: a wide horizontal cleave, torso whipping through
  bwBlade: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.26, { UpArmR: [-40, -30, -60], LoArmR: [-70, -10, -6], HandR: [-30, -70, 0], Chest: [4, -38, 0], Spine: [4, -20, 0], Hips: [-2, 44, 4], Head: [-2, -16, 6], Hips_pos: [0, -0.07, 0] }, 'in'),
      K(0.42, { UpArmR: [-86, 26, 10], LoArmR: [-8, 0, 0], HandR: [-20, -90, 0], Chest: [8, 30, 0], Spine: [8, 18, 0], Hips: [-2, -6, 4], Head: [2, -10, 4], Hips_pos: [0, -0.05, 0], ThighL: [-24, -6, 0], ShinL: [26, 0, 0] }, 'snap'),
      K(0.54, { UpArmR: [-88, 30, 10], LoArmR: [-10, 0, 0], Chest: [8, 32, 0] }, 'hold'),
      K(0.92, {}, 'out')
    ]
  },
  // BODY WEAPON — HAMMER: the swollen arm hauled overhead and dropped
  bwHammer: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.28, { UpArmR: [-158, -6, -10], LoArmR: [-50, 0, -4], HandR: [-20, 0, 0], Chest: [-12, -10, 0], Spine: [-8, -8, 0], Head: [-12, -6, 4], Hips_pos: [0, -0.02, 0] }, 'in'),
      K(0.44, { UpArmR: [-58, 6, -4], LoArmR: [-10, 0, 0], HandR: [-40, 0, 0], Chest: [18, 6, 0], Spine: [14, 2, 0], Head: [10, -8, 2], Hips: [0, 16, 4], Hips_pos: [0, -0.14, 0], ThighL: [-34, -6, 0], ShinL: [40, 0, 0], ThighR: [26, 8, 2], ShinR: [44, 0, 0] }, 'snap'),
      K(0.56, { UpArmR: [-56, 6, -4], Chest: [18, 6, 0], Hips_pos: [0, -0.14, 0] }, 'hold'),
      K(0.92, {}, 'out')
    ]
  },
  // BODY WEAPON — SPIKES: a straight skewering thrust off a deep step
  bwSpikes: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.26, { UpArmR: [-24, -14, -20], LoArmR: [-104, -4, -4], HandR: [-40, -60, 0], Chest: [0, -30, 0], Spine: [2, -16, 0], Hips: [-2, 38, 4], Hips_pos: [0, -0.05, 0] }, 'in'),
      K(0.4, { UpArmR: [-92, 4, 2], LoArmR: [0, 0, 0], HandR: [-30, -90, 0], Chest: [10, 22, 0], Spine: [10, 12, 0], Head: [2, -14, 3], Hips: [-2, 0, 4], Hips_pos: [0, -0.09, 0], ThighR: [30, 8, 2], ShinR: [36, 0, 0] }, 'snap'),
      K(0.52, { UpArmR: [-94, 4, 2], Chest: [10, 24, 0], Hips_pos: [0, -0.09, 0] }, 'hold'),
      K(0.92, {}, 'out')
    ]
  },
  // SUMMON: a lazy crouch, palm pressed flat to the floor — the transfigured
  // human drags itself up where he touched
  summon: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.22, { Hips_pos: [0, -0.3, 0], Spine: [24, -8, 0], Chest: [16, -10, 0], Head: [10, -6, 6], ThighL: [-70, -6, 0], ShinL: [80, 0, 0], ThighR: [-52, 8, 2], ShinR: [88, 0, 0], UpArmR: [-50, -8, -14], LoArmR: [-30, 0, 0], HandR: [-70, 0, 0], UpArmL: [-10, 8, 14], LoArmL: [-30, 16, 2] }, 'in'),
      K(0.45, { Hips_pos: [0, -0.32, 0], Spine: [26, -8, 0], Head: [8, -8, 6], UpArmR: [-54, -8, -14], HandR: [-74, 0, 0] }, 'hold'),
      K(0.7, { Hips_pos: [0, -0.05, 0], Spine: [4, -8, -2], Head: [-2, -6, 8], UpArmR: [-10, -6, -12] }, 'out'),
      K(0.85, {}, 'out')
    ]
  },
  // HEAVY — FLESH MAUL: a slack backhand that suddenly has mass behind it
  heavy: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-60, -34, -50], LoArmR: [-60, -8, -4], Chest: [2, -32, 0], Spine: [2, -18, 0], Hips: [-2, 40, 4], Head: [-4, -14, 8], Hips_pos: [0, -0.04, 0] }, 'in'),
      K(0.36, { UpArmR: [-80, 22, 6], LoArmR: [-12, 0, 0], HandR: [-20, -110, 0], Chest: [10, 26, 0], Spine: [8, 16, 0], Hips: [-2, -2, 4], Head: [4, -8, 2], Hips_pos: [0, -0.1, 0], ThighL: [-28, -6, 0], ShinL: [32, 0, 0] }, 'snap'),
      K(0.46, { UpArmR: [-82, 24, 6], Chest: [10, 28, 0], Hips_pos: [0, -0.1, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },
  // DOMAIN CAST: both palms meet in front of the chest — the self-embodiment
  // sign — then spread slowly apart as the hands close around the world
  domainCast: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.3, { UpArmL: [-70, -30, 8], LoArmL: [-96, -24, 2], HandL: [-40, 20, 0], UpArmR: [-66, 28, -10], LoArmR: [-100, 22, -2], HandR: [-40, -20, 0], Head: [8, -6, 0], Chest: [6, -8, 0], Spine: [4, -8, 0], Hips_pos: [0, -0.06, 0] }, 'out'),
      K(0.8, { Head: [12, -6, 0], Hips_pos: [0, -0.07, 0], UpArmL: [-72, -30, 8], UpArmR: [-68, 28, -10] }, 'hold'),
      K(1.15, { UpArmL: [-80, 4, 46], LoArmL: [-20, 0, 2], HandL: [-20, 0, 0], UpArmR: [-76, -4, -50], LoArmR: [-20, 0, -2], HandR: [-20, 0, 0], Head: [-8, -6, 6], Chest: [-4, -10, 0], Hips_pos: [0, -0.02, 0] }, 'snap'),
      K(1.6, { UpArmL: [-78, 4, 42], UpArmR: [-74, -4, -46], Head: [-6, -6, 8] }, 'hold')
    ]
  },
  // ---- TAUNT — "YOU ARE ONLY A SHAPE." ------------------------------------
  // He demonstrates Idle Transfiguration ON HIMSELF, which is the only reason
  // the line is a threat. The hand comes up in front of his face, the fingers
  // splay much further than fingers go, he turns it over and looks at it with
  // real curiosity — and then WAVES at you with it, cheerfully, before letting
  // it drop.
  //
  // The wave is the whole taunt. Everything before it is setting up how wrong
  // the hand is, so that a friendly gesture made with it lands as a threat.
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // the hand comes up, loose-wristed, in front of the face
      K(0.42, {
        UpArmR: [-92, -14, -20], LoArmR: [-104, -34, 0], HandR: [-4, -30, 0],
        UpArmL: [-4, 8, 12], LoArmL: [-24, 16, 2],
        Chest: [2, -12, -2], Spine: [3, -10, -3], Head: [4, -8, 10], Neck: [1, -4, 2],
        Hips_pos: [0, -0.022, 0]
      }, 'out'),
      // the splay: the wrist rolls hard and the fingers go where fingers do not
      K(0.90, {
        UpArmR: [-96, -10, -16], LoArmR: [-112, -26, 0], HandR: [26, 46, -18],
        UpArmL: [-4, 8, 12], LoArmL: [-26, 16, 2],
        Chest: [1, -12, -2], Head: [8, -4, 14], Neck: [3, -2, 3],
        Hips_pos: [0, -0.026, 0]
      }, 'out'),
      // he turns it over, and looks. Genuinely interested in his own hand.
      K(1.45, {
        UpArmR: [-98, -8, -14], LoArmR: [-116, -20, 0], HandR: [-30, -66, 22],
        UpArmL: [-4, 8, 12], LoArmL: [-26, 16, 2],
        Chest: [1, -12, -2], Head: [10, -2, 15], Neck: [4, -1, 3],
        Hips_pos: [0, -0.028, 0]
      }, 'out'),
      // THE WAVE. Two small wrist beats, and the head comes round to you.
      K(1.85, {
        UpArmR: [-104, -4, -22], LoArmR: [-96, -16, 0], HandR: [-14, -20, -34],
        UpArmL: [-4, 8, 12], LoArmL: [-24, 16, 2],
        Chest: [0, -8, -2], Head: [-2, 2, 6], Neck: [0, 1, 1],
        Hips_pos: [0, -0.024, 0]
      }, 'snap'),
      K(2.10, {
        UpArmR: [-104, -4, -18], LoArmR: [-98, -16, 0], HandR: [-14, -20, 30],
        UpArmL: [-4, 8, 12], LoArmL: [-24, 16, 2],
        Chest: [0, -8, -2], Head: [-3, 4, 7], Hips_pos: [0, -0.024, 0]
      }, 'snap'),
      // and it drops, and it is a normal hand again, and he is smiling
      K(2.60, {
        UpArmR: [-4, -6, -14], LoArmR: [-20, -14, 0], HandR: [-8, -42, 0],
        UpArmL: [-4, 8, 11], LoArmL: [-22, 16, 2],
        Chest: [0, -10, -2], Head: [-4, -4, 10], Neck: [-1, -3, 2],
        Hips_pos: [0, -0.03, 0]
      }, 'out'),
      K(3.3, {}, 'out')
    ]
  },
  // ---- TAUNT — MAHITO 【DISTORTED】: NO BUBBLE ---------------------------
  // The transformed body does not talk. It hunches, the torso OPENS along a
  // line no torso has, something inside turns toward you, and it closes. That
  // is the entire taunt and it is over four keys.
  //
  // The opening is done with the spine and the clavicles rather than with a
  // material trick, so it reads from behind as well as from the front — which
  // it has to, because the gameplay camera puts you behind him half the time.
  tauntDistorted: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the hunch — everything gathers forward and inward
      K(0.55, {
        Spine: [26, -8, -3], Chest: [22, -10, -2], Neck: [-10, -4, 2], Head: [-6, -6, 9],
        ClavL: [0, 0, -14], ClavR: [0, 0, 14],
        UpArmL: [-30, 22, -4], LoArmL: [-58, 30, 2],
        UpArmR: [-28, -20, 2], LoArmR: [-54, -26, 0],
        Hips_pos: [0, -0.09, 0.02], Hips: [-2, 20, 4]
      }, 'in'),
      // IT OPENS. Clavicles swing wide, spine arches back hard, arms go out and
      // BACK — the chest is presented, and there is nothing behind it.
      K(0.95, {
        Spine: [-24, -8, -3], Chest: [-26, -10, -2], Neck: [-16, -4, 2], Head: [-20, -6, 9],
        ClavL: [0, 0, 34], ClavR: [0, 0, -34],
        UpArmL: [34, 30, 54], LoArmL: [-26, 18, 6], HandL: [-6, 24, 0],
        UpArmR: [36, -28, -56], LoArmR: [-22, -16, -6], HandR: [-6, -24, 0],
        Hips_pos: [0, 0.02, -0.03], Hips: [-2, 24, 4]
      }, 'snap'),
      // and it stays open, and something in there is looking at you
      K(1.70, {
        Spine: [-22, -8, -3], Chest: [-24, -10, -2], Neck: [-15, -4, 2], Head: [-19, -4, 6],
        ClavL: [0, 0, 32], ClavR: [0, 0, -32],
        UpArmL: [32, 30, 52], LoArmL: [-28, 18, 6],
        UpArmR: [34, -28, -54], LoArmR: [-24, -16, -6],
        Hips_pos: [0, 0.015, -0.028]
      }, 'hold'),
      // it shuts. Fast, and then completely still, as if nothing happened.
      K(2.05, {
        Spine: [6, -8, -3], Chest: [4, -10, -2], Neck: [-2, -4, 2], Head: [-4, -6, 9],
        ClavL: [0, 0, -6], ClavR: [0, 0, 6],
        UpArmL: [-8, 10, 6], LoArmL: [-24, 16, 2],
        UpArmR: [-6, -8, -8], LoArmR: [-20, -12, 0],
        Hips_pos: [0, -0.045, 0]
      }, 'snap'),
      K(2.60, {
        Spine: [3, -8, -3], Chest: [2, -10, -2], Head: [-3, -6, 9],
        UpArmL: [-5, 9, 9], LoArmL: [-23, 16, 2],
        UpArmR: [-3, -7, -10], LoArmR: [-19, -12, 0],
        Hips_pos: [0, -0.035, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      K(0.5, { Head: [-6, 14, 10], Chest: [-2, -10, -4], Hips: [-2, 26, 6], UpArmL: [-6, 8, 12], UpArmR: [-4, -6, -14], Hips_pos: [0, -0.045, 0] }, 'out'),
      K(1.5, { Head: [4, -18, -8], Spine: [3, -8, 3], Hips_pos: [0, -0.02, 0] }),
      K(2.4, { Head: [-8, 6, 12], Chest: [0, -10, -2] }),
      K(3.2, { Head: [-2, -6, 9] })
    ]
  }
};
