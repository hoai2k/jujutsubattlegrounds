// GETO — the STILL end of the roster.
//
// THE ANIMATION BRIEF, and every clip below is written to it: "Geto barely
// moves — economical, still, gestural. All the motion in his fights belongs to
// his curses."
//
// What that means concretely, and how it differs from everyone else:
//   · THE STANCE IS NOT A GUARD. Every other fighter in the roster stands with
//     the hands up between them and the opponent. Geto stands with his hands
//     CLASPED at the waist and his weight even on both feet. He is not
//     preparing to be hit, because he does not expect to be the one hit.
//   · NO WEIGHT SHIFTS. His idle moves the chest and the head and nothing
//     else — no bounce, no rocking, no hip sway. The bob amplitude is roughly
//     a third of the base idle's.
//   · GESTURES, NOT SWINGS. The summons are ONE HAND opening, held. There is
//     no wind-up, no follow-through and no recovery flail; the arm goes to the
//     pose and stays there while the curse does the work. Where Megumi's
//     summon clips throw the whole body into a hand sign, Geto's move one arm.
//   · THE CLOTH DOES THE ACTING. His model carries the loosest spring set on
//     the roster (see art/models/geto.js) precisely so that a body which
//     hardly moves still produces a silhouette that does. Every clip here
//     leans on that: the poses are quiet and the robe is what sells them.
//
// The one clip that breaks the rule is `ult` — MAXIMUM: UZUMAKI is the single
// moment he commits to anything, so it is the only place his feet move.
import { STANCE as BASE } from './base.js';

const K = (t, pose, e) => ({ t, pose, e });

// ---- STANCE ---------------------------------------------------------------
// Upright, square, hands clasped low in front. Both forearms come across the
// body and the wrists meet at about navel height; the chin is level and the
// shoulders are down. Compared with the shared stance the arms are ~40 degrees
// lower and the hips are not turned.
export const GETO_STANCE = {
  ...BASE,
  Hips_pos: [0, -0.020, 0],                  // stands tall: the base drops 0.045
  Hips: [0, 10, 0],                          // barely bladed — the base turns 24
  Spine: [2, -3, 0], Chest: [1, -4, 0], Neck: [0, -1, 0], Head: [0, -3, 0],
  // clasped hands: upper arms hanging, forearms folded across to meet
  ClavL: [0, 0, 0], UpArmL: [-14, 16, 8], LoArmL: [-84, 52, 0], HandL: [-10, 40, 0],
  ClavR: [0, 0, 0], UpArmR: [-12, -14, -9], LoArmR: [-88, -48, 0], HandR: [-10, -40, 0],
  // even weight, feet close: no fighting stance at all
  ThighL: [-6, -3, 0], ShinL: [7, 0, 0], FootL: [1, -6, 0],
  ThighR: [5, 4, 0], ShinR: [8, 0, 0], FootR: [3, 5, 0]
};

const S = GETO_STANCE;

