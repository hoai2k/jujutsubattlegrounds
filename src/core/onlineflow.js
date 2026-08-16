// The glue between the online session and the game's screen flow.
//
// game.js owns the screens; net/session.js owns the connection. This owns the
// conversation between them: what the panel says, what the lobby shows, when a
// match may start, and what happens when it ends or falls apart.
//
// It is written so that EVERY path out of it lands somewhere sane. There is no
// branch here that leaves the player on a screen with nothing to press.
import { NetSession } from '../net/session.js';
import { NetMatch } from '../net/sync.js';
import { watchGames } from '../net/lobby.js';
import { getDb, availability, netError, connected } from '../net/client.js';
import { T_FLOW, MAX_SEATS } from '../net/config.js';
import { OnlinePanel, LobbyOverlay, NetBanner, OnlineToast } from '../ui/online.js';
import { MAPS, MAP_IDS } from '../arena/index.js';

// Stage choices offered in the lobby. RANDOM first, because it is the sane
// default for a pick-up game and nobody should have to negotiate a map.
const STAGES = ['random', ...MAP_IDS];
const stageName = id => id === 'random' ? 'RANDOM' : (MAPS[id]?.def?.name || id.toUpperCase());

export class OnlineController {
  constructor(uiRoot, sfx, input) {
    this.ui = uiRoot;
    this.sfx = sfx;
    this.input = input;
    this.session = null;
    this.net = null;          // NetMatch for the live match
    this.select = null;
    this.games = [];
    this.stageIndex = 0;
    this.note = null;
    this.busy = false;
    this.onResultDecided = null;

    this.panel = new OnlinePanel(uiRoot, {
      onHost: () => this.host(),
      onJoin: () => this.joinFirst()
    });
    this.lobby = new LobbyOverlay(uiRoot);
    this.lobby.onLeave = () => this.leave('YOU LEFT THE GAME');
    this.lobby.onStart = () => this.startMatch();
    this.lobby.onStage = d => this.cycleStage(d);
    this.banner = new NetBanner(uiRoot);
    this.toast = new OnlineToast(uiRoot);

    this._unwatch = null;
    this._unsession = null;
    this._probe();
    // A player who closes the tab mid-lobby should not leave a ghost row in
    // everyone else's game list.
    this._onHide = () => { try { this.session?.leave(); } catch { } };
    addEventListener('pagehide', this._onHide);
  }

  // ---- availability --------------------------------------------------------
  async _probe() {
    const db = await getDb();
    this.panel.set({ availability, error: netError() });
    if (!db) return;
    this._unwatch = watchGames((games, err) => {
      const before = this.games.length;
      this.games = games.filter(g => !this.session || g.id !== this.session.gameId);
      this.panel.set({ availability: err ? 'error' : 'ok', games: this.games, error: err });
      // A game appearing while you are already looking at something else is
      // news, and the player has no reason to be watching the corner of the
      // screen. It goes through the same toast as every other online event.
      // ...but not on the FIRST result. A game that was already open when the
      // page loaded is not news — the panel and the title screen are showing
      // it before the player has looked at anything.
      if (this._sawGames && !before && this.games.length && !this.active) {
        this.say('ONLINE GAME NOW AVAILABLE', 'good');
        this.sfx?.uiOk?.();
      }
      this._sawGames = true;
    });
  }

  // THE ONE PLACE anything online says anything to the player: a game opening
  // up, a join that failed, a player dropping, the session ending. Callers do
  // not need to know which screen is on — the toast sits above all of them.
  say(text, kind = 'info') { this.toast.say(text, kind); }

  get active() { return !!this.session && this.session.phase !== 'closed'; }
  get inLobby() { return this.active && (this.session.phase === 'lobby' || this.session.phase === 'connecting'); }
  get isHost() { return !!this.session?.isHost; }

  // How many seats this machine brings. Straight off the device detection the
  // select screen already does, so two pads on one couch join as two players.
  _localSeats() {
    return Math.max(1, Math.min(MAX_SEATS, this.select?.seats ?? 1));
  }

