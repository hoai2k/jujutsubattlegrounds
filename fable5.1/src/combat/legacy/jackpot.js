// ============================================================================
// IDLE DEATH GAMBLE — the reach-scenario machine and JACKPOT.
// ----------------------------------------------------------------------------
// This lives outside domains.js on purpose. The domain framework in that file
// is built on one hard assumption: everything a domain does begins when the
// barrier rises and ends when it comes down. Jackpot breaks that assumption —
// it is started by the domain and then runs for 99 seconds on its own clock,
// through the collapse, through the backlash, and (deliberately) past the
// point where the opponent has forgotten it was a domain at all.
//
// So the split is:
//   * domains.js owns the BARRIER — cast, sure-hit tick, clash, break, collapse.
//     Its only knowledge of this file is four call sites, all of them one line.
//   * this file owns the GAMBLE (barrier-scoped) and JACKPOT (not).
//   * match.js ticks this every logic frame, in the same block as effects and
//     shikigami, which is what lets Jackpot outlive its own domain.
//
// TWO SEPARATE LIFETIMES, and keeping them separate is the whole trick:
//   this.g   — the gamble. Technique counter, scenario queue, failure count.
//              Created by beginDomain(), destroyed by endDomain() no matter
//              how the barrier ends. A barrier break wipes ALL of it.
//   this.jp  — Jackpot. Created by _jackpot(), destroyed only by its own timer,
//              the fighter dying to something RCT cannot answer, or the round
//              ending. endDomain() does not touch it.
// ============================================================================
import { v3, rand } from '../../core/math.js';
import { JackpotTheme } from '../../audio/jackpot.js';

// The reel faces. '7' is the jackpot symbol, as it is on every real cabinet.
const SYMBOLS = ['7', '★', '♥', '◆', '♣', '◉', '8'];
const JACKPOT_SYM = 0;

// scenario timeline, as fractions of the tier's duration
const ROLL_AT = 0.72;   // the spin gives way to the drum roll here
const SHOW_AT = 0.90;   // the third reel lands here; the rest is the reaction

export class GambleSystem {
  constructor(match) {
    this.match = match;
    this.g = null;
    this.jp = null;
    this.theme = new JackpotTheme(match.sfx);
    this.symbols = SYMBOLS;
  }

  // ---- queries the rest of the game asks ----------------------------------
  inDomain(f) { return !!this.g && this.g.caster === f; }
  get jackpotFighter() { return this.jp?.f ?? null; }
  isJackpot(f) { return !!this.jp && this.jp.f === f; }

  // ---- barrier lifecycle ---------------------------------------------------
  beginDomain(caster) {
    const cfg = caster.cfg.domain.gamble;
    this.g = {
      caster, cfg,
      techniques: 0,       // CT uses since the last scenario fired
      queued: 0,           // scenarios owed but not yet started (one at a time)
      done: 0,             // scenarios resolved this domain
      fails: 0,            // consecutive misses — three arms the guarantee
      armed: false,
      scenario: null
    };
    this.match.hud.toast(caster, '私恋 — PLACE YOUR BETS');
  }

  // The barrier is gone, by ANY route: expiry, break, clash, dismissal,
  // interruption. Everything gamble-scoped dies here; Jackpot does not.
  endDomain(broken) {
    if (!this.g) return;
    const g = this.g;
    this.g = null;
    this.match.domainfx.setPachinkoArmed?.(false);
    if (g.scenario) this.match.sfx.reachFail();
    // Say out loud what was thrown away — this is the counterplay paying off,
    // and it should be legible to the person who earned it.
    if (broken && !this.jp) {
      this.match.hud.message('GAMBLE CANCELLED', 1.4);
      this.match.hud.toast(g.caster, 'THE HOUSE CLOSES');
    }
    // keep the grade honest: if Jackpot is live it owns the look now
    if (this.jp) this.match.stage.setGrade('jackpot');
  }

