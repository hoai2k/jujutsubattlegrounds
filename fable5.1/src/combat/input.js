// Input for up to four seats: gamepads (Xbox layout) + two keyboard clusters,
// radial deadzones, hot-plug, edge detection, REMAPPABLE keys and pad
// buttons, per-pad rumble. Device assignment is re-evaluated every poll.
import { clamp } from '../core/math.js';

export const BTN = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9, L3: 10, R3: 11, DUP: 12, DDOWN: 13, DLEFT: 14, DRIGHT: 15 };
export const ACTIONS = ['jump', 'punch', 'heavy', 'ct1', 'ct2', 'block', 'dash', 'ult', 'special', 'taunt', 'lock', 'start', 'select'];
export const ACTION_LABEL = { jump: 'JUMP', punch: 'PUNCH', heavy: 'HEAVY', ct1: 'TECHNIQUE 1', ct2: 'TECHNIQUE 2', block: 'BLOCK', dash: 'DASH', ult: 'DOMAIN / ULT', special: 'SPECIAL', taunt: 'TAUNT', lock: 'LOCK-ON', start: 'PAUSE', select: 'LEGEND' };

export const DEFAULT_KEYS = [
  { moveUp: 'KeyW', moveDown: 'KeyS', moveLeft: 'KeyA', moveRight: 'KeyD', jump: 'Space', punch: 'KeyJ', heavy: 'KeyL', ct1: 'KeyU', ct2: 'KeyI', block: 'KeyK', dash: 'ShiftLeft', ult: 'KeyO', special: 'KeyH', taunt: 'KeyP', lock: 'KeyQ', start: 'Escape', select: 'Tab', camLeft: 'ArrowLeft', camRight: 'ArrowRight' },
  { moveUp: 'ArrowUp', moveDown: 'ArrowDown', moveLeft: 'ArrowLeft', moveRight: 'ArrowRight', jump: 'ShiftRight', punch: 'Semicolon', heavy: 'Period', ct1: 'BracketLeft', ct2: 'BracketRight', block: 'Quote', dash: 'ControlRight', ult: 'Backslash', special: 'KeyM', taunt: 'Slash', lock: 'Comma', start: 'Escape', select: 'Tab' }
];
export const DEFAULT_PAD = { jump: BTN.A, punch: BTN.X, heavy: BTN.Y, ct1: BTN.RB, ct2: BTN.RT, block: BTN.LT, dash: BTN.LB, ult: BTN.DRIGHT, special: BTN.B, taunt: BTN.DLEFT, lock: BTN.R3, start: BTN.START, select: BTN.SELECT };

const LS = 'f51.controls';
export const controls = { keys: DEFAULT_KEYS.map(k => ({ ...k })), pad: { ...DEFAULT_PAD }, deadzone: 0.18, rumble: true, camInvert: false };
export function loadControls() {
  try { const s = JSON.parse(localStorage.getItem(LS) || 'null'); if (s) { if (s.keys) s.keys.forEach((k, i) => Object.assign(controls.keys[i], k)); if (s.pad) Object.assign(controls.pad, s.pad); if (s.deadzone != null) controls.deadzone = s.deadzone; if (s.rumble != null) controls.rumble = s.rumble; if (s.camInvert != null) controls.camInvert = s.camInvert; } } catch (e) { /* ignore */ }
}
export function saveControls() { try { localStorage.setItem(LS, JSON.stringify(controls)); } catch (e) { /* ignore */ } }
export function resetControls() { controls.keys = DEFAULT_KEYS.map(k => ({ ...k })); controls.pad = { ...DEFAULT_PAD }; controls.deadzone = 0.18; saveControls(); }

