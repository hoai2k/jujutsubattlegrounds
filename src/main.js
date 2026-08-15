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
