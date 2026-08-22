// Roster registry: gameplay config + model builder + clips per character.
import { GOJO } from './gojo.js';
import { YUTA } from './yuta.js';
import { NANAMI } from './nanami.js';
import { YUJI } from './yuji.js';
import { TODO } from './todo.js';
import { JOGO } from './jogo.js';
import { MAHITO } from './mahito.js';
import { MEGUMI } from './megumi.js';
import { MAHORAGA } from './mahoraga.js';
import { HIGURUMA } from './higuruma.js';
import { HAKARI } from './hakari.js';
import { SUKUNA } from './sukuna.js';
import { TOJI } from './toji.js';
import { HANAMI } from './hanami.js';
import { KUROURUSHI } from './kurourushi.js';
import { CHOSO } from './choso.js';
import { NOBARA } from './nobara.js';
import { GETO } from './geto.js';
import { NAOYA } from './naoya.js';
import { KASHIMO } from './kashimo.js';
import { PANDA } from './panda.js';
import { INUMAKI } from './inumaki.js';
import { MAKI } from './maki.js';
import { YUKI } from './yuki.js';
import { MIWA } from './miwa.js';
import { URO } from './uro.js';
import { DAGON } from './dagon.js';
import { YAGA } from './yaga.js';
import { TAKABA } from './takaba.js';
import { URAUME } from './uraume.js';
import { RYU } from './ryu.js';
import { REGGIE } from './reggie.js';
import { INO } from './ino.js';
import { buildGojo } from '../art/models/gojo.js';
import { buildYuta } from '../art/models/yuta.js';
import { buildNanami } from '../art/models/nanami.js';
import { buildYuji } from '../art/models/yuji.js';
import { buildTodo } from '../art/models/todo.js';
import { buildJogo } from '../art/models/jogo.js';
import { buildMahito } from '../art/models/mahito.js';
import { buildMegumi } from '../art/models/megumi.js';
import { buildMahoraga } from '../art/models/mahoraga.js';
import { buildHiguruma } from '../art/models/higuruma.js';
import { buildHakari } from '../art/models/hakari.js';
import { buildSukuna } from '../art/models/sukuna.js';
import { buildToji } from '../art/models/toji.js';
import { buildHanami } from '../art/models/hanami.js';
import { buildKurourushi } from '../art/models/kurourushi.js';
import { buildChoso } from '../art/models/choso.js';
import { buildNobara } from '../art/models/nobara.js';
import { buildGeto } from '../art/models/geto.js';
import { buildNaoya } from '../art/models/naoya.js';
import { buildKashimo } from '../art/models/kashimo.js';
import { buildPanda } from '../art/models/panda.js';
import { buildInumaki } from '../art/models/inumaki.js';
import { buildMaki } from '../art/models/maki.js';
import { buildYuki } from '../art/models/yuki.js';
import { buildMiwa } from '../art/models/miwa.js';
import { buildUro } from '../art/models/uro.js';
import { buildDagon } from '../art/models/dagon.js';
import { buildYaga } from '../art/models/yaga.js';
import { buildTakaba } from '../art/models/takaba.js';
import { buildUraume } from '../art/models/uraume.js';
import { buildRyu } from '../art/models/ryu.js';
import { buildReggie } from '../art/models/reggie.js';
import { buildIno } from '../art/models/ino.js';
import { makeClips } from '../art/anim/index.js';
import {
  variantsOf, hasVariants, variantEntry, resolveVariant, splitPick, joinPick,
  lastVariant, rememberVariant
} from './variants.js';
import { GOJO_VARIANTS } from './variants/gojo.js';
import { SUKUNA_VARIANTS } from './variants/sukuna.js';
import { MAHITO_VARIANTS } from './variants/mahito.js';
import { YUJI_VARIANTS } from './variants/yuji.js';

export {
  variantsOf, hasVariants, variantEntry, resolveVariant, splitPick, joinPick,
  lastVariant, rememberVariant
};

