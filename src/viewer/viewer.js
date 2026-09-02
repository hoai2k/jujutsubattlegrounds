// Model viewer: turntable, character + clip switching, outline/wire/bone
// toggles. The iteration bench for the art pass.
import * as THREE from 'three';
import { ROSTER_IDS } from '../characters/index.js';
import { buildGojo } from '../art/models/gojo.js';
import { buildYuta } from '../art/models/yuta.js';
import { buildNanami } from '../art/models/nanami.js';
import { buildYuji } from '../art/models/yuji.js';
import { buildTodo } from '../art/models/todo.js';
import { buildJogo } from '../art/models/jogo.js';
import { buildMahito } from '../art/models/mahito.js';
import { buildMegumi } from '../art/models/megumi.js';
import { buildMahoraga } from '../art/models/mahoraga.js';
import { buildHiguruma } from '../art/models/higuruma.js';
import { buildHakari } from '../art/models/hakari.js';
import { buildSukuna } from '../art/models/sukuna.js';
import { buildToji } from '../art/models/toji.js';
import { buildHanami } from '../art/models/hanami.js';
import { buildKurourushi } from '../art/models/kurourushi.js';
import { buildChoso } from '../art/models/choso.js';
import { buildNobara } from '../art/models/nobara.js';
import { buildGeto } from '../art/models/geto.js';
import { buildNaoya } from '../art/models/naoya.js';
import { buildKashimo } from '../art/models/kashimo.js';
import { buildPanda } from '../art/models/panda.js';
import { buildInumaki } from '../art/models/inumaki.js';
import { buildMaki } from '../art/models/maki.js';
import { buildYuki } from '../art/models/yuki.js';
import { buildMiwa } from '../art/models/miwa.js';
import { buildUro } from '../art/models/uro.js';
import { buildDagon } from '../art/models/dagon.js';
import { buildYaga } from '../art/models/yaga.js';
import { buildTakaba } from '../art/models/takaba.js';
import { buildUraume } from '../art/models/uraume.js';
import { buildRyu } from '../art/models/ryu.js';
import { buildReggie } from '../art/models/reggie.js';
import { buildIno } from '../art/models/ino.js';
import { BEAST_BUILDERS } from '../art/models/auspiciousbeasts.js';
import { OBJECT_MODELS, JUNK, buildVendingWreck } from '../art/models/receiptobjects.js';
import { buildCursedCorpse, CORPSE_IDS } from '../art/models/cursedcorpses.js';
// DAGON'S FOUR — not humanoids and not Megumi's, so they load through the
// CREATURES path with the rest of the summons.
import {
  buildPiranhaShoal, buildArmouredCrab, buildEelSerpent, buildGreatShark
} from '../art/models/oceanshikigami.js';
// GARUDA is not a humanoid and has no clip set, so it loads through the
// CREATURES path below rather than through BUILDERS — same as the shikigami.
import { buildGaruda } from '../art/models/garuda.js';
import { buildGapingMaw, buildTendrilWisp } from '../art/models/lowcurses.js';
import { RoachSwarm } from '../art/models/roach.js';
import {
  buildModuloYuji, buildShinjukuYuji, buildGojoUnblindfolded, buildShinjukuGojo,
  buildDistortedMahito, buildSukunaYuji, buildSukunaMegumi
} from '../art/models/variants/index.js';
import { buildJudgeman } from '../art/models/judgeman.js';
import { buildRika } from '../art/models/rika.js';
import {
  buildDivineDog, buildNue, buildToad, buildGreatSerpent,
  buildMaxElephant, buildRabbitSwarm
} from '../art/models/shikigami.js';
import { buildRoundDeer, buildPiercingOx, buildTigerFuneral } from '../art/models/shikigami_beasts.js';
import {
  buildDivineDogTotality, buildMergedBeastAgito, buildWingedToads
} from '../art/models/shikigami_fusions.js';
import { buildTransfigured, TRANSFIGURED_IDS } from '../art/models/transfigured.js';
import {
  buildCentipede, buildDecoyEye, buildFleshEater, buildKoGuy, buildFungusHead,
  buildDaruma, buildPillarCurse, buildMantaRay, buildRainbowDragon, buildHookworm
} from '../art/models/getocurses.js';
import { makeClips } from '../art/anim/index.js';
import { AnimPlayer } from '../art/anim/player.js';
// THE FINISHER SET. Authored in src/finishers, compiled per body at match time
// and — until now — inspectable only by winning a match with the right
// character, which is a terrible iteration loop for twenty-five hand-authored
// clips. The bench installs them exactly the way the director does.
import { FIGHT_HUMAN, FIGHT_GIANT } from '../finishers/fight.js';
import { SIGNATURE_CLIPS } from '../finishers/moves.js';
import { installClips, FIN_PREFIX } from '../finishers/retarget.js';
// ?render3d works on the bench too — the fastest way to check how an imported
// humanoid takes the clip library is to page through it here.
import { maybeAttachRender3D } from '../art/rig3d/render3d.js';

const BUILDERS = { gojo: buildGojo, yuta: buildYuta, megumi: buildMegumi, nanami: buildNanami, yuji: buildYuji, todo: buildTodo, jogo: buildJogo, mahito: buildMahito, mahoraga: buildMahoraga, higuruma: buildHiguruma, hakari: buildHakari, sukuna: buildSukuna, toji: buildToji,
  hanami: buildHanami, kurourushi: buildKurourushi, choso: buildChoso, nobara: buildNobara,
  geto: buildGeto, naoya: buildNaoya, kashimo: buildKashimo, panda: buildPanda,
  inumaki: buildInumaki, maki: buildMaki, yuki: buildYuki, miwa: buildMiwa,
  uro: buildUro, dagon: buildDagon, yaga: buildYaga, takaba: buildTakaba,
  uraume: buildUraume, ryu: buildRyu, reggie: buildReggie, ino: buildIno,
  // VARIANTS. They are separate models with their own geometry, so they get
  // their own viewer entries — a variant you cannot load on the bench is a
  // variant nobody iterates on, which is how a palette swap ships.
  'yuji:modulo': buildModuloYuji, 'yuji:shinjuku': buildShinjukuYuji,
  'gojo:unblindfolded': buildGojoUnblindfolded, 'gojo:shinjuku': buildShinjukuGojo,
  'mahito:distorted': buildDistortedMahito,
  'sukuna:yuji': buildSukunaYuji, 'sukuna:megumi': buildSukunaMegumi };

