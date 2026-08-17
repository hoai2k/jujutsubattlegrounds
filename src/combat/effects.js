// Cursed technique effect dispatcher + timed entities (attractors, beams,
// lunge windows). Effect keys come from character configs — data in, code here.
import { v3, clamp, rand, yawBetween, flatDist } from '../core/mathutil.js';
import { computeDamage, inArc, hitFeedback, openBlackFlash } from './hits.js';
import { applyBurn } from './burn.js';
import { gainEvidence } from './judgeman.js';
import { gainCharge, spendCharge, chargeSize } from './charge.js';
import { ARTIFICIAL } from '../arena/terrain.js';

const TODO_ACCENT = 0xff5fc8; // Boogie Woogie's signature snap color

// ---------------------------------------------------------------------------
// ADAPTATION SOURCE MAP
// ---------------------------------------------------------------------------
// Mahoraga adapts per damage CATEGORY, so every technique in the game has to
// declare which bucket it falls in. Categorised by what the move IS first and
// by which slot it happens to live in second — that is why Jogo's embers are
// `projectile` rather than `ct1`, and why Todo's grab is `throw` rather than
// `ct2`. Anything left undeclared falls back to its slot, and anything with
// neither is simply not adaptable (which is correct for buffs: there is
// nothing to adapt to in Overtime or Overheat).
export const EFFECT_SRC = {
  // GOJO — Red is a burst, Blue is an attractor; neither travels as a
  // projectile the way an ember does, so they stay on their slots. Hollow
  // Purple costs the whole bar, which is what makes it an ultimate here.
  gojo_red: 'ct1', gojo_blue: 'ct2', purple: 'ultimate',
  // YUTA — the domain's rolled payloads are all `domain` (see applySwordTech).
  yuta_rika_swing: 'ct1', yuta_lunge: 'ct2', rika_blast: 'ultimate',
  sword_slash: 'domain',
  // NANAMI — Collapse is his non-domain ultimate. A Ratio crit is not its own
  // category: it is a multiplier on whatever move crit, so it inherits.
  nanami_cleave: 'ct1', nanami_collapse: 'ultimate', nanami_overtime: null,
  // YUJI — Divergent Fist and Manji Kick are reinforced PHYSICAL strikes with
  // no technique behind them, and Black Flash is the same fist arriving twice.
  // All three are `punch`: adapting to Yuji's hands should blunt all of it,
  // and there is nothing else about him to adapt to.
  yuji_divergent: 'punch', yuji_manji: 'punch', yuji_sukuna: null,
  // TODO — the clap combo is a strike; the grab and both swaps are throws.
  todo_clapcombo: 'ct1', todo_grab: 'throw', todo_boogie_cast: 'throw',
  todo_brotherhood: 'ultimate',
  // JOGO — the embers genuinely fly, so they are the roster's projectiles.
  jogo_embers: 'projectile', jogo_eruption: 'ct2', jogo_overheat: null,
  // MAHITO — Soul Touch is a grab in shape but it is a cursed technique in
  // substance (it applies Soul Wound, not a throw), so it stays on its slot.
  mahito_soultouch: 'ct1', mahito_bodyweapon: 'ct2', mahito_summon: null,
  // MEGUMI — the summon gesture deals nothing; the shikigami do, and they are
  // tagged `summon` where they strike (combat/shikigami.js).
  megumi_shikigami: null, megumi_copy_dog: null,
  // GETO — the summon gestures deal nothing at all; the curses do, and they
  // are tagged `summon` where they strike (combat/curses.js), which puts them
  // in the same adaptation bucket as Megumi's shikigami. That is the correct
  // ruling: they are the same KIND of thing (a body somebody else sent),
  // arriving from two different men, and Mahoraga adapting to "being bitten by
  // something that is not the sorcerer" should cover both.
  //
  // Uzumaki sits with the ultimates. Reabsorb deals no damage, so there is
  // nothing to adapt to — same as Overheat and Overtime.
  geto_summon_low: null, geto_summon_special: null, geto_reabsorb: null,
  geto_copy_low: null, geto_uzumaki: 'ultimate',
  // NAOYA — the Rush is him hitting you with his hands very quickly, so it is
  // `punch`: adapting to Naoya's fists should blunt his string AND his rush,
  // because they are the same fists. The Frame Kick is a distinct committed
  // technique and keeps its slot. MAXIMUM PROJECTION deals no damage and has
  // no hitbox — there is nothing to adapt to in a state.
  //
  // THE FREEZE IS DELIBERATELY NOT IN THIS TABLE, and that is the interesting
  // ruling of the pair: Mahoraga cannot adapt to it, because adaptation is a
  // response to DAMAGE and the freeze does none. See the full audit note in
  // the delivery report — the short version is that his answer to Naoya is the
  // same as everyone else's, which is to stop touching him.
  naoya_rush: 'punch', naoya_framekick: 'ct2', naoya_maxprojection: null,
  // KASHIMO — every damaging thing he owns is the same substance arriving in a
  // different shape, so all of it is `electric`, INCLUDING the staff string
  // (tagged `src: 'electric'` on the punch defs themselves rather than here,
  // because the melee path reads `def.src`). See the note in adaptation.js for
  // why this is one bucket and Toji's tools are four. The ultimate is a STATE
  // with no hitbox, so like every other state in this table it is null.
  kashimo_bolt: 'electric', kashimo_discharge: 'electric',
  kashimo_arcpass: 'electric', kashimo_amber: null,
  // PANDA — ONE CATEGORY PER STANCE, which is the recommendation in the brief
  // and the right call for the same reason Toji's four weapons get four
  // buckets: adapting to a gorilla's fists should do nothing about a
  // triceratops's horn, because they are not the same thing arriving in a
  // different shape (which is Kashimo's case, and why HIS whole kit is one
  // bucket). The result is that the Mahoraga matchup becomes a STANCE ROTATION
  // PUZZLE — Panda stays ahead of the wheel by cycling cores, Mahoraga wins by
  // forcing him onto one, and Panda's answer to being forced is that he can
  // simply let that core die and keep the other two.
  //
  // The punch strings are tagged `src` on the punch defs themselves rather
  // than here, because the melee path reads `def.src`. All three stances tag
  // theirs, so his normals adapt per stance too — which is the half that
  // actually makes the rotation matter, since normals are most of his damage.
  panda_palm: 'panda_core', panda_roll: 'panda_core',
  panda_drum: 'panda_gorilla', panda_slam: 'panda_gorilla',
  panda_gore: 'panda_trike', panda_crestroll: 'panda_trike',
  panda_allcores: null,
  // MAHORAGA (mirror match / Yuta's copy of him)
  mahoraga_wheel_slash: 'ct1', mahoraga_world_cut: 'ct2',
  // HAKARI — the base kit sits on its slots. The SHUTTER is defensive and has
  // nothing to adapt to, like Overtime and Overheat.
  hakari_smash: 'ct1', hakari_rush: 'ct2', hakari_shutter: null,
  // JACKPOT is categorised by what each move IS, not by which button it is on.
  // The blast genuinely travels, so it joins Jogo's embers under `projectile`
  // — adapt to one and you have blunted the other. The flurry and the Gold
  // Rush are him hitting you with his body, which is `punch`. Only the counter
  // punish is a technique in its own right, and it inherits `ct2` from the
  // stance that produced it. Nothing about Jackpot gets its own free category.
  hakari_blast: 'projectile', hakari_counter: null, hakari_punish: 'ct2',
  hakari_goldrush: 'punch',
  // HIGURUMA — the gavel is a cursed-energy construct and stays on its slot.
  // Confiscation deals no damage at all, so there is nothing to adapt TO (the
  // lock is not a hit); the summon likewise. The two sword moves are the
  // DOMAIN doing it, exactly like Yuta's rolled payloads: adapting to
  // "Higuruma's briefcase" should do nothing whatsoever about the blade the
  // courtroom put in his hand.
  higuruma_gavel: 'ct1', higuruma_confiscate: null, higuruma_judgeman: null,
  higuruma_judgment_slash: 'domain', higuruma_execution: 'domain',
  // SUKUNA — three SEPARATE categories, which is the whole Mahoraga matchup.
  // Dismantle and Cleave are the same technique aimed differently, but they
  // are different tools with different ranges and different answers, so
  // adapting to one must not blunt the other: they keep their own slots. Fire
  // Arrow is his ultimate-tier button and sits with the ultimates. Consuming a
  // finger deals no damage and has nothing to adapt to.
  sukuna_dismantle: 'ct1', sukuna_cleave: 'ct2', sukuna_firearrow: 'ultimate',
  sukuna_finger: null,
  // The shrine's automatic slashes are the DOMAIN doing it — the same ruling
  // Yuta's rolled payloads and Higuruma's blade already get.
  malevolent_shrine: 'domain',
  // TOJI — EACH WEAPON IS ITS OWN CATEGORY. This is the recommended ruling
  // from the brief and it is the interesting one: adapting to Playful Cloud
  // does nothing whatsoever about the Split Soul Katana, so the Mahoraga
  // matchup becomes a WEAPON ROTATION PUZZLE rather than a damage race. Toji
  // has four tools and the wheel is fast, so he can genuinely stay ahead of
  // the adaptation clock — which is exactly the fantasy.
  //
  // His FISTS are `punch`, deliberately shared with Yuji's reinforced strikes:
  // they are a man hitting you, and there is nothing else about them to adapt
  // to. That means a Mahoraga who has adapted to Yuji's hands has already
  // blunted Toji's, which is correct — and it is also why Toji's answer to
  // adaptation is to pick up a weapon.
  toji_cloud_sweep: 'toji_cloud', toji_cloud_slam: 'toji_cloud',
  toji_spear_thrust: 'toji_spear', toji_nullify: 'toji_spear',
  toji_soul_slash: 'toji_soul', toji_soul_cut: 'toji_soul',
  toji_chain_whip: 'toji_chain', toji_chain_snare: 'toji_chain',
  // ASSASSINATION is his ultimate-tier button and sits with the ultimates,
  // even though it costs no meter — the category is about what a move IS.
  toji_assassinate: 'ultimate',
  // ---- HANAMI -------------------------------------------------------------
  // Root Eruption is a ground trap and stays on its slot, exactly as Jogo's
  // Volcanic Eruption does — the two are the roster's two ground traps and
  // adapting to one should not touch the other, so they keep separate slots.
  // The Cursed Bud is a technique sustained on the body, so its chip is `ct2`.
  // ROOT FIELD deals no damage at all: there is nothing to adapt to, the same
  // ruling Overtime, Overheat and the Shutter already get. The Wooden Ball is
  // his ultimate-tier button.
  hanami_roots: 'ct1', hanami_bud: 'ct2', hanami_rootfield: null,
  hanami_woodenball: 'ultimate',
  // ---- KUROURUSHI ---------------------------------------------------------
  // THE SWARM IS `summon`. This is the interesting call and it is deliberate:
  // the roaches are independent bodies he releases which then hunt on their
  // own, which is precisely what Megumi's shikigami and Mahito's transfigured
  // humans are, and Mahoraga adapting to "things sent at me" should cover all
  // three. It also means the swarm does NOT share a bucket with the corrosive
  // spray, so the matchup is a rotation puzzle rather than a single answer.
  // INFESTATION ticks under `summon` too — it is the same roaches, more of
  // them — while the CAST is an ultimate; the split is intentional, because
  // adapting to the swarm should blunt the flood it is made of.
  kurourushi_swarm: 'summon', kurourushi_infestation: 'ultimate',
  // the spray is a cursed technique on its slot; its lingering burn goes in
  // with every other damage-over-time as `dot`, tagged at the tick site.
  kurourushi_spray: 'ct2',
  // DEVOUR is a grab, so it is a throw — the same ruling Todo's Vice Grab
  // gets. Self-devour touches nobody and is not adaptable.
  kurourushi_devour: 'throw', kurourushi_selfdevour: null,
  // ---- CHOSO ---------------------------------------------------------------
  // BLOOD EDGE genuinely flies, so it joins Jogo's embers and the Jackpot blast
  // under `projectile` — the established ruling is that things which travel
  // share a bucket, and adapting to one should blunt the others. PIERCING
  // BLOOD does not: it is an instantaneous line, it is his committed read, and
  // it keeps its own slot so a Mahoraga who has answered the poke has NOT
  // answered the punish. That split is what makes the matchup a rotation
  // problem rather than a single correct answer.
  //
  // FLOWING RED SCALE deals no damage and there is nothing to adapt to — the
  // same ruling Overtime, Overheat, Root Field and the Shutter already get.
  // SUPERNOVA is his ultimate-tier button.
  choso_blood_edge: 'projectile', choso_piercing_blood: 'ct2',
  choso_redscale: null, choso_supernova: 'ultimate',
  // ---- NOBARA --------------------------------------------------------------
  // The nail flies, so the THROW is `projectile` with everything else that
  // flies. The DETONATION is the technique rather than the delivery, so it
  // sits on its slot — adapting to thrown things should not also blunt what
  // they do when they go off, any more than adapting to Jogo's embers blunts
  // his eruption.
  nobara_hairpin: 'projectile', nobara_detonate: 'ct1',
  // RESONANCE keeps its own slot and shares a bucket with NOTHING. This is the
  // deliberate call and it is the answer to "which adaptation category does a
  // bypass-everything attack fall into":
  //   · it is NOT `domain`. It is a cursed technique she is performing with
  //     her hands, not a barrier doing it for her, and filing it there would
  //     let a Mahoraga who ate one Malevolent Shrine pre-answer a whole
  //     round's savings.
  //   · it is NOT the instant-KO category. Resonance is DAMAGE — it is not a
  //     kill that ignores health, it is a number, so a damage reduction is
  //     exactly the right shape of counter and the resist-roll ruling in
  //     combat/instantko.js does not apply.
  //   · so it is `ct2`, its own category, earned only by being hit by
  //     Resonance itself. Mahoraga is therefore the one character in the game
  //     who can genuinely answer it — by eating small ones early to build the
  //     reduction before she has banked enough for a big one. That is a real
  //     and interesting matchup and it is the reason this file does not give
  //     her a free pass on the one opponent designed to answer everything.
  nobara_resonance: 'ct2',
  // her committed strike is a physical blow and Black Flash is the same blow
  // arriving twice, so both are `punch` — exactly the ruling Yuji's Divergent
  // Fist, Manji Kick and Flash already share.
  nobara_bf_strike: 'punch',
  nobara_full_release: 'ultimate'
};

// slot -> category, used when an effect declares nothing
const SLOT_SRC = { ct1: 'ct1', ct2: 'ct2', ult: 'ultimate', purple: 'ultimate', copy: null };

// ---------------------------------------------------------------------------
// SUKUNA — FINGER STACKS AND THE CLEAVE FORMULA
// ---------------------------------------------------------------------------
// Every stack he has eaten makes his TECHNIQUES bigger and faster. It does
// nothing whatsoever to his punches, his health, his guard or his movement —
// the snowball lives entirely in the three things that kill. Both helpers
// return 1 for anyone who is not him, so they are safe to call unconditionally
// and there is no branch to forget.
//
// The startup side of the same scaling lives in fighter.js, because startup is
// consumed by the state machine before any effect fires.
export function fingerDmg(f) {
  const n = f?.fingers ?? 0;
  return n ? Math.pow(1 + (f.cfg.fingers?.dmgPerStack ?? 0.09), n) : 1;
}
export function fingerRange(f) {
  const n = f?.fingers ?? 0;
  return n ? Math.pow(1 + (f.cfg.fingers?.rangePerStack ?? 0.08), n) : 1;
}

// CLEAVE'S SCALING, in one place so the technique, the domain's sure-hit tick
// and the HUD indicator can never disagree about what it does.
//
//   damage = base + ceScale x targetMAX_CE
//
// A target with NO CURSED-ENERGY SYSTEM (Mahoraga: startMaxCE 0, ceRegen 0,
// ceGainPerPunch 0 — his MAX_CE is 0 forever) is the interesting case. Reading
// his empty bar literally would leave Cleave at its floor against the single
// toughest thing in the game, which is backwards: Cleave is not weaker against
// people with less energy, it is a technique that ADJUSTS to what it is
// cutting, and against a body with nothing to adjust to it simply cuts. So it
// neither scales up nor collapses — it returns a flat middling value declared
// on the move (`flatVsNoCE`), and the callout says so on screen. Detected from
// the config rather than from a per-character flag, so nothing existing had to
// be edited to teach it about him.
export function cleaveDamage(caster, target, opts = {}) {
  const base = opts.base ?? 12;
  const scale = opts.ceScale ?? 0.32;
  const st = target?.cfg?.stats;
  const hasCE = !!st && (st.startMaxCE > 0 || st.ceGainPerPunch > 0);
  if (!hasCE) {
    const dmg = opts.flatVsNoCE ?? (base + scale * 55);
    return { dmg, depth: 0.5, label: '捌 CLEAVE — NO CURSED ENERGY TO READ', toast: 'CLEAVE · FLAT' };
  }
  const maxCE = Math.max(0, target.res.maxCE);
  const dmg = base + scale * maxCE;
  const depth = Math.max(0, Math.min(1, maxCE / 100));
  return {
    dmg, depth,
    label: '捌 CLEAVE — MAX CE ' + Math.round(maxCE) + '%  ×' + (dmg / base).toFixed(2),
    toast: 'CLEAVE ' + Math.round(dmg) + ' (MAX CE ' + Math.round(maxCE) + ')'
  };
}

export function srcFor(key, slot) {
  if (key in EFFECT_SRC) return EFFECT_SRC[key];
  return SLOT_SRC[slot] ?? null;
}

export class Effects {
  constructor(match) {
    this.match = match;
    this.entities = [];
  }

  // techniques hit whoever the caster is currently closest to
  other(f) { return this.match.other(f); }

  // ---- MOVEMENT-STEERED CASTS ---------------------------------------------
  // The overhauled techniques ride the left stick: hold a direction while the
  // cast comes out and the wave / swarm / rupture goes THAT way instead of
  // straight ahead — the same read Jogo's and Hanami's eruptions already use
  // for their ground markers, promoted to a roster-wide signature. Neutral
  // falls back to facing, so a player who never learns it loses nothing.
  _castDir(caster) {
    const inp = this.match.inputFor?.(caster);
    const mv = inp?.move;
    if (mv && Math.hypot(mv.x, mv.z) > 0.25) {
      const d = caster._moveVec(mv);
      d.y = 0;
      if (d.lengthSq() > 0.001) return d.normalize();
    }
    return caster.forward();
  }

