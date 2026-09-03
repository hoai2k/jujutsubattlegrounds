// Gojo-specific clips: Red / Blue / Hollow Purple casts, the Unlimited Void
// hand sign, victory. Loose, minimal-effort body language — he barely moves.
const K = (t, pose, e) => ({ t, pose, e });

// STANCE — Gojo does not take a guard. Infinity means nothing reaches him, so
// he stands tall and bored: chin up, shoulders dropped, arms hanging loose,
// weight rocked onto the back leg. The least "fighting stance" in the roster.
export const GOJO_STANCE = {
  Hips_pos: [0, -0.02, 0],
  Hips: [0, 20, 0], Spine: [-2, -6, 0], Chest: [-3, -9, 0], Neck: [-2, -4, 0], Head: [-5, -10, 3],
  UpArmL: [-6, 8, 4], LoArmL: [-26, 18, 2], HandL: [-10, 40, 0],
  UpArmR: [-4, -6, -5], LoArmR: [-20, -14, 0], HandR: [-10, -40, 0],
  ThighL: [-9, -4, 0], ShinL: [8, 0, 0], FootL: [1, -12, 0],
  ThighR: [8, 6, 0], ShinR: [12, 0, 0], FootR: [6, 8, 0]
};

export const GOJO_CLIPS = {
  // TELEPORT exit: he arrives mid-shrug, hands in non-pockets — the warp
  // itself is instant, this is just the bored landing posture
  special: {
    dur: 0.3, loop: false, keys: [
      K(0, { Hips_pos: [0, 0.02, 0], Spine: [-6, -6, 0], Chest: [-6, -9, 0], Head: [-8, -14, 4], UpArmL: [-14, 10, 10], LoArmL: [-40, 18, 2], UpArmR: [-12, -8, -11], LoArmR: [-36, -14, 0] }, 'snap'),
      K(0.14, { Hips_pos: [0, -0.01, 0], Spine: [-3, -6, 0], Head: [-6, -10, 3] }, 'hold'),
      K(0.3, {}, 'out')
    ]
  },
  // idle: almost nothing. A slow shoulder roll and a head tilt — the posture
  // of someone who has never had to block anything in his life.
  idle: {
    dur: 3.6, loop: true, keys: [
      K(0, {}),
      K(1.2, { Chest: [-2, -9, 0], Head: [-6, 4, 4], Hips_pos: [0, -0.032, 0], UpArmL: [-4, 8, 6], UpArmR: [-2, -6, -7] }),
      K(2.4, { Chest: [-4, -10, 0], Head: [-4, -18, 2], Hips_pos: [0, -0.014, 0], UpArmL: [-8, 8, 3], UpArmR: [-6, -6, -4], LoArmL: [-30, 18, 2] }),
      K(3.6, {})
    ]
  },
  // Reversal Red: two-finger point, then a lazy open-palm repulsion push
  ct1: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.22, { UpArmR: [-52, -20, -26], LoArmR: [-124, 0, -8], HandR: [-30, 0, 0], Chest: [0, -24, 0], Hips: [0, 34, 0], Head: [2, -12, 0], Hips_pos: [0, -0.07, 0] }, 'in'),
      K(0.37, { UpArmR: [-96, 10, 2], LoArmR: [-4, 0, 0], HandR: [-88, 0, 0], Chest: [2, 16, 0], Hips: [0, 4, 0], Spine: [3, 10, 0], Head: [0, -16, 0], UpArmL: [-34, 10, 18], Hips_pos: [0, -0.05, 0] }, 'snap'),
      K(0.48, { UpArmR: [-98, 10, 2], LoArmR: [-6, 0, 0], HandR: [-88, 0, 0], Chest: [2, 16, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },
  // Lapse Blue: raised curling fingers, drag inward
  ct2: {
    dur: 0.8, loop: false, keys: [
      K(0, {}),
      K(0.18, { UpArmR: [-110, -10, -16], LoArmR: [-44, 0, -6], HandR: [-50, 0, 0], Chest: [-4, -16, 0], Hips: [0, 30, 0], Head: [-2, -10, 0] }, 'in'),
      K(0.32, { UpArmR: [-92, 4, -2], LoArmR: [-58, 0, -4], HandR: [-90, 0, 0], Chest: [-2, 0, 0], Hips: [0, 18, 0], Head: [0, -12, 0] }, 'snap'),
      K(0.5, { UpArmR: [-88, 4, -2], LoArmR: [-72, 0, -4], HandR: [-100, 0, 0], Chest: [0, 8, 0], Hips: [0, 12, 0] }, 'hold'),
      K(0.8, {}, 'out')
    ]
  },
  // Hollow Purple: Blue in the left, Red in the right, merge and release
  purple: {
    dur: 2.0, loop: false, keys: [
      K(0, {}),
      K(0.3, { UpArmL: [-86, 18, 40], LoArmL: [-30, 0, 8], HandL: [-60, 0, 0], UpArmR: [-86, -18, -42], LoArmR: [-30, 0, -8], HandR: [-60, 0, 0], Chest: [-8, -10, 0], Spine: [-6, -6, 0], Head: [-4, -8, 0], Hips_pos: [0, -0.09, 0] }, 'out'),
      K(0.62, { UpArmL: [-88, 2, 16], LoArmL: [-44, 0, 8], UpArmR: [-88, -2, -18], LoArmR: [-44, 0, -8], Chest: [-6, -8, 0], Hips_pos: [0, -0.10, 0] }),
      K(0.83, { UpArmL: [-96, -8, 4], LoArmL: [-20, 0, 4], HandL: [-80, 0, 0], UpArmR: [-96, 8, -4], LoArmR: [-20, 0, -4], HandR: [-80, 0, 0], Chest: [8, 0, 0], Spine: [8, 0, 0], Hips: [0, 10, 0], Head: [4, -6, 0], Hips_pos: [0, -0.04, 0] }, 'snap'),
      K(1.5, { UpArmL: [-96, -8, 4], LoArmL: [-22, 0, 4], HandL: [-80, 0, 0], UpArmR: [-96, 8, -4], LoArmR: [-22, 0, -4], HandR: [-80, 0, 0], Chest: [10, 0, 0], Hips_pos: [0, -0.05, 0] }, 'hold'),
      K(2.0, {}, 'out')
    ]
  },
  // LIMITLESS HEEL: knee floated up to the chest, then the heel dropped
  // straight through them. Arms never leave his sides — he does not need them.
  heavy: {
    dur: 0.75, loop: false, keys: [
      K(0, {}),
      K(0.20, { ThighR: [-122, 6, 0], ShinR: [72, 0, 0], FootR: [-14, 8, 0], ThighL: [-6, -4, 0], ShinL: [8, 0, 0], Hips: [0, 14, 0], Spine: [-8, -6, 0], Chest: [-6, -9, 0], Head: [-8, -8, 0], Hips_pos: [0, -0.01, 0], UpArmL: [-10, 8, 10], UpArmR: [-8, -6, -11] }, 'in'),
      K(0.32, { ThighR: [-94, 6, 0], ShinR: [6, 0, 0], FootR: [-34, 8, 0], ThighL: [-14, -4, 0], ShinL: [22, 0, 0], Hips: [2, 10, 0], Spine: [4, -4, 0], Chest: [0, -6, 0], Head: [2, -8, 0], Hips_pos: [0, -0.08, 0], UpArmL: [-28, 10, 26], LoArmL: [-40, 12, 4], UpArmR: [-22, -8, -28], LoArmR: [-34, -10, -2] }, 'snap'),
      K(0.4, { ThighR: [-92, 6, 0], ShinR: [6, 0, 0], FootR: [-34, 8, 0], ThighL: [-14, -4, 0], ShinL: [22, 0, 0], Spine: [4, -4, 0], Chest: [0, -6, 0], Hips_pos: [0, -0.08, 0] }, 'hold'),
      // the heel finishes its travel on the way out — the leg chops down and
      // he settles back onto both feet
      K(0.54, { ThighR: [-40, 6, 0], ShinR: [2, 0, 0], FootR: [-30, 8, 0], ThighL: [-20, -4, 0], ShinL: [30, 0, 0], Spine: [10, -4, 0], Chest: [5, -6, 0], Head: [6, -8, 0], Hips_pos: [0, -0.16, 0] }, 'snap'),
      K(0.75, {}, 'out')
    ]
  },
  // Unlimited Void: hand sign at the face, head bow, arms spread wide
  domainCast: {
    dur: 1.6, loop: false, keys: [
      K(0, {}),
      K(0.35, { UpArmL: [-96, -30, 10], LoArmL: [-118, -20, 4], HandL: [-40, 20, 0], UpArmR: [-92, 28, -12], LoArmR: [-122, 22, -4], HandR: [-40, -20, 0], Head: [10, -6, 0], Chest: [4, -4, 0], Hips_pos: [0, -0.06, 0] }, 'out'),
      K(0.85, { UpArmL: [-96, -30, 10], LoArmL: [-118, -20, 4], HandL: [-40, 20, 0], UpArmR: [-92, 28, -12], LoArmR: [-122, 22, -4], HandR: [-40, -20, 0], Head: [16, -6, 0], Hips_pos: [0, -0.07, 0] }, 'hold'),
      K(1.15, { UpArmL: [-90, 10, 78], LoArmL: [-8, 0, 4], HandL: [-10, 0, 0], UpArmR: [-86, -10, -82], LoArmR: [-8, 0, -4], HandR: [-10, 0, 0], Head: [-12, -6, 0], Chest: [-8, -6, 0], Spine: [-6, -4, 0], Hips_pos: [0, -0.02, 0] }, 'snap'),
      K(1.6, { UpArmL: [-88, 10, 74], LoArmL: [-10, 0, 4], UpArmR: [-84, -10, -78], LoArmR: [-10, 0, -4], Head: [-10, -6, 0], Chest: [-7, -6, 0] }, 'hold')
    ]
  },
  // ---- TAUNT — "NAH, I'D WIN." --------------------------------------------
  // THE REFERENCE TAUNT. Ch.236's full-page panel, rebuilt as an animation.
  //
  // The panel is one image, so the job is inventing the two seconds either side
  // of it — and the whole clip is built so the POSE is the destination and the
  // LINE arrives after he has already stopped moving. That order is the joke.
  // If the bubble popped on the first frame it would read as a battle cry;
  // arriving into stillness, it reads as a man answering a question nobody
  // asked out loud.
  //
  // Shot by shot:
  //   0.00        stance
  //   0.30  in    ANTICIPATION. He sinks a few centimetres and the hands start
  //               travelling in toward the hips. Head turns AWAY — he is not
  //               looking at you yet, which is what makes the look back land.
  //   0.72  out   THE HANDS ARRIVE IN THE POCKETS. Elbows come IN and the
  //               forearms fold across, shoulders drop, chest opens, weight
  //               rocks onto the back leg. This is the body of the panel.
  //               (Pass 2: the elbows used to FLARE at rz 21. On the render
  //               that put the hands out beside the hips like a man about to
  //               draw, not in his pockets — see shots/t-gojo-behind.)
  //   1.15        THE HEAD TILT, taken slowly and on its own — the only thing
  //               moving. Chin up, roll to one side, eyes come back to you.
  //   1.55  hold  THE PANEL. Dead still. The bubble pops here (`at: 1.55`).
  //   2.60        the smallest possible settle: a breath, a weight shift of
  //               about a centimetre. Nothing else. The hair spring and the
  //               coat carry the rest, exactly as they do in every other clip.
  //   3.40  out   back to stance.
  //
  // Six of the seven keys move something other than the arms, because the note
  // that kept coming back in the viewer was that a pose-and-stop reads as
  // broken — the settle at 2.60 is what buys the hold its life.
  taunt: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      // anticipation — sink, hands start in, head turns away
      K(0.30, {
        Hips_pos: [0, -0.075, 0], Spine: [1, -8, 0], Chest: [0, -12, 0],
        Head: [-2, -24, 1], Neck: [1, -6, 0],
        UpArmL: [10, 8, 1], LoArmL: [-64, 52, 3],
        UpArmR: [12, -6, -2], LoArmR: [-60, -48, 0],
        ThighL: [-12, -4, 0], ThighR: [11, 6, 0]
      }, 'in'),
      // the hands arrive — elbows out, shoulders down, weight all the way back
      K(0.72, {
        Hips_pos: [-0.015, -0.05, -0.02], Hips: [0, 26, 0],
        Spine: [-4, -9, 0], Chest: [-6, -13, 0], Neck: [-2, -5, 0],
        Head: [-6, -18, 2],
        UpArmL: [21, 6, -7], LoArmL: [-88, 66, 4], HandL: [-42, 74, 0],
        UpArmR: [23, -4, 5], LoArmR: [-84, -62, -2], HandR: [-42, -74, 0],
        ThighL: [-15, -4, 0], ShinL: [11, 0, 0], FootL: [1, -12, 0],
        ThighR: [14, 7, 0], ShinR: [8, 0, 0], FootR: [7, 9, 0]
      }, 'out'),
      // THE TILT. Arms and hips are already where they are going — this key
      // moves the head, the neck and about two degrees of chest, and nothing
      // else in the body changes at all.
      K(1.15, {
        Hips_pos: [-0.015, -0.05, -0.02], Hips: [0, 26, 0],
        Spine: [-5, -9, 0], Chest: [-7, -12, 0], Neck: [-4, -2, 0],
        Head: [-11, 4, 13],
        UpArmL: [21, 6, -7], LoArmL: [-88, 66, 4], HandL: [-42, 74, 0],
        UpArmR: [23, -4, 5], LoArmR: [-84, -62, -2], HandR: [-42, -74, 0],
        ThighL: [-15, -4, 0], ShinL: [11, 0, 0],
        ThighR: [14, 7, 0], ShinR: [8, 0, 0]
      }),
      // THE PANEL — held, and the line lands on it
      K(1.55, {
        Hips_pos: [-0.015, -0.05, -0.02], Hips: [0, 26, 0],
        Spine: [-5, -9, 0], Chest: [-7, -12, 0], Neck: [-4, -2, 0],
        Head: [-13, 6, 15],
        UpArmL: [21, 6, -7], LoArmL: [-88, 66, 4], HandL: [-42, 74, 0],
        UpArmR: [23, -4, 5], LoArmR: [-84, -62, -2], HandR: [-42, -74, 0],
        ThighL: [-15, -4, 0], ShinL: [11, 0, 0],
        ThighR: [14, 7, 0], ShinR: [8, 0, 0]
      }, 'hold'),
      // the settle — a breath and a centimetre, so the hold is alive
      K(2.60, {
        Hips_pos: [-0.012, -0.062, -0.018], Hips: [0, 25, 0],
        Spine: [-4, -9, 0], Chest: [-5, -12, 0], Neck: [-3, -2, 0],
        Head: [-12, 3, 14],
        UpArmL: [20, 6, -6], LoArmL: [-89, 66, 4],
        UpArmR: [22, -4, 4], LoArmR: [-85, -62, -2],
        ThighL: [-14, -4, 0], ThighR: [13, 7, 0]
      }),
      K(3.4, {}, 'out')
    ]
  },
  // ---- TAUNT — GOJO 【SHINJUKU】 ------------------------------------------
  // The same man, none of the smugness. Battle-worn Gojo is not performing
  // superiority, he is DELIGHTED — the fight he has wanted his whole life
  // finally turned up. So the shape is inverted: where the base taunt sinks
  // into stillness with the hands hidden, this one OPENS. He rolls his neck,
  // cracks his knuckles and comes up onto the front foot, and the line lands
  // on him leaning IN rather than standing back.
  tauntShinjuku: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      // neck roll — head goes over and around, shoulders follow late
      K(0.34, {
        Head: [4, -26, -16], Neck: [3, -8, -6], Chest: [2, -14, -3],
        UpArmL: [-2, 10, 8], UpArmR: [0, -8, -9], Hips_pos: [0, -0.05, 0]
      }, 'in'),
      K(0.70, {
        Head: [-2, 20, 15], Neck: [-1, 8, 6], Chest: [-2, -4, 3],
        UpArmL: [-6, 8, 12], LoArmL: [-34, 20, 4],
        UpArmR: [-4, -6, -13], LoArmR: [-30, -16, -2]
      }),
      // the knuckle crack: hands meet at the centre, thumbs press through
      K(1.05, {
        Head: [2, -6, 2], Neck: [1, -3, 0], Chest: [4, -8, 0], Spine: [3, -5, 0],
        UpArmL: [-52, 22, 14], LoArmL: [-96, 34, 6], HandL: [-30, 60, 0],
        UpArmR: [-48, -20, -16], LoArmR: [-100, -32, -6], HandR: [-30, -60, 0],
        Hips_pos: [0, -0.06, 0]
      }, 'snap'),
      // and he comes UP and forward onto the front foot, arms opening out
      K(1.60, {
        Head: [-6, 2, 4], Neck: [-3, 1, 0], Chest: [-6, -6, 0], Spine: [-4, -4, 0],
        UpArmL: [-14, 12, 30], LoArmL: [-46, 22, 8], HandL: [-16, 34, 0],
        UpArmR: [-12, -10, -32], LoArmR: [-42, -20, -8], HandR: [-16, -34, 0],
        Hips: [0, 16, 0], Hips_pos: [0, -0.01, 0.04],
        ThighL: [-16, -4, 0], ShinL: [14, 0, 0], ThighR: [4, 6, 0], ShinR: [16, 0, 0]
      }, 'out'),
      K(2.55, {
        Head: [-7, -2, 5], Chest: [-6, -7, 0],
        UpArmL: [-12, 12, 27], LoArmL: [-48, 22, 8],
        UpArmR: [-10, -10, -29], LoArmR: [-44, -20, -8],
        Hips: [0, 17, 0], Hips_pos: [0, -0.02, 0.035]
      }, 'hold'),
      K(3.4, {}, 'out')
    ]
  },
  // VICTORY — rebuilt 2026-08-14. The old one raised both forearms a little at
  // t=0.5 and then spent 2.5 seconds turning his head: 68° of total travel,
  // second-lowest on the roster, on the character every player picks first.
  //
  // The new one is built from the three things Gojo actually does: he touches
  // the blindfold, he dismisses you with a flick, and he turns his back while
  // still looking at you. It ends on the lazy two-finger salute rather than on
  // a pose, because the salute is the line "nah, I'd win" without a voice clip.
  //
  // Ease matters as much as the poses: the blindfold tug is 'snap' (he does it
  // without thinking), everything after it is 'out' (nothing is effortful).
  victory: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // sink and wind the arm back — the only anticipation he gives anything
      K(0.28, {
        Hips_pos: [0, -0.055, 0], Spine: [1, -4, 0], Chest: [0, -6, 0],
        UpArmR: [10, -8, -10], LoArmR: [-16, -12, 0], Head: [0, -6, 2]
      }, 'in'),
      // hand snaps up to the blindfold, chin drops behind it
      K(0.52, {
        Hips: [0, 14, 0], Hips_pos: [0, -0.018, 0],
        Spine: [-3, -2, 0], Chest: [-5, -4, 0], Neck: [6, 0, 0], Head: [14, -4, 2],
        // rz must ADDUCT here (positive, toward the midline): the arm at
        // rz=-24 raised to head height but stayed out beside him, so the tug
        // read as a raised fist rather than a hand on the blindfold
        UpArmR: [-84, -6, 14], LoArmR: [-128, -30, 0], HandR: [-18, -100, 0],
        UpArmL: [-10, 6, 10], LoArmL: [-30, 14, 0]
      }, 'snap'),
      // the tug: chin comes back up, chest opens, weight settles onto the back leg
      K(0.95, {
        Hips: [0, 18, 0], Hips_pos: [0, -0.012, -0.01],
        Spine: [-6, -2, 0], Chest: [-9, -4, 0], Neck: [-4, 0, 0], Head: [-12, -6, 3],
        UpArmR: [-78, -4, 12], LoArmR: [-118, -26, 0], HandR: [-16, -92, 0],
        UpArmL: [-16, 8, 14], LoArmL: [-44, 18, 0],
        ThighL: [-14, -4, 0], ThighR: [12, 6, 0]
      }, 'out'),
      // the flick — the arm throws outward and down, dismissing the whole fight
      K(1.30, {
        Hips: [0, 26, 0], Chest: [-6, -12, 0], Head: [-8, -14, 4],
        UpArmR: [-26, -46, -38], LoArmR: [-24, -20, 0], HandR: [-10, -150, 0],
        UpArmL: [-14, 8, 12]
      }, 'snap'),
      // turns his back on you, still watching over the shoulder
      K(1.85, {
        Hips: [0, 66, 0], Hips_pos: [0, -0.03, 0.012],
        Spine: [2, 10, 0], Chest: [1, 16, 0], Neck: [0, -22, 0], Head: [-4, -46, 5],
        UpArmR: [-8, -10, -8], LoArmR: [-30, -16, 0], HandR: [-14, -60, 0],
        UpArmL: [-10, 10, 10], LoArmL: [-34, 16, 0],
        ThighL: [-8, -4, 0], ThighR: [10, 6, 0]
      }, 'out'),
      // the two-finger salute beside the head
      K(2.35, {
        Hips: [0, 62, 0], Hips_pos: [0, -0.022, 0.010],
        Chest: [0, 14, 0], Neck: [0, -20, 0], Head: [-8, -44, 6],
        UpArmR: [-104, -22, -36], LoArmR: [-92, -34, 0], HandR: [-8, -152, 0],
        UpArmL: [-8, 10, 9]
      }, 'out'),
      // settle: the hand drifts a touch, the weight rocks back
      K(2.75, {
        Hips: [0, 60, 0], Hips_pos: [0, -0.034, 0.008],
        Chest: [1, 13, 0], Head: [-6, -42, 6],
        UpArmR: [-98, -20, -33], LoArmR: [-96, -32, 0], HandR: [-8, -148, 0]
      }),
      K(3.2, {
        Hips: [0, 61, 0], Hips_pos: [0, -0.026, 0.010],
        Chest: [0, 14, 0], Head: [-7, -44, 6],
        UpArmR: [-101, -21, -35], LoArmR: [-93, -33, 0], HandR: [-8, -150, 0]
      })
    ]
  }
};
