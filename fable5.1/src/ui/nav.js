// NAV — gamepad / keyboard focus navigation for any screen. A screen
// registers focusable elements in a grid (cols); the nav moves focus on
// d-pad / stick edges with repeat, confirms on A / Enter, cancels on B /
// Esc, and mirrors mouse hover so both devices agree on what is focused.
export class Nav {
  constructor(sfx, { cols = 1, wrap = true, onConfirm, onBack, onMove, onExtra } = {}) {
    this.sfx = sfx; this.items = []; this.cols = cols; this.wrap = wrap; this.index = 0;
    this.onConfirm = onConfirm; this.onBack = onBack; this.onMove = onMove; this.onExtra = onExtra;
    this.repeatT = 0; this.held = null; this.enabled = true; this.focusClass = 'focus';
  }
  set(items, cols = this.cols, keep = false) {
    this.items = items; this.cols = cols;
    if (!keep) this.index = 0; this.index = Math.min(this.index, Math.max(0, items.length - 1));
    items.forEach((el, i) => {
      el.classList.toggle(this.focusClass, i === this.index);
      el.onmouseenter = () => { if (this.enabled && this.index !== i) { this.index = i; this._apply(); } };
      el.onclick = (e) => { if (!this.enabled) return; this.index = i; this._apply(); this.onConfirm?.(this.items[i], i); e.stopPropagation(); };
    });
    this._apply();
  }
  focus(i) { this.index = Math.max(0, Math.min(this.items.length - 1, i)); this._apply(); }
  get current() { return this.items[this.index]; }
  _apply() { this.items.forEach((el, i) => el.classList.toggle(this.focusClass, i === this.index)); this.onMove?.(this.items[this.index], this.index); this.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }); }
  move(dx, dy) {
    if (!this.items.length) return;
    const n = this.items.length, cols = this.cols;
    let i = this.index;
    if (dx) { const row = Math.floor(i / cols), col = i % cols; let c = col + dx; const rowLen = Math.min(cols, n - row * cols); if (c < 0) c = this.wrap ? rowLen - 1 : 0; if (c >= rowLen) c = this.wrap ? 0 : rowLen - 1; i = row * cols + c; }
    if (dy) { let j = i + dy * cols; if (j < 0) j = this.wrap ? (i + Math.ceil(n / cols) * cols - cols + (n % cols ? (i % cols >= n % cols ? -cols : 0) : 0)) % n : i; if (j >= n) j = this.wrap ? i % cols : i; if (j < 0 || j >= n) j = i; i = j; }
    if (i !== this.index) { this.index = i; this._apply(); this.sfx?.uiMove(); }
  }
  update(dt, f) {
    if (!this.enabled || !f) return;
    const dir = f.leftP ? [-1, 0] : f.rightP ? [1, 0] : f.upP ? [0, -1] : f.downP ? [0, 1] : null;
    if (dir) { this.move(dir[0], dir[1]); this.held = f.left ? [-1, 0] : f.right ? [1, 0] : f.up ? [0, -1] : [0, 1]; this.repeatT = 0.42; }
    else if (f.left || f.right || f.up || f.down) { this.repeatT -= dt; if (this.repeatT <= 0 && this.held) { this.move(this.held[0], this.held[1]); this.repeatT = 0.11; } }
    else this.held = null;
    if (f.confirmP) { this.sfx?.uiConfirm(); this.onConfirm?.(this.current, this.index); }
    else if (f.backP) { this.sfx?.uiBack(); this.onBack?.(); }
    else if (f.heavyP || f.ct1P || f.ct2P || f.startP || f.selectP || f.tauntP) this.onExtra?.(f);
  }
}
export const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
