// FIGHTER — the state machine, movement, resources (MAX_CE / CURRENT_CE /
// stamina), combo bookkeeping and animation driving for one seat.
// A faithful port of the old game's numbers on a much smaller surface: the
// bespoke per-character systems live behind `special` archetypes in
// combat/effects, not in here.
import * as THREE from 'three';
import { clamp, damp, angleDamp, yawBetween, v3, mulberry32, F } from '../core/math.js';
import { AnimPlayer } from '../art/anim/player.js';
import { judgeHit } from './hits.js';
import { hitMult } from './hits.js';

export const GRAVITY = 26;
export const DASH_BURST = { speed: 2.0, time: 0.17, costSeconds: 0.55, window: 0.13 };
const STEP_TOL = 0.55;
const TECH_HEIGHT = 0.8, TECH_KD_FRAMES = 6, TECH_RISE_FRAMES = 15;
export const NEUTRAL = ['idle', 'walk', 'run', 'dash'];
export const FROZEN = ['voided', 'castDomain', 'rooted', 'frozen', 'ko', 'victory', 'intro', 'grabbed'];

let _uid = 0;

export class Fighter {
  constructor({ config, model, clips, index = 0, bounds = null, spawn, facing, pick = null, seed }) {
    this.uid = ++_uid;
    this.cfg = config;
    this.model = model;
    this.pick = pick || config.id;
    this.index = index;
    this.bounds = bounds;
    this.arenaRadius = 22;
    this.domainRadius = null;
    this.groundY = 0;
    this.anim = new AnimPlayer(model.bones, clips);
    this.spawn = (spawn || v3(index === 0 ? -2.4 : 2.4, 0, 0)).clone();
    this.spawnFacing = facing ?? (index === 0 ? Math.PI / 2 : -Math.PI / 2);
    this.pos = this.spawn.clone();
    this.vel = new THREE.Vector3();
    this.facing = this.spawnFacing;
    this.prevPos = this.pos.clone();
    this.prevFacing = this.facing;
    this.grounded = true;
    this.seed = seed ?? (((Math.random() * 0x7fffffff) | 0) ^ (index * 0x9e3779b1));
    this.rng = mulberry32(this.seed);
    const s = config.stats;
    this.res = { hp: s.hp, maxCE: s.startMaxCE, curCE: s.startMaxCE, stamina: s.stamina };
    this.state = 'idle'; this.f = 0; this.move = null;
    this.punchIndex = 0; this.punchQueued = false; this.activeHit = null;
    this.iFrames = 0; this.armorFrames = 0; this.hitstun = 0;
    this.juggle = 0; this.otgUsed = false; this.techLock = false;
    this.comboHits = 0; this.comboTimer = 0; this.comboDmg = 0;
    this.buffs = {};           // name -> seconds left
    this.mods = {};            // name -> { dmg, speed, startup } while buffed
    this.backlash = 0; this.backlashGrowthMult = 1;
    this.specialCD = 0; this.specialCDMax = 1;
    this.taunt = null; this.tauntCD = 0; this.tauntN = 0;
    this.ratioPrimed = 0; this.ratioMark = false; this.ratioSweep = null;
    this.copySlot = null; this.purpleWindow = 0;
    this.bfT = 0; this.bfBase = 0; this.bfChain = 0;
    this.stacks = 0;           // generic per-match stack counter (fingers, etc.)
    this.lockOn = true;
    this.events = [];
    this.alive = true;
    this.stocks = 1;
    this.dashBurstT = 0; this.dashBurstDir = v3();
    this._dirEdgeT = 9; this._dashEdgeT = 9; this._prevMoveMag = 0; this._prevDashHeld = false;
    this.lastCT = null;
    this.slotUse = { ct1: 0, ct2: 0, special: 0 };
    this.stance = null;        // generic stance key (cycled by 'stance' specials)
    this.shield = null;        // { hits, t } directional guard object
    this.counter = null;       // { t, dmg } active counter window
    this.rootT = 0; this.frozenT = 0;
    this.speedMult = 1;
    this.hitsDealt = 0; this.hitsTaken = 0;
    this.buffer = [];          // input buffer of edge presses (see _bufferInput)
    this.anim.play('idle');
    this.model.group.position.copy(this.pos);
  }

