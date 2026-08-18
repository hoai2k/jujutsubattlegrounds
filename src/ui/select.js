// Character select: rotating 3D models on pedestals + a skewed roster strip.
//
// SIMULTANEOUS PICKING. In every local mode each seat gets its OWN cursor and
// locks in independently — two pads means two players moving around the roster
// at the same time, not one waiting for the other. VS CPU stays sequential,
// because there is only one human making both choices.
//
// Seats without a device of their own (a third seat with only two pads, say)
// fall back to being driven by the merged input of everything connected, so a
// short-handed couch can still get into a match.
import * as THREE from 'three';
import { ROSTER, ROSTER_IDS, hex, variantsOf, hasVariants, resolveVariant, joinPick, lastVariant, rememberVariant } from '../characters/index.js';
import { makeClips } from '../art/anim/index.js';
import { AnimPlayer } from '../art/anim/player.js';
import { makeGlowMat } from '../arena/arena.js';
import { damp } from '../core/mathutil.js';
import { mergeMenu } from '../input/input.js';
import { BubbleSystem } from '../fx/bubble.js';
import { pickTaunt } from '../combat/taunts.js';

// ---------------------------------------------------------------------------
// TAUNT PREVIEW — Y, not D-pad Left
// ---------------------------------------------------------------------------
// D-pad Left is the taunt button everywhere else in the game, and it cannot be
// the taunt button HERE, because on this screen it is the cursor: previewing a
// taunt would move your selection one fighter to the left, which is a worse
// bug than not having a preview at all. Y is free on both this screen and the
// variant sub-step, so Y previews.
//
// The preview runs on the pedestal model's own AnimPlayer — the same clip the
// fighter will play in a match, on the same rig — and returns it to idle when
// the clip is done. It is a preview in the literal sense: there is no second
// authoring path, so a taunt that looks right here looks right in the fight.
const PREVIEW_KEY = 'heavyP';

// one colour per seat, used by the cursor rings, the card chips and the panels
export const SEAT_COLORS = [0x4f9fe8, 0xff5f4f, 0x6fe89a, 0xffd84f];

// ---------------------------------------------------------------------------
// THE ROSTER IS A GRID, NOT A LINE
// ---------------------------------------------------------------------------
// At sixteen fighters a single row was 16 tiles wide and the pedestals behind
// it were pushed down to a 1.04 m gap to stay inside a 16:9 frame — every
// figure tiny, every tile cramped, and the camera backed off so far that the
// models stopped being the hero of the screen. Splitting into rows buys the
// width back: the tiles get bigger, the pedestals get further apart, and the
// camera comes in.
//
// Rows are chosen to keep a row under COLS_MAX and then BALANCED, so 16 is
// 8 + 8 rather than 8 + 8 - 1 + a stray. The 3D pedestal rows mirror the card
// grid exactly, which is what makes moving the cursor down feel like it moves
// you down the physical line-up rather than to an unrelated place.
const COLS_MAX = 8;
function gridShape(n) {
  const rows = Math.max(1, Math.ceil(n / COLS_MAX));
  return { rows, cols: Math.ceil(n / rows) };
}

// ---------------------------------------------------------------------------
// SEAT COUNT IS DETECTED, NOT CHOSEN
// ---------------------------------------------------------------------------
// The mode menu is gone. Pads decide how many people are playing, the way
// every couch game does it, and the screen tells you what it found instead of
// asking. The one thing hardware genuinely cannot tell you is whether TWO
// people are sitting at ONE keyboard — no pad, or one pad plus a keyboard, is
// ambiguous — so that single case keeps a one-button toggle rather than a
// menu. Two or more pads is unambiguous and offers no choice at all.
//
// ONLINE changes one thing about this: there is no CPU seat to fill, so a lone
// player brings ONE seat rather than two, and the screen is always in
// simultaneous mode. Everything else — pads adding seats, the keyboard-versus
// toggle, hot-plug — behaves identically, which is what makes bringing two
// people from one couch into an online game work with no extra UI at all.
function detectSetup(pads, kbVersus, online = false) {
  if (pads >= 2) return { seats: Math.min(4, pads), mode: 'local', via: 'pads' };
  if (kbVersus) return { seats: 2, mode: 'local', via: 'keyboard' };
  if (online) return { seats: 1, mode: 'local', via: 'solo' };
  return { seats: 2, mode: 'cpu', via: 'cpu' };
}

