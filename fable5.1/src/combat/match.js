// MATCH — one fight: fighters, the fixed 60 Hz logic tick, hitstop, melee
// resolution, KO / round / stock flow, and the routing of every combat event
// to fx, sfx, camera, HUD and rumble. The combat layer sees N fighters and
// never knows which seats are human.
import * as THREE from 'three';
import { Fighter } from './fighter.js';
import { Effects } from './effects/index.js';
import { Domains } from './domains.js';
import { CPU } from './ai.js';
import { computeDamage, capsuleHit, hitstopFor } from './hits.js';
import { FightCamera } from '../render/camera.js';
import { ContactShadow } from '../render/contact.js';
import { makeCharacter, pickInfo } from '../roster/index.js';
import { emptyFrame } from './input.js';
import { flatDist, v3, clamp } from '../core/math.js';
import { quality } from '../render/quality.js';
import { Finishers } from '../finishers/index.js';

const EMPTY = emptyFrame();
const EDGE_KEYS = ['jumpP', 'punchP', 'heavyP', 'ct1P', 'ct2P', 'ultP', 'specialP', 'dashP'];
const BUFFER_FRAMES = 6;   // input buffer: a press up to 6 frames early still counts

export class Match {
  // opts: { mode: 'local'|'cpu'|'ffa', picks: [...], map, rounds, difficulty, training }
  constructor({ stage, input, sfx, music, announcer, hud, arena, opts }) {
    this.stage = stage; this.input = input; this.sfx = sfx; this.music = music; this.announcer = announcer; this.hud = hud;
    this.opts = opts; this.mode = opts.mode || 'local';
    this.root = new THREE.Group(); this.root.name = 'match'; stage.scene.add(this.root);
    this.arena = arena;
    this.bounds = arena.bounds;
    this.fx = arena.fx;
    this.fighters = []; this.inputs = new Map(); this.cpus = new Map(); this.shadows = [];
    this.tick = 0; this.acc = 0; this.hitstopT = 0; this.slowmo = 1; this.slowT = 0;
    this.phase = 'intro'; this.phaseT = 0; this.round = 1; this.roundsToWin = opts.rounds ?? 2; this.wins = [];
    this.timer = opts.timer ?? 99; this.paused = false; this.winner = null; this.events = [];
    this.listeners = new Map();
    this.training = !!opts.training;
    const picks = opts.picks;
    const n = picks.length;
    this.stage.setViews(this.mode === 'local' ? 2 : this.mode === 'ffa' ? Math.max(3, n) : 1);
    picks.forEach((pick, i) => {
      const c = makeCharacter(pick);
      const sp = arena.spawnPoint(i, n);
      const facing = n <= 2 ? (i === 0 ? Math.PI / 2 : -Math.PI / 2) : Math.atan2(-sp.x, -sp.z);
      const f = new Fighter({ config: c.config, model: c.model, clips: c.clips, index: i, bounds: this.bounds, spawn: sp, facing, pick });
      f.info = pickInfo(pick); f.arenaRadius = arena.radius ?? 22; f.stocks = this.mode === 'ffa' ? (opts.stocks ?? 2) : 1;
      this.root.add(c.model.group);
      const cs = new ContactShadow(0.55); this.root.add(cs.mesh); this.shadows.push(cs);
      this.fighters.push(f); this.wins.push(0);
      if (this.mode === 'cpu' && i >= 1) this.cpus.set(i, new CPU(f, this, opts.difficulty ?? 1));
      if (this.mode === 'ffa' && i >= (opts.humans ?? 1)) this.cpus.set(i, new CPU(f, this, opts.difficulty ?? 1));
    });
    this.effects = new Effects(this);
    this.domains = new Domains(this);
    // cameras: one per view
    this.cams = [];
    const views = this.stage.viewCount;
    for (let i = 0; i < views; i++) {
      const cam = new FightCamera(this.stage.cameraFor(i), this.mode === 'cpu' ? 'follow' : 'follow');
      cam.bounds = this.bounds; cam.distScale = views === 2 ? 0.9 : views > 2 ? 0.85 : 1;
      cam.reducedMotion = !!opts.reducedMotion;
      this.cams.push(cam);
    }
    this.cam = this.cams[0];
    for (let i = 1; i < this.cams.length; i++) this.cam.links.push(this.cams[i]);
    this.chargedAuras = new Map();
    this.finishers = new Finishers(this, opts.uiRoot || document.getElementById('ui-root'));
    this.hud?.bind(this);
    this._startRound(true);
  }
  get matchOver() { return this.phase === 'ko' && this._matchPoint; }
  get activeFighters() { return this.fighters.filter(f => f.alive || f.state === 'ko'); }
  on(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(fn); }
  emitMatch(type, data = {}) { for (const fn of this.listeners.get(type) || []) fn(data); this.hud?.onEvent?.(type, data); }
  other(f) { let best = null, bd = Infinity; for (const o of this.fighters) { if (o === f || !o.alive) continue; const d = flatDist(f.pos, o.pos); if (d < bd) { bd = d; best = o; } } return best || this.fighters.find(o => o !== f); }
  ctxFor(f) { return { match: this, opponent: this.other(f), effects: this.effects, domains: this.domains, fx: this.fx, sfx: this.sfx, camYaw: this.camFor(f)?.yaw ?? null }; }
  camFor(f) { return this.cams[Math.min(f.index, this.cams.length - 1)]; }
  screenOf(f, i = 0) { return this.stage.project(f.chest, i); }
  floorAt(x, z, y) { return this.bounds ? this.bounds.floorAt(x, z, y) : 0; }
  clampToArena(p) { if (this.bounds) this.bounds.clampXZ(p, 0.4); else { const r = Math.hypot(p.x, p.z), lim = 22; if (r > lim) { p.x *= lim / r; p.z *= lim / r; } } }
  hitstop(frames) { this.hitstopT = Math.max(this.hitstopT, frames / 60); }
  slowMo(k, seconds) { this.slowmo = k; this.slowT = seconds; }
  announce(big, small) { this.hud?.announce(big, small); this.emitMatch('announce', { big, small }); }
  setGrade(name, seconds) { if (name === 'map') this.stage.setGrade(this.arena.grade || 'neutral'); else this.stage.setGrade(name); if (seconds) { this._gradeT = seconds; } }

