// WORKBENCH — THE MODEL BENCH (/workbench/?edit=models)
// ===========================================================================
// Where an imported rigged humanoid gets made game-ready. Models arrive in
// whatever pose their exporter left them in — this bench stands them up:
//
//   LOAD      a manifest entry, a URL, or a local file (drag/pick — nothing
//             has to be committed anywhere to be benched)
//   POSE      auto T-pose / auto game-bind, then per-bone hand adjustment,
//             because auto-posing gets a shoulder wrong on every second rig
//   CHECK     skin-weight heatmap per bone, wireframe, skeleton — the rig
//             and skinning review
//   PREVIEW   the model driven through ANY character's REAL clips by the
//             real retargeter, beside the procedural body it replaces —
//             the only test that actually answers "is this rig good for
//             the game"
//   EXPORT    everything changed, as one manifest-entry JSON
//
// Everything below the panel is the shipped ?render3d pipeline; the bench
// adds hands, not a second implementation.
// ===========================================================================
import { ROSTER_IDS, ROSTER } from '../characters/index.js';
import {
  createStage, RigSession, CANONICAL, STRESS_POSES, downloadJson, el, sec, buildLoaderUI
} from './rigcore.js';

const KEY = 'jujutsu-battlegrounds.workbench.models';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } };

export function mountModelBench(root) {
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
    onLoaded: () => { session.select(null); syncBones(); syncFit(); syncProps(); },
    // a manifest chip names the character it stands in for — follow it, so
    // the model is benched against the fighter it will actually replace
    onReference: pick => {
      const base = pick.split(':')[0];
      if (!ROSTER_IDS.includes(base)) return;
      refSel.value = base;
      prefs.char = base; save(prefs);
      clipNames = session.setReference(pick);
      syncClips();
      syncProps();
    }
  });
  sModel.append(loaderBox);

  // ---- REFERENCE ----------------------------------------------------------
  const sRef = sec(panel, 'REFERENCE — the fighter this model stands in for');
  const refSel = el('select', 'mb-select');
  for (const id of ROSTER_IDS) {
    const o = el('option'); o.value = id; o.textContent = ROSTER[id].config?.name ?? id;
    refSel.append(o);
  }
  refSel.value = ROSTER_IDS.includes(prefs.char) ? prefs.char : 'yuji';
  const ghostLab = el('label', 'mb-check', '<input type="checkbox" checked><span>Show procedural body beside it</span>');
  sRef.append(refSel, ghostLab);
  let clipNames = session.setReference(refSel.value);
  refSel.onchange = () => {
    prefs.char = refSel.value; save(prefs);
    clipNames = session.setReference(refSel.value);
    syncClips();
    syncProps();
  };
  ghostLab.querySelector('input').onchange = e => session.setGhost(e.target.checked);

  // ---- POSE ---------------------------------------------------------------
  const sPose = sec(panel, 'POSE — stand it into a bind');
  sPose.append(el('div', 'mb-hint',
    'Auto-pose aims each mapped bone at its child, top-down. <b>Game bind</b> is read ' +
    'live off the reference body and is what the retargeter aligns cleanest from; ' +
    'T-pose is the neutral everyone recognises. Then fix what auto got wrong, per bone.'));
  const rowAuto = el('div', 'mb-row');
  const bLoaded = el('button', 'mb-btn', '<span>As loaded</span>');
  const bT = el('button', 'mb-btn', '<span>Auto T-pose</span>');
  const bA = el('button', 'mb-btn', '<span>Auto game bind</span>');
  rowAuto.append(bLoaded, bT, bA);
  const boneRow = el('div', 'mb-chips');
  const sliderBox = el('div', 'mb-sliders');
  sPose.append(rowAuto, boneRow, sliderBox);
  bLoaded.onclick = () => { session.stopPreview(); session.restoreLoadedPose(); syncSliders(); };
  bT.onclick = () => { session.stopPreview(); session.autoPose('T'); syncSliders(); };
  bA.onclick = () => { session.stopPreview(); session.autoPose('A'); syncSliders(); };

  function syncBones() {
    boneRow.innerHTML = '';
    for (const c of CANONICAL) {
      const b = el('button', 'mb-chip' + (session.map[c] ? '' : ' off') + (session.selected === c ? ' on' : ''), c);
      b.onclick = () => { session.select(session.selected === c ? null : c); syncBones(); syncSliders(); };
      boneRow.append(b);
    }
  }
  function syncSliders() {
    sliderBox.innerHTML = '';
    const c = session.selected, node = c && session.map[c];
    if (!node) return;
    const e = session.getNodeEuler(node);
    sliderBox.append(el('div', 'mb-hint', `<b>${c}</b> → ${node.name} — local rotation, degrees`));
    ['X', 'Y', 'Z'].forEach((ax, i) => {
      const row = el('div', 'mb-slider');
      const lab = el('span', null, ax);
      const range = el('input'); range.type = 'range'; range.min = -180; range.max = 180; range.step = 0.5;
      const num = el('input', 'mb-num'); num.type = 'number'; num.step = 0.5;
      range.value = num.value = e[i].toFixed(1);
      const apply = v => {
        e[i] = Number(v) || 0;
        range.value = num.value = e[i];
        session.stopPreview();
        session.setNodeEuler(node, e);
      };
      range.oninput = () => apply(range.value);
      num.onchange = () => apply(num.value);
      row.append(lab, range, num);
      sliderBox.append(row);
    });
  }

  // ---- FIT ----------------------------------------------------------------
  const sFit = sec(panel, 'FIT');
  const fitRow = el('div', 'mb-row');
  const mkNum = (label, key, step) => {
    const w = el('label', 'mb-fit', `<span>${label}</span>`);
    const n = el('input', 'mb-num'); n.type = 'number'; n.step = step; n.value = session.fit[key];
    n.onchange = () => { session.fit[key] = Number(n.value) || 0; if (key === 'scale' && !session.fit.scale) session.fit.scale = 1; session.refit(); };
    w.append(n);
    return w;
  };
  fitRow.append(mkNum('scale ×', 'scale', 0.01), mkNum('y offset m', 'yOffset', 0.01), mkNum('face yaw °', 'faceYaw', 1));
  sFit.append(fitRow);
  function syncFit() {
    for (const [i, k] of ['scale', 'yOffset', 'faceYaw'].entries()) {
      fitRow.children[i].querySelector('input').value = session.fit[k];
    }
  }

  // ---- PREVIEW ------------------------------------------------------------
  const sPrev = sec(panel, 'PREVIEW — the real clips, the real retargeter');
  const prevRow = el('div', 'mb-row');
  const clipSel = el('select', 'mb-select');
  const bPlay = el('button', 'mb-btn ac', '<span>Preview clip</span>');
  const bStop = el('button', 'mb-btn', '<span>Back to pose</span>');
  prevRow.append(clipSel, bPlay, bStop);
  sPrev.append(prevRow, el('div', 'mb-hint',
    'Preview drives the imported skeleton from the reference body — what you see is ' +
    'exactly what <b>?render3d</b> ships. Leaving preview restores your bench pose.'));
  function syncClips() {
    const keep = clipSel.value;
    clipSel.innerHTML = '';
    for (const n of clipNames) { const o = el('option'); o.value = o.textContent = n; clipSel.append(o); }
    clipSel.value = clipNames.includes(keep) ? keep : 'idle';
  }
  syncClips();
  const rowStress = el('div', 'mb-chips');
  for (const name of Object.keys(STRESS_POSES)) {
    const b = el('button', 'mb-chip', name);
    b.onclick = () => {
      if (!session.startStress(name)) status.textContent = 'Load a model with a mappable Hips first.';
      [...rowStress.children].forEach(x => x.classList.toggle('on', x === b));
    };
    rowStress.append(b);
  }
  sPrev.append(el('div', 'mb-hint',
    'STRESS POSES — the rig check rather than the animation check: each drives one ' +
    'joint group to where a misplaced pivot stops being subtle.'), rowStress);
  bPlay.onclick = () => {
    [...rowStress.children].forEach(x => x.classList.remove('on'));
    if (!session.startPreview(clipSel.value)) status.textContent = 'Nothing to preview — load a model with a mappable Hips first.';
  };
  clipSel.onchange = () => { if (session.preview) session.startPreview(clipSel.value); };
  bStop.onclick = () => session.stopPreview();

  const mkCheck = (label, checked, fn) => {
    const l = el('label', 'mb-check', `<input type="checkbox"${checked ? ' checked' : ''}><span>${label}</span>`);
    l.querySelector('input').onchange = e => fn(e.target.checked);
    return l;
  };

  // ---- WEAPONS ------------------------------------------------------------
  // Only in preview: a bind pose is about the rig, and a staff through the
  // frame is in the way. In a clip or a stress pose the weapon is the point —
  // for a character whose whole battle stance is built around one, a body
  // judged without it has not been judged.
  const sProp = sec(panel, 'WEAPONS — the props, on the imported body');
  const propRow = el('div', 'mb-chips');
  const gripStatus = el('div', 'mb-status', '');
  let gripArmed = null;
  sProp.append(el('div', 'mb-hint',
    'Shown in <b>preview</b> and stress poses, hidden in the bind poses. The reference ' +
    'body keeps its own copy, so the two can be compared holding the same thing.<br>' +
    'A <b>two-handed</b> weapon needs to say where the OFF HAND goes: arm a prop below, ' +
    'then click the spot on the weapon. Rotation transfer alone leaves that hand floating ' +
    'off the haft by whatever the two bodies\' proportions differ by — the grip re-solves ' +
    'the arm onto the point, and it exports with the model.'),
    mkCheck('Show weapons in preview', true, on => session.setShowProps(on)),
    propRow, gripStatus);

  function syncProps() {
    propRow.innerHTML = '';
    const names = [...(session.ref?.model.props?.keys() ?? [])];
    if (!names.length) {
      propRow.append(el('div', 'mb-hint', 'This character carries nothing.'));
      gripStatus.textContent = '';
      return;
    }
    // A model whose weapon is modelled into its own mesh says so with
    // `keepProps: false`, and then the procedural one must not appear either —
    // it would be a second hammer, on the bench exactly as in the game.
    if (!session.keepProps) {
      propRow.append(el('div', 'mb-hint',
        'This entry sets <b>keepProps: false</b> — the weapon is modelled into the mesh, ' +
        'so the procedural one stays off. Nothing to grip here.'));
      gripStatus.textContent = '';
      return;
    }
    for (const name of names) {
      const has = !!session.gripEdits[name];
      const b = el('button', 'mb-chip' + (gripArmed === name ? ' on' : has ? '' : ' off'),
        name + (has ? ' ●' : ''));
      b.title = has
        ? `grip at [${session.gripEdits[name].at.join(', ')}] — click to re-place, then click the weapon`
        : 'click to arm, then click the point on the weapon where the off hand grips';
      b.onclick = () => {
        gripArmed = gripArmed === name ? null : name;
        gripStatus.textContent = gripArmed
          ? `Click the point on ${gripArmed} where the off hand grips it.`
          : '';
        syncProps();
      };
      propRow.append(b);
    }
    const clear = el('button', 'mb-btn', '<span>Clear grips</span>');
    clear.onclick = () => {
      for (const n of names) session.clearGrip(n);
      gripArmed = null; gripStatus.textContent = 'Grips cleared.'; syncProps();
    };
    propRow.append(clear);
  }

  // grip picking rides the same click-without-orbit rule the joint pickers use
  stage.canvas.addEventListener('pointerup', e => {
    if (!gripArmed || !stage.wasClick()) return;
    const hit = session.pickPropPoint(e);
    if (!hit) { gripStatus.textContent = 'That did not hit a weapon — preview a clip first, then click the haft.'; return; }
    if (hit.name !== gripArmed) { gripStatus.textContent = `That is ${hit.name}, not ${gripArmed}.`; return; }
    const at = session.setGripFromWorld(gripArmed, hit.point);
    gripStatus.textContent = `${gripArmed}: off hand grips at [${at.join(', ')}] in the weapon's own space.`;
    gripArmed = null;
    syncProps();
  });

  // ---- DISPLAY ------------------------------------------------------------
  const sDisp = sec(panel, 'DISPLAY');
  const dispRow = el('div', 'mb-row');
  dispRow.append(
    mkCheck('Lighting lift', true, on => session.setLift(on)),
    mkCheck('Skeleton + joints', true, on => session.setSkeleton(on)),
    mkCheck('Wireframe', false, on => session.setWireframe(on)),
    mkCheck('Weight heatmap (selected bone)', false, on => session.showWeights(on)));
  sDisp.append(dispRow);
  for (const [label, k, min, max, step] of [
    ['ambient', 'ambient', 0, 0.6, 0.01],
    ['saturation', 'saturation', 0.8, 1.8, 0.02],
    ['brightness', 'brightness', 0.6, 1.6, 0.02]
  ]) {
    const row = el('div', 'mb-slider');
    const range = el('input'); range.type = 'range';
    range.min = min; range.max = max; range.step = step; range.value = session.liftOpts[k];
    const num = el('input', 'mb-num'); num.type = 'number'; num.step = step; num.value = session.liftOpts[k];
    const apply = v => {
      const n = Number(v);
      range.value = num.value = n;
      session.setLift(session.liftOn, { [k]: n });
    };
    range.oninput = () => apply(range.value);
    num.onchange = () => apply(num.value);
    row.append(el('span', null, label[0].toUpperCase()), range, num);
    sDisp.append(row);
  }
  sDisp.append(el('div', 'mb-hint',
    'The lift keeps the model’s own materials and adds back a fraction of its own ' +
    'texture as light, so shadows lift without the colour greying out. ' +
    'Heatmap paints each vertex by how much the selected bone owns it — ' +
    'black none, red partial, yellow full. Page through the bones with it on: ' +
    'a thigh bleeding into a coat hem shows up in one glance.'));

  // ---- EXPORT -------------------------------------------------------------
  const sExp = sec(panel, 'EXPORT');
  const notes = el('textarea', 'mb-notes');
  notes.placeholder = 'Notes for the fix pass — anything you saw that the numbers don’t carry…';
  const bExport = el('button', 'mb-btn ac', '<span>Export changes</span>');
  bExport.onclick = () => {
    if (!session.model3d) { status.textContent = 'Nothing to export — load a model first.'; return; }
    session.stopPreview();
    const entry = session.exportJson('models', notes.value);
    downloadJson(entry, session.sourceLabel.replace(/\.\w+$/, '') + '.render3d.json');
    status.textContent = 'Exported — hand the JSON back and it becomes the manifest entry.';
  };
  sExp.append(notes, bExport, el('div', 'mb-hint',
    'Downloads a manifest-entry JSON: bone-map overrides, the rest-pose calibration ' +
    '(every joint you moved), fit numbers, trim offsets, two-handed grips and your notes.'));

  syncBones();
  syncProps();

  // headless drive hook, same pattern as the viewer's window.__viewer
  window.__bench = {
    session, stage,
    loadFrom: (u, l) => session.load(u, l).then(() => { syncBones(); syncFit(); syncProps(); }),
    syncProps
  };

  return { title: 'Models', jp: '模型工房' };
}
