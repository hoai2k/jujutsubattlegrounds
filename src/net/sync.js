// In-match replication.
//
// One instance per online match. It owns the seat table, the outbound input
// batches, the per-seat jitter buffers, the snapshot reconciliation and the
// host's flow authority.
//
// INVARIANT: nothing in here allocates or blocks on the fixed-step path, and
// nothing in here ever touches a locally-owned fighter. Both are load-bearing
// — see docs/online-multiplayer.md §7.
import { packFrame, unpackFrame, packSnap, idleFrame } from './protocol.js';
import {
  T_INPUT, T_SNAP, T_FLOW, T_EVENT, INPUT_SEND_TICKS, SNAP_SEND_TICKS,
  RESEND_TICKS, RING, JITTER_MIN, JITTER_START, JITTER_MAX,
  SNAP_EPS, SNAP_HARD, SNAP_BLEND, STATE_FORCE_MS, DROP_GRACE_MS, JOIN_GRACE_MS,
  KEEPALIVE_MS, TICK_HZ
} from './config.js';

// States it is safe to force a fighter into from a snapshot. Attacking states
// are deliberately absent: re-entering one would restart its active window and
// could land the same hit twice. Those are left to input replay, which gets
// them right anyway because they are pure functions of the button that started
// them.
const FORCEABLE = new Set([
  'idle', 'walk', 'run', 'jump', 'fall', 'land', 'dash', 'block', 'blockstun',
  'hitLight', 'hitHeavy', 'launched', 'knockdown', 'getup', 'guardBreak',
  'techRise', 'ko', 'victory', 'intro'
]);

const CORR_TICKS = Math.max(1, Math.round(SNAP_BLEND * TICK_HZ));

class RemoteSeat {
  constructor(seat, pid) {
    this.seat = seat;
    this.pid = pid;
    this.ring = new Array(RING);
    this.head = -1;          // newest tick received
    this.cursor = -1;        // tick currently being played
    this.prevPacked = null;  // for edge synthesis
    this.prevFrame = null;
    this.jitter = JITTER_START;
    this.starveRun = 0;
    this.healthyRun = 0;
    // positional correction, absorbed over CORR_TICKS
    this.ex = 0; this.ey = 0; this.ez = 0; this.eyaw = 0; this.eTicks = 0;
    this.mergeFrom = null;
    this.badState = null;
    this.badStateMs = 0;
    this.lastMsgAt = performance.now();
    // Never declare a seat lost before it has said anything at all. A peer
    // still building a 90-metre map is not a disconnect, and treating it as
    // one hands their fighter to the CPU before they have even spawned.
    this.everHeard = false;
    this.lost = false;
  }
}

export class NetMatch {
  // `plan` is the host's frozen seat table: [{seat, pid, li, pick}]
  constructor(session, plan) {
    this.session = session;
    this.pid = session.pid;
    this.plan = plan;
    this.tick = 0;
    this.disposed = false;

    this.seats = plan.map(s => ({
      seat: s.seat, pid: s.pid, localIndex: s.li, pick: s.pick,
      mine: s.pid === this.pid
    }));
    // Device index -> seat, for the local seats only. This is the ONLY place
    // that knows which of the four fighters this machine is driving.
    this.localSeats = this.seats.filter(s => s.mine).map(s => s.seat);
    this.remote = new Map();
    for (const s of this.seats) if (!s.mine) this.remote.set(s.seat, new RemoteSeat(s.seat, s.pid));

    this.outInputs = new Map();   // seat -> [[tick, packed], ...] pending+resend
    this.flowQueue = [];
    this.snapQueue = [];
    this.notices = [];            // human-readable strings for the HUD
    this.finRoll = Math.random(); // replaced by the host's on a KO
    this._koSeen = false;

    this._unsubs = [
      session.subscribe(T_INPUT, m => this._onInput(m)),
      session.subscribe(T_SNAP, m => this._onSnap(m)),
      session.subscribe(T_FLOW, m => { this.flowQueue.push(m); this._touch(m.from); }),
      session.subscribe(T_EVENT, m => this._onEvent(m)),
      session.subscribe('peerleft', pids => { for (const p of pids) this._peerGone(p); })
    ];
  }

