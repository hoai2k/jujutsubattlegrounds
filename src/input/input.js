// Local input for up to four players: gamepads (Xbox layout) + keyboard
// fallbacks with radial deadzones, hot-plug via connect events + per-frame
// getGamepads(), edges.
//
// Device assignment (re-evaluated every poll, so hot-plug just works):
//   pad i drives player i whenever it is present.
//   The two keyboard maps back whichever of P1/P2 have no pad — so 1v1 on a
//   single keyboard still works exactly as it always did. Players 3 and 4 are
//   pad-only: there is no third cluster of keys that is comfortable to share.
//   0 pads: P1 = keyboard map 1 (WASD/J...), P2 = keyboard map 2 (arrows/;...)
//   1 pad : P1 = pad 0,                      P2 = keyboard (both maps merged)
//   2 pads: P1 = pad 0 (+kb map 1),          P2 = pad 1 (+kb map 2)
//   3-4   : P3 = pad 2, P4 = pad 3
const DEADZONE = 0.18;

const BTN = {
  A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SELECT: 8, START: 9,
  L3: 10, R3: 11, DUP: 12, DDOWN: 13, DLEFT: 14, DRIGHT: 15
};

// THE SPECIAL LIVES ON B. It used to live on D-pad Left, and the frame field is
// still called `copy` because that is what every consumer calls it (it was
// named for Yuta's Copy, the first special there was) — only the BINDING moved.
// D-pad Left is now TAUNT, which is why the move had to happen at all.
//
// B is shared with `back`, and that is deliberate rather than a collision left
// standing: the two never coexist. `back` is read by menus (select, settings,
// map select, pause) and by the execution duel / plea trial, and every fighter
// in the duel is in one of the frozen states (`sentenced` / `executing`) that
// `_stateLogic` refuses all input for. `copy` is read only from the live
// gameplay states. See the audit note in core/match.js.
const KEYMAP_P1 = {
  moveUp: 'KeyW', moveDown: 'KeyS', moveLeft: 'KeyA', moveRight: 'KeyD',
  jump: 'Space', punch: 'KeyJ', heavy: 'KeyL', ct1: 'KeyU', ct2: 'KeyI',
  block: 'KeyK', dash: 'ShiftLeft', ult: 'KeyO',
  // B — SPECIAL, and the menu/duel back. One pad button, so one key: H, which
  // already was B and sits directly beside the J/K/L attack cluster.
  copy: 'KeyH', back: 'KeyH',
  taunt: 'KeyP',                      // D-pad Left — the special's old key
  lock: 'KeyQ',                       // R3 — toggle the camera mode
  start: 'Enter', select: 'Tab'
};
// right-hand cluster for the second local player
const KEYMAP_P2 = {
  moveUp: 'ArrowUp', moveDown: 'ArrowDown', moveLeft: 'ArrowLeft', moveRight: 'ArrowRight',
  jump: 'ShiftRight', punch: 'Semicolon', heavy: 'Period', ct1: 'BracketLeft', ct2: 'BracketRight',
  block: 'Quote', dash: 'ControlRight', ult: 'Backslash',
  copy: 'KeyM', back: 'KeyM',         // B — see the P1 note above
  taunt: 'Slash',                     // D-pad Left
  lock: 'Comma',                      // R3 — toggle the camera mode
  start: 'Enter', select: 'Tab'
};

export function emptyFrame() {
  return {
    move: { x: 0, z: 0 }, cam: { x: 0, y: 0 },
    jump: false, punch: false, heavy: false, ct1: false, ct2: false, block: false,
    dash: false, ult: false, copy: false, taunt: false, lock: false, start: false, select: false, back: false,
    pause: false, pauseP: false,
    jumpP: false, punchP: false, heavyP: false, ct1P: false, ct2P: false, ultP: false,
    copyP: false, tauntP: false, lockP: false, startP: false, selectP: false, blockP: false,
    left: false, right: false, up: false, down: false,
    leftP: false, rightP: false, upP: false, downP: false, confirmP: false, backP: false
  };
}

function dz(v) {
  const m = Math.hypot(v.x, v.z ?? v.y);
  if (m < DEADZONE) return { x: 0, z: 0 };
  const s = Math.min(1, (m - DEADZONE) / (1 - DEADZONE)) / m;
  return { x: v.x * s, z: (v.z ?? v.y) * s };
}