  // ---- derived ------------------------------------------------------------
  get stats() { return this.cfg.stats; }
  get noCE() { return !!this.cfg.noCursedEnergy; }
  get ceCeiling() { return this.cfg.stats?.ceCeiling ?? 100; }
  get maxHP() { return this.cfg.stats.hp; }
  get charged() { return !this.noCE && this.res.maxCE >= 100 && this.res.curCE >= this.res.maxCE - 0.01; }
  get ultReady() {
    if (this.noCE) return this.cfg.ultimate?.kind === 'cooldown' ? this.specialCD <= 0 : false;
    const th = this.cfg.domain?.castThreshold;
    if (th == null) return this.charged;
    const want = 100 * th;
    return this.res.maxCE >= want && this.res.curCE >= want - 0.01;
  }
  get dmgMult() {
    let m = this.stats.damageScale;
    for (const k in this.mods) if (this.buffs[k] > 0 && this.mods[k].dmg) m *= this.mods[k].dmg;
    if (this.buffs.voidDebuff > 0) m *= 0.85;
    if (this.bfChain > 0) m *= 1 + this.bfChain * (this.cfg.blackFlash?.chainDmg ?? 0.06);
    if (this.stacks > 0 && this.cfg.special?.key === 'sukuna_finger') m *= Math.pow(1.09, this.stacks);
    return m;
  }
  get moveSpeedMult() {
    let m = this.speedMult;
    for (const k in this.mods) if (this.buffs[k] > 0 && this.mods[k].speed) m *= this.mods[k].speed;
    if (this.buffs.voidDebuff > 0) m *= 0.72;
    return m;
  }
  get startupMult() {
    let m = 1;
    for (const k in this.mods) if (this.buffs[k] > 0 && this.mods[k].startup) m *= this.mods[k].startup;
    return m;
  }
  get busy() { return !['idle', 'walk', 'run', 'dash', 'jump', 'fall'].includes(this.state); }
  get airborne() { return !this.grounded; }
  get hurtBox() {
    const s = this.cfg.size || {};
    return { radius: s.hurtRadius ?? 0.62, height: s.hurtHeight ?? 1.45, center: s.hurtCenter ?? 1.05, pad: s.hurtPad ?? 0, strikeY: s.strikeY ?? 1.25, push: s.pushRadius ?? 0.4 };
  }
  get chest() { return v3(this.pos.x, this.pos.y + this.hurtBox.center * 1.05, this.pos.z); }
  forward() { return v3(Math.sin(this.facing), 0, Math.cos(this.facing)); }
  emit(type, data) { this.events.push({ type, ...data }); }
  _def(slot) { return this.cfg[slot]; }
  _punchSet() { return (this.buffs.transform > 0 && this.cfg.sukunaPunches) ? this.cfg.sukunaPunches : this.cfg.punches; }

  // ---- resources ----------------------------------------------------------
  gainMaxCE(base) {
    if (this.noCE) return;
    const g = base * this.backlashGrowthMult * (this.backlash > 0 ? 0.5 : 1);
    this.res.maxCE = Math.min(this.ceCeiling, this.res.maxCE + g);
    this.res.curCE = this.res.maxCE;
  }
  spendCE(cost) {
    if (this.noCE) return true;
    if (this.res.curCE < cost) return false;
    this.res.curCE -= cost; return true;
  }
  consumeFullBar() { this.res.curCE = 0; this.res.maxCE = this.cfg.stats.startMaxCE; }
  addBuff(name, seconds, mods = null) { this.buffs[name] = Math.max(this.buffs[name] || 0, seconds); if (mods) this.mods[name] = mods; this.emit('buff', { name, seconds }); }
  hasBuff(name) { return (this.buffs[name] || 0) > 0; }
  applyBacklash(b) { if (!b) return; this.backlash = b.duration ?? 8; this.backlashGrowthMult = b.growthMult ?? 0.5; this.emit('backlash', { seconds: this.backlash }); }

  // ---- state --------------------------------------------------------------
  setState(state, opts = {}) {
    if (state !== 'dash') this.dashBurstT = 0;
    this.state = state; this.f = 0;
    if (opts.move !== undefined) this.move = opts.move;
    if (opts.clip) this.play(opts.clip, opts);
  }
  play(clip, opts = {}) {
    const sp = (opts.speed ?? 1) * Math.max(0.35, this.moveSpeedMult);
    this.anim.play(this._clip(clip), { fade: opts.fade ?? 0.09, speed: sp, restart: opts.restart ?? true });
  }
  _clip(name) {
    if (this.buffs.transform > 0 && this.anim.clips.has(name + 'Sukuna')) return name + 'Sukuna';
    if (this.stance && this.anim.clips.has(name + this.stance)) return name + this.stance;
    return this.anim.clips.has(name) ? name : (name.startsWith('punch') ? 'punch1' : 'cast');
  }
  _syncMoveAnim(def, clipName) {
    const clip = this.anim.clips.get(this._clip(clipName));
    if (!clip) { this.play('cast', { restart: true }); return; }
    const moveDur = (def.startup + def.active + def.recovery) / 60;
    this.play(clipName, { speed: clip.dur / moveDur, restart: true });
  }
  resetForRound(pos, facing) {
    const s = this.cfg.stats;
    this.res.hp = s.hp; this.res.stamina = s.stamina;
    this.res.maxCE = Math.max(this.res.maxCE, s.startMaxCE); this.res.curCE = this.res.maxCE;
    this.pos.copy(pos); this.vel.set(0, 0, 0); this.facing = facing; this.grounded = true;
    this.juggle = 0; this.otgUsed = false; this.comboHits = 0; this.comboDmg = 0;
    this.iFrames = 0; this.armorFrames = 0; this.buffs = {}; this.backlash = 0; this.backlashGrowthMult = 1;
    this.activeHit = null; this.move = null; this.alive = true; this.taunt = null; this.shield = null; this.counter = null;
    this.rootT = 0; this.frozenT = 0; this.domainRadius = null; this.bfT = 0; this.bfChain = 0; this.purpleWindow = 0;
    this.setState('intro', { clip: 'idle' });
    this.model.resetSprings();
    this.model.setEnergy(0);
  }

