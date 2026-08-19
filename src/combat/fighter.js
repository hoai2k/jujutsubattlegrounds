// Fighter: state machine, movement physics, resources (the MAX_CE/CURRENT_CE
// system), combo/juggle bookkeeping, animation driving.
import * as THREE from 'three';
import { clamp, damp, angleDamp, yawBetween, v3, rand } from '../core/mathutil.js';
import { AnimPlayer } from '../art/anim/player.js';
import { BURN, tickBurn } from './burn.js';
import { Adaptation } from './adaptation.js';
import { hitMult, SPECIAL } from './balance.js';
import { isContact } from './freeze.js';
import { pickTaunt, TAUNT_COOLDOWN, TAUNT_GRANTS_METER, TAUNT_METER_BONUS } from './taunts.js';
import { tickCharge, spendCharge, chargeDmg, chargeSize, chargeSpeed, chargeFrac } from './charge.js';
// CURSED SPEECH — the throat gauge, the tiers, resistance, the resolver and
// the forced-state driver. Every helper it exports is a no-op for a fighter
// without `cfg.throat`, which is the entire rest of the roster, so the calls
// below are unconditional and there is no branch to forget.
import {
  tickThroat, checkUtterance, tickForced, isSilenced,
  canSpeak, affordable, boundCommand, boundKey, bindCommand
} from './speech.js';
import { buildCores, resetCores, coresAlive, nextCore, coreIndexOf } from './cores.js';

const GRAVITY = 26;
// how far above the current surface a fighter may step without jumping — kerbs,
// stair lips, the first bleacher row
const STEP_TOL = 0.55;

// TECH (quick-rise): jump timed as you hit the floor and you land on your feet
// instead of eating the knockdown. The window is the last stretch of the fall
// (TECH_HEIGHT metres off the ground, falling) plus a few frames of grace once
// you are already down — so a knockdown that never launched can still be
// teched. Press it early and TECH_LOCK bars the attempt: mashing costs you the
// escape, timing it wins it back.
const TECH_HEIGHT = 0.8;     // metres above the floor the window opens
const TECH_KD_FRAMES = 6;    // grace frames after touchdown
const TECH_RISE_FRAMES = 15; // length of the kip-up before you can act

// THE THREE RADIAL WHEELS: how long B has to be held before the radial opens.
// Under this it is a TAP and commits the default. Ten frames is the standard
// fighting-game tap window — long enough that a deliberate press never opens a
// wheel by accident, short enough that a deliberate hold feels instant.
const TAP_MAX = 0.17;

export class Fighter {
  constructor({ config, model, clips, index = 0, arenaRadius, bounds = null, spawn, facing, pick = null }) {
    this.cfg = config;
    this.model = model;
    // The full pick id ('gojo' or 'gojo:shinjuku'). Only the taunt system reads
    // it — a gameplay variant already IS its own config, but a taunt can differ
    // for a purely cosmetic one, so the variant has to survive to here.
    this.pick = pick || config.id;
    this.index = index;            // seat number: 0..3
    this.isP1 = index === 0;
    this.arenaRadius = arenaRadius;
    // While a domain stands its inner world may be SMALLER than the arena —
    // Hakari's parlor has banks of machines where the outdoor floor was empty.
    // domains.js sets this on activation and clears it on collapse; null means
    // "use the arena". Read through `boundRadius`, never directly.
    this.domainRadius = null;
    // The maps are no longer a flat disc: `bounds` carries the walkable
    // surfaces, the wall colliders and the outer edge. When it is absent the
    // old circular clamp is used, so nothing that predates the map system
    // (the viewer, a bare test harness) breaks.
    this.bounds = bounds;
    this.groundY = 0;              // height of the surface under him right now
    this.anim = new AnimPlayer(model.bones, clips);

    this.spawn = (spawn || new THREE.Vector3(this.isP1 ? -2.4 : 2.4, 0, 0)).clone();
    this.spawnFacing = facing ?? (this.isP1 ? Math.PI / 2 : -Math.PI / 2);
    this.pos = this.spawn.clone();
    this.vel = new THREE.Vector3();
    this.facing = this.spawnFacing;
    this.prevPos = this.pos.clone();
    this.prevFacing = this.facing;
    this.grounded = true;

    const s = config.stats;
    this.res = { hp: s.hp, maxCE: s.startMaxCE, curCE: s.startMaxCE, stamina: s.stamina };

    // ---- PANDA: THE THREE CORES 呪骸核 --------------------------------------
    // `res.hp` becomes an ACCESSOR onto the active core's pool, and that one
    // redefinition is the whole reason the multi-pool health character did not
    // require rewriting the damage pipeline. Every `this.res.hp -= dmg` in this
    // file, every heal clamp in flora/jackpot/effects, every read in the HUD
    // and the domain-clash tally goes on working unmodified and now operates on
    // whichever core is exposed. See the header of combat/cores.js for the full
    // reasoning and for the list of the four things that DID have to change.
    //
    // Null for every other fighter in the game, so `res` stays a plain object
    // with a plain number on it for the entire existing roster.
    this.cores = buildCores(config);
    this.coreIndex = 0;
    this.stance = config.cores ? config.cores.order[0] : null;
    this.swapWheel = null;       // the core radial while B is held
    this.allCoresT = 0;          // seconds of THREE CORES, ONE BODY left
    this.allCoresMult = 1;       // its scaling, fixed at cast time
    if (this.cores) {
      Object.defineProperty(this.res, 'hp', {
        get: () => this.cores[this.coreIndex].hp,
        set: v => { this.cores[this.coreIndex].hp = v; },
        enumerable: true, configurable: true
      });
    }

    this.state = 'idle';
    this.f = 0;                  // frames in current state
    this.move = null;            // active move def (attacks/CTs)
    this.punchIndex = 0;
    this.punchQueued = false;
    this.activeHit = null;       // {def, frames, confirmed, rearm, hitsLeft}

    this.iFrames = 0;
    this.armorFrames = 0;
    this.juggle = 0;
    this.otgUsed = false;
    this.techLock = false;       // mistimed a tech attempt: no rise this knockdown
    this.comboHits = 0;          // hits LANDED by this fighter (HUD)
    this.comboTimer = 0;

    // `redScale` is Choso's Flowing Red Scale window; `bfCharge` is the damage
    // window Nobara's Black Flash grants. Both are plain second counters like
    // everything else here, so the Inverted Spear's buff strip and the round
    // reset already know what to do with them.
    this.buffs = {
      overtime: 0, voidDebuff: 0, resolve: 0, sukuna: 0, overheat: 0,
      soulWound: 0, domainHaste: 0, redScale: 0, bfCharge: 0
    };
    this.burn = { stacks: 0, t: 0, noDecay: false }; // Jogo's stacking fire DoT
    this.domainHasteMult = 1;    // speed bonus inside your own domain (Jogo)
    this.bwVariant = -1;         // mahito: last Body Weapon variant (never repeats)
    this.backlash = 0;           // seconds of domain backlash left
    this.bfT = 0;                // yuji: frames until the Black Flash window closes
    this.bfBase = 0;             // damage of the connect that opened the window
    this.bfChain = 0;            // consecutive Black Flashes this combo
    this.specialCD = 0;          // shared: B special cooldown (seconds)
    this.specialCDMax = 1;       // what the current cooldown started from (HUD sweep)
    // ---- TAUNTS (D-pad Left) ------------------------------------------------
    // `taunt` is non-null for exactly as long as the `taunt` STATE is live. It
    // is the single flag every other system reads — the bubble follows it, the
    // audio follows it, and every interruption in the game is already a state
    // change, so nothing else has to know that taunts exist. See `_tauntCheck`.
    this.taunt = null;           // {def, t, said, bubbled} while taunting
    this.tauntCD = 0;            // rate limit (seconds)
    this.tauntN = 0;             // press counter — cycles multi-taunt lists
    this.resolveArmor = false;   // yuji: armor through one hit while RESOLVE is up
    this.ratioSweep = null;      // nanami: 0..1 marker position while timing, else null
    this.ratioPrimed = 0;        // nanami: 0 = none, 1 = near miss, 2 = perfect 7:3
    this.ratioPrimedT = 0;       // seconds before an unspent prime fades
    this.ratioSweepN = 0;        // successes this round — the sweep speeds up
    this.backlashGrowthMult = 1;
    this.ratioMark = false;
    this.copySlot = null;        // yuta
    this.purpleWindow = 0;       // gojo
    this.heldSword = false;      // yuta in-domain: carrying a domain katana
    this.punchDmgMult = 1;       // sword domain weakens the caster's bare hands
    // ---- higuruma ----
    this.execSword = false;      // holding the Executioner's Sword (his own domain)
    this.swordDrawT = 0;         // frames of the materialize animation left
    this.evidence = 0;           // 0..100, filed by Judgeman
    this.castThresholdOverride = null; // evidence lowers the domain cast gate
    this.lockedSlot = null;      // {slot, t} — a technique button Confiscation took
    this.slotUse = { ct1: 0, ct2: 0, special: 0 }; // what they lean on (Confiscation reads it)
    this.instantKO = null;       // a carried-out sentence / a reshaped soul
    this.lastCT = null;          // last technique key fired (Copy roll mirrors it)
    this.rootT = 0;              // seconds left rooted by Cursed Speech
    this.aimLag = 0;             // seconds the soft lock stays stale (post-swap disorientation)
    // OPPONENT LOCK (left stick press / L3). On by default — the whole control
    // scheme is built around it. Off, the fighter turns to face the way they
    // are moving and the stick becomes camera-relative, which is what lets a
    // player deliberately face a shikigami, a transfigured human, or just look
    // where they want on a 110 m map.
    this.lockOn = true;
    this.aimOverride = null;     // Vector3: face THIS instead of the opponent
    // ---- megumi ----
    this.wheel = null;           // {sel, slot, t} while the shikigami wheel is held
    this.submerged = 0;          // 0..1 sunk into the shadow (untargetable at 1)
    this.shadowDash = false;     // dashing THROUGH the shadow rather than over it

    // ---- naoya: PROJECTION SORCERY ----
    // `frozenT` is on EVERY fighter, not just Naoya, because any of them can
    // be the one it happens to. It is read directly by the state machine (see
    // the `frozen` gate in _stateLogic) rather than by asking a system, so the
    // "no input at all" guarantee is structural.
    this.frozenT = 0;            // seconds left trapped in a frame
    this.projT = 0;              // seconds Projection Stance stays ARMED
    this.projArmT = 0;           // seconds of stance startup still to run
    this.projSpent = false;      // did anything actually touch him this stance?
    this.maxProjT = 0;           // seconds left of MAXIMUM PROJECTION
    this.projStepT = 0;          // afterimage placement clock

    // ---- kashimo: CHARGE 帯電 ----
    // The whole character is these five fields. `charge` and `chargeTier` are
    // present on EVERY fighter rather than only on him, for exactly the reason
    // `frozenT` is: the systems that read them (the HUD row, the debug overlay,
    // the effect dispatcher's scalars) would otherwise each need a null check,
    // and four numbers that are always zero cost nothing. `cfg.charge` is what
    // actually decides whether any of it does anything — see combat/charge.js,
    // where every helper returns a no-op for a config without it.
    this.charge = 0;
    this.chargeTier = 0;
    this.amberT = 0;             // seconds of MYTHICAL BEAST AMBER left
    this.arcChain = 0;           // Arc Dash passes used in the current chain
    this.arcWindow = 0;          // seconds left to keep the chain alive

    // ---- inumaki: CURSED SPEECH 呪言 ----
    // Six fields, and like `charge` and `frozenT` they live on EVERY fighter
    // rather than only on him. Four of them are his cost and two of them are
    // what the WORD does to somebody else — and the somebody else can be
    // anybody in the roster, so `forced`, `sleepT` and `twisted` have to exist
    // on all of them. `cfg.throat` and `cfg.commands` are what decide whether
    // any of it does anything; see combat/speech.js, where every helper
    // returns a no-op for a config without them.
    this.throat = 0;             // 0..cfg.throat.max — the strain gauge
    this.throatTier = 0;         // 0 CLEAR / 1 STRAINED / 2 RAW / 3 SILENCED
    this.throatRest = 0;         // seconds before recovery is allowed to start
    this.voiceSpent = false;     // the ultimate's latch: SILENCED for the round
    this.utter = null;           // {key, fired} while a command is being spoken
    this.cmdBind = null;         // {ct1, ct2} — set on first read, see boundKey
    // ...and the receiving end, on every fighter:
    this.forced = null;          // {mode:'flee'|'pull', t, speed, from}
    this.sleepT = 0;             // seconds of SLEEP's slow left
    this.sleepMult = 1;          // how slow — read by `speedMult`
    this.twisted = null;         // {t, mult} — GET TWISTED's output cut

    // ---- geto: THE CURSE STABLE ----
    // The wheel object above is shared (both summoners hold a radial), but the
    // reabsorb latch is his alone.
    this.reabsorbHeld = 0;

    // ---- mahoraga ----
    // ADAPTATION is the only "resource" he has, and it is not spent, it is
    // accumulated. Present only on a config that declares it, so nothing else
    // on the roster pays for it.
    this.adapt = config.adaptation ? new Adaptation(config.adaptation) : null;
    this.chargeDir = null;       // locked heading while the heavy charge runs
    this.chargeCD = 0;
    // MEGUMI: the summon ritual is once per MATCH, so this deliberately does
    // NOT reset in resetForRound.
    this.ritualUsed = false;
    this.transformedInto = null; // set on Megumi when Mahoraga takes his place

    // ---- hakari ----
    // JACKPOT. Null except while the 99-second window is live; the object is
    // owned and ticked by domains/jackpot.js, and everything here only reads
    // it or feeds the RCT ledger. It deliberately OUTLIVES his domain, so it
    // is stored on the fighter rather than on the domain state.
    this.jackpot = null;         // {t, dur, pending, healT, rct, floor}
    this.shutterT = 0;           // seconds the rolling shutter is still up
    this.shutterHits = 0;        // melee hits it can still eat before breaking
    this.counterT = 0;           // frames the RCT counter stance is open

    // ---- sukuna ----
    // FINGER STACKS. Deliberately NOT reset in resetForRound — like Megumi's
    // ritual and Hakari's buy-in, a finger he ate in round one is gone for the
    // rest of the MATCH, and the strength it bought is his for the rest of the
    // match too. Everything that reads it (technique damage, range, startup,
    // the Fire Arrow gate, the model's markings) reads this one number.
    this.fingers = 0;
    this.fireT = 0;              // frames held on the Fire Arrow charge

    // ---- gojo (shinjuku variant) ----
    // FALLING BLOSSOM EMOTION 落花の情. Frames left on the counter-shroud.
    // While it is up, any DOMAIN SURE-HIT that would land on him is nullified
    // on contact and answered. It does nothing at all about ordinary attacks,
    // which is the documented weakness of the real technique and the hole that
    // makes it fair here.
    this.blossomT = 0;
    this.blossomHits = 0;        // how many sure-hits it has eaten (HUD/telemetry)

    // ---- toji ----------------------------------------------------------
    // THE ARSENAL, in place of a cursed-energy bar. `weapon` is the key of the
    // tool currently in hand and it is the ONLY resource-shaped thing he has:
    // it is not spent, it is not built, it is chosen. Present only on a config
    // that declares an arsenal, so nobody else grows the fields.
    this.weapon = config.arsenal ? config.arsenal.default : null;
    this.arsenal = null;         // {sel, t} while the radial is held
    this.swapT = 0;              // frames left in a draw animation
    this.assassinCD = 0;         // seconds; starts at 0 = READY on frame one
    this.assassinPhase = null;   // 'blitz' | 'sequence'
    this.assassinHit = 0;        // index into ultimate.sequence
    this.nullifyCD = 0;          // the Inverted Spear's own separate cooldown
    // Confiscation and Nullify both need to seal a technique button. The
    // existing `lockedSlot` is Higuruma's; this is the one Toji applies, kept
    // separate so a fighter can be under both at once and neither silently
    // overwrites the other's timer.
    this.ctSealT = 0;            // seconds ct1+ct2 are sealed by NULLIFY
    this.soulCut = null;         // {t, mult} — the Split Soul Katana's debuff

    // ---- hanami --------------------------------------------------------
    // NATURE'S EMBRACE. `terrain` is the SETTLED reading of what he is
    // standing on ('natural' | 'artificial' | 'field'); combat/flora.js owns
    // it, the HUD reads it, and the model's flowers follow it. Present on
    // everyone because the fields cost nothing and a branch per fighter to
    // avoid four nulls is worse than the four nulls.
    this.terrain = null;
    this.terrainRaw = null;
    this.terrainSettle = 0;
    this.floraRate = 0;          // hp/s he is actually regenerating
    this.floraSlow = 1;          // speed multiplier from standing in a field

    // ---- kurourushi ----------------------------------------------------
    // GLUTTONY. The second resource: it fills from swarm contact and DEVOUR,
    // it never decays inside a round, and each threshold makes him bigger.
    // Round-scoped like adaptation and Jackpot — a round boundary resets the
    // fight, and a stage-3 body carried into round two would end the match
    // before it started.
    this.gluttony = 0;
    this.growthStage = 0;
    this.growthHpBonus = 0;
    this._mawT = 0;
    this._wingT = 0;
    // GUARD MELT, from the corrosive spray. It multiplies the DEFENDER's chip
    // and stamina drain, so it lives on the victim rather than on the attacker.
    this.melt = null;            // {t, chip, stamina}

    // ---- choso ---------------------------------------------------------
    // BLOOD. The second resource: it fills as he DEALS damage and as he TAKES
    // it, and every technique he owns spends it on top of cursed energy. Round
    // -scoped like Gluttony and adaptation.
    //
    // Note what is deliberately absent: any route by which his own health is
    // spent. The gauge is the cost; there is no self-damage anywhere in his
    // implementation and nothing here should ever grow one.
    this.blood = config.blood ? (config.blood.start ?? 0) : 0;

    // ---- nobara --------------------------------------------------------
    // ESSENCE. Taken FROM the opponent by landing clean hits, spent on
    // RESONANCE. It never decays inside a round — it is lost only when spent,
    // which is what makes disengaging from her pointless.
    this.essence = config.essence ? (config.essence.start ?? 0) : 0;
    // nails currently embedded (in a body or in the floor) are owned by the
    // effect dispatcher; this is only the count, for the HUD and the cap check
    this.nailCount = 0;

    this.domainLock = null;      // 'voided' while inside Unlimited Void
    this.events = [];            // one-tick messages for match to consume
    this.lives = 3;              // stock: lose all three and the match is over
  }

  // ---- CHOSO: BLOOD --------------------------------------------------------
  // Both helpers are no-ops for anyone without `cfg.blood`, so they are safe to
  // call unconditionally from the shared damage choke points and there is no
  // branch to forget.
  gainBlood(amount) {
    const b = this.cfg.blood;
    if (!b || !(amount > 0) || !this.alive) return;
    const before = this.blood;
    this.blood = Math.min(b.max, this.blood + amount);
    if (before < b.max && this.blood >= b.max) this.emit('bloodFull');
  }
  spendBlood(cost) {
    if (!this.cfg.blood || !cost) return true;
    if (this.blood < cost) return false;
    this.blood -= cost;
    return true;
  }

  // ---- NOBARA: ESSENCE -----------------------------------------------------
  // `kind` is the tier of contact that produced it — see cfg.essence. Gathering
  // is reported so the HUD can flash the meter on the opponent's behalf: they
  // are the one who needs to notice.
  gainEssence(amount, why = null) {
    const e = this.cfg.essence;
    if (!e || !(amount > 0) || !this.alive) return 0;
    const before = this.essence;
    this.essence = Math.min(e.max, this.essence + amount);
    const got = this.essence - before;
    if (got > 0.01) this.emit('essence', { amount: got, total: this.essence, why });
    return got;
  }
  // Resonance spends the WHOLE meter — there is no partial spend and no charge
  // input. See characters/nobara.js for why.
  spendAllEssence() {
    const n = this.essence;
    this.essence = 0;
    return n;
  }

  // ---- KUROURUSHI: GROWTH --------------------------------------------------
  // One number, read everywhere size matters. Returns 1 for everyone else, so
  // it is safe to call unconditionally and there is no branch to forget.
  //
  // What it deliberately does NOT touch: `bodyRadius`, the wall probe, and the
  // step tolerance. That is Mahoraga's navigation ruling reused wholesale — a
  // fully grown Kurourushi can physically go everywhere a fresh one can, so
  // there is no interior on any of the seven maps he can wedge himself in.
  get growthScale() {
    const g = this.cfg.gluttony;
    return g ? 1 + (this.growthStage || 0) * g.perStage.scale : 1;
  }
  get reachScale() {
    const g = this.cfg.gluttony;
    return g ? 1 + (this.growthStage || 0) * g.perStage.reach : 1;
  }
  // The hurt capsule, scaled. hits.js reads this instead of cfg.size directly,
  // so a bigger body is a bigger thing to hit — which is the balancing half of
  // growth and it has to be real.
  get hurtBox() {
    const s = this.cfg.size || {}, k = this.growthScale;
    return {
      radius: (s.hurtRadius ?? 0.62) * k,
      height: (s.hurtHeight ?? 1.45) * k,
      center: (s.hurtCenter ?? 1.05) * k,
      pad: (s.hurtPad ?? 0) * k,
      strikeY: (s.strikeY ?? 1.25) * k,
      push: (s.pushRadius ?? 0.4) * k
    };
  }
  // his maximum health rises with him, and `_advance` hands him the gain
  //
  // PANDA: the ACTIVE CORE'S maximum. Every heal clamp in the game reads this
  // (three of them were reading `cfg.stats.hp` directly and were changed to),
  // so healing tops up the exposed core and stops there — which is correct:
  // Hakari's RCT and Hanami's regen repair the body that is taking the damage,
  // and neither has any business reaching into a core that is not out.
  get maxHP() {
    if (this.cores) return this.cores[this.coreIndex].max;
    return this.cfg.stats.hp + (this.growthHpBonus || 0);
  }

  // Damage that never goes through the hit pipeline: burn ticks, domain heat,
  // bleed. Routed here so adaptation can see and reduce them like anything
  // else — otherwise the BURN & BLEED category would be unreachable.
  takeChip(amount, src = null, elem = null) {
    let a = amount;
    if (this.adapt && src) {
      this.adapt.mark(src);
      a *= 1 - this.adapt.reductionFor(src);
    }
    // FIRE VULNERABILITY. Chip is where most fire in the game actually lands —
    // burn stacks and the Iron Mountain's ambient heat both route through
    // here — so the multiplier has to be applied at this choke point as well
    // as in the hit pipeline. Returns 1 for everyone without the flag.
    if (elem === 'fire') a *= this.fireMult;
    const before = this.res.hp;
    this.res.hp -= a;
    if (this.jackpot) this._rct(before);
    // CHOSO'S BLOOD fills from damage taken, and a burn tick is damage taken.
    // Routed here as well as in applyHit so there is no damage source in the
    // game that reaches his health without also reaching his gauge.
    if (this.cfg.blood) this.gainBlood(a * (this.cfg.blood.perDamageTaken ?? 0));
    return a;
  }

  // ---- FIRE VULNERABILITY (Hanami) ----------------------------------------
  // A single declared multiplier, read at every point fire damage is applied:
  // Jogo's burn ticks, his magma eruptions, his embers, the Coffin of the Iron
  // Mountain's ambient heat and its guaranteed eruptions, and Sukuna's Fire
  // Arrow. Anyone without `fireVulnerability` gets 1 and nothing changes.
  get fireMult() { return this.cfg.fireVulnerability ?? 1; }

  // ---- REVERSE CURSED TECHNIQUE (Hakari, Jackpot) --------------------------
  // Damage LANDS. It comes off the bar where both players can see it, and only
  // then does it get paid back (domains/jackpot.js drains `pending`). The one
  // thing enforced here is the floor: while Jackpot holds, damage cannot take
  // him below 1 HP.
  //
  // Note what this deliberately does not cover: anything that sets hp directly
  // instead of dealing damage. Mahito's transfiguration writes `res.hp = 0` at
  // the end of its cinematic and never comes through here, which is exactly
  // why it still kills him — RCT heals wounds, it does not un-reshape a soul.
  _rct(before) {
    const j = this.jackpot;
    if (!j || j.t <= 0) return;
    const lost = before - this.res.hp;
    if (lost <= 0) return;
    j.pending += lost;
    j.healT = j.rct.delay;
    if (this.res.hp < j.floor) this.res.hp = j.floor;
    this.emit('rctDamage', { amount: lost });
  }