  // Every cursed-technique USE inside his own barrier. Two of them roll a
  // scenario. Note what this does NOT count: the SHUTTER (a special, not a
  // technique), punches, and — crucially — anything at all while he is locked
  // down by Unlimited Void, because a fighter in the `voided` state never
  // reaches startCT in the first place. Gojo stalls the counter by existing.
  noteTechnique(f) {
    const g = this.g;
    if (!g || g.caster !== f) return;
    g.techniques++;
    if (g.techniques < g.cfg.perTechniques) {
      this.match.sfx.reelTick(1);
      return;
    }
    g.techniques = 0;
    g.queued++;
    this._tryStartScenario();
  }

  _tryStartScenario() {
    const g = this.g;
    if (!g || g.scenario || g.queued <= 0) return;
    g.queued--;
    const guaranteed = g.fails >= g.cfg.guaranteeAfter;
    // the guaranteed scenario is always presented as a SUPER REACH: the
    // certainty has to look like the biggest thing the machine can do
    const tier = guaranteed
      ? g.cfg.tiers[g.cfg.tiers.length - 1]
      : this._rollTier(g.cfg.tiers, g.caster);
    // The caster's seeded stream, not Math.random. Which tier came up and
    // whether it paid are gameplay outcomes; online they have to be the same
    // outcome on every screen. See combat/fighter.js.
    const win = guaranteed || g.caster.rng() < tier.odds;
    g.scenario = {
      tier, guaranteed, win,
      t: tier.dur, dur: tier.dur,
      reels: [JACKPOT_SYM, JACKPOT_SYM, 1],
      spin: 0, tickT: 0, swellT: 0, shown: false
    };
    const m = this.match;
    m.hud.message(guaranteed ? '確定 — GUARANTEED' : tier.label, guaranteed ? 1.3 : 0.9);
    m.sfx.reachTier(tier.key);
    if (tier.key !== 'weak') {
      m.cam.shake(tier.key === 'super' ? 0.45 : 0.2);
      m.stage.flash(tier.key === 'super' ? 0.35 : 0.15);
    }
    if (tier.key === 'super') {
      m.stage.setGrade('reach');
      m.music?.duck(0.35, tier.dur);
    }
    m.domainfx.setReachTier?.(tier.key);
  }

  _rollTier(tiers, caster) {
    let total = 0;
    for (const t of tiers) total += t.weight;
    let r = (caster?.rng ? caster.rng() : Math.random()) * total;
    for (const t of tiers) { r -= t.weight; if (r <= 0) return t; }
    return tiers[0];
  }

  // ---- per-tick ------------------------------------------------------------
  update(dt) {
    if (this.g) this._updateGamble(dt);
    if (this.jp) this._updateJackpot(dt);
    this.theme.update(dt);
  }

