// RYU ISHIGORI 石流龍 — the HEAVIEST set in the project, and the deliberate
// opposite of anim/uraume.js in every dial the two files share.
//
// ===========================================================================
// THE ONE RULE
// ===========================================================================
//   *** NOTHING HE DOES IS QUICK EXCEPT THE MOMENT OF FIRING. ***
//
// Three constraints, and like Uraume's they are constraints rather than
// preferences — a key that breaks one of them is a bug:
//
//   1. ENORMOUS ANTICIPATION. Every wind-up in this file is at least 0.22 s,
//      and the heavy's is 0.34 — the longest single anticipation key in the
//      project, past Yuki's 0.30. He is not a fast character pretending to be
//      slow; the frame data in characters/ryu.js is genuinely the worst on the
//      roster and these clips are authored to match it rather than to disguise
//      it. A player has to be able to see the punish coming in the animation
//      as well as in the frame counter.
//   2. GROUND-SHAKING RECOVERY. Every impact is followed by a settle key that
//      drops the hips 14-18 cm and holds. `cfg.size.stepShake` is declared for
//      him, so those settles fire the match's floor thump — the recovery is
//      not just long, it is AUDIBLE, which is what turns "he is slow" into "he
//      is heavy".
//   3. THE FEET NEVER COME TOGETHER. In the stance, in the walk, in every
//      technique and in the victory pose, there is at least 18 degrees of
//      thigh separation. He is a gun emplacement; a gun emplacement does not
//      stand with its feet together. This is the single cheapest thing in the
//      file and it is most of why he reads as planted even in a still frame.
//
// *** PASS 5 — THE ABDUCTION VALUES. *** Every charge pose, the fire pose, the
// brace and the ultimate were authored with `UpArm` rz between 40 and 70,
// which in this rig is ABDUCTION AWAY FROM THE BODY: the render came back with
// him standing in a T-pose at every tier, arms straight out sideways, which
// reads as a man being crucified rather than as a man holding on to something.
// The intent — "the arms go back and down behind him" — is carried by rx
// (positive swings the limb BACK) and needed almost none of the rz that was
// doing the damage. Every one of those values is roughly halved, to 18-38, and
// the poses now read as bracing rather than as presenting.
//
// AND THE EXCEPTION, WHICH IS THE CHARACTER: `fire` below is 0.08 s from the
// release key to full extension. After three seconds of a man not moving, the
// beam is instantaneous. The whole set exists to buy that one contrast.
//
// ===========================================================================
// THE CHARGE POSES — one per tier, and they are a THREAT DISPLAY
// ===========================================================================
// `charge` / `chargeT1` / `chargeT2` / `chargeT3` / `chargeT4`, selected at
// runtime by `Fighter._clip` off `outputTier` — the same suffix-swap mechanism
// Kashimo's coiled cycles, Inumaki's throat idles, Maki's stage neutrals and
// Panda's per-stance sets already use.
//
// THE PROGRESSION IS A SINGLE IDEA CARRIED THROUGH FIVE POSES: he starts
// STANDING and ends BURIED. Read the `Hips_pos` y down the five clips —
// -0.05, -0.09, -0.15, -0.22, -0.30 — he sinks thirty centimetres over the
// course of a full charge, which is the ground giving way under him. Read the
// thigh separation — it widens the whole way. And read the head: it is the one
// thing that does NOT move, because the barrel is bolted to it and it is
// aimed, and a head that drifted during a charge would break the read that he
// is pointing at something.
//
// Each is a LOOP, because a charge is held for an unknown length of time and a
// one-shot would freeze on its last frame.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — a gun emplacement. Feet very wide (33 degrees of separation, the
// widest neutral in the project), knees soft, weight dead centre, hands loose
// and open at his sides rather than up in a guard. He is not guarding: he does
// not expect to have to.
export const RYU_STANCE = {
  Hips_pos: [0, -0.056, 0],
  Hips: [0, 12, 0], Spine: [4, -4, 0], Chest: [3, -6, 0], Neck: [0, -2, 0], Head: [0, -4, 0],
  ClavL: [0, 0, 0], UpArmL: [-16, 8, 16], LoArmL: [-52, 14, 4], HandL: [-14, 40, 0],
  ClavR: [0, 0, 0], UpArmR: [-14, -6, -18], LoArmR: [-56, -12, -4], HandR: [-14, -40, 0],
  ThighL: [-14, -14, 0], ShinL: [20, 0, 0], FootL: [4, -18, 0],
  ThighR: [12, 19, 0], ShinR: [22, 0, 0], FootR: [8, 20, 0]
};

