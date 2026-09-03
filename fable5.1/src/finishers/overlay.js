// FINISHERS — THE SCREEN LAYER
// ===========================================================================
// Everything the finisher draws OVER the scene, and nothing else. Read the
// list carefully, because the brief on this feature is a hard requirement:
//
//   letterbox · depth-of-field mask · motion-blur smear · speed lines ·
//   impact frames · a per-finisher colour wash · the entry and exit dips
//
// There is NO TEXT and NO UI in that list. No name card, no technique title,
// no "FINISHER" banner, no button prompt over the shot. Every one of those is
// a thing the brief says must not be on screen, and a title card is exactly
// the kind of thing that creeps in as "presentation" — so it is written down
// here as a rule rather than left to taste. The only text this file can put on
// screen is the skip hint, and that is drawn ONLY during the black entry dip,
// before the first frame of the shot exists.
//
// THE CSS IS INJECTED FROM HERE rather than added to ui/style.css. That is a
// deliberate merge-safety choice: this feature is being built alongside other
// work, and a self-contained module that appends its own stylesheet cannot
// conflict with anybody's edit to the shared one.
// ===========================================================================

const STYLE_ID = 'fin-style';

const CSS = `
.fin { position: absolute; inset: 0; pointer-events: none; z-index: 70; --bar: 0vh; --wash: transparent; }

/* letterbox */
.fin-bar { position: absolute; left: 0; right: 0; height: var(--bar); background: #000; }
.fin-bar.top { top: 0; }
.fin-bar.bot { bottom: 0; }

/* DEPTH OF FIELD — a real optical blur of the frame underneath, masked so the
   middle of the shot stays sharp. Close-ups only. */
.fin-dof {
  position: absolute; inset: 0; opacity: 0;
  backdrop-filter: blur(8px) saturate(0.88);
  -webkit-backdrop-filter: blur(8px) saturate(0.88);
  -webkit-mask-image: radial-gradient(ellipse 40% 32% at 50% 47%, transparent 0%, transparent 40%, #000 76%);
  mask-image: radial-gradient(ellipse 40% 32% at 50% 47%, transparent 0%, transparent 40%, #000 76%);
  transition: opacity 160ms ease;
}

/* MOTION BLUR on every hard cut — a full-frame smear that decays in ~110 ms */
.fin-smear {
  position: absolute; inset: 0; opacity: 0;
  backdrop-filter: blur(15px) brightness(1.1);
  -webkit-backdrop-filter: blur(15px) brightness(1.1);
}

/* SPEED LINES — radial, animated, and they rotate the other way from the
   ritual's so the two sequences never look like the same effect */
.fin-speed {
  position: absolute; inset: -20%; opacity: 0; mix-blend-mode: screen;
  background: repeating-conic-gradient(from 0deg at 50% 48%,
    rgba(255,255,255,0.00) 0deg 1.0deg,
    rgba(255,255,255,0.62) 1.0deg 1.45deg,
    rgba(255,255,255,0.00) 1.45deg 3.2deg);
  -webkit-mask-image: radial-gradient(circle at 50% 48%, transparent 10%, #000 44%);
  mask-image: radial-gradient(circle at 50% 48%, transparent 10%, #000 44%);
  animation: finSpeed 0.42s linear infinite;
  transition: opacity 110ms ease;
}
@keyframes finSpeed { from { transform: rotate(0deg) scale(1); } to { transform: rotate(-3deg) scale(1.07); } }

/* THE IMPACT FRAME. Three steps, no interpolation: white, then black, then the
   finisher's own colour. This is the anime one-frame flash and it is stepped
   on purpose — a fade would read as a bloom instead of as a drawn frame. */
.fin-impact { position: absolute; inset: 0; opacity: 0; background: #fff; --imp: 0.16s; --ic: #fff; }
.fin-impact.on { animation: finImp var(--imp) steps(3, end) forwards; }
@keyframes finImp {
  0%   { opacity: 1; background: #fff; }
  34%  { opacity: 1; background: #05050a; }
  67%  { opacity: 0.9; background: var(--ic); }
  100% { opacity: 0; }
}

/* PER-FINISHER COLOUR GRADE, on top of the map's own. Screen-blended so it
   tints the highlights and leaves the blacks alone. */
.fin-wash {
  position: absolute; inset: 0; opacity: 0; mix-blend-mode: screen;
  background: radial-gradient(ellipse 90% 70% at 50% 55%, var(--wash) 0%, transparent 72%);
  transition: opacity 200ms ease;
}
/* the vignette that closes the frame down around the two bodies */
.fin-vig {
  position: absolute; inset: 0; opacity: 0;
  background: radial-gradient(ellipse 62% 58% at 50% 50%, transparent 30%, rgba(3,3,6,0.92) 100%);
  transition: opacity 220ms ease;
}

/* the dips in and out — the only two moments the screen is allowed to be flat */
.fin-dip { position: absolute; inset: 0; background: #04040a; opacity: 0; }

/* THE ONLY TEXT IN THE FEATURE, and it is drawn over the black entry dip and
   gone before the shot starts. Never over the scene. */
.fin-skip {
  position: absolute; left: 50%; bottom: 8vh; transform: translateX(-50%) skewX(-11deg);
  font: 800 10px/1 "Bahnschrift", "Franklin Gothic Medium", "Arial Narrow", system-ui, sans-serif;
  letter-spacing: 5px; color: rgba(240,236,228,0.5); opacity: 0;
  transition: opacity 220ms ease;
}

/* WHAT IS HIDDEN WHILE A FINISHER RUNS.
   The HUD itself is hidden through its own method (ui/hud.js setHidden) so the
   hiding is explicit and auditable rather than a selector that silently stops
   matching. These are the elements that live OUTSIDE the HUD root and would
   otherwise sit on top of the shot: the always-on system bar, the debug panel
   and the control legend. */
body.fin-on .sysbar,
body.fin-on .debug-panel,
body.fin-on .legend { display: none !important; }
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

export class FinisherOverlay {
  constructor(root) {
    ensureStyle();
    this.el = document.createElement('div');
    this.el.className = 'fin';
    this.el.innerHTML = `
      <div class="fin-wash"></div>
      <div class="fin-vig"></div>
      <div class="fin-dof"></div>
      <div class="fin-smear"></div>
      <div class="fin-speed"></div>
      <div class="fin-impact"></div>
      <div class="fin-bar top"></div>
      <div class="fin-bar bot"></div>
      <div class="fin-dip"></div>
      <div class="fin-skip">PRESS ANY BUTTON TO SKIP</div>`;
    root.appendChild(this.el);
    this.q = s => this.el.querySelector(s);
    document.body.classList.add('fin-on');
  }

  // per-finisher colour: the wash tint and the third frame of every impact
  setColor(css) {
    this.el.style.setProperty('--wash', css);
    this.q('.fin-impact').style.setProperty('--ic', css);
  }

  bars(v) { this.el.style.setProperty('--bar', (v * 11).toFixed(2) + 'vh'); }
  dof(v) { this.q('.fin-dof').style.opacity = v.toFixed(3); }
  smear(v) { this.q('.fin-smear').style.opacity = v.toFixed(3); }
  speed(v) { this.q('.fin-speed').style.opacity = v.toFixed(3); }
  wash(v) { this.q('.fin-wash').style.opacity = v.toFixed(3); }
  vignette(v) { this.q('.fin-vig').style.opacity = v.toFixed(3); }
  dip(v) { this.q('.fin-dip').style.opacity = v.toFixed(3); }
  skipHint(v) { this.q('.fin-skip').style.opacity = v.toFixed(3); }

  impact(dur = 0.16) {
    const f = this.q('.fin-impact');
    f.classList.remove('on');
    void f.offsetWidth;                 // restart the stepped animation
    f.style.setProperty('--imp', dur + 's');
    f.classList.add('on');
  }

  destroy() {
    document.body.classList.remove('fin-on');
    this.el.remove();
  }
}