  // ---- KASHIMO: THE MAX-TIER DISCHARGE ------------------------------------
  // Called from the melee path (hits.js) on every CONFIRMED normal while he is
  // at tier 3, and from nowhere else. What it is NOT: a second hit on the
  // person he just punched. Doubling his own normals would make the top tier a
  // damage cliff rather than a property change, and the tier table already
  // multiplies his damage by 1.42 up there.
  //
  // What it IS: the blow EARTHS THROUGH the body it landed on and jumps to
  // anything else standing near it — which does nothing at all in a 1v1 and is
  // genuinely dangerous in a free-for-all or against a summoner with bodies on
  // the field. That is a property, not a number, and it is the version that
  // makes the top tier feel different rather than just bigger. `primary` is
  // excluded explicitly so the arc can never double-dip on the target.
  chargeDischarge(caster, primary) {
    const m = this.match;
    const at = primary.pos.clone().setY(1.15);
    const radius = 2.3 * chargeSize(caster);
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2;
      m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.2, radius * 0.6), rand(-0.5, 0.8), Math.sin(a) * rand(0.2, radius * 0.6))), {
        color: i % 3 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.08, 0.20), aspect: 0.3,
        life: rand(0.10, 0.22), vel: v3(Math.cos(a) * 4, rand(0.4, 2.2), Math.sin(a) * 4)
      });
    }
    m.fx._ring(at, 0xa46bff, { size: 0.25, growRate: radius * 5, life: 0.16, flat: false });
    for (const foe of m.activeFighters ?? []) {
      if (!foe || foe === caster || foe === primary || !foe.alive) continue;
      if (flatDist(foe.pos, primary.pos) > radius + (foe.hurtBox?.radius ?? 0.62)) continue;
      const { dmg } = computeDamage(caster, 3.0, { canCrit: false });
      const r = foe.applyHit({
        dmg, kb: 0.8, kbY: 0, hitstun: 10, type: 'light', attacker: caster,
        isCT: true, dir: caster.forward(), src: 'electric'
      }, m.ctxFor(caster));
      hitFeedback(m, caster, foe, r, {});
    }
  }

  // direct application of a technique by key — used by CT casts, Yuta's Copy,
  // domain sword grabs, and the AML sure-hit (with sureHit: true).
  applyTechnique(caster, key, opts = {}) {
    const m = this.match;
    const t = this.other(caster);
    const mult = opts.powerMult ?? 1;
    const sure = !!opts.sureHit;
    // `src` rides on every hit this dispatcher produces — see EFFECT_SRC.
    // A caller may force one (the domain payloads do) via opts.src.
    const src = opts.src ?? srcFor(key, opts.slot);
    const hitOpts = { attacker: caster, isCT: true, sureHit: sure, otgOk: sure, dir: caster.forward(), src };

    switch (key) {
      // =====================================================================
      // GETO — CURSED SPIRIT MANIPULATION
      // =====================================================================
      // Both summon buttons resolve the same way: the CE was already spent and
      // the curse key already chosen in Fighter.startCurseSummon, so all that
      // happens on the activation frame is that a body arrives. Neither has a
      // hitbox of its own — Geto never hits anybody with a summon, which is the
      // whole design.
      case 'geto_summon_low':
      case 'geto_summon_special': {
        const key = opts.curse;
        if (!key) break;
        m.curses.summon(caster, key);
        break;
      }

      // REABSORB — pull the most valuable body home and get part of the cost
      // back. Handled entirely by the system (which owns the refund curve);
      // this branch is the feedback.
      case 'geto_reabsorb': {
        const r = m.curses.reabsorb(caster);
        if (!r) { m.hud.toast(caster, 'NOTHING TO RECALL'); break; }
        m.sfx.curseRecall?.();
        // the pull-in read: motes converging on his open hand
        const hand = caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(caster.forward(), 0.5);
        for (let i = 0; i < 18; i++) {
          const a = rand(0, Math.PI * 2), rr = rand(1.4, 3.4);
          m.fx._spawn(hand.clone().add(v3(Math.cos(a) * rr, rand(-0.6, 0.8), Math.sin(a) * rr)), {
            color: i % 3 === 0 ? 0xa878e0 : 0x140b1e, size: rand(0.12, 0.30), life: 0.3,
            vel: v3(-Math.cos(a) * rr * 3, 0, -Math.sin(a) * rr * 3)
          });
        }
        m.fx._ring(hand, 0xa878e0, { size: 1.2, growRate: -3.4, life: 0.35, flat: false });
        m.hud.toast(caster, '+' + Math.round(r.refund) + ' CE');
        break;
      }

      // ---- MAXIMUM: UZUMAKI 極ノ番・うずまき --------------------------------
      // Everything he is still holding, compressed into one sphere and fired.
      //
      // THE ORDER OF THE THREE LINES BELOW IS LOAD-BEARING. The damage is read
      // FIRST, from the stable as it stands; the stable is consumed SECOND; the
      // beam resolves THIRD. Consuming first would read a stable of zero and
      // fire the floor value every time — which is exactly the bug this
      // ordering exists to not have.
      case 'geto_uzumaki': {
        const dmg0 = m.curses.uzumakiDamage(caster);
        const spent = m.curses.consumeStable(caster);

        const fw = caster.forward();
        const origin = caster.pos.clone().setY(1.35);
        m.sfx.uzumaki?.();
        m.stage.flash(1);
        m.cam.shake(1.2); m.cam.fovKick(14);
        m.hitstop(10);

        // THE SPHERE, then THE BEAM. The sphere's size is the stable size, so
        // a full-stable Uzumaki visibly dwarfs a depleted one before it has
        // dealt a single point of damage — the projected number on the HUD is
        // the promise and this is the payoff, and they have to agree.
        const scale = 0.5 + spent.weight / 20 * 1.6;
        for (let i = 0; i < 40; i++) {
          const a = rand(0, Math.PI * 2), rr = rand(0.6, 2.6) * scale;
          m.fx._spawn(origin.clone().add(v3(Math.cos(a) * rr, rand(-1, 1.4) * scale, Math.sin(a) * rr)), {
            color: i % 4 === 0 ? 0xd8a8ff : 0x6b2fa0, size: rand(0.18, 0.5) * scale, life: rand(0.2, 0.4),
            vel: v3(-Math.cos(a) * rr * 4, 0, -Math.sin(a) * rr * 4)
          });
        }
        const range = opts.range ?? 24, width = (opts.width ?? 3.4) * (0.55 + scale * 0.4);
        for (let i = 1; i <= 30; i++) {
          const p = origin.clone().addScaledVector(fw, i * (range / 30));
          m.fx._spawn(p.clone().add(v3(rand(-1, 1) * width * 0.4, rand(-1, 1) * width * 0.4, rand(-1, 1) * width * 0.4)), {
            color: i % 3 === 0 ? 0xd8a8ff : 0x6b2fa0, size: rand(0.3, 0.9) * scale, life: rand(0.25, 0.5),
            vel: fw.clone().multiplyScalar(rand(6, 16))
          });
          m.arena?.destruct?.damageAt(p, width * 0.7, opts.destruct ?? 60);
        }
        m.fx._ring(origin, 0xd8a8ff, { size: 0.6, growRate: 16, life: 0.5, flat: false });

        // the hit: a screen-crossing line, same geometry Hollow Purple uses
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * fw.x + rel.z * fw.z;
        const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
        if (sure || (along > -0.5 && along < range && perp < width * 0.5 + 0.5)) {
          const { dmg } = computeDamage(caster, dmg0 * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 9, kbY: opts.kbY ?? 3,
            hitstun: opts.hitstun ?? 46, type: 'knockdown'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        // it also erases every summon on the field that is not his — the beam
        // does not care what is standing in it
        m.curses.hurtOtherSummonsAt(
          caster.pos.clone().addScaledVector(fw, range * 0.5), range * 0.5, dmg0 * 0.5, caster);

        m.hud.toast(caster, spent.total
          ? 'UZUMAKI — ' + spent.total + ' CURSES SPENT'
          : 'UZUMAKI — NOTHING LEFT');
        caster.emit('uzumaki', { spent, dmg: dmg0 });
        break;
      }

      // YUTA'S COPY of Geto: one low-grade curse on loan. It is summoned into
      // YUTA'S ownership, so it counts against nothing of Geto's and losing it
      // costs Geto nothing at all — the same per-owner rule the copied Divine
      // Dog already plays by.
      case 'geto_copy_low': {
        m.curses.summonBorrowedLow?.(caster, { dmg: opts.dmg ?? 5 });
        break;
      }

      // =====================================================================
      // NAOYA — PROJECTION SORCERY
      // =====================================================================
      // PROJECTION RUSH. Six discrete positions at 1/24 s apart, a strike at
      // each, ending BEHIND the opponent.
      //
      // Everything here is authored to avoid interpolation. He is teleported to
      // each position (`pos.copy`, not a lerp), an afterimage is left standing
      // at each, and the six strikes are queued as an entity that fires one per
      // 1/24 s rather than as a single multi-hit window — so the damage arrives
      // on the same grid the visuals do.
      case 'naoya_rush': {
        const steps = opts.steps ?? 6;
        m.sfx.projectionRush?.();
        m.cam.shake(0.3);
        caster.model.projectionAttach?.(m.root);
        // the path: an arc around the opponent ending behind them
        const from = caster.pos.clone();
        const to = t.pos.clone();
        const base = yawBetween(to, from);              // angle of caster from target
        const radius = Math.max(1.4, opts.stepDist ?? 1.55);
        const path = [];
        for (let i = 1; i <= steps; i++) {
          const a = base + (i / steps) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
          path.push(v3(to.x + Math.sin(a) * radius, 0, to.z + Math.cos(a) * radius));
        }
        // the last position is squarely behind them
        const behind = yawBetween(to, from) + Math.PI;
        path[steps - 1] = v3(
          to.x + Math.sin(behind) * (opts.endBehind ?? 1.5), 0,
          to.z + Math.cos(behind) * (opts.endBehind ?? 1.5));
        this.entities.push({
          type: 'projRush', caster, target: t, path, i: 0,
          t: opts.stepInterval ?? 1 / 24, interval: opts.stepInterval ?? 1 / 24,
          dmg: (opts.dmgPerHit ?? 3.4) * mult, hitstun: opts.hitstun ?? 10, kb: opts.kb ?? 0.5,
          src, hitOpts
        });
        break;
      }

      // FRAME KICK → FRAME 24. The kick is no longer one strike: it is the
      // SAME kick delivered as a stack of frozen frames laid down a line, one
      // frame popping per 1/24 s — the projection sorcery drawn on screen.
      // Each frame is a hitbox for exactly one tick; the first one that
      // connects delivers the whole kick's enormous knockback and burns the
      // rest of the reel. The line is steered by the stick at cast, and the
      // 26-frame tell is still the whole negotiation.
      case 'naoya_framekick': {
        m.sfx.frameKick?.();
        caster.model.projectionAttach?.(m.root);
        caster.model.projectionStep?.(caster.pos, caster.facing);
        const dir = this._castDir(caster);
        const frames = opts.frames ?? 6;
        const spacing = (opts.spacing ?? 1.15) * caster.reachScale;
        this.entities.push({
          type: 'frameLine', caster, sure, dir,
          origin: caster.pos.clone(), i: 0, frames, spacing,
          t: 0, interval: 1 / 24, radius: opts.radius ?? 1.15,
          dmg: (opts.dmg ?? 17) * mult, kb: opts.kb ?? 13, kbY: opts.kbY ?? 1.6,
          hitstun: opts.hitstun ?? 34, destruct: opts.destruct ?? 46, hitOpts
        });
        m.cam.shake(0.3);
        break;
      }

      // MAXIMUM PROJECTION. A STATE, not an attack — it deals no damage and
      // has no hitbox. It sets three timers on him and hands the rest to
      // Fighter.update and Fighter._applyGrowth, which is where the speed and
      // the permanent stance actually live.
      case 'naoya_maxprojection': {
        const u = caster.cfg.ultimate;
        caster.maxProjT = u.duration ?? 5;
        caster.projT = 0;
        caster.projArmT = 0;
        caster.projSpent = true;         // no whiff penalty inside the ultimate
        caster.model.setProjectionStance?.(true);
        caster.model.projectionAttach?.(m.root);
        m.sfx.maxProjection?.();
        m.stage.flash(0.6);
        m.cam.shake(0.5); m.cam.fovKick(9);
        // twenty-four hard gold ticks around him, placed and left
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * 1.5, 0.1 + (i % 4) * 0.42, Math.sin(a) * 1.5)), {
            color: 0xe8c85a, size: 0.16, aspect: 0.3, life: 0.5, vel: v3()
          });
        }
        m.fx._ring(caster.pos.clone().setY(0.06), 0xe8c85a, { size: 0.5, growRate: 10, life: 0.5 });
        m.hud.toast(caster, '投射呪法・極 — MAXIMUM PROJECTION');
        caster.emit('maxProjectionStart', { duration: caster.maxProjT });
        break;
      }

      // =====================================================================
      // KASHIMO — MYTHICAL BEAST AMBER
      // =====================================================================
      // Every one of these reads the CHARGE TIER rather than a fixed number,
      // and reads it through the shared scalars in combat/charge.js so the
      // technique, the HUD and the model can never disagree about what tier he
      // is in. `chargeDmg` is NOT applied here — it rides on `dmgMult` and is
      // therefore already inside `computeDamage`. Applying it again would
      // square the curve, which was a real bug in the first pass and is the
      // single easiest mistake to make in this file.

      // LIGHTNING BOLT. A fast flat projectile that does not home: it goes
      // where he pointed it. The RANGE is the tier scaling that matters —
      // 5 m at tier 0 is a poke, 18 m at tier 3 crosses any arena in the game.
      case 'kashimo_bolt': {
        // Yuta's copy has no Charge meter of its own, so a borrowed bolt fires
        // at the tier the copy declares (1 — "working, unremarkable") rather
        // than at the caster's, which would be zero forever.
        const tier = caster.cfg.charge ? caster.chargeTier : (opts.copyTier ?? 1);
        const byTier = opts.rangeByTier ?? [5, 9, 13.5, 18];
        const range = byTier[Math.max(0, Math.min(byTier.length - 1, tier))];
        const spd = opts.speed ?? 26;
        // MYTHICAL BEAST AMBER upgrades it to a fan. Three bolts at 14 degrees
        // is a wall rather than a poke, and it is most of why the ultimate
        // changes how the opponent has to stand.
        const fan = caster.amberT > 0 ? (caster.cfg.ultimate?.boltFan ?? 3) : 1;
        for (let i = 0; i < fan; i++) {
          const spread = (i - (fan - 1) / 2) * 0.245;
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'bolt', caster, sure, tier,
            pos: caster.pos.clone().add(v3(0, 1.34, 0)).addScaledVector(dir, 0.7),
            vel: dir.clone().multiplyScalar(spd),
            dmg: (opts.dmg ?? 6) * mult, kb: opts.kb ?? 1.2, hitstun: opts.hitstun ?? 12,
            life: range / spd, fxT: 0,
            fork: tier >= (opts.forkAt ?? 3), forkDmg: (opts.forkDmg ?? 2.6) * mult,
            hitOpts
          });
        }
        m.sfx.lightningBolt?.(tier);
        break;
      }

      // DISCHARGE STRIKE. A committed thrust that dumps the stored charge as a
      // BURST on impact rather than as a point hit — so it beats a sidestep
      // that a pure thrust would miss, which is what a 51-frame move has to do
      // to be worth throwing.
      //
      // The Charge cost was already taken by the state machine? NO — it is
      // taken HERE, on the activation frame, deliberately: an interrupted
      // Discharge Strike should cost him the cursed energy (spent on the press,
      // like every other technique) and NOT the Charge, because the charge was
      // never released. Getting hit out of the windup is punishing enough.
      case 'kashimo_discharge': {
        const tier = caster.chargeTier;
        const reach = (opts.reach ?? 2.6);
        const radius = (opts.burstRadius ?? 2.2) * chargeSize(caster)
          * (caster.amberT > 0 ? (caster.cfg.ultimate?.burstMult ?? 2) : 1);
        const at = caster.pos.clone().setY(1.05).addScaledVector(caster.forward(), reach * 0.65);
        m.sfx.discharge?.(tier);
        m.cam.shake(0.4 + tier * 0.12);
        m.cam.fovKick(4 + tier * 1.5);
        m.fx._ring(at.clone().setY(0.06), 0xa46bff, { size: 0.4, growRate: 9 + radius * 3, life: 0.30 });
        for (let i = 0; i < 16 + tier * 6; i++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.1, radius), rand(-0.6, 0.9), Math.sin(a) * rand(0.1, radius))), {
            color: i % 3 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.10, 0.28), aspect: 0.35,
            life: rand(0.14, 0.30), vel: v3(rand(-3, 3), rand(0.5, 4), rand(-3, 3))
          });
        }
        m.arena?.destruct?.damageAt(at, radius, opts.destruct ?? 30);
        // the burst is a RADIUS test around the impact point, not an arc test
        const inBurst = sure || flatDist(t.pos, at) < radius + (t.hurtBox?.radius ?? 0.62);
        if (inBurst) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 20) * mult);
          // THE STAGGER. Extra HITSTUN, applied as an ordinary heavy hit — it
          // is deliberately NOT the `frozen` state, so it can never be mistaken
          // for Naoya's one-second lock either by the player or by any system
          // that reads state. Below the tier gate there is no stagger at all.
          const st = opts.stunFrames ?? [0, 0, 26, 34];
          const stun = tier >= (opts.stunAt ?? 2) ? (st[tier] ?? 0) : 0;
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.5, kbY: opts.kbY ?? 1.2,
            hitstun: Math.max(opts.hitstun ?? 30, stun), type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') {
            gainCharge(caster, 'tech');
            if (stun > 0) {
              m.hitstop(10);
              m.hud.toast(t, '感電 STAGGERED');
              t.emit('staggered', { frames: stun });
            }
          }
        }
        // ---- THE CHARGE COST, AND WHY IT IS TAKEN LAST -------------------
        // A REAL BUG, found by measuring damage per tier in a live match
        // rather than by reading this file. Spending first meant the tier had
        // already dropped by the time `computeDamage` read `dmgMult`, so a
        // tier-3 Discharge landed for tier-2 damage and a tier-2 one landed
        // for tier-0 damage and inflicted NO stagger at all. Measured: 18.2 /
        // 23.9 / 18.2 / 28.7 across the four tiers — non-monotonic, which is
        // the shape of a bug rather than of a curve.
        //
        // The strike is powered by the charge he HAD when he threw it. It
        // costs him the engine AFTERWARDS, which is also the only reading of
        // "his best move costs him his engine" that is not simply a worse move.
        //
        // And it DRAINS rather than gates: `spendCharge` refuses outright when
        // he cannot afford the full cost, which meant a Kashimo at 30 charge
        // paid nothing at all and kept his tier for free. Draining what he has
        // is what the design says and what a capacitor does.
        if (caster.amberT <= 0) {
          const cost = opts.chargeCost ?? 35;
          spendCharge(caster, Math.min(caster.charge, cost));
        }
        break;
      }

      // ARC DASH's pass. The blink itself already happened in Fighter._arcDash
      // — this is only what the line between the two points DID. Everything
      // inside a cylinder from `from` to `to` is hit once.
      case 'kashimo_arcpass': {
        const from = opts.from ?? caster.pos.clone();
        const to = opts.to ?? caster.pos.clone();
        const seg = to.clone().sub(from);
        const len = Math.max(0.001, Math.hypot(seg.x, seg.z));
        const nx = seg.x / len, nz = seg.z / len;
        const rad = opts.radius ?? 1.15;
        // the trail: hard bright segments left along the line, not a smooth
        // ribbon — the same reasoning as Naoya's afterimages
        const steps = Math.max(3, Math.round(len / 0.45));
        for (let i = 0; i <= steps; i++) {
          const u = i / steps;
          const p = from.clone().lerp(to, u).setY(1.05 + Math.sin(u * 7) * 0.22);
          m.fx._spawn(p, {
            color: i % 2 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.14, 0.30), aspect: 0.28,
            life: rand(0.14, 0.26), vel: v3(rand(-1, 1), rand(-0.4, 1.6), rand(-1, 1))
          });
        }
        m.sfx.arcDash?.();
        m.cam.shake(0.18);
        // who did it pass through? Project each living opponent onto the
        // segment and test the perpendicular distance — a pass that goes AROUND
        // somebody should miss them, and an arc test cannot express that.
        for (const foe of m.activeFighters ?? [t]) {
          if (!foe || foe === caster || !foe.alive) continue;
          const dx = foe.pos.x - from.x, dz = foe.pos.z - from.z;
          const along = Math.max(0, Math.min(len, dx * nx + dz * nz));
          const px = from.x + nx * along, pz = from.z + nz * along;
          const perp = Math.hypot(foe.pos.x - px, foe.pos.z - pz);
          if (perp > rad + (foe.hurtBox?.radius ?? 0.62)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * mult, { canCrit: false });
          const r = foe.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 1.6, kbY: 0,
            hitstun: opts.hitstun ?? 14, type: 'light',
            dir: v3(nx, 0, nz)
          }, m.ctxFor(caster));
          hitFeedback(m, caster, foe, r, {});
          // THE REFUND, and the whole economy of the move: a pass that
          // connects pays back MORE than it cost, so aggression is rewarded
          // and a whiffed chain genuinely disarms him.
          if (r === 'hit' || r === 'otg') gainCharge(caster, 'arcPass');
        }
        break;
      }

      // MYTHICAL BEAST AMBER, FULL RELEASE. A STATE, like Naoya's ultimate: no
      // hitbox, no damage, three fields set on him and everything else handled
      // by the systems that already read them.
      case 'kashimo_amber': {
        const u = caster.cfg.ultimate;
        caster.amberT = u.duration ?? 8;
        caster.charge = caster.cfg.charge?.max ?? 100;
        caster.chargeTier = 3;
        caster.arcChain = 0;
        caster.specialCD = 0;
        caster.model.setAmber?.(true);
        caster.model.setCharge?.(3, 1);
        m.sfx.amber?.();
        m.stage.flash(0.7);
        m.cam.shake(0.6); m.cam.fovKick(10);
        for (let i = 0; i < 30; i++) {
          const a = (i / 30) * Math.PI * 2;
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * 1.4, 0.1 + (i % 6) * 0.34, Math.sin(a) * 1.4)), {
            color: i % 3 === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.14, 0.30), aspect: 0.3,
            life: rand(0.4, 0.8), vel: v3(Math.cos(a) * 2, rand(2, 6), Math.sin(a) * 2)
          });
        }
        m.fx._ring(caster.pos.clone().setY(0.06), 0xa46bff, { size: 0.5, growRate: 14, life: 0.6 });
        m.hud.toast(caster, '灼爛趙誅 — MYTHICAL BEAST AMBER');
        caster.emit('amberStart', { duration: caster.amberT });
        break;
      }

      // =====================================================================
      // PANDA — THE THREE CORES
      // =====================================================================
      // Five techniques across three stances, and each one is written to be
      // the thing its stance is FOR: the balanced core controls space, Gorilla
      // punishes, the Triceratops leaves. The frame data that makes them feel
      // different lives in characters/panda.js; what lives here is what each
      // one actually does on connect.

      // BALANCED · CURSED PALM. A short shockwave off a two-paw slam. No
      // projectile — the brief is explicit that this core has a projectile-less
      // mid-range game, and a radius burst at 2.45 m is the honest version of
      // "mid-range" for a fighter with no ranged tool at all.
      case 'panda_palm': {
        // QUAKE PALM. The palm goes into the FLOOR, and the floor carries it:
        // a rupture front of thrown turf and stone that runs six and a half
        // metres down the lane, steered by the stick, popping whoever it
        // reaches into the air. His only ranged tool, and the balanced core's
        // reason to exist — the other two stances hit harder up close.
        m.sfx.pandaPalm?.();
        m.cam.shake(0.4);
        const dir = this._castDir(caster);
        m.fx._ring(caster.pos.clone().setY(0.06).addScaledVector(dir, 0.8),
          0xdfe4ee, { size: 0.4, growRate: 10, life: 0.28 });
        this.entities.push({
          type: 'quakeWave', caster, sure, dir,
          pos: caster.pos.clone().setY(0).addScaledVector(dir, 1.0),
          spd: opts.speed ?? 12, travelled: 0, range: opts.range ?? 6.5,
          radius: opts.radius ?? 1.5, dealt: false,
          dmg: (opts.dmg ?? 13) * mult, kb: opts.kb ?? 3.5, kbY: opts.kbY ?? 6.5,
          hitstun: opts.hitstun ?? 26, hitOpts, fxT: 0
        });
        break;
      }

      // BALANCED · ROLLING PRESS. He tucks and rolls forward, landing on them.
      // A travelling hit rather than a burst, so it can be walked around — his
      // gap closer, and deliberately a mediocre one.
      case 'panda_roll': {
        m.sfx.pandaRoll?.();
        this.entities.push({
          type: 'pandaRoll', caster, target: t, sure,
          t: 0, dur: 0.34, travel: opts.travel ?? 5.2,
          dir: caster.forward(), reach: opts.reach ?? 2.0,
          dmg: (opts.dmg ?? 16) * mult, kb: opts.kb ?? 5, kbY: opts.kbY ?? 1.2,
          hitstun: opts.hitstun ?? 28, hitOpts, dealt: false
        });
        break;
      }

      // GORILLA · UNBLOCKABLE DRUMMING BEAT 不可視の連打. CANON, BY NAME. He
      // beats his chest and the shock goes THROUGH the guard: `unblockable`,
      // which the damage pipeline already honours (Todo's Vice Grab uses the
      // same flag), so a blocked Drumming Beat deals its damage in full.
      //
      // It is short and slow because of that. An unblockable with reach would
      // have no counterplay; at 2.2 m and 20 frames of startup the counterplay
      // is the one Gorilla always has against him, which is distance.
      case 'panda_drum': {
        const radius = opts.radius ?? 2.20;
        const at = caster.pos.clone().setY(1.15).addScaledVector(caster.forward(), radius * 0.4);
        m.sfx.drummingBeat?.();
        m.cam.shake(0.55);
        m.cam.fovKick(5);
        // three concentric rings on the beat — the shock is the point, so it
        // reads as a wave rather than as an impact
        for (let k = 0; k < 3; k++) {
          m.fx._ring(at.clone().setY(0.06 + k * 0.5), 0xd9a94e,
            { size: 0.3 + k * 0.25, growRate: radius * 4.5, life: 0.30 + k * 0.06 });
        }
        for (let i = 0; i < 18; i++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.2, radius), rand(-0.4, 1.0), Math.sin(a) * rand(0.2, radius))), {
            color: i % 3 === 0 ? 0xfff0cc : 0xd9a94e, size: rand(0.12, 0.30), aspect: 0.5,
            life: rand(0.16, 0.32), vel: v3(Math.cos(a) * 4, rand(0.3, 2), Math.sin(a) * 4)
          });
        }
        m.arena?.destruct?.damageAt(at, radius, 36);
        if (sure || flatDist(t.pos, at) < radius + (t.hurtBox?.radius ?? 0.62)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 19) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.5, kbY: opts.kbY ?? 1.0,
            hitstun: opts.hitstun ?? 28, type: 'heavy',
            // THE WHOLE TECHNIQUE, IN ONE FIELD
            unblockable: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit') { m.hitstop(10); m.hud.toast(t, '不可視の連打 — THROUGH THE GUARD'); }
        }
        break;
      }

      // GORILLA · SLAM. The overhead. Slow, enormous, and it ends with them on
      // the floor and him standing over it.
      case 'panda_slam': {
        const reach = opts.reach ?? 2.35;
        const at = caster.pos.clone().setY(0.5).addScaledVector(caster.forward(), reach * 0.6);
        m.sfx.slam();
        m.cam.shake(0.75);
        m.cam.fovKick(8);
        m.fx._ring(at.clone().setY(0.06), 0xd9a94e, { size: 0.5, growRate: 14, life: 0.4 });
        for (let i = 0; i < 22; i++) {
          const a = Math.random() * Math.PI * 2;
          m.fx._spawn(at.clone().add(v3(Math.cos(a) * rand(0.2, 2.2), rand(0, 0.5), Math.sin(a) * rand(0.2, 2.2))), {
            color: i % 4 === 0 ? 0xfff0cc : 0x8a7a5c, size: rand(0.14, 0.36),
            life: rand(0.2, 0.5), vel: v3(Math.cos(a) * 5, rand(2, 6), Math.sin(a) * 5)
          });
        }
        m.arena?.destruct?.damageAt(at, 2.6, opts.destruct ?? 52);
        if (sure || inArc(caster, t, reach, opts.arc ?? 1.2)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 26) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.5, kbY: 0,
            hitstun: opts.hitstun ?? 34, type: 'knockdown'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true, knockdown: true });
        }
        break;
      }

      // TRICERATOPS · GORE CHARGE. A long run-through with the horns down. The
      // damage is modest; what it buys is seven metres of ground and a body
      // behind him. Entity-driven so it genuinely travels and can genuinely be
      // sidestepped, which a one-frame reach test could not express.
      case 'panda_gore': {
        m.sfx.goreCharge?.();
        m.cam.shake(0.3);
        this.entities.push({
          type: 'pandaGore', caster, target: t, sure,
          t: 0, dur: (opts.travel ?? 7.2) / (opts.speed ?? 15),
          speed: opts.speed ?? 15, dir: caster.forward(), reach: opts.reach ?? 1.9,
          dmg: (opts.dmg ?? 12) * mult, kb: opts.kb ?? 4, kbY: opts.kbY ?? 1,
          hitstun: opts.hitstun ?? 22, destruct: opts.destruct ?? 34,
          hitOpts, dealt: false, fxT: 0
        });
        break;
      }

      // TRICERATOPS · CREST ROLL. The evasive option and the reason the stance
      // exists: a backward roll behind the frill with real invulnerability on
      // it, leaving a light hit where he was. It does not beat pressure, it is
      // not there for it.
      case 'panda_crestroll': {
        const back = caster.forward().multiplyScalar(-(opts.travel ?? 4.6));
        const dest = caster.pos.clone().add(back);
        dest.y = 0;
        const r0 = Math.hypot(dest.x, dest.z), lim = caster.boundRadius;
        if (r0 > lim) { const k = lim / r0; dest.x *= k; dest.z *= k; }
        const from = caster.pos.clone();
        caster.pos.copy(dest);
        caster.prevPos.copy(dest);
        caster.vel.set(0, 0, 0);
        caster.iFrames = Math.max(caster.iFrames, opts.iFrames ?? 14);
        m.sfx.crestRoll?.();
        for (let i = 0; i <= 6; i++) {
          m.fx._spawn(from.clone().lerp(dest, i / 6).setY(0.5), {
            color: 0xe08aa8, size: rand(0.16, 0.34), aspect: 0.6,
            life: rand(0.12, 0.26), vel: v3(rand(-1, 1), rand(0.2, 1.4), rand(-1, 1))
          });
        }
        // the hit it leaves behind, at the position he rolled OUT of
        const radius = opts.radius ?? 1.6;
        if (sure || flatDist(t.pos, from) < radius + (t.hurtBox?.radius ?? 0.62)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.5, kbY: 0,
            hitstun: opts.hitstun ?? 16, type: 'light',
            dir: back.normalize().multiplyScalar(-1)
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
        }
        break;
      }

      // THREE CORES, ONE BODY 三核共鳴. A STATE, like the other two non-domain
      // "become better" ultimates in the roster. It sets the `all` stance and
      // two numbers; everything else is already routed through the stance
      // system, which is precisely why the ultimate was cheap to build and why
      // it genuinely plays as all three characters at once rather than as a
      // damage buff with a different name.
      case 'panda_allcores': {
        const u = caster.cfg.ultimate;
        const n = Math.max(1, caster.cores.filter(c => c.alive && c.hp > 0).length);
        // FIXED AT CAST TIME. Losing a core during the window must not retune
        // a window the player already paid a full bar for.
        caster.allCoresMult = u.byCores?.[n] ?? 1;
        caster.allCoresT = (u.duration ?? 12) * caster.allCoresMult;
        caster._allCoresFrom = caster.stance;
        caster._setStance('all', { silent: true });
        caster.model.setAllCores?.(true);
        m.sfx.allCores?.(n);
        m.stage.flash(0.5 + n * 0.08);
        m.cam.shake(0.5); m.cam.fovKick(8);
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          const col = [0xf2f2ec, 0xd9a94e, 0xe08aa8][i % 3];
          m.fx._spawn(caster.pos.clone().add(v3(Math.cos(a) * 1.5, 0.2 + (i % 5) * 0.4, Math.sin(a) * 1.5)), {
            color: col, size: rand(0.16, 0.34), life: rand(0.4, 0.8),
            vel: v3(Math.cos(a) * 2.5, rand(1.5, 5), Math.sin(a) * 2.5)
          });
        }
        for (let k = 0; k < 3; k++) {
          m.fx._ring(caster.pos.clone().setY(0.06), [0xf2f2ec, 0xd9a94e, 0xe08aa8][k],
            { size: 0.4 + k * 0.3, growRate: 10, life: 0.5 });
        }
        m.hud.toast(caster, '三核共鳴 — ' + n + ' CORES');
        caster.emit('allCoresStart', { cores: n, mult: caster.allCoresMult, duration: caster.allCoresT });
        break;
      }

      case 'gojo_red': {
        // RED 赫 — convergence inverted, and now it TRAVELS: a core of
        // stored repulsion flown down the lane that lets go all at once on
        // contact, blasting the target off their feet and shoving the level
        // apart as it passes. Same damage and knockdown as the old cone; the
        // difference is that it is a visible object with a flight time, so
        // sidestepping it is a real play and landing it is a real read.
        const dir = caster.forward();
        m.fx._ring(caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.7),
          0xff8a6a, { size: 0.35, growRate: 10, life: 0.25, flat: false });
        this.entities.push({
          type: 'redOrb', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.7),
          spd: opts.speed ?? 20, travelled: 0, range: opts.range ?? 7.5,
          dmg: (opts.dmg ?? 11) * mult, kb: opts.kb ?? 7.5, kbY: opts.kbY ?? 3.2,
          hitOpts, fxT: 0
        });
        m.sfx.red();
        break;
      }
      case 'gojo_blue': {
        const pos = t.pos.clone().add(v3(0, 1, 0));
        if (!sure) {
          const fw = caster.forward();
          pos.copy(caster.pos).addScaledVector(fw, Math.min(opts.range ?? 6.5, caster.pos.distanceTo(t.pos) * 0.8)).setY(1.1);
        }
        this.entities.push({
          type: 'blue', pos, t: opts.pullTime ?? 0.7, caster,
          dmg: (opts.dmg ?? 5) * mult, sure,
          fxNode: this.match.fx.blueOrb(pos)
        });
        m.sfx.blue();
        break;
      }
      case 'purple': {
        const fw = caster.forward();
        m.fx.purpleBeam(caster.pos.clone().setY(1.3), fw);
        m.sfx.purple();
        // HOLLOW PURPLE ERASES. Walk the beam and delete everything on the
        // line — this is the one damage source that ignores an object's hp.
        for (let i = 1; i <= 26; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.3).addScaledVector(fw, i), 2.0, 1, { kind: 'erase' });
        }
        m.stage.flash(1);
        m.cam.shake(1.0); m.cam.fovKick(10);
        // screen-crossing line: hits if the opponent is anywhere along it
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * fw.x + rel.z * fw.z;
        const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
        if (sure || (along > -0.5 && perp < (opts.width ?? 1.6) + 0.5)) {
          const { dmg } = computeDamage(caster, (opts.dmg ?? 45) * mult, { canCrit: false });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 9, kbY: 5, hitstun: 40, type: 'knockdown', unblockable: true }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        break;
      }
      case 'yuta_rika_swing': {
        // RIKA'S GRASP. She still appears at his shoulder — but now her ARM
        // goes out: an oversized spectral hand flown down the lane, and what
        // it catches it BRINGS BACK, deposited at arm's reach in front of
        // Yuta with the combo already his. The swing's damage is unchanged;
        // the payoff moved from knockback to position, which is the scarier
        // gift. Whiffing leaves the hand to dissolve at full extension.
        m.fx.rikaFlash(caster, 'swing');
        m.sfx.rikaSwing();
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'rikaHand', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.3, 0)).addScaledVector(dir, 1.0),
          spd: opts.speed ?? 17, travelled: 0, range: opts.range ?? 6.0,
          dmg: (opts.dmg ?? 14) * mult, hitstun: opts.hitstun ?? 26,
          dragGap: opts.dragGap ?? 1.6,
          node: m.fx.rikaHandNode(), hitOpts, fxT: 0
        });
        break;
      }
      case 'yuta_lunge': {
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 14);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 14);
        this.entities.push({ type: 'lungeHit', caster, frames: 12, dmg: (opts.dmg ?? 8) * mult, kb: opts.kb ?? 1.2, hitstun: opts.hitstun ?? 18, src });
        m.sfx.lunge();
        m.fx.dashTrail(caster);
        break;
      }
      case 'sword_slash': {
        // in-domain lunging slash: the connect window resolves against the
        // domain system (swordHit), not the damage pipeline — whiffable, and
        // that whiff is the whole skill check
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 12);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 12);
        this.entities.push({ type: 'slashHit', caster, frames: opts.active ?? 8, reach: opts.reach ?? 2.5, arc: opts.arc ?? 2.0 });
        m.sfx.swordSwing();
        m.fx.dashTrail(caster);
        break;
      }
      case 'rika_blast': {
        m.fx.rikaFlash(caster, 'blast');
        m.sfx.rikaSwing();
        if (sure || inArc(caster, t, 6, 1.2)) {
          const { dmg } = computeDamage(caster, 10 * mult, { canCrit: false });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 4, kbY: 2, hitstun: 22, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        break;
      }
      case 'nanami_cleave': {
        // RATIO WAVE. The blunt blade projects its edge: a wide bar of gold
        // that crosses seven metres of floor with the white 7:3 line drawn on
        // its face. The technique IS the ratio, so the wave enforces it —
        // caught in the band around seventy percent of its range, the hit is
        // a guaranteed critical, exactly as if the blade itself had found the
        // weak point. Landing anywhere still applies the 7:3 mark.
        m.fx.cleaveArc(caster);
        m.sfx.cleave();
        const dir = this._castDir(caster);
        const range = opts.range ?? 7.0;
        this.entities.push({
          type: 'ratioWave', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.1, 0)).addScaledVector(dir, 0.8),
          spd: opts.speed ?? 15, travelled: 0, range,
          sweetLo: range * 0.6, sweetHi: range * 0.8,
          width: opts.width ?? 2.4, dmg: (opts.dmg ?? 12) * mult,
          kb: opts.kb ?? 3.5, kbY: opts.kbY ?? 0.5, hitstun: opts.hitstun ?? 22,
          appliesMark: !!(opts.appliesMark && caster.cfg.ratio),
          hitOpts, fxT: 0
        });
        break;
      }
      case 'nanami_overtime': {
        caster.buffs.overtime = opts.duration ?? 8;
        m.fx.overtimeAura(caster, opts.duration ?? 8);
        m.sfx.overtime();
        m.hud.toast(caster, 'OVERTIME');
        break;
      }
      case 'yuji_divergent': {
        // DIVERGENT FIST. The fist lands now; the cursed energy arrives a
        // beat later as a VISIBLE crimson ghost of the same punch, erupting
        // out of the body it is already inside. Both impacts open the Black
        // Flash window. NEW: a whiffed fist is no longer a dead move — the
        // late energy has to go SOMEWHERE, so it discharges forward as a
        // short-range ghost-fist projectile. Weaker, no Black Flash, and the
        // chain still dies — but the whiff now says what the technique IS.
        m.fx.divergentJab(caster);
        m.sfx.hit(true);
        if (sure || inArc(caster, t, opts.reach ?? 1.9, opts.arc ?? 1.6)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * mult);
          const r = t.applyHit({ ...hitOpts, dmg, kb: opts.kb ?? 2, kbY: 0, hitstun: opts.hitstun ?? 18, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') openBlackFlash(caster, dmg);
          this.entities.push({ type: 'yujiShock', t: opts.delay ?? 0.45, caster, dmg: (opts.dmg2 ?? 10) * mult, sure });
        } else {
          caster.bfChain = 0; // whiffed the technique: the chain is done
          const dir = caster.forward();
          this.entities.push({
            type: 'ghostFist', caster, dir, delay: opts.delay ?? 0.45,
            pos: caster.pos.clone().add(v3(0, 1.3, 0)).addScaledVector(dir, 1.2),
            spd: opts.ghostSpeed ?? 16, travelled: 0, range: opts.ghostRange ?? 6.5,
            dmg: (opts.dmg2 ?? 10) * 0.7 * mult, hitOpts, fxT: 0
          });
        }
        break;
      }
      case 'yuji_manji': {
        // MANJI KICK. The kick still carries him in — and now it THROWS the
        // 卍: a spinning crescent of cursed energy released off the heel,
        // steered by the stick, so the lunge and the wave bracket the
        // opponent from two directions at once. The old single hit's damage
        // is split across the pair; eating both costs slightly more.
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 13.5);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 13.5);
        if (opts.staminaCost) caster.res.stamina = Math.max(0, caster.res.stamina - opts.staminaCost);
        this.entities.push({
          type: 'lungeHit', caster, frames: 14, dmg: (opts.dmg ?? 6) * mult,
          kb: opts.kb ?? 7, hitstun: opts.hitstun ?? 24, heavy: true, src
        });
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'crescent', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.2, 0)).addScaledVector(dir, 0.9),
          spd: opts.waveSpeed ?? 15, travelled: 0, range: opts.waveRange ?? 7,
          dmg: (opts.waveDmg ?? 7) * mult, kb: 4, kbY: 1.5, hitstun: 22,
          color: 0xffa04a, hitOpts, fxT: 0
        });
        m.sfx.lunge();
        m.fx.dashTrail(caster);
        break;
      }
      case 'yuji_sukuna': {
        const u = caster.cfg.ultimate;
        caster.buffs.sukuna = u.duration ?? 8;
        caster.model.setSukuna?.(true);
        m.fx.buffAura(caster, u.duration ?? 8, 0xff2038);
        m.sfx.sukuna();
        m.stage.flash(0.6);
        m.cam.shake(0.7);
        m.cam.fovKick(8);
        m.hud.toast(caster, u.name);
        break;
      }
      case 'todo_clapcombo': {
        // RESONANT CLAP. He claps and the CONCUSSION goes without him: a wall
        // of pink shock that crosses the arena at head height, steered by the
        // stick at cast. What it does on arrival is drag the body BACK toward
        // Todo — a clap is a pressure wave, and the low-pressure pocket behind
        // it is the half everyone forgets. Mechanically that pull is the whole
        // move: it feeds the Vice Grab, which is the fight he wants.
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'clapWave', caster, sure, dir,
          pos: caster.pos.clone().add(v3(0, 1.1, 0)).addScaledVector(dir, 0.8),
          spd: opts.speed ?? 13, travelled: 0, range: opts.range ?? 8.5,
          width: opts.width ?? 2.6, pull: opts.pull ?? 3.2,
          dmg: (opts.dmg ?? 14) * mult, kb: opts.kb ?? 2.0,
          hitstun: opts.hitstun ?? 26, hitOpts, fxT: 0, dealt: false
        });
        // the clap itself, at the hands
        const at = caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.7);
        m.fx._ring(at, TODO_ACCENT, { size: 0.4, growRate: 14, life: 0.3, flat: false });
        m.fx._spawn(at, { color: 0xffffff, size: 0.7, life: 0.16, vel: v3() });
        m.sfx.clap();
        m.cam.shake(0.3);
        break;
      }
      case 'todo_grab': {
        // command grab: unblockable, but it only closes on a standing,
        // grounded target — jumping (or already being down) beats it
        const grabbable = t.grounded && !['knockdown', 'getup', 'launched', 'ko'].includes(t.state);
        if ((sure || inArc(caster, t, opts.reach ?? 1.7, 1.6)) && grabbable) {
          t.pos.copy(caster.pos).addScaledVector(caster.forward(), 1.1);
          t.prevPos.copy(t.pos);
          const { dmg } = computeDamage(caster, (opts.dmg ?? 24) * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: 3.5, kbY: 0, hitstun: 40, type: 'knockdown',
            unblockable: true, otgOk: false
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true, knockdown: true });
          m.fx._ring(t.pos.clone().setY(0.08), TODO_ACCENT, { size: 0.7, growRate: 13, life: 0.4 });
          m.sfx.slam();
          m.cam.shake(0.8);
          m.cam.fovKick(8);
          m.hitstop(14);
          m.stage.flash(0.3);
        } else {
          m.sfx.whiff();
        }
        break;
      }
      case 'todo_boogie_cast': {
        // Yuta's copied Boogie Woogie: the swap as a castable technique.
        // The snap uses the CASTER's accent so a copy reads as Yuta's energy.
        const ax = caster.pos.x, az = caster.pos.z;
        const a = caster.pos.clone(), b = t.pos.clone();
        caster.pos.x = t.pos.x; caster.pos.z = t.pos.z;
        t.pos.x = ax; t.pos.z = az;
        caster.prevPos.copy(caster.pos);
        t.prevPos.copy(t.pos);
        t.aimLag = 0.28; // same disorientation as the real thing
        m.sfx.clap();
        m.fx.boogieSwap(a, b, caster.model.palette.accent ?? TODO_ACCENT);
        const { dmg } = computeDamage(caster, (opts.dmg ?? 5) * mult, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.5, kbY: 0, hitstun: 14, type: 'light' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        break;
      }
      case 'todo_brotherhood': {
        // BROTHERHOOD: a chain of swap-blows handled by an entity — every
        // interval Todo blinks to a new angle and strikes, ending in one
        // enormous finisher
        this.entities.push({
          type: 'brotherhood', caster, t: 0.28,
          swings: opts.swings ?? 5, interval: opts.interval ?? 0.33,
          hitDmg: opts.hitDmg ?? 7, finDmg: opts.finDmg ?? 18
        });
        m.sfx.clap();
        m.stage.flash(0.3);
        m.cam.shake(0.4);
        break;
      }
      case 'jogo_embers': {
        // EMBER INSECTS: a fan of small homing flame projectiles with loose
        // tracking. Overheat upgrades to the MAXIMUM screen-crossing swarm.
        const max = caster.buffs.overheat > 0 && caster.cfg.ct1?.maximum;
        const count = (max ? max.count : opts.count) ?? 4;
        const spd = (max ? max.speed : opts.speed) ?? 9;
        const range = (max ? max.range : opts.range) ?? 12;
        const homing = (max ? max.homing : opts.homing) ?? 2.4;
        const dmg = ((max ? max.dmg : opts.dmg) ?? 2.5) * mult;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.28;
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'ember', caster, sure,
            pos: caster.pos.clone().add(v3(0, 1.35, 0)).addScaledVector(dir, 0.5)
              .add(v3(rand(-0.2, 0.2), rand(-0.15, 0.35), rand(-0.2, 0.2))),
            vel: dir.multiplyScalar(spd * rand(0.85, 1.15)),
            spd, homing, dmg, burn: opts.burnStacks ?? 1,
            life: range / spd, delay: i * 0.05, fxT: 0
          });
        }
        m.sfx.ember();
        break;
      }
      case 'jogo_eruption': {
        // VOLCANIC ERUPTION: delayed blast at a targeted ground position. The
        // left stick aims (character-relative); neutral leads the opponent.
        // The glowing marker telegraph is the point — trap, not poke.
        const max = caster.buffs.overheat > 0 && caster.cfg.ct2?.maximum;
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 8) * mag);
        } else {
          // neutral: the opponent's feet, led by their current velocity
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.delay ?? 0.85) * 0.6);
        }
        at.y = 0;
        const r = Math.hypot(at.x, at.z);
        const lim = caster.arenaRadius - 0.3;
        if (r > lim) { at.x *= lim / r; at.z *= lim / r; }
        this.entities.push({
          type: 'eruption', caster, pos: at, sure,
          t: opts.delay ?? 0.85, radius: (max ? max.radius : opts.radius) ?? 2.2,
          dmg: ((max ? max.dmg : opts.dmg) ?? 18) * mult,
          kb: opts.kb ?? 4, kbY: opts.kbY ?? 9, burn: opts.burnStacks ?? 2,
          stages: max ? (max.stages ?? 3) : 1, stageGap: max ? (max.stageGap ?? 0.55) : 0,
          fxT: 0
        });
        m.sfx.eruptPrime();
        break;
      }
      case 'jogo_overheat': {
        const sp = caster.cfg.special;
        caster.buffs.overheat = sp.duration ?? 10;
        caster.model.setOverheat?.(true);
        m.fx.buffAura(caster, sp.duration ?? 10, 0xff5a1f);
        m.sfx.overheat();
        m.stage.flash(0.35);
        m.cam.shake(0.5);
        m.hud.toast(caster, 'OVERHEAT — MAXIMUM');
        break;
      }
      case 'mahito_soultouch': {
        // SOUL TOUCH: short, narrow grab-strike. Lands = damage + SOUL WOUND
        // (increased damage taken). Whiffs badly — it's a read.
        m.fx.soulGrasp(caster);
        m.sfx.soulTouch();
        if (sure || inArc(caster, t, opts.reach ?? 1.6, opts.arc ?? 1.1)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 10) * mult);
          const r = t.applyHit({ ...hitOpts, dmg, kb: opts.kb ?? 2.5, kbY: 0, hitstun: opts.hitstun ?? 26, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg' || r === 'block') {
            if (r !== 'block') {
              const sw = opts.soulWound ?? { duration: 6, dmgTakenMult: 1.3 };
              t.buffs.soulWound = sw.duration;
              t.soulWoundMult = sw.dmgTakenMult;
              m.hud.toast(t, 'SOUL WOUND');
              // the touched soul yanked briefly visible — the read for "your
              // shape is his now" that a bare ring never carried
              m.fx.soulRip(t.pos.clone());
              m.fx._ring(t.pos.clone().add(v3(0, 1.25, 0)), 0x8b9bab, { size: 0.4, growRate: 6, life: 0.4, flat: false });
            }
            m.domains.transfigChunk(caster, t, 'soulTouch', r === 'block');
          }
        } else {
          m.sfx.whiff();
        }
        break;
      }
      case 'mahito_bodyweapon': {
        // BODY LANCE. The arm no longer swings — it LEAVES: reshaped into a
        // segmented lance of pale flesh that shoots out six and a half metres
        // and reels back in, steered by the stick as it extends. The hammer
        // variant still flattens on connect. Idle Transfiguration rides the
        // steel exactly as it rode the swing: any touch feeds the soul chunk.
        // clamp: bwVariant is -1 until startCT's rotation first picks one
        // (a copied or sure-hit cast can arrive before that)
        const variant = Math.max(0, opts.variant ?? caster.bwVariant ?? 0);
        caster.model.showBodyWeapon?.(variant);
        m.sfx.bodyMorph(variant);
        const dir = this._castDir(caster);
        this.entities.push({
          type: 'bodyLance', caster, sure, dir, variant,
          t: 0, extend: opts.extendTime ?? 0.22, hold: opts.holdTime ?? 0.1,
          reach: opts.reach ?? 6.5, dealt: false,
          dmg: (opts.dmg ?? 16) * mult, kb: opts.kb ?? 5, kbY: opts.kbY ?? 2,
          hitstun: opts.hitstun ?? 30, hitOpts, fxT: 0
        });
        break;
      }
      case 'mahito_summon': {
        m.minions?.spawn(caster);
        m.sfx.summon();
        m.hud.toast(caster, 'TRANSFIGURED HUMAN');
        break;
      }
      case 'megumi_shikigami': {
        // The bound slot fires. Outside the domain the shikigami comes up out
        // of the shadow in front of him; INSIDE it, the shadow is everywhere,
        // so a share of summons erupt directly under the opponent instead —
        // that ambush is the domain's teeth.
        const key = opts.shikigami;
        if (!key) break;
        const gs = m.domains.gardenFor?.(caster);
        let at = caster.pos.clone().addScaledVector(caster.forward(), 1.6);
        if (gs && Math.random() < (gs.def.shadow.ambushChance ?? 0.5)
          && m.domains.shadowContains(t.pos)) {
          at = t.pos.clone().addScaledVector(
            v3(t.pos.x - caster.pos.x, 0, t.pos.z - caster.pos.z).normalize(), 1.2);
        }
        at.y = 0;
        m.domains.clampToShadow?.(at);
        m.shikigami.summon(caster, key, { at });
        m.cam.shake(key === 'elephant' ? 0.6 : 0.2);
        break;
      }
      case 'megumi_copy_dog': {
        // Yuta's Copy of the Ten Shadows: ONE Divine Dog on loan (not the
        // pair), short leash, reduced health. Loss is tracked per owner, so
        // this dog dying never touches Megumi's ledger.
        m.shikigami.summonBorrowed(caster, 'divineDogs', {
          at: caster.pos.clone().addScaledVector(caster.forward(), 1.4),
          dmg: opts.dmg ?? 6, hpMult: 0.65, life: 9, single: true
        });
        break;
      }
      // ---- MAHORAGA ------------------------------------------------------
      case 'mahoraga_wheel_slash': {
        // WHEEL SLASH: one flat sweep of the blade through a wide arc. Long
        // reach, everything in front of him, and it takes the scenery with it.
        const reach = opts.reach ?? 5.2, arc = opts.arc ?? 2.8;
        m.fx.wheelArc(caster, reach);
        m.sfx.wheelSlash();
        m.cam.shake(0.35);
        // the arc scours the level along its own sweep
        for (let i = -2; i <= 2; i++) {
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), i * (arc / 5));
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.4).addScaledVector(dir, reach * 0.7),
            opts.destroyRadius ?? 3.0, opts.destroyPower ?? 70);
        }
        // it hits EVERYONE in the arc, not just the nearest — it is a sweep
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          if (!sure && !inArc(caster, f, reach, arc)) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 22) * mult, { canCrit: false });
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6, kbY: opts.kbY ?? 1.2,
            hitstun: opts.hitstun ?? 34, type: 'heavy',
            dir: v3(f.pos.x - caster.pos.x, 0, f.pos.z - caster.pos.z).normalize()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { heavy: true });
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(caster.forward(), reach * 0.6), reach * 0.7, (opts.dmg ?? 22) * 0.7, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(caster.forward(), reach * 0.6), reach * 0.7, (opts.dmg ?? 22) * 0.7, caster);
        break;
      }

      case 'mahoraga_world_cut': {
        // WORLD-CUTTING SLASH. A line, not an arc. It is walked step by step
        // out to `range`, cutting the LEVEL on every step at erase strength —
        // the wall, the pillar and the mezzanine in the path all go, and the
        // hole it leaves is a real change to the map (destruct owns the
        // colliders). Anyone standing on the line takes the whole thing.
        const fw = caster.forward();
        const range = opts.range ?? 15, width = opts.width ?? 2.2;
        m.fx.worldCut(caster, fw, range, width);
        m.sfx.worldCut();
        m.stage.flash(0.5);
        m.cam.shake(1.1);
        m.cam.fovKick(10);
        m.hitstop(12);
        const steps = opts.destroySteps ?? 16;
        for (let i = 1; i <= steps; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.2).addScaledVector(fw, i * (opts.destroyStep ?? 1.0)),
            opts.destroyRadius ?? 2.6, opts.destroyPower ?? 150);
        }
        m.arena?.splash?.(caster.pos.x + fw.x * 4, caster.pos.z + fw.z * 4, 2.4);
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          const pad = f.hurtBox.pad;   // scaled by growth stage
          if (!sure && !(along > -0.6 && along < range && perp < width + pad)) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 46) * mult, { canCrit: false });
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 9, kbY: opts.kbY ?? 4,
            hitstun: opts.hitstun ?? 46, type: 'knockdown', dir: fw
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { heavy: true, knockdown: true });
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.4, (opts.dmg ?? 46) * 0.8, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.4, (opts.dmg ?? 46) * 0.8, caster);
        break;
      }

      // =====================================================================
      // SUKUNA
      // =====================================================================
      case 'sukuna_dismantle': {
        // DISMANTLE 解 — a crossing slash fired down a line. It "cuts anything
        // without regard for what it is", so the ENVIRONMENT on the line takes
        // the same cut the opponent does, stepped out to full range. It is a
        // neutral tool, not an ultimate: normal destruct power, not `erase`.
        // ...and now the cut RACES rather than simply existing: a wavefront
        // of red crosses tearing down the line at 26 m/s, cutting the level
        // as it reaches it instead of all at once. Near-instant up close,
        // genuinely dodgeable at the far end of its thirteen metres — range
        // is no longer free.
        const fw = caster.forward();
        const range = (opts.range ?? 13) * fingerRange(caster);
        const width = opts.width ?? 1.4;
        m.fx.dismantleSlash(caster, fw, Math.min(range, 3), width);   // the swing itself
        m.sfx.dismantle();
        m.cam.shake(0.42);
        m.cam.fovKick(4);
        this.entities.push({
          type: 'dismantleWave', caster, sure, dir: fw,
          pos: caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(fw, 0.6),
          spd: opts.waveSpeed ?? 26, travelled: 0, range, width,
          dmg: (opts.dmg ?? 16) * mult * fingerDmg(caster),
          kb: opts.kb ?? 5, kbY: opts.kbY ?? 1.2, hitstun: opts.hitstun ?? 26,
          destroyRadius: opts.destroyRadius ?? 1.9, destroyPower: opts.destroyPower ?? 95,
          hit: new Set(), hitOpts, fxT: 0
        });
        m.arena?.splash?.(caster.pos.x + fw.x * 3, caster.pos.z + fw.z * 3, 1.4);
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.35), range * 0.35,
          (opts.dmg ?? 16) * 0.8, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.35), range * 0.35,
          (opts.dmg ?? 16) * 0.8, caster);
        break;
      }

      case 'sukuna_cleave': {
        // CLEAVE 捌 — the same technique, aimed at a person instead of at the
        // world. It ADJUSTS TO THE TARGET'S CURSED ENERGY: the more MAX_CE
        // they have banked, the deeper it goes. The number is shown on screen
        // because a scaling move nobody can see scaling is just a random
        // damage roll to whoever is on the receiving end.
        const reach = (opts.reach ?? 2.6) * fingerRange(caster);
        const arc = opts.arc ?? 1.7;
        if (!sure && !inArc(caster, t, reach, arc)) {
          // a whiffed Cleave is the single biggest punish window he offers
          m.sfx.whiff();
          m.fx.cleaveCut(caster, caster, 0);
          break;
        }
        const scaled = cleaveDamage(caster, t, opts);
        const { dmg, crit } = computeDamage(caster, scaled.dmg * mult * fingerDmg(caster));
        const r = t.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 4.5, kbY: opts.kbY ?? 1.0,
          hitstun: opts.hitstun ?? 30, type: 'heavy'
        }, m.ctxFor(caster));
        m.fx.cleaveCut(caster, t, scaled.depth);
        m.sfx.cleaveCut(scaled.depth);
        hitFeedback(m, caster, t, r, { crit, heavy: true });
        m.arena?.destruct?.damageAt(t.pos.clone().setY(1.2), opts.destroyRadius ?? 2.6, opts.destroyPower ?? 80);
        m.cam.shake(0.4 + scaled.depth * 0.5);
        m.cam.fovKick(4 + scaled.depth * 6);
        if (scaled.depth > 0.55) m.hitstop(8 + Math.round(scaled.depth * 8));
        // THE INDICATOR. Both players get to read why it hurt that much.
        if (r === 'hit' || r === 'otg' || r === 'armor') {
          m.hud.techFlash(scaled.label, 0xff2f45);
          m.hud.toast(t, scaled.toast);
        }
        break;
      }

      case 'sukuna_firearrow': {
        // FIRE ARROW 開 — the charge is over. A screen-crossing column of
        // flame that ERASES what it passes through: unlike Dismantle this does
        // not care about an object's hp, exactly like Hollow Purple.
        const fw = caster.forward();
        const range = opts.range ?? 40, width = opts.width ?? 2.0;
        m.fx.fireArrowBeam(caster, fw, range, width);
        m.sfx.fireArrow();
        m.stage.flash(0.85);
        m.cam.shake(1.3);
        m.cam.fovKick(13);
        m.hitstop(16);
        m.slowmo(0.45, 0.4);
        const steps = opts.destroySteps ?? 34;
        for (let i = 1; i <= steps; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.3).addScaledVector(fw, i * (opts.destroyStep ?? 1.2)),
            opts.destroyRadius ?? 2.6, 1, { kind: 'erase' });
        }
        m.arena?.splash?.(caster.pos.x + fw.x * 5, caster.pos.z + fw.z * 5, 2.6);
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          const pad = f.hurtBox.pad;   // scaled by growth stage
          if (!sure && !(along > -0.6 && perp < width + 0.6 + pad)) continue;
          const { dmg } = computeDamage(caster, (opts.dmg ?? 62) * mult * fingerDmg(caster), { canCrit: false });
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 10, kbY: opts.kbY ?? 4.5,
            hitstun: opts.hitstun ?? 46, type: 'knockdown', unblockable: true, dir: fw,
            // FIRE ARROW IS FIRE. Hanami's vulnerability applies, exactly as
            // it does to Jogo — the flag is on the damage, not on the caster.
            elem: 'fire'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { heavy: true, knockdown: true });
        }
        // ...and it burns the ground it crosses
        for (let i = 1; i <= 8; i++) {
          m.flora?.damageFieldsAt(caster.pos.clone().addScaledVector(fw, i * (range / 8)), 3.0, 'fire');
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.2), range * 0.2, 999, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.2), range * 0.2, 999, caster);
        break;
      }

      case 'sukuna_finger': {
        // CONSUME A FINGER. No damage and no hitbox — the whole move is the
        // stack, and the vulnerable second that bought it.
        //
        // THE STACK IS TAKEN HERE, on the activation frame, and nowhere else.
        // That placement is the rule: a channel that gets interrupted before
        // frame 58 never reaches this line, so being clipped out of it costs
        // him the second and NOT the finger. (Same shape as Jogo's Overheat,
        // which sets its buff from its own effect case for the same reason.)
        const max = caster.cfg.fingers?.count ?? 4;
        if ((caster.fingers ?? 0) >= max) break;
        caster.fingers = (caster.fingers ?? 0) + 1;
        const n = caster.fingers;
        m.fx.fingerFlare(caster, n);
        m.sfx.fingerBite(n);
        caster.model.setFingers?.(n);
        m.stage.flash(0.25 + n * 0.06);
        m.cam.shake(0.35 + n * 0.12);
        m.cam.fovKick(4 + n);
        const left = (caster.cfg.fingers?.count ?? 4) - n;
        m.hud.toast(caster, '指 FINGER ' + n + '/' + (caster.cfg.fingers?.count ?? 4)
          + (left ? '' : ' — NO MORE'));
        if (n === (caster.cfg.fingers?.fireArrowAt ?? 2)) {
          m.hud.techFlash('開 FIRE ARROW UNLOCKED', 0xff5a1f);
        }
        break;
      }

      // ---- HAKARI: BASE KIT -----------------------------------------------
      case 'hakari_smash': {
        // PACHINKO VOLLEY. He pulls an invisible lever and the machine PAYS:
        // a fan of neon pachinko balls launched down the lane, bouncing off
        // the floor with loose homing, steered by the stick. The last ball is
        // GOLD — the payout ball — and it alone knocks down (otgOk kept, so
        // the volley is still his wake-up tool). The old overhead's damage is
        // split across the rack; eating the whole rack costs slightly more.
        const dir = this._castDir(caster);
        const count = opts.count ?? 6;
        for (let i = 0; i < count; i++) {
          const gold = i === count - 1;
          const spread = (i - (count - 1) / 2) * 0.16;
          const d = dir.clone().applyAxisAngle(v3(0, 1, 0), spread);
          this.entities.push({
            type: 'pachinko', caster, sure, gold,
            pos: caster.pos.clone().add(v3(0, 1.0, 0)).addScaledVector(d, 0.6),
            vel: d.clone().multiplyScalar((opts.speed ?? 14) * rand(0.9, 1.1)).setY(rand(1.5, 3.5)),
            spd: opts.speed ?? 14, homing: opts.homing ?? 1.6,
            dmg: (gold ? (opts.goldDmg ?? 6) : (opts.dmg2 ?? 3.2)) * mult,
            life: opts.lifetime ?? 1.3, delay: i * 0.06, fxT: 0, hitOpts
          });
        }
        m.fx._ring(caster.pos.clone().add(v3(0, 1.1, 0)).addScaledVector(dir, 0.7),
          0x69f0ae, { size: 0.4, growRate: 10, life: 0.3, flat: false });
        m.sfx.ceSmash();
        m.cam.shake(0.35);
        break;
      }
      case 'hakari_rush': {
        // RUSH BLOW: the approach. Rides the shared lunge window so the travel
        // itself connects, then cancels into the punch string (fighter.js).
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 13.5);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 13.5);
        this.entities.push({
          type: 'lungeHit', caster, frames: opts.active ?? 8, dmg: (opts.dmg ?? 9) * mult,
          kb: opts.kb ?? 2.2, hitstun: opts.hitstun ?? 20, radius: 1.6, src
        });
        m.sfx.rushBlow();
        m.fx.dashTrail(caster);
        break;
      }
      case 'hakari_shutter': {
        const sp = caster.cfg.special;
        caster.shutterT = sp.duration ?? 4;
        caster.shutterHits = sp.hits ?? 1;
        m.fx.shutterUp(caster, sp);
        m.sfx.shutterUp();
        m.hud.toast(caster, 'SHUTTER');
        m.cam.shake(0.16);
        break;
      }
      // ---- HAKARI: JACKPOT KIT ---------------------------------------------
      case 'hakari_blast': {
        // JACKPOT BLAST — the ranged tool he does not otherwise own. A bar of
        // cursed energy driven down a line, erasing scenery as it goes.
        const fw = caster.forward();
        const range = opts.range ?? 17, width = opts.width ?? 2.0;
        m.fx.jackpotBeam(caster, fw, range, width);
        m.sfx.jackpotBlast();
        m.stage.flash(0.4);
        m.cam.shake(0.8);
        m.cam.fovKick(9);
        for (let i = 1; i <= 16; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.3).addScaledVector(fw, i * (range / 16)), 2.2, 80);
        }
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * fw.x + rel.z * fw.z;
        const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
        const pad = t.hurtBox.pad;   // scaled by growth stage
        if (sure || (along > -0.6 && along < range && perp < width + pad)) {
          const { dmg } = computeDamage(caster, (opts.dmg ?? 30) * mult, { canCrit: false });
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 8, kbY: opts.kbY ?? 3,
            hitstun: opts.hitstun ?? 36, type: 'knockdown', dir: fw
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true, knockdown: true });
        }
        m.minions?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.35, (opts.dmg ?? 30) * 0.7, caster);
        // ...and Geto's curses, which stand in the same field as the transfigured
        // human and take area damage from exactly the same sources.
        m.curses?.hurtAt(caster.pos.clone().addScaledVector(fw, range * 0.4), range * 0.35, (opts.dmg ?? 30) * 0.7, caster);
        break;
      }
      case 'hakari_counter': {
        // Open the stance. The absorb itself happens in Fighter.applyHit; all
        // this does is arm the window and make the invitation visible.
        caster.counterT = opts.window ?? 26;
        m.fx.counterStance(caster);
        m.sfx.counterAbsorb();
        m.hud.toast(caster, 'COUNTER — COME ON');
        break;
      }
      case 'hakari_punish': {
        // the returned blow. Fired from the match event a frame after the
        // absorb, so the read is "he ate it, then he answered it".
        const target = opts.target ?? t;
        if (!target?.alive) break;
        m.fx.ceShockwave(caster, 2.2);
        m.sfx.ceSmash();
        m.sfx.crit();
        m.stage.flash(0.35);
        m.cam.shake(0.9);
        m.cam.fovKick(9);
        m.hitstop(16);
        m.slowmo(0.25, 0.38);
        const { dmg } = computeDamage(caster, (opts.dmg ?? 34) * mult, { canCrit: false });
        const r = target.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 7, kbY: opts.kbY ?? 2,
          hitstun: opts.hitstun ?? 40, type: 'knockdown', unblockable: true, otgOk: true,
          dir: v3(target.pos.x - caster.pos.x, 0, target.pos.z - caster.pos.z).normalize()
        }, m.ctxFor(caster));
        hitFeedback(m, caster, target, r, { heavy: true, knockdown: true });
        m.arena?.destruct?.damageAt(target.pos.clone().setY(1.1), 2.6, 80);
        break;
      }
      case 'hakari_goldrush': {
        // GOLD RUSH: he crosses the arena. The entity owns the travel so the
        // charge keeps damaging the level the whole way, and a connect ends in
        // a wallslam rather than a knockdown in open space.
        const fw = caster.forward();
        caster.vel.x = fw.x * (opts.lungeSpeed ?? 26);
        caster.vel.z = fw.z * (opts.lungeSpeed ?? 26);
        caster.iFrames = Math.max(caster.iFrames, 8);
        this.entities.push({
          type: 'goldRush', caster, dir: fw, frames: opts.frames ?? 26,
          dmg: (opts.dmg ?? 24) * mult, kb: opts.kb ?? 9, kbY: opts.kbY ?? 2,
          hitstun: opts.hitstun ?? 40, radius: opts.radius ?? 1.9,
          slamPower: opts.slamPower ?? 160, fxT: 0
        });
        m.sfx.goldRush();
        m.fx.dashTrail(caster);
        m.cam.shake(0.35);
        break;
      }

      // ---- HIGURUMA ------------------------------------------------------
      case 'higuruma_gavel': {
        // VERDICT. The gavel no longer swings — it is PASSED DOWN: an
        // oversized cursed-energy gavel condenses over a marked patch of
        // ground and falls, stamping a court seal where it lands. Aim with
        // the stick exactly like the roster's two eruptions; neutral leads
        // the opponent's feet. Landing it files the blow as evidence, which
        // is the character's whole economy arriving in his damage button.
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 7) * mag);
        } else {
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.delay ?? 0.6) * 0.6);
        }
        at.y = 0;
        const rr = Math.hypot(at.x, at.z);
        const lim = caster.arenaRadius - 0.3;
        if (rr > lim) { at.x *= lim / rr; at.z *= lim / rr; }
        const radius = opts.radius ?? 2.5;
        this.entities.push({
          type: 'gavelDrop', caster, sure, pos: at, t: 0,
          delay: opts.delay ?? 0.6, radius,
          dmg: (opts.dmg ?? 15) * mult, kb: opts.kb ?? 4.2, kbY: opts.kbY ?? 1.2,
          hitstun: opts.hitstun ?? 30, evidence: opts.evidence ?? 5,
          node: m.fx.gavelConstruct(radius), hitOpts, fxT: 0
        });
        m.sfx.gavel?.();
        break;
      }
      case 'higuruma_confiscate': {
        // CONFISCATION: short range, NO DAMAGE. It takes one of their
        // technique buttons away for `lock.duration` seconds — his survival
        // tool, and the only thing about him Yuta bothers to copy.
        m.fx.confiscate?.(caster);
        m.sfx.confiscate?.();
        const lock = opts.lock ?? { duration: 6, evidence: 6 };
        if (sure || inArc(caster, t, opts.reach ?? 1.7, opts.arc ?? 1.2)) {
          // it still has to get through a guard — it is a technique, not a
          // sure-hit, and blocking it is the correct answer
          const r = t.applyHit({
            ...hitOpts, dmg: 0, kb: opts.kb ?? 1.2, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'light'
          }, m.ctxFor(caster));
          if (r === 'hit' || r === 'otg') {
            const slot = t.confiscate(lock.duration);
            m.hud.toast(caster, '没収 CONFISCATED');
            m.fx._ring(t.pos.clone().add(v3(0, 1.3, 0)), 0xd8c78a,
              { size: 0.45, growRate: 7, life: 0.5, flat: false });
            m.sfx.confiscateLand?.();
            m.cam.shake(0.2);
            // filing a seizure is itself evidence
            if (lock.evidence) gainEvidence(caster, lock.evidence);
            void slot;
          } else {
            hitFeedback(m, caster, t, r, {});
          }
        } else {
          m.sfx.whiff();
        }
        break;
      }
      case 'higuruma_judgeman': {
        m.judgemen?.spawn(caster);
        m.sfx.judgemanSummon?.();
        m.hud.toast(caster, '審判 JUDGEMAN');
        m.fx._ring(caster.pos.clone().addScaledVector(caster.forward(), -1.4).setY(0.06),
          0x8fb6d8, { size: 0.4, growRate: 6, life: 0.6 });
        break;
      }
      case 'higuruma_judgment_slash': {
        // JUDGMENT SLASH — the opener. A wide sweeping cut with real reach
        // that launches, and it does NOT resolve the domain: it exists to put
        // them somewhere the thrust can reach.
        m.fx.judgmentArc?.(caster, opts.reach ?? 3.2);
        m.sfx.swordSwing();
        m.cam.shake(0.3);
        for (let i = -1; i <= 1; i++) {
          const dir = caster.forward().applyAxisAngle(v3(0, 1, 0), i * 0.5);
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(1.2).addScaledVector(dir, (opts.reach ?? 3.2) * 0.7), 2.2, 55);
        }
        // it is a SWEEP: everyone in the arc, not just the nearest
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          if (!sure && !inArc(caster, f, opts.reach ?? 3.2, opts.arc ?? 2.2)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 26) * mult);
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 5.5, kbY: opts.kbY ?? 7.6,
            hitstun: opts.hitstun ?? 30, type: 'launcher',
            dir: v3(f.pos.x - caster.pos.x, 0, f.pos.z - caster.pos.z).normalize()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { crit, heavy: true });
        }
        break;
      }
      case 'higuruma_execution': {
        // EXECUTION — the committed thrust. The connect window is an entity so
        // that whiffing is a real, punishable event; a connection hands off to
        // the domain system, which runs the duel that decides everything.
        m.sfx.executionSwing?.();
        m.fx.executionThrust?.(caster);
        this.entities.push({
          type: 'execHit', caster, frames: opts.active ?? 6,
          reach: opts.reach ?? 2.6, arc: opts.arc ?? 1.1
        });
        break;
      }


      // =====================================================================
      // TOJI — THE ARSENAL
      // =====================================================================
      // None of these is a cursed technique. They are a man hitting somebody
      // with an object, and they are tagged accordingly for adaptation (see
      // EFFECT_SRC): each WEAPON is its own category, so adapting to Playful
      // Cloud does nothing whatsoever about the Split Soul Katana.

      // PLAYFUL CLOUD — spinning multi-hit sweep. Hits everything around him,
      // so it is the one move of his that resolves on a RADIUS rather than an
      // arc: there is no behind-him to escape to.
      case 'toji_cloud_sweep': {
        // CLOUD CYCLONE. The three-section staff opened out and SPUN: an
        // entity that whirls around him for half a second, ticking on
        // everything in the circle while he keeps (slowed) control of his
        // feet — a moving no-man's-land instead of a single radius check.
        // Same total damage as the old sweep, arriving as the canonical
        // flurry rather than one invisible tap.
        m.sfx.swordSwing();
        m.cam.shake(0.14);
        this.entities.push({
          type: 'staffSpin', caster, sure,
          t: 0, dur: opts.duration ?? 0.55, radius: opts.radius ?? 2.9,
          tick: 0, interval: (opts.duration ?? 0.55) / (opts.hits ?? 4),
          dmg: (opts.dmg ?? 6) * mult, kb: opts.kb ?? 2.6, kbY: opts.kbY ?? 0.4,
          hitstun: opts.hitstun ?? 15, ang: caster.facing, hitOpts, fxT: 0
        });
        break;
      }

      // PLAYFUL CLOUD — the full-body overhead slam. Huge damage and a GUARD
      // BREAK: it does not go through the guard, it takes the guard away, which
      // is the correct shape for a blunt weapon and leaves blocking as a real
      // (if losing) option rather than a dead one.
      case 'toji_cloud_slam': {
        // the staff bar coming down, and a crack line of thrown deck driven
        // forward from the impact — the guard break drawn as weight
        m.fx.staffSlamCrack(caster, caster.forward(), opts.reach ?? 2.5);
        m.sfx.cleave(true);
        m.cam.shake(0.55); m.cam.fovKick(5);
        for (let i = 1; i <= 3; i++) {
          m.arena?.destruct?.damageAt(
            caster.pos.clone().setY(0.4).addScaledVector(caster.forward(), i * 0.9), 2.2, 52);
        }
        if (sure || inArc(caster, t, opts.reach ?? 2.5, opts.arc ?? 1.5)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 21) * mult);
          // the guard break is applied BEFORE the hit resolves, so the hit that
          // breaks it also lands clean rather than being chipped
          const guarding = t.state === 'block' || t.state === 'blockstun';
          if (guarding && opts.guardBreak) {
            t.res.stamina = 0;
            t.setState('guardBreak', { clip: 'guardBreak' });
            t.emit('guardBreak');
            m.hud.toast(caster, 'GUARD BROKEN');
          }
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.2, kbY: 0,
            hitstun: opts.hitstun ?? 34, type: 'knockdown'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
        }
        break;
      }

      // INVERTED SPEAR — the fast piercing thrust. Long, thin, and nothing
      // special: it is the poke that makes carrying the spear survivable, and
      // it deliberately does NOT nullify anything.
      case 'toji_spear_thrust': {
        // The thrust drawn as what it is: a VACUUM LANCE — a thin hard line
        // of white driven down the spear's whole length in one frame, and a
        // line test to match, so the visual and the hitbox are the same
        // object. Slightly longer than the old arc, twice as easy to
        // sidestep; the trade is the point of the weapon.
        const dir = caster.forward();
        const range = (opts.reach ?? 4.2) * caster.reachScale;
        m.fx.spearLance(caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(dir, 0.4), dir, range);
        m.sfx.lunge();
        const rel = t.pos.clone().sub(caster.pos);
        const along = rel.x * dir.x + rel.z * dir.z;
        const perp = Math.abs(rel.x * dir.z - rel.z * dir.x);
        if (sure || (along > -0.3 && along < range && perp < (opts.width ?? 0.75) + (t.hurtBox?.radius ?? 0.62))) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 12) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 3.0, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
        }
        break;
      }

      // =====================================================================
      // INVERTED SPEAR — NULLIFY 強制解除
      // =====================================================================
      // "Upon contact with the Inverted Spear of Heaven's blade, any active
      // cursed technique is immediately nullified." Here that means three
      // things, applied in this order:
      //
      //   1. an ACTIVE DOMAIN owned by the target is cancelled outright —
      //      barrier, payload, playspace and all. See domains.nullify().
      //   2. every active TECHNIQUE BUFF on them is stripped.
      //   3. their ct1 and ct2 are SEALED for `lockDuration` seconds.
      //
      // The cooldown it pays depends on what it actually achieved: cancelling
      // a domain is the big one and costs the full `cooldownOnCancel`, while a
      // hit that found nothing to cancel costs the much shorter
      // `cooldownOnHit`. That asymmetry is what stops it being a strictly
      // better poke than the thrust when the opponent has nothing up.
      case 'toji_nullify': {
        // the blade itself: a short hard lance line in the spear's green
        m.fx.spearLance(caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(caster.forward(), 0.3),
          caster.forward(), (opts.reach ?? 1.7) + 0.6);
        m.sfx.cleave();
        const def = caster.equipped?.ct2 ?? opts;
        const hit = sure || inArc(caster, t, opts.reach ?? 1.7, opts.arc ?? 0.9);
        if (!hit) {
          // A WHIFF COSTS NOTHING BUT THE FRAMES. No cooldown is charged for
          // missing — the 38 frames of recovery are already the punish, and
          // charging the cooldown too would make one bad read cost the round.
          caster.emit('nullifyWhiff');
          break;
        }
        const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 10) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg, kb: opts.kb ?? 2.2, kbY: 0,
          hitstun: opts.hitstun ?? 26, type: 'heavy'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit, heavy: true });
        // it has to CONNECT — a blocked or i-framed spear cancels nothing
        if (r === 'hit' || r === 'armor') {
          // the technique being TURNED OFF: a collapsing green seal
          m.fx.nullifySeal(t.pos.clone());
          const res = m.domains.nullify(t, caster);
          caster.nullifyCD = res.cancelled ? (def.cooldownOnCancel ?? 9) : (def.cooldownOnHit ?? 4);
          t.ctSealT = Math.max(t.ctSealT, def.lockDuration ?? 5);
          m.stage.flash(res.cancelled ? 0.55 : 0.2);
          m.cam.shake(res.cancelled ? 0.8 : 0.3);
          m.hud.techFlash(res.label, 0x6ea88a);
          if (res.cancelled) m.hitstop(16);
          caster.emit('nullifyLand', res);
        }
        break;
      }

      // SPLIT SOUL KATANA — the fast slashing string. Lower raw damage than
      // Playful Cloud, which is the trade for how quickly it comes out.
      case 'toji_soul_slash': {
        // the fast string, now genuinely TWO cuts: the blade passes, and the
        // phantom of the same cut arrives on the soul a beat behind it. Same
        // total damage as the old single tick, split 4 + 3.
        m.fx.soulSlashArc(caster);
        m.sfx.swordSwing();
        if (sure || inArc(caster, t, opts.reach ?? 2.6, opts.arc ?? 1.9)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 7) * 0.57 * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.0, kbY: 0,
            hitstun: opts.hitstun ?? 16, type: 'light'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
          this.entities.push({
            type: 'soulEcho', caster, t: 0.13, sure,
            reach: (opts.reach ?? 2.6) * 1.15, arc: (opts.arc ?? 1.9) * 1.1,
            dmg: (opts.dmg ?? 7) * 0.43 * mult, hitstun: 14, hitOpts
          });
        }
        break;
      }

      // SPLIT SOUL KATANA — THE SOUL CUT. Ignores blocking entirely (it is
      // flagged `unblockable`, which applyHit honours above every guard branch)
      // and leaves a lingering debuff on their damage OUTPUT. Chip-through
      // pressure: the damage number stays modest because bypassing a guard is
      // the reward and paying twice would be too much.
      case 'toji_soul_cut': {
        m.fx.soulSlashArc(caster, true);
        m.sfx.cleave();
        m.cam.shake(0.3);
        if (sure || inArc(caster, t, opts.reach ?? 2.7, opts.arc ?? 1.6)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 13) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 2.4, kbY: 0,
            hitstun: opts.hitstun ?? 24, type: 'heavy', unblockable: true
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'armor') {
            const d = opts.debuff ?? { duration: 7, dmgMult: 0.74 };
            t.soulCut = { t: d.duration, mult: d.dmgMult };
            // the soul knocked out of register — the same grey silhouette
            // Mahito's touch pulls, because it is the same substance cut
            m.fx.soulRip(t.pos.clone());
            m.hud.toast(t, '釈魂 SOUL CUT');
          }
        }
        break;
      }

      // CHAIN — the long whip strike. His only real ranged option, and the
      // reason he is not simply free money for a zoner.
      case 'toji_chain_whip': {
        // the chain DRAWN: a run of link motes whipped out to the tip, with
        // a crack ring where it lands
        const hand = caster.pos.clone().add(v3(0, 1.3, 0));
        const connect = sure || inArc(caster, t, opts.reach ?? 7.0, opts.arc ?? 0.55);
        const tip = connect
          ? t.pos.clone().add(v3(0, 1.2, 0))
          : hand.clone().addScaledVector(caster.forward(), opts.reach ?? 7.0);
        m.fx.chainLinks(hand, tip);
        m.sfx.swordSwing();
        if (connect) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 11) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 3.4, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit });
        }
        break;
      }

      // CHAIN — THE SNARE. Which way it closes is decided by DISTANCE, not by
      // a second button: past `pullFrom` it hauls HIM to THEM (the approach
      // tool against a zoner), inside it, it hauls THEM to HIM (the reset when
      // somebody is trying to walk away). One input, two answers, and the
      // answer you get is a consequence of where you were standing.
      case 'toji_chain_snare': {
        m.sfx.lunge();
        const d = flatDist(caster.pos, t.pos);
        if (!(sure || inArc(caster, t, opts.reach ?? 8.5, opts.arc ?? 0.5))) break;
        const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 8) * mult);
        const r = t.applyHit({
          ...hitOpts, dmg, kb: 0, kbY: 0,
          hitstun: opts.hitstun ?? 30, type: 'heavy'
        }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { crit });
        if (r !== 'hit' && r !== 'armor') break;
        // the chain drawn taut between the two of them before anyone moves
        m.fx.chainLinks(caster.pos.clone().add(v3(0, 1.3, 0)), t.pos.clone().add(v3(0, 1.2, 0)));
        const gap = opts.endGap ?? 1.5;
        const dir = t.pos.clone().sub(caster.pos).setY(0).normalize();
        if (d > (opts.pullFrom ?? 5.5)) {
          // FAR: he goes to them.
          const dest = t.pos.clone().addScaledVector(dir, -gap);
          dest.y = caster.pos.y;
          caster.pos.copy(dest); caster.prevPos.copy(dest);
          m.hud.toast(caster, '万里ノ鎖 — PULLED IN');
        } else {
          // CLOSE: they come to him.
          const dest = caster.pos.clone().addScaledVector(dir, gap);
          dest.y = t.pos.y;
          t.pos.copy(dest); t.prevPos.copy(dest);
          t.vel.set(0, 0, 0);
          m.hud.toast(caster, '万里ノ鎖 — HAULED');
        }
        m.fx.dashTrail(caster);
        m.cam.shake(0.25);
        break;
      }

      // =====================================================================
      // ASSASSINATION 術師殺し
      // =====================================================================
      // The blitz. This case fires on the ACTIVATION frame and only decides
      // whether he connected; the four-weapon sequence that follows is queued
      // as a timed entity so each strike lands on its own beat rather than all
      // at once. A whiff falls through to the move's own `whiffRecovery`.
      case 'toji_assassinate': {
        const u = caster.cfg.ultimate;
        const fw = caster.forward();
        caster.vel.x = fw.x * (u.blitzSpeed ?? 21);
        caster.vel.z = fw.z * (u.blitzSpeed ?? 21);
        m.fx.dashTrail(caster);
        m.sfx.lunge();
        // the connect window travels with him for the blitz frames
        this.entities.push({
          type: 'tojiBlitz', caster, frames: u.blitzFrames ?? 14,
          reach: u.reach ?? 2.0, arc: u.arc ?? 1.2
        });
        break;
      }

      // =====================================================================
      // HANAMI — DISASTER PLANTS
      // =====================================================================
      // ROOT ERUPTION. Deliberately the same SHAPE as Jogo's Volcanic
      // Eruption — aim with the stick, neutral leads their feet, a growing
      // marker telegraphs it — because the two are the roster's two ground
      // traps and a player who has learned one should read the other. Where
      // it differs: it LAUNCHES, and the ground it comes out of matters.
      case 'hanami_roots': {
        // ROOT SWARM. No longer one patch: a COLUMN of eruptions marching
        // away from him down a line — the roots travelling under the floor
        // and surfacing as they go. The stick steers the march; neutral sends
        // it at the opponent, led by their velocity. Each burst telegraphs,
        // erupts and launches exactly as the old trap did (same entity), and
        // each checks THE GROUND IT COMES OUT OF: the swarm gets bigger and
        // harder for every step it takes across natural terrain, which turns
        // a Root Field into a gun emplacement.
        const dir = v3();
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          dir.copy(caster._moveVec(mv)).setY(0).normalize();
        } else {
          dir.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), 0.4)
            .sub(caster.pos).setY(0);
          if (dir.lengthSq() < 0.01) dir.copy(caster.forward());
          dir.normalize();
        }
        const count = opts.count ?? 5;
        const spacing = opts.spacing ?? 1.7;
        const gap = opts.gap ?? 0.14;
        const lim = caster.arenaRadius - 0.3;
        for (let k = 0; k < count; k++) {
          const at = caster.pos.clone().addScaledVector(dir, 1.4 + k * spacing);
          const rr = Math.hypot(at.x, at.z);
          if (rr > lim) break;                     // the swarm stops at the wall
          at.y = caster.bounds ? caster.bounds.floorAt(at.x, at.z, caster.pos.y + 1.2) : 0;
          const kind = m.flora ? m.flora.terrainForPos(at) : ARTIFICIAL;
          const boost = kind !== ARTIFICIAL ? (opts.natural || {}) : {};
          // per-burst damage: the config's dmg reads as the "one clean hit"
          // number, so a burst carries just under half of it — a launch means
          // the swarm rarely lands more than two
          this.entities.push({
            type: 'rootSpikes', caster, pos: at, sure: sure && k === 0,
            t: (boost.delay ?? opts.delay ?? 0.5) + k * gap,
            radius: boost.radius ?? opts.radius ?? 1.9,
            dmg: (boost.dmg ?? opts.dmg ?? 16) * 0.45 * mult,
            kb: opts.kb ?? 4, kbY: opts.kbY ?? 9.5, natural: kind !== ARTIFICIAL, fxT: 0
          });
        }
        m.sfx.rootPrime?.();
        break;
      }

      // CURSED BUD. A thrown seed. Almost no direct damage — the six seconds
      // afterwards are the move, and they live in combat/flora.js.
      case 'hanami_bud': {
        m.sfx.budThrow?.();
        this.entities.push({
          type: 'budSeed', caster, sure,
          pos: caster.pos.clone().add(v3(0, 1.4, 0)).addScaledVector(caster.forward(), 0.6),
          vel: caster.forward().multiplyScalar(opts.speed ?? 13),
          life: (opts.range ?? 7) / (opts.speed ?? 13),
          dmg: (opts.dmg ?? 4) * mult, def: opts, fxT: 0
        });
        break;
      }

      // ROOT FIELD. No hitbox, no damage — it is terrain, and it is how he
      // functions on a map that hates him.
      case 'hanami_rootfield': {
        const sp = caster.cfg.special;
        m.flora.plantField(caster, {
          x: caster.pos.x, y: caster.pos.y, z: caster.pos.z,
          radius: sp.radius, duration: sp.duration, hp: sp.hp
        });
        m.fx._ring(caster.pos.clone().setY(caster.pos.y + 0.06), 0x7fc46a,
          { size: 0.6, growRate: sp.radius * 1.6, life: 0.7 });
        m.cam.shake(0.35);
        m.hud.toast(caster, '花畑 ROOT FIELD');
        break;
      }

      // WOODEN BALL 木の鞠. The mass condenses overhead and drops. Both a kill
      // attempt and a permanent terrain play — see the entity below.
      case 'hanami_woodenball': {
        const u = caster.cfg.ultimate;
        const at = t.pos.clone();
        at.y = caster.bounds ? caster.bounds.floorAt(at.x, at.z, t.pos.y + 1.2) : 0;
        this.entities.push({
          type: 'woodenBall', caster, pos: at, t: u.dropDelay ?? 0.55, def: u,
          dmg: (u.dmg ?? 52) * mult, node: m.fx.woodenBall ? m.fx.woodenBall(at, u.radius) : null,
          fxT: 0
        });
        m.sfx.woodBall?.();
        m.cam.shake(0.5);
        m.stage.flash(0.25);
        break;
      }

      // =====================================================================
      // KUROURUSHI — THE SWARM
      // =====================================================================
      case 'kurourushi_swarm': {
        m.swarms.release(caster, opts, { count: opts.count });
        m.sfx.swarmRelease?.();
        m.cam.shake(0.2);
        break;
      }

      // CORROSIVE SPRAY. A short cone. On hit it MELTS GUARD — their block
      // chip and block stamina drain both go up hard — and it leaves a burn.
      // The guard melt is what makes him the answer to defensive characters,
      // and it is specifically his way through Hanami's wall.
      case 'kurourushi_spray': {
        m.fx.corrosiveSpray?.(caster, opts.reach ?? 4.2, opts.arc ?? 0.95);
        m.sfx.spray?.();
        if (sure || inArc(caster, t, opts.reach ?? 4.2, opts.arc ?? 0.95)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 9) * mult);
          const r = t.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 1.5, kbY: 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg' || r === 'block' || r === 'armor') {
            const melt = opts.melt || { duration: 6, chipMult: 2.4, staminaMult: 1.8 };
            t.melt = { t: melt.duration, chip: melt.chipMult, stamina: melt.staminaMult };
            m.hud.toast(t, '消化液 — GUARD MELTING');
            const dot = opts.dot || { duration: 5, dps: 3 };
            this.entities.push({ type: 'corrode', target: t, caster, t: dot.duration, dps: dot.dps, fxT: 0 });
          }
        } else m.sfx.whiff();
        break;
      }

      // DEVOUR. A committed grab — slow enough to be jumped or dashed out of,
      // faster against a body already on the floor. The connect hands off to
      // the hold entity, which owns the cinematic beat.
      case 'kurourushi_devour': {
        const sp = caster.cfg.special;
        const downed = ['knockdown', 'getup'].includes(t.state);
        const grabbable = t.alive && (downed || (t.grounded && !['launched', 'ko'].includes(t.state)));
        if ((sure || inArc(caster, t, opts.reach ?? sp.reach, opts.arc ?? sp.arc)) && grabbable) {
          t.pos.copy(caster.pos).addScaledVector(caster.forward(), 1.0);
          t.pos.y = caster.pos.y;
          t.prevPos.copy(t.pos);
          t.vel.set(0, 0, 0);
          t.activeHit = null;
          t.move = null;
          t.setState('devoured', { clip: 'devoured' });
          caster.model.setMaw?.(1);
          m.hud.cutin(caster, '捕食 DEVOUR', sp.name);
          m.cam.cinematic(caster.pos, 1.1, 2.4, 1.5);
          m.sfx.devourBite?.();
          m.hitstop(12);
          this.entities.push({
            type: 'devourHold', caster, target: t, frames: sp.holdFrames ?? 46, sp
          });
        } else {
          m.sfx.whiff();
          caster.emit('devourWhiff');
        }
        break;
      }

      // SELF-DEVOUR. He eats his own swarm. Small, undignified, and the reason
      // he is never entirely stalled.
      case 'kurourushi_selfdevour': {
        const g = caster.cfg.gluttony;
        const n = m.swarms.devourOwn(caster, g.selfDevourMax ?? 8, g.perSelfDevourRoach ?? 0.5);
        caster.model.setMaw?.(1);
        caster._mawT = 0.5;
        m.sfx.devourBite?.();
        m.hud.toast(caster, n ? 'ATE ' + n : 'NOTHING TO EAT');
        break;
      }

      case 'kurourushi_infestation': {
        m.swarms.beginInfestation(caster, caster.cfg.ultimate);
        m.hud.toast(caster, '蟲毒 INFESTATION');
        break;
      }

      // =====================================================================
      // CHOSO — BLOOD MANIPULATION
      // =====================================================================
      // BLOOD EDGE 血刃 — his neutral tool. A hardened blade of blood thrown
      // flat, travelling a medium distance and FALLING OFF past `falloffAt`
      // rather than stopping dead. The falloff is the whole balance of the
      // move: it owns one band of the floor and is a poor answer outside it,
      // which is what makes "hold mid-range" an actual instruction rather than
      // a suggestion.
      case 'choso_blood_edge': {
        m.fx.bloodEdgeCast(caster);
        m.sfx.bloodEdge();
        const dir = caster.forward();
        this.entities.push({
          type: 'bloodEdge', caster, sure,
          pos: caster.pos.clone().add(v3(0, 1.30, 0)).addScaledVector(dir, 0.7),
          dir, spd: opts.speed ?? 19,
          dmg: (opts.dmg ?? 8) * mult,
          kb: opts.kb ?? 1.8, kbY: opts.kbY ?? 0, hitstun: opts.hitstun ?? 16,
          range: opts.range ?? 11.5, falloffAt: opts.falloffAt ?? 7,
          falloffMin: opts.falloffMin ?? 0.45,
          travelled: 0, fxT: 0
        });
        break;
      }

      // PIERCING BLOOD 穿血 — the committed read. Fired the instant the long
      // startup ends, at a speed nothing dodges after the fact: it resolves as
      // a LINE, not a projectile, which is exactly why the 28 frames in front
      // of it have to be the counterplay.
      //
      // IT PIERCES. It does not stop on the first thing it touches: the line
      // is walked all the way out, damaging destructible geometry the whole
      // distance, and it hits EVERY fighter standing on it rather than the
      // nearest one. In a free-for-all that means it can spit two people at
      // once, which is correct for a lance.
      case 'choso_piercing_blood': {
        const fw = caster.forward();
        const origin = caster.pos.clone().setY(caster.pos.y + 1.20).addScaledVector(fw, 0.55);
        const range = opts.range ?? 22, width = opts.width ?? 1.05;
        m.fx.piercingBlood(origin, fw, range, width);
        m.sfx.piercingBlood();
        m.cam.shake(0.7); m.cam.fovKick(8);
        m.stage.flash(0.28);
        // through the level: it goes through walls, so the walls take it
        for (let i = 1; i <= Math.round(range); i++) {
          m.arena?.destruct?.damageAt(origin.clone().addScaledVector(fw, i), width + 0.5, 70, { kind: 'body' });
        }
        for (const f of m.activeFighters) {
          if (f === caster || !f.alive) continue;
          const rel = f.pos.clone().sub(caster.pos);
          const along = rel.x * fw.x + rel.z * fw.z;
          const perp = Math.abs(rel.x * fw.z - rel.z * fw.x);
          if (!sure && !(along > -0.5 && along < range && perp < width * 0.5 + 0.55)) continue;
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 30) * mult);
          const r = f.applyHit({
            ...hitOpts, dmg, kb: opts.kb ?? 6.5, kbY: opts.kbY ?? 1.6,
            hitstun: opts.hitstun ?? 34, type: 'knockdown', dir: fw.clone()
          }, m.ctxFor(caster));
          hitFeedback(m, caster, f, r, { crit, heavy: true, knockdown: true });
          m.hitstop(10);
        }
        break;
      }

      // FLOWING RED SCALE 赤鱗躍動 — the self-buff, applied on the ACTIVATION
      // frame at the end of the open channel. An interrupted channel gives him
      // nothing, which is what the cursed energy and the Blood bought.
      //
      // NO HEALTH IS SPENT HERE OR ANYWHERE ELSE. He is boiling his own blood,
      // not draining it.
      case 'choso_redscale': {
        const sp = caster.cfg.special;
        caster.buffs.redScale = sp.duration ?? 9;
        caster.model.setRedScale?.(true);
        m.fx.redScaleBurst(caster);
        m.fx.buffAura(caster, sp.duration ?? 9, 0xc4142c);
        m.sfx.redScale();
        m.cam.shake(0.45); m.cam.fovKick(5);
        m.stage.flash(0.25);
        m.hud.cutin(caster, 'BLOOD MANIPULATION', '赤鱗躍動  FLOWING RED SCALE');
        m.hud.toast(caster, '赤鱗躍動 RED SCALE');
        break;
      }

      // SUPERNOVA 超新星 — Convergence, then the release. The mass is aimed
      // with the left stick (character-relative, like Jogo's eruption), takes
      // `travel` seconds to arrive, then sits for `fuse` seconds before it
      // goes off. That fuse is the whole telegraph and the whole counterplay.
      case 'choso_supernova': {
        const inp = m.inputFor(caster);
        const mv = inp?.move ?? { x: 0, z: 0 };
        const at = v3();
        if (Math.hypot(mv.x, mv.z) > 0.25) {
          const aim = caster._moveVec(mv);
          const mag = Math.min(1, Math.hypot(mv.x, mv.z));
          at.copy(caster.pos).addScaledVector(aim.normalize(), (opts.aimRange ?? 11) * mag);
        } else {
          // neutral: their chest, led a little by where they are going
          at.copy(t.pos).addScaledVector(v3(t.vel.x, 0, t.vel.z), (opts.travel ?? 0.42) * 0.7);
        }
        at.y = caster.pos.y + 1.3;
        const rr = Math.hypot(at.x, at.z);
        const lim = caster.arenaRadius - 0.4;
        if (rr > lim) { at.x *= lim / rr; at.z *= lim / rr; }
        m.sfx.supernovaCharge();
        m.cam.shake(0.3);
        this.entities.push({
          type: 'supernova', caster,
          from: caster.pos.clone().setY(caster.pos.y + 1.3).addScaledVector(caster.forward(), 0.6),
          to: at, t: 0, travel: opts.travel ?? 0.42, fuse: opts.fuse ?? 0.55,
          radius: opts.radius ?? 5.2, dmg: (opts.dmg ?? 46) * mult,
          pellets: opts.pellets ?? 22,
          kb: opts.kb ?? 8, kbY: opts.kbY ?? 4.5, hitstun: opts.hitstun ?? 40,
          fxT: 0, armed: false
        });
        break;
      }

      // =====================================================================
      // NOBARA — STRAW DOLL TECHNIQUE
      // =====================================================================
      // HAIRPIN 簪 — a nail thrown flat. It EMBEDS: in the opponent if it
      // reaches them, in the floor if it does not, and either way it sits
      // there ticking until its fuse runs out or she detonates it early. A
      // nail in the floor is a genuine trap; a nail in a body is worth extra
      // Essence when it goes off, which is the reason to aim.
      case 'nobara_hairpin': {
        const def = caster.cfg.ct1;
        if (caster.nailCount >= (opts.maxNails ?? def?.maxNails ?? 4)) {
          // Should be unreachable — Fighter.startCT turns the button into the
          // detonator at the cap — but a Copy or a domain payload could route
          // here, so it refuses rather than quietly exceeding the cap.
          m.hud.toast(caster, 'NAILS OUT');
          break;
        }
        m.sfx.nailThrow();
        const dir = caster.forward();
        caster.nailCount++;
        this.entities.push({
          type: 'nail', caster, sure, phase: 'fly',
          pos: caster.pos.clone().add(v3(0, 1.25, 0)).addScaledVector(dir, 0.5),
          dir, spd: opts.speed ?? 24, travelled: 0, range: opts.range ?? 15,
          dmg: (opts.dmg ?? 5) * mult, blastDmg: (opts.blastDmg ?? 10) * mult,
          radius: opts.radius ?? 2.0, fuse: opts.fuse ?? 2.6,
          kb: opts.kb ?? 1.2, hitstun: opts.hitstun ?? 12,
          blastKb: opts.blastKb ?? 3.2, blastKbY: opts.blastKbY ?? 1.2,
          blastHitstun: opts.blastHitstun ?? 22,
          stuckTo: null, fxT: 0
        });
        break;
      }

      // THE DETONATOR. Free, fast, and it takes everything she has out at
      // once — see Fighter.startCT for why it lives on the same button.
      case 'nobara_detonate': {
        // bringing every live nail's fuse forward to zero — the update loop
        // owns the blast itself, so a floor nail and a body nail go off
        // through exactly the same path they would have on their own clock
        let n = 0;
        for (const e of this.entities) {
          if (e.type === 'nail' && e.caster === caster && e.phase !== 'fly' && !e.spent) {
            e.fuse = 0;
            n++;
          }
        }
        if (!n) m.hud.toast(caster, 'NOTHING TO SET OFF');
        break;
      }

      // ---------------------------------------------------------------------
      // RESONANCE 共鳴 — THE ONE THAT REACHES THROUGH EVERYTHING
      // ---------------------------------------------------------------------
      // It consumes the WHOLE Essence meter and deals damage at any range,
      // through any defence, ignoring walls, distance and line of sight. It is
      // routed through the SAME sure-hit bypass the domains already use
      // (`sureHit: true, unblockable: true`), which is why it beats blocking,
      // i-frames, Gojo's teleport window, Toji's dash i-frames, Simple Domain
      // and every domain barrier without a single special case anywhere.
      //
      // THE TWO GUARDS BELOW ARE THE ONLY EXCEPTIONS, and both are safety
      // rather than defence:
      //
      //  1. A TARGET INSIDE A CINEMATIC. `transfigured`, `sentenced`,
      //     `executing` and `devoured` are frozen states owned by other
      //     systems, which drive the body themselves and expect it to still be
      //     in that state next tick. A normal hit would yank them out of it
      //     mid-cinematic and desync the system that owns them. So the damage
      //     still LANDS in full — through takeChip, which routes through
      //     adaptation and the RCT ledger exactly as a hit does — it just does
      //     not touch their state. Resonance reaches them; it does not break
      //     the game to do it.
      //
      //  2. SHADOW TRAVEL. A Megumi submerged in his own domain's shadow
      //     returns 'iframe' above every branch in Fighter._applyHit,
      //     INCLUDING the sure-hit branch, and that is a pre-existing ruling
      //     with a comment explaining it: there is no body inside the barrier
      //     to land on. Changing it would change Megumi, which this addition
      //     is not allowed to do. It is reported rather than special-cased.
      case 'nobara_resonance': {
        const def = caster.cfg.ct2;
        const spent = caster.spendAllEssence();
        const k = Math.min(1, spent / (caster.cfg.essence?.max ?? 100));
        const dmg0 = (def.base ?? 2) + spent * (def.perEssence ?? 0.4);
        const { dmg } = computeDamage(caster, dmg0 * mult, { canCrit: false });
        m.sfx.resonanceHit(k);
        m.hud.toast(caster, '共鳴 RESONANCE  ' + Math.round(spent) + ' 依代');
        m.hitstop(6 + Math.round(k * 8));
        m.cam.shake(0.3 + k * 0.5);
        if (k > 0.6) { m.cam.fovKick(6); m.stage.flash(0.2); }
        this._resonate(caster, t, dmg, k, 'ct2');
        break;
      }

      // FULL RELEASE — the same reach, the whole meter, at nearly double the
      // rate, with the cinematic. A wasted ultimate if she has nothing banked,
      // and the biggest single hit in the game if she has been landing hits.
      case 'nobara_full_release': {
        const u = caster.cfg.ultimate;
        const spent = caster.spendAllEssence();
        const k = Math.min(1, spent / (caster.cfg.essence?.max ?? 100));
        const dmg0 = (u.base ?? 8) + spent * (u.perEssence ?? 0.72);
        const { dmg } = computeDamage(caster, dmg0 * mult, { canCrit: false });
        m.sfx.fullRelease();
        m.stage.flash(0.65);
        m.cam.shake(1.1); m.cam.fovKick(11);
        m.hitstop(20);
        m.slowmo(0.45, 0.35);
        m.cam.cinematic(t.pos, 1.5, 3.4, 1.8);
        m.hud.techFlash(spent < 12
          ? '共鳴・全解放 — NOTHING TO RELEASE'
          : '共鳴・全解放 — ' + Math.round(spent) + ' 依代', 0xf0e2b8);
        this._resonate(caster, t, dmg, 1, 'ultimate', true);
        break;
      }

      // HER BLACK FLASH ATTEMPT. An ordinary committed strike that, on a clean
      // connect, opens the window through the SHARED `openBlackFlash` helper —
      // the same one Yuji's techniques call, with her own `cfg.blackFlash`
      // numbers. Nothing about his path is duplicated or touched.
      case 'nobara_bf_strike': {
        m.sfx.hammer(true);
        m.fx.dashTrail(caster);
        if (sure || inArc(caster, t, opts.reach ?? 1.9, opts.arc ?? 1.5)) {
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 11) * mult);
          const r = t.applyHit({
            ...hitOpts, isCT: false, src: 'punch', dmg,
            kb: opts.kb ?? 2.4, kbY: opts.kbY ?? 0,
            hitstun: opts.hitstun ?? 20, type: 'heavy'
          }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg' || r === 'armor') {
            openBlackFlash(caster, (opts.dmg ?? 11) * mult);
            caster.emit('bfWindow');
          } else {
            caster.emit('bfStrikeWhiff');
          }
        } else {
          m.sfx.whiff();
          caster.emit('bfStrikeWhiff');
        }
        break;
      }

      case 'nanami_collapse': {
        m.fx.cleaveArc(caster, true);
        m.sfx.cleave(true);
        m.cam.shake(0.35);
        if (sure || inArc(caster, t, opts.reach ?? 2.6, opts.arc ?? 2.2)) {
          // every Collapse hit lands on the 7:3 point — guaranteed crit
          const { dmg, crit } = computeDamage(caster, (opts.dmg ?? 9) * mult, { forceCrit: true });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 2.5, kbY: 0.8, hitstun: 20, type: 'heavy', unblockable: false }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { crit, heavy: true });
        }
        break;
      }
    }
  }

  // ---- RESONANCE, THE ACTUAL DELIVERY --------------------------------------
  // Shared by Resonance and Full Release so the two can never drift apart on
  // the one thing that matters about them: HOW they reach.
  //
  // States that belong to another system's cinematic get the damage without
  // the state change — see the long note on the `nobara_resonance` case. Every
  // other target takes an ordinary sure-hit, which is the same object the
  // domains already send and therefore automatically beats blocking, i-frames,
  // armour, Simple Domain, a standing barrier, and distance.
  _resonate(caster, target, dmg, k = 0.5, src = 'ct2', ult = false) {
    const m = this.match;
    if (!target || !target.alive) return 'dead';
    const chest = target.pos.clone().add(v3(0, 1.25, 0));
    // frozen cinematic states owned by domains / sentencing / devour
    const FROZEN = ['transfigured', 'sentenced', 'executing', 'devoured'];
    if (FROZEN.includes(target.state)) {
      target.takeChip(dmg, src);
      if (ult) m.fx.fullReleaseHit(chest, 1); else m.fx.resonanceHit(chest, k);
      m.hud.toast(target, '共鳴 — IT REACHES ANYWAY');
      return 'chip';
    }
    const r = target.applyHit({
      dmg, kb: ult ? (caster.cfg.ultimate.kb ?? 7) : 0.8,
      kbY: ult ? (caster.cfg.ultimate.kbY ?? 3) : 0,
      hitstun: ult ? (caster.cfg.ultimate.hitstun ?? 44) : (14 + Math.round(k * 20)),
      type: ult ? 'knockdown' : 'heavy',
      attacker: caster, isCT: true,
      // THE BYPASS. Exactly the flags a domain sure-hit carries — this is the
      // existing path, not a second one.
      sureHit: true, unblockable: true, otgOk: true,
      dir: v3(target.pos.x - caster.pos.x, 0, target.pos.z - caster.pos.z).normalize(),
      src,
      // Essence is TAKEN by the hit that gathers it; a Resonance is Essence
      // being spent, so it must not refund any. Explicit zero rather than
      // relying on the tier table.
      essence: 0
    }, m.ctxFor(caster));
    if (ult) m.fx.fullReleaseHit(chest, 1); else m.fx.resonanceHit(chest, k);
    hitFeedback(m, caster, target, r, { heavy: true, knockdown: ult, crit: ult });
    return r;
  }

  // called by the fighter FSM at a move's activation frame
  fire(caster, move, ctx, isRepeat = false) {
    if (!move) return;
    const key = move.effect;
    if (!key) return;
    // Copy: Opponent's CT (sword roll) mirrors the last technique they fired
    if (key !== 'sword_slash') caster.lastCT = key;
    const opts = { ...move, powerMult: move.powerMult ?? 1 };
    if (move.slot === 'copy') opts.powerMult = 1; // copy dmg already reduced in def
    this.applyTechnique(caster, key === 'nanami_collapse' || !isRepeat ? key : key, opts);
  }

  // ---- BLACK FLASH ----------------------------------------------------------
  // The timing input landed: cursed energy strikes within 0.000001s of the
  // fist. ~2.5x the connecting hit, black-red distortion, the works. Also
  // Yuji's engine: refunds CURRENT_CE and spikes MAX_CE.
  blackFlash(caster) {
    const m = this.match;
    const t = this.other(caster);
    const bf = caster.cfg.blackFlash;
    if (!t.alive || !inArc(caster, t, bf.reach ?? 2.4, 2.6)) return;
    caster.bfChain++;
    caster.res.maxCE = Math.min(100, caster.res.maxCE + (bf.maxSpike ?? 8));
    caster.res.curCE = Math.min(caster.res.maxCE, caster.res.curCE + (bf.ceRefund ?? 25));
    // NOBARA: hers pays in ESSENCE and a short damage window instead of a big
    // cursed-energy refund. Yuji's config has no `bonus`, so his payout above
    // is exactly what it was and nothing below runs for him.
    if (bf.bonus) {
      caster.gainEssence(bf.bonus.essence ?? 0, 'blackFlash');
      caster.buffs.bfCharge = Math.max(caster.buffs.bfCharge, bf.bonus.duration ?? 8);
    }
    const { dmg } = computeDamage(caster, (caster.bfBase || 5) * (bf.dmgMult ?? 2.5), { canCrit: false });
    const r = t.applyHit({
      dmg, kb: 2.5, kbY: 0.5, hitstun: 32, type: 'heavy', attacker: caster,
      isCT: false, unblockable: true, otgOk: true, dir: caster.forward(),
      // Black Flash is the same fist arriving twice — it adapts with punches
      src: 'punch'
    }, m.ctxFor(caster));
    // black core + red lightning, space visibly denting
    const chest = t.pos.clone().add(v3(0, 1.25, 0));
    for (let k = 0; k < 20; k++) {
      const a = rand(0, Math.PI * 2);
      m.fx._spawn(chest, {
        color: k % 3 === 0 ? 0x14090c : 0xff2038, size: rand(0.15, 0.45), life: rand(0.25, 0.45),
        vel: v3(Math.cos(a) * rand(4, 11), rand(-2, 7), Math.sin(a) * rand(4, 11)), gravity: 4
      });
    }
    m.fx._ring(chest, 0xff2038, { size: 0.4, growRate: 13, life: 0.35, flat: false });
    m.fx._ring(chest, 0x14090c, { size: 0.25, growRate: 8, life: 0.3, flat: false });
    m.fx.buffAura(caster, 3.5, 0xff2038); // the chain aura stacks per Flash
    caster.anim.play('bfImpact', { fade: 0.03, restart: true });
    m.hitstop(16);
    m.slowmo(0.3, 0.4);
    m.cam.shake(0.9);
    m.cam.fovKick(10);
    m.stage.flash(0.55);
    m.sfx.blackFlash();
    m.hud.toast(caster, '黒閃 BLACK FLASH' + (caster.bfChain > 1 ? ' ×' + caster.bfChain : ''));
  }

  // ---- sword-domain rolled techniques --------------------------------------
  // The roll already landed (sure-hit): everything here applies in full —
  // unblockable, ignores i-frames, OTG-capable. Fired after the reveal beat.
  queueSwordPayoff(caster, entry, delay) {
    this.entities.push({ type: 'swordPayoff', t: delay, caster, entry });
  }

  // HAKARI — the RCT counter's answer, held back a beat from the absorb so the
  // two events read as cause and effect rather than as one hit.
  queueCounterPunish(caster, target, def, delay) {
    this.entities.push({ type: 'counterPunish', t: delay, caster, target, def });
  }

  applySwordTech(caster, entry) {
    const m = this.match;
    const t = this.other(caster);
    if (!t.alive) return;
    const hitOpts = {
      attacker: caster, isCT: false, sureHit: true, unblockable: true,
      otgOk: true, dir: caster.forward(),
      // every rolled payload is the DOMAIN doing it, whatever technique the
      // roll happened to name — that is the category Mahoraga adapts to
      src: 'domain'
    };
    const chest = t.pos.clone().add(v3(0, 1.25, 0));

    switch (entry.key) {
      case 'divergent_fist': {
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 1.2, kbY: 0, hitstun: 22, type: 'heavy' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        m.fx._ring(chest, entry.color, { size: 0.4, growRate: 7, life: 0.3, flat: false });
        // the cursed energy lags behind the fist — the delayed hit launches
        this.entities.push({ type: 'delayedHit', t: entry.dur ?? 0.42, caster, dmg: entry.dmg2 ?? 13, color: entry.color });
        break;
      }
      case 'rika_slam': {
        m.fx.rikaFlash(caster, 'blast');
        m.sfx.rikaSwing();
        m.cam.cinematic(t.pos, 1.3, 3.4, 1.9);
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 5, kbY: 2, hitstun: 34, type: 'knockdown' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.8, growRate: 16, life: 0.5 });
        m.cam.shake(1.0); m.cam.fovKick(9);
        m.stage.flash(0.4);
        m.hitstop(14);
        break;
      }
      case 'cleave': {
        // crossing slash lines — clean slicing damage, leaves them standing
        for (const rot of [0.5, -0.7]) {
          const bar = m.fx._spawn(chest, { color: entry.color, size: 2.0, aspect: 0.08, life: 0.26, vel: v3() });
          bar.mesh.quaternion.copy(m.stage.camera.quaternion);
          bar.mesh.rotateZ(rot);
          bar.mesh.userData.keepQuat = true;
        }
        m.sfx.cleave();
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.8, kbY: 0, hitstun: 18, type: 'heavy' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        break;
      }
      case 'black_flash': {
        m.sfx.blackFlash();
        m.stage.flash(0.8);
        m.cam.shake(1.1); m.cam.fovKick(12);
        m.hitstop(20);
        // black core, red lightning spray
        for (let i = 0; i < 22; i++) {
          const a = rand(0, Math.PI * 2);
          m.fx._spawn(chest, {
            color: i % 3 === 0 ? 0x181018 : entry.color, size: rand(0.16, 0.5), life: rand(0.25, 0.5),
            vel: v3(Math.cos(a) * rand(4, 12), rand(-2, 8), Math.sin(a) * rand(4, 12)), gravity: 4
          });
        }
        m.fx._ring(chest, entry.color, { size: 0.5, growRate: 14, life: 0.4, flat: false });
        m.fx._ring(chest, 0x181018, { size: 0.3, growRate: 9, life: 0.35, flat: false });
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 6, kbY: 3, hitstun: 40, type: 'knockdown' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true, crit: true });
        break;
      }
      case 'dont_move': {
        // no damage: roots them — one free follow-up sword hit is the payoff
        m.sfx.root();
        const canRoot = !['knockdown', 'launched', 'getup', 'ko'].includes(t.state);
        if (canRoot) {
          t.rootT = entry.dur ?? 2.0;
          t.setState('rooted', { clip: 'stunned' });
          t.vel.x = t.vel.z = 0;
        }
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.5, growRate: 4, life: 0.6 });
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.3, growRate: 2.5, life: 0.9 });
        m.hud.toast(t, 'ROOTED');
        break;
      }
      case 'straw_doll': {
        m.sfx.resonance();
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.6, kbY: 0, hitstun: 16, type: 'light' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        // nails: spikes driven inward
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          m.fx._spawn(chest.clone().add(v3(Math.cos(a) * 0.8, rand(-0.3, 0.3), Math.sin(a) * 0.8)), {
            color: entry.color, size: 0.2, aspect: 0.25, life: 0.3,
            vel: v3(-Math.cos(a) * 4, 0, -Math.sin(a) * 4)
          });
        }
        this.entities.push({ type: 'bleed', t: entry.dur ?? 4, dps: entry.dps ?? 2.5, caster, color: entry.color });
        m.hud.toast(t, 'BLEEDING');
        break;
      }
      case 'boogie_woogie': {
        m.sfx.clap();
        // flash at both endpoints, then the swap
        for (const p of [caster.pos, t.pos]) {
          m.fx._ring(p.clone().setY(1.1), entry.color, { size: 0.5, growRate: 10, life: 0.3, flat: false });
        }
        const pa = caster.pos.clone();
        caster.pos.copy(t.pos); caster.prevPos.copy(caster.pos);
        t.pos.copy(pa); t.prevPos.copy(t.pos);
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.5, kbY: 0, hitstun: 14, type: 'light' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, {});
        m.cam.shake(0.3);
        break;
      }
      case 'shikigami': {
        m.sfx.shikigami();
        this.entities.push({ type: 'shikigami', t: entry.dur ?? 0.35, caster, dmg: entry.dmg, color: entry.color, fxT: 0 });
        break;
      }
      case 'gravity_crush': {
        m.sfx.slam();
        if (t.airborne) t.vel.set(0, -24, 0);
        const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
        const r = t.applyHit({ ...hitOpts, dmg, kb: 0.2, kbY: 0, hitstun: 30, type: 'knockdown' }, m.ctxFor(caster));
        hitFeedback(m, caster, t, r, { heavy: true });
        // pin: negative frame counter extends the knockdown before wakeup
        if (t.state === 'knockdown') t.f = -Math.round((entry.dur ?? 0.5) * 60);
        m.fx._ring(t.pos.clone().setY(0.08), entry.color, { size: 0.6, growRate: 12, life: 0.45 });
        for (let i = 0; i < 8; i++) {
          m.fx._spawn(t.pos.clone().add(v3(rand(-0.8, 0.8), rand(1.4, 2.4), rand(-0.8, 0.8))), {
            color: entry.color, size: rand(0.1, 0.2), life: 0.3, vel: v3(0, -8, 0)
          });
        }
        m.cam.shake(0.6);
        break;
      }
      case 'copy_ct': {
        // mirror the opponent's last used technique at reduced power; if they
        // haven't shown one yet, fall back to a plain imbued cut
        if (t.lastCT) {
          m.hud.toast(caster, 'COPIED: ' + t.lastCT.replace(/_/g, ' ').toUpperCase());
          this.applyTechnique(caster, t.lastCT, { sureHit: true, powerMult: entry.powerMult ?? 0.6, src: 'domain' });
        } else {
          m.sfx.cleave();
          const { dmg } = computeDamage(caster, entry.dmg, { canCrit: false });
          const r = t.applyHit({ ...hitOpts, dmg, kb: 1.5, kbY: 0, hitstun: 18, type: 'heavy' }, m.ctxFor(caster));
          hitFeedback(m, caster, t, r, { heavy: true });
        }
        break;
      }
    }
  }

  // Jogo's dash leaves burning ground behind him while the dash lasts
  startBurnTrail(fighter) {
    const df = fighter.cfg.dashFire;
    if (!df) return;
    this.entities.push({ type: 'burnTrail', owner: fighter, dropT: 0, df });
  }

  update(dt) {
    const m = this.match;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      // ================================================================
      // THE OVERHAULED TECHNIQUES. Travelling waves, constructs and
      // volleys — each one draws itself at the position it tests, so the
      // picture and the hitbox can never disagree.
      // ================================================================
      // TODO — RESONANT CLAP: the wall of shock in flight. On arrival it
      // drags the body TOWARD Todo (kb dir points back at him), which is
      // the Vice Grab dinner bell.
      if (e.type === 'clapWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.clapWaveTick(e.pos, e.dir, e.width); }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.width * 0.55 + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const back = v3(e.caster.pos.x - t.pos.x, 0, e.caster.pos.z - t.pos.z).normalize();
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.pull, kbY: 0.4, hitstun: e.hitstun,
            type: 'heavy', dir: back, sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') m.hud.toast(e.caster, '共鳴 — PULLED IN');
          m.cam.shake(0.4);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // YUJI — the whiffed Divergent Fist's ghost: the late cursed energy
      // discharged forward as a fist-shaped projectile. No Black Flash off
      // it — the chain died with the whiff — but the whiff is no longer free.
      if (e.type === 'ghostFist') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.028; m.fx.ghostFistTrail(e.pos, e.dir); }
        const t = this.other(e.caster);
        if (t?.alive && e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 0.8 + (t.hurtBox?.pad ?? 0)) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 3.5, kbY: 2, hitstun: 22, type: 'heavy', dir: e.dir.clone()
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { heavy: true });
          m.fx.ghostFistBurst(e.pos, e.dir);
          m.cam.shake(0.3);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) { m.fx.ghostFistBurst(e.pos, e.dir); this.entities.splice(i, 1); }
        continue;
      }
      // YUJI — the thrown 卍 crescent off the Manji Kick's heel.
      if (e.type === 'crescent') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.crescentTick(e.pos, e.dir, e.color); }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.1, 0))) < 1.0 + (t.hurtBox?.pad ?? 0))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          m.fx._ring(e.pos.clone(), e.color, { size: 0.4, growRate: 9, life: 0.26, flat: false });
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // NAOYA — FRAME 24: the reel of frozen kick-frames popping down the
      // line at 24 fps. The first frame that connects delivers the whole
      // kick and burns the rest of the reel.
      if (e.type === 'frameLine') {
        e.t -= dt;
        if (e.t > 0) continue;
        e.t += e.interval;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        const at = e.origin.clone().addScaledVector(e.dir, e.spacing * (e.i + 1));
        m.fx.frameFlash(at.clone().setY(1.25), e.i);
        m.sfx.projectionStep?.();
        m.arena?.destruct?.damageAt(at.clone().setY(1.0), 1.3, e.destruct / e.frames);
        const t = this.other(c);
        if (t?.alive && (e.sure || flatDist(at, t.pos) < e.radius + (t.hurtBox?.radius ?? 0.62))) {
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'knockdown', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { crit, heavy: true });
          m.cam.shake(0.7); m.cam.fovKick(8); m.hitstop(8);
          this.entities.splice(i, 1);
          continue;
        }
        if (++e.i >= e.frames) this.entities.splice(i, 1);
        continue;
      }
      // NANAMI — the RATIO WAVE. Inside the 7:3 band of its range the hit
      // is a forced critical: the technique finding the weak point is not a
      // roll of the dice, it is the technique.
      if (e.type === 'ratioWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        const sweet = e.travelled >= e.sweetLo && e.travelled <= e.sweetHi;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.ratioWaveTick(e.pos, e.dir, e.width, sweet); }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.width * 0.55 + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg: base } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const dmg = sweet ? base * 1.5 : base;
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun + (sweet ? 6 : 0),
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit: sweet, heavy: true });
          if (r === 'hit' || r === 'otg') {
            if (sweet) {
              m.fx.ratioStrike(t.pos.clone().add(v3(0, 1.2, 0)), 1);
              m.hud.toast(e.caster, '7:3 — THE WEAK POINT');
            }
            if (e.appliesMark) {
              e.caster.ratioMark = true;
              m.hud.toast(e.caster, '7:3 MARKED');
            }
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // HIGURUMA — the VERDICT falling. The construct hangs, drops with the
      // fuse, stamps the seal. Landing it files evidence.
      if (e.type === 'gavelDrop') {
        e.t += dt;
        const k = Math.min(1, e.t / e.delay);
        if (e.node) {
          e.node.position.set(e.pos.x, 7.5 - (7.5 - e.radius * 0.36) * (k * k), e.pos.z);
          e.node.rotation.y = e.node.userData.spinAxis + k * 1.2;
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.11;
          m.fx._ring(e.pos.clone().setY(0.05), 0xd8c78a,
            { size: e.radius * (0.4 + 0.5 * (1 - k)), growRate: 0.4, life: 0.22 });
        }
        if (e.t < e.delay) continue;
        if (e.node) { m.fx.scene.remove(e.node); }
        m.fx.gavelVerdict(e.pos, e.radius);
        m.sfx.slam();
        m.cam.shake(0.6); m.cam.fovKick(5);
        m.arena?.destruct?.damageAt(e.pos.clone().setY(0.6), e.radius + 0.6, 46);
        m.arena?.splash?.(e.pos.x, e.pos.z, 1.2);
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive) continue;
          if (!e.sure && flatDist(f.pos, e.pos) > e.radius + (f.hurtBox?.radius ?? 0.62)) continue;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'knockdown', sureHit: e.sure,
            dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true, knockdown: true });
          // the blow, entered into the record
          if ((r === 'hit' || r === 'otg') && e.evidence) gainEvidence(e.caster, e.evidence);
        }
        this.entities.splice(i, 1);
        continue;
      }
      // MAHITO — the BODY LANCE extending, holding, reeling back in.
      if (e.type === 'bodyLance') {
        e.t += dt;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        const total = e.extend + e.hold + e.extend;
        const k = e.t < e.extend ? e.t / e.extend
          : e.t < e.extend + e.hold ? 1
            : Math.max(0, 1 - (e.t - e.extend - e.hold) / e.extend);
        const from = c.pos.clone().add(v3(0, 1.35, 0));
        const tip = from.clone().addScaledVector(e.dir, 0.6 + (e.reach - 0.6) * k);
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.025; m.fx.bodyLanceTick(from, tip, e.dir); }
        const t = this.other(c);
        if (t?.alive && !e.dealt) {
          // point-to-segment: is the chest anywhere along the extended arm?
          const chest = t.pos.clone().add(v3(0, 1.2, 0));
          const ab = tip.clone().sub(from);
          const len2 = Math.max(0.001, ab.lengthSq());
          const s = clamp(chest.clone().sub(from).dot(ab) / len2, 0, 1);
          const d = chest.distanceTo(from.clone().addScaledVector(ab, s));
          if (e.sure || d < 0.7 + (t.hurtBox?.pad ?? 0)) {
            e.dealt = true;
            const { dmg, crit } = computeDamage(c, e.dmg);
            const type = e.variant === 1 ? 'knockdown' : 'heavy';
            const r = t.applyHit({
              ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
              type, dir: e.dir.clone(), sureHit: e.sure
            }, m.ctxFor(c));
            hitFeedback(m, c, t, r, { crit, heavy: true, knockdown: type === 'knockdown' });
            if (r === 'hit' || r === 'otg' || r === 'block') {
              m.domains.transfigChunk(c, t, 'bodyWeapon', r === 'block');
            }
          }
        }
        if (e.t >= total) this.entities.splice(i, 1);
        continue;
      }
      // HAKARI — one PACHINKO ball: gravity, floor bounce, loose homing.
      // The gold payout ball knocks down and works on a body already down.
      if (e.type === 'pachinko') {
        if (e.delay > 0) { e.delay -= dt; continue; }
        e.life -= dt;
        const t = this.other(e.caster);
        if (t?.alive) {
          const want = v3(t.pos.x - e.pos.x, 0, t.pos.z - e.pos.z).normalize().multiplyScalar(e.spd);
          e.vel.x += (want.x - e.vel.x) * Math.min(1, e.homing * dt);
          e.vel.z += (want.z - e.vel.z) * Math.min(1, e.homing * dt);
        }
        e.vel.y -= 20 * dt;
        e.pos.addScaledVector(e.vel, dt);
        if (e.pos.y < 0.22) { e.pos.y = 0.22; e.vel.y = Math.abs(e.vel.y) * 0.72; }
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.02; m.fx.pachinkoTrail(e.pos, e.gold); }
        if (t?.alive && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 0.9, 0))) < 0.85 + (t.hurtBox?.pad ?? 0))) {
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.gold ? 4.5 : 1.0, kbY: e.gold ? 1.4 : 0,
            hitstun: e.gold ? 30 : 12, type: e.gold ? 'knockdown' : 'light',
            otgOk: true, sureHit: e.sure,
            dir: v3(e.vel.x, 0, e.vel.z).normalize()
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, e.gold ? { heavy: true, knockdown: true } : {});
          if (e.gold && (r === 'hit' || r === 'otg')) {
            m.fx._ring(e.pos.clone(), 0xffc93c, { size: 0.5, growRate: 12, life: 0.35, flat: false });
            m.cam.shake(0.45);
            m.hitstop(8);
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0) this.entities.splice(i, 1);
        continue;
      }
      // YUTA — RIKA'S GRASP in flight. What it catches, it brings home.
      if (e.type === 'rikaHand') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        if (e.node) {
          e.node.position.copy(e.pos);
          e.node.quaternion.setFromUnitVectors(v3(0, 0, 1), e.dir);
          e.node.rotateZ(Math.sin(e.travelled * 2.2) * 0.15);
        }
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.035;
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.3, 0.3), rand(-0.3, 0.3), rand(-0.3, 0.3))), {
            color: Math.random() < 0.3 ? 0x1a3a30 : 0x9ff5c9, size: rand(0.14, 0.3), life: 0.24,
            vel: e.dir.clone().multiplyScalar(-rand(2, 4))
          });
        }
        const c = e.caster;
        const t = this.other(c);
        if (t?.alive && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 1.1 + (t.hurtBox?.pad ?? 0))) {
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 0.5, kbY: 0, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { crit, heavy: true });
          if (r === 'hit' || r === 'otg') {
            // handed over: deposited at arm's reach in front of Yuta
            const dest = c.pos.clone().addScaledVector(c.forward(), e.dragGap);
            dest.y = t.pos.y;
            m.fx._spawn(t.pos.clone().add(v3(0, 1.2, 0)), { color: 0x9ff5c9, size: 0.6, life: 0.2, vel: v3() });
            t.pos.copy(dest); t.prevPos.copy(dest);
            t.vel.set(0, 0, 0);
            m.hud.toast(c, 'RIKA — HANDED OVER');
            m.cam.shake(0.4);
          }
          if (e.node) m.fx.release(e.node);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.travelled >= e.range) {
          if (e.node) m.fx.release(e.node);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // PANDA — the QUAKE PALM rupture front running down the lane.
      if (e.type === 'quakeWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.05;
          m.fx.quakeTick(e.pos, e.radius);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(0.5), e.radius, 14);
        }
        const t = this.other(e.caster);
        if (t?.alive && !e.dealt
          && (e.sure || flatDist(e.pos, t.pos) < e.radius + (t.hurtBox?.radius ?? 0.62))) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'launcher', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: true });
          m.cam.shake(0.4);
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // TOJI — the Split Soul Katana's phantom echo: the same cut arriving
      // on the soul a beat behind the blade.
      if (e.type === 'soulEcho') {
        e.t -= dt;
        if (e.t > 0) continue;
        const c = e.caster;
        const t = this.other(c);
        if (c.alive && t?.alive && (e.sure || inArc(c, t, e.reach, e.arc))) {
          const p = t.pos.clone().add(v3(0, 1.2, 0));
          const bar = m.fx._spawn(p, { color: 0x8b9bab, size: 1.7, aspect: 0.08, life: 0.22, vel: v3() });
          bar.mesh.quaternion.copy(m.fx.camera.quaternion);
          bar.mesh.rotateZ(rand(-0.8, 0.8));
          bar.mesh.userData.keepQuat = true;
          const { dmg } = computeDamage(c, e.dmg, { canCrit: false });
          const r = t.applyHit({
            ...e.hitOpts, dmg, kb: 1.2, kbY: 0, hitstun: e.hitstun,
            type: 'light', sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, {});
        }
        this.entities.splice(i, 1);
        continue;
      }
      // GOJO — RED in flight: detonates on the first body it reaches, or at
      // the end of its range, shoving the level apart as it goes.
      if (e.type === 'redOrb') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.025;
          m.fx.redOrbTick(e.pos, e.dir);
          m.arena?.destruct?.damageAt(e.pos, 2.2, 40);
        }
        const t = this.other(e.caster);
        const hit = t?.alive
          && (e.sure || e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 1.0 + (t.hurtBox?.pad ?? 0));
        if (hit || e.travelled >= e.range) {
          m.fx.redOrbBurst(e.pos);
          m.arena?.destruct?.damageAt(e.pos, 2.6, 60);
          if (hit) {
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = t.applyHit({
              ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: 26,
              type: 'knockdown', dir: e.dir.clone(), sureHit: e.sure
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { crit, heavy: true });
            m.cam.shake(0.4); m.cam.fovKick(6);
          }
          this.entities.splice(i, 1);
        }
        continue;
      }
      // SUKUNA — the DISMANTLE wavefront racing down the line, cutting the
      // level as it reaches it. Everyone on the line is cut once, when the
      // front arrives at them — not before.
      if (e.type === 'dismantleWave') {
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.022;
          m.fx.dismantleTick(e.pos, e.dir, e.width);
          m.arena?.destruct?.damageAt(e.pos, e.destroyRadius, e.destroyPower);
        }
        for (const f of m.activeFighters) {
          if (f === e.caster || !f.alive || e.hit.has(f)) continue;
          const rel = f.pos.clone().sub(e.caster.pos);
          const along = rel.x * e.dir.x + rel.z * e.dir.z;
          const perp = Math.abs(rel.x * e.dir.z - rel.z * e.dir.x);
          const pad = f.hurtBox.pad;
          const reached = e.sure || (along > -0.6 && along <= e.travelled + 0.6 && perp < e.width + pad);
          if (!reached) continue;
          e.hit.add(f);
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = f.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, f, r, { crit, heavy: true });
        }
        if (e.travelled >= e.range) this.entities.splice(i, 1);
        continue;
      }
      // TOJI — CLOUD CYCLONE: the opened staff whirling around him, ticking
      // on everything inside the circle.
      if (e.type === 'staffSpin') {
        e.t += dt;
        e.tick -= dt;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        e.ang += dt * (Math.PI * 2 * 3) / e.dur;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx.staffSpinTick(c, e.radius, e.ang);
          m.fx.staffSpinTick(c, e.radius, e.ang + Math.PI);
        }
        if (e.tick <= 0) {
          e.tick += e.interval;
          const t = this.other(c);
          if (t?.alive && (e.sure || flatDist(c.pos, t.pos) <= e.radius)) {
            const { dmg, crit } = computeDamage(c, e.dmg);
            const away = t.pos.clone().sub(c.pos).setY(0).normalize();
            const r = t.applyHit({
              ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
              type: 'light', sureHit: e.sure,
              dir: away.lengthSq() > 0.01 ? away : c.forward()
            }, m.ctxFor(c));
            hitFeedback(m, c, t, r, { crit });
          }
        }
        if (e.t >= e.dur) this.entities.splice(i, 1);
        continue;
      }
      // ---- NAOYA: PROJECTION RUSH -------------------------------------
      // One position per 1/24 s, and NOTHING between them. He is teleported
      // (`pos.copy`, never a lerp), an afterimage is left standing where he
      // was, and one strike resolves — then the clock runs down another
      // twenty-fourth of a second and it happens again five more times.
      //
      // Being an entity rather than a multi-hit active window is what buys
      // that: an active window would spread its hits across whatever frames
      // the state machine happened to give it, and the whole point of this
      // character is that his timings are on a grid rather than approximate.
      if (e.type === 'projRush') {
        e.t -= dt;
        if (e.t > 0) continue;
        e.t += e.interval;
        const c = e.caster;
        // the rush is abandoned if he is taken out of it — frozen himself,
        // KO'd, or seized by a domain cinematic
        if (!c.alive || c.frozenT > 0 || !e.target?.alive) { this.entities.splice(i, 1); continue; }
        const p = e.path[e.i];
        c.model.projectionStep?.(c.pos, c.facing);   // leave the previous one behind
        c.pos.copy(p);
        c.prevPos.copy(c.pos);                       // no render-side interpolation either
        c.vel.set(0, 0, 0);
        c.facing = yawBetween(c.pos, e.target.pos);
        m.sfx.projectionStep?.();
        const { dmg } = computeDamage(c, e.dmg, { canCrit: false });
        const r = e.target.applyHit({
          ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light', dir: c.forward()
        }, m.ctxFor(c));
        hitFeedback(m, c, e.target, r, {});
        e.i++;
        if (e.i >= e.path.length) {
          c.model.projectionStep?.(c.pos, c.facing);
          this.entities.splice(i, 1);
        }
        continue;
      }
      // ---- PANDA: THE TWO TRAVELLING MOVES ------------------------------
      // Both are entities rather than one-frame reach tests, for the same
      // reason Naoya's rush is: they genuinely cross ground, so they have to be
      // genuinely sidesteppable. The two share this shape and differ only in
      // what they do at the end.
      if (e.type === 'pandaRoll' || e.type === 'pandaGore') {
        e.t += dt;
        const c = e.caster;
        if (!c.alive) { this.entities.splice(i, 1); continue; }
        const gore = e.type === 'pandaGore';
        const spd = gore ? e.speed : (e.travel / e.dur);
        c.vel.x = e.dir.x * spd;
        c.vel.z = e.dir.z * spd;
        if (gore) {
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.04;
            m.fx._spawn(c.pos.clone().setY(0.35), {
              color: Math.random() < 0.4 ? 0xffffff : 0xe08aa8, size: rand(0.14, 0.30),
              aspect: 0.5, life: 0.22, vel: v3(rand(-1.4, 1.4), rand(0.3, 1.6), rand(-1.4, 1.4))
            });
          }
          m.arena?.destruct?.damageAt(c.pos.clone().setY(1.0), 1.2, e.destruct * dt * 3);
        }
        if (!e.dealt && e.target?.alive
          && flatDist(c.pos, e.target.pos) < e.reach + (e.target.hurtBox?.radius ?? 0.62)) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(c, e.dmg);
          const r = e.target.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun,
            type: 'heavy', dir: e.dir.clone(), sureHit: e.sure
          }, m.ctxFor(c));
          hitFeedback(m, c, e.target, r, { crit, heavy: true });
          // A GORE THAT CONNECTS STOPS. It is a charge into a body, not through
          // one — and letting it continue would carry him past the opponent and
          // hand them his back for free, which is the opposite of what the move
          // is for. The roll, being a body press, ends on contact as well.
          this.entities.splice(i, 1);
          continue;
        }
        if (e.t >= e.dur) { this.entities.splice(i, 1); }
        continue;
      }
      // ---- KASHIMO: LIGHTNING BOLT --------------------------------------
      // FLAT AND FAST, WITH NO HOMING AT ALL — the deliberate opposite of
      // Jogo's embers, which track. A bolt goes exactly where he pointed it,
      // which is what makes the move a spacing tool rather than a fire-and-
      // forget one, and it is why the range scaling is allowed to be as
      // dramatic as it is: a screen-crossing projectile that also homed would
      // be unanswerable.
      if (e.type === 'bolt') {
        e.life -= dt;
        e.pos.addScaledVector(e.vel, dt);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.022;
          // the bolt draws itself as a short jittered chain of sparks rather
          // than a single sprite — it has to read as a discharge in flight
          for (let k = 0; k < 2; k++) {
            m.fx._spawn(e.pos.clone().add(v3(rand(-0.14, 0.14), rand(-0.14, 0.14), rand(-0.14, 0.14))), {
              color: k === 0 ? 0xf4ecff : 0xa46bff, size: rand(0.10, 0.22), aspect: 0.26,
              life: 0.14, vel: v3(rand(-0.8, 0.8), rand(-0.4, 0.8), rand(-0.8, 0.8))
            });
          }
        }
        const tgt = this.other(e.caster);
        if (tgt?.alive && !e.dealt
          && e.pos.distanceTo(tgt.pos.clone().add(v3(0, 1.2, 0))) < 0.85) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tgt.applyHit({
            ...e.hitOpts, dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light',
            dir: v3(e.vel.x, 0, e.vel.z).normalize(), sureHit: e.sure
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tgt, r, {});
          if (r === 'hit' || r === 'otg') {
            gainCharge(e.caster, 'tech');
            // TIER 3 ONLY: the bolt forks on contact into two short arcs that
            // spit off the body. Cosmetically it is the tell that he is at the
            // top tier; mechanically it is a small second tick.
            if (e.fork) {
              const { dmg: fd } = computeDamage(e.caster, e.forkDmg, { canCrit: false });
              tgt.takeChip(fd, 'electric');
              for (let k = 0; k < 10; k++) {
                m.fx._spawn(tgt.pos.clone().add(v3(rand(-0.6, 0.6), rand(0.6, 1.9), rand(-0.6, 0.6))), {
                  color: 0xf4ecff, size: rand(0.08, 0.18), aspect: 0.25, life: rand(0.12, 0.26),
                  vel: v3(rand(-3, 3), rand(0, 3), rand(-3, 3))
                });
              }
            }
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0 || e.pos.y < 0.1) {
          m.fx._ring(e.pos.clone(), 0xa46bff, { size: 0.2, growRate: 5, life: 0.16, flat: false });
          this.entities.splice(i, 1);
        }
        continue;
      }
      if (e.type === 'ember') {
        // homing flame projectile: loose tracking toward the chest
        if (e.delay > 0) { e.delay -= dt; continue; }
        e.life -= dt;
        const t = this.other(e.caster);
        if (t?.alive) {
          const want = t.pos.clone().add(v3(0, 1.2, 0)).sub(e.pos).normalize().multiplyScalar(e.spd);
          e.vel.lerp(want, Math.min(1, e.homing * dt));
        }
        e.pos.addScaledVector(e.vel, dt);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.035;
          m.fx._spawn(e.pos.clone(), {
            color: Math.random() < 0.3 ? 0xffb03a : 0xff5a1f, size: rand(0.09, 0.2),
            life: 0.22, vel: v3(rand(-0.6, 0.6), rand(0.2, 1.2), rand(-0.6, 0.6))
          });
        }
        if (t?.alive && !e.dealt && e.pos.distanceTo(t.pos.clone().add(v3(0, 1.2, 0))) < 0.75) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = t.applyHit({
            dmg, kb: 0.6, kbY: 0, hitstun: 10, type: 'light', attacker: e.caster,
            isCT: true, sureHit: e.sure, dir: e.caster.forward(), src: 'projectile',
            elem: 'fire'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, {});
          if (r === 'hit' || r === 'otg') applyBurn(t, e.burn);
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0 || e.pos.y < 0) this.entities.splice(i, 1);
      } else if (e.type === 'bloodEdge') {
        // ---- CHOSO: BLOOD EDGE ------------------------------------------
        // Flat, fast, NO homing — it goes where he threw it, which is what
        // makes holding an angle a skill. Damage falls off with distance
        // travelled rather than the blade simply vanishing, so the edge of his
        // range is a soft boundary he can still poke past for scraps.
        const step = e.spd * dt;
        e.pos.addScaledVector(e.dir, step);
        e.travelled += step;
        e.fxT -= dt;
        if (e.fxT <= 0) { e.fxT = 0.03; m.fx.bloodEdgeTrail(e.pos, e.dir); }
        const tt = this.other(e.caster);
        if (tt?.alive && !e.dealt) {
          const hb = tt.hurtBox;
          const d = e.pos.distanceTo(tt.pos.clone().add(v3(0, hb.center, 0)));
          if (d < hb.radius + 0.55) {
            e.dealt = true;
            const k = e.travelled <= e.falloffAt ? 1
              : Math.max(e.falloffMin, 1 - (e.travelled - e.falloffAt) / Math.max(0.01, e.range - e.falloffAt) * (1 - e.falloffMin));
            const { dmg, crit } = computeDamage(e.caster, e.dmg * k);
            const r = tt.applyHit({
              dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun, type: 'light',
              attacker: e.caster, isCT: true, sureHit: e.sure,
              dir: e.dir.clone(), src: 'projectile'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, tt, r, { crit });
            m.fx.bloodEdgeTrail(e.pos, e.dir);
            if (k < 0.99 && (r === 'hit' || r === 'otg')) m.hud.toast(e.caster, 'FALLOFF');
            this.entities.splice(i, 1);
            continue;
          }
        }
        if (e.travelled >= e.range || e.pos.y < 0.05) {
          m.arena?.destruct?.damageAt(e.pos, 1.2, 16, { kind: 'body' });
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'supernova') {
        // ---- CHOSO: SUPERNOVA -------------------------------------------
        // Convergence in transit, then the fuse, then the burst. The mass is
        // VISIBLE the whole way and it sits at the detonation point for the
        // fuse doing nothing at all — that stationary beat is the counterplay
        // and it is deliberately generous for an ultimate.
        e.t += dt;
        if (!e.armed) {
          const k = Math.min(1, e.t / e.travel);
          e.cur = e.from.clone().lerp(e.to, k * k * (3 - 2 * k));
          e.cur.y += Math.sin(k * Math.PI) * 0.9;      // a lob, not a laser
          m.fx.supernovaCore(e.cur, k);
          if (k >= 1) { e.armed = true; e.t = 0; m.sfx.eruptPrime(); }
        } else {
          e.cur = e.to.clone();
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.05;
            m.fx.supernovaCore(e.to, 1 + Math.sin(e.t * 26) * 0.25);
            m.fx._ring(e.to, 0x8e1020, { size: e.radius * 0.2, growRate: -0.6, life: 0.22, flat: false });
          }
          if (e.t >= e.fuse) {
            m.fx.supernovaBurst(e.to, e.radius, e.pellets);
            m.sfx.supernova();
            m.cam.shake(1.2); m.cam.fovKick(12);
            m.stage.flash(0.6);
            m.hitstop(16);
            m.arena?.destruct?.damageAt(e.to, e.radius + 1.5, 150, { kind: 'body' });
            m.arena?.splash?.(e.to.x, e.to.z, 1.6);
            for (const f of m.activeFighters) {
              if (f === e.caster || !f.alive) continue;
              const d = Math.hypot(f.pos.x - e.to.x, f.pos.z - e.to.z);
              if (d > e.radius) continue;
              // pellets thin out toward the rim — standing at the edge is
              // meaningfully better than standing in it
              const k = 1 - 0.45 * (d / e.radius);
              const { dmg } = computeDamage(e.caster, e.dmg * k, { canCrit: false });
              const r = f.applyHit({
                dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun, type: 'knockdown',
                attacker: e.caster, isCT: true, otgOk: true, src: 'ultimate',
                dir: v3(f.pos.x - e.to.x, 0, f.pos.z - e.to.z).normalize()
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, f, r, { heavy: true, knockdown: true });
            }
            m.minions?.hurtAt(e.to, e.radius, e.dmg * 0.6, e.caster);
            // ...and Geto's curses, which stand in the same field as the transfigured
            // human and take area damage from exactly the same sources.
            m.curses?.hurtAt(e.to, e.radius, e.dmg * 0.6, e.caster);
            this.entities.splice(i, 1);
          }
        }
      } else if (e.type === 'nail') {
        // ---- NOBARA: HAIRPIN --------------------------------------------
        // Three phases on one entity: flying, stuck in a BODY, stuck in the
        // FLOOR. A body nail rides its victim, so running does not shake it;
        // a floor nail is a trap that stays where it landed. Either way the
        // fuse ticks, and either way she can bring it forward.
        if (e.phase === 'fly') {
          const step = e.spd * dt;
          e.pos.addScaledVector(e.dir, step);
          e.travelled += step;
          m.fx.nailTrail(e.pos);
          const tt = this.other(e.caster);
          let hit = false;
          if (tt?.alive) {
            const hb = tt.hurtBox;
            const d = e.pos.distanceTo(tt.pos.clone().add(v3(0, hb.center, 0)));
            if (d < hb.radius + 0.5) {
              const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
              const r = tt.applyHit({
                dmg, kb: e.kb, kbY: 0, hitstun: e.hitstun, type: 'light',
                attacker: e.caster, isCT: true, sureHit: e.sure,
                dir: e.dir.clone(), src: 'projectile'
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, tt, r, {});
              // it only EMBEDS on a clean connect — a blocked or i-framed nail
              // clatters to the floor and becomes a trap there instead, which
              // is a worse outcome for her and a fair one
              if (r === 'hit' || r === 'otg') {
                e.phase = 'body'; e.stuckTo = tt;
                m.fx.nailStick(e.pos.clone(), true);
                m.sfx.nailStick();
                m.hud.toast(tt, '簪 NAILED');
              } else {
                e.phase = 'floor';
                e.pos.y = tt.pos.y + 0.02;
                m.fx.nailStick(e.pos.clone(), false);
              }
              hit = true;
            }
          }
          if (!hit && (e.travelled >= e.range || e.pos.y <= 0.06)) {
            e.phase = 'floor';
            e.pos.y = Math.max(0, e.caster.groundY ?? 0) + 0.02;
            m.fx.nailStick(e.pos.clone(), false);
            m.sfx.nailStick();
          }
        } else {
          e.fuse -= dt;
          if (e.phase === 'body') {
            if (!e.stuckTo?.alive) { e.phase = 'floor'; e.stuckTo = null; }
            else {
              e.pos.copy(e.stuckTo.pos).add(v3(0, 1.15, 0));
            }
          }
          e.fxT -= dt;
          if (e.fxT <= 0) { e.fxT = 0.16; m.fx.nailIdle(e.pos); }
          if (e.fuse <= 0 && !e.spent) {
            e.spent = true;
            m.fx.nailBlast(e.pos.clone(), e.radius);
            m.sfx.nailBlast();
            m.cam.shake(0.28);
            m.arena?.destruct?.damageAt(e.pos, e.radius, 34, { kind: 'body' });
            const inBody = e.phase === 'body' ? e.stuckTo : null;
            for (const f of m.activeFighters) {
              if (f === e.caster || !f.alive) continue;
              if (f !== inBody && Math.hypot(f.pos.x - e.pos.x, f.pos.z - e.pos.z) > e.radius) continue;
              const { dmg, crit } = computeDamage(e.caster, e.blastDmg);
              const r = f.applyHit({
                dmg, kb: e.blastKb, kbY: e.blastKbY, hitstun: e.blastHitstun,
                type: 'heavy', attacker: e.caster, isCT: true, otgOk: true, src: 'ct1',
                dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize(),
                // A nail going off INSIDE them is the big Essence payout — the
                // whole reason to aim rather than to carpet the floor. One in
                // the ground takes nothing extra beyond the ordinary connect.
                essence: f === inBody ? (e.caster.cfg.essence?.perNail ?? 6.5) : undefined
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, f, r, { crit, heavy: true });
            }
            e.caster.nailCount = Math.max(0, e.caster.nailCount - 1);
            this.entities.splice(i, 1);
          }
        }
      } else if (e.type === 'eruption') {
        // telegraphed delayed ground blast; MAXIMUM re-erupts in stages
        e.t -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          // the glowing marker: pulsing ring + rising sparks over the spot
          e.fxT = 0.12;
          m.fx._ring(e.pos.clone().setY(0.06), 0xff5a1f, { size: e.radius * 0.5, growRate: 2.2, life: 0.3 });
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.5, 0.5), 0.1, rand(-0.5, 0.5))), {
            color: 0xffb03a, size: rand(0.08, 0.16), life: 0.4, vel: v3(0, rand(1.5, 3), 0)
          });
        }
        if (e.t <= 0) {
          m.fx.eruptionBlast(e.pos, e.radius);
          m.sfx.erupt();
          m.cam.shake(0.55);
          // magma scorches and ignites whatever it comes up under
          m.arena?.destruct?.damageAt(e.pos, e.radius + 1.2, 60, { kind: 'heat' });
          m.arena?.splash?.(e.pos.x, e.pos.z, 1.4);
          // FIRE BURNS ROOT FIELDS OUT. Jogo answers Hanami's terrain with
          // the same tool he answers everything else with.
          m.flora?.damageFieldsAt(e.pos, e.radius + 1.0, 'fire');
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            const d = Math.hypot(f.pos.x - e.pos.x, f.pos.z - e.pos.z);
            if (e.sure || d < e.radius + 0.4) {
              const { dmg, crit } = computeDamage(e.caster, e.dmg);
              const r = f.applyHit({
                dmg, kb: e.kb, kbY: e.kbY, hitstun: 30, type: 'launcher', attacker: e.caster,
                isCT: true, sureHit: e.sure, otgOk: true, src: 'ct2', elem: 'fire',
                dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
              }, m.ctxFor(e.caster));
              hitFeedback(m, e.caster, f, r, { crit, heavy: true });
              if (r === 'hit' || r === 'otg') applyBurn(f, e.burn);
            }
          }
          m.minions?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          // ...and Geto's curses, which stand in the same field as the transfigured
          // human and take area damage from exactly the same sources.
          m.curses?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          if (--e.stages > 0) { e.t = e.stageGap; e.radius += 0.5; e.sure = false; }
          else this.entities.splice(i, 1);
        }
      } else if (e.type === 'burnTrail') {
        // dropping patches of burning ground while the dash lasts
        if (e.owner.state !== 'dash' || !e.owner.alive) { this.entities.splice(i, 1); continue; }
        e.dropT -= dt;
        if (e.dropT <= 0) {
          e.dropT = e.df.dropEvery;
          this.entities.push({
            type: 'burnGround', caster: e.owner, pos: e.owner.pos.clone().setY(0),
            life: e.df.life, radius: e.df.radius, stackEvery: e.df.stackEvery, tickT: 0, fxT: 0
          });
        }
      } else if (e.type === 'burnGround') {
        e.life -= dt;
        e.tickT -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.09;
          m.fx._spawn(e.pos.clone().add(v3(rand(-e.radius, e.radius) * 0.7, 0.05, rand(-e.radius, e.radius) * 0.7)), {
            color: Math.random() < 0.4 ? 0xffb03a : 0xff5a1f, size: rand(0.08, 0.18),
            life: rand(0.25, 0.5), vel: v3(rand(-0.3, 0.3), rand(0.8, 2.0), rand(-0.3, 0.3))
          });
        }
        if (e.tickT <= 0) {
          e.tickT = e.stackEvery;
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive || f.airborne) continue;
            if (Math.hypot(f.pos.x - e.pos.x, f.pos.z - e.pos.z) < e.radius) {
              applyBurn(f, 1);
              m.hud.toast(f, 'BURNING');
            }
          }
          m.minions?.hurtAt(e.pos, e.radius, 2, e.caster);
          // ...and Geto's curses, which stand in the same field as the transfigured
          // human and take area damage from exactly the same sources.
          m.curses?.hurtAt(e.pos, e.radius, 2, e.caster);
          // burning ground eats a root field it is sitting on
          m.flora?.damageFieldsAt(e.pos, e.radius, 'fire');
        }
        if (e.life <= 0) this.entities.splice(i, 1);
      } else if (e.type === 'blue') {
        e.t -= dt;
        // the implosion made visible: motes spiralling INTO the point the
        // whole time it holds, so the drag reads as suction rather than as
        // an invisible force
        e.fxT = (e.fxT ?? 0) - dt;
        if (e.fxT <= 0) {
          e.fxT = 0.05;
          const a = rand(0, Math.PI * 2), d = rand(1.2, 2.4);
          const p = e.pos.clone().add(v3(Math.cos(a) * d, rand(-0.7, 0.7), Math.sin(a) * d));
          const life = rand(0.2, 0.35);
          m.fx._spawn(p, {
            color: Math.random() < 0.3 ? 0xffffff : 0x66b8ff, size: rand(0.1, 0.22), life,
            vel: v3((e.pos.x - p.x) / life, (e.pos.y - p.y) / life, (e.pos.z - p.z) / life)
          });
        }
        const t = this.other(e.caster);
        // attraction: drag the opponent toward the point (the sure-hit variant
        // from AML pulls regardless of state)
        if (!['knockdown', 'getup', 'ko'].includes(t.state)) {
          const d = e.pos.clone().sub(t.pos.clone().setY(e.pos.y));
          const dist = d.length();
          if (dist > 0.3) {
            d.normalize();
            const pull = clamp(22 - dist * 1.5, 8, 22);
            t.vel.x += d.x * pull * dt;
            t.vel.z += d.z * pull * dt;
          } else if (!e.dealt) {
            e.dealt = true;
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = t.applyHit({ dmg, kb: 0.5, kbY: 0, hitstun: 18, type: 'light', attacker: e.caster, isCT: true, sureHit: e.sure, dir: e.caster.forward(), src: 'ct2' }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, {});
          }
        }
        if (e.t <= 0) { if (e.fxNode) m.fx.release(e.fxNode); this.entities.splice(i, 1); }
      } else if (e.type === 'lungeHit') {
        e.frames--;
        const t = this.other(e.caster);
        if (!e.dealt && t.pos.distanceTo(e.caster.pos) < (e.radius ?? 1.5)) {
          e.dealt = true;
          const { dmg, crit } = computeDamage(e.caster, e.dmg);
          const r = t.applyHit({ dmg, kb: e.kb, kbY: e.heavy ? 2 : 0, hitstun: e.hitstun, type: e.heavy ? 'heavy' : 'light', attacker: e.caster, isCT: true, dir: e.caster.forward(), src: e.src }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { crit, heavy: e.heavy });
          if (r === 'hit' || r === 'otg') openBlackFlash(e.caster, dmg);
          if (e.clapRing) { // the clap shock closing the combo
            m.sfx.clap();
            m.fx._ring(e.caster.pos.clone().add(v3(0, 1.2, 0)), TODO_ACCENT, { size: 0.6, growRate: 12, life: 0.35, flat: false });
          }
        }
        if (e.frames <= 0) {
          // whiffed Manji Kick breaks the chain (Yuta's lunge has no chain)
          if (!e.dealt && e.caster.cfg.blackFlash) e.caster.bfChain = 0;
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'tojiBlitz') {
        // ---- ASSASSINATION, part 1: the blitz ------------------------------
        // The connect window travels with him. On contact he STOPS, the victim
        // is pinned, and the four-weapon sequence is queued. On a whiff the
        // entity simply expires and the move's own recovery is the punish.
        e.frames--;
        const c = e.caster;
        const t = this.other(c);
        if (!e.dealt && t.alive && inArc(c, t, e.reach, e.arc)) {
          e.dealt = true;
          const u = c.cfg.ultimate;
          c.vel.set(0, 0, 0);
          c.assassinPhase = 'sequence';
          c.setState('assassinate', { clip: u.clip });
          // hold the clip at its sequence section rather than restarting it
          c.anim.play(u.clip, { fade: 0.05, restart: true, offset: 0.24 });
          m.hud.cutin(c, 'ASSASSINATION', u.name + '  ' + u.jpName);
          m.sfx.cleave(true);
          m.cam.cinematic(c.pos, 1.2, 2.6, 1.5);
          m.hitstop(14);
          // queue one strike per weapon, each on its own beat
          for (const s of u.sequence) {
            this.entities.push({
              type: 'tojiSeqHit', caster: c, target: t, t: s.at * (u.hitFrames / 60),
              dmg: s.dmg, weapon: s.weapon, unblockable: !!s.unblockable, nullify: !!s.nullify,
              last: s === u.sequence[u.sequence.length - 1]
            });
          }
        }
        if (e.frames <= 0) {
          if (!e.dealt) e.caster.emit('assassinWhiff');
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'tojiSeqHit') {
        // ---- ASSASSINATION, part 2: one strike per weapon -------------------
        // The model's weapon prop is switched on each beat, so the sequence
        // genuinely draws every tool in the arsenal in turn rather than
        // reskinning one swing four times.
        e.t -= dt;
        if (e.t > 0) continue;
        const c = e.caster, t = e.target;
        c.weapon = e.weapon;                    // fighter._props follows this
        const { dmg, crit } = computeDamage(c, e.dmg, { canCrit: !e.last });
        const r = t.applyHit({
          dmg, kb: e.last ? 6.5 : 0.6, kbY: e.last ? 1.5 : 0,
          hitstun: e.last ? 36 : 20, type: e.last ? 'knockdown' : 'heavy',
          attacker: c, isCT: true, unblockable: e.unblockable,
          dir: c.forward(), src: 'ultimate'
        }, m.ctxFor(c));
        hitFeedback(m, c, t, r, { crit, heavy: e.last });
        m.cam.shake(e.last ? 0.7 : 0.22);
        // THE SPEAR IS LAST, AND IT STILL NULLIFIES. Landing Assassination on
        // somebody holding a domain takes the domain — which is the whole
        // reason the spear is the finisher rather than the opener.
        if (e.nullify && (r === 'hit' || r === 'armor')) {
          const res = m.domains.nullify(t, c);
          if (res.cancelled) { m.stage.flash(0.5); m.hud.techFlash(res.label, 0x6ea88a); }
          t.ctSealT = Math.max(t.ctSealT, 5);
        }
        if (e.last) {
          // and he ends the sequence back on the tool he started it with
          c.weapon = c.cfg.arsenal.default;
          m.hitstop(18);
        }
        this.entities.splice(i, 1);
      } else if (e.type === 'goldRush') {
        // HAKARI (Jackpot) — the charge. He keeps his speed for the whole
        // window, tears up whatever he passes through, and the connect is a
        // wallslam: the victim is driven along his heading into the geometry
        // rather than popped into the air where he stands.
        e.frames--;
        const c = e.caster;
        c.vel.x = e.dir.x * (c.cfg.jackpotKit?.special?.lungeSpeed ?? 26);
        c.vel.z = e.dir.z * (c.cfg.jackpotKit?.special?.lungeSpeed ?? 26);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          m.fx._spawn(c.pos.clone().add(v3(rand(-0.4, 0.4), rand(0.3, 1.9), rand(-0.4, 0.4))), {
            color: Math.random() < 0.35 ? 0xfff3c4 : 0xffc93c, size: rand(0.16, 0.42),
            life: 0.3, vel: e.dir.clone().multiplyScalar(-rand(3, 7)).add(v3(0, rand(0, 1.5), 0))
          });
        }
        m.arena?.destruct?.damageAt(c.pos.clone().setY(1.2), 2.2, e.slamPower * 0.35, { kind: 'body' });
        const tg = this.other(c);
        if (!e.dealt && tg?.alive && flatDist(tg.pos, c.pos) < e.radius) {
          e.dealt = true;
          const { dmg } = computeDamage(c, e.dmg, { canCrit: false });
          const r = tg.applyHit({
            dmg, kb: e.kb, kbY: e.kbY, hitstun: e.hitstun, type: 'knockdown',
            attacker: c, isCT: true, otgOk: true, dir: e.dir, src: 'punch'
          }, m.ctxFor(c));
          hitFeedback(m, c, tg, r, { heavy: true, knockdown: true });
          // the wallslam: the level takes the impact where the body lands
          const at = tg.pos.clone().addScaledVector(e.dir, 1.6).setY(1.3);
          m.arena?.destruct?.damageAt(at, 3.0, e.slamPower, { kind: 'body' });
          m.fx._ring(at, 0xffc93c, { size: 0.7, growRate: 18, life: 0.45, flat: false });
          m.sfx.slam();
          m.stage.flash(0.3);
          m.cam.shake(0.9);
          m.cam.fovKick(8);
          m.hitstop(14);
        }
        if (e.frames <= 0) this.entities.splice(i, 1);
      } else if (e.type === 'brotherhood') {
        // BROTHERHOOD: blink to a fresh angle around the target, strike,
        // repeat — the camera and the victim never get to settle
        e.t -= dt;
        if (e.t <= 0) {
          const t = this.other(e.caster);
          if (!t?.alive || !e.caster.alive) { this.entities.splice(i, 1); continue; }
          const ang = rand(0, Math.PI * 2);
          const from = e.caster.pos.clone();
          e.caster.pos.set(t.pos.x + Math.sin(ang) * 1.5, 0, t.pos.z + Math.cos(ang) * 1.5);
          e.caster.prevPos.copy(e.caster.pos);
          e.caster.facing = yawBetween(e.caster.pos, t.pos);
          e.caster.iFrames = Math.max(e.caster.iFrames, 12);
          m.fx.boogieSwap(from, e.caster.pos.clone(), TODO_ACCENT);
          m.sfx.clap();
          const last = --e.swings <= 0;
          const { dmg } = computeDamage(e.caster, last ? e.finDmg : e.hitDmg, { canCrit: false });
          const r = t.applyHit({
            dmg, kb: last ? 7 : 1.5, kbY: last ? 2 : 0, hitstun: last ? 40 : 18,
            type: last ? 'knockdown' : 'heavy', attacker: e.caster, isCT: true,
            otgOk: true, dir: e.caster.forward(), src: 'ultimate'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, t, r, { heavy: true, knockdown: last });
          m.cam.shake(last ? 1.0 : 0.35);
          if (last) {
            // the finishing blow gets the full camera treatment
            m.cam.cinematic(t.pos, 1.4, 3.4, 1.8);
            m.cam.fovKick(10);
            m.arena?.destruct?.damageAt(t.pos.clone().setY(1), 3.4, 90);
            m.stage.flash(0.5);
            m.hitstop(16);
            this.entities.splice(i, 1);
          } else {
            e.t = e.interval;
          }
        }
      } else if (e.type === 'yujiShock') {
        // Divergent Fist: the delayed shockwave — catches early buttons
        e.t -= dt;
        if (e.t <= 0) {
          const t = this.other(e.caster);
          if (t.alive && (e.sure || t.pos.distanceTo(e.caster.pos) < 3)) {
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = t.applyHit({
              dmg, kb: 3, kbY: 8, hitstun: 30, type: 'launcher', attacker: e.caster,
              isCT: true, sureHit: e.sure, otgOk: e.sure, dir: e.caster.forward(), src: 'punch'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { crit, heavy: true });
            if (r === 'hit' || r === 'otg') openBlackFlash(e.caster, dmg);
            // the late energy made visible: the same punch arriving again,
            // in cursed-energy crimson, erupting out of the body
            m.fx.ghostFistBurst(t.pos.clone().add(v3(0, 1.1, 0)), e.caster.forward());
            m.fx._ring(t.pos.clone().add(v3(0, 1.1, 0)), 0xffa04a, { size: 0.4, growRate: 9, life: 0.3, flat: false });
            m.cam.shake(0.4);
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'slashHit') {
        // in-domain sword swing: connection hands off to the domain system
        e.frames--;
        const t = this.other(e.caster);
        if (!e.dealt && t.alive && inArc(e.caster, t, e.reach, e.arc)) {
          e.dealt = true;
          m.domains.swordHit(e.caster);
        }
        if (e.frames <= 0) this.entities.splice(i, 1);
      } else if (e.type === 'execHit') {
        // EXECUTION's connect window. Whiffing is the whole skill check on
        // this move — it does NOT end the domain, it just costs him 40 frames
        // of recovery and whatever the opponent does with them. Connecting is
        // what commits him, and the domain system takes it from there.
        e.frames--;
        const t = this.other(e.caster);
        if (!e.dealt && t?.alive && inArc(e.caster, t, e.reach, e.arc)) {
          e.dealt = true;
          m.domains.executionHit(e.caster, t);
        }
        if (e.frames <= 0) {
          if (!e.dealt) m.hud.toast(e.caster, 'EXECUTION MISSED');
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'counterPunish') {
        e.t -= dt;
        if (e.t <= 0) {
          const d = e.def || {};
          if (e.caster.alive) {
            this.applyTechnique(e.caster, 'hakari_punish', {
              target: e.target, dmg: d.punishDmg ?? 34, reach: d.reach, arc: d.arc,
              kb: d.kb, kbY: d.kbY, hitstun: d.hitstun, slot: 'ct2'
            });
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'swordPayoff') {
        e.t -= dt;
        if (e.t <= 0) { this.applySwordTech(e.caster, e.entry); this.entities.splice(i, 1); }
      } else if (e.type === 'delayedHit') {
        // Divergent Fist: the cursed energy arrives late and launches
        e.t -= dt;
        if (e.t <= 0) {
          const t = this.other(e.caster);
          if (t.alive) {
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = t.applyHit({
              dmg, kb: 3, kbY: 8, hitstun: 30, type: 'launcher', attacker: e.caster,
              isCT: false, sureHit: true, unblockable: true, otgOk: true, dir: e.caster.forward(), src: 'domain'
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { heavy: true });
            m.fx._ring(t.pos.clone().add(v3(0, 1.2, 0)), e.color, { size: 0.5, growRate: 10, life: 0.35, flat: false });
            m.cam.shake(0.5);
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'bleed') {
        // Straw Doll resonance: chip damage over time, no reactions
        e.t -= dt;
        const t = this.other(e.caster);
        if (t.alive) {
          t.takeChip(e.dps * dt, 'dot');
          e.fxT = (e.fxT ?? 0) - dt;
          if (e.fxT <= 0) {
            e.fxT = 0.35;
            m.fx._spawn(t.pos.clone().add(v3(rand(-0.3, 0.3), rand(0.8, 1.4), rand(-0.3, 0.3))), {
              color: e.color, size: 0.12, life: 0.4, vel: v3(rand(-0.5, 0.5), -1.5, rand(-0.5, 0.5)), gravity: 3
            });
          }
        }
        if (e.t <= 0 || !t.alive) this.entities.splice(i, 1);
      } else if (e.type === 'shikigami') {
        // shadow beast streaking from caster to target, then the tackle
        e.t -= dt;
        const t = this.other(e.caster);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.03;
          const k = 1 - Math.max(0, e.t / 0.35);
          const p = e.caster.pos.clone().lerp(t.pos, k).setY(0.6 + Math.sin(k * Math.PI) * 0.5);
          m.fx._spawn(p, {
            color: Math.random() < 0.3 ? 0x181024 : e.color, size: rand(0.25, 0.55), life: 0.25,
            vel: v3(rand(-1, 1), rand(0, 1.5), rand(-1, 1))
          });
        }
        if (e.t <= 0) {
          if (t.alive) {
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = t.applyHit({
              dmg, kb: 4, kbY: 1.5, hitstun: 30, type: 'knockdown', attacker: e.caster,
              isCT: false, sureHit: true, unblockable: true, otgOk: true, dir: e.caster.forward()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, t, r, { heavy: true });
          }
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'rootSpikes') {
        // ---- HANAMI: ROOT ERUPTION --------------------------------------
        // The telegraph IS the move. A growing ring of green marks the spot
        // for most of a second before anything comes out of it, and on
        // natural ground that window is a third shorter — which is the whole
        // reason terrain is worth fighting over.
        e.t -= dt;
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.11;
          m.fx._ring(e.pos.clone().setY(e.pos.y + 0.05), e.natural ? 0x9ed86a : 0x6f9a52,
            { size: e.radius * 0.45, growRate: 2.4, life: 0.32 });
          m.fx._spawn(e.pos.clone().add(v3(rand(-0.6, 0.6), 0.08, rand(-0.6, 0.6))), {
            color: 0x7fc46a, size: rand(0.07, 0.15), life: 0.42, vel: v3(0, rand(1.2, 2.6), 0)
          });
        }
        if (e.t <= 0) {
          m.fx.rootBurst?.(e.pos, e.radius, e.natural);
          m.sfx.rootErupt?.();
          m.cam.shake(0.5);
          m.arena?.destruct?.damageAt(e.pos, e.radius + 1.0, 48, { kind: 'body' });
          m.arena?.splash?.(e.pos.x, e.pos.z, 1.2);
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            if (!e.sure && flatDist(f.pos, e.pos) > e.radius + 0.4) continue;
            if (Math.abs(f.pos.y - e.pos.y) > 2.2) continue;
            const { dmg, crit } = computeDamage(e.caster, e.dmg);
            const r = f.applyHit({
              dmg, kb: e.kb, kbY: e.kbY, hitstun: 32, type: 'launcher', attacker: e.caster,
              isCT: true, sureHit: e.sure, otgOk: true, src: 'ct1',
              dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { crit, heavy: true });
          }
          m.minions?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          // ...and Geto's curses, which stand in the same field as the transfigured
          // human and take area damage from exactly the same sources.
          m.curses?.hurtAt(e.pos, e.radius + 0.4, e.dmg, e.caster);
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'budSeed') {
        // the thrown seed. It travels, and on contact the parasite is planted
        // — everything that matters afterwards lives in combat/flora.js.
        e.life -= dt;
        e.pos.addScaledVector(e.vel, dt);
        e.fxT -= dt;
        if (e.fxT <= 0) {
          e.fxT = 0.04;
          m.fx._spawn(e.pos.clone(), {
            color: Math.random() < 0.5 ? 0x7fc46a : 0xe8bcc6, size: rand(0.06, 0.13),
            life: 0.25, vel: v3(rand(-0.4, 0.4), rand(-0.2, 0.6), rand(-0.4, 0.4))
          });
        }
        const tg = this.other(e.caster);
        if (tg?.alive && !e.dealt && e.pos.distanceTo(tg.pos.clone().add(v3(0, 1.2, 0))) < 0.9) {
          e.dealt = true;
          const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
          const r = tg.applyHit({
            dmg, kb: 0.4, kbY: 0, hitstun: 12, type: 'light', attacker: e.caster,
            isCT: true, sureHit: e.sure, dir: e.caster.forward(), src: 'ct2'
          }, m.ctxFor(e.caster));
          hitFeedback(m, e.caster, tg, r, {});
          if (r !== 'iframe' && r !== 'blocked' && r !== 'whiff') {
            m.flora.plantBud(e.caster, tg, e.def);
          }
          this.entities.splice(i, 1);
          continue;
        }
        if (e.life <= 0) { m.sfx.whiff(); this.entities.splice(i, 1); }
      } else if (e.type === 'woodenBall') {
        // ---- HANAMI: WOODEN BALL ----------------------------------------
        // The kill attempt and the terrain play, in that order. The impact
        // hits hard in a wide radius; the SHATTER converts a large patch of
        // the map to natural ground for the rest of the round, and that half
        // lands whether or not the damage did.
        e.t -= dt;
        if (e.node) m.fx.woodenBallFall?.(e.node, 1 - Math.max(0, e.t / (e.def.dropDelay ?? 0.55)));
        if (e.t <= 0) {
          const u = e.def;
          if (e.node) m.fx.release(e.node);
          m.fx.rootBurst?.(e.pos, u.radius, true);
          m.sfx.woodImpact?.();
          m.cam.shake(1.1); m.cam.fovKick(10);
          m.stage.flash(0.5);
          m.hitstop(16);
          m.arena?.destruct?.damageAt(e.pos.clone().setY(e.pos.y + 1), u.radius + 2, 140, { kind: 'body' });
          for (const f of m.activeFighters) {
            if (f === e.caster || !f.alive) continue;
            if (flatDist(f.pos, e.pos) > u.radius) continue;
            const { dmg } = computeDamage(e.caster, e.dmg, { canCrit: false });
            const r = f.applyHit({
              dmg, kb: u.kb ?? 7, kbY: u.kbY ?? 4, hitstun: u.hitstun ?? 42, type: 'knockdown',
              attacker: e.caster, isCT: true, otgOk: true, src: 'ultimate',
              dir: v3(f.pos.x - e.pos.x, 0, f.pos.z - e.pos.z).normalize()
            }, m.ctxFor(e.caster));
            hitFeedback(m, e.caster, f, r, { heavy: true, knockdown: true });
          }
          // the spikes the canon ball sprouts on impact
          for (let k = 0; k < (u.spikes ?? 18); k++) {
            const a = (k / (u.spikes ?? 18)) * Math.PI * 2;
            m.fx._spawn(e.pos.clone().add(v3(Math.sin(a) * u.radius * 0.5, 0.2, Math.cos(a) * u.radius * 0.5)), {
              color: 0x6a4f34, size: rand(0.2, 0.4), aspect: 0.3, life: 0.6,
              vel: v3(Math.sin(a) * 4, rand(4, 8), Math.cos(a) * 4), gravity: 9
            });
          }
          // AND THE GROUND. This is the half that makes the ultimate a
          // terrain play rather than just a big number.
          m.flora.plantField(e.caster, {
            x: e.pos.x, y: e.pos.y, z: e.pos.z,
            radius: u.field.radius, duration: u.field.duration,
            hp: 9999, permanent: !!u.field.permanent
          });
          m.hud.techFlash('木の鞠 — THE GROUND IS HIS NOW', 0x9ec46a);
          this.entities.splice(i, 1);
        }
      } else if (e.type === 'corrode') {
        // the spray's lingering burn. `dot` so Mahoraga's BURN & BLEED
        // adaptation covers it exactly as it covers Jogo's fire.
        e.t -= dt;
        if (e.target.alive) {
          e.target.takeChip(e.dps * dt, 'dot');
          e.fxT -= dt;
          if (e.fxT <= 0) {
            e.fxT = 0.22;
            m.fx._spawn(e.target.pos.clone().add(v3(rand(-0.3, 0.3), rand(0.6, 1.5), rand(-0.3, 0.3))), {
              color: Math.random() < 0.4 ? 0xf0c94a : 0xd8a02a, size: rand(0.08, 0.16),
              life: 0.5, vel: v3(rand(-0.3, 0.3), -1.4, rand(-0.3, 0.3)), gravity: 3
            });
          }
        }
        if (e.t <= 0 || !e.target.alive) this.entities.splice(i, 1);
      } else if (e.type === 'devourHold') {
        // ---- KUROURUSHI: DEVOUR, the bite -------------------------------
        // The victim is held for the whole hold, then it lands all at once and
        // they are dropped. He heals for a portion and takes the Gluttony.
        e.frames--;
        const c = e.caster, t = e.target;
        // keep them in his maw while it runs
        t.pos.copy(c.pos).addScaledVector(c.forward(), 1.0);
        t.pos.y = c.pos.y;
        t.prevPos.copy(t.pos);
        t.vel.set(0, 0, 0);
        if (e.frames === 6) {
          const { dmg } = computeDamage(c, e.sp.dmg, { canCrit: false });
          const r = t.applyHit({
            dmg, kb: 4.0, kbY: 0, hitstun: 40, type: 'knockdown', attacker: c,
            isCT: true, unblockable: true, otgOk: true, dir: c.forward(), src: 'throw'
          }, m.ctxFor(c));
          hitFeedback(m, c, t, r, { heavy: true, knockdown: true });
          // `maxHP` already IS `cfg.stats.hp + growthHpBonus` for him, and it
          // is the ACTIVE CORE's pool for Panda — one getter instead of a sum
          // that only knew about one of the two health systems.
          c.res.hp = Math.min(c.maxHP, c.res.hp + dmg * (e.sp.healFrac ?? 0.45));
          m.swarms.feed(c, c.cfg.gluttony.perDevour);
          m.sfx.slam();
          m.cam.shake(0.8);
          m.stage.flash(0.3);
          m.hitstop(14);
        }
        if (e.frames <= 0) {
          c.model.setMaw?.(0);
          if (t.state === 'devoured') t.setState('knockdown', { clip: 'knockdown' });
          this.entities.splice(i, 1);
        }
      }
    }
  }

  clear() {
    for (const e of this.entities) {
      if (e.fxNode) this.match.fx.release(e.fxNode);
      // a nail wiped by a round boundary was never spent, so give the count
      // back — Fighter.resetForRound zeroes it too, but a mid-match clear that
      // does not reset fighters must not strand the cap
      if (e.type === 'nail' && e.caster) e.caster.nailCount = Math.max(0, e.caster.nailCount - 1);
    }
    this.entities.length = 0;
  }
}
