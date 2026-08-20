// Domain environments: the arena is replaced by the caster's inner world.
// Unlimited Void: black infinity, information streams, a starfield horizon.
// Authentic Mutual Love: dark field of cross pillars, infinite katanas, ropes.
import * as THREE from 'three';
import { xrayAll } from '../art/shaders/xray.js';
import { makeGlowMat } from '../arena/arena.js';
import { toonMaterial } from '../art/shaders/toon.js';
import { rand, v3 } from '../core/mathutil.js';

const ENV_COLOR = { void: 0x4f7fff, swordfield: 0x8fe8b0, volcano: 0xff6a2f, flesh: 0x9fb0bd, shadow: 0x8fb6d8, pachinko: 0xffc93c, courtroom: 0xd8c78a, shrine: 0xff2f45, shoreline: 0x7fd8c8 };
const CONTACT_Y = 2.9;   // height of the clash contact point, above both heads

export class DomainFX {
  constructor(scene, arena, fx) {
    this.scene = scene;
    this.arena = arena;
    this.fx = fx;
    this.env = null;         // active environment group
    this.envKind = null;
    this.barrier = null;
    this.simpleDomeMesh = null;
    this.simpleDomeT = 0;
    this.castFx = null;
    this.clash = null;
    this.t = 0;
  }

