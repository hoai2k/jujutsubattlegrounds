// ===========================================================================
// TAKUMA INO — 猪野琢真. 降霊術「来訪瑞獣」. THE MEDIUM.
// ===========================================================================
// He puts a knitted hat over his face and something else comes through it.
//
// ===========================================================================
// RESEARCH — AND IT OVERTURNED MOST OF THE DESIGN BRIEF
// ===========================================================================
// Sources (web, 2026-08-22): the Jujutsu Kaisen Wiki entries for Takuma Ino
// and Auspicious Beasts Summon; the Gamerant explainer "Takuma Ino's Cursed
// Technique, Explained"; the Heroes Wiki and Animated Character Database
// entries; the Japanese アニヲタWiki, entame-life and comic-mate write-ups
// (which carry the technique's real kanji, which the English pages do not);
// and — for the creatures — the standing iconography of the Xiezhi, the
// spirit turtle, the Qilin and the Chinese dragon.
//
// *** THE NAME. 降霊術「来訪瑞獣」 — KŌREIJUTSU: RAIHŌ ZUIJŪ. *** "Spirit
// Summoning: Visiting Auspicious Beasts". The English wiki calls it
// "Auspicious Beasts Summon", which is a translation of the second half only.
// Both are carried below.
//
// ---------------------------------------------------------------------------
// THE BRIEF SAID: "Ino's technique involves wearing masks to summon or channel
// spirits... how many masks, what each one does, whether the spirits act
// independently". It also said: "This one matters: my design below is built on
// a broad understanding and your research should override it wherever it
// conflicts."
//
// It conflicts in FOUR places, and three of them are structural.
// ---------------------------------------------------------------------------
//
//  *** 1. THERE IS ONE MASK, NOT THREE OR FOUR. ***
//     The brief asks for "a matched set of ritual objects" — a heavy mask, a
//     swift mask, a ranged mask, a defensive mask — each swapped for the
//     others.
//     CANON: he owns exactly one, and it is not a ritual object. It is a BLACK
//     KNIT SKI HAT, which he wears rolled up as a beanie and PULLS DOWN OVER
//     HIS WHOLE FACE TO THE CHIN like a balaclava. The condition for the
//     technique is not "wearing a mask", it is HIS FACE BEING HIDDEN — that is
//     what makes him a medium.
//     WHAT I BUILT: one mask, with two states, as real geometry that visibly
//     goes on and off (art/models/ino.js `setMask`). The brief's demand that
//     "the mask must be real geometry that visibly goes ON and OFF during
//     swaps" is honoured in full and is better served by the canon version,
//     because now the mask coming off MEANS something — see 4.
//
//  *** 2. THE BEASTS ARE NOT INDEPENDENT SUMMONS. ***
//     The brief asks for a spirit that "manifests near him and acts
//     semi-independently".
//     CANON, quoted: "rather than summoning separate creatures, Ino becomes a
//     spiritual medium that can use the abilities of four auspicious beasts...
//     the abilities manifest through his body rather than appearing as
//     independent entities."
//     WHAT I BUILT: the beast manifests as a HALF-PRESENT BODY BONDED TO HIM.
//     It orbits his position, it strikes when he strikes, and IT NEVER LEAVES
//     HIM. It has no pathing, no target of its own, and no independent AI —
//     which is exactly the line that separates him from Geto, from Megumi,
//     from Yaga, from Mahito and from Dagon, all five of whose creatures walk
//     off and fight on their own. See the header of combat/beasts.js.
//     This also GIVES the brief the thing it actually wanted: "spirits cannot
//     be permanently destroyed". They cannot, and now there is a reason rather
//     than a rule — there is no separate body to kill.
//
//  *** 3. THERE ARE FOUR BEASTS AND ONE OF THEM IS NOT A STANCE. ***
//     獬豸 KAICHI, 霊亀 REIKI, 麒麟 KIRIN, 龍 RYU.
//     The first three map onto the brief's requested roles almost exactly, and
//     I did not have to invent a single one:
//       KAICHI  fires an unavoidable homing HORN                = the RANGED
//               mask the brief asks for
//       REIKI   coats him in cursed WATER: protection and a
//               frictionless glide                              = the brief's
//               SWIFT and DEFENSIVE masks, and canon merges them
//       KIRIN   NULLIFIES HIS PAIN, drains him badly, and leaves
//               him unable to move afterwards                   = the HEAVY
//               mask, and canon's version is better than the brief's because
//               the drawback is enormous and specific
//     RYU IS DIFFERENT AND IT IS THE MOST IMPORTANT FINDING HERE. He tries to
//     use it in Shibuya and his mask is torn off before he can. The only thing
//     canon says about the dragon is that NOBODY WHO HAS SEEN IT HAS SURVIVED
//     TO SAY WHAT IT DOES.
//     WHAT I BUILT: *** RYU IS THE ULTIMATE. *** Making it a fourth swappable
//     stance would have flatly contradicted the one line the source gives it.
//     So he has THREE stances and a fourth beast on D-pad Right, and the
//     ultimate is the thing he never got to do.
//     NOTHING IN THIS CHARACTER IS INVENTED. All four beasts are canon, all
//     four abilities are canon, and the roles are canon's rather than mine.
//     (The brief asks me to say which masks I invented: NONE.)
//
//  *** 4. THE COUNTERPLAY IS THE MASK, NOT THE SPIRIT. ***
//     The brief proposes that spirits can be "knocked away and suppressed
//     briefly". Canon has something much better and much more specific: "as
//     his mask is very visible and can easily be taken off should one get
//     close enough, Ino's technique can easily be negated." Toji does exactly
//     that to him in Shibuya, and Ino is left standing there unable to do
//     anything at all.
//     WHAT I BUILT: a GUARD BREAK OR A KNOCKDOWN TAKES THE MASK OFF. For
//     `maskOff.duration` seconds he has no beast, no CT1, no CT2 and base
//     stats — the single hardest counterplay window any character in this game
//     hands out — and then he pulls it back down. That is the risk that pays
//     for a stance character who also has a creature.
//
// CANON-CORRECT: *** INO HAS NO DOMAIN EXPANSION. *** He is a grade 2 sorcerer
// (grade 1 later) and nothing suggests one. He joins the burst-ultimate list
// with the faster non-domain startup and the standard gate.
//
// ---------------------------------------------------------------------------
// AND THE THING THE BRIEF IS RIGHT TO WORRY ABOUT: IS HE PANDA?
// ---------------------------------------------------------------------------
// The honest answer is in the delivery report. The short version, stated here
// because it drove every number below: THREE THINGS MAKE HIM NOT PANDA, and
// each of them is a mechanic Panda does not have.
//   · PANDA'S STANCES ARE FREE TO ENTER AND COST ONLY FRAMES. Ino's cost
//     CURRENT_CE, so his rotation is on the same meter as his techniques and
//     he genuinely cannot cycle.
//   · PANDA'S SWAP IS SAFE-ISH; INO'S HAS A CATASTROPHIC FAILURE STATE. Get
//     guard-broken and the mask comes off and he is a man in a tracksuit.
//     Panda's worst case is being in the wrong core.
//   · PANDA IS ALWAYS ONE BODY. Ino always has a second thing on screen that
//     hits on its own timing, so his pressure has a rhythm Panda's cannot —
//     every stance of his is a two-hit-per-exchange character.
import { withDefaults } from './schema.js';

