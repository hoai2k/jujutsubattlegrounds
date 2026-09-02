// WORKBENCH — THE FACES BENCH (/workbench/?edit=faces)
// ===========================================================================
// Every character, built twice — once on the classic head, once on the
// sculpted one — and, where public/models/manifest.json has one, a third time
// on its imported rigged model, all three standing in a row at head height
// and playing the same clip. The question it answers is the one a contact
// sheet cannot: not "does the sculpted head look better in general" but "is
// THIS face better, or did the sculpt break the scar / the mask / the second
// pair of eyes this character draws at the old face plane".
//
// The answer per character is a DECISION — classic, sculpt or model — and the
// bench exports the set as the `HEAD_STYLE` table in
// src/art/builders/headstyle.js, which is the single place the roster reads
// it from. Nothing in the character files changes when a face is reverted.
//
// The three bodies are built by the SAME builders the game uses, with the
// head style forced per build through headstyle.js's override; the imported
// body goes through the shipped ?render3d attach on top of a third procedural
// build, exactly as the game would do it.
// ===========================================================================
import * as THREE from 'three';
import { ROSTER_IDS, ROSTER } from '../characters/index.js';
import { makeClips } from '../art/anim/index.js';
import { AnimPlayer } from '../art/anim/player.js';
import { HEAD_STYLE, setHeadStyleOverride } from '../art/builders/headstyle.js';
import { forceRender3D, importedModelFor, maybeAttachRender3D } from '../art/rig3d/render3d.js';
import { createStage, el, sec, downloadJson } from './rigcore.js';

const KEY = 'jujutsu-battlegrounds.workbench.faces';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } };

const VERSIONS = [
  { key: 'classic', label: 'Classic', note: 'the head that shipped' },
  { key: 'sculpt', label: 'Sculpted', note: 'brow, sockets, nose in the mesh' },
  { key: 'model', label: 'Imported model', note: 'public/models, via ?render3d' }
];
const ANGLES = { front: 0, 'three-quarter': 0.6, profile: Math.PI / 2, back: Math.PI };

