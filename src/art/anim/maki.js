// ===========================================================================
// MAKI ZENIN — ANIMATION
// ===========================================================================
// THE THESIS: braced and technical, loosening as she awakens.
//
// She is the only character in the project whose NEUTRAL CHANGES DURING THE
// ROUND, and that is the whole animation brief. Everything here is authored
// twice over: once as a movement, and once as a POSTURE that has four states.
//
// ---------------------------------------------------------------------------
// THE FOUR POSTURES, and what actually differs between them
// ---------------------------------------------------------------------------
// Stage 0 — BRACED.   Weight back, knees bent, shoulders up around the ears,
//                     elbows in, weapon held close and across the body. She is
//                     guarding. Small amplitudes, high frequency: a body that
//                     is ready and slightly tense.
// Stage 1 — SETTLED.  Shoulders come down. The weapon comes off the body a
//                     little. Breath slows.
// Stage 2 — OPEN.     Weight moves onto the front foot. Chin comes up. The
//                     guard hand drops out of the frame. Amplitudes grow.
// Stage 3 — UNBOTHERED. Upright, weight even, weapon hanging loose in one
//                     hand at her side, shoulders completely down, and the
//                     breath cycle is now the SLOWEST idle in the game at
//                     3.6 s. She is not guarding at all any more.
//
// THE ONE NUMBER THAT CARRIES IT: `Hips_pos` Y. Braced is -0.075 (sunk into a
// crouch); unbothered is -0.020 (standing tall). Five and a half centimetres
// of hip height across a round is a genuinely large read at fighting distance,
// and it is doing more work than any of the arm poses.
//
// HOW THE STAGES ARE SELECTED: `idle`/`walk`/`run` gain the suffixes A1/A2/A3
// and combat/fighter.js `_clip` swaps them by stage — the same mechanism
// Kashimo's `idleCharged` and Inumaki's four throat idles already use. Stage 0
// has NO suffix, so it IS the base clip and costs no lookup. A missing variant
// falls straight through to the base, which is what lets this file be
// half-authored without throwing.
//
// ---------------------------------------------------------------------------
// WHY SHE DOES NOT READ AS TOJI — the five-second test
// ---------------------------------------------------------------------------
// The brief is right to worry: same weapons, same no-meter HUD, adjacent
// accent colours. The separation is deliberately put in the ANIMATION rather
// than in the kit, because the kit is supposed to rhyme with his.
//
//   TOJI swings from the SHOULDERS and never resets. His clips have almost no
//   anticipation — the strike is already happening on frame two — and he
//   returns to a loose, wide, arms-down stance that is barely a guard.
//
//   MAKI swings from the HIPS and resets between every hit. Every technique
//   here has a visible wind-up key (`'in'` ease), and every one of them ends
//   by RETURNING TO GUARD rather than trailing off. She is a trained
//   practitioner running a form; he is a man who has done this so often he no
//   longer bothers to set up. At stage 3 she keeps the hip rotation and loses
//   the reset — which is the animation saying she has caught up with him
//   without ever becoming him.
//
// The other half of the answer is structural and lives in characters/maki.js:
// the two-weapon toggle, the awakening gate on the ultimate, and frame data
// that is genuinely worse than his until stage 2. See the delivery notes.
//
// ---------------------------------------------------------------------------
// THE WEAPON SUFFIX CONTRACT
// ---------------------------------------------------------------------------
// Same shape as Toji's, and deliberately so — `clipSuffix` on each weapon
// selects idle<Sfx> / ct1<Sfx> / ct2<Sfx> / punch1..3<Sfx>. Hers are 'Cloud'
// and 'Soul'. Two weapons, not four, and no `draw<Sfx>`: she does not draw
// from an inventory curse, she swaps what is already on her body, so there is
// one `swap` clip instead of four draws.
// ===========================================================================

export const MAKI_STANCE = {
  // THE BRACED NEUTRAL. Compare Toji's (Hips_pos -0.035, UpArm -8/-4) — hers
  // sits 4 cm lower with the elbows a full 30 degrees more tucked. Standing
  // the two side by side in the viewer, the difference reads instantly.
  Hips_pos: [0, -0.075, 0],
  Hips: [0, 26, 0], Spine: [7, -8, 0], Chest: [5, -11, 0], Neck: [1, -4, 0], Head: [3, -9, 0],
  ClavL: [0, 2, 0], UpArmL: [-30, 10, 10], LoArmL: [-96, 30, 0], HandL: [-18, 74, 0],
  ClavR: [0, -2, 0], UpArmR: [-22, -6, -12], LoArmR: [-104, -26, 0], HandR: [-20, -74, 0],
  ThighL: [-22, -5, 0], ShinL: [22, 0, 0], FootL: [4, -12, 0],
  ThighR: [16, 7, 0], ShinR: [26, 0, 0], FootR: [11, 9, 0]
};

const K = (t, pose, e) => ({ t, pose, e });

// Both hands on the shaft. See the note on idleCloud below for why every clip
// in the Cloud set has to state this rather than fall through to MAKI_STANCE.
const CLOUD_GUARD = {
  UpArmL: [-42, 22, 14], LoArmL: [-86, 34, 0], HandL: [-14, 78, 0],
  UpArmR: [-34, -14, -16], LoArmR: [-88, -30, 0], HandR: [-16, -80, 0]
};

