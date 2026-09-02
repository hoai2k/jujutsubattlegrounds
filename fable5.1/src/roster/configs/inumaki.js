// INUMAKI — 狗巻棘. Cursed Speech. THE COMMANDER.
//
// He does not hit you. He tells you what to do, and you do it.
//
// THE WHOLE CHARACTER IS ONE SENTENCE: he has the worst normals in the game
// and the most direct control over another fighter's body that anything in
// this project has ever had, and every word he says costs him his voice.
//
// ---------------------------------------------------------------------------
// RESEARCH — WHAT CURSED SPEECH ACTUALLY IS
// ---------------------------------------------------------------------------
// Sources (web, 2026-08-19): the Jujutsu Kaisen Wiki entries for Cursed Speech
// and for Toge Inumaki, the Gamerant explainer "Toge's Cursed Speech
// Technique, Explained", the Sportskeeda pieces on why he coughs blood and on
// the Maki/Toji matchup, and the Twinfinite safe-word guide.
//
//   · Cursed Speech is the INHERITED TECHNIQUE OF THE INUMAKI CLAN. It
//     reinforces the speaker's words with cursed energy; anyone who hears them
//     is compelled to act, or is acted upon, according to the word.
//   · It does not need line of sight or even presence — he once put Kasumi
//     Miwa to sleep OVER A PHONE. (Not modelled: a fighting game needs a
//     range, and an unavoidable full-screen command is not a move.)
//   · THE COST IS THE THROAT, NOT THE HEALTH. Overuse means a sore throat, a
//     ruined voice and coughing blood; he carries cough syrup to stretch his
//     usage. Against Hanami his throat was bleeding after a handful of
//     commands. There is no canon in which cursed speech costs him HP, which
//     is why the gauge below never touches the health bar.
//   · RESISTANCE IS CANON AND IT IS ABOUT CURSED ENERGY. The effect hinges on
//     the gap between the speaker's cursed energy and the target's — a strong
//     target forces him onto a STRONGER WORD, and a stronger word costs more
//     throat. A sorcerer who knows the technique is coming can also refuse to
//     let it register. Both halves are implemented: see `resistOf` and the
//     block reduction in combat/speech.js.
//   · He speaks only in ONIGIRI INGREDIENTS in ordinary conversation so he
//     cannot curse the people around him by accident. Salmon means yes, bonito
//     flakes means no. That is the taunt, verbatim.
//
// THE CONFIRMED COMMAND LIST, and what the brief got right and wrong:
//   DON'T MOVE   動くな   confirmed — used on Aoi Todo at the Goodwill Event.
//   STOP         止まれ   confirmed — the defensive twin of DON'T MOVE. FOLDED
//                        INTO IT rather than shipped as an eighth near
//                        duplicate; two commands that both mean "stand still"
//                        is one command with two subtitles.
//   SLEEP        眠れ     confirmed — Kasumi Miwa, over the phone.
//   GET CRUSHED  潰れろ   confirmed (the wiki lists it as Plummet / Crumble
//                        Away — a field of gravity that crushes the target
//                        into the ground). The brief's description was right.
//   BLAST AWAY   吹き飛べ confirmed.
//   EXPLODE      爆ぜろ   confirmed, and it is the STRONGEST word he is shown
//                        using — the target detonates. It is the ultimate.
//   RUN AWAY     逃げろ   confirmed.
//   GET TWISTED  捻れ     CONFIRMED, AND THE BRIEF MISSED IT. It forcibly
//                        twists an appendage of the target to the point of
//                        disfigurement. Added — see `twist` below.
//   COME HERE    来い     NOT CONFIRMED. I could not verify this as a word he
//                        is shown using; "come here / return" appears in fan
//                        compilations and not in anything I could source. It
//                        is SHIPPED ANYWAY because the brief asks for it and
//                        the kit genuinely needs one closing tool, but it is
//                        flagged `canon: false` in the table below so nobody
//                        later mistakes it for research.
//
// Canon-correct: INUMAKI HAS NO DOMAIN EXPANSION. He joins Nanami, Yuji, Todo,
// Toji, Hanami, Kurourushi, Choso, Nobara, Geto, Naoya, Kashimo and Panda on a
// burst ultimate with the faster non-domain startup and the standard gate.
import { withDefaults } from './schema.js';