  // Wipe everything round-scoped back to opening state, keeping the life
  // count. Called between stocks so nothing (buffs, juggle, copies, backlash)
  // leaks across rounds.
  resetForRound(startPos, facing) {
    const s = this.cfg.stats;
    this.res.hp = s.hp;
    this.res.maxCE = s.startMaxCE;
    this.res.curCE = s.startMaxCE;
    this.res.stamina = s.stamina;
    this.pos.copy(startPos ?? this.spawn);
    this.prevPos.copy(this.pos);
    this.groundY = this.pos.y;
    this.vel.set(0, 0, 0);
    this.facing = facing ?? this.spawnFacing;
    this.prevFacing = this.facing;
    this.grounded = true;
    this.move = null;
    this.activeHit = null;
    this.punchIndex = 0;
    this.punchQueued = false;
    this.iFrames = 0;
    this.armorFrames = 0;
    this.juggle = 0;
    this.otgUsed = false;
    this.techLock = false;
    this.comboHits = 0;
    this.comboTimer = 0;
    this.hitstun = 0;
    this.buffs.overtime = 0;
    this.buffs.voidDebuff = 0;
    this.buffs.resolve = 0;
    if (this.buffs.overheat > 0) this.model.setOverheat?.(false);
    this.buffs.overheat = 0;
    this.buffs.soulWound = 0;
    this.buffs.domainHaste = 0;
    this.domainHasteMult = 1;
    this.burn.stacks = 0;
    this.burn.t = 0;
    this.burn.noDecay = false;
    this.bwVariant = -1;
    if (this.buffs.sukuna > 0) this.model.setSukuna?.(false);
    this.buffs.sukuna = 0;
    this.bfT = 0;
    this.bfBase = 0;
    this.bfChain = 0;
    this.specialCD = 0;
    this.specialCDMax = 1;
    this.resolveArmor = false;
    this.ratioSweep = null;
    this.ratioPrimed = 0;
    this.ratioPrimedT = 0;
    this.ratioSweepN = 0;
    this.backlash = 0;
    this.backlashGrowthMult = 1;
    this.ratioMark = false;
    this.copySlot = null;
    this.purpleWindow = 0;
    this.heldSword = false;
    this.punchDmgMult = 1;
    this.execSword = false;
    this.swordDrawT = 0;
    this.evidence = 0;
    this.castThresholdOverride = null;
    this.lockedSlot = null;
    this.slotUse.ct1 = this.slotUse.ct2 = this.slotUse.special = 0;
    // an executed body does not come back next round — the round does
    this.instantKO = null;
    this.lastCT = null;
    this.rootT = 0;
    // CURSED SPEECH — every piece of it is round-scoped, INCLUDING the
    // `voiceSpent` latch. That is the whole meaning of "he spends his voice
    // for the rest of the round": a new round is a new throat, and the blood
    // on his collar is washed off with it (`clearStrain`).
    this.throat = 0;
    this.throatTier = 0;
    this.throatRest = 0;
    this.voiceSpent = false;
    this.utter = null;
    this.model.clearStrain?.();
    this.model.setCollar?.(0);
    this.model.setMarks?.(false);
    // the bindings deliberately SURVIVE the round, exactly as Toji's equipped
    // weapon and Megumi's shikigami slots do: they are a loadout the player
    // chose, not a resource they spent
    this.forced = null;
    this.sleepT = 0;
    this.sleepMult = 1;
    this.twisted = null;
    this.aimLag = 0;
    this.aimOverride = null;
    // lockOn deliberately survives the round: it is a control preference, not
    // a combat resource
    // A taunt does not survive a round boundary — bubble included. `tauntN`
    // does, so a two-taunt character keeps cycling instead of restarting on
    // the same one every round.
    this.taunt = null;
    this.tauntCD = 0;
    this.wheel = null;
    this.submerged = 0;
    this.shadowDash = false;
    this.model.setSubmerged?.(0);
    // PROJECTION SORCERY — every piece of it is round-scoped, including the
    // freeze. FreezeSystem.clear() restores the victim's materials on the same
    // boundary, so nothing can be left grey or stepping into a new round.
    this.frozenT = 0;
    this.projT = 0;
    this.projArmT = 0;
    this.projSpent = false;
    this.maxProjT = 0;
    this.projStepT = 0;
    this.model.setProjectionStance?.(false);
    this.model.projectionClear?.();
    // CHARGE is round-scoped like every other combat resource. He starts every
    // round EARTHED, at tier 0, which is the correct opening state for a
    // character whose meter is built by moving: the round has not started yet,
    // so he has not moved yet.
    this.charge = 0;
    this.chargeTier = 0;
    this.amberT = 0;
    this.arcChain = 0;
    this.arcWindow = 0;
    this.model.setCharge?.(0, 0);
    // ---- PANDA: THE THREE CORES ARE ROUND-SCOPED ---------------------------
    // This is the one place the core system deliberately parts company with
    // Megumi's shikigami ledger, which survives a round. A destroyed shikigami
    // is a creature he sent out and lost; a destroyed CORE is an organ of his
    // own body, and a stock is a fresh body. Carrying two dead cores into round
    // two would mean losing one round loses the match, which no other character
    // in the game suffers and which the permanence rule was never about.
    //
    // The plain `res.hp = s.hp` line above wrote to the ACTIVE core only, which
    // is why this cannot be left to it.
    if (this.cores) {
      resetCores(this);
      this.model.setStance?.(this.stance);
    }
    this.swapWheel = null;
    this._pendingCore = null;
    this.allCoresT = 0;
    this.allCoresMult = 1;
    this.model.setAllCores?.(false);
    // THE CURSE STABLE is reset by CurseSystem.resetRound; only the input
    // latch lives here.
    this.reabsorbHeld = 0;
    this.model.setStable?.(1);
    // ADAPTATION is round-scoped like every other combat resource here. (The
    // ritual itself is not — `ritualUsed` survives, so it stays once a MATCH.)
    this.adapt?.reset();
    this.chargeDir = null;
    this.chargeCD = 0;
    // JACKPOT is round-scoped like every other combat resource. (There was a
    // `domainSpent` latch here that made Idle Death Gamble once per MATCH; no
    // domain is once per match any more, so it is gone.)
    if (this.jackpot) this.model.setJackpot?.(false);
    this.jackpot = null;
    this.shutterT = 0;
    this.shutterHits = 0;
    this.counterT = 0;
    // SUKUNA: `fingers` is NOT reset — see the constructor. Only the in-flight
    // charge is, because a round boundary is not a release.
    this.fireT = 0;
    this.blossomT = 0;
    this.blossomHits = 0;
    // TOJI: the arsenal resets to his default tool between stocks, and
    // ASSASSINATION comes back READY — it is not a meter, so there is nothing
    // for a round boundary to take away.
    if (this.cfg.arsenal) this.weapon = this.cfg.arsenal.default;
    this.arsenal = null;
    this.swapT = 0;
    this.assassinCD = 0;
    this.assassinPhase = null;
    this.assassinHit = 0;
    this.nullifyCD = 0;
    this.ctSealT = 0;
    this.soulCut = null;
    this.domainLock = null;
    // HANAMI: the terrain reading is rebuilt from wherever he respawns
    this.terrain = null;
    this.terrainRaw = null;
    this.terrainSettle = 0;
    this.floraRate = 0;
    this.floraSlow = 1;
    // KUROURUSHI: Gluttony and the growth it bought are round-scoped, like
    // adaptation and Jackpot. The systems clear their own side (swarm.js
    // resetRound), and these are the fighter's half of the same reset.
    this.gluttony = 0;
    this.growthStage = 0;
    this.growthHpBonus = 0;
    this.melt = null;
    this._mawT = 0;
    this._wingT = 0;
    this.model.setGrowth?.(1);
    this.model.setStage?.(0);
    this.model.setMaw?.(0);
    this.model.setWings?.(0);
    // CHOSO / NOBARA: both second resources are round-scoped, exactly like
    // Gluttony, adaptation and Jackpot. Essence in particular has to reset —
    // it is a piece of the opponent, and the round boundary put them back
    // together. The nail count is cleared by the effect dispatcher's own
    // round clear; this is only the fighter's half.
    this.blood = this.cfg.blood ? (this.cfg.blood.start ?? 0) : 0;
    this.essence = this.cfg.essence ? (this.cfg.essence.start ?? 0) : 0;
    this.nailCount = 0;
    if (this.buffs.redScale > 0) this.model.setRedScale?.(false);
    this.buffs.redScale = 0;
    this.buffs.bfCharge = 0;
    this.events.length = 0;
    this.model.resetSprings();
    this.setState('intro', {});
    this.anim.play('idle', { fade: 0.2, restart: true });
  }

  // ---- JACKPOT kit routing -------------------------------------------------
  // Hakari's Jackpot form is a different MOVESET, not a stat buff. Anything
  // declared in `jackpotKit` replaces the matching base slot while the window
  // holds; anything absent (his heavy, his guard) falls through unchanged.
  // Nobody else on the roster has a jackpotKit, so nobody else changes.
  get inJackpot() { return !!this.jackpot && this.jackpot.t > 0; }

  // ---- TOJI: THE ARSENAL ---------------------------------------------------
  // The equipped tool's definition, or null for everyone else. This is the one
  // lookup the whole feature hangs off — the weapon supplies ct1 and ct2, the
  // clip suffix and the HUD strings, so "each weapon completely changes his
  // CT1 and CT2" is one line in `_def` rather than a branch per move.
  get equipped() {
    const a = this.cfg.arsenal;
    return a ? (a.weapons[this.weapon] || a.weapons[a.default]) : null;
  }

  // ---- PANDA: THE ACTIVE STANCE --------------------------------------------
  // The one lookup the whole feature hangs off, exactly as `equipped` is for
  // Toji's arsenal — except that where a weapon owns ct1/ct2 and nothing else,
  // a CORE owns the movement stats, the whole punch string, the heavy, both
  // techniques, the guard quality, the dash i-frames and the clip set. That
  // difference is the difference between a character with four weapons and
  // three characters sharing a health system.
  //
  // Returns null for everybody else, and every consumer below is written as
  // `stance?.x ?? cfg.x`, so the entire existing roster is untouched.
  get stanceDef() {
    const st = this.cfg.stances;
    return st ? (st[this.stance] || st[this.cfg.cores.order[0]]) : null;
  }
  // Movement and damage stats, stance-merged. `_locomote` and the jump branch
  // read THIS rather than `cfg.stats`, which is what makes Gorilla genuinely
  // slow and the Triceratops genuinely fast rather than differently-animated.
  get stats() {
    const s = this.stanceDef?.stats;
    return s ? { ...this.cfg.stats, ...s } : this.cfg.stats;
  }
  // One helper for the handful of scalar tuning fields a stance may override
  // (guard quality, dash i-frames). Falling back to the config keeps every
  // existing character reading exactly the value they read before.
  _tune(key) {
    const s = this.stanceDef;
    return (s && s[key] !== undefined) ? s[key] : this.cfg[key];
  }

  _def(slot) {
    // The weapon owns ct1/ct2 and NOTHING ELSE: his punch string, his heavy,
    // his guard and his special are constant across all four, so they fall
    // through to the base config exactly as they do for every other character.
    if ((slot === 'ct1' || slot === 'ct2') && this.equipped) return this.equipped[slot];
    const jk = this.inJackpot && this.cfg.jackpotKit;
    if (jk && jk[slot]) return jk[slot];
    // A CORE owns ct1, ct2 and the heavy. The SPECIAL is deliberately absent
    // from that list: the swap is the same button in every stance and has to
    // be, or a player in Gorilla could not get out of Gorilla.
    const st = this.stanceDef;
    if (st && (slot === 'ct1' || slot === 'ct2' || slot === 'heavy')) return st[slot];
    return this.cfg[slot];
  }
  _punchSet() {
    if (this.inJackpot && this.cfg.jackpotKit?.punches) return this.cfg.jackpotKit.punches;
    if (this.buffs.sukuna > 0 && this.cfg.sukunaPunches) return this.cfg.sukunaPunches;
    return this.stanceDef?.punches || this.cfg.punches;
  }

  // ---- HEAVENLY RESTRICTION 天与呪縛 ---------------------------------------
  // One flag, read everywhere the cursed-energy economy is. It is a POSITIVE
  // declaration on the config rather than "his numbers happen to be zero",
  // because Mahoraga's bar also sits at zero and the two are different things:
  // Mahoraga is a shikigami with no cursed-energy SYSTEM, Toji is a human being
  // whose body has none. Cleave, for one, needs to tell them apart.
  get noCE() { return !!this.cfg.noCursedEnergy; }

  get charged() {
    // He can never reach the gate, so nothing gated on `charged` — the ultimate
    // button, Gojo's charged Blue, Barrier Break, the MAX CE badge — can ever
    // fire for him. That is the whole point and it is enforced here rather than
    // at each of those sites.
    if (this.noCE) return false;
    return this.res.maxCE >= 100 && this.res.curCE >= this.res.maxCE - 0.01;
  }
  // The ultimate gate. Normally that is `charged` — MAX_CE at 100 AND a full
  // bar. A domain may declare `castThreshold` to open earlier: Megumi's
  // Chimera Shadow Garden is INCOMPLETE, so it is priced below a finished
  // domain and fires at a high-but-reachable fraction of the bar instead of
  // the full gate. Everything that used to test `charged` for the ultimate
  // tests this instead, so the two never drift apart.
  // ASSASSINATION's gate. A cooldown, not a meter — READY on frame one of the
  // round, which is what makes him the only fighter who is dangerous at 0
  // seconds. Returns false for everyone else, so the D-pad Right path is
  // unchanged for the whole existing roster.
  get assassinReady() {
    return this.cfg.ultimate?.kind === 'cooldown' && this.assassinCD <= 0 && !this.assassinPhase;
  }

  get ultReady() {
    if (this.noCE) return false;   // no bar, so no gate — see `assassinReady`
    // HIGURUMA: `castThresholdOverride` is the same dial, moved at runtime by
    // the evidence Judgeman files (combat/judgeman.js gainEvidence). At zero
    // evidence it is exactly 1 and he pays the standard gate; at full evidence
    // it drops to his config's `gateAtFull`. Nothing else on the roster sets
    // it, so nothing else changed.
    const th = this.castThresholdOverride ?? this.cfg.domain?.castThreshold;
    if (th == null) return this.charged;
    const want = 100 * th;
    return this.res.maxCE >= want && this.res.curCE >= want - 0.01;
  }
  // `instantKO` is the shared category's record of a kill that ignored the
  // health bar (combat/instantko.js). It is checked HERE so that no amount of
  // healing after the fact can argue with it — which is precisely the Hakari
  // ruling: Jackpot makes him unkillable by DAMAGE, and an execution is not
  // damage. Nothing sets this except that module.
  get alive() {
    if (this.instantKO) return false;
    // PANDA: dead means EVERY core is gone. A fighter whose active core just
    // hit zero is not dead — he is one frame away from `_coreCheck` swapping
    // him into a surviving one, and if `alive` said otherwise the match would
    // reap him in the gap. This is the single most load-bearing line in the
    // multi-pool health system.
    if (this.cores) return this.cores.some(c => c.hp > 0);
    return this.res.hp > 0;
  }
  get speedMult() {
    let m = 1;
    if (this.buffs.overtime > 0) m *= this.cfg.ct2.speedMult || 1;
    if (this.buffs.voidDebuff > 0) m *= 0.72;
    if (this.heldSword) m *= this.cfg.domain?.swords?.carrySpeedMult ?? 1.2;
    // the Executioner's Sword is enormous — carrying it is barely a bonus
    if (this.execSword) m *= this.cfg.domain?.sentencing?.swordCarrySpeedMult ?? 1;
    if (this.buffs.sukuna > 0) m *= this.cfg.ultimate.speedMult || 1;
    // MAXIMUM PROJECTION — the clip-playback half. The frame-data half is in
    // _applyGrowth, and both read the same config number so they cannot drift.
    if (this.maxProjT > 0) m *= this.cfg.ultimate?.speedMult || 1;
    // FLOWING RED SCALE: the zoner becomes a rushdown character, and the speed
    // half is most of why. Read off the special so the config owns the number.
    if (this.buffs.redScale > 0) m *= this.cfg.special?.speedMult || 1;
    if (this.buffs.domainHaste > 0) m *= this.domainHasteMult;
    // KUROURUSHI: bigger is slower. The cost half of growth.
    const gl = this.cfg.gluttony;
    if (gl && this.growthStage > 0) m *= 1 + this.growthStage * gl.perStage.speed;
    // HANAMI'S ROOT FIELD: standing in someone else's forest slows you down.
    // The canon Flower Field is a sapping calm; this is what a fighting game
    // can do with that, and it is what makes the field a wall rather than a
    // decoration.
    if (this.floraSlow !== 1) m *= this.floraSlow;
    // SLEEP 眠れ. NOT a stun — they keep every input, they are just wading.
    // Deliberately on `speedMult` rather than on a state, because that is the
    // difference between Inumaki's soft lock and Naoya's freeze: one of them
    // takes your speed and the other one takes your body.
    if (this.sleepT > 0) m *= this.sleepMult;
    return m;
  }
  // multiplier on damage TAKEN: Soul Wound (Mahito CT1) and max burn stacks
  get incomingMult() {
    let m = 1;
    if (this.buffs.soulWound > 0) m *= this.soulWoundMult || 1.3;
    if (this.burn.stacks >= BURN.maxStacks) m *= BURN.vulnMult;
    return m;
  }
  get dmgMult() {
    // `this.stats` rather than `this.cfg.stats`: Panda's damage scale is a
    // property of the CORE he is currently in (1.00 / 1.30 / 0.80), and it has
    // to multiply everything he throws rather than being written into each of
    // three punch strings twice. Identical to `cfg.stats` for everyone else.
    let m = this.stats.damageScale;
    // THREE CORES, ONE BODY scales with how many cores are still alive, fixed
    // at cast time (see the effect handler) so that losing a core mid-ultimate
    // does not retune the window the player already paid a bar for.
    if (this.allCoresT > 0) m *= this.allCoresMult;
    // KUROURUSHI: every growth stage is a flat damage step
    const gl = this.cfg.gluttony;
    if (gl && this.growthStage > 0) m *= 1 + this.growthStage * gl.perStage.dmg;
    // CHARGE, THE DAMAGE HALF. On `dmgMult` rather than per move, so it covers
    // the staff string, the heavy, both techniques, Arc Dash's passes and every
    // future thing he ever gets, and cannot be forgotten at a damage site.
    if (this.cfg.charge) m *= chargeDmg(this);
    if (this.buffs.overtime > 0) m *= this.cfg.ct2.dmgMult || 1;
    if (this.buffs.voidDebuff > 0) m *= 0.85;
    if (this.buffs.resolve > 0) m *= this.cfg.resolve?.dmgMult || 1;
    if (this.buffs.sukuna > 0) m *= this.cfg.ultimate.dmgMult || 1;
    // FLOWING RED SCALE — the damage half. It multiplies EVERYTHING he throws,
    // which is deliberate: the point of the buff is that the whole character
    // changes gear, not that one button gets better.
    if (this.buffs.redScale > 0) m *= this.cfg.special?.dmgMult || 1;
    // NOBARA — the window a landed Black Flash opens. Small and short; the
    // real payout is the Essence.
    if (this.buffs.bfCharge > 0) m *= this.cfg.blackFlash?.bonus?.dmgMult || 1;
    if (this.bfChain > 0) m *= 1 + this.bfChain * (this.cfg.blackFlash?.chainDmg ?? 0.06);
    // SOUL CUT (Toji, Split Soul Katana CT2): a lingering cut to the OUTPUT of
    // whatever it hit. On dmgMult rather than on incomingMult on purpose — it
    // makes them weaker, it does not make them softer.
    if (this.soulCut && this.soulCut.t > 0) m *= this.soulCut.mult;
    // GET TWISTED 捻れ. Same shape as Soul Cut above and for the same reason:
    // the word disfigures the arm they punch with, so it makes them WEAKER,
    // not softer. It is on `dmgMult` so it covers their whole kit rather than
    // one button, and it cannot be forgotten at a damage site.
    if (this.twisted && this.twisted.t > 0) m *= this.twisted.mult;
    return m;
  }
  get busy() {
    return !['idle', 'walk', 'run', 'dash', 'jump', 'fall'].includes(this.state);
  }
  get airborne() { return !this.grounded; }
  // The radius he is actually confined to right now: the arena, or a standing
  // domain's smaller inner world if one is up.
  get boundRadius() { return Math.min(this.arenaRadius, this.domainRadius ?? Infinity); }

  emit(type, data) { this.events.push({ type, ...data }); }

  // ---- resources ----------------------------------------------------------
  gainMaxCE(base) {
    const g = base * this.backlashGrowthMult * (this.backlash > 0 ? 0.5 : 1);
    this.res.maxCE = Math.min(100, this.res.maxCE + g);
    this.res.curCE = this.res.maxCE; // landing punches refills to the new max
  }
  spendCE(cost) {
    // HEAVENLY RESTRICTION: there is no bar to spend from and nothing in his
    // kit costs anything, so every request succeeds. Handled at the same single
    // choke point as Jackpot rather than by writing `cost: 0` on each of his
    // moves — a cost of zero would still be a cost, and a future system that
    // charges a fighter for something would silently start charging him.
    if (this.noCE) return true;
    // INFINITE CURSED ENERGY: during Jackpot nothing costs anything. Routed
    // through the single choke point every technique already goes through, so
    // there is no move that can accidentally still charge him.
    if (this.inJackpot) return true;
    // MYTHICAL BEAST AMBER, same ruling and the same choke point: while the
    // window holds his cursed energy costs drop to nothing, because the
    // technique IS the conversion of cursed energy into electricity and the
    // limiter on it is off.
    if (this.amberT > 0 && this.cfg.ultimate?.ceFree) return true;
    if (this.res.curCE < cost) return false;
    this.res.curCE -= cost;
    return true;
  }
  consumeFullBar() {
    this.res.curCE = 0;
    this.res.maxCE = this.cfg.stats.startMaxCE;
  }

  // ---- state helpers ------------------------------------------------------
  setState(state, opts = {}) {
    this.state = state;
    this.f = 0;
    if (opts.move !== undefined) this.move = opts.move;
    if (opts.clip) this.play(opts.clip, opts);
  }
  play(clip, opts = {}) {
    this.anim.play(this._clip(clip), { fade: opts.fade ?? 0.09, speed: (opts.speed ?? 1) * this.speedMult, restart: opts.restart ?? true });
  }
  // carrying a domain katana swaps the run cycle for the sword-carry run
  _clip(name) {
    if (name === 'run' && this.heldSword && this.anim.clips.has('swordRun')) return 'swordRun';
    // HIGURUMA: the Executioner's Sword replaces the whole locomotion set, not
    // just the run. The posture change is half the character — slumped and
    // reluctant becomes upright and economical the moment he is holding it —
    // and that has to survive standing still and walking, not only sprinting.
    if (this.execSword) {
      const swap = { idle: 'swordIdle', walk: 'swordWalk', run: 'swordRun' }[name];
      if (swap && this.anim.clips.has(swap)) return swap;
    }
    // TOJI: each tool has its own neutral stance. Built by string from the
    // weapon's `clipSuffix` (idleCloud / idleSpear / idleSoul / idleChain), so
    // adding a fifth weapon later means adding clips and nothing else. Falls
    // straight through if the clip is absent, which is what makes a
    // half-authored weapon degrade to the shared idle instead of throwing.
    if (name === 'idle' && this.equipped) {
      const s = 'idle' + this.equipped.clipSuffix;
      if (this.anim.clips.has(s)) return s;
    }
    // KASHIMO: from tier 2 upward the neutral cycles are replaced by their
    // COILED versions — lower, wider, staff up across the chest. The point is
    // that the opponent reads his tier from his POSTURE before they read it off
    // the arcs, which is what "readable from across the arena" has to mean when
    // the arcs are two centimetres of line geometry at fighting distance.
    if (this.cfg.charge && this.chargeTier >= 2) {
      const swap = { idle: 'idleCharged', run: 'runCharged' }[name];
      if (swap && this.anim.clips.has(swap)) return swap;
    }
    // INUMAKI: ONE IDLE PER THROAT TIER. Same mechanism Kashimo's coiled
    // cycles use two blocks up, and for the same reason: the OPPONENT has to
    // be able to read his gauge off his posture from across the arena. At
    // SILENCED the idle is not a fighting stance at all — he is folded over
    // his own throat — and that is the tell that says "come and collect".
    if (this.cfg.throat && name === 'idle') {
      const swap = ['idle', 'idleStrained', 'idleRaw', 'idleSilenced'][this.throatTier] ?? 'idle';
      if (swap !== 'idle' && this.anim.clips.has(swap)) return swap;
    }
    // PANDA: THE WHOLE ANIMATION SET IS PER-STANCE. Built by string from the
    // core's `clipSuffix` (''/Gor/Tri), exactly the way Toji's per-weapon idles
    // are — and falling straight through when a clip is absent is what makes a
    // half-authored stance degrade to the shared clip instead of throwing.
    // The balanced core's suffix is the empty string, so it IS the base set and
    // costs no lookups.
    const sfx = this.stanceDef?.clipSuffix;
    if (sfx) {
      const s = name + sfx;
      if (this.anim.clips.has(s)) return s;
    }
    return name;
  }