// The three awakened neutrals, expressed as DELTAS applied on top of the pose
// above by each variant clip. Written out as objects rather than computed so
// the poses are readable and hand-tunable, which is how every other clip file
// in the project is authored.
const OPEN_1 = {
  Hips_pos: [0, -0.060, 0], Spine: [5, -8, 0], Chest: [3, -11, 0],
  UpArmL: [-24, 10, 13], LoArmL: [-86, 28, 0], UpArmR: [-17, -6, -14], LoArmR: [-94, -24, 0],
  ThighL: [-18, -5, 0], ShinL: [18, 0, 0], ThighR: [13, 7, 0], ShinR: [22, 0, 0]
};
const OPEN_2 = {
  Hips_pos: [0, -0.040, 0], Spine: [2, -7, 0], Chest: [1, -9, 0], Head: [-1, -8, 0],
  UpArmL: [-16, 9, 16], LoArmL: [-70, 24, 0], UpArmR: [-11, -5, -17], LoArmR: [-78, -20, 0],
  ThighL: [-13, -5, 0], ShinL: [13, 0, 0], ThighR: [10, 7, 0], ShinR: [17, 0, 0]
};
const OPEN_3 = {
  // UNBOTHERED. Upright, even, arms hanging. This is deliberately close to
  // Toji's own neutral — she has arrived where he already was — but she keeps
  // the squared hips and the level head, which he does not have.
  Hips_pos: [0, -0.020, 0], Hips: [0, 20, 0], Spine: [0, -6, 0], Chest: [-1, -8, 0],
  Neck: [0, -3, 0], Head: [-3, -7, 0],
  UpArmL: [-8, 7, 8], LoArmL: [-38, 16, 0], HandL: [-6, 40, 0],
  UpArmR: [-5, -4, -9], LoArmR: [-34, -14, 0], HandR: [-6, -40, 0],
  ThighL: [-8, -4, 0], ShinL: [8, 0, 0], FootL: [2, -11, 0],
  ThighR: [7, 6, 0], ShinR: [11, 0, 0], FootR: [6, 8, 0]
};

// idle variant builder: a breath cycle around one of the neutrals above. The
// PERIOD lengthens with the stage — a tense body breathes fast, a relaxed one
// breathes slowly — which is a second, quieter channel carrying the same
// information as the posture.
const idleAt = (base, dur, lift) => ({
  dur, loop: true, keys: [
    K(0, base),
    K(dur * 0.5, {
      ...base,
      Hips_pos: [0, base.Hips_pos[1] + lift, 0],
      Chest: [base.Chest[0] + 2, base.Chest[1], 0],
      Head: [(base.Head?.[0] ?? 2) + 1, base.Head?.[1] ?? -8, 0],
      UpArmL: [base.UpArmL[0] - 7, base.UpArmL[1], base.UpArmL[2] + 4],
      UpArmR: [base.UpArmR[0] - 6, base.UpArmR[1], base.UpArmR[2] - 4]
    }),
    K(dur, base)
  ]
});

