// Match: two fighters, arena, camera, FX, domains, HUD, CPU — the whole round.
import * as THREE from 'three';
import { Fighter } from '../combat/fighter.js';
// PANDA: the ring / toast tint per core, so the three swaps are visually
// distinct at a glance. Kept next to the match's other presentation constants
// rather than in the character config, because it is a colour choice about
// this screen and not a gameplay number.
const CORE_TINT = { panda: 0xf2f2ec, gorilla: 0xd9a94e, trike: 0xe08aa8 };
import { resolveMelee } from '../combat/hits.js';
import { Effects } from '../combat/effects.js';
import { CPU } from '../combat/ai.js';
import { DomainSystem } from '../domains/domains.js';
import { GambleSystem } from '../domains/jackpot.js';
import { Minions } from '../combat/minion.js';
import { Judgemen } from '../combat/judgeman.js';
import { ShikigamiSystem } from '../combat/shikigami.js';
import { FloraSystem } from '../combat/flora.js';
import { SwarmSystem } from '../combat/swarm.js';
import { CurseSystem } from '../combat/curses.js';
import { FreezeSystem } from '../combat/freeze.js';
import { DomainFX } from '../fx/domainfx.js';
import { NewShadowFx } from '../fx/newshadowfx.js';
// URO's refraction, and DAGON's creatures. See the headers of both: the warp
// system is the only thing in the project that captures the scene to a texture
// and samples it back, and the ocean system is the only summon engine with a
// hard concurrent cap.
import { WarpFX } from '../fx/warpfx.js';
import { OceanSystem } from '../combat/ocean.js';
import { awakenBurst, massField } from '../fx/newfx.js';
import { GarudaSystem } from '../combat/garuda.js';
import { NewShadowSystem } from '../combat/newshadow.js';
import { FXSystem } from '../fx/fx.js';
// CURSED SPEECH — the extruded-kanji layer and the title-card overlay. Both
// are Inumaki's, both are inert when nobody in the match has a voice, and both
// are built unconditionally for the same reason every other system here is:
// a seat can change character between rounds.
import { SpeechFX } from '../fx/speechfx.js';
import { CommandCard } from '../ui/commandcard.js';
import { wheelSnapshot as commandWheelSnapshot } from '../combat/speech.js';
import { BubbleSystem } from '../fx/bubble.js';
import { tauntWeight, pickTaunt } from '../combat/taunts.js';
import { buildMap, applyMapLighting, registerMapGrade, currentQuality, MAP_IDS } from '../arena/index.js';
import { FightCamera } from './camera.js';
import { setXrayFocus, clearXrayFocus } from '../art/shaders/xray.js';
import { Ritual } from './ritual.js';
import { Finishers } from '../finishers/index.js';
import { HUD } from '../ui/hud.js';
import { makeCharacter, pickInfo, hex } from '../characters/index.js';
import { yawBetween, flatDist } from './mathutil.js';
import { emptyFrame } from '../input/input.js';

// A single neutral frame, reused. Online it is what a paused seat and the
// non-fighting phases put on the wire, so the tick stream never has a hole in
// it. Nothing writes to it — it is read-only by convention, and cheaper than
// allocating a frame per tick per seat.
const EMPTY_FRAME = emptyFrame();

// Where each fighter starts. Maps author their own spawns (a station platform
// and a mountain clearing do not want the same opening positions); the ring
// fallback below is what a map gets if it declares none.
export function spawnPoint(i, n, map) {
  if (map?.spawnPoint) return map.spawnPoint(i, n);
  if (n <= 2) return new THREE.Vector3(i === 0 ? -2.4 : 2.4, 0, 0);
  const a = (i / n) * Math.PI * 2;
  const r = n === 3 ? 3.2 : 3.5;
  return new THREE.Vector3(Math.sin(a) * r, 0, Math.cos(a) * r);
}

// action presses buffered through a hitstop freeze
// `backP` rides along because the execution duel asks for all four face
// buttons, and a duel press eaten by a hitstop freeze is a press the player
// made and did not get.
// `copyP` IS THE SPECIAL — it rides the same B button as `backP` now (see the
// binding note in input/input.js). Both are buffered; they are never both live,
// because the duel's fighters are in states that take no gameplay input.
// `tauntP` is deliberately NOT buffered. A taunt is the one input in the game
// that should never come out of a buffer: it is a deliberate, unsafe, socially
// timed press, and one replayed a tenth of a second late — after the hitstop
// that ate it — would be a taunt the player did not choose to be caught in.
const EDGE_KEYS = ['jumpP', 'punchP', 'heavyP', 'ct1P', 'ct2P', 'ultP', 'copyP', 'backP'];

// scratch for the per-eye x-ray focus, written every frame in `render`
const _xrayAt = new THREE.Vector3();

export class Match {
  constructor(stage, input, sfx, picks, uiRoot, opts = {}) {
    this.stage = stage;
    this.input = input;
    this.sfx = sfx;
    this.opts = opts;

    this.mode = picks.mode || 'local'; // 'local' 2P is the default

    // ---- ONLINE ---------------------------------------------------------
    // `net` is a NetMatch (src/net/sync.js) or null. NULL IS THE PATH THAT
    // MUST NEVER REGRESS: every net call below is optional-chained, and with
    // no net object this class behaves exactly as it did before online play
    // existed. See docs/online-multiplayer.md §7.
    this.net = opts.net || null;
    // Seats driven by a device on THIS machine, in view order. Local and VS
    // CPU own every seat they render; online owns only its own. This is the
    // one place in the whole match that knows about locality — the combat
    // layer sees four fighters and cannot tell which are remote.
    this.viewSeats = null;   // filled in below, once playerCount is known
    this.seatView = new Map();
    this.cpuSeats = new Map();   // seat -> CPU, for players who dropped
    this._livenessT = 0;
    // A modal panel (settings) is open over the match. Offline that stops the
    // update entirely; online the match keeps running and the seat is fed
    // neutral input, exactly like the pause menu.
    this.uiModal = false;

    this.root = new THREE.Group();
    this.root.name = 'matchRoot';
    stage.scene.add(this.root);

    // ---- the map ------------------------------------------------------
    // Destruction needs fx/sfx/cam, which do not exist yet — the map is built
    // with the quality profile now and the systems are patched into its
    // destruction context a few lines below, once they do.
    this.quality = currentQuality();
    this.mapId = picks.map && picks.map !== 'random'
      ? picks.map : MAP_IDS[(Math.random() * MAP_IDS.length) | 0];
    this.arena = buildMap(this.mapId, { quality: this.quality });
    this.root.add(this.arena.group);
    stage.scene.fog = this.arena.fog;
    stage.scene.background = new THREE.Color(this.arena.background);
    applyMapLighting(stage, this.arena);
    this.mapGrade = registerMapGrade(this.arena);
    stage.setGrade(this.mapGrade);

    // `picks.chars` is one character id per seat (2-4). The older
    // {p1, p2} shape still works for VS CPU and 2P local.
    const ids = picks.chars || [picks.p1, picks.p2];
    this.playerCount = ids.length;
    const origin = new THREE.Vector3();
    this.fighters = ids.map((id, i) => {
      const c = makeCharacter(id);
      const spawn = spawnPoint(i, ids.length, this.arena);
      const f = new Fighter({
        config: c.config, model: c.model, clips: c.clips,
        index: i, arenaRadius: this.arena.radius, bounds: this.arena.bounds,
        spawn, facing: yawBetween(spawn, origin),
        // the full pick, variant included — the taunt system is the only
        // consumer, and a cosmetic variant can still have its own taunt
        pick: id
      });
      this.root.add(f.model.group);
      return f;
    });
    this.p1 = this.fighters[0];
    this.p2 = this.fighters[1];

    // Which seats this machine renders a camera for, and the reverse lookup.
    this.viewSeats = this.net
      ? this.net.localSeats.slice()
      : this.mode === 'local' ? this.fighters.map((_, i) => i) : [0];
    // A client with no seat of its own (it joined as the match was starting and
    // missed the plan) watches seat 0 rather than rendering nothing. It is a
    // degenerate case the lobby's ready-gate normally prevents, and spectating
    // is a much better failure than a black screen.
    if (!this.viewSeats.length) this.viewSeats = [0];
    this.viewSeats.forEach((seat, v) => this.seatView.set(seat, v));
    // Shared seeds: online every client seeds each fighter's private stream
    // identically, so crits, jackpot tiers and sword rolls agree everywhere.
    if (picks.seed != null) this._seedFighters(picks.seed);

    this.fx = new FXSystem(this.root);
    // Speech bubbles. On the match root so a round teardown takes them with it.
    this.bubbles = new BubbleSystem(this.root, stage.camera);
    for (const f of this.fighters) this.fx.attachShadow(f);
    this.domainfx = new DomainFX(stage.scene, this.arena, this.fx);
    // On the SCENE rather than the match root, like the domain FX above: the
    // circle is a world object standing on the floor, and it has to survive
    // the arena being swapped out from under it when a domain opens — which
    // is exactly the case her whole anti-domain role exists for.
    this.newshadowfx = new NewShadowFx(stage.scene);
    // WARP FX. On the SCENE rather than the match root, because it renders the
    // scene into its own target and a group inside the thing being captured is
    // exactly the feedback loop it exists to avoid. The pre-render hook is how
    // it gets a chance to capture before each eye composites — see
    // core/stage.js.
    this.warpfx = new WarpFX(stage.scene, stage.renderer);
    stage.preRender = cam => this.warpfx.capture(cam);
    // On the MATCH ROOT rather than the scene, like the bubbles above, so a
    // round teardown takes every glyph still in the air with it.
    this.speechfx = new SpeechFX(this.root, stage.camera, this.fx);
    this.effects = new Effects(this);
    this.domains = new DomainSystem(this);
    this.minions = new Minions(this);          // Mahito's transfigured humans
    this.judgemen = new Judgemen(this);        // Higuruma's evidence shikigami
    this.shikigami = new ShikigamiSystem(this); // Megumi's Ten Shadows
    this.ocean = new OceanSystem(this);        // Dagon's sea shikigami
    // Hanami's terrain layer and Kurourushi's swarm. Both own state that
    // outlives the technique that made it — a root field outlives the cast, a
    // roach outlives the wave — so both are match-scoped like the shikigami.
    this.flora = new FloraSystem(this);
    this.swarms = new SwarmSystem(this);
    // GETO'S STABLE and NAOYA'S FREEZE. The curse system is the THIRD summon
    // system that can be live at once (Megumi's shikigami and Mahito's
    // transfigured human are the other two) — see the cross-check in
    // combat/curses.js for how the three share a field without any of them
    // having to know about the others' internals.
    this.curses = new CurseSystem(this);
    // ---- THE TWO NEW SYSTEMS ----------------------------------------------
    // GARUDA is the FOURTH ally system, and the only one whose occupant is
    // never summoned and never lost — see combat/garuda.js for what that
    // changes. NEW SHADOW is Miwa's Simple Domain zone, which is a separate
    // thing from the universal `simpleDomain` STATE the domain system already
    // owns and does not touch it.
    this.garuda = new GarudaSystem(this);
    this.newshadow = new NewShadowSystem(this);
    this.freeze = new FreezeSystem(this);
    // Hakari's reach scenarios and JACKPOT. Owned by the match rather than by
    // the domain system because Jackpot outlives the barrier that starts it.
    this.gamble = new GambleSystem(this);
    // Local VS: one over-the-shoulder camera per human seat (2 up, or a 2x2
    // grid for 3-4). VS CPU: one full-screen camera behind P1.
    // ONE VIEW PER LOCALLY-DRIVEN SEAT. Local VS splits for everyone at the
    // couch; online splits only for the people at THIS couch, which is what
    // makes two-on-two across two machines render as two halves each rather
    // than four quarters.
    this.cams = [];
    const views = this.viewSeats.length;
    stage.setViews(views);
    for (let i = 0; i < views; i++) {
      this.cams.push(new FightCamera(i === 0 ? stage.camera : stage.cameraFor(i), 'follow'));
    }
    if (views >= 2) {
      // quarter-screen cells are much narrower than halves — pull in further
      const ds = views >= 3 ? 0.76 : 0.84;
      for (const c of this.cams) { c.distScale = ds; c.pitch = 0.19; }
    }
    this.cam = this.cams[0];
    this.cam.links = this.cams.slice(1); // shakes/cut-ins fan out to every view
    // interiors and tight corridors: every camera collides with the map so it
    // cannot end up inside a wall or outside the building
    for (const c of this.cams) c.bounds = this.arena.bounds;
    // hand the destruction system the combat services it was built without
    Object.assign(this.arena.destruct.ctx, { fx: this.fx, sfx: this.sfx, cam: this.cam, stage });
    this.cam2 = this.cams[1] || null;
    this.cpu = this.mode === 'cpu' ? new CPU(this.p2, this.p1, this) : null;

    // MEGUMI'S SUMMON RITUAL. Owns its own clock, camera and overlay; while it
    // is running the logic tick does not run at all, so the opponent is frozen.
    this.uiRoot = uiRoot;
    this.ritual = new Ritual(this, uiRoot);

    this.hud = new HUD(uiRoot);
    // The title card lives on the HUD's own root so `hud.setHidden` takes it
    // with everything else — a finisher cinematic must show nothing but the
    // scene, and a command card left up over one would be the exception that
    // proves the switch does not work.
    this.commandCard = new CommandCard(this.hud.el);
    // FINISHERS. Like the ritual above: its own clock, camera and overlay, and
    // while it runs no logic tick happens at all. It is offered the match-
    // ending KO in _koFlow and declines silently if the winner has no finisher
    // or the feature is switched off, in which case nothing here changes.
    this.finishers = new Finishers(this, uiRoot);
    this.hud.shikigami = this.shikigami;
    this.hud.curses = this.curses;
    this.hud.domains = this.domains;
    this.hud.gamble = this.gamble;
    this.hud.flora = this.flora;
    this.hud.swarms = this.swarms;
    // GARUDA JOINS THE FIELD HERE, before the first frame, because it is not
    // summoned — it has been with her the whole time and the round opening
    // should show that. `ensure` is idempotent and a no-op for anyone whose
    // config does not declare a partner.
    for (const f of this.fighters) this.garuda.ensure(f);
    this.hud.setFighters(this.fighters);
    this.hud.setSplit(this.viewSeats.length >= 2 ? this.viewSeats.length : 0);

    this.phase = 'intro';
    this.phaseT = 0;
    this.timeScale = 1;
    this.hitstopFrames = 0;
    this.slowmoT = 0;        // sword-roll reveal beat: brief slow motion
    this.slowmoScale = 1;
    this.slowAcc = 0;
    this.inputs = new Map();
    this.edgeBuffer = [];    // presses made during hitstop, per seat
    this.chargedAuras = new Map();
    this.winner = null;
    this.paused = false;
    this.round = 1;
    this.matchOver = false;
    this.music = opts.music;
    this.onResult = opts.onResult || (() => { });
    this._resultFired = false;
    const lives = opts.lives ?? 3;
    for (const f of this.fighters) {
      f.lives = f.maxLives = lives;
      f.anim.play('idle');
      f.setState('intro', {});
    }
    this.cam.cinematic(new THREE.Vector3(0, 0, 0), 1.7, 6.5, 2.2);
    this.hud.message('READY', 0.9);
    this.sfx.ready();
    this.sfx.startWind();
    this.music?.play('fight', { restart: true });
  }

