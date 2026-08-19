// Result screen (KO -> winner + rematch menu) and the control legend overlay.
export class ResultScreen {
  constructor(root, sfx) {
    this.sfx = sfx;
    // Set by game.js. Replays the winner's taunt as their win pose — the pose
    // already played itself once when the round ended; this is for the player
    // who wants to watch it again, which is the entire reason taunts exist.
    this.onTaunt = () => { };
    this.el = document.createElement('div');
    this.el.className = 'result-screen';
    this.el.innerHTML = `
      <div class="r-ko">K.O.</div>
      <div class="r-win"></div>
      <div class="r-menu">
        <button class="r-btn" data-a="rematch"><span>REMATCH</span></button>
        <button class="r-btn" data-a="select"><span>CHARACTER SELECT</span></button>
      </div>
      <div class="r-taunt">D-PAD LEFT &nbsp;·&nbsp; TAUNT AGAIN</div>`;
    root.appendChild(this.el);
    this.focus = 0;
    this.buttons = [...this.el.querySelectorAll('.r-btn')];
    this.buttons.forEach((b, i) => b.onclick = () => this._pick(i));
    this._promise = new Promise(res => { this._resolve = res; });
    this.shown = false;
  }
  show(winnerName) {
    this.el.querySelector('.r-win').textContent = winnerName + ' WINS';
    this.el.classList.add('on');
    this.shown = true;
    this._refresh();
  }
  // ONLINE: what happens next is the host's call — three people cannot each
  // decide whether this is a rematch. A guest's buttons go dead and the screen
  // says who it is waiting for, rather than pretending the press did nothing.
  setLocked(on, text = 'WAITING FOR THE HOST') {
    this.locked = !!on;
    this.el.classList.toggle('locked', this.locked);
    let n = this.el.querySelector('.r-wait');
    if (!n) {
      n = document.createElement('div');
      n.className = 'r-wait';
      this.el.appendChild(n);
    }
    n.textContent = this.locked ? text : '';
    n.classList.toggle('on', this.locked);
  }
  _refresh() { this.buttons.forEach((b, i) => b.classList.toggle('focus', i === this.focus)); }
  _pick(i) {
    if (this.locked) return;
    this.sfx.uiOk();
    this._resolve(i === 0 ? 'rematch' : 'select');
  }
  update(inputFrame) {
    if (!this.shown) return;
    // A locked screen still replays the taunt — that costs nobody anything
    // and it is the one thing there is to do while waiting.
    if (this.locked) { if (inputFrame.tauntP) this.onTaunt(); return; }
    // TAUNT is read FIRST and swallows the frame's `leftP`. D-pad Left is both
    // the taunt button and a menu-left on this screen, and the menu here is two
    // buttons on one axis — so left and right would otherwise both toggle the
    // same pair and the taunt would move the cursor as a side effect.
    if (inputFrame.tauntP) { this.onTaunt(); return; }
    if (inputFrame.leftP || inputFrame.rightP) {
      this.focus = 1 - this.focus;
      this.sfx.uiMove();
      this._refresh();
    }
    if (inputFrame.confirmP) this._pick(this.focus);
  }
  get done() { return this._promise; }
  destroy() { this.el.remove(); }
}

// Pause overlay. Freezes the match; either player (or the mouse) can drive it.
export class PauseMenu {
  constructor(root, sfx) {
    this.sfx = sfx;
    this.open = false;
    this.focus = 0;
    this.onChoice = () => { };
    this.el = document.createElement('div');
    this.el.className = 'pause-screen';
    this.el.innerHTML = `
      <div class="pause-card">
        <h2>PAUSED</h2>
        <div class="pause-menu">
          <button class="r-btn" data-a="resume"><span>RESUME</span></button>
          <button class="r-btn" data-a="settings"><span>SETTINGS</span></button>
          <button class="r-btn" data-a="controls"><span>CONTROLS</span></button>
          <button class="r-btn" data-a="select"><span>QUIT TO SELECT</span></button>
        </div>
        <p class="pause-hint">START / ESC TO RESUME</p>
      </div>`;
    root.appendChild(this.el);
    this.buttons = [...this.el.querySelectorAll('.r-btn')];
    this.buttons.forEach((b, i) => {
      b.onmouseenter = () => { this.focus = i; this._refresh(); };
      b.onclick = () => this._pick(i);
    });
  }
  show() { this.open = true; this.focus = 0; this.el.classList.add('on'); this._refresh(); }
  hide() { this.open = false; this.el.classList.remove('on'); }
  _refresh() { this.buttons.forEach((b, i) => b.classList.toggle('focus', i === this.focus)); }
  _pick(i) {
    this.sfx.uiOk();
    this.onChoice(this.buttons[i].dataset.a);
  }
  update(f) {
    if (!this.open) return;
    // the same press that opened the menu must not also confirm an entry
    // (gamepad START reports as both pause and confirm)
    if (f.pauseP) return;
    const n = this.buttons.length;
    if (f.upP || f.leftP) { this.focus = (this.focus + n - 1) % n; this.sfx.uiMove(); this._refresh(); }
    if (f.downP || f.rightP) { this.focus = (this.focus + 1) % n; this.sfx.uiMove(); this._refresh(); }
    if (f.confirmP) this._pick(this.focus);
  }
  destroy() { this.el.remove(); }
}

