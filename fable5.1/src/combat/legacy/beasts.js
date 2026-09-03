// ===========================================================================
// 来訪瑞獣 — THE AUSPICIOUS BEASTS. Ino's technique, and the EIGHTH ally family.
// ===========================================================================
// ---------------------------------------------------------------------------
// *** THE ONE PARAGRAPH THAT MAKES THIS NOT A SUMMON SYSTEM ***
// ---------------------------------------------------------------------------
// Ino is not a summoner. He is a MEDIUM. Canon, quoted: "rather than summoning
// separate creatures, Ino becomes a spiritual medium that can use the
// abilities of four auspicious beasts... the abilities manifest through his
// body rather than appearing as independent entities."
//
// So this file is deliberately, structurally NOT combat/curses.js,
// combat/shikigami.js, combat/minion.js, combat/garuda.js, combat/ocean.js or
// combat/construction.js. Every one of those six owns creatures that have:
//
//     their own health · their own AI · their own pathing · their own death
//
// A BEAST HAS NONE OF THOSE FOUR THINGS, and each absence is a design decision
// rather than an omission:
//
//   NO HEALTH        There is no body to damage. It is a channelled presence,
//                    not a thing standing there.
//   NO AI            It does not decide anything. It holds station relative to
//                    INO and strikes on a fixed cadence — see `update` below,
//                    which is forty lines because there is nothing to decide.
//   NO PATHING       It never crosses the arena. `orbit` and `lead` place it
//                    against Ino's own position and facing, every frame,
//                    forever. Knock Ino across the map and the beast is beside
//                    him when he lands.
//   NO DEATH         *** THIS IS THE MECHANIC THE BRIEF ASKS FOR AND IT IS THE
//                    REASON IT IS FAIR. *** A beast can be SUPPRESSED — hit it
//                    hard enough and it disperses — but it always re-forms,
//                    because there was never a separate body to kill. Nothing
//                    anywhere in this codebase can remove one permanently.
//
// ---------------------------------------------------------------------------
// SO WHAT IS THE COUNTERPLAY? *** THE MASK. ***
// ---------------------------------------------------------------------------
// Canon again: "as his mask is very visible and can easily be taken off should
// one get close enough, Ino's technique can easily be negated." Toji does
// exactly this to him in Shibuya and leaves him standing there helpless.
//
// So a GUARD BREAK always knocks the mask off, and a KNOCKDOWN does so at
// `knockdownChance`. While it is off:
//     the beast is dismissed instantly · RB and RT are dead · B is refused ·
//     his stats fall back to the config's base row
// for `maskOff.duration` seconds, and then he pulls it back down.
//
// That is a harder counter than any other character in this game hands out,
// and it is what pays for a stance character who also has a creature on the
// field. It is checked in exactly ONE place — `onHit` below, called from
// `Fighter.applyHit` — so there is no second path that can forget it.
//
// ---------------------------------------------------------------------------
// WHAT THIS MEANS FOR EVERY ANTI-SUMMON INTERACTION IN THE GAME
// ---------------------------------------------------------------------------
// Audited against all six existing families and every mechanic that touches
// them. The short version is that a beast is INVISIBLE to all of it, because
// every one of those mechanics is written against a list of entities with
// health, and a beast is not in any list:
//
//   URO'S SKY REFLECT      summons are bodies and are not reflected
//                          (combat/reflect.js). A beast is not even a body, so
//                          it is doubly excluded — and its STRIKES are melee
//                          arcs rather than travelling entities, so there is
//                          nothing for the surface to turn around either.
//   MEGUMI / GETO / MAHITO / YUKI / DAGON / YAGA
//                          each system iterates its OWN list. None of them can
//                          see a beast and a beast cannot see them. Two
//                          summoners fighting simply have two independent sets
//                          of things on the field, which is already true of
//                          any two of the existing six.
//   ANYTHING THAT KILLS A SUMMON
//                          there is nothing to call `die()` on. The strongest
//                          statement any effect in this game can make about a
//                          beast is `suppress()`, and that is a timer.
//   MAHORAGA'S ADAPTATION  each beast is its own category (`ino_kaichi`,
//                          `ino_reiki`, `ino_kirin`, `ino_ryu`) — see
//                          EFFECT_SRC. Adapting to the horn teaches him
//                          nothing about the qilin, which is the rotation
//                          puzzle the brief asks for.
//   HIGURUMA'S CONFISCATION
//                          takes a BUTTON. Taking his SPECIAL locks him into
//                          the beast he is wearing, which is the same ruling
//                          Toji's arsenal gets and is a genuinely good effect
//                          on him. The beast stays: Confiscation seizes a
//                          technique's use, not a spirit's existence.
//   INUMAKI / NAOYA / TODO / NOBARA
//                          all four take INO'S BODY, and the beast is bonded to
//                          it. Every one of them therefore moves the beast too,
//                          for free, because the beast reads his position every
//                          frame. See `MID-SWAP INTERRUPTIONS` below for what
//                          each does to a swap that is in progress.
import { v3, rand, flatDist, yawBetween, damp, angleDamp } from '../../core/math.js';
import { computeDamage, hitFeedback } from './hits.js';
import { buildBeast } from '../../art/legacy/models/auspiciousbeasts.js';