  // ---- entering ------------------------------------------------------------
  // One button for the common case: join the open game if there is one, host
  // if there is not. Mirrors what the panel shows.
  toggle() {
    if (this.active) { this.leave('YOU LEFT THE GAME'); return; }
    if (this.games.length) this.joinFirst(); else this.host();
  }

  async host() {
    if (this.busy || this.active) return;
    if (availability !== 'ok') { this.say('ONLINE IS UNAVAILABLE', 'bad'); return; }
    this.busy = true;
    this.sfx?.uiOk?.();
    this._openSession(new NetSession());
    await this.session.host({ seats: this._localSeats() });
    this.busy = false;
    if (this.session?.phase === 'closed') this._closed();
  }

  async joinFirst() {
    const g = this.games[0];
    if (!g) { this.say('NO GAME TO JOIN', 'bad'); return; }
    return this.join(g.id);
  }

  async join(gameId) {
    if (this.busy || this.active) return;
    this.busy = true;
    this.sfx?.uiOk?.();
    this._openSession(new NetSession());
    await this.session.join(gameId, { seats: this._localSeats() });
    this.busy = false;
    if (this.session?.phase === 'closed') this._closed();
  }

  _openSession(s) {
    this.session = s;
    this.note = null;
    this.lobby.show();
    this.panel.hide(true);
    this._unsession?.();
    this._unsession = s.on(() => this._onSessionChange());
    this._flowUnsub = s.subscribe('flow', m => this._onFlow(m));
    // Anything the local seats already locked in is republished, so a player
    // who picked first and pressed O second is READY the moment they arrive.
    this._pushPicks();
  }

  _onSessionChange() {
    const s = this.session;
    if (!s) return;
    if (s.phase === 'closed') { this._closed(); return; }
    // A start payload can land at any moment; the match is built from it.
    if (s.phase === 'starting' && s.startPayload && !this.net) this._buildMatch(s.startPayload);
  }

  _closed() {
    const why = this.session?.closedReason || 'ONLINE SESSION ENDED';
    this.say(why, 'bad');
    this.lobby.hide();
    // Only bring the panel back if a select screen is actually on screen.
    // A player who quits an online match from the pause menu must not get an
    // ONLINE panel pasted over the HUD of the match they are still watching.
    this.panel.hide(!this.select);
    this.note = null;
    this._unsession?.(); this._unsession = null;
    this.session = null;
    // The select screen goes back to being an ordinary local select: anything
    // that was locked in stays locked in, and confirming now starts a local
    // match, which is exactly what the player would expect.
    this.select?._refresh?.();
  }

  leave(reason) {
    if (!this.session) return;
    this.sfx?.uiBack?.();
    try { this.session.leave(reason); } catch { this._closed(); }
  }

  // ---- lobby ---------------------------------------------------------------
  cycleStage(d) {
    if (!this.isHost) return;
    this.stageIndex = (this.stageIndex + d + STAGES.length) % STAGES.length;
    this.sfx?.uiMove?.();
    this.lobby.setStage(stageName(STAGES[this.stageIndex]), true);
  }

  // The select screen re-derives how many seats this couch is bringing every
  // frame (pads hot-plug). Pushing it here keeps the lobby roster, the seat
  // plan and the ready check honest.
  setSeats(n) { this.session?.setSeats(n); }

  // Called by the select screen whenever the local lock-in state changes.
  setPicks(picks) {
    this._picks = picks && picks.length ? picks.slice() : null;
    this._pushPicks();
  }
  _pushPicks() {
    if (!this.session) return;
    if (this._picks) this.session.setPicks(this._picks);
    else this.session.clearReady();
  }

  get canStart() {
    const s = this.session;
    return !!s && s.isHost && s.phase === 'lobby' && s.everyoneReady
      && s.roster.length >= 2 && s.seatCount >= 2 && connected();
  }

