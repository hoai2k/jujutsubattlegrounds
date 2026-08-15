// ADAPTATION — Mahoraga's entire kit.
//
// He has no cursed energy, no bar, no meter, no ultimate and no domain. What
// he has is this: every so often he becomes measurably harder to hurt with one
// specific thing, and the opponent has to go and find another thing.
//
// THE RULES
//  · Every ADAPT.interval seconds he adapts to ONE randomly chosen damage
//    source out of everything that has actually landed on him since the last
//    adaptation. Nothing has landed -> the interval passes and he gains
//    nothing. Standing off and not hitting him is a real (if losing) answer.
//  · Each adaptation rolls a RANDOM percentage in [rollMin, rollMax], so the
//    same matchup never plays out the same way twice.
//  · Adaptations STACK on the same source and are capped at ADAPT.cap, which
//    is deliberately below 100%: every tool the opponent owns keeps working to
//    some degree, forever. There is no move he can turn off.
//  · Categories are tracked SEPARATELY. Adapting to punches does nothing about
//    Jogo's fire. That separation is the whole mechanic — the opponent's job
//    is to rotate, and the punishment for mashing one button is that the
//    button stops working.
//
// Sources are tagged at the damage site (`hit.src`) rather than inferred here,
// because only the call site knows whether a given blow was a technique, a
// grab, a summon's bite or a domain's sure-hit.
export const ADAPT = {
  // ~10s is the number that makes the fight feel like it is closing in without
  // ever being unfair: an opponent who rotates has three or four tools, so the
  // same one only comes back around every 30-40s.
  interval: 10,
  rollMin: 0.25,
  rollMax: 0.60,
  cap: 0.88,          // below 100% on purpose — see above
  spinTime: 1.25      // how long the wheel spins before it locks
};

