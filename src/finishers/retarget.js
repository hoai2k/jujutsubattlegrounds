// FINISHERS — CLIP RETARGETING ACROSS THE WHOLE ROSTER
// ===========================================================================
// This file is the answer to the hard half of the feature: a finisher is
// authored once, and it has to play correctly on whichever body actually lost
// — a 1.42 m Jogo, a 3.6 m Mahoraga, a four-armed Sukuna, a Kurourushi that
// has grown three sizes since the round started.
//
// WHY THIS IS POSSIBLE AT ALL. Every model in the game is built by
// art/builders/humanoid.js onto the same 20-bone hierarchy (art/rig/rig.js),
// and every clip in the game is ROTATION-ONLY apart from a single positional
// track on the Hips. Rotations are scale-free, so the roster already retargets
// for nothing. Three things do NOT come for free, and they are exactly the
// three things this file handles:
//
//   1. THE STANCE FALLBACK. art/anim/player.js compiles a clip against the
//      character's own STANCE, so any bone a key does not name falls back to
//      that character's posture rather than to a T-pose. A finisher clip
//      compiled here has to do the same — but the per-character stances are
//      not exported as a table anywhere, and building a second copy of that
//      table here would rot the first time somebody adds a character.
//      So the stance is READ OFF THE CHARACTER'S OWN COMPILED `idle` CLIP:
//      key 0 of every idle in the project is the bare stance (`K(0, {})`), and
//      its quaternions ARE the posture. A character added while this feature
//      was being written retargets correctly without touching this file.
//
//   2. THE HIPS TRACK IS IN METRES. `Hips_pos: [0, -0.72, -0.16]` means "drop
//      the hips 72 cm", which is a body-and-a-half on Jogo and a third of one
//      on Mahoraga. Every Hips_pos THIS FILE compiles is multiplied by the
//      body's proportion (H / 1.8), so a knockdown drops every body by the
//      same FRACTION of itself. The stance fallback is deliberately NOT
//      scaled — that value was authored for that character at that size.
//
//   3. THE EXTRA LIMBS. Sukuna's true form and Kurourushi both carry a second
//      arm pair (`UpArmL2` and friends — see the `extra` path in rig.js). A
//      clip that never names them leaves them frozen at stance, which reads as
//      two dead arms bolted to a moving body. Any key here that does not
//      author them explicitly gets them DERIVED from the upper pair, damped
//      toward stance, so the lower arms follow the shoulders they hang off.
// ===========================================================================
import * as THREE from 'three';
import { DEG, smoothstep, easeIn, easeOut, clamp } from '../core/mathutil.js';

// The reference body. Every proportional number in this feature is expressed
// against a 1.8 m fighter, which is the middle of the roster (Yuji 1.75,
// Naoya 1.83, Nanami 1.845) and the size every base clip was authored on.
export const REF_H = 1.8;

const EASE = {
  smooth: smoothstep,
  linear: t => t,
  out: easeOut,
  in: easeIn,
  hold: t => (t >= 1 ? 1 : 0),
  snap: t => Math.min(1, t * t * 4)
};

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();

// The four bone triples of a second arm pair, and the upper-pair bone each one
// follows. Named rather than derived so a body that grows a THIRD pair later
// does not silently start mirroring the wrong shoulder.
const MIRROR_ARMS = [
  ['ClavL2', 'ClavL'], ['UpArmL2', 'UpArmL'], ['LoArmL2', 'LoArmL'], ['HandL2', 'HandL'],
  ['ClavR2', 'ClavR'], ['UpArmR2', 'UpArmR'], ['LoArmR2', 'LoArmR'], ['HandR2', 'HandR']
];

// ---------------------------------------------------------------------------
// THE BODY METRICS every part of this feature stages against.
// ---------------------------------------------------------------------------

// Live height in metres, growth included. Kurourushi scales his whole group
// (art/models/kurourushi.js setGrowth), so his height at stage 3 is genuinely
// different from his height at stage 0 and the staging has to read the live
// number rather than the config's.
export function bodyHeight(f) {
  const h = f?.model?.H ?? REF_H;
  const s = f?.model?.group?.scale?.y ?? 1;
  return h * (s || 1);
}

// Proportion against the reference body. 1 for most of the roster, 0.79 for
// Jogo, 2.0 for Mahoraga.
export function bodyScale(f) { return bodyHeight(f) / REF_H; }

