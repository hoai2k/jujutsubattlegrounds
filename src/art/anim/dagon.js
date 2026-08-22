// DAGON — clips. Movement language: HEAVY AND BUOYANT AT THE SAME TIME.
// ===========================================================================
// That contradiction is the whole animation note and it is not a contradiction
// in water: something enormous, partly floating, that has to drag itself
// through the air it is no longer suspended in. Four rules produce it:
//
//   1. THE HIPS RIDE HIGH AND DRIFT. `Hips_pos` y is positive and it is never
//      still — a long, slow vertical swell under everything, including the
//      attacks. He is never quite bearing his own weight.
//   2. THE FEET DRAG, THEY DO NOT LIFT. Every locomotion key keeps both feet
//      low and close to the floor with the toes down. He shuffles. A stride
//      with a real swing phase would make him look like a man in a suit.
//   3. NOTHING BUILDS SPEED — IT ARRIVES. Long, slow, eased wind-ups
//      ('in' everywhere) followed by a single 'snap'. The lunges are the only
//      fast thing about him and they come out of complete stillness, which is
//      what makes a slow character frightening rather than merely slow.
//   4. THE SHOULDERS LEAD, THE HEAD FOLLOWS LATE. He has no neck, so his head
//      cannot turn independently — it arrives a beat after the chest
//      everywhere. That lag does more for "not a person" than any pose does.
//
// THE BARBELS ARE NOT ANIMATED HERE, and that is deliberate. Ten spring chains
// on the Head bone (art/models/dagon.js) do all of it for free, and they do it
// correctly for motion this file never anticipated — a knockback, a domain
// stagger, a finisher camera move. Authoring them as keys would have meant
// fighting the springs for control of the same bone.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — the hunch. Shoulders rolled forward and UP, spine curved over,
// head sunk between them, arms hanging long and slightly away from the body,
// knees soft, feet wide and flat. He is standing the way something stands when
// it is used to being held up by water.
export const DAGON_STANCE = {
  Hips_pos: [0, 0.055, 0],
  Hips: [6, 26, 0], Spine: [16, -6, 0], Chest: [13, -8, 0], Neck: [-6, -3, 0], Head: [-10, -9, 0],
  ClavL: [4, 0, 6], UpArmL: [-8, 12, 20], LoArmL: [-38, 18, 0], HandL: [-10, 40, 0],
  ClavR: [4, 0, -6], UpArmR: [-5, -10, -22], LoArmR: [-34, -16, 0], HandR: [-8, -38, 0],
  ThighL: [-8, -8, 0], ShinL: [22, 0, 0], FootL: [12, -14, 0],
  ThighR: [-4, 9, 0], ShinR: [19, 0, 0], FootR: [10, 13, 0]
};