// Presentation data lives here alongside `role`: `jp` is the name in kanji
// (the select screen sets it huge, and as the watermark behind each tile) and
// `accent` is the character's signature colour, which drives the focused
// card, the hero panel and the HUD cut-in.
// `spirit: true` marks the cursed spirits — the select screen badges them.
// `variants` is the list documented in ./variants.js — first entry is always
// the base. A character with no `variants` key gets an implicit single-entry
// list, so every character has the same shape and the select flow never has to
// special-case anybody.
export const ROSTER = {
  gojo: { config: GOJO, buildModel: buildGojo, jp: '五条悟', accent: 0x7fd0ff, role: 'ZONE CONTROL · BEST DOMAIN', variants: GOJO_VARIANTS },
  yuta: { config: YUTA, buildModel: buildYuta, jp: '乙骨憂太', accent: 0x9ff5c9, role: 'COPY · HIGHEST OUTPUT' },
  megumi: { config: MEGUMI, buildModel: buildMegumi, jp: '伏黒恵', accent: 0x8fb6d8, role: 'TEN SHADOWS · SUMMONER' },
  nanami: { config: NANAMI, buildModel: buildNanami, jp: '七海建人', accent: 0xf2b23c, role: 'RATIO · NO DOMAIN, NO MERCY' },
  yuji: { config: YUJI, buildModel: buildYuji, jp: '虎杖悠仁', accent: 0xff5f74, role: 'BLACK FLASH · PURE PHYSICAL', variants: YUJI_VARIANTS },
  todo: { config: TODO, buildModel: buildTodo, jp: '東堂葵', accent: 0xff5fc8, role: 'BOOGIE WOOGIE · HEAVYWEIGHT' },
  jogo: { config: JOGO, buildModel: buildJogo, jp: '漏瑚', accent: 0xff5a1f, role: 'DISASTER FLAMES · ZONER', spirit: true },
  mahito: { config: MAHITO, buildModel: buildMahito, jp: '真人', accent: 0x9fb0c4, role: 'IDLE TRANSFIGURATION · SUMMONER', spirit: true, variants: MAHITO_VARIANTS },
  higuruma: { config: HIGURUMA, buildModel: buildHiguruma, jp: '日車寛見', accent: 0xd8c78a, role: 'DEADLY SENTENCING · ONE GAMBLE' },
  hakari: { config: HAKARI, buildModel: buildHakari, jp: '秤金次', accent: 0xffc93c, role: 'IDLE DEATH GAMBLE · JACKPOT' },
  sukuna: { config: SUKUNA, buildModel: buildSukuna, jp: '両面宿儺', accent: 0xff2f45, role: 'DISMANTLE · THE KING OF CURSES', variants: SUKUNA_VARIANTS },
  // THE ANOMALY. No cursed energy, no domain, no meter — see characters/toji.js.
  toji: { config: TOJI, buildModel: buildToji, jp: '伏黒甚爾', accent: 0x6ea88a, role: 'HEAVENLY RESTRICTION · CURSED TOOLS' },
  // THE TWO NON-DOMAIN SPIRITS. Both canon-correct: neither has a Domain
  // Expansion, so both sit with Nanami, Todo and Toji on a burst ultimate.
  hanami: { config: HANAMI, buildModel: buildHanami, jp: '花御', accent: 0x9ec46a, role: 'DISASTER PLANTS · AREA DENIAL', spirit: true },
  kurourushi: { config: KUROURUSHI, buildModel: buildKurourushi, jp: '黒沐死', accent: 0xd8a02a, role: 'GLUTTONY · ATTRITION', spirit: true },
  // THE TWO WITH A SECOND RESOURCE AND NO DOMAIN. Both canon-correct: neither
  // Choso nor Nobara has a Domain Expansion, so both sit with Nanami, Yuji,
  // Todo, Toji, Hanami and Kurourushi on a burst ultimate. What is new about
  // them is the gauge next to the cursed-energy bar — BLOOD, which he fills by
  // being in the fight, and ESSENCE, which she takes off you.
  //
  // Choso is NOT badged `spirit`. He is half cursed spirit and half human by
  // birth, and the select screen's badge means "this is a cursed spirit you
  // are picking" — Jogo, Mahito, Hanami, Kurourushi. A Death Painting Womb
  // walking around in a body that non-sorcerers can see is not that, and
  // badging him would put him in the wrong bucket on the only screen where the
  // distinction is stated.
  choso: { config: CHOSO, buildModel: buildChoso, jp: '脹相', accent: 0xc4142c, role: 'BLOOD MANIPULATION · MID-RANGE CONTROL' },
  nobara: { config: NOBARA, buildModel: buildNobara, jp: '釘崎野薔薇', accent: 0xe07a34, role: 'STRAW DOLL · SETUP ZONER' },
  // THE TWO NEW NON-DOMAIN ADULTS. Both canon-correct: neither Geto nor Naoya
  // has a Domain Expansion, so both sit with Nanami, Yuji, Todo, Toji, Hanami,
  // Kurourushi, Choso and Nobara on a burst ultimate.
  //
  // Geto is NOT badged `spirit` — he is a human curse USER, and the badge on
  // the select screen means "this is a cursed spirit you are picking" (Jogo,
  // Mahito, Hanami, Kurourushi). The man who keeps four of those in a jar is
  // emphatically not one of them, and badging him would put him in the wrong
  // bucket on the only screen where the distinction is stated. Same ruling
  // Choso already gets, for the same reason.
  geto: { config: GETO, buildModel: buildGeto, jp: '夏油傑', accent: 0x6b2fa0, role: 'CURSED SPIRIT MANIPULATION · THE GENERAL' },
  naoya: { config: NAOYA, buildModel: buildNaoya, jp: '禪院直哉', accent: 0xe8c85a, role: 'PROJECTION SORCERY · 24 FRAMES' },
  // THE MOVEMENT CHARACTER. Also canon-correct with no Domain Expansion, so he
  // joins the burst-ultimate list that is now most of the roster. What is new
  // about him is the CHARGE meter next to the cursed-energy bar — a resource
  // that only his own feet can fill, and the only one in the game that FALLS
  // when its owner does nothing.
  kashimo: { config: KASHIMO, buildModel: buildKashimo, jp: '甚壱', accent: 0xa46bff, role: 'MYTHICAL BEAST AMBER · CHARGE RUSHDOWN' },
  // THE STANCE CHARACTER, and the only fighter in the game with more than one
  // health bar. Not badged `spirit`: the badge means "this is a cursed spirit
  // you are picking" (Jogo, Mahito, Hanami, Kurourushi), and a cursed CORPSE
  // built by a headmaster is a different thing — the same ruling Choso and
  // Geto already get, for the same reason. He is a student.
  panda: { config: PANDA, buildModel: buildPanda, jp: '呪骸', accent: 0xf2f0e8, role: 'THREE CORES · STANCE SWITCH' },
  // THE COMMANDER, and the first fighter in the project who wins by taking
  // somebody else's body away from them rather than by hitting it. Also
  // canon-correct with no Domain Expansion. What is new about him is the
  // THROAT gauge next to the cursed-energy bar — the only resource in the game
  // that is spent by SPEAKING, that costs no cursed energy at all, and whose
  // empty state (SILENCED) removes his entire kit rather than weakening it.
  //
  // Not badged `spirit`: he is a second-year student at Jujutsu High.
  inumaki: { config: INUMAKI, buildModel: buildInumaki, jp: '狗巻棘', accent: 0x9fd8c8, role: 'CURSED SPEECH · COMMANDER' },
  // THE SECOND HEAVENLY RESTRICTION, and the only fighter in the game with
  // IN-MATCH PROGRESSION. She is built as the deliberate mirror of Toji: he is
  // at full power on frame one and never scales, she starts below the roster
  // average and ends up his equal. Same weapon family, opposite curve. She
  // reuses his `noCursedEnergy` handling everywhere — see characters/maki.js
  // for the site-by-site list, none of which changed to accommodate her.
  //
  // Her accent is deliberately in Toji's family (#5fae7a against his #6ea88a):
  // it is the one place in the project where two characters are intentionally
  // adjacent in hue, because the select screen should say the two Heavenly
  // Restrictions are a pair.
  maki: { config: MAKI, buildModel: buildMaki, jp: '禪院真希', accent: 0x5fae7a, role: 'HEAVENLY RESTRICTION · AWAKENS MID-FIGHT' },
  // THE HEAVYWEIGHT, the roster's first true grappler, and the first fighter
  // with an ally that is ALWAYS on the field rather than summoned and spent.
  // Canon-correct with no Domain Expansion, so she joins the burst-ultimate
  // list. What is new about her is the MASS gauge — the only resource in the
  // game that is simultaneously a damage stat and a mobility debt.
  yuki: { config: YUKI, buildModel: buildYuki, jp: '九十九由基', accent: 0x6f7fd0, role: 'STAR RAGE · GRAPPLER' },
  // THE COUNTER CHARACTER, with the weakest raw kit in the game and the single
  // strongest defensive tool. Also canon-correct with no Domain Expansion —
  // SIMPLE DOMAIN IS NOT ONE. It is a defensive barrier technique, and hers
  // being the definitive version in the game does not make it a domain; see
  // the header of combat/newshadow.js, which is also where the ruling that the
  // UNIVERSAL Simple Domain is untouched is written down.
  //
  // Not badged `spirit`: she is a second-year student at Kyoto Jujutsu High,
  // and her uniform is the Kyoto one rather than the Tokyo one the shipped
  // students wear — see art/models/miwa.js.
  miwa: { config: MIWA, buildModel: buildMiwa, jp: '三輪霞', accent: 0xa8d8e8, role: 'NEW SHADOW STYLE · SIMPLE DOMAIN' },
  // THE AERIAL CHARACTER, and the first fighter in this project who is not
  // obliged to come back down. Her passive is the largest single change to the
  // movement rules the roster has ever taken — see combat/flight.js — and it
  // is why the maps grew a ceiling query (arena/bounds.js `ceilingAt`).
  //
  // Her accent is DELIBERATELY NOT HER HAIR COLOUR. #cfe8f5 is a near-white
  // pale blue taken off the sky-cloth, because the brief asks for her warp
  // effects to be near-colourless distortion rather than a hue, and the accent
  // drives every callout the game draws for her. Picking the pink would have
  // promised an energy colour the effects deliberately do not have.
  //
  // Not badged `spirit`: she is a Heian-era human sorcerer, incarnated into a
  // body for the Culling Game. Same ruling Geto and Choso already get.
  uro: { config: URO, buildModel: buildUro, jp: '烏鷺亨子', accent: 0xcfe8f5, role: 'SKY MANIPULATION · FLIGHT · DOMAIN' },
  // THE DOMAIN SUMMONER — the first character in the game whose domain is a
  // SPAWNER rather than a damage tick or a lockdown, and the only one who is
  // deliberately weak until he casts it. Badged `spirit`: he is a special
  // grade cursed spirit born of the fear of the ocean, so he joins Jogo,
  // Mahito, Hanami and Kurourushi.
  dagon: { config: DAGON, buildModel: buildDagon, jp: '陀艮', accent: 0xb8323a, role: 'CAPTIVATING SKANDHA · DOMAIN SUMMONER', spirit: true },
  // THE BUILDER. The sixth summon family on the field and the only one that is
  // MANUFACTURED rather than called: he spends time under pressure and receives
  // whatever he managed to finish. Canon-correct with no Domain Expansion.
  //
  // Not badged `spirit`: he is the headmaster of Tokyo Jujutsu High, a human
  // sorcerer. His CORPSES are not cursed spirits either — see the separation
  // note in art/models/cursedcorpses.js — which is the same ruling Panda (one
  // of those corpses, walking around as a student) already gets.
  //
  // His accent #b59a68 is the STANDARD corpse tier's core colour rather than
  // anything he wears, because he wears a black suit and a black accent would
  // be invisible on every callout the game draws for him. The roster's rule is
  // that the accent is the character's signature colour, and his signature is
  // the light burning inside the things he makes.
  yaga: { config: YAGA, buildModel: buildYaga, jp: '夜蛾正道', accent: 0xb59a68, role: 'CURSED CORPSES · THE BUILDER' },
  // THE WILDCARD, and the only fighter in the game nobody can plan around —
  // including the player holding him. Every technique rolls a random absurd
  // outcome off a weighted table, and his ultimate hands control of the round
  // to the OPPONENT for eight seconds. Also canon-correct with no domain.
  //
  // He is the deliberate tonal break in a cast that is otherwise entirely
  // serious, and the design leans on it rather than apologising for it: his
  // stats are the roster average in every category, because the joke and the
  // design are the same thing.
  takaba: { config: TAKABA, buildModel: buildTakaba, jp: '高羽史彦', accent: 0xff4d7a, role: 'THE COMEDIAN · RANDOM OUTCOMES' },
  // ---- THE TWO NEW ZONERS, AND THEY ARE OPPOSITE ENDS OF THE SAME IDEA ----
  // Both control space and neither does it the way Jogo does.
  //
  // URAUME is the CONTROL zoner, and the deliberate inverse of the attrition
  // one: they deal almost no damage from range and instead take away the
  // opponent's ability to move, approach and escape. FROST slows the legs, the
  // dash and the startup and does NO damage over time at all; ICE TERRAIN
  // reshapes how the arena handles. They are the SECOND terrain-modifying
  // character in the game after Hanami, and they reuse his classification
  // rather than growing a second surface layer — see arena/terrain.js and the
  // header of combat/frost.js.
  //
  // Canon-correct with no Domain Expansion, so they join the burst list.
  //
  // Not badged `spirit`: a thousand-year-old human curse user, incarnated into
  // a modern body. Same ruling Geto, Choso and Uro already get.
  //
  // The accent #4fd8e8 was chosen by MEASUREMENT rather than by eye — CIELAB
  // ΔE against every other accent on this screen, maximum-minimum taken. It
  // wins at ΔE 21.0 from its nearest neighbour (Miwa), against 22.9 from
  // Gojo's blue and 97.7 from Kashimo's violet. The obvious pale blues all
  // failed: a near-white frost lands 4.7 from Uro. See the audit in
  // art/models/uraume.js.
  uraume: { config: URAUME, buildModel: buildUraume, jp: '裏梅', accent: 0x4fd8e8, role: 'ICE FORMATION · CONTROL ZONER' },
  // RYU is the ARTILLERY, and the first fighter in the project whose whole
  // kit is a COMMITMENT: he plants, he charges through visible tiers, he
  // fires, and if he guessed wrong he eats a full combo. He is the slowest
  // character in the game and has the worst dash in the game.
  //
  // What is new about him is the CE CEILING — 150 against the roster's 100,
  // and the first time this project has had to separate "how much cursed
  // energy a body holds" from "the shared ultimate gate", which had been the
  // same number for twenty-eight characters. The gate is still 100 and still
  // means exactly what it always did; see `Fighter.ceCeiling` and the long
  // audit at the top of combat/output.js.
  //
  // *** HE IS THE ONE CHARACTER ON THE BURST-ULTIMATE LIST WHO IS NOT THERE
  // BECAUSE CANON GIVES HIM NO DOMAIN. *** He HAS a Domain Expansion — he
  // casts one in ch.179 — and absolutely nothing is known about it: no name,
  // no interior, no sure-hit, because the barrier came apart before it was
  // realised. Building one would be inventing it. See the long note in
  // characters/ryu.js.
  //
  // Not badged `spirit`: a human sorcerer from 400 years ago, incarnated for
  // the Culling Game. Same ruling Uro gets, for the same reason.
  ryu: { config: RYU, buildModel: buildRyu, jp: '石流龍', accent: 0xd8f05a, role: 'CURSED ENERGY DISCHARGE · ARTILLERY' },
  // ---- THE TWO NEW ONES, AND THEY ARE OPPOSITE ANSWERS TO THE SAME
  // QUESTION: what do you do when the technique is not in your body? ----
  //
  // REGGIE is the only fighter in this game who does not attack with cursed
  // energy at all. Every single thing he throws is a real object — a ladder, a
  // moped, a car — burned back into existence off a receipt he was carrying,
  // and the RECEIPT STOCK next to his cursed-energy bar is the only resource
  // in the game that is spent on OBJECTS rather than on techniques. It is also
  // the only one that can be turned off by WATER, which is canon and is how he
  // dies in the source.
  //
  // Canon-correct with no Domain Expansion — he has an ANTI-domain technique
  // instead, 彌虚葛籠 HOLLOW WICKER BASKET, the Heian-era ancestor of Simple
  // Domain, which is what his Simple Domain is called and looks like.
  //
  // Not badged `spirit`: a human curse user from the Heian era, incarnated for
  // the Culling Game. Same ruling Uro, Uraume and Ryu already get.
  //
  // His accent #f2e3af is the BLEACHED BLOND, and it is the one place on this
  // screen where the accent is a character's HAIR — because his only other
  // candidate colour is receipt-paper white, which lands at ΔE 6.4 from Panda's
  // #f2f0e8 and would be indistinguishable from him on every callout the game
  // draws. The blond sits at ΔE 19.6 from its nearest neighbour (Hakari's
  // #ffc93c) and 24.1 from Higuruma's #d8c78a.
  reggie: { config: REGGIE, buildModel: buildReggie, jp: 'レジィ・スター', accent: 0xf2e3af, role: '再契象 · MATERIALISES OBJECTS' },
  // INO is the opposite: the technique is not in his body either, but where
  // Reggie buys his, Ino BORROWS his — he covers his face, becomes a medium,
  // and something else works through him. He is the roster's second stance
  // character after Panda and the EIGHTH ally family on the field, and the
  // thing that is new about him is that the two are the same mechanic: the
  // beast he is wearing IS the stance, so his moveset, his stats and the
  // creature beside him all change on one button.
  //
  // *** HIS ALLY IS THE ONLY ONE IN THE GAME THAT CANNOT BE KILLED, AND THE
  // ONLY ONE THAT CAN BE TAKEN AWAY BY A NORMAL. *** Both halves are canon:
  // the beasts are channelled rather than summoned, so there is no body to
  // destroy — and the mask is "very visible and can easily be taken off",
  // which in this game means a guard break or a knockdown strips it and takes
  // his entire kit with it for 2.6 seconds.
  //
  // Canon-correct with no Domain Expansion. Not badged `spirit`: a grade 2
  // (later grade 1) human sorcerer, and the beasts are not cursed spirits
  // either — they are 瑞獣, auspicious beasts, which is close to the opposite
  // thing. See the separation note in art/models/auspiciousbeasts.js.
  //
  // His accent #8fd8c4 was chosen the way Uraume's was, by MEASUREMENT rather
  // than by eye: he wears head-to-toe black, so there is nothing on the model
  // to take an accent FROM, and the four beasts are four different colours so
  // none of them can own it either. #8fd8c4 is the midpoint of the three
  // wearable beasts' hues pulled to a legible value, and it wins its CIELAB
  // audit at ΔE 17.8 from its nearest neighbour (Inumaki's #9fd8c8 — the two
  // are genuinely close, and they are the two quiet students, which is the one
  // adjacency on this screen I am willing to keep).
  ino: { config: INO, buildModel: buildIno, jp: '猪野琢真', accent: 0x8fd8c4, role: '来訪瑞獣 · MEDIUM · FOUR BEASTS' }
};

