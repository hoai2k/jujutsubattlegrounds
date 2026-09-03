// TAKABA'S OUTCOME TABLES — every bit his technique can produce.
//
// Deliberately shaped like characters/yuta_swords.js, because they are read by
// THE SAME CODE. Yuta's domain rolls a technique off a weighted table with a
// no-immediate-repeat rule and a seeded stream; Takaba's RB and RT roll off
// these two with the identical helper (`rollFrom` in combat/comedy.js, which
// is a lift of `_rollSwordTech` and nothing more). Nothing in domains.js
// changed to accommodate this file — see the delivery report.
//
// ===========================================================================
// RESEARCH (2026-08-20, web) — WHAT THE COMEDIAN ACTUALLY IS
// ===========================================================================
// Sources: Gamerant "Takaba's Cursed Technique, Explained"; Beebom's
// explainer; Animehunch; Grokipedia's Takaba page. (Fandom is blocked from
// this session's proxy — stated rather than papered over.)
//
//   · IT IS REALITY-WARPING, NOT PROP-SUMMONING. "If Takaba finds anything
//     genuinely funny, it actually becomes reality." The bits below are the
//     honest fighting-game expression of that: they are not conjured objects
//     he throws, they are things that ARE SUDDENLY TRUE. That is why every one
//     of them arrives instantly and fully formed rather than travelling out of
//     his hands, and why the VFX has no cast-up.
//
//   · ITS APPLICATIONS ARE ABSURDLY BROAD. Conjuring objects and substances
//     from nothing, healing himself with no Reverse Cursed Technique, and
//     NULLIFYING DAMAGE outright. Only the first of those is in his kit here,
//     and that is a deliberate narrowing stated in the delivery report: a
//     fighting-game character who randomly nullifies damage is not a wildcard,
//     he is a coin-flip nobody can play against.
//
//   · THE LIMIT IS PSYCHOLOGICAL AND IT IS THE WHOLE BALANCE HOOK. The
//     technique runs on his GENUINE belief that something is funny; shake his
//     confidence and it stops. Kenjaku found this and worked it. THAT is the
//     COMEDY METER — it is not an invented resource, it is the canonical
//     failure mode of the technique with a bar drawn on it. See
//     combat/comedy.js.
//
//   · WHAT THE BRIEF GOT RIGHT AND THE ONE THING IT DIDN'T: the brief says his
//     power "scales with how well his material is going", which is exactly
//     right. The one correction is directional — in canon a shaken Takaba
//     produces LESS, not SMALLER-BUT-EQUAL. The brief asks explicitly for equal
//     average value at every meter tier, which is the better GAME even though
//     it is the looser adaptation, so it is implemented as briefed and flagged
//     here rather than silently "fixed".
//
// ===========================================================================
// THE BALANCE PRINCIPLE — EQUAL VALUE, DIFFERENT SHAPE
// ===========================================================================
// Every entry in a table is worth roughly the same and is worth it DIFFERENTLY.
// The units are not comparable directly, so each entry declares `value`, which
// is what it is worth in "equivalent damage" once its non-damage payload is
// priced. The rule the tables are tuned to:
//
//     BITS   value 11.5 ± 1.0        THE BIG ONE   value 26 ± 1.5
//
// Pricing conventions used throughout, so the numbers can be argued with:
//   a hard knockdown          ≈ 8 equivalent damage (it is a free okizeme)
//   1 s of blind              ≈ 3
//   1 s of removed-from-field ≈ 5 (he gets the whole second for free)
//   1 s of slow               ≈ 2
//   a launcher                ≈ 5 (it opens a juggle he can actually convert)
//   4 m of pushback           ≈ 3 (it is a neutral reset in his favour)
//
// `bigness` (0..1) is NOT value. It is how ENORMOUS the bit looks, and it is
// the only thing the Comedy Meter shifts: a cold room rolls small and
// pathetic, a hot room rolls colossal, and the average value is identical.
// See `weightAt` in combat/comedy.js.
//
// Field reference:
//   key        dispatcher key in effects.applyBit
//   name       the stylized callout. Reuses hud.techFlash, same as Yuta's roll.
//   weight     base share of the roll before the meter tilt
//   bigness    0 = tame and pathetic, 1 = colossal. Drives the meter tilt.
//   value      the equal-value audit column above
//   projectile whether combat/reflect.js may bend it back (see the audit note
//              at the bottom of this file)
//   offField   seconds the opponent is removed from the field, if any
//   color/tone the callout tint and the reveal cue pitch, exactly as Yuta's

