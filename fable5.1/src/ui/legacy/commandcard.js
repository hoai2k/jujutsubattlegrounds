// THE TYPOGRAPHIC OVERLAY — a manga panel breaking into the game.
//
// The third of the four layers of a cursed-speech command (the other three are
// in fx/speechfx.js). At the instant the word leaves his mouth, the command
// SLAMS across the screen as an anime title card: the kanji enormous with a
// hard offset drop shadow, the English translation and the romaji under it,
// speed lines radiating out from behind, and a one-frame white flash on the
// impact beat.
//
// THE ONE HARD RULE: IT MUST NEVER BE IN THE WAY. A card that hangs around is
// a card that gets somebody hit, and a fighting game cannot afford to hide the
// fight. So:
//   · the whole thing lives and dies inside ~0.55 s
//   · it sits in the UPPER THIRD, above the fighters, not across them
//   · it is `pointer-events: none` and it never blocks input
//   · a second command fired while one is up REPLACES it rather than queueing,
//     because two title cards stacked is exactly the mess this rule exists to
//     prevent
//
// Everything is inline-styled from the command's own colour, so adding a
// command needs no CSS.
export class CommandCard {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'cmd-card';
    this.el.innerHTML = `
      <div class="cc-lines"></div>
      <div class="cc-jp"></div>
      <div class="cc-en"></div>
      <div class="cc-romaji"></div>
      <div class="cc-flash"></div>`;
    root.appendChild(this.el);
    this.t = 0;
    // the speed-line fan is built ONCE — sixteen divs rebuilt per command
    // would be a per-command DOM churn for a thing that never changes shape
    const lines = this.el.querySelector('.cc-lines');
    lines.innerHTML = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * 360 + (i % 2 ? 4 : -4);
      const len = 22 + (i % 3) * 16;
      return `<i style="transform:rotate(${a}deg) translateX(60px);width:${len}px"></i>`;
    }).join('');
  }

  // `cmd` is a command def from characters/inumaki.js. `tier` degrades the
  // card the way it degrades the voice: at RAW the type is visibly ragged and
  // the flash barely fires, which is a second readout of his gauge that a
  // player picks up without ever looking at the HUD.
  show(cmd, tier = 0) {
    const hex = '#' + (cmd.color ?? 0xffffff).toString(16).padStart(6, '0');
    this.el.style.setProperty('--cc', hex);
    this.el.querySelector('.cc-jp').textContent = cmd.jp;
    this.el.querySelector('.cc-en').textContent = cmd.name;
    this.el.querySelector('.cc-romaji').textContent = cmd.romaji;
    this.el.dataset.tier = tier;
    this.el.dataset.weight = cmd.weight;
    // restart the animation even if one is already running
    this.el.classList.remove('on');
    void this.el.offsetWidth;
    this.el.classList.add('on');
    this.t = cmd.weight === 'heavy' ? 0.62 : 0.48;
  }

  update(dt) {
    if (this.t <= 0) return;
    this.t -= dt;
    if (this.t <= 0) this.el.classList.remove('on');
  }

  hide() { this.t = 0; this.el.classList.remove('on'); }
}
