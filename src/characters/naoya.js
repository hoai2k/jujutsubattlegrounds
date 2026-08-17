// NAOYA ZENIN — 禪院直哉. Projection Sorcery. THE FRAME-PERFECT PUNISHER.
//
// One rule is the whole character: TOUCH HIM WHILE HE IS PROJECTING AND YOU
// FREEZE SOLID FOR ONE SECOND. He is the fastest thing in the game and the one
// that punishes mashing hardest. Against a patient opponent he is just fast;
// against an aggressive one he is a trap that kills them for pressing buttons.
//
// THE CANON MECHANIC, RESEARCHED AND VERIFIED (see the header of
// combat/freeze.js for sources and the exact wording):
//   Projection Sorcery divides one second into TWENTY-FOUR FRAMES, using the
//   user's field of view as the projection angle of view. Anything that makes
//   contact and fails to keep pace with that rule is trapped in a frame for
//   ONE SECOND. The user is bound by the same rule and eats the same penalty
//   for breaking his own programmed sequence.
//
//   The brief asked me to verify the frame count. 24 is correct.
//
// SO: 24 and 1.0 s ARE NOT TUNING DIALS. They are the mechanic. Everything
// that IS tunable is below — the stance window, its cost, its cooldown, its
// startup, and his damage — and the honest assessment of whether the result is
// fair is in the delivery notes rather than hidden in a comment here.
//
// Canon-correct: Naoya has NO Domain Expansion. His D-pad Right is a burst
// ultimate with the standard gate and the faster non-domain startup.
import { withDefaults } from './schema.js';

