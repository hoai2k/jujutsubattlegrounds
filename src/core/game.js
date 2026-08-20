// Game orchestrator: character select -> match -> result -> rematch/select,
// plus the always-available system layer (pause, fullscreen, legend, debug).
import { createStage } from './stage.js';
import { GameLoop } from './loop.js';
import { InputManager } from '../input/input.js';
import { Sfx } from '../audio/sfx.js';
import { Music } from '../audio/music.js';
import { SelectScreen } from '../ui/select.js';
import { MapSelect } from '../ui/mapselect.js';
import { cycleQuality, currentQuality, setQualityIndex, QUALITY_LEVELS } from '../arena/index.js';
import { ResultScreen, Legend, PauseMenu, SystemBar, toggleFullscreen, enterFullscreen } from '../ui/screens.js';
import { SettingsPanel, settings, loadSettings, saveSettings, applySettings } from '../ui/settings.js';
import { DebugOverlay } from '../ui/debug.js';
import { Match } from './match.js';
import { OnlineController } from './onlineflow.js';
import { TitleScreen } from '../ui/title.js';
import { trackMatch, trackResult } from '../stats/telemetry.js';
import { cycleForcedBit } from '../combat/comedy.js';
import { ALL_BITS } from '../characters/takaba_bits.js';
import { SCENES } from '../combat/theset.js';
import { ensureBuild } from '../combat/construction.js';

