// WIPE — the diagonal transition between screens, in the accent colour.
export class Wipe {
  constructor(root) { this.el = document.createElement('div'); this.el.className = 'wipe'; root.appendChild(this.el); }
  cover(seconds = 0.26, accent) { this.el.style.setProperty('--wipe-t', seconds + 's'); if (accent) this.el.style.setProperty('--wipe-c', typeof accent === 'number' ? '#' + accent.toString(16).padStart(6, '0') : accent); this.el.classList.add('cover'); this.el.classList.remove('reveal'); return new Promise(r => setTimeout(r, seconds * 1000)); }
  reveal(seconds = 0.26) { this.el.style.setProperty('--wipe-t', seconds + 's'); this.el.classList.add('reveal'); this.el.classList.remove('cover'); return new Promise(r => setTimeout(r, seconds * 1000)); }
}
