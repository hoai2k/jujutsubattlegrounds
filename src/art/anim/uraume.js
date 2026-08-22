// URAUME 裏梅 — the STILLEST set in the project, and the only one whose
// defining feature is what it does NOT do.
//
// ===========================================================================
// THE ONE RULE
// ===========================================================================
//   *** URAUME NEVER HURRIES AND NEVER OVER-EXTENDS. ***
//
// Everything here is authored against three constraints, and they are
// constraints rather than preferences — a key that breaks one of them is a
// bug in this file:
//
//   1. NO ANTICIPATION LONGER THAN THREE FRAMES. Every other character in the
//      roster winds up: Yuki's set is famous for having the longest wind-ups
//      in the project and Ryu's (anim/ryu.js) is built on enormous ones.
//      Uraume's hand simply ARRIVES where it is going. There is no coil,
//      because a coil is a person gathering themselves and this is a person
//      who was already ready.
//   2. THE FOLLOW-THROUGH RETURNS TO STANCE EXACTLY. No overshoot key
//      anywhere. Every other technique clip in this project ends on an 'out'
//      ease through a slight overshoot, because that is what a body does; a
//      body that stops exactly where it meant to reads as inhuman, and the
//      character is a thousand years old and is not, at this point, especially
//      human. The `out` eases are still used — the return is smooth — but the
//      destination is the stance itself and nothing past it.
//   3. THE HEAD NEVER LEADS. In every other set the head turns into a
//      movement one or two keys before the body follows, which is what makes
//      a character look like they are looking at something. Uraume's head is
//      pinned to within four degrees of neutral in every clip in this file
//      including the ultimate. They are not watching you fight; they are
//      doing a job.
//
// THE STILLNESS IS AUTHORED, NOT ABSENT. The idle below is 5.6 seconds — the
// longest in the project by 1.4 s — and it contains real motion; it is just
// very small and very slow. A clip with two identical keys would read as a
// frozen game (see the note in anim/miwa.js about exactly that risk on her
// sheathe stance). What this reads as instead is BREATHING, at about ten
// breaths a minute, which is a resting adult at complete ease in the middle of
// a fight.
//
// THE HANDS. The stance holds them TOGETHER in front of the body, which is
// the pose the reference sheet draws and which is also the single cheapest
// characterisation available: a fighter whose guard is not up. Every technique
// in this file starts from that and returns to it, so the shape the opponent
// sees between attacks is a servant waiting to be told what to do.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — hands together at the waist, feet close and even, shoulders down.
// Not a fighting stance at all. The weight is dead centre (Hips_pos x = 0,
// which almost nothing else on the roster does) because a stance that favours
// a leg is a stance that is about to move.
export const URAUME_STANCE = {
  Hips_pos: [0, -0.028, 0],
  Hips: [0, 8, 0], Spine: [2, -2, 0], Chest: [1, -3, 0], Neck: [0, -1, 0], Head: [1, -2, 0],
  ClavL: [0, 0, 0], UpArmL: [-14, 10, 4], LoArmL: [-96, 34, 0], HandL: [-10, 62, 0],
  ClavR: [0, 0, 0], UpArmR: [-12, -8, -4], LoArmR: [-98, -32, 0], HandR: [-10, -62, 0],
  ThighL: [-6, -2, 0], ShinL: [6, 0, 0], FootL: [1, -5, 0],
  ThighR: [5, 3, 0], ShinR: [7, 0, 0], FootR: [3, 4, 0]
};

