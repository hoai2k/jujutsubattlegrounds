// CPU opponent: approach, punch strings, block reactions, occasional CT,
// ultimate/domain when charged, panic counters when trapped in a domain.
import { emptyFrame } from '../input/input.js';
import { rand, flatDist, yawBetween } from '../core/mathutil.js';
import { tauntWeight } from './taunts.js';
// Cursed speech, for the one profile that has to decide what a button IS
// before it decides whether to press it. Both helpers are pure reads.
import { affordable as speechAffordable, boundKey as speechBoundKey } from './speech.js';
// The three new profiles each ask their own system exactly one question. Every
// one of these is a pure read and returns a sensible default for a fighter
// whose config does not declare the resource.
import { awakenAggression } from './awakening.js';
import { massReady, massFrac } from './mass.js';
// URO's reflect table. The CPU consults the SAME source of truth the effect
// system does, so a bot can never put the surface up for something that would
// not have been reflected.
import { REFLECTABLE } from './reflect.js';

export class CPU {
  constructor(fighter, opponent, match) {
    this.me = fighter;
    this.foe = opponent;
    this.match = match;
    this.thinkT = 0;
    this.plan = 'approach';
    this.planT = 0;
    this.punchT = 0;
    this.blockT = 0;
    this.prev = emptyFrame();
    // personality: how often this character shows off (see _wantsTaunt)
    this._tauntWeight = tauntWeight(fighter.pick || fighter.cfg.id);
    this._tauntGrace = 6;        // never in the opening seconds of a round
    this._tauntRoll = 2;
    this._cmdSwap = null;        // inumaki: the command wheel, held across frames
  }

  // ---- INUMAKI: THE THROAT BUDGET ----------------------------------------
  // The single line that separates a bot that plays this character from a bot
  // that says two words and then spends ninety seconds silent.
  //
  // The rule: a command is only worth saying if, AFTER saying it, he could
  // still afford his cheapest word. That is exactly the calculation a human
  // makes — "if I spend Blast Away here, am I mute?" — and it means the bot
  // naturally paces itself into the speak / disengage / recover rhythm the
  // character is built around, without a single timer anywhere.
  //
  // The one exception is being about to lose: below a quarter health it stops
  // budgeting and says whatever it can, because a silent Inumaki at 20 health
  // is a dead one either way.
  //   RESERVE is the second half, and it is what the first version got wrong.
  //   Budgeting only against the CHEAPEST word made the bot spam DON'T MOVE
  //   forever: measured over sixty seconds it said it twenty-seven times and
  //   said GET CRUSHED twice, and sat pinned at RAW the whole match. It was
  //   technically managing the gauge and it was playing one button.
  //
  //   So an OPENER has to leave room for the word it is opening FOR. Pass the
  //   heavy binding's cost as `reserve` and a cheap command is only thrown
  //   when the payoff still fits behind it — which produces the intended
  //   rhythm on its own: open, follow up, disengage, breathe.
  _throatBudget(me, cmd, reserve = 0) {
    if (!cmd) return false;
    if (me.res.hp < me.cfg.stats.hp * 0.25) return true;
    const defs = me.cfg.commands.defs;
    const cheapest = Math.min(...Object.values(defs).map(d => d.throat));
    const cap = me.cfg.throat.max * 0.90;         // the SILENCED threshold
    return me.throat + cmd.throat + Math.max(cheapest, reserve) <= cap;
  }

  // A seat's fighter was replaced mid-round (Megumi -> Mahoraga, and back
  // between rounds). Re-point at whoever now occupies seat 1 and seat 0 and
  // drop any plan that was about the body that just left.
  retarget(match) {
    this.me = match.fighters[1] || this.me;
    this.foe = match.fighters[0] || this.foe;
    this.plan = 'approach';
    this.planT = 0;
    this.me.aimOverride = null;
    // the body changed, so the personality did too — Megumi and Mahoraga do
    // not show off at the same rate, and the seat can swap mid-round
    this._tauntWeight = tauntWeight(this.me.pick || this.me.cfg.id);
    this._tauntGrace = 4;
  }