  // ---- attacks ------------------------------------------------------------
  startPunch(index) {
    this.punchIndex = index;
    const def = this._punchSet()[index];
    const clip = def.clip || 'punch' + (index + 1);
    this.punchQueued = false;
    const move = { ...def, kind: 'punch', index, startup: Math.max(1, Math.round(def.startup * this.startupMult)) };
    this.setState('attack', { move });
    this._syncMoveAnim(move, clip);
    const fwd = this.forward(), step = def.step ?? 1.6;
    this.vel.x += fwd.x * step; this.vel.z += fwd.z * step;
    this.emit('attackStart', { move });
  }
  startHeavy() {
    const def = this.cfg.heavy;
    if (!def) return false;
    if (def.staminaCost && this.res.stamina < def.staminaCost) { this.emit('noStamina'); return false; }
    if (def.staminaCost) this.res.stamina -= def.staminaCost;
    const clip = this.anim.clips.has(this._clip(def.clip || 'heavy')) ? (def.clip || 'heavy') : 'punch3';
    this.punchQueued = false;
    const move = { ...def, kind: 'heavy', type: def.type || 'knockdown', startup: Math.max(1, Math.round(def.startup * this.startupMult)) };
    this.setState('attack', { move });
    this._syncMoveAnim(move, clip);
    const fwd = this.forward(), step = def.step ?? 2.4;
    this.vel.x += fwd.x * step; this.vel.z += fwd.z * step;
    this.emit('heavyStart', { move });
    return true;
  }
  startCT(slot, ctx) {
    const def = this._def(slot);
    if (!def || def.effect == null) return false;
    this.slotUse[slot]++;
    if (def.cost && !this.spendCE(def.cost)) { this.emit('noCE', { why: 'NEED CURSED ENERGY' }); return false; }
    if (def.staminaCost) { if (this.res.stamina < def.staminaCost) { this.emit('noStamina'); return false; } this.res.stamina -= def.staminaCost; }
    const move = { ...def, kind: 'ct', slot, isCT: true, startup: Math.max(1, Math.round(def.startup * this.startupMult)), clip: def.clip || slot };
    this.setState('ct', { move });
    this._syncMoveAnim(move, move.clip);
    this.lastCT = def.effect;
    this.emit('ctStart', { move });
    return true;
  }
  startPurple() {
    const u = this.cfg.purple;
    const move = { ...u, kind: 'ct', slot: 'purple', isCT: true };
    this.consumeFullBar(); this.purpleWindow = 0;
    this.setState('ct', { move }); this._syncMoveAnim(move, u.clip || 'purple');
    this.emit('purpleCast', { move });
  }
  startUltBurst() {
    const u = this.cfg.ultimate;
    const def = { ...u, name: u.name, kind: 'ct', isCT: true, slot: 'ult', effect: u.effect, startup: u.startup ?? 20, active: u.active ?? (u.hits ? u.hits * 14 : 4), recovery: u.recovery ?? 26, dmg: u.dmgPerHit ?? u.dmg, clip: u.clip || 'ult' };
    this.consumeFullBar();
    this.setState('ct', { move: def }); this._syncMoveAnim(def, def.clip);
    this.emit('ultBurst', { move: def });
  }
  startTransform() {
    const u = this.cfg.ultimate;
    const move = { name: u.name, kind: 'ct', slot: 'ult', effect: u.effect, startup: u.startup, active: 1, recovery: u.recovery, clip: u.clip || 'ult' };
    this.consumeFullBar();
    this.setState('ct', { move }); this._syncMoveAnim(move, move.clip);
    this.emit('transformCast', { move });
  }
  startCopy() {
    if (!this.copySlot) return false;
    const c = this.copySlot; this.copySlot = null;
    const def = { name: c.name, kind: 'ct', isCT: true, slot: 'copy', effect: c.effect, dmg: c.dmg, startup: 16, active: 4, recovery: 20, range: 7, reach: 2.2, arc: 2, kb: 4, kbY: 1, hitstun: 20, clip: this.cfg.copy?.clip || 'cast', copied: true };
    this.setState('ct', { move: def }); this._syncMoveAnim(def, def.clip);
    this.emit('copyCast', { move: def });
    return true;
  }
  storeCopy(src) {
    if (!this.cfg.copy || !src || src === this) return false;
    const eff = src.cfg.copyEffect; if (!eff) return false;
    if (this.copySlot && this.copySlot.srcId === src.cfg.id) return false;
    this.copySlot = { ...eff, srcId: src.cfg.id, color: src.model.palette.accent ?? 0x9ff5c9 };
    this.emit('copied', { name: this.copySlot.name });
    return true;
  }
  tryTaunt(ctx) {
    if (this.tauntCD > 0 || !this.grounded) return false;
    const clips = ['taunt', 'taunt2', 'taunt3'].filter(c => this.anim.clips.has(c));
    if (!clips.length) return false;
    const clip = clips[this.tauntN++ % clips.length];
    const dur = this.anim.clips.get(clip).dur;
    this.taunt = { t: dur, clip };
    this.setState('taunt', { clip });
    this.emit('taunt', { clip });
    return true;
  }
  _setSpecialCD(s) { this.specialCD = s; this.specialCDMax = Math.max(0.1, s); }
  trySpecial(input, ctx) {
    const sp = this.cfg.special;
    if (!sp) return false;
    if (this.specialCD > 0) { this.emit('specialCooling', { t: this.specialCD }); return false; }
    if (sp.cost && this.res.curCE < sp.cost) { this.emit('noCE', { why: 'NEED CURSED ENERGY' }); return false; }
    const ok = ctx.effects.special(this, sp, input, ctx);
    if (ok) { if (sp.cost) this.spendCE(sp.cost); this._setSpecialCD(sp.cooldown ?? 3); this.slotUse.special++; }
    return ok;
  }

