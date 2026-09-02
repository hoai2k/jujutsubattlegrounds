// RYU ISHIGORI — 石流龍. CURSED ENERGY DISCHARGE 呪力の放出. THE ARTILLERY.
//
// ===========================================================================
// THE RESEARCH, AND THE THREE THINGS IT CORRECTED
// ===========================================================================
// Sources (web, 2026-08-21): the Jujutsu Kaisen Wiki entries for Ryu Ishigori,
// Cursed Energy Discharge and Granite Blast, read as raw wikitext through the
// fandom MediaWiki API. Full quotations at the top of combat/output.js; the
// corrections are restated here because they are the ones that changed the
// config rather than the module.
//
//  1. THE NAME. The brief guesses "granite/blast". Correct, and more precisely:
//     the INNATE technique is CURSED ENERGY DISCHARGE 呪力の放出, and GRANITE
//     BLAST グラニテブラスト is its extension. The tier table's canon backing is
//     exact — "the blasts MUST BE CHARGED in order to concentrate the cursed
//     energy into a single point before firing, and the strength of the
//     outputted blast depends on how much it has been built up", and "the more
//     cursed energy charged into Granite Blast, THE BROADER ITS ATTACK RANGE
//     BECOMES". Damage AND width scaling with charge is not a game design
//     decision here; it is the technique.
//
//  2. *** HE HAS A DOMAIN EXPANSION, AND IT IS NOT BUILT. ***
//     The brief is not confident either way. He does have one — he casts it in
//     ch.179 with the Peacock King mudra, in a three-way simultaneous
//     expansion with Yuta and Uro — but the wiki is explicit that "the details
//     of his innate domain and his can't-miss function are ENTIRELY UNKNOWN",
//     because the barrier came apart before any of the three was realised.
//     There is no name, no interior, no sure-hit and no refinement in canon.
//     THE ROUTE TAKEN: `domain: null`, and a BURST ultimate. Building him a
//     domain would mean inventing a name, an environment and a sure-hit
//     payload out of nothing, and the fact that a nameless one technically
//     exists does not make an invented one less invented. He is the only
//     character on the roster who is on the burst list for THIS reason rather
//     than because canon gives him no domain, and it is said out loud on his
//     ROSTER entry as well as here.
//     What the domain DOES buy him is the best-attested fact about his tank:
//     he cast one and still had enough left to fire Granite Blast several more
//     times. That is where the 150 ceiling comes from.
//
//  3. *** HE IS NOT WEAK IN CLOSE. *** The brief asks for "weak normals and
//     terrible close-range options" and for getting inside him to be the
//     entire game plan. Canon says the opposite in as many words: "while Ryu
//     excels at long-range combat, HE DOES NOT RELY ON IT and is just as
//     dangerous at close to mid-range", an "expert hand-to-hand combatant" who
//     matched Yuta blow for blow and overpowered Rika. The cannon is his HAIR
//     precisely so his hands stay free to fight with, and "he can output
//     powerful bursts of cursed energy WITH EVERY PHYSICAL ATTACK".
//     THE ROUTE TAKEN, and it is a compromise stated rather than hidden: the
//     ARCHETYPE the brief is buying is kept in full — he is the slowest
//     character in the game, his dash is the worst in the game, his reach is
//     the shortest in the game and his startup is the worst in the game, so
//     getting inside him is still the whole game plan and it still works. What
//     changed is that his normals HURT: 9 / 10 / 16 rather than the 3 / 3 / 6
//     Jogo gets. He is not a brawler and he will lose a close-range exchange
//     on frame data every time; he is simply not free once you are there.
//     See the honest assessment in the delivery notes for whether that was
//     enough.
//
// ===========================================================================
// THE DESIGN
// ===========================================================================
// He is a COMMITMENT MACHINE. He plants, he charges, he fires, and if he
// guessed wrong he eats a full combo. Every number below is chosen so the
// counterplay is obvious and the punishment for ignoring it is total.
//
// THE TWO NUMBERS THAT DEFINE HIM, up front:
//   MAX_CE CEILING 150 against the roster's 100. See the long note in
//     combat/output.js for why this is a TANK and not a GATE, and for the
//     audit of the two existing mechanics that read a target's MAX_CE. The
//     gate is still 100 and still means the same thing for everyone.
//   CE REGEN 1.1/s against the roster's 2.2 and Uraume's 3.0. The slowest
//     refill in the game by a distance. A huge tank that fills slowly is the
//     whole resource fantasy: every shot matters, and BRACE is the only way to
//     hurry it.
import { withDefaults } from './schema.js';
import { RYU_CE_CEILING, TIERS, MAX_HOLD, BRACE } from '../../combat/output.js';

