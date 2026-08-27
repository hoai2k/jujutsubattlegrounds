// WORKBENCH — THE VERIFICATION BENCH (/workbench/?edit=verification)
// ===========================================================================
// A QUEUE OF QUESTIONS ONLY A PERSON CAN ANSWER.
//
// Every other harness in this repo exists to remove a human from a loop:
// modelcheck runs the real load path, symmetry.mjs measures the rig against
// its own mirror, camaudit projects 45,000 shots. What is left over is the
// residue — the handful of facts that are not derivable from the file at all,
// because they need eyes on the mesh:
//
//   · where is the shoulder joint INSIDE this arm? (the weight-band estimator
//     answers where the MESH thinks it is, which is useless on exactly the
//     models where it matters — a smeared elbow points 18 cm up the forearm)
//   · is this bind pose a rest, or a fighting stance? (symmetry.mjs guesses
//     from a threshold; the person who exported it KNOWS)
//
// The other benches let you go and find those out. This one ASKS, one
// question at a time, with the view already framed on the thing being asked
// about — and hands back a JSON of decisions that the tools can consume.
//
// WHY A QUEUE. The rig bench puts all seventeen landmarks on screen as a
// checklist, which is the right shape when you are inspecting and the wrong
// shape when you are answering: a checklist asks you to decide what to do
// next seventeen times, and it does not fit on a phone. A queue decides for
// you, frames the shot for you, and is finishable. It is the difference
// between a form and a conversation.
//
// MOBILE IS NOT AN AFTERTHOUGHT. This is the one bench whose input is a
// finger pointing at a model, which is a thing a touch screen is BETTER at
// than a mouse. So on a phone the VIEWER IS THE PAGE — a fixed layer sized in
// `dvh`, owing nothing to the page's scroll or to a browser toolbar that
// grows and shrinks — and everything else is a panel that opens over it, ONE
// AT A TIME, from a bar along the bottom:
//
//   QUEUE   every question, its answer, jump to any of them
//   VIEW    the camera controls, as buttons rather than gestures
//   SETUP   the model, the fighter it stands in for, the way out
//   (the question itself, which opens by tapping the bar's own title)
//
// Nothing is ever half-visible: a panel is either open over the viewer or
// gone, and the two questions you answer IN a panel (a choice, a note) open
// it for you while the fifteen you answer by POINTING leave the screen clear.
// What stays on screen either way is one bar: which question this is, how far
// through, and the way back and forward.
//
// The same panels are a rail down the right on a wide screen, where there is
// room to leave the viewer alone — so there is one set of panels and one
// runner, not a desktop bench and a phone bench that drift apart.
//
// ADDING A QUEUE is one entry in QUEUES below: a label, a blurb and a `build`
// that returns question objects. The four kinds (`point`, `choice`, `note`,
// `done`) are enough for most things worth asking, and the runner, the
// framing, the persistence and the export are already written.
// ===========================================================================
import * as THREE from 'three';
import { ROSTER_IDS, ROSTER } from '../characters/index.js';
import {
  createStage, RigSession, LANDMARKS, downloadJson, el, sec, buildLoaderUI
} from './rigcore.js';

const KEY = 'jujutsu-battlegrounds.workbench.verification';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode */ } };

// ------------------------------------------------------------- questions ---
// How close the camera sits for each class of joint, in metres. Framing is
// half the answer: "point at the elbow" asked at full-body distance is a
// two-pixel target, and the same question asked from 70 cm away is trivial.
const NEAR = { Hips: 1.5, Spine: 1.4, Chest: 1.4, Neck: 1.0, Head: 0.9 };
const LIMB = 0.85;

/**
 * THE LANDMARKS QUEUE — "show me where the joints are".
 *
 * Bracketed by the two questions that make the marks usable: what kind of
 * bind pose this is (a stance's bones are legitimately unmirrored, and every
 * automatic pass needs to know that before it touches anything), and an open
 * note at the end for whatever the seventeen questions did not think to ask.
 */
function landmarkQueue() {
  const q = [{
    id: 'bindPose', kind: 'choice',
    title: 'What kind of pose is this model standing in?',
    ask: 'Look at the model as it loaded — before any pose is applied. A REST pose ' +
      'is symmetric and slack: T-pose, A-pose, arms down. A STANCE has one foot ' +
      'forward, or a raised guard, or a weapon held.',
    why: 'The symmetry pass repairs a rig by mirroring it. On a stance that would ' +
      'average the pose away, so it refuses — and it currently decides that from a ' +
      'threshold rather than from anyone who knows.',
    options: [
      { value: 'rest', label: 'Rest pose', hint: 'T-pose, A-pose, or arms hanging — the two sides match.' },
      { value: 'stance', label: 'Fighting stance', hint: 'Asymmetric on purpose: a stride, a guard, a held weapon.' },
      { value: 'unsure', label: 'Not sure', hint: 'Leave it to the measurement.' }
    ]
  }];
  for (const d of LANDMARKS) {
    q.push({
      id: 'lm:' + d.key, kind: 'point', key: d.key, bone: d.bone, side: d.side ?? null,
      title: d.label, ask: d.hint,
      dist: NEAR[d.bone] ?? LIMB,
      why: d.key.startsWith('shoulder') || d.key.startsWith('hip')
        ? 'These four carry more of the animation than all the rest together — every ' +
          'limb aims from them.'
        : null
    });
  }
  q.push({
    id: 'notes', kind: 'note',
    title: 'Anything else wrong with this model?',
    ask: 'Free text — it goes into the export verbatim. Fingers, hair, a cape that ' +
      'moves with the wrong bone, a face that collapses: anything you noticed while ' +
      'you were in here.'
  });
  q.push({ id: 'done', kind: 'done', title: 'Done' });
  return q;
}