// ---------------------------------------------------------------------------
// THE COMMANDS
// ---------------------------------------------------------------------------
// One entry is one command, and adding a command is one entry — nothing in
// combat/speech.js, the wheel, the HUD, the debug overlay or the CPU knows any
// command by name. Fields:
//
//   name/short/jp/romaji  what it is called, everywhere it is printed
//   kanji                 THE GLYPHS THAT FLY. fx/kanji.js extrudes these
//                         characters as real 3D geometry; the string's length
//                         decides how many glyphs travel.
//   effect                key into the speech resolver (combat/speech.js)
//   throat                strain added on a COMPLETED utterance
//   utter                 frames of the utterance window — the whole
//                         counterplay. He can be hit out of every one of them.
//   range                 metres. Commands are NOT full screen and every one
//                         of them prints its own number in the debug overlay.
//   dur                   seconds of the forced state at CLEAR throat against
//                         a zero-resistance target. Scaled by tier, by the
//                         target's MAX_CE and by whether they blocked.
//   dmg                   damage, where the command does any
//   color                 the glyph colour, the overlay colour and the light
//   weight                'light' | 'heavy' — drives the utterance ANIMATION
//                         and the screen-shake scale, nothing else
//   desc                  the wheel's one-line description
export const COMMANDS = {
  // ---- THE NEUTRAL TOOL ---------------------------------------------------
  // Cheap, fast, no damage. It is what he throws to buy the two seconds he
  // needs to say something that matters, and it is the setup for every other
  // command in the table.
  dont_move: {
    key: 'dont_move', name: "DON'T MOVE", short: "DON'T MOVE", jp: '動くな',
    romaji: 'UGOKU NA', kanji: '動くな', canon: true,
    effect: 'speech_root', weight: 'light',
    throat: 9, utter: 16, range: 9.0, dur: 1.50, dmg: 0,
    color: 0x5fb0ff, clip: 'utterLight',
    desc: 'ROOTS THEM · CHEAP · SETS UP EVERYTHING'
  },

  // ---- THE CLOSER ---------------------------------------------------------
  // His only way to make distance disappear, and the one command in the table
  // I could not verify. See the header.
  come_here: {
    key: 'come_here', name: 'COME HERE', short: 'COME HERE', jp: '来い',
    romaji: 'KOI', kanji: '来い', canon: false,
    effect: 'speech_pull', weight: 'light',
    throat: 13, utter: 20, range: 11.0, dur: 0.55, dmg: 0,
    color: 0xd0343c, clip: 'utterLight',
    desc: 'DRAGS THEM IN · THE SETUP FOR GET CRUSHED'
  },

  // ---- THE DISENGAGE ------------------------------------------------------
  // No damage at all. It exists to make a rushdown character stop being a
  // rushdown character for one second, which for THIS fighter is worth more
  // than damage. See the honesty note in the delivery report about how this
  // feels on the receiving end.
  run_away: {
    key: 'run_away', name: 'RUN AWAY', short: 'RUN AWAY', jp: '逃げろ',
    romaji: 'NIGERO', kanji: '逃げろ', canon: true,
    effect: 'speech_flee', weight: 'light',
    throat: 12, utter: 18, range: 8.5, dur: 0.95, dmg: 0,
    color: 0x8fd06a, clip: 'utterLight',
    desc: 'THEY SPRINT AWAY · BREAKS PRESSURE OUTRIGHT'
  },

  // ---- THE SOFT LOCK ------------------------------------------------------
  // Deliberately NOT Naoya's freeze. A short stagger and then a long SLOW —
  // they keep their inputs the whole time, they are just wading. Two mechanics
  // that both mean "you do not get to move" would make one of them redundant,
  // and the freeze is the better version of that idea.
  sleep: {
    key: 'sleep', name: 'SLEEP', short: 'SLEEP', jp: '眠れ',
    romaji: 'NEMURE', kanji: '眠れ', canon: true,
    effect: 'speech_sleep', weight: 'heavy',
    throat: 16, utter: 24, range: 8.0, dur: 3.20, dmg: 4,
    slowMult: 0.55, staggerFrames: 20,
    color: 0x6a6adf, clip: 'utterHeavy',
    desc: 'STAGGER, THEN THEY WADE · NOT A STUN'
  },

  // ---- THE ONE THE BRIEF MISSED -------------------------------------------
  // 捻れ. The wiki is explicit: it twists an appendage of the target to the
  // point of disfigurement. As a fighting-game move that is a DISARM, not a
  // knockdown — they keep playing, with the arm that is now wrong.
  twist: {
    key: 'twist', name: 'GET TWISTED', short: 'GET TWISTED', jp: '捻れ',
    romaji: 'NEJIRE', kanji: '捻れ', canon: true,
    effect: 'speech_twist', weight: 'heavy',
    throat: 22, utter: 30, range: 7.5, dur: 4.00, dmg: 16,
    dmgDebuff: 0.68,
    color: 0xc86adf, clip: 'utterHeavy',
    desc: 'BREAKS THE ARM · THEIR DAMAGE DROPS 32%'
  },

  // ---- THE PAYOFF ---------------------------------------------------------
  crush: {
    key: 'crush', name: 'GET CRUSHED', short: 'GET CRUSHED', jp: '潰れろ',
    romaji: 'TSUBURERO', kanji: '潰れろ', canon: true,
    effect: 'speech_crush', weight: 'heavy',
    throat: 26, utter: 34, range: 10.0, dur: 0.9, dmg: 30,
    kb: 1.2, kbY: 0, hitstun: 40,
    color: 0x9b5fd0, clip: 'utterHeavy',
    desc: 'SLAMS THEM DOWN · HARD KNOCKDOWN'
  },

  // ---- THE BIG ONE --------------------------------------------------------
  // The most expensive word he can say without going to the ultimate, and the
  // one that will take him from CLEAR to RAW in a single breath.
  blast_away: {
    key: 'blast_away', name: 'BLAST AWAY', short: 'BLAST AWAY', jp: '吹き飛べ',
    romaji: 'FUKITOBE', kanji: '吹き飛べ', canon: true,
    effect: 'speech_blast', weight: 'heavy',
    throat: 34, utter: 44, range: 12.0, dur: 0.9, dmg: 42,
    kb: 14.0, kbY: 5.2, hitstun: 46, destruct: 40,
    color: 0xffd2a0, clip: 'utterHeavy',
    desc: 'HIS HARDEST WORD · ENORMOUS KNOCKBACK'
  }
};

