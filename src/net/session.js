// The online session: one room, one roster, one state machine.
//
// This owns everything that is true for the whole time you are online — who is
// here, who is host, what everyone picked, what phase the group is in — and
// hands the in-match replication (net/sync.js) a plain pub/sub surface.
//
// It is deliberately the only module that talks to both the room and the
// discovery documents, so the two can never drift apart.
import { getDb, playerId, playerName, makeCode, onConnection, connected } from './client.js';
import { createGame, fetchGame, heartbeat, patchGame, deleteGame, isListable } from './lobby.js';
import {
  ROOM_TYPE, PROTO, MAX_SEATS, HEARTBEAT_MS, T_FLOW, T_EVENT
} from './config.js';

export class NetSession {
  constructor() {
    this.pid = playerId();
    this.name = playerName();
    this.gameId = null;
    this.code = '';
    this.phase = 'idle';     // idle|connecting|lobby|starting|live|closed
    this.error = null;
    this.closedReason = null;
    this.room = null;
    this.db = null;
    this.peers = new Map();  // pid -> presence
    this.self = {
      pid: this.pid, name: this.name, host: false, seats: 1,
      picks: null, ready: false, proto: PROTO, joinedAt: Date.now()
    };
    this.startPayload = null; // the host's `start` message, once it lands
    this._subs = new Map();   // topic -> Set(fn)
    this._unsubs = [];
    this._listeners = new Set();
    this._beat = null;
    this._disposed = false;
    this._onConn = onConnection(() => this._republish());
  }

  // ---- observation ---------------------------------------------------------
  on(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
  _emit() {
    if (this._disposed) return;
    for (const fn of [...this._listeners]) { try { fn(this); } catch (e) { console.warn('[net] listener', e); } }
  }
  _set(phase, err = null) {
    if (this.phase === phase && this.error === err) return;
    this.phase = phase; this.error = err;
    this._emit();
  }

  // Everyone in the room, in a stable order every client agrees on: join time,
  // then player id as the tie-break. Seat numbers come off this order.
  get roster() {
    const all = [this.self, ...this.peers.values()].filter(p => p && p.pid);
    const seen = new Set();
    return all
      .filter(p => (seen.has(p.pid) ? false : (seen.add(p.pid), true)))
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || (a.pid < b.pid ? -1 : 1));
  }
  get hostPid() {
    const r = this.roster;
    return (r.find(p => p.host) || r[0])?.pid ?? null;
  }
  get isHost() { return this.hostPid === this.pid; }
  get seatCount() { return this.roster.reduce((n, p) => n + Math.max(1, p.seats | 0), 0); }
  // Ready means "has a pick for EVERY seat they are bringing". A player who
  // added a second pad and only locked one fighter in is not ready, and the
  // host must not be able to start on top of them.
  get everyoneReady() {
    const r = this.roster;
    return r.length > 0 && r.every(p =>
      p.ready && Array.isArray(p.picks) && p.picks.length === Math.max(1, p.seats | 0));
  }
  peerOnline(pid) { return pid === this.pid || this.peers.has(pid); }

  // The global seat table. Deterministic from the roster, but a match always
  // uses the copy the HOST put in its `start` payload — two clients seeing the
  // roster in different orders for one frame must not produce two seat plans.
  seatPlan() {
    const plan = [];
    for (const p of this.roster) {
      const n = Math.max(1, Math.min(MAX_SEATS, p.seats | 0));
      for (let i = 0; i < n && plan.length < MAX_SEATS; i++) {
        plan.push({
          seat: plan.length, pid: p.pid, name: p.name,
          localIndex: i, pick: p.picks?.[i] || null
        });
      }
    }
    return plan;
  }

  // ---- lifecycle -----------------------------------------------------------
  async host({ seats = 1 } = {}) {
    this._set('connecting');
    this.self.host = true;
    this.self.seats = seats;
    this.self.joinedAt = Date.now();
    try {
      this.code = makeCode();
      this.gameId = await createGame({ code: this.code, hostName: this.name, seats });
      await this._enterRoom();
      this._startHeartbeat();
      this._set('lobby');
    } catch (e) {
      this._fail(e?.message || 'could not host');
    }
    return this;
  }

