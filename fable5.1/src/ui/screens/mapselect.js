// STAGE SELECT — ten cards with a live preview of the focused map.
import { Nav, h } from '../nav.js';
import { MAPS, MAP_IDS, buildArena } from '../../stage/index.js';
export class MapScreen {
  constructor(S) {
    this.S = S; this.el = h('div', 'screen map', `<div class="screen-head"><span class="kicker">STAGE SELECT</span><h1>WHERE</h1></div><div class="map-grid"></div><div class="map-desc"><b></b><span></span></div><div class="map-opts"></div><div class="hint"><b>A</b> fight <b>B</b> back <b>SELECT</b> random <b>LB/RB</b> rounds · difficulty</div>`);
    S.ui.appendChild(this.el); this.el.hidden = true;
    this.grid = this.el.querySelector('.map-grid'); this.desc = this.el.querySelector('.map-desc'); this.optsEl = this.el.querySelector('.map-opts');
    this.nav = new Nav(S.G.sfx, { cols: 5, onConfirm: (el) => this.pick(el.dataset.id), onBack: () => S.go('select', this.data), onMove: el => this.focusMap(el.dataset.id), onExtra: f => this.extra(f) });
  }
  show(data) {
    this.el.hidden = false; this.data = data;
    this.grid.innerHTML = '';
    const tiles = MAP_IDS.map(id => { const d = MAPS[id].DEF; const t = h('div', 'mtile', `<span class="jp">${d.jp}</span><span class="en">${d.name}</span>`); t.dataset.id = id; this.grid.appendChild(t); return t; });
    const rnd = h('div', 'mtile random', `<span class="jp">？</span><span class="en">RANDOM</span>`); rnd.dataset.id = 'random'; this.grid.appendChild(rnd); tiles.push(rnd);
    this.nav.set(tiles, 5);
    const li = MAP_IDS.indexOf(this.S.session.map); this.nav.focus(li >= 0 ? li : 0);
    this._opts();
  }
  hide() { this.el.hidden = true; this.preview?.dispose(); this.preview = null; }
  _opts() { const s = this.S.session; this.optsEl.innerHTML = `<span>BEST OF ${s.rounds * 2 - 1}</span>${this.data.mode === 'cpu' && !this.data.training ? `<span>CPU: ${['EASY', 'NORMAL', 'HARD'][s.difficulty]}</span>` : ''}`; }
  extra(f) { const s = this.S.session; if (f.ct1P) { s.rounds = s.rounds === 1 ? 2 : s.rounds === 2 ? 3 : 1; this._opts(); this.S.G.sfx.uiMove(); } if (f.ct2P) { s.difficulty = (s.difficulty + 1) % 3; this._opts(); this.S.G.sfx.uiMove(); } if (f.selectP) { this.nav.focus(Math.floor(Math.random() * MAP_IDS.length)); this.S.G.sfx.uiSwoosh(); } }
  focusMap(id) {
    const d = id === 'random' ? { name: 'RANDOM', desc: 'Whatever the dice say.' } : MAPS[id].DEF;
    this.desc.querySelector('b').textContent = d.name; this.desc.querySelector('span').textContent = d.desc;
    if (this.preview) { this.preview.dispose(); this.preview = null; }
    if (id !== 'random') { const stage = this.S.G.stage; this.preview = buildArena(id, stage); const pc = MAPS[id].DEF.previewCam || { pos: [0, 9, 26], look: [0, 1, 0] }; stage.camera.position.set(...pc.pos); stage.camera.lookAt(...pc.look); stage.camera.fov = 44; stage.camera.updateProjectionMatrix(); this._pt = 0; }
  }
  pick(id) {
    const S = this.S; const map = id === 'random' ? MAP_IDS[(Math.random() * MAP_IDS.length) | 0] : id;
    S.session.map = id === 'random' ? null : id; S.save();
    S.G.sfx.uiLock();
    S.go('match', { mode: this.data.mode, picks: this.data.picks, map, rounds: S.session.rounds, difficulty: S.session.difficulty, training: !!this.data.training, humans: this.data.mode === 'ffa' ? Math.max(1, S.G.input.livePads) : 1 });
  }
  update(dt, f) { this.nav.update(dt, f); if (this.preview) { this._pt += dt; const stage = this.S.G.stage; const pc = MAPS[this.preview.def.id].DEF.previewCam || { pos: [0, 9, 26], look: [0, 1, 0] }; const a = this._pt * 0.08; stage.camera.position.set(pc.pos[0] * Math.cos(a) - pc.pos[2] * Math.sin(a), pc.pos[1], pc.pos[0] * Math.sin(a) + pc.pos[2] * Math.cos(a)); stage.camera.lookAt(...pc.look); this.preview.update(dt, this._pt); } }
}