  // ---- taking hits --------------------------------------------------------
  // hit: { dmg, kb, kbY, hitstun, type, attacker, dir, unblockable, sureHit, otgOk, basic, crit, isCT, src }
  applyHit(hit, ctx) {
    const atk = hit.attacker;
    hit = { ...hit, dmg: hit.dmg * hitMult(hit) };
    // active counter window (Uro reflect, Hakari counter): the hit is returned
    if (this.counter && this.counter.t > 0 && !hit.sureHit && atk) {
      this.counter = null;
      this.emit('counterHit', { attacker: atk });
      atk.applyHit({ dmg: hit.dmg * 1.1 / hitMult(hit), kb: 5, kbY: 3, hitstun: 24, type: 'launcher', attacker: this, dir: this.forward(), unblockable: true, basic: false }, ctx);
      return 'countered';
    }
    // directional shield object (Hakari's shutter)
    if (this.shield && this.shield.t > 0 && !hit.sureHit && this._facingHit(hit)) {
      if (--this.shield.hits <= 0) { this.shield = null; this.emit('shieldBreak'); } else this.emit('shieldBlock');
      return 'blocked';
    }
    const d = {
      alive: this.alive, iFrames: this.iFrames, armorFrames: this.armorFrames, heavyArmor: this.cfg.heavyArmor && this.state === 'block',
      state: this.state, f: this.f, hp: this.res.hp, stamina: this.res.stamina, airborne: this.airborne,
      juggle: this.juggle, otgUsed: this.otgUsed, blockStartup: this.cfg.blockStartupFrames ?? 0,
      blockChipMult: this.cfg.blockChipMult ?? 1, blockStaminaMult: this.cfg.blockStaminaMult ?? 1, kbResist: this.cfg.kbResist ?? 1
    };
    const j = judgeHit(d, { ...hit, guardBreak: !!(atk && atk.ratioPrimed === 2 && !hit.sureHit) });
    const r = j.result;
    if (r === 'iframe' || r === 'whiff' || r === 'dead') return r;
    if (j.hp !== undefined) this.res.hp = j.hp;
    if (j.stamina !== undefined) this.res.stamina = j.stamina;
    if (j.iFrames !== undefined) this.iFrames = Math.max(this.iFrames, j.iFrames);
    if (j.juggle !== undefined) this.juggle = j.juggle;
    if (j.otgUsed !== undefined) this.otgUsed = j.otgUsed;
    const dir = hit.dir || atk?.forward() || v3();
    if (r === 'armor') { this.emit('armorHit'); return r; }
    if (r === 'otg') { this.setState('getup', { clip: 'getup' }); return r; }
    if (r === 'block') {
      this.setState('blockstun', { clip: 'blockHit' });
      this.vel.x += dir.x * hit.kb * 0.5; this.vel.z += dir.z * hit.kb * 0.5;
      return r;
    }
    if (r === 'guardbreak') {
      this.setState('guardBreak', { clip: 'guardBreak' }); this.activeHit = null; this.move = null;
      if (atk) atk.ratioPrimed = 0;
      this.emit('guardBreak'); return r;
    }
    // clean hit / tech
    this.comboTimer = 0;
    this.hitsTaken++;
    this.techLock = false;
    if (j.vel) {
      if (j.vel.set) this.vel.set(dir.x * j.vel.x, j.vel.y, dir.z * j.vel.x);
      else { this.vel.x += dir.x * j.vel.x; this.vel.z += dir.z * j.vel.x; }
    }
    if (j.grounded === false) this.grounded = false;
    if (j.hitstun !== undefined) this.hitstun = j.hitstun;
    if (j.state === 'knockdown') { this.setState('knockdown', { clip: 'knockdown' }); }
    else if (j.state === 'launched') { this.setState('launched', { clip: 'launched' }); }
    else this.setState(j.state, { clip: j.state });
    this.activeHit = null; this.move = null;
    this.bfT = 0; this.bfChain = 0; this.taunt = null; this.counter = null;
    if (this.ratioSweep != null) { this.ratioSweep = null; this._setSpecialCD(2); }
    if (atk && atk.ratioPrimed) { atk.ratioPrimed = 0; atk.emit('ratioStrike'); }
    if (this.cfg.copy && hit.isCT && atk) this.storeCopy(atk);
    if (this.res.hp <= 0) { this.res.hp = 0; }
    return r;
  }
  _facingHit(hit) {
    const atk = hit.attacker; if (!atk) return true;
    const f = this.forward(); const dx = atk.pos.x - this.pos.x, dz = atk.pos.z - this.pos.z; const m = Math.hypot(dx, dz) || 1;
    return (f.x * dx + f.z * dz) / m > 0.2;
  }
  takeChip(amount) { if (!this.alive) return; this.res.hp = Math.max(0, this.res.hp - amount * BALANCE_SPECIAL); }