  _updateGamble(dt) {
    const g = this.g;
    const m = this.match;
    const s = g.scenario;
    if (!s) { this._tryStartScenario(); return; }

    s.t -= dt;
    const k = 1 - s.t / s.dur;        // 0..1 progress

    if (k < SHOW_AT) {
      // the third reel spins, slowing as the result approaches
      s.spin += dt * (34 - k * 26);
      s.reels[2] = 1 + (Math.floor(s.spin) % (SYMBOLS.length - 1));
      s.tickT -= dt;
      if (s.tickT <= 0) {
        s.tickT = 0.05 + k * 0.14;
        m.sfx.reelTick(s.reels[2] % 4);
      }
    }
    // the escalating chime ladder, then the drum roll
    s.swellT -= dt;
    if (s.swellT <= 0) {
      if (k < ROLL_AT) {
        s.swellT = 0.42;
        m.sfx.reachSwell(k / ROLL_AT, s.tier.key);
      } else if (k < SHOW_AT) {
        s.swellT = 0.045;
        m.sfx.reachRoll((k - ROLL_AT) / (SHOW_AT - ROLL_AT));
      } else s.swellT = 1;
    }
    // super reach bleeds out of its window: the arena itself reacts
    if (s.tier.key === 'super' && k > 0.4 && Math.random() < 0.25) {
      m.cam.shake(0.06 + k * 0.12);
    }

    if (!s.shown && k >= SHOW_AT) {
      s.shown = true;
      s.reels[2] = s.win ? JACKPOT_SYM : (1 + Math.floor(g.caster.rng() * (SYMBOLS.length - 1)));
      if (s.win) {
        // Clear the scenario BEFORE the payout: _jackpot brings the barrier
        // down, and endDomain() plays a "reach failed" sting if it finds a
        // scenario still mid-spin. This is the win — it must not sound like one.
        g.scenario = null;
        g.fails = 0;
        g.armed = false;
        g.done++;
        m.domainfx.setReachTier?.(null);
        m.domainfx.setPachinkoArmed?.(false);
        this._jackpot(g.caster);
        return;
      }
      m.sfx.reachFail();
      m.hud.toast(g.caster, 'NO HIT');
    }

    if (s.t <= 0) {
      g.scenario = null;
      g.done++;
      g.fails++;
      if (s.tier.key === 'super') m.stage.setGrade('pachinko');
      m.domainfx.setReachTier?.(null);
      // THE GUARANTEE ARMS. Both players are told, loudly: the parlor changes
      // colour, the music shifts, and the opponent now has to decide between
      // breaking the barrier and running the clock out.
      if (g.fails >= g.cfg.guaranteeAfter && !g.armed) {
        g.armed = true;
        m.hud.message('NEXT REACH — GUARANTEED', 1.8);
        m.sfx.gambleArmed();
        m.music?.duck(0.4, 2.2);
        m.domainfx.setPachinkoArmed?.(true);
        m.cam.shake(0.35);
        m.stage.flash(0.3);
      }
      this._tryStartScenario();
    }
  }

  // ---- JACKPOT -------------------------------------------------------------
  _jackpot(f) {
    const m = this.match;
    const cfg = f.cfg.jackpot;
    // A SECOND JACKPOT REFRESHES, IT DOES NOT STACK. Domains are re-castable,
    // so he can open a second parlor while the first window is still running
    // and hit again. The clock goes back to full rather than adding a second
    // 99 seconds, and the outstanding RCT debt is CARRIED — wiping `pending`
    // here would quietly forgive damage the ledger already owes him.
    const prev = f.jackpot;
    if (prev && prev.t > 0) m.hud.toast(f, '大当り REFRESHED');
    f.jackpot = {
      t: cfg.duration, dur: cfg.duration,
      pending: prev?.pending ?? 0, healT: prev?.healT ?? 0, fxT: 0,
      rct: cfg.rct, floor: cfg.hpFloor ?? 1
    };
    this.jp = { f, cfg, poseT: cfg.poseFrames / 60 };

    // A cooldown already in flight has to be wiped, not just prevented from
    // being set: he can enter Jackpot with eight seconds left on the Shutter,
    // and "no cooldowns" has to mean the Gold Rush is available NOW.
    f.specialCD = 0;
    f.shutterT = 0;

    // the full-screen takeover
    f.vel.set(0, 0, 0);
    f.activeHit = null;
    f.iFrames = Math.max(f.iFrames, cfg.poseFrames);
    const hold = {
      name: 'JACKPOT', kind: 'ct', slot: 'jackpot',
      startup: Math.round(cfg.poseFrames * 0.36), active: 1,
      recovery: cfg.poseFrames - Math.round(cfg.poseFrames * 0.36) - 1,
      clip: 'jackpotPose'
    };
    f.setState('ct', { move: hold });
    f._syncMoveAnim(hold, 'jackpotPose');
    f.model.setJackpot?.(true);

    m.hud.cutin(f, 'JACKPOT', '大当り  IDLE DEATH GAMBLE');
    m.hud.message('JACKPOT', 2.2);
    m.sfx.jackpotFanfare();
    m.hitstop(26);                       // the stop-and-hold impact frame
    m.slowmo(1.1, 0.32);
    m.stage.flash(1.0);
    m.stage.setGrade('jackpot');
    m.cam.cinematic(f.pos, 2.6, 3.1, 1.75);
    m.cam.shake(1.2);
    m.cam.fovKick(14);
    m.domainfx.jackpotErupt?.(f);
    this._confetti(f, 90);

    // the theme takes the room: the streamed track ducks almost to nothing for
    // the whole window and the procedural march plays on top of it
    m.music?.duck(0.05, cfg.duration + 1);
    this.theme.start();
    m.fx.buffAura(f, cfg.duration, cfg.aura ?? 0xffc93c);

    // THE PARLOR COMES DOWN WITH THE PAYOUT. The barrier existed to reach this
    // moment; once it lands he takes Jackpot outside and fights the rest of the
    // window in the real arena. Nothing above is barrier-scoped, so the state
    // survives the collapse untouched.
    m.domains?.collapseForJackpot(f);
  }

