// ===========================================================================
// KASUMI MIWA — THE COUNTER CHARACTER
// ===========================================================================
// No cursed technique, and the weakest raw kit in the game. She is a
// swordswoman with a stance and a circle. Played passively she is the worst
// character on the roster; played as a trap she is the hardest to approach.
//
// ---------------------------------------------------------------------------
// THE WEAKEST KIT IN THE GAME, ON PURPOSE, AND MEASURABLY
// ---------------------------------------------------------------------------
// This is not flavour text. Against the roster she has:
//   · the LOWEST damageScale at 0.82 (next lowest is Maki's stage-0 0.86,
//     and hers climbs out of it — Miwa's never moves)
//   · the SECOND-LOWEST health at 94
//   · no cursed technique, so `ct1` and `ct2` are both sword moves rather
//     than techniques, and neither costs cursed energy
//   · a punch string that does 4/5/9 — the lowest total in the game
// Everything she has is in the circle, and the circle is on a stamina clock.
// If the opponent refuses to walk into it she loses, and that is a legitimate
// way to beat her.
//
// ---------------------------------------------------------------------------
// SIMPLE DOMAIN 簡易領域 — AND THE UNIVERSAL ONE IS UNCHANGED
// ---------------------------------------------------------------------------
// A universal Simple Domain already exists in this project: a defensive STATE
// (`simpleDomain`) that any fighter can hold while trapped inside an enemy
// domain, driven from domains.js `_trappedControls`, drained by
// `cfg.simpleDomainDrain`. THAT SYSTEM IS NOT TOUCHED. Every other character
// still gets exactly what they got before, including Miwa herself — she can
// still hold the generic one inside a domain like anybody else, and her
// `simpleDomainDrain` below is the best number on the roster, which is the
// small nod her New Shadow Style training earns in that system.
//
// HERS is a separate, additional ability on B, implemented in
// combat/newshadow.js as a free-standing ZONE she can deploy at any time,
// anywhere, in or out of a domain. It is a genuine ability rather than the
// generic option, exactly as the brief asks. The two coexist and never
// interact: one is a state on her body, the other is an object on the ground.
//
// AND IT IS NOT A DOMAIN EXPANSION. Simple Domain is a defensive barrier
// technique. `domain: null` below is canon-correct and is not a compromise.
//
// ---------------------------------------------------------------------------
// THE GUARANTEE, AND WHY IT IS ROUTED THE WAY IT IS
// ---------------------------------------------------------------------------
// Every sword slash she makes inside her own circle HITS. It cannot be
// blocked, dodged, i-framed or spaced out. This is routed through the SAME
// `sureHit` flag the domain system already uses — combat/fighter.js
// `_applyHit` has a dozen `!hit.sureHit` guards on exactly the defensive
// mechanisms this has to beat, and reusing them means there is one bypass path
// in the codebase rather than two. See combat/newshadow.js for the routing and
// the delivery notes for the audit against every defensive option in the game.
//
// ---------------------------------------------------------------------------
// THE BALANCE FRAME — read this before touching any number here
// ---------------------------------------------------------------------------
// A guaranteed-hit zone is the most dangerous thing in this roster to balance.
// The guarantee is the character and must not be the dial. The dials, in the
// order they should be reached for:
//   1. `simpleDomainZone.radius`      — smaller is weaker, fastest fix
//   2. `simpleDomainZone.drain`       — faster drain is weaker
//   3. `simpleDomainZone.moveMult`    — slower inside is weaker
//   4. `simpleDomainZone.cooldown`    — longer is weaker
// and only after all four are exhausted should anything touch what the circle
// DOES. My honest read on whether the current numbers are fair is in the
// delivery notes and it is not an unqualified yes.
import { withDefaults } from './schema.js';

