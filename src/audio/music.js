// Streamed background music with crossfades.
//
// NOTE: this is the one part of the project that loads external media rather
// than synthesising it — the tracks in public/music are user-supplied files,
// not procedural like everything in sfx.js. Drop replacements in with the same
// names and nothing else needs to change.
//
// The fight music is a ROTATION rather than a single song — see PLAYLISTS.
//
// Invariant this file exists to guarantee: at most ONE track is audible at any
// moment. Everything below (the single-instance guard, the tab-visibility
// handler, the post-fade pause sweep) is in service of that.
const BASE = import.meta.env.BASE_URL || '/';

export const TRACKS = {
  menu: BASE + 'music/menu.mp3',
  fight: BASE + 'music/fight.mp3',
  fight2: BASE + 'music/fight2.mp3',
  // THE ESCALATION TRACK. Swapped in while a domain stands and swapped back out
  // when it falls (domains.js `_activate` / `_collapse` / `_interrupted`). The
  // crossfade and the one-track-at-a-time invariant below do the rest, so the
  // domain system only ever has to say which track it wants.
  domain: BASE + 'music/fight_domain.mp3'
};

// PLAYLISTS. A key here is not a track, it is a ROTATION: the fight music runs
// the first song, then the second when it ends, then back to the first, for as
// long as the fight lasts. Everything outside this file still asks for 'fight'
// and never has to know there is more than one song behind it.
//
// The members of a playlist are the only tracks that do NOT loop — they have to
// be allowed to end so the `ended` handler can advance the rotation. Everything
// else (menu, domain) still loops forever as before.
export const PLAYLISTS = {
  fight: ['fight', 'fight2']
};
const inPlaylist = (key) => Object.values(PLAYLISTS).some(l => l.includes(key));

const FADE = 0.9; // seconds

export class Music {
  constructor() {
    // A second Music (hot reload, a double boot, a stray startGame) would
    // stack a whole extra soundtrack on top of the first. Retire the old one.
    if (typeof window !== 'undefined') {
      if (window.__jjbgMusic && window.__jjbgMusic !== this) {
        try { window.__jjbgMusic.dispose(); } catch (e) { /* ignore */ }
      }
      window.__jjbgMusic = this;
    }

    this.volume = 0.55;         // master music level
    this.tracks = new Map();    // key -> {el, gain, target}
    this.current = null;        // the key that was ASKED for (may be a playlist)
    this.listIndex = 0;         // where the fight rotation has got to
    this.enabled = true;
    this.pending = null;        // track key waiting on a user gesture
    this.disposed = false;
    this._armed = false;
    this.duckLevel = 1;
    this.duckT = 0;
    this._hidden = false;

    this._arm = () => {
      this._armed = true;
      if (this.pending) { const k = this.pending; this.pending = null; this.play(k, { force: true }); }
      removeEventListener('pointerdown', this._arm);
      removeEventListener('keydown', this._arm);
    };
    addEventListener('pointerdown', this._arm);
    addEventListener('keydown', this._arm);

    // Two open tabs = two soundtracks. Only the visible tab gets to play.
    this._vis = () => {
      this._hidden = document.hidden;
      if (document.hidden) this._pauseAll();
      else if (this.enabled && this.current) this._ensurePlaying(this.playing);
    };
    document.addEventListener('visibilitychange', this._vis);
  }

  // Which actual audio file a requested key resolves to right now. For a plain
  // track that is itself; for a playlist it is whichever song the rotation is
  // currently on.
  resolve(key) {
    const list = PLAYLISTS[key];
    if (!list) return key;
    return list[((this.listIndex % list.length) + list.length) % list.length];
  }
  get playing() { return this.current ? this.resolve(this.current) : null; }

  _get(key) {
    let t = this.tracks.get(key);
    if (!t) {
      const el = new Audio(TRACKS[key]);
      // Playlist members must be allowed to END; everything else repeats
      // forever until something switches away from it.
      el.loop = !inPlaylist(key);
      el.preload = 'auto';
      el.volume = 0;
      t = { el, gain: 0, target: 0, playCD: 0, broken: false };
      this.tracks.set(key, t);
      if (!el.loop) el.addEventListener('ended', () => this._advance(key));
      // ---- FAILURE HANDLERS ------------------------------------------------
      // These did not exist, and their absence is the most likely cause of the
      // "music dies after a few songs and toggling does not bring it back"
      // report. `new Audio()` elements streaming real files can fail long after
      // they started working — a decode hiccup, a stalled range request, the
      // browser reclaiming a media resource in a long session. Nothing here
      // was listening, so the element simply stopped, `ended` never fired, the
      // rotation never advanced, and the mix went silent for good. `play()`
      // on a broken element then rejects, and the old catch swallowed that
      // silently whenever `_armed` was true, which is why the mute toggle
      // looked like it did nothing.
      //
      // Marking the track `broken` is enough: the watchdog in update() owns the
      // actual recovery, so there is one recovery path rather than three.
      const fail = () => { t.broken = true; };
      el.addEventListener('error', fail);
      el.addEventListener('stalled', fail);
      el.addEventListener('abort', fail);
    }
    return t;
  }

