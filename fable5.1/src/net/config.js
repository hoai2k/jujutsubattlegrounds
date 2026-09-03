// Every online tunable in one place. Nothing else in src/net/ should hold a
// magic number — if a value needs justifying, it is justified here.

export const APP_ID = '96e3e93f-4644-4596-a02f-40e8ae915138';

// Bumped whenever a wire format changes. Games advertising a different proto
// are hidden from the list and refused on a direct join, which is how a live
// deploy avoids two incompatible builds trying to fight each other.
export const PROTO = 1;

export const ROOM_TYPE = 'arena';
export const GAMES = 'arenaGames';   // discovery namespace

export const MAX_SEATS = 4;

// ---- discovery -------------------------------------------------------------
export const HEARTBEAT_MS = 4000;    // host refreshes `beatAt` this often
export const STALE_MS = 14000;       // ...and a row older than this is dead
export const LOBBY_POLL_MS = 2500;   // re-evaluate staleness on a timer too,
                                     // because the query does not re-fire when
                                     // the only thing that changed is the clock

// ---- in-match --------------------------------------------------------------
export const TICK_HZ = 60;
export const INPUT_SEND_TICKS = 3;   // publish inputs every 3 ticks (20 Hz)
export const SNAP_SEND_TICKS = 6;    // ...and snapshots every 6 (10 Hz)
export const RESEND_TICKS = 8;       // re-send this many already-sent frames.
                                     // Redundancy is cheaper than retransmit
                                     // at this payload size and makes an
                                     // isolated packet loss invisible.
export const RING = 256;             // per-seat input ring, in ticks (~4.2 s)

// Jitter buffer: how far behind the newest received frame a remote fighter is
// simulated. Starts at 6 ticks (100 ms) and adapts between the bounds.
export const JITTER_MIN = 3;
export const JITTER_START = 6;
export const JITTER_MAX = 20;

// Position reconciliation. Under EPS a correction is noise; over HARD it is a
// genuine desync and correctness beats smoothness.
export const SNAP_EPS = 0.05;
export const SNAP_HARD = 2.5;
export const SNAP_BLEND = 0.2;       // seconds to absorb a soft correction

// How long a fighter's state name has to disagree with its owner before we
// force it. Short disagreements are the jitter buffer, not a desync.
export const STATE_FORCE_MS = 400;

// ---- liveness --------------------------------------------------------------
export const DROP_GRACE_MS = 8000;   // "RECONNECTING..." before CPU takeover
// A peer we have not heard from ONCE yet is still loading — a big map build on
// a slow machine takes real seconds — so its first grace is much longer.
export const JOIN_GRACE_MS = 30000;
// Heartbeat published even when the logic tick is not running, so a cinematic
// or a long hitstop is never mistaken for a dropped connection.
export const KEEPALIVE_MS = 700;

// Topics.
export const T_INPUT = 'in';
export const T_SNAP = 'st';
export const T_EVENT = 'ev';
export const T_FLOW = 'fl';
