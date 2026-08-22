// Cursed technique effect dispatcher + timed entities (attractors, beams,
// lunge windows). Effect keys come from character configs — data in, code here.
import { v3, clamp, rand, yawBetween, flatDist } from '../core/mathutil.js';
import { computeDamage, inArc, hitFeedback, openBlackFlash } from './hits.js';
import { applyBurn } from './burn.js';
import { gainEvidence } from './judgeman.js';
import { gainCharge, spendCharge, chargeSize } from './charge.js';
import { spendMass, massOnEvent } from './mass.js';
// The three new characters' technique GEOMETRY. Everything in here is a real
// oriented mesh rather than a camera-facing card — see the header of
// fx/newfx.js for the freeze-frame test each construct has to pass.
import {
  cloudArc, soulCleave, awakenBurst, massField, massSlamCone, singularity,
  iaiLine, cutRibbon
} from '../fx/newfx.js';
import {
  spend as spendThroat, spendVoice, durationFor, damageFor, resistOf,
  beginForced, inCommandRange, tierDef as throatTierDef, adaptKey
} from './speech.js';
import { ARTIFICIAL } from '../arena/terrain.js';
// URAUME's frost. Every ice tool in the kit applies stacks through this one
// entry point and nowhere else, so the stack rate, the cap, the FROSTBOUND
// trigger and its cooldown are decided in a single place — see the header of
// combat/frost.js.
import { applyFrost, isFrostbound } from './frost.js';
// URO's reflect. `tryReflect` is consulted once per travelling entity per
// frame, at the TOP of the update loop below and nowhere else — see the
// header of combat/reflect.js for why one hook covers every projectile in the
// game and why a technique added later is safe-by-default.
import { tryReflect } from './reflect.js';
// TAKABA's roll (the lift of Yuta's) and YAGA's corpse geometry.
import { rollBit, gainComedy } from './comedy.js';
// REGGIE — the stock (spent in fighter.js, refunded and locked here), the
// drone/wreck system, and the burning receipt that precedes every single
// materialisation in his kit.
import { burnFX, canAfford, spendStock, burnEverything } from './receipts.js';
import { buildObject, buildJunk, buildHook, buildLadder } from '../art/models/receiptobjects.js';
import { corpseDeploy, commandPulse, bigGlove, mallet, bananaPeel, bucket, pie, rake, trapdoor, stageLight, anvil, safe, curtain, fireHose, foamFinger, piano } from '../fx/comedyfx.js';

const TODO_ACCENT = 0xff5fc8; // Boogie Woogie's signature snap color

// ---------------------------------------------------------------------------
// ADAPTATION SOURCE MAP
// ---------------------------------------------------------------------------
// Mahoraga adapts per damage CATEGORY, so every technique in the game has to
// declare which bucket it falls in. Categorised by what the move IS first and
// by which slot it happens to live in second — that is why Jogo's embers are
// `projectile` rather than `ct1`, and why Todo's grab is `throw` rather than
// `ct2`. Anything left undeclared falls back to its slot, and anything with
// neither is simply not adaptable (which is correct for buffs: there is
// nothing to adapt to in Overtime or Overheat).
export const EFFECT_SRC = {
  // GOJO — Red is a burst, Blue is an attractor; neither travels as a
  // projectile the way an ember does, so they stay on their slots. Hollow
  // Purple costs the whole bar, which is what makes it an ultimate here.
  gojo_red: 'ct1', gojo_blue: 'ct2', purple: 'ultimate',
  // YUTA — the domain's rolled payloads are all `domain` (see applySwordTech).
  yuta_rika_swing: 'ct1', yuta_lunge: 'ct2', rika_blast: 'ultimate',
  sword_slash: 'domain',
  // ---- URAUME — TWO BUCKETS, NOT ONE ------------------------------------
  // The opposite ruling to Kashimo's. His whole kit is ONE bucket because it
  // is all the same substance arriving in a different shape; hers is TWO
  // because the two tools are genuinely different KINDS of thing and adapting
  // to one should not pre-answer the other.
  //   ICEFALL is a PROJECTILE — block-shaped ice launched across the arena and
  //   steered, which is the same category Jogo's insects and Nobara's nails
  //   are in, and Mahoraga adapting to "small hard things flying at me" should
  //   cover all three.
  //   FROST CALM is not thrown at all. It comes UP OUT OF THE GROUND along a
  //   line, so it keeps its slot, exactly as Hanami's Root Eruption does.
  // FROST FIELD deals almost no damage and is a terrain play, so it sits with
  // the buffs and the states at null — there is nothing to adapt to in a
  // floor. And the ULTIMATE sits with the ultimates, as every ultimate does.
  //
  // *** THE FROST STACKS AND FROSTBOUND ARE DELIBERATELY NOT IN THIS TABLE,
  // and it is the same ruling Naoya's freeze already gets. *** Adaptation is a
  // response to DAMAGE, and frost does none — no damage over time, and the
  // shell's 3-damage bite is charged to the technique that made it. So
  // Mahoraga cannot adapt to being slowed or to being shelled, and his answer
  // to Uraume is the same as everyone else's, which is to close the distance
  // before the meter fills. What he CAN adapt to is the ice itself, and he
  // will: five Icefall volleys is five projectile marks.
  // ---- REGGIE — SEVEN BUCKETS, AND IT IS THE MOST BUCKETS ANY CHARACTER
  // IN THE GAME HAS ------------------------------------------------------
  // The same ruling Toji's four weapons get, taken as far as it goes: a
  // ladder, a moped and a car are not the same KIND of thing arriving, and a
  // body that has learned to take one has learned nothing about the others.
  // The opposite of Kashimo, whose entire kit is one substance.
  //
  // The consequence in the Mahoraga matchup is deliberate and is the brief's
  // "rotation puzzle": nine buckets (seven objects + the junk + his punches)
  // against Mahoraga's one adaptation every ten seconds means Reggie is the
  // slowest character in the game to be adapted to, and Mahoraga's answer is
  // that Reggie cannot AFFORD to rotate freely — every bucket has a price, so
  // the puzzle cuts both ways.
  //
  // THE ULTIMATE IS `ultimate`, like every ultimate, even though it throws
  // seven objects' worth of things: adapting to a bar-spend is adapting to a
  // bar-spend. THE DRONE is `reggie_drone` rather than `summon`, because it is
  // his and adapting to Megumi's dogs should teach a body nothing about a
  // quadcopter. THE GAS does no damage worth the name and is a vision play, so
  // it sits with the buffs at null — there is nothing to adapt to in a cloud.
  // ---- INO — FOUR BUCKETS, ONE PER BEAST, AND IT IS THE BRIEF'S ASK -----
  // The same call Reggie's objects get and the opposite of Kashimo's: a horn,
  // a wave of cursed water and a qilin's charge are not the same phenomenon
  // arriving in different shapes, they are four different creatures. Adapting
  // to Kaichi should teach a body nothing about Kirin, and the consequence in
  // the matchup is exactly the rotation puzzle the brief describes — except
  // that Ino's rotation costs CURRENT_CE, so Mahoraga's adaptation clock and
  // Ino's meter are racing each other.
  //
  // *** EVERY BEAST'S PASSIVE STRIKE CARRIES THE SAME KEY AS ITS TECHNIQUES,
  // deliberately. *** The creature and the technique are the same beast; a
  // body that has learned to take the qilin's charge has learned to take its
  // kick. That is the one place this differs from the summon families, where a
  // shikigami's bite is `summon` and its master's technique is not.
  ino_horn: 'ino_kaichi', ino_judgehorn: 'ino_kaichi',
  ino_glide: 'ino_reiki', ino_shell: 'ino_reiki',
  ino_hornrush: 'ino_kirin', ino_doping: 'ino_kirin',
  ino_dragon: 'ultimate',
  reggie_junk: 'reggie_junk',
  reggie_ladder: 'reggie_ladder',
  reggie_gas: null,
  reggie_drone: 'reggie_drone',
  reggie_rod: 'reggie_rod',
  reggie_moped: 'reggie_moped',
  reggie_vending: 'reggie_vending',
  reggie_car: 'reggie_car',
  reggie_register: 'ultimate',
  uraume_icefall: 'projectile', uraume_frostcalm: 'ct2',
  uraume_frostfield: null, uraume_maxfrost: 'ultimate',
  // ---- RYU — TWO BUCKETS, AND THE SPLIT IS THE CHARACTER ------------------
  // RAPID BLASTS are `projectile` for the same reason Icefall is: small fast
  // things crossing the arena. GRANITE BLAST is emphatically NOT — a beam is
  // not a volley of pellets, adapting to being peppered should do nothing
  // about a 3.6 m column of compressed cursed energy, and the whole design of
  // the character is that those two tools are different decisions. It keeps
  // its slot.
  //
  // The consequence is the interesting half: against Mahoraga, Ryu's cheap
  // safe tool is the one that stops working and his expensive committal one is
  // not, which inverts the pressure the matchup would otherwise have. He has
  // to start charging, against the one opponent who most wants him to.
  ryu_rapid: 'projectile', ryu_beam: 'ct2', ryu_maxblast: 'ultimate',
  // NANAMI — Collapse is his non-domain ultimate. A Ratio crit is not its own
  // category: it is a multiplier on whatever move crit, so it inherits.
  nanami_cleave: 'ct1', nanami_collapse: 'ultimate', nanami_overtime: null,
  // YUJI — Divergent Fist and Manji Kick are reinforced PHYSICAL strikes with
  // no technique behind them, and Black Flash is the same fist arriving twice.
  // All three are `punch`: adapting to Yuji's hands should blunt all of it,
  // and there is nothing else about him to adapt to.
  yuji_divergent: 'punch', yuji_manji: 'punch', yuji_sukuna: null,
  // TODO — the clap combo is a strike; the grab and both swaps are throws.
  todo_clapcombo: 'ct1', todo_grab: 'throw', todo_boogie_cast: 'throw',
  todo_brotherhood: 'ultimate',
  // JOGO — the embers genuinely fly, so they are the roster's projectiles.
  jogo_embers: 'projectile', jogo_eruption: 'ct2', jogo_overheat: null,
  // MAHITO — Soul Touch is a grab in shape but it is a cursed technique in
  // substance (it applies Soul Wound, not a throw), so it stays on its slot.
  mahito_soultouch: 'ct2', mahito_bodyweapon: 'ct1', mahito_summon: null,
  // MEGUMI — the summon gesture deals nothing; the shikigami do, and they are
  // tagged `summon` where they strike (combat/shikigami.js).
  megumi_shikigami: null, megumi_copy_dog: null,
  // GETO — the summon gestures deal nothing at all; the curses do, and they
  // are tagged `summon` where they strike (combat/curses.js), which puts them
  // in the same adaptation bucket as Megumi's shikigami. That is the correct
  // ruling: they are the same KIND of thing (a body somebody else sent),
  // arriving from two different men, and Mahoraga adapting to "being bitten by
  // something that is not the sorcerer" should cover both.
  //
  // Uzumaki sits with the ultimates. Reabsorb deals no damage, so there is
  // nothing to adapt to — same as Overheat and Overtime.
  geto_summon_low: null, geto_summon_special: null, geto_reabsorb: null,
  geto_copy_low: null, geto_uzumaki: 'ultimate',
  // NAOYA — the Rush is him hitting you with his hands very quickly, so it is
  // `punch`: adapting to Naoya's fists should blunt his string AND his rush,
  // because they are the same fists. The Frame Kick is a distinct committed
  // technique and keeps its slot. MAXIMUM PROJECTION deals no damage and has
  // no hitbox — there is nothing to adapt to in a state.
  //
  // THE FREEZE IS DELIBERATELY NOT IN THIS TABLE, and that is the interesting
  // ruling of the pair: Mahoraga cannot adapt to it, because adaptation is a
  // response to DAMAGE and the freeze does none. See the full audit note in
  // the delivery report — the short version is that his answer to Naoya is the
  // same as everyone else's, which is to stop touching him.
  // ...and since neither of his techniques is his fists any more — the Rush
  // damages with the projection frame passing through you and Frame 24 is a
  // reel of shattering film — the Rush moves off `punch` onto its own slot.
  // Adapting to Yuji's hands no longer pre-answers Naoya's sorcery, which is
  // the correct reading now that no part of it is a hand.
  naoya_rush: 'ct1', naoya_framekick: 'ct2', naoya_maxprojection: null,
  // KASHIMO — every damaging thing he owns is the same substance arriving in a
  // different shape, so all of it is `electric`, INCLUDING the staff string
  // (tagged `src: 'electric'` on the punch defs themselves rather than here,
  // because the melee path reads `def.src`). See the note in adaptation.js for
  // why this is one bucket and Toji's tools are four. The ultimate is a STATE
  // with no hitbox, so like every other state in this table it is null.
  // INUMAKI — the CAST is not adaptable (it produces nothing on its own; the
  // WORD does), and each command declares its own category at the damage site
  // instead, because only the payload knows which word it is. See `adaptKey`
  // in combat/speech.js and the seven `cmd_*` entries in adaptation.js.
  //
  // EXPLODE sits with the ultimates, exactly as Uzumaki and Collapse do — an
  // ultimate is an ultimate whatever shape it arrives in.
  inumaki_command: null, inumaki_explode: 'ultimate',
  kashimo_bolt: 'electric', kashimo_discharge: 'electric',
  kashimo_arcpass: 'electric', kashimo_amber: null,
  // PANDA — ONE CATEGORY PER STANCE, which is the recommendation in the brief
  // and the right call for the same reason Toji's four weapons get four
  // buckets: adapting to a gorilla's fists should do nothing about a
  // triceratops's horn, because they are not the same thing arriving in a
  // different shape (which is Kashimo's case, and why HIS whole kit is one
  // bucket). The result is that the Mahoraga matchup becomes a STANCE ROTATION
  // PUZZLE — Panda stays ahead of the wheel by cycling cores, Mahoraga wins by
  // forcing him onto one, and Panda's answer to being forced is that he can
  // simply let that core die and keep the other two.
  //
  // The punch strings are tagged `src` on the punch defs themselves rather
  // than here, because the melee path reads `def.src`. All three stances tag
  // theirs, so his normals adapt per stance too — which is the half that
  // actually makes the rotation matter, since normals are most of his damage.
  panda_palm: 'panda_core', panda_roll: 'panda_core',
  panda_drum: 'panda_gorilla', panda_slam: 'panda_gorilla',
  panda_gore: 'panda_trike', panda_crestroll: 'panda_trike',
  panda_allcores: null,
  // URO — THIN ICE BREAKER travels as a PLANE rather than as a thrown object,
  // so it is not a `projectile`: adapting to Jogo's embers should do nothing
  // about the sky shattering, which is the same reasoning that keeps Todo's
  // clap wave on its slot. SPACE WARP STRIKE emerges somewhere else entirely
  // and is emphatically its own thing. SKY REFLECT deals no damage of its own
  // — what comes back off it is the ORIGINAL technique with its ORIGINAL
  // `src` intact, which is the correct ruling: Mahoraga hit by his own
  // reflected wheel slash should feed the wheel-slash bucket.
  uro_thin_ice: 'ct1', uro_warp_strike: 'ct2',
  uro_reflect: null,
  // DAGON — the VOLLEY genuinely flies, so it is the roster's second
  // `projectile` alongside Jogo's embers. TIDAL SLAM is a surge on its slot.
  // The SUMMON gesture deals nothing at all; the creatures do, and they are
  // tagged `summon` where they strike (combat/ocean.js) — the same bucket
  // Megumi's shikigami and Geto's curses feed, because they are the same KIND
  // of thing. The DOMAIN's payload is those same creatures, so it too is
  // `summon` rather than `domain`: adapting to being bitten should work
  // whether the barrier is up or not.
  dagon_volley: 'projectile', dagon_tidal_slam: 'ct2', dagon_summon: null,
  // YAGA — COMMAND deals nothing at all (the corpses do, and they are tagged
  // `summon` where they strike, in combat/construction.js — the same bucket
  // Megumi's shikigami, Geto's curses, Mahito's minion and Dagon's sea
  // shikigami feed, because they are the same KIND of thing). The HAYMAKER is
  // a very large man hitting you with his fist, so it is `punch` rather than
  // `ct2`: adapting to Yaga's hands should blunt his string AND his big swing,
  // because they are the same hands. MASTERPIECE produces a body and no hit.
  yaga_command: null, yaga_haymaker: 'punch', yaga_masterpiece: null,
  // TAKABA — ONE CATEGORY FOR ALL FOURTEEN, which is the recommendation in the
  // brief and the Kashimo argument rather than the Toji one. Every outcome IS
  // THE COMEDIAN wearing a different costume; see the full reasoning in
  // combat/adaptation.js under `comedian`. THE GAME SHOW is an instant kill
  // and routes through the INSTANT_KO category instead, which is read as a
  // resist chance rather than a reduction — so it is null here.
  takaba_bit: 'comedian', takaba_big: 'comedian', takaba_theset: null,
  // MAHORAGA (mirror match / Yuta's copy of him)
  mahoraga_wheel_slash: 'ct1', mahoraga_world_cut: 'ct2',
  // HAKARI — the base kit sits on its slots. The SHUTTER is defensive and has
  // nothing to adapt to, like Overtime and Overheat.
  hakari_smash: 'ct1', hakari_rush: 'ct2', hakari_shutter: null,
  // JACKPOT is categorised by what each move IS, not by which button it is on.
  // The blast genuinely travels, so it joins Jogo's embers under `projectile`
  // — adapt to one and you have blunted the other. The flurry and the Gold
  // Rush are him hitting you with his body, which is `punch`. Only the counter
  // punish is a technique in its own right, and it inherits `ct2` from the
  // stance that produced it. Nothing about Jackpot gets its own free category.
  hakari_blast: 'projectile', hakari_counter: null, hakari_punish: 'ct2',
  hakari_goldrush: 'punch',
  // HIGURUMA — the gavel is a cursed-energy construct and stays on its slot.
  // Confiscation deals no damage at all, so there is nothing to adapt TO (the
  // lock is not a hit); the summon likewise. The two sword moves are the
  // DOMAIN doing it, exactly like Yuta's rolled payloads: adapting to
  // "Higuruma's briefcase" should do nothing whatsoever about the blade the
  // courtroom put in his hand.
  higuruma_gavel: 'ct1', higuruma_confiscate: null, higuruma_judgeman: null,
  higuruma_judgment_slash: 'domain', higuruma_execution: 'domain',
  // SUKUNA — three SEPARATE categories, which is the whole Mahoraga matchup.
  // Dismantle and Cleave are the same technique aimed differently, but they
  // are different tools with different ranges and different answers, so
  // adapting to one must not blunt the other: they keep their own slots. Fire
  // Arrow is his ultimate-tier button and sits with the ultimates. Consuming a
  // finger deals no damage and has nothing to adapt to.
  sukuna_dismantle: 'ct1', sukuna_cleave: 'ct2', sukuna_firearrow: 'ultimate',
  sukuna_finger: null,
  // The shrine's automatic slashes are the DOMAIN doing it — the same ruling
  // Yuta's rolled payloads and Higuruma's blade already get.
  malevolent_shrine: 'domain',
  // TOJI — EACH WEAPON IS ITS OWN CATEGORY. This is the recommended ruling
  // from the brief and it is the interesting one: adapting to Playful Cloud
  // does nothing whatsoever about the Split Soul Katana, so the Mahoraga
  // matchup becomes a WEAPON ROTATION PUZZLE rather than a damage race. Toji
  // has four tools and the wheel is fast, so he can genuinely stay ahead of
  // the adaptation clock — which is exactly the fantasy.
  //
  // His FISTS are `punch`, deliberately shared with Yuji's reinforced strikes:
  // they are a man hitting you, and there is nothing else about them to adapt
  // to. That means a Mahoraga who has adapted to Yuji's hands has already
  // blunted Toji's, which is correct — and it is also why Toji's answer to
  // adaptation is to pick up a weapon.
  toji_cloud_sweep: 'toji_cloud', toji_cloud_slam: 'toji_cloud',
  toji_spear_thrust: 'toji_spear', toji_nullify: 'toji_spear',
  toji_soul_slash: 'toji_soul', toji_soul_cut: 'toji_soul',
  toji_chain_whip: 'toji_chain', toji_chain_snare: 'toji_chain',
  // ASSASSINATION is his ultimate-tier button and sits with the ultimates,
  // even though it costs no meter — the category is about what a move IS.
  toji_assassinate: 'ultimate',
  // ---- HANAMI -------------------------------------------------------------
  // Root Eruption is a ground trap and stays on its slot, exactly as Jogo's
  // Volcanic Eruption does — the two are the roster's two ground traps and
  // adapting to one should not touch the other, so they keep separate slots.
  // The Cursed Bud is a technique sustained on the body, so its chip is `ct2`.
  // ROOT FIELD deals no damage at all: there is nothing to adapt to, the same
  // ruling Overtime, Overheat and the Shutter already get. The Wooden Ball is
  // his ultimate-tier button.
  hanami_roots: 'ct2', hanami_rootswarm: 'ct1', hanami_rootfield: null,
  hanami_woodenball: 'ultimate',
  // ---- KUROURUSHI ---------------------------------------------------------
  // THE SWARM IS `summon`. This is the interesting call and it is deliberate:
  // the roaches are independent bodies he releases which then hunt on their
  // own, which is precisely what Megumi's shikigami and Mahito's transfigured
  // humans are, and Mahoraga adapting to "things sent at me" should cover all
  // three. It also means the swarm does NOT share a bucket with the corrosive
  // spray, so the matchup is a rotation puzzle rather than a single answer.
  // INFESTATION ticks under `summon` too — it is the same roaches, more of
  // them — while the CAST is an ultimate; the split is intentional, because
  // adapting to the swarm should blunt the flood it is made of.
  kurourushi_swarm: 'summon', kurourushi_infestation: 'ultimate',
  // the spray is a cursed technique on its slot; its lingering burn goes in
  // with every other damage-over-time as `dot`, tagged at the tick site.
  kurourushi_spray: 'ct2',
  // DEVOUR is a grab, so it is a throw — the same ruling Todo's Vice Grab
  // gets. Self-devour touches nobody and is not adaptable.
  kurourushi_devour: 'throw', kurourushi_selfdevour: null,
  // ---- CHOSO ---------------------------------------------------------------
  // BLOOD EDGE genuinely flies, so it joins Jogo's embers and the Jackpot blast
  // under `projectile` — the established ruling is that things which travel
  // share a bucket, and adapting to one should blunt the others. PIERCING
  // BLOOD does not: it is an instantaneous line, it is his committed read, and
  // it keeps its own slot so a Mahoraga who has answered the poke has NOT
  // answered the punish. That split is what makes the matchup a rotation
  // problem rather than a single correct answer.
  //
  // FLOWING RED SCALE deals no damage and there is nothing to adapt to — the
  // same ruling Overtime, Overheat, Root Field and the Shutter already get.
  // SUPERNOVA is his ultimate-tier button.
  choso_blood_edge: 'projectile', choso_piercing_blood: 'ct2',
  choso_redscale: null, choso_supernova: 'ultimate',
  // ---- NOBARA --------------------------------------------------------------
  // The nail flies, so the THROW is `projectile` with everything else that
  // flies. The DETONATION is the technique rather than the delivery, so it
  // sits on its slot — adapting to thrown things should not also blunt what
  // they do when they go off, any more than adapting to Jogo's embers blunts
  // his eruption.
  nobara_hairpin: 'projectile', nobara_detonate: 'ct1',
  // RESONANCE keeps its own slot and shares a bucket with NOTHING. This is the
  // deliberate call and it is the answer to "which adaptation category does a
  // bypass-everything attack fall into":
  //   · it is NOT `domain`. It is a cursed technique she is performing with
  //     her hands, not a barrier doing it for her, and filing it there would
  //     let a Mahoraga who ate one Malevolent Shrine pre-answer a whole
  //     round's savings.
  //   · it is NOT the instant-KO category. Resonance is DAMAGE — it is not a
  //     kill that ignores health, it is a number, so a damage reduction is
  //     exactly the right shape of counter and the resist-roll ruling in
  //     combat/instantko.js does not apply.
  //   · so it is `ct2`, its own category, earned only by being hit by
  //     Resonance itself. Mahoraga is therefore the one character in the game
  //     who can genuinely answer it — by eating small ones early to build the
  //     reduction before she has banked enough for a big one. That is a real
  //     and interesting matchup and it is the reason this file does not give
  //     her a free pass on the one opponent designed to answer everything.
  nobara_resonance: 'ct2',
  // her committed strike is a physical blow and Black Flash is the same blow
  // arriving twice, so both are `punch` — exactly the ruling Yuji's Divergent
  // Fist, Manji Kick and Flash already share.
  nobara_bf_strike: 'punch',
  nobara_full_release: 'ultimate'
};

// slot -> category, used when an effect declares nothing
const SLOT_SRC = { ct1: 'ct1', ct2: 'ct2', ult: 'ultimate', purple: 'ultimate', copy: null };

// ---------------------------------------------------------------------------
// SUKUNA — FINGER STACKS AND THE CLEAVE FORMULA
// ---------------------------------------------------------------------------
// Every stack he has eaten makes his TECHNIQUES bigger and faster. It does
// nothing whatsoever to his punches, his health, his guard or his movement —
// the snowball lives entirely in the three things that kill. Both helpers
// return 1 for anyone who is not him, so they are safe to call unconditionally
// and there is no branch to forget.
//
// The startup side of the same scaling lives in fighter.js, because startup is
// consumed by the state machine before any effect fires.
export function fingerDmg(f) {
  const n = f?.fingers ?? 0;
  return n ? Math.pow(1 + (f.cfg.fingers?.dmgPerStack ?? 0.09), n) : 1;
}
export function fingerRange(f) {
  const n = f?.fingers ?? 0;
  return n ? Math.pow(1 + (f.cfg.fingers?.rangePerStack ?? 0.08), n) : 1;
}

// CLEAVE'S SCALING, in one place so the technique, the domain's sure-hit tick
// and the HUD indicator can never disagree about what it does.
//
//   damage = base + ceScale x targetMAX_CE
//
// A target with NO CURSED-ENERGY SYSTEM (Mahoraga: startMaxCE 0, ceRegen 0,
// ceGainPerPunch 0 — his MAX_CE is 0 forever) is the interesting case. Reading
// his empty bar literally would leave Cleave at its floor against the single
// toughest thing in the game, which is backwards: Cleave is not weaker against
// people with less energy, it is a technique that ADJUSTS to what it is
// cutting, and against a body with nothing to adjust to it simply cuts. So it
// neither scales up nor collapses — it returns a flat middling value declared
// on the move (`flatVsNoCE`), and the callout says so on screen. Detected from
// the config rather than from a per-character flag, so nothing existing had to
// be edited to teach it about him.
export function cleaveDamage(caster, target, opts = {}) {
  const base = opts.base ?? 12;
  const scale = opts.ceScale ?? 0.32;
  const st = target?.cfg?.stats;
  const hasCE = !!st && (st.startMaxCE > 0 || st.ceGainPerPunch > 0);
  if (!hasCE) {
    const dmg = opts.flatVsNoCE ?? (base + scale * 55);
    return { dmg, depth: 0.5, label: '捌 CLEAVE — NO CURSED ENERGY TO READ', toast: 'CLEAVE · FLAT' };
  }
  const maxCE = Math.max(0, target.res.maxCE);
  const dmg = base + scale * maxCE;
  const depth = Math.max(0, Math.min(1, maxCE / 100));
  return {
    dmg, depth,
    label: '捌 CLEAVE — MAX CE ' + Math.round(maxCE) + '%  ×' + (dmg / base).toFixed(2),
    toast: 'CLEAVE ' + Math.round(dmg) + ' (MAX CE ' + Math.round(maxCE) + ')'
  };
}

export function srcFor(key, slot) {
  if (key in EFFECT_SRC) return EFFECT_SRC[key];
  return SLOT_SRC[slot] ?? null;
}

export class Effects {
  constructor(match) {
    this.match = match;
    this.entities = [];
  }

  // techniques hit whoever the caster is currently closest to
  other(f) { return this.match.other(f); }

  // ---- URAUME AND RYU: THE THREE SHARED HELPERS --------------------------
  // A node this system put in the scene itself (rather than handing to
  // `fx.prop`) has to be taken out and disposed by this system. One helper, so
  // no entity teardown can leak a mesh — which across a long session is the
  // difference between a few hundred kilobytes and a few hundred megabytes.
  _disposeNode(node) {
    if (!node) return;
    node.removeFromParent();
    node.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }
  _killIceShard(e) { this._disposeNode(e.node); e.node = null; }

  // A thrown object hitting something. Shatters into debris the colour of what
  // it was, then disposes. Kept as one helper so no Reggie entity teardown can
  // leak a mesh — the same reason `_disposeNode` exists.
  _breakObject(e) {
    const m = this.match;
    const tint = { knife: 0xd8dee8, cone: 0xf2622a, wrench: 0xc44a2a, bottle: 0x4a8a5e }[e.jk] ?? 0xc8ccd4;
    for (let n = 0; n < 8; n++) {
      m.fx._spawn(e.pos.clone(), {
        color: n % 2 ? tint : 0xe8ecf2, size: rand(0.05, 0.15), aspect: 0.5,
        life: rand(0.2, 0.5), gravity: 16,
        vel: v3(rand(-4, 4), rand(0.5, 4), rand(-4, 4))
      });
    }
    m.sfx.hit?.(false);
    this._disposeNode(e.node);
    e.node = null;
  }

  // THE ICICLE RAIN. Canon, ch.135: "once immobilized, targets are finished
  // off by GIANT ICICLES that are sent down from above to skewer them." So an
  // Icefall shard that connects with somebody who is ALREADY frostbound calls
  // one down on them after a short delay.
  //
  // The delay is the whole reason it is fair: it lands ~0.34 s later, which is
  // long enough that a victim who shatters their shell and moves is not there
  // for it. Rewarding pressure on a standing shell, not punishing having been
  // shelled once.
  _iceFall(caster, victim, def) {
    if (!def || !victim?.alive) return;
    const m = this.match;
    const at = victim.pos.clone();
    const top = at.clone().add(v3(0, 7.5, 0));
    const node = m.fx.iceShardNode(2.2, 0.30);
    node.position.copy(top);
    node.rotation.z = Math.PI;                 // point DOWN
    m.fx.prop(node, def.delay + 0.18, (nd, k) => {
      const f = Math.min(1, k / (def.delay / (def.delay + 0.18)));
      nd.position.copy(top).lerp(at, f * f);   // accelerating fall
    });
    m.fx._ring(at.clone().setY(0.05), 0xa8dce8, { size: 0.3, growRate: 4, life: def.delay, flat: true });
    m.sfx.icicleFall?.();
    // resolved on a timer entity rather than a setTimeout, so it pauses with
    // the match clock, dies with the round, and is deterministic online
    this.entities.push({
      type: 'icicle', caster, t: def.delay, def,
      x: at.x, y: at.y, z: at.z
    });
  }

  // A blade of cursed steel swept through an arc in front of the caster —
  // real geometry, driven from the caster's own position so it tracks him for
  // the length of the swing. Used by the Split Soul Katana's two cuts.
  _sweepBlade(caster, len, big = false) {
    const m = this.match;
    const node = m.fx.soulBladeNode(len, big);
    const life = big ? 0.26 : 0.18;
    m.fx.prop(node, life, (n, k) => {
      const ang = caster.facing + (0.9 - 1.8 * k);      // right to left through the arc
      const p = caster.pos.clone().add(v3(0, 1.3 - k * 0.25, 0))
        .add(v3(Math.sin(ang) * len * 0.42, 0, Math.cos(ang) * len * 0.42));
      n.position.copy(p);
      n.rotation.set(0, ang + Math.PI / 2, -0.5 + k * 1.0);
      n.traverse(o => { if (o.material) o.material.opacity = Math.max(0, (o.material.opacity ?? 1) * (1 - k * 0.12)); });
    });
    return node;
  }

  // ---- MOVEMENT-STEERED CASTS ---------------------------------------------
  // The overhauled techniques ride the left stick: hold a direction while the
  // cast comes out and the wave / swarm / rupture goes THAT way instead of
  // straight ahead — the same read Jogo's and Hanami's eruptions already use
  // for their ground markers, promoted to a roster-wide signature. Neutral
  // falls back to facing, so a player who never learns it loses nothing.
  _castDir(caster) {
    const inp = this.match.inputFor?.(caster);
    const mv = inp?.move;
    if (mv && Math.hypot(mv.x, mv.z) > 0.25) {
      const d = caster._moveVec(mv);
      d.y = 0;
      if (d.lengthSq() > 0.001) return d.normalize();
    }
    return caster.forward();
  }

  // ---- AIMED-FROM-A-POINT CASTS -------------------------------------------
  // `_castDir` answers "which way is he pointing", which is right for anything
  // that leaves HIS body. It is wrong for anything that leaves somewhere else.
  //
  // Ino's horn is fired by the BEAST, which holds station 1.1 m off his
  // shoulder — so a horn launched from the creature and sent along his facing
  // travels a parallel line 1.1 m to the side of the target and misses at
  // every range. Measured: 0 damage from an eleven-metre HORN at eleven
  // metres, every time, which is the kind of miss that reads as "the move does
  // not work" rather than as "I aimed badly".
  //
  // So: if the player is STEERING, honour the steer exactly as `_castDir`
  // does — that is the roster-wide read and it must not be taken away. If the
  // stick is neutral, aim from the SPAWN POINT at the target. A neutral stick
  // has always meant "at them" for every other technique in the game; it just
  // happens that for everybody else "at them" and "along my facing" are the
  // same line, and for a creature standing beside him they are not.
  _aimDir(caster, from) {
    const inp = this.match.inputFor?.(caster);
    const mv = inp?.move;
    if (mv && Math.hypot(mv.x, mv.z) > 0.25) {
      const d = caster._moveVec(mv);
      d.y = 0;
      if (d.lengthSq() > 0.001) return d.normalize();
    }
    const t = this.other(caster);
    if (t?.alive) {
      const d = t.pos.clone().add(v3(0, t.hurtBox?.center ?? 1.1, 0)).sub(from);
      d.y = 0;
      if (d.lengthSq() > 0.001) return d.normalize();
    }
    return caster.forward();
  }

  // ---- KASHIMO: THE MAX-TIER DISCHARGE ------------------------------------
  // Called from the melee path (hits.js) on every CONFIRMED normal while he is
  // at tier 3, and from nowhere else. What it is NOT: a second hit on the
  // person he just punched. Doubling his own normals would make the top tier a
  // damage cliff rather than a property change, and the tier table already
  // multiplies his damage by 1.42 up there.
  //
  // What it IS: the blow EARTHS THROUGH the body it landed on and jumps to
  // anything else standing near it — which does nothing at all in a 1v1 and is
  // genuinely dangerous in a free-for-all or against a summoner with bodies on
  // the field. That is a property, not a number, and it is the version that
  // makes the top tier feel different rather than just bigger. `primary` is
  // excluded explicitly so the arc can never double-dip on the target.
  chargeDischarge(caster, primary) {
    const m = this.match;
    const at = primary.pos.clone().setY(1.15);
    const radius = 2.3 * chargeSize(caster);
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.2, radius * 0.6), rand(-0.5, 0.8), Math.sin(a) * rand(0.2, radius * 0.6))), {
        color: i % 3 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.08, 0.20), aspect: 0.3,
        life: rand(0.10, 0.22), vel: v3(Math.cos(a) * 4, rand(0.4, 2.2), Math.sin(a) * 4)
      });
    }
    m.fx._ring(at, 0xa46bff, { size: 0.25, growRate: radius * 5, life: 0.16, flat: false });
    for (const foe of m.activeFighters ?? []) {
      if (!foe || foe === caster || foe === primary || !foe.alive) continue;
      if (flatDist(foe.pos, primary.pos) > radius + (foe.hurtBox?.radius ?? 0.62)) continue;
      const { dmg } = computeDamage(caster, 3.0, { canCrit: false });
      const r = foe.applyHit({
        dmg, kb: 0.8, kbY: 0, hitstun: 10, type: 'light', attacker: caster,
        isCT: true, dir: caster.forward(), src: 'electric'
      }, m.ctxFor(caster));
      hitFeedback(m, caster, foe, r, {});
    }
  }

  // ---------------------------------------------------------------------------
  // INUMAKI — WHAT A WORD DOES WHEN IT ARRIVES
  // ---------------------------------------------------------------------------
  // Called from the SpeechFX arrival callback, one constrict-beat after the
  // glyphs reach the body. Everything about a command's consequence is in here
  // and nowhere else, so the timing of "the word has them, and THEN the thing
  // happens" is a property of the system rather than of seven call sites.
  //
  // THE THREE STATES A TARGET CAN BE IN THAT CHANGE THE ANSWER:
  //   BLOCKING      duration is cut (see BLOCK_DUR_MULT). Damage is NOT — a
  //                 command is not blockable in the conventional sense; guard
  //                 buys you your feet back sooner and nothing else.
  //   ALREADY DOWN  knockdown / launched / getup / ko. The three commands that
  //                 impose a POSTURE (root, flee, pull) are refused, exactly as
  //                 Yuta's domain root already refuses them, because taking a
  //                 body that is on the floor and standing it up to be marched
  //                 around is worse than doing nothing. The damaging commands
  //                 still land.
  //   RESISTING     the MAX_CE curve, applied inside `durationFor`.
  _speechLand(caster, t, cmd, { mult = 1, sure = false } = {}) {
    const m = this.match;
    if (!t?.alive) return;
    const blocked = t.state === 'block' || t.state === 'blockstun' || t.state === 'simpleDomain';
    const down = ['knockdown', 'launched', 'getup', 'ko', 'victory'].includes(t.state);
    // ---- ARMOR RESISTS BEING TOLD WHAT TO DO -----------------------------
    // The ruling, and it is one rule applied in one place:
    //
    //   ARMOR REFUSES THE THREE POSTURE COMMANDS (root, flee, pull) AND
    //   NOTHING ELSE.
    //
    // Armor in this game means "I do not flinch" — it is what carries Todo
    // through a jab, what Yuji's RESOLVE grants for one hit, what Panda's
    // Gorilla stance and Hanami's first swing are built on. Being rooted, or
    // marched across the arena, is flinching in the most literal sense
    // available, so a body that is currently refusing to flinch refuses it.
    //
    // The four DAMAGING commands land in full. Armor has never stopped damage
    // in this project — it stops the REACTION — and a version where Todo's
    // super-armor also made him immune to being crushed would be armor doing
    // something it does nowhere else.
    //
    // The consequence is a real and legible counterplay: the answer to being
    // commanded is to be mid-armor when the word arrives, which means timing a
    // committed move into an utterance rather than waiting it out. That is the
    // same answer those characters already give to everything else.
    const armored = (t.armorFrames > 0 || t.resolveArmor);
    // `src` is the command's own adaptation category — one per word.
    const hitOpts = {
      attacker: caster, isCT: true, sureHit: sure, otgOk: sure,
      dir: caster.forward(), src: adaptKey(cmd)
    };
    const dur = durationFor(caster, t, cmd, { blocked });
    const chestOf = f => f.pos.clone().setY(f.pos.y + (f.hurtBox?.center ?? 1.15));

    // THE SHAKE AND THE FLASH, scaled by the command's weight — DON'T MOVE is
    // a ripple, BLAST AWAY moves the whole frame.
    const heavy = cmd.weight === 'heavy';
    m.cam.shake(heavy ? 1.25 : 0.35);
    if (heavy) m.cam.fovKick(9);
    m.stage.flash(heavy ? 0.34 : 0.12);

    switch (cmd.effect) {
      // ---- DON'T MOVE 動くな ------------------------------------------------
      // No damage. The `rooted` state and the `rootT` clock are the ones that
      // have been in this project since Yuta's domain — REUSED, not
      // reimplemented, exactly as the brief asked. What is new is only the
      // number going into them: Yuta's rolls a flat duration, Inumaki's is
      // resistance-scaled. Nothing about Yuta's path is touched.
      case 'speech_root': {
        if (down) { m.hud.toast(t, 'ALREADY DOWN'); break; }
        if (armored) { m.hud.toast(t, 'ARMOR HOLDS'); m.sfx.armor(); break; }
        m.sfx.root();
        t.rootT = Math.max(t.rootT, dur);
        t.setState('rooted', { clip: 'stunned' });
        t.vel.x = t.vel.z = 0;
        m.speechfx?.cage(t, cmd, dur);
        m.hud.toast(t, 'ROOTED  ' + dur.toFixed(1) + 's');
        break;
      }

      // ---- COME HERE 来い ---------------------------------------------------
      // His only closer. Drags them along the line between the two bodies and
      // STOPS SHORT (see PULL_STOP), so it delivers them to punching range
      // rather than through him — which is also what makes it safe next to
      // every piece of level geometry on every map, because it never asks for
      // a destination that cannot be reached by walking.
      case 'speech_pull': {
        if (down) { m.hud.toast(t, 'ALREADY DOWN'); break; }
        if (armored) { m.hud.toast(t, 'ARMOR HOLDS'); m.sfx.armor(); break; }
        m.sfx.commandPull?.();
        m.speechfx?.arrow(t, cmd, caster.pos, false, dur);
        beginForced(t, 'pull', dur, 11.5, caster.pos);
        m.hud.toast(t, 'PULLED');
        break;
      }

      // ---- RUN AWAY 逃げろ --------------------------------------------------
      // No damage at all, and it is the most useful thing in his kit against
      // the characters he cannot survive standing next to.
      case 'speech_flee': {
        if (down) { m.hud.toast(t, 'ALREADY DOWN'); break; }
        if (armored) { m.hud.toast(t, 'ARMOR HOLDS'); m.sfx.armor(); break; }
        m.sfx.commandFlee?.();
        m.speechfx?.arrow(t, cmd, caster.pos, true, dur);
        // 6.8 m/s, not 9.0. Measured in a live match, the first pass carried
        // Gojo from 1.3 m to 9.9 m — nearly ten metres of travel, further than
        // his own dash, and it read less like "he made them back off" and more
        // like the opponent had been deleted and re-spawned across the arena.
        // At 6.8 over the shortened duration it is about six metres at zero
        // resistance and under four against a full meter, which is a
        // disengage rather than a relocation.
        beginForced(t, 'flee', dur, 6.8, caster.pos);
        m.hud.toast(t, 'FLEEING');
        break;
      }

      // ---- SLEEP 眠れ -------------------------------------------------------
      // A short stagger and then a long SLOW. Deliberately not a stun and
      // deliberately not Naoya's freeze: they keep every input for the whole
      // duration, they are simply wading. `sleepMult` is on `speedMult`, so it
      // slows their walk, their run and their dash together.
      case 'speech_sleep': {
        const dmg = damageFor(caster, cmd) * mult;
        const r = t.applyHit({
          ...hitOpts, dmg, kb: 0.4, kbY: 0, hitstun: cmd.staggerFrames ?? 20, type: 'light'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        m.sfx.commandSleep?.();
        t.sleepT = Math.max(t.sleepT, dur);
        t.sleepMult = Math.min(t.sleepMult, cmd.slowMult ?? 0.55);
        m.speechfx?.brand(t, cmd, dur);
        m.hud.toast(t, 'SLOWED  ' + dur.toFixed(1) + 's');
        break;
      }

      // ---- GET TWISTED 捻れ -------------------------------------------------
      // The command the brief missed, and the only DISARM in the game that
      // leaves the victim fully mobile. It twists the arm they hit with: real
      // damage, and then a third off everything they throw for four seconds.
      // On `dmgMult` (see combat/fighter.js) so it covers their whole kit.
      case 'speech_twist': {
        const dmg = damageFor(caster, cmd) * mult;
        const r = t.applyHit({
          ...hitOpts, dmg, kb: 1.0, kbY: 0, hitstun: 24, type: 'heavy'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        m.sfx.commandTwist?.();
        t.twisted = { t: dur, mult: cmd.dmgDebuff ?? 0.68 };
        m.speechfx?.brand(t, cmd, dur);
        m.hud.toast(t, 'TWISTED  -' + Math.round((1 - (cmd.dmgDebuff ?? 0.68)) * 100) + '% DMG');
        break;
      }

      // ---- GET CRUSHED 潰れろ -----------------------------------------------
      // A field of gravity that drives them into the ground — so the glyph
      // comes down ON them from above, and the knockback is almost nothing
      // because they are not going anywhere except down.
      case 'speech_crush': {
        m.speechfx?.slam(t, cmd);
        m.sfx.commandCrush?.();
        m.hitstop(12);
        const { dmg: d2, crit } = computeDamage(caster, damageFor(caster, cmd) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg: d2, kb: cmd.kb ?? 1.2, kbY: cmd.kbY ?? 0,
          hitstun: cmd.hitstun ?? 40, type: 'knockdown'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: true });
        m.fx._ring(t.pos.clone().setY(0.06), cmd.color, { size: 0.5, growRate: 12, life: 0.45 });
        m.arena?.destruct?.damageAt(t.pos.clone().setY(0.4), 1.8, 30);
        break;
      }

      // ---- BLAST AWAY 吹き飛べ ----------------------------------------------
      // His hardest word: the biggest single number he has and the largest
      // knockback in his kit by a factor of ten. The word DETONATES outward
      // through the body rather than shattering, which is the visual
      // difference between this and everything else he says.
      case 'speech_blast': {
        m.speechfx?.detonate(t, cmd, 3.2);
        m.sfx.commandBlast?.();
        m.hitstop(16);
        m.cam.fovKick(14);
        const dir = t.pos.clone().sub(caster.pos).setY(0);
        if (dir.lengthSq() < 1e-4) dir.copy(caster.forward());
        dir.normalize();
        const { dmg: d2, crit } = computeDamage(caster, damageFor(caster, cmd) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg: d2, kb: cmd.kb ?? 14, kbY: cmd.kbY ?? 5.2,
          hitstun: cmd.hitstun ?? 46, type: 'knockdown', dir
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: true });
        m.arena?.destruct?.damageAt(chestOf(t), 2.6, cmd.destruct ?? 40);
        break;
      }
    }
  }

  // direct application of a technique by key — used by CT casts, Yuta's Copy,
  // domain sword grabs, and the AML sure-hit (with sureHit: true).
  applyTechnique(caster, key, opts = {}) {
    const m = this.match;
    const t = this.other(caster);
    const mult = opts.powerMult ?? 1;
    const sure = !!opts.sureHit;
    // `src` rides on every hit this dispatcher produces — see EFFECT_SRC.
    // A caller may force one (the domain payloads do) via opts.src.
    const src = opts.src ?? srcFor(key, opts.slot);
    const hitOpts = { attacker: caster, isCT: true, sureHit: sure, otgOk: sure, dir: caster.forward(), src };

    switch (key) {
      // =====================================================================
      // REGGIE STAR — 再契象 CONTRACTUAL RE-CREATION
      // =====================================================================
      // NINE CASES, and every one of them opens with `burnFX`. That is not
      // decoration and it is not optional: it is the only thing in the picture
      // that says where a car came from, and a materialisation without it
      // reads as an object teleporting in. It runs UNDER the move rather than
      // in front of it — nothing below waits for it — so it costs no frames.
      //
      // NOTHING HERE SPENDS STOCK. The stock is committed on the PRESS, in
      // `Fighter.startCT`, so an interrupted materialisation has still cost
      // him the paper. The one exception is Yuta's Copy, which reaches these
      // cases with no `cfg.receipts` at all and therefore pays nothing — see
      // `canAfford`, which returns true for a fighter who has no stock system.

      // ---- RB · QUICK MATERIALISE 速契 -----------------------------------
      // The roll is DECORATION. All four junk entries share this one case and
      // this one set of numbers; the only thing the roll decides is which mesh
      // flies and which noise it makes. See the note on JUNK_TABLE in
      // characters/reggie.js for why a random neutral tool would be a bad one.
      case 'reggie_junk': {
        const def = opts.def ?? caster.cfg.ct1;
        const hand = caster.model?.getBone?.('HandL');
        const at = caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(caster.forward(), 0.35);
        burnFX(m, at, { scale: 0.7 });
        const junkKeys = caster.cfg.objects?.junk ?? ['cone'];
        const jk = junkKeys[Math.floor(Math.random() * junkKeys.length)];
        const node = buildJunk(jk);
        m.root.add(node);
        const dir = this._castDir(caster);
        m.sfx.throwLight?.();
        this.entities.push({
          type: 'reggieThrow', caster, node, jk,
          pos: at.clone(), dir, spd: def.speed ?? 26, range: def.range ?? 9.5,
          travelled: 0, radius: def.radius ?? 0.55,
          dmg: (def.dmg ?? 11) * mult, kb: def.kb ?? 2.4, kbY: def.kbY ?? 0.3,
          hitstun: def.hitstun ?? 18, destruct: def.destruct ?? 8,
          spin: rand(9, 16), src: 'reggie_junk', hitOpts, dealt: false, heavy: false
        });
        break;
      }

      // ---- LADDER — THE REACH --------------------------------------------
      // Not a projectile. A real 4.2 m arc swung from his own position, three
      // times, resolved as three separate hits. It is the only melee hitbox in
      // the game longer than Sukuna's Cleave and it is the only reason anyone
      // ever stands still in front of him.
      case 'reggie_ladder': {
        const def = opts.def ?? caster.cfg.objects.defs.ladder;
        const at = caster.pos.clone().add(v3(0, 1.0, 0)).addScaledVector(caster.forward(), 0.5);
        burnFX(m, at, { scale: 1.4, up: 0.9 });
        const node = buildLadder(def.reach ?? 4.2);
        m.root.add(node);
        m.sfx.swing?.(true);
        this.entities.push({
          type: 'reggieLadder', caster, node, def,
          t: 0, swing: 0, swings: def.swings ?? 3, mult, hitOpts,
          hitThis: false, span: 0.30
        });
        break;
      }

      // ---- GAS CANISTER — THE SCREEN --------------------------------------
      // The only technique in this game that attacks the CAMERA rather than
      // the body. It plants a cloud that follows nobody, does five damage
      // once, and for two and a half seconds anybody inside it cannot see out
      // of it — `occlude` is read by core/stage.js's fog term for the fighter
      // standing in it, and by the CPU's own sight test.
      case 'reggie_gas': {
        const def = opts.def ?? caster.cfg.objects.defs.canister;
        const at = caster.pos.clone().add(v3(0, 0.6, 0)).addScaledVector(caster.forward(), 0.6);
        burnFX(m, at, { scale: 0.9 });
        const dir = this._castDir(caster);
        const node = buildObject('canister');
        m.root.add(node);
        m.sfx.throwHeavy?.();
        this.entities.push({
          type: 'reggieGas', caster, node, def, mult, hitOpts,
          pos: at.clone(), dir, vel: dir.clone().multiplyScalar(def.travel ?? 5.5).add(v3(0, 3.2, 0)),
          phase: 'flight', t: 0, dealt: false
        });
        break;
      }

      // ---- DRONE — THE ONE THAT STAYS -------------------------------------
      // Handed straight to combat/receipts.js, because it is a BODY with
      // health and pathing rather than a travelling technique — the seventh
      // ally family on the field. Everything about its behaviour is there.
      case 'reggie_drone': {
        const def = opts.def ?? caster.cfg.objects.defs.drone;
        const at = caster.pos.clone().add(v3(0, 1.5, 0)).addScaledVector(caster.forward(), 0.7);
        burnFX(m, at, { scale: 0.9, up: 0.8 });
        m.receipts?.spawnDrone(caster, { ...def, dmg: (def.dmg ?? 7) * mult });
        m.sfx.summon?.();
        break;
      }

      // ---- FISHING ROD — THE GRAPPLE --------------------------------------
      // *** WHICH BODY MOVES IS DECIDED BY MASS, AND IT IS NOT A SPECIAL
      // CASE. *** The hook pulls with a fixed impulse; whether that moves the
      // target or moves HIM is `kbResist`, the stat every heavyweight in the
      // game already carries. Against Nobara he reels her in; against Todo,
      // Panda, Yuki, Hanami, Kurourushi, Dagon and Mahoraga he is reeled in,
      // which is both funnier and more useful, because arriving next to Todo
      // with a punch string ready is exactly what a Reggie wants.
      case 'reggie_rod': {
        const def = opts.def ?? caster.cfg.objects.defs.rod;
        const at = caster.pos.clone().add(v3(0, 1.2, 0)).addScaledVector(caster.forward(), 0.5);
        burnFX(m, at, { scale: 1.0 });
        const rod = buildObject('rod');
        const hook = buildHook();
        m.root.add(rod); m.root.add(hook);
        m.sfx.chain?.() ?? m.sfx.swing?.(false);
        this.entities.push({
          type: 'reggieHook', caster, rod, hook, def, mult, hitOpts,
          pos: at.clone(), dir: this._castDir(caster), origin: at.clone(),
          travelled: 0, phase: 'out', dealt: false
        });
        break;
      }

      // ---- MOPED — THE CHARGE ---------------------------------------------
      // Drives itself down a stick-steered lane and KEEPS GOING through the
      // first thing it hits, which is what makes it his answer to a wake-up.
      case 'reggie_moped': {
        const def = opts.def ?? caster.cfg.objects.defs.moped;
        const at = caster.pos.clone().addScaledVector(caster.forward(), 1.0);
        at.y = m.arena?.bounds?.floorAt(at.x, at.z, caster.pos.y + 0.6) ?? 0;
        burnFX(m, at.clone().add(v3(0, 1.0, 0)), { scale: 1.3, up: 0.9 });
        const node = buildObject('moped');
        m.root.add(node);
        m.sfx.dash?.();
        this.entities.push({
          type: 'reggieVehicle', caster, node, def, mult, hitOpts,
          pos: at.clone(), dir: this._castDir(caster), travelled: 0,
          hit: new Set(), src: 'reggie_moped', big: false, wheelSpin: 0
        });
        break;
      }

      // ---- VENDING MACHINE — THE TRAP --------------------------------------
      // A marker, then 0.62 s, then a machine. It hits WHERE IT WAS AIMED
      // rather than where the victim now is, which is the same grammar Jogo's
      // eruption marker, Hanami's root marker and Uraume's icicle already use,
      // and it is what makes walking out of it a real answer.
      case 'reggie_vending': {
        const def = opts.def ?? caster.cfg.objects.defs.vending;
        const tgt = t?.alive ? t : null;
        const aim = tgt ? tgt.pos.clone() : caster.pos.clone().addScaledVector(caster.forward(), 5);
        // clamped to his own reach, so it is not a full-screen drop
        const away = aim.clone().sub(caster.pos).setY(0);
        if (away.length() > (def.aimRange ?? 9)) {
          aim.copy(caster.pos).addScaledVector(away.normalize(), def.aimRange ?? 9);
        }
        aim.y = m.arena?.bounds?.floorAt(aim.x, aim.z, (tgt?.pos.y ?? caster.pos.y) + 0.6) ?? 0;
        burnFX(m, caster.pos.clone().add(v3(0, 2.0, 0)), { scale: 1.6, up: 1.2 });
        m.fx._ring(aim.clone().setY(aim.y + 0.05), 0xc4322a, { size: def.radius ?? 1.9, growRate: 0, life: def.markTime ?? 0.62, flat: true });
        const node = buildObject('vending');
        node.position.copy(aim).add(v3(0, 9.0, 0));
        m.root.add(node);
        m.sfx.warning?.() ?? m.sfx.summon?.();
        this.entities.push({
          type: 'reggieDrop', caster, node, def, mult, hitOpts,
          at: aim.clone(), t: def.markTime ?? 0.62, total: def.markTime ?? 0.62
        });
        break;
      }

      // ---- CAR — HALF HIS STOCK ---------------------------------------------
      // Same entity as the moped at a different scale, which is deliberate: the
      // two are the same IDEA (a vehicle going down a lane) at opposite ends of
      // the price list, and building them as one thing means they can never
      // drift apart mechanically while the animation and the numbers do all the
      // work of making them feel different.
      case 'reggie_car': {
        const def = opts.def ?? caster.cfg.objects.defs.car;
        const at = caster.pos.clone().addScaledVector(caster.forward(), 1.6);
        at.y = m.arena?.bounds?.floorAt(at.x, at.z, caster.pos.y + 0.6) ?? 0;
        burnFX(m, caster.pos.clone().add(v3(0, 1.4, 0)), { scale: 2.0, up: 1.4 });
        const node = buildObject('car');
        m.root.add(node);
        m.sfx.heavyImpact?.() ?? m.sfx.dash?.();
        m.cam.shake(0.3);
        this.entities.push({
          type: 'reggieVehicle', caster, node, def, mult, hitOpts,
          pos: at.clone(), dir: this._castDir(caster), travelled: 0,
          hit: new Set(), src: 'reggie_car', big: true, wheelSpin: 0
        });
        break;
      }

      // ---- D-pad RIGHT · CLEARING THE REGISTER 全契焼却 --------------------
      // He burns the whole stock and throws everything at once. `burnEverything`
      // zeroes the stock, sets the six-second regeneration halt, and hands back
      // WHAT HE SPENT — which is what the damage scales off, so a Reggie who
      // banked before pressing it gets paid for that and a Reggie who dumped
      // his stock on a car first does not.
      case 'reggie_register': {
        const u = caster.cfg.ultimate;
        const spent = burnEverything(caster);
        const total = u.baseDmg + spent * u.dmgPerStock;
        const shots = Math.max(4, Math.round(u.duration * u.rate));
        // the finale object, chosen by what he actually had
        let finale = 'drone';
        for (const [need, k] of u.finale) { if (spent >= need) { finale = k; break; } }
        m.cam.shake(0.5);
        m.sfx.ultimate?.();
        this.entities.push({
          type: 'reggieBarrage', caster, u, mult,
          t: 0, fired: 0, shots, perShot: total / shots,
          interval: u.duration / shots, next: 0, finale, spent, hitOpts
        });
        caster.emit('registerCleared', { spent, finale });
        break;
      }

      // =====================================================================
      // TAKUMA INO — 来訪瑞獣 THE AUSPICIOUS BEASTS
      // =====================================================================
      // Six cases across three beasts, and every one of them is authored so
      // that THE BEAST DOES IT AND HE DOES NOT. His own animation in each is
      // small — he points, he crouches, he braces — and the geometry that
      // travels comes off the creature's position rather than his. That is the
      // whole read of "medium, not fighter", and it is why `beastOf` is the
      // first line of most of these.

      // ---- 獬豸 KAICHI · RB — THE HORN ------------------------------------
      // A straight fast projectile launched FROM THE BEAST'S HORN. Ordinary in
      // every way, and it is meant to be: it is the neutral tool that makes
      // the ranged beast a ranged beast, and the unmissable one below is what
      // it sets up.
      case 'ino_horn': {
        const def = opts.def ?? caster._def('ct1');
        const beast = m.beasts?.beastOf(caster);
        const from = beast
          ? beast.pos.clone().add(v3(0, 1.5, 0)).addScaledVector(caster.forward(), 0.6)
          : caster.pos.clone().add(v3(0, 1.4, 0)).addScaledVector(caster.forward(), 0.7);
        const node = m.fx.hornNode(def.radius ?? 0.72, 0x6ea8ff);
        m.root.add(node);
        m.sfx.projectile?.() ?? m.sfx.swing?.(false);
        if (beast) beast.strikeAnim = 1;
        this.entities.push({
          type: 'inoHorn', caster, node, def,
          pos: from, dir: this._aimDir(caster, from), spd: def.speed ?? 24,
          range: def.range ?? 15, travelled: 0, radius: def.radius ?? 0.72,
          dmg: (def.dmg ?? 17) * mult, homing: false, life: 99,
          src: def.src ?? 'ino_kaichi', hitOpts, dealt: false
        });
        break;
      }

      // ---- 獬豸 KAICHI · RT — THE JUDGEMENT HORN --------------------------
      // *** IT DOES NOT MISS. *** Canon is unambiguous: the horn "will not stop
      // until it hits the desired target". This game has exactly one other
      // thing that cannot be dodged — a domain's sure-hit — so it is priced
      // like one: 34 frames of wind-up with the beast visibly rearing, 38 of a
      // 100 bar, and a 30-frame recovery.
      //
      // *** IT IS NOT A `sureHit`. *** That flag bypasses BLOCKING as well, and
      // blocking is the counterplay this move is supposed to have. What it is
      // instead is a hard-homing entity with a 2.6 s life and a 6.5 rad/s turn
      // rate: it follows you round the arena and it lands, and you can guard
      // it, hit Ino out of the wind-up, or interpose something. It is
      // undodgeable, not unanswerable, and those are different words.
      case 'ino_judgehorn': {
        const def = opts.def ?? caster._def('ct2');
        const beast = m.beasts?.beastOf(caster);
        const from = beast
          ? beast.pos.clone().add(v3(0, 1.7, 0)).addScaledVector(caster.forward(), 0.7)
          : caster.pos.clone().add(v3(0, 1.5, 0)).addScaledVector(caster.forward(), 0.8);
        const node = m.fx.hornNode(def.radius ?? 0.85, 0x6ea8ff, true);
        m.root.add(node);
        m.sfx.charge?.() ?? m.sfx.projectile?.();
        m.cam.shake(0.2);
        if (beast) beast.strikeAnim = 1;
        this.entities.push({
          type: 'inoHorn', caster, node, def,
          pos: from, dir: this._aimDir(caster, from), spd: def.speed ?? 19,
          range: def.range ?? 22, travelled: 0, radius: def.radius ?? 0.85,
          dmg: (def.dmg ?? 30) * mult, homing: true, turn: def.turn ?? 6.5,
          life: def.life ?? 2.6, src: def.src ?? 'ino_kaichi', hitOpts, dealt: false
        });
        break;
      }

      // ---- 霊亀 REIKI · RB — THE GLIDE ------------------------------------
      // Canon: the turtle's cursed water lets him "glide across surfaces,
      // reducing friction and increasing his mobility". So this is a TRAVEL
      // move that happens to hurt, rather than an attack that happens to move:
      // 9.5 m on the water with 8 invulnerable frames, and the shoulder at the
      // end is almost incidental.
      //
      // *** THE HIT CARRIES `src: 'ino_reiki'`, WHICH IS WATER. *** See
      // WET_SOURCES in combat/receipts.js — landing this on Reggie soaks his
      // tags and turns his technique off for 3.2 seconds. Two independent
      // pieces of research produced that and it is the best matchup either
      // character has.
      case 'ino_glide': {
        const def = opts.def ?? caster._def('ct1');
        const dir = this._castDir(caster);
        caster.iFrames = Math.max(caster.iFrames ?? 0, def.iFrames ?? 8);
        m.sfx.dash?.();
        this.entities.push({
          type: 'inoGlide', caster, def, mult, hitOpts,
          dir, travelled: 0, dealt: false
        });
        break;
      }

      // ---- 霊亀 REIKI · RT — THE SHELL ------------------------------------
      // The water comes UP. 1.6 s of heavy armour and a shove when it breaks —
      // the defensive half of the same canon sentence. It is his only way to
      // sit still and win an exchange, and it is on the beast that otherwise
      // cannot win one at all.
      case 'ino_shell': {
        const def = opts.def ?? caster._def('ct2');
        const beast = m.beasts?.beastOf(caster);
        caster.armorFrames = Math.max(caster.armorFrames ?? 0, def.armorFrames ?? 96);
        // `incomingMult` is a GETTER on Fighter — assigning to it does nothing.
        // The shell rides its own buff field, which the getter multiplies in,
        // the same shape `soulSplit` already uses.
        caster.shell = { t: def.duration ?? 1.6, mult: def.incoming ?? 0.55 };
        if (beast) beast.strikeAnim = 1;
        m.sfx.guard?.() ?? m.sfx.hit?.(false);
        this.entities.push({
          type: 'inoShell', caster, def, mult, hitOpts,
          t: def.duration ?? 1.6, burst: false
        });
        break;
      }

      // ---- 麒麟 KIRIN · RB — THE HORN RUSH ---------------------------------
      // Head down behind the qilin's horn, 7.6 m, and he does not stop. 20
      // armour frames, which on a beast that already ignores hitstun means the
      // opponent's answer is to not be there.
      case 'ino_hornrush': {
        const def = opts.def ?? caster._def('ct1');
        const beast = m.beasts?.beastOf(caster);
        if (beast) beast.strikeAnim = 1;
        caster.armorFrames = Math.max(caster.armorFrames ?? 0, def.armorFrames ?? 20);
        m.sfx.dash?.();
        this.entities.push({
          type: 'inoRush', caster, def, mult, hitOpts,
          dir: this._castDir(caster), travelled: 0, hit: new Set()
        });
        break;
      }

      // ---- 麒麟 KIRIN · RT — THE DOPING STRIKE ------------------------------
      // *** HE TAKES THE HIT ON PURPOSE. *** 26 armour frames with his chest
      // deliberately open (see the hold in `ct2Kir`), and because the beast has
      // switched his pain off he scores the trade. `selfDmg` is the honest
      // price: it costs him 6 whether or not he was actually hit, which is what
      // "intracerebral doping" should feel like from the inside.
      case 'ino_doping': {
        const def = opts.def ?? caster._def('ct2');
        const beast = m.beasts?.beastOf(caster);
        if (beast) beast.strikeAnim = 1;
        caster.armorFrames = Math.max(caster.armorFrames ?? 0, def.armorFrames ?? 26);
        if (def.selfDmg) caster.res.hp = Math.max(1, caster.res.hp - def.selfDmg);
        m.hitstop(10);
        m.cam.shake(0.4);
        m.sfx.heavyImpact?.() ?? m.sfx.hit?.(true);
        const at = caster.pos.clone().addScaledVector(caster.forward(), 1.2).setY(1.2);
        m.fx._ring(at, 0xffc24a, { size: 0.6, growRate: 10, life: 0.3, flat: false });
        m.arena?.destruct?.damageAt(at, 2.0, def.destruct ?? 46);
        if (t?.alive && inArc(caster, t, (def.reach ?? 2.3) + (t.hurtBox?.pad ?? 0), 1.2)) {
          const { dmg, crit } = computeDamage(caster, (def.dmg ?? 34) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
            type: def.type ?? 'knockdown', dir: caster.forward(), src: def.src ?? 'ino_kirin'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: true });
        }
        break;
      }

      // ---- D-pad RIGHT · 龍 THE DRAGON --------------------------------------
      // The beast he never got to use. `duration` seconds in the `ryu` stance —
      // every beast's best attribute at once — with the DRAGON on the field and
      // the other three orbiting him.
      //
      // The cast itself does a pass: the dragon surges out of his hands and
      // down the lane, which is the one description canon gives ("manifests a
      // serpentine dragon that surges from his hands into the enemy").
      case 'ino_dragon': {
        const u = caster.cfg.ultimate;
        m.cam.shake(0.8);
        m.hitstop(18);
        m.sfx.ultimate?.();
        // the mask goes ALL the way down and stays there for the window
        caster.model?.setMask?.(1);
        // remember what he was wearing, so the window ENDS back where it began
        caster._preDragonStance = caster.stance;
        caster._setStance('ryu');
        m.beasts?.manifest(caster, 'ryu');
        caster.dragonT = u.duration;
        caster.emit('dragon', { duration: u.duration });
        // and the cast's own pass down the lane
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'inoDragonPass', caster, u, mult, hitOpts,
          pos: caster.pos.clone().add(v3(0, 1.4, 0)).addScaledVector(dir, 1.2),
          dir, travelled: 0, hit: new Set()
        });
        break;
      }

      // =====================================================================
      // INUMAKI — CURSED SPEECH 呪言
      // =====================================================================
      // ONE cast key for all seven commands, and one resolver for all seven
      // payloads. Adding a command is an entry in the table in
      // characters/inumaki.js plus a case in `_speechPayload` — nothing here
      // knows any command by name.
      //
      // THE ORDER OF OPERATIONS MATTERS AND IS THE WHOLE MOVE:
      //
      //   1. This case runs on the LAST FRAME OF THE UTTERANCE. Reaching it at
      //      all means he was not interrupted, so this is where the throat is
      //      charged and where `utter.fired` is set (which is what tells
      //      `checkUtterance` not to charge him the interruption penalty on
      //      top).
      //   2. The overlay and the audio fire IMMEDIATELY — the word has been
      //      said, whatever happens to it afterwards.
      //   3. The glyphs are launched, and the PAYLOAD IS A CALLBACK. It does
      //      not run here. It runs when the kanji arrive and finish
      //      constricting around the target, roughly a sixth of a second
      //      later, which is the half-beat of "the word has them" the whole
      //      effect is built around.
      //   4. If nobody is in range the word still flies, and dissipates. It
      //      cost him the same throat. A command is not free to whiff.
      case 'inumaki_command': {
        const cmd = caster.cfg.commands.defs[opts.commandKey ?? caster.utter?.key];
        if (!cmd) break;
        // 1 — the price, paid on the frame the word actually leaves his mouth
        if (caster.utter) caster.utter.fired = true;
        spendThroat(caster, cmd.throat);
        const tier = caster.throatTier;
        // 2 — the card and the voice
        m.commandCard?.show(cmd, tier);
        m.sfx.command?.(cmd.weight, tier);
        m.cam.shake(cmd.weight === 'heavy' ? 0.55 : 0.22);
        // the directional shockwave along the command's path: a ring pushed
        // out of his mouth in the direction he is speaking
        const fw = caster.forward();
        m.fx._ring(
          caster.pos.clone().setY(caster.pos.y + 1.45).addScaledVector(fw, 0.45),
          cmd.color, { size: 0.3, growRate: cmd.weight === 'heavy' ? 16 : 9, life: 0.3, flat: false });

        // 3 — who it is aimed at, and whether it reaches
        const reached = t && inCommandRange(caster, t, cmd);
        if (!reached) {
          // THE WHIFF. The glyphs fly out to the limit of his range and come
          // apart on nothing. Deliberately given the full flight and shatter
          // rather than being swallowed: a player has to be able to SEE that
          // the word went out and found nobody, or a mistimed command reads as
          // a dropped input.
          m.speechfx?.speakInto(caster, cmd, cmd.range);
          m.hud.toast(caster, cmd.short + ' — OUT OF RANGE');
          break;
        }
        // the target is TOLD a word is coming, on their own plate, at the
        // instant it is said — this is the reaction window and it has to be
        // readable from the HUD as well as from his body
        m.hud.toast(t, cmd.jp + '  ' + cmd.short);
        m.speechfx?.speak(caster, t, cmd, {
          scale: cmd.weight === 'heavy' ? 1.05 : 0.78,
          onArrive: () => this._speechLand(caster, t, cmd, { mult, sure })
        });
        break;
      }

      // ---- D-pad Right — EXPLODE 爆ぜろ -------------------------------------
      // The strongest word he is shown using, and it is its own confirmed
      // command rather than a bigger Blast Away. Three things happen that no
      // other command does:
      //
      //   · it is a RADIUS, not a target. Everyone inside `radius` of the
      //     victim is caught, which is the only AoE in his kit and the reason
      //     it is worth a full bar in a free-for-all.
      //   · the forced state that follows is applied at FULL LENGTH, ignoring
      //     the strain tier — he is not saying this word carefully.
      //     Resistance still applies, because resistance is the opponent and
      //     not him.
      //   · HE SPENDS HIS VOICE. `spendVoice` sets the round-long latch. There
      //     is no recovery from it and no second one.
      case 'inumaki_explode': {
        const u = caster.cfg.ultimate;
        const cmd = {
          key: 'explode', short: 'EXPLODE', name: 'EXPLODE', jp: u.jpName,
          romaji: 'HAZERO', kanji: u.kanji, color: u.color, weight: 'heavy',
          range: 16, dur: u.dur
        };
        // the price, and it is the whole voice
        if (caster.utter) caster.utter.fired = true;
        m.commandCard?.show(cmd, 0);
        m.sfx.explodeCommand?.();
        m.stage.flash(0.9);
        m.cam.shake(1.6); m.cam.fovKick(16);
        m.hud.cutin(caster, 'CURSED SPEECH', u.jpName + '  ' + u.name);
        const centre = t ?? caster;
        m.speechfx?.speak(caster, centre, cmd, {
          scale: 1.15,
          onArrive: () => {
            m.stage.flash(1.0);
            m.cam.shake(2.2); m.cam.fovKick(22);
            m.hitstop(16);
            m.speechfx?.detonate(centre, cmd, u.radius);
            m.arena?.destruct?.damageAt(centre.pos.clone().setY(1.0), u.radius, u.destruct ?? 90);
            for (const f of m.activeFighters) {
              if (f === caster || !f.alive) continue;
              if (flatDist(f.pos, centre.pos) > u.radius + (f.hurtBox?.radius ?? 0.62)) continue;
              const dir = f.pos.clone().sub(centre.pos).setY(0);
              if (dir.lengthSq() < 1e-4) dir.copy(caster.forward());
              dir.normalize();
              const { dmg, crit } = computeDamage(caster, u.dmg * mult);
              const r = f.applyHit({
                ...hitOpts, dmg, kb: u.kb, kbY: u.kbY, hitstun: u.hitstun,
                type: 'knockdown', dir, src: 'ultimate'
              }, m.ctxFor(caster));
              hitFeedback(m, caster, f, r, { crit, heavy: true, knockdown: true });
              // ...and whatever is left of them is rooted where they land.
              // NOT tier-scaled: he is not being careful with this one.
              if (r === 'hit' || r === 'otg' || r === 'block') {
                const d = (u.dur ?? 2.2) * (1 - resistOf(f));
                f.rootT = Math.max(f.rootT, d);
              }
            }
          }
        });
        // the latch, set on the CAST frame rather than on arrival, so an
        // Explode that is somehow interrupted between the two still costs him
        // the voice. He said it; that is the part that ruins a throat.
        spendVoice(caster);
        caster.model.setStrain?.(3, 1);
        m.hud.toast(caster, '失声 — VOICE SPENT');
        break;
      }

      // =====================================================================
      // GETO — CURSED SPIRIT MANIPULATION
      // =====================================================================
      // Both summon buttons resolve the same way: the CE was already spent and
      // the curse key already chosen in Fighter.startCurseSummon, so all that
      // happens on the activation frame is that a body arrives. Neither has a
      // hitbox of its own — Geto never hits anybody with a summon, which is the
      // whole design.
      case 'geto_summon_low':
      case 'geto_summon_special': {
        const key = opts.curse;
        if (!key) break;
        m.curses.summon(caster, key);
        break;
      }

      // REABSORB — pull the most valuable body home and get part of the cost
      // back. Handled entirely by the system (which owns the refund curve);
      // this branch is the feedback.
      case 'geto_reabsorb': {
        const r = m.curses.reabsorb(caster);
        if (!r) { m.hud.toast(caster, 'NOTHING TO RECALL'); break; }
        m.sfx.curseRecall?.();
        // the pull-in read: motes converging on his open hand
        const hand = caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(caster.forward(), 0.5);
        for (let i = 0; i < 18; i++) {
          const a = rand(0, Math.PI * 2), rr = rand(1.4, 3.4);
          m.fx._spawn(hand.clone().add(v3(Math.cos(a) * rr, rand(-0.6, 0.8), Math.sin(a) * rr)), {
            color: i % 3 === 0 ? 0xa878e0 : 0x140b1e, size: rand(0.12, 0.30), life: 0.3,
            vel: v3(-Math.cos(a) * rr * 3, 0, -Math.sin(a) * rr * 3)
          });
        }
        m.fx._ring(hand, 0xa878e0, { size: 1.2, growRate: -3.4, life: 0.35, flat: false });
        m.hud.toast(caster, '+' + Math.round(r.refund) + ' CE');
        break;
      }

      // ---- MAXIMUM: UZUMAKI 極ノ番・うずまき --------------------------------
      // Everything he is still holding, compressed into one sphere and fired.
      //
      // THE ORDER OF THE THREE LINES BELOW IS LOAD-BEARING. The damage is read
      // FIRST, from the stable as it stands; the stable is consumed SECOND; the
      // beam resolves THIRD. Consuming first would read a stable of zero and
      // fire the floor value every time — which is exactly the bug this
      // ordering exists to not have.
      case 'geto_uzumaki': {
        const dmg0 = m.curses.uzumakiDamage(caster);
        const spent = m.curses.consumeStable(caster);

        const fw = caster.forward();
        const origin = caster.pos.clone().setY(1.35);
        m.sfx.uzumaki?.();
        m.stage.flash(1);
        m.cam.shake(1.2); m.cam.fovKick(14);
        m.hitstop(10);

        // THE SPHERE, then THE BEAM. The sphere's size is the stable size, so
        // a full-stable Uzumaki visibly dwarfs a depleted one before it has
        // dealt a single point of damage — the projected number on the HUD is
        // the promise and this is the payoff, and they have to agree.
        const scale = 0.5 + spent.weight / 20 * 1.6;
        for (let i = 0; i < 40; i++) {
          const a = rand(0, Math.PI * 2), rr = rand(0.6, 2.6) * scale;
          m.fx._spawn(origin.clone().add(v3(Math.cos(a) * rr, rand(-1, 1.4) * scale, Math.sin(a) * rr)), {
            color: i % 4 === 0 ? 0xd8a8ff : 0x6b2fa0, size: rand(0.18, 0.5) * scale, life: rand(0.2, 0.4),
            vel: v3(-Math.cos(a) * rr * 4, 0, -Math.sin(a) * rr * 4)
          });
        }
        const range = opts.range ?? 24, width = (opts.width ?? 3.4) * (0.55 + scale * 0.4);
        for (let i = 1; i <= 30; i++) {
          const p = origin.clone().addScaledVector(fw, i * (range / 30));
          m.fx._spawn(p.clone().add(v3(rand(-1, 1) * width * 0.4, rand(-1, 1) * width * 0.4, rand(-1, 1) * width * 0.4)), {
            color: i % 3 === 0 ? 0xd8a8ff : 0x6b2fa0, size: rand(0.3, 0.9) * scale, life: rand(0.25, 0.5),
            vel: fw.clone().multiplyScalar(rand(6, 16))
          });
          m.arena?.destruct?.damageAt(p, width * 0.7, opts.destruct ?? 60);
        }
        m.fx._ring(origin, 0xd8a8ff, { size: 0.6, growRate: 16, life: 0.5, flat: false });

        // the hit: a screen-crossing line, same geometry Hollow Purple uses
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * fw.x + rel.z * fw.z;
        const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
        if (sure || (along > -0.5 && along < range && perp < width * 0.5 + 0.5)) {
          const { dmg } = computeDamage(caster, dmg0 * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 9, kbY: opts.kbY ?? 3,
            hitstun: opts.hitstun ?? 46, type: 'knockdown'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        // it also erases every summon on the field that is not his — the beam
        // does not care what is standing in it
        m.curses.hurtOtherSummonsAt(
          caster.pos.clone().addScaledVector(fw, range * 0.5), range * 0.5, dmg0 * 0.5, caster);

        m.hud.toast(caster, spent.total
          ? 'UZUMAKI — ' + spent.total + ' CURSES SPENT'
          : 'UZUMAKI — NOTHING LEFT');
        caster.emit('uzumaki', { spent, dmg: dmg0 });
        break;
      }

      // YUTA'S COPY of Geto: one low-grade curse on loan. It is summoned into
      // YUTA'S ownership, so it counts against nothing of Geto's and losing it
      // costs Geto nothing at all — the same per-owner rule the copied Divine
      // Dog already plays by.
      case 'geto_copy_low': {
        m.curses.summonBorrowedLow?.(caster, { dmg: opts.dmg ?? 5 });
        break;
      }

      // =====================================================================
      // NAOYA — PROJECTION SORCERY
      // =====================================================================
      // PROJECTION RUSH. Six discrete positions at 1/24 s apart, a strike at
      // each, ending BEHIND the opponent.
      //
      // Everything here is authored to avoid interpolation. He is teleported to
      // each position (`pos.copy`, not a lerp), an afterimage is left standing
      // at each, and the six strikes are queued as an entity that fires one per
      // 1/24 s rather than as a single multi-hit window — so the damage arrives
      // on the same grid the visuals do.
      // PROJECTION CASCADE. NOT A FLURRY OF PUNCHES — he never touches them.
      // He steps through six positions on a 24 fps grid and leaves a gold
      // afterimage PLATE standing in each one; what damages is the projection
      // itself, the frame of him passing through the space the body is in.
      // Same movement tech and the same grid timing as before; the fists are
      // gone and the sorcery is doing the work.
      case 'naoya_rush': {
        const steps = opts.steps ?? 6;
        m.sfx.projectionRush?.();
        m.cam.shake(0.3);
        caster.model.projectionAttach?.(m.root);
        // the path: an arc around the opponent ending behind them
        const from = caster.pos.clone();
        const to = t.pos.clone();
        const base = yawBetween(to, from);              // angle of caster from target
        const radius = Math.max(1.4, opts.stepDist ?? 1.55);
        const path = [];
        for (let i = 1; i <= steps; i++) {
          const a = base + (i / steps) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
          path.push(v3(to.x + Math.sin(a) * radius, 0, to.z + Math.cos(a) * radius));
        }
        // the last position is squarely behind them
        const behind = yawBetween(to, from) + Math.PI;
        path[steps - 1] = v3(
          to.x + Math.sin(behind) * (opts.endBehind ?? 1.5), 0,
          to.z + Math.cos(behind) * (opts.endBehind ?? 1.5));
        this.entities.push({
          type: 'projRush', caster, target: t, path, i: 0,
          t: opts.stepInterval ?? 1 / 24, interval: opts.stepInterval ?? 1 / 24,
          dmg: (opts.dmgPerHit ?? 3.4) * mult, hitstun: opts.hitstun ?? 10, kb: opts.kb ?? 0.5,
          src, hitOpts
        });
        break;
      }

      // FRAME 24. NOT A KICK — the projection sorcery cast as a REEL: six
      // real gold film frames (fx/props.js buildFilmFrame) materialise down a
      // stick-steered line, one per 1/24 s, and each one SHATTERS. Whoever a
      // frame resolves on takes the whole reel's force at once and the rest
      // of it burns. The 26-frame chambered tell is still the negotiation.
      case 'naoya_framekick': {
        m.sfx.frameKick?.();
        caster.model.projectionAttach?.(m.root);
        caster.model.projectionStep?.(caster.pos, caster.facing);
        const dir = this._castDir(caster);
        const frames = opts.frames ?? 6;
        const spacing = (opts.spacing ?? 1.15) * caster.reachScale;
        this.entities.push({
          type: 'frameLine', caster, sure, dir,
          origin: caster.pos.clone(), i: 0, frames, spacing,
          t: 0, interval: 1 / 24, radius: opts.radius ?? 1.15,
          dmg: (opts.dmg ?? 17) * mult, kb: opts.kb ?? 13, kbY: opts.kbY ?? 1.6,
          hitstun: opts.hitstun ?? 34, destruct: opts.destruct ?? 46, hitOpts
        });
        m.cam.shake(0.3);
        break;
      }

      // MAXIMUM PROJECTION. A STATE, not an attack — it deals no damage and
      // has no hitbox. It sets three timers on him and hands the rest to
      // Fighter.update and Fighter._applyGrowth, which is where the speed and
      // the permanent stance actually live.
      case 'naoya_maxprojection': {
        const u = caster.cfg.ultimate;
        caster.maxProjT = u.duration ?? 5;
        caster.projT = 0;
        caster.projArmT = 0;
        caster.projSpent = true;         // no whiff penalty inside the ultimate
        caster.model.setProjectionStance?.(true);
        caster.model.projectionAttach?.(m.root);
        m.sfx.maxProjection?.();
        m.stage.flash(0.6);
        m.cam.shake(0.5); m.cam.fovKick(9);
        // twenty-four hard gold ticks around him, placed and left
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * 1.5, 0.1 + (i % 4) * 0.42, Math.sin(a) * 1.5)), {
            color: 0xe8c85a, size: 0.16, aspect: 0.3, life: 0.5, vel: v3()
          });
        }
        m.fx._ring(caster.pos.clone().setY(0.06), 0xe8c85a, { size: 0.5, growRate: 10, life: 0.5 });
        m.hud.toast(caster, '投射呪法・極 — MAXIMUM PROJECTION');
        caster.emit('maxProjectionStart', { duration: caster.maxProjT });
        break;
      }

      // =====================================================================
      // KASHIMO — MYTHICAL BEAST AMBER
      // =====================================================================
      // Every one of these reads the CHARGE TIER rather than a fixed number,
      // and reads it through the shared scalars in combat/charge.js so the
      // technique, the HUD and the model can never disagree about what tier he
      // is in. `chargeDmg` is NOT applied here — it rides on `dmgMult` and is
      // therefore already inside `computeDamage`. Applying it again would
      // square the curve, which was a real bug in the first pass and is the
      // single easiest mistake to make in this file.

      // LIGHTNING BOLT. A fast flat projectile that does not home: it goes
      // where he pointed it. The RANGE is the tier scaling that matters —
      // 5 m at tier 0 is a poke, 18 m at tier 3 crosses any arena in the game.
      case 'kashimo_bolt': {
        // Yuta's copy has no Charge meter of its own, so a borrowed bolt fires
        // at the tier the copy declares (1 — "working, unremarkable") rather
        // than at the caster's, which would be zero forever.
        const tier = caster.cfg.charge ? caster.chargeTier : (opts.copyTier ?? 1);
        const byTier = opts.rangeByTier ?? [5, 9, 13.5, 18];
        const range = byTier[Math.max(0, Math.min(byTier.length - 1, tier))];
        const spd = opts.speed ?? 26;
        // MYTHICAL BEAST AMBER upgrades it to a fan. Three bolts at 14 degrees
        // is a wall rather than a poke, and it is most of why the ultimate
        // changes how the opponent has to stand.
        const fan = caster.amberT > 0 ? (caster.cfg.ultimate?.boltFan ?? 3) : 1;
        for (let i = 0; i < fan; i++) {
          const spread = (i - (fan - 1) / 2) * 0.245;
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'bolt', caster, sure, tier,
            pos: caster.pos.clone().add(v3(0, 1.34, 0)).addScaledVector(dir, 0.7),
            vel: dir.clone().multiplyScalar(spd),
            dmg: (opts.dmg ?? 6) * mult, kb: opts.kb ?? 1.2, hitstun: opts.hitstun ?? 12,
            life: range / spd, fxT: 0,
            fork: tier >= (opts.forkAt ?? 3), forkDmg: (opts.forkDmg ?? 2.6) * mult,
            hitOpts
          });
        }
        m.sfx.lightningBolt?.(tier);
        break;
      }

      // DISCHARGE STRIKE. A committed thrust that dumps the stored charge as a
      // BURST on impact rather than as a point hit — so it beats a sidestep
      // that a pure thrust would miss, which is what a 51-frame move has to do
      // to be worth throwing.
      //
      // The Charge cost was already taken by the state machine? NO — it is
      // taken HERE, on the activation frame, deliberately: an interrupted
      // Discharge Strike should cost him the cursed energy (spent on the press,
      // like every other technique) and NOT the Charge, because the charge was
      // never released. Getting hit out of the windup is punishing enough.
      case 'kashimo_discharge': {
        const tier = caster.chargeTier;
        const reach = (opts.reach ?? 2.6);
        const radius = (opts.burstRadius ?? 2.2) * chargeSize(caster)
          * (caster.amberT > 0 ? (caster.cfg.ultimate?.burstMult ?? 2) : 1);
        const at = caster.pos.clone().setY(1.05).addScaledVector(caster.forward(), reach * 0.65);
        m.sfx.discharge?.(tier);
        m.cam.shake(0.4 + tier * 0.12);
        m.cam.fovKick(4 + tier * 1.5);
        m.fx._ring(at.clone().setY(0.06), 0xa46bff, { size: 0.4, growRate: 9 + radius * 3, life: 0.30 });
        for (let i = 0; i < 16 + tier * 6; i++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.1, radius), rand(-0.6, 0.9), Math.sin(a) * rand(0.1, radius))), {
            color: i % 3 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.10, 0.28), aspect: 0.35,
            life: rand(0.14, 0.30), vel: v3(rand(-3, 3), rand(0.5, 4), rand(-3, 3))
          });
        }
        m.arena?.destruct?.damageAt(at, radius, opts.destruct ?? 30);
        // the burst is a RADIUS test around the impact point, not an arc test
        const inBurst = sure || flatDist(t.pos, at) < radius + (t.hurtBox?.radius ?? 0.62);
        if (inBurst) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 20) * mult);
          // THE STAGGER. Extra HITSTUN, applied as an ordinary heavy hit — it
          // is deliberately NOT the `frozen` state, so it can never be mistaken
          // for Naoya's one-second lock either by the player or by any system
          // that reads state. Below the tier gate there is no stagger at all.
          const st = opts.stunFrames ?? [0, 0, 26, 34];
          const stun = tier >= (opts.stunAt ?? 2) ? (st[tier] ?? 0) : 0;
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.5, kbY: opts.kbY ?? 1.2,
            hitstun: Math.max(opts.hitstun ?? 30, stun), type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') {
            gainCharge(caster, 'tech');
            if (stun > 0) {
              m.hitstop(10);
              m.hud.toast(t, '感電 STAGGERED');
              t.emit('staggered', { frames: stun });
            }
          }
        }
        // ---- THE CHARGE COST, AND WHY IT IS TAKEN LAST -------------------
        // A REAL BUG, found by measuring damage per tier in a live match
        // rather than by reading this file. Spending first meant the tier had
        // already dropped by the time `computeDamage` read `dmgMult`, so a
        // tier-3 Discharge landed for tier-2 damage and a tier-2 one landed
        // for tier-0 damage and inflicted NO stagger at all. Measured: 18.2 /
        // 23.9 / 18.2 / 28.7 across the four tiers — non-monotonic, which is
        // the shape of a bug rather than of a curve.
        //
        // The strike is powered by the charge he HAD when he threw it. It
        // costs him the engine AFTERWARDS, which is also the only reading of
        // "his best move costs him his engine" that is not simply a worse move.
        //
        // And it DRAINS rather than gates: `spendCharge` refuses outright when
        // he cannot afford the full cost, which meant a Kashimo at 30 charge
        // paid nothing at all and kept his tier for free. Draining what he has
        // is what the design says and what a capacitor does.
        if (caster.amberT <= 0) {
          const cost = opts.chargeCost ?? 35;
          spendCharge(caster, Math.min(caster.charge, cost));
        }
        break;
      }

      // ARC DASH's pass. The blink itself already happened in Fighter._arcDash
      // — this is only what the line between the two points DID. Everything
      // inside a cylinder from `from` to `to` is hit once.
      case 'kashimo_arcpass': {
        const from = opts.from ?? caster.pos.clone();
        const to = opts.to ?? caster.pos.clone();
        const seg = to.clone().sub(from);
        const len = Math.max(0.001, Math.hypot(seg.x, seg.z));
        const nx = seg.x / len, nz = seg.z / len;
        const rad = opts.radius ?? 1.15;
        // the trail: hard bright segments left along the line, not a smooth
        // ribbon — the same reasoning as Naoya's afterimages
        const steps = Math.max(3, Math.round(len / 0.45));
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const p = from.clone().lerp(to, u).setY(1.05 + Math.sin(u * 7) * 0.22);
          m.fx._spawn(p, {
            color: i % 2 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.14, 0.30), aspect: 0.28,
            life: rand(0.14, 0.26), vel: v3(rand(-1, 1), rand(-0.4, 1.6), rand(-1, 1))
          });
        }
        m.sfx.arcDash?.();
        m.cam.shake(0.18);
        // who did it pass through? Project each living opponent onto the
        // segment and test the perpendicular distance — a pass that goes AROUND
        // somebody should miss them, and an arc test cannot express that.
        for (const foe of m.activeFighters ?? [t]) {
          if (!foe || foe === caster || !foe.alive) continue;
          const dx = foe.pos.x - from.x, dz = foe.pos.z - from.z;
          const along = Math.max(0, Math.min(len, dx * nx + dz * nz));
          const px = from.x + nx * along, pz = from.z + nz * along;
          const perp = Math.hypot(foe.pos.x - px, foe.pos.z - pz);
          if (perp > rad + (foe.hurtBox?.radius ?? 0.62)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * mult, { canCrit: false });
          const r = foe.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 1.6, kbY: 0,
            hitstun: opts.hitstun ?? 14, type: 'light',
            dir: v3(nx, 0, nz)
          }, m.ctxFor(caster));
          hitFeedback(m, caster, foe, r, {});
          // THE REFUND, and the whole economy of the move: a pass that
          // connects pays back MORE than it cost, so aggression is rewarded
          // and a whiffed chain genuinely disarms him.
          if (r === 'hit' || r === 'otg') gainCharge(caster, 'arcPass');
        }
        break;
      }

      // MYTHICAL BEAST AMBER, FULL RELEASE. A STATE, like Naoya's ultimate: no
      // hitbox, no damage, three fields set on him and everything else handled
      // by the systems that already read them.
      case 'kashimo_amber': {
        const u = caster.cfg.ultimate;
        caster.amberT = u.duration ?? 8;
        caster.charge = caster.cfg.charge?.max ?? 100;
        caster.chargeTier = 3;
        caster.arcChain = 0;
        caster.specialCD = 0;
        caster.model.setAmber?.(true);
        caster.model.setCharge?.(3, 1);
        m.sfx.amber?.();
        m.stage.flash(0.7);
        m.cam.shake(0.6); m.cam.fovKick(10);
        for (let i = 0; i < 30; i++) {
          const a = (i / 30) * Math.PI * 2;
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * 1.4, 0.1 + (i % 6) * 0.34, Math.sin(a) * 1.4)), {
            color: i % 3 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.14, 0.30), aspect: 0.3,
            life: rand(0.4, 0.8), vel: v3(Math.cos(a) * 2, rand(2, 6), Math.sin(a) * 2)
          });
        }
        m.fx._ring(caster.pos.clone().setY(0.06), 0xa46bff, { size: 0.5, growRate: 14, life: 0.6 });
        m.hud.toast(caster, '灼爛趙誅 — MYTHICAL BEAST AMBER');
        caster.emit('amberStart', { duration: caster.amberT });
        break;
      }

      // =====================================================================
      // PANDA — THE THREE CORES
      // =====================================================================
      // Five techniques across three stances, and each one is written to be
      // the thing its stance is FOR: the balanced core controls space, Gorilla
      // punishes, the Triceratops leaves. The frame data that makes them feel
      // different lives in characters/panda.js; what lives here is what each
      // one actually does on connect.

      // BALANCED · CURSED PALM. A short shockwave off a two-paw slam. No
      // projectile — the brief is explicit that this core has a projectile-less
      // mid-range game, and a radius burst at 2.45 m is the honest version of
      // "mid-range" for a fighter with no ranged tool at all.
      case 'panda_palm': {
        // QUAKE PALM. The palm goes into the FLOOR, and the floor carries it:
        // a rupture front of thrown turf and stone that runs six and a half
        // metres down the lane, steered by the stick, popping whoever it
        // reaches into the air. His only ranged tool, and the balanced core's
        // reason to exist — the other two stances hit harder up close.
        m.sfx.pandaPalm?.();
        m.cam.shake(0.4);
        const dir = this._castDir(caster);
        m.fx._ring(caster.pos.clone().setY(0.06).addScaledVector(dir, 0.8),
          0xdfe4ee, { size: 0.4, growRate: 10, life: 0.28 });
        this.entities.push({
          type: 'quakeWave', caster, sure, dir,
          pos: caster.pos.clone().setY(0).addScaledVector(dir, 1.0),
          spd: opts.speed ?? 12, travelled: 0, range: opts.range ?? 6.5,
          radius: opts.radius ?? 1.5, dealt: false,
          dmg: (opts.dmg ?? 13) * mult, kb: opts.kb ?? 3.5, kbY: opts.kbY ?? 6.5,
          hitstun: opts.hitstun ?? 26, hitOpts, fxT: 0
        });
        break;
      }

      // BALANCED · ROLLING PRESS. He tucks and rolls forward, landing on them.
      // A travelling hit rather than a burst, so it can be walked around — his
      // gap closer, and deliberately a mediocre one.
      case 'panda_roll': {
        m.sfx.pandaRoll?.();
        this.entities.push({
          type: 'pandaRoll', caster, target: t, sure,
          t: 0, dur: 0.34, travel: opts.travel ?? 5.2,
          dir: caster.forward(), reach: opts.reach ?? 2.0,
          dmg: (opts.dmg ?? 16) * mult, kb: opts.kb ?? 5, kbY: opts.kbY ?? 1.2,
          hitstun: opts.hitstun ?? 28, hitOpts, dealt: false
        });
        break;
      }

      // GORILLA · UNBLOCKABLE DRUMMING BEAT 不可視の連打. CANON, BY NAME. He
      // beats his chest and the shock goes THROUGH the guard: `unblockable`,
      // which the damage pipeline already honours (Todo's Vice Grab uses the
      // same flag), so a blocked Drumming Beat deals its damage in full.
      //
      // It is short and slow because of that. An unblockable with reach would
      // have no counterplay; at 2.2 m and 20 frames of startup the counterplay
      // is the one Gorilla always has against him, which is distance.
      case 'panda_drum': {
        const radius = opts.radius ?? 2.20;
        const at = caster.pos.clone().setY(1.15).addScaledVector(caster.forward(), radius * 0.4);
        m.sfx.drummingBeat?.();
        m.cam.shake(0.55);
        m.cam.fovKick(5);
        // three concentric rings on the beat — the shock is the point, so it
        // reads as a wave rather than as an impact
        for (let k = 0; k < 3; k++) {
          m.fx._ring(at.clone().setY(0.06 + k * 0.5), 0xd9a94e,
            { size: 0.3 + k * 0.25, growRate: radius * 4.5, life: 0.30 + k * 0.06 });
        }
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.2, radius), rand(-0.4, 1.0), Math.sin(a) * rand(0.2, radius))), {
            color: i % 3 === 0 ? 0xfff0cc : 0xd9a94e, size: rand(0.12, 0.30), aspect: 0.5,
            life: rand(0.16, 0.32), vel: v3(Math.cos(a) * 4, rand(0.3, 2), Math.sin(a) * 4)
          });
        }
        m.arena?.destruct?.damageAt(at, radius, 36);
        if (sure || flatDist(t.pos, at) < radius + (t.hurtBox?.radius ?? 0.62)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 19) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.5, kbY: opts.kbY ?? 1.0,
            hitstun: opts.hitstun ?? 28, type: 'heavy',
            // THE WHOLE TECHNIQUE, IN ONE FIELD
            unblockable: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit') { m.hitstop(10); m.hud.toast(t, '不可視の連打 — THROUGH THE GUARD'); }
        }
        break;
      }

      // GORILLA · UPHEAVAL. The slam goes into the DECK and the deck answers:
      // a ring of stone slabs (real geometry) driven up out of the floor
      // around him. Same commitment and the same knockdown as the old
      // overhead — what changed is that the thing hitting you is the ground.
      case 'panda_slam': {
        const reach = opts.reach ?? 2.35;
        const at = caster.pos.clone().setY(0).addScaledVector(caster.forward(), reach * 0.6);
        m.sfx.slam();
        m.cam.shake(0.75);
        m.cam.fovKick(8);
        m.fx._ring(at.clone().setY(0.06), 0xd9a94e, { size: 0.5, growRate: 14, life: 0.4 });
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + rand(-0.25, 0.25);
          const rr2 = rand(0.8, reach);
          m.fx.stoneSlabAt(at.clone().add(v3(Math.cos(a) * rr2, 0, Math.sin(a) * rr2)), {
            w: rand(0.8, 1.4), h: rand(1.2, 2.2), color: 0x8a7a5c, life: rand(0.7, 1.0)
          });
        }
        m.arena?.destruct?.damageAt(at.clone().setY(0.5), 2.6, opts.destruct ?? 52);
        if (sure || inArc(caster, t, reach, opts.arc ?? 1.2)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 26) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.5, kbY: 0,
            hitstun: opts.hitstun ?? 34, type: 'knockdown'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: true });
        }
        break;
      }

      // TRICERATOPS · GORE CHARGE. A long run-through with the horns down. The
      // damage is modest; what it buys is seven metres of ground and a body
      // behind him. Entity-driven so it genuinely travels and can genuinely be
      // sidestepped, which a one-frame reach test could not express.
      case 'panda_gore': {
        m.sfx.goreCharge?.();
        m.cam.shake(0.3);
        this.entities.push({
          type: 'pandaGore', caster, target: t, sure,
          t: 0, dur: (opts.travel ?? 7.2) / (opts.speed ?? 15),
          speed: opts.speed ?? 15, dir: caster.forward(), reach: opts.reach ?? 1.9,
          dmg: (opts.dmg ?? 12) * mult, kb: opts.kb ?? 4, kbY: opts.kbY ?? 1,
          hitstun: opts.hitstun ?? 22, destruct: opts.destruct ?? 34,
          hitOpts, dealt: false, fxT: 0
        });
        break;
      }

      // TRICERATOPS · CREST ROLL. The evasive option and the reason the stance
      // exists: a backward roll behind the frill with real invulnerability on
      // it, leaving a light hit where he was. It does not beat pressure, it is
      // not there for it.
      case 'panda_crestroll': {
        const back = caster.forward().multiplyScalar(-(opts.travel ?? 4.6));
        const dest = caster.pos.clone().add(back);
        dest.y = 0;
        const r0 = Math.hypot(dest.x, dest.z), lim = caster.boundRadius;
        if (r0 > lim) { const k = lim / r0; dest.x *= k; dest.z *= k; }
        const from = caster.pos.clone();
        caster.pos.copy(dest);
        caster.prevPos.copy(dest);
        caster.vel.set(0, 0, 0);
        caster.iFrames = Math.max(caster.iFrames, opts.iFrames ?? 14);
        m.sfx.crestRoll?.();
        for (let i = 0; i <= 6; i++) {
          m.fx._spawn(from.clone().lerp(dest, i / 6).setY(0.5), {
            color: 0xe08aa8, size: rand(0.16, 0.34), aspect: 0.6,
            life: rand(0.12, 0.26), vel: v3(rand(-1, 1), rand(0.2, 1.4), rand(-1, 1))
          });
        }
        // the hit it leaves behind, at the position he rolled OUT of
        const radius = opts.radius ?? 1.6;
        if (sure || flatDist(t.pos, from) < radius + (t.hurtBox?.radius ?? 0.62)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.5, kbY: 0,
            hitstun: opts.hitstun ?? 16, type: 'light',
            dir: back.normalize().multiplyScalar(-1)
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
        }
        break;
      }

      // THREE CORES, ONE BODY 三核共鳴. A STATE, like the other two non-domain
      // "become better" ultimates in the roster. It sets the `all` stance and
      // two numbers; everything else is already routed through the stance
      // system, which is precisely why the ultimate was cheap to build and why
      // it genuinely plays as all three characters at once rather than as a
      // damage buff with a different name.
      case 'panda_allcores': {
        const u = caster.cfg.ultimate;
        const n = Math.max(1, caster.cores.filter(c => c.alive && c.hp > 0).length);
        // FIXED AT CAST TIME. Losing a core during the window must not retune
        // a window the player already paid a full bar for.
        caster.allCoresMult = u.byCores?.[n] ?? 1;
        caster.allCoresT = (u.duration ?? 12) * caster.allCoresMult;
        caster._allCoresFrom = caster.stance;
        caster._setStance('all', { silent: true });
        caster.model.setAllCores?.(true);
        m.sfx.allCores?.(n);
        m.stage.flash(0.5 + n * 0.08);
        m.cam.shake(0.5); m.cam.fovKick(8);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const col = [0xf2f2ec, 0xd9a94e, 0xe08aa8][i % 3];
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * 1.5, 0.2 + (i % 5) * 0.4, Math.sin(a) * 1.5)), {
            color: col, size: rand(0.16, 0.34), life: rand(0.4, 0.8),
            vel: v3(Math.cos(a) * 2.5, rand(1.5, 5), Math.sin(a) * 2.5)
          });
        }
        for (let k = 0; k < 3; k++) {
          m.fx._ring(caster.pos.clone().setY(0.06), [0xf2f2ec, 0xd9a94e, 0xe08aa8][k],
            { size: 0.4 + k * 0.3, growRate: 10, life: 0.5 });
        }
        m.hud.toast(caster, '三核共鳴 — ' + n + ' CORES');
        caster.emit('allCoresStart', { cores: n, mult: caster.allCoresMult, duration: caster.allCoresT });
        break;
      }

      case 'gojo_red': {
        // RED 赫 — convergence inverted, and now it TRAVELS: a core of
        // stored repulsion flown down the lane that lets go all at once on
        // contact, blasting the target off their feet and shoving the level
        // apart as it passes. Same damage and knockdown as the old cone; the
        // difference is that it is a visible object with a flight time, so
        // sidestepping it is a real play and landing it is a real read.
        const dir = caster.forward();
        m.fx._ring(caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.7),
          0xff8a6a, { size: 0.35, growRate: 10, life: 0.25, flat: false });
        this.entities.push({
          type: 'redOrb', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.7),
          spd: opts.speed ?? 20, travelled: 0, range: opts.range ?? 7.5,
          dmg: (opts.dmg ?? 11) * mult, kb: opts.kb ?? 7.5, kbY: opts.kbY ?? 3.2,
          hitOpts, fxT: 0
        });
        m.sfx.red();
        break;
      }
      case 'gojo_blue': {
        const pos = t.pos.clone().add(v3(0, 1, 0));
        if (!sure) {
          const fw = caster.forward();
          pos.copy(caster.pos).addScaledVector(fw, Math.min(opts.range ?? 6.5, caster.pos.distanceTo(t.pos) * 0.8)).setY(1.1);
        }
        this.entities.push({
          type: 'blue', pos, t: opts.pullTime ?? 0.7, caster,
          dmg: (opts.dmg ?? 5) * mult, sure,
          fxNode: this.match.fx.blueOrb(pos)
        });
        m.sfx.blue();
        break;
      }
      case 'purple': {
        const fw = caster.forward();
        m.fx.purpleBeam(caster.pos.clone().setY(1.3), fw);
        m.sfx.purple();
        // HOLLOW PURPLE ERASES. Walk the beam and delete everything on the
        // line — this is the one damage source that ignores an object's hp.
        for (let i = 1; i <= 26; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.3).addScaledVector(fw, i), 2.0, 1, { kind: 'erase' });
        }
        m.stage.flash(1);
        m.cam.shake(1.0); m.cam.fovKick(10);
        // screen-crossing line: hits if the opponent is anywhere along it
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * fw.x + rel.z * fw.z;
        const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
        if (sure || (along > -0.5 && perp < (opts.width ?? 1.6) + 0.5)) {
          const { dmg } = computeDamage(caster, (opts.dmg ?? 45) * mult, { canCrit: false });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 9, kbY: 5, hitstun: 40, type: 'knockdown', unblockable: true }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        break;
      }
      case 'yuta_rika_swing': {
        // RIKA'S GRASP. She still appears at his shoulder — but now her ARM
        // goes out: an oversized spectral hand flown down the lane, and what
        // it catches it BRINGS BACK, deposited at arm's reach in front of
        // Yuta with the combo already his. The swing's damage is unchanged;
        // the payoff moved from knockback to position, which is the scarier
        // gift. Whiffing leaves the hand to dissolve at full extension.
        m.fx.rikaFlash(caster, 'swing');
        m.sfx.rikaSwing();
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'rikaHand', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.3, 0)).addScaledVector(dir, 1.0),
          spd: opts.speed ?? 17, travelled: 0, range: opts.range ?? 6.0,
          dmg: (opts.dmg ?? 14) * mult, hitstun: opts.hitstun ?? 26,
          dragGap: opts.dragGap ?? 1.6,
          node: m.fx.rikaHandNode(), hitOpts, fxT: 0
        });
        break;
      }
      // RIKA'S TEETH. NOT A LUNGING HIT — Rika does it, not Yuta: a spectral
      // maw of hers materialises ahead of him and closes. He is still pulled
      // in behind it (the approach the slot exists for), but the hitbox is
      // hers and it is out in front of him rather than on his shoulder.
      case 'yuta_lunge': {
        const dir = this._castDir(caster);
        caster.vel.x = dir.x * (opts.lungeSpeed ?? 14) * 0.75;
        caster.vel.z = dir.z * (opts.lungeSpeed ?? 14) * 0.75;
        this.entities.push({
          type: 'rikaBite', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.2, 0)).addScaledVector(dir, 1.4),
          spd: opts.speed ?? 15, travelled: 0, range: opts.range ?? 4.5,
          dmg: (opts.dmg ?? 8) * mult, kb: opts.kb ?? 1.2, hitstun: opts.hitstun ?? 18,
          node: m.fx.soulBladeNode(1.5, false), hitOpts, fxT: 0
        });
        m.sfx.lunge();
        m.fx.dashTrail(caster);
        break;
      }
      case 'sword_slash': {
        // in-domain lunging slash: the connect window resolves against the
        // domain system (swordHit), not the damage pipeline — whiffable, and
        // that whiff is the whole skill check
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 12);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 12);
        this.entities.push({ type: 'slashHit', caster, frames: opts.active ?? 8, reach: opts.reach ?? 2.5, arc: opts.arc ?? 2.0 });
        m.sfx.swordSwing();
        m.fx.dashTrail(caster);
        break;
      }
      case 'rika_blast': {
        m.fx.rikaFlash(caster, 'blast');
        m.sfx.rikaSwing();
        if (sure || inArc(caster, t, 6, 1.2)) {
          const { dmg } = computeDamage(caster, 10 * mult, { canCrit: false });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 4, kbY: 2, hitstun: 22, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        break;
      }
      case 'nanami_cleave': {
        // RATIO WAVE. The blunt blade projects its edge: a wide bar of gold
        // that crosses seven metres of floor with the white 7:3 line drawn on
        // its face. The technique IS the ratio, so the wave enforces it —
        // caught in the band around seventy percent of its range, the hit is
        // a guaranteed critical, exactly as if the blade itself had found the
        // weak point. Landing anywhere still applies the 7:3 mark.
        m.fx.cleaveArc(caster);
        m.sfx.cleave();
        const dir = this._castDir(caster);
        const range = opts.range ?? 7.0;
        this.entities.push({
          type: 'ratioWave', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.1, 0)).addScaledVector(dir, 0.8),
          spd: opts.speed ?? 15, travelled: 0, range,
          sweetLo: range * 0.6, sweetHi: range * 0.8,
          width: opts.width ?? 2.4, dmg: (opts.dmg ?? 12) * mult,
          kb: opts.kb ?? 3.5, kbY: opts.kbY ?? 0.5, hitstun: opts.hitstun ?? 22,
          appliesMark: !!(opts.appliesMark && caster.cfg.ratio),
          hitOpts, fxT: 0
        });
        break;
      }
      case 'nanami_overtime': {
        caster.buffs.overtime = opts.duration ?? 8;
        m.fx.overtimeAura(caster, opts.duration ?? 8);
        m.sfx.overtime();
        m.hud.toast(caster, 'OVERTIME');
        break;
      }
      // =====================================================================
      // YUJI — DIVERGENT BLOOM 硬着発散
      // =====================================================================
      // NOT A PUNCH. He drives his cursed energy into the deck and it comes
      // back up somewhere else: a crimson CE crystal forced out of the ground
      // under the opponent, which then DIVERGES — a second detonation a beat
      // after the first, out of the same bloom. That delayed second impact is
      // the whole identity of the technique, and it is now the entire move
      // rather than a rider on a jab.
      //
      // Both detonations still open the Black Flash window, so his core loop
      // (land technique -> B in the window) is untouched.
      case 'yuji_divergent': {
        const dir = this._castDir(caster);
        const at = v3();
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          at.copy(caster.pos).addScaledVector(dir, opts.reach ?? 3.2);
        } else {
          // neutral: under their feet, led a little
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), 0.18);
        }
        at.y = caster.bounds ? caster.bounds.floorAt(at.x, at.z, caster.pos.y + 1.2) : 0;
        const lim = caster.arenaRadius - 0.3;
        const rr = Math.hypot(at.x, at.z);
        if (rr > lim) { at.x *= lim / rr; at.z *= lim / rr; }
        const radius = opts.radius ?? 2.1;
        m.fx.ceBloomAt(at.clone().add(v3(0, 0.5, 0)), radius * 0.75, (opts.delay ?? 0.45) + 0.35);
        m.fx._ring(at.clone().setY(0.06), 0xff3b30, { size: 0.4, growRate: 9, life: 0.3 });
        m.sfx.hit(true);
        this.entities.push({
          type: 'ceBloom', caster, sure, pos: at, radius,
          t: 0, hitAt: 0.12, divergeAt: (opts.delay ?? 0.45) + 0.12,
          dmg: (opts.dmg ?? 7) * mult, dmg2: (opts.dmg2 ?? 10) * mult,
          hitOpts, struck: false, diverged: false
        });
        break;
      }

      // =====================================================================
      // YUJI — MANJI SLASH 卍斬
      // =====================================================================
      // NOT A KICK. The 卍 is THROWN: a spinning cursed-energy wheel of four
      // hooked arms (real geometry) that flies out, and on the way back it
      // cuts again — a boomerang, so the second pass is the half that catches
      // anyone who walked forward to punish the first.
      case 'yuji_manji': {
        if (opts.staminaCost) caster.res.stamina = Math.max(0, caster.res.stamina - opts.staminaCost);
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'manji', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(dir, 0.8),
          spd: opts.speed ?? 17, travelled: 0, range: opts.range ?? 8.5,
          back: false, spin: 0,
          dmg: (opts.dmg ?? 11) * mult, kb: opts.kb ?? 4.5, kbY: opts.kbY ?? 1.5,
          hitstun: opts.hitstun ?? 24, hitOpts,
          node: m.fx.manjiNode(opts.size ?? 1.15), hit: new Set(), fxT: 0
        });
        m.sfx.lunge();
        break;
      }
      case 'yuji_sukuna': {
        const u = caster.cfg.ultimate;
        caster.buffs.sukuna = u.duration ?? 8;
        caster.model.setSukuna?.(true);
        m.fx.buffAura(caster, u.duration ?? 8, 0xff2038);
        m.sfx.sukuna();
        m.stage.flash(0.6);
        m.cam.shake(0.7);
        m.cam.fovKick(8);
        m.hud.toast(caster, u.name);
        break;
      }
      case 'todo_clapcombo': {
        // RESONANT CLAP. He claps and the CONCUSSION goes without him: a wall
        // of pink shock that crosses the arena at head height, steered by the
        // stick at cast. What it does on arrival is drag the body BACK toward
        // Todo — a clap is a pressure wave, and the low-pressure pocket behind
        // it is the half everyone forgets. Mechanically that pull is the whole
        // move: it feeds the Vice Grab, which is the fight he wants.
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'clapWave', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.1, 0)).addScaledVector(dir, 0.8),
          spd: opts.speed ?? 13, travelled: 0, range: opts.range ?? 8.5,
          width: opts.width ?? 2.6, pull: opts.pull ?? 3.2,
          dmg: (opts.dmg ?? 14) * mult, kb: opts.kb ?? 2.0,
          hitstun: opts.hitstun ?? 26, hitOpts, fxT: 0, dealt: false
        });
        // the clap itself, at the hands
        const at = caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.7);
        m.fx._ring(at, TODO_ACCENT, { size: 0.4, growRate: 14, life: 0.3, flat: false });
        m.fx._spawn(at, { color: 0xffffff, size: 0.7, life: 0.16, vel: v3() });
        m.sfx.clap();
        m.cam.shake(0.3);
        break;
      }
      case 'todo_grab': {
        // command grab: unblockable, but it only closes on a standing,
        // grounded target — jumping (or already being down) beats it
        const grabbable = t.grounded && !['knockdown', 'getup', 'launched', 'ko'].includes(t.state);
        if ((sure || inArc(caster, t, opts.reach ?? 1.7, 1.6)) && grabbable) {
          t.pos.copy(caster.pos).addScaledVector(caster.forward(), 1.1);
          t.prevPos.copy(t.pos);
          const { dmg } = computeDamage(caster, (opts.dmg ?? 24) * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: 3.5, kbY: 0, hitstun: 40, type: 'knockdown',
            unblockable: true, otgOk: false
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true, knockdown: true });
          m.fx._ring(t.pos.clone().setY(0.08), TODO_ACCENT, { size: 0.7, growRate: 13, life: 0.4 });
          m.sfx.slam();
          m.cam.shake(0.8);
          m.cam.fovKick(8);
          m.hitstop(14);
          m.stage.flash(0.3);
        } else {
          m.sfx.whiff();
        }
        break;
      }
      case 'todo_boogie_cast': {
        // Yuta's copied Boogie Woogie: the swap as a castable technique.
        // The snap uses the CASTER's accent so a copy reads as Yuta's energy.
        const ax = caster.pos.x, az = caster.pos.z;
        const a = caster.pos.clone(), b = t.pos.clone();
        caster.pos.x = t.pos.x; caster.pos.z = t.pos.z;
        t.pos.x = ax; t.pos.z = az;
        caster.prevPos.copy(caster.pos);
        t.prevPos.copy(t.pos);
        t.aimLag = 0.28; // same disorientation as the real thing
        m.sfx.clap();
        m.fx.boogieSwap(a, b, caster.model.palette.accent ?? TODO_ACCENT);
        const { dmg } = computeDamage(caster, (opts.dmg ?? 5) * mult, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.5, kbY: 0, hitstun: 14, type: 'light' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        break;
      }
      case 'todo_brotherhood': {
        // BROTHERHOOD: a chain of swap-blows handled by an entity — every
        // interval Todo blinks to a new angle and strikes, ending in one
        // enormous finisher
        this.entities.push({
          type: 'brotherhood', caster, t: 0.28,
          swings: opts.swings ?? 5, interval: opts.interval ?? 0.33,
          hitDmg: opts.hitDmg ?? 7, finDmg: opts.finDmg ?? 18
        });
        m.sfx.clap();
        m.stage.flash(0.3);
        m.cam.shake(0.4);
        break;
      }
      case 'jogo_embers': {
        // EMBER INSECTS: a fan of small homing flame projectiles with loose
        // tracking. Overheat upgrades to the MAXIMUM screen-crossing swarm.
        const max = caster.buffs.overheat > 0 && caster.cfg.ct1?.maximum;
        const count = (max ? max.count : opts.count) ?? 4;
        const spd = (max ? max.speed : opts.speed) ?? 9;
        const range = (max ? max.range : opts.range) ?? 12;
        const homing = (max ? max.homing : opts.homing) ?? 2.4;
        const dmg = ((max ? max.dmg : opts.dmg) ?? 2.5) * mult;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.28;
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'ember', caster, sure,
            pos: caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.5)
              .add(v3(rand(-0.2, 0.2), rand(-0.15, 0.35), rand(-0.2, 0.2))),
            vel: dir.multiplyScalar(spd * rand(0.85, 1.15)),
            spd, homing, dmg, burn: opts.burnStacks ?? 1,
            life: range / spd, delay: i * 0.05, fxT: 0
          });
        }
        m.sfx.ember();
        break;
      }
      case 'jogo_eruption': {
        // VOLCANIC ERUPTION: delayed blast at a targeted ground position. The
        // left stick aims (character-relative); neutral leads the opponent.
        // The glowing marker telegraph is the point — trap, not poke.
        const max = caster.buffs.overheat > 0 && caster.cfg.ct2?.maximum;
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 8) * mag);
        } else {
          // neutral: the opponent's feet, led by their current velocity
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.delay ?? 0.85) * 0.6);
        }
        at.y = 0;
        const r = Math.hypot(at.x, at.z);
        const lim = caster.arenaRadius - 0.3;
        if (r > lim) { at.x *= lim / r; at.z *= lim / r; }
        this.entities.push({
          type: 'eruption', caster, pos: at, sure,
          t: opts.delay ?? 0.85, radius: (max ? max.radius : opts.radius) ?? 2.2,
          dmg: ((max ? max.dmg : opts.dmg) ?? 18) * mult,
          kb: opts.kb ?? 4, kbY: opts.kbY ?? 9, burn: opts.burnStacks ?? 2,
          stages: max ? (max.stages ?? 3) : 1, stageGap: max ? (max.stageGap ?? 0.55) : 0,
          fxT: 0
        });
        m.sfx.eruptPrime();
        break;
      }
      case 'jogo_overheat': {
        const sp = caster.cfg.special;
        caster.buffs.overheat = sp.duration ?? 10;
        caster.model.setOverheat?.(true);
        m.fx.buffAura(caster, sp.duration ?? 10, 0xff5a1f);
        m.sfx.overheat();
        m.stage.flash(0.35);
        m.cam.shake(0.5);
        m.hud.toast(caster, 'OVERHEAT — MAXIMUM');
        break;
      }
      case 'mahito_soultouch': {
        // SOUL TOUCH: short, narrow grab-strike. Lands = damage + SOUL WOUND
        // (increased damage taken). Whiffs badly — it's a read.
        m.fx.soulGrasp(caster);
        m.sfx.soulTouch();
        if (sure || inArc(caster, t, opts.reach ?? 1.6, opts.arc ?? 1.1)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 10) * mult);
          const r = t.applyHit({ ...hitOpts, dmg, kb: opts.kb ?? 2.5, kbY: 0, hitstun: opts.hitstun ?? 26, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg' || r === 'block') {
            if (r !== 'block') {
              const sw = opts.soulWound ?? { duration: 6, dmgTakenMult: 1.3 };
              t.buffs.soulWound = sw.duration;
              t.soulWoundMult = sw.dmgTakenMult;
              m.hud.toast(t, 'SOUL WOUND');
              // the touched soul yanked briefly visible — the read for "your
              // shape is his now" that a bare ring never carried
              m.fx.soulRip(t.pos.clone());
              m.fx._ring(t.pos.clone().add(v3(0, 1.25, 0)), 0x8b9bab, { size: 0.4, growRate: 6, life: 0.4, flat: false });
            }
            m.domains.transfigChunk(caster, t, 'soulTouch', r === 'block');
          }
        } else {
          m.sfx.whiff();
        }
        break;
      }
      case 'mahito_bodyweapon': {
        // BODY LANCE. The arm no longer swings — it LEAVES: reshaped into a
        // segmented lance of pale flesh that shoots out six and a half metres
        // and reels back in, steered by the stick as it extends. The hammer
        // variant still flattens on connect. Idle Transfiguration rides the
        // steel exactly as it rode the swing: any touch feeds the soul chunk.
        // clamp: bwVariant is -1 until startCT's rotation first picks one
        // (a copied or sure-hit cast can arrive before that)
        const variant = Math.max(0, opts.variant ?? caster.bwVariant ?? 0);
        caster.model.showBodyWeapon?.(variant);
        m.sfx.bodyMorph(variant);
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'bodyLance', caster, sure, dir, variant,
          t: 0, extend: opts.extendTime ?? 0.22, hold: opts.holdTime ?? 0.1,
          reach: opts.reach ?? 6.5, dealt: false,
          dmg: (opts.dmg ?? 16) * mult, kb: opts.kb ?? 5, kbY: opts.kbY ?? 2,
          hitstun: opts.hitstun ?? 30, hitOpts, fxT: 0
        });
        break;
      }
      case 'mahito_summon': {
        m.minions?.spawn(caster);
        m.sfx.summon();
        m.hud.toast(caster, 'TRANSFIGURED HUMAN');
        break;
      }
      case 'megumi_shikigami': {
        // The bound slot fires. Outside the domain the shikigami comes up out
        // of the shadow in front of him; INSIDE it, the shadow is everywhere,
        // so a share of summons erupt directly under the opponent instead —
        // that ambush is the domain's teeth.
        const key = opts.shikigami;
        if (!key) break;
        const gs = m.domains.gardenFor?.(caster);
        let at = caster.pos.clone().addScaledVector(caster.forward(), 1.6);
        if (gs && Math.random() < (gs.def.shadow.ambushChance ?? 0.5)
          && m.domains.shadowContains(t.pos)) {
          at = t.pos.clone().addScaledVector(
            v3(t.pos.x - caster.pos.x, 0, t.pos.z - caster.pos.z).normalize(), 1.2);
        }
        at.y = 0;
        m.domains.clampToShadow?.(at);
        m.shikigami.summon(caster, key, { at });
        m.cam.shake(key === 'elephant' ? 0.6 : 0.2);
        break;
      }
      case 'megumi_copy_dog': {
        // Yuta's Copy of the Ten Shadows: ONE Divine Dog on loan (not the
        // pair), short leash, reduced health. Loss is tracked per owner, so
        // this dog dying never touches Megumi's ledger.
        m.shikigami.summonBorrowed(caster, 'divineDogs', {
          at: caster.pos.clone().addScaledVector(caster.forward(), 1.4),
          dmg: opts.dmg ?? 6, hpMult: 0.65, life: 9, single: true
        });
        break;
      }
      // ---- MAHORAGA ------------------------------------------------------
      case 'mahoraga_wheel_slash': {
        // WHEEL SLASH: one flat sweep of the blade through a wide arc. Long
        // reach, everything in front of him, and it takes the scenery with it.
        const reach = opts.reach ?? 5.2, arc = opts.arc ?? 2.8;
        m.fx.wheelArc(caster, reach);
        m.sfx.wheelSlash();
        m.cam.shake(0.35);
        // the arc scours the level along its own sweep
        for (let i = -2; i <= 2; i++) {
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), i * (arc / 5));
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.4).addScaledVector(dir, reach * 0.7),
            opts.destroyRadius ?? 3.0, opts.destroyPower ?? 70);
        }
        // it hits EVERYONE in the arc, not just the nearest — it is a sweep
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          if (!sure && !inArc(caster, f, reach, arc)) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 22) * mult, { canCrit: false });
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6, kbY: opts.kbY ?? 1.2,
            hitstun: opts.hitstun ?? 34, type: 'heavy',
            dir: v3(f.pos.x - caster.pos.x, 0, f.pos.z - caster.pos.z).normalize()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { heavy: true });
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(caster.forward(), reach * 0.6), reach * 0.7, (opts.dmg ?? 22) * 0.7, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(caster.forward(), reach * 0.6), reach * 0.7, (opts.dmg ?? 22) * 0.7, caster);
        break;
      }

      case 'mahoraga_world_cut': {
        // WORLD-CUTTING SLASH. A line, not an arc. It is walked step by step
        // out to `range`, cutting the LEVEL on every step at erase strength —
        // the wall, the pillar and the mezzanine in the path all go, and the
        // hole it leaves is a real change to the map (destruct owns the
        // colliders). Anyone standing on the line takes the whole thing.
        const fw = caster.forward();
        const range = opts.range ?? 15, width = opts.width ?? 2.2;
        m.fx.worldCut(caster, fw, range, width);
        m.sfx.worldCut();
        m.stage.flash(0.5);
        m.cam.shake(1.1);
        m.cam.fovKick(10);
        m.hitstop(12);
        const steps = opts.destroySteps ?? 16;
        for (let i = 1; i <= steps; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.2).addScaledVector(fw, i * (opts.destroyStep ?? 1.0)),
            opts.destroyRadius ?? 2.6, opts.destroyPower ?? 150);
        }
        m.arena?.splash?.(caster.pos.x + fw.x * 4, caster.pos.z + fw.z * 4, 2.4);
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          const pad = f.hurtBox.pad;   // scaled by growth stage
          if (!sure && !(along > -0.6 && along < range && perp < width + pad)) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 46) * mult, { canCrit: false });
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 9, kbY: opts.kbY ?? 4,
            hitstun: opts.hitstun ?? 46, type: 'knockdown', dir: fw
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { heavy: true, knockdown: true });
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.4, (opts.dmg ?? 46) * 0.8, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.4, (opts.dmg ?? 46) * 0.8, caster);
        break;
      }

      // =====================================================================
      // SUKUNA
      // =====================================================================
      case 'sukuna_dismantle': {
        // DISMANTLE 解 — a crossing slash fired down a line. It "cuts anything
        // without regard for what it is", so the ENVIRONMENT on the line takes
        // the same cut the opponent does, stepped out to full range. It is a
        // neutral tool, not an ultimate: normal destruct power, not `erase`.
        // ...and now the cut RACES rather than simply existing: a wavefront
        // of red crosses tearing down the line at 26 m/s, cutting the level
        // as it reaches it instead of all at once. Near-instant up close,
        // genuinely dodgeable at the far end of its thirteen metres — range
        // is no longer free.
        const fw = caster.forward();
        const range = (opts.range ?? 13) * fingerRange(caster);
        const width = opts.width ?? 1.4;
        m.fx.dismantleSlash(caster, fw, Math.min(range, 3), width);   // the swing itself
        m.sfx.dismantle();
        m.cam.shake(0.42);
        m.cam.fovKick(4);
        this.entities.push({
          type: 'dismantleWave', caster, sure, dir: fw,
          pos: caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(fw, 0.6),
          spd: opts.waveSpeed ?? 26, travelled: 0, range, width,
          dmg: (opts.dmg ?? 16) * mult * fingerDmg(caster),
          kb: opts.kb ?? 5, kbY: opts.kbY ?? 1.2, hitstun: opts.hitstun ?? 26,
          destroyRadius: opts.destroyRadius ?? 1.9, destroyPower: opts.destroyPower ?? 95,
          hit: new Set(), hitOpts, fxT: 0
        });
        m.arena?.splash?.(caster.pos.x + fw.x * 3, caster.pos.z + fw.z * 3, 1.4);
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.35), range * 0.35,
          (opts.dmg ?? 16) * 0.8, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.35), range * 0.35,
          (opts.dmg ?? 16) * 0.8, caster);
        break;
      }

      case 'sukuna_cleave': {
        // CLEAVE 捌 — the same technique, aimed at a person instead of at the
        // world. It ADJUSTS TO THE TARGET'S CURSED ENERGY: the more MAX_CE
        // they have banked, the deeper it goes. The number is shown on screen
        // because a scaling move nobody can see scaling is just a random
        // damage roll to whoever is on the receiving end.
        const reach = (opts.reach ?? 2.6) * fingerRange(caster);
        const arc = opts.arc ?? 1.7;
        if (!sure && !inArc(caster, t, reach, arc)) {
          // a whiffed Cleave is the single biggest punish window he offers
          m.sfx.whiff();
          m.fx.cleaveCut(caster, caster, 0);
          break;
        }
        const scaled = cleaveDamage(caster, t, opts);
        const { dmg, crit } = computeDamage(caster, scaled.dmg * mult * fingerDmg(caster));
        const r = t.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 4.5, kbY: opts.kbY ?? 1.0,
          hitstun: opts.hitstun ?? 30, type: 'heavy'
        }, m.ctxFor(caster));
        m.fx.cleaveCut(caster, t, scaled.depth);
        m.sfx.cleaveCut(scaled.depth);
        hitFeedback(m, caster, t, r, { crit, heavy: true });
        m.arena?.destruct?.damageAt(t.pos.clone().setY(1.2), opts.destroyRadius ?? 2.6, opts.destroyPower ?? 80);
        m.cam.shake(0.4 + scaled.depth * 0.5);
        m.cam.fovKick(4 + scaled.depth * 6);
        if (scaled.depth > 0.55) m.hitstop(8 + Math.round(scaled.depth * 8));
        // THE INDICATOR. Both players get to read why it hurt that much.
        if (r === 'hit' || r === 'otg' || r === 'armor') {
          m.hud.techFlash(scaled.label, 0xff2f45);
          m.hud.toast(t, scaled.toast);
        }
        break;
      }

      case 'sukuna_firearrow': {
        // FIRE ARROW 開 — the charge is over. A screen-crossing column of
        // flame that ERASES what it passes through: unlike Dismantle this does
        // not care about an object's hp, exactly like Hollow Purple.
        const fw = caster.forward();
        const range = opts.range ?? 40, width = opts.width ?? 2.0;
        m.fx.fireArrowBeam(caster, fw, range, width);
        m.sfx.fireArrow();
        m.stage.flash(0.85);
        m.cam.shake(1.3);
        m.cam.fovKick(13);
        m.hitstop(16);
        m.slowmo(0.45, 0.4);
        const steps = opts.destroySteps ?? 34;
        for (let i = 1; i <= steps; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.3).addScaledVector(fw, i * (opts.destroyStep ?? 1.2)),
            opts.destroyRadius ?? 2.6, 1, { kind: 'erase' });
        }
        m.arena?.splash?.(caster.pos.x + fw.x * 5, caster.pos.z + fw.z * 5, 2.6);
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          const pad = f.hurtBox.pad;   // scaled by growth stage
          if (!sure && !(along > -0.6 && perp < width + 0.6 + pad)) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 62) * mult * fingerDmg(caster), { canCrit: false });
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 10, kbY: opts.kbY ?? 4.5,
            hitstun: opts.hitstun ?? 46, type: 'knockdown', unblockable: true, dir: fw,
            // FIRE ARROW IS FIRE. Hanami's vulnerability applies, exactly as
            // it does to Jogo — the flag is on the damage, not on the caster.
            elem: 'fire'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { heavy: true, knockdown: true });
        }
        // ...and it burns the ground it crosses
        for (let i = 1; i <= 8; i++) {
          m.flora?.damageFieldsAt(caster.pos.clone().addScaledVector(fw, i * (range / 8)), 3.0, 'fire');
          // FIRE MELTS ICE. Wired beside the line that already tells Hanami's
          // fields they have been burnt, so the two things fire counters are
          // countered at the same call sites and neither can be added without
          // the other being obvious. Fire Arrow is the strongest fire in the
          // game and melts at 1.4x.
          m.ice?.meltAt(caster.pos.clone().addScaledVector(fw, i * (range / 8)), 3.0, 1.4);
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.2), range * 0.2, 999, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.2), range * 0.2, 999, caster);
        break;
      }

      case 'sukuna_finger': {
        // CONSUME A FINGER. No damage and no hitbox — the whole move is the
        // stack, and the vulnerable second that bought it.
        //
        // THE STACK IS TAKEN HERE, on the activation frame, and nowhere else.
        // That placement is the rule: a channel that gets interrupted before
        // frame 58 never reaches this line, so being clipped out of it costs
        // him the second and NOT the finger. (Same shape as Jogo's Overheat,
        // which sets its buff from its own effect case for the same reason.)
        const max = caster.cfg.fingers?.count ?? 4;
        if ((caster.fingers ?? 0) >= max) break;
        caster.fingers = (caster.fingers ?? 0) + 1;
        const n = caster.fingers;
        m.fx.fingerFlare(caster, n);
        m.sfx.fingerBite(n);
        caster.model.setFingers?.(n);
        m.stage.flash(0.25 + n * 0.06);
        m.cam.shake(0.35 + n * 0.12);
        m.cam.fovKick(4 + n);
        const left = (caster.cfg.fingers?.count ?? 4) - n;
        m.hud.toast(caster, '指 FINGER ' + n + '/' + (caster.cfg.fingers?.count ?? 4)
          + (left ? '' : ' — NO MORE'));
        if (n === (caster.cfg.fingers?.fireArrowAt ?? 2)) {
          m.hud.techFlash('開 FIRE ARROW UNLOCKED', 0xff5a1f);
        }
        break;
      }

      // ---- HAKARI: BASE KIT -----------------------------------------------
      case 'hakari_smash': {
        // PACHINKO VOLLEY. He pulls an invisible lever and the machine PAYS:
        // a fan of neon pachinko balls launched down the lane, bouncing off
        // the floor with loose homing, steered by the stick. The last ball is
        // GOLD — the payout ball — and it alone knocks down (otgOk kept, so
        // the volley is still his wake-up tool). The old overhead's damage is
        // split across the rack; eating the whole rack costs slightly more.
        const dir = this._castDir(caster);
        const count = opts.count ?? 6;
        for (let i = 0; i < count; i++) {
          const gold = i === count - 1;
          const spread = (i - (count - 1) / 2) * 0.16;
          const d = dir.clone().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'pachinko', caster, sure, gold,
            pos: caster.pos.clone().add(v3(0, 1.0, 0)).addScaledVector(d, 0.6),
            vel: d.clone().multiplyScalar((opts.speed ?? 14) * rand(0.9, 1.1)).setY(rand(1.5, 3.5)),
            spd: opts.speed ?? 14, homing: opts.homing ?? 1.6,
            dmg: (gold ? (opts.goldDmg ?? 6) : (opts.dmg2 ?? 3.2)) * mult,
            life: opts.lifetime ?? 1.3, delay: i * 0.06, fxT: 0, hitOpts
          });
        }
        m.fx._ring(caster.pos.clone().add(v3(0, 1.1, 0)).addScaledVector(dir, 0.7),
          0x69f0ae, { size: 0.4, growRate: 10, life: 0.3, flat: false });
        m.sfx.ceSmash();
        m.cam.shake(0.35);
        break;
      }
      // BALL DROP 大玉. NOT A PUNCH. He pulls the lever and the machine
      // delivers: a person-sized pachinko ball (real geometry) dropped onto
      // the deck that then ROLLS down a stick-steered lane, bouncing, mowing
      // through whatever it reaches. It is still his approach tool — he walks
      // in behind it — but the thing doing the hitting is the machine.
      case 'hakari_rush': {
        const dir = this._castDir(caster);
        const radius = opts.ballRadius ?? 0.85;
        this.entities.push({
          type: 'ballRoll', caster, sure, dir,
          // dropped AHEAD of him, not on him — he wants to be behind it
          pos: caster.pos.clone().addScaledVector(dir, 2.3).setY(radius + 2.4),
          radius, spd: opts.speed ?? 11, travelled: 0, range: opts.range ?? 12,
          vy: 0, roll: 0, dropped: false,
          dmg: (opts.dmg ?? 9) * mult, kb: opts.kb ?? 4.5, kbY: opts.kbY ?? 1.2,
          hitstun: opts.hitstun ?? 24, hitOpts, hit: new Set(),
          node: m.fx.ballNode(radius, false), fxT: 0
        });
        m.sfx.rushBlow();
        break;
      }
      case 'hakari_shutter': {
        const sp = caster.cfg.special;
        caster.shutterT = sp.duration ?? 4;
        caster.shutterHits = sp.hits ?? 1;
        m.fx.shutterUp(caster, sp);
        m.sfx.shutterUp();
        m.hud.toast(caster, 'SHUTTER');
        m.cam.shake(0.16);
        break;
      }
      // ---- HAKARI: JACKPOT KIT ---------------------------------------------
      case 'hakari_blast': {
        // JACKPOT BLAST — the ranged tool he does not otherwise own. A bar of
        // cursed energy driven down a line, erasing scenery as it goes.
        const fw = caster.forward();
        const range = opts.range ?? 17, width = opts.width ?? 2.0;
        m.fx.jackpotBeam(caster, fw, range, width);
        m.sfx.jackpotBlast();
        m.stage.flash(0.4);
        m.cam.shake(0.8);
        m.cam.fovKick(9);
        for (let i = 1; i <= 16; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.3).addScaledVector(fw, i * (range / 16)), 2.2, 80);
        }
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * fw.x + rel.z * fw.z;
        const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
        const pad = t.hurtBox.pad;   // scaled by growth stage
        if (sure || (along > -0.6 && along < range && perp < width + pad)) {
          const { dmg } = computeDamage(caster, (opts.dmg ?? 30) * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 8, kbY: opts.kbY ?? 3,
            hitstun: opts.hitstun ?? 36, type: 'knockdown', dir: fw
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true, knockdown: true });
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.35, (opts.dmg ?? 30) * 0.7, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.35, (opts.dmg ?? 30) * 0.7, caster);
        break;
      }
      case 'hakari_counter': {
        // Open the stance. The absorb itself happens in Fighter.applyHit; all
        // this does is arm the window and make the invitation visible.
        caster.counterT = opts.window ?? 26;
        m.fx.counterStance(caster);
        m.sfx.counterAbsorb();
        m.hud.toast(caster, 'COUNTER — COME ON');
        break;
      }
      case 'hakari_punish': {
        // the returned blow. Fired from the match event a frame after the
        // absorb, so the read is "he ate it, then he answered it".
        const target = opts.target ?? t;
        if (!target?.alive) break;
        m.fx.ceShockwave(caster, 2.2);
        m.sfx.ceSmash();
        m.sfx.crit();
        m.stage.flash(0.35);
        m.cam.shake(0.9);
        m.cam.fovKick(9);
        m.hitstop(16);
        m.slowmo(0.25, 0.38);
        const { dmg } = computeDamage(caster, (opts.dmg ?? 34) * mult, { canCrit: false });
        const r = target.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 7, kbY: opts.kbY ?? 2,
          hitstun: opts.hitstun ?? 40, type: 'knockdown', unblockable: true, otgOk: true,
          dir: v3(target.pos.x - caster.pos.x, 0, target.pos.z - caster.pos.z).normalize()
        }, m.ctxFor(caster));
        hitFeedback(m, caster, target, r, { heavy: true, knockdown: true });
        m.arena?.destruct?.damageAt(target.pos.clone().setY(1.1), 2.6, 80);
        break;
      }
      case 'hakari_goldrush': {
        // GOLD RUSH: he crosses the arena. The entity owns the travel so the
        // charge keeps damaging the level the whole way, and a connect ends in
        // a wallslam rather than a knockdown in open space.
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 26);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 26);
        caster.iFrames = Math.max(caster.iFrames, 8);
        this.entities.push({
          type: 'goldRush', caster, dir: fw, frames: opts.frames ?? 26,
          dmg: (opts.dmg ?? 24) * mult, kb: opts.kb ?? 9, kbY: opts.kbY ?? 2,
          hitstun: opts.hitstun ?? 40, radius: opts.radius ?? 1.9,
          slamPower: opts.slamPower ?? 160, fxT: 0
        });
        m.sfx.goldRush();
        m.fx.dashTrail(caster);
        m.cam.shake(0.35);
        break;
      }

      // ---- HIGURUMA ------------------------------------------------------
      case 'higuruma_gavel': {
        // VERDICT. The gavel no longer swings — it is PASSED DOWN: an
        // oversized cursed-energy gavel condenses over a marked patch of
        // ground and falls, stamping a court seal where it lands. Aim with
        // the stick exactly like the roster's two eruptions; neutral leads
        // the opponent's feet. Landing it files the blow as evidence, which
        // is the character's whole economy arriving in his damage button.
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 7) * mag);
        } else {
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.delay ?? 0.6) * 0.6);
        }
        at.y = 0;
        const rr = Math.hypot(at.x, at.z);
        const lim = caster.arenaRadius - 0.3;
        if (rr > lim) { at.x *= lim / rr; at.z *= lim / rr; }
        const radius = opts.radius ?? 2.5;
        this.entities.push({
          type: 'gavelDrop', caster, sure, pos: at, t: 0,
          delay: opts.delay ?? 0.6, radius,
          dmg: (opts.dmg ?? 15) * mult, kb: opts.kb ?? 4.2, kbY: opts.kbY ?? 1.2,
          hitstun: opts.hitstun ?? 30, evidence: opts.evidence ?? 5,
          node: m.fx.gavelConstruct(radius), hitOpts, fxT: 0
        });
        m.sfx.gavel?.();
        break;
      }
      case 'higuruma_confiscate': {
        // CONFISCATION: short range, NO DAMAGE. It takes one of their
        // technique buttons away for `lock.duration` seconds — his survival
        // tool, and the only thing about him Yuta bothers to copy.
        m.fx.confiscate?.(caster);
        m.sfx.confiscate?.();
        const lock = opts.lock ?? { duration: 6, evidence: 6 };
        if (sure || inArc(caster, t, opts.reach ?? 1.7, opts.arc ?? 1.2)) {
          // it still has to get through a guard — it is a technique, not a
          // sure-hit, and blocking it is the correct answer
          const r = t.applyHit({
            ...hitOpts, dmg: 0, kb: opts.kb ?? 1.2, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'light'
          }, m.ctxFor(caster));
          if (r === 'hit' || r === 'otg') {
            const slot = t.confiscate(lock.duration);
            m.hud.toast(caster, '没収 CONFISCATED');
            m.fx._ring(t.pos.clone().add(v3(0, 1.3, 0)), 0xd8c78a,
              { size: 0.45, growRate: 7, life: 0.5, flat: false });
            m.sfx.confiscateLand?.();
            m.cam.shake(0.2);
            // filing a seizure is itself evidence
            if (lock.evidence) gainEvidence(caster, lock.evidence);
            void slot;
          } else {
            hitFeedback(m, caster, t, r, {});
          }
        } else {
          m.sfx.whiff();
        }
        break;
      }
      case 'higuruma_judgeman': {
        m.judgemen?.spawn(caster);
        m.sfx.judgemanSummon?.();
        m.hud.toast(caster, '審判 JUDGEMAN');
        m.fx._ring(caster.pos.clone().addScaledVector(caster.forward(), -1.4).setY(0.06),
          0x8fb6d8, { size: 0.4, growRate: 6, life: 0.6 });
        break;
      }
      case 'higuruma_judgment_slash': {
        // JUDGMENT SLASH — the opener. A wide sweeping cut with real reach
        // that launches, and it does NOT resolve the domain: it exists to put
        // them somewhere the thrust can reach.
        m.fx.judgmentArc?.(caster, opts.reach ?? 3.2);
        m.sfx.swordSwing();
        m.cam.shake(0.3);
        for (let i = -1; i <= 1; i++) {
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), i * 0.5);
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.2).addScaledVector(dir, (opts.reach ?? 3.2) * 0.7), 2.2, 55);
        }
        // it is a SWEEP: everyone in the arc, not just the nearest
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          if (!sure && !inArc(caster, f, opts.reach ?? 3.2, opts.arc ?? 2.2)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 26) * mult);
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.5, kbY: opts.kbY ?? 7.6,
            hitstun: opts.hitstun ?? 30, type: 'launcher',
            dir: v3(f.pos.x - caster.pos.x, 0, f.pos.z - caster.pos.z).normalize()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { crit, heavy: true });
        }
        break;
      }
      case 'higuruma_execution': {
        // EXECUTION — the committed thrust. The connect window is an entity so
        // that whiffing is a real, punishable event; a connection hands off to
        // the domain system, which runs the duel that decides everything.
        m.sfx.executionSwing?.();
        m.fx.executionThrust?.(caster);
        this.entities.push({
          type: 'execHit', caster, frames: opts.active ?? 6,
          reach: opts.reach ?? 2.6, arc: opts.arc ?? 1.1
        });
        break;
      }


      // =====================================================================
      // TOJI — THE ARSENAL
      // =====================================================================
      // None of these is a cursed technique. They are a man hitting somebody
      // with an object, and they are tagged accordingly for adaptation (see
      // EFFECT_SRC): each WEAPON is its own category, so adapting to Playful
      // Cloud does nothing whatsoever about the Split Soul Katana.

      // PLAYFUL CLOUD — spinning multi-hit sweep. Hits everything around him,
      // so it is the one move of his that resolves on a RADIUS rather than an
      // arc: there is no behind-him to escape to.
      case 'toji_cloud_sweep': {
        // CLOUD CYCLONE. The three-section staff opened out and SPUN: an
        // entity that whirls around him for half a second, ticking on
        // everything in the circle while he keeps (slowed) control of his
        // feet — a moving no-man's-land instead of a single radius check.
        // Same total damage as the old sweep, arriving as the canonical
        // flurry rather than one invisible tap.
        m.sfx.swordSwing();
        m.cam.shake(0.14);
        this.entities.push({
          type: 'staffSpin', caster, sure,
          t: 0, dur: opts.duration ?? 0.55, radius: opts.radius ?? 2.9,
          tick: 0, interval: (opts.duration ?? 0.55) / (opts.hits ?? 4),
          dmg: (opts.dmg ?? 6) * mult, kb: opts.kb ?? 2.6, kbY: opts.kbY ?? 0.4,
          hitstun: opts.hitstun ?? 15, ang: caster.facing, hitOpts, fxT: 0,
          // the staff itself, whirling: real three-section geometry rather
          // than a bar of light where a staff would be
          node: m.fx.staffNode((opts.radius ?? 2.9) * 0.95)
        });
        break;
      }

      // PLAYFUL CLOUD — the full-body overhead slam. Huge damage and a GUARD
      // BREAK: it does not go through the guard, it takes the guard away, which
      // is the correct shape for a blunt weapon and leaves blocking as a real
      // (if losing) option rather than a dead one.
      case 'toji_cloud_slam': {
        // THE FISSURE. The staff comes down on the DECK, not on a person, and
        // the deck splits: a run of stone slabs driven up along a line ahead
        // of him (real geometry), travelling out to seven metres. The guard
        // break is unchanged — but he is now breaking the floor to do it, and
        // it reaches far past the old 2.5 m arc.
        const dir = this._castDir(caster);
        m.fx.staffSlamCrack(caster, dir, opts.reach ?? 2.5);
        m.sfx.cleave(true);
        m.cam.shake(0.55); m.cam.fovKick(5);
        this.entities.push({
          type: 'fissure', caster, sure, dir,
          pos: caster.pos.clone().setY(0).addScaledVector(dir, 1.0),
          spd: opts.fissureSpeed ?? 16, travelled: 0, range: opts.fissureRange ?? 7,
          step: 1.0, nextAt: 0, radius: opts.fissureRadius ?? 1.4,
          dmg: (opts.dmg ?? 21) * mult, kb: opts.kb ?? 6.2, hitstun: opts.hitstun ?? 34,
          guardBreak: !!opts.guardBreak, dealt: false, hitOpts
        });
        // he still connects point-blank on the swing itself
        if (sure || inArc(caster, t, opts.reach ?? 2.5, opts.arc ?? 1.5)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 21) * mult);
          // the guard break is applied BEFORE the hit resolves, so the hit that
          // breaks it also lands clean rather than being chipped
          const guarding = t.state === 'block' || t.state === 'blockstun';
          if (guarding && opts.guardBreak) {
            t.res.stamina = 0;
            t.setState('guardBreak', { clip: 'guardBreak' });
            t.emit('guardBreak');
            m.hud.toast(caster, 'GUARD BROKEN');
          }
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.2, kbY: 0,
            hitstun: opts.hitstun ?? 34, type: 'knockdown'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
        }
        break;
      }

      // INVERTED SPEAR — the fast piercing thrust. Long, thin, and nothing
      // special: it is the poke that makes carrying the spear survivable, and
      // it deliberately does NOT nullify anything.
      case 'toji_spear_thrust': {
        // The thrust drawn as what it is: a VACUUM LANCE — a thin hard line
        // of white driven down the spear's whole length in one frame, and a
        // line test to match, so the visual and the hitbox are the same
        // object. Slightly longer than the old arc, twice as easy to
        // sidestep; the trade is the point of the weapon.
        const dir = caster.forward();
        const range = (opts.reach ?? 4.2) * caster.reachScale;
        // the spear ITSELF, as an object: real geometry driven down the line
        // and pulled back, rather than a flash where a spear would have been
        const spear = m.fx.spearNode(range * 0.75);
        const origin = caster.pos.clone().add(v3(0, 1.25, 0));
        spear.position.copy(origin);
        spear.quaternion.setFromUnitVectors(v3(0, 0, 1), dir);
        m.fx.prop(spear, 0.28, (n, k) => {
          // out fast, back slower — the thrust and the recovery
          const ext = k < 0.4 ? k / 0.4 : 1 - (k - 0.4) / 0.6;
          n.position.copy(origin).addScaledVector(dir, range * 0.35 * ext);
        });
        m.fx.spearLance(origin.clone(), dir, range);
        m.sfx.lunge();
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * dir.x + rel.z * dir.z;
        const perp = Math.abs(rel.x * dir.z - rel.z * dir.x);
        if (sure || (along > -0.3 && along < range && perp < (opts.width ?? 0.75) + (t.hurtBox?.radius ?? 0.62))) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 12) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 3.0, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
        }
        break;
      }

      // =====================================================================
      // INVERTED SPEAR — NULLIFY 強制解除
      // =====================================================================
      // "Upon contact with the Inverted Spear of Heaven's blade, any active
      // cursed technique is immediately nullified." Here that means three
      // things, applied in this order:
      //
      //   1. an ACTIVE DOMAIN owned by the target is cancelled outright —
      //      barrier, payload, playspace and all. See domains.nullify().
      //   2. every active TECHNIQUE BUFF on them is stripped.
      //   3. their ct1 and ct2 are SEALED for `lockDuration` seconds.
      //
      // The cooldown it pays depends on what it actually achieved: cancelling
      // a domain is the big one and costs the full `cooldownOnCancel`, while a
      // hit that found nothing to cancel costs the much shorter
      // `cooldownOnHit`. That asymmetry is what stops it being a strictly
      // better poke than the thrust when the opponent has nothing up.
      case 'toji_nullify': {
        // the blade itself: a short hard lance line in the spear's green
        m.fx.spearLance(caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(caster.forward(), 0.3),
          caster.forward(), (opts.reach ?? 1.7) + 0.6);
        m.sfx.cleave();
        const def = caster.equipped?.ct2 ?? opts;
        const hit = sure || inArc(caster, t, opts.reach ?? 1.7, opts.arc ?? 0.9);
        if (!hit) {
          // A WHIFF COSTS NOTHING BUT THE FRAMES. No cooldown is charged for
          // missing — the 38 frames of recovery are already the punish, and
          // charging the cooldown too would make one bad read cost the round.
          caster.emit('nullifyWhiff');
          break;
        }
        const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 10) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 2.2, kbY: 0,
          hitstun: opts.hitstun ?? 26, type: 'heavy'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit, heavy: true });
        // it has to CONNECT — a blocked or i-framed spear cancels nothing
        if (r === 'hit' || r === 'armor') {
          // the technique being TURNED OFF: a real collapsing seal construct
          // clamped around them — rings and cardinal bars closing to nothing
          m.fx.nullifySealAt(t.pos.clone(), 1.5);
          const res = m.domains.nullify(t, caster);
          caster.nullifyCD = res.cancelled ? (def.cooldownOnCancel ?? 9) : (def.cooldownOnHit ?? 4);
          t.ctSealT = Math.max(t.ctSealT, def.lockDuration ?? 5);
          m.stage.flash(res.cancelled ? 0.55 : 0.2);
          m.cam.shake(res.cancelled ? 0.8 : 0.3);
          m.hud.techFlash(res.label, 0x6ea88a);
          if (res.cancelled) m.hitstop(16);
          caster.emit('nullifyLand', res);
        }
        break;
      }

      // SPLIT SOUL KATANA — the fast slashing string. Lower raw damage than
      // Playful Cloud, which is the trade for how quickly it comes out.
      case 'toji_soul_slash': {
        // the fast string, now genuinely TWO cuts: the blade passes, and the
        // phantom of the same cut arrives on the soul a beat behind it. Same
        // total damage as the old single tick, split 4 + 3.
        m.fx.soulSlashArc(caster);
        // the cut as an object: a soul-blue blade plane swept through the arc
        this._sweepBlade(caster, (opts.reach ?? 2.6) * 1.1, false);
        m.sfx.swordSwing();
        if (sure || inArc(caster, t, opts.reach ?? 2.6, opts.arc ?? 1.9)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * 0.57 * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.0, kbY: 0,
            hitstun: opts.hitstun ?? 16, type: 'light'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
          this.entities.push({
            type: 'soulEcho', caster, t: 0.13, sure,
            reach: (opts.reach ?? 2.6) * 1.15, arc: (opts.arc ?? 1.9) * 1.1,
            dmg: (opts.dmg ?? 7) * 0.43 * mult, hitstun: 14, hitOpts
          });
        }
        break;
      }

      // SPLIT SOUL KATANA — THE SOUL CUT. Ignores blocking entirely (it is
      // flagged `unblockable`, which applyHit honours above every guard branch)
      // and leaves a lingering debuff on their damage OUTPUT. Chip-through
      // pressure: the damage number stays modest because bypassing a guard is
      // the reward and paying twice would be too much.
      case 'toji_soul_cut': {
        m.fx.soulSlashArc(caster, true);
        this._sweepBlade(caster, (opts.reach ?? 2.7) * 1.15, true);
        m.sfx.cleave();
        m.cam.shake(0.3);
        if (sure || inArc(caster, t, opts.reach ?? 2.7, opts.arc ?? 1.6)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 13) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.4, kbY: 0,
            hitstun: opts.hitstun ?? 24, type: 'heavy', unblockable: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'armor') {
            const d = opts.debuff ?? { duration: 7, dmgMult: 0.74 };
            t.soulCut = { t: d.duration, mult: d.dmgMult };
            // the soul knocked out of register — the same grey silhouette
            // Mahito's touch pulls, because it is the same substance cut
            m.fx.soulRip(t.pos.clone());
            m.hud.toast(t, '釈魂 SOUL CUT');
          }
        }
        break;
      }

      // CHAIN — the long whip strike. His only real ranged option, and the
      // reason he is not simply free money for a zoner.
      case 'toji_chain_whip': {
        // the chain DRAWN: a run of link motes whipped out to the tip, with
        // a crack ring where it lands
        const hand = caster.pos.clone().add(v3(0, 1.3, 0));
        const connect = sure || inArc(caster, t, opts.reach ?? 7.0, opts.arc ?? 0.55);
        const tip = connect
          ? t.pos.clone().add(v3(0, 1.2, 0))
          : hand.clone().addScaledVector(caster.forward(), opts.reach ?? 7.0);
        m.fx.chainLinks(hand, tip);
        // the chain as an OBJECT: real links whipped out to the tip and
        // hauled back in, laid between his hand and wherever it reached
        const chain = m.fx.chainNode(16);
        m.fx.prop(chain, 0.3, (n, k) => {
          const ext = k < 0.35 ? k / 0.35 : 1 - (k - 0.35) / 0.65;
          m.fx.layChain(n, caster.pos.clone().add(v3(0, 1.3, 0)),
            hand.clone().lerp(tip, Math.max(0.05, ext)));
        });
        m.sfx.swordSwing();
        if (connect) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 11) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 3.4, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
        }
        break;
      }

      // CHAIN — THE SNARE. Which way it closes is decided by DISTANCE, not by
      // a second button: past `pullFrom` it hauls HIM to THEM (the approach
      // tool against a zoner), inside it, it hauls THEM to HIM (the reset when
      // somebody is trying to walk away). One input, two answers, and the
      // answer you get is a consequence of where you were standing.
      case 'toji_chain_snare': {
        m.sfx.lunge();
        const d = flatDist(caster.pos, t.pos);
        if (!(sure || inArc(caster, t, opts.reach ?? 8.5, opts.arc ?? 0.5))) break;
        const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 8) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg, kb: 0, kbY: 0,
          hitstun: opts.hitstun ?? 30, type: 'heavy'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit });
        if (r !== 'hit' && r !== 'armor') break;
        // the chain drawn taut between the two of them before anyone moves,
        // and held there as real links for the whole haul
        m.fx.chainLinks(caster.pos.clone().add(v3(0, 1.3, 0)), t.pos.clone().add(v3(0, 1.2, 0)));
        const snare = m.fx.chainNode(20);
        m.fx.prop(snare, 0.35, (n) => {
          m.fx.layChain(n, caster.pos.clone().add(v3(0, 1.3, 0)), t.pos.clone().add(v3(0, 1.2, 0)));
        });
        const gap = opts.endGap ?? 1.5;
        const dir = t.pos.clone().sub(caster.pos).setY(0).normalize();
        if (d > (opts.pullFrom ?? 5.5)) {
          // FAR: he goes to them.
          const dest = t.pos.clone().addScaledVector(dir, -gap);
          dest.y = caster.pos.y;
          caster.pos.copy(dest); caster.prevPos.copy(dest);
          m.hud.toast(caster, '万里ノ鎖 — PULLED IN');
        } else {
          // CLOSE: they come to him.
          const dest = caster.pos.clone().addScaledVector(dir, gap);
          dest.y = t.pos.y;
          t.pos.copy(dest); t.prevPos.copy(dest);
          t.vel.set(0, 0, 0);
          m.hud.toast(caster, '万里ノ鎖 — HAULED');
        }
        m.fx.dashTrail(caster);
        m.cam.shake(0.25);
        break;
      }

      // =====================================================================
      // ASSASSINATION 術師殺し
      // =====================================================================
      // The blitz. This case fires on the ACTIVATION frame and only decides
      // whether he connected; the four-weapon sequence that follows is queued
      // as a timed entity so each strike lands on its own beat rather than all
      // at once. A whiff falls through to the move's own `whiffRecovery`.
      case 'toji_assassinate': {
        const u = caster.cfg.ultimate;
        const fw = caster.forward();
        caster.vel.x = fw.x * (u.blitzSpeed ?? 21);
        caster.vel.z = fw.z * (u.blitzSpeed ?? 21);
        m.fx.dashTrail(caster);
        m.sfx.lunge();
        // the connect window travels with him for the blitz frames
        this.entities.push({
          type: 'tojiBlitz', caster, frames: u.blitzFrames ?? 14,
          reach: u.reach ?? 2.0, arc: u.arc ?? 1.2
        });
        break;
      }

      // =====================================================================
      // HANAMI — DISASTER PLANTS
      // =====================================================================
      // ROOT ERUPTION. Deliberately the same SHAPE as Jogo's Volcanic
      // Eruption — aim with the stick, neutral leads their feet, a growing
      // marker telegraphs it — because the two are the roster's two ground
      // traps and a player who has learned one should read the other. Where
      // it differs: it LAUNCHES, and the ground it comes out of matters.
      // (That header belongs to `hanami_roots`, which is a few hundred lines
      // below now — the three new characters were inserted between the two.)

      // =====================================================================
      // MAKI ZENIN — THE TWO CURSED TOOLS
      // =====================================================================
      // Both weapons are Toji's, inherited, so the FX are deliberately his
      // too: `staffSpinTick` / `staffSlamCrack` for the Playful Cloud and
      // `soulSlashArc` / `_sweepBlade` for the katana. What differs is the
      // TIMING and the SHAPE of every one of them, which is the "she swings
      // it differently" note in the brief, and the timing lives in the frame
      // data and the clips rather than here.

      // PLAYFUL CLOUD SWEEP — two committed level arcs she steps into. Where
      // Toji's Cloud Cyclone is a spin AROUND him resolved as a radius test,
      // hers is a WIDE FORWARD ARC resolved as an arc test: same weapon,
      // different intent, and the hitbox says so.
      case 'maki_cloud_sweep': {
        const hits = opts.hits ?? 2;
        m.sfx.swordSwing();
        m.cam.shake(0.22);
        for (let k = 0; k < hits; k++) {
          this.entities.push({
            type: 'makiSweep', caster, t: k * 0.16, sure,
            reach: opts.reach ?? 3.1, arc: opts.arc ?? 2.4,
            dmg: (opts.dmg ?? 8) * mult, kb: opts.kb ?? 3.0, kbY: opts.kbY ?? 0.3,
            hitstun: opts.hitstun ?? 18, guardDamage: opts.guardDamage ?? 22,
            hitOpts, side: k % 2 ? -1 : 1
          });
        }
        break;
      }

      // CRUSHING ARC — the overhead. Breaks a guard outright, which is what
      // "guard pressure" means on the descriptor, and takes a real bite out
      // of the level on the way through.
      case 'maki_cloud_crush': {
        m.fx.staffSlamCrack?.(caster, caster.forward(), opts.reach ?? 2.6);
        // the overhead gets the DOWNWARD cone: weight arriving, not an
        // explosion leaving
        massSlamCone(m.fx,
          caster.pos.clone().addScaledVector(caster.forward(), 1.7).setY(caster.pos.y),
          0.5, 0x5fae7a);
        m.sfx.impact?.();
        m.cam.shake(0.55);
        m.cam.fovKick(6);
        m.arena?.destruct?.damageAt(
          caster.pos.clone().addScaledVector(caster.forward(), 1.8).setY(0.4),
          2.4, opts.destruct ?? 42);
        if (sure || inArc(caster, t, opts.reach ?? 2.6, opts.arc ?? 1.5)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 19) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.4, kbY: 0,
            hitstun: opts.hitstun ?? 32, type: 'heavy', guardBreak: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
        }
        break;
      }

      // SLASHING STRING — three cuts on one breath. The one move of hers that
      // is SUPPOSED to feel like Toji's, and it is deliberately the closest
      // thing in either kit to the other: same weapon, same intent, one extra
      // hit and less damage per hit.
      case 'maki_soul_string': {
        const hits = opts.hits ?? 3;
        m.fx.soulSlashArc(caster);
        this._sweepBlade(caster, (opts.reach ?? 2.5) * 1.1, false);
        m.sfx.swordSwing();
        for (let k = 0; k < hits; k++) {
          this.entities.push({
            type: 'makiCut', caster, t: k * 0.09, sure,
            reach: opts.reach ?? 2.5, arc: opts.arc ?? 1.8,
            dmg: (opts.dmg ?? 5) * mult, kb: opts.kb ?? 1.9,
            hitstun: opts.hitstun ?? 15, hitOpts
          });
        }
        break;
      }

      // ---- SPLIT SOUL STRIKE 釈魂 ------------------------------------------
      // Her signature, and the mirror of Toji's Soul Cut rather than a copy of
      // it. Both are unblockable soul cuts that leave a lingering debuff, and
      // the debuffs point in OPPOSITE DIRECTIONS:
      //
      //   TOJI's `soulCut`   multiplies the victim's damage OUTPUT down. It
      //                      makes them weaker.
      //   MAKI's `soulSplit` multiplies the victim's damage INTAKE up. It
      //                      makes them softer.
      //
      // They read on `dmgMult` and `incomingMult` respectively, so the two
      // never touch the same number and stacking both is additive rather than
      // multiplicative in the dangerous direction. That was checked
      // deliberately: two soul-cut debuffs on one multiplier would have been
      // the degenerate case.
      case 'maki_split_soul': {
        // THE SOUL CUT: two planes, offset, the second arriving late and in a
        // colder colour — the whole fiction is that it hits something the body
        // is not, so the second one is not quite where the first one was.
        soulCleave(m.fx, caster, { reach: opts.reach ?? 2.8, color: 0x8fe0b4 });
        m.fx.soulSlashArc(caster, true);
        this._sweepBlade(caster, (opts.reach ?? 2.8) * 1.15, true);
        m.sfx.cleave();
        m.cam.shake(0.34);
        m.hitstop(6);
        if (sure || inArc(caster, t, opts.reach ?? 2.8, opts.arc ?? 1.5)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 15) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.6, kbY: 0,
            hitstun: opts.hitstun ?? 26, type: 'heavy', unblockable: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'armor') {
            const d = opts.debuff ?? { duration: 8, incomingMult: 1.22 };
            t.soulSplit = { t: d.duration, mult: d.incomingMult };
            m.fx.soulRip(t.pos.clone());
            m.hud.toast(t, '釈魂 SOUL SPLIT');
          }
        }
        break;
      }

      // ---- BEYOND THE ZENIN — the awakening ultimate ----------------------
      // A single overwhelming committed assault with both weapons. Gated on
      // maximum awakening rather than on a bar (she has none), usable once a
      // round, and it is the thing the whole meter has been climbing toward.
      case 'maki_beyond': {
        const u = caster.cfg.ultimate;
        m.cam.shake(0.9);
        m.cam.fovKick(12);
        m.stage.flash(0.30);
        m.sfx.ultimate?.();
        this.entities.push({
          type: 'makiAssault', caster, t: 0,
          frames: (u.active ?? 90), seq: u.sequence.map(x => ({ ...x, done: false })),
          reach: u.reach ?? 3.0, arc: u.arc ?? 1.6, destruct: u.destruct ?? 70, mult
        });
        break;
      }

      // =====================================================================
      // YUKI TSUKUMO — STAR RAGE
      // =====================================================================
      // Both techniques SPEND MASS, and the spend is taken here — on the
      // activation frame — rather than at the press. An interrupted Mass Slam
      // should cost the cursed energy (spent on the press like every other
      // technique) and NOT the mass, because the mass was never released.
      // Same ruling combat/effects.js already applies to Kashimo's Discharge
      // Strike, and for the same reason.

      // MASS SLAM — the heavy overhead, chargeable. Cracks the ground and the
      // destructible geometry, and the screen shake is scaled to the spend so
      // the PLAYER feels how much they just cashed.
      case 'yuki_mass_slam': {
        const ms = spendMass(caster, { fraction: 1 });
        const at = caster.pos.clone().addScaledVector(caster.forward(), 1.7).setY(caster.pos.y);
        // THE CONE, scaled by the spend — a full-mass slam drops a visibly
        // bigger volume of compressed ground than an unloaded one, which is
        // how the player reads what they just cashed without a number
        massSlamCone(m.fx, at, ms.k, 0x6f7fd0);
        m.fx.staffSlamCrack?.(caster, caster.forward(), opts.reach ?? 2.6);
        m.fx.quakeTick?.(at, 1 + ms.k);
        m.sfx.impact?.();
        m.cam.shake(0.5 * ms.shake);
        m.cam.fovKick(6 * ms.shake);
        if (ms.k > 0.5) m.stage.flash(0.10 * ms.k);
        m.hitstop(Math.round(6 + 10 * ms.k));
        // THE GROUND. Scaled by the spend, so a full-mass slam takes a
        // genuine bite out of the level rather than scuffing it.
        m.arena?.destruct?.damageAt(at, (opts.quakeRadius ?? 3.4) * (1 + ms.k * 0.5),
          (opts.destruct ?? 62) * ms.destruct);
        if (sure || inArc(caster, t, opts.reach ?? 2.6, opts.arc ?? 1.7)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 20) * ms.dmg * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: (opts.kb ?? 5.0) * ms.kb, kbY: opts.kbY ?? 0,
            hitstun: opts.hitstun ?? 32, type: ms.k > 0.6 ? 'knockdown' : 'heavy',
            guardDamage: 20 * ms.guard
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: ms.k > 0.6 });
        }
        break;
      }

      // ---- COMMAND GRAB ---------------------------------------------------
      // The roster's proper grappler tool. Unblockable, and it whiffs
      // entirely on an airborne target — jumping is the primary counterplay
      // and it has to be a HARD miss rather than a reduced hit, or the
      // counterplay would only be a damage reduction.
      case 'yuki_command_grab': {
        const airborne = t && !t.grounded;
        const reachable = t && flatDist(caster.pos, t.pos) < (opts.reach ?? 2.4) + 0.4;
        if (!t || !t.alive || airborne || (!sure && !reachable)) {
          // THE WHIFF. Announced, because a 26-frame unblockable that misses
          // silently reads as a bug rather than as the punish window it is.
          m.hud.toast(caster, airborne ? 'GRAB WHIFFED' : 'GRAB MISSED');
          m.sfx.whiff?.();
          break;
        }
        const ms = spendMass(caster, { fraction: 1 });
        m.sfx.grab?.() ?? m.sfx.impact?.();
        m.hitstop(10);
        m.cam.shake(0.35 * ms.shake);
        // the catch, then the slam. Two hits so the cinematic has a shape and
        // so an armour check happens once rather than twice.
        const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 22) * ms.dmg * mult);
        const dir = v3(t.pos.x - caster.pos.x, 0, t.pos.z - caster.pos.z).normalize();
        const r = t.applyHit({
          ...hitOpts, dmg, kb: 0, kbY: 0, hitstun: opts.hitstun ?? 44,
          type: 'heavy', unblockable: true
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit, heavy: true });
        if (r === 'hit' || r === 'armor' || r === 'block') {
          this.entities.push({
            type: 'yukiSlam', caster, target: t, t: (opts.grabFrames ?? 46) / 120,
            dmg: (opts.slamDmg ?? 16) * ms.dmg * mult, ms, dir,
            destruct: (opts.destruct ?? 54) * ms.destruct, hitOpts
          });
        }
        break;
      }

      // ---- BLACK HOLE — the ultimate ---------------------------------------
      // Star Rage at maximum output, past its own safety limits, until the
      // accumulated virtual mass collapses. In canon this kills her; here it
      // costs `selfDmg`, which is the largest self-damage number in the game
      // and the honest reading of a technique that is a suicide move.
      //
      // The signature is that it MOVES THE LEVEL. Nothing else in this game
      // does — destructible geometry is torn off the map and pulled in, which
      // is why the effect looks unlike anything else here.
      case 'yuki_black_hole': {
        const u = caster.cfg.ultimate;
        const at = caster.pos.clone().addScaledVector(caster.forward(), u.offset ?? 3.2);
        at.y = caster.pos.y + 1.6;
        m.sfx.ultimate?.();
        m.cam.shake(1.4);
        m.cam.fovKick(-18);           // the FOV pulls IN, not out — it is a well
        m.stage.flash(0.16);
        // she pays for it immediately, so an interrupted collapse still cost
        // her the health as well as the bar
        caster.res.hp = Math.max(1, caster.res.hp - (u.selfDmg ?? 18));
        m.hud.toast(caster, '星の怒り・極');
        // THE SINGULARITY ITSELF: a dark core over an accretion disc under a
        // lensing ring. The core is drawn with NORMAL blending over an
        // additive disc, so the middle is genuinely darker than the world
        // behind it — which is the one thing in this project that a particle
        // system cannot do at all.
        const core = singularity(m.fx, at, (u.pullDuration ?? 1.35) + 0.2, 0x6f7fd0);
        this.entities.push({
          type: 'blackHole', caster, pos: at, t: 0,
          dur: u.pullDuration ?? 1.35, def: u, mult, fired: false,
          core, debris: []
        });
        break;
      }

      // =====================================================================
      // KASUMI MIWA — NEW SHADOW STYLE
      // =====================================================================

      // ---- THE DRAW --------------------------------------------------------
      // One line, one frame of contact. Resolved as a LINE rather than an arc
      // — the blade goes THROUGH, and the same line test Toji's Vacuum Lance
      // uses means the picture and the hitbox are the same object.
      //
      // `drawTier` was stamped onto the move by `startCT` at the moment of the
      // press; the damage and reach on `opts` already carry the multiplier, so
      // nothing here has to look back at a timer that has been cleared.
      case 'miwa_draw': {
        const reach = opts.reach ?? 3.2;
        const fw = caster.forward();
        const from = caster.pos.clone().setY(caster.pos.y + 1.1);
        const to = from.clone().addScaledVector(fw, reach);
        // ---- THE CUT: ONE PLANE, HELD ---------------------------------
        // No sweep, no particles, no second layer. An iai cut has already
        // happened by the time you can see it, and every extra element would
        // be the effect explaining itself. See fx/newfx.js `iaiLine`.
        iaiLine(m.fx, from, fw, reach, { tier: opts.drawTier ?? 0 });
        m.sfx.cleave();
        m.cam.shake(0.30 + (opts.drawTier ?? 0) * 0.16);
        m.hitstop(4 + (opts.drawTier ?? 0) * 4);
        if (opts.drawTierName) m.hud.toast(caster, opts.drawTierName);
        m.arena?.destruct?.damageAt(to.clone().setY(0.4), 1.6, opts.destruct ?? 40);
        // ---- THE GUARANTEE -----------------------------------------------
        // Inside her circle the line test is skipped entirely and the hit is
        // flagged `sureHit`. Outside it, this is an ordinary — if long —
        // sword swing that can be blocked like anybody's.
        const guaranteed = m.newshadow?.shouldGuarantee(caster, t, 'miwa_draw') ?? false;
        // the same along/perpendicular decomposition `toji_spear_thrust` uses,
        // so the two line techniques in this file resolve identically
        let online = false;
        if (t) {
          const rel = t.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          online = along > -0.3 && along < reach
            && perp < (opts.width ?? 1.05) + (t.hurtBox?.radius ?? 0.62);
        }
        if (sure || guaranteed || online) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 34) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.0, kbY: 0,
            hitstun: opts.hitstun ?? 34, type: 'knockdown',
            sureHit: sure || guaranteed, unblockable: guaranteed || undefined
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: true });
        }
        break;
      }

      // RT is a POSTURE, not a technique — it has no hitbox and no payload, so
      // this case exists only so the dispatcher has an entry for the key and
      // nothing ever falls through silently. The state machine owns the stance
      // entirely (see combat/fighter.js `case 'stance'`).
      case 'miwa_stance': break;

      // ---- THE MAXIMUM DRAW — the ultimate ---------------------------------
      // "The circle expands dramatically, she draws once, and everything
      // inside is cut in a single stroke. One frame of contact, one clean
      // line, then the aftermath."
      //
      // So: NO sequence, NO multi-hit, NO expanding shell. The expansion runs
      // across the STARTUP as the telegraph, this case fires on the last frame
      // of it, and everything inside takes exactly one hit.
      case 'miwa_max_draw': {
        const u = caster.cfg.ultimate;
        const z = m.newshadow?.zoneFor(caster);
        const r = z ? z.radius : (u.radius ?? 11.4);
        const origin = z ? z.origin.clone() : caster.pos.clone();
        m.sfx.cleave();
        m.hitstop(22);
        m.cam.shake(0.5);
        m.stage.flash(0.42);
        // ONE LINE, at full circle width, plus a single ring leaving the
        // perimeter. The restraint IS the effect — a burst here would make her
        // Todo, and the whole design brief for this ultimate is that it is the
        // opposite of Todo's.
        iaiLine(m.fx, origin.clone().addScaledVector(caster.forward(), -r).setY(origin.y + 1.1),
          caster.forward(), r * 2, { tier: 3 });
        m.fx._ring(origin.clone().setY(0.9), 0xffffff,
          { size: r * 0.25, growRate: r * 3.2, life: 0.34, flat: true });
        if (t?.alive && flatDist(t.pos, origin) <= r) {
          const { dmg, crit } = computeDamage(caster, (u.dmg ?? 62) * mult);
          const res = t.applyHit({
            ...hitOpts, dmg, kb: u.kb ?? 7.0, kbY: u.kbY ?? 0,
            hitstun: u.hitstun ?? 44, type: 'knockdown',
            sureHit: true, unblockable: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, res, { crit, heavy: true, knockdown: true });
        }
        // ---- IT CUTS SUMMONS TOO --------------------------------------------
        // The one place her restraint is expressed as BREADTH rather than as
        // damage: Garuda, shikigami, curses and minions inside the circle all
        // take it. Everything else she owns ignores summons entirely.
        if (u.cutsSummons) {
          m.minions?.hurtAt?.(origin, r, u.summonDmg ?? 40, caster);
          m.shikigami?.hurtAt?.(origin, r, u.summonDmg ?? 40, caster);
          m.curses?.hurtAt?.(origin, r, u.summonDmg ?? 40, caster);
          m.garuda?.hurtAt?.(origin, r, u.summonDmg ?? 40, caster);
        }
        m.arena?.destruct?.damageAt(origin.clone().setY(0.5), r * 0.7, u.destruct ?? 80);
        // the big circle collapses — the ultimate is not also a free re-cast
        m.newshadow?.endUltimate(caster);
        break;
      }

      case 'hanami_roots': {
        // ROOT ERUPTION — unchanged, and deliberately so: it is the good one.
        // Aim with the left stick, neutral leads the opponent's feet, and the
        // growing marker IS the move. The only thing that changed is that the
        // spikes are now real wooden geometry coming out of the deck rather
        // than billboards standing in for it (see the rootSpikes entity).
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 9) * mag);
        } else {
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.delay ?? 0.75) * 0.6);
        }
        at.y = caster.bounds ? caster.bounds.floorAt(at.x, at.z, caster.pos.y + 1.2) : 0;
        const lim = caster.arenaRadius - 0.3;
        const rr = Math.hypot(at.x, at.z);
        if (rr > lim) { at.x *= lim / rr; at.z *= lim / rr; }
        // NATURAL GROUND AT THE TARGET, not under him: the spikes come out of
        // the ground they are coming out of. That is the correct reading and
        // it is also the more interesting one, because it means aiming into a
        // Root Field is a real decision.
        const kind = m.flora ? m.flora.terrainForPos(at) : ARTIFICIAL;
        const boost = kind !== ARTIFICIAL ? (opts.natural || {}) : {};
        this.entities.push({
          type: 'rootSpikes', caster, pos: at, sure,
          t: boost.delay ?? opts.delay ?? 0.75,
          radius: boost.radius ?? opts.radius ?? 2.6,
          dmg: (boost.dmg ?? opts.dmg ?? 16) * mult,
          kb: opts.kb ?? 4, kbY: opts.kbY ?? 9.5, natural: kind !== ARTIFICIAL, fxT: 0
        });
        m.sfx.rootPrime?.();
        break;
      }

      // =====================================================================
      // ROOT SWARM 根の群れ — RT
      // =====================================================================
      // He drives an arm into the deck and the roots go hunting UNDER it: a
      // line of them races away from him in the direction he is moving,
      // surfacing as they travel, and whatever the line reaches is thrown
      // into the air. UNBLOCKABLE — you do not guard a floor that has stopped
      // being a floor; you leave it.
      //
      // The roots are real geometry (fx/props.js buildRootClump) surged up at
      // the wavefront's own position, one clump every `step` metres, so the
      // thing on screen is the thing the hitbox is.
      //
      // Connecting also plants the CURSED BUD on them — the parasite is now
      // something the roots do to a body they have hold of, rather than a
      // seed thrown separately, which is both the better visual and the
      // reason his CE-drain identity survives the redesign.
      case 'hanami_rootswarm': {
        const dir = this._castDir(caster);
        const from = caster.pos.clone();
        from.y = caster.bounds ? caster.bounds.floorAt(from.x, from.z, caster.pos.y + 1.2) : 0;
        this.entities.push({
          type: 'rootRun', caster, sure, dir,
          pos: from.addScaledVector(dir, 0.9),
          travelled: 0, spd: opts.speed ?? 15, range: opts.range ?? 11,
          step: opts.step ?? 1.1, nextAt: 0, radius: opts.radius ?? 1.5,
          dmg: (opts.dmg ?? 14) * mult, kbY: opts.kbY ?? 11, hitstun: opts.hitstun ?? 34,
          bud: opts.bud ?? null, dealt: false, hitOpts
        });
        // the arm going in
        m.fx.rootSurge(caster.pos.clone().addScaledVector(dir, 0.7), { len: 1.1, natural: false, life: 0.5 });
        m.fx._ring(caster.pos.clone().setY(0.06), 0x6f9a52, { size: 0.5, growRate: 8, life: 0.35 });
        m.sfx.rootPrime?.();
        m.cam.shake(0.3);
        break;
      }

      // CURSED BUD. A thrown seed. Almost no direct damage — the six seconds
      // afterwards are the move, and they live in combat/flora.js.
      // ROOT FIELD. No hitbox, no damage — it is terrain, and it is how he
      // functions on a map that hates him.
      case 'hanami_rootfield': {
        const sp = caster.cfg.special;
        m.flora.plantField(caster, {
          x: caster.pos.x, y: caster.pos.y, z: caster.pos.z,
          radius: sp.radius, duration: sp.duration, hp: sp.hp
        });
        m.fx._ring(caster.pos.clone().setY(caster.pos.y + 0.06), 0x7fc46a,
          { size: 0.6, growRate: sp.radius * 1.6, life: 0.7 });
        m.cam.shake(0.35);
        m.hud.toast(caster, '花畑 ROOT FIELD');
        break;
      }

      // WOODEN BALL 木の鞠. The mass condenses overhead and drops. Both a kill
      // attempt and a permanent terrain play — see the entity below.
      case 'hanami_woodenball': {
        const u = caster.cfg.ultimate;
        const at = t.pos.clone();
        at.y = caster.bounds ? caster.bounds.floorAt(at.x, at.z, t.pos.y + 1.2) : 0;
        this.entities.push({
          type: 'woodenBall', caster, pos: at, t: u.dropDelay ?? 0.55, def: u,
          dmg: (u.dmg ?? 52) * mult, node: m.fx.woodenBall ? m.fx.woodenBall(at, u.radius) : null,
          fxT: 0
        });
        m.sfx.woodBall?.();
        m.cam.shake(0.5);
        m.stage.flash(0.25);
        break;
      }

      // =====================================================================
      // KUROURUSHI — THE SWARM
      // =====================================================================
      case 'kurourushi_swarm': {
        m.swarms.release(caster, opts, { count: opts.count });
        m.sfx.swarmRelease?.();
        m.cam.shake(0.2);
        break;
      }

      // CORROSIVE SPRAY. A short cone. On hit it MELTS GUARD — their block
      // chip and block stamina drain both go up hard — and it leaves a burn.
      // The guard melt is what makes him the answer to defensive characters,
      // and it is specifically his way through Hanami's wall.
      case 'kurourushi_spray': {
        m.fx.corrosiveSpray?.(caster, opts.reach ?? 4.2, opts.arc ?? 0.95);
        m.sfx.spray?.();
        if (sure || inArc(caster, t, opts.reach ?? 4.2, opts.arc ?? 0.95)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 9) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 1.5, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg' || r === 'block' || r === 'armor') {
            const melt = opts.melt || { duration: 6, chipMult: 2.4, staminaMult: 1.8 };
            t.melt = { t: melt.duration, chip: melt.chipMult, stamina: melt.staminaMult };
            m.hud.toast(t, '消化液 — GUARD MELTING');
            const dot = opts.dot || { duration: 5, dps: 3 };
            this.entities.push({ type: 'corrode', target: t, caster, t: dot.duration, dps: dot.dps, fxT: 0 });
          }
        } else m.sfx.whiff();
        break;
      }

      // DEVOUR. A committed grab — slow enough to be jumped or dashed out of,
      // faster against a body already on the floor. The connect hands off to
      // the hold entity, which owns the cinematic beat.
      case 'kurourushi_devour': {
        const sp = caster.cfg.special;
        const downed = ['knockdown', 'getup'].includes(t.state);
        const grabbable = t.alive && (downed || (t.grounded && !['launched', 'ko'].includes(t.state)));
        if ((sure || inArc(caster, t, opts.reach ?? sp.reach, opts.arc ?? sp.arc)) && grabbable) {
          t.pos.copy(caster.pos).addScaledVector(caster.forward(), 1.0);
          t.pos.y = caster.pos.y;
          t.prevPos.copy(t.pos);
          t.vel.set(0, 0, 0);
          t.activeHit = null;
          t.move = null;
          t.setState('devoured', { clip: 'devoured' });
          caster.model.setMaw?.(1);
          m.hud.cutin(caster, '捕食 DEVOUR', sp.name);
          m.cam.cinematic(caster.pos, 1.1, 2.4, 1.5);
          m.sfx.devourBite?.();
          m.hitstop(12);
          this.entities.push({
            type: 'devourHold', caster, target: t, frames: sp.holdFrames ?? 46, sp
          });
        } else {
          m.sfx.whiff();
          caster.emit('devourWhiff');
        }
        break;
      }

      // SELF-DEVOUR. He eats his own swarm. Small, undignified, and the reason
      // he is never entirely stalled.
      case 'kurourushi_selfdevour': {
        const g = caster.cfg.gluttony;
        const n = m.swarms.devourOwn(caster, g.selfDevourMax ?? 8, g.perSelfDevourRoach ?? 0.5);
        caster.model.setMaw?.(1);
        caster._mawT = 0.5;
        m.sfx.devourBite?.();
        m.hud.toast(caster, n ? 'ATE ' + n : 'NOTHING TO EAT');
        break;
      }

      case 'kurourushi_infestation': {
        m.swarms.beginInfestation(caster, caster.cfg.ultimate);
        m.hud.toast(caster, '蟲毒 INFESTATION');
        break;
      }

      // =====================================================================
      // CHOSO — BLOOD MANIPULATION
      // =====================================================================
      // BLOOD EDGE 血刃 — his neutral tool. A hardened blade of blood thrown
      // flat, travelling a medium distance and FALLING OFF past `falloffAt`
      // rather than stopping dead. The falloff is the whole balance of the
      // move: it owns one band of the floor and is a poor answer outside it,
      // which is what makes "hold mid-range" an actual instruction rather than
      // a suggestion.
      case 'choso_blood_edge': {
        m.fx.bloodEdgeCast(caster);
        m.sfx.bloodEdge();
        const dir = caster.forward();
        this.entities.push({
          type: 'bloodEdge', caster, sure,
          pos: caster.pos.clone().add(v3(0, 1.30, 0)).addScaledVector(dir, 0.7),
          dir, spd: opts.speed ?? 19,
          dmg: (opts.dmg ?? 8) * mult,
          kb: opts.kb ?? 1.8, kbY: opts.kbY ?? 0, hitstun: opts.hitstun ?? 16,
          range: opts.range ?? 11.5, falloffAt: opts.falloffAt ?? 7,
          falloffMin: opts.falloffMin ?? 0.45,
          travelled: 0, fxT: 0
        });
        break;
      }

      // PIERCING BLOOD 穿血 — the committed read. Fired the instant the long
      // startup ends, at a speed nothing dodges after the fact: it resolves as
      // a LINE, not a projectile, which is exactly why the 28 frames in front
      // of it have to be the counterplay.
      //
      // IT PIERCES. It does not stop on the first thing it touches: the line
      // is walked all the way out, damaging destructible geometry the whole
      // distance, and it hits EVERY fighter standing on it rather than the
      // nearest one. In a free-for-all that means it can spit two people at
      // once, which is correct for a lance.
      case 'choso_piercing_blood': {
        const fw = caster.forward();
        const origin = caster.pos.clone().setY(caster.pos.y + 1.20).addScaledVector(fw, 0.55);
        const range = opts.range ?? 22, width = opts.width ?? 1.05;
        m.fx.piercingBlood(origin, fw, range, width);
        m.sfx.piercingBlood();
        m.cam.shake(0.7); m.cam.fovKick(8);
        m.stage.flash(0.28);
        // through the level: it goes through walls, so the walls take it
        for (let i = 1; i <= Math.round(range); i++) {
          m.arena?.destruct?.damageAt(origin.clone().addScaledVector(fw, i), width + 0.5, 70, { kind: 'body' });
        }
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          if (!sure && !(along > -0.5 && along < range && perp < width * 0.5 + 0.55)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 30) * mult);
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.5, kbY: opts.kbY ?? 1.6,
            hitstun: opts.hitstun ?? 34, type: 'knockdown', dir: fw.clone()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { crit, heavy: true, knockdown: true });
          m.hitstop(10);
        }
        break;
      }

      // FLOWING RED SCALE 赤鱗躍動 — the self-buff, applied on the ACTIVATION
      // frame at the end of the open channel. An interrupted channel gives him
      // nothing, which is what the cursed energy and the Blood bought.
      //
      // NO HEALTH IS SPENT HERE OR ANYWHERE ELSE. He is boiling his own blood,
      // not draining it.
      case 'choso_redscale': {
        const sp = caster.cfg.special;
        caster.buffs.redScale = sp.duration ?? 9;
        caster.model.setRedScale?.(true);
        m.fx.redScaleBurst(caster);
        m.fx.buffAura(caster, sp.duration ?? 9, 0xc4142c);
        m.sfx.redScale();
        m.cam.shake(0.45); m.cam.fovKick(5);
        m.stage.flash(0.25);
        m.hud.cutin(caster, 'BLOOD MANIPULATION', '赤鱗躍動  FLOWING RED SCALE');
        m.hud.toast(caster, '赤鱗躍動 RED SCALE');
        break;
      }

      // SUPERNOVA 超新星 — Convergence, then the release. The mass is aimed
      // with the left stick (character-relative, like Jogo's eruption), takes
      // `travel` seconds to arrive, then sits for `fuse` seconds before it
      // goes off. That fuse is the whole telegraph and the whole counterplay.
      case 'choso_supernova': {
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 11) * mag);
        } else {
          // neutral: their chest, led a little by where they are going
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.travel ?? 0.42) * 0.7);
        }
        at.y = caster.pos.y + 1.3;
        const rr = Math.hypot(at.x, at.z);
        const lim = caster.arenaRadius - 0.4;
        if (rr > lim) { at.x *= lim / rr; at.z *= lim / rr; }
        m.sfx.supernovaCharge();
        m.cam.shake(0.3);
        this.entities.push({
          type: 'supernova', caster,
          from: caster.pos.clone().setY(caster.pos.y + 1.3).addScaledVector(caster.forward(), 0.6),
          to: at, t: 0, travel: opts.travel ?? 0.42, fuse: opts.fuse ?? 0.55,
          radius: opts.radius ?? 5.2, dmg: (opts.dmg ?? 46) * mult,
          pellets: opts.pellets ?? 22,
          kb: opts.kb ?? 8, kbY: opts.kbY ?? 4.5, hitstun: opts.hitstun ?? 40,
          fxT: 0, armed: false
        });
        break;
      }

      // =====================================================================
      // NOBARA — STRAW DOLL TECHNIQUE
      // =====================================================================
      // HAIRPIN 簪 — a nail thrown flat. It EMBEDS: in the opponent if it
      // reaches them, in the floor if it does not, and either way it sits
      // there ticking until its fuse runs out or she detonates it early. A
      // nail in the floor is a genuine trap; a nail in a body is worth extra
      // Essence when it goes off, which is the reason to aim.
      case 'nobara_hairpin': {
        const def = caster.cfg.ct1;
        if (caster.nailCount >= (opts.maxNails ?? def?.maxNails ?? 4)) {
          // Should be unreachable — Fighter.startCT turns the button into the
          // detonator at the cap — but a Copy or a domain payload could route
          // here, so it refuses rather than quietly exceeding the cap.
          m.hud.toast(caster, 'NAILS OUT');
          break;
        }
        m.sfx.nailThrow();
        const dir = caster.forward();
        caster.nailCount++;
        this.entities.push({
          type: 'nail', caster, sure, phase: 'fly',
          pos: caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(dir, 0.5),
          dir, spd: opts.speed ?? 24, travelled: 0, range: opts.range ?? 15,
          dmg: (opts.dmg ?? 5) * mult, blastDmg: (opts.blastDmg ?? 10) * mult,
          radius: opts.radius ?? 2.0, fuse: opts.fuse ?? 2.6,
          kb: opts.kb ?? 1.2, hitstun: opts.hitstun ?? 12,
          blastKb: opts.blastKb ?? 3.2, blastKbY: opts.blastKbY ?? 1.2,
          blastHitstun: opts.blastHitstun ?? 22,
          stuckTo: null, fxT: 0
        });
        break;
      }

      // THE DETONATOR. Free, fast, and it takes everything she has out at
      // once — see Fighter.startCT for why it lives on the same button.
      case 'nobara_detonate': {
        // bringing every live nail's fuse forward to zero — the update loop
        // owns the blast itself, so a floor nail and a body nail go off
        // through exactly the same path they would have on their own clock
        let n = 0;
        for (const e of this.entities) {
          if (e.type === 'nail' && e.caster === caster && e.phase !== 'fly' && !e.spent) {
            e.fuse = 0;
            n++;
          }
        }
        if (!n) m.hud.toast(caster, 'NOTHING TO SET OFF');
        break;
      }

      // ---------------------------------------------------------------------
      // RESONANCE 共鳴 — THE ONE THAT REACHES THROUGH EVERYTHING
      // ---------------------------------------------------------------------
      // It consumes the WHOLE Essence meter and deals damage at any range,
      // through any defence, ignoring walls, distance and line of sight. It is
      // routed through the SAME sure-hit bypass the domains already use
      // (`sureHit: true, unblockable: true`), which is why it beats blocking,
      // i-frames, Gojo's teleport window, Toji's dash i-frames, Simple Domain
      // and every domain barrier without a single special case anywhere.
      //
      // THE TWO GUARDS BELOW ARE THE ONLY EXCEPTIONS, and both are safety
      // rather than defence:
      //
      //  1. A TARGET INSIDE A CINEMATIC. `transfigured`, `sentenced`,
      //     `executing` and `devoured` are frozen states owned by other
      //     systems, which drive the body themselves and expect it to still be
      //     in that state next tick. A normal hit would yank them out of it
      //     mid-cinematic and desync the system that owns them. So the damage
      //     still LANDS in full — through takeChip, which routes through
      //     adaptation and the RCT ledger exactly as a hit does — it just does
      //     not touch their state. Resonance reaches them; it does not break
      //     the game to do it.
      //
      //  2. SHADOW TRAVEL. A Megumi submerged in his own domain's shadow
      //     returns 'iframe' above every branch in Fighter._applyHit,
      //     INCLUDING the sure-hit branch, and that is a pre-existing ruling
      //     with a comment explaining it: there is no body inside the barrier
      //     to land on. Changing it would change Megumi, which this addition
      //     is not allowed to do. It is reported rather than special-cased.
      case 'nobara_resonance': {
        const def = caster.cfg.ct2;
        const spent = caster.spendAllEssence();
        const k = Math.min(1, spent / (caster.cfg.essence?.max ?? 100));
        const dmg0 = (def.base ?? 2) + spent * (def.perEssence ?? 0.4);
        const { dmg } = computeDamage(caster, dmg0 * mult, { canCrit: false });
        m.sfx.resonanceHit(k);
        m.hud.toast(caster, '共鳴 RESONANCE  ' + Math.round(spent) + ' 依代');
        m.hitstop(6 + Math.round(k * 8));
        m.cam.shake(0.3 + k * 0.5);
        if (k > 0.6) { m.cam.fovKick(6); m.stage.flash(0.2); }
        this._resonate(caster, t, dmg, k, 'ct2');
        break;
      }

      // FULL RELEASE — the same reach, the whole meter, at nearly double the
      // rate, with the cinematic. A wasted ultimate if she has nothing banked,
      // and the biggest single hit in the game if she has been landing hits.
      case 'nobara_full_release': {
        const u = caster.cfg.ultimate;
        const spent = caster.spendAllEssence();
        const k = Math.min(1, spent / (caster.cfg.essence?.max ?? 100));
        const dmg0 = (u.base ?? 8) + spent * (u.perEssence ?? 0.72);
        const { dmg } = computeDamage(caster, dmg0 * mult, { canCrit: false });
        m.sfx.fullRelease();
        m.stage.flash(0.65);
        m.cam.shake(1.1); m.cam.fovKick(11);
        m.hitstop(20);
        m.slowmo(0.45, 0.35);
        m.cam.cinematic(t.pos, 1.5, 3.4, 1.8);
        m.hud.techFlash(spent < 12
          ? '共鳴・全解放 — NOTHING TO RELEASE'
          : '共鳴・全解放 — ' + Math.round(spent) + ' 依代', 0xf0e2b8);
        this._resonate(caster, t, dmg, 1, 'ultimate', true);
        break;
      }

      // HER BLACK FLASH ATTEMPT. An ordinary committed strike that, on a clean
      // connect, opens the window through the SHARED `openBlackFlash` helper —
      // the same one Yuji's techniques call, with her own `cfg.blackFlash`
      // numbers. Nothing about his path is duplicated or touched.
      case 'nobara_bf_strike': {
        m.sfx.hammer(true);
        m.fx.dashTrail(caster);
        if (sure || inArc(caster, t, opts.reach ?? 1.9, opts.arc ?? 1.5)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 11) * mult);
          const r = t.applyHit({
            ...hitOpts, isCT: false, src: 'punch', dmg,
            kb: opts.kb ?? 2.4, kbY: opts.kbY ?? 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg' || r === 'armor') {
            openBlackFlash(caster, (opts.dmg ?? 11) * mult);
            caster.emit('bfWindow');
          } else {
            caster.emit('bfStrikeWhiff');
          }
        } else {
          m.sfx.whiff();
          caster.emit('bfStrikeWhiff');
        }
        break;
      }

      // =====================================================================
      // URO — SKY MANIPULATION
      // =====================================================================

      // ---- RB · THIN ICE BREAKER 薄氷ブレイカー -----------------------------
      // She lays a hand on the surface of the sky in front of her and breaks
      // it. A WIDE FORWARD PLANE — not a projectile and not a cone — resolved
      // as a box test in her facing, which is why it beats a sidestep and
      // loses to simply not being in front of her.
      //
      // The research half: because the blow lands on the SPACE the target
      // occupies rather than on the body, cursed-energy reinforcement is much
      // less effective against it. `pierceGuard` is that, and it is the only
      // number of its kind in the game — a blocked Thin Ice Breaker still
      // delivers 45% of its damage, against the roster's usual 15%.
      case 'uro_thin_ice': {
        const dir = this._castDir(caster);
        const width = opts.width ?? 5.2, range = opts.range ?? 9.0;
        const origin = caster.pos.clone().setY(caster.pos.y + 1.25).addScaledVector(dir, 0.6);
        m.warpfx?.thinIce(origin.clone().addScaledVector(dir, range * 0.42), dir, {
          width, height: 3.4, shards: opts.shards ?? 14,
          crackTime: opts.crackTime ?? 0.16,
          tint: 0xdff2ff
        });
        m.sfx.thinIce?.();
        m.cam.shake(0.42); m.cam.fovKick(4);
        m.stage.flash(0.12);
        // the level takes it too: a shattered plane of space cuts what is in it
        for (let i = 1; i <= 6; i++) {
          m.arena?.destruct?.damageAt(origin.clone().addScaledVector(dir, i * (range / 6)), width * 0.5, 26);
        }
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * dir.x + rel.z * dir.z;
          const perp = Math.abs(rel.x * dir.z - rel.z * dir.x);
          const pad = f.hurtBox?.radius ?? 0.62;
          if (!sure && !(along > -0.6 && along < range && perp < width * 0.5 + pad)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 15) * mult);
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 4.2, kbY: opts.kbY ?? 1.6,
            hitstun: opts.hitstun ?? 28, type: 'heavy', dir: dir.clone()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { crit, heavy: true });
          // *** THE RESEARCH, AS A NUMBER. *** A guard does not stop the sky
          // breaking under you: the chip already applied by the block path is
          // topped up to `pierceGuard` of the full damage. Applied through
          // `takeChip` so every existing ledger — Choso's blood, Nobara's
          // essence, Maki's awakening, the domain clash tally — sees it.
          if (r === 'block' && (opts.pierceGuard ?? 0) > 0) {
            const already = dmg * 0.15 * (f._tune?.('blockChipMult') ?? 1);
            const want = dmg * opts.pierceGuard;
            if (want > already) f.takeChip(want - already, 'technique');
            m.hud.toast(f, '薄氷 — GUARD DOES NOT HOLD');
          }
        }
        break;
      }

      // ---- RT · SPACE WARP STRIKE 空間歪曲打 --------------------------------
      // The fold. The animation says "straight ahead"; the hit does not arrive
      // there. `emergence` is an ORDERED CYCLE (see the config) rather than a
      // random roll — a random emergence point is unlearnable and therefore
      // unfair, a cycle is a pattern a good opponent reads after four
      // exchanges, and that is exactly the amount of counterplay a 34-cost
      // committed technique should have.
      //
      // THE COUNTERPLAY IS SPACING, NOT BLOCKING, and it is structural: the
      // fold has a maximum span, and outside it the technique produces the
      // whole animation, spends the whole bar, and does nothing at all.
      case 'uro_warp_strike': {
        if (!t?.alive) { m.sfx.warpFold?.(); break; }
        const reach = opts.reach ?? 8.5;
        const gap = flatDist(caster.pos, t.pos);
        // the emergence point, cycled
        const list = opts.emergence ?? ['behind', 'above', 'left', 'right'];
        if (caster._warpCycle == null) caster._warpCycle = (Math.random() * list.length) | 0;
        const where = list[caster._warpCycle % list.length];
        caster._warpCycle++;
        const fw = v3(t.pos.x - caster.pos.x, 0, t.pos.z - caster.pos.z);
        if (fw.lengthSq() < 1e-5) fw.copy(caster.forward());
        fw.normalize();
        const right = v3(fw.z, 0, -fw.x);
        const at = t.pos.clone();
        let dir = fw.clone();
        if (where === 'behind') { at.addScaledVector(fw, 1.5); dir = fw.clone().multiplyScalar(-1); }
        else if (where === 'above') { at.y += 2.4; dir = fw.clone(); }
        else if (where === 'left') { at.addScaledVector(right, 1.6); dir = right.clone().multiplyScalar(-1); }
        else { at.addScaledVector(right, -1.6); dir = right.clone(); }

        // THE FOLD ITSELF — the lens between her and the emergence point, with
        // the two mirrored duplicates of her at the ends.
        m.warpfx?.fold(
          caster.pos.clone().setY(caster.pos.y + 1.05),
          at.clone().setY(at.y + 1.05),
          { ghosts: opts.ghosts ?? 2, life: opts.lensTime ? opts.lensTime * 2 : 0.44 }
        );
        m.sfx.warpFold?.();
        m.cam.shake(0.5); m.cam.fovKick(7);

        // OUT OF RANGE: the fold does not reach, and nothing happens. This is
        // the counterplay and it is deliberately loud rather than silent.
        if (gap > reach) {
          m.hud.toast(caster, '歪曲 — OUT OF REACH');
          break;
        }
        m.hitstop(9);
        const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 26) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 5.6, kbY: opts.kbY ?? 3.2,
          hitstun: opts.hitstun ?? 34, type: 'heavy', dir
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit, heavy: true });
        if (r === 'hit' || r === 'otg') m.hud.toast(caster, '歪曲打 — ' + where.toUpperCase());
        m.arena?.destruct?.damageAt(at.clone().setY(Math.max(0.4, at.y)), 1.9, 34);
        break;
      }


      // =====================================================================
      // DAGON — HORIZON OF THE CAPTIVATING SKANDHA
      // =====================================================================

      // ---- RB · SHIKIGAMI VOLLEY 式神一斉 -----------------------------------
      // A small school of fish that home loosely. His neutral tool: low damage
      // each, good chip, and cheap enough to throw while the bar fills.
      // Genuinely PROJECTILES — which means Uro reflects them, correctly.
      case 'dagon_volley': {
        const count = opts.count ?? 5;
        const spd = opts.speed ?? 11.5;
        const dir0 = this._castDir(caster);
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.22;
          const dir = dir0.clone().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'seaFish', caster, sure,
            pos: caster.pos.clone().add(v3(0, 1.55, 0)).addScaledVector(dir, 0.8)
              .add(v3(rand(-0.3, 0.3), rand(-0.3, 0.4), rand(-0.3, 0.3))),
            vel: dir.multiplyScalar(spd * rand(0.88, 1.12)),
            spd, homing: opts.homing ?? 2.0,
            dmg: (opts.dmg ?? 3.2) * mult,
            kb: opts.kb ?? 0.9, hitstun: opts.hitstun ?? 10,
            life: (opts.range ?? 14) / spd, delay: i * 0.045, fxT: 0, hitOpts
          });
        }
        m.sfx.volley?.();
        break;
      }

      // ---- RT · TIDAL SLAM 潮撃 ---------------------------------------------
      // A heavy forward surge of water: wide, slow, high damage, and it washes
      // them back. What it leaves behind is the interesting half — a shallow
      // water patch that slows anyone standing in it. He is immune to his own;
      // a slow character who slowed himself would never press the button.
      case 'dagon_tidal_slam': {
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'tidalSurge', caster, sure,
          pos: caster.pos.clone().setY(caster.pos.y + 0.35).addScaledVector(dir, 1.0),
          dir, spd: opts.surgeSpeed ?? 13,
          width: opts.width ?? 4.6, range: opts.range ?? 8.5, travelled: 0,
          dmg: (opts.dmg ?? 24) * mult,
          kb: opts.kb ?? 8.5, kbY: opts.kbY ?? 1.2, hitstun: opts.hitstun ?? 34,
          patch: opts.patch, fxT: 0, hitOpts
        });
        m.sfx.tidalSlam?.();
        m.cam.shake(0.7); m.cam.fovKick(8);
        break;
      }

      // ---- B · SUMMON SEA SHIKIGAMI ----------------------------------------
      // The gesture deals nothing. The creature does, and it is owned by
      // combat/ocean.js — the same system the domain drives, with the
      // guarantee switched off and two multipliers applied. See the header of
      // that file for why it is one system rather than two.
      case 'dagon_summon': {
        const type = opts.summonType ?? caster.cfg.special.aim?.neutral ?? 'eel';
        const made = m.ocean?.summonFor(caster, type);
        if (made) {
          m.sfx.seaEmerge?.();
          m.hud.toast(caster, '式神 — ' + (caster.cfg.ocean.defs[type]?.short ?? ''));
        }
        break;
      }

      // =====================================================================
      // YAGA — CURSED CORPSES 呪骸
      // =====================================================================
      // COMMAND. Deals nothing. It reaches every corpse he has standing,
      // wherever they are, and overwrites their task list with a point — which
      // is the only technique in the game whose range is "the arena". The
      // point is the stick, or the opponent on a neutral stick, because the
      // thing a player wants ninety percent of the time is "go and hit them".
      case 'yaga_command': {
        const sys = m.construction;
        if (!sys) break;
        // The stick aims, character-relative, exactly as Jogo's eruption and
        // Sukuna's cleave already do — `m.inputFor` is the shared read.
        // NEUTRAL SENDS THEM AT THE OPPONENT, which is what a player wants
        // ninety percent of the time and is the only sensible default for a
        // button whose whole purpose is "go and hit them".
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        let point;
        if (Math.hypot(mv.x, mv.z) > 0.3) {
          const aim = caster._moveVec(mv);
          point = caster.pos.clone().addScaledVector(aim.normalize(), Math.min(opts.aimRange ?? 40, 9));
        } else {
          point = (t?.alive ? t.pos : caster.pos).clone();
        }
        const n = sys.commandAll(caster, point, opts.duration ?? 4, opts.speedMult ?? 1.35, opts.dmgMult ?? 1.2);
        for (const c of sys.aliveFor(caster)) {
          commandPulse(m.fx, caster.pos.clone().setY(caster.pos.y + 1.4), c.pos, 0xb59a68);
        }
        m.sfx.corpseCommand?.(n);
        m.hud.toast(caster, n ? 'COMMAND — ' + n : 'NOTHING TO COMMAND');
        break;
      }

      // HAYMAKER. One committed blow, enormous damage, a hard knockdown, and
      // it shatters a held guard. It is how he manufactures the four seconds
      // he needs, and its recovery is the price.
      case 'yaga_haymaker': {
        m.sfx.heavySwing?.() ?? m.sfx.hit(true);
        m.cam.shake(0.4);
        if (sure || inArc(caster, t, opts.reach ?? 2.3, opts.arc ?? 1.9)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 34) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 8.5, kbY: opts.kbY ?? 2.0,
            hitstun: opts.hitstun ?? 40, type: 'knockdown', guardBreak: !!opts.guardBreak
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') {
            m.hitstop(12);
            m.fx.impactBloom?.(t.pos.clone().add(v3(0, 1.2, 0)), 0xb59a68, 1.2);
          }
        }
        break;
      }

      // MASTERPIECE. The full-bar shortcut past the entire construction risk:
      // a MASTERWORK with no build time, bigger and longer-lived than one he
      // could make by hand, because a full bar has to beat patience.
      //
      // It is the ONE path allowed to clear his own bench (`force`), and the
      // reason that is not a contradiction of the "blocked, not replaced" rule
      // on B is stated in characters/yaga.js: an ultimate retiring a corpse is
      // a decision he made; a held button silently deleting one is not.
      case 'yaga_masterpiece': {
        const sys = m.construction;
        if (!sys) break;
        const tiers = caster.cfg.special.tiers;
        const tier = tiers.find(x => x.key === (opts.tier ?? 'masterwork')) ?? tiers[tiers.length - 1];
        const c = sys.deploy(caster, tier, {
          force: true, scale: opts.scale ?? 1.18, lifeMult: opts.lifeMult ?? 1.5,
          hpMult: opts.hpMult ?? 1.25, dmgMult: opts.dmgMult ?? 1.15
        });
        if (c) {
          corpseDeploy(m.fx, c.pos, tier, opts.scale ?? 1.18);
          m.sfx.corpseDeploy?.('masterwork');
          m.cam.shake(0.7);
          m.stage.flash(0.4);
          m.hitstop(10);
        }
        break;
      }

      // =====================================================================
      // TAKABA — THE COMEDIAN 笑いの術式
      // =====================================================================
      // ONE resolver for all fourteen outcomes. The ROLL already happened, at
      // the press, in `Fighter.startCT` — so this case never rolls and the
      // animation the player watched and the thing that lands can never
      // disagree. `opts.bit` is the entry off the table.
      case 'takaba_bit':
      case 'takaba_big': {
        const bit = opts.bit ?? rollBit(caster, key === 'takaba_big'
          ? caster.cfg.ct2.table : caster.cfg.ct1.table, opts.copyTier);
        this._applyBit(caster, t, bit, mult, sure, hitOpts, opts);
        break;
      }

      // THE SET. Everything about it is in combat/theset.js; the dispatcher's
      // whole job is to hand it the two fighters.
      case 'takaba_theset':
        m.theset?.start(caster, t);
        break;

      // =====================================================================
      // URAUME — ICE FORMATION 氷凝呪法
      // =====================================================================
      // Every one of the four applies FROST through the one entry point in
      // combat/frost.js and nowhere else, so the stack rate, the cap, the
      // FROSTBOUND trigger and its cooldown are decided in a single place and
      // a fifth ice tool added later cannot get any of them wrong.

      // ---- RB · ICEFALL 直瀑 -----------------------------------------------
      // Canon: frost the hand, touch the ground, grow interconnected sheets,
      // break them apart and LEVITATE the pieces at the target. So these are
      // not thrown — they are launched off the floor in front of the caster
      // and steered, and the animation has no throwing key in it anywhere.
      //
      // They TRAVEL, which makes them category A in combat/reflect.js. See
      // the REFLECTABLE entry: `iceShard` is in the table deliberately.
      case 'uraume_icefall': {
        const dir = this._castDir(caster);
        const n = opts.count ?? 5;
        const from = caster.pos.clone()
          .add(v3(0, caster.model?.iceAnchor?.palmY ?? 0.55, 0))
          .addScaledVector(dir, 0.5);
        m.sfx.icefall?.();
        m.cam.shake(0.16);
        // the sheets coming up off the floor before they go
        for (let i = 0; i < 9; i++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * rand(0.3, 1.5), 0.06, Math.sin(a) * rand(0.3, 1.5))), {
            color: i % 3 === 0 ? 0x4fd8e8 : 0xdff2fb, size: rand(0.10, 0.24), aspect: 0.5,
            life: rand(0.20, 0.42), gravity: -2, vel: v3(0, rand(1.4, 3.2), 0)
          });
        }
        for (let i = 0; i < n; i++) {
          // a fan, centred on the cast direction
          const spread = (opts.spread ?? 0.42);
          const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread * 2;
          const d = dir.clone().applyAxisAngle(v3(0, 1, 0), off);
          const node = m.fx.iceShardNode(0.85, 0.10);
          m.fx.scene.add(node);
          this.entities.push({
            type: 'iceShard', caster, sure,
            pos: from.clone().add(v3(rand(-0.2, 0.2), rand(-0.15, 0.25), rand(-0.2, 0.2))),
            dir: d, spd: opts.speed ?? 17,
            range: opts.range ?? 14, travelled: 0,
            dmg: (opts.dmg ?? 3.5) * mult, kb: opts.kb ?? 1.1, kbY: 0,
            hitstun: opts.hitstun ?? 12,
            frost: opts.frost ?? 1, icicle: opts.icicle,
            node, spin: rand(4, 9), hitOpts: { ...hitOpts }, dealt: false
          });
        }
        break;
      }

      // ---- RT · FROST CALM 霜凪 --------------------------------------------
      // Canon: supercooled cursed energy blown from the mouth as a cloud of
      // mist, GUIDED BY THE HAND, materialising on contact into thick sheets
      // and COLUMNS of ice that hold the target in place.
      //
      // Four things at once, and the fourth is what makes it a control tool
      // rather than a damage tool: the columns stand for a couple of seconds
      // as REAL WALLS in the Bounds, so Uraume can cut a lane off with it.
      case 'uraume_frostcalm': {
        const dir = this._castDir(caster);
        const n = opts.columns ?? 5;
        const gap = opts.columnGap ?? 1.7;
        const width = opts.width ?? 1.6;
        m.sfx.frostCalm?.();
        m.cam.shake(0.42);
        m.stage.flash(0.12);
        const bounds = m.arena?.bounds;
        const walls = [];
        const bar = opts.barrier ?? {};
        const bh = bar.height ?? 2.6, br = bar.radius ?? 0.62;
        for (let i = 0; i < n; i++) {
          const at = caster.pos.clone().addScaledVector(dir, (i + 1) * gap);
          at.y = m.arena?.bounds?.floorAt?.(at.x, at.z, caster.pos.y + 1.2) ?? caster.pos.y;
          // the column itself, growing UP out of the floor over 0.14 s
          const node = m.fx.iceColumnNode(bh, br);
          node.position.copy(at);
          const life = (bar.duration ?? 2.2);
          m.fx.prop(node, life, (nd, k) => {
            const g = Math.min(1, k / (0.14 / life));
            nd.scale.set(0.6 + 0.4 * g, g, 0.6 + 0.4 * g);
            // it CRACKS over the last fifth rather than fading, because it is
            // a solid and solids do not fade
            if (k > 0.8) {
              const f = 1 - (k - 0.8) / 0.2;
              nd.traverse(o => {
                if (!o.material) return;
                if (o.material.userData.o0 == null) o.material.userData.o0 = o.material.opacity;
                o.material.opacity = o.material.userData.o0 * f;
              });
            }
          });
          // ---- THE BARRIER ------------------------------------------------
          // A REAL WALL for as long as the column stands. Authored through the
          // same runtime door Takaba's THE SET builds through, and dropped
          // through the same one, so nothing new was needed in arena/bounds.js
          // and the spatial grids cannot grow across a long session.
          if (bounds?.wall) {
            walls.push(bounds.wall(at.x - br, at.z - br, at.x + br, at.z + br,
              at.y, at.y + bh));
          }
          // and the floor it leaves under itself
          if (i % 2 === 0) {
            m.ice?.freeze(caster, {
              x: at.x, y: at.y, z: at.z,
              radius: (opts.ice?.radius ?? 3.2) * 0.62,
              duration: opts.ice?.duration
            });
          }
          m.arena?.destruct?.damageAt(at.clone().setY(at.y + 0.6), br + 0.8, opts.destruct ?? 30);
        }
        // the walls come out again on the same clock the columns die on
        if (walls.length && bounds?.drop) {
          this.entities.push({ type: 'iceWalls', t: bar.duration ?? 2.2, walls, bounds });
        }
        // ---- THE HIT --------------------------------------------------------
        // A LINE test, not an arc: the columns come up along a line and what
        // is standing on that line gets caught between them.
        const range = (n + 0.5) * gap;
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * dir.x + rel.z * dir.z;
          const perp = Math.abs(rel.x * dir.z - rel.z * dir.x);
          if (!sure && !(along > 0 && along < range && perp < width + (f.hurtBox?.pad ?? 0))) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 15) * mult);
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.0, kbY: opts.kbY ?? 2.4,
            hitstun: opts.hitstun ?? 28, type: 'heavy', dir: dir.clone()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') applyFrost(m, f, opts.frost ?? 3, caster);
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(dir, range * 0.5), range * 0.4, (opts.dmg ?? 15) * 0.7, caster);
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(dir, range * 0.5), range * 0.4, (opts.dmg ?? 15) * 0.7, caster);
        break;
      }

      // ---- B · FROST FIELD --------------------------------------------------
      // Canon-derived from the Hakari fight: they froze the ground to burst
      // the pipes and made themselves more water to work with. The panic
      // button and the setup tool in one press.
      case 'uraume_frostfield': {
        const sp = caster.cfg.special;
        const r = opts.radius ?? sp.radius ?? 6.0;
        m.sfx.frostField?.();
        m.cam.shake(0.5);
        m.stage.flash(0.18);
        m.fx._ring(caster.pos.clone().setY(0.05), 0x4fd8e8, { size: 0.6, growRate: r * 3.2, life: 0.5, flat: true });
        m.fx._ring(caster.pos.clone().setY(0.05), 0xdff2fb, { size: 0.4, growRate: r * 2.4, life: 0.7, flat: true });
        // THE FLOOR. One patch, which merges with any of their own it overlaps
        // (see IceSystem.freeze) so mashing the button cannot grow the rect
        // list without bound.
        m.ice?.freeze(caster, { radius: r, duration: opts.duration ?? sp.duration });
        for (let i = 0; i < 26; i++) {
          const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * r;
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * rr, 0.05, Math.sin(a) * rr)), {
            color: i % 4 === 0 ? 0x4fd8e8 : 0xdff2fb, size: rand(0.10, 0.30), aspect: 0.5,
            life: rand(0.30, 0.7), gravity: -1.4, vel: v3(0, rand(0.8, 2.6), 0)
          });
        }
        // ...and anyone standing in it. Small damage, real frost — the field
        // is not how Uraume kills anybody.
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          if (!sure && flatDist(f.pos, caster.pos) > r) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 4) * mult, { canCrit: false });
          const r2 = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 1.0, kbY: 0, hitstun: 10, type: 'light',
            dir: v3(f.pos.x - caster.pos.x, 0, f.pos.z - caster.pos.z).normalize()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r2, {});
          if (r2 === 'hit' || r2 === 'otg') applyFrost(m, f, opts.frost ?? 2, caster);
        }
        break;
      }

      // ---- D-pad Right · MAXIMUM OUTPUT: FROST CALM ------------------------
      // 出力最大「霜凪」, ch.215 — the attack that ended Sukuna's fight with Yuji
      // and Maki in one go. An advancing face of glaciation that crosses the
      // arena, applies MAXIMUM frost (so everything it touches is shelled on
      // the spot) and leaves the whole playspace frozen for the rest of the
      // round.
      //
      // THE TERRAIN IS THE PAYLOAD. 46 damage is mid-table for an ultimate on
      // purpose; the reason to throw this is often the floor.
      case 'uraume_maxfrost': {
        const u = caster.cfg.ultimate;
        const dir = this._castDir(caster);
        const width = opts.width ?? u.width ?? 7.0;
        m.sfx.maxFrost?.();
        m.stage.flash(0.55);
        m.cam.shake(1.15);
        m.cam.fovKick(9);
        m.hitstop(10);
        const node = m.fx.glacierNode(width, 3.4);
        node.position.copy(caster.pos);
        node.rotation.y = Math.atan2(dir.x, dir.z);
        const range = opts.range ?? u.range ?? 34;
        const spd = opts.advanceSpeed ?? u.advanceSpeed ?? 15;
        m.fx.scene.add(node);
        this.entities.push({
          type: 'glacier', caster, sure, node, dir: dir.clone(),
          pos: caster.pos.clone(), travelled: 0, range, spd, width,
          dmg: (opts.dmg ?? 46) * mult, kb: opts.kb ?? 0.9, kbY: opts.kbY ?? 0,
          hitstun: opts.hitstun ?? 44, destruct: opts.destruct ?? 70,
          frost: opts.frost ?? 6, ultRoot: opts.ultRoot ?? u.ultRoot ?? true,
          hitType: opts.hitType ?? u.hitType ?? 'heavy',
          hit: new Set(), hitOpts: { ...hitOpts },
          iceEvery: 0, iceDef: opts.ice ?? u.ice
        });
        // THE ARENA FREEZES AT THE CASTER'S FEET IMMEDIATELY, so the ultimate
        // pays off even if the wall is dodged. Permanent — the only ice in the
        // game with no thaw clock.
        m.ice?.freeze(caster, {
          radius: (opts.ice ?? u.ice)?.radius ?? 15,
          duration: (opts.ice ?? u.ice)?.duration ?? 999
        });
        break;
      }

      // =====================================================================
      // RYU ISHIGORI — CURSED ENERGY DISCHARGE 呪力の放出
      // =====================================================================

      // ---- RB · RAPID BLASTS ------------------------------------------------
      // Canon: "a volley of rapid fire blasts to barrage the user's target",
      // and separately blasts "raining down" from above. Both are here — the
      // volley fans forward and the last one arcs over.
      //
      // Fired FROM THE MUZZLE, which is his hair. The clip does not move his
      // arms at all (see anim/ryu.js), and this is the effect that has to
      // agree with it: the origin is `model.muzzle`, not a hand.
      case 'ryu_rapid': {
        const dir = this._castDir(caster);
        const mz = caster.model?.muzzle;
        const from = caster.pos.clone()
          .add(v3(0, mz?.y ?? 1.8, 0))
          .addScaledVector(dir, (mz?.ahead ?? 0.2) + 0.25);
        const n = opts.count ?? 3;
        m.sfx.rapidBlast?.();
        m.cam.shake(0.22);
        for (let i = 0; i < n; i++) {
          const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * (opts.spread ?? 0.16) * 2;
          const d = dir.clone().applyAxisAngle(v3(0, 1, 0), off);
          const arc = opts.arcLast && i === n - 1;
          this.entities.push({
            type: 'ryuShot', caster, sure,
            pos: from.clone(), dir: d, spd: opts.speed ?? 30,
            range: opts.range ?? 20, travelled: 0,
            dmg: (opts.dmg ?? 5.5) * mult, kb: opts.kb ?? 1.6, kbY: 0,
            hitstun: opts.hitstun ?? 12, destruct: opts.destruct ?? 16,
            delay: i * 0.07, arc, vy: arc ? 5.2 : 0,
            hitOpts: { ...hitOpts }, dealt: false, fxT: 0
          });
        }
        break;
      }

      // ---- RT · GRANITE BLAST -----------------------------------------------
      // The release. Everything about the tier — damage, width, range, speed,
      // destruction, knockback, shake — arrives on `opts` because the move was
      // built by spreading the TIER over the config in `Fighter._releaseBeam`,
      // so there is exactly one place those numbers live.
      //
      // *** IT IS A TRAVELLING ENTITY, NOT AN INSTANT LINE, AND THAT IS A
      // DELIBERATE DECISION ABOUT URO. *** combat/reflect.js splits every
      // damaging thing in the game into things that travel (which she bends
      // back), instant lines (which she cannot) and bodies (which she cannot).
      // Canon is unambiguous that Uro redirects Ryu's blasts — she has the
      // advantage on him for exactly that reason, and it is how he loses his
      // fight — so the beam is built as a travelling front and `ryuBeam` is in
      // the REFLECTABLE table. See the note there and the delivery report for
      // what a reflected tier-4 actually does to him.
      case 'ryu_beam': {
        const dir = this._castDir(caster);
        const mz = caster.model?.muzzle;
        const r = opts.width ?? 1.2;
        const from = caster.pos.clone()
          .add(v3(0, mz?.y ?? 1.8, 0))
          .addScaledVector(dir, (mz?.ahead ?? 0.2) + r * 0.5);
        const range = opts.range ?? 22;
        m.fx.outputClear(caster);
        m.sfx.graniteBlast?.(opts.tier ?? 0);
        m.cam.shake(opts.shake ?? 0.5);
        m.cam.fovKick(3 + (opts.tier ?? 0) * 2.2);
        m.stage.flash(opts.flash ?? 0.2);
        if ((opts.tier ?? 0) >= 3) m.hitstop(8);
        const node = m.fx.beamNode(range, r);
        node.position.copy(from);
        node.lookAt(from.clone().add(dir));
        m.fx.scene.add(node);
        this.entities.push({
          type: 'ryuBeam', caster, origin: caster, sure, node,
          pos: from.clone(), dir: dir.clone(),
          spd: opts.speed ?? 38, range, travelled: 0, radius: r,
          dmg: (opts.dmg ?? 22) * mult, kb: opts.kb ?? 5.5, kbY: 0.6,
          hitstun: opts.hitstun ?? 26, destruct: opts.destruct ?? 60,
          tier: opts.tier ?? 0, hit: new Set(), hitOpts: { ...hitOpts },
          life: 1.6
        });
        break;
      }

      // ---- D-pad Right · MAXIMUM OUTPUT: GRANITE BLAST ---------------------
      // A colossal sustained beam, held for a moment and SWEEPABLE with the
      // left stick. The only move in the game other than Hollow Purple that
      // destroys with `kind: 'erase'`, and the brief asks for exactly that
      // relationship: the most environmentally destructive thing in the game
      // outside Purple.
      case 'ryu_maxblast': {
        const u = caster.cfg.ultimate;
        const dir = this._castDir(caster);
        const mz = caster.model?.muzzle;
        const r = opts.width ?? u.width ?? 4.4;
        const range = opts.range ?? u.range ?? 60;
        const from = caster.pos.clone()
          .add(v3(0, mz?.y ?? 1.8, 0))
          .addScaledVector(dir, (mz?.ahead ?? 0.2) + r * 0.4);
        m.fx.outputClear(caster);
        m.sfx.maxBlast?.();
        m.stage.flash(0.72);
        m.cam.shake(1.5);
        m.cam.fovKick(14);
        m.hitstop(14);
        const node = m.fx.beamNode(range, r);
        node.position.copy(from);
        node.lookAt(from.clone().add(dir));
        m.fx.scene.add(node);
        this.entities.push({
          type: 'ryuMax', caster, origin: caster, sure, node,
          pos: from.clone(), dir: dir.clone(), baseYaw: Math.atan2(dir.x, dir.z),
          t: 0, hold: opts.hold ?? u.hold ?? 1.05, range, radius: r,
          sweep: opts.sweep ?? u.sweep ?? 0.62,
          dmg: (opts.dmg ?? 118) * mult, kb: opts.kb ?? 14, kbY: opts.kbY ?? 3,
          hitstun: opts.hitstun ?? 52,
          destroySteps: opts.destroySteps ?? 24, destroyStep: opts.destroyStep ?? 2.4,
          destroyRadius: opts.destroyRadius ?? 3.0, destroyPower: opts.destroyPower ?? 220,
          destroyKind: opts.destroyKind ?? 'erase',
          tickT: 0, hitOpts: { ...hitOpts }
        });
        break;
      }

      case 'nanami_collapse': {
        m.fx.cleaveArc(caster, true);
        m.sfx.cleave(true);
        m.cam.shake(0.35);
        if (sure || inArc(caster, t, opts.reach ?? 2.6, opts.arc ?? 2.2)) {
          // every Collapse hit lands on the 7:3 point — guaranteed crit
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 9) * mult, { forceCrit: true });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 2.5, kbY: 0.8, hitstun: 20, type: 'heavy', unblockable: false }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
        }
        break;
      }
    }
  }

  // ===========================================================================
  // ONE RESOLVER FOR ALL FOURTEEN BITS
  // ===========================================================================
  // Every outcome resolves through here, and the switch below is on the
  // ENTRY'S DECLARED SHAPE rather than on its key: `projectile`, `telegraph`,
  // `offField`, `stream`, `reaction`. That is what makes a fifteenth bit a
  // table entry plus one geometry function, and it is why the reflect and
  // adaptation audits are lookups rather than opinions — a new entry cannot
  // become secretly reflectable or secretly its own adaptation bucket.
  //
  // THE CALLOUT IS ALWAYS ISSUED, hit or miss. He said the thing; whether it
  // landed is a separate question, and a technique that only announces itself
  // on a connect would let the opponent read a whiff off the silence.
  _applyBit(caster, t, bit, mult, sure, hitOpts, opts = {}) {
    const m = this.match;
    if (!bit) return;
    caster.emit('bitRolled', { bit });
    const fwd = caster.forward();
    const at = t?.alive ? t.pos.clone() : caster.pos.clone().addScaledVector(fwd, 4);
    const from = caster.pos.clone().addScaledVector(fwd, 0.7).setY(caster.pos.y + 1.2);
    const range = opts.range ?? 6.5;
    const inRange = t?.alive && flatDist(caster.pos, t.pos) <= range + 1.0;
    const dmg = (bit.dmg ?? 0) * mult;
    const hit = {
      ...hitOpts, src: 'comedian', bit: bit.key,
      dmg: 0, kb: bit.kb ?? 0, kbY: bit.kbY ?? 0, hitstun: bit.hitstun ?? 16,
      type: bit.reaction === 'knockdown' ? 'knockdown' : bit.reaction === 'launch' ? 'launcher' : 'light'
    };

    // ---- THE GEOMETRY, one per key ---------------------------------------
    // Placed FIRST so the object exists on the frame the callout lands, even
    // for the entries whose damage is delayed behind a telegraph.
    switch (bit.key) {
      case 'glove': bigGlove(m.fx, from, fwd, Math.min(range, 5.2)); break;
      case 'mallet': mallet(m.fx, at.clone().setY(at.y)); break;
      case 'banana': bananaPeel(m.fx, at); break;
      case 'bucket': if (t) bucket(m.fx, t, bit.blind); break;
      case 'pie': pie(m.fx, from, at.clone().setY(at.y + 1.3)); break;
      case 'rake': rake(m.fx, at, fwd); break;
      case 'trapdoor': trapdoor(m.fx, at, (bit.offField ?? 1.1) + 0.35); break;
      case 'stagelight': stageLight(m.fx, at, bit.telegraph ?? 0.55); break;
      case 'anvil': anvil(m.fx, at, bit.telegraph ?? 0.35); break;
      case 'safe': safe(m.fx, at, bit.telegraph ?? 0.4, 0.34, bit.pin ?? 2); break;
      case 'curtain': curtain(m.fx, at, (bit.offField ?? 1.6) + 0.4); break;
      case 'firehose': fireHose(m.fx, from, fwd, Math.min(range * 1.5, 9)); break;
      case 'foamfinger': foamFinger(m.fx, caster.pos.clone(), caster.facing); break;
      case 'piano': piano(m.fx, at, bit.telegraph ?? 0.5); break;
    }
    m.cam.shake(0.15 + (bit.bigness ?? 0.5) * 0.45);

    // ---- 1 · IT TRAVELS ---------------------------------------------------
    // Three of the fourteen. Registered as a `bit` entity, which is the ONLY
    // key added to combat/reflect.js's REFLECTABLE table — so Uro can bend a
    // glove, a pie and a fire hose back, and nothing else.
    if (bit.projectile) {
      const ticks = bit.stream?.ticks ?? 1;
      for (let i = 0; i < ticks; i++) {
        this.entities.push({
          type: 'bit', caster, sure, bit,
          pos: from.clone(), dir: fwd.clone(),
          spd: bit.stream ? 26 : 22, range: range + 2.5, travelled: 0,
          dmg: dmg / ticks, kb: (bit.kb ?? 0) / (bit.stream ? ticks * 0.55 : 1),
          kbY: bit.kbY ?? 0, hitstun: bit.hitstun ?? 16,
          delay: i * ((bit.stream?.dur ?? 0.3) / Math.max(1, ticks)),
          // A STREAM PAYS THE METER ONCE, on its first connecting tick. The
          // fire hose is five entities carrying one bit; without this it would
          // pay `gainBigLand` five times and be, by a wide margin, the best
          // meter source in his kit — which is exactly the "one outcome is
          // clearly better than the others" the tables are tuned to avoid.
          pays: i === 0,
          hitOpts: { ...hit }, fxT: 0
        });
      }
      return;
    }

    // ---- 2 · IT ARRIVES LATER --------------------------------------------
    // The four that fall from above. The delay is the TELEGRAPH — a real light
    // cone or dust ring on the floor that can be walked out of on sight, which
    // is what pays for the biggest numbers in both tables.
    if (bit.telegraph) {
      this.entities.push({
        type: 'bitDrop', caster, sure, bit, pos: at.clone(),
        t: bit.telegraph + (bit.key === 'stagelight' ? 0.40 : 0.34),
        radius: bit.radius ?? 1.8, dmg, hitOpts: { ...hit }
      });
      return;
    }

    // ---- 3 · IT HAPPENS NOW ----------------------------------------------
    if (!inRange) { gainComedy(caster, -caster.cfg.comedy.loseWhiff, 'whiffed'); return; }

    // OFF THE FIELD — the trapdoor and the curtain. Damage first, then the
    // removal, so the small hit still registers as a hit (and still feeds the
    // meter) before the body stops being reachable.
    if (bit.reaction === 'offfield') {
      const { dmg: d } = computeDamage(caster, dmg, { canCrit: false });
      const r = t.applyHit({ ...hit, dmg: d }, m.ctxFor(caster));
      hitFeedback(m, caster, t, r, {});
      if (r === 'hit' || r === 'otg') {
        const took = t.setOffField(bit.offField, { by: caster });
        this._bitLanded(caster, bit, took);
      }
      return;
    }

    const { dmg: d, crit } = computeDamage(caster, dmg, { canCrit: false });
    const r = t.applyHit({ ...hit, dmg: d }, m.ctxFor(caster));
    hitFeedback(m, caster, t, r, { crit, heavy: (bit.bigness ?? 0) > 0.6 });
    if (r === 'hit' || r === 'otg') {
      this._bitApplyRiders(caster, t, bit);
      this._bitLanded(caster, bit, true);
    } else if (r === 'miss') {
      gainComedy(caster, -caster.cfg.comedy.loseWhiff, 'whiffed');
    }
  }

  // The non-damage payloads. Every one of them REUSES a field the fighter
  // already has, which is why "blind" and "slow" needed no new machinery:
  //   BLIND  -> `aimLag`, the stale-soft-lock timer Todo's Boogie Woogie swap
  //             already writes. Their lock-on stops tracking and their aim
  //             wanders, which is what being unable to see is in this game.
  //   SLOW   -> `floraSlow`, the multiplier Hanami's root field already owns
  //             and `speedMult` already reads.
  //   PIN    -> `hitstun`, extended. A safe on your chest is hitstun with a
  //             safe on it.
  _bitApplyRiders(caster, t, bit) {
    if (bit.blind) t.aimLag = Math.max(t.aimLag, bit.blind);
    if (bit.slow) { t.floraSlow = Math.min(t.floraSlow ?? 1, bit.slow.mult); t._bitSlowT = bit.slow.dur; }
    if (bit.pin) t.hitstun = Math.max(t.hitstun, Math.round(bit.pin * 60));
  }

  // The meter, and the one place a landed bit pays.
  _bitLanded(caster, bit, landed) {
    if (!landed || !caster.cfg.comedy) return;
    const c = caster.cfg.comedy;
    const big = caster.cfg.ct2.table.includes(bit);
    gainComedy(caster, big ? c.gainBigLand : c.gainBitLand, 'landed ' + bit.key);
    if (bit.reaction === 'knockdown') gainComedy(caster, c.gainKnockdown, 'knockdown');
    // AT MAXIMUM METER: the audience. Crowd laughter under the hit, and
    // applause on a knockdown. Presentation only — it grants nothing.
    if (caster.comedy >= c.max * c.audienceAt) {
      this.match.sfx.audienceLaugh?.(bit.bigness ?? 0.5);
      if (bit.reaction === 'knockdown') this.match.sfx.audienceApplause?.();
    }
  }

  // ---- RESONANCE, THE ACTUAL DELIVERY --------------------------------------
  // Shared by Resonance and Full Release so the two can never drift apart on
  // the one thing that matters about them: HOW they reach.
  //
  // States that belong to another system's cinematic get the damage without
  // the state change — see the long note on the `nobara_resonance` case. Every
  // other target takes an ordinary sure-hit, which is the same object the
  // domains already send and therefore automatically beats blocking, i-frames,
  // armour, Simple Domain, a standing barrier, and distance.
  _resonate(caster, target, dmg, k = 0.5, src = 'ct2', ult = false) {
    const m = this.match;
    if (!target || !target.alive) return 'dead';
    const chest = target.pos.clone().add(v3(0, 1.25, 0));
    // frozen cinematic states owned by domains / sentencing / devour
    const FROZEN = ['transfigured', 'sentenced', 'executing', 'devoured'];
    if (FROZEN.includes(target.state)) {
      target.takeChip(dmg, src);
      if (ult) m.fx.fullReleaseHit(chest, 1); else m.fx.resonanceHit(chest, k);
      m.hud.toast(target, '共鳴 — IT REACHES ANYWAY');
      return 'chip';
    }
    const r = target.applyHit({
      dmg, kb: ult ? (caster.cfg.ultimate.kb ?? 7) : 0.8,
      kbY: ult ? (caster.cfg.ultimate.kbY ?? 3) : 0,
      hitstun: ult ? (caster.cfg.ultimate.hitstun ?? 44) : (14 + Math.round(k * 20)),
      type: ult ? 'knockdown' : 'heavy',
      attacker: caster, isCT: true,
      // THE BYPASS. Exactly the flags a domain sure-hit carries — this is the
      // existing path, not a second one.
      sureHit: true, unblockable: true, otgOk: true,
      dir: v3(target.pos.x - caster.pos.x, 0, target.pos.z - caster.pos.z).normalize(),
      src,
      // Essence is TAKEN by the hit that gathers it; a Resonance is Essence
      // being spent, so it must not refund any. Explicit zero rather than
      // relying on the tier table.
      essence: 0
    }, m.ctxFor(caster));
    if (ult) m.fx.fullReleaseHit(chest, 1); else m.fx.resonanceHit(chest, k);
    hitFeedback(m, caster, target, r, { heavy: true, knockdown: ult, crit: ult });
    return r;
  }

  // called by the fighter FSM at a move's activation frame
  fire(caster, move, ctx, isRepeat = false) {
    if (!move) return;
    const key = move.effect;
    if (!key) return;
    // Copy: Opponent's CT (sword roll) mirrors the last technique they fired
    if (key !== 'sword_slash') caster.lastCT = key;
    const opts = { ...move, powerMult: move.powerMult ?? 1 };
    if (move.slot === 'copy') opts.powerMult = 1; // copy dmg already reduced in def
    this.applyTechnique(caster, key === 'nanami_collapse' || !isRepeat ? key : key, opts);
  }

  // ---- BLACK FLASH ----------------------------------------------------------
  // The timing input landed: cursed energy strikes within 0.000001s of the
  // fist. ~2.5x the connecting hit, black-red distortion, the works. Also
  // Yuji's engine: refunds CURRENT_CE and spikes MAX_CE.
  blackFlash(caster) {
    const m = this.match;
    const t = this.other(caster);
    const bf = caster.cfg.blackFlash;
    if (!t.alive || !inArc(caster, t, bf.reach ?? 2.4, 2.6)) return;
    caster.bfChain++;
    caster.res.maxCE = Math.min(100, caster.res.maxCE + (bf.maxSpike ?? 8));
    caster.res.curCE = Math.min(caster.res.maxCE, caster.res.curCE + (bf.ceRefund ?? 25));
    // NOBARA: hers pays in ESSENCE and a short damage window instead of a big
    // cursed-energy refund. Yuji's config has no `bonus`, so his payout above
    // is exactly what it was and nothing below runs for him.
    if (bf.bonus) {
      caster.gainEssence(bf.bonus.essence ?? 0, 'blackFlash');
      caster.buffs.bfCharge = Math.max(caster.buffs.bfCharge, bf.bonus.duration ?? 8);
    }
    const { dmg } = computeDamage(caster, (caster.bfBase || 5) * (bf.dmgMult ?? 2.5), { canCrit: false });
    const r = t.applyHit({
      dmg, kb: 2.5, kbY: 0.5, hitstun: 32, type: 'heavy', attacker: caster,
      isCT: false, unblockable: true, otgOk: true, dir: caster.forward(),
      // Black Flash is the same fist arriving twice — it adapts with punches
      src: 'punch'
    }, m.ctxFor(caster));
    // black core + red lightning, space visibly denting
    const chest = t.pos.clone().add(v3(0, 1.25, 0));
    for (let k = 0; k < 20; k++) {
      const a = rand(0, Math.PI * 2);
      m.fx._spawn(chest, {
        color: k % 3 === 0 ? 0x14090c : 0xff2038, size: rand(0.15, 0.45), life: rand(0.25, 0.45),
        vel: v3(Math.cos(a) * rand(4, 11), rand(-2, 7), Math.sin(a) * rand(4, 11)), gravity: 4
      });
    }
    m.fx._ring(chest, 0xff2038, { size: 0.4, growRate: 13, life: 0.35, flat: false });
    m.fx._ring(chest, 0x14090c, { size: 0.25, growRate: 8, life: 0.3, flat: false });
    m.fx.buffAura(caster, 3.5, 0xff2038); // the chain aura stacks per Flash
    caster.anim.play('bfImpact', { fade: 0.03, restart: true });
    m.hitstop(16);
    m.slowmo(0.3, 0.4);
    m.cam.shake(0.9);
    m.cam.fovKick(10);
    m.stage.flash(0.55);
    m.sfx.blackFlash();
    m.hud.toast(caster, '黒閃 BLACK FLASH' + (caster.bfChain > 1 ? ' ×' + caster.bfChain : ''));
  }

  // ---- sword-domain rolled techniques --------------------------------------
  // The roll already landed (sure-hit): everything here applies in full —
  // unblockable, ignores i-frames, OTG-capable. Fired after the reveal beat.
  queueSwordPayoff(caster, entry, delay) {
    this.entities.push({ type: 'swordPayoff', t: delay, caster, entry });
  }

  // HAKARI — the RCT counter's answer, held back a beat from the absorb so the
  // two events read as cause and effect rather than as one hit.
  queueCounterPunish(caster, target, def, delay) {
    this.entities.push({ type: 'counterPunish', t: delay, caster, target, def });
  }

  applySwordTech(caster, entry) {
    const m = this.match;
    const t = this.other(caster);
    if (!t.alive) return;
    const hitOpts = {
      attacker: caster, isCT: false, sureHit: true, unblockable: true,
      otgOk: true, dir: caster.forward(),
      // every rolled payload is the DOMAIN doing it, whatever technique the
      // roll happened to name — that is the category Mahoraga adapts to
      src: 'domain'
    };
    const chest = t.pos.clone().add(v3(0, 1.25, 0));

    switch (entry.key) {
      case 'divergent_fist': {
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 1.2, kbY: 0, hitstun: 22, type: 'heavy' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        m.fx._ring(chest, entry.color, { size: 0.4, growRate: 7, life: 0.3, flat: false });
        // the cursed energy lags behind the fist — the delayed hit launches
        this.entities.push({ type: 'delayedHit', t: entry.dur ?? 0.42, caster, dmg: entry.dmg2 ?? 13, color: entry.color });
        break;
      }
      case 'rika_slam': {
        m.fx.rikaFlash(caster, 'blast');
        m.sfx.rikaSwing();
        m.cam.cinematic(t.pos, 1.3, 3.4, 1.9);
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 5, kbY: 2, hitstun: 34, type: 'knockdown' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.8, growRate: 16, life: 0.5 });
        m.cam.shake(1.0); m.cam.fovKick(9);
        m.stage.flash(0.4);
        m.hitstop(14);
        break;
      }
      case 'cleave': {
        // crossing slash lines — clean slicing damage, leaves them standing
        for (const rot of [0.5, -0.7]) {
          const bar = m.fx._spawn(chest, { color: entry.color, size: 2.0, aspect: 0.08, life: 0.26, vel: v3() });
          m.fx._bb(bar.mesh, rot);
        }
        m.sfx.cleave();
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.8, kbY: 0, hitstun: 18, type: 'heavy' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        break;
      }
      case 'black_flash': {
        m.sfx.blackFlash();
        m.stage.flash(0.8);
        m.cam.shake(1.1); m.cam.fovKick(12);
        m.hitstop(20);
        // black core, red lightning spray
        for (let i = 0; i < 22; i++) {
          const a = rand(0, Math.PI * 2);
          m.fx._spawn(chest, {
            color: i % 3 === 0 ? 0x181018 : entry.color, size: rand(0.16, 0.5), life: rand(0.25, 0.5),
            vel: v3(Math.cos(a) * rand(4, 12), rand(-2, 8), Math.sin(a) * rand(4, 12)), gravity: 4
          });
        }
        m.fx._ring(chest, entry.color, { size: 0.5, growRate: 14, life: 0.4, flat: false });
        m.fx._ring(chest, 0x181018, { size: 0.3, growRate: 9, life: 0.35, flat: false });
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 6, kbY: 3, hitstun: 40, type: 'knockdown' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true, crit: true });
        break;
      }
      case 'dont_move': {
        // no damage: roots them — one free follow-up sword hit is the payoff
        m.sfx.root();
        const canRoot = !['knockdown', 'launched', 'getup', 'ko'].includes(t.state);
        if (canRoot) {
          t.rootT = entry.dur ?? 2.0;
          t.setState('rooted', { clip: 'stunned' });
          t.vel.x = t.vel.z = 0;
        }
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.5, growRate: 4, life: 0.6 });
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.3, growRate: 2.5, life: 0.9 });
        m.hud.toast(t, 'ROOTED');
        break;
      }
      case 'straw_doll': {
        m.sfx.resonance();
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.6, kbY: 0, hitstun: 16, type: 'light' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        // nails: spikes driven inward
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          m.fx._spawn(chest.clone().add(v3(Math.cos(a) * 0.8, rand(-0.3, 0.3), Math.sin(a) * 0.8)), {
            color: entry.color, size: 0.2, aspect: 0.25, life: 0.3,
            vel: v3(-Math.cos(a) * 4, 0, -Math.sin(a) * 4)
          });
        }
        this.entities.push({ type: 'bleed', t: entry.dur ?? 4, dps: entry.dps ?? 2.5, caster, color: entry.color });
        m.hud.toast(t, 'BLEEDING');
        break;
      }
      case 'boogie_woogie': {
        m.sfx.clap();
        // flash at both endpoints, then the swap
        for (const p of [caster.pos, t.pos]) {
          m.fx._ring(p.clone().setY(1.1), entry.color, { size: 0.5, growRate: 10, life: 0.3, flat: false });
        }
        const pa = caster.pos.clone();
        caster.pos.copy(t.pos); caster.prevPos.copy(caster.pos);
        t.pos.copy(pa); t.prevPos.copy(t.pos);
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.5, kbY: 0, hitstun: 14, type: 'light' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        m.cam.shake(0.3);
        break;
      }
      case 'shikigami': {
        m.sfx.shikigami();
        this.entities.push({ type: 'shikigami', t: entry.dur ?? 0.35, caster, dmg: entry.dmg, color: entry.color, fxT: 0 });
        break;
      }
      case 'gravity_crush': {
        m.sfx.slam();
        if (t.airborne) t.vel.set(0, -24, 0);
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.2, kbY: 0, hitstun: 30, type: 'knockdown' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        // pin: negative frame counter extends the knockdown before wakeup
        if (t.state === 'knockdown') t.f = -Math.round((entry.dur ?? 0.5) * 60);
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.6, growRate: 12, life: 0.45 });
        for (let i = 0; i < 8; i++) {
          m.fx._spawn(t.pos.clone().add(v3(rand(-0.8, 0.8), rand(1.4, 2.4), rand(-0.8, 0.8))), {
            color: entry.color, size: rand(0.1, 0.2), life: 0.3, vel: v3(0, -8, 0)
          });
        }
        m.cam.shake(0.6);
        break;
      }
      case 'copy_ct': {
        // mirror the opponent's last used technique at reduced power; if they
        // haven't shown one yet, fall back to a plain imbued cut
        if (t.lastCT) {
          m.hud.toast(caster, 'COPIED: ' + t.lastCT.replace(/_/g, ' ').toUpperCase());
          this.applyTechnique(caster, t.lastCT, { sureHit: true, powerMult: entry.powerMult ?? 0.6, src: 'domain' });
        } else {
          m.sfx.cleave();
          const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 1.5, kbY: 0, hitstun: 18, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        break;
      }
    }
  }

  // Jogo's dash leaves burning ground behind him while the dash lasts
  startBurnTrail(fighter) {
    const df = fighter.cfg.dashFire;
    if (!df) return;
    this.entities.push({ type: 'burnTrail', owner: fighter, dropT: 0, df });
  }

  update(dt) {
    const m = this.match;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      // ---- SKY REFLECT ---------------------------------------------------
      // ONE LINE, BEFORE THE PER-TYPE BRANCH. `tryReflect` swaps the entity's
      // `caster` and mirrors its heading, and the per-type code below then
      // carries it onward in the new direction with no knowledge that anything
      // happened — which is the entire reason the reflect did not require ten
      // edits. It returns false immediately for every entity type that is not
      // in the REFLECTABLE table and whenever nobody is holding a surface, so
      // this costs one lookup a frame in every match without a Uro in it.
      if (tryReflect(m, e)) continue;
      // ================================================================
      // THE OVERHAULED TECHNIQUES. Travelling waves, constructs and
      // volleys — each one draws itself at the position it tests, so the
      // picture and the hitbox can never disagree.
      // ================================================================
      // =================================================================
      // DAGON'S AND URO'S TRAVELLING ENTITIES
      // =================================================================
      // DAGON — the volley. Loose homing, like Jogo's embers and deliberately
      // slacker: these are fish, not guided missiles, and they should be
      // walkable at range and unavoidable up close.
      // =================================================================
      // TAKABA'S TRAVELLING BITS
      // =================================================================
      // THE GLOVE, THE PIE AND THE FIRE HOSE, and nothing else — the entity is
      // only ever created for a table entry that declares `projectile: true`.
      // It sits below `tryReflect` like every other travelling thing in this
      // loop, which is the whole of Uro's integration: she bends the three
      // that fly and cannot touch the eleven that do not.
      // =================================================================
      // URAUME'S AND RYU'S TRAVELLING ENTITIES
      // =================================================================
      // All five sit BELOW `tryReflect` like every other travelling thing in
      // this loop, which is the whole of their Uro integration. Two of the
      // five are in the REFLECTABLE table (`iceShard` and `ryuBeam`) and three
      // deliberately are not — see the notes on each.

      // =================================================================
      // INO'S BEASTS
      // =================================================================
      // Five entity types. Only ONE of them is a projectile in the sense
      // combat/reflect.js means — the HORN — and it is in the REFLECTABLE
      // table. The glide, the shell, the rush and the dragon's pass are all
      // BODIES moving (his, or the beast's), which reflect.js's category C
      // excludes by construction.

      // ---- THE HORN, AND THE ONE THAT DOES NOT MISS ---------------------
      // One entity for both, separated by `homing`. The homing variant turns
      // at `turn` rad/s toward the target and lives on a CLOCK rather than a
      // range — so it does not expire at a distance, it expires after 2.6
      // seconds of chasing you, which is what "will not stop until it hits"
      // has to mean in a game with a finite arena.
      if (e.type === 'inoHorn') {
        const dt2 = dt;
        const tgt = this.other(e.caster);
        if (e.homing && tgt?.alive) {
          // steer toward the target, capped — so it curves rather than snapping
          const want = tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0)).sub(e.pos);
          if (want.lengthSq() > 1e-4) {
            want.normalize();
            const maxTurn = (e.turn ?? 6.5) * dt2;
            const dot = Math.max(-1, Math.min(1, e.dir.dot(want)));
            const ang = Math.acos(dot);
            if (ang > 1e-4) {
              e.dir.lerp(want, Math.min(1, maxTurn / ang)).normalize();
            }
          }
          e.life -= dt2;
        }
        const step = e.spd * dt2;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.lookAt(e.pos.clone().add(e.dir));
          e.node.rotateX(Math.PI / 2);
          e.node.rotateY((e.spinT = (e.spinT ?? 0) + 11 * dt2));
        }
        // the trail — a spiral of the beast's own blue, which is what makes a
        // homing horn readable as it curves
        if (Math.random() < 0.8) {
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.12, 0.12), rand(-0.12, 0.12), rand(-0.12, 0.12))), {
            color: Math.random() < 0.4 ? 0xffffff : 0x6ea8ff, size: rand(0.06, 0.16),
            aspect: 0.4, life: rand(0.12, 0.30), opacity: 0.8, vel: v3()
          });
        }
        const hitR = e.radius + (tgt?.hurtBox?.pad ?? 0);
        if (!e.dealt && tgt?.alive
          && e.pos.distanceTo(tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0))) < hitR) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.def.kb, kbY: e.def.kbY, hitstun: e.def.hitstun,
            dir: e.dir.clone(), attacker: e.caster, src: e.src
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, { crit, heavy: e.homing });
          m.arena?.destruct?.damageAt(e.pos, 1.2, e.def.destruct ?? 18);
          if (e.homing) { m.hitstop(12); m.cam.shake(0.4); }
          this._disposeNode(e.node);
          this.entities.splice(i, 1);
          continue;
        }
        const done = e.homing ? e.life <= 0 : e.travelled > e.range;
        if (done) {
          m.fx._ring(e.pos.clone(), 0x6ea8ff, { size: 0.3, growRate: 6, life: 0.2, flat: false });
          this._disposeNode(e.node);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- THE GLIDE ------------------------------------------------------
      // He travels on the water. HIS OWN BODY is the hitbox, so there is no
      // node — the entity is a clock that moves him and tests once. The water
      // it leaves is real: it is what `src: 'ino_reiki'` means downstream.
      if (e.type === 'inoGlide') {
        const def = e.def;
        const step = def.speed * dt;
        e.caster.pos.addScaledVector(e.dir, step);
        m.arena?.bounds?.clampXZ?.(e.caster.pos);
        e.travelled += step;
        // the water trail, and it is the character's whole silhouette in motion
        for (let n = 0; n < 2; n++) {
          m.fx._spawn(e.caster.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.02, 0.5), rand(-0.4, 0.4))), {
            color: n ? 0x3fd0b8 : 0xdff6f0, size: rand(0.12, 0.30), aspect: 0.5,
            life: rand(0.2, 0.5), opacity: 0.7, gravity: 3,
            vel: v3(rand(-1.5, 1.5), rand(0.3, 1.6), rand(-1.5, 1.5))
          });
        }
        const tgt = this.other(e.caster);
        if (!e.dealt && tgt?.alive
          && flatDist(e.caster.pos, tgt.pos) < (def.reach ?? 1.9) + (tgt.hurtBox?.pad ?? 0)) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
            dir: e.dir.clone(), attacker: e.caster, src: def.src ?? 'ino_reiki',
            water: !!def.water
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, { crit });
        }
        if (e.travelled >= (def.travel ?? 9.5)) this.entities.splice(i, 1);
        continue;
      }

      // ---- THE SHELL ------------------------------------------------------
      // A clock holding an armour window open, and a shove when it ends.
      if (e.type === 'inoShell') {
        e.t -= dt;
        const def = e.def;
        const at = e.caster.pos.clone().add(v3(0, 1.0, 0));
        // the water dome, drawn every frame so the window is unmistakable
        if (Math.random() < 0.9) {
          const a = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.5;
          m.fx._spawn(at.clone().add(v3(
            Math.cos(a) * Math.cos(ph) * 1.1, Math.sin(ph) * 1.2, Math.sin(a) * Math.cos(ph) * 1.1)), {
            color: Math.random() < 0.35 ? 0xdff6f0 : 0x3fd0b8, size: rand(0.14, 0.30),
            aspect: 0.6, life: rand(0.15, 0.35), opacity: 0.65, vel: v3()
          });
        }
        e.caster.armorFrames = Math.max(e.caster.armorFrames ?? 0, 4);
        if (e.t > 0) continue;
        // it breaks outward
        m.cam.shake(0.3);
        m.sfx.hit?.(true);
        m.fx._ring(at, 0x3fd0b8, { size: def.radius ?? 2.4, growRate: 14, life: 0.3, flat: false });
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive) continue;
          if (flatDist(f.pos, e.caster.pos) > (def.radius ?? 2.4) + (f.hurtBox?.pad ?? 0)) continue;
          const dir = f.pos.clone().sub(e.caster.pos).setY(0);
          if (dir.lengthSq() < 1e-4) dir.copy(e.caster.forward()); else dir.normalize();
          const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
            dir, attacker: e.caster, src: def.src ?? 'ino_reiki', water: !!def.water
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit });
        }
        e.caster.shell = null;
        this.entities.splice(i, 1);
        continue;
      }

      // ---- THE HORN RUSH --------------------------------------------------
      // He and the beast go through together. `hit` is a Set, so it passes
      // through the first body rather than stopping on it — the same grammar
      // Reggie's vehicles use, and for the same reason.
      if (e.type === 'inoRush') {
        const def = e.def;
        const step = def.speed * dt;
        e.caster.pos.addScaledVector(e.dir, step);
        m.arena?.bounds?.clampXZ?.(e.caster.pos);
        e.travelled += step;
        if (Math.random() < 0.7) {
          m.fx._spawn(e.caster.pos.clone().add(v3(rand(-0.5, 0.5), rand(0.6, 1.8), rand(-0.5, 0.5))), {
            color: Math.random() < 0.4 ? 0xfff0c0 : 0xffc24a, size: rand(0.10, 0.24),
            aspect: 0.5, life: rand(0.15, 0.4), opacity: 0.8,
            vel: v3(rand(-1, 1), rand(0, 1.2), rand(-1, 1))
          });
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          if (flatDist(f.pos, e.caster.pos) > (def.reach ?? 2.1) + (f.hurtBox?.pad ?? 0)) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
            dir: e.dir.clone(), attacker: e.caster, src: def.src ?? 'ino_kirin'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
          m.cam.shake(0.3);
        }
        m.arena?.destruct?.damageAt(e.caster.pos.clone().setY(1.0), 1.6, def.destruct ?? 40);
        if (e.travelled >= (def.travel ?? 7.6)) this.entities.splice(i, 1);
        continue;
      }

      // ---- THE DRAGON'S CAST PASS -------------------------------------------
      // "A serpentine dragon that surges from his hands into the enemy" — the
      // one description canon gives of the technique nobody has survived. It
      // goes down the lane once at the top of the ultimate, and then the window
      // opens behind it.
      if (e.type === 'inoDragonPass') {
        const u = e.u;
        const step = 26 * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        // it is drawn as a fast dense coil of its own near-white
        for (let n = 0; n < 4; n++) {
          const a = e.travelled * 2.2 + n * 1.6;
          m.fx._spawn(e.pos.clone().add(v3(Math.cos(a) * 0.7, 1.0 + Math.sin(a) * 0.7, Math.sin(a * 0.7) * 0.5)), {
            color: n % 2 ? 0xd8e4ff : 0xffffff, size: rand(0.22, 0.50),
            aspect: 0.7, life: rand(0.2, 0.5), opacity: 0.85, vel: v3()
          });
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          if (flatDist(f.pos, e.pos) > (u.castRadius ?? 2.2) + (f.hurtBox?.pad ?? 0)) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, (u.castDmg ?? 26) * e.mult);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: u.castKb, kbY: u.castKbY, hitstun: u.castHitstun,
            type: 'knockdown', dir: e.dir.clone(), attacker: e.caster, src: 'ultimate'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true, knockdown: true });
          m.hitstop(14);
          m.cam.shake(0.6);
        }
        m.arena?.destruct?.damageAt(e.pos.clone().setY(1.2), 2.6, u.destruct ?? 55);
        if (e.travelled >= (u.castRange ?? 14)) this.entities.splice(i, 1);
        continue;
      }

      // =================================================================
      // REGGIE'S OBJECTS
      // =================================================================
      // Six entity types, and they sit BELOW `tryReflect` like every other
      // travelling thing in this loop — which is the whole of Uro's
      // integration. THREE of the six are in the REFLECTABLE table
      // (`reggieThrow`, `reggieVehicle`, `reggieGas` while it is still in
      // flight) and three deliberately are not: the LADDER is a swing, the
      // VENDING MACHINE arrives from above and outside the plane she holds,
      // and the HOOK is a grab. See the per-tool audit in combat/reflect.js.

      // ---- THE THROWN JUNK, AND THE HOOK'S SIBLING --------------------------
      if (e.type === 'reggieThrow') {
        // the ultimate's barrage tracks gently; the neutral throw does not
        if (e.track) {
          const tt = this.other(e.caster);
          if (tt?.alive) {
            const want = tt.pos.clone().add(v3(0, tt.hurtBox?.center ?? 1.1, 0)).sub(e.pos);
            if (want.lengthSq() > 1e-4) {
              want.normalize();
              const ang = Math.acos(Math.max(-1, Math.min(1, e.dir.dot(want))));
              if (ang > 1e-4) e.dir.lerp(want, Math.min(1, (e.track * dt) / ang)).normalize();
            }
          }
        }
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          // it TUMBLES. A thrown object that keeps its orientation reads as a
          // decal; a tumbling one reads as a thing somebody threw badly, which
          // is exactly what it is.
          e.node.rotation.x = (e.spinT = (e.spinT ?? 0) + e.spin * dt);
          e.node.rotation.y = e.spinT * 0.6 + Math.atan2(e.dir.x, e.dir.z);
        }
        const tgt = this.other(e.caster);
        const hitR = e.radius + (tgt?.hurtBox?.pad ?? 0);
        if (!e.dealt && tgt?.alive
          && e.pos.distanceTo(tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0))) < hitR) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            dir: e.dir.clone(), attacker: e.caster, src: e.src
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, { crit, heavy: e.heavy });
          m.arena?.destruct?.damageAt(e.pos, 1.0, e.destruct);
          this._breakObject(e);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled > e.range) { this._breakObject(e); this.entities.splice(i, 1); }
        continue;
      }

      // ---- THE LADDER SWING -------------------------------------------------
      // THREE swings out of one press, each its own hit, and the ladder
      // BUCKLES on the last one. It tracks his position for the length of the
      // swing so a Reggie who is being pushed keeps his reach — the same
      // treatment `_sweepBlade` gives Yuta's katana.
      if (e.type === 'reggieLadder') {
        e.t += dt;
        const k = e.t / e.span;
        const def = e.def;
        const len = def.reach ?? 4.2;
        if (e.node) {
          // swept through the arc, alternating direction each swing, hinged at
          // his hands so the far end covers real ground
          const flip = e.swing % 2 ? -1 : 1;
          const ang = e.caster.facing + flip * (def.arc ?? 1.5) * (0.5 - k);
          const grip = e.caster.pos.clone().add(v3(0, 1.15, 0));
          e.node.position.copy(grip);
          e.node.rotation.set(0, ang, Math.PI * 0.5 * flip);
          // it bends more with every swing, and on the third it is visibly bent
          e.node.scale.set(1, 1 - e.swing * 0.06, 1);
        }
        if (!e.hitThis && k > 0.42) {
          e.hitThis = true;
          const tgt = this.other(e.caster);
          if (tgt?.alive && inArc(e.caster, tgt, len + (tgt.hurtBox?.pad ?? 0), def.arc ?? 1.5)) {
            const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
            const r = tgt.applyHit({
              ...e.hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
              dir: e.caster.forward(), attacker: e.caster, src: 'reggie_ladder'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, tgt, r, { crit });
          }
          m.arena?.destruct?.damageAt(
            e.caster.pos.clone().addScaledVector(e.caster.forward(), len * 0.7).setY(1.2),
            1.4, def.destruct ?? 26);
          m.sfx.swing?.(false);
        }
        if (k >= 1) {
          e.swing++;
          e.t = 0;
          e.hitThis = false;
          if (e.swing >= e.swings) {
            // it snaps. Two halves spat out sideways, which is the read that
            // the reach is over.
            const at = e.caster.pos.clone().addScaledVector(e.caster.forward(), len * 0.5).setY(1.2);
            for (let n = 0; n < 10; n++) {
              m.fx._spawn(at.clone(), {
                color: n % 2 ? 0xc8ccd4 : 0x8a8f98, size: rand(0.08, 0.22), aspect: 0.4,
                life: rand(0.3, 0.7), gravity: 16,
                vel: v3(rand(-5, 5), rand(1, 5), rand(-5, 5))
              });
            }
            m.sfx.hit?.(true);
            this._disposeNode(e.node);
            this.entities.splice(i, 1);
          }
        }
        continue;
      }

      // ---- THE GAS CANISTER AND ITS CLOUD -----------------------------------
      // Two phases in one entity: it FLIES (and can be reflected), it LANDS,
      // and then it VENTS for two and a half seconds. The cloud does nothing
      // to health — it writes `gasBlind` on anybody standing in it, which
      // core/stage.js reads for the fog term and combat/ai.js reads for its
      // own sight test.
      if (e.type === 'reggieGas') {
        if (e.phase === 'flight') {
          e.vel.y -= 22 * dt;
          e.pos.addScaledVector(e.vel, dt);
          const floor = m.arena?.bounds?.floorAt(e.pos.x, e.pos.z, e.pos.y + 0.4) ?? 0;
          if (e.node) {
            e.node.position.copy(e.pos);
            e.node.rotation.x += dt * 7;
            e.node.rotation.z += dt * 4;
          }
          const tgt = this.other(e.caster);
          if (!e.dealt && tgt?.alive
            && e.pos.distanceTo(tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0))) < 0.7 + (tgt.hurtBox?.pad ?? 0)) {
            e.dealt = true;
            const { dmg } = computeDamage(e.caster, e.def.dmg * e.mult, { canCrit: false });
            const r = tgt.applyHit({
              ...e.hitOpts, dmg, kb: e.def.kb, kbY: e.def.kbY, hitstun: e.def.hitstun,
              dir: e.dir.clone(), attacker: e.caster, src: 'reggie_gas'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, tgt, r, {});
          }
          if (e.pos.y <= floor + 0.2) {
            e.pos.y = floor + 0.18;
            e.phase = 'vent';
            e.t = e.def.cloudDur;
            if (e.node) { e.node.position.copy(e.pos); e.node.rotation.set(Math.PI * 0.5, 0, 0); }
            m.sfx.gas?.() ?? m.sfx.hit?.(false);
          }
          continue;
        }
        // VENTING
        e.t -= dt;
        const R = e.def.radius;
        // the cloud itself — a lot of cheap slow particles, because a vision
        // block has to be genuinely opaque rather than suggestive
        for (let n = 0; n < 3; n++) {
          const a = Math.random() * Math.PI * 2;
          const rr = Math.sqrt(Math.random()) * R;
          m.fx._spawn(e.pos.clone().add(v3(Math.cos(a) * rr, rand(0.1, 2.0), Math.sin(a) * rr)), {
            color: n % 2 ? 0xd8dce2 : 0xb0b6c0, size: rand(0.8, 1.7),
            life: rand(0.7, 1.5), opacity: 0.5, gravity: -0.6,
            vel: v3(rand(-0.5, 0.5), rand(0.2, 0.9), rand(-0.5, 0.5))
          });
        }
        for (const f of m.activeFighters) {
          if (!f.alive) continue;
          if (flatDist(f.pos, e.pos) > R + (f.hurtBox?.pad ?? 0)) continue;
          // it blinds EVERYBODY inside it, Reggie included. A screen he can see
          // through is not a screen, it is an advantage with no cost.
          f.gasBlind = Math.max(f.gasBlind ?? 0, e.def.occlude ?? 0.8);
          f.gasBlindT = 0.2;
        }
        if (e.t <= 0) { this._disposeNode(e.node); this.entities.splice(i, 1); }
        continue;
      }

      // ---- THE HOOK ---------------------------------------------------------
      // Out, catch, reel. WHICH BODY MOVES is `kbResist` — see the case above.
      if (e.type === 'reggieHook') {
        const def = e.def;
        const grip = e.caster.pos.clone().add(v3(0, 1.2, 0)).addScaledVector(e.caster.forward(), 0.35);
        if (e.rod) {
          e.rod.position.copy(grip);
          e.rod.rotation.set(0.9, e.caster.facing, 0);
        }
        if (e.phase === 'out') {
          const step = def.speed * dt;
          e.pos.addScaledVector(e.dir, step);
          e.travelled += step;
          const tgt = this.other(e.caster);
          if (tgt?.alive
            && e.pos.distanceTo(tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0))) < 0.85 + (tgt.hurtBox?.pad ?? 0)) {
            e.phase = 'reel';
            e.caught = tgt;
            e.reelT = 0;
            // ============================================================
            // *** THE MASS DECISION, AND IT IS MADE ONCE, HERE. ***
            // ============================================================
            // The first version applied a per-frame positional nudge to both
            // bodies, scaled by `kbResist`, and it did not work: measured in a
            // live match at kbResist 1.0, 1.6 and 2.4 the result was IDENTICAL
            // every time (0.45 m of caster movement, 0.93 m of target
            // movement, and the same 7.62 m final gap). Writing `pos` directly
            // every frame fights the fighter's own movement resolution and the
            // two settle into an equilibrium that has nothing to do with mass.
            //
            // It now uses `beginForced` — the same mechanism Inumaki's COME
            // HERE and RUN AWAY use, which puts the body in the `commanded`
            // state where the physics EXPECTS to be driven — and the mass
            // question becomes BINARY, which is both correct and better:
            //
            //     lighter than him  ->  THEY come to HIM
            //     heavier than him  ->  HE goes to THEM
            //
            // A continuous scaling was never legible in play anyway; "the rod
            // pulls the lighter body" is a rule a player can learn in one
            // exchange. The threshold is 1.25x his own resistance, which puts
            // Todo (0.72 -> heavier), Panda (0.78), Yuki, Hanami, Kurourushi,
            // Dagon and Mahoraga on the "he goes to them" side and everybody
            // else on the "they come to him" side.
            //
            // NOTE THAT `kbResist` IS INVERTED: a LOWER number is a HEAVIER
            // body (it resists knockback more). The comparison below reads
            // that way round and the two named lists above were checked
            // against the actual configs rather than assumed.
            const theirs = tgt.cfg.kbResist ?? 1;
            const mine = e.caster.cfg.kbResist ?? 1;
            const theyAreHeavier = theirs < mine / 1.25;
            const puller = theyAreHeavier ? e.caster : tgt;
            const anchor = theyAreHeavier ? tgt : e.caster;
            // 0.42 s of drag. `beginForced` stops short at PULL_STOP (1.65 m)
            // so it always delivers to punching range and never through.
            // *** THE HIT LANDS FIRST AND THE PULL SECOND, AND THE ORDER IS
            // THE WHOLE FIX. *** `applyHit` puts the target in `hitLight`,
            // which is a `setState` — so a `beginForced` called BEFORE it was
            // silently overwritten one line later and the rod pulled nobody
            // anywhere. Measured: five different mass values, zero movement in
            // all five. Inumaki's pull command has never hit this because his
            // pull deals no damage at all.
            const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
            const r = tgt.applyHit({
              ...e.hitOpts, dmg, kb: 0, kbY: 0, hitstun: def.hitstun,
              dir: e.dir.clone(), attacker: e.caster, src: 'reggie_rod'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, tgt, r, { crit });
            m.sfx.grab?.() ?? m.sfx.hit?.(false);
            // ...and NOW the drag, on whichever body the mass rule chose. It
            // is applied even when the hit was blocked or armoured through: a
            // hook that caught you still has you on the end of it.
            // *** AND IF IT IS HE WHO IS BEING DRAGGED, HIS OWN CAST HAS TO
            // BE CANCELLED FIRST. *** He is still in the rod's `ct` state at
            // this moment — the hook catches around frame 30 of a 43-frame
            // move — and that state calls `setState('idle')` when its frames
            // run out, which silently overwrote the `commanded` state
            // `beginForced` had just set. Measured: the target-side pull moved
            // bodies 0.6-2.4 m and the caster-side pull moved him exactly zero
            // every time, at every mass.
            //
            // Clearing the move is also correct on its own terms: a man who
            // has just hooked something twice his weight is not finishing his
            // follow-through, he is being taken off his feet.
            if (theyAreHeavier) {
              e.caster.move = null;
              e.caster.activeHit = null;
            }
            beginForced(puller, 'pull', def.pullTime ?? 0.42, def.pull, anchor.pos);
            e.caster.emit?.('reeled', { pulledSelf: theyAreHeavier });
          } else if (e.travelled > def.range) {
            e.phase = 'back';
          }
        } else if (e.phase === 'reel') {
          e.reelT += dt;
          e.pos.copy(e.caught?.pos ?? e.pos).add(v3(0, e.caught?.hurtBox?.center ?? 1.1, 0));
          if (e.reelT > 0.12) e.phase = 'back';
        } else {
          // returning
          const back = grip.clone().sub(e.pos);
          const step = def.speed * 1.4 * dt;
          if (back.length() < step) {
            this._disposeNode(e.rod); this._disposeNode(e.hook);
            this.entities.splice(i, 1);
            continue;
          }
          e.pos.addScaledVector(back.normalize(), step);
        }
        if (e.hook) {
          e.hook.position.copy(e.pos);
          e.hook.lookAt(grip);
        }
        // THE LINE. Drawn every frame between the rod tip and the hook, so the
        // grapple is a visible physical connection rather than two objects
        // that happen to be moving toward each other.
        m.fx._spawn(grip.clone().lerp(e.pos, Math.random()), {
          color: 0xf0f4f8, size: 0.035, aspect: 0.25, life: 0.06, opacity: 0.8, vel: v3()
        });
        continue;
      }

      // ---- THE MOPED AND THE CAR --------------------------------------------
      // One entity, two scales. It KEEPS GOING through the first thing it hits
      // — `hit` is a Set, not a flag — which is what makes both of them beat a
      // wake-up and what makes a car genuinely frightening in a free-for-all.
      if (e.type === 'reggieVehicle') {
        const def = e.def;
        const step = def.speed * dt;
        e.pos.addScaledVector(e.dir, step);
        e.pos.y = m.arena?.bounds?.floorAt(e.pos.x, e.pos.z, e.pos.y + 0.8) ?? e.pos.y;
        e.travelled += step;
        e.wheelSpin += dt * (e.big ? 14 : 22);
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.rotation.y = Math.atan2(e.dir.x, e.dir.z);
          // it lurches. A vehicle travelling on a perfectly level path reads as
          // a sprite; a small pitch oscillation reads as suspension.
          e.node.rotation.x = Math.sin(e.wheelSpin * 0.5) * (e.big ? 0.03 : 0.06);
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          if (flatDist(f.pos, e.pos) > def.radius + (f.hurtBox?.pad ?? 0)) continue;
          if (Math.abs(f.pos.y - e.pos.y) > 2.4) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
            type: def.type ?? 'knockdown', dir: e.dir.clone(), attacker: e.caster, src: e.src
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true, knockdown: true });
          m.cam.shake(e.big ? 0.6 : 0.3);
          m.hitstop(e.big ? 14 : 8);
        }
        m.arena?.destruct?.damageAt(e.pos.clone().setY(e.pos.y + 0.8), e.big ? 2.4 : 1.4, def.destruct);
        // exhaust / tyre smoke, so the lane it took is readable after the fact
        if (Math.random() < (e.big ? 0.8 : 0.5)) {
          m.fx._spawn(e.pos.clone().addScaledVector(e.dir, -1.2).add(v3(rand(-0.4, 0.4), 0.2, rand(-0.4, 0.4))), {
            color: 0x9aa0aa, size: rand(0.2, 0.5), life: rand(0.3, 0.7), opacity: 0.4,
            gravity: -0.8, vel: v3(rand(-0.4, 0.4), rand(0.3, 1.0), rand(-0.4, 0.4))
          });
        }
        if (e.travelled > def.travel) {
          // it crashes. Big shake, big debris, real destruction at the end of
          // the lane — a car that simply stops at 16 m would be a lie.
          m.cam.shake(e.big ? 0.9 : 0.4);
          m.sfx.hit?.(true);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(e.pos.y + 0.9), e.big ? 3.2 : 1.8, def.destruct);
          for (let n = 0; n < (e.big ? 22 : 12); n++) {
            m.fx._spawn(e.pos.clone().add(v3(rand(-1, 1), rand(0.2, 1.6), rand(-1, 1))), {
              color: n % 3 === 0 ? 0xffb060 : (n % 3 === 1 ? 0x4a8ac8 : 0x9aa0aa),
              size: rand(0.10, 0.34), life: rand(0.3, 0.8), gravity: 18,
              vel: v3(rand(-7, 7), rand(2, 8), rand(-7, 7))
            });
          }
          this._disposeNode(e.node);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- THE VENDING MACHINE, ARRIVING -------------------------------------
      // A timer with a visible object falling down it. It hits WHERE IT WAS
      // AIMED — see the case above — and the wreck it leaves is handed to
      // combat/receipts.js, which owns its colliders and its lifetime.
      if (e.type === 'reggieDrop') {
        e.t -= dt;
        if (e.node) {
          const k = 1 - Math.max(0, e.t) / e.total;
          e.node.position.copy(e.at).add(v3(0, 9.0 * (1 - k * k), 0));
          e.node.rotation.y = k * 1.2;
        }
        if (e.t > 0) continue;
        const def = e.def;
        m.cam.shake(0.8);
        m.hitstop(16);
        m.sfx.hit?.(true);
        m.arena?.destruct?.damageAt(e.at.clone().setY(e.at.y + 0.6), 2.4, def.destruct);
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive) continue;
          if (flatDist(f.pos, e.at) > def.radius + (f.hurtBox?.pad ?? 0)) continue;
          if (Math.abs(f.pos.y - e.at.y) > 2.6) continue;
          const { dmg, crit } = computeDamage(e.caster, def.dmg * e.mult);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun,
            type: 'knockdown', dir: v3(0, -1, 0), attacker: e.caster, src: 'reggie_vending'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true, knockdown: true });
        }
        for (let n = 0; n < 18; n++) {
          m.fx._spawn(e.at.clone().add(v3(rand(-1.4, 1.4), rand(0.05, 1.2), rand(-1.4, 1.4))), {
            color: n % 4 === 0 ? 0xfff0c0 : (n % 4 === 1 ? 0xc4322a : 0xbfe0f0),
            size: rand(0.08, 0.28), life: rand(0.3, 0.8), gravity: 17,
            vel: v3(rand(-6, 6), rand(1, 6), rand(-6, 6))
          });
        }
        this._disposeNode(e.node);
        m.receipts?.spawnWreck(e.caster, e.at.clone(), def);
        this.entities.splice(i, 1);
        continue;
      }

      // ---- THE ULTIMATE'S BARRAGE --------------------------------------------
      // A metronome. Every `interval` it throws one junk object at the target
      // for `perShot` damage, and on the last beat it materialises the finale
      // object — which is a real `reggie_vehicle` / `reggie_drop`, not a
      // scripted flash, so the ending of the ultimate is the same object the
      // player has been buying all round.
      if (e.type === 'reggieBarrage') {
        e.t += dt;
        e.next -= dt;
        const tgt = this.other(e.caster);
        if (e.next <= 0 && e.fired < e.shots) {
          e.next = e.interval;
          e.fired++;
          const at = e.caster.pos.clone().add(v3(rand(-0.4, 0.4), rand(1.0, 1.8), 0))
            .addScaledVector(e.caster.forward(), 0.5);
          burnFX(m, at, { scale: 0.5, up: 0.4 });
          const junkKeys = e.caster.cfg.objects?.junk ?? ['cone'];
          const jk = junkKeys[e.fired % junkKeys.length];
          const node = buildJunk(jk);
          m.root.add(node);
          const dir = tgt?.alive
            ? tgt.pos.clone().add(v3(0, 1.0, 0)).sub(at).normalize()
            : e.caster.forward();
          this.entities.push({
            type: 'reggieThrow', caster: e.caster, node, jk,
            // *** THE BARRAGE OBJECTS TRACK. *** The ordinary Quick
            // Materialise does not and must not — a neutral projectile that
            // follows you is not a neutral projectile. But the ULTIMATE is
            // "he empties the register at you", and eighteen objects thrown at
            // where you were standing is not that. `track` is a gentle 3.2
            // rad/s correction, enough to follow a rocked target and nowhere
            // near enough to follow one who dashes.
            // 6.5 rad/s, not 3.2. Measured: at 3.2 the barrage landed about
            // four hits in ten against a STATIONARY target six metres away,
            // because eighteen objects launched from a moving shoulder at a
            // body that is being rocked converge badly. This is not a homing
            // missile — it is a man throwing eighteen things at you from six
            // metres, and at that range and that speed 6.5 rad/s is simply
            // "he is not missing on purpose".
            track: 6.5,
            pos: at.clone(), dir, spd: 30, range: 22, travelled: 0, radius: e.u.radius ?? 1.35,
            dmg: e.perShot * e.mult, kb: e.u.kb, kbY: e.u.kbY, hitstun: e.u.hitstun,
            destruct: e.u.destruct, spin: rand(10, 20), src: 'ultimate',
            hitOpts: { ...e.hitOpts, src: 'ultimate' }, dealt: false, heavy: false
          });
          m.sfx.throwLight?.();
        }
        if (e.fired >= e.shots) {
          // THE FINALE. Reuses the ordinary object cases, so a barrage that
          // ends on a car ends on the real car with the real destruction.
          const def = e.caster.cfg.objects.defs[e.finale];
          const big = { ...def, dmg: e.u.finaleDmg, kb: e.u.finaleKb, kbY: e.u.finaleKbY,
            hitstun: e.u.finaleHitstun, destruct: e.u.finaleDestruct };
          this.applyTechnique(e.caster, def.effect, { def: big, src: 'ultimate', powerMult: e.mult });
          m.cam.shake(1.0);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- ICEFALL'S SHARDS -------------------------------------------------
      // Real geometry, moved by the same vector that decides the hit, so the
      // picture and the hitbox are one position.
      if (e.type === 'iceShard') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          // it flies POINT-FIRST and rolls about its own axis — the roll is
          // what makes a faceted solid read as a solid rather than as a decal
          e.node.lookAt(e.pos.clone().add(e.dir));
          e.node.rotateX(Math.PI / 2);
          e.node.rotateY((e.spinT = (e.spinT ?? 0) + e.spin * dt));
        }
        const tgt = this.other(e.caster);
        const hitR = 0.62 + (tgt?.hurtBox?.pad ?? 0);
        if (!e.dealt && tgt?.alive
          && (e.sure || e.pos.distanceTo(tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0))) < hitR)) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            dir: e.dir.clone(), sureHit: e.sure, attacker: e.caster, src: 'projectile'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          if (r === 'hit' || r === 'otg') {
            // THE ORDER MATTERS. `isFrostbound` is read BEFORE the stack is
            // applied, so a shard that lands on an already-shelled target
            // calls the icicle down — and a shard that lands on a target it
            // is itself about to shell does not, because the icicle is the
            // reward for keeping the pressure on an existing shell rather
            // than a bonus attached to the hit that made one.
            //
            // (The shell has ALSO already been broken by this hit — see the
            // shatter hook in Fighter.applyHit — so this read has to happen
            // before that resolves... which it does, because `applyHit`
            // returns after shattering and `wasBound` was captured before the
            // call. That capture is the whole reason the variable exists.)
            if (e.wasBound) this._iceFall(e.caster, tgt, e.icicle);
            applyFrost(m, tgt, e.frost ?? 1, e.caster);
          }
          this._killIceShard(e);
          this.entities.splice(i, 1);
          continue;
        }
        // captured for the NEXT frame's icicle test, before anything hits
        e.wasBound = isFrostbound(tgt);
        if (e.travelled > e.range) {
          // it lands and shatters on the floor, leaving a little rime
          m.fx._ring(e.pos.clone().setY(0.05), 0xa8dce8, { size: 0.2, growRate: 3, life: 0.2, flat: true });
          this._killIceShard(e);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- THE ICICLE, ARRIVING ---------------------------------------------
      // A pure timer. It hits WHERE IT WAS AIMED rather than where the victim
      // now is, which is what makes moving out of it a real answer — the same
      // grammar Jogo's eruption marker and Hanami's root marker already use.
      if (e.type === 'icicle') {
        e.t -= dt;
        if (e.t > 0) continue;
        const at = v3(e.x, e.y, e.z);
        m.cam.shake(0.34);
        m.arena?.destruct?.damageAt(at.clone().setY(e.y + 0.4), 1.6, 34);
        m.fx._ring(at.clone().setY(e.y + 0.05), 0x4fd8e8, { size: 0.3, growRate: 12, life: 0.26, flat: true });
        for (let k = 0; k < 12; k++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.1, 0.8), rand(0.05, 0.9), Math.sin(a) * rand(0.1, 0.8))), {
            color: k % 3 === 0 ? 0x4fd8e8 : 0xdff2fb, size: rand(0.10, 0.30), aspect: 0.5,
            life: rand(0.2, 0.5), gravity: 12,
            vel: v3(Math.cos(a) * rand(1, 4), rand(1, 4), Math.sin(a) * rand(1, 4))
          });
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive) continue;
          if (flatDist(f.pos, at) > (e.def.radius ?? 1.5) + (f.hurtBox?.pad ?? 0)) continue;
          if (Math.abs(f.pos.y - e.y) > 1.6) continue;
          const { dmg, crit } = computeDamage(e.caster, e.def.dmg ?? 9);
          const r = f.applyHit({
            attacker: e.caster, isCT: true, src: 'ct1', dmg,
            kb: 1.0, kbY: e.def.kbY ?? 2.0, hitstun: e.def.hitstun ?? 20,
            type: 'heavy', dir: v3(0, -1, 0)
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
        }
        this.entities.splice(i, 1);
        continue;
      }

      // ---- FROST CALM'S BARRIER WALLS ---------------------------------------
      // Not a projectile and not damage: a clock that takes real colliders back
      // out of the Bounds. It exists so the walls cannot outlive the columns
      // and so the spatial grids cannot grow across a long session — `drop`
      // unlinks them completely rather than marking them dead.
      if (e.type === 'iceWalls') {
        e.t -= dt;
        if (e.t <= 0) {
          e.bounds.drop(e.walls);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- THE GLACIATION WALL ----------------------------------------------
      // Uraume's ultimate, crossing the arena. DELIBERATELY NOT REFLECTABLE:
      // it is a wall of ice moving across the GROUND, which is the same shape
      // as Hanami's roots and Dagon's tidal surge, and combat/reflect.js
      // already rules that family closer to terrain than to a projectile.
      // Bending a glacier back would also mean bending the terrain it has
      // already laid, which has no meaning.
      if (e.type === 'glacier') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.position.y = m.arena?.bounds?.floorAt?.(e.pos.x, e.pos.z, e.pos.y + 2) ?? e.pos.y;
        }
        // it lays permanent ice behind itself as it goes
        e.iceEvery -= step;
        if (e.iceEvery <= 0) {
          e.iceEvery = 4.0;
          m.ice?.freeze(e.caster, {
            x: e.pos.x, y: e.pos.y, z: e.pos.z,
            radius: e.width * 0.72,
            duration: e.iceDef?.duration ?? 999
          });
        }
        m.arena?.destruct?.damageAt(e.pos.clone().setY(e.pos.y + 1.0), e.width * 0.6, e.destruct);
        for (let k = 0; k < 3; k++) {
          const a = rand(-e.width / 2, e.width / 2);
          const side = e.dir.clone().applyAxisAngle(v3(0, 1, 0), Math.PI / 2).multiplyScalar(a);
          m.fx._spawn(e.pos.clone().add(side).add(v3(0, rand(0.2, 3.0), 0)), {
            color: k === 0 ? 0x4fd8e8 : 0xdff2fb, size: rand(0.14, 0.42), aspect: 0.55,
            life: rand(0.3, 0.8), gravity: 3,
            vel: v3(rand(-1, 1), rand(1, 4), rand(-1, 1))
          });
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          const rel = f.pos.clone().sub(e.pos);
          const along = rel.x * e.dir.x + rel.z * e.dir.z;
          const perp = Math.abs(rel.x * e.dir.z - rel.z * e.dir.x);
          if (!(along > -1.4 && along < 1.4 && perp < e.width / 2 + (f.hurtBox?.pad ?? 0))) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            // NOT a knockdown. A body on the floor cannot be encased in a way
            // anybody can see, and a knockdown reaction owns the fighter for
            // longer than the shell lasts. `heavy` staggers them where they
            // stand and hands them straight to the ice.
            type: e.hitType ?? 'heavy',
            dir: e.dir.clone(), attacker: e.caster, sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
          // MAXIMUM FROST. Everything the wall touches is shelled on the spot,
          // which is what "applying maximum frost" has to mean when the stack
          // cap and the shell trigger are the same number.
          if (r === 'hit' || r === 'otg') {
            applyFrost(m, f, e.frost, e.caster, { ultRoot: e.ultRoot });
          }
        }
        m.minions?.hurtAt(e.pos.clone(), e.width * 0.6, e.dmg * 0.7, e.caster);
        m.curses?.hurtAt(e.pos.clone(), e.width * 0.6, e.dmg * 0.7, e.caster);
        if (e.travelled > e.range) {
          this._disposeNode(e.node);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- RYU'S RAPID SHOTS ------------------------------------------------
      // DELIBERATELY NOT IN THE REFLECTABLE TABLE, and this is the one ruling
      // in the pair that is a judgement call rather than a lookup. They travel,
      // so on the "does it travel" test alone they would qualify. They are
      // excluded because of what the reflect is FOR: Uro's surface is a read
      // she commits twenty frames to, priced against turning one committed
      // technique around. A three-shot volley with a 12-frame startup that Ryu
      // throws constantly is the wrong size of thing for that trade in both
      // directions — she would either reflect one 5.5-damage pellet for her
      // whole stance, or the volley would become unusable into her. His
      // BEAM is the committed technique and the beam is what she bends.
      if (e.type === 'ryuShot') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        if (e.arc) { e.pos.y += e.vy * dt; e.vy -= 11 * dt; }
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx._spawn(e.pos.clone(), {
            color: Math.random() < 0.4 ? 0xfaffe8 : 0xd8f05a, size: 0.20, aspect: 0.7,
            life: 0.14, opacity: 0.8, vel: v3()
          });
        }
        const tgt = this.other(e.caster);
        const hitR = 0.70 + (tgt?.hurtBox?.pad ?? 0);
        if (!e.dealt && tgt?.alive
          && (e.sure || e.pos.distanceTo(tgt.pos.clone().add(v3(0, tgt.hurtBox?.center ?? 1.1, 0))) < hitR)) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            dir: e.dir.clone(), sureHit: e.sure, attacker: e.caster, src: 'projectile'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          m.arena?.destruct?.damageAt(e.pos.clone(), 1.2, e.destruct);
          m.fx._ring(e.pos.clone(), 0xd8f05a, { size: 0.2, growRate: 6, life: 0.16, flat: false });
          this.entities.splice(i, 1);
          continue;
        }
        // it hits the floor, or runs out
        const floor = m.arena?.bounds?.floorAt?.(e.pos.x, e.pos.z, e.pos.y) ?? 0;
        if (e.travelled > e.range || e.pos.y <= floor + 0.05) {
          m.arena?.destruct?.damageAt(e.pos.clone(), 1.4, e.destruct);
          m.fx._ring(e.pos.clone().setY(floor + 0.05), 0xd8f05a, { size: 0.25, growRate: 8, life: 0.2, flat: true });
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- GRANITE BLAST ----------------------------------------------------
      // A travelling FRONT with a solid body behind it. The node is stretched
      // from the muzzle to the front so the beam looks like it is being
      // extruded rather than flying — which is both what a beam does and what
      // makes the reflection legible when Uro turns it around, because the
      // whole object visibly reverses.
      //
      // *** IN THE REFLECTABLE TABLE. *** Canon: Uro has the advantage on Ryu
      // precisely because she redirects his blasts, and a redirected Granite
      // Blast is how he loses his fight. See the delivery report for what a
      // reflected tier-4 actually does to him — the short version is that
      // `selfEnergyResist` below is the reason it is not a round-ender.
      if (e.type === 'ryuBeam') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.life -= dt;
        if (e.node) {
          // the head is at `pos`; the tail trails behind it up to `range`
          const tail = Math.min(e.travelled, e.range);
          e.node.position.copy(e.pos).addScaledVector(e.dir, -tail);
          e.node.lookAt(e.node.position.clone().add(e.dir));
          const k = tail / Math.max(0.001, e.range);
          e.node.scale.set(1, 1, Math.max(0.05, k));
          for (const ring of e.node.userData.rings ?? []) {
            ring.position.z += 26 * dt;
            if (ring.position.z > e.node.userData.len) ring.position.z = 0;
          }
        }
        m.arena?.destruct?.damageAt(e.pos.clone(), e.radius * 1.4, e.destruct);
        for (let k = 0; k < 2; k++) {
          m.fx._spawn(e.pos.clone().add(v3(rand(-e.radius, e.radius), rand(-e.radius, e.radius), rand(-e.radius, e.radius))), {
            color: k === 0 ? 0xfaffe8 : 0xd8f05a, size: rand(0.16, 0.44), aspect: 0.6,
            life: rand(0.14, 0.34), vel: v3(rand(-2, 2), rand(-1, 3), rand(-2, 2))
          });
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          const chest = f.pos.clone().add(v3(0, f.hurtBox?.center ?? 1.1, 0));
          if (!e.sure && chest.distanceTo(e.pos) > e.radius + 0.5 + (f.hurtBox?.pad ?? 0)) continue;
          e.hit.add(f);
          // ---- THE OWNER'S OWN ENERGY -------------------------------------
          // If this beam is coming back at the man who fired it (Uro bent it),
          // he takes REDUCED damage from it. Canon and not a patch: Ryu's
          // "immense endurance" entry records that he withstood being hit with
          // his own Granite Blast, and reinforced his body hard enough to
          // reduce Sukuna's Dismantle to a single cut. `e.origin` is stamped at
          // spawn and is never rewritten by the reflect (which rewrites
          // `caster`), so this is the one place the two can be told apart.
          const own = f === e.origin;
          const scale = own ? (f.cfg.selfEnergyResist ?? 0.45) : 1;
          const { dmg, crit } = computeDamage(e.caster, e.dmg * scale);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: e.tier >= 2 ? 'knockdown' : 'heavy',
            dir: e.dir.clone(), attacker: e.caster, sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true, knockdown: e.tier >= 2 });
          if (own && r === 'hit') m.hud?.toast?.(f, '自分の呪力 — OWN OUTPUT');
        }
        m.minions?.hurtAt(e.pos.clone(), e.radius * 1.2, e.dmg * 0.7, e.caster);
        m.curses?.hurtAt(e.pos.clone(), e.radius * 1.2, e.dmg * 0.7, e.caster);
        if (e.travelled > e.range || e.life <= 0) {
          this._disposeNode(e.node);
          this.entities.splice(i, 1);
        }
        continue;
      }

      // ---- MAXIMUM OUTPUT ---------------------------------------------------
      // A SUSTAINED beam rather than a travelling one: it exists at full
      // length for `hold` seconds and is swept with the left stick. DELIBERATELY
      // NOT REFLECTABLE — it is category B in combat/reflect.js, an instant
      // line that is already through her by the time it exists, which is the
      // same ruling Hollow Purple, Uzumaki, Fire Arrow and Piercing Blood get
      // and for the same reason. Their counterplay is the enormous startup they
      // were priced around, and this one's is 42 frames of a man visibly
      // digging himself into the floor.
      if (e.type === 'ryuMax') {
        e.t += dt;
        // THE SWEEP. The left stick drags the beam across the arena, clamped
        // to `sweep` radians either side of where it started.
        const inp = m.inputFor?.(e.caster);
        if (inp?.move && Math.abs(inp.move.x) > 0.2) {
          e.baseYaw += inp.move.x * 1.15 * dt;
        }
        e.dir.set(Math.sin(e.baseYaw), 0, Math.cos(e.baseYaw));
        const mz = e.caster.model?.muzzle;
        e.pos.copy(e.caster.pos).add(v3(0, mz?.y ?? 1.8, 0))
          .addScaledVector(e.dir, (mz?.ahead ?? 0.2) + e.radius * 0.4);
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.lookAt(e.pos.clone().add(e.dir));
          const flicker = 0.9 + Math.sin(e.t * 40) * 0.1;
          e.node.scale.set(flicker, flicker, 1);
        }
        // THE ENVIRONMENT. Walked out step by step at `erase` strength — the
        // same kind Hollow Purple uses, and the only other move in the game
        // that gets it.
        e.tickT -= dt;
        if (e.tickT <= 0) {
          e.tickT = 0.06;
          for (let s = 1; s <= e.destroySteps; s++) {
            m.arena?.destruct?.damageAt(
              e.pos.clone().addScaledVector(e.dir, s * e.destroyStep),
              e.destroyRadius, e.destroyPower, { kind: e.destroyKind });
          }
          m.cam.shake(0.5);
        }
        for (let k = 0; k < 5; k++) {
          const along = rand(0, e.range);
          m.fx._spawn(e.pos.clone().addScaledVector(e.dir, along)
            .add(v3(rand(-e.radius, e.radius), rand(-e.radius, e.radius), rand(-e.radius, e.radius))), {
            color: k % 2 === 0 ? 0xfaffe8 : 0xd8f05a, size: rand(0.2, 0.7), aspect: 0.6,
            life: rand(0.16, 0.4), vel: v3(rand(-3, 3), rand(-1, 4), rand(-3, 3))
          });
        }
        // DAMAGE TICKS rather than one hit, so sweeping ONTO somebody catches
        // them and sweeping OFF them stops. The per-second rate is the config's
        // total divided by the hold, so the printed number is what a target
        // standing in it for the whole beam actually takes.
        e.dmgT = (e.dmgT ?? 0) - dt;
        if (e.dmgT <= 0) {
          e.dmgT = 0.15;
          const per = e.dmg * (0.15 / e.hold);
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            const rel = f.pos.clone().sub(e.caster.pos);
            const along = rel.x * e.dir.x + rel.z * e.dir.z;
            const perp = Math.abs(rel.x * e.dir.z - rel.z * e.dir.x);
            if (!e.sure && !(along > 0 && along < e.range && perp < e.radius + (f.hurtBox?.pad ?? 0))) continue;
            const { dmg } = computeDamage(e.caster, per, { canCrit: false });
            const r = f.applyHit({
              ...e.hitOpts, dmg, kb: e.kb * 0.2, kbY: e.kbY * 0.2,
              hitstun: e.hitstun, type: 'heavy', dir: e.dir.clone(), attacker: e.caster
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { heavy: true });
          }
          m.minions?.hurtAt(e.caster.pos.clone().addScaledVector(e.dir, e.range * 0.4), e.range * 0.4, per, e.caster);
          m.curses?.hurtAt(e.caster.pos.clone().addScaledVector(e.dir, e.range * 0.4), e.range * 0.4, per, e.caster);
        }
        if (e.t >= e.hold) {
          this._disposeNode(e.node);
          m.stage.flash(0.3);
          this.entities.splice(i, 1);
        }
        continue;
      }

      if (e.type === 'bit') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.04;
          m.fx._spawn(e.pos.clone(), {
            color: e.bit.color, size: 0.16, life: 0.16, opacity: 0.7, vel: v3(0, 0.2, 0)
          });
        }
        const tgt = this.other(e.caster);
        if (tgt?.alive && (e.sure || e.pos.distanceTo(tgt.pos.clone().add(v3(0, 1.15, 0))) < 0.92 + (tgt.hurtBox?.pad ?? 0))) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            dir: e.dir.clone(), sureHit: e.sure, attacker: e.caster
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          if (r === 'hit' || r === 'otg') {
            this._bitApplyRiders(e.caster, tgt, e.bit);
            this._bitLanded(e.caster, e.bit, e.pays !== false);
          }
          m.fx.impactBloom?.(e.pos.clone(), e.bit.color, 0.6);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) {
          // A WHIFF COSTS METER. It is the only thing in his kit that does,
          // and it is what stops "press RB forever" being the whole character.
          // Charged once per CAST, not once per entity — same reason the gain
          // is (see `pays` above).
          if (e.caster.cfg.comedy && e.pays !== false) gainComedy(e.caster, -e.caster.cfg.comedy.loseWhiff, 'whiffed');
          this.entities.splice(i, 1);
        }
        continue;
      }
      // THE FOUR THAT FALL FROM ABOVE — the anvil, the safe, the piano and the
      // stage light. They resolve at a POINT ON THE FLOOR after their
      // telegraph, so walking out of the marked circle is a complete answer.
      // That is the entire price of the biggest numbers in both tables.
      if (e.type === 'bitDrop') {
        e.t -= dt;
        if (e.t > 0) continue;
        const tgt = this.other(e.caster);
        const caught = tgt?.alive && flatDist(tgt.pos, e.pos) <= e.radius;
        if (caught) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const dir = v3(tgt.pos.x - e.caster.pos.x, 0, tgt.pos.z - e.caster.pos.z);
          if (dir.lengthSq() < 1e-4) dir.copy(e.caster.forward());
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, dir: dir.normalize(), attacker: e.caster, sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, { heavy: true });
          if (r === 'hit' || r === 'otg') {
            this._bitApplyRiders(e.caster, tgt, e.bit);
            this._bitLanded(e.caster, e.bit, true);
            m.hitstop(e.bit.bigness > 0.8 ? 12 : 7);
          }
        } else if (e.caster.cfg.comedy) {
          gainComedy(e.caster, -e.caster.cfg.comedy.loseWhiff, 'walked out of it');
        }
        // THE PIANO'S WRECK. It comes apart, and the debris chips anything
        // standing near it — including a target who dodged the piano itself
        // but did not leave the room.
        if (e.bit.shards && tgt?.alive && flatDist(tgt.pos, e.pos) <= e.bit.shards.radius) {
          const { dmg } = computeDamage(e.caster, e.bit.shards.dmg, { canCrit: false });
          tgt.applyHit({
            ...e.hitOpts, dmg, kb: 0.8, kbY: 0, hitstun: 8, type: 'light',
            attacker: e.caster, dir: e.caster.forward()
          }, m.ctxFor(e.caster));
        }
        this.entities.splice(i, 1);
        continue;
      }
      if (e.type === 'seaFish') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        e.life -= dt;
        const tgt = this.other(e.caster);
        if (tgt?.alive) {
          const to = v3(tgt.pos.x - e.pos.x, tgt.pos.y + 1.15 - e.pos.y, tgt.pos.z - e.pos.z);
          if (to.lengthSq() > 1e-5) {
            to.normalize().multiplyScalar(e.spd);
            e.vel.lerp(to, Math.min(1, e.homing * dt));
          }
        }
        e.pos.addScaledVector(e.vel, dt);
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.035; m.fx.seaFishTrail?.(e.pos, e.vel); }
        if (tgt?.alive && (e.sure || e.pos.distanceTo(tgt.pos.clone().add(v3(0, 1.15, 0))) < 0.72 + (tgt.hurtBox?.pad ?? 0))) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const dir = e.vel.clone().setY(0).normalize();
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light',
            dir, sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          m.fx._ring(e.pos.clone(), 0x7fc8d8, { size: 0.22, growRate: 5, life: 0.2, flat: false });
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0) this.entities.splice(i, 1);
        continue;
      }
      // DAGON — the eel-serpent's spit. Spawned by combat/ocean.js rather than
      // by a cast, and reflectable exactly like anything else that travels.
      if (e.type === 'seaSpit') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.seaSpitTrail?.(e.pos, e.dir); }
        const tgt = this.other(e.caster);
        if (tgt?.alive && (e.sure || e.pos.distanceTo(tgt.pos.clone().add(v3(0, 1.15, 0))) < 0.78 + (tgt.hurtBox?.pad ?? 0))) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light',
            dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          m.arena?.splash?.(e.pos.x, e.pos.z, 0.5);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // DAGON — the tidal surge, and the shallow patch it leaves behind.
      if (e.type === 'tidalSurge') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.tidalTick?.(e.pos, e.dir, e.width); }
        m.arena?.splash?.(e.pos.x, e.pos.z, 1.4);
        const tgt = this.other(e.caster);
        if (tgt?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, tgt.pos) < e.width * 0.55 + (tgt.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, { crit, heavy: true });
          m.cam.shake(0.5);
        }
        if (e.travelled >= e.range) {
          // THE PATCH. A lingering ground zone that slows anyone standing in
          // it. It is an entity rather than a terrain edit so it expires
          // cleanly on a round reset with everything else.
          if (e.patch) {
            this.entities.push({
              type: 'waterPatch', caster: e.caster,
              pos: e.pos.clone().setY(m.arena?.bounds?.floorAt(e.pos.x, e.pos.z, e.pos.y + 1) ?? 0),
              t: e.patch.duration, radius: e.patch.radius, slow: e.patch.slow, fxT: 0
            });
            m.fx.waterPatch?.(e.pos.clone(), e.patch.radius);
          }
          this.entities.splice(i, 1);
        }
        continue;
      }
      if (e.type === 'waterPatch') {
        e.t -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.18; m.fx.waterPatchTick?.(e.pos, e.radius); }
        for (const f of m.activeFighters) {
          if (!f.alive) continue;
          // HE IS IMMUNE TO HIS OWN. A slow character who slowed himself would
          // simply never press the button.
          if (f === e.caster) continue;
          if (!f.grounded) continue;
          if (flatDist(f.pos, e.pos) > e.radius) continue;
          // `sleepT`/`sleepMult` is the existing roster-wide slow channel —
          // Cursed Speech's SLEEP already uses it and `speedMult` already
          // reads it, so the patch needed no new movement plumbing at all.
          f.sleepT = Math.max(f.sleepT, 0.15);
          f.sleepMult = Math.min(f.sleepMult ?? 1, e.slow);
        }
        if (e.t <= 0) this.entities.splice(i, 1);
        continue;
      }
      // TODO — RESONANT CLAP: the wall of shock in flight. On arrival it
      // drags the body TOWARD Todo (kb dir points back at him), which is
      // the Vice Grab dinner bell.
      if (e.type === 'clapWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.clapWaveTick(e.pos, e.dir, e.width); }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.width * 0.55 + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const back = v3(e.caster.pos.x - t.pos.x, 0, e.caster.pos.z - t.pos.z).normalize();
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.pull, kbY: 0.4, hitstun: e.hitstun,
            type: 'heavy', dir: back, sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') m.hud.toast(e.caster, '共鳴 — PULLED IN');
          m.cam.shake(0.4);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // YUJI — the whiffed Divergent Fist's ghost: the late cursed energy
      // discharged forward as a fist-shaped projectile. No Black Flash off
      // it — the chain died with the whiff — but the whiff is no longer free.
      if (e.type === 'ghostFist') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.028; m.fx.ghostFistTrail(e.pos, e.dir); }
        const t = this.other(e.caster);
        if (t?.alive && e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 0.8 + (t.hurtBox?.pad ?? 0)) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 3.5, kbY: 2, hitstun: 22, type: 'heavy', dir: e.dir.clone()
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { heavy: true });
          m.fx.ghostFistBurst(e.pos, e.dir);
          m.cam.shake(0.3);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) { m.fx.ghostFistBurst(e.pos, e.dir); this.entities.splice(i, 1); }
        continue;
      }
      // YUJI — the thrown 卍 crescent off the Manji Kick's heel.
      if (e.type === 'crescent') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.crescentTick(e.pos, e.dir, e.color); }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.1, 0))) < 1.0 + (t.hurtBox?.pad ?? 0))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          m.fx._ring(e.pos.clone(), e.color, { size: 0.4, growRate: 9, life: 0.26, flat: false });
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // NAOYA — FRAME 24: the reel of frozen kick-frames popping down the
      // line at 24 fps. The first frame that connects delivers the whole
      // kick and burns the rest of the reel.
      if (e.type === 'frameLine') {
        e.t -= dt;
        if (e.t > 0) continue;
        e.t += e.interval;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        const at = e.origin.clone().addScaledVector(e.dir, e.spacing * (e.i + 1));
        // the frame itself, as geometry, popping into the world and shattering
        m.fx.filmFrameAt(at.clone().setY(1.25), Math.atan2(e.dir.x, e.dir.z), e.i);
        m.sfx.projectionStep?.();
        m.arena?.destruct?.damageAt(at.clone().setY(1.0), 1.3, e.destruct / e.frames);
        const t = this.other(c);
        if (t?.alive && (e.sure || flatDist(at, t.pos) < e.radius + (t.hurtBox?.radius ?? 0.62))) {
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'knockdown', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { crit, heavy: true });
          m.cam.shake(0.7); m.cam.fovKick(8); m.hitstop(8);
          this.entities.splice(i, 1);
          continue;
        }
        if (++e.i >= e.frames) this.entities.splice(i, 1);
        continue;
      }
      // NANAMI — the RATIO WAVE. Inside the 7:3 band of its range the hit
      // is a forced critical: the technique finding the weak point is not a
      // roll of the dice, it is the technique.
      if (e.type === 'ratioWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        const sweet = e.travelled >= e.sweetLo && e.travelled <= e.sweetHi;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.ratioWaveTick(e.pos, e.dir, e.width, sweet); }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.width * 0.55 + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg: base } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const dmg = sweet ? base * 1.5 : base;
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun + (sweet ? 6 : 0),
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit: sweet, heavy: true });
          if (r === 'hit' || r === 'otg') {
            if (sweet) {
              m.fx.ratioStrike(t.pos.clone().add(v3(0, 1.2, 0)), 1);
              m.hud.toast(e.caster, '7:3 — THE WEAK POINT');
            }
            if (e.appliesMark) {
              e.caster.ratioMark = true;
              m.hud.toast(e.caster, '7:3 MARKED');
            }
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // HIGURUMA — the VERDICT falling. The construct hangs, drops with the
      // fuse, stamps the seal. Landing it files evidence.
      if (e.type === 'gavelDrop') {
        e.t += dt;
        const k = Math.min(1, e.t / e.delay);
        if (e.node) {
          e.node.position.set(e.pos.x, 7.5 - (7.5 - e.radius * 0.36) * (k * k), e.pos.z);
          e.node.rotation.y = e.node.userData.spinAxis + k * 1.2;
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.11;
          m.fx._ring(e.pos.clone().setY(0.05), 0xd8c78a,
            { size: e.radius * (0.4 + 0.5 * (1 - k)), growRate: 0.4, life: 0.22 });
        }
        if (e.t < e.delay) continue;
        if (e.node) { m.fx.scene.remove(e.node); }
        m.fx.gavelVerdict(e.pos, e.radius);
        m.sfx.slam();
        m.cam.shake(0.6); m.cam.fovKick(5);
        m.arena?.destruct?.damageAt(e.pos.clone().setY(0.6), e.radius + 0.6, 46);
        m.arena?.splash?.(e.pos.x, e.pos.z, 1.2);
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive) continue;
          if (!e.sure && flatDist(f.pos, e.pos) > e.radius + (f.hurtBox?.radius ?? 0.62)) continue;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'knockdown', sureHit: e.sure,
            dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true, knockdown: true });
          // the blow, entered into the record
          if ((r === 'hit' || r === 'otg') && e.evidence) gainEvidence(e.caster, e.evidence);
        }
        this.entities.splice(i, 1);
        continue;
      }
      // MAHITO — the BODY LANCE extending, holding, reeling back in.
      if (e.type === 'bodyLance') {
        e.t += dt;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        const total = e.extend + e.hold + e.extend;
        const k = e.t < e.extend ? e.t / e.extend
          : e.t < e.extend + e.hold ? 1
            : Math.max(0, 1 - (e.t - e.extend - e.hold) / e.extend);
        const from = c.pos.clone().add(v3(0, 1.35, 0));
        const tip = from.clone().addScaledVector(e.dir, 0.6 + (e.reach - 0.6) * k);
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.025; m.fx.bodyLanceTick(from, tip, e.dir); }
        const t = this.other(c);
        if (t?.alive && !e.dealt) {
          // point-to-segment: is the chest anywhere along the extended arm?
          const chest = t.pos.clone().add(v3(0, 1.2, 0));
          const ab = tip.clone().sub(from);
          const len2 = Math.max(0.001, ab.lengthSq());
          const s = clamp(chest.clone().sub(from).dot(ab) / len2, 0, 1);
          const d = chest.distanceTo(from.clone().addScaledVector(ab, s));
          if (e.sure || d < 0.7 + (t.hurtBox?.pad ?? 0)) {
            e.dealt = true;
            const { dmg, crit } = computeDamage(c, e.dmg);
            const type = e.variant === 1 ? 'knockdown' : 'heavy';
            const r = t.applyHit({
              ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
              type, dir: e.dir.clone(), sureHit: e.sure
            }, m.ctxFor(c));
            hitFeedback(m, c, t, r, { crit, heavy: true, knockdown: type === 'knockdown' });
            if (r === 'hit' || r === 'otg' || r === 'block') {
              m.domains.transfigChunk(c, t, 'bodyWeapon', r === 'block');
            }
          }
        }
        if (e.t >= total) this.entities.splice(i, 1);
        continue;
      }
      // HAKARI — one PACHINKO ball: gravity, floor bounce, loose homing.
      // The gold payout ball knocks down and works on a body already down.
      if (e.type === 'pachinko') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        e.life -= dt;
        const t = this.other(e.caster);
        if (t?.alive) {
          const want = v3(t.pos.x - e.pos.x, 0, t.pos.z - e.pos.z).normalize().multiplyScalar(e.spd);
          e.vel.x += (want.x - e.vel.x) * Math.min(1, e.homing * dt);
          e.vel.z += (want.z - e.vel.z) * Math.min(1, e.homing * dt);
        }
        e.vel.y -= 20 * dt;
        e.pos.addScaledVector(e.vel, dt);
        if (e.pos.y < 0.22) { e.pos.y = 0.22; e.vel.y = Math.abs(e.vel.y) * 0.72; }
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.02; m.fx.pachinkoTrail(e.pos, e.gold); }
        if (t?.alive && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 0.9, 0))) < 0.85 + (t.hurtBox?.pad ?? 0))) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.gold ? 4.5 : 1.0, kbY: e.gold ? 1.4 : 0,
            hitstun: e.gold ? 30 : 12, type: e.gold ? 'knockdown' : 'light',
            otgOk: true, sureHit: e.sure,
            dir: v3(e.vel.x, 0, e.vel.z).normalize()
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, e.gold ? { heavy: true, knockdown: true } : {});
          if (e.gold && (r === 'hit' || r === 'otg')) {
            m.fx._ring(e.pos.clone(), 0xffc93c, { size: 0.5, growRate: 12, life: 0.35, flat: false });
            m.cam.shake(0.45);
            m.hitstop(8);
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0) this.entities.splice(i, 1);
        continue;
      }
      // YUTA — RIKA'S GRASP in flight. What it catches, it brings home.
      if (e.type === 'rikaHand') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.quaternion.setFromUnitVectors(v3(0, 0, 1), e.dir);
          e.node.rotateZ(Math.sin(e.travelled * 2.2) * 0.15);
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.035;
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))), {
            color: Math.random() < 0.3 ? 0x1a3a30 : 0x9ff5c9, size: rand(0.14, 0.3), life: 0.24,
            vel: e.dir.clone().multiplyScalar(-rand(2, 4))
          });
        }
        const c = e.caster;
        const t = this.other(c);
        if (t?.alive && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 1.1 + (t.hurtBox?.pad ?? 0))) {
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 0.5, kbY: 0, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') {
            // handed over: deposited at arm's reach in front of Yuta
            const dest = c.pos.clone().addScaledVector(c.forward(), e.dragGap);
            dest.y = t.pos.y;
            m.fx._spawn(t.pos.clone().add(v3(0, 1.2, 0)), { color: 0x9ff5c9, size: 0.6, life: 0.2, vel: v3() });
            t.pos.copy(dest); t.prevPos.copy(dest);
            t.vel.set(0, 0, 0);
            m.hud.toast(c, 'RIKA — HANDED OVER');
            m.cam.shake(0.4);
          }
          if (e.node) m.fx.release(e.node);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) {
          if (e.node) m.fx.release(e.node);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // PANDA — the QUAKE PALM rupture front running down the lane.
      if (e.type === 'quakeWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.05;
          m.fx.quakeTick(e.pos, e.radius);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(0.5), e.radius, 14);
        }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.radius + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'launcher', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          m.cam.shake(0.4);
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // HAKARI — the BALL DROP: it falls, it lands, it rolls, it keeps going
      // through whoever is in the lane.
      if (e.type === 'ballRoll') {
        if (!e.dropped) {
          e.vy -= 34 * dt;
          e.pos.y += e.vy * dt;
          if (e.pos.y <= e.radius) {
            e.pos.y = e.radius;
            e.dropped = true;
            m.fx._ring(e.pos.clone().setY(0.07), 0x69f0ae, { size: 0.6, growRate: 12, life: 0.35 });
            m.sfx.slam();
            m.cam.shake(0.4);
            m.arena?.destruct?.damageAt(e.pos.clone().setY(0.5), 2.0, 45);
          }
        } else {
          const step = e.spd * dt;
          e.pos.addScaledVector(e.dir, step);
          e.travelled += step;
          e.roll += step / e.radius;
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.05;
            m.fx.pachinkoTrail(e.pos.clone().setY(e.radius * 0.4), false);
            m.arena?.destruct?.damageAt(e.pos.clone().setY(0.6), 1.6, 26);
          }
        }
        if (e.node) {
          e.node.position.copy(e.pos);
          // roll about the axis perpendicular to travel
          e.node.rotation.set(0, 0, 0);
          e.node.rotateOnWorldAxis(v3(e.dir.z, 0, -e.dir.x).normalize(), e.roll);
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          if (!e.sure && flatDist(e.pos, f.pos) > e.radius + 0.4 + (f.hurtBox?.radius ?? 0.62)) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
          m.cam.shake(0.35);
        }
        if (e.travelled >= e.range || Math.hypot(e.pos.x, e.pos.z) > e.caster.arenaRadius - 0.4) {
          m.fx.popProp(e.node, 0x69f0ae);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // TOJI — the FISSURE running out from the staff slam: slabs of deck
      // driven up along the line, one every metre.
      if (e.type === 'fissure') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.travelled >= e.nextAt) {
          e.nextAt += e.step;
          const at = e.pos.clone();
          at.y = e.caster.bounds ? e.caster.bounds.floorAt(at.x, at.z, e.caster.pos.y + 1.2) : 0;
          m.fx.stoneSlabAt(at, { w: rand(0.8, 1.3), h: rand(1.1, 2.0), life: rand(0.6, 0.9) });
          m.arena?.destruct?.damageAt(at.clone().setY(0.6), 1.8, 48);
        }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.radius + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const guarding = t.state === 'block' || t.state === 'blockstun';
          if (guarding && e.guardBreak) {
            t.res.stamina = 0;
            t.setState('guardBreak', { clip: 'guardBreak' });
            t.emit('guardBreak');
            m.hud.toast(e.caster, 'GUARD BROKEN');
          }
          const { dmg, crit } = computeDamage(e.caster, e.dmg * 0.75);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: 2.0, hitstun: e.hitstun,
            type: 'knockdown', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true, knockdown: true });
          m.cam.shake(0.5);
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // YUTA — RIKA'S TEETH: her maw driven out ahead of him and closing.
      if (e.type === 'rikaBite') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.rotation.set(0, Math.atan2(e.dir.x, e.dir.z), Math.sin(e.travelled * 6) * 0.5);
          e.node.scale.setScalar(1 + Math.sin(e.travelled * 5) * 0.16);
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))), {
            color: Math.random() < 0.3 ? 0x1a3a30 : 0x9ff5c9, size: rand(0.12, 0.26), life: 0.2,
            vel: e.dir.clone().multiplyScalar(-rand(2, 5))
          });
        }
        const t = this.other(e.caster);
        if (t?.alive
          && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.1, 0))) < 1.1 + (t.hurtBox?.pad ?? 0))) {
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun,
            type: 'light', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit });
          m.fx._ring(e.pos.clone(), 0x9ff5c9, { size: 0.4, growRate: 9, life: 0.25, flat: false });
          m.fx.popProp(e.node, 0x9ff5c9);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) {
          m.fx.popProp(e.node, 0x9ff5c9);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // YUJI — the DIVERGENT BLOOM: erupts, then diverges. Two detonations
      // out of one crystal, both of them Black-Flash eligible.
      if (e.type === 'ceBloom') {
        e.t += dt;
        if (!e.struck && e.t >= e.hitAt) {
          e.struck = true;
          m.cam.shake(0.4);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(0.8), e.radius, 42);
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            if (!e.sure && flatDist(f.pos, e.pos) > e.radius + (f.hurtBox?.radius ?? 0.62)) continue;
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = f.applyHit({
              ...e.hitOpts, dmg, kb: 2.2, kbY: 1.0, hitstun: 20, type: 'heavy',
              sureHit: e.sure, dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { crit, heavy: true });
            if (r === 'hit' || r === 'otg') openBlackFlash(e.caster, dmg);
          }
        }
        if (e.t >= e.divergeAt) {
          // THE DIVERGENCE. The same energy, arriving again out of the same
          // point, and this one launches.
          m.fx.ceBloomAt(e.pos.clone().add(v3(0, 0.9, 0)), e.radius * 1.15, 0.45);
          m.fx._ring(e.pos.clone().add(v3(0, 0.9, 0)), 0xff3b30, { size: 0.5, growRate: 13, life: 0.35, flat: false });
          m.sfx.hit(true);
          m.cam.shake(0.55); m.cam.fovKick(6);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(1.0), e.radius + 0.5, 60);
          let landed = false;
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            if (!e.sure && flatDist(f.pos, e.pos) > e.radius + 0.5 + (f.hurtBox?.radius ?? 0.62)) continue;
            const { dmg, crit } = computeDamage(e.caster, e.dmg2);
            const r = f.applyHit({
              ...e.hitOpts, dmg, kb: 3, kbY: 8, hitstun: 30, type: 'launcher',
              sureHit: e.sure, otgOk: e.sure,
              dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { crit, heavy: true });
            if (r === 'hit' || r === 'otg') { openBlackFlash(e.caster, dmg); landed = true; }
          }
          // whiffed the whole technique: the Black Flash chain is done
          if (!landed && !e.struck && e.caster.cfg.blackFlash) e.caster.bfChain = 0;
          this.entities.splice(i, 1);
        }
        continue;
      }
      // YUJI — the thrown 卍: out, then back, cutting on both passes.
      if (e.type === 'manji') {
        const step = e.spd * dt;
        e.travelled += e.back ? -step : step;
        e.spin += dt * 22;
        if (e.back) {
          // the return leg tracks him, so it comes home rather than to a spot
          const home = e.caster.pos.clone().add(v3(0, 1.25, 0));
          e.pos.lerp(home, Math.min(1, 3.4 * dt));
          if (e.pos.distanceTo(home) < 1.0 || !e.caster.alive) {
            m.fx.popProp(e.node, 0xffa04a);
            this.entities.splice(i, 1);
            continue;
          }
        } else {
          e.pos.addScaledVector(e.dir, step);
          if (e.travelled >= e.range) { e.back = true; e.hit.clear(); }
        }
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.quaternion.setFromUnitVectors(v3(0, 0, 1), e.dir);
          e.node.rotateZ(e.spin);
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))), {
            color: Math.random() < 0.3 ? 0xffe0c0 : 0xffa04a, size: rand(0.1, 0.22), life: 0.2,
            vel: v3(rand(-1, 1), rand(-0.5, 1.5), rand(-1, 1))
          });
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          if (!e.sure && e.pos.distanceTo(f.pos.clone().add(v3(0, 1.1, 0))) > 1.1 + (f.hurtBox?.pad ?? 0)) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, e.dmg * (e.back ? 0.6 : 1));
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') openBlackFlash(e.caster, dmg);
          m.fx._ring(e.pos.clone(), 0xffa04a, { size: 0.4, growRate: 10, life: 0.26, flat: false });
        }
        continue;
      }
      // HANAMI — the ROOT SWARM running under the deck. Roots surface at the
      // wavefront as it goes; whatever the line reaches is thrown up, and the
      // bud is planted on the body the roots got hold of.
      if (e.type === 'rootRun') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        // the swarm stops at the arena wall rather than running off the edge
        if (Math.hypot(e.pos.x, e.pos.z) > e.caster.arenaRadius - 0.3) {
          this.entities.splice(i, 1);
          continue;
        }
        // surface a clump every `step` metres of travel
        if (e.travelled >= e.nextAt) {
          e.nextAt += e.step;
          const at = e.pos.clone();
          at.y = e.caster.bounds ? e.caster.bounds.floorAt(at.x, at.z, e.caster.pos.y + 1.2) : 0;
          const kind = m.flora ? m.flora.terrainForPos(at) : ARTIFICIAL;
          m.fx.rootSurge(at, {
            len: rand(1.7, 2.6), natural: kind !== ARTIFICIAL, lean: e.dir, life: rand(0.9, 1.3)
          });
          m.sfx.rootErupt?.();
          m.arena?.destruct?.damageAt(at.clone().setY(0.6), 1.4, 26);
        }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.radius + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 2.0, kbY: e.kbY, hitstun: e.hitstun,
            type: 'launcher', dir: e.dir.clone(), sureHit: e.sure,
            // JJS-CORRECT AND DELIBERATE: you do not block a floor that has
            // stopped being a floor. The counterplay is not to be standing
            // on the line — the roots are slow enough to walk out of.
            unblockable: true
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          // a big cage of roots closing around whoever it caught
          for (let k = 0; k < 5; k++) {
            const a = (k / 5) * Math.PI * 2;
            const at = t.pos.clone().add(v3(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8));
            at.y = t.pos.y;
            m.fx.rootSurge(at, { len: rand(2.2, 3.1), natural: true, life: rand(0.8, 1.2) });
          }
          m.cam.shake(0.6); m.cam.fovKick(6); m.hitstop(8);
          if ((r === 'hit' || r === 'otg') && e.bud && m.flora) {
            // the parasite, planted by the roots that have hold of them
            m.flora.plantBud(e.caster, t, e.bud);
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // =====================================================================
      // MAKI — the delayed hits of her two strings, and the ultimate assault
      // =====================================================================
      // Both strings are authored as a run of scheduled ticks rather than as
      // one multi-hit window, because her whole animation identity is that she
      // RESETS between swings: a single window with `hits` would land them all
      // on one pose. One entity per hit, each with its own delay, is what lets
      // the third cut of the Slashing String land on the third cut of the clip.
      if (e.type === 'makiSweep' || e.type === 'makiCut') {
        e.t -= dt;
        if (e.t > 0) continue;
        const c = e.caster;
        const t = this.other(c);
        if (c.alive && t?.alive && (e.sure || inArc(c, t, e.reach, e.arc))) {
          // `staffSpinTick(caster, radius, ang)` — the bar is drawn at an
          // ANGLE around the caster, and the two sweeps of hers go opposite
          // ways, so the side flips the angle rather than being passed as one
          // THE SWEPT ARC, in the plane she actually swung in — see
          // fx/newfx.js. The old `staffSpinTick` billboard stays underneath it
          // for the bright core, because the two read as one object and the
          // spark is doing work the geometry is deliberately not.
          if (e.type === 'makiSweep') {
            cloudArc(m.fx, c, { reach: e.reach, side: e.side, color: 0x5fae7a });
            m.fx.staffSpinTick?.(c, e.reach, c.facing + e.side * 0.7);
          } else {
            soulCleave(m.fx, c, { reach: e.reach, color: 0x5fae7a });
          }
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY ?? 0, hitstun: e.hitstun,
            type: e.type === 'makiSweep' ? 'heavy' : 'light',
            guardDamage: e.guardDamage, sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { crit, heavy: e.type === 'makiSweep' });
        }
        this.entities.splice(i, 1);
        continue;
      }
      // BEYOND THE ZENIN — the ultimate assault. A scheduled sequence of
      // strikes alternating between the two weapons, each firing once at its
      // own point through the window. `at` is a FRACTION of the window rather
      // than a frame count, so retuning the ultimate's length does not
      // re-time the sequence.
      if (e.type === 'makiAssault') {
        e.t += dt * 60;
        const k = Math.min(1, e.t / Math.max(1, e.frames));
        const c = e.caster;
        const t = this.other(c);
        for (const st of e.seq) {
          if (st.done || k < st.at) continue;
          st.done = true;
          const both = st.weapon === 'both';
          if (both) {
            m.fx.soulSlashArc(c, true);
            m.fx.staffSlamCrack?.(c, c.forward(), e.reach);
            m.cam.shake(0.8);
            m.hitstop(16);
            m.stage.flash(0.24);
            m.arena?.destruct?.damageAt(
              c.pos.clone().addScaledVector(c.forward(), 1.6).setY(0.4), 3.0, e.destruct);
          } else if (st.weapon === 'split_soul') {
            m.fx.soulSlashArc(c);
            m.sfx.cleave();
            m.cam.shake(0.22);
          } else {
            m.fx.staffSpinTick?.(c, e.reach, c.facing);
            m.sfx.swordSwing();
            m.cam.shake(0.22);
          }
          if (t?.alive && inArc(c, t, e.reach, e.arc)) {
            const { dmg, crit } = computeDamage(c, st.dmg * e.mult);
            const r = t.applyHit({
              attacker: c, isCT: true, src: 'ult', dir: c.forward(),
              dmg, kb: both ? 8.5 : 1.6, kbY: 0,
              hitstun: both ? 44 : 20, type: both ? 'knockdown' : 'heavy',
              unblockable: st.unblockable || undefined
            }, m.ctxFor(c));
            hitFeedback(m, c, t, r, { crit, heavy: true, knockdown: both });
          }
        }
        if (k >= 1) this.entities.splice(i, 1);
        continue;
      }
      // =====================================================================
      // YUKI — the command grab's slam, and the black hole
      // =====================================================================
      // THE SLAM. The second half of the grab, delayed so the cinematic has a
      // shape. The victim is HELD in place across the window — position is
      // written every frame — which is what makes it a grab rather than a
      // two-hit string they could fall out of.
      if (e.type === 'yukiSlam') {
        e.t -= dt;
        const c = e.caster;
        const t = e.target;
        if (!c.alive || !t?.alive) { this.entities.splice(i, 1); continue; }
        // held, and dragged around in front of her
        const hold = c.pos.clone().addScaledVector(c.forward(), 1.3);
        t.pos.lerp(hold, Math.min(1, dt * 14));
        t.vel.set(0, 0, 0);
        if (e.t > 0) continue;
        const at = t.pos.clone().setY(t.pos.y);
        massSlamCone(m.fx, at, e.ms.k * 1.2, 0x6f7fd0);
        m.fx.staffSlamCrack?.(c, e.dir, 1.4);
        m.fx.quakeTick?.(at, 1 + e.ms.k);
        m.sfx.impact?.();
        m.cam.shake(0.9 * e.ms.shake);
        m.cam.fovKick(10);
        m.hitstop(Math.round(10 + 12 * e.ms.k));
        m.arena?.destruct?.damageAt(at, 3.0, e.destruct);
        const { dmg, crit } = computeDamage(c, e.dmg);
        const r = t.applyHit({
          ...e.hitOpts, dmg, kb: 3.0, kbY: 0, hitstun: 48,
          type: 'knockdown', unblockable: true, sureHit: true
        }, m.ctxFor(c));
        hitFeedback(m, c, t, r, { crit, heavy: true, knockdown: true });
        this.entities.splice(i, 1);
        continue;
      }
      // ---- BLACK HOLE ------------------------------------------------------
      // The pull, and then the detonation. Two things make this look unlike
      // anything else in the game:
      //
      //   1. EVERYTHING IS DRAGGED TOWARD ONE POINT, including the caster's
      //      opponent mid-air, and the force is stronger the closer you are —
      //      inside `innerRadius` it is inescapable.
      //   2. THE LEVEL IS TORN OFF AND PULLED IN. Destructible geometry inside
      //      `debrisRadius` is damaged and a run of debris motes is spawned
      //      travelling INWARD. Nothing else in this project moves level
      //      geometry, and it is the whole visual signature.
      if (e.type === 'blackHole') {
        const u = e.def;
        e.t += dt;
        const k = Math.min(1, e.t / e.dur);
        const c = e.caster;
        const t = this.other(c);
        // the singularity itself: a dark core with a bright accretion ring
        // The singularity's own geometry (fx/newfx.js) is doing the core, the
        // disc and the lensing ring, so this tick is only the infalling
        // streaks — the thin bright lines being drawn in from the edge, which
        // are cheap and read as matter falling rather than as an aura.
        if ((e.fxT = (e.fxT ?? 0) - dt) <= 0) {
          e.fxT = 1 / 45;
          const a = rand(0, Math.PI * 2);
          const rr = (u.pullRadius ?? 14) * rand(0.25, 0.7);
          m.fx._spawn(
            e.pos.clone().add(v3(Math.cos(a) * rr, rand(-1.5, 2.5), Math.sin(a) * rr)),
            { color: 0xb8c4f0, size: rand(0.5, 1.3), aspect: 0.06,
              life: 0.28, vel: v3(-Math.cos(a) * rr * 2.2, 0, -Math.sin(a) * rr * 2.2) });
        }
        // 1 — THE PULL
        if (t?.alive) {
          const to = e.pos.clone().sub(t.pos).setY(0);
          const d = Math.max(0.4, to.length());
          if (d < u.pullRadius) {
            to.normalize();
            // inverse-ish falloff, and irresistible inside innerRadius
            const near = d < (u.innerRadius ?? 3.0);
            const force = u.pullForce * (near ? 1.6 : Math.max(0.15, 1 - d / u.pullRadius));
            t.vel.x += to.x * force * dt;
            t.vel.z += to.z * force * dt;
            if (near) t.vel.y += 6 * dt;      // lifted off their feet at the core
          }
        }
        // 2 — THE LEVEL, TORN OFF AND PULLED IN
        if (!e.debrisDone && k > 0.12) {
          e.debrisDone = true;
          m.arena?.destruct?.damageAt(e.pos.clone().setY(0.5), u.debrisRadius, 90);
          for (let n = 0; n < (u.debrisCount ?? 26); n++) {
            const a = (n / (u.debrisCount ?? 26)) * Math.PI * 2 + rand(-0.2, 0.2);
            const rr = rand(u.debrisRadius * 0.35, u.debrisRadius);
            e.debris.push({
              pos: e.pos.clone().add(v3(Math.cos(a) * rr, rand(-1.2, 1.4), Math.sin(a) * rr)),
              // `_spawn` returns a handle whose mesh this can move every frame.
              // `fx.debris` spawns a burst and returns nothing, so it is the
              // wrong tool for geometry that has to travel to a destination.
              node: m.fx._spawn(
                e.pos.clone().add(v3(Math.cos(a) * rr, rand(0.2, 1.6), Math.sin(a) * rr)),
                { color: n % 3 ? 0x8a8fa0 : 0xd8d2c4, size: rand(0.22, 0.62), aspect: 0.7,
                  life: (u.pullDuration ?? 1.35) + 0.3, vel: v3(), spin: rand(-5, 5) }
              )?.mesh ?? null,
              spd: rand(5, 13)
            });
          }
        }
        for (const d of e.debris) {
          const to = e.pos.clone().sub(d.pos);
          const dist = to.length();
          if (dist > 0.25) d.pos.addScaledVector(to.normalize(), Math.min(dist, d.spd * dt * (1 + k * 2)));
          if (d.node) d.node.position.copy(d.pos);
          // a chunk arriving with somebody in it hurts
          if (t?.alive && dist < 0.6 && !d.spent && flatDist(t.pos, e.pos) < 2.0) {
            d.spent = true;
            t.res.hp -= (u.debrisDmg ?? 3);
          }
        }
        // 3 — THE DETONATION
        if (k >= 1 && !e.fired) {
          e.fired = true;
          m.fx.supernovaBurst?.(e.pos.clone(), u.radius ?? 6.4);
          m.fx._ring(e.pos.clone(), 0xb8c4f0, { size: 0.5, growRate: 34, life: 0.5, flat: false });
          m.sfx.explode?.();
          m.cam.shake(2.0);
          m.cam.fovKick(24);
          m.stage.flash(0.55);
          m.hitstop(20);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(0.5), u.radius ?? 6.4, u.destruct ?? 100);
          for (const d of e.debris) if (d.node) m.fx.dropProp?.(d.node);
          if (t?.alive && flatDist(t.pos, e.pos) < (u.radius ?? 6.4)) {
            const dir = v3(t.pos.x - e.pos.x, 0, t.pos.z - e.pos.z);
            if (dir.lengthSq() < 1e-4) dir.copy(c.forward());
            const { dmg, crit } = computeDamage(c, (u.dmg ?? 52) * e.mult);
            const r = t.applyHit({
              attacker: c, isCT: true, src: 'ult', dir: dir.normalize(),
              dmg, kb: u.kb ?? 11, kbY: u.kbY ?? 6.5, hitstun: u.hitstun ?? 46,
              type: 'knockdown', unblockable: true
            }, m.ctxFor(c));
            hitFeedback(m, c, t, r, { crit, heavy: true, knockdown: true });
          }
          this.entities.splice(i, 1);
        }
        continue;
      }
      // TOJI — the Split Soul Katana's phantom echo: the same cut arriving
      // on the soul a beat behind the blade.
      if (e.type === 'soulEcho') {
        e.t -= dt;
        if (e.t > 0) continue;
        const c = e.caster;
        const t = this.other(c);
        if (c.alive && t?.alive && (e.sure || inArc(c, t, e.reach, e.arc))) {
          const p = t.pos.clone().add(v3(0, 1.2, 0));
          const bar = m.fx._spawn(p, { color: 0x8b9bab, size: 1.7, aspect: 0.08, life: 0.22, vel: v3() });
          m.fx._bb(bar.mesh, rand(-0.8, 0.8));
          const { dmg } = computeDamage(c, e.dmg, { canCrit: false });
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 1.2, kbY: 0, hitstun: e.hitstun,
            type: 'light', sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, {});
        }
        this.entities.splice(i, 1);
        continue;
      }
      // GOJO — RED in flight: detonates on the first body it reaches, or at
      // the end of its range, shoving the level apart as it goes.
      if (e.type === 'redOrb') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.025;
          m.fx.redOrbTick(e.pos, e.dir);
          m.arena?.destruct?.damageAt(e.pos, 2.2, 40);
        }
        const t = this.other(e.caster);
        const hit = t?.alive
          && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 1.0 + (t.hurtBox?.pad ?? 0));
        if (hit || e.travelled >= e.range) {
          m.fx.redOrbBurst(e.pos);
          m.arena?.destruct?.damageAt(e.pos, 2.6, 60);
          if (hit) {
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = t.applyHit({
              ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: 26,
              type: 'knockdown', dir: e.dir.clone(), sureHit: e.sure
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { crit, heavy: true });
            m.cam.shake(0.4); m.cam.fovKick(6);
          }
          this.entities.splice(i, 1);
        }
        continue;
      }
      // SUKUNA — the DISMANTLE wavefront racing down the line, cutting the
      // level as it reaches it. Everyone on the line is cut once, when the
      // front arrives at them — not before.
      if (e.type === 'dismantleWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.022;
          m.fx.dismantleTick(e.pos, e.dir, e.width);
          m.arena?.destruct?.damageAt(e.pos, e.destroyRadius, e.destroyPower);
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          const rel = f.pos.clone().sub(e.caster.pos);
          const along = rel.x * e.dir.x + rel.z * e.dir.z;
          const perp = Math.abs(rel.x * e.dir.z - rel.z * e.dir.x);
          const pad = f.hurtBox.pad;
          const reached = e.sure || (along > -0.6 && along <= e.travelled + 0.6 && perp < e.width + pad);
          if (!reached) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // TOJI — CLOUD CYCLONE: the opened staff whirling around him, ticking
      // on everything inside the circle.
      if (e.type === 'staffSpin') {
        e.t += dt;
        e.tick -= dt;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        e.ang += dt * (Math.PI * 2 * 3) / e.dur;
        if (e.node) {
          e.node.position.copy(c.pos).add(v3(0, 1.2, 0));
          e.node.rotation.set(0, e.ang, 0.35);
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx.staffSpinTick(c, e.radius, e.ang);
          m.fx.staffSpinTick(c, e.radius, e.ang + Math.PI);
        }
        if (e.tick <= 0) {
          e.tick += e.interval;
          const t = this.other(c);
          if (t?.alive && (e.sure || flatDist(c.pos, t.pos) <= e.radius)) {
            const { dmg, crit } = computeDamage(c, e.dmg);
            const away = t.pos.clone().sub(c.pos).setY(0).normalize();
            const r = t.applyHit({
              ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
              type: 'light', sureHit: e.sure,
              dir: away.lengthSq() > 0.01 ? away : c.forward()
            }, m.ctxFor(c));
            hitFeedback(m, c, t, r, { crit });
          }
        }
        if (e.t >= e.dur) {
          if (e.node) m.fx.popProp(e.node, 0xd8d2c4);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // ---- NAOYA: PROJECTION RUSH -------------------------------------
      // One position per 1/24 s, and NOTHING between them. He is teleported
      // (`pos.copy`, never a lerp), an afterimage is left standing where he
      // was, and one strike resolves — then the clock runs down another
      // twenty-fourth of a second and it happens again five more times.
      //
      // Being an entity rather than a multi-hit active window is what buys
      // that: an active window would spread its hits across whatever frames
      // the state machine happened to give it, and the whole point of this
      // character is that his timings are on a grid rather than approximate.
      if (e.type === 'projRush') {
        e.t -= dt;
        if (e.t > 0) continue;
        e.t += e.interval;
        const c = e.caster;
        // the rush is abandoned if he is taken out of it — frozen himself,
        // KO'd, or seized by a domain cinematic
        if (!c.alive || c.frozenT > 0 || !e.target?.alive) { this.entities.splice(i, 1); continue; }
        const p = e.path[e.i];
        c.model.projectionStep?.(c.pos, c.facing);   // leave the previous one behind
        // the afterimage he leaves standing: real gold plate geometry in the
        // position he has already left
        m.fx.projectionPlateAt(c.pos.clone(), c.facing);
        c.pos.copy(p);
        c.prevPos.copy(c.pos);                       // no render-side interpolation either
        c.vel.set(0, 0, 0);
        c.facing = yawBetween(c.pos, e.target.pos);
        m.sfx.projectionStep?.();
        const { dmg } = computeDamage(c, e.dmg, { canCrit: false });
        const r = e.target.applyHit({
          ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light', dir: c.forward()
        }, m.ctxFor(c));
        hitFeedback(m, c, e.target, r, {});
        // the frame of him passing through the space they are standing in —
        // this, not a fist, is what is doing the damage
        if (r === 'hit' || r === 'otg' || r === 'block') {
          m.fx.filmFrameAt(e.target.pos.clone().add(v3(0, 1.15, 0)), c.facing, e.i);
        }
        e.i++;
        if (e.i >= e.path.length) {
          c.model.projectionStep?.(c.pos, c.facing);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // ---- PANDA: THE TWO TRAVELLING MOVES ------------------------------
      // Both are entities rather than one-frame reach tests, for the same
      // reason Naoya's rush is: they genuinely cross ground, so they have to be
      // genuinely sidesteppable. The two share this shape and differ only in
      // what they do at the end.
      if (e.type === 'pandaRoll' || e.type === 'pandaGore') {
        e.t += dt;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        const gore = e.type === 'pandaGore';
        const spd = gore ? e.speed : (e.travel / e.dur);
        c.vel.x = e.dir.x * spd;
        c.vel.z = e.dir.z * spd;
        if (gore) {
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.04;
            m.fx._spawn(c.pos.clone().setY(0.35), {
              color: Math.random() < 0.4 ? 0xffffff : 0xe08aa8, size: rand(0.14, 0.30),
              aspect: 0.5, life: 0.22, vel: v3(rand(-1.4, 1.4), rand(0.3, 1.6), rand(-1.4, 1.4))
            });
          }
          m.arena?.destruct?.damageAt(c.pos.clone().setY(1.0), 1.2, e.destruct * dt * 3);
        }
        if (!e.dealt && e.target?.alive
          && flatDist(c.pos, e.target.pos) < e.reach + (e.target.hurtBox?.radius ?? 0.62)) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = e.target.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, e.target, r, { crit, heavy: true });
          // A GORE THAT CONNECTS STOPS. It is a charge into a body, not through
          // one — and letting it continue would carry him past the opponent and
          // hand them his back for free, which is the opposite of what the move
          // is for. The roll, being a body press, ends on contact as well.
          this.entities.splice(i, 1);
          continue;
        }
        if (e.t >= e.dur) { this.entities.splice(i, 1); }
        continue;
      }
      // ---- KASHIMO: LIGHTNING BOLT --------------------------------------
      // FLAT AND FAST, WITH NO HOMING AT ALL — the deliberate opposite of
      // Jogo's embers, which track. A bolt goes exactly where he pointed it,
      // which is what makes the move a spacing tool rather than a fire-and-
      // forget one, and it is why the range scaling is allowed to be as
      // dramatic as it is: a screen-crossing projectile that also homed would
      // be unanswerable.
      if (e.type === 'bolt') {
        e.life -= dt;
        e.pos.addScaledVector(e.vel, dt);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.022;
          // the bolt draws itself as a short jittered chain of sparks rather
          // than a single sprite — it has to read as a discharge in flight
          for (let k = 0; k < 2; k++) {
            m.fx._spawn(e.pos.clone().add(v3(rand(-0.14, 0.14), rand(-0.14, 0.14), rand(-0.14, 0.14))), {
              color: k === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.10, 0.22), aspect: 0.26,
              life: 0.14, vel: v3(rand(-0.8, 0.8), rand(-0.4, 0.8), rand(-0.8, 0.8))
            });
          }
        }
        const tgt = this.other(e.caster);
        if (tgt?.alive && !e.dealt
          && e.pos.distanceTo(tgt.pos.clone().add(v3(0, 1.2, 0))) < 0.85) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light',
            dir: v3(e.vel.x, 0, e.vel.z).normalize(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          if (r === 'hit' || r === 'otg') {
            gainCharge(e.caster, 'tech');
            // TIER 3 ONLY: the bolt forks on contact into two short arcs that
            // spit off the body. Cosmetically it is the tell that he is at the
            // top tier; mechanically it is a small second tick.
            if (e.fork) {
              const { dmg: fd } = computeDamage(e.caster, e.forkDmg, { canCrit: false });
              tgt.takeChip(fd, 'electric');
              for (let k = 0; k < 10; k++) {
                m.fx._spawn(tgt.pos.clone().add(v3(rand(-0.6, 0.6), rand(0.6, 1.9), rand(-0.6, 0.6))), {
                  color: 0xf4ecff, size: rand(0.08, 0.18), aspect: 0.25, life: rand(0.12, 0.26),
                  vel: v3(rand(-3, 3), rand(0, 3), rand(-3, 3))
                });
              }
            }
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0 || e.pos.y < 0.1) {
          m.fx._ring(e.pos.clone(), 0xa46bff, { size: 0.2, growRate: 5, life: 0.16, flat: false });
          this.entities.splice(i, 1);
        }
        continue;
      }
      if (e.type === 'ember') {
        // homing flame projectile: loose tracking toward the chest
        if (e.delay > 0) { e.delay -= dt; continue; }
        e.life -= dt;
        const t = this.other(e.caster);
        if (t?.alive) {
          const want = t.pos.clone().add(v3(0, 1.2, 0)).sub(e.pos).normalize().multiplyScalar(e.spd);
          e.vel.lerp(want, Math.min(1, e.homing * dt));
        }
        e.pos.addScaledVector(e.vel, dt);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.035;
          m.fx._spawn(e.pos.clone(), {
            color: Math.random() < 0.3 ? 0xffb03a : 0xff5a1f, size: rand(0.09, 0.2),
            life: 0.22, vel: v3(rand(-0.6, 0.6), rand(0.2, 1.2), rand(-0.6, 0.6))
          });
        }
        if (t?.alive && !e.dealt && e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 0.75) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = t.applyHit({
            dmg, kb: 0.6, kbY: 0, hitstun: 10, type: 'light', attacker: e.caster,
            isCT: true, sureHit: e.sure, dir: e.caster.forward(), src: 'projectile',
            elem: 'fire'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, {});
          if (r === 'hit' || r === 'otg') applyBurn(t, e.burn);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0 || e.pos.y < 0) this.entities.splice(i, 1);
      } else if (e.type === 'bloodEdge') {
        // ---- CHOSO: BLOOD EDGE ------------------------------------------
        // Flat, fast, NO homing — it goes where he threw it, which is what
        // makes holding an angle a skill. Damage falls off with distance
        // travelled rather than the blade simply vanishing, so the edge of his
        // range is a soft boundary he can still poke past for scraps.
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.bloodEdgeTrail(e.pos, e.dir); }
        const tt = this.other(e.caster);
        if (tt?.alive && !e.dealt) {
          const hb = tt.hurtBox;
          const d = e.pos.distanceTo(tt.pos.clone().add(v3(0, hb.center, 0)));
          if (d < hb.radius + 0.55) {
            e.dealt = true;
            const k = e.travelled <= e.falloffAt ? 1
              : Math.max(e.falloffMin, 1 - (e.travelled - e.falloffAt) / Math.max(0.01, e.range - e.falloffAt) * (1 - e.falloffMin));
            const { dmg, crit } = computeDamage(e.caster, e.dmg * k);
            const r = tt.applyHit({
              dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun, type: 'light',
              attacker: e.caster, isCT: true, sureHit: e.sure,
              dir: e.dir.clone(), src: 'projectile'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, tt, r, { crit });
            m.fx.bloodEdgeTrail(e.pos, e.dir);
            if (k < 0.99 && (r === 'hit' || r === 'otg')) m.hud.toast(e.caster, 'FALLOFF');
            this.entities.splice(i, 1);
            continue;
          }
        }
        if (e.travelled >= e.range || e.pos.y < 0.05) {
          m.arena?.destruct?.damageAt(e.pos, 1.2, 16, { kind: 'body' });
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'supernova') {
        // ---- CHOSO: SUPERNOVA -------------------------------------------
        // Convergence in transit, then the fuse, then the burst. The mass is
        // VISIBLE the whole way and it sits at the detonation point for the
        // fuse doing nothing at all — that stationary beat is the counterplay
        // and it is deliberately generous for an ultimate.
        e.t += dt;
        if (!e.armed) {
          const k = Math.min(1, e.t / e.travel);
          e.cur = e.from.clone().lerp(e.to, k * k * (3 - 2 * k));
          e.cur.y += Math.sin(k * Math.PI) * 0.9;      // a lob, not a laser
          m.fx.supernovaCore(e.cur, k);
          if (k >= 1) { e.armed = true; e.t = 0; m.sfx.eruptPrime(); }
        } else {
          e.cur = e.to.clone();
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.05;
            m.fx.supernovaCore(e.to, 1 + Math.sin(e.t * 26) * 0.25);
            m.fx._ring(e.to, 0x8e1020, { size: e.radius * 0.2, growRate: -0.6, life: 0.22, flat: false });
          }
          if (e.t >= e.fuse) {
            m.fx.supernovaBurst(e.to, e.radius, e.pellets);
            m.sfx.supernova();
            m.cam.shake(1.2); m.cam.fovKick(12);
            m.stage.flash(0.6);
            m.hitstop(16);
            m.arena?.destruct?.damageAt(e.to, e.radius + 1.5, 150, { kind: 'body' });
            m.arena?.splash?.(e.to.x, e.to.z, 1.6);
            for (const f of m.activeFighters) {
              if (f === e.caster || !f.alive) continue;
              const d = Math.hypot(f.pos.x - e.to.x, f.pos.z - e.to.z);
              if (d > e.radius) continue;
              // pellets thin out toward the rim — standing at the edge is
              // meaningfully better than standing in it
              const k = 1 - 0.45 * (d / e.radius);
              const { dmg } = computeDamage(e.caster, e.dmg * k, { canCrit: false });
              const r = f.applyHit({
                dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun, type: 'knockdown',
                attacker: e.caster, isCT: true, otgOk: true, src: 'ultimate',
                dir: v3(f.pos.x - e.to.x, 0, f.pos.z - e.to.z).normalize()
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, f, r, { heavy: true, knockdown: true });
            }
            m.minions?.hurtAt(e.to, e.radius, e.dmg * 0.6, e.caster);
            // ...and Geto's curses, which stand in the same field as the transfigured
            // human and take area damage from exactly the same sources.
            m.curses?.hurtAt(e.to, e.radius, e.dmg * 0.6, e.caster);
            this.entities.splice(i, 1);
          }
        }
      } else if (e.type === 'nail') {
        // ---- NOBARA: HAIRPIN --------------------------------------------
        // Three phases on one entity: flying, stuck in a BODY, stuck in the
        // FLOOR. A body nail rides its victim, so running does not shake it;
        // a floor nail is a trap that stays where it landed. Either way the
        // fuse ticks, and either way she can bring it forward.
        if (e.phase === 'fly') {
          const step = e.spd * dt;
          e.pos.addScaledVector(e.dir, step);
          e.travelled += step;
          m.fx.nailTrail(e.pos);
          const tt = this.other(e.caster);
          let hit = false;
          if (tt?.alive) {
            const hb = tt.hurtBox;
            const d = e.pos.distanceTo(tt.pos.clone().add(v3(0, hb.center, 0)));
            if (d < hb.radius + 0.5) {
              const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
              const r = tt.applyHit({
                dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light',
                attacker: e.caster, isCT: true, sureHit: e.sure,
                dir: e.dir.clone(), src: 'projectile'
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, tt, r, {});
              // it only EMBEDS on a clean connect — a blocked or i-framed nail
              // clatters to the floor and becomes a trap there instead, which
              // is a worse outcome for her and a fair one
              if (r === 'hit' || r === 'otg') {
                e.phase = 'body'; e.stuckTo = tt;
                m.fx.nailStick(e.pos.clone(), true);
                m.sfx.nailStick();
                m.hud.toast(tt, '簪 NAILED');
              } else {
                e.phase = 'floor';
                e.pos.y = tt.pos.y + 0.02;
                m.fx.nailStick(e.pos.clone(), false);
              }
              hit = true;
            }
          }
          if (!hit && (e.travelled >= e.range || e.pos.y <= 0.06)) {
            e.phase = 'floor';
            e.pos.y = Math.max(0, e.caster.groundY ?? 0) + 0.02;
            m.fx.nailStick(e.pos.clone(), false);
            m.sfx.nailStick();
          }
        } else {
          e.fuse -= dt;
          if (e.phase === 'body') {
            if (!e.stuckTo?.alive) { e.phase = 'floor'; e.stuckTo = null; }
            else {
              e.pos.copy(e.stuckTo.pos).add(v3(0, 1.15, 0));
            }
          }
          e.fxT -= dt;
          if (e.fxT <= 0) { e.fxT = 0.16; m.fx.nailIdle(e.pos); }
          if (e.fuse <= 0 && !e.spent) {
            e.spent = true;
            m.fx.nailBlast(e.pos.clone(), e.radius);
            m.sfx.nailBlast();
            m.cam.shake(0.28);
            m.arena?.destruct?.damageAt(e.pos, e.radius, 34, { kind: 'body' });
            const inBody = e.phase === 'body' ? e.stuckTo : null;
            for (const f of m.activeFighters) {
              if (f === e.caster || !f.alive) continue;
              if (f !== inBody && Math.hypot(f.pos.x - e.pos.x, f.pos.z - e.pos.z) > e.radius) continue;
              const { dmg, crit } = computeDamage(e.caster, e.blastDmg);
              const r = f.applyHit({
                dmg, kb: e.blastKb, kbY: e.blastKbY, hitstun: e.blastHitstun,
                type: 'heavy', attacker: e.caster, isCT: true, otgOk: true, src: 'ct1',
                dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize(),
                // A nail going off INSIDE them is the big Essence payout — the
                // whole reason to aim rather than to carpet the floor. One in
                // the ground takes nothing extra beyond the ordinary connect.
                essence: f === inBody ? (e.caster.cfg.essence?.perNail ?? 6.5) : undefined
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, f, r, { crit, heavy: true });
            }
            e.caster.nailCount = Math.max(0, e.caster.nailCount - 1);
            this.entities.splice(i, 1);
          }
        }
      } else if (e.type === 'eruption') {
        // telegraphed delayed ground blast; MAXIMUM re-erupts in stages
        e.t -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          // the glowing marker: pulsing ring + rising sparks over the spot
          e.fxT = 0.12;
          m.fx._ring(e.pos.clone().setY(0.06), 0xff5a1f, { size: e.radius * 0.5, growRate: 2.2, life: 0.3 });
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.5, 0.5), 0.1, rand(-0.5, 0.5))), {
            color: 0xffb03a, size: rand(0.08, 0.16), life: 0.4, vel: v3(0, rand(1.5, 3), 0)
          });
        }
        if (e.t <= 0) {
          m.fx.eruptionBlast(e.pos, e.radius);
          m.sfx.erupt();
          m.cam.shake(0.55);
          // magma scorches and ignites whatever it comes up under
          m.arena?.destruct?.damageAt(e.pos, e.radius + 1.2, 60, { kind: 'heat' });
          m.arena?.splash?.(e.pos.x, e.pos.z, 1.4);
          // FIRE BURNS ROOT FIELDS OUT. Jogo answers Hanami's terrain with
          // the same tool he answers everything else with.
          m.flora?.damageFieldsAt(e.pos, e.radius + 1.0, 'fire');
          m.ice?.meltAt(e.pos, e.radius + 1.0, 1.0);
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            const d = Math.hypot(f.pos.x - e.pos.x, f.pos.z - e.pos.z);
            if (e.sure || d < e.radius + 0.4) {
              const { dmg, crit } = computeDamage(e.caster, e.dmg);
              const r = f.applyHit({
                dmg, kb: e.kb, kbY: e.kbY, hitstun: 30, type: 'launcher', attacker: e.caster,
                isCT: true, sureHit: e.sure, otgOk: true, src: 'ct2', elem: 'fire',
                dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, f, r, { crit, heavy: true });
              if (r === 'hit' || r === 'otg') applyBurn(f, e.burn);
            }
          }
          m.minions?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          // ...and Geto's curses, which stand in the same field as the transfigured
          // human and take area damage from exactly the same sources.
          m.curses?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          if (--e.stages > 0) { e.t = e.stageGap; e.radius += 0.5; e.sure = false; }
          else this.entities.splice(i, 1);
        }
      } else if (e.type === 'burnTrail') {
        // dropping patches of burning ground while the dash lasts
        if (e.owner.state !== 'dash' || !e.owner.alive) { this.entities.splice(i, 1); continue; }
        e.dropT -= dt;
        if (e.dropT <= 0) {
          e.dropT = e.df.dropEvery;
          this.entities.push({
            type: 'burnGround', caster: e.owner, pos: e.owner.pos.clone().setY(0),
            life: e.df.life, radius: e.df.radius, stackEvery: e.df.stackEvery, tickT: 0, fxT: 0
          });
        }
      } else if (e.type === 'burnGround') {
        e.life -= dt;
        e.tickT -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.09;
          m.fx._spawn(e.pos.clone().add(v3(rand(-e.radius, e.radius) * 0.7, 0.05, rand(-e.radius, e.radius) * 0.7)), {
            color: Math.random() < 0.4 ? 0xffb03a : 0xff5a1f, size: rand(0.08, 0.18),
            life: rand(0.25, 0.5), vel: v3(rand(-0.3, 0.3), rand(0.8, 2.0), rand(-0.3, 0.3))
          });
        }
        if (e.tickT <= 0) {
          e.tickT = e.stackEvery;
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive || f.airborne) continue;
            if (Math.hypot(f.pos.x - e.pos.x, f.pos.z - e.pos.z) < e.radius) {
              applyBurn(f, 1);
              m.hud.toast(f, 'BURNING');
            }
          }
          m.minions?.hurtAt(e.pos, e.radius, 2, e.caster);
          // ...and Geto's curses, which stand in the same field as the transfigured
          // human and take area damage from exactly the same sources.
          m.curses?.hurtAt(e.pos, e.radius, 2, e.caster);
          // burning ground eats a root field it is sitting on
          m.flora?.damageFieldsAt(e.pos, e.radius, 'fire');
          m.ice?.meltAt(e.pos, e.radius, 1.0);
        }
        if (e.life <= 0) this.entities.splice(i, 1);
      } else if (e.type === 'blue') {
        e.t -= dt;
        // the implosion made visible: motes spiralling INTO the point the
        // whole time it holds, so the drag reads as suction rather than as
        // an invisible force
        e.fxT = (e.fxT ?? 0) - dt;
        if (e.fxT <= 0) {
          e.fxT = 0.05;
          const a = rand(0, Math.PI * 2), d = rand(1.2, 2.4);
          const p = e.pos.clone().add(v3(Math.cos(a) * d, rand(-0.7, 0.7), Math.sin(a) * d));
          const life = rand(0.2, 0.35);
          m.fx._spawn(p, {
            color: Math.random() < 0.3 ? 0xffffff : 0x66b8ff, size: rand(0.1, 0.22), life,
            vel: v3((e.pos.x - p.x) / life, (e.pos.y - p.y) / life, (e.pos.z - p.z) / life)
          });
        }
        const t = this.other(e.caster);
        // attraction: drag the opponent toward the point (the sure-hit variant
        // from AML pulls regardless of state)
        if (!['knockdown', 'getup', 'ko'].includes(t.state)) {
          const d = e.pos.clone().sub(t.pos.clone().setY(e.pos.y));
          const dist = d.length();
          if (dist > 0.3) {
            d.normalize();
            const pull = clamp(22 - dist * 1.5, 8, 22);
            t.vel.x += d.x * pull * dt;
            t.vel.z += d.z * pull * dt;
          } else if (!e.dealt) {
            e.dealt = true;
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = t.applyHit({ dmg, kb: 0.5, kbY: 0, hitstun: 18, type: 'light', attacker: e.caster, isCT: true, sureHit: e.sure, dir: e.caster.forward(), src: 'ct2' }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, {});
          }
        }
        if (e.t <= 0) { if (e.fxNode) m.fx.release(e.fxNode); this.entities.splice(i, 1); }
      } else if (e.type === 'lungeHit') {
        e.frames--;
        const t = this.other(e.caster);
        if (!e.dealt && t.pos.distanceTo(e.caster.pos) < (e.radius ?? 1.5)) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({ dmg, kb: e.kb, kbY: e.heavy ? 2 : 0, hitstun: e.hitstun, type: e.heavy ? 'heavy' : 'light', attacker: e.caster, isCT: true, dir: e.caster.forward(), src: e.src }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: e.heavy });
          if (r === 'hit' || r === 'otg') openBlackFlash(e.caster, dmg);
          if (e.clapRing) { // the clap shock closing the combo
            m.sfx.clap();
            m.fx._ring(e.caster.pos.clone().add(v3(0, 1.2, 0)), TODO_ACCENT, { size: 0.6, growRate: 12, life: 0.35, flat: false });
          }
        }
        if (e.frames <= 0) {
          // whiffed Manji Kick breaks the chain (Yuta's lunge has no chain)
          if (!e.dealt && e.caster.cfg.blackFlash) e.caster.bfChain = 0;
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'tojiBlitz') {
        // ---- ASSASSINATION, part 1: the blitz ------------------------------
        // The connect window travels with him. On contact he STOPS, the victim
        // is pinned, and the four-weapon sequence is queued. On a whiff the
        // entity simply expires and the move's own recovery is the punish.
        e.frames--;
        const c = e.caster;
        const t = this.other(c);
        if (!e.dealt && t.alive && inArc(c, t, e.reach, e.arc)) {
          e.dealt = true;
          const u = c.cfg.ultimate;
          c.vel.set(0, 0, 0);
          c.assassinPhase = 'sequence';
          c.setState('assassinate', { clip: u.clip });
          // hold the clip at its sequence section rather than restarting it
          c.anim.play(u.clip, { fade: 0.05, restart: true, offset: 0.24 });
          m.hud.cutin(c, 'ASSASSINATION', u.name + '  ' + u.jpName);
          m.sfx.cleave(true);
          m.cam.cinematic(c.pos, 1.2, 2.6, 1.5);
          m.hitstop(14);
          // queue one strike per weapon, each on its own beat
          for (const s of u.sequence) {
            this.entities.push({
              type: 'tojiSeqHit', caster: c, target: t, t: s.at * (u.hitFrames / 60),
              dmg: s.dmg, weapon: s.weapon, unblockable: !!s.unblockable, nullify: !!s.nullify,
              last: s === u.sequence[u.sequence.length - 1]
            });
          }
        }
        if (e.frames <= 0) {
          if (!e.dealt) e.caster.emit('assassinWhiff');
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'tojiSeqHit') {
        // ---- ASSASSINATION, part 2: one strike per weapon -------------------
        // The model's weapon prop is switched on each beat, so the sequence
        // genuinely draws every tool in the arsenal in turn rather than
        // reskinning one swing four times.
        e.t -= dt;
        if (e.t > 0) continue;
        const c = e.caster, t = e.target;
        c.weapon = e.weapon;                    // fighter._props follows this
        const { dmg, crit } = computeDamage(c, e.dmg, { canCrit: !e.last });
        const r = t.applyHit({
          dmg, kb: e.last ? 6.5 : 0.6, kbY: e.last ? 1.5 : 0,
          hitstun: e.last ? 36 : 20, type: e.last ? 'knockdown' : 'heavy',
          attacker: c, isCT: true, unblockable: e.unblockable,
          dir: c.forward(), src: 'ultimate'
        }, m.ctxFor(c));
        hitFeedback(m, c, t, r, { crit, heavy: e.last });
        m.cam.shake(e.last ? 0.7 : 0.22);
        // THE SPEAR IS LAST, AND IT STILL NULLIFIES. Landing Assassination on
        // somebody holding a domain takes the domain — which is the whole
        // reason the spear is the finisher rather than the opener.
        if (e.nullify && (r === 'hit' || r === 'armor')) {
          const res = m.domains.nullify(t, c);
          if (res.cancelled) { m.stage.flash(0.5); m.hud.techFlash(res.label, 0x6ea88a); }
          t.ctSealT = Math.max(t.ctSealT, 5);
        }
        if (e.last) {
          // and he ends the sequence back on the tool he started it with
          c.weapon = c.cfg.arsenal.default;
          m.hitstop(18);
        }
        this.entities.splice(i, 1);
      } else if (e.type === 'goldRush') {
        // HAKARI (Jackpot) — the charge. He keeps his speed for the whole
        // window, tears up whatever he passes through, and the connect is a
        // wallslam: the victim is driven along his heading into the geometry
        // rather than popped into the air where he stands.
        e.frames--;
        const c = e.caster;
        c.vel.x = e.dir.x * (c.cfg.jackpotKit?.special?.lungeSpeed ?? 26);
        c.vel.z = e.dir.z * (c.cfg.jackpotKit?.special?.lungeSpeed ?? 26);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx._spawn(c.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.3, 1.9), rand(-0.4, 0.4))), {
            color: Math.random() < 0.35 ? 0xfff3c4 : 0xffc93c, size: rand(0.16, 0.42),
            life: 0.3, vel: e.dir.clone().multiplyScalar(-rand(3, 7)).add(v3(0, rand(0, 1.5), 0))
          });
        }
        m.arena?.destruct?.damageAt(c.pos.clone().setY(1.2), 2.2, e.slamPower * 0.35, { kind: 'body' });
        const tg = this.other(c);
        if (!e.dealt && tg?.alive && flatDist(tg.pos, c.pos) < e.radius) {
          e.dealt = true;
          const { dmg } = computeDamage(c, e.dmg, { canCrit: false });
          const r = tg.applyHit({
            dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun, type: 'knockdown',
            attacker: c, isCT: true, otgOk: true, dir: e.dir, src: 'punch'
          }, m.ctxFor(c));
          hitFeedback(m, c, tg, r, { heavy: true, knockdown: true });
          // the wallslam: the level takes the impact where the body lands
          const at = tg.pos.clone().addScaledVector(e.dir, 1.6).setY(1.3);
          m.arena?.destruct?.damageAt(at, 3.0, e.slamPower, { kind: 'body' });
          m.fx._ring(at, 0xffc93c, { size: 0.7, growRate: 18, life: 0.45, flat: false });
          m.sfx.slam();
          m.stage.flash(0.3);
          m.cam.shake(0.9);
          m.cam.fovKick(8);
          m.hitstop(14);
        }
        if (e.frames <= 0) this.entities.splice(i, 1);
      } else if (e.type === 'brotherhood') {
        // BROTHERHOOD: blink to a fresh angle around the target, strike,
        // repeat — the camera and the victim never get to settle
        e.t -= dt;
        if (e.t <= 0) {
          const t = this.other(e.caster);
          if (!t?.alive || !e.caster.alive) { this.entities.splice(i, 1); continue; }
          const ang = rand(0, Math.PI * 2);
          const from = e.caster.pos.clone();
          e.caster.pos.set(t.pos.x + Math.sin(ang) * 1.5, 0, t.pos.z + Math.cos(ang) * 1.5);
          e.caster.prevPos.copy(e.caster.pos);
          e.caster.facing = yawBetween(e.caster.pos, t.pos);
          e.caster.iFrames = Math.max(e.caster.iFrames, 12);
          m.fx.boogieSwap(from, e.caster.pos.clone(), TODO_ACCENT);
          m.sfx.clap();
          const last = --e.swings <= 0;
          const { dmg } = computeDamage(e.caster, last ? e.finDmg : e.hitDmg, { canCrit: false });
          const r = t.applyHit({
            dmg, kb: last ? 7 : 1.5, kbY: last ? 2 : 0, hitstun: last ? 40 : 18,
            type: last ? 'knockdown' : 'heavy', attacker: e.caster, isCT: true,
            otgOk: true, dir: e.caster.forward(), src: 'ultimate'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { heavy: true, knockdown: last });
          m.cam.shake(last ? 1.0 : 0.35);
          if (last) {
            // the finishing blow gets the full camera treatment
            m.cam.cinematic(t.pos, 1.4, 3.4, 1.8);
            m.cam.fovKick(10);
            m.arena?.destruct?.damageAt(t.pos.clone().setY(1), 3.4, 90);
            m.stage.flash(0.5);
            m.hitstop(16);
            this.entities.splice(i, 1);
          } else {
            e.t = e.interval;
          }
        }
      } else if (e.type === 'yujiShock') {
        // Divergent Fist: the delayed shockwave — catches early buttons
        e.t -= dt;
        if (e.t <= 0) {
          const t = this.other(e.caster);
          if (t.alive && (e.sure || t.pos.distanceTo(e.caster.pos) < 3)) {
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = t.applyHit({
              dmg, kb: 3, kbY: 8, hitstun: 30, type: 'launcher', attacker: e.caster,
              isCT: true, sureHit: e.sure, otgOk: e.sure, dir: e.caster.forward(), src: 'punch'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { crit, heavy: true });
            if (r === 'hit' || r === 'otg') openBlackFlash(e.caster, dmg);
            // the late energy made visible: the same punch arriving again,
            // in cursed-energy crimson, erupting out of the body
            m.fx.ghostFistBurst(t.pos.clone().add(v3(0, 1.1, 0)), e.caster.forward());
            m.fx._ring(t.pos.clone().add(v3(0, 1.1, 0)), 0xffa04a, { size: 0.4, growRate: 9, life: 0.3, flat: false });
            m.cam.shake(0.4);
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'slashHit') {
        // in-domain sword swing: connection hands off to the domain system
        e.frames--;
        const t = this.other(e.caster);
        if (!e.dealt && t.alive && inArc(e.caster, t, e.reach, e.arc)) {
          e.dealt = true;
          m.domains.swordHit(e.caster);
        }
        if (e.frames <= 0) this.entities.splice(i, 1);
      } else if (e.type === 'execHit') {
        // EXECUTION's connect window. Whiffing is the whole skill check on
        // this move — it does NOT end the domain, it just costs him 40 frames
        // of recovery and whatever the opponent does with them. Connecting is
        // what commits him, and the domain system takes it from there.
        e.frames--;
        const t = this.other(e.caster);
        if (!e.dealt && t?.alive && inArc(e.caster, t, e.reach, e.arc)) {
          e.dealt = true;
          m.domains.executionHit(e.caster, t);
        }
        if (e.frames <= 0) {
          if (!e.dealt) m.hud.toast(e.caster, 'EXECUTION MISSED');
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'counterPunish') {
        e.t -= dt;
        if (e.t <= 0) {
          const d = e.def || {};
          if (e.caster.alive) {
            this.applyTechnique(e.caster, 'hakari_punish', {
              target: e.target, dmg: d.punishDmg ?? 34, reach: d.reach, arc: d.arc,
              kb: d.kb, kbY: d.kbY, hitstun: d.hitstun, slot: 'ct2'
            });
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'swordPayoff') {
        e.t -= dt;
        if (e.t <= 0) { this.applySwordTech(e.caster, e.entry); this.entities.splice(i, 1); }
      } else if (e.type === 'delayedHit') {
        // Divergent Fist: the cursed energy arrives late and launches
        e.t -= dt;
        if (e.t <= 0) {
          const t = this.other(e.caster);
          if (t.alive) {
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = t.applyHit({
              dmg, kb: 3, kbY: 8, hitstun: 30, type: 'launcher', attacker: e.caster,
              isCT: false, sureHit: true, unblockable: true, otgOk: true, dir: e.caster.forward(), src: 'domain'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { heavy: true });
            m.fx._ring(t.pos.clone().add(v3(0, 1.2, 0)), e.color, { size: 0.5, growRate: 10, life: 0.35, flat: false });
            m.cam.shake(0.5);
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'bleed') {
        // Straw Doll resonance: chip damage over time, no reactions
        e.t -= dt;
        const t = this.other(e.caster);
        if (t.alive) {
          t.takeChip(e.dps * dt, 'dot');
          e.fxT = (e.fxT ?? 0) - dt;
          if (e.fxT <= 0) {
            e.fxT = 0.35;
            m.fx._spawn(t.pos.clone().add(v3(rand(-0.3, 0.3), rand(0.8, 1.4), rand(-0.3, 0.3))), {
              color: e.color, size: 0.12, life: 0.4, vel: v3(rand(-0.5, 0.5), -1.5, rand(-0.5, 0.5)), gravity: 3
            });
          }
        }
        if (e.t <= 0 || !t.alive) this.entities.splice(i, 1);
      } else if (e.type === 'shikigami') {
        // shadow beast streaking from caster to target, then the tackle
        e.t -= dt;
        const t = this.other(e.caster);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          const k = 1 - Math.max(0, e.t / 0.35);
          const p = e.caster.pos.clone().lerp(t.pos, k).setY(0.6 + Math.sin(k * Math.PI) * 0.5);
          m.fx._spawn(p, {
            color: Math.random() < 0.3 ? 0x181024 : e.color, size: rand(0.25, 0.55), life: 0.25,
            vel: v3(rand(-1, 1), rand(0, 1.5), rand(-1, 1))
          });
        }
        if (e.t <= 0) {
          if (t.alive) {
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = t.applyHit({
              dmg, kb: 4, kbY: 1.5, hitstun: 30, type: 'knockdown', attacker: e.caster,
              isCT: false, sureHit: true, unblockable: true, otgOk: true, dir: e.caster.forward()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { heavy: true });
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'rootSpikes') {
        // ---- HANAMI: ROOT ERUPTION --------------------------------------
        // The telegraph IS the move. A growing ring of green marks the spot
        // for most of a second before anything comes out of it, and on
        // natural ground that window is a third shorter — which is the whole
        // reason terrain is worth fighting over.
        e.t -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.11;
          m.fx._ring(e.pos.clone().setY(e.pos.y + 0.05), e.natural ? 0x9ed86a : 0x6f9a52,
            { size: e.radius * 0.45, growRate: 2.4, life: 0.32 });
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.6, 0.6), 0.08, rand(-0.6, 0.6))), {
            color: 0x7fc46a, size: rand(0.07, 0.15), life: 0.42, vel: v3(0, rand(1.2, 2.6), 0)
          });
        }
        if (e.t <= 0) {
          m.fx.rootBurst?.(e.pos, e.radius, e.natural);
          // REAL WOOD, not billboards standing in for it: a ring of root
          // clumps driven up out of the deck around the marked point
          const clumps = e.natural ? 5 : 3;
          for (let k = 0; k < clumps; k++) {
            const a = (k / clumps) * Math.PI * 2 + rand(-0.3, 0.3);
            const rr2 = e.radius * rand(0.25, 0.75);
            m.fx.rootSurge(e.pos.clone().add(v3(Math.cos(a) * rr2, 0, Math.sin(a) * rr2)), {
              len: rand(2.0, 3.2) * (e.natural ? 1.15 : 0.9), natural: e.natural, life: rand(0.85, 1.25)
            });
          }
          m.sfx.rootErupt?.();
          m.cam.shake(0.5);
          m.arena?.destruct?.damageAt(e.pos, e.radius + 1.0, 48, { kind: 'body' });
          m.arena?.splash?.(e.pos.x, e.pos.z, 1.2);
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            if (!e.sure && flatDist(f.pos, e.pos) > e.radius + 0.4) continue;
            if (Math.abs(f.pos.y - e.pos.y) > 2.2) continue;
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = f.applyHit({
              dmg, kb: e.kb, kbY: e.kbY, hitstun: 32, type: 'launcher', attacker: e.caster,
              isCT: true, sureHit: e.sure, otgOk: true, src: 'ct1',
              dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { crit, heavy: true });
          }
          m.minions?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          // ...and Geto's curses, which stand in the same field as the transfigured
          // human and take area damage from exactly the same sources.
          m.curses?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'woodenBall') {
        // ---- HANAMI: WOODEN BALL ----------------------------------------
        // The kill attempt and the terrain play, in that order. The impact
        // hits hard in a wide radius; the SHATTER converts a large patch of
        // the map to natural ground for the rest of the round, and that half
        // lands whether or not the damage did.
        e.t -= dt;
        if (e.node) m.fx.woodenBallFall?.(e.node, 1 - Math.max(0, e.t / (e.def.dropDelay ?? 0.55)));
        if (e.t <= 0) {
          const u = e.def;
          if (e.node) m.fx.release(e.node);
          m.fx.rootBurst?.(e.pos, u.radius, true);
          m.sfx.woodImpact?.();
          m.cam.shake(1.1); m.cam.fovKick(10);
          m.stage.flash(0.5);
          m.hitstop(16);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(e.pos.y + 1), u.radius + 2, 140, { kind: 'body' });
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            if (flatDist(f.pos, e.pos) > u.radius) continue;
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = f.applyHit({
              dmg, kb: u.kb ?? 7, kbY: u.kbY ?? 4, hitstun: u.hitstun ?? 42, type: 'knockdown',
              attacker: e.caster, isCT: true, otgOk: true, src: 'ultimate',
              dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { heavy: true, knockdown: true });
          }
          // the spikes the canon ball sprouts on impact
          for (let k = 0; k < (u.spikes ?? 18); k++) {
            const a = (k / (u.spikes ?? 18)) * Math.PI * 2;
            m.fx._spawn(e.pos.clone().add(v3(Math.sin(a) * u.radius * 0.5, 0.2, Math.cos(a) * u.radius * 0.5)), {
              color: 0x6a4f34, size: rand(0.2, 0.4), aspect: 0.3, life: 0.6,
              vel: v3(Math.sin(a) * 4, rand(4, 8), Math.cos(a) * 4), gravity: 9
            });
          }
          // AND THE GROUND. This is the half that makes the ultimate a
          // terrain play rather than just a big number.
          m.flora.plantField(e.caster, {
            x: e.pos.x, y: e.pos.y, z: e.pos.z,
            radius: u.field.radius, duration: u.field.duration,
            hp: 9999, permanent: !!u.field.permanent
          });
          m.hud.techFlash('木の鞠 — THE GROUND IS HIS NOW', 0x9ec46a);
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'corrode') {
        // the spray's lingering burn. `dot` so Mahoraga's BURN & BLEED
        // adaptation covers it exactly as it covers Jogo's fire.
        e.t -= dt;
        if (e.target.alive) {
          e.target.takeChip(e.dps * dt, 'dot');
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.22;
            m.fx._spawn(e.target.pos.clone().add(v3(rand(-0.3, 0.3), rand(0.6, 1.5), rand(-0.3, 0.3))), {
              color: Math.random() < 0.4 ? 0xf0c94a : 0xd8a02a, size: rand(0.08, 0.16),
              life: 0.5, vel: v3(rand(-0.3, 0.3), -1.4, rand(-0.3, 0.3)), gravity: 3
            });
          }
        }
        if (e.t <= 0 || !e.target.alive) this.entities.splice(i, 1);
      } else if (e.type === 'devourHold') {
        // ---- KUROURUSHI: DEVOUR, the bite -------------------------------
        // The victim is held for the whole hold, then it lands all at once and
        // they are dropped. He heals for a portion and takes the Gluttony.
        e.frames--;
        const c = e.caster, t = e.target;
        // keep them in his maw while it runs
        t.pos.copy(c.pos).addScaledVector(c.forward(), 1.0);
        t.pos.y = c.pos.y;
        t.prevPos.copy(t.pos);
        t.vel.set(0, 0, 0);
        if (e.frames === 6) {
          const { dmg } = computeDamage(c, e.sp.dmg, { canCrit: false });
          const r = t.applyHit({
            dmg, kb: 4.0, kbY: 0, hitstun: 40, type: 'knockdown', attacker: c,
            isCT: true, unblockable: true, otgOk: true, dir: c.forward(), src: 'throw'
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { heavy: true, knockdown: true });
          // `maxHP` already IS `cfg.stats.hp + growthHpBonus` for him, and it
          // is the ACTIVE CORE's pool for Panda — one getter instead of a sum
          // that only knew about one of the two health systems.
          c.res.hp = Math.min(c.maxHP, c.res.hp + dmg * (e.sp.healFrac ?? 0.45));
          m.swarms.feed(c, c.cfg.gluttony.perDevour);
          m.sfx.slam();
          m.cam.shake(0.8);
          m.stage.flash(0.3);
          m.hitstop(14);
        }
        if (e.frames <= 0) {
          c.model.setMaw?.(0);
          if (t.state === 'devoured') t.setState('knockdown', { clip: 'knockdown' });
          this.entities.splice(i, 1);
        }
      }
    }
  }

  clear() {
    for (const e of this.entities) {
      if (e.fxNode) this.match.fx.release(e.fxNode);
      // ---- GEOMETRY THIS SYSTEM PUT IN THE SCENE ITSELF --------------------
      // `fxNode` is a POOLED node and `release` hands it back. An entity that
      // built its own mesh and called `fx.scene.add` — Uraume's shards and
      // glacier, Ryu's beam and his ultimate — owns that mesh outright, and
      // dropping the entity reference without disposing it ORPHANS IT IN THE
      // SCENE FOREVER. Reported from a real match: a maximum Granite Blast
      // left its beam hanging in the air after the round ended, and every
      // subsequent round added another one.
      this._disposeNode(e.node);
      // ...and an entity holding real COLLIDERS has to give them back, or the
      // round boundary leaves invisible walls standing. Frost Calm's columns
      // are the only case today and this is the only place a round reset
      // reaches them.
      if (e.type === 'iceWalls' && e.walls && e.bounds) e.bounds.drop(e.walls);
      // a nail wiped by a round boundary was never spent, so give the count
      // back — Fighter.resetForRound zeroes it too, but a mid-match clear that
      // does not reset fighters must not strand the cap
      if (e.type === 'nail' && e.caster) e.caster.nailCount = Math.max(0, e.caster.nailCount - 1);
    }
    this.entities.length = 0;
    // THE PER-FIGHTER SCENE NODES. Ryu's ground cracks and muzzle gather are
    // parented to the scene and tracked on HIM rather than on an entity, so
    // they survive an entity wipe; `outputClear` is idempotent and a no-op for
    // anybody who has never charged. Same for a frost shell that was still
    // closed round a body when the buzzer went.
    for (const f of this.match.fighters ?? []) {
      this.match.fx.outputClear?.(f);
      this.match.fx.frostShatter?.(f, true);
    }
  }
}
