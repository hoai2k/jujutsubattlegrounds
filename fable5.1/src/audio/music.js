// MUSIC — the three tracks in public/music (the one non-procedural thing in
// the project), streamed through the synth's music bus with crossfades,
// mute-on-blur and a persistent volume. Ducking under the announcer lives on
// the bus itself (synth.duck).
const BASE = (import.meta.env.BASE_URL || './').replace(/fable5\.1\/?$/, '');
const TRACKS = { menu: BASE + 'music/menu.mp3', fight: BASE + 'music/fight.mp3', fight2: BASE + 'music/fight2.mp3', domain: BASE + 'music/fight_domain.mp3' };
const PLAYLISTS = { fight: ['fight', 'fight2'] };
const FADE = 0.9;

export class Music {
  constructor(synth) {
    this.synth = synth; this.tracks = new Map(); this.current = null; this.playing = null; this.listIndex = 0; this.enabled = true; this.pending = null; this.paused = false;
    if (window.__f51music && window.__f51music !== this) { try { window.__f51music.dispose(); } catch (e) { /* */ } }
    window.__f51music = this;
    const arm = () => { this._armed = true; if (this.pending) { const k = this.pending; this.pending = null; this.play(k, { force: true }); } removeEventListener('pointerdown', arm); removeEventListener('keydown', arm); };
    addEventListener('pointerdown', arm); addEventListener('keydown', arm);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this._pauseAll(); else if (this.enabled && !this.paused && this.playing) this.tracks.get(this.playing)?.el.play().catch(() => {}); });
  }
  _get(key) {
    if (this.tracks.has(key)) return this.tracks.get(key);
    const el = new Audio(TRACKS[key]); el.preload = 'auto'; el.loop = !Object.values(PLAYLISTS).some(l => l.includes(key)); el.crossOrigin = 'anonymous';
    el.addEventListener('ended', () => { if (this.playing === key) this._advance(); });
    let gain = null;
    try { if (this.synth.ctx) { const src = this.synth.ctx.createMediaElementSource(el); gain = this.synth.ctx.createGain(); gain.gain.value = 0; src.connect(gain); gain.connect(this.synth.musicBus); } } catch (e) { gain = null; }
    const t = { el, gain, target: 0, level: 0 }; this.tracks.set(key, t); return t;
  }
  preload(key) { const list = PLAYLISTS[key] || [key]; for (const k of list) this._get(k); }
  play(key, { force = false } = {}) {
    if (!this.enabled && !force) { this.current = key; return; }
    if (!this._armed) { this.pending = key; this.current = key; return; }
    if (this.current === key && this.playing && !force) return;
    this.current = key; this.listIndex = 0;
    const list = PLAYLISTS[key] || [key];
    this._start(list[0]);
  }
  _advance() { const list = PLAYLISTS[this.current]; if (!list) return; this.listIndex = (this.listIndex + 1) % list.length; this._start(list[this.listIndex]); }
  _start(key) {
    if (!this.synth.ensure()) return;
    const t = this._get(key);
    for (const [k, o] of this.tracks) o.target = k === key ? 1 : 0;
    this.playing = key;
    t.el.currentTime = 0;
    t.el.play().catch(() => {});
  }
  stop() { for (const o of this.tracks.values()) o.target = 0; this.playing = null; this.current = null; }
  setEnabled(on) { this.enabled = on; if (!on) { for (const o of this.tracks.values()) o.target = 0; } else if (this.current) this.play(this.current, { force: true }); }
  setPaused(p) { this.paused = p; for (const o of this.tracks.values()) o.target = (o.target > 0 || this.playing === [...this.tracks].find(([k, v]) => v === o)?.[0]) ? (p ? 0.25 : 1) * (this.playing && this.tracks.get(this.playing) === o ? 1 : 0) : 0; }
  duck(k, seconds) { this.synth.duck(k, seconds); }
  update(dt) {
    for (const o of this.tracks.values()) {
      const step = dt / FADE;
      o.level += Math.max(-step, Math.min(step, o.target - o.level));
      if (o.gain) o.gain.gain.value = o.level; else o.el.volume = o.level * this.synth.volumes.music;
      if (o.level <= 0.001 && !o.el.paused && o.target === 0) o.el.pause();
    }
  }
  _pauseAll() { for (const o of this.tracks.values()) o.el.pause(); }
  dispose() { this._pauseAll(); this.tracks.clear(); }
}