// Wheel order — fixed forever, because muscle memory depends on it. Seven
// sectors; `_wheelPick` in fighter.js is written against `order.length` and
// does not care that it is an odd number.
export const COMMAND_ORDER = [
  'dont_move', 'come_here', 'run_away', 'sleep', 'twist', 'crush', 'blast_away'
];

export const INUMAKI = withDefaults({
  id: 'inumaki', name: 'INUMAKI', title: 'CURSED SPEECH',
  jpName: '狗巻棘',

  stats: {
    // SLIGHT AND FAST AND FRAGILE. Below-average health because he is a
    // support-grade sorcerer standing in a fighting game, and a dash well
    // above the roster norm because getting away from people is the only
    // defence he has.
    hp: 88, walkSpeed: 2.7, runSpeed: 5.3, dashSpeed: 9.4, jumpVel: 8.8,
    // CURSED ENERGY IS NOT HIS COST. Commands are free of it — his cost is the
    // throat, which is the entire design. The bar exists only as the ultimate
    // gate, and the ONLY way it grows is `ceGainPerPunch`, which means the man
    // with the worst normals in the game has to land some of them to ever say
    // the biggest word. That tension is deliberate.
    startMaxCE: 38, ceRegen: 2.4, ceGainPerPunch: 7,
    // THE WORST OUTGOING MULTIPLIER IN THE GAME, under Geto's 0.82. It applies
    // to the commands too, so the numbers in the table above are pre-scale.
    damageScale: 0.78,
    stamina: 100, staminaRegen: 24, dashDrain: 22
  },

  // ---- X · THE PUNCH STRING -----------------------------------------------
  // The worst normals in the game and it should show: short, weak, and thrown
  // like somebody who has never thrown one. He is not trying to win with this;
  // he is trying to get MAX_CE up and get his space back. The third hit KNOCKS
  // DOWN rather than launching — he has nothing to do with an airborne
  // opponent, and a knockdown buys him the two seconds a heavy command needs.
  punches: [
    { name: 'Shove', dmg: 2.6, startup: 8, active: 3, recovery: 15, reach: 1.22, kb: 1.3, kbY: 0, hitstun: 12, type: 'light', step: 1.0 },
    { name: 'Back Hand', dmg: 3.0, startup: 8, active: 3, recovery: 17, reach: 1.26, kb: 1.7, kbY: 0, hitstun: 14, type: 'light', step: 1.0 },
    { name: 'Shoulder Turn', dmg: 5.4, startup: 13, active: 4, recovery: 26, reach: 1.30, kb: 3.0, kbY: 0, hitstun: 27, type: 'knockdown', step: 1.2 }
  ],

  // HEAVY — a two-handed shove to make room. Same job as Geto's Repel and the
  // same reason: it is a panic button, not a win condition.
  heavy: {
    name: 'Push Off', dmg: 10, startup: 17, active: 5, recovery: 30,
    reach: 1.80, kb: 7.6, kbY: 0, hitstun: 30, step: 1.5,
    staminaCost: 20, armorFrames: 0, ceGain: 1.8, clip: 'heavy'
  },

  // ---- THE THROAT ---------------------------------------------------------
  // The gauge, the tiers and the recovery curve. Every number the system uses
  // is declared here rather than in combat/speech.js, the same split Kashimo's
  // CHARGE keeps: the module owns the rules, the config owns the numbers.
  //
  // HE TAKES NO SELF-DAMAGE, EVER. This gauge and the health bar never touch.
  throat: {
    max: 100,
    // Recovery does not begin the instant he stops talking — `restDelay`
    // seconds have to pass first. That delay is the whole reason his rhythm is
    // speak / disengage / recover rather than speak / speak / speak.
    recover: 11.0, restDelay: 1.10,
    // SILENCED recovers FASTER than the other tiers, so the crisis state is a
    // crisis and not a death sentence. See `tickThroat` in speech.js.
    silencedRecover: 15.0,
    // Being hit DURING an utterance cancels the command and adds this fraction
    // of its cost anyway. Rushing him down is the counterplay and this is what
    // makes it pay double.
    interruptMult: 0.60,
    // Hysteresis: once SILENCED he does not get his voice back the moment the
    // gauge crosses back under the threshold — it has to fall to `clearAt`.
    // Without this he flickers in and out of the crisis state and the crisis
    // stops meaning anything.
    clearAt: 55
  },

  // ---- RB · CT1 / RT · CT2 — THE TWO BOUND COMMANDS -----------------------
  // Neither slot has frame data of its own. Every number — startup, cost,
  // range, damage — comes from whichever COMMAND is currently bound, which is
  // what makes the wheel a real decision instead of a skin. What the slots DO
  // carry is the default binding and the recovery, which belongs to the mouth
  // rather than to the word.
  //
  // ANY command can go in EITHER slot. Binding BLAST AWAY to RB does not make
  // it cheap — it makes RB expensive. `light` and `heavy` in the table are
  // descriptions of the word, not of the button.
  ct1: {
    name: 'COMMAND I', jpName: '呪言', cost: 0,
    startup: 16, active: 2, recovery: 16,
    effect: 'inumaki_command', clip: 'utterLight', command: true, defaultCommand: 'dont_move'
  },
  ct2: {
    name: 'COMMAND II', jpName: '呪言', cost: 0,
    startup: 34, active: 2, recovery: 26,
    effect: 'inumaki_command', clip: 'utterHeavy', command: true, defaultCommand: 'crush'
  },

  // ---- LT · BLOCK / LB · DASH ---------------------------------------------
  // Average guard, ABOVE-AVERAGE DASH (see `dashSpeed` and the low `dashDrain`
  // above). Stated explicitly because both are design decisions: he is allowed
  // to leave, and he is not allowed to sit in it.
  blockChipMult: 1.0,
  blockStaminaMult: 1.0,
  blockStartupFrames: 5,

  // ---- B · SPECIAL — THE COMMAND WHEEL ------------------------------------
  // The fifth radial, on exactly the pattern Megumi's shikigami wheel
  // established and Toji, Geto and Panda already reuse: TAP commits the
  // default, HOLD opens the ring while time slows a little and gameplay keeps
  // running, RB/RT choose which slot the pick lands in, release confirms.
  //
  // The one thing that is new here: a command he CANNOT CURRENTLY AFFORD is
  // greyed out and unselectable, exactly as a destroyed curse is. The wheel is
  // therefore also the readout of what his throat still allows.
  special: {
    key: 'inumaki_wheel', name: 'COMMAND WHEEL', jp: '呪言',
    cost: 0, cooldown: 3.0, clip: 'wheel', timeScale: 0.65, maxHold: 3.2,
    stateFrames: 8
  },

  commands: {
    defs: COMMANDS,
    order: COMMAND_ORDER,
    defaults: { ct1: 'dont_move', ct2: 'crush' }
  },

  // ---- D-pad Right · ULTIMATE — EXPLODE -----------------------------------
  // 爆ぜろ. The strongest word he is shown using, and the research says so:
  // the wiki lists Explode as a command that makes the target detonate. So
  // this is NOT "a maximum-power Blast Away" — it is its own confirmed word,
  // which is the better answer and the one the brief asked me to look for.
  //
  // NON-DOMAIN, so it pays exactly what every other burst ultimate in the game
  // pays and gets the faster non-domain startup: the gate is MAX_CE 100 plus a
  // full CURRENT_CE, and firing it runs `consumeFullBar` — the bar empties AND
  // MAX_CE drops back to `startMaxCE`, so the whole meter has to be rebuilt
  // from 38 with a punch string that does 2.6 damage. That reset IS the
  // backlash for a burst; the `backlash` block below is declared for the same
  // reason Geto's and Nanami's are (it is part of the ultimate's shape) and,
  // like theirs, only a domain cast reads it.
  //
  // HE SPENDS HIS VOICE ENTIRELY. On use the throat goes to MAXIMUM and a
  // latch is set that holds him SILENCED FOR THE REST OF THE ROUND regardless
  // of what the gauge does afterwards. There is no recovery from it and no
  // second one. After this he is a teenager with the worst punch string in the
  // game, and that is the price of the biggest single command in the project.
  ultimate: {
    kind: 'burst', name: 'EXPLODE', jpName: '爆ぜろ',
    startup: 62, active: 20, recovery: 34,
    effect: 'inumaki_explode', clip: 'ult',
    command: 'explode', kanji: '爆ぜろ', color: 0xff7a2a,
    dmg: 118, radius: 5.2, kb: 12.0, kbY: 7.5, hitstun: 52, destruct: 90,
    // the forced state that follows the detonation
    dur: 2.2,
    backlash: { duration: 8, regenMult: 0.5, growthMult: 0.5 }
  },

  // canon-correct: no Domain Expansion
  domain: null,

  simpleDomainDrain: 20,
  barrierBreak: { ceDrain: 30, chip: 22 },

  // ---- YUTA'S COPY --------------------------------------------------------
  // What Copy takes off Inumaki is DON'T MOVE — and it is deliberately the
  // SAME `dont_move` effect key Yuta's own sword-domain table has always
  // rolled, not a second implementation of the same idea. See the note in
  // combat/speech.js: `dont_move` (Yuta's, unchanged) and `speech_root`
  // (Inumaki's, resistance-scaled) are two different keys on purpose, and Copy
  // takes the OLD one so nothing about Yuta changes in either direction.
  copyEffect: { effect: 'dont_move', dur: 1.6, name: 'Copied: Cursed Speech' }
});