export const QUEUES = {
  landmarks: {
    label: 'Landmarks',
    blurb: 'Point at each joint INSIDE the body. Every alignment the retargeter ' +
      'builds comes from where the bones sit in the mesh, so a bone in the wrong ' +
      'place aims its limb somewhere the clip never asked for — and nothing in ' +
      'the file says where the shoulder really is.',
    build: landmarkQueue
  }
};

// ------------------------------------------------------------------ bench ---
// The layout is ONE set of panels shown ONE at a time, in a card that is a
// modal sheet on a phone and a rail on a desktop. `PANELS` is the whole
// navigation model.
const PANELS = {
  question: { label: 'Question', icon: '？' },
  list: { label: 'Queue', icon: '☰' },
  view: { label: 'View', icon: '◧' },
  setup: { label: 'Setup', icon: '⚙' }
};

export function mountVerificationBench(root) {
  const prefs = { char: 'yuji', url: '', queue: 'landmarks', ...load() };
  const queueId = QUEUES[prefs.queue] ? prefs.queue : 'landmarks';
  const queueDef = QUEUES[queueId];

  root.classList.add('vb-mode');
  const wrap = el('div', 'vb');
  const view = el('div', 'vb-view');
  wrap.append(view);
  root.append(wrap);

  const stage = createStage(view);
  const session = new RigSession(stage);

  const questions = queueDef.build();
  const decisions = {};          // question id -> answer record
  let idx = 0;
  let started = false;
  let panel = 'setup';           // which panel the card is showing
  let open = true;               // is the card showing at all (phones only)
  let xray = false;
  let notes = '';

  // Phone or desktop is a QUESTION ABOUT THE SCREEN, not about the browser:
  // a small window on a laptop gets the modal layout too, and it follows a
  // rotation live rather than being decided once at boot.
  const mq = matchMedia('(max-width: 880px), (pointer: coarse) and (max-width: 1100px)');
  const isPhone = () => mq.matches;
  mq.addEventListener?.('change', () => { syncChrome(); render(); });

  // ---- the card ------------------------------------------------------------
  const card = el('div', 'vb-card');
  const tabs = el('div', 'vb-tabs');
  const close = el('button', 'vb-close', '✕');
  close.title = 'Back to the model';
  close.onclick = () => setOpen(false);
  const head = el('div', 'vb-head');
  const step = el('div', 'vb-step', '');
  const bar = el('div', 'vb-bar', '<i></i>');
  head.append(step, bar);
  const bodyBox = el('div', 'vb-body');
  const nav = el('div', 'vb-nav');
  card.append(tabs, close, head, bodyBox, nav);
  wrap.append(card);

  for (const [key, def] of Object.entries(PANELS)) {
    const b = el('button', 'vb-tab', `<em>${def.icon}</em><span>${def.label}</span>`);
    b.dataset.panel = key;
    b.onclick = () => setPanel(key);
    tabs.append(b);
  }

  // ---- the always-there bar (phones) --------------------------------------
  // Whatever is open, this stays: which question, how far through, and the two
  // presses that move. It is also the way BACK to the question from a panel,
  // because on a phone the question's own title is the obvious thing to tap.
  const dock = el('div', 'vb-dock');
  const dockQ = el('button', 'vb-dockq', '<i></i><b></b>');
  dockQ.onclick = () => setPanel('question');
  const dockBtns = el('div', 'vb-dockbtns');
  const dockNav = el('div', 'vb-docknav');
  const dockBack = el('button', 'vb-ghost sm', '<span>◀</span>');
  dockBack.onclick = () => go(-1);
  const dockNext = el('button', 'vb-go sm', '<span>Next ▸</span>');
  dockNext.onclick = () => go(1);
  dockNav.append(dockBack, dockNext);
  const dockRow = el('div', 'vb-dockrow');
  dockRow.append(dockBtns, dockNav);
  dock.append(dockQ, dockRow);
  wrap.append(dock);
  for (const [key, def] of Object.entries(PANELS)) {
    if (key === 'question') continue;   // reached by tapping the title
    const b = el('button', 'vb-tool wide', `<em>${def.icon}</em><span>${def.label}</span>`);
    b.dataset.panel = key;
    b.onclick = () => setPanel(panel === key && open ? 'question' : key, panel === key && open ? false : true);
    dockBtns.append(b);
  }

  // ---- panels that are built once -----------------------------------------
  // `buildLoaderUI` registers page-level drop handlers, so it is built ONCE
  // and re-parented, never rebuilt: calling it per render would stack a new
  // drop listener on the window every time the setup panel was opened.
  const setupPanel = el('div', 'vb-panel');
  const viewPanel = el('div', 'vb-panel');
  const listPanel = el('div', 'vb-panel');
  const questionPanel = el('div', 'vb-panel');

  // ---- SETUP ---------------------------------------------------------------
  setupPanel.append(el('div', 'vb-why', queueDef.blurb));
  const sModel = sec(setupPanel, 'MODEL');
  const { box: loaderBox } = buildLoaderUI(session, {
    prefs, save,
    onLoaded: () => {
      // The rig bench draws every joint as a green ball on load, which is
      // right when the question is "is this bone the right bone". Here it is
      // actively harmful: asked to point at the shoulder, a person shown a
      // ball near the shoulder will point at the BALL, and the answer is then
      // the rig's own opinion handed back to it. The VIEW panel brings them
      // in when they are wanted.
      session.setSkeleton(false);
      restore();
      syncSetup();
      frameBody();
    },
    onReference: pick => {
      const base = pick.split(':')[0];
      if (!ROSTER_IDS.includes(base)) return;
      refSel.value = base; prefs.char = base; save(prefs);
      session.setReference(pick);
    }
  });
  sModel.append(loaderBox);

  const sRef = sec(setupPanel, 'STANDS IN FOR');
  const refSel = el('select', 'mb-select');
  for (const id of ROSTER_IDS) {
    const o = el('option'); o.value = id; o.textContent = ROSTER[id].config?.name ?? id;
    refSel.append(o);
  }
  refSel.value = ROSTER_IDS.includes(prefs.char) ? prefs.char : 'yuji';
  refSel.onchange = () => { prefs.char = refSel.value; save(prefs); session.setReference(refSel.value); };
  sRef.append(refSel);
  session.setReference(refSel.value);

  const startBox = el('div', 'vb-row');
  const bStart = el('button', 'vb-go', '<span>Start</span>');
  bStart.onclick = () => {
    if (!session.model3d) return;
    started = true;
    idx = firstUnanswered();
    session.setGhost(false);
    setPanel('question');
  };
  const bClear = el('button', 'vb-ghost', '<span>Clear answers</span>');
  bClear.onclick = () => {
    for (const k of Object.keys(decisions)) delete decisions[k];
    notes = '';
    session.clearLandmarks();
    persist(); idx = 0; render();
  };
  startBox.append(bStart, bClear);
  setupPanel.append(startBox);
  // the other benches — the phone layout hides the page header they live in
  sec(setupPanel, 'ELSEWHERE').append(el('div', 'vb-links',
    ['finishers', 'models', 'rig'].map(k => `<a href="?edit=${k}">${k}</a>`).join('') +
    '<a href="../">the game</a>'));

  function syncSetup() {
    bStart.disabled = !session.model3d;
    bStart.querySelector('span').textContent = started ? 'Back to the queue' : 'Start';
    bClear.style.display = Object.keys(decisions).length ? '' : 'none';
  }

  // ---- VIEW ----------------------------------------------------------------
  // Orbit and pinch work on the canvas itself; these exist because a phone
  // held in one hand can do neither reliably, and because "put it back on the
  // joint" is not a gesture anyone can make.
  viewPanel.append(el('div', 'vb-ask',
    'Drag to orbit, pinch or two fingers to zoom and pan. These do the same ' +
    'without a second hand.'));
  const toolGrid = el('div', 'vb-toolgrid');
  const tool = (icon, label, fn) => {
    const b = el('button', 'vb-tool wide', `<em>${icon}</em><span>${label}</span>`);
    b.onclick = () => { fn(); if (isPhone()) setOpen(false); };
    toolGrid.append(b);
    return b;
  };
  tool('◀', 'Turn left', () => { stage.cam.yaw -= 0.6; });
  tool('▶', 'Turn right', () => { stage.cam.yaw += 0.6; });
  tool('⟲', 'Quarter turn', () => { stage.cam.yaw += Math.PI / 2; });
  tool('F', 'Face on', () => stage.orbit(0, 0.05));
  tool('＋', 'Closer', () => { stage.cam.dist = Math.max(0.25, stage.cam.dist * 0.7); });
  tool('－', 'Further', () => { stage.cam.dist = Math.min(20, stage.cam.dist * 1.4); });
  tool('⤢', 'Whole body', () => frameBody());
  tool('◎', 'On the joint', () => frameQuestion());
  const bXray = tool('◫', 'See the bones', () => {
    xray = !xray;
    session.setWireframe(xray);
    session.setSkeleton(xray);
    bXray.classList.toggle('on', xray);
  });
  viewPanel.append(toolGrid);
  viewPanel.append(el('div', 'vb-why',
    '<b>See the bones</b> shows the rig its own answer. Worth a look when a ' +
    'joint is hard to find — but decide where the joint is BEFORE you turn it ' +
    'on, or you will point at the ball rather than at the shoulder.'));

  // ---- picking -------------------------------------------------------------
  // The view's taps belong to the current question and to nothing else: a
  // stray tap can add a mark, never rewrite a mapping.
  stage.canvas.addEventListener('pointerup', e => {
    if (!started || !stage.wasClick() || !session.model3d) return;
    const q = questions[idx];
    if (q?.kind !== 'point') return;
    const p = session.pickSurface(e);
    if (!p) return;
    session.addLandmarkSample(q.key, p);
    persist();
    render();
  });

  // ---- persistence ---------------------------------------------------------
  // A phone loses the page every time it locks. Marks are worth more than the
  // session they were made in, so they are written per model on every answer
  // and offered back when the same file is loaded again.
  const slot = () => 'ans:' + (session.sourceLabel || '?');
  function persist() {
    const lm = {};
    const r5 = v => v.toArray().map(x => +x.toFixed(5));
    for (const [k, v] of Object.entries(session.landmarks)) {
      // the RAY is the valuable half of a sample — two of them from different
      // angles are a measurement rather than two guesses — so it survives the
      // phone locking as well as the point does
      lm[k] = v.map(s => s.dir ? [r5(s.point), r5(s.origin), r5(s.dir)] : [r5(s.point)]);
    }
    prefs[slot()] = { decisions, landmarks: lm, notes, queue: queueId };
    save(prefs);
  }
  function restore() {
    const saved = prefs[slot()];
    if (!saved || saved.queue !== queueId) return;
    Object.assign(decisions, saved.decisions || {});
    notes = saved.notes || '';
    for (const [k, arr] of Object.entries(saved.landmarks || {})) {
      session.landmarks[k] = arr.map(a => {
        if (typeof a[0] === 'number') return { point: new THREE.Vector3().fromArray(a) };
        const s = { point: new THREE.Vector3().fromArray(a[0]) };
        if (a[1] && a[2]) {
          s.origin = new THREE.Vector3().fromArray(a[1]);
          s.dir = new THREE.Vector3().fromArray(a[2]);
        }
        return s;
      });
    }
    session._refreshLandmarks();
  }

  function firstUnanswered() {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.kind === 'done') return i;
      if (!decisions[q.id]) return i;
    }
    return 0;
  }

  // ---- framing -------------------------------------------------------------
  function frameBody() {
    const h = session.modelHeight || 1.75;
    stage.frameOn(new THREE.Vector3(0, h * 0.55, 0), h * 2.1);
  }
  /**
   * Put the thing being asked about in the middle of what is VISIBLE — and,
   * for a left/right landmark, come at it from that side, because a shoulder
   * asked about from the front is a shoulder behind a chest.
   */
  function frameQuestion(keepAngle = false) {
    const q = questions[idx];
    if (!started || !q || q.kind !== 'point') { frameBody(); return; }
    if (!keepAngle) {
      stage.orbit(q.side === 'L' ? 1.15 : q.side === 'R' ? -1.15 : 0.45, 0.06);
    }
    const bone = session.map[q.bone];
    if (!bone) { frameBody(); return; }
    session.wrapper?.updateMatrixWorld(true);
    const at = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
    // OCCLUSION: whatever is over the viewer answers for itself — pulling back
    // by the covered fraction keeps the same amount of body in the part that
    // is left, and aiming above it puts the joint in the middle of that part.
    // Measured, not assumed, so the desktop rail — which covers nothing —
    // changes nothing.
    const f = occlusion();
    // Two corrections, both about how much body is actually in shot.
    // ASPECT: the camera's field of view is VERTICAL, so the same distance
    // that frames a shoulder on a 16:9 desktop crops to a patch of cloth on a
    // portrait phone — half the width for the same height. A tight crop of
    // dark cloth is a crop in which one shoulder looks like any elbow, and the
    // question stops being answerable.
    const wide = Math.min(2.4, Math.max(1, 1.2 / (stage.camera.aspect || 1)));
    stage.frameOn(at, q.dist * wide / Math.max(0.4, 1 - f));
    if (f > 0.02) {
      const halfH = Math.tan(stage.camera.fov * Math.PI / 360) * stage.cam.dist;
      stage.cam.height = at.y - f * halfH;
    }
  }
  /** Fraction of the view's HEIGHT that the chrome is sitting over. */
  function occlusion() {
    const v = view.getBoundingClientRect();
    if (!v.height) return 0;
    let top = v.bottom;
    for (const e of [card, dock]) {
      const r = e.getBoundingClientRect();
      if (!r.height || r.left >= v.right - 1 || r.right <= v.left + 1) continue;
      if (r.bottom > v.bottom - 2) top = Math.min(top, Math.max(r.top, v.top));
    }
    return Math.max(0, v.bottom - top) / v.height;
  }

  // ---- navigation ----------------------------------------------------------
  function setPanel(name, wantOpen = true) {
    panel = PANELS[name] ? name : 'question';
    open = wantOpen;
    render();
  }
  function setOpen(v) { open = v; render(); }

  /**
   * LEAVING A QUESTION IS WHAT RECORDS IT. There are five ways out of one —
   * the Next button, the bar, an arrow key, Back, jumping from the queue — and
   * the answer has to survive all of them, so the commit lives here rather
   * than on any button. It cost a mark to learn that: the bar advanced without
   * it, and the export came out one answer short of what was on the screen.
   */
  function commit() {
    const q = questions[idx];
    if (!q) return;
    if (q.kind === 'point') {
      const n = session.landmarks[q.key]?.length ?? 0;
      if (!n) return;
      const bone = session.map[q.bone];
      const m = session.landmarkModel(q.key);
      const bp = bone && new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      answer(q.id, {
        kind: 'point', key: q.key, bone: q.bone, node: bone?.name ?? null, samples: n,
        spreadDeg: Math.round(session.landmarkSpread(q.key)),
        qualityPct: Math.round(session.landmarkQuality(q.key) * 100),
        model: m.toArray().map(v => +v.toFixed(6)),
        norm: m.clone().divideScalar(session.modelHeight || 1).toArray().map(v => +v.toFixed(5)),
        distCm: bp ? +(session.landmarkWorld(q.key).distanceTo(bp) * 100).toFixed(1) : null
      });
    } else if (q.kind === 'note' && notes.trim()) {
      answer(q.id, { kind: 'note', text: notes.trim() });
    }
    // a choice records itself the moment it is pressed — there is nothing to
    // leave half-done, and re-committing it would restamp its timestamp
  }
  function go(delta, doCommit = true) { jump(idx + delta, doCommit); }
  /**
   * THE ONE RULE THAT MAKES THE PHONE LAYOUT WORK. Moving to a question you
   * answer IN the panel (a choice, a note, the export) opens it; moving to one
   * you answer by POINTING closes it and hands the screen back to the model.
   * Nobody should have to dismiss a sheet to answer the question on it, and
   * nobody should have to dismiss one to see what they are pointing at.
   */
  function jump(to, doCommit = true) {
    if (doCommit) commit();
    idx = Math.max(0, Math.min(questions.length - 1, to));
    panel = 'question';
    if (isPhone()) open = questions[idx].kind !== 'point';
    render();
  }
  function answer(id, rec) {
    decisions[id] = { ...rec, at: new Date().toISOString() };
    persist();
  }

  // ---- render --------------------------------------------------------------
  function syncChrome() {
    const phone = isPhone();
    wrap.classList.toggle('phone', phone);
    // On a phone a panel is either over the viewer or gone; on a desktop the
    // rail is always there and `open` means nothing.
    card.classList.toggle('open', !phone || open);
    // never both: an open sheet reaches the bottom of the screen, and a dock
    // floating over its own Next button is two answers to the same press
    dock.style.display = phone && started && !open ? '' : 'none';
    // before the queue starts there is nothing behind the sheet and no dock to
    // bring it back, so the way out has to not be offered
    close.style.display = phone && started ? '' : 'none';
    for (const b of tabs.children) b.classList.toggle('on', b.dataset.panel === panel);
    for (const b of dockBtns.children) b.classList.toggle('on', open && b.dataset.panel === panel);
    card.dataset.panel = panel;
  }

  function render() {
    if (!started && panel !== 'setup') panel = 'setup';
    const q = questions[idx];
    session.armedLandmark = started && q?.kind === 'point' ? q.key : null;
    session._refreshLandmarks();
    syncChrome();

    const answerable = questions.filter(x => x.kind !== 'done').length;
    const done = questions.filter(x => x.kind !== 'done' && decisions[x.id]).length;
    step.innerHTML = !started
      ? `${queueDef.label.toUpperCase()} — SETUP`
      : q.kind === 'done'
        ? `${queueDef.label.toUpperCase()} — <b>${done}/${answerable} answered</b>`
        : `${queueDef.label.toUpperCase()} · <b>${idx + 1}</b> / ${answerable}` +
          (decisions[q.id] ? ' · <i>answered</i>' : '');
    bar.firstChild.style.width = (100 * done / answerable).toFixed(1) + '%';
    dockQ.querySelector('i').textContent = `${idx + 1}/${answerable}`;
    dockQ.querySelector('b').textContent = q?.title ?? '';
    dockNext.querySelector('span').textContent = q?.kind === 'done' ? 'Export ▸' : 'Next ▸';

    bodyBox.innerHTML = '';
    nav.innerHTML = '';
    if (panel === 'setup') { syncSetup(); bodyBox.append(setupPanel); }
    else if (panel === 'view') bodyBox.append(viewPanel);
    else if (panel === 'list') { renderList(); bodyBox.append(listPanel); }
    else { renderQuestion(q); bodyBox.append(questionPanel); }
    // Don't re-aim behind a modal. A sheet covering two thirds of the screen
    // would have the camera retreat to keep the joint in the strip above it,
    // and then advance again when the sheet closed — two lurches to frame a
    // shot nobody is looking at. The camera answers to the layout it will be
    // SEEN in, so it waits until the sheet is gone.
    if (!(isPhone() && open)) frameQuestion(true);
  }

  // ---- panel: the queue ----------------------------------------------------
  function renderList() {
    listPanel.innerHTML = '';
    listPanel.append(el('div', 'vb-ask',
      'Every question in this queue. Answered ones can be redone — a second ' +
      'mark on a joint averages with the first rather than replacing it.'));
    const rows = el('div', 'vb-list');
    questions.forEach((q, i) => {
      if (q.kind === 'done') return;
      const d = decisions[q.id];
      const marks = q.kind === 'point' ? (session.landmarks[q.key]?.length ?? 0) : 0;
      const state = d?.skipped ? 'skipped' : d ? 'ok' : '';
      const b = el('button', 'vb-listrow' + (i === idx ? ' on' : '') + (state ? ' ' + state : ''),
        `<i>${d?.skipped ? '–' : d ? '✓' : '·'}</i><b>${q.title}</b>` +
        `<span>${marks ? marks + ' mark' + (marks > 1 ? 's' : '') : d?.value ?? ''}</span>`);
      b.onclick = () => jump(i);
      rows.append(b);
    });
    listPanel.append(rows);
    const fin = el('button', 'vb-ghost', '<span>Finish and export</span>');
    fin.onclick = () => jump(questions.length - 1);
    listPanel.append(fin);
  }

  // ---- panel: the question -------------------------------------------------
  function renderQuestion(q) {
    questionPanel.innerHTML = '';
    if (!started || !q) { questionPanel.append(el('div', 'vb-ask', 'Load a model to begin.')); return; }
    questionPanel.append(el('h2', 'vb-title', q.title));
    if (q.ask) questionPanel.append(el('div', 'vb-ask', q.ask));
    if (q.why) questionPanel.append(el('div', 'vb-why', q.why));
    if (q.kind === 'point') renderPoint(q);
    else if (q.kind === 'choice') renderChoice(q);
    else if (q.kind === 'note') renderNote(q);
    else renderDone();
  }

  function navRow(nextLabel = 'Next', canNext = true) {
    const back = el('button', 'vb-ghost', '<span>Back</span>');
    back.disabled = idx === 0;
    back.onclick = () => go(-1);
    const skip = el('button', 'vb-ghost', '<span>Skip</span>');
    skip.onclick = () => { answer(questions[idx].id, { skipped: true }); go(1, false); };
    const fwd = el('button', 'vb-go', `<span>${nextLabel}</span>`);
    fwd.disabled = !canNext;
    fwd.onclick = () => go(1);
    nav.append(back, skip, fwd);
    return fwd;
  }

  function renderPoint(q) {
    const n = session.landmarks[q.key]?.length ?? 0;
    const bone = session.map[q.bone];
    const w = session.landmarkWorld(q.key);
    let read;
    if (!bone) {
      read = `<b>${q.bone}</b> is not mapped on this model — mark it anyway, the ` +
        'mark is what says which bone it should have been.';
    } else if (!n) {
      read = 'Tap the joint on the model. The tap lands <i>inside</i> the body — ' +
        'the ray is averaged through it — so aim at the skin over the joint, not ' +
        'at the outline.';
    } else {
      const bp = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      const cm = (w.distanceTo(bp) * 100).toFixed(1);
      // ONE TAP IS A GUESS AND TWO ANGLES ARE A MEASUREMENT, and the difference
      // is worth saying plainly: a single ray puts the point inside the body
      // with a depth heuristic that is wrong by centimetres ALONG THE LINE OF
      // SIGHT — the one direction the person tapping cannot see. A second tap
      // from elsewhere crosses the first and the guess drops out.
      //
      // NOT from the opposite side, though, however much that sounds like the
      // strongest second look: two opposite rays are the same line and settle
      // nothing along it. A quarter turn is the good angle, and this says so
      // in the one place someone is in a position to act on it.
      const spread = Math.round(session.landmarkSpread(q.key));
      const qual = session.landmarkQuality(q.key);
      read = `<b>${n} mark${n > 1 ? 's' : ''}</b> — the bone currently sits ` +
        `<b>${cm} cm</b> from where you pointed. ` +
        (n < 2
          ? '<b>Turn a quarter of the way round and tap the same joint again.</b> ' +
            'One angle cannot tell how deep the joint is; two that cross can.'
          : qual >= 0.5
            ? `Marks <b>${spread}°</b> apart: the depth is measured, not guessed.`
            : spread > 150
              ? `Marks <b>${spread}°</b> apart — nearly opposite, which is the one ` +
                'angle that adds nothing. <b>Turn back a quarter turn</b> and tap again.'
              : `Marks only <b>${spread}°</b> apart — turn further, to about a ` +
                'quarter turn, and tap once more.');
    }
    questionPanel.append(el('div', 'vb-read', read));

    const row = el('div', 'vb-row');
    const undo = el('button', 'vb-ghost sm', '<span>Undo mark</span>');
    undo.disabled = !n;
    undo.onclick = () => {
      session.landmarks[q.key]?.pop();
      if (!session.landmarks[q.key]?.length) session.clearLandmark(q.key);
      else session._refreshLandmarks();
      persist(); render();
    };
    // A QUARTER TURN, NOT THE OTHER SIDE. This button used to spin 180°, which
    // is the one rotation that gives a second tap nothing to say — see
    // RigSession.landmarkQuality.
    const other = el('button', 'vb-ghost sm', '<span>Quarter turn</span>');
    other.title = 'Turn 90° — the angle at which a second tap pins the depth';
    other.onclick = () => { stage.cam.yaw += Math.PI / 2; if (isPhone()) setOpen(false); };
    const back = el('button', 'vb-go sm', '<span>Point at it ▸</span>');
    back.title = 'Put the model back on screen';
    back.onclick = () => setOpen(false);
    row.append(undo, other);
    if (isPhone()) row.append(back);
    questionPanel.append(row);
    navRow();
  }

  function renderChoice(q) {
    const cur = decisions[q.id]?.value;
    const box = el('div', 'vb-opts');
    for (const o of q.options) {
      const b = el('button', 'vb-opt' + (cur === o.value ? ' on' : ''),
        `<b>${o.label}</b><span>${o.hint ?? ''}</span>`);
      b.onclick = () => {
        answer(q.id, { kind: 'choice', value: o.value, label: o.label });
        render();
        setTimeout(() => go(1), 180);
      };
      box.append(b);
    }
    questionPanel.append(box);
    navRow('Next', !!cur);
  }

  function renderNote(q) {
    const ta = el('textarea', 'mb-notes');
    ta.value = notes;
    ta.placeholder = 'Optional…';
    ta.oninput = () => { notes = ta.value; };
    questionPanel.append(ta);
    navRow('Finish');
  }

  // The end of the queue is where the answers become actions: the marks can be
  // pushed straight onto the pivots and looked at, and the whole set exported.
  function renderDone() {
    const marks = LANDMARKS.filter(d => session.landmarks[d.key]?.length);
    const bad = session.suggestFromLandmarks().filter(r => !r.agrees);
    questionPanel.append(el('div', 'vb-read',
      `<b>${marks.length} of ${LANDMARKS.length}</b> joints marked on ` +
      `<b>${session.sourceLabel || 'this model'}</b>.` +
      (bad.length
        ? `<br><b>${bad.length}</b> of them are nearer a different bone than the one ` +
          'mapped — that is a mapping bug, and it is in the export.'
        : marks.length ? '<br>Every mark agrees with the bone it was mapped to.' : '')));

    const applyRead = el('div', 'vb-read', '');
    const apply = el('button', 'vb-ghost', '<span>Move bones to marks</span>');
    apply.title = 'Preview the fix: every marked joint becomes its bone’s pivot';
    apply.onclick = () => {
      const n = session.applyLandmarksToPivots();
      applyRead.textContent = n
        ? `${n} bones moved onto your marks. Spin the model — this is what the fix looks like.`
        : 'No marks to apply.';
      if (isPhone() && n) setOpen(false);
    };
    const again = el('button', 'vb-ghost', '<span>Back to the questions</span>');
    again.onclick = () => jump(firstUnanswered());
    const rowA = el('div', 'vb-row');
    rowA.append(apply, again);
    questionPanel.append(rowA, applyRead);

    const exp = el('button', 'vb-go', '<span>Export decisions</span>');
    exp.onclick = () => {
      const name = (session.sourceLabel || 'model').replace(/\.[^.]+$/, '');
      downloadJson(buildExport(), `verification-${queueId}-${name}.json`);
    };
    nav.append(exp);
  }

  /**
   * WHAT GETS HANDED BACK. The answers as given, plus the two derived blocks a
   * tool can act on without re-deriving anything: the marks in model space AND
   * as a fraction of height (so they survive a re-export of the same
   * character), and any bone the marks say was mis-MAPPED rather than
   * misplaced — a different fault with a different fix.
   */
  function buildExport() {
    commit();
    const out = {
      tool: 'verification-bench', queue: queueId,
      model: session.sourceLabel || null,
      reference: session.ref?.pick ?? null,
      modelHeightM: +(session.modelHeight || 0).toFixed(4),
      exported: new Date().toISOString(),
      answers: questions.filter(q => q.kind !== 'done').map(q => ({
        id: q.id, question: q.title,
        ...(decisions[q.id] ?? { unanswered: true })
      })),
      landmarkMapping: session.suggestFromLandmarks().filter(r => !r.agrees),
      // How much of this is a measurement. A landmark sampled from one
      // direction carries an unmeasured depth error along that direction;
      // saying so here is what stops it being read as a number.
      triangulated: LANDMARKS.filter(d => session.landmarks[d.key]?.length &&
        session.landmarkQuality(d.key) >= 0.5).length,
      marked: LANDMARKS.filter(d => session.landmarks[d.key]?.length).length,
      notes
    };
    // The joints patch, ready to paste into public/models/manifest.json. Same
    // arithmetic as RigSession._setJointWorld — an offset from the model's own
    // rest, as a fraction of its height — but computed rather than applied, so
    // exporting never disturbs what is on screen.
    const H = session.modelHeight || 1;
    const joints = {};
    for (const d of LANDMARKS) {
      const node = session.map[d.bone];
      const m = session.landmarkModel(d.key);
      const base = node && session.baseModelPos?.get(node);
      if (!m || !base) continue;
      joints[node.name] = m.sub(base).divideScalar(H)
        .toArray().map(v => Math.round(v * 1e6) / 1e6);
    }
    if (Object.keys(joints).length) out.joints = joints;
    return out;
  }

  // ---- keyboard (desktop) --------------------------------------------------
  addEventListener('keydown', e => {
    if (!started || e.target.matches('input, textarea, select')) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') { go(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
  });

  render();
  requestAnimationFrame(() => { stage.resize(); frameBody(); });

  // THE HARNESS HOOK. `tools/benchcheck.mjs` drives this bench in a real
  // browser, and the one thing it cannot do from outside is aim: a synthetic
  // tap has to land exactly where a known joint projects, or the round trip
  // measures the test's aim rather than the bench's maths. Same practice as
  // `window.__viewer` and `__skipSelect` elsewhere; it costs a few lines and
  // it is how the picking regression below stays fixed.
  window.__vb = {
    session, stage, view,
    /**
     * Tap exactly where `bone` projects, from each of `yaws`, and report what
     * the landmark solver recovers. One angle is a guess with a depth error;
     * two that are far enough apart are an intersection.
     */
    triangulate(bone, key, yaws, pitch = 0.06, jitterPx = 0) {
      const n = session.map[bone];
      session.wrapper.updateMatrixWorld(true);
      const truth = new THREE.Vector3().setFromMatrixPosition(n.matrixWorld);
      session.clearLandmark(key);
      const r = stage.canvas.getBoundingClientRect();
      const per = [];
      let k = 0;
      for (const yaw of yaws) {
        stage.frameOn(truth, 1.6);
        stage.cam.yaw = yaw; stage.cam.pitch = pitch;
        stage.camera.position.set(
          stage.cam.tx + Math.sin(yaw) * stage.cam.dist * Math.cos(pitch),
          stage.cam.height + Math.sin(pitch) * stage.cam.dist,
          stage.cam.tz + Math.cos(yaw) * stage.cam.dist * Math.cos(pitch));
        stage.camera.lookAt(stage.cam.tx, stage.cam.height, stage.cam.tz);
        stage.camera.updateMatrixWorld(true);
        const p = truth.clone().project(stage.camera);
        // AIM ERROR. A synthetic tap that lands exactly on the projected joint
        // makes every ray pass exactly through the answer, and then even a
        // degenerate pair of rays "recovers" it perfectly. Nobody taps like
        // that, so the harness can ask for a few pixels of miss — deterministic,
        // spun around a small circle so the runs are comparable.
        const a = k * 2.399963, j = jitterPx;
        k++;
        const hit = session.pickSurface({
          clientX: r.left + (p.x * 0.5 + 0.5) * r.width + Math.cos(a) * j,
          clientY: r.top + (-p.y * 0.5 + 0.5) * r.height + Math.sin(a) * j
        });
        if (!hit) { per.push(null); continue; }
        per.push(+(hit.point.distanceTo(truth) * 100).toFixed(1));
        session.addLandmarkSample(key, hit);
      }
      const got = session.landmarkWorld(key);
      const out = { bone, perSampleCm: per,
        spreadDeg: Math.round(session.landmarkSpread(key)),
        qualityPct: Math.round(session.landmarkQuality(key) * 100),
        errorCm: got ? +(got.distanceTo(truth) * 100).toFixed(1) : null };
      session.clearLandmark(key);
      return out;
    }
  };

  render();
  requestAnimationFrame(() => { stage.resize(); frameBody(); });
}
