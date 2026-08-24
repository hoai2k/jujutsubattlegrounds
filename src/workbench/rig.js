// WORKBENCH — THE RIG REVIEW BENCH (/workbench/?edit=rig)
// ===========================================================================
// The human-in-the-loop rig check. A rig can only really be verified by a
// person looking at it, so this bench is built around the two looks that
// catch everything:
//
//   1. WALK THE MAPPING. Every canonical bone the game animates, as a list;
//      selecting one lights its guessed joint up in the view. Wrong guess?
//      Click the correct joint in 3D (or pick it from the node list) and the
//      assignment changes on the spot. Green = mapped, amber = selected,
//      red = a core bone the guesser could not find.
//
//   2. WATCH THE POSES. One button per verification pose — the game bind,
//      then the clips that stress every joint group (idle, run, punch,
//      block, knockdown, getup). The model is driven by the SHIPPED
//      retargeter, so what looks right here is right in the game. What looks
//      wrong gets trimmed per bone with the offset dials, live, while the
//      clip loops.
//
// Then EXPORT CHANGES downloads one JSON carrying every correction — the
// mapping picks, the rest-pose calibration, the trims, the fit numbers and
// free-text notes — which is exactly the manifest entry the game loads.
// ===========================================================================
import { ROSTER_IDS, ROSTER } from '../characters/index.js';
import {
  createStage, RigSession, CANONICAL, CORE, downloadJson, el, sec, buildLoaderUI
} from './rigcore.js';

const KEY = 'jujutsu-battlegrounds.workbench.rig';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } };

// the clip set that between them moves every joint group the game animates
const VERIFY_CLIPS = ['idle', 'walk', 'run', 'punch3', 'block', 'hitHeavy', 'knockdown', 'getup'];

