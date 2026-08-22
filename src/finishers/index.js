// FINISHERS — THE DIRECTOR
// ===========================================================================
// A short cinematic that plays when a player wins the MATCH, recreating that
// character's most famous battle moment — as a FIGHT, with both bodies
// throwing and taking real strikes.
//
// SHAPE. Modelled on core/ritual.js, the project's existing answer to "a
// cutscene that owns the frame": its own clock, its own camera, its own
// overlay, driven from render() on real frame time so the shot list is not
// quantised to the 60 Hz logic step. While it runs, match._logicTick never
// runs, so nothing can act and nothing can interrupt it.
//
// WHY THIS IS AN ACTION LIST AND NOT A POSE LIST. The first version of this
// file staged the two fighters on fixed marks a metre and a half apart and
// played a clip on one of them. Nothing ever landed — the fist stopped in the
// air a body-width short of the face — and a 0.2 s gameplay jab dropped into a
// 1 s slot left three quarters of a second of a man standing still. It read
// exactly as what it was: hand movements next to somebody.
//
// So a finisher is now a list of ACTIONS, and every action that strikes is
// SOLVED: the director samples the striking bone at the exact frame of impact
// (retarget.strikeOffset), works out where the attacker's body has to be for
// that bone to arrive on the target, and drives them there on a timed tween so
// they get there on the frame the clip connects. The victim's reaction fires
// on that same frame, not on a beat boundary, and the hit MOVES them. Contact,
// reaction and knockback are one event.
// ===========================================================================
import * as THREE from 'three';
import { clamp, smoothstep, easeIn, easeOut, damp, yawBetween, v3 } from '../core/mathutil.js';
import { finishersEnabled, hasSeen, markSeen, FINISHERS } from './config.js';
import {
  installClips, playAny, strikeOffset, bodyClass, bodyHeight, bodyScale, bonePos, REF_H
} from './retarget.js';
import { FIGHT_HUMAN, FIGHT_GIANT, MOVES, AIM_BONE } from './fight.js';
import { SIGNATURE_CLIPS } from './moves.js';
import { DEFAULT_SHOTS } from './shots.js';
import { pickFinisher } from './registry.js';
import { FinisherOverlay } from './overlay.js';
import { FinisherAudio } from './audio.js';
// URO. A finisher cannot be performed on somebody who is hovering, so both
// bodies are put on the floor before the first frame — see the call site.
import { groundFlight } from '../combat/flight.js';

// The black an action list opens out of and hands the win screen over in.
const DIP_IN = 0.34;
const DIP_OUT = 0.55;
// Actions overlap slightly: the next one's wind-up starts under the previous
// one's recovery, which is what stops a fight scene reading as a slideshow.
const BLEND = 0.10;
// A strike that lands stops the clock for this long, scaled by its power.
const HITSTOP = 0.055;

// The translation table for a body that is twice a person. Reactions map too:
// nothing a human does launches something this size, so it rocks and drops
// instead of leaving the floor.
const GIANT_MOVE = {
  fJab: 'gSweep', fCross: 'gSmash', fHook: 'gSweep', fUpper: 'gSmash',
  fBodyRip: 'gSmash', fElbow: 'gBackhand', fKnee: 'gSmash', fRound: 'gBackhand',
  fSide: 'gSmash', fAxe: 'gSmash', fPalm: 'gSmash', fThrust: 'gSweep',
  fCleave: 'gBackhand', fOverhead: 'gSmash', fGrab: 'gSweep',
  rSnapHead: 'rgRock', rFoldGut: 'rgRock', rSpin: 'rgRock', rLaunch: 'rgKneel',
  rSlam: 'rgKneel', rBlockPush: 'rgRock', rStagger: 'rgRock',
  rFinish: 'rgKneel', rFall: 'rgTopple',
  // the authored deaths. Nothing that size gets thrown across a street or
  // corkscrewed by a punch, so every one of them resolves to the same kneel —
  // what differs on a giant is the FX and the shot, not the physics.
  rThroat: 'rgKneel', rSplit: 'rgKneel', rBurn: 'rgKneel', rCrumple: 'rgKneel',
  rBlownBack: 'rgKneel', rTorque: 'rgKneel', rKneel: 'rgKneel', rKneelFall: 'rgTopple'
};

