// PERF — the F3 overlay: frame time (median / p95 over the last 90), draw
// calls, triangles, entity counts, quality tier. `?perf` opens it at boot.
import { quality } from '../../render/quality.js';
export class Perf {
  constructor(root, stage) { this.stage = stage; this.el = document.createElement('div'); this.el.className = 'perf'; root.appendChild(this.el); this.frames = []; this.on = new URLSearchParams(location.search).has('perf'); this.el.hidden = !this.on; this.t = 0; }
  toggle() { this.on = !this.on; this.el.hidden = !this.on; }
  update(dt) {
    if (!this.on) return;
    this.frames.push(dt * 1000); if (this.frames.length > 90) this.frames.shift();
    this.t += dt; if (this.t < 0.25) return; this.t = 0;
    const s = [...this.frames].sort((a, b) => a - b); const med = s[s.length >> 1] || 0, p95 = s[Math.floor(s.length * 0.95)] || 0;
    const info = this.stage.renderer.info; const m = window.__match;
    this.el.innerHTML = `<b>${quality().name}</b> ${med.toFixed(1)} ms med · ${p95.toFixed(1)} p95 · ${(1000 / Math.max(0.1, med)).toFixed(0)} fps<br>calls ${info.render.calls} · tris ${(info.render.triangles / 1000).toFixed(0)}k · geo ${info.memory.geometries} · tex ${info.memory.textures}<br>${m ? `ents ${m.effects.ents.length} · particles ${m.fx.particles.n} · timed ${m.fx.timed.length} · tick ${m.tick} · ${m.phase}` : ''}`;
  }
}
