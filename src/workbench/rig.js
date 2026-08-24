// WORKBENCH — THE RIG REVIEW BENCH (/workbench/?edit=rig)
// ===========================================================================
// The human-in-the-loop rig check: the questions a rig can only be asked by a
// person looking at it, each one answerable by changing something in the view
// and pressing EXPORT CHANGES.
//
//   1 MAPPING   every canonical bone the game animates, as chips. Selecting
//               one lights its guessed joint; wrong guess, click the right
//               joint in 3D. Green mapped, amber selected, red core-and-missing.
//   2 POSES     clips AND the stress set — arms overhead, deep squat, spine
//               twist. A clip shows whether the rig animates; a stress pose
//               shows whether it is BUILT right, because that is where a
//               misplaced pivot stops being subtle.
//   3 LANDMARKS the part only a person can do: POINT AT THE JOINTS. Every
//               alignment the retargeter builds comes from where the bones
//               sit inside the mesh, so a bone in the wrong place aims its
//               limb somewhere the clip never asked for. Marking where the
//               shoulder actually is fixes that at the source — and the
//               same marks say whether the right BONE was mapped at all.
//   4 PIVOTS    the same fix from the other direction: skin weights measure
//               where each joint is, and the dials move it by hand.
//   5 SKIN      what a bone drives that it should not — a dress bled onto by
//               an arm, a held prop bending like flesh. Click the geometry;
//               the connected piece under the cursor is the unit of repair.
//   6 LIGHTING  a small ambient lift, so a model authored for an offline
//               render is judged with its colour reaching the camera rather
//               than sunk in this scene's shadows.
//
// EXPORT CHANGES downloads one JSON carrying all of it — mapping picks, pivot
// fixes, rest-pose calibration, trims, fit and notes — which is verbatim the
// manifest entry ?render3d loads.
// ===========================================================================
import { ROSTER_IDS, ROSTER } from '../characters/index.js';
import {
  createStage, RigSession, CANONICAL, CORE, STRESS_POSES, LANDMARKS,
  downloadJson, el, sec, buildLoaderUI
} from './rigcore.js';

const KEY = 'jujutsu-battlegrounds.workbench.rig';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } };

