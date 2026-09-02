// SYNTH — the Web Audio voice every sound in the game is built from. One
// context, a master bus with a compressor and a short convolution-free
// reverb (feedback delay network), a ducking side-chain for the announcer.
export class Synth {
  constructor() {
    this.ctx = null; this.master = null; this.sfxBus = null; this.musicBus = null; this.voiceBus = null; this.noiseBuf = null;
    this.volumes = { master: 0.8, sfx: 0.9, music: 0.55, voice: 0.9 };
    const arm = () => { this.ensure(); removeEventListener('pointerdown', arm); removeEventListener('keydown', arm); };
    addEventListener('pointerdown', arm); addEventListener('keydown', arm);
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = this.volumes.master;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.volumes.sfx; this.sfxBus.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.volumes.music; this.musicBus.connect(this.master);
    this.voiceBus = c.createGain(); this.voiceBus.gain.value = this.volumes.voice; this.voiceBus.connect(this.master);
    // a small room: two feedback delays into the sfx bus
    this.verb = c.createGain(); this.verb.gain.value = 0.18;
    for (const [d, fb] of [[0.043, 0.35], [0.067, 0.3]]) { const dl = c.createDelay(0.2); dl.delayTime.value = d; const g = c.createGain(); g.gain.value = fb; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; this.verb.connect(dl); dl.connect(lp); lp.connect(g); g.connect(dl); g.connect(this.sfxBus); }
    const len = c.sampleRate * 1.5; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.duckT = 0;
    return true;
  }
  get now() { return this.ctx.currentTime; }
  setVolume(bus, v) { this.volumes[bus] = v; const g = { master: this.master, sfx: this.sfxBus, music: this.musicBus, voice: this.voiceBus }[bus]; if (g) g.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.05); }
  // announcer ducking: music and sfx dip under a line
  duck(amount = 0.45, seconds = 0.9) {
    if (!this.ctx) return; const t = this.now;
    for (const b of [this.musicBus, this.sfxBus]) { const base = b === this.musicBus ? this.volumes.music : this.volumes.sfx; b.gain.cancelScheduledValues(t); b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(base * (1 - amount), t + 0.05); b.gain.linearRampToValueAtTime(base, t + seconds); }
  }
  osc(type, freq, { to, dur = 0.2, gain = 0.3, a = 0.004, curve = 'exp', detune = 0, pan = 0, bus, when = 0, verb = 0 } = {}) {
    if (!this.ctx) return null; const t = this.now + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (to !== undefined) { if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur); else o.frequency.linearRampToValueAtTime(to, t + dur); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); this._out(g, pan, bus, verb); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  noise({ dur = 0.2, gain = 0.3, freq = 1200, q = 1, type = 'bandpass', slideTo, a = 0.002, pan = 0, bus, when = 0, verb = 0 } = {}) {
    if (!this.ctx) return; const t = this.now + when;
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur); f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + a); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); this._out(g, pan, bus, verb); src.start(t, Math.random() * 0.8); src.stop(t + dur + 0.05);
  }
  _out(g, pan, bus, verb) {
    let node = g;
    if (pan && this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
    node.connect(bus || this.sfxBus);
    if (verb) { const vg = this.ctx.createGain(); vg.gain.value = verb; node.connect(vg); vg.connect(this.verb); }
  }
  // a short sub thump — the body of every impact
  thump(gain = 0.5, f0 = 150, dur = 0.18, pan = 0) { this.osc('sine', f0, { to: 40, dur, gain, pan }); }
}
