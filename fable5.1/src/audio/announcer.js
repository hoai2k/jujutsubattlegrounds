// ANNOUNCER — round calls and stingers. Voice lines use the browser's speech
// synthesis when available (no audio files; it is a runtime API, not an
// asset) and fall back to synthesized stingers alone. Everything ducks the
// music while it speaks.
export class Announcer {
  constructor(sfx) { this.sfx = sfx; this.enabled = true; this.voice = null; this._pick(); if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => this._pick(); }
  _pick() { try { const vs = speechSynthesis.getVoices(); this.voice = vs.find(v => /en.*(Google UK English Male|Daniel|Male)/i.test(v.name + v.lang)) || vs.find(v => v.lang.startsWith('en')) || vs[0] || null; } catch (e) { this.voice = null; } }
  say(text, { pitch = 0.7, rate = 0.95, duck = 0.5 } = {}) {
    if (!this.enabled) return;
    this.sfx.duck(duck, 1.1);
    try {
      if (typeof speechSynthesis === 'undefined') return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = pitch; u.rate = rate; u.volume = this.sfx.volumes.voice; if (this.voice) u.voice = this.voice;
      speechSynthesis.speak(u);
    } catch (e) { /* no speech */ }
  }
  round(n) { this.sfx.roundStart(); this.say(n === 'final' ? 'Final round' : `Round ${n}`, { rate: 0.9 }); }
  fight() { this.sfx.roundStart(); this.say('Fight!', { rate: 1.1, pitch: 0.75 }); }
  ko() { this.sfx.koStinger(); this.say('K.O.', { rate: 0.8, pitch: 0.6 }); }
  win(name) { this.sfx.winStinger(); this.say(`${name} wins`, { rate: 0.95 }); }
  domain() { this.say('Domain expansion', { rate: 0.85, pitch: 0.55, duck: 0.7 }); }
  line(text) { this.say(text); }
}
