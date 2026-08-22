// INUMAKI — the WITHDRAWN end of the roster, with one exception.
//
// THE ANIMATION BRIEF, and every clip below is written to it: "He barely moves
// and rarely commits. Everything is small and withdrawn until he speaks, and
// then it is the biggest thing on screen."
//
// So this file has two registers and nothing in between:
//
//   CLOSED   the default. HANDS IN POCKETS — genuinely, both of them, in the
//            welted pockets modelled on his jacket. Shoulders rolled forward,
//            chin down, weight rocked onto the back foot, body BLADED AWAY
//            from the opponent rather than squared to them. He is standing
//            like somebody who would rather be somewhere else, and the
//            amplitudes are the smallest in the project — smaller than Geto's,
//            which was the previous floor.
//
//   OPEN     the utterances, and only the utterances. Chin UP, body SQUARE,
//            one hand out of the pocket and thrown forward, the whole frame
//            committed. The transition between the two registers is authored
//            as a SNAP rather than an ease on purpose: the moment he decides
//            to speak should be a cut, not a blend.
//
// THE COLLAR IS NOT ANIMATED HERE. It is geometry on its own pivot driven by
// `model.setCollar`, which fx/speechfx.js runs off the utterance progress
// (see art/models/inumaki.js). That is deliberate: the collar has to answer to
// how far through the WORD he is, not to how far through the CLIP he is, and
// those two come apart the instant a command's frame data is retuned.
//
// FOUR IDLES, ONE PER STRAIN TIER. `_clip` in combat/fighter.js swaps them,
// the same way it swaps Kashimo's coiled cycles at charge tier 2. The point is
// that the OPPONENT reads his gauge off his posture from across the arena
// before they read it off the HUD — which for a character whose whole crisis
// state is invisible otherwise is not a nicety.
import { STANCE as BASE } from './base.js';

const K = (t, pose, e) => ({ t, pose, e });

// ---- STANCE ---------------------------------------------------------------
// Hands in pockets, bladed away, chin down. Both upper arms hang almost
// straight with a slight inward tuck and the forearms fold back and IN so the
// wrists finish at the hip welts; the shoulders are rolled forward (positive
// ClavX) which no other stance in the project does.
//
// `Hips: [0, 40, 0]` is the big one. The shared stance turns 24 degrees; this
// turns forty, which puts his shoulder toward the opponent and his face away
// from them. That single number is most of "he does not want to be here".
export const INUMAKI_STANCE = {
  ...BASE,
  Hips_pos: [0, -0.038, 0],
  Hips: [0, 40, 0],
  // Head rx was 9 and Neck 3, which buried his chin IN the collar and left the
  // face unreadable from the fight camera. 4 and 1 still reads as "chin down"
  // — it is a withdrawn posture, not a bowed one — and the eyes survive.
  Spine: [6, -10, 0], Chest: [7, -14, 0], Neck: [1, -6, 0], Head: [4, -12, 0],
  // hands in pockets: arms down, forearms folded back to the hips
  // The forearms fold only ~26 degrees, not 46: at 46 the hands swing clear of
  // the body and hang in front of him like a man waiting for a bus, which is
  // what the first viewer pass showed. The negative rz is what tucks the
  // elbows IN so the wrists finish AT the hip welts rather than beside them.
  ClavL: [6, 0, 0], UpArmL: [-5, 10, -5], LoArmL: [-20, 44, 0], HandL: [-10, 58, 0],
  ClavR: [6, 0, 0], UpArmR: [-3, -8, 4], LoArmR: [-18, -42, 0], HandR: [-10, -58, 0],
  // weight rocked back onto the rear foot
  ThighL: [-11, -6, 0], ShinL: [12, 0, 0], FootL: [2, -14, 0],
  ThighR: [16, 8, 0], ShinR: [24, 0, 0], FootR: [12, 10, 0]
};