const HELD = ['jump', 'punch', 'heavy', 'ct1', 'ct2', 'block', 'dash', 'ult', 'special', 'taunt', 'lock', 'start', 'select', 'left', 'right', 'up', 'down'];
export function emptyFrame() {
  const f = { move: { x: 0, z: 0 }, cam: { x: 0, y: 0 }, pause: false, confirmP: false, backP: false, back: false };
  for (const k of HELD) { f[k] = false; f[k + 'P'] = false; }
  return f;
}
function dz(x, y, d) {
  const m = Math.hypot(x, y);
  if (m < d) return { x: 0, z: 0 };
  const s = Math.min(1, (m - d) / (1 - d)) / m;
  return { x: x * s, z: y * s };
}
export function mergeMenu(a, b) {
  const f = { ...a };
  for (const k of ['leftP', 'rightP', 'upP', 'downP', 'confirmP', 'backP', 'startP', 'selectP', 'jumpP', 'punchP', 'heavyP', 'tauntP', 'ct1P', 'ct2P']) f[k] = !!(a[k] || b?.[k]);
  return f;
}
export const MAX_PLAYERS = 4;

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.prev = Array.from({ length: MAX_PLAYERS }, emptyFrame);
    this.frames = Array.from({ length: MAX_PLAYERS }, emptyFrame);
    this.onToggle = {};
    this.anyKey = null;
    this.lastDevice = 'keyboard';
    loadControls();
    addEventListener('keydown', e => {
      if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
      if (!e.repeat) { this.keys.add(e.code); this.onToggle[e.code]?.(); this.anyKey?.(e.code); this.lastDevice = 'keyboard'; }
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }
  get pads() { return navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; }
  get livePads() { return this.pads.length; }
  get drivenSeats() { return Math.max(2, Math.min(MAX_PLAYERS, this.livePads)); }

  _readPad(f, gp) {
    const d = controls.deadzone;
    const mv = dz(gp.axes[0] ?? 0, gp.axes[1] ?? 0, d);
    f.move.x += mv.x; f.move.z += mv.z;
    const cv = dz(gp.axes[2] ?? 0, gp.axes[3] ?? 0, d);
    f.cam.x += cv.x; f.cam.y += cv.z * (controls.camInvert ? -1 : 1);
    const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    let any = false;
    for (const a of ACTIONS) { const v = b(controls.pad[a]); if (v) any = true; f[a] ||= v; }
    f.pause ||= b(BTN.START);
    f.left ||= b(BTN.DLEFT) || mv.x < -0.5; f.right ||= b(BTN.DRIGHT) || mv.x > 0.5;
    f.up ||= b(BTN.DUP) || mv.z < -0.5; f.down ||= b(BTN.DDOWN) || mv.z > 0.5;
    f.back ||= b(BTN.B);
    if (any || Math.hypot(mv.x, mv.z) > 0.5) this.lastDevice = 'pad';
  }
  _readKeys(f, map, { menuNav = true } = {}) {
    const k = c => this.keys.has(map[c]);
    const mx = (k('moveRight') ? 1 : 0) - (k('moveLeft') ? 1 : 0), mz = (k('moveDown') ? 1 : 0) - (k('moveUp') ? 1 : 0);
    if (mx || mz) { const m = Math.hypot(mx, mz); f.move.x += mx / m; f.move.z += mz / m; }
    if (map.camLeft) { f.cam.x += (k('camRight') ? 1 : 0) - (k('camLeft') ? 1 : 0); }
    for (const a of ACTIONS) f[a] ||= k(a);
    f.pause ||= k('start');
    if (menuNav) { f.left ||= k('moveLeft'); f.right ||= k('moveRight'); f.up ||= k('moveUp'); f.down ||= k('moveDown'); }
    f.back ||= k('special') || this.keys.has('Backspace');
  }
  poll(i) {
    const f = emptyFrame();
    const pads = this.pads;
    const pad = pads[i];
    if (pad) this._readPad(f, pad);
    if (i === 0 && !pad) this._readKeys(f, controls.keys[0], { menuNav: true });
    if (i === 1 && !pad) this._readKeys(f, controls.keys[1], { menuNav: true });
    if (i === 1 && !pad && pads.length === 1) this._readKeys(f, controls.keys[0], { menuNav: true });
    if (i === 0 && pad && pads.length >= 1) this._readKeys(f, controls.keys[0], { menuNav: false });
    if (i === 1 && pad) this._readKeys(f, controls.keys[1], { menuNav: false });
    // menu confirm/back: A / Enter / punch
    f.confirm = f.jump || f.punch || this.keys.has('Enter') || this.keys.has('NumpadEnter');
    const m = Math.hypot(f.move.x, f.move.z);
    if (m > 1) { f.move.x /= m; f.move.z /= m; }
    const p = this.prev[i];
    for (const k of HELD) f[k + 'P'] = f[k] && !p[k];
    f.confirmP = f.confirm && !p.confirm;
    f.backP = f.back && !p.back;
    f.pauseP = f.pause && !p.pause;
    this.prev[i] = f; this.frames[i] = f;
    return f;
  }
  // ONE POLL PER RENDER FRAME. Edges are computed here, so anything that
  // polled twice in a frame would eat the other consumer's presses — the game
  // loop polls once and every screen / the match reads `frames`.
  pollAll() { for (let i = 0; i < MAX_PLAYERS; i++) this.poll(i); return this.frames; }
  menuFrame() { return mergeMenu(this.frames[0], this.frames[1]); }
  // strip the edge flags after a logic tick has consumed them, so a second
  // tick in the same render frame does not replay the press
  consumeEdges() { for (const f of this.frames) for (const k of HELD) f[k + 'P'] = false; }
  rumble(seat, strong = 0.6, weak = 0.3, ms = 90) {
    if (!controls.rumble) return;
    const gp = this.pads[seat];
    const act = gp?.vibrationActuator;
    if (act?.playEffect) act.playEffect('dual-rumble', { duration: ms, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) }).catch(() => {});
  }
}