  frame() {
    const f = emptyFrame();
    const me = this.me;
    // in a free-for-all the bot fights whoever is closest right now
    const foe = this.foe = this.match.other(me) || this.foe;
    const dt = 1 / 60;
    this.thinkT -= dt;
    this.planT -= dt;
    this.punchT -= dt;
    this.blockT -= dt;
    // THE TAUNT CLOCKS RUN ON WALL TIME, HERE, not inside `_wantsTaunt`.
    // `_wantsTaunt` is the very last thing `frame()` does and there are eight
    // `return f` shortcuts above it, so a clock that only ticked when the gate
    // was reached ticked on a few hundred frames out of seven thousand — the
    // dice were rolled about three times in two minutes and the bot never
    // taunted once. Out here they mean seconds, which is what they are named.
    this._tauntGrace -= dt;
    this._tauntRoll -= dt;
    const dist = flatDist(me.pos, foe.pos);
    const dState = this.match.domains.state;
    // cleared every frame: an override left set would pin the soft lock to a
    // summon that has since died
    me.aimOverride = null;
    this.summonSwingT = (this.summonSwingT ?? 0) - dt;

    // ---- tech the knockdown: jump as the floor arrives ----------------------
    // Same window the player gets, hit about two thirds of the time — it can be
    // out-mixed, but you can no longer treat every launch as a free wake-up.
    if ((me.state === 'launched' && me.vel.y <= 0 && me.pos.y <= 0.8)
      || (me.state === 'knockdown' && me.f <= 6)) {
      if (!me.techLock && (this.techRoll ??= Math.random()) < 0.65) f.jump = true;
    } else if (me.state !== 'techRise') {
      this.techRoll = null; // re-roll for the next knockdown
    }

    // ---- THE EXECUTION DUEL --------------------------------------------------
    // Both sides of it, because the bot can be on either. It plays at a fixed,
    // deliberately human rate: correct inputs on a ~0.34 s rhythm with a 12%
    // chance of fumbling one, and mashing at ~6.5 presses a second when it is
    // the one on the block. Those numbers are in the character config
    // (domain.sentencing.duel) so the duel and the bot cannot drift apart.
    // ---- THE TRIAL: enter a plea, or call the read --------------------------
    // Both sides again, because the bot can be either the defendant entering a
    // plea or Higuruma calling it. It picks blind, which is the honest bot
    // answer to a simultaneous read — there is nothing to react to. If it never
    // presses, sentencing.js enters one for it on the think timer anyway.
    const trial = this.match.domains.trialState;
    if (trial) {
      if (trial.phase === 'choose') {
        const side = trial.caster === me ? 'guess' : trial.defendant === me ? 'plea' : null;
        const locked = side === 'guess' ? trial.guessed : trial.pleaded;
        if (side && !locked) {
          this._trialT = (this._trialT ?? 0) - dt;
          if (this._trialT <= 0) {
            this._trialT = 0.3;
            f[['punch', 'heavy', 'back'][(Math.random() * 3) | 0]] = true;
          }
        }
      }
      this._edges(f);
      return f;
    }

    const duel = this.match.domains.duelState;
    if (duel && duel.phase === 'active') {
      const d = me.cfg.domain?.sentencing?.duel
        ?? duel.caster?.cfg?.domain?.sentencing?.duel ?? {};
      this._duelT = (this._duelT ?? 0) - dt;
      if (duel.caster === me) {
        // HIS side: input the displayed sequence
        if (this._duelT <= 0) {
          this._duelT = d.cpuInterval ?? 0.34;
          const want = Math.random() < (d.cpuMiss ?? 0.12)
            ? ['X', 'Y', 'B', 'A'][(Math.random() * 4) | 0]     // a genuine fumble
            : duel.seq[duel.idx];
          if (want === 'X') f.punch = true;
          else if (want === 'Y') f.heavy = true;
          else if (want === 'B') f.back = true;
          else f.jump = true;
        }
      } else if (duel.victim === me) {
        // THEIR side: mash. It is not a spectator either.
        if (this._duelT <= 0) {
          this._duelT = 1 / (d.cpuMash ?? 6.5);
          f.punch = true;
        }
      }
      this._edges(f);
      return f;
    }
    if (duel) { this._edges(f); return f; }   // the freeze beat: nothing to do

    const trapped = dState && dState.phase === 'active' && dState.target === me;

    // ---- trapped in a domain: counters --------------------------------------
    if (trapped) {
      const canClash = me.cfg.domain && me.charged && me.backlash <= 0;
      const proximity = dState.def.sureHit.effect === 'transfigure';
      // ---- MALEVOLENT SHRINE: RUN ------------------------------------------
      // No barrier means no barrier to break, and Simple Domain costs stamina
      // it would rather keep. The correct answer is to leave, so the bot leaves
      // — straight out from the shrine's origin, which is fixed, and it does
      // NOT re-target the caster on the way (he is usually standing between it
      // and nothing useful). Simple Domain is the fallback when it is too deep
      // in to make the edge before the next few ticks land.
      if (dState.def.sureHit.effect === 'malevolent_shrine') {
        const o = dState.shrineOrigin;
        const dx = me.pos.x - o.x, dz = me.pos.z - o.z;
        const d = Math.hypot(dx, dz) || 1;
        const toGo = (dState.shrineR ?? 0) - d;
        if (toGo <= 0) {
          // out. Fight from here — he has to come to it, and the shrine does
          // not move.
          if (canClash) { f.ult = true; f.ultP = !this.prev.ult; }
          else { f.move.z = 0.3; }
        } else if (toGo > 9 && me.res.stamina < 25) {
          f.block = true;                       // too far to run on an empty tank
        } else {
          // world direction away from the origin -> character-relative stick
          const wx = dx / d, wz = dz / d;
          const sin = Math.sin(me.facing), cos = Math.cos(me.facing);
          f.move.z = -(wx * sin + wz * cos);
          f.move.x = -wx * cos + wz * sin;
          f.dash = me.res.stamina > 12;
        }
        this._edges(f);
        return f;
      }
      if (canClash) { f.ult = true; f.ultP = !this.prev.ult; }
      // Mahito's domain: DISTANCE stops the drain entirely — the bot's first
      // instinct is to sprint away from him and only counter from range
      else if (proximity && dist < dState.def.transfig.midR + 1) {
        f.move.z = 1; // straight away from the caster (soft lock faces him)
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.4;
        f.dash = me.res.stamina > 15;
      }
      else if (me.res.curCE > 25) { f.block = true; f.ult = true; f.ultP = !this.prev.ult; } // barrier break
      else if (me.res.stamina > 20) { f.block = true; }                                      // simple domain
      this._edges(f);
      return f;
    }

    // ---- MY OWN COURTROOM: hunt the execution ------------------------------
    // With the Executioner's Sword he has exactly two buttons, so the profile
    // is exactly two decisions. Judgment Slash is the opener — it launches, and
    // a launched opponent is a landing opponent. Execution is thrown at the
    // range it actually reaches and only when they are in no position to
    // punish 40 frames of recovery: getting up, in hitstun, or coming down.
    if (this.match.domains.isSentencingField(me)) {
      f.move.z = -1;
      f.dash = dist > 4.5 && me.res.stamina > 20;
      const canExec = this.match.domains.canExecute(me);
      const helpless = ['knockdown', 'getup', 'launched', 'hitLight', 'hitHeavy', 'guardBreak'].includes(foe.state)
        || !foe.grounded;
      this._execT = (this._execT ?? 0) - dt;
      if (!me.busy && me.swordDrawT <= 0) {
        // the thrust reaches 2.6 — it is thrown at that range, not inside it,
        // and only into a body that cannot punish the 40 frames it costs
        if (canExec && dist < 2.6 && helpless) { f.ct2 = true; this._execT = 0.8; }
        // otherwise open them up. The slash out-ranges everything they have
        // and it launches, so it is thrown on cooldown from its own range.
        else if (dist < 3.2 && this._execT <= 0) { f.ct1 = true; this._execT = 0.55; }
      }
      this._edges(f);
      return f;
    }

    // ---- my own sword domain: run the pickup loop ---------------------------
    if (this.match.domains.isSwordField(me)) {
      if (me.heldSword) {
        // run them down with the blade, swing in range
        f.move.z = -1;
        f.dash = dist > 3.5 && me.res.stamina > 20;
        if (dist < 2.3 && !me.busy) f.punch = true;
      } else {
        // steer to the nearest embedded katana (world dir -> character-relative)
        const sp = this.match.domains.swords?.nearestPos(me.pos);
        if (sp) {
          const dx = sp.x - me.pos.x, dz = sp.z - me.pos.z;
          const d = Math.hypot(dx, dz) || 1;
          const wx = dx / d, wz = dz / d;
          const sin = Math.sin(me.facing), cos = Math.cos(me.facing);
          f.move.z = -(wx * sin + wz * cos);
          f.move.x = -wx * cos + wz * sin;
          f.dash = d > 3 && me.res.stamina > 25;
        }
      }
      this._edges(f);
      return f;
    }

    // ---- TOJI: THE ARSENAL PROFILE ------------------------------------------
    // He has no bar to spend and no gate to reach, so the CPU's whole plan for
    // him is WHICH TOOL and WHEN, which makes him a genuinely different bot to
    // write. Three decisions, in priority order:
    //
    //   1. ASSASSINATION on a helpless body. It is a cooldown, so it costs
    //      nothing to hold — but a blitz into a guard is a free punish, so it
    //      is only thrown at somebody who cannot answer.
    //   2. SWAP TO THE RIGHT TOOL FOR THE RANGE. Chain far, Cloud mid, fists
    //      and the Katana close — and the SPEAR the moment a domain goes up,
    //      which is the one read the bot must not miss.
    //   3. otherwise fight normally with whatever is in hand.
    //
    // The swap is deliberately NOT free for the bot either: it goes through
    // `trySpecial` and eats the same draw animation a player does, so it can be
    // caught mid-swap exactly as a player can.
    if (me.cfg.arsenal && !me.busy) {
      const u = me.cfg.ultimate;
      const helpless = ['knockdown', 'getup', 'launched', 'hitLight', 'hitHeavy', 'guardBreak'].includes(foe.state);
      // 1. the blitz
      if (me.assassinReady && dist < 9 && dist > 1.6 && (helpless || Math.random() < 0.02)) {
        f.ult = true;
        this._edges(f);
        return f;
      }
      // 2. the tool for the situation
      this._swapT = (this._swapT ?? 0) - dt;
      const dOwn = dState && dState.caster === foe && dState.phase !== 'cast';
      const want = dOwn ? 'inverted_spear'
        : dist > 6.0 ? 'chain'
          : dist > 2.8 ? 'playful_cloud'
            : 'split_soul';
      if (want !== me.weapon && this._swapT <= 0 && me.specialCD <= 0
        // never swap inside their reach unless it is the spear read, which is
        // worth eating a hit for
        && (dOwn || dist > 3.2)) {
        this._swapT = rand(2.2, 4.0);
        f.copy = true;
        me.arsenal = null;                       // opened fresh by trySpecial
        this._pendingWeapon = want;
        this._edges(f);
        return f;
      }
      // hold the wheel one tick, point at the pick, then release
      if (me.state === 'arsenal') {
        const order = me.cfg.arsenal.order;
        me.arsenal.sel = Math.max(0, order.indexOf(this._pendingWeapon ?? me.weapon));
        if (me.arsenal.t > 0.18) { f.copy = false; } else { f.copy = true; }
        this._edges(f);
        return f;
      }
      // 3. NULLIFY is thrown at its real (very short) range, into a domain
      if (dOwn && me.weapon === 'inverted_spear' && me.nullifyCD <= 0 && dist < 1.7) {
        f.ct2 = true;
        this._edges(f);
        return f;
      }
    }

    // ---- SUMMONS ARE TARGETS ------------------------------------------------
    // Megumi's shikigami and Mahito's transfigured humans were previously free
    // pressure against the CPU: it would stand there being bitten while it
    // walked at the summoner. Now it clears them.
    //
    // The soft lock is the reason this needs more than "walk over and punch":
    // facing is pinned to the opponent, so a swing aimed at something 90 degrees
    // off simply misses. `aimOverride` re-points the fighter at whatever it has
    // decided to kill, which is what makes the swing connect.
    const threat = this._pickSummon(me, dist);
    if (threat) {
      const td = flatDist(me.pos, threat.pos);
      me.aimOverride = threat.pos;
      f.move.z = -1;                                  // advance along the new facing
      f.dash = td > 5 && me.res.stamina > 25;
      if (td < 1.9 && !me.busy && this.summonSwingT <= 0) {
        // the heavy is worth it on a tanky summon, the string on a fragile one
        const beefy = (threat.maxHp ?? 20) > 28;
        if (beefy && me.res.stamina > (me.cfg.heavy?.staminaCost ?? 20) + 15 && Math.random() < 0.4) {
          f.heavy = true; this.summonSwingT = rand(0.7, 1.1);
        } else { f.punch = true; this.summonSwingT = rand(0.14, 0.32); }
      }
      this._edges(f);
      return f;
    }

    // ---- Black Flash attempt: B while the window is open ----------
    // ~12%/tick over a 5-frame window ≈ half his windows — sharp, not perfect
    if (me.cfg.special?.key === 'yuji_blackflash' && me.specialCD <= 0
      && me.bfT > 0 && me.bfT <= me.cfg.blackFlash.window && Math.random() < 0.12) {
      f.copy = true;
    }
    // NOBARA — the same attempt on her own confirm button, checked HERE so it
    // runs before her profile's early return and so it can fire out of the
    // strike's own recovery. Same hit rate as Yuji's: sharp, not perfect.
    if (me.cfg.blackFlash?.confirm === 'punch'
      && me.bfT > 0 && me.bfT <= me.cfg.blackFlash.window && Math.random() < 0.12) {
      f.punch = true;
    }

    // ---- HAKARI ---------------------------------------------------------------
    // JACKPOT: recklessly aggressive. Nothing costs anything, nothing is on
    // cooldown and damage is refunded, so there is no reason to respect
    // anything. It charges, it throws the blast the moment there is a lane,
    // and it holds the counter stance when the opponent is committing.
    if (me.inJackpot) {
      f.move.z = -1;
      f.dash = dist > 4 && me.res.stamina > 8;
      if (!me.busy) {
        const r = Math.random();
        if (dist > 7 && r < 0.5) f.ct1 = true;                        // blast down the lane
        else if (dist > 4.5 && r < 0.5) f.copy = true;                // gold rush the gap
        else if (dist < 2.6 && (foe.state === 'attack' || foe.state === 'ct') && r < 0.45) f.ct2 = true; // counter the commit
        else if (dist < 2.2) f.punch = true;                          // flurry
        else if (r < 0.25) f.ct1 = true;
      }
      this._edges(f);
      return f;
    }
    // INSIDE HIS OWN DOMAIN: the plan is not to fight, it is to CYCLE THE
    // MACHINE. Every two techniques is a reach scenario, so it spends CT2
    // (cheap and fast) as often as the meter allows and only punches to
    // rebuild the bar when it cannot afford one. It stays near enough to keep
    // landing them, because a whiffed technique still counts but a dead
    // Hakari does not.
    if (this.match.domains.isMyDomain(me)
      && me.cfg.domain?.sureHit.effect === 'idle_death_gamble') {
      f.move.z = dist > 3.4 ? -1 : dist < 1.6 ? 0.4 : -0.5;
      f.dash = dist > 6 && me.res.stamina > 20;
      if (!me.busy) {
        const c1 = me.cfg.ct1, c2 = me.cfg.ct2;
        // CT2 is a third of the cost and half the recovery: it is simply the
        // faster way to feed the counter, and the counter is the win condition
        if (me.res.curCE >= c2.cost && dist < 6) f.ct2 = true;
        else if (me.res.curCE >= c1.cost && dist < 3.0 && Math.random() < 0.5) f.ct1 = true;
        else if (dist < 2.0) f.punch = true;                          // earn meter back
        else if (foe.state === 'attack' && dist < 2.6 && Math.random() < 0.3) f.block = true;
      }
      this._edges(f);
      return f;
    }

    // ---- SUKUNA -------------------------------------------------------------
    // The profile is PATIENT AT RANGE. It holds space with Dismantle, punishes
    // approaches with Cleave, eats a Finger whenever it has a genuinely safe
    // window, and starts the Fire Arrow charge only when the opponent is
    // already committed to something they cannot cancel.
    if (me.cfg.fingers) {
      const fa = me.cfg.fireArrow;
      const c1 = me.cfg.ct1, c2 = me.cfg.ct2;
      // "committed": in an attack or a technique, on the floor, or in the air.
      // These are the states in which they cannot answer a 78-frame telegraph.
      const committed = ['attack', 'ct', 'knockdown', 'getup', 'launched', 'hitLight', 'hitHeavy', 'guardBreak']
        .includes(foe.state) || !foe.grounded;

      // 1) THE CHARGE. Held across frames, so it is driven by a latch rather
      //    than re-decided every tick — letting go early is what cancels it.
      if (me.state === 'fireStance' || me.state === 'fireCharge') {
        f.ct2 = true;
        // bail out if they got free and are now closing: a charge that is
        // going to be punished is worth cancelling for the frames
        if (me.state === 'fireCharge' && !committed && dist < 4.5) { f.ct2 = false; f.block = true; }
        this._edges(f);
        return f;
      }
      if (!me.busy && me.fireArrowReady && committed && dist > 5
        && me.res.curCE >= fa.cost && Math.random() < 0.16) {
        f.ct2 = true;
        this._edges(f);
        return f;
      }

      // 2) EAT A FINGER, but only in a real gap. It is a second of standing
      //    still: taking it in someone's face is how he dies, and a bot that
      //    did that would teach the wrong lesson about the move.
      const safeWindow = dist > 7
        || (dist > 4 && ['knockdown', 'getup', 'launched'].includes(foe.state));
      if (!me.busy && me.specialCD <= 0 && me.fingers < me.fingerMax && safeWindow
        && Math.random() < 0.22) {
        f.copy = true;
      }

      // 3) NEUTRAL. Dismantle controls the space it wants to fight in; Cleave
      //    is a punish thrown at people walking into it, not a poke.
      //
      // THE RATES BELOW ARE DELIBERATELY LOW, and that is a tuning decision
      // rather than laziness. Measured CPU-vs-CPU on Jujutsu High, an earlier
      // pass of this profile (Cleave punish 0.45, Dismantle 0.30, no reserve,
      // no whiff) beat Gojo in 14.7 s taking 10 damage; the same character
      // driven by the SHARED planner took 28.9 s and 74 damage, and a Gojo
      // mirror under the same harness runs 41 s. In other words the profile,
      // not the kit, was the outlier — it never mistimed a punish and never
      // ran out of meter. These numbers put the bot back among the others:
      //   · it holds a CE reserve instead of spending down to zero
      //   · it mistimes the Cleave punish sometimes, and eats the 32 frames
      //   · it throws Dismantle at a poke rate rather than on cooldown
      if (!me.busy && !f.copy) {
        const closing = dist < 3.0 && (foe.state === 'run' || foe.state === 'dash' || foe.state === 'attack');
        // a reserve, so it cannot simply spend its whole bar the moment it has one
        const reserve = 12;
        this._readT = (this._readT ?? 0) - dt;
        if (closing && me.res.curCE >= c2.cost + reserve && this._readT <= 0 && Math.random() < 0.26) {
          f.ct2 = true;
          this._readT = rand(1.1, 2.2);          // it does not get to punish every approach
        } else if (dist > 4.5 && me.res.curCE >= c1.cost + reserve && Math.random() < 0.16) {
          f.ct1 = true;
        }
      }
      // Hold the range he wants — but HOLD it, do not retreat from it.
      //
      // The first pass had him backing off whenever the opponent got inside
      // 2.4 m. Combined with the fastest run speed in the roster that produced
      // a bot nobody could ever touch: measured, Gojo dealt him ZERO damage
      // across a 13-second round because the approach never closed. Patient at
      // range has to mean "stands his ground and makes you come to him", not
      // "walks backwards forever" — so he only gives ground when he has no
      // meter to threaten with, which is the moment he genuinely should.
      if (!f.ct1 && !f.ct2 && !f.copy) {
        const broke = me.res.curCE < c1.cost;
        f.move.z = dist > 6.5 ? -1 : dist < 2.0 ? (broke ? 0.5 : 0) : -0.35;
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.35;
        f.dash = dist > 9 && me.res.stamina > 25;
        // the claw string is a spacing tool and gets used like one — in range,
        // to hold pressure and to grow MAX_CE so the techniques stay funded
        if (dist < 2.2 && this.punchT <= 0 && !me.busy) { f.punch = true; this.punchT = rand(0.14, 0.34); }
        // and it guards when something is coming, which also means it is not
        // attacking — giving the opponent turns is most of what "fair" means
        if (dist < 2.8 && (foe.state === 'attack' || foe.state === 'ct') && Math.random() < 0.30) {
          f.block = true; f.punch = false;
        }
      }
      // the domain, when it is up and there is room to cast it
      if (me.ultReady && !me.busy && dist > 3 && !this.match.domains.state) f.ult = true;
      this._edges(f);
      return f;
    }

    // ---- MAKI: PLAY FOR THE AWAKENING --------------------------------------
    // "Maki plays for awakening and gets more aggressive as she scales."
    //
    // The profile is ONE NUMBER — `awakenAggression`, 0 at the start of the
    // round and 1 at maximum — and everything below is that number driving a
    // dial. What makes it interesting rather than a ramp is the thing her
    // meter does that nothing else does: TAKING DAMAGE FEEDS IT. So an early
    // Maki bot is not simply passive, it is willing to TRADE. It will stand in
    // a hit to land one, because the trade is profitable for her in a way it
    // is not for anybody else in this file, and that is the character.
    //
    // Four rules:
    //   1. EARLY, TRADE. Stay in range, throw the fast weapon, accept hits.
    //   2. LATE, COMMIT. The heavy weapon, the slow techniques, and pressure.
    //   3. SWAP ON PURPOSE. The katana in neutral (fast, unblockable RT), the
    //      staff when they are guarding (it has the guard break).
    //   4. THE ULTIMATE IS THE WHOLE ROUND. Once stage 3 lands it fires at
    //      the first opportunity — it is once per round and holding it is
    //      strictly worse than using it.
    if (me.cfg.awakening) {
      const agg = awakenAggression(me);
      const c1 = me._def('ct1'), c2 = me._def('ct2');
      const armed = me.weapon ?? me.cfg.arsenal.default;
      const guarding = foe.state === 'block' || foe.state === 'blockstun';

      // 4 — the ultimate, the moment it exists
      if (!me.busy && me.cfg.ultimate?.kind === 'awakening'
        && me.awakenStage >= (me.cfg.ultimate.requireStage ?? 3)
        && (me.awakenUses ?? 0) < (me.cfg.ultimate.uses ?? 1)
        && dist < 4.5 && me.grounded) {
        f.ult = true;
        this._edges(f);
        return f;
      }

      // 3 — the swap. Deliberately on a long-ish timer rather than reactive:
      // a bot that swapped the instant they blocked would be swapping twice a
      // second, and the swap has a real vulnerable window.
      this.makiSwapT = (this.makiSwapT ?? 0) - 1 / 30;
      if (!me.busy && me.specialCD <= 0 && this.makiSwapT <= 0 && dist > 2.2) {
        const want = guarding ? 'playful_cloud' : 'split_soul';
        if (armed !== want) {
          f.copy = true;                 // B — the swap
          this.makiSwapT = 2.4;
          this._edges(f);
          return f;
        }
      }

      if (!me.busy) {
        // 1 / 2 — the approach. Closes hard at every stage; what changes is
        // how willing she is to sit inside their range once she is there.
        // MOVEMENT IS CHARACTER-RELATIVE and -z ADVANCES along the facing
        // axis — see the `toward` constant in the shared plan switch at the
        // bottom of this file. Getting this sign wrong makes a bot that runs
        // away from the fight while believing it is charging.
        f.move.z = dist > 2.4 ? -1 : (agg > 0.5 ? 0 : 0.15);
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * (0.3 - agg * 0.2);
        f.dash = dist > 6 && me.res.stamina > 40;
        if (dist < (c1?.reach ?? 2.6) && me.specialCD <= 0) {
          // the technique rate scales with the stage — at base she throws them
          // sparingly because they are slow and she is weak, and at maximum
          // she throws them constantly because they are fast and she is not
          if (Math.random() < 0.10 + agg * 0.30) {
            // the guard break when they are holding a guard; otherwise the
            // unblockable, which is the better neutral tool
            f.ct2 = guarding && armed === 'playful_cloud';
            f.ct1 = !f.ct2 && armed === 'playful_cloud';
            if (armed === 'split_soul') { f.ct2 = Math.random() < 0.45; f.ct1 = !f.ct2; }
          }
        }
        if (!f.ct1 && !f.ct2 && dist < (me.cfg.punches[0].reach + 0.5) && this.punchT <= 0) {
          f.punch = true;
          this.punchT = rand(0.12, 0.30);
        }
        // ---- THE TRADE, AND IT IS THE WHOLE PROFILE ------------------------
        // Guard rate FALLS as she awakens, from 30% down to 6%. That is
        // backwards for every other bot in this file and correct for her:
        // early, a hit taken is a hit converted into meter, so refusing to
        // block is profitable; late, she does not need to trade because she
        // wins the exchange outright.
        if (dist < 2.6 && (foe.state === 'attack' || foe.state === 'ct')
          && Math.random() < 0.30 - agg * 0.24) {
          f.block = true; f.punch = false; f.ct1 = false; f.ct2 = false;
        }
      }
      this._edges(f);
      return f;
    }

    // ---- YUKI: BUILD MASS, WALK THROUGH HITS, HUNT THE GRAB ----------------
    // "Yuki builds mass, walks through hits, and hunts the command grab."
    //
    // The profile is a two-state machine and the state is `massReady` — am I
    // above the armour threshold:
    //
    //   LIGHT (below the threshold)  hold range, charge the slam whenever
    //                                there is a window, and do NOT commit. She
    //                                loses every trade here and knows it.
    //   HEAVY (above it)             walk forward in a straight line, through
    //                                whatever they throw, and grab. This is
    //                                the scary state and it is the one the
    //                                whole character is for.
    //
    // The single most important line is that she does NOT block in the heavy
    // state. She has armour; guarding would waste it, and a bot that armoured
    // up and then hid behind a guard would never show the player what the
    // mechanic is.
    if (me.cfg.mass) {
      const heavy = massReady(me);
      const c2 = me._def('ct2');
      const g = this.match.garuda?.forOwner(me);

      // GARUDA, on cooldown, whenever they are at a distance she cannot cover.
      // It is her only ranged option and the profile treats it as one.
      if (!me.busy && me.specialCD <= 0 && g && !g.stunned
        && dist > 3.4 && dist < 11 && me.res.curCE >= (me.cfg.special.cost ?? 0)) {
        f.copy = true;
        this._edges(f);
        return f;
      }

      if (!me.busy) {
        if (heavy) {
          // ---- THE HEAVY STATE -------------------------------------------
          // Straight forward. No strafing, no dashing (her dash is the worst
          // in the game and worse still at high mass), no guard.
          f.move.z = -1;               // -z advances; see the note in Maki's block
          f.move.x = 0;
          f.dash = false;
          // THE GRAB, at its own range. It whiffs on an airborne target, so
          // the bot checks — a bot that grabbed at a jumping opponent would
          // teach the player the wrong lesson about the move.
          if (dist < (c2?.reach ?? 2.4) && foe.grounded && me.res.curCE >= (c2?.cost ?? 0)) {
            f.ct2 = true;
          } else if (dist < 2.9 && this.punchT <= 0) {
            // the long jab has armour on its first hit, so it is the correct
            // thing to throw INTO their pressure
            f.punch = true;
            this.punchT = rand(0.18, 0.36);
          }
        } else {
          // ---- THE LIGHT STATE -------------------------------------------
          // Hold the range her enormous normals own, and charge whenever they
          // are not on top of her. The charge is held by keeping RB down,
          // which for the bot means asserting ct1 across several frames.
          f.move.z = dist > 4.2 ? -0.6 : dist < 2.6 ? 0.5 : 0;
          f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.3;
          this.yukiChargeT = (this.yukiChargeT ?? 0) - 1 / 30;
          if (dist > 3.4 && me.res.curCE >= (me._def('ct1')?.cost ?? 0)) {
            // hold the charge for a real length of time — this is the bot
            // visibly making the trade the player has to learn
            if (this.yukiChargeT <= 0) this.yukiChargeT = rand(0.9, 1.5);
            f.ct1 = true;
          } else if (this.yukiChargeT > 0 && dist < 3.0) {
            // they closed while she was charging: release it into them
            this.yukiChargeT = 0;
          }
          if (dist < 2.9 && this.punchT <= 0 && !f.ct1) {
            f.punch = true;
            this.punchT = rand(0.20, 0.40);
          }
          // she guards ONLY in the light state — see the header
          if (dist < 3.0 && (foe.state === 'attack' || foe.state === 'ct')
            && Math.random() < 0.34) {
            f.block = true; f.punch = false; f.ct1 = false; f.ct2 = false;
          }
        }
      }
      if (me.ultReady && !me.busy && dist < 8 && dist > 2) f.ult = true;
      this._edges(f);
      return f;
    }

    // ---- MIWA: PLACE THE CIRCLE AND BAIT — AND NEVER, EVER CHASE -----------
    // "The CPU must not chase, since chasing defeats her entire design."
    //
    // That is not a preference, it is a hard constraint, and it is enforced
    // structurally rather than by tuning: THERE IS NO BRANCH IN THIS PROFILE
    // THAT SETS `f.move.z` POSITIVE WHILE A CIRCLE IS UP. She physically
    // cannot advance out of her own trap, because the code that would tell her
    // to does not exist. That is the only way to be sure — a probability would
    // eventually roll.
    //
    // The plan, in priority order:
    //   1. THE CIRCLE, placed when they are close enough to be tempted but not
    //      yet inside. Placing it across the arena just burns the clock;
    //      placing it while they are already on top of her wastes the counter.
    //   2. INSIDE IT: CHARGE THE DRAW AND WAIT. This is the whole character —
    //      circle down, stance up, and dare them to come in. The auto-counter
    //      is watching the perimeter, so the charge is safe in a way it is
    //      nowhere else.
    //   3. THEY CAME IN → draw. At whatever tier is bought.
    //   4. NO CIRCLE → play a normal, cautious, weak swordswoman: hold
    //      mid-range, poke, parry, step back. She is the worst character in
    //      the game here and the bot plays like it.
    if (me.cfg.simpleDomainZone) {
      const sys = this.match.newshadow;
      const z = sys?.zoneFor(me) ?? null;
      const inCircle = !!z;
      const theyreIn = !!(z && z.contains(foe.pos));
      const c2 = me._def('ct2');

      // 1 — place it
      if (!me.busy && !inCircle && sys?.shouldCast(me, dist)) {
        f.copy = true;                   // B
        this._edges(f);
        return f;
      }

      if (inCircle && !me.busy) {
        // 3 — they came in. Draw, and let the tier be whatever was bought.
        if (theyreIn && me.state === 'stance') {
          f.ct2 = true;                  // keep holding the stance...
          f.ct1 = true;                  // ...and release the draw
        } else if (theyreIn) {
          // caught out of stance: the fast string still cannot miss in here
          if (this.punchT <= 0) { f.punch = true; this.punchT = rand(0.10, 0.22); }
        } else {
          // 2 — HOLD THE STANCE AND WAIT. This is the branch that makes her
          // work, and it is also the branch that must never move forward.
          f.ct2 = true;
        }
        // THE CONSTRAINT, stated as code: never advance while the circle is
        // up. Small backward drift only, to stay centred in her own ring.
        const off = flatDist(me.pos, z.origin);
        f.move.z = 0;
        f.move.x = 0;
        if (off > z.radius * 0.55) {
          // drift back toward the middle so she does not wander out of it —
          // leaving drops the circle, which would be the bot beating itself
          const to = z.origin.clone().sub(me.pos);
          const fwd = me.forward();
          const along = to.x * fwd.x + to.z * fwd.z;
          f.move.z = along > 0 ? -0.35 : 0.35;
        }
        f.dash = false;
        this._edges(f);
        return f;
      }

      // 4 — no circle: cautious mid-range poking, and a real guard
      if (!me.busy) {
        f.move.z = dist > 4.6 ? -0.5 : dist < 2.4 ? 0.6 : 0.1;
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.4;
        f.dash = dist > 7 && me.res.stamina > 40;
        if (dist < 2.0 && this.punchT <= 0) {
          f.punch = true;
          this.punchT = rand(0.10, 0.24);
        }
        // she has a real parry and the bot uses it — a tight, well-timed
        // guard rather than a held one, which is the whole difference
        if (dist < 2.8 && (foe.state === 'attack' || foe.state === 'ct')
          && Math.random() < 0.42) {
          f.block = true; f.punch = false;
        }
      }
      if (me.ultReady && !me.busy && dist < 9) f.ult = true;
      this._edges(f);
      return f;
    }

    // ---- HANAMI: HOLD GROUND ------------------------------------------------
    // The one profile in the file that NEVER CHASES, and that is the whole
    // character rather than a stylistic choice — he has the worst legs and the
    // worst dash in the roster, so an approaching Hanami is a Hanami who has
    // lost the neutral before he arrives.
    //
    // The plan, in priority order:
    //   1. STAND ON SOMETHING THAT FEEDS HIM. If the ground he is on is dead
    //      and he can afford a Root Field, he builds one and stays in it. On a
    //      natural map this branch almost never fires; on Shibuya Station it
    //      is most of what he does, which is exactly the intended difference.
    //   2. STARVE THEM. The Cursed Bud goes on cooldown the moment they are in
    //      range, because denying an ultimate is worth more than any damage he
    //      could trade for the same meter.
    //   3. PUNISH THE APPROACH. Root Eruption is placed where they are ABOUT
    //      to be — on their wake-up, or under their feet as they run at him.
    //   4. Otherwise: hold the club range and guard. He has the best block in
    //      the game and standing still is a real plan for him.
    if (me.cfg.flora) {
      const fl = this.match.flora;
      const onDead = (me.terrain ?? 'artificial') === 'artificial';
      const sp = me.cfg.special;

      if (!me.busy) {
        // 1. build ground
        if (onDead && me.specialCD <= 0 && me.res.curCE >= sp.cost && dist > 2.2) {
          f.copy = true;
          this._edges(f);
          return f;
        }
        // 2. THE ROOT SWARM. Sent at a target who does not already carry the
        //    bud (a second one only refreshes it) and only from inside its
        //    own range — it is a line that travels, so it wants them roughly
        //    in front rather than merely nearby. The CPU aims it by walking
        //    into them, which is exactly how the stick-steering reads.
        this._budT = (this._budT ?? 0) - dt;
        if (this._budT <= 0 && dist < (me.cfg.ct1.range ?? 11) - 1.5 && !fl?.budOn(foe)
          && me.res.curCE >= me.cfg.ct1.cost + 8) {
          f.ct1 = true;
          f.move.z = 1;                 // lean into the swarm's direction
          this._budT = rand(1.4, 2.4);
          this._edges(f);
          return f;
        }
        // 3. the trap. Thrown HARD into an opening — their wake-up, or an
        //    approach it can lead — and thrown on a slow cadence the rest of
        //    the time, because it reaches 9 m and it is the only thing he
        //    owns that can touch someone who will not come to him. An earlier
        //    pass fired it only on openings, and measured against an opponent
        //    who simply stood still it dealt ZERO damage across two minutes:
        //    "never chases" has to mean "won't run you down", not "cannot win".
        const opening = ['knockdown', 'getup'].includes(foe.state)
          || (dist < 7 && (foe.state === 'run' || foe.state === 'dash'));
        this._rootT = (this._rootT ?? 0) - dt;
        if (this._rootT <= 0 && dist < (me.cfg.ct2.aimRange ?? 9)
          && me.res.curCE >= me.cfg.ct2.cost
          && Math.random() < (opening ? 0.62 : 0.30)) {
          f.ct2 = true;
          this._rootT = opening ? rand(0.9, 1.7) : rand(1.8, 3.0);
          this._edges(f);
          return f;
        }
      }

      // the ultimate, when there is room to drop it
      if (me.ultReady && !me.busy && dist > 2.0) { f.ult = true; this._edges(f); return f; }

      // 4. POSITION. He WALKS — never dashes, never runs anyone down — until
      //    he is inside his own working range, and then he stops and stands
      //    there. That is the distinction that matters: he advances, at the
      //    slowest pace in the game, and once he owns the space he does not
      //    give it back and does not follow you out of it.
      if (!f.ct1 && !f.ct2 && !f.copy) {
        if (dist > (me.cfg.ct2.aimRange ?? 9) - 1.5) f.move.z = -0.55;
        else if (dist < 1.4) f.move.z = 0.4;          // he is being crowded
        else if (onDead && dist > 4) {
          // walk toward the nearest patch of his own that is still alive,
          // rather than toward the fight
          const fld = fl?.fields.find(x => x.owner === me && x.hp > 0);
          if (fld) {
            const dx = fld.x - me.pos.x, dz = fld.z - me.pos.z;
            const d = Math.hypot(dx, dz) || 1;
            if (d > fld.r * 0.5) {
              const sin = Math.sin(me.facing), cos = Math.cos(me.facing);
              f.move.z = -((dx / d) * sin + (dz / d) * cos);
              f.move.x = -(dx / d) * cos + (dz / d) * sin;
            }
          }
        }
        // the club string in its own range, and the guard the rest of the time
        if (dist < 2.4 && this.punchT <= 0 && !me.busy) {
          f.punch = true; this.punchT = rand(0.28, 0.5);
        }
        if (dist < 3.0 && (foe.state === 'attack' || foe.state === 'ct') && Math.random() < 0.45) {
          f.block = true; f.punch = false;
        }
      }
      this._edges(f);
      return f;
    }

    // ---- KUROURUSHI: NEVER STOP ---------------------------------------------
    // The attrition profile. It does not look for a knockout because it does
    // not have one:
    //   1. SWARMS ARE ALWAYS OUT. The cheapest technique he has and the only
    //      one that feeds Gluttony passively, so it goes on cooldown forever.
    //   2. SPRAY DEFENSIVE OPPONENTS. It reads their guard directly — a bot
    //      that saw the block go up and answered it with the anti-guard tool
    //      is the whole reason that tool exists.
    //   3. HUNT DEVOUR ON A KNOCKDOWN, where it comes out faster and cannot be
    //      jumped. Out of range it eats its own swarm instead, which is free.
    if (me.cfg.gluttony) {
      const sys = this.match.swarms;
      const mine = sys.countFor(me);
      if (!me.busy) {
        // 1. keep the field seeded
        this._swarmT = (this._swarmT ?? 0) - dt;
        if (this._swarmT <= 0 && mine < 70 && me.res.curCE >= me.cfg.ct1.cost) {
          f.ct1 = true;
          this._swarmT = rand(1.6, 2.6);
          this._edges(f);
          return f;
        }
        // 2. melt a guard
        const guarding = ['block', 'blockstun'].includes(foe.state);
        if (guarding && dist < me.cfg.ct2.reach * me.reachScale
          && me.res.curCE >= me.cfg.ct2.cost && !foe.melt) {
          f.ct2 = true;
          this._edges(f);
          return f;
        }
        // 3. devour
        const downed = ['knockdown', 'getup'].includes(foe.state);
        if (me.specialCD <= 0 && me.res.curCE >= me.cfg.special.cost) {
          if (downed && dist < 3.2) { f.copy = true; this._edges(f); return f; }
          if (dist > 9 && mine > 6) { f.copy = true; this._edges(f); return f; }
        }
        if (me.ultReady && dist < 14) { f.ult = true; this._edges(f); return f; }
      }
      // it walks at them, always, and strings when it arrives
      f.move.z = -1;
      f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.25;
      f.dash = dist > 4.5 && me.res.stamina > 22;
      if (dist < 2.2 && this.punchT <= 0 && !me.busy) {
        f.punch = true; this.punchT = rand(0.10, 0.22);
      }
      this._edges(f);
      return f;
    }

    // ---- CHOSO: HOLD THE BAND -----------------------------------------------
    // The mid-range controller, so the profile is about DISTANCE first and
    // damage second. In priority order:
    //
    //   1. BOIL FIRST. Flowing Red Scale goes up in a real gap — never inside
    //      their range, because the 30-frame channel has no hitbox and no
    //      armour — and the moment it IS up the whole profile flips: it stops
    //      holding range and walks them down, because that is the entire point
    //      of the buff and a bot that kept zoning through it would be showing
    //      the player the wrong character.
    //   2. PUNISH THE APPROACH with Piercing Blood. Thrown at people COMING
    //      IN, at bodies that cannot punish 34 frames of recovery, and never
    //      on cooldown — it costs 34 Blood and it is his read, not his poke.
    //   3. HOLD THE BAND with Blood Edge, at the range it does full damage.
    //   4. Give ground when crowded, and only then.
    if (me.cfg.blood && !me.busy) {
      const sp = me.cfg.special, c1 = me.cfg.ct1, c2 = me.cfg.ct2;
      const boiling = me.buffs.redScale > 0;
      const helpless = ['knockdown', 'getup', 'launched', 'hitLight', 'hitHeavy', 'guardBreak'].includes(foe.state)
        || !foe.grounded;
      const closing = dist < 6.5 && (foe.state === 'run' || foe.state === 'dash');
      // ---- SAVING UP -------------------------------------------------------
      // His gameplan in one line: hold the band, BUILD BLOOD, then boil and
      // close. Without this the bot dribbles the gauge away on pokes and never
      // reaches the 45 the buff costs — measured, it finished a 37-second
      // round on 44 Blood having never once activated Flowing Red Scale, which
      // is the entire second half of the character.
      //
      // Every technique he owns is Blood-NEGATIVE (Blood Edge costs 10 and its
      // 8 damage pays back ~7), so banking genuinely means holding fire. While
      // he is saving he throws Blood Edge only at somebody actually coming in
      // — a defensive poke he is willing to pay for — and never the lance.
      //
      // It banks BOTH resources, not just Blood. Measured with only the Blood
      // half: across 900 frames the buff's gate was blocked 456 times for
      // Blood and 155 times for cursed energy and the two were NEVER satisfied
      // on the same frame — the poke kept topping one up by spending the
      // other, so a bot sitting on 70 Blood still never boiled. Holding fire
      // on both is what actually closes the gate.
      const banking = !boiling && me.specialCD <= 0
        && (me.blood < sp.blood || me.res.curCE < sp.cost);

      // 1. the buff, bought in a genuine gap.
      //
      // MEASURED AND LOOSENED. The first gate was `dist > 6.0 || (dist > 3.5
      // && helpless)`, and against an opponent who neither approaches nor gets
      // knocked down the bot settled at an average of 4.1 m and NEVER bought
      // the buff across 23 seconds — so the half of the character the whole
      // neutral game is saving for simply never appeared. 4.2 m is still
      // outside everyone's normal range, so the channel is not being thrown
      // away in someone's face; it just no longer requires them to cooperate.
      if (!boiling && me.specialCD <= 0 && me.blood >= sp.blood && me.res.curCE >= sp.cost
        && (dist > 4.2 || (dist > 3.0 && helpless))) {
        f.copy = true;
        this._edges(f);
        return f;
      }
      // 2. the read
      this._pierceT = (this._pierceT ?? 0) - dt;
      if (!banking && this._pierceT <= 0 && me.blood >= c2.blood && me.res.curCE >= c2.cost
        && dist < (c2.range ?? 22)) {
        // it is a READ, not a reaction — it misses sometimes, which is what
        // makes standing in front of him a gamble rather than a death sentence.
        //
        // The third rate is the one added after measuring: a bot that only
        // ever threw this at a body that was CLOSING or DOWN never threw it at
        // all against someone content to stand still at range, which taught
        // the player that ignoring him was safe. It is deliberately the
        // lowest of the three — standing still should be punished eventually,
        // not immediately.
        const p = helpless ? 0.55 : closing ? 0.30 : 0.10;
        if (Math.random() < p) {
          f.ct2 = true;
          this._pierceT = rand(2.4, 4.2);
          this._edges(f);
          return f;
        }
        this._pierceT = rand(0.6, 1.2);
      }
      // 3. the poke, at the range it actually pays.
      //
      // IT KEEPS A BLOOD RESERVE. Measured without one, the bot threw eleven
      // Blood Edges in 33 seconds at 10 Blood each and never once had the 34
      // banked for a Piercing Blood — the poke ate the punish, and the
      // character's whole big-damage read never appeared on screen. It now
      // only pokes with the lance's cost already covered.
      this._edgeT = (this._edgeT ?? 0) - dt;
      const reserve = boiling ? 0 : (c2.blood ?? 34);
      // While saving he still pokes — a bot that goes silent for thirty
      // seconds is not "patient", it is absent, and measured it let a passive
      // opponent finish the round on full health. It just pokes SLOWER and
      // keeps a bigger cushion, so the gauge still climbs.
      const pokeOk = banking
        ? me.blood >= c1.blood + 14
        : me.blood >= c1.blood + reserve;
      const ceOk = me.res.curCE >= c1.cost + (banking ? sp.cost : 0);
      if (!boiling && this._edgeT <= 0 && pokeOk && ceOk
        && dist > 2.6 && dist < (c1.falloffAt ?? 7) + 1.5) {
        f.ct1 = true;
        this._edgeT = banking ? rand(1.6, 2.6) : rand(0.75, 1.35);
        this._edges(f);
        return f;
      }
      if (me.ultReady && dist > 3.0 && dist < (me.cfg.ultimate.aimRange ?? 11) + 3) {
        f.ult = true;
        this._edges(f);
        return f;
      }
      // 4. POSITION. Boiling, he walks them down; otherwise he holds the band
      //    and only gives ground when someone is genuinely on top of him.
      if (boiling) {
        f.move.z = -1;
        f.dash = dist > 3.5 && me.res.stamina > 20;
        if (dist < 2.0 && this.punchT <= 0) { f.punch = true; this.punchT = rand(0.14, 0.30); }
        if (dist < 2.4 && Math.random() < 0.14) {
          f.heavy = true; f.punch = false; this.punchT = rand(0.6, 1.0);
        }
      } else {
        // THE BAND, and it is the whole character. Measured with a drift-in
        // rule (`dist < 2.6 ? back off : creep forward`) he converged on 3.5 m
        // and lived inside his own Blood Edge's falloff — a mid-range
        // controller who had quietly become a bad brawler. He now HOLDS
        // 4.6-6.5 m: closes only when they are further out than his poke
        // reaches, gives ground the moment they are inside it, and stands
        // still in between.
        f.move.z = dist > 6.5 ? -1 : dist < 4.6 ? 0.6 : 0;
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.30;
        f.dash = dist > 9 && me.res.stamina > 25;
        if (dist < 2.0 && this.punchT <= 0) { f.punch = true; this.punchT = rand(0.18, 0.36); }
        if (dist < 2.8 && (foe.state === 'attack' || foe.state === 'ct') && Math.random() < 0.34) {
          f.block = true; f.punch = false;
        }
      }
      this._edges(f);
      return f;
    }

    // ---- NOBARA: PLAY FOR THE BILL ------------------------------------------
    // She does not chase a knockout, she builds one. In priority order:
    //
    //   1. KEEP NAILS ON THE FLOOR. They are cheap, they are chip, and a nail
    //      in a body is the biggest Essence chunk in the kit. It throws them
    //      up to the cap and then detonates.
    //   2. DUMP RESONANCE WHEN THEY LEAVE. The trigger the brief asks for and
    //      the one that teaches the matchup: the moment the opponent tries to
    //      disengage — running, far away, sitting in a guard at range — or is
    //      low enough that the banked Essence would finish it, she cashes. It
    //      also cashes if she is about to die, because Essence carried into a
    //      knockdown is Essence wasted.
    //   3. BLACK FLASH into an opening, and confirm it.
    //   4. Otherwise walk in and string for chip and Essence, and leave.
    if (me.cfg.essence && !me.busy) {
      const c1 = me.cfg.ct1, c2 = me.cfg.ct2, sp = me.cfg.special;
      const banked = me.essence;
      const helpless = ['knockdown', 'getup', 'launched', 'hitLight', 'hitHeavy', 'guardBreak'].includes(foe.state);
      // "trying to leave": moving, and far enough that closing it is a
      // commitment. Deliberately generous — running from her is supposed to be
      // the wrong answer, and the bot has to make that legible.
      const disengaging = dist > 6.5
        || (dist > 4.0 && (foe.state === 'run' || foe.state === 'dash'))
        || (dist > 5.0 && foe.state === 'block');
      const finisher = foe.res.hp <= (c2.base ?? 2) + banked * (c2.perEssence ?? 0.4) + 4;
      const desperate = me.res.hp < me.cfg.stats.hp * 0.22 && banked > 30;

      // 2 first: cashing beats everything else she could be doing
      this._resT = (this._resT ?? 0) - dt;
      if (this._resT <= 0 && me.res.curCE >= c2.cost && banked >= (c2.minEssence ?? 8)) {
        const wantBig = banked > 55;
        if (finisher || desperate
          || (disengaging && (wantBig || Math.random() < 0.5))
          || (wantBig && Math.random() < 0.25)) {
          f.ct2 = true;
          this._resT = rand(1.2, 2.4);
          this._edges(f);
          return f;
        }
      }
      // 1. nails
      this._nailT = (this._nailT ?? 0) - dt;
      if (me.nailCount >= (c1.maxNails ?? 4)) {
        // at the cap RB is the detonator, and it is free — set them off when
        // the opponent is anywhere near where they were put
        if (this._nailT <= 0 && (dist < 7 || Math.random() < 0.2)) {
          f.ct1 = true;
          this._nailT = rand(0.5, 1.0);
          this._edges(f);
          return f;
        }
      } else if (this._nailT <= 0 && me.res.curCE >= c1.cost && dist < (c1.range ?? 15)) {
        f.ct1 = true;
        this._nailT = rand(0.6, 1.1);
        this._edges(f);
        return f;
      }
      // 3. the Flash attempt, into a body that cannot answer 26 frames
      if (me.specialCD <= 0 && me.res.curCE >= sp.cost && dist < (sp.reach ?? 1.9) + 1.2
        && (helpless || Math.random() < 0.05)) {
        f.copy = true;
        this._edges(f);
        return f;
      }
      if (me.ultReady && banked > 45 && dist < 16) {
        f.ult = true;
        this._edges(f);
        return f;
      }
      // 4. chip. Short arms, so it has to actually get in — and it leaves
      //    again after the string rather than standing in the pocket.
      f.move.z = dist > 2.0 ? -1 : 0.25;
      f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1) * 0.30;
      f.dash = dist > 5.0 && me.res.stamina > 24;
      if (dist < 1.5 && this.punchT <= 0) { f.punch = true; this.punchT = rand(0.10, 0.24); }
      if (dist < 2.2 && (foe.state === 'attack' || foe.state === 'ct') && Math.random() < 0.32) {
        f.block = true; f.punch = false;
      }
      this._edges(f);
      return f;
    }

