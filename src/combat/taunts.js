// TAUNTS — D-pad Left. Pure personality, zero gameplay.
//
// WHAT A TAUNT IS HERE. A character-specific clip, usually with a speech
// bubble, played from neutral. It deals no damage, grants no meter, confers no
// advantage and gives no armor, and it can be cut in half by any hit that
// lands. The whole feature is a risk you take because you want to.
//
// WHERE THE PIECES LIVE:
//   · this file           the list, the rules dials, and the resolver
//   · combat/fighter.js   the `taunt` state, the gates, the rate limit
//   · fx/bubble.js        the 3D speech bubble
//   · audio/sfx.js        `taunt(cue)` — one procedural cue per taunt
//   · art/anim/<char>.js  the clip itself, authored like any other clip
//
// ADDING A SECOND TAUNT to anybody is deliberately trivial: push another entry
// onto that character's array. The input CYCLES through the array (see
// `TAUNT_INPUT`), so a two-entry list needs no other change anywhere.

// ---- THE DIALS -------------------------------------------------------------

// OFF, as briefed. Flip it on and an UNINTERRUPTED taunt pays the small
// CURRENT_CE bonus below — the classic fighting-game risk/reward. Interrupted
// taunts never pay, which is the entire point of the trade.
export const TAUNT_GRANTS_METER = false;
export const TAUNT_METER_BONUS = 8;      // CURRENT_CE, only if the flag is on

// Rate limit. Not a cooldown on a move — a limit on how much of the screen one
// player can fill with speech bubbles. Starts when a taunt ENDS (completed or
// cancelled), so cancel-spam is limited by the same number.
export const TAUNT_COOLDOWN = 2.4;

// 'cycle' walks the character's list in order; 'random' picks one.
export const TAUNT_INPUT = 'cycle';

// ---- THE LIST --------------------------------------------------------------
// Each entry:
//   clip     the animation clip name in that character's clip set
//   dur      seconds the taunt state lasts. Must be >= the clip length, or the
//            clip's settle gets cut off and the pose snaps.
//   say      bubble text, or null for a PURE ANIMATION taunt (the cursed
//            spirits, and the two variants whose whole point is that they have
//            stopped talking)
//   at/hold  when the bubble pops, and how long it holds before fading
//   cue      key into sfx.taunt() — the procedural audio cue
//   ref      what it references. Read by nothing; it is here because a taunt
//            whose reference nobody can reconstruct is a taunt nobody will fix.

