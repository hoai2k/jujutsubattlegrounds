// Keyframed pose animation: clips are plain data ({t, pose} keys, degrees),
// compiled to quaternion tracks, sampled with eased interpolation and
// crossfaded on state change. Shared bone names = free retargeting.
import * as THREE from 'three';
import { DEG, smoothstep, easeOut, easeIn, clamp } from '../../core/math.js';

const _qa = new THREE.Quaternion();
const _qb = new THREE.Quaternion();
const _e = new THREE.Euler();

const EASE = {
  smooth: smoothstep,
  linear: t => t,
  out: easeOut,
  in: easeIn,
  hold: t => (t >= 1 ? 1 : 0),
  snap: t => Math.min(1, t * t * 4)
};

// def: { dur, loop, keys: [{ t, e?, pose: {Bone:[rx,ry,rz], Hips_pos:[x,y,z]} }] }
// stance: base pose merged under every key so all bones are always defined.
// RELATIVE KEYS. `Hips+: [0, -8, 0]` in a key ADDS to whatever the bone would
// otherwise hold at that key (the key's own absolute value, or the stance).
// Exists for the shared locomotion clips: a walk's pelvis swing is an offset
// on top of the character's own stance yaw, and the ten characters that play
// the base walk hold that yaw anywhere between 16 and 40 degrees — an absolute
// key would square every one of them up to the same number. A key without the
// `+` entry contributes zero offset, so the offset eases in and out between
// keys like any other track.
export function compileClip(name, def, stance) {
  const isMeta = b => b.endsWith('_pos') || b.endsWith('+');
  const boneNames = new Set(Object.keys(stance).filter(k => !isMeta(k)));
  for (const k of def.keys) for (const b of Object.keys(k.pose)) {
    if (!isMeta(b)) boneNames.add(b);
    else if (b.endsWith('+')) boneNames.add(b.slice(0, -1));
  }
  const keys = def.keys.map(k => {
    const q = new Map(), pos = new Map();
    for (const b of boneNames) {
      const base = k.pose[b] ?? stance[b] ?? [0, 0, 0];
      const d = k.pose[b + '+'];
      const rot = d ? [base[0] + d[0], base[1] + d[1], base[2] + d[2]] : base;
      _e.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'XYZ');
      q.set(b, new THREE.Quaternion().setFromEuler(_e));
    }
    const hp = k.pose.Hips_pos ?? stance.Hips_pos ?? [0, 0, 0];
    pos.set('Hips', new THREE.Vector3(hp[0], hp[1], hp[2]));
    return { t: k.t, e: EASE[k.e || 'smooth'], q, pos };
  });
  return { name, dur: def.dur, loop: !!def.loop, keys, boneNames: [...boneNames] };
}

export class AnimPlayer {
  constructor(bones, clips) {
    this.bones = bones;               // Map name -> Bone
    this.clips = clips;               // Map name -> compiled clip
    this.current = null;
    this.time = 0;
    this.speed = 1;
    this.fade = 0;                    // remaining fade time
    this.fadeDur = 0;
    this.snapshot = null;             // Map bone -> {q, pos} captured at play()
    this.bindPos = new Map();
    for (const [n, b] of bones) this.bindPos.set(n, b.position.clone());
  }

  has(name) { return this.clips.has(name); }

  play(name, { fade = 0.10, speed = 1, restart = false, offset = 0 } = {}) {
    const clip = this.clips.get(name);
    if (!clip) return;
    if (this.current === clip && !restart) { this.speed = speed; return; }
    // snapshot current pose for crossfade
    const snap = new Map();
    for (const [n, b] of this.bones) snap.set(n, { q: b.quaternion.clone(), pos: b.position.clone() });
    this.snapshot = snap;
    this.fadeDur = this.fade = fade;
    this.current = clip;
    this.time = offset;
    this.speed = speed;
  }

  get norm() { return this.current ? clamp(this.time / this.current.dur, 0, 1) : 0; }
  get done() { return this.current && !this.current.loop && this.time >= this.current.dur; }

  update(dt) {
    if (!this.current) return;
    this.time += dt * this.speed;
    if (this.fade > 0) this.fade = Math.max(0, this.fade - dt);
    const clip = this.current;
    let t = this.time;
    if (clip.loop) t = ((t % clip.dur) + clip.dur) % clip.dur;
    else t = clamp(t, 0, clip.dur);

    // find key pair
    const keys = clip.keys;
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    const k0 = keys[i];
    const k1 = keys[Math.min(i + 1, keys.length - 1)];
    const span = Math.max(1e-6, k1.t - k0.t);
    const u = k1 === k0 ? 0 : k1.e(clamp((t - k0.t) / span, 0, 1));

    const fadeW = this.fadeDur > 0 ? 1 - this.fade / this.fadeDur : 1;
    const w = smoothstep(clamp(fadeW, 0, 1));

    for (const name of clip.boneNames) {
      const bone = this.bones.get(name);
      if (!bone) continue;
      _qa.copy(k0.q.get(name)).slerp(k1.q.get(name), u);
      if (w < 1 && this.snapshot) {
        _qb.copy(this.snapshot.get(name).q).slerp(_qa, w);
        bone.quaternion.copy(_qb);
      } else {
        bone.quaternion.copy(_qa);
      }
    }
    // hips positional track (crouch, lie down, jump squash)
    const hips = this.bones.get('Hips');
    if (hips) {
      const p0 = k0.pos.get('Hips'), p1 = k1.pos.get('Hips');
      const bind = this.bindPos.get('Hips');
      const px = bind.x + p0.x + (p1.x - p0.x) * u;
      const py = bind.y + p0.y + (p1.y - p0.y) * u;
      const pz = bind.z + p0.z + (p1.z - p0.z) * u;
      if (w < 1 && this.snapshot) {
        const sp = this.snapshot.get('Hips').pos;
        hips.position.set(sp.x + (px - sp.x) * w, sp.y + (py - sp.y) * w, sp.z + (pz - sp.z) * w);
      } else {
        hips.position.set(px, py, pz);
      }
    }
  }
}
