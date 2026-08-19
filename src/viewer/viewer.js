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
import { makeClips } from '../art/anim/index.js';
import { AnimPlayer } from '../art/anim/player.js';

const BUILDERS = { gojo: buildGojo, yuta: buildYuta, megumi: buildMegumi, nanami: buildNanami, yuji: buildYuji, todo: buildTodo, jogo: buildJogo, mahito: buildMahito, mahoraga: buildMahoraga, higuruma: buildHiguruma, hakari: buildHakari, sukuna: buildSukuna, toji: buildToji,
  hanami: buildHanami, kurourushi: buildKurourushi, choso: buildChoso, nobara: buildNobara,
  geto: buildGeto, naoya: buildNaoya, kashimo: buildKashimo, panda: buildPanda,
  inumaki: buildInumaki,
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
  hanami: { dist: 5.4, height: 1.25 },
  kurourushi: { dist: 5.6, height: 1.30 }
};

// The shikigami are not CharacterModels — they have their own rigs and their
// own animators — so the viewer drives them through a second, simpler path:
// a `state` object handed to model.tick() with the switches each creature
// reads. `states` is what the clip bar exposes for that creature.
const CREATURES = {
  'dog·white': { build: () => buildDivineDog(true), states: { idle: { speed: 0 }, run: { speed: 6 }, bite: { speed: 4, action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  'dog·black': { build: () => buildDivineDog(false), states: { idle: { speed: 0 }, run: { speed: 6 }, bite: { speed: 4, action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  nue: { build: buildNue, states: { fly: {}, dive: { action: 'dive', actionK: 0.7 }, hurt: { hurt: true } } },
  toad: { build: buildToad, states: { idle: { speed: 0 }, hop: { speed: 2 }, tongue: { tongue: 1 }, hurt: { hurt: true } } },
  serpent: { build: buildGreatSerpent, states: { idle: { speed: 0 }, rush: { rush: 1, speed: 8 }, coil: { coil: 1 }, bite: { action: 'bite', actionK: 0.5 }, hurt: { hurt: true } } },
  elephant: { build: buildMaxElephant, states: { idle: { speed: 0 }, walk: { speed: 2 }, torrent: { torrent: 1 }, hurt: { hurt: true } } },
  rabbits: { build: () => buildRabbitSwarm(22), states: { swarm: { spread: 1 } } },
  // GETO'S TWO LOW-GRADE CURSES. On the bench for the same reason the
  // shikigami are: they are entity models with their own animators rather than
  // CharacterModels, so this simpler path is the only place they can be
  // inspected at all. `maw` opens its jaw on `bite`; `wisp` lashes its tendril
  // curtain on `lash`.
  maw: { build: buildGapingMaw, states: { idle: { speed: 0 }, hop: { speed: 5 }, bite: { speed: 2, action: 'bite', actionK: 0.8 }, hurt: { hurt: true } } },
  wisp: { build: buildTendrilWisp, states: { idle: { speed: 0 }, drift: { speed: 4 }, lash: { action: 'lash', actionK: 0.9 }, hurt: { hurt: true } } },
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
      clipBar.style.display = 'flex';
      // frame the creature: a 5 m serpent and a 0.5 m rabbit cannot share one
      // camera distance, so measure the built bounds rather than guessing
      const box = new THREE.Box3().setFromObject(built.body);
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
    clipBar.style.display = 'flex';
    model = BUILDERS[id]();
    holder.add(model.group);
    // a variant shares its base character's clip set — 'yuji:modulo' is still
    // Yuji as far as animation is concerned, which is the whole point of
    // authoring variants as meshes over a shared rig
    player = new AnimPlayer(model.bones, makeClips(id.split(':')[0]));
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
    // katana/blade props follow the clip family
    if (model.props.has('katana')) model.attachProp('katana', /ct|domain|sword|ult/.test(name) ? 'hand' : 'away');
    if (model.props.has('blade')) model.attachProp('blade', /ct1|ult|victory|heavy/.test(name) ? 'hand' : 'back');
    if (model.props.has('tool')) model.attachProp('tool', /punch|heavy|summon|domain|victory|wheel/.test(name) ? 'hand' : 'back');
    // NOBARA. Her three props follow the clip family exactly as the fighter's
    // `_props` routes them in a match — the bench has to mirror it or half her
    // set is inspected with the wrong things in her hands, which is precisely
    // how the doll would end up visible during the idle without anyone seeing.
    if (model.props.has('hammer')) {
      // stowed entirely for the two clips where both hands hold something else
      model.attachProp('hammer', /^(ct2|ult)/.test(name) ? 'away'
        : /^(punch|heavy|bfStrike|bfImpact|victory)/.test(name) ? 'hand' : 'shoulder');
    }
    if (model.props.has('nail')) {
      model.attachProp('nail',
        /^(ct2|ult)/.test(name) ? 'drive' : /^(ct1|detonate)/.test(name) ? 'hand' : 'away');
    }
    if (model.props.has('doll')) {
      model.attachProp('doll', /^(ct2|ult)/.test(name) ? 'hand' : 'away');
    }
    // Higuruma carries the case by default and swaps to the sword for every
    // sword/exec clip — the viewer has to mirror that or half his set is
    // inspected with the wrong object in his hand.
    if (model.props.has('sword')) {
      const armed = /^(sword|exec)/.test(name);
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
    for (const name of player.clips.keys()) {
      const b = document.createElement('button');
      b.textContent = name;
      b.className = 'v-btn v-btn-sm' + (name === currentClip ? ' active' : '');
      b.onclick = () => playClip(name);
      clipBar.appendChild(b);
    }
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
    if (creature) creature.model.tick(dt, { ...creature.states[currentClip] });
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
    async sheet(name, { clips = null, yaws = [0, Math.PI * 0.75], cw = 300, ch = 380, t = 0.45, cols = 0 } = {}) {
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
