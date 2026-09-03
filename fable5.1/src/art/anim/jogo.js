// Jogo-specific clips. Movement language: he FLOATS — stiff, unhurried,
// never human. The body hangs off a raised hip line with the toes pointed;
// locomotion is a tilt-and-glide, not a stride. Deliberately the opposite of
// Mahito's loose slouch: Jogo is rigid, formal, permanently irritated.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — hovering: hips lifted, legs dangling with pointed toes, the old
// man's hunch in the spine, arms held stiffly at his sides.
export const JOGO_STANCE = {
  Hips_pos: [0, 0.09, 0],
  Hips: [0, 16, 0], Spine: [9, -5, 0], Chest: [6, -7, 0], Neck: [0, -3, 0], Head: [-2, -6, 0],
  ClavL: [0, 0, 0], UpArmL: [-8, 6, 14], LoArmL: [-38, 20, 2], HandL: [-14, 50, 0],
  ClavR: [0, 0, 0], UpArmR: [-6, -5, -15], LoArmR: [-42, -18, 0], HandR: [-14, -50, 0],
  ThighL: [-14, -4, 0], ShinL: [26, 0, 0], FootL: [38, -8, 0],
  ThighR: [-8, 6, 0], ShinR: [20, 0, 0], FootR: [42, 8, 0]
};

