// CHARACTER SELECT — the roster grid with per-seat cursors, a live 3D
// preview of the focused pick (turntable, idle clip, taunt on Y), variants
// on the same tile (cycle with RB/RT), random pick, and the last picks
// remembered. Each seat locks in with A; B backs out of a lock, then out of
// the screen.
import { Nav, h, hex } from '../nav.js';
import { ROSTER, ROSTER_IDS, variantsOf, joinPick, splitPick, pickInfo, allPicks } from '../../roster/index.js';
import { PreviewStage } from '../../bench/scene.js';

const COLS = 8;
export class SelectScreen {
  constructor(S) {
    this.S = S; this.el = h('div', 'screen select', `
      <div class="screen-head"><span class="kicker">CHARACTER SELECT</span><h1 class="sel-title">CHOOSE YOUR FIGHTER</h1></div>
      <div class="sel-body"><div class="sel-grid"></div><div class="sel-hero"><div class="hero-jp"></div><div class="hero-name"></div><div class="hero-role"></div><div class="hero-variant"></div><div class="hero-stats"></div></div></div>
      <div class="sel-seats"></div>
      <div class="hint"><b>A</b> lock <b>B</b> back <b>Y</b> taunt <b>RB/RT</b> variant <b>SELECT</b> random</div>`);
    S.ui.appendChild(this.el); this.el.hidden = true;
    this.grid = this.el.querySelector('.sel-grid'); this.hero = this.el.querySelector('.sel-hero'); this.seatsEl = this.el.querySelector('.sel-seats');
    this.seats = []; this.preview = null;
  }
  get online() { return this.data?.mode === 'online' ? this.S.G.online : null; }
  get localSeats() { return this.seats.length; }
  _refresh() { this._renderSeats(); }
  show(data) {
    this.el.hidden = false; this.data = data; const S = this.S;
    this.grid.innerHTML = '';
    this.tiles = ROSTER_IDS.map(id => { const r = ROSTER[id]; const t = h('div', 'tile' + (r.spirit ? ' spirit' : ''), `<span class="jp">${r.jp}</span><span class="en">${r.config.name}</span><span class="cur"></span>`); t.style.setProperty('--accent', hex(r.accent)); t.dataset.id = id; this.grid.appendChild(t); return t; });
    const n = data.seats || 2;
    const last = S.session.lastPicks || [];
    this.seats = [];
    for (let i = 0; i < n; i++) {
      const isCpu = (data.mode === 'cpu' && i >= 1) || (data.mode === 'ffa' && i >= Math.max(1, S.G.input.livePads));
      const seat = { i, locked: false, cpu: isCpu, variant: 0, nav: null, pick: null };
      seat.nav = new Nav(S.G.sfx, { cols: COLS, onConfirm: () => this.lock(seat), onBack: () => this.back(seat), onMove: (el) => this.focusTile(seat, el), onExtra: f => this.extra(seat, f) });
      seat.nav.focusClass = 'f' + i;   // per-seat cursors, not the shared focus ring
      seat.nav.set(this.tiles, COLS, true);
      const li = last[i] ? ROSTER_IDS.indexOf(splitPick(last[i]).charId) : -1;
      seat.nav.focus(li >= 0 ? li : (i * 5) % ROSTER_IDS.length);
      if (last[i]) seat.variant = Math.max(0, variantsOf(ROSTER[splitPick(last[i]).charId], splitPick(last[i]).charId).findIndex(v => v.id === splitPick(last[i]).variantId));
      this.seats.push(seat);
      if (isCpu) { seat.locked = true; seat.pick = this._randomPick(); }
    }
    this._renderSeats(); this.focusTile(this.seats[0], this.seats[0].nav.current);
    if (this.online) { this.online.attachSelect(this); this.online.setPicks(null); }
    this.preview = new PreviewStage(S.G.stage);
    this._showPreview(this.seats[0]);
  }
  hide() { this.el.hidden = true; this.preview?.dispose(); this.preview = null; if (this.online) this.online.detachSelect(); }
  _randomPick() { const p = allPicks(); return p[(Math.random() * p.length) | 0]; }
  _pickOf(seat) { const id = seat.nav.current.dataset.id; const vs = variantsOf(ROSTER[id], id); const v = vs[seat.variant % vs.length]; return joinPick(id, v.id); }
  focusTile(seat, el) {
    for (const t of this.tiles) t.classList.remove('f' + seat.i);
    if (!seat.cpu) el.classList.add('f' + seat.i);
    if (seat === this.seats.find(s => !s.locked && !s.cpu) || seat.i === 0) { this._hero(seat); this._showPreview(seat); }
  }
  _hero(seat) {
    const info = pickInfo(this._pickOf(seat)); if (!info) return;
    this.hero.style.setProperty('--accent', hex(info.accent));
    this.hero.querySelector('.hero-jp').textContent = info.jp; this.hero.querySelector('.hero-name').textContent = info.name;
    this.hero.querySelector('.hero-role').textContent = info.role;
    const vs = variantsOf(ROSTER[info.charId], info.charId);
    this.hero.querySelector('.hero-variant').innerHTML = vs.length > 1 ? vs.map((v, i) => `<span class="${i === seat.variant % vs.length ? 'on' : ''}">${v.name.replace(info.config.name, '').trim() || 'BASE'}</span>`).join('') : '';
    const s = info.config.stats;
    const bar = (l, v, m) => `<div class="stat"><span>${l}</span><i style="--v:${Math.min(1, v / m)}"></i></div>`;
    this.hero.querySelector('.hero-stats').innerHTML = bar('HEALTH', s.hp, 130) + bar('SPEED', s.runSpeed, 6.2) + bar('POWER', (s.damageScale ?? 1) * 100, 125) + bar('ENERGY', s.startMaxCE + s.ceRegen * 10, 90);
  }
  _showPreview(seat) { const pick = this._pickOf(seat); if (this.preview && this.preview.pick !== pick) this.preview.show(pick); }
  lock(seat) {
    if (seat.locked) return;
    seat.locked = true; seat.pick = this._pickOf(seat); this.S.G.sfx.uiLock();
    this.preview?.play('victory');
    this._renderSeats();
    if (this.seats.every(s => s.locked)) { if (this.online) this.online.setPicks(this.seats.map(s => s.pick)); else setTimeout(() => this._done(), 500); }
  }
  back(seat) {
    if (seat.locked && !seat.cpu) { seat.locked = false; this._renderSeats(); if (this.online) this.online.setPicks(null); return; }
    if (seat.i !== 0) return;
    if (this.online) { this.online.leave('YOU LEFT THE GAME'); if (!this.online.active) this.S.go('lobby'); } else this.S.go('mode');
  }
  extra(seat, f) {
    if (seat.locked) return;
    const id = seat.nav.current.dataset.id; const vs = variantsOf(ROSTER[id], id);
    if (f.ct1P) { seat.variant = (seat.variant + vs.length - 1) % vs.length; this._hero(seat); this._showPreview(seat); this.S.G.sfx.uiMove(); }
    if (f.ct2P) { seat.variant = (seat.variant + 1) % vs.length; this._hero(seat); this._showPreview(seat); this.S.G.sfx.uiMove(); }
    if (f.heavyP) this.preview?.play('taunt');
    if (f.selectP) { const p = this._randomPick(); const { charId } = splitPick(p); seat.nav.focus(ROSTER_IDS.indexOf(charId)); seat.variant = 0; this.S.G.sfx.uiSwoosh(); }
  }
  _renderSeats() {
    this.seatsEl.innerHTML = this.seats.map(s => { const info = s.locked ? pickInfo(s.pick) : pickInfo(this._pickOf(s)); return `<div class="seat seat-${s.i} ${s.locked ? 'locked' : ''}" style="--accent:${hex(info.accent)}"><span class="who">${s.cpu ? 'CPU' : 'P' + (s.i + 1)}</span><span class="name">${info.name}</span><span class="state">${s.locked ? (this.online ? (this.online.canStart ? 'PRESS A TO START' : 'READY — WAITING FOR THE LOBBY') : 'READY') : 'CHOOSING'}</span></div>`; }).join('');
  }
  _done() {
    const S = this.S; const picks = this.seats.map(s => s.pick);
    S.session.lastPicks = picks; S.save();
    S.go('map', { ...this.data, picks });
  }
  update(dt, f) {
    const frames = this.S.G.input.frames;
    this.preview?.update(dt);
    // a solo player (VS CPU / training, no pads) drives seat 0 with either keyboard cluster
    const solo = (this.data.mode === 'cpu' || this.data.mode === 'online') && this.S.G.input.livePads === 0;
    if (this.online) {
      const sig = `${!!this.online.active}|${!!this.online.canStart}|${!!this.online.session?.everyoneReady}`;
      if (sig !== this._onlineSig) { this._onlineSig = sig; this._renderSeats(); }
      if (this.seats.every(s => s.locked) && this.online.canStart && (f?.confirmP || frames[0]?.confirmP)) this.online.startMatch();
    }
    this.seats.forEach((s, i) => { if (s.cpu) return; const fr = (solo && i === 0) ? this.S.G.input.menuFrame() : frames[i]; if (!fr) return; s.nav.update(dt, fr); });
  }
}
