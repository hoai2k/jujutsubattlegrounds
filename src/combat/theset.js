// THE SET 持ちネタ — Takaba's ultimate.
//
// ===========================================================================
// WHAT THIS IS, AND WHAT IT REPLACED
// ===========================================================================
// A pocket world with three SCENES in it. Both fighters are pulled inside, the
// arena is replaced by a real traversable stage, and the opponent has to
// physically **get to the exit** three times before the clock beats them.
//
// It replaced a version that was three quick-time events behind a full-screen
// panel. That version worked and it was the wrong feature: nothing about it was
// a place, both players stopped playing the game for eight seconds, and the
// only thing it tested was reaction time.
//
// *** IT IS NOT A DOMAIN EXPANSION. *** Takaba does not have one and the
// character stays canon-correct: this is a burst ultimate on the standard gate
// that happens to build a room. It has no barrier, no sure-hit, no refinement,
// it cannot clash with a domain, and it does not appear anywhere in
// domains.js. What it borrows from the domain layer is the two things a
// pocket world actually needs — a swapped-out environment and a confined
// playspace — and it borrows them by calling the same public helpers, not by
// becoming one.
//
// ===========================================================================
// THE CANON THIS IS BUILT ON
// ===========================================================================
//   "Takaba's cursed technique brings him and his opponent into IMAGINARY
//    SCENARIOS manifested from his imagination, causing them to engage in
//    hilarious shenanigans in VARIOUS SIMULATED ENVIRONMENTS... Any damage
//    incurred to his opponent will persist, but DAMAGE DONE TO TAKABA ARE
//    NOTHING BUT SIMULATIONS TO HIM."
//
// Three mechanics fall directly out of that sentence and none of them is a
// balance invention:
//
//   1  IT IS A PLACE, so the scenes are geometry (art/models/setpieces.js),
//      every one lifted from a specific panel of the Kenjaku fight.
//   2  DAMAGE TO THE OPPONENT PERSISTS, so the hazards and the scene failures
//      deal real health.
//   3  *** DAMAGE TO TAKABA IS A SIMULATION, SO HE CANNOT BE HURT IN HERE. ***
//      And the balancing half of the same clause, which the source does not
//      say but the fight obviously needs: he cannot hurt them either. Inside
//      the set his attacks deal ZERO damage and only shove. He is a nuisance
//      and an obstacle, not a killer — the damage comes from failing scenes.
//      Without that half the ultimate would be a free kill with a stage
//      around it.
//
// ===========================================================================
// THE SHAPE OF A RUN
// ===========================================================================
//   cast → THE OPENING (1.1 s, the titles) → scene 1 → scene 2 → scene 3
//        → THE RESULT (1.6 s)
//
// Each scene: a title card beat (0.8 s, the world is assembling), then it is
// live and on its own clock. Reaching the exit pad ends the scene EARLY, which
// is what makes running fast worth anything.
//
//   cleared 3  they get out. Chip damage, applause, Takaba visibly sulks.
//   cleared 2  heavy damage.
//   cleared 1  severe damage.
//   cleared 0  INSTANT KO, through the SHARED category — the same path
//              Mahito's transfiguration and Higuruma's execution take, so it
//              correctly ignores Jackpot's healing and is correctly resisted
//              by CHANCE by Mahoraga's adaptation.
//
// Worst case is about 21 seconds and the common case is nearer 15. That is
// three times the old QTE version and it is the honest cost of the change —
// see the delivery notes. It is in the band domains already occupy (Gojo 7 s,
// Higuruma 20 s, Megumi 30 s), which is the right comparison now that it is a
// place rather than a prompt.
import * as THREE from 'three';
import { v3, rand, clamp, flatDist, mulberry32 } from '../core/mathutil.js';
import { commitInstantKO, finishInstantKO } from './instantko.js';
import { SPECIAL } from './balance.js';
import { SCENES, buildScene, SET_X0, SET_X1 } from '../art/models/setpieces.js';