  // ---- rounds --------------------------------------------------------------
  _startRound(first = false) {
    this.finishers?.abort(); this.finishers.spent = false; this.hud?.setHidden(false); this._matchPoint = false;
    this.phase = 'intro'; this.phaseT = 0; this.timer = this.opts.timer ?? 99;
    this.effects.clear(); this.domains.clear(); this.fx.clear();
    const n = this.fighters.length;
    this.fighters.forEach((f, i) => {
      const sp = this.arena.spawnPoint(i, n);
      const facing = n <= 2 ? (i === 0 ? Math.PI / 2 : -Math.PI / 2) : Math.atan2(-sp.x, -sp.z);
      f.resetForRound(sp, facing);
      f.alive = f.stocks > 0 || this.mode !== 'ffa';
      f.model.setVisible(f.alive);
    });
    this.cams.forEach((c, i) => c.reset(this.fighters[i] || this.fighters[0], this.other(this.fighters[i] || this.fighters[0])));
    const mid = this.fighters.reduce((a, f) => a.add(f.pos), v3()).divideScalar(n);
    for (const c of this.cams) c.cinematic(mid, 2.2, 5.5, 2.4, { startAngle: -1.2, sweep: 1.6, closeIn: 0.15, lookY: 1.0, fov: 44, hold: 0.1 });
    this.stage.setGrade(this.arena.grade || 'neutral');
    this.music?.play('fight');
    const finalRound = this.wins.some(w => w === this.roundsToWin - 1) && this.wins.filter(w => w === this.roundsToWin - 1).length >= 2;
    this.announce(finalRound ? 'FINAL ROUND' : 'ROUND ' + this.round, null);
    this.announcer?.round(finalRound ? 'final' : this.round);
    this.emitMatch('roundStart', { round: this.round, first });
  }
  _fightStart() {
    this.phase = 'fight'; this.phaseT = 0;
    for (const f of this.fighters) if (f.alive) f.setState('idle', { clip: 'idle' });
    this.announce('FIGHT');
    this.announcer?.fight();
    this.stage.flash(0.35);
    this.emitMatch('fight');
  }
  _startKO(loser) {
    this.phase = 'ko'; this.phaseT = 0;
    this.stage.setGrade('ko'); this.slowMo(0.22, 1.6);
    this.stage.impactFrame(5, 0x000000, 0xffffff); this.stage.flash(0.9, 0xffffff);
    this.fx.ko(loser.chest, loser.model.palette.accent);
    this.cam.shake(0.9);
    for (const c of this.cams) c.cinematic(loser.pos, 2.4, 3.4, 1.4, { startAngle: loser.facing + 2.4, sweep: 0.9, closeIn: 0.3, lookY: 0.9, fov: 38, hold: 0.6 });
    loser.setState('ko', { clip: 'ko' }); loser.alive = false;
    const winner = this.fighters.find(f => f.alive && f !== loser) || this.fighters.find(f => f !== loser);
    this.winner = winner;
    this._matchPoint = !!winner && this.wins[winner.index] + 1 >= this.roundsToWin;
    this.announce('K.O.'); this.announcer?.ko();
    this.music?.duck(0.6, 2.5);
    for (const f of this.fighters) this.input.rumble(f.index, f === loser ? 1 : 0.5, 0.8, 400);
    this.emitMatch('ko', { loser, winner });
  }
  _endRound() {
    const w = this.winner; if (!w) return;
    this.wins[w.index]++;
    w.setState('victory', { clip: w.anim.clips.has('victory') ? 'victory' : 'idle' });
    this.phase = 'roundEnd'; this.phaseT = 0;
    this.announcer?.win(w.cfg.name);
    if (this.wins[w.index] >= this.roundsToWin) { this.phase = 'result'; this.emitMatch('result', { winner: w, wins: this.wins, stats: this._stats() }); }
    else { this.round++; }
  }
  _stats() { return this.fighters.map(f => ({ name: f.cfg.name, pick: f.pick, hits: f.hitsDealt, taken: f.hitsTaken, hp: f.res.hp, maxHP: f.maxHP })); }
  rematch() { this.wins = this.wins.map(() => 0); this.round = 1; this.winner = null; for (const f of this.fighters) f.stocks = this.mode === 'ffa' ? (this.opts.stocks ?? 2) : 1; this._startRound(true); }