// between them these move every joint group the game animates
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
    onLoaded: () => { session.select(null); syncAll(); },
    // a manifest chip names the character it stands in for — follow it, so
    // the mapping is reviewed against the fighter it will actually replace
    onReference: pick => {
      const base = pick.split(':')[0];
      if (!ROSTER_IDS.includes(base)) return;
      refSel.value = base;
      prefs.char = base; save(prefs);
      session.setReference(pick);
    }
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
    'could not find. Blue markers are pivots you have moved.'));
  const chipGrid = el('div', 'mb-chips');
  const assignBox = el('div', 'mb-assign');
  sMap.append(chipGrid, assignBox);

  function syncMapping() {
    chipGrid.innerHTML = '';
    for (const c of CANONICAL) {
      const mapped = !!session.map[c];
      let cls = 'mb-chip';
      if (session.selected === c) cls += ' on';
      else if (!mapped) cls += CORE.has(c) ? ' bad' : ' off';
      else if (session.jointEdits[session.map[c].name]) cls += ' moved';
      const b = el('button', cls, c + (mapped ? '' : CORE.has(c) ? ' ⚠' : ' ·'));
      b.onclick = () => { session.select(session.selected === c ? null : c); syncAll(); };
      chipGrid.append(b);
    }
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
    nodeSel.onchange = () => { session.assign(c, nodeSel.value || null); syncAll(); };
    const reset = el('button', 'mb-btn', '<span>Re-guess</span>');
    reset.onclick = () => { delete session.overrides[c]; session.remap(); syncAll(); };
    row.append(nodeSel, reset);
    assignBox.append(row);
  }
  stage.canvas.addEventListener('pointerup', e => {
    if (!stage.wasClick() || !session.model3d) return;
    // the picking modes are exclusive and explicit, so a stray click never
    // silently rewrites a mapping
    if (picking) {
      if (session.pickIsland(e)) syncSkin();
      return;
    }
    // an armed landmark takes the click; otherwise it reassigns a bone
    if (session.armedLandmark) {
      const p = session.pickSurface(e);
      if (p) { session.addLandmarkSample(session.armedLandmark, p); syncLandmarks(); }
      return;
    }
    if (!session.selected) return;
    const node = session.pickAt(e);
    if (node) { session.assign(session.selected, node.name); syncAll(); }
  });

  // ---- 2 · POSES ----------------------------------------------------------
  const sVer = sec(panel, '2 · POSES — does the body move like the game?');
  sVer.append(el('div', 'mb-hint',
    'Stand the model into the game bind first (models rarely ship in one). ' +
    '<b>Stress poses</b> are the rig check — arms overhead finds a low shoulder ' +
    'faster than any clip. <b>Clips</b> are the shipped retargeter, live.'));
  const rowBind = el('div', 'mb-row');
  const bBind = el('button', 'mb-btn', '<span>Auto game bind</span>');
  const bLoaded = el('button', 'mb-btn', '<span>As loaded</span>');
  const bStop = el('button', 'mb-btn', '<span>Stop</span>');
  rowBind.append(bBind, bLoaded, bStop);
  const rowStress = el('div', 'mb-chips');
  const rowClips = el('div', 'mb-chips');
  sVer.append(rowBind, el('div', 'mb-hint', 'STRESS'), rowStress,
    el('div', 'mb-hint', 'CLIPS'), rowClips);

  const clearActive = () => [...rowStress.children, ...rowClips.children]
    .forEach(x => x.classList.remove('on'));
  for (const name of Object.keys(STRESS_POSES)) {
    const b = el('button', 'mb-chip', name);
    b.onclick = () => {
      if (!session.startStress(name)) { status.textContent = 'Load a model with a mappable Hips first.'; return; }
      clearActive(); b.classList.add('on');
    };
    rowStress.append(b);
  }
  for (const clip of VERIFY_CLIPS) {
    const b = el('button', 'mb-chip', clip);
    b.onclick = () => {
      if (!session.startPreview(clip)) { status.textContent = 'Load a model with a mappable Hips first.'; return; }
      clearActive(); b.classList.add('on');
    };
    rowClips.append(b);
  }
  bBind.onclick = () => { session.autoPose('A'); clearActive(); syncAll(); };
  bLoaded.onclick = () => { session.stopPreview(); session.restoreLoadedPose(); clearActive(); syncAll(); };
  bStop.onclick = () => { session.stopPreview(); clearActive(); };

  // ---- 3 · LANDMARKS ------------------------------------------------------
  const sLm = sec(panel, '3 · LANDMARKS — show me where the joints are');
  sLm.append(el('div', 'mb-hint',
    'Pick a row, then <b>click that joint on the model</b>. The click lands ' +
    '<i>inside</i> the body (the ray is averaged through it), and clicking the ' +
    'same joint again from the opposite side averages the two — worth doing for ' +
    'the shoulders and hips. A pink dot is your mark; the line runs to where the ' +
    'bone currently is, so a long line is the error. Nothing has to be perfect: ' +
    'within a centimetre or two is plenty.'));
  const lmList = el('div', 'mb-lm');
  const lmRow2 = el('div', 'mb-row');
  const bLmApply = el('button', 'mb-btn ac', '<span>Move bones to marks</span>');
  const bLmCheck = el('button', 'mb-btn', '<span>Check mapping</span>');
  const bLmClear = el('button', 'mb-btn', '<span>Clear all</span>');
  lmRow2.append(bLmApply, bLmCheck, bLmClear);
  const lmOut = el('div', 'mb-hint');
  sLm.append(lmList, lmRow2, lmOut);

  function syncLandmarks() {
    lmList.innerHTML = '';
    for (const def of LANDMARKS) {
      const n = session.landmarks[def.key]?.length ?? 0;
      const armed = session.armedLandmark === def.key;
      const row = el('div', 'mb-lm-row' + (armed ? ' armed' : '') + (n ? ' set' : ''));
      const b = el('button', 'mb-lm-btn',
        `<b>${def.label}</b>${n ? ` <i>${n} mark${n > 1 ? 's' : ''}</i>` : ''}`);
      b.title = def.hint;
      b.onclick = () => {
        session.armedLandmark = armed ? null : def.key;
        session._refreshLandmarks();
        syncLandmarks();
      };
      row.append(b);
      if (n) {
        const x = el('button', 'mb-lm-x', '×');
        x.onclick = () => { session.clearLandmark(def.key); syncLandmarks(); };
        row.append(x);
      }
      lmList.append(row);
      if (armed) row.append(el('div', 'mb-lm-hint', def.hint));
    }
    const done = LANDMARKS.filter(d => session.landmarks[d.key]?.length).length;
    lmOut.innerHTML = done
      ? `<b>${done}/${LANDMARKS.length} marked.</b> Export sends the marks, the error against ` +
        'each mapped bone, and any bone the marks disagree with.'
      : 'The two shoulders and the two hip joints are worth more than all the rest put together.';
  }
  bLmApply.onclick = () => {
    const n = session.applyLandmarksToPivots();
    status.textContent = n
      ? `Moved ${n} bones onto your marks — try the stress poses again.`
      : 'No marks yet.';
    syncAll();
  };
  bLmCheck.onclick = () => {
    const rows = session.suggestFromLandmarks();
    if (!rows.length) { lmOut.textContent = 'No marks yet.'; return; }
    const bad = rows.filter(r => !r.agrees);
    lmOut.innerHTML = bad.length
      ? '<b>Mapping disagrees with your marks:</b><br>' + bad.map(r =>
        `${r.bone}: mapped to <b>${r.current}</b> (${r.currentCm} cm away) — ` +
        `nearest joint is <b>${r.nearest}</b> (${r.nearestCm} cm)`).join('<br>')
      : `<b>Mapping agrees with all ${rows.length} marks.</b> Any error left is placement, not mapping — press MOVE BONES TO MARKS.`;
  };
  bLmClear.onclick = () => { session.clearLandmarks(); session.armedLandmark = null; syncAll(); };

  // ---- 3 · PIVOTS ---------------------------------------------------------
  const sJoint = sec(panel, '4 · PIVOTS — where does each bone rotate from?');
  sJoint.append(el('div', 'mb-hint',
    'MEASURE reads the skin weights: where two bones hand over to each other ' +
    '<i>is</i> the joint, so the difference against the bone is a measurement ' +
    'rather than an opinion. Moving a pivot does <b>not</b> move the mesh — ' +
    'the inverse-binds are rebuilt, so only the rotation centre changes.'));
  const rowJ = el('div', 'mb-row');
  const bMeasure = el('button', 'mb-btn', '<span>Measure</span>');
  const bMirror = el('button', 'mb-btn', '<span>Mirror fixes L↔R</span>');
  const bResetJ = el('button', 'mb-btn', '<span>Reset pivots</span>');
  rowJ.append(bMeasure, bMirror, bResetJ);
  const jointBox = el('div', 'mb-sliders');
  sJoint.append(rowJ, jointBox);

  bMeasure.onclick = () => {
    if (!session.model3d) { status.textContent = 'Load a model first.'; return; }
    status.textContent = 'Measuring skin weights…';
    setTimeout(() => {
      const r = session.analyze();
      const worst = [...(session.suggestions?.values() ?? [])]
        .sort((a, b) => b.pctH - a.pctH).slice(0, 3)
        .map(x => `${x.canon} ${(x.dY * 100).toFixed(1)}cm`).join(', ');
      status.textContent = r ? `Measured — largest offsets: ${worst}` : 'Nothing to measure.';
      syncAll();
    }, 30);
  };
  bMirror.onclick = () => {
    const n = session.mirrorJoints();
    status.textContent = `Mirrored the corrections across ${n} pairs (the bind pose is left as authored).`;
    syncAll();
  };
  bResetJ.onclick = () => { session.resetJoints(); syncAll(); };

  function syncJoint() {
    jointBox.innerHTML = '';
    const c = session.selected;
    if (!c || !session.map[c]) return;
    const sug = session.suggestions?.get(c);
    if (sug) {
      const cm = v => (v * 100).toFixed(1);
      jointBox.append(el('div', 'mb-hint',
        `Weights put <b>${c}</b> at ${cm(sug.delta[0])}, <b>${cm(sug.delta[1])}</b>, ${cm(sug.delta[2])} cm ` +
        `from the bone (${sug.pctH.toFixed(1)}% of height, ${sug.band} verts in the band).`));
      const rowS = el('div', 'mb-row');
      for (const [label, k] of [['Snap 100%', 1], ['Snap 50%', 0.5], ['Y only', 'y']]) {
        const b = el('button', 'mb-btn', `<span>${label}</span>`);
        b.onclick = () => {
          if (k === 'y') session.nudgeJoint(c, [0, sug.delta[1], 0]);
          else session.snapJoint(c, k);
          syncAll();
        };
        rowS.append(b);
      }
      jointBox.append(rowS);
    } else {
      jointBox.append(el('div', 'mb-hint', 'Press MEASURE for a weight-derived suggestion.'));
    }
    const off = session.jointOffsetOf(c);
    jointBox.append(el('div', 'mb-hint', `<b>${c}</b> pivot offset — centimetres, world`));
    ['X', 'Y', 'Z'].forEach((ax, i) => {
      const row = el('div', 'mb-slider');
      const range = el('input'); range.type = 'range'; range.min = -20; range.max = 20; range.step = 0.1;
      const num = el('input', 'mb-num'); num.type = 'number'; num.step = 0.1;
      range.value = num.value = (off[i] * 100).toFixed(1);
      const apply = v => {
        const want = Number(v) || 0;
        range.value = num.value = want;
        const d = [0, 0, 0];
        d[i] = (want - session.jointOffsetOf(c)[i] * 100) / 100;
        session.nudgeJoint(c, d);
        session._refreshMarkers();
      };
      range.oninput = () => apply(range.value);
      num.onchange = () => apply(num.value);
      row.append(el('span', null, ax), range, num);
      jointBox.append(row);
    });
    jointBox.append(el('div', 'mb-hint', `<b>${c}</b> retarget trim — world degrees, on top of every pose`));
    const cur = session.rotOffset[c] ?? [0, 0, 0];
    const vals = [...cur];
    ['X', 'Y', 'Z'].forEach((ax, i) => {
      const row = el('div', 'mb-slider');
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
      row.append(el('span', null, ax), range, num);
      jointBox.append(row);
    });
  }

  // ---- 5 · SKIN -----------------------------------------------------------
  const sSkin = sec(panel, '5 · SKIN — what is a bone driving that it shouldn’t?');
  sSkin.append(el('div', 'mb-hint',
    'Turn on <b>Pick geometry</b>, then click a part of the model: it selects the ' +
    'connected piece under the cursor (a skirt is not joined to a sleeve, a hammer ' +
    'is not joined to a hand) and lists what drives it. Then either make it ' +
    '<b>rigid</b> to one bone — the fix for a held prop that bends like flesh — or ' +
    '<b>drop</b> a bone that has bled onto it, which is why a dress swings when an ' +
    'arm moves.'));
  const skinRow = el('div', 'mb-row');
  const pickChk = el('label', 'mb-check', '<input type="checkbox"><span>Pick geometry</span>');
  const bSkinClear = el('button', 'mb-btn', '<span>Clear repairs</span>');
  skinRow.append(pickChk, bSkinClear);
  const skinOut = el('div', 'mb-assign');
  sSkin.append(skinRow, skinOut);
  let picking = false;
  pickChk.querySelector('input').onchange = e => { picking = e.target.checked; };
  bSkinClear.onclick = () => { session.clearWeightOps(); syncSkin(); };

  function syncSkin() {
    skinOut.innerHTML = '';
    const p = session.pickedIsland;
    if (p) {
      skinOut.append(el('div', 'mb-hint',
        `Selected: <b>${p.verts} vertices</b> — driven by ` +
        p.bones.slice(0, 4).map(b => `${b.name} ${(b.share * 100).toFixed(0)}%`).join(', ')));
      const row = el('div', 'mb-row');
      const top = p.bones[0];
      if (top) {
        const b = el('button', 'mb-btn ac', `<span>Rigid → ${top.name}</span>`);
        b.onclick = () => { session.addWeightOp({ at: p.at, rigid: top.name }); syncAll(); };
        row.append(b);
      }
      // drop whichever limb group is the minority — the bled one
      const minor = p.bones.filter(b => b.share < 0.25).map(b => b.name);
      if (minor.length) {
        const b = el('button', 'mb-btn', `<span>Drop ${minor.length} minor bone(s)</span>`);
        b.title = minor.join(', ');
        b.onclick = () => { session.addWeightOp({ at: p.at, drop: minor }); syncAll(); };
        row.append(b);
      }
      skinOut.append(row);
      const perBone = el('div', 'mb-chips');
      for (const b of p.bones.slice(0, 6)) {
        const x = el('button', 'mb-chip', `drop ${b.name}`);
        x.onclick = () => { session.addWeightOp({ at: p.at, drop: [b.name] }); syncAll(); };
        perBone.append(x);
      }
      skinOut.append(perBone);
    } else {
      skinOut.append(el('div', 'mb-hint', 'Nothing selected — tick <b>Pick geometry</b> and click the model.'));
    }
    if (session.weightOps.length) {
      skinOut.append(el('div', 'mb-hint',
        `<b>${session.weightOps.length} repair(s):</b> ` + session.weightOps.map(o =>
          o.rigid ? `rigid→${o.rigid}` : `drop ${o.drop.join('/')}`).join(', ')));
    }
  }

  // ---- 5 · LIGHTING -------------------------------------------------------
  const sLook = sec(panel, '6 · LIGHTING — a small lift, not a restyle');
  sLook.append(el('div', 'mb-hint',
    'The model keeps its own materials. <b>Ambient</b> adds back a fraction of ' +
    'its own texture as light, which lifts the shadows and makes the blue read ' +
    'as blue rather than black — an ambient <i>light</i> would only add grey. ' +
    '<b>Saturation</b> is a gentle push on top. Both export with the model.'));
  const lookRow = el('div', 'mb-row');
  const liftChk = el('label', 'mb-check', '<input type="checkbox" checked><span>Lighting lift</span>');
  liftChk.querySelector('input').onchange = e => session.setLift(e.target.checked);
  const wireChk = el('label', 'mb-check', '<input type="checkbox"><span>Wireframe</span>');
  wireChk.querySelector('input').onchange = e => session.setWireframe(e.target.checked);
  const weightChk = el('label', 'mb-check', '<input type="checkbox"><span>Weights</span>');
  weightChk.querySelector('input').onchange = e => session.showWeights(e.target.checked);
  lookRow.append(liftChk, wireChk, weightChk);
  sLook.append(lookRow);
  for (const [label, k, min, max, step] of [
    ['ambient', 'ambient', 0, 0.6, 0.01],
    ['saturation', 'saturation', 0.8, 1.8, 0.02],
    ['brightness', 'brightness', 0.6, 1.6, 0.02]
  ]) {
    const row = el('div', 'mb-slider');
    const range = el('input'); range.type = 'range';
    range.min = min; range.max = max; range.step = step;
    range.value = session.liftOpts[k];
    const num = el('input', 'mb-num'); num.type = 'number'; num.step = step;
    num.value = session.liftOpts[k];
    const apply = v => {
      const n = Number(v);
      range.value = num.value = n;
      session.setLift(session.liftOn, { [k]: n });
    };
    range.oninput = () => apply(range.value);
    num.onchange = () => apply(num.value);
    row.append(el('span', null, label[0].toUpperCase()), range, num);
    sLook.append(row);
  }

  // ---- 7 · EXPORT ---------------------------------------------------------
  const sExp = sec(panel, '7 · EXPORT CHANGES');
  const notes = el('textarea', 'mb-notes');
  notes.placeholder = 'What still looks wrong, what you could not fix here, anything the numbers don’t carry…';
  const bExport = el('button', 'mb-btn ac', '<span>Export changes</span>');
  bExport.onclick = () => {
    if (!session.model3d) { status.textContent = 'Nothing to export — load a model first.'; return; }
    session.stopPreview();
    clearActive();
    const entry = session.exportJson('rig', notes.value);
    downloadJson(entry, session.sourceLabel.replace(/\.\w+$/, '') + '.render3d.json');
    status.textContent = 'Exported — hand the JSON back and the fixes get applied.';
  };
  sExp.append(notes, bExport, el('div', 'mb-hint',
    'One JSON: mapping picks, pivot fixes (in cm for reading, exact for replay), ' +
    'rest pose, trims, look dials and your notes. It is the manifest entry ' +
    '<b>?render3d</b> loads.'));

  function syncAll() { syncMapping(); syncAssign(); syncLandmarks(); syncJoint(); syncSkin(); }
  syncAll();

  window.__bench = { session, stage, syncAll, loadFrom: (u, l) => session.load(u, l).then(syncAll) };
  return { title: 'Rig', jp: '骨組検査' };
}