  _updateJackpot(dt) {
    const jp = this.jp;
    const m = this.match;
    const f = jp.f;
    const st = f.jackpot;
    if (!st) { this.jp = null; return; }

    // Death by something RCT cannot answer (Mahito's transfiguration sets HP
    // to zero directly rather than dealing damage) ends it immediately. He was
    // never invulnerable; he was only ever un-damageable.
    if (!f.alive || f.eliminated) { this._endJackpot(false); return; }

    st.t -= dt;

    // ---- REVERSE CURSED TECHNIQUE ----
    // The damage already landed and is already on the bar. After a short beat
    // it is paid back, fast but visibly. This is deliberately not an
    // invulnerability flag: the player has to see the number go down and come
    // back or the mechanic reads as a bug.
    if (st.pending > 0) {
      if (st.healT > 0) st.healT -= dt;
      else {
        const give = Math.min(st.pending, st.rct.rate * dt);
        st.pending -= give;
        // `maxHP` — the active core's ceiling for Panda, unchanged for everyone else
        f.res.hp = Math.min(f.maxHP, f.res.hp + give);
        st.fxT -= dt;
        if (st.fxT <= 0) {
          st.fxT = 0.07;
          m.fx._spawn(f.pos.clone().add(v3(rand(-0.45, 0.45), rand(0.4, 1.9), rand(-0.45, 0.45))), {
            color: Math.random() < 0.4 ? 0xfff3c4 : 0xffc93c, size: rand(0.12, 0.30),
            life: rand(0.3, 0.55), vel: v3(rand(-0.6, 0.6), rand(1.4, 3.4), rand(-0.6, 0.6))
          });
        }
        if (st.pending <= 0.01) {
          st.pending = 0;
          m.fx._ring(f.pos.clone().add(v3(0, 1.2, 0)), 0xffc93c, { size: 0.45, growRate: 7, life: 0.35, flat: false });
          m.sfx.rctHeal();
          // the heal reads on the body too, when there is a gap to read it in
          if (!f.busy && f.alive) f.anim.play('rct', { fade: 0.06, restart: true });
        }
      }
    }

    // the constant golden trail
    jp.trailT = (jp.trailT ?? 0) - dt;
    if (jp.trailT <= 0) {
      jp.trailT = 0.055;
      m.fx._spawn(f.pos.clone().add(v3(rand(-0.5, 0.5), rand(0.1, 2.0), rand(-0.5, 0.5))), {
        color: Math.random() < 0.3 ? 0xfff3c4 : 0xffc93c, size: rand(0.08, 0.22),
        life: rand(0.35, 0.7), opacity: 0.8, vel: v3(rand(-0.3, 0.3), rand(0.5, 1.6), rand(-0.3, 0.3))
      });
    }

    // last five seconds: the machine starts counting down at you
    if (st.t <= 5 && Math.floor(st.t) !== jp.lastTick) {
      jp.lastTick = Math.floor(st.t);
      if (st.t > 0) m.sfx.reelTick(3);
    }
    if (st.t <= 0) this._endJackpot(true);
  }