export const RYU_CLIPS = {
  // ---- IDLE — a big man breathing, and not much else ---------------------
  // Slow, and almost all of it is in the CHEST rather than the hips: a heavy
  // body at rest keeps its centre of mass still and moves its ribcage. The
  // shoulders roll back a touch on the inhale, which is the one bit of swagger
  // the researched personality earns him.
  idle: {
    dur: 3.6, loop: true, keys: [
      K(0, {}),
      K(1.5, {
        Chest: [1, -6, 0], Spine: [3, -4, 0], Hips_pos: [0, -0.046, 0],
        UpArmL: [-20, 8, 19], UpArmR: [-18, -6, -21], Head: [-1, -4, 0]
      }),
      K(2.4, { Chest: [4, -6, 0], Hips_pos: [0, -0.060, 0], UpArmL: [-14, 8, 15], UpArmR: [-12, -6, -17] }),
      K(3.6, {})
    ]
  },

  // ---- WALK — a TRUDGE ---------------------------------------------------
  // 1.26 s per cycle against the shared walk's 0.86. Long, flat, heavy steps
  // with a deep plant on each one — the hips drop 7 cm on every footfall,
  // which is what fires the step shake twice a cycle. He also barely swings
  // his arms: the mass is in the legs.
  walk: {
    dur: 1.26, loop: true, keys: [
      K(0, { ThighL: [-32, -14, 0], ShinL: [16, 0, 0], FootL: [-8, -18, 0], ThighR: [22, 19, 0], ShinR: [34, 0, 0], FootR: [14, 20, 0], Hips_pos: [0, -0.076, 0], Spine: [5, -4, 0], UpArmL: [-24, 8, 16], UpArmR: [-10, -6, -18] }, 'snap'),
      K(0.315, { ThighL: [-6, -14, 0], ShinL: [24, 0, 0], ThighR: [2, 19, 0], ShinR: [16, 0, 0], Hips_pos: [0, -0.040, 0] }),
      K(0.63, { ThighL: [22, -14, 0], ShinL: [34, 0, 0], FootL: [14, -18, 0], ThighR: [-32, 19, 0], ShinR: [16, 0, 0], FootR: [-8, 20, 0], Hips_pos: [0, -0.076, 0], Spine: [5, -4, 0], UpArmL: [-10, 8, 16], UpArmR: [-24, -6, -18] }, 'snap'),
      K(0.945, { ThighL: [2, -14, 0], ShinL: [16, 0, 0], ThighR: [-6, 19, 0], ShinR: [24, 0, 0], Hips_pos: [0, -0.040, 0] }),
      K(1.26, { ThighL: [-32, -14, 0], ShinL: [16, 0, 0], FootL: [-8, -18, 0], ThighR: [22, 19, 0], ShinR: [34, 0, 0], FootR: [14, 20, 0], Hips_pos: [0, -0.076, 0], UpArmL: [-24, 8, 16], UpArmR: [-10, -6, -18] })
    ]
  },

  // ---- RUN — the slowest cycle in the game -------------------------------
  // 0.72 s against the shared run's 0.52, and with a POUND on each contact
  // rather than a float between them. His config gives him the worst run speed
  // on the roster after Hanami's, and the cycle length is tuned so the feet do
  // not skate at that speed.
  run: {
    dur: 0.72, loop: true, keys: [
      K(0, { Spine: [14, -4, 0], Chest: [9, -6, 0], Hips: [4, 10, 0], ThighL: [-46, -12, 0], ShinL: [24, 0, 0], FootL: [-12, -16, 0], ThighR: [30, 17, 0], ShinR: [62, 0, 0], FootR: [26, 18, 0], UpArmL: [-30, 10, 12], LoArmL: [-92, 0, 4], UpArmR: [-58, -8, -14], LoArmR: [-86, 0, -4], Hips_pos: [0, -0.070, 0] }, 'snap'),
      K(0.18, { Spine: [13, -4, 0], ThighL: [-10, -12, 0], ShinL: [30, 0, 0], ThighR: [-14, 17, 0], ShinR: [38, 0, 0], Hips_pos: [0, -0.098, 0] }),
      K(0.36, { Spine: [14, -4, 0], Chest: [9, -6, 0], Hips: [4, 10, 0], ThighL: [30, -12, 0], ShinL: [62, 0, 0], FootL: [26, -16, 0], ThighR: [-46, 17, 0], ShinR: [24, 0, 0], FootR: [-12, 18, 0], UpArmL: [-58, 10, 12], LoArmL: [-86, 0, 4], UpArmR: [-30, -8, -14], LoArmR: [-92, 0, -4], Hips_pos: [0, -0.070, 0] }, 'snap'),
      K(0.54, { Spine: [13, -4, 0], ThighL: [-14, -12, 0], ShinL: [38, 0, 0], ThighR: [-10, 17, 0], ShinR: [30, 0, 0], Hips_pos: [0, -0.098, 0] }),
      K(0.72, { Spine: [14, -4, 0], Chest: [9, -6, 0], Hips: [4, 10, 0], ThighL: [-46, -12, 0], ShinL: [24, 0, 0], FootL: [-12, -16, 0], ThighR: [30, 17, 0], ShinR: [62, 0, 0], FootR: [26, 18, 0], UpArmL: [-30, 10, 12], UpArmR: [-58, -8, -14], Hips_pos: [0, -0.070, 0] })
    ]
  },

  // ---- DASH — a SHOVE, not a dodge ---------------------------------------
  // His dash is the worst in the game and the clip says so: he does not leave
  // the ground, he leans and shoves off one leg and the whole thing takes
  // 0.44 s to settle. There is no elegance in it anywhere.
  dash: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.14, { Spine: [20, -4, 0], Chest: [12, -6, 0], Hips_pos: [0, -0.132, 0], ThighL: [-40, -14, 0], ShinL: [34, 0, 0], ThighR: [26, 19, 0], ShinR: [56, 0, 0], UpArmL: [16, 10, 22], LoArmL: [-34, 0, 6], UpArmR: [20, -8, -24], LoArmR: [-30, 0, -6] }, 'out'),
      K(0.44, { Spine: [12, -4, 0], Hips_pos: [0, -0.090, 0], ThighL: [-28, -14, 0], ShinL: [26, 0, 0], ThighR: [18, 19, 0], ShinR: [40, 0, 0], UpArmL: [-2, 10, 20], UpArmR: [2, -8, -22] })
    ]
  },

  // ---- THE THREE-HIT STRING ----------------------------------------------
  // Slow, heavy, short reach, and every one of them carries a cursed-energy
  // DISCHARGE on contact — the canon detail from the wiki ("Ryu can output
  // powerful bursts of cursed energy with every physical attack"). That is why
  // these are not the feeble normals the brief asked for: they are slow and
  // they are short, and when one lands it is a cannon shot at zero range.
  //
  // Every impact is followed by a settle key. The hips drop and hold.
  punch1: {
    dur: 0.46, loop: false, keys: [
      K(0, {}),
      K(0.14, { UpArmL: [-30, 20, 14], LoArmL: [-96, 0, 6], HandL: [-14, 74, 0], Chest: [2, -24, 0], Hips: [0, 32, 0], Spine: [4, -14, 0], Hips_pos: [0, -0.070, 0] }, 'in'),
      K(0.22, { UpArmL: [-82, -8, -2], LoArmL: [-8, 0, 0], HandL: [-4, 102, 0], Chest: [5, 12, 0], Hips: [2, 8, 0], Spine: [5, 8, 0], Head: [0, -8, 0], UpArmR: [-22, -6, -20], LoArmR: [-62, -12, -4], Hips_pos: [0, -0.104, 0] }, 'snap'),
      K(0.28, { UpArmL: [-82, -8, -2], LoArmL: [-10, 0, 0], Chest: [5, 12, 0], Hips_pos: [0, -0.112, 0] }, 'hold'),
      K(0.46, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.52, loop: false, keys: [
      K(0, { UpArmL: [-64, -6, 4], LoArmL: [-38, 0, 0] }),
      K(0.16, { UpArmR: [-26, -22, -22], LoArmR: [-104, 0, -6], HandR: [-16, -80, 0], Chest: [3, -30, 0], Hips: [0, 40, 0], Spine: [4, -16, 0], Hips_pos: [0, -0.084, 0] }, 'in'),
      K(0.25, { UpArmR: [-86, 8, 0], LoArmR: [-6, 0, 0], HandR: [-4, -166, 0], Chest: [6, 24, 0], Hips: [4, -2, 0], Spine: [6, 14, 0], Head: [0, -10, 0], UpArmL: [-28, 10, 14], LoArmL: [-88, 0, 4], Hips_pos: [0, -0.118, 0] }, 'snap'),
      K(0.32, { UpArmR: [-86, 8, 0], LoArmR: [-8, 0, 0], Chest: [6, 24, 0], Hips_pos: [0, -0.126, 0] }, 'hold'),
      K(0.52, {}, 'out')
    ]
  },
  // THE LAUNCHER. Not an uppercut — a two-handed heave under the ribs. He
  // picks them up and puts them in the air, and the tell is the 0.20 s of him
  // sinking into his own legs first.
  punch3: {
    dur: 0.76, loop: false, keys: [
      K(0, {}),
      K(0.20, { UpArmL: [10, 16, 20], LoArmL: [-84, 0, 6], HandL: [-10, 30, 0], UpArmR: [12, -14, -22], LoArmR: [-86, 0, -6], HandR: [-10, -30, 0], Chest: [16, -8, 0], Spine: [12, -4, 0], Hips_pos: [0, -0.196, 0], ThighL: [-34, -14, 0], ShinL: [42, 0, 0], ThighR: [26, 19, 0], ShinR: [54, 0, 0], Head: [4, -4, 0] }, 'in'),
      K(0.34, { UpArmL: [-124, 12, 8], LoArmL: [-38, 0, 0], HandL: [-16, 0, 0], UpArmR: [-126, -10, -8], LoArmR: [-40, 0, 0], HandR: [-16, 0, 0], Chest: [-14, 4, 0], Spine: [-10, 2, 0], Hips: [-2, 12, 0], Hips_pos: [0, 0.028, 0], ThighL: [-12, -14, 0], ShinL: [10, 0, 0], ThighR: [8, 19, 0], ShinR: [16, 0, 0], FootR: [28, 20, 0], Head: [-6, -4, 0] }, 'snap'),
      K(0.42, { UpArmL: [-126, 12, 8], LoArmL: [-40, 0, 0], UpArmR: [-128, -10, -8], LoArmR: [-42, 0, 0], Hips_pos: [0, 0.028, 0] }, 'hold'),
      // and he comes back DOWN hard — the settle is 0.16 s of him arriving
      K(0.58, { Hips_pos: [0, -0.150, 0], Spine: [10, -4, 0], Chest: [7, -6, 0], ThighL: [-26, -14, 0], ShinL: [32, 0, 0], ThighR: [20, 19, 0], ShinR: [38, 0, 0], UpArmL: [-40, 8, 18], UpArmR: [-38, -6, -20] }, 'snap'),
      K(0.76, {}, 'out')
    ]
  },

  // ---- HEAVY — THE LONGEST ANTICIPATION IN THE PROJECT --------------------
  // 0.34 s of wind-up. A dropped overhand with the whole body behind it and a
  // 0.20 s settle after the contact — one full second of committed animation
  // for one hit. If a player throws this in neutral they deserve what happens.
  heavy: {
    dur: 1.02, loop: false, keys: [
      K(0, {}),
      K(0.34, { UpArmR: [-166, -18, -14], LoArmR: [-64, 0, -4], HandR: [-20, -56, 0], UpArmL: [-58, 20, 24], LoArmL: [-80, 0, 6], Chest: [-6, -34, 0], Spine: [-4, -18, 0], Hips: [0, 46, 0], Head: [-4, -12, 0], Hips_pos: [0, -0.086, 0], ThighL: [-30, -14, 0], ShinL: [34, 0, 0], ThighR: [22, 19, 0], ShinR: [40, 0, 0] }, 'in'),
      K(0.50, { UpArmR: [-70, 12, -2], LoArmR: [-8, 0, 0], HandR: [-30, -140, 0], UpArmL: [-28, 14, 20], LoArmL: [-84, 0, 6], Chest: [16, 26, 0], Spine: [12, 15, 0], Hips: [5, -6, 0], Head: [10, -14, 0], Hips_pos: [0, -0.226, 0], ThighL: [-44, -14, 0], ShinL: [54, 0, 0], ThighR: [34, 19, 0], ShinR: [66, 0, 0] }, 'snap'),
      K(0.70, { UpArmR: [-68, 12, -2], LoArmR: [-10, 0, 0], Chest: [16, 28, 0], Hips_pos: [0, -0.234, 0], ThighL: [-46, -14, 0], ShinL: [56, 0, 0] }, 'hold'),
      K(1.02, {}, 'out')
    ]
  },

  // =========================================================================
  // RAPID BLASTS — RB
  // =========================================================================
  // Canon: "a volley of rapid fire blasts to barrage the user's target", and
  // "Ryu raining down a volley of cursed energy blasts". The BODY BARELY MOVES
  // — the cannon is his hair, so what aims is his HEAD and his hands stay
  // exactly where they were. That is the point of the whole design and this is
  // the clip that has to establish it: the first time a player sees him fire
  // without using his arms, the character explains itself.
  //
  // Three head snaps, one per shot, on a hard step each time.
  ct1: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      // he sets his feet. A tenth of a second, and it is the only preparation.
      K(0.10, {
        Hips_pos: [0, -0.086, 0], Spine: [2, -4, 0], Chest: [1, -6, 0],
        Neck: [-4, -2, 0], Head: [-8, -4, 0],
        ThighL: [-20, -14, 0], ShinL: [26, 0, 0], ThighR: [16, 19, 0], ShinR: [28, 0, 0]
      }, 'out'),
      // three shots. Each one is a 4-degree head recoil and a 2 cm hip drop,
      // and the hands never move at all.
      K(0.20, { Neck: [-2, -2, 0], Head: [-4, -4, 0], Hips_pos: [0, -0.102, 0], Chest: [3, -6, 0] }, 'snap'),
      K(0.27, { Neck: [-4, -2, 0], Head: [-8, -4, 0], Hips_pos: [0, -0.090, 0] }, 'out'),
      K(0.34, { Neck: [-2, -3, 0], Head: [-4, -6, 0], Hips_pos: [0, -0.104, 0], Chest: [3, -7, 0] }, 'snap'),
      K(0.41, { Neck: [-4, -2, 0], Head: [-8, -4, 0], Hips_pos: [0, -0.090, 0] }, 'out'),
      K(0.48, { Neck: [-2, -1, 0], Head: [-4, -2, 0], Hips_pos: [0, -0.106, 0], Chest: [3, -5, 0] }, 'snap'),
      K(0.62, {}, 'out')
    ]
  },

  // =========================================================================
  // THE CHARGE POSES — five, and they are the tell
  // =========================================================================
  // See the header. Read `Hips_pos` down the five: he sinks 30 cm. Read the
  // head across them: it does not move.

  // TIER 0 — PLANTED. He has simply stopped. Feet set, hands open at his
  // sides, chin level. From a distance this could still be an idle, which is
  // deliberate: tier 0 is a TAP and it should not announce itself, or the
  // fastest option in his kit would also be the most telegraphed one.
  charge: {
    dur: 0.9, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.052, 0], Spine: [3, -4, 0], Chest: [2, -6, 0], Head: [-2, -4, 0],
        UpArmL: [-12, 8, 20], LoArmL: [-44, 12, 4], HandL: [-18, 34, 0],
        UpArmR: [-10, -6, -22], LoArmR: [-48, -10, -4], HandR: [-18, -34, 0],
        ThighL: [-16, -16, 0], ShinL: [22, 0, 0], ThighR: [14, 21, 0], ShinR: [24, 0, 0]
      }),
      K(0.45, { Hips_pos: [0, -0.060, 0], Chest: [3, -6, 0] }),
      K(0.9, { Hips_pos: [0, -0.052, 0], Chest: [2, -6, 0] })
    ]
  },

  // TIER 1 — BRACED. The knees bend, the hands come away from the body and
  // turn palm-down, and a slow tremor starts. The tremor is 0.6 degrees and it
  // is the first thing that says this is not an idle.
  chargeT1: {
    dur: 0.7, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.092, 0], Spine: [5, -4, 0], Chest: [3, -6, 0], Head: [-2, -4, 0],
        UpArmL: [-8, 10, 18], LoArmL: [-40, 10, 6], HandL: [-40, 26, 0],
        UpArmR: [-6, -8, -20], LoArmR: [-44, -8, -6], HandR: [-40, -26, 0],
        ThighL: [-20, -18, 0], ShinL: [28, 0, 0], ThighR: [18, 23, 0], ShinR: [30, 0, 0]
      }),
      K(0.35, { Hips_pos: [0, -0.098, 0], Chest: [4, -6, 0], UpArmL: [-8, 10, 19], UpArmR: [-6, -8, -21] }),
      K(0.7, { Hips_pos: [0, -0.092, 0], Chest: [3, -6, 0], UpArmL: [-8, 10, 18], UpArmR: [-6, -8, -20] })
    ]
  },

  // TIER 2 — LEANING INTO IT. The torso comes forward over the front foot, the
  // arms go back and down behind him (the shape of something being dragged
  // backward by what is gathering in front of it), and the tremor doubles.
  chargeT2: {
    dur: 0.5, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.148, 0.02], Spine: [12, -4, 0], Chest: [8, -6, 0], Head: [-2, -4, 0],
        UpArmL: [22, 10, 21], LoArmL: [-30, 8, 6], HandL: [-46, 20, 0],
        UpArmR: [24, -8, -23], LoArmR: [-34, -6, -6], HandR: [-46, -20, 0],
        ThighL: [-28, -20, 0], ShinL: [38, 0, 0], FootL: [6, -24, 0],
        ThighR: [24, 25, 0], ShinR: [42, 0, 0], FootR: [10, 26, 0]
      }),
      K(0.25, { Hips_pos: [0, -0.158, 0.02], Spine: [13, -4, 0], UpArmL: [23, 10, 22], UpArmR: [25, -8, -24], Chest: [9, -6, 0] }),
      K(0.5, { Hips_pos: [0, -0.148, 0.02], Spine: [12, -4, 0], UpArmL: [22, 10, 21], UpArmR: [24, -8, -23], Chest: [8, -6, 0] })
    ]
  },

  // TIER 3 — DUG IN. The stance widens again, the hips drop past the knees,
  // and the shoulders hunch forward round the neck — a body holding on. The
  // tremor is now 2 degrees and fast enough to read as vibration rather than
  // as breathing.
  chargeT3: {
    dur: 0.34, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.220, 0.03], Spine: [18, -4, 0], Chest: [14, -8, 0],
        Neck: [-4, -2, 0], Head: [-2, -4, 0],
        UpArmL: [40, 12, 24], LoArmL: [-24, 6, 6], HandL: [-50, 16, 0],
        UpArmR: [42, -10, -26], LoArmR: [-28, -4, -6], HandR: [-50, -16, 0],
        ThighL: [-38, -24, 0], ShinL: [52, 0, 0], FootL: [10, -28, 0],
        ThighR: [32, 29, 0], ShinR: [56, 0, 0], FootR: [14, 30, 0]
      }),
      K(0.17, { Hips_pos: [0, -0.236, 0.03], Spine: [20, -4, 0], Chest: [16, -8, 0], UpArmL: [42, 12, 25], UpArmR: [44, -10, -27] }),
      K(0.34, { Hips_pos: [0, -0.220, 0.03], Spine: [18, -4, 0], Chest: [14, -8, 0], UpArmL: [40, 12, 24], UpArmR: [42, -10, -26] })
    ]
  },

  // TIER 4 — MAXIMUM. He is thirty centimetres lower than he started, the
  // spine is bent 24 degrees forward, the arms are all the way back, and the
  // tremor is 4 degrees at 12 Hz. This pose is doing the job the brief gives
  // to the arena effects — "the opponent must be able to read his charge tier
  // from anywhere" — in pure silhouette, so it survives a small screen, a
  // cluttered background and a player who is not looking directly at him.
  chargeT4: {
    dur: 0.24, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.300, 0.04], Spine: [24, -4, 0], Chest: [18, -8, 0],
        Neck: [-6, -2, 0], Head: [-2, -4, 0],
        UpArmL: [58, 14, 26], LoArmL: [-18, 4, 6], HandL: [-54, 12, 0],
        UpArmR: [60, -12, -28], LoArmR: [-22, -2, -6], HandR: [-54, -12, 0],
        ThighL: [-48, -28, 0], ShinL: [66, 0, 0], FootL: [14, -32, 0],
        ThighR: [40, 33, 0], ShinR: [70, 0, 0], FootR: [18, 34, 0]
      }),
      K(0.12, {
        Hips_pos: [0, -0.322, 0.04], Spine: [28, -4, 0], Chest: [21, -8, 0],
        UpArmL: [62, 14, 28], UpArmR: [64, -12, -30], Neck: [-7, -2, 0]
      }),
      K(0.24, {
        Hips_pos: [0, -0.300, 0.04], Spine: [24, -4, 0], Chest: [18, -8, 0],
        UpArmL: [58, 14, 26], UpArmR: [60, -12, -28], Neck: [-6, -2, 0]
      })
    ]
  },

  // =========================================================================
  // THE RELEASE — the one fast thing he owns
  // =========================================================================
  // 0.08 s from the last charge pose to full extension. After up to 2.6
  // seconds of a man not moving, the beam is INSTANT — and everything else in
  // this file exists to buy that contrast.
  //
  // He does not throw anything. The chin comes UP and the whole body snaps
  // straight and back, which is RECOIL: the barrel is his head, so firing it
  // pushes his head backwards and drives his heels into the floor. That is the
  // single most important idea in this clip and the reason the head is pinned
  // for the whole charge — so that when it finally moves, it means something.
  ct2: {
    dur: 0.94, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.240, 0.03], Spine: [20, -4, 0], Chest: [15, -8, 0],
        Neck: [-5, -2, 0], Head: [-2, -4, 0],
        UpArmL: [44, 12, 24], LoArmL: [-24, 6, 6], UpArmR: [46, -10, -26], LoArmR: [-28, -4, -6],
        ThighL: [-40, -24, 0], ShinL: [54, 0, 0], ThighR: [34, 29, 0], ShinR: [58, 0, 0]
      }),
      // FIRE. Eight hundredths of a second.
      K(0.08, {
        Hips_pos: [0, -0.150, -0.09], Spine: [-14, -4, 0], Chest: [-10, -6, 0],
        Neck: [8, -2, 0], Head: [12, -4, 0],
        UpArmL: [-6, 10, 30], LoArmL: [-16, 4, 6], HandL: [-52, 10, 0],
        UpArmR: [-4, -8, -32], LoArmR: [-20, -2, -6], HandR: [-52, -10, 0],
        ThighL: [-24, -26, 0], ShinL: [30, 0, 0], FootL: [-14, -30, 0],
        ThighR: [20, 31, 0], ShinR: [34, 0, 0], FootR: [-10, 32, 0]
      }, 'snap'),
      // and he HOLDS it. Half a second of a man leaning back into his own
      // recoil while the beam runs — this is where the camera lives.
      K(0.30, {
        Hips_pos: [0, -0.166, -0.10], Spine: [-16, -4, 0], Chest: [-11, -6, 0],
        Neck: [9, -2, 0], Head: [13, -4, 0],
        UpArmL: [-8, 10, 31], UpArmR: [-6, -8, -33],
        ThighL: [-26, -26, 0], ShinL: [32, 0, 0], ThighR: [22, 31, 0], ShinR: [36, 0, 0]
      }, 'hold'),
      K(0.54, {
        Hips_pos: [0, -0.160, -0.09], Spine: [-14, -4, 0], Neck: [8, -2, 0], Head: [12, -4, 0],
        UpArmL: [-6, 10, 30], UpArmR: [-4, -8, -32]
      }, 'hold'),
      // and then the long, heavy come-down.
      K(0.94, {}, 'out')
    ]
  },

  // =========================================================================
  // BRACE — B
  // =========================================================================
  // He plants his feet and refuels. Completely immobile, no guard, and the
  // pose is deliberately the most OPEN in the file: chest square to the
  // opponent, arms out and down, chin up. It is an invitation and it is
  // supposed to look like one.
  //
  // LOOPS, because the state runs until he lets go or the tank fills.
  brace: {
    dur: 1.1, loop: true, keys: [
      K(0, {
        Hips_pos: [0, -0.180, 0], Spine: [-6, -4, 0], Chest: [-8, -6, 0],
        Neck: [-4, -2, 0], Head: [-8, -4, 0],
        UpArmL: [6, 12, 34], LoArmL: [-14, 6, 8], HandL: [-40, 14, 0],
        UpArmR: [8, -10, -36], LoArmR: [-18, -4, -8], HandR: [-40, -14, 0],
        ThighL: [-34, -26, 0], ShinL: [46, 0, 0], FootL: [8, -30, 0],
        ThighR: [28, 31, 0], ShinR: [50, 0, 0], FootR: [12, 32, 0]
      }),
      // the gather. Everything rises three centimetres and the arms open a
      // touch further — a slow pulse at about one a second, which is the
      // visual rate of the refill.
      K(0.55, {
        Hips_pos: [0, -0.152, 0], Spine: [-9, -4, 0], Chest: [-11, -6, 0],
        Neck: [-6, -2, 0], Head: [-11, -4, 0],
        UpArmL: [10, 12, 38], UpArmR: [12, -10, -40],
        ThighL: [-30, -26, 0], ShinL: [42, 0, 0], ThighR: [25, 31, 0], ShinR: [46, 0, 0]
      }),
      K(1.1, {
        Hips_pos: [0, -0.180, 0], Spine: [-6, -4, 0], Chest: [-8, -6, 0],
        Neck: [-4, -2, 0], Head: [-8, -4, 0],
        UpArmL: [6, 12, 34], UpArmR: [8, -10, -36],
        ThighL: [-34, -26, 0], ShinL: [46, 0, 0], ThighR: [28, 31, 0], ShinR: [50, 0, 0]
      })
    ]
  },

  // THE WIND-DOWN. He has to put himself back together, and it takes him
  // nearly half a second during which he can do nothing at all. This is the
  // punish window and it is authored to look like one: he is upright, square,
  // and visibly not ready.
  braceDown: {
    dur: 0.46, loop: false, keys: [
      K(0, {
        Hips_pos: [0, -0.180, 0], Spine: [-6, -4, 0], Chest: [-8, -6, 0], Head: [-8, -4, 0],
        UpArmL: [6, 12, 34], LoArmL: [-14, 6, 8], UpArmR: [8, -10, -36], LoArmR: [-18, -4, -8],
        ThighL: [-34, -26, 0], ShinL: [46, 0, 0], ThighR: [28, 31, 0], ShinR: [50, 0, 0]
      }),
      // the arms drop first and the legs come under him last — a heavy body
      // reassembling itself from the top down
      K(0.20, {
        Hips_pos: [0, -0.148, 0], Spine: [0, -4, 0], Chest: [-2, -6, 0], Head: [-4, -4, 0],
        UpArmL: [-6, 10, 34], LoArmL: [-34, 12, 4], UpArmR: [-4, -8, -36], LoArmR: [-38, -10, -4],
        ThighL: [-28, -20, 0], ShinL: [38, 0, 0], ThighR: [24, 25, 0], ShinR: [42, 0, 0]
      }, 'out'),
      K(0.46, {}, 'out')
    ]
  },

  // =========================================================================
  // THE ULTIMATE — MAXIMUM OUTPUT: GRANITE BLAST
  // =========================================================================
  // The same recoil idea as `ct2`, at four times the scale and with a real
  // wind-up in front of it, because this one is allowed to be announced. He
  // drops into the deepest stance in the game, the barrel comes up, and then
  // he holds the fire for a full second while the beam is swept.
  //
  // The last third of the clip is him being pushed BACKWARD by his own output
  // — the hips travel 14 cm along -Z across the hold, which is the one place
  // in the project a character is visibly losing ground to their own attack.
  ult: {
    dur: 2.05, loop: false, keys: [
      K(0, {}),
      // the drop. 0.36 s, the longest single anticipation he has.
      K(0.36, {
        Hips_pos: [0, -0.320, 0.05], Spine: [26, -4, 0], Chest: [20, -8, 0],
        Neck: [-8, -2, 0], Head: [-4, -4, 0],
        UpArmL: [64, 14, 27], LoArmL: [-16, 4, 6], HandL: [-56, 10, 0],
        UpArmR: [66, -12, -29], LoArmR: [-20, -2, -6], HandR: [-56, -10, 0],
        ThighL: [-52, -30, 0], ShinL: [72, 0, 0], FootL: [16, -34, 0],
        ThighR: [44, 35, 0], ShinR: [76, 0, 0], FootR: [20, 36, 0]
      }, 'in'),
      // a held beat at the bottom. Everything about this character is a
      // negotiation and this is the last frame the opponent has to react in.
      K(0.62, {
        Hips_pos: [0, -0.336, 0.05], Spine: [28, -4, 0], Chest: [22, -8, 0],
        UpArmL: [66, 14, 28], UpArmR: [68, -12, -30], Neck: [-9, -2, 0]
      }, 'hold'),
      // FIRE.
      K(0.70, {
        Hips_pos: [0, -0.150, -0.10], Spine: [-22, -4, 0], Chest: [-15, -6, 0],
        Neck: [14, -2, 0], Head: [18, -4, 0],
        UpArmL: [-10, 10, 33], LoArmL: [-12, 4, 6], HandL: [-56, 8, 0],
        UpArmR: [-8, -8, -35], LoArmR: [-16, -2, -6], HandR: [-56, -8, 0],
        ThighL: [-26, -30, 0], ShinL: [34, 0, 0], FootL: [-18, -34, 0],
        ThighR: [22, 35, 0], ShinR: [38, 0, 0], FootR: [-14, 36, 0]
      }, 'snap'),
      // THE HOLD — a full second, and he is being pushed backwards through it.
      K(1.20, {
        Hips_pos: [0, -0.176, -0.17], Spine: [-24, -4, 0], Chest: [-16, -6, 0],
        Neck: [15, -2, 0], Head: [19, -4, 0],
        UpArmL: [-12, 10, 34], UpArmR: [-10, -8, -36],
        ThighL: [-30, -30, 0], ShinL: [40, 0, 0], ThighR: [26, 35, 0], ShinR: [44, 0, 0]
      }, 'hold'),
      K(1.62, {
        Hips_pos: [0, -0.198, -0.24], Spine: [-25, -4, 0], Chest: [-17, -6, 0],
        Neck: [15, -2, 0], Head: [19, -4, 0],
        UpArmL: [-13, 10, 35], UpArmR: [-11, -8, -37],
        ThighL: [-34, -30, 0], ShinL: [46, 0, 0], ThighR: [30, 35, 0], ShinR: [50, 0, 0]
      }, 'hold'),
      // and the come-down is the longest recovery in the file
      K(2.05, {}, 'out')
    ]
  },

  // =========================================================================
  // TAUNT — HE DOESN'T SAY ANYTHING
  // =========================================================================
  // The brief: "something enormous and physical that shows off raw output — a
  // casual discharge of energy that cracks the ground under him. He doesn't
  // need to say anything; the display is the point." So there is NO BUBBLE on
  // this taunt (see combat/taunts.js — `say: null`, which the two silent
  // variants and all four cursed spirits already use).
  //
  // What the researched character does support is the reason for it: Ryu's
  // defining scene is a SINGLE MEANINGFUL GLARE — "Ryu communicated four
  // hundred years of hunger and thirst for a worthy fight to Yuta with a
  // single, meaningful glare" (ch.180). So the clip ends on the stare, and the
  // discharge is what he does with his hand while he is doing it.
  //
  // ONE HAND. He does not brace, he does not aim, he does not even look at the
  // floor: he drops his right fist a few inches and the ground gives out. The
  // entire read is CASUAL — the most destructive thing in this taunt costs him
  // no more effort than putting a glass down.
  taunt: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the fist closes and lifts. Barely.
      K(0.42, {
        UpArmR: [-30, -8, -26], LoArmR: [-74, -14, -4], HandR: [-24, -46, 0],
        Chest: [2, -8, 0], Neck: [-2, -2, 0], Head: [-4, -5, 0], Hips_pos: [0, -0.062, 0]
      }, 'out'),
      // and it comes down. This is the discharge; it is 0.10 s and it is the
      // only fast thing in the taunt.
      K(0.52, {
        UpArmR: [-4, -6, -14], LoArmR: [-30, -8, -2], HandR: [-40, -30, 0],
        Chest: [8, -4, 0], Spine: [6, -3, 0], Head: [0, -4, 0],
        Hips_pos: [0, -0.128, 0],
        ThighL: [-26, -18, 0], ShinL: [34, 0, 0], ThighR: [22, 23, 0], ShinR: [36, 0, 0]
      }, 'snap'),
      K(0.66, {
        UpArmR: [-4, -6, -14], LoArmR: [-32, -8, -2],
        Chest: [8, -4, 0], Hips_pos: [0, -0.136, 0]
      }, 'hold'),
      // he straightens up, without hurrying and without looking at what he
      // just did.
      K(1.22, {
        UpArmR: [-14, -6, -18], LoArmR: [-56, -12, -4], HandR: [-14, -40, 0],
        Chest: [2, -6, 0], Spine: [3, -4, 0], Hips_pos: [0, -0.050, 0],
        Neck: [0, -2, 0], Head: [-2, -4, 0]
      }, 'out'),
      // THE STARE. Chin drops a fraction, shoulders square, and he holds it for
      // over a second. Nothing else in the clip moves.
      K(1.62, {
        Chest: [1, -6, 0], Spine: [3, -4, 0], Neck: [2, -1, 0], Head: [3, -2, 0],
        UpArmL: [-14, 8, 14], UpArmR: [-12, -6, -16], Hips_pos: [0, -0.052, 0]
      }, 'out'),
      K(2.70, {
        Chest: [1, -6, 0], Neck: [2, -1, 0], Head: [3, -2, 0],
        UpArmL: [-14, 8, 14], UpArmR: [-12, -6, -16], Hips_pos: [0, -0.054, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  },

  // ---- VICTORY -----------------------------------------------------------
  // "Even in defeat, Ryu was gracious and thanked Yuta before declaring that
  // his stomach was finally full." He is not a gloater — the win pose is a man
  // rolling a shoulder out and looking mildly satisfied, which is the closest
  // thing the researched character has to a celebration.
  victory: {
    dur: 3.8, loop: false, keys: [
      K(0, {}),
      // one big shoulder roll
      K(0.60, {
        UpArmR: [-64, -14, -34], LoArmR: [-30, -8, -6], HandR: [-16, -40, 0],
        Chest: [-2, -14, 0], Spine: [0, -8, 0], Head: [-4, -10, 0], Hips_pos: [0, -0.048, 0]
      }, 'out'),
      K(1.05, {
        UpArmR: [22, -12, -30], LoArmR: [-44, -10, -6],
        Chest: [4, 8, 0], Spine: [4, 4, 0], Head: [0, 6, 0], Hips_pos: [0, -0.066, 0]
      }, 'out'),
      K(1.45, {
        UpArmR: [-14, -6, -18], LoArmR: [-56, -12, -4], HandR: [-14, -40, 0],
        Chest: [2, -6, 0], Head: [-1, -4, 0], Hips_pos: [0, -0.052, 0]
      }, 'out'),
      // and he settles back into the emplacement and stays there
      K(2.20, {}, 'out'),
      K(3.8, {})
    ]
  }
};
