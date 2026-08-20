// Procedural SFX: everything synthesized with Web Audio at runtime.
// No audio files anywhere in the project.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.drone = null;
    this.wind = null;
    const arm = () => { this.ensure(); removeEventListener('pointerdown', arm); removeEventListener('keydown', arm); };
    addEventListener('pointerdown', arm);
    addEventListener('keydown', arm);
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    this.master.connect(comp);
    comp.connect(this.ctx.destination);
    // shared noise buffer
    const len = this.ctx.sampleRate * 1.2;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  _now() { return this.ctx.currentTime; }

  _osc(type, freq, { to, dur = 0.2, gain = 0.3, a = 0.004, curve = 'exp' } = {}) {
    if (!this.ctx) return;
    const t = this._now();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== undefined) {
      if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
      else o.frequency.linearRampToValueAtTime(to, t + dur);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  _noise({ dur = 0.2, gain = 0.3, freq = 1200, q = 1, type = 'bandpass', slideTo, a = 0.002 } = {}) {
    if (!this.ctx) return;
    const t = this._now();
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 1;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + a);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  // ---- combat -------------------------------------------------------------
  hit(heavy) {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(heavy ? 0.5 : 0.7, heavy ? 0.18 : 0.11);
    this._noise({ dur: heavy ? 0.22 : 0.12, gain: heavy ? 0.5 : 0.32, freq: heavy ? 700 : 1400, q: 0.8 });
    this._osc('sine', heavy ? 130 : 190, { to: 50, dur: heavy ? 0.2 : 0.1, gain: heavy ? 0.55 : 0.3 });
  }
  crit() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.42, 0.24);
    this._noise({ dur: 0.26, gain: 0.5, freq: 900, q: 1 });
    this._osc('square', 620, { to: 240, dur: 0.16, gain: 0.2 });
    this._osc('sine', 110, { to: 45, dur: 0.28, gain: 0.6 });
    this._osc('triangle', 1240, { to: 1180, dur: 0.3, gain: 0.12 });
  }
  whiff() { this.ensure(); this._noise({ dur: 0.12, gain: 0.12, freq: 900, slideTo: 300, q: 0.6 }); }
  guard() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 320, { to: 210, dur: 0.08, gain: 0.16 });
    this._noise({ dur: 0.08, gain: 0.2, freq: 2400, q: 2 });
  }
  guardBreak() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.5, gain: 0.5, freq: 2400, slideTo: 300, q: 0.7 });
    this._osc('sawtooth', 220, { to: 60, dur: 0.5, gain: 0.3 });
  }
  armor() { this.ensure(); this._osc('square', 140, { to: 100, dur: 0.14, gain: 0.25 }); }
  dash() { this.ensure(); this._noise({ dur: 0.22, gain: 0.16, freq: 600, slideTo: 2600, q: 0.5 }); }
  // the impulse at the front of a dash: shorter, harder and lower than the
  // dash it opens, so the two layer into one push-off rather than two whooshes
  dashBurst() { this.ensure(); this._noise({ dur: 0.13, gain: 0.22, freq: 320, slideTo: 1500, q: 1.1 }); }
  // WATER. `splash` is entering it — a body arriving, loud and low into bright.
  // `wade` is a step taken while already in it: the same shape, much quieter
  // and much shorter, so a fight in a river ticks rather than roars.
  splash(power = 1) {
    this.ensure();
    const p = Math.max(0.3, Math.min(1.6, power));
    this._noise({ dur: 0.16 + p * 0.12, gain: 0.10 + p * 0.09, freq: 900, slideTo: 320 + p * 260, q: 0.6 });
  }
  wade() { this.ensure(); this._noise({ dur: 0.10, gain: 0.055, freq: 1300, slideTo: 620, q: 0.8 }); }
  jump() { this.ensure(); this._noise({ dur: 0.14, gain: 0.1, freq: 500, slideTo: 1500, q: 0.6 }); }
  land() { this.ensure(); this._noise({ dur: 0.1, gain: 0.18, freq: 300, q: 0.5, type: 'lowpass' }); }

  // ---- techniques ---------------------------------------------------------
  red() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 700, { to: 90, dur: 0.4, gain: 0.34 });
    this._noise({ dur: 0.4, gain: 0.4, freq: 1500, slideTo: 250, q: 0.8 });
  }
  blue() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 220, { to: 880, dur: 0.5, gain: 0.22 });
    this._osc('sine', 226, { to: 892, dur: 0.5, gain: 0.18 });
    this._noise({ dur: 0.45, gain: 0.14, freq: 500, slideTo: 3200, q: 2 });
  }
  purple() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 90, { to: 42, dur: 1.1, gain: 0.5 });
    this._osc('sawtooth', 96, { to: 46, dur: 1.1, gain: 0.4 });
    this._noise({ dur: 1.0, gain: 0.5, freq: 3000, slideTo: 300, q: 0.5 });
    this._osc('triangle', 1600, { to: 200, dur: 0.9, gain: 0.16 });
  }
  rikaSwing() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.34, gain: 0.36, freq: 500, slideTo: 1800, q: 1.2 });
    this._osc('sine', 90, { to: 55, dur: 0.4, gain: 0.4 });
    this._osc('sine', 460, { to: 320, dur: 0.5, gain: 0.1 }); // ghostly wail undertone
  }
  lunge() { this.ensure(); this._noise({ dur: 0.2, gain: 0.24, freq: 700, slideTo: 2800, q: 0.8 }); }
  cleave(big = false) {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: big ? 0.3 : 0.18, gain: big ? 0.42 : 0.3, freq: 2600, slideTo: 500, q: 1 });
    if (big) this._osc('sine', 120, { to: 48, dur: 0.3, gain: 0.4 });
  }
  overtime() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 440, { to: 660, dur: 0.3, gain: 0.14 });
    this._osc('sine', 660, { to: 880, dur: 0.5, gain: 0.1 });
  }
  swordGrab() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.16, gain: 0.3, freq: 3400, q: 3 });
    this._osc('triangle', 1500, { to: 900, dur: 0.2, gain: 0.12 });
  }

  // ---- sword-domain payload -------------------------------------------------
  swordRain() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.7, gain: 0.24, freq: 2600, slideTo: 700, q: 0.6 });
    this._osc('triangle', 1200, { to: 500, dur: 0.55, gain: 0.1 });
  }
  swordSwing() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.18, gain: 0.26, freq: 900, slideTo: 3400, q: 1 });
  }
  swordShatter() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.3, gain: 0.32, freq: 4200, slideTo: 1200, q: 2 });
    this._osc('triangle', 1900, { to: 600, dur: 0.24, gain: 0.1 });
  }
  // roll reveal: each table entry carries its own pitch, so the cue alone
  // tells the player what they got
  techReveal(freq = 660) {
    this.ensure(); if (!this.ctx) return;
    this._osc('triangle', freq, { to: freq, dur: 0.12, gain: 0.18 });
    this._osc('triangle', freq * 1.5, { to: freq * 1.5, dur: 0.3, gain: 0.14, a: 0.06 });
    this._noise({ dur: 0.2, gain: 0.1, freq: freq * 3, q: 2 });
  }
  blackFlash() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.35, 0.5);
    this._osc('sawtooth', 60, { to: 24, dur: 0.8, gain: 0.6 });
    this._noise({ dur: 0.6, gain: 0.5, freq: 4600, slideTo: 200, q: 0.5 });
    this._osc('square', 1400, { to: 300, dur: 0.3, gain: 0.16 });
  }
  root() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 520, { to: 180, dur: 0.4, gain: 0.16 });
    this._noise({ dur: 0.5, gain: 0.12, freq: 800, slideTo: 300, q: 3 });
  }
  resonance() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 150, { to: 70, dur: 0.2, gain: 0.4 });
    this._noise({ dur: 0.1, gain: 0.2, freq: 2800, q: 4 });
  }
  clap() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.12, gain: 0.42, freq: 2000, q: 0.7 });
    this._osc('triangle', 900, { to: 900, dur: 0.08, gain: 0.12 });
  }
  shikigami() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 110, { to: 60, dur: 0.5, gain: 0.3 });
    this._noise({ dur: 0.4, gain: 0.2, freq: 500, slideTo: 1600, q: 1.5 });
  }
  slam() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.4, 0.26);
    this._osc('sine', 100, { to: 34, dur: 0.5, gain: 0.55 });
    this._noise({ dur: 0.3, gain: 0.3, freq: 400, q: 0.5, type: 'lowpass' });
  }

  // ---- jogo ---------------------------------------------------------------
  // =========================================================================
  // URO — SKY MANIPULATION
  // =========================================================================
  // ALL ORIGINAL AND ALL PROCEDURAL, and built to the brief's four rules:
  // DETUNED (every tone is a pair a few cents apart, so nothing sits cleanly
  // in tune), PITCH-BENDING (nothing holds a note), ARRIVING EARLY OR LATE
  // (the pre-echo below), and with a REVERSED-REVERB TAIL on the warps (a
  // swell that builds INTO the event instead of decaying out of it).
  //
  // The reversed tail is the interesting one and it is a real construction
  // rather than a filter: a band of noise whose gain ramps UP over its
  // duration and stops dead, scheduled to END on the frame the visual lands.
  // That is what a reversed reverb is, and it is why her techniques sound like
  // they are being un-played.
  _reverseTail(when = 0.28, gain = 0.16, freq = 2200) {
    this.ensure(); if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    const len = Math.floor(this.ctx.sampleRate * when);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      // the ramp UP is the whole trick — noise that swells into silence
      const k = i / len;
      d[i] = (Math.random() * 2 - 1) * k * k;
    }
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(t0);
    src.stop(t0 + when);
  }

  // A DETUNED PAIR. Two oscillators a few cents apart, both bending. Nothing
  // she does is ever in tune with itself.
  _detuned(f, { to = f, dur = 0.4, gain = 0.1, type = 'sine', cents = 17 } = {}) {
    const k = Math.pow(2, cents / 1200);
    this._osc(type, f, { to, dur, gain });
    this._osc(type, f * k, { to: to * k, dur: dur * 1.06, gain: gain * 0.8 });
  }

  // THIN ICE BREAKER. The break arrives BEFORE the swell finishes — the
  // reversed tail is scheduled first and the crack lands on top of it, which
  // is the "sounds that arrive slightly before or after the visual" note.
  thinIce() {
    this.ensure(); if (!this.ctx) return;
    this._reverseTail(0.22, 0.13, 3000);
    // the crack: a hard bright transient with almost no body
    this._noise({ dur: 0.09, gain: 0.30, freq: 5200, q: 3.4 });
    // ...and the sheet letting go, bending down
    setTimeout(() => {
      this._noise({ dur: 0.42, gain: 0.20, freq: 3600, slideTo: 900, q: 1.0 });
      this._detuned(880, { to: 300, dur: 0.40, gain: 0.10, type: 'triangle', cents: 23 });
    }, 55);
    // one late shard, deliberately out of step with the visual
    setTimeout(() => this._noise({ dur: 0.14, gain: 0.10, freq: 6400, q: 4.0 }), 260);
  }

  // SPACE WARP STRIKE. A fold: the pitch goes DOWN and then arrives UP, which
  // is a shape no other cue in the game has, plus a pre-echo of the impact 60
  // ms before the impact.
  warpFold() {
    this.ensure(); if (!this.ctx) return;
    this._reverseTail(0.30, 0.15, 1400);
    // the pre-echo — the hit, quietly, before it happens
    this._noise({ dur: 0.06, gain: 0.09, freq: 1800, q: 2.0 });
    setTimeout(() => {
      this._detuned(520, { to: 120, dur: 0.26, gain: 0.13, type: 'sawtooth', cents: 31 });
    }, 60);
    setTimeout(() => {
      this._detuned(160, { to: 940, dur: 0.22, gain: 0.15, type: 'triangle', cents: 19 });
      this._noise({ dur: 0.16, gain: 0.24, freq: 2400, slideTo: 5200, q: 1.4 });
    }, 190);
  }

  // SKY REFLECT going up: a thin held shimmer, detuned so it beats audibly.
  skyReflectUp() {
    this.ensure(); if (!this.ctx) return;
    this._detuned(1320, { to: 1180, dur: 0.42, gain: 0.07, type: 'sine', cents: 11 });
    this._noise({ dur: 0.20, gain: 0.07, freq: 6800, slideTo: 4200, q: 2.6 });
  }
  skyReflectDown() {
    this.ensure(); if (!this.ctx) return;
    this._detuned(880, { to: 660, dur: 0.18, gain: 0.05, type: 'sine', cents: 11 });
  }
  // ...and the moment it actually turns something around. The bend REVERSES:
  // the incoming sound is caught, inverted, and thrown back.
  skyReflect() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.07, gain: 0.26, freq: 4200, q: 3.0 });
    this._detuned(300, { to: 1500, dur: 0.24, gain: 0.16, type: 'triangle', cents: 27 });
    this._reverseTail(0.16, 0.12, 2600);
  }

  // The hover starting, and the moment the stamina runs out and she falls.
  hoverStart() {
    this.ensure(); if (!this.ctx) return;
    this._detuned(440, { to: 620, dur: 0.34, gain: 0.05, type: 'sine', cents: 9 });
  }
  hoverDrop() {
    this.ensure(); if (!this.ctx) return;
    // the sky letting go of her — a long detuned fall with no landing in it
    this._detuned(700, { to: 90, dur: 0.62, gain: 0.13, type: 'triangle', cents: 25 });
    this._noise({ dur: 0.5, gain: 0.10, freq: 1400, slideTo: 260, q: 0.8 });
  }

  // SKY COLLAPSE. The biggest thing she does, and it is built downward: three
  // detuned layers all bending toward the floor of the spectrum, over a
  // reversed swell long enough to be uncomfortable.
  skyCollapse() {
    this.ensure(); if (!this.ctx) return;
    this._reverseTail(0.62, 0.24, 900);
    setTimeout(() => {
      this._detuned(240, { to: 40, dur: 1.1, gain: 0.26, type: 'sawtooth', cents: 33 });
      this._detuned(1600, { to: 220, dur: 0.8, gain: 0.12, type: 'triangle', cents: 21 });
      this._noise({ dur: 1.0, gain: 0.26, freq: 4200, slideTo: 180, q: 0.6 });
    }, 580);
  }

  // =========================================================================
  // DAGON — THE SEA
  // =========================================================================
  // Also original and procedural. The family rule is that everything of his is
  // WET AND LOW: filtered noise with a long tail and almost no transient,
  // which is the opposite of Jogo's cracking fire and Kashimo's snap.
  volley() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.26, gain: 0.16, freq: 900, slideTo: 2400, q: 1.4 });
    this._osc('sine', 180, { to: 320, dur: 0.22, gain: 0.07 });
  }
  tidalSlam() {
    this.ensure(); if (!this.ctx) return;
    // the gather, then the surge — a long low swell with a wash over it
    this._osc('sine', 58, { to: 34, dur: 0.9, gain: 0.30 });
    this._noise({ dur: 0.85, gain: 0.26, freq: 260, slideTo: 1400, q: 0.7 });
    setTimeout(() => this._noise({ dur: 0.6, gain: 0.14, freq: 2600, slideTo: 700, q: 0.9 }), 220);
  }
  seaEmerge() {
    this.ensure(); if (!this.ctx) return;
    // something breaking the surface: a short gulp and a spread of water
    this._noise({ dur: 0.12, gain: 0.18, freq: 620, slideTo: 1800, q: 2.2 });
    this._noise({ dur: 0.34, gain: 0.11, freq: 3000, slideTo: 1200, q: 0.8 });
  }
  seaSpit() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.16, gain: 0.20, freq: 1600, slideTo: 4200, q: 2.6 });
  }
  seaDie() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.24, gain: 0.14, freq: 1800, slideTo: 400, q: 1.2 });
    this._osc('sine', 220, { to: 90, dur: 0.20, gain: 0.06 });
  }
  // THE SHARK ARRIVING. Deliberately the loudest thing in his set and the only
  // one with a real transient: the player has to know, without looking, that
  // the rare one just surfaced.
  sharkRise() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.5, gain: 0.30, freq: 420, slideTo: 2600, q: 0.9 });
    this._osc('sawtooth', 96, { to: 52, dur: 0.62, gain: 0.24 });
    setTimeout(() => this._osc('square', 140, { to: 60, dur: 0.18, gain: 0.14 }), 320);
  }

  ember() {
    // a hissing swarm taking wing: crackle + rising flutter
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.35, gain: 0.2, freq: 3200, slideTo: 5200, q: 1.2 });
    this._osc('sawtooth', 320, { to: 560, dur: 0.25, gain: 0.08 });
  }
  eruptPrime() {
    // the ground beginning to groan under the marker
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 70, { to: 46, dur: 0.6, gain: 0.3 });
    this._noise({ dur: 0.5, gain: 0.1, freq: 240, q: 1, type: 'lowpass' });
  }
  erupt() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 90, { to: 28, dur: 0.7, gain: 0.6 });
    this._noise({ dur: 0.55, gain: 0.4, freq: 900, slideTo: 160, q: 0.5 });
    this._noise({ dur: 0.3, gain: 0.2, freq: 4200, slideTo: 1200, q: 0.8 });
  }
  overheat() {
    // the crater venting wide open: roar + climbing whistle
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.9, gain: 0.3, freq: 500, slideTo: 2400, q: 0.6 });
    this._osc('sawtooth', 90, { to: 150, dur: 0.8, gain: 0.24 });
    this._osc('triangle', 900, { to: 1900, dur: 0.6, gain: 0.1, a: 0.1 });
  }

  // ---- choso --------------------------------------------------------------
  // Everything here is WET and LOW. The design rule: no bright metallic edge
  // anywhere, because that is Sukuna's language — his blood should sound like
  // liquid under pressure, not like a blade.
  bloodEdge() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.20, gain: 0.20, freq: 1100, slideTo: 2600, q: 1.4 });
    this._osc('sine', 260, { to: 150, dur: 0.16, gain: 0.14 });
  }
  bloodCharge() {
    // the load on Piercing Blood: pressure building with nowhere to go
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 60, { to: 130, dur: 0.46, gain: 0.28, a: 0.12 });
    this._noise({ dur: 0.44, gain: 0.10, freq: 220, slideTo: 700, q: 1.4, type: 'lowpass' });
  }
  piercingBlood() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.5, 0.3);
    this._noise({ dur: 0.45, gain: 0.42, freq: 300, slideTo: 3800, q: 0.7 });
    this._osc('sawtooth', 180, { to: 60, dur: 0.5, gain: 0.34 });
    this._osc('sine', 90, { to: 40, dur: 0.6, gain: 0.4 });
  }
  redScale() {
    // a heartbeat coming up to speed, then a hard thump
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 54, { to: 54, dur: 0.16, gain: 0.44 });
    this._osc('sine', 50, { to: 50, dur: 0.16, gain: 0.34, a: 0.30 });
    this._osc('sine', 46, { to: 46, dur: 0.20, gain: 0.5, a: 0.52 });
    this._noise({ dur: 0.7, gain: 0.14, freq: 180, slideTo: 520, q: 1.2, type: 'lowpass' });
  }
  supernovaCharge() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 70, { to: 190, dur: 0.85, gain: 0.24, a: 0.2 });
    this._noise({ dur: 0.8, gain: 0.12, freq: 300, slideTo: 1400, q: 1.6 });
  }
  supernova() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.6, 0.5);
    this._osc('sine', 110, { to: 24, dur: 0.9, gain: 0.65 });
    this._noise({ dur: 0.7, gain: 0.45, freq: 1600, slideTo: 180, q: 0.5 });
    this._noise({ dur: 0.35, gain: 0.22, freq: 5200, slideTo: 900, q: 0.7 });
  }

  // ---- nobara -------------------------------------------------------------
  // Everything here is DRY and HARD: iron, wood and a struck bell. No wetness
  // anywhere, which is what keeps her out of Choso's register entirely.
  nailThrow() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.13, gain: 0.16, freq: 3600, slideTo: 6000, q: 2.4 });
    this._osc('triangle', 1400, { to: 2100, dur: 0.09, gain: 0.07 });
  }
  nailStick() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 900, { to: 420, dur: 0.07, gain: 0.14 });
    this._noise({ dur: 0.09, gain: 0.14, freq: 2600, q: 3 });
  }
  nailBlast() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.24, gain: 0.34, freq: 2200, slideTo: 400, q: 0.6 });
    this._osc('square', 300, { to: 90, dur: 0.20, gain: 0.24 });
  }
  hammer(heavy = false) {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', heavy ? 150 : 220, { to: heavy ? 60 : 110, dur: heavy ? 0.22 : 0.13, gain: heavy ? 0.34 : 0.22 });
    this._noise({ dur: heavy ? 0.2 : 0.12, gain: 0.2, freq: 900, slideTo: 260, q: 0.8 });
  }
  // THE RESONANCE CUE. This is the counterplay's alarm bell, so it is the most
  // distinctive sound either character owns: a struck temple bell with a
  // detuned twin under it, held. `k` is 0..1 of how much Essence is going in,
  // which raises the pitch and the length — a big Resonance announces itself
  // as a bigger sound, and that is on purpose.
  resonanceCharge(k = 0.5) {
    this.ensure(); if (!this.ctx) return;
    const f = 320 + k * 180;
    const d = 0.5 + k * 0.5;
    this._osc('sine', f, { to: f * 0.94, dur: d, gain: 0.20 });
    this._osc('sine', f * 1.008, { to: f * 0.95, dur: d, gain: 0.16 });  // detuned beat
    this._osc('triangle', f * 2, { to: f * 1.9, dur: d * 0.6, gain: 0.07 });
    this._noise({ dur: d, gain: 0.06, freq: f * 3, q: 6 });
  }
  resonanceHit(k = 0.5) {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.4, 0.24 + k * 0.2);
    this._osc('square', 240 + k * 120, { to: 70, dur: 0.22 + k * 0.2, gain: 0.30 });
    this._noise({ dur: 0.22 + k * 0.24, gain: 0.28, freq: 3000, slideTo: 400, q: 0.8 });
    this._osc('sine', 90, { to: 34, dur: 0.4 + k * 0.3, gain: 0.34 });
  }
  fullRelease() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.7, 0.6);
    this._osc('sine', 520, { to: 500, dur: 1.3, gain: 0.24 });
    this._osc('sine', 524, { to: 503, dur: 1.3, gain: 0.20 });
    this._osc('square', 260, { to: 60, dur: 0.5, gain: 0.34 });
    this._noise({ dur: 0.6, gain: 0.36, freq: 4200, slideTo: 300, q: 0.6 });
    this._osc('sine', 80, { to: 26, dur: 1.0, gain: 0.5 });
  }

  // ---- mahito -------------------------------------------------------------
  soulTouch() {
    // a wet, wrong chord — the hand closing on a soul
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 440, { to: 410, dur: 0.3, gain: 0.14 });
    this._osc('sine', 466, { to: 452, dur: 0.34, gain: 0.12 }); // detuned beat
    this._noise({ dur: 0.2, gain: 0.14, freq: 1400, slideTo: 500, q: 2 });
  }
  bodyMorph(variant = 0) {
    // flesh reshaping: a stretched creak pitched per weapon
    this.ensure(); if (!this.ctx) return;
    const base = [220, 130, 330][variant % 3];
    this._osc('sawtooth', base, { to: base * 1.9, dur: 0.28, gain: 0.16 });
    this._noise({ dur: 0.3, gain: 0.16, freq: 700, slideTo: 2400, q: 2.5 });
  }
  summon() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 200, { to: 90, dur: 0.5, gain: 0.24 });
    this._osc('sawtooth', 500, { to: 260, dur: 0.4, gain: 0.08 });
    this._noise({ dur: 0.5, gain: 0.14, freq: 600, slideTo: 200, q: 1.2 });
  }
  minionDie() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 300, { to: 60, dur: 0.35, gain: 0.16 });
    this._noise({ dur: 0.3, gain: 0.14, freq: 900, slideTo: 300, q: 1 });
  }
  transfigure() {
    // the win condition landing: a detuned choir swell collapsing into a thud
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 392, { to: 370, dur: 1.4, gain: 0.18, a: 0.2 });
    this._osc('sine', 415, { to: 392, dur: 1.4, gain: 0.16, a: 0.2 });
    this._osc('sine', 311, { to: 300, dur: 1.6, gain: 0.14, a: 0.3 });
    this._noise({ dur: 1.2, gain: 0.1, freq: 2400, slideTo: 300, q: 0.7 });
    this._osc('sine', 90, { to: 30, dur: 1.2, gain: 0.4, a: 0.6 });
  }

  // ---- MEGUMI / the Ten Shadows -------------------------------------------
  // The family sound: a low shadow-swell with the creature's own voice on top,
  // so a summon is identifiable by ear before it has finished rising.
  shikigamiSummon(key) {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 130, { to: 52, dur: 0.55, gain: 0.30 });        // the shadow opening
    this._noise({ dur: 0.5, gain: 0.16, freq: 400, slideTo: 120, q: 0.9, type: 'lowpass' });
    const voice = {
      divineDogs: () => { this._osc('sawtooth', 620, { to: 240, dur: 0.28, gain: 0.14 }); this._noise({ dur: 0.2, gain: 0.14, freq: 1800, slideTo: 700, q: 1.4 }); },
      nue: () => { this._osc('square', 1150, { to: 500, dur: 0.34, gain: 0.10 }); this._noise({ dur: 0.3, gain: 0.12, freq: 3200, q: 2.4 }); },
      toad: () => { this._osc('square', 96, { to: 74, dur: 0.34, gain: 0.22 }); this._osc('sine', 190, { to: 130, dur: 0.28, gain: 0.12 }); },
      serpent: () => { this._noise({ dur: 0.7, gain: 0.20, freq: 5200, slideTo: 2400, q: 1.1 }); this._osc('sine', 74, { to: 44, dur: 0.7, gain: 0.24 }); },
      elephant: () => { this._osc('sawtooth', 210, { to: 96, dur: 0.9, gain: 0.30 }); this._osc('sine', 62, { to: 34, dur: 1.0, gain: 0.40 }); this._noise({ dur: 0.8, gain: 0.18, freq: 500, slideTo: 160, q: 0.8 }); },
      rabbits: () => { for (let i = 0; i < 5; i++) this._osc('triangle', 900 + i * 130, { to: 500, dur: 0.1, gain: 0.05 }); this._noise({ dur: 0.4, gain: 0.12, freq: 2200, q: 0.8 }); }
    }[key];
    voice?.();
  }
  shikigamiBite() { this.ensure(); this._noise({ dur: 0.12, gain: 0.24, freq: 2000, slideTo: 600, q: 1.6 }); }
  shikigamiDismiss() { this.ensure(); this._osc('sine', 180, { to: 60, dur: 0.35, gain: 0.14 }); }
  shikigamiLost() {
    // permanent loss deserves to sound like it: a descending two-tone that
    // does not resolve, plus the shadow closing over
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 330, { to: 150, dur: 0.7, gain: 0.20, a: 0.02 });
    this._osc('sine', 247, { to: 110, dur: 0.9, gain: 0.16, a: 0.08 });
    this._noise({ dur: 0.7, gain: 0.14, freq: 900, slideTo: 200, q: 0.8 });
  }
  nueDive() { this.ensure(); this._noise({ dur: 0.4, gain: 0.2, freq: 800, slideTo: 3400, q: 1.2 }); }
  nueShock() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.3, gain: 0.38, freq: 4200, q: 3.2 });
    this._osc('square', 1600, { to: 300, dur: 0.2, gain: 0.12 });
  }
  toadTongue() { this.ensure(); this._noise({ dur: 0.24, gain: 0.2, freq: 900, slideTo: 2600, q: 1.8 }); }
  toadGrab() { this.ensure(); this._osc('square', 150, { to: 90, dur: 0.2, gain: 0.24 }); }
  serpentRush() { this.ensure(); this._noise({ dur: 0.8, gain: 0.26, freq: 3000, slideTo: 900, q: 0.9 }); }
  serpentCoil() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 150, { to: 60, dur: 0.6, gain: 0.28 });
    this._noise({ dur: 0.5, gain: 0.22, freq: 600, slideTo: 200, q: 1 });
  }
  elephantRear() { this.ensure(); this._osc('sawtooth', 300, { to: 700, dur: 0.5, gain: 0.20 }); }
  elephantTorrent() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 1.3, gain: 0.5, freq: 900, slideTo: 300, q: 0.5, type: 'lowpass' });
    this._osc('sine', 70, { to: 34, dur: 1.1, gain: 0.42 });
  }
  wheelOpen() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 520, { to: 700, dur: 0.18, gain: 0.10 });
    this._noise({ dur: 0.3, gain: 0.08, freq: 1600, slideTo: 400, q: 1.5 });
  }
  shadowDive() { this.ensure(); this._noise({ dur: 0.4, gain: 0.2, freq: 1400, slideTo: 180, q: 0.9, type: 'lowpass' }); }
  shadowRise() { this.ensure(); this._noise({ dur: 0.3, gain: 0.22, freq: 260, slideTo: 2200, q: 0.9 }); }

  // ---- THE SUMMON RITUAL / MAHORAGA ---------------------------------------
  // The whole sequence is built from three ideas: a percussive wood-block hit
  // per hand sign (rising in pitch as the rhythm accelerates), a low drone
  // that climbs under the entire thing, and a bass event at each structural
  // beat. Everything is synthesized, like the rest of the game.
  ritualOpen() {
    // the air going out of the room
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 1.6, gain: 0.22, freq: 2600, slideTo: 120, q: 0.5 });
    this._osc('sine', 120, { to: 34, dur: 1.8, gain: 0.35 });
  }
  // i of n: a hard wooden strike, pitched up as the chain accelerates
  ritualSign(i, n) {
    this.ensure(); if (!this.ctx) return;
    const k = i / Math.max(1, n - 1);
    const f = 460 + k * 620;
    this._osc('square', f, { to: f * 0.42, dur: 0.075, gain: 0.30 });
    this._osc('triangle', f * 2.02, { to: f * 1.1, dur: 0.11, gain: 0.16 });
    this._noise({ dur: 0.07, gain: 0.26, freq: 3400 + k * 2600, q: 3.2 });
    // a bass thump under every second sign, hardening toward the end
    if (i % 2 === 1 || k > 0.7) this._osc('sine', 78 + k * 30, { to: 30, dur: 0.22, gain: 0.34 });
  }
  ritualFlash() {
    // the eighth sign lands: a full-spectrum crack and a sub drop
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.5, gain: 0.55, freq: 7000, slideTo: 260, q: 0.4 });
    this._osc('square', 1900, { to: 240, dur: 0.18, gain: 0.20 });
    this._osc('sine', 96, { to: 26, dur: 0.9, gain: 0.62 });
  }
  ritualCall() {
    // the incantation: two detuned voices opening a fifth apart
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 174, { to: 168, dur: 1.6, gain: 0.20, a: 0.25 });
    this._osc('sine', 261, { to: 252, dur: 1.6, gain: 0.16, a: 0.35 });
    this._noise({ dur: 1.2, gain: 0.12, freq: 700, slideTo: 200, q: 1.2 });
  }
  // The rising drone that runs under the whole ritual. It CLIMBS: the pitch
  // and the gain both ramp for eight seconds, which is what makes the silence
  // beat land when it is cut.
  startRitualDrone(level = 1) {
    this.stopRitualDrone();
    this.ensure(); if (!this.ctx) return;
    const t = this._now();
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05 * level, t + 0.6);
    g.gain.linearRampToValueAtTime(0.30 * level, t + 7.0);
    const oscs = [];
    for (const [base, type, mul] of [[27, 'sine', 1], [27.3, 'sine', 0.9], [54, 'triangle', 0.35], [81, 'sawtooth', 0.10]]) {
      const o = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(base, t);
      o.frequency.linearRampToValueAtTime(base * 1.34, t + 7.0);
      og.gain.value = mul;
      o.connect(og); og.connect(g);
      o.start();
      oscs.push(o);
    }
    g.connect(this.master);
    this.ritDrone = { oscs, g };
  }
  stopRitualDrone() {
    if (!this.ritDrone) return;
    const { oscs, g } = this.ritDrone;
    // cut, not fade: the silence beat has to be a silence
    g.gain.cancelScheduledValues(this._now());
    g.gain.setTargetAtTime(0, this._now(), 0.02);
    setTimeout(() => { for (const o of oscs) { try { o.stop(); } catch (e) { } } }, 220);
    this.ritDrone = null;
  }
  shadowGate() {
    // the floor opening: a downward sweep and a long inhale
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 210, { to: 24, dur: 1.4, gain: 0.55 });
    this._noise({ dur: 1.5, gain: 0.28, freq: 3000, slideTo: 90, q: 0.5, type: 'lowpass' });
    this._osc('sawtooth', 62, { to: 30, dur: 1.6, gain: 0.22 });
  }
  wheelRise() {
    // metal turning in the dark: a slow ringing double tone with a scrape
    this.ensure(); if (!this.ctx) return;
    this._osc('triangle', 880, { to: 660, dur: 1.6, gain: 0.14, a: 0.4 });
    this._osc('triangle', 1320, { to: 990, dur: 1.4, gain: 0.09, a: 0.5 });
    this._noise({ dur: 1.5, gain: 0.10, freq: 5200, slideTo: 1400, q: 4 });
  }
  mahoragaRise() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 46, { to: 70, dur: 1.3, gain: 0.34 });
    this._noise({ dur: 1.2, gain: 0.22, freq: 260, slideTo: 900, q: 0.8, type: 'lowpass' });
  }
  mahoragaImpact() {
    // the heaviest single event in the game
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 74, { to: 20, dur: 2.0, gain: 0.85 });
    this._osc('sine', 51, { to: 17, dur: 2.4, gain: 0.60 });
    this._noise({ dur: 1.1, gain: 0.55, freq: 700, slideTo: 90, q: 0.4, type: 'lowpass' });
    this._noise({ dur: 0.5, gain: 0.34, freq: 5200, slideTo: 900, q: 0.7 });
    this._osc('triangle', 1560, { to: 420, dur: 0.34, gain: 0.13 });
  }
  // the wheel turning for an adaptation, then locking
  adaptSpin() {
    this.ensure(); if (!this.ctx) return;
    this._osc('triangle', 620, { to: 1480, dur: 1.15, gain: 0.13, a: 0.06 });
    this._noise({ dur: 1.15, gain: 0.13, freq: 2200, slideTo: 6200, q: 3 });
  }
  adaptLock() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 300, { to: 120, dur: 0.16, gain: 0.26 });
    this._osc('sine', 88, { to: 30, dur: 0.7, gain: 0.55 });
    this._noise({ dur: 0.24, gain: 0.34, freq: 3800, slideTo: 700, q: 2.2 });
    this._osc('triangle', 1760, { to: 1700, dur: 0.55, gain: 0.12, a: 0.02 });
  }
  wheelSlash() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.44, gain: 0.40, freq: 700, slideTo: 3600, q: 1.1 });
    this._osc('sine', 108, { to: 44, dur: 0.45, gain: 0.42 });
    this._osc('triangle', 1240, { to: 520, dur: 0.3, gain: 0.10 });
  }
  worldCut() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.9, gain: 0.55, freq: 9000, slideTo: 300, q: 0.4 });
    this._osc('sawtooth', 130, { to: 28, dur: 1.1, gain: 0.55 });
    this._osc('sine', 65, { to: 20, dur: 1.4, gain: 0.5 });
    this._osc('triangle', 2400, { to: 300, dur: 0.5, gain: 0.14 });
  }
  mahoragaStep() {
    // every footfall registers — quiet enough to live under a walk cycle
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 68, { to: 26, dur: 0.34, gain: 0.34 });
    this._noise({ dur: 0.20, gain: 0.16, freq: 260, q: 0.5, type: 'lowpass' });
  }

  // ---- HAKARI / IDLE DEATH GAMBLE -----------------------------------------
  // The parlor language: everything here is bright, metallic and mechanical.
  // Real pachinko is a wall of cheap chiptune fanfares, ball bearings on
  // steel and escalating chimes, and the reach scenario is scored the way the
  // machines actually score one — a spinning tick bed, a tier sting, chimes
  // that climb, a drum roll, then either a flat two-note "no" or the loudest
  // sound in the game.
  shutterUp() {
    // corrugated steel hauled up its rails: a rattling upward scrape
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.42, gain: 0.26, freq: 380, slideTo: 2200, q: 1.6 });
    this._osc('square', 120, { to: 250, dur: 0.36, gain: 0.10 });
    this._osc('triangle', 900, { to: 1500, dur: 0.3, gain: 0.06, a: 0.12 });
  }
  shutterBreak() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.5, gain: 0.44, freq: 2600, slideTo: 260, q: 0.7 });
    this._osc('square', 320, { to: 70, dur: 0.34, gain: 0.22 });
    this._osc('sine', 96, { to: 34, dur: 0.5, gain: 0.4 });
  }
  ceSmash() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 110, { to: 36, dur: 0.55, gain: 0.6 });
    this._noise({ dur: 0.45, gain: 0.36, freq: 1400, slideTo: 220, q: 0.6 });
    this._osc('triangle', 720, { to: 200, dur: 0.3, gain: 0.12 });
  }
  rushBlow() { this.ensure(); this._noise({ dur: 0.2, gain: 0.24, freq: 800, slideTo: 3000, q: 0.9 }); }

  // one ball landing in the tray — called on a tick while the reels spin
  reelTick(k = 0) {
    if (!this.ctx) return;
    this._osc('square', 1500 + k * 260, { to: 1400 + k * 260, dur: 0.035, gain: 0.05 });
    this._noise({ dur: 0.03, gain: 0.06, freq: 5200, q: 5 });
  }
  // the tier reveal. Three distinct stings so the player knows what they got
  // before they have read a word of the HUD.
  reachTier(tier) {
    this.ensure(); if (!this.ctx) return;
    if (tier === 'weak') {
      this._osc('triangle', 660, { dur: 0.16, gain: 0.16 });
      this._osc('triangle', 880, { dur: 0.3, gain: 0.12, a: 0.05 });
      this._noise({ dur: 0.2, gain: 0.08, freq: 3000, q: 2 });
    } else if (tier === 'strong') {
      [784, 988, 1175].forEach((f, i) =>
        setTimeout(() => this._osc('square', f, { dur: 0.22, gain: 0.13 }), i * 70));
      this._noise({ dur: 0.5, gain: 0.16, freq: 1200, slideTo: 5200, q: 1.4 });
      this._osc('sine', 98, { to: 74, dur: 0.6, gain: 0.3 });
    } else {
      // 超激熱 — the whole cabinet screams
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        setTimeout(() => { this._osc('sawtooth', f, { dur: 0.26, gain: 0.13 }); this._osc('triangle', f * 2, { dur: 0.3, gain: 0.08 }); }, i * 60));
      this._noise({ dur: 0.9, gain: 0.24, freq: 900, slideTo: 7000, q: 1.1 });
      this._osc('sine', 74, { to: 46, dur: 1.1, gain: 0.45 });
      this._osc('sawtooth', 55, { to: 110, dur: 0.9, gain: 0.16 });
    }
  }
  // the chime ladder that runs through the scenario — `k` is 0..1 progress
  reachSwell(k, tier) {
    if (!this.ctx) return;
    const base = tier === 'super' ? 660 : tier === 'strong' ? 587 : 523;
    const f = base * Math.pow(2, Math.floor(k * 7) / 7);
    this._osc('triangle', f, { dur: 0.18, gain: 0.09 });
    this._osc('triangle', f * 2, { dur: 0.24, gain: 0.05, a: 0.04 });
  }
  // drum roll into the result
  reachRoll(k) {
    if (!this.ctx) return;
    this._noise({ dur: 0.05, gain: 0.06 + k * 0.14, freq: 1600, q: 0.8 });
    this._osc('sine', 90 + k * 40, { to: 60, dur: 0.06, gain: 0.10 + k * 0.16 });
  }
  reachFail() {
    // flat, deflating, and mercifully short — a miss is not a punishment
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 392, { dur: 0.14, gain: 0.14 });
    setTimeout(() => this._osc('square', 294, { dur: 0.34, gain: 0.14 }), 140);
    this._noise({ dur: 0.3, gain: 0.07, freq: 700, slideTo: 240, q: 1.2 });
  }
  // the guarantee arms: the parlor changes key under everything
  gambleArmed() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 58, { to: 116, dur: 1.6, gain: 0.26, a: 0.3 });
    [440, 554, 659, 880].forEach((f, i) =>
      setTimeout(() => this._osc('triangle', f, { dur: 0.5, gain: 0.10, a: 0.08 }), i * 120));
    this._noise({ dur: 1.4, gain: 0.12, freq: 400, slideTo: 3400, q: 1.2 });
  }
  // JACKPOT. The loudest single event in the game, and the only one allowed
  // to be pretty: a rising Bb major fanfare over a sub drop and a coin storm.
  jackpotFanfare() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 110, { to: 55, dur: 2.4, gain: 0.7 });
    this._noise({ dur: 1.4, gain: 0.4, freq: 800, slideTo: 8000, q: 0.7 });
    // Bb - D - F - Bb - D - F, hammered up the octave
    [233, 293, 349, 466, 587, 698].forEach((f, i) => setTimeout(() => {
      this._osc('sawtooth', f, { dur: 0.5, gain: 0.16 });
      this._osc('sawtooth', f * 1.006, { dur: 0.5, gain: 0.12 });
      this._osc('triangle', f * 2, { dur: 0.4, gain: 0.08 });
    }, i * 95));
    // the coin storm
    for (let i = 0; i < 26; i++) {
      setTimeout(() => this._osc('triangle', 1400 + Math.random() * 2200, { dur: 0.16, gain: 0.05 }), 400 + i * 45);
    }
  }
  jackpotBlast() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 140, { to: 40, dur: 0.9, gain: 0.5 });
    this._osc('sawtooth', 148, { to: 44, dur: 0.9, gain: 0.36 });
    this._noise({ dur: 0.8, gain: 0.42, freq: 6000, slideTo: 400, q: 0.5 });
    this._osc('triangle', 1760, { to: 440, dur: 0.4, gain: 0.13 });
  }
  rctHeal() {
    // the wound closing: a short upward chime, warm rather than sparkly
    if (!this.ctx) return;
    this._osc('sine', 440, { to: 880, dur: 0.28, gain: 0.10 });
    this._osc('sine', 660, { to: 1320, dur: 0.22, gain: 0.06, a: 0.05 });
  }
  counterAbsorb() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 300, { to: 90, dur: 0.3, gain: 0.3 });
    this._osc('triangle', 1200, { to: 1760, dur: 0.35, gain: 0.10, a: 0.04 });
    this._noise({ dur: 0.25, gain: 0.16, freq: 2400, q: 2.4 });
  }
  goldRush() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.55, gain: 0.3, freq: 500, slideTo: 4200, q: 0.7 });
    this._osc('sawtooth', 90, { to: 190, dur: 0.5, gain: 0.26 });
    this._osc('triangle', 1320, { to: 1980, dur: 0.4, gain: 0.08, a: 0.1 });
  }
  jackpotEnd() {
    // the comedown. One dead thud and then nothing — the silence is the cue.
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 70, { to: 26, dur: 0.9, gain: 0.4 });
    this._noise({ dur: 0.5, gain: 0.14, freq: 900, slideTo: 120, q: 0.8, type: 'lowpass' });
  }

  // ---- specials -----------------------------------------------------------
  warp() {
    // a soft displacement whoosh with no footstep on the far end
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.28, gain: 0.22, freq: 2600, slideTo: 500, q: 0.8 });
    this._osc('sine', 700, { to: 260, dur: 0.24, gain: 0.08 });
  }
  ratioSuccess(level = 2) {
    this.ensure(); if (!this.ctx) return;
    this._osc('triangle', 660, { to: 660, dur: 0.1, gain: 0.14 });
    if (level === 2) this._osc('triangle', 990, { to: 990, dur: 0.28, gain: 0.16, a: 0.05 });
  }
  ratioChime() {
    // the 7:3 impact: a hard metallic chime over a slam undertone
    this.ensure(); if (!this.ctx) return;
    this._osc('triangle', 1560, { to: 1490, dur: 0.5, gain: 0.2 });
    this._osc('triangle', 2340, { to: 2280, dur: 0.35, gain: 0.1 });
    this._osc('sine', 120, { to: 42, dur: 0.4, gain: 0.5 });
    this._noise({ dur: 0.25, gain: 0.3, freq: 3400, slideTo: 900, q: 1.4 });
  }

  // ---- yuji -------------------------------------------------------------------
  bfTell() { this.ensure(); this._osc('triangle', 1800, { to: 1800, dur: 0.05, gain: 0.08 }); }
  resolve() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 180, { to: 320, dur: 0.25, gain: 0.25 });
    this._noise({ dur: 0.15, gain: 0.14, freq: 900, q: 1.5 });
  }
  sukuna() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 72, { to: 38, dur: 1.2, gain: 0.45 });
    this._osc('sawtooth', 108, { to: 57, dur: 1.2, gain: 0.3 });
    this._noise({ dur: 1.0, gain: 0.3, freq: 2400, slideTo: 300, q: 0.7 });
    this._osc('triangle', 660, { to: 220, dur: 0.8, gain: 0.1 });
  }

  // ---- sukuna ---------------------------------------------------------------
  // DISMANTLE: two fast crossing cuts, the second a beat behind the first, on
  // a dry sheared-metal noise rather than a swing.
  dismantle() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.18, gain: 0.32, freq: 5200, slideTo: 900, q: 2.2 });
    this._noise({ dur: 0.16, gain: 0.26, freq: 4200, slideTo: 700, q: 2.6, a: 0.045 });
    this._osc('sawtooth', 900, { to: 180, dur: 0.24, gain: 0.10 });
  }
  // CLEAVE: `depth` 0..1 from the target's MAX_CE. The deeper it reads, the
  // lower and longer the body of the sound — the audio carries the scaling
  // alongside the damage number.
  cleaveCut(depth = 0.5) {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.22 + depth * 0.2, gain: 0.34, freq: 4600, slideTo: 400 - depth * 260, q: 1.8 });
    this._osc('sawtooth', 520 - depth * 180, { to: 90 - depth * 40, dur: 0.34 + depth * 0.3, gain: 0.16 + depth * 0.14 });
    if (depth > 0.6) this._osc('sine', 44, { to: 26, dur: 0.6, gain: 0.5 });
  }
  fireCharge() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 1.3, gain: 0.20, freq: 300, slideTo: 2600, q: 0.7 });
    this._osc('sawtooth', 90, { to: 420, dur: 1.3, gain: 0.14 });
  }
  fireCancel() { this.ensure(); this._noise({ dur: 0.3, gain: 0.18, freq: 2200, slideTo: 200, q: 0.8 }); }
  fireArrow() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 60, { to: 34, dur: 1.5, gain: 0.75 });
    this._noise({ dur: 1.2, gain: 0.5, freq: 900, slideTo: 4200, q: 0.5 });
    this._noise({ dur: 1.6, gain: 0.30, freq: 260, slideTo: 90, q: 0.5, type: 'lowpass' });
    this._osc('sawtooth', 300, { to: 60, dur: 0.9, gain: 0.18 });
  }
  // CONSUME A FINGER: a wet crack, then the low swell of it taking.
  fingerBite(stacks = 1) {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.09, gain: 0.34, freq: 1800, q: 3.4 });
    this._osc('square', 150, { to: 70, dur: 0.16, gain: 0.20 });
    this._osc('sine', 58 - stacks * 4, { to: 30, dur: 1.1, gain: 0.5, a: 0.18 });
    this._noise({ dur: 0.9, gain: 0.16, freq: 200, slideTo: 1400, q: 0.6, a: 0.2 });
  }
  shrineSlash() {
    if (!this.ctx || Math.random() > 0.55) return;   // sparse: it is constant
    this._noise({ dur: 0.11, gain: 0.13, freq: 4600, slideTo: 1200, q: 2.8 });
  }

  // ---- domains ------------------------------------------------------------
  domainCast(id) {
    this.ensure(); if (!this.ctx) return;
    // URO — the cast RISES instead of falling. Every other domain in the game
    // descends on you; hers opens above you, so the two sweeps invert and a
    // reversed tail arrives BEFORE the barrier does. Same trick her warps use.
    if (id === 'uro') {
      this._osc('sine', 42, { to: 128, dur: 1.7, gain: 0.5 });
      this._detuned(196, { to: 392, dur: 1.5, gain: 0.10, type: 'triangle', cents: 21 });
      this._noise({ dur: 1.5, gain: 0.16, freq: 90, slideTo: 2600, q: 0.6, type: 'bandpass' });
      this._reverseTail(1.1, 0.20);
      return;
    }
    this._osc('sine', 55, { to: 30, dur: 1.6, gain: 0.6 });
    this._osc('triangle', 220, { to: 110, dur: 1.4, gain: 0.14 });
    this._osc('triangle', 227, { to: 113, dur: 1.4, gain: 0.12 });
    this._noise({ dur: 1.5, gain: 0.2, freq: 200, slideTo: 60, q: 0.5, type: 'lowpass' });
  }
  domainActivate(env) {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.8, gain: 0.4, freq: 4000, slideTo: 200, q: 0.4 });
    this._osc('sine', 40, { to: 28, dur: 1.4, gain: 0.7 });
    // the shrine sits lowest of all of them — it is the biggest thing in the game.
    // URO'S FIRMAMENT SITS HIGHEST, and is the only one above the others: it is
    // an open sky rather than a weight overhead, and a 52 Hz rumble under it
    // would say "underground" when the whole interior says the opposite.
    this.startDrone(env === 'void' ? 36 : env === 'shrine' ? 30 : env === 'firmament' ? 96 : 52);
  }
  startDrone(freq = 36) {
    this.stopDrone();
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const o2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 1.007;
    g.gain.value = 0.0;
    g.gain.linearRampToValueAtTime(0.22, this._now() + 1.2);
    o.connect(g); o2.connect(g); g.connect(this.master);
    o.start(); o2.start();
    this.drone = { o, o2, g };
  }
  stopDrone() {
    if (!this.drone) return;
    const { o, o2, g } = this.drone;
    g.gain.linearRampToValueAtTime(0, this._now() + 0.6);
    setTimeout(() => { try { o.stop(); o2.stop(); } catch (e) { } }, 800);
    this.drone = null;
  }
  domainEnd(broken) {
    this.stopDrone();
    this.ensure(); if (!this.ctx) return;
    if (broken) {
      this._noise({ dur: 0.7, gain: 0.5, freq: 3600, slideTo: 300, q: 0.6 });
      this._osc('square', 300, { to: 60, dur: 0.5, gain: 0.2 });
    } else {
      this._noise({ dur: 0.9, gain: 0.25, freq: 300, slideTo: 2400, q: 0.6 });
    }
  }
  domainFail() { this.ensure(); this._osc('sawtooth', 200, { to: 60, dur: 0.5, gain: 0.3 }); }
  clash() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 120, { to: 30, dur: 1.2, gain: 0.55 });
    this._noise({ dur: 1.1, gain: 0.5, freq: 5000, slideTo: 200, q: 0.4 });
    this._osc('triangle', 880, { to: 220, dur: 0.9, gain: 0.14 });
  }
  barrierChip() {
    if (!this.ctx || Math.random() > 0.2) return;
    this._noise({ dur: 0.1, gain: 0.14, freq: 3000, q: 3 });
  }
  simpleDomain() { this.ensure(); this._osc('sine', 700, { to: 1020, dur: 0.3, gain: 0.12 }); }

  // ---- flow ---------------------------------------------------------------
  ready() { this.ensure(); this._osc('triangle', 440, { to: 440, dur: 0.25, gain: 0.16 }); }
  fight() {
    this.ensure(); if (!this.ctx) return;
    this._osc('triangle', 520, { to: 520, dur: 0.14, gain: 0.2 });
    this._osc('triangle', 780, { to: 780, dur: 0.4, gain: 0.2 });
    this._noise({ dur: 0.3, gain: 0.2, freq: 1400, q: 1 });
  }
  ko() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 90, { to: 30, dur: 1.4, gain: 0.7 });
    this._noise({ dur: 1.2, gain: 0.5, freq: 2000, slideTo: 100, q: 0.5 });
  }
  victory() {
    this.ensure(); if (!this.ctx) return;
    const notes = [392, 494, 587, 784];
    notes.forEach((n, i) => setTimeout(() => this._osc('triangle', n, { dur: 0.5, gain: 0.16 }), i * 130));
  }
  uiMove() { this.ensure(); this._osc('square', 700, { to: 700, dur: 0.05, gain: 0.07 }); }
  uiOk() { this.ensure(); this._osc('square', 620, { to: 940, dur: 0.12, gain: 0.1 }); }
  uiBack() { this.ensure(); this._osc('square', 500, { to: 320, dur: 0.1, gain: 0.08 }); }
  copied() { this.ensure(); this._osc('sine', 500, { to: 1000, dur: 0.3, gain: 0.14 }); }
  noCE() { this.ensure(); this._osc('square', 220, { to: 180, dur: 0.09, gain: 0.08 }); }

  // ---- NAOYA: PROJECTION SORCERY ------------------------------------------
  // "A hard mechanical click on trigger." Deliberately the DRIEST sound in the
  // bank: a 20 ms square with no slide and no tail. Everything else in this
  // file bends its pitch across its duration; this one does not move at all,
  // because the character does not either.
  freezeClick() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 1180, { to: 1180, dur: 0.02, gain: 0.30 });
    this._noise({ dur: 0.05, gain: 0.22, freq: 4200, q: 9 });
  }
  // one per 1/24 s while a freeze holds — tiny, so twenty-four of them read as
  // a ticking clock rather than as a drone
  freezeTick() { this.ensure(); this._osc('square', 2100, { to: 2100, dur: 0.012, gain: 0.045 }); }
  freezeRelease() { this.ensure(); this._osc('square', 700, { to: 1240, dur: 0.09, gain: 0.12 }); }
  stanceArm() { this.ensure(); this._osc('square', 880, { to: 880, dur: 0.05, gain: 0.13 }); }
  projectionStep() { this.ensure(); this._osc('square', 1500, { to: 1500, dur: 0.014, gain: 0.09 }); }

  // ---- PANDA --------------------------------------------------------------
  // The family is WOODEN AND LOW — a struck body rather than a struck surface —
  // which is what separates it from Todo's clap (a sharp air transient) and
  // from Gorilla's own drumming, which is the same wood hit twice, hard.
  coreSwap() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 220, { to: 330, dur: 0.18, gain: 0.18 });
    this._noise({ dur: 0.14, gain: 0.12, freq: 1200, slideTo: 2600, q: 1.4 });
  }
  coreBreak() {
    this.ensure(); if (!this.ctx) return;
    // a crack, a drop, and a long hollow tail. It has to sound like a loss.
    this._noise({ dur: 0.08, gain: 0.34, freq: 3200, q: 2.6 });
    this._osc('sawtooth', 180, { to: 46, dur: 0.55, gain: 0.28 });
    setTimeout(() => this._osc('sine', 92, { to: 58, dur: 0.9, gain: 0.14 }), 120);
  }
  drummingBeat() {
    this.ensure(); if (!this.ctx) return;
    // TWO hits, because the animation has two and the audio must agree
    const hit = (g) => {
      this._osc('sine', 128, { to: 62, dur: 0.20, gain: g });
      this._noise({ dur: 0.09, gain: g * 0.55, freq: 700, q: 1.8 });
    };
    hit(0.26);
    setTimeout(() => hit(0.32), 115);
  }
  pandaPalm() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 200, { to: 96, dur: 0.20, gain: 0.20 });
    this._noise({ dur: 0.16, gain: 0.14, freq: 1800, slideTo: 500, q: 1.2 });
  }
  pandaRoll() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.32, gain: 0.16, freq: 500, slideTo: 1600, q: 0.8 });
  }
  goreCharge() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 90, { to: 190, dur: 0.42, gain: 0.20 });
    this._noise({ dur: 0.40, gain: 0.14, freq: 900, slideTo: 2200, q: 1.0 });
  }
  crestRoll() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.18, gain: 0.14, freq: 2400, slideTo: 5200, q: 1.2 });
  }
  allCores(n = 3) {
    this.ensure(); if (!this.ctx) return;
    // one tone per SURVIVING core, stacked into a chord — so a Panda down to
    // one core audibly gets less, which is the whole scaling rule in a sound
    [147, 185, 220].slice(0, Math.max(1, n)).forEach((f, i) =>
      setTimeout(() => this._osc('triangle', f, { to: f * 2, dur: 0.9, gain: 0.16 }), i * 90));
    this._noise({ dur: 0.9, gain: 0.12, freq: 600, slideTo: 4000, q: 0.7 });
  }

  // ---- KASHIMO -----------------------------------------------------------
  // The whole family is BRIGHT NOISE with a very short pitched transient on
  // top, which is what separates it from Jogo's fire (low noise, long tail)
  // and from Gojo's tonal beams. Every one of them takes the CHARGE TIER, so
  // the audio reports his state as loudly as the model does — a tier-0 bolt is
  // a dry tick and a tier-3 bolt is a crack.
  lightningBolt(tier = 0) {
    this.ensure(); if (!this.ctx) return;
    const t = Math.max(0, Math.min(3, tier));
    this._osc('square', 1800 + t * 380, { to: 900, dur: 0.035 + t * 0.012, gain: 0.10 + t * 0.045 });
    this._noise({ dur: 0.10 + t * 0.05, gain: 0.08 + t * 0.05, freq: 7000 - t * 900, slideTo: 2400, q: 1.6 });
  }
  discharge(tier = 0) {
    this.ensure(); if (!this.ctx) return;
    const t = Math.max(0, Math.min(3, tier));
    // the crack, then the body of the burst under it
    this._noise({ dur: 0.05, gain: 0.30, freq: 8200, q: 3.0 });
    this._osc('sawtooth', 240 + t * 40, { to: 70, dur: 0.22 + t * 0.05, gain: 0.24 + t * 0.05 });
    this._noise({ dur: 0.26 + t * 0.08, gain: 0.16 + t * 0.04, freq: 3600, slideTo: 700, q: 1.2 });
  }
  chargeTier(tier = 1) {
    this.ensure(); if (!this.ctx) return;
    // one rising blip per tier crossed, brighter each time. Deliberately quiet:
    // it is a status change, not an event.
    const f = [0, 620, 880, 1320][Math.max(0, Math.min(3, tier))];
    this._osc('square', f * 0.7, { to: f, dur: 0.10, gain: 0.06 + tier * 0.02 });
  }
  arcDash() {
    this.ensure(); if (!this.ctx) return;
    // a rising zip and nothing else — the pass is over before a tail could be
    this._osc('square', 700, { to: 2600, dur: 0.055, gain: 0.16 });
    this._noise({ dur: 0.09, gain: 0.13, freq: 3000, slideTo: 8000, q: 1.0 });
  }
  amber() {
    this.ensure(); if (!this.ctx) return;
    // the limiter coming off: a hard strike, then a rising tone that does not
    // resolve, held under a long bright hiss
    this._noise({ dur: 0.06, gain: 0.34, freq: 9000, q: 2.4 });
    this._osc('sawtooth', 110, { to: 660, dur: 0.95, gain: 0.22 });
    setTimeout(() => this._noise({ dur: 1.1, gain: 0.14, freq: 4000, slideTo: 9000, q: 0.6 }), 120);
    setTimeout(() => this._osc('square', 1320, { dur: 0.7, gain: 0.07 }), 620);
  }
  projectionRush() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 1300, { to: 1300, dur: 0.03, gain: 0.16 });
    this._noise({ dur: 0.12, gain: 0.10, freq: 3400, q: 6 });
  }
  frameKick() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 520, { to: 180, dur: 0.16, gain: 0.28 });
    this._noise({ dur: 0.16, gain: 0.24, freq: 1600, slideTo: 400, q: 3 });
  }
  maxProjection() {
    this.ensure(); if (!this.ctx) return;
    this._osc('square', 620, { to: 1560, dur: 0.24, gain: 0.22 });
    this._noise({ dur: 0.3, gain: 0.16, freq: 2600, slideTo: 5200, q: 5 });
  }

  // ---- GETO: CURSED SPIRIT MANIPULATION -----------------------------------
  // The family sound is LOW and WET, so three summon systems on one field stay
  // tellable apart by ear: Megumi's shikigami arrive on a dry shadow snap,
  // Mahito's minion on a wet tear, and these on a descending swallow.
  curseSummon(key) {
    this.ensure(); if (!this.ctx) return;
    const big = ['jogo', 'hanami', 'mahito', 'kurourushi'].includes(key);
    this._osc('sawtooth', big ? 190 : 320, { to: big ? 60 : 130, dur: big ? 0.5 : 0.24, gain: big ? 0.30 : 0.16 });
    this._noise({ dur: big ? 0.55 : 0.26, gain: big ? 0.20 : 0.12, freq: 700, slideTo: 220, q: 2 });
  }
  curseAttack() { this.ensure(); this._osc('sawtooth', 300, { to: 160, dur: 0.10, gain: 0.11 }); }
  // an IMPLOSION rather than a burst — the recall has to sound like the
  // opposite of a summon or the two outcomes blur together
  curseRecall() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 140, { to: 620, dur: 0.28, gain: 0.20 });
    this._noise({ dur: 0.3, gain: 0.12, freq: 300, slideTo: 1800, q: 3 });
  }
  curseLost() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 260, { to: 50, dur: 0.55, gain: 0.26 });
    this._noise({ dur: 0.6, gain: 0.18, freq: 900, slideTo: 160, q: 2 });
  }
  uzumaki() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 90, { to: 44, dur: 1.1, gain: 0.42 });
    this._osc('square', 320, { to: 1400, dur: 0.6, gain: 0.22 });
    this._noise({ dur: 1.2, gain: 0.30, freq: 400, slideTo: 3000, q: 2 });
  }

  startWind() {
    if (!this.ctx || this.wind) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 300; f.Q.value = 0.4;
    const g = this.ctx.createGain();
    g.gain.value = 0.05;
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.frequency.value = 0.13;
    lfoG.gain.value = 90;
    lfo.connect(lfoG); lfoG.connect(f.frequency);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(); lfo.start();
    this.wind = { src, lfo, g };
  }
  stopWind() {
    if (!this.wind) return;
    try { this.wind.src.stop(); this.wind.lfo.stop(); } catch (e) { }
    this.wind = null;
  }

  // ==== HIGURUMA ============================================================
  // The whole set is deliberately DRY and wooden. Everything else in this
  // roster is fire, distortion or cursed energy; his courtroom is hardwood,
  // paper and a clock, and it should sound like the quietest place in the game
  // right up until the blade.

  gavel() {
    this.ensure();
    // wood on wood: a hard short knock with a woody body under it
    this._noise({ dur: 0.07, gain: 0.34, freq: 1500, slideTo: 420, q: 1.1 });
    this._osc('triangle', 300, { to: 150, dur: 0.16, gain: 0.30 });
    this._osc('sine', 92, { to: 62, dur: 0.28, gain: 0.22 });
  }
  confiscate() {
    this.ensure();
    // a page being drawn out of a file — rising, thin, no impact
    this._noise({ dur: 0.22, gain: 0.13, freq: 900, slideTo: 3200, q: 1.4 });
  }
  confiscateLand() {
    this.ensure();
    // the stamp coming down on it
    this._osc('square', 520, { to: 260, dur: 0.13, gain: 0.16 });
    this._noise({ dur: 0.10, gain: 0.18, freq: 1200, slideTo: 300, q: 1.0 });
  }
  judgemanSummon() {
    this.ensure();
    // two chain links settling, and the balance finding level
    this._osc('sine', 240, { to: 180, dur: 0.5, gain: 0.16 });
    this._osc('triangle', 1180, { to: 1180, dur: 0.10, gain: 0.07 });
    setTimeout(() => this._osc('triangle', 1570, { to: 1570, dur: 0.10, gain: 0.06 }), 90);
  }
  judgemanBreak() {
    this.ensure();
    this._osc('sawtooth', 300, { to: 70, dur: 0.45, gain: 0.24 });
    this._noise({ dur: 0.3, gain: 0.2, freq: 2400, slideTo: 400, q: 1.1 });
  }

  swordMaterialize() {
    this.ensure();
    // steel writing itself into existence: a rising shimmer that resolves onto
    // one clean struck note
    this._noise({ dur: 0.55, gain: 0.20, freq: 500, slideTo: 5200, q: 2.2 });
    this._osc('triangle', 220, { to: 880, dur: 0.5, gain: 0.14 });
    setTimeout(() => {
      this._osc('triangle', 1320, { to: 1320, dur: 0.5, gain: 0.16 });
      this._osc('sine', 660, { to: 660, dur: 0.7, gain: 0.10 });
    }, 420);
  }
  executionSwing() {
    this.ensure();
    // the wind-up, not the hit: a low heavy draw of air
    this._noise({ dur: 0.42, gain: 0.18, freq: 260, slideTo: 900, q: 0.7 });
    this._osc('sine', 70, { to: 110, dur: 0.42, gain: 0.16 });
  }
  executionSeize() {
    this.ensure();
    // the moment it connects: everything stops
    this._osc('sawtooth', 180, { to: 40, dur: 0.55, gain: 0.30 });
    this._noise({ dur: 0.20, gain: 0.26, freq: 3000, slideTo: 200, q: 1.5 });
  }
  swordFall() {
    this.ensure();
    this._noise({ dur: 0.18, gain: 0.30, freq: 400, slideTo: 4200, q: 1.0 });
  }
  gavelFinal() {
    this.ensure();
    // the gavel that ends it — the ordinary knock, three times the size
    this._noise({ dur: 0.10, gain: 0.5, freq: 1400, slideTo: 300, q: 1.0 });
    this._osc('triangle', 260, { to: 110, dur: 0.5, gain: 0.42 });
    this._osc('sine', 70, { to: 42, dur: 1.1, gain: 0.34 });
  }

  duelHit(step = 1) {
    this.ensure();
    // one rung up the ladder per correct input — the pitch IS the progress bar
    this._osc('square', 520 + step * 110, { to: 620 + step * 110, dur: 0.07, gain: 0.11 });
  }
  duelWrong() {
    this.ensure();
    this._osc('sawtooth', 190, { to: 120, dur: 0.14, gain: 0.16 });
  }
  duelMash() {
    this.ensure();
    // the opponent's side: a dry tick, quiet enough to mash without pain
    this._noise({ dur: 0.03, gain: 0.05, freq: 2600, q: 2.0 });
  }
  duelWin() {
    this.ensure();
    this._osc('triangle', 880, { to: 1760, dur: 0.28, gain: 0.20 });
    this._osc('sine', 220, { to: 110, dur: 0.6, gain: 0.18 });
  }
  duelLose() {
    this.ensure();
    this._osc('sawtooth', 420, { to: 90, dur: 0.5, gain: 0.24 });
    this._noise({ dur: 0.26, gain: 0.22, freq: 1800, slideTo: 260, q: 0.9 });
  }

  // THE CLOCK. A ticking pendulum cut with a heartbeat, running for as long as
  // the duel does. Both are scheduled ahead on the audio clock rather than
  // driven from the frame loop, so they stay metronomic while the game is
  // hitstopped, slowed or dropping frames — which is exactly when it matters.
  startClock() {
    this.ensure();
    if (this.clock) return;
    this.clock = { t: 0, tick: 0 };
    const beat = () => {
      if (!this.clock) return;
      const i = this.clock.tick++;
      // pendulum: alternating tock, dry and wooden
      this._noise({ dur: 0.035, gain: 0.16, freq: i % 2 ? 2100 : 1700, q: 3.0 });
      // heartbeat under it, doubled, on the half beat
      setTimeout(() => {
        if (!this.clock) return;
        this._osc('sine', 62, { to: 40, dur: 0.16, gain: 0.26 });
        setTimeout(() => this.clock && this._osc('sine', 56, { to: 36, dur: 0.14, gain: 0.18 }), 130);
      }, 240);
      this.clock.timer = setTimeout(beat, 520);
    };
    beat();
  }
  stopClock() {
    if (!this.clock) return;
    clearTimeout(this.clock.timer);
    this.clock = null;
  }

  // ---- HANAMI ------------------------------------------------------------
  // Wood and soil throughout: low, dry, fibrous. Nothing in his set has a
  // metallic or an electric component, which is what keeps him audibly
  // separate from every sorcerer on the roster.
  rootField() {
    this.ensure();
    this._noise({ dur: 0.9, gain: 0.20, freq: 320, slideTo: 90, q: 0.7, type: 'lowpass' });
    this._osc('triangle', 90, { to: 150, dur: 0.7, gain: 0.16 });
  }
  rootPrime() {
    this.ensure();
    this._osc('triangle', 120, { to: 190, dur: 0.45, gain: 0.12 });
    this._noise({ dur: 0.4, gain: 0.09, freq: 700, slideTo: 1500, q: 1.2 });
  }
  rootErupt() {
    this.ensure();
    // the splintering crack, then the low thud of the ground opening
    this._noise({ dur: 0.20, gain: 0.34, freq: 2600, slideTo: 500, q: 1.4 });
    this._osc('sawtooth', 150, { to: 55, dur: 0.34, gain: 0.30 });
    this._noise({ dur: 0.5, gain: 0.16, freq: 240, q: 0.6, type: 'lowpass' });
  }
  budThrow() { this.ensure(); this._noise({ dur: 0.16, gain: 0.14, freq: 1400, slideTo: 3000, q: 1.6 }); }
  woodBall() {
    this.ensure();
    this._osc('sawtooth', 60, { to: 130, dur: 1.1, gain: 0.26 });
    this._noise({ dur: 1.0, gain: 0.14, freq: 180, slideTo: 520, q: 0.6, type: 'lowpass' });
  }
  woodImpact() {
    this.ensure();
    this._osc('square', 90, { to: 34, dur: 0.6, gain: 0.42 });
    this._noise({ dur: 0.45, gain: 0.36, freq: 1800, slideTo: 160, q: 0.8 });
  }

  // ---- KUROURUSHI --------------------------------------------------------
  // Dry, granular and WET by turns: the swarm is a hiss of thousands of small
  // hard things, the spray is a liquid heave, the bite is a wet crunch.
  swarmRelease() {
    this.ensure();
    this._noise({ dur: 0.85, gain: 0.24, freq: 4200, slideTo: 2200, q: 0.5 });
    this._noise({ dur: 0.5, gain: 0.12, freq: 900, q: 1.0 });
  }
  swarmHiss(level = 1) {
    this.ensure();
    this._noise({ dur: 0.3, gain: 0.05 * level, freq: 5200, q: 0.4 });
  }
  spray() {
    this.ensure();
    this._noise({ dur: 0.55, gain: 0.30, freq: 1100, slideTo: 2800, q: 0.7 });
    this._osc('sawtooth', 210, { to: 90, dur: 0.5, gain: 0.14 });
  }
  devourBite() {
    this.ensure();
    this._osc('square', 190, { to: 48, dur: 0.28, gain: 0.34 });
    this._noise({ dur: 0.24, gain: 0.32, freq: 700, slideTo: 180, q: 1.8 });
    this._noise({ dur: 0.5, gain: 0.12, freq: 3000, slideTo: 600, q: 0.9 });
  }
  growl(stage = 1) {
    this.ensure();
    // deeper with every growth stage — the audible read on how far gone he is
    const f = 150 - stage * 26;
    this._osc('sawtooth', f, { to: f * 1.5, dur: 0.75, gain: 0.30 });
    this._noise({ dur: 0.7, gain: 0.16, freq: 300, slideTo: 900, q: 0.6 });
  }

  // ---- TAUNTS -------------------------------------------------------------
  // One cue per taunt, all synthesized here like everything else in this file.
  // NO VOICE SAMPLES AND NO SHOW AUDIO — these are original musical stings that
  // characterise, not imitations of anybody's line reading.
  //
  // The vocabulary, so a new one lands in the same world as the rest:
  //   · the SORCERERS get pitched, tonal cues — an interval, a little motif
  //   · the SPIRITS get untuned ones — noise, scrape, rumble, no key
  //   · a cue is short (<0.9s) and sits UNDER the bubble's pop, not over it
  // A missing key falls through to the neutral flourish rather than throwing,
  // so a half-added taunt is silent-ish instead of broken.
  taunt(cue) {
    this.ensure();
    if (!this.ctx) return;
    const two = (a, b, gap = 0.09, o = {}) => {
      this._osc(o.type ?? 'triangle', a, { to: o.aTo ?? a, dur: o.dur ?? 0.16, gain: o.gain ?? 0.17 });
      setTimeout(() => this._osc(o.type ?? 'triangle', b,
        { to: o.bTo ?? b, dur: (o.dur ?? 0.16) * 1.9, gain: (o.gain ?? 0.17) * 0.9 }), gap * 1000);
    };
    switch (cue) {
      // GOJO — an unbothered rising two-note shrug on a clean sine, with the
      // faintest shimmer over it. Nothing in it is trying.
      case 'gojo':
        two(523, 784, 0.14, { type: 'sine', dur: 0.2, gain: 0.16 });
        setTimeout(() => this._osc('sine', 1568, { dur: 0.5, gain: 0.05 }), 240);
        break;
      // The same shrug, but he MEANS it — brighter, harder attack, no shimmer.
      case 'gojoShinjuku':
        two(587, 880, 0.1, { type: 'triangle', dur: 0.16, gain: 0.19 });
        this._noise({ dur: 0.3, gain: 0.07, freq: 5000, slideTo: 2000, q: 0.5 });
        break;
      // SUKUNA — a descending minor third on a low saw, dropped on you.
      case 'sukuna':
        two(196, 155, 0.13, { type: 'sawtooth', dur: 0.22, gain: 0.2 });
        this._osc('sine', 78, { to: 62, dur: 0.7, gain: 0.12 });
        break;
      case 'sukunaMeguna':
        two(233, 175, 0.13, { type: 'sawtooth', dur: 0.2, gain: 0.18 });
        this._osc('sine', 88, { to: 66, dur: 0.6, gain: 0.11 });
        break;
      // TOJI — no pitch at all worth speaking of. A knuckle crack and a shrug
      // of low air. The only cue in the set with no melodic content, because he
      // is the only fighter with no cursed energy.
      case 'toji':
        this._noise({ dur: 0.07, gain: 0.3, freq: 2600, q: 2.4 });
        setTimeout(() => this._noise({ dur: 0.06, gain: 0.24, freq: 3100, q: 2.6 }), 90);
        this._osc('sine', 96, { to: 70, dur: 0.5, gain: 0.09 });
        break;
      // NAOYA — a fast bright triplet running UP. Speed, announced.
      case 'naoya':
        [880, 1175, 1568].forEach((f, i) =>
          setTimeout(() => this._osc('square', f, { dur: 0.09, gain: 0.11 }), i * 62));
        break;
      // KASHIMO — a bright rising two-note over a crackle, then one high
      // sustained tone that just hangs there. A man who is not in a hurry
      // because he has already waited four centuries.
      case 'kashimo':
        this._noise({ dur: 0.10, gain: 0.16, freq: 6200, q: 2.2 });
        two(494, 740, 0.12, { type: 'triangle', dur: 0.15, gain: 0.16 });
        setTimeout(() => this._osc('sine', 1480, { dur: 0.62, gain: 0.06 }), 300);
        break;
      // PANDA — a warm major third, and then a low wooden thump on the beat he
      // over-balances. The only cue in the set with a punchline in it.
      case 'panda':
        two(392, 494, 0.13, { type: 'triangle', dur: 0.20, gain: 0.17 });
        setTimeout(() => this._osc('sine', 165, { to: 110, dur: 0.24, gain: 0.20 }), 620);
        setTimeout(() => this._noise({ dur: 0.10, gain: 0.12, freq: 900, q: 2.0 }), 630);
        break;
      // YUTA — a soft, apologetic falling third that resolves anyway.
      case 'yuta':
        two(659, 587, 0.16, { type: 'sine', dur: 0.24, gain: 0.14 });
        setTimeout(() => this._osc('sine', 880, { dur: 0.4, gain: 0.08 }), 340);
        break;
      // MEGUMI — the shikigami cue family, one octave and a shadow thud.
      case 'megumi':
        this._osc('sine', 320, { to: 160, dur: 0.3, gain: 0.16 });
        setTimeout(() => this._noise({ dur: 0.3, gain: 0.14, freq: 260, slideTo: 900, q: 0.8 }), 140);
        break;
      // GETO — a low, patient, almost liturgical fifth. He is not joking.
      case 'geto':
        this._osc('triangle', 147, { dur: 0.55, gain: 0.15 });
        this._osc('triangle', 220, { dur: 0.55, gain: 0.11 });
        setTimeout(() => this._osc('sine', 110, { to: 98, dur: 0.6, gain: 0.1 }), 280);
        break;
      // NANAMI — a watch. Two dry ticks and a tired sine.
      case 'nanami':
        [0, 210].forEach(d => setTimeout(() => this._noise({ dur: 0.035, gain: 0.22, freq: 4200, q: 6 }), d));
        setTimeout(() => this._osc('sine', 392, { to: 330, dur: 0.5, gain: 0.12 }), 300);
        break;
      // HIGURUMA — the gavel. A wood knock and a room tone under it.
      case 'higuruma':
        this._osc('square', 240, { to: 60, dur: 0.16, gain: 0.3 });
        this._noise({ dur: 0.2, gain: 0.2, freq: 1400, slideTo: 220, q: 1.2 });
        setTimeout(() => this._osc('sine', 130, { dur: 0.6, gain: 0.09 }), 120);
        break;
      // HAKARI — a coin-drop arpeggio. It is a pachinko parlor in half a second.
      case 'hakari':
        [784, 988, 1319, 1568].forEach((f, i) =>
          setTimeout(() => this._osc('square', f, { dur: 0.08, gain: 0.1 }), i * 55));
        setTimeout(() => this._noise({ dur: 0.25, gain: 0.1, freq: 6000, q: 0.6 }), 220);
        break;
      // YUJI — plain, warm, unglamorous. A perfect fourth and a knuckle pop.
      case 'yuji':
        two(392, 523, 0.1, { type: 'triangle', dur: 0.18, gain: 0.18 });
        this._noise({ dur: 0.06, gain: 0.2, freq: 2800, q: 2.2 });
        break;
      // Shinjuku Yuji says nothing, so his cue is nothing but breath and impact.
      case 'yujiShinjuku':
        this._noise({ dur: 0.35, gain: 0.13, freq: 700, slideTo: 260, q: 0.6, type: 'lowpass' });
        setTimeout(() => this._osc('sine', 98, { to: 74, dur: 0.5, gain: 0.13 }), 180);
        break;
      // Modulo — the same warm fourth, detuned and haunted by a curse partial.
      case 'yujiModulo':
        two(392, 523, 0.1, { type: 'triangle', dur: 0.2, gain: 0.16 });
        setTimeout(() => this._osc('sawtooth', 262, { to: 247, dur: 0.6, gain: 0.09 }), 200);
        break;
      // NOBARA — a bright metallic ping. The nail, flicked.
      case 'nobara':
        this._osc('triangle', 1760, { dur: 0.28, gain: 0.14 });
        this._osc('sine', 2637, { dur: 0.22, gain: 0.07 });
        setTimeout(() => two(659, 880, 0.09, { type: 'sine', dur: 0.16, gain: 0.13 }), 220);
        break;
      // CHOSO — a slow uncertain rise that never quite lands. He is asking.
      case 'choso':
        this._osc('sine', 220, { to: 294, dur: 0.7, gain: 0.15 });
        setTimeout(() => this._osc('sine', 311, { dur: 0.35, gain: 0.1 }), 520);
        break;
      // TODO — the loudest cue in the game, because of course it is. A clap and
      // a fanfare that is genuinely too much for the moment.
      case 'todo':
        this._noise({ dur: 0.09, gain: 0.42, freq: 2200, q: 1.2 });
        [523, 659, 784, 1047].forEach((f, i) =>
          setTimeout(() => this._osc('square', f, { dur: 0.13, gain: 0.16 }), 90 + i * 70));
        break;
      // ---- THE SPIRITS: no key, no interval, no melody ---------------------
      case 'jogo':                         // a small eruption and a sad hiss
        this._osc('sawtooth', 70, { to: 40, dur: 0.6, gain: 0.24 });
        this._noise({ dur: 0.7, gain: 0.2, freq: 900, slideTo: 260, q: 0.5 });
        setTimeout(() => this._noise({ dur: 0.4, gain: 0.09, freq: 3200, slideTo: 1400, q: 0.7 }), 420);
        break;
      case 'mahito':                       // soft wet reshaping
        this._noise({ dur: 0.45, gain: 0.18, freq: 600, slideTo: 1600, q: 1.4 });
        this._osc('sine', 180, { to: 320, dur: 0.4, gain: 0.1 });
        break;
      case 'mahitoDistorted':              // the same, much worse
        this._noise({ dur: 0.7, gain: 0.24, freq: 400, slideTo: 2200, q: 1.1 });
        this._osc('sawtooth', 110, { to: 62, dur: 0.7, gain: 0.16 });
        break;
      case 'hanami':                       // growth: a creak and a soft bloom
        this._noise({ dur: 0.55, gain: 0.16, freq: 420, slideTo: 1500, q: 1.6 });
        setTimeout(() => this._osc('sine', 523, { to: 784, dur: 0.6, gain: 0.07 }), 300);
        break;
      case 'kurourushi':                   // chitin, and the swarm answering
        this._noise({ dur: 0.14, gain: 0.24, freq: 3600, q: 3.0 });
        setTimeout(() => this._noise({ dur: 0.5, gain: 0.15, freq: 5000, slideTo: 2600, q: 0.5 }), 150);
        break;
      case 'inumaki':                      // "salmon." Two flat syllables and
        // nothing else happens — which is the joke. Deliberately the SMALLEST
        // cue in the table: no reverb, no sweep, no impact. A taunt that
        // sounded like a technique would ruin it.
        two(392, 349, 0.12, { type: 'triangle', dur: 0.15, gain: 0.11 });
        break;
      case 'uro':                          // she stretches, and space complains
        // No voice line cue: her taunt HAS a bubble (see combat/taunts.js), so
        // the audio is the flourish rather than the speech. A detuned pair
        // that bends up and never resolves — the sound of somebody not
        // bothering to finish a thought.
        this._detuned(660, { to: 880, dur: 0.5, gain: 0.06, type: 'sine', cents: 15 });
        setTimeout(() => this._noise({ dur: 0.22, gain: 0.07, freq: 5400, slideTo: 3200, q: 2.4 }), 380);
        break;
      case 'dagon':                        // the sea, briefly, and then nothing
        // NO BUBBLE — he is a cursed spirit. The cue is the quietest in the
        // whole table after Inumaki's: a single wet surface break and a long
        // low swell under it that outlasts the gesture. Nothing resolves.
        this._noise({ dur: 0.18, gain: 0.10, freq: 700, slideTo: 1600, q: 2.0 });
        this._osc('sine', 54, { to: 44, dur: 1.6, gain: 0.13 });
        setTimeout(() => this._noise({ dur: 0.5, gain: 0.06, freq: 2200, slideTo: 900, q: 0.8 }), 900);
        break;
      case 'mahoraga':                     // the wheel: one turn, one clunk
        this._noise({ dur: 0.5, gain: 0.14, freq: 800, slideTo: 300, q: 1.1 });
        setTimeout(() => this._osc('square', 130, { to: 44, dur: 0.24, gain: 0.3 }), 480);
        break;
      // ---- THE THREE NEW ONES ---------------------------------------------
      // MAKI — the glasses go up, and the cue is the little metallic tick of
      // the frame against her knuckle plus one flat, unimpressed note. Kin to
      // Toji's in having almost no melody, which is the point: the two
      // Heavenly Restrictions should sound related.
      case 'maki':
        this._noise({ dur: 0.06, gain: 0.13, freq: 5200, q: 3.0 });
        setTimeout(() => two(294, 262, 0.12, { type: 'triangle', dur: 0.18, gain: 0.15 }), 90);
        break;
      // YUKI — a rising, easy two-note question with a heavy low body under
      // it. The melody is casual; the weight underneath is not, which is the
      // whole character in one cue.
      case 'yuki':
        two(392, 523, 0.16, { type: 'triangle', dur: 0.22, gain: 0.17 });
        this._osc('sine', 58, { to: 44, dur: 0.9, gain: 0.16 });
        setTimeout(() => this._osc('sine', 98, { to: 73, dur: 0.5, gain: 0.08 }), 260);
        break;
      // MIWA — the only cue in the table that goes UP and then comes back
      // DOWN, because the taunt itself retreats: the blade rings out bright,
      // and then the melody apologises. Quiet, and a semitone flatter than it
      // started.
      case 'miwa':
        this._osc('sine', 1760, { to: 2093, dur: 0.14, gain: 0.10 });
        setTimeout(() => two(659, 494, 0.14, { type: 'triangle', dur: 0.2, gain: 0.12 }), 150);
        setTimeout(() => this._osc('sine', 466, { to: 440, dur: 0.4, gain: 0.07 }), 430);
        break;
      default:
        two(440, 587, 0.1, { type: 'triangle', dur: 0.16, gain: 0.14 });
    }
  }

  // =========================================================================
  // CURSED SPEECH 呪言 — THE VOICE
  // =========================================================================
  // ORIGINAL PROCEDURAL AUDIO ONLY. Nothing here is sampled from anything, and
  // there is no voice recording in the project — a cursed-speech command is
  // synthesized from three layers stacked at runtime:
  //
  //   1. THE FORMANTS. Two detuned sawtooth oscillators through a pair of
  //      resonant bandpass filters parked at ~700 Hz and ~1150 Hz, which are
  //      roughly where the first two vowel formants of a human "ah" sit. That
  //      is what makes it read as a MOUTH rather than as a synth: the ear
  //      hears formants and infers a throat.
  //   2. THE INHUMAN LAYER. The same pitch again an octave down as a square
  //      wave, and a ring-modulating sine a fifth off it. Neither is anything
  //      a person could produce, and together they are the "it is not really
  //      him talking" that the whole technique needs.
  //   3. THE SHOCKWAVE. A sub-bass sine sweeping down under all of it, plus a
  //      noise burst — the physical event the word causes, arriving underneath
  //      the word itself.
  //
  // AND THEN IT DEGRADES. `tier` is his throat strain, 0..3, and every layer
  // answers to it:
  //   CLEAR      full gain, clean formants, the sub lands hard.
  //   STRAINED   the formant Q drops (the vowel loses definition), and a thin
  //              breath-noise layer comes in over the top.
  //   RAW        the pitch is dragged around by a fast wobble, the fundamental
  //              drops, the breath layer is louder than the voice, and a short
  //              CRACK — a stepped pitch break — fires halfway through.
  //   SILENCED   he does not get here: `canSpeak` refuses the command before
  //              the audio is reached. The row exists so that if one ever leaks
  //              through it is a rasp and nothing else.
  //
  // The result is that a player can tell his gauge state with their eyes shut,
  // which is the brief for this and the reason it is not four gain values.
  _voice(freq, dur, gain, tier) {
    if (!this.ctx) return;
    const t = this._now();
    const rough = [0, 0.25, 0.62, 0.9][Math.max(0, Math.min(3, tier))];
    const out = this.ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(gain * (1 - rough * 0.42), t + 0.012);
    out.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    out.connect(this.master);

    // 1 — the two formants
    for (const [fHz, q, lvl] of [[700, 9 - rough * 6, 1.0], [1150, 7 - rough * 4.5, 0.7]]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const base = freq * (1 - rough * 0.18);
      o.frequency.setValueAtTime(base, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, base * 0.72), t + dur);
      // RAW drags the pitch around — this is the wobble that reads as a voice
      // that has stopped obeying its owner
      if (rough > 0.5) {
        const lfo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 17 + rough * 22;
        lg.gain.value = base * 0.09 * rough;
        lfo.connect(lg); lg.connect(o.frequency);
        lfo.start(t); lfo.stop(t + dur);
      }
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fHz;
      bp.Q.value = Math.max(0.8, q);
      const g = this.ctx.createGain();
      g.gain.value = lvl;
      o.connect(bp); bp.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.04);
    }

    // 2 — the inhuman layer: an octave down, and a ring-modulating fifth
    const sub = this.ctx.createOscillator();
    sub.type = 'square';
    sub.frequency.setValueAtTime(freq * 0.5, t);
    sub.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.34), t + dur);
    const subG = this.ctx.createGain();
    subG.gain.value = 0.30;
    sub.connect(subG); subG.connect(out);
    sub.start(t); sub.stop(t + dur + 0.04);

    const ring = this.ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.value = freq * 1.5;
    const ringG = this.ctx.createGain();
    ringG.gain.value = 0.0;                       // modulated, not heard alone
    const ringDepth = this.ctx.createGain();
    ringDepth.gain.value = 0.18 + rough * 0.16;
    ring.connect(ringDepth); ringDepth.connect(ringG.gain);
    subG.connect(ringG); ringG.connect(out);
    ring.start(t); ring.stop(t + dur + 0.04);

    // the breath layer — barely there when he is clear, most of the sound
    // when he is raw
    if (rough > 0.1) {
      this._noise({
        dur, gain: gain * rough * 0.55, freq: 1800 - rough * 700,
        slideTo: 600, q: 0.7, a: 0.01
      });
    }
    // ...and the crack, halfway through, once he is RAW
    if (rough > 0.5) {
      setTimeout(() => {
        this._noise({ dur: 0.09, gain: 0.22, freq: 2600, q: 2.2 });
        this._osc('square', freq * 1.9, { to: freq * 0.6, dur: 0.07, gain: 0.10 });
      }, dur * 480);
    }
  }

  // THE COMMAND ITSELF. `weight` picks the register (a light word is higher
  // and shorter), `tier` degrades it.
  command(weight = 'light', tier = 0) {
    this.ensure(); if (!this.ctx) return;
    const heavy = weight === 'heavy';
    this.theme?.duck(heavy ? 0.42 : 0.62, heavy ? 0.30 : 0.16);
    this._voice(heavy ? 132 : 188, heavy ? 0.52 : 0.34, heavy ? 0.40 : 0.30, tier);
    // 3 — THE SHOCKWAVE, underneath the word. This is the physical event, and
    // it is what makes a command land like an impact rather than like a line
    // of dialogue.
    this._osc('sine', heavy ? 92 : 140, { to: heavy ? 32 : 54, dur: heavy ? 0.44 : 0.24, gain: heavy ? 0.55 : 0.30 });
    this._noise({ dur: heavy ? 0.34 : 0.18, gain: heavy ? 0.30 : 0.16, freq: heavy ? 520 : 900, slideTo: 180, q: 0.6 });
  }

  // The windup — the gather at his throat. A rising resonant hum, so the
  // opponent hears the command coming before they see the glyphs.
  utterStart(weight = 'light', tier = 0) {
    this.ensure(); if (!this.ctx) return;
    const heavy = weight === 'heavy';
    this._osc('sine', heavy ? 150 : 220, { to: heavy ? 300 : 400, dur: heavy ? 0.50 : 0.24, gain: 0.13, curve: 'exp' });
    this._noise({ dur: heavy ? 0.52 : 0.26, gain: 0.10 + tier * 0.03, freq: 300, slideTo: 1700, q: 1.9, a: 0.06 });
  }

  // The gather collapsing when somebody hits him. A swallowed, cut-off vowel.
  utterBreak() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sawtooth', 210, { to: 70, dur: 0.11, gain: 0.20 });
    this._noise({ dur: 0.13, gain: 0.20, freq: 1500, slideTo: 300, q: 1.4 });
  }

  // SILENCED. Not a sting — an ABSENCE. A wet, airless rasp with no pitch in
  // it at all, which is the correct sound for a throat that has stopped
  // working, and the only cue in his set that is deliberately unpleasant.
  silenced() {
    this.ensure(); if (!this.ctx) return;
    this._noise({ dur: 0.62, gain: 0.26, freq: 900, slideTo: 240, q: 0.8, a: 0.02 });
    this._noise({ dur: 0.30, gain: 0.16, freq: 2800, slideTo: 900, q: 1.2 });
    this._osc('sine', 70, { to: 40, dur: 0.5, gain: 0.14 });
  }

  // ---- ONE CUE PER COMMAND, layered UNDER `command` above ------------------
  // Each is the physical consequence rather than the word: they fire on
  // ARRIVAL, a beat after the voice, so a command reads as two events.
  commandPull() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 70, { to: 220, dur: 0.30, gain: 0.30 });        // rising: toward him
    this._noise({ dur: 0.28, gain: 0.18, freq: 300, slideTo: 1400, q: 1.1 });
  }
  commandFlee() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 240, { to: 70, dur: 0.30, gain: 0.26 });        // falling: away
    this._noise({ dur: 0.30, gain: 0.16, freq: 1500, slideTo: 320, q: 1.0 });
  }
  commandSleep() {
    this.ensure(); if (!this.ctx) return;
    this._osc('sine', 300, { to: 84, dur: 0.75, gain: 0.20 });
    this._osc('triangle', 150, { to: 46, dur: 0.85, gain: 0.14 });
    this._noise({ dur: 0.7, gain: 0.09, freq: 500, slideTo: 160, q: 0.7, a: 0.09 });
  }
  commandTwist() {
    this.ensure(); if (!this.ctx) return;
    // a wrench: two detuned tones sliding PAST each other
    this._osc('sawtooth', 180, { to: 320, dur: 0.26, gain: 0.20 });
    this._osc('sawtooth', 300, { to: 150, dur: 0.26, gain: 0.18 });
    this._noise({ dur: 0.20, gain: 0.24, freq: 2200, slideTo: 700, q: 2.6 });
  }
  commandCrush() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.42, 0.24);
    this._osc('sine', 110, { to: 26, dur: 0.42, gain: 0.62 });
    this._noise({ dur: 0.30, gain: 0.42, freq: 260, q: 0.5, type: 'lowpass' });
  }
  commandBlast() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.34, 0.30);
    this._osc('sine', 150, { to: 30, dur: 0.52, gain: 0.66 });
    this._noise({ dur: 0.46, gain: 0.46, freq: 1400, slideTo: 200, q: 0.5 });
    this._noise({ dur: 0.16, gain: 0.30, freq: 5200, q: 1.0 });
  }

  // EXPLODE 爆ぜろ — the ultimate. The voice at its lowest and longest, the
  // crack of a throat giving out at the end of it, and a detonation under
  // everything. The one cue in his set that is allowed to be enormous.
  explodeCommand() {
    this.ensure(); if (!this.ctx) return;
    this.theme?.duck(0.22, 0.9);
    this._voice(96, 0.80, 0.48, 1);
    this._osc('sine', 62, { to: 20, dur: 0.95, gain: 0.72 });
    this._noise({ dur: 0.85, gain: 0.44, freq: 900, slideTo: 120, q: 0.5 });
    setTimeout(() => {
      // the throat going, half a second in
      this._noise({ dur: 0.34, gain: 0.30, freq: 2400, slideTo: 700, q: 2.0 });
      this._osc('square', 190, { to: 48, dur: 0.22, gain: 0.16 });
    }, 520);
  }
}