// The OPEN register, factored out because four clips reach for it and they all
// have to agree about what "committed" looks like. Chin up, hips square, and
// the right hand out of the pocket.
// The wind-up shared by the heavy utterance, the ultimate and the taunt: both
// hands to the throat, the body folded over them.
const GATHER = {
  UpArmL: [-68, 16, -4], LoArmL: [-128, 58, 0], HandL: [-30, 60, 0],
  UpArmR: [-66, -14, 5], LoArmR: [-130, -56, 0], HandR: [-30, -60, 0],
  ClavL: [10, 0, 0], ClavR: [10, 0, 0],
  Spine: [12, -6, 0], Chest: [14, -8, 0], Neck: [7, -2, 0], Head: [11, -6, 0],
  Hips: [0, 26, 0], Hips_pos: [0, -0.078, 0]
};

const OPEN = {
  Hips: [0, 14, 0], Hips_pos: [0, -0.052, 0],
  Spine: [10, -4, 0], Chest: [8, -6, 0], Neck: [-4, -2, 0], Head: [-8, -4, 0],
  ClavR: [-4, 0, 0], ClavL: [2, 0, 0],
  ThighL: [-24, -4, 0], ShinL: [20, 0, 0], FootL: [-4, -8, 0],
  ThighR: [18, 6, 0], ShinR: [30, 0, 0], FootR: [12, 8, 0]
};

// ---- THE TWO HELD POSES ----------------------------------------------------
// See the note on `idleRaw`: a key that omits a bone hands that bone back to
// STANCE, so any pose that has to survive across several keys is a constant
// that every key spreads.

// RAW: the right hand comes out of the pocket and presses under the jaw.
const RAW_HOLD = {
  UpArmR: [-62, -14, 4], LoArmR: [-126, -54, 0], HandR: [-30, -58, 0],
  ClavR: [10, 0, 0],
  Neck: [6, -4, 0], Head: [10, -10, 0], Chest: [11, -12, 0], Spine: [9, -9, 0],
  Hips_pos: [0, -0.048, 0]
};

// SILENCED: both hands at the throat, folded over it, turned away.
const MUTE_HOLD = {
  UpArmL: [-72, 16, -6], LoArmL: [-134, 60, 0], HandL: [-34, 62, 0],
  UpArmR: [-70, -14, 7], LoArmR: [-136, -58, 0], HandR: [-34, -62, 0],
  ClavL: [16, 0, 0], ClavR: [16, 0, 0],
  Spine: [18, -6, 0], Chest: [20, -8, 0], Neck: [12, -2, 0], Head: [18, -6, 0],
  Hips: [0, 30, 0], Hips_pos: [0, -0.086, 0],
  ThighL: [-16, -6, 0], ShinL: [22, 0, 0], ThighR: [14, 8, 0], ShinR: [26, 0, 0]
};