  async join(gameId, { seats = 1 } = {}) {
    this._set('connecting');
    this.self.host = false;
    this.self.seats = seats;
    this.self.joinedAt = Date.now();
    try {
      const row = await fetchGame(gameId);
      if (!row) throw new Error('THAT GAME IS NO LONGER OPEN');
      if (row.proto !== PROTO) throw new Error('VERSION MISMATCH — RELOAD THE PAGE');
      if (row.status !== 'open') throw new Error('THAT GAME HAS ALREADY STARTED');
      if (!isListable(row)) throw new Error('THAT GAME IS NO LONGER OPEN');
      this.gameId = gameId;
      this.code = row.code || '';
      await this._enterRoom();
      // The room is the real capacity check: the document's seat count lags.
      if (this.seatCount > MAX_SEATS) throw new Error('THAT GAME IS FULL');
      this._set('lobby');
    } catch (e) {
      this._fail(e?.message || 'could not join');
    }
    return this;
  }

  async _enterRoom() {
    const db = await getDb();
    if (!db) throw new Error('ONLINE UNAVAILABLE');
    this.db = db;
    this.room = db.joinRoom(ROOM_TYPE, this.gameId, { initialPresence: { ...this.self } });
    this._unsubs.push(this.room.subscribePresence({}, slice => {
      if (this._disposed) return;
      const next = new Map();
      for (const k in (slice.peers || {})) {
        const p = slice.peers[k];
        if (p && p.pid && p.pid !== this.pid) next.set(p.pid, p);
      }
      const left = [...this.peers.keys()].filter(p => !next.has(p));
      const joined = [...next.keys()].filter(p => !this.peers.has(p));
      this.peers = next;
      if (left.length) this._onPeersLeft(left);
      if (joined.length && this.isHost) this._syncSeatCount();
      this._maybeMigrateHost();
      this._emit();
    }));
    this._unsubs.push(this.room.subscribeTopic(T_FLOW, msg => this._onFlow(msg)));
    this._unsubs.push(this.room.subscribeTopic(T_EVENT, msg => this._onEvent(msg)));
    this.room.publishPresence({ ...this.self });
  }

  _republish() {
    // A reconnect gives us a fresh websocket session, so our presence has to go
    // back up. Cheap and idempotent; called on every connection transition.
    if (this._disposed || !this.room) return;
    try { this.room.publishPresence({ ...this.self }); } catch { }
  }

  _startHeartbeat() {
    clearInterval(this._beat);
    this._beat = setInterval(() => {
      if (this._disposed || !this.isHost || !this.gameId) return;
      heartbeat(this.gameId, {
        seats: this.seatCount,
        status: this.phase === 'lobby' ? 'open' : 'live',
        hostName: this.name
      });
    }, HEARTBEAT_MS);
  }

  _syncSeatCount() {
    if (!this.isHost || !this.gameId) return;
    patchGame(this.gameId, { seats: this.seatCount, beatAt: Date.now() });
  }

  // Host migration. The lowest-ordered surviving player takes the role; every
  // client runs the same comparison off the same roster, so they all reach the
  // same answer without a negotiation round trip.
  _maybeMigrateHost() {
    const r = this.roster;
    if (!r.length) return;
    const hostAlive = r.some(p => p.host);
    // You can only INHERIT the role, never invent it. A guest whose first
    // presence slice arrives before the host's would otherwise see a hostless
    // roster of one — itself — and promote itself into a second host.
    if (hostAlive) { this._sawHost = true; return; }
    if (!this._sawHost || this.phase === 'connecting') return;
    const heir = r[0];
    if (heir.pid !== this.pid || this.self.host) return;
    this.self.host = true;
    this._republish();
    if (this.gameId) { this._startHeartbeat(); this._syncSeatCount(); }
    this._emit();
  }

  _onPeersLeft(pids) {
    for (const fn of this._subs.get('peerleft') || []) { try { fn(pids); } catch { } }
    if (this.isHost) this._syncSeatCount();
    // Lobby only: an empty room is a dead lobby. Mid-match departures are the
    // match's problem (CPU takeover), not the session's.
    if (this.phase === 'lobby' && !this.peers.size && !this.self.host) {
      this.close('HOST LEFT');
    }
  }

  // ---- lobby actions -------------------------------------------------------
  setSeats(n) {
    const v = Math.max(1, Math.min(MAX_SEATS, n | 0));
    if (this.self.seats === v) return;
    this.self.seats = v;
    // changing how many bodies you bring invalidates what you picked
    this.self.picks = null; this.self.ready = false;
    this._republish(); this._syncSeatCount(); this._emit();
  }

  setPicks(picks) {
    const v = Array.isArray(picks) && picks.length ? picks.slice(0, this.self.seats) : null;
    this.self.picks = v;
    this.self.ready = !!v;
    this._republish();
    this._emit();
  }

