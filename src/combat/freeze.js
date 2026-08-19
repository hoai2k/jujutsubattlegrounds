// PROJECTION SORCERY — 投射呪法. Naoya Zenin's freeze, and the one mechanic in
// the game that takes another fighter's inputs away outright.
//
// ---------------------------------------------------------------------------
// THE CANON RULE, AS RESEARCHED
// ---------------------------------------------------------------------------
// Sources (web, 2026-08-13): Jujutsu Kaisen Wiki "Projection Sorcery", plus the
// Gamerant and MyAnimeThoughts explainers. The rule, stated precisely:
//
//   The technique divides one second into TWENTY-FOUR FRAMES, using the user's
//   field of view as the projection angle of view. The user traces a
//   predetermined set of movements into those twenty-four frames and executes
//   them in that single second. While it is active, anything TOUCHED BY THE
//   USER'S PALM must also abide by the 24-fps rule while moving — and anyone
//   who disobeys that rule is trapped inside a frame for ONE SECOND.
//
//   The limitation, which matters and is implemented: the user is bound by the
//   same rule. If Naoya attempts a trajectory his own programmed sequence
//   cannot support, HE suffers the identical one-second freeze.
//
// So: 24 is correct (the brief asked me to verify it, and it verifies). The
// freeze duration is one second and it is not a tuning dial — it is the
// mechanic. Everything that CAN be tuned is tuned somewhere else (see the
// numbers in characters/naoya.js).
//
// Two things the research corrected in the brief as written:
//   1) The brief describes the trigger as "touch him while he's projecting".
//      Canon is narrower and more interesting: it is HIS PALM making contact,
//      and it is the victim failing to keep pace that traps them. The version
//      implemented here is the brief's — any direct contact with him while the
//      stance holds — because a palm-only trigger is not readable in a fighting
//      game and would make the stance a coin flip. But the canon detail is not
//      thrown away: it is where the SELF-FREEZE below comes from.
//   2) The self-freeze is not in the brief at all, and it is the single best
//      balance lever the canon offers. See `selfFreeze` below.
//
// ---------------------------------------------------------------------------
// WHAT THE FREEZE IS, MECHANICALLY
// ---------------------------------------------------------------------------
// The victim enters the `frozen` state for exactly one second. That state is
// on the list in Fighter._stateLogic that returns before reading input at all,
// alongside `voided`, `transfigured`, `sentenced` and `devoured` — so "no
// movement, no attacks, no block, no dash, no special" is structurally true
// rather than a set of individual checks that might have a hole in one of
// them. There is exactly one input that still works while frozen, and it is
// the camera lock-on toggle, which is read above that gate for every state in
// the game because it is a preference and not a move.
//
// It is a PUNISH WINDOW, NOT A KILL. One second against Naoya's damage numbers
// converts to roughly a full string plus a Frame Kick — meaningful, and
// nowhere near a round. The numbers and the measurement are in his config.
//
// ---------------------------------------------------------------------------
// THE CONTACT RULE — why zoners have an answer
// ---------------------------------------------------------------------------
// "Make sure ranged attacks, projectiles, and summons do NOT trigger it — only
// direct contact." That is load-bearing: it is the entire reason Jogo, Hanami,
// Nobara, Choso, Megumi, Mahito and Geto are not simply unable to play against
// him. `isContact` below is the single predicate, and it is deliberately built
// out of TWO independent tests that must both pass:
//
//   1) TAG TEST — the hit must not be tagged as a projectile, a summon, a
//      sure-hit domain tick, or damage-over-time. These are the categories the
//      damage sites already declare (`hit.src`, `hit.minion`, `hit.shikigami`,
//      `hit.curse`, `hit.sureHit`), so nothing new had to be tagged anywhere.
//   2) PROXIMITY TEST — the attacker's BODY must actually be within contact
//      range of Naoya at the moment the hit resolves.
//
// The proximity test is the important one, and it is why this is robust rather
// than a list I have to keep in sync. A technique I have never read about,
// added by someone else next year, that throws damage from eight metres away,
// cannot trigger the freeze — not because it is on a list, but because its
// caster is eight metres away. The tag test exists on top of it to catch the
// cases where a summon or a sure-hit happens to resolve while its OWNER is
// also standing close, which proximity alone would get wrong.
//
// CONTACT_RANGE is 2.6 m. That is set above the longest genuine melee reach in
// the roster (Hanami's Double Fall at 2.50 m — a club swing IS direct contact
// and should freeze) and well below every zoning tool.
import * as THREE from 'three';
import { v3, rand, flatDist } from '../core/mathutil.js';

export const FREEZE_FPS = 24;          // canon. Not a dial.
export const FREEZE_DURATION = 1.0;    // canon. Not a dial.
const CONTACT_RANGE = 2.6;

// States a fighter cannot be pulled out of into a freeze. Same list the rest
// of the game uses for "already committed to a cinematic or already down" —
// freezing a body mid-execution or mid-transfiguration would strand two
// systems fighting over the same fighter, so those simply do not freeze.
const UNFREEZABLE_STATES = [
  'ko', 'intro', 'victory', 'transfigured', 'sentenced', 'executing',
  'devoured', 'voided'
];

