// GRIPS — putting the off hand on a two-handed weapon.
//
// THE PROBLEM. A prop is parented to ONE bone (`attachProp` in
// builders/humanoid.js: `bone.add(p.node)`), and render3d.js re-parents it
// onto the matching imported bone so it travels with the new body. That is
// the whole story for a sword in a fist — one hand, one bone, solved.
//
// Two hands is a different problem, and the second hand is the hard half.
// The retargeter transfers ROTATIONS, so the imported arm reproduces the
// clip's elbow bend and ends up wherever its own proportions put the wrist.
// For a free hand that is exactly right. For a hand that is supposed to be
// closed around a haft, "wherever its own proportions put it" is a hand
// floating a few centimetres off the weapon — and the eye finds that
// instantly, because it is the one place in the pose where two things are
// meant to be touching.
//
// THE FIX. The weapon says where the off hand belongs — a point (or a
// segment, for a haft you may slide along) in the PROP'S OWN local space —
// and the off arm is re-solved to reach it, after retargeting, with
// two-bone IK (ik.js). Because the point is prop-local it does not care
// whether the weapon is the procedural one or an imported `.glb` standing in
// for it, whose mesh occupies the same space by construction.
//
// WHAT IT DELIBERATELY DOES NOT DO:
//
// · It does not run on the procedural body. Those clips were authored
//   against those proportions, so its hands are already where the animator
//   put them; solving there would move art that is already correct.
// · It does not choose the weapon's pose. Where the weapon sits is the
//   attachment's business (`pos`/`rot` per slot). The grip only answers
//   "and the other hand goes HERE on it".
// · It does not invent a hand orientation. The retargeted palm attitude is
//   captured before the solve and restored after, so the hand keeps the
//   rotation the clip gave it and only its position changes.
//
// GATING. An arm straining at something out of reach looks worse than a hand
// slightly off it, so the correction fades out as the target leaves the
// arm's range (`solveTwoBone` reports the shortfall). Clips where the hand
// genuinely should not be on the weapon are named on the spec (`only` /
// `except`, matched against `model.gripClip`), and gameplay can drive the
// weight directly with `model.setGrip(name, w)`.
import * as THREE from 'three';
import { solveTwoBone, captureWorldQuat, restoreWorldQuat } from './ik.js';

// canonical arm chains, keyed by the hand the grip names
const CHAIN = {
  HandL: ['UpArmL', 'LoArmL', 'HandL'],
  HandR: ['UpArmR', 'LoArmR', 'HandR'],
  FootL: ['ThighL', 'ShinL', 'FootL'],
  FootR: ['ThighR', 'ShinR', 'FootR']
};

// How far past the arm's reach the target may sit before the grip is fully
// released, in metres. Short enough that a genuinely unreachable target lets
// go rather than locking the arm out straight; long enough that the ordinary
// centimetre or two of proportion difference — the thing this exists to fix
// — never triggers it.
const RELEASE = 0.12;

/**
 * Normalize one authored grip spec. Returns null for anything unusable, so a
 * malformed entry costs a warning rather than a broken arm.
 *
 *   bone     canonical hand that grips (default 'HandL')
 *   at       [x,y,z] in the prop's local space — where that hand belongs
 *   to       optional second point: the hand slides along `at`..`to` to
 *            whichever spot it can reach most comfortably, which is what a
 *            hand on a long haft actually does
 *   weight   0..1 authored strength (default 1)
 *   only     clip names this applies to (default: all)
 *   except   clip names this does not apply to
 */
export function normalizeGrip(spec, label = 'grip') {
  if (!spec) return null;
  const bone = spec.bone || 'HandL';
  if (!CHAIN[bone]) {
    console.warn(`[render3d] ${label}: "${bone}" is not a grippable end bone`);
    return null;
  }
  if (!Array.isArray(spec.at) || spec.at.length !== 3) {
    console.warn(`[render3d] ${label}: needs an "at" [x,y,z] in the prop's own space`);
    return null;
  }
  return {
    bone,
    chain: CHAIN[bone],
    at: new THREE.Vector3().fromArray(spec.at),
    to: Array.isArray(spec.to) && spec.to.length === 3
      ? new THREE.Vector3().fromArray(spec.to) : null,
    weight: spec.weight ?? 1,
    only: spec.only ? new Set(spec.only) : null,
    except: spec.except ? new Set(spec.except) : null
  };
}

const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3();
const _target = new THREE.Vector3(), _wrist = new THREE.Vector3();
const _seg = new THREE.Vector3(), _q = new THREE.Quaternion();
const _shoulder = new THREE.Vector3(), _slide = new THREE.Vector3();

