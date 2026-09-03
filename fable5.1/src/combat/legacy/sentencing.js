// DOMAIN EXPANSION — DEADLY SENTENCING 死刑判決
//
// The domain is A CONTEST HIGURUMA CAN WIN OR LOSE. It is not a buff window
// and it is not a damage source, and — since 2026-07-27 — it does NOT hand him
// the sword for showing up. The courtroom runs a TRIAL, and the sword has to
// be won out of it.
//
// THE TRIAL (mode 'trial'). Rounds run back to back while the barrier stands.
// Each round both parties are called and both lock a plea on X / Y / B:
//
//        X  CONFESS 自白      Y  SILENCE 黙秘      B  DENIAL 否認
//
// The defendant picks their plea. Higuruma picks the plea he BELIEVES they
// will enter — the whole domain is a read, not an execution. On a correct read
// the court is satisfied: the domain's timer and barrier integrity both reset
// to full, so a Higuruma who keeps reading his opponent can hold the courtroom
// open indefinitely. THREE correct reads earn the Executioner's Sword — or ONE
// correct read of CONFESS, because a confession needs no further trial and
// hands him the blade on the spot.
//
// THE SWORD IS NOT BARRIER-SCOPED (mode 'carry'). Earning it BREAKS the
// courtroom immediately and he walks out still holding it, on his own clock —
// the same split Hakari's Jackpot uses. domains.js hands this manager over to
// its carry slot rather than disposing it; see _clearSentencing there.
//
// Once he holds the sword, everything below this line is unchanged: it sets up
// ONE execution attempt, and that attempt decides everything.
//
// THREE ENDINGS, and all three are implemented explicitly below:
//
//   1  HE LANDS EXECUTION AND WINS THE DUEL  -> instant KO regardless of the
//      opponent's remaining health, routed through the shared INSTANT_KO
//      category (combat/instantko.js) so Jackpot's RCT cannot heal out of it
//      and Mahoraga's adaptation gets its resist roll. Full cinematic: the
//      blade falls, hard cut to black, gavel, round over.  -> _win / _tickKill
//
//   2  HE LANDS EXECUTION AND LOSES THE DUEL -> no kill. The opponent breaks
//      free and kicks him away for modest damage and heavy knockback, and THE
//      DOMAIN ENDS IMMEDIATELY — barrier down, sword gone, full backlash, no
//      second attempt. He has spent his entire ultimate on a shove.  -> _escape
//
//   3  HE NEVER LANDS EXECUTION -> the timer expires, or the barrier is
//      broken, or someone clashes it out. Same result every time: barrier
//      down, sword gone, full backlash, nothing gained. Surviving the domain
//      is a legitimate way for the opponent to win it.  -> dispose(), driven
//      by the standard collapse path in domains.js. Nothing special is needed
//      here BECAUSE nothing was ever applied to the opponent.
//
// ONE ATTEMPT PER DOMAIN. `spent` is set the moment Execution CONNECTS, not
// when it is thrown — whiffing it costs him nothing but time, and time is the
// domain. Once it connects the duel resolves and the domain is over either
// way.
import { v3, rand, yawBetween } from '../../core/math.js';
import { commitInstantKO, finishInstantKO } from './instantko.js';
import { gainEvidence } from './judgeman.js';
import { SPECIAL } from './balance.js';

// The four face-button prompts, and the input-frame edge each one reads.
// B is the one that needed a keyboard binding adding (input.js) — the pad has
// had it all along as the cancel button.
export const DUEL_BUTTONS = [
  { key: 'X', edge: 'punchP', color: 0x5fd0ff },
  { key: 'Y', edge: 'heavyP', color: 0xffd84f },
  { key: 'B', edge: 'backP', color: 0xff5f4f },
  { key: 'A', edge: 'jumpP', color: 0x6fe89a }
];
// what the opponent mashes. X, because it is the button every controller and
// every keyboard layout in this game has under a comfortable finger.
export const MASH = DUEL_BUTTONS[0];

