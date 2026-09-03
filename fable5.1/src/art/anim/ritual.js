// THE MAHORAGA SUMMONING RITUAL — Megumi's clips.
//
// These live in their own file rather than in megumi.js because they belong to
// the ritual feature, not to his normal kit: he can go a whole match without
// ever playing one. They are merged into his clip set in anim/index.js.
//
// ---------------------------------------------------------------------------
// WHAT THE SOURCE ACTUALLY SAYS (researched, see the notes in the deliverable)
// ---------------------------------------------------------------------------
// Mahoraga is the ONE Ten Shadows shikigami that cannot be called with the
// ordinary shadow-puppet hand sign. It needs a ritual and a spoken incantation:
//
//     布瑠部 由良由良       FURUBE  YURA YURA
//     この宝をもって…       "With this treasure, I summon…"
//     八握剣異戒神将魔虚羅   "Eight-Handled Sword Divergent Sila Divine General,
//                          Mahoraga"
//
// The 布瑠の言 (furu no koto) chant it is quoting is the Ten Sacred Treasures
// liturgy — a revival rite. That is the text, verbatim, and it is what the
// subtitles say.
//
// WHAT IS AUTHORED HERE. The source does not enumerate a fixed chain of named
// mudras the way a domain does; it shows a ritual gesture and the incantation.
// So the EIGHT signs below are a deliberate invention on a canon frame: eight,
// one per handle of the Eight-Handled Sword and one per spoke of the wheel,
// and each one is a real Buddhist mudra (the ritual is Buddhist to its bones),
// ending on the gesture the source does show — the hands driven apart and down
// as the shadow opens. The count and the ORDER are mine; the mudras and the
// incantation are not.
//
//   1 GASSHŌ        合掌      palms pressed flat, fingertips up at the chest
//   2 CHIKEN-IN     智拳印     wisdom-fist: right fist closed over the left index
//   3 KONGŌ-GASSHŌ  金剛合掌   fingers interlocked, palms sprung apart
//   4 HŌ            宝        both palms cupped open and upward — "this treasure"
//   5 TŌ            刀        sword: two fingers vertical, off hand at the wrist
//   6 SHA           捨        wrists crossed hard in front of the chest
//   7 RIN           臨        both palms driven down toward the ground
//   8 KAI           開        the clap — and the floor opens
//
// RHYTHM. The gaps between signs are 0.62 · 0.56 · 0.48 · 0.40 · 0.34 · 0.28 ·
// 0.22 s. It accelerates all the way in, which is the whole reason to author
// the eight of them as one clip instead of eight: the tempo is the animation.
const K = (t, pose, e) => ({ t, pose, e });

// The director reads these to time its cuts and its per-sign percussion. Index
// i is the frame the sign LANDS on. Keep in step with ritualSigns below.
export const SIGN_TIMES = [0.00, 0.62, 1.18, 1.66, 2.06, 2.40, 2.68, 2.90];
export const SIGN_NAMES = [
  ['合掌', 'GASSHŌ'], ['智拳印', 'CHIKEN-IN'], ['金剛合掌', 'KONGŌ-GASSHŌ'], ['宝', 'HŌ'],
  ['刀', 'TŌ'], ['捨', 'SHA'], ['臨', 'RIN'], ['開', 'KAI']
];
export const SIGN_COUNT = SIGN_TIMES.length;