export function startGame() {
  const stage = createStage();
  const input = new InputManager();
  const sfx = new Sfx();
  const music = new Music();
  music.preload('fight');
  const ui = document.getElementById('ui-root');
  const legend = new Legend(ui);
  const debug = new DebugOverlay(ui, stage.scene);
  const pause = new PauseMenu(ui, sfx);

  let current = null;   // active screen: {update(dt), render(alpha, frameDt)}
  let match = null;
  let quitToSelect = null;
  // ONLINE. Constructed once and outlives every screen: the session, the
  // lobby overlay and the connection banner all have to survive a match
  // starting and ending. It probes for availability in the background and
  // never blocks anything — with no network this is an inert object and a
  // greyed-out panel.
  const online = new OnlineController(ui, sfx, input);

  const MUSIC_VOL = 0.55;
  // saved preferences are read once and pushed into the systems that use them
  loadSettings();
  let musicOn = settings.music;

  function togglePause() {
    if (!match || match.phase === 'result') return;
    match.paused = !match.paused;
    match.paused ? pause.show() : pause.hide();
    sysbar.setPaused(match.paused);
    // drop the music under the pause menu rather than cutting it
    music.setVolume(match.paused ? MUSIC_VOL * 0.3 : MUSIC_VOL);
  }

  function setMusic(on) {
    musicOn = on;
    settings.music = on;
    saveSettings();
    music.setEnabled(on);
    sysbar.setMusic(on);
  }
  function toggleMusic() { setMusic(!musicOn); }

  const settingsPanel = new SettingsPanel(ui, sfx, { stage, onMusic: setMusic });

  pause.onChoice = (action) => {
    if (action === 'resume') togglePause();
    else if (action === 'settings') settingsPanel.show();
    else if (action === 'controls') legend.toggle();
    else if (action === 'select') {
      match.paused = false;
      pause.hide();
      sysbar.setPaused(false);
      // Quitting an online match is a clean leave, so peers hear about it
      // immediately rather than waiting out the disconnect grace period.
      if (match.net) online.leave('YOU LEFT THE MATCH');
      quitToSelect?.();
    }
  };
  const sysbar = new SystemBar(ui, {
    onFullscreen: toggleFullscreen, onPause: togglePause, onMusic: toggleMusic,
    onSettings: () => settingsPanel.toggle()
  });
  // push the saved preferences into the renderer + the CRT overlay class
  applySettings(stage);
  music.setEnabled(musicOn);
  sysbar.setMusic(musicOn);

  input.onToggle['F3'] = () => debug.toggle(match);
  // sword-domain testing: force the next roll to a chosen table entry
  input.onToggle['F6'] = () => match?.domains?.cycleForcedRoll();
  // ---- TAKABA: FORCE AN OUTCOME ------------------------------------------
  // F8 cycles the forced bit through OFF -> each of the fourteen entries in
  // both tables, exactly as F6 cycles Yuta's sword table. It is the only way
  // to test a specific outcome without rerolling a weighted table until it
  // comes up, and with fourteen entries that matters far more than it did
  // with ten.
  input.onToggle['F8'] = () => {
    for (const f of match?.fighters ?? []) {
      if (!f.cfg.comedy) continue;
      const key = cycleForcedBit(f, ALL_BITS);
      match.hud.message(key ? 'FORCE BIT: ' + key.toUpperCase() : 'FORCE BIT: OFF', 0.8);
    }
  };
  // ---- TAKABA: FORCE THE SET'S THREE SCENES -------------------------------
  // F9 cycles the drawn set through OFF -> each single scene repeated three
  // times, so one scene can be walked and tuned in isolation.
  input.onToggle['F9'] = () => {
    const g = match?.theset;
    if (!g) return;
    const keys = [null, ...SCENES.map(x => x.key)];
    const cur = g.forcedScenes ? g.forcedScenes[0] : null;
    const next = keys[(keys.indexOf(cur) + 1) % keys.length];
    g.forcedScenes = next ? [next, next, next] : null;
    match.hud.message(next ? 'FORCE SCENE: ' + next.toUpperCase() : 'FORCE SCENE: OFF', 0.8);
  };
  // ---- YAGA: FILL THE CONSTRUCTION METER ----------------------------------
  // F10 tops every Yaga's meter to full, so a MASTERWORK can be inspected
  // without spending six uninterrupted seconds getting one.
  input.onToggle['F10'] = () => {
    for (const f of match?.fighters ?? []) {
      if (f.cfg.special?.key !== 'yaga_build') continue;
      ensureBuild(f);
      f.build.p = 1;
      f.build.idleT = 99;
      match.hud.toast(f, 'METER FORCED FULL');
    }
  };
  // ratio-timing testing: force a perfect 7:3 prime on every Nanami in play
  input.onToggle['F7'] = () => {
    for (const f of match?.fighters ?? []) {
      if (f.cfg.special?.key === 'nanami_ratio') {
        f.ratioPrimed = 2;
        f.ratioPrimedT = f.cfg.special.primedTime ?? 6;
        match.hud.toast(f, '7:3 FORCED');
      }
    }
  };
  // F4 cycles the GRAPHICS QUALITY profile: destruction detail, debris budget,
  // particle density, shadow/post stack and pixel ratio all move together. The
  // art is identical at every level — only how much of it persists changes.
  input.onToggle['F4'] = () => {
    const q = cycleQuality();
    settings.quality = QUALITY_LEVELS.indexOf(q);
    saveSettings();
    stage.setQuality(q);
    match?.arena?.destruct?.setQuality(q);
    if (match) match.quality = q;
    match?.hud?.message?.('QUALITY: ' + q.name, 1.0);
  };
  // O — host or join, whichever the panel is currently offering. Deliberately
  // a key of its own rather than a pad button: every pad button on the select
  // screen already drives the roster, and a shortcut that also moved your
  // cursor would be worse than no shortcut.
  input.onToggle['KeyO'] = () => {
    // Only where it means something: on the character-select screen, or to
    // leave a session you are already in. Not over the stage list.
    if (!match && (online.select || online.active)) online.toggle();
  };
  input.onToggle['KeyF'] = () => toggleFullscreen();
  input.onToggle['KeyM'] = () => toggleMusic();
  // Esc closes the settings panel before it reaches the pause menu
  input.onToggle['Escape'] = () => { if (settingsPanel.open) settingsPanel.hide(); };

  const loop = new GameLoop(
    dt => {
      // The settings panel is modal over whatever is underneath it. It has to
      // poll input itself: `menuFrame` only refreshes inside pollAll, and the
      // screen that normally calls it is the one being skipped.
      if (settingsPanel.open) {
        input.pollAll('local', 4);
        settingsPanel.update(input.menuFrame);
        // ONLINE NEVER STOPS. Skipping the update here would freeze this
        // client's simulation behind a modal panel and go silent on the wire —
        // which the other players would correctly read as a disconnect.
        if (match?.net) { match.uiModal = true; match.update(dt); }
      } else {
        if (match) match.uiModal = false;
        current?.update(dt);
      }
      if (match && debug.on) debug.update(match, loop.timing);
    },
    (alpha, frameDt) => {
      current?.render?.(alpha, frameDt);
      stage.render(frameDt);
      music.update(frameDt);
    }
  );
  loop.start();

  if (import.meta.env?.DEV) {
    window.__game = {
      stage, input, loop, music, sfx, togglePause, toggleMusic,
      get current() { return current; },
      get match() { return match; },
      // DEV ONLY. Drops the running match and returns to character select, so
      // a balance harness can run matchup after matchup in one page without a
      // reload between each. Paired with `__skipSelect` above; neither exists
      // in a build and nothing in the shipped flow reads either.
      quitToSelect: () => quitToSelect?.()
    };
  }

  // One line for the player about the state of the connection during a match.
  // Names the fighter rather than the seat, because "MEGUMI RECONNECTING" is
  // information and "SEAT 3 RECONNECTING" is not.
  function netStatusText(m, net) {
    if (!online.active) return 'ONLINE SESSION ENDED — PLAYING OFFLINE';
    if (!online.session?.connected) return 'RECONNECTING…';
    const all = net.liveness();
    if (all.length && all.every(s => s.lost)) return 'EVERYONE ELSE LEFT — PLAYING OFFLINE';
    // A seat the CPU has already inherited is not "reconnecting" — the match
    // has moved on, and a banner that never clears is worse than no banner.
    const live = all.filter(s => !s.lost && !m.cpuSeats.has(s.seat));
    const joining = live.filter(s => s.joining);
    const stalling = live.filter(s => s.stalling && !s.joining);
    const names = list => list.map(s => m.fighters[s.seat]?.cfg?.name || 'PLAYER').join(', ');
    if (joining.length) return names(joining) + ' — LOADING…';
    if (stalling.length) return names(stalling) + ' — RECONNECTING…';
    return null;
  }

  // ---- TITLE ---------------------------------------------------------------
  // Shown once, at boot. It is also where the browser's audio gesture comes
  // from — nothing may make a sound before the player has touched the page,
  // and PRESS START is that touch — which is why the music and the fullscreen
  // request both hang off this one press rather than off startGame().
  async function title() {
    const screen = new TitleScreen(stage, input, sfx, ui, online);
    online.attachTitle();
    current = { update: dt => { screen.update(dt); online.update(); }, render: () => { } };
    music.play('menu');
    const choice = await screen.done;
    // Only a keyboard or mouse press counts as the gesture a browser will
    // accept; a gamepad poll does not. It is offered from here regardless and
    // simply does nothing on a pad, which is the correct failure.
    enterFullscreen();
    music.play('menu');
    // Let the chosen option read for a beat before the screen goes.
    await new Promise(r => setTimeout(r, 260));
    screen.destroy();
    if (choice === 'join') online.joinFirst();
  }

  async function flow() {
    await title();
    let picks = null;
    while (true) {
      // ---- character select ----
      if (!picks) {
        music.play('menu');
        const select = new SelectScreen(stage, input, sfx, ui, { online });
        online.attachSelect(select);
        current = { update: dt => { select.update(dt); online.update(); }, render: () => { } };
        // DEV: skip straight into a matchup without driving the select screen
        // with synthetic stick input. Test affordance only — it does not exist
        // in a build, and nothing in the shipped flow reads it.
        if (import.meta.env?.DEV) { window.__skipSelect = p => select._resolve(p); window.__select = select; }
        picks = await select.done;
        if (import.meta.env?.DEV) window.__skipSelect = null;
        online.detachSelect();
        select.destroy();
      }
      // ---- stage select ----
      // Backing out here returns to character select rather than the mode
      // list, which is the choice you actually want to change.
      // ONLINE skips it entirely: the host chooses the stage in the lobby, so
      // nobody sits on a waiting screen while one person browses maps.
      if (!picks.map) {
        const maps = new MapSelect(stage, input, sfx, ui);
        current = { update: dt => maps.update(dt), render: () => { } };
        const chosen = await maps.done;
        maps.destroy();
        if (chosen === null) { picks = null; continue; }
        picks.map = chosen;
      }
      // ---- match ----
      let resolveResult;
      const resultPicked = new Promise(res => { resolveResult = res; });
      quitToSelect = () => resolveResult('select');
      const result = new ResultScreen(ui, sfx);
      const net = picks.net || null;
      match = new Match(stage, input, sfx, picks, ui, {
        music,
        lives: 3,
        net,
        onLegend: () => legend.toggle(),
        onPause: togglePause,
        onNetNotice: (text, kind) => online.say(text, kind),
        onResult: winner => {
          trackResult(winner.cfg.name);
          result.show(winner.cfg.name);
          // Only the host decides what happens next online. A guest whose
          // session has already died gets the buttons back, because at that
          // point there is nobody left to wait for.
          result.setLocked(!!net && online.active && !online.isHost);
        }
      });
      trackMatch({
        chars: picks.chars || [picks.p1, picks.p2],
        map: match.mapId,
        mode: net ? 'online' : (picks.mode || 'local')
      });
      // D-pad Left on the result screen replays the winner's taunt
      result.onTaunt = () => match?.playVictoryTaunt();
      current = {
        update: dt => {
          match.update(dt);
          if (net) {
            online.update();
            online.matchStatus(netStatusText(match, net));
            // The host can be lost mid-result; give the buttons back the
            // moment there is nobody left to defer to.
            if (result.shown && result.locked && (!online.active || online.isHost)) result.setLocked(false);
          }
          // Online the match never stops, so the pause menu and the result
          // screen can both want the frame. Pause wins while it is open.
          if (match.paused) pause.update(input.menuFrame);
          else if (result.shown) result.update(input.menuFrame);
        },
        render: (a, f) => match.render(a, f)
      };
      // Online: the local choice is a PROPOSAL. The host broadcasts it and
      // `onResultDecided` is what actually resolves, on every client at once.
      if (net) {
        online.onResultDecided = c => resolveResult(c);
        result.done.then(c => online.chooseResult(c));
      } else {
        result.done.then(resolveResult);
      }
      const choice = await resultPicked;
      if (net) online.onResultDecided = null;
      online.matchStatus(null);
      pause.hide();
      sysbar.setPaused(false);
      match.destroy();
      match = null;
      quitToSelect = null;
      result.destroy();
      // 'select' = back to character select; a rematch keeps both picks
      if (choice === 'select') picks = null;
      else if (net) {
        // An online rematch needs the controller's freshly built NetMatch and
        // its new seed — the old one's tick counters and jitter buffers are
        // spent. If the session died in the meantime, fall back to a local
        // rematch rather than stranding the player.
        picks = online.pendingPicks && online.net && online.active
          ? online.pendingPicks
          : { ...picks, net: null, mode: 'local' };
      }
    }
  }
  flow();
}