    // ---- my own transfiguration domain: relentless chase --------------------
    // every second spent close drains the gauge — the bot forces the drain
    if (this.match.domains.isMyDomain(me)
      && me.cfg.domain?.sureHit.effect === 'transfigure') {
      f.move.z = -1;
      f.dash = dist > 2.6 && me.res.stamina > 10;
      if (dist < 2.0 && !me.busy) {
        const r = Math.random();
        if (r < 0.25 && me.res.curCE >= me.cfg.ct2.cost) f.ct2 = true;      // soul touch: big chunk
        else if (r < 0.4 && me.res.curCE >= me.cfg.ct1.cost) f.ct1 = true;  // body weapon
        else f.punch = true;
      }
      this._edges(f);
      return f;
    }

    // ---- MEGUMI: keep something on the field, always ------------------------
    // The whole profile is "never fight alone". It summons on cooldown, plays
    // at mid range behind whatever it has out, re-binds the wheel to suit the
    // situation, panics with Rabbit Escape and saves Max Elephant as a punish.
    if (me.cfg.shikigami) {
      const sys = this.match.shikigami;
      const snap = sys.snapshot(me);
      const by = Object.fromEntries(snap.map(s => [s.key, s]));
      // `blocked` covers the two states that are new to the roster: the
      // ritual-only Mahoraga entry, and a fusion whose components have been
      // destroyed. Without it the CPU would happily bind a slot to a button
      // that can never fire.
      const bind = k => (by[k] && !by[k].lost && !by[k].blocked && by[k].cd <= 0 && by[k].affordable);
      const onField = sys.aliveFor(me).length;
      const hurt = me.res.hp < me.cfg.stats.hp * 0.35;
      const pressured = dist < 2.4 && (foe.state === 'attack' || foe.state === 'ct' || foe.state === 'run');
      const deerOut = sys.aliveFor(me).some(s => s.key === 'roundDeer');

      // 1) PANIC — Rabbit Escape when it is being run down on low health
      if (!me.busy && hurt && pressured && bind('rabbits') && !this.wheelT) {
        this._wantBind = { key: 'rabbits', slot: 'ct1' };
      }
      // 2) SUSTAIN — Round Deer when it is hurt and NOT being run down. The
      //    ordering against the panic button matters: the deer is fragile and
      //    summoning it with somebody in his face just feeds them a kill.
      else if (!me.busy && hurt && !pressured && !deerOut && bind('roundDeer')) {
        this._wantBind = { key: 'roundDeer', slot: 'ct1' };
      }
      // 3) THE FUSION — Merged Beast Agito. Gated hard, because it costs four
      //    shikigami: only with a healthy bar, only when the fight is close
      //    enough to spend it on, and never twice in a row.
      else if (!me.busy && bind('agito') && me.res.curCE > 60 && dist < 11 && Math.random() < 0.04) {
        this._wantBind = { key: 'agito', slot: 'ct2' };
      }
      // 4) THE RUNWAY — Piercing Ox specifically when there IS runway. Summoned
      //    in a corridor it is a shove; summoned across an open street it is the
      //    biggest hit Megumi has, and the CPU should know the difference.
      else if (!me.busy && dist > 8 && bind('piercingOx') && Math.random() < 0.03) {
        this._wantBind = { key: 'piercingOx', slot: 'ct2' };
      }
      // 5) PUNISH — Max Elephant into a knockdown, where it cannot be answered
      else if (!me.busy && (foe.state === 'knockdown' || foe.state === 'getup')
        && bind('elephant') && dist < 9) {
        this._wantBind = { key: 'elephant', slot: 'ct2' };
      }
      // 6) CONTROL — Toad + Serpent when the opponent wants to sit at range
      else if (!me.busy && dist > 6 && bind('serpent') && Math.random() < 0.02) {
        this._wantBind = { key: 'serpent', slot: 'ct2' };
      }
      // 7) DEFAULT — Tiger Funeral, the all-rounder, when nothing else applies
      //    and the field is empty. It is the pick with no read behind it, which
      //    is exactly what a CPU with no read should take.
      else if (!me.busy && !onField && bind('tigerFuneral') && Math.random() < 0.02) {
        this._wantBind = { key: 'tigerFuneral', slot: 'ct1' };
      }

      // drive the wheel: hold B, steer to the wanted sector, release
      if (this._wantBind && me.specialCD <= 0 && !me.busy && me.state !== 'wheel') {
        f.copy = true;
        this.wheelT = 0.5;
      } else if (me.state === 'wheel' && this._wantBind) {
        const order = me.cfg.shikigami.order;
        const want = order.indexOf(this._wantBind.key);
        const cur = me.wheel?.sel ?? 0;
        if (want !== cur) {
          // point the stick at the wanted sector (wheel reads atan2(x, -z))
          const a = (want / order.length) * Math.PI * 2;
          f.move.x = Math.sin(a); f.move.z = -Math.cos(a);
          f.copy = true;
          if (this._wantBind.slot === 'ct2') f.ct2 = true; else f.ct1 = true;
        } else {
          this._wantBind = null;   // release confirms
        }
      }

      // fire the slots: keep the field populated, spend on what is ready
      if (!me.busy && me.state !== 'wheel' && !this._wantBind) {
        const wantMore = onField < 2 || !!this.match.domains.isShadowGarden(me);
        if (wantMore && this.summonT <= 0) {
          const s1 = by[sys.bindingOf(me, 'ct1')], s2 = by[sys.bindingOf(me, 'ct2')];
          const ok1 = s1 && !s1.lost && !s1.blocked && s1.cd <= 0 && s1.affordable;
          const ok2 = s2 && !s2.lost && !s2.blocked && s2.cd <= 0 && s2.affordable;
          if (ok1 && (!ok2 || Math.random() < 0.55)) { f.ct1 = true; this.summonT = rand(0.7, 1.4); }
          else if (ok2) { f.ct2 = true; this.summonT = rand(0.7, 1.4); }
        }
      }
      this.summonT = (this.summonT ?? 0) - dt;
      if (this.wheelT > 0) this.wheelT -= dt;
    }

