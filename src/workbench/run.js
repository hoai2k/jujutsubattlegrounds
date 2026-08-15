// WORKBENCH — THE RUNNER
// ===========================================================================
// Plays one finisher, full screen, with nothing else in front of it, and then
// hands the page back to the bench.
//
// WHY IT BUILDS A WHOLE MATCH. A finisher is not a standalone scene: the
// director (finishers/index.js) reads the arena's bounds to find a floor and a
// legal fight line, borrows the match's FX, SFX and cameras, hides its HUD and
// drives the two Fighters' rigs. Faking that surface would be a second,
// diverging implementation of the thing the bench exists to preview. So the
// bench starts a real Match, declares it already won on frame zero, and offers
// the KO to the same `tryBegin` the game calls — the code path under test is
// byte-for-byte the one that ships.
//
// The stage, input and audio are built ONCE and reused for every run: a fresh
// WebGLRenderer per preview would leak a GL context each time, and browsers
// hand out about sixteen before they start dropping the oldest.
// ===========================================================================
import { createStage } from '../core/stage.js';
import { GameLoop } from '../core/loop.js';
import { InputManager } from '../input/input.js';
import { Sfx } from '../audio/sfx.js';
import { Match } from '../core/match.js';
import { toggleFullscreen } from '../ui/screens.js';

let systems = null;
function ensureSystems() {
  if (!systems) systems = { stage: createStage(), input: new InputManager(), sfx: new Sfx() };
  return systems;
}

// The bench asks for real fullscreen, but a rejected request (an iframe without
// the permission, a browser that wants a different gesture) must not cost the
// preview — the run takes the whole viewport either way.
async function enterFullscreen() {
  const el = document.getElementById('app') || document.documentElement;
  if (document.fullscreenElement) return true;
  try { await el.requestFullscreen?.(); return true; } catch (e) { return false; }
}
async function exitFullscreen() {
  if (!document.fullscreenElement) return;
  try { await document.exitFullscreen?.(); } catch (e) { /* already gone */ }
}

// A body the director will treat as the one that just lost: no health in any
// pool and no stocks left. `alive` is a getter over exactly these.
function knockOut(f) {
  if (f.cores) for (const c of f.cores) c.hp = 0;
  if (f.res) f.res.hp = 0;
  f.lives = 0;
  f.iFrames = 0;
}

// ---------------------------------------------------------------------------
// playFinisher({ winner, loser, map, def })
// Resolves when the cutscene is over and the world has been torn down again.
// Resolves to a reason: 'done' (ran to the end or was skipped), 'aborted'
// (Escape / fullscreen dismissed), or 'none' (this pick has no finisher).
// ---------------------------------------------------------------------------
export function playFinisher({ winner, loser, map, def = null, onExit = null }) {
  const { stage, input, sfx } = ensureSystems();
  // The click that got here is the gesture the AudioContext has been waiting
  // for; without this the whole cutscene plays silent.
  sfx.ensure?.();

  return new Promise(resolve => {
    let match = null, loop = null, started = false, settled = false;

    const finish = (reason) => {
      if (settled) return;
      settled = true;
      removeEventListener('fullscreenchange', onFsChange);
      // The caller's curtain goes up FIRST. Everything below is visible work —
      // the last rendered frame stops updating, the arena leaves the scene —
      // and none of it should be on screen while it happens.
      onExit?.();
      loop?.stop();
      // `destroy` aborts the finisher first, which takes its overlay (and any
      // outro dip still fading) with it — otherwise a full-screen black div
      // outlives the run and sits on top of the bench forever.
      match?.destroy();
      match = null;
      exitFullscreen();
      resolve(reason);
    };

    // Leaving fullscreen by any route the bench does not own (Esc in some
    // browsers, F11, the system chrome) means "I am done watching".
    const onFsChange = () => { if (!document.fullscreenElement && started) finish('aborted'); };

    enterFullscreen().then(() => {
      addEventListener('fullscreenchange', onFsChange);

      // VS-CPU shape: one full-screen camera. `local` would open two views for
      // a beat before the director collapses them to one.
      match = new Match(stage, input, sfx, { mode: 'cpu', chars: [winner, loser], map }, document.getElementById('ui-root'), {
        lives: 1,
        // Escape reaches here through the match's own pause path, which is
        // polled every tick even while the cutscene owns the frame.
        onPause: () => finish('aborted'),
        onLegend: () => { },
        onResult: () => { }
      });

      // FRAME ZERO IS THE END OF THE MATCH. No intro, no round clock: the two
      // are placed, one of them is down, and the KO is offered immediately.
      const win = match.fighters[0], lose = match.fighters[1];
      knockOut(lose);
      match.phase = 'fight';
      match.phaseT = 999;
      match.matchOver = true;
      match.winner = win;
      for (const f of match.fighters) f.setState('idle', { clip: 'idle' });

      if (!match.finishers.tryBegin(win, def)) { finish('none'); return; }
      started = true;

      loop = new GameLoop(
        dt => { if (!settled) match.update(dt); },
        (alpha, frameDt) => {
          if (!settled) {
            match.render(alpha, frameDt);
            // The director clears `active` on its own last frame — whether it
            // ran out or a button skipped it. That is the cue to go home.
            if (!match.finishers.active) { finish('done'); return; }
          }
          stage.render(frameDt);
        }
      );
      loop.start();
    });
  });
}

export { toggleFullscreen };
