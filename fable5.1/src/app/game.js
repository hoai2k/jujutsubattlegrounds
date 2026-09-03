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
import { Match as LiteMatch } from '../combat/match.js';
import { Match as LegacyMatch } from '../combat/legacy/match.js';
import { buildArena, MAP_IDS, randomMapId } from '../stage/index.js';
import { cycleQuality, quality } from '../render/quality.js';
import { Screens } from '../ui/screens/index.js';
import { loadSettings, applySettings, settings } from '../ui/screens/settings.js';
import { Training } from '../ui/training.js';
import { OnlineController } from '../net/flow.js';
import { legacyShadow } from '../ui/legacy/host.js';
import { startVisit, trackMatch, trackResult } from '../net/telemetry.js';

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
  // ONLINE (ported from the old game: InstantDB rooms, host-authoritative
  // lockstep with snapshots, CPU takeover of a dropped seat). Its panels use
  // the old stylesheet, so they live in their own shadow root.
  const online = new OnlineController(legacyShadow(ui), sfx, input); G.online = online;
  const screens = new Screens(G); G.screens = screens;
  online.onStart = picks => screens.go('match', { mode: 'online', picks: picks.chars, map: picks.map, seed: picks.seed, net: picks.net, netPlan: picks.netPlan, rounds: 3 });
  online.onClosed = () => { if (screens.current === 'select' && screens.screens.select.data?.mode === 'online') screens.go('lobby'); };
  online.onResultDecided = choice => screens.screens.result.decided(choice);
  startVisit('fable5.1');
  addEventListener('blur', () => { if (settings.muteOnBlur) sfx.setVolume('master', 0); });
  addEventListener('focus', () => { sfx.setVolume('master', settings.master); });
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  G.startMatch = (opts) => {
    G.endMatch();
    G.opts = opts;
    if (opts.lite) {
      G.arena = buildArena(opts.map || randomMapId(), stage);
      G.match = new LiteMatch({ stage, input, sfx, music, announcer, hud, arena: G.arena, opts: { ...opts, reducedMotion: reduced } });
      G.match.on('result', d => screens.result(d));
    } else {
      // THE FULL RUNTIME: the old game's match, systems and HUD under the new
      // renderer, models and front end (combat/legacy). `lite` keeps the small
      // tested core for benches and tests.
      const net = opts.net || null;
      const picks = { mode: net ? 'online' : (opts.mode === 'ffa' ? 'local' : opts.mode), chars: opts.picks, map: opts.map || 'random', seed: opts.seed, net, netPlan: opts.netPlan };
      G.match = new LegacyMatch(stage, input, sfx, picks, ui, {
        music, net, lives: opts.mode === 'ffa' ? (opts.stocks ?? 2) : (opts.rounds ?? 2),
        onNetNotice: (text, kind) => online.say(text, kind),
        onLegend: () => screens.pauseMenu.toggleLegend?.(),
        onPause: () => screens.pause(),
        onResult: winner => { trackResult(winner.cfg.name); screens.result({ winner, online: !!net && online.active && !online.isHost, wins: G.match.fighters.map(f => f.lives), stats: G.match.fighters.map(f => ({ name: f.cfg.name, pick: f.pick, hits: f.hitsDealt ?? 0, taken: f.hitsTaken ?? 0, hp: f.res.hp, maxHP: f.maxHP })) }); }
      });
      trackMatch({ chars: opts.picks, map: G.match.mapId, mode: net ? 'online' : (opts.mode || 'local') });
      G.match.rematch = () => {
        let o = G.opts;
        // an online rematch needs the controller's freshly built NetMatch and
        // seed; if the session died, fall back to a local rematch
        if (o.net) o = online.pendingPicks && online.net && online.active ? { ...o, net: online.net, seed: online.pendingPicks.seed, netPlan: online.pendingPicks.netPlan } : { ...o, net: null, mode: 'local' };
        G.startMatch(o); screens.current = 'match'; screens.active = null;
      };
      G.match.setGrade = name => { if (name === 'map') stage.setGrade(G.match.mapGrade); else stage.setGrade(name); };
      G.match.cams.forEach(c => { c.reducedMotion = reduced; });
    }
    if (opts.training) { G.match.training = true; G.training = new Training(ui, G.match, input, sfx); }
    window.__match = G.match;
    return G.match;
  };
  G.endMatch = () => { if (G.match?.net) online.matchStatus(null); if (G.training) { G.training.destroy(); G.training = null; } if (G.match) { G.match.destroy(); G.match = null; } if (G.arena) { G.arena.dispose(); G.arena = null; } hud.unbind(); stage.setViews(1); };

  input.onToggle['F4'] = () => { const q = cycleQuality(); screens.toast('QUALITY: ' + q.name); };
  input.onToggle['F3'] = () => screens.togglePerf();
  input.onToggle['F2'] = () => { const a = document.createElement('a'); stage.render(0); a.href = stage.shot(); a.download = 'jjbg-' + Date.now() + '.png'; a.click(); };
  input.onToggle['KeyF'] = () => { if (screens.current === 'match' || screens.current === 'title') { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); } };
  addEventListener('blur', () => { if (G.match && !G.match.paused && !G.match.training) screens.pause(); });

  // dev hook: skip the menus (used by the playtest harness)
  window.__skipSelect = (o) => { screens.go('match', { mode: o.mode || 'cpu', picks: o.picks || [o.p1 || 'yuji', o.p2 || 'megumi'], map: o.map, rounds: o.rounds ?? 2, difficulty: o.difficulty ?? 1, training: !!o.training }); };
  window.__game = G;

  // One line about the connection during a match, naming the fighter rather
  // than the seat ("MEGUMI RECONNECTING" is information; "SEAT 3" is not).
  function netStatusText(m, net) {
    if (!online.active) return 'ONLINE SESSION ENDED — PLAYING OFFLINE';
    if (!online.session?.connected) return 'RECONNECTING…';
    const all = net.liveness();
    if (all.length && all.every(s => s.lost)) return 'EVERYONE ELSE LEFT — PLAYING OFFLINE';
    const live = all.filter(s => !s.lost && !m.cpuSeats.has(s.seat));
    const joining = live.filter(s => s.joining), stalling = live.filter(s => s.stalling && !s.joining);
    const names = list => list.map(s => m.fighters[s.seat]?.cfg?.name || 'PLAYER').join(', ');
    if (joining.length) return names(joining) + ' — LOADING…';
    if (stalling.length) return names(stalling) + ' — RECONNECTING…';
    return null;
  }
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    input.pollAll();
    screens.update(dt);
    if (G.match) { G.match.update(dt); if (G.match.render) G.match.render(1, dt); G.arena?.update(dt, now / 1000); G.training?.update(dt, input.frames[0]); if (G.match.net) online.matchStatus(netStatusText(G.match, G.match.net)); }
    else { music.update(dt); }
    online.update();
    stage.render(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  screens.go('title');
}