    // ---- GETO: keep the field populated, and know when to cash out ---------
    // "Keeps the field populated, hides behind summons, and fires Uzumaki when
    // the stable is still large."
    //
    // The profile is built around ONE JUDGEMENT the other bots do not have to
    // make: an ultimate that is worth 198 damage with a full stable and 27 with
    // a spent one is not a button you press when it lights up. So the ultimate
    // gate below is a THRESHOLD on the stable rather than on the meter, and the
    // rest of the profile exists to protect that threshold — it summons chaff
    // freely (chaff is worth 1 weight and dying is what chaff is for) and it
    // pulls SPECIAL GRADES OUT rather than letting them die, because each one
    // is worth 36 damage on the ultimate and only 55 CE to recall.
    if (me.cfg.curses) {
      const sys = this.match.curses;
      const held = sys.uzumakiCount(me);
      const out = sys.aliveFor(me);
      const wounded = out.find(c => c.special && c.hp < c.maxHp * 0.35);
      const pressured = dist < 2.6 && (foe.state === 'attack' || foe.state === 'ct' || foe.state === 'run');

      this.summonT = (this.summonT ?? 0) - dt;
      this.getoWheelT = (this.getoWheelT ?? 0) - dt;

      if (!me.busy && me.state !== 'wheel') {
        // 1 REABSORB — a special grade about to die is 36 points off his own
        //   ultimate. Pulling it out is nearly always right and the bot knows
        //   it. This is the single most characterful line in the profile.
        if (wounded && me.specialCD <= 0) {
          f.copy = true;
          f.move.z = 1;                  // "pull back" is what selects reabsorb
        }
        // 2 SPECIAL GRADE — thrown from RANGE only. The cast is 44 frames with
        //   his arms open; doing it in someone's face is how this character
        //   dies, and the bot has to respect its own tell.
        else if (dist > 5.5 && !out.some(c => c.special) && this.summonT <= 0
          && !sys.blockReason(me, sys.selected(me)) && me.res.curCE >= 40) {
          f.ct2 = true;
          this.summonT = rand(1.4, 2.4);
        }
        // 3 CHAFF — freely, and especially under pressure, where a body in the
        //   way is worth more than the 10 CE it cost.
        else if ((out.length < 2 || pressured) && this.summonT <= 0 && me.res.curCE >= 12) {
          f.ct1 = true;
          this.summonT = rand(0.6, 1.2);
        }
        // 4 RE-SELECT — swap which special grade CT2 will call, occasionally
        //   and only with space to do it in. Jogo into someone sitting at
        //   range, Mahito into someone in his face.
        else if (dist > 6 && this.getoWheelT <= 0 && me.specialCD <= 0 && Math.random() < 0.02) {
          const want = dist > 7 ? 'jogo' : 'mahito';
          if (!sys.isLost(me, want) && sys.selected(me) !== want) {
            this._wantCurse = want;
            this.getoWheelT = 6;
            f.copy = true;
          }
        }
      } else if (me.state === 'wheel' && this._wantCurse) {
        const order = me.cfg.curses.wheelOrder ?? me.cfg.curses.specialOrder;
        const want = order.indexOf(this._wantCurse);
        const cur = me.wheel?.sel ?? 0;
        if (want !== cur) {
          const a = (want / order.length) * Math.PI * 2;
          f.move.x = Math.sin(a); f.move.z = -Math.cos(a);
          f.copy = true;
        } else this._wantCurse = null;   // release confirms
      }
    }

