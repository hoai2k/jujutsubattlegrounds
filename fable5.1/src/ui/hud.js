// HUD — health / cursed energy / stamina plates, round timer, combo counter,
// cut-ins, notices, state words, damage numbers, taunt bubbles. Readable in a
// half-second glance: health is the biggest thing on screen, the meter is the
// frame + fill pair, everything else is smaller and lower.
import { clamp } from '../core/math.js';

const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0');

export class HUD {
  constructor(root) {
    this.root = root; this.el = document.createElement('div'); this.el.className = 'hud'; root.appendChild(this.el);
    this.match = null; this.plates = []; this.timerEl = null; this.words = []; this.floaters = [];
  }
  bind(match) {
    this.match = match; this.el.innerHTML = ''; this.plates = [];
    const n = match.fighters.length;
    this.el.classList.toggle('hud-ffa', n > 2);
    match.fighters.forEach((f, i) => {
      const side = n <= 2 ? (i === 0 ? 'left' : 'right') : ['left', 'right', 'left', 'right'][i];
      const row = n <= 2 ? 'top' : (i < 2 ? 'top' : 'bottom');
      const p = document.createElement('div');
      p.className = `plate plate-${side} plate-${row}`;
      p.style.setProperty('--accent', hex(f.model.palette.accent));
      p.innerHTML = `
        <div class="plate-name"><span class="plate-jp">${f.info?.jp || ''}</span><span class="plate-en">${f.cfg.name}</span><span class="plate-seat">${match.cpus.has(i) ? 'CPU' : 'P' + (i + 1)}</span></div>
        <div class="bar hp"><div class="ghost"></div><div class="fill"></div><div class="flash"></div></div>
        <div class="bar ce"><div class="max"></div><div class="fill"></div><div class="tick"></div></div>
        <div class="bar st"><div class="fill"></div></div>
        <div class="slots"><div class="slot s1"><i></i><b>RB</b></div><div class="slot s2"><i></i><b>RT</b></div><div class="slot sp"><i></i><b>B</b></div><div class="slot ult"><i></i><b>▶</b></div></div>
        <div class="stocks"></div>
        <div class="buffs"></div>
        <div class="notice"></div>
        <div class="stateword"></div>
        <div class="combo"><span class="n">0</span><span class="l">HITS</span><span class="d"></span></div>
        <div class="bubble"></div>`;
      this.el.appendChild(p);
      this.plates.push({ el: p, f, hp: p.querySelector('.hp .fill'), ghost: p.querySelector('.hp .ghost'), flash: p.querySelector('.hp .flash'), ceMax: p.querySelector('.ce .max'), ce: p.querySelector('.ce .fill'), st: p.querySelector('.st .fill'), slots: [...p.querySelectorAll('.slot')], notice: p.querySelector('.notice'), stateword: p.querySelector('.stateword'), combo: p.querySelector('.combo'), comboN: p.querySelector('.combo .n'), comboD: p.querySelector('.combo .d'), bubble: p.querySelector('.bubble'), buffs: p.querySelector('.buffs'), stocks: p.querySelector('.stocks'), ghostV: 1, lastHp: f.res.hp, noticeT: 0, wordT: 0, bubbleT: 0, comboShown: 0, comboT: 0 });
    });
    this.timerEl = document.createElement('div'); this.timerEl.className = 'timer'; this.timerEl.innerHTML = '<span class="t">99</span><div class="rounds"></div>'; this.el.appendChild(this.timerEl);
    this.ann = document.createElement('div'); this.ann.className = 'announce'; this.ann.innerHTML = '<div class="big"></div><div class="small"></div>'; this.el.appendChild(this.ann);
    this.floatLayer = document.createElement('div'); this.floatLayer.className = 'floaters'; this.el.appendChild(this.floatLayer);
    this.annT = 0;
  }
  unbind() { this.el.innerHTML = ''; this.match = null; }
  announce(big, small) {
    if (big) { this.ann.querySelector('.big').textContent = big; this.ann.classList.remove('show'); void this.ann.offsetWidth; this.ann.classList.add('show'); this.annT = big.length > 8 ? 1.6 : 1.1; }
    if (small !== undefined) { const s = this.ann.querySelector('.small'); s.textContent = small || ''; s.classList.remove('show'); void s.offsetWidth; if (small) { s.classList.add('show'); this.annSmallT = 1.4; } }
  }
  notice(f, text) { const p = this.plates[f.index]; if (!p) return; p.notice.textContent = text; p.notice.classList.add('show'); p.noticeT = 1.0; }
  stateWord(f, word) { const p = this.plates[f.index]; if (!p) return; p.stateword.textContent = word; p.stateword.classList.remove('show'); void p.stateword.offsetWidth; p.stateword.classList.add('show'); p.wordT = 0.45; }
  cutIn(f, name, jp, big = false) { const p = this.plates[f.index]; if (!p) return; p.notice.innerHTML = `<span class="cut${big ? ' big' : ''}">${jp ? `<em>${jp}</em>` : ''}${name}</span>`; p.notice.classList.add('show'); p.noticeT = big ? 1.6 : 0.9; }
  bubble(f, text) { const p = this.plates[f.index]; if (!p) return; p.bubble.textContent = text; p.bubble.classList.add('show'); p.bubbleT = 1.8; }
  buff(f, name, seconds) { const p = this.plates[f.index]; if (!p) return; const b = document.createElement('span'); b.className = 'buff'; b.textContent = name.toUpperCase(); b.style.setProperty('--dur', seconds + 's'); p.buffs.appendChild(b); setTimeout(() => b.remove(), seconds * 1000); }
  flashSlot(f) { const p = this.plates[f.index]; if (!p) return; p.slots[2].classList.add('bf'); setTimeout(() => p.slots[2].classList.remove('bf'), 200); }
  damage(f, dmg, weight, crit) {
    if (!this.match || dmg <= 0) return;
    const scr = this.match.stage.project(f.chest, 0);
    const d = document.createElement('div'); d.className = 'dmg ' + weight + (crit ? ' crit' : '');
    d.textContent = Math.round(dmg); d.style.left = (scr.x * 100 + (Math.random() - 0.5) * 4) + '%'; d.style.top = ((1 - scr.y) * 100 - 6) + '%';
    this.floatLayer.appendChild(d); setTimeout(() => d.remove(), 900);
  }
  onEvent(type, data) {
    if (type === 'roundStart' || type === 'ko' || type === 'result') this._rounds();
  }
  _rounds() {
    const m = this.match; const r = this.timerEl.querySelector('.rounds');
    r.innerHTML = m.fighters.map((f, i) => `<span class="rw rw-${i}">${'●'.repeat(m.wins[i])}${'○'.repeat(Math.max(0, m.roundsToWin - m.wins[i]))}</span>`).join('');
  }
  update(dt) {
    const m = this.match; if (!m) return;
    this.timerEl.querySelector('.t').textContent = m.training ? '∞' : String(Math.ceil(m.timer)).padStart(2, '0');
    this.timerEl.classList.toggle('low', m.timer < 10 && !m.training);
    if (this.annT > 0) { this.annT -= dt; if (this.annT <= 0) this.ann.classList.remove('show'); }
    if (this.annSmallT > 0) { this.annSmallT -= dt; if (this.annSmallT <= 0) this.ann.querySelector('.small').classList.remove('show'); }
    for (const p of this.plates) {
      const f = p.f;
      const hp = clamp(f.res.hp / f.maxHP, 0, 1);
      p.hp.style.transform = `scaleX(${hp})`;
      if (f.res.hp < p.lastHp - 0.01) { p.flash.style.opacity = 1; p.flashT = 0.08; }
      p.lastHp = f.res.hp;
      if (p.flashT > 0) { p.flashT -= dt; if (p.flashT <= 0) p.flash.style.opacity = 0; }
      p.ghostV = p.ghostV > hp ? Math.max(hp, p.ghostV - dt * 0.45) : hp;
      p.ghost.style.transform = `scaleX(${p.ghostV})`;
      p.el.classList.toggle('danger', hp < 0.25);
      p.el.classList.toggle('dead', !f.alive && f.state !== 'ko');
      const maxCE = clamp(f.res.maxCE / 100, 0, 1), ce = clamp(f.res.curCE / 100, 0, 1);
      p.ceMax.style.transform = `scaleX(${maxCE})`; p.ce.style.transform = `scaleX(${ce})`;
      p.el.classList.toggle('charged', f.charged); p.el.classList.toggle('noce', f.noCE);
      p.el.classList.toggle('backlash', f.backlash > 0);
      p.st.style.transform = `scaleX(${clamp(f.res.stamina / f.cfg.stats.stamina, 0, 1)})`;
      // slots
      const cost = [f.cfg.ct1?.cost ?? 0, f.cfg.ct2?.cost ?? 0];
      p.slots[0].classList.toggle('off', f.res.curCE < cost[0]); p.slots[1].classList.toggle('off', f.res.curCE < cost[1]);
      const cd = f.specialCD > 0 ? f.specialCD / f.specialCDMax : 0;
      p.slots[2].style.setProperty('--cd', cd); p.slots[2].classList.toggle('off', f.specialCD > 0);
      p.slots[3].classList.toggle('ready', f.ultReady); p.slots[3].classList.toggle('off', !f.ultReady);
      if (p.noticeT > 0) { p.noticeT -= dt; if (p.noticeT <= 0) p.notice.classList.remove('show'); }
      if (p.wordT > 0) { p.wordT -= dt; if (p.wordT <= 0) p.stateword.classList.remove('show'); }
      if (p.bubbleT > 0) { p.bubbleT -= dt; if (p.bubbleT <= 0) p.bubble.classList.remove('show'); }
      // combo counter: shown for hits LANDED, punches when it grows
      if (f.comboHits >= 2 && f.comboTimer < 1.4) {
        if (f.comboHits !== p.comboShown) { p.comboShown = f.comboHits; p.comboN.textContent = f.comboHits; p.comboD.textContent = Math.round(f.comboDmg) + ' DMG'; p.combo.classList.remove('punch'); void p.combo.offsetWidth; p.combo.classList.add('punch'); }
        p.combo.classList.add('show');
      } else if (f.comboTimer >= 1.4 || f.comboHits < 2) { p.combo.classList.remove('show'); p.comboShown = 0; }
      if (m.mode === 'ffa') p.stocks.textContent = '◆'.repeat(Math.max(0, f.stocks));
    }
  }
}
