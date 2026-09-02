// fable5.1 entry. Everything under fable5.1/ is a separate build of the game
// — it shares nothing with ../src at runtime, by rule (see docs/fable5.1-direction.md).
import '../ui/style.css';

const boot = async () => {
  const q = new URLSearchParams(location.search);
  if (q.has('bench')) {
    const { startBench } = await import('../bench/index.js');
    startBench(q.get('bench'));
  } else if (location.hash.startsWith('#viewer')) {
    const { startViewer } = await import('../bench/viewer.js');
    startViewer();
  } else {
    const { startGame } = await import('./game.js');
    startGame();
  }
};
window.addEventListener('hashchange', () => location.reload());
boot();
