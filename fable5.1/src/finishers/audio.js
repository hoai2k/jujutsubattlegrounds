// FINISHERS — SOUND DESIGN
// ===========================================================================
// Everything here is synthesised at runtime on the AudioContext the game's own
// Sfx already owns (audio/sfx.js), so a finisher shares its master bus, its
// compressor and its noise buffer, and there is not a single audio file in the
// feature. Impacts and whooshes are composed from oscillators and filtered
// noise exactly as the rest of the game's audio is.
//
// THE MUSICAL STINGS ARE ORIGINAL AND GENERATED. A sting is a root frequency
// and a set of SEMITONE OFFSETS, stacked and struck — there is no melody
// quoted from anywhere, no sample, and no voice. The five chord shapes below
// are intervals, not tunes: a tritone stack reads as menace, a stacked fifth
// as ceremony, a cluster as wrongness. Which shape a finisher uses is part of
// its character (registry.js), which is how twenty finishers built from one
// synth end up sounding like twenty different moments.
//
// This module never adds a method to audio/sfx.js — it reaches for the shared
// context and builds its own graph, so the feature stays in its own directory.
// ===========================================================================

// Interval stacks, in semitones from the root.
export const CHORDS = {
  brutal: [0, 6, 12, 18],       // stacked tritones — Sukuna, Mahoraga
  regal: [0, 7, 12, 19],        // open fifths — Gojo, Geto
  cold: [0, 5, 10, 17],         // stacked fourths — Nanami, Toji
  joy: [0, 4, 7, 12],           // the only consonant one — Todo, Hakari
  grim: [0, 3, 10, 15],         // minor with a seventh — Choso, Higuruma
  wrong: [0, 1, 6, 13],         // a semitone cluster — Mahito, Kurourushi
  bright: [0, 4, 11, 16]        // major seventh — Yuji, Nobara, Panda
};

const semi = n => Math.pow(2, n / 12);

export class FinisherAudio {
  constructor(sfx) {
    this.sfx = sfx;
    sfx?.ensure?.();
    this.ctx = sfx?.ctx || null;
    this.out = sfx?.master || null;
    this.nodes = [];        // anything sustained, so teardown can stop it
  }

  get ok() { return !!(this.ctx && this.out); }
  _now() { return this.ctx.currentTime; }

  _tone(type, freq, { to, dur = 0.4, gain = 0.2, a = 0.006, delay = 0, detune = 0 } = {}) {
    if (!this.ok) return;
    const t = this._now() + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.detune.value = detune;
    o.frequency.setValueAtTime(freq, t);
    if (to !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.out);
    o.start(t); o.stop(t + dur + 0.05);
  }