  // The fighter everything targets: the NEAREST living opponent. With two
  // fighters that is simply "the other one", so 1v1 is unchanged; with three
  // or four it is what makes techniques, the soft lock and the cameras all
  // agree on who you are currently fighting.
  other(f) {
    let best = null, bd = Infinity, fallback = null;
    for (const o of this.fighters) {
      if (o === f) continue;
      if (!fallback || (fallback.eliminated && !o.eliminated)) fallback = o;
      if (!o.alive || o.eliminated) continue;
      const d = flatDist(f.pos, o.pos);
      if (d < bd) { bd = d; best = o; }
    }
    return best || fallback;
  }
  livingCount() { return this.fighters.reduce((n, f) => n + (f.alive ? 1 : 0), 0); }
  // everyone still in the match (knocked down this round is fine; out of
  // stocks is not) — the combat loops run over these
  get activeFighters() { return this.fighters.filter(f => !f.eliminated); }
  inputFor(f) { return this.inputs.get(f); }
  ctxFor(f) {
    return {
      opponent: this.other(f),
      domains: this.domains,
      effects: this.effects,
      // With the opponent lock OFF the stick becomes camera-relative, so the
      // fighter needs its own seat's VIEW heading. Locked, this is ignored.
      // `moveYaw`, not `yaw` — see the getter: `yaw` points at the camera.
      camYaw: this.camFor(f)?.moveYaw ?? 0,
      fx: this.fx, sfx: this.sfx, match: this
    };
  }
  // The camera that belongs to a seat. Seats are GLOBAL (0..3) and views are
  // LOCAL (0..n-1); online those two numberings differ, so every camera lookup
  // goes through `seatView` and none of them index `cams` by seat.
  camFor(f) { return this.cams[this.seatView.get(f.index) ?? 0] || this.cams[0]; }

  // Seeds every fighter's private random stream off one match seed. Called
  // once at construction and again each round, so a rematch or a round two is
  // not a replay of round one.
  _seedFighters(seed, round = 1) {
    const base = (seed | 0) ^ (round * 0x2545f491);
    this.fighters.forEach((f, i) => f.reseed?.(base ^ Math.imul(i + 1, 0x9e3779b1)));
    this.matchSeed = seed | 0;
  }
  hitstop(frames) { this.hitstopFrames = Math.max(this.hitstopFrames, frames); }
  slowmo(dur, scale = 0.35) { this.slowmoT = Math.max(this.slowmoT, dur); this.slowmoScale = scale; }

  // 'follow' = over-the-shoulder (every view, always). 'shared' still exists
  // in FightCamera but nothing selects it — the domain clash used to, and now
  // stays on the normal follow camera.
  setCameraMode(mode) {
    for (const c of this.cams) c.mode = mode;
  }

  // How the local input manager should be driven. Online with a single local
  // seat wants VS CPU's keyboard layout (arrows steer the camera); two or more
  // local seats want the split keyboard, exactly as a couch match does.
  get inputMode() {
    if (!this.net) return this.mode;
    return this.viewSeats.length >= 2 ? 'local' : 'cpu';
  }

  update(dt) {
    const seats = Math.max(2, this.viewSeats.length);
    const { all } = this.input.pollAll(this.inputMode, seats);
    if (all.some(f => f.pauseP)) { this.opts.onPause?.(); if (!this.net) return; }
    // ONLINE NEVER STOPS. One player's pause menu must not freeze three other
    // people's match, so the tick keeps running behind it and the pausing
    // seat is fed neutral input in _logicTick. Offline, pause is a real stop.
    if (this.paused && !this.net) return;
    if (this.net) {
      // ABOVE every early return below. The ritual, a finisher and a long
      // hitstop all stop the logic tick — and with it the input stream — for
      // seconds at a time, and silence is indistinguishable from a dropped
      // connection unless something keeps talking.
      this.net.keepAlive();
      this._netFlow();
    }
    // THE RITUAL owns everything while it plays. No logic tick runs, so no
    // fighter can act and no timer advances — the opponent is genuinely
    // frozen, and it is driven from render() on real frame time.
    if (this.ritual.active) { this.hud.update(dt, null); return; }
    // ...and so does a FINISHER. No logic tick, no phase clock, no HUD tick —
    // the HUD is hidden for the duration and there is nothing left to fight.
    if (this.finishers.active) return;
    if (all.some(f => f.selectP) && !this.paused) this.opts.onLegend?.();
    this.phaseT += dt;

    if (this.phase === 'intro') {
      if (this.phaseT > 1.0 && this.phaseT - dt <= 1.0) { this.hud.message('FIGHT', 0.7); this.sfx.fight(); }
      if (this.phaseT > 1.25) {
        this.phase = 'fight';
        for (const f of this.fighters) f.setState('idle', { clip: 'idle' });
      }
      this.hud.update(dt, null);
      return;
    }

    if (this.phase === 'result') {
      // The win pose and its bubble both live PAST this return — the result
      // screen is exactly where the player sits and looks at them. Ticking the
      // taunt flow and the bubbles here is what makes that true; the first
      // version of this returned before both and the automatic victory taunt
      // silently never fired at all (its timer froze at 1.22 s of a 1.9 s gate,
      // which is precisely how long `ko` lasts before it hands over).
      this._winTauntFlow();
      this._tickFlourish(dt);
      this.bubbles.update(dt);
      this.hud.update(dt, null);
      return;
    }

    // hitstop: freeze combat logic, keep presentation alive
    if (this.hitstopFrames > 0) {
      this.hitstopFrames--;
      this.timeScale = 0.05;
      // Nothing ticks while the frame is frozen, but the polling above still
      // consumes press edges — so a button hit during the freeze would vanish.
      // Hold those edges and hand them to the first live tick. Without this the
      // tech is impossible: the knockdown's own hitstop eats the jump.
      this._bufferEdges(all);
      this.hud.update(dt, this.domains.state, this.domains.clashState, this.domains.duelState, this.domains.trialState);
      return;
    }
    this._applyBufferedEdges(all);
    if (this.slowmoT > 0) this.slowmoT -= dt;
    this.timeScale = this.phase === 'ko'
      ? (this.phaseT < 1.1 ? 0.3 : 1)
      : (this.slowmoT > 0 ? this.slowmoScale : 1);

    // fractional logic rate during slow motion
    this.slowAcc += this.timeScale;
    while (this.slowAcc >= 1) {
      this.slowAcc -= 1;
      this._logicTick(all);
    }
    this.hud.update(dt, this.domains.state, this.domains.clashState, this.domains.duelState, this.domains.trialState);
  }

  // press edges that survive a hitstop freeze (see update)
  _bufferEdges(frames) {
    frames.forEach((f, i) => {
      const b = this.edgeBuffer[i] || (this.edgeBuffer[i] = {});
      for (const k of EDGE_KEYS) if (f[k]) b[k] = true;
    });
  }
  _applyBufferedEdges(frames) {
    frames.forEach((f, i) => {
      const b = this.edgeBuffer[i];
      if (!b) return;
      for (const k of EDGE_KEYS) if (b[k]) f[k] = true;
      this.edgeBuffer[i] = null;
    });
  }