  // ---- update: fixed step + hitstop + slowmo ---------------------------------
  update(dt) {
    if (this.paused) return;
    dt = Math.min(dt, 0.1);
    this.music?.update(dt);
    if (this.finishers?.active) { this.finishers.update(dt); this.hud?.update(dt); return; }
    if (this.hitstopT > 0) { this.hitstopT -= dt; this._hitstopShake(dt); this.fx.update(dt * 0.15); return; }
    if (this.slowT > 0) { this.slowT -= dt; if (this.slowT <= 0) this.slowmo = 1; }
    if (this._gradeT > 0) { this._gradeT -= dt; if (this._gradeT <= 0) this.setGrade('map'); }
    this.acc += dt * this.slowmo;
    const frames = this.input.frames;
    let steps = 0;
    while (this.acc >= 1 / 60 && steps < 4) { this.acc -= 1 / 60; this._logicTick(frames); this.input.consumeEdges(); steps++; }
    this.fx.update(dt * this.slowmo);
    for (const f of this.fighters) { f.anim.update(dt * this.slowmo * (f.state === 'ko' ? 0.6 : 1)); f.model.group.updateMatrixWorld(true); f.model.update(dt * this.slowmo); }
  }
  _hitstopShake(dt) { for (const f of this.fighters) if (f._hsShake > 0) { f.model.group.position.x = f.pos.x + Math.sin(this.tick * 9 + f.index) * 0.03; f._hsShake -= dt; } }
  _bufferEdges(frames) {
    this.fighters.forEach((f, i) => {
      const inp = this.mode === 'cpu' && this.cpus.has(i) ? null : frames[i];
      if (!inp) return;
      f.buffer = f.buffer.filter(b => this.tick - b.tick <= BUFFER_FRAMES);
      for (const k of EDGE_KEYS) if (inp[k]) f.buffer.push({ key: k, tick: this.tick });
    });
  }
  _applyBuffer(f, inp) {
    // a buffered press replays on the first neutral frame
    if (!inp || !['idle', 'walk', 'run', 'dash'].includes(f.state)) return inp;
    const out = { ...inp };
    for (const b of f.buffer) if (this.tick - b.tick > 0 && this.tick - b.tick <= BUFFER_FRAMES) out[b.key] = true;
    f.buffer.length = 0;
    return out;
  }
  _logicTick(frames) {
    this.tick++;
    const fight = this.phase === 'fight';
    this.phaseT += 1 / 60;
    if (this.phase === 'intro' && this.phaseT >= 2.4) this._fightStart();
    if (fight && !this.training) { this.timer = Math.max(0, this.timer - 1 / 60); if (this.timer <= 0) this._timeOut(); }
    this._bufferEdges(frames);
    this.fighters.forEach((f, i) => {
      let inp = null;
      if (fight) {
        if (this.cpus.has(i)) inp = this.cpus.get(i).frame();
        else inp = frames[i] || null;
        if (inp && f.buffer.length) inp = this._applyBuffer(f, inp);
      }
      this.inputs.set(f, inp);
    });
    for (const f of this.fighters) if (f.alive || f.state === 'ko') f.update(this.inputs.get(f), this.ctxFor(f));
    // separation
    const live = this.fighters.filter(f => f.alive);
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const a = live[i], b = live[j];
      const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
      const sep = Math.max(a.hurtBox.push, 0.4) + Math.max(b.hurtBox.push, 0.4);
      if (d < sep && d > 1e-4) { const push = (sep - d) / 2, nx = dx / d, nz = dz / d; const ma = 1 / (a.cfg.kbResist ?? 1), mb = 1 / (b.cfg.kbResist ?? 1); const sa = 2 * mb / (ma + mb), sb = 2 * ma / (ma + mb); a.pos.x -= nx * push * sa; a.pos.z -= nz * push * sa; b.pos.x += nx * push * sb; b.pos.z += nz * push * sb; }
    }
    if (fight) {
      for (const a of live) for (const b of live) if (a !== b) this._resolveMelee(a, b);
      this.effects.update(1 / 60);
      this.domains.update(1 / 60, this);
      for (const f of live) { this._drainEvents(f); if (f.res.hp <= 0 && f.alive) this._onDown(f); }
    } else for (const f of this.fighters) this._drainEvents(f);
    if (this.phase === 'ko' && this.phaseT > 1.4 && this._matchPoint && !this.finishers.spent) { this.finishers.tryBegin(this.winner); }
    if (this.phase === 'ko' && this.phaseT > 2.6 && !this.finishers.active) this._endRound();
    if (this.phase === 'roundEnd' && this.phaseT > 2.4) this._startRound();
    // camera + shadows + focus
    this.fighters.forEach((f, i) => { this.shadows[i].update(f.pos, f.groundY, f.H ?? 1); this.shadows[i].mesh.visible = f.alive || f.state === 'ko'; });
    const mid = this.fighters.reduce((a, f) => a.add(f.pos), v3()).divideScalar(this.fighters.length);
    this.stage.focus.copy(mid);
    this.cams.forEach((c, i) => { const me = this.fighters[i] || this.fighters[0]; const inp = this.inputs.get(me) || (this.phase !== 'fight' ? null : frames[i]); c.update(1 / 60, me, this.other(me), this.cpus.has(i) ? null : inp); });
    this.hud?.update(1 / 60);
  }
  _timeOut() {
    const best = [...this.fighters].sort((a, b) => b.res.hp / b.maxHP - a.res.hp / a.maxHP);
    if (best[0].res.hp / best[0].maxHP === best[1]?.res.hp / best[1]?.maxHP) { this.timer = 10; return; }
    this.announce('TIME'); this.winner = best[0]; this._startKO(best[1]);
  }
  _onDown(f) {
    if (this.mode === 'ffa') {
      f.stocks--;
      if (f.stocks > 0) { f.res.hp = f.maxHP; f.iFrames = 90; f.setState('techRise', { clip: 'techRise' }); this.fx.burst(f.pos, 2, f.model.palette.accent, 'ring'); this.announce(null, f.cfg.name + ' LOSES A STOCK'); return; }
      f.alive = false; f.setState('defeat', { clip: 'defeat' });
      const left = this.fighters.filter(o => o.alive);
      if (left.length <= 1) { this.winner = left[0]; this._startKO(f); }
      return;
    }
    this._startKO(f);
  }
  _resolveMelee(a, b) {
    const win = a.activeHit;
    if (!win || win.confirmed || win.frames <= 0) return;
    const def = win.def;
    const fwd = a.forward();
    const origin = a.pos.clone().addScaledVector(fwd, def.reach * 0.7); origin.y = a.pos.y + a.hurtBox.strikeY;
    if (!capsuleHit(origin, b)) return;
    win.confirmed = true;
    const { dmg, crit } = computeDamage(a, def.dmg * (a.punchDmgMult ?? 1), {});
    const hit = { dmg, crit, kb: def.kb, kbY: def.kbY, hitstun: def.hitstun, type: def.type, attacker: a, dir: fwd, otgOk: true, isCT: false, src: 'punch', basic: true };
    const r = b.applyHit(hit, this.ctxFor(a));
    this.onHit(a, b, r, { ...hit, heavy: def.kind === 'heavy' || def.type === 'launcher', knockdown: def.type === 'knockdown', color: a.model.palette.accent });
    if (r === 'hit' || r === 'otg') {
      a.gainMaxCE(a.cfg.stats.ceGainPerPunch * (def.ceGain ?? 1));
      a.comboHits++; a.comboTimer = 0; a.hitsDealt++; a.comboDmg += dmg * 0.85;
      if (a.cfg.copy) a.storeCopy(b);
    }
  }
  // ---- feedback for every contact in the game ---------------------------------
  onHit(a, b, result, hit) {
    const p = hit.at ? hit.at.clone() : b.chest;
    const weight = hit.execute ? 'crit' : hit.crit ? 'crit' : hit.knockdown || hit.type === 'knockdown' ? 'knockdown' : hit.type === 'launcher' ? 'launcher' : hit.heavy ? 'heavy' : 'light';
    const scr = this.stage.project(p, 0);
    const pan = (scr.x - 0.5) * 1.6;
    const color = hit.color ?? a?.model.palette.accent ?? 0xffffff;
    if (result === 'block') { this.fx.guardSpark(p, b.model.palette.accent); this.sfx.guard(pan); this.hitstop(2); this.input.rumble(b.index, 0.2, 0.4, 60); }
    else if (result === 'guardbreak') { this.fx.guardBreak(p); this.sfx.guardBreak(pan); this.cam.shake(0.5); this.hitstop(8); this.stage.punch(0.5, scr); this.announce(null, 'GUARD BREAK'); this.hud?.stateWord(b, 'GUARD BREAK'); this.input.rumble(b.index, 0.8, 0.6, 200); }
    else if (result === 'hit' || result === 'otg' || result === 'tech') {
      if (hit.soft) { this.fx.pop(p, color); return; }
      this.fx.hitSpark(p, weight === 'launcher' ? 'heavy' : weight, color, hit.dir);
      this.sfx.hit(weight, pan);
      const hs = hitstopFor(hit, result);
      this.hitstop(hs);
      b._hsShake = hs / 60;
      const shake = { light: 0.14, heavy: 0.34, launcher: 0.36, knockdown: 0.5, crit: 0.55 }[weight];
      this.cam.shake(shake);
      if (weight !== 'light') { this.cam.fovKick(weight === 'crit' ? 6 : 4); this.stage.punch(weight === 'crit' ? 0.9 : 0.5, scr); }
      if (weight === 'knockdown' || weight === 'crit' || hit.execute) this.stage.impactFrame(weight === 'crit' ? 4 : 3, 0x06060a, 0xfff2e2);
      if (weight === 'launcher') this.hud?.stateWord(b, 'LAUNCH');
      if (weight === 'knockdown') this.hud?.stateWord(b, 'DOWN');
      if (hit.crit) this.hud?.stateWord(b, 'COUNTER');
      this.hud?.damage(b, hit.dmg, weight, hit.crit);
      this.input.rumble(b.index, weight === 'light' ? 0.35 : 0.9, 0.5, weight === 'light' ? 70 : 160);
      this.input.rumble(a.index, 0.15, 0.4, 50);
      if (b.res.hp <= 0 && !hit.execute) this.slowMo(0.35, 0.3);
    }
    else if (result === 'armor') { this.fx.armorFlash(p); this.sfx.armor(pan); this.hitstop(3); }
    else if (result === 'countered') { this.fx.guardBreak(p); this.sfx.guardBreak(pan); this.hud?.stateWord(a, 'COUNTERED'); }
    this.emitMatch('hit', { attacker: a, defender: b, result, hit });
  }
  onDomainTick(caster, victim) { this.input.rumble(victim.index, 0.3, 0.3, 80); this.hud?.damage(victim, 0, 'tick'); }
  _drainEvents(f) {
    const scr = this.stage.project(f.chest, 0), pan = (scr.x - 0.5) * 1.6;
    for (const e of f.events) {
      switch (e.type) {
        case 'swing': this.sfx.swing(e.move.kind === 'heavy', pan); break;
        case 'dash': this.sfx.dash(pan); this.fx.dust(f.pos, 1.2); break;
        case 'dashBurst': this.stage.speed(0.8, scr); this.fx.trail(f, f.model.palette.accent, 0.2); break;
        case 'jump': this.sfx.jump(pan); this.fx.dust(f.pos, 0.6); break;
        case 'land': this.sfx.land(pan); this.fx.dust(f.pos, 1); break;
        case 'thud': this.sfx.land(pan); this.fx.dust(f.pos, 2); this.cam.shake(0.2); break;
        case 'wallSlam': this.sfx.wallSlam(pan); this.cam.shake(0.45); this.fx.burst(f.chest, 1.2, 0xc0b0a0, 'ring'); this.stage.punch(0.4, scr); break;
        case 'whiff': this.sfx.whiff(pan); break;
        case 'noCE': if (e.why) { this.hud?.notice(f, e.why); } this.sfx.denied(); break;
        case 'noStamina': this.hud?.notice(f, 'OUT OF STAMINA'); this.sfx.denied(); break;
        case 'specialCooling': this.sfx.denied(); break;
        case 'ctStart': this.hud?.cutIn(f, e.move.name, e.move.jpName); break;
        case 'ultBurst': case 'purpleCast': case 'transformCast': this.hud?.cutIn(f, e.move.name, e.move.jpName, true); this.cam.pushIn(0.6, 0.8); this.stage.impactFrame(2, 0x000000, 0xffffff); this.sfx.powerUp(f.model.palette.energy); break;
        case 'domainCast': this.announcer?.domain(); this.cam.pushIn(0.8, 1.5); break;
        case 'blackFlash': this.announce(null, '黒閃 BLACK FLASH' + (e.chain > 1 ? ' ×' + e.chain : '')); this.cam.pushIn(0.7, 0.5); break;
        case 'bfWindow': this.hud?.flashSlot(f); break;
        case 'taunt': this.sfx.taunt(); this.hud?.bubble(f, this._tauntLine(f)); break;
        case 'quickRise': this.fx.dust(f.pos, 1.4); this.hud?.stateWord(f, 'TECH'); break;
        case 'guardBreak': break;
        case 'buff': this.hud?.buff(f, e.name, e.seconds); break;
        case 'backlash': this.hud?.notice(f, 'BACKLASH'); break;
        case 'fingerEaten': this.announce(null, `SUKUNA: ${e.stacks} FINGER${e.stacks > 1 ? 'S' : ''}`); break;
        case 'stanceSwap': this.hud?.notice(f, String(e.key).toUpperCase()); this.sfx.tick(); break;
        case 'ratioResult': this.hud?.notice(f, ['MISS', '7:3 CLOSE', '7:3 PERFECT'][e.level]); if (e.level === 2) this.sfx.meterFull(); break;
        case 'copied': this.hud?.notice(f, 'COPIED: ' + e.name); this.sfx.meterFull(); break;
        case 'lockToggle': this.hud?.notice(f, e.on ? 'LOCK ON' : 'FREE CAMERA'); this.camFor(f).locked = e.on; break;
        case 'attackStart': break;
        default: break;
      }
      this.emitMatch('fighter:' + e.type, { fighter: f, ...e });
    }
    f.events.length = 0;
    // meter full chime
    if (f.charged && !f._chargedFx) { f._chargedFx = true; this.sfx.meterFull(); this.hud?.notice(f, 'CURSED ENERGY MAX'); }
    if (!f.charged) f._chargedFx = false;
  }
  _tauntLine(f) { const lines = { gojo: "Nah, I'd win.", sukuna: 'Know your place.', yuji: "I'll take it from here!", todo: 'My brother!', nanami: 'Overtime.', megumi: 'With this treasure, I summon...', nobara: "I'm the one who's gonna win.", toji: "Sorry, I'm not a sorcerer.", mahito: 'Shall we play?', jogo: 'I am a disaster.', hakari: 'The reels are spinning.', geto: 'Monkeys.', naoya: 'Too slow.', maki: 'Come on.', panda: 'Panda is not a panda.' }; return lines[f.cfg.id] || '...'; }
  destroy() {
    this.finishers?.abort();
    this.effects.clear(); this.domains.clear(); this.fx.clear();
    this.stage.scene.remove(this.root);
    this.stage.setViews(1);
    for (const f of this.fighters) f.model.dispose?.();
    this.hud?.unbind?.();
  }
}