export const GETO_CLIPS = {
  // IDLE — a slow breath through the chest and a small head drift. Nothing
  // else moves. The robe hem and the loose hair keep travelling after the body
  // has already stopped, which is the entire read.
  idle: {
    dur: 4.2, loop: true, keys: [
      K(0, {}),
      K(2.1, { Chest: [3, -4, 0], Spine: [3, -3, 0], Hips_pos: [0, -0.028, 0], Head: [1, -1, 0], Neck: [1, 0, 0] }),
      K(4.2, {})
    ]
  },

  // WALK — an unhurried glide. The arms STAY CLASPED: he does not swing them.
  // Stride is shorter than the base walk and the hips do not counter-rotate,
  // so the top half of the silhouette is almost static while the robe moves.
  walk: {
    dur: 1.04, loop: true, keys: [
      K(0, { ThighL: [-22, -3, 0], ShinL: [9, 0, 0], FootL: [-5, -6, 0], ThighR: [17, 4, 0], ShinR: [23, 0, 0], FootR: [10, 5, 0], Hips_pos: [0, -0.026, 0] }),
      K(0.26, { ThighL: [-4, -3, 0], ShinL: [16, 0, 0], ThighR: [3, 4, 0], ShinR: [12, 0, 0], Hips_pos: [0, -0.012, 0] }),
      K(0.52, { ThighL: [18, -3, 0], ShinL: [22, 0, 0], FootL: [9, -6, 0], ThighR: [-21, 4, 0], ShinR: [10, 0, 0], FootR: [-5, 5, 0], Hips_pos: [0, -0.026, 0] }),
      K(0.78, { ThighL: [2, -3, 0], ShinL: [13, 0, 0], ThighR: [-6, 4, 0], ShinR: [18, 0, 0], Hips_pos: [0, -0.012, 0] }),
      K(1.04, { ThighL: [-22, -3, 0], ShinL: [9, 0, 0], FootL: [-5, -6, 0], ThighR: [17, 4, 0], ShinR: [23, 0, 0], FootR: [10, 5, 0], Hips_pos: [0, -0.026, 0] })
    ]
  },

  // RUN — he unclasps for this and only this, because a man sprinting with his
  // hands folded is comic rather than composed. Even so the arms stay LOW and
  // close; there is no pumping.
  run: {
    dur: 0.60, loop: true, keys: [
      K(0, { Spine: [12, -2, 0], Chest: [8, -3, 0], Hips: [2, 6, 0], ThighL: [-44, -2, 0], ShinL: [20, 0, 0], FootL: [-11, -5, 0], ThighR: [28, 3, 0], ShinR: [56, 0, 0], FootR: [24, 5, 0], UpArmL: [-18, 12, 10], LoArmL: [-92, 20, 4], UpArmR: [-52, -10, -11], LoArmR: [-84, -18, -4], Hips_pos: [0, -0.02, 0] }),
      K(0.15, { Spine: [11, -2, 0], ThighL: [-8, -2, 0], ShinL: [26, 0, 0], ThighR: [-13, 3, 0], ShinR: [34, 0, 0], Hips_pos: [0, -0.048, 0] }),
      K(0.30, { Spine: [12, -2, 0], Chest: [8, -3, 0], Hips: [2, 6, 0], ThighL: [28, -2, 0], ShinL: [56, 0, 0], FootL: [24, -5, 0], ThighR: [-44, 3, 0], ShinR: [20, 0, 0], FootR: [-11, 5, 0], UpArmL: [-52, 12, 10], LoArmL: [-84, 20, 4], UpArmR: [-18, -10, -11], LoArmR: [-92, -18, -4], Hips_pos: [0, -0.02, 0] }),
      K(0.45, { Spine: [11, -2, 0], ThighL: [-13, -2, 0], ShinL: [34, 0, 0], ThighR: [-8, 3, 0], ShinR: [26, 0, 0], Hips_pos: [0, -0.048, 0] }),
      K(0.60, { Spine: [12, -2, 0], ThighL: [-44, -2, 0], ShinL: [20, 0, 0], ThighR: [28, 3, 0], ShinR: [56, 0, 0], UpArmL: [-18, 12, 10], UpArmR: [-52, -10, -11], Hips_pos: [0, -0.02, 0] })
    ]
  },

  // BLOCK — he brings ONE forearm up and turns the shoulder in. The other hand
  // stays where it was. Average guard in the config; a guard that looks like a
  // man declining to be inconvenienced.
  block: {
    dur: 0.18, loop: false, keys: [
      K(0, {}),
      K(0.13, { UpArmL: [-62, 30, 10], LoArmL: [-108, 34, 0], HandL: [-16, 88, 0], UpArmR: [-24, -18, -10], LoArmR: [-96, -44, 0], Spine: [6, -14, 0], Chest: [4, -18, 0], Head: [4, -14, 0], Hips: [0, 22, 0], Hips_pos: [0, -0.052, 0] }, 'out'),
      K(0.18, { UpArmL: [-62, 30, 10], LoArmL: [-108, 34, 0], UpArmR: [-24, -18, -10], LoArmR: [-96, -44, 0], Hips_pos: [0, -0.052, 0] })
    ]
  },

  // ---- THE PUNCH STRING ----------------------------------------------------
  // Weak, short, unremarkable — by design (see characters/geto.js). These are
  // open-handed pushes and a shoulder, not boxing: he is a man who has not
  // needed to hit anybody personally in some years. Short travel, small hips,
  // and the third one is a downward palm that puts them on the floor.
  punch1: {
    dur: 0.36, loop: false, keys: [
      K(0, {}),
      K(0.08, { UpArmL: [-30, 22, 12], LoArmL: [-92, 40, 0], Chest: [2, -14, 0], Hips: [0, 18, 0] }, 'in'),
      K(0.15, { UpArmL: [-74, 0, -2], LoArmL: [-14, 0, 0], HandL: [-6, 60, 0], Chest: [3, 4, 0], Hips: [0, 4, 0], Spine: [3, 3, 0], Head: [1, -6, 0] }, 'snap'),
      K(0.19, { UpArmL: [-74, 0, -2], LoArmL: [-16, 0, 0], Chest: [3, 4, 0] }, 'hold'),
      K(0.36, {}, 'out')
    ]
  },
  punch2: {
    dur: 0.40, loop: false, keys: [
      K(0, { UpArmL: [-60, 0, 0], LoArmL: [-40, 0, 0] }),
      K(0.09, { UpArmR: [-26, -24, -16], LoArmR: [-100, -40, 0], Chest: [3, -18, 0], Hips: [0, 24, 0] }, 'in'),
      K(0.17, { UpArmR: [-78, 4, 0], LoArmR: [-12, 0, 0], HandR: [-6, -120, 0], Chest: [4, 12, 0], Hips: [0, -2, 0], Spine: [4, 8, 0], Head: [1, -10, 0] }, 'snap'),
      K(0.22, { UpArmR: [-78, 4, 0], LoArmR: [-14, 0, 0], Chest: [4, 12, 0] }, 'hold'),
      K(0.40, {}, 'out')
    ]
  },
  // third hit: a flat descending palm. KNOCKDOWN, not a launcher — nothing
  // Geto does personally is worth putting somebody in the air for.
  punch3: {
    dur: 0.58, loop: false, keys: [
      K(0, { UpArmR: [-60, 0, 0], LoArmR: [-30, 0, 0] }),
      K(0.16, { UpArmR: [-140, -10, -8], LoArmR: [-46, 0, -4], HandR: [-30, -40, 0], Chest: [-4, -20, 0], Spine: [-2, -10, 0], Hips: [0, 26, 0], Head: [-2, -10, 0], Hips_pos: [0, -0.03, 0] }, 'in'),
      K(0.27, { UpArmR: [-40, 8, -2], LoArmR: [-8, 0, 0], HandR: [-40, -90, 0], Chest: [14, 14, 0], Spine: [10, 8, 0], Hips: [2, 2, 0], Head: [10, -8, 0], Hips_pos: [0, -0.11, 0], ThighL: [-26, -3, 0], ShinL: [28, 0, 0], ThighR: [18, 4, 0], ShinR: [36, 0, 0] }, 'snap'),
      K(0.34, { UpArmR: [-38, 8, -2], LoArmR: [-10, 0, 0], Chest: [14, 16, 0], Hips_pos: [0, -0.11, 0] }, 'hold'),
      K(0.58, {}, 'out')
    ]
  },

  // HEAVY — a two-handed shove out from the chest. Slow, committed, and still
  // barely a movement: the hands go out, the feet do not travel.
  heavy: {
    dur: 0.86, loop: false, keys: [
      K(0, {}),
      K(0.24, { UpArmL: [-40, 34, 16], LoArmL: [-116, 46, 0], UpArmR: [-38, -32, -17], LoArmR: [-120, -44, 0], Chest: [-4, -8, 0], Spine: [-3, -4, 0], Head: [-4, -4, 0], Hips_pos: [0, -0.05, 0], ThighL: [-18, -3, 0], ShinL: [20, 0, 0] }, 'in'),
      K(0.38, { UpArmL: [-86, 4, 2], LoArmL: [-10, 0, 0], HandL: [-70, 30, 0], UpArmR: [-84, -2, -3], LoArmR: [-12, 0, 0], HandR: [-70, -30, 0], Chest: [8, 4, 0], Spine: [7, 2, 0], Head: [6, -2, 0], Hips_pos: [0, -0.09, 0], ThighL: [-30, -3, 0], ShinL: [34, 0, 0], ThighR: [22, 4, 0], ShinR: [40, 0, 0] }, 'snap'),
      K(0.50, { UpArmL: [-84, 4, 2], UpArmR: [-82, -2, -3], Chest: [8, 5, 0], Hips_pos: [0, -0.09, 0] }, 'hold'),
      K(0.86, {}, 'out')
    ]
  },

  // ---- RB · SUMMON LOW-GRADE ----------------------------------------------
  // ONE HAND. It comes up off the clasp, opens palm-down at chest height, and
  // holds while the chaff arrives. 32 frames end to end and the feet never
  // move. This is the cheapest gesture in the game and it should look it.
  summonLow: {
    dur: 0.53, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmR: [-30, -20, -12], LoArmR: [-96, -40, 0], HandR: [-20, -50, 0], Head: [2, -6, 0] }, 'in'),
      K(0.20, { UpArmR: [-62, -6, -6], LoArmR: [-52, 0, 0], HandR: [-56, -20, 0], Chest: [1, -6, 0], Head: [3, -8, 0] }, 'snap'),
      K(0.36, { UpArmR: [-60, -6, -6], LoArmR: [-54, 0, 0], HandR: [-58, -20, 0], Head: [3, -8, 0] }, 'hold'),
      K(0.53, {}, 'out')
    ]
  },

  // ---- RT · SUMMON SPECIAL-GRADE ------------------------------------------
  // THE GRAND CAST. Longer, two-handed, and the one moment before the ultimate
  // where his posture actually opens: both arms sweep out and up to shoulder
  // width, palms turned out, head tilted back a fraction — and then he HOLDS
  // it, wide open and completely undefended, for most of a second while the
  // special grade climbs out. That hold is the vulnerability the config
  // charges him for, and it has to be legible from across the arena.
  summonGrand: {
    dur: 1.22, loop: false, keys: [
      K(0, {}),
      // the gather: hands drawn in to the sternum, head down
      K(0.16, { UpArmL: [-26, 40, 14], LoArmL: [-118, 56, 0], HandL: [-20, 60, 0], UpArmR: [-24, -38, -15], LoArmR: [-120, -54, 0], HandR: [-20, -60, 0], Chest: [8, -4, 0], Spine: [6, -3, 0], Head: [12, -3, 0], Neck: [6, 0, 0], Hips_pos: [0, -0.055, 0], ThighL: [-16, -3, 0], ShinL: [18, 0, 0], ThighR: [12, 4, 0], ShinR: [20, 0, 0] }, 'in'),
      // the opening — wide, palms out, chin up. Completely exposed.
      K(0.40, { UpArmL: [-96, 20, 46], LoArmL: [-30, 0, 6], HandL: [-80, 40, 0], UpArmR: [-94, -18, -47], LoArmR: [-28, 0, -6], HandR: [-80, -40, 0], Chest: [-10, 0, 0], Spine: [-7, 0, 0], Neck: [-6, 0, 0], Head: [-14, 0, 0], Hips_pos: [0, -0.010, 0], ThighL: [-8, -3, 0], ShinL: [8, 0, 0], ThighR: [6, 4, 0], ShinR: [9, 0, 0] }, 'out'),
      // THE HOLD. Nothing moves for half a second. This is the whole cast.
      K(0.92, { UpArmL: [-98, 20, 47], LoArmL: [-29, 0, 6], UpArmR: [-96, -18, -48], LoArmR: [-27, 0, -6], Chest: [-11, 0, 0], Head: [-15, 0, 0], Hips_pos: [0, -0.008, 0] }, 'hold'),
      // and he simply lowers his hands. No recovery stagger.
      K(1.22, {}, 'out')
    ]
  },

  // ---- REABSORB ------------------------------------------------------------
  // Recalling a wounded curse. One hand OPENS toward it and then CLOSES into a
  // fist and draws back to the chest — a pulling-in gesture, the exact inverse
  // of the summon. Short, because pulling one out has to be cheap enough to be
  // worth doing under pressure.
  reabsorb: {
    dur: 0.62, loop: false, keys: [
      K(0, {}),
      K(0.10, { UpArmL: [-74, 10, 12], LoArmL: [-26, 0, 4], HandL: [-70, 40, 0], Head: [2, -12, 0], Chest: [2, -8, 0] }, 'out'),
      K(0.22, { UpArmL: [-72, 10, 12], LoArmL: [-28, 0, 4], HandL: [-70, 40, 0] }, 'hold'),
      // the close and the draw-back
      K(0.36, { UpArmL: [-22, 30, 10], LoArmL: [-108, 46, 0], HandL: [-14, 30, 0], Chest: [6, -6, 0], Spine: [4, -3, 0], Head: [6, -6, 0], Hips_pos: [0, -0.038, 0] }, 'snap'),
      K(0.44, { UpArmL: [-22, 30, 10], LoArmL: [-110, 46, 0], Chest: [6, -6, 0] }, 'hold'),
      K(0.62, {}, 'out')
    ]
  },

  // ---- B · THE CURSE WHEEL ---------------------------------------
  // Held-open selector pose. Same interaction shape as Megumi's shikigami
  // wheel, so it gets the same kind of pose: one hand raised and OPEN, held
  // still, while the radial runs. Loops for as long as it is held.
  wheel: {
    dur: 1.0, loop: true, keys: [
      K(0, { UpArmR: [-84, -4, -8], LoArmR: [-38, 0, -4], HandR: [-74, -20, 0], Chest: [2, -8, 0], Head: [-2, -8, 0], Neck: [-2, 0, 0], Hips_pos: [0, -0.030, 0] }),
      K(0.5, { UpArmR: [-88, -4, -8], LoArmR: [-34, 0, -4], HandR: [-78, -20, 0], Chest: [3, -8, 0], Head: [-3, -8, 0], Hips_pos: [0, -0.034, 0] }),
      K(1.0, { UpArmR: [-84, -4, -8], LoArmR: [-38, 0, -4], HandR: [-74, -20, 0], Chest: [2, -8, 0], Head: [-2, -8, 0], Hips_pos: [0, -0.030, 0] })
    ]
  },

  // ---- D-pad Right · MAXIMUM: UZUMAKI -------------------------------------
  // 極ノ番・うずまき. The ONE clip where he commits, and the only one in his
  // set where his feet leave the ground he was standing on.
  //
  // Three beats, and they must read in order even at speed:
  //   1 THE COMPRESSION — both arms sweep in and DOWN to a point in front of
  //     his sternum, the whole body folding around it. Everything he has left
  //     is being crushed into a sphere between his hands.
  //   2 THE HOLD — one beat of absolute stillness, hunched over it. Compare
  //     the hold in `summonGrand`: that one is open and this one is CLOSED,
  //     and the difference is the difference between calling something and
  //     killing it.
  //   3 THE RELEASE — he straightens and drives both palms forward with a
  //     hard step through, and then he is left standing there with his hands
  //     empty. The final key deliberately settles LOW and slightly forward of
  //     stance: after this he has nothing and the posture says so.
  ult: {
    dur: 1.95, loop: false, keys: [
      K(0, {}),
      // 1 the compression
      K(0.26, { UpArmL: [-100, 24, 40], LoArmL: [-36, 0, 6], HandL: [-70, 50, 0], UpArmR: [-98, -22, -41], LoArmR: [-34, 0, -6], HandR: [-70, -50, 0], Chest: [-8, 0, 0], Spine: [-6, 0, 0], Head: [-10, 0, 0], Hips_pos: [0, -0.010, 0] }, 'in'),
      K(0.58, { UpArmL: [-56, 34, 20], LoArmL: [-104, 44, 0], HandL: [-40, 34, 0], UpArmR: [-54, -32, -21], LoArmR: [-106, -42, 0], HandR: [-40, -34, 0], Chest: [20, 0, 0], Spine: [14, 0, 0], Neck: [8, 0, 0], Head: [16, 0, 0], Hips: [0, 6, 0], Hips_pos: [0, -0.085, 0], ThighL: [-26, -3, 0], ShinL: [30, 0, 0], ThighR: [20, 4, 0], ShinR: [34, 0, 0] }, 'snap'),
      // 2 the hold. Hunched over it, and it lasts long enough to be a decision.
      K(1.02, { UpArmL: [-55, 35, 20], LoArmL: [-105, 44, 0], UpArmR: [-53, -33, -21], LoArmR: [-107, -42, 0], Chest: [21, 0, 0], Spine: [15, 0, 0], Head: [17, 0, 0], Hips_pos: [0, -0.090, 0], ThighL: [-27, -3, 0], ShinL: [31, 0, 0], ThighR: [21, 4, 0], ShinR: [35, 0, 0] }, 'hold'),
      // 3 the release — the one step he takes all match
      K(1.24, { UpArmL: [-88, 6, 6], LoArmL: [-8, 0, 2], HandL: [-84, 10, 0], UpArmR: [-86, -4, -7], LoArmR: [-6, 0, -2], HandR: [-84, -10, 0], Chest: [-4, 0, 0], Spine: [4, 0, 0], Neck: [-4, 0, 0], Head: [-6, 0, 0], Hips: [0, 2, 0], Hips_pos: [0, -0.070, 0.10], ThighL: [-44, -3, 0], ShinL: [30, 0, 0], FootL: [-8, -6, 0], ThighR: [28, 4, 0], ShinR: [46, 0, 0], FootR: [16, 5, 0] }, 'snap'),
      K(1.46, { UpArmL: [-86, 6, 6], LoArmL: [-10, 0, 2], UpArmR: [-84, -4, -7], LoArmR: [-8, 0, -2], Chest: [-4, 0, 0], Hips_pos: [0, -0.072, 0.10] }, 'hold'),
      // empty-handed. Lower than stance, and it stays there.
      K(1.95, { UpArmL: [-16, 12, 8], LoArmL: [-52, 16, 0], HandL: [-6, 20, 0], UpArmR: [-14, -10, -9], LoArmR: [-54, -14, 0], HandR: [-6, -20, 0], Chest: [8, -4, 0], Spine: [6, -3, 0], Head: [6, -3, 0], Hips_pos: [0, -0.060, 0.02], ThighL: [-12, -3, 0], ShinL: [14, 0, 0], ThighR: [9, 4, 0], ShinR: [15, 0, 0] }, 'out')
    ]
  },

  // VICTORY — he re-clasps his hands and inclines his head very slightly. The
  // most understated win pose in the game, and the most insufferable.
  // ---- TAUNT — "MONKEYS." -------------------------------------------------
  // Authored in his idiom: eased keys, tiny amplitudes, almost nothing moves.
  // He unclasps his hands, opens one palm in front of him, and REGARDS what is
  // sitting in it — the cursed-spirit ball he is famous for having to swallow.
  // The distaste crosses his face and is gone. He closes the hand, the arm
  // falls, and the head comes up with the faintest smile on the word.
  //
  // The largest single value in this clip is 34 degrees. That restraint is the
  // characterisation: he is the one person in this roster who would consider a
  // taunt beneath him, and does it anyway.
  taunt: {
    dur: 3.4, loop: false, keys: [
      K(0, {}),
      // the hands unclasp — the right turns over, palm up
      K(0.50, {
        UpArmR: [-34, -18, -14], LoArmR: [-70, -30, 0], HandR: [10, -20, 0],
        UpArmL: [-10, 14, 6], LoArmL: [-60, 40, 0],
        Chest: [2, -6, 0], Spine: [3, -4, 0], Head: [4, -6, 0], Neck: [2, -2, 0]
      }, 'in'),
      // and he looks at it. Head down a few degrees, and that is all.
      K(1.05, {
        UpArmR: [-46, -14, -12], LoArmR: [-84, -26, 0], HandR: [14, -16, 0],
        UpArmL: [-11, 14, 6], LoArmL: [-62, 40, 0],
        Chest: [4, -5, 0], Spine: [4, -3, 0], Head: [11, -5, 0], Neck: [5, -2, 0]
      }, 'out'),
      // the distaste: a fractional turn away, and back
      K(1.55, {
        UpArmR: [-46, -14, -12], LoArmR: [-84, -26, 0], HandR: [14, -16, 0],
        Chest: [4, -9, 0], Head: [10, -14, 2], Neck: [4, -5, 0],
        UpArmL: [-11, 14, 6], LoArmL: [-62, 40, 0]
      }, 'hold'),
      // the hand CLOSES and falls, and the head comes up
      K(1.95, {
        UpArmR: [-16, -14, -9], LoArmR: [-88, -46, 0], HandR: [-10, -40, 0],
        UpArmL: [-13, 15, 7], LoArmL: [-82, 48, 0],
        Chest: [0, -4, 0], Spine: [1, -3, 0], Head: [-3, -3, 0], Neck: [-1, -1, 0]
      }, 'out'),
      // the smile. Nothing moves but two degrees of neck and the chin.
      K(2.40, {
        UpArmR: [-13, -14, -9], LoArmR: [-88, -48, 0],
        UpArmL: [-14, 16, 8], LoArmL: [-84, 52, 0],
        Chest: [0, -4, 0], Head: [-6, -1, 0], Neck: [-2, 0, 0]
      }, 'hold'),
      K(3.4, {}, 'out')
    ]
  },
  victory: {
    dur: 2.6, loop: false, keys: [
      K(0, {}),
      K(0.5, { Chest: [4, -6, 0], Head: [8, -4, 0], Neck: [4, 0, 0], Hips_pos: [0, -0.026, 0] }, 'out'),
      K(1.0, { Chest: [3, -5, 0], Head: [6, -3, 0] }, 'hold'),
      K(1.6, { Chest: [1, -3, 0], Head: [-2, -3, 0], Neck: [-2, 0, 0] }, 'in'),
      K(2.6, {}, 'out')
    ]
  }
};
