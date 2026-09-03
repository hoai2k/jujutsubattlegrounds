// SETTINGS — video (quality tier), audio (four volumes, persisted, mute on
// blur), controls (remap any action per keyboard cluster / pad, deadzone,
// rumble, camera invert), accessibility (reduced motion, announcer).
import { Nav, h } from '../nav.js';
import { TIERS, qualityIndex, setQuality } from '../../render/quality.js';
import { controls, saveControls, resetControls, ACTIONS, ACTION_LABEL, BTN } from '../../combat/input.js';

const LS = 'f51.settings';
export const settings = { master: 0.8, sfx: 0.9, music: 0.55, voice: 0.9, announcer: true, muteOnBlur: true, reducedMotion: 'auto', shake: true, damageNumbers: true };
export function loadSettings() { try { Object.assign(settings, JSON.parse(localStorage.getItem(LS) || '{}')); } catch (e) { /* */ } }
export function saveSettings() { try { localStorage.setItem(LS, JSON.stringify(settings)); } catch (e) { /* */ } }
export function applySettings(G) {
  for (const b of ['master', 'sfx', 'music', 'voice']) G.sfx.setVolume(b, settings[b]);
  G.announcer.enabled = settings.announcer;
  const reduced = settings.reducedMotion === 'on' || (settings.reducedMotion === 'auto' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.classList.toggle('reduced', reduced);
  if (G.match) for (const c of G.match.cams) c.reducedMotion = reduced || !settings.shake;
}
const PAD_NAMES = Object.fromEntries(Object.entries(BTN).map(([k, v]) => [v, k]));

export class SettingsScreen {
  constructor(S) {
    this.S = S; this.el = h('div', 'screen settings', `<div class="screen-head"><span class="kicker">SETTINGS</span><h1>OPTIONS</h1></div><div class="set-tabs"></div><div class="set-list"></div><div class="hint"><b>←→</b> change <b>A</b> select / remap <b>LB/RB</b> tab <b>B</b> back</div>`);
    S.ui.appendChild(this.el); this.el.hidden = true; this.tabs = ['VIDEO', 'AUDIO', 'CONTROLS P1', 'CONTROLS P2', 'PAD', 'ACCESSIBILITY']; this.tab = 0;
    this.list = this.el.querySelector('.set-list'); this.tabsEl = this.el.querySelector('.set-tabs');
    this.nav = new Nav(S.G.sfx, { onConfirm: (el, i) => this.confirm(i), onBack: () => this.back(), onExtra: f => { if (f.ct1P) { this.tab = (this.tab + this.tabs.length - 1) % this.tabs.length; this.render(); } if (f.ct2P) { this.tab = (this.tab + 1) % this.tabs.length; this.render(); } } });
    loadSettings();
  }
  show(d) { this.el.hidden = false; this.backTo = d?.back || 'mode'; this.render(); }
  hide() { this.el.hidden = true; saveSettings(); saveControls(); }
  back() { if (this.capture) { this.capture = null; this.render(); return; } const S = this.S; if (this.backTo === 'resume') { S.current = 'match'; S.active = null; this.hide(); S.G.match.paused = false; S.G.stage.desaturate(0); S.G.music.setPaused(false); S.wipe.reveal(0.1); } else S.go(this.backTo); }
  rows() {
    const t = this.tabs[this.tab]; const q = TIERS[qualityIndex()];
    if (t === 'VIDEO') return [{ k: 'quality', l: 'QUALITY', v: q.name, hint: `shadow ${q.shadow || 'off'} · bloom ${q.bloom ? 'on' : 'off'} · aberration ${q.aberration ? 'on' : 'off'} · fxaa ${q.fxaa ? 'on' : 'off'}`, step: d => setQuality((qualityIndex() + d + TIERS.length) % TIERS.length) }, { k: 'shake', l: 'SCREEN SHAKE', v: settings.shake ? 'ON' : 'OFF', step: () => { settings.shake = !settings.shake; } }, { k: 'dmg', l: 'DAMAGE NUMBERS', v: settings.damageNumbers ? 'ON' : 'OFF', step: () => { settings.damageNumbers = !settings.damageNumbers; document.documentElement.classList.toggle('nodmg', !settings.damageNumbers); } }];
    if (t === 'AUDIO') return ['master', 'sfx', 'music', 'voice'].map(b => ({ k: b, l: b.toUpperCase() + ' VOLUME', v: Math.round(settings[b] * 100) + '%', step: d => { settings[b] = Math.max(0, Math.min(1, Math.round((settings[b] + d * 0.1) * 10) / 10)); this.S.G.sfx.setVolume(b, settings[b]); if (b === 'sfx' || b === 'master') this.S.G.sfx.uiConfirm(); } })).concat([{ k: 'ann', l: 'ANNOUNCER', v: settings.announcer ? 'ON' : 'OFF', step: () => { settings.announcer = !settings.announcer; this.S.G.announcer.enabled = settings.announcer; } }, { k: 'blur', l: 'MUTE ON BLUR', v: settings.muteOnBlur ? 'ON' : 'OFF', step: () => { settings.muteOnBlur = !settings.muteOnBlur; } }]);
    if (t === 'CONTROLS P1' || t === 'CONTROLS P2') { const i = t.endsWith('1') ? 0 : 1; return ['moveUp', 'moveDown', 'moveLeft', 'moveRight', ...ACTIONS].map(a => ({ k: 'key:' + i + ':' + a, l: ACTION_LABEL[a] || a.replace('move', 'MOVE ').toUpperCase(), v: this.capture === 'key:' + i + ':' + a ? 'PRESS A KEY…' : controls.keys[i][a].replace('Key', '').replace('Digit', '').replace('Arrow', '').toUpperCase(), remap: true })).concat([{ k: 'reset', l: 'RESET ALL CONTROLS', v: '', step: () => { resetControls(); } }]); }
    if (t === 'PAD') return ACTIONS.map(a => ({ k: 'pad:' + a, l: ACTION_LABEL[a], v: this.capture === 'pad:' + a ? 'PRESS A BUTTON…' : PAD_NAMES[controls.pad[a]] || String(controls.pad[a]), remap: true })).concat([{ k: 'dz', l: 'STICK DEADZONE', v: Math.round(controls.deadzone * 100) + '%', step: d => { controls.deadzone = Math.max(0.05, Math.min(0.5, Math.round((controls.deadzone + d * 0.05) * 100) / 100)); } }, { k: 'rumble', l: 'RUMBLE', v: controls.rumble ? 'ON' : 'OFF', step: () => { controls.rumble = !controls.rumble; this.S.G.input.rumble(0, 0.8, 0.8, 200); } }, { k: 'inv', l: 'CAMERA Y INVERT', v: controls.camInvert ? 'ON' : 'OFF', step: () => { controls.camInvert = !controls.camInvert; } }]);
    return [{ k: 'rm', l: 'REDUCED MOTION', v: settings.reducedMotion.toUpperCase(), step: d => { const o = ['auto', 'on', 'off']; settings.reducedMotion = o[(o.indexOf(settings.reducedMotion) + d + 3) % 3]; applySettings(this.S.G); } }, { k: 'ann2', l: 'ANNOUNCER VOICE', v: settings.announcer ? 'ON' : 'OFF', step: () => { settings.announcer = !settings.announcer; this.S.G.announcer.enabled = settings.announcer; } }];
  }
  render() {
    this.tabsEl.innerHTML = this.tabs.map((t, i) => `<span class="${i === this.tab ? 'on' : ''}">${t}</span>`).join('');
    this._rows = this.rows(); this.list.innerHTML = '';
    this.nav.set(this._rows.map(r => { const e = h('div', 'set-row', `<span class="l">${r.l}</span><span class="v">${r.v}</span>${r.hint ? `<span class="h">${r.hint}</span>` : ''}`); this.list.appendChild(e); return e; }), 1, true);
  }
  confirm(i) { const r = this._rows[i]; if (r.remap) { this.capture = r.k; this.render(); this._listen(); } else if (r.step) { r.step(1); this.render(); } }
  _listen() {
    const onKey = e => { if (!this.capture?.startsWith('key:')) return; e.preventDefault(); const [, i, a] = this.capture.split(':'); if (e.code !== 'Escape') controls.keys[+i][a] = e.code; saveControls(); this.capture = null; removeEventListener('keydown', onKey, true); this.render(); };
    addEventListener('keydown', onKey, true);
  }
  update(dt, f) {
    if (this.capture?.startsWith('pad:')) { const gp = this.S.G.input.pads[0]; if (gp) { const b = gp.buttons.findIndex(x => x.pressed); if (b >= 0 && this._padReady) { controls.pad[this.capture.slice(4)] = b; saveControls(); this.capture = null; this._padReady = false; this.render(); } if (b < 0) this._padReady = true; } return; }
    if (f.leftP || f.rightP) { const r = this._rows[this.nav.index]; if (r?.step) { r.step(f.leftP ? -1 : 1); this.S.G.sfx.uiMove(); this.render(); return; } }
    this.nav.update(dt, f);
  }
}