  // ---- HIGURUMA: the two sword moves --------------------------------------
  // His entire moveset while armed. `kind` is 'slash' (RB — Judgment Slash) or
  // 'execution' (RT — the committed thrust that starts the duel). They cost no
  // cursed energy: the bar was spent opening the courtroom.
  startExecMove(kind, ctx) {
    const def = this.cfg.domain?.sentencing?.[kind === 'slash' ? 'slash' : 'execution'];
    if (!def) return false;
    if (kind === 'execution' && !ctx.domains.canExecute(this)) {
      // ONE ATTEMPT PER DOMAIN. Refused with a line rather than swallowed, so
      // the rule reads as a rule.
      this.emit('execSpent');
      return false;
    }
    const move = { ...def, kind: 'ct', slot: kind === 'slash' ? 'swordSlash' : 'swordExec', isCT: true };
    this.setState('ct', { move });
    this._syncMoveAnim(move, def.clip);
    const fwd = this.forward();
    const step = def.step ?? 2.0;
    this.vel.x += fwd.x * step;
    this.vel.z += fwd.z * step;
    this.emit(kind === 'slash' ? 'judgmentSlash' : 'executionSwing');
    return true;
  }

  startPunch(index) {
    this.punchIndex = index;
    // Sukuna surfaced: Dismantle slashes. Jackpot: the five-hit flurry.
    const set = this._punchSet();
    const def = set[index];
    const clip = def.clip || 'punch' + (index + 1);
    this.punchQueued = false;
    const move = this._applyGrowth({ ...def, kind: 'punch', index });
    this._applyRedScale(move);
    this.setState('attack', { move });
    this._syncMoveAnim(def, clip);
    // step into the punch
    const fwd = this.forward();
    const step = def.step ?? 1.6;
    this.vel.x += fwd.x * step;
    this.vel.z += fwd.z * step;
  }

  // HEAVY: the committed knockdown swing. Not part of the punch string — it
  // never chains, it costs stamina, and its `type: 'knockdown'` is what puts
  // the opponent on the floor (see applyHit).
  startHeavy(ctx) {
    const def = this.cfg.heavy;
    if (!def) return false;
    if (def.staminaCost && this.res.stamina < def.staminaCost) { this.emit('noStamina'); return false; }
    if (def.staminaCost) this.res.stamina -= def.staminaCost;
    const clip = this.anim.clips.has(def.clip || 'heavy') ? (def.clip || 'heavy') : 'punch3';
    this.punchQueued = false;
    const hmove = this._applyRedScale(this._applyGrowth({ ...def, kind: 'heavy' }));
    this.setState('attack', { move: hmove, clip });
    this._syncMoveAnim(def, clip);
    const fwd = this.forward();
    const step = def.step ?? 2.4;
    this.vel.x += fwd.x * step;
    this.vel.z += fwd.z * step;
    this.emit('heavyStart', { move: def });
    return true;
  }

  // Quick-rise. Called from the launched/knockdown states with the jump press;
  // returns true when it consumed the press (teched or burned the attempt).
  _tryTech(input) {
    if (!input?.jumpP || this.techLock) return false;
    let ok;
    if (this.state === 'launched') ok = this.vel.y <= 0 && this.pos.y <= TECH_HEIGHT;
    else ok = this.f <= TECH_KD_FRAMES; // knockdown grace
    if (!ok) { this.techLock = true; return true; } // too early: attempt spent
    this.pos.y = 0;
    this.vel.set(this.vel.x * 0.25, 0, this.vel.z * 0.25);
    this.grounded = true;
    this.juggle = 0;
    this.otgUsed = false;
    this.hitstun = 0;
    this.iFrames = Math.max(this.iFrames, 26);
    this.setState('techRise', { clip: 'techRise' });
    this.emit('quickRise');
    return true;
  }

  _syncMoveAnim(def, clipName) {
    const clip = this.anim.clips.get(clipName);
    if (!clip) return;
    const moveDur = (def.startup + def.active + def.recovery) / 60;
    this.play(clipName, { speed: (clip.dur / moveDur), restart: true });
  }

  startCT(slot, ctx) {
    const def = this._def(slot);
    if (!def) return false;
    // what this fighter leans on, for Confiscation to take away
    this.slotUse[slot] = (this.slotUse[slot] ?? 0) + 1;

    // ---- NOBARA: RB IS TWO MOVES -----------------------------------------
    // Throw a nail, until the cap is reached — at which point the button stops
    // throwing and becomes the DETONATOR, which is free and fast. That is the
    // "follow-up input" half of Hairpin, and putting it on the same button is
    // what makes the cap read as a decision ("do I want a fourth nail out, or
    // do I want the three I have to go off now") instead of as a refusal.
    if (def.effect === 'nobara_hairpin' && this.nailCount >= (def.maxNails ?? 4)) {
      const det = {
        name: def.name + ' (detonate)', kind: 'ct', slot, isCT: true,
        effect: 'nobara_detonate', startup: 6, active: 1, recovery: 16,
        clip: def.detonateClip ?? 'ct1'
      };
      this.setState('ct', { move: det });
      this._syncMoveAnim(det, det.clip);
      this.emit('ctStart', { move: det });
      return true;
    }

    // ---- INUMAKI: RB AND RT ARE WHATEVER IS BOUND TO THEM ----------------
    // Neither slot has frame data of its own — see the note in
    // characters/inumaki.js. Every number comes from the COMMAND currently
    // bound to the button, so the wheel is a real decision and not a skin, and
    // so retuning a command retunes it everywhere at once.
    //
    // Two refusals, both BEFORE anything is spent and both with their own
    // line, because "nothing happened" is the worst thing a button can report:
    //   SILENCED   he physically cannot. This is the crisis state and it has
    //              to be legible from the button as well as from the HUD.
    //   TOO DEAR   the word would cost more throat than he has left before
    //              SILENCED. That is what makes BLAST AWAY a decision rather
    //              than a habit: at 60% strain it is simply not available.
    if (def.command) {
      const cmd = boundCommand(this, slot);
      if (!cmd) return false;
      if (!canSpeak(this)) { this.emit('silenced'); return false; }
      if (!affordable(this, cmd)) { this.emit('throatTooHigh', { cmd }); return false; }
      const move = {
        ...def, kind: 'ct', slot, isCT: true,
        name: cmd.name, jpName: cmd.jp,
        // THE UTTERANCE WINDOW *IS* THE STARTUP. The effect fires on the last
        // frame of it (see the `ct` case), so anything that takes his state
        // before then cancels the command for free — which is the whole
        // counterplay and the reason it is structural rather than a check.
        startup: cmd.utter, active: 2, recovery: def.recovery,
        effect: 'inumaki_command', commandKey: cmd.key,
        clip: cmd.clip, dmg: cmd.dmg, range: cmd.range
      };
      // `utter` is non-null for exactly as long as the cast is live and has
      // not fired. Same contract `this.taunt` keeps — see `checkUtterance`.
      this.utter = { key: cmd.key, fired: false };
      this.setState('ct', { move });
      this._syncMoveAnim(move, move.clip);
      this.emit('utterStart', { cmd, slot });
      return true;
    }

    // ---- THE SECOND-RESOURCE GATES ---------------------------------------
    // Checked BEFORE the cursed energy is spent so a refusal never costs
    // anything, and reported with their own lines — "nothing happened" is the
    // most confusing thing a button can do.
    if (def.blood && this.blood < def.blood) {
      this.emit('noBlood', { need: def.blood, have: this.blood });
      return false;
    }
    if (def.minEssence != null && this.essence < def.minEssence) {
      this.emit('noEssence', { need: def.minEssence, have: this.essence });
      return false;
    }

    const wasCharged = this.charged; // must be read BEFORE the cost is paid
    if (!this.spendCE(def.cost)) { this.emit('noCE'); return false; }
    // Blood is committed on the PRESS, unlike Essence: his techniques all
    // produce their blood on the way out, so an interrupted Blood Edge has
    // already cost him the material. (Essence is committed on the activation
    // frame instead — see the Resonance channel below.)
    this.spendBlood(def.blood);
    // Gojo charged: casting Blue opens the Hollow Purple window
    if (this.cfg.id === 'gojo' && slot === 'ct2' && wasCharged) this.purpleWindow = this.cfg.purple.windowFrames;
    const move = { ...def, kind: 'ct', slot, isCT: true };
    // SUKUNA — FINGER STACKS shorten technique startup. Applied HERE rather
    // than in the effect dispatcher because startup is consumed by the state
    // machine long before any effect fires; the damage and range halves of the
    // same scaling live in effects.js (fingerDmg / fingerRange). Nobody else
    // on the roster declares `cfg.fingers`, so nobody else is touched.
    this._applyFingerStartup(move);
    this._applyGrowth(move);
    this._applyEssenceChannel(move);
    if (wasCharged && def.charged) Object.assign(move, def.charged, { chargedCast: true });
    // clip variants (Mahito's Body Weapon): rotate so it never repeats twice
    if (def.clips?.length) {
      let v;
      do { v = Math.floor(Math.random() * def.clips.length); }
      while (v === this.bwVariant && def.clips.length > 1);
      this.bwVariant = v;
      move.clip = def.clips[v];
      move.variant = v;
    }
    this.setState('ct', { move });
    this._syncMoveAnim(move, move.clip || def.clip);
    this.emit('ctStart', { move });
    return true;
  }

  // ---- SUKUNA: the Fingers, and the button they change ---------------------
  // Startup only. The floor of 4 frames exists so that no amount of stacking
  // can produce a technique that comes out before the animation's first key.
  // ---- KUROURUSHI: GROWTH APPLIED TO A MOVE --------------------------------
  // Every reach number he has grows with him. Applied where the move is
  // BUILT rather than where it is resolved, so the frame data, the effect
  // dispatcher and the debug overlay all read the same number. A no-op for
  // anyone without `cfg.gluttony`.
  _applyGrowth(move) {
    // MAXIMUM PROJECTION rides on the same hook, because this is the one place
    // every built move (the punch string, the heavy and both techniques) passes
    // through on its way to the state machine. Scaling the frame data HERE
    // rather than in the state machine means the debug overlay, the hit windows
    // and the animation speed all agree about how fast he currently is.
    //
    // "Every one of his attacks moves at frame speed" is `speedMult` applied to
    // the FRAME COUNTS, not just to the clip playback: 1.45x means a 4-frame
    // jab becomes a 3-frame jab and a 26-frame Frame Kick becomes 18. The
    // floor of 3 is there so nothing can round to an unhittable zero.
    if (this.maxProjT > 0) {
      const k = 1 / (this.cfg.ultimate?.speedMult ?? 1.45);
      if (move.startup) move.startup = Math.max(3, Math.round(move.startup * k));
      if (move.recovery) move.recovery = Math.max(3, Math.round(move.recovery * k));
    }
    // ---- CHARGE, THE FRAME-DATA HALF ---------------------------------------
    // Same hook, same reason: this is the one place every built move passes
    // through, so scaling here means the debug overlay, the hit windows and the
    // animation speed all agree about how fast he currently is.
    //
    // TWO DIFFERENT CURVES, DELIBERATELY. `chargeSpeed` (up to 1.24) is applied
    // in full to the frame counts — a 20-frame Discharge Strike comes out in 16
    // at tier 3. But `chargeSize` (up to 1.46) is DAMPED TO 35% on `reach`,
    // because a 1.46x jab on a character who already has the longest normals in
    // the game is a 2.7 m poke and the fight stops having a neutral in it. The
    // full multiplier still applies to `radius` — the AoE of the techniques —
    // where "his electric attacks get bigger" is what the brief actually asks
    // for and where it costs nobody the ability to walk up to him.
    if (this.cfg.charge) {
      const k = 1 / chargeSpeed(this);
      if (move.startup) move.startup = Math.max(3, Math.round(move.startup * k));
      if (move.recovery) move.recovery = Math.max(3, Math.round(move.recovery * k));
      const sz = chargeSize(this);
      if (move.reach) move.reach *= 1 + (sz - 1) * 0.35;
      if (move.radius) move.radius *= sz;
      if (move.burstRadius) move.burstRadius *= sz;
    }
    if (!this.cfg.gluttony || !this.growthStage) return move;
    const k = this.reachScale;
    if (move.reach) move.reach *= k;
    if (move.radius) move.radius *= k;
    if (move.arc) move.arc = Math.min(Math.PI * 1.6, move.arc * (1 + (k - 1) * 0.5));
    return move;
  }

  // ---- NOBARA: THE RESONANCE CHANNEL --------------------------------------
  // The channel scales with how much Essence is about to go into it, so the
  // tell is always proportional to the threat: a chip Resonance is 26 frames
  // and a round-ending one is 46. The startup is the channel — she is standing
  // still with both hands full for the whole of it, and the effect only fires
  // on the activation frame, so anything that knocks her out of the `ct` state
  // cancels it and she keeps her Essence.
  //
  // A no-op for anyone whose move does not declare `channelPerEssence`.
  _applyEssenceChannel(move) {
    if (!this.cfg.essence || move.channelPerEssence == null) return move;
    move.startup = Math.round(
      (move.channelBase ?? 24) + this.essence * move.channelPerEssence);
    return move;
  }

  // ---- CHOSO: FLOWING RED SCALE APPLIED TO A MOVE --------------------------
  // Armour on his NORMALS only — the punch string and the heavy. Applied where
  // the move is built, like `_applyGrowth`, so the frame data, the state
  // machine and the debug overlay all read the same number. Deliberately NOT
  // applied in startCT: Red Scale does not make Piercing Blood safe, and a
  // buff that armoured a 28-frame startup would erase the counterplay to his
  // biggest hit. A no-op for anyone without the buff up.
  _applyRedScale(move) {
    if (this.buffs.redScale <= 0) return move;
    const a = this.cfg.special?.armorFrames ?? 0;
    if (a > 0) move.armorFrames = Math.max(move.armorFrames ?? 0, a);
    return move;
  }

  _applyFingerStartup(move) {
    const cfg = this.cfg.fingers;
    if (!cfg || this.fingers <= 0 || !move.startup) return move;
    const k = Math.pow(1 - (cfg.startupPerStack ?? 0.06), this.fingers);
    move.startup = Math.max(4, Math.round(move.startup * k));
    return move;
  }
  get fingerMax() { return this.cfg.fingers?.count ?? 0; }
  // Fire Arrow is gated on stacks, and only exists at all for a config that
  // declares it — so RT stays a plain Cleave button until he has earned it.
  get fireArrowReady() {
    const fa = this.cfg.fireArrow;
    return !!fa && this.fingers >= (this.cfg.fingers?.fireArrowAt ?? 2);
  }

  // RT pressed with Fire Arrow unlocked: an 8-frame stance in which releasing
  // gives Cleave and holding commits to the charge. He cannot act out of it,
  // which is the price of the unlock.
  _startFireStance() {
    this.setState('fireStance', {});
    this.fireT = 0;
    this.play(this.cfg.fireArrow.chargeClip, { fade: 0.06, speed: 1 });
  }

  _releaseFireArrow(ctx) {
    const fa = this.cfg.fireArrow;
    // too short to have been a charge, or the meter is not there: it fizzles
    // into the cancel recovery rather than firing something weak
    if (this.fireT < (fa.minCharge ?? 24) || !this.spendCE(fa.cost)) {
      this._cancelFireArrow(this.fireT < (fa.minCharge ?? 24) ? 'fizzle' : 'noCE');
      return;
    }
    const move = {
      ...fa, kind: 'ct', slot: 'ct2', isCT: true, effect: fa.effect,
      startup: fa.startup, active: fa.active, recovery: fa.recovery, clip: fa.clip
    };
    this._applyFingerStartup(move);
    this.setState('ct', { move });
    this._syncMoveAnim(move, fa.clip);
    this.emit('fireArrowRelease');
  }

  _cancelFireArrow(reason) {
    const fa = this.cfg.fireArrow;
    this.fireT = 0;
    // no cursed energy was ever spent on the charge, so a cancel costs only
    // these frames — that is what makes starting one a mind game
    // no `effect`, and startup 0 (the state's frame counter starts at 1, so
    // the `f === startup` activation test can never fire) — this is recovery
    // frames and nothing else
    this.setState('ct', {
      move: {
        name: 'Fire Arrow (cancelled)', kind: 'ct', slot: 'ct2',
        startup: 0, active: 0, recovery: fa.cancelRecovery ?? 22, clip: 'ct2'
      }
    });
    this.play('ct2', { fade: 0.10, speed: 1.6 });
    this.emit('fireArrowCancel', { reason });
  }

  startPurple(ctx) {
    const def = { ...this.cfg.purple, kind: 'ct', isCT: true, slot: 'purple' };
    this.consumeFullBar();
    this.purpleWindow = 0;
    this.setState('ct', { move: def });
    this._syncMoveAnim(def, def.clip);
    this.emit('purpleStart');
  }

  startUltBurst(ctx) {
    const u = this.cfg.ultimate;
    const def = {
      ...u, // entity-driven ultimates (Brotherhood) read their tuning off the move
      name: u.name, kind: 'ct', isCT: true, slot: 'ult', effect: u.effect,
      startup: u.startup, active: u.active ?? u.hits * 14, recovery: u.recovery ?? 26,
      dmg: u.dmgPerHit, reach: u.reach, arc: u.arc, hits: u.hits, clip: u.clip
    };
    this.consumeFullBar();
    this.setState('ct', { move: def });
    this._syncMoveAnim(def, u.clip);
    this.emit('ultBurst', { move: def });
  }

  // in-domain: the held blade replaces punches with a committed lunging slash
  startSwordSwing(ctx) {
    const sw = this.cfg.domain.swords.swing;
    const move = { ...sw, kind: 'ct', slot: 'swordSwing' };
    this.setState('ct', { move });
    this._syncMoveAnim(move, sw.clip);
    this.emit('swordSwing');
  }

  // ---- MEGUMI: summoning off a bound slot ---------------------------------
  // The two technique slots are not techniques — they are whatever the wheel
  // last bound to them. Cost, frame data and the summon gesture all come from
  // the shikigami, which is what makes "Dogs + Nue" and "Toad + Serpent" play
  // like two different characters rather than two damage numbers.
  startShikigami(slot, ctx) {
    const sys = ctx.match.shikigami;
    const key = sys.bindingOf(this, slot);
    const def = this.cfg.shikigami.defs[key];
    if (!def) { this.emit('noCE'); return false; }
    const blocked = sys.blockReason(this, key);
    if (blocked) { this.emit('shikiBlocked', { text: blocked }); return false; }
    const free = !!sys._gardenFor(this);
    if (!free && !this.spendCE(def.cost)) { this.emit('noCE'); return false; }
    const move = {
      name: def.name, kind: 'ct', slot, isCT: true, effect: 'megumi_shikigami',
      shikigami: key, startup: def.startup, active: def.active, recovery: def.recovery,
      clip: def.clip
    };
    // inside the garden the summon is INSTANT as well as free — the startup
    // collapses to a couple of frames, which is what makes it feel unlimited
    if (free) { move.startup = 3; move.recovery = Math.round(def.recovery * 0.45); }
    this.setState('ct', { move });
    this._syncMoveAnim(move, move.clip);
    this.emit('ctStart', { move });
    return true;
  }

  // ---- GETO: summoning off the stable -------------------------------------
  // Mirrors startShikigami in shape — the button is a marker and the real cost
  // and frame data come from the curse — but the SELECTION rule is the thing
  // that makes it Geto rather than Megumi:
  //
  //   CT1 (LOW GRADE)      picks the FIRST AVAILABLE piece of chaff off the
  //                        low-grade list. There is no binding and no wheel for
  //                        these: they are interchangeable, they are supposed
  //                        to be pressed without thinking, and asking a player
  //                        to choose which identical monster to throw away
  //                        would be a worse game.
  //   CT2 (SPECIAL GRADE)  summons whatever the CURSE WHEEL last selected. This
  //                        one IS a choice, because the four are genuinely
  //                        different characters and only one can be out.
  startCurseSummon(slot, ctx) {
    const sys = ctx.match.curses;
    let key;
    if (slot === 'ct1') {
      // first available: not lost, not on cooldown, not already blocked
      key = sys.lowOrder(this).find(k => !sys.blockReason(this, k));
      // nothing available — report the most informative reason rather than a
      // silent nothing, which is the difference between "the game ignored me"
      // and "I understand why that did not work"
      if (!key) {
        const first = sys.lowOrder(this)[0];
        this.emit('curseBlocked', { text: sys.blockReason(this, first) || 'NO CHAFF LEFT' });
        return false;
      }
    } else {
      key = sys.selected(this);
      const blocked = key ? sys.blockReason(this, key) : 'NO CURSE SELECTED';
      if (blocked) { this.emit('curseBlocked', { text: blocked }); return false; }
    }
    const def = sys.defsFor(this)[key];
    if (!this.spendCE(def.cost)) { this.emit('noCE'); return false; }
    const base = this._def(slot);
    const move = {
      name: def.name, kind: 'ct', slot, isCT: true, effect: base.effect,
      curse: key, startup: base.startup, active: base.active,
      recovery: base.recovery, clip: base.clip
    };
    this._applyGrowth(move);
    this.setState('ct', { move });
    this._syncMoveAnim(move, move.clip);
    this.emit('ctStart', { move });
    return true;
  }

  // in-domain: quick snatch as he runs over an embedded katana — keeps his
  // momentum, so the loop stays fluid at speed
  startSwordPickup() {
    const FRAMES = 14;
    this.setState('swordPickup', {});
    const clip = this.anim.clips.get('swordPickup');
    if (clip) this.play('swordPickup', { speed: clip.dur / (FRAMES / 60) });
    this.emit('swordPickup');
  }

  // ---- THE THREE RADIAL WHEELS: TAP vs HOLD --------------------------------
  // Megumi's shikigami, Toji's arsenal and Geto's curses all present the same
  // interaction, so they all get the same one:
  //
  //   TAP B    commit the DEFAULT immediately. No radial, no slow-motion, no
  //            stick reading — the button behaves like every other button in
  //            the game and the fastest possible input is always available.
  //   HOLD B   the radial opens, preselected on that same default, and the
  //            left stick picks something else. Release commits whatever is
  //            selected.
  //
  // That split is what makes the wheels survive moving to a face button: the
  // common case (I want my usual tool) is now a tap rather than a hold-and-
  // release, and the hold is reserved for when you actually want to choose.
  //
  // DISABLED OPTIONS ARE NOT SELECTABLE, ANYWHERE. A dead shikigami and a
  // destroyed curse are excluded from `avail` at open time, the stick snaps to
  // the nearest AVAILABLE sector rather than landing on a corpse, and the
  // default falls through to the first available option. The previous
  // behaviour — let the wheel land on it and refuse at release — meant the
  // wheel could be pointed at something that was never going to work.
  _openWheel(w, sp) {
    // No options at all is possible (Geto with every curse destroyed) and must
    // not open an empty radial or commit a corpse.
    if (!w.avail.length) { this.emit('noCE'); return false; }
    // The DEFAULT: whatever is already equipped/bound if it is still available,
    // otherwise the config's stated default, otherwise the first thing left.
    const cur = w.sel >= 0 ? w.order[w.sel] : null;
    const cfgDef = this.cfg.arsenal?.default;
    w.def = (cur && w.avail.includes(cur)) ? cur
      : (cfgDef && w.avail.includes(cfgDef) ? cfgDef : w.avail[0]);
    w.sel = w.order.indexOf(w.def);
    w.open = false;                 // becomes true once the hold clears TAP_MAX
    if (w.arsenal) { this.arsenal = w; this.setState('arsenal', { clip: sp.clip }); }
    else if (w.core) { this.swapWheel = w; this.setState('coreWheel', { clip: 'idle' }); }
    else { this.wheel = w; this.setState('wheel', { clip: sp.clip }); }
    return true;
  }