  clearReady() {
    if (!this.self.ready && !this.self.picks) return;
    this.self.picks = null;
    this.self.ready = false;
    this._republish();
    this._emit();
  }

  // Host only. Freezes the roster into a seat plan and tells everyone to go.
  start({ map, seed }) {
    if (!this.isHost || this.phase !== 'lobby') return false;
    // SEATS ARE RENUMBERED HERE, densely, after dropping anyone without a
    // pick. `seat` is an index into match.fighters, so a gap in it is a
    // fighter that does not exist — which is exactly what a half-ready player
    // used to produce.
    const plan = this.seatPlan().filter(s => s.pick)
      .map((s, i) => ({ ...s, seat: i }));
    if (plan.length < 2) return false;
    const payload = {
      k: 'start', map, seed, proto: PROTO,
      plan: plan.map(s => ({ seat: s.seat, pid: s.pid, li: s.localIndex, pick: s.pick })),
      at: Date.now()
    };
    this.startPayload = payload;
    this._set('starting');
    this.publish(T_FLOW, payload);
    if (this.gameId) patchGame(this.gameId, { status: 'live', beatAt: Date.now() });
    return true;
  }

  goLive() { this._set('live'); }

  // Back to the lobby after a match, keeping the room and the roster.
  returnToLobby() {
    this.startPayload = null;
    this.self.picks = null;
    this.self.ready = false;
    this._republish();
    if (this.isHost && this.gameId) patchGame(this.gameId, { status: 'open', beatAt: Date.now() });
    this._set('lobby');
  }

  // ---- pub/sub for the match layer ----------------------------------------
  publish(topic, body) {
    if (this._disposed || !this.room) return;
    try { this.room.publishTopic(topic, { from: this.pid, ...body }); } catch { }
  }

  subscribe(topic, fn) {
    if (topic === 'peerleft' || topic === 'flow') {
      let set = this._subs.get(topic);
      if (!set) this._subs.set(topic, set = new Set());
      set.add(fn);
      return () => set.delete(fn);
    }
    if (!this.room) return () => { };
    const un = this.room.subscribeTopic(topic, msg => {
      if (!msg || msg.from === this.pid) return;   // Instant echoes our own
      try { fn(msg); } catch (e) { console.warn('[net]', topic, e); }
    });
    this._unsubs.push(un);
    return un;
  }

  _onFlow(msg) {
    if (!msg || msg.from === this.pid) return;
    if (msg.k === 'start') {
      if (msg.proto !== PROTO) { this.close('VERSION MISMATCH — RELOAD THE PAGE'); return; }
      this.startPayload = msg;
      this._set('starting');
    } else if (msg.k === 'lobby') {
      this.returnToLobby();
    } else if (msg.k === 'close') {
      this.close(msg.why || 'THE HOST ENDED THE SESSION');
      return;
    }
    for (const fn of this._subs.get('flow') || []) { try { fn(msg); } catch { } }
  }

  _onEvent(msg) {
    if (!msg || msg.from === this.pid) return;
    if (msg.k === 'bye') {
      this.peers.delete(msg.from);
      this._onPeersLeft([msg.from]);
      this._maybeMigrateHost();
      this._emit();
    }
  }

  // ---- teardown ------------------------------------------------------------
  _fail(reason) {
    this.closedReason = reason;
    this._set('closed', reason);
    this.dispose();
  }

  close(reason = null) {
    if (this._disposed) return;
    this.closedReason = reason;
    this._set('closed', reason);
    this.dispose();
  }

  // Leaving on purpose. Tells the room first so peers distinguish a quit from
  // a crash, then drops the discovery row if we were the one advertising it.
  leave(reason = null) {
    if (this._disposed) return;
    try { this.publish(T_EVENT, { k: 'bye' }); } catch { }
    if (this.isHost && this.gameId) {
      // Someone else can keep the game alive; only tear the row down if we are
      // the last one in the room.
      if (this.peers.size) patchGame(this.gameId, { hostName: '—', beatAt: Date.now() });
      else deleteGame(this.gameId);
    }
    this.close(reason);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    clearInterval(this._beat);
    try { this._onConn?.(); } catch { }
    for (const u of this._unsubs) { try { u?.(); } catch { } }
    this._unsubs.length = 0;
    try { this.room?.leaveRoom?.(); } catch { }
    this.room = null;
    this._listeners.clear();
    this._subs.clear();
  }

  get connected() { return connected(); }
}
