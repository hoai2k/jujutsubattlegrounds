// ===========================================================================
// YUKI TSUKUMO — STAR RAGE, AND THE FIRST PERMANENT PARTNER
// ===========================================================================
// The heavyweight, the roster's first true grappler, and the first fighter in
// the project with an ally that is ALWAYS on the field rather than summoned
// and spent. Slow, enormous reach, and every single hit matters.
//
// ---------------------------------------------------------------------------
// TWO NEW SYSTEMS, AND WHY THEY ARE SEPARATE FILES
// ---------------------------------------------------------------------------
//   combat/mass.js     the MASS meter — build, spend, the armour threshold,
//                      and the mobility penalty. Shaped exactly like
//                      combat/charge.js (Kashimo) so the HUD row, the round
//                      reset and the model hook are the ones that already
//                      exist.
//   combat/garuda.js   the partner. Shaped like combat/minion.js (Mahito's
//                      transfigured human) because that is the project's
//                      established "an entity, not a Fighter" pattern — with
//                      the one enormous difference that it is never summoned,
//                      never spent, and can never be permanently lost.
// Every NUMBER for both lives HERE.
//
// ---------------------------------------------------------------------------
// THE MASS TRADE-OFF, which is the whole character
// ---------------------------------------------------------------------------
// Mass is simultaneously her damage resource and her mobility debt:
//
//   SPEND it on a move  → massively more damage, knockback and guard damage,
//                         plus screen shake scaled to the spend
//   HOLD it on herself  → armour through hits and immunity to knockback...
//                         ...and she moves noticeably slower
//   DUMP it instantly   → mobility back, damage gone
//
// So the question the player is answering every few seconds is "am I heavy or
// am I fast", and both answers are correct at different moments. The armour
// threshold at 52 is placed so that she has to be past half meter to get it,
// which means committing to being slow — and the command grab is exactly the
// move that wants that commitment, because walking through a jab to land an
// unblockable is the character's best moment. (It started at 45 and was
// raised after measurement; see the note on `armorAt` below.)
//
// ---------------------------------------------------------------------------
// THE BALANCE FRAME
// ---------------------------------------------------------------------------
// If she is overtuned the dials are `mass.spendCap` and `ct2.massDmgScale` —
// the amount a single spend can be worth — NOT the armour, which is the
// character. If she is UNDERtuned the dial is `mass.buildOnCharge`, because
// the failure mode is that filling the meter takes so long she never gets to
// use it.
import { withDefaults } from './schema.js';

