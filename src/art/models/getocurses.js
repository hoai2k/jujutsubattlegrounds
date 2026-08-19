// GETO'S CURSED SPIRITS — the stable, built from the ones he is actually shown
// commanding.
//
// ======================== SHARED REFERENCE SHEET =========================
// Researched against the Jujutsu Kaisen Wiki's Cursed Spirit Manipulation page
// (which carries a table of every curse Geto and Kenjaku are drawn using) plus
// the individual pages for the named ones. All geometry, texture and animation
// below is original and procedural.
//
// WHAT THE RESEARCH ACTUALLY SAYS, curse by curse. Every one of these is a
// spirit he is SHOWN with — none of them is invented:
//
//   THE MANTA RAY — unnamed in canon. "A flying curse with an appearance
//     similar to an AQUATIC STING-RAY. It is capable of LEVITATING and has
//     enough size to SUPPORT SUGURU AND ONE OTHER PERSON." He escapes with
//     Riko Amanai on it during the Star Plasma Vessel mission, and a
//     manta-shaped curse swoops in to pull Kenjaku out of the fight with
//     Choso. So: MOBILITY. It is a mount and a dive-bomber, not a brawler.
//
//   RAINBOW DRAGON 虹竜 (Kōryū) — named. "A cursed spirit that resembles a
//     LARGE WHITE JAPANESE DRAGON with BULGING YELLOW EYES." "Its most notable
//     aspect was its DURABILITY, having the HARDEST SKIN out of all of Geto's
//     cursed spirits. It was also decently fast and strong, being able to
//     SMASH INTO AND DESTROY STONE STRUCTURES. It also had the ability to
//     FLY." Toji exorcises it with the Split Soul Katana. So: an eastern
//     dragon — long serpentine body, four short clawed legs, whiskers, antlers
//     — in WHITE with YELLOW eyes, and it is the heaviest thing in the stable.
//
//   THE HOOKWORM — unnamed. "A GIANT MAN-EATING HOOKWORM-LIKE curse with SHARP
//     TEETH with innards large enough to CAPTURE AND SWALLOW large curses...
//     It always APPEARS SUDDENLY FROM THE GROUND." It swallows Toji whole.
//
//   THE FUNGUS CURSE — unnamed. "A TALL curse with a FUNGUS BASE and SEVERAL
//     HEADS atop it capable of CAPTURING Suguru's targets. Upon doing so the
//     LARGEST HEAD on the curse will attempt to KISS whoever is captive."
//
//   THE DARUMA — unnamed. "A LARGE BLUE DARUMA DOLL cursed spirit summoned by
//     Suguru to CRUSH Shigeru Sonoda to death."
//
//   THE PILLAR CURSE — unnamed, semi-grade 1 by the fanbook. It "can FIRE
//     DESTRUCTIVE PILLARS OF LIGHT down on a target by POINTING ITS INDEX AND
//     MIDDLE FINGER ON EITHER HAND UPWARDS." Fought Toge and Yuta at the Hapina
//     Shopping Center in JJK 0.
//
//   THE CENTIPEDES — unnamed. "Multiple RED CENTIPEDE-LIKE cursed spirits that
//     Suguru summoned to battle Maki Zenin," and countless more against Yuta.
//
//   THE DECOY EYES — unnamed. "Two SMALL SINGLE-EYED curses that act as DECOYS
//     for Suguru while standing off with opponents."
//
//   THE FLESH-EATERS — unnamed. "A group of GRADE 3 OR LOWER cursed spirits
//     that WORK TOGETHER TO SUCK A PERSON'S FLESH APART."
//
//   KO-GUY — named, and the one canon-named low/mid curse with a published
//     design. "A relatively large, BIPEDAL, HUMANOID curse that strongly
//     RESEMBLES A NORMAL GRASSHOPPER. Ko-Guy uses TWO OF HIS SIX LEGS to stand
//     on and THE OTHER FOUR AS ARMS." Green skin, yellow bulging eyes, a
//     humanoid mouth with large jagged teeth. He can "shoot BLACK MUCUS from
//     his mouth, and expand his abdomen to stab his opponents." (He is
//     Kenjaku's asset in Shibuya rather than Geto's own — flagged in his def.)
//
// THE FAMILY LANGUAGE, which is what stops fifteen curses looking like fifteen
// projects:
//   · SICKLY COLOUR. Every palette here is a healthy colour pushed wrong —
//     bruised violets, drowned greens, waterlogged greys, a white that has
//     gone slightly yellow. Nothing is saturated and nothing is clean.
//   · WRONG ANATOMY. Each one has a feature a real animal would not survive:
//     an eye with no head, a mouth with no jaw hinge, a limb count off by two.
//   · THE VIOLET RIM. All of them shade through a #9f7fd0 rim (creature.js
//     CURSE_RIM), against the shikigami's cool blue and the transfigured
//     humans' grey — three summoners on one field stay tellable apart at
//     silhouette size, which was already the rule and still is.
//   · THEY INFLATE rather than emerging: a curse does not rise out of a
//     shadow, it is pushed out of a tear in the air. `revealer` is shared.
//
// Every model exposes the same interface the shikigami and the low-grade
// curses already use — { group, height, radius, setReveal, tick } — so
// combat/curses.js drives all of them, plus the four reused playable
// characters, through one code path.
// =========================================================================
import * as THREE from 'three';
import { tubeBetween, coneSpike, roundBox, tGeo } from '../builders/geo.js';
import { v3, rand } from '../../core/mathutil.js';
import {
  projectUV, dermis, scaleMat, pelt, boneMat, glow, voidMat,
  fleshTex, scaleTex, chitinTex, membraneTex, energyTex, maskTex, amphibianTex,
  CURSE_RIM
} from '../textures/creature.js';
import { makeOutline } from '../shaders/outline.js';
import { bakeStatic, collectOutlines, applyLOD } from '../builders/bake.js';

const VIOLET = 0x6b2fa0;

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
function joint(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function part(parent, geo, mat, { outline = false, thickness = 0.012, uv = 'auto', uvScale = [1, 1], uvOffset = [0, 0] } = {}) {
  if (uv !== 'keep') {
    if (uv === 'auto') { if (!geo.getAttribute('uv')) projectUV(geo, 'cylY', { scale: uvScale, offset: uvOffset }); }
    else projectUV(geo, uv, { scale: uvScale, offset: uvOffset });
  }
  const mesh = new THREE.Mesh(geo, mat);
  parent.add(mesh);
  if (outline) parent.add(makeOutline(mesh, { color: 0x0d0710, thickness }));
  return mesh;
}
function blob(rx, ry, rz, seg = 10) {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 2));
  g.scale(rx, ry, rz);
  g.computeVertexNormals();
  return g;
}
// the shared curse material: any texture, always the violet rim
function skin(map, o = {}) {
  return dermis(map, { rimColor: CURSE_RIM, rim: 0.42, rimStart: 0.60, ...o });
}
// The family tell on arrival: a curse does not rise out of a shadow the way a
// shikigami does, it INFLATES out of nothing. One line per model.
function revealer(group) {
  return k => {
    const s = Math.max(0.001, k);
    group.scale.set(s, s, s);
    group.visible = k > 0.001;
  };
}

// Every curse ends with this: the static bake (see builders/bake.js) plus the
// outline LOD hook, applied in one place so a new curse cannot forget either.
function finishCurse(model) {
  bakeStatic(model.group);
  model.hulls = collectOutlines(model.group);
  model.setLOD = (dist) => applyLOD(model.hulls, dist);
  model.setReveal(0);
  return model;
}
// ---------------------------------------------------------------------------
// A LOFTED WING PANEL
// ---------------------------------------------------------------------------
// Built for the manta ray and worth its own function, because the first two
// attempts at that creature both failed the same way: a wing assembled out of
// stacked flattened ellipsoids reads as a row of SHINGLES, with visible steps
// along the leading edge and gaps at the overlaps. A manta's silhouette is one
// continuous curve from nose to wingtip and nothing else about the design
// matters if that curve is broken.
//
// So the wing is a real loft: a lens-shaped cross-section (leading edge, top,
// trailing edge, bottom) swept along a set of stations, each with its own
// chord, thickness and fore/aft offset. Two panels per side — inboard and
// outboard — so the wing can still articulate along the span, and the join is
// invisible because both panels share the section at that station.
//
// `stations`: [{ x, chord, thick, z }] from root to tip, in the wing's own
// space with +x outboard.
function loftWing(stations) {
  const pos = [], idx = [];
  const N = stations.length;
  for (const st of stations) {
    const c = st.chord * 0.5, th = Math.max(0.0006, st.thick * 0.5);
    // leading (+z), top (+y), trailing (-z), bottom (-y)
    pos.push(st.x, 0, st.z + c);
    pos.push(st.x, th, st.z);
    pos.push(st.x, 0, st.z - c);
    pos.push(st.x, -th, st.z);
  }
  // WINDING FOLLOWS THE SWEEP DIRECTION. The left and right wings are the same
  // loft run in opposite directions along x, so one of them comes out
  // inside-out — and an inside-out lofted surface with an inverted-hull
  // outline behind it renders as a solid black wing, which is exactly what the
  // first build of this did. The sign of the sweep picks the winding.
  const flip = (stations[N - 1].x - stations[0].x) < 0;
  const tri = (p, q, r) => (flip ? idx.push(p, r, q) : idx.push(p, q, r));
  for (let i = 0; i < N - 1; i++) {
    const a = i * 4, b = (i + 1) * 4;
    for (let f = 0; f < 4; f++) {
      const a0 = a + f, a1 = a + (f + 1) % 4, b0 = b + f, b1 = b + (f + 1) % 4;
      tri(a0, a1, b0); tri(a1, b1, b0);
    }
  }
  // cap the root so the panel is closed where it meets the body
  tri(0, 2, 1); tri(0, 3, 2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// A cursed eye — the single most reused feature in the set, because "an eye
// where an eye should not be" is the cheapest and most reliable way to make a
// shape read as a curse rather than as an animal.
function cursedEye(host, r, { pos = [0, 0, 0], iris = 0xf0e070, pupil = 0x140a10, look = 0 } = {}) {
  const g = joint(host, pos[0], pos[1], pos[2]);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xe8e2d0 }));
  g.add(ball);
  const ir = new THREE.Mesh(new THREE.CircleGeometry(r * 0.62, 14), new THREE.MeshBasicMaterial({ color: iris }));
  ir.position.z = r * 0.86;
  g.add(ir);
  const pu = new THREE.Mesh(new THREE.CircleGeometry(r * 0.28, 12), voidMat(pupil));
  pu.position.z = r * 0.90;
  g.add(pu);
  // the veined membrane over it — what keeps it from reading as a cartoon eye
  const lid = new THREE.Mesh(new THREE.SphereGeometry(r * 1.04, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    new THREE.MeshBasicMaterial({ color: 0x6a4a58, transparent: true, opacity: 0.85 }));
  lid.rotation.x = -1.1 + look;
  g.add(lid);
  return { group: g, iris: ir, pupil: pu, lid };
}

