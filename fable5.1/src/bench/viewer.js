// MODEL VIEWER — /fable5.1/#viewer  (?pick=gojo:shinjuku&clip=heavy)
// Turntable, clip switching (keys: [ ] for clip, , . for character), and a
// screenshot key (P).
import * as THREE from 'three';
import { benchScene, placeCharacter, allPicks } from './scene.js';
import { cycleQuality } from '../render/quality.js';

export function startViewer() {
  const q = new URLSearchParams(location.search);
  const picks = allPicks();
  let pi = Math.max(0, picks.indexOf(q.get('pick') || 'gojo'));
  const stage = benchScene();
  let ch = null, clipNames = [], ci = 0, spin = q.has('spin') ? 0.4 : 0;
  const ui = document.getElementById('ui-root');
  const label = document.createElement('div');
  label.style.cssText = 'position:absolute;left:16px;top:12px;font:600 14px/1.4 var(--font-body);color:#eee;text-shadow:0 1px 2px #000;white-space:pre';
  ui.appendChild(label);
  function load() {
    if (ch) { stage.scene.remove(ch.model.group); stage.scene.remove(ch.cs.mesh); }
    ch = placeCharacter(stage, picks[pi], 0, 0, 'idle');
    clipNames = [...ch.clips.keys()];
    ci = Math.max(0, clipNames.indexOf(q.get('clip') || 'idle'));
    ch.anim.play(clipNames[ci]);
    label.textContent = `${picks[pi]}   clip: ${clipNames[ci]}\n[ ] clip   , . character   R restart   F4 quality   P shot`;
  }
  load();
  stage.camera.position.set(0, 1.35, 4.6);
  stage.camera.lookAt(0, 0.95, 0);
  stage.focus.set(0, 1, 0);
  addEventListener('keydown', e => {
    if (e.code === 'BracketRight') { ci = (ci + 1) % clipNames.length; ch.anim.play(clipNames[ci], { restart: true }); }
    if (e.code === 'BracketLeft') { ci = (ci + clipNames.length - 1) % clipNames.length; ch.anim.play(clipNames[ci], { restart: true }); }
    if (e.code === 'Period') { pi = (pi + 1) % picks.length; load(); }
    if (e.code === 'Comma') { pi = (pi + picks.length - 1) % picks.length; load(); }
    if (e.code === 'KeyR') ch.anim.play(clipNames[ci], { restart: true });
    if (e.code === 'KeyS') spin = spin ? 0 : 0.5;
    if (e.code === 'F4') cycleQuality();
    label.textContent = `${picks[pi]}   clip: ${clipNames[ci]}\n[ ] clip   , . character   R restart   F4 quality   P shot`;
  });
  let last = performance.now(), t = 0;
  const loop = now => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; t += dt;
    ch.anim.update(dt); ch.model.group.updateMatrixWorld(true); ch.model.update(dt);
    if (spin) ch.model.group.rotation.y += dt * spin;
    stage.render(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__f51 = { stage, get ch() { return ch; }, setClip(n) { ci = Math.max(0, clipNames.indexOf(n)); ch.anim.play(clipNames[ci], { restart: true }); }, setPick(p) { pi = Math.max(0, picks.indexOf(p)); load(); }, setYaw(y) { ch.model.group.rotation.y = y; } };
}