export { SCENES };

export class TheSet {
  constructor(match) {
    this.match = match;
    this.live = null;
    this.forcedScenes = null;   // debug: force a specific three
  }

  // The tick owner while it runs. Unlike the QTE version this does NOT freeze
  // the fighters — they play the whole time, which is the entire point.
  get running() { return !!this.live; }

  // ---- CAN IT START? ------------------------------------------------------
  // Every refusal reports why. "The ultimate did nothing" is the worst thing a
  // full bar can buy.
  canStart(caster, victim) {
    const m = this.match;
    if (this.live) return { ok: false, label: 'ALREADY LIVE' };
    if (!victim?.alive || victim.instantKO) return { ok: false, label: 'NO CONTESTANT' };
    if (m.cinematicLock || m.finishers?.active) return { ok: false, label: 'NOT NOW' };
    if (m.domains?.duelFreeze) return { ok: false, label: 'NOT NOW' };
    if (m.ritual?.active) return { ok: false, label: 'NOT NOW' };
    // ---- A STANDING DOMAIN OWNS THE WORLD, AND IT KEEPS IT -----------------
    // The old QTE version could open on top of one because it never touched the
    // level. This one REPLACES the level, and two systems each convinced they
    // own the environment is not a thing to paper over. So: if anybody's
    // barrier is up, the set is refused with a line. That is also the correct
    // reading — a domain is a sealed space and a comedian does not get to build
    // a stage inside somebody else's sealed space.
    const d = m.domains?.state;
    if (d && d.phase !== 'idle') return { ok: false, label: 'SOMEBODY ELSE\'S WORLD' };
    return { ok: true };
  }

  start(caster, victim) {
    const verdict = this.canStart(caster, victim);
    if (!verdict.ok) { caster.emit('showRefused', verdict); return false; }
    const m = this.match;
    const cfg = caster.cfg.ultimate.show;
    const tierIdx = caster.comedyTier ?? 0;
    const tierDef = caster.cfg.comedy.tiers[tierIdx];

    // DRAW THREE, no repeats, off the caster's own seeded stream so a debug
    // seed reproduces the whole run and not just the bits.
    const rng = caster.comedyRoll?.rng ?? mulberry32(1);
    const pool = [...SCENES];
    const drawn = [];
    for (let i = 0; i < cfg.scenes; i++) {
      const forced = this.forcedScenes?.[i];
      if (forced) { drawn.push(SCENES.find(s => s.key === forced) ?? pool[0]); continue; }
      drawn.push(pool.splice((rng() * pool.length) | 0, 1)[0]);
    }

    this.live = {
      caster, victim, cfg, tierIdx, tierDef, rng,
      order: drawn, index: -1, cleared: 0, results: [],
      phase: 'open', t: 0, scene: null, group: null, colliders: null,
      cpu: !!m.isCPU?.(victim),
      // what we put back afterwards
      savedFog: m.stage?.scene?.fog ?? null
    };

    // ---- THE WORLD GOES AWAY ----------------------------------------------
    // The arena is hidden exactly the way a closed domain hides it, and the
    // fog with it, so the set is not lit by a street that is no longer there.
    if (m.arena?.group) m.arena.group.visible = false;
    if (m.stage?.scene) m.stage.scene.fog = null;
    m.stage.setGrade?.('gameshow');

    // ---- AND SO DOES EVERYTHING ELSE ON THE FIELD -------------------------
    // A shikigami chasing the contestant through a scene is a bug, and one
    // chasing the HOST is worse. Every summon family is cleared, the same way
    // a finisher clears the field before its cinematic.
    m.minions?.clear?.();
    m.construction?.clear?.();
    m.ocean?.clear?.();
    m.curses?.clear?.();
    m.effects.entities.length = 0;

    // ---- THE CAMERA -------------------------------------------------------
    // A fixed-bearing platformer camera looking down the corridor (+X), so the
    // stick means "toward the exit" rather than "toward the opponent". The
    // contestant is running AWAY from the other fighter, which is the one
    // situation the fight-line camera cannot express — see the `corridor`
    // branch in core/camera.js.
    //
    // LOCK-ON IS SUSPENDED WITH IT, and restored on the way out: `_moveVec`
    // ignores the camera entirely while a fighter is soft-locked, so a
    // contestant with lock-on held would still be steering relative to Takaba.
    this.live.savedCamMode = m.cams?.[0]?.mode ?? 'follow';
    this.live.savedLock = [caster.lockOn, victim.lockOn];
    m.setCameraMode?.('corridor');
    caster.lockOn = false;
    victim.lockOn = false;

    caster.emit('setOpen', { tier: tierDef });
    m.hud.cutin(caster, 'THE SET', '持ちネタ — ' + tierDef.name);
    m.sfx.showFanfare?.();
    m.music?.duck(0.12, 24);
    m.hitstop(12);
    caster.anim.play('ult', { fade: 0.06, restart: true });
    return true;
  }