// Display order is HUD order. `jp` rides along because every other callout in
// the game carries one.
export const CATEGORIES = {
  punch: { label: 'PHYSICAL STRIKES', jp: '打撃' },
  ct1: { label: 'CURSED TECHNIQUE I', jp: '術式・壱' },
  ct2: { label: 'CURSED TECHNIQUE II', jp: '術式・弐' },
  ultimate: { label: 'ULTIMATES', jp: '極ノ技' },
  domain: { label: 'DOMAIN EFFECTS', jp: '領域' },
  projectile: { label: 'PROJECTILES', jp: '飛道具' },
  throw: { label: 'THROWS & GRABS', jp: '投げ技' },
  summon: { label: 'SUMMONS', jp: '式神' },
  dot: { label: 'BURN & BLEED', jp: '継続傷' },
  // INSTANT KO (Mahito's transfiguration, Higuruma's execution). The one
  // category whose percentage is NOT a damage reduction — a fraction off a
  // kill is still a kill — so combat/instantko.js reads it as a chance to
  // RESIST outright. It is listed here so it accumulates, caps and displays
  // exactly like the others; only the point of use differs.
  instantKO: { label: 'INSTANT KILLS', jp: '即死' },
  // ---- KASHIMO'S ELECTRICITY ----------------------------------------------
  // ONE category, not four, and that is the opposite call from Toji's tools
  // below — for a reason that is worth stating because the two look similar.
  // Toji's four weapons are four genuinely different WEAPONS that happen to be
  // carried by one man; adapting to a stick should not blunt a katana. Every
  // single thing Kashimo does is the SAME phenomenon arriving in a different
  // shape: the staff string is electrified, the bolt is electricity, the
  // Discharge is electricity, the Arc Dash is him BECOMING electricity. A body
  // that has learned to take a lightning bolt has learned to take all of it,
  // and splitting that into buckets would let Mahoraga stay ignorant of a
  // character whose entire kit is one substance.
  //
  // The consequence in the matchup is real and intended: Mahoraga blunts
  // Kashimo faster than he blunts anybody else, and Kashimo's answer is the
  // one thing electricity cannot be adapted to — the CHARGE curve itself,
  // because adaptation cuts damage and Charge raises it back.
  electric: { label: 'ELECTRICITY', jp: '雷' },
  // ---- PANDA'S THREE CORES ------------------------------------------------
  // THREE SEPARATE CATEGORIES, one per stance — the opposite call from
  // Kashimo's single bucket above, and the same call Toji's four tools get.
  // The test is whether the things are the SAME SUBSTANCE arriving differently
  // (Kashimo: yes, all of it is electricity) or genuinely different things
  // (Toji: a stick is not a katana; Panda: a gorilla's fist is not a
  // triceratops's horn). Splitting them turns the matchup into a stance
  // rotation puzzle, which is the most interesting version of it — and it is
  // the one matchup in the game where the ROTATING side can also choose to
  // stop rotating and spend a core instead.
  panda_core: { label: 'PANDA CORE', jp: '熊猫核' },
  panda_gorilla: { label: 'GORILLA CORE', jp: '猩々核' },
  panda_trike: { label: 'TRICERATOPS CORE', jp: '三角竜核' },
  // ---- TOJI'S CURSED TOOLS ------------------------------------------------
  // FOUR SEPARATE CATEGORIES, one per weapon, rather than one "cursed tools"
  // bucket. That is the deliberate design call: adaptation to Playful Cloud
  // does nothing about the Split Soul Katana, so the matchup becomes a weapon
  // ROTATION PUZZLE — Toji stays ahead of the wheel by cycling tools, and
  // Mahoraga wins by forcing him onto one. A single shared bucket would have
  // made him the easiest character in the game for Mahoraga to shut down, and
  // four buckets is the only version where his kit's breadth is the answer.
  //
  // These sit at the bottom of the list so the HUD order for every existing
  // matchup is byte-for-byte what it was.
  toji_cloud: { label: 'PLAYFUL CLOUD', jp: '游雲' },
  toji_spear: { label: 'INVERTED SPEAR', jp: '天逆鉾' },
  toji_soul: { label: 'SPLIT SOUL KATANA', jp: '釈魂刀' },
  toji_chain: { label: 'CHAIN', jp: '万里ノ鎖' }
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export class Adaptation {
  constructor(cfg = {}) {
    this.cfg = { ...ADAPT, ...cfg };
    this.reduction = new Map();   // src -> 0..cap
    this.stacks = new Map();      // src -> how many times it has adapted
    this.pending = new Set();     // sources that have LANDED since the last one
    this.t = this.cfg.interval;
    this.spin = 0;                // >0 while the wheel is turning
    this.last = null;             // the most recent result, for the callout
  }

  // The number applyHit multiplies incoming damage down by.
  reductionFor(src) {
    if (!src) return 0;
    return this.reduction.get(src) || 0;
  }

  // "he has been hit by this". Called from the damage pipeline for anything
  // that actually made contact — clean hits, armoured hits, blocked hits and
  // damage-over-time ticks all count. Whiffs and i-frames do not.
  mark(src) {
    if (src && CATEGORIES[src]) this.pending.add(src);
  }

  // Per-tick. Returns null on an ordinary tick, or a result object on the
  // frame the interval comes due:
  //   { src, label, jp, gained, total, stacks, capped }  — adapted
  //   { empty: true }                                    — nothing had landed
  //   { starved: true, src, total }                      — everything pending
  //                                                        is already at the cap
  tick(dt, rng = Math.random) {
    if (this.spin > 0) this.spin = Math.max(0, this.spin - dt);
    this.t -= dt;
    if (this.t > 0) return null;
    this.t = this.cfg.interval;

    if (!this.pending.size) return { empty: true };
    const pool = [...this.pending];
    // prefer something that can still improve, so a roll is never wasted on a
    // source that is already pinned at the cap
    const open = pool.filter(s => (this.reduction.get(s) || 0) < this.cfg.cap - 1e-6);
    this.pending.clear();
    if (!open.length) {
      const s = pool[(rng() * pool.length) | 0];
      return { starved: true, src: s, ...CATEGORIES[s], total: this.reduction.get(s) || 0 };
    }
    const src = open[(rng() * open.length) | 0];
    const cur = this.reduction.get(src) || 0;
    const roll = this.cfg.rollMin + rng() * (this.cfg.rollMax - this.cfg.rollMin);
    const total = Math.min(this.cfg.cap, cur + roll);
    const gained = total - cur;
    this.reduction.set(src, total);
    const stacks = (this.stacks.get(src) || 0) + 1;
    this.stacks.set(src, stacks);
    this.spin = this.cfg.spinTime;
    const res = {
      src, ...CATEGORIES[src], gained, total, stacks,
      capped: total >= this.cfg.cap - 1e-6
    };
    this.last = res;
    return res;
  }

  // The persistent HUD list, strongest first.
  list() {
    return [...this.reduction.entries()]
      .map(([src, total]) => ({
        src, total, stacks: this.stacks.get(src) || 1,
        ...CATEGORIES[src],
        capped: total >= this.cfg.cap - 1e-6
      }))
      .sort((a, b) => b.total - a.total);
  }

  // What the opponent should be doing right now: the category he is LEAST
  // adapted to. Used by the CPU and by the debug overlay.
  weakest() {
    let best = null, bv = Infinity;
    for (const k of CATEGORY_KEYS) {
      const v = this.reduction.get(k) || 0;
      if (v < bv) { bv = v; best = k; }
    }
    return best;
  }

  get nextIn() { return Math.max(0, this.t); }
  get progress() { return 1 - this.t / this.cfg.interval; }

  reset() {
    this.reduction.clear();
    this.stacks.clear();
    this.pending.clear();
    this.t = this.cfg.interval;
    this.spin = 0;
    this.last = null;
  }
}
