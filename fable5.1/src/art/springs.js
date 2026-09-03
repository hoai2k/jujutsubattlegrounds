// Verlet-ish spring chains for secondary motion: hair, coat tails, ties,
// sashes. Each chain hangs off a bone; segments lag the body and settle.
import * as THREE from 'three';

const _basePos = new THREE.Vector3(), _parentQ = new THREE.Quaternion(), _target = new THREE.Vector3();
const _dirW = new THREE.Vector3(), _dirL = new THREE.Vector3(), _q = new THREE.Quaternion(), _tmp = new THREE.Vector3();

export class SpringChain {
  // opts: { localOffset, restDir (local to anchor), segments:[{len, mesh}], stiffness, damping, gravity, wind }
  constructor(anchorBone, opts) {
    this.anchor = anchorBone;
    this.stiffness = opts.stiffness ?? 60;
    this.damping = opts.damping ?? 0.82;
    this.gravity = opts.gravity ?? 6;
    this.wind = opts.wind ?? 0;
    this.restDir = (opts.restDir || new THREE.Vector3(0, -1, 0)).clone().normalize();
    this.pivots = []; this.states = [];
    this.phase = Math.random() * 10;
    let parent = anchorBone;
    let offset = (opts.localOffset || new THREE.Vector3()).clone();
    for (const seg of opts.segments) {
      const pivot = new THREE.Object3D();
      pivot.position.copy(offset);
      parent.add(pivot);
      if (seg.mesh) pivot.add(seg.mesh);
      this.pivots.push({ pivot, len: seg.len });
      this.states.push({ pos: null, vel: new THREE.Vector3() });
      parent = pivot;
      offset = this.restDir.clone().multiplyScalar(seg.len);
    }
  }
  reset() { for (const s of this.states) { s.pos = null; s.vel.set(0, 0, 0); } }
  update(dt, t = 0) {
    dt = Math.min(dt, 1 / 30);
    for (let i = 0; i < this.pivots.length; i++) {
      const { pivot, len } = this.pivots[i];
      const st = this.states[i];
      pivot.updateWorldMatrix(true, false);
      _basePos.setFromMatrixPosition(pivot.matrixWorld);
      pivot.parent.getWorldQuaternion(_parentQ);
      _target.copy(this.restDir).applyQuaternion(_parentQ).multiplyScalar(len).add(_basePos);
      if (!st.pos) st.pos = _target.clone();
      st.vel.addScaledVector(_tmp.copy(_target).sub(st.pos), this.stiffness * dt);
      st.vel.y -= this.gravity * dt;
      if (this.wind) { st.vel.x += Math.sin(t * 2.1 + this.phase + i) * this.wind * dt; st.vel.z += Math.cos(t * 1.7 + this.phase) * this.wind * 0.6 * dt; }
      st.vel.multiplyScalar(Math.pow(this.damping, dt * 60));
      st.pos.addScaledVector(st.vel, dt);
      _dirW.copy(st.pos).sub(_basePos);
      const d = _dirW.length() || 1e-6;
      _dirW.multiplyScalar(len / d);
      st.pos.copy(_basePos).add(_dirW);
      _dirL.copy(_dirW).normalize().applyQuaternion(_q.copy(_parentQ).invert());
      pivot.quaternion.setFromUnitVectors(this.restDir, _dirL);
    }
  }
}
