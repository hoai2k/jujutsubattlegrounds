// URAUME — 裏梅. ICE FORMATION 氷凝呪法. THE CONTROL ZONER.
//
// ===========================================================================
// THE RESEARCH, AND WHAT IT CHANGED
// ===========================================================================
// Sources (web, 2026-08-21): the Jujutsu Kaisen Wiki entries for Uraume, Ice
// Formation, Frost Calm and Icefall, read as raw wikitext through the fandom
// MediaWiki API. The full quotations are at the top of combat/frost.js; the
// short version and its consequences:
//
//   THE TECHNIQUE IS ICE FORMATION 氷凝呪法 (Hikori Juhō), not a generic
//   "ice-based cursed technique". It lowers the temperature around the user to
//   extreme levels; they generate solid ice by TOUCHING A SURFACE, manifest
//   frozen mist, and move ice through the air CRYOKINETICALLY.
//
//   IT HAS TWO NAMED EXTENSIONS, and the brief's two invented technique names
//   are both replaced by them:
//     · "ICE SHARDS" -> ICEFALL 直瀑 (Chokubaku). Frost the hand, touch the
//       ground, grow interconnected block-shaped sheets, break them apart and
//       levitate the pieces at the target. They freeze on contact and giant
//       icicles then rain down on the frozen bodies.
//     · "GLACIAL ERUPTION" -> FROST CALM 霜凪 (Shimonagi), "the pinnacle of
//       Ice Formation". Supercooled cursed energy blown from the mouth as a
//       cloud of mist, guided by the hand, which materialises on contact into
//       thick sheets and COLUMNS of ice that hold the target in place.
//     The brief's descriptions of the two moves are almost exactly right and
//     only their names were wrong, which is a good sign for the brief and a
//     bad one for building a character off memory.
//
//   *** URAUME HAS NO DOMAIN EXPANSION. *** They are never shown casting one
//   and the wiki lists none. So D-pad Right is a BURST with the faster
//   non-domain startup, and they join Nanami, Yuji, Todo, Toji, Hanami,
//   Kurourushi, Choso, Nobara, Geto, Naoya, Kashimo, Maki, Yuki, Miwa, Yaga
//   and Takaba on that list. `domain: null`.
//
//   THE ULTIMATE IS CANON AND IS NOT THE "TOTAL GLACIATION" THE BRIEF OFFERS
//   AS A FALLBACK. The brief says to research their strongest shown technique
//   and to fall back to an invented one only "if nothing definitive exists".
//   Something definitive exists: MAXIMUM OUTPUT: FROST CALM 出力最大「霜凪」,
//   ch.215 — Uraume intervened in Sukuna's fight with Yuji and Maki and ENDED
//   IT WITH A SINGLE ATTACK. That is what D-pad Right is. It still does what
//   the brief's fallback wanted (heavy damage, maximum frost, the whole
//   playspace frozen for the rest of the round), because that is what the
//   canon technique at maximum output visibly does — but it is the real move
//   with the real name.
//
//   ONE MORE THING THE RESEARCH GAVE THE KIT FOR FREE. The Hakari fight,
//   ch.245: Uraume "froze the ground to burst underground pipes, creating more
//   water for Uraume to freeze and utilize to their advantage." That is the B
//   button. FROST FIELD is not an invented panic button bolted onto an ice
//   character — it is the single cleverest thing the character is shown doing,
//   which is turning the floor into more of themselves.
//
// ===========================================================================
// THE DESIGN — THE OPPOSITE KIND OF ZONER TO JOGO
// ===========================================================================
// The roster already has a fire zoner who wins by ATTRITION. Uraume must not
// be a reskin of him, and the separation is total rather than cosmetic:
//
//   JOGO   deals damage from range and waits for it to add up. BURN is a
//          damage-over-time that kills you slowly; you can ignore it while you
//          win the fight. His ultimate is a twenty-second attrition domain.
//   URAUME deals almost NO damage from range. FROST does no damage over time
//          at all — it takes your legs, your dash and your startup, and the
//          floor stops holding your feet. You cannot ignore it, because it is
//          not doing anything TO your health; it is removing your ability to
//          play the game you were playing.
//
// The measured shape of that: Jogo's Ember Insects do 2.5 x 4 and stack burn.
// Uraume's Icefall does 3.5 x 5 and stacks frost. Almost the same number on
// the health bar, and completely different consequences.
//
// TECHNIQUES ARE CHEAP. 12 / 18 against Jogo's 14 / 26 and a better regen —
// they should be throwing ice constantly, and the fantasy is a fighter who
// never stops working rather than one who is saving up.
//
// Canon-correct: no Domain Expansion.
import { withDefaults } from './schema.js';
import { FROST, ICE_TERRAIN } from '../combat/frost.js';

