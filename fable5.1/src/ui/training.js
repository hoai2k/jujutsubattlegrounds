// TRAINING — frame data on screen, a dummy you can set to stand / block /
// fight back, position reset, infinite time and meter. Bound to the match
// when opts.training is set; the HUD stays.
import { h } from './nav.js';
import { emptyFrame } from '../combat/input.js';
import { spawnPoint } from '../combat/legacy/match.js';
const DUMMY = ['STAND', 'BLOCK', 'CPU'];
export class Training {
  constructor(root, match, input, sfx) {
    this.match = match; this.input = input; this.sfx = sfx; this.mode = 0;
    this.el = h('div', 'training', `<div class="tr-box"><div class="kicker">TRAINING</div><div class="tr-dummy"></div><div class="tr-frame"></div><div class="tr-adv"></div><div class="tr-help">SELECT dummy · R3+SELECT reset · meter and health refill</div></div>`);
    root.appendChild(this.el);
    this.dummyEl = this.el.querySelector('.tr-dummy'); this.frameEl = this.el.querySelector('.tr-frame'); this.advEl = this.el.querySelector('.tr-adv');
    this.me = match.fighters[0]; this.dummy = match.fighters[1];
    // lite core keeps CPUs in a map; the full runtime has one `cpu` for seat 1
    this.legacy = !match.cpus;
    if (this.legacy) { this.cpu = match.cpu; match.cpu = null; this.blockFrame = emptyFrame(); this.blockFrame.block = true; }
    else { this.cpu = match.cpus.get(1); match.cpus.delete(1); }
    this.lastMove = null; this.advText = ''; this.blockHit = { at: 0 }; this.hitAt = 0;
    match.on?.('hit', d => { if (d.attacker === this.me) { this.hitTick = match.tick; this.hitResult = d.result; } });
    this.render();
  }
  render() { this.dummyEl.textContent = 'DUMMY: ' + DUMMY[this.mode]; }
  update(dt, frame) {
    const m = this.match, me = this.me, d = this.dummy;
    if (frame?.selectP) { if (frame.lock) this.reset(); else { this.mode = (this.mode + 1) % DUMMY.length; this.render(); this.sfx.tick(); } }
    // dummy input
    if (this.legacy) { m.cpu = this.mode === 2 ? this.cpu : null; m.dummyInput = this.mode === 1 ? () => this.blockFrame : null; }
    else if (this.mode === 2) { if (!m.cpus.has(1)) m.cpus.set(1, this.cpu); } else m.cpus.delete(1);
    if (!this.legacy && this.mode === 1 && d.state !== 'guardBreak') { const f = m.inputs.get(d) || {}; d._forceBlock = true; if (['idle', 'walk', 'run'].includes(d.state)) d.setState('block', { clip: 'block' }); }
    if (!this.legacy && this.mode === 1 && d.state === 'block') d.f = 20;
    // refills
    for (const f of m.fighters) { if (f.comboTimer > 2 && f.state !== 'hitLight' && f.state !== 'hitHeavy' && !['launched', 'knockdown', 'getup'].includes(f.state)) { f.res.hp = Math.max(f.res.hp, f.maxHP * 0.999) ; } if (f.comboTimer > 2) { f.res.curCE = Math.max(f.res.curCE, f.res.maxCE); f.res.stamina = f.cfg.stats.stamina ?? f.res.stamina; if (f.res.maxCE < 100) f.res.maxCE = Math.min(100, f.res.maxCE + dt * 8); } }
    d.res.hp = Math.max(d.res.hp, 1);
    // frame data of the current / last move
    const mv = me.move;
    if (mv) { this.lastMove = mv; this.lastF = me.f; }
    const L = this.lastMove;
    if (L) {
      const total = L.startup + L.active + L.recovery;
      const phase = me.move ? (me.f < L.startup ? 'STARTUP' : me.f < L.startup + L.active ? 'ACTIVE' : 'RECOVERY') : 'DONE';
      this.frameEl.innerHTML = `<b>${L.name || (L.kind === 'heavy' ? 'HEAVY' : 'PUNCH ' + ((L.index ?? 0) + 1))}</b><span class="ph ${phase.toLowerCase()}">${phase}</span><span>${L.startup}f / ${L.active}f / ${L.recovery}f · ${total}f</span><span>DMG ${L.dmg ?? '-'} · STUN ${L.hitstun ?? '-'} · ${L.type || L.kind}</span>`;
      const onHit = (L.hitstun ?? 0) - (L.active + L.recovery), onBlock = 12 - (L.active + L.recovery);
      this.advEl.innerHTML = `ON HIT <i class="${onHit >= 0 ? 'plus' : 'minus'}">${onHit >= 0 ? '+' : ''}${onHit}</i> · ON BLOCK <i class="${onBlock >= 0 ? 'plus' : 'minus'}">${onBlock >= 0 ? '+' : ''}${onBlock}</i>${this.hitResult ? ` · LAST: ${this.hitResult.toUpperCase()}` : ''}`;
    }
  }
  reset() { const m = this.match; m.fighters.forEach((f, i) => { const sp = m.arena?.spawnPoint ? m.arena.spawnPoint(i, 2) : spawnPoint(i, m.fighters.length, m.arena); f.pos.copy(sp); f.vel.set(0, 0, 0); f.facing = i === 0 ? Math.PI / 2 : -Math.PI / 2; f.setState('idle', { clip: 'idle' }); f.res.hp = f.maxHP; f.juggle = 0; }); m.effects.clear?.(); this.sfx.uiSwoosh(); }
  destroy() { this.el.remove(); }
}