// Mahoraga is 3.6 m against the roster's 1.75-2.0, so the viewer cannot frame
// him on the shared camera. Anything listed here gets its own default rig.
const FRAMING = {
  mahoraga: { dist: 8.6, height: 1.95 },
  // URO's silhouette is 2.26 m tall on a 1.72 m body — the crest needs the
  // extra height or the bench crops it, which is precisely the detail the
  // bench exists to check.
  uro: { dist: 4.9, height: 1.30 },
  // URAUME is short and the black drape is WIDE, so the frame is pulled back
  // a touch further than the height alone would ask for — the silhouette is
  // the character and it needs the room.
  uraume: { dist: 4.6, height: 1.02 },
  // RYU is framed HIGH, because the identifier is the cannon and it sits a
  // head and a half above his crown. Framing him on his chest like the rest of
  // the tall men puts the muzzle at the top edge of the shot.
  ryu: { dist: 5.2, height: 1.42 },
  dagon: { dist: 6.0, height: 1.35 },
  // The tallest human in the roster needs the camera further back than the
  // students; the most ordinary one needs it exactly where the default is.
  yaga: { dist: 4.6, height: 1.10 },
  hanami: { dist: 5.4, height: 1.25 },
  kurourushi: { dist: 5.6, height: 1.30 }
};

// The shikigami are not CharacterModels — they have their own rigs and their
// own animators — so the viewer drives them through a second, simpler path:
// a `state` object handed to model.tick() with the switches each creature
// reads. `states` is what the clip bar exposes for that creature.
// ---- REGGIE'S MATERIALISED OBJECTS ---------------------------------------
// A ladder and a car are not creatures and have no animator, but they are the
// biggest single block of modelling in his character and the ONLY way to check
// the house-style rules in art/models/receiptobjects.js — chunky proportions,
// few flat colours, heavy edges, one loud identifying feature — is to look at
// them next to a fighter. So each is wrapped in the same tiny interface a
// creature exposes and benched through the same door.
const OBJECT_BENCH = {};
for (const [k, build] of Object.entries({ ...OBJECT_MODELS, ...JUNK, wreck: buildVendingWreck })) {
  OBJECT_BENCH['obj\u00b7' + k] = {
    build: () => {
      const g = new THREE.Group();
      const node = build();
      g.add(node);
      const box = new THREE.Box3().setFromObject(node);
      const size = box.getSize(new THREE.Vector3());
      return {
        group: g, body: node,
        height: size.y, radius: Math.max(size.x, size.z) * 0.5,
        setReveal() {}, setLOD() {},
        tick(dt, st = {}) { if (st.spin) g.rotation.y += dt * 0.9; }
      };
    },
    states: { still: {}, spin: { spin: 1 } }
  };
}