export const DAGON_CLIPS = {
  // ---- LOCOMOTION ----------------------------------------------------------
  // idle: a 4.4-second swell. The whole mass rises and settles; the arms lag
  // behind it, so at the top of the breath the hands are still coming up. The
  // longest idle in the project after Uro's.
  idle: {
    dur: 4.40, loop: true, keys: [
      K(0, {}),
      K(1.30, { Hips_pos: [0, 0.098, 0], Spine: [13, -6, 0], Chest: [11, -8, 0], Head: [-14, -9, 0], UpArmL: [-13, 12, 25], LoArmL: [-32, 18, 0], UpArmR: [-10, -10, -27], LoArmR: [-28, -16, 0], ThighL: [-11, -8, 0], ThighR: [-7, 9, 0] }),
      K(2.20, { Hips_pos: [0, 0.084, 0], Spine: [18, -6, 0], Chest: [15, -8, 0], Head: [-7, -12, 2], UpArmL: [-6, 12, 18], UpArmR: [-3, -10, -20] }),
      K(3.30, { Hips_pos: [0, 0.104, 0], Spine: [14, -6, 0], Head: [-13, -6, -2], UpArmL: [-14, 12, 26], UpArmR: [-11, -10, -28] }),
      K(4.40, {})
    ]
  },
  // walk: a SHUFFLE. Both feet stay low, the hips swing side to side more than
  // they travel, and the body rolls. There is no real swing phase.
  walk: {
    dur: 1.44, loop: true, keys: [
      K(0, { ThighL: [-17, -8, 0], ShinL: [24, 0, 0], FootL: [16, -14, 0], ThighR: [11, 9, 0], ShinR: [17, 0, 0], FootR: [6, 13, 0], Hips: [6, 32, 0], Hips_pos: [0, 0.062, 0], Spine: [18, -6, 0], UpArmL: [-14, 12, 22], UpArmR: [-1, -10, -24] }),
      K(0.36, { ThighL: [-8, -8, 0], ShinL: [26, 0, 0], ThighR: [3, 9, 0], ShinR: [22, 0, 0], Hips_pos: [0, 0.086, 0], Hips: [6, 26, 0] }),
      K(0.72, { ThighL: [12, -8, 0], ShinL: [18, 0, 0], FootL: [6, -14, 0], ThighR: [-16, 9, 0], ShinR: [25, 0, 0], FootR: [16, 13, 0], Hips: [6, 20, 0], Hips_pos: [0, 0.062, 0], UpArmL: [-1, 12, 22], UpArmR: [-14, -10, -24] }),
      K(1.08, { ThighL: [3, -8, 0], ShinL: [22, 0, 0], ThighR: [-8, 9, 0], ShinR: [26, 0, 0], Hips_pos: [0, 0.086, 0], Hips: [6, 26, 0] }),
      K(1.44, { ThighL: [-17, -8, 0], ShinL: [24, 0, 0], ThighR: [11, 9, 0], ShinR: [17, 0, 0], Hips: [6, 32, 0], Hips_pos: [0, 0.062, 0] })
    ]
  },
  // run: the shuffle, faster, with the whole mass leaning into it and the arms
  // swinging heavily out of phase with the legs. He is not sprinting — he is
  // wading.
  run: {
    dur: 0.94, loop: true, keys: [
      K(0, { Spine: [26, -5, 0], Chest: [18, -7, 0], Head: [-16, -8, 0], Hips: [10, 30, 0], ThighL: [-30, -8, 0], ShinL: [34, 0, 0], FootL: [22, -14, 0], ThighR: [20, 9, 0], ShinR: [30, 0, 0], FootR: [8, 13, 0], UpArmL: [-22, 12, 28], LoArmL: [-46, 16, 0], UpArmR: [10, -10, -30], LoArmR: [-24, -14, 0], Hips_pos: [0, 0.070, 0] }),
      K(0.24, { Spine: [24, -5, 0], ThighL: [-12, -8, 0], ShinL: [38, 0, 0], ThighR: [4, 9, 0], ShinR: [36, 0, 0], Hips_pos: [0, 0.100, 0], Hips: [10, 26, 0] }),
      K(0.47, { Spine: [26, -5, 0], Chest: [18, -7, 0], Hips: [10, 22, 0], ThighL: [20, -8, 0], ShinL: [30, 0, 0], FootL: [8, -14, 0], ThighR: [-30, 9, 0], ShinR: [34, 0, 0], FootR: [22, 13, 0], UpArmL: [10, 12, 28], LoArmL: [-24, 16, 0], UpArmR: [-22, -10, -30], LoArmR: [-46, -14, 0], Hips_pos: [0, 0.070, 0] }),
      K(0.71, { Spine: [24, -5, 0], ThighL: [4, -8, 0], ShinL: [36, 0, 0], ThighR: [-12, 9, 0], ShinR: [38, 0, 0], Hips_pos: [0, 0.100, 0], Hips: [10, 26, 0] }),
      K(0.94, { Spine: [26, -5, 0], Hips: [10, 30, 0], ThighL: [-30, -8, 0], ShinL: [34, 0, 0], ThighR: [20, 9, 0], ShinR: [30, 0, 0], Hips_pos: [0, 0.070, 0] })
    ]
  },
  // dash: a SURGE. He sinks, then the whole body slides forward with the feet
  // barely leaving the floor. `dashBurst: false` on his config means this is
  // all the dash he has, and it should look like it costs him something.
  dash: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.10, { Spine: [30, -5, 0], Chest: [20, -7, 0], Hips_pos: [0, 0.006, 0], Hips: [14, 26, 0], ThighL: [-26, -8, 0], ShinL: [40, 0, 0], ThighR: [-18, 9, 0], ShinR: [36, 0, 0], UpArmL: [-32, 12, 32], LoArmL: [-52, 16, 0], UpArmR: [-28, -10, -34], LoArmR: [-48, -14, 0] }, 'in'),
      K(0.20, { Spine: [34, -5, 0], Chest: [23, -7, 0], Head: [-20, -8, 0], Hips_pos: [0, 0.048, 0], ThighL: [-34, -8, 0], ShinL: [30, 0, 0], ThighR: [-26, 9, 0], ShinR: [28, 0, 0], FootL: [26, -14, 0], FootR: [24, 13, 0], UpArmL: [-6, 12, 34], UpArmR: [-2, -10, -36] }, 'out'),
      K(0.44, { Spine: [24, -6, 0], Hips_pos: [0, 0.066, 0], ThighL: [-16, -8, 0], ThighR: [-10, 9, 0] })
    ]
  },
  jump: {
    dur: 0.60, loop: false, keys: [
      K(0, { Hips_pos: [0, -0.10, 0], Spine: [26, -6, 0], ThighL: [-44, -8, 0], ShinL: [58, 0, 0], ThighR: [-40, 9, 0], ShinR: [56, 0, 0] }),
      K(0.20, { Hips_pos: [0, 0.11, 0], Spine: [4, -6, 0], Chest: [4, -8, 0], Head: [-16, -8, 0], ThighL: [-24, -8, 0], ShinL: [30, 0, 0], ThighR: [-10, 9, 0], ShinR: [28, 0, 0], UpArmL: [-56, 12, 36], LoArmL: [-40, 16, 0], UpArmR: [-50, -10, -38], LoArmR: [-38, -14, 0] }, 'out'),
      K(0.60, { Hips_pos: [0, 0.055, 0], ThighL: [-36, -8, 0], ShinL: [46, 0, 0], ThighR: [-22, 9, 0], ShinR: [40, 0, 0], UpArmL: [-40, 12, 30], UpArmR: [-34, -10, -32] })
    ]
  },

  // ---- THE TENTACLE STRING ------------------------------------------------
  // Three long, slow, wide arm swings, and the ARM IS NOT THE POINT — the
  // reach comes from the shoulder rotating the whole torso around, so the
  // string covers 2.5 m without a single fast frame in it.
  // Hit 1 carries armour (12 frames), which is why it opens with the body
  // already committed forward: he is not defending, he is trading.
  punch1: {
    dur: 0.58, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmR: [-30, -30, -34], LoArmR: [-52, -24, 0], HandR: [-10, -54, 0], Chest: [12, 26, 0], Spine: [14, 18, 0], Hips: [6, 44, 0], Hips_pos: [0, 0.066, 0] }, 'in'),
      K(0.26, { UpArmR: [-38, 24, -14], LoArmR: [-14, 10, 0], HandR: [-6, 12, 0], Chest: [16, -26, 0], Spine: [20, -20, 0], Hips: [6, 6, 0], Head: [-6, -20, 0], Hips_pos: [0, 0.048, 0], ThighR: [-12, 9, 0] }, 'snap'),
      K(0.36, { UpArmR: [-34, 32, -12], LoArmR: [-12, 14, 0], Chest: [16, -30, 0], Spine: [20, -22, 0] }, 'hold'),
      K(0.58, {})
    ]
  },
  punch2: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.15, { UpArmL: [-28, 32, 32], LoArmL: [-56, 26, 0], HandL: [-10, 56, 0], Chest: [12, -26, 0], Spine: [14, -18, 0], Hips: [6, 8, 0] }, 'in'),
      K(0.28, { UpArmL: [-36, -26, 12], LoArmL: [-14, -12, 0], HandL: [-6, -14, 0], Chest: [16, 28, 0], Spine: [20, 20, 0], Hips: [6, 46, 0], Head: [-6, 18, 0], ThighL: [-14, -8, 0] }, 'snap'),
      K(0.38, { UpArmL: [-32, -34, 10], LoArmL: [-12, -16, 0], Chest: [16, 32, 0], Spine: [20, 22, 0] }, 'hold'),
      K(0.62, {})
    ]
  },
  // punch3 — the KNOCKDOWN. Both arms come over the top together and drive
  // straight down. He does not launch anyone; he puts them on the floor and
  // then walks toward them, which is the entire character.
  punch3: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.26, { UpArmL: [-140, 16, 26], LoArmL: [-24, 14, 0], HandL: [-34, 44, 0], UpArmR: [-136, -14, -28], LoArmR: [-22, -12, 0], HandR: [-34, -42, 0], Spine: [-6, -6, 0], Chest: [-4, -8, 0], Head: [-20, -8, 0], Hips_pos: [0, 0.135, 0], ThighL: [-24, -8, 0], ShinL: [32, 0, 0], ThighR: [-18, 9, 0], ShinR: [30, 0, 0] }, 'in'),
      K(0.42, { UpArmL: [-8, 14, 14], LoArmL: [-62, 16, 0], HandL: [-14, 48, 0], UpArmR: [-4, -12, -16], LoArmR: [-58, -14, 0], HandR: [-14, -46, 0], Spine: [40, -6, 0], Chest: [26, -8, 0], Head: [12, -8, 0], Hips_pos: [0, -0.055, 0], ThighL: [-38, -8, 0], ShinL: [50, 0, 0], ThighR: [-30, 9, 0], ShinR: [46, 0, 0], FootL: [4, -14, 0], FootR: [2, 13, 0] }, 'snap'),
      K(0.58, { Spine: [36, -6, 0], Chest: [24, -8, 0], Hips_pos: [0, -0.040, 0], UpArmL: [-12, 14, 16], UpArmR: [-8, -12, -18] }, 'hold'),
      K(0.92, {})
    ]
  },

  // HEAVY — DEEP HAUL. The same overhead as punch3, but he winds all the way
  // back first and the whole body travels forward with it. Armoured for 14
  // frames of the wind-up.
  heavy: {
    dur: 1.16, loop: false, keys: [
      K(0, {}),
      K(0.34, { UpArmL: [-158, 10, 20], LoArmL: [-14, 10, 0], HandL: [-40, 30, 0], UpArmR: [-154, -8, -22], LoArmR: [-12, -8, 0], HandR: [-40, -28, 0], Spine: [-20, -6, 0], Chest: [-14, -8, 0], Neck: [-2, -3, 0], Head: [-28, -8, 0], Hips_pos: [0, 0.170, 0], Hips: [-4, 26, 0], ThighL: [-30, -8, 0], ShinL: [38, 0, 0], ThighR: [-24, 9, 0], ShinR: [36, 0, 0], FootL: [26, -14, 0], FootR: [24, 13, 0] }, 'in'),
      K(0.54, { UpArmL: [-4, 14, 12], LoArmL: [-70, 16, 0], HandL: [-16, 46, 0], UpArmR: [0, -12, -14], LoArmR: [-66, -14, 0], HandR: [-16, -44, 0], Spine: [46, -6, 0], Chest: [30, -8, 0], Head: [16, -8, 0], Hips_pos: [0, -0.095, 0], Hips: [20, 26, 0], ThighL: [-44, -8, 0], ShinL: [58, 0, 0], ThighR: [-36, 9, 0], ShinR: [54, 0, 0], FootL: [0, -14, 0], FootR: [-2, 13, 0] }, 'snap'),
      K(0.74, { Spine: [42, -6, 0], Chest: [28, -8, 0], Hips_pos: [0, -0.080, 0], UpArmL: [-10, 14, 14], UpArmR: [-6, -12, -16] }, 'hold'),
      K(1.16, {})
    ]
  },

  // ---- RB · SHIKIGAMI VOLLEY ----------------------------------------------
  // He does not throw them. He OPENS — one arm sweeps across his own chest and
  // the fish come off it, which is what the source shows: they conjure out of
  // his body rather than being launched from his hand. The gesture is small
  // and almost gentle, which is exactly the wrong register for the thing it
  // produces, and that is why it is the right one.
  ct1: {
    dur: 0.78, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmR: [-56, -34, -18], LoArmR: [-96, -28, 0], HandR: [-24, -60, 0], Chest: [10, 22, 0], Spine: [12, 16, 0], Head: [-12, 14, 0], Hips: [6, 40, 0], Hips_pos: [0, 0.086, 0] }, 'in'),
      K(0.34, { UpArmR: [-62, 20, -30], LoArmR: [-42, 12, 0], HandR: [-18, 22, 0], Chest: [12, -24, 0], Spine: [14, -18, 0], Head: [-10, -18, 0], Hips: [6, 6, 0], Hips_pos: [0, 0.074, 0] }, 'out'),
      K(0.46, { UpArmR: [-58, 30, -32], LoArmR: [-38, 16, 0], Chest: [12, -28, 0] }, 'hold'),
      K(0.78, {})
    ]
  },

  // ---- RT · TIDAL SLAM ----------------------------------------------------
  // The biggest thing in his ordinary kit. He draws both arms back and low —
  // gathering — holds it long enough to be punished, and then drives them
  // forward and up together with the whole body behind them. 28 frames of
  // startup is nearly half a second and it should look like every one of them.
  ct2: {
    dur: 1.40, loop: false, keys: [
      K(0, {}),
      K(0.40, { UpArmL: [30, 16, 26], LoArmL: [-86, 20, 0], HandL: [-24, 52, 0], UpArmR: [34, -14, -28], LoArmR: [-82, -18, 0], HandR: [-24, -50, 0], Spine: [28, -6, 0], Chest: [20, -8, 0], Head: [-18, -8, 0], Hips_pos: [0, -0.070, 0], Hips: [18, 26, 0], ThighL: [-34, -8, 0], ShinL: [46, 0, 0], ThighR: [-28, 9, 0], ShinR: [44, 0, 0], FootL: [4, -14, 0], FootR: [2, 13, 0] }, 'in'),
      K(0.58, { UpArmL: [36, 14, 22], LoArmL: [-92, 18, 0], UpArmR: [40, -12, -24], LoArmR: [-88, -16, 0], Spine: [31, -6, 0], Hips_pos: [0, -0.082, 0] }, 'hold'),
      K(0.72, { UpArmL: [-84, 6, 22], LoArmL: [-16, 8, 0], HandL: [-40, 16, 0], UpArmR: [-80, -4, -24], LoArmR: [-14, -6, 0], HandR: [-40, -14, 0], Spine: [-14, -6, 0], Chest: [-10, -8, 0], Head: [-24, -8, 0], Hips_pos: [0, 0.150, 0], Hips: [-6, 26, 0], ThighL: [-20, -8, 0], ShinL: [26, 0, 0], ThighR: [-14, 9, 0], ShinR: [24, 0, 0] }, 'snap'),
      K(0.92, { UpArmL: [-76, 8, 26], UpArmR: [-72, -6, -28], Spine: [-10, -6, 0], Hips_pos: [0, 0.128, 0] }, 'hold'),
      K(1.40, {})
    ]
  },

  // ---- B · SUMMON SEA SHIKIGAMI -------------------------------------------
  // He opens his own chest. One hand goes flat to the sternum, the plate
  // parts, and something comes out of him — which is the canon mechanism and
  // is also the most unpleasant thing he does. He does not look at it.
  summon: {
    dur: 0.92, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-72, -14, -12], LoArmR: [-108, -18, 0], HandR: [-30, -70, 0], Spine: [20, -6, 0], Chest: [16, -8, 0], Head: [-14, -6, 0], Hips_pos: [0, 0.078, 0], ThighL: [-14, -8, 0], ThighR: [-10, 9, 0] }, 'in'),
      K(0.44, { UpArmR: [-58, 6, -34], LoArmR: [-72, -4, 0], HandR: [-24, -30, 0], Spine: [8, -6, 0], Chest: [6, -8, 0], Head: [-20, -4, 0], Hips_pos: [0, 0.118, 0], UpArmL: [-18, 14, 30], LoArmL: [-48, 18, 0] }, 'out'),
      K(0.60, { UpArmR: [-48, 12, -38], LoArmR: [-58, -2, 0], Spine: [10, -6, 0], Hips_pos: [0, 0.106, 0] }, 'hold'),
      K(0.92, {})
    ]
  },

  // ---- D-PAD RIGHT · DOMAIN EXPANSION -------------------------------------
  // HORIZON OF THE CAPTIVATING SKANDHA. The source gives two ways he opens it —
  // the hand sign, or a cursed seal drawn on his own stomach — and the clip
  // does BOTH in order, because the second one is the beat that makes it his:
  //
  //   0.00-0.55  he straightens. This is the only time in the whole set his
  //              spine comes anywhere near upright, and it should read as
  //              alarming purely because nothing else in the file does it.
  //   0.55-1.10  the HAND SIGN — both hands come together in front of the
  //              chest, held.
  //   1.10-1.75  the right hand drops and DRAWS ON HIS OWN STOMACH, one slow
  //              horizontal stroke across the black plate. The model's
  //              `setSeal` lights up under it (driven from core/match.js on
  //              the cast beat).
  //   1.75-2.60  the arms open wide and low, palms up, and the head finally
  //              lifts — the invitation. The sea arrives on the last key.
  domainCast: {
    dur: 2.60, loop: false, keys: [
      K(0, {}),
      K(0.55, { Spine: [2, -6, 0], Chest: [2, -8, 0], Neck: [-2, -3, 0], Head: [-4, -6, 0], Hips: [-2, 26, 0], Hips_pos: [0, 0.130, 0], UpArmL: [-12, 12, 14], LoArmL: [-44, 18, 0], UpArmR: [-9, -10, -16], LoArmR: [-40, -16, 0], ThighL: [-4, -8, 0], ShinL: [14, 0, 0], ThighR: [-2, 9, 0], ShinR: [12, 0, 0] }, 'out'),
      K(1.10, { UpArmL: [-64, 30, 10], LoArmL: [-104, 34, 0], HandL: [-20, 84, 0], UpArmR: [-60, -28, -12], LoArmR: [-108, -32, 0], HandR: [-20, -84, 0], Spine: [4, -6, 0], Head: [-2, -6, 0], Hips_pos: [0, 0.126, 0] }, 'in'),
      K(1.34, { UpArmL: [-64, 30, 10], LoArmL: [-104, 34, 0], UpArmR: [-60, -28, -12], LoArmR: [-108, -32, 0], Spine: [4, -6, 0] }, 'hold'),
      // the seal, drawn across the stomach
      K(1.56, { UpArmR: [-34, -22, -20], LoArmR: [-96, -26, 0], HandR: [-26, -66, 0], Spine: [12, -6, 0], Chest: [9, -8, 0], Head: [-14, -8, 0], UpArmL: [-52, 26, 12], LoArmL: [-92, 30, 0], Hips_pos: [0, 0.104, 0] }, 'in'),
      K(1.78, { UpArmR: [-34, 20, -20], LoArmR: [-92, 18, 0], HandR: [-26, 40, 0], Spine: [12, -6, 0], Head: [-14, -8, 0] }),
      // the invitation
      K(2.20, { UpArmL: [-46, 10, 62], LoArmL: [-20, 12, 0], HandL: [-30, 26, 0], UpArmR: [-42, -8, -64], LoArmR: [-18, -10, 0], HandR: [-30, -24, 0], Spine: [-10, -6, 0], Chest: [-8, -8, 0], Neck: [4, -3, 0], Head: [10, -6, 0], Hips_pos: [0, 0.162, 0], Hips: [-8, 26, 0], ThighL: [-10, -8, 0], ThighR: [-6, 9, 0] }, 'out'),
      K(2.60, { UpArmL: [-50, 10, 66], UpArmR: [-46, -8, -68], Spine: [-12, -6, 0], Head: [12, -6, 0], Hips_pos: [0, 0.172, 0] })
    ]
  },

  // ---- TAUNT --------------------------------------------------------------
  // NO SPEECH BUBBLE — he is a cursed spirit, and the whole roster's spirits
  // get physical taunts. See the entry in combat/taunts.js.
  //
  // He gestures toward the horizon with an almost WELCOMING motion, as though
  // inviting the opponent to the beach, while a single small shikigami
  // surfaces beside him and disappears. Quiet and wrong, rather than
  // aggressive — the register the brief asks for, and the register the
  // character actually has.
  //
  //   0.00-0.60  the head turns away, out toward where the sea would be. He
  //              stops looking at the opponent entirely, which for a fighting
  //              game taunt is the disrespectful part.
  //   0.60-1.35  the near arm comes up slowly, palm open and turned UP, and
  //              extends toward the horizon. This is the gesture an usher
  //              makes. The fish surfaces on 1.10 (fx hook).
  //   1.35-2.10  he holds it. Nothing happens for three quarters of a second.
  //   2.10-3.10  the arm lowers, the head comes back round, and the last key
  //              is the stance again — as though none of it occurred.
  taunt: {
    dur: 3.20, loop: false, keys: [
      K(0, {}),
      K(0.60, { Neck: [-4, 20, 0], Head: [-6, 34, 0], Chest: [12, 14, 0], Spine: [15, 10, 0], Hips: [6, 32, 0], Hips_pos: [0, 0.082, 0] }, 'out'),
      K(1.10, { Neck: [-3, 24, 0], Head: [-4, 40, 0], Chest: [10, 18, 0], Spine: [13, 12, 0], UpArmL: [-56, 22, 44], LoArmL: [-34, 26, 0], HandL: [-38, 34, 0], Hips_pos: [0, 0.096, 0], ThighL: [-10, -8, 0], ThighR: [-6, 9, 0] }, 'out'),
      K(1.35, { UpArmL: [-64, 18, 52], LoArmL: [-22, 22, 0], HandL: [-44, 26, 0], Head: [-4, 42, 0], Hips_pos: [0, 0.102, 0] }),
      K(2.10, { UpArmL: [-64, 18, 52], LoArmL: [-22, 22, 0], HandL: [-44, 26, 0], Head: [-4, 42, 0], Neck: [-3, 24, 0], Chest: [10, 18, 0], Spine: [13, 12, 0], Hips_pos: [0, 0.102, 0] }, 'hold'),
      K(2.60, { UpArmL: [-24, 14, 26], LoArmL: [-44, 20, 0], HandL: [-16, 40, 0], Head: [-8, 18, 0], Neck: [-5, 10, 0], Chest: [12, 8, 0], Spine: [15, 5, 0], Hips_pos: [0, 0.084, 0] }),
      K(3.20, {})
    ]
  },

  // ---- VICTORY ------------------------------------------------------------
  // He does nothing. He turns his back on the body, faces the horizon, and the
  // swell resumes — the same 4.4-second breath as his idle, at a lower
  // amplitude. The least triumphant victory pose in the game, and the point is
  // that the fight was never the event: the beach was.
  victory: {
    dur: 4.00, loop: false, keys: [
      K(0, {}),
      K(0.90, { Hips: [6, 74, 0], Spine: [14, 22, 0], Chest: [11, 26, 0], Neck: [-5, 8, 0], Head: [-10, 30, 0], Hips_pos: [0, 0.072, 0], UpArmL: [-10, 12, 18], UpArmR: [-7, -10, -20] }, 'out'),
      K(2.00, { Hips: [6, 96, 0], Spine: [12, 32, 0], Chest: [10, 36, 0], Head: [-6, 44, 0], Hips_pos: [0, 0.104, 0], UpArmL: [-14, 12, 22], UpArmR: [-11, -10, -24] }),
      K(3.00, { Hips: [6, 96, 0], Spine: [16, 32, 0], Chest: [13, 36, 0], Head: [-12, 42, 0], Hips_pos: [0, 0.086, 0], UpArmL: [-8, 12, 17], UpArmR: [-5, -10, -19] }),
      K(4.00, { Hips: [6, 96, 0], Spine: [12, 32, 0], Chest: [10, 36, 0], Head: [-6, 44, 0], Hips_pos: [0, 0.108, 0], UpArmL: [-15, 12, 23], UpArmR: [-12, -10, -25] })
    ]
  },

  // ---- KO -----------------------------------------------------------------
  // He does not fall so much as DEFLATE. The buoyancy goes first — the hips
  // drop out from under him a beat before the rest — and then the mass follows
  // it down and spreads.
  ko: {
    dur: 1.50, loop: false, keys: [
      K(0, {}),
      K(0.18, { Hips_pos: [0, -0.055, 0], Spine: [30, -6, 0], Chest: [20, -8, 0], Head: [4, -8, 0], UpArmL: [-46, 12, 42], LoArmL: [-20, 14, 0], UpArmR: [-40, -10, -46], LoArmR: [-16, -12, 0], ThighL: [-26, -8, 0], ShinL: [34, 0, 0], ThighR: [-20, 9, 0], ShinR: [32, 0, 0] }, 'in'),
      K(0.62, { Hips: [-52, 12, 0], Hips_pos: [0, -0.66, -0.16], Spine: [18, -4, 0], Chest: [12, -4, 0], Head: [10, 0, 0], UpArmL: [-34, 0, 68], LoArmL: [-14, 0, 6], UpArmR: [-26, 0, -72], LoArmR: [-10, 0, -6], ThighL: [-4, -6, 0], ShinL: [22, 0, 0], ThighR: [2, 8, 0], ShinR: [26, 0, 0], FootL: [10, -12, 0], FootR: [8, 12, 0] }, 'out'),
      K(0.98, { Hips: [-62, 10, 0], Hips_pos: [0, -0.76, -0.20], Spine: [14, -4, 0], Head: [14, 0, 0], UpArmL: [-28, 0, 74], UpArmR: [-20, 0, -78] }, 'hold'),
      K(1.50, { Hips: [-62, 10, 0], Hips_pos: [0, -0.76, -0.20], Head: [14, 0, 0] })
    ]
  }
};