  // ---- per-tick -----------------------------------------------------------
  update(input, ctx) {
    const dt = F;
    this.prevPos.copy(this.pos); this.prevFacing = this.facing;
    this.f++;
    this._trackDashInput(input, dt);
    if (this.iFrames > 0) this.iFrames--;
    if (this.armorFrames > 0) this.armorFrames--;
    if (this.purpleWindow > 0) this.purpleWindow--;
    if (this.bfT > 0) this.bfT--;
    for (const k in this.buffs) if (this.buffs[k] > 0) { this.buffs[k] -= dt; if (this.buffs[k] <= 0) { this.buffs[k] = 0; this.emit('buffEnd', { name: k }); if (k === 'transform') this._endTransform(); } }
    if (this.backlash > 0) { this.backlash -= dt; if (this.backlash <= 0) { this.backlash = 0; this.backlashGrowthMult = 1; this.emit('backlashEnd'); } }
    if (this.specialCD > 0) this.specialCD -= dt;
    if (this.tauntCD > 0) this.tauntCD -= dt;
    if (this.shield) { this.shield.t -= dt; if (this.shield.t <= 0) { this.shield = null; this.emit('shieldDown'); } }
    if (this.counter) { this.counter.t -= dt; if (this.counter.t <= 0) this.counter = null; }
    if (this.ratioPrimed && (this.ratioPrimedT -= dt) <= 0) this.ratioPrimed = 0;
    this.comboTimer += dt;
    if (this.comboTimer > 1.4) { this.comboHits = 0; this.comboDmg = 0; }
    const dashing = this.state === 'dash', blocking = this.state === 'block';
    if (!this.noCE && this.backlash <= 0) this.res.curCE = Math.min(this.res.maxCE, this.res.curCE + this.cfg.stats.ceRegen * dt);
    if (!dashing && !blocking) this.res.stamina = Math.min(this.cfg.stats.stamina, this.res.stamina + this.cfg.stats.staminaRegen * dt);
    if (this.cfg.rct && this.alive && this.backlash <= 0 && this.state !== 'ko') this.res.hp = Math.min(this.maxHP, this.res.hp + this.cfg.rct.perSecond * dt);
    this._stateLogic(input, ctx, dt);
    this._physics(dt);
    this._faceOpponent(ctx, dt);
    this.model.group.position.copy(this.pos);
    this.model.group.rotation.y = this.facing;
  }

  _trackDashInput(input, dt) {
    const mag = input ? Math.hypot(input.move?.x ?? 0, input.move?.z ?? 0) : 0;
    const dashHeld = !!input?.dash;
    if (!this.busy) { this._dirEdgeT += dt; this._dashEdgeT += dt; }
    if (mag > 0.35 && this._prevMoveMag <= 0.2) this._dirEdgeT = 0;
    if (dashHeld && !this._prevDashHeld) this._dashEdgeT = 0;
    this._prevMoveMag = mag; this._prevDashHeld = dashHeld;
  }