// ===========================================================================
// LOW GRADE 1 — CENTIPEDE 百足 : red, long, many-legged, fast
// ===========================================================================
export function buildCentipede() {
  const g = new THREE.Group();
  const H = 0.62;
  const shell = scaleMat(chitinTex('centipede', {
    base: '#5e1418', plate: '#8e2226', rim: '#c85a40', bands: 20
  }), { rimColor: CURSE_RIM, rim: 0.5, rimStart: 0.56, gloss: 0.4 });
  const legMat = skin(chitinTex('centipedeLeg', {
    base: '#3c0e12', plate: '#5e1418', rim: '#a04030', bands: 10
  }));

  // a chain of 11 segments, each with a leg pair. It travels flat to the
  // ground and pours around obstacles rather than stepping over them.
  const links = [];
  const legs = [];
  let host = joint(g, 0, H * 0.42, 0);
  const head = joint(host, 0, 0, H * 0.30);
  part(head, blob(H * 0.28, H * 0.24, H * 0.34, 12), shell, { outline: true, thickness: 0.010, uvScale: [2, 2] });
  // mandibles — a pair of inward-curving hooks, which is what a centipede
  // actually kills with
  const mandibles = [];
  for (const s of [1, -1]) {
    const mj = joint(head, s * H * 0.16, -H * 0.08, H * 0.24);
    part(mj, tGeo(coneSpike(H * 0.055, H * 0.28, v3(-s * H * 0.14, 0, 0), { radial: 5, hSeg: 3 }), { rot: [82, 0, 0] }),
      legMat, { uv: 'cylY' });
    mandibles.push(mj);
    cursedEye(head, H * 0.055, { pos: [s * H * 0.16, H * 0.10, H * 0.24], iris: 0xf0d040 });
    // and a second pair of eyes, because one pair would be an animal
    cursedEye(head, H * 0.035, { pos: [s * H * 0.20, H * 0.02, H * 0.16], iris: 0xd07030 });
  }
  for (let i = 0; i < 11; i++) {
    const k = i / 10;
    const r = H * (0.21 - k * 0.11);
    part(host, tGeo(blob(r, r * 0.66, H * 0.22, 10), {}), shell,
      { uvScale: [2, 1], uvOffset: [0, i * 0.3] });
    for (const s of [1, -1]) {
      const lj = joint(host, s * r * 0.85, -r * 0.30, 0);
      lj.rotation.z = s * 0.9;
      // THE LEGS HAVE TO BE VISIBLE OR IT IS A CATERPILLAR. At the first
      // length they were a tenth of the body's own width and the silhouette
      // read as a segmented tube; they are now longer than the body is wide
      // and they splay outward, so the fringe is the thing you see.
      part(lj, tubeBetween(v3(0, 0, 0), v3(s * H * 0.34, -H * 0.22, 0), [H * 0.026, H * 0.008], { radial: 4, hSeg: 3 }),
        legMat, { uv: 'cylY' });
      legs.push({ j: lj, side: s, phase: i * 0.55 });
    }
    const next = joint(host, 0, 0, -H * 0.32);
    links.push(next);
    host = next;
  }
  // a stinger tail
  part(host, tGeo(coneSpike(H * 0.06, H * 0.30, v3(0, 0, -H * 0.10), { radial: 5, hSeg: 3 }), { rot: [-100, 0, 0] }),
    legMat, { uv: 'cylY' });

  const model = {
    group: g, height: H * 0.9, radius: H * 1.6,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt * (2.4 + (anim.speed ?? 0) * 0.9);
      const t = this._t;
      // a travelling wave down the body — the same trick the Great Serpent
      // uses, run much faster and much tighter
      links.forEach((l, i) => {
        l.rotation.y = Math.sin(t * 2.4 - i * 0.9) * 0.20;
        l.rotation.x = Math.cos(t * 2.0 - i * 0.7) * 0.06;
      });
      // the legs ripple in a metachronal wave, which is the one thing that
      // makes a many-legged thing look alive rather than like a caterpillar toy
      for (const L of legs) {
        L.j.rotation.x = Math.sin(t * 5 - L.phase) * 0.55;
      }
      const bite = anim.action === 'bite' ? (anim.actionK ?? 0) : 0;
      mandibles.forEach((mj, i) => { mj.rotation.y = (i ? 1 : -1) * (0.2 + bite * 0.9); });
      head.rotation.x = -0.1 + Math.sin(t * 1.6) * 0.10 - bite * 0.2;
      head.rotation.y = Math.sin(t * 1.1) * 0.14;
      if (anim.hurt) g.rotation.z = Math.sin(t * 40) * 0.12; else g.rotation.z *= 0.85;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// LOW GRADE 2 — DECOY EYE : a single eye, no body, no face
// ===========================================================================
// "Two small single-eyed curses that act as DECOYS." Built as literally that:
// one large eye with a ring of grasping tendrils where a socket would be, and
// nothing else. Its whole job is to be looked at.
export function buildDecoyEye() {
  const g = new THREE.Group();
  const H = 0.70;
  const sclera = skin(fleshTex('decoySclera', {
    base: '#ded6c4', blotchA: '#b9ada0', blotchB: '#a08890', seam: '#7a3a44', seams: 0, veins: 26
  }), { rim: 0.5, rimStart: 0.55, gloss: 0.55 });
  const meat = skin(fleshTex('decoyMeat', {
    base: '#6a4458', blotchA: '#4a2c3c', blotchB: '#8a5a70', seam: '#3a1c28', seams: 3, veins: 12,
    bloom: '#6b2fa0'
  }));

  const core = joint(g, 0, H * 0.62, 0);
  const ball = part(core, blob(H * 0.34, H * 0.34, H * 0.34, 16), sclera, { outline: true, uvScale: [2, 2] });
  const iris = new THREE.Mesh(new THREE.CircleGeometry(H * 0.20, 18),
    new THREE.MeshBasicMaterial({ color: 0xc8a020 }));
  iris.position.z = H * 0.325;
  core.add(iris);
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(H * 0.085, 14), voidMat(0x120810));
  pupil.position.z = H * 0.335;
  core.add(pupil);
  // the socket meat, gripping the back of the eyeball
  part(core, tGeo(blob(H * 0.30, H * 0.30, H * 0.22, 12), { pos: [0, 0, -H * 0.18] }), meat, { uvScale: [2, 2] });
  const tendrils = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const root = joint(core, Math.cos(a) * H * 0.26, Math.sin(a) * H * 0.26, -H * 0.14);
    root.rotation.set(Math.sin(a) * 0.5, -Math.cos(a) * 0.5, 0);
    let hostT = root;
    const segs = [];
    for (let k = 0; k < 3; k++) {
      part(hostT, tubeBetween(v3(0, 0, 0), v3(0, 0, -H * 0.16), [H * (0.030 - k * 0.007), H * (0.024 - k * 0.006)],
        { radial: 4, hSeg: 2 }), meat, { uv: 'cylZ' });
      hostT = joint(hostT, 0, 0, -H * 0.16);
      segs.push(hostT);
    }
    tendrils.push({ segs, phase: i * 0.9 });
  }

  const model = {
    group: g, height: H, radius: H * 0.4,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      g.position.y = Math.sin(t * 1.6) * H * 0.08;
      // IT NEVER BLINKS AND IT ALWAYS LOOKS AT YOU. The whole eye tracks
      // forward with a slow drift, and the pupil dilates when it is hit — a
      // decoy that flinches is a decoy that gets believed.
      core.rotation.y = Math.sin(t * 0.7) * 0.35;
      core.rotation.x = Math.sin(t * 0.5) * 0.18;
      const flare = anim.action === 'lash' ? (anim.actionK ?? 0) : 0;
      pupil.scale.setScalar(1 + flare * 0.9 + (anim.hurt ? 0.7 : 0) + Math.sin(t * 2.3) * 0.06);
      for (const td of tendrils) {
        td.segs.forEach((s, k) => {
          s.rotation.x = Math.sin(t * 2.6 + td.phase + k * 0.7) * (0.14 + k * 0.09) - flare * (0.9 - k * 0.2);
          s.rotation.y = Math.cos(t * 2.1 + td.phase + k * 0.5) * (0.12 + k * 0.07);
        });
      }
      if (anim.hurt) core.rotation.z = Math.sin(t * 42) * 0.16; else core.rotation.z *= 0.85;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// LOW GRADE 3 — FLESH-EATER : a lamprey mouth on a boneless sack
// ===========================================================================
// "A group of grade 3 or lower cursed spirits that work together to SUCK A
// PERSON'S FLESH APART." Built as a boneless crawler that is mostly a circular
// rasping mouth — no eyes, no limbs worth the name, and it moves by peristalsis.
export function buildFleshEater() {
  const g = new THREE.Group();
  const H = 0.62;
  const hide = skin(fleshTex('eater', {
    base: '#8a8f74', blotchA: '#5f6450', blotchB: '#9aa07e', seam: '#4a3a30', seams: 4, veins: 16
  }));
  const gum = skin(fleshTex('eaterGum', {
    base: '#8e3a48', blotchA: '#6a2632', blotchB: '#a8505e', seam: '#4a1820', seams: 0, veins: 20
  }), { gloss: 0.5 });
  const tooth = boneMat(maskTex('eaterTooth', { base: '#cfc6b0', crack: '#9a9078', stain: '#b0a68c' }));

  // a segmented sack, thicker at the front
  const segs = [];
  let host = joint(g, 0, H * 0.30, 0);
  for (let i = 0; i < 5; i++) {
    const k = i / 4;
    const r = H * (0.30 - k * 0.13);
    part(host, blob(r, r * 0.86, H * 0.20, 11), hide, { uvScale: [2, 1], uvOffset: [0, i * 0.25] });
    const next = joint(host, 0, -H * 0.02, -H * 0.28);
    segs.push(next);
    host = next;
  }
  // THE MOUTH: a ring of rasping teeth on a funnel, facing forward. It has no
  // jaw — it does not bite, it attaches.
  const mouth = joint(g, 0, H * 0.30, H * 0.28);
  part(mouth, tGeo(blob(H * 0.26, H * 0.26, H * 0.10, 14), {}), gum, { outline: true, thickness: 0.009 });
  const throat = new THREE.Mesh(new THREE.SphereGeometry(H * 0.18, 12, 10), voidMat(0x2a0c14));
  throat.scale.set(1, 1, 0.6);
  throat.position.z = -H * 0.02;
  mouth.add(throat);
  const rings = [];
  for (let r = 0; r < 3; r++) {
    const ring = joint(mouth, 0, 0, H * (0.02 - r * 0.05));
    const n = 9 + r * 2;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = H * (0.20 - r * 0.05);
      part(ring, tGeo(coneSpike(H * 0.020, H * 0.075, v3(0, 0, 0), { radial: 4, hSeg: 2 }),
        { rot: [80 + Math.sin(a) * 8, 0, 0], pos: [Math.cos(a) * rad, Math.sin(a) * rad, 0] }), tooth, { uv: 'cylY' });
    }
    rings.push(ring);
  }

  const model = {
    group: g, height: H * 0.8, radius: H * 0.5,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt * (2.0 + (anim.speed ?? 0) * 0.7);
      const t = this._t;
      // PERISTALSIS: a bulge travels down the body from the mouth backwards,
      // which is how a thing with no legs actually moves and reads instantly
      // as wrong next to everything else on the field.
      segs.forEach((s, i) => {
        const w = Math.sin(t * 3 - i * 1.1);
        s.scale.set(1 + w * 0.16, 1 + w * 0.16, 1 - w * 0.10);
        s.rotation.y = Math.sin(t * 1.4 - i * 0.6) * 0.14;
      });
      const feed = anim.action === 'bite' ? (anim.actionK ?? 0) : 0;
      // the tooth rings counter-rotate — the rasping motion
      rings.forEach((r, i) => { r.rotation.z += dt * (i % 2 ? 3 : -3) * (0.4 + feed * 3); });
      mouth.scale.setScalar(1 + feed * 0.35 + Math.sin(t * 2.4) * 0.05);
      mouth.rotation.x = Math.sin(t * 1.2) * 0.14;
      g.position.y = Math.abs(Math.sin(t * 2)) * H * 0.05;
      if (anim.hurt) g.rotation.z = Math.sin(t * 40) * 0.15; else g.rotation.z *= 0.85;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// MID GRADE 1 — KO-GUY 蝗 : the grasshopper, six limbs, two of them legs
// ===========================================================================
export function buildKoGuy() {
  const g = new THREE.Group();
  const H = 1.9;
  const shell = scaleMat(chitinTex('koguy', {
    base: '#3f5c22', plate: '#5d8130', rim: '#9ec44a', bands: 14
  }), { rimColor: CURSE_RIM, rim: 0.46, rimStart: 0.58, gloss: 0.45 });
  const shellDk = scaleMat(chitinTex('koguyDk', {
    base: '#26380f', plate: '#3a5220', rim: '#6f8f34', bands: 10
  }), { rimColor: CURSE_RIM, rim: 0.44, rimStart: 0.60, gloss: 0.4 });
  const tooth = boneMat(maskTex('koTooth', { base: '#ded2b4', crack: '#a89a7c', stain: '#c0b28c' }));

  const root = joint(g, 0, H * 0.52, 0);
  // the thorax, held near-horizontal the way a grasshopper's is
  const thorax = joint(root, 0, 0, 0);
  thorax.rotation.x = -0.30;
  part(thorax, blob(H * 0.13, H * 0.14, H * 0.17, 13), shell, { outline: true, thickness: 0.013, uvScale: [2, 2] });
  // THE ABDOMEN — segmented, and it EXPANDS to stab, which is canon
  const abdomen = [];
  let host = joint(thorax, 0, -H * 0.02, -H * 0.14);
  for (let i = 0; i < 4; i++) {
    const k = i / 3;
    part(host, blob(H * (0.115 - k * 0.045), H * (0.11 - k * 0.045), H * 0.09, 11), shellDk,
      { uvScale: [2, 1], uvOffset: [0, i * 0.25] });
    host = joint(host, 0, -H * 0.008, -H * 0.13);
    abdomen.push(host);
  }
  // the ovipositor spike at the tip
  part(host, tGeo(coneSpike(H * 0.032, H * 0.22, v3(0, 0, -H * 0.05), { radial: 5, hSeg: 3 }), { rot: [-96, 0, 0] }),
    tooth, { uv: 'cylY' });

  // THE HEAD — a grasshopper's, with a HUMANOID MOUTH and jagged teeth, which
  // is the detail that makes him unsettling rather than merely large
  const neck = joint(thorax, 0, H * 0.06, H * 0.15);
  const head = joint(neck, 0, H * 0.02, H * 0.08);
  head.rotation.x = 0.32;
  part(head, blob(H * 0.085, H * 0.095, H * 0.13, 12), shell, { outline: true, thickness: 0.011, uvScale: [2, 2] });
  const jaw = joint(head, 0, -H * 0.055, H * 0.05);
  part(jaw, tGeo(blob(H * 0.070, H * 0.035, H * 0.075, 10), { pos: [0, 0, H * 0.04] }), shellDk);
  const maw = new THREE.Mesh(new THREE.CircleGeometry(H * 0.055, 12), voidMat(0x120c06));
  maw.position.set(0, H * 0.012, H * 0.05);
  maw.rotation.x = -1.35;
  jaw.add(maw);
  for (let i = -2; i <= 2; i++) {
    part(jaw, tGeo(coneSpike(H * 0.014, H * 0.045, v3(), { radial: 4, hSeg: 2 }),
      { rot: [176, 0, rand(-14, 14)], pos: [i * H * 0.024, H * 0.028, H * 0.085] }), tooth, { uv: 'cylY' });
    part(head, tGeo(coneSpike(H * 0.012, H * 0.038, v3(), { radial: 4, hSeg: 2 }),
      { rot: [4, 0, rand(-14, 14)], pos: [i * H * 0.024, -H * 0.075, H * 0.10] }), tooth, { uv: 'cylY' });
  }
  // YELLOW BULGING EYES, oversized and set high on the skull
  const eyes = [];
  for (const s of [1, -1]) {
    eyes.push(cursedEye(head, H * 0.048, { pos: [s * H * 0.075, H * 0.045, H * 0.05], iris: 0xe8d020 }));
  }
  // antennae
  const antennae = [];
  for (const s of [1, -1]) {
    const a = joint(head, s * H * 0.035, H * 0.085, H * 0.06);
    a.rotation.set(-0.5, 0, s * 0.4);
    part(a, tubeBetween(v3(0, 0, 0), v3(s * H * 0.10, H * 0.34, H * 0.06), [H * 0.010, H * 0.004], { radial: 4, hSeg: 3 }),
      shellDk, { uv: 'cylY' });
    antennae.push(a);
  }

  // SIX LIMBS: TWO to stand on (the big jumping legs) and FOUR as arms, which
  // is exactly what the reference says and is the whole silhouette.
  const arms = [];
  for (const s of [1, -1]) {
    for (let i = 0; i < 2; i++) {
      const sh = joint(thorax, s * H * 0.11, H * (0.02 - i * 0.06), H * (0.06 - i * 0.05));
      sh.rotation.z = s * (0.7 + i * 0.25);
      part(sh, tubeBetween(v3(0, 0, 0), v3(s * H * 0.05, -H * 0.17, 0), [H * 0.026, H * 0.019], { radial: 6, hSeg: 2 }),
        shell, { uv: 'cylY' });
      const el = joint(sh, s * H * 0.05, -H * 0.17, 0);
      part(el, tubeBetween(v3(0, 0, 0), v3(0, -H * 0.15, H * 0.03), [H * 0.019, H * 0.013], { radial: 5, hSeg: 2 }),
        shellDk, { uv: 'cylY' });
      const cl = joint(el, 0, -H * 0.15, H * 0.03);
      for (let f = -1; f <= 1; f += 2) {
        part(cl, tGeo(coneSpike(H * 0.010, H * 0.055, v3(0, 0, H * 0.02), { radial: 4, hSeg: 2 }),
          { rot: [100, 0, f * 20], pos: [f * H * 0.012, 0, 0] }), tooth, { uv: 'cylY' });
      }
      arms.push({ sh, el, cl, side: s, idx: i });
    }
  }
  const legs = [];
  for (const s of [1, -1]) {
    const hip = joint(root, s * H * 0.085, -H * 0.06, -H * 0.04);
    // the femur, thick and angled back and UP — the jumping leg's signature
    // upside-down-V
    part(hip, tubeBetween(v3(0, 0, 0), v3(s * H * 0.05, H * 0.13, -H * 0.20), [H * 0.055, H * 0.030], { radial: 7, hSeg: 3 }),
      shell, { outline: true, thickness: 0.011, uv: 'cylY' });
    const knee = joint(hip, s * H * 0.05, H * 0.13, -H * 0.20);
    part(knee, tubeBetween(v3(0, 0, 0), v3(0, -H * 0.32, H * 0.06), [H * 0.024, H * 0.014], { radial: 6, hSeg: 3 }),
      shellDk, { uv: 'cylY' });
    const foot = joint(knee, 0, -H * 0.32, H * 0.06);
    part(foot, tGeo(blob(H * 0.026, H * 0.016, H * 0.075, 8), { pos: [0, -H * 0.010, H * 0.02] }), shellDk);
    legs.push({ hip, knee, foot, side: s });
  }

  const model = {
    group: g, height: H * 0.95, radius: H * 0.22,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      const sp = anim.speed ?? 0;
      // IT HOPS, it does not walk. Canon calls out "enhanced jumping", and a
      // bipedal insect that strides would read as a man in a costume.
      this._hop = sp > 0.4 ? (this._hop ?? 0) + dt * (4.5 + sp * 0.5) : 0;
      const h = this._hop > 0 ? Math.max(0, Math.sin(this._hop)) : 0;
      root.position.y = H * 0.52 + h * H * 0.30;
      for (const L of legs) {
        L.hip.rotation.x = -0.2 + h * 0.9;
        L.knee.rotation.x = 0.5 - h * 1.3;
        L.foot.rotation.x = -0.3 + h * 0.7;
      }
      thorax.rotation.x = -0.30 - h * 0.25;
      // the four arms saw at the air constantly and out of phase
      const spit = anim.action === 'spit' ? (anim.actionK ?? 0) : 0;
      const bite = anim.action === 'bite' ? (anim.actionK ?? 0) : 0;
      arms.forEach((A, i) => {
        A.sh.rotation.x = Math.sin(t * 3.4 + i * 1.6) * 0.4 - Math.max(bite, spit) * 0.9;
        A.el.rotation.x = -0.5 + Math.sin(t * 4.1 + i * 1.2) * 0.35;
        A.cl.rotation.x = Math.sin(t * 5.2 + i) * 0.4;
      });
      // the abdomen pumps, and EXTENDS on the stab
      abdomen.forEach((a, i) => {
        a.position.z = -H * 0.13 * (1 + bite * 0.55);
        a.rotation.x = Math.sin(t * 2.2 - i * 0.5) * 0.06 + bite * 0.18;
      });
      jaw.rotation.x = 0.06 + Math.max(bite * 0.9, spit * 0.75) + Math.sin(t * 1.8) * 0.05;
      head.rotation.y = Math.sin(t * 0.9) * 0.22 * (1 - spit);
      antennae.forEach((a, i) => {
        a.rotation.x = -0.5 + Math.sin(t * 2.6 + i * 1.1) * 0.25;
        a.rotation.z = (i ? -1 : 1) * (0.4 + Math.sin(t * 2.1 + i) * 0.18);
      });
      eyes.forEach((e, i) => { e.group.rotation.y = Math.sin(t * 0.7 + i) * 0.2; });
      if (anim.hurt) thorax.rotation.z = Math.sin(t * 38) * 0.14; else thorax.rotation.z *= 0.85;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// MID GRADE 2 — FUNGUS CURSE 茸 : a stalk of heads that grabs and kisses
// ===========================================================================
export function buildFungusHead() {
  const g = new THREE.Group();
  const H = 2.35;
  const stalk = skin(fleshTex('fungusStalk', {
    base: '#c8bda6', blotchA: '#9a8e78', blotchB: '#8a7f6a', seam: '#5a4a3c', seams: 2, veins: 14
  }));
  const cap = skin(membraneTex('fungusCap', {
    base: '#7a4a68', rib: '#4a2840', edge: '#a06a90', ribs: 14
  }), { gloss: 0.4 });
  const lips = skin(fleshTex('fungusLip', {
    base: '#a8506a', blotchA: '#7a3448', blotchB: '#c0708a', seam: '#5a1c30', seams: 0, veins: 18
  }), { gloss: 0.55 });

  // THE FUNGUS BASE — a fat bulbous foot with a skirt of gills, which is what
  // makes it read as a mushroom rather than as a tree
  const base = joint(g, 0, H * 0.14, 0);
  part(base, blob(H * 0.19, H * 0.14, H * 0.19, 14), stalk, { outline: true, thickness: 0.014, uvScale: [2, 2] });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    part(base, tGeo(blob(H * 0.045, H * 0.06, H * 0.10, 8),
      { pos: [Math.cos(a) * H * 0.17, -H * 0.02, Math.sin(a) * H * 0.17], rot: [0, -a * 57.3, 0] }), cap);
  }
  // the stalk: four links so it can sway and lean toward a target
  const links = [];
  let host = joint(base, 0, H * 0.10, 0);
  for (let i = 0; i < 4; i++) {
    const k = i / 3;
    part(host, tubeBetween(v3(0, 0, 0), v3(0, H * 0.16, 0), [H * (0.085 - k * 0.018), H * (0.078 - k * 0.018)],
      { radial: 9, hSeg: 2 }), stalk, { uv: 'cylY', uvScale: [2, 1] });
    host = joint(host, 0, H * 0.16, 0);
    links.push(host);
  }

  // SEVERAL HEADS on top, one much larger than the rest. Each is a lipped
  // pucker on a short neck; the big one is THE KISS.
  const heads = [];
  const crown = host;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    const big = i === 0;
    const hj = joint(crown, Math.cos(a) * H * (big ? 0 : 0.09), H * (big ? 0.13 : 0.06), Math.sin(a) * H * (big ? 0 : 0.09));
    hj.rotation.set(big ? 0.2 : 0.55, -a, 0);
    const r = H * (big ? 0.11 : 0.055);
    part(hj, blob(r, r * 1.1, r, 12), stalk, { outline: big, thickness: 0.011, uvScale: [2, 2] });
    // eyes, of a sort — pits, not eyeballs, except on the big one
    if (big) {
      for (const s of [1, -1]) cursedEye(hj, r * 0.26, { pos: [s * r * 0.42, r * 0.32, r * 0.72], iris: 0xb0d060 });
    } else {
      for (const s of [1, -1]) {
        const pit = new THREE.Mesh(new THREE.CircleGeometry(r * 0.20, 8), voidMat(0x1a1410));
        pit.position.set(s * r * 0.40, r * 0.28, r * 0.90);
        hj.add(pit);
      }
    }
    // THE LIPS — a puckered ring, and on the big head they are enormous
    const lipJ = joint(hj, 0, -r * 0.24, r * 0.80);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.42, r * 0.16, 8, 16), lips);
    ring.scale.set(1, 1, 0.6);
    lipJ.add(ring);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(r * 0.32, 12), voidMat(0x2a0e18));
    hole.position.z = r * 0.06;
    lipJ.add(hole);
    heads.push({ hj, lipJ, big, phase: i * 1.3, r });
  }

  // THE GRASPING TENDRILS, which are what actually captures a target — the
  // heads only arrive afterwards
  const arms = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.7;
    const root = joint(links[1], Math.cos(a) * H * 0.06, 0, Math.sin(a) * H * 0.06);
    root.rotation.set(0.5, -a, 0);
    let hostA = root;
    const segs = [];
    for (let k = 0; k < 4; k++) {
      part(hostA, tubeBetween(v3(0, 0, 0), v3(0, 0, H * 0.16), [H * (0.026 - k * 0.005), H * (0.022 - k * 0.005)],
        { radial: 5, hSeg: 2 }), lips, { uv: 'cylZ' });
      hostA = joint(hostA, 0, 0, H * 0.16);
      segs.push(hostA);
    }
    arms.push({ segs, phase: i * 1.1 });
  }

  const model = {
    group: g, height: H, radius: H * 0.22,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      const grab = anim.action === 'grab' ? (anim.actionK ?? 0) : 0;
      // it does not walk so much as LEAN — the whole stalk bends toward what
      // it wants and the base barely moves
      links.forEach((l, i) => {
        l.rotation.x = Math.sin(t * 0.9 - i * 0.4) * (0.05 + i * 0.02) + grab * (0.10 + i * 0.05);
        l.rotation.z = Math.cos(t * 0.7 - i * 0.35) * (0.04 + i * 0.02);
      });
      base.position.y = H * 0.14 + Math.sin(t * 1.3) * H * 0.008;
      heads.forEach(hd => {
        hd.hj.rotation.y = -hd.phase + Math.sin(t * 1.1 + hd.phase) * 0.30;
        hd.hj.rotation.x = (hd.big ? 0.2 : 0.55) + Math.sin(t * 1.5 + hd.phase) * 0.14 - grab * (hd.big ? 0.35 : 0.1);
        // THE KISS: the big head's lips push out and pucker on the grab
        const pucker = hd.big ? grab : grab * 0.25;
        hd.lipJ.scale.set(1 + pucker * 0.5, 1 + pucker * 0.5, 1 + pucker * 1.6);
        hd.lipJ.position.z = hd.r * (0.80 + pucker * 0.5);
      });
      for (const A of arms) {
        A.segs.forEach((s, k) => {
          s.rotation.x = Math.sin(t * 1.8 + A.phase + k * 0.6) * (0.12 + k * 0.06) - grab * (0.35 - k * 0.05);
          s.rotation.y = Math.cos(t * 1.5 + A.phase + k * 0.5) * (0.14 + k * 0.07) + grab * 0.2;
        });
      }
      if (anim.hurt) base.rotation.z = Math.sin(t * 36) * 0.10; else base.rotation.z *= 0.85;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// MID GRADE 3 — DARUMA 達磨 : a large blue daruma doll that crushes
// ===========================================================================
// "A LARGE BLUE DARUMA DOLL cursed spirit summoned by Suguru to CRUSH Shigeru
// Sonoda to death." Built as an actual daruma: a limbless weighted ovoid with
// a painted face, a beard, and — the detail that makes a daruma a daruma — ONE
// EYE FILLED IN AND ONE BLANK. On this one the blank eye is a hole.
export function buildDaruma() {
  const g = new THREE.Group();
  const H = 2.0;
  const lacquer = skin(fleshTex('daruma', {
    base: '#2e4a86', blotchA: '#1c3260', blotchB: '#42639f', seam: '#101c38', seams: 3, veins: 8,
    bloom: '#6b2fa0'
  }), { rim: 0.55, rimStart: 0.56, gloss: 0.6 });
  const face = skin(fleshTex('darumaFace', {
    base: '#d8cdb6', blotchA: '#ab9f88', blotchB: '#bfb096', seam: '#6a5a48', seams: 2, veins: 10
  }));
  const hair = pelt(fleshTex('darumaHair', {
    base: '#1a1620', blotchA: '#0e0c12', blotchB: '#2c2634', seam: '#0a080e', seams: 0, veins: 6
  }), { rimColor: CURSE_RIM });

  // THE BODY: a weighted ovoid, wider than tall. It has no limbs at all, which
  // is what makes it read as an object rather than as a creature.
  const bodyJ = joint(g, 0, H * 0.40, 0);
  part(bodyJ, blob(H * 0.40, H * 0.42, H * 0.38, 18), lacquer, { outline: true, thickness: 0.018, uvScale: [2, 2] });
  // the gold-leaf collar band across the belly
  part(bodyJ, tGeo(blob(H * 0.402, H * 0.055, H * 0.382, 16), { pos: [0, -H * 0.18, 0] }), face, { uvScale: [3, 1] });

  // THE FACE: a pale plate sunk into the front
  const faceJ = joint(bodyJ, 0, H * 0.06, H * 0.30);
  part(faceJ, tGeo(blob(H * 0.24, H * 0.26, H * 0.09, 14), {}), face, { outline: true, thickness: 0.011 });
  // the moustache and beard, painted in the daruma's heavy black strokes
  part(faceJ, tGeo(blob(H * 0.14, H * 0.035, H * 0.05, 10), { pos: [0, -H * 0.055, H * 0.075] }), hair);
  for (const s of [1, -1]) {
    part(faceJ, tGeo(blob(H * 0.075, H * 0.10, H * 0.045, 10),
      { pos: [s * H * 0.10, -H * 0.13, H * 0.055], rot: [0, 0, s * 20] }), hair);
    // the heavy painted brow
    part(faceJ, tGeo(blob(H * 0.085, H * 0.030, H * 0.045, 10),
      { pos: [s * H * 0.095, H * 0.105, H * 0.070], rot: [0, 0, -s * 12] }), hair);
  }
  // ONE EYE PAINTED IN, ONE LEFT BLANK — the daruma tradition, and here the
  // blank one is a hole straight through into the dark inside.
  const eye = cursedEye(faceJ, H * 0.055, { pos: [H * 0.095, H * 0.045, H * 0.085], iris: 0xe8d84c });
  const hollow = new THREE.Mesh(new THREE.SphereGeometry(H * 0.058, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    voidMat(0x0a0812));
  hollow.rotation.x = Math.PI / 2;
  hollow.position.set(-H * 0.095, H * 0.045, H * 0.075);
  faceJ.add(hollow);
  // a mouth, straight and grim
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(H * 0.10, H * 0.022), voidMat(0x120c14));
  mouth.position.set(0, -H * 0.085, H * 0.092);
  faceJ.add(mouth);

  const model = {
    group: g, height: H * 0.85, radius: H * 0.42,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      const sp = anim.speed ?? 0;
      // IT ROCKS. A daruma is a roly-poly — weighted at the bottom so it always
      // rights itself — and that is the whole animation: it never lifts, it
      // never steps, it tips and comes back. Moving means rocking harder.
      const rock = 0.10 + Math.min(0.30, sp * 0.06);
      bodyJ.rotation.z = Math.sin(t * (2.2 + sp * 0.4)) * rock;
      bodyJ.rotation.x = Math.sin(t * (1.7 + sp * 0.3) + 1) * rock * 0.6;
      // the CRUSH: it rears back and drops its whole mass forward
      const slam = anim.action === 'slam' ? (anim.actionK ?? 0) : 0;
      bodyJ.position.y = H * 0.40 + Math.sin(slam * Math.PI) * H * 0.55;
      bodyJ.rotation.x -= Math.sin(slam * Math.PI) * 0.5;
      // the painted eye tracks; the hollow one never does
      eye.group.rotation.y = Math.sin(t * 0.8) * 0.24;
      eye.pupil.scale.setScalar(1 + slam * 0.6);
      if (anim.hurt) bodyJ.rotation.z += Math.sin(t * 44) * 0.10;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// MID GRADE 4 — PILLAR CURSE 光柱 : points two fingers up, light comes down
// ===========================================================================
export function buildPillarCurse() {
  const g = new THREE.Group();
  const H = 2.2;
  const robeTex = membraneTex('pillarRobe', { base: '#4a4458', rib: '#2a2434', edge: '#6f6484', ribs: 13 });
  const robe = skin(robeTex, { rim: 0.5, rimStart: 0.58 });
  const meat = skin(fleshTex('pillarFlesh', {
    base: '#b9aec0', blotchA: '#8e8298', blotchB: '#a294ac', seam: '#5a4a5e', seams: 3, veins: 14
  }));

  // A TALL, THIN, ROBED SILHOUETTE. It barely moves and it does not close the
  // distance — everything about the build says "this thing is a turret".
  const root = joint(g, 0, H * 0.50, 0);
  // the robe is a single tapering cone from the shoulders to the floor: no
  // legs are ever visible, which is what makes it read as gliding
  part(root, tubeBetween(v3(0, -H * 0.50, 0), v3(0, H * 0.22, 0), [H * 0.24, H * 0.13], { radial: 12, hSeg: 4 }),
    robe, { outline: true, thickness: 0.014, uv: 'cylY', uvScale: [2, 2] });
  const torso = joint(root, 0, H * 0.22, 0);
  part(torso, blob(H * 0.13, H * 0.10, H * 0.10, 12), meat, { uvScale: [2, 2] });
  // a hood with nothing in it but eyes
  const head = joint(torso, 0, H * 0.10, 0);
  part(head, tubeBetween(v3(0, 0, 0), v3(0, H * 0.16, 0), [H * 0.095, H * 0.055], { radial: 10, hSeg: 3 }),
    robe, { uv: 'cylY' });
  const dark = new THREE.Mesh(new THREE.SphereGeometry(H * 0.075, 12, 10), voidMat(0x0e0a14));
  dark.position.set(0, H * 0.04, H * 0.02);
  head.add(dark);
  const eyes = [];
  for (let i = 0; i < 4; i++) {
    const a = (i - 1.5) * 0.42;
    eyes.push(cursedEye(head, H * 0.020, {
      pos: [Math.sin(a) * H * 0.055, H * (0.03 + (i % 2) * 0.035), H * 0.058], iris: 0xd8e8ff
    }));
  }

  // THE ARMS, and they exist entirely to make the gesture: index and middle
  // finger extended, raised straight up.
  const arms = [];
  for (const s of [1, -1]) {
    const sh = joint(torso, s * H * 0.12, H * 0.04, 0);
    part(sh, tubeBetween(v3(0, 0, 0), v3(s * H * 0.04, -H * 0.20, 0), [H * 0.035, H * 0.026], { radial: 6, hSeg: 3 }),
      robe, { uv: 'cylY' });
    const el = joint(sh, s * H * 0.04, -H * 0.20, 0);
    part(el, tubeBetween(v3(0, 0, 0), v3(0, -H * 0.18, H * 0.02), [H * 0.026, H * 0.020], { radial: 5, hSeg: 3 }),
      meat, { uv: 'cylY' });
    const wr = joint(el, 0, -H * 0.18, H * 0.02);
    part(wr, tGeo(blob(H * 0.030, H * 0.020, H * 0.032, 9), { pos: [0, -H * 0.014, 0] }), meat);
    // TWO FINGERS UP, three folded — the canon gesture, built as geometry so it
    // is legible from the front at fighting distance
    const fingers = [];
    for (let f = 0; f < 2; f++) {
      const fj = joint(wr, (f - 0.5) * H * 0.020, -H * 0.024, H * 0.012);
      part(fj, tubeBetween(v3(0, 0, 0), v3(0, -H * 0.070, 0), [H * 0.008, H * 0.006], { radial: 4, hSeg: 2 }),
        meat, { uv: 'cylY' });
      fingers.push(fj);
    }
    for (let f = 0; f < 3; f++) {
      part(wr, tGeo(blob(H * 0.008, H * 0.016, H * 0.010, 6),
        { pos: [(f - 1) * H * 0.018, -H * 0.030, -H * 0.014] }), meat);
    }
    arms.push({ sh, el, wr, fingers, side: s });
  }

  // THE LIGHT. Two beams standing on the fingertips while it charges, so the
  // telegraph is unmissable and the counterplay ("leave") is available.
  const beams = [];
  for (const A of arms) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.030, H * 0.010, H * 1.2, 10, 1, true),
      glow(0xdfe8ff, 0));
    b.position.y = H * 0.62;
    A.wr.add(b);
    beams.push(b);
  }

  const model = {
    group: g, height: H, radius: H * 0.24,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      const aim = anim.action === 'aim' ? (anim.actionK ?? 0) : 0;
      // it hovers a hand's breadth off the floor and rotates rather than turns
      g.position.y = Math.sin(t * 1.1) * H * 0.02;
      root.rotation.z = Math.sin(t * 0.8) * 0.03;
      torso.rotation.x = -aim * 0.18;
      head.rotation.x = Math.sin(t * 0.6) * 0.06 - aim * 0.25;
      arms.forEach((A, i) => {
        // both arms come up together into the gesture; at rest they hang
        A.sh.rotation.x = 0.06 + Math.sin(t * 0.9 + i) * 0.05 - aim * 3.05;
        A.sh.rotation.z = A.side * (0.10 + aim * 0.24);
        A.el.rotation.x = -0.12 - aim * 0.10;
        for (const f of A.fingers) f.rotation.x = -aim * 0.12;
      });
      beams.forEach((b, i) => {
        b.material.opacity = aim * (0.45 + Math.sin(t * 18 + i * 2) * 0.18);
        b.scale.set(0.5 + aim, 1, 0.5 + aim);
      });
      eyes.forEach((e, i) => { e.pupil.scale.setScalar(1 + aim * 1.2 + Math.sin(t * 3 + i) * 0.1); });
      if (anim.hurt) torso.rotation.z = Math.sin(t * 40) * 0.14; else torso.rotation.z *= 0.85;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// SPECIAL GRADE 1 — THE MANTA RAY : the flying curse he travels on
// ===========================================================================
// "A flying curse with an appearance similar to an AQUATIC STING-RAY. It is
// capable of LEVITATING and has enough size to SUPPORT SUGURU AND ONE OTHER
// PERSON." So it is built at genuine carrying size — a 6 m wingspan — with a
// flat dorsal surface a person could stand on, cephalic lobes at the front, a
// pale underside, and a long whip tail.
export function buildMantaRay() {
  const g = new THREE.Group();
  const S = 3.0;                        // half-span, so the wingspan is 6 m

  // DORSAL: a drowned blue-grey, mottled the way a real ray is. VENTRAL: pale,
  // with the gill slits and the mouth — and the ventral face is the one an
  // opponent sees when it dives, so that is where the wrongness lives.
  const dorsalTex = membraneTex('mantaTop', { base: '#3c4a5e', rib: '#22303f', edge: '#5c7086', ribs: 15 });
  const dorsal = skin(dorsalTex, { rim: 0.48, rimStart: 0.58, gloss: 0.3 });
  const ventral = skin(fleshTex('mantaBelly', {
    base: '#cfcabc', blotchA: '#a09a8c', blotchB: '#b6ada0', seam: '#5a4a48', seams: 2, veins: 20
  }), { gloss: 0.35 });
  const glowMat = skin(energyTex('mantaGlow', { base: '#1c1030', hot: '#8a4ad0' }), { rim: 0.6, rimStart: 0.5 });

  const root = joint(g, 0, 2.4, 0);
  // THE DISC — a wide flattened diamond. Built as a centre body plus two wings
  // of three chord segments each, so the wings can undulate along the span the
  // way a ray's actually do.
  const core = joint(root, 0, 0, 0);
  part(core, tGeo(blob(0.16 * S, 0.045 * S, 0.30 * S, 16), {}), dorsal,
    { outline: true, thickness: 0.016, uv: 'planarXZ', uvScale: [2, 2] });
  part(core, tGeo(blob(0.155 * S, 0.022 * S, 0.29 * S, 14), { pos: [0, -0.026 * S, 0] }), ventral,
    { uv: 'planarXZ', uvScale: [2, 2] });

  // TWO LOFTED PANELS PER SIDE. The chord runs 0.86 S at the root down to
  // almost nothing at the tip and the trailing edge sweeps back as it goes,
  // which together give the swept-back diamond a manta actually has. Both
  // panels are lofted, so the leading edge is one unbroken curve.
  const wings = [];
  for (const s of [1, -1]) {
    const inner = joint(core, s * 0.14 * S, 0, 0);
    part(inner, loftWing([
      { x: 0, chord: 0.86 * S, thick: 0.055 * S, z: 0 },
      { x: s * 0.22 * S, chord: 0.80 * S, thick: 0.048 * S, z: -0.03 * S },
      { x: s * 0.44 * S, chord: 0.66 * S, thick: 0.036 * S, z: -0.09 * S }
    ]), dorsal, { uv: 'planarXZ', uvScale: [2, 2] });
    const outer = joint(inner, s * 0.44 * S, 0, -0.09 * S);
    part(outer, loftWing([
      { x: 0, chord: 0.66 * S, thick: 0.036 * S, z: 0 },
      { x: s * 0.20 * S, chord: 0.46 * S, thick: 0.024 * S, z: -0.07 * S },
      { x: s * 0.36 * S, chord: 0.24 * S, thick: 0.013 * S, z: -0.15 * S },
      { x: s * 0.46 * S, chord: 0.05 * S, thick: 0.005 * S, z: -0.22 * S }
    ]), dorsal, { uv: 'planarXZ', uvScale: [2, 2] });
    // the pale ventral face, a hair below the dorsal one
    const belly = joint(inner, 0, -0.006 * S, 0);
    part(belly, loftWing([
      { x: 0, chord: 0.80 * S, thick: 0.020 * S, z: 0 },
      { x: s * 0.22 * S, chord: 0.74 * S, thick: 0.017 * S, z: -0.03 * S },
      { x: s * 0.42 * S, chord: 0.60 * S, thick: 0.012 * S, z: -0.09 * S }
    ]), ventral, { uv: 'planarXZ', uvScale: [2, 2] });
    wings.push({ segs: [inner, outer], side: s });
  }

  // CEPHALIC LOBES — the two horns at the front of a manta's head. They are
  // the single most recognisable thing about the animal and the reason the
  // silhouette reads instantly.
  const lobes = [];
  for (const s of [1, -1]) {
    const lj = joint(core, s * 0.09 * S, 0.005 * S, 0.19 * S);
    part(lj, tubeBetween(v3(0, 0, 0), v3(s * 0.02 * S, -0.02 * S, 0.14 * S), [0.030 * S, 0.020 * S],
      { radial: 6, hSeg: 3 }), dorsal, { uv: 'cylZ' });
    lobes.push(lj);
  }
  // THE MOUTH — a wide letterbox slot on the leading edge, and inside it a
  // ring of human teeth, which is the wrong-anatomy tell that makes it a curse
  // rather than a fish.
  const mouth = joint(core, 0, -0.010 * S, 0.185 * S);
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.20 * S, 0.045 * S), voidMat(0x160a18));
  slot.rotation.x = -0.5;
  mouth.add(slot);
  const tooth = boneMat(maskTex('mantaTooth', { base: '#ded4c0', crack: '#a89a84', stain: '#c0b096' }));
  for (let i = -4; i <= 4; i++) {
    part(mouth, tGeo(roundBox(0.014 * S, 0.020 * S, 0.008 * S, 0.003),
      { pos: [i * 0.020 * S, 0.008 * S, 0.008 * S] }), tooth);
  }
  // gill slits along the underside
  for (const s of [1, -1]) {
    for (let i = 0; i < 5; i++) {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.012 * S, 0.055 * S), voidMat(0x241018));
      gl.position.set(s * (0.055 + i * 0.022) * S, -0.036 * S, 0.09 * S - i * 0.012 * S);
      gl.rotation.set(-Math.PI / 2, 0, s * 0.2);
      core.add(gl);
    }
  }
  // eyes on the sides of the head, where a ray's are
  for (const s of [1, -1]) {
    cursedEye(core, 0.030 * S, { pos: [s * 0.105 * S, 0, 0.155 * S], iris: 0x9ad0e0 });
  }
  // THE CURSED-ENERGY UNDERGLOW — the one thing that says "this is not an
  // animal". A violet bloom under the disc that brightens as it dives.
  const underglow = new THREE.Mesh(new THREE.CircleGeometry(0.34 * S, 26), glow(0x8a4ad0, 0.0));
  underglow.rotation.x = Math.PI / 2;
  underglow.position.y = -0.05 * S;
  core.add(underglow);

  // THE TAIL — long, thin, whip-like, with a barb
  const tailLinks = [];
  {
    let hostT = joint(core, 0, 0.005 * S, -0.20 * S);
    for (let i = 0; i < 7; i++) {
      part(hostT, tubeBetween(v3(0, 0, 0), v3(0, 0, -0.22 * S), [(0.022 - i * 0.0024) * S, (0.019 - i * 0.0022) * S],
        { radial: 5, hSeg: 2 }), dorsal, { uv: 'cylZ' });
      hostT = joint(hostT, 0, 0, -0.22 * S);
      tailLinks.push(hostT);
    }
    part(hostT, tGeo(coneSpike(0.020 * S, 0.20 * S, v3(), { radial: 5, hSeg: 3 }), { rot: [-90, 0, 0] }),
      glowMat, { uv: 'cylY' });
  }

  const model = {
    group: g, height: 2.9, radius: S * 0.9,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      const dive = anim.action === 'dive' ? (anim.actionK ?? 0) : 0;
      const carry = anim.carry ?? 0;
      // THE FLAP IS A TRAVELLING WAVE ALONG THE SPAN, not a hinge. Each wing
      // segment lags the one inboard of it, which is exactly how a ray flies
      // and is the only way this reads as swimming through air rather than as
      // a bird.
      const rate = 1.5 + dive * 3.0;
      for (const w of wings) {
        w.segs.forEach((sg, i) => {
          // the outboard panel lags the inboard one, which is the whole trick:
          // the wave travels out along the span rather than the wing hinging
          const ph = t * rate - i * 0.9;
          sg.rotation.z = w.side * (Math.sin(ph) * (0.16 + i * 0.26) - dive * 0.30);
          sg.rotation.x = Math.sin(ph - 0.4) * 0.04;
        });
      }
      // altitude: it cruises high, drops to carrying height, and dives to deck
      const cruise = 2.4 - carry * 1.1;
      root.position.y = cruise + Math.sin(t * 1.2) * 0.22 - dive * 2.0;
      core.rotation.x = 0.04 + Math.sin(t * 1.2) * 0.05 + dive * 0.85;
      core.rotation.z = Math.sin(t * 0.7) * 0.07 * (1 - dive);
      lobes.forEach((l, i) => {
        // the lobes curl in through a dive and unroll at rest
        l.rotation.x = 0.1 + Math.sin(t * 1.6 + i) * 0.10 + dive * 0.9;
        l.rotation.y = (i ? 1 : -1) * (0.10 + dive * 0.5);
      });
      underglow.material.opacity = 0.10 + dive * 0.45 + carry * 0.2 + Math.sin(t * 3) * 0.04;
      underglow.scale.setScalar(1 + dive * 0.2);
      tailLinks.forEach((l, i) => {
        l.rotation.y = Math.sin(t * 1.1 - i * 0.5) * (0.06 + i * 0.05);
        l.rotation.x = 0.02 + Math.cos(t * 0.9 - i * 0.4) * (0.05 + i * 0.03) - dive * 0.08;
      });
      if (anim.hurt) core.rotation.z += Math.sin(t * 34) * 0.18;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// SPECIAL GRADE 2 — RAINBOW DRAGON 虹竜 : white eastern dragon, yellow eyes
// ===========================================================================
export function buildRainbowDragon() {
  const g = new THREE.Group();
  const S = 1.5;
  const LINKS = 14;

  // WHITE, and the hardest skin in the stable. The scale texture is pushed
  // toward pearl rather than bone so it reads as ARMOUR: tight rows, a hard
  // edge highlight, and real gloss, against the Great Serpent's matte white.
  const hide = scaleMat(scaleTex('dragon', {
    base: '#e6e2d8', edge: '#a8a49a', dark: '#6f6c64', rows: 26
  }), { rimColor: CURSE_RIM, rim: 0.52, rimStart: 0.58, gloss: 0.42 });
  const belly = scaleMat(scaleTex('dragonBelly', {
    base: '#cfc6ae', edge: '#a09880', dark: '#77705c', rows: 34
  }), { rimColor: CURSE_RIM, rim: 0.44, rimStart: 0.62, gloss: 0.3 });
  // THE RAINBOW. Its name is 虹竜 and there is nothing else in the reference to
  // hang that on, so it is a thin iridescent dorsal crest — a suggestion of
  // spectrum along the spine rather than a coloured dragon, which would fight
  // the "large WHITE Japanese dragon" the description actually gives.
  const crest = skin(energyTex('dragonCrest', { base: '#3a2a56', hot: '#c060d0' }), { rim: 0.6, rimStart: 0.5 });
  const horn = boneMat(maskTex('dragonHorn', { base: '#5a5448', crack: '#332f28', stain: '#7a7264' }));
  const maneMat = pelt(energyTex('dragonMane', { base: '#4a3a2a', hot: '#d0a060' }), { rimColor: CURSE_RIM });

  const root = joint(g, 0, 2.1, 0);
  const links = [];
  let host = root;
  for (let i = 0; i < LINKS; i++) {
    const k = i / (LINKS - 1);
    // a serpentine body that swells at the shoulders and tapers hard to the tail
    const r = (0.30 - Math.pow(k, 1.5) * 0.245) * S * (i < 3 ? 0.86 + i * 0.05 : 1);
    part(host, tubeBetween(v3(0, 0, 0), v3(0, 0, -0.42 * S), [r, r * 0.94], { radial: 11, hSeg: 2 }),
      hide, { outline: i % 5 === 0, thickness: 0.013, uv: 'cylZ', uvScale: [1, 0.28], uvOffset: [0, i * 0.28] });
    part(host, tGeo(blob(r * 0.66, r * 0.28, 0.21 * S, 8), { pos: [0, -r * 0.74, -0.21 * S] }), belly);
    // the dorsal crest — a low fin running the whole length
    part(host, tGeo(coneSpike(r * 0.30, r * 0.75, v3(0, 0, -0.10 * S), { radial: 4, hSeg: 2, zScale: 0.22 }),
      { pos: [0, r * 0.72, -0.15 * S] }), crest, { uv: 'cylY' });
    const next = joint(host, 0, 0, -0.42 * S);
    links.push(next);
    host = next;
  }

  // FOUR SHORT CLAWED LEGS, at the shoulders and hips of the serpent body,
  // which is what makes an eastern dragon an eastern dragon
  const legs = [];
  for (const [li, sgn] of [[2, 1], [2, -1], [7, 1], [7, -1]]) {
    const anchor = links[li];
    const hip = joint(anchor, sgn * 0.12 * S, -0.05 * S, 0.10 * S);
    hip.rotation.z = sgn * 0.9;
    part(hip, tubeBetween(v3(0, 0, 0), v3(sgn * 0.10 * S, -0.20 * S, 0), [0.045 * S, 0.032 * S], { radial: 6, hSeg: 2 }),
      hide, { uv: 'cylY' });
    const knee = joint(hip, sgn * 0.10 * S, -0.20 * S, 0);
    part(knee, tubeBetween(v3(0, 0, 0), v3(0, -0.16 * S, 0.04 * S), [0.032 * S, 0.026 * S], { radial: 5, hSeg: 2 }),
      hide, { uv: 'cylY' });
    const foot = joint(knee, 0, -0.16 * S, 0.04 * S);
    for (let i = -1; i <= 1; i++) {
      part(foot, tGeo(coneSpike(0.014 * S, 0.075 * S, v3(0, 0, 0.02 * S), { radial: 4, hSeg: 2 }),
        { rot: [104, 0, 0], pos: [i * 0.024 * S, 0, 0.012 * S] }), horn, { uv: 'cylY' });
    }
    legs.push({ hip, knee, foot, side: sgn, phase: li });
  }

  // THE HEAD — long, blunt-snouted, BULGING YELLOW EYES, backswept antlers,
  // barbels, and a mane. Everything the description names and everything an
  // eastern dragon needs.
  const head = joint(root, 0, 0, 0.16 * S);
  part(head, tGeo(blob(0.24 * S, 0.21 * S, 0.34 * S, 14), { pos: [0, 0, 0.20 * S] }), hide,
    { outline: true, thickness: 0.012, uvScale: [2, 2] });
  part(head, tGeo(blob(0.15 * S, 0.12 * S, 0.19 * S, 11), { pos: [0, -0.03 * S, 0.46 * S] }), hide, { uvScale: [2, 2] });
  const jaw = joint(head, 0, -0.055 * S, 0.16 * S);
  part(jaw, tGeo(blob(0.10 * S, 0.045 * S, 0.19 * S, 11), { pos: [0, 0, 0.14 * S] }), belly);
  const maw = new THREE.Mesh(new THREE.CircleGeometry(0.10 * S, 12), voidMat(0x2a1218));
  maw.position.set(0, 0.012 * S, 0.16 * S);
  maw.rotation.x = -1.4;
  jaw.add(maw);
  for (let i = -3; i <= 3; i++) {
    part(jaw, tGeo(coneSpike(0.013 * S, 0.055 * S, v3(), { radial: 4, hSeg: 2 }),
      { rot: [176, 0, 0], pos: [i * 0.024 * S, 0.030 * S, 0.10 * S + Math.abs(i) * 0.012 * S] }), horn, { uv: 'cylY' });
  }
  for (const s of [1, -1]) {
    // BULGING YELLOW EYES — oversized, and mounted proud of the skull rather
    // than sunk into it, which is what "bulging" has to mean in geometry
    cursedEye(head, 0.055 * S, { pos: [s * 0.115 * S, 0.070 * S, 0.20 * S], iris: 0xf0d020 });
    // antlers, swept back
    const ant = joint(head, s * 0.075 * S, 0.11 * S, 0.02 * S);
    ant.rotation.set(-0.9, 0, s * 0.5);
    part(ant, tubeBetween(v3(0, 0, 0), v3(0, 0.26 * S, 0), [0.020 * S, 0.010 * S], { radial: 5, hSeg: 3 }),
      horn, { uv: 'cylY' });
    for (let i = 0; i < 3; i++) {
      const tine = joint(ant, 0, (0.09 + i * 0.07) * S, 0);
      tine.rotation.set(i % 2 ? 0.7 : -0.6, 0, s * 0.7);
      part(tine, tubeBetween(v3(0, 0, 0), v3(0, 0.10 * S, 0), [0.010 * S, 0.003 * S], { radial: 4, hSeg: 2 }),
        horn, { uv: 'cylY' });
    }
    // barbels off the snout
    const bar = joint(head, s * 0.055 * S, -0.03 * S, 0.40 * S);
    part(bar, tubeBetween(v3(0, 0, 0), v3(s * 0.10 * S, -0.04 * S, 0.30 * S), [0.012 * S, 0.004 * S],
      { radial: 4, hSeg: 3 }), maneMat, { uv: 'cylZ' });
  }
  // the mane — a ruff of fibrous spines behind the jaw
  const mane = [];
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.85 + (i / 8) * Math.PI * 1.7;
    const mj = joint(head, Math.sin(a) * 0.13 * S, 0.03 * S + Math.cos(a) * 0.05 * S, -0.02 * S);
    mj.rotation.set(-0.4, a, 0);
    part(mj, tGeo(coneSpike(0.030 * S, 0.28 * S, v3(0, 0, -0.10 * S), { radial: 4, hSeg: 2, zScale: 0.25 }), {}),
      maneMat, { uv: 'cylY' });
    mane.push(mj);
  }

  const model = {
    group: g, height: 3.2, radius: 1.6,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt * (1.3 + (anim.speed ?? 0) * 0.35);
      const t = this._t;
      const charge = anim.action === 'smash' ? (anim.actionK ?? 0) : 0;
      // IT SWIMS THROUGH THE AIR. A slow vertical undulation, not a lateral one
      // — that vertical wave is the whole difference between an eastern dragon
      // and Megumi's Great Serpent, which uses the same 16-link chain.
      links.forEach((l, i) => {
        const k = i / (LINKS - 1);
        l.rotation.x = Math.sin(t * 1.5 - i * 0.42) * (0.06 + 0.14 * k) * (1 - charge * 0.7);
        l.rotation.y = Math.cos(t * 0.9 - i * 0.30) * (0.05 + 0.12 * k) * (1 - charge * 0.6);
      });
      root.position.y = 2.1 + Math.sin(t * 1.1) * 0.30 - charge * 1.1;
      root.rotation.x = -charge * 0.28;
      // the legs paddle — they carry no weight, so they trail and grab at air
      legs.forEach(L => {
        L.hip.rotation.x = Math.sin(t * 1.8 + L.phase) * 0.34 - charge * 0.5;
        L.knee.rotation.x = -0.4 + Math.sin(t * 1.8 + L.phase - 0.6) * 0.28;
      });
      head.rotation.x = -0.08 + Math.sin(t * 1.3) * 0.09 + charge * 0.30;
      head.rotation.y = Math.sin(t * 0.8) * 0.16 * (1 - charge);
      jaw.rotation.x = 0.06 + (anim.action === 'bite'
        ? Math.sin((anim.actionK ?? 0) * Math.PI) * 0.85 : Math.sin(t * 0.9) * 0.05) + charge * 0.5;
      mane.forEach((mj, i) => { mj.rotation.x = -0.4 + Math.sin(t * 1.7 + i * 0.5) * 0.14 - charge * 0.3; });
      if (anim.hurt) head.rotation.x -= 0.3;
    }
  };
  return finishCurse(model);
}

