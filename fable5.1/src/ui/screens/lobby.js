// ONLINE LOBBY — host / join / a room list, with the connection status
// line. The transport is not ported in this version (see the summary);
// the screen is complete so the flow can be wired to a backend without UI
// work.
import { Nav, h } from '../nav.js';
export class LobbyScreen {
  constructor(S) { this.S = S; this.el = h('div', 'screen lobby', `<div class="screen-head"><span class="kicker">ONLINE</span><h1>LOBBY</h1></div><div class="lobby-status">NO BACKEND CONFIGURED — online play is not available in this build.</div><div class="lobby-cols"><div class="lobby-list"><div class="kicker">ROOMS</div><div class="rooms"><div class="room empty">No rooms. Host one, or come back when a backend is configured.</div></div></div><div class="lobby-actions"></div></div><div class="hint"><b>B</b> back</div>`); S.ui.appendChild(this.el); this.el.hidden = true; this.actions = this.el.querySelector('.lobby-actions'); this.nav = new Nav(S.G.sfx, { onConfirm: el => this.pick(el.dataset.k), onBack: () => S.go('mode') }); }
  show() { this.el.hidden = false; const items = [['host', 'HOST A ROOM'], ['join', 'JOIN BY CODE'], ['refresh', 'REFRESH'], ['back', 'BACK']]; this.actions.innerHTML = ''; this.nav.set(items.map(([k, n]) => { const e = h('div', 'lobby-item', n); e.dataset.k = k; this.actions.appendChild(e); return e; })); }
  hide() { this.el.hidden = true; }
  pick(k) { if (k === 'back') return this.S.go('mode'); this.S.toast('ONLINE: NOT AVAILABLE IN THIS BUILD'); this.S.G.sfx.denied(); }
  update(dt, f) { this.nav.update(dt, f); }
}
