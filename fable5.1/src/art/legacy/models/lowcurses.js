// LOW-GRADE CURSES — Geto's chaff. Two ORIGINAL designs; unlike the four
// special grades in his stable these do not correspond to any playable
// character, so there was nothing to reuse and they are authored from scratch.
//
// ============================ REFERENCE SHEET ============================
// There is no canon design to research for these: low-grade curses in JJK are
// deliberately anonymous background shapes, and the ones Geto is shown
// carrying are drawn as an undifferentiated crowd. So the brief here is a
// DESIGN brief rather than a likeness brief, and it comes from the roster:
//
//   · They must read as CHAFF at a glance. Small (0.75-0.95 m against a
//     1.86 m Geto), simple, and visually noisy in a crowd rather than
//     individually threatening. If one of these ever reads as a real
//     opponent the character is broken.
//   · They must NOT read as Ten Shadows. Megumi's shikigami are clean animal
//     silhouettes in shadow-blue with smoke coming off them. These are lumpy,
//     asymmetric, sickly-coloured and have no animal referent at all. Two
//     summoners on one field have to be distinguishable at silhouette size.
//   · They must share a family look with each other and with Geto's palette:
//     grey-green flesh, violet cursed-energy accents, a single ugly feature.
//
// GAPING MAW  — a squat body that is mostly MOUTH. Two stubby legs, no arms,
//               no eyes; a wide hinged jaw with irregular teeth takes up the
//               whole front. It hops. Flesh #6c7a63, gums #7a3a44, teeth
//               #ddd6c4. The one feature is the jaw, and it opens on attack.
// TENDRIL WISP— a floating eyeless bulb with a ring of small dark pits around
//               its equator and four long tendrils hanging beneath. It bobs
//               and drifts rather than walking. Flesh #7a7288, pits #1a1420,
//               tendril tips glowing violet #6b2fa0. The one feature is the
//               tendril curtain, which sways with the body.
//
// Both models expose the SAME interface as the shikigami models
// (art/models/shikigami.js) — { group, height, radius, setReveal, tick } — so
// combat/curses.js can drive a low-grade, a reused special grade and a
// borrowed shikigami through one code path.
// =========================================================================
import * as THREE from 'three';
import { tGeo, roundBox } from '../builders/geo.js';
import { rand } from '../../../core/math.js';
import { dermis, boneMat, fleshTex, maskTex, energyTex, CURSE_RIM } from '../textures/creature.js';
import { bakeStatic, collectOutlines, applyLOD } from '../builders/bake.js';

const VIOLET = 0x6b2fa0;

// ---- RETEXTURED INTO THE STABLE'S FAMILY ----------------------------------
// These two shipped as flat toon colours. Now that Geto's stable is fifteen
// curses rather than six they have to belong to a set, so they carry the same
// procedural cursed-flesh surface everything else in art/models/getocurses.js
// does — mottled, veined, faintly seamed, with the shared violet rim. The
// PALETTES are unchanged (grey-green maw, mauve wisp, violet tendril tips):
// this is a surface pass, not a redesign, because their silhouettes were never
// the problem.
function mat(hexColor, opts = {}) {
  const css = '#' + hexColor.toString(16).padStart(6, '0');
  const shift = (d) => {
    const n = hexColor;
    const clamp = v => Math.max(0, Math.min(255, v));
    return '#' + ((clamp(((n >> 16) & 255) + d) << 16)
      | (clamp(((n >> 8) & 255) + d) << 8)
      | clamp((n & 255) + d)).toString(16).padStart(6, '0');
  };
  return dermis(fleshTex('low' + hexColor, {
    base: css, blotchA: shift(-34), blotchB: shift(26), seam: '#4a2c34',
    seams: opts.seams ?? 2, veins: opts.veins ?? 12, bloom: opts.bloom ?? null
  }), { rimColor: CURSE_RIM, rim: 0.42, rimStart: 0.60, gloss: opts.gloss ?? 0.3 });
}

// Shared reveal helper: the family tell is that a curse does not fade in, it
// INFLATES out of nothing. Scaling the whole group is enough and it costs one
// line per model.
function revealer(group) {
  return k => {
    const s = Math.max(0.001, k);
    group.scale.set(s, s, s);
    group.visible = k > 0.001;
  };
}