export const INUMAKI_CLIPS = {
  // ---- THE FOUR IDLES -----------------------------------------------------

  // CLEAR — a slow breath and a small head drift, hands never leaving the
  // pockets. The only thing in the whole cycle with any travel is the two long
  // face locks, which are on springs and keep going after he has stopped.
  idle: {
    dur: 4.0, loop: true, keys: [
      K(0, {}),
      K(2.0, {
        Chest: [8, -14, 0], Spine: [7, -10, 0], Hips_pos: [0, -0.048, 0],
        Head: [10, -11, 0], Neck: [4, -6, 0]
      }),
      K(4.0, {})
    ]
  },

  // STRAINED — the same cycle, but he SWALLOWS twice a loop. The chin dips and
  // the neck tightens; nothing else changes. A player who has never read a
  // word of documentation will notice he keeps swallowing before they notice
  // the bar has gone orange.
  idleStrained: {
    dur: 3.6, loop: true, keys: [
      K(0, {}),
      K(0.9, { Neck: [8, -6, 0], Head: [14, -12, 0], Chest: [9, -14, 0] }, 'out'),
      K(1.15, {}, 'in'),
      K(2.2, {
        Chest: [8, -14, 0], Spine: [7, -10, 0], Hips_pos: [0, -0.048, 0], Head: [10, -11, 0]
      }),
      K(2.9, { Neck: [7, -6, 0], Head: [13, -12, 0] }, 'out'),
      K(3.15, {}, 'in'),
      K(3.6, {})
    ]
  },

  // RAW — one hand is out of the pocket now, and it is at his throat. He
  // WINCES on a slow cycle: the shoulders come up, the head drops, the free
  // hand presses under the jaw. He is still standing, but the posture has
  // stopped being "reluctant" and started being "hurt".
  //
  // NOTE THE `...RAW_HOLD` ON EVERY KEY. Every key in this system is merged
  // over the STANCE, so a bone a key does not name RETURNS TO STANCE on that
  // key — which meant the first version of this clip put his hand on his
  // throat, dropped it back to his pocket halfway through the loop, and put it
  // back. Held poses are named constants here for exactly that reason.
  idleRaw: {
    dur: 3.2, loop: true, keys: [
      K(0, { ...RAW_HOLD }),
      K(1.3, {
        ...RAW_HOLD,
        UpArmR: [-68, -14, 4], LoArmR: [-132, -54, 0],
        Neck: [12, -4, 0], Head: [19, -10, 0], Chest: [15, -12, 0], Spine: [11, -9, 0],
        ClavR: [15, 0, 0], ClavL: [12, 0, 0], Hips_pos: [0, -0.064, 0]
      }, 'out'),
      K(1.9, {
        ...RAW_HOLD,
        UpArmR: [-66, -14, 4], LoArmR: [-130, -54, 0],
        Neck: [11, -4, 0], Head: [18, -10, 0], Chest: [14, -12, 0], Hips_pos: [0, -0.060, 0]
      }, 'hold'),
      K(3.2, { ...RAW_HOLD }, 'in')
    ]
  },

  // SILENCED — the idle changes ENTIRELY, which is the brief's word. BOTH
  // hands are at the throat, he is folded over it, and he is not looking at
  // the opponent at all. This is not a fighting stance. It should look, from
  // across the arena, like a fighter who has stopped being able to fight —
  // because that is exactly what has happened, and the opponent is supposed to
  // see it and come and collect.
  //
  // The only motion in the clip is one shallow, hitching breath.
  idleSilenced: {
    dur: 2.8, loop: true, keys: [
      K(0, { ...MUTE_HOLD }),
      K(0.7, {
        ...MUTE_HOLD,
        Spine: [15, -6, 0], Chest: [16, -8, 0], Neck: [13, -2, 0], Head: [20, -6, 0],
        Hips_pos: [0, -0.074, 0], UpArmL: [-68, 16, -6], UpArmR: [-66, -14, 7]
      }, 'out'),
      K(0.95, {
        ...MUTE_HOLD,
        Spine: [19, -6, 0], Chest: [21, -8, 0], Head: [25, -6, 0], Hips_pos: [0, -0.090, 0]
      }, 'snap'),
      K(2.8, { ...MUTE_HOLD })
    ]
  },

  // ---- X · THE PUNCH STRING -----------------------------------------------
  // Three clips authored to look BAD, because the frame data already says they
  // are and the animation should not flatter them. He does not throw a punch;
  // he SHOVES, with the heel of the hand, elbow barely extending, and he pulls
  // it back straight away. No hip rotation on the first two — he is punching
  // with his arm, which is the whole joke.
  punch1: {
    dur: 0.44, loop: false, keys: [
      K(0, {}),
      K(0.09, { UpArmR: [-30, -10, -10], LoArmR: [-72, -20, 0], ClavR: [2, 0, 0] }, 'in'),
      K(0.17, {
        UpArmR: [-70, -6, -10], LoArmR: [-16, 0, -2], HandR: [-10, -150, 0],
        Chest: [6, -6, 0], Spine: [6, -6, 0], Hips: [0, 30, 0], Hips_pos: [0, -0.046, 0.03]
      }, 'snap'),
      K(0.24, { UpArmR: [-68, -6, -10], LoArmR: [-18, 0, -2], Chest: [6, -6, 0] }, 'hold'),
      K(0.44, {}, 'out')
    ]
  },

  punch2: {
    dur: 0.48, loop: false, keys: [
      K(0, {}),
      K(0.09, { UpArmL: [-26, 14, 10], LoArmL: [-70, 26, 0], ClavL: [2, 0, 0] }, 'in'),
      K(0.18, {
        UpArmL: [-62, 8, 22], LoArmL: [-28, 0, 4], HandL: [-8, 130, 0],
        Chest: [5, -6, 0], Spine: [5, -7, 0], Hips: [0, 34, 0], Hips_pos: [0, -0.046, 0.02]
      }, 'snap'),
      K(0.26, { UpArmL: [-60, 8, 22], LoArmL: [-30, 0, 4], Chest: [5, -6, 0] }, 'hold'),
      K(0.48, {}, 'out')
    ]
  },

  // The third one is the only normal with any body behind it — he turns his
  // whole shoulder into it, which is why it knocks down. It is still, plainly,
  // a teenager shoulder-barging somebody.
  punch3: {
    dur: 0.72, loop: false, keys: [
      K(0, {}),
      K(0.16, {
        Hips: [0, 54, 0], Chest: [4, -22, 0], Spine: [4, -16, 0], Head: [8, -20, 0],
        UpArmR: [-16, -22, -12], LoArmR: [-96, -34, 0], Hips_pos: [0, -0.058, 0]
      }, 'in'),
      K(0.30, {
        Hips: [0, -4, 0], Chest: [12, 10, 0], Spine: [10, 8, 0], Head: [4, 6, 0],
        UpArmR: [-44, 4, -30], LoArmR: [-56, 0, -6], HandR: [-20, -60, 0],
        UpArmL: [-8, 16, 14], LoArmL: [-56, 30, 0],
        Hips_pos: [0, -0.068, 0.11],
        ThighL: [-32, -5, 0], ShinL: [24, 0, 0], ThighR: [22, 7, 0], ShinR: [34, 0, 0]
      }, 'snap'),
      K(0.40, { Hips: [0, -2, 0], Chest: [11, 9, 0], UpArmR: [-42, 4, -30], Hips_pos: [0, -0.066, 0.11] }, 'hold'),
      K(0.72, {}, 'out')
    ]
  },

  // HEAVY — a two-handed shove to make room. Both palms, low, and he leans
  // away from it as he throws it.
  heavy: {
    dur: 0.87, loop: false, keys: [
      K(0, {}),
      K(0.22, {
        UpArmL: [-24, 26, 16], LoArmL: [-104, 44, 0], HandL: [-20, 60, 0],
        UpArmR: [-22, -24, -17], LoArmR: [-106, -42, 0], HandR: [-20, -60, 0],
        Hips: [0, 46, 0], Chest: [10, -18, 0], Spine: [9, -14, 0], Hips_pos: [0, -0.070, 0]
      }, 'in'),
      K(0.38, {
        UpArmL: [-74, 10, 16], LoArmL: [-16, 0, 4], HandL: [-30, 96, 0],
        UpArmR: [-72, -8, -17], LoArmR: [-14, 0, -4], HandR: [-30, -96, 0],
        Hips: [0, 8, 0], Chest: [-6, -4, 0], Spine: [2, -4, 0], Neck: [-4, 0, 0], Head: [-8, -4, 0],
        Hips_pos: [0, -0.056, 0.12],
        ThighL: [-38, -5, 0], ShinL: [26, 0, 0], ThighR: [24, 7, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      K(0.50, { UpArmL: [-72, 10, 16], UpArmR: [-70, -8, -17], Chest: [-5, -4, 0], Hips_pos: [0, -0.058, 0.12] }, 'hold'),
      K(0.87, {}, 'out')
    ]
  },

  // ---- RB · THE LIGHT UTTERANCE -------------------------------------------
  // 0.57 s at the ct1 default (16 + 2 + 16 = 34 frames). Three beats:
  //   1 THE INTAKE — one frame of him going still, then the right hand comes
  //     OUT OF THE POCKET to the collar. This is the frame the opponent is
  //     supposed to react to, so it is a snap, not an ease.
  //   2 THE WORD — chin up, body square, hand thrown forward palm-out. Held.
  //     The collar drop and the glyph birth both land on this key.
  //   3 THE CLOSE — the hand falls, the chin drops, and he goes straight back
  //     to closed. No follow-through: he is not proud of it.
  utterLight: {
    dur: 0.57, loop: false, keys: [
      K(0, {}),
      K(0.09, {
        ...OPEN,
        UpArmR: [-72, -14, -12], LoArmR: [-100, -28, 0], HandR: [-30, -50, 0],
        Head: [-2, -8, 0], Neck: [-2, -3, 0], Hips: [0, 22, 0]
      }, 'snap'),
      K(0.24, {
        ...OPEN,
        UpArmR: [-88, -6, -8], LoArmR: [-14, 0, -2], HandR: [-6, -120, 0],
        UpArmL: [-10, 12, 6], LoArmL: [-50, 28, 0]
      }, 'snap'),
      K(0.34, {
        ...OPEN,
        UpArmR: [-86, -6, -8], LoArmR: [-16, 0, -2], HandR: [-6, -120, 0]
      }, 'hold'),
      K(0.57, {}, 'out')
    ]
  },

  // ---- RT · THE HEAVY UTTERANCE -------------------------------------------
  // 1.03 s at the ct2 default (34 + 2 + 26 = 62 frames), and the longest
  // committed pose in his set. Same three beats, but the wind-up is a genuine
  // GATHER: he draws BOTH hands to his throat, folds over them, and the word
  // comes out of a body that has bent around it. Then he opens all the way
  // out — arm extended, chest up, chin high, which is the single most
  // aggressive frame this character has.
  //
  // The hold at 0.62 is the important one: it lasts about a fifth of a second
  // and it exists so the opponent's window to punish is a POSE and not a
  // number in a table.
  utterHeavy: {
    dur: 1.03, loop: false, keys: [
      K(0, {}),
      // 1 the gather — both hands come up, body folds over the throat.
      // GATHER is a constant for the same reason RAW_HOLD is: the second key
      // here omitted the hands and the clavicles, so his shoulders dropped in
      // the middle of the wind-up and the gather read as a shrug.
      K(0.16, { ...GATHER }, 'in'),
      K(0.40, {
        ...GATHER,
        UpArmL: [-72, 16, -4], LoArmL: [-134, 58, 0],
        UpArmR: [-70, -14, 5], LoArmR: [-136, -56, 0],
        Spine: [19, -6, 0], Chest: [21, -8, 0], Head: [23, -6, 0], Hips_pos: [0, -0.092, 0]
      }, 'hold'),
      // 2 the word — everything opens at once
      K(0.54, {
        ...OPEN,
        Neck: [-10, -2, 0], Head: [-16, -4, 0],
        Spine: [4, -2, 0], Chest: [0, -4, 0],
        UpArmR: [-104, -4, -10], LoArmR: [-6, 0, -2], HandR: [0, -128, 0],
        UpArmL: [-16, 18, 12], LoArmL: [-66, 20, 0], HandL: [-12, 50, 0],
        ClavR: [-10, 0, 0],
        Hips_pos: [0, -0.058, 0.09],
        ThighL: [-40, -4, 0], ShinL: [26, 0, 0], ThighR: [26, 6, 0], ShinR: [40, 0, 0]
      }, 'snap'),
      K(0.72, {
        ...OPEN,
        Neck: [-9, -2, 0], Head: [-15, -4, 0], Chest: [0, -4, 0],
        UpArmR: [-102, -4, -10], LoArmR: [-8, 0, -2],
        UpArmL: [-15, 18, 12], LoArmL: [-68, 20, 0],
        Hips_pos: [0, -0.060, 0.09],
        ThighL: [-38, -4, 0], ShinL: [26, 0, 0], ThighR: [25, 6, 0], ShinR: [39, 0, 0]
      }, 'hold'),
      // 3 the close — straight back to withdrawn, and a beat lower than stance
      K(0.88, {
        UpArmR: [-24, -14, -10], LoArmR: [-72, -30, 0],
        Spine: [9, -8, 0], Chest: [10, -12, 0], Head: [12, -10, 0],
        Hips_pos: [0, -0.056, 0.01], Hips: [0, 34, 0]
      }, 'out'),
      K(1.03, {}, 'out')
    ]
  },

  // ---- B · THE COMMAND WHEEL ----------------------------------------------
  // Held-open selector pose, on the same pattern as the other four radials.
  // His version is the quietest of them: he does not raise a hand, he just
  // STOPS — chin down, eyes closed, one hand at the collar, choosing his word.
  // Loops for as long as it is held.
  wheel: {
    dur: 1.1, loop: true, keys: [
      K(0, {
        UpArmR: [-62, -16, -14], LoArmR: [-112, -32, 0], HandR: [-34, -44, 0],
        ClavR: [10, 0, 0],
        Spine: [10, -10, 0], Chest: [11, -13, 0], Neck: [8, -4, 0], Head: [14, -10, 0],
        Hips_pos: [0, -0.050, 0]
      }),
      K(0.55, {
        UpArmR: [-66, -16, -14], LoArmR: [-116, -32, 0], HandR: [-36, -44, 0],
        Spine: [12, -10, 0], Chest: [13, -13, 0], Head: [16, -10, 0], Hips_pos: [0, -0.058, 0]
      }),
      K(1.1, {
        UpArmR: [-62, -16, -14], LoArmR: [-112, -32, 0], HandR: [-34, -44, 0],
        Spine: [10, -10, 0], Chest: [11, -13, 0], Neck: [8, -4, 0], Head: [14, -10, 0],
        Hips_pos: [0, -0.050, 0]
      })
    ]
  },

  // ---- D-pad Right · EXPLODE 爆ぜろ ----------------------------------------
  // 1.93 s (62 + 20 + 34 = 116 frames). THE FORCED SHOUT, and the only clip in
  // his set where his body loses the argument with his own technique.
  //
  //   1 THE REFUSAL (0 -> 0.55). He does not want to say this. He goes rigid,
  //     hands come up to the collar, and he HAULS IT DOWN himself — the one
  //     time in the game he opens it deliberately rather than it being opened
  //     for him by the word. Head down, shoulders locked.
  //   2 THE SHOUT (0.62 -> 1.15). Everything opens at once and keeps going
  //     past where a body should stop: chest thrown open, head all the way
  //     back, both arms flung wide and behind him, off the back foot. This is
  //     the largest pose in the file by a factor of three and it is meant to
  //     look like it hurts.
  //   3 THE COST (1.15 -> 1.93). He folds. Both hands to the throat, knees
  //     buckling, and the clip SETTLES INTO THE SILENCED IDLE'S POSE rather
  //     than into stance — because that is exactly where the state machine is
  //     about to put him, and a snap between the two would undo the whole
  //     point of the moment.
  ult: {
    dur: 1.93, loop: false, keys: [
      K(0, {}),
      // 1 the refusal
      K(0.22, {
        ...GATHER,
        UpArmL: [-64, 16, -4], LoArmL: [-126, 58, 0], HandL: [-30, 60, 0],
        UpArmR: [-62, -14, 5], LoArmR: [-128, -56, 0], HandR: [-30, -60, 0],
        ClavL: [14, 0, 0], ClavR: [14, 0, 0],
        Spine: [12, -4, 0], Chest: [14, -6, 0], Neck: [8, 0, 0], Head: [12, -4, 0],
        Hips: [0, 20, 0], Hips_pos: [0, -0.086, 0]
      }, 'in'),
      K(0.55, {
        ...GATHER,
        UpArmL: [-76, 16, -8], LoArmL: [-138, 60, 0], HandL: [-34, 62, 0],
        UpArmR: [-74, -14, 9], LoArmR: [-140, -58, 0], HandR: [-34, -62, 0],
        ClavL: [18, 0, 0], ClavR: [18, 0, 0],
        Spine: [16, -2, 0], Chest: [18, -4, 0], Neck: [10, 0, 0], Head: [15, -2, 0],
        Hips: [0, 14, 0], Hips_pos: [0, -0.104, 0],
        ThighL: [-20, -4, 0], ShinL: [26, 0, 0], ThighR: [16, 6, 0], ShinR: [30, 0, 0]
      }, 'hold'),
      // 2 the shout
      K(0.68, {
        UpArmL: [10, 30, 46], LoArmL: [-26, 0, 8], HandL: [10, 40, 0],
        UpArmR: [14, -28, -47], LoArmR: [-24, 0, -8], HandR: [10, -40, 0],
        ClavL: [-14, 0, 0], ClavR: [-14, 0, 0],
        Spine: [-10, 0, 0], Chest: [-13, 0, 0], Neck: [-6, 0, 0], Head: [-9, 0, 0],
        Hips: [0, 0, 0], Hips_pos: [0, -0.030, -0.08],
        ThighL: [-14, -3, 0], ShinL: [16, 0, 0], FootL: [-10, -6, 0],
        ThighR: [-6, 4, 0], ShinR: [22, 0, 0], FootR: [-6, 5, 0]
      }, 'snap'),
      K(1.15, {
        UpArmL: [7, 30, 44], LoArmL: [-28, 0, 8], HandL: [10, 40, 0],
        UpArmR: [11, -28, -45], LoArmR: [-26, 0, -8], HandR: [10, -40, 0],
        ClavL: [-14, 0, 0], ClavR: [-14, 0, 0],
        Spine: [-9, 0, 0], Chest: [-12, 0, 0], Neck: [-5, 0, 0], Head: [-8, 0, 0],
        Hips: [0, 0, 0], Hips_pos: [0, -0.034, -0.08],
        ThighL: [-14, -3, 0], ShinL: [16, 0, 0], FootL: [-10, -6, 0],
        ThighR: [-6, 4, 0], ShinR: [22, 0, 0], FootR: [-6, 5, 0]
      }, 'hold'),
      // 3 the cost — and it lands on the silenced pose
      K(1.42, {
        ...MUTE_HOLD,
        UpArmL: [-66, 16, -4], LoArmL: [-124, 58, 0], HandL: [-30, 60, 0],
        UpArmR: [-64, -14, 5], LoArmR: [-126, -56, 0], HandR: [-30, -60, 0],
        ClavL: [14, 0, 0], ClavR: [14, 0, 0],
        Spine: [20, -4, 0], Chest: [22, -6, 0], Neck: [13, -2, 0], Head: [20, -4, 0],
        Hips: [0, 24, 0], Hips_pos: [0, -0.120, 0.02],
        ThighL: [-26, -6, 0], ShinL: [34, 0, 0], ThighR: [20, 8, 0], ShinR: [38, 0, 0]
      }, 'snap'),
      // ...and the last key IS the silenced idle's pose, so the state machine
      // can put him straight into `idleSilenced` on the next frame without a
      // snap. That continuity is the whole point of the beat.
      K(1.93, { ...MUTE_HOLD }, 'out')
    ]
  },

  // ---- TAUNT — "SALMON." --------------------------------------------------
  // The joke is that NOTHING HAPPENS. He goes through the entire preparation
  // of a command — he stops, he squares up, the hand comes out of the pocket,
  // the collar comes down, there is a beat of absolute stillness — and then he
  // says "salmon", completely deadpan, and puts his hand back in his pocket.
  //
  // Everything about the timing is built to sell the fake. Beats 1 and 2 are
  // LIFTED FROM `utterHeavy` almost pose for pose, so a player who has been
  // hit by a heavy command reads it as one coming and blocks. The tell is the
  // hold at 1.35, which is a third of a second longer than any real utterance:
  // by the time the bubble appears the opponent has already flinched.
  //
  // NOTE FOR ANYONE TOUCHING THIS: the collar DOES come down. It is driven by
  // the taunt handler in core/match.js rather than by speechfx, because there
  // is no utterance to run the dial off. That is the correct call — he is
  // genuinely opening his collar to say a word, the word is just "salmon".
  taunt: {
    dur: 3.3, loop: false, keys: [
      K(0, {}),
      // the gather. Same shape as a heavy command's, deliberately.
      K(0.34, {
        ...GATHER,
        UpArmL: [-24, 14, 8], LoArmL: [-70, 38, 0], HandL: [-14, 50, 0],
        ClavL: [8, 0, 0],
        Spine: [14, -6, 0], Chest: [16, -8, 0], Neck: [10, -2, 0], Head: [18, -6, 0],
        Hips: [0, 26, 0], Hips_pos: [0, -0.078, 0]
      }, 'in'),
      // squares up. Chin comes level. This is the frame that sells it.
      K(0.72, {
        ...OPEN,
        UpArmR: [-70, -12, -14], LoArmR: [-86, -26, 0], HandR: [-24, -46, 0],
        Neck: [-2, -2, 0], Head: [-4, -4, 0]
      }, 'snap'),
      // ...and then he just stands there. A third of a second longer than any
      // real command holds, which is the whole gag.
      K(1.35, {
        ...OPEN,
        UpArmR: [-70, -12, -14], LoArmR: [-86, -26, 0], HandR: [-24, -46, 0],
        Neck: [-2, -2, 0], Head: [-4, -4, 0]
      }, 'hold'),
      // "salmon." Two degrees of head tilt. That is the entire performance.
      K(1.62, {
        ...OPEN,
        UpArmR: [-68, -12, -14], LoArmR: [-88, -26, 0],
        Neck: [-1, -2, 0], Head: [-2, -7, 0]
      }, 'hold'),
      K(2.20, {
        ...OPEN,
        UpArmR: [-66, -12, -14], LoArmR: [-90, -26, 0],
        Head: [0, -6, 0]
      }, 'hold'),
      // hand goes back in the pocket, body folds back to closed
      K(2.62, {
        UpArmR: [-20, -12, -10], LoArmR: [-64, -30, 0], HandR: [-16, -44, 0],
        Spine: [8, -9, 0], Chest: [9, -12, 0], Head: [10, -10, 0],
        Hips: [0, 34, 0], Hips_pos: [0, -0.046, 0]
      }, 'out'),
      K(3.3, {}, 'out')
    ]
  },

  // VICTORY — he does not celebrate. He lets his shoulders down, pulls the
  // collar back up over his mouth with one hand, and puts the hand away. The
  // last key is stance exactly, so he ends the match standing the way he
  // started it.
  victory: {
    dur: 2.8, loop: false, keys: [
      K(0, {}),
      K(0.45, {
        UpArmR: [-52, -16, -14], LoArmR: [-108, -32, 0], HandR: [-32, -44, 0],
        ClavR: [8, 0, 0], Chest: [9, -13, 0], Head: [11, -11, 0], Hips_pos: [0, -0.044, 0]
      }, 'in'),
      K(0.95, {
        UpArmR: [-58, -16, -13], LoArmR: [-114, -32, 0], HandR: [-36, -44, 0],
        Neck: [-2, -5, 0], Head: [-2, -10, 0], Chest: [4, -13, 0], Hips_pos: [0, -0.036, 0]
      }, 'out'),
      K(1.45, {
        UpArmR: [-56, -16, -13], LoArmR: [-112, -32, 0],
        Neck: [-2, -5, 0], Head: [-1, -10, 0]
      }, 'hold'),
      K(2.0, {
        UpArmR: [-14, -10, -8], LoArmR: [-52, -28, 0], HandR: [-16, -44, 0],
        Chest: [6, -14, 0], Head: [6, -12, 0], Hips_pos: [0, -0.040, 0]
      }, 'out'),
      K(2.8, {}, 'out')
    ]
  }
};