// Always-visible corner bar: fullscreen toggle + pause button.
export class SystemBar {
  constructor(root, { onFullscreen, onPause, onMusic, onSettings }) {
    this.el = document.createElement('div');
    this.el.className = 'sysbar';
    this.el.innerHTML = `
      <button class="sys-btn" data-a="music" title="Music on/off (M)">♪</button>
      <button class="sys-btn" data-a="settings" title="Settings">⚙</button>
      <button class="sys-btn" data-a="pause" title="Pause (Esc / START)">❚❚</button>
      <button class="sys-btn" data-a="full" title="Fullscreen (F)">⛶</button>`;
    root.appendChild(this.el);
    this.el.querySelector('[data-a="pause"]').onclick = onPause;
    this.el.querySelector('[data-a="full"]').onclick = onFullscreen;
    this.el.querySelector('[data-a="music"]').onclick = onMusic;
    this.el.querySelector('[data-a="settings"]').onclick = onSettings;
  }
  setPaused(p) {
    this.el.querySelector('[data-a="pause"]').textContent = p ? '▶' : '❚❚';
  }
  setMusic(on) {
    const b = this.el.querySelector('[data-a="music"]');
    b.textContent = on ? '♪' : '♪̶';
    b.classList.toggle('off', !on);
  }
  destroy() { this.el.remove(); }
}

// Enter (never leave). Called from the title screen's PRESS START, which is
// the one moment the game has a genuine user gesture to spend — the browser
// rejects the request without one, and a gamepad poll is not one. Failure is
// silent on purpose: not being fullscreen is not an error.
export function enterFullscreen() {
  if (document.fullscreenElement) return;
  const el = document.getElementById('app') || document.documentElement;
  try { el.requestFullscreen?.()?.catch?.(() => { }); } catch { }
}

export function toggleFullscreen() {
  const el = document.getElementById('app') || document.documentElement;
  if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => { });
  else document.exitFullscreen?.().catch(() => { });
}

export class Legend {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'legend';
    this.el.innerHTML = `
      <h3>CONTROLS — GAMEPAD (P1 KEYS / P2 KEYS)</h3>
      <div><b>Left stick</b> forward / back <span style="color:#8b98bc">(W,S / ↑,↓)</span></div>
      <div><b>Left stick ←→</b> strafe around <span style="color:#8b98bc">(A,D / ←,→)</span></div>
      <div><b>A</b> jump <span style="color:#8b98bc">(Space / RShift)</span></div>
      <div><b>A</b> as you hit the floor <span style="color:#8b98bc">(Space / RShift)</span> — TECH: rise instantly, no knockdown (press early and you lose it)</div>
      <div><b>X</b> punch string <span style="color:#8b98bc">(J / ;)</span></div>
      <div><b>Y</b> heavy — knocks down, costs stamina <span style="color:#8b98bc">(L / .)</span>, cancels out of the punch string</div>
      <div><b>RB</b> Technique 1 <span style="color:#8b98bc">(U / [)</span></div>
      <div><b>RT</b> Technique 2 <span style="color:#8b98bc">(I / ])</span></div>
      <div><b>LT</b> block — hold <span style="color:#8b98bc">(K / ')</span></div>
      <div><b>LB</b> dash — stamina <span style="color:#8b98bc">(Shift / RCtrl)</span>. Hold a direction and it opens with a BURST that will take you out of an attack; the burst costs stamina up front, the dash itself drains it</div>
      <div><b>D-Right</b> Domain / Ultimate <span style="color:#8b98bc">(O / \\)</span> — needs MAX+FULL CE</div>
      <div><b>D-Right again</b> release your own domain early</div>
      <div><b>B</b> SPECIAL <span style="color:#8b98bc">(H / M)</span> — Gojo: warp · Nanami: 7:3 timing (press again to stop) · Yuta: Copy · Yuji: Black Flash · Todo: Boogie Woogie</div>
      <div><b>B tap / B hold</b> — Megumi, Toji and Geto choose from a set. <b>TAP</b> commits the default instantly; <b>HOLD</b> opens the radial with that default already selected, the <b>left stick</b> picks another, and releasing confirms. Anything destroyed is greyed out and cannot be selected</div>
      <div><b>D-Left</b> TAUNT <span style="color:#8b98bc">(P / /)</span> — no gameplay effect, and you are wide open for the whole thing. Move, dash or block to cancel</div>
      <div><b>L3 (left stick press)</b> toggle opponent lock <span style="color:#8b98bc">(Q / ,)</span> — unlocked you turn to face the way you move, which is how you attack shikigami and transfigured humans</div>
      <div><b>Yuji's Flash</b> press B the instant a technique connects — the slot flares red when the window is open</div>
      <div><b>LT+D-Right</b> barrier break — inside a domain</div>
      <div><b>LT hold</b> Simple Domain — inside a domain</div>
      <div><b>Right stick</b> camera orbit</div>
      <div><b>START / Esc</b> pause &nbsp;·&nbsp; <b>F</b> fullscreen &nbsp;·&nbsp; <b>M</b> music</div>
      <div><b>SELECT (Tab)</b> toggle this panel</div>
      <div style="margin-top:6px;color:#8b98bc">Pads: pad1=P1, pad2=P2 · one pad: pad=P1, keyboard=P2 (either key set)</div>
      <div style="color:#8b98bc">Character select: every connected pad moves its own cursor and locks in independently</div>
      <div style="color:#8b98bc">3-4 player free-for-all: P3 and P4 need pad 3 and pad 4 — the keyboard only covers P1/P2</div>`;
    root.appendChild(this.el);
  }
  toggle() { this.el.classList.toggle('on'); }
  destroy() { this.el.remove(); }
}