  get isHost() { return this.session.isHost; }
  isLocalSeat(seat) { return this.localSeats.includes(seat); }
  // Which local input device drives a locally-owned seat.
  deviceFor(seat) { return this.seats.find(s => s.seat === seat)?.localIndex ?? 0; }
  get localSeatCount() { return this.localSeats.length; }

  _touch(pid) {
    for (const r of this.remote.values()) {
      if (r.pid !== pid) continue;
      r.lastMsgAt = performance.now();
      r.everHeard = true;
      if (r.lost) {
        r.lost = false;
        this.notices.push({ seat: r.seat, kind: 'back' });
      }
    }
  }

  // ---- inbound -------------------------------------------------------------
  _onInput(m) {
    this._touch(m.from);
    const b = m.b;
    if (!Array.isArray(b)) return;
    for (const entry of b) {
      const seat = entry[0] | 0, tick = entry[1] | 0, packed = entry[2];
      const r = this.remote.get(seat);
      if (!r || r.pid !== m.from) continue;   // only the owner may drive a seat
      if (tick <= r.cursor) continue;         // already played, ignore
      r.ring[tick % RING] = packed;
      if (tick > r.head) r.head = tick;
    }
  }

  _onSnap(m) {
    this._touch(m.from);
    if (Array.isArray(m.b)) for (const s of m.b) {
      const r = this.remote.get(s.s);
      if (r && r.pid === m.from) this.snapQueue.push(s);
    }
  }

  _onEvent(m) {
    this._touch(m.from);
    if (m.k === 'bye') this._peerGone(m.from);
  }

  // A clean goodbye: no grace period, they told us.
  _peerGone(pid) {
    for (const r of this.remote.values()) {
      if (r.pid !== pid || r.lost) continue;
      r.lost = true;
      r.lastMsgAt = 0;
      this.notices.push({ seat: r.seat, kind: 'gone' });
    }
  }

  // Peers that have gone quiet without a clean goodbye. Reported as 'stalling'
  // first (the UI shows RECONNECTING) and only handed to the CPU once the
  // grace period is up, because a two-second hiccup is not a disconnect.
  // Promote quiet seats to lost. Mutating, and therefore called from exactly
  // one place: the match's liveness tick. `liveness()` below is a pure read
  // that the HUD can call every frame without side effects.
  tickLiveness() {
    const now = performance.now();
    for (const r of this.remote.values()) {
      if (r.lost) continue;
      // A seat we have never heard from is JOINING, not dropping: it gets the
      // long grace, because "reconnecting" is a lie the first time round.
      const grace = r.everHeard ? DROP_GRACE_MS : JOIN_GRACE_MS;
      if (now - r.lastMsgAt > grace) {
        r.lost = true;
        this.notices.push({ seat: r.seat, kind: 'gone' });
      }
    }
  }

  liveness() {
    const now = performance.now();
    const out = [];
    for (const r of this.remote.values()) {
      const quiet = now - r.lastMsgAt;
      out.push({
        seat: r.seat, pid: r.pid,
        joining: !r.everHeard,
        stalling: !r.lost && quiet > 1200,
        lost: r.lost,
        forMs: quiet
      });
    }
    return out;
  }

  // Cinematics (a finisher, Megumi's ritual) and hitstop stop the logic tick,
  // and with it the input stream — for up to eight seconds. Without this the
  // silence reads exactly like a disconnect and both players hand each other
  // to the CPU mid-cutscene. Cheap, throttled, and driven from `Match.update`
  // ABOVE every early return.
  keepAlive() {
    if (this.disposed) return;
    const now = performance.now();
    if (now - (this._kaAt || 0) < KEEPALIVE_MS) return;
    this._kaAt = now;
    this.session.publish(T_EVENT, { k: 'ka' });
  }