  // Rebuild a dead element from scratch. A track that has errored cannot be
  // rescued by calling play() at it again — the media resource is gone and the
  // element needs reloading before it will accept anything.
  _revive(key) {
    const t = this.tracks.get(key);
    if (!t) return;
    t.broken = false;
    try {
      t.el.src = TRACKS[key];
      t.el.load();
    } catch (e) { /* nothing more we can do; the watchdog will try again */ }
  }

  // A playlist song finished. Step the rotation and start the next one from the
  // top. Guarded on still being the audible track, so a song that runs out
  // while it is already fading away (a domain went up mid-song) cannot yank the
  // rotation forward underneath the track that replaced it.
  _advance(key) {
    if (this.disposed) return;
    if (this.playing !== key) {
      // NOT the audible track — a song that ran out while it was already fading
      // away (a domain went up mid-song). The rotation deliberately does not
      // move: yanking it forward would desync it from the track that replaced
      // this one.
      //
      // What it MUST do, and previously did not, is rewind the element. Left
      // alone it sits parked at its own end, and the next time the rotation
      // comes back around to it `play()` gets an element with nothing left to
      // play. That is a silent, permanent hole in the rotation and it needs no
      // error to happen — just a domain cast timed near the end of a song.
      const t = this.tracks.get(key);
      if (t) { try { t.el.currentTime = 0; } catch (e) { /* ignore */ } }
      return;
    }
    this.listIndex++;
    this.play(this.current, { restartTrack: true, force: true });
  }

  // Preload without playing, so the first fight doesn't stutter — and for a
  // playlist, so the handover to the second song doesn't either.
  preload(key) {
    for (const k of PLAYLISTS[key] || [key]) {
      try { this._get(k).el.load(); } catch (e) { /* ignore */ }
    }
  }

  _ensurePlaying(key) {
    const t = this._get(key);
    if (!t.el.paused) return;
    // THROTTLE. update() calls this every frame while the current track is
    // paused, which is sixty play() calls a second at an element that is
    // already refusing to start. Browsers respond to that by rejecting the
    // requests, and a rejected play() can leave the element in a state where
    // it will not start again at all. Four attempts a second is plenty to
    // recover from a transient block and few enough to never wedge anything.
    //
    // The cooldown is counted in DELTA TIME, not wall clock, because that is
    // what every other clock in this project runs on — and because a wall
    // clock makes the throttle untestable and silently wrong under a stepped
    // loop, which is exactly the trap the first version of this fix fell into.
    if (t.playCD > 0) return;
    t.playCD = 0.25;
    const p = t.el.play();
    if (p && p.catch) {
      p.catch(() => {
        // autoplay blocked — retry on the first real user gesture. Park the
        // REQUEST, not the resolved song: parking 'fight2' would drop the
        // rotation and leave the fight stuck on one track.
        if (!this._armed) this.pending = this.current || key;
        // Armed and still refusing means this is not an autoplay block, it is
        // a broken element. Hand it to the watchdog rather than swallowing it,
        // which is what the original code did and why the failure was silent.
        else t.broken = true;
      });
    }
  }

  _pauseAll() {
    for (const [, t] of this.tracks) { if (!t.el.paused) t.el.pause(); }
  }

  // force: re-assert even when this track is already current (used by unmute
  // and by the blocked-autoplay retry, which must not be swallowed)
  // force:        re-assert even when this track is already current (used by
  //               unmute and by the blocked-autoplay retry)
  // restart:      start the request over from the beginning — for a playlist
  //               that means back to its FIRST song, which is what a new match
  //               wants
  // restartTrack: rewind the current song only, leaving the rotation alone
  play(key, { restart = false, force = false, restartTrack = false } = {}) {
    if (this.disposed || (!TRACKS[key] && !PLAYLISTS[key])) return;
    if (restart && PLAYLISTS[key]) this.listIndex = 0;
    // remembered so the mute toggle always has something to fall back on, even
    // after a stop() has cleared `current`
    this._lastRequest = key;
    const track = this.resolve(key);
    const sameTrack = this.playing === track;
    this.current = key;
    if (!this.enabled) return;

    // always re-assert fade targets, so a stale target can never leave a
    // second track audible
    this._get(track);
    for (const [k, t] of this.tracks) t.target = (k === track ? 1 : 0);

    if (restart || restartTrack) {
      const t = this._get(track);
      try { t.el.currentTime = 0; } catch (e) { /* ignore */ }
    }
    if (sameTrack && !restart && !restartTrack && !force && !this._get(track).el.paused) return;
    if (!this._hidden) this._ensurePlaying(track);
  }

  // Immediate hard stop — no fade. Used on teardown.
  stopAll() {
    this.current = null;
    for (const [, t] of this.tracks) { t.target = 0; t.gain = 0; t.el.volume = 0; }
    this._pauseAll();
  }