export function mergeMenu(a, b) {
  // union of menu-relevant edges (either player can drive menus)
  const f = { ...a };
  // `heavyP` and `tauntP` ride along for the taunt previews: the result screen
  // replays the winner's taunt on D-pad Left, and character select previews one
  // on Y — Y because D-pad Left IS the cursor there, and a preview that moved
  // your selection would be worse than no preview.
  for (const k of ['leftP', 'rightP', 'upP', 'downP', 'confirmP', 'backP', 'startP', 'selectP', 'jumpP', 'punchP', 'heavyP', 'tauntP']) {
    f[k] = !!(a[k] || b?.[k]);
  }
  return f;
}

export const MAX_PLAYERS = 4;

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.prev = Array.from({ length: MAX_PLAYERS }, emptyFrame);
    this.frames = Array.from({ length: MAX_PLAYERS }, emptyFrame);
    this.padCount = 0;
    this.onToggle = {};
    addEventListener('keydown', e => {
      if (e.code === 'Tab') e.preventDefault();
      if (!e.repeat) {
        this.keys.add(e.code);
        if (this.onToggle[e.code]) this.onToggle[e.code]();
      }
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    addEventListener('gamepadconnected', () => this._scan());
    addEventListener('gamepaddisconnected', () => this._scan());
    this._scan();
  }

  _scan() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.padCount = [...pads].filter(Boolean).length;
  }

  // live pad count (hot-plug safe — the connect events can be missed if the
  // page was not focused when the pad woke up)
  get livePads() {
    return navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean).length : 0;
  }

  // How many seats currently have a real device of their own. The keyboard
  // always covers the first two seats (split, or backing a pad-less one), so
  // the floor is 2; beyond that it is one seat per pad. Character select uses
  // this to decide which seats get their own cursor.
  get drivenSeats() {
    return Math.max(2, Math.min(MAX_PLAYERS, this.livePads));
  }

  _readPad(f, gp) {
    const mv = dz({ x: gp.axes[0] ?? 0, y: gp.axes[1] ?? 0 });
    f.move.x += mv.x; f.move.z += mv.z;
    const cv = dz({ x: gp.axes[2] ?? 0, y: gp.axes[3] ?? 0 });
    f.cam.x += cv.x; f.cam.y += cv.z;
    const b = i => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    f.jump ||= b(BTN.A); f.punch ||= b(BTN.X); f.heavy ||= b(BTN.Y);
    f.ct1 ||= b(BTN.RB); f.ct2 ||= b(BTN.RT);
    f.block ||= b(BTN.LT); f.dash ||= b(BTN.LB);
    f.ult ||= b(BTN.DRIGHT);
    f.copy ||= b(BTN.B);           // SPECIAL (held, for the three radial wheels)
    f.taunt ||= b(BTN.DLEFT);      // TAUNT
    f.lock ||= b(BTN.R3);          // right stick press: camera mode toggle
    f.start ||= b(BTN.START); f.select ||= b(BTN.SELECT);
    f.pause ||= b(BTN.START);
    f.left ||= b(BTN.DLEFT) || mv.x < -0.5; f.right ||= b(BTN.DRIGHT) || mv.x > 0.5;
    f.up ||= b(BTN.DUP) || mv.z < -0.5; f.down ||= b(BTN.DDOWN) || mv.z > 0.5;
    f.back ||= b(BTN.B);
  }

  _readKeys(f, map, { menuNav = true } = {}) {
    const k = c => this.keys.has(map[c]);
    if (k('moveUp')) f.move.z -= 1;
    if (k('moveDown')) f.move.z += 1;
    if (k('moveLeft')) f.move.x -= 1;
    if (k('moveRight')) f.move.x += 1;
    f.jump ||= k('jump'); f.punch ||= k('punch'); f.heavy ||= k('heavy');
    f.ct1 ||= k('ct1'); f.ct2 ||= k('ct2');
    f.block ||= k('block'); f.dash ||= k('dash');
    f.ult ||= k('ult'); f.copy ||= k('copy'); f.taunt ||= k('taunt'); f.lock ||= k('lock');
    f.start ||= k('start'); f.select ||= k('select');
    if (menuNav) {
      f.left ||= k('moveLeft'); f.right ||= k('moveRight');
      f.up ||= k('moveUp'); f.down ||= k('moveDown');
    }
    // per-seat B, plus the global Backspace that menus have always used
    f.back ||= (map.back && this.keys.has(map.back)) || this.keys.has('Backspace');
  }

  _finish(f, prev) {
    const ml = Math.hypot(f.move.x, f.move.z);
    if (ml > 1) { f.move.x /= ml; f.move.z /= ml; }
    f.jumpP = f.jump && !prev.jump; f.punchP = f.punch && !prev.punch;
    f.heavyP = f.heavy && !prev.heavy;
    f.ct1P = f.ct1 && !prev.ct1; f.ct2P = f.ct2 && !prev.ct2;
    f.ultP = f.ult && !prev.ult; f.copyP = f.copy && !prev.copy;
    f.tauntP = f.taunt && !prev.taunt;
    f.lockP = f.lock && !prev.lock;
    f.startP = f.start && !prev.start; f.selectP = f.select && !prev.select;
    f.blockP = f.block && !prev.block;
    f.pauseP = f.pause && !prev.pause;
    f.leftP = f.left && !prev.left; f.rightP = f.right && !prev.right;
    f.upP = f.up && !prev.up; f.downP = f.down && !prev.down;
    f.confirmP = f.jumpP || f.punchP || f.startP;
    f.backP = f.back && !prev.back;
    return f;
  }

  // Poll every local player once per logic tick.
  // mode 'cpu': keyboard is P1's (arrows steer the camera).
  // mode 'local': keyboard splits (or backs the pad-less player).
  // `count` is how many human seats this match has (1-4).
  pollAll(mode = 'local', count = 2) {
    const n = Math.max(2, Math.min(MAX_PLAYERS, count));
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const frames = Array.from({ length: n }, emptyFrame);

    // pads drive their own seat
    for (let i = 0; i < n; i++) if (pads[i]) this._readPad(frames[i], pads[i]);
    // keyboard backs P1/P2 only, exactly as it did before
    if (pads.length >= 2) {
      this._readKeys(frames[0], KEYMAP_P1);
      this._readKeys(frames[1], KEYMAP_P2);
    } else if (pads.length === 1) {
      this._readKeys(frames[1], KEYMAP_P1);
      this._readKeys(frames[1], KEYMAP_P2);
    } else {
      this._readKeys(frames[0], KEYMAP_P1);
      this._readKeys(frames[1], KEYMAP_P2);
    }

    // PAUSE IS GLOBAL: Escape, or START on ANY pad — including a pad that
    // drives no seat in this match. `_readPad` only runs for seats 0..n-1, so
    // in a 1v1 the START on pad 3 was read by nobody and player 3's controller
    // could not stop the game it was sitting in front of. Pausing is not a
    // gameplay input and has no business being seat-gated, so it is ORed in
    // here from every connected pad, exactly the way Escape is.
    const anyStart = pads.some(gp => {
      const btn = gp.buttons?.[BTN.START];
      return !!btn && (btn.pressed || btn.value > 0.5);
    });
    if (anyStart || this.keys.has('Escape')) for (const f of frames) f.pause = true;

    // vs CPU with keyboard P1: arrow keys become camera control
    if (mode === 'cpu' && pads.length === 0) {
      const f1 = frames[0];
      if (this.keys.has('ArrowLeft')) f1.cam.x -= 1;
      if (this.keys.has('ArrowRight')) f1.cam.x += 1;
      if (this.keys.has('ArrowUp')) f1.cam.y -= 1;
      if (this.keys.has('ArrowDown')) f1.cam.y += 1;
    }

    for (let i = 0; i < n; i++) {
      this._finish(frames[i], this.prev[i]);
      this.prev[i] = frames[i];
      this.frames[i] = frames[i];
    }

    // PADS BEYOND THE SEAT COUNT still drive MENUS. `frames` — what the match
    // ticks on — stays seat-limited, but `this.frames` is what `menuFrame`
    // merges, so a pad sitting out a 1v1 can still move the pause menu it just
    // opened with START. Without this it could stop the game and then not
    // choose anything in the menu, which is worse than not being able to pause.
    for (let i = n; i < MAX_PLAYERS; i++) {
      const extra = emptyFrame();
      if (pads[i]) this._readPad(extra, pads[i]);
      this._finish(extra, this.prev[i]);
      this.prev[i] = extra;
      this.frames[i] = extra;
    }
    return { p1: frames[0], p2: frames[1], all: frames };
  }

  // legacy single-frame poll (menus that only care about P1)
  poll() { return this.pollAll('cpu').p1; }

  get frame() { return this.frames[0]; }   // latest P1 frame
  get frame2() { return this.frames[1]; }  // latest P2 frame
  frameFor(i) { return this.frames[i] || emptyFrame(); }

  // menus accept input from any seat
  get menuFrame() { return this.frames.reduce((a, f) => mergeMenu(a, f), this.frames[0]); }
}