export const MIWA = withDefaults({
  id: 'miwa', name: 'MIWA', title: 'NEW SHADOW STYLE',

  stats: {
    // SECOND-LOWEST HEALTH. (Yuta 92 · MIWA 94 · Gojo 95 · Nobara 96)
    hp: 94,
    // Middling legs. She is not fast — her mobility answer is the step-back
    // and the parry, not running away — and inside the circle she is slower
    // than anybody in the game.
    walkSpeed: 2.70, runSpeed: 5.10, dashSpeed: 8.40, jumpVel: 8.6,
    // A NORMAL BAR, which she needs for exactly one thing: the ultimate.
    // Nothing else in her kit costs cursed energy, because she has no cursed
    // technique to spend it on — the sword moves are free and the circle is
    // paid for in stamina. That means her bar climbs untouched all round and
    // the ultimate is genuinely reliable, which is a real strength and is
    // most of what keeps her viable.
    startMaxCE: 40, ceRegen: 2.4, ceGainPerPunch: 7,
    // A DEEP POOL WITH FAST REGEN, and it is not generosity — the circle eats
    // stamina and the parry and step-back both cost it. This number is the
    // real length of her circle, and it is the second dial after the radius.
    stamina: 140, staminaRegen: 30, dashDrain: 24,
    // THE LOWEST IN THE GAME. She does not hit hard. She hits.
    damageScale: 0.82
  },

  // ---- THE SWORD STRING: FAST, CLEAN, LOW DAMAGE ------------------------
  // The lowest-damage string on the roster and among the fastest. Decent
  // reach, because it is a sword. The third hit KNOCKS DOWN rather than
  // launching — she cuts people down, she does not lift them, and a knockdown
  // is also the more useful ender for a character whose whole plan is to
  // create space and set up.
  punches: [
    { name: 'Kiriage', dmg: 4, startup: 5, active: 3, recovery: 11, reach: 1.70, kb: 1.5, kbY: 0, hitstun: 13, type: 'light', step: 1.6 },
    { name: 'Kesa', dmg: 5, startup: 6, active: 3, recovery: 12, reach: 1.72, kb: 2.0, kbY: 0, hitstun: 15, type: 'light', step: 1.6 },
    { name: 'Kiriorishi', dmg: 9, startup: 9, active: 4, recovery: 20, reach: 1.78, kb: 4.2, kbY: 0, hitstun: 28, type: 'knockdown', step: 1.8 }
  ],

  heavy: {
    name: 'Overcut', dmg: 12, startup: 15, active: 5, recovery: 27,
    reach: 1.95, kb: 5.0, hitstun: 29, step: 2.2, staminaCost: 18, clip: 'heavy'
  },

  // ---- GUARD, THE PARRY, AND THE STEP-BACK ------------------------------
  // GOOD GUARD, and real defensive fundamentals — she is a trained
  // swordswoman and the numbers should say so even though nothing else about
  // her is strong.
  blockStaminaMult: 0.62,
  blockChipMult: 0.68,
  dashIFrames: 3,
  // THE PARRY. A tight window on a well-timed guard input. 6 frames is
  // genuinely tight (Hakari's counter window is 10) and the reward is
  // deliberately modest — it does not counter-hit, it just gives her the turn
  // back with no chip and a big advantage window. She is not a counter-hit
  // character; she is a "please stop hitting me for one second" character.
  parry: {
    window: 6,               // frames from the guard input
    cooldown: 22,            // frames before another parry can be attempted
    staminaCost: 8,
    advantage: 26,           // frames of freeze on the attacker
    chipMult: 0,             // a parry takes NO chip
    clip: 'parry'
  },
  // THE STEP-BACK. A short retreat that keeps her facing. Costs less stamina
  // than a dash and covers less ground; it is a spacing tool, not an escape.
  stepBack: { dist: 2.1, frames: 19, staminaCost: 12, clip: 'stepBack' },

  // =========================================================================
  // RT — SHEATHE STANCE, and RB — THE DRAW
  // =========================================================================
  // These two are one move in two halves and neither works without the other.
  // RT enters the stance and HOLDS to charge; RB releases it as the draw. The
  // draw is not available from neutral at all — `requireStance` is what says
  // so, and it is why her one big hit is also her most committal.
  ct2: {
    name: 'SHEATHE STANCE', jp: '抜刀構え', cost: 0,
    effect: 'miwa_stance',
    // entering is fast; it is the HOLDING that is dangerous
    startup: 8, active: 1, recovery: 10,
    // ---- THE CHARGE TIERS ------------------------------------------------
    // Four tiers. The frame counts are how long she has to hold to reach each
    // one, and the multipliers are what the draw is worth there.
    //
    // Tier 0 is available immediately, so a panic draw is always possible —
    // it just is not worth much. Tier 3 takes 1.7 seconds of standing almost
    // completely still in the open, which is an eternity in this game and is
    // the reason the circle exists: inside her Simple Domain the auto-counter
    // protects her while she does it, and that interaction is the entire
    // gameplan.
    tiers: [
      { at: 0, name: 'DRAW', dmgMult: 1.00, reach: 3.2 },
      { at: 34, name: 'DRAW · 二', dmgMult: 1.55, reach: 3.8 },
      { at: 68, name: 'DRAW · 三', dmgMult: 2.20, reach: 4.5 },
      { at: 102, name: 'DRAW · 極', dmgMult: 3.10, reach: 5.4 }
    ],
    maxHoldFrames: 102,
    // she is NEARLY immobile while charging — not fully, so she can adjust
    // her line, but nowhere near enough to escape anything
    moveMult: 0.22,
    // and vulnerable: no armour, and taking any hit drops the stance and the
    // charge with it
    dropOnHit: true,
    clip: 'stance',
    enterClip: 'stanceEnter'
  },

  ct1: {
    // NEW SHADOW STYLE: SIMPLE DOMAIN DRAW. Her one big hit.
    //
    // VERY HIGH DAMAGE, VERY LONG STARTUP, and only from the stance. 20
    // frames of startup on a move that has already cost her up to 102 frames
    // of charging is enormous commitment, and the 38-frame recovery on a
    // whiff is a full punish from anybody.
    //
    // At tier 3 this does 34 × 3.10 = 105 raw damage before the global damage
    // scale — comfortably the biggest single non-ultimate hit in the game,
    // from the weakest character in the game, off the longest setup in the
    // game. That shape is the character.
    name: 'NEW SHADOW STYLE DRAW', jp: '新陰流・抜刀', cost: 0,
    startup: 20, active: 3, recovery: 38,
    effect: 'miwa_draw', dmg: 34, reach: 3.2, width: 1.05,
    kb: 6.0, kbY: 0, hitstun: 34, type: 'knockdown',
    requireStance: true,
    // it is a LINE, not an arc — the blade goes through, and the hit test is
    // the same line test Toji's Vacuum Lance uses so the picture and the
    // hitbox are the same object
    line: true,
    destruct: 40,
    clip: 'ct1'
  },

  // =========================================================================
  // B — SIMPLE DOMAIN 簡易領域. THE CHARACTER.
  // =========================================================================
  // Rules in combat/newshadow.js; every number here.
  special: {
    key: 'miwa_simple_domain', name: 'SIMPLE DOMAIN', jp: '簡易領域',
    // NO CURSED-ENERGY COST. She has no cursed technique and the circle is
    // paid for entirely in stamina, continuously, for as long as she holds
    // it. A bar cost on top would be a second clock on the same decision.
    cost: 0,
    // THE REAL COOLDOWN, and it starts when the circle DROPS, not when it is
    // cast — so a long hold is followed by a long gap, and she cannot simply
    // re-place it the moment somebody steps out.
    cooldown: 7.5,
    castFrames: 26,
    clip: 'special'
  },

  simpleDomainZone: {
    // ---- THE RADIUS. The first and most important dial. ------------------
    // 3.1 m. For scale: her own punch string reaches 1.7, Yuki's reaches
    // 2.15, and Toji's dash covers about 4 m in a quarter-second. So the
    // circle is roughly two of her own steps across — a TRAP to be baited
    // into, not zone control. An opponent standing 4 m away is completely
    // safe and can stay there all day.
    radius: 3.1,
    // ---- THE COST -------------------------------------------------------
    // 26 stamina/second against a 140 pool with 30/s regen — but the regen is
    // HALTED while it is up (`haltRegen`), so the real figure is 26/s from a
    // full tank: about 5.4 seconds at absolute maximum, and less than that in
    // practice because moving inside it and auto-countering both cost extra.
    // Five seconds is not long. It is meant not to be.
    drain: 26,
    haltRegen: true,
    counterCost: 4,          // each auto-counter costs stamina on top
    // ---- SHE IS SLOW INSIDE IT ------------------------------------------
    // 0.42 of her walk speed — 1.13 m/s, the slowest movement in the game by
    // a wide margin. She cannot pursue. If they back off, she watches them
    // back off. This is the counterplay the brief asks for and it is not a
    // token one.
    moveMult: 0.42,
    // ...and leaving drops it, which is stated as a rule rather than left to
    // fall out of the radius check
    dropOnLeave: true,
    // she also cannot dash inside it — dashing is leaving
    allowDash: false,

    // ---- THE AUTO-COUNTER ------------------------------------------------
    // Anything crossing the boundary INWARD is cut. She does not input it.
    autoCounter: {
      dmg: 11,
      kb: 3.4, kbY: 0, hitstun: 22,
      // a short lockout so a target dancing on the boundary is not shredded
      // frame-by-frame — this is the number that stops the circle being an
      // instant-kill for anyone who touches it
      cooldown: 0.34,
      clip: 'counter'
    },
    // PROJECTILES crossing the boundary are cut down and destroyed outright.
    // No cooldown on this one: a projectile is consumed by being cut, so
    // there is no rapid-fire exploit — each shot pays for its own removal.
    cutsProjectiles: true,

    // ---- THE GUARANTEE ---------------------------------------------------
    // Her sword slashes hit anything inside the circle, full stop. Routed
    // through `sureHit`. See combat/newshadow.js.
    sureHitInside: true,
    // ...and it applies to her SWORD only. Not to the ultimate's cast, not to
    // anything she does outside, and not to the auto-counter's own damage
    // being somehow doubled. One rule, one place.
    sureHitMoves: ['punch', 'heavy', 'miwa_draw', 'miwa_counter'],

    // ---- NEUTRALISING SURE-HIT DOMAIN EFFECTS ---------------------------
    // What Simple Domain canonically does, and the reason it exists at all.
    // Inside the circle, an enemy Domain Expansion's guaranteed damage stops
    // landing — routed through the same `sdHolds` predicate the existing
    // `simpleDomain` STATE checks already use in domains.js, so it is one
    // rule applied at the sites that already exist rather than a second
    // mechanism. See the delivery notes for what it does to each of the eight
    // domains individually.
    neutralisesDomains: true,

    // ---- THE VISUAL ------------------------------------------------------
    // Read by fx/newshadowfx.js. Kept here so the whole ability is one file
    // to tune.
    ringColor: 0xa8d8e8,
    ringHot: 0xffffff,
    wallOpacity: 0.14,
    inscribeSeconds: 0.32,    // the ring is DRAWN, in step with her sweep
    patternSpin: 0.22         // radians/second — slow
  },

  // =========================================================================
  // D-PAD RIGHT — THE MAXIMUM DRAW
  // =========================================================================
  // STANDARD GATE (MAX_CE 100 + full CURRENT_CE), full bar cost, standard
  // burst backlash (`consumeFullBar()`), NON-DOMAIN STARTUP. She has no
  // Domain Expansion and is canon-correct not to.
  //
  // "The circle expands dramatically, she draws once, and everything inside is
  // cut in a single stroke. One frame of contact, one clean line, then the
  // aftermath. Understated and lethal — the opposite of Todo's or Yuki's."
  //
  // So: no multi-hit, no sequence, no screen-filling explosion. One hit. The
  // whole cost of the move is paid in the 1.1 seconds of absolute stillness
  // before it (see the ult clip in anim/miwa.js), and the payoff is a single
  // unavoidable line.
  ultimate: {
    kind: 'burst', name: 'SIMPLE DOMAIN · MAXIMUM', jpName: '簡易領域・極',
    startup: 30, active: 2, recovery: 36,
    effect: 'miwa_max_draw', clip: 'ult',
    // THE EXPANSION. The circle grows to nearly four times its normal radius
    // over the startup — this is the telegraph, and at 11.4 m it covers most
    // of an arena, so backing off is not the answer to this one.
    radius: 11.4,
    expandSeconds: 0.95,
    // ONE HIT. Unblockable and sure-hit, like the circle itself.
    dmg: 62, kb: 7.0, kbY: 0, hitstun: 44, type: 'knockdown',
    unblockable: true,
    // ...and it cuts EVERYTHING inside, which for once includes summons:
    // Garuda, shikigami, curses and minions all take it. That is the one
    // place her restraint is expressed as breadth instead of as damage.
    cutsSummons: true, summonDmg: 40,
    destruct: 80,
    // the aftermath: a long, quiet hold before the game resumes
    holdFrames: 46
  },

  // NO DOMAIN. Simple Domain is a barrier technique, not a Domain Expansion,
  // and this line is the one that says so unambiguously.
  domain: null,

  // ---- THE UNIVERSAL SIMPLE DOMAIN, WHICH SHE ALSO HAS ------------------
  // The generic anti-domain state everybody gets. Hers is the BEST NUMBER ON
  // THE ROSTER — 9 against Nanami's 11, which was previously the strongest —
  // and that is the whole nod her training gets in the shared system. It does
  // NOT change anything about how that system works for anybody else.
  simpleDomainDrain: 9,
  barrierBreak: { ceDrain: 30, chip: 20 },

  // WHAT YUTA'S COPY GETS FROM HER. She has NO cursed technique, so — exactly
  // as with the two Heavenly Restrictions — Copy cannot store one. It stores
  // the sword instead: a single New Shadow Style cut, at the base tier and
  // WITHOUT the guarantee, because the guarantee belongs to her circle and
  // her circle is not a technique either.
  copyEffect: { effect: 'miwa_draw', dmg: 11, name: 'Copied: New Shadow Style' }
});
