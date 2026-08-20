// HUD: health with damage lag, the two-layer Cursed Energy bar (MAX_CE as the
// bar's filled length, CURRENT_CE as the inner fill), stamina, badges,
// domain timer + barrier integrity, combo counters, cut-ins, toasts.
//
// Kashimo's CHARGE row and Panda's THREE-CORE strip are the two per-character
// rows added most recently; both follow the house rule that a second resource
// is built ONCE in `setFighters` and only has widths and classes touched per
// frame. The tier table is imported rather than duplicated so the bar, the
// model and the frame data can never disagree about what tier he is in.
import { TIERS as CHARGE_TIERS, TIER_AT as CHARGE_TIER_AT } from '../combat/charge.js';
// INUMAKI'S THROAT. Same discipline as the charge tiers above: the table is
// imported rather than duplicated, so the bar, the model, the frame data and
// the animation set can never disagree about which tier he is in.
import {
  TIERS as THROAT_TIERS, TIER_AT as THROAT_TIER_AT,
  resistBand, RESIST_BANDS
} from '../combat/speech.js';

export class HUD {
  constructor(root) {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-top"></div>
      <div class="domain-status">
        <div class="dname"></div>
        <div class="bar bar-time"><div class="fill"></div></div>
        <div class="dlabel">DOMAIN</div>
        <div class="bar bar-integrity"><div class="fill"></div></div>
        <div class="dlabel">BARRIER INTEGRITY</div>
      </div>
      <div class="clash-status">
        <div class="cname">DOMAIN CLASH</div>
        <div class="bar bar-clash"><div class="fill"></div></div>
        <div class="dlabel">LEAST DAMAGE TAKEN WINS</div>
        <div class="clash-tally">
          <span class="ca"><b></b><i>0</i></span>
          <span class="cvs">vs</span>
          <span class="cb"><b></b><i>0</i></span>
        </div>
      </div>
      <div class="tf-status">
        <div class="tf-title">遍殺 IDLE TRANSFIGURATION</div>
        <div class="tf-rows"></div>
        <div class="dlabel">EMPTY = TRANSFIGURED · RUN TO STOP THE DRAIN</div>
      </div>
      <div class="shadow-status">
        <div class="tf-title">嵌合暗翳庭 CHIMERA SHADOW GARDEN</div>
        <div class="sh-rows"></div>
        <div class="dlabel">LEAVE THE SHADOW · HEAVY ATTACKS PUSH IT BACK</div>
      </div>
      <div class="shrine-status">
        <div class="tf-title">伏魔御廚子 MALEVOLENT SHRINE</div>
        <div class="sr-rows"></div>
        <div class="dlabel">NO BARRIER · RUN OUT OF THE RADIUS · SIMPLE DOMAIN HOLDS IT</div>
      </div>
      <div class="shiki-wheel">
        <div class="sw-ring"></div>
        <div class="sw-center"><b></b><small></small></div>
      </div>
      <div class="arsenal-wheel">
        <div class="aw-ring"></div>
        <div class="aw-center"><b>格納型呪霊</b><small></small></div>
      </div>
      <div class="adapt-status">
        <div class="tf-title">適応 ADAPTATION</div>
        <div class="ad-next"><div class="fill"></div></div>
        <div class="ad-rows"></div>
        <div class="dlabel">HE ADAPTS TO WHAT YOU KEEP USING · CHANGE YOUR TOOL</div>
      </div>
      <div class="adapt-callout">
        <div class="ac-lead">適応 — ADAPTED</div>
        <div class="ac-name"></div>
        <div class="ac-pct"><b></b><i></i></div>
      </div>
      <div class="ritual-prompt">
        <b>B</b><span>SUMMON RITUAL — 魔虚羅</span>
      </div>
      <div class="reach-bleed"></div>
      <div class="pachi">
        <div class="pachi-head"><b>私恋</b><span>IDLE DEATH GAMBLE</span></div>
        <div class="pachi-screen">
          <div class="pachi-tier"></div>
          <div class="pachi-reels"><i></i><i></i><i></i></div>
          <div class="pachi-result"></div>
        </div>
        <div class="pachi-meta">
          <div class="pachi-ct"><em>NEXT REACH</em><span></span></div>
          <div class="pachi-fails"><em>MISSES</em><div class="pf-pips"></div></div>
        </div>
      </div>
      <div class="jackpot-bar">
        <div class="jb-lead">大当り JACKPOT</div>
        <div class="jb-clock"></div>
        <div class="bar bar-jp"><div class="fill"></div></div>
        <div class="dlabel">REVERSE CURSED TECHNIQUE · INFINITE CURSED ENERGY</div>
      </div>
      <div class="combo cl"><span class="num"></span> <small>HITS</small></div>
      <div class="combo cr"><span class="num"></span> <small>HITS</small></div>
      <div class="split-tag s1">PLAYER 1</div>
      <div class="split-tag s2">PLAYER 2</div>
      <div class="split-tag s3">PLAYER 3</div>
      <div class="split-tag s4">PLAYER 4</div>
      <div class="msg-center"></div>
      <div class="cutin"><div class="c-who"></div><div class="c-name"></div></div>
      <div class="trial">
        <div class="trial-title">開廷 &mdash; ENTER YOUR PLEA</div>
        <div class="trial-reads"></div>
        <div class="trial-grid"></div>
        <div class="trial-clock"><div class="fill"></div></div>
        <div class="trial-foot"></div>
      </div>
      <div class="duel">
        <div class="duel-title">死刑執行 &mdash; EXECUTION</div>
        <div class="duel-grid">
          <div class="duel-side duel-him">
            <div class="ds-who"></div>
            <div class="duel-seq"></div>
            <div class="ds-note">INPUT THE SEQUENCE</div>
          </div>
          <div class="duel-side duel-them">
            <div class="ds-who"></div>
            <div class="duel-mash"><b></b><span>MASH</span></div>
            <div class="ds-note">EVERY PRESS TAKES HIS TIME</div>
          </div>
        </div>
        <div class="duel-clock"><div class="fill"></div><div class="duel-time"></div></div>
        <div class="duel-foot"></div>
      </div>
      <!-- THE SET. A title card that comes and goes, a thin run band that
           only exists while a scene is live, and three lamps. See _theset
           for why this is deliberately small. -->
      <div class="tset">
        <div class="ts-card">
          <div class="ts-tier"></div>
          <div class="ts-name"></div>
          <div class="ts-jp"></div>
          <div class="ts-blurb"></div>
        </div>
        <div class="ts-run">
          <span class="ts-lab">EXIT</span>
          <div class="ts-prog"><div class="fill"></div><i class="ts-goal"></i></div>
          <span class="ts-clock"></span>
        </div>
        <div class="ts-score"></div>
      </div>
      <div class="crawl"></div>
      <div class="blackout"></div>
      <div class="flash"></div>
      <div class="hint-bar">START/TAB: controls &nbsp; F3: debug &nbsp; F4: quality</div>`;
    root.appendChild(this.el);
    this.q = s => this.el.querySelector(s);
    this.combos = [this.q('.combo.cl'), this.q('.combo.cr')];
    this.plates = [];
    this.fighters = [];
    this.msgT = 0;
    this.cutinT = 0;
    this.toasts = new Map();
    this.adaptOf = null;      // the fighter whose adaptation list is shown
    this.adaptT = 0;          // callout timer
    this.promptT = 0;
    this.blackT = 0;      // the execution's hard cut to black
    this._duelKey = null;
  }

  // ---- MAHORAGA: ADAPTATION ------------------------------------------------
  // The list is PERSISTENT and visible to BOTH players — the opponent has to
  // be able to see, at a glance, which of their tools has been taken off them
  // and by how much. Pass null to clear it (he left the field).
  setAdaptation(fighter) {
    this.adaptOf = fighter && fighter.adapt ? fighter : null;
    this.q('.adapt-status').classList.toggle('on', !!this.adaptOf);
    if (!this.adaptOf) {
      this.q('.ad-rows').innerHTML = '';
      this._adaptKey = null;
    }
  }

  // The styled announcement: exactly what was adapted and exactly by how much.
  adaptCallout(fighter, r) {
    const c = this.q('.adapt-callout');
    c.querySelector('.ac-name').textContent = r.label + '  ' + (r.jp || '');
    c.querySelector('.ac-pct b').textContent = Math.round(r.total * 100) + '%';
    c.querySelector('.ac-pct i').textContent =
      (r.stacks > 1 ? 'STACK ' + r.stacks + '  ' : '') + '+' + Math.round(r.gained * 100) + '%'
      + (r.capped ? '  ·  CAPPED' : '');
    c.classList.toggle('capped', !!r.capped);
    c.classList.remove('on');
    void c.offsetWidth;
    c.classList.add('on');
    this.adaptT = 2.6;
  }

  // MEGUMI: the one-time hint that the ritual input exists, shown during the
  // domain cast window it actually works in.
  ritualPrompt(dur = 2.0) {
    this.q('.ritual-prompt').classList.add('on');
    this.promptT = dur;
  }

  // One plate per fighter, built to fit however many are in the match: two
  // sit at the outer corners as always, three or four pack in and go compact.
  setFighters(fighters) {
    const list = Array.isArray(fighters) ? fighters : [...arguments];
    const top = this.q('.hud-top');
    top.innerHTML = '';
    top.classList.toggle('crowded', list.length > 2);
    this.plates = list.map((f, i) => {
      const plate = document.createElement('div');
      plate.className = 'plate p' + (i + 1);
      plate.innerHTML = `
        <div class="name"><span class="n"></span><span class="title"></span><span class="lives"></span></div>
        <div class="bar bar-hp"><div class="lag"></div><div class="fill"></div></div>
        <div class="bar bar-ce"><div class="maxfill"></div><div class="fill"></div></div>
        <div class="bar bar-st"><div class="fill"></div></div>
        <div class="badge-row">
          <span class="badge b-charged hot">MAX CE</span>
          <span class="badge b-copy">COPY</span>
          <span class="badge b-overtime hot">OVERTIME</span>
          <span class="badge b-backlash">BACKLASH</span>
          <span class="badge b-mark hot">7:3</span>
          <span class="badge b-resolve hot">RESOLVE</span>
          <span class="badge b-sukuna hot">SUKUNA</span>
          <span class="badge b-redscale hot">赤鱗 RED SCALE</span>
          <span class="badge b-bf hot">BF</span>
          <span class="badge b-burn hot">BURN</span>
          <span class="badge b-soulwound">SOUL WOUND</span>
          <span class="badge b-locked">SEIZED</span>
          <span class="badge b-frozen">FROZEN</span>
          <span class="badge b-stance hot">投射 ARMED</span>
          <span class="badge b-maxproj hot">極 MAX PROJECTION</span>
          <span class="badge b-toast"></span>
        </div>
        <div class="ev-row">
          <span class="ev-key">証拠 EVIDENCE</span>
          <div class="bar bar-ev"><div class="fill"></div><i class="ev-gate"></i></div>
          <span class="ev-num"></span>
        </div>
        <div class="fg-row">
          <span class="fg-key">指</span>
          <span class="fg-pips"></span>
          <span class="fg-unlock"></span>
        </div>
        <div class="sp-row">
          <div class="sp-slot"><div class="sp-cd"></div><span class="sp-key">SP</span><span class="sp-name"></span></div>
        </div>
        <div class="ars-row">
          <div class="ars-slots"></div>
          <div class="ars-ass"><em>術師殺し</em><i></i></div>
        </div>
        <div class="terr-row">
          <span class="terr-jp"></span>
          <span class="terr-name"></span>
          <span class="terr-rate"></span>
        </div>
        <div class="chg-row">
          <span class="chg-key">帯電</span>
          <div class="bar bar-chg"><div class="fill"></div><div class="chg-ticks"></div></div>
          <span class="chg-tier"></span>
        </div>
        <div class="core-row">
          <span class="core-key">呪骸核</span>
          <div class="core-segs"></div>
        </div>
        <div class="thr-row">
          <span class="thr-key">喉</span>
          <div class="bar bar-thr"><div class="fill"></div><div class="thr-ticks"></div></div>
          <span class="thr-tier"></span>
        </div>
        <div class="res-row">
          <span class="rs-key">抗</span>
          <div class="rs-pips"><i></i><i></i><i></i><i></i></div>
          <span class="rs-band"></span>
        </div>
        <div class="glut-row">
          <span class="gl-key">暴食</span>
          <div class="bar bar-gl"><div class="fill"></div><div class="gl-ticks"></div></div>
          <span class="gl-stage"></span>
        </div>
        <div class="bud-row">
          <span class="bud-key">呪詛の芽</span>
          <div class="bar bar-bud"><div class="fill"></div></div>
          <span class="bud-cleanse"></span>
        </div>
        <div class="awk-row">
          <span class="awk-key">天与</span>
          <div class="bar bar-awk"><div class="fill"></div><div class="awk-ticks"></div></div>
          <span class="awk-stage"></span>
        </div>
        <div class="mass-row">
          <span class="ms-key">質量</span>
          <div class="bar bar-ms"><div class="fill"></div><div class="ms-armor"></div></div>
          <span class="ms-num"></span>
        </div>
        <div class="sd-row">
          <span class="sd-key">簡易領域</span>
          <div class="bar bar-sd"><div class="fill"></div></div>
          <span class="sd-state"></span>
        </div>
        <div class="blood-row">
          <span class="bl-key">血</span>
          <div class="bar bar-bl"><div class="fill"></div></div>
          <span class="bl-num"></span>
        </div>
        <div class="ess-row">
          <span class="es-key">依代</span>
          <div class="bar bar-es"><div class="fill"></div><div class="es-min"></div></div>
          <span class="es-num"></span>
        </div>
        <div class="ratio-bar"><div class="rb-red"></div><div class="rb-marker"></div></div>
        <!-- YAGA. Two rows, and the split is the mechanic: the METER is the
             work in progress and the STRIP is what is already standing. The
             meter carries a tick per quality tier so both players can see
             which one the next release would produce. -->
        <div class="build-row">
          <span class="bd-key">呪骸製作</span>
          <div class="bar bar-bd"><div class="fill"></div><div class="bd-ticks"></div></div>
          <span class="bd-tier"></span>
        </div>
        <div class="corpse-row"></div>
        <!-- TAKABA. One row, three tiers, and the tier NAME is the readout —
             the number matters far less than whether the room is with him. -->
        <div class="comedy-row">
          <span class="cm-key">笑</span>
          <div class="bar bar-cm"><div class="fill"></div><div class="cm-ticks"></div></div>
          <span class="cm-tier"></span>
        </div>
        <div class="shiki-row">
          <div class="shiki-slot s1"><div class="ss-cd"></div><span class="ss-key">RB</span><span class="ss-name"></span></div>
          <div class="shiki-slot s2"><div class="ss-cd"></div><span class="ss-key">RT</span><span class="ss-name"></span></div>
          <div class="shiki-lost"></div>
        </div>
        <div class="stable-row">
          <span class="st-key">呪霊</span>
          <div class="st-icons"></div>
        </div>
        <div class="uzu-row">
          <span class="uz-key">極ノ番</span>
          <div class="bar bar-uz"><div class="fill"></div></div>
          <span class="uz-num"></span>
        </div>`;
      plate.querySelector('.n').textContent = f.cfg.name;
      plate.querySelector('.title').textContent = list.length > 2 ? 'P' + (i + 1) : f.cfg.title;
      // special slot: hidden entirely for a fighter without one; the red line
      // of Nanami's timing bar sits at his configured 7:3 mark
      const sp = f.cfg.special;
      plate.querySelector('.sp-row').style.display = sp ? '' : 'none';
      if (sp?.mark != null) plate.querySelector('.rb-red').style.left = (sp.mark * 100) + '%';
      // the shikigami row only exists for a summoner
      plate.querySelector('.shiki-row').style.display = f.cfg.shikigami ? '' : 'none';
      // ---- GETO: THE STABLE AND THE UZUMAKI PROJECTION -------------------
      // Both rows exist only on a plate whose config declares a stable, and
      // both are readable by BOTH players — which for these two is not a
      // nicety, it is the mechanic. The whole character is a visible tension
      // between "keep them alive" and "spend them", and the OPPONENT is the
      // one making the decision that resolves it: every curse they kill is
      // damage taken off the ultimate that is pointed at them. If they cannot
      // see the number going down, killing curses is not a decision.
      const stRow = plate.querySelector('.stable-row');
      const uzRow = plate.querySelector('.uzu-row');
      stRow.style.display = f.cfg.curses ? '' : 'none';
      uzRow.style.display = f.cfg.curses ? '' : 'none';
      if (f.cfg.curses) {
        // built ONCE, here, and only classes change per frame — the same
        // discipline the shikigami wheel and the arsenal already keep, because
        // a strip that rebuilds its DOM every frame eats the budget it exists
        // to report on
        stRow.querySelector('.st-icons').innerHTML = f.cfg.curses.stable.map(k => {
          const d = f.cfg.curses.defs[k];
          return `<i class="st-i${d.specialGrade ? ' sg' : ''}" data-k="${k}"><b>${d.short}</b></i>`;
        }).join('');
      }
      // ...and the Finger row only for a fighter who has fingers to eat
      plate.querySelector('.fg-row').style.display = f.cfg.fingers ? '' : 'none';
      // ---- KASHIMO: CHARGE -------------------------------------------------
      // Built ONCE here, like the stable and the gluttony ticks, and only
      // widths and classes change per frame. Visible to BOTH players and that
      // is not a nicety: his damage, his speed and his range are all this
      // number, so an opponent who cannot see it cannot know whether walking
      // into him right now is safe. The tier ticks are the important part — a
      // player has to be able to see how close the next tier is without doing
      // arithmetic, exactly as with Kurourushi's growth thresholds.
      const chgRow = plate.querySelector('.chg-row');
      chgRow.style.display = f.cfg.charge ? '' : 'none';
      if (f.cfg.charge) {
        chgRow.querySelector('.chg-ticks').innerHTML = CHARGE_TIER_AT.slice(1)
          .map(t => `<i style="left:${(t * 100).toFixed(1)}%"></i>`).join('');
      }
      // ---- PANDA: THE THREE CORES ------------------------------------------
      // A STANCE STRIP, not three health bars. The cores share one pool now
      // (see combat/cores.js), so the ordinary `bar-hp` above already tells
      // the whole health story and three segments draining in lockstep would
      // say the same thing three times. What the strip is for is the thing the
      // bar cannot show: WHICH of his three fighters is on the field, which is
      // what both players actually need to read off him.
      //
      // Equal thirds, because the pools are no longer different sizes. The
      // pre-shared build weighted the widths by each core's maximum; that is
      // kept below for any config that still declares separate pools.
      const coreRow = plate.querySelector('.core-row');
      coreRow.style.display = f.cores ? '' : 'none';
      if (f.cores) {
        const shared = !!f.cfg.cores?.shared;
        const total = f.cores.reduce((a, c) => a + c.max, 0);
        coreRow.querySelector('.core-segs').innerHTML = f.cores.map(c =>
          `<div class="core-seg" data-k="${c.key}" style="flex:${shared ? '1' : (c.max / total).toFixed(4)}">
             <div class="cs-fill"></div><b>${c.short}</b>
           </div>`).join('');
      }
      // ---- INUMAKI: THE THROAT --------------------------------------------
      // Built ONCE here like the charge ticks and the stable strip, and only
      // widths and classes touched per frame. The tick marks matter more on
      // this bar than on any other in the game: SILENCED is a crisis, and a
      // player has to be able to see how close it is without arithmetic. The
      // last tick is drawn heavier (`crit`) because it is the only one that
      // removes his kit rather than weakening it.
      const thrRow = plate.querySelector('.thr-row');
      thrRow.style.display = f.cfg.throat ? '' : 'none';
      if (f.cfg.throat) {
        thrRow.querySelector('.thr-ticks').innerHTML = THROAT_TIER_AT.slice(1)
          .map((t, i) => `<i class="${i === THROAT_TIER_AT.length - 2 ? 'crit' : ''}" style="left:${(t * 100).toFixed(1)}%"></i>`)
          .join('');
      }
      // ---- COMMAND RESISTANCE ---------------------------------------------
      // Shown on EVERYBODY's plate, and it is the target's number rather than
      // their owner's: it says how well THIS fighter shrugs off cursed speech.
      // Hidden unless somebody in the match actually has a voice — a
      // resistance readout in a fight with no Inumaki in it is noise.
      // Deliberately visible to both players, for the same reason Geto's
      // Uzumaki projection is: the opponent's meter growth is the counterplay,
      // and a counterplay you cannot see is not one.
      plate.querySelector('.res-row').style.display = 'none';
      // TERRAIN, for the one character whose strength depends on it. Visible
      // to BOTH players: the opponent needs to know when Hanami is standing on
      // something that is healing him, because moving him off it is the whole
      // counterplay.
      plate.querySelector('.terr-row').style.display = f.cfg.flora ? '' : 'none';
      // GLUTTONY, likewise: the opponent is the one who needs to see how close
      // the next growth stage is.
      const glRow = plate.querySelector('.glut-row');
      glRow.style.display = f.cfg.gluttony ? '' : 'none';
      if (f.cfg.gluttony) {
        const g = f.cfg.gluttony;
        glRow.querySelector('.gl-ticks').innerHTML = g.thresholds
          .map(t => `<i style="left:${(t / g.max) * 100}%"></i>`).join('');
      }
      // the CURSED BUD row appears on the VICTIM's plate, only while one is on
      // them — it is their clock and their counterplay counter
      plate.querySelector('.bud-row').style.display = 'none';
      // ---- THE TWO NEW SECOND RESOURCES ---------------------------------
      // Same discipline as GLUTTONY and EVIDENCE: present only on a plate
      // whose config declares one, and readable by BOTH players because both
      // plates are on screen. Essence in particular is information the
      // OPPONENT needs more than Nobara does — it is how much of themselves
      // she is currently holding, and it is the number that decides whether
      // disengaging is safe.
      // ---- MAKI: THE AWAKENING METER --------------------------------------
      // Built ONCE here like the charge ticks and the throat tiers, and only
      // widths and classes touched per frame. The ticks matter more on this
      // bar than on any other in the game, because the LAST one is also the
      // ultimate gate: she has no cursed energy and therefore no MAX CE badge
      // to light, so this bar reaching the end is the only "your ultimate is
      // ready" signal she has. It is drawn heavier (`ult`) for exactly that
      // reason — the player should be chasing it all round.
      //
      // Visible to BOTH players, like every other second resource here: her
      // stage is the opponent's most important piece of information and a
      // counterplay you cannot see is not one.
      const awkRow = plate.querySelector('.awk-row');
      awkRow.style.display = f.cfg.awakening ? '' : 'none';
      if (f.cfg.awakening) {
        const a = f.cfg.awakening;
        awkRow.querySelector('.awk-ticks').innerHTML = a.thresholds
          .map((t, i) => `<i class="${i === a.thresholds.length - 1 ? 'ult' : ''}" style="left:${(t / a.max * 100).toFixed(1)}%"></i>`)
          .join('');
      }
      // ---- YUKI: THE MASS METER -------------------------------------------
      // One tick, and it is the ARMOUR THRESHOLD — the single number that
      // decides whether she is currently the immovable object. Both players
      // need it: hers to know when to walk in, theirs to know when hitting her
      // stops working.
      const msRow = plate.querySelector('.mass-row');
      msRow.style.display = f.cfg.mass ? '' : 'none';
      if (f.cfg.mass) {
        msRow.querySelector('.ms-armor').style.left = (f.cfg.mass.armorAt / f.cfg.mass.max * 100) + '%';
      }
      // ---- MIWA: THE CIRCLE'S CLOCK ---------------------------------------
      // Shown only while a circle is up or cooling. It is a STAMINA readout
      // rather than a resource of its own, and that is the point: the honest
      // question for both players is "how much longer can she hold this", and
      // the answer is her stamina bar filtered through the drain rate.
      plate.querySelector('.sd-row').style.display = f.cfg.simpleDomainZone ? '' : 'none';
      plate.querySelector('.blood-row').style.display = f.cfg.blood ? '' : 'none';
      const esRow = plate.querySelector('.ess-row');
      esRow.style.display = f.cfg.essence ? '' : 'none';
      if (f.cfg.essence) {
        // the tick showing where Resonance becomes castable at all
        const minE = f.cfg.ct2?.minEssence ?? 0;
        esRow.querySelector('.es-min').style.left = (minE / f.cfg.essence.max * 100) + '%';
      }
      // ---- HEAVENLY RESTRICTION: the bar is REMOVED, not emptied ----------
      // The brief is explicit that an empty bar is the wrong answer, and it is
      // right: an empty bar reads as "he has none right now", which invites a
      // player to wait for it to fill. A missing one reads as "he does not have
      // this", which is the truth. The MAX CE badge goes with it — it can never
      // light for him — and the arsenal row takes the space.
      const noCE = !!f.cfg.noCursedEnergy;
      plate.classList.toggle('no-ce', noCE);
      if (noCE) {
        plate.querySelector('.bar-ce').remove();
        plate.querySelector('.b-charged').remove();
      }
      // The arsenal row is the inverse: present ONLY for a fighter who has one.
      const ars = plate.querySelector('.ars-row');
      ars.style.display = f.cfg.arsenal ? '' : 'none';
      if (f.cfg.arsenal) {
        ars.querySelector('.ars-slots').innerHTML = f.cfg.arsenal.order.map(k => {
          const w = f.cfg.arsenal.weapons[k];
          return `<span class="ars-slot" data-k="${k}"><b>${w.short}</b><i>${w.jp}</i></span>`;
        }).join('');
      }
      top.appendChild(plate);
      return plate;
    });
    this.fighters = list;
  }

  // n = number of local views (0 or 1 = no tags)
  setSplit(n) {
    const count = n === true ? 2 : (n || 0);
    for (let i = 1; i <= 4; i++) {
      const tag = this.el.querySelector('.split-tag.s' + i);
      if (!tag) continue;
      tag.classList.toggle('on', count >= 2 && i <= count);
      tag.textContent = 'PLAYER ' + i;
      tag.classList.remove('dead');
    }
    // three views get their own layout (two up, one wide below) — no dead cell
    this.el.classList.toggle('tri-view', count === 3);
    this.el.classList.toggle('grid-view', count >= 3);
  }

  // append DOWN / SPECTATING to a cell's player tag
  setSeatStatus(i, status) {
    const tag = this.el.querySelector('.split-tag.s' + (i + 1));
    if (!tag) return;
    const want = 'PLAYER ' + (i + 1) + (status ? ' — ' + status : '');
    if (tag.textContent !== want) tag.textContent = want;
    tag.classList.toggle('dead', !!status);
  }

  // ---- MEGUMI: the shikigami wheel ----------------------------------------
  // Built once per open, then only the focus classes change — a radial that
  // rebuilds its DOM every frame is the kind of thing that eats the frame
  // budget it is supposed to be showing you.
  setWheel(fighter, snapshot, wheel) {
    const el = this.q('.shiki-wheel');
    if (!fighter || !snapshot || !wheel) { el.classList.remove('on'); this._wheelKey = null; return; }
    el.classList.add('on');
    const ring = el.querySelector('.sw-ring');
    const key = snapshot.length + ':' + fighter.cfg.id;
    if (this._wheelKey !== key) {
      this._wheelKey = key;
      // THE RING GREW. Megumi went from six entries to thirteen, so the radius
      // is scaled by count — thirteen sectors at the six-entry radius overlap
      // into an unreadable smear. Fusions get a marker class so they read as a
      // different KIND of entry before anything is selected.
      const R = snapshot.length > 8 ? 41 : 37;
      ring.innerHTML = snapshot.map((s, i) => {
        const a = (i / snapshot.length) * Math.PI * 2;
        const x = 50 + Math.sin(a) * R, y = 50 - Math.cos(a) * R;
        const cls = 'sw-opt'
          + (s.fusion ? ' fusion' : '')
          + (s.ritualOnly ? ' ritual' : '')
          + (snapshot.length > 8 ? ' dense' : '');
        return `<div class="${cls}" style="left:${x}%;top:${y}%">
          <b>${s.def.short}</b><i>${s.def.jp}</i><u>${s.ritualOnly ? '儀' : s.def.cost}</u></div>`;
      }).join('');
    }
    const opts = [...ring.querySelectorAll('.sw-opt')];
    snapshot.forEach((s, i) => {
      const o = opts[i];
      if (!o) return;
      o.classList.toggle('focus', i === wheel.sel);
      o.classList.toggle('lost', s.lost);
      // BLOCKED is its own state, distinct from LOST: a fusion whose components
      // are dead is not itself destroyed, it is unreachable, and the two want
      // different treatment because only one of them can come back.
      o.classList.toggle('blocked', !!s.blocked && !s.lost);
      o.classList.toggle('cool', !s.lost && !s.blocked && s.cd > 0);
      o.classList.toggle('broke', !s.lost && !s.blocked && s.cd <= 0 && !s.affordable);
      o.classList.toggle('b1', s.bound === 'ct1');
      o.classList.toggle('b2', s.bound === 'ct2');
      // GETO: no slots to bind to, so the "currently selected" mark reuses the
      // slot-2 highlight rather than inventing a third visual language
      if (s.selected) o.classList.add('b2');
    });
    // A defensive clamp, because `wheel.sel` is an index into the fighter's own
    // order and this widget serves four different radials. Cheaper than a
    // crash, and it fails to the first entry rather than to an exception.
    const sel = snapshot[wheel.sel] ?? snapshot[0];
    if (!sel) { el.classList.remove('on'); return; }
    // The wheel serves both summoners. A curse snapshot carries `selected`
    // where a shikigami snapshot carries `bound`, and that is the only thing
    // the widget needs to tell them apart: Megumi is choosing WHICH SLOT, Geto
    // is choosing WHICH MONSTER.
    const curseWheel = snapshot.some(s => 'selected' in s);
    el.querySelector('.sw-center b').textContent = curseWheel
      ? 'RT · SPECIAL GRADE'
      : (wheel.slot === 'ct1' ? 'RB · SLOT I' : 'RT · SLOT II');
    // ---- THE FUSION READOUT -------------------------------------------------
    // "HUD must make the tradeoff legible: show which components are alive and
    // what fusing will cost, BEFORE the player commits." The centre of the
    // wheel is where that has to live, because it is the one place the player
    // is already looking while choosing. Three cases:
    //   READY + CONSUMES   name every component that is about to be spent
    //   READY, FREE        say so — Totality after the Dogs died, and the Abyss
    //   NOT READY          name the components that are missing
    let line;
    if (sel.ritualOnly) line = sel.def.name + ' — SUMMONED BY RITUAL ONLY';
    else if (sel.lost) line = sel.def.name + ' — DESTROYED';
    else if (sel.fusion && !sel.fusion.ready) {
      line = sel.def.name + ' — NEEDS ' + sel.fusion.missing.map(p => p.short).join(' + ');
    } else if (sel.fusion && sel.fusion.consumes.length) {
      line = sel.def.name + ' — CONSUMES ' + sel.fusion.consumes.join(' + ') + ' FOR THE MATCH';
    } else if (sel.fusion) {
      line = sel.def.name + ' — ' + (sel.fusion.unlocked ? 'INHERITED · COSTS NOTHING MORE' : sel.def.desc);
    } else line = sel.def.name + ' · ' + sel.def.desc;
    el.querySelector('.sw-center small').textContent = line;

    // and the component strip: one chip per part, lit if alive, struck if not,
    // so "which of the four do I still have" is answered without reading a
    // sentence. Built fresh only when the selection changes.
    let strip = el.querySelector('.sw-parts');
    if (!strip) {
      strip = document.createElement('div');
      strip.className = 'sw-parts';
      el.querySelector('.sw-center').append(strip);
    }
    const wantParts = sel.fusion ? sel.fusion.parts.map(p => p.short + (p.lost ? '!' : '')).join(',') : '';
    if (strip.dataset.v !== wantParts) {
      strip.dataset.v = wantParts;
      strip.innerHTML = sel.fusion
        ? sel.fusion.parts.map(p => `<i class="${p.lost ? 'gone' : 'live'}">${p.short}</i>`).join('')
        : '';
    }
    el.classList.toggle('fusing', !!sel.fusion);
    el.classList.toggle('slot2', curseWheel || wheel.slot === 'ct2');
  }

  // ---- TOJI: THE INVENTORY CURSE, OPEN -------------------------------------
  // Same construction discipline as the shikigami wheel: the DOM is built once
  // per open and only focus classes change after that. A radial that rebuilds
  // itself every frame eats the frame budget it exists to show you.
  setArsenal(fighter, wheel) {
    const el = this.q('.arsenal-wheel');
    if (!fighter || !wheel) { el.classList.remove('on'); this._arsKey = null; return; }
    el.classList.add('on');
    const a = fighter.cfg.arsenal;
    const ring = el.querySelector('.aw-ring');
    if (this._arsKey !== fighter.cfg.id) {
      this._arsKey = fighter.cfg.id;
      ring.innerHTML = a.order.map((k, i) => {
        const w = a.weapons[k];
        const ang = (i / a.order.length) * Math.PI * 2;
        const x = 50 + Math.sin(ang) * 37, y = 50 - Math.cos(ang) * 37;
        return `<div class="aw-opt" data-k="${k}" style="left:${x}%;top:${y}%">
          <b>${w.short}</b><i>${w.jp}</i></div>`;
      }).join('');
    }
    const opts = [...ring.querySelectorAll('.aw-opt')];
    a.order.forEach((k, i) => {
      opts[i]?.classList.toggle('focus', i === wheel.sel);
      // the tool already in his hand is marked, so a player can see at a glance
      // that picking it again is the free no-op rather than a swap
      opts[i]?.classList.toggle('held', k === fighter.weapon);
    });
    const sel = a.weapons[a.order[wheel.sel]];
    el.querySelector('.aw-center small').textContent =
      a.order[wheel.sel] === fighter.weapon ? sel.name + ' — EQUIPPED' : sel.name + ' · ' + sel.desc;
  }

  toast(fighter, text) {
    const i = fighter.index ?? (fighter.isP1 ? 0 : 1);
    if (!this.plates[i]) return;
    const b = this.plates[i].querySelector('.b-toast');
    b.textContent = text;
    b.classList.add('on');
    this.toasts.set(i, 1.6);
  }

  message(text, dur = 1.2) {
    const m = this.q('.msg-center');
    m.textContent = text;
    m.classList.remove('tech');
    m.classList.add('on');
    this.msgT = dur;
  }

  // sword-roll reveal: the technique name flashes in its own signature color
  techFlash(text, color) {
    const m = this.q('.msg-center');
    m.textContent = text;
    m.style.setProperty('--tech', '#' + (color ?? 0xffffff).toString(16).padStart(6, '0'));
    m.classList.add('on', 'tech');
    this.msgT = 1.1;
  }

  cutin(fighter, who, name) {
    const c = this.q('.cutin');
    c.style.setProperty('--cut', '#' + (fighter.model.palette.accent ?? 0x8fb4ff).toString(16).padStart(6, '0'));
    c.querySelector('.c-who').textContent = fighter.cfg.name + ' — ' + who;
    c.querySelector('.c-name').textContent = name;
    c.classList.add('on');
    this.cutinT = 2.0;
  }

  // ---- HIDE THE WHOLE HUD --------------------------------------------------
  // One switch on the root, so EVERY element built above goes at once: the
  // plates (health, cursed energy, stamina, lives, badges, toasts and every
  // per-character row), the domain / clash / transfiguration / shadow / shrine
  // panels, both radial wheels, the adaptation list and its callout, the
  // ritual prompt, the pachinko cabinet, the Jackpot clock, the combo
  // counters, the split-screen player tags, the message bar, the cut-in, the
  // trial and duel panels, the swarm crawl, the blackout, the flash and the
  // hint bar. Used by the finisher cinematic, which must show nothing but the
  // scene. Nothing else calls it, and it is a no-op until something does.
  setHidden(on) { this.el.style.display = on ? 'none' : ''; }

  damageFlash() {
    const f = this.q('.flash');
    f.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove('on')));
  }

  update(dt, domain, clash, duel, trial) {
    for (let i = 0; i < this.fighters.length; i++) {
      const f = this.fighters[i];
      const plate = this.plates[i];
      if (!f || !plate) continue;
      plate.classList.toggle('out', !!f.eliminated);
      // life pips: filled = stocks remaining, hollow = stocks spent
      const lifeEl = plate.querySelector('.lives');
      const want = f.lives + '/' + (f.maxLives ?? 3);
      if (lifeEl.dataset.state !== want) {
        lifeEl.dataset.state = want;
        lifeEl.innerHTML = Array.from({ length: f.maxLives ?? 3 },
          (_, k) => `<i class="pip${k < f.lives ? '' : ' spent'}"></i>`).join('');
      }
      // `maxHP` rather than the config's flat number: Kurourushi's growth
      // stages raise his ceiling, and a bar that kept dividing by the base
      // would sit pinned at 100% while he grew.
      const hpPct = Math.max(0, f.res.hp / f.maxHP * 100);
      plate.querySelector('.bar-hp .fill').style.width = hpPct + '%';
      plate.querySelector('.bar-hp .lag').style.width = hpPct + '%';
      // CE: outer maxfill = MAX_CE ceiling, inner fill = CURRENT_CE.
      // The whole block is skipped for a fighter whose bar was REMOVED at build
      // time (Heavenly Restriction) — every query below would be null.
      const ceBar = plate.querySelector('.bar-ce');
      if (ceBar) {
        ceBar.querySelector('.maxfill').style.width = f.res.maxCE + '%';
        ceBar.querySelector('.fill').style.width = f.res.curCE + '%';
        ceBar.classList.toggle('charged', f.charged);
      }
      const st = plate.querySelector('.bar-st');
      st.querySelector('.fill').style.width = (f.res.stamina / f.cfg.stats.stamina * 100) + '%';
      st.classList.toggle('low', f.res.stamina < 25);
      plate.querySelector('.b-charged')?.classList.toggle('on', f.charged);
      plate.querySelector('.b-copy').classList.toggle('on', !!f.copySlot);
      plate.querySelector('.b-overtime').classList.toggle('on', f.buffs.overtime > 0);
      plate.querySelector('.b-backlash').classList.toggle('on', f.backlash > 0);
      plate.querySelector('.b-mark').classList.toggle('on', !!f.ratioMark);
      plate.querySelector('.b-resolve').classList.toggle('on', f.buffs.resolve > 0);
      plate.querySelector('.b-sukuna').classList.toggle('on', f.buffs.sukuna > 0);
      plate.querySelector('.b-redscale').classList.toggle('on', f.buffs.redScale > 0);
      // ---- BLOOD (Choso) ---------------------------------------------------
      // ---- AWAKENING, per frame -------------------------------------------
      if (f.cfg.awakening) {
        const a = f.cfg.awakening;
        const row = plate.querySelector('.awk-row');
        const pct = Math.max(0, Math.min(100, (f.awaken ?? 0) / a.max * 100));
        row.querySelector('.fill').style.width = pct + '%';
        const st = a.stages[f.awakenStage ?? 0];
        row.querySelector('.awk-stage').textContent = st ? st.jp : '';
        row.dataset.stage = f.awakenStage ?? 0;
        // MAX and USED are different states and read differently: at maximum
        // awakening the row lights and says READY; once the once-per-round
        // ultimate has been spent it goes quiet again, because a bar that
        // stays lit after the button stops working is a lie.
        const maxed = (f.awakenStage ?? 0) >= a.stages.length - 1;
        const spent = (f.awakenUses ?? 0) >= (f.cfg.ultimate?.uses ?? 1);
        row.classList.toggle('maxed', maxed && !spent);
        row.classList.toggle('spent', maxed && spent);
      }
      // ---- MASS, per frame -------------------------------------------------
      if (f.cfg.mass) {
        const row = plate.querySelector('.mass-row');
        const pct = Math.max(0, Math.min(100, (f.mass ?? 0) / f.cfg.mass.max * 100));
        row.querySelector('.fill').style.width = pct + '%';
        row.querySelector('.ms-num').textContent = Math.round(f.mass ?? 0);
        // ARMOURED is the state that matters and it gets its own class rather
        // than being inferred from the width — the threshold is a rule, not a
        // percentage, and it should read as one.
        row.classList.toggle('armored', (f.mass ?? 0) >= f.cfg.mass.armorAt);
        row.classList.toggle('full', (f.mass ?? 0) >= f.cfg.mass.max - 0.5);
      }
      // ---- SIMPLE DOMAIN, per frame ---------------------------------------
      if (f.cfg.simpleDomainZone) {
        const row = plate.querySelector('.sd-row');
        const live = !!(f._sdZone && f._sdZone.live);
        const cd = f.sdCooldown ?? 0;
        row.style.display = (live || cd > 0) ? '' : 'none';
        if (live) {
          // how much longer she can hold it: stamina divided by the drain,
          // shown as a fraction of the longest hold a full tank would buy
          const d = f.cfg.simpleDomainZone;
          const secs = f.res.stamina / d.drain;
          const maxSecs = f.cfg.stats.stamina / d.drain;
          row.querySelector('.fill').style.width =
            Math.max(0, Math.min(100, secs / maxSecs * 100)) + '%';
          row.querySelector('.sd-state').textContent = secs.toFixed(1) + 's';
          row.classList.toggle('low', secs < 1.2);
          row.classList.remove('cooling');
        } else if (cd > 0) {
          row.querySelector('.fill').style.width =
            (100 - cd / f.cfg.special.cooldown * 100) + '%';
          row.querySelector('.sd-state').textContent = cd.toFixed(1) + 's';
          row.classList.add('cooling');
          row.classList.remove('low');
        }
      }
      // ---- YAGA: THE CONSTRUCTION METER AND THE BENCH --------------------
      // The meter is only interesting while there is something on it, so the
      // row hides at zero rather than sitting at empty — an always-visible bar
      // at 0% for most of a round is noise. The TICKS are built once.
      const bdRow = plate.querySelector('.build-row');
      if (f.cfg.special?.key === 'yaga_build') {
        const p = f.build?.p ?? 0;
        bdRow.style.display = p > 0.001 ? '' : 'none';
        if (p > 0.001) {
          const tiers = f.cfg.special.tiers;
          const ticks = bdRow.querySelector('.bd-ticks');
          if (!ticks.childElementCount) {
            ticks.innerHTML = tiers.map(t => `<i style="left:${t.at * 100}%"></i>`).join('');
          }
          bdRow.querySelector('.fill').style.width = (p * 100) + '%';
          let cur = null;
          for (const t of tiers) if (p >= t.at - 1e-6) cur = t;
          const el = bdRow.querySelector('.bd-tier');
          el.textContent = cur ? cur.short : '—';
          el.style.color = cur ? '#' + cur.accent.toString(16).padStart(6, '0') : '';
          bdRow.classList.toggle('holding', f.state === 'building');
          bdRow.classList.toggle('full', p >= 0.999);
          for (const i of ticks.children) i.classList.toggle('passed', p >= parseFloat(i.style.left) / 100 - 1e-6);
        }
      } else bdRow.style.display = 'none';

      // THE BENCH. What he has standing, each with its own health and its own
      // clock — because a corpse the opponent has nearly killed and a corpse
      // that is about to expire are two completely different situations and
      // one bar cannot say both.
      const cpRow = plate.querySelector('.corpse-row');
      if (f.cfg.special?.key === 'yaga_build' && this.construction) {
        const snap = this.construction.snapshot(f);
        cpRow.style.display = snap.length ? '' : 'none';
        const key = snap.map(c => c.key + (c.commanded ? '!' : '')).join('|');
        if (cpRow.dataset.key !== key) {
          cpRow.dataset.key = key;
          cpRow.innerHTML = snap.map(c =>
            `<div class="cp${c.commanded ? ' cmd' : ''}" style="--cc:#${c.color.toString(16).padStart(6, '0')}">
               <span>${c.short}</span><i class="cp-hp"></i><i class="cp-life"></i></div>`).join('');
        }
        snap.forEach((c, k) => {
          const el = cpRow.children[k];
          if (!el) return;
          el.querySelector('.cp-hp').style.width = Math.max(2, c.hp * 100) + '%';
          el.querySelector('.cp-life').style.width = Math.max(2, c.life * 100) + '%';
          el.classList.toggle('dying', c.life < 0.25);
        });
      } else cpRow.style.display = 'none';

      // ---- TAKABA: THE COMEDY METER ---------------------------------------
      const cmRow = plate.querySelector('.comedy-row');
      cmRow.style.display = f.cfg.comedy ? '' : 'none';
      if (f.cfg.comedy) {
        const c = f.cfg.comedy;
        const ticks = cmRow.querySelector('.cm-ticks');
        if (!ticks.childElementCount) {
          ticks.innerHTML = c.tiers.slice(1).map(t => `<i style="left:${t.at * 100}%"></i>`).join('');
        }
        const pct = Math.max(0, Math.min(100, (f.comedy ?? 0) / c.max * 100));
        cmRow.querySelector('.fill').style.width = pct + '%';
        const t = c.tiers[f.comedyTier ?? 0];
        const el = cmRow.querySelector('.cm-tier');
        el.textContent = t.name;
        el.style.color = '#' + t.color.toString(16).padStart(6, '0');
        cmRow.dataset.tier = t.key;
        cmRow.classList.toggle('killing', t.key === 'killing');
      }

      if (f.cfg.blood) {
        const row = plate.querySelector('.blood-row');
        const pct = Math.max(0, Math.min(100, f.blood / f.cfg.blood.max * 100));
        row.querySelector('.bar-bl .fill').style.width = pct + '%';
        row.querySelector('.bl-num').textContent = Math.round(f.blood);
        row.classList.toggle('low', f.blood < (f.cfg.blood.lowWarn ?? 20));
        row.classList.toggle('full', f.blood >= f.cfg.blood.max - 0.5);
      }
      // ---- CHARGE (Kashimo) ------------------------------------------------
      // ---- THE THROAT, PER FRAME ------------------------------------------
      if (f.cfg.throat) {
        const row = plate.querySelector('.thr-row');
        const pct = Math.max(0, Math.min(100, f.throat / f.cfg.throat.max * 100));
        row.querySelector('.fill').style.width = pct + '%';
        const td = THROAT_TIERS[f.throatTier] || THROAT_TIERS[0];
        row.dataset.tier = f.throatTier;
        // `voiceSpent` is the ultimate's latch and it is a DIFFERENT sentence
        // from "the gauge is full": one of them recovers and the other does
        // not, and a player watching a bar that is going down while his voice
        // stays gone deserves to be told which they are looking at.
        row.querySelector('.thr-tier').textContent =
          f.voiceSpent ? '失声 SPENT' : td.jp + ' ' + td.name;
        row.classList.toggle('spent', !!f.voiceSpent);
        const ticks = row.querySelectorAll('.thr-ticks i');
        for (let k = 0; k < ticks.length; k++) {
          ticks[k].classList.toggle('passed', f.throatTier > k);
        }
      }
      // ---- COMMAND RESISTANCE, PER FRAME ----------------------------------
      // The row appears on every plate the moment anybody in the match has a
      // voice, and reports THIS fighter's resistance — which climbs as their
      // own MAX_CE does, so a player watching their bar fill is also watching
      // themselves become harder to command.
      {
        const anyVoice = this.fighters.some(x => x?.cfg?.throat);
        const rrow = plate.querySelector('.res-row');
        rrow.style.display = (anyVoice && !f.cfg.throat) ? '' : 'none';
        if (anyVoice && !f.cfg.throat) {
          const band = resistBand(f);
          rrow.dataset.band = band;
          const pips = rrow.querySelectorAll('.rs-pips i');
          for (let k = 0; k < pips.length; k++) pips[k].classList.toggle('on', k <= band);
          rrow.querySelector('.rs-band').textContent = RESIST_BANDS[band];
        }
      }
      if (f.cfg.charge) {
        const row = plate.querySelector('.chg-row');
        const pct = Math.max(0, Math.min(100, f.charge / f.cfg.charge.max * 100));
        row.querySelector('.bar-chg .fill').style.width = pct + '%';
        const td = CHARGE_TIERS[f.chargeTier] || CHARGE_TIERS[0];
        row.querySelector('.chg-tier').textContent = td.name;
        row.dataset.tier = f.chargeTier;
        // AMBER pins the meter; the row says so rather than looking like a
        // player who happens to be very good at dashing
        row.classList.toggle('amber', f.amberT > 0);
        for (const [k, tick] of [...row.querySelectorAll('.chg-ticks i')].entries()) {
          tick.classList.toggle('passed', f.chargeTier > k);
        }
      }
      // ---- THE THREE CORES (Panda) -----------------------------------------
      // A destroyed core stays on the strip, greyed and struck through, for the
      // rest of the match — the same permanence philosophy the shikigami row
      // already carries, and for the same reason: the opponent needs to see
      // which of his three characters they have already killed.
      if (f.cores) {
        const shared = !!f.cfg.cores?.shared;
        const segs = plate.querySelectorAll('.core-row .core-seg');
        for (let k = 0; k < f.cores.length; k++) {
          const c = f.cores[k], el = segs[k];
          if (!el) continue;
          // shared pool: the segment fills to show WHICH core is standing, and
          // no core is ever struck through because none of them can die alone
          el.querySelector('.cs-fill').style.width = shared
            ? (k === f.coreIndex ? 100 : 0) + '%'
            : Math.max(0, Math.min(100, c.hp / c.max * 100)) + '%';
          el.classList.toggle('dead', !shared && !c.alive);
          el.classList.toggle('active', k === f.coreIndex && c.alive);
        }
      }
      // ---- ESSENCE (Nobara) ------------------------------------------------
      if (f.cfg.essence) {
        const row = plate.querySelector('.ess-row');
        const pct = Math.max(0, Math.min(100, f.essence / f.cfg.essence.max * 100));
        row.querySelector('.bar-es .fill').style.width = pct + '%';
        row.querySelector('.es-num').textContent = Math.round(f.essence);
        // armed = there is enough banked to fire Resonance at all
        row.classList.toggle('armed', f.essence >= (f.cfg.ct2?.minEssence ?? 8));
        row.classList.toggle('full', f.essence >= f.cfg.essence.max - 0.5);
      }
      const bfBadge = plate.querySelector('.b-bf');
      bfBadge.classList.toggle('on', f.bfChain > 0);
      if (f.bfChain > 0) bfBadge.textContent = 'BF ×' + f.bfChain;
      // burn stacks: visible on the victim's plate, counts up to max
      const burnBadge = plate.querySelector('.b-burn');
      burnBadge.classList.toggle('on', f.burn.stacks > 0);
      if (f.burn.stacks > 0) burnBadge.textContent = '🔥 BURN ×' + f.burn.stacks;
      plate.querySelector('.b-soulwound').classList.toggle('on', f.buffs.soulWound > 0);
      // ---- CONFISCATION -----------------------------------------------------
      // The seized button lives on the VICTIM's plate, because they are the
      // one who needs to know which of their tools is gone and for how long.
      const lockEl = plate.querySelector('.b-locked');
      const lk = f.lockedSlot;
      lockEl.classList.toggle('on', !!lk);
      if (lk) {
        const label = { ct1: 'RB', ct2: 'RT', special: 'B' }[lk.slot] || lk.slot;
        lockEl.textContent = '没収 ' + label + '  ' + lk.t.toFixed(1) + 's';
      }
      // ---- EVIDENCE ---------------------------------------------------------
      // Higuruma only. Both players can read it: it is how much shorter his
      // execution sequence is going to be, and it is the clock the opponent is
      // racing when they decide whether to go and break Judgeman.
      const evRow = plate.querySelector('.ev-row');
      const hasEv = !!f.cfg.evidence;
      evRow.style.display = hasEv ? '' : 'none';
      if (hasEv) {
        const pct = Math.max(0, Math.min(100, f.evidence ?? 0));
        evRow.querySelector('.bar-ev .fill').style.width = pct + '%';
        evRow.querySelector('.ev-num').textContent = Math.round(pct) + '%';
        evRow.classList.toggle('full', pct >= 99.5);
        // the tick showing where the cast gate now sits on the CE bar
        const gate = (f.castThresholdOverride ?? 1) * 100;
        evRow.querySelector('.ev-gate').style.left = gate + '%';
      }
      // ---- SUKUNA: FINGER STACKS --------------------------------------------
      // Both players need this at a glance: it is the only thing on his plate
      // that says how dangerous he has become, and it is the opponent's clock
      // — every pip he fills is a window they failed to deny him. It also
      // spells out what the stacks have unlocked, because "RT does a different
      // thing now" is not something a player should have to discover by dying.
      const fgCfg = f.cfg.fingers;
      if (fgCfg) {
        const row = plate.querySelector('.fg-row');
        const n = f.fingers ?? 0, max = fgCfg.count ?? 4;
        const key = n + '/' + max;
        if (row.dataset.state !== key) {
          row.dataset.state = key;
          row.querySelector('.fg-pips').innerHTML = Array.from({ length: max },
            (_, k) => `<i class="fg-pip${k < n ? ' eaten' : ''}"></i>`).join('');
          const at = fgCfg.fireArrowAt ?? 2;
          row.querySelector('.fg-unlock').textContent = n >= at
            ? '開 FIRE ARROW' : 'FIRE ARROW @ ' + at;
          row.classList.toggle('armed', n >= at);
          row.classList.toggle('spent', n >= max);
        }
      }

      // ---- THE ARSENAL --------------------------------------------------
      // What is in his hand, what else he owns, and the one clock he has. Both
      // players read this: the opponent needs to know which weapon they are
      // fighting right now, because the answer to each of the four is
      // different, and they need to see ASSASSINATION come off cooldown.
      if (f.cfg.arsenal) {
        const row = plate.querySelector('.ars-row');
        for (const s of row.querySelectorAll('.ars-slot')) {
          s.classList.toggle('held', s.dataset.k === f.weapon);
        }
        // the seal Higuruma or another Toji can put on his technique buttons
        row.classList.toggle('sealed', f.ctSealT > 0);
        const u = f.cfg.ultimate;
        const a = row.querySelector('.ars-ass');
        const ready = f.assassinCD <= 0;
        a.classList.toggle('ready', ready);
        a.querySelector('i').textContent = ready ? 'READY' : f.assassinCD.toFixed(1) + 's';
        a.style.setProperty('--cd', (ready ? 0 : (1 - f.assassinCD / u.cooldown) * 100) + '%');
      }
      // special slot: name, cooldown sweep, primed/stored states
      const sp = f.cfg.special;
      if (sp) {
        const slot = plate.querySelector('.sp-slot');
        const cdPct = f.specialCD > 0 ? Math.min(1, f.specialCD / (f.specialCDMax || 1)) : 0;
        slot.querySelector('.sp-cd').style.width = (cdPct * 100) + '%';
        slot.classList.toggle('ready', f.specialCD <= 0);
        slot.classList.toggle('primed', f.ratioPrimed > 0);
        // yuji: the slot flares while the Black Flash window is open
        slot.classList.toggle('window',
          !!(f.cfg.blackFlash && f.bfT > 0 && f.bfT <= f.cfg.blackFlash.window));
        const nameEl = slot.querySelector('.sp-name');
        if (sp.key === 'yuta_copy') {
          // show what he's holding — and make an empty slot readable too
          nameEl.textContent = f.copySlot ? f.copySlot.name.toUpperCase() : 'COPY — EMPTY';
          nameEl.style.color = f.copySlot
            ? '#' + (f.copySlot.color ?? 0x9ff5c9).toString(16).padStart(6, '0') : '';
          slot.classList.toggle('empty', !f.copySlot);
        } else {
          nameEl.textContent = f.ratioPrimed === 2 ? '7:3 PRIMED'
            : f.ratioPrimed === 1 ? '7:3 PARTIAL' : sp.name;
        }
        // Nanami's sweep bar: visible only while the marker runs
        const rb = plate.querySelector('.ratio-bar');
        const sweeping = f.ratioSweep != null;
        rb.classList.toggle('on', sweeping);
        if (sweeping) rb.querySelector('.rb-marker').style.left = (f.ratioSweep * 100) + '%';
      }
      // SHIKIGAMI: what is bound to each slot, its cooldown sweep, and the
      // running tally of what has been DESTROYED — losses are permanent, so
      // they get a persistent strip rather than a toast that scrolls away.
      if (f.cfg.shikigami && this.shikigami) {
        const snap = this.shikigami.snapshot(f);
        const byKey = new Map(snap.map(s => [s.key, s]));
        for (const [cls, slot] of [['.s1', 'ct1'], ['.s2', 'ct2']]) {
          const el = plate.querySelector('.shiki-row ' + cls);
          const bound = this.shikigami.bindingOf(f, slot);
          const s = byKey.get(bound);
          if (!s) { el.classList.add('empty'); continue; }
          el.classList.remove('empty');
          el.querySelector('.ss-name').textContent = s.def.short;
          el.querySelector('.ss-cd').style.width =
            (s.cd > 0 ? Math.min(1, s.cd / s.cdMax) * 100 : 0) + '%';
          el.classList.toggle('lost', s.lost);
          el.classList.toggle('ready', !s.lost && s.cd <= 0 && s.affordable);
          el.classList.toggle('broke', !s.lost && s.cd <= 0 && !s.affordable);
        }
        const lostEl = plate.querySelector('.shiki-lost');
        const lost = snap.filter(s => s.lost);
        const want = lost.map(s => s.def.short).join(' ');
        if (lostEl.dataset.v !== want) {
          lostEl.dataset.v = want;
          lostEl.innerHTML = lost.length
            ? '<em>LOST</em>' + lost.map(s => `<span>${s.def.short}</span>`).join('')
            : '';
          lostEl.classList.toggle('on', lost.length > 0);
        }
      }
      // ---- NATURE'S EMBRACE ------------------------------------------------
      // Three states, colour-coded, with the actual regeneration rate spelled
      // out next to it. A player should never have to guess whether the ground
      // they are fighting on is helping him.
      if (f.cfg.flora && this.flora) {
        const s = this.flora.snapshot(f);
        const row = plate.querySelector('.terr-row');
        row.className = 'terr-row t-' + s.terrain;
        row.querySelector('.terr-jp').textContent =
          s.terrain === 'field' ? '花畑' : s.terrain === 'natural' ? '土' : '人工';
        row.querySelector('.terr-name').textContent =
          s.terrain === 'field' ? 'ROOT FIELD' : s.terrain === 'natural' ? 'NATURAL GROUND' : 'DEAD GROUND';
        row.querySelector('.terr-rate').textContent = '+' + s.rate.toFixed(1) + ' HP/s';
      }
      // ---- GLUTTONY --------------------------------------------------------
      if (f.cfg.gluttony && this.swarms) {
        const s = this.swarms.snapshot(f);
        const row = plate.querySelector('.glut-row');
        row.querySelector('.bar-gl .fill').style.width = (s.value / s.max * 100) + '%';
        row.querySelector('.gl-stage').textContent =
          s.stage >= s.stages ? 'MAX' : 'STAGE ' + s.stage + '/' + s.stages;
        row.classList.toggle('maxed', s.stage >= s.stages);
        row.classList.toggle('infesting', s.infesting);
        const ticks = row.querySelectorAll('.gl-ticks i');
        for (let k = 0; k < ticks.length; k++) ticks[k].classList.toggle('passed', k < s.stage);
      }
      // ---- CURSED BUD ------------------------------------------------------
      if (this.flora) {
        const bud = this.flora.budOn(f);
        const row = plate.querySelector('.bud-row');
        row.style.display = bud ? '' : 'none';
        if (bud) {
          row.querySelector('.bar-bud .fill').style.width = (bud.t / bud.dur * 100) + '%';
          row.querySelector('.bud-cleanse').textContent =
            bud.t.toFixed(1) + 's  ·  ' + bud.hits + '/' + (bud.def.cleanseHits ?? 4) + ' HITS TO TEAR OUT';
        }
      }
      // ---- GETO: THE STABLE STRIP AND THE LIVE UZUMAKI PROJECTION ---------
      // "Show the projected Uzumaki damage on the HUD, updating live as curses
      // die." It reads the number out of the SAME function the effect
      // dispatcher calls when the ultimate actually fires
      // (CurseSystem.uzumakiDamage), so the figure on the bar is not an
      // estimate of the figure in the fight — it is the figure in the fight.
      if (f.cfg.curses && this.curses) {
        // queried here rather than closed over: the reference built in
        // setFighters is local to that call, and the plates are rebuilt
        // whenever the seat count changes
        const uzRow = plate.querySelector('.uzu-row');
        const snap = this.curses.snapshot(f);
        const icons = plate.querySelectorAll('.st-i');
        snap.forEach((s, k) => {
          const el = icons[k];
          if (!el) return;
          // GREYED OUT when destroyed, exactly as asked. Three other states
          // carry real information too and cost nothing to show: OUT (this
          // body is on the field right now), COOLING, and BROKE (he cannot
          // currently afford it).
          el.classList.toggle('lost', s.lost);
          el.classList.toggle('out', !s.lost && s.out);
          el.classList.toggle('cool', !s.lost && !s.out && s.cd > 0);
          el.classList.toggle('broke', !s.lost && !s.out && s.cd <= 0 && !s.affordable);
        });
        // `uzumakiDelivered` rather than `uzumakiDamage`: the raw figure is
        // multiplied twice more on its way to a health bar (the caster's
        // damageScale and the global SPECIAL dial), and printing the raw one
        // would put a number on screen that is 6% under what actually lands.
        const dmg = this.curses.uzumakiDelivered(f);
        const count = this.curses.uzumakiCount(f);
        // the bar is scaled against a FULL stable, so "how much of my ultimate
        // is left" is the length of the bar and needs no arithmetic
        // the same sublinear curve the system itself uses, so the bar's FULL
        // reference point and the number printed next to it cannot drift
        const fullWeight = f.cfg.curses.stable.reduce((a, k) =>
          a + (f.cfg.curses.defs[k].uzumakiWeight ?? 1), 0);
        const fullRaw = (f.cfg.ultimate.baseDmg ?? 18)
          + (f.cfg.ultimate.dmgPerWeight ?? 8) * Math.pow(fullWeight, f.cfg.ultimate.weightExp ?? 1);
        const full = fullRaw * (f.cfg.stats.damageScale ?? 1);
        uzRow.querySelector('.bar-uz .fill').style.width =
          Math.min(100, dmg / (full * 1.3) * 100) + '%';
        uzRow.querySelector('.uz-num').textContent =
          count.total ? Math.round(dmg) + ' DMG · ' + count.total + ' HELD' : 'STABLE EMPTY';
        uzRow.classList.toggle('empty', count.total === 0);
        uzRow.classList.toggle('loaded', count.total >= f.cfg.curses.stable.length - 1);
      }
      // ---- NAOYA: THE THREE PROJECTION STATES ------------------------------
      // All three are on the badge row rather than in a bar, because none of
      // them is a quantity — they are facts the opponent has to know RIGHT NOW.
      // FROZEN is on the victim's plate, ARMED and MAX PROJECTION on his.
      plate.querySelector('.b-frozen').classList.toggle('on', f.frozenT > 0);
      plate.querySelector('.b-stance').classList.toggle('on', f.projT > 0);
      // deliberately NOT lit during `projArmT`: the startup is the bait window
      // and telling the opponent the trap is armed before it is would remove
      // the only thing that makes the stance punishable.
      plate.querySelector('.b-maxproj').classList.toggle('on', f.maxProjT > 0);

      // combos: the two on-screen counters belong to the first two seats
      const combo = this.combos[i];
      if (combo) {
        if (f.comboHits >= 2) {
          combo.classList.add('on');
          combo.querySelector('.num').textContent = f.comboHits;
        } else combo.classList.remove('on');
      }
      // toast timers
      if (this.toasts.get(i) > 0) {
        this.toasts.set(i, this.toasts.get(i) - dt);
        if (this.toasts.get(i) <= 0) plate.querySelector('.b-toast').classList.remove('on');
      }
    }
    // clash contest: countdown + the live damage race
    const cs = this.q('.clash-status');
    if (clash) {
      cs.classList.add('on');
      cs.querySelector('.bar-clash .fill').style.width =
        Math.max(0, (1 - clash.t / clash.dur) * 100) + '%';
      const ca = cs.querySelector('.ca'), cb = cs.querySelector('.cb');
      ca.querySelector('b').textContent = clash.a.cfg.name;
      cb.querySelector('b').textContent = clash.b.cfg.name;
      ca.querySelector('i').textContent = clash.dmgA.toFixed(0);
      cb.querySelector('i').textContent = clash.dmgB.toFixed(0);
      // green on whoever is currently winning (less damage taken)
      ca.classList.toggle('lead', clash.dmgA < clash.dmgB);
      cb.classList.toggle('lead', clash.dmgB < clash.dmgA);
    } else cs.classList.remove('on');

    // TRANSFIGURATION GAUGE: full-bar-front-and-center while Mahito's domain
    // holds — one prominent row per trapped fighter, draining toward the KO
    const tfEl = this.q('.tf-status');
    const tfActive = domain && domain.phase === 'active'
      && domain.def.sureHit?.effect === 'transfigure' && domain.gauges;
    if (tfActive) {
      tfEl.classList.add('on');
      const rows = tfEl.querySelector('.tf-rows');
      const entries = [...domain.gauges.entries()];
      if (rows.childElementCount !== entries.length) {
        rows.innerHTML = entries.map(() =>
          `<div class="tf-row"><b></b><div class="bar bar-tf"><div class="fill"></div></div></div>`).join('');
      }
      entries.forEach(([f, g], i) => {
        const row = rows.children[i];
        row.querySelector('b').textContent = f.cfg.name;
        const pct = Math.max(0, g / domain.def.transfig.gauge * 100);
        row.querySelector('.fill').style.width = pct + '%';
        row.classList.toggle('danger', pct < 35);
      });
    } else tfEl.classList.remove('on');

    // CHIMERA SHADOW GARDEN: the opponent's EXPOSURE read. With no barrier and
    // no sure-hit, the only thing they need to know is how deep into the
    // shadow they are standing — so that is the whole panel.
    const shEl = this.q('.shadow-status');
    const shActive = domain && domain.phase === 'active'
      && domain.def.sureHit?.effect === 'shadow_garden';
    if (shActive) {
      shEl.classList.add('on');
      const rows = shEl.querySelector('.sh-rows');
      const entries = [...(domain.exposure?.entries() ?? [])];
      if (rows.childElementCount !== entries.length) {
        rows.innerHTML = entries.map(() =>
          `<div class="tf-row"><b></b><div class="bar bar-sh"><div class="fill"></div></div></div>`).join('');
      }
      entries.forEach(([f, x], i) => {
        const row = rows.children[i];
        if (!row) return;
        row.querySelector('b').textContent = f.cfg.name;
        row.querySelector('.fill').style.width = (x * 100) + '%';
        row.classList.toggle('danger', x > 0.55);
        row.classList.toggle('safe', x <= 0.001);
      });
    } else shEl.classList.remove('on');

    // MALEVOLENT SHRINE: the one number that matters is how far each victim
    // is from the edge, because getting past it is the whole counterplay. The
    // meter fills as they get DEEPER (0 at the rim, 1 at dead centre), and it
    // reads out the actual metres left so a player can decide whether they can
    // make it. `SAFE` means they are already out and free to stop running.
    const srEl = this.q('.shrine-status');
    const srActive = domain && domain.phase === 'active'
      && domain.def.sureHit?.effect === 'malevolent_shrine';
    if (srActive) {
      srEl.classList.add('on');
      const rows = srEl.querySelector('.sr-rows');
      const victims = this.fighters.filter(f => f !== domain.caster && !f.eliminated);
      if (rows.childElementCount !== victims.length) {
        rows.innerHTML = victims.map(() =>
          `<div class="tf-row"><b></b><div class="bar bar-sr"><div class="fill"></div></div><u></u></div>`).join('');
      }
      const R = Math.max(0.01, domain.shrineR ?? 0);
      victims.forEach((f, i) => {
        const row = rows.children[i];
        if (!row) return;
        const d = Math.hypot(f.pos.x - domain.shrineOrigin.x, f.pos.z - domain.shrineOrigin.z);
        const inside = d < R;
        const x = inside ? Math.max(0.05, 1 - d / R) : 0;
        row.querySelector('b').textContent = f.cfg.name;
        row.querySelector('.fill').style.width = (x * 100) + '%';
        row.querySelector('u').textContent = inside
          ? '+' + (R - d).toFixed(1) + 'm' : 'SAFE';
        row.classList.toggle('danger', x > 0.5);
        row.classList.toggle('safe', !inside);
      });
    } else srEl.classList.remove('on');

    // domain status
    const ds = this.q('.domain-status');
    if (domain && domain.phase === 'active') {
      ds.classList.add('on');
      ds.querySelector('.dname').textContent = domain.def.name + ' ' + domain.def.jpName;
      ds.querySelector('.bar-time .fill').style.width = (domain.timer / domain.def.duration * 100) + '%';
      // an OPEN domain has no barrier, so it has no integrity to report — the
      // bar is hidden rather than left sitting at a meaningless 100%
      const open = !!domain.def.noBarrier;
      ds.classList.toggle('no-barrier', open);
      if (!open) ds.querySelector('.bar-integrity .fill').style.width = Math.max(0, domain.integrity) + '%';
    } else ds.classList.remove('on');

    // ADAPTATION: the persistent list, strongest first, plus the countdown to
    // the next one. Visible to both players — this is information the opponent
    // needs more than Mahoraga does.
    if (this.adaptOf && this.adaptOf.alive) {
      const ad = this.adaptOf.adapt;
      this.q('.ad-next .fill').style.width = (ad.progress * 100) + '%';
      const rows = this.q('.ad-rows');
      const list = ad.list();
      const key = list.map(r => r.src + ':' + r.total.toFixed(3)).join('|');
      if (this._adaptKey !== key) {
        this._adaptKey = key;
        rows.innerHTML = list.map(r => `
          <div class="ad-row${r.capped ? ' capped' : ''}">
            <b>${r.label}</b>
            <div class="bar bar-ad"><div class="fill" style="width:${Math.round(r.total * 100)}%"></div></div>
            <u>${Math.round(r.total * 100)}%</u>
            <em>${r.stacks > 1 ? '×' + r.stacks : ''}</em>
          </div>`).join('') || '<div class="ad-none">NOTHING ADAPTED YET</div>';
      }
    } else if (this.adaptOf) {
      this.setAdaptation(null);
    }
    if (this.adaptT > 0) {
      this.adaptT -= dt;
      if (this.adaptT <= 0) this.q('.adapt-callout').classList.remove('on');
    }
    if (this.promptT > 0) {
      this.promptT -= dt;
      if (this.promptT <= 0) this.q('.ritual-prompt').classList.remove('on');
    }

    if (this.gamble) this._pachinko(this.gamble.snapshot());

    // ---- THE CRAWL ---------------------------------------------------------
    // Kurourushi's swarm obscuring vision. Deliberately a CSS overlay rather
    // than a post-process: it costs nothing, and it is capped hard enough that
    // it can never become an unplayable brownout — the swarm is meant to be
    // unpleasant to stand in, not to take the screen away.
    if (this.swarms) {
      const c = this.q('.crawl');
      const k = this.swarms.obscure;
      c.classList.toggle('on', k > 0.02);
      c.style.opacity = k.toFixed(3);
    }

    this._duel(duel);
    this._trial(trial);
    this._theset(this.theset?.snapshot?.() ?? null);
    if (this.blackT > 0) {
      this.blackT -= dt;
      if (this.blackT <= 0) this.q('.blackout').classList.remove('on');
    }

    if (this.msgT > 0) {
      this.msgT -= dt;
      if (this.msgT <= 0) this.q('.msg-center').classList.remove('on');
    }
    if (this.cutinT > 0) {
      this.cutinT -= dt;
      if (this.cutinT <= 0) this.q('.cutin').classList.remove('on');
    }
  }

  // ---- HAKARI: the pachinko panel ------------------------------------------
  // A cabinet screen in the corner, NOT a modal. The fight is still running
  // behind it, so everything here has to be readable at a glance and out of
  // the way of the action: the three reels, the tier, how many techniques are
  // left before the next scenario, and the failure meter both players are
  // watching. Only the super-reach bleed and the Jackpot clock are allowed to
  // take space away from the fight.
  _pachinko(snap) {
    const el = this.q('.pachi');
    const g = snap.gamble;
    el.classList.toggle('on', !!g);
    const bleed = this.q('.reach-bleed');
    if (g) {
      const s = g.scenario;
      el.classList.toggle('armed', g.armed);
      el.classList.toggle('running', !!s);
      el.classList.remove('t-weak', 't-strong', 't-super');
      if (s) el.classList.add('t-' + s.tier);

      const tierEl = el.querySelector('.pachi-tier');
      tierEl.textContent = s
        ? (s.guaranteed ? '確定 GUARANTEED' : s.jp + ' ' + s.label)
        : (g.armed ? '確定 — NEXT REACH IS A HIT' : 'FEEDING THE MACHINE');
      // the reels: two locked on the jackpot symbol, the third still going —
      // which is what "reach" means on a real cabinet
      const cells = el.querySelectorAll('.pachi-reels i');
      const faces = s ? s.reels : ['7', '7', '—'];
      for (let k = 0; k < 3; k++) {
        if (cells[k].textContent !== faces[k]) cells[k].textContent = faces[k];
        cells[k].classList.toggle('locked', !s || k < 2 || s.shown);
        cells[k].classList.toggle('hit', !!(s && s.shown && s.hit));
      }
      const res = el.querySelector('.pachi-result');
      res.textContent = s
        ? (s.shown ? (s.hit ? '大当り' : 'MISS') : (Math.round(s.odds * 100) + '%'))
        : '';
      res.classList.toggle('hit', !!(s && s.shown && s.hit));
      res.classList.toggle('miss', !!(s && s.shown && !s.hit));

      // the technique counter — the opponent needs to see it building too
      const left = g.perTechniques - g.techniques;
      el.querySelector('.pachi-ct span').textContent = left + ' CT';
      // the rising tension meter: three pips, and when all three are lit the
      // next scenario is a certainty
      const pips = el.querySelector('.pf-pips');
      const want = Math.min(g.fails, g.need) + '/' + g.need;
      if (pips.dataset.v !== want) {
        pips.dataset.v = want;
        pips.innerHTML = Array.from({ length: g.need },
          (_, k) => `<u class="${k < g.fails ? 'lit' : ''}"></u>`).join('');
      }
      // a super reach does not stay in its window
      bleed.className = 'reach-bleed' + (s && s.tier !== 'weak' ? ' on ' + s.tier : '');
    } else {
      bleed.className = 'reach-bleed';
    }

    // the Jackpot clock: top centre, unmissable, visible to both players for
    // the whole 99 seconds
    const jb = this.q('.jackpot-bar');
    const j = snap.jackpot;
    jb.classList.toggle('on', !!j);
    if (j) {
      jb.classList.toggle('healing', j.healing);
      jb.classList.toggle('ending', j.t <= 10);
      jb.querySelector('.jb-clock').textContent = j.t.toFixed(1);
      jb.querySelector('.bar-jp .fill').style.width = (j.t / j.dur * 100) + '%';
    }
  }

  // ---- THE EXECUTION DUEL --------------------------------------------------
  // A full-screen prompt display, readable at a glance BY BOTH PLAYERS, with
  // both sides visible simultaneously: his position in the sequence on the
  // left, their mash prompt on the right, and one shrinking clock underneath
  // that they are both looking at. Neither player should ever have to guess
  // who is winning.
  // THE TRIAL. Both parties choose at once, so nothing either side picked may
  // be shown until the reveal — the panel shows only WHETHER each has locked
  // in, then flips both cards together.
  _trial(t) {
    const el = this.q('.trial');
    if (!t) { el.classList.remove('on'); this._trialKey = null; return; }
    el.classList.add('on');
    const key = t.pleas.map(p => p.key).join('');
    if (this._trialKey !== key) {
      this._trialKey = key;
      el.querySelector('.trial-grid').innerHTML = t.pleas.map(p =>
        `<div class="tp" data-k="${p.key}" style="--pc:#${p.color.toString(16).padStart(6, '0')}">
           <b>${p.key}</b><span>${p.label}</span><i>${p.jp}</i></div>`).join('');
    }
    el.querySelector('.trial-reads').innerHTML =
      Array.from({ length: t.need }, (_, i) =>
        `<i class="rd${i < t.correct ? ' got' : ''}"></i>`).join('') +
      `<span>${t.correct}/${t.need} READS</span>`;

    const rev = t.phase === 'reveal';
    for (const card of el.querySelectorAll('.tp')) {
      const k = card.dataset.k;
      card.classList.toggle('plea', rev && t.plea === k);
      card.classList.toggle('guess', rev && t.guess === k);
      card.classList.toggle('dim', rev && t.plea !== k && t.guess !== k);
    }
    el.querySelector('.trial-clock .fill').style.width =
      (t.limit ? Math.max(0, 1 - t.t / t.limit) * 100 : 0) + '%';
    el.querySelector('.trial-title').textContent =
      rev ? (t.result === 'read' ? '看破 — READ CORRECTLY' : '誤読 — MISREAD') : '開廷 — ENTER YOUR PLEA';
    el.querySelector('.trial-foot').textContent = rev
      ? `${t.caster?.cfg.name ?? ''} CALLED ${t.guess ?? '?'} · PLEA WAS ${t.plea ?? '?'}`
      : `${t.pleaded ? 'PLEA IN' : 'DEFENDANT CHOOSING'} · ${t.guessed ? 'CALL IN' : 'HIGURUMA CHOOSING'}`;
  }

  // ---- THE SET -------------------------------------------------------------
  // DELIBERATELY A THIN BAND, NOT A PANEL. The QTE version this replaced owned
  // the middle of the screen, because the contest WAS the UI. Here the contest
  // is the room, so the HUD's whole job is to say four things and then get out
  // of the way: which scene this is, how far along the corridor they are, how
  // long is left, and how many they have cleared. Anything larger would be
  // covering the thing the player is trying to jump over.
  _theset(g) {
    const el = this.q('.tset');
    if (!g) { el.classList.remove('on'); this._tsKey = null; return; }
    el.classList.add('on');
    el.dataset.phase = g.phase;
    el.dataset.tier = g.tierKey;
    el.style.setProperty('--gs', '#' + g.tierColor.toString(16).padStart(6, '0'));

    const card = el.querySelector('.ts-card');
    card.classList.toggle('on', g.phase === 'open' || g.phase === 'title' || g.phase === 'result');
    if (g.phase === 'open') {
      el.querySelector('.ts-tier').textContent = 'DIFFICULTY — ' + g.tier;
      el.querySelector('.ts-name').textContent = 'THE SET';
      el.querySelector('.ts-jp').textContent = '持ちネタ';
      el.querySelector('.ts-blurb').textContent = g.contestant + ' IS TODAY\'S CONTESTANT';
    } else if (g.scene && g.phase !== 'result') {
      el.querySelector('.ts-tier').textContent = 'SCENE ' + (g.index + 1) + ' OF ' + g.scenes + ' — ' + g.tier;
      el.querySelector('.ts-name').textContent = g.scene.name;
      el.querySelector('.ts-jp').textContent = g.scene.jp;
      el.querySelector('.ts-blurb').textContent = g.scene.blurb;
    } else if (g.phase === 'result') {
      el.querySelector('.ts-tier').textContent = g.cleared + ' OF ' + g.scenes + ' CLEARED';
      el.querySelector('.ts-name').textContent =
        g.outcome === 'ko' ? 'NOBODY GOT OUT'
          : g.outcome === 'escaped' ? 'THEY GOT OUT'
            : g.killRefused ? g.killRefused : 'CURTAIN';
      el.querySelector('.ts-jp').textContent = '';
      el.querySelector('.ts-blurb').textContent = '';
    }

    // the run band: a progress rail with the exit at the far end, and a clock
    const run = el.querySelector('.ts-run');
    const live = g.phase === 'run' && g.scene;
    run.classList.toggle('on', !!live);
    if (live) {
      run.querySelector('.ts-prog .fill').style.width = (g.scene.progress * 100) + '%';
      const left = Math.max(0, g.scene.time - g.scene.t);
      run.querySelector('.ts-clock').textContent = left.toFixed(1);
      run.classList.toggle('critical', left < g.scene.time * 0.3);
    }

    // three lamps, filled as scenes resolve
    const lamps = Array.from({ length: g.scenes }, (_, i) => {
      const r = g.results[i];
      return `<i class="tsp${r ? (r.cleared ? ' pass' : ' fail') : ''}"></i>`;
    }).join('');
    const sc = el.querySelector('.ts-score');
    if (sc.dataset.k !== lamps) { sc.dataset.k = lamps; sc.innerHTML = lamps; }
  }

  _duel(d) {
    const el = this.q('.duel');
    if (!d) {
      el.classList.remove('on');
      this._duelKey = null;
      return;
    }
    el.classList.add('on');
    el.classList.toggle('opening', d.phase === 'freeze');
    el.classList.toggle('wrong', !!d.wrong);
    // rebuild the prompt row only when the sequence itself changes — a DOM
    // rebuild every frame under a 4-second timer is exactly the wrong place
    // to spend the frame budget
    const key = d.seq.join('') + '|' + (d.caster?.cfg.id ?? '');
    const seqEl = el.querySelector('.duel-seq');
    if (this._duelKey !== key) {
      this._duelKey = key;
      seqEl.innerHTML = d.seq.map((k, i) =>
        `<b class="dp" style="--pc:#${(d.colors[i] ?? 0xffffff).toString(16).padStart(6, '0')}">${k}</b>`).join('');
      el.querySelector('.duel-him .ds-who').textContent =
        (d.caster?.cfg.name ?? '') + ' — ' + d.seq.length + ' TO GO'
        + (d.evidence ? '  ·  EVIDENCE ' + d.evidence + '%' : '  ·  NO EVIDENCE');
      el.querySelector('.duel-them .ds-who').textContent = d.victim?.cfg.name ?? '';
      el.querySelector('.duel-mash b').textContent = d.mash;
    }
    const chips = seqEl.children;
    for (let i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('done', i < d.idx);
      chips[i].classList.toggle('now', i === d.idx);
    }
    const pct = Math.max(0, d.timer / d.timerMax) * 100;
    const clock = el.querySelector('.duel-clock');
    clock.querySelector('.fill').style.width = pct + '%';
    clock.classList.toggle('critical', pct < 30);
    clock.querySelector('.duel-time').textContent = d.timer.toFixed(2);
    el.querySelector('.duel-foot').textContent =
      d.idx + ' / ' + d.seq.length + ' SEALED   ·   ' + d.mashes + ' PRESSES AGAINST';
  }

  // The hard cut. Nothing subtle: the screen is black, and when it comes back
  // the round is over.
  blackout(dur = 0.5) {
    const b = this.q('.blackout');
    b.classList.add('on');
    this.blackT = dur;
  }

  destroy() { this.el.remove(); }
}