  // ---- per-tick ------------------------------------------------------------
  // Called at the top of the logic tick, before any fighter updates.
  beginTick(match) {
    this.tick++;
    this._applySnaps(match);
    for (const r of this.remote.values()) this._advance(r);
  }

  _advance(r) {
    if (r.head < 0) return;                       // nothing received yet
    if (r.cursor < 0) { r.cursor = Math.max(0, r.head - r.jitter); return; }
    const lag = r.head - r.cursor;
    if (lag <= 0) {
      // starved: hold position, do not burn the cursor, and widen the buffer
      r.starveRun++;
      r.healthyRun = 0;
      if (r.starveRun > 3) { r.jitter = Math.min(JITTER_MAX, r.jitter + 1); r.starveRun = 0; }
      return;
    }
    r.starveRun = 0;
    // Too far behind: jump the cursor rather than let latency ratchet upward.
    // The skipped span is remembered so `inputFor` can fold its buttons into
    // the frame it plays — a jump that silently swallowed a press would cost
    // the remote player an attack they actually made.
    if (lag > r.jitter * 2 + 4) {
      r.mergeFrom = r.cursor + 1;
      r.cursor = r.head - r.jitter;
    } else r.cursor++;
    if (++r.healthyRun > TICK_HZ * 3) {
      r.healthyRun = 0;
      r.jitter = Math.max(JITTER_MIN, r.jitter - 1);
    }
  }

  // The input frame a remote seat plays this tick.
  inputFor(seat) {
    const r = this.remote.get(seat);
    if (!r) return idleFrame();
    if (r.cursor < 0) return idleFrame();
    const packed = r.ring[r.cursor % RING];
    if (!packed) {
      // A hole in the stream. Hold whatever was last held, with no edges — a
      // repeated edge would fire the same attack again.
      const f = unpackFrame(r.prevPacked, r.prevPacked);
      r.prevFrame = f;
      return f;
    }
    // Fold in anything the cursor jumped over, so no press is lost.
    let use = packed;
    if (r.mergeFrom != null) {
      let mask = packed[0] | 0;
      for (let t = r.mergeFrom; t < r.cursor; t++) {
        const p = r.ring[t % RING];
        if (p) mask |= p[0] | 0;
      }
      use = [mask, packed[1], packed[2], packed[3], packed[4]];
      r.mergeFrom = null;
    }
    const f = unpackFrame(use, r.prevPacked);
    r.prevPacked = use;
    r.prevFrame = f;
    return f;
  }

  // Called with this tick's frame for a locally-owned seat.
  recordLocal(seat, frame) {
    let list = this.outInputs.get(seat);
    if (!list) this.outInputs.set(seat, list = []);
    list.push([this.tick, packFrame(frame)]);
    // keep only what we still want to (re)send
    if (list.length > RESEND_TICKS + INPUT_SEND_TICKS) {
      list.splice(0, list.length - (RESEND_TICKS + INPUT_SEND_TICKS));
    }
  }

  // Called at the end of the logic tick. Publishing only.
  endTick(match) {
    if (this.disposed) return;
    if (this.tick % INPUT_SEND_TICKS === 0) this._sendInputs();
    if (this.tick % SNAP_SEND_TICKS === 0) this._sendSnaps(match);
    this._applyCorrections(match);
  }

  _sendInputs() {
    const b = [];
    for (const [seat, list] of this.outInputs) for (const e of list) b.push([seat, e[0], e[1]]);
    if (!b.length) return;
    this.session.publish(T_INPUT, { b });
  }

  // Snapshots go out on the clock, and immediately on demand (`flushSnaps`)
  // for the moments a peer must not learn about late.
  _sendSnaps(match) {
    const b = [];
    for (const seat of this.localSeats) {
      const f = match.fighters[seat];
      if (!f) continue;
      b.push(packSnap(seat, this.tick, f));
    }
    if (b.length) this.session.publish(T_SNAP, { b });
  }

  flushSnaps(match) { if (!this.disposed) this._sendSnaps(match); }