// ===========================================================================
// THE THREE WEARABLE BEASTS
// ===========================================================================
// Each is a COMPLETE FIGHTER, in the same shape Panda's cores are, plus a
// SPIRIT block that combat/beasts.js reads. Read ACROSS the rows rather than
// down the columns — every number was chosen against the other two:
//
//                        KAICHI 獬豸    REIKI 霊亀     KIRIN 麒麟
//   run speed            5.00           6.60           4.20
//   dash speed           8.40           11.40          6.60
//   damage scale         0.92           0.78           1.26
//   jab startup          7f             5f             10f
//   jab recovery         14f            10f            21f
//   reach (jab)          1.62           1.42           1.78
//   armour on normals    none           none           10 / 10 / 14f
//   block chip mult      1.00           0.74           1.22
//   dash i-frames        0              10             0
//   CE drain             none           none           19/s  (+20/s stam)
//
// The shape that falls out is DELIBERATELY NOT PANDA'S. Panda's three are
// neutral / punish / escape, which is a triangle. Ino's three are
// RANGE / MOVEMENT / TRADE, which is a different question: Kaichi asks "can I
// hit you from here", Reiki asks "can you catch me", Kirin asks "who wins if
// neither of us moves". A Panda player picks a core for the SITUATION; an Ino
// player picks a beast for the OPPONENT.
const BEASTS = {
  // ---- 1 · 獬豸 KAICHI — THE RANGE BEAST ----------------------------------
  // Canon: it produces a spiral-patterned HORN coated in cursed energy that
  // "will not stop until it hits the desired target". That is an unavoidable
  // projectile, and this game has exactly one other thing that cannot be
  // dodged — a domain's sure-hit. So it is priced like one: it is SLOW, it is
  // EXPENSIVE, it is loudly telegraphed, and it is his only true zoning tool.
  //
  // The body underneath it is deliberately ORDINARY. A ranged stance that also
  // fought well would have no reason to swap out.
  kaichi: {
    name: 'KAICHI', jp: '獬豸', short: 'KAI', clipSuffix: 'Kai',
    role: 'RANGE · THE HORN THAT DOES NOT MISS',
    stats: { walkSpeed: 2.60, runSpeed: 5.00, dashSpeed: 8.40, damageScale: 0.92, dashDrain: 26 },
    punches: [
      { name: 'Straight', dmg: 4.0, startup: 7, active: 3, recovery: 14, reach: 1.62, kb: 1.7, kbY: 0, hitstun: 15, type: 'light', step: 1.7, src: 'ino_kaichi' },
      { name: 'Cross', dmg: 4.8, startup: 8, active: 3, recovery: 15, reach: 1.68, kb: 2.2, kbY: 0, hitstun: 17, type: 'light', step: 1.7, src: 'ino_kaichi' },
      { name: 'Rising Elbow', dmg: 8.0, startup: 11, active: 4, recovery: 21, reach: 1.72, kb: 3.6, kbY: 7.8, hitstun: 27, type: 'launcher', step: 2.1, src: 'ino_kaichi' }
    ],
    heavy: {
      name: 'Gore', dmg: 16, startup: 18, active: 5, recovery: 29,
      reach: 2.05, kb: 5.8, kbY: 0, hitstun: 30, step: 2.6,
      staminaCost: 20, armorFrames: 0, ceGain: 1.6, clip: 'heavyKai', src: 'ino_kaichi'
    },
    // RB — the reaching one, per the slot convention. The beast lowers its
    // head and the horn goes out on a straight line.
    ct1: {
      name: 'HORN', jpName: '角', cost: 20,
      startup: 15, active: 4, recovery: 22,
      effect: 'ino_horn', clip: 'ct1Kai',
      dmg: 17, range: 15.0, speed: 24, radius: 0.72,
      kb: 3.4, kbY: 0.6, hitstun: 24, destruct: 18, src: 'ino_kaichi'
    },
    // *** RT — THE ONE THAT CANNOT BE DODGED. ***
    // 34 frames of startup with the beast visibly winding up, and then it
    // tracks. The counterplay is not evasion, it is BLOCKING or hitting him
    // out of the wind-up — the same deal Sukuna's charged Fire Arrow offers,
    // and the reason it costs 38 of a 100 bar.
    ct2: {
      name: 'JUDGEMENT HORN', jpName: '必中角', cost: 38,
      startup: 34, active: 5, recovery: 30,
      effect: 'ino_judgehorn', clip: 'ct2Kai',
      dmg: 30, range: 22.0, speed: 19, turn: 6.5, life: 2.6, radius: 0.85,
      kb: 6.0, kbY: 2.0, hitstun: 34, destruct: 30, homing: true, src: 'ino_kaichi'
    },
    blockChipMult: 1.00, blockStaminaMult: 1.00, blockStartupFrames: 3,
    dashIFrames: 0,
    // ---- THE SPIRIT -------------------------------------------------------
    // `orbit` is how far from him it holds station, `lead` is how far in FRONT
    // of him that station sits (so a ranged beast stands between him and the
    // opponent and a mobile one does not), and `strikeEvery` is its own
    // independent contribution — the second rhythm that makes him not Panda.
    spirit: {
      key: 'kaichi', name: 'KAICHI', jp: '獬豸', color: 0x6ea8ff,
      orbit: 2.0, lead: 1.5, height: 0, scale: 1.0,
      strikeEvery: 2.6, strikeRange: 3.4, strikeDmg: 8,
      strikeKb: 2.0, strikeKbY: 0.3, strikeHitstun: 15,
      manifest: 0.55, suppressed: 1.8, src: 'ino_kaichi'
    }
  },

  // ---- 2 · 霊亀 REIKI — THE MOVEMENT BEAST --------------------------------
  // Canon: "Ino is able to summon a form of cursed water that can be used to
  // cover all parts of his body, which he uses to GLIDE ACROSS SURFACES,
  // REDUCING FRICTION and INCREASING HIS MOBILITY." Two effects in one
  // sentence — protection and speed — which is why this single canon beast
  // does the job of both the brief's SWIFT and DEFENSIVE masks.
  //
  // 6.60 run and 11.40 dash make him the second-fastest thing in the game in
  // this stance (behind Naoya) and the ONLY character with i-frames on an
  // ordinary dash besides Panda's Triceratops. It is bought with the worst
  // damage on the roster outside Naoya's: 0.78.
  //
  // *** THE WATER IS A REAL DAMAGE SOURCE TAG AND IT MATTERS. *** Every hit he
  // lands in this stance carries `src: 'ino_reiki'`, which combat/receipts.js
  // treats as WATER — so Reiki is the hardest counter in the game to Reggie's
  // receipts. That fell out of two independent pieces of research and it is
  // the best matchup either character has.
  reiki: {
    name: 'REIKI', jp: '霊亀', short: 'REI', clipSuffix: 'Rei',
    role: 'MOVEMENT · CURSED WATER · FRICTIONLESS',
    stats: { walkSpeed: 3.20, runSpeed: 6.60, dashSpeed: 11.40, damageScale: 0.78, dashDrain: 18 },
    punches: [
      { name: 'Slip Jab', dmg: 3.2, startup: 5, active: 2, recovery: 10, reach: 1.42, kb: 1.2, kbY: 0, hitstun: 13, type: 'light', step: 2.1, src: 'ino_reiki' },
      { name: 'Slide Hook', dmg: 3.7, startup: 6, active: 2, recovery: 11, reach: 1.48, kb: 1.6, kbY: 0, hitstun: 15, type: 'light', step: 2.1, src: 'ino_reiki' },
      { name: 'Wave Lift', dmg: 6.2, startup: 8, active: 3, recovery: 17, reach: 1.54, kb: 2.8, kbY: 8.0, hitstun: 25, type: 'launcher', step: 2.4, src: 'ino_reiki' }
    ],
    heavy: {
      name: 'Shell Check', dmg: 12, startup: 15, active: 5, recovery: 25,
      reach: 1.88, kb: 5.4, kbY: 0, hitstun: 30, step: 3.0,
      staminaCost: 16, armorFrames: 0, ceGain: 1.6, clip: 'heavyRei', src: 'ino_reiki'
    },
    // RB — the reaching one. He glides the full length of the arena on the
    // water and arrives with a shoulder. The best gap-closer in his kit.
    ct1: {
      name: 'GLIDE', jpName: '滑走', cost: 16,
      startup: 9, active: 12, recovery: 18,
      effect: 'ino_glide', clip: 'ct1Rei',
      dmg: 11, reach: 1.9, travel: 9.5, speed: 22,
      kb: 3.0, kbY: 0.8, hitstun: 20, iFrames: 8, src: 'ino_reiki',
      // *** THIS is what soaks Reggie's receipts — not every punch in the
      // stance. See the measured note in combat/receipts.js.
      water: true
    },
    // RT — the stronger one, and it is not really an attack. The turtle brings
    // the water UP into a shell around him: 1.6 s of heavy armour and a shove
    // when it breaks. "Strongest" means the bigger commitment, which schema.js
    // lists as one of the four documented exceptions to the slot convention.
    ct2: {
      name: 'SHELL', jpName: '甲羅', cost: 26,
      startup: 8, active: 4, recovery: 20,
      effect: 'ino_shell', clip: 'ct2Rei',
      dmg: 14, radius: 2.4, duration: 1.6, armorFrames: 96, incoming: 0.55,
      kb: 5.5, kbY: 1.2, hitstun: 26, src: 'ino_reiki', water: true
    },
    // THE BEST GUARD OF THE THREE, because the water is armour in canon.
    blockChipMult: 0.74, blockStaminaMult: 0.78, blockStartupFrames: 2,
    dashIFrames: 10,
    spirit: {
      key: 'reiki', name: 'REIKI', jp: '霊亀', color: 0x3fd0b8,
      // it holds station BEHIND him, low and close. It is the one beast that
      // is not a threat — it is the source of what is on his skin.
      orbit: 1.5, lead: -1.1, height: 0, scale: 0.9,
      strikeEvery: 3.4, strikeRange: 2.6, strikeDmg: 5,
      strikeKb: 1.4, strikeKbY: 0.2, strikeHitstun: 12,
      manifest: 0.50, suppressed: 1.4, src: 'ino_reiki',
      // and it visibly leaks the water he is gliding on
      trail: true
    }
  },

  // ---- 3 · 麒麟 KIRIN — THE TRADE BEAST ------------------------------------
  // Canon: it "nullifies his sense of pain", described as an intracerebral
  // doping; "the technique also DRAINS HIS STAMINA" and it "makes Ino very
  // tired"; and "after he finishes using Kirin, HE CAN'T MOVE for a certain
  // amount of time."
  //
  // Every one of those three clauses is implemented literally, and together
  // they make the most punishing stance in the game to sit in:
  //   PAIN NULLIFICATION  -> `painNull` — armour on every normal AND a flat
  //                          reduction on incoming hitstun. He does not flinch.
  //   STAMINA DRAIN       -> `staminaDrain: 18/s`, on top of a 16/s CE drain.
  //                          Nothing else in the game drains two resources.
  //   HE CANNOT MOVE AFTER-> `exitLock` — leaving Kirin, for ANY reason
  //                          including being knocked out of it, roots him for
  //                          0.75 s. This is unique in the roster: no other
  //                          stance in this game punishes you for LEAVING it.
  //
  // In exchange he hits harder than anything on the roster except Gorilla and
  // Sukuna, and he simply does not stop coming.
  kirin: {
    name: 'KIRIN', jp: '麒麟', short: 'KIR', clipSuffix: 'Kir',
    role: 'TRADE · NO PAIN · AND IT IS KILLING HIM',
    // *** DAMAGE TRIMMED AND THE DRAIN RAISED AFTER MEASURED MATCHES. ***
    // At 1.34 with armour on every normal AND pain nullification on top, Kirin
    // won bot-versus-bot against Reggie 193-to-0 and 112-to-53, and the two
    // drains that are supposed to price it were not being felt inside a
    // 45-second round. 1.26 is still the third-hardest-hitting stance in the
    // game behind Gorilla and Sukuna, and 19/s CE against a 2.4/s regen is
    // net -16.6: a full bar now buys about six seconds of Kirin and then he is
    // out of techniques entirely. Sitting in it is a countdown, which is what
    // the design said and what the numbers now do.
    stats: { walkSpeed: 2.20, runSpeed: 4.20, dashSpeed: 6.60, damageScale: 1.26, dashDrain: 38 },
    ceDrain: 19,
    staminaDrain: 20,
    punches: [
      { name: 'Hammer', dmg: 6.6, startup: 10, active: 4, recovery: 21, reach: 1.78, kb: 3.0, kbY: 0, hitstun: 18, type: 'light', step: 1.6, armorFrames: 10, src: 'ino_kirin' },
      { name: 'Drive', dmg: 7.8, startup: 11, active: 4, recovery: 22, reach: 1.84, kb: 3.6, kbY: 0, hitstun: 20, type: 'light', step: 1.6, armorFrames: 10, src: 'ino_kirin' },
      { name: 'Antler Lift', dmg: 13.2, startup: 15, active: 5, recovery: 30, reach: 1.92, kb: 5.0, kbY: 8.8, hitstun: 30, type: 'launcher', step: 1.9, armorFrames: 14, src: 'ino_kirin' }
    ],
    heavy: {
      name: 'Trample', dmg: 22, startup: 20, active: 5, recovery: 35,
      reach: 2.10, kb: 7.0, kbY: 0, hitstun: 34, step: 2.5,
      staminaCost: 26, armorFrames: 18, ceGain: 1.8, clip: 'heavyKir', src: 'ino_kirin'
    },
    // RB — the reaching one of the pair. A charge behind the qilin's horn.
    ct1: {
      name: 'HORN RUSH', jpName: '角突', cost: 22,
      startup: 13, active: 14, recovery: 24,
      effect: 'ino_hornrush', clip: 'ct1Kir',
      dmg: 20, reach: 2.1, travel: 7.6, speed: 15,
      kb: 4.4, kbY: 1.0, hitstun: 24, armorFrames: 20, destruct: 40, src: 'ino_kirin'
    },
    // RT — the strongest. He takes a hit ON PURPOSE and gives one back, and
    // because he feels nothing the trade is scored in his favour.
    ct2: {
      name: 'DOPING STRIKE', jpName: '脳内麻薬', cost: 30,
      startup: 18, active: 6, recovery: 32,
      effect: 'ino_doping', clip: 'ct2Kir',
      dmg: 34, reach: 2.3, kb: 6.0, kbY: 0, hitstun: 34, type: 'knockdown',
      armorFrames: 26, selfDmg: 9, destruct: 46, src: 'ino_kirin'
    },
    // POOR GUARD, deliberately. A stance whose whole read is "I do not need to
    // block" should not also block well.
    blockChipMult: 1.22, blockStaminaMult: 1.26, blockStartupFrames: 4,
    dashIFrames: 0,
    painNull: { hitstunMult: 0.62, kbResist: 0.72 },
    exitLock: 0.75,
    spirit: {
      key: 'kirin', name: 'KIRIN', jp: '麒麟', color: 0xffc24a,
      // it stands right beside him, tall. This is the one the opponent has to
      // watch, because it hits hardest.
      orbit: 1.7, lead: 0.5, height: 0, scale: 1.05,
      strikeEvery: 2.0, strikeRange: 3.0, strikeDmg: 12,
      strikeKb: 2.6, strikeKbY: 0.5, strikeHitstun: 18,
      manifest: 0.70, suppressed: 2.2, src: 'ino_kirin'
    }
  },

  // ---- 4 · 龍 RYU — THE ULTIMATE'S BEAST ----------------------------------
  // *** NOT SELECTABLE. *** `beasts.order` does not contain it, so the wheel
  // can never reach it; the only door in is the ultimate's effect handler,
  // exactly as `SUMMONS` is the only door to Mahoraga and the `all` stance is
  // the only door to Panda's three-core window.
  //
  // Built as a REAL STANCE rather than as a pile of buffs, for the same reason
  // Panda's `all` is: `_def` and `_punchSet` already route through the active
  // stance, so every system reads the dragon's numbers for free.
  //
  // He gets THE BEST ATTRIBUTE OF EVERY BEAST AT ONCE, which is the brief's
  // ask and is also what "all four at once" has to mean: Kirin's damage,
  // Reiki's speed and guard, Kaichi's reach, and pain nullification on top.
  // RB is Kaichi's Horn and RT is Kirin's Doping Strike — the reaching one and
  // the hardest one, per the slot convention.
  ryu: {
    name: 'RYU', jp: '龍', short: 'RYU', clipSuffix: 'Ryu',
    role: 'THE ONE NOBODY HAS DESCRIBED',
    stats: { walkSpeed: 3.20, runSpeed: 6.40, dashSpeed: 11.00, damageScale: 1.42, dashDrain: 14 },
    punches: [
      { name: 'Dragon Jab', dmg: 5.8, startup: 5, active: 3, recovery: 10, reach: 1.82, kb: 2.2, kbY: 0, hitstun: 15, type: 'light', step: 2.1, armorFrames: 8, src: 'ino_ryu' },
      { name: 'Dragon Cross', dmg: 6.8, startup: 6, active: 3, recovery: 11, reach: 1.88, kb: 2.8, kbY: 0, hitstun: 17, type: 'light', step: 2.1, armorFrames: 8, src: 'ino_ryu' },
      { name: 'Ascend', dmg: 11.4, startup: 9, active: 4, recovery: 18, reach: 1.96, kb: 4.4, kbY: 8.8, hitstun: 28, type: 'launcher', step: 2.4, armorFrames: 10, src: 'ino_ryu' }
    ],
    heavy: {
      name: 'Coil Slam', dmg: 24, startup: 15, active: 5, recovery: 26,
      reach: 2.15, kb: 7.2, kbY: 0, hitstun: 34, step: 2.9,
      staminaCost: 16, armorFrames: 20, ceGain: 1.8, clip: 'heavyKir', src: 'ino_ryu'
    },
    ct1: {
      name: 'HORN', jpName: '角', cost: 0,
      startup: 10, active: 4, recovery: 16,
      effect: 'ino_horn', clip: 'ct1Kai',
      dmg: 22, range: 18.0, speed: 28, radius: 0.85,
      kb: 3.8, kbY: 0.8, hitstun: 24, destruct: 24, src: 'ino_ryu'
    },
    ct2: {
      name: 'DOPING STRIKE', jpName: '脳内麻薬', cost: 0,
      startup: 12, active: 6, recovery: 22,
      effect: 'ino_doping', clip: 'ct2Kir',
      dmg: 40, reach: 2.5, kb: 6.5, kbY: 0, hitstun: 36, type: 'knockdown',
      armorFrames: 26, selfDmg: 0, destruct: 60, src: 'ino_ryu'
    },
    blockChipMult: 0.70, blockStaminaMult: 0.70, blockStartupFrames: 2,
    dashIFrames: 10,
    painNull: { hitstunMult: 0.55, kbResist: 0.65 },
    spirit: {
      key: 'ryu', name: 'RYU', jp: '龍', color: 0xd8e4ff,
      orbit: 2.6, lead: 1.2, height: 1.9, scale: 1.0,
      strikeEvery: 1.1, strikeRange: 5.0, strikeDmg: 16,
      strikeKb: 3.0, strikeKbY: 0.8, strikeHitstun: 20,
      manifest: 0.9, suppressed: 0, src: 'ino_ryu',
      serpent: true
    }
  }
};

