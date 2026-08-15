// Player settings — persisted to localStorage, applied globally.
//
// Kept deliberately small: a setting earns its place here only if a player
// would reasonably want it different from the default. Everything else is an
// art decision and stays fixed.
import { QUALITY_LEVELS, setQualityIndex, currentQuality } from '../arena/index.js';

const KEY = 'cursed-arena.settings';

export const DEFAULTS = {
  // The CRT layer: scanlines, film grain and the heavy vignette over the whole
  // frame. It is a strong look and it is not for everyone, so it is OFF by
  // default — the cel-shading, bloom and per-map colour grade are the actual
  // art direction and are unaffected by this.
  videoFilters: false,
  quality: 2,          // index into QUALITY_LEVELS
  music: true
};

export const settings = { ...DEFAULTS };

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(settings, DEFAULTS, JSON.parse(raw));
  } catch { /* corrupt or unavailable storage: fall back to defaults */ }
  return settings;
}

export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { }
}

// Push the current settings into the systems that care about them.
export function applySettings(stage) {
  document.documentElement.classList.toggle('filters-on', !!settings.videoFilters);
  const q = setQualityIndex(settings.quality);
  stage?.setQuality?.(q);
  return q;
}

// ---------------------------------------------------------------------------
// The panel. Reachable from the system bar (always) and the pause menu.
// ---------------------------------------------------------------------------
const ROWS = [
  {
    key: 'videoFilters', label: 'VIDEO FILTERS', jp: '走査線',
    hint: 'Scanlines, grain and vignette — the old-TV look.',
    get: () => settings.videoFilters ? 'ON' : 'OFF',
    step: d => { settings.videoFilters = !settings.videoFilters; }
  },
  {
    key: 'quality', label: 'GRAPHICS QUALITY', jp: '画質',
    hint: 'Destruction detail, debris, particles and post. The art never changes.',
    get: () => QUALITY_LEVELS[settings.quality].name,
    step: d => {
      settings.quality = (settings.quality + d + QUALITY_LEVELS.length) % QUALITY_LEVELS.length;
    }
  },
  {
    key: 'music', label: 'MUSIC', jp: '音楽',
    hint: 'The two streamed tracks. SFX are unaffected.',
    get: () => settings.music ? 'ON' : 'OFF',
    step: d => { settings.music = !settings.music; }
  }
];

export class SettingsPanel {
  constructor(root, sfx, { stage, onMusic } = {}) {
    this.sfx = sfx;
    this.stage = stage;
    this.onMusic = onMusic;
    this.open = false;
    this.focus = 0;
    this.el = document.createElement('div');
    this.el.className = 'settings-screen';
    this.el.innerHTML = `
      <div class="set-card">
        <h2>SETTINGS</h2>
        <div class="set-rows">
          ${ROWS.map(r => `
            <div class="set-row" data-k="${r.key}">
              <span class="sr-label">${r.label}</span>
              <span class="sr-jp">${r.jp}</span>
              <span class="sr-value"></span>
            </div>`).join('')}
        </div>
        <p class="set-hint"></p>
        <p class="pause-hint">◀ ▶ CHANGE &nbsp;·&nbsp; B / BACKSPACE / ESC TO CLOSE</p>
      </div>`;
    root.appendChild(this.el);
    this.rows = [...this.el.querySelectorAll('.set-row')];
    this.rows.forEach((el, i) => {
      el.onmouseenter = () => { this.focus = i; this._refresh(); };
      el.onclick = () => this._step(1);
    });
    this._refresh();
  }

  show() { this.open = true; this.focus = 0; this.el.classList.add('on'); this._refresh(); }
  hide() { this.open = false; this.el.classList.remove('on'); }
  toggle() { this.open ? this.hide() : this.show(); }

  _refresh() {
    this.rows.forEach((el, i) => {
      el.classList.toggle('focus', i === this.focus);
      el.querySelector('.sr-value').textContent = ROWS[i].get();
      el.classList.toggle('off', /^(OFF)$/.test(ROWS[i].get()));
    });
    this.el.querySelector('.set-hint').textContent = ROWS[this.focus].hint;
  }

  _step(d) {
    ROWS[this.focus].step(d);
    this.sfx.uiOk();
    saveSettings();
    applySettings(this.stage);
    if (ROWS[this.focus].key === 'music') this.onMusic?.(settings.music);
    this._refresh();
  }

  update(f) {
    if (!this.open) return;
    if (f.upP) { this.focus = (this.focus + ROWS.length - 1) % ROWS.length; this.sfx.uiMove(); this._refresh(); }
    if (f.downP) { this.focus = (this.focus + 1) % ROWS.length; this.sfx.uiMove(); this._refresh(); }
    if (f.leftP) this._step(-1);
    if (f.rightP) this._step(1);
    if (f.backP) { this.sfx.uiBack(); this.hide(); }
  }

  destroy() { this.el.remove(); }
}