  // ---- cast buildup: dark sphere swallowing the light ---------------------
  castBuildup(caster) {
    this.clearCast();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0x05060c, transparent: true, opacity: 0.0, side: THREE.DoubleSide }));
    sphere.position.copy(caster.pos).setY(1.2);
    this.scene.add(sphere);
    this.castFx = { sphere, t: 0 };
  }
  clearCast() {
    if (this.castFx) { this.scene.remove(this.castFx.sphere); this.castFx = null; }
  }

  // ---- environments -------------------------------------------------------
  // `open` domains (Megumi's) are the exception to everything this class was
  // built on: the arena is NOT swapped out, there is no barrier dome, and the
  // effect is an overlay on the real map rather than a replacement world. That
  // is exactly what "incomplete" has to look like — the opponent can see the
  // way out because the way out is still there.
  show(kind, caster) {
    this.clearCast();
    this.hide();
    this.envKind = kind;
    // BOTH open domains keep the real map: Megumi's because it is incomplete,
    // and Sukuna's because there is no barrier to put a world inside. The
    // shrine is built ON the arena rather than instead of it — which is also
    // what makes twenty seconds of it visibly shredding the level possible.
    const open = kind === 'shadow' || kind === 'shrine';
    this.open = open;
    if (!open) {
      this.arena.group.visible = false;
      this.scene.fog = null;
    }
    const g = new THREE.Group();
    if (kind === 'void') this._buildVoid(g);
    else if (kind === 'volcano') this._buildVolcano(g);
    else if (kind === 'flesh') this._buildFlesh(g, caster);
    else if (kind === 'shadow') this._buildShadowGarden(g, caster);
    else if (kind === 'shrine') this._buildShrine(g, caster);
    else if (kind === 'pachinko') this._buildPachinko(g);
    else if (kind === 'courtroom') this._buildCourtroom(g);
    else if (kind === 'shoreline') this._buildShoreline(g, caster);
    else this._buildSwordField(g, caster);
    // A domain replaces the level, so it inherits the level's rule: anything
    // standing between an eye and the fighter it follows dissolves rather than
    // blocking the shot. Without this the courtroom's pillars, the shrine's
    // torii and the parlor's cabinets were the only solid occluders left in
    // the game.
    xrayAll(g);
    this.scene.add(g);
    this.env = g;
    if (!open) this._buildBarrier(kind);
    if (kind === 'swordfield') this.fx.rikaManifest(true, v3(0, 0.5, -8));
  }

  // ---- DEADLY SENTENCING: a courtroom -------------------------------------
  // The LEAST FLASHY domain in the game, and that is the whole design. No
  // fire, no infinity, no sea of shadow — wood panelling, a judge's bench, a
  // witness stand, a gallery of empty benches, and one harsh overhead light
  // with everything outside it in shadow. Dead quiet except the clock.
  //
  // Next to Hakari's parlor and Jogo's volcano the restraint is what makes it
  // unsettling: it is the only domain that looks like somewhere that exists.
  _buildCourtroom(g) {
    this.scene.background = new THREE.Color(0x070604);
    // PASS 2 on the values. The first set was authored as real oak colours and
    // the map's own key light rendered the whole room as flat beige — the
    // opposite of the brief. The domain does not own the scene lighting (the
    // map's rig stays up, exactly as it does for every other environment
    // here), so the contrast has to live in the MATERIALS: everything is
    // pulled down to near-black walnut and the only bright thing in the room
    // is the additive pool under the overhead light.
    const WOOD = 0x241c12, WOOD_DK = 0x120e08, WOOD_LT = 0x362a19;
    const FLOOR = 0x1a1510;
    const wood = c => toonMaterial({ vertexColors: false, color: c, steps: [38, 104, 255], rim: 0.14, rimColor: 0xd8c78a });
    const woodMat = wood(WOOD), darkMat = wood(WOOD_DK), liteMat = wood(WOOD_LT);

    // parquet floor
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 40), wood(FLOOR));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);
    // board lines, so the floor reads as a floor and not a disc
    for (let i = -7; i <= 7; i++) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 30), new THREE.MeshBasicMaterial({ color: 0x0a0806 }));
      line.rotation.x = -Math.PI / 2;
      line.position.set(i * 2.0, 0.015, 0);
      g.add(line);
    }

    // ---- the bench: raised, heavy, directly ahead ---------------------------
    const bench = new THREE.Group();
    const dais = new THREE.Mesh(new THREE.BoxGeometry(9.5, 1.15, 3.0), darkMat);
    dais.position.set(0, 0.575, -9.2);
    const face = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.5, 0.5), woodMat);
    face.position.set(0, 1.75, -8.1);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.18, 1.0), liteMat);
    cap.position.set(0, 2.55, -8.3);
    bench.add(dais, face, cap);
    // panelled front: recessed rectangles across the bench face
    for (let i = -3; i <= 3; i++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.95, 0.10), darkMat);
      p.position.set(i * 1.25, 1.75, -7.82);
      bench.add(p);
    }
    // the empty chair behind it, and the gavel block on top
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.9, 0.25), darkMat);
    chair.position.set(0, 2.1, -10.3);
    const block = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.14, 14), liteMat);
    block.position.set(1.6, 2.71, -8.3);
    bench.add(chair, block);
    g.add(bench);

    // ---- witness stand: to one side, lower, its own little box -------------
    const stand = new THREE.Group();
    const sBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 2.0), woodMat);
    sBox.position.set(-5.6, 0.75, -6.2);
    const sRail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 2.2), liteMat);
    sRail.position.set(-5.6, 1.55, -6.2);
    stand.add(sBox, sRail);
    g.add(stand);

    // ---- the gallery: rows of empty benches behind the fighters ------------
    for (let r = 0; r < 5; r++) {
      const z = 7.6 + r * 1.5;
      for (const s of [-1, 1]) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.45, 0.9), woodMat);
        seat.position.set(s * 4.6, 0.85, z);
        const backr = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.25, 0.22), darkMat);
        backr.position.set(s * 4.6, 1.3, z + 0.5);
        g.add(seat, backr);
      }
    }
    // the bar: a low rail separating the well of the court from the gallery
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 0.24), liteMat);
      rail.position.set(s * 4.6, 1.2, 7.4);
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.2, 0.24), darkMat);
      post.position.set(s * 8.1, 0.6, 7.4);
      g.add(rail, post);
    }

    // ---- panelled walls, floor to ceiling ----------------------------------
    // r = 13.5, INSIDE the barrier sphere (radius 17). At 17.5 the walls sat
    // behind the barrier's additive inner surface and the whole room was being
    // viewed through a sheet of glow — which is what turned near-black walnut
    // into flat beige on the first two passes.
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const r = 13.5;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 11, 0.5), i % 2 ? woodMat : darkMat);
      panel.position.set(Math.sin(a) * r, 5.5, Math.cos(a) * r);
      panel.rotation.y = a;
      g.add(panel);
      // a dado rail running round at waist height
      const dado = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.22, 0.7), liteMat);
      dado.position.set(Math.sin(a) * (r - 0.2), 1.5, Math.cos(a) * (r - 0.2));
      dado.rotation.y = a;
      g.add(dado);
    }
    // a flat dark ceiling — a room, not a sky. THIS is the thing that makes it
    // feel like a place instead of a pocket dimension.
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(14.5, 32),
      new THREE.MeshBasicMaterial({ color: 0x080705, side: THREE.DoubleSide }));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 11;
    g.add(ceil);

    // ---- ONE HARSH OVERHEAD LIGHT ------------------------------------------
    // Hot pool in the middle of the floor, nothing at the edges. Every other
    // domain in the game lights the whole space; this one refuses to.
    const key = new THREE.SpotLight(0xfff2d4, 26, 34, 0.62, 0.55, 1.3);
    key.position.set(0, 10.4, 0.5);
    key.target.position.set(0, 0, 0);
    g.add(key, key.target);
    const fill = new THREE.HemisphereLight(0x241f16, 0x080705, 0.18);
    g.add(fill);
    // the fitting itself, and the cone of dust under it
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.1, 0.7, 18, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x1a1610, side: THREE.DoubleSide }));
    shade.position.set(0, 10.5, 0.5);
    g.add(shade);
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), makeGlowMat(0xfff2d4, 0.75));
    bulb.position.set(0, 10.1, 0.5);
    bulb.rotation.x = Math.PI / 2;
    g.add(bulb);
    // The beam is a BEAM: narrow, and it does not reach the walls. A wide one
    // is just fog with extra steps.
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 4.0, 10, 22, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfff2d4, transparent: true, opacity: 0.05, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
    cone.position.set(0, 5.2, 0.5);
    g.add(cone);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(4.4, 32), makeGlowMat(0xfff2d4, 0.16));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.03;
    g.add(pool);

    // ---- dust. Not motes of cursed energy — DUST, hanging in a light beam ---
    const dustGeo = new THREE.BufferGeometry();
    const N = 220, dp = new Float32Array(N * 3);
    this.courtDust = [];
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2), r = rand(0, 4.2);
      dp[i * 3] = Math.sin(a) * r; dp[i * 3 + 1] = rand(0.2, 9.5); dp[i * 3 + 2] = Math.cos(a) * r + 0.5;
      this.courtDust.push({ vy: rand(-0.10, -0.02), drift: rand(-0.06, 0.06) });
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xffeccc, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false
    }));
    g.add(this.dust);
  }

  // ---- CHIMERA SHADOW GARDEN ----------------------------------------------
  // A rippling black sea poured over the existing map, ten animal shapes
  // circling at the edge of the frame, and a cool blue-grey key. There is no
  // dome, no floor swap and no sky: everything above the shadow line is the
  // real arena, desaturated by the grade.
  _buildShadowGarden(g, caster) {
    // the sea: a large disc with a shader that ripples and fades at its rim,
    // scaled every frame to the domain's current spread
    const geo = new THREE.CircleGeometry(1, 96);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: {
        uT: { value: 0 }, uEdge: { value: 0.0 },
        uDeep: { value: new THREE.Color(0x04050a) },
        uRim: { value: new THREE.Color(0x8fb6d8) },
        uDents: { value: Array.from({ length: 6 }, () => new THREE.Vector3()) }
      },
      vertexShader: /* glsl */`
        varying vec2 vP;
        void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uT; uniform vec3 uDeep; uniform vec3 uRim; uniform vec3 uDents[6];
        varying vec2 vP;
        // faint chimera pattern: interlocking rings that never quite close,
        // which is the whole idea of the domain in one texture
        float chimera(vec2 p){
          float a = atan(p.y, p.x);
          float r = length(p);
          float rings = sin(r*34.0 - uT*0.7 + sin(a*5.0)*1.4);
          float spokes = sin(a*14.0 + r*6.0 - uT*0.4);
          // FAINT: a pattern you notice, not a field of pale blobs. The first
          // tuning pass read as spotlights on the floor.
          return smoothstep(0.88, 1.0, rings*0.6 + spokes*0.4);
        }
        void main(){
          float r = length(vP);
          if (r > 1.0) discard;
          // rippling advance at the rim
          float wob = sin(atan(vP.y,vP.x)*7.0 + uT*1.6)*0.02 + sin(atan(vP.y,vP.x)*13.0 - uT*1.1)*0.012;
          float edge = 1.0 - smoothstep(0.86 + wob, 1.0 + wob, r);
          if (edge <= 0.001) discard;
          // dents: heavy attacks shove the shadow back locally
          float hole = 1.0;
          for (int i = 0; i < 6; i++){
            if (uDents[i].z <= 0.0) continue;
            float d = distance(vP, uDents[i].xy);
            hole = min(hole, smoothstep(uDents[i].z*0.55, uDents[i].z, d));
          }
          vec3 c = uDeep + uRim * chimera(vP*3.2) * 0.13;
          c += uRim * smoothstep(0.93+wob, 1.0+wob, r) * 0.75;   // creeping lip
          float a = (0.93 * edge) * hole;
          if (a < 0.02) discard;
          gl_FragColor = vec4(c, a);
        }`
    });
    const sea = new THREE.Mesh(geo, mat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = 0.03;
    sea.renderOrder = 3;
    g.add(sea);
    this.shadowSea = sea;
    this.shadowOrigin = caster ? caster.pos.clone().setY(0) : v3();
    sea.position.x = this.shadowOrigin.x;
    sea.position.z = this.shadowOrigin.z;

    // TEN circling animal shapes at the edge of the frame — flat silhouettes
    // that read as the shikigami he cannot fully manifest. Ten of them, which
    // is the technique's whole name.
    const beasts = new THREE.Group();
    const silMat = new THREE.MeshBasicMaterial({
      color: 0x05060c, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide
    });
    this.shadowBeasts = [];
    for (let i = 0; i < 10; i++) {
      const shape = new THREE.Shape();
      // crude quadruped/bird profiles, varied per index so no two repeat
      const long = 1.6 + (i % 3) * 0.5, tall = 0.7 + ((i * 7) % 4) * 0.18;
      shape.moveTo(-long, 0);
      shape.lineTo(-long * 0.7, tall * 0.7);
      shape.lineTo(-long * 0.2, tall * 0.5);
      shape.lineTo(long * 0.45, tall * (i % 2 ? 1.15 : 0.8));
      shape.lineTo(long * 0.8, tall * (i % 2 ? 0.5 : 1.3));
      shape.lineTo(long, tall * 0.2);
      shape.lineTo(long * 0.6, -tall * 0.5);
      shape.lineTo(-long * 0.5, -tall * 0.45);
      shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), silMat);
      mesh.userData.billboard = true;
      beasts.add(mesh);
      this.shadowBeasts.push({ mesh, a: (i / 10) * Math.PI * 2, r: 17 + (i % 4) * 3.5, y: 1.2 + (i % 5) * 0.9, sp: 0.10 + (i % 3) * 0.045 });
    }
    g.add(beasts);

    // cool blue-grey key light swapped in over the map's own rig
    const key = new THREE.DirectionalLight(0xa8c4e0, 1.5);
    key.position.set(-5, 12, 6);
    g.add(key);
  }

  // ---- MALEVOLENT SHRINE 伏魔御廚子 ----------------------------------------
  // A vast skeletal shrine: a Buddhist hall built out of bone. Ribcage
  // architecture rising over a stepped plinth, four corner pillars of stacked
  // vertebrae, a swept roof of ribs, and a gaping mouth at the centre of it.
  // Deep red and black, ash in the air, the sky replaced.
  //
  // It is built ON the map, not instead of it, so the ground ring showing the
  // radius edge sits on the real floor the opponent is running across — which
  // is the whole point, since running out of it is the counterplay.
  _buildShrine(g, caster) {
    const at = caster ? caster.pos.clone().setY(0) : v3();
    this.shrineOrigin = at.clone();
    this.scene.background = new THREE.Color(0x120306);

    // PASS 2. The first build was authored at human scale — a 6 m ribcage
    // standing exactly where the caster is — so the fight camera spawned
    // INSIDE it and the whole shot was a wall of ribs. It is now built to the
    // DOMAIN'S OWN RADIUS: the architecture and the kill zone are the same
    // circle, the ribs arc overhead rather than around him, and the middle of
    // the hall (where the fight happens) is completely clear.
    const RAD = this.shrineRadius || 15;
    const H = RAD * 1.45;              // how high the hall stands

    const BONE = 0xcdbba4, BONE_DK = 0x8a7a67, BONE_SH = 0x4a3f36;
    const bone = c => toonMaterial({
      vertexColors: false, color: c, steps: [46, 118, 255], rim: 0.34, rimColor: 0xff8090
    });
    const boneMat = bone(BONE), boneDk = bone(BONE_DK), boneSh = bone(BONE_SH);

    const shrine = new THREE.Group();
    shrine.position.copy(at);
    g.add(shrine);
    this.shrineNode = shrine;

    // ---- four corner pillars of stacked vertebrae, out at the rim ------------
    const pr = RAD * 0.80;
    for (let c = 0; c < 4; c++) {
      const a = (c / 4) * Math.PI * 2 + Math.PI / 4;
      const px = Math.cos(a) * pr, pz = Math.sin(a) * pr;
      const segs = 14, segH = H * 0.062;
      for (let i = 0; i < segs; i++) {
        const r = RAD * 0.055 * (1 - i * 0.028);
        const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.72, r, segH * 0.95, 7), i % 2 ? boneMat : boneDk);
        v.position.set(px, segH * 0.5 + i * segH, pz);
        v.rotation.y = i * 0.4;
        shrine.add(v);
        // the transverse processes — spurs off each vertebra
        for (const sx of [1, -1]) {
          const sp = new THREE.Mesh(new THREE.ConeGeometry(r * 0.26, r * 1.7, 5), boneDk);
          sp.position.set(px + sx * r * 1.2, segH * 0.5 + i * segH, pz);
          sp.rotation.z = sx * -1.35;
          shrine.add(sp);
        }
      }
    }

    // ---- the ribcage: enormous arches springing from the rim and closing
    //      overhead. This is what the players are standing under.
    //
    // PASS 3: composing the arc with a single Euler (rotation.set(x, 0, z))
    // did not mirror the way it reads on paper — the two halves ended up
    // leaning the same way and the cage stacked itself down one side of the
    // hall. Each arch now gets its own yaw GROUP with the arc rotated inside
    // it, which composes unambiguously and fans them properly.
    const ARCS = 9;
    const span = Math.PI * 0.80;
    for (let i = 0; i < ARCS; i++) {
      const yawG = new THREE.Group();
      yawG.rotation.y = (i / ARCS) * Math.PI;      // a half turn covers both sides
      const rad = RAD * (0.94 - (i % 3) * 0.06);
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(rad, RAD * 0.020, 6, 24, span), i % 2 ? boneMat : boneDk);
      rib.rotation.z = Math.PI / 2 - span / 2;     // centre the arc overhead
      rib.scale.y = (H * 0.92) / rad;              // stretch it into the hall's height
      yawG.add(rib);
      shrine.add(yawG);
    }
    // two hoops binding the arches, low and high — the cage reads as built
    for (const [ry, rr, tube] of [[H * 0.30, RAD * 0.90, 0.016], [H * 0.62, RAD * 0.68, 0.013]]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(rr, RAD * tube, 6, 36), boneSh);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = ry;
      shrine.add(hoop);
    }

    // ---- the roof: a swept shrine roof made of ribs --------------------------
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(RAD * 0.014, RAD * 0.028, H * 0.44, 6), boneDk);
      rib.position.set(Math.cos(a) * RAD * 0.34, H * 0.86, Math.sin(a) * RAD * 0.34);
      rib.rotation.set(Math.cos(a) * 0.66, 0, -Math.sin(a) * 0.66);
      shrine.add(rib);
    }
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(RAD * 0.045, RAD * 0.045, RAD * 1.1, 8), boneMat);
    ridge.rotation.z = Math.PI / 2;
    ridge.position.y = H * 1.02;
    shrine.add(ridge);

    // ---- THE MOUTH ----------------------------------------------------------
    // The shrine's face, set into the far wall of the hall and up above head
    // height so it is something the players look UP at rather than something
    // parked in the middle of the fight. Lit red from inside; unsettling by
    // shape, not by gore.
    const jaw = new THREE.Group();
    const jr = RAD * 0.26;
    jaw.position.set(0, H * 0.40, -RAD * 0.74);
    const throat = new THREE.Mesh(
      new THREE.SphereGeometry(jr * 1.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshBasicMaterial({ color: 0x14040a, side: THREE.DoubleSide }));
    throat.rotation.x = Math.PI / 2;
    jaw.add(throat);
    const glowMouth = new THREE.Mesh(new THREE.CircleGeometry(jr, 20), makeGlowMat(0x8c0c1c, 0.55));
    glowMouth.position.z = -jr * 0.3;
    jaw.add(glowMouth);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(jr * 0.09, jr * 0.5, 5), boneMat);
      tooth.position.set(Math.cos(a) * jr * 1.06, Math.sin(a) * jr * 0.74, jr * 0.06);
      tooth.rotation.z = -a + (Math.sin(a) > 0 ? Math.PI : 0);
      jaw.add(tooth);
    }
    shrine.add(jaw);
    this.shrineJaw = jaw;

    // ---- the radius edge, on the real floor ---------------------------------
    // The single most important thing on screen for the person being cut: it
    // is the line they have to get past. Scaled every frame to the domain's
    // current spread by update().
    const edgeGeo = new THREE.RingGeometry(0.955, 1.0, 96);
    const edgeMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uT: { value: 0 }, uCol: { value: new THREE.Color(0xff2f45) } },
      vertexShader: /* glsl */`
        varying vec2 vP;
        void main(){ vP = position.xy; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uT; uniform vec3 uCol; varying vec2 vP;
        void main(){
          float a = atan(vP.y, vP.x);
          // a running crawl round the rim so the edge reads as live, not drawn
          float pulse = 0.55 + 0.45 * sin(a * 9.0 - uT * 3.4);
          gl_FragColor = vec4(uCol * (0.7 + pulse), 0.55 + pulse * 0.40);
        }`
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.copy(at).setY(0.05);
    edge.renderOrder = 4;
    g.add(edge);
    this.shrineEdge = edge;

    // the influence itself: a faint blood wash inside the ring
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x6e0c18, transparent: true, opacity: 0.16, depthWrite: false
    });
    const fill = new THREE.Mesh(new THREE.CircleGeometry(1, 64), fillMat);
    fill.rotation.x = -Math.PI / 2;
    fill.position.copy(at).setY(0.035);
    fill.renderOrder = 3;
    g.add(fill);
    this.shrineFill = fill;

    // ---- ash in the air ------------------------------------------------------
    const ashN = 260;
    const pos = new Float32Array(ashN * 3);
    this.shrineAsh = [];
    this.shrineAshTop = H * 1.2;
    for (let i = 0; i < ashN; i++) {
      const a = rand(0, Math.PI * 2), r = rand(2, RAD * 2.2);
      pos[i * 3] = at.x + Math.cos(a) * r;
      pos[i * 3 + 1] = rand(0.2, this.shrineAshTop);
      pos[i * 3 + 2] = at.z + Math.sin(a) * r;
      this.shrineAsh.push({ vy: -rand(0.25, 1.1), drift: rand(-0.5, 0.5) });
    }
    const ashGeo = new THREE.BufferGeometry();
    ashGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ash = new THREE.Points(ashGeo, new THREE.PointsMaterial({
      color: 0xd8a090, size: 0.13, transparent: true, opacity: 0.42, depthWrite: false
    }));
    g.add(ash);
    this.shrineAshPts = ash;

    // the sky replaced: a low blood-dark dome over everything
    const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 20, 12),
      new THREE.MeshBasicMaterial({ color: 0x2a0509, side: THREE.BackSide, fog: false }));
    g.add(dome);
    // A red key over the map's own rig. PASS 2 pulled this down hard: at 1.7
    // plus the grade's tint plus a fill, everything on screen — including both
    // fighters — rendered as flat pink and the bone read as flesh.
    const key = new THREE.DirectionalLight(0xff8a86, 1.05);
    key.position.set(6, RAD * 1.2, -8);
    g.add(key);
    const fill2 = new THREE.DirectionalLight(0x2a0a10, 0.55);
    fill2.position.set(-8, 6, 8);
    g.add(fill2);
    // (pass 1 also scattered billboard "embers" round the plinth, which
    // rendered as fat glowing spheres parked in the middle of the fight —
    // the ash and the constant slashes carry the atmosphere instead)
  }

  _buildVoid(g) {
    this.scene.background = new THREE.Color(0x010208);
    // dark reflective floor disc
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 48),
      new THREE.MeshBasicMaterial({ color: 0x04050e }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(14, 0.08, 8, 64), makeGlowMat(0x4f6fd8, 0.8));
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    // starfield horizon band
    const starGeo = new THREE.BufferGeometry();
    const N = 900, sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(40, 90);
      sp[i * 3] = Math.sin(a) * r;
      sp[i * 3 + 1] = rand(-6, 26) * (Math.random() < 0.7 ? 0.3 : 1);
      sp[i * 3 + 2] = Math.cos(a) * r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    g.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xbfd4ff, size: 0.22, transparent: true, opacity: 0.9, depthWrite: false })));
    // information motes: streams spiraling inward
    const moteGeo = new THREE.BufferGeometry();
    const M = 700, mp = new Float32Array(M * 3);
    this.moteSeeds = [];
    for (let i = 0; i < M; i++) {
      const a = rand(0, Math.PI * 2), r = rand(2, 22), y = rand(0.2, 9);
      this.moteSeeds.push({ a, r, y, sp: rand(0.2, 0.9) });
      mp[i * 3] = Math.sin(a) * r; mp[i * 3 + 1] = y; mp[i * 3 + 2] = Math.cos(a) * r;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    this.motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({
      color: 0x9fd0ff, size: 0.1, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    g.add(this.motes);
    // a single vast eye-like glow overhead (the void looking back)
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), makeGlowMat(0x2c4fa8, 0.35));
    halo.position.y = 24;
    halo.rotation.x = Math.PI / 2;
    g.add(halo);
  }

  _buildSwordField(g, caster) {
    this.scene.background = new THREE.Color(0x201018);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 48),
      toonMaterial({ vertexColors: false, color: 0x3a2c30, steps: [60, 140, 255] }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);
    // sky: deep red-brown gradient approximated with a big dome color
    const dome = new THREE.Mesh(new THREE.SphereGeometry(90, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x2c1418, side: THREE.BackSide }));
    g.add(dome);
    // infinite katanas: instanced swords embedded at angles. Kept dim — the
    // PICKABLE volley (swordrain.js) glows green and must read against these.
    const bladeGeo = new THREE.BoxGeometry(0.05, 1.15, 0.012);
    bladeGeo.translate(0, 0.55, 0);
    const bladeMat = toonMaterial({ vertexColors: false, color: 0x5c6172, steps: [50, 130, 255], rim: 0.35, rimColor: 0x8a4a5c });
    const inst = new THREE.InstancedMesh(bladeGeo, bladeMat, 160);
    const m4 = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 160; i++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(3, 14.5) + (Math.random() < 0.3 ? 0 : 2);
      e.set(rand(-0.5, 0.5), rand(0, Math.PI * 2), rand(-0.5, 0.5));
      q.setFromEuler(e);
      s.setScalar(rand(0.8, 1.8));
      m4.compose(v3(Math.sin(a) * r, 0, Math.cos(a) * r), q, s);
      inst.setMatrixAt(i, m4);
    }
    g.add(inst);
    // cross-shaped pillars ringing the field
    const crossMat = toonMaterial({ vertexColors: false, color: 0x241a20, steps: [70, 255], rim: 0.35, rimColor: 0x9ff5c9 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const h = rand(4, 11);
      const cross = new THREE.Group();
      const vBeam = new THREE.Mesh(new THREE.BoxGeometry(0.8, h, 0.8), crossMat);
      vBeam.position.y = h / 2;
      const hBeam = new THREE.Mesh(new THREE.BoxGeometry(h * 0.55, 0.7, 0.7), crossMat);
      hBeam.position.y = h * 0.72;
      cross.add(vBeam, hBeam);
      const r = rand(17, 26);
      cross.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
      cross.rotation.y = a + rand(-0.3, 0.3);
      cross.rotation.z = rand(-0.1, 0.1);
      g.add(cross);
      // rope ring segment between pillars (the binding knot around the domain)
      const rope = new THREE.Mesh(new THREE.TorusGeometry(r, 0.1, 6, 40, Math.PI / 6),
        toonMaterial({ vertexColors: false, color: 0x8a2c3c, steps: [80, 255] }));
      rope.rotation.x = Math.PI / 2;
      rope.rotation.z = a - Math.PI / 14;
      rope.position.y = h * 0.65;
      g.add(rope);
    }
    // drifting green-white motes (Rika's presence)
    const moteGeo = new THREE.BufferGeometry();
    const M = 250, mp = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
      mp[i * 3] = rand(-16, 16); mp[i * 3 + 1] = rand(0.2, 8); mp[i * 3 + 2] = rand(-16, 16);
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    g.add(new THREE.Points(moteGeo, new THREE.PointsMaterial({
      color: 0x9ff5c9, size: 0.09, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    })));
  }

  // ---- COFFIN OF THE IRON MOUNTAIN: the inside of a volcano ---------------
  // black rock, magma channels, falling ash, red-orange key light, embers.
  _buildVolcano(g) {
    this.scene.background = new THREE.Color(0x120806);
    // scorched basalt floor
    const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 48),
      toonMaterial({ vertexColors: false, color: 0x1c1512, steps: [50, 130, 255], rim: 0.25, rimColor: 0xff5a1f }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);
    // magma channels: glowing cracks radiating across the floor
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2);
      const len = rand(3, 9), w = rand(0.12, 0.4);
      const crack = new THREE.Mesh(new THREE.PlaneGeometry(w, len), makeGlowMat(i % 3 ? 0xff4d00 : 0xffc23c, rand(0.5, 0.9)));
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = a + rand(-0.3, 0.3);
      const r = rand(2, 12);
      crack.position.set(Math.sin(a) * r, 0.02, Math.cos(a) * r);
      g.add(crack);
    }
    // ring of magma around the rim of the pit
    const moat = new THREE.Mesh(new THREE.TorusGeometry(14.6, 0.5, 8, 64), makeGlowMat(0xff4d00, 0.55));
    moat.rotation.x = Math.PI / 2;
    moat.position.y = 0.05;
    g.add(moat);
    // jagged black rock walls leaning inward (cone interior)
    const rockMat = toonMaterial({ vertexColors: false, color: 0x241a14, steps: [60, 255], rim: 0.4, rimColor: 0xff5a1f });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rand(-0.1, 0.1);
      const h = rand(7, 14);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(rand(1.4, 2.6), h, 5), rockMat);
      const r = rand(16, 22);
      spire.position.set(Math.sin(a) * r, h * 0.45, Math.cos(a) * r);
      spire.rotation.z = Math.sin(a) * -0.16;
      spire.rotation.x = Math.cos(a) * 0.16;
      g.add(spire);
    }
    // the crater sky: a dark dome with a molten glow overhead
    const dome = new THREE.Mesh(new THREE.SphereGeometry(85, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x180a06, side: THREE.BackSide }));
    g.add(dome);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), makeGlowMat(0xff4d00, 0.28));
    glow.position.y = 26;
    glow.rotation.x = Math.PI / 2;
    g.add(glow);
    // falling ash + rising embers
    const ashGeo = new THREE.BufferGeometry();
    const A = 500, ap = new Float32Array(A * 3);
    this.ashSeeds = [];
    for (let i = 0; i < A; i++) {
      const ember = Math.random() < 0.35;
      this.ashSeeds.push({ vy: ember ? rand(0.5, 1.6) : -rand(0.5, 1.4), ember, drift: rand(-0.3, 0.3) });
      ap[i * 3] = rand(-16, 16); ap[i * 3 + 1] = rand(0.2, 14); ap[i * 3 + 2] = rand(-16, 16);
    }
    ashGeo.setAttribute('position', new THREE.BufferAttribute(ap, 3));
    this.ash = new THREE.Points(ashGeo, new THREE.PointsMaterial({
      color: 0xffa25a, size: 0.09, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    g.add(this.ash);
    // heavier grey ash layer (non-additive, reads as soot)
    const sootGeo = new THREE.BufferGeometry();
    const S = 260, sp2 = new Float32Array(S * 3);
    for (let i = 0; i < S; i++) {
      sp2[i * 3] = rand(-18, 18); sp2[i * 3 + 1] = rand(1, 16); sp2[i * 3 + 2] = rand(-18, 18);
    }
    sootGeo.setAttribute('position', new THREE.BufferAttribute(sp2, 3));
    this.soot = new THREE.Points(sootGeo, new THREE.PointsMaterial({
      color: 0x6a5a50, size: 0.12, transparent: true, opacity: 0.5, depthWrite: false
    }));
    g.add(this.soot);
  }

  // ---- HORIZON OF THE CAPTIVATING SKANDHA 蕩蘊平線 -------------------------
  // A tropical shoreline: an endless calm sea to the horizon, pale sand, a
  // bright empty sky, gentle surf, and a forest of palms along one side of the
  // shore (which the source has and the brief omits).
  //
  // *** IT IS THE MOST PLEASANT-LOOKING PLACE IN THE GAME, AND THAT IS THE
  // POINT. *** Every other domain in this project announces itself: Jogo's is
  // on fire, Mahito's is made of people, Sukuna's is a shrine over a ruin,
  // Gojo's is an abyss. This one is a holiday. The horror is entirely in what
  // arrives, and if the beach ever stops looking nice the character stops
  // working — so this build is deliberately the brightest, warmest, most
  // unthreatening environment in the file. It is also the hardest possible
  // contrast against Mahito's flesh and Jogo's volcano, which is what makes it
  // land when it comes up on the same select screen.
  //
  // THE WATER IS REAL WORK, as the brief asks:
  //   SURFACE   a subdivided plane displaced by two crossed swells in `update`
  //             — a genuine animated mesh, not a scrolling texture
  //   CAUSTICS  a bright additive pattern projected on the SAND under the
  //             shallows, drifting on its own slower clock, so the wet sand
  //             has moving light on it
  //   FOAM      a band of white at the shoreline that breathes in and out with
  //             the swell, plus a scatter of individual breakers
  //   REFLECT   the sky is mirrored in the water as a second, inverted, very
  //             low-opacity dome, which is what stops the sea reading as
  //             coloured glass
  //   DISPLACE  handled outside this file — arena.splash and the existing
  //             wading system already displace water under a moving fighter,
  //             and the sea plane is registered with them.
  _buildShoreline(g, caster) {
    // a bright empty sky — the palest background any domain sets
    this.scene.background = new THREE.Color(0xbfe4ee);

    // ---- THE SAND ---------------------------------------------------------
    const sand = new THREE.Mesh(new THREE.CircleGeometry(17, 56),
      toonMaterial({
        vertexColors: false, color: 0xe8dcc0, steps: [150, 205, 255],
        rim: 0.16, rimStart: 0.82, rimColor: 0xfff4dc, warm: 0x6a5a3a, cool: 0x8898a8
      }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.01;
    g.add(sand);
    // WET SAND — a darker band where the water reaches, which is most of what
    // makes a beach read as a beach rather than as a yellow disc
    const wet = new THREE.Mesh(new THREE.RingGeometry(9.6, 13.2, 56),
      toonMaterial({ vertexColors: false, color: 0xcbbb9a, steps: [140, 200, 255], rim: 0.3, rimColor: 0xfff4dc }));
    wet.rotation.x = -Math.PI / 2;
    wet.position.y = 0.02;
    g.add(wet);
    // scattered shells and stones, so the sand has scale
    const stoneMat = toonMaterial({ vertexColors: false, color: 0xd6c8ac, steps: [130, 200, 255] });
    for (let i = 0; i < 26; i++) {
      const a = rand(0, Math.PI * 2), r = rand(3, 15);
      const st = new THREE.Mesh(new THREE.SphereGeometry(rand(0.06, 0.16), 6, 5), stoneMat);
      st.scale.set(1, rand(0.3, 0.6), rand(0.7, 1.3));
      st.position.set(Math.sin(a) * r, 0.04, Math.cos(a) * r);
      g.add(st);
    }

    // ---- THE SEA ----------------------------------------------------------
    // A large subdivided plane, displaced per frame in `update`. 64x64 is
    // enough to carry two crossed swells legibly and cheap enough to write
    // every frame without showing up in a profile.
    const seaGeo = new THREE.PlaneGeometry(150, 150, 64, 64);
    seaGeo.rotateX(-Math.PI / 2);
    const seaMat = toonMaterial({
      vertexColors: false, color: 0x2f9fb4, steps: [90, 170, 255],
      rim: 0.46, rimStart: 0.62, rimColor: 0xdff6ff, gloss: 0.5,
      transparent: true, opacity: 0.94, warm: 0x1a4a58, cool: 0x123a52
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    // the shore runs across -Z: sand in front of the camera line, sea beyond
    sea.position.set(0, -0.06, -68);
    g.add(sea);
    this.shoreSea = sea;
    this.shoreBase = Float32Array.from(seaGeo.getAttribute('position').array);

    // A SHALLOW SHELF the fighters can stand in — the source is explicit that
    // "its waters are shallow enough for someone to stand in it while close to
    // the beach", and it is what makes the surf line a place rather than a
    // wall.
    const shelf = new THREE.Mesh(new THREE.RingGeometry(12.6, 17.4, 56),
      toonMaterial({
        vertexColors: false, color: 0x63c4cc, steps: [120, 190, 255],
        rim: 0.4, rimColor: 0xdff6ff, transparent: true, opacity: 0.72
      }));
    shelf.rotation.x = -Math.PI / 2;
    shelf.position.y = 0.05;
    g.add(shelf);
    this.shoreShelf = shelf;

    // ---- FOAM -------------------------------------------------------------
    // The shoreline band, which breathes with the swell, plus individual
    // breakers scattered along it.
    const foam = new THREE.Mesh(new THREE.RingGeometry(12.2, 13.4, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.62, depthWrite: false }));
    foam.rotation.x = -Math.PI / 2;
    foam.position.y = 0.07;
    g.add(foam);
    this.shoreFoam = foam;
    this.shoreBreakers = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + rand(-0.08, 0.08);
      const br = new THREE.Mesh(new THREE.PlaneGeometry(rand(1.6, 3.4), rand(0.28, 0.6)),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }));
      br.rotation.x = -Math.PI / 2;
      br.rotation.z = -a;
      const r = rand(12.4, 14.2);
      br.position.set(Math.sin(a) * r, 0.08, Math.cos(a) * r);
      g.add(br);
      this.shoreBreakers.push({ m: br, phase: rand(0, 6.28), rate: rand(0.5, 0.95), r, a });
    }

    // ---- CAUSTICS ---------------------------------------------------------
    // Bright additive light on the wet sand under the shallows, drifting on
    // its own slower clock. Built as a ring of soft blobs rather than as a
    // texture so it costs nothing to animate and never tiles visibly.
    this.shoreCaustics = [];
    const causticMat = makeGlowMat(0xdffaff, 0.22);
    for (let i = 0; i < 34; i++) {
      const a = rand(0, Math.PI * 2), r = rand(9.8, 15.6);
      const c = new THREE.Mesh(new THREE.CircleGeometry(rand(0.5, 1.5), 8), causticMat);
      c.rotation.x = -Math.PI / 2;
      c.position.set(Math.sin(a) * r, 0.055, Math.cos(a) * r);
      g.add(c);
      this.shoreCaustics.push({ m: c, phase: rand(0, 6.28), rate: rand(0.6, 1.4), a, r });
    }

    // ---- THE PALMS --------------------------------------------------------
    // "A forest of palm trees on one side of the shore" — the detail the
    // source has and the brief does not. They are all on the +Z side, which is
    // what makes the space have a direction: sea one way, forest the other.
    const trunkMat = toonMaterial({ vertexColors: false, color: 0x8a6f4c, steps: [80, 160, 255], rim: 0.24, rimColor: 0xffe0a8 });
    const frondMat = toonMaterial({ vertexColors: false, color: 0x3f8a48, steps: [90, 170, 255], rim: 0.34, rimColor: 0xcfffb0, transparent: true, opacity: 0.97 });
    this.shorePalms = [];
    for (let i = 0; i < 22; i++) {
      const a = rand(-1.15, 1.15);                 // a fan on the +Z side only
      const r = rand(17, 34);
      const h = rand(4.5, 8.2);
      const lean = rand(-0.22, 0.22);
      const palm = new THREE.Group();
      palm.position.set(Math.sin(a) * r, 0, Math.cos(a) * r + 4);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.24, h, 7), trunkMat);
      trunk.position.y = h * 0.5;
      trunk.rotation.z = lean;
      palm.add(trunk);
      const crown = new THREE.Group();
      crown.position.set(Math.sin(lean) * h * 0.5, h, 0);
      for (let k = 0; k < 7; k++) {
        const fa = (k / 7) * Math.PI * 2 + rand(-0.2, 0.2);
        const frond = new THREE.Mesh(new THREE.PlaneGeometry(rand(2.0, 3.2), rand(0.5, 0.85)), frondMat);
        frond.position.set(Math.sin(fa) * 1.2, rand(-0.35, 0.15), Math.cos(fa) * 1.2);
        frond.rotation.set(rand(-0.5, -0.15), -fa + Math.PI / 2, rand(-0.3, 0.3));
        crown.add(frond);
      }
      palm.add(crown);
      g.add(palm);
      this.shorePalms.push({ crown, phase: rand(0, 6.28), rate: rand(0.5, 0.9) });
    }

    // ---- THE SKY, AND ITS REFLECTION --------------------------------------
    const dome = new THREE.Mesh(new THREE.SphereGeometry(95, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0xbfe4ee, side: THREE.BackSide }));
    g.add(dome);
    // a low warm band at the horizon, so the sky is not a flat fill
    const band = new THREE.Mesh(new THREE.CylinderGeometry(92, 92, 14, 28, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe6c4, transparent: true, opacity: 0.5, side: THREE.BackSide, depthWrite: false }));
    band.position.y = 5;
    g.add(band);
    // a few soft clouds, drifting
    this.shoreClouds = [];
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false });
    for (let i = 0; i < 12; i++) {
      const cl = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(rand(2.5, 5.5), 7, 5), cloudMat);
        puff.scale.set(rand(1.4, 2.4), rand(0.45, 0.7), 1);
        puff.position.set(rand(-6, 6), rand(-1, 1), rand(-2, 2));
        cl.add(puff);
      }
      const a = rand(0, Math.PI * 2);
      cl.position.set(Math.sin(a) * rand(45, 78), rand(16, 32), Math.cos(a) * rand(45, 78));
      g.add(cl);
      this.shoreClouds.push({ m: cl, drift: rand(0.25, 0.7), a });
    }
    // THE SKY MIRRORED IN THE WATER — a second inverted dome at very low
    // opacity, which is what stops the sea reading as coloured glass.
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(88, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshBasicMaterial({ color: 0xdff4fa, transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false }));
    mirror.scale.y = -0.45;
    mirror.position.y = -0.1;
    g.add(mirror);

    this.shoreT = 0;
  }

  // ---- SELF-EMBODIMENT OF PERFECTION: claustrophobic, fleshy, patchwork ----
  // grasping hands, stitched surfaces, sickly pale and grey-blue. The threat
  // rings on the floor show Mahito's transfiguration drain radii.
  _buildFlesh(g, caster) {
    this.scene.background = new THREE.Color(0x0a0d14);
    // pallid flesh floor
    const floor = new THREE.Mesh(new THREE.CircleGeometry(15, 48),
      toonMaterial({ vertexColors: false, color: 0x4a4448, steps: [60, 140, 255], rim: 0.3, rimColor: 0x8b9bab }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);
    // stitched seams wandering across the floor
    for (let i = 0; i < 10; i++) {
      const a = rand(0, Math.PI * 2);
      const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.07, rand(3, 8)),
        new THREE.MeshBasicMaterial({ color: 0x2a2226 }));
      seam.rotation.x = -Math.PI / 2;
      seam.rotation.z = a;
      const r = rand(2, 12);
      seam.position.set(Math.sin(a + 1.2) * r, 0.02, Math.cos(a + 1.2) * r);
      g.add(seam);
    }
    // close dark dome — claustrophobic, teal haze
    const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x0c1216, side: THREE.BackSide }));
    g.add(dome);
    const haze = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), makeGlowMat(0x1d3a3f, 0.22));
    haze.position.y = 18;
    haze.rotation.x = Math.PI / 2;
    g.add(haze);
    // the lattice of interlinked arms: rings of pale forearm columns leaning
    // inward, each ending in an open grasping palm (box fingers)
    const skinMat = toonMaterial({ vertexColors: false, color: 0xb8a9a0, steps: [70, 150, 255], rim: 0.45, rimColor: 0x8b9bab });
    const skinMat2 = toonMaterial({ vertexColors: false, color: 0x9a8f92, steps: [70, 150, 255], rim: 0.45, rimColor: 0x8b9bab });
    const hand = (scale) => {
      const h = new THREE.Group();
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.16), skinMat);
      h.add(palm);
      for (let f = 0; f < 4; f++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.42, 0.11), skinMat2);
        fin.position.set(-0.18 + f * 0.12, 0.44, 0);
        fin.rotation.x = rand(-0.5, -0.1);
        h.add(fin);
      }
      const th = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.11), skinMat2);
      th.position.set(0.3, 0.1, 0);
      th.rotation.z = -0.7;
      h.add(th);
      h.scale.setScalar(scale);
      return h;
    };
    this.fleshArms = [];
    for (let ring = 0; ring < 3; ring++) {
      const n = 10 + ring * 4;
      const rr = 16 + ring * 4.5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.35;
        const h = rand(4, 9) + ring * 2;
        const arm = new THREE.Group();
        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(rand(0.24, 0.4), rand(0.4, 0.6), h, 7), i % 2 ? skinMat : skinMat2);
        forearm.position.y = h / 2;
        arm.add(forearm);
        const hd = hand(rand(1.6, 2.6));
        hd.position.y = h;
        hd.rotation.y = rand(0, Math.PI * 2);
        hd.rotation.x = rand(-0.4, 0.1) - 0.25; // curled inward, over the arena
        arm.add(hd);
        arm.position.set(Math.sin(a) * rr, 0, Math.cos(a) * rr);
        arm.rotation.z = Math.sin(a) * 0.22;    // leaning in
        arm.rotation.x = Math.cos(a) * -0.22;
        g.add(arm);
        this.fleshArms.push({ node: arm, ph: rand(0, Math.PI * 2), sp: rand(0.3, 0.8) });
      }
    }
    // the clasped-hands centerpiece looming behind the far edge
    const clasp = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const hd = hand(rand(5, 8));
      const a = (i / 7) * Math.PI * 2;
      hd.position.set(Math.sin(a) * 2.2, Math.abs(Math.cos(a)) * 3 + 8, Math.cos(a) * 1.2);
      hd.rotation.z = a + Math.PI;
      clasp.add(hd);
    }
    clasp.position.set(0, 6, -26);
    g.add(clasp);
    // drifting grey-blue soul motes
    const moteGeo = new THREE.BufferGeometry();
    const M = 260, mp = new Float32Array(M * 3);
    for (let i = 0; i < M; i++) {
      mp[i * 3] = rand(-15, 15); mp[i * 3 + 1] = rand(0.2, 7); mp[i * 3 + 2] = rand(-15, 15);
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    g.add(new THREE.Points(moteGeo, new THREE.PointsMaterial({
      color: 0x8b9bab, size: 0.08, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false
    })));
    // THREAT RINGS: the visible drain radii riding Mahito's position — the
    // danger zone must be readable at a glance (inner = fast, outer = slow)
    const tf = caster?.cfg?.domain?.transfig;
    if (tf) {
      const near = new THREE.Mesh(new THREE.TorusGeometry(tf.nearR, 0.07, 8, 56), makeGlowMat(0xd85a6a, 0.85));
      near.rotation.x = Math.PI / 2;
      const mid = new THREE.Mesh(new THREE.TorusGeometry(tf.midR, 0.05, 8, 64), makeGlowMat(0x8b9bab, 0.5));
      mid.rotation.x = Math.PI / 2;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(tf.nearR, 40),
        new THREE.MeshBasicMaterial({ color: 0xd85a6a, transparent: true, opacity: 0.06, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2;
      g.add(near, mid, disc);
      this.threatRings = { near, mid, disc, caster };
    }
  }

  // ---- IDLE DEATH GAMBLE: a pachinko parlor ------------------------------
  // The brief for this one was "the most cheerful and least threatening
  // domain in the game, which is what makes it unsettling". Everything here is
  // pushed the opposite way from the flesh domain and the volcano: bright,
  // warm, saturated, cluttered, and completely indifferent to the fight. Rows
  // of machines, patterned carpet, neon everywhere, and a ceiling with the
  // lights ON.
  _buildPachinko(g) {
    this.scene.background = new THREE.Color(0x2a1338);

    // ---- carpet: the loudest floor in the game --------------------------
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#241246';
    x.fillRect(0, 0, 256, 256);
    // interlocking swirls and diamonds, the way real parlor carpet is
    // patterned to hide forty years of cigarette ash
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const cx = i * 32 + 16, cy = j * 32 + 16;
        x.strokeStyle = (i + j) % 2 ? '#c8347f' : '#2f9fb8';
        x.lineWidth = 3;
        x.beginPath();
        x.arc(cx, cy, 11, 0, Math.PI * 2);
        x.stroke();
        x.fillStyle = (i + j) % 2 ? '#3d1a5c' : '#1c2f56';
        x.beginPath();
        x.moveTo(cx, cy - 7); x.lineTo(cx + 7, cy); x.lineTo(cx, cy + 7); x.lineTo(cx - 7, cy);
        x.closePath(); x.fill();
      }
    }
    x.strokeStyle = '#e8b23c';
    x.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 256); x.stroke();
      x.beginPath(); x.moveTo(0, i * 32); x.lineTo(256, i * 32); x.stroke();
    }
    const carpet = new THREE.CanvasTexture(c);
    carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
    carpet.repeat.set(9, 9);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 56),
      toonMaterial({ vertexColors: false, color: 0xffffff, map: carpet, steps: [140, 210, 255], rim: 0.1 }));
    floor.rotation.x = -Math.PI / 2;
    g.add(floor);

    // ---- the room: bright walls and a lit ceiling ------------------------
    const dome = new THREE.Mesh(new THREE.SphereGeometry(46, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0x3a1a52, side: THREE.BackSide }));
    g.add(dome);
    const ceiling = new THREE.Mesh(new THREE.CircleGeometry(24, 40), makeGlowMat(0xffe9b0, 0.30));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 9.5;
    g.add(ceiling);
    // strip lights across it
    for (let i = -3; i <= 3; i++) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.5), makeGlowMat(0xfff6dc, 0.7));
      strip.rotation.x = Math.PI / 2;
      strip.position.set(0, 9.3, i * 4.2);
      g.add(strip);
    }

    // ---- the machines ----------------------------------------------------
    // Four shared glass materials, assigned round-robin, so 50-odd cabinets
    // cost four material updates a frame instead of fifty.
    this.pachiGlass = [0xff4fa8, 0x4fd8ff, 0xffd24f, 0x8cff6f]
      .map(col => makeGlowMat(col, 0.8));
    this.pachiLamp = [0xff2f6a, 0xffd24f].map(col => makeGlowMat(col, 0.9));
    const cabMat = toonMaterial({ vertexColors: false, color: 0x1a1626, steps: [70, 160, 255], rim: 0.4, rimColor: 0xff8fd0 });
    const chrome = toonMaterial({ vertexColors: false, color: 0xb0b6c4, steps: [60, 150, 255], rim: 0.6, rimColor: 0xffffff, gloss: 0.7 });
    this.pachiUnits = [];
    const bank = (cx, cz, yaw, n) => {
      for (let i = 0; i < n; i++) {
        const u = new THREE.Group();
        const cab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.95, 0.55), cabMat);
        cab.position.y = 0.98;
        const glassMat = this.pachiGlass[(i + Math.abs(cx | 0)) % 4];
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 1.02), glassMat);
        glass.position.set(0, 1.34, 0.29);
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.18, 0.34), chrome);
        tray.position.set(0, 0.6, 0.22);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.2, 0.56), this.pachiLamp[i % 2]);
        lamp.position.y = 2.06;
        u.add(cab, glass, tray, lamp);
        // back to back, so a bank reads as a proper aisle from either side
        const back = u.clone();
        back.rotation.y = Math.PI;
        back.position.z = -0.58;
        const pair = new THREE.Group();
        pair.add(u, back);
        pair.position.set(cx + Math.cos(yaw) * (i - (n - 1) / 2) * 0.98, 0,
          cz - Math.sin(yaw) * (i - (n - 1) / 2) * 0.98);
        pair.rotation.y = yaw;
        g.add(pair);
        this.pachiUnits.push(pair);
      }
    };
    // four banks pushed out past the fighting space, angled like a real floor
    bank(-11.5, -4.5, 0, 9);
    bank(11.5, -4.5, 0, 9);
    bank(-6.5, 12.0, Math.PI / 2, 8);
    bank(6.5, 12.0, Math.PI / 2, 8);
    bank(0, -13.5, Math.PI / 2, 10);

    // ---- neon signage ----------------------------------------------------
    this.pachiNeon = [];
    const neonRing = (r, y, col, tube) => {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 64), makeGlowMat(col, 0.85));
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = y;
      g.add(mesh);
      this.pachiNeon.push(mesh);
      return mesh;
    };
    neonRing(15.6, 0.25, 0xff2f6a, 0.14);
    neonRing(15.2, 4.2, 0x4fd8ff, 0.10);
    neonRing(14.4, 7.0, 0xffd24f, 0.12);
    // hanging signage slabs: bright blank boards, angled in toward the floor.
    // Deliberately wordless — a legible slogan would date instantly and read
    // as a joke rather than as a place.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const col = [0xff2f6a, 0xffd24f, 0x4fd8ff, 0x8cff6f][i % 4];
      const sign = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 0.12), makeGlowMat(col, 0.75));
      const r = 13 + (i % 3);
      sign.position.set(Math.sin(a) * r, 5.4 + (i % 3) * 0.9, Math.cos(a) * r);
      sign.rotation.y = -a;
      sign.rotation.x = 0.16;
      g.add(sign);
      this.pachiNeon.push(sign);
    }

    // ---- warm saturated key light ---------------------------------------
    const key = new THREE.DirectionalLight(0xffd9a0, 2.2);
    key.position.set(4, 12, 7);
    g.add(key);
    const fill = new THREE.DirectionalLight(0xff8fd0, 1.1);
    fill.position.set(-7, 6, -5);
    g.add(fill);

    // drifting steel balls, catching the light as they fall
    const ballGeo = new THREE.BufferGeometry();
    const N = 220, bp = new Float32Array(N * 3);
    this.pachiBalls = [];
    for (let i = 0; i < N; i++) {
      this.pachiBalls.push({ vy: -rand(1.2, 3.2), drift: rand(-0.4, 0.4) });
      bp[i * 3] = rand(-15, 15); bp[i * 3 + 1] = rand(0.2, 9); bp[i * 3 + 2] = rand(-15, 15);
    }
    ballGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    this.pachiBallPts = new THREE.Points(ballGeo, new THREE.PointsMaterial({
      color: 0xfff0c8, size: 0.13, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    g.add(this.pachiBallPts);

    this.pachiArmed = false;
    this.pachiReach = null;
  }

  // THE GUARANTEE IS ARMED. The parlor stops being cheerful: every neon on the
  // floor goes red-gold and the blink rate doubles. The opponent is meant to
  // notice this from anywhere on the map, without reading the HUD.
  setPachinkoArmed(on) { this.pachiArmed = !!on; }
  // a reach scenario is running; higher tiers drive the room harder
  setReachTier(key) { this.pachiReach = key; }
  // JACKPOT: every machine on the floor goes to full at once
  jackpotErupt(caster) {
    if (this.envKind !== 'pachinko') return;
    for (const m of this.pachiGlass ?? []) m.opacity = 1;
    for (const m of this.pachiNeon ?? []) m.material.opacity = 1;
    for (let i = 0; i < 46; i++) {
      const a = rand(0, Math.PI * 2), r = rand(9, 15);
      this.fx._spawn(v3(Math.sin(a) * r, rand(0.4, 3), Math.cos(a) * r), {
        color: i % 2 ? 0xffc93c : 0xfff3c4, size: rand(0.2, 0.5), life: rand(0.6, 1.4),
        vel: v3(rand(-1, 1), rand(4, 12), rand(-1, 1)), gravity: 8
      });
    }
    if (caster) this.fx._ring(caster.pos.clone().setY(0.08), 0xffc93c, { size: 1.4, growRate: 30, life: 1.0 });
  }

  _buildBarrier(kind) {
    const color = { void: 0x3c5fd8, swordfield: 0x8fd8a8, volcano: 0xd85420, flesh: 0x7a8b9b, pachinko: 0xffc93c, courtroom: 0x7d7047 }[kind] ?? 0x8fd8a8;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(17, 32, 20),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.10, side: THREE.BackSide,
        blending: THREE.AdditiveBlending, depthWrite: false, wireframe: false
      }));
    mesh.position.y = 2;
    const wire = new THREE.Mesh(new THREE.SphereGeometry(16.9, 24, 14),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.12, wireframe: true,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
    wire.position.y = 2;
    this.scene.add(mesh, wire);
    this.barrier = { mesh, wire, color };
  }

  setIntegrity(v) {
    if (!this.barrier) return;
    const w = Math.max(0, Math.min(1, v / 100));
    this.barrier.wire.material.opacity = 0.10 + (1 - w) * 0.35;   // cracks read as brightening lattice
    this.barrier.wire.material.color.setHex(w < 0.35 ? 0xffb03c : this.barrier.color);
  }

  breakImpact(fighter) {
    if (Math.random() < 0.3) {
      const p = fighter.pos.clone().add(v3(0, 1.4, 0)).addScaledVector(fighter.forward(), 1.4);
      this.fx.guardSpark(p);
    }
  }

  simpleDome(fighter, dt) {
    if (!this.simpleDomeMesh) {
      this.simpleDomeMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.scene.add(this.simpleDomeMesh);
    }
    this.simpleDomeT = 0.15;
    this.simpleDomeMesh.position.copy(fighter.pos);
  }

  // ---- DOMAIN CLASH -------------------------------------------------------
  // Two innate barriers trying to occupy the same space. Staged: charge ->
  // collision -> the winner's colour floods out while the loser's dome
  // shatters. Driven by the timeline in _updateClash().
  clashBegin(posA, posB, colorA, colorB) {
    this.clearClash();
    // The contact point rides above head height: at chest height it just reads
    // as a blob stuck behind the near fighter from the follow camera.
    const mid = posA.clone().add(posB).multiplyScalar(0.5).setY(CONTACT_Y);
    const g = new THREE.Group();
    this.scene.add(g);

    const orb = (p, color) => {
      const o = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), makeGlowMat(0xffffff, 0.8));
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 12),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }));
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), makeGlowMat(color, 0.28));
      halo.userData.billboard = true;
      o.add(core, shell, halo);
      o.position.copy(p).setY(CONTACT_Y);
      g.add(o);
      return o;
    };
    // vertical light pillar from each caster — the barriers going up. Kept thin
    // and faint: the camera sits between them, so anything fat here whites out
    // the whole frame once bloom gets hold of it.
    const pillar = (p, color) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.52, 22, 14, 1, true),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.14, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.copy(p).setY(11);
      g.add(m);
      return m;
    };
    // collision flare — a billboard, never a sphere: an expanding sphere would
    // swallow the camera and turn the screen solid white.
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), makeGlowMat(0xffffff, 0));
    flash.position.copy(mid);
    flash.userData.billboard = true;
    g.add(flash);
    // Interlocking shock rings (flat + two tilted) for a 3D blast read. The
    // winner is unknown until the contest resolves, so these are recoloured
    // in clashResolve() rather than here.
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.07, 8, 48), makeGlowMat(0xffffff, 0));
      r.position.copy(mid);
      r.rotation.set(i === 0 ? Math.PI / 2 : i * 0.9, i * 1.2, 0);
      g.add(r);
      rings.push(r);
    }
    // the losing barrier: a dome that cracks and blows apart
    const dome = new THREE.Mesh(new THREE.SphereGeometry(9, 20, 14),
      new THREE.MeshBasicMaterial({ color: colorA, transparent: true, opacity: 0, wireframe: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    dome.position.copy(mid);
    g.add(dome);

    this.clash = {
      phase: 'grind', t: 0, dur: 2.4, g, mid,
      orbA: orb(posA, colorA), orbB: orb(posB, colorB),
      pillarA: pillar(posA, colorA), pillarB: pillar(posB, colorB),
      flash, rings, dome, colorA, colorB, winnerIsA: true, burst: false
    };
    dome.visible = false;
  }

  // the casters move during the contest — keep the pillars on them and the
  // grinding contact point between them
  trackClash(posA, posB) {
    const c = this.clash;
    if (!c || c.phase !== 'grind') return;
    c.pillarA.position.set(posA.x, c.pillarA.position.y, posA.z);
    c.pillarB.position.set(posB.x, c.pillarB.position.y, posB.z);
    c.mid.set((posA.x + posB.x) / 2, CONTACT_Y, (posA.z + posB.z) / 2);
    c.flash.position.copy(c.mid);
    c.dome.position.copy(c.mid);
    c.rings.forEach(r => r.position.copy(c.mid));
  }

  // verdict is in: collapse the lock into the impact + aftermath
  clashResolve(winnerIsA) {
    const c = this.clash;
    if (!c) return;
    c.winnerIsA = winnerIsA;
    c.phase = 'burst';
    c.t = 0;
    c.burst = false;
    c.dome.visible = true;
    c.dome.material.color.setHex(winnerIsA ? c.colorB : c.colorA);
    const win = winnerIsA ? c.colorA : c.colorB;
    c.rings.forEach((r, i) => { if (i > 0) r.material.color.setHex(win); });
  }

  clearClash() {
    if (this.clash) { this.scene.remove(this.clash.g); this.clash = null; }
  }

  _updateClash(dt) {
    const c = this.clash;
    if (!c) return;
    c.t += dt;
    const t = c.t;
    const IMPACT = 0.0;

    if (c.phase === 'grind') {
      // Sustained lock: the two barriers grind against each other at the
      // midpoint for the whole contest while the sorcerers fight underneath.
      const k = Math.min(1, t / 0.6);
      const pulse = 1 + Math.sin(t * 11) * 0.09;
      const s = (0.45 + k * 0.85) * pulse;
      c.orbA.scale.setScalar(s); c.orbB.scale.setScalar(s);
      // each orb sits just off the contact point on its owner's side
      const off = 0.62 + Math.sin(t * 7) * 0.06;
      const dir = c.orbA.position.clone().sub(c.orbB.position).setY(0);
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
      dir.normalize();
      const restA = c.mid.clone().addScaledVector(dir, off).setY(CONTACT_Y);
      const restB = c.mid.clone().addScaledVector(dir, -off).setY(CONTACT_Y);
      c.orbA.position.lerp(restA, 1 - Math.exp(-6 * dt));
      c.orbB.position.lerp(restB, 1 - Math.exp(-6 * dt));
      c.pillarA.material.opacity = 0.09 + k * 0.11;
      c.pillarB.material.opacity = 0.09 + k * 0.11;
      c.pillarA.scale.set(1 + k * 0.3, 1, 1 + k * 0.3);
      c.pillarB.scale.set(1 + k * 0.3, 1, 1 + k * 0.3);
      c.flash.material.opacity = 0.22 + Math.sin(t * 13) * 0.07;
      c.flash.scale.setScalar(0.55 + Math.sin(t * 9) * 0.06);
      // energy streaming into the contact point, and sparks kicked off it
      if (Math.random() < 0.8) {
        for (const [o, col] of [[c.orbA, c.colorA], [c.orbB, c.colorB]]) {
          const p = o.position.clone().add(v3(rand(-1.4, 1.4), rand(-1.0, 1.4), rand(-1.4, 1.4)));
          const toMid = c.mid.clone().sub(p).normalize().multiplyScalar(rand(5, 10));
          this.fx._spawn(p, { color: col, size: rand(0.14, 0.36), life: 0.28, vel: toMid });
        }
      }
      if (Math.random() < 0.5) {
        const a = rand(0, Math.PI * 2);
        this.fx._spawn(c.mid, {
          color: 0xffffff, size: rand(0.1, 0.26), life: rand(0.2, 0.4),
          vel: v3(Math.cos(a) * rand(2, 6), rand(0.5, 4), Math.sin(a) * rand(2, 6)), gravity: 6
        });
      }
      return;
    }

    if (!c.burst) {
      // impact
      c.burst = true;
      c.orbA.visible = c.orbB.visible = false;
      const win = c.winnerIsA ? c.colorA : c.colorB;
      const lose = c.winnerIsA ? c.colorB : c.colorA;
      for (let i = 0; i < 70; i++) {
        const a = rand(0, Math.PI * 2), e = rand(-0.7, 1.1);
        const dir = v3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
        this.fx._spawn(c.mid, {
          color: i % 3 === 0 ? 0xffffff : (i % 2 ? win : lose),
          size: rand(0.22, 0.8), life: rand(0.5, 1.2),
          vel: dir.multiplyScalar(rand(7, 26)), gravity: 3
        });
      }
      this.fx._ring(c.mid.clone().setY(0.08), 0xffffff, { size: 1, growRate: 34, life: 0.75 });
      this.fx._ring(c.mid.clone().setY(0.08), win, { size: 1, growRate: 24, life: 0.95 });
    } else {
      // aftermath: rings expand, winner floods, loser's dome shatters outward
      const k = (t - IMPACT) / (c.dur - IMPACT);
      const fade = Math.max(0, 1 - k * 2.2);
      c.flash.scale.setScalar(1 + k * 7);
      c.flash.material.opacity = Math.max(0, 0.8 - k * 2.6);
      c.rings.forEach((r, i) => {
        r.scale.setScalar(1 + k * (16 + i * 7));
        r.material.opacity = Math.max(0, (1 - k * 1.35) * 0.7);
      });
      c.dome.scale.setScalar(0.35 + k * 1.5);
      c.dome.material.opacity = Math.max(0, Math.sin(Math.min(1, k * 2.6) * Math.PI) * 0.32);
      c.pillarA.material.opacity = fade * 0.16;
      c.pillarB.material.opacity = fade * 0.16;
      // falling shards from the shattered barrier
      if (k < 0.5 && Math.random() < 0.6) {
        const a = rand(0, Math.PI * 2), r = rand(3, 9);
        this.fx._spawn(c.mid.clone().add(v3(Math.sin(a) * r, rand(0, 7), Math.cos(a) * r)), {
          color: c.winnerIsA ? c.colorB : c.colorA,
          size: rand(0.2, 0.55), life: rand(0.5, 1.0),
          vel: v3(rand(-2, 2), rand(-7, -2), rand(-2, 2)), gravity: 5
        });
      }
      if (t >= c.dur) this.clearClash();
    }
  }

  hide(shattered = false) {
    this.clearCast();
    // note: an in-flight clash sequence is intentionally NOT cleared here —
    // the losing barrier shattering is the whole point of the shot.
    if (this.barrier) {
      if (shattered) {
        for (let i = 0; i < 24; i++) {
          this.fx._spawn(v3(rand(-8, 8), rand(1, 8), rand(-8, 8)), {
            color: this.barrier.color, size: rand(0.3, 0.7), life: rand(0.4, 0.9),
            vel: v3(rand(-4, 4), rand(-6, -2), rand(-4, 4)), gravity: 4
          });
        }
      }
      this.scene.remove(this.barrier.mesh, this.barrier.wire);
      this.barrier = null;
    }
    if (this.env) {
      this.scene.remove(this.env);
      this.env = null;
    }
    if (this.envKind === 'swordfield') this.fx.rikaManifest(false);
    this.envKind = null;
    this.open = false;
    this.ash = null;
    this.soot = null;
    this.fleshArms = null;
    this.threatRings = null;
    this.shadowSea = null;
    this.shadowBeasts = null;
    this.shrineNode = null;
    this.shrineJaw = null;
    this.shrineEdge = null;
    this.shrineFill = null;
    this.shrineAsh = null;
    this.shrineAshPts = null;
    this.shrineOrigin = null;
    this.dust = null;
    this.courtDust = null;
    this.pachiGlass = null;
    this.pachiLamp = null;
    this.pachiNeon = null;
    this.pachiUnits = null;
    this.pachiBalls = null;
    this.pachiBallPts = null;
    this.pachiArmed = false;
    this.pachiReach = null;
    this.arena.group.visible = true;
    this.scene.background = new THREE.Color(this.arena.background ?? 0x232948);
    this.scene.fog = this.arena.fog;
  }

  update(dt, domainState) {
    this.t += dt;
    this._updateClash(dt);
    if (this.castFx) {
      this.castFx.t += dt;
      const s = this.castFx.sphere;
      s.scale.setScalar(1 + this.castFx.t * 14);
      s.material.opacity = Math.min(0.85, this.castFx.t * 1.1);
    }
    if (this.envKind === 'void' && this.motes) {
      const pos = this.motes.geometry.getAttribute('position');
      for (let i = 0; i < this.moteSeeds.length; i++) {
        const m = this.moteSeeds[i];
        m.a += dt * m.sp * 0.5;
        m.r -= dt * m.sp * 0.35;
        if (m.r < 1.5) m.r = 22;
        pos.array[i * 3] = Math.sin(m.a) * m.r;
        pos.array[i * 3 + 2] = Math.cos(m.a) * m.r;
      }
      pos.needsUpdate = true;
    }
    if (this.envKind === 'volcano') {
      // ash falls, embers rise; both wrap vertically
      for (const [pts, seeds] of [[this.ash, this.ashSeeds]]) {
        if (!pts) continue;
        const pos = pts.geometry.getAttribute('position');
        for (let i = 0; i < seeds.length; i++) {
          const s = seeds[i];
          let y = pos.array[i * 3 + 1] + s.vy * dt;
          pos.array[i * 3] += s.drift * dt;
          if (s.ember && y > 14) y = 0.2;
          if (!s.ember && y < 0.1) y = 14;
          pos.array[i * 3 + 1] = y;
        }
        pos.needsUpdate = true;
      }
      if (this.soot) {
        const pos = this.soot.geometry.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
          let y = pos.array[i * 3 + 1] - 0.9 * dt;
          if (y < 0.2) y = 16;
          pos.array[i * 3 + 1] = y;
        }
        pos.needsUpdate = true;
      }
    }
    if (this.envKind === 'flesh') {
      // the wall of arms sways — slow, wrong, alive
      if (this.fleshArms) {
        for (const a of this.fleshArms) {
          a.node.rotation.y = Math.sin(this.t * a.sp + a.ph) * 0.08;
          a.node.position.y = Math.sin(this.t * a.sp * 0.7 + a.ph) * 0.15;
        }
      }
      // threat rings ride Mahito, pulsing
      const tr = this.threatRings;
      if (tr?.caster) {
        const p = tr.caster.pos;
        for (const mesh of [tr.near, tr.mid, tr.disc]) mesh.position.set(p.x, mesh === tr.disc ? 0.03 : 0.05, p.z);
        tr.near.material.opacity = 0.6 + Math.sin(this.t * 6) * 0.25;
      }
    }
    if (this.envKind === 'pachinko') {
      // Four glass banks blinking out of phase, the neon breathing under them,
      // and steel balls raining down the room. `speed` and `hot` are the two
      // dials the gamble state turns: a super reach drives the whole floor
      // harder, and the armed guarantee turns everything red-gold.
      const reach = this.pachiReach;
      const speed = this.pachiArmed ? 7.5 : reach === 'super' ? 9 : reach === 'strong' ? 5 : 3;
      const floor = this.pachiArmed ? 0.55 : 0.35;
      for (let i = 0; i < (this.pachiGlass?.length ?? 0); i++) {
        const m = this.pachiGlass[i];
        m.opacity = floor + 0.45 * (0.5 + 0.5 * Math.sin(this.t * speed + i * 1.7));
        if (this.pachiArmed) m.color.setHex(i % 2 ? 0xff2f2f : 0xffc93c);
      }
      for (let i = 0; i < (this.pachiLamp?.length ?? 0); i++) {
        this.pachiLamp[i].opacity = 0.45 + 0.5 * (0.5 + 0.5 * Math.sin(this.t * speed * 1.6 + i * 2.4));
        if (this.pachiArmed) this.pachiLamp[i].color.setHex(0xff2f2f);
      }
      for (let i = 0; i < (this.pachiNeon?.length ?? 0); i++) {
        const n = this.pachiNeon[i];
        n.material.opacity = 0.45 + 0.45 * (0.5 + 0.5 * Math.sin(this.t * (speed * 0.7) + i * 0.9));
        if (this.pachiArmed) n.material.color.setHex(i % 2 ? 0xffc93c : 0xff2f2f);
      }
      if (this.pachiBallPts) {
        const pos = this.pachiBallPts.geometry.getAttribute('position');
        for (let i = 0; i < this.pachiBalls.length; i++) {
          const b = this.pachiBalls[i];
          let py = pos.array[i * 3 + 1] + b.vy * dt;
          pos.array[i * 3] += b.drift * dt;
          if (py < 0.1) py = 9;
          pos.array[i * 3 + 1] = py;
        }
        pos.needsUpdate = true;
      }
    }
    // ---- THE SHORELINE, PER FRAME -----------------------------------------
    // The whole "water needs real treatment" list, ticked. Everything here is
    // on its own clock at its own rate, deliberately incommensurate, so
    // nothing in the domain ever visibly loops — which matters more here than
    // anywhere else in the file, because this is the one environment the
    // player is meant to LOOK at rather than survive.
    if (this.envKind === 'shoreline' && this.shoreSea) {
      this.shoreT += dt;
      const T = this.shoreT;
      // SURFACE. Two crossed swells at different wavelengths and rates, plus a
      // small third ripple, written straight into the plane's positions.
      const pos = this.shoreSea.geometry.getAttribute('position');
      const base = this.shoreBase;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        const h =
          Math.sin(x * 0.085 + T * 0.85) * 0.30 +
          Math.sin(z * 0.062 - T * 0.62) * 0.24 +
          Math.sin((x + z) * 0.19 + T * 1.7) * 0.07;
        pos.setY(i, base[i * 3 + 1] + h);
      }
      pos.needsUpdate = true;
      this.shoreSea.geometry.computeVertexNormals();

      // FOAM. The shoreline band breathes in and out with the swell — the
      // radius moves, so the waterline visibly advances and retreats.
      if (this.shoreFoam) {
        const breathe = 1 + Math.sin(T * 0.72) * 0.028;
        this.shoreFoam.scale.set(breathe, breathe, 1);
        this.shoreFoam.material.opacity = 0.50 + Math.sin(T * 0.72) * 0.16;
      }
      if (this.shoreShelf) {
        const b2 = 1 + Math.sin(T * 0.72 - 0.4) * 0.022;
        this.shoreShelf.scale.set(b2, b2, 1);
      }
      // individual breakers, each running its own little wash up the sand
      for (const b of this.shoreBreakers) {
        const k = (Math.sin(T * b.rate + b.phase) + 1) * 0.5;
        b.m.material.opacity = 0.18 + k * 0.55;
        const r = b.r - k * 0.55;
        b.m.position.set(Math.sin(b.a) * r, 0.08, Math.cos(b.a) * r);
        b.m.scale.set(1, 0.6 + k * 0.8, 1);
      }
      // CAUSTICS. Slow, independent, and they SWIM — each blob drifts around
      // its own anchor rather than pulsing in place, which is what makes the
      // light on the wet sand read as coming through moving water.
      for (const c of this.shoreCaustics) {
        const k = (Math.sin(T * c.rate + c.phase) + 1) * 0.5;
        c.m.scale.setScalar(0.6 + k * 0.9);
        const r = c.r + Math.sin(T * c.rate * 0.6 + c.phase) * 0.7;
        const a = c.a + Math.cos(T * c.rate * 0.4 + c.phase) * 0.05;
        c.m.position.set(Math.sin(a) * r, 0.055, Math.cos(a) * r);
      }
      // the palms move in the wind, crowns only
      for (const p of this.shorePalms) {
        p.crown.rotation.z = Math.sin(T * p.rate + p.phase) * 0.075;
        p.crown.rotation.x = Math.cos(T * p.rate * 0.7 + p.phase) * 0.05;
      }
      // and the clouds drift, very slowly, around the dome
      for (const c of this.shoreClouds) {
        c.a += dt * c.drift * 0.012;
        const r = Math.hypot(c.m.position.x, c.m.position.z);
        c.m.position.x = Math.sin(c.a) * r;
        c.m.position.z = Math.cos(c.a) * r;
      }
    }
    if (this.envKind === 'shadow' && this.shadowSea && domainState) {
      // track the spread, the dents and the circling beasts
      const u = this.shadowSea.material.uniforms;
      u.uT.value = this.t;
      const R = Math.max(0.01, domainState.shadowR ?? 0);
      this.shadowSea.scale.setScalar(R);
      if (domainState.shadowOrigin) {
        this.shadowSea.position.x = domainState.shadowOrigin.x;
        this.shadowSea.position.z = domainState.shadowOrigin.z;
      }
      // dents are handed to the shader in the disc's own normalized space
      const dents = domainState.dents || [];
      for (let i = 0; i < 6; i++) {
        const d = dents[i];
        const v = u.uDents.value[i];
        if (!d) { v.set(0, 0, 0); continue; }
        v.set((d.x - this.shadowSea.position.x) / R, -(d.z - this.shadowSea.position.z) / R, d.r / R);
      }
      for (const b of this.shadowBeasts) {
        b.a += dt * b.sp;
        b.mesh.position.set(
          this.shadowSea.position.x + Math.sin(b.a) * b.r,
          b.y + Math.sin(this.t * 0.6 + b.a) * 0.35,
          this.shadowSea.position.z + Math.cos(b.a) * b.r);
      }
    }
    // MALEVOLENT SHRINE: the edge ring tracks the domain's current spread —
    // it is the line the opponent has to get past, so it has to be honest
    // about where that line actually is on any given frame.
    if (this.envKind === 'shrine') {
      const R = Math.max(0.01, domainState?.shrineR ?? 0);
      if (this.shrineEdge) {
        this.shrineEdge.scale.setScalar(R);
        this.shrineEdge.material.uniforms.uT.value = this.t;
      }
      if (this.shrineFill) this.shrineFill.scale.setScalar(R);
      // the shrine settles as it rises, and the jaw breathes
      if (this.shrineNode) {
        const open = Math.min(1, domainState?.openT ?? 1);
        this.shrineNode.scale.setScalar(0.35 + 0.65 * open);
        this.shrineNode.position.y = -6 * (1 - open);
      }
      if (this.shrineJaw) this.shrineJaw.scale.y = 1 + Math.sin(this.t * 1.7) * 0.06;
      if (this.shrineAshPts) {
        const p = this.shrineAshPts.geometry.getAttribute('position');
        for (let i = 0; i < this.shrineAsh.length; i++) {
          const s = this.shrineAsh[i];
          let y = p.array[i * 3 + 1] + s.vy * dt;
          p.array[i * 3] += s.drift * dt;
          if (y < 0.1) y = this.shrineAshTop ?? 20;
          p.array[i * 3 + 1] = y;
        }
        p.needsUpdate = true;
      }
    }
    // the courtroom: dust settling through the light beam, and nothing else
    // moving at all. The stillness is the effect.
    if (this.envKind === 'courtroom' && this.dust) {
      const pos = this.dust.geometry.getAttribute('position');
      for (let i = 0; i < this.courtDust.length; i++) {
        const d = this.courtDust[i];
        let y = pos.array[i * 3 + 1] + d.vy * dt;
        pos.array[i * 3] += d.drift * dt;
        if (y < 0.1) { y = 9.6; pos.array[i * 3] = rand(-4, 4); pos.array[i * 3 + 2] = rand(-3.5, 4.5); }
        pos.array[i * 3 + 1] = y;
      }
      pos.needsUpdate = true;
    }
    if (this.barrier && domainState) this.setIntegrity(domainState.integrity);
    if (this.simpleDomeMesh) {
      this.simpleDomeT -= dt;
      if (this.simpleDomeT <= 0) {
        this.scene.remove(this.simpleDomeMesh);
        this.simpleDomeMesh = null;
      }
    }
  }
}
