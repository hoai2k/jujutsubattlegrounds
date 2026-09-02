// LINEUP BENCH — /fable5.1/?bench=lineup[&picks=gojo,yuji][&clip=idle][&dist=6]
// The whole roster (or a list) standing in a row at gameplay camera distance,
// all playing the same clip. This is the readability test from the direction
// document: every silhouette must be identifiable from here.
import * as THREE from 'three';
import { benchScene, placeCharacter, allPicks, ROSTER_IDS } from './scene.js';

export function startLineup() {
  const q = new URLSearchParams(location.search);
  const picks = q.get('picks') ? q.get('picks').split(',') : (q.get('all') ? allPicks() : ROSTER_IDS);
  const clip = q.get('clip') || 'idle';
  const stage = benchScene();
  const gap = +(q.get('gap') || 1.4);
  const chars = [];
  const ui = document.getElementById('ui-root');
  const err = [];
  picks.forEach((p, i) => {
    try { chars.push(placeCharacter(stage, p, (i - (picks.length - 1) / 2) * gap, 0, clip)); }
    catch (e) { err.push(p + ': ' + e.message); console.error(p, e); }
  });
  const width = picks.length * gap;
  const dist = +(q.get('dist') || Math.max(6, width * 0.62));
  stage.camera.position.set(0, 1.6, dist);
  stage.camera.lookAt(0, 0.95, 0);
  stage.focus.set(0, 1, 0);
  const label = document.createElement('div');
  label.style.cssText = 'position:absolute;left:16px;top:12px;font:600 13px/1.4 var(--font-body);color:#eee;text-shadow:0 1px 2px #000;white-space:pre';
  label.textContent = `LINEUP · ${picks.length} · clip ${clip}` + (err.length ? '\nERRORS: ' + err.join(' | ') : '');
  ui.appendChild(label);
  let last = performance.now();
  const loop = now => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    for (const c of chars) { c.anim.update(dt); c.model.group.updateMatrixWorld(true); c.model.update(dt); }
    stage.render(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__f51 = { stage, chars, errors: err };
}