  _noise({ dur = 0.3, gain = 0.2, freq = 1200, q = 1, type = 'bandpass', slideTo, delay = 0, a = 0.003 } = {}) {
    if (!this.ok || !this.sfx.noiseBuf) return;
    const t = this._now() + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.sfx.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); g.connect(this.out);
    src.start(t, Math.random() * 0.4); src.stop(t + dur + 0.05);
  }

  // ---- the sequence -------------------------------------------------------

  // THE OPEN. A sub drop and a rising filtered swell under the black dip, so
  // the cinematic announces itself before a single frame of it is visible.
  open(root = 110) {
    this._tone('sine', root * 1.5, { to: root * 0.5, dur: 1.1, gain: 0.3 });
    this._noise({ dur: 0.85, gain: 0.13, freq: 200, slideTo: 3000, q: 0.7 });
    this._tone('triangle', root * 4, { to: root * 6, dur: 0.5, gain: 0.05, delay: 0.18 });
  }

  // A SUSTAINED BED for the length of the shot. Two detuned saws an octave
  // apart through a low-pass — it sits under everything and it is the thing
  // whose absence makes the final silence land.
  bed(root = 55, gain = 0.075) {
    if (!this.ok) return;
    const t = this._now();
    const g = this.ctx.createGain();
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(240, t);
    f.frequency.linearRampToValueAtTime(760, t + 5.2);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.9);
    const oscs = [];
    for (const [mult, det] of [[1, -7], [1, 8], [2, 4], [0.5, 0]]) {
      const o = this.ctx.createOscillator();
      o.type = mult === 0.5 ? 'sine' : 'sawtooth';
      o.frequency.value = root * mult;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      oscs.push(o);
    }
    f.connect(g); g.connect(this.out);
    this.nodes.push({ oscs, g });
    return { oscs, g };
  }

  // Fade the bed out over `dur` and stop the oscillators after it.
  stopBed(dur = 0.6) {
    if (!this.ok) return;
    const t = this._now();
    for (const n of this.nodes) {
      try {
        n.g.gain.cancelScheduledValues(t);
        n.g.gain.setValueAtTime(n.g.gain.value, t);
        n.g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
        for (const o of n.oscs) o.stop(t + dur + 0.08);
      } catch (e) { /* already stopped */ }
    }
    this.nodes.length = 0;
  }

  // A body being moved through air. Pitched by how big the swing is.
  whoosh(power = 1) {
    this._noise({ dur: 0.20 + 0.1 * power, gain: 0.10 + 0.06 * power, freq: 500, slideTo: 2400 * power, q: 0.7 });
  }

  // Contact. `power` 0..1.5 — a glancing blow through to the finish.
  hit(power = 1) {
    const p = Math.max(0.2, power);
    this._tone('sine', 180 * p, { to: 44, dur: 0.22 + 0.1 * p, gain: 0.30 * p });
    this._noise({ dur: 0.12 + 0.06 * p, gain: 0.24 * p, freq: 1600, slideTo: 320, q: 0.9 });
    if (p > 1) this._noise({ dur: 0.5, gain: 0.10, freq: 90, q: 0.6, type: 'lowpass', delay: 0.02 });
  }

  // THE KEY BEAT. The chord stab: every note struck at once, detuned in pairs,
  // with a sub under the root and a bright transient on top.
  sting(shape = 'brutal', root = 174.61, { gain = 0.16, dur = 2.4, spread = 0.012 } = {}) {
    const set = CHORDS[shape] || CHORDS.brutal;
    set.forEach((n, i) => {
      const f = root * semi(n);
      this._tone('sawtooth', f, { to: f * 0.995, dur: dur * (1 - i * 0.12), gain: gain * (1 - i * 0.14), a: 0.004, delay: i * spread, detune: -6 });
      this._tone('triangle', f * 2, { dur: dur * 0.5, gain: gain * 0.34 * (1 - i * 0.16), delay: i * spread, detune: 7 });
    });
    this._tone('sine', root * 0.5, { to: root * 0.25, dur: dur * 0.8, gain: 0.26 });
    this._noise({ dur: 0.24, gain: 0.14, freq: 3600, slideTo: 900, q: 0.8 });
  }

  // A single struck note for the small beats — a hair being brushed back, a
  // watch being checked, a finger being raised.
  accent(root = 880, { gain = 0.08, dur = 0.5 } = {}) {
    this._tone('triangle', root, { to: root * 1.5, dur, gain });
    this._tone('sine', root * 2, { dur: dur * 0.5, gain: gain * 0.5, delay: 0.01 });
  }

  // THE HANDOFF INTO THE WIN SCREEN. The bed drops away and one open interval
  // is left ringing, so the cut to the result is landed rather than arrived at.
  close(root = 110) {
    this.stopBed(0.5);
    for (const [n, d] of [[0, 0], [7, 0.05], [12, 0.09], [19, 0.14]]) {
      this._tone('triangle', root * semi(n), { dur: 2.6 - d * 2, gain: 0.09, delay: d });
    }
    this._tone('sine', root * 0.5, { dur: 2.2, gain: 0.14 });
  }

  dispose() { this.stopBed(0.15); }
}