// ---------------------------------------------------------------------------
// GAPING MAW — squat, legged, all jaw. The hopper.
// ---------------------------------------------------------------------------
export function buildGapingMaw() {
  const g = new THREE.Group();
  const flesh = mat(0x6c7a63, { seams: 3 });
  const fleshDk = mat(0x515c4a, { seams: 2 });
  const gum = mat(0x7a3a44, { veins: 22, gloss: 0.5 });
  const tooth = boneMat(maskTex('mawTooth', { base: '#ddd6c4', crack: '#a89f8c', stain: '#c2b8a2' }));

  const H = 0.82;
  // BODY: a lumpy ovoid, wider than tall, leaning forward over the legs
  const body = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(H * 0.34, 12, 10), flesh);
  core.scale.set(1.14, 0.86, 1.0);
  body.add(core);
  // three asymmetric lumps so it is never a clean sphere
  for (let i = 0; i < 3; i++) {
    const a = rand(0, Math.PI * 2);
    const lump = new THREE.Mesh(new THREE.SphereGeometry(H * rand(0.10, 0.17), 8, 6), fleshDk);
    lump.position.set(Math.cos(a) * H * 0.26, rand(-0.06, 0.14) * H, Math.sin(a) * H * 0.22);
    body.add(lump);
  }
  body.position.y = H * 0.52;
  body.rotation.x = 0.14;
  g.add(body);

  // THE JAW. Upper and lower halves hinged at the back, taking up the whole
  // front of the body. This is the only feature it has, so it is large.
  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -H * 0.04, H * 0.10);
  body.add(jawPivot);

  const makeJaw = (sign) => {
    const j = new THREE.Group();
    const plate = new THREE.Mesh(
      tGeo(roundBox(H * 0.50, H * 0.11, H * 0.42, H * 0.04, 2), { pos: [0, 0, H * 0.18] }), gum);
    j.add(plate);
    // teeth: irregular cones along the front edge, deliberately uneven
    for (let i = 0; i < 7; i++) {
      const x = (i / 6 - 0.5) * H * 0.42;
      const t = new THREE.Mesh(
        new THREE.ConeGeometry(H * rand(0.020, 0.034), H * rand(0.06, 0.13), 4), tooth);
      t.position.set(x, sign * H * 0.05, H * 0.34 + rand(-0.02, 0.02) * H);
      t.rotation.x = sign > 0 ? Math.PI : 0;
      t.rotation.z = rand(-0.25, 0.25);
      j.add(t);
    }
    return j;
  };
  const upper = makeJaw(1);
  const lower = makeJaw(-1);
  upper.position.y = H * 0.06;
  lower.position.y = -H * 0.06;
  jawPivot.add(upper, lower);

  // dark throat behind the teeth, so the open mouth is not a hole to the skybox
  const throat = new THREE.Mesh(new THREE.SphereGeometry(H * 0.20, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x140d16 }));
  throat.position.set(0, 0, H * 0.18);
  jawPivot.add(throat);

  // LEGS: two stubby trunks. No knees — it hops, it does not walk.
  const legs = [];
  for (const s of [1, -1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.070, H * 0.095, H * 0.34, 7), fleshDk);
    leg.position.set(s * H * 0.15, H * 0.17, -H * 0.02);
    g.add(leg);
    legs.push(leg);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(H * 0.10, 8, 6), fleshDk);
    foot.scale.set(1.2, 0.6, 1.4);
    foot.position.set(s * H * 0.15, H * 0.04, H * 0.03);
    g.add(foot);
  }

  const model = {
    group: g, height: H, radius: H * 0.36,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      // the hop: a hard vertical bounce whose rate follows movement speed
      const rate = 5.5 + (anim.speed ?? 0) * 0.9;
      const hop = Math.abs(Math.sin(t * rate));
      g.position.y = hop * H * 0.16;
      body.rotation.x = 0.14 - hop * 0.20;
      legs[0].rotation.x = Math.sin(t * rate) * 0.5;
      legs[1].rotation.x = -Math.sin(t * rate) * 0.5;
      // the jaw: idles slightly parted and gapes wide on the attack window
      const open = anim.action === 'bite' ? 0.30 + (anim.actionK ?? 0) * 0.85 : 0.10 + Math.sin(t * 2.2) * 0.05;
      upper.rotation.x = -open;
      lower.rotation.x = open;
      if (anim.hurt) body.rotation.z = Math.sin(t * 40) * 0.16;
      else body.rotation.z *= 0.85;
    }
  };
  bakeStatic(g);
  model.hulls = collectOutlines(g);
  model.setLOD = (dist) => applyLOD(model.hulls, dist);
  model.setReveal(0);
  return model;
}

