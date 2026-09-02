// DOMAINS — cast, barrier, sure-hit, clash, barrier break, simple domain,
// backlash. Every domain in the roster runs through this one system on its
// own config numbers; the bespoke minigames the old game attached to some of
// them are listed in the summary as not yet ported.
import { v3, flatDist } from '../core/math.js';

export class Domains {
  constructor(match) { this.match = match; this.active = null; this.clash = null; }
  get fx() { return this.match.fx; }
  isMyDomain(f) { return this.active && this.active.caster === f; }
  enemyDomainOn(f) { return this.active && this.active.caster !== f && this.active.live; }
  inside(f) { return this.active && this.active.live; }

  castDomain(f, ctx) {
    const d = f.cfg.domain;
    if (this.active && this.active.caster !== f && this.active.live) {
      // DOMAIN CLASH: both barriers up — the higher refinement holds
      const mine = d.refinement ?? 5, theirs = this.active.caster.cfg.domain?.refinement ?? 5;
      f.consumeFullBar();
      this.match.announce('DOMAIN CLASH');
      this.match.stage.impactFrame(6, 0x080010, 0xf0e0ff);
      this.match.hitstop(20);
      if (mine > theirs) { this._collapse('clash'); f.setState('castDomain', { clip: 'domainCast' }); this.active = this._make(f, d, ctx); f.emit('domainCast', { name: d.name }); }
      else { f.applyBacklash(d.backlash); f.setState('hitHeavy', { clip: 'hitHeavy' }); f.hitstun = 30; f.emit('clashLost'); }
      return;
    }
    if (this.active) this._collapse('replaced');
    f.consumeFullBar();
    f.setState('castDomain', { clip: 'domainCast' });
    this.active = this._make(f, d, ctx);
    f.emit('domainCast', { name: d.name, jp: d.jpName });
    this.match.announce('DOMAIN EXPANSION', d.name);
    this.match.sfx.domainCast();
  }
  _make(f, d, ctx) {
    const radius = d.radius ?? 13;
    return { caster: f, def: d, t: 0, castT: (d.castFrames ?? 90) / 60, live: false, left: d.duration ?? 15, radius, tickT: 0, env: d.env || 'void', breakers: new Map(), node: null };
  }
  dismiss(f) { if (this.isMyDomain(f)) this._collapse('dismissed'); }
  _collapse(why) {
    const a = this.active; if (!a) return;
    this.active = null;
    for (const t of this.match.activeFighters) { t.domainRadius = null; if (t.state === 'voided' || t.state === 'castDomain') t.setState('idle', { clip: 'idle' }); if (t.buffs.voidDebuff === undefined && a.def.afterDebuff && t !== a.caster) t.addBuff('voidDebuff', a.def.afterDebuff.duration ?? 5); }
    a.caster.applyBacklash(a.def.backlash);
    a.caster.model.setEnergy(0);
    if (a.node) this.fx.removeDomain(a.node);
    this.match.setGrade('map', 0);
    this.match.music?.play('fight');
    this.match.emitMatch('domainEnd', { why, caster: a.caster });
    this.match.sfx.domainBreak();
  }
  update(dt, ctx) {
    const a = this.active; if (!a) return;
    a.t += dt;
    const f = a.caster;
    if (!a.live) {
      f.model.setEnergy(Math.min(0.8, a.t / a.castT), f.model.palette.energy);
      if (f.state !== 'castDomain') { this.active = null; f.applyBacklash(a.def.backlash); return; }   // interrupted
      if (a.t >= a.castT) {
        a.live = true;
        a.node = this.fx.domain(a.env, a.radius, f.pos, f.model.palette.energy);
        this.match.setGrade(a.env, 0);
        this.match.music?.play('domain');
        this.match.stage.impactFrame(5, 0x000000, 0xffffff);
        this.match.stage.flash(0.9, f.model.palette.energy);
        this.match.cam.shake(0.8);
        f.setState('idle', { clip: 'idle' });
        f.model.setEnergy(0.35, f.model.palette.energy);
        for (const t of this.match.activeFighters) {
          t.domainRadius = a.radius * 0.96;
          if (t !== f && a.def.sureHit?.effect === 'void_lock') { t.setState('voided', { clip: 'stunned' }); }
        }
        this.match.emitMatch('domainOpen', { caster: f, name: a.def.name });
      }
      return;
    }
    a.left -= dt;
    a.tickT += dt;
    const sh = a.def.sureHit;
    const interval = sh?.interval || 0.9;
    for (const t of this.match.activeFighters) {
      if (t === f || !t.alive) continue;
      // BARRIER BREAK: LT + D-pad right held inside — drains CE, breaks on full
      const inp = this.match.inputs.get(t);
      if (inp && inp.block && inp.ult && t.cfg.barrierBreak && !t.noCE) {
        const bb = t.cfg.barrierBreak;
        const prog = (a.breakers.get(t) || 0) + dt;
        a.breakers.set(t, prog);
        t.res.curCE = Math.max(0, t.res.curCE - bb.ceDrain * dt);
        t.res.hp = Math.max(1, t.res.hp - bb.chip * 0.3 * dt);
        t.emit('barrierBreaking', { k: prog / 2.5 });
        if (prog >= 2.5 && t.res.curCE > 0) { this.match.announce('BARRIER BREAK'); this._collapse('broken'); return; }
        if (t.res.curCE <= 0) a.breakers.set(t, 0);
      }
      // SIMPLE DOMAIN: block held inside halves the sure-hit and drains stamina
      const simple = inp && inp.block && !inp.ult && t.res.stamina > 0;
      if (simple) t.res.stamina = Math.max(0, t.res.stamina - (t.cfg.simpleDomainDrain ?? 20) * dt);
      if (a.tickT >= interval) {
        if (sh?.effect === 'void_lock') { t.res.hp = Math.max(0, t.res.hp - 2.5 * (simple ? 0.5 : 1)); if (t.state !== 'voided') t.setState('voided', { clip: 'stunned' }); }
        else {
          const dmg = (sh?.dmg ?? a.def.tickDmg ?? 4.5) * (simple ? 0.5 : 1) * 1.3;
          t.res.hp = Math.max(0, t.res.hp - dmg);
          if (!simple && !['launched', 'knockdown', 'getup', 'attack', 'ct'].includes(t.state) && Math.random() < 0.35) { t.setState('hitLight', { clip: 'hitLight' }); t.hitstun = 12; }
          this.fx.sureHit(t.chest, f.model.palette.energy);
        }
        this.match.onDomainTick(f, t);
      }
    }
    if (a.tickT >= interval) a.tickT = 0;
    if (a.node) this.fx.updateDomain(a.node, dt, f.pos);
    if (a.left <= 0 || !f.alive) this._collapse(f.alive ? 'expired' : 'casterDown');
  }
  clear() { if (this.active) this._collapse('reset'); }
}