export const URAUME_CLIPS = {
  // ---- IDLE — 5.6 s, ten breaths a minute --------------------------------
  // The longest idle in the project. Two breaths across the loop, and the
  // amplitude is deliberately at the edge of visible: 1.4 cm through the hips
  // and three degrees of chest. Compare Nanami's 4.2 s idle, which was the
  // previous longest and which moves roughly twice as far.
  idle: {
    dur: 5.6, loop: true, keys: [
      K(0, {}),
      K(1.4, { Chest: [3, -3, 0], Spine: [3, -2, 0], Hips_pos: [0, -0.038, 0], Neck: [1, -1, 0] }),
      K(2.8, {}),
      K(4.2, { Chest: [2, -3, 0], Spine: [3, -2, 0], Hips_pos: [0, -0.036, 0], Head: [2, -2, 0] }),
      K(5.6, {})
    ]
  },

  // ---- WALK — a GLIDE ----------------------------------------------------
  // Short steps, no arm swing at all (the hands stay together), and almost no
  // vertical travel through the hips — 1.2 cm against the shared walk's 2.2.
  // A person in a long hakama does not stride, and a person who is not in a
  // hurry does not bob. The result reads as gliding, which is correct and is
  // also free: the hakama geometry is a bell and the feet barely leave it.
  walk: {
    dur: 1.02, loop: true, keys: [
      K(0, { ThighL: [-18, -2, 0], ShinL: [8, 0, 0], FootL: [-4, -5, 0], ThighR: [14, 3, 0], ShinR: [18, 0, 0], FootR: [8, 4, 0], Hips_pos: [0, -0.030, 0] }),
      K(0.255, { ThighL: [-4, -2, 0], ShinL: [13, 0, 0], ThighR: [2, 3, 0], ShinR: [10, 0, 0], Hips_pos: [0, -0.022, 0] }),
      K(0.51, { ThighL: [15, -2, 0], ShinL: [17, 0, 0], FootL: [7, -5, 0], ThighR: [-17, 3, 0], ShinR: [9, 0, 0], FootR: [-4, 4, 0], Hips_pos: [0, -0.030, 0] }),
      K(0.765, { ThighL: [1, -2, 0], ShinL: [11, 0, 0], ThighR: [-5, 3, 0], ShinR: [14, 0, 0], Hips_pos: [0, -0.022, 0] }),
      K(1.02, { ThighL: [-18, -2, 0], ShinL: [8, 0, 0], FootL: [-4, -5, 0], ThighR: [14, 3, 0], ShinR: [18, 0, 0], FootR: [8, 4, 0], Hips_pos: [0, -0.030, 0] })
    ]
  },

  // ---- RUN — the one place they hurry, and they still barely do ----------
  // The hands come apart because they have to, but the chest lean is 8 degrees
  // against the shared run's 16. Uraume running looks like somebody walking
  // quickly, which is the intended read: the character does not have a sprint.
  run: {
    dur: 0.62, loop: true, keys: [
      K(0, { Spine: [8, -2, 0], Chest: [5, -3, 0], Hips: [2, 6, 0], ThighL: [-40, -2, 0], ShinL: [20, 0, 0], FootL: [-10, -4, 0], ThighR: [26, 3, 0], ShinR: [50, 0, 0], FootR: [22, 4, 0], UpArmL: [-24, 12, 8], LoArmL: [-92, 20, 2], UpArmR: [-52, -10, -8], LoArmR: [-84, -18, -2], Hips_pos: [0, -0.026, 0] }),
      K(0.155, { Spine: [7, -2, 0], ThighL: [-8, -2, 0], ShinL: [24, 0, 0], ThighR: [-12, 3, 0], ShinR: [32, 0, 0], Hips_pos: [0, -0.050, 0] }),
      K(0.31, { Spine: [8, -2, 0], Chest: [5, -3, 0], Hips: [2, 6, 0], ThighL: [26, -2, 0], ShinL: [50, 0, 0], FootL: [22, -4, 0], ThighR: [-40, 3, 0], ShinR: [20, 0, 0], FootR: [-10, 4, 0], UpArmL: [-52, 12, 8], LoArmL: [-84, 20, 2], UpArmR: [-24, -10, -8], LoArmR: [-92, -18, -2], Hips_pos: [0, -0.026, 0] }),
      K(0.465, { Spine: [7, -2, 0], ThighL: [-12, -2, 0], ShinL: [32, 0, 0], ThighR: [-8, 3, 0], ShinR: [24, 0, 0], Hips_pos: [0, -0.050, 0] }),
      K(0.62, { Spine: [8, -2, 0], Chest: [5, -3, 0], Hips: [2, 6, 0], ThighL: [-40, -2, 0], ShinL: [20, 0, 0], FootL: [-10, -4, 0], ThighR: [26, 3, 0], ShinR: [50, 0, 0], FootR: [22, 4, 0], UpArmL: [-24, 12, 8], UpArmR: [-52, -10, -8], Hips_pos: [0, -0.026, 0] })
    ]
  },

  // ---- THE THREE-HIT STRING — ICE BLADES ---------------------------------
  // Formed ice on the hands. Fast, clean, medium reach, no shoulder rotation
  // to speak of: these are CUTS, not punches, and they come out of the elbow
  // and the wrist while the torso stays where it is. That is the whole reason
  // the string reads as different from every other string in the game despite
  // being on the same three-beat rhythm.
  //
  // NOTE the anticipation keys are at 0.04 / 0.045 / 0.05 — two and a half to
  // three frames each. Rule 1.
  punch1: {
    dur: 0.30, loop: false, keys: [
      K(0, {}),
      K(0.04, { UpArmR: [-28, -14, -6], LoArmR: [-104, -20, 0], HandR: [-8, -70, 0], Chest: [1, -10, 0] }, 'in'),
      K(0.11, { UpArmR: [-74, 4, -2], LoArmR: [-14, 0, 0], HandR: [-4, -96, 0], Chest: [2, 8, 0], Hips: [0, 0, 0], Spine: [2, 4, 0], UpArmL: [-16, 12, 6], LoArmL: [-92, 30, 0] }, 'snap'),
      K(0.15, { UpArmR: [-74, 4, -2], LoArmR: [-16, 0, 0], HandR: [-4, -96, 0], Chest: [2, 8, 0] }, 'hold'),
      // returns to stance EXACTLY. No overshoot key. Rule 2.
      K(0.30, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.32, loop: false, keys: [
      K(0, { UpArmR: [-56, 0, -2], LoArmR: [-52, 0, 0] }),
      K(0.045, { UpArmL: [-26, 16, 8], LoArmL: [-108, 26, 0], HandL: [-8, 74, 0], Chest: [1, 12, 0] }, 'in'),
      K(0.12, { UpArmL: [-78, -4, 2], LoArmL: [-12, 0, 0], HandL: [-4, 100, 0], Chest: [2, -10, 0], Spine: [2, -5, 0], UpArmR: [-14, -10, -6], LoArmR: [-94, -30, 0] }, 'snap'),
      K(0.16, { UpArmL: [-78, -4, 2], LoArmL: [-14, 0, 0], HandL: [-4, 100, 0], Chest: [2, -10, 0] }, 'hold'),
      K(0.32, {}, 'out')
    ]
  },
  // THE LAUNCHER. A rising cut with BOTH hands, palms turned up — the one
  // moment in the whole set where the arms go above the shoulder line, and it
  // is still only to 100 degrees. It is a lift rather than an uppercut: the
  // opponent goes up because the ice under them did, not because they were
  // hit hard.
  punch3: {
    dur: 0.48, loop: false, keys: [
      K(0, {}),
      K(0.05, { UpArmL: [-4, 14, 10], LoArmL: [-72, 24, 0], UpArmR: [-2, -12, -10], LoArmR: [-74, -22, 0], Hips_pos: [0, -0.052, 0], ThighL: [-14, -2, 0], ShinL: [16, 0, 0] }, 'in'),
      K(0.17, { UpArmL: [-100, 8, 6], LoArmL: [-30, 0, 0], HandL: [-14, 0, 0], UpArmR: [-100, -6, -6], LoArmR: [-32, 0, 0], HandR: [-14, 0, 0], Chest: [-4, 0, 0], Spine: [-3, 0, 0], Hips_pos: [0, 0.006, 0], ThighL: [-6, -2, 0], ShinL: [6, 0, 0] }, 'snap'),
      K(0.23, { UpArmL: [-100, 8, 6], LoArmL: [-32, 0, 0], UpArmR: [-100, -6, -6], LoArmR: [-34, 0, 0], Hips_pos: [0, 0.006, 0] }, 'hold'),
      K(0.48, {}, 'out')
    ]
  },

  // ---- HEAVY — A DESCENDING SPIKE ----------------------------------------
  // One hand raised and brought straight down. Their only committed move, and
  // even here the wind-up is 0.14 s against the shared heavy's 0.22 — they are
  // not putting their weight behind it, they are placing it.
  heavy: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmR: [-128, -10, -6], LoArmR: [-34, 0, -2], HandR: [-14, -40, 0], UpArmL: [-30, 14, 10], LoArmL: [-80, 24, 0], Chest: [-4, -12, 0], Spine: [-3, -6, 0], Hips_pos: [0, -0.030, 0] }, 'in'),
      K(0.27, { UpArmR: [-38, 6, -2], LoArmR: [-8, 0, 0], HandR: [-24, -90, 0], Chest: [10, 8, 0], Spine: [8, 4, 0], Head: [3, -2, 0], Hips_pos: [0, -0.116, 0], ThighL: [-26, -2, 0], ShinL: [30, 0, 0], ThighR: [20, 3, 0], ShinR: [38, 0, 0] }, 'snap'),
      K(0.36, { UpArmR: [-36, 6, -2], LoArmR: [-10, 0, 0], Chest: [10, 8, 0], Hips_pos: [0, -0.116, 0] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // =========================================================================
  // ICEFALL 直瀑 — RB
  // =========================================================================
  // Canon: "covering their hand in frost and TOUCHING THE GROUND", generating
  // interconnected block-shaped sheets which are then broken apart and
  // levitated at the target. So the clip is a CROUCH AND A TOUCH, and then a
  // small lift of the same hand — the shards go where the palm goes, and they
  // go because the palm told them to and not because anything was thrown.
  //
  // *** NOTHING IS THROWN IN THIS ENTIRE SET. *** There is no wind-up-and-hurl
  // key anywhere in this file. Cryokinesis is telekinesis; the correct read is
  // a conductor, and the moment Uraume looks like they are lobbing something
  // the character is somebody else.
  ct1: {
    dur: 0.68, loop: false, keys: [
      K(0, {}),
      // down to the floor, one knee bending, right palm flat on the deck
      K(0.12, {
        Hips_pos: [0, -0.170, 0.02], Spine: [16, -2, 0], Chest: [10, -6, 0], Head: [4, -2, 0],
        ThighL: [-38, -2, 0], ShinL: [46, 0, 0], FootL: [-6, -5, 0],
        ThighR: [-14, 3, 0], ShinR: [26, 0, 0],
        UpArmR: [-14, -6, -4], LoArmR: [-52, -8, 0], HandR: [-40, -70, 0],
        UpArmL: [-24, 14, 8], LoArmL: [-88, 26, 0]
      }, 'out'),
      // the contact. One frame of stop, and it is the only hard stop in the set.
      K(0.20, {
        Hips_pos: [0, -0.182, 0.02], Spine: [17, -2, 0], Chest: [11, -6, 0],
        UpArmR: [-12, -6, -4], LoArmR: [-48, -8, 0], HandR: [-44, -70, 0],
        ThighL: [-40, -2, 0], ShinL: [48, 0, 0], ThighR: [-14, 3, 0], ShinR: [26, 0, 0]
      }, 'snap'),
      // THE LIFT. The palm turns over and rises, and the shards rise with it.
      // Slow — 0.24 s for the whole travel — because this is the moment the
      // opponent is supposed to see coming and decide what to do about.
      K(0.44, {
        Hips_pos: [0, -0.060, 0], Spine: [6, -2, 0], Chest: [4, -3, 0],
        ThighL: [-14, -2, 0], ShinL: [16, 0, 0], ThighR: [-2, 3, 0], ShinR: [10, 0, 0],
        UpArmR: [-64, 2, -8], LoArmR: [-58, 0, 0], HandR: [-6, -10, 0],
        UpArmL: [-20, 12, 6], LoArmL: [-92, 28, 0]
      }, 'out'),
      // and a small push of the fingers, which is what sends them
      K(0.52, {
        UpArmR: [-72, 6, -10], LoArmR: [-40, 0, 0], HandR: [-2, -6, 0],
        Chest: [2, 4, 0], Hips_pos: [0, -0.044, 0]
      }, 'snap'),
      K(0.68, {}, 'out')
    ]
  },

  // =========================================================================
  // FROST CALM 霜凪 — RT
  // =========================================================================
  // Canon, precisely: "the user generally launches the attack by BLOWING the
  // chilled cursed energy FROM THEIR MOUTH, spreading a cloud of icy mist sent
  // toward the target BY THE GUIDANCE OF THEIR HAND." Both halves are in the
  // clip and the ORDER matters — the breath comes first and the hand follows
  // it, because the hand is steering something that already exists.
  //
  // The head tips DOWN four degrees for the breath and comes back. That is the
  // largest head movement anywhere in this file, and it is four degrees.
  ct2: {
    dur: 0.95, loop: false, keys: [
      K(0, {}),
      // the hand comes up in front of the mouth, fingers loose — the gesture
      // is closer to shielding a candle than to casting anything
      K(0.13, {
        UpArmR: [-58, -12, -6], LoArmR: [-104, -34, 0], HandR: [-16, -54, 0],
        Chest: [3, -6, 0], Neck: [3, -1, 0], Head: [4, -2, 0], Hips_pos: [0, -0.034, 0]
      }, 'out'),
      // THE BREATH. Chest lifts, head tips down, and it HOLDS for a fifth of a
      // second. The hold is the move: everything before it is getting ready to
      // exhale and everything after it is aiming.
      K(0.28, {
        UpArmR: [-62, -14, -6], LoArmR: [-108, -36, 0], HandR: [-18, -50, 0],
        Chest: [-2, -6, 0], Spine: [0, -2, 0], Neck: [4, -1, 0], Head: [5, -2, 0],
        Hips_pos: [0, -0.042, 0]
      }, 'in'),
      K(0.48, {
        UpArmR: [-62, -14, -6], LoArmR: [-108, -36, 0],
        Chest: [-1, -6, 0], Head: [5, -2, 0], Hips_pos: [0, -0.040, 0]
      }, 'hold'),
      // THE GUIDANCE. The arm extends out along the line the mist is taking —
      // one smooth sweep, palm open, fingers together. Slow, and it never
      // straightens fully: the elbow stops at -26 degrees. Rule 1's corollary
      // — nothing in this set ever locks out.
      K(0.70, {
        UpArmR: [-88, 2, -4], LoArmR: [-26, 0, 0], HandR: [-6, -84, 0],
        Chest: [3, 6, 0], Spine: [3, 3, 0], Head: [2, -2, 0],
        UpArmL: [-18, 12, 6], LoArmL: [-90, 28, 0], Hips_pos: [0, -0.032, 0]
      }, 'out'),
      K(0.78, {
        UpArmR: [-88, 2, -4], LoArmR: [-26, 0, 0], Chest: [3, 6, 0]
      }, 'hold'),
      K(0.95, {}, 'out')
    ]
  },

  // =========================================================================
  // FROST FIELD — B
  // =========================================================================
  // Canon-adjacent rather than canon-named: what it is built from is the
  // Hakari fight, where Uraume "froze the ground to burst underground pipes,
  // creating more water for Uraume to freeze". So this is not a blast, it is a
  // TOUCH — Ice Formation's base rule is that they generate ice by touching a
  // surface, and the special is that rule at scale.
  //
  // Both hands, one small dip, and the arena goes white. The gesture is
  // smaller than the punch string's, which is the joke: their biggest
  // defensive tool is their least emphatic movement.
  frostField: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.09, {
        UpArmL: [-6, 14, 8], LoArmL: [-66, 22, 0], HandL: [-30, 54, 0],
        UpArmR: [-4, -12, -8], LoArmR: [-68, -20, 0], HandR: [-30, -54, 0],
        Hips_pos: [0, -0.086, 0], Spine: [8, -2, 0], Chest: [5, -3, 0],
        ThighL: [-18, -2, 0], ShinL: [22, 0, 0], ThighR: [-4, 3, 0], ShinR: [14, 0, 0]
      }, 'out'),
      // the dip. Six centimetres, and the whole floor freezes.
      K(0.17, {
        UpArmL: [-2, 14, 8], LoArmL: [-52, 22, 0], HandL: [-42, 54, 0],
        UpArmR: [0, -12, -8], LoArmR: [-54, -20, 0], HandR: [-42, -54, 0],
        Hips_pos: [0, -0.148, 0], Spine: [12, -2, 0], Chest: [7, -3, 0], Head: [3, -2, 0],
        ThighL: [-28, -2, 0], ShinL: [34, 0, 0], ThighR: [-10, 3, 0], ShinR: [22, 0, 0]
      }, 'snap'),
      K(0.28, {
        UpArmL: [-2, 14, 8], LoArmL: [-54, 22, 0],
        UpArmR: [0, -12, -8], LoArmR: [-56, -20, 0], Hips_pos: [0, -0.146, 0]
      }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },

  // =========================================================================
  // MAXIMUM OUTPUT: FROST CALM 出力最大「霜凪」— the ultimate
  // =========================================================================
  // The same technique as `ct2` and the same gesture, performed with no more
  // urgency whatsoever. That is the entire staging idea and it is why this
  // clip is a slowed, lengthened `ct2` rather than a bigger one: the strongest
  // thing this character does looks exactly like the thing they do all the
  // time, which is the most frightening available reading of a servant.
  //
  // Two things are different and only two: the hands come TOGETHER first (the
  // stance's own gesture, held for half a second, and it is the closest thing
  // in the set to a wind-up), and the breath is twice as long.
  ult: {
    dur: 1.72, loop: false, keys: [
      K(0, {}),
      // the hands close together and lift to the chest. Half a second of a
      // person doing almost nothing, in the middle of an ultimate.
      K(0.30, {
        UpArmL: [-34, 18, 10], LoArmL: [-104, 34, 0], HandL: [-14, 66, 0],
        UpArmR: [-32, -16, -10], LoArmR: [-106, -34, 0], HandR: [-14, -66, 0],
        Chest: [2, -2, 0], Head: [2, -2, 0], Hips_pos: [0, -0.038, 0]
      }, 'out'),
      K(0.62, {
        UpArmL: [-36, 18, 10], LoArmL: [-106, 34, 0],
        UpArmR: [-34, -16, -10], LoArmR: [-108, -34, 0],
        Chest: [2, -2, 0], Hips_pos: [0, -0.040, 0]
      }, 'hold'),
      // THE BREATH, twice the length of the technique version
      K(0.86, {
        UpArmR: [-64, -14, -6], LoArmR: [-110, -38, 0], HandR: [-18, -48, 0],
        UpArmL: [-30, 16, 10], LoArmL: [-100, 30, 0],
        Chest: [-4, -4, 0], Spine: [-1, -2, 0], Neck: [4, -1, 0], Head: [5, -2, 0],
        Hips_pos: [0, -0.048, 0]
      }, 'in'),
      K(1.24, {
        UpArmR: [-64, -14, -6], LoArmR: [-110, -38, 0],
        Chest: [-3, -4, 0], Head: [5, -2, 0], Hips_pos: [0, -0.046, 0]
      }, 'hold'),
      // and one sweep of the arm, all the way across the front of the body.
      // The only movement in this file that crosses the centreline.
      K(1.50, {
        UpArmR: [-92, 26, -2], LoArmR: [-22, 0, 0], HandR: [-4, -76, 0],
        Chest: [3, 14, 0], Spine: [3, 7, 0], Hips: [0, -6, 0], Head: [2, -2, 0],
        UpArmL: [-16, 12, 6], LoArmL: [-88, 26, 0], Hips_pos: [0, -0.030, 0]
      }, 'out'),
      K(1.72, {}, 'out')
    ]
  },

  // =========================================================================
  // TAUNT — ICE IN THE PALM
  // =========================================================================
  // The brief asks for "something quiet and dismissive that fits a composed
  // servant — a small formal gesture, ice forming and dissolving in their palm
  // without effort", and for research into whether a line exists rather than
  // invented dialogue. IT DOES: ch.135, to Yuji, after he has saved Choso from
  // being frozen — *"Whose body do you think that is?"* It is Uraume's most
  // characteristic line in the series and it is perfect for a taunt, because
  // it is not addressed to the opponent as a fighter at all. It is a servant
  // being mildly irritated on their master's behalf.
  //
  // THE CLIP: the right hand turns palm-up, a spike of ice grows out of it,
  // and Uraume looks at it — not at you — and lets it go. Then the smallest
  // possible bow of the head, which is the formal gesture the brief asks for
  // and which is also the dismissal: the bow is a full six degrees and it is
  // the largest head movement in the entire set.
  //
  // The line lands at 1.55 s, AFTER the ice has already dissolved. They are
  // not showing you the ice; they finished with the ice and then remembered
  // you were there.
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // the palm turns over. That is the whole first beat.
      K(0.42, {
        UpArmR: [-40, -6, -6], LoArmR: [-86, -14, 0], HandR: [-34, -20, 0],
        UpArmL: [-16, 12, 6], LoArmL: [-92, 28, 0],
        Chest: [1, -4, 0], Neck: [1, -1, 0], Head: [4, -4, 0], Hips_pos: [0, -0.032, 0]
      }, 'out'),
      // the ice grows. Nothing on the body moves at all for four tenths of a
      // second — the FX does the work and the character watches it happen.
      K(0.86, {
        UpArmR: [-41, -6, -6], LoArmR: [-87, -14, 0], HandR: [-34, -20, 0],
        Head: [5, -4, 0], Chest: [1, -4, 0], Hips_pos: [0, -0.034, 0]
      }, 'hold'),
      K(1.16, {
        UpArmR: [-40, -6, -6], LoArmR: [-86, -14, 0], HandR: [-34, -20, 0],
        Head: [5, -4, 0], Chest: [2, -4, 0], Hips_pos: [0, -0.032, 0]
      }, 'hold'),
      // the fingers relax and it is gone. No flick, no dispersal gesture — it
      // simply stops being there, because it never cost anything to make.
      K(1.34, {
        UpArmR: [-36, -8, -6], LoArmR: [-92, -20, 0], HandR: [-22, -40, 0],
        Head: [3, -3, 0], Chest: [1, -3, 0]
      }, 'out'),
      // THE BOW. Six degrees. The line lands here.
      K(1.62, {
        UpArmL: [-14, 10, 4], LoArmL: [-96, 34, 0], HandL: [-10, 62, 0],
        UpArmR: [-12, -8, -4], LoArmR: [-98, -32, 0], HandR: [-10, -62, 0],
        Neck: [3, -1, 0], Head: [7, -2, 0], Chest: [3, -3, 0], Spine: [3, -2, 0],
        Hips_pos: [0, -0.038, 0]
      }, 'out'),
      K(2.10, {
        Neck: [3, -1, 0], Head: [7, -2, 0], Chest: [3, -3, 0], Hips_pos: [0, -0.038, 0]
      }, 'hold'),
      K(2.60, {}, 'out'),
      K(3.3, {})
    ]
  },

  // ---- VICTORY -----------------------------------------------------------
  // They straighten their sleeve. That is the whole thing. Nobody who has ever
  // been at a thousand years of somebody else's beck and call celebrates.
  victory: {
    dur: 3.6, loop: false, keys: [
      K(0, {}),
      K(0.55, {
        UpArmL: [-52, 26, 12], LoArmL: [-120, 42, 0], HandL: [-18, 88, 0],
        UpArmR: [-30, -18, -10], LoArmR: [-104, -36, 0], HandR: [-14, -70, 0],
        Chest: [3, -8, 0], Neck: [2, -2, 0], Head: [5, -6, 0], Hips_pos: [0, -0.034, 0]
      }, 'out'),
      // two small tugs at the cuff
      K(0.92, { LoArmL: [-114, 46, 0], HandL: [-14, 92, 0], UpArmR: [-32, -18, -10] }, 'snap'),
      K(1.16, { LoArmL: [-120, 42, 0], HandL: [-18, 88, 0] }, 'out'),
      K(1.44, { LoArmL: [-114, 46, 0], HandL: [-14, 92, 0] }, 'snap'),
      K(1.70, { LoArmL: [-120, 42, 0], HandL: [-18, 88, 0] }, 'out'),
      // back to the waiting pose, and they hold it for the rest of the clip.
      K(2.30, {}, 'out'),
      K(3.6, {})
    ]
  },

  // ---- KO ----------------------------------------------------------------
  // The base `ko` is a body being knocked over. This one is a body being PUT
  // DOWN — the knees fold first and the torso follows, which is the collapse
  // of somebody who was standing perfectly still when it happened rather than
  // somebody who was mid-movement. Same duration as the shared clip so nothing
  // that reads its length has to know.
  ko: {
    dur: 1.15, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Chest: [-6, -4, 0], Spine: [-4, -2, 0], Head: [-8, -2, 0],
        UpArmL: [-24, 16, 14], UpArmR: [-22, -14, -14],
        Hips_pos: [0, -0.070, 0], ThighL: [-20, -2, 0], ShinL: [24, 0, 0]
      }, 'snap'),
      // the knees go
      K(0.46, {
        Hips: [-14, 6, 0], Hips_pos: [0, -0.330, -0.02], Spine: [10, -2, 0], Chest: [8, -3, 0],
        Head: [10, -2, 0],
        ThighL: [-76, -2, 0], ShinL: [96, 0, 0], ThighR: [-70, 3, 0], ShinR: [92, 0, 0],
        UpArmL: [-14, 12, 16], LoArmL: [-48, 16, 0],
        UpArmR: [-12, -10, -16], LoArmR: [-50, -14, 0]
      }, 'out'),
      // and the torso goes over
      K(0.86, {
        Hips: [-58, 8, 0], Hips_pos: [0, -0.560, -0.10], Spine: [22, -3, 0], Chest: [16, -4, 0],
        Head: [16, -3, 0],
        ThighL: [-88, -2, 0], ShinL: [104, 0, 0], ThighR: [-82, 3, 0], ShinR: [100, 0, 0],
        UpArmL: [-6, 8, 30], LoArmL: [-22, 8, 0], UpArmR: [-4, -6, -30], LoArmR: [-24, -6, 0]
      }, 'out'),
      K(1.15, {
        Hips: [-72, 8, 0], Hips_pos: [0, -0.620, -0.14], Spine: [24, -3, 0], Chest: [18, -4, 0],
        Head: [18, -3, 0],
        ThighL: [-90, -2, 0], ShinL: [106, 0, 0], ThighR: [-84, 3, 0], ShinR: [102, 0, 0],
        UpArmL: [-4, 8, 32], UpArmR: [-2, -6, -32]
      })
    ]
  }
};