export const RITUAL_CLIPS = {
  // The eight signs, in one clip, at the authored tempo. Every sign is a
  // 'snap' landing followed by a 'hold' — the pose arrives hard and then sits
  // dead still for the rest of its beat. That stillness between the snaps is
  // what the hard cuts are cut against.
  ritualSigns: {
    dur: 3.30, loop: false, keys: [
      // 1 GASSHŌ
      K(0.00, {
        UpArmL: [-72, -20, 8], LoArmL: [-96, -22, 0], HandL: [-46, 20, 0],
        UpArmR: [-70, 18, -10], LoArmR: [-94, 20, 0], HandR: [-46, -20, 0],
        Chest: [4, -8, 0], Spine: [5, -6, 0], Neck: [2, -2, 0], Head: [8, -6, 0],
        Hips_pos: [0, -0.06, 0]
      }, 'snap'),
      K(0.46, {
        UpArmL: [-73, -20, 8], LoArmL: [-97, -22, 0], UpArmR: [-71, 18, -10], LoArmR: [-95, 20, 0],
        Chest: [4, -8, 0], Head: [8, -6, 0], Hips_pos: [0, -0.06, 0]
      }, 'hold'),

      // 2 CHIKEN-IN — elbows thrown wide, the fist closing over the index
      K(0.62, {
        UpArmL: [-58, -34, 26], LoArmL: [-110, -30, 0], HandL: [-30, 34, 0],
        UpArmR: [-52, 30, -28], LoArmR: [-116, 28, 0], HandR: [-20, -50, 0],
        Chest: [2, -10, 0], Spine: [4, -7, 0], Head: [10, -8, 0], Hips_pos: [0, -0.075, 0]
      }, 'snap'),
      K(1.04, {
        UpArmL: [-58, -34, 26], LoArmL: [-110, -30, 0], UpArmR: [-52, 30, -28], LoArmR: [-116, 28, 0],
        Chest: [2, -10, 0], Head: [10, -8, 0], Hips_pos: [0, -0.075, 0]
      }, 'hold'),

      // 3 KONGŌ-GASSHŌ — interlocked, palms sprung apart, head down over them
      K(1.18, {
        UpArmL: [-46, -10, 12], LoArmL: [-124, -14, 0], HandL: [-58, 10, 0],
        UpArmR: [-44, 8, -14], LoArmR: [-126, 12, 0], HandR: [-58, -10, 0],
        Chest: [11, -10, 0], Spine: [10, -8, 0], Neck: [4, -2, 0], Head: [16, -8, 0],
        Hips_pos: [0, -0.09, 0]
      }, 'snap'),
      K(1.52, {
        UpArmL: [-46, -10, 12], LoArmL: [-124, -14, 0], UpArmR: [-44, 8, -14], LoArmR: [-126, 12, 0],
        Chest: [11, -10, 0], Head: [16, -8, 0], Hips_pos: [0, -0.09, 0]
      }, 'hold'),

      // 4 HŌ — "with this treasure". Palms open and UP at the waist. This is
      // the one sign that opens instead of closing, and the incantation lands
      // on it.
      K(1.66, {
        UpArmL: [-24, -14, 16], LoArmL: [-104, -20, 0], HandL: [12, 6, 0],
        UpArmR: [-22, 12, -18], LoArmR: [-102, 18, 0], HandR: [12, -6, 0],
        Chest: [-5, -8, 0], Spine: [-3, -6, 0], Neck: [-3, -2, 0], Head: [-6, -6, 0],
        Hips_pos: [0, -0.05, 0]
      }, 'snap'),
      K(1.94, {
        UpArmL: [-24, -14, 16], LoArmL: [-104, -20, 0], UpArmR: [-22, 12, -18], LoArmR: [-102, 18, 0],
        Chest: [-5, -8, 0], Head: [-6, -6, 0], Hips_pos: [0, -0.05, 0]
      }, 'hold'),

      // 5 TŌ — the sword. Right hand vertical, two fingers up; left flat at
      // the wrist. The sharpest silhouette of the eight.
      K(2.06, {
        UpArmR: [-88, -6, 4], LoArmR: [-16, 0, 0], HandR: [-6, -10, 0],
        UpArmL: [-64, -18, 14], LoArmL: [-86, -20, 0], HandL: [-30, 40, 0],
        Chest: [2, -12, 0], Spine: [4, -8, 0], Head: [4, -12, 0], Hips_pos: [0, -0.07, 0]
      }, 'snap'),
      K(2.28, {
        UpArmR: [-88, -6, 4], LoArmR: [-16, 0, 0], UpArmL: [-64, -18, 14], LoArmL: [-86, -20, 0],
        Chest: [2, -12, 0], Head: [4, -12, 0], Hips_pos: [0, -0.07, 0]
      }, 'hold'),

      // 6 SHA — wrists crossed hard
      K(2.40, {
        UpArmL: [-64, 26, 34], LoArmL: [-96, 38, 0], HandL: [-24, 60, 0],
        UpArmR: [-60, -24, -36], LoArmR: [-94, -36, 0], HandR: [-24, -60, 0],
        Chest: [-7, -8, 0], Spine: [-4, -6, 0], Head: [-6, -6, 0], Hips_pos: [0, -0.055, 0]
      }, 'snap'),
      K(2.58, {
        UpArmL: [-64, 26, 34], LoArmL: [-96, 38, 0], UpArmR: [-60, -24, -36], LoArmR: [-94, -36, 0],
        Chest: [-7, -8, 0], Hips_pos: [0, -0.055, 0]
      }, 'hold'),

      // 7 RIN — both palms driven at the floor, knees deep
      K(2.68, {
        UpArmL: [-8, -6, 34], LoArmL: [-24, -8, 0], HandL: [-84, 0, 0],
        UpArmR: [-6, 4, -36], LoArmR: [-22, 6, 0], HandR: [-84, 0, 0],
        Chest: [16, -10, 0], Spine: [20, -8, 0], Head: [18, -8, 0], Hips_pos: [0, -0.22, 0],
        ThighL: [-30, -5, 0], ShinL: [34, 0, 0], ThighR: [24, 7, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      K(2.82, {
        UpArmL: [-8, -6, 34], LoArmL: [-24, -8, 0], UpArmR: [-6, 4, -36], LoArmR: [-22, 6, 0],
        Chest: [16, -10, 0], Hips_pos: [0, -0.22, 0],
        ThighL: [-30, -5, 0], ShinL: [34, 0, 0], ThighR: [24, 7, 0], ShinR: [38, 0, 0]
      }, 'hold'),

      // 8 KAI — the clap. He comes UP out of the crouch onto the balls of his
      // feet and the palms meet in front of his face. The hard white flash in
      // the cutscene lands on this exact frame.
      K(2.90, {
        UpArmL: [-92, -8, 4], LoArmL: [-12, -4, 0], HandL: [-20, 8, 0],
        UpArmR: [-90, 6, -4], LoArmR: [-10, 4, 0], HandR: [-20, -8, 0],
        Chest: [-12, -8, 0], Spine: [-8, -6, 0], Neck: [-5, -2, 0], Head: [-14, -6, 0],
        Hips_pos: [0, 0.03, 0],
        ThighL: [-6, -5, 0], ShinL: [6, 0, 0], ThighR: [4, 7, 0], ShinR: [8, 0, 0],
        FootL: [22, -14, 0], FootR: [26, 9, 0]
      }, 'snap'),
      K(3.30, {
        UpArmL: [-93, -8, 4], LoArmL: [-13, -4, 0], UpArmR: [-91, 6, -4], LoArmR: [-11, 4, 0],
        Chest: [-12, -8, 0], Head: [-14, -6, 0], Hips_pos: [0, 0.03, 0],
        FootL: [22, -14, 0], FootR: [26, 9, 0]
      }, 'hold')
    ]
  },

  // THE CALL — the incantation is spoken over this. The clapped hands are
  // wrenched apart and driven down, and the shadow goes out from under him.
  // He ends braced with both arms out and low, holding the gate open.
  ritualCall: {
    dur: 2.6, loop: false, keys: [
      K(0, {
        UpArmL: [-92, -8, 4], LoArmL: [-12, -4, 0], HandL: [-20, 8, 0],
        UpArmR: [-90, 6, -4], LoArmR: [-10, 4, 0], HandR: [-20, -8, 0],
        Chest: [-12, -8, 0], Head: [-14, -6, 0], Hips_pos: [0, 0.03, 0]
      }),
      // the pull apart — slow, like the air is thick
      K(0.62, {
        UpArmL: [-80, -30, 30], LoArmL: [-40, -18, 0], HandL: [-50, 20, 0],
        UpArmR: [-78, 28, -32], LoArmR: [-38, 16, 0], HandR: [-50, -20, 0],
        Chest: [-6, -8, 0], Spine: [-4, -6, 0], Head: [-8, -6, 0], Hips_pos: [0, -0.04, 0]
      }, 'in'),
      // DRIVEN DOWN — the gate opens on this frame
      K(0.86, {
        UpArmL: [-12, -10, 46], LoArmL: [-20, -6, 0], HandL: [-86, 0, 0],
        UpArmR: [-10, 8, -48], LoArmR: [-18, 4, 0], HandR: [-86, 0, 0],
        Chest: [24, -8, 0], Spine: [26, -7, 0], Neck: [8, -2, 0], Head: [22, -8, 0],
        Hips_pos: [0, -0.30, 0],
        ThighL: [-40, -5, 0], ShinL: [46, 0, 0], ThighR: [32, 7, 0], ShinR: [50, 0, 0]
      }, 'snap'),
      K(1.30, {
        UpArmL: [-14, -10, 44], LoArmL: [-22, -6, 0], UpArmR: [-12, 8, -46], LoArmR: [-20, 4, 0],
        Chest: [24, -8, 0], Head: [22, -8, 0], Hips_pos: [0, -0.30, 0],
        ThighL: [-40, -5, 0], ShinL: [46, 0, 0], ThighR: [32, 7, 0], ShinR: [50, 0, 0]
      }, 'hold'),
      // he straightens and looks UP as the wheel comes out of the floor
      K(1.90, {
        UpArmL: [-20, -6, 34], LoArmL: [-46, -8, 0], UpArmR: [-18, 4, -36], LoArmR: [-44, 6, 0],
        Chest: [-14, -10, 0], Spine: [-10, -8, 0], Neck: [-10, -2, 0], Head: [-26, -8, 0],
        Hips_pos: [0, -0.08, 0],
        ThighL: [-14, -5, 0], ShinL: [16, 0, 0], ThighR: [10, 7, 0], ShinR: [20, 0, 0]
      }, 'out'),
      K(2.6, {
        UpArmL: [-18, 2, 26], LoArmL: [-58, 6, 0], UpArmR: [-16, -2, -28], LoArmR: [-56, -6, 0],
        Chest: [-12, -12, 0], Neck: [-11, -3, 0], Head: [-30, -10, 0], Hips_pos: [0, -0.06, 0]
      }, 'hold')
    ]
  },

  // Held while the camera tilts up past him. He is staring at something four
  // times his height and the pose has to be small.
  ritualWatch: {
    dur: 2.4, loop: true, keys: [
      K(0, {
        UpArmL: [-18, 2, 26], LoArmL: [-58, 6, 0], UpArmR: [-16, -2, -28], LoArmR: [-56, -6, 0],
        Chest: [-12, -12, 0], Neck: [-11, -3, 0], Head: [-30, -10, 0], Hips_pos: [0, -0.06, 0]
      }),
      K(1.2, {
        UpArmL: [-16, 2, 24], LoArmL: [-60, 6, 0], UpArmR: [-14, -2, -26], LoArmR: [-58, -6, 0],
        Chest: [-13, -12, 0], Head: [-32, -10, 0], Hips_pos: [0, -0.045, 0]
      }),
      K(2.4, {
        UpArmL: [-18, 2, 26], LoArmL: [-58, 6, 0], UpArmR: [-16, -2, -28], LoArmR: [-56, -6, 0],
        Chest: [-12, -12, 0], Head: [-30, -10, 0], Hips_pos: [0, -0.06, 0]
      })
    ]
  }
};