  startMatch() {
    if (!this.canStart) return;
    const seed = (Math.random() * 0x7fffffff) | 0;
    // RANDOM is resolved HERE, by the host, to a concrete map id. Left as
    // 'random' each client would roll its own and everyone would fight on a
    // different stage — which is exactly what happened the first time.
    const choice = STAGES[this.stageIndex];
    const map = choice === 'random' ? MAP_IDS[(Math.random() * MAP_IDS.length) | 0] : choice;
    const ok = this.session.start({ map, seed });
    if (!ok) this.say('COULD NOT START — CHECK EVERYONE IS READY', 'bad');
    else this.sfx?.uiOk?.();
  }

  // ---- the match -----------------------------------------------------------
  // Turns the host's start payload into everything core/match.js needs. This
  // is the ONE place the seat plan is read; it is the host's copy, so two
  // clients can never disagree about who is in which seat.
  _buildMatch(payload) {
    const plan = payload.plan || [];
    if (plan.length < 2) { this.say('NOT ENOUGH PLAYERS', 'bad'); this.leave(); return; }
    this.net = new NetMatch(this.session, plan);
    this.session.goLive();
    this.lobby.hide();
    const picks = {
      mode: 'online',
      chars: plan.map(p => p.pick),
      map: payload.map || 'random',
      seed: payload.seed | 0,
      net: this.net,
      netPlan: plan
    };
    this.pendingPicks = picks;
    // Hand it to the select screen, which is the thing currently blocking the
    // game flow on its `done` promise.
    if (this.select?._resolve) {
      this.select._resolve(picks);
      this.select = null;
    }
  }

  // A rematch needs a fresh NetMatch (tick counters, jitter buffers, seat
  // liveness all restart) but keeps the room, the roster and the picks.
  rebuildForRematch(seed) {
    if (!this.session || !this.pendingPicks) return null;
    this.net?.dispose();
    this.net = new NetMatch(this.session, this.pendingPicks.netPlan || []);
    this.pendingPicks = { ...this.pendingPicks, seed: seed | 0, net: this.net };
    return this.pendingPicks;
  }

  // The result screen is host-authoritative online: three people cannot each
  // decide what happens next. Guests see WAITING FOR THE HOST and may leave.
  chooseResult(choice) {
    if (!this.session) { this.onResultDecided?.(choice); return; }
    if (!this.session.isHost) return;
    const seed = (Math.random() * 0x7fffffff) | 0;
    this.session.publish(T_FLOW, { k: 'again', choice, seed });
    this._applyResult(choice, seed);
  }

  _applyResult(choice, seed) {
    if (choice === 'rematch') this.rebuildForRematch(seed);
    else { this.net?.dispose(); this.net = null; this.session?.returnToLobby(); }
    this.onResultDecided?.(choice);
  }

  _onFlow(m) {
    if (m.k === 'again') this._applyResult(m.choice, m.seed);
  }

  // ---- per-frame -----------------------------------------------------------
  // Cheap: a couple of class toggles and a signature compare. Safe to call on
  // every frame of a 3D scene, which is exactly where it is called from.
  update() {
    const s = this.session;
    if (s) {
      this.lobby.update(s, {
        note: this.note,
        canStart: this.canStart,
        stage: stageName(STAGES[this.stageIndex]),
        hostStage: this.isHost
      });
    }
    // Connection banner is global: it matters in the lobby AND in a match.
    if (s && !connected()) this.banner.set('RECONNECTING…', 'warn');
    else if (this._matchBanner) this.banner.set(this._matchBanner, 'warn');
    else this.banner.clear();
  }

  // Called from the match loop with whatever the net layer knows about peers.
  matchStatus(text) { this._matchBanner = text || null; }

  attachSelect(select) {
    this.select = select;
    select.online = this;
    this.panel.hide(this.active);
    if (this.active) this.lobby.show();
  }
  detachSelect() { this.select = null; this.panel.hide(true); }

  // The title screen advertises open games itself, so the panel stays hidden
  // there — but the toast and the lobby still belong to this controller.
  attachTitle() { this.select = null; this.panel.hide(true); this.lobby.hide(); }

  destroy() {
    removeEventListener('pagehide', this._onHide);
    this._unwatch?.();
    this._unsession?.();
    this.net?.dispose();
    this.session?.leave();
    this.panel.destroy();
    this.lobby.destroy();
    this.banner.destroy();
    this.toast.destroy();
  }
}