export const RYU = withDefaults({
  id: 'ryu', name: 'RYU', title: 'CURSED ENERGY DISCHARGE — THE CANNON',
  jpName: '石流龍',

  stats: {
    // HIGH HEALTH. Canon backs it hard — "immense endurance", he took his own
    // Granite Blast, several hits from Rika, and reduced Sukuna's Dismantle to
    // a single cut by reinforcement. 128 is third on the roster behind
    // Hanami's 145 and Kurourushi's.
    hp: 128,
    // *** THE SLOWEST MOVEMENT IN THE GAME AND THE WORST DASH IN THE GAME. ***
    // For scale: the roster norm is walk 2.6 / run 5.2 / dash 8.6, and the
    // previous slowest was Hanami at 1.90 / 3.60 / 5.60. Ryu is under him on
    // the dash and level with him on the legs. He genuinely cannot escape
    // pressure and he genuinely cannot chase.
    walkSpeed: 1.90, runSpeed: 3.55, dashSpeed: 5.30, jumpVel: 7.20,
    startMaxCE: 46,
    // THE CEILING. See the header, and combat/output.js for the audit.
    ceCeiling: RYU_CE_CEILING,
    // THE SLOWEST REFILL IN THE GAME. Half the roster norm.
    ceRegen: 1.1,
    // ...and he grows the bar slowly too, because a 150 ceiling reached at the
    // roster's growth rate would put him at the ultimate gate as fast as
    // everyone else while carrying half again as much.
    ceGainPerPunch: 4.5,
    damageScale: 1.10,
    // stamina is generous, because his dash is so bad that draining it as well
    // would be kicking a man who is already on the floor
    stamina: 120, staminaRegen: 24, dashDrain: 22
  },

  // ---- THE PASSIVE THAT IS NOT A PASSIVE ---------------------------------
  // Declaring `output` is what makes RT a HOLD rather than a press, what makes
  // `_clip` swap the charge posture per tier, and what makes `threatOf` return
  // a real number for the arena effects. Every tuning number the charge reads
  // lives on the TIER TABLE in combat/output.js rather than here, because the
  // table has to be shared with the HUD, the CPU and the effect handler and a
  // second copy would drift.
  output: {
    name: 'Granite Blast', jpName: 'グラニテブラスト',
    effect: 'ryu_beam',
    chargeClip: 'charge', fireClip: 'ct2',
    // the frames the RELEASE costs, on top of whatever the tier adds
    fireStartup: 8, fireActive: 4, fireRecovery: 26, recoveryPerTier: 5,
    // ...and what a dry release (charged with an empty bar) costs him
    dryRecovery: 30,
    maxHold: MAX_HOLD,
    tiers: TIERS
  },

  // ---- X · THE STRING -----------------------------------------------------
  // SLOW, HEAVY, SHORT REACH. The startup numbers are the headline and they
  // are the worst in the game: 13 / 15 / 20 against a roster norm of 6 / 7 / 10
  // and against Naoya's 4 / 5 / 7. His jab is THREE TIMES Naoya's.
  //
  // The reach is the other half and it is the more important one: 1.28 / 1.32
  // / 1.36 against a norm of 1.35-1.50 and against Hanami's 2.30-2.50. He has
  // the SHORTEST NORMALS ON THE ROSTER, so an opponent who is inside his
  // charge is also, usually, inside his string.
  //
  // BUT THEY HURT. 9 / 10 / 16 at damageScale 1.10 — canon says every physical
  // blow carries a cursed-energy discharge, and this is that. See correction 3
  // in the header for why the brief's "weak normals" is not what shipped.
  punches: [
    { name: 'Discharge Jab', dmg: 9, startup: 13, active: 3, recovery: 20, reach: 1.28, kb: 3.2, kbY: 0, hitstun: 18, type: 'light', step: 0.9, clip: 'punch1' },
    { name: 'Discharge Cross', dmg: 10, startup: 15, active: 3, recovery: 22, reach: 1.32, kb: 4.0, kbY: 0, hitstun: 20, type: 'light', step: 0.9, clip: 'punch2' },
    { name: 'Discharge Heave', dmg: 16, startup: 20, active: 4, recovery: 30, reach: 1.36, kb: 4.2, kbY: 8.4, hitstun: 28, type: 'launcher', step: 1.0, clip: 'punch3' }
  ],

  // Y — DROP SHOT. The longest anticipation in the project (see anim/ryu.js).
  heavy: {
    name: 'Drop Shot', dmg: 26, startup: 24, active: 6, recovery: 38,
    reach: 1.75, kb: 7.0, kbY: 0, hitstun: 36, step: 1.2,
    staminaCost: 20, ceGain: 1.5, destruct: 60, clip: 'heavy'
  },

  // ---- RB · CT1 — RAPID BLASTS -------------------------------------------
  // ROSTER CONVENTION: RB holds the furthest-reaching technique of the pair.
  // *** THIS IS ONE OF THE FOUR DOCUMENTED PLACES IT CANNOT HOLD, AND IT IS
  // THE STRONGEST-IS-ALSO-THE-FURTHEST CASE *** — the same one Choso, Mahoraga,
  // Gojo and Hakari already pay. The Charged Beam on RT is both the hardest-
  // hitting thing in his kit and, at 48 m on tier 4, the longest-reaching
  // thing in the entire game. One rule has to give, and the roster's ruling is
  // that the character reads best with the committed hold on RT: putting a
  // 2.6-second charge on the button players press to poke would break the
  // grip's meaning far worse than the reach ordering does.
  //
  // Canon: "a volley of rapid fire blasts to barrage the user's target", and
  // separately "raining down a volley of cursed energy blasts" from above.
  // Both are here — the volley fans forward and the last two arc.
  //
  // *** HIS ONLY NON-COMMITTAL TOOL. *** 12 frames of startup and 16 of
  // recovery, no charge, 8 CE. It is how he covers his own approach and his
  // own retreat and it is the only button he can press without deciding
  // something. A player who has learned the character presses this a lot.
  ct1: {
    name: 'Rapid Blasts', jpName: '連射', cost: 8,
    startup: 12, active: 8, recovery: 16,
    effect: 'ryu_rapid', clip: 'ct1',
    dmg: 5.5, count: 3, speed: 30, range: 20, spread: 0.16,
    kb: 1.6, hitstun: 12, destruct: 16,
    // the last shot of the three arcs over — the canon "raining down" version,
    // and mechanically the thing that stops the volley being a pure line an
    // opponent can simply crouch under a ledge to avoid
    arcLast: true
  },

  // ---- RT · CT2 — GRANITE BLAST (HOLD) ------------------------------------
  // *** RT IS NOT A PRESS. *** The press enters `outputCharge` (see the neutral
  // branch in combat/fighter.js) and the RELEASE is the move. There is no
  // frame data here because none of it is his: every number the beam uses
  // comes from the tier table in combat/output.js, and this entry exists so
  // that `_def('ct2')` returns something, so Confiscation has a slot to seize
  // and so the debug overlay has a name to print.
  //
  // THE FIVE TIERS, as shipped (hold frames / CE / damage / width / range):
  //     TAP          0f   10 CE   12 dmg   0.85 m   16 m
  //     CHARGED     30f   18 CE   22 dmg   1.20 m   22 m
  //     COMPRESSED  66f   34 CE   40 dmg   1.90 m   30 m
  //     GRANITE    108f   52 CE   62 dmg   2.70 m   40 m
  //     MAXIMUM    156f   74 CE   88 dmg   3.60 m   48 m
  //
  // 156 frames is 2.6 SECONDS OF STANDING PERFECTLY STILL. That is the whole
  // negotiation and it is priced to lose against a competent opponent in
  // neutral — see the honest assessment in the delivery notes, which says so
  // plainly rather than pretending otherwise.
  ct2: {
    name: 'Granite Blast', jpName: 'グラニテブラスト',
    cost: 0,                    // the TIER pays, at release
    startup: 8, active: 4, recovery: 26,
    effect: 'ryu_beam', clip: 'ct2',
    hold: true,                 // read by the HUD and the command card
    dmg: TIERS[TIERS.length - 1].dmg,   // for the roster harness's reach/damage table
    range: TIERS[TIERS.length - 1].range
  },

  // ---- LT · BLOCK — GOOD GUARD, AND HE CANNOT USE IT WHILE CHARGING -------
  // The guard itself is above average. The refusal is not declared here — it
  // is structural: `outputCharge` and `brace` read no input except the button
  // that holds them, so there is no block to refuse. That is deliberately a
  // property of the states rather than a check, because a check is a thing
  // that can have a hole in it.
  blockChipMult: 0.58,
  blockStaminaMult: 0.62,
  blockStartupFrames: 4,

  // ---- LB · DASH — the worst in the game ---------------------------------
  dashIFrames: 0,
  dashTrail: 'output',

  // ---- HIS OWN OUTPUT, COMING BACK ----------------------------------------
  // Read at exactly one damage site: the `ryuBeam` entity, when the fighter it
  // is about to hit is the beam's ORIGINAL owner. That happens in one
  // situation in the whole game — Uro reflected it — and it is the reason the
  // canonically-correct answer ("yes, she bends his beam back") is not also a
  // round-ender.
  //
  // 0.45. Canon backing, in two places: Ryu's endurance entry records that he
  // withstood being hit with his own Granite Blast and kept fighting, and that
  // by reinforcing his body he reduced Sukuna's Dismantle from "sliced into
  // three" to a single deep cut. He is not immune to his own energy — he does
  // eventually go down to a second reflected blast, which is exactly what 0.45
  // produces over two — he is simply the one person in the game with a real
  // answer to it.
  //
  // Deliberately a config value rather than a constant in the beam code: if a
  // future character ever fires something at themselves, they declare their
  // own number or take full damage, which is the correct default.
  selfEnergyResist: 0.45,

  // ---- MASS ---------------------------------------------------------------
  // He is hard to move and hard to launch, which is the other half of "you
  // have to get inside him": once you are there, you do not get to juggle him
  // for free.
  kbResist: 0.68,
  launchResist: 0.60,

  size: {
    height: 1.86,
    bodyRadius: 0.34, pushRadius: 0.56,
    hurtRadius: 0.64, hurtHeight: 1.66, hurtCenter: 1.02, hurtPad: 0.18,
    strikeY: 1.32,
    // he is heavy enough to shake the floor, and the settle keys in
    // anim/ryu.js are authored around this firing
    stepShake: 0.10,
    camDist: 1.06, camHeight: 0.20, camPitch: 0.02
  },

  // ---- B · SPECIAL — BRACE ------------------------------------------------
  // He plants his feet and rapidly regenerates CURRENT_CE. Completely immobile
  // and vulnerable throughout, with a slow wind-down before he can act.
  //
  // *** NO SELF-DAMAGE OF ANY KIND. *** The brief is explicit, it is right, and
  // it is enforced by there being no health term anywhere in the `brace` state
  // or in `tickBrace` — not by a flag that could be flipped. Brace costs him
  // TIME and SAFETY. That is the entire price.
  //
  // 26 CE/s against his 1.1 passive: braced, he refuels TWENTY-FOUR TIMES
  // FASTER than he does standing still. That number is enormous on purpose,
  // because what is being bought is the invitation — an opponent who sees
  // Brace and does not immediately run at Ryu has made a mistake, and the
  // reward for spotting it has to be worth crossing the arena for.
  //
  // Held for up to 2.5 s, minimum 0.33 s of commitment, and then 0.43 s of
  // wind-down during which he can do nothing at all. Worst case that is a
  // three-second window in which he is a statue.
  special: {
    key: 'ryu_brace', name: 'BRACE', jp: '構え',
    cost: 0,                    // there is nothing to spend; that is the point
    cooldown: 7,
    regenPerSec: BRACE.regenPerSec,
    minFrames: BRACE.minFrames, maxFrames: BRACE.maxFrames,
    windDownFrames: BRACE.windDownFrames,
    clip: 'brace', downClip: 'braceDown'
  },

  // ---- D-pad Right · ULTIMATE — MAXIMUM OUTPUT: GRANITE BLAST -------------
  // 出力最大. NON-DOMAIN — see correction 2 in the header for why, at length.
  // Standard gate (MAX_CE 100 + a full bar, which for him is a full 150),
  // full bar cost, standard backlash, faster non-domain startup.
  //
  // A colossal sustained beam far beyond his charged tiers, held for a moment
  // and SWEEPABLE with the left stick, obliterating everything in its path.
  // 118 damage — the highest single number in the project — over a 1.05 s hold
  // during which he is being visibly pushed backwards by his own output.
  //
  // THE DESTRUCTION IS `erase`, the same kind Hollow Purple uses, and it is
  // the only other move in the game that gets it. The brief asks for the most
  // environmentally destructive thing outside Purple, and this is it by
  // construction: same kind, narrower channel (4.4 m against Purple's), and it
  // sweeps rather than punching one hole.
  ultimate: {
    kind: 'burst', name: 'MAXIMUM OUTPUT: GRANITE BLAST', jpName: '出力最大',
    startup: 42, active: 63, recovery: 18,        // 123f = the clip's 2.05 s
    effect: 'ryu_maxblast', clip: 'ult',
    dmg: 118, range: 60, width: 4.4, hold: 1.05,
    // how far the left stick can drag the beam across the arena, in radians
    sweep: 0.62,
    kb: 14.0, kbY: 3.0, hitstun: 52,
    destroyKind: 'erase', destroySteps: 24, destroyStep: 2.4, destroyRadius: 3.0,
    destroyPower: 220
  },

  // canon-correct as far as canon goes: he can cast a Domain Expansion and
  // nothing whatsoever is known about it, so none is built. See correction 2.
  domain: null,

  simpleDomainDrain: 24,
  barrierBreak: { ceDrain: 34, chip: 20 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // What Copy takes off Ryu is RAPID BLASTS, not the Charged Beam.
  //
  // The reasoning is the same one Naoya's entry uses and it is even more
  // clear-cut here: the Charged Beam is not a move, it is a STATE MACHINE — a
  // hold with five tiers, an immobility clause, a per-tier posture set and an
  // 88-damage top end. Copy holds ONE ATTACK in ONE SLOT and fires it on
  // press; there is nowhere in that shape to put a charge. Handing the
  // character with the highest output in the game an 88-damage button with no
  // charge attached would also be the worst idea in this file, by some
  // distance. The volley is the recognisable thing, it is genuinely an attack,
  // and it is safely mediocre in somebody else's hands.
  copyEffect: { effect: 'ryu_rapid', dmg: 4.5, count: 2, name: 'Copied: Rapid Blasts' }
});
