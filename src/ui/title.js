// TITLE SCREEN — the first thing the game shows.
//
// It exists for three reasons, and the third is the one that makes it load-
// bearing rather than decorative:
//
//  1. A front door. The game used to drop straight into character select.
//  2. A place to advertise an open online game before anyone has picked
//     anything, so joining one is a first-class choice and not a thing you
//     discover on the roster screen.
//  3. THE AUDIO GESTURE. Browsers refuse to start audio until the user has
//     interacted with the page, and PRESS START is exactly that interaction.
//     Asking for fullscreen from the same press works for the same reason —
//     both need a real user gesture, and a gamepad poll is not one.
import * as THREE from 'three';
import { ROSTER, ROSTER_IDS, hex } from '../characters/index.js';
import { makeClips } from '../art/anim/index.js';
import { AnimPlayer } from '../art/anim/player.js';
import { makeGlowMat } from '../arena/arena.js';
import { damp } from '../core/mathutil.js';

// Who stands on the pedestal. Picked at random each boot, because a title
// screen that shows a different fighter every time is a free reminder of how
// big the roster is.
function pickHero() {
  return ROSTER_IDS[(Math.random() * ROSTER_IDS.length) | 0];
}

export class TitleScreen {
  // `online` is the OnlineController (or null). The screen only ever READS it:
  // whether a game is open, and how many.
  constructor(stage, input, sfx, uiRoot, online = null) {
    this.stage = stage;
    this.input = input;
    this.sfx = sfx;
    this.online = online;
    this.t = 0;
    this.focus = 0;
    this.options = ['start'];
    this._optSig = '';

    // ---- the scene ------------------------------------------------------
    this.group = new THREE.Group();
    stage.scene.add(this.group);
    const id = pickHero();
    this.heroId = id;
    this.model = ROSTER[id].buildModel();
    this.model.group.position.set(0, 0, 0);
    this.player = new AnimPlayer(this.model.bones, makeClips(id));
    this.player.play('idle');
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95, 1.12, 0.1, 40),
      new THREE.MeshStandardMaterial({ color: 0x1b2036, roughness: 0.9 }));
    disc.position.y = -0.05;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.026, 8, 48),
      makeGlowMat(ROSTER[id].accent, 0.9));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 40),
      new THREE.MeshStandardMaterial({ color: 0x090c15, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.12;
    this.ring = ring;
    this.group.add(this.model.group, disc, ring, floor);

    // ---- the look --------------------------------------------------------
    // Fog buries the floor's far edge, so there is no horizon line running
    // across the middle of the wordmark. Saved and restored, because the stage
    // is shared with every screen that comes after this one.
    this._savedBg = stage.scene.background;
    this._savedFog = stage.scene.fog;
    const bg = new THREE.Color(0x090b14);
    stage.scene.background = bg;
    stage.scene.fog = new THREE.Fog(bg.getHex(), 6, 19);
    const L = stage.lights;
    this._savedLights = {
      key: L.key.intensity, rim: L.rim.intensity, hemi: L.hemi.intensity,
      keyPos: L.key.position.clone(), rimC: L.rim.color.getHex()
    };
    // Lit from the front so the face reads, with a RESTRAINED accent rim. A
    // saturated rim at full strength does not light the fighter, it dyes the
    // whole floor — the first pass turned the entire screen red.
    L.key.intensity = this._savedLights.key * 1.2;
    L.key.position.set(2.6, 5.2, 5.0);
    L.rim.intensity = this._savedLights.rim * 0.9;
    L.rim.color.setHex(ROSTER[id].accent).lerp(new THREE.Color(0xffffff), 0.45);
    L.hemi.intensity = this._savedLights.hemi * 0.6;
    // FRAME WHOEVER TURNED UP. Mahoraga is 3.6 m tall and a fixed camera would
    // put his waist in shot; the roster already carries the numbers the match
    // camera uses for exactly this, so they are reused rather than guessed.
    const size = ROSTER[id].config?.size || {};
    this.camDist = 4.3 * (size.camDist ?? 1);
    this.camLook = 1.05 + (size.camHeight ?? 0) * 0.55;

    // ---- the overlay ----------------------------------------------------
    this.el = document.createElement('div');
    this.el.className = 'title-screen';
    this.el.innerHTML = `
      <div class="ts-kanji">呪術廻戦</div>
      <div class="ts-brand">
        <h1>JUJUTSU<br><em>BATTLEGROUNDS</em></h1>
        <p>ALL ASSETS PROCEDURAL</p>
      </div>
      <div class="ts-menu"></div>
      <div class="ts-foot"></div>`;
    uiRoot.appendChild(this.el);
    this.menu = this.el.querySelector('.ts-menu');
    this.foot = this.el.querySelector('.ts-foot');
    this.el.style.setProperty('--ac', hex(ROSTER[id].accent));
    this._renderMenu();

    this.done = new Promise(res => { this._resolve = res; });
  }

  // The option list is derived, not stored: an online game appearing while the
  // player is looking at the title adds JOIN ONLINE GAME underneath PRESS
  // START, and one disappearing takes it away again.
  get gamesOpen() { return this.online?.games?.length || 0; }

  _renderMenu() {
    const n = this.gamesOpen;
    this.options = n > 0 ? ['start', 'join'] : ['start'];
    if (this.focus >= this.options.length) this.focus = this.options.length - 1;
    const g = this.online?.games?.[0];
    this.menu.innerHTML = `
      <button class="ts-opt ts-start${this.focus === 0 ? ' focus' : ''}" data-a="start">
        <span>PRESS START</span>
      </button>
      ${n > 0 ? `
      <button class="ts-opt ts-join${this.focus === 1 ? ' focus' : ''}" data-a="join">
        <i class="ts-dot"></i>
        <span>JOIN ONLINE GAME</span>
        <em>${(g?.hostName || 'HOST')} · ${(g?.seats | 0)}/${g?.maxSeats || 4}</em>
      </button>` : ''}`;
    for (const b of this.menu.querySelectorAll('.ts-opt')) {
      b.onmouseenter = () => { this.focus = this.options.indexOf(b.dataset.a); this._refreshFocus(); };
      b.onclick = () => this._choose(b.dataset.a);
    }
    // The hint follows the menu: there is nothing to navigate until the online
    // option turns up.
    this.foot.textContent = this.options.length > 1
      ? '↑ ↓  CHOOSE     A  ·  SPACE  ·  ENTER  CONFIRM'
      : 'A  ·  SPACE  ·  ENTER';
  }

  _refreshFocus() {
    this.menu.querySelectorAll('.ts-opt').forEach((b, i) =>
      b.classList.toggle('focus', i === this.focus));
  }

  _choose(action) {
    if (this._chosen) return;
    this._chosen = true;
    this.sfx.uiOk();
    this.el.classList.add('go');
    this._resolve(action);
  }

  update(dt) {
    this.t += dt;
    const f = this.input.pollAll('cpu', 2).all.reduce(
      (a, x) => ({ ...a, upP: a.upP || x.upP, downP: a.downP || x.downP, confirmP: a.confirmP || x.confirmP }),
      { upP: false, downP: false, confirmP: false });

    // Re-derive the option list when the lobby changes underneath us.
    const sig = this.gamesOpen + '|' + (this.online?.games?.[0]?.id || '');
    if (sig !== this._optSig) {
      this._optSig = sig;
      this._renderMenu();
    }

    if (!this._chosen) {
      if (this.options.length > 1) {
        if (f.upP || f.downP) {
          this.focus = (this.focus + (f.downP ? 1 : this.options.length - 1)) % this.options.length;
          this.sfx.uiMove();
          this._refreshFocus();
        }
      }
      if (f.confirmP) this._choose(this.options[this.focus]);
    }

    // ---- scene ----------------------------------------------------------
    this.model.group.rotation.y += dt * 0.35;
    this.model.group.position.y = damp(this.model.group.position.y, 0, 4, dt);
    this.ring.material.opacity = 0.55 + Math.sin(this.t * 1.6) * 0.25;
    this.player.update(dt);
    this.model.update(dt);

    // A slow drift in, so the very first frame of the game is already moving.
    //
    // THE FIGURE SITS IN THE RIGHT-HAND THIRD. The wordmark and the menu own
    // the left, so the camera is aimed to the LEFT of the pedestal rather than
    // at it — that pushes the fighter across the frame instead of parking him
    // on top of the type.
    const cam = this.stage.camera;
    const orbit = Math.sin(this.t * 0.11) * 0.4;
    cam.position.lerp(
      new THREE.Vector3(2.0 + orbit, 0.95 + this.camLook * 0.5, this.camDist), 0.04);
    cam.lookAt(-1.55, this.camLook + 0.18, 0);
  }

  destroy() {
    const L = this.stage.lights;
    L.key.intensity = this._savedLights.key;
    L.key.position.copy(this._savedLights.keyPos);
    L.rim.intensity = this._savedLights.rim;
    L.rim.color.setHex(this._savedLights.rimC);
    L.hemi.intensity = this._savedLights.hemi;
    this.stage.scene.background = this._savedBg;
    this.stage.scene.fog = this._savedFog;
    this.stage.scene.remove(this.group);
    this.el.remove();
  }
}
