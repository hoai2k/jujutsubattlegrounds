// Online UI: the select-screen panel, the lobby overlay, and the in-match
// connection banner.
//
// Everything here is presentation. It reads a NetSession and calls back; it
// never talks to the network itself, and it renders a sensible thing for every
// session phase including the failure ones — there is no state in which the
// player is looking at a spinner with no explanation and no way out.
import { pickInfo } from '../../roster/index.js';

// The variant-resolved display name, so GOJO 【SHINJUKU】 reads as itself in
// the lobby rather than as plain GOJO.
const nameOf = pick => (pick && pickInfo(pick)?.name) || '';

// ---------------------------------------------------------------------------
// THE PANEL — lives on the character-select screen
// ---------------------------------------------------------------------------
// THE PANEL ONLY EVER OFFERS WHAT IS ACTUALLY THERE. With nobody hosting it is
// a HOST button and nothing else — no "NO GAMES OPEN" line, because an absence
// does not need announcing and a dead JOIN button is worse than no button. The
// moment a game appears the dot lights and JOIN animates in above it.
//
// The one thing worth stating in words is the failure: when online is
// unavailable the panel says why and gets out of the way.
export class OnlinePanel {
  constructor(root, { onHost, onJoin }) {
    this.onHost = onHost;
    this.onJoin = onJoin;
    this.el = document.createElement('div');
    this.el.className = 'online-panel';
    this.el.innerHTML = `
      <div class="op-head"><span class="op-dot"></span><b>ONLINE</b></div>
      <div class="op-body"></div>
      <div class="op-actions">
        <button class="op-btn primary op-join" data-a="join">JOIN ONLINE GAME</button>
        <button class="op-btn" data-a="host">HOST ONLINE GAME</button>
      </div>
      <div class="op-hint">O &nbsp;·&nbsp; ONLINE</div>`;
    root.appendChild(this.el);
    this.body = this.el.querySelector('.op-body');
    this.joinBtn = this.el.querySelector('[data-a="join"]');
    this.hostBtn = this.el.querySelector('[data-a="host"]');
    this.joinBtn.onclick = () => !this.joinBtn.disabled && this.onJoin?.();
    this.hostBtn.onclick = () => !this.hostBtn.disabled && this.onHost?.();
    this.state = { availability: 'unknown', games: [], error: null };
    this.render();
  }

  set({ availability, games, error }) {
    if (availability !== undefined) this.state.availability = availability;
    if (games !== undefined) this.state.games = games;
    if (error !== undefined) this.state.error = error;
    this.render();
  }

  get openGames() { return this.state.games || []; }
  get canJoin() { return this.state.availability === 'ok' && this.openGames.length > 0; }
  get canHost() { return this.state.availability === 'ok'; }

  render() {
    const { availability, error } = this.state;
    const n = this.openGames.length;
    this.el.classList.toggle('down', availability === 'error');
    this.el.classList.toggle('live', n > 0);
    this.el.classList.toggle('busy', availability === 'unknown');

    if (availability === 'error') {
      this.body.innerHTML = `<div class="op-msg">UNAVAILABLE<i>${error || 'could not reach the server'}</i></div>`;
    } else if (availability === 'unknown') {
      this.body.innerHTML = `<div class="op-msg">CONNECTING<i>looking for games…</i></div>`;
    } else if (n > 0) {
      const g = this.openGames[0];
      this.body.innerHTML = `
        <div class="op-live">
          <b>${n === 1 ? '1 GAME OPEN' : n + ' GAMES OPEN'}</b>
          <i>${(g.hostName || 'HOST')} · ${(g.seats | 0)}/${g.maxSeats || 4} · ${g.code || ''}</i>
        </div>`;
    } else {
      // Nothing to say. The header dot is unlit, HOST is the only action, and
      // the panel takes up as little room as it can.
      this.body.innerHTML = '';
    }
    // JOIN is present only when there is something to join. `.in` drives the
    // slide-and-fade, and it is set on the frame the button appears rather
    // than always-on, so it animates rather than blinking into place.
    const showJoin = this.canJoin;
    this.joinBtn.classList.toggle('on', showJoin);
    if (showJoin && !this._joinWasOn) {
      this.joinBtn.classList.remove('in');
      void this.joinBtn.offsetWidth;     // restart the animation
      this.joinBtn.classList.add('in');
    }
    this._joinWasOn = showJoin;
    this.joinBtn.disabled = !showJoin;
    this.hostBtn.disabled = !this.canHost;
    this.hostBtn.classList.toggle('primary', n === 0);
    this.el.querySelector('.op-hint').textContent =
      availability === 'error' ? 'LOCAL PLAY IS UNAFFECTED'
        : n > 0 ? 'O · JOIN THE OPEN GAME' : 'O · HOST A GAME';
  }

