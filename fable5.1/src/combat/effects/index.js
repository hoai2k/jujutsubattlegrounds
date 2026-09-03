// THE EFFECT DISPATCHER. Techniques, specials and ultimates resolve here on
// a small vocabulary (see table.js). Entities it spawns (projectiles, zones,
// beams, summons) live in `this.ents` and tick on the logic clock; their
// visuals are asked of `fx` by shape name so the dispatcher never touches
// THREE beyond vectors.
import * as THREE from 'three';
import { v3, clamp, rand, flatDist } from '../../core/math.js';
import { effectDef } from './table.js';
import { computeDamage, inArc } from '../hits.js';

const KD = { type: 'knockdown' }, LAUNCH = { type: 'launcher' };
const chestOf = f => f.chest;

export class Effects {
  constructor(match) {
    this.match = match;
    this.ents = [];
    this.summons = [];
  }
  get fx() { return this.match.fx; }
  get sfx() { return this.match.sfx; }
  targetsOf(caster) { return this.match.activeFighters.filter(f => f !== caster && f.alive); }
  nearest(caster) { let best = null, bd = Infinity; for (const t of this.targetsOf(caster)) { const d = flatDist(caster.pos, t.pos); if (d < bd) { bd = d; best = t; } } return best; }

  // ---- the hit sender ----------------------------------------------------
  hit(caster, target, move, def, extra = {}) {
    const { dmg, crit } = computeDamage(caster, (extra.dmg ?? move.dmg ?? 6), { canCrit: !move.copied });
    const type = extra.type ?? (def.kd || move.type === 'knockdown' ? 'knockdown' : (move.type || (move.kbY > 5 ? 'launcher' : 'normal')));
    const dir = extra.dir || v3(target.pos.x - caster.pos.x, 0, target.pos.z - caster.pos.z).normalize();
    const hit = {
      dmg, crit, kb: extra.kb ?? move.kb ?? 3, kbY: extra.kbY ?? move.kbY ?? 0, hitstun: extra.hitstun ?? move.hitstun ?? 20, type,
      attacker: caster, dir, unblockable: !!(def.unblockable || move.unblockable), otgOk: !!extra.otgOk, isCT: true, basic: false, src: extra.src || def.arch
    };
    const r = target.applyHit(hit, this.match.ctxFor(caster));
    this.match.onHit(caster, target, r, { ...hit, heavy: hit.hitstun >= 20 || type !== 'normal', knockdown: type === 'knockdown', color: def.color, at: extra.at });
    if (r === 'hit' || r === 'otg' || r === 'tech') {
      caster.hitsDealt++; caster.comboHits++; caster.comboTimer = 0; caster.comboDmg += dmg;
      if (def.opens === 'blackflash' && caster.cfg.blackFlash) { caster.bfT = (caster.cfg.blackFlash.delay ?? 6) + (caster.cfg.blackFlash.window ?? 5); caster.bfBase = dmg; caster.emit('bfWindow'); }
      if (def.debuff) this.applyDebuff(caster, target, def.debuff, move);
      if (def.burn) target.addBuff('burn', 3, null);
      if (def.root) { target.rootT = def.root; if (!['launched', 'knockdown'].includes(target.state)) target.setState('rooted', { clip: 'stunned' }); }
      if (def.freeze) { target.frozenT = def.freeze; if (!['launched', 'knockdown'].includes(target.state)) target.setState('frozen', { clip: 'frozen' }); }
      caster.gainMaxCE((caster.cfg.stats.ceGainPerPunch ?? 6) * 0.5);
    }
    return r;
  }
  applyDebuff(caster, target, kind, move) {
    if (kind === 'soulWound') target.addBuff('soulWound', 4, { speed: 0.85 });
    else if (kind === 'confiscate') { target.addBuff('confiscate', move.duration ?? 6); target.emit('confiscated'); }
    else if (kind === 'seal') target.addBuff('seal', move.sealSeconds ?? 5);
    else if (kind === 'melt') target.addBuff('melt', 5);
  }