    // ---- NAOYA: harass, then arm the trap when they commit -----------------
    // "Harasses, then arms Projection Stance when the opponent commits to
    // offense." The second half is the whole profile and it is a READ, not a
    // timer: the stance goes up when the opponent is ALREADY IN A COMMITTED
    // ANIMATION and close enough to reach him — which is exactly when a human
    // player would arm it, and exactly when it is most likely to catch.
    //
    // It deliberately does NOT arm on cooldown. A bot that held the stance
    // every 5.5 seconds regardless would eat the self-freeze penalty over and
    // over and look stupid, and it would also teach the player nothing about
    // when the trap is actually dangerous.
    if (me.cfg.special?.key === 'naoya_stance' && !me.busy
      && me.specialCD <= 0 && me.projT <= 0 && me.projArmT <= 0 && me.maxProjT <= 0
      && me.res.curCE >= me.cfg.special.cost) {
      const committed = foe.state === 'attack' || foe.state === 'ct' || foe.state === 'dash';
      const closing = dist < 4.0 && dist > 1.2 && foe.state === 'run';
      // 16 frames of startup is ~0.27 s, so it only pays if they are still
      // coming rather than already landing
      if ((committed && dist < 3.2) || closing) {
        if (Math.random() < 0.5) f.copy = true;
      }
    }

    // ---- PANDA: THE CORE MANAGER --------------------------------------------
    // Three rules, and they are the character rather than a difficulty setting:
    //
    //   1 SWAP TO GORILLA TO PUNISH. Not "when it feels strong" — when there is
    //     something to punish: a whiffed technique, a knockdown, a guard break,
    //     a wake-up. Gorilla cannot chase, so a bot that swapped into it in
    //     neutral would simply be a slow Panda that also burns cursed energy.
    //   2 SWAP TO THE TRICERATOPS TO ESCAPE. Under pressure, cornered, or
    //     losing the exchange. She is how he leaves, and Crest Roll's fourteen
    //     invulnerable frames are the one hard defensive option he owns.
    //   3 PROTECT THE WEAKEST CORE. The real skill of the character, and the
    //     one thing a bot has to do or the health system is invisible: when the
    //     core it is standing in drops below a third, it swaps OFF it. Not to
    //     heal — swapping does not heal — but because every point of damage
    //     after that is a point closer to permanently losing that stance, and
    //     spreading it is the entire game.
    //
    // It also leaves Gorilla when the cursed energy runs out, because a Gorilla
    // with an empty bar is a slow character with no techniques and it should
    // know that.
    if (me.cores && !me.busy && me.allCoresT <= 0) {
      const cur = me.cores[me.coreIndex];
      const has = k => {
        const c = me.cores.find(x => x.key === k);
        return c && c.alive && c.hp > 0;
      };
      const frac = cur.hp / cur.max;
      // no CE gate here: the swap drains rather than gates (see the soft-lock
      // note in fighter.js), so a bot that checked for the cost would refuse to
      // leave exactly the stance it most needs to leave
      const canSwap = me.specialCD <= 0
        && me.cores.filter(c => c.alive && c.hp > 0).length > 1;
      // the punish window: they are committed to something, or on the floor
      const punishable = foe.state === 'knockdown' || foe.state === 'getup'
        || foe.state === 'guardBreak'
        || ((foe.state === 'ct' || foe.state === 'attack') && dist < 3.0);
      // the pressure window: they are on top of it and it is losing
      const pressured = dist < 2.4 && (me.state === 'blockstun' || me.state === 'hitLight'
        || me.state === 'hitHeavy' || me.res.stamina < 30);
      let want = null;
      if (frac < 0.34 && me.cores.filter(c => c.alive && c.hp > 0).length > 1) {
        // RULE 3 first, because it outranks both of the others: a core about to
        // die is worth more than any single punish or escape.
        want = has('panda') && me.stance !== 'panda' ? 'panda'
          : has('trike') && me.stance !== 'trike' ? 'trike'
            : has('gorilla') && me.stance !== 'gorilla' ? 'gorilla' : null;
      } else if (me.stance === 'gorilla' && me.res.curCE < 12) {
        want = has('panda') ? 'panda' : has('trike') ? 'trike' : null;   // the bar ran out
      } else if (me.stance === 'gorilla' && !punishable && dist > 3.0) {
        // GORILLA IS A STANCE YOU VISIT, NOT ONE YOU LIVE IN — and the first
        // version of this profile did not know that. Measured over a 40-sample
        // match against a pressuring opponent it spent 29 samples in Gorilla,
        // lost that core permanently, and never showed the other two off. The
        // punish rule below is easy to satisfy against an aggressive player, so
        // without an explicit LEAVE rule the bot swaps in and never swaps back.
        // The moment the punish window closes and they are out of his (very
        // short) reach, he goes back to a stance that can actually move.
        want = has('panda') ? 'panda' : has('trike') ? 'trike' : null;
      } else if (punishable && me.stance !== 'gorilla' && has('gorilla') && dist < 3.4) {
        want = 'gorilla';
      } else if (pressured && me.stance !== 'trike' && has('trike')) {
        want = 'trike';
      }
      if (want && canSwap && Math.random() < 0.6) {
        this._pandaWant = want;
        f.copy = true;                      // a TAP; the wheel is a player tool
      }
      // ---- the techniques, per stance -------------------------------------
      if (!f.copy && me.res.curCE >= (me._def('ct1')?.cost ?? 99)) {
        if (me.stance === 'gorilla') {
          // DRUMMING BEAT into a GUARD. It is unblockable, so the bot should
          // specifically reach for it when blocking is what they are doing —
          // which is the read the technique exists to punish.
          if (dist < 2.4 && (foe.state === 'block' || foe.state === 'blockstun')
            && Math.random() < 0.7) f.ct1 = true;
          else if (dist < 2.6 && punishable && Math.random() < 0.5) f.ct2 = true;
        } else if (me.stance === 'trike') {
          // GORE CHARGE to close, CREST ROLL to leave
          if (dist > 4.0 && dist < 9.0 && Math.random() < 0.35) f.ct1 = true;
          else if (pressured && Math.random() < 0.45) f.ct2 = true;
        } else {
          if (dist < 2.8 && Math.random() < 0.30) f.ct1 = true;
          else if (dist > 3.5 && dist < 6.5 && Math.random() < 0.28) f.ct2 = true;
        }
      }
    }

