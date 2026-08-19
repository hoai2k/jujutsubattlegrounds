// WORKBENCH — THE FINISHER BENCH
// ===========================================================================
// Pick a winner, a loser and a location, press the button, watch the cutscene
// full screen, land back here. That is the whole tool.
//
// WHY IT IS WORTH A PAGE. A finisher is authored data (finishers/registry.js)
// but it is judged as staging: does the fist arrive on the face, does the
// camera see it, does the floor hold both bodies. Reaching one through the
// game means winning a match with the right character against the right
// opponent on the right map, which is a minute of play per look at a two-second
// change. This is the same cutscene, one click away, on any pairing.
//
// The dropdowns are deliberately native controls. A roster of twenty-odd picks
// plus their variants wants type-ahead and a scrollbar; this is a bench, not a
// screen the game ships.
// ===========================================================================
import { ROSTER_IDS, ROSTER, allPicks, pickInfo, hex } from '../characters/index.js';
import { MAPS, MAP_IDS } from '../arena/index.js';
import { finishersFor } from '../finishers/registry.js';
import { playFinisher } from './run.js';

const KEY = 'jujutsu-battlegrounds.workbench.finishers';
const OLD_KEY = 'cursed-arena.workbench.finishers';   // pre-rename key; read-only fallback

// The defaults are the matchup the feature was built around: the Shinjuku
// showdown. Any of them can be changed, and the choice is remembered.
const DEFAULTS = { winner: 'gojo', loser: 'sukuna', map: 'shinjuku', def: 'auto' };

function loadPrefs() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY) ?? '{}') }; }
  catch (e) { return { ...DEFAULTS }; }
}
function savePrefs(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* private mode */ }
}

// Every pick in the game, in select-screen order, labelled the way the select
// screen labels it. Variants are listed separately because they can carry their
// own finisher (Shinjuku Gojo and Shibuya Yuji both do).
function pickOptions() {
  const order = new Map(ROSTER_IDS.map((id, i) => [id, i]));
  return allPicks()
    .sort((a, b) => order.get(a.split(':')[0]) - order.get(b.split(':')[0]))
    .map(pick => {
      const info = pickInfo(pick);
      const label = info.variantName || info.name;
      const has = finishersFor(pick, info.config).length > 0;
      return { pick, label, accent: info.accent, has };
    });
}

function finisherOptions(pick) {
  const info = pickInfo(pick);
  return info ? finishersFor(pick, info.config) : [];
}

function field(label, id) {
  const el = document.createElement('div');
  el.className = 'field';
  el.innerHTML = `<label for="${id}">${label}</label>
    <select id="${id}"></select>
    <div class="note"></div>`;
  return { el, select: el.querySelector('select'), note: el.querySelector('.note') };
}

function fill(select, options, value) {
  select.innerHTML = '';
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    select.appendChild(opt);
  }
  // A remembered pick that no longer exists falls back to the first entry
  // rather than leaving the control showing nothing.
  select.value = options.some(o => o.value === value) ? value : (options[0]?.value ?? '');
  return select.value;
}