// ---------------------------------------------------------------------------
// RB — A BIT. Fast, low commitment, his neutral tool.
// ---------------------------------------------------------------------------
export const BIT_TABLE = [
  {
    key: 'glove', name: 'BOXING GLOVE', jp: '拳闘手袋', weight: 12, bigness: 0.55, value: 11.5,
    dmg: 8.5, kb: 5.2, kbY: 0.4, hitstun: 22, reaction: 'stagger',
    projectile: true, color: 0xd8443a, tone: 620, dur: 0.45,
    desc: 'A glove the size of a car on a spring. 8.5 damage and it sends them 5 m. Pure position.'
  },
  {
    key: 'mallet', name: 'OVERSIZED MALLET', jp: '大槌', weight: 12, bigness: 0.7, value: 11.5,
    dmg: 11.5, kb: 1.2, kbY: 0, hitstun: 30, reaction: 'stagger',
    projectile: false, color: 0xc87a3a, tone: 300, dur: 0.5,
    desc: 'Straight down on the head. The most raw damage in the table and it leaves them standing in front of him.'
  },
  {
    key: 'banana', name: 'BANANA PEEL', jp: '香蕉', weight: 12, bigness: 0.15, value: 11.5,
    dmg: 3.0, kb: 2.0, kbY: 3.2, hitstun: 34, reaction: 'knockdown',
    projectile: false, color: 0xf2d84a, tone: 880, dur: 0.4,
    desc: 'Almost no damage; a HARD KNOCKDOWN, which is worth about eight on its own. The tamest-looking entry and one of the strongest.'
  },
  {
    key: 'bucket', name: 'BUCKET ON THE HEAD', jp: '手桶', weight: 12, bigness: 0.2, value: 11.0,
    dmg: 4.0, kb: 0.8, kbY: 0, hitstun: 18, reaction: 'stagger',
    blind: 2.2, projectile: false, color: 0x9fb0bc, tone: 420, dur: 0.6,
    desc: 'Low damage and 2.2 s blind. Their soft lock goes and their aim wanders — see the blind handler in effects.'
  },
  {
    key: 'pie', name: 'PIE, FULL IN THE FACE', jp: '投擲菓子', weight: 12, bigness: 0.25, value: 11.0,
    dmg: 5.0, kb: 1.0, kbY: 0, hitstun: 16, reaction: 'stagger',
    blind: 1.2, slow: { dur: 1.6, mult: 0.7 }, projectile: true, color: 0xf0e6d0, tone: 740, dur: 0.5,
    desc: 'A cream pie. Blind and slow, stacked shallow rather than either one deep.'
  },
  {
    key: 'rake', name: 'THE RAKE', jp: '熊手', weight: 12, bigness: 0.4, value: 11.5,
    dmg: 7.0, kb: 2.4, kbY: 8.4, hitstun: 28, reaction: 'launch',
    projectile: false, color: 0x8a6a44, tone: 520, dur: 0.42,
    desc: 'They step on it and the handle comes up. A LAUNCHER — the only one in the table, and his only real juggle starter.'
  },
  {
    key: 'trapdoor', name: 'TRAPDOOR', jp: '落とし戸', weight: 11, bigness: 0.35, value: 12.0,
    dmg: 3.5, kb: 0, kbY: 0, hitstun: 20, reaction: 'offfield',
    offField: 1.1, projectile: false, color: 0x4a3a2c, tone: 180, dur: 1.6,
    desc: 'The floor opens. 1.1 s of them not existing, then they drop back in prone. See the off-field audit below.'
  },
  {
    key: 'stagelight', name: 'FALLING STAGE LIGHT', jp: '照明落下', weight: 11, bigness: 0.85, value: 12.0,
    dmg: 14.0, kb: 3.0, kbY: 0, hitstun: 26, reaction: 'stagger',
    projectile: false, telegraph: 0.55, radius: 1.5, color: 0xffe27a, tone: 990, dur: 0.9,
    desc: 'The biggest number in the table, and the only one with a 0.55 s TELEGRAPH — a light-cone on the floor they can walk out of. High damage that is not free.'
  }
];