    // ---- KASHIMO: NEVER STOPS MOVING ---------------------------------------
    // Three rules, and they are the whole profile:
    //
    //   1 IT DASHES ALMOST ALWAYS. Not "when closing" and not "when it has
    //     stamina to spare" — the meter only goes up while it is moving, so
    //     standing still is the one thing this bot must never be caught doing.
    //     It holds dash whenever it has the stamina, which his 15/s drain and
    //     34/s regen make nearly permanent, and it PICKS A DIRECTION rather
    //     than idling even when it does not want to close (see the strafe
    //     fallback below).
    //   2 IT WILL NOT BLOCK BELOW TIER 2. Blocking costs him 26 charge a
    //     second, which is more than twice the standing rate, and a bot that
    //     guards on reaction the way the shared profile does would spend the
    //     whole round at tier 0. Above tier 2 it is allowed to guard, because
    //     by then it has something to lose that is worth protecting.
    //   3 IT ONLY COMMITS DISCHARGE STRIKE AT HIGH CHARGE, because the move
    //     eats 35 of the meter and a tier-0 Discharge is a 51-frame whiff
    //     risking everything for four damage. The gate is tier 2.
    //
    // ARC DASH is used as an approach and as an escape, and it is used
    // AGGRESSIVELY on purpose: a pass that connects pays back more charge than
    // it cost, so the bot chaining three passes through a body is playing the
    // character correctly rather than gambling.
    if (me.cfg.charge && !me.busy) {
      const tier = me.chargeTier;
      const sp = me.cfg.special;
      // never guard while it is cheap to be hit and expensive to block
      if (tier < 2 && this.plan === 'block') this.plan = 'strafe';
      // ---- ARC DASH — AND THE TWO GATES THAT WERE MISSING ------------------
      // MEASURED IN A LIVE MATCH: the first version fired it whenever it was
      // off cooldown and vaguely in range, threw twelve passes in fifty
      // seconds, and spent 144 Charge doing it. Since a pass that MISSES is a
      // flat -12 and only a pass that CONNECTS pays back +14, a bot that
      // throws it speculatively is a bot that disarms itself — the tier
      // distribution over that match was T0 14 / T1 20 / T2 0 / T3 0.
      //
      // So: it must be POINTED AT THEM (the blink goes where the stick goes,
      // and it only hits what is on that line), and it must be able to AFFORD
      // TO MISS — which means holding a comfortable buffer above the cost
      // rather than the bare cost, because dropping a tier is worth far more
      // than one pass of chip.
      const facingThem = Math.abs(((yawBetween(me.pos, foe.pos) - me.facing + Math.PI * 3)
        % (Math.PI * 2)) - Math.PI) < 0.5;
      if (me.specialCD <= 0 && me.charge >= (sp.chargeCost ?? 12) + 28
        && me.res.curCE >= sp.cost && facingThem
        && dist > 1.8 && dist < (sp.distance ?? 5.4) + 1.0) {
        // more willing the deeper it is into a chain that is already landing
        const want = me.arcChain > 0 ? 0.5 : 0.16;
        if (Math.random() < want) f.copy = true;
      }
      // DISCHARGE STRIKE, only when it is actually worth the engine
      if (tier >= (me.cfg.ct2.stunAt ?? 2) && dist < 3.0 && me.res.curCE >= me.cfg.ct2.cost
        && (foe.state === 'attack' || foe.state === 'ct' || foe.state === 'getup'
          || foe.state === 'blockstun' || Math.random() < 0.20)) {
        f.ct2 = true;
      } else if (tier >= 1 && dist > 4.5 && me.res.curCE >= me.cfg.ct1.cost
        && Math.random() < 0.28) {
        // LIGHTNING BOLT from range, and only from tier 1 up: at tier 0 it is a
        // 5 m poke that would not even reach.
        f.ct1 = true;
      }
    }

    // =======================================================================
    // INUMAKI — THE COMMANDER
    // =======================================================================
    // The only profile in this file whose primary resource is not cursed
    // energy, and the only one that has to decide WHICH MOVE A BUTTON IS
    // before it decides whether to press it.
    //
    // FIVE RULES, and they are the whole profile:
    //
    //  1. KEEP DISTANCE. He is a support-grade sorcerer with 2.6-damage
    //     normals; the punch string exists to grow MAX_CE and for nothing
    //     else. The plan set below gives him the zoner's spacing game.
    //  2. OPEN WITH DON'T MOVE. It is cheap, it is fast, and everything else
    //     in the kit is a follow-up to it. The bot deliberately does NOT lead
    //     with a heavy word: an unset-up Blast Away is a 44-frame utterance
    //     thrown at somebody who is free to walk into it and interrupt.
    //  3. FOLLOW WITH A HEAVY COMMAND while they are rooted. That is the
    //     combo, and it is the only sequence the bot actually plays.
    //  4. RUN AWAY TO ESCAPE PRESSURE, not to open. It is the panic button
    //     and it is checked before everything else, because by the time the
    //     bot is deciding what to say it may already be in a string.
    //  5. MANAGE THE THROAT rather than burning it. `_throatBudget` below is
    //     the one line that makes the difference between a bot that plays the
    //     character and a bot that says two words and spends the rest of the
    //     round silent — it refuses a heavy command that would leave him with
    //     no cheap one, which is exactly the decision a human is making.
    if (me.cfg.commands && !me.busy && me.grounded) {
      const C = me.cfg.commands.defs;
      const canSay = (k, reserve = 0) => speechAffordable(me, C[k]) && this._throatBudget(me, C[k], reserve);
      const inRange = k => dist <= C[k].range - 0.6;   // margin: they move
      const bound = sl => speechBoundKey(me, sl);

      // ---- 4. THE PANIC BUTTON, checked first ---------------------------
      // Being inside two and a half metres of anybody is a losing position for
      // him, and RUN AWAY is the answer whether or not it is currently bound —
      // if it is not, the wheel gets it (see the binding block below).
      const pressured = dist < 2.8 && (foe.state === 'attack' || foe.state === 'ct'
        || foe.state === 'run' || foe.state === 'dash');
      if (pressured && bound('ct1') === 'run_away' && canSay('run_away')
        && inRange('run_away') && Math.random() < 0.45) {
        f.ct1 = true;
        { this._edges(f); return f; }
      }

      // ---- 3. THE FOLLOW-UP ---------------------------------------------
      // They are rooted, frozen, knocked down or wading. This is the window
      // the whole character is built to create, and the bot spends its most
      // expensive word in it — which is the correct read, because a heavy
      // utterance is only safe when the opponent cannot reach him.
      const helpless = ['rooted', 'frozen', 'knockdown', 'launched', 'getup'].includes(foe.state)
        || foe.sleepT > 0;
      const heavyKey = bound('ct2');
      if (helpless && canSay(heavyKey) && inRange(heavyKey) && Math.random() < 0.7) {
        f.ct2 = true;
        { this._edges(f); return f; }
      }

      // ---- 2. THE OPENER -------------------------------------------------
      // Mid range, they are coming, and nothing is happening yet.
      const lightKey = bound('ct1');
      if (!helpless && dist > 3.0 && canSay(lightKey, C[heavyKey].throat) && inRange(lightKey)
        && Math.random() < 0.20) {
        f.ct1 = true;
        { this._edges(f); return f; }
      }

      // ---- 1b. THE BINDINGS ----------------------------------------------
      // A TAP of B commits the wheel's default, which is whatever is already
      // bound — so the bot cannot use a tap to change anything. It holds the
      // ring instead, and it only does so when it genuinely wants a different
      // word, which is: it is under pressure and does not have RUN AWAY on
      // RB, or its heavy slot holds something it can no longer afford.
      //
      // `_cmdSwap` runs the hold across several frames the way a human does.
      if (this._cmdSwap) {
        this._cmdSwap.t -= dt;
        f.copy = true;                       // keep the ring open
        // the stick picks the sector; `_wheelPick` reads it as an angle
        const n = me.cfg.commands.order.length;
        const a = (this._cmdSwap.idx / n) * Math.PI * 2;
        f.move.x = Math.sin(a); f.move.z = -Math.cos(a);
        if (this._cmdSwap.slot === 'ct1') f.ct1 = true; else f.ct2 = true;
        if (this._cmdSwap.t <= 0) this._cmdSwap = null;   // release confirms
        { this._edges(f); return f; }
      }
      if (me.specialCD <= 0 && this.thinkT <= 0) {
        let want = null;
        const defaults = me.cfg.commands.defaults;
        if (pressured && bound('ct1') !== 'run_away' && speechAffordable(me, C.run_away)) {
          want = { key: 'run_away', slot: 'ct1' };
        } else if (bound('ct2') !== defaults.ct2 && speechAffordable(me, C[defaults.ct2])) {
          // ...and put the payoff back when it can afford it again.
          want = { key: defaults.ct2, slot: 'ct2' };
        } else if (bound('ct1') !== defaults.ct1 && !pressured && speechAffordable(me, C[defaults.ct1])) {
          want = { key: defaults.ct1, slot: 'ct1' };
        }
        // THE BOT DOES NOT DOWNGRADE ITS HEAVY SLOT, and that is a deliberate
        // deletion rather than an omission. The first version rebound ct2 to
        // "the most expensive word I can still afford" whenever the real one
        // went out of reach — which sounds like throat management and is a
        // trap, because `_openWheel` filters `avail` by affordability and
        // `_wheelPick` snaps to the nearest AVAILABLE sector. At RAW the only
        // available sectors are the cheap ones, so the wheel handed it DON'T
        // MOVE, its heavy slot became its light slot, the reserve calculation
        // collapsed, and it spammed one word for the rest of the match.
        // Measured: 24 DON'T MOVEs to 3 GET CRUSHEDs, and 24 of 60 seconds at
        // RAW. Waiting for the throat is the correct answer and it is free.
        if (want && Math.random() < 0.5) {
          this._cmdSwap = {
            idx: me.cfg.commands.order.indexOf(want.key),
            slot: want.slot,
            t: rand(0.30, 0.45)              // comfortably past TAP_MAX
          };
          f.copy = true;
          { this._edges(f); return f; }
        }
      }
    }