export const hex = n => '#' + n.toString(16).padStart(6, '0');

// Select-screen order. Geto sits next to Megumi (the two summoners read as a
// pair) and Naoya next to Toji (the two Zenin, and the two whose whole game is
// about a single mechanic the opponent has to respect).
// Kashimo sits next to Naoya — the two speed characters, so a player choosing
// between them is comparing them side by side, which is the only way the
// distinction between "fastest" and "never stops" reads on a select screen.
// Panda sits next to Todo — the two heavyweights, and the two whose answer to
// pressure is to stand in it.
// MAKI sits immediately after TOJI, which is the most important placement on
// this screen: the two Heavenly Restrictions are a matched pair and a player
// choosing between them should be comparing them side by side, because the
// whole point of her design is that she is his opposite curve rather than his
// worse copy. Same argument that already put Naoya next to Toji and Kashimo
// next to Naoya.
// MIWA sits next to Yuta — the two sword users — and YUKI next to Todo, which
// puts the three heavyweights (Panda, Todo, Yuki) in a run and lets the
// "imposing without bulk" note be read against the one with the bulk.
// URO sits next to Naoya and Kashimo — the movement run. A player comparing
// "fastest", "never stops" and "does not come down" is comparing the three
// characters whose whole identity is where their body is, which is the only
// way the distinction between them reads on a select screen.
// YAGA sits immediately after PANDA, and it is the most pointed placement on
// this screen after Toji/Maki: Panda IS one of Yaga's cursed corpses, and a
// player choosing between them is looking at the maker and the made. It also
// puts the game's two "constructed body" entries side by side, which is the
// only place the distinction between "a corpse that became a person" and "a
// corpse that is a tool" can be read.
// TAKABA sits between the humans and the spirits, alone, which is exactly
// where he belongs: he is the last serious pick before the monsters start and
// he is not serious at all. Nothing on this screen pairs with him, and that is
// the point of the character.
// DAGON sits at the end of the spirits, next to Kurourushi: the two attrition
// spirits, and the two whose answer to being rushed is to let you.
// RYU sits immediately after URO, and it is the most pointed placement on this
// screen since Toji/Maki: they fought each other, she is the reason he lost,
// and the game's ruling about what her Sky Reflect does to his Granite Blast is
// the single most consequential interaction either of them has. A player
// choosing between them is looking at a matchup, which is the only context in
// which "she bends what he throws" reads as a fact about both characters
// rather than as a footnote on one.
// URAUME sits at the head of the zoner run, immediately before Jogo — the two
// zoners, and the two whose whole game is making the ground somewhere you do
// not want to be. It is the same argument that put Naoya next to Toji: the
// distinction between them (he wins by attrition, they win by taking your legs)
// only reads when they are side by side. It also puts the game's two
// terrain-modifying characters, Uraume and Hanami, in the same run.
// INO sits immediately after PANDA and before YAGA, and it is the most
// pointed placement on this screen since Toji/Maki: Panda is the game's other
// stance character and Ino is the one who proves the idea can be something
// else. A player choosing between them is comparing "three bodies, one health
// bar" against "one body, four things wearing it", which is the only context
// in which either character's design reads as a decision rather than as a
// gimmick. It also keeps the Panda/Yaga maker-and-made pairing intact, because
// Ino goes BEFORE Panda rather than between them.
// REGGIE sits immediately after HIGURUMA, which is the second most pointed
// placement: they are the roster's two adults whose technique is a LEGAL
// INSTRUMENT — a court's judgement and a signed contract — and they are the
// only two characters in the game who win by paperwork.
export const ROSTER_IDS = ['gojo', 'sukuna', 'toji', 'maki', 'naoya', 'kashimo', 'uro', 'ryu', 'yuta', 'miwa', 'inumaki', 'megumi', 'geto', 'nanami', 'higuruma', 'reggie', 'hakari', 'yuji', 'nobara', 'choso', 'ino', 'panda', 'yaga', 'todo', 'yuki', 'takaba', 'uraume', 'jogo', 'mahito', 'hanami', 'kurourushi', 'dagon'];

