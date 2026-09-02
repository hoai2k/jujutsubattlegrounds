// GAME — the screen router. Title -> mode -> select -> map -> match ->
// result, plus the always-on system layer (pause, settings, quality,
// screenshot, perf overlay). The real screens land in Phase 3; this is the
// orchestrator they plug into.
import { createStage } from '../render/stage.js';
import { InputManager } from '../combat/input.js';
import { Sfx } from '../audio/sfx.js';
import { Music } from '../audio/music.js';
import { Announcer } from '../audio/announcer.js';
import { HUD } from '../ui/hud.js';
import { Match } from '../combat/match.js';
import { buildArena, MAP_IDS, randomMapId } from '../stage/index.js';
import { cycleQuality, quality } from '../render/quality.js';
import { Screens } from '../ui/screens/index.js';
import { loadSettings, applySettings, settings } from '../ui/screens/settings.js';

export function startGame() {
  const stage = createStage();
  const input = new InputManager();
  const sfx = new Sfx();
  const music = new Music(sfx);
  const announcer = new Announcer(sfx);
  const ui = document.getElementById('ui-root');
  const hud = new HUD(ui);
  const G = { stage, input, sfx, music, announcer, ui, hud, match: null, arena: null, opts: null };
  loadSettings(); applySettings(G);
  const screens = new Screens(G);
  addEventListener('blur', () => { if (settings.muteOnBlur) sfx.setVolume('master', 0); });
  addEventListener('focus', () => { sfx.setVolume('master', settings.master); });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  G.startMatch = (opts) => {
    G.endMatch();
    G.opts = opts;
    G.arena = buildArena(opts.map || randomMapId(), stage);
    G.match = new Match({ stage, input, sfx, music, announcer, hud, arena: G.arena, opts: { ...opts, reducedMotion: reduced } });
    G.match.on('result', d => screens.result(d));
    window.__match = G.match;
    return G.match;
  };
  G.endMatch = () => { if (G.match) { G.match.destroy(); G.match = null; } if (G.arena) { G.arena.dispose(); G.arena = null; } hud.unbind(); stage.setViews(1); };

  input.onToggle['F4'] = () => { const q = cycleQuality(); screens.toast('QUALITY: ' + q.name); };
  input.onToggle['F3'] = () => screens.togglePerf();
  input.onToggle['F2'] = () => { const a = document.createElement('a'); stage.render(0); a.href = stage.shot(); a.download = 'jjbg-' + Date.now() + '.png'; a.click(); };
  input.onToggle['KeyF'] = () => { if (screens.current === 'match' || screens.current === 'title') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); } };
  addEventListener('blur', () => { if (G.match && !G.match.paused && !G.match.training) screens.pause(); });

  // dev hook: skip the menus (used by the playtest harness)
  window.__skipSelect = (o) => { screens.go('match', { mode: o.mode || 'cpu', picks: o.picks || [o.p1 || 'yuji', o.p2 || 'megumi'], map: o.map, rounds: o.rounds ?? 2, difficulty: o.difficulty ?? 1, training: !!o.training }); };
  window.__game = G;

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    input.pollAll();
    screens.update(dt);
    if (G.match) { G.match.update(dt); G.arena?.update(dt, now / 1000); }
    else { music.update(dt); }
    stage.render(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  screens.go('title');
}
