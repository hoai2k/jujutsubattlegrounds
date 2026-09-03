// HAJIME KASHIMO — 甚爾ではない方の「雷」. THE GOD OF LIGHTNING.
//
// ONE RULE IS THE WHOLE CHARACTER: HE GETS STRONGER THE MORE HE MOVES, AND
// WEAKER THE MOMENT HE STOPS. He is the only fighter in the game that is
// punished for standing still, and the only one whose damage, attack speed and
// range are all read off a meter he can only fill with his feet.
//
// Played correctly he never stops and never stops threatening. Played badly he
// is a thin boy with a stick, and the model and the frame data both say so at
// tier 0 — that floor is deliberate and it is what makes the ceiling mean
// something.
//
// HE FILLS THE HYPER-MOBILE RUSHDOWN SLOT, AND HE IS NOT NAOYA:
//   NAOYA   wins by punishing CONTACT. He is a trap: the correct way to play
//           him is to arm the stance and let the opponent make the mistake. His
//           dash is faster (11.50 vs 10.40) and his normals are faster, and
//           neither of those is his win condition.
//   KASHIMO wins by never letting them breathe. He is not a trap and he has no
//           counter — everything he owns is an approach or a threat at range,
//           and his best defensive option (Arc Dash) is an attack that happens
//           to have i-frames on it. His dash is the best SUSTAINED one in the
//           game (see the stamina numbers) which is a different stat from the
//           fastest one, and that difference is the whole distinction.
//
// CANON, AS RESEARCHED (2026-08-13; sources in the header of art/models/
// kashimo.js and in the delivery notes):
//   · MYTHICAL BEAST AMBER 灼爛趙誅 is an innate technique that TRANSFORMS HIS
//     BODY to manifest any phenomenon electricity can produce, converting
//     cursed energy into electricity. In the manga it reconstructs him
//     progressively — hair into horns first, then electricity out of the eyes
//     — and it is a ONCE IN A LIFETIME technique that destroys the body.
//   · The NYOI STAFF is an iron-rod cursed tool that works as a LIGHTNING ROD:
//     he charges it, plants it to earth a circuit, and can send it away and
//     recall it at lightning speed.
//   · He has NO DOMAIN EXPANSION. Confirmed across every source. His D-pad
//     Right is therefore a burst ultimate on the standard gate, sitting with
//     Nanami, Yuji, Todo, Toji, Hanami, Kurourushi, Choso, Nobara, Geto and
//     Naoya.
//
// WHERE CANON AND THE GAME DIVERGE, DELIBERATELY:
//   · ONCE IN A LIFETIME is not once per match here. No ultimate in this
//     project is once per match (user-set design, 2026-07-27; `oncePerMatch`
//     exists and is false everywhere), and making his the single exception
//     would be a balance outlier dressed up as fidelity. What survives of the
//     canon cost is the BACKLASH: the standard non-domain rent, taken in full.
//   · The CHARGE METER is not canon. Canon Kashimo does not have a movement
//     resource. It is the mechanic invented to make "converts cursed energy
//     into electricity" into something a player operates, and the delivery
//     notes say so plainly rather than claiming a source.
import { withDefaults } from './schema.js';