    // ---- planning -----------------------------------------------------------
    if (this.thinkT <= 0) {
      this.thinkT = rand(0.14, 0.3);
      const brawler = !!me.cfg.blackFlash; // yuji: walk them down
      const zoner = me.cfg.special?.key === 'jogo_overheat'; // jogo: keep them out
      // megumi AND geto: fight from behind the summons, not in front of them.
      // The existing `summoner` plan set is exactly right for Geto too — hold
      // mid range, poke when they come in, never commit to a long approach —
      // so he reads the same flag rather than getting a near-duplicate branch.
      const summoner = !!me.cfg.shikigami || !!me.cfg.curses;
      // NAOYA: the harasser. Constant short approaches and strings, and he is
      // the one profile that is happy to be point blank, because his frame
      // advantage means he wins the exchange after the exchange.
      const harasser = me.cfg.special?.key === 'naoya_stance';
      // hakari: patient. The whole pre-domain game is banking MAX_CE without
      // dying, so it favours the punch string (which is what actually grows
      // the bar) and the guard (which is above average) over throwing
      // techniques it will need the meter for.
      const gambler = me.cfg.special?.key === 'hakari_shutter';
      // HIGURUMA: the survivor. His profile is the most defensive on the
      // roster because his win condition is not in the fight — it is forty
      // seconds away, and every exchange he ducks is one he did not lose.
      const attorney = me.cfg.special?.key === 'higuruma_judgeman';
      // INUMAKI: the commander. He gets the ZONER's plan set outright rather
      // than a near-duplicate — hold range, never chase, leave the instant
      // anybody closes — because that IS his game, and the difference between
      // him and Jogo is entirely in the block above rather than in how he
      // walks. The one thing he does that Jogo does not is go and PUNCH when
      // his throat is spent, because MAX_CE is the only path back to his
      // ultimate and his fists are the only thing that grows it.
      const commander = !!me.cfg.commands;
      // ---- URO: THE AERIAL ZONER ------------------------------------------
      // She gets her own flag rather than sharing Jogo's because her plan set
      // has a vertical axis nobody else's does. The rules, in order:
      //   1. BE IN THE AIR. If she is grounded and has the stamina, jump.
      //   2. KEEP DISTANCE. Same instinct as the zoner, executed by drifting.
      //   3. LAND, ONLY TO RECOVER. Stamina is the leash and the bot respects
      //      it: below a quarter tank it comes down deliberately and waits
      //      rather than being dropped out of the sky mid-approach.
      const flier = !!me.cfg.flight;
      // ---- DAGON: THE PATIENT ONE -----------------------------------------
      // The most defensive profile in the game after Higuruma's, and for the
      // same structural reason: his win condition is not in the exchange, it
      // is forty seconds away in the domain. He blocks, he soaks, he throws
      // the volley to keep the bar moving, and he does not chase.
      const tide = me.cfg.special?.key === 'dagon_summon';
      // ultimate when charged (domain casters look for space first)
      if (me.charged && this.planT <= 0) {
        // ---- GETO: THE ONE ULTIMATE GATE THAT IS NOT ABOUT METER -----------
        // Uzumaki is worth 198 damage with a full stable and 27 with a spent
        // one, so "the bar is full" is not remotely enough information to fire
        // it. The bot holds until the stable is at least half its starting
        // weight — and if the stable has been ground down below that, it does
        // NOT fire at all and keeps playing the summon game instead, which is
        // the correct read and also the one that punishes an opponent for
        // ignoring the curses.
        //
        // The exception is being about to lose: at low health it takes the
        // 27-damage version, because a bad ultimate beats no ultimate when the
        // alternative is dying with a full bar.
        if (me.cfg.curses) {
          const w = this.match.curses.uzumakiCount(me).weight;
          const desperate = me.res.hp < me.cfg.stats.hp * 0.25;
          if ((w >= 10 || desperate) && dist < 16) this.plan = 'ultimate';
        }
        else if (!me.cfg.domain || dist > 2.5) this.plan = 'ultimate';
      } else if (this.planT <= 0) {
        const r = Math.random();
        if (commander) {
          // SILENCED, or close to it: the character is temporarily not the
          // character. He has a punch string and nothing else, so the bot
          // stops playing keep-away and goes to earn meter — which is also
          // the most honest thing it can do, because standing at range doing
          // nothing while his gauge recovers is not a fight.
          const mute = me.throatTier >= 2 || me.voiceSpent;
          if (mute) {
            this.plan = dist > 3.0 ? 'approach' : r < 0.62 ? 'punch' : 'block';
          } else if (dist > 8.0) this.plan = r < 0.55 ? 'strafe' : 'approach';
          else if (dist > 3.2) this.plan = r < 0.45 ? 'strafe' : r < 0.75 ? 'backoff' : 'approach';
          else this.plan = r < 0.55 ? 'backoff' : r < 0.8 ? 'strafe' : 'punch';
          this.planT = rand(0.4, 1.0);
        } else if (zoner) {
          // jogo plays the opposite game: hold range, throw fire, and leave
          // whenever anyone gets close. Punching is his last resort — but his
          // techniques cost real CE, so with an empty tank he has to go earn
          // some with his hands.
          const broke = me.res.curCE < me.cfg.ct1.cost;
          if (dist > 5.5) this.plan = broke ? 'approach' : r < 0.7 ? 'ct' : 'strafe';
          else if (dist > 2.6) this.plan = broke ? (r < 0.6 ? 'approach' : 'punch') : r < 0.4 ? 'ct' : r < 0.75 ? 'backoff' : 'strafe';
          else this.plan = broke ? (r < 0.7 ? 'punch' : 'backoff') : r < 0.55 ? 'backoff' : r < 0.8 ? 'punch' : 'block';
        }
        else if (summoner) {
          // it wants the shikigami between it and them: hold mid range, poke
          // the string when they come in, and never commit to a long approach
          if (dist > 6) this.plan = r < 0.55 ? 'approach' : 'strafe';
          else if (dist > 2.6) this.plan = r < 0.4 ? 'strafe' : r < 0.7 ? 'approach' : 'backoff';
          else this.plan = r < 0.42 ? 'punch' : r < 0.62 ? 'backoff' : r < 0.82 ? 'block' : 'strafe';
        }
        else if (gambler) {
          // walk in, string, guard, repeat. Rush Blow is the only technique it
          // reaches for outside the domain, and only as a gap-closer.
          if (dist > 5.5) this.plan = r < 0.85 ? 'approach' : 'dashin';
          else if (dist > 2.2) this.plan = r < 0.55 ? 'approach' : r < 0.8 ? 'ct' : 'strafe';
          else this.plan = r < 0.6 ? 'punch' : r < 0.86 ? 'block' : 'strafe';
        }
        else if (attorney) {
          // STALL AND SURVIVE. It holds mid range, throws the gavel only when
          // there is space to recover from it, guards a lot, and disengages
          // the moment someone is on top of it. The punch string still gets
          // thrown, because landing punches is how MAX_CE grows and MAX_CE is
          // the courtroom — but it is never the plan, only the opportunity.
          // HEALTHY it punches, because landing punches is the ONLY thing
          // that grows MAX_CE and MAX_CE is the courtroom. HURT it disengages
          // and guards. The first pass had it blocking and backing off at full
          // health too, and the result was a bot that survived beautifully and
          // never once reached its own win condition.
          const hurt = me.res.hp < me.cfg.stats.hp * 0.45;
          if (dist > 6) this.plan = r < 0.72 ? 'approach' : 'strafe';
          else if (dist > 2.6) this.plan = r < 0.22 ? 'ct' : r < 0.74 ? 'approach' : r < 0.9 ? 'strafe' : 'backoff';
          else this.plan = hurt
            ? (r < 0.36 ? 'backoff' : r < 0.68 ? 'block' : r < 0.86 ? 'ct' : 'punch')
            : (r < 0.62 ? 'punch' : r < 0.76 ? 'ct' : r < 0.9 ? 'block' : 'strafe');
        }
        else if (me.cores) {
          // PANDA — the plan set follows whichever core is out, because the
          // three genuinely want different ranges. Gorilla holds the ground he
          // is standing on and waits for something to walk into it; the
          // Triceratops circles and pokes; the balanced core plays the ordinary
          // approach-and-string game. One profile for all three would have
          // wasted the entire point of the stances.
          if (me.stance === 'gorilla') {
            // he cannot chase, so he does not try. Guard, hold the space, and
            // punish whatever comes to him.
            if (dist > 5.0) this.plan = r < 0.55 ? 'approach' : 'block';
            else if (dist > 2.4) this.plan = r < 0.42 ? 'approach' : r < 0.72 ? 'block' : 'strafe';
            else this.plan = r < 0.58 ? 'punch' : r < 0.80 ? 'block' : r < 0.92 ? 'ct' : 'strafe';
          } else if (me.stance === 'trike') {
            if (dist > 5.5) this.plan = r < 0.6 ? 'dashin' : 'approach';
            else if (dist > 2.2) this.plan = r < 0.45 ? 'dashin' : r < 0.72 ? 'strafe' : 'approach';
            else this.plan = r < 0.62 ? 'punch' : r < 0.80 ? 'strafe' : r < 0.92 ? 'backoff' : 'block';
          } else {
            if (dist > 5.5) this.plan = r < 0.75 ? 'approach' : 'strafe';
            else if (dist > 2.2) this.plan = r < 0.50 ? 'approach' : r < 0.75 ? 'ct' : 'strafe';
            else this.plan = r < 0.60 ? 'punch' : r < 0.78 ? 'block' : r < 0.90 ? 'strafe' : 'backoff';
          }
        }
        else if (me.cfg.charge) {
          // KASHIMO — THE MOVEMENT PROFILE. Every branch resolves to something
          // that MOVES. There is no `block` anywhere in it below tier 2 and no
          // plan at any range that leaves the stick centred, because a Kashimo
          // standing still is a Kashimo disarming himself, and a bot that
          // occasionally paused would spend the round oscillating around tier 1
          // and never show the character off at all.
          //
          // `orbit` is the neutral: full-stick circling with dash held, which
          // builds at the maximum rate without committing. The bot spends most
          // of its time there when it does not have a reason to be in their
          // face, which is exactly the shape a good human Kashimo has.
          const hot = me.chargeTier >= 2;
          if (dist > 5.5) this.plan = r < 0.5 ? 'dashin' : r < 0.8 ? 'approach' : 'orbit';
          else if (dist > 2.2) this.plan = r < 0.42 ? 'dashin' : r < 0.68 ? 'orbit' : r < 0.9 ? 'approach' : 'ct';
          else this.plan = hot
            ? (r < 0.60 ? 'punch' : r < 0.76 ? 'ct' : r < 0.90 ? 'orbit' : 'block')
            : (r < 0.52 ? 'punch' : r < 0.86 ? 'orbit' : 'dashin');
        }
        else if (flier) {
          // she wants 5-10 m and altitude. `backoff` and `strafe` do the
          // drifting; `ct` is Thin Ice Breaker, which is her whole neutral.
          const low = me.res.stamina < me.cfg.stats.stamina * 0.25;
          if (low && !me.grounded) this.plan = 'backoff';       // come down and breathe
          else if (dist > 9) this.plan = r < 0.55 ? 'ct' : 'strafe';
          else if (dist > 4.5) this.plan = r < 0.45 ? 'ct' : r < 0.75 ? 'strafe' : 'backoff';
          else if (dist > 2.4) this.plan = r < 0.30 ? 'ct' : r < 0.72 ? 'backoff' : 'strafe';
          // point blank is where she loses. The bot leaves rather than trading.
          else this.plan = r < 0.62 ? 'backoff' : r < 0.84 ? 'strafe' : 'punch';
        }
        else if (tide) {
          // He does not approach and he does not retreat. He holds a slab of
          // mid range, blocks whatever comes to him, and spends the whole
          // early game feeding the bar — which for him is landing the volley
          // and the occasional string, since `ceGainPerPunch` is 8.4.
          const hurt2 = me.res.hp < me.cfg.stats.hp * 0.4;
          if (dist > 8) this.plan = r < 0.62 ? 'ct' : 'approach';
          else if (dist > 3.4) this.plan = r < 0.42 ? 'ct' : r < 0.70 ? 'approach' : 'block';
          else this.plan = hurt2
            ? (r < 0.52 ? 'block' : r < 0.80 ? 'punch' : 'backoff')
            : (r < 0.46 ? 'punch' : r < 0.78 ? 'block' : r < 0.90 ? 'ct' : 'strafe');
        }
        else if (harasser) {
          // never stops moving in, and up close it is almost entirely the
          // punch string — his normals are the fastest in the game and the
          // whole profile is built on winning the frame trade after each one.
          // Frame Kick is reserved for a knockdown-adjacent moment rather than
          // thrown in neutral, because its 26-frame tell is genuinely
          // punishable and the bot should not hand that over for free.
          if (dist > 5.5) this.plan = r < 0.55 ? 'dashin' : 'approach';
          else if (dist > 2.2) this.plan = r < 0.5 ? 'dashin' : r < 0.85 ? 'approach' : 'ct';
          else this.plan = r < 0.72 ? 'punch' : r < 0.84 ? 'ct' : r < 0.93 ? 'strafe' : 'block';
        }
        else if (dist > 5.5) this.plan = r < (brawler ? 0.9 : 0.7) ? 'approach' : 'ct';
        else if (dist > 2.2) {
          this.plan = brawler
            ? (r < 0.6 ? 'dashin' : r < 0.85 ? 'approach' : 'ct')
            : (r < 0.45 ? 'approach' : r < 0.7 ? 'ct' : r < 0.85 ? 'strafe' : 'dashin');
        }
        // up close the brawler mixes in techniques — they are his only Black
        // Flash openers, so a pure punch diet never shows the move off
        else if (brawler) this.plan = r < 0.58 ? 'punch' : r < 0.8 ? 'ct' : r < 0.9 ? 'block' : 'strafe';
        else this.plan = r < 0.62 ? 'punch' : r < 0.78 ? 'block' : r < 0.9 ? 'strafe' : 'backoff';
        this.planT = rand(0.4, 1.0);
      }
      // yuji: Divergent Bloom to catch wake-up. Read by EFFECT rather than by
      // slot: RB/RT hold the ranged move and the strong one respectively, and
      // which is which differs between the characters that share `blackFlash`.
      if (me.cfg.blackFlash && !me.busy) {
        const near = me.cfg.ct2?.effect === 'yuji_divergent' ? 'ct2' : 'ct1';
        if (foe.state === 'knockdown' && dist < 1.9 && me.res.curCE >= me.cfg[near].cost
          && Math.random() < 0.4) f[near] = true;
      }
      // ---- URO: GET OFF THE GROUND ---------------------------------------
      // The one thing a bot Uro has to do that no other profile does, and it
      // is the first thing it does. Sitting on the floor is not playing the
      // character: her aerial normals are as good as her grounded ones, her
      // techniques work in the air, and her guard is the worst in the game, so
      // there is almost never a reason to be down there.
      //
      // The two exceptions are both stamina: it will not take off without
      // enough in the tank to do something with the altitude, and it will not
      // take off at all under a quarter, which is when it should be standing
      // still getting the bar back. That produces the right rhythm on its own —
      // up, pressure, down, breathe — without a single timer.
      if (me.cfg.flight && !me.busy && me.grounded) {
        const st = me.res.stamina, max = me.cfg.stats.stamina;
        const wantAir = st > max * 0.42
          && (dist < 3.2 || this.plan === 'backoff' || this.plan === 'strafe' || Math.random() < 0.22);
        if (wantAir) f.jump = true;
      }
      // ...and while she IS up, hold jump to climb whenever she is low, so the
      // bot does not simply sink back to head height and get punished for it.
      if (me.cfg.flight && !me.grounded && me.hoverT > 0) {
        const floor = this.match.arena?.bounds?.floorAt(me.pos.x, me.pos.z, me.pos.y + 0.5) ?? 0;
        if (me.pos.y - floor < 3.4 && me.res.stamina > me.cfg.stats.stamina * 0.3) f.jump = true;
      }

      // ---- specials: each profile leans on its own signature -------------
      const spKey = me.cfg.special?.key;
      if (spKey && me.specialCD <= 0 && !me.busy) {
        // gojo: warp out of pressure (his defensive out)
        if (spKey === 'gojo_teleport' && dist < 2.2
          && (foe.state === 'attack' || foe.state === 'ct') && Math.random() < 0.25) f.copy = true;
        // nanami: buy a prime when there is space to time it
        if (spKey === 'nanami_ratio' && !me.ratioPrimed && dist > 3.2 && Math.random() < 0.06) f.copy = true;
        // todo: clap to close gaps, escape corners, slip out of pressure —
        // the swap IS his approach, so he reaches for it early and often
        if (spKey === 'todo_boogie' && me.res.curCE >= me.cfg.special.cost) {
          const cornered = Math.hypot(me.pos.x, me.pos.z) > me.arenaRadius - 1.6;
          if ((dist > 3.4 || cornered || (dist < 2.4 && foe.state === 'ct')) && Math.random() < 0.22) f.copy = true;
        }
        // jogo: Overheat when there's space to channel and meter to spend
        if (spKey === 'jogo_overheat' && me.buffs.overheat <= 0 && dist > 4
          && me.res.curCE >= me.cfg.special.cost && Math.random() < 0.12) f.copy = true;
        // hakari: the shutter is his answer to being zoned. It goes up when
        // he is walking into range from far out, or when he is being poked at
        // mid range — never point blank, where it would just eat one jab.
        if (spKey === 'hakari_shutter' && me.shutterT <= 0
          && me.res.curCE >= me.cfg.special.cost + 8) {
          const zonedOut = dist > 4.5 && (foe.state === 'ct' || foe.cfg.special?.key === 'jogo_overheat');
          if ((zonedOut || (dist > 3.2 && dist < 8)) && Math.random() < 0.20) f.copy = true;
        }
        // HIGURUMA: Judgeman goes up the instant he can afford it and goes
        // straight back up the instant it dies, because the evidence clock is
        // the only clock he is actually racing. It is put up from RANGE — the
        // summon is a long, unguarded animation and throwing it in someone's
        // face is how he dies.
        if (spKey === 'higuruma_judgeman' && !this.match.judgemen?.aliveFor(me)
          && me.res.curCE >= me.cfg.special.cost && dist > 3.0) f.copy = true;
        // ---- URO: REFLECT WHEN THEY COMMIT TO A PROJECTILE ----------------
        // The bot does not guess. It reads the OPPONENT'S ACTUAL STATE and the
        // live entity list, and puts the surface up only when something is
        // genuinely in the air or a ranged technique is genuinely committed —
        // which is exactly the read a human makes, and which means a bot Uro
        // is punished for it the same way a human is when the opponent baits
        // with a whiffed cast.
        if (spKey === 'uro_reflect' && me.res.curCE >= me.cfg.special.cost) {
          // something already flying at her, close enough to matter
          let incoming = false;
          for (const e of this.match.effects?.entities ?? []) {
            if (!e.pos || e.caster === me) continue;
            if (!REFLECTABLE[e.type]) continue;
            if (flatDist(e.pos, me.pos) < 7) { incoming = true; break; }
          }
          // ...or they are mid-cast on a technique that produces one, at a
          // range where it will reach her
          const committing = foe.state === 'ct' && dist > 3.5 && dist < 16;
          if ((incoming || (committing && Math.random() < 0.55)) && Math.random() < 0.7) f.copy = true;
        }
        // ---- DAGON: KEEP ONE IN THE WATER ---------------------------------
        // Same instinct as Mahito's — he never fights alone by choice — but
        // capped at one outside the domain, so the bot only re-summons when
        // the field is empty. It does it from RANGE: the cast is 26 frames of
        // standing still and doing it in someone's face is how he dies before
        // reaching the thing he is playing for.
        if (spKey === 'dagon_summon'
          && (this.match.ocean?.countFor(me) ?? 0) < (me.cfg.special.maxOutside ?? 1)
          && me.res.curCE >= me.cfg.special.cost && dist > 3.2 && Math.random() < 0.45) f.copy = true;
        // mahito: summon IMMEDIATELY — he never fights alone by choice, and he
        // keeps summoning until he is at his cap
        if (spKey === 'mahito_summon'
          && (this.match.minions?.countFor(me) ?? 0) < (me.cfg.special.maxMinions ?? 3)
          && me.res.curCE >= me.cfg.special.cost && dist > 1.8 && Math.random() < 0.5) f.copy = true;
      }
      // todo: hunt the command grab on a grounded target in range
      if (me.cfg.ct2?.effect === 'todo_grab' && dist < 1.8 && foe.grounded && !me.busy
        && me.res.curCE >= me.cfg.ct2.cost && Math.random() < 0.3) f.ct2 = true;
      // reactive block: foe is swinging at close range
      if (dist < 2.6 && (foe.state === 'attack' || foe.state === 'ct') && Math.random() < 0.35) {
        this.plan = 'block';
        this.blockT = rand(0.3, 0.7);
      }
      // use copy when holding one
      if (me.copySlot && dist < 6 && Math.random() < 0.3) { f.copy = true; }
    }