export const TAUNTS = {
  // ---- THE REFERENCE TAUNT ------------------------------------------------
  // Ch.236's full-page panel. Hands in pockets, weight rocked back, head
  // tilted, the smallest possible smile, and four words. Everything about the
  // clip is built to land the LAST beat rather than the pose itself: he takes
  // his time getting there, holds, and the line arrives after he has already
  // stopped moving. See art/anim/gojo.js for the shot-by-shot note.
  gojo: [{
    clip: 'taunt', dur: 3.4, say: "Nah, I'd win.", at: 1.55, hold: 1.5,
    cue: 'gojo', ref: 'Ch.236 — the "Nah, I\'d win" panel, the single most quoted image in the fandom'
  }],

  sukuna: [{
    clip: 'taunt', dur: 3.0, say: 'Know your place.', at: 1.5, hold: 1.2,
    cue: 'sukuna', ref: 'His standing contempt for everyone who has ever addressed him'
  }],

  toji: [{
    clip: 'taunt', dur: 3.0, say: 'Not worth the money.', at: 1.6, hold: 1.1,
    cue: 'toji', ref: 'The sorcerer-killer who only ever did it for the payout'
  }],

  naoya: [{
    clip: 'taunt', dur: 3.2, say: "You're too slow to see it.", at: 1.5, hold: 1.4,
    cue: 'naoya', ref: 'Projection Sorcery, and the insufferable Zenin heir who will tell you about it'
  }],

  // Four hundred years of being reincarnated to look for a fight worth having,
  // and this is not it. He leans on the rod and beckons.
  kashimo: [{
    clip: 'taunt', dur: 3.2, say: 'Four hundred years. Is this it?', at: 1.42, hold: 1.4,
    cue: 'kashimo', ref: 'The whole reason he came back — he is not fighting to win, he is auditioning opponents'
  }],

  // The funniest character in the roster, and the joke is at his own expense
  // rather than at the opponent's — see the clip note in art/anim/panda.js.
  panda: [{
    clip: 'taunt', dur: 3.3, say: 'I have THREE of these.', at: 1.05, hold: 1.5,
    cue: 'panda', ref: 'Three cursed cores, and a cursed corpse who is genuinely pleased about it'
  }],

  yuta: [{
    clip: 'taunt', dur: 3.2, say: "Sorry. I can't lose.", at: 1.6, hold: 1.3,
    cue: 'yuta', ref: 'Apologises constantly; still the strongest person in the room'
  }],

  // PURE ANIMATION, with a prop. Megumi does not trash-talk, so his taunt is a
  // hand sign and a Divine Dog that turns up uninvited.
  megumi: [{
    clip: 'taunt', dur: 3.3, say: null, cue: 'megumi',
    ref: 'The Ten Shadows hand sign, and the fandom\'s favourite fact about him — the dogs like him more than people do'
  }],

  geto: [{
    clip: 'taunt', dur: 3.4, say: 'Monkeys.', at: 1.9, hold: 1.3,
    cue: 'geto', ref: 'His word for non-sorcerers, and the cursed-spirit ball he is famous for swallowing'
  }],

  // ---- THE FUNNIEST TAUNT IN THE GAME, AND NOTHING HAPPENS ----------------
  // Inumaki speaks only in ONIGIRI INGREDIENTS so that he cannot curse anybody
  // by accident. Salmon means yes, bonito flakes means no, kelp is a greeting.
  // So his taunt is that: in the middle of a fight, he goes through the whole
  // preparation of a command — he stops, squares up, the collar comes down,
  // there is a beat of total stillness — and then he says "salmon", deadpan,
  // and puts his hand back in his pocket.
  //
  // FOUR ENTRIES, and `TAUNT_INPUT` is 'cycle', so pressing D-pad Left four
  // times walks the whole menu. That is the joke landing four different ways
  // rather than the same joke four times, and it costs nothing but this array.
  //
  // NO CURSED ENERGY AND NO THROAT COST. Deliberately, and enforced
  // structurally rather than by a check: the taunt path in Fighter never
  // touches the throat gauge, because the gauge is only ever written by
  // combat/speech.js `spend`, and nothing in the taunt flow calls it.
  //
  // The collar drop is real (see the note in art/anim/inumaki.js) — the
  // taunt handler in core/match.js drives `model.setCollar` on the bubble
  // beat. He is genuinely opening his collar to say a word. The word is just
  // "salmon".
  inumaki: [
    {
      clip: 'taunt', dur: 3.3, say: 'Salmon.', at: 1.62, hold: 1.2,
      cue: 'inumaki', ref: 'Shake — salmon. His word for "yes", and the first thing anybody learns about him'
    },
    {
      clip: 'taunt', dur: 3.3, say: 'Bonito flakes.', at: 1.62, hold: 1.2,
      cue: 'inumaki', ref: 'Okaka — bonito flakes. His word for "no", delivered to somebody who did not ask a question'
    },
    {
      clip: 'taunt', dur: 3.3, say: 'Tuna mayo.', at: 1.62, hold: 1.2,
      cue: 'inumaki', ref: 'Tsuna mayo. Used for emphasis, roughly, and nobody has ever been sure'
    },
    {
      clip: 'taunt', dur: 3.3, say: 'Kelp.', at: 1.62, hold: 1.2,
      cue: 'inumaki', ref: 'Konbu — kelp. It is a greeting. He is saying hello to somebody he is fighting'
    }
  ],

  nanami: [{
    clip: 'taunt', dur: 3.4, say: "I'd rather be at the bakery.", at: 1.5, hold: 1.6,
    cue: 'nanami', ref: 'The watch, the overtime, and a man who genuinely would rather be buying bread'
  }],

  higuruma: [{
    clip: 'taunt', dur: 3.2, say: 'Guilty.', at: 1.85, hold: 1.1,
    cue: 'higuruma', ref: 'The gavel, and a defence attorney who stopped believing anyone was innocent'
  }],

  hakari: [{
    clip: 'taunt', dur: 3.2, say: 'Wanna bet?', at: 1.35, hold: 1.5,
    cue: 'hakari', ref: 'The pachinko lever — Idle Death Gamble is a slot machine he carries around'
  }],

  yuji: [{
    clip: 'taunt', dur: 3.0, say: "You're not getting past me.", at: 1.35, hold: 1.4,
    cue: 'yuji', ref: 'The whole character: the one who plants himself in front of the thing'
  }],

  nobara: [{
    clip: 'taunt', dur: 3.2, say: 'I love myself.', at: 1.7, hold: 1.3,
    cue: 'nobara', ref: 'Her Shibuya declaration, delivered while doing her nails, with a nail'
  }],

  choso: [{
    clip: 'taunt', dur: 3.3, say: '…My brother?', at: 1.95, hold: 1.2,
    cue: 'choso', ref: 'Nine brothers, and the running joke that he will adopt literally anyone'
  }],

  todo: [{
    clip: 'taunt', dur: 3.4, say: "WHAT'S YOUR TYPE?!", at: 1.5, hold: 1.6,
    cue: 'todo', ref: 'The question. The only question Todo has ever asked anyone'
  }],

  // ---- THE SPIRITS — NO BUBBLES -------------------------------------------
  // Every one of these is a physical taunt: a gesture, a body reaction or an
  // effect on the ground. None of them gets a bubble, and that is the point —
  // it is what makes them read as not-people from across the arena.
  jogo: [{
    clip: 'taunt', dur: 3.2, say: null, cue: 'jogo',
    ref: 'His head is a volcano and he is the most humiliated character in the series — it erupts, and then he wipes his eye'
  }],

  mahito: [{
    clip: 'taunt', dur: 3.3, say: 'You are only a shape.', at: 1.8, hold: 1.3,
    cue: 'mahito', ref: 'Idle Transfiguration, demonstrated on his own hand. The one spirit who does talk'
  }],

  hanami: [{
    clip: 'taunt', dur: 3.6, say: null, cue: 'hanami',
    ref: 'He is not fighting for a cause, he is fighting for the ground. So he grows something on it'
  }],

  kurourushi: [{
    clip: 'taunt', dur: 3.3, say: null, cue: 'kurourushi',
    ref: 'Insect business — the mandibles, an antenna groomed with a foreleg, and the swarm answering'
  }],

  // Not selectable (he is a summon), but he is a Fighter like any other and
  // the state machine does not know the difference, so he gets one.
  mahoraga: [{
    clip: 'taunt', dur: 3.4, say: null, cue: 'mahoraga',
    ref: 'The wheel. It turns once, clunks, and he tilts his head at you — adaptation, as a shrug'
  }]
};