export class GripSolver {
  /**
   * @param model      the procedural CharacterModel (owns the props)
   * @param map        canonical name -> imported Object3D (guessBoneMap)
   * @param overrides  {propName: gripSpec} from the manifest, replacing
   *                   whatever the attachment authored
   * @param opts       nodeOf(name) -> the node the grip is measured against,
   *                   for callers that put a COPY of the weapon on the
   *                   imported body and leave the original where it was. The
   *                   workbench does exactly that, so its ghost keeps its own
   *                   weapon; the game moves the original and needs no hook.
   */
  constructor(model, map, overrides = {}, opts = {}) {
    this.model = model;
    this.map = map;
    this.overrides = overrides;
    this.nodeOf = opts.nodeOf ?? (name => model.props?.get(name)?.node ?? null);
    this.grips = new Map();          // prop name -> normalized spec
    this.weights = new Map();        // prop name -> runtime multiplier
    this.refresh();
    // gameplay/animation hook: 0 releases the hand for this clip, 1 grips
    model.setGrip = (name, w) => this.weights.set(name, w);
  }

  /**
   * Re-read the grip specs. Called on construction and whenever a prop moves
   * slot, because a weapon on the back is not being held at all and a weapon
   * in a different hand grips differently.
   */
  refresh() {
    this.grips.clear();
    for (const [name, p] of this.model.props ?? []) {
      const raw = this.overrides[name] !== undefined
        ? this.overrides[name]
        : p.attachments?.[p.slot]?.grip;
      const spec = raw ? normalizeGrip(raw, `${this.model.id}:${name}`) : null;
      if (spec) this.grips.set(name, spec);
    }
    return this.grips.size;
  }

  get active() { return this.grips.size > 0; }

  /**
   * Solve every active grip. Call after the retargeter, with world matrices
   * refreshed — the prop hangs off an imported bone the retargeter has just
   * moved, so its own world transform is what the target is measured from.
   */
  apply() {
    if (!this.grips.size) return 0;
    const clip = this.model.gripClip;
    let solved = 0;
    for (const [name, g] of this.grips) {
      const node = this.nodeOf(name);
      if (!node?.visible) continue;
      if (g.only && !g.only.has(clip)) continue;
      if (g.except && g.except.has(clip)) continue;
      let w = g.weight * (this.weights.get(name) ?? 1);
      if (!(w > 0)) continue;

      const [upperN, lowerN, endN] = g.chain;
      const upper = this.map[upperN], lower = this.map[lowerN], end = this.map[endN];
      if (!upper || !lower || !end) continue;

      // where on the weapon the hand belongs, in world space
      _p0.copy(g.at).applyMatrix4(node.matrixWorld);
      if (g.to) {
        // slide along the haft to the point nearest where the arm already is
        _p1.copy(g.to).applyMatrix4(node.matrixWorld);
        _slide.setFromMatrixPosition(end.matrixWorld).sub(_p0);
        _seg.copy(_p1).sub(_p0);
        const len2 = _seg.lengthSq();
        const t = len2 > 1e-9
          ? Math.max(0, Math.min(1, _slide.dot(_seg) / len2)) : 0;
        _target.copy(_p0).addScaledVector(_seg, t);
      } else {
        _target.copy(_p0);
      }

      // RELEASE, decided BEFORE solving. An arm locked out straight at
      // something it cannot hold reads far worse than a hand a little off the
      // haft, so how far the target sits past the arm's reach is measured
      // first and the correction is faded accordingly — one solve, at the
      // weight it deserves, rather than a solve and an undo.
      _p1.setFromMatrixPosition(upper.matrixWorld);
      const reach = _p1.distanceTo(_shoulder.setFromMatrixPosition(lower.matrixWorld))
        + _shoulder.distanceTo(_wrist.setFromMatrixPosition(end.matrixWorld));
      const over = _p1.distanceTo(_target) - reach * 0.995;
      if (over > 0) {
        w *= Math.max(0, 1 - over / RELEASE);
        // a correction this weak is not a grip, it is a twitch — and counting
        // it would report a hand as held when it is nowhere near the weapon
        if (w < 0.02) continue;
      }

      // A grip is a POSITION change; the palm attitude the retargeter chose
      // for this clip is still the right one, so it survives the solve.
      captureWorldQuat(end, _q);
      solveTwoBone(upper, lower, end, _target, { weight: w });
      restoreWorldQuat(end, _q);
      solved++;
    }
    return solved;
  }
}
