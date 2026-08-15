// Fixed-timestep loop: 60Hz logic, interpolated rendering.
export const TICK = 1 / 60;

export class GameLoop {
  constructor(update, render) {
    this.update = update;   // (dt) fixed
    this.render = render;   // (alpha, frameDt)
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.timing = { logicMs: 0, frameMs: 0, fps: 60 };
    this._raf = this._raf.bind(this);
  }
  start() {
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._raf);
  }
  stop() { this.running = false; }
  _raf(now) {
    if (!this.running) return;
    requestAnimationFrame(this._raf);
    const frameDt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.acc += frameDt;
    const t0 = performance.now();
    let steps = 0;
    while (this.acc >= TICK && steps < 6) {
      this.update(TICK);
      this.acc -= TICK;
      steps++;
    }
    if (steps === 6) this.acc = 0; // spiral-of-death guard
    this.timing.logicMs = performance.now() - t0;
    this.timing.frameMs = frameDt * 1000;
    this.timing.fps = this.timing.fps * 0.95 + (1 / Math.max(1e-3, frameDt)) * 0.05;
    this.render(this.acc / TICK, frameDt);
  }
}