// ---------------------------------------------------------------------------
// ONE MANIFESTATION
// ---------------------------------------------------------------------------
class Beast {
  constructor(owner, match, def) {
    this.owner = owner;
    this.match = match;
    this.def = def;                 // the stance's `spirit` block
    this.key = def.key;
    this.model = buildBeast(def.key);
    this.model.group.scale.setScalar(def.scale ?? 1);
    match.root.add(this.model.group);
    this.reveal = 0;
    this.suppressed = 0;            // seconds of dispersal remaining
    this.strikeT = def.strikeEvery * 0.6;
    this.strikeAnim = 0;
    this.pos = owner.pos.clone();
    this.facing = owner.facing;
    this.lookAtOwner = 0;           // the taunt beat — see `tauntReact`
  }

  // *** THERE IS NO `die`. *** Deliberately, and it is the point of the file.
  // The strongest thing that can happen to a beast is this:
  suppress(seconds = null) {
    const d = seconds ?? this.def.suppressed;
    if (d <= 0) return false;                 // the dragon cannot be suppressed
    if (this.suppressed >= d) return false;
    this.suppressed = d;
    const m = this.match;
    // it disperses rather than dying: the form comes apart into its own colour
    for (let i = 0; i < 14; i++) {
      m.fx._spawn(this.pos.clone().add(v3(rand(-0.6, 0.6), rand(0.2, 1.6), rand(-0.6, 0.6))), {
        color: i % 3 ? this.def.color : 0xffffff, size: rand(0.10, 0.26), aspect: 0.6,
        life: rand(0.3, 0.7), opacity: 0.7, gravity: -1.2,
        vel: v3(rand(-2.5, 2.5), rand(0.4, 2.4), rand(-2.5, 2.5))
      });
    }
    m.sfx.summonDismiss?.() ?? m.sfx.hit?.(false);
    this.owner.emit?.('beastSuppressed', { key: this.key, duration: d });
    return true;
  }

  dispose() {
    this.model.group.removeFromParent();
    this.model.group.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
  }

  // WHERE IT STANDS. Entirely a function of Ino's position and facing — this
  // method IS the "it never leaves him" rule, and there is nowhere else in the
  // file that a beast's position is decided.
  _station() {
    const o = this.owner;
    const fwd = o.forward();
    const right = v3(fwd.z, 0, -fwd.x);
    return o.pos.clone()
      .addScaledVector(fwd, this.def.lead)
      .addScaledVector(right, this.def.orbit * 0.55)
      .add(v3(0, this.def.height ?? 0, 0));
  }