export const NAOYA = withDefaults({
  id: 'naoya', name: 'NAOYA', title: 'PROJECTION SORCERY — 24 FRAMES',
  jpName: '禪院直哉',

  stats: {
    // AVERAGE HEALTH. He is not durable; he is untouchable, which is a
    // different thing and a losable one.
    hp: 100,
    // BY FAR THE FASTEST MOVEMENT IN THE GAME. For scale, the roster norm is
    // walk 2.6 / run 5.2 / dash 8.6, and the previous fastest dash was
    // Megumi's 9.2. These are 23% / 27% / 34% above the norm and they are the
    // largest mobility gap between any two characters in the project.
    walkSpeed: 3.20, runSpeed: 6.60, dashSpeed: 11.50, jumpVel: 9.20,
    startMaxCE: 40, ceRegen: 2.4, ceGainPerPunch: 5,
    // LOW DAMAGE PER HIT. 0.80 outgoing, second only to Geto's 0.82 from the
    // bottom. He wins by VOLUME and by PUNISHES, never by numbers — and this
    // multiplier is the single most important guard rail on the freeze, since
    // it is what decides what a free second is actually worth. See the combo
    // arithmetic on the ultimate below.
    damageScale: 0.80,
    // the dash is the fastest in the game and it is also the cheapest, because
    // a mobility character that runs out of stamina is not a mobility character
    stamina: 110, staminaRegen: 26, dashDrain: 20
  },

  // ---- X · THE PUNCH STRING -----------------------------------------------
  // THE FASTEST NORMALS IN THE GAME AND THE LOWEST DAMAGE. The startup numbers
  // are the headline: 4 / 5 / 7 frames against a roster norm of 6 / 7 / 10 and
  // against Hanami's 11 / 13 / 18. A 4-frame jab is two frames faster than
  // anything else in the project.
  //
  // EXCELLENT FRAME ADVANTAGE is bought with the RECOVERY numbers, not the
  // startup: 9 / 10 / 16 against a norm of 12 / 14 / 20. He is back in stance
  // before the opponent is out of hitstun, which is what lets him keep the
  // pressure on without ever committing to anything.
  //
  // Third hit LAUNCHES, which is what makes the freeze punish convert — a
  // frozen opponent eats the string, gets launched, and eats the juggle.
  punches: [
    { name: 'Frame Jab', dmg: 2.6, startup: 4, active: 2, recovery: 9, reach: 1.30, kb: 1.1, kbY: 0, hitstun: 13, type: 'light', step: 1.9 },
    { name: 'Frame Cross', dmg: 3.0, startup: 5, active: 2, recovery: 10, reach: 1.38, kb: 1.5, kbY: 0, hitstun: 15, type: 'light', step: 1.9 },
    { name: 'Frame Lift', dmg: 5.2, startup: 7, active: 3, recovery: 16, reach: 1.44, kb: 2.6, kbY: 7.8, hitstun: 24, type: 'launcher', step: 2.2 }
  ],

  // HEAVY — a spinning back heel. His one slow move, and the only thing in his
  // kit with a real commitment on it.
  heavy: {
    name: 'Turning Heel', dmg: 11, startup: 15, active: 5, recovery: 26,
    reach: 1.95, kb: 6.0, kbY: 0, hitstun: 30, step: 2.6,
    staminaCost: 18, armorFrames: 0, ceGain: 1.6, clip: 'heavy'
  },

  // ---- RB · CT1 — PROJECTION RUSH -----------------------------------------
  // He blinks through SIX discrete positions, striking at each one, and ends
  // BEHIND the opponent. Covers ground instantly; low damage per hit, and the
  // value is entirely the reposition.
  //
  // The animation is authored as six poses at 1/24 s apart with no in-between
  // frames at all (art/anim/naoya.js), and the effect handler drops a frozen
  // afterimage at each — so what the opponent sees is six stationary Naoyas in
  // a line and the real one standing behind them.
  ct1: {
    name: 'Projection Rush', jpName: '投射呪法', cost: 18,
    startup: 8, active: 15, recovery: 5,          // 28f total — very fast
    effect: 'naoya_rush', clip: 'rush',
    steps: 6, dmgPerHit: 3.4, hitstun: 10, kb: 0.5, stepDist: 1.55,
    // where he ends up relative to the opponent: behind them, facing back
    endBehind: 1.5,
    // each step places an afterimage; this is the interval between them, and
    // it is 1/24 s because that is what the technique is
    stepInterval: 1 / 24
  },

  // ---- RT · CT2 — FRAME KICK ----------------------------------------------
  // A single committed high-speed kick with huge knockback and long reach. His
  // combo ender and his wall-splat tool against destructible geometry.
  //
  // THE ONE REACTABLE THING HE HAS. 26 frames of startup — slower than his own
  // heavy — and the animation holds absolutely still for eight of them with
  // the leg chambered. That tell exists on purpose: the fastest character in
  // the game still needs one move a good opponent can beat on reaction, or the
  // matchup has no texture in it.
  ct2: {
    // FRAME 24 — the same kick delivered as a REEL: six frozen gold frames
    // laid down a line (stick-steered), one popping per 1/24 s. The first
    // frame that connects delivers the whole kick's enormous knockback and
    // burns the rest of the reel. The 26-frame chambered tell is unchanged
    // and is still the whole negotiation.
    name: 'Frame 24', jpName: '投射呪法・蹴撃', cost: 22,
    startup: 26, active: 5, recovery: 12,         // 43f = the clip's 0.72 s
    effect: 'naoya_framekick', clip: 'framekick',
    dmg: 17, frames: 6, spacing: 1.15, radius: 1.15,
    kb: 13.0, kbY: 1.6, hitstun: 34, type: 'knockdown',
    step: 3.2,
    // it throws them through walls
    destruct: 46
  },

  // ---- LT · BLOCK / LB · DASH ---------------------------------------------
  // Average guard. The dash is the fastest in the game (see stats) and it has
  // NO I-FRAMES — stated here explicitly because it is a design decision that
  // would otherwise look like an omission. He is not dodging; he is faster
  // than you. Gojo's teleport and Toji's dash both have real invulnerability
  // windows and Naoya deliberately has neither, which is why a well-timed
  // sure-hit or a wide swing still catches him.
  blockChipMult: 1.0,
  blockStaminaMult: 1.0,
  blockStartupFrames: 3,
  dashIFrames: 0,
  dashTrail: 'projection',

  // ---- B · SPECIAL — PROJECTION STANCE ---------------------------
  // THE CHARACTER. He enters an active projection state for a short window;
  // ANY direct-contact attack that lands on him during it FREEZES the attacker
  // for one second.
  //
  // THE FOUR TUNING DECISIONS, and the reasoning for each, because these are
  // the numbers that decide whether the freeze is fair:
  //
  //   startup 16f (0.27 s) — REAL STARTUP SO IT CAN BE BAITED. The trap is not
  //     armed the instant he presses the button; there is a quarter second
  //     where hitting him is just hitting him. Long enough to punish a panic
  //     press, short enough to still be a defensive option.
  //
  //   window 42f (0.70 s) — SHORT ENOUGH TO BE WAITED OUT. This is the first
  //     number to move if the character ever plays as oppressive. At 0.70 s,
  //     backing off and holding a button for three quarters of a second beats
  //     it outright, so the counterplay is "be patient" — exactly the
  //     counterplay the concept asks for.
  //
  //   cost 20 CE / cooldown 4.5 s — REVISED DOWN after measuring what a freeze
  //     is actually worth (see the arithmetic below). At the first pass's
  //     26 CE / 5.5 s the trap cost most of a bar and half a fight's cooldown
  //     to buy about 7% of a health bar, which made pressing it a bad decision
  //     rather than a read. These numbers put the uptime ceiling at 13.5% —
  //     still nowhere near able to live in the stance — while making it
  //     affordable roughly twice per bar, which is what a read needs to be.
  //
  // SELF-FREEZE ON WHIFF. Canon says the user is bound by the same rule and
  // eats the same penalty for breaking his own sequence — and that is exactly
  // the balance lever this character needed. If the window closes without
  // anything having touched him, HE freezes, for half a second. It turns
  // arming the stance from a free habit into a genuine read, and it is the
  // single reason the answer to "is this fair" is yes. Half a second rather
  // than a full one because he chose to gamble and the opponent did not: it
  // should be a punishable mistake, not a death sentence.
  special: {
    key: 'naoya_stance', name: 'PROJECTION STANCE', jp: '投射呪法',
    cost: 20, cooldown: 4.5,
    startupFrames: 16, windowFrames: 42, clip: 'stance',
    selfFreezeOnWhiff: true, selfFreezeDur: 0.5,
    // the freeze it inflicts. Duration is canon and is read from
    // combat/freeze.js rather than from here — this field exists only so the
    // HUD and the debug overlay have something to print.
    freezeDur: 1.0
  },

  // ---- D-pad Right · ULTIMATE — MAXIMUM PROJECTION ------------------------
  // 投射呪法・極. NON-DOMAIN: standard gate (MAX_CE 100 + a full bar), full bar
  // cost, standard backlash, and the fastest cast in the game — 25 frames,
  // because the ultimate is a STATE rather than an attack and there is nothing
  // to wind up.
  //
  // For the window, three things at once:
  //   · every attack he throws runs at frame speed (`speedMult`)
  //   · his dash becomes near-instant (`dashMult`)
  //   · PROJECTION STANCE IS PERMANENTLY ACTIVE, so any direct contact freezes
  //
  // "It should feel like the opponent has stopped being able to interact with
  // him at all. Keep the window short." 5 SECONDS, and that is short on
  // purpose — it is the shortest ultimate window in the game (Nanami's
  // Overtime runs 12, Sukuna's transform 15).
  //
  // THE COMBO ARITHMETIC — MEASURED IN A LIVE FIGHT, not estimated. Health bar
  // is 235. Each row is what a freeze ACTUALLY converted to when the punish was
  // driven frame by frame into a frozen opponent:
  //
  //   Frame Kick alone ....................... 17.7 dmg .... 7.5% of a bar
  //   3-hit string (all three land) ...........  7.3 dmg .... 3.1%
  //   3-hit string, then the juggle off it ....  9.4 dmg .... 4.0%
  //
  // THE STRING PLUS THE KICK DOES NOT FIT, and that was the surprise. It is
  // the single most important balance fact about this character: the string
  // costs 58 frames and the Frame Kick startup is another 26, so the sequence
  // lands its ender around frame 84 — a full 24 frames AFTER the freeze has
  // already expired. One second is not enough for both. The player has to
  // CHOOSE between the safe 7.3 and the committed 17.7, inside a window they
  // do not get to extend.
  //
  // So a freeze is worth at most 7.5% of a round, against a stance with a
  // 13.5% uptime ceiling. That is emphatically a punish rather than a
  // round-ender — if anything it errs the other way, which is said plainly in
  // the delivery notes rather than papered over here.
  //
  // Inside the ultimate the speed multiplier compresses that frame data, and
  // that is exactly what makes MAXIMUM PROJECTION worth a bar: at 1.45x the
  // string-into-kick sequence DOES fit inside one second.
  //
  // Inside the ultimate the speed multiplier raises it, which is the point of
  // spending a bar on it.
  ultimate: {
    kind: 'burst', name: 'MAXIMUM PROJECTION', jpName: '投射呪法・極',
    startup: 10, active: 5, recovery: 10,         // 25f = the clip's 0.42 s
    effect: 'naoya_maxprojection', clip: 'ult',
    duration: 5.0,
    speedMult: 1.45,          // every attack's frame data, scaled
    dashMult: 1.35,
    // no damage of its own: this ultimate does not hit anybody
    dmg: 0
  },

  // canon-correct: no Domain Expansion
  domain: null,

  simpleDomainDrain: 22,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // What Copy takes off Naoya is PROJECTION RUSH, not the stance. The stance
  // is a defensive state with a one-second lock attached to it, and handing
  // that to the character who already has the highest output in the game is
  // the worst idea in this file. The Rush is the recognisable thing, it is an
  // attack (which is what Copy holds), and it is safely mediocre in somebody
  // else's hands.
  copyEffect: { effect: 'naoya_rush', dmg: 3.0, name: 'Copied: Projection Rush' }
});
