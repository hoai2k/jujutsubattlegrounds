// ===========================================================================
// TOJI — ANIMATION
// ===========================================================================
// THE NOTE, and everything below follows from it: economical, precise, and
// LAZY-LOOKING right up until the instant of violence. He has done this
// thousands of times and finds it boring.
//
// What that means concretely, against how the rest of the roster is authored:
//
//   1. NO WIND-UP. Every other character's strikes open with an anticipation
//      key that pulls AWAY from the target before the swing. Toji's do not.
//      His startup keys are small holds near the neutral pose — the limb barely
//      moves and then arrives. Where the shared library eases in with 'in',
//      his techniques ease with 'hold' and then 'snap'.
//   2. HANDS DOWN. His STANCE has the forearms at -38/-32 rather than the
//      shared -102/-110, so he stands with his hands by his sides instead of
//      in a guard. He is the only fighter on the roster who is not braced.
//   3. THE RECOVERY IS THE PERSONALITY. After every strike he returns to
//      neutral in one key with no follow-through flourish, and the last key of
//      almost everything here is bare `{}` — back to standing there.
//   4. SHOULDERS LEAD, HIPS FOLLOW. The heavy weapons rotate the Chest first
//      and let the Hips catch up a key later, which is what sells the mass of
//      Playful Cloud and the Split Soul Katana without a slow startup.
//
// ---------------------------------------------------------------------------
// THE ARSENAL'S CLIP CONTRACT
// ---------------------------------------------------------------------------
// Four weapons means four stances, eight techniques and four draws on top of
// the full base set. They are named by a strict convention that the arsenal
// code builds by string rather than by lookup table, so adding a fifth weapon
// later means adding clips and nothing else:
//
//   idle<Weapon>   the neutral stance while that weapon is held
//   ct1<Weapon>    that weapon's RB technique
//   ct2<Weapon>    that weapon's RT technique
//   draw<Weapon>   pulling it out of the inventory curse
//
// where <Weapon> is Cloud / Spear / Soul / Chain. Plus two one-offs:
//   arsenal        the radial selector hold — he holds the curse out, bored
//   assassinate    the blitz and the four-weapon sequence
// ===========================================================================

// The loose stance. Deliberately NOT a fighting guard.
export const TOJI_STANCE = {
  Hips_pos: [0, -0.035, 0],
  Hips: [0, 18, 0], Spine: [2, -5, 0], Chest: [1, -7, 0], Neck: [1, -3, 0], Head: [0, -6, 0],
  ClavL: [0, 0, 0], UpArmL: [-8, 4, 5], LoArmL: [-38, 14, 0], HandL: [-8, 34, 0],
  ClavR: [0, 0, 0], UpArmR: [-4, -3, -6], LoArmR: [-32, -12, 0], HandR: [-8, -34, 0],
  ThighL: [-10, -3, 0], ShinL: [10, 0, 0], FootL: [2, -10, 0],
  ThighR: [8, 5, 0], ShinR: [14, 0, 0], FootR: [7, 6, 0]
};

const K = (t, pose, e) => ({ t, pose, e });

