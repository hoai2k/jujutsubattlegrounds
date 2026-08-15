// HAJIME KASHIMO — the RESTLESS end of the roster.
//
// THE ANIMATION BRIEF: "Movement: loose, restless, never fully still even in
// idle. He should look like he's about to move at all times. His idle animation
// is important — build in a constant shifting weight."
//
// HOW THAT IS ACHIEVED, and why it is not the same thing as "add more keys":
//
//   ONE SLOW CARRIER, TWO FAST PASSENGERS. The idle runs a 2.6 s weight roll
//   from foot to foot — the carrier, and the only thing with real amplitude —
//   and then hangs two much shorter cycles on top of it that DO NOT DIVIDE
//   INTO IT: a 0.87 s staff bounce in the right wrist and a 0.63 s head/knee
//   tick. Because 2.6 / 0.87 and 2.6 / 0.63 are both irrational-ish, the three
//   never re-align inside the loop, so the pose is never twice the same and
//   the eye cannot find the repeat. That is what "never fully still" has to
//   mean mechanically — an idle with a big obvious sway is still an idle you
//   can predict, and predictability is the thing this character must not have.
//
//   Since the clip player runs ONE clip at a time, the three cycles are baked
//   into a single 2.6 s clip at 13 keys rather than layered at runtime. The
//   keys are deliberately at ugly times (0.21, 0.42, 0.63…) for the same
//   reason.
//
//   NOTHING RESOLVES TO NEUTRAL. Every recovery key in this file lands on a
//   pose that is already leaning somewhere, so he never arrives at rest — he
//   arrives at the next thing. Compare Naoya, who arrives at poses and HOLDS
//   them; Kashimo arrives and immediately starts leaving.
//
//   SNAP OUT, DRIFT BACK. Every strike uses 'snap' on the impact key and then
//   an eased key back, so the hit is instant and the recovery is loose. Naoya
//   is stepped in both directions; Kashimo is stepped in one. That difference
//   is what keeps the two fast characters from reading as the same character.
//
// THE STAFF. It lives in HandR, so every pose in this file is written as a
// two-handed or right-handed grip on a 1.72 m rod. HandR ry is the WRIST
// PRONATION about the forearm axis (see base.js): around -70 is the neutral
// carry, around -150 turns the rod across the body for a horizontal sweep.
//
// THE CHARGE TIERS live in the model (art/models/kashimo.js `setCharge`), not
// here — arcs, the conductor tip and the face glow are geometry. What the
// ANIMATION contributes is `idleCharged` and `runCharged`: a second, lower,
// wider, more coiled version of both cycles that the fighter swaps to from
// tier 2 upward. So the read at range is posture first, arcs second.
import { STANCE as BASE } from './base.js';

const K = (t, pose, e) => ({ t, pose, e });

// ---- STANCE ---------------------------------------------------------------
// Light, high and OPEN. Feet close together and under him rather than braced
// apart — he is not planted, he is between steps. The staff is carried low and
// diagonally across the body in the right hand with the left hand loose and
// ready to take it. Head slightly forward and level: he is looking AT you, not
// down at you (Naoya) and not through you (Geto).
export const KASHIMO_STANCE = {
  ...BASE,
  Hips_pos: [0, -0.030, 0.014],              // weight FORWARD, and high
  Hips: [0, 20, 0],
  Spine: [6, -6, 0], Chest: [4, -8, 0], Neck: [2, -3, 0],
  Head: [4, -6, 0],
  // RIGHT HAND: THE STAFF GRIP, AND THE ELBOW IS DELIBERATELY ALMOST STRAIGHT.
  // The first pass carried the roster's usual ~90-degree guard elbow
  // (LoArmR -84) and the render was decisive: a 1.72 m rod continuing a
  // forearm held horizontally across the chest bisects the whole model, covers
  // the face, and turns a character into a diagonal line. Dropping the elbow to
  // -34 lets the rod hang down-and-forward from the hand — the way anyone
  // actually carries a staff they are not currently using — and the silhouette
  // comes back. Every clip below that does not restate LoArmR inherits this.
  ClavR: [0, 0, 0], UpArmR: [-6, -10, -12], LoArmR: [-34, -16, 0], HandR: [-10, -60, 0],
  // left hand: open, loose, hovering near the shaft
  ClavL: [0, 0, 0], UpArmL: [-30, 14, 14], LoArmL: [-96, 30, 0], HandL: [-16, 54, 0],
  // narrow base — the tell that he is about to move
  ThighL: [-12, -3, 0], ShinL: [12, 0, 0], FootL: [1, -8, 0],
  ThighR: [8, 4, 0], ShinR: [16, 0, 0], FootR: [6, 6, 0]
};

const S = KASHIMO_STANCE;