  update(dt) {
    const m = this.match;
    const o = this.owner;

    // SUPPRESSION IS A TIMER AND NOTHING ELSE. It counts down, the form comes
    // back, and there is no branch anywhere that can make it not come back.
    if (this.suppressed > 0) {
      this.suppressed = Math.max(0, this.suppressed - dt);
      this.reveal = Math.max(0, this.reveal - dt * 3.2);
      this.model.setReveal(this.reveal);
      this.model.group.visible = this.reveal > 0.01;
      this.model.tick(dt, {});
      return;
    }
    this.model.group.visible = true;

    // MANIFESTING. `manifest` is the seconds it takes to form, so a heavy beast
    // arrives visibly later than a light one — which is what makes swapping
    // into Kirin under pressure a real commitment.
    if (this.reveal < 1) {
      this.reveal = Math.min(1, this.reveal + dt / Math.max(0.05, this.def.manifest));
      // the arrival sparkle, only while it is still forming
      if (Math.random() < 0.5) {
        m.fx._spawn(this.pos.clone().add(v3(rand(-0.7, 0.7), rand(0.1, 1.8), rand(-0.7, 0.7))), {
          color: this.def.color, size: rand(0.06, 0.16), aspect: 0.5,
          life: rand(0.2, 0.5), opacity: 0.8, gravity: -0.8,
          vel: v3(rand(-1, 1), rand(0.4, 1.8), rand(-1, 1))
        });
      }
    }
    this.model.setReveal(this.reveal);

    // IT FOLLOWS HIM, and it does so with a LAG. The lag is the single most
    // characterful number in this file: at damp 7 the beast trails about a
    // third of a second behind a dashing Ino, so a Reiki glide leaves the
    // turtle visibly catching up and a Kirin walk has the qilin pacing beside
    // him. A beast pinned rigidly to an offset reads as a hat.
    const want = this._station();
    want.y = (m.arena?.bounds?.floorAt(want.x, want.z, o.pos.y + 1.2) ?? 0) + (this.def.height ?? 0);
    this.pos.x = damp(this.pos.x, want.x, 7, dt);
    this.pos.y = damp(this.pos.y, want.y, 9, dt);
    this.pos.z = damp(this.pos.z, want.z, 7, dt);
    this.model.group.position.copy(this.pos);

    const foe = m.other(o);
    // it faces whatever Ino faces, unless the taunt has it looking at him
    const wantYaw = this.lookAtOwner > 0
      ? yawBetween(this.pos, o.pos)
      : (foe?.alive ? yawBetween(this.pos, foe.pos) : o.facing);
    // `angleDamp`, not `damp` — a yaw crossing ±π on a linear damp spins the
    // beast the long way round the arena, which is the same trap every facing
    // in this codebase already avoids.
    this.facing = angleDamp(this.facing, wantYaw, 8, dt);
    this.model.group.rotation.y = this.facing;
    if (this.lookAtOwner > 0) this.lookAtOwner -= dt;

    // GAIT drives the animator's legs. Read off Ino's own speed, so the beast
    // is walking exactly when he is.
    const speed = Math.hypot(o.vel?.x ?? 0, o.vel?.z ?? 0);
    const gait = Math.min(1, speed / Math.max(1, o.stats.runSpeed));
    if (this.strikeAnim > 0) this.strikeAnim = Math.max(0, this.strikeAnim - dt * 3.4);
    this.model.tick(dt, { gait, strike: this.strikeAnim });

    // ---- THE SECOND RHYTHM, AND IT IS WHAT MAKES HIM NOT PANDA ------------
    // Every `strikeEvery` seconds the beast makes its own attack, on its own
    // clock, whether or not Ino is doing anything. Panda in any stance is one
    // body making one attack at a time; Ino in any beast is TWO THINGS hitting
    // on two different tempos, and a player has to learn to place his own
    // string in the gaps of the beast's.
    //
    // It does NOT fire while Ino is in a cinematic-ish state, and it does not
    // fire while he is down — a beast beating on somebody while its host is
    // unconscious would make his knockdown a reward.
    if (!foe?.alive || this.reveal < 1) return;
    if (!o.alive || o.state === 'ko' || o.state === 'knockdown' || o.state === 'launched') return;
    this.strikeT -= dt;
    if (this.strikeT > 0) return;
    this.strikeT = this.def.strikeEvery;
    if (flatDist(this.pos, foe.pos) > this.def.strikeRange + (foe.hurtBox?.pad ?? 0)) return;
    this.strikeAnim = 1;
    const dir = foe.pos.clone().sub(this.pos).setY(0);
    if (dir.lengthSq() < 1e-4) dir.copy(o.forward()); else dir.normalize();
    const { dmg, crit } = computeDamage(o, this.def.strikeDmg);
    const r = foe.applyHit({
      attacker: o, isCT: true, src: this.def.src, dmg,
      kb: this.def.strikeKb, kbY: this.def.strikeKbY, hitstun: this.def.strikeHitstun,
      type: 'light', dir
    }, m.ctxFor(o));
    hitFeedback(m, o, foe, r, { crit });
    m.fx._ring(this.pos.clone().addScaledVector(dir, 0.8).setY(this.pos.y + 0.9),
      this.def.color, { size: 0.4, growRate: 7, life: 0.22, flat: false });
  }
}

// ---------------------------------------------------------------------------
// THE SYSTEM
// ---------------------------------------------------------------------------
export class BeastSystem {
  constructor(match) {
    this.match = match;
    this.live = new Map();          // owner -> Beast
  }