  // THE COMEDOWN. Music cut, aura gone, base kit back, and a backlash worse
  // than any domain's: MAX_CE reset AND no regeneration at all for twelve
  // seconds, with growthMult 0 so landing punches cannot rebuild it either.
  _endJackpot(ranOut) {
    const jp = this.jp;
    if (!jp) return;
    const m = this.match;
    const f = jp.f;
    const bl = jp.cfg.backlash ?? { duration: 12, growthMult: 0 };
    this.jp = null;
    f.jackpot = null;
    f.model.setJackpot?.(false);
    // the counter stance never survives the form it belongs to
    f.counterT = 0;
    this.theme.stop();
    m.music?.duck(1, 0);
    if (!f.alive) return;
    f.consumeFullBar();
    f.backlash = bl.duration;
    f.backlashGrowthMult = bl.growthMult ?? 0;
    m.stage.setGrade(m.mapGrade || 'neutral');
    if (ranOut) {
      m.sfx.jackpotEnd();
      m.hud.message('CASHED OUT', 1.2);
      m.hud.toast(f, 'THE HOUSE TAKES IT BACK');
      m.cam.shake(0.3);
    }
  }

  // ---- presentation helpers -----------------------------------------------
  _confetti(f, n) {
    const m = this.match;
    const COLORS = [0xffc93c, 0xff5fc8, 0x5fd0ff, 0xffffff, 0x6fe89a, 0xff5f4f];
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, 5);
      m.fx._spawn(f.pos.clone().add(v3(Math.sin(a) * r, rand(2, 9), Math.cos(a) * r)), {
        color: COLORS[i % COLORS.length], size: rand(0.10, 0.26), aspect: rand(0.4, 2.2),
        life: rand(1.2, 2.6), opacity: 0.95, gravity: rand(2, 5),
        vel: v3(rand(-3, 3), rand(-1, 3), rand(-3, 3)), spin: rand(-6, 6)
      });
    }
    // coins pouring out of the machines
    for (let i = 0; i < 40; i++) {
      const a = rand(0, Math.PI * 2);
      m.fx._spawn(f.pos.clone().add(v3(Math.sin(a) * rand(1, 7), rand(0.2, 4), Math.cos(a) * rand(1, 7))), {
        color: i % 3 ? 0xffc93c : 0xfff3c4, size: rand(0.12, 0.22),
        life: rand(0.8, 1.8), gravity: 9,
        vel: v3(rand(-2, 2), rand(5, 11), rand(-2, 2))
      });
    }
    m.fx._ring(f.pos.clone().setY(0.08), 0xffc93c, { size: 1.0, growRate: 26, life: 0.9 });
    m.fx._ring(f.pos.clone().setY(0.08), 0xffffff, { size: 0.6, growRate: 34, life: 0.7 });
  }

  // ---- HUD read ------------------------------------------------------------
  // Everything the pachinko panel needs, and nothing it does not. Both players
  // see all of it: the counter, the tier, the reels, and the failure meter.
  snapshot() {
    const g = this.g;
    const jp = this.jp;
    return {
      gamble: g && {
        name: g.caster.cfg.name,
        techniques: g.techniques,
        perTechniques: g.cfg.perTechniques,
        fails: g.fails,
        need: g.cfg.guaranteeAfter,
        armed: g.armed,
        scenario: g.scenario && {
          tier: g.scenario.tier.key,
          label: g.scenario.tier.label,
          jp: g.scenario.tier.jp,
          odds: g.scenario.guaranteed ? 1 : g.scenario.tier.odds,
          guaranteed: g.scenario.guaranteed,
          reels: g.scenario.reels.map(i => SYMBOLS[i]),
          shown: g.scenario.shown,
          hit: g.scenario.shown && g.scenario.win,
          k: 1 - g.scenario.t / g.scenario.dur
        }
      },
      jackpot: jp && {
        name: jp.f.cfg.name,
        t: Math.max(0, jp.f.jackpot?.t ?? 0),
        dur: jp.cfg.duration,
        healing: (jp.f.jackpot?.pending ?? 0) > 0
      }
    };
  }

  // round boundary: nothing survives it
  resetRound() {
    this.g = null;
    if (this.jp) {
      const f = this.jp.f;
      f.jackpot = null;
      f.model.setJackpot?.(false);
      this.jp = null;
    }
    this.theme.stop();
    this.match.music?.duck(1, 0);
    this.match.domainfx.setPachinkoArmed?.(false);
    this.match.domainfx.setReachTier?.(null);
  }

  dispose() { this.theme.stop(); }
}