export const TOJI_CLIPS = {
  // ---- BASE OVERRIDES ------------------------------------------------------
  // A long, slow, almost bored breathing cycle. 3.4 s against the shared 2.8:
  // he is the only one on the roster not visibly waiting for something.
  idle: {
    dur: 3.4, loop: true, keys: [
      K(0, {}),
      K(1.7, {
        Chest: [3, -7, 0], Spine: [3, -5, 0], Hips_pos: [0, -0.045, 0],
        UpArmL: [-11, 5, 7], UpArmR: [-7, -4, -8], Head: [1, -5, 0]
      }),
      K(3.4, {})
    ]
  },

  // He does not walk like a fighter approaching. He walks like someone
  // crossing a room: low arm swing, upright, no bounce.
  walk: {
    dur: 0.92, loop: true, keys: [
      K(0, {
        ThighL: [-26, -3, 0], ShinL: [10, 0, 0], FootL: [-6, -6, 0],
        ThighR: [20, 5, 0], ShinR: [26, 0, 0], FootR: [12, 6, 0],
        Hips_pos: [0, -0.040, 0], UpArmL: [-20, 5, 6], UpArmR: [-24, -4, -7], Spine: [3, -5, 0]
      }),
      K(0.23, { ThighL: [-4, -3, 0], ShinL: [18, 0, 0], ThighR: [3, 5, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.026, 0] }),
      K(0.46, {
        ThighL: [22, -3, 0], ShinL: [24, 0, 0], FootL: [10, -6, 0],
        ThighR: [-24, 5, 0], ShinR: [12, 0, 0], FootR: [-6, 6, 0],
        Hips_pos: [0, -0.040, 0], UpArmL: [-26, 5, 6], UpArmR: [-18, -4, -7], Spine: [3, -5, 0]
      }),
      K(0.69, { ThighL: [2, -3, 0], ShinL: [15, 0, 0], ThighR: [-6, 5, 0], ShinR: [20, 0, 0], Hips_pos: [0, -0.026, 0] }),
      K(0.92, {
        ThighL: [-26, -3, 0], ShinL: [10, 0, 0], FootL: [-6, -6, 0],
        ThighR: [20, 5, 0], ShinR: [26, 0, 0], FootR: [12, 6, 0],
        Hips_pos: [0, -0.040, 0], UpArmL: [-20, 5, 6], UpArmR: [-24, -4, -7]
      })
    ]
  },

  // FASTEST IN THE ROSTER. 0.44 s against the shared 0.52 — long stride, deep
  // forward lean, and the arms driving rather than pumping.
  run: {
    dur: 0.44, loop: true, keys: [
      K(0, {
        Spine: [22, -3, 0], Chest: [13, -5, 0], Hips: [5, 10, 0],
        ThighL: [-60, -2, 0], ShinL: [26, 0, 0], FootL: [-16, -5, 0],
        ThighR: [38, 3, 0], ShinR: [74, 0, 0], FootR: [32, 5, 0],
        UpArmL: [-30, 6, 8], LoArmL: [-84, 0, 4], UpArmR: [-78, -5, -10], LoArmR: [-78, 0, -4],
        Hips_pos: [0, -0.026, 0]
      }),
      K(0.11, { Spine: [20, -3, 0], ThighL: [-12, -2, 0], ShinL: [32, 0, 0], ThighR: [-18, 3, 0], ShinR: [44, 0, 0], Hips_pos: [0, -0.062, 0] }),
      K(0.22, {
        Spine: [22, -3, 0], Chest: [13, -5, 0], Hips: [5, 10, 0],
        ThighL: [38, -2, 0], ShinL: [74, 0, 0], FootL: [32, -5, 0],
        ThighR: [-60, 3, 0], ShinR: [26, 0, 0], FootR: [-16, 5, 0],
        UpArmL: [-78, 6, 8], LoArmL: [-78, 0, 4], UpArmR: [-30, -5, -10], LoArmR: [-84, 0, -4],
        Hips_pos: [0, -0.026, 0]
      }),
      K(0.33, { Spine: [20, -3, 0], ThighL: [-18, -2, 0], ShinL: [44, 0, 0], ThighR: [-12, 3, 0], ShinR: [32, 0, 0], Hips_pos: [0, -0.062, 0] }),
      K(0.44, {
        Spine: [22, -3, 0], Chest: [13, -5, 0], Hips: [5, 10, 0],
        ThighL: [-60, -2, 0], ShinL: [26, 0, 0], FootL: [-16, -5, 0],
        ThighR: [38, 3, 0], ShinR: [74, 0, 0], FootR: [32, 5, 0],
        UpArmL: [-30, 6, 8], UpArmR: [-78, -5, -10]
      })
    ]
  },

  // THE DASH IS HIS DEFENSIVE IDENTITY, and the i-frames are at the FRONT of
  // it, so the frame that matters is the first one: a hard low push-off with
  // the whole body dropping under the line of the attack, not a hop.
  dash: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.06, {
        Spine: [30, -3, 0], Chest: [17, -5, 0], Hips_pos: [0, -0.155, 0],
        ThighL: [-56, -3, 0], ShinL: [34, 0, 0], ThighR: [36, 5, 0], ShinR: [62, 0, 0],
        UpArmL: [40, 6, 14], LoArmL: [-26, 0, 4], UpArmR: [44, -5, -16], LoArmR: [-22, 0, -4],
        Head: [-6, -6, 0]
      }, 'snap'),
      K(0.30, {
        Spine: [20, -4, 0], Hips_pos: [0, -0.10, 0],
        ThighL: [-42, -3, 0], ShinL: [28, 0, 0], ThighR: [26, 5, 0], ShinR: [48, 0, 0],
        UpArmL: [18, 5, 12], UpArmR: [22, -4, -14]
      })
    ]
  },

  // A guard he can hold all day: elbows in, forearms tight, weight settled.
  // Everyone else braces; he leans on it.
  block: {
    dur: 0.14, loop: false, keys: [
      K(0, {}),
      K(0.10, {
        UpArmL: [-64, 20, 4], LoArmL: [-104, 26, 0], HandL: [-16, 88, 0],
        UpArmR: [-58, -18, -6], LoArmR: [-110, -24, 0], HandR: [-16, -88, 0],
        Spine: [6, -5, 0], Chest: [5, -7, 0], Head: [6, -6, 0],
        Hips_pos: [0, -0.062, 0], ThighL: [-16, -3, 0], ShinL: [16, 0, 0]
      }, 'out'),
      K(0.14, {
        UpArmL: [-64, 20, 4], LoArmL: [-104, 26, 0],
        UpArmR: [-58, -18, -6], LoArmR: [-110, -24, 0], Hips_pos: [0, -0.062, 0]
      })
    ]
  },

  // ---- THE UNARMED STRING --------------------------------------------------
  // "He genuinely can win with his fists." These are the best normals in the
  // game and they are authored as such: no chambering, no shoulder roll, no
  // recoil. The fist is at his side and then it is through you.
  punch1: {
    dur: 0.28, loop: false, keys: [
      K(0, {}),
      K(0.05, { Hips: [0, 22, 0], Chest: [2, -3, 0] }, 'hold'),   // barely moves
      K(0.10, {
        Hips: [0, 4, 0], Spine: [5, 2, 0], Chest: [4, 6, 0],
        UpArmR: [-88, -6, -8], LoArmR: [-8, 0, 0], HandR: [0, -172, 0],
        UpArmL: [-4, 6, 8], LoArmL: [-46, 16, 0],
        Hips_pos: [0, -0.042, 0]
      }, 'snap'),
      K(0.15, { Hips: [0, 4, 0], Spine: [5, 2, 0], UpArmR: [-86, -6, -8], LoArmR: [-10, 0, 0], HandR: [0, -172, 0] }, 'hold'),
      K(0.28, {})
    ]
  },

  punch2: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.05, { Hips: [0, 12, 0] }, 'hold'),
      K(0.11, {
        Hips: [0, 34, 0], Spine: [4, -14, 0], Chest: [3, -20, 0],
        UpArmL: [-86, 10, 10], LoArmL: [-10, 0, 0], HandL: [0, 172, 0],
        UpArmR: [-2, -6, -10], LoArmR: [-40, -14, 0],
        Hips_pos: [0, -0.042, 0]
      }, 'snap'),
      K(0.16, { Hips: [0, 34, 0], UpArmL: [-84, 10, 10], LoArmL: [-12, 0, 0], HandL: [0, 172, 0] }, 'hold'),
      K(0.30, {})
    ]
  },

  // THE LAUNCHER: a rising elbow-into-uppercut off the back leg. The one place
  // he genuinely commits — the hips leave the floor.
  punch3: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.07, { Hips: [0, 26, 0], Hips_pos: [0, -0.085, 0], ThighR: [16, 5, 0], ShinR: [24, 0, 0] }, 'in'),
      K(0.15, {
        Hips: [-8, 0, 0], Spine: [-14, 4, 0], Chest: [-12, 8, 0], Head: [-10, -4, 0],
        UpArmR: [-142, -8, -14], LoArmR: [-26, 0, 0], HandR: [-20, -120, 0],
        UpArmL: [10, 8, 16], LoArmL: [-52, 14, 0],
        Hips_pos: [0, 0.055, 0], ThighL: [-34, -3, 0], ShinL: [20, 0, 0],
        ThighR: [-18, 5, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      K(0.22, { Hips: [-8, 0, 0], Spine: [-13, 4, 0], UpArmR: [-140, -8, -14], Hips_pos: [0, 0.050, 0] }, 'hold'),
      K(0.44, {})
    ]
  },

  // THE HEAVY: an overhand right that puts them on the floor. Still no wind-up
  // to speak of — the arm goes up and comes down in one key.
  heavy: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.11, {
        UpArmR: [-158, -10, -18], LoArmR: [-34, 0, 0],
        Chest: [-8, -20, 0], Spine: [-6, -12, 0], Hips: [0, 32, 0], Hips_pos: [0, -0.05, 0]
      }, 'in'),
      K(0.22, {
        UpArmR: [-52, -6, -6], LoArmR: [-8, 0, 0], HandR: [-30, -150, 0],
        Chest: [22, 12, 0], Spine: [20, 8, 0], Hips: [4, 2, 0], Head: [16, -4, 0],
        UpArmL: [24, 10, 22], LoArmL: [-56, 12, 0],
        Hips_pos: [0, -0.135, 0], ThighL: [-38, -3, 0], ShinL: [30, 0, 0],
        ThighR: [22, 5, 0], ShinR: [44, 0, 0]
      }, 'snap'),
      K(0.30, { UpArmR: [-50, -6, -6], Chest: [21, 12, 0], Spine: [19, 8, 0], Hips_pos: [0, -0.135, 0] }, 'hold'),
      K(0.62, {})
    ]
  },

  // ---- PLAYFUL CLOUD 游雲 --------------------------------------------------
  // The default. Held two-handed across the body, tip low and forward — the
  // reference has him carry it like a bo, not like a club.
  idleCloud: {
    dur: 3.0, loop: true, keys: [
      K(0, {
        UpArmR: [-46, -12, -14], LoArmR: [-72, -18, 0], HandR: [-10, -60, 0],
        UpArmL: [-30, 22, 18], LoArmL: [-88, 30, 0], HandL: [-10, 70, 0],
        Chest: [3, -14, 0], Spine: [3, -9, 0], Hips: [0, 22, 0]
      }),
      K(1.5, {
        UpArmR: [-49, -12, -15], LoArmR: [-74, -18, 0], HandR: [-10, -60, 0],
        UpArmL: [-33, 22, 19], LoArmL: [-90, 30, 0], HandL: [-10, 70, 0],
        Chest: [4, -14, 0], Spine: [4, -9, 0], Hips_pos: [0, -0.044, 0]
      }),
      K(3.0, {
        UpArmR: [-46, -12, -14], LoArmR: [-72, -18, 0], HandR: [-10, -60, 0],
        UpArmL: [-30, 22, 18], LoArmL: [-88, 30, 0], HandL: [-10, 70, 0],
        Chest: [3, -14, 0], Spine: [3, -9, 0]
      })
    ]
  },

  // CT1 — SPINNING SWEEP. A full turn of the hips carrying the staff round at
  // waist height. Two revolutions of the Hips track, because it multi-hits.
  ct1Cloud: {
    dur: 0.72, loop: false, keys: [
      K(0, {
        UpArmR: [-46, -12, -14], LoArmR: [-72, -18, 0],
        UpArmL: [-30, 22, 18], LoArmL: [-88, 30, 0], Hips: [0, 22, 0]
      }),
      K(0.09, { Hips: [0, 58, 0], Chest: [4, -26, 0], Hips_pos: [0, -0.07, 0] }, 'in'),
      K(0.24, {
        Hips: [0, -110, 0], Chest: [6, 30, 0], Spine: [5, 18, 0],
        UpArmR: [-78, -20, -34], LoArmR: [-40, 0, 0],
        UpArmL: [-70, 26, 40], LoArmL: [-48, 0, 0], Hips_pos: [0, -0.085, 0]
      }, 'snap'),
      K(0.40, {
        Hips: [0, -260, 0], Chest: [6, 30, 0],
        UpArmR: [-78, -20, -34], UpArmL: [-70, 26, 40], Hips_pos: [0, -0.085, 0]
      }, 'linear'),
      K(0.54, {
        Hips: [0, -382, 0], Chest: [4, 16, 0],
        UpArmR: [-70, -18, -28], UpArmL: [-62, 24, 34], Hips_pos: [0, -0.07, 0]
      }, 'out'),
      K(0.72, { Hips: [0, 18, 0] })
    ]
  },

  // CT2 — OVERHEAD SLAM. Both hands, straight over the top, guard break.
  ct2Cloud: {
    dur: 0.86, loop: false, keys: [
      K(0, {
        UpArmR: [-46, -12, -14], LoArmR: [-72, -18, 0],
        UpArmL: [-30, 22, 18], LoArmL: [-88, 30, 0]
      }),
      K(0.16, {
        UpArmR: [-176, -8, -12], LoArmR: [-30, 0, 0],
        UpArmL: [-172, 10, 14], LoArmL: [-34, 0, 0],
        Chest: [-16, -6, 0], Spine: [-12, -4, 0], Head: [-12, -5, 0],
        Hips_pos: [0, 0.012, 0], ThighL: [-6, -3, 0], ThighR: [4, 5, 0]
      }, 'in'),
      K(0.30, {
        UpArmR: [-14, -6, -6], LoArmR: [-8, 0, 0],
        UpArmL: [-10, 8, 8], LoArmL: [-10, 0, 0],
        Chest: [34, 0, 0], Spine: [30, 0, 0], Head: [24, -4, 0],
        Hips_pos: [0, -0.175, 0], ThighL: [-48, -3, 0], ShinL: [42, 0, 0],
        ThighR: [-34, 5, 0], ShinR: [48, 0, 0]
      }, 'snap'),
      K(0.42, {
        UpArmR: [-13, -6, -6], UpArmL: [-9, 8, 8],
        Chest: [33, 0, 0], Spine: [29, 0, 0], Hips_pos: [0, -0.175, 0],
        ThighL: [-48, -3, 0], ShinL: [42, 0, 0], ThighR: [-34, 5, 0], ShinR: [48, 0, 0]
      }, 'hold'),
      K(0.86, {})
    ]
  },

  drawCloud: {
    dur: 0.34, loop: false, keys: [
      K(0, { UpArmL: [-64, 26, 20], LoArmL: [-96, 30, 0], UpArmR: [-40, -10, -10], LoArmR: [-70, -16, 0] }),
      K(0.14, {
        UpArmR: [-96, -14, -20], LoArmR: [-52, 0, 0], HandR: [-10, -100, 0],
        UpArmL: [-60, 26, 22], LoArmL: [-92, 30, 0], Chest: [2, -18, 0]
      }, 'snap'),
      K(0.34, {
        UpArmR: [-46, -12, -14], LoArmR: [-72, -18, 0],
        UpArmL: [-30, 22, 18], LoArmL: [-88, 30, 0], Chest: [3, -14, 0]
      })
    ]
  },

  // ---- INVERTED SPEAR OF HEAVEN 天逆鉾 -------------------------------------
  // A short weapon held low and reversed, tucked behind the forearm. He is
  // hiding it, which is exactly what he does with it in the source — Gojo only
  // knows something is wrong when it comes out.
  idleSpear: {
    dur: 3.2, loop: true, keys: [
      K(0, {
        UpArmR: [-6, -8, -10], LoArmR: [-58, -30, 0], HandR: [-14, -104, 0],
        UpArmL: [-10, 6, 6], LoArmL: [-42, 16, 0],
        Chest: [2, -12, 0], Spine: [2, -8, 0]
      }),
      K(1.6, {
        UpArmR: [-9, -8, -11], LoArmR: [-61, -30, 0], HandR: [-14, -104, 0],
        UpArmL: [-13, 6, 7], LoArmL: [-45, 16, 0],
        Chest: [3, -12, 0], Hips_pos: [0, -0.045, 0]
      }),
      K(3.2, {
        UpArmR: [-6, -8, -10], LoArmR: [-58, -30, 0], HandR: [-14, -104, 0],
        UpArmL: [-10, 6, 6], LoArmL: [-42, 16, 0], Chest: [2, -12, 0]
      })
    ]
  },

  // CT1 — the fast piercing thrust. Long reach, straight line, nothing else.
  ct1Spear: {
    dur: 0.36, loop: false, keys: [
      K(0, { UpArmR: [-6, -8, -10], LoArmR: [-58, -30, 0], HandR: [-14, -104, 0] }),
      K(0.05, { Hips: [0, 26, 0] }, 'hold'),
      K(0.12, {
        UpArmR: [-92, -6, -6], LoArmR: [-6, 0, 0], HandR: [-6, -176, 0],
        Hips: [0, 2, 0], Spine: [6, 4, 0], Chest: [5, 8, 0],
        Hips_pos: [0, -0.062, 0], ThighL: [-30, -3, 0], ShinL: [18, 0, 0]
      }, 'snap'),
      K(0.18, { UpArmR: [-90, -6, -6], LoArmR: [-8, 0, 0], Hips: [0, 2, 0], Hips_pos: [0, -0.062, 0] }, 'hold'),
      K(0.36, {})
    ]
  },

  // CT2 — NULLIFY. THE most important sixteen frames in his kit, and the only
  // move in the file with a genuine wind-up: he steps in, drops his weight and
  // drives the blade in short. It has to look like a COMMITTED READ, because
  // that is exactly how it is priced.
  ct2Spear: {
    dur: 0.92, loop: false, keys: [
      K(0, { UpArmR: [-6, -8, -10], LoArmR: [-58, -30, 0], HandR: [-14, -104, 0] }),
      K(0.20, {
        Hips: [0, 46, 0], Chest: [-6, -30, 0], Spine: [-4, -20, 0], Head: [2, -18, 0],
        UpArmR: [12, -14, -16], LoArmR: [-96, -40, 0], HandR: [-20, -120, 0],
        UpArmL: [-24, 14, 12], LoArmL: [-56, 20, 0],
        Hips_pos: [0, -0.085, 0], ThighR: [22, 5, 0], ShinR: [30, 0, 0]
      }, 'in'),
      K(0.30, {
        Hips: [0, 46, 0], Chest: [-6, -30, 0],
        UpArmR: [12, -14, -16], LoArmR: [-96, -40, 0], Hips_pos: [0, -0.09, 0]
      }, 'hold'),
      K(0.40, {
        Hips: [0, -12, 0], Chest: [10, 18, 0], Spine: [9, 12, 0], Head: [6, 2, 0],
        UpArmR: [-74, -4, -4], LoArmR: [-14, 0, 0], HandR: [-4, -178, 0],
        UpArmL: [6, 10, 14], LoArmL: [-40, 12, 0],
        Hips_pos: [0, -0.115, 0], ThighL: [-46, -3, 0], ShinL: [30, 0, 0],
        ThighR: [-16, 5, 0], ShinR: [34, 0, 0]
      }, 'snap'),
      K(0.56, {
        Hips: [0, -12, 0], Chest: [10, 18, 0], UpArmR: [-73, -4, -4],
        Hips_pos: [0, -0.115, 0], ThighL: [-46, -3, 0], ShinL: [30, 0, 0]
      }, 'hold'),
      K(0.92, {})
    ]
  },

  drawSpear: {
    dur: 0.28, loop: false, keys: [
      K(0, { UpArmL: [-64, 26, 20], LoArmL: [-96, 30, 0] }),
      K(0.11, {
        UpArmR: [-86, -12, -16], LoArmR: [-46, 0, 0], HandR: [-12, -96, 0],
        UpArmL: [-58, 26, 22], LoArmL: [-90, 30, 0]
      }, 'snap'),
      K(0.28, {
        UpArmR: [-6, -8, -10], LoArmR: [-58, -30, 0], HandR: [-14, -104, 0],
        UpArmL: [-10, 6, 6], LoArmL: [-42, 16, 0]
      })
    ]
  },

  // ---- SPLIT SOUL KATANA 釈魂刀 --------------------------------------------
  // Carried resting on the shoulder — the reference pose, and it keeps the
  // blade out of the floor at this length.
  // The upper arm stays LOW (-70) and the forearm does the folding (-104).
  // Pass 1 raised the whole arm to -116 and the blade ended up held straight
  // overhead like a hero pose — the opposite of the note for this character.
  idleSoul: {
    dur: 3.1, loop: true, keys: [
      K(0, {
        UpArmR: [-70, -16, -26], LoArmR: [-104, -12, 0], HandR: [-14, -66, 0],
        UpArmL: [-8, 6, 6], LoArmL: [-38, 14, 0],
        Chest: [1, -14, 0], Spine: [2, -8, 0], Head: [0, -10, 0]
      }),
      K(1.55, {
        UpArmR: [-73, -16, -27], LoArmR: [-106, -12, 0], HandR: [-14, -66, 0],
        UpArmL: [-11, 6, 7], LoArmL: [-41, 14, 0],
        Chest: [2, -14, 0], Hips_pos: [0, -0.045, 0]
      }),
      K(3.1, {
        UpArmR: [-70, -16, -26], LoArmR: [-104, -12, 0], HandR: [-14, -66, 0],
        UpArmL: [-8, 6, 6], LoArmL: [-38, 14, 0], Chest: [1, -14, 0]
      })
    ]
  },

  // CT1 — a fast two-cut string off the shoulder: down-across, then back.
  ct1Soul: {
    dur: 0.52, loop: false, keys: [
      K(0, { UpArmR: [-70, -16, -26], LoArmR: [-104, -12, 0] }),
      K(0.10, {
        UpArmR: [-40, -6, -6], LoArmR: [-16, 0, 0], HandR: [-8, -150, 0],
        Hips: [0, -6, 0], Chest: [12, 18, 0], Spine: [10, 12, 0], Hips_pos: [0, -0.075, 0]
      }, 'snap'),
      K(0.16, { UpArmR: [-40, -6, -6], Chest: [12, 18, 0] }, 'hold'),
      K(0.28, {
        UpArmR: [-96, -16, -46], LoArmR: [-40, 0, 0], HandR: [-14, -60, 0],
        Hips: [0, 44, 0], Chest: [4, -28, 0], Spine: [4, -18, 0], Hips_pos: [0, -0.07, 0]
      }, 'snap'),
      K(0.34, { UpArmR: [-95, -16, -46], Hips: [0, 44, 0] }, 'hold'),
      K(0.52, {})
    ]
  },

  // CT2 — THE SOUL CUT. It goes through a guard, so it is authored to look
  // like it does not care about one: a slow, almost gentle draw across the
  // body with none of the impact language the rest of the file uses. No
  // hitstop pose, no braced legs. It simply passes through.
  ct2Soul: {
    dur: 0.84, loop: false, keys: [
      K(0, { UpArmR: [-70, -16, -26], LoArmR: [-104, -12, 0] }),
      K(0.18, {
        UpArmR: [-104, -22, -54], LoArmR: [-84, -12, 0],
        Hips: [0, 52, 0], Chest: [0, -32, 0], Spine: [1, -20, 0], Head: [0, -20, 0],
        Hips_pos: [0, -0.055, 0]
      }, 'in'),
      K(0.40, {
        UpArmR: [-58, -8, -8], LoArmR: [-20, 0, 0], HandR: [-10, -140, 0],
        Hips: [0, -26, 0], Chest: [4, 26, 0], Spine: [4, 18, 0], Head: [2, 8, 0],
        UpArmL: [-14, 10, 20], LoArmL: [-46, 14, 0],
        Hips_pos: [0, -0.070, 0], ThighL: [-26, -3, 0], ThighR: [-4, 5, 0]
      }, 'out'),
      K(0.54, { UpArmR: [-57, -8, -8], Hips: [0, -26, 0], Chest: [4, 26, 0] }, 'hold'),
      K(0.84, {})
    ]
  },

  drawSoul: {
    dur: 0.32, loop: false, keys: [
      K(0, { UpArmL: [-64, 26, 20], LoArmL: [-96, 30, 0] }),
      K(0.13, {
        UpArmR: [-92, -16, -22], LoArmR: [-48, 0, 0],
        UpArmL: [-58, 26, 22], LoArmL: [-90, 30, 0], Chest: [2, -16, 0]
      }, 'snap'),
      K(0.32, {
        UpArmR: [-70, -16, -26], LoArmR: [-104, -12, 0], HandR: [-14, -66, 0],
        UpArmL: [-8, 6, 6], LoArmL: [-38, 14, 0], Chest: [1, -14, 0]
      })
    ]
  },

  // ---- CHAIN OF A THOUSAND MILES 万里ノ鎖 -----------------------------------
  // Hanging from the right hand, coiled loosely in the left. He is not
  // brandishing it; it is just hanging there.
  idleChain: {
    dur: 3.2, loop: true, keys: [
      K(0, {
        UpArmR: [-14, -10, -14], LoArmR: [-44, -18, 0], HandR: [-6, -50, 0],
        UpArmL: [-16, 10, 12], LoArmL: [-62, 22, 0], HandL: [-6, 56, 0],
        Chest: [2, -10, 0], Spine: [2, -7, 0]
      }),
      K(1.6, {
        UpArmR: [-17, -10, -15], LoArmR: [-47, -18, 0],
        UpArmL: [-19, 10, 13], LoArmL: [-65, 22, 0],
        Chest: [3, -10, 0], Hips_pos: [0, -0.045, 0]
      }),
      K(3.2, {
        UpArmR: [-14, -10, -14], LoArmR: [-44, -18, 0],
        UpArmL: [-16, 10, 12], LoArmL: [-62, 22, 0], Chest: [2, -10, 0]
      })
    ]
  },

  // CT1 — the long whip strike: one flick of the wrist and shoulder.
  ct1Chain: {
    dur: 0.48, loop: false, keys: [
      K(0, { UpArmR: [-14, -10, -14], LoArmR: [-44, -18, 0] }),
      K(0.09, {
        UpArmR: [-104, -14, -40], LoArmR: [-70, 0, 0],
        Hips: [0, 44, 0], Chest: [2, -26, 0]
      }, 'in'),
      K(0.19, {
        UpArmR: [-66, -6, -6], LoArmR: [-10, 0, 0], HandR: [-6, -166, 0],
        Hips: [0, -10, 0], Chest: [10, 22, 0], Spine: [9, 14, 0],
        Hips_pos: [0, -0.070, 0], ThighL: [-30, -3, 0]
      }, 'snap'),
      K(0.26, { UpArmR: [-65, -6, -6], Hips: [0, -10, 0], Chest: [10, 22, 0] }, 'hold'),
      K(0.48, {})
    ]
  },

  // CT2 — THE GRAPPLE. Throw, then HAUL: the second half is a two-handed pull
  // back past his own hip, which is what sells "you are coming here".
  ct2Chain: {
    dur: 0.80, loop: false, keys: [
      K(0, { UpArmR: [-14, -10, -14], LoArmR: [-44, -18, 0] }),
      K(0.12, {
        UpArmR: [-118, -12, -28], LoArmR: [-56, 0, 0],
        Hips: [0, 40, 0], Chest: [-4, -24, 0]
      }, 'in'),
      K(0.24, {
        UpArmR: [-84, -6, -8], LoArmR: [-12, 0, 0], HandR: [-6, -170, 0],
        UpArmL: [-68, 10, 12], LoArmL: [-24, 0, 0],
        Hips: [0, 0, 0], Chest: [10, 12, 0], Spine: [9, 8, 0], Hips_pos: [0, -0.06, 0]
      }, 'snap'),
      K(0.46, {
        UpArmR: [26, -14, -22], LoArmR: [-96, -30, 0], HandR: [-16, -80, 0],
        UpArmL: [22, 12, 20], LoArmL: [-92, 26, 0],
        Hips: [0, 20, 0], Chest: [-14, -6, 0], Spine: [-12, -4, 0], Head: [-8, -6, 0],
        Hips_pos: [0, -0.125, 0], ThighL: [-40, -3, 0], ShinL: [34, 0, 0],
        ThighR: [26, 5, 0], ShinR: [46, 0, 0]
      }, 'snap'),
      K(0.58, { UpArmR: [25, -14, -22], UpArmL: [21, 12, 20], Chest: [-14, -6, 0], Hips_pos: [0, -0.125, 0] }, 'hold'),
      K(0.80, {})
    ]
  },

  drawChain: {
    dur: 0.30, loop: false, keys: [
      K(0, { UpArmL: [-64, 26, 20], LoArmL: [-96, 30, 0] }),
      K(0.12, {
        UpArmR: [-80, -14, -18], LoArmR: [-44, 0, 0],
        UpArmL: [-58, 26, 22], LoArmL: [-90, 30, 0]
      }, 'snap'),
      K(0.30, {
        UpArmR: [-14, -10, -14], LoArmR: [-44, -18, 0], HandR: [-6, -50, 0],
        UpArmL: [-16, 10, 12], LoArmL: [-62, 22, 0]
      })
    ]
  },

  // ---- THE INVENTORY CURSE 格納型呪霊 --------------------------------------
  // The swap hold. He puts the curse out on his LEFT palm at chest height and
  // waits with his right hand loose beside it — not reaching, waiting. The
  // whole point of the animation is that it costs him time, so it is authored
  // to look like it is costing him time, and to look like it bores him.
  arsenal: {
    dur: 0.60, loop: true, keys: [
      K(0, {
        UpArmL: [-72, 22, 16], LoArmL: [-72, 26, 0], HandL: [-30, 60, 0],
        UpArmR: [-22, -10, -12], LoArmR: [-52, -20, 0],
        Chest: [2, -14, 0], Spine: [2, -9, 0], Head: [8, -12, 0], Hips: [0, 22, 0]
      }),
      K(0.30, {
        UpArmL: [-76, 22, 17], LoArmL: [-75, 26, 0], HandL: [-32, 60, 0],
        UpArmR: [-25, -10, -13], LoArmR: [-55, -20, 0],
        Chest: [3, -14, 0], Head: [9, -12, 0], Hips_pos: [0, -0.042, 0]
      }),
      K(0.60, {
        UpArmL: [-72, 22, 16], LoArmL: [-72, 26, 0], HandL: [-30, 60, 0],
        UpArmR: [-22, -10, -12], LoArmR: [-52, -20, 0], Chest: [2, -14, 0], Head: [8, -12, 0]
      })
    ]
  },

  // ---- ASSASSINATION -------------------------------------------------------
  // The only long clip he has, and the only thing in the file that looks like
  // effort. Structure:
  //   0.00-0.16  the blitz. Flat, low, arms trailing — he does not raise a
  //              weapon to close, because raising one would be a tell.
  //   0.16-0.30  the catch: one hand into the chest, and they stop.
  //   0.30-1.05  the sequence. Four strikes, one per weapon, each a single
  //              snap key with a two-frame hold. No transitions between them —
  //              the weapon changes between frames, which is the joke.
  //   1.05-1.40  he lets go and steps back. Bored again.
  assassinate: {
    dur: 1.40, loop: false, keys: [
      K(0, {}),
      K(0.06, {
        Spine: [40, -3, 0], Chest: [22, -5, 0], Head: [-14, -6, 0],
        Hips_pos: [0, -0.145, 0],
        ThighL: [-62, -3, 0], ShinL: [40, 0, 0], ThighR: [40, 5, 0], ShinR: [70, 0, 0],
        UpArmL: [58, 8, 10], LoArmL: [-16, 0, 0], UpArmR: [62, -6, -12], LoArmR: [-14, 0, 0]
      }, 'snap'),
      K(0.16, {
        Spine: [36, -3, 0], Chest: [20, -5, 0], Head: [-12, -6, 0],
        Hips_pos: [0, -0.13, 0],
        ThighL: [-54, -3, 0], ShinL: [34, 0, 0], ThighR: [34, 5, 0], ShinR: [62, 0, 0],
        UpArmL: [50, 8, 10], UpArmR: [54, -6, -12]
      }, 'linear'),
      // the catch — left hand into the chest, everything stops
      K(0.24, {
        Spine: [8, -4, 0], Chest: [6, -6, 0], Head: [4, -6, 0],
        UpArmL: [-96, 10, 10], LoArmL: [-14, 0, 0], HandL: [-10, 170, 0],
        UpArmR: [-10, -6, -10], LoArmR: [-40, -16, 0],
        Hips_pos: [0, -0.075, 0], ThighL: [-34, -3, 0], ShinL: [24, 0, 0]
      }, 'snap'),
      K(0.32, { UpArmL: [-95, 10, 10], Spine: [8, -4, 0], Hips_pos: [0, -0.075, 0] }, 'hold'),
      // 1. PLAYFUL CLOUD — a short two-handed jab straight into the body
      K(0.44, {
        UpArmR: [-88, -10, -14], LoArmR: [-28, 0, 0], HandR: [-8, -160, 0],
        UpArmL: [-84, 12, 14], LoArmL: [-30, 0, 0],
        Hips: [0, 2, 0], Chest: [8, 8, 0], Hips_pos: [0, -0.09, 0]
      }, 'snap'),
      K(0.50, { UpArmR: [-87, -10, -14], Chest: [8, 8, 0] }, 'hold'),
      // 2. SPLIT SOUL KATANA — one cut, shoulder to hip
      K(0.62, {
        UpArmR: [-46, -8, -8], LoArmR: [-14, 0, 0], HandR: [-8, -146, 0],
        UpArmL: [-20, 12, 20], LoArmL: [-52, 16, 0],
        Hips: [0, -20, 0], Chest: [12, 24, 0], Spine: [10, 16, 0], Hips_pos: [0, -0.10, 0]
      }, 'snap'),
      K(0.68, { UpArmR: [-45, -8, -8], Chest: [12, 24, 0], Hips: [0, -20, 0] }, 'hold'),
      // 3. CHAIN — a wrap and a haul that turns them round
      K(0.80, {
        UpArmR: [20, -14, -24], LoArmR: [-92, -30, 0],
        UpArmL: [16, 12, 22], LoArmL: [-88, 26, 0],
        Hips: [0, 34, 0], Chest: [-12, -18, 0], Spine: [-10, -12, 0],
        Hips_pos: [0, -0.115, 0], ThighR: [24, 5, 0], ShinR: [42, 0, 0]
      }, 'snap'),
      K(0.86, { UpArmR: [19, -14, -24], Hips: [0, 34, 0], Chest: [-12, -18, 0] }, 'hold'),
      // 4. INVERTED SPEAR — the last one. Short, low, and straight in.
      K(1.00, {
        UpArmR: [-72, -4, -4], LoArmR: [-12, 0, 0], HandR: [-4, -178, 0],
        UpArmL: [8, 10, 16], LoArmL: [-38, 12, 0],
        Hips: [0, -8, 0], Chest: [14, 14, 0], Spine: [12, 10, 0], Head: [8, 0, 0],
        Hips_pos: [0, -0.155, 0], ThighL: [-50, -3, 0], ShinL: [34, 0, 0],
        ThighR: [-20, 5, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      K(1.14, {
        UpArmR: [-71, -4, -4], Chest: [14, 14, 0], Spine: [12, 10, 0],
        Hips_pos: [0, -0.155, 0], ThighL: [-50, -3, 0], ShinL: [34, 0, 0]
      }, 'hold'),
      // and he steps off it
      K(1.40, {})
    ]
  },

  // ---- TAUNT — "NOT WORTH THE MONEY." -------------------------------------
  // BORED. The brief for this one was one word and everything in the clip is
  // that word. He rolls a shoulder, cracks his neck to one side, runs a thumb
  // along the scar at his mouth — and then looks somewhere that is not you, and
  // stays looking there.
  //
  // The last beat is the taunt. Every other character in this roster ends their
  // taunt looking at the opponent; Toji ends his having lost interest, with his
  // weight on one hip, and holds it for most of a second. He has no cursed
  // energy and no technique, so he also gets no flourish — there is not a
  // single symmetrical or "posed" key in here.
  taunt: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      // the shoulder roll: one shoulder, all the way round, nothing else
      K(0.34, {
        UpArmR: [-34, -10, -22], LoArmR: [-46, -16, 0],
        Chest: [-2, -14, -4], Spine: [0, -9, -2], Neck: [1, -4, 2], Head: [1, -10, 3],
        Hips_pos: [0.012, -0.04, 0]
      }, 'in'),
      K(0.58, {
        UpArmR: [22, -4, -14], LoArmR: [-22, -8, 0],
        Chest: [3, -2, 3], Spine: [3, -1, 2], Head: [0, -2, -2],
        Hips_pos: [0.014, -0.03, 0]
      }, 'out'),
      // the neck crack — a small hard snap to one side, and it stays there
      K(0.82, {
        Neck: [0, -2, -13], Head: [-2, -4, -22], Chest: [1, -6, 2],
        UpArmR: [-4, -3, -6], LoArmR: [-32, -12, 0],
        Hips_pos: [0.014, -0.036, 0]
      }, 'snap'),
      K(1.05, {
        Neck: [0, -2, -11], Head: [-2, -4, -19], Chest: [1, -6, 2],
        Hips_pos: [0.014, -0.036, 0]
      }, 'hold'),
      // the thumb along the scar. Slow, absent-minded, not for your benefit.
      K(1.50, {
        UpArmR: [-84, -12, -18], LoArmR: [-118, -46, 0], HandR: [-16, -74, 0],
        UpArmL: [-6, 4, 6], LoArmL: [-40, 14, 0],
        Neck: [1, -3, -4], Head: [2, -8, -7], Chest: [2, -8, 1],
        Hips_pos: [0.012, -0.038, 0]
      }, 'out'),
      K(1.85, {
        UpArmR: [-80, -16, -14], LoArmR: [-112, -52, 0], HandR: [-14, -66, 0],
        UpArmL: [-6, 4, 6], LoArmL: [-40, 14, 0],
        Head: [3, -12, -6], Chest: [2, -9, 1], Hips_pos: [0.012, -0.04, 0]
      }, 'out'),
      // AND HE LOOKS AWAY. Hand drops, weight goes onto one hip, and that is
      // where the clip ends up — not facing you, not finishing anything.
      K(2.25, {
        UpArmR: [-2, -3, -8], LoArmR: [-30, -12, 0], HandR: [-8, -34, 0],
        UpArmL: [-8, 4, 5], LoArmL: [-38, 14, 0],
        Neck: [-2, 9, 0], Head: [-4, 26, -3], Chest: [-1, 6, -2], Spine: [1, 4, -1],
        Hips: [0, 28, 0], Hips_pos: [0.03, -0.052, -0.01],
        ThighL: [-6, -3, 0], ShinL: [7, 0, 0], ThighR: [12, 5, 0], ShinR: [18, 0, 0]
      }, 'out'),
      K(2.72, {
        Neck: [-2, 10, 0], Head: [-4, 28, -3], Chest: [-1, 7, -2],
        UpArmR: [-1, -3, -8], LoArmR: [-31, -12, 0],
        Hips: [0, 29, 0], Hips_pos: [0.032, -0.05, -0.01]
      }, 'hold'),
      K(3.0, {}, 'out')
    ]
  }
};