export function mountFinisherBench(root) {
  const prefs = loadPrefs();
  const picks = pickOptions();

  const body = document.createElement('div');
  body.className = 'bench-body';

  const grid = document.createElement('div');
  grid.className = 'bench-grid';
  const winner = field('Winner <b>— performs it</b>', 'wb-winner');
  const loser = field('Loser <b>— takes it</b>', 'wb-loser');
  const map = field('Location', 'wb-map');
  const which = field('Finisher', 'wb-def');
  grid.append(winner.el, loser.el, map.el, which.el);

  const moment = document.createElement('div');
  moment.className = 'bench-moment';

  const actions = document.createElement('div');
  actions.className = 'bench-actions';
  const go = document.createElement('button');
  go.className = 'bench-go';
  go.innerHTML = '<span>Show finisher</span>';
  const swap = document.createElement('button');
  swap.className = 'bench-ghost';
  swap.innerHTML = '<span>Swap sides</span>';
  const status = document.createElement('div');
  status.className = 'bench-status';
  actions.append(go, swap, status);

  body.append(grid, moment, actions);
  root.append(body);

  const foot = document.createElement('div');
  foot.className = 'bench-foot';
  foot.innerHTML = `<div><kbd>Esc</kbd>back to the bench</div>
    <div><kbd>Any button</kbd>skip — once you have seen this one through in full</div>
    <div>Runs the shipped cutscene: same director, same arena, same rig.</div>`;
  root.append(foot);

  // The curtain and the escape hint belong to the bench, not to the cutscene.
  const curtain = document.createElement('div');
  curtain.className = 'bench-curtain';
  const hint = document.createElement('div');
  hint.className = 'bench-escape';
  hint.textContent = 'Esc — back to the workbench';
  hint.style.opacity = '0';

  // Black, NOW, with no transition: used on the way out, where the teardown
  // happens on the same frame and a 0.28 s fade would show it happening.
  const curtainSnap = () => {
    curtain.style.transition = 'none';
    curtain.classList.add('on');
    void curtain.offsetWidth;              // flush, so the next change animates
    curtain.style.transition = '';
  };

  const mapOptions = MAP_IDS.map(id => ({ value: id, label: MAPS[id].def.name }));

  // ---- state ---------------------------------------------------------------
  const state = { ...prefs };

  const refreshFinishers = () => {
    const list = finisherOptions(state.winner);
    const opts = [{ value: 'auto', label: list.length > 1 ? `Auto — roll one of ${list.length}` : 'Auto' }];
    for (const f of list) opts.push({ value: f.id, label: f.id });
    // Enabled even for the common single-entry case: forcing THE one entry is
    // not the same as rolling for it, because a roll also has to satisfy that
    // entry's `when`, and a bench should be able to look at a finisher whose
    // condition the current pairing does not meet.
    which.select.disabled = list.length === 0;
    state.def = fill(which.select, opts, state.def);

    const chosen = state.def === 'auto' ? list[0] : list.find(f => f.id === state.def);
    if (!list.length) {
      const label = picks.find(p => p.pick === state.winner)?.label || state.winner;
      moment.innerHTML = `<b>No finisher</b><br>${label} has no entry in finishers/registry.js — nothing to show.`;
      go.disabled = true;
      which.note.textContent = '';
    } else {
      go.disabled = false;
      moment.innerHTML = `<b>${chosen.id}</b><br>${chosen.moment || ''}`;
      // A `when` predicate is what makes the LOSER choice matter: Sukuna's
      // shrine finisher only exists against Yuji, his fire one only against
      // Megumi. Forcing an entry runs it regardless — that is the point of a
      // bench — so the note says which way it is going.
      which.note.textContent = state.def === 'auto'
        ? (list.length > 1 ? 'One is rolled at run time, filtered by the loser.' : '')
        : 'Forced — any conditions on this entry are ignored.';
    }
    // The bench takes the colour the cutscene is graded to, so changing the
    // dropdown previews something about the finisher before it runs.
    if (chosen?.color) root.style.setProperty('--ac', chosen.color);
  };

  const refreshNotes = () => {
    const w = picks.find(p => p.pick === state.winner);
    winner.note.className = 'note' + (w && !w.has ? ' warn' : '');
    winner.note.textContent = w && !w.has ? 'This pick has no finisher.' : '';
    loser.note.textContent = state.loser === state.winner
      ? 'Same pick on both sides — the director does not mind.'
      : '';
    map.note.textContent = MAPS[state.map]?.def.jp || '';
  };

  const sync = () => { refreshFinishers(); refreshNotes(); savePrefs(state); };

  const charOptions = picks.map(p => ({ value: p.pick, label: p.has ? p.label : `${p.label}  ·  no finisher` }));
  state.winner = fill(winner.select, charOptions, state.winner);
  state.loser = fill(loser.select, charOptions, state.loser);
  state.map = fill(map.select, mapOptions, state.map);
  sync();

  winner.select.onchange = () => { state.winner = winner.select.value; state.def = 'auto'; sync(); };
  loser.select.onchange = () => { state.loser = loser.select.value; sync(); };
  map.select.onchange = () => { state.map = map.select.value; sync(); };
  which.select.onchange = () => { state.def = which.select.value; sync(); };
  swap.onclick = () => {
    const w = state.winner;
    state.winner = state.loser; state.loser = w; state.def = 'auto';
    winner.select.value = state.winner; loser.select.value = state.loser;
    sync();
  };

  // ---- the run -------------------------------------------------------------
  let running = false;
  go.onclick = async () => {
    if (running || go.disabled) return;
    running = true;
    go.disabled = true;
    status.className = 'bench-status';
    status.textContent = 'Loading…';

    document.body.append(curtain, hint);
    // one frame with the curtain mounted at 0 so the transition actually runs
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    curtain.classList.add('on');
    await new Promise(r => setTimeout(r, 300));

    root.parentElement.classList.add('hidden');

    const list = finisherOptions(state.winner);
    const def = state.def === 'auto' ? null : (list.find(f => f.id === state.def) || null);

    hint.style.opacity = '1';
    setTimeout(() => { hint.style.opacity = '0'; }, 2600);

    const reason = await playFinisher({
      winner: state.winner, loser: state.loser, map: state.map, def,
      // Called the instant the run tears down, BEFORE the fullscreen exit
      // animates — the curtain has to be up by then or the bench flashes into
      // view over a half-destroyed arena.
      onExit: curtainSnap
    });

    root.parentElement.classList.remove('hidden');
    hint.remove();
    // let the bench paint under the curtain before lifting it
    await new Promise(r => setTimeout(r, 60));
    curtain.classList.remove('on');
    setTimeout(() => curtain.remove(), 400);

    status.className = 'bench-status' + (reason === 'none' ? ' err' : '');
    status.textContent = reason === 'none'
      ? 'No finisher for that winner.'
      : reason === 'aborted' ? 'Stopped.' : 'Done.';
    running = false;
    go.disabled = false;
  };

  return {
    title: 'Finishers',
    jp: '呪術廻戦 · 決め技',
    accent: hex(ROSTER[state.winner.split(':')[0]]?.accent ?? 0xb98fff)
  };
}