// THE FOUR BODY CLASSES. The fight vocabulary is authored once at human size
// and once at giant size; `small` and `large` perform the human set, because
// their PROPORTIONS are human even when their height is not — Jogo is a short
// man with an oversized head, Hanami a tall one with heavy arms, and both read
// correctly throwing a human's punches once the hips track and the staging are
// scaled. Mahoraga does not, and that is the whole reason `giant` exists: at
// twice a person, the choreography is swapped for the oversized set and every
// strike aimed at it is re-aimed to a bone a human arm can actually reach.
export function bodyClass(f) {
  const h = bodyHeight(f);
  if (h < 1.68) return 'small';
  if (h < 2.06) return 'human';
  if (h < 2.60) return 'large';
  return 'giant';
}

// Does this body carry a second arm pair? (Sukuna's true form, Kurourushi.)
export function hasSecondArms(f) { return !!f?.model?.bones?.has?.('UpArmL2'); }

// World position of a bone, for camera aim and FX placement. Falls back to a
// point above the fighter's feet so a body missing the bone never throws.
const _wp = new THREE.Vector3();
export function bonePos(f, name, out = new THREE.Vector3()) {
  const b = f?.model?.bones?.get?.(name);
  if (!b) return out.copy(f.pos).setY(f.pos.y + bodyHeight(f) * 0.62);
  return out.copy(b.getWorldPosition(_wp));
}

// ---------------------------------------------------------------------------
// THE STANCE, read off the character's own compiled idle.
// ---------------------------------------------------------------------------
// Returns { q: Map<bone, Quaternion>, hips: Vector3, names: string[] } — the
// exact shape compileClip's `stance` argument produces internally, but sourced
// from the character rather than from a duplicated table.
export function stanceOf(fighter) {
  const clips = fighter.anim.clips;
  const ref = clips.get('idle') || clips.values().next().value;
  const q = new Map();
  let hips = new THREE.Vector3();
  if (ref && ref.keys.length) {
    const k0 = ref.keys[0];
    for (const [name, quat] of k0.q) q.set(name, quat);
    const hp = k0.pos.get('Hips');
    if (hp) hips = hp.clone();
  }
  // Anything the rig has that the idle never mentions (an extra limb a
  // character's own stance leaves out) resolves to identity rather than to
  // undefined, which would poison every slerp downstream.
  for (const [name] of fighter.model.bones) if (!q.has(name)) q.set(name, new THREE.Quaternion());
  return { q, hips, names: [...q.keys()] };
}

// ---------------------------------------------------------------------------
// COMPILE. Same output shape as art/anim/player.js `compileClip`, so the
// result can be handed straight to an AnimPlayer with nothing else changed.
//
// def:   { dur, loop, keys: [{ t, e, pose: { Bone: [rx,ry,rz], Hips_pos:[..] } }] }
// ref:   the stance from stanceOf()
// scale: the body's proportion — every authored Hips_pos is multiplied by it
// ---------------------------------------------------------------------------
export function compileFor(name, def, ref, { scale = 1, mirrorArms = false } = {}) {
  const boneNames = new Set(ref.names);
  for (const k of def.keys) {
    for (const b of Object.keys(k.pose)) if (!b.endsWith('_pos')) boneNames.add(b);
  }
  const names = [...boneNames];
  const keys = def.keys.map(k => {
    const q = new Map(), pos = new Map();
    for (const b of names) {
      const rot = k.pose[b];
      if (rot) {
        _e.set(rot[0] * DEG, rot[1] * DEG, rot[2] * DEG, 'XYZ');
        q.set(b, new THREE.Quaternion().setFromEuler(_e));
      } else {
        q.set(b, (ref.q.get(b) || new THREE.Quaternion()).clone());
      }
    }
    // THE SECOND ARM PAIR follows the first wherever the key did not author it
    // explicitly. Blended 0.62 of the way from the body's own stance toward
    // the matching upper-arm rotation: they move WITH the shoulders and they
    // move LESS, which is how a four-armed silhouette reads as one body
    // instead of as two people standing in the same place.
    if (mirrorArms) {
      for (const [lo, up] of MIRROR_ARMS) {
        if (!q.has(lo) || k.pose[lo]) continue;
        const target = q.get(up);
        if (!target) continue;
        _q.copy(ref.q.get(lo) || new THREE.Quaternion()).slerp(target, 0.62);
        q.get(lo).copy(_q);
      }
    }
    // THE ONE TRACK THAT IS IN METRES — see the header.
    const hp = k.pose.Hips_pos;
    pos.set('Hips', hp
      ? new THREE.Vector3(hp[0] * scale, hp[1] * scale, hp[2] * scale)
      : ref.hips.clone());
    return { t: k.t, e: EASE[k.e || 'smooth'], q, pos };
  });
  return { name, dur: def.dur, loop: !!def.loop, keys, boneNames: names };
}

// ---------------------------------------------------------------------------
// INSTALL / REMOVE. Finisher clips are registered into the fighter's own clip
// map under a namespaced prefix so they can be played by name through the
// normal AnimPlayer, and removed again on teardown. `makeClips` builds a fresh
// Map per character instance (characters/index.js), so this never leaks into
// another match — the removal is belt and braces.
// ---------------------------------------------------------------------------
export const FIN_PREFIX = 'fin_';