// ===========================================================================
// SPECIAL GRADE 3 — THE HOOKWORM : erupts from the ground and swallows
// ===========================================================================
// "A GIANT MAN-EATING HOOKWORM-LIKE curse with SHARP TEETH with innards large
// enough to CAPTURE AND SWALLOW large curses... It always APPEARS SUDDENLY FROM
// THE GROUND." It ate Toji. Built as a vertical column of ribbed muscle rising
// out of the floor, opening into a four-lobed lamprey maw with a throat that
// goes back further than the body should allow.
export function buildHookworm() {
  const g = new THREE.Group();
  const S = 2.6;
  const hide = skin(chitinTex('hookworm', {
    base: '#6a4a4e', plate: '#8a6266', rim: '#b08a80', bands: 26
  }), { rim: 0.44, rimStart: 0.60, gloss: 0.42 });
  const inner = skin(fleshTex('hookwormGum', {
    base: '#9c3a4a', blotchA: '#742836', blotchB: '#b8505e', seam: '#4a1420', seams: 0, veins: 26
  }), { gloss: 0.55 });
  const tooth = boneMat(maskTex('hookTooth', { base: '#e2d8c0', crack: '#a89a80', stain: '#c4b494' }));

  // the column, ten ribbed segments, curving forward at the top
  const links = [];
  let host = joint(g, 0, 0, 0);
  for (let i = 0; i < 10; i++) {
    const k = i / 9;
    const r = (0.22 - k * 0.05) * S;
    part(host, tubeBetween(v3(0, 0, 0), v3(0, 0.28 * S, 0), [r, r * 0.97], { radial: 12, hSeg: 2 }),
      hide, { outline: i % 3 === 0, thickness: 0.015, uv: 'cylY', uvScale: [2, 0.4], uvOffset: [0, i * 0.4] });
    host = joint(host, 0, 0.28 * S, 0);
    links.push(host);
  }
  // THE MAW — four hinged lobes opening outward, a ring of hooks on each, and
  // a throat that recedes into black
  const maw = joint(host, 0, 0, 0);
  const throat = new THREE.Mesh(new THREE.SphereGeometry(0.17 * S, 14, 12), voidMat(0x180810));
  throat.scale.set(1, 1.5, 1);
  throat.position.y = -0.06 * S;
  maw.add(throat);
  const lobes = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const lj = joint(maw, 0, 0, 0);
    lj.rotation.y = a;
    const petal = joint(lj, 0, 0, 0.10 * S);
    part(petal, tGeo(blob(0.13 * S, 0.055 * S, 0.20 * S, 11), { pos: [0, 0.06 * S, 0.06 * S] }), hide,
      { outline: true, thickness: 0.012 });
    part(petal, tGeo(blob(0.11 * S, 0.030 * S, 0.17 * S, 10), { pos: [0, 0.035 * S, 0.05 * S] }), inner);
    for (let j = -2; j <= 2; j++) {
      part(petal, tGeo(coneSpike(0.020 * S, 0.13 * S, v3(0, 0, -0.03 * S), { radial: 4, hSeg: 3 }),
        { rot: [122, 0, j * 9], pos: [j * 0.042 * S, 0.055 * S, 0.185 * S] }), tooth, { uv: 'cylY' });
    }
    lobes.push({ lj, petal });
  }
  // an inner ring of rasping hooks down the throat
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + r * 0.3;
      const rad = (0.13 - r * 0.035) * S;
      part(maw, tGeo(coneSpike(0.012 * S, 0.070 * S, v3(0, 0, 0), { radial: 4, hSeg: 2 }),
        { rot: [180 - 30, 0, 0], pos: [Math.cos(a) * rad, -(0.03 + r * 0.07) * S, Math.sin(a) * rad] }),
        tooth, { uv: 'cylY' });
    }
  }

  const model = {
    group: g, height: 3.0, radius: 0.8,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      const swallow = anim.action === 'grab' ? (anim.actionK ?? 0) : 0;
      // it SWAYS rather than walks — a column anchored in the floor, hunting by
      // leaning. The wave travels UP, so the head arrives last.
      links.forEach((l, i) => {
        l.rotation.x = Math.sin(t * 1.1 - i * 0.28) * (0.05 + i * 0.012) + swallow * 0.06 * (i / 9);
        l.rotation.z = Math.cos(t * 0.85 - i * 0.24) * (0.04 + i * 0.010);
      });
      // peristalsis running up the body — the thing it swallowed, still moving
      links.forEach((l, i) => {
        const w = Math.sin(t * 2.4 - i * 0.9);
        const s = 1 + Math.max(0, w) * (0.05 + swallow * 0.18);
        l.scale.set(s, 1, s);
      });
      const open = 0.35 + Math.sin(t * 1.4) * 0.12 + swallow * 1.05;
      lobes.forEach((L, i) => {
        L.petal.rotation.x = -open + Math.sin(t * 2.2 + i * 1.6) * 0.06;
        L.lj.rotation.z = Math.sin(t * 1.8 + i) * 0.05;
      });
      if (anim.hurt) g.rotation.z = Math.sin(t * 30) * 0.08; else g.rotation.z *= 0.9;
    }
  };
  return finishCurse(model);
}