  // ---- FIRE: a technique's active frame ---------------------------------
  fire(caster, move, ctx, refire = false) {
    const def = effectDef(move.effect);
    const color = def.color ?? caster.model.palette.energy;
    caster.emit('technique', { move, def });
    switch (def.arch) {
      case 'melee': return this.melee(caster, move, def);
      case 'burst': return this.burst(caster, move, def);
      case 'projectile': return this.projectile(caster, move, def);
      case 'volley': return this.volley(caster, move, def);
      case 'beam': return this.beam(caster, move, def);
      case 'zone': return this.zone(caster, move, def);
      case 'grab': return this.grab(caster, move, def);
      case 'rush': return this.rush(caster, move, def);
      case 'pull': return this.pull(caster, move, def);
      case 'buff': return this.buff(caster, move, def);
      case 'transform': return this.transform(caster, move, def);
      case 'summon': return this.summon(caster, move, def);
      case 'counter': caster.counter = { t: (move.active ?? 26) / 60 + 0.1 }; this.fx.aura(caster, color, 0.5); return;
      case 'speech': return this.speech(caster, move, def);
      case 'random': return this.randomBit(caster, move, def);
      default: return this.melee(caster, move, def);
    }
  }
  melee(caster, move, def) {
    const reach = def.reach ?? move.reach ?? 2.0, arc = def.arc ?? move.arc ?? 1.6;
    const hits = def.multi || 1;
    this.fx.slash(caster, reach, arc, def.color, def.shape);
    let any = false;
    for (const t of this.targetsOf(caster)) {
      if (!inArc(caster, t, reach, arc)) continue;
      any = true;
      if (def.noDmg) { this.applyDebuff(caster, t, def.debuff, move); this.match.onHit(caster, t, 'hit', { dmg: 0, kb: 0, hitstun: 10, color: def.color, soft: true }); continue; }
      if (def.execute && t.res.hp <= t.maxHP * 0.3) { t.res.hp = 0; this.match.onHit(caster, t, 'hit', { dmg: 999, type: 'knockdown', kb: 4, color: def.color, execute: true }); t.applyHit({ dmg: 0, kb: 6, kbY: 0, hitstun: 30, type: 'knockdown', attacker: caster, unblockable: true, basic: false }, this.match.ctxFor(caster)); continue; }
      for (let i = 0; i < hits; i++) this.hit(caster, t, move, def, { dmg: (move.dmg ?? 8) / (hits > 1 ? 1.4 : 1) });
      if (def.shock) this.fx.shockRing(t.pos, def.shock, def.color);
    }
    if (!any) { caster.bfChain = 0; caster.emit('whiff'); }
  }
  burst(caster, move, def) {
    const radius = def.radius ?? move.radius ?? 3;
    this.fx.burst(caster.pos, radius, def.color, def.shape);
    if (def.quake) this.match.cam.shake(0.5);
    const hits = def.multi || 1;
    for (const t of this.targetsOf(caster)) {
      if (flatDist(caster.pos, t.pos) > radius + t.hurtBox.radius) continue;
      for (let i = 0; i < hits; i++) this.hit(caster, t, move, def, { dmg: (move.dmg ?? 10) / (hits > 1 ? 1.5 : 1), type: def.kd ? 'knockdown' : undefined });
      if (def.root) { t.rootT = def.root; }
      if (def.freeze) { t.frozenT = def.freeze; t.setState('frozen', { clip: 'frozen' }); }
    }
  }
  projectile(caster, move, def, opts = {}) {
    const fwd = opts.dir || caster.forward();
    const target = this.nearest(caster);
    const speed = def.speed ?? move.speed ?? 16, range = def.range ?? move.range ?? 8, size = def.size ?? move.size ?? 0.5;
    const start = chestOf(caster).addScaledVector(fwd, 0.8);
    const ent = {
      kind: 'projectile', caster, move, def, pos: start, vel: fwd.clone().multiplyScalar(speed), size, life: range / speed + 0.05, t: 0,
      homing: def.homing ?? move.homing ?? 0, target, hitSet: new Set(), pierce: !!def.pierce, boomerang: !!def.boomerang, returning: false,
      node: this.fx.body(def.shape || 'orb', size, def.color, start)
    };
    this.ents.push(ent);
    this.sfx.cast(def.shape, def.color);
    return ent;
  }
  volley(caster, move, def) {
    const n = def.count ?? move.count ?? 3, spread = def.spread ?? 0.35;
    const base = caster.forward();
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * spread;
      const dir = v3(Math.sin(caster.facing + a), 0, Math.cos(caster.facing + a));
      const e = this.projectile(caster, { ...move, dmg: (move.dmg ?? 8) / Math.max(1, n * 0.55) }, def, { dir });
      e.delay = i * 0.05; e.pos.addScaledVector(base, -0.3 * i);
    }
  }
  beam(caster, move, def) {
    const range = def.range ?? move.range ?? 12, width = def.width ?? move.width ?? 1.0;
    const fwd = caster.forward();
    const origin = chestOf(caster);
    const ent = { kind: 'beam', caster, move, def, origin, dir: fwd, range, width, t: 0, life: def.travel ? range / def.travel : 0.35, hitSet: new Set(), node: this.fx.beam(origin, fwd, range, width, def.color, def.shape) };
    this.ents.push(ent);
    this.sfx.beam(def.color);
    this.match.cam.shake(0.25);
  }
  zone(caster, move, def) {
    const target = this.nearest(caster);
    const reach = def.reach ?? move.reach ?? move.aimRange ?? 6;
    let at;
    if (def.onTarget && target) at = target.pos.clone();
    else if (target && flatDist(caster.pos, target.pos) <= reach) at = target.pos.clone();
    else at = caster.pos.clone().addScaledVector(caster.forward(), Math.min(reach, 3));
    at.y = this.match.floorAt(at.x, at.z, at.y + 0.5);
    const radius = def.radius ?? move.radius ?? 2, delay = move.delay ?? def.delay ?? 0.35;
    const ent = { kind: 'zone', caster, move, def, pos: at, radius, t: 0, delay, ticks: def.ticks ?? 1, ticked: 0, second: !!def.second, node: this.fx.zoneMark(at, radius, def.color, def.shape, delay) };
    this.ents.push(ent);
  }
  grab(caster, move, def) {
    const reach = move.reach ?? 1.7;
    for (const t of this.targetsOf(caster)) {
      if (!inArc(caster, t, reach, 1.4) || t.state === 'knockdown' || t.state === 'launched') continue;
      if (t.state === 'block' || t.state === 'blockstun') { /* grabs beat blocks */ }
      t.setState('grabbed', { clip: 'hitHeavy' });
      this.fx.aura(t, def.color, 0.4);
      const ent = { kind: 'grab', caster, target: t, move, def, t: 0, life: 0.55 };
      this.ents.push(ent);
      return;
    }
    caster.emit('whiff');
  }
  rush(caster, move, def) {
    const speed = def.lungeSpeed ?? move.lungeSpeed ?? 14;
    const fwd = caster.forward();
    caster.vel.x = fwd.x * speed; caster.vel.z = fwd.z * speed;
    caster.armorFrames = Math.max(caster.armorFrames, 6);
    this.fx.trail(caster, def.color, 0.35);
    const ent = { kind: 'rush', caster, move, def, t: 0, life: Math.max(0.2, (move.active ?? 8) / 60), hitSet: new Set(), reach: def.reach ?? move.reach ?? 2.0 };
    this.ents.push(ent);
    this.match.stage.speed(0.6, this.match.screenOf(caster));
  }
  pull(caster, move, def) {
    const range = move.range ?? def.range ?? 6.5, dur = move.pullTime ?? 0.7;
    const at = caster.pos.clone().addScaledVector(caster.forward(), Math.min(range * 0.6, 4));
    this.fx.body('orb', def.size ?? 0.5, def.color, at.clone().setY(1.2), dur);
    const ent = { kind: 'pull', caster, move, def, pos: at, range, t: 0, life: dur, hitSet: new Set() };
    this.ents.push(ent);
    this.sfx.cast('pull', def.color);
  }
  buff(caster, move, def) {
    const name = def.name || 'buff';
    caster.addBuff(name, move.duration ?? 6, { dmg: move.dmgMult, speed: move.speedMult, startup: move.startupMult });
    if (def.armor) caster.armorFrames = Math.max(caster.armorFrames, Math.round((move.duration ?? 6) * 60));
    caster.model.setEnergy(0.35, def.color);
    setTimeout(() => {}, 0);
    this.fx.aura(caster, def.color, 0.8);
    if (def.grade) this.match.setGrade(def.grade, move.duration ?? 6);
    this.sfx.powerUp(def.color);
  }
  transform(caster, move, def) {
    const u = caster.cfg.ultimate;
    caster.addBuff('transform', u.duration ?? 8, { dmg: u.dmgMult ?? 1.3, speed: u.speedMult ?? 1.1 });
    caster.model.setEnergy(0.6, def.color);
    this.fx.aura(caster, def.color, 1.2);
    this.fx.burst(caster.pos, 3, def.color, 'ring');
    this.match.stage.impactFrame(4, 0x100408, 0xffd0d0);
    this.sfx.transform();
    for (const t of this.targetsOf(caster)) if (flatDist(caster.pos, t.pos) < 3.2) this.hit(caster, t, { dmg: 6, kb: 6, kbY: 4, hitstun: 24 }, def, { type: 'launcher' });
  }
  summon(caster, move, def) {
    // a simplified ally: an energy construct that orbits and strikes the nearest opponent for a while
    const s = move.shikigami ? caster.cfg.shikigami?.defs?.[move.shikigami] : null;
    const hp = s?.hp ?? (def.weak ? 14 : def.strong ? 40 : 22), dmg = s?.dmg ?? move.dmg ?? (def.weak ? 3 : 6);
    const life = s?.duration ?? (def.weak ? 6 : 10);
    const ent = { kind: 'summon', caster, move, def, pos: caster.pos.clone().addScaledVector(caster.forward(), 1.2), hp, dmg, life, t: 0, cd: 0.6, node: this.fx.summon(def.color, def.strong ? 1.3 : def.weak ? 0.6 : 0.9) };
    this.ents.push(ent); this.summons.push(ent);
    this.sfx.summon();
  }
  speech(caster, move, def) {
    const kind = def.kind || (move.commandKey ? move.commandKey : 'root');
    const range = move.range ?? 7;
    this.fx.speech(caster, def.color || 0xc8b8ff, range);
    for (const t of this.targetsOf(caster)) {
      if (!inArc(caster, t, range, 1.8)) continue;
      if (kind === 'pull' || kind === 'come_here') { const d = v3(caster.pos.x - t.pos.x, 0, caster.pos.z - t.pos.z).normalize(); t.vel.x = d.x * 12; t.vel.z = d.z * 12; t.setState('hitLight', { clip: 'hitLight' }); t.hitstun = 18; }
      else if (kind === 'flee' || kind === 'run_away') { const d = v3(t.pos.x - caster.pos.x, 0, t.pos.z - caster.pos.z).normalize(); t.vel.x = d.x * 14; t.vel.z = d.z * 14; t.setState('hitLight', { clip: 'hitLight' }); t.hitstun = 20; }
      else if (kind === 'sleep' || kind === 'root' || kind === 'dont_move') { t.rootT = 1.4; t.setState('rooted', { clip: 'stunned' }); }
      else this.hit(caster, t, move, def, { type: kind === 'blast' || kind === 'blast_away' ? 'knockdown' : 'launcher', kb: 7, kbY: 6 });
      this.match.onHit(caster, t, 'hit', { dmg: 0, hitstun: 10, color: def.color, soft: true });
    }
  }
  randomBit(caster, move, def) {
    const pick = ['burst', 'projectile', 'melee', 'zone'][Math.floor(caster.rng() * 4)];
    const shapes = { burst: 'ring', projectile: 'pie', melee: 'slash', zone: 'anvil' };
    this[pick](caster, { ...move, dmg: (move.dmg ?? 10) * (0.8 + caster.rng() * 0.6), radius: 3, range: 8, speed: 14, reach: 2.4 }, { ...def, shape: shapes[pick] });
    caster.emit('bit', { pick });
  }

  // ---- SPECIALS (B) -------------------------------------------------------
  special(f, sp, input, ctx) {
    const key = sp.key || '';
    const color = f.model.palette.accent;
    const opp = this.nearest(f);
    switch (key) {
      case 'gojo_teleport': {
        if (ctx.domains?.enemyDomainOn(f)) { f.emit('noCE', { why: 'SEALED IN A DOMAIN' }); return false; }
        const mag = Math.hypot(input.move.x, input.move.z);
        let to;
        if (mag > 0.3 || !opp) { const d = f._moveVec(input.move, ctx.camYaw).normalize(); to = f.pos.clone().addScaledVector(d, sp.range ?? 4); }
        else { const back = v3(opp.pos.x - f.pos.x, 0, opp.pos.z - f.pos.z).normalize(); to = opp.pos.clone().addScaledVector(back, sp.behindGap ?? 1.5); }
        this.fx.blink(f.pos, color); this.match.clampToArena(to); to.y = this.match.floorAt(to.x, to.z, to.y + 1);
        f.pos.copy(to); f.vel.set(0, 0, 0); f.iFrames = Math.max(f.iFrames, sp.iFrames ?? 18);
        if (opp) f.facing = Math.atan2(opp.pos.x - f.pos.x, opp.pos.z - f.pos.z);
        this.fx.blink(f.pos, color); this.sfx.blink();
        f.setState('special', { move: { stateFrames: sp.stateFrames ?? 12 }, clip: sp.clip || 'special' });
        return true;
      }
      case 'todo_boogie': {
        if (!opp) return false;
        const a = f.pos.clone(), b = opp.pos.clone();
        f.pos.copy(b); opp.pos.copy(a);
        this.fx.clap(a, b, color); this.sfx.clap();
        opp.emit('swapped');
        f.setState('special', { move: { stateFrames: sp.stateFrames ?? 10 }, clip: sp.clip || 'boogie' });
        return true;
      }
      case 'yuta_copy': return f.startCopy() || (f.emit('noCE', { why: 'NOTHING COPIED' }), false);
      case 'nanami_ratio': {
        // the timing minigame compressed: a press lands on a sweeping marker
        f.ratioSweep = f.ratioSweep == null ? 0 : f.ratioSweep;
        const hitAt = Math.abs(((this.match.tick * 0.09) % 1) - 0.7);
        const level = hitAt < 0.05 ? 2 : hitAt < 0.12 ? 1 : 0;
        f.ratioPrimed = level; f.ratioPrimedT = 4; f.ratioSweep = null;
        f.emit('ratioResult', { level });
        if (!level) f._setSpecialCD(sp.missCooldown ?? 8);
        this.fx.aura(f, level ? 0xf2b23c : 0x606060, level ? 0.6 : 0.2);
        return true;
      }
      case 'sukuna_finger': {
        if (f.stacks >= 4) { f.emit('noCE', { why: 'NO FINGERS LEFT' }); return false; }
        f.stacks++; f.emit('fingerEaten', { stacks: f.stacks });
        f.setState('special', { move: { stateFrames: 58 }, clip: sp.clip || 'special' });
        f.armorFrames = 0; this.fx.aura(f, 0xff2f45, 0.9); this.sfx.powerUp(0xff2f45);
        return true;
      }
      case 'yuji_blackflash': case 'nobara_blackflash': {
        if (key === 'nobara_blackflash') { const m = { ...f.cfg.special, kind: 'ct', slot: 'special', isCT: true, startup: sp.startup ?? 12, active: sp.active ?? 4, recovery: sp.recovery ?? 20, clip: sp.clip || 'ct1' }; f.setState('ct', { move: m }); f._syncMoveAnim(m, m.clip); return true; }
        f.emit('noCE', { why: '' }); return false;
      }
      case 'hakari_shutter': f.shield = { hits: sp.hits ?? 3, t: sp.duration ?? 4 }; this.fx.aura(f, color, 0.5); this.sfx.powerUp(color); return true;
      case 'uro_reflect': case 'hakari_goldrush': f.counter = { t: 0.8 }; f.setState('special', { move: { stateFrames: 30 }, clip: sp.clip || 'special' }); this.fx.aura(f, color, 0.5); return true;
      case 'jogo_overheat': case 'choso_redscale': case 'kashimo_arcdash': case 'ino_doping': f.addBuff(key, sp.duration ?? 8, { dmg: sp.dmgMult ?? 1.2, speed: sp.speedMult ?? 1.1 }); f.model.setEnergy(0.4, color); this.fx.aura(f, color, 0.8); this.sfx.powerUp(color); if (key === 'kashimo_arcdash') { const d = f.forward(); f.vel.x = d.x * 18; f.vel.z = d.z * 18; f.iFrames = 10; } return true;
      case 'takaba_riff': case 'yaga_build': case 'ryu_brace': case 'gojo_blossom': {
        const hold = { holdFrames: sp.holdFrames ?? 96, tick: (ff, c, dt, held) => { ff.res.stamina = Math.max(0, ff.res.stamina - (sp.staminaDrain ?? 10) * dt); if (key === 'ryu_brace') ff.armorFrames = 3; if (key === 'gojo_blossom') ff.counter = { t: 0.2 }; }, release: (ff, c, frames) => { if (key === 'yaga_build') this.summon(ff, { dmg: 5 + frames / 12 }, { color, strong: frames > 70 }); if (key === 'takaba_riff') ff.gainMaxCE(frames * 0.35); if (key === 'ryu_brace') { ff.addBuff('brace', 4, { dmg: 1.15 }); } } };
        f.setState('hold', { move: hold, clip: sp.clip || 'special' }); this.fx.aura(f, color, 0.4); return true;
      }
      case 'megumi_wheel': case 'geto_wheel': case 'inumaki_wheel': case 'ino_wheel': case 'reggie_wheel': case 'toji_arsenal': case 'maki_swap': case 'panda_swap': case 'naoya_stance': case 'yuki_command': case 'miwa_simple_domain': {
        // cycle the stance / binding; stances swap clip suffixes where the clips exist
        const opts = f.cfg.stances ? Object.keys(f.cfg.stances) : f.cfg.cores ? f.cfg.cores.order : f.cfg.beasts ? Object.keys(f.cfg.beasts.defs || {}) : null;
        if (opts && opts.length) { const i = (opts.indexOf(f.stance) + 1) % opts.length; f.stance = opts[i]; f.emit('stanceSwap', { key: f.stance }); }
        else f.emit('wheel', { key });
        f.setState('special', { move: { stateFrames: 10 }, clip: sp.clip || 'special' });
        this.fx.aura(f, color, 0.3); this.sfx.tick();
        return true;
      }
      case 'higuruma_judgeman': case 'mahito_summon': case 'dagon_summon': this.summon(f, { dmg: sp.minion?.dmg ?? 4 }, { color, weak: true }); f.setState('special', { move: { stateFrames: 16 }, clip: sp.clip || 'special' }); return true;
      case 'kurourushi_devour': this.grab(f, { reach: 2.0, dmg: sp.dmg ?? 12, kb: 5 }, { color }); f.setState('special', { move: { stateFrames: 20 }, clip: sp.clip || 'special' }); return true;
      case 'uraume_frostfield': case 'hanami_rootfield': this.zone(f, { dmg: sp.dmg ?? 5, radius: sp.radius ?? 3.5, delay: 0.3, reach: 4 }, { color, freeze: key === 'uraume_frostfield' ? 0.6 : 0, root: key === 'hanami_rootfield' ? 1.0 : 0, ticks: 2, shape: key === 'uraume_frostfield' ? 'ice' : 'roots' }); f.setState('special', { move: { stateFrames: 18 }, clip: sp.clip || 'special' }); return true;
      default: { this.fx.aura(f, color, 0.4); f.addBuff('special', sp.duration ?? 4, { dmg: 1.08 }); f.setState('special', { move: { stateFrames: 12 }, clip: sp.clip || 'special' }); return true; }
    }
  }
  blackFlash(f, ctx) {
    const opp = this.nearest(f); if (!opp) return;
    const bf = f.cfg.blackFlash;
    if (!inArc(f, opp, bf.reach ?? 2.4, 2.0)) { f.bfChain = 0; return; }
    f.bfChain++;
    const dmg = (f.bfBase || 8) * (bf.dmgMult ?? 2.5);
    this.match.stage.impactFrame(4, 0x0a0000, 0xffe8e0);
    this.match.stage.flash(0.7, 0xff3030);
    this.match.hitstop(12);
    this.hit(f, opp, { dmg, kb: 7, kbY: 6, hitstun: 30 }, { color: 0xff2020, arch: 'blackflash' }, { type: 'launcher', src: 'blackflash' });
    if (bf.ceRefund) f.res.curCE = Math.min(f.res.maxCE, f.res.curCE + bf.ceRefund);
    if (bf.maxSpike) f.gainMaxCE(bf.maxSpike);
    this.fx.blackFlash(opp.chest);
    this.sfx.blackFlash();
    f.emit('blackFlash', { chain: f.bfChain });
  }
  assassinate(f, ctx) {
    const u = f.cfg.ultimate;
    f._setSpecialCD(u.cooldown ?? 20);
    const move = { name: u.name || 'ASSASSINATION', kind: 'ct', slot: 'ult', isCT: true, effect: 'toji_assassinate', startup: u.startup ?? 10, active: 10, recovery: u.recovery ?? 24, dmg: u.dmg ?? 26, kb: 8, kbY: 2, hitstun: 32, clip: u.clip || 'ult' };
    f.setState('ct', { move }); f._syncMoveAnim(move, move.clip); f.emit('ultBurst', { move });
  }

  // ---- TICK -----------------------------------------------------------------
  update(dt) {
    const M = this.match;
    for (let i = this.ents.length - 1; i >= 0; i--) {
      const e = this.ents[i];
      if (e.delay > 0) { e.delay -= dt; continue; }
      e.t += dt;
      let dead = false;
      switch (e.kind) {
        case 'projectile': {
          if (e.homing && e.target && e.target.alive) {
            const to = v3(e.target.pos.x - e.pos.x, e.target.chest.y - e.pos.y, e.target.pos.z - e.pos.z).normalize();
            const sp = e.vel.length(); e.vel.lerp(to.multiplyScalar(sp), Math.min(1, e.homing * dt)).setLength(sp);
          }
          if (e.boomerang && !e.returning && e.t > e.life * 0.5) { e.returning = true; e.hitSet.clear(); }
          if (e.returning) { const to = v3(e.caster.chest.x - e.pos.x, e.caster.chest.y - e.pos.y, e.caster.chest.z - e.pos.z); if (to.length() < 0.8) dead = true; e.vel.copy(to.normalize().multiplyScalar(e.vel.length())); }
          e.pos.addScaledVector(e.vel, dt);
          e.node?.position.copy(e.pos);
          for (const t of this.targetsOf(e.caster)) {
            if (e.hitSet.has(t)) continue;
            if (flatDist(e.pos, t.pos) < e.size + t.hurtBox.radius && Math.abs(e.pos.y - t.chest.y) < t.hurtBox.height) {
              e.hitSet.add(t);
              const dmg = e.returning ? (e.move.dmg ?? 8) * (e.def.returnDmg ?? 0.6) : e.move.dmg;
              this.hit(e.caster, t, e.move, e.def, { dmg, dir: v3(e.vel.x, 0, e.vel.z).normalize(), at: e.pos.clone() });
              if (e.def.explode) { this.fx.burst(e.pos, e.def.explode, e.def.color, 'ring'); for (const o of this.targetsOf(e.caster)) if (o !== t && flatDist(e.pos, o.pos) < e.def.explode) this.hit(e.caster, o, e.move, e.def, { dmg: e.move.dmg * 0.6 }); }
              if (!e.pierce && !e.boomerang) dead = true;
            }
          }
          if (!e.returning && e.t >= e.life) { if (e.boomerang) { e.returning = true; e.hitSet.clear(); } else dead = true; }
          if (M.arena?.hitsWall?.(e.pos)) dead = true;
          if (dead) this.fx.pop(e.pos, e.def.color);
          break;
        }
        case 'beam': {
          if (e.t <= 0.05 || e.def.travel) {
            const reach = e.def.travel ? Math.min(e.range, e.t * e.def.travel) : e.range;
            for (const t of this.targetsOf(e.caster)) {
              if (e.hitSet.has(t)) continue;
              const rel = v3(t.pos.x - e.origin.x, 0, t.pos.z - e.origin.z);
              const along = rel.dot(e.dir);
              if (along < 0 || along > reach) continue;
              const side = Math.hypot(rel.x - e.dir.x * along, rel.z - e.dir.z * along);
              if (side > e.width / 2 + t.hurtBox.radius) continue;
              e.hitSet.add(t);
              this.hit(e.caster, t, e.move, e.def, { dir: e.dir.clone(), at: t.chest, type: e.def.kd ? 'knockdown' : undefined });
            }
          }
          if (e.t >= e.life) dead = true;
          break;
        }
        case 'zone': {
          if (e.t >= e.delay && e.ticked < e.ticks) {
            const interval = e.ticks > 1 ? 0.35 : 1;
            if (e.t >= e.delay + e.ticked * interval) {
              e.ticked++;
              this.fx.burst(e.pos, e.radius, e.def.color, e.def.shape || 'ring');
              for (const t of this.targetsOf(e.caster)) {
                if (flatDist(e.pos, t.pos) > e.radius + t.hurtBox.radius * 0.5 || t.pos.y - e.pos.y > 2) continue;
                const second = e.second && e.ticked === 2;
                this.hit(e.caster, t, e.move, e.def, { dmg: second ? (e.move.dmg2 ?? e.move.dmg) : e.move.dmg, type: second || e.def.kd ? 'launcher' : undefined, kbY: second ? 7 : e.move.kbY, otgOk: true });
                if (e.def.pull) { const d = v3(e.pos.x - t.pos.x, 0, e.pos.z - t.pos.z).normalize(); t.vel.x += d.x * e.def.pull; t.vel.z += d.z * e.def.pull; }
              }
              if (e.second && e.ticked === 1) { e.ticks = 2; e.delay = e.delay + (e.move.delay ?? 0.45); e.ticked = 0; e.second = false; e._secondArmed = true; }
              else if (e._secondArmed && e.ticked === 1) { e.ticked = 2; }
            }
          }
          if (e.t >= e.delay + e.ticks * 0.5 + 0.3) dead = true;
          break;
        }
        case 'grab': {
          const t = e.target;
          t.pos.copy(e.caster.pos.clone().addScaledVector(e.caster.forward(), 1.1)); t.vel.set(0, 0, 0);
          if (e.t >= e.life) {
            t.setState('idle', { clip: 'idle' });
            this.hit(e.caster, t, e.move, e.def, { type: 'knockdown', kb: e.move.kb ?? 6, kbY: 3, otgOk: true });
            M.cam.shake(0.4); dead = true;
          }
          break;
        }
        case 'rush': {
          for (const t of this.targetsOf(e.caster)) {
            if (e.hitSet.has(t) && !e.def.multi) continue;
            if (!inArc(e.caster, t, e.reach, 1.6)) continue;
            if (e.def.multi && e.hitSet.has(t) && (e.t * 60) % 6 > 1) continue;
            e.hitSet.add(t);
            this.hit(e.caster, t, e.move, e.def, { type: e.def.kd && e.t > e.life * 0.6 ? 'knockdown' : undefined, dmg: e.def.multi ? (e.move.dmg ?? 10) / 3 : e.move.dmg });
          }
          if (e.t >= e.life) dead = true;
          break;
        }
        case 'pull': {
          for (const t of this.targetsOf(e.caster)) {
            if (flatDist(e.pos, t.pos) > e.range) continue;
            const d = v3(e.pos.x - t.pos.x, 0, e.pos.z - t.pos.z), dist = d.length() || 1; d.divideScalar(dist);
            t.vel.x += d.x * 26 * dt; t.vel.z += d.z * 26 * dt;
            if (dist < 1.2 && !e.hitSet.has(t)) { e.hitSet.add(t); this.hit(e.caster, t, e.move, e.def, { type: 'launcher', kbY: 5, at: t.chest }); }
          }
          if (e.t >= e.life) dead = true;
          break;
        }
        case 'summon': {
          const t = this.nearest(e.caster);
          e.cd -= dt;
          if (t) {
            const to = v3(t.pos.x - e.pos.x, 0, t.pos.z - e.pos.z), dist = to.length() || 1; to.divideScalar(dist);
            if (dist > 1.6) { e.pos.addScaledVector(to, 4.5 * dt); }
            else if (e.cd <= 0) { e.cd = 1.1; this.hit(e.caster, t, { dmg: e.dmg, kb: 2.5, hitstun: 16 }, e.def, { src: 'summon' }); this.fx.pop(t.chest, e.def.color); }
          }
          e.pos.y = M.floorAt(e.pos.x, e.pos.z, e.pos.y + 1) + 0.9 + Math.sin(e.t * 4) * 0.15;
          e.node?.position.copy(e.pos);
          // opponents can hit it: any active melee window near it damages it
          for (const t of this.targetsOf(e.caster)) if (t.activeHit && !t.activeHit.confirmed && inArc(t, { pos: e.pos, hurtBox: { pad: 0 } }, t.activeHit.def.reach ?? 1.6)) { t.activeHit.confirmed = true; e.hp -= t.activeHit.def.dmg * 2; this.fx.pop(e.pos, e.def.color); }
          if (e.t >= e.life || e.hp <= 0) { dead = true; this.fx.burst(e.pos, 1, e.def.color, 'ring'); }
          break;
        }
      }
      if (dead) { if (e.node) this.fx.remove(e.node); this.ents.splice(i, 1); const si = this.summons.indexOf(e); if (si >= 0) this.summons.splice(si, 1); }
    }
  }
  clear() { for (const e of this.ents) if (e.node) this.fx.remove(e.node); this.ents.length = 0; this.summons.length = 0; }
}