  _stateLogic(input, ctx, dt) {
    const S = this.state, stats = this.stats;
    if (input?.lockP) { this.lockOn = !this.lockOn; this.emit('lockToggle', { on: this.lockOn }); }
    if (this.rootT > 0) { this.rootT -= dt; if (this.rootT <= 0 && S === 'rooted') this.setState('idle', { clip: 'idle' }); }
    if (this.frozenT > 0) { this.frozenT -= dt; if (this.frozenT <= 0 && S === 'frozen') this.setState('idle', { clip: 'idle' }); }
    if (FROZEN.includes(S)) { if (S === 'castDomain' || S === 'intro' || S === 'victory' || S === 'ko') return; return; }
    // Black Flash confirm (Yuji: B; Nobara: punch)
    if (this.cfg.blackFlash) {
      const key = this.cfg.blackFlash.confirm === 'punch' ? 'punchP' : 'specialP';
      if (input?.[key] && this.bfT > 0) {
        input[key] = false;
        if (this.bfT <= this.cfg.blackFlash.window) { this.bfT = 0; ctx.effects.blackFlash(this, ctx); }
        else this.emit('noCE', { why: '' });
      }
    }
    switch (S) {
      case 'idle': case 'walk': case 'run': case 'dash': {
        if (!input) { this._locomote({ x: 0, z: 0 }, false, ctx, dt); break; }
        if (input.ultP && ctx.domains?.isMyDomain(this)) { ctx.domains.dismiss(this); break; }
        if (input.ultP && !input.block) {
          if (this.cfg.ultimate?.kind === 'cooldown') { if (this.specialCD <= 0 && this.grounded) { ctx.effects.assassinate(this, ctx); break; } this.emit('specialCooling', { t: this.specialCD }); break; }
          if (this.ultReady && this.grounded) {
            if (this.cfg.domain) { ctx.domains.castDomain(this, ctx); break; }
            if (this.cfg.ultimate?.kind === 'transform') { this.startTransform(); break; }
            if (this.cfg.ultimate) { this.startUltBurst(); break; }
          }
          this.emit('noCE', { why: this._ultRefusal() }); break;
        }
        if (input.specialP && this.cfg.special) { if (this.trySpecial(input, ctx)) break; }
        if (input.tauntP && !input.block && Math.hypot(input.move.x, input.move.z) < 0.35) { if (this.tryTaunt(ctx)) break; }
        if (input.ct1P && this.purpleWindow > 0 && this.cfg.purple) { this.startPurple(); break; }
        if (input.ct1P) { if (this.startCT('ct1', ctx)) break; }
        if (input.ct2P) { if (this.startCT('ct2', ctx)) break; }
        if (input.heavyP && this.grounded) { if (this.startHeavy()) break; }
        if (input.punchP && this.grounded) { this.startPunch(0); break; }
        if (input.jumpP && this.grounded) { this.vel.y = stats.jumpVel ?? 8.6; this.grounded = false; this.setState('jump', { clip: 'jump' }); this.emit('jump'); break; }
        if (input.block && this.grounded) { this.setState('block', { clip: 'block' }); break; }
        this._locomote(input.move, input.dash, ctx, dt);
        break;
      }
      case 'jump': case 'fall': {
        if (input) {
          const fwd = this._moveVec(input.move, ctx.camYaw);
          this.vel.x += fwd.x * 14 * dt; this.vel.z += fwd.z * 14 * dt;
          const sp = Math.hypot(this.vel.x, this.vel.z), cap = stats.runSpeed * 1.1;
          if (sp > cap) { this.vel.x *= cap / sp; this.vel.z *= cap / sp; }
          if (input.punchP) { this.startPunch(0); break; }
          if (input.ct1P && this.cfg.air?.techniques) { if (this.startCT('ct1', ctx)) break; }
          if (input.ct2P && this.cfg.air?.techniques) { if (this.startCT('ct2', ctx)) break; }
        }
        if (this.vel.y < 0 && S === 'jump') this.setState('fall', { clip: 'fall' });
        if (this.grounded) { this.setState('land', { clip: 'land' }); this.emit('land'); }
        break;
      }
      case 'land': if (this.f >= 10) this.setState('idle', { clip: 'idle' }); break;
      case 'block': if (!input || !input.block) this.setState('idle', { clip: 'idle' }); break;
      case 'blockstun': if (this.f >= 12) this.setState(input?.block ? 'block' : 'idle', { clip: input?.block ? 'block' : 'idle' }); break;
      case 'attack': {
        const m = this.move; if (!m) { this.setState('idle', { clip: 'idle' }); break; }
        if (this.f === 1 && m.armorFrames) this.armorFrames = m.armorFrames;
        if (this.f === m.startup) { this.activeHit = { def: m, frames: m.active, confirmed: false, isPunch: true }; this.emit('swing', { move: m }); }
        if (this.f > m.startup && this.f <= m.startup + m.active && this.activeHit) this.activeHit.frames--;
        if (this.f > m.startup + m.active) this.activeHit = null;
        if (input?.punchP && m.kind === 'punch' && this.punchIndex < this._punchSet().length - 1) this.punchQueued = true;
        const total = m.startup + m.active + m.recovery, cancelAt = m.startup + m.active + 3;
        if (input?.heavyP && m.kind === 'punch' && this.f >= cancelAt && this.grounded) { if (this.startHeavy()) break; }
        if (this.punchQueued && this.f >= cancelAt) { this.startPunch(this.punchIndex + 1); break; }
        // DASH CANCEL WINDOW: recovery can be cut by a dash after 60% of it —
        // forgiving on purpose, this is what makes strings feel alive
        if (input?.dashP && this.f >= m.startup + m.active + Math.round(m.recovery * 0.6) && this.grounded && this.res.stamina > 8) { this.setState('idle', { clip: 'idle' }); this.move = null; break; }
        if (input?.specialP && this.cfg.special?.cancel && this.f > m.startup + m.active && this.trySpecial(input, ctx)) break;
        if (this.f >= total) { this.setState('idle', { clip: 'idle' }); this.move = null; }
        break;
      }
      case 'ct': {
        const m = this.move; if (!m) { this.setState('idle', { clip: 'idle' }); break; }
        if (input?.ct1P && this.purpleWindow > 0 && this.cfg.purple && m.slot === 'ct2' && this.f > m.startup) { this.startPurple(); break; }
        if (input?.punchP && m.chainPunch && this.grounded && this.f >= m.startup + m.active) { this.startPunch(0); break; }
        if (m.armorFrames && this.f === 1) this.armorFrames = m.armorFrames;
        if (this.f === m.startup) ctx.effects.fire(this, m, ctx);
        if (m.hits && this.f > m.startup && this.f < m.startup + m.active && (this.f - m.startup) % 14 === 0) ctx.effects.fire(this, m, ctx, true);
        if (this.f >= m.startup + m.active + m.recovery) { this.setState('idle', { clip: 'idle' }); this.move = null; }
        break;
      }
      case 'special': {
        const m = this.move;
        const total = m?.stateFrames ?? 14;
        if (this.f >= total) { this.setState('idle', { clip: 'idle' }); this.move = null; }
        break;
      }
      case 'hold': {
        // a held special (Ryu's brace, Gojo's blossom, Yaga's build): ends on release or cap
        const m = this.move;
        const held = !!input?.special;
        if (m?.tick) m.tick(this, ctx, dt, held);
        if (!held || this.f >= (m?.holdFrames ?? 90)) { m?.release?.(this, ctx, this.f); this.setState('idle', { clip: 'idle' }); this.move = null; }
        break;
      }
      case 'taunt': {
        if (!this.taunt) { this.setState('idle', { clip: 'idle' }); break; }
        this.taunt.t -= dt;
        const bail = input && (Math.hypot(input.move.x, input.move.z) > 0.5 || input.dash || input.block);
        if (this.taunt.t <= 0 || bail) { this.tauntCD = 2.4; this.emit('tauntEnd', { complete: this.taunt.t <= 0 }); this.taunt = null; this.setState('idle', { clip: 'idle' }); }
        break;
      }
      case 'hitLight': case 'hitHeavy': if (this.f >= (this.hitstun || 16)) this.setState('idle', { clip: 'idle' }); break;
      case 'launched':
        if (this._tryTech(input)) break;
        if (this.grounded) { this.juggle = 0; this.otgUsed = false; this.setState('knockdown', { clip: 'knockdown' }); this.emit('thud'); }
        break;
      case 'knockdown':
        if (this._tryTech(input)) break;
        if (this.f >= 55) { this.iFrames = 34; this.setState('getup', { clip: 'getup' }); }
        break;
      case 'getup': if (this.f >= 36) this.setState('idle', { clip: 'idle' }); break;
      case 'techRise': if (this.f >= TECH_RISE_FRAMES) this.setState('idle', { clip: 'idle' }); break;
      case 'guardBreak': if (this.f >= 58) { this.res.stamina = 30; this.setState('idle', { clip: 'idle' }); } break;
      case 'defeat': break;
      default: if (this.f > 120) this.setState('idle', { clip: 'idle' });
    }
  }
  _endTransform() { this.emit('transformEnd'); const u = this.cfg.ultimate; if (u?.recoil) this.res.hp = Math.max(1, this.res.hp - u.recoil); this.applyBacklash(u?.backlash); this.model.setEnergy(0); }
  _ultRefusal() {
    if (!this.cfg.domain && !this.cfg.ultimate) return 'NO DOMAIN';
    if (this.backlash > 0) return 'BACKLASH';
    if (!this.grounded) return '';
    const th = this.cfg.domain?.castThreshold ?? 1;
    if (this.res.maxCE < 100 * th - 0.01) return 'NEED HIGHER ENERGY CEILING';
    return 'NEED CURSED ENERGY';
  }
  _tryTech(input) {
    if (!input?.jumpP || this.techLock) return false;
    let ok;
    if (this.state === 'launched') ok = this.vel.y <= 0 && this.pos.y - this.groundY <= TECH_HEIGHT;
    else ok = this.f <= TECH_KD_FRAMES;
    if (!ok) { this.techLock = true; return true; }
    this.pos.y = this.groundY; this.vel.set(this.vel.x * 0.25, 0, this.vel.z * 0.25); this.grounded = true;
    this.juggle = 0; this.otgUsed = false; this.hitstun = 0; this.iFrames = Math.max(this.iFrames, 26);
    this.setState('techRise', { clip: 'techRise' }); this.emit('quickRise');
    return true;
  }
  _moveVec(move, camYaw) {
    const yaw = (this.lockOn || camYaw == null ? this.facing : camYaw);
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const fwd = -move.z, strafe = move.x;
    return v3(sin * fwd - cos * strafe, 0, cos * fwd + sin * strafe);
  }
  _locomote(move, dashHeld, ctx, dt) {
    const stats = this.stats;
    const m = this._moveVec(move, ctx.camYaw);
    const mag = Math.hypot(m.x, m.z);
    const canDash = dashHeld && this.res.stamina > 1 && mag > 0.1;
    if (this.dashBurstT > 0) {
      this.dashBurstT -= dt;
      const bs = stats.dashSpeed * DASH_BURST.speed * this.moveSpeedMult;
      this.vel.x = this.dashBurstDir.x * bs; this.vel.z = this.dashBurstDir.z * bs;
      this.res.stamina = Math.max(0, this.res.stamina - stats.dashDrain * dt);
      return;
    }
    let speed = 0, next = 'idle';
    if (canDash) { speed = stats.dashSpeed; next = 'dash'; this.res.stamina = Math.max(0, this.res.stamina - stats.dashDrain * dt); }
    else if (mag > 0.55) { speed = stats.runSpeed; next = 'run'; }
    else if (mag > 0.05) { speed = stats.walkSpeed; next = 'walk'; }
    speed *= this.moveSpeedMult;
    this.vel.x = damp(this.vel.x, m.x * speed, 14, dt);
    this.vel.z = damp(this.vel.z, m.z * speed, 14, dt);
    if (next !== this.state) {
      this.setState(next, { clip: next, fade: 0.14 });
      if (next === 'dash') {
        const inv = this.cfg.dashIFrames ?? 0;
        if (inv > 0) this.iFrames = Math.max(this.iFrames, inv);
        this.emit('dash');
        // THE DASH BURST: only a deliberate dash (direction + button together)
        if (this._dirEdgeT <= DASH_BURST.window && this._dashEdgeT <= DASH_BURST.window && this.res.stamina >= stats.dashDrain * DASH_BURST.costSeconds) {
          this.res.stamina -= stats.dashDrain * DASH_BURST.costSeconds;
          this.dashBurstT = DASH_BURST.time;
          this.dashBurstDir.set(m.x / mag, 0, m.z / mag);
          this.iFrames = Math.max(this.iFrames, 6);
          this.emit('dashBurst');
        }
      }
    } else if (next === 'walk' || next === 'run' || next === 'idle') {
      this.anim.play(this._clip(next), { fade: 0.14, restart: false, speed: Math.max(0.35, this.moveSpeedMult) * (next === 'walk' ? 0.9 + mag * 0.3 : 1) });
    }
  }
  _physics(dt) {
    if (this.frozenT > 0 && this.state === 'frozen') return;
    if (!this.grounded) this.vel.y -= GRAVITY * dt;
    const wasFast = Math.hypot(this.vel.x, this.vel.z);
    const yBefore = this.pos.y;
    this.pos.addScaledVector(this.vel, dt);
    const b = this.bounds;
    if (b) {
      b.resolveWalls?.(this.pos, 0.36);
      const ex = this.pos.x, ez = this.pos.z;
      b.clampXZ(this.pos, 0.35);
      if ((this.pos.x !== ex || this.pos.z !== ez) && wasFast > 7 && ['launched', 'knockdown', 'hitHeavy'].includes(this.state) && (this._wallCD ?? 0) <= 0) { this._wallCD = 0.35; this.emit('wallSlam', { power: wasFast }); }
      this._wallCD = Math.max(0, (this._wallCD ?? 0) - dt);
      const ceil = this.vel.y > 0 ? this.pos.y - 0.05 : Math.max(yBefore, this.pos.y) + STEP_TOL;
      const g = b.floorAt(this.pos.x, this.pos.z, this.grounded ? this.groundY + STEP_TOL : ceil);
      this.groundY = g;
      if (this.pos.y <= g + 1e-4 && this.vel.y <= 0) { if (!this.grounded && this.vel.y < -1) this.emit('land'); this.pos.y = g; this.vel.y = 0; this.grounded = true; }
      else this.grounded = false;
    } else {
      if (this.pos.y <= 0) { this.pos.y = 0; if (!this.grounded) this.vel.y = 0; this.grounded = true; } else this.grounded = false;
      const r = Math.hypot(this.pos.x, this.pos.z);
      if (r > this.arenaRadius) { const s = this.arenaRadius / r; this.pos.x *= s; this.pos.z *= s; }
    }
    if (this.domainRadius != null) { const dr = Math.hypot(this.pos.x, this.pos.z); if (dr > this.domainRadius) { const s = this.domainRadius / dr; this.pos.x *= s; this.pos.z *= s; } }
    if (this.grounded && !['walk', 'run', 'dash'].includes(this.state)) { this.vel.x = damp(this.vel.x, 0, 8, dt); this.vel.z = damp(this.vel.z, 0, 8, dt); }
  }
  // used by the finisher director: sync the model to pos/facing and step the anim
  applyRender(alpha, frameDt, timeScale = 1) {
    const g = this.model.group;
    g.position.lerpVectors(this.prevPos, this.pos, alpha);
    g.rotation.y = this.prevFacing + (this.facing - this.prevFacing) * alpha;
    this.anim.update(frameDt * timeScale);
    this.model.update(frameDt * timeScale);
  }
  _props() {}
  _faceOpponent(ctx, dt) {
    if (['knockdown', 'getup', 'launched', 'ko', 'hitHeavy', 'intro', 'victory'].includes(this.state)) return;
    let target;
    if (this.lockOn && ctx.opponent) target = yawBetween(this.pos, ctx.opponent.pos);
    else { const m = Math.hypot(this.vel.x, this.vel.z); if (m < 0.6) return; target = Math.atan2(this.vel.x, this.vel.z); }
    const rate = this.state === 'run' || this.state === 'dash' ? 6 : 10;
    this.facing = angleDamp(this.facing, target, rate, dt);
  }
}
const BALANCE_SPECIAL = 1.30;