  stop() {
    this.current = null;
    for (const [, t] of this.tracks) t.target = 0;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) {
      for (const [, t] of this.tracks) t.target = 0;
      return;
    }
    // UNMUTING IS ALSO THE PANIC BUTTON. Whatever state the mix has got itself
    // into, a player reaching for the music toggle wants sound, so this clears
    // the two things that can make it a no-op:
    //   · a null `current` (after a stop(), the old code returned immediately
    //     and the toggle did nothing forever) — fall back to the last thing
    //     that was actually asked for
    //   · a duck left hanging by an interrupted cinematic, which would leave
    //     the mix at 5% however many times the toggle was pressed
    this.duckT = 0;
    this.duckLevel = 1;
    const key = this.current || this._lastRequest;
    if (key) {
      for (const [, t] of this.tracks) t.broken = false;
      this.play(key, { force: true });
      this._revive(this.resolve(key));
    }
  }

  // Jump the fight rotation on by hand (debug / a future "next track" bind).
  skip() { if (PLAYLISTS[this.current]) this._advance(this.playing); }

  setVolume(v) { this.volume = Math.max(0, Math.min(1, v)); }

  // duck the music under a cinematic moment (domain cast, KO)
  duck(amount = 0.35, seconds = 1.6) {
    this.duckLevel = amount;
    this.duckT = seconds;
  }

  update(dt) {
    if (this.disposed) return;
    if (this.duckT > 0) {
      this.duckT -= dt;
      if (this.duckT <= 0) this.duckLevel = 1;
    }
    const duck = this.duckT > 0 ? this.duckLevel : 1;
    const step = dt / FADE;
    const now = this.playing;
    for (const [k, t] of this.tracks) {
      if (t.playCD > 0) t.playCD = Math.max(0, t.playCD - dt);
      if (t.gain < t.target) t.gain = Math.min(t.target, t.gain + step);
      else if (t.gain > t.target) t.gain = Math.max(t.target, t.gain - step);
      t.el.volume = Math.max(0, Math.min(1, t.gain * this.volume * duck));
      // Anything not the current track is pinned silent and parked as soon as
      // it has finished fading — this is what stops two songs overlapping.
      const isCurrent = this.enabled && !this._hidden && k === now;
      if (!isCurrent && t.gain <= 0.001 && !t.el.paused) t.el.pause();
      if (isCurrent && t.el.paused && t.target > 0 && this._armed) this._ensurePlaying(k);
    }
    this._watchdog(dt, now);
  }

  // ---- THE WATCHDOG --------------------------------------------------------
  // Everything above is the happy path, and the happy path has now been fixed
  // in three separate places. This exists because the reported failure — music
  // dying several songs into a session and never coming back, not even through
  // the mute toggle — is exactly the shape of a bug that has more than one
  // cause, and I could not reproduce the original trigger inside a single
  // session to prove I had found all of them.
  //
  // So rather than assume, this asks one question every frame: DO WE BELIEVE
  // MUSIC SHOULD BE AUDIBLE RIGHT NOW, AND IS IT? If the answer is "yes, and
  // no" for longer than three quarters of a second, the mix is wedged by
  // definition, whatever wedged it, and it gets rebuilt.
  //
  // Three quarters of a second is chosen to sit above the 0.9 s crossfade's
  // busiest moment without being long enough for a player to notice a gap.
  // Recovery is rate-limited to once every two seconds so a genuinely
  // unplayable file degrades to a quiet retry rather than a spin.
  _watchdog(dt, now) {
    const shouldBeAudible = this.enabled && this._armed && !this._hidden && !!now;
    if (!shouldBeAudible) { this._silentFor = 0; return; }
    const t = this.tracks.get(now);
    // "audible" means the element is actually running. A track mid-fade-in is
    // fine; a track that is paused, errored, or sitting at its own end is not.
    const running = t && !t.el.paused && !t.broken
      && !(t.el.duration && t.el.currentTime >= t.el.duration - 0.05);
    if (running) { this._silentFor = 0; return; }

    this._recoverCD = Math.max(0, (this._recoverCD || 0) - dt);
    this._silentFor = (this._silentFor || 0) + dt;
    if (this._silentFor < 0.75 || this._recoverCD > 0) return;
    this._recoverCD = 2;          // dt-based, like every other clock here
    this._silentFor = 0;

    // Rebuild it. A broken element needs its source reloaded; a merely stalled
    // or ended one only needs rewinding. Both then get re-asserted through the
    // normal path, so the one-audible-track invariant still holds.
    if (t?.broken) this._revive(now);
    else if (t) { try { t.el.currentTime = 0; } catch (e) { /* ignore */ } }
    // clear the play cooldown so the recovery attempt is never the one that
    // gets throttled away
    if (t) t.playCD = 0;
    this.play(this.current, { force: true, restartTrack: true });
  }

  dispose() {
    this.disposed = true;
    this.stopAll();
    removeEventListener('pointerdown', this._arm);
    removeEventListener('keydown', this._arm);
    document.removeEventListener('visibilitychange', this._vis);
    for (const [, t] of this.tracks) { try { t.el.src = ''; } catch (e) { /* ignore */ } }
    this.tracks.clear();
    if (typeof window !== 'undefined' && window.__jjbgMusic === this) {
      window.__jjbgMusic = null;
    }
  }
}