// THE THREE PLEAS. Same three face buttons the duel uses, minus A — a plea is
// a choice between three positions, and the fourth button would only dilute
// the read. CONFESS is first because it is the one that ends the trial early.
export const PLEAS = [
  { key: 'X', edge: 'punchP', label: 'CONFESS', jp: '自白', color: 0x6fe89a },
  { key: 'Y', edge: 'heavyP', label: 'SILENCE', jp: '黙秘', color: 0xffd84f },
  { key: 'B', edge: 'backP', label: 'DENIAL', jp: '否認', color: 0xff5f4f }
];
const CONFESS = PLEAS[0];

export class Sentencing {
  constructor(match, caster, def) {
    this.match = match;
    this.caster = caster;
    this.def = def;                 // cfg.domain.sentencing
    this.spent = false;             // the one attempt has been used
    this.duel = null;
    this.kill = null;
    this.escapeT = 0;
    this.requestCollapse = false;

    // ---- trial state --------------------------------------------------------
    this.mode = 'trial';            // 'trial' inside the barrier, 'carry' after
    this.correct = 0;               // correct reads so far
    this.round = null;              // the plea round in flight
    this.swordEarned = false;       // set the moment the blade is won
    this.carryT = 0;                // seconds of sword left once outside
    this.gapT = 0;
    // NO SWORD ON CAST. It is the prize, not the entry fee.
    this._startRound();
    match.hud.toast(caster, '開廷 — THE COURT IS IN SESSION');
  }

  // ---- THE TRIAL ----------------------------------------------------------
  get defendant() {
    const v = this.match.other(this.caster);
    return v && v.alive ? v : null;
  }

  _startRound() {
    const tr = this.def.trial;
    const v = this.defendant;
    if (!v) return;
    this.round = {
      phase: 'choose', t: 0,
      limit: tr.chooseTime,
      plea: null, guess: null,
      // A bot does not sit on the buzzer: each side gets its own think time so
      // the reveal does not always land exactly on the timeout.
      autoPlea: rand(tr.cpuThinkMin ?? 0.6, tr.cpuThinkMax ?? 1.8),
      autoGuess: rand(tr.cpuThinkMin ?? 0.6, tr.cpuThinkMax ?? 1.8),
      result: null
    };
    this.match.sfx.trialCall?.();
    this.match.hud.message('ENTER YOUR PLEA', 0.9);
  }

  // Both parties are held for the plea. Without this the trial is unplayable:
  // X / Y / B are punch / heavy / back, so an unfrozen fighter cannot press a
  // plea without also throwing a move.
  _holdCourt(v) {
    const c = this.caster;
    for (const f of [c, v]) {
      if (!f) continue;
      f.vel.set(0, 0, 0);
      f.activeHit = null;
      f.move = null;
    }
    if (c.state !== 'executing') c.setState('executing', { clip: 'idle' });
    if (v && v.alive && v.state !== 'sentenced') v.setState('sentenced', { clip: 'idle' });
  }

  _tickTrial(dt, inputs) {
    const m = this.match;
    const tr = this.def.trial;

    if (this.gapT > 0) {
      this.gapT -= dt;
      this._holdCourt(this.defendant);
      if (this.gapT <= 0 && !this.swordEarned) this._startRound();
      return;
    }
    const r = this.round;
    if (!r) { this._startRound(); return; }
    const v = this.defendant;
    if (!v) return;                       // nobody left to try
    this._holdCourt(v);
    r.t += dt;

    if (r.phase === 'choose') {
      const ci = inputs.get(this.caster);
      const vi = inputs.get(v);
      for (const p of PLEAS) {
        if (!r.guess && ci && ci[p.edge]) { r.guess = p; m.sfx.duelHit?.(1); }
        if (!r.plea && vi && vi[p.edge]) { r.plea = p; m.sfx.duelHit?.(1); }
      }
      // whoever has not locked in by their think time (a bot) or by the
      // timeout (a player who sat on it) has one chosen for them
      if (!r.plea && (r.t >= r.autoPlea || r.t >= r.limit)) r.plea = PLEAS[(Math.random() * 3) | 0];
      if (!r.guess && r.t >= Math.max(r.autoGuess, r.limit)) r.guess = PLEAS[(Math.random() * 3) | 0];
      if (r.plea && r.guess) this._reveal();
      return;
    }

    if (r.phase === 'reveal' && r.t >= (tr.revealTime ?? 1.5)) {
      this.round = null;
      if (!this.swordEarned) this.gapT = tr.gap ?? 0.5;
    }
  }