export const BEAST_ORDER = ['kaichi', 'reiki', 'kirin'];

export const INO = withDefaults({
  id: 'ino', name: 'INO', title: 'AUSPICIOUS BEASTS',
  jpName: '猪野琢真',

  // =========================================================================
  // STATS — AVERAGE, THEN HEAVILY MODIFIED PER BEAST
  // =========================================================================
  // Everything here is the roster mean, and everything that matters is
  // overridden by the worn beast (see BEASTS above and `Fighter.stats`, which
  // merges the stance over these). These are what he is with the mask OFF —
  // and that is not a hypothetical, because getting guard-broken puts him
  // here, so this row is a real state a player will find themselves in.
  stats: {
    hp: 100,
    walkSpeed: 2.60, runSpeed: 5.20, dashSpeed: 8.60, jumpVel: 8.80,
    startMaxCE: 42, ceRegen: 2.40, ceGainPerPunch: 6,
    stamina: 104, staminaRegen: 22, dashDrain: 26,
    damageScale: 1.00
  },

  // ---- THE MASK -----------------------------------------------------------
  // The whole character, in one object.
  //
  // `swapCost` IS THE ANTI-PANDA DIAL. At 14 CURRENT_CE against a 2.4/s regen,
  // a swap is about six seconds of meter, and his cheapest technique is 16 —
  // so swapping and then immediately using the new beast's RB costs 30, which
  // is most of a bar he started the round with 42 of. He CANNOT cycle. A round
  // where an Ino swaps more than six or seven times is a round where he never
  // threw a technique, and that is the intended shape.
  //
  // `swapFrames` at 30 is longer than Panda's 26 and longer than Toji's weapon
  // draw, because pulling a knit hat over your head is a bigger physical
  // action than switching grip, and because the animation has to be legible
  // enough to be the character's signature moment.
  mask: {
    swapCost: 14,
    swapFrames: 30,
    // ---- LOSING THE MASK ---------------------------------------------------
    // *** THE CANON WEAKNESS, AND THE HARDEST COUNTERPLAY WINDOW IN THE
    // GAME. *** "As his mask is very visible and can easily be taken off
    // should one get close enough, Ino's technique can easily be negated."
    //
    // A GUARD BREAK or a KNOCKDOWN knocks it off. For `duration` seconds:
    //   · no beast (it dismisses instantly and cannot be recalled)
    //   · RB and RT are dead buttons
    //   · his stats fall back to the base row above
    //   · B does nothing — he cannot swap to a beast he cannot channel
    // and then he pulls it back down over `refit` seconds and comes back in
    // whichever beast he was wearing.
    //
    // 2.6 s is a very long time in this game — about two punish combos. It is
    // priced that way on purpose: he has three complete movesets and a second
    // body on the field, and the thing that keeps that fair is that one read
    // deletes all of it.
    maskOff: { duration: 2.6, refit: 0.5, onGuardBreak: true, onKnockdown: true, knockdownChance: 0.55 }
  },

  beasts: {
    defs: BEASTS,
    order: BEAST_ORDER,
    default: 'kaichi'
  },

  stances: BEASTS,

  // Base slots point at Kaichi so anything reading the config without going
  // through `Fighter._def` sees a coherent character rather than a hole — the
  // same call panda.js makes.
  punches: BEASTS.kaichi.punches,
  heavy: BEASTS.kaichi.heavy,
  ct1: BEASTS.kaichi.ct1,
  ct2: BEASTS.kaichi.ct2,
  blockChipMult: BEASTS.kaichi.blockChipMult,
  blockStaminaMult: BEASTS.kaichi.blockStaminaMult,
  blockStartupFrames: BEASTS.kaichi.blockStartupFrames,

  // ---- MASS ---------------------------------------------------------------
  // Ordinary adult, which he is. Nothing here is remarkable and nothing should
  // be: the beast is what changes, not the body.
  kbResist: 1.0,
  launchResist: 1.0,
  size: {
    height: 1.79,
    bodyRadius: 0.29,
    pushRadius: 0.46,
    hurtRadius: 0.66, hurtHeight: 1.52, hurtCenter: 1.02, hurtPad: 0.13,
    strikeY: 1.24,
    stepShake: 0.015,
    camDist: 1.0, camHeight: 0, camPitch: 0
  },

  // ---- B · SPECIAL — THE MASK SWAP ---------------------------------------
  // Hold to open the radial, release to swap. It is Panda's `coreWheel` shape
  // — a radial, then a committed animation you cannot cancel — with three
  // differences that are the whole character:
  //   1. IT COSTS CURRENT_CE, per swap. Panda's is 8 and his rotation is free
  //      in practice; this is 14 and his is not.
  //   2. THE MASK IS A PHYSICAL OBJECT going over his face and it is visible
  //      for every one of the 30 frames.
  //   3. It refuses outright while the mask is off, which is the one input in
  //      this game that is disabled by a state rather than by a resource.
  special: {
    key: 'ino_wheel', name: 'MASK SWAP', jp: '降霊',
    cost: 14, cooldown: 1.2, clip: 'maskWheel',
    timeScale: 0.62, maxHold: 3.2, stateFrames: 30
  },

  // ---- D-pad RIGHT · ULTIMATE — 龍 THE DRAGON ----------------------------
  // NON-DOMAIN: standard gate (MAX_CE 100 + a full bar), full bar cost,
  // standard backlash, and the fast non-domain startup.
  //
  // He pulls the mask all the way down and channels the beast he never got to
  // use. For `duration` seconds:
  //   · he is in the `ryu` stance above — every beast's best attribute at once
  //   · the DRAGON is on the field, and it is the only spirit in the game that
  //     is genuinely large, genuinely fast and genuinely independent of his
  //     position
  //   · the other THREE beasts manifest around him as well, orbiting, so the
  //     cast is literally the whole technique at once
  //
  // The cinematic on activation is the three masks-worth of beasts spiralling
  // in while the dragon comes down over his shoulder — see the `ult` clip and
  // `ino_dragon` in effects.js.
  //
  // *** 8.0 s AND NO SCALING. *** Panda's scales by surviving cores because he
  // can lose them; nothing about Ino can be lost, so a scaling dial would be a
  // number that is always 1.00. It is a flat, big, short window.
  ultimate: {
    kind: 'burst', name: 'THE DRAGON', jpName: '龍',
    startup: 34, active: 6, recovery: 20,          // 60f — the fast non-domain gate
    effect: 'ino_dragon', clip: 'ult',
    duration: 8.0,
    dmg: 0,
    // the dragon's own pass at cast time, before the window opens
    castDmg: 26, castRange: 14.0, castRadius: 2.2,
    castKb: 6.0, castKbY: 2.4, castHitstun: 34, destruct: 55,
    backlash: { duration: 8, regenMult: 0.5, growthMult: 0.5 }
  },

  // canon-correct: a grade 2 (later grade 1) sorcerer with no Domain Expansion
  domain: null,

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // THE JUDGEMENT HORN. Copy holds one attack, and the only thing in Ino's kit
  // that does something no other move in the game does is the projectile that
  // cannot be dodged.
  //
  // Deliberately NOT the mask swap and NOT a beast: Yuta has no mask, so a
  // copied swap would have nothing to swap between, which is the clearest
  // possible sign that the mask is a resource system rather than a technique.
  // Copy holds attacks; this is the attack.
  copyEffect: { effect: 'ino_judgehorn', dmg: 26, name: 'Copied: Judgement Horn' }
});