// `authoredH` is the body height the clip's metre-valued Hips track was
// written against. The default is the reference 1.8 m body — but the GIANT
// giant move set in fight.js is authored on a 3.6 m body, because a pose written
// for something that size cannot be sensibly imagined at human scale first.
// Declaring the authoring height here rather than halving twenty numbers by
// hand is what keeps the giant set proportional on a 2.6 m Kurourushi as well
// as on a 3.6 m Mahoraga. (Found the hard way: authored-for-giant values run
// through the reference scale put Mahoraga's hips 2.4 m down, which is under
// the floor — the whole body disappeared through the deck on the settle beat.)
export function installClips(fighter, defs, { authoredH = REF_H } = {}) {
  const ref = stanceOf(fighter);
  const scale = bodyHeight(fighter) / authoredH;
  const mirror = hasSecondArms(fighter);
  const installed = [];
  for (const [name, def] of Object.entries(defs)) {
    const key = FIN_PREFIX + name;
    fighter.anim.clips.set(key, compileFor(key, def, ref, { scale, mirrorArms: mirror }));
    installed.push(key);
  }
  return () => { for (const k of installed) fighter.anim.clips.delete(k); };
}

// ---------------------------------------------------------------------------
// SAMPLING — where will this fist BE?
// ---------------------------------------------------------------------------
// The whole difference between two people posing near each other and two people
// fighting is whether the strike arrives at the target. To place a body so that
// it does, the director has to know where the striking bone sits at the exact
// moment of impact — BEFORE the clip has played.
//
// So: pose the model at that time, read the bone, put the pose back. Returns
// the bone's offset from the model's origin IN WORLD SPACE at the given facing,
// which is exactly the vector to subtract from a target point to get the body
// position that lands the hit. Costs one skeleton update; called a handful of
// times per cinematic, never per frame.
const _wq = new THREE.Vector3();
export function strikeOffset(fighter, clipName, time, boneName, facing) {
  const anim = fighter.anim;
  const clip = anim.clips.get(FIN_PREFIX + clipName) || anim.clips.get(clipName);
  const bone = fighter.model.bones.get(boneName);
  const g = fighter.model.group;
  if (!clip || !bone) return new THREE.Vector3();

  // save everything the sample is about to trample
  const keep = { current: anim.current, time: anim.time, fade: anim.fade, fadeDur: anim.fadeDur, snapshot: anim.snapshot };
  const pose = new Map();
  for (const [n, b] of fighter.model.bones) pose.set(n, { q: b.quaternion.clone(), p: b.position.clone() });
  const yaw = g.rotation.y;

  anim.current = clip;
  anim.time = Math.max(0, Math.min(clip.dur, time));
  anim.fade = 0; anim.fadeDur = 0; anim.snapshot = null;
  anim.update(0);
  g.rotation.y = facing;
  g.updateMatrixWorld(true);
  const out = bone.getWorldPosition(_wq).clone().sub(g.position);

  // and put it all back, so nothing on screen ever saw this frame
  for (const [n, b] of fighter.model.bones) {
    const p = pose.get(n);
    b.quaternion.copy(p.q);
    b.position.copy(p.p);
  }
  Object.assign(anim, keep);
  g.rotation.y = yaw;
  g.updateMatrixWorld(true);
  return out;
}

// Play an installed finisher clip. Deliberately goes through `anim.play`
// rather than `fighter.play`, which would run the name through the per-weapon
// / per-stance clip swaps and apply the fighter's speed multiplier — neither
// of which a director-driven cutscene wants.
export function playFin(fighter, name, opts = {}) {
  const key = FIN_PREFIX + name;
  if (!fighter.anim.clips.has(key)) return false;
  fighter.anim.play(key, { fade: 0.09, restart: true, ...opts });
  return true;
}

// Play whatever the beat asked for: a finisher clip if one is installed under
// that name, otherwise the character's own clip of that name, otherwise a
// named fallback. This is what lets a finisher be choreographed mostly out of
// the character's EXISTING technique clips — which are already in-character,
// already have the right weight, and already carry the secondary motion.
export function playAny(fighter, name, opts = {}, fallback = 'idle') {
  if (!name) return false;
  if (playFin(fighter, name, opts)) return true;
  if (fighter.anim.clips.has(name)) {
    fighter.anim.play(name, { fade: 0.09, restart: true, ...opts });
    return true;
  }
  if (fallback && fighter.anim.clips.has(fallback)) {
    fighter.anim.play(fallback, { fade: 0.14, restart: true, ...opts });
  }
  return false;
}