  // ---- BUILD / TEAR DOWN ONE SCENE ---------------------------------------
  _enterScene() {
    const L = this.live, m = this.match;
    L.index++;
    if (L.index >= L.cfg.scenes) { this._resolve(); return; }
    this._tearDownScene();

    const def = L.order[L.index];
    const built = buildScene(def.key, m.arena.bounds, L.tierIdx);
    L.scene = built;
    L.group = built.group;
    L.colliders = built.colliders;
    m.root.add(built.group);

    // both fighters are placed, the contestant on the start line and the host
    // beside it — he is IN the scene, not narrating it from outside
    this._place(L.victim, built.spawn, 0);
    this._place(L.caster, built.host, 0);
    // and the playspace is clamped to the corridor, the same helper Hakari's
    // parlor uses to keep people off the machines
    for (const f of [L.caster, L.victim]) f.domainRadius = SET_X1 + 4;

    L.phase = 'title';
    L.t = 0;
    L.sceneT = 0;
    L.hazardHitT = 0;
    m.sfx.showTitle?.(L.index);
    m.stage.flash(0.22);
    L.caster.emit('setScene', { index: L.index, def, time: built.time });
  }

  _place(f, at, yOff) {
    const bd = this.match.arena?.bounds;
    f.pos.set(at.x, 0, at.z);
    f.pos.y = (bd?.floorAt(at.x, at.z, 40) ?? 0) + yOff;
    f.prevPos.copy(f.pos);
    f.vel.set(0, 0, 0);
    f.grounded = true;
    f.juggle = 0;
    f.facing = Math.atan2(SET_X1 - at.x, 0);
    f.prevFacing = f.facing;
    if (f.state !== 'idle') f.setState('idle', { clip: 'idle' });
  }

  _tearDownScene() {
    const L = this.live, m = this.match;
    if (L.group) { m.root.remove(L.group); this._dispose(L.group); L.group = null; }
    if (L.colliders) { m.arena.bounds.drop(L.colliders); L.colliders = null; }
    L.scene = null;
  }