// `pick` is 'gojo' (the base) or 'gojo:shinjuku'. A bare character id still
// works everywhere it used to, which is why nothing outside the select screen
// had to learn about variants.
export function makeCharacter(pick) {
  const { charId, variantId } = splitPick(pick);
  const entry = ROSTER[charId];
  const r = resolveVariant(entry, charId, variantId);
  const model = r.buildModel();
  // ---- THE ACCENT IS STAMPED ON THE MODEL --------------------------------
  // fx/impactgeo.js tints every punch's 3D debris by the attacker's accent, so
  // a player can tell whose hit landed from the colour of what came off it.
  // Reading it from the ROSTER rather than from each model's own palette means
  // it is authoritative in one place — the same value the select screen, the
  // HUD cut-in and the finisher grade already use — and that the older models,
  // most of which never declared a palette accent, get it for free.
  if (model.palette) model.palette.accent = r.accent ?? model.palette.accent;
  return {
    config: r.config,
    model,
    clips: makeClips(r.clipId),
    variant: r.variant
  };
}

// Presentation for a pick, for the select screen, the HUD cut-in and the
// result screen. Falls back to the base entry for a bare id.
export function pickInfo(pick) {
  const { charId, variantId } = splitPick(pick);
  const entry = ROSTER[charId] || SUMMONS[charId];
  if (!entry) return null;
  if (!ROSTER[charId]) return { ...entry, charId, variantId: 'base', name: entry.config.name };
  const r = resolveVariant(entry, charId, variantId);
  return {
    charId, variantId: r.variant.id, config: r.config, jp: r.jp, accent: r.accent,
    role: r.role, spirit: entry.spirit, name: r.config.name,
    variantName: r.variant.name, type: r.variant.type, descriptor: r.variant.descriptor
  };
}

