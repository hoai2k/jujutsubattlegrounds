// PAUSE — resume / controls / settings / rematch / quit. Pausing pauses the
// audio (music dips, the announcer stops) and desaturates the frame.
import { Nav, h } from '../nav.js';
import { LEGEND } from './legend.js';
export class PauseMenu {
  constructor(S) {
    this.S = S; this.open = false;
    this.el = h('div', 'screen pause', `<div class="pause-box"><div class="kicker">PAUSED</div><div class="pause-list"></div></div><div class="legend" hidden>${LEGEND}</div>`);
    S.ui.appendChild(this.el); this.el.hidden = true;
    this.list = this.el.querySelector('.pause-list'); this.legend = this.el.querySelector('.legend');
    this.nav = new Nav(S.G.sfx, { onConfirm: (el) => this.pick(el.dataset.k), onBack: () => this.legend.hidden ? this.hide() : (this.legend.hidden = true) });
  }
  show() {
    const G = this.S.G; this.open = true; this.el.hidden = false; G.match.paused = true; G.stage.desaturate(0.8); G.stage.setGrade('pause'); G.music.setPaused(true); try { speechSynthesis.cancel(); } catch (e) { /* */ }
    const net = !!G.match.net;
    const items = net ? [['resume', 'RESUME'], ['controls', 'CONTROLS'], ['settings', 'SETTINGS'], ['quit', 'LEAVE THE MATCH']] : [['resume', 'RESUME'], ['controls', 'CONTROLS'], ['settings', 'SETTINGS'], ['rematch', 'REMATCH'], ['select', 'CHARACTER SELECT'], ['quit', 'QUIT TO TITLE']];
    this.list.innerHTML = ''; this.nav.set(items.map(([k, n]) => { const e = h('div', 'pause-item', n); e.dataset.k = k; this.list.appendChild(e); return e; }));
  }
  hide() { const G = this.S.G; this.open = false; this.el.hidden = true; this.legend.hidden = true; if (G.match) { G.match.paused = false; G.stage.desaturate(0); G.match.setGrade('map'); } G.music.setPaused(false); }
  pick(k) {
    const S = this.S;
    if (k === 'resume') this.hide();
    else if (k === 'controls') this.legend.hidden = !this.legend.hidden;
    else if (k === 'settings') { this.hide(); S.go('settings', { back: 'resume' }); }
    else if (k === 'rematch') { this.hide(); S.G.match.rematch(); }
    else if (k === 'select') { this.hide(); S.go('select', { mode: S.session.mode, seats: S.G.opts.picks.length, training: S.session.training }); }
    else if (k === 'quit') { this.hide(); if (S.G.match?.net) S.G.online.leave('YOU LEFT THE MATCH'); S.go('title'); }
  }
  update(dt, f) { if (f.startP || f.pauseP) { this.hide(); return; } this.nav.update(dt, f); }
}