    // ---- act on plan --------------------------------------------------------
    // movement is character-relative now: -z advances along the facing axis
    // (soft-locked to the opponent), +x strafes right. No yaw math needed.
    const toward = { x: 0, z: -1 };
    switch (this.plan) {
      case 'approach':
        f.move.x = toward.x; f.move.z = toward.z;
        if (dist > 6 && me.res.stamina > 40) f.dash = true;
        break;
      case 'dashin':
        f.move.x = toward.x; f.move.z = toward.z;
        f.dash = me.res.stamina > 20;
        if (dist < 2.0) this.plan = 'punch';
        break;
      case 'strafe': {
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1);
        f.move.z = -0.25; // drift in while circling
        break;
      }
      // KASHIMO ONLY — the plan that exists so the bot is never standing
      // still. Circling at full stick with dash held builds charge at the
      // maximum rate while keeping distance, which is what a good player does
      // with him when they do not want to commit yet. Every other character
      // would just be wasting stamina, which is why it is its own plan rather
      // than a change to `strafe`.
      case 'orbit': {
        f.move.x = (this.strafeDir ??= Math.random() < 0.5 ? 1 : -1);
        f.move.z = dist > 5 ? -0.6 : dist < 2.4 ? 0.5 : -0.1;
        f.dash = me.res.stamina > 12;
        if (this.planT <= 0) this.plan = 'approach';
        break;
      }
      case 'backoff':
        f.move.x = -toward.x * 0.8; f.move.z = -toward.z * 0.8;
        if (this.planT <= 0) this.plan = 'approach';
        break;
      case 'punch':
        if (dist > 2.2) { this.plan = 'approach'; break; }
        if (this.punchT <= 0) {
          // occasionally cash the string out with the knockdown swing — it is
          // slow enough to punish, so keep it a mix-up rather than a habit
          const heavy = !me.busy && dist < 1.9 && me.res.stamina > (me.cfg.heavy?.staminaCost ?? 20) + 15
            && Math.random() < 0.18;
          if (heavy) { f.heavy = true; this.punchT = rand(0.6, 1.0); }
          else { f.punch = true; this.punchT = rand(0.12, 0.3); }
        }
        break;
      case 'block':
        f.block = true;
        if (this.blockT <= 0 && this.planT <= 0) this.plan = 'punch';
        break;
      case 'ct': {
        // The brawler picks by range instead of at random — his techniques are
        // his only Black Flash openers, so throwing one from out of reach
        // wastes the opening. Divergent Bloom is point-blank (reach 3.2), the
        // Manji Slash is the gap-closer; from further out he just keeps
        // walking in. Both are found by EFFECT, because Yuji holds the Manji
        // on RB (his furthest) and Nobara — who shares `blackFlash` — does
        // not have either move at all.
        const bfNear = me.cfg.ct2?.effect === 'yuji_divergent' ? 'ct2' : 'ct1';
        const bfFar = bfNear === 'ct2' ? 'ct1' : 'ct2';
        const pick = me.cfg.blackFlash
          ? (dist < 1.9 ? bfNear : dist < 4.5 ? bfFar : null)
          : me.cfg.ct2?.effect === 'todo_grab'
            ? (dist < 3 ? 'ct1' : null) // the grab is hunted separately, in range
            : me.cfg.ct2?.effect === 'jogo_eruption'
              // jogo: Eruption is placed where you're ABOUT to be — on your
              // wake-up, or under your feet as you run at him; Embers are the
              // default fill from range
              ? ((foe.state === 'knockdown' || foe.state === 'getup'
                || (dist < 6 && foe.state === 'run')) && Math.random() < 0.7 ? 'ct2' : 'ct1')
              : me.cfg.ct2?.effect === 'higuruma_confiscate'
                // HIGURUMA: CONFISCATION is a survival tool, so it is used
                // like one. It goes up when he is losing, or when the thing
                // hurting him is close enough to take — and it takes whatever
                // they have been leaning on (fighter.confiscate reads their
                // own usage). The gavel is the fallback when there is room to
                // throw its 26 frames of startup.
                ? (dist < 1.9 && !foe.lockedSlot
                  && (me.res.hp < me.cfg.stats.hp * 0.55 || Math.random() < 0.45) ? 'ct2'
                  : dist < 2.6 ? 'ct1' : null)
                : (Math.random() < 0.55 ? 'ct1' : 'ct2');
        // the summoner's slots are handled above (they are shikigami, not
        // techniques, and their cost depends on what is bound)
        if (me.cfg.shikigami) { this.plan = 'strafe'; break; }
        let choice = pick;
        // ROTATE AGAINST ADAPTATION. If the thing it is fighting has adapted
        // to one of its two slots much harder than the other, favour the other
        // one. It is a nudge, not a solver — the bot should look like it is
        // noticing, not like it is reading the table.
        if (choice && foe.adapt && me.cfg.ct1 && me.cfg.ct2) {
          const r1 = foe.adapt.reductionFor('ct1'), r2 = foe.adapt.reductionFor('ct2');
          if (Math.abs(r1 - r2) > 0.2 && Math.random() < 0.75) choice = r1 < r2 ? 'ct1' : 'ct2';
        }
        const def = choice && me.cfg[choice];
        if (def && me.res.curCE >= def.cost && !me.busy) f[choice] = true;
        this.plan = 'approach';
        break;
      }
      case 'ultimate':
        if (me.charged && !me.busy) f.ult = true;
        this.plan = 'approach';
        this.planT = 1;
        break;
    }

    // ---- KASHIMO HOLDS DASH. ALWAYS. ---------------------------------------
    // The single most important line in his profile, and its absence was the
    // whole reason the first version of him played as a weak character: over a
    // fifty-second measured match the bot finished with FULL STAMINA and a mean
    // Charge of 30, which is tier 1 — it was walking everywhere.
    //
    // Every other character in the game dashes situationally because stamina is
    // scarce for them. It is not scarce for him: 15/s drain against 34/s regen
    // and a 145 pool means he can hold it for nearly ten seconds and refill in
    // four. Walking is simply never correct on this character, so this is
    // applied AFTER the plan switch, over the top of whatever it decided, for
    // any plan that is moving at all.
    //
    // The 12-stamina floor is what keeps him from bottoming out entirely, so a
    // real dash is always available when he actually needs to cross ground.
    if (me.cfg.charge && (f.move.x || f.move.z) && me.res.stamina > 12 && !me.busy) {
      f.dash = true;
    }

    // nanami: stop the sweep as the marker reaches the 7:3 line — a beat of
    // human imprecision keeps it landable but not perfect
    if (me.state === 'ratioSweep' && me.ratioSweep >= 0.64 && me.ratioSweep <= 0.74) f.copy = true;

    // wakeup: hold block briefly
    if (me.state === 'getup') f.block = Math.random() < 0.6;
    // occasionally jump in approach
    if (this.plan === 'approach' && Math.random() < 0.003) f.jump = true;

    // SHOWING OFF. Last thing decided, after every other button on the frame,
    // so it can only ever fire on a frame the bot had genuinely decided to do
    // nothing with. `_wantsTaunt` reads `f` and refuses if anything is set.
    //
    // THE STICK HAS TO BE RELEASED TOO. A taunt is refused by the fighter if
    // the stick is pushed (fighter.js reads it behind a 0.35 deadzone, so that
    // a taunt never fires on the way into a walk) — and this bot is walking
    // almost every frame it is alive, which is why the first version set
    // `f.taunt` faithfully for two minutes and never produced one taunt.
    // Zeroing the movement here is the bot doing what a player does: stopping,
    // and then pressing the button.
    if (this._wantsTaunt(f, foe, dist)) {
      f.taunt = true;
      f.move.x = 0; f.move.z = 0;
      f.dash = false; f.block = false;
    }

    this._edges(f);
    return f;
  }

  // Which summon (if any) is worth turning away from the fight to kill.
  //
  // The bar is deliberately high — a bot that chases every rabbit is a bot
  // that never fights. It commits only when something is genuinely on top of
  // it, and it sticks with a target once chosen so it does not dither between
  // two dogs while both chew on it.
  _pickSummon(me, foeDist) {
    const m = this.match;
    const cands = [];
    for (const s of m.shikigami?.list ?? []) {
      if (s.targetable && s.owner !== me) cands.push({ e: s, pos: s.pos, hp: s.hp, maxHp: s.maxHp });
    }
    for (const mn of m.minions?.list ?? []) {
      if (mn.alive && mn.owner !== me) cands.push({ e: mn, pos: mn.pos, hp: mn.hp, maxHp: mn.maxHp });
    }
    // JUDGEMAN is a target like any other summon, and a more urgent one than
    // most: it does not fight back, but every second it stands there is
    // evidence, and evidence is what shortens the sequence in the duel the bot
    // may be about to lose. Breaking it is the counterplay to Higuruma.
    for (const j of m.judgemen?.list ?? []) {
      if (j.targetable && j.owner !== me) cands.push({ e: j, pos: j.pos, hp: j.hp, maxHp: j.maxHp });
    }
    if (!cands.length) { this._summonTarget = null; return null; }

    // Engagements are TIME-BOXED in both directions. Without the commit clock
    // the bot latches onto a Divine Dog — which chases, so it never leaves the
    // 7 m leash — and spends the entire round swiping at it while the summoner
    // stands untouched. Measured: 81% of the fight spent on summons and almost
    // no damage traded either way. Chase for a couple of seconds, then go back
    // to the person you are actually fighting.
    this._summonRest = Math.max(0, (this._summonRest ?? 0) - 1 / 60);
    if (this._summonTarget) {
      this._summonCommit -= 1 / 60;
      const still = cands.find(c => c.e === this._summonTarget);
      if (still && this._summonCommit > 0 && flatDist(me.pos, still.pos) < 7) return still;
      this._summonTarget = null;
      this._summonRest = 2.6;
    }
    if (this._summonRest > 0) return null;
    // otherwise take the nearest one inside the commit range
    let best = null, bd = Infinity;
    for (const c of cands) {
      const d = flatDist(me.pos, c.pos);
      if (d < bd) { bd = d; best = c; }
    }
    // Commit rules: it has to be close, it has to be closer than the fight is
    // interesting, and a nearly-dead summon is always worth the last swing.
    const nearlyDead = best.hp <= best.maxHp * 0.34;
    const crowding = bd < 2.8;
    const foeFar = foeDist > 7 && bd < 6;
    if (!(crowding || foeFar || (nearlyDead && bd < 4.5))) return null;
    // never abandon a fight that is already at knife range for a summon
    if (foeDist < 2.0 && !nearlyDead) return null;
    this._summonTarget = best.e;
    // a fragile summon dies inside one string; a Great Serpent is not worth
    // standing on for any longer than this either way
    this._summonCommit = nearlyDead ? 1.4 : 2.6;
    return best;
  }

  _edges(f) {
    const p = this.prev;
    f.jumpP = f.jump && !p.jump; f.punchP = f.punch && !p.punch;
    f.heavyP = f.heavy && !p.heavy;
    f.ct1P = f.ct1 && !p.ct1; f.ct2P = f.ct2 && !p.ct2;
    f.ultP = f.ult && !p.ult; f.copyP = f.copy && !p.copy;
    f.tauntP = f.taunt && !p.taunt;
    f.blockP = f.block && !p.block;
    f.backP = f.back && !p.back;   // B — the execution duel needs all four
    this.prev = f;
  }

  // ---- TAUNTING ------------------------------------------------------------
  // When the bot decides to show off. Weighted by character (Todo and Naoya
  // constantly, Nanami and Higuruma almost never — see TAUNT_WEIGHT in
  // combat/taunts.js), but the weight is the LAST thing consulted. Everything
  // before it is the rule that the bot must never taunt somewhere that would
  // read as the AI being broken rather than the character being rude:
  //
  //   · never in or near a combo, on either side of it
  //   · never under pressure — no opponent inside striking range, and nobody
  //     mid-attack anywhere near it
  //   · never while it is holding a plan that wants the next second
  //   · never at low health. Losing badly and stopping to pose is the single
  //     most "the AI is stuck" thing it could do.
  //
  // It also refuses while a domain is up, which is the one place the brief
  // explicitly allows a taunt — because a HUMAN choosing to taunt inside
  // somebody's domain is funny, and a bot doing it automatically is just a bot
  // standing still in a domain.
  //
  // THE OPENING IS "I JUST WON AN EXCHANGE", NOT "I AM FAR AWAY.
  // The first version of this asked for 4.6 m of clear space. Instrumented over
  // a 60-second round that condition was false on 76% of frames and the bot
  // never taunted once — which is correct behaviour for a fighting-game AI
  // whose entire job is to be in your face, and a useless rule for a feature
  // about showing off. So the primary opening is the OPPONENT ON THE FLOOR,
  // which is both genuinely safe and the exact moment a person would do it.
  // The neutral-gap path stays as a second opening, at a distance the bot
  // actually reaches.
  _wantsTaunt(f, foe, dist) {
    const me = this.me;
    if (me.busy || !me.grounded || me.tauntCD > 0) return false;
    if (this._tauntGrace > 0) return false;             // ticked in `frame()`
    if (me.comboHits > 0) return false;                 // never mid-combo
    if (me.res.hp < me.cfg.stats.hp * 0.45) return false; // never while losing

    // OPENING 1 — they are down. Standing far enough back that this is not a
    // wake-up mix-up, which would make it a gameplay tool rather than a joke.
    const floored = ['knockdown', 'getup', 'guardBreak', 'launched'].includes(foe.state);
    const safeOnFloor = floored && dist > 2.0 && dist < 7.0;
    // OPENING 2 — a genuine gap in neutral, with nothing incoming.
    const safeInNeutral = !floored && dist > 4.2
      && !foe.busy && foe.state !== 'run' && foe.state !== 'dash' && foe.comboHits === 0;
    if (!safeOnFloor && !safeInNeutral) return false;

    // committed to something else on this very frame
    if (f.punch || f.ct1 || f.ct2 || f.copy || f.ult || f.block || f.dash || f.jump) return false;
    // anything at all going on
    if (this.match.domains.state || this.match.domains.clashState) return false;
    if (this.match.hitstopFrames > 0) return false;

    // ...and only then, the personality dice — at most one roll per 1.5 s.
    if (this._tauntRoll > 0) return false;
    this._tauntRoll = 1.5;
    // knocking someone down is the invitation, so it is weighted much higher
    if (Math.random() > this._tauntWeight * (safeOnFloor ? 0.45 : 0.14)) return false;
    this._tauntGrace = 7;          // and then leave it alone for a while
    return true;
  }
}