export const KASHIMO_CLIPS = {
  // ---- IDLE — the three non-aligning cycles. See the header. --------------
  idle: {
    dur: 2.6, loop: true, keys: [
      K(0, {}),
      K(0.21, { HandR: [-16, -74, 0], Head: [5, -9, 0], ShinL: [15, 0, 0] }),
      K(0.42, { HandR: [-8, -60, 0], Head: [3, -3, 0], Hips_pos: [0, -0.036, 0.012], ShinR: [19, 0, 0] }),
      K(0.63, { HandR: [-15, -71, 0], Head: [6, -8, 0], ShinL: [11, 0, 0], ShinR: [15, 0, 0] }),
      // carrier: weight rolls onto the left foot
      K(0.87, {
        Hips_pos: [0.014, -0.040, 0.010], Hips: [0, 25, 0], Chest: [5, -11, 0], Spine: [7, -8, 0],
        UpArmL: [-36, 16, 17], LoArmL: [-102, 34, 0], UpArmR: [-22, -10, -12],
        HandR: [-6, -58, 0], Head: [3, -10, 0], ThighL: [-16, -3, 0], ThighR: [11, 4, 0]
      }),
      K(1.08, { HandR: [-17, -76, 0], Head: [6, -7, 0], ShinR: [20, 0, 0] }),
      K(1.30, {
        Hips_pos: [0, -0.026, 0.018], Hips: [0, 18, 0], Chest: [3, -6, 0],
        UpArmL: [-27, 12, 12], UpArmR: [-15, -7, -9], HandR: [-10, -62, 0],
        Head: [5, -2, 0], ThighL: [-9, -3, 0], ThighR: [6, 4, 0]
      }),
      K(1.51, { HandR: [-18, -78, 0], Head: [3, -6, 0], ShinL: [14, 0, 0] }),
      // carrier: and onto the right
      K(1.74, {
        Hips_pos: [-0.014, -0.040, 0.010], Hips: [0, 15, 0], Chest: [5, -5, 0], Spine: [7, -4, 0],
        UpArmL: [-24, 11, 11], LoArmL: [-90, 26, 0], UpArmR: [-24, -10, -12],
        HandR: [-8, -56, 0], Head: [5, -10, 0], ThighL: [-8, -3, 0], ThighR: [12, 4, 0]
      }),
      K(1.95, { HandR: [-16, -72, 0], Head: [4, -4, 0], ShinR: [14, 0, 0] }),
      K(2.17, { Hips_pos: [0, -0.032, 0.016], HandR: [-11, -63, 0], Head: [6, -8, 0] }),
      K(2.38, { HandR: [-15, -70, 0], Head: [3, -5, 0], ShinL: [13, 0, 0] }),
      K(2.6, {})
    ]
  },

  // ---- IDLE, TIER 2+ — the coiled version --------------------------------
  // Lower, wider, staff brought UP across the chest in both hands, head down
  // and forward. The whole point is that this silhouette is readable at
  // fighting distance BEFORE the arcs are: he stops looking loose and starts
  // looking like he is about to go through you.
  idleCharged: {
    dur: 1.7, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.072, 0.026], Hips: [0, 26, 0],
        Spine: [12, -8, 0], Chest: [9, -12, 0], Head: [10, -8, 0], Neck: [4, -3, 0],
        UpArmR: [-52, -14, -18], LoArmR: [-104, -26, 0], HandR: [-14, -84, 0],
        UpArmL: [-62, 22, 24], LoArmL: [-118, 40, 0], HandL: [-16, 74, 0],
        ThighL: [-26, -6, 0], ShinL: [26, 0, 0], FootL: [4, -10, 0],
        ThighR: [18, 8, 0], ShinR: [30, 0, 0], FootR: [10, 8, 0]
      }),
      K(0.28, { HandR: [-20, -92, 0], Head: [12, -11, 0], Hips_pos: [0.010, -0.078, 0.024] }),
      K(0.55, { HandR: [-10, -78, 0], Head: [9, -5, 0], Hips_pos: [0, -0.066, 0.030], ShinR: [34, 0, 0] }),
      K(0.85, {
        Hips_pos: [-0.010, -0.078, 0.024], Hips: [0, 21, 0], Chest: [11, -9, 0],
        UpArmR: [-56, -16, -20], UpArmL: [-58, 20, 22], HandR: [-18, -88, 0], Head: [11, -10, 0]
      }),
      K(1.12, { HandR: [-12, -76, 0], Head: [9, -6, 0], ShinL: [30, 0, 0] }),
      K(1.42, { Hips_pos: [0.008, -0.074, 0.028], HandR: [-19, -90, 0], Head: [12, -9, 0] }),
      K(1.7, {})
    ]
  },

  // ---- WALK — short, quick, busy. He does not saunter. --------------------
  walk: {
    dur: 0.74, loop: true, keys: [
      K(0, { ThighL: [-26, -3, 0], ShinL: [14, 0, 0], FootL: [-6, -8, 0], ThighR: [20, 4, 0], ShinR: [28, 0, 0], FootR: [12, 6, 0], Hips_pos: [0, -0.036, 0.012], UpArmL: [-34, 15, 15], UpArmR: [-24, -9, -11], HandR: [-10, -64, 0], Spine: [7, -6, 0] }),
      K(0.185, { ThighL: [-4, -3, 0], ShinL: [20, 0, 0], ThighR: [2, 4, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.018, 0.016], HandR: [-16, -72, 0] }),
      K(0.37, { ThighL: [22, -3, 0], ShinL: [26, 0, 0], FootL: [10, -8, 0], ThighR: [-24, 4, 0], ShinR: [12, 0, 0], FootR: [-6, 6, 0], Hips_pos: [0, -0.036, 0.012], UpArmL: [-24, 15, 15], UpArmR: [-34, -9, -11], HandR: [-8, -60, 0], Spine: [7, -6, 0] }),
      K(0.555, { ThighL: [2, -3, 0], ShinL: [17, 0, 0], ThighR: [-6, 4, 0], ShinR: [22, 0, 0], Hips_pos: [0, -0.018, 0.016], HandR: [-17, -74, 0] }),
      K(0.74, { ThighL: [-26, -3, 0], ShinL: [14, 0, 0], FootL: [-6, -8, 0], ThighR: [20, 4, 0], ShinR: [28, 0, 0], FootR: [12, 6, 0], Hips_pos: [0, -0.036, 0.012], UpArmL: [-34, 15, 15], UpArmR: [-24, -9, -11], HandR: [-10, -64, 0] })
    ]
  },

  // ---- RUN — 0.42 s. Just off Naoya's 0.40, and deliberately so: he is the
  // second fastest thing in the game and the cycle should say "second".
  // The staff trails BEHIND him, not pumped like an arm — a runner carrying a
  // spear does not swing it, and that one detail is most of why the run reads
  // as him rather than as the base cycle.
  run: {
    dur: 0.42, loop: true, keys: [
      K(0, { Spine: [17, -5, 0], Chest: [11, -7, 0], Hips: [4, 16, 0], Head: [8, -6, 0], ThighL: [-56, -2, 0], ShinL: [24, 0, 0], FootL: [-14, -6, 0], ThighR: [36, 4, 0], ShinR: [68, 0, 0], FootR: [30, 6, 0], UpArmL: [-18, 10, 12], LoArmL: [-108, 4, 4], UpArmR: [22, -10, -14], LoArmR: [-52, -14, -4], HandR: [-6, -58, 0], Hips_pos: [0, -0.024, 0.010] }),
      K(0.105, { Spine: [15, -5, 0], ThighL: [-10, -2, 0], ShinL: [30, 0, 0], ThighR: [-14, 4, 0], ShinR: [42, 0, 0], Hips_pos: [0, -0.062, 0.010], UpArmR: [26, -10, -14] }),
      K(0.21, { Spine: [17, -5, 0], Chest: [11, -7, 0], Hips: [4, 16, 0], Head: [8, -6, 0], ThighL: [36, -2, 0], ShinL: [68, 0, 0], FootL: [30, -6, 0], ThighR: [-56, 4, 0], ShinR: [24, 0, 0], FootR: [-14, 6, 0], UpArmL: [-72, 10, 12], LoArmL: [-92, 4, 4], UpArmR: [18, -10, -14], LoArmR: [-58, -14, -4], HandR: [-10, -62, 0], Hips_pos: [0, -0.024, 0.010] }),
      K(0.315, { Spine: [15, -5, 0], ThighL: [-14, -2, 0], ShinL: [42, 0, 0], ThighR: [-10, 4, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.062, 0.010], UpArmR: [26, -10, -14] }),
      K(0.42, { Spine: [17, -5, 0], Chest: [11, -7, 0], Hips: [4, 16, 0], ThighL: [-56, -2, 0], ShinL: [24, 0, 0], FootL: [-14, -6, 0], ThighR: [36, 4, 0], ShinR: [68, 0, 0], FootR: [30, 6, 0], UpArmL: [-18, 10, 12], UpArmR: [22, -10, -14], HandR: [-6, -58, 0] })
    ]
  },

  // ---- RUN, TIER 2+ — lower, longer, staff levelled forward like a lance.
  runCharged: {
    dur: 0.38, loop: true, keys: [
      K(0, { Spine: [24, -5, 0], Chest: [15, -7, 0], Hips: [5, 18, 0], Head: [12, -6, 0], ThighL: [-62, -2, 0], ShinL: [26, 0, 0], FootL: [-16, -6, 0], ThighR: [40, 4, 0], ShinR: [72, 0, 0], FootR: [32, 6, 0], UpArmL: [-56, 20, 22], LoArmL: [-110, 34, 0], UpArmR: [-48, -14, -16], LoArmR: [-96, -22, 0], HandR: [-12, -80, 0], Hips_pos: [0, -0.050, 0.020] }),
      K(0.095, { Spine: [22, -5, 0], ThighL: [-12, -2, 0], ShinL: [32, 0, 0], ThighR: [-16, 4, 0], ShinR: [46, 0, 0], Hips_pos: [0, -0.086, 0.020] }),
      K(0.19, { Spine: [24, -5, 0], Chest: [15, -7, 0], Hips: [5, 18, 0], Head: [12, -6, 0], ThighL: [40, -2, 0], ShinL: [72, 0, 0], FootL: [32, -6, 0], ThighR: [-62, 4, 0], ShinR: [26, 0, 0], FootR: [-16, 6, 0], UpArmL: [-60, 22, 24], LoArmL: [-104, 36, 0], UpArmR: [-44, -14, -16], HandR: [-16, -84, 0], Hips_pos: [0, -0.050, 0.020] }),
      K(0.285, { Spine: [22, -5, 0], ThighL: [-16, -2, 0], ShinL: [46, 0, 0], ThighR: [-12, 4, 0], ShinR: [32, 0, 0], Hips_pos: [0, -0.086, 0.020] }),
      K(0.38, { Spine: [24, -5, 0], Chest: [15, -7, 0], ThighL: [-62, -2, 0], ShinL: [26, 0, 0], ThighR: [40, 4, 0], ShinR: [72, 0, 0], UpArmL: [-56, 20, 22], UpArmR: [-48, -14, -16], HandR: [-12, -80, 0], Hips_pos: [0, -0.050, 0.020] })
    ]
  },

  // ---- DASH — the best sustained dash in the game, and it should look like a
  // skid-start rather than a lunge: the front foot goes out, the body tips,
  // and the staff drags. He is not pushing off, he is falling forward and
  // catching himself for as long as the button is held.
  dash: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.06, { Spine: [30, -4, 0], Chest: [17, -6, 0], Head: [14, -5, 0], Hips_pos: [0, -0.120, 0.030], ThighL: [-54, -4, 0], ShinL: [34, 0, 0], ThighR: [34, 6, 0], ShinR: [60, 0, 0], UpArmL: [26, 14, 22], LoArmL: [-44, 12, 6], UpArmR: [40, -12, -22], LoArmR: [-38, -12, -6], HandR: [-4, -52, 0] }, 'snap'),
      K(0.30, { Spine: [24, -5, 0], Chest: [14, -7, 0], Hips_pos: [0, -0.092, 0.024], ThighL: [-42, -4, 0], ShinL: [28, 0, 0], ThighR: [26, 6, 0], ShinR: [48, 0, 0], UpArmL: [12, 12, 18], UpArmR: [28, -10, -20], HandR: [-8, -58, 0] })
    ]
  },

  // ---- THE STAFF STRING (X) -----------------------------------------------
  // Three hits, all with the rod: a straight THRUST, a horizontal SWEEP the
  // other way, and an upward FLICK that launches. Each snaps to the impact and
  // then drifts, and each lands on a recovery pose that is already halfway
  // into the next one — the string is one continuous motion interrupted three
  // times, not three separate swings.
  punch1: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      // chamber: rod pulled back to the hip, left hand up on the shaft
      K(0.07, { Hips: [0, 40, 0], Chest: [4, -22, 0], UpArmR: [-14, -22, -8], LoArmR: [-104, -34, 0], HandR: [-10, -72, 0], UpArmL: [-52, 26, 18], LoArmL: [-112, 38, 0], Hips_pos: [0, -0.034, 0.006] }, 'in'),
      // THRUST — hips square, both arms extend down the line
      K(0.13, { Hips: [0, 2, 0], Chest: [8, 8, 0], Spine: [9, 4, 0], Head: [6, 2, 0], UpArmR: [-72, 4, -8], LoArmR: [-18, -6, 0], HandR: [-8, -72, 0], UpArmL: [-76, 6, 12], LoArmL: [-34, 8, 0], HandL: [-10, 50, 0], Hips_pos: [0, -0.030, 0.058] }, 'snap'),
      K(0.20, { Hips: [0, 8, 0], Chest: [7, 4, 0], UpArmR: [-66, 0, -8], LoArmR: [-30, -8, 0], UpArmL: [-70, 8, 12], LoArmL: [-46, 10, 0], Hips_pos: [0, -0.032, 0.044] }, 'hold'),
      // recovery drifts INTO the chamber for hit 2, on the other side
      K(0.34, { Hips: [0, 6, 0], Chest: [5, -4, 0], UpArmR: [-44, -10, -10], LoArmR: [-64, -18, 0], UpArmL: [-46, 18, 15], LoArmL: [-84, 26, 0], Hips_pos: [0, -0.032, 0.024] })
    ]
  },

  punch2: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      // chamber: rod cocked out to his LEFT, wrist pronated to turn it flat
      K(0.07, { Hips: [0, -18, 0], Chest: [3, 24, 0], Spine: [4, 14, 0], UpArmR: [-46, 26, -6], LoArmR: [-96, 34, 0], HandR: [-14, -142, 0], UpArmL: [-30, 34, 8], LoArmL: [-70, 40, 0] }, 'in'),
      // SWEEP — a flat horizontal cut across the body, hips whipping through
      K(0.135, { Hips: [0, 44, 0], Chest: [6, -26, 0], Spine: [7, -16, 0], Head: [4, -14, 0], UpArmR: [-78, -30, -22], LoArmR: [-24, -14, 0], HandR: [-10, -150, 0], UpArmL: [-58, -6, 20], LoArmL: [-48, -12, 0], Hips_pos: [0.012, -0.030, 0.036] }, 'snap'),
      K(0.21, { Hips: [0, 38, 0], Chest: [6, -22, 0], UpArmR: [-70, -26, -20], LoArmR: [-36, -16, 0], UpArmL: [-52, -2, 18] }, 'hold'),
      // and drifts DOWN into the crouch that hit 3 launches out of
      K(0.36, { Hips: [0, 22, 0], Chest: [8, -10, 0], Spine: [10, -6, 0], UpArmR: [-34, -14, -12], LoArmR: [-78, -22, 0], HandR: [-12, -90, 0], UpArmL: [-40, 16, 14], Hips_pos: [0, -0.056, 0.020] })
    ]
  },

  punch3: {
    dur: 0.52, loop: false, keys: [
      K(0, {}),
      // chamber: deep crouch, rod low and behind, both hands on it
      K(0.10, { Hips: [0, 30, 0], Chest: [16, -18, 0], Spine: [18, -12, 0], Head: [14, -10, 0], UpArmR: [10, -20, -10], LoArmR: [-72, -28, 0], HandR: [-12, -78, 0], UpArmL: [-16, 26, 12], LoArmL: [-84, 34, 0], Hips_pos: [0, -0.096, 0.016], ThighL: [-34, -4, 0], ShinL: [38, 0, 0], ThighR: [24, 6, 0], ShinR: [42, 0, 0] }, 'in'),
      // FLICK — the whole body extends upward, rod driven from low to high
      K(0.185, { Hips: [0, 6, -4], Chest: [-18, -4, 0], Spine: [-14, -2, 0], Head: [-12, 0, 0], UpArmR: [-160, -6, -18], LoArmR: [-16, -8, 0], HandR: [-8, -70, 0], UpArmL: [-146, 4, 26], LoArmL: [-26, 6, 0], HandL: [-10, 46, 0], Hips_pos: [0, 0.038, 0.026], ThighL: [-14, -4, 0], ShinL: [8, 0, 0], ThighR: [-6, 6, 0], ShinR: [12, 0, 0] }, 'snap'),
      K(0.27, { Hips: [0, 8, -3], Chest: [-14, -6, 0], UpArmR: [-150, -8, -18], LoArmR: [-26, -10, 0], UpArmL: [-138, 4, 24], Hips_pos: [0, 0.028, 0.022] }, 'hold'),
      K(0.52, { Hips: [0, 18, 0], Chest: [4, -8, 0], UpArmR: [-26, -10, -12], LoArmR: [-88, -20, 0], HandR: [-12, -68, 0], UpArmL: [-34, 16, 15], LoArmL: [-98, 30, 0], Hips_pos: [0, -0.034, 0.014] })
    ]
  },

  // ---- HEAVY — ROD SWEEP. A full two-handed low-to-high circle taken all the
  // way round, using the whole 1.72 m of the shaft. His one committed swing,
  // and the only place in his set that has real windup on it.
  heavy: {
    dur: 0.82, loop: false, keys: [
      K(0, {}),
      K(0.16, { Hips: [0, -30, 0], Chest: [8, 36, 0], Spine: [10, 22, 0], Head: [6, 24, 0], UpArmR: [-24, 40, -4], LoArmR: [-84, 44, 0], HandR: [-14, -130, 0], UpArmL: [-14, 44, 6], LoArmL: [-58, 50, 0], Hips_pos: [-0.016, -0.070, 0.008], ThighL: [-26, -6, 0], ShinL: [28, 0, 0] }, 'in'),
      K(0.24, { Hips: [0, -36, 0], Chest: [9, 42, 0], UpArmR: [-20, 46, -2], LoArmR: [-80, 48, 0], UpArmL: [-10, 48, 6], Hips_pos: [-0.020, -0.076, 0.006] }, 'hold'),
      // the sweep itself: 80 degrees of hip rotation in four frames
      K(0.325, { Hips: [0, 56, 0], Chest: [4, -36, 0], Spine: [6, -22, 0], Head: [2, -26, 0], UpArmR: [-96, -40, -30], LoArmR: [-18, -16, 0], HandR: [-8, -156, 0], UpArmL: [-72, -18, 26], LoArmL: [-32, -20, 0], Hips_pos: [0.022, -0.052, 0.048], ThighR: [30, 8, 0], ShinR: [34, 0, 0] }, 'snap'),
      K(0.42, { Hips: [0, 50, 0], Chest: [4, -32, 0], UpArmR: [-88, -36, -28], LoArmR: [-30, -18, 0], UpArmL: [-64, -14, 24], Hips_pos: [0.018, -0.056, 0.040] }, 'hold'),
      K(0.82, {})
    ]
  },

  // ---- RB · LIGHTNING BOLT ------------------------------------------------
  // He plants the ferrule, points the conductor tip down the line with the
  // left hand and the bolt leaves the cage. Fast: 9 frames of startup, so the
  // whole gesture is one snap and a settle. Deliberately NOT a big throw — the
  // move is cheap and he throws a lot of them.
  bolt: {
    dur: 0.48, loop: false, keys: [
      K(0, {}),
      K(0.085, { Hips: [0, 30, 0], Chest: [2, -18, 0], UpArmR: [-40, -18, -12], LoArmR: [-92, -26, 0], HandR: [-14, -78, 0], UpArmL: [-58, 24, 18], LoArmL: [-104, 34, 0], Hips_pos: [0, -0.048, 0.006] }, 'in'),
      // the point — right arm drives the rod forward and level, left hand flat
      // along the shaft aiming it
      K(0.15, { Hips: [0, 4, 0], Chest: [6, 8, 0], Spine: [8, 4, 0], Head: [4, 2, 0], UpArmR: [-86, 6, -10], LoArmR: [-14, -4, 0], HandR: [-6, -70, 0], UpArmL: [-88, 4, 14], LoArmL: [-20, 6, 0], HandL: [-6, 48, 0], Hips_pos: [0, -0.030, 0.046] }, 'snap'),
      K(0.24, { Hips: [0, 6, 0], UpArmR: [-82, 4, -10], LoArmR: [-20, -6, 0], UpArmL: [-84, 4, 14], Chest: [6, 6, 0], Hips_pos: [0, -0.032, 0.040] }, 'hold'),
      K(0.48, { Hips: [0, 16, 0], Chest: [5, -6, 0], UpArmR: [-30, -10, -11], LoArmR: [-88, -20, 0], HandR: [-12, -68, 0], UpArmL: [-36, 16, 15], LoArmL: [-100, 32, 0], Hips_pos: [0, -0.032, 0.016] })
    ]
  },

  // ---- RT · DISCHARGE STRIKE ----------------------------------------------
  // The one committed thing he owns. A long chambered stab with the whole body
  // behind it — the rod goes back past his hip, he drops low, and then the
  // thrust travels. 20 frames of startup, and the animation holds still for
  // eight of them with the rod cocked, because a move that costs him a third
  // of his engine has to be seeable.
  discharge: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      // the chamber, and the HOLD on it
      K(0.13, { Hips: [0, 52, 0], Chest: [10, -34, 0], Spine: [12, -22, 0], Head: [8, -26, 0], UpArmR: [4, -34, -6], LoArmR: [-88, -40, 0], HandR: [-16, -74, 0], UpArmL: [-70, 34, 20], LoArmL: [-120, 44, 0], HandL: [-18, 62, 0], Hips_pos: [-0.010, -0.104, -0.020], ThighL: [-34, -6, 0], ShinL: [40, 0, 0], ThighR: [26, 8, 0], ShinR: [44, 0, 0] }, 'in'),
      K(0.28, { Hips: [0, 54, 0], Chest: [11, -36, 0], UpArmR: [6, -36, -6], LoArmR: [-86, -42, 0], UpArmL: [-68, 36, 20], Hips_pos: [-0.012, -0.108, -0.022] }, 'hold'),
      // THE THRUST — everything arrives at once and travels a long way forward
      K(0.355, { Hips: [0, -6, 0], Chest: [12, 14, 0], Spine: [14, 8, 0], Head: [8, 6, 0], UpArmR: [-92, 12, -8], LoArmR: [-6, -4, 0], HandR: [-4, -70, 0], UpArmL: [-96, 8, 12], LoArmL: [-10, 4, 0], HandL: [-6, 44, 0], Hips_pos: [0.006, -0.052, 0.120], ThighL: [-46, -6, 0], ShinL: [16, 0, 0], ThighR: [34, 8, 0], ShinR: [20, 0, 0] }, 'snap'),
      K(0.47, { Hips: [0, -2, 0], Chest: [12, 10, 0], UpArmR: [-88, 10, -8], LoArmR: [-14, -6, 0], UpArmL: [-92, 8, 12], Hips_pos: [0.004, -0.056, 0.106] }, 'hold'),
      K(0.85, { Hips: [0, 16, 0], Chest: [5, -6, 0], UpArmR: [-28, -10, -11], LoArmR: [-86, -20, 0], HandR: [-12, -68, 0], UpArmL: [-34, 16, 15], Hips_pos: [0, -0.034, 0.016] })
    ]
  },

  // ---- B · ARC DASH -------------------------------------------------------
  // Not a run and not a lunge — a BLINK. The pose is the shape he arrives in:
  // fully extended along the line of travel, rod trailing, legs still behind
  // him. It snaps to that pose on frame two and then recovers loose, which is
  // what makes the chain feel like three separate teleports rather than one
  // long dash.
  arcdash: {
    dur: 0.34, loop: false, keys: [
      K(0, {}),
      K(0.033, {
        Hips: [0, 8, 0], Spine: [34, -2, 0], Chest: [20, -4, 0], Head: [16, -2, 0],
        UpArmR: [46, -14, -26], LoArmR: [-30, -10, -4], HandR: [-4, -50, 0],
        UpArmL: [-104, 8, 30], LoArmL: [-24, 8, 4], HandL: [-8, 40, 0],
        Hips_pos: [0, -0.086, 0.096],
        ThighL: [-62, -4, 0], ShinL: [46, 0, 0], FootL: [-16, -8, 0],
        ThighR: [42, 6, 0], ShinR: [72, 0, 0], FootR: [26, 8, 0]
      }, 'snap'),
      K(0.14, {
        Hips: [0, 12, 0], Spine: [26, -3, 0], Chest: [15, -6, 0],
        UpArmR: [24, -12, -22], LoArmR: [-46, -12, -4],
        UpArmL: [-72, 10, 24], LoArmL: [-48, 12, 4],
        Hips_pos: [0, -0.070, 0.056], ThighL: [-40, -4, 0], ThighR: [26, 6, 0]
      }, 'hold'),
      K(0.34, {})
    ]
  },

  // ---- D-pad RIGHT · MYTHICAL BEAST AMBER, FULL RELEASE --------------------
  // The limiter coming off. Rod planted hard into the floor with both hands,
  // head thrown back, spine arched — and then he simply stands up straight,
  // because the state is the point and there is nothing to wind up for. 25
  // frames total, the non-domain tier.
  ult: {
    dur: 1.30, loop: false, keys: [
      K(0, {}),
      // PLANT — the ferrule goes into the ground and he drops onto it
      K(0.09, { Hips: [0, 14, 0], Chest: [26, -8, 0], Spine: [28, -4, 0], Head: [22, -4, 0], UpArmR: [-46, -14, -14], LoArmR: [-70, -22, 0], HandR: [-16, -96, 0], UpArmL: [-56, 20, 18], LoArmL: [-78, 30, 0], Hips_pos: [0, -0.118, 0.026], ThighL: [-40, -5, 0], ShinL: [44, 0, 0], ThighR: [30, 7, 0], ShinR: [46, 0, 0] }, 'snap'),
      // ARCH — head back, chest open, both hands still on the planted rod
      K(0.30, { Hips: [0, 10, 0], Chest: [-30, -6, 0], Spine: [-22, -2, 0], Neck: [-16, 0, 0], Head: [-30, -2, 0], UpArmR: [-58, -18, -18], LoArmR: [-56, -26, 0], UpArmL: [-66, 24, 22], LoArmL: [-62, 34, 0], Hips_pos: [0, -0.078, 0.010] }, 'out'),
      K(0.62, { Hips: [0, 10, 0], Chest: [-32, -6, 0], Head: [-32, -2, 0], UpArmR: [-60, -18, -18], UpArmL: [-68, 24, 22], Hips_pos: [0, -0.072, 0.008] }, 'hold'),
      // STAND — and that is the whole ultimate. He is just taller now.
      K(0.92, { Hips: [0, 16, 0], Chest: [-4, -8, 0], Spine: [0, -5, 0], Head: [-2, -6, 0], UpArmR: [-24, -10, -10], LoArmR: [-86, -20, 0], HandR: [-12, -66, 0], UpArmL: [-28, 14, 13], LoArmL: [-92, 28, 0], Hips_pos: [0, -0.016, 0.014] }, 'out'),
      K(1.30, {})
    ]
  },

  // ---- TAUNT — "Is that it?" ----------------------------------------------
  // He plants the rod, leans his whole weight on it like a walking stick,
  // rolls his free shoulder, and beckons with two fingers. The beckon is the
  // beat the bubble lands on. Every pose is off-balance: he is bored, and
  // being bored is the most dangerous thing this character does.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // PLANT and LEAN
      K(0.42, {
        Hips: [0, 30, 0], Chest: [6, -22, 0], Spine: [8, -14, 0], Head: [4, -18, 0],
        UpArmR: [-30, -16, -16], LoArmR: [-52, -24, 0], HandR: [-14, -100, 0],
        UpArmL: [-14, 12, 10], LoArmL: [-34, 16, 0], HandL: [-8, 30, 0],
        Hips_pos: [-0.026, -0.052, 0.006], ThighL: [-8, -4, 0], ShinL: [10, 0, 0],
        ThighR: [16, 6, 0], ShinR: [22, 0, 0]
      }, 'out'),
      // SHOULDER ROLL — the free arm circles once, loose
      K(0.80, { UpArmL: [-84, 18, 34], LoArmL: [-52, 22, 0], Chest: [4, -18, 0], Head: [2, -14, 0] }),
      K(1.05, { UpArmL: [-30, 6, 44], LoArmL: [-88, 10, 0], Chest: [7, -24, 0], Head: [6, -20, 0] }),
      // BECKON — two fingers, palm up, twice. The line lands here.
      K(1.42, {
        UpArmL: [-72, 20, 16], LoArmL: [-116, 34, 0], HandL: [-30, 96, 0],
        Head: [2, -20, 0], Chest: [5, -20, 0], Hips_pos: [-0.024, -0.048, 0.014]
      }, 'snap'),
      K(1.60, { UpArmL: [-64, 18, 14], LoArmL: [-96, 30, 0], HandL: [-10, 78, 0] }),
      K(1.82, { UpArmL: [-72, 20, 16], LoArmL: [-116, 34, 0], HandL: [-30, 96, 0] }, 'snap'),
      K(2.02, { UpArmL: [-64, 18, 14], LoArmL: [-96, 30, 0], HandL: [-10, 78, 0] }),
      // and back to leaning on the rod, still not standing up straight
      K(2.50, {
        Hips: [0, 30, 0], Chest: [6, -22, 0], Head: [4, -18, 0],
        UpArmR: [-30, -16, -16], LoArmR: [-52, -24, 0], HandR: [-14, -100, 0],
        UpArmL: [-14, 12, 10], LoArmL: [-34, 16, 0], HandL: [-8, 30, 0],
        Hips_pos: [-0.026, -0.052, 0.006]
      }),
      K(3.2, {})
    ]
  },

  // ---- VICTORY ------------------------------------------------------------
  // He spins the rod once — a full hand-over-hand pass — catches it, and looks
  // away, already bored again. No celebration: four hundred years of looking
  // for a real fight and this was not it.
  victory: {
    dur: 2.6, loop: false, keys: [
      K(0, {}),
      K(0.18, { Hips: [0, 40, 0], Chest: [4, -26, 0], UpArmR: [-96, -24, -30], LoArmR: [-40, -30, 0], HandR: [-16, -170, 0], UpArmL: [-40, 20, 16], Hips_pos: [0, -0.038, 0.010] }, 'snap'),
      K(0.36, { Hips: [0, -16, 0], Chest: [4, 22, 0], UpArmR: [-40, 30, -8], LoArmR: [-100, 36, 0], HandR: [-14, -30, 0], UpArmL: [-88, 30, 24], LoArmL: [-56, 34, 0] }, 'snap'),
      K(0.54, { Hips: [0, 34, 0], Chest: [5, -22, 0], UpArmR: [-86, -20, -26], LoArmR: [-52, -26, 0], HandR: [-12, -150, 0], UpArmL: [-34, 18, 14] }, 'snap'),
      // CATCH — the rod stops dead
      K(0.70, { Hips: [0, 22, 0], Chest: [4, -12, 0], UpArmR: [-30, -12, -12], LoArmR: [-84, -22, 0], HandR: [-12, -68, 0], UpArmL: [-30, 14, 13], LoArmL: [-94, 28, 0], Hips_pos: [0, -0.030, 0.014] }, 'snap'),
      // and looks away
      K(1.15, { Head: [2, 34, 0], Neck: [1, 12, 0], Chest: [3, -4, 0], Hips: [0, 16, 0], Hips_pos: [0, -0.036, 0.006] }, 'out'),
      K(1.90, { Head: [4, 30, 0], Chest: [5, -8, 0], Hips_pos: [0, -0.028, 0.012], UpArmR: [-26, -10, -11], UpArmL: [-34, 15, 14] }),
      K(2.6, { Head: [3, 32, 0], Chest: [4, -6, 0], Hips_pos: [0, -0.034, 0.008] })
    ]
  }
};