export function mountFacesBench(root) {
  const prefs = { char: 'yuji', clip: 'idle', angle: 'three-quarter', turntable: false, decisions: {}, ...load() };
  const name = id => ROSTER[id].config?.name ?? id;
  const rosterDefault = id => HEAD_STYLE[id] ?? 'sculpt';
  const decision = id => prefs.decisions[id] ?? rosterDefault(id);

  const body = el('div', 'mb-wrap');
  const panel = el('div', 'mb-panel');
  const view = el('div', 'mb-view');
  body.append(panel, view);
  root.append(body);

  const stage = createStage(view);
  forceRender3D(true);

  // the row of bodies lives in one group so a turntable spins all of them
  const row = new THREE.Group();
  stage.scene.add(row);
  let live = [];              // [{key, model, player}]
  let liveId = null;
  let hasModel = new Map();   // id -> manifest entry | null

  // ---- the labels under each body -------------------------------------------
  const labels = el('div', 'fb-labels');
  view.append(labels);

  // ---- build ----------------------------------------------------------------
  function buildOne(id, key) {
    setHeadStyleOverride(key === 'model' ? 'classic' : key);
    let model;
    try { model = ROSTER[id].buildModel(); }
    finally { setHeadStyleOverride(null); }
    const player = new AnimPlayer(model.bones, makeClips(id));
    if (key === 'model') maybeAttachRender3D(model, id);
    return { key, model, player };
  }
  function clearLive() {
    for (const l of live) row.remove(l.model.group);
    live = [];
  }
  function show(id) {
    liveId = id;
    clearLive();
    const keys = ['classic', 'sculpt', ...(hasModel.get(id) ? ['model'] : [])];
    const gap = keys.length === 3 ? 0.58 : 0.38;
    keys.forEach((key, i) => {
      const entry = buildOne(id, key);
      entry.model.group.position.x = (i - (keys.length - 1) / 2) * gap;
      row.add(entry.model.group);
      live.push(entry);
    });
    playClip(prefs.clip);
    frame();
    syncLabels();
    syncRoster();
    syncChoice();
  }
  function playClip(clip) {
    for (const l of live) {
      const c = l.player.has(clip) ? clip : 'idle';
      l.player.play(c, { fade: 0, restart: true });
      l.model.resetSprings?.();
    }
  }
  function frame() {
    const m = live[0]?.model;
    const y = m?.m?.headC?.y ?? 1.5;
    const n = live.length;
    stage.frameOn(new THREE.Vector3(0, y, 0), n === 3 ? 1.7 : 1.1);
    stage.orbit(ANGLES[prefs.angle] ?? 0.6, 0.02);
  }
  stage.onFrame = dt => {
    for (const l of live) { l.player.update(dt); l.model.update(dt); }
    if (prefs.turntable) row.rotation.y += dt * 0.45;
  };

  function syncLabels() {
    labels.innerHTML = '';
    labels.style.gridTemplateColumns = `repeat(${live.length}, 1fr)`;
    for (const l of live) {
      const v = VERSIONS.find(x => x.key === l.key);
      const d = decision(liveId) === l.key;
      const b = el('button', 'fb-label' + (d ? ' on' : ''),
        `${v.label}${d ? ' · chosen' : ''}<small>${v.note}</small>`);
      b.onclick = () => choose(l.key);
      labels.append(b);
    }
  }

  // ---- ROSTER ---------------------------------------------------------------
  const sRoster = sec(panel, 'THE ROSTER — one decision each');
  sRoster.append(el('div', 'mb-hint',
    'Pick a character to stand its heads side by side. The badge is the current ' +
    'decision: <b>S</b> sculpted, <b>C</b> classic, <b>M</b> imported model. Unlisted in the ' +
    'table means sculpted.'));
  const roster = el('div', 'fb-roster');
  sRoster.append(roster);
  function syncRoster() {
    roster.innerHTML = '';
    for (const id of ROSTER_IDS) {
      const d = decision(id);
      const chip = el('button', 'fb-chip' + (id === liveId ? ' on' : ''),
        `<span>${name(id)}</span><span class="fb-badge ${d}">${d[0].toUpperCase()}</span>`);
      chip.onclick = () => { prefs.char = id; save(prefs); show(id); };
      roster.append(chip);
    }
  }

  // ---- THIS CHARACTER ---------------------------------------------------------
  const sChoice = sec(panel, 'THIS CHARACTER');
  const choiceTitle = el('div', 'mb-hint');
  const choice = el('div', 'fb-choice');
  const choiceNote = el('div', 'mb-hint');
  sChoice.append(choiceTitle, choice, choiceNote);
  function choose(key) {
    if (key === 'model' && !hasModel.get(liveId)) return;
    if (key === rosterDefault(liveId)) delete prefs.decisions[liveId];
    else prefs.decisions[liveId] = key;
    save(prefs);
    syncLabels(); syncRoster(); syncChoice(); syncExport();
  }
  function syncChoice() {
    choiceTitle.innerHTML = `<b>${name(liveId)}</b> — decision: <b>${decision(liveId)}</b>` +
      (prefs.decisions[liveId] ? ' (changed here)' : ' (the roster default)');
    choice.innerHTML = '';
    for (const v of VERSIONS) {
      const b = el('button', 'mb-btn' + (decision(liveId) === v.key ? ' on' : ''), `<span>${v.label}</span>`);
      if (v.key === 'model' && !hasModel.get(liveId)) b.disabled = true;
      b.onclick = () => choose(v.key);
      choice.append(b);
    }
    choiceNote.innerHTML = hasModel.get(liveId)
      ? 'The imported body loads in a moment beside the two heads. Choosing it makes this ' +
        'character play on the model by default, without <b>?render3d</b>.'
      : 'No imported model in <b>public/models/manifest.json</b> for this character.';
  }

  // ---- VIEW -------------------------------------------------------------------
  const sView = sec(panel, 'VIEW');
  const rowView = el('div', 'mb-row');
  const clipSel = el('select', 'mb-select');
  rowView.append(clipSel);
  const angleRow = el('div', 'mb-chips');
  for (const a of Object.keys(ANGLES)) {
    const b = el('button', 'mb-chip' + (prefs.angle === a ? ' on' : ''), a);
    b.onclick = () => {
      prefs.angle = a; prefs.turntable = false; save(prefs);
      row.rotation.y = 0; frame();
      [...angleRow.children].forEach(c => c.classList.toggle('on', c === b));
      turn.querySelector('input').checked = false;
    };
    angleRow.append(b);
  }
  const turn = el('label', 'mb-check', `<input type="checkbox"${prefs.turntable ? ' checked' : ''}><span>Turntable</span>`);
  turn.querySelector('input').onchange = e => { prefs.turntable = e.target.checked; save(prefs); };
  sView.append(rowView, angleRow, turn, el('div', 'mb-hint',
    'Drag to orbit, wheel to zoom. Every body plays the same clip from the same ' +
    'frame, so a difference between them is the head, never the pose.'));
  function syncClips() {
    clipSel.innerHTML = '';
    const names = live[0] ? [...live[0].player.clips.keys()] : ['idle'];
    for (const n of names) { const o = el('option'); o.value = o.textContent = n; clipSel.append(o); }
    clipSel.value = names.includes(prefs.clip) ? prefs.clip : 'idle';
  }
  clipSel.onchange = () => { prefs.clip = clipSel.value; save(prefs); playClip(prefs.clip); };

  // ---- CONTACT SHEET ------------------------------------------------------------
  // Every character, classic beside sculpted, front and three-quarter, as one
  // image per character in the panel — the scan that finds the three faces
  // worth standing in the view. Rendered with the bench's own renderer into
  // a 2D canvas, cell by cell, synchronously (no preserveDrawingBuffer).
  // Procedural only: the imported bodies load asynchronously and belong in
  // the live view.
  const sSheet = sec(panel, 'CONTACT SHEET — the whole roster, both heads');
  const bSheet = el('button', 'mb-btn', '<span>Render every face</span>');
  const sheetStatus = el('div', 'mb-status');
  const sheet = el('div', 'fb-sheet');
  sSheet.append(bSheet, sheetStatus, sheet);
  bSheet.onclick = async () => {
    bSheet.disabled = true;
    sheet.innerHTML = '';
    const keep = liveId;
    const cw = 150, ch = 170, yaws = [0, 0.7];
    const cam = new THREE.PerspectiveCamera(30, cw / ch, 0.05, 100);
    const { renderer, scene } = stage;
    for (const [i, id] of ROSTER_IDS.entries()) {
      sheetStatus.textContent = `rendering ${name(id)} (${i + 1}/${ROSTER_IDS.length})`;
      await new Promise(r => setTimeout(r, 0));
      clearLive();
      const pair = ['classic', 'sculpt'].map(k => buildOne(id, k));
      const canvas = document.createElement('canvas');
      canvas.width = cw * 4; canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b0d14'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      renderer.setSize(cw, ch, false);
      let col = 0;
      for (const yaw of yaws) {
        for (const p of pair) {
          row.add(p.model.group);
          p.model.group.position.x = 0;
          p.player.play(prefs.clip, { fade: 0, restart: true });
          p.model.resetSprings?.();
          for (let s = 0; s < 24; s++) { p.player.update(1 / 60); p.model.update(1 / 60); }
          const hy = p.model.m?.headC?.y ?? 1.5, d = 0.62;
          cam.position.set(Math.sin(yaw) * d, hy + 0.02, Math.cos(yaw) * d);
          cam.lookAt(0, hy, 0);
          renderer.render(scene, cam);
          ctx.drawImage(renderer.domElement, col * cw, 0, cw, ch);
          ctx.fillStyle = '#ffd86b'; ctx.font = 'bold 11px monospace';
          ctx.fillText(p.key, col * cw + 6, 14);
          row.remove(p.model.group);
          col++;
        }
      }
      const wrap = el('div');
      wrap.append(el('div', 'fb-sheet-name', `${name(id)} · ${decision(id)}`));
      const img = new Image(); img.src = canvas.toDataURL('image/png'); img.alt = name(id);
      img.style.cursor = 'pointer';
      img.onclick = () => { prefs.char = id; save(prefs); show(id); syncClips(); };
      wrap.append(img);
      sheet.append(wrap);
    }
    stage.resize();
    sheetStatus.textContent = 'done — click a strip to stand that character in the view';
    bSheet.disabled = false;
    show(keep);
  };

  // ---- EXPORT -------------------------------------------------------------------
  const sExport = sec(panel, 'EXPORT — the roster\'s table');
  const code = el('textarea', 'fb-code');
  code.readOnly = true;
  const rowExp = el('div', 'mb-row');
  const bCopy = el('button', 'mb-btn ac', '<span>Copy table</span>');
  const bDl = el('button', 'mb-btn', '<span>Download decisions</span>');
  const bReset = el('button', 'mb-btn', '<span>Forget my changes</span>');
  rowExp.append(bCopy, bDl, bReset);
  sExport.append(el('div', 'mb-hint',
    'Paste over <b>HEAD_STYLE</b> in <b>src/art/builders/headstyle.js</b>. Only characters ' +
    'that are not sculpted are listed; everyone else takes the sculpted head.'), code, rowExp);
  function tableSource() {
    const lines = [];
    for (const id of ROSTER_IDS) {
      const d = decision(id);
      if (d !== 'sculpt') lines.push(`  ${id}: '${d}'`);
    }
    return `export const HEAD_STYLE = {\n${lines.join(',\n')}\n};`;
  }
  function syncExport() { code.value = tableSource(); }
  bCopy.onclick = async () => {
    try { await navigator.clipboard.writeText(code.value); bCopy.querySelector('span').textContent = 'Copied'; }
    catch { code.select(); }
    setTimeout(() => { bCopy.querySelector('span').textContent = 'Copy table'; }, 1200);
  };
  bDl.onclick = () => downloadJson({
    decisions: Object.fromEntries(ROSTER_IDS.map(id => [id, decision(id)])),
    changed: { ...prefs.decisions }
  }, 'head-style-decisions.json');
  bReset.onclick = () => { prefs.decisions = {}; save(prefs); syncLabels(); syncRoster(); syncChoice(); syncExport(); };

  // ---- boot -----------------------------------------------------------------------
  (async () => {
    const found = await Promise.all(ROSTER_IDS.map(id => importedModelFor(id).catch(() => null)));
    hasModel = new Map(ROSTER_IDS.map((id, i) => [id, found[i]]));
    show(ROSTER_IDS.includes(prefs.char) ? prefs.char : 'yuji');
    syncClips();
    syncExport();
  })();
}
