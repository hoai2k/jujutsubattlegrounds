// PARTICLES — one pooled system of camera-facing quads per stage, additive
// and normal blended, with the quality tier's particle budget. Everything
// that is a spark, an ember, a dust puff or a flake goes through here.
import * as THREE from 'three';
import { rand, clamp } from '../core/math.js';
import { quality } from '../render/quality.js';

let _tex = null;
function softDot() {
  if (_tex) return _tex;
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  _tex = new THREE.CanvasTexture(c); _tex.colorSpace = THREE.SRGBColorSpace; return _tex;
}

export class Particles {
  constructor(scene, max = 1400) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.life0 = new Float32Array(max); this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.shrink = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: softDot() }, uScale: { value: 400 } },
      vertexShader: /* glsl */ `attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float uScale;
        void main(){ vC = color; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / max(1.0,-mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform sampler2D uTex; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vC * 1.6, t.a * vA); }`,
      vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    mat.toneMapped = false;
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false; this.points.renderOrder = 20;
    scene.add(this.points);
    this.geo = geo;
    this._c = new THREE.Color();
  }
  // opts: {color, size, life, vel:[x,y,z], spread, count, grav, drag, shrink, alpha}
  emit(p, o = {}) {
    const budget = quality().particles;
    const count = Math.max(1, Math.round((o.count ?? 1) * budget));
    this._c.set(o.color ?? 0xffffff);
    for (let k = 0; k < count; k++) {
      if (this.n >= this.max) return;
      const i = this.n++;
      const sp = o.spread ?? 0.1;
      this.pos[i * 3] = p.x + rand(-sp, sp); this.pos[i * 3 + 1] = p.y + rand(-sp, sp); this.pos[i * 3 + 2] = p.z + rand(-sp, sp);
      this.col[i * 3] = this._c.r; this.col[i * 3 + 1] = this._c.g; this.col[i * 3 + 2] = this._c.b;
      const v = o.vel ?? [0, 0, 0], vs = o.velSpread ?? 1;
      this.vel[i * 3] = v[0] + rand(-vs, vs); this.vel[i * 3 + 1] = v[1] + rand(-vs, vs); this.vel[i * 3 + 2] = v[2] + rand(-vs, vs);
      this.size[i] = (o.size ?? 0.2) * rand(0.7, 1.3); this.alpha[i] = o.alpha ?? 1;
      this.life[i] = this.life0[i] = (o.life ?? 0.5) * rand(0.7, 1.2); this.grav[i] = o.grav ?? 0; this.drag[i] = o.drag ?? 2; this.shrink[i] = o.shrink ?? 1;
    }
  }
  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this._swap(i, --this.n); continue; }
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= d; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt; this.vel[i * 3 + 2] *= d;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const k = this.life[i] / this.life0[i];
      this.alpha[i] = clamp(k * 1.4, 0, 1);
      if (this.shrink[i]) this.size[i] *= Math.exp(-dt * 0.6 * this.shrink[i]);
      i++;
    }
    this.geo.setDrawRange(0, this.n);
    for (const a of ['position', 'color', 'aSize', 'aAlpha']) this.geo.attributes[a].needsUpdate = true;
  }
  _swap(a, b) {
    if (a === b) return;
    for (const arr of [this.pos, this.col, this.vel]) for (let k = 0; k < 3; k++) { const t = arr[a * 3 + k]; arr[a * 3 + k] = arr[b * 3 + k]; arr[b * 3 + k] = t; }
    for (const arr of [this.size, this.alpha, this.life, this.life0, this.grav, this.drag, this.shrink]) { const t = arr[a]; arr[a] = arr[b]; arr[b] = t; }
  }
  clear() { this.n = 0; this.geo.setDrawRange(0, 0); }
}