  _reveal() {
    const m = this.match;
    const r = this.round;
    r.phase = 'reveal';
    r.t = 0;
    const hit = r.guess.key === r.plea.key;
    r.result = hit ? 'read' : 'missed';
    m.stage.flash(hit ? 0.3 : 0.12);
    m.cam.shake(hit ? 0.3 : 0.1);

    if (!hit) {
      m.hud.message('THE COURT IS NOT SATISFIED', 1.2);
      m.hud.toast(this.caster, 'MISREAD — ' + r.plea.label);
      m.sfx.duelWrong?.();
      return;
    }

    this.correct++;
    m.sfx.duelWin?.();
    // A correct read restarts the trial clock AND repairs the barrier: as long
    // as he keeps reading them, the courtroom does not close.
    const a = m.domains.state;
    if (a && a.caster === this.caster) {
      a.timer = a.def.duration;
      a.integrity = 100;
      m.hud.toast(this.caster, 'SUSTAINED — COURT EXTENDED');
    }

    // A CONFESSION ENDS THE TRIAL. No further reads are needed.
    if (r.plea.key === CONFESS.key) {
      m.hud.message('CONFESSION — ' + r.plea.jp, 1.6);
      this._earnSword('CONFESSION');
      return;
    }
    const need = this.def.trial.needed ?? 3;
    m.hud.message(`READ ${this.correct}/${need} — ${r.plea.label}`, 1.3);
    if (this.correct >= need) this._earnSword('THE VERDICT IS READ');
  }

  // THE BLADE IS WON. It is not barrier-scoped: the courtroom breaks here and
  // he keeps the sword outside it (domains._clearSentencing hands this manager
  // to its carry slot rather than disposing it).
  _earnSword(why) {
    const m = this.match;
    this.swordEarned = true;
    this.round = null;
    this.gapT = 0;
    this.grantSword();
    m.hud.cutin(this.caster, why, '死刑執行の剣 — THE SWORD IS DRAWN');
    m.stage.flash(0.6);
    m.cam.shake(0.7);
    m.hitstop(18);
    // and the barrier comes down with it
    this.requestCollapse = true;
  }

  // domains.js calls this when it hands the manager out of the collapsing
  // barrier. From here the sword runs on its own clock in the open arena.
  beginCarry() {
    this.mode = 'carry';
    this.round = null;
    this.gapT = 0;
    this.carryT = this.def.carry?.duration ?? 30;
    // CONSUME THE FLAG THAT GOT US HERE. `_earnSword` raises `requestCollapse`
    // to bring the courtroom down, and that collapse is what called us — it is
    // already spent. Out on the carry clock the flag means "the one execution
    // attempt is over, tear this down" (see domains._tickSwordCarry), so
    // leaving it raised disposes the manager on the very next tick and takes
    // the blade off him in the same frame he won it.
    this.requestCollapse = false;
    // RELEASE THE COURT. The trial parks the defendant in `sentenced` and
    // Higuruma in `executing` on EVERY tick (see _holdCourt), and neither state
    // runs any FSM logic — a body left in one is frozen until something else
    // moves it. `dispose()` is what normally does that, and this is precisely
    // the path where dispose is NOT called: winning the trial hands this
    // manager to the carry slot instead of tearing it down, so the release has
    // to happen here or the opponent spends the rest of the round unable to
    // act. That was the bug.
    this._releaseHeld();
    this.match.hud.toast(this.caster, 'THE SENTENCE STANDS');
  }

  // Put anyone this manager is holding back into a state the FSM will drive.
  // Shared by beginCarry and dispose so the two teardown paths cannot drift.
  //
  // The exception is the body the sentence was carried out on. It is
  // mid-`executed` — the one clip authored for exactly this death — and
  // snapping it to the generic `ko` clip would make it stand back up and fall
  // over again. Park the STATE without touching the animation, so the FSM and
  // the match's KO flow both see a knocked-out fighter while the shot plays out.
  _releaseHeld() {
    for (const f of this.match.fighters) {
      if (f.state !== 'sentenced' && f.state !== 'executing') continue;
      if (f.instantKO) { f.state = 'ko'; f.f = 0; continue; }
      f.setState(f.alive ? 'idle' : 'ko', { clip: f.alive ? 'idle' : 'ko' });
    }
  }