// every selectable pick id in the game, base + variants — used by the CPU
// picker and by the balance harness
export function allPicks() {
  const out = [];
  for (const id of ROSTER_IDS) for (const v of variantsOf(ROSTER[id], id)) out.push(joinPick(id, v.id));
  return out;
}

// ---------------------------------------------------------------------------
// SUMMON-ONLY CHARACTERS
// ---------------------------------------------------------------------------
// Deliberately NOT in ROSTER or ROSTER_IDS: the select screen, the CPU picker
// and the random-pick path all read those, so nothing here can ever be chosen.
// The only door in is a system that calls makeSummon() — for Mahoraga that is
// Megumi's summon ritual (core/ritual.js), and nothing else.
export const SUMMONS = {
  mahoraga: {
    config: MAHORAGA, buildModel: buildMahoraga, jp: '魔虚羅',
    accent: 0xc6ac72, role: 'ADAPTATION · SUMMON ONLY'
  }
};

export function makeSummon(id) {
  const entry = SUMMONS[id];
  if (!entry) throw new Error('unknown summon: ' + id);
  return {
    config: entry.config,
    model: entry.buildModel(),
    clips: makeClips(id)
  };
}

// presentation lookup that covers the roster AND the summons (HUD cut-ins,
// the debug overlay, the viewer)
export function entryFor(id) { return ROSTER[id] || SUMMONS[id] || null; }
