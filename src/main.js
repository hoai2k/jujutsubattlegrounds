// Entry point. Route: #viewer -> turntable model viewer, otherwise the game.
import './ui/style.css';

const boot = async () => {
  if (location.hash.startsWith('#viewer')) {
    const { startViewer } = await import('./viewer/viewer.js');
    startViewer();
  } else {
    const { startGame } = await import('./core/game.js');
    startGame();
  }
};

window.addEventListener('hashchange', () => location.reload());
boot();

// Anonymous visit telemetry, read back at /stats/. Loaded after boot has been
// kicked off and never awaited: it must not cost the game a single frame, and
// a build where it fails to load is a build that simply records nothing.
import('./stats/telemetry.js')
  .then(m => m.startVisit(location.hash.startsWith('#viewer') ? 'viewer' : 'game'))
  .catch(() => { });