export const KASHIMO = withDefaults({
  id: 'kashimo', name: 'KASHIMO', title: 'MYTHICAL BEAST AMBER — 400 YEARS',
  jpName: '甚壱',

  stats: {
    // AVERAGE HEALTH, WEAK DEFENCE. The health number is the roster norm; the
    // defence is in `blockChipMult` / `blockStaminaMult` below, and in the fact
    // that blocking actively disarms him.
    hp: 100,
    // SECOND FASTEST IN THE GAME, BEHIND NAOYA, AND THAT ORDERING IS
    // DELIBERATE. Naoya 3.20 / 6.60 / 11.50; roster norm 2.60 / 5.20 / 8.60.
    // He is 15% / 19% / 21% above the norm and 6% / 6% / 10% below Naoya.
    walkSpeed: 3.00, runSpeed: 6.20, dashSpeed: 10.40, jumpVel: 9.00,
    startMaxCE: 40, ceRegen: 2.6, ceGainPerPunch: 5,
    // BASE DAMAGE IS LOW, because the Charge tier multiplies it: 0.92 x the
    // tier table (0.76 / 1.00 / 1.20 / 1.42) means he actually swings between
    // 0.70 and 1.31. At the bottom he is the weakest character in the game by
    // a distance; at the top he is above everyone except Todo and Sukuna. That
    // SPREAD is the character, and it is why the base number cannot also be
    // generous.
    damageScale: 0.92,
    // THE MOST IMPORTANT THREE NUMBERS ON HIM, and they are not the speed ones.
    // Stamina is what buys dashes, and dashes are what buy Charge, so stamina
    // is effectively his primary resource. 145 pool (highest in the game after
    // Todo's 135 — this beats it), 34/s regen (highest, full stop), 15/s drain
    // (lowest, full stop). Net while dashing: -15 +0 = he can dash for 9.7
    // seconds from full, and refills in 4.3 seconds of not dashing. Nobody
    // else is close, and "the best SUSTAINED dash in the game" is exactly
    // this ratio rather than the dash SPEED, which Naoya still wins.
    stamina: 145, staminaRegen: 34, dashDrain: 15
  },

  // ---- THE CHARGE METER ---------------------------------------------------
  // The rules live in combat/charge.js; every number lives here. Read that
  // file's header for WHY build/decay/hold is decided by state rather than by
  // a list of moves — the short version is that attacking must not disarm him
  // and being hit must not either, or the character is a punishment.
  //
  // THE ARITHMETIC, because these numbers decide whether he is playable:
  //   from empty, dashing:     100 / 30 = 3.3 s to full
  //   from empty, running:     100 / 16 = 6.3 s
  //   from full, standing:     100 / 12 = 8.3 s to empty
  //   from full, BLOCKING:     100 / 26 = 3.8 s to empty
  //
  // So a Kashimo who dashes in gets to tier 3 in three and a third seconds,
  // and a Kashimo who holds guard against a zoner is at tier 0 in under four.
  // The gap between those two numbers IS the character brief.
  //
  // TIER 1 AT 25% is the mercy in the design: 0.8 s of dashing out of neutral
  // and he is out of the bad tier. Without that he would open every round
  // helpless, which is not "punished for standing still", it is "punished for
  // the round starting".
  charge: {
    max: 100,
    build: { dash: 30, run: 16, walk: 5 },
    decay: { idle: 12, block: 26 },
    // what the HUD prints next to the bar
    jp: '帯電', label: 'CHARGE'
  },

  // ---- X · THE STAFF STRING -----------------------------------------------
  // THE LONGEST NORMALS IN THE GAME. 1.85 / 1.95 / 2.05 against a roster norm
  // of 1.35 / 1.45 / 1.50 and against Todo's 1.70 / 1.80 / 1.85 — he out-ranges
  // the heavyweight with a jab, because he is holding a 1.72 m iron rod and the
  // model would be lying otherwise.
  //
  // Fast but NOT the fastest: 6 / 7 / 10 startup is the roster norm exactly,
  // against Naoya's 4 / 5 / 7. That is the second half of keeping the two
  // apart — Naoya wins the frame trap, Kashimo wins the spacing. Damage is
  // medium and every number here is multiplied by the tier table.
  //
  // Third hit LAUNCHES. AT MAX CHARGE every confirmed normal EARTHS THROUGH the
  // body it landed on and arcs to anything else standing within 2.3 m of it
  // (`chargeAoE` -> `Effects.chargeDischarge`, fired from the melee path). It
  // deliberately does NOT hit the person he punched a second time: the tier
  // table already multiplies his damage by 1.42 up there, and doubling his own
  // normals would make tier 3 a damage cliff rather than the PROPERTY CHANGE
  // the brief asks for. In a 1v1 it is pure spectacle; in a free-for-all, or
  // against Megumi's shikigami and Geto's curses, it is a real second threat.
  punches: [
    { name: 'Rod Thrust', dmg: 4.2, startup: 6, active: 3, recovery: 11, reach: 1.85, kb: 1.4, kbY: 0, hitstun: 14, type: 'light', step: 1.7, clip: 'punch1', src: 'electric' },
    { name: 'Rod Sweep', dmg: 4.8, startup: 7, active: 3, recovery: 12, reach: 1.95, kb: 1.8, kbY: 0, hitstun: 16, type: 'light', step: 1.7, clip: 'punch2', src: 'electric' },
    { name: 'Rod Flick', dmg: 8.0, startup: 10, active: 4, recovery: 20, reach: 2.05, kb: 3.4, kbY: 7.8, hitstun: 26, type: 'launcher', step: 2.1, clip: 'punch3', src: 'electric' }
  ],

  // HEAVY — the full two-handed circle. His only real commitment outside
  // Discharge Strike, and his only knockdown.
  heavy: {
    name: 'Iron Circle', dmg: 15, startup: 17, active: 5, recovery: 28,
    reach: 2.25, kb: 6.0, kbY: 0, hitstun: 30, step: 2.4,
    staminaCost: 20, armorFrames: 0, ceGain: 1.6, clip: 'heavy', src: 'electric'
  },

  // ---- RB · CT1 — LIGHTNING BOLT ------------------------------------------
  // Cheap, fast, low commitment, and NEAR-USELESS UNCHARGED. That last part is
  // the design and it is enforced twice: the damage rides the tier table like
  // everything else, and the RANGE is read off the tier separately, so at tier
  // 0 the bolt is a 5-metre poke for about four damage and at tier 3 it is an
  // 18-metre screen-crosser for eleven.
  //
  //   tier 0   range  5.0   dmg  ~4.2   — a poke. It is meant to be bad.
  //   tier 1   range  9.0   dmg  ~5.5
  //   tier 2   range 13.5   dmg  ~6.6
  //   tier 3   range 18.0   dmg  ~7.8   + a fork on contact
  //
  // 12 CE and 26 total frames means he can genuinely throw these constantly,
  // which is the point: it is the tool that stops a zoner simply out-ranging
  // him while he is running in.
  ct1: {
    name: 'Lightning Bolt', jpName: '雷撃', cost: 12,
    startup: 9, active: 4, recovery: 13,          // 26f
    effect: 'kashimo_bolt', clip: 'bolt',
    dmg: 6, speed: 26, kb: 1.2, kbY: 0, hitstun: 12,
    // range per tier. Read directly rather than through `chargeSize`, because
    // "range scales HARD with charge" is a bigger curve than the shared one.
    rangeByTier: [5.0, 9.0, 13.5, 18.0],
    // tier 3 only: the bolt forks into two smaller arcs on contact
    forkAt: 3, forkDmg: 2.6
  },

  // ---- RT · CT2 — DISCHARGE STRIKE ----------------------------------------
  // The committed one. A chambered thrust with the rod that dumps the stored
  // charge into whatever it touches, as a burst rather than a point hit.
  //
  // AND IT COSTS HIM HIS ENGINE. 35 Charge on use — a third of a full meter —
  // which means the strongest version of the move immediately drops him a tier
  // or two and he has to go and earn it back. That is the interesting decision
  // in the character: his best button is the one that turns him back into the
  // weak version of himself, so "when do I cash it" is a real question rather
  // than "press it whenever it is up".
  //
  // THE STUN is short on purpose. At tier 2 it is 26 frames (0.43 s) and at
  // tier 3 it is 34 (0.57 s), against NAOYA'S FREEZE AT A FULL SECOND. It is
  // implemented as ordinary long hitstun in `hitHeavy`, NOT as the `frozen`
  // state, so the two can never be confused visually or mechanically — and if
  // a victim is already frozen, the freeze clock reasserts `frozen` every tick
  // (fighter.js) and simply wins. See the cross-character note in the delivery
  // report.
  ct2: {
    name: 'Discharge Strike', jpName: '放電突', cost: 24,
    startup: 20, active: 5, recovery: 26,         // 51f
    effect: 'kashimo_discharge', clip: 'discharge',
    dmg: 20, reach: 2.60, arc: 1.1, kb: 5.5, kbY: 1.2, hitstun: 30, type: 'heavy',
    burstRadius: 2.20,
    chargeCost: 35,
    // THE STAGGER, per tier. Below tier 2 there is none at all.
    //
    // MEASURED AND RAISED: the first pass used [0, 0, 26, 34], and 26 is LESS
    // THAN THE MOVE'S OWN BASE HITSTUN OF 30 — so the tier-2 "stagger" did
    // literally nothing, because the code takes the max of the two. 34 / 44 is
    // 0.57 s and 0.73 s, comfortably longer than an ordinary heavy hit and
    // comfortably shorter than NAOYA'S ONE-SECOND FREEZE, which is the number
    // this must never approach. It is also a different KIND of thing: a
    // stagger is long hitstun in `hitHeavy`, a freeze is the `frozen` state
    // with no state logic at all.
    stunAt: 2, stunFrames: [0, 0, 34, 44],
    destruct: 30
  },

  // ---- LT · BLOCK — POOR, AND IT DISARMS HIM ------------------------------
  // 1.45 chip and 1.45 stamina drain (roster norm 1.0; Jogo, the other bad
  // guard, is 1.3). On top of which holding it bleeds 26 Charge a second,
  // which is more than twice the standing rate. Turtling against pressure is
  // not merely a bad idea on him, it is the thing his opponent wants.
  blockChipMult: 1.45,
  blockStaminaMult: 1.45,
  blockStartupFrames: 2,

  // ---- LB · DASH ----------------------------------------------------------
  // No i-frames — the dash is just fast. His invulnerability lives on Arc Dash
  // instead, which costs him something.
  dashIFrames: 0,
  dashTrail: 'lightning',

  // ---- B · SPECIAL — ARC DASH ---------------------------------------------
  // An instant electric blink along the left stick, damaging everything it
  // passes through. CHAINABLE THREE TIMES before the cooldown applies.
  //
  // THE ECONOMY, and it is the whole point of the move: each pass costs 12
  // Charge, and each pass that CONNECTS pays back 14 (HIT_GAIN.arcPass in
  // combat/charge.js). So an aggressive Arc Dash that hits is net +2 and a
  // whiffed one is net -12. Three chained passes through a body is +6 and a
  // free reposition; three chained whiffs is -36 and he has disarmed himself.
  // Rewarding aggressive use is not a bonus bolted on top — it is the only
  // version of the move that does not lose him the fight.
  //
  // I-FRAMES ON THE TRAVEL, 10 of them per pass. This is his answer to the
  // zoners the Charge-decay-on-block rule would otherwise hand the matchup to
  // (Jogo, Nobara, Hanami, Choso): the correct play against chip pressure is
  // to blink THROUGH it, which builds Charge instead of bleeding it. That
  // interaction is deliberate and it is verified in the delivery notes.
  special: {
    key: 'kashimo_arcdash', name: 'ARC DASH', jp: '雷閃',
    cost: 8, cooldown: 3.4, clip: 'arcdash',
    chain: 3,               // passes before the cooldown applies
    chainWindow: 0.85,      // seconds to press again and keep the chain
    chargeCost: 12,
    distance: 5.4,
    dmg: 7, radius: 1.15, kb: 1.6, hitstun: 14,
    iFrames: 10,
    stateFrames: 14
  },

  // ---- D-pad RIGHT · ULTIMATE — MYTHICAL BEAST AMBER, FULL RELEASE --------
  // 灼爛趙誅. NON-DOMAIN: standard gate (MAX_CE 100 + a full bar), full bar
  // cost, standard backlash, and the fast non-domain startup — 25 frames,
  // the same tier as Naoya's MAXIMUM PROJECTION, because like his it is a
  // STATE rather than an attack and there is nothing to wind up.
  //
  // FOR THE DURATION, THE LIMITER IS OFF:
  //   · CHARGE IS PINNED AT MAXIMUM regardless of what he does. He can stand
  //     still, he can block, he can be knocked down — tier 3, the whole time.
  //     This is the fantasy: he stops having to manage anything.
  //   · CURSED ENERGY COSTS NOTHING (`ceFree`), routed through the same
  //     `spendCE` choke point Jackpot already uses, so there is no move that
  //     can accidentally still charge him.
  //   · THE MOVESET UPGRADES. The bolt becomes a three-way fan at full range,
  //     Discharge Strike's burst doubles in radius and no longer costs Charge,
  //     and Arc Dash's chain limit goes from 3 to 6.
  //
  // 8 SECONDS. Longer than Naoya's 5 because it does not take the opponent's
  // inputs away — it makes Kashimo good, and a window that only makes you good
  // has to be long enough to actually convert. Shorter than Nanami's 12 and
  // Sukuna's 15 because at tier 3 with free techniques he is the highest
  // pressure state in the game.
  ultimate: {
    kind: 'burst', name: 'MYTHICAL BEAST AMBER', jpName: '灼爛趙誅',
    startup: 10, active: 5, recovery: 10,          // 25f
    effect: 'kashimo_amber', clip: 'ult',
    duration: 8.0,
    ceFree: true,
    boltFan: 3,
    burstMult: 2.0,
    chain: 6,
    dmg: 0,                 // the cast itself hits nobody
    backlash: { duration: 8, regenMult: 0.5, growthMult: 0.5 }
  },

  // canon-correct: no Domain Expansion
  domain: null,

  simpleDomainDrain: 24,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // LIGHTNING BOLT, and it is the only honest answer. Yuta has no Charge
  // meter, so anything of Kashimo's that scales off one has to be given a
  // fixed tier when it leaves his hands — the copy fires at TIER 1 (see
  // `copyTier` in the effect), which is the "working, unremarkable" tier and
  // exactly what a borrowed technique should be.
  //
  // Deliberately NOT Arc Dash: a chainable damaging blink in the hands of the
  // highest-output character in the game is the worst idea in this file, and
  // it is the same ruling Naoya's stance already gets for the same reason.
  copyEffect: { effect: 'kashimo_bolt', dmg: 5.5, name: 'Copied: Lightning Bolt', copyTier: 1 }
});