// ---------------------------------------------------------------------------
// TENDRIL WISP — floating, eyeless, four hanging tendrils. The drifter.
// ---------------------------------------------------------------------------
export function buildTendrilWisp() {
  const g = new THREE.Group();
  const flesh = mat(0x7a7288, { seams: 3, bloom: '#6b2fa0' });
  const fleshDk = mat(0x574f66, { seams: 2, bloom: '#6b2fa0' });

  const H = 0.94;
  // BULB: a teardrop, point up. Floats at about half its height off the floor.
  const bulb = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(H * 0.28, 12, 10), flesh);
  core.scale.set(1.0, 1.20, 1.0);
  bulb.add(core);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(H * 0.20, H * 0.30, 10), fleshDk);
  cap.position.y = H * 0.36;
  bulb.add(cap);

  // the ring of pits around the equator — eyeless, and that is the point: it
  // has no face to read, so there is nothing to negotiate with
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const pit = new THREE.Mesh(new THREE.SphereGeometry(H * 0.045, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0x1a1420 }));
    pit.scale.set(1, 1.4, 0.6);
    pit.position.set(Math.cos(a) * H * 0.26, rand(-0.04, 0.04) * H, Math.sin(a) * H * 0.26);
    pit.lookAt(pit.position.clone().multiplyScalar(2));
    bulb.add(pit);
  }
  bulb.position.y = H * 0.62;
  g.add(bulb);

  // TENDRILS: four hanging chains of three segments each, tapering, with a
  // glowing violet tip. The curtain is the silhouette.
  const tendrils = [];
  const tipMat = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const root = new THREE.Group();
    root.position.set(Math.cos(a) * H * 0.17, -H * 0.20, Math.sin(a) * H * 0.17);
    bulb.add(root);
    const segs = [];
    let parent = root;
    for (let k = 0; k < 3; k++) {
      const len = H * (0.16 - k * 0.03);
      const seg = new THREE.Group();
      seg.position.y = k === 0 ? 0 : -H * (0.16 - (k - 1) * 0.03);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(H * (0.030 - k * 0.008), H * (0.024 - k * 0.007), len, 6),
        k === 2 ? fleshDk : flesh);
      mesh.position.y = -len / 2;
      seg.add(mesh);
      if (k === 2) {
        const tip = new THREE.Mesh(new THREE.SphereGeometry(H * 0.030, 6, 5), tipMat);
        tip.position.y = -len;
        seg.add(tip);
      }
      parent.add(seg);
      segs.push(seg);
      parent = seg;
    }
    tendrils.push({ segs, phase: i * 1.4 });
  }

  const model = {
    group: g, height: H, radius: H * 0.30,
    setReveal: revealer(g),
    tick(dt, anim = {}) {
      this._t = (this._t ?? rand(0, 6)) + dt;
      const t = this._t;
      // bob: it never touches the floor
      g.position.y = Math.sin(t * 1.8) * H * 0.07;
      bulb.rotation.y += dt * 0.5;
      bulb.rotation.z = Math.sin(t * 1.1) * 0.10;
      // the tendrils lash on the attack window and sway otherwise
      const lash = anim.action === 'lash' ? (anim.actionK ?? 0) : 0;
      for (const td of tendrils) {
        td.segs.forEach((seg, k) => {
          const sway = Math.sin(t * 2.4 + td.phase + k * 0.8) * (0.10 + k * 0.06);
          seg.rotation.x = sway - lash * (1.1 - k * 0.2);
          seg.rotation.z = Math.cos(t * 1.9 + td.phase + k * 0.6) * (0.08 + k * 0.05);
        });
      }
      if (anim.hurt) bulb.position.x = Math.sin(t * 44) * H * 0.05;
      else bulb.position.x *= 0.8;
    }
  };
  bakeStatic(g);
  model.hulls = collectOutlines(g);
  model.setLOD = (dist) => applyLOD(model.hulls, dist);
  model.setReveal(0);
  return model;
}