  hide(on = true) { this.el.classList.toggle('gone', on); }
  destroy() { this.el.remove(); }
}

// ---------------------------------------------------------------------------
// THE LOBBY — an overlay panel on top of the still-live select screen
// ---------------------------------------------------------------------------
// Deliberately NOT modal. You keep picking your fighter on the roster
// underneath with the controls you always use; locking in marks you READY here
// instead of starting a local match. There is no second character select to
// keep in sync with the first.
export class LobbyOverlay {
  constructor(root) {
    this.onLeave = () => { };
    this.onStart = () => { };
    this.onStage = () => { };
    this.el = document.createElement('div');
    this.el.className = 'lobby-overlay';
    this.el.innerHTML = `
      <div class="lb-head">
        <div class="lb-title">ONLINE LOBBY</div>
        <div class="lb-code"><span>CODE</span><b></b></div>
      </div>
      <div class="lb-status"></div>
      <div class="lb-players"></div>
      <div class="lb-stage">
        <span>STAGE</span>
        <button class="lb-sarrow" data-d="-1">◀</button>
        <b class="lb-sname">RANDOM</b>
        <button class="lb-sarrow" data-d="1">▶</button>
      </div>
      <div class="lb-foot">
        <button class="op-btn primary lb-start">START MATCH</button>
        <button class="op-btn lb-leave">LEAVE</button>
      </div>
      <div class="lb-hint"></div>`;
    root.appendChild(this.el);
    this.startBtn = this.el.querySelector('.lb-start');
    this.leaveBtn = this.el.querySelector('.lb-leave');
    this.startBtn.onclick = () => !this.startBtn.disabled && this.onStart();
    this.leaveBtn.onclick = () => this.onLeave();
    this.stageRow = this.el.querySelector('.lb-stage');
    this.stageName = this.el.querySelector('.lb-sname');
    for (const b of this.el.querySelectorAll('.lb-sarrow')) {
      b.onclick = () => this.onStage(+b.dataset.d);
    }
    this.shown = false;
    this._sig = '';
  }

  // The host owns the stage; everyone else reads it.
  setStage(name, host) {
    this.stageName.textContent = name;
    this.stageRow.classList.toggle('ro', !host);
  }

  show() { this.shown = true; this.el.classList.add('on'); }
  hide() { this.shown = false; this.el.classList.remove('on'); }