export const JOGO_CLIPS = {
  // idle: a slow vertical bob with a little forward drift and settle — the
  // crater does the living, the body barely moves
  idle: {
    dur: 3.4, loop: true, keys: [
      K(0, {}),
      K(0.9, { Hips_pos: [0, 0.13, 0], Spine: [15, -5, 0], Head: [4, -10, 0], FootL: [42, -8, 0], FootR: [46, 8, 0] }),
      K(1.8, { Hips_pos: [0, 0.10, 0], Head: [7, -2, 2], Chest: [11, -7, 0] }),
      K(2.6, { Hips_pos: [0, 0.135, 0], Spine: [13, -5, 0], Head: [5, -8, -2] }),
      K(3.4, {})
    ]
  },
  // walk: a level glide — the whole body tips a few degrees into the motion
  // and the dangling legs trail. No footfalls.
  walk: {
    dur: 1.1, loop: true, keys: [
      K(0, { Spine: [18, -5, 0], ThighL: [-20, -4, 0], ThighR: [-14, 6, 0], Hips_pos: [0, 0.10, 0] }),
      K(0.55, { Spine: [16, -5, 0], ThighL: [-16, -4, 0], ThighR: [-18, 6, 0], Hips_pos: [0, 0.125, 0] }),
      K(1.1, { Spine: [18, -5, 0], ThighL: [-20, -4, 0], ThighR: [-14, 6, 0], Hips_pos: [0, 0.10, 0] })
    ]
  },
  // run: the glide tips harder, robe and legs streaming behind
  run: {
    dur: 0.7, loop: true, keys: [
      K(0, { Spine: [26, -4, 0], Chest: [14, -6, 0], Head: [-2, -6, 0], ThighL: [-30, -4, 0], ShinL: [34, 0, 0], ThighR: [-24, 6, 0], ShinR: [28, 0, 0], FootL: [46, -8, 0], FootR: [50, 8, 0], UpArmL: [-2, 6, 22], UpArmR: [0, -5, -24], Hips_pos: [0, 0.12, 0] }),
      K(0.35, { Spine: [24, -4, 0], ThighL: [-26, -4, 0], ThighR: [-28, 6, 0], Hips_pos: [0, 0.145, 0] }),
      K(0.7, { Spine: [26, -4, 0], ThighL: [-30, -4, 0], ThighR: [-24, 6, 0], Hips_pos: [0, 0.12, 0] })
    ]
  },
  dash: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.08, { Spine: [34, -4, 0], Chest: [18, -6, 0], Hips_pos: [0, 0.08, 0], ThighL: [-36, -4, 0], ShinL: [40, 0, 0], ThighR: [-30, 6, 0], ShinR: [36, 0, 0], UpArmL: [16, 6, 26], UpArmR: [18, -5, -28] }, 'out'),
      K(0.34, { Spine: [28, -4, 0], Hips_pos: [0, 0.10, 0], ThighL: [-30, -4, 0], ThighR: [-26, 6, 0] })
    ]
  },
  // punch string: short stiff swats — he fights like someone who resents
  // having to use his hands. The 3rd is the little eruption (both palms shove
  // forward, the pop happens in front of him).
  punch3: {
    dur: 0.5, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmL: [-30, 14, 24], LoArmL: [-70, 10, 4], UpArmR: [-26, -12, -26], LoArmR: [-74, -8, -4], Chest: [4, -7, 0], Spine: [10, -5, 0], Hips_pos: [0, 0.11, 0] }, 'in'),
      K(0.22, { UpArmL: [-78, 4, 6], LoArmL: [-10, 0, 2], HandL: [-30, 90, 0], UpArmR: [-74, -2, -8], LoArmR: [-12, 0, -2], HandR: [-30, -90, 0], Chest: [10, -2, 0], Spine: [14, -2, 0], Head: [4, -6, 0], Hips_pos: [0, 0.07, 0] }, 'snap'),
      K(0.3, { UpArmL: [-78, 4, 6], LoArmL: [-12, 0, 2], UpArmR: [-74, -2, -8], LoArmR: [-14, 0, -2], Chest: [10, -2, 0] }, 'hold'),
      K(0.5, {}, 'out')
    ]
  },
  // HEAVY — MAGMA BURST: he rears back and the whole upper body vents forward
  heavy: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.26, { Spine: [-6, -5, 0], Chest: [-8, -7, 0], Head: [-10, -6, 0], UpArmL: [-20, 10, 30], LoArmL: [-50, 14, 2], UpArmR: [-18, -8, -32], LoArmR: [-54, -12, 0], Hips_pos: [0, 0.14, 0] }, 'in'),
      K(0.4, { Spine: [26, -2, 0], Chest: [18, -3, 0], Head: [12, -6, 0], UpArmL: [-64, 8, 12], LoArmL: [-16, 0, 2], UpArmR: [-60, -6, -14], LoArmR: [-18, 0, -2], Hips_pos: [0, 0.05, 0] }, 'snap'),
      K(0.52, { Spine: [24, -2, 0], Chest: [17, -3, 0], Hips_pos: [0, 0.05, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },
  // EMBER INSECTS: one arm sweeps across, fingers spread — the swarm pours
  // off the sleeve
  ct1: {
    dur: 0.7, loop: false, keys: [
      K(0, {}),
      K(0.16, { UpArmR: [-40, -24, -30], LoArmR: [-80, -10, -4], HandR: [-40, -60, 0], Chest: [6, -22, 0], Hips: [0, 30, 0], Head: [4, -10, 0] }, 'in'),
      K(0.3, { UpArmR: [-84, 18, -2], LoArmR: [-14, 0, 0], HandR: [-60, 0, 0], Chest: [8, 12, 0], Hips: [0, 6, 0], Spine: [12, 4, 0], Head: [2, -12, 0] }, 'snap'),
      K(0.42, { UpArmR: [-86, 22, -2], LoArmR: [-16, 0, 0], HandR: [-60, 0, 0], Chest: [8, 14, 0] }, 'hold'),
      K(0.7, {}, 'out')
    ]
  },
  // VOLCANIC ERUPTION: both hands raised, then driven down toward the marked
  // ground — the gesture of ordering magma up from below
  ct2: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.2, { UpArmL: [-130, 6, 20], LoArmL: [-30, 10, 2], UpArmR: [-134, -4, -22], LoArmR: [-32, -8, 0], Spine: [2, -5, 0], Chest: [-2, -7, 0], Head: [-6, -6, 0], Hips_pos: [0, 0.14, 0] }, 'in'),
      K(0.35, { UpArmL: [-40, 6, 16], LoArmL: [-12, 0, 2], HandL: [-60, 40, 0], UpArmR: [-44, -4, -18], LoArmR: [-14, 0, 0], HandR: [-60, -40, 0], Spine: [22, -3, 0], Chest: [14, -4, 0], Head: [12, -6, 0], Hips_pos: [0, 0.06, 0] }, 'snap'),
      K(0.5, { UpArmL: [-42, 6, 16], UpArmR: [-46, -4, -18], Spine: [20, -3, 0], Hips_pos: [0, 0.06, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },
  // OVERHEAT: the vulnerable channel — head thrown back, arms rigid at his
  // sides, fists clenched, the crater flaring wide open
  overheat: {
    dur: 1.0, loop: false, keys: [
      K(0, {}),
      K(0.25, { Spine: [2, -5, 0], Chest: [-6, -7, 0], Head: [-22, -2, 0], UpArmL: [4, 8, 24], LoArmL: [-16, 12, 2], HandL: [-40, 50, 0], UpArmR: [6, -6, -26], LoArmR: [-18, -10, 0], HandR: [-40, -50, 0], Hips_pos: [0, 0.13, 0] }, 'out'),
      K(0.7, { Head: [-28, 2, 0], Chest: [-8, -7, 0], Hips_pos: [0, 0.155, 0], UpArmL: [6, 8, 28], UpArmR: [8, -6, -30] }, 'hold'),
      K(1.0, {}, 'out')
    ]
  },
  // DOMAIN CAST: the ritual hand sign held at the chest, head bowed, then the
  // arms fling wide as the mountain closes over the arena
  domainCast: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.35, { UpArmL: [-80, -26, 12], LoArmL: [-110, -16, 4], HandL: [-30, 30, 0], UpArmR: [-76, 24, -14], LoArmR: [-114, 18, -4], HandR: [-30, -30, 0], Head: [16, -6, 0], Chest: [12, -6, 0], Hips_pos: [0, 0.06, 0] }, 'out'),
      K(0.85, { UpArmL: [-80, -26, 12], LoArmL: [-110, -16, 4], UpArmR: [-76, 24, -14], LoArmR: [-114, 18, -4], Head: [20, -6, 0], Hips_pos: [0, 0.05, 0] }, 'hold'),
      K(1.15, { UpArmL: [-84, 10, 74], LoArmL: [-10, 0, 4], HandL: [-12, 0, 0], UpArmR: [-80, -10, -78], LoArmR: [-10, 0, -4], HandR: [-12, 0, 0], Head: [-18, -4, 0], Chest: [-6, -7, 0], Spine: [4, -5, 0], Hips_pos: [0, 0.16, 0] }, 'snap'),
      K(1.6, { UpArmL: [-82, 10, 70], UpArmR: [-78, -10, -74], Head: [-15, -4, 0], Hips_pos: [0, 0.14, 0] }, 'hold')
    ]
  },
  // ---- TAUNT — NO BUBBLE. THE HEAD ERUPTS, AND THEN HE IS SAD. ------------
  // A physical taunt, because a cursed spirit's taunt should not be a line of
  // dialogue. Jogo's head is a volcano, so the taunt is the volcano doing what
  // volcanoes do — and then the second half, which is the actual joke and the
  // actual character: he sags, and wipes his eye.
  //
  // The dejection is the payoff, so it gets more frames than the eruption. That
  // ratio is deliberate; an eruption alone would read as a power-up.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the pressure builds — he hunches and everything tightens inward
      K(0.45, {
        Spine: [18, -5, 0], Chest: [14, -7, 0], Neck: [8, -3, 0], Head: [10, -6, 0],
        UpArmL: [-22, 10, 6], LoArmL: [-64, 26, 2], HandL: [-20, 62, 0],
        UpArmR: [-20, -8, -7], LoArmR: [-68, -24, 0], HandR: [-20, -62, 0],
        Hips_pos: [0, 0.03, 0], Hips: [0, 20, 0],
        ThighL: [-20, -4, 0], ShinL: [32, 0, 0], ThighR: [-14, 6, 0], ShinR: [26, 0, 0]
      }, 'in'),
      // THE ERUPTION. Head snaps back, arms fling out, the whole body opens.
      K(0.62, {
        Spine: [-16, -5, 0], Chest: [-14, -7, 0], Neck: [-14, -3, 0], Head: [-26, -6, 0],
        UpArmL: [-40, 12, 62], LoArmL: [-20, 8, 4], HandL: [-8, 30, 0],
        UpArmR: [-36, -10, -64], LoArmR: [-16, -6, -4], HandR: [-8, -30, 0],
        Hips_pos: [0, 0.14, 0], Hips: [0, 12, 0],
        ThighL: [-8, -4, 0], ShinL: [16, 0, 0], ThighR: [-2, 6, 0], ShinR: [12, 0, 0]
      }, 'snap'),
      K(0.82, {
        Spine: [-13, -5, 0], Chest: [-12, -7, 0], Head: [-23, -6, 0],
        UpArmL: [-38, 12, 58], LoArmL: [-22, 8, 4],
        UpArmR: [-34, -10, -60], LoArmR: [-18, -6, -4],
        Hips_pos: [0, 0.12, 0]
      }, 'hold'),
      // and it all comes down. Slowly. Lower than he started.
      K(1.55, {
        Spine: [16, -5, 0], Chest: [13, -7, 0], Neck: [6, -3, 0], Head: [16, -6, 0],
        UpArmL: [-6, 6, 10], LoArmL: [-30, 20, 2], HandL: [-14, 46, 0],
        UpArmR: [-4, -5, -11], LoArmR: [-34, -18, 0], HandR: [-14, -46, 0],
        Hips_pos: [0, 0.045, 0],
        ThighL: [-18, -4, 0], ShinL: [30, 0, 0], ThighR: [-12, 6, 0], ShinR: [24, 0, 0]
      }, 'out'),
      // THE WIPE. One hand comes up to the eye, and stays there a beat.
      K(2.05, {
        UpArmR: [-88, -10, -26], LoArmR: [-120, -44, 0], HandR: [-24, -84, 0],
        UpArmL: [-5, 6, 10], LoArmL: [-32, 20, 2],
        Spine: [18, -5, 0], Chest: [15, -7, 0], Neck: [8, -3, 0], Head: [20, -8, -4],
        Hips_pos: [0, 0.035, 0]
      }, 'out'),
      K(2.55, {
        UpArmR: [-86, -10, -24], LoArmR: [-118, -42, 0],
        Spine: [18, -5, 0], Chest: [15, -7, 0], Head: [21, -8, -4],
        UpArmL: [-5, 6, 10], LoArmL: [-32, 20, 2], Hips_pos: [0, 0.032, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },
  victory: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      K(0.6, { Spine: [8, -5, 0], Chest: [4, -7, 0], Head: [-6, 10, 0], UpArmL: [-10, 6, 16], UpArmR: [-8, -5, -17], Hips_pos: [0, 0.15, 0] }, 'out'),
      K(1.6, { Head: [-4, -14, 0], Chest: [6, -7, 0], Hips_pos: [0, 0.12, 0] }),
      K(3.0, { Head: [-6, 4, 0], Hips_pos: [0, 0.14, 0] })
    ]
  }
};
