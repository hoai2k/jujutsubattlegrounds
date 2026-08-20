// URO — clips. Movement language: WEIGHTLESS.
// ===========================================================================
// The note for this character is "floating, unhurried, and slightly detached
// from gravity even when grounded. She should never look fully planted." Three
// rules produce all of it, and every clip below obeys them:
//
//   1. THE HIPS NEVER SIT AT ZERO. `Hips_pos` y is positive in the stance and
//      in every key — she is always a few centimetres off her own feet, even
//      standing. Jogo floats too, but he floats RIGID; she floats LOOSE, which
//      is the whole difference between the two and is carried in rule 2.
//   2. NOTHING ARRIVES ON A HARD KEY unless it is an impact. Almost every key
//      here is eased ('in' on the approach, default smooth elsewhere); the two
//      places that use 'snap' are the moment Thin Ice Breaker shatters and the
//      moment a Warp Strike emerges, and they read enormously because they are
//      the only hard edges in the set.
//   3. THE FEET TRAIL. Toes are pointed and the legs lag behind the hips
//      everywhere. She does not push off the ground; the ground is simply
//      where her feet happen to be.
//
// ---------------------------------------------------------------------------
// THE AERIAL SET — the second full movement set
// ---------------------------------------------------------------------------
// Every clip suffixed `Air` is the hovering version, selected by the `Air`
// swap in combat/fighter.js `_clip` — the same mechanism Kashimo's charged
// cycles, Inumaki's throat idles, Maki's stage neutrals and Panda's per-stance
// set already use. A clip with no `Air` variant falls straight through to the
// grounded one, which is what lets this set be complete without every single
// reaction having to be authored twice.
//
// Authored: idleAir, walkAir, runAir, dashAir, punch1Air, punch2Air,
// punch3Air, blockAir, ct1Air, ct2Air, reflectAir. The reactions
// (hitLight/hitHeavy/launched/knockdown) deliberately do NOT have air
// variants: being hit out of a hover should look like being hit, and the
// grounded reaction reads correctly on a body with no ground under it.
//
// THE DISTINCTION BETWEEN THE TWO SETS is posture, not pose. Grounded, her
// legs are under her and merely unweighted. Airborne, they hang and drift —
// one knee up, the other trailing, the spine leaned back, the whole body
// steering from the shoulders. She looks like she is lying on the air.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — standing, barely. Hips lifted 6 cm, weight nowhere, one shoulder
// dropped, chin up and turned slightly away. The neutral is a woman who has
// not decided whether this is worth her attention.
export const URO_STANCE = {
  Hips_pos: [0, 0.062, 0],
  Hips: [0, 22, 0], Spine: [-2, -6, 0], Chest: [-3, -9, 0], Neck: [2, -4, 0], Head: [-4, -13, 2],
  ClavL: [0, 0, 0], UpArmL: [-14, 8, 13], LoArmL: [-58, 24, 0], HandL: [-14, 56, 0],
  ClavR: [0, 0, 0], UpArmR: [-9, -6, -16], LoArmR: [-46, -20, 0], HandR: [-12, -54, 0],
  ThighL: [-11, -5, 0], ShinL: [16, 0, 0], FootL: [26, -10, 0],
  ThighR: [7, 6, 0], ShinR: [13, 0, 0], FootR: [31, 8, 0]
};