  beastOf(owner) { return this.live.get(owner) ?? null; }

  // Called on a stance change and at round start. Dismisses whatever was
  // there and manifests the new one — ONE AT A TIME, always, because he has
  // one face and can only hide it once.
  manifest(owner, key) {
    const def = owner.cfg.beasts?.defs?.[key]?.spirit;
    if (!def) return null;
    this.dismiss(owner);
    const b = new Beast(owner, this.match, def);
    this.live.set(owner, b);
    owner.model?.setBeastTint?.(def.color);
    owner.emit?.('beastManifest', { key, name: def.name, jp: def.jp, color: def.color });
    return b;
  }

  dismiss(owner) {
    const b = this.live.get(owner);
    if (!b) return;
    b.dispose();
    this.live.delete(owner);
    owner.model?.setBeastTint?.(null);
  }

  // ---- THE MASK COMING OFF ------------------------------------------------
  // The ONE place this is decided. Called from `Fighter.applyHit` after the
  // result is known, for every fighter, and it returns immediately for anybody
  // without `cfg.mask`.
  onHit(f, hit, result) {
    const mk = f.cfg.mask?.maskOff;
    if (!mk || f.maskOff > 0) return false;
    let take = false;
    if (mk.onGuardBreak && result === 'guardBreak') take = true;
    else if (mk.onKnockdown && result === 'hit' && hit.type === 'knockdown') {
      // NOT every knockdown, and the roll is the reason a Kirin player is not
      // simply deleted by any heavy: a 55% chance means going for the mask is a
      // read worth making and not a guaranteed reward for one button.
      take = Math.random() < (mk.knockdownChance ?? 1);
    }
    if (!take) return false;
    this.knockOffMask(f, mk.duration);
    return true;
  }

  knockOffMask(f, duration) {
    f.maskOff = duration;
    f.maskRefit = 0;
    this.dismiss(f);
    f.model?.setMask?.(0);
    const m = this.match;
    m.sfx.guardBreak?.() ?? m.sfx.hit?.(true);
    m.cam.shake(0.35);
    // the hat comes off and lands on the floor beside him. It is a FX prop
    // rather than a real object because nothing can pick it up — but it is
    // there, because "the mask came off" has to be a thing the player SEES.
    const at = f.pos.clone().add(v3(0, 1.6, 0));
    for (let i = 0; i < 10; i++) {
      m.fx._spawn(at.clone(), {
        color: i % 2 ? 0x22242e : 0x32353f, size: rand(0.08, 0.18), aspect: 0.7,
        life: rand(0.4, 0.9), gravity: 9,
        vel: v3(rand(-3, 3), rand(1.5, 4), rand(-3, 3))
      });
    }
    f.emit?.('maskOff', { duration });
  }

  // Ticked from Fighter every frame. Runs the timer, then puts it back on.
  tickMask(f, dt) {
    if (!f.cfg.mask) return;
    if (f.maskOff > 0) {
      f.maskOff = Math.max(0, f.maskOff - dt);
      if (f.maskOff <= 0) {
        // REFIT. He pulls it back down over `refit` seconds and the beast he
        // was wearing comes back — he does not lose the stance, only the time.
        f.maskRefit = f.cfg.mask.maskOff.refit;
        f.emit?.('maskRefit', {});
      }
      return;
    }
    if (f.maskRefit > 0) {
      f.maskRefit = Math.max(0, f.maskRefit - dt);
      const k = 1 - f.maskRefit / Math.max(0.01, f.cfg.mask.maskOff.refit);
      f.model?.setMask?.(k);
      if (f.maskRefit <= 0) {
        f.model?.setMask?.(1);
        this.manifest(f, f.stance);
      }
    }
  }

  // The taunt beat: whichever beast is up turns to look at him. See the taunt
  // note in art/anim/ino.js — it is the one moment the creature acknowledges
  // its host, and it costs one float.
  tauntReact(owner, seconds = 1.6) {
    const b = this.live.get(owner);
    if (b) b.lookAtOwner = seconds;
  }

  // Suppress whatever is out. Used by the heavy-hit hook below and by nothing
  // else — there is deliberately no `kill`.
  suppressFor(owner, seconds = null) {
    const b = this.live.get(owner);
    return b ? b.suppress(seconds) : false;
  }