export const MAKI_CLIPS = {
  // ---- BASE OVERRIDES: THE BRACED NEUTRAL --------------------------------
  // Stage 0. Short cycle (2.1 s against the shared 2.8) because a guarded
  // body is a busy one.
  idle: idleAt(MAKI_STANCE, 2.1, 0.014),
  idleA1: idleAt({ ...MAKI_STANCE, ...OPEN_1 }, 2.5, 0.017),
  idleA2: idleAt({ ...MAKI_STANCE, ...OPEN_2 }, 3.0, 0.021),
  // THE SLOWEST IDLE IN THE GAME. 3.6 s, and the amplitude is the largest —
  // big slow breathing is what "utterly unbothered" sounds like when you draw
  // it. Compare Inumaki's silenced idle at 3.2, which is exhaustion; this one
  // is the opposite and the difference is entirely in the posture it rides on.
  idleA3: idleAt({ ...MAKI_STANCE, ...OPEN_3 }, 3.6, 0.026),

  // ---- WALK: side-on and measured at base, square and easy when awakened --
  walk: {
    dur: 0.80, loop: true, keys: [
      K(0, { ThighL: [-32, -5, 0], ShinL: [16, 0, 0], FootL: [-8, -9, 0], ThighR: [24, 7, 0], ShinR: [32, 0, 0], FootR: [14, 9, 0], Hips_pos: [0, -0.078, 0], UpArmL: [-34, 10, 11], UpArmR: [-27, -6, -13], Spine: [8, -8, 0] }),
      K(0.20, { ThighL: [-8, -5, 0], ShinL: [24, 0, 0], ThighR: [4, 7, 0], ShinR: [18, 0, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.40, { ThighL: [26, -5, 0], ShinL: [30, 0, 0], FootL: [12, -9, 0], ThighR: [-30, 7, 0], ShinR: [16, 0, 0], FootR: [-8, 9, 0], Hips_pos: [0, -0.078, 0], UpArmL: [-27, 10, 11], UpArmR: [-34, -6, -13], Spine: [8, -8, 0] }),
      K(0.60, { ThighL: [2, -5, 0], ShinL: [20, 0, 0], ThighR: [-8, 7, 0], ShinR: [26, 0, 0], Hips_pos: [0, -0.056, 0] }),
      K(0.80, { ThighL: [-32, -5, 0], ShinL: [16, 0, 0], FootL: [-8, -9, 0], ThighR: [24, 7, 0], ShinR: [32, 0, 0], FootR: [14, 9, 0], Hips_pos: [0, -0.078, 0], UpArmL: [-34, 10, 11], UpArmR: [-27, -6, -13] })
    ]
  },
  // AWAKENED WALK: taller, longer stride, arms swinging freely instead of
  // being carried. Same cycle length — she is not walking faster here, she is
  // walking like somebody who is not worried.
  walkA3: {
    dur: 0.80, loop: true, keys: [
      K(0, { ThighL: [-36, -4, 0], ShinL: [12, 0, 0], FootL: [-9, -9, 0], ThighR: [27, 6, 0], ShinR: [28, 0, 0], FootR: [15, 9, 0], Hips_pos: [0, -0.026, 0], Spine: [1, -6, 0], Chest: [-1, -8, 0], UpArmL: [-30, 8, 8], LoArmL: [-30, 14, 0], UpArmR: [-38, -5, -9], LoArmR: [-28, -12, 0] }),
      K(0.20, { ThighL: [-9, -4, 0], ShinL: [20, 0, 0], ThighR: [4, 6, 0], ShinR: [15, 0, 0], Hips_pos: [0, -0.006, 0] }),
      K(0.40, { ThighL: [27, -4, 0], ShinL: [28, 0, 0], FootL: [13, -9, 0], ThighR: [-36, 6, 0], ShinR: [12, 0, 0], FootR: [-9, 9, 0], Hips_pos: [0, -0.026, 0], Spine: [1, -6, 0], UpArmL: [-38, 8, 8], LoArmL: [-28, 14, 0], UpArmR: [-30, -5, -9], LoArmR: [-30, -12, 0] }),
      K(0.60, { ThighL: [3, -4, 0], ShinL: [16, 0, 0], ThighR: [-9, 6, 0], ShinR: [22, 0, 0], Hips_pos: [0, -0.006, 0] }),
      K(0.80, { ThighL: [-36, -4, 0], ShinL: [12, 0, 0], FootL: [-9, -9, 0], ThighR: [27, 6, 0], ShinR: [28, 0, 0], FootR: [15, 9, 0], Hips_pos: [0, -0.026, 0], UpArmL: [-30, 8, 8], UpArmR: [-38, -5, -9] })
    ]
  },

  run: {
    dur: 0.50, loop: true, keys: [
      K(0, { Spine: [18, -5, 0], Chest: [11, -7, 0], Hips: [5, 14, 0], ThighL: [-54, -3, 0], ShinL: [26, 0, 0], FootL: [-15, -7, 0], ThighR: [36, 5, 0], ShinR: [68, 0, 0], FootR: [31, 7, 0], UpArmL: [-22, 9, 11], LoArmL: [-104, 0, 4], UpArmR: [-74, -7, -13], LoArmR: [-92, 0, -4], Hips_pos: [0, -0.036, 0] }),
      K(0.125, { Spine: [16, -5, 0], ThighL: [-11, -3, 0], ShinL: [32, 0, 0], ThighR: [-17, 5, 0], ShinR: [42, 0, 0], Hips_pos: [0, -0.070, 0] }),
      K(0.25, { Spine: [18, -5, 0], Chest: [11, -7, 0], Hips: [5, 14, 0], ThighL: [36, -3, 0], ShinL: [68, 0, 0], FootL: [31, -7, 0], ThighR: [-54, 5, 0], ShinR: [26, 0, 0], FootR: [-15, 7, 0], UpArmL: [-74, 9, 11], LoArmL: [-92, 0, 4], UpArmR: [-22, -7, -13], LoArmR: [-104, 0, -4], Hips_pos: [0, -0.036, 0] }),
      K(0.375, { Spine: [16, -5, 0], ThighL: [-17, -3, 0], ShinL: [42, 0, 0], ThighR: [-11, 5, 0], ShinR: [32, 0, 0], Hips_pos: [0, -0.070, 0] }),
      K(0.50, { Spine: [18, -5, 0], Chest: [11, -7, 0], Hips: [5, 14, 0], ThighL: [-54, -3, 0], ShinL: [26, 0, 0], FootL: [-15, -7, 0], ThighR: [36, 5, 0], ShinR: [68, 0, 0], FootR: [31, 7, 0], UpArmL: [-22, 9, 11], UpArmR: [-74, -7, -13] })
    ]
  },
  // AWAKENED RUN: the torso comes UP. A braced runner leans into the ground;
  // she stops needing to.
  runA3: {
    dur: 0.46, loop: true, keys: [
      K(0, { Spine: [10, -4, 0], Chest: [5, -6, 0], Hips: [5, 14, 0], ThighL: [-58, -3, 0], ShinL: [22, 0, 0], FootL: [-15, -7, 0], ThighR: [38, 5, 0], ShinR: [70, 0, 0], FootR: [31, 7, 0], UpArmL: [-26, 9, 10], LoArmL: [-96, 0, 4], UpArmR: [-78, -7, -12], LoArmR: [-86, 0, -4], Hips_pos: [0, -0.012, 0] }),
      K(0.115, { Spine: [9, -4, 0], ThighL: [-12, -3, 0], ShinL: [30, 0, 0], ThighR: [-18, 5, 0], ShinR: [40, 0, 0], Hips_pos: [0, -0.048, 0] }),
      K(0.23, { Spine: [10, -4, 0], Chest: [5, -6, 0], Hips: [5, 14, 0], ThighL: [38, -3, 0], ShinL: [70, 0, 0], FootL: [31, -7, 0], ThighR: [-58, 5, 0], ShinR: [22, 0, 0], FootR: [-15, 7, 0], UpArmL: [-78, 9, 10], LoArmL: [-86, 0, 4], UpArmR: [-26, -7, -12], LoArmR: [-96, 0, -4], Hips_pos: [0, -0.012, 0] }),
      K(0.345, { Spine: [9, -4, 0], ThighL: [-18, -3, 0], ShinL: [40, 0, 0], ThighR: [-12, 5, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.048, 0] }),
      K(0.46, { Spine: [10, -4, 0], Chest: [5, -6, 0], Hips: [5, 14, 0], ThighL: [-58, -3, 0], ShinL: [22, 0, 0], FootL: [-15, -7, 0], ThighR: [38, 5, 0], ShinR: [70, 0, 0], FootR: [31, 7, 0], UpArmL: [-26, 9, 10], UpArmR: [-78, -7, -12] })
    ]
  },

  // ---- DASH: a low hard step at base, a long glide when awakened ---------
  dash: {
    dur: 0.32, loop: false, keys: [
      K(0, {}),
      K(0.07, { Spine: [26, -5, 0], Chest: [15, -7, 0], Hips_pos: [0, -0.135, 0], ThighL: [-50, -5, 0], ShinL: [34, 0, 0], ThighR: [32, 7, 0], ShinR: [58, 0, 0], UpArmL: [26, 10, 18], LoArmL: [-44, 0, 6], UpArmR: [30, -7, -20], LoArmR: [-40, 0, -6] }, 'out'),
      K(0.32, { Spine: [20, -6, 0], Hips_pos: [0, -0.100, 0], ThighL: [-40, -5, 0], ShinL: [28, 0, 0], ThighR: [24, 7, 0], ShinR: [46, 0, 0], UpArmL: [14, 10, 16], UpArmR: [18, -7, -18] })
    ]
  },

  // ---- BLOCK: a weapon guard, not a forearm guard ------------------------
  // She is holding something. The block brings the staff or the blade across
  // the body diagonally rather than raising two fists, which is the single
  // fastest way to tell an armed guard from an unarmed one at a glance.
  block: {
    dur: 0.16, loop: false, keys: [
      K(0, {}),
      K(0.11, { UpArmL: [-64, 30, 14], LoArmL: [-104, 38, 0], HandL: [-16, 88, 0], UpArmR: [-84, -18, -14], LoArmR: [-108, -34, 0], HandR: [-18, -104, 0], Spine: [11, -9, 0], Chest: [8, -12, 0], Head: [7, -9, 0], Hips_pos: [0, -0.098, 0], ThighL: [-26, -5, 0], ShinL: [26, 0, 0] }, 'out'),
      K(0.16, { UpArmL: [-64, 30, 14], LoArmL: [-104, 38, 0], UpArmR: [-84, -18, -14], LoArmR: [-108, -34, 0], Hips_pos: [0, -0.098, 0] })
    ]
  },

  // =========================================================================
  // THE PLAYFUL CLOUD SET — blunt, wide, driven from the hips
  // =========================================================================
  // The staff is a lever and the animation says so: every swing starts with a
  // HIP ROTATION and the arms follow it. Toji's cloud clips start at the
  // shoulder. That difference is the whole "she swings it differently" note in
  // the brief and it is legible without being told.
  // THE CLOUD GUARD — both hands on the shaft, carried across the body, butt
  // low on the left and head high right. This is the pose the whole set opens
  // and closes on, and it has to be written into every clip rather than left
  // to `K(t, {})`: an empty key falls back to MAKI_STANCE, which is her
  // EMPTY-HANDED guard, so every staff attack used to begin and end with her
  // left hand 16 cm off a weapon she is supposed to be holding with it.
  idleCloud: idleAt({ ...MAKI_STANCE, ...CLOUD_GUARD }, 2.2, 0.014),

  punch1Cloud: {
    dur: 0.30, loop: false, keys: [
      K(0, CLOUD_GUARD),
      // the WIND-UP. Toji does not have one of these.
      K(0.07, { UpArmL: [-48, -6, 6], LoArmL: [-68, 39, 7], Hips: [0, 40, 0], Spine: [6, -16, 0], Chest: [4, -20, 0], UpArmR: [-40, -24, -22], LoArmR: [-96, -34, 0] }, 'in'),
      K(0.15, { UpArmL: [-51, -7, -39], LoArmL: [-9, 35, 2], Hips: [0, 4, 0], Spine: [10, 10, 0], Chest: [8, 16, 0], UpArmR: [-72, 10, -14], LoArmR: [-40, 8, 0], HandR: [-10, -50, 0], Hips_pos: [0, -0.070, 0], ThighR: [10, 7, 0] }, 'snap'),
      K(0.21, { UpArmL: [-52, -12, -21], LoArmL: [-16, 55, 4], Hips: [0, 6, 0], Spine: [9, 8, 0], UpArmR: [-68, 8, -14], LoArmR: [-44, 6, 0] }, 'hold'),
      // ...AND THE RESET TO GUARD. Also not something Toji does.
      K(0.30, CLOUD_GUARD)
    ]
  },
  punch2Cloud: {
    dur: 0.32, loop: false, keys: [
      K(0, CLOUD_GUARD),
      K(0.07, { UpArmL: [-16, 32, -1], LoArmL: [-85, 32, 2], Hips: [0, 2, 0], Spine: [4, 14, 0], Chest: [3, 18, 0], LoArmL: [-92, 30, 0] }, 'in'),
      K(0.16, { UpArmL: [-74, -9, 9], LoArmL: [-5, 13, 4], Hips: [0, 44, 0], Spine: [11, -18, 0], Chest: [9, -22, 0], HandL: [-8, 54, 0], UpArmR: [-48, -20, -20], LoArmR: [-72, -26, 0], Hips_pos: [0, -0.068, 0], ThighL: [-26, -5, 0] }, 'snap'),
      K(0.22, { UpArmL: [-5, 27, 3], LoArmL: [-89, 2, -10], Hips: [0, 42, 0], LoArmL: [-40, 6, 0] }, 'hold'),
      K(0.32, CLOUD_GUARD)
    ]
  },
  punch3Cloud: {
    // THE LAUNCHER — an upward staff sweep from low left to high right,
    // finishing with both hands overhead. The biggest hip rotation in the set.
    dur: 0.44, loop: false, keys: [
      K(0, CLOUD_GUARD),
      K(0.10, { UpArmL: [-30, 3, 4], LoArmL: [-78, 36, 5], Hips: [0, 46, 0], Spine: [16, -20, 0], Chest: [12, -24, 0], Hips_pos: [0, -0.115, 0], UpArmR: [-14, -28, -18], LoArmR: [-104, -36, 0], ThighR: [24, 7, 0], ShinR: [40, 0, 0] }, 'in'),
      K(0.21, { UpArmL: [-120, 5, -43], LoArmL: [-5, 17, 3], Hips: [0, -8, 0], Spine: [-16, 12, 0], Chest: [-14, 18, 0], Neck: [-6, -4, 0], Head: [-10, -8, 0], UpArmR: [-158, 6, -20], LoArmR: [-24, 4, 0], HandR: [-6, -44, 0], Hips_pos: [0, -0.010, 0], ThighL: [-16, -5, 0], ThighR: [-6, 7, 0] }, 'snap'),
      K(0.28, { UpArmL: [-109, 9, -6], LoArmL: [-93, 31, 1], Hips: [0, -6, 0], Spine: [-14, 10, 0], UpArmR: [-154, 4, -20] }, 'hold'),
      K(0.44, CLOUD_GUARD)
    ]
  },
  ct1Cloud: {
    // PLAYFUL CLOUD SWEEP — the wide horizontal arc, thrown twice. Where
    // Toji's Cloud Cyclone is a spin AROUND him, hers is a pair of committed
    // level sweeps she steps into: same weapon, different intent.
    dur: 0.72, loop: false, keys: [
      K(0, CLOUD_GUARD),
      K(0.10, { UpArmL: [-46, -6, 4], LoArmL: [-68, 39, 7], Hips: [0, 54, 0], Spine: [8, -24, 0], Chest: [6, -30, 0], UpArmR: [-30, -30, -24], LoArmR: [-100, -38, 0], Hips_pos: [0, -0.100, 0] }, 'in'),
      K(0.24, { UpArmL: [-61, -1, -31], LoArmL: [-6, 19, 3], Hips: [0, -20, 0], Spine: [10, 26, 0], Chest: [8, 32, 0], UpArmR: [-92, 22, -12], LoArmR: [-26, 10, 0], Hips_pos: [0, -0.076, 0], ThighL: [-30, -5, 0], ThighR: [18, 7, 0] }, 'snap'),
      K(0.32, { Hips: [0, -18, 0], Spine: [9, 24, 0] }, 'hold'),
      // the return sweep, the other way
      K(0.46, { UpArmL: [-88, -23, 5], LoArmL: [-4, 9, 4], Hips: [0, 50, 0], Spine: [8, -22, 0], Chest: [6, -28, 0], UpArmR: [-80, -26, -20], LoArmR: [-34, -12, 0], Hips_pos: [0, -0.076, 0], ThighL: [16, -5, 0], ThighR: [-26, 7, 0] }, 'snap'),
      K(0.54, { Hips: [0, 48, 0] }, 'hold'),
      K(0.72, CLOUD_GUARD)
    ]
  },
  ct2Cloud: {
    // THE OVERHEAD. Up high, then straight down through the target and into
    // the deck. Long recovery, and she comes out of it back on guard.
    dur: 0.80, loop: false, keys: [
      K(0, CLOUD_GUARD),
      K(0.16, { UpArmL: [-161, 12, 11], LoArmL: [-4, 13, 2], Spine: [-22, -6, 0], Chest: [-18, -8, 0], Neck: [-8, -3, 0], Head: [-12, -8, 0], UpArmR: [-172, -8, -18], LoArmR: [-14, -6, 0], Hips_pos: [0, -0.006, 0], ThighL: [-8, -5, 0], ThighR: [6, 7, 0] }, 'in'),
      K(0.30, { UpArmL: [-68, 5, 11], LoArmL: [-8, 29, 2], Spine: [34, -6, 0], Chest: [24, -9, 0], Neck: [6, -4, 0], Head: [16, -8, 0], UpArmR: [-56, -10, -14], LoArmR: [-42, -16, 0], Hips_pos: [0, -0.150, 0], ThighL: [-40, -5, 0], ShinL: [46, 0, 0], ThighR: [30, 7, 0], ShinR: [50, 0, 0] }, 'snap'),
      K(0.42, { UpArmL: [-42, 11, 5], LoArmL: [-83, 34, 4], Spine: [32, -6, 0], Chest: [23, -9, 0], Hips_pos: [0, -0.146, 0], UpArmR: [-54, -10, -14] }, 'hold'),
      K(0.80, CLOUD_GUARD)
    ]
  },

  // =========================================================================
  // THE SPLIT SOUL KATANA SET — cutting, not swinging
  // =========================================================================
  // Everything here is SHORTER in travel and FASTER in the middle than the
  // staff set. A blade does not need amplitude; it needs a line.
  idleSoul: idleAt({
    ...MAKI_STANCE,
    // blade held point-forward at chest height in the right, left hand open
    UpArmL: [-36, 26, 8], LoArmL: [-100, 34, 0], HandL: [-20, 82, 0],
    UpArmR: [-46, -10, -10], LoArmR: [-72, -18, 0], HandR: [-14, -68, 0]
  }, 2.2, 0.013),

  punch1Soul: {
    dur: 0.26, loop: false, keys: [
      K(0, {}),
      K(0.05, { Hips: [0, 36, 0], UpArmR: [-38, -22, -16], LoArmR: [-86, -28, 0] }, 'in'),
      K(0.12, { Hips: [0, 8, 0], Spine: [7, 4, 0], UpArmR: [-74, 6, -10], LoArmR: [-36, 4, 0], HandR: [-8, -46, 0], Hips_pos: [0, -0.068, 0] }, 'snap'),
      K(0.17, { Hips: [0, 10, 0], UpArmR: [-70, 5, -10] }, 'hold'),
      K(0.26, {})
    ]
  },
  punch2Soul: {
    dur: 0.28, loop: false, keys: [
      K(0, {}),
      K(0.05, { Hips: [0, 6, 0], UpArmR: [-92, 8, -8], LoArmR: [-52, 10, 0] }, 'in'),
      K(0.13, { Hips: [0, 34, 0], Spine: [8, -10, 0], UpArmR: [-40, -18, -18], LoArmR: [-58, -22, 0], HandR: [-12, -60, 0], Hips_pos: [0, -0.068, 0] }, 'snap'),
      K(0.19, { Hips: [0, 32, 0], UpArmR: [-42, -16, -18] }, 'hold'),
      K(0.28, {})
    ]
  },
  punch3Soul: {
    // the launcher: a rising diagonal cut, low-right to high-left
    dur: 0.40, loop: false, keys: [
      K(0, {}),
      K(0.09, { Hips: [0, 44, 0], Spine: [14, -18, 0], Hips_pos: [0, -0.110, 0], UpArmR: [-8, -26, -14], LoArmR: [-96, -30, 0], ThighR: [22, 7, 0], ShinR: [38, 0, 0] }, 'in'),
      K(0.19, { Hips: [0, -12, 0], Spine: [-14, 14, 0], Chest: [-12, 18, 0], Head: [-9, -8, 0], UpArmR: [-150, 14, -14], LoArmR: [-28, 8, 0], HandR: [-6, -40, 0], UpArmL: [-120, 20, 22], Hips_pos: [0, -0.014, 0], ThighL: [-14, -5, 0] }, 'snap'),
      K(0.25, { Hips: [0, -10, 0], UpArmR: [-146, 12, -14] }, 'hold'),
      K(0.40, {})
    ]
  },
  ct1Soul: {
    // SLASHING STRING — three fast cuts on one breath. The only clip in her
    // set with no reset between hits, and that is deliberate: this is the move
    // that feels most like Toji's, and it is the one where the two characters
    // are supposed to rhyme.
    dur: 0.56, loop: false, keys: [
      K(0, {}),
      K(0.06, { Hips: [0, 38, 0], UpArmR: [-34, -24, -18], LoArmR: [-88, -30, 0] }, 'in'),
      K(0.14, { Hips: [0, 2, 0], UpArmR: [-78, 8, -10], LoArmR: [-32, 6, 0], Spine: [8, 6, 0] }, 'snap'),
      K(0.24, { Hips: [0, 40, 0], UpArmR: [-46, -20, -16], LoArmR: [-56, -24, 0], Spine: [8, -12, 0] }, 'snap'),
      K(0.34, { Hips: [0, -6, 0], UpArmR: [-104, 12, -8], LoArmR: [-24, 10, 0], Spine: [6, 12, 0] }, 'snap'),
      K(0.40, { Hips: [0, -4, 0], UpArmR: [-100, 10, -8] }, 'hold'),
      K(0.56, {})
    ]
  },
  ct2Soul: {
    // SPLIT SOUL STRIKE — the committed cut. One enormous draw across the
    // body and a long held follow-through with the blade extended, because
    // this is the hit that goes through a guard and the animation has to say
    // it landed on something that was not there.
    dur: 0.76, loop: false, keys: [
      K(0, {}),
      K(0.14, { Hips: [0, 58, 0], Spine: [10, -26, 0], Chest: [8, -32, 0], Neck: [2, 6, 0], Head: [4, 10, 0], UpArmR: [-20, -32, -22], LoArmR: [-104, -40, 0], Hips_pos: [0, -0.110, 0], ThighR: [26, 7, 0], ShinR: [34, 0, 0] }, 'in'),
      K(0.28, { Hips: [0, -22, 0], Spine: [6, 30, 0], Chest: [5, 36, 0], Neck: [0, -8, 0], Head: [-2, -12, 0], UpArmR: [-96, 26, -6], LoArmR: [-14, 12, 0], HandR: [-4, -36, 0], UpArmL: [-52, 34, 12], LoArmL: [-70, 30, 0], Hips_pos: [0, -0.056, 0], ThighL: [-34, -5, 0], ThighR: [22, 7, 0] }, 'snap'),
      // THE HOLD. A quarter of a second of not moving, which is the longest
      // held key in her set and is what makes the cut feel like it cost her
      // something.
      K(0.44, { Hips: [0, -20, 0], Spine: [6, 28, 0], Chest: [5, 34, 0], UpArmR: [-94, 24, -6], LoArmR: [-14, 12, 0], UpArmL: [-50, 32, 12], Hips_pos: [0, -0.056, 0] }, 'hold'),
      K(0.76, {})
    ]
  },

  // ---- HEAVY: the same overhead whichever weapon is up -------------------
  heavy: {
    dur: 0.68, loop: false, keys: [
      K(0, {}),
      K(0.14, { Spine: [-20, -8, 0], Chest: [-16, -10, 0], Head: [-11, -9, 0], UpArmL: [-160, 14, 24], UpArmR: [-166, -10, -20], LoArmL: [-22, 12, 0], LoArmR: [-18, -8, 0], Hips_pos: [0, -0.010, 0] }, 'in'),
      K(0.27, { Spine: [32, -8, 0], Chest: [22, -11, 0], Head: [15, -9, 0], UpArmL: [-48, 18, 16], UpArmR: [-52, -12, -14], LoArmL: [-50, 22, 0], LoArmR: [-46, -18, 0], Hips_pos: [0, -0.145, 0], ThighL: [-38, -5, 0], ShinL: [44, 0, 0], ThighR: [28, 7, 0], ShinR: [48, 0, 0] }, 'snap'),
      K(0.38, { Spine: [30, -8, 0], Hips_pos: [0, -0.140, 0], UpArmL: [-46, 18, 16], UpArmR: [-50, -12, -14] }, 'hold'),
      K(0.68, {})
    ]
  },

  // =========================================================================
  // THE SWAP — B, and the whole special
  // =========================================================================
  // 22 frames of one motion: the held weapon goes back over the shoulder as
  // the free hand comes up to meet the other one. Both hands cross at the
  // chest at the midpoint, which is the frame the prop swap actually happens
  // on — a swap that happens while the hands are apart reads as teleporting.
  //
  // Deliberately ONE clip. Toji has four `draw<Sfx>` clips because he is
  // pulling different objects out of a curse; she is moving two things she is
  // already wearing, and one motion covers both directions.
  swap: {
    dur: 0.38, loop: false, keys: [
      K(0, {}),
      K(0.08, { Spine: [4, 14, 0], Chest: [3, 18, 0], UpArmR: [-52, -18, -20], LoArmR: [-100, -30, 0], UpArmL: [-30, 20, 12] }, 'in'),
      // THE CROSS — both hands at the chest, on the same frame
      K(0.17, { Spine: [8, -6, 0], Chest: [6, -8, 0], Head: [4, -12, 0], UpArmL: [-96, 34, 16], LoArmL: [-104, 40, 0], HandL: [-14, 92, 0], UpArmR: [-102, -30, -16], LoArmR: [-110, -38, 0], HandR: [-14, -94, 0], Hips_pos: [0, -0.086, 0] }, 'snap'),
      K(0.24, { Spine: [8, -4, 0], UpArmL: [-92, 32, 16], UpArmR: [-98, -28, -16] }, 'hold'),
      K(0.38, {})
    ]
  },

  // =========================================================================
  // THE ULTIMATE — both weapons, once, at maximum awakening
  // =========================================================================
  // Authored FROM the awakened neutral rather than from the braced one: by the
  // time this is available she is standing in OPEN_3, and a cast that snapped
  // back to a guard posture would undo the whole arc.
  ult: {
    dur: 1.80, loop: false, keys: [
      K(0, OPEN_3),
      // the settle: she drops her weight once, and everything goes still
      K(0.22, { ...OPEN_3, Hips_pos: [0, -0.090, 0], Spine: [8, -4, 0], Chest: [6, -6, 0], Head: [4, -7, 0], UpArmL: [-30, 18, 10], UpArmR: [-26, -14, -11], ThighL: [-24, -4, 0], ShinL: [26, 0, 0], ThighR: [18, 6, 0], ShinR: [30, 0, 0] }, 'in'),
      K(0.34, { ...OPEN_3, Hips_pos: [0, -0.094, 0], Spine: [8, -4, 0] }, 'hold'),
      // and then it is a sequence — six strikes, alternating hands, each one
      // a snap with almost no travel between them
      K(0.50, { Hips: [0, -26, 0], Spine: [10, 30, 0], UpArmR: [-104, 28, -6], LoArmR: [-16, 12, 0], Hips_pos: [0, -0.060, 0] }, 'snap'),
      K(0.64, { Hips: [0, 48, 0], Spine: [10, -26, 0], UpArmL: [-98, -22, 22], LoArmL: [-20, 6, 0], UpArmR: [-40, -24, -18] }, 'snap'),
      K(0.78, { Hips: [0, -18, 0], Spine: [-12, 22, 0], Chest: [-10, 26, 0], UpArmR: [-148, 16, -12], LoArmR: [-22, 8, 0] }, 'snap'),
      K(0.92, { Hips: [0, 40, 0], Spine: [16, -22, 0], UpArmL: [-52, -20, 20], LoArmL: [-64, -18, 0], Hips_pos: [0, -0.110, 0] }, 'snap'),
      K(1.06, { Hips: [0, -30, 0], Spine: [12, 34, 0], UpArmR: [-88, 30, -4], LoArmR: [-12, 14, 0], UpArmL: [-80, 26, 18] }, 'snap'),
      // THE LAST ONE: both weapons, together, straight down
      K(1.26, { Spine: [36, -4, 0], Chest: [26, -6, 0], Head: [17, -7, 0], UpArmL: [-44, 20, 14], LoArmL: [-48, 24, 0], UpArmR: [-48, -14, -12], LoArmR: [-44, -20, 0], Hips_pos: [0, -0.165, 0], ThighL: [-44, -4, 0], ShinL: [50, 0, 0], ThighR: [32, 6, 0], ShinR: [54, 0, 0] }, 'snap'),
      K(1.44, { Spine: [34, -4, 0], Hips_pos: [0, -0.160, 0], UpArmL: [-42, 20, 14], UpArmR: [-46, -14, -12] }, 'hold'),
      // and back to standing, not to guard
      K(1.80, OPEN_3)
    ]
  },

  // =========================================================================
  // TAUNT — D-pad Left
  // =========================================================================
  // She pushes the glasses up her nose with one knuckle and says nothing.
  // At full awakening there are no glasses to push, and the same motion
  // becomes her brushing the hair off her forehead instead — the taunt does
  // not change, the joke does. (One clip; the model has already taken the
  // glasses away by then, which is what makes it land.)
  taunt: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      K(0.26, { UpArmR: [-118, -14, -14], LoArmR: [-118, -20, 0], HandR: [-24, -86, 0], Head: [-4, -6, 0], Neck: [-2, -2, 0], Chest: [2, -10, 0] }, 'in'),
      K(0.42, { UpArmR: [-126, -16, -12], LoArmR: [-128, -22, 0], HandR: [-30, -90, 0], Head: [-8, -6, 0] }, 'snap'),
      K(0.66, { UpArmR: [-124, -16, -12], LoArmR: [-126, -22, 0], Head: [-7, -6, 0] }, 'hold'),
      K(1.30, {})
    ]
  },

  // ---- VICTORY: she checks the weapon, not the opponent ------------------
  victory: {
    dur: 2.60, loop: false, keys: [
      K(0, {}),
      K(0.40, { Hips: [0, 8, 0], Spine: [2, -2, 0], Chest: [0, -4, 0], Head: [6, 4, 0], Neck: [3, 2, 0], UpArmR: [-58, -8, -14], LoArmR: [-84, -18, 0], HandR: [-10, -70, 0], Hips_pos: [0, -0.030, 0] }, 'in'),
      K(0.90, { Hips: [0, 6, 0], Head: [8, 6, 0], UpArmR: [-62, -6, -13], LoArmR: [-90, -16, 0] }, 'hold'),
      // and then she puts it away and stands up straight
      K(1.50, { ...OPEN_3, Head: [-4, -7, 0] }, 'out'),
      K(2.60, { ...OPEN_3, Head: [-3, -7, 0], Chest: [-1, -8, 0] })
    ]
  }
};