export class SelectScreen {
  constructor(stage, input, sfx, uiRoot, opts = {}) {
    // ---- ONLINE -----------------------------------------------------------
    // The online controller, or null. When it is present and in a session,
    // locking in every local seat marks this machine READY in the lobby
    // instead of starting a local match — the roster, the cursors, the variant
    // sub-step and the device detection are all completely unchanged. There is
    // no separate online character select, which is the whole point.
    this.online = opts.online || null;
    this.stage = stage;
    this.input = input;
    this.sfx = sfx;
    this.root = uiRoot;
    this.group = new THREE.Group();
    this.models = [];
    this.players = [];
    // phase 0 = picking (simultaneous), >= seats = done. VS CPU keeps using
    // `phase` as the seat index, one at a time. There is no mode phase any
    // more — the screen opens straight into the roster and the seat count is
    // detected from the hardware (see _syncDevices).
    this.phase = 0;
    this.kbVersus = false;
    const setup = detectSetup(input.livePads, false, !!this.online?.active);
    this.mode = setup.mode;
    this.seats = setup.seats;
    this.via = setup.via;
    this.grid = gridShape(ROSTER_IDS.length);
    this.picks = {};
    this.cursors = [0, 1, 2, 3];      // each seat opens on a different fighter
    this.locked = [false, false, false, false];
    this.chars = [];
    this.spinT = 0;
    // ---- THE VARIANT SUB-STEP -------------------------------------------
    // Per seat: which variant index that seat is currently looking at, and
    // whether that seat is IN the sub-step right now. A seat only ever enters
    // it after confirming a character who actually has more than one version,
    // so a character with a single version costs nobody an extra button press.
    this.vIndex = [0, 0, 0, 0];
    this.inVariant = [false, false, false, false];

    stage.scene.add(this.group);
    // THE PEDESTALS MIRROR THE CARD GRID. Same rows, same columns, same index
    // — so the cursor moving down a row on the tiles moves down a row of
    // bodies, and the two halves of the screen never disagree about where you
    // are. Back rows sit further away and STEP UP, which is what keeps the
    // front row from burying them; the tilt on the camera does the rest.
    const { rows, cols } = this.grid;
    const gap = cols >= 8 ? 2.0 : cols >= 6 ? 2.3 : 2.6;
    const rowGap = 2.5, rowRise = 0.62;
    ROSTER_IDS.forEach((id, i) => {
      const model = ROSTER[id].buildModel();
      const row = Math.floor(i / cols), col = i % cols;
      // the last row can be short; centre it on its own count rather than on
      // the full column width, so a ragged roster still reads as deliberate
      const inRow = Math.min(cols, ROSTER_IDS.length - row * cols);
      const x = (col - (inRow - 1) / 2) * gap;
      // row 0 is the BACK row: highest and furthest away
      const depth = rows - 1 - row;
      const y = depth * rowRise;
      const z = -depth * rowGap;
      model.group.position.set(x, y, z);
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.2, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x2a3048, roughness: 0.9 }));
      disc.position.set(x, y - 0.05, z);
      // a riser under the back rows so they read as standing ON something
      if (depth > 0) {
        const riser = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.32, y, 24),
          new THREE.MeshStandardMaterial({ color: 0x1c2136, roughness: 1 }));
        riser.position.set(x, y / 2 - 0.05, z);
        this.group.add(riser);
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.025, 8, 40), makeGlowMat(0x5f7fd0, 0.8));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, y + 0.02, z);
      this.group.add(model.group, disc, ring);
      const player = new AnimPlayer(model.bones, makeClips(id));
      player.play('idle');
      // `tauntT` counts down a running preview; `spin` freezes the turntable
      // while one plays, because a taunt authored to read from the front is not
      // worth previewing on a model that is facing away halfway through it.
      this.models.push({ id, model, ring, x, y, z, shown: 'base', tauntT: 0 });
      this.players.push(player);
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 32),
      new THREE.MeshStandardMaterial({ color: 0x141828, roughness: 1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.1;
    this.group.add(floor);
    // The same bubble system the match uses, on the same group as the models —
    // the group carries no transform, so pedestal coordinates are world
    // coordinates and the anchor maths needs no special case.
    this.bubbles = new BubbleSystem(this.group, stage.camera);

    this.el = document.createElement('div');
    this.el.className = 'select-screen';
    // Layout intent: the rotating 3D roster is the hero, so the UI frames it.
    // Brand slab top-left, mode tabs top-right, a hero panel on each side for
    // the first two seats, and the roster as a skewed strip along the bottom.
    this.el.innerHTML = `
      <div class="select-title">
        <h1>JUJUTSU<br>BATTLEGROUNDS</h1>
        <p>ALL ASSETS PROCEDURAL</p>
      </div>
      <div class="brand-kanji">呪術</div>
      <div class="select-sub"></div>
      <div class="device-row">
        <div class="dev-head">
          <span class="dev-mode"></span>
          <span class="dev-count"></span>
        </div>
        <div class="dev-chips"></div>
        <div class="dev-hint"></div>
      </div>
      ${[0, 1].map(s => `
        <div class="sel-hero h${s}" data-seat="${s}">
          <div class="sh-seat"></div>
          <div class="sh-jp"></div>
          <div class="sh-name"></div>
          <div class="sh-rule"></div>
          <div class="sh-role"></div>
          <div class="sh-variant">
            <div class="sv-head">VERSION</div>
            <div class="sv-name"></div>
            <div class="sv-desc"></div>
            <div class="sv-badge"></div>
            <div class="sv-dots"></div>
            <div class="sv-hint">◀ ▶  CHANGE VERSION   ·   Y  TAUNT   ·   B  BACK</div>
          </div>
          <div class="sh-tag"></div>
          <div class="sh-taunt">Y &nbsp;·&nbsp; PREVIEW TAUNT</div>
        </div>`).join('')}
      <div class="select-cards" style="--cols:${this.grid.cols}">
        ${ROSTER_IDS.map(id => {
      const r = ROSTER[id];
      return `
            <div class="sel-card${r.spirit ? ' spirit' : ''}" data-id="${id}" style="--pc:${hex(r.accent)}">
              <div class="cwm">${r.jp}</div>
              ${r.spirit ? '<div class="spirit-tag">呪霊</div>' : ''}
              <div class="cname">${r.config.name}</div>
              <div class="crole">${r.role}</div>
              <div class="sel-tag"></div>
            </div>`;
    }).join('')}
      </div>`;
    uiRoot.appendChild(this.el);
    this.cards = [...this.el.querySelectorAll('.sel-card')];
    this.sub = this.el.querySelector('.select-sub');
    this.heroes = [...this.el.querySelectorAll('.sel-hero')];
    this.devMode = this.el.querySelector('.dev-mode');
    this.devCount = this.el.querySelector('.dev-count');
    this.devChips = this.el.querySelector('.dev-chips');
    this.devHint = this.el.querySelector('.dev-hint');
    this._refresh();

    this.done = new Promise(res => { this._resolve = res; });
  }

  get simultaneous() { return this.mode !== 'cpu'; }
  _seatLabel(i) { return this.mode === 'cpu' && i === 1 ? 'CPU' : 'P' + (i + 1); }
  // is this seat still choosing?
  _active(i) { return this.phase >= 0 && i < this.seats && !this.locked[i]; }

  _refresh() {
    const picking = this.phase >= 0 && this.phase < this.seats;
    const waiting = this.locked.slice(0, this.seats).filter(Boolean).length;
    const online = !!this.online?.active;
    this.el.classList.toggle('online', online);
    this.sub.textContent = online && waiting === this.seats
      ? (this.online.canStart ? 'READY — PRESS A / ENTER TO START' : 'READY — WAITING FOR THE LOBBY')
      : !this.simultaneous
        ? (this.phase === 1 ? 'CHOOSE THE OPPONENT' : 'PLAYER 1 — CHOOSE YOUR SORCERER')
        : waiting === this.seats ? 'READY'
          : waiting > 0 ? `CHOOSE YOUR SORCERER — ${waiting}/${this.seats} LOCKED IN`
            : 'CHOOSE YOUR SORCERER';
    this._refreshDevices();

    // hero panels: one per side for the first two seats
    this.heroes.forEach((hero, s) => {
      const show = picking && s < this.seats && (this.simultaneous || s === this.phase);
      hero.classList.toggle('on', show);
      if (!show) return;
      const r = ROSTER[ROSTER_IDS[this.cursors[s]]];
      hero.classList.toggle('spirit', !!r.spirit);
      hero.classList.toggle('locked', this.locked[s]);
      hero.style.setProperty('--ac', this.locked[s] ? hex(SEAT_COLORS[s]) : hex(r.accent));
      hero.style.setProperty('--seat', hex(SEAT_COLORS[s]));
      hero.querySelector('.sh-seat').textContent =
        this._seatLabel(s) + (this.locked[s] ? ' — LOCKED' : '');
      hero.querySelector('.sh-jp').textContent = r.jp;
      hero.querySelector('.sh-name').textContent = r.config.name;
      hero.querySelector('.sh-role').textContent = r.role;
      hero.querySelector('.sh-tag').textContent = r.spirit ? '呪霊 CURSED SPIRIT' : '呪術師 SORCERER';

      // ---- THE VARIANT PANEL --------------------------------------------
      // Only present while that seat is actually choosing a version. The
      // rotating model on the pedestal has already swapped to whichever one is
      // focused, so this panel only has to carry the words: which version, one
      // line on what it is, and whether it changes how the character PLAYS.
      const charId = ROSTER_IDS[this.cursors[s]];
      const vp = hero.querySelector('.sh-variant');
      const open = this.inVariant[s];
      vp.classList.toggle('on', open);
      if (open) {
        const list = this._variantList(charId);
        const v = list[this.vIndex[s]];
        vp.querySelector('.sv-name').textContent = v.name;
        vp.querySelector('.sv-desc').textContent = v.descriptor || '';
        const badge = vp.querySelector('.sv-badge');
        badge.textContent = v.type === 'cosmetic' ? 'COSMETIC — PLAYS EXACTLY AS THE BASE' : (v.role || r.role);
        badge.classList.toggle('gameplay', v.type === 'gameplay');
        vp.querySelector('.sv-dots').innerHTML =
          list.map((_, i) => `<i class="${i === this.vIndex[s] ? 'on' : ''}"></i>`).join('');
        hero.querySelector('.sh-name').textContent = v.name;
      }
    });
    this.el.querySelector('.brand-kanji').classList.toggle('hide', picking);

    // cards: a chip per seat, outlined while hovering and filled once locked
    this.cards.forEach((c, i) => {
      const hovering = [], lockedOn = [];
      for (let s = 0; s < this.seats; s++) {
        if (this.simultaneous) {
          if (this.cursors[s] === i) (this.locked[s] ? lockedOn : hovering).push(s);
        } else {
          if (s === this.phase && this.cursors[0] === i) hovering.push(s);
          else if (this.chars[s] === ROSTER_IDS[i]) lockedOn.push(s);
        }
      }
      c.classList.toggle('focus', hovering.length > 0);
      c.classList.toggle('taken', lockedOn.length > 0);
      // the first hovering seat colours the tile so the highlight has an owner
      const owner = hovering[0] ?? lockedOn[0];
      if (owner != null) c.style.setProperty('--seat', hex(SEAT_COLORS[owner]));
      c.querySelector('.sel-tag').innerHTML = [
        ...hovering.map(s => `<span class="s${s} hov">${this._seatLabel(s)}</span>`),
        ...lockedOn.map(s => `<span class="s${s} lok">${this._seatLabel(s)}</span>`)
      ].join('');
    });
  }

  // ---- THE DEVICE READOUT --------------------------------------------------
  // What replaced the mode menu. It is not interactive (except for the single
  // keyboard-versus toggle); it is the screen REPORTING what it found, which
  // is the whole point of detecting instead of asking. One chip per seat,
  // named for the device actually driving it, in that seat's colour.
  _refreshDevices() {
    const pads = this.input.livePads;
    const online = !!this.online?.active;
    this.devMode.textContent = online ? 'ONLINE VERSUS'
      : this.mode === 'cpu' ? 'VS CPU' : 'LOCAL VERSUS';
    this.devCount.textContent = online
      ? (this.seats === 1 ? '1 SEAT FROM THIS MACHINE' : `${this.seats} SEATS FROM THIS MACHINE`)
      : this.mode === 'cpu' ? '1 PLAYER' : `${this.seats} PLAYERS`;

    // Which device drives each seat mirrors input.pollAll's assignment exactly
    // — pad i takes seat i, and the keyboard backs the seats without one. If
    // that mapping ever changes, this readout is lying, so it is derived from
    // the same two facts (pad count, seat index) rather than kept in step by
    // hand.
    const label = s => {
      if (pads > s) return 'PAD ' + (s + 1);
      if (this.mode === 'cpu' && s === 1) return 'COMPUTER';
      // the keyboard only splits into two named halves when two people are
      // actually sharing it — otherwise it is just "the keyboard"
      return (this.kbVersus && pads === 0) ? 'KEYBOARD ' + (s + 1) : 'KEYBOARD';
    };
    this.devChips.innerHTML = Array.from({ length: this.seats }, (_, s) => {
      const cpu = this.mode === 'cpu' && s === 1;
      return `<span class="dev-chip s${s}${cpu ? ' cpu' : ''}">
        <b>${cpu ? 'CPU' : 'P' + (s + 1)}</b>${label(s)}</span>`;
    }).join('');

    // The toggle exists ONLY in the ambiguous case. With two or more pads
    // there is nothing to decide and nothing is offered.
    this.devHint.innerHTML = pads >= 2
      ? `<i>${pads} CONTROLLERS DETECTED</i>`
      : this.kbVersus
        ? (online ? 'SELECT / TAB  ·  DROP THE SECOND SEAT' : 'SELECT / TAB  ·  BACK TO VS CPU')
        : 'SELECT / TAB  ·  ADD A KEYBOARD PLAYER 2';
    this.devHint.classList.toggle('auto', pads >= 2);
  }

  // Re-derive the setup from the hardware. Called every frame so a pad
  // connecting or dying mid-select is picked up immediately — the readout is
  // only trustworthy if it is live.
  _syncDevices() {
    const pads = this.input.livePads;
    const online = !!this.online?.active;
    const next = detectSetup(pads, this.kbVersus, online);
    // Going online (or leaving) changes the seat count the same way plugging a
    // pad in does, so it is re-derived here rather than special-cased.
    if (online !== this._wasOnline) { this._wasOnline = online; this._uncommit(); }
    if (online && next.seats !== this._sentSeats) {
      this._sentSeats = next.seats;
      this.online.setSeats(next.seats);
    }
    if (next.seats === this.seats && next.mode === this.mode) {
      // THE SEAT COUNT IS NOT THE ONLY THING ON SCREEN. Going from no pad to
      // one pad changes neither the mode (still VS CPU) nor the seat count
      // (still two), but it absolutely changes the readout: seat 1 stops being
      // the keyboard and becomes PAD 1. Without this the chips kept claiming
      // "KEYBOARD" with a controller plugged in and lit.
      if (pads !== this._shownPads) { this._shownPads = pads; this._refreshDevices(); }
      return false;
    }
    this._shownPads = pads;
    const grew = next.seats > this.seats;
    // A seat that just vanished must not stay locked, or the screen waits
    // forever for a player who unplugged. A seat that just appeared starts
    // unlocked on its own fighter.
    for (let s = next.seats; s < 4; s++) { this.locked[s] = false; this.inVariant[s] = false; }
    if (grew) for (let s = this.seats; s < next.seats; s++) {
      this.locked[s] = false;
      this.cursors[s] = s % ROSTER_IDS.length;
    }
    this.seats = next.seats;
    this.mode = next.mode;
    this.via = next.via;
    // switching to or from VS CPU changes who picks — restart the picking
    this.phase = 0;
    this.chars = [];
    this.sfx.uiOk();
    return true;
  }

  // ---- THE VARIANT SUB-STEP ------------------------------------------------
  // The rotating model on the pedestal IS the variant preview: confirming a
  // character with variants swaps the model in place for the one being looked
  // at, so the differences are visible on the same lit, spinning figure the
  // player was already looking at rather than in a separate menu.
  _variantList(charId) { return variantsOf(ROSTER[charId], charId); }

  _showVariant(slotIdx, charId, variantId) {
    const slot = this.models[slotIdx];
    if (!slot || slot.shown === variantId) return;
    const r = resolveVariant(ROSTER[charId], charId, variantId);
    this.group.remove(slot.model.group);
    const model = r.buildModel();
    model.group.position.set(slot.x, slot.model.group.position.y, 0);
    model.group.rotation.y = slot.model.group.rotation.y;
    this.group.add(model.group);
    slot.model = model;
    slot.shown = variantId;
    // the body just changed under a running preview — drop it, bubble included
    slot.tauntT = 0;
    slot.sayDef = null;
    if (slot.anchor) this.bubbles?.clearFor(slot.anchor);
    const player = new AnimPlayer(model.bones, makeClips(r.clipId));
    player.play('idle');
    this.players[slotIdx] = player;
  }

  // A seat confirms a character. Either it has versions and we step into the
  // sub-step, or it does not and the seat locks immediately.
  _confirmChar(seat, slotIdx) {
    const charId = ROSTER_IDS[slotIdx];
    if (!hasVariants(ROSTER[charId])) return true;          // lock straight away
    const list = this._variantList(charId);
    // preselect whatever this player used last for this character
    const want = lastVariant(charId);
    this.vIndex[seat] = Math.max(0, list.findIndex(v => v.id === want));
    this.inVariant[seat] = true;
    this._showVariant(slotIdx, charId, list[this.vIndex[seat]].id);
    return false;
  }

  // Move within the sub-step. Returns true when the seat has committed.
  _variantInput(seat, slotIdx, f) {
    const charId = ROSTER_IDS[slotIdx];
    const list = this._variantList(charId);
    const n = list.length;
    let moved = false;
    if (f.leftP) { this.vIndex[seat] = (this.vIndex[seat] + n - 1) % n; moved = true; }
    if (f.rightP) { this.vIndex[seat] = (this.vIndex[seat] + 1) % n; moved = true; }
    if (moved) {
      this.sfx.uiMove();
      this._showVariant(slotIdx, charId, list[this.vIndex[seat]].id);
      this._refresh();
    }
    if (f.backP) {
      // BACK returns to character select and puts the base model back
      this.inVariant[seat] = false;
      this._showVariant(slotIdx, charId, 'base');
      this.sfx.uiBack();
      this._refresh();
      return false;
    }
    if (f.confirmP) {
      this.inVariant[seat] = false;
      rememberVariant(charId, list[this.vIndex[seat]].id);
      this.sfx.uiOk();
      return true;
    }
    return false;
  }

  // What a seat has actually picked, as a pick id ('gojo' or 'gojo:shinjuku').
  _pickFor(seat, slotIdx) {
    const charId = ROSTER_IDS[slotIdx];
    const list = this._variantList(charId);
    const v = list[this.vIndex[seat]] || list[0];
    return joinPick(charId, hasVariants(ROSTER[charId]) ? v.id : 'base');
  }

  // ---- TAUNT PREVIEW ------------------------------------------------------
  // Plays the taunt of whatever is currently ON the pedestal — including the
  // variant, if the seat is inside the version sub-step. That is the whole
  // point of previewing here: a player deciding between GOJO and
  // GOJO 【SHINJUKU】 gets to see that the two taunts are different before
  // committing, which is a thing they cannot find out any other way.
  _previewTaunt(slotIdx) {
    const slot = this.models[slotIdx];
    if (!slot || slot.tauntT > 0) return;              // one at a time per model
    const pick = joinPick(slot.id, slot.shown);
    const def = pickTaunt(pick, slot.tauntN = (slot.tauntN ?? 0) + 1);
    const player = this.players[slotIdx];
    if (!def || !player.clips.has(def.clip)) return;
    player.play(player.clips.get(def.clip), { fade: 0.14, restart: true });
    slot.tauntT = def.dur;
    this.sfx.taunt?.(def.cue);
    if (def.say) {
      slot.sayAt = def.at ?? 0.6;
      slot.sayDef = def;
    } else {
      slot.sayAt = -1;
      slot.sayDef = null;
    }
  }

  // The anchor a bubble hangs off. The pedestal models are not Fighters, so
  // this is the smallest object BubbleSystem will accept: a position and a hurt
  // capsule. The capsule is read off the character's real config, so Mahoraga-
  // sized bodies (and a grown Kurourushi's base size) anchor correctly here for
  // exactly the same reason they do in a match.
  //
  // Built ONCE per pedestal and cached, for two reasons: BubbleSystem matches
  // bubbles to owners by identity (so `clearFor` has to be handed the same
  // object), and `pos.y` is a getter so the bubble rides the focus lift and any
  // variant swap without anyone having to push updates at it.
  _bubbleAnchor(slot) {
    if (slot.anchor) return slot.anchor;
    const size = ROSTER[slot.id]?.config?.size || {};
    slot.anchor = {
      pos: { x: slot.x, z: slot.z, get y() { return slot.model.group.position.y; } },
      hurtBox: { center: size.hurtCenter ?? 1.05, height: size.hurtHeight ?? 1.45 }
    };
    return slot.anchor;
  }

  // Which input frame drives a given seat. A seat with its own device uses it
  // exclusively — that is the whole point. A seat with no device falls back to
  // the merged input of everything connected so it is not simply stuck.
  _frameFor(all, seat) {
    if (seat < this.input.drivenSeats) return all[seat] || all[0];
    return all.reduce((a, x) => mergeMenu(a, x), all[0]);
  }

  // Every local seat is locked. Offline that starts a match; online it
  // publishes the picks and hands control to the lobby.
  _commit() {
    this.chars = this.cursors.slice(0, this.seats).map((c, s) => this._pickFor(s, c));
    if (this.online?.active) {
      if (this._sentPicks !== this.chars.join(',')) {
        this._sentPicks = this.chars.join(',');
        this.online.setPicks(this.chars);
        this._refresh();
      }
      return;
    }
    this._finish();
  }

  // A seat came back out of its lock — we are no longer ready.
  _uncommit() {
    if (!this.online?.active || this._sentPicks == null) return;
    this._sentPicks = null;
    this.online.setPicks(null);
  }

  _finish() {
    this.picks.mode = this.mode === 'cpu' ? 'cpu' : 'local';
    this.picks.chars = [...this.chars];
    this.picks.p1 = this.chars[0];
    this.picks.p2 = this.chars[1];
    this._resolve(this.picks);
  }

  // Grid movement for one cursor. Left/right walk the whole roster in reading
  // order and WRAP, so every fighter is reachable with one axis exactly as
  // they were on the old single row; up/down jump a full row. Vertical
  // movement clamps to the column rather than wrapping — on a ragged last row
  // wrapping lands you somewhere unrelated, and a cursor that visibly refuses
  // to leave the grid is easier to read than one that teleports.
  _move(idx, f) {
    const N = ROSTER_IDS.length;
    const { cols } = this.grid;
    if (f.leftP) return (idx + N - 1) % N;
    if (f.rightP) return (idx + 1) % N;
    if (f.upP) return idx - cols >= 0 ? idx - cols : idx;
    if (f.downP) return idx + cols < N ? idx + cols : idx;
    return idx;
  }

  update(dt) {
    const all = this.input.pollAll(this.mode, 4).all;
    const N = ROSTER_IDS.length;

    // HARDWARE FIRST, every frame. A pad plugged in halfway through picking
    // adds a seat there and then; one that dies releases the seat it held.
    if (this._syncDevices()) this._refresh();
    // The lobby changes underneath this screen — someone joins, everyone gets
    // ready — and the subtitle has to follow it. Signature-compared so the
    // panels are only rebuilt when something actually changed.
    if (this.online) {
      const sig = `${!!this.online.active}|${!!this.online.canStart}|${!!this.online.session?.everyoneReady}`;
      if (sig !== this._onlineSig) { this._onlineSig = sig; this._refresh(); }
    }
    // the one remaining choice, and only while it is ambiguous
    {
      const f = all.reduce((a, x) => mergeMenu(a, x), all[0]);
      if (f.selectP && this.input.livePads < 2) {
        this.kbVersus = !this.kbVersus;
        this.sfx.uiOk();
        this._syncDevices();
        this._refresh();
      }
    }

    if (this.simultaneous) {
      // ---- every seat moves and locks on its own ---------------------------
      let changed = false;
      for (let s = 0; s < this.seats; s++) {
        const f = this._frameFor(all, s);
        if (this.locked[s]) {
          // a locked player can back out again, right up until everyone is in
          if (f.backP) { this.locked[s] = false; this.sfx.uiBack(); changed = true; this._uncommit(); }
          // ONLINE: with every local seat locked the roster cursors are idle,
          // so confirm is free — and it is the host's START. Nothing else on
          // this screen wants the press at this moment, which is exactly why
          // the binding is safe.
          else if (f.confirmP && this.online?.canStart) this.online.startMatch();
          continue;
        }
        // Y previews the taunt, in BOTH steps — read before the sub-step's
        // early `continue`, so it works while choosing a version too.
        if (f[PREVIEW_KEY]) this._previewTaunt(this.cursors[s]);
        // ---- the variant sub-step owns this seat's input while it is open --
        if (this.inVariant[s]) {
          if (this._variantInput(s, this.cursors[s], f)) { this.locked[s] = true; changed = true; }
          continue;
        }
        const moved = this._move(this.cursors[s], f);
        if (moved !== this.cursors[s]) { this.cursors[s] = moved; this.sfx.uiMove(); changed = true; }
        if (f.confirmP) {
          this.sfx.uiOk();
          // characters with versions open the sub-step; everyone else locks
          if (this._confirmChar(s, this.cursors[s])) this.locked[s] = true;
          changed = true;
        }
      }
      if (changed) this._refresh();
      if (this.locked.slice(0, this.seats).every(Boolean)) this._commit();
      else this._uncommit();
    } else {
      // ---- VS CPU: one human, two choices, in order ------------------------
      const f = all.reduce((a, x) => mergeMenu(a, x), all[0]);
      const seat = this.phase;
      if (f[PREVIEW_KEY]) this._previewTaunt(this.cursors[0]);
      if (this.inVariant[seat]) {
        // the sub-step owns the input until it resolves
        if (this._variantInput(seat, this.cursors[0], f)) {
          this.chars[seat] = this._pickFor(seat, this.cursors[0]);
          this.phase++;
          if (this.phase >= this.seats) { this._finish(); return; }
          this._refresh();
        }
        // fall through to the scene update below
      } else {
        const moved = this._move(this.cursors[0], f);
        if (moved !== this.cursors[0]) { this.cursors[0] = moved; this.sfx.uiMove(); this._refresh(); }
        if (f.confirmP) {
          this.sfx.uiOk();
          if (this._confirmChar(seat, this.cursors[0])) {
            this.chars[seat] = this._pickFor(seat, this.cursors[0]);
            this.phase++;
            if (this.phase >= this.seats) { this._finish(); return; }
          }
          this._refresh();
        }
        // BACK steps to the previous seat. There is no mode screen behind
        // seat 0 any more, so it floors there rather than falling off.
        if (f.backP && this.phase > 0) {
          this.sfx.uiBack();
          this.phase--;
          this.chars.length = this.phase;
          this._refresh();
        }
      }
    }

    // ---- scene ------------------------------------------------------------
    // A model is lit if ANY seat's cursor is on it, and the ring takes that
    // seat's colour — that is how four players read their own selection on one
    // screen at once.
    this.spinT += dt;
    const owners = new Array(this.models.length).fill(-1);
    if (this.phase >= 0) {
      if (this.simultaneous) {
        for (let s = this.seats - 1; s >= 0; s--) owners[this.cursors[s]] = s;
      } else {
        owners[this.cursors[0]] = this.phase;
        this.chars.forEach((cid, s) => { const i = ROSTER_IDS.indexOf(cid); if (i >= 0 && owners[i] < 0) owners[i] = s; });
      }
    }
    this.models.forEach((m, i) => {
      const seat = owners[i];
      const focused = seat >= 0;
      // ---- a running taunt preview ---------------------------------------
      if (m.tauntT > 0) {
        m.tauntT -= dt;
        // the bubble pops on the clip's own beat, exactly as it does in a match
        if (m.sayDef && (m.sayDef.dur - m.tauntT) >= m.sayAt) {
          this.bubbles.say(this._bubbleAnchor(m), m.sayDef.say, {
            hold: m.sayDef.hold ?? 1.3, accent: hex(ROSTER[m.id].accent)
          });
          m.sayDef = null;
        }
        if (m.tauntT <= 0) { this.players[i].play('idle', { fade: 0.2 }); m.sayDef = null; }
      }
      // The turntable STOPS while a taunt plays. Every one of these is authored
      // to read from a fighting-game angle, and a model rotating through 200
      // degrees during a three-second clip shows you a different animation than
      // the one you will get in a match.
      m.model.group.rotation.y = m.tauntT > 0
        ? damp(m.model.group.rotation.y % (Math.PI * 2), 0, 5, dt)
        : focused
          ? m.model.group.rotation.y + dt * 1.1
          : damp(m.model.group.rotation.y % (Math.PI * 2), 0, 4, dt);
      // the lift is RELATIVE to the row's own height — the back rows stand on
      // risers, so a flat target would drop them to the floor when focused
      m.model.group.position.y = damp(m.model.group.position.y, m.y + (focused ? 0.14 : 0), 6, dt);
      m.ring.material.opacity = focused ? 0.95 : 0.22;
      m.ring.material.color.setHex(focused ? SEAT_COLORS[seat] : 0x5f7fd0);
      this.players[i].update(dt);
      m.model.update(dt);
    });
    this.bubbles.update(dt);

    // Framing: the hero panels own both edges and the roster strip owns the
    // bottom, so the line-up sits high and centred between them.
    //
    // The grid changed what "fit" means. A single row only had to fit its
    // WIDTH; a stack of rows has depth as well, so the camera has to clear the
    // back row over the front one — which is height and tilt, not distance.
    // Both numbers come off the actual pedestal spread rather than being
    // guessed, so a roster change re-frames itself.
    const halfWidth = Math.max(...this.models.map(m => Math.abs(m.x))) + 1.3;
    const depth = Math.max(...this.models.map(m => -m.z));
    const rise = Math.max(...this.models.map(m => m.y));
    const dist = Math.max(9.0, halfWidth * 1.06) + depth * 0.42;
    const cam = this.stage.camera;
    cam.position.lerp(
      new THREE.Vector3(Math.sin(this.spinT * 0.1) * 0.35, 3.1 + rise * 0.8, dist), 0.05);
    cam.lookAt(0, 0.7 + rise * 0.45, -depth * 0.42);
  }

  destroy() {
    this.bubbles.dispose();
    this.stage.scene.remove(this.group);
    this.el.remove();
  }
}