  _dispose(node) {
    node.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => mm.dispose());
    });
  }

  // ---- PER-TICK -----------------------------------------------------------
  update(dt) {
    const L = this.live;
    if (!L) return;
    const m = this.match;
    L.t += dt;

    // ---- THE TWO STANDING RULES OF THE SET, RE-APPLIED EVERY FRAME --------
    // Written here rather than as flags on the fighters, because a flag left
    // set after an interrupted set would be a permanently invulnerable Takaba.
    // Re-asserting them per tick and simply stopping is the safe shape.
    L.caster.iFrames = Math.max(L.caster.iFrames, 4);      // canon: it is a simulation to him
    L.caster.punchDmgMult = 0;                              // ...and so is his side of it
    for (const f of [L.caster, L.victim]) f.domainRadius = SET_X1 + 4;

    switch (L.phase) {
      case 'open':
        if (L.t >= L.cfg.openCard) this._enterScene();
        return;
      case 'title':
        if (L.t >= L.cfg.titleCard) {
          L.phase = 'run'; L.t = 0; L.sceneT = 0;
          m.hud.message(L.order[L.index].name, 0.7);
          m.sfx.showRimshot?.();
          L.caster.anim.play('hostAnnounce', { fade: 0.1, restart: true });
        }
        return;
      case 'run':
        for (const f of [L.caster, L.victim]) f.lockOn = false;
        this._tickRun(dt);
        return;
      case 'settle':
        if (L.t >= L.cfg.settle) this._enterScene();
        return;
      case 'result':
        this._tickResult(dt);
        return;
    }
  }

  _tickRun(dt) {
    const L = this.live, m = this.match, S = L.scene;
    L.sceneT += dt;
    const v = L.victim;

    // the scene advances itself and hands back whatever is currently dangerous
    const hazards = S.tick(dt, { runner: v.alive ? v.pos : null, t: L.sceneT }) || [];
    L.hazards = hazards;

    // ---- THE CONVEYOR'S DRAG ----------------------------------------------
    // Not a hazard: a velocity applied to anything standing on the deck. It is
    // the only scene that punishes hesitation directly.
    if (S.belt) {
      for (const f of [v, L.caster]) {
        if (!f.alive || !f.grounded) continue;
        if (f.pos.x > S.belt.x0 && f.pos.x < S.belt.x1 && Math.abs(f.pos.z) < 3.2
          && Math.abs(f.pos.y - S.belt.y) < 0.6) {
          f.pos.x += S.belt.push * dt;
        }
      }
    }

    // ---- FALLING OUT OF A SCENE -------------------------------------------
    if (S.voidY != null && v.pos.y < S.voidY) { this._sceneFailed('FELL'); return; }

    // ---- THE HAZARDS -------------------------------------------------------
    // A hazard SHOVES and CHIPS. It is deliberately not lethal on its own: the
    // damage in this ultimate is supposed to come from failing scenes, and a
    // taxi that could kill you would make the outcome table a lie.
    if (L.hazardHitT > 0) L.hazardHitT -= dt;
    if (v.alive && L.hazardHitT <= 0) {
      for (const h of hazards) {
        if (h.tell) continue;
        if (h.kind === 'water') {
          // the rising water is a PLANE, not a sphere: you are in it if your
          // feet are under it
          if (v.pos.y < h.plane - 0.10) { this._hazard(v, h, 'IN THE DRINK'); break; }
          continue;
        }
        const dx = v.pos.x - h.x, dz = v.pos.z - h.z, dy = (v.pos.y + 0.9) - h.y;
        if (dx * dx + dz * dz < h.r * h.r && Math.abs(dy) < 1.5) { this._hazard(v, h); break; }
      }
    }

    // ---- THE EXIT ----------------------------------------------------------
    if (v.alive && flatDist(v.pos, v3(S.exit.x, v.pos.y, S.exit.z)) < S.exit.r) {
      this._sceneCleared();
      return;
    }

    // ---- THE CLOCK ---------------------------------------------------------
    if (L.sceneT >= S.time) this._sceneFailed('TIME');

    // ---- THE CPU CONTESTANT -------------------------------------------------
    if (L.cpu) this._driveCPU(dt);
  }

  _hazard(v, h, label = null) {
    const L = this.live, m = this.match;
    L.hazardHitT = 0.55;                       // one hit per beat, not per frame
    const cfg = L.cfg.hazard;
    const dir = v3(v.pos.x - h.x, 0, v.pos.z - h.z);
    if (dir.lengthSq() < 1e-4) dir.set(-1, 0, 0);
    dir.normalize();
    // GLOBAL BALANCE: this writes the health bar directly rather than going
    // through applyHit (a taxi is not an attacker), so the scalar is applied by
    // hand — see combat/balance.js.
    v.res.hp -= cfg.chip * SPECIAL;
    v.vel.set(dir.x * cfg.push * (h.push ?? 1), cfg.pushY, dir.z * cfg.push * (h.push ?? 1));
    v.grounded = false;
    v.setState('hitLight', { clip: 'hitLight' });
    v.hitstun = cfg.hitstun;
    m.fx.hitSpark(v.pos.clone().add(v3(0, 1.2, 0)), 'light');
    m.sfx.hit(false);
    m.cam.shake(0.25);
    if (label) m.hud.toast(v, label);
    L.caster.anim.play('hostGood', { fade: 0.12, restart: true });
    L.caster.emit('setHazard', { kind: h.kind });
  }

  _sceneCleared() {
    const L = this.live, m = this.match;
    L.cleared++;
    L.results.push({ key: L.order[L.index].key, cleared: true, t: +L.sceneT.toFixed(2) });
    L.caster.anim.play('hostBad', { fade: 0.12, restart: true });   // he hates it
    m.sfx.showPass?.();
    m.hud.message('CLEARED', 0.8);
    m.stage.flash(0.3);
    L.phase = 'settle'; L.t = 0;
    L.caster.emit('setCleared', { index: L.index });
  }

  _sceneFailed(why) {
    const L = this.live, m = this.match;
    L.results.push({ key: L.order[L.index].key, cleared: false, why });
    L.caster.anim.play('hostGood', { fade: 0.12, restart: true });  // he loves it
    m.sfx.showFail?.();
    m.hud.message(why === 'FELL' ? 'AND HE IS DOWN' : 'OUT OF TIME', 1.0);
    m.cam.shake(0.4);
    L.phase = 'settle'; L.t = 0;
    L.caster.emit('setFailed', { index: L.index, why });
  }

  // ---- THE RESULT ---------------------------------------------------------
  _resolve() {
    const L = this.live, m = this.match;
    this._tearDownScene();
    const dmg = L.cfg.damage;
    L.phase = 'result'; L.t = 0; L.stage = 0;
    const n = L.cleared;

    // put them back where the fight was, side by side, before the world comes
    // back — coming out of the set standing inside a wall would be the single
    // worst bug this feature could have
    this._exitPlacement();

    if (n === 0) {
      const verdict = commitInstantKO(L.victim, { kind: 'theset' });
      if (!verdict.ok) {
        L.killRefused = verdict.label;
        m.hud.message(verdict.label, 1.6);
        L.victim.res.hp -= dmg.clear1 * SPECIAL;
        L.outcome = 'resisted';
      } else {
        L.outcome = 'ko';
        L.caster.anim.play('hostCelebrate', { fade: 0.06, restart: true });
        m.sfx.showJackpot?.();
        m.hud.message('NOBODY GOT OUT', 1.6);
        m.cam.shake(0.9);
        m.stage.flash(0.6);
      }
    } else {
      const d = n === 3 ? dmg.clear3 : n === 2 ? dmg.clear2 : dmg.clear1;
      L.victim.res.hp -= d * SPECIAL;
      L.outcome = n === 3 ? 'escaped' : 'hurt';
      if (n === 3) {
        L.caster.anim.play('hostSulk', { fade: 0.08, restart: true });
        m.sfx.showApplause?.();
        m.hud.message('THEY GOT OUT', 1.5);
      } else {
        L.caster.anim.play('hostGood', { fade: 0.08, restart: true });
        m.hud.message(n + ' OF 3', 1.5);
      }
    }
  }

  _exitPlacement() {
    const L = this.live, m = this.match;
    const bd = m.arena?.bounds;
    const spots = bd?.spawns?.length ? bd.spawns : null;
    const pts = spots
      ? [spots[0], spots[1] ?? spots[0]]
      : [{ x: -3, z: 0 }, { x: 3, z: 0 }];
    [L.caster, L.victim].forEach((f, i) => {
      if (!f) return;
      const p = pts[i] ?? pts[0];
      f.pos.set(p.x, 0, p.z);
      f.pos.y = bd?.floorAt(p.x, p.z, 40) ?? 0;
      f.prevPos.copy(f.pos);
      f.vel.set(0, 0, 0);
      f.grounded = true;
      f.domainRadius = null;
    });
    L.caster.facing = Math.atan2(L.victim.pos.x - L.caster.pos.x, L.victim.pos.z - L.caster.pos.z);
    L.victim.facing = L.caster.facing + Math.PI;
  }

  _tickResult(dt) {
    const L = this.live, m = this.match;
    if (L.stage === 0 && L.outcome === 'ko' && L.t >= 0.5) {
      L.stage = 1;
      m.fx.showConfetti?.(L.victim.pos.clone().setY(L.victim.pos.y + 2.2));
      m.sfx.showFanfare?.();
      finishInstantKO(L.victim, { kind: 'theset', by: L.caster });
      L.victim.setState('ko', { clip: 'ko' });
    }
    if (L.t >= L.cfg.result) this.end();
  }

  // ---- END ----------------------------------------------------------------
  // Also the abort path: a KO mid-set, a round ending, a match ending. It puts
  // the world back unconditionally, which is the only way a system that hides
  // the arena is safe to write.
  end() {
    const L = this.live;
    if (!L) return;
    const m = this.match;
    this._tearDownScene();
    this.live = null;
    if (m.arena?.group) m.arena.group.visible = true;
    if (m.stage?.scene && L.savedFog) m.stage.scene.fog = L.savedFog;
    m.stage.setGrade?.(null);
    m.setCameraMode?.(L.savedCamMode ?? 'follow');
    if (L.savedLock) {
      if (L.caster) L.caster.lockOn = L.savedLock[0];
      if (L.victim) L.victim.lockOn = L.savedLock[1];
    }
    for (const f of [L.caster, L.victim]) {
      if (!f) continue;
      f.domainRadius = null;
      f.punchDmgMult = 1;
    }
    if (L.victim?.alive && L.victim.state === 'hitLight') L.victim.setState('idle', { clip: 'idle' });
    if (L.caster?.alive) L.caster.setState('idle', { clip: 'idle' });
    L.caster?.emit?.('setEnded', { cleared: L.cleared, outcome: L.outcome });
  }

  clear() { if (this.live) { this._exitPlacement(); this.end(); } }

  // ---- THE CPU CONTESTANT --------------------------------------------------
  // It genuinely PLAYS: it runs at the exit, jumps gaps and steps, and swerves
  // around hazards it can see — with a reaction delay and a swerve accuracy
  // that scale with the difficulty tier. That is a much better bot than the
  // probability model the QTE version needed, because there is now an actual
  // thing to be good or bad at.
  //
  // It writes the fighter's position through the same `_locomote` the players
  // use by handing the match a synthetic frame — see `cpuFrame` below, which
  // combat/ai.js calls while the set is running.
  _driveCPU(dt) {
    const L = this.live;
    L.cpuThink = (L.cpuThink ?? 0) - dt;
    if (L.cpuThink > 0) return;
    L.cpuThink = L.cfg.cpu.reaction[L.tierIdx];
    L.cpuPlan = this._cpuPlan();
  }

  // The synthetic input the CPU contestant plays with. Called from ai.js.
  cpuFrame(f, frame) {
    const L = this.live;
    if (!L || f !== L.victim || L.phase !== 'run') return false;
    const S = L.scene;
    const plan = L.cpuPlan ?? this._cpuPlan();
    // ---- THE STICK IS EXPRESSED IN THE PLAYER'S FRAME, NOT THE WORLD'S ----
    // `_moveVec` turns the stick into a world direction against the camera
    // yaw: stick-up is `-move.z` and stick-right is `move.x`. Under the
    // corridor camera (yaw -PI/2) that resolves to world x = -move.z and
    // world z = move.x — so FORWARD ALONG THE CORRIDOR IS STICK UP, exactly as
    // it is for the human on the other pad, and the lateral swerve is stick
    // left/right. Writing world coordinates in here instead was the first
    // version's bug: the bot pushed the stick sideways and stood still.
    frame.move.z = -1;                    // toward the exit
    frame.move.x = clamp(plan.z, -1, 1);  // the swerve, in world z
    frame.dash = plan.dash;
    frame.jump = plan.jump;
    return true;
  }

  _cpuPlan() {
    const L = this.live, S = L.scene, v = L.victim;
    const acc = L.cfg.cpu.accuracy[L.tierIdx];
    const plan = { z: 0, dash: false, jump: false };
    if (!S) return plan;
    // aim at the exit's z — or, where the scene knows better than a straight
    // line does (the one lit door in a wall of five), at whatever the scene
    // points at — then dodge whatever is closest ahead
    const aimZ = S.aim?.(v.pos) ?? S.exit.z;
    let want = clamp((aimZ - v.pos.z) * 0.7, -1, 1);
    let nearest = null, nd = 99;
    for (const h of (L.hazards ?? [])) {
      if (h.kind === 'water') continue;
      // the doors are handled by the aim above — dodging the four shut ones
      // individually just walks it back out of the one opening
      if (h.kind === 'door' && S.aim) continue;
      const ahead = h.x - v.pos.x;
      if (ahead < -1.5 || ahead > 7) continue;
      const d = Math.hypot(ahead, h.z - v.pos.z);
      if (d < nd) { nd = d; nearest = h; }
    }
    // a bot that dodges PERFECTLY makes the ultimate worthless, so the swerve
    // only happens `accuracy` of the time and is otherwise a shrug
    if (nearest && nd < h_reach(nearest) && Math.random() < acc) {
      want = clamp((v.pos.z - nearest.z) * 1.4, -1, 1);
      if (Math.abs(want) < 0.3) want = Math.random() < 0.5 ? 1 : -1;
    }
    plan.z = want;
    plan.dash = Math.random() < acc * 0.5;
    // jump when there is floor missing in front of it, or a step to make
    const bd = this.match.arena?.bounds;
    if (bd) {
      const ahead = v.pos.x + 1.9;
      const hereY = bd.floorAt(v.pos.x, v.pos.z, v.pos.y + 0.6);
      const aheadY = bd.floorAt(ahead, v.pos.z, v.pos.y + 2.0);
      const gap = S.voidY != null && aheadY <= S.voidY + 0.5;
      if ((aheadY > hereY + 0.45 || gap) && v.grounded && Math.random() < acc + 0.25) plan.jump = true;
    }
    return plan;
  }

  // What the HUD draws.
  snapshot() {
    const L = this.live;
    if (!L) return null;
    const def = L.order[L.index] ?? null;
    return {
      phase: L.phase, index: L.index, scenes: L.cfg.scenes,
      cleared: L.cleared, results: L.results,
      tier: L.tierDef.name, tierKey: L.tierDef.key, tierColor: L.tierDef.color,
      outcome: L.outcome, killRefused: L.killRefused,
      contestant: L.victim?.cfg.name, host: L.caster?.cfg.name,
      scene: def ? {
        key: def.key, name: def.name, jp: def.jp, blurb: def.blurb,
        t: L.sceneT ?? 0, time: L.scene?.time ?? def.time[L.tierIdx],
        // how far along the corridor they are, 0..1 — the one number that says
        // whether they are winning
        progress: L.victim
          ? clamp((L.victim.pos.x - SET_X0) / (SET_X1 - SET_X0), 0, 1) : 0
      } : null
    };
  }
}

// how close a hazard has to be before the bot bothers
function h_reach(h) { return (h.r ?? 1) + 2.2; }
