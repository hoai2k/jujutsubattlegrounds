// MAP SELECT — the screen between character select and the fight.
//
// The preview is a LIVE build of the actual map, not a rendered thumbnail:
// the same code the match runs, dropped into the menu scene with a slow
// orbiting camera. Building a 90-metre map takes long enough to be felt, so
// the build is debounced while the cursor moves and the previous map is
// disposed before the next one goes in — hold left on the d-pad and you scroll
// the list at full speed with no hitching, and the preview catches up when you
// stop.
import * as THREE from 'three';
import { MAPS, MAP_IDS, buildMap, applyMapLighting, currentQuality } from '../arena/index.js';
import { mergeMenu } from '../input/input.js';

const RANDOM = { id: 'random', name: 'RANDOM', jp: '?', desc: 'Let the shadow decide.', size: '—' };

export class MapSelect {
  constructor(stage, input, sfx, uiRoot) {
    this.stage = stage;
    this.input = input;
    this.sfx = sfx;
    this.focus = 0;
    this.t = 0;
    this.preview = null;
    this.pendingId = null;
    this.buildT = 0;
    this.entries = [...MAP_IDS.map(id => MAPS[id].def), RANDOM];

    // remember the light rig so the menu can put it back
    const L = stage.lights;
    this._savedLights = {
      key: { c: L.key.color.getHex(), i: L.key.intensity, p: L.key.position.clone() },
      rim: { c: L.rim.color.getHex(), i: L.rim.intensity, p: L.rim.position.clone() },
      hemi: { s: L.hemi.color.getHex(), g: L.hemi.groundColor.getHex(), i: L.hemi.intensity }
    };
    this._savedBg = stage.scene.background;
    this._savedFog = stage.scene.fog;

    this.el = document.createElement('div');
    this.el.className = 'map-screen';
    // The live preview is the point, so the UI clears the middle of the frame:
    // brand slab top-left, the stage name set enormous bottom-left, and the
    // list as skewed tabs down the right edge.
    this.el.innerHTML = `
      <div class="map-head">
        <h1>SELECT<br>STAGE</h1>
        <p class="map-sub">EVERY DOMAIN WORKS EVERYWHERE — THE SPACE DOES NOT</p>
      </div>
      <div class="brand-kanji map-kanji">結界</div>
      <div class="map-info">
        <div class="mi-jp"></div>
        <div class="mi-name"></div>
        <div class="mi-desc"></div>
        <div class="mi-size"></div>
      </div>
      <div class="map-cards">
        ${this.entries.map(d => `
          <div class="map-card${d.id === 'random' ? ' rnd' : ''}" data-id="${d.id}">
            <div class="mc-jp">${d.jp}</div>
            <div class="mc-name">${d.name}</div>
          </div>`).join('')}
      </div>
      <div class="map-hint">▲ ▼ CHOOSE &nbsp;·&nbsp; A / SPACE CONFIRM &nbsp;·&nbsp; B / BACKSPACE BACK</div>`;
    uiRoot.appendChild(this.el);
    this.cards = [...this.el.querySelectorAll('.map-card')];
    this._refresh();

    this.done = new Promise(res => { this._resolve = res; });
  }

  _refresh() {
    const d = this.entries[this.focus];
    this.cards.forEach((c, i) => c.classList.toggle('focus', i === this.focus));
    this.el.querySelector('.mi-name').textContent = d.name;
    this.el.querySelector('.mi-jp').textContent = d.jp;
    this.el.querySelector('.mi-desc').textContent = d.desc;
    this.el.querySelector('.mi-size').textContent = d.size || '';
    // queue the live build — the wait is what stops fast scrolling from
    // building seven maps in a second
    this.pendingId = d.id === 'random' ? null : d.id;
    this.buildT = 0.28;
    if (d.id === 'random') this._clearPreview();
  }

  _clearPreview() {
    if (!this.preview) return;
    this.stage.scene.remove(this.preview.group);
    this.preview.dispose?.();
    this.preview = null;
  }