  _applySnaps(match) {
    if (!this.snapQueue.length) return;
    // Only the newest snapshot per seat matters; older ones are strictly worse
    // information about the same thing.
    const best = new Map();
    for (const s of this.snapQueue) {
      const cur = best.get(s.s);
      if (!cur || s.t > cur.t) best.set(s.s, s);
    }
    this.snapQueue.length = 0;
    for (const [seat, s] of best) {
      const r = this.remote.get(seat);
      const f = match.fighters[seat];
      if (!r || !f) continue;
      this._reconcile(match, r, f, s);
    }
  }

  _reconcile(match, r, f, s) {
    // ---- resources: verbatim, always. This is what stops RNG divergence in
    // the damage pipeline from ever becoming two clients disagreeing about who
    // won a round.
    if (f.res) {
      if (typeof s.hp === 'number') f.res.hp = s.hp;
      if (typeof s.ce === 'number') f.res.curCE = s.ce;
    }
    if (typeof s.lv === 'number') f.lives = s.lv;
    if (s.el && !f.eliminated) { f.eliminated = true; f.model.group.visible = false; }

    // ---- position: a correction, never a teleport (unless it has to be)
    const dx = s.p[0] - f.pos.x, dy = s.p[1] - f.pos.y, dz = s.p[2] - f.pos.z;
    const err = Math.hypot(dx, dy, dz);
    if (err >= SNAP_HARD) {
      f.pos.set(s.p[0], s.p[1], s.p[2]);
      f.vel.set(s.v[0], s.v[1], s.v[2]);
      f.facing = s.y;
      r.ex = r.ey = r.ez = r.eyaw = 0; r.eTicks = 0;
    } else if (err > SNAP_EPS) {
      r.ex = dx; r.ey = dy; r.ez = dz;
      let dyaw = s.y - f.facing;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      r.eyaw = dyaw;
      r.eTicks = CORR_TICKS;
    }

    // ---- state: only forced after a sustained disagreement
    if (s.st && s.st !== f.state) {
      if (r.badState === s.st) r.badStateMs += 1000 / TICK_HZ * SNAP_SEND_TICKS;
      else { r.badState = s.st; r.badStateMs = 0; }
      if (r.badStateMs >= STATE_FORCE_MS && FORCEABLE.has(s.st)) {
        f.setState(s.st, {});
        r.badState = null; r.badStateMs = 0;
      }
    } else {
      r.badState = null; r.badStateMs = 0;
    }
  }

  _applyCorrections(match) {
    for (const r of this.remote.values()) {
      if (r.eTicks <= 0) continue;
      const f = match.fighters[r.seat];
      if (!f) { r.eTicks = 0; continue; }
      const k = 1 / r.eTicks;
      f.pos.x += r.ex * k; f.pos.y += r.ey * k; f.pos.z += r.ez * k;
      f.facing += r.eyaw * k;
      r.ex -= r.ex * k; r.ey -= r.ey * k; r.ez -= r.ez * k; r.eyaw -= r.eyaw * k;
      r.eTicks--;
    }
  }

  // ---- flow authority ------------------------------------------------------
  // Guests never declare a KO from their own HP: they would race the host and
  // double-decrement lives. They apply the host's.
  mayStartKO() { return this.isHost; }

  emitKO(payload) {
    this.finRoll = Math.random();
    this.session.publish(T_FLOW, { k: 'ko', ...payload, fin: this.finRoll });
  }

  emitFlow(k, body = {}) { this.session.publish(T_FLOW, { k, ...body }); }

  // Drain queued flow messages for the match to apply.
  takeFlow() {
    if (!this.flowQueue.length) return null;
    const out = this.flowQueue.slice();
    this.flowQueue.length = 0;
    return out;
  }

  takeNotices() {
    if (!this.notices.length) return null;
    const out = this.notices.slice();
    this.notices.length = 0;
    return out;
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const u of this._unsubs) { try { u?.(); } catch { } }
    this._unsubs.length = 0;
    this.outInputs.clear();
    this.remote.clear();
  }
}