// ---------------------------------------------------------------------------
// THE PREDICATE
// ---------------------------------------------------------------------------
export function isContact(defender, hit) {
  const atk = hit.attacker;
  if (!atk || atk === defender) return false;
  // 1 TAG TEST
  if (hit.sureHit) return false;                    // a domain's ambient tick
  if (hit.src === 'projectile') return false;       // Jogo's embers, Hakari's blast
  if (hit.src === 'summon') return false;           // every shikigami/minion/curse
  if (hit.minion || hit.shikigami || hit.curse) return false;
  if (hit.dot) return false;                        // burn, bleed, bud drain
  // 2 PROXIMITY TEST — the generic one. If the body is not here, it is not
  // touching him, whatever the move happens to be called.
  if (flatDist(atk.pos, defender.pos) > CONTACT_RANGE) return false;
  return true;
}

// ---------------------------------------------------------------------------
// THE SYSTEM
// ---------------------------------------------------------------------------
// Owns presentation and the ledger; the one-second lock itself lives on the
// fighter as `frozenT`, because the state machine has to be able to see it
// without asking a system.
export class FreezeSystem {
  constructor(match) {
    this.match = match;
    this.active = [];      // {victim, t, dur, by, ring, saved}
  }

  // Can `victim` be frozen at all right now? Everything the audit turned up
  // that has to be refused lives here, in one readable place.
  canFreeze(victim) {
    if (!victim || !victim.alive || victim.eliminated) return false;
    if (UNFREEZABLE_STATES.includes(victim.state)) return false;
    // ALREADY FROZEN — no stacking and no refreshing. Two contacts inside one
    // freeze do not buy two seconds; the second one is simply free damage,
    // which is already the reward.
    if (victim.frozenT > 0) return false;
    // AN EXECUTION DUEL OWNS BOTH FIGHTERS. Higuruma's sentencing takes over
    // the whole logic tick for the pair of them, so a freeze landing in the
    // middle of it would have two systems writing one fighter's state. The
    // duel wins: it started first and it is a cinematic.
    if (this.match.domains?.duelFreeze) return false;
    // THE MAHORAGA SUMMON RITUAL likewise runs with the logic tick halted
    // entirely (core/ritual.js), so there is nothing to freeze.
    if (this.match.ritual?.running) return false;
    return true;
  }

  // The one entry point. `by` is Naoya (or whoever is projecting — Yuta can
  // borrow it, see the Copy note in characters/naoya.js).
  freeze(victim, by, opts = {}) {
    if (!this.canFreeze(victim)) return false;
    const m = this.match;
    const dur = opts.dur ?? FREEZE_DURATION;

    victim.frozenT = dur;
    victim.vel.set(0, 0, 0);
    // AIRBORNE VICTIMS. A body caught in the air stays in the air — it is
    // trapped in a frame, and the frame it is trapped in did not have it on
    // the floor. Gravity is suspended by the frozen state's physics branch
    // (see Fighter._physics), so this is just the read.
    victim.setState('frozen', { clip: 'frozen' });

    // ---- presentation ------------------------------------------------------
    // "The victim desaturates and stutters into discrete frames, with a hard
    // mechanical click on trigger and a visible one-second countdown."
    //
    // THE STUTTER is free and it is real: the `frozen` clip in art/anim/base.js
    // is authored entirely on `hold` keys placed at 24ths of a second, which
    // is a genuine step function in the clip player. A frozen fighter is
    // literally drawn at 24 fps while the rest of the game runs at 60.
    //
    // THE DESATURATION is a colour multiply on the victim's own material
    // instances (finalizeModel builds a fresh set per model, so this can never
    // leak onto another fighter). It is a cool grey wash rather than a true
    // channel desaturation — MeshToonMaterial has no saturation control and
    // adding a shader variant for one second of one matchup was not worth the
    // surface area. Restored exactly on release.
    const saved = [];
    for (const slot of ['skin', 'cloth', 'hair', 'metal']) {
      const mesh = victim.model.meshes?.[slot];
      if (!mesh?.material?.color) continue;
      saved.push({ mat: mesh.material, hex: mesh.material.color.getHex() });
      mesh.material.color.setHex(0x7e8290);
    }

    const ring = this._buildCountdown(victim, dur);

    m.sfx.freezeClick?.();
    m.hitstop(4);                       // the hard mechanical click, felt
    m.cam.shake(0.22);
    // a single hard-edged gold flash at the contact point — one frame, no
    // bloom, no trail. Everything about this character is a step.
    const chest = victim.pos.clone().add(v3(0, victim.cfg.size?.strikeY ?? 1.2, 0));
    m.fx._ring(chest, 0xe8c85a, { size: 0.6, growRate: 0, life: 0.10, flat: false });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      m.fx._spawn(chest.clone().add(v3(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5)), {
        color: 0xe8c85a, size: 0.14, aspect: 0.3, life: 0.16, vel: v3()
      });
    }
    m.hud.toast(victim, 'FROZEN — 1.00s');