export const YUKI = withDefaults({
  id: 'yuki', name: 'YUKI', title: 'THE SPECIAL GRADE',

  stats: {
    // SECOND-HIGHEST HEALTH ON THE ROSTER, behind Hakari and level with Todo.
    // (Yuji 105 · Toji 112 · Sukuna 118 · Todo 125 · YUKI 126 · Hakari 128)
    // 120 after a second measurement pass. At 126 she was still winning both
    // directions against a fully-awakened Maki, who is meant to BE Toji by
    // then — a heavyweight should out-trade the roster, not out-last the
    // character whose whole arc is becoming the strongest physical fighter.
    hp: 120,
    // THE SLOWEST LEGS IN THE GAME before mass is even considered. Hanami is
    // the only thing close. Her dash is the worst on the roster outright —
    // 6.9 against Toji's 10.4 — and mass makes it worse still.
    walkSpeed: 2.30, runSpeed: 4.30, dashSpeed: 6.90, jumpVel: 8.0,
    // A NORMAL CURSED-ENERGY ECONOMY. She is a sorcerer with a technique;
    // nothing exotic here. The regen is slightly low because MASS is her real
    // resource and two fast-filling bars would make her never have to choose.
    startMaxCE: 42, ceRegen: 2.0, ceGainPerPunch: 7,
    // A big pool that she barely uses — she does not dash and she does not
    // need to — so the effective read is "she can block forever".
    stamina: 138, staminaRegen: 26, dashDrain: 34,
    // HIGH BASE DAMAGE before mass, and mass multiplies it. This is the
    // number that makes "every single hit matters" true even at zero meter.
    // TUNED DOWN from 1.14 after measurement. Across four CPU-vs-CPU rounds
    // against Toji in both seats she dealt 265–313 damage to his 13–146 and
    // KO'd him twice inside 50 seconds, which is not a heavyweight, it is the
    // best character in the game. The dial moved here rather than on the
    // armour, per the balance frame above: a base damage scale this high was
    // being multiplied by mass on top, and the two compounded.
    damageScale: 1.05
  },

  // ---- THE STRING: SLOW, ENORMOUS REACH, ARMOUR ON THE FIRST HIT ---------
  // The longest normals in the game by a distance — 2.15 m on the jab, where
  // the roster average is about 1.45 and Toji's best is 1.65. And the slowest:
  // a 10-frame startup on a jab is unheard of here (Toji's is 5).
  //
  // `armorFrames` on hit 1 is the thing that makes the whole set work. It is
  // what lets her START a string into somebody else's pressure, which is the
  // only way a character this slow ever gets a turn. It is deliberately ONLY
  // on the first hit: armouring the whole string would delete the counterplay.
  punches: [
    { name: 'Long Jab', dmg: 9, startup: 10, active: 4, recovery: 16, reach: 2.15, kb: 2.2, kbY: 0, hitstun: 18, type: 'light', step: 1.5, armorFrames: 8 },
    { name: 'Hook', dmg: 11, startup: 12, active: 4, recovery: 18, reach: 2.05, kb: 3.0, kbY: 0, hitstun: 20, type: 'heavy', step: 1.6 },
    { name: 'Rising Palm', dmg: 17, startup: 16, active: 5, recovery: 26, reach: 2.10, kb: 4.2, kbY: 8.4, hitstun: 30, type: 'launcher', step: 1.8 }
  ],

  heavy: {
    name: 'Hammer', dmg: 21, startup: 22, active: 6, recovery: 34,
    reach: 2.30, kb: 6.8, hitstun: 36, step: 2.0, staminaCost: 24,
    destruct: 48, clip: 'heavy'
  },

  // ---- GUARD AND DASH -----------------------------------------------------
  // EXCELLENT GUARD, SLOW TO RAISE. `blockRaiseFrames` is a new field and it
  // is the honest expression of the brief: the guard itself is the best in the
  // game (0.48 stamina, 0.55 chip — both better than Toji's) but it takes 14
  // frames to come up, against the shared 6. Mashing block on reaction does
  // not work for her; she has to have decided already.
  //
  // Her DASH is the worst on the roster and gets worse with mass — see
  // `mass.speedPenalty`. She does not have an escape option and is not meant
  // to: the armour is her escape option.
  blockStaminaMult: 0.48,
  blockChipMult: 0.55,
  blockRaiseFrames: 14,
  dashIFrames: 0,

  // =========================================================================
  // STAR RAGE 星の怒り — THE MASS METER
  // =========================================================================
  // Rules in combat/mass.js; every number here. Same declaration shape as
  // Kashimo's `charge`, Choso's `blood` and Inumaki's `throat`, so the HUD row
  // and the round reset are the shared ones.
  mass: {
    max: 100,
    lowWarn: 15,

    // ---- BUILD ------------------------------------------------------------
    // TWO SOURCES, as the brief specifies: charging (holding an attack input)
    // and landing hits.
    //
    // CHARGING is the main one and it is deliberately fast enough to be worth
    // doing in neutral — 62/second means a full bar in about 1.6 s of holding,
    // which is a genuine window the opponent can punish but also a real
    // option when they are knocked down or too far away to threaten.
    buildOnCharge: 62,
    // LANDING HITS pays less, so she cannot simply fight her way to full — but
    // it pays enough that pressure funds the next spend.
    buildOnPunch: 7,
    buildOnHeavy: 12,
    buildOnTech: 15,
    buildOnGaruda: 9,        // Garuda connecting feeds HER meter — one pool
    // ---- AND IT DOES NOT DECAY ON ITS OWN --------------------------------
    // Deliberately unlike Kashimo's charge, which bleeds when he stands still.
    // His resource is about never stopping; hers is about deciding. A meter
    // that drained would make the decision for her.
    decay: 0,

    // ---- SPEND ------------------------------------------------------------
    // A move tagged `massSpend` consumes up to `spendCap` and scales by how
    // much it actually got. The cap is what stops a single button being worth
    // a whole round: even at 100 meter, one Mass Slam can only cash 55 of it.
    spendCap: 55,
    // the DUMP — B-less instant release, see combat/mass.js. Costs the whole
    // meter and grants a short burst of mobility as the weight comes off.
    dumpSpeedBonus: 1.35,
    dumpSpeedFrames: 48,

    // ---- CARRYING IT ------------------------------------------------------
    // ARMOUR THRESHOLD. At 45+ she has armour through hits and cannot be
    // knocked back. 45 is a deliberate choice: it is just under half, so
    // reaching it is a real commitment, and it is BELOW `spendCap`, which
    // means every full-power technique drops her out of armour on use. She
    // cannot be both the immovable object and the irresistible force in the
    // same second, and that tension is the character.
    // RAISED from 45 after measurement: at 45 she was armoured for most of
    // every engagement, and armour that is the default state is not a
    // trade-off, it is a stat. At 52 reaching it is a real commitment and she
    // spends genuine time light.
    armorAt: 52,
    // ...and the price. Linear in the meter: at full mass she moves at 62% of
    // her already-worst-in-the-game speed, which is a walking pace of 1.43.
    // She is genuinely hard to play at full meter and that is correct.
    speedPenalty: 0.38,
    // the dash suffers extra — it is the thing mass should hurt most
    dashPenalty: 0.55,
    // knockback taken is reduced continuously, reaching zero at the armour
    // threshold rather than snapping there
    kbResistAt: 52,

    // ---- WHAT SPENDING IS WORTH ------------------------------------------
    // A full 55-point spend multiplies the move's damage by 2.15, its
    // knockback by 3.0 and its guard damage by 2.6, and shakes the screen
    // proportionally. Those are big numbers and they are supposed to be: the
    // whole character is that a Yuki hit with mass behind it is the single
    // biggest thing in the game short of an ultimate.
    // TUNED DOWN from 2.15. A full spend was worth more than double, on top
    // of a base damage scale that was itself the second highest in the game;
    // the two compounded into single hits nothing could trade with.
    dmgScale: 1.70,
    kbScale: 3.00,
    guardScale: 2.60,
    shakeScale: 2.20,
    destructScale: 2.80
  },

  // =========================================================================
  // RB — MASS SLAM (chargeable)
  // =========================================================================
  // Hold to build mass INTO the move, release to throw it. `chargeable` and
  // `massSpend` are what combat/mass.js reads.
  ct1: {
    name: 'MASS SLAM', jp: '質量', cost: 8,
    startup: 20, active: 6, recovery: 34,
    effect: 'yuki_mass_slam', dmg: 18, reach: 2.6, arc: 1.7,
    kb: 5.0, kbY: 0, hitstun: 32, step: 1.8,
    chargeable: true, maxChargeFrames: 96,
    massSpend: true,
    // CRACKS THE GROUND. Big destructible damage even unloaded, and it scales
    // with the spend through `mass.destructScale` — a full-mass slam takes a
    // genuine bite out of the level.
    destruct: 62, quakeRadius: 3.4,
    clip: 'ct1'
  },

  // =========================================================================
  // RT — COMMAND GRAB
  // =========================================================================
  // The roster's proper grappler tool, and it obeys every rule a command grab
  // has to obey to be fair:
  //   · UNBLOCKABLE — guard does nothing
  //   · SLOW — 26 frames of startup, the slowest non-ultimate in her kit, and
  //     the animation telegraphs it for 0.30 s with the arm out (see
  //     anim/yuki.js)
  //   · JUMPABLE AND DASHABLE — `whiffOnAirborne` means it simply does not
  //     grab a target who is off the ground, and 26 frames is more than enough
  //     time to dash out of range
  //   · HUGE WHIFF RECOVERY — 40 frames, a free full combo for the opponent
  // Combined with armour at high mass it is terrifying, because she can walk
  // through a jab to land it. That is the intended interaction and it is the
  // reason the armour threshold and the spend cap are set where they are.
  ct2: {
    name: 'COMMAND GRAB', jp: '掴', cost: 12,
    startup: 26, active: 5, recovery: 40,
    effect: 'yuki_command_grab', dmg: 20, reach: 2.4, arc: 1.1,
    kb: 4.0, kbY: 0, hitstun: 44, type: 'knockdown',
    unblockable: true,
    whiffOnAirborne: true,      // jump out of it — the primary counterplay
    massSpend: true,
    // the slam at the end, as its own number so the mass scale applies to the
    // whole grab rather than only to the catch
    slamDmg: 16, destruct: 54,
    grabFrames: 46,             // the cinematic, on a connect
    clip: 'ct2'
  },

  // =========================================================================
  // B — COMMAND GARUDA
  // =========================================================================
  // Directs the partner to dive. Standard cooldown and HUD icon. Mass can be
  // poured into Garuda's attack too, so her mass management covers two bodies.
  special: {
    key: 'yuki_command', name: 'COMMAND GARUDA', jp: 'ガルダ',
    cost: 10, cooldown: 3.4, clip: 'command',
    massSpend: true
  },

  // =========================================================================
  // GARUDA — the permanent partner
  // =========================================================================
  // Read by combat/garuda.js. The single most important line in this block is
  // `permanent: true`: it is on the field from round start, it is not summoned,
  // it is not spent, and it CANNOT BE PERMANENTLY LOST. That is the deliberate
  // contrast with Megumi's shikigami (which are lost for the round when
  // destroyed) and Geto's stable (same). Knocking it away buys `stunSeconds`
  // and nothing more.
  garuda: {
    permanent: true,
    // ---- POSITIONING -----------------------------------------------------
    // Lowered along with the model's scale: at 2.6 m up and 2.9 m back it was
    // both enormous AND far away, which put it in the camera's path more often
    // than beside her. It now rides just over her shoulder, which is where a
    // partner belongs. A second pass took the height down again — at 2.9 the
    // chase camera still clipped it off the top of the frame at close range,
    // and a partner you can only half see is worse than one you can see all of.
    hoverHeight: 2.35,
    followDist: 2.2,          // how far AHEAD of her it flies — see garuda.js
    // ...and how far to the SIDE. This is the number that keeps it out of the
    // chase camera's sight line — see the note in combat/garuda.js. Positive
    // is her left, so it rides the shoulder the camera is not looking over.
    followSide: 1.7,
    followSpeed: 6.2,
    // ---- THE DIVE (B) ----------------------------------------------------
    dive: {
      windup: 0.34,           // the straightening — the tell
      speed: 17.5,
      dmg: 15, radius: 1.5,
      kb: 4.4, kbY: 1.2, hitstun: 26, type: 'heavy',
      massSpend: true,        // her mass can ride it
      recover: 0.75,          // getting back into formation afterwards
      destruct: 30
    },
    // ---- THE AUTONOMOUS BEHAVIOUR ----------------------------------------
    // "acts semi-autonomously: it hovers near her, intercepts occasionally,
    // and follows her lead." The intercept is a real mechanic and it is on a
    // long cooldown so it reads as luck rather than as a second guard.
    intercept: {
      chance: 0.30,           // rolled when a projectile would reach her
      cooldown: 6.5,
      // it takes the hit instead of her and is stunned for it
      stunSeconds: 1.3
    },
    // an occasional unprompted peck at a nearby opponent, so it never looks
    // like scenery. Small damage — it is presence, not a damage source.
    idleStrike: { cooldown: 7.0, range: 3.2, dmg: 5, hitstun: 12 },
    // ---- GETTING KNOCKED AWAY --------------------------------------------
    // It has no health bar and cannot die. A hit knocks it back and stuns it.
    // `returnAlways: true` is stated as a flag rather than as an absence of a
    // death path, so a future reader knows it is a rule.
    hp: 0,
    returnAlways: true,
    stunSeconds: 2.2,
    knockDist: 4.5,
    // once stunned it cannot be re-stunned immediately, or a zoner could
    // simply keep it pinned for the whole round
    stunImmunity: 1.6
  },

  // =========================================================================
  // D-PAD RIGHT — BLACK HOLE
  // =========================================================================
  // STANDARD GATE (MAX_CE 100 + full CURRENT_CE), full bar cost, standard
  // backlash for a burst — which in this project means `consumeFullBar()`,
  // exactly as Nanami, Todo, Choso, Hanami and Kurourushi all work. No
  // `backlash` block: that field belongs to domains and a burst ultimate that
  // declared one would be dead data (see the note in characters/choso.js).
  //
  // NON-DOMAIN STARTUP. She has no Domain Expansion and is canon-correct not
  // to, so this uses the faster, lower-commitment startup the burst ultimates
  // already have.
  //
  // ---- WHAT IT IS -------------------------------------------------------
  // Researched: her strongest shown technique is the BLACK HOLE — Star Rage
  // at maximum output, past its own safety limits, until her accumulated
  // virtual mass exceeds the Schwarzschild radius and collapses. In canon it
  // kills her. Here it does not, but it is honest about being a self-harming
  // move: `selfDmg` is the largest self-damage number in the project.
  //
  // Implemented exactly as the brief describes: a point of enormous mass that
  // DRAGS EVERYTHING ON SCREEN TOWARD IT and then detonates — including
  // destructible environment geometry, which is torn off the map and pulled
  // in. See combat/effects.js `yuki_black_hole` for the pull, and note that
  // the environment half of it is genuinely new: nothing else in this game
  // moves level geometry, which is what makes it look unlike anything else.
  ultimate: {
    kind: 'burst', name: 'BLACK HOLE', jpName: '星の怒り・極',
    startup: 34, active: 1, recovery: 34,
    effect: 'yuki_black_hole', clip: 'ult',
    // the singularity forms just in front of her and stays put
    offset: 3.2,
    // ---- THE PULL --------------------------------------------------------
    pullRadius: 14.0,        // effectively the whole arena
    pullDuration: 1.35,
    pullForce: 22.0,         // acceleration toward the point, at the edge
    // the pull is INESCAPABLE at close range and merely strong at the edge
    innerRadius: 3.0,
    // ---- THE ENVIRONMENT -------------------------------------------------
    // Destructible geometry inside this radius is torn off the map and flies
    // in. This is the visual signature.
    debrisRadius: 11.0,
    debrisCount: 26,
    debrisDmg: 3,            // each chunk that arrives with somebody
    // ---- THE DETONATION --------------------------------------------------
    dmg: 52, radius: 6.4,
    kb: 11, kbY: 6.5, hitstun: 46,
    // ...and what it costs her. The largest self-damage in the game, and the
    // honest reading of a technique that is canonically a suicide move.
    selfDmg: 18,
    destruct: 100
  },

  // NO DOMAIN, and canon-correct.
  domain: null,

  simpleDomainDrain: 19,
  barrierBreak: { ceDrain: 30, chip: 26 },

  // WHAT YUTA'S COPY GETS. She HAS a cursed technique, unlike the two
  // Heavenly Restrictions, so Copy stores the real thing — a single
  // mass-empowered strike. It does NOT store Garuda: Copy takes a technique,
  // not a shikigami, which is the same ruling that stops it taking Megumi's.
  copyEffect: { effect: 'yuki_mass_slam', dmg: 12, name: 'Copied: Star Rage' }
});
