// SUKUNA IN A VESSEL — the two-arm clip set.
//
// THE PROBLEM. Sukuna's own clips (anim/sukuna.js) drive four arms, and his
// cosmetic variants are Yuji's and Megumi's bodies, which have two. Playing
// the four-arm set on a two-arm rig is SAFE — AnimPlayer skips a bone the
// model does not have — but "safe" is not the bar: the upper pair leads in
// every clip, so most of them read fine on two arms, and a handful lean on the
// lower pair for the actual shape of the move and read as half a gesture.
//
// THE FIX, in two parts:
//   1. STRIP. `twoArm()` rebuilds every clip with the `*2` bone tracks removed,
//      so a vessel's clip set genuinely does not mention arms it does not have
//      rather than relying on a lookup miss.
//   2. RE-AUTHOR. The four clips below are the ones where the lower pair was
//      carrying the read. Each is rewritten so the two remaining arms perform
//      the whole action:
//        · ct1 (DISMANTLE)  the crossing slash was upper-right one way and
//                           lower-left the other. Now the SAME arm crosses
//                           back through, so the X is still an X.
//        · getup            the lower pair planted and pushed him up. Now the
//                           upper pair does it, which is what a two-armed
//                           body would obviously do.
//        · execEscape       both lower arms slammed the floor to throw him
//                           clear. Now it is a one-armed floor push.
//        · punch1           the layered lower-right rake is gone, so the
//                           upper-left rake gets a follow-through of its own
//                           rather than ending on a beat that had a second
//                           arm in it.
// Everything else is the stripped four-arm clip, unchanged, because the upper
// pair was already doing the whole job in it.
import { SUKUNA_CLIPS, SUKUNA_STANCE } from './sukuna.js';

const K = (t, pose, e) => ({ t, pose, e });
const LOWER = /^(Clav|UpArm|LoArm|Hand)[LR]2$/;

function stripPose(pose) {
  const out = {};
  for (const k of Object.keys(pose)) if (!LOWER.test(k)) out[k] = pose[k];
  return out;
}
function twoArm(clips) {
  const out = {};
  for (const [name, def] of Object.entries(clips)) {
    out[name] = { ...def, keys: def.keys.map(k => ({ ...k, pose: stripPose(k.pose) })) };
  }
  return out;
}

// STANCE: the same posture with the lower pair removed, and the upper pair
// opened out a little to fill the silhouette they used to occupy.
export const SUKUNA_VESSEL_STANCE = (() => {
  const s = { ...SUKUNA_STANCE };
  for (const k of Object.keys(s)) if (LOWER.test(k)) delete s[k];
  s.UpArmL = [-18, 8, 14];
  s.UpArmR = [-12, -6, -16];
  s.LoArmL = [-72, 22, 0];
  s.LoArmR = [-78, -20, 0];
  return s;
})();

const S = SUKUNA_VESSEL_STANCE;

