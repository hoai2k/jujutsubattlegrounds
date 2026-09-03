// ONLINE LOBBY — host a room or join the open one. The transport is the old
// game's (net/): InstantDB rooms, a lockstep tick with snapshots, CPU
// takeover of a dropped seat. Once a session is open the player goes to the
// roster with the lobby overlay on top; the host starts from there.
import { Nav, h } from '../nav.js';
export class LobbyScreen {
  constructor(S) {
    this.S = S; this.el = h('div', 'screen lobby', `<div class="screen-head"><span class="kicker">ONLINE</span><h1>LOBBY</h1></div><div class="lobby-status"></div><div class="lobby-cols"><div class="lobby-list"><div class="kicker">OPEN GAMES</div><div class="rooms"></div></div><div class="lobby-actions"></div></div><div class="hint"><b>A</b> confirm <b>B</b> back</div>`);
    S.ui.appendChild(this.el); this.el.hidden = true;
    this.actions = this.el.querySelector('.lobby-actions'); this.rooms = this.el.querySelector('.rooms'); this.status = this.el.querySelector('.lobby-status');
    this.nav = new Nav(S.G.sfx, { onConfirm: el => this.pick(el.dataset.k), onBack: () => S.go('mode') });
  }
  show() { this.el.hidden = false; this._sig = null; this.busy = false; this.render(); }
  hide() { this.el.hidden = true; }
  render() {
    const o = this.S.G.online, games = o?.games || [], avail = o?.availability ?? 'unknown';
    this.status.textContent = avail === 'error' ? 'ONLINE IS UNAVAILABLE — ' + (o.error || 'could not reach the server') : avail === 'unknown' ? 'CONNECTING…' : games.length ? (games.length + ' GAME' + (games.length > 1 ? 'S' : '') + ' OPEN') : 'NO GAMES OPEN — HOST ONE';
    this.rooms.innerHTML = games.length ? games.map(g => `<div class="room"><b>${g.hostName || 'HOST'}</b><span>${g.seats | 0}/${g.maxSeats || 4} · ${g.code || ''}</span></div>`).join('') : '<div class="room empty">Nobody is hosting right now.</div>';
    const items = [];
    if (games.length) items.push(['join', 'JOIN ' + (games[0].hostName || 'THE OPEN GAME').toUpperCase()]);
    items.push(['host', 'HOST A GAME'], ['back', 'BACK']);
    const keep = this.nav.current?.dataset.k;
    this.actions.innerHTML = ''; this.nav.set(items.map(([k, n]) => { const e = h('div', 'lobby-item' + (avail !== 'ok' && k !== 'back' ? ' dim' : ''), n); e.dataset.k = k; this.actions.appendChild(e); return e; }));
    const ki = items.findIndex(i => i[0] === keep); if (ki >= 0) this.nav.focus(ki);
  }
  async pick(k) {
    const S = this.S, o = S.G.online;
    if (k === 'back') return S.go('mode');
    if (this.busy) return;
    if (!o || o.availability !== 'ok') { S.toast('ONLINE IS UNAVAILABLE'); S.G.sfx.denied(); return; }
    this.busy = true;
    if (k === 'host') await o.host(); else await o.joinFirst();
    this.busy = false;
    if (o.active) S.go('select', { mode: 'online', seats: 1 });
    else { S.G.sfx.denied(); this.render(); }
  }
  update(dt, f) {
    const o = this.S.G.online; const sig = o ? `${o.availability}|${(o.games || []).map(g => g.id + g.seats).join(',')}` : '';
    if (sig !== this._sig) { this._sig = sig; this.render(); }
    this.nav.update(dt, f);
  }
}
