// MODE SELECT — local VS, VS CPU, free-for-all, training, online, settings.
import { Nav, h } from '../nav.js';
const MODES = [
  { id: 'local', name: 'LOCAL VS', jp: '対戦', desc: 'Two players, split screen. Pad 1 vs pad 2, or the two keyboard clusters.' },
  { id: 'cpu', name: 'VS CPU', jp: '対CPU', desc: 'One player against the machine. Difficulty on the next screen.' },
  { id: 'ffa', name: 'FREE-FOR-ALL', jp: '乱戦', desc: 'Three or four fighters, last one standing. Stocks. Pads for seats 3 and 4.' },
  { id: 'training', name: 'TRAINING', jp: '修行', desc: 'No timer, frame data on screen, a dummy that stands, blocks, or fights back.' },
  { id: 'online', name: 'ONLINE', jp: 'オンライン', desc: 'Host or join a lobby.' },
  { id: 'settings', name: 'SETTINGS', jp: '設定', desc: 'Controls, audio, video, accessibility.' }
];
export class ModeScreen {
  constructor(S) {
    this.S = S; this.el = h('div', 'screen mode', `<div class="screen-head"><span class="kicker">MODE</span><h1>CHOOSE A FIGHT</h1></div><div class="mode-list"></div><div class="mode-desc"></div><div class="hint"><b>A</b> confirm <b>B</b> back</div>`);
    S.ui.appendChild(this.el); this.el.hidden = true;
    this.list = this.el.querySelector('.mode-list'); this.desc = this.el.querySelector('.mode-desc');
    this.nav = new Nav(S.G.sfx, { cols: 1, onConfirm: (el, i) => this.pick(MODES[i]), onBack: () => S.go('title'), onMove: (el, i) => { this.desc.textContent = MODES[i].desc; } });
  }
  show() { this.el.hidden = false; this.list.innerHTML = ''; const items = MODES.map(m => { const e = h('div', 'mode-item', `<span class="jp">${m.jp}</span><span class="en">${m.name}</span>`); this.list.appendChild(e); return e; }); this.nav.set(items, 1); const i = MODES.findIndex(m => m.id === this.S.session.mode); if (i >= 0) this.nav.focus(i); }
  hide() { this.el.hidden = true; }
  pick(m) {
    const S = this.S;
    if (m.id === 'settings') return S.go('settings', { back: 'mode' });
    if (m.id === 'online') return S.go('lobby');
    S.session.mode = m.id === 'training' ? 'cpu' : m.id; S.session.training = m.id === 'training'; S.save();
    S.go('select', { mode: S.session.mode, seats: m.id === 'ffa' ? Math.max(3, Math.min(4, S.G.input.livePads)) : 2, training: m.id === 'training' });
  }
  update(dt, f) { this.nav.update(dt, f); }
}
