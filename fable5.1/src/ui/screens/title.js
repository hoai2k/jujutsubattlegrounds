// TITLE — the attract screen. Kanji watermark, the logo, PRESS START, and a
// slow orbit of two fighters behind it.
import { h } from '../nav.js';
import { benchSceneInto } from '../../bench/scene.js';
export class TitleScreen {
  constructor(S) { this.S = S; this.el = h('div', 'screen title', `
    <div class="title-jp">呪術廻戦</div>
    <div class="title-logo"><span class="a">JUJUTSU</span><span class="b">BATTLEGROUNDS</span><span class="c">FABLE 5.1</span></div>
    <div class="title-press">PRESS START</div>
    <div class="title-foot"><span>F4 QUALITY</span><span>F3 PERF</span><span>F2 SHOT</span><span>F FULLSCREEN</span></div>`); S.ui.appendChild(this.el); this.el.hidden = true; this.t = 0; }
  show() { this.el.hidden = false; this.t = 0; this.S.G.stage.scene.background?.set?.(0x07080d); this.preview = benchSceneInto(this.S.G.stage, ['gojo', 'sukuna'], { orbit: true }); }
  hide() { this.el.hidden = true; this.preview?.dispose(); this.preview = null; }
  update(dt, f) { this.t += dt; this.preview?.update(dt); if (f.confirmP || f.startP || f.punchP) { this.S.G.sfx.uiLock(); this.S.go('mode'); } }
}
