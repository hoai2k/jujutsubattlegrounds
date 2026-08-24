// WORKBENCH — entry point.
// ===========================================================================
// A second page, at /workbench/, for looking at one piece of the game in
// isolation. Which piece is chosen by a query parameter:
//
//   /workbench/?edit=finishers     the finisher cutscenes
//   /workbench/?edit=models        imported 3D models: pose, skinning, clips
//   /workbench/?edit=rig           rig review: mapping + pose feedback export
//   /workbench/                    finishers — the default
//
// It is a SEPARATE HTML entry rather than a route inside the game (the way
// #viewer is) because the game's entry boots straight into character select,
// and a bench wants the page to itself: its own chrome, its own back-and-forth
// between a panel and a full-screen run, and no menu music starting under it.
// It shares everything that matters — the same stage, the same Match, the same
// director — so there is no second implementation of anything to drift.
//
// ADDING A BENCH is one entry in BENCHES below plus a module exporting
// `mount(root)`. Nothing else in the page needs to know about it.
// ===========================================================================
import '../ui/style.css';
import './bench.css';
import { mountFinisherBench } from './finishers.js';
import { mountModelBench } from './models.js';
import { mountRigBench } from './rig.js';

const BENCHES = {
  finishers: { label: 'Finishers', mount: mountFinisherBench },
  models: { label: 'Models', mount: mountModelBench },
  rig: { label: 'Rig', mount: mountRigBench }
};
const DEFAULT_BENCH = 'finishers';

function boot() {
  const want = new URLSearchParams(location.search).get('edit') || DEFAULT_BENCH;
  const id = BENCHES[want] ? want : DEFAULT_BENCH;
  const host = document.getElementById('bench-root');

  const bench = document.createElement('div');
  bench.className = 'bench';
  bench.innerHTML = `
    <div class="bench-head">
      <h1>CURSED <em>WORKBENCH</em></h1>
      <div class="jp">呪術工房</div>
      <nav class="tabs"></nav>
    </div>
    <div class="bench-rule"></div>`;
  host.append(bench);

  // The tab strip is the bench list. With one bench it is a label; the moment
  // there are two it is already the navigation, with no work to do.
  const tabs = bench.querySelector('.tabs');
  for (const [key, def] of Object.entries(BENCHES)) {
    const a = document.createElement('a');
    a.className = 'tab' + (key === id ? ' on' : '');
    a.href = '?edit=' + key;
    a.innerHTML = `<span>${def.label}</span>`;
    tabs.append(a);
  }

  BENCHES[id].mount(bench);

  // Keep the URL honest: an implicit default becomes an explicit one, so a
  // copied address always says which bench it opens. `replaceState`, so this
  // never adds a history entry the back button has to walk through.
  if (want !== id || !location.search) {
    history.replaceState(null, '', '?edit=' + id);
  }
}

// A hash change is not a route here, but a query change is: the tabs are real
// links, so the browser reloads anyway. Nothing else to wire.
boot();