  // The grade to go back to when the execution shot ends. Inside the barrier
  // that is the courtroom; out in the arena on the carry clock there is no
  // courtroom to return to and the map's own grade is correct. The first pass
  // hard-coded 'courtroom' and left the arena tinted like a courtroom for the
  // rest of the round after a duel lost outside the barrier.
  _restoreGrade() {
    const m = this.match;
    if (this.mode === 'trial') { m.stage.setGrade('courtroom'); return; }
    m.stage.setGrade(m.mapGrade || 'neutral');
    if (m.gamble?.jackpotFighter) m.stage.setGrade('jackpot');
  }

  trialState() {
    if (this.mode !== 'trial') return null;
    const r = this.round;
    const need = this.def.trial.needed ?? 3;
    return {
      caster: this.caster, defendant: this.defendant,
      correct: this.correct, need,
      pleas: PLEAS.map(p => ({ key: p.key, label: p.label, jp: p.jp, color: p.color })),
      phase: r ? r.phase : 'gap',
      t: r ? r.t : 0, limit: r ? r.limit : 0,
      guessed: !!r?.guess, pleaded: !!r?.plea,
      // only revealed once both are locked — this is a simultaneous read
      guess: r?.phase === 'reveal' ? r.guess.key : null,
      plea: r?.phase === 'reveal' ? r.plea.key : null,
      result: r?.result ?? null
    };
  }

