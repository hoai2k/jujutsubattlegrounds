// SFX — every sound effect, synthesized. Layered where the old game was
// single-voice: a hit is a noise crack + a sub thump + a tonal ring, panned by
// where it happened on screen. `pan` is -1..1.
import { Synth } from './synth.js';

export class Sfx extends Synth {
  constructor() { super(); this.reduced = false; }
  ok() { return this.ensure() && this.ctx; }
  // ---- impacts -------------------------------------------------------------
  hit(weight = 'light', pan = 0) {
    if (!this.ok()) return;
    const heavy = weight !== 'light';
    this.noise({ dur: heavy ? 0.16 : 0.09, gain: heavy ? 0.55 : 0.32, freq: heavy ? 900 : 1800, q: 0.7, slideTo: heavy ? 300 : 800, pan, verb: 0.3 });
    this.thump(heavy ? 0.6 : 0.3, heavy ? 120 : 190, heavy ? 0.22 : 0.11, pan);
    if (weight === 'knockdown') { this.noise({ dur: 0.35, gain: 0.4, freq: 200, type: 'lowpass', pan, when: 0.02 }); this.osc('triangle', 70, { to: 30, dur: 0.4, gain: 0.5, pan }); }
    if (weight === 'crit') { this.osc('square', 1800, { to: 300, dur: 0.14, gain: 0.18, pan }); this.osc('sine', 3200, { dur: 0.3, gain: 0.12, pan, verb: 0.5 }); }
    if (weight === 'launcher') this.osc('sawtooth', 220, { to: 640, dur: 0.18, gain: 0.14, pan });
  }
  guard(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.08, gain: 0.25, freq: 2600, q: 2, pan }); this.osc('triangle', 520, { to: 380, dur: 0.12, gain: 0.2, pan }); }
  guardBreak(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.3, gain: 0.5, freq: 1400, slideTo: 200, pan, verb: 0.4 }); this.osc('sawtooth', 300, { to: 60, dur: 0.4, gain: 0.35, pan }); this.osc('sine', 1600, { to: 200, dur: 0.3, gain: 0.2, pan }); }
  armor(pan = 0) { if (!this.ok()) return; this.osc('square', 140, { to: 90, dur: 0.14, gain: 0.25, pan }); this.noise({ dur: 0.06, gain: 0.2, freq: 600, pan }); }
  whiff(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.12, gain: 0.12, freq: 900, slideTo: 2400, q: 0.6, pan }); }
  swing(heavy = false, pan = 0) { if (!this.ok()) return; this.noise({ dur: heavy ? 0.2 : 0.11, gain: heavy ? 0.2 : 0.1, freq: heavy ? 500 : 1100, slideTo: heavy ? 1800 : 2600, q: 0.8, pan }); }
  land(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.1, gain: 0.18, freq: 300, type: 'lowpass', pan }); this.thump(0.2, 90, 0.12, pan); }
  step(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.05, gain: 0.05, freq: 500, type: 'lowpass', pan }); }
  dash(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.22, gain: 0.18, freq: 600, slideTo: 2200, q: 0.5, pan }); }
  jump(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.12, gain: 0.1, freq: 800, slideTo: 1600, pan }); }
  wallSlam(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.3, gain: 0.5, freq: 250, type: 'lowpass', pan, verb: 0.5 }); this.thump(0.7, 80, 0.35, pan); }
  // ---- techniques ------------------------------------------------------------
  cast(shape, color, pan = 0) {
    if (!this.ok()) return;
    const bright = ((color >> 16) & 255) + ((color >> 8) & 255) + (color & 255) > 480;
    this.osc('sine', bright ? 640 : 380, { to: bright ? 1400 : 220, dur: 0.22, gain: 0.16, pan, verb: 0.4 });
    this.noise({ dur: 0.25, gain: 0.14, freq: 1200, slideTo: 3200, q: 1.5, pan });
    if (shape === 'bolt') this.osc('square', 2400, { to: 600, dur: 0.1, gain: 0.1, pan });
    if (shape === 'crescent' || shape === 'slash') this.noise({ dur: 0.15, gain: 0.2, freq: 3000, slideTo: 800, q: 3, pan });
  }
  beam(color, pan = 0) { if (!this.ok()) return; this.osc('sawtooth', 90, { to: 60, dur: 0.6, gain: 0.3, pan }); this.osc('sine', 700, { to: 1900, dur: 0.5, gain: 0.14, pan, verb: 0.5 }); this.noise({ dur: 0.6, gain: 0.25, freq: 2000, slideTo: 600, q: 0.7, pan }); }
  powerUp(color, pan = 0) { if (!this.ok()) return; this.osc('sine', 260, { to: 1040, dur: 0.5, gain: 0.16, pan, verb: 0.5 }); this.osc('triangle', 130, { to: 520, dur: 0.5, gain: 0.1, pan, when: 0.04 }); this.noise({ dur: 0.5, gain: 0.08, freq: 3000, slideTo: 8000, pan }); }
  blink(pan = 0) { if (!this.ok()) return; this.osc('sine', 1800, { to: 300, dur: 0.16, gain: 0.16, pan }); this.noise({ dur: 0.12, gain: 0.12, freq: 4000, slideTo: 1000, pan }); }
  clap(pan = 0) { if (!this.ok()) return; this.noise({ dur: 0.08, gain: 0.5, freq: 1800, q: 0.6, pan, verb: 0.6 }); this.noise({ dur: 0.2, gain: 0.25, freq: 900, q: 0.8, pan, when: 0.02 }); }
  summon(pan = 0) { if (!this.ok()) return; this.osc('sawtooth', 110, { to: 55, dur: 0.5, gain: 0.2, pan }); this.osc('sine', 880, { to: 440, dur: 0.4, gain: 0.1, pan, verb: 0.5 }); }
  transform() { if (!this.ok()) return; this.osc('sawtooth', 60, { to: 30, dur: 1.2, gain: 0.35 }); this.osc('square', 220, { to: 880, dur: 0.6, gain: 0.12, verb: 0.6 }); this.noise({ dur: 1.0, gain: 0.3, freq: 400, slideTo: 4000, q: 0.6 }); }
  blackFlash() { if (!this.ok()) return; this.osc('square', 40, { to: 20, dur: 0.6, gain: 0.7 }); this.noise({ dur: 0.35, gain: 0.7, freq: 600, slideTo: 100, verb: 0.6 }); this.osc('sine', 2600, { to: 100, dur: 0.4, gain: 0.3 }); this.osc('sawtooth', 110, { to: 440, dur: 0.3, gain: 0.2, when: 0.05 }); }
  tick() { if (!this.ok()) return; this.osc('square', 1200, { dur: 0.04, gain: 0.08 }); }
  domainCast() { if (!this.ok()) return; this.osc('sine', 55, { dur: 1.6, gain: 0.5 }); this.osc('sine', 110, { to: 82, dur: 1.6, gain: 0.2 }); this.noise({ dur: 1.6, gain: 0.12, freq: 200, slideTo: 3000, q: 0.5, verb: 0.8 }); for (let i = 0; i < 5; i++) this.osc('triangle', 440 * Math.pow(2, i / 12 * 3), { dur: 0.4, gain: 0.08, when: i * 0.25, verb: 0.6 }); }
  domainOpen() { if (!this.ok()) return; this.noise({ dur: 1.2, gain: 0.6, freq: 100, type: 'lowpass', verb: 0.8 }); this.osc('sine', 30, { dur: 1.5, gain: 0.8 }); this.osc('sine', 1760, { to: 220, dur: 0.8, gain: 0.2, verb: 0.9 }); }
  domainBreak() { if (!this.ok()) return; this.noise({ dur: 0.8, gain: 0.5, freq: 3000, slideTo: 200, q: 0.5, verb: 0.7 }); this.osc('sawtooth', 200, { to: 40, dur: 0.8, gain: 0.3 }); for (let i = 0; i < 6; i++) this.osc('square', 1200 + i * 300, { dur: 0.06, gain: 0.06, when: i * 0.05 }); }
  // ---- UI ---------------------------------------------------------------------
  uiMove() { if (!this.ok()) return; this.osc('sine', 880, { to: 1100, dur: 0.05, gain: 0.08 }); }
  uiConfirm() { if (!this.ok()) return; this.osc('sine', 660, { to: 1320, dur: 0.12, gain: 0.14 }); this.noise({ dur: 0.1, gain: 0.08, freq: 3000, slideTo: 6000 }); }
  uiBack() { if (!this.ok()) return; this.osc('sine', 520, { to: 260, dur: 0.12, gain: 0.12 }); }
  uiLock() { if (!this.ok()) return; this.osc('square', 220, { to: 440, dur: 0.14, gain: 0.12 }); this.noise({ dur: 0.18, gain: 0.2, freq: 1200, slideTo: 300, verb: 0.4 }); this.thump(0.3, 120, 0.2); }
  uiSwoosh() { if (!this.ok()) return; this.noise({ dur: 0.3, gain: 0.14, freq: 400, slideTo: 3000, q: 0.6 }); }
  countdown(n) { if (!this.ok()) return; this.osc('square', n === 0 ? 880 : 440, { dur: n === 0 ? 0.4 : 0.12, gain: 0.14, verb: 0.4 }); }
  koStinger() { if (!this.ok()) return; this.osc('sawtooth', 55, { to: 27, dur: 2.2, gain: 0.5 }); this.osc('square', 440, { to: 110, dur: 1.4, gain: 0.12, verb: 0.9 }); this.noise({ dur: 1.4, gain: 0.35, freq: 800, slideTo: 100, verb: 0.9 }); for (let i = 0; i < 3; i++) this.osc('triangle', [330, 262, 196][i], { dur: 0.7, gain: 0.14, when: 0.4 + i * 0.35, verb: 0.7 }); }
  winStinger() { if (!this.ok()) return; for (let i = 0; i < 4; i++) this.osc('triangle', [392, 494, 587, 784][i], { dur: 0.6, gain: 0.14, when: i * 0.13, verb: 0.7 }); this.osc('sine', 98, { dur: 1.2, gain: 0.3 }); this.noise({ dur: 0.6, gain: 0.12, freq: 4000, slideTo: 8000 }); }
  roundStart() { if (!this.ok()) return; this.osc('square', 220, { to: 880, dur: 0.2, gain: 0.14 }); this.noise({ dur: 0.35, gain: 0.3, freq: 1000, slideTo: 6000, verb: 0.5 }); this.thump(0.5, 100, 0.3); }
  meterFull() { if (!this.ok()) return; this.osc('sine', 1046, { dur: 0.3, gain: 0.1, verb: 0.6 }); this.osc('sine', 1318, { dur: 0.3, gain: 0.08, when: 0.08, verb: 0.6 }); }
  taunt() { if (!this.ok()) return; this.osc('triangle', 330, { to: 660, dur: 0.2, gain: 0.08 }); }
  denied() { if (!this.ok()) return; this.osc('square', 200, { to: 150, dur: 0.1, gain: 0.08 }); }
}