  _buildPreview(id) {
    this._clearPreview();
    const q = { ...currentQuality(), debrisBudget: 0, destructionDetail: 0 };
    const map = buildMap(id, { quality: q });
    this.stage.scene.add(map.group);
    this.stage.scene.fog = map.fog;
    this.stage.scene.background = new THREE.Color(map.background);
    applyMapLighting(this.stage, map);
    this.preview = map;
    // Each stage authors its own beauty shot (map DEF.previewCam). A single
    // orbit formula cannot serve both an open boulevard and a station platform
    // with a 10 m ceiling — every automatic rule tried ended up either inside
    // a tower, above a ceiling slab, or buried in the treeline. The camera
    // swings through a shallow arc around the authored anchor so the shot
    // moves without ever being able to swing into geometry.
    const b = map.bounds;
    const span = Math.max(b.maxX - b.minX, b.maxZ - b.minZ);
    const pc = map.previewCam;
    this.camLook = new THREE.Vector3(...(pc ? pc.look : [(b.minX + b.maxX) / 2, span * 0.05, (b.minZ + b.maxZ) / 2]));
    this.camHome = new THREE.Vector3(...(pc ? pc.pos : [(b.minX + b.maxX) / 2 + span * 0.28, span * 0.17, (b.minZ + b.maxZ) / 2 + span * 0.28]));
  }

  update(dt) {
    this.t += dt;
    const f = this.input.pollAll('local', 4).all.reduce((a, x) => mergeMenu(a, x));
    // the list runs vertically down the right edge, so up/down step one and
    // left/right jump a stride — the opposite of the old horizontal row
    const N = this.entries.length;
    if (f.upP) { this.focus = (this.focus + N - 1) % N; this.sfx.uiMove(); this._refresh(); }
    if (f.downP) { this.focus = (this.focus + 1) % N; this.sfx.uiMove(); this._refresh(); }
    if (f.leftP) { this.focus = (this.focus + N - 3) % N; this.sfx.uiMove(); this._refresh(); }
    if (f.rightP) { this.focus = (this.focus + 3) % N; this.sfx.uiMove(); this._refresh(); }
    if (f.confirmP) {
      this.sfx.uiOk();
      this._resolve(this.entries[this.focus].id);
      return;
    }
    if (f.backP) { this.sfx.uiBack(); this._resolve(null); return; }

    if (this.buildT > 0) {
      this.buildT -= dt;
      if (this.buildT <= 0 && this.pendingId) this._buildPreview(this.pendingId);
    }

    const cam = this.stage.camera;
    if (this.preview) {
      this.preview.update(dt, cam);
      // a shallow drift around the authored anchor — enough to feel alive,
      // never enough to swing behind a pillar
      const swing = Math.sin(this.t * 0.28) * 0.22;
      const rel = this.camHome.clone().sub(this.camLook);
      rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), swing);
      rel.y += Math.sin(this.t * 0.4) * 0.6;
      cam.position.lerp(this.camLook.clone().add(rel), 0.07);
      cam.lookAt(this.camLook);
    } else {
      // RANDOM: nothing to show, so the camera just drifts in the dark
      cam.position.lerp(new THREE.Vector3(Math.sin(this.t * 0.2) * 6, 3, 12), 0.05);
      cam.lookAt(0, 1.2, 0);
    }
  }

  destroy() {
    this._clearPreview();
    const L = this.stage.lights, S = this._savedLights;
    L.key.color.setHex(S.key.c); L.key.intensity = S.key.i; L.key.position.copy(S.key.p);
    L.rim.color.setHex(S.rim.c); L.rim.intensity = S.rim.i; L.rim.position.copy(S.rim.p);
    L.hemi.color.setHex(S.hemi.s); L.hemi.groundColor.setHex(S.hemi.g); L.hemi.intensity = S.hemi.i;
    this.stage.scene.background = this._savedBg;
    this.stage.scene.fog = this._savedFog;
    this.el.remove();
  }
}