    this.active.push({ victim, t: dur, dur, by, ring, saved, lastTick: -1 });
    victim.emit('frozen', { by, dur });
    by?.emit?.('freezeLanded', { victim });
    return true;
  }

  // THE SELF-FREEZE. Canon: the user is bound by the same rule and eats the
  // same one second for breaking his own sequence. Here that is spent on the
  // one thing the character needed for balance — a WHIFFED stance. Arming
  // Projection Stance and having nobody touch you is otherwise completely
  // free, which is what would make it spammable; this makes reaching for it
  // a real read rather than a habit. Enabled per-config
  // (`special.selfFreezeOnWhiff`) so it is a tuning decision, not a law.
  selfFreeze(user) {
    if (!this.freeze(user, null, { dur: FREEZE_DURATION * 0.5 })) return false;
    this.match.hud.toast(user, 'OUT OF FRAME');
    return true;
  }

  // A visible one-second countdown on the victim's model: twenty-four ticks
  // arranged in a ring above their head, extinguished one per 1/24 s. It reads
  // as a clock and it reads as the frame count at the same time, which is the
  // point — the mechanic and its HUD are the same number.
  _buildCountdown(victim, dur) {
    const group = new THREE.Group();
    const ticks = [];
    const h = (victim.cfg.size?.height ?? 1.8) + 0.55;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xe8c85a, transparent: true, opacity: 0.95,
      depthWrite: false, depthTest: false, side: THREE.DoubleSide
    });
    const geo = new THREE.PlaneGeometry(0.05, 0.13);
    for (let i = 0; i < FREEZE_FPS; i++) {
      const a = (i / FREEZE_FPS) * Math.PI * 2 - Math.PI / 2;
      const tick = new THREE.Mesh(geo, mat);
      // laid out in the ring's own plane; the whole group is billboarded to
      // each eye as it draws, so all 24 are always countable from every seat
      tick.position.set(Math.cos(a) * 0.46, h + Math.sin(a) * 0.46, 0);
      tick.rotation.z = -a + Math.PI / 2;
      tick.renderOrder = 5;
      group.add(tick);
      ticks.push(tick);
    }
    group.userData.billboard = true;   // camera-facing, aimed per eye in core/stage.js
    victim.model.group.add(group);
    return { group, ticks, geo, mat };
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const e = this.active[i];
      const v = e.victim;
      // THE FIGHTER OWNS THE CLOCK. `frozenT` is decremented in Fighter.update
      // and read here; keeping a second copy on the entry meant the two could
      // disagree, and in testing they did — the entry expired on schedule while
      // the fighter's own timer sat at its start value forever, so the material
      // restore never ran and the victim stayed grey.
      e.t = v.frozenT;

      // the countdown extinguishes one tick per frame of the 24
      if (e.ring) {
        const spent = Math.floor((1 - e.t / e.dur) * FREEZE_FPS);
        for (let k = 0; k < e.ring.ticks.length; k++) e.ring.ticks[k].visible = k >= spent;
      }
      // a gold mote every 1/24 s, on the grid, so the freeze audibly and
      // visibly ticks rather than just sitting there
      const tick = Math.floor((e.dur - e.t) * FREEZE_FPS);
      if (tick !== e.lastTick) {
        e.lastTick = tick;
        this.match.sfx.freezeTick?.();
        this.match.fx._spawn(v.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.6, 1.6), rand(-0.4, 0.4))), {
          color: 0xe8c85a, size: 0.10, life: 0.12, vel: v3()
        });
      }

      // released — by the clock, by a KO, or by the victim being taken over by
      // something with a stronger claim (an execution, a transfiguration).
      // `frozen` is not on that list, so the ordinary case falls through to the
      // clock; hitstun states are not on it either, which is deliberate — a
      // punish landing mid-freeze must not end the freeze.
      const stolen = UNFREEZABLE_STATES.includes(v.state) && v.state !== 'frozen';
      if (e.t <= 0 || !v.alive || stolen) {
        this._release(e, stolen || !v.alive);
        this.active.splice(i, 1);
      }
    }
  }

  _release(e, silent) {
    const v = e.victim;
    v.frozenT = 0;
    for (const s of e.saved) s.mat.color.setHex(s.hex);
    if (e.ring) {
      v.model.group.remove(e.ring.group);
      e.ring.geo.dispose();
      e.ring.mat.dispose();
    }
    if (!silent && v.alive && v.state === 'frozen') {
      v.setState('idle', { clip: 'idle' });
      this.match.sfx.freezeRelease?.();
      v.emit('freezeEnd', {});
    }
  }

  // round reset / match teardown: everything comes off cleanly, including the
  // colour restore, so a fighter frozen at the buzzer does not start the next
  // round grey
  clear() {
    for (const e of this.active) this._release(e, true);
    this.active.length = 0;
  }

  frozenCount() { return this.active.length; }
  isFrozen(f) { return this.active.some(e => e.victim === f); }
}