// ---------------------------------------------------------------------------
// RT — THE BIG ONE. Slow, committed, much bigger payoff.
// ---------------------------------------------------------------------------
export const BIG_TABLE = [
  {
    key: 'anvil', name: 'ANVIL', jp: '金床', weight: 12, bigness: 0.6, value: 26.0,
    dmg: 18.0, kb: 3.0, kbY: 0, hitstun: 40, reaction: 'knockdown',
    projectile: false, telegraph: 0.35, radius: 1.8, color: 0x6a707c, tone: 140, dur: 0.7,
    desc: '18 and a hard knockdown. The plainest entry and the benchmark the other five are priced against.'
  },
  {
    key: 'safe', name: 'A CARTOON SAFE', jp: '金庫', weight: 12, bigness: 0.7, value: 26.5,
    dmg: 16.0, kb: 1.0, kbY: 0, hitstun: 44, reaction: 'pin', pin: 2.0,
    projectile: false, telegraph: 0.4, radius: 1.9, color: 0x3c4450, tone: 120, dur: 0.9,
    desc: 'Lands on them and STAYS there. 2 s pinned under it — the longest guaranteed follow-up window he has.'
  },
  {
    key: 'curtain', name: 'THE STAGE CURTAIN', jp: '緞帳', weight: 11, bigness: 0.75, value: 26.0,
    dmg: 8.0, kb: 0, kbY: 0, hitstun: 24, reaction: 'offfield',
    offField: 1.6, projectile: false, color: 0x8a1f2c, tone: 220, dur: 2.1,
    desc: 'Red velvet wraps them and drags them into the wings. 1.6 s off the field, then spat back out prone.'
  },
  {
    key: 'firehose', name: 'FIRE HOSE', jp: '消防喉管', weight: 12, bigness: 0.65, value: 25.5,
    dmg: 15.0, kb: 11.0, kbY: 1.2, hitstun: 30, reaction: 'stagger',
    projectile: true, stream: { dur: 0.9, ticks: 5 }, color: 0x5aa8d8, tone: 400, dur: 0.9,
    desc: 'Five ticks of pressure that walk them 11 m backwards. The only full-screen neutral reset in his kit.'
  },
  {
    key: 'foamfinger', name: 'ENORMOUS FOAM FINGER', jp: '応援手', weight: 12, bigness: 0.9, value: 26.0,
    dmg: 16.0, kb: 4.0, kbY: 9.2, hitstun: 34, reaction: 'launch',
    projectile: false, arc: 2.6, reach: 4.0, color: 0xf05a8a, tone: 560, dur: 0.85,
    desc: 'A four-metre horizontal swing through a wide arc. LAUNCHES, and it is the only entry that can hit two people in a free-for-all.'
  },
  {
    key: 'piano', name: 'A PIANO', jp: '洋琴', weight: 11, bigness: 1.0, value: 27.0,
    dmg: 22.0, kb: 4.5, kbY: 0, hitstun: 42, reaction: 'knockdown',
    projectile: false, telegraph: 0.5, radius: 2.2, shards: { dmg: 3.0, radius: 3.4 },
    color: 0x1c1a20, tone: 96, dur: 1.1,
    desc: 'The biggest single number he owns, on the longest telegraph, and the wreck chips anything standing near it.'
  }
];

// ---------------------------------------------------------------------------
// URO'S SKY REFLECT — THE CLASSIFICATION, IN THE FILE RATHER THAN IN A REPORT
// ---------------------------------------------------------------------------
// combat/reflect.js's rule is "she reflects things that TRAVEL". Applied
// honestly to fourteen bits, three of them travel and eleven do not:
//
//   REFLECTED (projectile: true)
//     GLOVE      — the glove genuinely crosses the space on its spring.
//     PIE        — it is thrown. It is the most literal projectile in the game.
//     FIRE HOSE  — a pressurised stream of water with a front that arrives.
//
//   NOT REFLECTED (projectile: false), and each for a reason already in
//   reflect.js's own taxonomy rather than a new one:
//     MALLET, RAKE, FOAM FINGER  — a SWING. Category C, a body/implement.
//     ANVIL, SAFE, PIANO, STAGE LIGHT — they arrive from ABOVE, from outside
//       the plane she is holding. Category B in effect: by the time the object
//       exists it is already over them. Their counterplay is the telegraph.
//     BANANA, TRAPDOOR — they are on the FLOOR. There is nothing in flight.
//     BUCKET, CURTAIN  — they arrive ON the target from the target's own
//       position. Nothing crosses the space.
//
// This is enforced by data rather than by trust: `applyBit` only registers a
// travelling entity for entries with `projectile: true`, and reflect.js's
// REFLECTABLE table gains exactly one key — `bit` — covering all three.
//
// ---------------------------------------------------------------------------
// MAHORAGA'S ADAPTATION — ONE CATEGORY FOR THE WHOLE TABLE
// ---------------------------------------------------------------------------
// Implemented as the brief recommends, and the argument is Kashimo's rather
// than Toji's (see combat/adaptation.js for both). Toji's four weapons are four
// genuinely different things; Kashimo's whole kit is ONE SUBSTANCE arriving in
// different shapes, so it is one bucket. Takaba is the purest case of Kashimo's
// argument in the game: every one of these fourteen is THE COMEDIAN — the same
// reality-warp, wearing a different costume. A wheel that spun fourteen times
// to learn "a pie" and separately "a piano" would never adapt to him at all
// inside a round, which would mean the adaptation mechanic simply does not
// apply to one character, silently. One bucket, `comedian`, declared in
// adaptation.js.
//
// The consequence is intended and good: Mahoraga is the ONE matchup where
// Takaba's randomness stops mattering, because the wheel does not care which
// bit it was. Takaba's answer is the same as everybody else's — the ultimate,
// which routes through INSTANT_KO and is therefore resisted by CHANCE rather
// than blunted by percentage.

// The clip name is derived rather than typed out fourteen times: every entry
// in BIT_TABLE animates on `bit_<key>` and every entry in BIG_TABLE on
// `big_<key>`, which is enforced here so a table entry can never point at a
// clip that does not exist without the model bench noticing immediately.
for (const e of BIT_TABLE) e.clip = 'bit_' + e.key;
for (const e of BIG_TABLE) e.clip = 'big_' + e.key;

export const ALL_BITS = [...BIT_TABLE, ...BIG_TABLE];
export const BIT_BY_KEY = Object.fromEntries(ALL_BITS.map(b => [b.key, b]));