export const URO_CLIPS = {
  // ---- GROUNDED LOCOMOTION -------------------------------------------------
  // idle: a long, slow rise-and-settle on the hips with the head drifting
  // independently of the chest. 3.6 s — the longest idle in the project, so
  // that standing next to a Yuji or a Kashimo she is visibly on a different
  // clock.
  idle: {
    dur: 3.6, loop: true, keys: [
      K(0, {}),
      K(1.1, { Hips_pos: [0, 0.086, 0], Spine: [-4, -6, 0], Chest: [-5, -9, 0], Head: [-6, -9, 3], UpArmL: [-19, 8, 17], UpArmR: [-13, -6, -20], FootL: [30, -10, 0], FootR: [35, 8, 0] }),
      K(2.2, { Hips_pos: [0, 0.070, 0], Head: [-2, -18, 0], Chest: [-2, -9, 0], UpArmL: [-12, 8, 11], UpArmR: [-7, -6, -14] }),
      K(2.9, { Hips_pos: [0, 0.090, 0], Spine: [-5, -6, 0], Head: [-6, -11, 4] }),
      K(3.6, {})
    ]
  },
  // walk: a glide. The legs cycle, but shallowly and late, and the hips do not
  // dip — there is no weight transfer because there is no weight.
  walk: {
    dur: 1.06, loop: true, keys: [
      K(0, { ThighL: [-19, -5, 0], ShinL: [12, 0, 0], FootL: [22, -10, 0], ThighR: [14, 6, 0], ShinR: [17, 0, 0], FootR: [34, 8, 0], Hips_pos: [0, 0.068, 0], Spine: [-1, -6, 0], UpArmL: [-19, 8, 12], UpArmR: [-13, -6, -15] }),
      K(0.53, { ThighL: [15, -5, 0], ShinL: [18, 0, 0], FootL: [33, -10, 0], ThighR: [-18, 6, 0], ShinR: [11, 0, 0], FootR: [23, 8, 0], Hips_pos: [0, 0.078, 0], UpArmL: [-13, 8, 12], UpArmR: [-19, -6, -15] }),
      K(1.06, { ThighL: [-19, -5, 0], ShinL: [12, 0, 0], FootL: [22, -10, 0], ThighR: [14, 6, 0], ShinR: [17, 0, 0], FootR: [34, 8, 0], Hips_pos: [0, 0.068, 0] })
    ]
  },
  // run: the same glide with the whole body tipped forward and the legs
  // streaming. She still does not plant — the stride is a drift with a lean.
  run: {
    dur: 0.62, loop: true, keys: [
      K(0, { Spine: [13, -5, 0], Chest: [7, -8, 0], Head: [-6, -10, 0], ThighL: [-34, -5, 0], ShinL: [22, 0, 0], FootL: [30, -10, 0], ThighR: [22, 6, 0], ShinR: [40, 0, 0], FootR: [40, 8, 0], UpArmL: [-6, 8, 20], LoArmL: [-72, 12, 0], UpArmR: [-2, -6, -23], LoArmR: [-66, -12, 0], Hips_pos: [0, 0.082, 0] }),
      K(0.31, { Spine: [12, -5, 0], ThighL: [22, -5, 0], ShinL: [40, 0, 0], FootL: [40, -10, 0], ThighR: [-34, 6, 0], ShinR: [22, 0, 0], FootR: [30, 8, 0], UpArmL: [-2, 8, 20], UpArmR: [-6, -6, -23], Hips_pos: [0, 0.094, 0] }),
      K(0.62, { Spine: [13, -5, 0], ThighL: [-34, -5, 0], ShinL: [22, 0, 0], ThighR: [22, 6, 0], ShinR: [40, 0, 0], Hips_pos: [0, 0.082, 0] })
    ]
  },
  dash: {
    dur: 0.32, loop: false, keys: [
      K(0, {}),
      K(0.07, { Spine: [16, -5, 0], Chest: [9, -8, 0], Hips_pos: [0, 0.11, 0], ThighL: [-30, -5, 0], ShinL: [30, 0, 0], ThighR: [-22, 6, 0], ShinR: [26, 0, 0], FootL: [46, -10, 0], FootR: [48, 8, 0], UpArmL: [12, 8, 26], LoArmL: [-34, 8, 0], UpArmR: [16, -6, -28], LoArmR: [-30, -8, 0] }, 'out'),
      K(0.32, { Spine: [8, -5, 0], Hips_pos: [0, 0.088, 0], ThighL: [-20, -5, 0], ThighR: [-14, 6, 0], UpArmL: [-4, 8, 18], UpArmR: [0, -6, -20] })
    ]
  },
  // jump: barely a crouch. There is no compression because there is nothing to
  // push against — she just leaves.
  jump: {
    dur: 0.46, loop: false, keys: [
      K(0, { Hips_pos: [0, 0.02, 0], Spine: [6, -6, 0], ThighL: [-30, -5, 0], ShinL: [34, 0, 0], ThighR: [-24, 6, 0], ShinR: [30, 0, 0] }),
      K(0.14, { Hips_pos: [0, 0.13, 0], Spine: [-12, -6, 0], Chest: [-8, -9, 0], Head: [-10, -10, 0], ThighL: [-22, -5, 0], ShinL: [24, 0, 0], FootL: [44, -10, 0], ThighR: [4, 6, 0], ShinR: [22, 0, 0], FootR: [48, 8, 0], UpArmL: [-58, 8, 34], LoArmL: [-40, 10, 0], UpArmR: [-48, -6, -36], LoArmR: [-46, -10, 0] }, 'out'),
      K(0.46, { Hips_pos: [0, 0.10, 0], ThighL: [-32, -5, 0], ShinL: [38, 0, 0], ThighR: [-10, 6, 0], ShinR: [26, 0, 0], UpArmL: [-46, 8, 28], UpArmR: [-38, -6, -30] })
    ]
  },

  // =========================================================================
  // THE AERIAL SET
  // =========================================================================
  // hoverIdle. The signature pose of the character: leaned back on the air,
  // one knee drawn up, the other leg trailing, arms loose and low, head tilted.
  // She is RECLINING. Nothing about it reads as effort, which is the entire
  // point — every other character in the roster is standing on something.
  idleAir: {
    dur: 4.0, loop: true, keys: [
      K(0, { Hips_pos: [0, 0.02, 0], Hips: [-9, 22, 0], Spine: [-13, -6, 0], Chest: [-9, -9, 0], Neck: [4, -4, 0], Head: [-8, -16, 4], UpArmL: [-26, 10, 30], LoArmL: [-44, 22, 0], HandL: [-8, 50, 0], UpArmR: [-18, -8, -34], LoArmR: [-36, -18, 0], HandR: [-6, -48, 0], ThighL: [-46, -6, 4], ShinL: [58, 0, 0], FootL: [40, -10, 0], ThighR: [-8, 7, 0], ShinR: [16, 0, 0], FootR: [46, 8, 0] }),
      K(1.3, { Hips_pos: [0, 0.10, 0], Hips: [-12, 22, 0], Spine: [-16, -6, 0], Head: [-11, -12, 6], UpArmL: [-31, 10, 35], UpArmR: [-23, -8, -38], ThighL: [-52, -6, 4], ShinL: [64, 0, 0], ThighR: [-3, 7, 0], FootR: [50, 8, 0] }),
      K(2.5, { Hips_pos: [0, 0.05, 0], Hips: [-8, 22, 0], Head: [-5, -22, 0], Chest: [-6, -9, 0], UpArmL: [-21, 10, 26], UpArmR: [-13, -8, -30], ThighL: [-41, -6, 4], ShinL: [52, 0, 0], ThighR: [-12, 7, 0] }),
      K(4.0, { Hips_pos: [0, 0.02, 0], Hips: [-9, 22, 0], Spine: [-13, -6, 0], Head: [-8, -16, 4], UpArmL: [-26, 10, 30], UpArmR: [-18, -8, -34], ThighL: [-46, -6, 4], ShinL: [58, 0, 0], ThighR: [-8, 7, 0] })
    ]
  },
  // walkAir — a slow drift. The body angles into the direction of travel from
  // the SHOULDERS; the legs never participate, which is the read that says she
  // is not swimming, she is being carried.
  walkAir: {
    dur: 2.2, loop: true, keys: [
      K(0, { Hips_pos: [0, 0.04, 0], Hips: [-6, 22, 0], Spine: [-6, -6, 0], Chest: [2, -9, 0], Head: [-4, -14, 3], UpArmL: [-34, 10, 24], LoArmL: [-40, 20, 0], UpArmR: [-26, -8, -28], LoArmR: [-34, -16, 0], ThighL: [-34, -6, 3], ShinL: [42, 0, 0], FootL: [44, -10, 0], ThighR: [-14, 7, 0], ShinR: [24, 0, 0], FootR: [48, 8, 0] }),
      K(1.1, { Hips_pos: [0, 0.10, 0], Hips: [-8, 22, 0], Spine: [-8, -6, 0], Head: [-6, -10, 5], UpArmL: [-40, 10, 28], UpArmR: [-32, -8, -32], ThighL: [-40, -6, 3], ShinL: [48, 0, 0], ThighR: [-9, 7, 0] }),
      K(2.2, { Hips_pos: [0, 0.04, 0], Hips: [-6, 22, 0], Spine: [-6, -6, 0], Head: [-4, -14, 3], UpArmL: [-34, 10, 24], UpArmR: [-26, -8, -28], ThighL: [-34, -6, 3], ThighR: [-14, 7, 0] })
    ]
  },
  // runAir — the drift with intent. She tips face-down and streams, arms swept
  // back, legs together and trailing. This is the only pose in the set that
  // looks like flying rather than like floating, and it is deliberately the
  // one she is in least often.
  runAir: {
    dur: 1.0, loop: true, keys: [
      K(0, { Hips_pos: [0, 0.06, 0], Hips: [16, 22, 0], Spine: [22, -5, 0], Chest: [14, -8, 0], Neck: [-8, -4, 0], Head: [-18, -8, 0], UpArmL: [46, 10, 30], LoArmL: [-24, 12, 0], HandL: [-6, 44, 0], UpArmR: [50, -8, -32], LoArmR: [-20, -10, 0], HandR: [-4, -42, 0], ThighL: [16, -5, 2], ShinL: [22, 0, 0], FootL: [54, -10, 0], ThighR: [21, 6, -2], ShinR: [18, 0, 0], FootR: [56, 8, 0] }),
      K(0.5, { Hips_pos: [0, 0.10, 0], Hips: [18, 22, 0], Spine: [24, -5, 0], Head: [-20, -6, 0], UpArmL: [52, 10, 34], UpArmR: [56, -8, -36], ThighL: [20, -5, 2], ThighR: [17, 6, -2], ShinL: [26, 0, 0], ShinR: [22, 0, 0] }),
      K(1.0, { Hips_pos: [0, 0.06, 0], Hips: [16, 22, 0], Spine: [22, -5, 0], Head: [-18, -8, 0], UpArmL: [46, 10, 30], UpArmR: [50, -8, -32], ThighL: [16, -5, 2], ThighR: [21, 6, -2] })
    ]
  },
  // dashAir — the air dash. A whip: she folds, snaps flat, and streams.
  dashAir: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.06, { Hips_pos: [0, 0.06, 0], Hips: [-22, 22, 0], Spine: [-18, -6, 0], Chest: [-12, -9, 0], ThighL: [-64, -6, 4], ShinL: [72, 0, 0], ThighR: [-52, 7, 0], ShinR: [66, 0, 0], UpArmL: [-52, 10, 40], UpArmR: [-44, -8, -44] }, 'in'),
      K(0.13, { Hips_pos: [0, 0.09, 0], Hips: [24, 22, 0], Spine: [28, -5, 0], Chest: [16, -8, 0], Head: [-22, -8, 0], ThighL: [22, -5, 2], ShinL: [16, 0, 0], ThighR: [26, 6, -2], ShinR: [14, 0, 0], FootL: [58, -10, 0], FootR: [60, 8, 0], UpArmL: [62, 10, 30], LoArmL: [-16, 10, 0], UpArmR: [66, -8, -32], LoArmR: [-14, -8, 0] }, 'snap'),
      K(0.34, { Hips_pos: [0, 0.07, 0], Hips: [16, 22, 0], Spine: [20, -5, 0], Head: [-16, -8, 0], ThighL: [16, -5, 2], ThighR: [20, 6, -2], UpArmL: [48, 10, 28], UpArmR: [52, -8, -30] })
    ]
  },
  // blockAir — she does not raise a guard so much as turn a shoulder and put a
  // sheet of space in the way. Both hands come up flat, palms out, and the
  // body angles away.
  blockAir: {
    dur: 0.16, loop: false, keys: [
      K(0, {}),
      K(0.11, { Hips: [-6, 30, 0], Spine: [-6, 2, 0], Chest: [-4, 6, 0], Head: [2, 10, 0], UpArmL: [-70, 30, 16], LoArmL: [-96, 34, 0], HandL: [-12, 92, 0], UpArmR: [-62, -26, -18], LoArmR: [-104, -32, 0], HandR: [-12, -92, 0], ThighL: [-40, -6, 4], ShinL: [50, 0, 0], ThighR: [-14, 7, 0], ShinR: [26, 0, 0] }, 'out'),
      K(0.16, { UpArmL: [-70, 30, 16], LoArmL: [-96, 34, 0], UpArmR: [-62, -26, -18], LoArmR: [-104, -32, 0], Hips: [-6, 30, 0] })
    ]
  },

  // ---- THE PUNCH STRING ---------------------------------------------------
  // Not punches. She SWEEPS — an open hand drawn across the space in front of
  // her, and the damage is whatever the space did on the way past. Every one
  // of them travels further than the arm does, which is why the hand keeps
  // moving after the hit key.
  punch1: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.08, { UpArmR: [-46, -18, -22], LoArmR: [-84, -26, 0], HandR: [-8, -70, 0], Chest: [-6, 8, 0], Hips: [0, 34, 0], Hips_pos: [0, 0.072, 0] }, 'in'),
      K(0.15, { UpArmR: [-24, 22, -8], LoArmR: [-16, 12, 0], HandR: [-4, 20, 0], Chest: [2, -22, 0], Spine: [0, -14, 0], Hips: [0, 8, 0], Hips_pos: [0, 0.066, 0], Head: [-2, -2, -3] }, 'snap'),
      K(0.22, { UpArmR: [-18, 32, -6], LoArmR: [-14, 16, 0], Chest: [2, -26, 0] }, 'hold'),
      K(0.36, {})
    ]
  },
  punch2: {
    dur: 0.38, loop: false, keys: [
      K(0, {}),
      K(0.08, { UpArmL: [-42, 20, 20], LoArmL: [-80, 30, 0], HandL: [-8, 72, 0], Chest: [-4, -24, 0], Hips: [0, 6, 0] }, 'in'),
      K(0.16, { UpArmL: [-22, -20, 6], LoArmL: [-16, -12, 0], HandL: [-4, -18, 0], Chest: [4, 20, 0], Spine: [2, 12, 0], Hips: [0, 38, 0], Head: [-2, 4, 3] }, 'snap'),
      K(0.24, { UpArmL: [-16, -30, 4], LoArmL: [-12, -16, 0], Chest: [4, 24, 0] }, 'hold'),
      K(0.38, {})
    ]
  },
  // punch3 — the launcher. She turns her palm UP and lifts, and the opponent
  // goes with the gesture. There is no impact in it at all; the arm rises
  // slowly and the body goes up as if she had simply decided it should.
  punch3: {
    dur: 0.56, loop: false, keys: [
      K(0, {}),
      K(0.12, { UpArmR: [-30, -14, -18], LoArmR: [-92, -20, 0], HandR: [-30, -80, 0], Hips_pos: [0, 0.040, 0], Spine: [8, -6, 0], Chest: [6, -9, 0], ThighL: [-24, -5, 0], ShinL: [26, 0, 0] }, 'in'),
      K(0.26, { UpArmR: [-108, -6, -30], LoArmR: [-26, -6, 0], HandR: [-46, -12, 0], Hips_pos: [0, 0.14, 0], Spine: [-14, -6, 0], Chest: [-10, -9, 0], Head: [-14, -8, 0], ThighL: [-34, -5, 0], ShinL: [40, 0, 0], ThighR: [-10, 6, 0], FootL: [46, -10, 0], FootR: [50, 8, 0] }, 'out'),
      K(0.36, { UpArmR: [-118, -4, -34], LoArmR: [-22, -6, 0], Hips_pos: [0, 0.155, 0], Head: [-16, -6, 0] }, 'hold'),
      K(0.56, {})
    ]
  },
  // the aerial string: the same three sweeps with the legs hanging. Authored
  // separately rather than shared, because the grounded versions rock a hip
  // over a planted foot and there is no foot.
  punch1Air: {
    dur: 0.36, loop: false, keys: [
      K(0, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ShinL: [56, 0, 0], ThighR: [-10, 7, 0], ShinR: [20, 0, 0] }),
      K(0.08, { UpArmR: [-48, -18, -24], LoArmR: [-86, -26, 0], Chest: [-6, 10, 0], Hips: [-8, 34, 0] }, 'in'),
      K(0.15, { UpArmR: [-22, 24, -6], LoArmR: [-14, 12, 0], Chest: [2, -24, 0], Spine: [-8, -14, 0], Hips: [-8, 6, 0], ThighL: [-38, -6, 4], ThighR: [-16, 7, 0] }, 'snap'),
      K(0.22, { UpArmR: [-16, 34, -4], Chest: [2, -28, 0] }, 'hold'),
      K(0.36, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ThighR: [-10, 7, 0] })
    ]
  },
  punch2Air: {
    dur: 0.38, loop: false, keys: [
      K(0, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ShinL: [56, 0, 0], ThighR: [-10, 7, 0] }),
      K(0.08, { UpArmL: [-44, 22, 22], LoArmL: [-82, 30, 0], Chest: [-4, -26, 0], Hips: [-8, 4, 0] }, 'in'),
      K(0.16, { UpArmL: [-20, -22, 8], LoArmL: [-14, -12, 0], Chest: [4, 22, 0], Spine: [-8, 12, 0], Hips: [-8, 40, 0], ThighL: [-34, -6, 4], ThighR: [-20, 7, 0] }, 'snap'),
      K(0.24, { UpArmL: [-14, -32, 6], Chest: [4, 26, 0] }, 'hold'),
      K(0.38, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ThighR: [-10, 7, 0] })
    ]
  },
  punch3Air: {
    dur: 0.56, loop: false, keys: [
      K(0, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ShinL: [56, 0, 0], ThighR: [-10, 7, 0] }),
      K(0.12, { UpArmR: [-32, -14, -20], LoArmR: [-92, -20, 0], Spine: [-4, -6, 0], ThighL: [-52, -6, 4], ShinL: [64, 0, 0] }, 'in'),
      K(0.28, { UpArmR: [-116, -6, -32], LoArmR: [-22, -6, 0], HandR: [-46, -12, 0], Hips_pos: [0, 0.09, 0], Hips: [-18, 22, 0], Spine: [-22, -6, 0], Chest: [-14, -9, 0], Head: [-18, -8, 0], ThighL: [-30, -6, 4], ShinL: [40, 0, 0], ThighR: [-2, 7, 0], FootL: [56, -10, 0], FootR: [58, 8, 0] }, 'out'),
      K(0.38, { UpArmR: [-124, -4, -36], Hips_pos: [0, 0.10, 0], Head: [-20, -6, 0] }, 'hold'),
      K(0.56, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ThighR: [-10, 7, 0] })
    ]
  },

  // HEAVY — FOLD. Both hands come down together, palms flat, as though closing
  // a lid. The knockdown is the ground arriving, not her hitting them.
  heavy: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmL: [-128, 12, 26], LoArmL: [-30, 14, 0], HandL: [-40, 60, 0], UpArmR: [-124, -10, -28], LoArmR: [-26, -12, 0], HandR: [-40, -58, 0], Spine: [-16, -6, 0], Chest: [-12, -9, 0], Head: [-14, -8, 0], Hips_pos: [0, 0.15, 0], ThighL: [-34, -5, 0], ShinL: [40, 0, 0], ThighR: [-24, 6, 0], ShinR: [34, 0, 0] }, 'in'),
      K(0.34, { UpArmL: [-14, 12, 16], LoArmL: [-64, 14, 0], HandL: [-16, 62, 0], UpArmR: [-10, -10, -18], LoArmR: [-60, -12, 0], HandR: [-16, -60, 0], Spine: [24, -6, 0], Chest: [16, -9, 0], Head: [16, -8, 0], Hips_pos: [0, 0.010, 0], ThighL: [-26, -5, 0], ShinL: [30, 0, 0] }, 'snap'),
      K(0.48, { Spine: [20, -6, 0], Chest: [13, -9, 0], Hips_pos: [0, 0.018, 0] }, 'hold'),
      K(0.86, {})
    ]
  },

  // ---- RB · THIN ICE BREAKER ----------------------------------------------
  // Three beats, and the middle one is the whole technique:
  //   TOUCH   she reaches out and lays a palm flat on the air. Still.
  //   CRACK   she holds it there. Nothing moves for a fifth of a second, which
  //           is the longest hold in her set and is what makes the break land.
  //   BREAK   the hand drives forward two centimetres and the whole plane goes.
  // The 'snap' on the break key is one of exactly two hard edges in this file.
  ct1: {
    dur: 0.80, loop: false, keys: [
      K(0, {}),
      K(0.16, { UpArmR: [-86, -10, -22], LoArmR: [-30, -10, 0], HandR: [-30, -14, 0], Spine: [-4, -14, 0], Chest: [-4, -18, 0], Head: [-6, -20, 2], Hips_pos: [0, 0.086, 0], Hips: [0, 34, 0], ThighL: [-18, -5, 0], ShinL: [22, 0, 0] }, 'in'),
      K(0.30, { UpArmR: [-92, -6, -20], LoArmR: [-22, -8, 0], HandR: [-34, -8, 0], Spine: [-5, -15, 0], Head: [-7, -21, 2], Hips_pos: [0, 0.090, 0] }, 'hold'),
      K(0.40, { UpArmR: [-96, -4, -24], LoArmR: [-8, -6, 0], HandR: [-40, -4, 0], Spine: [4, -8, 0], Chest: [3, -11, 0], Head: [0, -12, 0], Hips_pos: [0, 0.058, 0], Hips: [0, 16, 0], ThighL: [-24, -5, 0], ShinL: [28, 0, 0], ThighR: [12, 6, 0] }, 'snap'),
      K(0.52, { UpArmR: [-94, -6, -26], LoArmR: [-12, -6, 0], Spine: [3, -9, 0], Hips_pos: [0, 0.062, 0] }, 'hold'),
      K(0.80, {})
    ]
  },
  ct1Air: {
    dur: 0.80, loop: false, keys: [
      K(0, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ShinL: [56, 0, 0], ThighR: [-10, 7, 0] }),
      K(0.16, { UpArmR: [-88, -10, -24], LoArmR: [-30, -10, 0], Spine: [-14, -14, 0], Head: [-10, -20, 2], Hips: [-8, 34, 0], ThighL: [-52, -6, 4], ShinL: [64, 0, 0] }, 'in'),
      K(0.30, { UpArmR: [-94, -6, -22], LoArmR: [-22, -8, 0], Head: [-11, -21, 2] }, 'hold'),
      K(0.40, { UpArmR: [-98, -4, -26], LoArmR: [-8, -6, 0], Spine: [-6, -8, 0], Head: [-4, -12, 0], Hips: [-8, 14, 0], ThighL: [-36, -6, 4], ThighR: [-18, 7, 0] }, 'snap'),
      K(0.52, { UpArmR: [-96, -6, -28], Spine: [-8, -9, 0] }, 'hold'),
      K(0.80, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ThighR: [-10, 7, 0] })
    ]
  },

  // ---- RT · SPACE WARP STRIKE ---------------------------------------------
  // THE ANIMATION LIES, AND THAT IS THE MOVE. She throws a perfectly ordinary
  // committed straight down the middle — the biggest, most readable, most
  // obviously telegraphed attack in her set — and it does not arrive there.
  // The clip is authored to look like a technique aimed straight ahead
  // BECAUSE the payload emerges somewhere else, and the mismatch between what
  // the body says and where the hit lands is the whole point.
  //
  // The one concession to fairness is the wind-up: both hands describe the
  // fold before she commits, so an opponent who knows the move knows a warp is
  // coming — they just do not know from where.
  ct2: {
    dur: 1.02, loop: false, keys: [
      K(0, {}),
      K(0.18, { UpArmL: [-64, 26, 22], LoArmL: [-84, 34, 0], HandL: [-24, 74, 0], UpArmR: [-58, -22, -24], LoArmR: [-88, -30, 0], HandR: [-24, -72, 0], Spine: [-10, -6, 0], Chest: [-8, -9, 0], Head: [-10, -10, 0], Hips_pos: [0, 0.104, 0], ThighL: [-26, -5, 0], ShinL: [32, 0, 0], ThighR: [-16, 6, 0], ShinR: [28, 0, 0] }, 'in'),
      K(0.32, { UpArmL: [-72, 8, 44], LoArmL: [-52, 16, 0], HandL: [-30, 40, 0], UpArmR: [-66, -6, -46], LoArmR: [-56, -14, 0], HandR: [-30, -38, 0], Spine: [-13, -6, 0], Head: [-13, -8, 0], Hips_pos: [0, 0.116, 0] }, 'hold'),
      K(0.46, { UpArmL: [-88, 34, 10], LoArmL: [-96, 40, 0], UpArmR: [-84, -30, -12], LoArmR: [-100, -36, 0], Spine: [6, -6, 0], Chest: [5, -9, 0], Hips_pos: [0, 0.070, 0] }, 'in'),
      K(0.56, { UpArmL: [-100, 4, 20], LoArmL: [-12, 6, 0], HandL: [-44, 8, 0], UpArmR: [-96, -4, -22], LoArmR: [-10, -6, 0], HandR: [-44, -8, 0], Spine: [12, -6, 0], Chest: [8, -9, 0], Head: [6, -8, 0], Hips_pos: [0, 0.034, 0], ThighL: [-32, -5, 0], ShinL: [38, 0, 0], ThighR: [18, 6, 0] }, 'snap'),
      K(0.70, { UpArmL: [-96, 6, 24], UpArmR: [-92, -6, -26], Spine: [10, -6, 0], Hips_pos: [0, 0.040, 0] }, 'hold'),
      K(1.02, {})
    ]
  },
  ct2Air: {
    dur: 1.02, loop: false, keys: [
      K(0, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ShinL: [56, 0, 0], ThighR: [-10, 7, 0] }),
      K(0.18, { UpArmL: [-66, 26, 24], LoArmL: [-86, 34, 0], UpArmR: [-60, -22, -26], LoArmR: [-90, -30, 0], Spine: [-18, -6, 0], Head: [-12, -10, 0], Hips: [-14, 22, 0], ThighL: [-54, -6, 4], ShinL: [66, 0, 0] }, 'in'),
      K(0.32, { UpArmL: [-74, 8, 46], LoArmL: [-52, 16, 0], UpArmR: [-68, -6, -48], LoArmR: [-56, -14, 0], Spine: [-21, -6, 0] }, 'hold'),
      K(0.46, { UpArmL: [-90, 34, 12], LoArmL: [-98, 40, 0], UpArmR: [-86, -30, -14], LoArmR: [-102, -36, 0], Spine: [-6, -6, 0], Hips: [-4, 22, 0] }, 'in'),
      K(0.56, { UpArmL: [-102, 4, 22], LoArmL: [-12, 6, 0], UpArmR: [-98, -4, -24], LoArmR: [-10, -6, 0], Spine: [2, -6, 0], Chest: [4, -9, 0], Head: [2, -8, 0], Hips: [4, 22, 0], ThighL: [-28, -6, 4], ThighR: [-24, 7, 0] }, 'snap'),
      K(0.70, { UpArmL: [-98, 6, 26], UpArmR: [-94, -6, -28], Spine: [0, -6, 0] }, 'hold'),
      K(1.02, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ThighR: [-10, 7, 0] })
    ]
  },

  // ---- B · SKY REFLECT ----------------------------------------------------
  // She turns side-on and puts ONE open palm out, flat, at arm's length —
  // the gesture of holding up a mirror rather than of blocking. The clip has
  // three phases matching the stance's three: startup (the hand travels out),
  // active (dead still — the only frames in her whole set with NO motion at
  // all, which is what makes the window readable), and recovery (the hand
  // drops and she has to reset).
  reflect: {
    dur: 0.84, loop: false, keys: [
      K(0, {}),
      K(0.13, { UpArmR: [-84, 12, -26], LoArmR: [-24, 10, 0], HandR: [-52, 4, 0], Hips: [0, 42, 0], Spine: [0, 16, 0], Chest: [-2, 20, 0], Head: [-4, 4, 6], Hips_pos: [0, 0.082, 0], UpArmL: [-22, 30, 8], LoArmL: [-72, 34, 0], ThighL: [-16, -5, 0], ShinL: [20, 0, 0], ThighR: [10, 6, 0] }, 'out'),
      // ACTIVE — identical key. Two identical keys is a genuine freeze, and it
      // is the only one in this file; see the note in anim/miwa.js about the
      // static sheathe stance for why that reads as intent rather than as a
      // hung frame.
      K(0.46, { UpArmR: [-84, 12, -26], LoArmR: [-24, 10, 0], HandR: [-52, 4, 0], Hips: [0, 42, 0], Spine: [0, 16, 0], Chest: [-2, 20, 0], Head: [-4, 4, 6], Hips_pos: [0, 0.082, 0], UpArmL: [-22, 30, 8], LoArmL: [-72, 34, 0], ThighL: [-16, -5, 0], ShinL: [20, 0, 0], ThighR: [10, 6, 0] }, 'hold'),
      K(0.62, { UpArmR: [-52, 4, -22], LoArmR: [-54, -6, 0], HandR: [-24, -30, 0], Hips: [0, 30, 0], Spine: [0, 6, 0], Chest: [-2, 4, 0], Hips_pos: [0, 0.070, 0] }),
      K(0.84, {})
    ]
  },
  reflectAir: {
    dur: 0.84, loop: false, keys: [
      K(0, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ShinL: [56, 0, 0], ThighR: [-10, 7, 0] }),
      K(0.13, { UpArmR: [-86, 12, -28], LoArmR: [-24, 10, 0], HandR: [-52, 4, 0], Hips: [-6, 44, 0], Spine: [-8, 16, 0], Chest: [-8, 20, 0], Head: [-6, 4, 6], UpArmL: [-24, 30, 10], LoArmL: [-72, 34, 0], ThighL: [-40, -6, 4], ShinL: [50, 0, 0], ThighR: [-14, 7, 0] }, 'out'),
      K(0.46, { UpArmR: [-86, 12, -28], LoArmR: [-24, 10, 0], HandR: [-52, 4, 0], Hips: [-6, 44, 0], Spine: [-8, 16, 0], Chest: [-8, 20, 0], Head: [-6, 4, 6], UpArmL: [-24, 30, 10], LoArmL: [-72, 34, 0], ThighL: [-40, -6, 4], ShinL: [50, 0, 0], ThighR: [-14, 7, 0] }, 'hold'),
      K(0.62, { UpArmR: [-54, 4, -24], LoArmR: [-54, -6, 0], Hips: [-8, 32, 0], Spine: [-12, 6, 0] }),
      K(0.84, { Hips: [-8, 22, 0], ThighL: [-44, -6, 4], ThighR: [-10, 7, 0] })
    ]
  },

  // ---- D-PAD RIGHT · DOMAIN EXPANSION: THE WARPED FIRMAMENT ---------------
  // REPLACES the pull-down cast that belonged to the cut "Sky Collapse" burst.
  // That one ended with her almost on the floor, which was the right shape for
  // bringing a sky down and the wrong shape entirely for this: a domain cast
  // ends OPEN, in the pose the barrier resolves around, and she in particular
  // should never finish an ultimate on the ground.
  //
  // The gesture is a TURN, not a pull, because that is what the domain does —
  // it rotates the coordinates of the space inside it.
  //
  //   0.00-0.55  both arms rise wide and slow, palms up, and she rises with
  //              them (Hips_pos climbs the whole way and never comes back
  //              down — she casts this in the air, off the floor).
  //   0.55-0.95  the hands close. The only place in her whole set they do.
  //   0.95-1.45  THE TURN. Hips, spine and chest counter-rotate against the
  //              arms — the body says the world moved, not her. This is the
  //              beat the interior's twist is built to echo.
  //   1.45-1.90  she opens her hands again and holds, arms wide, head level,
  //              looking straight ahead at somebody whose floor has just
  //              stopped being theirs. Nothing about it is triumphant.
  domainCast: {
    dur: 1.90, loop: false, keys: [
      K(0, {}),
      K(0.55, { UpArmL: [-152, 14, 40], LoArmL: [-16, 10, 0], HandL: [-38, 18, 0], UpArmR: [-150, -12, -42], LoArmR: [-14, -10, 0], HandR: [-38, -16, 0], Spine: [-18, -6, 0], Chest: [-13, -9, 0], Neck: [-5, -4, 0], Head: [-20, -6, 0], Hips_pos: [0, 0.205, 0], ThighL: [-26, -5, 0], ShinL: [30, 0, 0], ThighR: [-18, 6, 0], ShinR: [26, 0, 0], FootL: [48, -10, 0], FootR: [52, 8, 0] }, 'out'),
      // the grip
      K(0.95, { UpArmL: [-158, 8, 30], LoArmL: [-12, 8, 0], HandL: [-56, 12, 0], UpArmR: [-156, -6, -32], LoArmR: [-10, -8, 0], HandR: [-56, -12, 0], Spine: [-20, -6, 0], Head: [-22, -5, 0], Hips_pos: [0, 0.232, 0] }, 'hold'),
      // THE TURN — arms one way, body the other
      K(1.24, { UpArmL: [-146, 40, 22], LoArmL: [-20, 26, 0], HandL: [-52, 34, 0], UpArmR: [-144, 16, -24], LoArmR: [-18, 10, 0], HandR: [-52, 8, 0], Hips: [0, -26, 0], Spine: [-16, 22, 0], Chest: [-11, 26, 0], Neck: [-4, 10, 0], Head: [-16, 20, 0], Hips_pos: [0, 0.246, 0] }, 'in'),
      K(1.45, { UpArmL: [-148, -14, 26], LoArmL: [-18, -8, 0], HandL: [-50, -10, 0], UpArmR: [-146, -40, -28], LoArmR: [-16, -24, 0], HandR: [-50, -30, 0], Hips: [0, 24, 0], Spine: [-16, -20, 0], Chest: [-11, -24, 0], Neck: [-4, -9, 0], Head: [-16, -18, 0], Hips_pos: [0, 0.252, 0] }, 'snap'),
      // open, level, still up
      K(1.70, { UpArmL: [-104, 12, 58], LoArmL: [-10, 8, 0], HandL: [-16, 22, 0], UpArmR: [-102, -10, -60], LoArmR: [-8, -8, 0], HandR: [-16, -20, 0], Hips: [0, 0, 0], Spine: [-6, -6, 0], Chest: [-4, -9, 0], Neck: [0, -4, 0], Head: [-2, -6, 0], Hips_pos: [0, 0.244, 0], ThighL: [-20, -5, 0], ShinL: [24, 0, 0], ThighR: [-14, 6, 0], ShinR: [20, 0, 0], FootL: [44, -10, 0], FootR: [48, 8, 0] }, 'out'),
      K(1.90, { UpArmL: [-100, 12, 60], UpArmR: [-98, -10, -62], Spine: [-6, -6, 0], Head: [-2, -6, 0], Hips_pos: [0, 0.240, 0], ThighL: [-20, -5, 0], ShinL: [24, 0, 0], ThighR: [-14, 6, 0], ShinR: [20, 0, 0] })
    ]
  },

  // ---- TAUNT --------------------------------------------------------------
  // See the entry in combat/taunts.js for the reference. She adjusts her hair
  // and stretches, MID-AIR, while the fight happens — the flex being that she
  // does not need to stand on the ground to disrespect you.
  //
  // Shot by shot:
  //   0.00-0.55  she rolls back onto the air and stretches both arms overhead,
  //              spine arching, one leg extending — an unhurried full-body
  //              stretch, the sort you do when nobody is watching
  //   0.55-1.30  the right hand comes down to the crest and idly sets it
  //              straight. Two small adjustments, not one.
  //   1.30-1.90  she looks BACK at the opponent, chin down, and the smallest
  //              possible shift of weight — the beat the line lands on
  //   1.90-3.20  she settles, arms folding, still not looking at them properly
  taunt: {
    dur: 3.30, loop: false, keys: [
      K(0, {}),
      K(0.34, { Hips_pos: [0, 0.13, 0], Hips: [-14, 22, 0], Spine: [-22, -6, 0], Chest: [-16, -9, 0], Neck: [-8, -4, 0], Head: [-24, -8, 0], UpArmL: [-146, 12, 30], LoArmL: [-18, 10, 0], HandL: [-30, 24, 0], UpArmR: [-142, -10, -32], LoArmR: [-16, -10, 0], HandR: [-30, -22, 0], ThighL: [-38, -5, 0], ShinL: [28, 0, 0], ThighR: [-6, 6, 0], ShinR: [12, 0, 0], FootL: [54, -10, 0], FootR: [58, 8, 0] }, 'out'),
      K(0.58, { Hips_pos: [0, 0.155, 0], Spine: [-26, -6, 0], Head: [-28, -6, 0], UpArmL: [-154, 10, 26], UpArmR: [-150, -8, -28], ThighL: [-44, -5, 0], ShinL: [20, 0, 0] }, 'hold'),
      // the hand goes to the hair
      K(0.86, { Hips_pos: [0, 0.118, 0], Hips: [-8, 22, 0], Spine: [-14, -6, 0], Head: [-10, -22, 6], UpArmL: [-30, 12, 18], LoArmL: [-70, 16, 0], UpArmR: [-128, -8, -20], LoArmR: [-96, -14, 0], HandR: [-40, -30, 0], ThighL: [-30, -5, 0], ThighR: [-4, 6, 0] }),
      K(1.06, { UpArmR: [-134, -6, -16], LoArmR: [-102, -12, 0], HandR: [-48, -24, 0], Head: [-8, -26, 8] }),
      K(1.24, { UpArmR: [-126, -10, -22], LoArmR: [-92, -16, 0], HandR: [-34, -34, 0], Head: [-12, -20, 5] }),
      // ...and she finally looks at you
      K(1.52, { Hips_pos: [0, 0.092, 0], Hips: [-4, 22, 0], Spine: [-6, -6, 0], Chest: [-4, -9, 0], Neck: [4, -4, 0], Head: [6, 6, -2], UpArmR: [-28, -8, -20], LoArmR: [-62, -18, 0], HandR: [-14, -50, 0], UpArmL: [-20, 10, 15], LoArmL: [-60, 22, 0], ThighL: [-14, -5, 0], ShinL: [18, 0, 0], ThighR: [8, 6, 0] }, 'out'),
      K(1.78, { Head: [8, 8, -3], Chest: [-3, -7, 0], Hips_pos: [0, 0.086, 0] }, 'hold'),
      K(2.40, { Hips_pos: [0, 0.078, 0], Head: [2, -6, 1], UpArmL: [-16, 8, 13], UpArmR: [-11, -6, -17] }),
      K(3.30, {})
    ]
  },

  // ---- VICTORY ------------------------------------------------------------
  // She rises. That is the whole thing: she goes up a metre, turns away, and
  // does not look back down. The only victory pose in the game that ends with
  // the character leaving the frame upward.
  victory: {
    dur: 3.60, loop: false, keys: [
      K(0, {}),
      K(0.70, { Hips_pos: [0, 0.19, 0], Hips: [-6, 22, 0], Spine: [-10, -6, 0], Head: [-12, -14, 3], UpArmL: [-34, 10, 26], LoArmL: [-52, 20, 0], UpArmR: [-26, -8, -30], LoArmR: [-46, -18, 0], ThighL: [-32, -5, 0], ShinL: [40, 0, 0], ThighR: [-12, 6, 0], ShinR: [22, 0, 0], FootL: [50, -10, 0], FootR: [54, 8, 0] }, 'out'),
      K(1.70, { Hips_pos: [0, 0.34, 0], Hips: [-10, 46, 0], Spine: [-14, 12, 0], Chest: [-10, 16, 0], Neck: [2, 8, 0], Head: [-14, 26, 4], UpArmL: [-40, 12, 32], UpArmR: [-30, -10, -36], ThighL: [-44, -6, 3], ShinL: [54, 0, 0], ThighR: [-16, 7, 0], ShinR: [28, 0, 0] }),
      K(2.80, { Hips_pos: [0, 0.46, 0], Hips: [-12, 74, 0], Spine: [-16, 20, 0], Chest: [-12, 26, 0], Head: [-16, 40, 5], UpArmL: [-46, 12, 34], UpArmR: [-36, -10, -38], ThighL: [-50, -6, 3], ThighR: [-20, 7, 0] }),
      K(3.60, { Hips_pos: [0, 0.52, 0], Hips: [-12, 88, 0], Spine: [-17, 24, 0], Head: [-17, 48, 5], ThighL: [-52, -6, 3], ThighR: [-22, 7, 0] })
    ]
  },

  // ---- KO -----------------------------------------------------------------
  // The one thing that has to look WRONG for this character: she falls. The
  // whole design is that she never touches the ground on anybody's terms, so
  // the KO is authored as gravity finally getting her — she drops out of the
  // hover, hits, and the hips stay down.
  ko: {
    dur: 1.20, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips_pos: [0, 0.10, 0], Spine: [-24, -6, 0], Chest: [-16, -9, 0], Head: [-22, -8, 0], UpArmL: [-96, 10, 44], LoArmL: [-26, 12, 0], UpArmR: [-88, -8, -48], LoArmR: [-22, -10, 0], ThighL: [-42, -5, 0], ShinL: [30, 0, 0], ThighR: [-30, 6, 0], ShinR: [26, 0, 0] }, 'snap'),
      K(0.52, { Hips: [-58, 10, 0], Hips_pos: [0, -0.56, -0.14], Spine: [-16, -4, 0], Chest: [-10, -4, 0], Head: [-20, 0, 0], UpArmL: [-46, 0, 62], LoArmL: [-18, 0, 6], UpArmR: [-36, 0, -66], LoArmR: [-14, 0, -6], ThighL: [-6, -4, 0], ShinL: [18, 0, 0], ThighR: [4, 6, 0], ShinR: [24, 0, 0], FootL: [16, -8, 0], FootR: [20, 8, 0] }, 'out'),
      K(0.78, { Hips: [-66, 8, 0], Hips_pos: [0, -0.64, -0.16], Head: [-24, 2, 0], Spine: [-12, -4, 0] }, 'hold'),
      K(1.20, { Hips: [-66, 8, 0], Hips_pos: [0, -0.64, -0.16], Head: [-24, 2, 0] })
    ]
  }
};