  _logicTick(frames) {
    const fight = this.phase === 'fight';

    // ONLINE: the tick opens by applying whatever arrived since the last one —
    // snapshots first, then each remote seat's jitter buffer steps forward by
    // one. Nothing here blocks or allocates; see net/sync.js.
    if (this.net) {
      this.net.beginTick(this);
      this._netLiveness();
    }

    // Seat 0..n-1 take their own frame. VS CPU: seat 1 is the bot. Online: a
    // locally-owned seat takes its device's frame (ZERO added latency — this
    // is the whole point), a dropped seat takes the CPU that inherited it, and
    // everyone else replays their owner's transmitted input.
    this.fighters.forEach((f, i) => {
      let inp = null;
      if (fight) {
        if (this.net) {
          if (this.net.isLocalSeat(i)) {
            // A local seat whose player is staring at the pause menu is fed
            // neutral input rather than the menu's own presses.
            const away = this.paused || this.uiModal;
            inp = away ? null : (frames[this.net.deviceFor(i)] || null);
            this.net.recordLocal(i, away ? EMPTY_FRAME : (frames[this.net.deviceFor(i)] || frames[0]));
          } else if (this.cpuSeats.has(i)) {
            inp = this.cpuSeats.get(i).frame();
          } else {
            inp = this.net.inputFor(i);
          }
        } else {
          inp = (this.mode === 'cpu' && i === 1) ? this.cpu.frame() : (frames[i] || null);
        }
      } else if (this.net && this.net.isLocalSeat(i)) {
        // Keep the outgoing stream continuous through the intro and the KO, so
        // the tick numbering on both ends never develops a hole.
        this.net.recordLocal(i, EMPTY_FRAME);
      }
      this.inputs.set(f, inp);
    });
    for (const f of this.fighters) f.update(this.inputs.get(f), this.ctxFor(f));

    // a fighter whose HP hit zero while the round carries on (3-4 players)
    // drops here and stays down for the rest of the round
    if (fight) this._reapDead();

    // separate overlapping fighters — every pair, not just the 1v1. Bodies on
    // the floor are scenery: nobody shoves them around and nobody hits them.
    const live = this.activeFighters.filter(f => f.alive);
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j];
        const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
        const d = Math.hypot(dx, dz);
        // separation scales with the bodies involved: two humans keep the
        // original 0.8 m, and nobody stands inside Mahoraga's chest
        // ...and with growth: a stage-3 Kurourushi occupies more floor than a
        // fresh one, so `hurtBox.push` is the scaled radius rather than the
        // config's raw one.
        const sep = Math.max(a.hurtBox.push, 0.4) + Math.max(b.hurtBox.push, 0.4);
        if (d < sep && d > 1e-4) {
          const push = (sep - d) / 2;
          const nx = dx / d, nz = dz / d;
          // MASS. kbResist doubles as a mass term: the heavier body gives less
          // ground, and the two shares always add back up to the overlap.
          // Equal weights reproduce the original even split exactly.
          const ma = 1 / (a.cfg.kbResist ?? 1), mb = 1 / (b.cfg.kbResist ?? 1);
          const sa = 2 * mb / (ma + mb), sb = 2 * ma / (ma + mb);
          a.pos.x -= nx * push * sa; a.pos.z -= nz * push * sa;
          b.pos.x += nx * push * sb; b.pos.z += nz * push * sb;
        }
      }
    }

    if (fight) {
      // an active swing can connect with ANY other fighter — free-for-all
      for (const a of live) {
        for (const b of live) if (a !== b) resolveMelee(this, a, b);
      }
      this.effects.update(1 / 60);
      // CURSED SPEECH ON THE LOGIC TICK, NOT THE RENDER TICK. This was in
      // `render` beside fx.update and domainfx.update, where every other
      // visual system lives, and it was WRONG — a command's payload fires from
      // the SpeechFX arrival callback, so putting the glyph flight on the
      // render clock made a gameplay effect depend on frame rate. The bug it
      // actually produced in testing: with the tab hidden and rAF throttled,
      // commands were spoken, the throat was charged, and nothing ever
      // resolved. The same hole is reachable in a shipped build during a
      // ritual or a finisher, both of which keep rendering while the logic
      // tick is suspended — a word in flight would have arrived mid-cinematic.
      //
      // On the fixed 1/60 step the flight time, the constrict half-beat and
      // the payload are all frame-rate independent, like every other timed
      // entity in the game.
      this.speechfx.update(1 / 60);
      this.minions.update(1 / 60);
      this.judgemen.update(1 / 60);
      this.shikigami.update(1 / 60);
      this.ocean.update(1 / 60);
      this.flora.update(1 / 60);
      this.swarms.update(1 / 60);
      this.curses.update(1 / 60);
      // Garuda ticks with the other allies. Miwa's circle ticks AFTER them,
      // so a projectile spawned this frame is already in the entity list when
      // the boundary check runs and gets cut on the frame it crosses rather
      // than on the next one.
      this.garuda.update(1 / 60);
      this.newshadow.update(1 / 60);
      // THE GRAVITATIONAL LATTICE. Emitted on a slow cadence rather than every
      // frame — it is a persistent tell, and spawning three torus meshes at
      // 60 Hz would be the most expensive thing in the project for something
      // the player reads as one continuous object.
      for (const f of this.activeFighters) {
        if (!f.cfg.mass || !f.alive) continue;
        f._massFxT = (f._massFxT ?? 0) - 1 / 60;
        if (f._massFxT <= 0) {
          f._massFxT = 0.16;
          massField(this.fx, f, (f.mass ?? 0) / f.cfg.mass.max, 0x6f7fd0);
        }
      }
      // ticked AFTER every damage source, so a freeze applied this frame gets
      // a full second rather than a second minus the frame it landed on
      this.freeze.update(1 / 60);
      this.domains.update(1 / 60, this.inputs);
      // ticked OUTSIDE the domain system on purpose: the 99-second Jackpot
      // window has to keep running after domains.update has torn its own
      // barrier down, and this is the only loop that survives that
      this.gamble.update(1 / 60);
    }

    for (const f of this.fighters) this._drainEvents(f);
    // OUTSIDE the `fight` gate: a bubble has to keep living, following its
    // owner and fading on its own clock through the KO flow and the victory
    // pose, which are exactly the moments the fight loop has stopped running.
    this.bubbles.update(1 / 60);
    this._tickFlourish(1 / 60);
    this._chargedAuras();

    // Round ends when at most one fighter is still standing. ONLINE: only the
    // host may declare it — a guest racing the host on its own local HP would
    // decrement lives twice. The guest applies the host's `ko` instead.
    if (fight && this.livingCount() <= 1 && (!this.net || this.net.mayStartKO())) {
      this._startKO();
      this._emitKO();
    }
    if (this.phase === 'ko') this._koFlow();
    this._winTauntFlow();
    if (this.viewSeats.length > 2) this._seatStatus();
    if (this.net) this.net.endTick(this);
  }

  // ---- ONLINE: flow authority ---------------------------------------------
  // Host side. Everything downstream of the KO instant is a pure clock, so
  // sharing that one instant (plus the resulting lives and the finisher roll)
  // is enough to keep every screen on the same beat.
  _emitKO() {
    if (!this.net || !this.net.isHost) return;
    this.net.emitKO({
      down: this.fighters.map((f, i) => (f.res.hp <= 0 ? i : -1)).filter(i => i >= 0),
      lives: this.fighters.map(f => f.lives),
      winner: this.fighters.indexOf(this.winner)
    });
  }

  _netFlow() {
    const msgs = this.net.takeFlow();
    if (!msgs) return;
    for (const m of msgs) if (m.k === 'ko') this._applyNetKO(m);
  }

  _applyNetKO(m) {
    if (this.phase === 'ko' || this.phase === 'result' || this.matchOver) return;
    // Force the fallers down first, so _startKO's own bookkeeping (poses, FX,
    // the closing shot) runs through the game's normal path rather than being
    // reproduced here.
    for (const i of m.down || []) { const f = this.fighters[i]; if (f) f.res.hp = 0; }
    this._startKO();
    if (Array.isArray(m.lives)) m.lives.forEach((lv, i) => { if (this.fighters[i]) this.fighters[i].lives = lv; });
    this.matchOver = this.fighters.filter(f => f.lives > 0).length <= 1;
    if (m.winner >= 0 && this.fighters[m.winner]) this.winner = this.fighters[m.winner];
    if (typeof m.fin === 'number') this.net.finRoll = m.fin;
  }

  // ---- ONLINE: liveness ----------------------------------------------------
  // Checked eight times a second, not every tick: this walks a handful of
  // peers and pushes DOM-facing strings, and neither belongs in the hot path.
  _netLiveness() {
    if (++this._livenessT < 8) return;
    this._livenessT = 0;
    this.net.tickLiveness();
    for (const st of this.net.liveness()) {
      if (st.lost && !this.cpuSeats.has(st.seat)) this._cpuTakeover(st.seat, 'DISCONNECTED');
    }
    const notices = this.net.takeNotices();
    if (notices) for (const n of notices) {
      const f = this.fighters[n.seat];
      if (!f) continue;
      if (n.kind === 'back' && this.cpuSeats.has(n.seat)) {
        // They came back. Handing the seat straight back to its owner is the
        // whole point of keeping the match running through a drop.
        this.cpuSeats.delete(n.seat);
        this.hud.toast(f, 'RECONNECTED');
        this.opts.onNetNotice?.(f.cfg.name + ' RECONNECTED', 'good');
      }
    }
  }

  // A player who is gone hands their fighter to the CPU rather than leaving a
  // statue in the arena. The match carries on, which is the only outcome that
  // is fair to everyone still playing.
  _cpuTakeover(seat, why) {
    const f = this.fighters[seat];
    if (!f || this.cpuSeats.has(seat) || this.net?.isLocalSeat(seat)) return;
    this.cpuSeats.set(seat, new CPU(f, this.other(f) || this.p1, this));
    // The chip rides the fighter's own plate; the sentence goes to the single
    // online message channel, so every online event reads the same way
    // wherever the player happens to be looking.
    this.hud.toast(f, 'CPU');
    this.opts.onNetNotice?.(f.cfg.name + ' ' + why + ' — CPU TOOK OVER', 'bad');
  }

  // Free-for-all: someone runs out of HP but two or more fighters are still
  // up, so the round continues without them. They play the defeat animation,
  // lock into the 'ko' state (which takes no input and runs no state logic)
  // and lie there until the round is over. In 1v1 nothing changes — the round
  // is ending on this same tick, so _startKO owns the death.
  _reapDead() {
    if (this.livingCount() <= 1) return;
    for (const f of this.activeFighters) {
      if (f.alive || f.state === 'ko') continue;
      f.res.hp = 0;
      f.vel.set(0, 0, 0);
      f.activeHit = null;
      f.move = null;
      f.iFrames = 0;
      f.setState('ko', { clip: f.anim.has('defeat') ? 'defeat' : 'ko', fade: 0.12 });
      // a domain does not outlive its caster
      if (this.domains.isMyDomain?.(f)) this.domains.dismiss(f);
      this.fx.koBurst(f.pos.clone());
      this.sfx.ko();
      this.cam.shake(0.45);
      this.stage.flash(0.35);
      this.hud.toast(f, 'DOWN');
      this.hud.message(f.cfg.name + ' IS DOWN', 1.1);
    }
  }

  // Split-screen cell labels: who is dead, who is only watching. Indexed by
  // VIEW, not by seat — online this machine may be rendering seats 2 and 3.
  _seatStatus() {
    this.viewSeats.forEach((seat, v) => {
      const f = this.fighters[seat];
      if (!f) return;
      this.hud.setSeatStatus(v, f.eliminated ? 'SPECTATING' : !f.alive ? 'DOWN' : '');
    });
  }

  // Whose shoulder a dead or eliminated seat rides: the living fighter nearest
  // to where they fell, so the view stays on the fight instead of a corpse.
  _spectateTarget(f) {
    let best = null, bd = Infinity;
    for (const o of this.fighters) {
      if (o === f || !o.alive || o.eliminated) continue;
      const d = flatDist(f.pos, o.pos);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  _drainEvents(f) {
    for (const e of f.events) {
      switch (e.type) {
        case 'jump': this.sfx.jump(); this.fx.jumpPuff(f.pos.clone()); break;
        case 'land': this.sfx.land(); break;
        case 'dashBurst':
          // the push-off, on top of the dash's own sound and trail
          this.sfx.dashBurst();
          this.fx.dashBurst(f, f.dashBurstDir);
          break;
        case 'dash':
          this.sfx.dash();
          this.fx.dashTrail(f);
          // Jogo: the dash leaves burning ground in his wake
          if (f.cfg.dashFire) this.effects.startBurnTrail(f);
          break;
        // ---- URO ----------------------------------------------------------
        case 'reflectStart':
          this.sfx.skyReflectUp?.();
          break;
        case 'reflectUp':
          // THE SURFACE. It materializes on the frame the window actually
          // opens rather than on the input, so what the opponent sees IS the
          // active window — the tell and the hitbox are the same object.
          this.warpfx.reflectSurface(f, (f.cfg.special.reflect?.active ?? 20) / 60 + 0.10);
          break;
        case 'reflectDown':
          this.sfx.skyReflectDown?.();
          break;
        case 'skyReflected':
          this.hud.cutin(f, 'SKY MANIPULATION', 'SKY REFLECT  天逆鉾');
          break;
        case 'hoverStart':
          this.sfx.hoverStart?.();
          break;
        case 'hoverDrop':
          // out of stamina, out of the sky. Loud on purpose: it is the whole
          // counterplay to the character and the opponent should hear it land.
          this.sfx.hoverDrop?.();
          this.hud.toast(f, 'OUT OF SKY');
          break;
        // ---- DAGON --------------------------------------------------------
        case 'summonCapped':
          this.hud.toast(f, 'ONE AT A TIME — OUTSIDE THE DOMAIN');
          break;
        case 'overheatStart':
          this.hud.cutin(f, 'DISASTER FLAMES', 'OVERHEAT  奰');
          this.cam.shake(0.3);
          break;
        case 'overheatEnd': this.hud.toast(f, 'OVERHEAT ENDS'); break;
        // ---- TAUNTS -------------------------------------------------------
        // Deliberately quiet in the HUD. A taunt gets a sound and, if it has
        // one, a bubble — no toast, no cut-in, no message bar. It is not an
        // event the fight needs announced, and putting it through the same
        // furniture as a domain cast would make a joke look like a mechanic.
        case 'tauntStart':
          this.sfx.taunt(e.def.cue);
          this._tauntFlourish(f, e.def);
          break;
        case 'tauntSay':
          this.bubbles.say(f, e.def.say, {
            hold: e.def.hold ?? 1.3, accent: hex(pickInfo(f.pick)?.accent ?? 0xffffff),
            // split-screen: billboard to the taunting seat's own eye
            cam: this.cams[f.index]?.cam
          });
          break;
        // Cut, cancelled or finished, the bubble goes. `tauntBreak` is the
        // interruption (a hit landed) and kills it on the spot; a completed
        // taunt lets the bubble ride out its own fade, which is why `tauntEnd`
        // does nothing here.
        case 'tauntBreak':
          if (!e.completed) this.bubbles.cut(f);
          // INUMAKI: the collar goes back up whether the taunt finished or was
          // cut in half, and the queued drop is cancelled so a taunt punished
          // on frame two cannot open his collar a beat later on a body that is
          // by then on the floor.
          this._pendingCollar = null;
          if (f.cfg.throat) { f.model.setCollar?.(0); f.model.setMarks?.(false); }
          break;
        case 'tauntCancel': this.bubbles.cut(f); break;
        case 'minionAlive':
          this.hud.toast(f, (e.cap ?? 3) + ' IS ALL HE CAN HOLD');
          this.sfx.noCE();
          break;
        // ---- SUKUNA -------------------------------------------------------
        case 'fingerStart':
          // the vulnerable second, announced so the opponent knows to punish it
          this.hud.cutin(f, 'CONSUME A FINGER', '宿儺の指');
          this.hud.message('HE IS OPEN', 0.9);
          this.cam.shake(0.25);
          break;
        case 'noFingers': this.hud.toast(f, 'NO FINGERS LEFT'); this.sfx.noCE(); break;
        case 'fireArrowCharge':
          this.hud.cutin(f, 'FIRE ARROW', '開  —  CHARGING');
          this.hud.message('開 FIRE ARROW — CHARGING', 1.3);
          this.sfx.fireCharge();
          this.cam.fovKick(5);
          break;
        case 'fireArrowRelease': this.cam.shake(0.5); break;
        case 'fireArrowCancel':
          // A cancel costs him only the frames — no cursed energy was ever
          // committed to the charge. Reported, because "he was going to and
          // then didn't" is the whole mind game and both players should see it.
          this.hud.toast(f, e.reason === 'noCE' ? 'NOT ENOUGH CE'
            : e.reason === 'fizzle' ? 'FIRE ARROW FIZZLED' : 'FIRE ARROW CANCELLED');
          this.sfx.fireCancel();
          break;
        // ---- HIGURUMA -----------------------------------------------------
        case 'judgemanAlive': this.hud.toast(f, 'JUDGEMAN IS ALREADY WATCHING'); this.sfx.noCE(); break;
        case 'confiscated': {
          // the seizure is announced on the VICTIM's plate, because it is
          // their button that has gone and they are the one who needs to know
          const label = { ct1: 'RB', ct2: 'RT', special: 'B' }[e.slot] || e.slot;
          this.hud.toast(f, label + ' CONFISCATED');
          this.hud.message('没収 — ' + label + ' SEIZED', 1.1);
          break;
        }
        case 'confiscationEnds': this.hud.toast(f, 'RETURNED'); break;
        case 'slotLocked': this.hud.toast(f, 'CONFISCATED — NOT YOURS'); this.sfx.noCE(); break;
        case 'swordOnly':
          // X and Y are dead while he holds the blade. Said once, so the
          // two-button rule reads as a rule rather than as dropped inputs.
          if (!f._swordOnlyToast) {
            f._swordOnlyToast = true;
            this.hud.toast(f, 'RB SLASH · RT EXECUTION');
          }
          this.sfx.noCE();
          break;
        case 'execSpent': this.hud.toast(f, 'ONE SENTENCE PER COURTROOM'); this.sfx.noCE(); break;
        case 'judgmentSlash': this.sfx.whiff(); break;
        case 'executionSwing':
          // the wind-up is meant to be seen: it gets its own callout
          this.hud.toast(f, '死刑執行 — EXECUTION');
          this.cam.shake(0.15);
          break;
        case 'swing': this.sfx.whiff(); break;
        // ---- HANAMI --------------------------------------------------------
        case 'terrainChange': {
          // Both players get told. The opponent needs this more than Hanami
          // does — it is the difference between trading with him and running.
          const nat = e.kind !== 'artificial';
          this.hud.toast(f, nat
            ? (e.kind === 'field' ? '花畑 — HIS GROUND' : '土 — NATURAL GROUND')
            : '人工 — DEAD GROUND');
          if (nat) this.fx._ring(f.pos.clone().setY(f.pos.y + 0.05), 0x7fc46a,
            { size: 0.4, growRate: 4, life: 0.5 });
          break;
        }
        case 'rootFieldStart':
          this.hud.cutin(f, 'DISASTER PLANTS', 'ROOT FIELD  花畑');
          break;
        case 'fireWeak':
          // said ONCE, the first time fire lands on him — the matchup is meant
          // to be legible, not a mystery about why the bar moved that far
          this.hud.toast(f, '火に弱い — WEAK TO FIRE');
          this.hud.message('HANAMI BURNS', 0.9);
          break;
        // ---- KUROURUSHI ----------------------------------------------------
        case 'growth': {
          this.hud.cutin(f, '暴食 GLUTTONY', 'STAGE ' + e.stage + ' / ' + e.of);
          this.hud.message('HE IS BIGGER', 1.0);
          this.sfx.growl(e.stage);
          this.cam.shake(0.5);
          this.cam.fovKick(6);
          this.stage.flash(0.22);
          this.slowmo(0.25, 0.5);
          this.camFor(f)?.applySubject?.(f);
          break;
        }
        case 'devourStart':
          this.sfx.lunge?.();
          this.cam.fovKick(4);
          break;
        case 'devourWhiff':
          this.hud.toast(f, 'NOTHING IN THE MAW');
          break;
        case 'selfDevourStart':
          this.hud.toast(f, '自食 — EATING HIS OWN');
          break;
        case 'meltEnds':
          this.hud.toast(f, 'GUARD RECOVERS');
          break;
        case 'heavyStart':
          this.sfx.whiff();
          this.sfx.cleave(false);
          // A HEAVY SWING TEARS UP A ROOT FIELD. The counterplay the brief
          // asks for, on the same event the shadow push already uses — the
          // two open-ground techniques answer to the same button.
          this.flora.damageFieldsAt(f.pos, (f.cfg.heavy?.reach ?? 2) + 0.8, 'heavy');
          // COUNTERPLAY to Chimera Shadow Garden: a heavy swing shoves the
          // sea of shadow back locally, carving a hole to stand in. Barrier
          // Break has nothing to chip against an open domain, so this is the
          // in-domain out.
          this.domains.pushShadow(f.pos.clone(), f);
          break;
        // ---- CHOSO ---------------------------------------------------------
        case 'redScaleStart':
          // the vulnerable channel, announced. The opponent gets the same
          // warning Sukuna's finger already gives them: he is open, go.
          this.hud.cutin(f, 'BLOOD MANIPULATION', '赤鱗躍動  FLOWING RED SCALE');
          this.hud.message('HE IS OPEN', 0.8);
          this.cam.shake(0.22);
          break;
        case 'redScaleEnd':
          // it simply runs out. No recoil, no rent, no health taken — the one
          // thing this character must never do is cost himself HP.
          this.hud.toast(f, '赤鱗躍動 ENDS');
          break;
        case 'redScaleUp': this.hud.toast(f, 'ALREADY BOILING'); this.sfx.noCE(); break;
        case 'piercingLoad':
          // the load on Piercing Blood. This is the reactable half of the move
          // and it gets a real announcement, because a 28-frame telegraph
          // nobody notices is not a telegraph.
          this.hud.toast(f, '穿血 — PIERCING BLOOD');
          this.sfx.bloodCharge();
          this.cam.fovKick(3);
          break;
        case 'noBlood':
          this.hud.toast(f, '血 ' + Math.round(e.have) + '/' + Math.round(e.need));
          this.sfx.noCE();
          break;
        case 'bloodFull': this.hud.toast(f, '血 FULL'); break;
        // ---- NOBARA --------------------------------------------------------
        case 'essence':
          // Only reported when a chunk worth noticing arrives — a jab's 2.4
          // would toast on every hit of every string and drown the plate. The
          // bar itself carries the small numbers.
          if (e.amount >= 6) {
            this.hud.toast(f, '依代 +' + Math.round(e.amount));
            this.fx._ring(f.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), 0xf0e2b8,
              { size: 0.3, growRate: 5, life: 0.25, flat: false });
          }
          break;
        case 'noEssence':
          this.hud.toast(f, '依代 ' + Math.round(e.have) + '/' + Math.round(e.need));
          this.sfx.noCE();
          break;
        case 'resonanceChannel': {
          // THE TELL. Loud on purpose: this is the one warning an opponent
          // gets that an unblockable, undodgeable hit is coming, and the sound
          // and the callout both scale with how much is going into it.
          const k = Math.min(1, e.essence / (f.cfg.essence?.max ?? 100));
          this.sfx.resonanceCharge(k);
          this.hud.techFlash('共鳴 RESONANCE — ' + Math.round(e.essence) + ' 依代', 0xf0e2b8);
          this.hud.toast(f, 'CHANNELING');
          if (k > 0.5) this.cam.fovKick(4);
          break;
        }
        case 'bfStrikeStart': this.sfx.hammer(false); break;
        case 'bfWindow': break;   // the shared `bfTell` event owns the flash
        case 'bfStrikeWhiff': this.hud.toast(f, 'MISSED'); break;
        case 'noStamina': this.sfx.noCE(); break;
        case 'quickRise':
          // landing on your feet: puff, a snap of speed, and the callout
          this.sfx.dash();
          this.sfx.techReveal(880);
          this.fx.jumpPuff(f.pos.clone());
          this.hud.toast(f, 'TECH');
          this.cam.shake(0.12);
          break;
        case 'guardBreak': this.hud.toast(f, 'GUARD BREAK'); break;
        case 'copied': this.sfx.copied(); this.hud.toast(f, 'COPIED: ' + e.name); break;
        case 'noCE': this.sfx.noCE(); break;
        case 'swordPickup':
          // pickup snap: blade-draw sound, small camera kick, CE tracing the edge
          this.sfx.swordGrab();
          this.cam.shake(0.18);
          this.cam.fovKick(3);
          this.fx.dashTrail(f);
          break;
        case 'swordSwing': this.sfx.whiff(); break;
        case 'bfTell': {
          // the learnable tell: a flash on the impact spark when the window opens
          const foe = this.other(f);
          this.fx._ring(foe.pos.clone().add(new THREE.Vector3(0, 1.25, 0)), 0xffffff,
            { size: 0.3, growRate: 4, life: 0.12, flat: false });
          this.sfx.bfTell();
          break;
        }
        case 'sukunaCast':
          this.hud.cutin(f, 'MALEVOLENT VESSEL', f.cfg.ultimate.name + '  ' + (f.cfg.ultimate.jpName || ''));
          this.cam.cinematic(f.pos, 1.3, 3, 1.6);
          break;
        case 'sukunaEnd':
          this.hud.toast(f, 'SUKUNA RECEDES — RECOIL');
          this.sfx.domainFail();
          this.fx.hitSpark(f.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 'heavy');
          break;
        case 'thud':
          this.sfx.land();
          this.cam.shake(0.2);
          this.arena.splash?.(f.pos.x, f.pos.z, 1.1);
          this.arena.destruct?.damageAt(f.pos, 1.6, 22, { kind: 'body' });
          break;
        case 'wallSlam':
          // a launched body hitting geometry damages the geometry
          this.sfx.slam();
          this.cam.shake(0.35);
          this.arena.destruct?.damageAt(f.pos.clone().setY(f.pos.y + 1), 2.0, e.power * 5, { kind: 'body' });
          this.fx.hitSpark(f.pos.clone().add(new THREE.Vector3(0, 1.1, 0)), 'heavy');
          break;
        // ---- specials -----------------------------------------------------
        case 'warp':
          this.sfx.warp();
          this.fx.warpBlink(e.from, e.to, f.model.palette.accent ?? 0x7fd0ff);
          break;
        case 'warpSealed':
          this.hud.toast(f, 'BARRIER SEALS THE WARP');
          this.sfx.noCE();
          break;
        case 'boogie':
          this.sfx.clap();
          this.fx.boogieSwap(e.a, e.b, f.model.palette.accent ?? 0xff5fc8);
          this.cam.shake(0.22);
          break;
        case 'ratioStart': this.sfx.bfTell(); break;
        case 'lockToggle': {
          // the seat's own camera follows its fighter's preference
          this.camFor(f)?.setLocked(e.on);
          this.hud.toast(f, e.on ? 'LOCK ON' : 'LOCK OFF — FREE CAMERA');
          this.sfx.uiOk();
          break;
        }
        // ---- TOJI ---------------------------------------------------------
        case 'arsenalOpen':
          this.sfx.wheelOpen?.();
          this.hud.setArsenal(f, f.arsenal);
          break;
        case 'arsenalMove':
          this.sfx.uiMove();
          this.hud.setArsenal(f, f.arsenal);
          break;
        case 'weaponSwap':
          // the wheel closes the instant he commits — the DRAW is not part of
          // the choice, it is the price of it, and leaving the radial up
          // through the animation would hide the vulnerable frames
          this.hud.setArsenal(null, null);
          this.sfx.uiOk();
          this.hud.toast(f, e.name);
          this.fx._ring(f.pos.clone().setY(1.1), 0x6ea88a, { size: 0.4, growRate: 8, life: 0.3, flat: false });
          break;
        case 'weaponReady':
          this.sfx.swordSwing?.();
          break;
        // ---- maki: the awakening ------------------------------------------
        case 'awakenStage': {
          // NOT a glow. She has no cursed energy and a glow would say the
          // opposite of what the character is — this is a hard shell that
          // cracks outward, pressure leaving a body rather than power
          // entering one. See fx/newfx.js `awakenBurst`.
          awakenBurst(this.fx, f, e.stage, 0x5fae7a);
          this.hud.message(e.def.jp + ' ' + e.def.name, 1.4);
          this.hud.toast(f, 'AWAKENING ' + e.stage);
          this.sfx.charged?.() ?? this.sfx.uiOk?.();
          this.cam.shake(0.25 + e.stage * 0.12);
          this.stage.flash(0.10 + e.stage * 0.05);
          break;
        }
        case 'awakenGate':
          this.hud.toast(f, e.used ? 'ALREADY SPENT'
            : '天与呪縛 ' + e.stage + '/' + e.need);
          this.sfx.noCE();
          break;
        // ---- yuki: star rage ----------------------------------------------
        case 'massChargeStart':
          this.sfx.techCharge?.() ?? this.sfx.uiMove();
          break;
        case 'massDump':
          this.hud.toast(f, '質量解放');
          this.cam.shake(0.3);
          break;
        case 'garudaStunned':
          this.hud.toast(f, 'ガルダ DOWN');
          this.sfx.noCE();
          break;
        // ---- miwa: the circle and the stance -------------------------------
        case 'sdStart':
          this.hud.message('簡易領域', 1.0);
          break;
        case 'sdCooling':
          this.hud.toast(f, '簡易領域 ' + e.t.toFixed(1) + 's');
          this.sfx.noCE();
          break;
        case 'miwaStance':
          this.sfx.swordGrab?.() ?? this.sfx.uiMove();
          this.hud.toast(f, '抜刀構え');
          break;
        case 'stanceTier':
          // each charge tier announces itself, so the player can see what they
          // are buying without reading the config
          if (e.tier > 0) { this.hud.toast(f, e.def.name); this.sfx.uiMove(); }
          break;
        case 'needStance':
          this.hud.toast(f, 'NEEDS THE STANCE');
          break;
        case 'ctSealed':
          this.hud.toast(f, '強制解除 — TECHNIQUES SEALED');
          this.sfx.noCE();
          break;
        case 'nullifyCooling':
          this.hud.toast(f, 'SPEAR NOT READY — ' + e.t.toFixed(1) + 's');
          this.sfx.noCE();
          break;
        case 'nullifyLand':
          if (e.cancelled) this.cam.cinematic(f.pos, 0.9, 2.2, 1.5);
          break;
        case 'nullifyWhiff':
          this.hud.toast(f, 'WHIFFED');
          break;
        case 'assassinStart':
          this.hud.cutin(f, 'ASSASSINATION', f.cfg.ultimate.name + '  ' + f.cfg.ultimate.jpName);
          this.sfx.lunge?.();
          this.cam.fovKick(7);
          break;
        case 'assassinCooling':
          this.hud.toast(f, '術師殺し — ' + e.t.toFixed(1) + 's');
          this.sfx.noCE();
          break;
        case 'assassinWhiff':
          this.hud.toast(f, 'MISSED');
          break;
        case 'soulCutEnds':
          this.hud.toast(f, 'SOUL WOUND CLOSES');
          break;
        // ---- PANDA: THE THREE CORES ---------------------------------------
        case 'coreSwapStart':
          this.hud.setWheel(f, null, null);
          this.sfx.uiOk();
          this.sfx.coreSwap?.();
          this.fx._ring(f.pos.clone().setY(0.06), CORE_TINT[e.key] ?? 0xf2f2ec,
            { size: 0.5, growRate: 7, life: 0.4 });
          break;
        case 'coreSwap':
          this.hud.toast(f, e.jp + ' ' + e.name);
          this.fx._ring(f.pos.clone().add(new THREE.Vector3(0, 1.1, 0)),
            CORE_TINT[e.key] ?? 0xf2f2ec, { size: 0.4, growRate: 9, life: 0.35, flat: false });
          this.cam.shake(0.16);
          break;
        // A CORE IS GONE, PERMANENTLY. It gets the biggest read short of a KO,
        // because it IS a partial KO — a third of the character has just been
        // deleted for the rest of the round and both players need to register
        // it on the frame it happens rather than by noticing the HUD later.
        case 'coreLost':
          this.hud.message(e.jp + ' — CORE DESTROYED', 1.5);
          this.hud.toast(f, e.name + ' LOST · ' + e.left + ' LEFT');
          this.sfx.coreBreak?.();
          this.cam.shake(0.65);
          this.cam.fovKick(7);
          this.stage.flash(0.45);
          this.hitstop(12);
          this.slowmo(0.28, 0.4);
          this.fx.koBurst(f.pos.clone().add(new THREE.Vector3(0, 1.1, 0)));
          break;
        case 'coreBlocked':
        case 'noCoreLeft':
          this.hud.toast(f, e.text || 'NO OTHER CORE');
          this.sfx.noCE();
          break;
        case 'allCoresStart':
          this.hud.message('三核共鳴 x' + e.mult.toFixed(2) + ' — ' + e.cores + ' CORES', 1.6);
          break;
        case 'allCoresEnd':
          this.hud.toast(f, 'THE CORES SETTLE');
          break;
        // ---- KASHIMO -------------------------------------------------------
        case 'chargeTier':
          if (e.tier > 0) this.sfx.chargeTier?.(e.tier);
          if (e.tier === 3) this.hud.toast(f, '雷神 — MAXIMUM CHARGE');
          if (e.tier === 0) this.hud.toast(f, '接地 — EARTHED');
          break;
        case 'noCharge':
          this.hud.toast(f, 'NOT ENOUGH CHARGE');
          this.sfx.noCE();
          break;
        case 'arcSpent':
          this.hud.toast(f, 'ARC DASH SPENT');
          this.sfx.noCE();
          break;
        case 'arcDash':
          this.cam.shake(0.2);
          break;
        case 'staggered':
          this.hud.message('感電 STAGGERED', 0.7);
          break;
        case 'amberStart':
          this.hud.message('灼爛趙誅', 1.3);
          break;
        case 'amberEnd':
          this.hud.toast(f, 'THE LIMITER RETURNS');
          break;
        // ---- megumi -------------------------------------------------------
        case 'wheelOpen':
          this.sfx.wheelOpen?.();
          this.hud.setWheel(f, this._wheelSnapshot(f), f.wheel || f.swapWheel);
          break;
        case 'wheelMove':
          this.sfx.uiMove();
          this.hud.setWheel(f, this._wheelSnapshot(f), f.wheel || f.swapWheel);
          break;
        case 'wheelConfirm':
          this.sfx.uiOk();
          this.hud.setWheel(f, null, null);
          if (e.command) {
            this.hud.toast(f, (e.slot === 'ct1' ? 'RB · ' : 'RT · ')
              + f.cfg.commands.defs[e.key].short);
            this.fx._ring(f.pos.clone().setY(0.06), f.cfg.commands.defs[e.key].color,
              { size: 0.5, growRate: 7, life: 0.35 });
          } else if (e.curse) {
            this.hud.toast(f, 'RT · ' + f.cfg.curses.defs[e.key].short);
            this.fx._ring(f.pos.clone().setY(0.06), 0x6b2fa0, { size: 0.5, growRate: 7, life: 0.35 });
          } else {
            this.hud.toast(f, (e.slot === 'ct1' ? 'RB · ' : 'RT · ')
              + f.cfg.shikigami.defs[e.key].short);
            this.fx._ring(f.pos.clone().setY(0.06), 0x8fb6d8, { size: 0.5, growRate: 7, life: 0.35 });
          }
          break;
        case 'shikiBlocked':
          this.hud.toast(f, e.text);
          this.sfx.noCE();
          break;
        // ---- inumaki: CURSED SPEECH ---------------------------------------
        // The utterance itself needs no case: it is driven every frame from
        // the `ct` state (see combat/fighter.js) so that the gather is a
        // continuous read rather than a one-shot. What IS here is everything
        // that happens at the EDGES of one.
        case 'utterStart':
          // The reaction cue, and it is deliberately loud. The whole balance
          // of the character is that a command can be seen and heard coming.
          this.sfx.utterStart?.(e.cmd.weight, f.throatTier);
          break;
        case 'utterBroken':
          // INTERRUPTED. The gather collapses, the collar snaps back, and he
          // is charged the penalty (combat/speech.js does the charging; this
          // is only the picture). A player who has just rushed him down needs
          // to see that it worked.
          this.sfx.utterBreak?.();
          this.commandCard.hide();
          this.hud.toast(f, '呪言 CUT OFF');
          this.fx._ring(f.pos.clone().setY(f.pos.y + 1.45),
            e.cmd?.color ?? 0xffffff, { size: 0.4, growRate: 3, life: 0.3, flat: false });
          break;
        case 'silenced':
          this.hud.toast(f, '失声 — NO VOICE');
          this.sfx.noCE();
          break;
        case 'throatTooHigh':
          this.hud.toast(f, e.cmd.short + ' — THROAT TOO RAW');
          this.sfx.noCE();
          break;
        case 'throatTier':
          // Every tier change is announced, because his gauge is information
          // the OPPONENT needs at least as much as he does — SILENCED in
          // particular is the moment to walk in, and it should not be
          // something you have to be watching a bar to notice.
          if (e.silenced) {
            this.hud.message('失声 SILENCED', 1.1);
            this.sfx.silenced?.();
          } else {
            this.hud.toast(f, ['清明 CLEAR', '嗄れ STRAINED', '血声 RAW', '失声 SILENCED'][e.tier]);
          }
          break;
        case 'commandEnds':
        case 'sleepEnds':
        case 'twistEnds':
          // nothing to announce: the mark on the body has already faded and
          // the fighter is simply theirs again
          break;
        // ---- geto ---------------------------------------------------------
        case 'curseBlocked':
          this.hud.toast(f, e.text);
          this.sfx.noCE();
          break;
        case 'reabsorbStart':
          this.sfx.wheelOpen?.();
          break;
        case 'uzumaki':
          this.hud.message(e.spent.total ? '極ノ番・うずまき' : '極ノ番・うずまき — 空', 1.4);
          break;
        // ---- naoya --------------------------------------------------------
        case 'stanceStart':
          this.sfx.uiMove();
          break;
        case 'stanceArmed':
          this.sfx.stanceArm?.();
          this.hud.toast(f, '投射呪法 — ARMED');
          break;
        case 'stanceEnd':
          if (!e.spent) this.sfx.noCE();
          break;
        case 'projectionTrigger':
          this.hud.toast(f, 'CAUGHT IN A FRAME');
          this.cam.fovKick(5);
          break;
        case 'frozen':
          this.hud.message('FROZEN', 0.8);
          break;
        case 'maxProjectionStart':
          this.hud.message('投射呪法・極', 1.2);
          break;
        case 'maxProjectionEnd':
          this.hud.toast(f, 'PROJECTION ENDS');
          break;
        case 'shadowDive':
          this.sfx.shadowDive?.();
          this.fx._ring(f.pos.clone().setY(0.06), 0x8fb6d8, { size: 0.6, growRate: -1.4, life: 0.3 });
          break;
        case 'shadowRise':
          this.sfx.shadowRise?.();
          this.fx._ring(f.pos.clone().setY(0.06), 0x8fb6d8, { size: 0.3, growRate: 6, life: 0.35 });
          this.cam.shake(0.12);
          break;
        case 'ratioPrime':
          this.hud.toast(f, e.level === 2 ? '7:3 — PERFECT' : '7:3 — CLOSE');
          this.sfx.ratioSuccess(e.level);
          this.fx.buffAura(f, f.cfg.special?.primedTime ?? 6, 0xf2b23c);
          break;
        case 'ratioMiss':
          this.hud.toast(f, 'RATIO MISSED');
          this.sfx.noCE();
          break;
        case 'ratioStrike': {
          // the primed 7:3 strike lands: golden markers, crack, chime
          const foe = this.other(f);
          this.fx.ratioStrike(foe.pos.clone().add(new THREE.Vector3(0, 1.25, 0)), e.level);
          this.sfx.ratioChime();
          this.hitstop(e.level === 2 ? 14 : 8);
          this.cam.shake(e.level === 2 ? 0.7 : 0.4);
          this.cam.fovKick(e.level === 2 ? 8 : 4);
          if (e.level === 2) { this.stage.flash(0.4); this.slowmo(0.2, 0.4); }
          this.hud.toast(f, '7:3 STRIKE');
          break;
        }
        case 'copyCast':
          // fired back in Yuta's own green-white cursed energy
          this.sfx.copied();
          this.fx.dashTrail(f);
          this.fx._ring(f.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), 0x9ff5c9,
            { size: 0.5, growRate: 8, life: 0.3, flat: false });
          break;
        case 'ctStart':
          // HAKARI: every technique fired inside his own barrier feeds the
          // machine. Two of them roll a reach scenario. Reading it off the
          // event means it counts the USE, not the connect — whiffing still
          // pays into the counter, which is what makes spamming it a plan.
          this.gamble.noteTechnique(f);
          if (e.move.chargedCast) this.hud.toast(f, 'MAXIMUM: ' + e.move.name.toUpperCase());
          // WORLD-CUTTING SLASH: the line writes itself across the floor
          // during the wind-up. It is the whole reason the move is reactable.
          if (e.move.effect === 'mahoraga_world_cut') {
            this.hud.toast(f, '世界を断つ — WORLD-CUTTING SLASH');
            this.fx.worldCutTell(f, f.forward(), e.move.range ?? 15);
            this.sfx.eruptPrime();
            this.cam.shake(0.18);
          }
          break;
        case 'purpleStart':
          this.hud.cutin(f, 'IMAGINARY TECHNIQUE', 'HOLLOW PURPLE  虚式「茈」');
          this.cam.cinematic(f.pos, 1.2, 2.8, 1.5);
          break;
        case 'ultBurst':
          this.hud.cutin(f, 'MAXIMUM OUTPUT', f.cfg.ultimate.name + '  ' + (f.cfg.ultimate.jpName || ''));
          this.cam.cinematic(f.pos, 1.2, 3, 1.6);
          break;

        // ---- MEGUMI: the ritual window ------------------------------------
        case 'ritualPrompt':
          // shown once, while the cast is actually running, so the input is
          // discoverable without being an accident waiting to happen
          this.hud.ritualPrompt(2.0);
          break;

        // ---- MAHORAGA ------------------------------------------------------
        case 'adapt': {
          const r = e.result;
          if (r.empty) {
            // the interval passed and nothing had touched him. Say so — the
            // opponent needs to learn that not hitting him has a cost too
            this.hud.toast(f, '適応なし — NOTHING TO ADAPT TO');
            break;
          }
          if (r.starved) {
            this.hud.toast(f, 'ALREADY ADAPTED — ' + r.label);
            break;
          }
          // the wheel turns, then locks
          f.model.spinWheel?.(1);
          this.sfx.adaptSpin();
          this.fx.adaptFlare(f, f.cfg.size?.wheelY ?? 3.9);
          this.cam.shake(0.3);
          this.hud.adaptCallout(f, r);
          this.slowmo(0.35, 0.45);
          // the lock lands a beat later, on the sound cue
          setTimeout(() => {
            if (!f.alive) return;
            f.model.lockWheel?.();
            this.sfx.adaptLock();
            this.cam.shake(0.45);
            this.cam.fovKick(5);
            this.stage.flash(0.22);
            this.fx.adaptFlare(f, f.cfg.size?.wheelY ?? 3.9);
          }, (f.adapt?.cfg.spinTime ?? 1.2) * 1000);
          if (f.state !== 'ko' && !f.busy) f.anim.play('adapt', { fade: 0.1, restart: true });
          break;
        }
        case 'noUltimate':
          this.hud.toast(f, e.text || f.cfg.noUltimateReason || 'NO ULTIMATE');
          this.sfx.noCE();
          break;

        // ---- HAKARI --------------------------------------------------------
        case 'shutterBlock':
          this.sfx.guard();
          this.fx.guardSpark(f.pos.clone().add(new THREE.Vector3(0, 1.3, 0))
            .addScaledVector(f.forward(), 1.35));
          this.hitstop(3);
          if (e.projectile) this.hud.toast(f, 'SHUTTER HOLDS');
          break;
        case 'shutterBreak':
          this.sfx.shutterBreak();
          this.fx.shutterDown(f, true);
          this.hud.toast(f, 'SHUTTER BROKEN');
          this.cam.shake(0.3);
          this.hitstop(6);
          break;
        case 'shutterDown':
          this.fx.shutterDown(f, false);
          break;
        case 'rctDamage':
          // the hit reads normally; the payback is the gamble system's job.
          // All this does is put the gold on the screen at the moment of
          // impact so the two beats are visibly connected.
          this.fx._ring(f.pos.clone().add(new THREE.Vector3(0, 1.25, 0)), 0xffc93c,
            { size: 0.35, growRate: 8, life: 0.25, flat: false });
          break;
        case 'rctCounter': {
          // he ate it. Heal, then hand it straight back on the next beat.
          this.sfx.counterAbsorb();
          this.fx.counterStance(f);
          this.hud.toast(f, 'ABSORBED');
          this.hitstop(12);
          this.slowmo(0.22, 0.35);
          this.effects.queueCounterPunish(f, e.target, e.def, 0.14);
          break;
        }
        case 'charge':
          this.sfx.dash();
          this.sfx.mahoragaStep();
          this.fx.dashTrail(f);
          this.cam.shake(0.2);
          break;
        case 'chargeEnd':
          this.sfx.slam();
          this.cam.shake(0.3);
          this.arena.destruct?.damageAt(f.pos.clone().setY(1.2), 2.4, 40, { kind: 'body' });
          break;
        case 'step':
          // every footfall registers
          this.sfx.mahoragaStep();
          this.cam.shake(f.cfg.size?.stepShake ?? 0.12);
          this.arena.splash?.(f.pos.x, f.pos.z, 0.8);
          break;
      }
    }
    f.events.length = 0;
  }

  _chargedAuras() {
    for (const f of this.fighters) {
      const has = this.chargedAuras.get(f);
      if (f.charged && !has && f.alive) this.chargedAuras.set(f, this.fx.chargedAura(f));
      else if (!f.charged && has) { this.fx.removeAura(has); this.chargedAuras.delete(f); }
    }
  }

  // Last fighter standing takes the round; everyone knocked out loses a stock.
  // With two fighters this is the original behaviour exactly.
  _startKO() {
    this.phase = 'ko';
    this.phaseT = 0;
    const survivors = this.fighters.filter(f => f.alive);
    this.winner = survivors[0] || this.winner || this.fighters[0];
    const downed = this.fighters.filter(f => !f.alive);
    // whoever fell on THIS tick is the one the closing shot frames — not a
    // body that has been lying there since the start of the round
    const justFell = downed.filter(f => f.state !== 'ko');
    for (const f of downed) {
      f.lives = Math.max(0, f.lives - 1);
      // anyone already face-down from earlier in the round keeps their pose
      if (f.state !== 'ko') {
        f.setState('ko', { clip: 'ko' });
        this.fx.koBurst(f.pos.clone());
      }
    }
    // the match is decided once at most one fighter still has stocks left
    this.matchOver = this.fighters.filter(f => f.lives > 0).length <= 1;
    this.hud.message('K.O.', 1.6);
    this.sfx.ko();
    this.sfx.stopDrone();
    this.music?.duck(0.3, this.matchOver ? 3.0 : 2.2);
    this.cam.shake(0.9);
    this.cam.fovKick(8);
    this.stage.flash(0.8);
    this.stage.setGrade('ko');
    this.cam.cinematic((justFell[0] || downed[0] || this.winner).pos, 2.0, 3.4, 1.4);
    this.domains.abortContest();
    if (this.domains.state) this.domains._collapse(false);
    // the round is over: Jackpot, its theme and its grade go with it
    this.gamble.resetRound();
    // ...and so does any live freeze. Released here rather than left to expire
    // so the KO shot never frames a grey, stuttering winner.
    this.freeze.clear();
    this.stage.setGrade('ko');
  }

  // ---- THE WIN POSE IS THE TAUNT -----------------------------------------
  // Played on the winner once the victory clip has had its moment, and
  // re-playable from the result screen (D-pad Left — game.js wires it).
  //
  // It deliberately does NOT go through `tryTaunt` or the `taunt` state. The
  // winner is in the `victory` state, which runs no state logic at all, and
  // that is exactly what this wants: nothing here can be interrupted, cancelled
  // or rate-limited, because there is no longer a fight for any of that to mean
  // anything in. It drives the clip and the bubble directly and nothing else.
  playVictoryTaunt(f = this.winner) {
    if (!f) return false;
    const def = pickTaunt(f.pick, f.tauntN++);
    if (!def || !f.anim.clips.has(def.clip)) return false;
    f.anim.play(f.anim.clips.get(def.clip), { fade: 0.2, restart: true });
    this.sfx.taunt(def.cue);
    this._tauntFlourish(f, def);
    this.bubbles.cut(f);
    // The bubble is DEFERRED ON THE GAME CLOCK, not on setTimeout. A wall-clock
    // timer here fires while the game is paused, keeps running after the match
    // is destroyed, and (found in test) never fires at all under a harness that
    // drives `update` synchronously. `_pendingSay` is drained by `_winTauntFlow`
    // off the same tick everything else uses.
    this._pendingSay = def.say ? { f, def, t: def.at ?? 0.6 } : null;
    return true;
  }

  // The two taunts that reach outside the skeleton for something. Kept here
  // rather than in the clips because both are model/FX calls, and both are
  // optional-chained so a body that does not have them is simply a body that
  // does not have them.
  // The queued collar drop, ticked on the game clock next to `_pendingPuff`.
  _tickPendingCollar(dt) {
    const p = this._pendingCollar;
    if (!p) return;
    p.t -= dt;
    if (p.t > 0) return;
    this._pendingCollar = null;
    // Only if he is STILL taunting. A taunt that was interrupted in the
    // meantime must not drop his collar a beat later on a body that has since
    // been knocked down.
    if (p.f.alive && p.f.state === 'taunt') {
      p.f.model.setCollar?.(1);
      p.f.model.setMarks?.(true);
    }
  }

  _tauntFlourish(f, def) {
    // MAHORAGA: the wheel actually turns. `spinWheel` is the same call the
    // adaptation uses, at a fraction of the power — a lazy idle revolution
    // rather than a lock-on.
    f.model.spinWheel?.(0.35);
    // MEGUMI: something arrives in the shadow at his feet, uninvited. The clip
    // has him glancing down at it and then putting it away; this is the half of
    // the joke that is not his body. Queued on the GAME clock for the same
    // reason the win-pose bubble is — a wall-clock timer would put a shadow at
    // his feet through a pause, and 0.62 s late if the frame hitched.
    if (f.cfg.shikigami) this._pendingPuff = { f, t: 0.62 };
    // INUMAKI: THE COLLAR ACTUALLY COMES DOWN. He is genuinely opening it to
    // say a word — the word is just "salmon". Driven from here rather than
    // from fx/speechfx.js because a taunt has no utterance for the dial to
    // ride, and queued on the GAME clock for the same reason the shadow puff
    // above is: a wall-clock timer would drop his collar through a pause.
    //
    // `tauntBreak` puts it back, so a taunt cut in half by a punch leaves him
    // with his collar hanging open for exactly as long as the model's own
    // 0.35 s settle takes — which is the correct picture.
    if (f.cfg.throat) this._pendingCollar = { f, t: 0.55 };
  }

  // Drained from the update, beside the taunt bubble. One line each, but they
  // are the two places this feature reaches out of the animation and into the
  // world, so they share a clock with it.
  _tickFlourish(dt) {
    this._tickPendingCollar(dt);
    const p = this._pendingPuff;
    if (!p) return;
    p.t -= dt;
    if (p.t <= 0) { this._pendingPuff = null; this.fx.shadowPuff?.(p.f.pos.clone()); }
  }

  // The automatic half of the win pose: the victory clip plays, and then the
  // winner's taunt plays on top of it.
  //
  // THIS IS DELIBERATELY NOT INSIDE `_koFlow`. It was, and it never fired
  // once: `_koFlow` only runs while `phase === 'ko'`, and phase flips to
  // 'result' at phaseT 2.6 — so any gate later than that is unreachable, which
  // is exactly the trap the first version fell into. Driven from the update
  // instead, so it survives the phase change and can sit at a delay chosen to
  // let the victory clip finish rather than one chosen to beat a deadline.
  _winTauntFlow() {
    // the win pose's bubble, waiting for its beat inside the clip
    const p = this._pendingSay;
    if (p) {
      p.t -= 1 / 60;
      if (p.t <= 0) {
        this._pendingSay = null;
        // longer hold than in a match: nobody is about to hit him, and this is
        // the shot the player stops to look at
        this.bubbles.say(p.f, p.def.say, {
          hold: (p.def.hold ?? 1.3) + 1.2,
          accent: hex(pickInfo(p.f.pick)?.accent ?? 0xffffff),
          cam: this.cams[p.f.index]?.cam
        });
      }
    }
    if (!this.matchOver || this._winTaunted) return;
    if (this.phase !== 'ko' && this.phase !== 'result') return;
    if (!this.winner || this.winner.state !== 'victory') return;
    this._winTauntT = (this._winTauntT ?? 0) + 1 / 60;
    if (this._winTauntT < 1.9) return;    // every victory clip has had its beat
    this._winTaunted = true;
    this.playVictoryTaunt();
  }

  _koFlow() {
    // ---- THE FINISHER --------------------------------------------------
    // The match-ending KO, and only that: `matchOver` is false on a round
    // KO, so a finisher can never fire between rounds. Offered after the KO's
    // own hitstop and slow-motion beat have played, which is the "brief
    // hitstop" the sequence opens on. It returns false — and this becomes a
    // dead line — whenever the feature is off, the winner has no finisher, or
    // there is no body to play it against, so the flow below is unchanged.
    // The roll travels on the host's KO event, so every client plays the same
    // cinematic — one screen running a finisher while another does not would
    // put the whole match clock out of step.
    if (this.matchOver && this.phaseT > 0.5
      && this.finishers.tryBegin(this.winner, null, this.net?.finRoll ?? null)) return;
    // only take a victory pose when the whole match is decided
    if (this.matchOver && this.phaseT > 1.4 && this.winner.state !== 'victory') {
      this.winner.setState('victory', { clip: 'victory' });
      this.winner.anim.play('victory', { fade: 0.2, restart: true });
      this.sfx.victory();
      this._winTaunted = false;
      this._winTauntT = 0;
    }
    if (!this.matchOver && this.phaseT > 2.2) { this._nextRound(); return; }
    if (this.matchOver && this.phaseT > 2.6 && !this._resultFired) {
      this._resultFired = true;
      this.phase = 'result';
      this.music?.play('menu');
      this.onResult(this.winner);
    }
  }

  // A stock was lost but two or more fighters still have lives: wipe the round
  // state and run the intro again. The music keeps playing straight through.
  // "Megumi is gone until the round ends." The round has ended: put him back.
  // The ritual itself stays spent — `ritualUsed` is not cleared here, so it
  // remains once per MATCH, not once per round.
  _revertSummons() {
    for (let i = 0; i < this.fighters.length; i++) {
      const f = this.fighters[i];
      const src = f.summonedFrom;
      if (!src) continue;
      this.fighters[i] = src;
      if (this.p1 === f) this.p1 = src;
      if (this.p2 === f) this.p2 = src;
      this.root.remove(f.model.group);
      this.root.add(src.model.group);
      src.model.group.visible = true;
      src.transformedInto = null;
      // the stock the summon spent (or kept) is the one Megumi comes back with
      src.lives = f.lives;
      src.maxLives = f.maxLives;
      for (const s of this.fx.shadows) if (s.fighter === f) s.fighter = src;
      const aura = this.chargedAuras.get(f);
      if (aura) { this.fx.removeAura(aura); this.chargedAuras.delete(f); }
      this.inputs.delete(f);
      this.hud.setAdaptation(null);
      this.camFor(src)?.applySubject(src);
    }
    this.hud.setFighters(this.fighters);
    if (this.cpu) this.cpu.retarget?.(this);
  }

  // Which radial the wheel widget is showing. Both summoners hold one and the
  // interaction is identical; only the sectors differ. Geto's shows his FOUR
  // SPECIAL GRADES and not his chaff — the low grades have no choice attached
  // to them (CT1 takes the first available), so putting them on the wheel
  // would be four sectors that do nothing.
  _wheelSnapshot(f) {
    // INUMAKI: THE COMMAND RADIAL REUSES THE SHIKIGAMI WIDGET, like Panda's
    // cores do. The mapping is natural and the one interesting part is that
    // `affordable` here means "his throat can still pay for this word", so the
    // ring greys out exactly what he is no longer allowed to say. It obeys the
    // same rule as the curse branch below — the snapshot IS `cfg.commands.order`
    // in order, because the widget indexes it with `wheel.sel`.
    if (f.cfg.commands) return commandWheelSnapshot(f);
    // THE SNAPSHOT AND THE WHEEL'S SECTOR LIST HAVE TO BE THE SAME LIST, in the
    // same order — the widget indexes the snapshot with `wheel.sel`. Geto's
    // wheel now offers his MID grades as well as his special grades (that is
    // where the four new medium bodies live), so filtering to `specialGrade`
    // here left an eleven-sector wheel indexing a seven-entry array and the HUD
    // read past the end of it. Both sides read `wheelOrder`.
    if (f.cfg.curses) {
      const order = f.cfg.curses.wheelOrder ?? f.cfg.curses.specialOrder;
      const by = new Map(this.curses.snapshot(f).map(s => [s.key, s]));
      return order.map(k => by.get(k)).filter(Boolean);
    }
    // PANDA: THE CORE RADIAL REUSES THE SHIKIGAMI WIDGET rather than getting a
    // fourth one. All the widget needs is this shape, and the mapping is
    // natural: a DESTROYED core is `lost` (greyed and struck through, exactly
    // as a dead shikigami is), and the core he is standing in right now takes
    // `selected`, which is the same highlight Geto's chosen curse uses.
    // `desc` carries the remaining health so the choice is informed — which
    // core to expose is the entire decision and it cannot be made blind.
    if (f.cores) {
      return f.cores.map(c => ({
        def: {
          short: c.short, jp: c.jp, name: c.name, cost: f.cfg.special.cost,
          desc: c.alive ? Math.round(c.hp) + ' / ' + Math.round(c.max) : 'DESTROYED'
        },
        lost: !c.alive || c.hp <= 0,
        cd: 0,
        affordable: f.res.curCE >= f.cfg.special.cost,
        selected: c.key === f.stance
      }));
    }
    return this.shikigami.snapshot(f);
  }

  _nextRound() {
    this.round++;
    // Fresh streams for the new round, still identical on every client.
    if (this.matchSeed != null) this._seedFighters(this.matchSeed, this.round);
    this.ritual.abort();
    this._revertSummons();
    this.effects.clear();
    this.minions.clear();
    this.ocean.clear();
    this.warpfx.clear();
    this.judgemen.clear();
    // ...and so is every kanji still in the air, every cage still standing
    // round a body, and any command card mid-slam
    this.speechfx.clear();
    this.commandCard.hide();
    // shikigami losses are round-scoped, like every other resource here
    this.shikigami.resetRound();
    // ...and so are root fields, cursed buds, swarms and Gluttony
    this.flora.resetRound();
    this.swarms.resetRound();
    this.gamble.resetRound();
    // Geto's stable comes BACK each round — see the long note on
    // CurseSystem.resetRound for why his permanence is round-scoped where
    // Megumi's is match-scoped. Any live freeze is released cleanly here so a
    // fighter frozen at the buzzer does not start the next round grey.
    this.curses.resetRound();
    // GARUDA IS NOT REMOVED AND NOT REBUILT — it is put back beside her with
    // its timers cleared. Rebuilding it would be cheap and would also be a lie
    // about what the object is: it is the one ally in the game that is always
    // there. Miwa's circle IS torn down, because a zone is a thing she placed
    // and a round boundary un-places it.
    this.garuda.resetRound();
    this.newshadow.resetRound();
    this.freeze.clear();
    this.hud.setWheel(null, null, null);
    this.hud.setArsenal(null, null);
    // the level goes back up between rounds: every destructible is restored
    // and every collider it killed comes back
    this.arena.destruct.reset();
    this.domains.abortContest();
    if (this.domains.state) this.domains._collapse(false);
    // a carried Executioner's Sword is round-scoped like everything else
    this.domains.clearSwordCarry();
    this.domainfx.clearClash();
    this.stage.setGrade(this.mapGrade);   // back to the MAP's grade, not a flat one
    this.setCameraMode('follow');
    for (const [, aura] of this.chargedAuras) this.fx.removeAura(aura);
    this.chargedAuras.clear();
    // out of stocks = out of the match: stay down, hidden, and skipped by the
    // combat loops. Their HP stays at 0 so they never count as alive again.
    for (const f of this.fighters) {
      if (f.lives > 0) f.resetForRound();
      else { f.eliminated = true; f.model.group.visible = false; }
    }
    this.winner = null;
    this.phase = 'intro';
    this.phaseT = 0;
    this.hitstopFrames = 0;
    this.timeScale = 1;
    this.slowmoT = 0;
    this.slowAcc = 0;
    this.cam.cinematic(new THREE.Vector3(0, 0, 0), 1.4, 6.2, 2.1);
    this.hud.message('ROUND ' + this.round, 1.0);
    this.sfx.ready();
  }

  render(alpha, frameDt) {
    // Offline, pause holds the frame and keeps the scene composited. Online
    // the match is still running behind the menu, so the frame must keep
    // moving or the pausing player would come back to a teleport.
    if (this.paused && !this.net) frameDt = 0;
    // The cutscene runs here rather than in the fixed update so its camera and
    // its hold-frames land on real frame time — a shot list judders badly if
    // it is quantised to the logic step.
    // A cutscene is a composed shot: nothing should be dissolving out of it
    // because a fighter happens to be behind a pillar.
    if (this.ritual.active) { clearXrayFocus(); this.ritual.update(frameDt); return; }
    // A FINISHER owns the frame the same way, and for the same reason: a
    // composed shot must not have a fighter dissolving out of it because a
    // pillar happens to be in the way.
    if (this.finishers.active) { clearXrayFocus(); this.finishers.update(frameDt); return; }
    const ts = this.hitstopFrames > 0 ? 0.05 : this.timeScale;
    for (const f of this.fighters) if (!f.eliminated) f.applyRender(alpha, frameDt, ts);
    // each view rides its own seat's shoulder, framed on whoever that seat is
    // currently closest to
    this.cams.forEach((cam, i) => {
      let me = this.fighters[this.viewSeats[i]] || this.p1;
      // downed for the round, or out of stocks entirely: ride a living
      // fighter's shoulder instead of staring at your own body
      if (!me.alive || me.eliminated) me = this._spectateTarget(me) || me;
      const foe = this.other(me) || me;
      cam.update(frameDt, me.pos, foe.pos, this.input.frameFor(i).cam);
      // X-RAY: level geometry between this eye and the fighter it is following
      // dissolves rather than blocking the shot. Aimed at the chest, not the
      // feet, so the hole is centred on the body.
      _xrayAt.copy(me.pos).setY(me.pos.y + 1.0 + (me.cfg?.size?.camHeight ?? 0) * 0.6);
      // his FEET as well as his chest: the cut protects the ground he is
      // standing on and cuts everything else, and it can only tell them apart
      // if it knows where his footing is (see art/shaders/xray.js).
      setXrayFocus(cam.cam, _xrayAt, me.pos.y);
    });
    this._wading(frameDt);
    // EVERY eye, not just the first: the arena culls zones and detail props
    // against the cameras it is given, and anything culled is culled out of
    // the one shared scene — so a second seat's interior has to count.
    this.arena.update(frameDt, this.cams.map(c => c.cam));
    this.fx.update(frameDt);
    // URO's refraction. Ticked on REAL frame time rather than on the logic
    // step: it is entirely visual, and the distortion should keep flowing
    // through hitstop and slow-motion rather than freezing with the fight.
    // THE CONSTANT HEAT-HAZE. "A faint constant heat-haze around her body so
    // she reads as slightly displaced even when idle" — refreshed once a frame
    // per flying fighter rather than spawned, so it costs one warp item for
    // the whole round. It intensifies while she is actually hovering, which
    // makes the passive readable from across the arena without a HUD element.
    for (const f of this.fighters) {
      if (!f.cfg.flight || !f.alive || f.eliminated) continue;
      const k = (f.model?.warpHaze ?? 0.35) + (f.hoverT > 0 ? 0.45 : 0);
      this.warpfx.haze(f, Math.min(1, k));
    }
    this.warpfx.update(frameDt, this.stage.camera);
    // the title card is pure UI and stays on real frame time; the glyphs are
    // not, and are ticked from the logic step in `update`
    this.commandCard.update(frameDt);
    this.domainfx.update(frameDt, this.domains.state);
  }

  // ---- WADING --------------------------------------------------------------
  // A FIGHTER STANDING IN WATER HAS TO LOOK LIKE ONE. The maps have had water
  // since the beginning and it only ever answered to techniques landing in it,
  // so a body in Kyoto's river — which is most of the middle of that map — was
  // cut off at the thigh by a flat green sheet that did not move, did not
  // sound, and did not part. Every player who saw it read it as falling
  // through the floor, and they were right to: nothing on screen said water.
  //
  // Purely presentational, and deliberately so — it runs on frame time next to
  // the rest of the FX rather than in the fixed step, and it changes nothing
  // about how anyone moves or how a hit resolves. The surface itself is driven
  // through the arena's own `splash`, which is the same ripple techniques use.
  _wading(dt) {
    if (!this.arena?.waterAt) return;
    for (const f of this.fighters) {
      if (f.eliminated) continue;
      const wy = f.alive ? this.arena.waterAt(f.pos.x, f.pos.z) : null;
      // the SURFACE has to be over his feet AND not over his head — a fighter
      // on the stepping stones or on a bank is not wading
      const inWater = wy != null && f.pos.y < wy - 0.04;
      // Outside the fight itself — the intro, a KO, the round change — the
      // state is tracked SILENTLY. A fighter respawning on dry land after a
      // round that ended in the river would otherwise open the next one with a
      // splash out of nothing.
      if (this.phase !== 'fight') { f._inWater = inWater; continue; }
      const was = f._inWater ?? false;
      const spd = Math.hypot(f.vel.x, f.vel.z);
      if (inWater && !was) {
        // ARRIVING. A drop into the river is a bigger event than walking into
        // it, so the fall speed is most of the power.
        const p = Math.max(0.55, Math.min(1.6, 0.55 + Math.abs(f.vel.y) * 0.09 + spd * 0.04));
        this.sfx.splash(p);
        this.fx.waterRing(f.pos.x, wy, f.pos.z, p);
        this.arena.splash?.(f.pos.x, f.pos.z, p);
        f._wadeT = 0;
      } else if (inWater) {
        // STANDING IN IT. Ripples keep coming even at a standstill — moving
        // water is what makes it read as water — and quicken with the pace.
        f._wadeT = (f._wadeT ?? 0) - dt;
        if (f._wadeT <= 0) {
          const p = 0.3 + Math.min(0.7, spd * 0.075);
          f._wadeT = spd > 0.4 ? 0.16 : 0.6;
          this.fx.waterRing(f.pos.x, wy, f.pos.z, p);
          this.arena.splash?.(f.pos.x, f.pos.z, 0.35 + p);
          if (spd > 1.2) this.sfx.wade();
        }
      } else if (was) {
        // LEAVING IT, at the last place he was in it.
        this.fx.waterRing(f.pos.x, f._waterY ?? f.pos.y, f.pos.z, 0.5);
        this.arena.splash?.(f.pos.x, f.pos.z, 0.6);
        this.sfx.wade();
      }
      f._inWater = inWater;
      if (inWater) f._waterY = wy;
    }
  }

  destroy() {
    clearXrayFocus();
    this.speechfx.clear();
    this.ritual.abort();
    this.finishers.abort();
    this.minions.clear();
    this.judgemen.clear();
    this.shikigami.clear();
    this.ocean.clear();
    this.warpfx.clear();
    this.curses.clear();
    this.freeze.clear();
    this.flora.clear();
    this.swarms.clear();
    this.gamble.dispose();
    this.arena.dispose?.();
    this.domainfx.hide();
    this.domainfx.clearClash();
    this.sfx.stopDrone();
    this.sfx.stopWind();
    this.stage.setGrade('neutral');
    this.stage.setViews(1);
    this.stage.scene.remove(this.root);
    this.hud.destroy();
  }
}