// ---- VARIANTS --------------------------------------------------------------
// Keyed by the full pick id. A variant with no entry here shares its base
// character's taunt, which is the right answer for a purely cosmetic one.
// These five are here because the PERSON is different, not the palette.
export const TAUNT_VARIANTS = {
  // Not the smug one. This Gojo has been waiting his whole life for someone
  // who might actually win, and he is delighted about it.
  'gojo:shinjuku': [{
    clip: 'tauntShinjuku', dur: 3.4, say: 'Finally. A real one.', at: 1.6, hold: 1.4,
    cue: 'gojoShinjuku', ref: 'His open joy at getting a fight worth having, minutes before he loses it'
  }],

  // Wearing his son's body and enjoying it. The contempt is the same; the
  // gesture is somebody examining a borrowed thing.
  'sukuna:megumi': [{
    clip: 'tauntMeguna', dur: 3.2, say: 'A fine fit.', at: 1.7, hold: 1.2,
    cue: 'sukunaMeguna', ref: 'The Enchain vow — "Meguna", and the fandom\'s least favourite haircut'
  }],

  // The skin comes off, and so does the talking.
  'mahito:distorted': [{
    clip: 'tauntDistorted', dur: 3.2, say: null, cue: 'mahitoDistorted',
    ref: 'Instant Spirit Body of Distorted Killing — a body that opens where a body should not'
  }],

  // NO BUBBLE, deliberately. Shinjuku Yuji has nothing to say to anyone, and
  // the silence next to base Yuji's grin is the whole characterisation.
  'yuji:shinjuku': [{
    clip: 'tauntShinjuku', dur: 3.2, say: null, cue: 'yujiShinjuku',
    ref: 'The Shinjuku Showdown — he wipes his mouth and resets his stance, and that is the entire taunt'
  }],

  'yuji:modulo': [{
    clip: 'tauntModulo', dur: 3.4, say: 'Sixty-eight years of practice.', at: 1.7, hold: 1.5,
    cue: 'yujiModulo', ref: 'Modulo — the same kid, a very long time later, watching his own cursed markings move'
  }]
};

// ---- CPU PERSONALITY -------------------------------------------------------
// How often a CPU of this character taunts when it has an opening, 0..1
// relative weight. Todo and Naoya cannot help themselves; Nanami and Higuruma
// are at work. Anyone missing takes DEFAULT_TAUNT_WEIGHT.
export const TAUNT_WEIGHT = {
  todo: 1.0, naoya: 1.0, kashimo: 0.9, hakari: 0.85, sukuna: 0.8, gojo: 0.75, nobara: 0.7,
  mahito: 0.65, geto: 0.5, jogo: 0.5, yuji: 0.45, choso: 0.4, kurourushi: 0.35,
  toji: 0.3, hanami: 0.3, panda: 0.75, megumi: 0.25, yuta: 0.2, mahoraga: 0.2,
  nanami: 0.1, higuruma: 0.1,
  // Rare on purpose. The joke does not survive repetition, and a CPU that
  // said "salmon" every ten seconds would kill the one gag this character has.
  inumaki: 0.3
};
export const DEFAULT_TAUNT_WEIGHT = 0.4;

// ---- RESOLUTION ------------------------------------------------------------

// The taunt list for a pick id ('gojo' or 'gojo:shinjuku'). Variant first,
// base second, empty last — an unlisted character simply cannot taunt rather
// than throwing, which is what keeps a half-added character playable.
export function tauntsFor(pick) {
  if (!pick) return [];
  return TAUNT_VARIANTS[pick] || TAUNTS[String(pick).split(':')[0]] || [];
}

// Which taunt this press should play. `n` is the fighter's own taunt counter.
export function pickTaunt(pick, n = 0) {
  const list = tauntsFor(pick);
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  return TAUNT_INPUT === 'random'
    ? list[(Math.random() * list.length) | 0]
    : list[n % list.length];
}

export function tauntWeight(charId) {
  return TAUNT_WEIGHT[String(charId).split(':')[0]] ?? DEFAULT_TAUNT_WEIGHT;
}