const CREATURES = {
  ...OBJECT_BENCH,
  // ---- INO'S FOUR AUSPICIOUS BEASTS 瑞獣 -------------------------------------
  // They keep the same `tick(dt, st)` contract every creature here does, so
  // they need no special case — but they are worth benching for a reason the
  // others are not: this family is TRANSLUCENT, and translucency is the one
  // material property that cannot be judged from code. `manifest` at 0.35 is
  // on the bench deliberately (as `forming`), because the half-arrived state
  // is the one a player sees most.
  'beast·kaichi': { build: BEAST_BUILDERS.kaichi, states: { idle: {}, walk: { gait: 1 }, strike: { strike: 1 }, forming: { reveal: 0.35 } } },
  'beast·reiki': { build: BEAST_BUILDERS.reiki, states: { idle: {}, walk: { gait: 1 }, strike: { strike: 1 }, forming: { reveal: 0.35 } } },
  'beast·kirin': { build: BEAST_BUILDERS.kirin, states: { idle: {}, walk: { gait: 1 }, strike: { strike: 1 }, forming: { reveal: 0.35 } } },
  'beast·ryu': { build: BEAST_BUILDERS.ryu, states: { idle: {}, swim: { gait: 1 }, strike: { strike: 1 }, forming: { reveal: 0.35 } } },
  'dog·white': { build: () => buildDivineDog(true), states: { idle: { speed: 0 }, run: { speed: 6 }, bite: { speed: 4, action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  'dog·black': { build: () => buildDivineDog(false), states: { idle: { speed: 0 }, run: { speed: 6 }, bite: { speed: 4, action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  nue: { build: buildNue, states: { fly: {}, dive: { action: 'dive', actionK: 0.7 }, hurt: { hurt: true } } },
  toad: { build: buildToad, states: { idle: { speed: 0 }, hop: { speed: 2 }, tongue: { tongue: 1 }, hurt: { hurt: true } } },
  serpent: { build: buildGreatSerpent, states: { idle: { speed: 0 }, rush: { rush: 1, speed: 8 }, coil: { coil: 1 }, bite: { action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  elephant: { build: buildMaxElephant, states: { idle: { speed: 0 }, walk: { speed: 2 }, torrent: { torrent: 1 }, hurt: { hurt: true } } },
  rabbits: { build: () => buildRabbitSwarm(22), states: { swarm: { spread: 1 } } },
  // ---- GARUDA — Yuki's permanent partner ------------------------------------
  // Not one of Megumi's, and it loads here rather than in BUILDERS because it
  // is not a humanoid: no rig, no clip set, a procedural animator. `mass` is
  // the Star Rage charge poured through the bone, which is the one state worth
  // having on the bench because it is the only thing that changes its colour.
  // ---- DAGON'S OCEAN SHIKIGAMI ---------------------------------------------
  // The four that fill Horizon of the Captivating Skandha. Each exposes the
  // states its own animator actually reads, so the bench shows the wind-up on
  // the two with a tell (the eel's throat swell, the shark's jaw) rather than
  // only the swim cycle.
  'sea·piranha': {
    build: () => buildPiranhaShoal(14),
    states: { swarm: { speed: 4 }, hold: { speed: 0 }, bite: { speed: 3, action: 'bite', actionK: 0.7 }, hurt: { hurt: true } }
  },
  'sea·crab': {
    build: buildArmouredCrab,
    states: { idle: { speed: 0 }, scuttle: { speed: 2.6 }, snap: { speed: 0, action: 'snap', actionK: 0.8 }, ram: { speed: 3, action: 'ram', actionK: 0.7 }, hurt: { hurt: true } }
  },
  'sea·eel': {
    build: buildEelSerpent,
    states: { swim: { speed: 3 }, 'spit·wind': { speed: 1, action: 'spit', actionK: 0.6 }, 'spit·fire': { speed: 1, action: 'spit', actionK: 0.95 }, hurt: { hurt: true } }
  },
  'sea·shark': {
    build: buildGreatShark,
    states: { cruise: { speed: 2 }, 'bite·open': { speed: 2, action: 'bite', actionK: 0.6 }, 'bite·close': { speed: 2, action: 'bite', actionK: 0.95 }, hurt: { hurt: true } }
  },
  garuda: {
    build: buildGaruda,
    states: {
      hover: { state: 'hover', speed: 0 },
      fly: { state: 'fly', speed: 1 },
      dive: { state: 'dive', speed: 1, actionK: 0.7 },
      hurt: { state: 'hurt' },
      recover: { state: 'recover', speed: 0.6 },
      'mass·full': { state: 'hover', speed: 0.2, mass: 1 }
    }
  },
  // ---- THE THREE NEW BEASTS ------------------------------------------------
  // `heal` is Round Deer's reverse-cursed-technique aura, `charge` is the
  // Piercing Ox's runway (its entire identity — at 0 it is a shove, at 1 it is
  // the biggest single hit Megumi owns), and Tiger Funeral gets the full melee
  // state set because it is the all-rounder.
  deer: {
    build: buildRoundDeer,
    states: { idle: { speed: 0 }, walk: { speed: 3 }, heal: { heal: 1 }, hurt: { hurt: true } }
  },
  ox: {
    build: buildPiercingOx,
    states: { idle: { speed: 0 }, walk: { speed: 3 }, charge: { speed: 12, charge: 1 }, hurt: { hurt: true } }
  },
  tiger: {
    build: buildTigerFuneral,
    states: {
      idle: { speed: 0 }, run: { speed: 7 }, swipe: { speed: 2, action: 'swipe', actionK: 0.55 },
      bite: { action: 'bite', actionK: 0.5 }, pounce: { action: 'pounce', actionK: 0.8 }, hurt: { hurt: true }
    }
  },
  // ---- THE THREE FUSIONS ---------------------------------------------------
  totality: {
    build: buildDivineDogTotality,
    states: {
      idle: { speed: 0 }, run: { speed: 9 }, slash: { speed: 3, action: 'slash', actionK: 0.6 },
      bite: { action: 'bite', actionK: 0.5 }, hurt: { hurt: true }
    }
  },
  agito: {
    build: buildMergedBeastAgito,
    states: {
      idle: { speed: 0 }, walk: { speed: 4 }, grab: { action: 'grab', actionK: 0.7 },
      zap: { charge: 1 }, regen: { heal: 1 }, hurt: { hurt: true }
    }
  },
  'winged toads': {
    build: () => buildWingedToads(3),
    states: { fly: {}, tongue: { tongue: 1 }, hurt: { hurt: true } }
  },
  // ---- MAHITO'S TRANSFIGURED HUMANS ---------------------------------------
  // Five body plans, and the bench is the only place they can be compared side
  // by side — in a fight only one exists at a time. `surface` is the beat where
  // the person inside gets back to the surface, which is the state that most
  // needs looking at because it is the one that has to land as horror rather
  // than as a wobble.
  ...Object.fromEntries(TRANSFIGURED_IDS.map(id => [`tf·${id}`, {
    build: () => buildTransfigured(id),
    states: {
      idle: { speed: 0 }, walk: { speed: 3.4 },
      swipe: { speed: 1, action: 'swipe', actionK: 0.6 },
      surface: { speed: 0, surface: 1 }, hurt: { hurt: true }
    }
  }])),
  // GETO'S TWO LOW-GRADE CURSES. On the bench for the same reason the
  // shikigami are: they are entity models with their own animators rather than
  // CharacterModels, so this simpler path is the only place they can be
  // inspected at all. `maw` opens its jaw on `bite`; `wisp` lashes its tendril
  // curtain on `lash`.
  // ---- YAGA'S FOUR CURSED CORPSE TIERS -------------------------------------
  // On the bench for exactly the reason the transfigured-human set is: "each
  // tier must be a VISIBLY different model, not one model rescaled" is a claim
  // that can only be checked by standing them in a row. `deploy` runs the
  // assembly reveal, which is the beat that has to read as CONSTRUCTION rather
  // than as a summon.
  ...Object.fromEntries(CORPSE_IDS.map(k => [
    'corpse ' + k,
    {
      build: () => buildCursedCorpse(k),
      states: {
        idle: { speed: 0 }, walk: { speed: 3 }, run: { speed: 6 },
        swipe: { speed: 1, action: 'swipe', actionK: 0.8 },
        lunge: { speed: 6, action: 'lunge', actionK: 1 },
        slam: { action: 'slam', actionK: 0.5 },
        commanded: { speed: 4, commanded: true },
        collapse: { collapse: 0.6 }
      }
    }
  ])),
  maw: { build: buildGapingMaw, states: { idle: { speed: 0 }, hop: { speed: 5 }, bite: { speed: 2, action: 'bite', actionK: 0.8 }, hurt: { hurt: true } } },
  wisp: { build: buildTendrilWisp, states: { idle: { speed: 0 }, drift: { speed: 4 }, lash: { action: 'lash', actionK: 0.9 }, hurt: { hurt: true } } },
  // ---- THE REST OF GETO'S STABLE -------------------------------------------
  // Ten more original curse bodies. The bench is the only place they can be
  // judged against each other, and "as a set they should share a visual
  // grammar while staying individually identifiable" is a claim that can only
  // be checked by looking at them in a row.
  centipede: { build: buildCentipede, states: { idle: { speed: 0 }, run: { speed: 8 }, bite: { speed: 3, action: 'bite', actionK: 0.8 }, hurt: { hurt: true } } },
  'decoy eye': { build: buildDecoyEye, states: { idle: { speed: 0 }, drift: { speed: 3 }, lash: { action: 'lash', actionK: 0.9 }, hurt: { hurt: true } } },
  'flesh-eater': { build: buildFleshEater, states: { idle: { speed: 0 }, crawl: { speed: 5 }, bite: { speed: 1, action: 'bite', actionK: 0.9 }, hurt: { hurt: true } } },
  'ko-guy': { build: buildKoGuy, states: { idle: { speed: 0 }, hop: { speed: 6 }, bite: { speed: 2, action: 'bite', actionK: 0.8 }, spit: { action: 'spit', actionK: 0.8 }, hurt: { hurt: true } } },
  fungus: { build: buildFungusHead, states: { idle: { speed: 0 }, lean: { speed: 2 }, grab: { action: 'grab', actionK: 0.9 }, hurt: { hurt: true } } },
  daruma: { build: buildDaruma, states: { idle: { speed: 0 }, rock: { speed: 4 }, slam: { action: 'slam', actionK: 0.5 }, hurt: { hurt: true } } },
  pillar: { build: buildPillarCurse, states: { idle: { speed: 0 }, drift: { speed: 2 }, aim: { action: 'aim', actionK: 1 }, hurt: { hurt: true } } },
  manta: { build: buildMantaRay, states: { fly: {}, carry: { carry: 1 }, dive: { action: 'dive', actionK: 0.8 }, hurt: { hurt: true } } },
  dragon: { build: buildRainbowDragon, states: { fly: { speed: 0 }, swim: { speed: 5 }, smash: { action: 'smash', actionK: 0.8 }, bite: { action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  hookworm: { build: buildHookworm, states: { idle: { speed: 0 }, sway: { speed: 1 }, grab: { action: 'grab', actionK: 0.9 }, hurt: { hurt: true } } },
  // THE SWARM. Not a creature — one InstancedMesh of tiny roaches — but the
  // bench is where a model gets judged, and "the single biggest performance
  // risk in this addition" is not something to first look at in a fight. The
  // states step the instance count so the silhouette can be checked one roach
  // at a time and then at full density.
  roaches: {
    build: () => {
      const swarm = new RoachSwarm(220);
      const grp = new THREE.Group();
      grp.add(swarm.mesh);
      // one static roach, blown up, purely so the viewer's auto-framing has
      // bounds to measure and so a single body can be inspected up close
      const solo = new THREE.Mesh(swarm.mesh.geometry, swarm.material);
      solo.scale.setScalar(0.9);
      solo.position.set(0, 0.1, 0);
      grp.add(solo);
      let t = 0;
      return {
        group: grp, body: solo,
        setReveal(k) { solo.visible = k > 0.5; },
        tick(dt, st) {
          t += dt;
          const n = st?.n ?? 0;
          swarm.begin();
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 * 3 + t * 0.7;
            const r = 0.6 + (i % 9) * 0.16;
            swarm.write(Math.sin(a) * r, 0.02, Math.cos(a) * r, a + Math.PI / 2, 0.12, t * 12 + i);
          }
          swarm.commit();
        }
      };
    },
    states: { one: { n: 0 }, few: { n: 24 }, wave: { n: 90 }, capped: { n: 220 } }
  },
  // Higuruma's shikigami: same construct family, driven the same way. `tilt`
  // is the balance leaning toward the guilty party as evidence accumulates.
  judgeman: {
    build: buildJudgeman,
    states: { idle: { tilt: 0 }, weighing: { tilt: 0.5 }, guilty: { tilt: 1 }, hurt: { hurt: true, tilt: 0.3 } }
  }
};

export function startViewer() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1e2c);
  scene.fog = new THREE.Fog(0x1a1e2c, 8, 30);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  let camYaw = 0.4, camPitch = 0.12, camDist = 4.2, camHeight = 1.0;

  // key / fill / rim
  const key = new THREE.DirectionalLight(0xfff0dc, 2.6); key.position.set(4, 7, 5);
  const rim = new THREE.DirectionalLight(0x86b4ff, 1.8); rim.position.set(-5, 6, -6);
  const hemi = new THREE.HemisphereLight(0x8ca0cc, 0x4a4038, 0.7);
  scene.add(key, rim, hemi);

  // pedestal
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.5, 0.12, 40),
    new THREE.MeshStandardMaterial({ color: 0x272c3e, roughness: 0.9 }));
  pedestal.position.y = -0.06;
  scene.add(pedestal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.02, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x5f7fd0 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.01;
  scene.add(ring);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 32),
    new THREE.MeshStandardMaterial({ color: 0x151824, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.12;
  scene.add(ground);

  let model = null, player = null, rika = null, skelHelper = null;
  let lineupGroup = null, lineupPlayers = [];
  let creature = null;                     // {model, states} for a shikigami
  let turntable = true, wire = false;
  let currentChar = 'gojo', currentClip = 'idle';

  const holder = new THREE.Group();
  scene.add(holder);

  function loadChar(id) {
    currentChar = id;
    if (model) { holder.remove(model.group); model = null; player = null; }
    if (creature) { holder.remove(creature.model.group); creature = null; }
    if (rika) { scene.remove(rika.group); rika = null; }
    if (skelHelper) { scene.remove(skelHelper); skelHelper = null; }
    if (CREATURES[id]) {
      const c = CREATURES[id];
      const built = c.build();
      built.setReveal(1);
      holder.add(built.group);
      creature = { model: built, states: c.states };
      currentClip = Object.keys(c.states)[0];
      clipBar.style.display = '';
      // frame the creature: a 5 m serpent and a 0.5 m rabbit cannot share one
      // camera distance, so measure the built bounds rather than guessing
      // `body` is the shikigami models' inner group (the thing that rises out
      // of the shadow pool); the transfigured humans and the curses have no
      // such split and measure their whole group instead.
      const box = new THREE.Box3().setFromObject(built.body ?? built.group);
      const size = box.getSize(new THREE.Vector3());
      camDist = Math.max(2.2, Math.max(size.x, size.y, size.z) * 1.5 + 1.0);
      camHeight = Math.max(0.35, (box.min.y + box.max.y) / 2);
      refreshClipButtons();
      return;
    }
    const fr = FRAMING[id];
    camDist = fr ? fr.dist : 4.2;
    camHeight = fr ? fr.height : 1.0;
    if (id === 'rika') {
      rika = buildRika();
      holder.add(rika.group);
      clipBar.style.display = 'none';
      return;
    }
    clipBar.style.display = '';
    model = BUILDERS[id]();
    maybeAttachRender3D(model, id);
    holder.add(model.group);
    // a variant shares its base character's clip set — 'yuji:modulo' is still
    // Yuji as far as animation is concerned, which is the whole point of
    // authoring variants as meshes over a shared rig
    player = new AnimPlayer(model.bones, makeClips(id.split(':')[0]));
    // ---- THE FINISHER SET ------------------------------------------------
    // Installed onto the bench's player exactly as finishers/index.js installs
    // it onto a fighter, through the same retargeter — so what plays here is
    // what plays in the cinematic, including the stance fallback and the
    // per-body scaling of the metre-valued Hips track. `installClips` wants a
    // fighter; a bench model is a `{anim, model}` shim away from being one.
    const shim = { anim: player, model };
    installClips(shim, FIGHT_HUMAN, { authoredH: 1.8 });
    installClips(shim, FIGHT_GIANT, { authoredH: 3.6 });
    installClips(shim, SIGNATURE_CLIPS, { authoredH: 1.8 });
    playClip(currentClip);
    if (boneToggle.checked) {
      skelHelper = new THREE.SkeletonHelper(model.group);
      scene.add(skelHelper);
    }
    setWire(wire);
    refreshClipButtons();
  }

  function playClip(name) {
    if (creature) {
      if (creature.states[name]) currentClip = name;
      refreshClipButtons();
      return;
    }
    if (!player) return;
    if (!player.has(name)) name = 'idle';
    currentClip = name;
    player.play(name, { fade: 0.15, restart: true });
    // PROP ROUTING MATCHES ON THE BARE NAME. Finisher clips are installed under
    // a `fin_` prefix, and every rule below was written against the unprefixed
    // one — so `fin_higurumaExecute` would have been inspected with the
    // briefcase in his hand instead of the Executioner's Sword.
    const name0 = name.replace(new RegExp('^' + FIN_PREFIX), '');
    // TOJI'S ARSENAL. Four tools on one model, exactly one ever in hand, and
    // which one is the whole point of the character — the finisher swaps from
    // the Playful Cloud to the Inverted Spear mid-scene, so the bench has to
    // be able to show either.
    if (model.props.has('inverted_spear')) {
      const tool = /Spear|tojiSpear/.test(name0) ? 'inverted_spear'
        : /Cloud/.test(name0) ? 'playful_cloud'
          : /Soul/.test(name0) ? 'split_soul'
            : /Chain/.test(name0) ? 'chain'
              : /^(arsenal|assassinate|taunt)$/.test(name0) ? 'playful_cloud' : null;
      for (const k of ['inverted_spear', 'playful_cloud', 'split_soul', 'chain']) {
        model.attachProp(k, k === tool ? 'hand' : 'away');
      }
      if (model.props.has('curse')) model.attachProp('curse', /^(arsenal|draw)/.test(name0) ? 'hand' : 'away');
    }
    // katana/blade props follow the clip family
    if (model.props.has('katana')) model.attachProp('katana', /ct|domain|sword|ult/.test(name0) ? 'hand' : 'away');
    if (model.props.has('blade')) model.attachProp('blade', /ct1|ult|victory|heavy|yutaRikaCut/.test(name0) ? 'hand' : 'back');
    if (model.props.has('tool')) model.attachProp('tool', /punch|heavy|summon|domain|victory|wheel/.test(name0) ? 'hand' : 'back');
    // NOBARA. Her three props follow the clip family exactly as the fighter's
    // `_props` routes them in a match — the bench has to mirror it or half her
    // set is inspected with the wrong things in her hands, which is precisely
    // how the doll would end up visible during the idle without anyone seeing.
    if (model.props.has('hammer')) {
      // stowed entirely for the two clips where both hands hold something else
      model.attachProp('hammer', /^(ct2|ult)/.test(name0) ? 'away'
        : /^(punch|heavy|bfStrike|bfImpact|victory|nobaraResonance)/.test(name0) ? 'hand' : 'shoulder');
    }
    if (model.props.has('nail')) {
      model.attachProp('nail',
        /^(ct2|ult|nobaraResonance|nobaraGrin)/.test(name0) ? 'drive' : /^(ct1|detonate)/.test(name0) ? 'hand' : 'away');
    }
    if (model.props.has('doll')) {
      model.attachProp('doll', /^(ct2|ult|nobaraResonance|nobaraGrin)/.test(name0) ? 'hand' : 'away');
    }
    // Higuruma carries the case by default and swaps to the sword for every
    // sword/exec clip — the viewer has to mirror that or half his set is
    // inspected with the wrong object in his hand.
    if (model.props.has('sword')) {
      const armed = /^(sword|exec|higurumaExecute)/.test(name0);
      model.attachProp('sword', armed ? 'hand' : 'away');
      model.attachProp('case', armed ? 'away' : 'hand');
    }
    refreshClipButtons();
  }

  function setWire(on) {
    wire = on;
    if (!model) return;
    for (const mesh of Object.values(model.meshes)) mesh.material.wireframe = on;
  }

  // ---- UI ------------------------------------------------------------------
  const ui = document.getElementById('ui-root');
  ui.innerHTML = `
    <div class="viewer-panel">
      <h1>MODEL VIEWER</h1>
      <div id="charBar"></div>
      <div class="v-sec">
        <div class="v-sec-head">ANIMATION</div>
        <div class="v-clips" id="clipBar"></div>
      </div>
      <div class="v-sec" id="finSec">
        <div class="v-sec-head">FINISHER · SIGNATURE<i id="finCount"></i></div>
        <div class="v-clips" id="finBar"></div>
      </div>
      <div class="v-sec" id="libSec">
        <div class="v-sec-head">FINISHER · FIGHT SET<i id="libCount"></i></div>
        <div class="v-clips" id="libBar"></div>
      </div>
      <div class="v-sec">
        <div class="v-sec-head">DISPLAY</div>
        <div class="v-toggles">
          <label class="v-toggle"><input type="checkbox" id="tgTurn" checked><span>TURNTABLE</span></label>
          <label class="v-toggle"><input type="checkbox" id="tgOutline" checked><span>OUTLINES</span></label>
          <label class="v-toggle"><input type="checkbox" id="tgWire"><span>WIREFRAME</span></label>
          <label class="v-toggle"><input type="checkbox" id="tgBones"><span>SKELETON</span></label>
        </div>
      </div>
      <p class="v-hint">DRAG ORBIT &nbsp;·&nbsp; WHEEL ZOOM &nbsp;·&nbsp; <a href="./#" onclick="location.hash='';">BACK TO GAME</a></p>
    </div>`;
  const charBar = document.getElementById('charBar');

  // THE BENCH LISTS EVERYTHING IT CAN BUILD.
  // The old list was hand-maintained and had drifted: SUKUNA and TOJI were
  // missing outright, and every one of the seven variant models was reachable
  // only by typing `__viewer.loadChar('sukuna:megumi')` into the console. A
  // variant you cannot click is a variant nobody iterates on — which is the
  // exact failure the variants rule exists to prevent — so the sections are
  // now DERIVED from BUILDERS and CREATURES rather than written out by hand,
  // and adding a model to either map puts it on the bench for free.
  //
  // "Fighter" means ON THE ROSTER, which is why that split is taken from
  // ROSTER_IDS rather than from "has a builder": Mahoraga has a builder and is
  // not selectable, so keying off the builder map filed him under FIGHTERS.
  const baseIds = Object.keys(BUILDERS).filter(k => !k.includes(':'));
  const variantIds = Object.keys(BUILDERS).filter(k => k.includes(':'));
  const fighterIds = baseIds.filter(id => ROSTER_IDS.includes(id));
  const SECTIONS = [
    { head: 'FIGHTERS', ids: fighterIds },
    { head: 'VERSIONS', ids: variantIds },
    {
      head: 'SUMMONS',
      ids: [...baseIds.filter(id => !fighterIds.includes(id)), 'rika', ...Object.keys(CREATURES)]
    }
  ];
  const charButtons = [];
  for (const sec of SECTIONS) {
    if (!sec.ids.length) continue;
    const wrap = document.createElement('div');
    wrap.className = 'v-sec';
    const head = document.createElement('div');
    head.className = 'v-sec-head';
    head.innerHTML = sec.head + `<i>${sec.ids.length}</i>`;
    const grid = document.createElement('div');
    grid.className = 'v-grid';
    for (const id of sec.ids) {
      const b = document.createElement('button');
      // a variant reads as "SUKUNA · MEGUMI" rather than as a raw pick id
      b.textContent = id.replace(':', ' · ').replace('·', '·').toUpperCase();
      b.className = 'v-btn' + (id.includes(':') ? ' v-btn-var' : '');
      b.dataset.id = id;
      b.onclick = () => { loadChar(id); refreshCharButtons(); };
      grid.appendChild(b);
      charButtons.push(b);
    }
    wrap.append(head, grid);
    charBar.appendChild(wrap);
  }
  const clipBar = document.getElementById('clipBar');
  const libSec = document.getElementById('libSec');
  const finBar = document.getElementById('finBar');
  const finSec = document.getElementById('finSec');
  const finCount = document.getElementById('finCount');
  const libBar = document.getElementById('libBar');
  const libCount = document.getElementById('libCount');
  // Which signature clips belong to the character on the bench. The set is
  // named after its owner (`tojiSpear`, `jogoMeteor`), so the owner is
  // recoverable from the name — and a character's own two or three clips
  // buried in eighty-seven shared ones is the same as not listing them.
  const SIG_NAMES = Object.keys(SIGNATURE_CLIPS);
  function ownSignatures(id) {
    const base = id.split(':')[0].toLowerCase();
    const stem = base.slice(0, 4);
    return new Set(SIG_NAMES.filter(n => n.toLowerCase().startsWith(stem)));
  }
  function refreshCharButtons() {
    // match on the DATA ID, not on the label — the label is now formatted for
    // reading ("SUKUNA · MEGUMI") and no longer equals the id
    charButtons.forEach(b => b.classList.toggle('active', b.dataset.id === currentChar));
  }
  function refreshClipButtons() {
    clipBar.innerHTML = '';
    if (creature) {
      for (const name of Object.keys(creature.states)) {
        const b = document.createElement('button');
        b.textContent = name;
        b.className = 'v-btn v-btn-sm' + (name === currentClip ? ' active' : '');
        b.onclick = () => playClip(name);
        clipBar.appendChild(b);
      }
      // a dissolve scrub so summon/death can be checked frame by frame
      const r = document.createElement('input');
      r.type = 'range'; r.min = 0; r.max = 1; r.step = 0.01; r.value = 1;
      r.className = 'v-range';
      r.oninput = () => creature.model.setReveal(Number(r.value));
      clipBar.appendChild(r);
      return;
    }
    if (!player) return;
    // THE CHARACTER'S OWN SET and THE FINISHER SET are listed separately. Both
    // live in the same clip map — the finisher ones under a `fin_` prefix —
    // and mixing seventy buttons into one wall was how the finisher clips
    // stayed invisible on the bench in the first place.
    finBar.innerHTML = '';
    libBar.innerHTML = '';
    const own = ownSignatures(currentChar);
    let fin = 0, lib = 0;
    for (const name of player.clips.keys()) {
      const isFin = name.startsWith(FIN_PREFIX);
      const bare = isFin ? name.slice(FIN_PREFIX.length) : name;
      const b = document.createElement('button');
      b.textContent = bare;
      b.className = 'v-btn v-btn-sm' + (name === currentClip ? ' active' : '') + (isFin ? ' v-btn-var' : '');
      b.onclick = () => playClip(name);
      if (!isFin) { clipBar.appendChild(b); continue; }
      if (own.has(bare)) { finBar.appendChild(b); fin++; } else { libBar.appendChild(b); lib++; }
    }
    finCount.textContent = fin;
    libCount.textContent = lib;
    // a character with no signature clip of its own says so by absence rather
    // than by an empty box
    finSec.style.display = fin ? '' : 'none';
    libSec.style.display = lib ? '' : 'none';
  }
  const boneToggle = document.getElementById('tgBones');
  document.getElementById('tgTurn').onchange = e => turntable = e.target.checked;
  document.getElementById('tgOutline').onchange = e => {
    if (!model) return;
    model.group.traverse(o => { if (o.name.endsWith('_outline')) o.visible = e.target.checked; });
  };
  document.getElementById('tgWire').onchange = e => setWire(e.target.checked);
  boneToggle.onchange = e => {
    if (skelHelper) { scene.remove(skelHelper); skelHelper = null; }
    if (e.target.checked && model) { skelHelper = new THREE.SkeletonHelper(model.group); scene.add(skelHelper); }
  };

  // orbit controls (minimal)
  let dragging = false, px = 0, py = 0;
  canvas.addEventListener('pointerdown', e => { dragging = true; px = e.clientX; py = e.clientY; });
  addEventListener('pointerup', () => dragging = false);
  addEventListener('pointermove', e => {
    if (!dragging) return;
    camYaw -= (e.clientX - px) * 0.008;
    camPitch = Math.max(-0.5, Math.min(1.2, camPitch + (e.clientY - py) * 0.005));
    px = e.clientX; py = e.clientY;
  });
  canvas.addEventListener('wheel', e => {
    camDist = Math.max(1.2, Math.min(26, camDist + e.deltaY * 0.006));
  }, { passive: true });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  loadChar('gojo');
  refreshCharButtons();

  function updateCamera() {
    camera.position.set(
      Math.sin(camYaw) * camDist * Math.cos(camPitch),
      camHeight + Math.sin(camPitch) * camDist,
      Math.cos(camYaw) * camDist * Math.cos(camPitch));
    camera.lookAt(0, camHeight, 0);
  }

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (turntable) holder.rotation.y += dt * 0.5;
    if (player) player.update(dt);
    if (model) model.update(dt);
    if (creature) {
      const st = creature.states[currentClip] || {};
      // a bench state may pin the manifestation amount — Ino's beasts use it to
      // show the half-arrived form, which is the state this family is for
      if (st.reveal != null && creature.model.reveal !== st.reveal) creature.model.setReveal(st.reveal);
      else if (st.reveal == null && creature.model.reveal < 1) creature.model.setReveal(1);
      creature.model.tick(dt, st);
    }
    for (const l of lineupPlayers) { l.player.update(dt); l.model.update(dt); }
    if (rika) rika.update(dt);
    updateCamera();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  // ---- headless capture / drive hook (dev iteration) ----------------------
  window.__viewer = {
    loadChar, playClip,
    get model() { return model; },
    setCam(yaw, pitch, dist, height) { camYaw = yaw; camPitch = pitch; camDist = dist; camHeight = height; },
    setSpin(rad) { turntable = false; holder.rotation.y = rad; },
    get creature() { return creature; },
    setReveal(k) { creature?.model.setReveal(k); },
    step(t, n = 1) {
      for (let i = 0; i < n; i++) {
        if (player) player.update(t);
        if (model) model.update(t);
        if (creature) creature.model.tick(t, { ...creature.states[currentClip] });
        for (const l of lineupPlayers) { l.player.update(t); l.model.update(t); }
        if (rika) rika.update(t);
      }
    },
    // SCALE CHECK: the whole cast standing on one line, so a new character's
    // height can be judged against the roster rather than against a pedestal.
    lineup(ids = ['megumi', 'yuji', 'nanami', 'yuta', 'gojo', 'hakari', 'todo', 'mahoraga']) {
      if (model) { holder.remove(model.group); model = null; player = null; }
      if (creature) { holder.remove(creature.model.group); creature = null; }
      if (lineupGroup) { scene.remove(lineupGroup); lineupGroup = null; }
      lineupGroup = new THREE.Group();
      lineupPlayers = [];
      let x = 0;
      for (const id of ids) {
        const mdl = BUILDERS[id]();
        const gap = id === 'mahoraga' ? 2.1 : 1.15;
        x += gap;
        mdl.group.position.x = x;
        x += gap * 0.15;
        lineupGroup.add(mdl.group);
        const pl = new AnimPlayer(mdl.bones, makeClips(id));
        pl.play('idle', { fade: 0, restart: true });
        lineupPlayers.push({ model: mdl, player: pl });
      }
      // centre the row
      lineupGroup.position.x = -x / 2;
      scene.add(lineupGroup);
      pedestal.visible = ring.visible = false;
      turntable = false;
      holder.rotation.y = 0;
      camDist = x * 1.25 + 4;
      camHeight = 1.9;
      clipBar.style.display = 'none';
      return 'lineup: ' + ids.join(' ');
    },
    // PROP BENCH. A weapon judged in a fighter's hand is judged at 5 m through
    // a fist — which is how the first Playful Cloud shipped with its outline
    // hulls in the wrong space without anyone seeing. This lifts a prop off the
    // bone and stands it on the pedestal by itself.
    showProp(name, dist = 1.9, height = 0.9) {
      if (!model?.props?.has(name)) return 'no prop: ' + [...(model?.props?.keys() ?? [])].join(',');
      const p = model.props.get(name);
      holder.add(p.node);
      p.node.position.set(0, 0.10, 0);
      p.node.rotation.set(0, 0, 0);
      p.node.visible = true;
      // the owner is hidden, or the prop is judged through a pair of trousers
      model.setVisible(false);
      camDist = dist; camHeight = height;
      turntable = false;
      return 'prop: ' + name;
    },
    hideProp(name) {
      if (!model?.props?.has(name)) return 'no prop';
      model.attachProp(name, 'away');
      model.setVisible(true);
      return 'stowed ' + name;
    },
    clearLineup() {
      if (lineupGroup) { scene.remove(lineupGroup); lineupGroup = null; lineupPlayers = []; }
      pedestal.visible = ring.visible = true;
      loadChar(currentChar);
    },
    // CONTACT SHEET. A model is judged from one angle at a time, which is how
    // a hand ends up inside a hip: the fault is only visible from the side.
    // `sheet` renders a grid of (clip × yaw) cells into one PNG so a whole
    // character — every clip, four sides — arrives as a single image.
    //
    // Cells must be rendered SYNCHRONOUSLY (render → toDataURL in one task):
    // the renderer has no preserveDrawingBuffer, so anything captured after a
    // rAF boundary comes back blank. That is why this lives here rather than
    // being driven from the console.
    //
    // Sample time is reached by STEPPING AT 1/60, never by one big update():
    // a single `update(0.4)` leaves the spring chains and the pose blend
    // somewhere the game never puts them, and the result was every second
    // character reading as a T-pose on the sheet while being fine in-engine.
    // `dist` / `height` override the character's FRAMING entry for this sheet
    // only, and are restored afterwards. Added while building Reggie: his
    // hairstyle is the whole silhouette and a full-body frame is too far away
    // to judge it, so a head-tight diagnostic pass has to be shootable without
    // editing the framing table every time.
    async sheet(name, { clips = null, yaws = [0, Math.PI * 0.75], cw = 300, ch = 380, t = 0.45, cols = 0, dist = null, height = null, state = null } = {}) {
      const camWas = [camDist, camHeight];
      if (dist != null) camDist = dist;
      // `height: 'head'` frames on the model's own head centre, so one job
      // list can shoot every character's face at the same tightness
      if (height === 'head') camHeight = model?.m?.headC?.y ?? camHeight;
      else if (height != null) camHeight = height;
      // `state` applies model-level toggles for the duration of the sheet —
      // things that are not clips and cannot be reached from the clip bar.
      // Added for Ino, whose ski mask is a piece of geometry with two states
      // and whose DOWN state is half the character: without this there is no
      // way to bench the single most important pose he has. It is a generic
      // passthrough rather than an Ino special case, so Reggie's thinning coat
      // (`setStock`) benches through the same door.
      if (state && model) {
        if (state.mask != null) model.setMask?.(state.mask);
        if (state.stock != null) model.setStock?.(state.stock);
        if (state.beastTint != null) model.setBeastTint?.(state.beastTint);
        if (state.sukuna != null) model.setSukuna?.(state.sukuna);
      }
      const names = clips || (creature ? Object.keys(creature.states)
        : player ? [...player.clips.keys()] : ['idle']);
      const perRow = cols || yaws.length;
      const total = names.length * yaws.length;
      const rows = Math.ceil(total / perRow);
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = perRow * cw;
      sheetCanvas.height = rows * ch;
      const ctx = sheetCanvas.getContext('2d');
      ctx.fillStyle = '#0e1018';
      ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
      const wasTurn = turntable;
      turntable = false;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      let i = 0;
      for (const clip of names) {
        playClip(clip);
        // settle the clip: fade in from the previous pose, then advance to the
        // sample time so the cell shows the MIDDLE of the action, not frame 0
        if (player) player.play(clip, { fade: 0, restart: true });
        for (const yaw of yaws) {
          holder.rotation.y = yaw;
          // re-seek per cell so both yaws show the identical frame
          if (player) player.play(clip, { fade: 0, restart: true });
          for (let s = 0; s < Math.round(t * 60); s++) {
            if (player) player.update(1 / 60);
            if (model) model.update(1 / 60);
            if (creature) creature.model.tick(1 / 60, { ...creature.states[clip] });
          }
          updateCamera();
          renderer.render(scene, camera);
          const col = i % perRow, row = (i / perRow) | 0;
          ctx.drawImage(canvas, col * cw, row * ch, cw, ch);
          ctx.fillStyle = '#ffd86b';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`${clip} ${Math.round(yaw * 57)}°`, col * cw + 8, row * ch + 20);
          ctx.strokeStyle = '#2a3048';
          ctx.strokeRect(col * cw + 0.5, row * ch + 0.5, cw - 1, ch - 1);
          i++;
        }
      }
      turntable = wasTurn;
      camDist = camWas[0]; camHeight = camWas[1];
      resize();
      await fetch('/__shot', {
        method: 'POST',
        body: JSON.stringify({ name, data: sheetCanvas.toDataURL('image/png') })
      });
      return `sheet ${name}: ${names.length} clips × ${yaws.length} yaws`;
    },
    // CAST SHEET. The same idea across characters instead of across clips:
    // one row per character, one column per yaw. This is the palette/silhouette
    // review — reading 20 separate turntables never catches "these four are the
    // same shade of black".
    async castSheet(name, ids, { clip = 'idle', yaws = [0, Math.PI / 2, Math.PI], cw = 260, ch = 340, t = 0.4 } = {}) {
      const perRow = yaws.length;
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = perRow * cw;
      sheetCanvas.height = ids.length * ch;
      const ctx = sheetCanvas.getContext('2d');
      ctx.fillStyle = '#0e1018';
      ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
      const wasTurn = turntable, wasChar = currentChar;
      turntable = false;
      for (let r = 0; r < ids.length; r++) {
        loadChar(ids[r]);
        // loadChar re-frames the camera per character (Mahoraga is 3.6 m), so
        // the size/aspect has to be re-applied AFTER the load, not before it
        renderer.setSize(cw, ch, false);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        if (player && player.has(clip)) { player.play(clip, { fade: 0, restart: true }); }
        for (let c = 0; c < perRow; c++) {
          holder.rotation.y = yaws[c];
          if (player) player.play(clip, { fade: 0, restart: true });
          // step at 1/60 — see the note on sheet(); one big update() reads as a
          // T-pose for every character whose stance leans on the spring rig
          for (let s = 0; s < Math.round(t * 60); s++) {
            if (player) player.update(1 / 60);
            if (model) model.update(1 / 60);
            if (creature) creature.model.tick(1 / 60, { ...creature.states[currentClip] });
            if (rika) rika.update(1 / 60);
          }
          updateCamera();
          renderer.render(scene, camera);
          ctx.drawImage(canvas, c * cw, r * ch, cw, ch);
          ctx.strokeStyle = '#2a3048';
          ctx.strokeRect(c * cw + 0.5, r * ch + 0.5, cw - 1, ch - 1);
        }
        ctx.fillStyle = '#ffd86b';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(ids[r].toUpperCase(), 8, r * ch + 22);
      }
      turntable = wasTurn;
      loadChar(wasChar);
      resize();
      await fetch('/__shot', {
        method: 'POST',
        body: JSON.stringify({ name, data: sheetCanvas.toDataURL('image/png') })
      });
      return `castSheet ${name}: ${ids.length} models`;
    },
    // TIME STRIP. The contact sheets answer "what does this model look like";
    // this answers "what does this clip DO". One clip, sampled at N points
    // across its duration, laid out left to right — which is the only way to
    // see that a three-second victory pose is two seconds of a man standing
    // still, or that an impact frame has no anticipation in front of it.
    async strip(name, clip, { n = 8, yaw = 0.5, cw = 240, ch = 320, from = 0, to = null } = {}) {
      if (!player || !player.has(clip)) return 'no clip: ' + clip;
      const dur = to ?? player.clips.get(clip).dur;
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = n * cw;
      sheetCanvas.height = ch;
      const ctx = sheetCanvas.getContext('2d');
      ctx.fillStyle = '#0e1018';
      ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
      const wasTurn = turntable;
      turntable = false;
      holder.rotation.y = yaw;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      for (let i = 0; i < n; i++) {
        const t = from + (dur - from) * (i / (n - 1));
        // re-seek from the clip start every cell and step at 1/60, so the
        // springs arrive where they would in a real playthrough rather than
        // where a single large update would throw them
        playClip(clip);
        player.play(clip, { fade: 0, restart: true });
        model.resetSprings?.();
        const steps = Math.max(1, Math.round(t * 60));
        for (let s = 0; s < steps; s++) { player.update(1 / 60); model.update(1 / 60); }
        updateCamera();
        renderer.render(scene, camera);
        ctx.drawImage(canvas, i * cw, 0, cw, ch);
        ctx.fillStyle = '#ffd86b';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(t.toFixed(2) + 's', i * cw + 8, 20);
        ctx.strokeStyle = '#2a3048';
        ctx.strokeRect(i * cw + 0.5, 0.5, cw - 1, ch - 1);
      }
      turntable = wasTurn;
      resize();
      await fetch('/__shot', {
        method: 'POST',
        body: JSON.stringify({ name, data: sheetCanvas.toDataURL('image/png') })
      });
      return `strip ${name}: ${clip} × ${n} over ${dur}s`;
    },
    // ARM SHEET. The weapon-in-hand review. `castSheet` shows the cast in its
    // default clip, which for most of the roster means empty hands — a blade
    // that hangs upside down out of the fist is invisible there and invisible
    // in `showProp`, which stands the prop on the pedestal with its own
    // rotation zeroed. This forces a named prop into a named slot and shoots
    // the OWNER holding it, which is the only frame that can answer "is the
    // pointy end up".
    //
    // entries: [{id, prop, slot='hand', clip='idle'}]
    async armSheet(name, entries, { yaws = [0, Math.PI / 2, Math.PI * 1.35], cw = 250, ch = 330, t = 0.4 } = {}) {
      const perRow = yaws.length;
      const sheetCanvas = document.createElement('canvas');
      sheetCanvas.width = perRow * cw;
      sheetCanvas.height = entries.length * ch;
      const ctx = sheetCanvas.getContext('2d');
      ctx.fillStyle = '#0e1018';
      ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
      const wasTurn = turntable, wasChar = currentChar;
      turntable = false;
      for (let r = 0; r < entries.length; r++) {
        const e = entries[r];
        loadChar(e.id);
        renderer.setSize(cw, ch, false);
        camera.aspect = cw / ch;
        camera.updateProjectionMatrix();
        const clip = e.clip || 'idle';
        for (let c = 0; c < perRow; c++) {
          holder.rotation.y = yaws[c];
          if (player) player.play(player.has(clip) ? clip : 'idle', { fade: 0, restart: true });
          // the attach goes AFTER play(): playClip routes several characters'
          // props by clip family and would stow the very thing under review
          model?.attachProp(e.prop, e.slot || 'hand');
          for (let s = 0; s < Math.round(t * 60); s++) {
            if (player) player.update(1 / 60);
            if (model) model.update(1 / 60);
          }
          updateCamera();
          renderer.render(scene, camera);
          ctx.drawImage(canvas, c * cw, r * ch, cw, ch);
          ctx.strokeStyle = '#2a3048';
          ctx.strokeRect(c * cw + 0.5, r * ch + 0.5, cw - 1, ch - 1);
        }
        ctx.fillStyle = '#ffd86b';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(`${e.id} · ${e.prop}`, 8, r * ch + 20);
      }
      turntable = wasTurn;
      loadChar(wasChar);
      resize();
      await fetch('/__shot', {
        method: 'POST',
        body: JSON.stringify({ name, data: sheetCanvas.toDataURL('image/png') })
      });
      return `armSheet ${name}: ${entries.length} props`;
    },
    async shot(name, w = 860, h = 1000) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      updateCamera();
      renderer.render(scene, camera);
      const data = canvas.toDataURL('image/png');
      await fetch('/__shot', { method: 'POST', body: JSON.stringify({ name, data }) });
      resize();
      return 'saved ' + name;
    }
  };
}