  // Stick angle -> the nearest AVAILABLE sector. The sectors keep their fixed
  // positions in `order` — muscle memory depends on that and megumi.js says so
  // in as many words — so a hole in the ring is a hole, and the pick rolls past
  // it to whichever live option is nearest by angle rather than by index.
  _wheelPick(w, mv) {
    if (Math.hypot(mv.x, mv.z) <= 0.45) return w.sel;
    const n = w.order.length;
    const a = Math.atan2(mv.x, -mv.z);                 // 0 = up, clockwise
    let best = w.sel, bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (!w.avail.includes(w.order[i])) continue;
      const sa = (i / n) * Math.PI * 2;
      const d = Math.abs(((a - sa + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  // ---- TAUNTS (D-pad Left) ------------------------------------------------
  // The whole feature, on the fighter side, is this method and the `taunt`
  // state below it. Both are deliberately tiny, because the interesting work is
  // NOT here: it is in where this is called from.
  //
  // WHY THERE IS ALMOST NO GATE LIST. This is reached only from the
  // idle/walk/run/dash case of `_stateLogic`, which is downstream of every
  // early return in that method. That single placement is what makes "no taunts
  // during a cinematic" structural instead of a list somebody has to remember
  // to extend — a taunt cannot be started from `castDomain`, `voided`,
  // `simpleDomain`, `barrierBreak`, `rooted`, `transfigured`, `sentenced`,
  // `executing`, `devoured`, `frozen`, `ko`, `victory` or `intro`, because none
  // of those states reach the switch at all. Nor from `attack`, `ct`, `wheel`,
  // `arsenal`, `arsenalSwap`, `blossom`, `charge`, `ratioSweep`, `assassinate`,
  // `hitLight`, `hitHeavy`, `blockstun`, `guardBreak`, `launched`, `knockdown`,
  // `getup`, `techRise`, `block` or `jump`/`fall`, because each of those is its
  // own case.
  //
  // The three things that ARE checked here are the ones that placement cannot
  // express: the rate limit, the duel freeze (the one cinematic that leaves
  // fighters in a live state on the tick it starts), and the ritual.
  tryTaunt(ctx) {
    if (this.tauntCD > 0) return false;
    if (!this.grounded) return false;
    // The execution duel and the summon ritual both freeze the world around
    // fighters who may still be in a live state for one tick. Same belt-and-
    // braces `trySpecial` wears, for the same reason.
    if (ctx?.domains?.duelFreeze) return false;
    if (ctx?.match?.ritual?.active) return false;
    const def = pickTaunt(this.pick, this.tauntN);
    if (!def) return false;
    // A character whose clip is missing simply does not taunt. Silently, and
    // without costing them the cooldown — a half-authored taunt should look
    // like an absent feature, not a broken button.
    if (!this.anim.clips.has(def.clip)) return false;
    this.tauntN++;
    this.taunt = { def, t: 0, said: false, done: false };
    this.setState('taunt', { clip: def.clip });
    this.emit('tauntStart', { def });
    return true;
  }

  // Called from `update` EVERY frame, for every fighter, whatever state they
  // are in. This is the interruption: a taunt is alive exactly while the state
  // is `taunt`, so anything at all that changes the state — a hit, a knockdown,
  // a domain pull, a transfiguration, a KO, the round ending — cancels the
  // taunt and its bubble without that system having heard of taunts.
  _tauntCheck() {
    if (this.taunt && this.state !== 'taunt') {
      this.emit('tauntBreak', { def: this.taunt.def, completed: this.taunt.done });
      this.taunt = null;
      this.tauntCD = TAUNT_COOLDOWN;
    }
  }

  // ---- SPECIALS (B) ----------------------------------------------
  // One signature ability per character, declared as cfg.special. The shared
  // part is only the gate: cooldown + cost + the HUD slot. The bodies are
  // deliberately different kinds of interaction — a warp, a timing minigame,
  // a stored technique, a position swap, a self-buff.
  // ---- CONFISCATION -------------------------------------------------------
  // Higuruma's CT2 takes ONE of your technique buttons away for a few seconds.
  // Which one is not random: it takes whatever you have been leaning on since
  // the last seizure (`slotUse`), so it genuinely disarms the thing that is
  // killing him rather than rolling a dice and hoping.
  slotLocked(slot) { return this.lockedSlot?.slot === slot && this.lockedSlot.t > 0; }

  confiscate(duration) {
    // ---- CONFISCATION vs HEAVENLY RESTRICTION -----------------------------
    // Higuruma's technique seizes a CURSED TECHNIQUE. Toji does not have one,
    // so there is nothing on ct1 or ct2 for it to take — those buttons hold a
    // lump of metal, and a courtroom cannot confiscate the swing of a stick.
    //
    // What it CAN take is the thing that is genuinely cursed about him: the
    // INVENTORY CURSE itself, which is a cursed spirit he owns. So Confiscation
    // always seizes his SPECIAL, and the consequence is that he is locked into
    // whatever tool happens to be in his hand for the duration.
    //
    // That is a real and interesting effect rather than a shrug: it turns a
    // character whose whole identity is "I have an answer for that" into a
    // character with exactly one answer, chosen before he knew the question.
    // Getting seized while holding the Chain against a rushdown is a disaster.
    // It is also the correct counterplay hint — swap BEFORE the gavel lands.
    if (this.cfg.arsenal && this.cfg.special) {
      this.lockedSlot = { slot: 'special', t: duration };
      this.slotUse.ct1 = this.slotUse.ct2 = this.slotUse.special = 0;
      this.emit('confiscated', { slot: 'special', duration, arsenal: true });
      return 'special';
    }
    const slots = ['ct1', 'ct2'];
    if (this.cfg.special) slots.push('special');
    let best = slots[0], bv = -1;
    for (const s of slots) {
      const v = (this.slotUse[s] ?? 0) + Math.random() * 0.5;  // ties break randomly
      if (v > bv) { bv = v; best = s; }
    }
    this.lockedSlot = { slot: best, t: duration };
    for (const s of slots) this.slotUse[s] = 0;   // the ledger resets with the seizure
    this.emit('confiscated', { slot: best, duration });
    return best;
  }

  trySpecial(input, ctx) {
    const sp = this._def('special');
    if (!sp || this.specialCD > 0) return false;
    // a confiscated SPECIAL is confiscated
    if (this.slotLocked('special')) { this.emit('slotLocked', { slot: 'special' }); return false; }
    // NOTHING fires out of an execution duel. The frozen states below already
    // refuse every input; this is the belt to that pair of braces, and it is
    // specifically what stops Todo clapping out of being sentenced.
    if (ctx?.domains?.duelFreeze) return false;
    this.slotUse.special = (this.slotUse.special ?? 0) + 1;
    switch (sp.key) {
      // HAKARI — SHUTTER: a rolling door hauled up in front of him. Projectiles
      // do not pass it at all; the first melee hit that lands on it breaks it.
      // See applyHit for the intercept and fx.shutterUp for the door itself.
      case 'hakari_shutter': {
        if (this.shutterT > 0) { this.emit('noCE'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'hakari_shutter',
          startup: sp.castFrames, active: 1, recovery: 14, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        return true;
      }
      // HAKARI (Jackpot only) — GOLD RUSH: a charging shoulder that crosses
      // the arena and puts them through whatever is behind them.
      case 'hakari_goldrush': {
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'hakari_goldrush',
          startup: 5, active: 1, recovery: sp.stateFrames, clip: sp.clip, ...sp
        };
        move.startup = 5; move.active = 1; move.recovery = sp.stateFrames;
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        return true;
      }
      case 'gojo_teleport': {
        // the one special a barrier shuts off: nothing warps out of a domain
        const d = ctx.domains.state;
        if (d && d.phase === 'active' && d.caster !== this) { this.emit('warpSealed'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        this._teleport(input, ctx, sp);
        return true;
      }
      case 'nanami_ratio': {
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        // cooldown is decided by how the sweep RESOLVES (miss costs extra)
        this.ratioSweep = 0;
        this.setState('ratioSweep', { clip: sp.clip });
        this.emit('ratioStart');
        return true;
      }
      case 'yuta_copy': {
        if (!this.copySlot) { this.emit('noCE'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        this.startCopy(ctx);
        return true;
      }
      case 'todo_boogie': {
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        this._boogie(ctx, sp);
        return true;
      }
      case 'jogo_overheat': {
        // vulnerable channel: he stands venting through the whole startup —
        // getting hit cancels it (the ct state drops on any clean hit)
        if (this.buffs.overheat > 0) { this.emit('noCE'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'jogo_overheat',
          startup: sp.channelFrames, active: 1, recovery: 14, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        this.emit('overheatStart');
        return true;
      }
      case 'megumi_wheel': {
        // TAP vs HOLD — see `_openWheel`. A tap commits the default without
        // ever showing a radial; a hold opens one, preselected on that same
        // default, and the stick picks something else.
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        const sys = ctx.match.shikigami;
        const order = this.cfg.shikigami.order;
        // Preselect whatever is already in CT1 — a mis-tap then changes
        // nothing — but only if it is still alive. A binding pointing at a dead
        // shikigami must not be the thing a tap re-commits.
        const cur = sys.bindingOf(this, 'ct1');
        this._openWheel({
          sel: order.indexOf(cur), slot: 'ct1', t: 0, changed: false,
          order, avail: order.filter(k => !sys.isLost(this, k))
        }, sp);
        return true;
      }
      // ---- GETO: THE CURSE WHEEL, AND REABSORB ----------------------------
      // ONE BUTTON, TWO MOVES, decided by what is actually on the field —
      // the same shape Kurourushi's DEVOUR already uses, and for the same
      // reason: it keeps his hand off a fourth binding without ever leaving
      // the useful option unreachable.
      //
      //   nothing of his out   → the WHEEL opens (there is nothing to recall)
      //   something out + the
      //   stick pulled BACK    → REABSORB — pull the most valuable body home
      //   something out, stick
      //   anywhere else        → the WHEEL opens as normal
      //
      // Pulling back to recall is deliberate and it is the only "hold a
      // direction" input in the project: it reads as retreating, which is
      // exactly what the move is, and it means a player who does not know
      // about it can never fire it by accident while steering.
      case 'geto_wheel': {
        const sys = ctx.match.curses;
        const out = sys.aliveFor(this).length;
        const mv = input?.move ?? { x: 0, z: 0 };
        // "back" is away from the opponent, not screen-down: the fighter is
        // soft-locked, so the meaningful axis is the one the camera is on
        const pullingBack = out > 0 && (mv.z > 0.55 || (mv.z > 0.35 && Math.abs(mv.x) < 0.4));
        if (pullingBack) {
          const sp2 = this.cfg.special;
          this._setSpecialCD(sp2.cooldown);
          const move = {
            name: 'REABSORB', kind: 'ct', slot: 'special', effect: 'geto_reabsorb',
            startup: sp2.reabsorbFrames ?? 24, active: 1, recovery: 12,
            clip: sp2.reabsorbClip ?? 'reabsorb'
          };
          this.setState('ct', { move });
          this._syncMoveAnim(move, move.clip);
          this.emit('reabsorbStart');
          return true;
        }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        // open on whatever is currently selected, so a mis-tap changes nothing
        const order = this.cfg.curses.specialOrder;
        this._openWheel({
          sel: order.indexOf(sys.selected(this)), slot: 'ct2', t: 0, changed: false,
          order, avail: order.filter(k => !sys.isLost(this, k))
        }, sp);
        return true;
      }

      // ---- INUMAKI: THE COMMAND WHEEL 呪言 ---------------------------------
      // THE FIFTH RADIAL, and it reuses `_openWheel` / `_wheelPick` and the
      // shared `wheel` STATE wholesale rather than growing a fifth near
      // duplicate. What differs is only what the sectors are and what
      // confirming does, and both are read off `cfg.commands`.
      //
      // `avail` excludes any command his throat cannot currently pay for,
      // which is the one thing that is genuinely new here: the ring is also
      // the readout of what he is still allowed to say. A greyed sector is not
      // selectable, the stick rolls past it, and the default falls through to
      // the first word he can still afford — so the wheel can never land on a
      // command that would be refused at release.
      //
      // It costs NO cursed energy and NO throat. Choosing a word is not saying
      // one, and charging for the choice would make experimenting with the
      // kit expensive in the only resource that matters.
      case 'inumaki_wheel': {
        const c = this.cfg.commands;
        const avail = c.order.filter(k => affordable(this, c.defs[k]));
        if (!canSpeak(this)) { this.emit('silenced'); return false; }
        // It opens on ct2 — the heavy slot, which is the one a player is
        // usually choosing for. RB/RT switch it while the ring is held,
        // exactly as they do on Megumi's.
        this._openWheel({
          sel: c.order.indexOf(boundKey(this, 'ct2')), slot: 'ct2', t: 0, changed: false,
          order: c.order, avail, commands: true
        }, sp);
        return true;
      }

      // ---- NAOYA: PROJECTION STANCE ---------------------------------------
      // Arming the trap. Note what this branch does NOT do: it does not enter
      // a `ct` state and it does not create a hitbox anywhere. He stands still
      // with his palm out and waits, and the whole move is three timers.
      //
      // `projArmT` is the STARTUP — the window where he is standing in the
      // stance pose and the trap is NOT yet live. That is what makes it
      // baitable, and it is the reason the branch sets the arm timer here and
      // lets Fighter.update flip it to `projT` a quarter of a second later,
      // rather than arming instantly on the press.
      case 'naoya_stance': {
        if (this.projT > 0 || this.projArmT > 0) { this.emit('noCE'); return false; }
        // during MAXIMUM PROJECTION the stance is already permanently on, so
        // pressing it again is a wasted bar rather than a stacked buff
        if (this.maxProjT > 0) { this.emit('stanceRedundant'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        this.projArmT = (sp.startupFrames ?? 16) / 60;
        this.projSpent = false;
        this.setState('special', { clip: sp.clip });
        this.emit('stanceStart');
        return true;
      }

      // ---- PANDA: CORE SWAP 核転換 -----------------------------------------
      // THE FOURTH RADIAL, and it reuses `_openWheel` / `_wheelPick` wholesale
      // rather than growing a fourth near-duplicate. Tap commits the NEXT
      // surviving core (a cycle, which is what the brief asks for and what a
      // tap of a cycle button should do); hold opens the ring preselected on
      // that same next core and the stick picks a different one.
      //
      // `avail` excludes DESTROYED cores, which matters more here than in any
      // of the other three wheels: a destroyed core is gone for the match, and
      // `_wheelPick` snapping past a hole by angle means the ring keeps fixed
      // sector positions and a Panda down to two cores still has the muscle
      // memory he built with three.
      //
      // He is refused outright when he has nowhere to go — one core left is
      // not a choice — and the refusal says so rather than eating the press.
      case 'panda_swap': {
        const order = this.cfg.cores.order;
        const avail = order.filter(k => {
          const c = this.cores[coreIndexOf(this, k)];
          return c && c.alive && c.hp > 0 && k !== this.stance;
        });
        if (!avail.length) { this.emit('noCoreLeft'); return false; }
        // ---- THE SWAP CANNOT BE REFUSED FOR LACK OF CURSED ENERGY ----------
        // A SOFT-LOCK FOUND IN A LIVE MATCH, and it is the exact failure this
        // project already has a rule about. GORILLA drains 14 cursed energy a
        // second; the swap costs 8. So a Panda who stayed in Gorilla until his
        // bar emptied — which the stance is DESIGNED to make happen — could no
        // longer afford to leave it, and was locked into the slowest stance in
        // the game with no techniques for the rest of the round. The bot found
        // it in about forty seconds of play.
        //
        // So the cost DRAINS rather than gates: it takes what he has and lets
        // him out. That is the only version where "Gorilla is a countdown"
        // reads as a countdown rather than as a trap, and it costs nothing
        // elsewhere because he is the only fighter with a stance that bills him
        // for standing in it.
        this.res.curCE = Math.max(0, this.res.curCE - sp.cost);
        // preselect the NEXT one in ring order, so a tap is a cycle
        const nx = nextCore(this);
        this._openWheel({
          sel: nx === null ? -1 : order.indexOf(this.cores[nx].key),
          slot: 'core', t: 0, changed: false, core: true,
          order, avail
        }, sp);
        return true;
      }

      // ---- KASHIMO: ARC DASH 雷閃 -----------------------------------------
      // An instant blink along the stick that damages everything it passes
      // through, chainable a limited number of times before the cooldown ever
      // applies. Two things about this branch are load-bearing:
      //
      //   THE COOLDOWN IS SET ON THE LAST PASS, NOT THE FIRST. That is what
      //   makes the chain a chain rather than three separate specials — while
      //   passes remain, `specialCD` is zero and the gate at the top of
      //   `trySpecial` simply lets him through again. `arcChain` is the real
      //   limiter and `arcWindow` (ticked in `update`) is what makes it a
      //   BURST rather than three presses he can spread over a fight.
      //
      //   THE CHARGE IS SPENT BEFORE THE CURSED ENERGY AND BOTH BEFORE
      //   ANYTHING MOVES, so a refusal on either costs him nothing at all. A
      //   pass that connects pays back more than it cost — that is in the
      //   effect dispatcher, not here, because only the pass knows if it hit.
      case 'kashimo_arcdash': {
        const maxChain = this.amberT > 0 ? (this.cfg.ultimate?.chain ?? sp.chain ?? 3) : (sp.chain ?? 3);
        if (this.arcChain >= maxChain) { this.emit('arcSpent'); return false; }
        if (!spendCharge(this, sp.chargeCost ?? 0)) {
          this.emit('noCharge', { need: sp.chargeCost, have: this.charge });
          return false;
        }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this.arcChain++;
        this.arcWindow = sp.chainWindow ?? 0.85;
        if (this.arcChain >= maxChain) this._setSpecialCD(sp.cooldown);
        this._arcDash(input, ctx, sp);
        return true;
      }

      case 'mahito_summon': {
        // only ONE transfigured human may exist: re-summoning while one lives
        // does nothing and costs nothing
        if (ctx.match.minions?.aliveFor(this)) { this.emit('minionAlive'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'mahito_summon',
          startup: sp.castFrames, active: 1, recovery: 16, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        return true;
      }
      // SUKUNA — CONSUME A FINGER: a vulnerable channel with no hitbox and no
      // cursed-energy cost. What it costs is a second he cannot act and one of
      // exactly four fingers. The stack is NOT taken here — it is committed on
      // the activation frame in the effect dispatcher, so an interrupted
      // channel loses the second and keeps the finger.
      case 'sukuna_finger': {
        if (this.fingers >= this.fingerMax) { this.emit('noFingers'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'sukuna_finger',
          startup: sp.channelFrames, active: 1, recovery: 14, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        this.emit('fingerStart');
        return true;
      }
      // GOJO (SHINJUKU) — FALLING BLOSSOM EMOTION 落花の情.
      // A HELD counter-shroud, not a one-shot. It is entered here and ticked
      // in the `blossom` state below; `blossomHolds()` in domains.js is the
      // single predicate every sure-hit site asks, exactly as it already asks
      // about Simple Domain.
      case 'gojo_blossom': {
        if (this.res.stamina < 12) { this.emit('noStamina'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this.blossomT = sp.holdFrames ?? 90;
        this.blossomHits = 0;
        this.setState('blossom', { clip: sp.clip });
        this.emit('blossomOpen');
        return true;
      }
      // TOJI — OPEN THE INVENTORY CURSE. The same interaction shape as
      // Megumi's shikigami wheel, deliberately: the game does NOT pause, time
      // only slows, and he cannot act while it is held, so opening it in
      // somebody's face is a real risk. Where it differs is what happens on
      // release — Megumi's wheel rebinds a slot instantly, Toji's commits him
      // to a DRAW ANIMATION he cannot cancel (see the `arsenalSwap` state).
      case 'toji_arsenal': {
        const order = this.cfg.arsenal.order;
        // Every cursed tool is always available — he owns the Inventory Curse,
        // nothing in it can be destroyed — so `avail` is the whole order. It is
        // still passed explicitly so the three wheels have one shape.
        this._openWheel({
          sel: order.indexOf(this.weapon), t: 0, order, avail: order.slice(),
          arsenal: true
        }, sp);
        return true;
      }
      // HANAMI — ROOT FIELD. A cast with no hitbox: he plants both clubs and
      // the ground comes up around him. He is open for the whole channel,
      // which is the price of building his own terrain.
      case 'hanami_rootfield': {
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'hanami_rootfield',
          startup: sp.castFrames, active: 1, recovery: 16, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        this.emit('rootFieldStart');
        return true;
      }
      // KUROURUSHI — DEVOUR. One button, two moves, decided by whether there
      // is anything in reach: a committed grab if there is, and eating his own
      // swarm if there is not. That split is what stops him ever being fully
      // stalled, and it costs him the field control either way.
      case 'kurourushi_devour': {
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const opp = ctx.opponent;
        const d = opp && opp.alive
          ? Math.hypot(opp.pos.x - this.pos.x, opp.pos.z - this.pos.z) : Infinity;
        // the lunge covers a little more ground than the grab's own reach, so
        // the decision is "is there anything worth committing at", not "am I
        // already touching them"
        const grab = d < (sp.reach ?? 2.0) * this.reachScale + 1.6;
        if (grab) {
          // faster into a body already on the floor — this is what turns his
          // knockdown ender into a real loop
          const downed = ['knockdown', 'getup'].includes(opp.state);
          const move = {
            ...sp, name: sp.name, kind: 'ct', slot: 'special', effect: 'kurourushi_devour',
            startup: downed ? (sp.downedStartup ?? 14) : (sp.startup ?? 24),
            active: sp.active ?? 4, recovery: sp.recovery ?? 30, clip: sp.clip
          };
          this._applyGrowth(move);
          this.setState('ct', { move });
          this._syncMoveAnim(move, sp.clip);
          this.emit('devourStart');
        } else {
          const move = {
            name: sp.name + ' (SELF)', kind: 'ct', slot: 'special',
            effect: 'kurourushi_selfdevour',
            startup: 14, active: 1, recovery: 24, clip: sp.selfClip
          };
          this.setState('ct', { move });
          this._syncMoveAnim(move, sp.selfClip);
          this.emit('selfDevourStart');
        }
        return true;
      }
      // CHOSO — FLOWING RED SCALE 赤鱗躍動. The single biggest Blood cost in
      // his kit bought with a completely open 30-frame channel: no hitbox, no
      // armour, no cancel. He is buying a gear change and he has to pay for it
      // in front of you. The buff itself is applied on the ACTIVATION frame by
      // the effect dispatcher, so an interrupted channel costs him the cursed
      // energy and the Blood and gives him nothing — which is the risk.
      case 'choso_redscale': {
        if (this.buffs.redScale > 0) { this.emit('redScaleUp'); return false; }
        if (this.blood < sp.blood) { this.emit('noBlood', { need: sp.blood, have: this.blood }); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this.spendBlood(sp.blood);
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'choso_redscale',
          startup: sp.castFrames, active: 1, recovery: sp.recovery ?? 16, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        this.emit('redScaleStart');
        return true;
      }
      // NOBARA — THE BLACK FLASH ATTEMPT. A dedicated committed strike rather
      // than a follow-up on any hit: it opens the window itself (the effect
      // dispatcher calls the SHARED `openBlackFlash` on connect) and PUNCH
      // inside that window cashes it through the SHARED `effects.blackFlash`.
      // Nothing about Yuji's route is touched — see `cfg.blackFlash.confirm`.
      case 'nobara_blackflash': {
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          ...sp, name: sp.name, kind: 'ct', slot: 'special', isCT: false,
          effect: 'nobara_bf_strike',
          startup: sp.startup, active: sp.active, recovery: sp.recovery, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        const fwd = this.forward();
        this.vel.x += fwd.x * 2.6;
        this.vel.z += fwd.z * 2.6;
        this.emit('bfStrikeStart');
        return true;
      }
      case 'higuruma_judgeman': {
        // ONE Judgeman. Re-summoning while it lives does nothing and costs
        // nothing — the same rule as Mahito's transfigured human.
        if (ctx.match.judgemen?.aliveFor(this)) { this.emit('judgemanAlive'); return false; }
        if (!this.spendCE(sp.cost)) { this.emit('noCE'); return false; }
        this._setSpecialCD(sp.cooldown);
        const move = {
          name: sp.name, kind: 'ct', slot: 'special', effect: 'higuruma_judgeman',
          startup: sp.castFrames, active: 1, recovery: 18, clip: sp.clip
        };
        this.setState('ct', { move });
        this._syncMoveAnim(move, sp.clip);
        return true;
      }
    }
    // yuji_blackflash never reaches here — it is handled directly in
    // _stateLogic because it must fire from ANY actionable state, mid-move
    return false;
  }
  // NO COOLDOWNS during Jackpot — same choke point as spendCE, so every
  // special on the roster would be affected if anyone else ever got one.
  _setSpecialCD(s) {
    this.specialCD = this.inJackpot ? 0 : s;
    this.specialCDMax = Math.max(s, 0.01);
  }

  // GOJO — Instant Transmission: stick direction picks the exit, neutral goes
  // behind the opponent. Brief i-frames; the cooldown is the balance.
  _teleport(input, ctx, sp) {
    const from = this.pos.clone();
    const opp = ctx.opponent;
    const mv = input?.move ?? { x: 0, z: 0 };
    let dest;
    if (Math.hypot(mv.x, mv.z) > 0.25) {
      dest = this.pos.clone().addScaledVector(this._moveVec(mv).normalize(), sp.range ?? 4);
    } else {
      dest = opp.pos.clone().addScaledVector(opp.forward(), -(sp.behindGap ?? 1.5));
    }
    dest.y = 0;
    const r = Math.hypot(dest.x, dest.z);
    const lim = this.boundRadius;
    if (r > lim) { const s = lim / r; dest.x *= s; dest.z *= s; }
    this.pos.copy(dest);
    this.prevPos.copy(dest); // no interpolation streak — he was never in between
    this.grounded = true;
    this.iFrames = Math.max(this.iFrames, sp.iFrames ?? 18);
    this.setState('special', { clip: sp.clip });
    this.emit('warp', { from, to: dest.clone() });
  }

  // TODO — Boogie Woogie: swap ground positions with the nearest opponent.
  // Only x/z trade places: each fighter keeps their own height, state, facing,
  // velocity and juggle count, so a mid-air victim keeps falling exactly as
  // they were — just somewhere else. A mid-swing victim whiffs into the air
  // their target no longer occupies.
  // KASHIMO — ARC DASH. The movement half. Deliberately shaped like
  // `_teleport` above rather than like `_locomote`: he does not travel, he
  // ARRIVES, so the position is written directly and `prevPos` is written with
  // it so the renderer draws no interpolation streak between the two points.
  //
  // Neutral stick goes FORWARD (through whoever he is soft-locked to) rather
  // than behind them the way Gojo's neutral warp does. That is the whole
  // difference in intent between a defensive teleport and an offensive one: the
  // default has to be "through you".
  _arcDash(input, ctx, sp) {
    const from = this.pos.clone();
    const mv = input?.move ?? { x: 0, z: 0 };
    const dist = sp.distance ?? 5.4;
    const dir = Math.hypot(mv.x, mv.z) > 0.25
      ? this._moveVec(mv, ctx.camYaw).normalize()
      : this.forward();
    const dest = from.clone().addScaledVector(dir, dist);
    dest.y = 0;
    const r = Math.hypot(dest.x, dest.z);
    const lim = this.boundRadius;
    if (r > lim) { const s = lim / r; dest.x *= s; dest.z *= s; }
    this.pos.copy(dest);
    this.prevPos.copy(dest);
    this.vel.set(0, 0, 0);
    this.grounded = true;
    this.iFrames = Math.max(this.iFrames, sp.iFrames ?? 10);
    this.setState('special', { clip: sp.clip });
    // the pass itself — damage, the trail, and the charge refund on a connect
    ctx.effects.applyTechnique(this, 'kashimo_arcpass', { ...sp, from, to: dest });
    this.emit('arcDash', { chain: this.arcChain, from, to: dest });
  }

  _boogie(ctx, sp) {
    const t = ctx.opponent;
    const a = this.pos.clone(), b = t.pos.clone();
    const ax = this.pos.x, az = this.pos.z;
    this.pos.x = t.pos.x; this.pos.z = t.pos.z;
    t.pos.x = ax; t.pos.z = az;
    // The swap can drop either body somewhere the other one fitted and it does
    // not — a doorway, a pillar gap, the lip of a mezzanine. Push both back
    // out of anything they have landed inside and re-seat them on the floor
    // under their new feet. Costs nothing and makes the swap safe at any size.
    for (const f of [this, t]) {
      if (!f.bounds) continue;
      f.bounds.resolveWalls(f.pos, f.cfg.size?.bodyRadius ?? 0.36);
      f.bounds.clampXZ(f.pos, 0.35);
      const g = f.bounds.floorAt(f.pos.x, f.pos.z, f.pos.y + STEP_TOL);
      if (f.pos.y < g) { f.pos.y = g; f.groundY = g; f.grounded = true; }
    }
    this.prevPos.copy(this.pos);
    t.prevPos.copy(t.pos);
    // the victim's soft lock goes stale for a beat: a mid-swing opponent
    // finishes the swing aimed at where Todo used to be
    t.aimLag = sp.victimAimLag ?? 0.28;
    this.setState('special', { clip: sp.clip });
    this.emit('boogie', { a, b });
  }

  // NANAMI — the sweep stopped (or ran off the end as null): score it.
  // The red line sits at the 7:3 point; land on it and the next move is a
  // guaranteed Ratio strike. Missing puts the special on the long cooldown.
  _ratioResolve(pos, sp) {
    this.ratioSweep = null;
    const d = pos === null ? 1 : Math.abs(pos - (sp.mark ?? 0.7));
    if (d <= (sp.hitWindow ?? 0.05)) {
      this.ratioPrimed = 2;
      this.ratioPrimedT = sp.primedTime ?? 6;
      this.ratioSweepN++;
      this._setSpecialCD(sp.cooldown);
      this.emit('ratioPrime', { level: 2 });
    } else if (d <= (sp.nearWindow ?? 0.12)) {
      this.ratioPrimed = 1;
      this.ratioPrimedT = sp.primedTime ?? 6;
      this._setSpecialCD(sp.cooldown);
      this.emit('ratioPrime', { level: 1 });
    } else {
      this._setSpecialCD(sp.missCooldown ?? 8);
      this.emit('ratioMiss');
    }
    this.setState('idle', { clip: 'idle' });
  }


  // ---- TOJI: committing to a weapon ----------------------------------------
  // Called when the wheel is released. Picking the tool he already has is a
  // free no-op — a mis-tap costs him the wheel's own frames and nothing more.
  // Anything else costs the full draw, during which he is open.
  commitWeapon(key) {
    const a = this.cfg.arsenal;
    this.arsenal = null;
    this._setSpecialCD(a.cooldown);
    if (!key || key === this.weapon) {
      this.setState('idle', { clip: 'idle' });
      return false;
    }
    this.weapon = key;
    this.swapT = a.swapFrames;
    const clip = 'draw' + this.equipped.clipSuffix;
    this.setState('arsenalSwap', { clip: this.anim.clips.has(clip) ? clip : 'idle' });
    this.emit('weaponSwap', { weapon: key, name: this.equipped.name });
    return true;
  }

  // ---- TOJI: ASSASSINATION 術師殺し ----------------------------------------
  // A committed forward blitz. No meter, no gate, no charge — available from
  // frame one of the round and then gone for a long time. The connect is
  // resolved by the effect dispatcher, which sets `assassinPhase` to
  // 'sequence' and lets the state below run the four-weapon chain.
  startAssassination(ctx) {
    const u = this.cfg.ultimate;
    this.assassinCD = u.cooldown;
    this.assassinPhase = 'blitz';
    this.assassinHit = 0;
    const move = {
      name: u.name, kind: 'ct', slot: 'ult', effect: u.effect,
      startup: u.startup, active: u.blitzFrames, recovery: u.whiffRecovery,
      reach: u.reach, arc: u.arc, clip: u.clip
    };
    this.setState('ct', { move });
    this._syncMoveAnim(move, u.clip);
    this.emit('assassinStart');
    return true;
  }

  // yuji ultimate: Sukuna surfaces — a transform, not a domain
  startTransform(ctx) {
    const u = this.cfg.ultimate;
    const move = { name: u.name, kind: 'ct', slot: 'ult', effect: u.effect, startup: u.startup, active: 1, recovery: u.recovery, clip: u.clip };
    this.consumeFullBar();
    this.setState('ct', { move });
    this._syncMoveAnim(move, u.clip);
    this.emit('sukunaCast');
  }

  startCopy(ctx) {
    if (!this.copySlot) return;
    const c = this.copySlot;
    this.copySlot = null;
    const def = {
      name: c.name, kind: 'ct', isCT: true, slot: 'copy', effect: c.effect,
      dmg: c.dmg, startup: 16, active: 4, recovery: 20, range: 7, reach: 2.2, arc: 2,
      kb: 4, kbY: 1, clip: this.cfg.copy?.clip || 'cast'
    };
    this.setState('ct', { move: def });
    this._syncMoveAnim(def, def.clip);
    this.emit('copyCast', { move: def });
  }

  forward() { return v3(Math.sin(this.facing), 0, Math.cos(this.facing)); }

  // Did this hit arrive inside the frontal cone? Used by the Shutter, which
  // is a door in front of him rather than a bubble around him. Prefers the
  // attacker's actual position and falls back to the hit's push direction for
  // sourceless damage.
  _facingHit(hit, arc = this.cfg.special?.arc ?? 1.9) {
    const fwd = this.forward();
    const src = hit.attacker?.pos;
    if (src) {
      const dx = src.x - this.pos.x, dz = src.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 1e-4) return true;
      return (dx / d) * fwd.x + (dz / d) * fwd.z > Math.cos(arc / 2);
    }
    if (!hit.dir) return true;
    return hit.dir.x * fwd.x + hit.dir.z * fwd.z < 0;
  }

  // ---- damage intake ------------------------------------------------------
  // hit: {dmg, kb, kbY, hitstun, type, attacker, unblockable, otgOk, crit}
  //
  // Thin wrapper over the real resolution so the Reverse Cursed Technique
  // ledger sees every route into this fighter's health — the body below
  // returns from a dozen places and each of them can subtract HP.
  applyHit(hit, ctx) {
    const before = this.res.hp;
    const r = this._applyHit(hit, ctx);
    if (this.jackpot) this._rct(before);
    this._feedGauges(hit, r, before);
    return r;
  }

  // ---- THE TWO SECOND RESOURCES, IN ONE PLACE ------------------------------
  // Both new gauges are fed from the same choke point every damage route in
  // the game already passes through, which is why neither needed a hook at any
  // damage SITE and why neither can be double-counted or missed.
  //
  //   BLOOD (Choso)   — fills for the fighter who TOOK the damage and for the
  //                     one who DEALT it, at different rates.
  //   ESSENCE (Nobara)— taken by the ATTACKER, and only on a CLEAN connect.
  //                     A blocked, armoured, i-framed or whiffed hit gathers
  //                     nothing: she has to actually touch them.
  //
  // Everything below is a no-op for a fighter whose config declares neither,
  // which is the entire existing roster.
  _feedGauges(hit, result, hpBefore) {
    const atk = hit.attacker;
    const lost = hpBefore - this.res.hp;
    if (lost > 0) {
      if (this.cfg.blood) this.gainBlood(lost * (this.cfg.blood.perDamageTaken ?? 0));
      if (atk && atk !== this && atk.cfg.blood) {
        atk.gainBlood(lost * (atk.cfg.blood.perDamageDealt ?? 0));
      }
    }
    if (!atk || atk === this || !atk.cfg.essence) return;
    if (result !== 'hit' && result !== 'otg') return;
    const e = atk.cfg.essence;
    const amount = hit.essence != null ? hit.essence
      : hit.type === 'knockdown' ? e.perKnockdown
        : hit.isCT ? e.perCT
          : hit.type === 'light' ? e.perLight : e.perHeavy;
    atk.gainEssence(amount, hit.src ?? null);
  }

  _applyHit(hit, ctx) {
    if (!this.alive) return 'dead';
    // SHADOW TRAVEL: submerged in his own domain's shadow, there is nothing to
    // hit. This is stronger than i-frames on purpose — it also beats sure-hit,
    // because a sure-hit still needs a body inside the barrier to land on.
    if (this.submerged > 0.55) return 'iframe';
    // TOAD: it can body-block exactly one incoming hit for its summoner
    if (ctx?.match?.shikigami?.tryIntercept(this, hit)) return 'intercepted';
    // ---- HAKARI: THE SHUTTER --------------------------------------------
    // A directional guard object, not a Simple Domain: it stops what comes at
    // his front and nothing else, and a sure-hit walks straight through it.
    if (this.shutterT > 0 && !hit.sureHit && this._facingHit(hit)) {
      if (hit.src === 'projectile') {
        // projectiles are stopped OUTRIGHT and do not spend the door
        this.emit('shutterBlock', { projectile: true });
        return 'blocked';
      }
      if (--this.shutterHits <= 0) {
        this.shutterT = 0;
        this.emit('shutterBreak');
      } else this.emit('shutterBlock', {});
      return 'blocked';
    }
    // ---- HAKARI: RCT COUNTER STANCE (Jackpot) ----------------------------
    // He stood there and invited it. The hit is absorbed, healed, and handed
    // straight back — resolved by the effect dispatcher on the next frame.
    if (this.counterT > 0 && !hit.sureHit && hit.attacker && hit.attacker !== this) {
      this.counterT = 0;
      const def = this.cfg.jackpotKit?.ct2;
      this.res.hp = Math.min(this.maxHP, this.res.hp + (def?.heal ?? 15));
      this.emit('rctCounter', { target: hit.attacker, def });
      return 'counter';
    }
    // ---- NAOYA: PROJECTION SORCERY, THE TRAP ------------------------------
    // Placed HERE, above the i-frame check and above every damage branch, and
    // both of those placements are deliberate:
    //
    //   ABOVE THE DAMAGE — because THE STANCE DOES NOT BLOCK. Naoya eats the
    //   hit in full and the attacker freezes anyway. That is the trade that
    //   makes the mechanic fair rather than free: touching him costs you a
    //   second, but it costs him health, and against a big committed swing
    //   that exchange is genuinely arguable. A stance that absorbed the damage
    //   AND froze you would have no downside at all, and this character does
    //   not need a second strength.
    //
    //   The trigger is `isContact` (combat/freeze.js), which requires BOTH an
    //   untagged-as-ranged hit AND the attacker's body actually being within
    //   2.6 m. That is what makes every zoner in the roster — Jogo, Hanami,
    //   Nobara, Choso, Megumi, Mahito, Geto — able to play against him, and it
    //   is generic rather than a list, so a technique written next year cannot
    //   accidentally opt in.
    if ((this.projT > 0 || this.maxProjT > 0) && !this.instantKO) {
      const fz = ctx?.match?.freeze;
      if (fz && isContact(this, hit)) {
        this.projSpent = true;
        if (fz.freeze(hit.attacker, this)) this.emit('projectionTrigger', { victim: hit.attacker });
      }
    }
    if (this.iFrames > 0 && !hit.sureHit) return 'iframe';
    const atk = hit.attacker;
    // ---- GLOBAL BALANCE ---------------------------------------------------
    // Punches down, everything else up. Applied HERE, above every branch, for
    // the same reason adaptation is: this is the one place clean hits, armoured
    // hits, chip through a guard, damage over time, summon contact and sure-hit
    // domain ticks all meet, so there is no route into a health bar that skips
    // it and no per-character number to keep in sync. `basic` is tagged in
    // hits.js and is absent (falsy) on everything that is not the punch string
    // or the heavy — which is the correct default for a technique. The three
    // dials live in combat/balance.js.
    hit = { ...hit, dmg: hit.dmg * hitMult(hit) };
    // debuffs on the DEFENDER scale everything that lands from here on
    if (this.incomingMult !== 1) hit = { ...hit, dmg: hit.dmg * this.incomingMult };
    // FIRE VULNERABILITY. Tagged at the damage site with `elem: 'fire'` rather
    // than inferred from the source, because only the call site knows whether
    // a given blow was actually made of fire — Jogo's heavy is a magma pop and
    // his punch string is not.
    if (hit.elem === 'fire' && this.fireMult !== 1) {
      hit = { ...hit, dmg: hit.dmg * this.fireMult };
      if (!this._fireToast) { this._fireToast = true; this.emit('fireWeak'); }
    }

    // ---- ADAPTATION (Mahoraga) --------------------------------------------
    // Applied here, above every branch, so it covers clean hits, armoured
    // hits, chip through a guard and sure-hits alike — there is no route into
    // his health that skips it. `hit.src` is tagged at the damage site; an
    // untagged source simply is not adaptable.
    if (this.adapt) {
      // "hit by" means contact. The one path below that reaches this point
      // without landing is an OTG whiff on a body already spent, so exclude it.
      const otgWhiff = (this.state === 'knockdown' || this.state === 'getup')
        && !hit.sureHit && (this.otgUsed || !hit.otgOk);
      if (!otgWhiff) this.adapt.mark(hit.src);
      const cut = this.adapt.reductionFor(hit.src);
      if (cut > 0) hit = { ...hit, dmg: hit.dmg * (1 - cut), adapted: cut };
    }

    // ---- MASS -------------------------------------------------------------
    // A body this heavy gets moved, but it does not get carried. Horizontal
    // knockback and launch height scale down separately, so combos still
    // work — they are just short and low.
    const kbR = this.cfg.kbResist ?? 1;
    const lnR = this.cfg.launchResist ?? kbR;
    if (kbR !== 1 || lnR !== 1) {
      hit = {
        ...hit, kb: hit.kb * kbR, kbY: (hit.kbY ?? 0) * lnR,
        _kbYDefault: 6.5 * lnR
      };
    }

    // armor: eat the hit, take reduced damage, no reaction.
    // RESOLVE grants armor through exactly one hit — consumed on absorb.
    if ((this.armorFrames > 0 || this.resolveArmor) && !hit.sureHit && hit.type !== 'launcher') {
      if (this.armorFrames <= 0) this.resolveArmor = false;
      this.res.hp -= hit.dmg * 0.6;
      this.emit('armorHit');
      return 'armor';
    }

    // downed/OTG handling
    const downed = this.state === 'knockdown' || this.state === 'getup';
    if (downed && !hit.sureHit) {
      if (this.otgUsed || !hit.otgOk) return 'whiff';
      this.otgUsed = true;
      this.res.hp -= hit.dmg * 0.5;
      this.iFrames = 40;
      this.setState('getup', { clip: 'getup' });
      return 'otg';
    }

    // blocking
    // A guard that is SLOW TO RAISE: for `blockStartupFrames` after the press
    // the arms are still travelling and the hit lands clean. Defaults to 0, so
    // nobody on the roster changes behaviour.
    const guardUp = this.state === 'block' && this.f >= (this._tune('blockStartupFrames') ?? 0);
    const blocking = (guardUp || this.state === 'blockstun');
    // Nanami's primed 7:3 strike shatters a held guard outright
    const primed = (!hit.sureHit && atk?.ratioPrimed) || 0;
    if (blocking && primed) {
      this.res.hp -= hit.dmg;
      this.res.stamina = 0;
      this.setState('guardBreak', { clip: 'guardBreak' });
      this.activeHit = null;
      this.move = null;
      atk.ratioPrimed = 0;
      atk.emit('ratioStrike', { level: primed });
      this.emit('guardBreak');
      return 'guardbreak';
    }
    if (blocking && !hit.unblockable && !hit.sureHit) {
      // heavy guards (Mahoraga, Hanami) take a fraction of the usual chip.
      // GUARD MELT (Kurourushi's corrosive spray) multiplies both halves —
      // this is the whole reason the spray beats defensive characters, and
      // applying it here means it works against every guard in the game
      // rather than against a list of them.
      const melted = this.melt && this.melt.t > 0;
      const chip = hit.dmg * 0.15 * (this._tune('blockChipMult') ?? 1) * (melted ? this.melt.chip : 1);
      this.res.hp -= chip;
      // weak guards (Jogo) bleed stamina faster per blocked hit
      this.res.stamina -= 12 * (this._tune('blockStaminaMult') ?? 1) * (melted ? this.melt.stamina : 1);
      // JUDGEMAN files faster while its summoner is under fire — a blocked hit
      // is still a hit landed on him, and still evidence
      ctx?.match?.judgemen?.evidenceFromHit(this, true);
      this.setState('blockstun', { clip: 'blockHit' });
      const fwd = hit.dir || atk?.forward() || v3();
      this.vel.x += fwd.x * hit.kb * 0.5;
      this.vel.z += fwd.z * hit.kb * 0.5;
      if (this.res.stamina <= 0) {
        this.res.stamina = 0;
        this.setState('guardBreak', { clip: 'guardBreak' });
        this.emit('guardBreak');
        return 'guardbreak';
      }
      return 'block';
    }

    // clean hit
    this.res.hp -= hit.dmg;
    this.comboTimer = 0;
    // THE CASE BUILDS FASTEST WHEN HE IS LOSING. Every clean hit landed on
    // Higuruma is evidence against whoever landed it — which is the whole
    // reason his gameplan is "survive" rather than "win the neutral".
    ctx?.match?.judgemen?.evidenceFromHit(this, false);
    // CURSED BUD: the counterplay to being starved of meter is to go and hit
    // the thing that planted it. Landing enough clean hits on Hanami tears the
    // seed out — checked here, on HIS intake, because that is what "landing
    // hits on Hanami" means.
    if (atk) ctx?.match?.flora?.noteCleanse(atk);
    const dir = hit.dir || atk?.forward() || v3();

    // KNOCKDOWN (the heavy) beats the juggle rules: in the air it becomes a
    // spike that drives them into the floor, on the ground it is a flat
    // knockdown. Either way they end up down, and the fall is techable.
    if (hit.type === 'knockdown') {
      this.juggle = 0;
      this.otgUsed = false;
      this.techLock = false;
      if (this.airborne) {
        this.vel.set(dir.x * hit.kb * 0.5, -13, dir.z * hit.kb * 0.5);
        this.setState('launched', { clip: 'launched' });
      } else {
        this.vel.set(dir.x * hit.kb, 2.5, dir.z * hit.kb);
        this.setState('knockdown', { clip: 'knockdown' });
      }
    } else if (this.airborne || hit.type === 'launcher') {
      this.juggle++;
      this.techLock = false;
      if (this.juggle > 4) { // tech out: no infinite loops
        this.vel.set(dir.x * 4, 2, dir.z * 4);
        this.iFrames = 60;
        this.setState('launched', { clip: 'launched' });
        return 'tech';
      }
      const jScale = 1 / (1 + this.juggle * 0.25); // juggle damage/launch decay
      this.vel.set(dir.x * hit.kb * 0.8, (hit.kbY || hit._kbYDefault || 6.5) * jScale, dir.z * hit.kb * 0.8);
      this.grounded = false;
      this.setState('launched', { clip: 'launched' });
    } else {
      this.vel.x += dir.x * hit.kb;
      this.vel.z += dir.z * hit.kb;
      const heavy = hit.hitstun >= 20;
      this.setState(heavy ? 'hitHeavy' : 'hitLight', { clip: heavy ? 'hitHeavy' : 'hitLight' });
      this.hitstun = hit.hitstun;
    }

    // cancel whatever we were doing
    this.activeHit = null;
    this.move = null;
    // taking a clean hit closes the Black Flash window and breaks the chain
    this.bfT = 0;
    this.bfChain = 0;
    // getting clipped mid-sweep interrupts the timing (short retry cooldown)
    if (this.ratioSweep != null) { this.ratioSweep = null; this._setSpecialCD(2); }

    // the primed 7:3 strike is spent the moment it connects
    if (primed) {
      atk.ratioPrimed = 0;
      atk.emit('ratioStrike', { level: primed });
    }

    // Yuta passive: copy the technique that just hit him
    if (this.cfg.copy && hit.isCT && atk) this.storeCopy(atk);
    return 'hit';
  }

  // Load someone else's technique into the copy slot (Yuta). One slot: a new
  // source overwrites, but re-taking from the same fighter is a no-op so it
  // does not re-toast on every punch of a string. Source accent color rides
  // along for the HUD slot.
  storeCopy(src) {
    if (!this.cfg.copy || !src || src === this) return false;
    const eff = src.cfg.copyEffect;
    if (!eff) return false;
    if (this.copySlot && this.copySlot.srcId === src.cfg.id) return false;
    this.copySlot = {
      ...eff, srcId: src.cfg.id,
      color: src.model.palette.accent ?? 0x9ff5c9
    };
    this.emit('copied', { name: this.copySlot.name });
    return true;
  }

  // ---- per-tick update ----------------------------------------------------
  update(input, ctx) {
    const dt = 1 / 60;
    this.prevPos.copy(this.pos);
    this.prevFacing = this.facing;
    this.f++;

    // timers
    if (this.iFrames > 0) this.iFrames--;
    if (this.armorFrames > 0) this.armorFrames--;
    if (this.purpleWindow > 0) this.purpleWindow--;
    if (this.buffs.overtime > 0) this.buffs.overtime -= dt;
    if (this.buffs.voidDebuff > 0) this.buffs.voidDebuff -= dt;
    if (this.buffs.soulWound > 0) this.buffs.soulWound -= dt;
    if (this.buffs.domainHaste > 0) this.buffs.domainHaste -= dt;
    if (this.buffs.overheat > 0) {
      this.buffs.overheat -= dt;
      if (this.buffs.overheat <= 0) { this.model.setOverheat?.(false); this.emit('overheatEnd'); }
    }
    // FLOWING RED SCALE. It simply runs out — there is NO recoil, NO rent and
    // NO health cost when it does. Sukuna's Manifestation charges recoil above
    // because that transformation is borrowed; Choso's blood is his own, and
    // the brief is explicit that he never spends health.
    if (this.buffs.redScale > 0) {
      this.buffs.redScale -= dt;
      if (this.buffs.redScale <= 0) { this.model.setRedScale?.(false); this.emit('redScaleEnd'); }
    }
    if (this.buffs.bfCharge > 0) this.buffs.bfCharge -= dt;
    // BLOOD: a slow passive trickle so a round where nothing connects is not a
    // dead one. Halted during backlash exactly as cursed-energy regen is.
    if (this.cfg.blood && this.backlash <= 0 && this.alive) {
      this.gainBlood((this.cfg.blood.regen ?? 0) * dt);
    }
    tickBurn(this, dt); // Jogo's fire DoT — never feeds MAX_CE, only hurts
    if (this.buffs.resolve > 0) {
      this.buffs.resolve -= dt;
      if (this.buffs.resolve <= 0) this.resolveArmor = false;
    }
    if (this.specialCD > 0) this.specialCD -= dt;
    if (this.tauntCD > 0) this.tauntCD -= dt;
    if (this.chargeCD > 0) this.chargeCD -= dt;
    // GUARD MELT wears off on its own clock
    if (this.melt) {
      this.melt.t -= dt;
      if (this.melt.t <= 0) { this.melt = null; this.emit('meltEnds'); }
    }
    // the maw shuts again after a self-devour
    if (this._mawT > 0) {
      this._mawT -= dt;
      if (this._mawT <= 0) this.model.setMaw?.(0);
    }
    // TOJI's three clocks. All decay on the wall clock like every other
    // cooldown here; none of them are resources and none of them build.
    if (this.soulCut) {
      this.soulCut.t -= dt;
      if (this.soulCut.t <= 0) { this.soulCut = null; this.emit('soulCutEnds'); }
    }
    if (this.assassinCD > 0) this.assassinCD -= dt;
    if (this.nullifyCD > 0) this.nullifyCD -= dt;
    if (this.ctSealT > 0) {
      this.ctSealT -= dt;
      if (this.ctSealT <= 0) this.emit('ctSealEnds');
    }
    // CONFISCATION: the seized button comes back on its own clock
    if (this.lockedSlot) {
      this.lockedSlot.t -= dt;
      if (this.lockedSlot.t <= 0) {
        this.emit('confiscationEnds', { slot: this.lockedSlot.slot });
        this.lockedSlot = null;
      }
    }
    // HAKARI: the shutter's own clock, and the counter stance's open window
    if (this.shutterT > 0) {
      this.shutterT -= dt;
      if (this.shutterT <= 0) { this.shutterHits = 0; this.emit('shutterDown'); }
    }
    if (this.counterT > 0) this.counterT--;
    // the shroud cannot outlive its own state — being knocked out of `blossom`
    // by anything (a normal attack, a KO, a domain collapse) drops it
    if (this.blossomT > 0 && this.state !== 'blossom') this.blossomT = 0;
    // ADAPTATION: the interval runs on its own clock and reports on the frame
    // it comes due. Match turns the result into the wheel spin, the callout
    // and the HUD row.
    if (this.adapt) {
      const res = this.adapt.tick(dt);
      if (res) this.emit('adapt', { result: res });
    }
    if (this.ratioPrimedT > 0) {
      this.ratioPrimedT -= dt;
      if (this.ratioPrimedT <= 0) this.ratioPrimed = 0; // unspent prime fades
    }
    if (this.buffs.sukuna > 0) {
      this.buffs.sukuna -= dt;
      if (this.buffs.sukuna <= 0) {
        // the rent comes due: recoil damage + CE-regen blackout
        const u = this.cfg.ultimate;
        this.res.hp = Math.max(1, this.res.hp - (u.recoil ?? 12));
        this.backlash = u.backlash?.duration ?? 8;
        this.backlashGrowthMult = u.backlash?.growthMult ?? 0.5;
        this.model.setSukuna?.(false);
        this.emit('sukunaEnd');
      }
    }
    // Black Flash window countdown; the tell fires the frame it opens
    if (this.bfT > 0) {
      this.bfT--;
      if (this.cfg.blackFlash && this.bfT === this.cfg.blackFlash.window) this.emit('bfTell');
    }
    if (this.backlash > 0) { this.backlash -= dt; if (this.backlash <= 0) this.backlashGrowthMult = 1; }
    if (this.rootT > 0) {
      this.rootT -= dt;
      if (this.rootT <= 0 && this.state === 'rooted') this.setState('idle', { clip: 'idle' });
    }

    // ---- THE FREEZE CLOCK, AND WHY IT IS AUTHORITATIVE ----------------------
    // `frozenT` is THE clock. FreezeSystem reads it rather than keeping its own
    // copy, so there is exactly one number and it cannot drift.
    //
    // The second line here is the important one and it was a real bug in
    // testing. Entering the `frozen` state is not enough on its own: the very
    // first hit of the attacker's free punish calls applyHit, which puts the
    // victim into `hitLight`/`hitHeavy` like any other hit would, and from that
    // moment they are in ordinary hitstun rather than frozen. Hitstun is
    // shorter than a second, so the victim RECOVERED EARLY — the exact opposite
    // of the mechanic, and it only showed up when the punish was actually
    // thrown rather than when the freeze was inspected on its own.
    //
    // So while the clock runs, the frozen state is reasserted every tick over
    // anything a hit tried to put them in. Damage, knockback and the combo
    // counter all still resolve normally; what does not resolve is the victim
    // getting their body back before the second is up. The one exception is a
    // state with a stronger claim (a KO, an execution, a transfiguration),
    // which is allowed to take the body and ends the freeze — see
    // UNFREEZABLE_STATES in combat/freeze.js.
    if (this.frozenT > 0) {
      this.frozenT = Math.max(0, this.frozenT - dt);
      const STOLEN = ['ko', 'victory', 'transfigured', 'sentenced', 'executing', 'devoured'];
      if (this.frozenT > 0 && this.state !== 'frozen' && !STOLEN.includes(this.state)) {
        this.setState('frozen', { clip: 'frozen' });
      }
    }

    // ---- PROJECTION SORCERY, THE CLOCKS -------------------------------------
    // MAXIMUM PROJECTION first, because while it holds it keeps the stance
    // permanently armed and the stance's own window must not be able to expire
    // underneath it (and therefore must not be able to fire the whiff penalty
    // on a man who is paying a full bar for the privilege).
    if (this.maxProjT > 0) {
      this.maxProjT -= dt;
      if (this.maxProjT <= 0) {
        this.maxProjT = 0;
        this.model.setProjectionStance?.(false);
        this.model.projectionClear?.();
        // standard non-domain backlash, exactly as the other burst ultimates
        // take it — the gate charged him for a bar and this is the rent
        const u = this.cfg.ultimate;
        this.backlash = u.backlash?.duration ?? 8;
        this.backlashGrowthMult = u.backlash?.growthMult ?? 0.5;
        this.emit('maxProjectionEnd');
      }
    } else if (this.projArmT > 0) {
      // the stance is still coming up: NOT armed yet, which is the bait window
      this.projArmT -= dt;
      if (this.projArmT <= 0) {
        this.projArmT = 0;
        this.projT = (this.cfg.special.windowFrames ?? 42) / 60;
        this.projSpent = false;
        this.model.setProjectionStance?.(true);
        this.emit('stanceArmed');
      }
    } else if (this.projT > 0) {
      this.projT -= dt;
      if (this.projT <= 0) {
        this.projT = 0;
        this.model.setProjectionStance?.(false);
        // THE SELF-FREEZE. Canon: the user is bound by the same twenty-four
        // frames and eats the same penalty for breaking his own sequence. Here
        // it is spent on the whiffed stance, which is the one thing this
        // character needed to not be free — see the reasoning in his config.
        if (!this.projSpent && this.cfg.special?.selfFreezeOnWhiff) {
          ctx.match?.freeze?.selfFreeze(this);
        }
        this.emit('stanceEnd', { spent: this.projSpent });
      }
    }

    // AFTERIMAGES while maximum projection holds: one placed every 1/24 s at
    // wherever he actually is, and then left there. Nothing interpolates.
    if (this.maxProjT > 0 && this.model.projectionStep) {
      this.model.projectionAttach?.(ctx.match.root);
      this.projStepT -= dt;
      if (this.projStepT <= 0) {
        this.projStepT = 1 / 24;
        this.model.projectionStep(this.pos, this.facing);
      }
    }
    // ---- CHARGE 帯電, AND THE AMBER CLOCK -----------------------------------
    // Ordered exactly like Naoya's pair above and for the same reason: the
    // ultimate is resolved BEFORE the meter, because while it holds it pins
    // the meter at maximum and the meter's own rules must not be able to run
    // underneath it.
    if (this.amberT > 0) {
      this.amberT -= dt;
      if (this.amberT <= 0) {
        this.amberT = 0;
        this.model.setAmber?.(false);
        // standard non-domain backlash, exactly as every other burst ultimate
        // takes it. Canon calls Mythical Beast Amber a once-in-a-lifetime
        // technique that destroys the body; this is the part of that cost the
        // project's own rules can carry (see the config header).
        const u = this.cfg.ultimate;
        this.backlash = u.backlash?.duration ?? 8;
        this.backlashGrowthMult = u.backlash?.growthMult ?? 0.5;
        this.emit('amberEnd');
      }
    }
    if (this.arcWindow > 0) {
      this.arcWindow -= dt;
      if (this.arcWindow <= 0) this.arcChain = 0;   // the chain lapsed
    }
    // ---- CURSED SPEECH: THE THROAT, AND THE TWO DEBUFFS IT LEAVES --------
    // The gauge is ticked for every fighter (it returns immediately for the
    // twenty-one who have no voice) and the model is told EVERY frame rather
    // than only on a change, because the tier drives a continuous read too —
    // the throat glow pulses harder as the fill climbs inside a tier.
    if (this.cfg.throat) {
      const t = tickThroat(this, dt);
      this.model.setStrain?.(this.throatTier, this.throat / this.cfg.throat.max);
      if (t !== null) this.emit('throatTier', { tier: this.throatTier, silenced: isSilenced(this) });
    }
    // SLEEP and GET TWISTED are plain second counters on the VICTIM, like
    // every other debuff in this file, so the Inverted Spear's buff strip, the
    // round reset and the KO path already know what to do with them.
    if (this.sleepT > 0) {
      this.sleepT -= dt;
      if (this.sleepT <= 0) { this.sleepMult = 1; this.emit('sleepEnds'); }
    }
    if (this.twisted) {
      this.twisted.t -= dt;
      if (this.twisted.t <= 0) { this.twisted = null; this.emit('twistEnds'); }
    }

    if (this.cfg.charge) {
      const changed = tickCharge(this, dt);
      // The model is told EVERY frame rather than only on a change, because
      // the tier drives a continuous read too (the ring's fill inside tier 3),
      // and the call is two assignments.
      this.model.setCharge?.(this.chargeTier, chargeFrac(this));
      if (changed !== null) this.emit('chargeTier', { tier: this.chargeTier });
    }

    this.comboTimer += dt;
    if (this.comboTimer > 1.4) this.comboHits = 0;

    // resource regen
    const dashing = this.state === 'dash';
    const blockingNow = this.state === 'block' || this.state === 'simpleDomain';
    // HEAVENLY RESTRICTION: skipped entirely rather than clamped to a zero
    // maximum. There is no bar, so there is nothing to regenerate, and running
    // the line at all would leave a fighter with an empty resource ticking in
    // the profiler for no reason.
    if (!this.noCE && this.backlash <= 0 && this.state !== 'barrierBreak') {
      this.res.curCE = Math.min(this.res.maxCE, this.res.curCE + this.cfg.stats.ceRegen * dt);
    }
    if (!dashing && !blockingNow && this.state !== 'barrierBreak') {
      this.res.stamina = Math.min(this.cfg.stats.stamina, this.res.stamina + this.cfg.stats.staminaRegen * dt);
    }

    // ---- REVERSE CURSED TECHNIQUE (Sukuna, passive) -------------------------
    // A slow constant trickle back onto the health bar. Three things it
    // deliberately cannot do:
    //   · it cannot exceed his starting health — this heals, it does not buff
    //   · it cannot bring a dead body back. `alive` is false at 0 HP and false
    //     forever once instantko.js has stamped a fighter, so an execution or
    //     a transfiguration is not something RCT gets to argue with
    //   · it does not run during domain backlash, exactly like his CE regen
    // Declared per character, so only a config carrying `rct` regenerates.
    const rct = this.cfg.rct;
    if (rct && this.alive && this.backlash <= 0 && this.state !== 'ko' && this.state !== 'intro') {
      this.res.hp = Math.min(this.maxHP, this.res.hp + rct.perSecond * dt);
    }

    // FLOWING RED SCALE's sustain: a visible drip while the window holds, so
    // both players can tell at a glance that he is in the dangerous gear.
    if (this.buffs.redScale > 0 && Math.random() < 0.5) ctx.fx?.redScaleTick?.(this);

    // ---- PANDA: THE THREE CORES ---------------------------------------------
    // Ordered BEFORE the state logic and after every damage source has
    // resolved, which is the only correct place: a core that hit zero on this
    // tick must be destroyed and swapped out of before the fighter is asked
    // what it wants to do, or he spends a frame acting out of a dead core.
    if (this.allCoresT > 0) {
      this.allCoresT -= dt;
      if (this.allCoresT <= 0) {
        this.allCoresT = 0;
        // back to whichever core he was in when he cast it — or the first
        // surviving one, if that core died during the window
        const back = this.cores.find(c => c.key === this._allCoresFrom && c.alive)
          || this.cores.find(c => c.alive);
        if (back) this._setStance(back.key, { silent: true });
        this.model.setAllCores?.(false);
        const u = this.cfg.ultimate;
        this.backlash = u.backlash?.duration ?? 8;
        this.backlashGrowthMult = u.backlash?.growthMult ?? 0.5;
        this.emit('allCoresEnd');
      }
    }
    // GORILLA'S CURSED-ENERGY BILL. Canon: the form is stronger and faster "at
    // the cost of rapidly draining his cursed energy". It runs whether he is
    // attacking or not, it is halted by backlash exactly as regen is, and it is
    // free during the ultimate — which is the only reason THREE CORES is
    // allowed to use Gorilla's numbers for twelve seconds.
    const drain = this.stanceDef?.ceDrain;
    if (drain && this.alive && this.allCoresT <= 0 && this.backlash <= 0
      && this.state !== 'intro' && this.state !== 'ko') {
      this.res.curCE = Math.max(0, this.res.curCE - drain * dt);
    }
    this._coreCheck(ctx);

    this._stateLogic(input, ctx, dt);
    // Immediately after the state logic, so a taunt cut short by anything at
    // all this tick — a hit, a domain, a KO — drops its bubble on the same
    // frame the pose is interrupted rather than a frame later.
    this._tauntCheck();
    // ...and immediately after that, for exactly the same reason: an utterance
    // is alive only while its own `ct` state is, so ANYTHING that took his
    // state this tick has already cancelled the command, and this is where he
    // is charged for it. See `checkUtterance` in combat/speech.js.
    checkUtterance(this);
    this._physics(dt);
    this._faceOpponent(ctx, dt);
    this._props(ctx);
    this._shadowState(ctx, dt);
  }

  // ---- PANDA: CORE DESTRUCTION AND THE FORCED SWAP -------------------------
  // A core whose pool reaches zero is DESTROYED, permanently, for the rest of
  // the MATCH — the same permanence philosophy Megumi's shikigami already
  // carry, and like them it deliberately does NOT reset between rounds... with
  // one difference, stated here because it is a real design decision rather
  // than an oversight: it DOES reset, because a stock is a fresh body and
  // Megumi's ledger is about creatures he sent out to die rather than about
  // his own organs. See `resetForRound`.
  //
  // He is then forced into the next surviving core. Not offered the choice —
  // the core he was standing in has just exploded and the swap is not something
  // he decided to do, which is why it costs no cursed energy, runs its own
  // `coreBreak` reaction rather than the swap animation, and cannot be steered.
  _coreCheck(ctx) {
    if (!this.cores || this.instantKO) return;
    const c = this.cores[this.coreIndex];
    if (!c.alive || c.hp > 0) return;
    c.hp = 0;
    c.alive = false;
    this.emit('coreLost', { key: c.key, name: c.name, jp: c.jp, left: coresAlive(this) });
    const next = nextCore(this);
    // nothing left: `alive` is now false and the match reaps him this tick.
    // Deliberately no state change here — `_startKO`/`_reapDead` own the body
    // from that point and setting a state would fight them for it.
    if (next === null) return;
    this.coreIndex = next;
    this._setStance(this.cores[next].key, { silent: true });
    this.activeHit = null;
    this.move = null;
    this.swapWheel = null;
    this.iFrames = Math.max(this.iFrames, 30);   // he is not free, but he is not a punching bag
    this.setState('coreBreak', { clip: 'coreBreak' });
  }

  // Put him in a core. `silent` skips the swap animation — used by the forced
  // swap above and by the ultimate, both of which own their own reaction.
  // A REAL BUG, found by measuring the ultimate's scaling in a live match. The
  // first version gated on `coreIndexOf(key) >= 0` and returned false for
  // anything that was not one of the three cores — which is exactly what the
  // ULTIMATE'S `all` STANCE is. So THREE CORES, ONE BODY set its multiplier and
  // its duration correctly, announced itself correctly, and then silently did
  // not change the character at all: the measurement showed `stance=panda`,
  // `run=5`, and Cursed Palm still on RB after casting it.
  //
  // A STANCE AND A CORE ARE NOT THE SAME THING, and this method is about
  // stances. The core index only follows when the stance HAS a core; `all` does
  // not, so `coreIndex` stays wherever it was — which is also the correct
  // ruling for the ultimate, because he is drawing on every core at once but
  // his body is still standing in one, and that is the one that bleeds.
  _setStance(key, { silent = false } = {}) {
    if (!this.cfg.stances?.[key]) return false;
    this.stance = key;
    const i = coreIndexOf(this, key);
    if (i >= 0 && this.cores[i].alive) this.coreIndex = i;
    this.model.setStance?.(key);
    if (!silent && i >= 0) {
      this.emit('coreSwap', { key, name: this.cores[i].name, jp: this.cores[i].jp });
    }
    return true;
  }

  // Every pool to zero. Called only from combat/instantko.js — see the ruling
  // in the header of combat/cores.js.
  killAllCores() {
    if (!this.cores) return;
    for (const c of this.cores) { c.hp = 0; c.alive = false; }
  }

  // Megumi only: ease into/out of the shadow and tell the model about it.
  // Surfacing plays the rise clip so a submerged escape does not just pop
  // back into existence standing up.
  _shadowState(ctx, dt) {
    if (!this.model.setSubmerged) return;
    const want = this.shadowDash ? 1 : 0;
    const prev = this.submerged;
    this.submerged += (want - this.submerged) * Math.min(1, dt * 9);
    if (this.submerged < 0.02) this.submerged = 0;
    this.model.setSubmerged(this.submerged);
    if (prev > 0.5 && want === 0 && this.state !== 'ct' && !this.busy) {
      this.setState('special', { clip: 'shadowRise' });
      this.emit('shadowRise');
    }
    if (this.submerged > 0.4) {
      // the wake: a trail tearing along the surface behind him
      if (Math.random() < 0.6) {
        ctx.fx._spawn(this.pos.clone().setY(0.1), {
          color: Math.random() < 0.3 ? 0x8fb6d8 : 0x080a12, size: rand(0.3, 0.7),
          life: 0.35, opacity: 0.6, vel: v3(rand(-0.5, 0.5), rand(0.2, 1.2), rand(-0.5, 0.5))
        });
      }
    }
  }

  _stateLogic(input, ctx, dt) {
    const S = this.state;
    const stats = this.stats;

    // OPPONENT LOCK toggle (left stick press). Read BEFORE the state gates: it
    // is a camera/control preference rather than a move, so it must work while
    // stunned, mid-intro, or trapped in someone's domain — never something you
    // have to find a gap in the fight to press.
    if (input?.lockP) {
      this.lockOn = !this.lockOn;
      this.emit('lockToggle', { on: this.lockOn });
    }

    // ---- THE SUMMON RITUAL (Megumi) ---------------------------------------
    // The ONE input that reaches into the domain cast. While the barrier is
    // still being drawn, the SPECIAL button (B) abandons it and calls Mahoraga
    // instead. The bar has already been spent by castDomain, so the domain is
    // consumed either way — he never gets both. Once per match.
    if (S === 'castDomain' && this.cfg.ritual && input?.copyP
      && ctx.match?.ritual?.canStart(this)) {
      ctx.match.ritual.begin(this);
      return;
    }
    // The prompt, shown while the window is actually open and only the first
    // time it has ever been available to this fighter.
    if (S === 'castDomain' && this.cfg.ritual && !this.ritualUsed
      && ctx.match?.ritual && !this._ritualHinted) {
      this._ritualHinted = true;
      this.emit('ritualPrompt');
    }

    // states fully controlled by the domain system (rooted exits via rootT)
    // `sentenced` (the condemned) and `executing` (Higuruma with the blade up)
    // are the execution duel's two frozen states. Like `transfigured` they run
    // no state logic at all, which is what makes "gameplay freezes for both
    // players except the duel inputs" true rather than aspirational — the duel
    // reads those inputs itself, in domains/sentencing.js.
    // `devoured` joins the frozen states: the victim of DEVOUR takes no input
    // and runs no state logic for the length of the hold, exactly as
    // `transfigured` and `sentenced` do. The effect dispatcher owns them and
    // hands them back as a knockdown when it lets go.
    // `frozen` joins that list, and it is the strictest member of it. A fighter
    // trapped in one of Naoya's twenty-four frames runs NO state logic at all
    // for exactly one second: no movement, no attack, no block, no dash, no
    // special, no ultimate. Putting it here rather than writing five individual
    // checks is what makes that guarantee structural — there is no branch below
    // this line that a frozen fighter can reach, so there is no hole to find.
    //
    // The one input that still works is the camera lock-on toggle, read above
    // this gate for every state in the game because it is a control preference
    // and not a move. That is correct: being unable to move should not also
    // mean being unable to look.
    // `commanded` is NOT on this list, but it is handled by its own case below
    // and that case reads no input either — so for the length of the carry it
    // behaves like one of these. That is stated plainly rather than dressed
    // up: forced movement IS an input lock, and the honest defence of it is
    // that it is SHORT (1.1 s and 0.55 s before resistance and blocking take
    // their cuts, against Naoya's flat one second), that it deals no damage,
    // and that it hands the body back standing and neutral rather than in
    // hitstun. See the honesty note in the delivery report.
    if (['voided', 'simpleDomain', 'barrierBreak', 'castDomain', 'rooted', 'transfigured',
      'sentenced', 'executing', 'devoured', 'frozen'].includes(S)) return;
    if (S === 'ko' || S === 'victory' || S === 'intro') return;

    // BLACK FLASH — Yuji's SPECIAL: B inside the open window after
    // a technique connects. Outside the window (or on cooldown) the press
    // does nothing but a blip — inviting to attempt, no punishment.
    if (input?.copyP && this.cfg.special?.key === 'yuji_blackflash') {
      input.copyP = false; // the press belongs to the Flash either way
      if (this.specialCD <= 0 && this.bfT > 0 && this.bfT <= this.cfg.blackFlash.window) {
        this.bfT = 0;
        this._setSpecialCD(this.cfg.special.cooldown);
        ctx.effects.blackFlash(this);
      } else if (this.bfT > 0) {
        this.emit('noCE'); // pressed during the lockout: too early
      }
    }

    // NOBARA — THE SAME FLASH, A DIFFERENT BUTTON. Yuji's Flash IS his special
    // (B cashes a window any of his techniques opened); hers is the
    // other way round — her SPECIAL is the committed strike that opens the
    // window, and PUNCH cashes it. `cfg.blackFlash.confirm` is the only thing
    // that says so, and Yuji's config does not carry it, so his branch above
    // is untouched and this one can never fire for him.
    //
    // The press is taken ONLY while a window is actually open, because punch
    // has a day job. And it deliberately does NOT gate on `specialCD`: that
    // cooldown belongs to the strike, and gating the confirm on it would make
    // a landed strike's own window unusable.
    if (input?.punchP && this.cfg.blackFlash?.confirm === 'punch' && this.bfT > 0) {
      input.punchP = false;
      if (this.bfT <= this.cfg.blackFlash.window) {
        this.bfT = 0;
        ctx.effects.blackFlash(this);
      } else {
        this.emit('noCE'); // still inside the lockout: too early
      }
    }

    switch (S) {
      case 'idle': case 'walk': case 'run': case 'dash': {
        if (!input) { this._locomote({ x: 0, z: 0 }, false, ctx, dt); break; }
        // second press of the domain button releases your own domain early
        if (input.ultP && ctx.domains.isMyDomain(this)) { ctx.domains.dismiss(this); break; }
        // ultimate gate: MAX_CE at 100 AND full CURRENT_CE (or a domain's own
        // lower castThreshold — see `ultReady`)
        // HAKARI DURING JACKPOT. This used to refuse the cast outright —
        // "JACKPOT IS THE ULTIMATE" — which only made sense while Idle Death
        // Gamble was once per match. Domains are re-castable now, so if he can
        // still reach the gate mid-Jackpot he is allowed to open the parlor
        // again. A second Jackpot REFRESHES the 99-second clock rather than
        // stacking, and carries the outstanding RCT debt across
        // (domains/jackpot.js `_jackpot`).
        // TOJI — D-pad Right is ASSASSINATION, gated on a cooldown rather than
        // on the bar. Checked BEFORE `ultReady` because his `ultReady` is
        // permanently false; a pressed-but-not-ready button reports the
        // cooldown rather than being swallowed.
        if (input.ultP && this.cfg.ultimate?.kind === 'cooldown') {
          if (this.assassinReady && this.grounded) { this.startAssassination(ctx); break; }
          this.emit('assassinCooling', { t: this.assassinCD });
          break;
        }
        if (input.ultP && this.ultReady && this.grounded) {
          if (input.block) break; // LT+ult reserved for barrier break (domains handles it)
          if (this.cfg.domain) { ctx.domains.castDomain(this, ctx); break; }
          else if (this.cfg.ultimate.kind === 'transform') { this.startTransform(ctx); break; }
          else { this.startUltBurst(ctx); break; }
        }
        // MAHORAGA has no ultimate and no domain. D-pad Right is refused with
        // a line rather than silently swallowed, so the absence reads as a
        // design decision instead of a bug.
        if (input.ultP && this.cfg.noUltimate) { this.emit('noUltimate'); break; }
        // inside his own sword domain a held blade replaces punches and CTs
        if (this.heldSword && this.grounded && ctx.domains.isSwordField(this)
          && (input.punchP || input.heavyP || input.ct1P || input.ct2P)) { this.startSwordSwing(ctx); break; }
        // ---- HIGURUMA: TWO BUTTONS, NOTHING ELSE ---------------------------
        // While he holds the Executioner's Sword his ENTIRE moveset is these
        // two moves. The briefcase string, the gavel, Confiscation and the
        // summon are all gone — X and Y are dead buttons and say so once.
        // Movement, dash, jump and guard stay, because a fighter who cannot
        // walk is not playing a fighting game.
        if (this.execSword && ctx.domains.isSentencingField(this)) {
          if (this.swordDrawT > 0) break;                 // the draw is not cancellable
          if (input.ct1P && this.grounded) { if (this.startExecMove('slash', ctx)) break; }
          if (input.ct2P && this.grounded) { if (this.startExecMove('execution', ctx)) break; }
          if (input.punchP || input.heavyP || input.copyP) { this.emit('swordOnly'); break; }
          this._locomote(input.move, input.dash, ctx, dt);
          if (input.jumpP && this.grounded) {
            this.vel.y = stats.jumpVel;
            this.grounded = false;
            this.setState('jump', { clip: 'jump' });
            this.emit('jump');
          } else if (input.block && this.grounded) this.setState('block', { clip: 'block' });
          break;
        }
        // B: every character's SPECIAL lives here
        if (input.copyP && this.cfg.special) { if (this.trySpecial(input, ctx)) break; }
        // D-pad Left: TAUNT. Read AFTER the special (so a character whose
        // special and taunt could ever share a frame resolves the special
        // first) and BEFORE the technique buttons, but the ordering barely
        // matters — what matters is that it is behind the `block` and the
        // stick checks. Taunting while holding guard, or with the stick pushed,
        // would fire on the way into a block or a dash and read as an input
        // eaten by the game rather than a taunt the player asked for.
        if (input.tauntP && !input.block && Math.hypot(input.move.x, input.move.z) < 0.35) {
          if (this.tryTaunt(ctx)) break;
        }
        // Hollow Purple: Blue then Red while charged
        if (input.ct1P && this.purpleWindow > 0 && this.cfg.purple) { this.startPurple(ctx); break; }
        // Megumi: the two slots hold shikigami, not fixed techniques
        if (this.cfg.shikigami) {
          if (input.ct1P) { if (this.startShikigami('ct1', ctx)) break; else break; }
          if (input.ct2P) { if (this.startShikigami('ct2', ctx)) break; else break; }
        }
        // GETO: the two slots hold summons, not fixed techniques. RB is chaff
        // (first available, no choice), RT is whatever the curse wheel selected.
        if (this.cfg.curses) {
          if (input.ct1P) { this.startCurseSummon('ct1', ctx); break; }
          if (input.ct2P) { this.startCurseSummon('ct2', ctx); break; }
        }
        // CONFISCATION: a technique button Higuruma has taken off you does not
        // fire. It is not swallowed silently — the press reports the seizure,
        // and the HUD carries the locked slot for as long as it lasts.
        if (input.ct1P && this.slotLocked('ct1')) { this.emit('slotLocked', { slot: 'ct1' }); break; }
        if (input.ct2P && this.slotLocked('ct2')) { this.emit('slotLocked', { slot: 'ct2' }); break; }
        // NULLIFY's seal. Separate from Confiscation's `lockedSlot` because it
        // takes BOTH technique buttons rather than the one you lean on, and
        // because a fighter can be under both at once.
        if ((input.ct1P || input.ct2P) && this.ctSealT > 0) {
          this.emit('ctSealed', { t: this.ctSealT });
          break;
        }
        // THE INVERTED SPEAR'S OWN COOLDOWN. It sits on the move rather than on
        // the slot, so swapping to another weapon and back does not launder it.
        if (input.ct2P && this.equipped?.ct2?.effect === 'toji_nullify' && this.nullifyCD > 0) {
          this.emit('nullifyCooling', { t: this.nullifyCD });
          break;
        }
        if (input.ct1P) { if (this.startCT('ct1', ctx)) break; }
        // SUKUNA: from two Finger stacks RT stops being a plain button. The
        // press opens an 8-frame stance — let go inside it and you get Cleave,
        // keep holding and you have committed to the Fire Arrow charge. Below
        // two stacks this branch does not exist and RT is Cleave with no delay.
        if (input.ct2P && this.fireArrowReady && this.grounded) { this._startFireStance(); break; }
        if (input.ct2P) { if (this.startCT('ct2', ctx)) break; }
        if (input.heavyP && this.grounded) { if (this.startHeavy(ctx)) break; }
        if (input.punchP && this.grounded) { this.startPunch(0); break; }
        if (input.jumpP && this.grounded) {
          this.vel.y = stats.jumpVel;
          this.grounded = false;
          this.setState('jump', { clip: 'jump' });
          this.emit('jump');
          break;
        }
        if (input.block && this.grounded) { this.setState('block', { clip: 'block' }); break; }
        this._locomote(input.move, input.dash, ctx, dt);
        break;
      }

      case 'jump': case 'fall': {
        if (input) {
          const fwd = this._moveVec(input.move, ctx.camYaw);
          this.vel.x += fwd.x * 14 * dt;
          this.vel.z += fwd.z * 14 * dt;
          const sp = Math.hypot(this.vel.x, this.vel.z);
          const cap = stats.runSpeed * 1.1;
          if (sp > cap) { this.vel.x *= cap / sp; this.vel.z *= cap / sp; }
          if (input.punchP) { this.startPunch(0); break; }
        }
        if (this.vel.y < 0 && S === 'jump') this.setState('fall', { clip: 'fall' });
        if (this.grounded) { this.setState('land', { clip: 'land' }); this.emit('land'); }
        break;
      }

      case 'land':
        if (this.f >= 10) this.setState('idle', { clip: 'idle' });
        break;

      case 'block':
        if (!input || !input.block) { this.setState('idle', { clip: 'idle' }); break; }
        if (input.ultP && this.charged) break; // handled by domains (barrier break needs a domain up)
        break;

      case 'blockstun':
        if (this.f >= 12) this.setState(input?.block ? 'block' : 'idle', { clip: input?.block ? 'block' : 'idle' });
        break;

      case 'attack': {
        const m = this.move;
        if (!m) { this.setState('idle', { clip: 'idle' }); break; }
        // the heavy's windup can carry armor (see each character's config)
        if (this.f === 1 && m.armorFrames) this.armorFrames = m.armorFrames;
        if (this.f === m.startup) {
          this.activeHit = { def: m, frames: m.active, confirmed: false, isPunch: true };
          this.emit('swing', { move: m });
        }
        if (this.f > m.startup && this.f <= m.startup + m.active && this.activeHit) this.activeHit.frames--;
        // a whiffed punch does NOT break the Black Flash chain — punches can't
        // open a window, so they can't lose one either. Only a whiffed
        // technique breaks it (handled in the effect dispatcher).
        if (this.f > m.startup + m.active) this.activeHit = null;
        // chain window: queue next punch during active/early recovery
        // string length comes from the active set: 3 normally, 5 in Jackpot
        if (input?.punchP && m.kind === 'punch' && this.punchIndex < this._punchSet().length - 1) this.punchQueued = true;
        const total = m.startup + m.active + m.recovery;
        const cancelAt = m.startup + m.active + 3;
        // the string cancels into the heavy once the swing is done — the
        // knockdown is the string's ender. The heavy itself cancels into nothing.
        if (input?.heavyP && m.kind === 'punch' && this.f >= cancelAt && this.grounded) {
          if (this.startHeavy(ctx)) break;
        }
        if (this.punchQueued && this.f >= cancelAt) {
          this.startPunch(this.punchIndex + 1);
          break;
        }
        // Todo claps out of a whiffed swing's recovery — Boogie Woogie is
        // also his cancel
        if (input?.copyP && this.cfg.special?.key === 'todo_boogie'
          && this.f > m.startup + m.active && this.trySpecial(input, ctx)) break;
        if (this.f >= total) { this.setState('idle', { clip: 'idle' }); this.move = null; }
        break;
      }

      case 'ct': {
        const m = this.move;
        if (!m) { this.setState('idle', { clip: 'idle' }); break; }
        // Gojo: Blue can cancel straight into Hollow Purple once it has fired
        if (input?.ct1P && this.purpleWindow > 0 && this.cfg.purple && m.slot === 'ct2' && this.f > m.startup) {
          this.startPurple(ctx);
          break;
        }
        // Todo's recovery cancel works out of techniques too
        if (input?.copyP && this.cfg.special?.key === 'todo_boogie'
          && this.f > m.startup + m.active && this.trySpecial(input, ctx)) break;
        // HAKARI — RUSH BLOW cancels into the punch string on recovery. That
        // link is the whole approach: close, then string, then launcher.
        if (input?.punchP && m.chainPunch && this.grounded
          && this.f >= m.startup + m.active) { this.startPunch(0); break; }
        if (m.armorFrames && this.f === 1) this.armorFrames = m.armorFrames;
        // ---- THE TWO LONG TELLS --------------------------------------------
        // Both of these are moves whose whole balance is that the opponent can
        // see them coming, so the telegraph runs every frame of the startup
        // rather than firing once. Guarded on fields nobody else declares.
        //
        // NOBARA — the RESONANCE channel: the doll and the nail are already in
        // her hands (see _props) and the cursed energy visibly gathers on them
        // for the whole channel. Announced once on frame one with a sound cue
        // scaled to how much Essence is about to go in.
        if (m.channelPerEssence != null && this.f <= m.startup) {
          if (this.f === 1) this.emit('resonanceChannel', { essence: this.essence });
          ctx.fx.resonanceChannel?.(this, this.f / Math.max(1, m.startup));
        }
        // CHOSO — the PIERCING BLOOD load. One announcement on frame one; the
        // animation does the rest by simply not moving.
        if (m.effect === 'choso_piercing_blood' && this.f === 1) this.emit('piercingLoad');
        // ---- INUMAKI: THE UTTERANCE ---------------------------------------
        // The third long tell, and the loudest. It runs EVERY frame of the
        // startup rather than firing once, because the whole balance of the
        // character is that the opponent can see a command coming: the collar
        // pulls down, the cursed energy gathers at his throat, the markings
        // light, and the air in front of his mouth distorts, continuously,
        // for as long as he is speaking. `k` is how far through the word he
        // is, so the gather is a progress bar the opponent can read.
        if (m.commandKey && this.f <= m.startup) {
          const cmd = this.cfg.commands.defs[m.commandKey];
          ctx.match.speechfx?.utterance(this, this.f / Math.max(1, m.startup), cmd.color, cmd.weight);
        }
        if (this.f === m.startup) ctx.effects.fire(this, m, ctx);
        // multi-hit ults re-fire during active frames
        if (m.hits && this.f > m.startup && this.f < m.startup + m.active && (this.f - m.startup) % 14 === 0) {
          ctx.effects.fire(this, m, ctx, true);
        }
        if (this.f >= m.startup + m.active + m.recovery) { this.setState('idle', { clip: 'idle' }); this.move = null; }
        break;
      }

      // ---- COMMANDED — RUN AWAY 逃げろ / COME HERE 来い ---------------------
      // The only state in this project where a fighter's feet are moved by
      // somebody else's decision, and it is written to be as small as the
      // mechanic allows.
      //
      // WHAT IT DOES: writes `vel` and nothing else. The ordinary physics,
      // collision and arena-bounds pass in `update` resolves the result
      // exactly as it does for walking, which is what guarantees that forced
      // movement can never put anybody inside geometry or off a ledge that
      // walking could not — a promise a version that wrote `pos` could not
      // have made on any of the ten maps.
      //
      // WHAT IT DOES NOT DO: damage, hitstun, knockdown, or take the camera.
      // They come out of it standing, neutral, and able to act on the very
      // next frame. It is a repositioning, not a combo starter.
      //
      // IT DOES TAKE THEIR INPUT for its length, and there is no way around
      // that: a fighter who could keep walking would simply walk back and the
      // command would not exist. What keeps it fair is that it is SHORT and
      // that both cuts apply — a full-meter opponent loses 62% of it, and
      // holding guard when the word lands loses another 45%. A blocking Gojo
      // at MAX_CE 100 is carried for 0.23 s, which is a stumble.
      //
      // HOW IT ENDS: `tickForced` returns false — either the clock ran out, or
      // (for a pull) they arrived. And, like everything else here, it also
      // ends because SOMETHING ELSE TOOK THE STATE, for free.
      case 'commanded': {
        // the lock-on is deliberately released: they are facing the way the
        // word is taking them, not the way they would choose to look
        if (!tickForced(this, dt)) {
          this.vel.x *= 0.4; this.vel.z *= 0.4;
          this.setState('idle', { clip: 'idle' });
          this.emit('commandEnds');
        }
        break;
      }

      case 'swordPickup':
        if (this.f >= 14) this.setState('idle', { clip: 'idle' });
        break;

      // ---- TOJI: THE INVENTORY CURSE, HELD -----------------------------------
      // Stick picks a sector, release confirms. Time slows (match.slowmo) but
      // does not stop, and he cannot act — the risk is real and it is the whole
      // price of a kit with no other cost.
      case 'arsenal': {
        const a = this.cfg.arsenal;
        const w = this.arsenal;
        if (!w) { this.setState('idle', { clip: 'idle' }); break; }
        w.t += dt;
        // TAP vs HOLD, the same contract the shikigami and curse wheels use.
        // For Toji the tap is worth more than for either of them: a tap that
        // re-commits the weapon he already has is a free no-op, so tapping B
        // by mistake costs him nothing at all, while the hold is the only way
        // into the 26-frame draw he cannot cancel.
        if (!w.open && w.t >= TAP_MAX) {
          w.open = true;
          ctx.match.slowmo(0.12, a.timeScale ?? 0.55);
          this.emit('arsenalOpen');
        }
        if (w.open) {
          ctx.match.slowmo(0.08, a.timeScale ?? 0.55);
          const idx = this._wheelPick(w, input?.move ?? { x: 0, z: 0 });
          if (idx !== w.sel) { w.sel = idx; this.emit('arsenalMove'); }
        }
        if (!input?.copy || w.t >= (a.maxHold ?? 3.0)) this.commitWeapon(a.order[w.sel]);
        break;
      }

      // THE DRAW. Uncancellable except for a few frames of grace at the very
      // front, where LT still reaches a block. That grace is what keeps a
      // mistimed wheel from being a guaranteed full combo without making the
      // swap safe — which is exactly the risk the brief asks for.
      case 'arsenalSwap': {
        this.swapT--;
        if (input?.block && this.f <= (this.cfg.arsenal.swapGuardCancel ?? 4)) {
          this.swapT = 0;
          this.setState('block', { clip: 'block' });
          break;
        }
        if (this.swapT <= 0) {
          this.setState('idle', { clip: 'idle' });
          this.emit('weaponReady', { weapon: this.weapon });
        }
        break;
      }

      // ---- TOJI: THE ASSASSINATION SEQUENCE ---------------------------------
      // Entered only from a CONNECTED blitz (the effect dispatcher sets the
      // phase). Nothing interrupts it and he takes no input: the four strikes
      // fire off the clip's own clock in effects.update, and this state exists
      // to hold him there while they do.
      case 'assassinate': {
        const u = this.cfg.ultimate;
        if (this.f >= u.hitFrames) {
          this.assassinPhase = null;
          this.assassinHit = 0;
          this.setState('idle', { clip: 'idle' });
          this.emit('assassinEnd');
        }
        break;
      }

      // ---- FALLING BLOSSOM EMOTION -----------------------------------------
      // Held with the SPECIAL button. It ends when the button is released,
      // when the frame cap runs out, or when the stamina does — and any of
      // those three routes costs him the recovery, so it is a read rather than
      // a stance to live in. He cannot act out of it and it does not guard.
      case 'blossom': {
        const sp = this.cfg.special;
        this.blossomT--;
        this.res.stamina = Math.max(0, this.res.stamina - (sp.staminaDrain ?? 42) * dt);
        const done = !input?.copy || this.blossomT <= 0 || this.res.stamina <= 0.5;
        if (done) {
          this.blossomT = 0;
          this._setSpecialCD(sp.cooldown ?? 5);
          this.setState('ct', {
            move: {
              name: 'Falling Blossom (recover)', kind: 'ct', slot: 'special',
              startup: 0, active: 0, recovery: sp.recovery ?? 20, clip: 'ct2'
            }
          });
          this.emit('blossomClose', { hits: this.blossomHits });
        }
        break;
      }

      // ---- SUKUNA: FIRE ARROW, the tap/hold split ---------------------------
      // The stance. Release inside `tapFrames` and the press was a Cleave
      // after all; hold past it and the charge begins. He cannot act out of
      // either — this is the whole cost of having unlocked the move.
      case 'fireStance': {
        const fa = this.cfg.fireArrow;
        if (!fa) { this.setState('idle', { clip: 'idle' }); break; }
        if (!input?.ct2) {
          // tapped: this was Cleave. The 8 frames already spent are the price
          // of owning a button that does two things.
          this.setState('idle', { clip: 'idle' });
          this.startCT('ct2', ctx);
          break;
        }
        if (this.f >= (fa.tapFrames ?? 8)) {
          this.setState('fireCharge', {});
          this.fireT = 0;
          this.play(fa.chargeClip, { fade: 0.08 });
          this.emit('fireArrowCharge');
        }
        break;
      }

      // THE CHARGE. Long, loud and cancellable: LT aborts it into `cancelRecovery`
      // frames, and no cursed energy has been spent yet, so calling his bluff
      // costs him only the time. That is what makes the telegraph a mind game
      // instead of a free win for whoever is standing in front of it.
      case 'fireCharge': {
        const fa = this.cfg.fireArrow;
        if (!fa) { this.setState('idle', { clip: 'idle' }); break; }
        this.fireT++;
        if (input?.block) { this._cancelFireArrow('cancel'); break; }
        if (!input?.ct2) { this._releaseFireArrow(ctx); break; }
        if (this.fireT >= (fa.chargeFrames ?? 78)) { this._releaseFireArrow(ctx); break; }
        // the tell builds visibly the longer he commits to it
        if (this.fireT % 3 === 0) ctx.fx.fireArrowCharge(this, this.fireT / (fa.chargeFrames ?? 78));
        break;
      }

      // brief special recovery (Gojo's warp exit, Todo's clap)
      case 'special':
        // the Executioner's Sword materialize runs on its own clock — the
        // shared 12-frame special recovery would cut the posture change in
        // half, and the posture change is the point
        if (this.swordDrawT > 0) break;
        // NAOYA'S PROJECTION STANCE holds the state for as long as the trap is
        // live — through its startup AND its window — so the pose the opponent
        // is reading and the timers that decide whether they get frozen are the
        // same thing. He genuinely cannot act while it is armed, which is the
        // other half of why it is a commitment rather than a free layer.
        if (this.projArmT > 0 || this.projT > 0) break;
        if (this.f >= (this.cfg.special?.stateFrames ?? 12)) this.setState('idle', { clip: 'idle' });
        break;

      // ---- MAHORAGA — THE HEAVY CHARGE (LB) --------------------------------
      // Not a dash. He commits: the heading is LOCKED at the moment it starts
      // (see chargeDir, and _faceOpponent's turn rate), he armours through one
      // hit, and he cannot stop for `minFrames` even if the button is let go.
      // A sidestep beats it outright, which is exactly the point.
      case 'charge': {
        const hc = this.cfg.heavyCharge;
        if (!hc) { this.setState('idle', { clip: 'idle' }); break; }
        const d = this.chargeDir || this.forward();
        this.vel.x = damp(this.vel.x, d.x * hc.speed, 12, dt);
        this.vel.z = damp(this.vel.z, d.z * hc.speed, 12, dt);
        // shoulder contact: one hit, then the window closes
        if (this.f === 4) {
          this.activeHit = {
            def: { ...hc, kind: 'charge', type: hc.type || 'knockdown', src: 'punch' },
            frames: 999, confirmed: false, isPunch: false
          };
        }
        const released = !input?.dash;
        if ((released && this.f >= hc.minFrames) || this.f >= (hc.maxFrames ?? 70)
          || this.activeHit?.confirmed) {
          this.activeHit = null;
          this.chargeDir = null;
          this.chargeCD = hc.cooldown ?? 1;
          this.armorFrames = 0;
          this.setState('land', { clip: 'land' });   // he stops like a truck
          this.emit('chargeEnd');
        }
        break;
      }

      // MEGUMI — the SHIKIGAMI WHEEL. Held open with B. The stick
      // picks a sector, RB/RT picks which slot the pick lands in, release
      // confirms. Time is slowed (not stopped) by the match while this state
      // is live, and he cannot act — everything about it says "do this when
      // you have a beat, not in someone's face".
      // GETO shares this state with the same interaction contract — a radial
      // held open while time slows, gameplay running the whole time. What
      // differs is only what the sectors ARE and what confirming does, and both
      // of those are read off the config rather than branched on a character
      // id: `cfg.curses` means the sectors are his four special grades and
      // release SELECTS one, `cfg.shikigami` means the sectors are the six
      // shikigami and release BINDS one to a slot.
      // INUMAKI shares it too, on the same contract, and his is the closest to
      // Megumi's of the three: both hold TWO bindings and both use RB/RT to
      // choose which one the pick lands in. The only difference is that his
      // sectors go grey when his throat cannot afford them.
      case 'wheel': {
        const sp = this.cfg.special;
        const curses = this.cfg.curses;
        const cmds = this.cfg.commands;
        const order = cmds ? cmds.order : curses ? curses.specialOrder : this.cfg.shikigami.order;
        const w = this.wheel;
        if (!w) { this.setState('idle', { clip: 'idle' }); break; }
        w.t += dt;
        // THE HOLD THRESHOLD. Under it nothing has happened yet — no radial,
        // no slow-motion, no stick reading — so a tap costs exactly the frames
        // it takes to press and release a button and reads as one press.
        if (!w.open && w.t >= TAP_MAX) {
          w.open = true;
          ctx.match.slowmo(0.12, sp.timeScale ?? 0.62);
          this.emit('wheelOpen');
        }
        if (w.open) {
          ctx.match.slowmo(0.08, sp.timeScale ?? 0.62);
          // stick angle -> nearest AVAILABLE sector. Deadzoned, so a neutral
          // stick keeps the default instead of snapping to whatever is at
          // angle zero.
          const idx = this._wheelPick(w, input?.move ?? { x: 0, z: 0 });
          if (idx !== w.sel) { w.sel = idx; w.changed = true; this.emit('wheelMove'); }
          // slot picking is for the fighters who hold TWO bindings — Megumi and
          // Inumaki. Geto holds one selection, so for him these presses would
          // be noise.
          if (!curses) {
            if (input?.ct1P && w.slot !== 'ct1') { w.slot = 'ct1'; this.emit('wheelMove'); }
            if (input?.ct2P && w.slot !== 'ct2') { w.slot = 'ct2'; this.emit('wheelMove'); }
          }
        }
        // release (or the hold cap) confirms. A tap confirms `w.def`, which is
        // the same value `w.sel` still holds — the radial never opened to move
        // it — so both paths land in one place and there is no second commit
        // routine to keep in step with this one.
        if (!input?.copy || w.t >= (sp.maxHold ?? 3.5)) {
          const key = order[w.sel];
          // `avail` was filtered at open time and the stick can only land on a
          // live sector, so this cannot be a corpse. Kept as a guard because a
          // shikigami can die DURING the hold.
          // A COMMAND CANNOT DIE, but it can become unaffordable DURING the
          // hold — the gauge is still recovering (or he was hit and paid an
          // interruption penalty) while the ring is open. So the same guard
          // that catches a shikigami dying mid-hold catches that.
          const dead = cmds
            ? !affordable(this, cmds.defs[key])
            : curses
              ? ctx.match.curses.isLost(this, key)
              : ctx.match.shikigami.isLost(this, key);
          if (dead && cmds) {
            this.emit('throatTooHigh', { cmd: cmds.defs[key] });
            this._setSpecialCD(sp.cooldown);
            this.wheel = null;
            this.setState('special', { clip: 'idle' });
            break;
          }
          if (cmds) {
            bindCommand(this, w.slot, key);
            this.emit('wheelConfirm', { key, slot: w.slot, command: true, tapped: !w.open });
            this._setSpecialCD(sp.cooldown);
            this.wheel = null;
            this.setState('special', { clip: 'idle' });
            break;
          }
          if (dead) {
            this.emit('curseBlocked', {
              text: (curses ? this.cfg.curses.defs[key].short : key.toUpperCase()) + ' IS GONE'
            });
          } else if (curses) {
            ctx.match.curses.select(this, key);
            this.emit('wheelConfirm', { key, slot: 'ct2', curse: true, tapped: !w.open });
          } else {
            ctx.match.shikigami.bind(this, w.slot, key);
            this.emit('wheelConfirm', { key, slot: w.slot, tapped: !w.open });
          }
          this._setSpecialCD(sp.cooldown);
          this.wheel = null;
          this.setState('special', { clip: 'idle' });
        }
        break;
      }

      // ---- PANDA: THE CORE RADIAL, AND THE SWAP THAT FOLLOWS IT -----------
      // Same contract as `wheel` above — held open with B, time slowed, he
      // cannot act — and then release commits him to a SWAP ANIMATION he
      // cannot cancel. That second half is Toji's `arsenalSwap`, deliberately:
      // a core swap changes more than a weapon swap does, so it costs more
      // frames and it is a real risk to press under pressure.
      case 'coreWheel': {
        const sp = this.cfg.special;
        const w = this.swapWheel;
        if (!w) { this.setState('idle', { clip: 'idle' }); break; }
        w.t += dt;
        if (!w.open && w.t >= TAP_MAX) {
          w.open = true;
          ctx.match.slowmo(0.12, sp.timeScale ?? 0.62);
          this.emit('wheelOpen');
        }
        if (w.open) {
          ctx.match.slowmo(0.08, sp.timeScale ?? 0.62);
          const idx = this._wheelPick(w, input?.move ?? { x: 0, z: 0 });
          if (idx !== w.sel) { w.sel = idx; w.changed = true; this.emit('wheelMove'); }
        }
        if (!input?.copy || w.t >= (sp.maxHold ?? 3.5)) {
          const key = w.order[w.sel];
          const c = this.cores[coreIndexOf(this, key)];
          // `avail` was filtered at open time, but a core CAN be destroyed
          // during the hold — the wheel does not stop the fight — so this is
          // a real guard rather than a formality.
          if (!c || !c.alive || c.hp <= 0) {
            this.emit('coreBlocked', { text: (c?.short ?? key.toUpperCase()) + ' IS GONE' });
            this.swapWheel = null;
            this.setState('idle', { clip: 'idle' });
            break;
          }
          this.swapWheel = null;
          this._pendingCore = key;
          this._setSpecialCD(sp.cooldown);
          this.setState('coreSwap', { clip: 'swap' });
          this.emit('coreSwapStart', { key, tapped: !w.open });
        }
        break;
      }

      // THE SWAP WINDOW. 26 frames of nothing: no armour, no invulnerability,
      // no cancel, and the core does not actually change until the HALFWAY
      // point — so a Panda punished at frame 5 eats it in the core he was
      // trying to leave, and one punished at frame 20 eats it in the one he was
      // trying to reach. That asymmetry is the mind game and it is why the
      // swap is a decision rather than a free reconfiguration.
      case 'coreSwap': {
        const half = Math.round((this.cfg.cores?.swapFrames ?? 26) / 2);
        if (this.f === half && this._pendingCore) {
          this._setStance(this._pendingCore);
          this._pendingCore = null;
        }
        if (this.f >= (this.cfg.cores?.swapFrames ?? 26)) {
          this.setState('idle', { clip: 'idle' });
        }
        break;
      }

      // A CORE HAS BEEN DESTROYED. A staggering reaction he does not choose and
      // cannot cancel, with a few frames of invulnerability on it so that
      // losing a core is not automatically losing the next one too.
      case 'coreBreak':
        if (this.f >= 40) this.setState('idle', { clip: 'idle' });
        break;

      // NANAMI — the 7:3 timing sweep. He stands exposed while the marker
      // runs; the second press stops it, running off the end is a miss.
      case 'ratioSweep': {
        const sp = this.cfg.special;
        const sweepT = Math.max(sp.minSweep ?? 0.45,
          (sp.sweepTime ?? 0.8) * Math.pow(sp.sweepAccel ?? 0.92, this.ratioSweepN));
        this.ratioSweep = Math.min(1, this.f / (sweepT * 60));
        if (input?.copyP) { this._ratioResolve(this.ratioSweep, sp); break; }
        if (this.ratioSweep >= 1) this._ratioResolve(null, sp);
        break;
      }

      // ---- TAUNT --------------------------------------------------------
      // FULL STARTUP, NO ARMOR, NO CANCEL INTO ANYTHING. The only exits are
      // the clock and the three defensive ones the brief asks for: move, dash,
      // block. Notably NOT punch, technique, special, jump or ultimate — being
      // able to bait with a taunt and then convert off it would make it a
      // gameplay tool, which it is expressly not.
      //
      // Getting hit is not handled here at all. A hit puts him in `hitLight` /
      // `hitHeavy` / `launched` through the normal pipeline, and `_tauntCheck`
      // sees the state has left `taunt` and tears the bubble down that frame.
      case 'taunt': {
        const tn = this.taunt;
        if (!tn) { this.setState('idle', { clip: 'idle' }); break; }
        tn.t += dt;
        // the bubble pops on its own beat inside the animation, not at frame 0
        if (!tn.said && tn.def.say && tn.t >= (tn.def.at ?? 0.6)) {
          tn.said = true;
          this.emit('tauntSay', { def: tn.def });
        }
        const mv = input?.move ?? { x: 0, z: 0 };
        if (input && (Math.hypot(mv.x, mv.z) > 0.35 || input.dash || input.block)) {
          this.emit('tauntCancel', { def: tn.def });
          this.setState(input.block ? 'block' : 'idle', { clip: input.block ? 'block' : 'idle' });
          break;
        }
        if (tn.t >= tn.def.dur) {
          // COMPLETED, uninterrupted. The only place the optional meter bonus
          // can ever be paid — an interrupted taunt exits through
          // `_tauntCheck` above, which never reaches this branch.
          tn.done = true;
          if (TAUNT_GRANTS_METER) {
            this.res.curCE = Math.min(this.res.maxCE, this.res.curCE + TAUNT_METER_BONUS);
            this.emit('tauntReward', { amount: TAUNT_METER_BONUS });
          }
          this.emit('tauntEnd', { def: tn.def });
          this.setState('idle', { clip: 'idle' });
        }
        break;
      }

      case 'hitLight': case 'hitHeavy':
        if (this.f >= (this.hitstun || 16)) this.setState('idle', { clip: 'idle' });
        break;

      case 'launched':
        if (this._tryTech(input)) break;
        if (this.grounded) {
          this.juggle = 0;
          this.otgUsed = false;
          this.setState('knockdown', { clip: 'knockdown' });
          this.emit('thud');
        }
        break;

      case 'knockdown':
        if (this._tryTech(input)) break;
        if (this.f >= 55) {
          this.iFrames = 34; // wakeup invulnerability
          this.setState('getup', { clip: 'getup' });
        }
        break;

      case 'getup':
        if (this.f >= 36) this.setState('idle', { clip: 'idle' });
        break;

      case 'techRise':
        if (this.f >= TECH_RISE_FRAMES) this.setState('idle', { clip: 'idle' });
        break;

      case 'guardBreak':
        if (this.f >= 58) { this.res.stamina = 30; this.setState('idle', { clip: 'idle' }); }
        break;
    }
  }

  // LOCKED (default): character-relative. Stick up/down drives forward/back
  // along the facing axis (which the soft lock keeps pointed at the opponent),
  // stick left/right strafes around them. The stick never rotates the fighter.
  //
  // UNLOCKED: camera-relative, the way a third-person action game moves. Stick
  // up is "away from the camera", and _faceOpponent turns the fighter to match.
  // Without this the two halves disagree and unlocked movement is unusable.
  _moveVec(move, camYaw) {
    const yaw = this.lockOn || camYaw == null ? this.facing : camYaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const fwd = -move.z;     // stick up (-z) = advance
    const strafe = move.x;   // stick right = strafe to the fighter's right
    return v3(sin * fwd - cos * strafe, 0, cos * fwd + sin * strafe);
  }

  _locomote(move, dashHeld, ctx, dt) {
    // `this.stats` — see the getter. Identical to `cfg.stats` for everyone
    // except Panda, whose three cores each carry their own movement numbers.
    const stats = this.stats;
    const m = this._moveVec(move, ctx.camYaw);
    const mag = Math.hypot(m.x, m.z);
    const canDash = dashHeld && this.res.stamina > 1 && mag > 0.1;
    // SHADOW TRAVEL (passive, inside his own domain): the dash stops being a
    // dash and becomes a submerge. He drops under the shadow line, moves fast
    // and untargetable, and surfaces wherever he lets go. Only works while he
    // is actually standing on his own shadow — step off it and it is a normal
    // dash again, which is what keeps the domain's edges meaningful.
    const trav = ctx.domains.shadowTravel?.(this);
    this.shadowDash = !!(trav && canDash);
    if (this.shadowDash) {
      const t = trav.travel;
      this.res.stamina = Math.max(0, this.res.stamina - t.drain * dt);
      this.vel.x = damp(this.vel.x, m.x * t.speed, 16, dt);
      this.vel.z = damp(this.vel.z, m.z * t.speed, 16, dt);
      if (this.state !== 'dash') { this.setState('dash', { clip: 'shadowDive' }); this.emit('shadowDive'); }
      return;
    }
    // MAHORAGA: the dash button is a HEAVY CHARGE instead. It takes over the
    // input entirely — there is no dash on him to fall back to.
    const hc = this.cfg.heavyCharge;
    if (hc && dashHeld && this.grounded && this.chargeCD <= 0 && mag > 0.1) {
      this.chargeDir = this._moveVec(move, ctx.camYaw).normalize();
      this.armorFrames = Math.max(this.armorFrames, hc.armorFrames ?? 0);
      this.setState('charge', { clip: 'dash' });
      this.emit('charge');
      return;
    }
    let speed = 0, next = 'idle';
    if (canDash) {
      speed = stats.dashSpeed; next = 'dash';
      this.res.stamina = Math.max(0, this.res.stamina - stats.dashDrain * dt);
    } else if (mag > 0.55) { speed = stats.runSpeed; next = 'run'; }
    else if (mag > 0.05) { speed = stats.walkSpeed; next = 'walk'; }
    speed *= this.speedMult;
    this.vel.x = damp(this.vel.x, m.x * speed, 14, dt);
    this.vel.z = damp(this.vel.z, m.z * speed, 14, dt);
    if (next !== this.state) {
      const clip = next === 'dash' ? 'dash' : next === 'idle' ? 'idle' : next;
      this.setState(next, { clip, fade: 0.14 });
      if (next === 'dash') {
        // DASH I-FRAMES, at the FRONT of the dash. Declared per character and
        // absent everywhere except Toji, so nobody else's dash changes. This is
        // his defensive identity: he does not tank hits, he isn't there.
        const inv = this._tune('dashIFrames') ?? 0;
        if (inv > 0) this.iFrames = Math.max(this.iFrames, inv);
        this.emit('dash');
      }
    } else if (['idle', 'walk', 'run'].includes(next)) {
      // keep the loop running (no restart)
      this.anim.play(this._clip(next), { fade: 0.14, restart: false, speed: this.speedMult * (next === 'walk' ? 0.9 + mag * 0.3 : 1) });
    }
    // FOOTFALLS. A fighter heavy enough to declare `stepShake` reports each
    // plant so the match can shake the camera and thump the floor under it.
    // Fires twice a cycle, near the two plant keys.
    if (this.cfg.size?.stepShake && (next === 'walk' || next === 'run')) {
      const c = this.anim.current;
      if (c) {
        const ph = ((this.anim.time % c.dur) + c.dur) % c.dur / c.dur;
        const half = ph >= 0.15 && ph < 0.65 ? 0 : 1;
        if (this._stepPhase !== half) { this._stepPhase = half; this.emit('step'); }
      }
    }
  }

  _physics(dt) {
    // FROZEN: trapped in a frame, and the frame it is trapped in did not have
    // gravity in it. A body caught mid-launch hangs in the air for the full
    // second and then resumes falling — which is both the correct reading of
    // the mechanic and, in practice, the clearest possible signal that
    // something has gone very wrong for that player.
    //
    // Velocity is zeroed on entry (FreezeSystem.freeze) rather than here, so a
    // freeze cannot be used to cancel a knockback that was already owed.
    if (this.frozenT > 0) return;
    if (!this.grounded) this.vel.y -= GRAVITY * dt;
    const wasFast = Math.hypot(this.vel.x, this.vel.z);
    const before = this.bounds ? { x: this.pos.x, z: this.pos.z } : null;
    this.pos.addScaledVector(this.vel, dt);

    const b = this.bounds;
    if (b) {
      // walls first, then the outer edge
      b.resolveWalls(this.pos, 0.36);
      b.clampXZ(this.pos, 0.35);
      // A LAUNCHED BODY IS A DAMAGE SOURCE. If a wall just stopped someone
      // travelling fast, the wall pays for it — that is the "launched bodies
      // hitting geometry" case, and it is the most satisfying one.
      if (before && wasFast > 7 && ['launched', 'knockdown', 'hitHeavy'].includes(this.state)) {
        const stopped = Math.hypot(this.pos.x - before.x, this.pos.z - before.z) < wasFast * dt * 0.4;
        if (stopped && this._wallHitCD <= 0) {
          this._wallHitCD = 0.35;
          this.emit('wallSlam', { power: wasFast });
        }
      }
      this._wallHitCD = Math.max(0, (this._wallHitCD ?? 0) - dt);
      // FLOOR: the highest walkable surface at or below us. While rising we
      // ignore anything overhead so a jump passes through a mezzanine edge
      // rather than snapping onto it.
      const ceil = this.vel.y > 0 ? this.pos.y - 0.05 : this.pos.y + STEP_TOL;
      const g = b.floorAt(this.pos.x, this.pos.z, this.grounded ? this.groundY + STEP_TOL : ceil);
      this.groundY = g;
      if (this.pos.y <= g + 1e-4 && this.vel.y <= 0) {
        if (!this.grounded && this.vel.y < -1) this.emit('land');
        this.pos.y = g;
        this.vel.y = 0;
        this.grounded = true;
      } else this.grounded = false;
    } else {
      if (this.pos.y <= 0) {
        this.pos.y = 0;
        if (!this.grounded) this.vel.y = 0;
        this.grounded = true;
      } else this.grounded = false;
      const r = Math.hypot(this.pos.x, this.pos.z);
      const lim = this.boundRadius;
      if (r > lim) {
        const s = lim / r;
        this.pos.x *= s; this.pos.z *= s;
      }
    }

    // A STANDING DOMAIN'S INNER WORLD, on any map. This has to sit outside the
    // branch above: mapped arenas resolve their own walls and never consult a
    // radius, so without this the parlor's clamp simply did not exist on every
    // map that has collision bounds (i.e. all of them).
    if (this.domainRadius != null) {
      const dr = Math.hypot(this.pos.x, this.pos.z);
      if (dr > this.domainRadius) {
        const s = this.domainRadius / dr;
        this.pos.x *= s; this.pos.z *= s;
      }
    }

    // ground friction outside movement states
    if (this.grounded && !['walk', 'run', 'dash'].includes(this.state)) {
      this.vel.x = damp(this.vel.x, 0, 8, dt);
      this.vel.z = damp(this.vel.z, 0, 8, dt);
    }
  }

  _faceOpponent(ctx, dt) {
    // a Boogie Woogie victim keeps aiming where they WERE for a beat — that
    // stale facing is what makes their committed swing whiff into empty space
    if (this.aimLag > 0) { this.aimLag -= dt; return; }
    if (['knockdown', 'getup', 'launched', 'ko', 'hitHeavy'].includes(this.state)) return;
    let target;
    if (this.aimOverride) {
      // something other than the opponent has been designated as the thing to
      // face — the CPU uses this to actually connect with a summon
      target = yawBetween(this.pos, this.aimOverride);
    } else if (this.lockOn) {
      target = yawBetween(this.pos, ctx.opponent.pos);
    } else {
      // unlocked: turn toward the way we are moving, and hold still otherwise
      const m = Math.hypot(this.vel.x, this.vel.z);
      if (m < 0.6) return;
      target = Math.atan2(this.vel.x, this.vel.z);
    }
    // CANNOT TURN SHARPLY: the heavy charge uses its own (very low) turn rate,
    // which is what makes stepping around it work.
    const rate = this.state === 'charge'
      ? (this.cfg.heavyCharge?.turnRate ?? 6)
      : (this.state === 'run' || this.state === 'dash' ? 6 : 10);
    this.facing = angleDamp(this.facing, target, rate, dt);
  }

  _props(ctx) {
    const m = this.model;
    if (m.props.has('katana')) {
      // in his own sword domain the katana is only in hand while carried
      // (or being snatched); outside it, the old CT/cast behavior stands
      const want = ctx.domains.isSwordField(this)
        ? (this.heldSword || this.state === 'swordPickup')
        : ['ct', 'castDomain'].includes(this.state);
      m.attachProp('katana', want ? 'hand' : 'away');
    }
    if (m.props.has('tool')) {
      // Megumi's cursed tool: drawn for the punch string (they are sword cuts),
      // the heavy, techniques and the victory pose; slung on his back otherwise
      const drawn = ['attack', 'ct', 'castDomain', 'victory'].includes(this.state);
      m.attachProp('tool', drawn ? 'hand' : 'back');
    }
    // HIGURUMA. The briefcase is in his hand ALWAYS — it is his stance, his
    // punch string and his heavy — right up until the courtroom hands him the
    // Executioner's Sword, at which point the case is gone and so is every
    // move that used it. The two are never both in frame.
    if (m.props.has('sword')) {
      const armed = this.execSword;
      m.attachProp('sword', armed ? 'hand' : 'away');
      m.attachProp('case', armed ? 'away' : 'hand');
    }
    // ---- TOJI: exactly one tool in hand, ever ------------------------------
    // Everything he is NOT holding is inside the inventory curse, so it is not
    // on his back either — the stow slot is under the world. The curse itself
    // is only out while the wheel is held or a draw is running, and its jaw
    // opens across the draw so the weapon visibly comes out of its mouth.
    if (this.cfg.arsenal && m.props.has('curse')) {
      const eq = this.weapon;
      for (const k of this.cfg.arsenal.order) {
        if (!m.props.has(k)) continue;
        // during the draw the NEW weapon is not in his hand yet — it is still
        // coming out of the curse, so nothing is held for those frames
        m.attachProp(k, (k === eq && this.state !== 'arsenalSwap' && this.state !== 'arsenal') ? 'hand' : 'away');
      }
      const showCurse = this.state === 'arsenal' || this.state === 'arsenalSwap';
      m.attachProp('curse', showCurse ? 'hand' : 'away');
      if (showCurse) {
        // shut while he is choosing, gaping while he reaches in
        const k = this.state === 'arsenalSwap'
          ? Math.sin(Math.min(1, this.f / Math.max(1, this.cfg.arsenal.swapFrames)) * Math.PI)
          : 0.15;
        m.setCurseOpen?.(k);
      }
    }
    // ---- NOBARA: hammer, nail, doll ----------------------------------------
    // The HAMMER lives on her shoulder — that is the stance, and it is half
    // the character — and drops into her hand for anything she swings it with.
    // The NAIL is only out for Hairpin and its detonation. The DOLL is only
    // out for Resonance and the Full Release, which is exactly the point: the
    // doll appearing IS the tell the opponent is supposed to react to, so it
    // must never be visible at any other moment.
    if (m.props.has('hammer')) {
      const eff = this.state === 'ct' ? this.move?.effect : null;
      const swinging = this.state === 'attack' || eff === 'nobara_bf_strike'
        || this.state === 'victory';
      // BOTH HANDS ARE FULL during a Resonance — the doll is in the left and
      // the nail is in the right — so the hammer goes away entirely rather
      // than sharing a bone with the nail. Found in the viewer: without this
      // the hammer and the nail occupied the same hand and the channel read
      // as her waving a hammer instead of as the tell.
      const bothHands = eff === 'nobara_resonance' || eff === 'nobara_full_release';
      m.attachProp('hammer', bothHands ? 'away' : swinging ? 'hand' : 'shoulder');
    }
    if (m.props.has('nail')) {
      const eff = this.state === 'ct' ? this.move?.effect : null;
      // thrown from the left hand, DRIVEN from the right — the left one is
      // holding the doll during a Resonance
      const drive = eff === 'nobara_resonance' || eff === 'nobara_full_release';
      const thrown = eff === 'nobara_hairpin' || eff === 'nobara_detonate';
      m.attachProp('nail', drive ? 'drive' : thrown ? 'hand' : 'away');
    }
    if (m.props.has('doll')) {
      const eff = this.state === 'ct' ? this.move?.effect : null;
      m.attachProp('doll',
        (eff === 'nobara_resonance' || eff === 'nobara_full_release') ? 'hand' : 'away');
    }
    if (m.props.has('blade')) {
      const inCT = this.state === 'ct' && this.move && ['nanami_cleave', 'nanami_collapse'].includes(this.move.effect);
      // his heavy is the blunt sword brought down — it needs the blade in hand
      const inHeavy = this.state === 'attack' && this.move?.kind === 'heavy';
      m.attachProp('blade', inCT || inHeavy || this.state === 'victory' ? 'hand' : 'back');
    }
  }

  // render-time: apply interpolated transform + animation
  applyRender(alpha, frameDt, timeScale) {
    const g = this.model.group;
    g.position.lerpVectors(this.prevPos, this.pos, alpha);
    g.rotation.y = this.prevFacing + (this.facing - this.prevFacing) * alpha;
    this.anim.update(frameDt * timeScale);
    this.model.update(frameDt * timeScale);
  }
}
