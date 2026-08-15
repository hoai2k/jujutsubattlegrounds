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
import { ResultScreen, Legend, PauseMenu, SystemBar, toggleFullscreen } from '../ui/screens.js';
import { SettingsPanel, settings, loadSettings, saveSettings, applySettings } from '../ui/settings.js';
import { DebugOverlay } from '../ui/debug.js';
import { Match } from './match.js';

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
      } else current?.update(dt);
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

  async function flow() {
    let picks = null;
    while (true) {
      // ---- character select ----
      if (!picks) {
        music.play('menu');
        const select = new SelectScreen(stage, input, sfx, ui);
        current = { update: dt => select.update(dt), render: () => { } };
        // DEV: skip straight into a matchup without driving the select screen
        // with synthetic stick input. Test affordance only — it does not exist
        // in a build, and nothing in the shipped flow reads it.
        if (import.meta.env?.DEV) { window.__skipSelect = p => select._resolve(p); window.__select = select; }
        picks = await select.done;
        if (import.meta.env?.DEV) window.__skipSelect = null;
        select.destroy();
      }
      // ---- stage select ----
      // Backing out here returns to character select rather than the mode
      // list, which is the choice you actually want to change.
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
      match = new Match(stage, input, sfx, picks, ui, {
        music,
        lives: 3,
        onLegend: () => legend.toggle(),
        onPause: togglePause,
        onResult: winner => result.show(winner.cfg.name)
      });
      // D-pad Left on the result screen replays the winner's taunt
      result.onTaunt = () => match?.playVictoryTaunt();
      current = {
        update: dt => {
          match.update(dt);
          if (match.paused) pause.update(input.menuFrame);
          else if (result.shown) result.update(input.menuFrame);
        },
        render: (a, f) => match.render(a, f)
      };
      result.done.then(resolveResult);
      const choice = await resultPicked;
      pause.hide();
      sysbar.setPaused(false);
      match.destroy();
      match = null;
      quitToSelect = null;
      result.destroy();
      // 'select' = back to character select; a rematch keeps both picks
      if (choice === 'select') picks = null;
    }
  }
  flow();
}