export const URAUME = withDefaults({
  id: 'uraume', name: 'URAUME', title: 'THE FROZEN STAR — ICE FORMATION',
  jpName: '裏梅',

  stats: {
    // AVERAGE ACROSS THE BOARD, and that is a decision rather than a default.
    // Everything unusual about this character is in what they do to the
    // OPPONENT's numbers; giving them unusual numbers of their own as well
    // would have made them a zoner who is also hard to catch, which is the
    // shape nobody enjoys playing against.
    hp: 100, walkSpeed: 2.6, runSpeed: 5.2, dashSpeed: 8.6, jumpVel: 8.8,
    // GOOD REGEN, MODEST GROWTH. They fund themselves by throwing ice rather
    // than by landing punches, which is what lets the character be played
    // entirely at range without ever being starved — the thing that is
    // frustrating about Jogo.
    startMaxCE: 44, ceRegen: 3.0, ceGainPerPunch: 5,
    // BELOW-AVERAGE RAW DAMAGE. 0.88, third from the bottom behind Naoya's
    // 0.80 and Geto's 0.82. They are not going to kill you with the ice; the
    // ice is going to hold you still while the round runs out.
    damageScale: 0.88,
    stamina: 100, staminaRegen: 22, dashDrain: 26
  },

  // ---- THE PASSIVE THAT IS NOT A PASSIVE ---------------------------------
  // Declaring `frost` is what makes a fighter the OWNER of ice rather than a
  // victim of it: `IceSystem.tractionFor` returns null for anybody with this
  // key, which is how "Uraume is unaffected by their own ice" is expressed
  // once instead of at four call sites. It also carries the tuning the HUD and
  // the debug overlay print, so the numbers a player is shown come from the
  // same object the mechanics read.
  frost: {
    maxStacks: FROST.maxStacks,
    boundDur: FROST.duration,
    vulnMult: FROST.vulnMult,
    // how much each of the four ice tools applies, gathered here so the
    // stacking rate can be retuned in one place rather than in four
    perPunch: 1, perShard: 1, perCalm: 3, perField: 2, perUlt: FROST.maxStacks
  },

  // ---- X · THE ICE BLADE STRING -------------------------------------------
  // Formed ice on the hands. FAST, CLEAN, MEDIUM REACH, LOW DAMAGE — 4 / 5 / 7
  // startup against a roster norm of 6 / 7 / 10, which puts them second only
  // to Naoya, and 3.4 / 3.8 / 6.2 damage, which puts them near the bottom.
  //
  // ONE FROST STACK PER HIT. A full string is three stacks — half the meter —
  // so a character who gets close enough to be punched by Uraume is halfway to
  // being shelled, and that is the entire reason the ranged game works: the
  // threat of the close range is what makes standing at range a decision.
  //
  // The third hit LAUNCHES rather than knocking down, deliberately opposite to
  // Jogo's third hit. Jogo's ends the exchange and buys him space; Uraume does
  // not want space, they want you exactly where you are, in the air, above the
  // ice they just made.
  punches: [
    { name: 'Ice Blade', dmg: 3.4, startup: 4, active: 2, recovery: 10, reach: 1.42, kb: 1.2, kbY: 0, hitstun: 14, type: 'light', step: 1.2, frost: 1, clip: 'punch1' },
    { name: 'Return Blade', dmg: 3.8, startup: 5, active: 2, recovery: 11, reach: 1.48, kb: 1.6, kbY: 0, hitstun: 16, type: 'light', step: 1.2, frost: 1, clip: 'punch2' },
    { name: 'Rising Blade', dmg: 6.2, startup: 7, active: 3, recovery: 18, reach: 1.52, kb: 2.4, kbY: 7.6, hitstun: 24, type: 'launcher', step: 1.4, frost: 1, clip: 'punch3' }
  ],

  // Y — DESCENDING SPIKE. One column of ice brought down. Their only committed
  // normal, and even it is 16 frames of startup against the shared 16 with a
  // shorter wind-up in the clip.
  heavy: {
    name: 'Descending Spike', dmg: 13, startup: 16, active: 5, recovery: 28,
    reach: 1.88, kb: 5.2, kbY: 0, hitstun: 30, step: 1.6,
    staminaCost: 18, ceGain: 1.6, frost: 2, clip: 'heavy'
  },

  // ---- RB · CT1 — ICEFALL 直瀑 --------------------------------------------
  // ROSTER CONVENTION: RB holds the FURTHEST-REACHING technique of the pair.
  // Icefall travels 14 m; Frost Calm's columns reach 9. The convention holds
  // and no rule is being paid.
  //
  // Canon shape: the hand is frosted, the ground is touched, block-shaped
  // sheets of ice grow and are then broken apart and levitated at the target.
  // Five shards in a spread. LOW DAMAGE, RELIABLE FROST, LOW COMMITMENT — 14
  // frames of startup and 20 of recovery is the cheapest ranged tool in the
  // game after Naoya's Cascade. This is their neutral, and they should be
  // pressing it constantly.
  //
  // The shards TRAVEL, which means they are category A in combat/reflect.js
  // and Uro turns them around. That is correct and it is not a problem: they
  // are worth 3.5 damage each.
  ct1: {
    name: 'Icefall', jpName: '直瀑', cost: 12,
    startup: 14, active: 4, recovery: 20,
    effect: 'uraume_icefall', clip: 'ct1',
    dmg: 3.5, count: 5, speed: 17, spread: 0.42, range: 14,
    frost: 1, kb: 1.1, hitstun: 12,
    // THE ICICLE RAIN. Canon: "once immobilized, targets are finished off by
    // giant icicles that are sent down from above to skewer them." So a shard
    // that connects with a target who is ALREADY FROSTBOUND calls one down.
    // It is a small bonus and it is a real one, and it is the reason the
    // shards keep mattering after the shell has gone up.
    icicle: { dmg: 9, delay: 0.34, radius: 1.5, kbY: 2.0, hitstun: 20 }
  },

  // ---- RT · CT2 — FROST CALM 霜凪 -----------------------------------------
  // The strongest of the pair, and canon's "pinnacle of Ice Formation".
  //
  // A line of ice columns bursting out of the ground, AIMED WITH THE LEFT
  // STICK (the roster-wide `_castDir` read — hold a direction while the cast
  // comes out and the line goes that way; neutral falls back to facing). It
  // does four things at once and that is what makes it the RT:
  //   1. DAMAGE AND KNOCKBACK along the line
  //   2. A LARGE FROST APPLICATION — three stacks, half the meter
  //   3. IT LEAVES ICE TERRAIN where the columns land
  //   4. THE COLUMNS PERSIST for 2.2 s as a REAL PHYSICAL BARRIER before they
  //      shatter — walls in the Bounds, so an opponent genuinely cannot walk
  //      through them and Uraume can cut off an approach with it.
  //
  // Item 4 is the interesting one and it is why this is a control tool rather
  // than a damage tool: the correct use is often to place it BESIDE the
  // opponent rather than on them.
  ct2: {
    name: 'Frost Calm', jpName: '霜凪', cost: 18,
    startup: 20, active: 5, recovery: 26,          // 51f = the clip's 0.95 s
    effect: 'uraume_frostcalm', clip: 'ct2',
    dmg: 15, range: 9, width: 1.6, columns: 5, columnGap: 1.7,
    frost: 3, kb: 5.0, kbY: 2.4, hitstun: 28, destruct: 30,
    // the barrier the columns are, and how long it stands
    barrier: { duration: 2.2, height: 2.6, radius: 0.62 },
    // and the floor it leaves behind
    ice: { radius: 3.2, duration: ICE_TERRAIN.duration }
  },

  // ---- LT · BLOCK — GOOD GUARD -------------------------------------------
  // Below the roster's chip and drain but nowhere near Hanami's wall. They are
  // a technician holding a guard, which is a different thing from a wall being
  // a wall, and the numbers say so: 0.62 / 0.68 against Hanami's 0.32 / 0.40.
  blockChipMult: 0.62,
  blockStaminaMult: 0.68,
  blockStartupFrames: 3,

  // ---- LB · DASH ----------------------------------------------------------
  // Exactly average, with no i-frames — stated explicitly because it would
  // otherwise look like an omission. What is NOT average is that it is
  // unaffected by their own ice, and that is not declared here either: it
  // falls out of `IceSystem.tractionFor` refusing to slow the owner of a
  // patch, which is one rule in one place rather than a flag on a config.
  dashIFrames: 0,
  dashTrail: 'frost',

  size: {
    height: 1.68,
    bodyRadius: 0.30, pushRadius: 0.46,
    hurtRadius: 0.52, hurtHeight: 1.50, hurtCenter: 0.92, hurtPad: 0.14,
    strikeY: 1.18,
    camDist: 0.96, camHeight: 0.02, camPitch: 0
  },

  // ---- B · SPECIAL — FROST FIELD -----------------------------------------
  // Canon-derived (ch.245: they froze the ground to burst the pipes under the
  // Shinjuku streets and made themselves more water to work with). Freezes a
  // wide area of ground INSTANTLY — 16 frames, the second-fastest special in
  // the game — converting it to ice terrain and applying frost to anyone
  // standing in it.
  //
  // THE PANIC BUTTON AND THE SETUP TOOL AT ONCE, which is unusual and is the
  // best thing about the character: the same press that buys space when
  // somebody is on top of you also builds the floor you wanted to fight on.
  // A player who only ever uses it defensively is playing it correctly and is
  // also leaving half of it on the table.
  //
  // Priced so it is available roughly twice per bar and cannot be held up as a
  // wall: 22 CE and a 9-second cooldown.
  special: {
    key: 'uraume_frostfield', name: 'FROST FIELD', jp: '氷結',
    cost: 22, cooldown: 9, castFrames: 16, recovery: 18, clip: 'frostField',
    radius: 6.0, duration: ICE_TERRAIN.duration, frost: 2,
    dmg: 4, kb: 1.0
  },

  // ---- D-pad Right · ULTIMATE — MAXIMUM OUTPUT: FROST CALM ----------------
  // 出力最大「霜凪」. NON-DOMAIN, so it pays the standard gate (MAX_CE 100 + a
  // full bar) and the full bar, takes the standard backlash, and gets the
  // faster startup the other burst ultimates get.
  //
  // CANON, ch.215: this ended Sukuna's fight with Yuji and Maki in one attack.
  // A wall of glaciation that crosses the whole arena — heavy damage, MAXIMUM
  // FROST (which means every target it touches is shelled on the spot), and
  // the entire playspace frozen for the rest of the round.
  //
  // THE TERRAIN IS THE REAL PAYLOAD AND THE DAMAGE IS THE BONUS, which is the
  // same duality Hanami's Wooden Ball has and is deliberately the same shape:
  // against a healthy opponent it is often correct to throw this purely for
  // the floor. 46 damage is mid-table for an ultimate on purpose.
  ultimate: {
    kind: 'burst', name: 'MAXIMUM OUTPUT: FROST CALM', jpName: '出力最大「霜凪」',
    startup: 38, active: 22, recovery: 43,         // 103f = the clip's 1.72 s
    effect: 'uraume_maxfrost', clip: 'ult',
    dmg: 46, range: 34, width: 7.0, advanceSpeed: 15,
    // IT ENCASES, IT DOES NOT LAUNCH. This shipped as kb 7.0 / kbY 3.0 with a
    // knockdown, which threw the target twenty feet down the arena — so the
    // shell that was supposed to be the whole point of the attack closed round
    // a body that was already mid-flight and was over before they landed. It
    // read as a big knockback, not as being frozen. The wall now barely nudges
    // them and the FROSTBOUND is what they actually experience.
    kb: 0.9, kbY: 0, hitstun: 44, destruct: 70,
    hitType: 'heavy',
    frost: FROST.maxStacks,
    // ...and the shell it lays is the ULTIMATE-SCALE one: FROST.ultDuration
    // (1.8 s) with movement removed outright, rather than the kit's 0.55 s
    // shuffle. Still broken by a single hit, still leaves every input alive.
    ultRoot: true,
    boundDur: FROST.ultDuration,
    // THE ARENA FREEZES AND STAYS FROZEN. `permanent` skips the thaw clock
    // entirely, so this is the only ice in the game with no lifetime.
    ice: { radius: 15.0, duration: 999, permanent: true }
  },

  // canon-correct: no Domain Expansion
  domain: null,

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 28, chip: 24 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // What Copy takes off Uraume is ICEFALL, not Frost Calm and not the field.
  // The reasoning is the one Naoya's and Hanami's entries already use: Copy
  // holds an ATTACK, and of the three the shards are the only one that is
  // purely an attack. Frost Calm builds a barrier and lays terrain, and a
  // field is terrain outright — neither is a thing a slot can hold, and
  // handing the character with the highest output in the game a tool that
  // reshapes the floor is a different character's problem.
  //
  // The copied version keeps the frost application, because frost with no
  // frost is just a small rock.
  copyEffect: { effect: 'uraume_icefall', dmg: 3.0, count: 3, name: 'Copied: Icefall' }
});