  // `extra` carries the things the session cannot know: whether the local
  // player is mid-pick, and what the game flow is currently waiting for.
  update(session, extra = {}) {
    if (!session) return;
    const roster = session.roster;
    const ready = session.everyoneReady;
    const host = session.isHost;
    // Cheap change detection — this runs every frame behind a 3D scene, and
    // rewriting the roster's DOM sixty times a second is not free.
    const sig = JSON.stringify([
      session.phase, session.code, host, ready, extra.note || '', extra.canStart, extra.stage,
      roster.map(p => [p.pid, p.name, p.seats, p.ready, p.picks, p.host])
    ]);
    if (sig === this._sig) return;
    this._sig = sig;

    this.el.querySelector('.lb-code b').textContent = session.code || '—';
    if (extra.stage) this.setStage(extra.stage, !!extra.hostStage);
    const seats = session.seatCount;

    let status, cls = '';
    if (session.phase === 'connecting') { status = 'CONNECTING…'; cls = 'wait'; }
    else if (session.phase === 'closed') { status = session.closedReason || 'SESSION ENDED'; cls = 'bad'; }
    else if (extra.note) { status = extra.note; cls = extra.noteClass || 'wait'; }
    else if (session.phase === 'starting') { status = 'STARTING…'; cls = 'go'; }
    else if (roster.length < 2) { status = 'WAITING FOR ANOTHER PLAYER'; cls = 'wait'; }
    else if (!ready) { status = 'CHOOSE YOUR SORCERER ON THE ROSTER'; cls = ''; }
    else if (host) { status = 'EVERYONE IS READY'; cls = 'go'; }
    else { status = 'WAITING FOR THE HOST TO START'; cls = 'wait'; }
    const st = this.el.querySelector('.lb-status');
    st.textContent = status;
    st.className = 'lb-status ' + cls;

    this.el.querySelector('.lb-players').innerHTML = roster.map(p => {
      const picks = Array.isArray(p.picks) ? p.picks : [];
      const chips = picks.length
        ? picks.map(x => `<i>${nameOf(x)}</i>`).join('')
        : `<i class="none">PICKING…</i>`;
      return `<div class="lb-p${p.ready ? ' ready' : ''}${p.pid === session.pid ? ' me' : ''}">
        <span class="lb-n">${p.name || 'PLAYER'}${p.host ? ' <em>HOST</em>' : ''}${p.pid === session.pid ? ' <em class="you">YOU</em>' : ''}</span>
        <span class="lb-c">${chips}</span>
        <span class="lb-r">${p.ready ? 'READY' : '—'}</span>
      </div>`;
    }).join('') + (seats < 4
      ? `<div class="lb-p empty"><span class="lb-n">OPEN SEAT</span><span class="lb-c"></span><span class="lb-r">${4 - seats} FREE</span></div>`
      : '');

    const canStart = host && ready && roster.length >= 2 && session.phase === 'lobby' && extra.canStart !== false;
    this.startBtn.disabled = !canStart;
    this.startBtn.style.display = host ? '' : 'none';
    this.el.querySelector('.lb-hint').textContent = host
      ? (canStart ? 'ENTER / A  ·  START      X  ·  LEAVE' : 'X  ·  LEAVE')
      : 'B  ·  CHANGE YOUR PICK      X  ·  LEAVE';
  }

  destroy() { this.el.remove(); }
}

// ---------------------------------------------------------------------------
// IN-MATCH BANNER
// ---------------------------------------------------------------------------
// One line at the top of the screen for anything the player needs to know
// about the connection while they are fighting. Never blocks input, never
// steals the frame.
export class NetBanner {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'net-banner';
    root.appendChild(this.el);
    this._text = '';
  }
  set(text, kind = 'warn') {
    if (text === this._text) return;
    this._text = text;
    this.el.textContent = text || '';
    this.el.className = 'net-banner ' + (text ? 'on ' + kind : '');
  }
  clear() { this.set('', ''); }
  destroy() { this.el.remove(); }
}

// THE ONE MESSAGE CHANNEL for anything online that happened once: a game
// appearing, a failed join, a player dropping, the session ending. Everything
// goes through here so the player learns to look in a single place, whether
// they are on the title screen, the roster or mid-fight.
//
// `kind` only colours it: 'good' for something that opened up, 'bad' for
// something that broke, 'info' for the rest.
export class OnlineToast {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'online-toast';
    root.appendChild(this.el);
    this._t = 0;
  }
  say(text, kind = 'info', secs = 3.4) {
    if (!text) return;
    this.el.textContent = text;
    this.el.className = 'online-toast on ' + kind;
    // Re-fire the entrance even when the same message repeats, so a second
    // notice never looks like the first one simply lingering.
    this.el.style.animation = 'none';
    void this.el.offsetWidth;
    this.el.style.animation = '';
    clearTimeout(this._t);
    this._t = setTimeout(() => this.el.classList.remove('on'), secs * 1000);
  }
  destroy() { clearTimeout(this._t); this.el.remove(); }
}
