// Wire formats. Everything crossing the network is built and parsed here, so
// there is exactly one place to look when a payload changes shape.
//
// Frames are packed into plain arrays of small integers rather than objects:
// the payload is JSON over a websocket, and `[3,127,0,0,0]` is a quarter the
// size of the equivalent object with no loss.
import { emptyFrame } from '../input/input.js';

// Held buttons, in bit order. APPEND ONLY — the index IS the wire format.
export const BITS = [
  'jump', 'punch', 'heavy', 'ct1', 'ct2', 'block', 'dash', 'ult',
  'copy', 'taunt', 'lock', 'start', 'select', 'back'
];

// The press edges a receiver has to synthesise. Mirrors InputManager._finish.
const EDGE_OF = {
  jump: 'jumpP', punch: 'punchP', heavy: 'heavyP', ct1: 'ct1P', ct2: 'ct2P',
  ult: 'ultP', copy: 'copyP', taunt: 'tauntP', lock: 'lockP',
  start: 'startP', select: 'selectP', back: 'backP', block: 'blockP'
};

const q7 = v => Math.max(-127, Math.min(127, Math.round(v * 127)));
const d7 = v => v / 127;

// [mask, moveX, moveZ, camX, camY]
export function packFrame(f) {
  let mask = 0;
  for (let i = 0; i < BITS.length; i++) if (f[BITS[i]]) mask |= (1 << i);
  return [mask, q7(f.move.x), q7(f.move.z), q7(f.cam.x), q7(f.cam.y)];
}

// Rebuild a full input frame. Edges are derived from `prev` rather than
// transmitted: a lost packet then costs a few ticks of motion instead of
// permanently swallowing (or duplicating) a button press.
//
// `prev` may be null (first frame ever) — everything held becomes an edge,
// which is correct: it is the first tick we know about.
export function unpackFrame(p, prev) {
  const f = emptyFrame();
  if (!p) return f;
  const mask = p[0] | 0;
  for (let i = 0; i < BITS.length; i++) if (mask & (1 << i)) f[BITS[i]] = true;
  f.move.x = d7(p[1] | 0); f.move.z = d7(p[2] | 0);
  f.cam.x = d7(p[3] | 0); f.cam.y = d7(p[4] | 0);
  // menu axes, exactly as the local poller derives them
  f.left = f.move.x < -0.5; f.right = f.move.x > 0.5;
  f.up = f.move.z < -0.5; f.down = f.move.z > 0.5;
  for (const k in EDGE_OF) f[EDGE_OF[k]] = f[k] && !(prev && prev[k]);
  f.leftP = f.left && !(prev && prev.left);
  f.rightP = f.right && !(prev && prev.right);
  f.upP = f.up && !(prev && prev.up);
  f.downP = f.down && !(prev && prev.down);
  f.confirmP = f.jumpP || f.punchP || f.startP;
  // `pause` is never replicated: one player's pause menu must not stop three
  // other people's game. See the pause note in docs/online-multiplayer.md.
  f.pause = false; f.pauseP = false;
  return f;
}

// A neutral frame that keeps the fighter's stick where it was but releases
// every button — what a starved jitter buffer plays. Repeating the last frame
// verbatim would machine-gun whatever the player was last holding.
export function idleFrame() { return emptyFrame(); }

const r3 = v => Math.round(v * 1000) / 1000;

// Owner-authoritative fighter snapshot.
export function packSnap(seat, tick, f) {
  return {
    s: seat, t: tick,
    p: [r3(f.pos.x), r3(f.pos.y), r3(f.pos.z)],
    v: [r3(f.vel.x), r3(f.vel.y), r3(f.vel.z)],
    y: r3(f.facing),
    st: f.state,
    hp: Math.round(f.res?.hp ?? 0),
    ce: Math.round(f.res?.curCE ?? 0),
    lv: f.lives | 0,
    el: f.eliminated ? 1 : 0
  };
}

// ---- envelopes -------------------------------------------------------------
// Every payload carries the sender's stable id. Instant echoes broadcasts back
// to the publisher, and presence is not a reliable way to identify a sender
// (a peer that has not published presence yet arrives as undefined), so `from`
// is the only identity the receiving side trusts.
export function envelope(from, body) { return { from, ...body }; }