export const SUKUNA_VESSEL_CLIPS = {
  ...twoArm(SUKUNA_CLIPS),

  // DISMANTLE on two arms: the crossing slash is one hand going out and back
  // across the body, so the cut still reads as a cross rather than a swipe.
  ct1: {
    dur: 0.85, loop: false, keys: [
      K(0, {}),
      K(0.18, {
        UpArmR: [-70, -18, -22], LoArmR: [-60, -14, 0], HandR: [-20, -70, 0],
        UpArmL: [-26, 10, 18], LoArmL: [-84, 20, 0],
        Chest: [-3, -18, 0], Hips: [0, 28, 0], Head: [-6, -10, 0]
      }, 'in'),
      // out — the first stroke
      K(0.30, {
        UpArmR: [-96, 22, 6], LoArmR: [-10, 0, 0], HandR: [-40, -30, 0],
        UpArmL: [-20, 10, 14], LoArmL: [-70, 20, 0],
        Chest: [-1, 16, 0], Spine: [0, 10, 0], Hips: [0, 8, 0], Head: [-2, -14, 0]
      }, 'snap'),
      // and back through it — the second stroke completes the X
      K(0.42, {
        UpArmR: [-64, -34, -18], LoArmR: [-22, -10, 0], HandR: [-30, -100, 0],
        Chest: [-3, -14, 0], Spine: [-1, -8, 0], Hips: [0, 30, 0], Head: [-5, -6, 0]
      }, 'snap'),
      K(0.50, { UpArmR: [-62, -34, -18], LoArmR: [-24, -10, 0], Chest: [-3, -14, 0] }, 'hold'),
      K(0.85, {}, 'out')
    ]
  },

  // getup: the two arms he has plant and push.
  getup: {
    dur: 0.6, loop: false, keys: [
      K(0, {
        Hips: [-80, 4, 0], Hips_pos: [0, -0.72, -0.14],
        ThighL: [-12, -4, 0], ShinL: [8, 0, 0], ThighR: [-6, 6, 0], ShinR: [14, 0, 0],
        UpArmL: [-34, 0, 60], UpArmR: [-24, 0, -64]
      }),
      K(0.28, {
        Hips: [-30, 14, 0], Hips_pos: [0, -0.34, -0.05], Spine: [24, -6, 0],
        ThighL: [-38, -4, 0], ShinL: [66, 0, 0], ThighR: [28, 6, 0], ShinR: [76, 0, 0],
        UpArmL: [-88, 10, 30], LoArmL: [-34, 16, 0], HandL: [-50, 40, 0],
        UpArmR: [-82, -8, -32], LoArmR: [-38, -14, 0], HandR: [-50, -40, 0]
      }, 'in'),
      K(0.44, {
        Hips: [-12, 18, 0], Hips_pos: [0, -0.16, 0], Spine: [16, -6, 0],
        UpArmL: [-40, 10, 22], LoArmL: [-70, 18, 0], UpArmR: [-34, -8, -24], LoArmR: [-76, -16, 0],
        ThighL: [-42, -4, 0], ShinL: [52, 0, 0], ThighR: [16, 6, 0], ShinR: [40, 0, 0]
      }),
      K(0.6, {}, 'out')
    ]
  },

  // exec escape: one arm on the floor, the leg does the rest.
  execEscape: {
    dur: 0.85, loop: false, keys: [
      K(0, {
        Hips: [-16, 14, 0], Hips_pos: [0, -0.42, 0.02], Spine: [22, -6, 0], Chest: [16, -8, 0],
        Head: [-14, -4, 0], ThighL: [-84, -6, 0], ShinL: [96, 0, 0], ThighR: [-30, 8, 0], ShinR: [112, 0, 0],
        UpArmL: [-40, 10, 30], LoArmL: [-40, 0, 6], UpArmR: [-92, -14, -26], LoArmR: [-78, 0, -6]
      }),
      K(0.10, {
        Hips: [-24, 16, 0], Hips_pos: [0, -0.50, 0.06], Spine: [30, -6, 0], Head: [-6, -4, 0],
        ThighL: [-108, -6, 0], ShinL: [120, 0, 0], ThighR: [-40, 8, 0], ShinR: [126, 0, 0],
        UpArmL: [-96, 12, 26], LoArmL: [-20, 0, 6], HandL: [-70, 30, 0],
        UpArmR: [-40, -14, -30], LoArmR: [-70, 0, -6]
      }, 'in'),
      K(0.22, {
        Hips: [-34, 12, 0], Hips_pos: [0, -0.40, -0.06], Spine: [-10, -4, 0], Chest: [-14, -6, 0],
        Head: [-20, 0, 0], Neck: [-8, 0, 0],
        ThighL: [-128, -4, 0], ShinL: [10, 0, 0], FootL: [-24, -8, 0],
        ThighR: [-30, 8, 0], ShinR: [104, 0, 0],
        UpArmL: [-104, 10, 22], LoArmL: [-10, 0, 6], HandL: [-80, 20, 0],
        UpArmR: [-16, -6, -58], LoArmR: [-18, 0, -6]
      }, 'snap'),
      K(0.30, {
        Hips: [-34, 12, 0], Hips_pos: [0, -0.40, -0.06], ThighL: [-126, -4, 0], ShinL: [12, 0, 0],
        Spine: [-10, -4, 0], Head: [-19, 0, 0], UpArmL: [-102, 10, 22]
      }, 'hold'),
      K(0.58, {
        Hips: [-6, 20, 0], Hips_pos: [0, -0.16, 0], Spine: [14, -6, 0], Chest: [10, -9, 0],
        Head: [4, -8, 0], ThighL: [-40, -4, 0], ShinL: [54, 0, 0], ThighR: [14, 6, 0], ShinR: [40, 0, 0],
        UpArmL: [-58, 12, 22], LoArmL: [-92, 0, 6], UpArmR: [-50, -10, -24], LoArmR: [-98, 0, -6]
      }, 'out'),
      K(0.85, {}, 'out')
    ]
  },

  // punch 1: the rake gets its own follow-through now that nothing is layering
  // underneath it.
  punch1: {
    dur: 0.317, loop: false, keys: [
      K(0, {}),
      K(0.05, {
        UpArmL: [-34, 12, 18], LoArmL: [-84, 20, 0], HandL: [-14, 70, 0],
        Chest: [-2, -18, 0], Hips: [0, 26, 0]
      }, 'in'),
      K(0.083, {
        UpArmL: [-80, -8, -6], LoArmL: [-8, 0, 0], HandL: [-4, 100, 0],
        Chest: [-1, 12, 0], Hips: [0, 10, 0], Spine: [0, 6, 0], Head: [-4, -12, 0],
        UpArmR: [-14, -6, -18], LoArmR: [-76, -20, 0]
      }, 'snap'),
      K(0.117, { UpArmL: [-80, -8, -6], LoArmL: [-10, 0, 0], Chest: [-1, 12, 0], Hips: [0, 10, 0] }, 'hold'),
      // the raking follow-through across the body
      K(0.18, {
        UpArmL: [-58, -30, 6], LoArmL: [-40, 8, 0], HandL: [-16, 60, 0],
        Chest: [-2, 2, 0], Hips: [0, 20, 0], Head: [-4, -8, 0]
      }, 'out'),
      K(0.317, {}, 'out')
    ]
  },

  // ---- TAUNT — the two-arm rewrite ----------------------------------------
  // The four-arm taunt folds the upper pair and puts the lower pair on the
  // hips. Stripped, that leaves a man crossing his arms and nothing else, which
  // is the one shape the brief specifically asked not to be repeated eighteen
  // times. So it is re-authored: ONE arm crosses the chest and the other hangs,
  // which is a lazier and more contemptuous shape than a full fold, and the
  // look down is given more of the clip because it is now carrying all of it.
  taunt: {
    dur: 3.0, loop: false, keys: [
      K(0, {}),
      // one arm across, the other simply left where it was
      K(0.55, {
        UpArmL: [-46, 34, 4], LoArmL: [-118, 56, 0], HandL: [-14, 44, 0],
        UpArmR: [4, -12, -14], LoArmR: [-52, -24, 0], HandR: [-16, -48, 0],
        Head: [-9, -4, 0], Neck: [1, -2, 0], Chest: [-4, -6, 0], Spine: [-3, -4, 0],
        Hips_pos: [0, -0.018, 0], Hips: [0, 24, 0]
      }, 'out'),
      // and the head comes down on you, and stays down
      K(1.15, {
        UpArmL: [-46, 34, 4], LoArmL: [-118, 56, 0], HandL: [-14, 44, 0],
        UpArmR: [4, -12, -14], LoArmR: [-52, -24, 0], HandR: [-16, -48, 0],
        Head: [14, 2, 0], Neck: [5, 1, 0], Chest: [-2, -5, 0], Spine: [-2, -4, 0],
        Hips_pos: [0, -0.018, 0], Hips: [0, 24, 0]
      }, 'out'),
      K(1.55, {
        UpArmL: [-46, 34, 4], LoArmL: [-118, 56, 0],
        UpArmR: [4, -12, -14], LoArmR: [-52, -24, 0],
        Head: [15, 2, 0], Neck: [5, 1, 0], Chest: [-2, -5, 0], Hips_pos: [0, -0.018, 0]
      }, 'hold'),
      // the free hand flexes once, bored, and that is the only movement left
      K(2.20, {
        UpArmL: [-46, 34, 4], LoArmL: [-118, 56, 0],
        UpArmR: [4, -12, -14], LoArmR: [-54, -24, 0], HandR: [-34, -72, 0],
        Head: [15, 2, 0], Chest: [-2, -5, 0], Hips_pos: [0, -0.018, 0]
      }),
      K(3.0, {}, 'out')
    ]
  },

  // ---- TAUNT — SUKUNA 【FUSHIGURO】 ---------------------------------------
  // "Meguna". He is wearing somebody's son, and this taunt is him ENJOYING
  // that: he raises the borrowed hand, turns it over, opens and closes the
  // fingers to check the fit, and then looks up at you entirely satisfied.
  //
  // Deliberately curious rather than contemptuous for the first two thirds —
  // the contempt only arrives on the last key, when he stops looking at the
  // hand and remembers you are there. It is the same body language Megumi's
  // own clips use for a hand sign, which is what makes it land.
  tauntMeguna: {
    dur: 3.2, loop: false, keys: [
      K(0, {}),
      // the hand comes up in front of his face — unhurried, palm toward him
      K(0.45, {
        UpArmR: [-94, -12, -18], LoArmR: [-102, -32, 0], HandR: [-6, -34, 0],
        UpArmL: [-10, 10, 8], LoArmL: [-64, 26, 0],
        Head: [6, -4, 4], Neck: [3, -2, 1], Chest: [0, -8, 0], Spine: [-1, -5, 0],
        Hips_pos: [0, -0.022, 0]
      }, 'out'),
      // he turns it over. The wrist does the work; the head follows it.
      K(1.00, {
        UpArmR: [-98, -8, -14], LoArmR: [-112, -22, 0], HandR: [8, 40, 0],
        UpArmL: [-10, 10, 8], LoArmL: [-66, 26, 0],
        Head: [12, -2, 6], Neck: [5, -1, 2], Chest: [1, -7, 0],
        Hips_pos: [0, -0.024, 0]
      }, 'out'),
      // the fingers close and open once — checking the fit
      K(1.40, {
        UpArmR: [-98, -8, -14], LoArmR: [-114, -22, 0], HandR: [-26, 62, 0],
        UpArmL: [-10, 10, 8], LoArmL: [-66, 26, 0],
        Head: [13, -2, 6], Chest: [1, -7, 0], Hips_pos: [0, -0.024, 0]
      }, 'snap'),
      K(1.75, {
        UpArmR: [-98, -8, -14], LoArmR: [-113, -22, 0], HandR: [10, 42, 0],
        UpArmL: [-10, 10, 8], LoArmL: [-66, 26, 0],
        Head: [13, -2, 6], Chest: [1, -7, 0], Hips_pos: [0, -0.024, 0]
      }, 'snap'),
      // THE TURN. He remembers you exist, and the whole face changes register:
      // hand falls, chin comes UP, and the head goes back to looking down.
      K(2.20, {
        UpArmR: [-18, -10, -12], LoArmR: [-88, -24, 0], HandR: [-20, -58, 0],
        UpArmL: [-13, 10, 8], LoArmL: [-76, 24, 0],
        Head: [12, 2, 0], Neck: [5, 1, 0], Chest: [-4, -6, 0], Spine: [-3, -5, 0],
        Hips_pos: [0, -0.016, 0], Hips: [0, 24, 0]
      }, 'out'),
      K(2.70, {
        UpArmR: [-16, -10, -12], LoArmR: [-88, -24, 0],
        UpArmL: [-13, 10, 8], LoArmL: [-77, 24, 0],
        Head: [13, 2, 0], Chest: [-4, -6, 0], Hips_pos: [0, -0.018, 0]
      }, 'hold'),
      K(3.2, {}, 'out')
    ]
  }
};
