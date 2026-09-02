// CPU — a readable opponent with personality knobs. It reads distance, the
// opponent's state and its own resources, keeps a decision cadence (no
// frame-perfect play) and commits to short plans: approach / poke / string /
// technique / block / dodge / space / ultimate.
import { flatDist, rand } from '../core/math.js';
import { emptyFrame } from './input.js';

export const PERSONALITIES = {
  balanced: { aggro: 0.55, block: 0.45, tech: 0.5, dodge: 0.4, react: 0.24 },
  rushdown: { aggro: 0.85, block: 0.25, tech: 0.35, dodge: 0.35, react: 0.2 },
  zoner: { aggro: 0.35, block: 0.5, tech: 0.8, dodge: 0.5, react: 0.22 },
  turtle: { aggro: 0.3, block: 0.8, tech: 0.4, dodge: 0.3, react: 0.28 }
};
const BY_ID = { gojo: 'zoner', jogo: 'zoner', nobara: 'zoner', ryu: 'zoner', kashimo: 'zoner', todo: 'rushdown', yuji: 'rushdown', toji: 'rushdown', maki: 'rushdown', sukuna: 'rushdown', naoya: 'rushdown', higuruma: 'turtle', nanami: 'balanced', hakari: 'rushdown', panda: 'balanced', yaga: 'turtle' };

export class CPU {
  constructor(me, match, difficulty = 1) {
    this.me = me; this.match = match;
    this.p = { ...(PERSONALITIES[BY_ID[me.cfg.id]] || PERSONALITIES.balanced) };
    this.d = difficulty;   // 0 easy .. 2 hard
    this.p.react *= [1.8, 1.0, 0.6][difficulty] ?? 1;
    this.plan = null; this.planT = 0; this.cd = 0; this.hold = null; this.holdT = 0; this.strafe = 1; this.strafeT = 0; this.tauntT = 0;
  }
  get opp() { let best = null, bd = Infinity; for (const f of this.match.activeFighters) { if (f === this.me || !f.alive) continue; const d = flatDist(this.me.pos, f.pos); if (d < bd) { bd = d; best = f; } } return best; }
  frame() {
    const f = emptyFrame(); const me = this.me, opp = this.opp; const dt = 1 / 60;
    if (!opp || !me.alive || me.state === 'intro' || me.state === 'ko' || me.state === 'victory') return f;
    this.cd -= dt; this.planT -= dt; this.strafeT -= dt;
    const dist = flatDist(me.pos, opp.pos);
    const oppAttacking = opp.state === 'attack' || opp.state === 'ct';
    const oppDown = ['knockdown', 'getup', 'launched', 'hitHeavy'].includes(opp.state);
    const myTurn = ['idle', 'walk', 'run', 'dash'].includes(me.state);
    // held plan continues
    if (this.hold && this.holdT > 0) { this.holdT -= dt; Object.assign(f, this.hold); return f; }
    this.hold = null;
    if (this.strafeT <= 0) { this.strafe = Math.random() < 0.5 ? -1 : 1; this.strafeT = rand(0.6, 1.6); }
    // BARRIER BREAK inside an enemy domain
    if (this.match.domains.enemyDomainOn(me) && me.cfg.barrierBreak && !me.noCE) { f.block = true; f.ult = true; return f; }
    // reaction: block or dodge an incoming attack
    if (oppAttacking && dist < 3.0 && myTurn && this.cd <= 0) {
      const r = Math.random();
      if (r < this.p.block) { this.hold = { block: true }; this.holdT = rand(0.25, 0.5); this.cd = this.p.react; Object.assign(f, this.hold); return f; }
      if (r < this.p.block + this.p.dodge) { this.hold = { dash: true, dashP: true, move: { x: this.strafe, z: 0.3 } }; this.holdT = 0.2; this.cd = this.p.react; Object.assign(f, this.hold); return f; }
    }
    // tech when launched / down
    if ((me.state === 'launched' || me.state === 'knockdown') && Math.random() < this.p.tech * 0.05) f.jumpP = true;
    if (!myTurn) return f;
    // ultimate when ready and the opponent is open
    if (me.ultReady && (oppDown || dist < 4) && Math.random() < 0.06 && this.cd <= 0) { f.ultP = true; this.cd = 1; return f; }
    if (this.cd > 0) { this._approach(f, dist, opp); return f; }
    // decide
    const aggro = this.p.aggro + (me.res.hp < me.maxHP * 0.3 ? -0.15 : 0) + (opp.res.hp < opp.maxHP * 0.25 ? 0.2 : 0);
    const r = Math.random();
    if (dist < 2.0) {
      if (oppDown && r < 0.5) { this._approach(f, dist, opp); this.cd = 0.2; return f; }
      if (r < aggro * 0.7) { this.hold = { punchP: true, punch: true }; this.holdT = 0.05; this.cd = 0.22; f.punchP = true; f.punch = true; this._queueString(); return f; }
      if (r < aggro * 0.85) { f.heavyP = true; this.cd = 0.6; return f; }
      if (r < aggro * 0.95 && me.cfg.special && me.specialCD <= 0) { f.specialP = true; this.cd = 0.5; return f; }
      f.move = { x: this.strafe * 0.8, z: 0.2 }; this.cd = 0.15; return f;
    }
    if (dist < 7) {
      if (r < this.p.tech * 0.45 && me.res.curCE >= (me.cfg.ct1?.cost ?? 15)) { f.ct1P = true; this.cd = 0.7; return f; }
      if (r < this.p.tech * 0.7 && me.res.curCE >= (me.cfg.ct2?.cost ?? 20) && dist < 4) { f.ct2P = true; this.cd = 0.8; return f; }
      if (r < this.p.tech * 0.7 + 0.15 && me.res.stamina > 40) { this.hold = { dash: true, dashP: true, move: { x: 0, z: -1 } }; this.holdT = 0.25; this.cd = 0.3; Object.assign(f, this.hold); return f; }
    }
    if (dist >= 7 && r < this.p.tech * 0.5 && me.res.curCE >= (me.cfg.ct1?.cost ?? 15)) { f.ct1P = true; this.cd = 0.9; return f; }
    if (oppDown && dist > 3 && Math.random() < 0.004 && me.tauntCD <= 0) { f.tauntP = true; this.cd = 1.5; return f; }
    this._approach(f, dist, opp);
    return f;
  }
  _queueString() { const n = 1 + Math.floor(Math.random() * 3); this._string = n; }
  _approach(f, dist, opp) {
    const want = this.p.aggro > 0.6 ? 1.6 : 2.6;
    if (dist > want + 0.4) { f.move = { x: this.strafe * 0.25, z: -1 }; if (dist > 5 && this.me.res.stamina > 50 && Math.random() < 0.02) { f.dash = true; f.dashP = true; } }
    else if (dist < want - 0.6) f.move = { x: this.strafe * 0.7, z: 0.6 };
    else f.move = { x: this.strafe * 0.9, z: 0 };
  }
}
