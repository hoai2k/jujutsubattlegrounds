// RESULTS — winner, round dots, hit stats, then REMATCH (fast: skips the
// menus), CHARACTER SELECT, STAGE, TITLE.
import { Nav, h, hex } from '../nav.js';
import { pickInfo } from '../../roster/index.js';
export class ResultScreen {
  constructor(S) { this.S = S; this.el = h('div', 'screen result', `<div class="res-win"><span class="jp"></span><span class="name"></span><span class="wins">WINS</span></div><div class="res-stats"></div><div class="res-list"></div><div class="res-note"></div><div class="hint"><b>A</b> confirm <b>D-pad ←</b> taunt</div>`); S.ui.appendChild(this.el); this.el.hidden = true; this.list = this.el.querySelector('.res-list'); this.nav = new Nav(S.G.sfx, { onConfirm: el => this.pick(el.dataset.k), onExtra: f => { if (f.tauntP) this.S.G.match?.winner?.tryTaunt({}); } }); }
  show(d) {
    this.el.hidden = false; const w = d.winner; const info = w.info || pickInfo(w.pick || w.cfg.id) || { accent: 0xffffff, jp: '', name: w.cfg?.name || '' };
    this.el.style.setProperty('--accent', hex(info.accent));
    this.el.querySelector('.jp').textContent = info.jp; this.el.querySelector('.name').textContent = info.name;
    this.el.querySelector('.res-stats').innerHTML = d.stats.map((s, i) => `<div class="rs"><b>${s.name}</b><span>${'●'.repeat(d.wins[i])}</span><span>${s.hits} HITS LANDED</span><span>${s.taken} TAKEN</span></div>`).join('');
    const items = [['rematch', 'REMATCH'], ['select', 'CHARACTER SELECT'], ['map', 'STAGE SELECT'], ['title', 'TITLE']];
    this.list.innerHTML = ''; this.nav.set(items.map(([k, n]) => { const e = h('div', 'res-item', n); e.dataset.k = k; this.list.appendChild(e); return e; }));
    this.setLocked(!!d.online);
    this.S.G.music.play('menu');
    setTimeout(() => this.S.G.match?.cam?.cinematic(w.pos, 6, 3.2, 1.5, { startAngle: w.facing - 0.6, sweep: 1.2, closeIn: 0.1, lookY: 1.0, fov: 36, hold: 20 }), 50);
  }
  hide() { this.el.hidden = true; }
  // Online the result is host-authoritative: guests wait for the host's
  // choice, which arrives through decided(). A guest whose session has died
  // gets the buttons back, because there is nobody left to wait for.
  setLocked(on) { this.locked = !!on; this.el.classList.toggle('locked', this.locked); this.el.querySelector('.res-note').textContent = this.locked ? 'WAITING FOR THE HOST' : ''; }
  decided(choice) { if (this.el.hidden) return; if (choice === 'rematch') this._go('rematch'); else this.S.go('select', { mode: 'online', seats: 1 }); }
  pick(k) {
    const S = this.S, o = S.G.online;
    if (this.locked) return;
    if (S.G.match?.net) { if (o.active) { o.chooseResult(k === 'rematch' ? 'rematch' : 'select'); return; } o.net?.dispose?.(); }
    this._go(k);
  }
  _go(k) {
    // a dead online session falls back to a local flow with the same picks
    const S = this.S; const o = S.G.opts.mode === 'online' ? { ...S.G.opts, mode: 'local', net: null } : S.G.opts;
    if (k === 'rematch') { this.hide(); S.current = 'match'; S.active = null; S.G.match.rematch(); S.G.music.play('fight'); }
    else if (k === 'select') S.go('select', { mode: o.mode, seats: o.picks.length, training: o.training });
    else if (k === 'map') S.go('map', { mode: o.mode, picks: o.picks, training: o.training });
    else S.go('title');
  }
  update(dt, f) { const o = this.S.G.online; if (this.locked && (!o.active || o.isHost)) this.setLocked(false); this.nav.update(dt, f); }
}