  update(dt) {
    // ---- LAZY MANIFEST, AND IT IS THE ONLY LIFECYCLE HOOK THIS SYSTEM
    // NEEDS ----------------------------------------------------------------
    // `_nextRound` is a BETWEEN-rounds path, so a `resetRound` call is not
    // enough on its own: nothing runs it before round one. Rather than add a
    // second entry point at match construction (and a third for the seat swap,
    // and a fourth for whatever comes next), the invariant is simply asserted
    // here every frame:
    //
    //     A LIVING, MASKED INO ALWAYS HAS HIS BEAST.
    //
    // That is the same statement the whole file is about — the thing cannot be
    // killed — so making it the system's only creation path means there is no
    // sequence of events in this game that can leave him without one. It costs
    // one map lookup per frame per fighter.
    for (const f of this.match.activeFighters ?? []) {
      if (!f.cfg?.beasts || !f.alive) continue;
      if (f.maskOff > 0 || f.maskRefit > 0) continue;
      if (this.live.has(f)) continue;
      // *** AND THE MASK IS DOWN. *** He is a medium whenever a beast is
      // channelled, and a beast is channelled whenever he is masked and alive —
      // so the two facts are the same fact and are asserted together. The
      // constructor builds the model with the mask UP (it is the neutral,
      // out-of-combat look and the one the select screen wants), and without
      // this line he fought the whole first round bare-faced while visibly
      // channelling a qilin.
      f.model?.setMask?.(1);
      this.manifest(f, f.stance ?? f.cfg.beasts.default);
    }
    for (const [owner, b] of this.live) {
      if (!owner.alive) { b.dispose(); this.live.delete(owner); continue; }
      b.update(dt);
    }
  }

  clear() {
    for (const [, b] of this.live) b.dispose();
    this.live.clear();
  }

  resetRound() {
    this.clear();
    for (const f of this.match.activeFighters ?? []) {
      if (!f.cfg.beasts) continue;
      f.maskOff = 0;
      f.maskRefit = 0;
      f.model?.setMask?.(1);
      // no `manifest` here: the invariant in `update` re-creates it on the
      // next frame, and having one creation path is the point.
    }
  }
}

// ---------------------------------------------------------------------------
// MID-SWAP INTERRUPTIONS — the brief asks for each of these to be DEFINED
// ---------------------------------------------------------------------------
// A mask swap is 30 frames in the `beastSwap` state with the change landing at
// frame 15. Four mechanics in this game can take a fighter's body away, and
// the question is what each does to a swap that is in progress. The answer for
// all four is decided by ONE rule rather than by four special cases:
//
//   *** THE SWAP LANDS AT FRAME 15 OR IT DOES NOT LAND. ***
//
// `Fighter.setState` is what every one of these mechanics ultimately calls,
// and leaving `beastSwap` before frame 15 means `_pendingBeast` is dropped by
// the state's own exit. So:
//
//   INUMAKI'S COMMANDS   every one of them forces a state (`speech_root`,
//                        `speech_sleep`, `speech_crush`, ...). Before frame 15
//                        the swap is CANCELLED and the cursed energy is gone —
//                        he paid and got nothing, which is the correct price
//                        for being caught mid-swap by a word. After frame 15
//                        he is already in the new beast and the command
//                        catches him there.
//                        DON'T MOVE is the interesting one: it roots him but
//                        does NOT take his state, so a swap that has started
//                        completes. Rooting a man is not unmasking him.
//   NAOYA'S FREEZE       `combat/freeze.js` sets a hard frozen state, so the
//                        same rule applies. The freeze does NOT knock the mask
//                        off: it is a time-stop, not a grab.
//   TODO'S BOOGIE WOOGIE the swap SURVIVES, and this is the one genuinely
//                        surprising answer. The clap swaps POSITIONS and does
//                        not touch state or frame count, so Ino arrives
//                        somewhere else mid-pull and finishes the swap there.
//                        The BEAST follows, because it reads his position
//                        every frame and does not path — so a Boogie Woogie'd
//                        Ino keeps his creature, which no other summoner in
//                        this game manages.
//   NOBARA'S RESONANCE   a channel that damages him at range without taking
//                        his state. The swap COMPLETES. If a resonance tick
//                        happens to be a knockdown it goes through `onHit`
//                        like anything else and can take the mask — at which
//                        point the swap is moot, because the mask is on the
//                        floor.
//
// The general shape: things that take his STATE cancel the swap; things that
// take his POSITION or his HEALTH do not. That is one sentence and it covers
// every mechanic in the game, including any added later.