function sizedMove(f, name) {
  if (!name || bodyClass(f) !== 'giant') return name;
  return GIANT_MOVE[name] || name;
}

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class Finishers {
  constructor(match, uiRoot) {
    this.match = match;
    this.uiRoot = uiRoot;
    this.active = null;
    this.spent = false;      // one finisher per match, win or lose the roll
  }

  // -------------------------------------------------------------------------
  // THE GATE. Every refusal path leaves the match exactly as it would have been
  // without this feature.
  // -------------------------------------------------------------------------
  // `forced` is a finisher definition to play INSTEAD of rolling for one. The
  // game never passes it — the only caller is the workbench (/workbench/), which
  // exists to look at a chosen finisher rather than at whichever one the roll
  // happened to land on. Every gate below still applies to it.
  tryBegin(winner, forced = null, roll = null) {
    if (this.spent || this.active) return false;
    if (!finishersEnabled()) { this.spent = true; return false; }
    const m = this.match;
    if (!m.matchOver || !winner || !winner.model) { this.spent = true; return false; }
    const loser = this._loser(winner);
    if (!loser) { this.spent = true; return false; }
    const def = forced || pickFinisher(winner.pick, winner.cfg, m, winner, loser, roll);
    if (!def || !def.actions?.length) { this.spent = true; return false; }
    this.spent = true;
    this._begin(def, winner, loser);
    return true;
  }

  // The body the cinematic plays against: the nearest fighter who is down.
  _loser(winner) {
    let best = null, bd = Infinity;
    for (const f of this.match.fighters) {
      if (f === winner || !f.model) continue;
      const d = f.pos.distanceTo(winner.pos);
      const score = (f.alive ? 100 : 0) + d;      // prefer a downed body
      if (score < bd) { bd = score; best = f; }
    }
    return best;
  }

  // -------------------------------------------------------------------------
  // BEGIN
  // -------------------------------------------------------------------------
  _begin(def, win, lose) {
    const m = this.match;

    // ---- 1. THE SCREEN GOES AWAY -----------------------------------------
    m.hud.setHidden?.(true);
    const overlay = new FinisherOverlay(this.uiRoot);
    overlay.setColor(def.color || '#ffffff');
    overlay.dip(1);
    m.stage.setViews(1);

    // ---- 2. NOTHING ELSE IS ON THE FIELD ---------------------------------
    this._clearWorld(win, lose);

    // ---- 3. THE FLOOR AND THE FIGHT LINE ---------------------------------
    const hW = bodyHeight(win), hL = bodyHeight(lose);
    const cls = bodyClass(lose);
    const scale = (hW + hL) / (2 * REF_H);
    const origin = win.pos.clone().lerp(lose.pos, 0.5);
    m.arena.bounds?.clampXZ(origin, 3.0 * scale);
    const deck = m.arena.bounds ? m.arena.bounds.floorAt(origin.x, origin.z, origin.y + 1.2) : 0;
    origin.y = deck;

    const dir = _v.copy(lose.pos).sub(win.pos).setY(0);
    if (dir.lengthSq() < 0.01) dir.copy(win.forward());
    dir.normalize();
    const fwd = dir.clone();
    const right = v3(fwd.z, 0, -fwd.x);

    // Opening distance: out of range, so the first action has somewhere to
    // travel from. Everything after this is solved from the choreography.
    const open = 0.95 * (hW + hL) / 2;
    const winPos = origin.clone().addScaledVector(fwd, -open / 2);
    const losePos = origin.clone().addScaledVector(fwd, open / 2);
    for (const [f, p] of [[win, winPos], [lose, losePos]]) {
      f.pos.copy(p); f.prevPos.copy(p);
      f.vel.set(0, 0, 0); f.activeHit = null; f.move = null; f.iFrames = 0;
    }
    win.facing = win.prevFacing = yawBetween(winPos, losePos);
    lose.facing = lose.prevFacing = yawBetween(losePos, winPos);

    // ---- 4. THE CLIPS -----------------------------------------------------
    // BOTH fighters get the whole fight vocabulary — the loser throws real
    // strikes in every one of these, so they need the moves as much as the
    // winner does. Installed in two passes because the giant set is authored
    // on a 3.6 m body (see fight.js) and the human set on a 1.8 m one.
    const disposers = [];
    for (const f of [win, lose]) {
      disposers.push(installClips(f, FIGHT_HUMAN, { authoredH: 1.8 }));
      disposers.push(installClips(f, FIGHT_GIANT, { authoredH: 3.6 }));
    }
    disposers.push(installClips(win, SIGNATURE_CLIPS, { authoredH: 1.8 }));

    // Inert states. No state machine runs during a cutscene, but the state
    // still decides which prop is in which hand (Fighter._props), so the
    // winner is put in the one that means "weapon out for a pose": `victory`.
    // Swapped back to `idle` on teardown — leaving them in `victory` would make
    // match._koFlow skip the victory pose entirely.
    win.setState('victory', {});
    lose.setState('ko', {});
    try { win._props?.(m.ctxFor(win)); } catch (e) { /* prop sync is cosmetic */ }

    // BOTH FIGHTERS COME UP ON GUARD BEFORE THE FIRST FRAME IS VISIBLE. The
    // loser arrives here face down — they were just knocked out — and the first
    // action used to crossfade them from the floor to a fighting stance in
    // seventy milliseconds, which read as a corpse snapping upright. This runs
    // under the opening black instead: a long fade, finished by the time the
    // dip lifts.
    playAny(win, 'fGuardUp', { fade: 0.22 });
    playAny(lose, 'fGuardUp', { fade: 0.22 });

    // ---- 5. THE TIMELINE --------------------------------------------------
    // Action start times are computed from the clips themselves, so a heavy
    // move gets the room it needs and the whole thing lands wherever it lands
    // (typically 7.5-9 s — logged in dev).
    // THREE WAYS AN ACTION CAN LAND, and the difference matters:
    //   · a fight-library move  — carries its own contact data
    //   · `contact:` on the action — a character's OWN technique clip, told
    //     which bone lands and when. Solved like any other strike.
    //   · `blast:` on the action — a beam, a meteor, a shockwave. It connects,
    //     it moves them, it has a reaction, but the winner does NOT walk into
    //     range for it: nobody steps forward to fire Hollow Purple.
    const speedOf = a => a.speed ?? 1;
    // a beat of air after the dip lifts, so the first exchange is not thrown
    // while the screen is still coming out of black
    let t = 0.18;
    const acts = def.actions.map(src => {
      // A GIANT DOES NOT THROW A JAB. A body far too big for human choreography
      // has its half of the exchange translated into the oversized set — the
      // same intent, performed as something twice a person's size performs it.
      // Done HERE and not at play time, because the contact data has to come
      // from the move that will actually be thrown: translating later left the
      // solve aiming a two-handed slam with a jab's timing, and it missed by
      // two and a half metres.
      const a = {
        ...src,
        win: sizedMove(win, src.win), op: sizedMove(lose, src.op),
        react: src.react
      };
      const strikeMove = a.strike ? MOVES[a.strike === 'win' ? a.win : a.op] : null;
      const drive = strikeMove || MOVES[a.win] || MOVES[a.op] || null;
      const span = a.span ?? ((drive?.dur ?? 0.8) / speedOf(a) + (a.hold ?? 0) + 0.06);
      const solved = a.contact || strikeMove?.contact || null;
      const act = { ...a, t0: t, span, contact: solved, blast: a.blast || null, solve: !!solved };
      const hit = solved || a.blast;
      act.tc = hit ? act.t0 + hit.at / speedOf(a) : null;
      act.hitDef = hit;
      t += span - BLEND;
      return act;
    });
    const end = t + BLEND + 0.55;   // a beat of air after the last action

    const audio = new FinisherAudio(m.sfx);
    m.sfx.stopDrone();
    m.sfx.stopWind();
    m.music?.duck(0.03, end + DIP_OUT + 0.4);
    audio.open(def.root ? def.root * 0.5 : 110);
    audio.bed(def.root ? def.root * 0.25 : 55);
    m.stage.setGrade(def.grade || 'ko');

    this.active = {
      def, win, lose, overlay, audio, cls, scale, deck, origin, dir: fwd, right,
      acts, end, idx: -1, act: null,
      t: -DIP_IN, hold: 0, shot: null, smear: 0, trauma: 0, noise: Math.random() * 100,
      dofOverride: null, done: false, fired: new Set(),
      // per-fighter position tweens — {from,to,t0,t1,ease}
      mv: new Map([[win, null], [lose, null]]),
      mark: new Map([[win, winPos.clone()], [lose, losePos.clone()]]),
      skippable: FINISHERS.alwaysSkippable || (FINISHERS.skipAfterSeen && hasSeen(def.id)),
      disposers
    };
    if (import.meta.env?.DEV) console.info('[finisher]', def.id, 'runs', end.toFixed(2) + 's', acts.length, 'actions');
  }

  // Everything that could render over the shot, removed before the first frame.
  _clearWorld(win, lose) {
    const m = this.match;
    m.minions?.clear?.();
    m.judgemen?.clear?.();
    m.shikigami?.clear?.();
    // DAGON'S SEA. The brief's cleanup requirement, and the obvious case:
    // nothing should be swimming through his own finisher except the fish the
    // finisher itself puts there. Cleared for BOTH fighters — the loser having
    // summons out is the same problem.
    m.ocean?.clear?.();
    // URO'S SKY. Every warp surface, every shard and the constant haze go with
    // everything else, so a shattered plane left hanging in the air does not
    // end up in the first frame of somebody else's cinematic.
    m.warpfx?.clear?.();
    m.curses?.clear?.();
    m.flora?.clear?.();
    m.swarms?.clear?.();
    m.freeze?.clear?.();
    m.effects?.clear?.();
    m.ritual?.abort?.();
    m.domains?.abortContest?.();
    if (m.domains?.state) m.domains._collapse(false);
    m.domains?.clearSwordCarry?.();
    m.domainfx?.hide?.();
    m.domainfx?.clearClash?.();
    m.gamble?.resetRound?.();
    for (const f of m.fighters) m.bubbles?.cut?.(f);
    for (const [, aura] of m.chargedAuras) m.fx.removeAura(aura);
    m.chargedAuras.clear();
    this._flushFX(m.fx);
    for (const c of m.cams) { c.endCinematic?.(); c.trauma = 0; c.fovKickV = 0; }
    // every body that is not in the cinematic, INCLUDING its contact shadow —
    // a separate mesh that fx.update writes every frame regardless of the
    // body's visibility, and would otherwise leave a dark disc in the shot
    for (const f of m.fighters) {
      if (f !== win && f !== lose) f.model.group.visible = false;
    }
    // ---- A FLYING BODY CANNOT BE STOOD OVER ------------------------------
    // The brief's non-standard-body list, with a new entry on it: a finisher
    // cannot be performed on somebody who is hovering. The director already
    // pins both bodies to the floor under them every frame, so the geometry
    // was never the problem — the STATE was, because a fighter whose hover is
    // still running keeps having gravity switched off underneath the
    // director's own placement.
    //
    // `groundFlight` is one call that clears it, and it is applied to the
    // WINNER as well as the loser: Uro performing a finisher stands on the
    // ground for it too, which is the only time in the game she does.
    groundFlight(win);
    groundFlight(lose);
    for (const s of m.fx.shadows) {
      if (s.fighter !== win && s.fighter !== lose) s.mesh.visible = false;
    }
  }

  _flushFX(fx) {
    for (const list of [fx.parts, fx.rings, fx.beams]) {
      if (!list) continue;
      for (const p of list) fx.scene.remove(p.mesh);
      list.length = 0;
    }
    fx.rikaTimer = 0;
    if (fx.rika) fx.rika.setOpacity?.(0);
  }

  // -------------------------------------------------------------------------
  // PER-FRAME
  // -------------------------------------------------------------------------
  update(dt) {
    const a = this.active;
    if (!a) return false;

    // SKIP — only once this finisher has been seen through in full, never
    // while the pause menu is up (those presses belong to the menu), and
    // START/SELECT are excluded because they are pause and the legend.
    if (a.skippable && !a.done && a.t > 0 && !this.match.paused && this._anyButton()) {
      this._finish(true);
      return false;
    }

    // HITSTOP. A real freeze: the clock stops, so the frame of impact is
    // genuinely held rather than eased through.
    if (a.hold > 0) {
      a.hold -= dt;
      this._render(a, 0);
      return true;
    }

    const prev = a.t;
    a.t += dt;
    this._cues(a, prev, a.t);
    this._visuals(a, a.t, dt);
    this._render(a, dt);
    if (a.t >= a.end) { this._finish(false); return false; }
    return true;
  }

  _anyButton() {
    const frames = this.match.input?.frames || [];
    return frames.some(f => f && (f.jumpP || f.punchP || f.heavyP || f.ct1P || f.ct2P
      || f.ultP || f.copyP || f.tauntP || f.lockP || f.blockP || f.confirmP || f.backP
      || f.leftP || f.rightP || f.upP || f.downP));
  }

  // ---- the timeline -------------------------------------------------------
  _cues(a, prev, t) {
    for (let i = 0; i < a.acts.length; i++) {
      const act = a.acts[i];
      if (prev < act.t0 && t >= act.t0) this._startAction(a, act, i);
    }
  }

  // Contacts fire from _render, AFTER the skeletons have been posed for this
  // frame. Firing them here in _cues meant the reaction and the spark landed a
  // frame before the strike actually arrived — which on a snap-eased key is
  // most of a metre of travel, and was the single biggest reason the first
  // pass of this never looked like anybody was hitting anybody.
  _fireContacts(a) {
    for (const act of a.acts) {
      if (act.tc == null || a.fired.has(act) || a.t < act.tc) continue;
      a.fired.add(act);
      this._contact(a, act);
    }
  }

  // ---- an action opens ----------------------------------------------------
  _startAction(a, act, i) {
    a.idx = i;
    a.act = act;
    a.smear = 1;                                  // every action is a hard cut
    a.dofOverride = act.dof ?? null;
    a.shot = act.shot || DEFAULT_SHOTS.mid;

    const speed = act.speed ?? 1;
    if (act.win) playAny(a.win, act.win, { speed, fade: act.fade ?? 0.07 });
    if (act.op) playAny(a.lose, act.op, { speed, fade: act.fade ?? 0.07 });

    // ---- THE SOLVE ------------------------------------------------------
    // Put the striker where the strike lands. Everything else in this feature
    // is presentation; this is the part that makes it a fight. Skipped for a
    // `blast`, which reaches them from wherever he is standing.
    if (act.solve) {
      const striker = act.strike === 'win' ? a.win : a.lose;
      const victim = act.strike === 'win' ? a.lose : a.win;
      const c = act.contact;
      const vMark = a.mark.get(victim);
      const victimClip = victim.anim.current?.name?.replace(/^fin_/, '') || 'idle';
      const strikeClip = act.strike === 'win' ? act.win : act.op;
      let aimBone = AIM_BONE[c.aim] || 'Chest';
      // A strike that MISSES is aimed where the target was BEFORE they moved:
      // sample their clip at zero, and their slip or duck takes the head off
      // that line while the fist arrives at the space it used to be in. That is
      // the difference between a dodge and a strike that politely follows the
      // head down.
      const aimT = act.hit === false ? 0 : (victim.anim.time || 0) + (c.at / speed);

      // ---- SOLVED AS A FIXED POINT ----------------------------------------
      // The offsets are only valid for the facing they were sampled at, and
      // moving the body sideways to land a hook or a roundhouse CHANGES that
      // facing (both fighters turn to face each other every frame) — which
      // rotates the offset out from under the answer. Measured: a roundhouse
      // solved in one pass missed by half a metre, an overhead by nearly
      // eighty centimetres. Three iterations converge to under a centimetre.
      // ---- BLADING --------------------------------------------------------
      // A strike whose contact bone sits off the body's centre line cannot land
      // on a target the body is squared up to — a side kick's ankle is two
      // thirds of a metre out to the side, so no distance exists at which it
      // arrives on somebody the kicker is facing. Real fighters solve this by
      // turning side-on, and so does this: `blade` is how far the body is
      // allowed to turn at the moment of impact, and it is derived from the
      // move's own geometry (where the bone actually is) rather than guessed.
      const local = strikeOffset(striker, strikeClip, c.at, c.bone, 0);

      // ---- AIM WHERE YOU CAN REACH ----------------------------------------
      // The choreography says "head", and against another person that is where
      // it lands. Against Mahoraga the head is three metres up and a human arm
      // is not: aiming there would leave every blow punching at his hip with a
      // metre and a half of daylight above it. So the target walks DOWN the
      // body to whichever bone is nearest the height the strike actually
      // arrives at — which is also correct for the short ones, and is why a
      // 1.42 m Jogo gets hit in the face by the same clip.
      const reachY = local.y;
      let bestBone = aimBone, bestDy = Infinity;
      for (const cand of [aimBone, 'Head', 'Neck', 'Chest', 'Spine', 'Hips', 'ThighL']) {
        const off = strikeOffset(victim, victimClip, aimT, cand, 0);
        if (off.lengthSq() < 1e-6) continue;
        const dy = Math.abs(off.y - reachY);
        if (dy < bestDy) { bestDy = dy; bestBone = cand; }
      }
      aimBone = bestBone;
      const bladeCap = (c.blade ?? 24) * Math.PI / 180;
      const blade = clamp(-Math.atan2(local.x, Math.max(0.05, local.z)), -bladeCap, bladeCap);
      act._blade = { who: striker, rad: blade };

      let sYaw = yawBetween(a.mark.get(striker), vMark) + blade;
      const want = new THREE.Vector3();
      for (let it = 0; it < 10; it++) {
        const vYaw = yawBetween(vMark, it === 0 ? a.mark.get(striker) : want);
        const target = vMark.clone().add(strikeOffset(victim, victimClip, aimT, aimBone, vYaw));
        const hitOff = strikeOffset(striker, strikeClip, c.at, c.bone, sYaw);
        want.copy(target).sub(hitOff);
        want.y = a.deck;
        const line = _v.copy(vMark).sub(want).setY(0).normalize();
        want.addScaledVector(line, -(c.reach ?? 0.1) * a.scale);
        const next = yawBetween(want, vMark) + blade;
        const turn = Math.atan2(Math.sin(next - sYaw), Math.cos(next - sYaw));
        // UNDER-RELAXED. A strike whose contact is far off the body's centre
        // line — a side kick, a hook, a roundhouse — swings the required facing
        // by tens of degrees per pass, and a full step oscillates instead of
        // converging: the first version of this left Naoya's Frame Kick
        // pointing ninety degrees away from the man it was aimed at.
        sYaw += turn * 0.5;
        if (Math.abs(turn) < 0.008) break;              // half a degree
      }
      const line = _v.copy(vMark).sub(want).setY(0).normalize().clone();
      this.match.arena.bounds?.clampXZ(want, 0.5);
      // never inside the other body — a solved jab legitimately gets close, so
      // this floor is deliberately tighter than the fight's own separation
      const minGap = 0.62 * ((striker.hurtBox?.push ?? 0.4) + (victim.hurtBox?.push ?? 0.4));
      const vm = a.mark.get(victim);
      const gap = Math.hypot(want.x - vm.x, want.z - vm.z);
      if (gap < minGap && gap > 1e-3) {
        want.x = vm.x + (want.x - vm.x) / gap * minGap;
        want.z = vm.z + (want.z - vm.z) / gap * minGap;
      }
      act._aimBone = aimBone;
      a.mark.set(striker, want);
      // and travel so that they ARRIVE on the contact frame
      this._tween(a, striker, want, a.t, act.tc, 'in');
    } else {
      // no strike: hold position, or take an explicit staging offset
      for (const [who, off] of [['win', act.winAt], ['op', act.opAt]]) {
        if (!off) continue;
        const f = who === 'win' ? a.win : a.lose;
        const p = a.mark.get(f).clone()
          .addScaledVector(a.dir, off[0] * a.scale)
          .addScaledVector(a.right, off[1] * a.scale);
        this.match.arena.bounds?.clampXZ(p, 0.5);
        a.mark.set(f, p);
        this._tween(a, f, p, a.t, a.t + act.span * 0.7, 'smooth');
      }
    }

    if (act.shake) this.shake(act.shake);
    if (act.flash) this.flash(act.flash);
    if (act.impact) a.overlay.impact(act.impact);
    if (act.sting) a.audio.sting(a.def.chord || 'brutal', a.def.root || 174.61);
    if (act.snd) this._sound(a, act.snd);
    if (act.fx) { try { act.fx(this._ctx(a)); } catch (e) { console.warn('[finisher] action fx failed', a.def.id, i, e); } }
  }

  // ---- the frame it lands --------------------------------------------------
  _contact(a, act) {
    const c = act.hitDef;
    const striker = act.strike === 'win' ? a.win : a.lose;
    const victim = act.strike === 'win' ? a.lose : a.win;
    const power = (act.power ?? c.power ?? 1);

    // ---- THE RESIDUAL ----------------------------------------------------
    // The solve predicts where the bone will be; the frame it actually lands on
    // is up to one frame later, and on a hard-eased key a hand can travel half
    // a metre in that frame. So on the contact frame the striker is nudged by
    // whatever is left over, which is centimetres — invisible under the hitstop
    // that follows, and it makes the blow land EXACTLY rather than nearly.
    if (act.solve && c.bone) {
      const striker0 = act.strike === 'win' ? a.win : a.lose;
      const victim0 = act.strike === 'win' ? a.lose : a.win;
      const sb = striker0.model.bones.get(c.bone);
      const vb = victim0.model.bones.get(act._aimBone || AIM_BONE[c.aim] || 'Chest');
      if (sb && vb) {
        const err = vb.getWorldPosition(_v2).sub(sb.getWorldPosition(_v));
        err.y = 0;
        const back = _v.copy(victim0.pos).sub(striker0.pos).setY(0).normalize()
          .multiplyScalar(-(c.reach ?? 0.1) * a.scale);
        err.add(back);
        // a correction, not a teleport: anything past this is an authoring bug
        // in the move and should look wrong rather than be papered over
        const MAXFIX = 0.55 * a.scale;
        if (err.length() > MAXFIX) err.setLength(MAXFIX);
        striker0.pos.x += err.x; striker0.pos.z += err.z;
        striker0.prevPos.copy(striker0.pos);
        a.mark.get(striker0).x += err.x;
        a.mark.get(striker0).z += err.z;
        a.mv.set(striker0, null);
        striker0.model.group.position.copy(striker0.pos);
        striker0.model.group.updateMatrixWorld(true);
      }
    }
    const at = this._contactPoint(a, act);

    // DEV DIAGNOSTIC. The one number that says whether this is a fight or two
    // people posing: how far the striking bone finished from the bone it was
    // aimed at on the frame of impact, minus the stand-off the move asked for.
    // Everything in the roster now lands inside a fist of what it aimed at; it
    // was half a metre out before the solve existed. Free in a build.
    if (import.meta.env?.DEV && act.solve && c.bone) {
      const sb = striker.model.bones.get(c.bone);
      const vb = victim.model.bones.get(act._aimBone || AIM_BONE[c.aim] || 'Chest');
      if (sb && vb) {
        const gap = sb.getWorldPosition(_v).distanceTo(vb.getWorldPosition(_v2));
        (window.__finGaps || (window.__finGaps = [])).push({
          id: a.def.id, act: a.idx, hit: !!act.hit,
          move: act.strike === 'win' ? act.win : act.op, aim: act._aimBone,
          off: +(gap - (c.reach ?? 0.1) * a.scale).toFixed(3)
        });
      }
    }

    if (act.hit === false) {
      // MISSED ENTIRELY — a slip, a duck, a step through. Nothing was touched,
      // so nothing sparks: all it gets is the sound of something heavy going
      // past somebody's ear, which is the whole point of the beat.
      if (act.miss) {
        this._sound(a, 'whiff');
        a.audio.whoosh(0.9 * power);
        this.shake(0.10 * power);
      } else {
        // parried or blocked: a real collision, with its own sound and spark
        this._sound(a, act.blockSnd || (c.kind === 'blade' ? 'clang' : 'block'));
        this.match.fx.guardSpark(at);
        this.shake(0.20 * power);
        a.hold = Math.max(a.hold, HITSTOP * 0.5 * power);
        a.overlay.impact(0.08);
      }
      // A THROW HERE IS AN AUTHORING BUG, not a runtime condition — a wrong FX
      // name or a bad argument — and swallowing it silently meant a finisher
      // could lose its entire impact effect with nothing anywhere saying so.
      // It still must not take the cinematic down, so it is caught and LOUD.
      if (act.onContact) {
        try { act.onContact(this._ctx(a), at); }
        catch (e) { console.warn('[finisher] onContact failed', a.def.id, e); }
      }
      return;
    }

    // IT LANDS.
    if (act.react) playAny(victim, sizedMove(victim, act.react), { fade: 0.04, speed: act.reactSpeed ?? 1 });
    this._sound(a, act.snd2 || c.kind);
    a.audio.hit(0.55 + power * 0.6);
    this.match.fx.hitSpark(at, power > 1.1 ? 'heavy' : 'light');
    this.shake(0.22 + power * 0.42);
    a.hold = Math.max(a.hold, HITSTOP * power);
    a.overlay.impact(act.impactFrame ?? (power > 1.2 ? 0.18 : 0.10));
    if (power > 1.2) this.flash(0.25 * power);

    // THE HIT MOVES THEM. Knockback along the line of the strike, over the
    // front of the reaction — this is most of what makes a landed blow read as
    // landed rather than as two clips playing at once.
    const push = (act.knock ?? (0.28 + power * 0.30)) * a.scale;
    const line = _v2.copy(a.mark.get(victim)).sub(a.mark.get(striker)).setY(0).normalize();
    const to = a.mark.get(victim).clone().addScaledVector(line, push);
    to.y = a.deck;
    this.match.arena.bounds?.clampXZ(to, 0.5);
    a.mark.set(victim, to);
    this._tween(a, victim, to, a.t, a.t + 0.10 + power * 0.16, 'out');

    if (act.onContact) {
      try { act.onContact(this._ctx(a), at); }
      catch (e) { console.warn('[finisher] onContact failed', a.def.id, e); }
    }
  }

  // Where the blow actually connects, in world space — used for the spark, the
  // camera and any per-finisher VFX, so the effect is on the fist and not at
  // the middle of the arena.
  _contactPoint(a, act) {
    const victim = act.strike === 'win' ? a.lose : a.win;
    const bone = act._aimBone || AIM_BONE[act.hitDef?.aim] || 'Chest';
    return bonePos(victim, bone);
  }

  _sound(a, kind) {
    const s = this.match.sfx;
    switch (kind) {
      case 'punch': s.hit(false); break;
      case 'kick': s.hit(true); break;
      case 'blade': s.cleave?.(true); break;
      case 'blast': s.ceSmash?.(); break;
      case 'grab': s.armor?.(); break;
      case 'block': s.guard(); break;
      case 'clang': s.swordShatter?.() ?? s.guard(); break;
      case 'whiff': s.whiff(); break;
      default: if (typeof s[kind] === 'function') s[kind]();
    }
  }

  _tween(a, f, to, t0, t1, ease = 'smooth') {
    a.mv.set(f, {
      from: f.pos.clone(), to: to.clone(),
      t0, t1: Math.max(t0 + 0.05, t1 ?? (t0 + 0.3)),
      ease: ease === 'in' ? easeIn : ease === 'out' ? easeOut : smoothstep
    });
  }

  // The handle an action's `fx(d)` callback gets.
  _ctx(a) {
    const m = this.match;
    return {
      m, win: a.win, lose: a.lose, fx: m.fx, sfx: m.sfx, stage: m.stage,
      audio: a.audio, overlay: a.overlay, scale: a.scale, cls: a.cls,
      dir: () => a.dir.clone(),
      bone: (f, n) => bonePos(f, n),
      // between the two of them, at a height that is a fraction of the SHORTER
      // body, so an effect never floats over a small opponent or lands at a
      // giant's knee
      contact: (y = 1.2) => a.win.pos.clone().lerp(a.lose.pos, 0.5)
        .setY(a.deck + y * Math.min(bodyScale(a.win), bodyScale(a.lose))),
      shake: v => this.shake(v),
      flash: v => this.flash(v),
      dof: v => { a.dofOverride = v; }
    };
  }

  shake(v) { if (this.active) this.active.trauma = Math.min(1.5, this.active.trauma + v); }
  flash(v) { this.match.stage.flash(v); }

  // ---- continuous screen state -------------------------------------------
  _visuals(a, t, dt) {
    const o = a.overlay;
    const act = a.act;
    const dipIn = t < 0 ? 1 : Math.max(0, 1 - t / 0.22);
    const dipOut = t > a.end - 0.42 ? clamp((t - (a.end - 0.42)) / 0.42, 0, 1) : 0;
    o.dip(Math.max(dipIn, dipOut));
    // the skip hint is drawn ONLY over the black, before the shot exists
    o.skipHint(a.skippable && t < 0 ? clamp(-t / (DIP_IN * 0.5), 0, 1) * 0.9 : 0);
    const bars = t < 0 ? clamp((t + DIP_IN) / DIP_IN, 0, 1)
      : t > a.end - 0.5 ? Math.max(0, (a.end - t) / 0.5) : 1;
    o.bars(bars);
    a.smear = Math.max(0, a.smear - dt * 9);
    o.smear(a.smear);
    o.dof(a.dofOverride ?? (act?.dofBase ?? 0.25));
    // SPEED LINES ride the wind-up of every strike and stop dead on impact —
    // they are the anticipation, not the hit
    let speed = 0;
    if (act?.tc != null) {
      const lead = act.tc - t;
      if (lead > 0 && lead < 0.30) speed = 0.35 + 0.55 * (1 - lead / 0.30);
      else if (t - act.tc > 0 && t - act.tc < 0.10) speed = 0.9;
    }
    o.speed(act?.speedLines ?? speed);
    o.wash(t < 0 ? 0 : 0.22 + (act?.wash ?? 0));
    o.vignette(t < 0 ? 0 : 0.55);
  }

  // ---- the frame ----------------------------------------------------------
  _render(a, dt) {
    const m = this.match;
    const bounds = m.arena.bounds;

    for (const f of [a.win, a.lose]) {
      const mv = a.mv.get(f);
      if (mv) {
        const k = mv.ease(clamp((a.t - mv.t0) / (mv.t1 - mv.t0), 0, 1));
        f.pos.x = mv.from.x + (mv.to.x - mv.from.x) * k;
        f.pos.z = mv.from.z + (mv.to.z - mv.from.z) * k;
        if (k >= 1) a.mv.set(f, null);
      } else {
        const mk = a.mark.get(f);
        f.pos.x = damp(f.pos.x, mk.x, 7, dt);
        f.pos.z = damp(f.pos.z, mk.z, 7, dt);
      }
      // each body stands on the surface under ITSELF — ten of the maps are
      // multi-level and a step between the two marks would sink one of them
      f.pos.y = bounds
        ? clamp(bounds.floorAt(f.pos.x, f.pos.z, a.deck + 1.4), a.deck - 0.6, a.deck + 0.6)
        : a.deck;
      f.prevPos.copy(f.pos);
      f.prevFacing = f.facing;
    }
    // They always face each other — except for the body turn a bladed strike
    // needs, which is eased in across the wind-up and back out over the
    // recovery so the turn is part of the throw rather than a snap.
    a.win.facing = yawBetween(a.win.pos, a.lose.pos);
    a.lose.facing = yawBetween(a.lose.pos, a.win.pos);
    const act = a.act;
    const bl = act?._blade;
    if (bl && bl.rad) {
      const k = act.tc == null ? 0
        : a.t < act.tc ? smoothstep(clamp((a.t - act.t0) / Math.max(0.05, act.tc - act.t0), 0, 1))
          : Math.max(0, 1 - (a.t - act.tc) / 0.35);
      bl.who.facing += bl.rad * k;
    }
    a.win.applyRender(1, dt, 1);
    a.lose.applyRender(1, dt, 1);
    a.win.model.group.updateMatrixWorld(true);
    a.lose.model.group.updateMatrixWorld(true);

    // the bodies are now posed for this frame — so this is the honest moment to
    // ask whether anything has landed
    if (dt > 0) this._fireContacts(a);

    // ---- AMBIENCE ---------------------------------------------------------
    // An optional per-frame hook on the finisher itself, for the effects that
    // are a STATE rather than an event: Jogo steaming for the whole scene and
    // the body he set alight still burning three actions later, the arcs
    // coming off Kashimo between his own strikes. Everything else in this
    // feature fires on a beat, and a technique that only exists on beats reads
    // as a character who switches their power on twice and off again.
    //
    // THROTTLED, deliberately. Called at ~11 Hz rather than per frame, because
    // every one of these spawns particles and a finisher that spawns them 60
    // times a second is a finisher that drops frames on the hardware this game
    // is built to run on.
    if (a.def.ambient && dt > 0) {
      a.ambT = (a.ambT || 0) + dt;
      if (a.ambT >= 0.09) {
        a.ambT = 0;
        try { a.def.ambient(this._ctx(a), a.t); }
        catch (e) { console.warn('[finisher] ambient failed', a.def.id, e); }
      }
    }

    // THE CAMERA. One shot per action, cut hard, with its own shake.
    const u = act ? clamp((a.t - act.t0) / act.span, 0, 1) : 0;
    const s = a.shot ? a.shot(this._camCtx(a), u) : null;
    if (s) {
      a.trauma = Math.max(0, a.trauma - dt * 2.6);
      const t2 = a.trauma * a.trauma;
      a.noise += dt * 44;
      const sx = (Math.sin(a.noise * 1.7) + Math.sin(a.noise * 3.1)) * 0.5 * t2 * 0.26 * a.scale;
      const sy = (Math.sin(a.noise * 2.3 + 5) + Math.sin(a.noise * 4.1)) * 0.5 * t2 * 0.2 * a.scale;
      for (const c of m.cams) {
        c.cam.position.copy(s.pos);
        c.cam.position.x += sx;
        c.cam.position.y += sy;
        c.cam.lookAt(s.look);
        c.cam.rotation.z += sx * 0.02;
        c.cam.fov = s.fov;
        c.cam.updateProjectionMatrix();
        c.pos.copy(s.pos);
        c.look.copy(s.look);
      }
    }

    m.fx.update(dt);
    // CURSED SPEECH. `Match.update` returns early for the whole length of a
    // finisher, so the glyph system would freeze mid-flight — a word thrown in
    // the choreography would hang in the air and never arrive. It is ticked
    // here instead, on the cinematic's own clock, which also means a command
    // still travelling when the KO landed carries through into the opening
    // shot rather than being cut off.
    //
    // Nothing gameplay-facing rides on it here: every `speak` in a finisher
    // passes `onArrive: null`, so the payload never fires and the damage comes
    // from the director's own `blast` like every other finisher hit.
    m.speechfx?.update(dt);
    m.arena.update(dt, m.stage.camera);
  }

  _camCtx(a) {
    // the shot frame rides the two bodies rather than the opening mark, so a
    // camera composed on "between them" stays composed while they move
    const mid = _v.copy(a.win.pos).lerp(a.lose.pos, 0.5).setY(a.deck);
    const dir = _v2.copy(a.lose.pos).sub(a.win.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(a.dir);
    dir.normalize();
    return {
      win: a.win, lose: a.lose, origin: mid.clone(), fwd: dir.clone(),
      right: v3(dir.z, 0, -dir.x), deck: a.deck, s: a.scale,
      bone: (f, n) => bonePos(f, n)
    };
  }

  // -------------------------------------------------------------------------
  // THE HAND-OFF into the win screen.
  // -------------------------------------------------------------------------
  _finish(skipped) {
    const a = this.active;
    if (!a || a.done) return;
    a.done = true;
    const m = this.match;
    markSeen(a.def.id);

    a.lose.setState('ko', {});
    const koClip = a.lose.anim.clips.get('ko');
    if (koClip) {
      a.lose.anim.play('ko', { fade: skipped ? 0.14 : 0.10, restart: true });
      a.lose.anim.time = koClip.dur;
    }
    // NOT 'victory', or match._koFlow would skip the victory pose entirely
    a.win.setState('idle', {});

    a.audio.close(a.def.root ? a.def.root * 0.5 : 110);
    a.audio.dispose();
    m.sfx.startWind();

    for (const c of m.cams) {
      c.endCinematic?.();
      c.applySubject?.(a.win);
      c.baseFov = 50;
      c.cam.fov = 50;
      c.cam.updateProjectionMatrix();
    }
    m.cam.cinematic(a.win.pos.clone(), 2.4, 3.6 * a.scale, 1.6 * a.scale);
    m.stage.setGrade('ko');
    m.phaseT = Math.max(m.phaseT, 1.42);

    for (const d of a.disposers) d?.();

    const ov = a.overlay;
    ov.bars(0);
    ov.wash(0); ov.vignette(0); ov.dof(0); ov.speed(0); ov.smear(0);
    ov.dip(1);
    ov.el.querySelector('.fin-dip').style.transition = 'opacity ' + DIP_OUT + 's ease';
    requestAnimationFrame(() => { try { ov.dip(0); } catch (e) { } });
    // `_outroEl` is kept so a teardown DURING the fade takes the element with
    // it — cancelling the timer without removing the element leaves a
    // full-screen black div on top of the game forever.
    this._outroEl = ov;
    this._outro = setTimeout(() => { ov.destroy(); this._outro = null; this._outroEl = null; }, (DIP_OUT + 0.1) * 1000);

    this.active = null;
  }

  abort() {
    if (this._outro) { clearTimeout(this._outro); this._outro = null; }
    if (this._outroEl) { this._outroEl.destroy(); this._outroEl = null; }
    const a = this.active;
    if (a) {
      for (const d of a.disposers) d?.();
      a.audio?.dispose?.();
      a.overlay?.destroy?.();
      this.active = null;
    }
    document.body.classList.remove('fin-on');
  }
}