  // ---- THE EXECUTIONER'S SWORD --------------------------------------------
  // The only thing the domain does on cast. His entire moveset is replaced by
  // two buttons for as long as he holds it (see fighter._stateLogic), and it
  // does not survive the barrier by one frame.
  grantSword() {
    const m = this.match, c = this.caster;
    c.execSword = true;
    c._swordOnlyToast = false;   // the "two buttons" line is once per courtroom
    c.setState('special', { clip: 'swordDraw' });
    c.swordDrawT = this.def.materializeFrames ?? 26;
    m.hud.toast(c, '死刑執行の剣 — EXECUTIONER\'S SWORD');
    m.sfx.swordMaterialize?.();
    m.cam.shake(0.25);
    m.stage.flash(0.22);
    // the blade writing itself into his hand: a vertical column of pale
    // cursed energy that collapses inward onto the grip
    const at = c.pos.clone().addScaledVector(c.forward(), 0.4).setY(1.0);
    for (let i = 0; i < 34; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0.6, 1.9);
      m.fx._spawn(at.clone().add(v3(Math.cos(a) * r, rand(-0.8, 1.9), Math.sin(a) * r)), {
        color: i % 3 === 0 ? 0xf2f6ff : 0xd8c78a, size: rand(0.10, 0.30), life: rand(0.28, 0.55),
        vel: v3(-Math.cos(a) * r * 4, rand(-1, 1), -Math.sin(a) * r * 4)
      });
    }
    m.fx._ring(at.clone(), 0xd8c78a, { size: 0.4, growRate: 9, life: 0.4, flat: false });
    m.fx._ring(c.pos.clone().setY(0.06), 0xd8c78a, { size: 0.6, growRate: 11, life: 0.5 });
  }

  // ---- state the rest of the systems ask about ----------------------------
  get duelActive() { return !!this.duel; }
  // while this is true the barrier holds no matter what the timer says: a
  // sentence already being carried out is not interrupted by a clock
  get holding() { return !!this.kill; }
  // while this is true nobody may act — not the two in the duel, and not a
  // third party in a free-for-all. The trial freezes for the same reason the
  // duel does: the plea buttons ARE the attack buttons.
  get freezing() {
    return !!this.duel || !!this.kill || this.escapeT > 0
      || (this.mode === 'trial' && (!!this.round || this.gapT > 0));
  }

  // ---- EXECUTION CONNECTED ------------------------------------------------
  // Called from the effect dispatcher when the thrust actually lands. THIS is
  // the commitment point — not the button press.
  executionConnect(victim) {
    if (this.spent || this.duel || this.kill || !victim || !victim.alive) return false;
    const m = this.match, c = this.caster;
    this.spent = true;

    // stage the shot: the victim driven to their knees directly in front of
    // him, both bodies square to each other
    const dir = v3(victim.pos.x - c.pos.x, 0, victim.pos.z - c.pos.z);
    if (dir.lengthSq() < 1e-4) dir.copy(c.forward());
    dir.normalize();
    // an oversized victim needs more room — see `_victimScale`
    const scale = this._victimScale(victim);
    victim.pos.copy(c.pos).addScaledVector(dir, 1.15 * scale);
    victim.pos.y = c.pos.y;
    victim.prevPos.copy(victim.pos);
    victim.vel.set(0, 0, 0);
    victim.grounded = true;
    c.facing = yawBetween(c.pos, victim.pos);
    victim.facing = yawBetween(victim.pos, c.pos);
    c.prevFacing = c.facing;
    victim.prevFacing = victim.facing;

    this._freeze(victim);
    c.setState('executing', { clip: 'execHold' });
    victim.setState('sentenced', { clip: 'sentenced' });

    // ---- build the sequence ------------------------------------------------
    // EVIDENCE buys length. seqMax prompts at zero, seqMin at full, linear
    // between — and it is announced, because the opponent deserves to see how
    // much trouble they are in before they start mashing.
    const d = this.def.duel;
    const ev = Math.min(1, (c.evidence ?? 0) / (c.cfg.special?.judgeman?.max ?? 100));
    const len = Math.max(d.seqMin, Math.round(d.seqMax - (d.seqMax - d.seqMin) * ev));
    const seq = [];
    for (let i = 0; i < len; i++) {
      let b;
      do { b = DUEL_BUTTONS[(Math.random() * DUEL_BUTTONS.length) | 0]; }
      while (seq.length && b.key === seq[seq.length - 1].key);
      seq.push(b);
    }
    this.duel = {
      phase: 'freeze', t: 0, seq, idx: 0,
      timer: d.timer, timerMax: d.timer,
      victim, mashes: 0, mashBudget: d.mashCapPerSec * 0.5,
      wrongT: 0, wrongs: 0, evidence: Math.round(ev * 100), scale
    };

    // ---- presentation ------------------------------------------------------
    // Framing: far enough back that a kneeling body and a raised blade both
    // fit in the shot. The first pass sat at 3.1 m and cropped the condemned
    // off the bottom of the frame — which is the one thing this shot cannot do.
    const mid = c.pos.clone().lerp(victim.pos, 0.5).setY(1.05 * scale);
    m.cam.cinematic(mid, 30, 4.6 * scale, 1.25 * scale);
    m.stage.setGrade('sentence');
    m.hud.cutin(c, 'EXECUTION', '死刑執行 — THE SENTENCE');
    m.sfx.executionSeize?.();
    m.sfx.startClock?.();
    m.music?.duck(0.06, 12);
    m.hitstop(16);
    m.stage.flash(0.4);
    m.cam.shake(0.5);
    return true;
  }

  // A body twice everyone else's height cannot be framed, reached or knelt on
  // the same way a human one can. Mahoraga is 3.6 m against the roster's
  // 1.75-2.0, so the whole beat is scaled off his hurt capsule rather than
  // assuming a human-scale victim: he is staged further out, the camera pulls
  // back and rises, and the blade comes down across his chest instead of over
  // a head that is above Higuruma's reach. The clips retarget over the shared
  // skeleton for free, so nothing else needs a special case.
  _victimScale(victim) {
    const h = victim.cfg.size?.hurtCenter ?? 1.05;
    return Math.max(1, h / 1.05);
  }

  _freeze(victim) {
    for (const f of [this.caster, victim]) {
      f.vel.set(0, 0, 0);
      f.activeHit = null;
      f.move = null;
      f.iFrames = Math.max(f.iFrames, 4);
    }
  }

  // ---- per-tick -----------------------------------------------------------
  update(dt, inputs) {
    const c = this.caster;
    if (c.swordDrawT > 0) c.swordDrawT--;
    if (this.kill) { this._tickKill(dt); return; }
    if (this.escapeT > 0) {
      this.escapeT -= dt;
      if (this.escapeT <= 0) this.requestCollapse = true;
      return;
    }
    if (this.duel) { this._tickDuel(dt, inputs); return; }
    // still in the courtroom and the blade has not been won: run the trial
    if (this.mode === 'trial' && !this.swordEarned) { this._tickTrial(dt, inputs); return; }
    // out in the arena with the sword, on its own clock
    if (this.mode === 'carry') {
      if (!c.alive) { this.expired = true; return; }
      this.carryT -= dt;
      if (this.carryT <= 0) this.expired = true;
    }
  }

  _tickDuel(dt, inputs) {
    const m = this.match;
    const d = this.duel;
    const cfg = this.def.duel;
    const c = this.caster, v = d.victim;
    d.t += dt;
    this._freeze(v);
    // the two of them stay locked in the pose for the whole contest
    if (c.state !== 'executing') c.setState('executing', { clip: 'execHold' });
    if (v.state !== 'sentenced' && v.alive) v.setState('sentenced', { clip: 'sentenced' });

    if (d.phase === 'freeze') {
      // the beat before the prompts appear: the blade goes up, the room goes
      // quiet, and both players get a moment to see what is about to happen
      if (d.t >= (cfg.freezeIn ?? 0.55)) { d.phase = 'active'; d.t = 0; }
      return;
    }

    if (d.wrongT > 0) d.wrongT -= dt;

    // ---- THE OPPONENT'S SIDE ------------------------------------------------
    // They are not a spectator. Every press shaves real time off his window.
    // Budgeted per second so a turbo controller cannot simply delete the
    // clock — a human mashing hard reaches the cap, a macro gains nothing.
    d.mashBudget = Math.min(3, d.mashBudget + (cfg.mashCapPerSec ?? 12) * dt);
    const vi = inputs.get(v);
    if (vi && vi[MASH.edge] && d.mashBudget >= 1) {
      d.mashBudget -= 1;
      d.mashes++;
      d.timer -= cfg.mashDrain ?? 0.085;
      m.sfx.duelMash?.();
    }

    // ---- HIGURUMA'S SIDE ----------------------------------------------------
    // The displayed order, without a wrong press, before the timer expires. A
    // wrong button is NOT an instant loss — it costs time. Speed and accuracy
    // win, and panic loses.
    const ci = inputs.get(c);
    if (ci) {
      for (const b of DUEL_BUTTONS) {
        if (!ci[b.edge]) continue;
        if (b.key === d.seq[d.idx].key) {
          d.idx++;
          m.sfx.duelHit?.(d.idx);
          m.fx._ring(c.pos.clone().add(v3(0, 1.6, 0)), 0xd8c78a,
            { size: 0.25, growRate: 6, life: 0.2, flat: false });
          if (d.idx >= d.seq.length) { this._win(); return; }
        } else {
          d.wrongT = 0.22;
          d.wrongs++;
          d.timer -= cfg.wrongPenalty ?? 0.5;
          m.sfx.duelWrong?.();
        }
        break;   // one press per tick, so a two-button mash cannot skip ahead
      }
    }

    // the clock
    d.timer -= dt;
    if (d.timer <= 0) { d.timer = 0; this._escape(false); }
  }

  // ---- ENDING 1 -----------------------------------------------------------
  _win() {
    const m = this.match, d = this.duel, v = d.victim;
    // The shared instant-KO gate. A refusal here (Mahoraga's adaptation rolling
    // a resist) does NOT hand Higuruma a second try — it becomes Ending 2,
    // which is the honest reading: the sentence did not take and the condemned
    // gets off the floor.
    const verdict = commitInstantKO(v, { kind: 'execution' });
    if (!verdict.ok) {
      m.hud.message(verdict.label, 1.6);
      m.hud.toast(v, verdict.label);
      this._escape(true);
      return;
    }
    this.duel = null;
    m.sfx.stopClock?.();
    this.kill = { t: 0, victim: v, stage: 0, scale: d.scale };
    m.hud.message('SENTENCE: DEATH', 1.4);
    m.sfx.duelWin?.();
    m.cam.cinematic(this.caster.pos.clone().lerp(v.pos, 0.5).setY(1.05 * d.scale),
      4, 3.6 * d.scale, 1.15 * d.scale);
  }

  _tickKill(dt) {
    const m = this.match;
    const k = this.kill;
    const c = this.def.cinematic;
    const v = k.victim;
    k.t += dt;
    // nothing touches the condemned or the executioner while this plays
    v.iFrames = Math.max(v.iFrames, 4);
    v.vel.set(0, 0, 0);
    this.caster.vel.set(0, 0, 0);

    if (k.stage === 0 && k.t >= c.raise) {
      // the blade comes down
      k.stage = 1;
      this.caster.setState('executing', { clip: 'execFall' });
      this.caster.anim.play('execFall', { fade: 0.04, restart: true });
      m.sfx.swordFall?.();
    } else if (k.stage === 1 && k.t >= c.raise + c.fall) {
      // IT LANDS. Hard cut to black, gavel, and that is the round.
      k.stage = 2;
      v.setState('sentenced', { clip: 'executed' });
      v.anim.play('executed', { fade: 0.02, restart: true });
      m.hud.blackout(c.black);
      m.stage.flash(0.9);
      m.cam.shake(1.0);
      m.hitstop(24);
      m.sfx.gavelFinal?.();
      m.fx._ring(v.pos.clone().setY(0.06), 0xd8c78a, { size: 0.8, growRate: 20, life: 0.7 });
      for (let i = 0; i < 26; i++) {
        const a = rand(0, Math.PI * 2);
        m.fx._spawn(v.pos.clone().add(v3(0, 1.0 * k.scale, 0)), {
          color: i % 4 === 0 ? 0xf2f6ff : 0xd8c78a, size: rand(0.12, 0.34), life: rand(0.3, 0.7),
          vel: v3(Math.cos(a) * rand(3, 9), rand(0, 5), Math.sin(a) * rand(3, 9)), gravity: 5
        });
      }
    } else if (k.stage === 2 && k.t >= c.raise + c.fall + c.gavel) {
      // the sentence is carried out. hp goes to zero HERE, at the end of the
      // shot, so the match's KO flow takes over on a frame that reads.
      k.stage = 3;
      finishInstantKO(v, { kind: 'execution', by: this.caster });
      m.hud.message('EXECUTED', 1.8);
      this.kill = null;
      // the shot is over — release the camera and the grade rather than
      // leaving the tail of the 4-second sweep running into the KO flow
      m.cam.endCinematic();
      this._restoreGrade();
      this.requestCollapse = true;
    }
  }

  // ---- ENDING 2 -----------------------------------------------------------
  // He landed it and lost anyway. No kill, a shove, and the courtroom folds on
  // the spot. `resisted` distinguishes an adaptation save from a won mash so
  // the callout can tell the truth about which one happened.
  _escape(resisted) {
    const m = this.match;
    const d = this.duel;
    const v = d.victim;
    const c = this.caster;
    const esc = this.def.escape;
    this.duel = null;
    m.sfx.stopClock?.();

    // HALF THE CASE GOES WITH IT. Domains are re-castable, so without this a
    // lost duel would cost him almost nothing: the courtroom closes, his
    // evidence is untouched, and the discounted cast gate has him back inside
    // within a single bar. Losing the execution now genuinely sets him back —
    // but only halfway, so the second trial still arrives sooner than the
    // first did. Declared on his config (`evidence.lostDuelKeep`) so the rule
    // is data rather than a number buried in a cinematic.
    if (c.cfg.evidence) {
      const keep = c.cfg.evidence.lostDuelKeep ?? 1;
      if (keep < 1) {
        const before = c.evidence ?? 0;
        gainEvidence(c, -(before * (1 - keep)));
        m.hud.toast(c, 'CASE WEAKENED — ' + Math.round(c.evidence) + '%');
      }
    }

    v.setState('sentenced', { clip: 'execEscape' });
    v.anim.play('execEscape', { fade: 0.05, restart: true });
    c.setState('executing', { clip: 'execRecoil' });
    c.anim.play('execRecoil', { fade: 0.05, restart: true });

    // THE KICK. Modest damage, heavy knockback, nothing more. Which body it
    // moves is a config flag: written as specified (the opponent is kicked
    // away), one word from the other reading.
    const pushCaster = !!esc.kickPushesCaster;
    const target = pushCaster ? c : v;
    const dir = pushCaster
      ? v3(c.pos.x - v.pos.x, 0, c.pos.z - v.pos.z).normalize()
      : v3(v.pos.x - c.pos.x, 0, v.pos.z - c.pos.z).normalize();
    if (dir.lengthSq() < 1e-4) dir.copy(c.forward());
    // GLOBAL BALANCE. This is one of only two damage sites in the game that
    // write a health bar directly instead of going through `applyHit`, so the
    // scalar has to be applied by hand — see combat/balance.js.
    target.res.hp -= esc.dmg * SPECIAL;
    target.vel.set(dir.x * esc.kb, esc.kbY, dir.z * esc.kb);
    target.grounded = false;
    target.iFrames = Math.max(target.iFrames, 20);

    m.hud.message(resisted ? 'THE SENTENCE DOES NOT TAKE' : 'BROKEN FREE', 1.6);
    m.hud.toast(c, 'EXECUTION FAILED');
    m.sfx.duelLose?.();
    m.cam.shake(0.8);
    m.cam.fovKick(8);
    m.stage.flash(0.35);
    m.hitstop(18);
    // CLOSE THE SHOT. `executionConnect` books a 30-second cinematic because
    // the duel's clock is interactive and it has to cover the worst case; a
    // duel that resolves in five leaves 25 seconds of camera orbiting a fight
    // that has restarted, with the player alive and taking input the whole
    // time. The win path happened to hide this by booking a shorter shot over
    // the top of it — this path did not, and that was the "stuck camera".
    m.cam.endCinematic();
    this._restoreGrade();

    // THE DOMAIN ENDS IMMEDIATELY. A short beat so the kick is legible, then
    // the barrier comes down with the standard backlash — no second attempt.
    this.escapeT = 0.42;
  }

  // ---- HUD ----------------------------------------------------------------
  hudState() {
    const d = this.duel;
    if (!d) return null;
    return {
      phase: d.phase,
      seq: d.seq.map(b => b.key),
      colors: d.seq.map(b => b.color),
      idx: d.idx,
      timer: Math.max(0, d.timer), timerMax: d.timerMax,
      wrong: d.wrongT > 0,
      mash: MASH.key,
      mashes: d.mashes,
      evidence: d.evidence,
      caster: this.caster, victim: d.victim
    };
  }

  // ---- ENDING 3 (and the teardown for 1 and 2) ----------------------------
  // Whatever brought this to an end — the trial running out of clock, a break,
  // a clash, a dismissal, one of the two duel resolutions, or the carry timer
  // expiring out in the arena — the sword goes with it.
  dispose() {
    const m = this.match, c = this.caster;
    if (c.execSword) {
      c.execSword = false;
      c.swordDrawT = 0;
      const at = c.pos.clone().addScaledVector(c.forward(), 0.5).setY(1.1);
      for (let i = 0; i < 16; i++) {
        m.fx._spawn(at, {
          color: i % 3 === 0 ? 0xf2f6ff : 0xd8c78a, size: rand(0.08, 0.22), life: rand(0.25, 0.5),
          vel: v3(rand(-3, 3), rand(0, 4), rand(-3, 3)), gravity: 4
        });
      }
      m.sfx.swordShatter?.();
    }
    // Release anyone this held: the duel states run no logic, so a body left
    // in one would be frozen forever.
    this._releaseHeld();
    // and never leave a held cinematic running past the manager that booked it
    if (this.duel || this.kill) { m.sfx.stopClock?.(); m.cam.endCinematic(); }
    this.duel = null;
    this.kill = null;
    this.escapeT = 0;
    this.round = null;
    this.gapT = 0;
    this.expired = true;
  }
}
