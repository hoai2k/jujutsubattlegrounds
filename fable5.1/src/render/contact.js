// CONTACT SHADOWS — a soft projected disc under every fighter, every tier.
// It is not a replacement for the shadow map; it fills the gap the map leaves
// at the ankle (shadow acne bias) and keeps a grounded read on LOW, where
// there is no map at all. The disc shrinks and fades with height, which is
// the one cue a jump needs to read as a jump.
import * as THREE from 'three';

let _tex = null;
function discTexture() {
  if (_tex) return _tex;
  const S = 128;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.62)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.42)');
  grad.addColorStop(0.8, 'rgba(0,0,0,0.10)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  _tex = new THREE.CanvasTexture(c);
  _tex.colorSpace = THREE.SRGBColorSpace;
  return _tex;
}

export class ContactShadow {
  constructor(radius = 0.55) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      map: discTexture(), transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = -5;
    this.mesh.frustumCulled = false;
    this.radius = radius;
    this.mesh.scale.set(radius * 2, radius * 2, 1);
  }
  // pos: fighter feet; ground: floor height under them
  update(pos, ground, scale = 1) {
    const h = Math.max(0, pos.y - ground);
    const k = Math.max(0.25, 1 - h * 0.28);
    const r = this.radius * scale * (0.85 + 0.15 * k) * 2;
    this.mesh.scale.set(r * (1 + h * 0.05), r, 1);
    this.mesh.position.set(pos.x, ground + 0.012, pos.z);
    this.mesh.material.opacity = Math.max(0.15, k);
  }
}