export function mountRigBench(root) {
  const prefs = { char: 'yuji', url: '', ...load() };

  const body = el('div', 'mb-wrap');
  const panel = el('div', 'mb-panel');
  const view = el('div', 'mb-view');
  body.append(panel, view);
  root.append(body);

  const stage = createStage(view);
  const session = new RigSession(stage);

  // ---- MODEL --------------------------------------------------------------
  const sModel = sec(panel, 'MODEL');
  const { box: loaderBox, status } = buildLoaderUI(session, {
    prefs, save,
    onLoaded: () => { session.select(null); syncMapping(); }
  });
  sModel.append(loaderBox);

  // ---- REFERENCE ----------------------------------------------------------
  const sRef = sec(panel, 'REFERENCE');
  const refSel = el('select', 'mb-select');
  for (const id of ROSTER_IDS) {
    const o = el('option'); o.value = id; o.textContent = ROSTER[id].config?.name ?? id;
    refSel.append(o);
  }
  refSel.value = ROSTER_IDS.includes(prefs.char) ? prefs.char : 'yuji';
  sRef.append(refSel);
  session.setReference(refSel.value);
  refSel.onchange = () => { prefs.char = refSel.value; save(prefs); session.setReference(refSel.value); };

  // ---- 1 · MAPPING --------------------------------------------------------
  const sMap = sec(panel, '1 · MAPPING — is every joint the right joint?');
  sMap.append(el('div', 'mb-hint',
    'Select a bone, check the lit joint in the view. Wrong? <b>Click the correct ' +
    'joint in 3D</b> or pick its node below. Red chips are core bones the guesser ' +
    'could not find — those must be assigned by hand.'));
  const chipGrid = el('div', 'mb-chips');
  const assignBox = el('div', 'mb-assign');
  sMap.append(chipGrid, assignBox);

  function chipClass(c) {
    const mapped = !!session.map[c];
    let cls = 'mb-chip';
    if (session.selected === c) cls += ' on';
    else if (!mapped) cls += CORE.has(c) ? ' bad' : ' off';
    return cls;
  }
  function syncMapping() {
    chipGrid.innerHTML = '';
    for (const c of CANONICAL) {
      const b = el('button', chipClass(c), c + (session.map[c] ? '' : CORE.has(c) ? ' ⚠' : ' ·'));
      b.onclick = () => { session.select(session.selected === c ? null : c); syncMapping(); };
      chipGrid.append(b);
    }
    syncAssign();
    syncTrim();
  }
  function syncAssign() {
    assignBox.innerHTML = '';
    const c = session.selected;
    if (!c) return;
    const cur = session.map[c];
    assignBox.append(el('div', 'mb-hint',
      `<b>${c}</b> → ${cur ? cur.name : '<i>unmapped</i>'} — click a joint in the view, or:`));
    const row = el('div', 'mb-row');
    const nodeSel = el('select', 'mb-select');
    const none = el('option'); none.value = ''; none.textContent = '· none (drop this bone)';
    nodeSel.append(none);
    for (const n of [...session.nodes].sort((a, b) => a.name.localeCompare(b.name))) {
      const o = el('option'); o.value = o.textContent = n.name;
      nodeSel.append(o);
    }
    nodeSel.value = cur?.name ?? '';
    nodeSel.onchange = () => { session.assign(c, nodeSel.value || null); syncMapping(); };
    const reset = el('button', 'mb-btn', '<span>Re-guess</span>');
    reset.onclick = () => { delete session.overrides[c]; session.remap(); syncMapping(); };
    row.append(nodeSel, reset);
    assignBox.append(row);
  }
  // click-to-pick: a clean click (not an orbit-drag) while a bone is selected
  stage.canvas.addEventListener('pointerup', e => {
    if (!stage.wasClick() || !session.selected || !session.model3d) return;
    const node = session.pickAt(e);
    if (node) { session.assign(session.selected, node.name); syncMapping(); }
  });

  // ---- 2 · POSES ----------------------------------------------------------
  const sVer = sec(panel, '2 · POSES — does the body move like the game?');
  sVer.append(el('div', 'mb-hint',
    'First stand the model into the game bind (models rarely ship in one). Then ' +
    'watch each pose: same retargeter the game runs. Trim a joint that sits wrong ' +
    'with the dials — they apply live while the clip loops.'));
  const rowBind = el('div', 'mb-row');
  const bBind = el('button', 'mb-btn', '<span>Auto game bind</span>');
  const bLoaded = el('button', 'mb-btn', '<span>As loaded</span>');
  const bStop = el('button', 'mb-btn', '<span>Stop — bench pose</span>');
  rowBind.append(bBind, bLoaded, bStop);
  const rowClips = el('div', 'mb-row');
  for (const clip of VERIFY_CLIPS) {
    const b = el('button', 'mb-chip', clip);
    b.onclick = () => {
      if (!session.startPreview(clip)) status.textContent = 'Load a model with a mappable Hips first.';
      [...rowClips.children].forEach(x => x.classList.toggle('on', x === b));
    };
    rowClips.append(b);
  }
  const trimBox = el('div', 'mb-sliders');
  sVer.append(rowBind, rowClips, trimBox);
  bBind.onclick = () => { session.stopPreview(); session.autoPose('A'); };
  bLoaded.onclick = () => { session.stopPreview(); session.restoreLoadedPose(); };
  bStop.onclick = () => {
    session.stopPreview();
    [...rowClips.children].forEach(x => x.classList.remove('on'));
  };

  function syncTrim() {
    trimBox.innerHTML = '';
    const c = session.selected;
    if (!c) return;
    trimBox.append(el('div', 'mb-hint', `<b>${c}</b> trim — world-space degrees, rides on top of every pose`));
    const cur = session.rotOffset[c] ?? [0, 0, 0];
    const vals = [...cur];
    ['X', 'Y', 'Z'].forEach((ax, i) => {
      const row = el('div', 'mb-slider');
      const lab = el('span', null, ax);
      const range = el('input'); range.type = 'range'; range.min = -60; range.max = 60; range.step = 0.5;
      const num = el('input', 'mb-num'); num.type = 'number'; num.step = 0.5;
      range.value = num.value = vals[i];
      const apply = v => {
        vals[i] = Number(v) || 0;
        range.value = num.value = vals[i];
        session.setRotOffset(c, [...vals]);
      };
      range.oninput = () => apply(range.value);
      num.onchange = () => apply(num.value);
      row.append(lab, range, num);
      trimBox.append(row);
    });
  }

  // ---- 3 · EXPORT ---------------------------------------------------------
  const sExp = sec(panel, '3 · EXPORT CHANGES');
  const notes = el('textarea', 'mb-notes');
  notes.placeholder = 'What still looks wrong, what you could not fix here, anything the numbers don’t carry…';
  const bExport = el('button', 'mb-btn ac', '<span>Export changes</span>');
  bExport.onclick = () => {
    if (!session.model3d) { status.textContent = 'Nothing to export — load a model first.'; return; }
    session.stopPreview();
    const entry = session.exportJson('rig', notes.value);
    downloadJson(entry, session.sourceLabel.replace(/\.\w+$/, '') + '.render3d.json');
    status.textContent = 'Exported — hand the JSON back and the fixes get applied.';
  };
  sExp.append(notes, bExport, el('div', 'mb-hint',
    'One JSON: your mapping picks, the rest-pose calibration, every trim, the fit ' +
    'numbers and your notes. It is the exact manifest entry <b>?render3d</b> loads.'));

  syncMapping();

  // headless drive hook, same pattern as the viewer's window.__viewer
  window.__bench = { session, stage, loadFrom: (u, l) => session.load(u, l).then(syncMapping), syncMapping };

  return { title: 'Rig', jp: '骨組検査' };
}
