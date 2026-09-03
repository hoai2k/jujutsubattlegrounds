// Verlet-ish spring chains for secondary motion: hair strands, coat tails,
// Nanami's tie. Each chain hangs off a bone; segments lag behind movement.
import * as THREE from 'three';

const _basePos = new THREE.Vector3();
const _parentQ = new THREE.Quaternion();
const _target = new THREE.Vector3();
const _dirW = new THREE.Vector3();
const _dirL = new THREE.Vector3();
const _q = new THREE.Quaternion();

export class SpringChain {
  // anchorBone: THREE.Object3D the chain hangs from
  // opts: { localOffset, restDir (unit, local to anchor), segments:[{len, mesh}],
  //         stiffness, damping, gravity }
  constructor(anchorBone, opts) {
    this.anchor = anchorBone;
    this.stiffness = opts.stiffness ?? 60;
    this.damping = opts.damping ?? 0.82;
    this.gravity = opts.gravity ?? 6;
    this.restDir = (opts.restDir || new THREE.Vector3(0, -1, 0)).clone().normalize();
    this.pivots = [];
    this.states = [];

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

  update(dt) {
    dt = Math.min(dt, 1 / 30);
    for (let i = 0; i < this.pivots.length; i++) {
      const { pivot, len } = this.pivots[i];
      const st = this.states[i];
      pivot.updateWorldMatrix(true, false);
      _basePos.setFromMatrixPosition(pivot.matrixWorld);
      pivot.parent.getWorldQuaternion(_parentQ);
      _target.copy(this.restDir).applyQuaternion(_parentQ).multiplyScalar(len).add(_basePos);
      if (!st.pos) st.pos = _target.clone();

      // spring toward rest, plus gravity, damped
      st.vel.addScaledVector(_target.clone().sub(st.pos), this.stiffness * dt);
      st.vel.y -= this.gravity * dt;
      st.vel.multiplyScalar(Math.pow(this.damping, dt * 60));
      st.pos.addScaledVector(st.vel, dt);

      // hard length constraint
      _dirW.copy(st.pos).sub(_basePos);
      const d = _dirW.length() || 1e-6;
      _dirW.multiplyScalar(len / d);
      st.pos.copy(_basePos).add(_dirW);

      // orient the pivot: restDir (in parent space) -> actual dir (in parent space)
      _dirL.copy(_dirW).normalize().applyQuaternion(_q.copy(_parentQ).invert());
      pivot.quaternion.setFromUnitVectors(this.restDir, _dirL);
    }
  }
}
