// SCREENS — the front end router. Phase 3 fills each screen in; the shell
// (transitions, toast, perf overlay, pause) lives here.
import { mergeMenu } from '../../combat/input.js';
import { TitleScreen } from './title.js';
import { ModeScreen } from './mode.js';
import { SelectScreen } from './select.js';
import { MapScreen } from './mapselect.js';
import { PauseMenu } from './pause.js';
import { ResultScreen } from './results.js';
import { LobbyScreen } from './lobby.js';
import { SettingsScreen } from './settings.js';
import { Perf } from './perf.js';
import { Wipe } from './wipe.js';

export class Screens {
  constructor(G) {
    this.G = G; this.ui = G.ui; this.current = null; this.active = null; this.stack = [];
    this.wipe = new Wipe(this.ui); this.perf = new Perf(this.ui, G.stage);
    this.toastEl = document.createElement('div'); this.toastEl.className = 'toast'; this.ui.appendChild(this.toastEl);
    this.screens = { title: new TitleScreen(this), mode: new ModeScreen(this), select: new SelectScreen(this), map: new MapScreen(this), result: new ResultScreen(this), lobby: new LobbyScreen(this), settings: new SettingsScreen(this) };
    this.pauseMenu = new PauseMenu(this);
    this.session = { mode: 'local', picks: [], map: null, rounds: 2, difficulty: 1, training: false, lastPicks: null };
    try { const s = JSON.parse(localStorage.getItem('f51.session') || 'null'); if (s) Object.assign(this.session, s); } catch (e) { /* */ }
  }
  save() { try { localStorage.setItem('f51.session', JSON.stringify({ mode: this.session.mode, lastPicks: this.session.lastPicks, map: this.session.map, rounds: this.session.rounds, difficulty: this.session.difficulty })); } catch (e) { /* */ } }
  async go(name, data = {}) {
    const prev = this.active;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prev || name === 'match') await this.wipe.cover(reduced ? 0.08 : 0.26, data.accent);
    if (prev) { prev.hide?.(); }
    if (name === 'match') {
      this.current = 'match'; this.active = null;
      this.G.startMatch(data);
      this.G.music.play('fight');
    } else {
      if (this.current === 'match') this.G.endMatch();
      this.current = name; this.active = this.screens[name];
      this.active.show(data);
      if (name !== 'result') this.G.music.play('menu');
    }
    await this.wipe.reveal(reduced ? 0.08 : 0.26);
  }
  result(d) { this.screens.result.show(d); this.active = this.screens.result; this.current = 'result'; }
  pause() { if (!this.G.match || this.G.match.phase === 'result' || this.pauseMenu.open) return; this.pauseMenu.show(); }
  toast(text) { this.toastEl.textContent = text; this.toastEl.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => this.toastEl.classList.remove('show'), 1200); }
  togglePerf() { this.perf.toggle(); }
  update(dt) {
    const frames = this.G.input.pollAll ? null : null;
    const menu = this.G.input.menuFrame();
    this.perf.update(dt);
    if (this.pauseMenu.open) { this.pauseMenu.update(dt, menu); return; }
    if (this.current === 'match') { if (menu.startP || menu.pauseP) this.pause(); return; }
    this.active?.update?.(dt, menu);
  }
}
