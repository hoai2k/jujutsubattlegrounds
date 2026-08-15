// KUROURUSHI — 黒沐死. Special-grade cursed spirit, Culling Game.
//
// ============================ REFERENCE SHEET ============================
// AUTHORED FROM AN IMAGE the user supplied (2026-08-13) and from that image
// ONLY — it supersedes the earlier written-description pass, which built him
// as a jet-black cockroach. What the reference actually shows, read straight
// off the plate:
//
//   · A humanoid body in DEEP ARTERIAL RED, muscular, bare to the waist, in a
//     wide low crouch with the weight split evenly between two bare feet.
//   · FOUR ARMS. The upper pair long and raised — the left one thrown up and
//     back holding a blade — the lower pair shorter and carried in close.
//   · A near-black head with a HORNED crest and a face that is one hot ORANGE
//     glow: a brow bar and four eye slits burning through a dark mask.
//   · A BLACK TATTERED WRAP at the waist, and a much larger sheet of torn
//     black cloth trailing behind him off the shoulders and hips.
//   · Long, thin, DARK-RED TENDRILS radiating out behind him in every
//     direction, curving as they go. There are a lot of them and they are the
//     loudest thing in the silhouette after the arms.
//   · VIOLET cursed-energy motes drifting through the air around him.
//
// WHAT THE RESTYLE KEEPS, and why. Every runtime hook the rest of the game
// calls is unchanged — `setGrowth`, `setStage`, `setMaw`, `setWings` — and so
// is the bone layout (the shared twenty plus Sukuna's four-arm suffix set), so
// every clip in art/anim/kurourushi.js and every call site in combat/swarm.js
// and combat/effects.js keeps working untouched. What changed is only what
// those hooks DRIVE:
//   setMaw   was insect mandibles hinging sideways; now the lower jaw SPLITS
//            into two halves around a lit gullet. Still sideways, still the
//            thing that makes DEVOUR read, now a mouth rather than pincers.
//   setWings was elytra fanning membranous insect wings; now the two halves of
//            the trailing black mantle FLARE and a violet cursed-energy sheet
//            opens between them.
//   setStage was plate thickening; now the mantle grows, the tendrils get
//            longer, and the face burns brighter — the "how far gone is he"
//            read the Gluttony design asks for, in the new material language.
//
// BUILD    H 2.25 at base, unchanged — it is coupled to the hurt capsule, the
//          reach numbers and the camera in characters/kurourushi.js, and this
//          pass is cosmetic. He still GROWS three stages from here.
//
// FLESH    Not chitin. A matte, slightly wet DEEP RED with a warm rim, banded
//          so the muscle mass reads. Beside Hanami's matte bark and Sukuna's
//          pale skin this is unmistakably a third material.
//
// PALETTE  flesh #9e2430 · deep #5e1220 · highlight #c4444a ·
//          char (mask/horn/ridge) #3a1216 · mark #140a0d ·
//          hakama #141015 · eye #ff7a18, glow #ffd46a · gullet #1c0508 ·
//          tendril #7a1a24 · cursed energy #8b4fd0 ·
//          sword bone #cbb8a2, sword rot #6e1a1e, sword weep #ff8a2e
//
// THE FESTERING LIFE SWORD — src-original. There is no canon weapon of this
//          name; the user asked for one and for it to be built from the blade
//          in the reference. It is authored as a GROWTH rather than as a
//          forged object: a long thin blade of diseased bone whose pale tip
//          rots to red at the root, pitted along its edge, with three veins
//          that weep light down the fuller in a slow pulse. The grip has no
//          guard — it is sinew, fused into his hand. See buildFesteringLifeSword.
//
// IDENTITY 1) the burning orange horned face over a red body  2) four arms
//          and the long blade  3) the black mantle and the fan of tendrils.
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tubeBetween, tGeo, coneSpike, sphereShell, roundBox, ribbonShell } from '../builders/geo.js';
import { toonMaterial, MAT } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { v3, DEG } from '../../core/mathutil.js';

// PALETTE. The reference's red is very saturated and very dark, and taken
// literally under this renderer every cel band collapsed into one value and
// the whole body read as a flat red sticker. These are the values that READ as
// that red here: a mid crimson base carrying the lit bands, a much darker deep
// tone doing the shadow and the muscle separation, and a highlight tone on the
// ridges. The face glow is the only genuinely bright thing on him, which is
// what makes it the first thing you see — exactly as in the plate.
export const FLESH = 0x9e2430;
const FLESH_DEEP = 0x5e1220;
const FLESH_HI = 0xc4444a;
const CHAR = 0x3a1216;        // the near-black of the mask, horns and back ridge
const MARK = 0x140a0d;
const HAKAMA = 0x141015;
const HAKAMA_HI = 0x2a2130;
const EYE = 0xff7a18;
const EYE_GLOW = 0xffd46a;
const GULLET = 0x1c0508;
const TENDRIL = 0x7a1a24;
const TENDRIL_HI = 0xa8323a;
const FANG = 0xd8cbb4;
export const CURSED = 0x8b4fd0;   // the violet motes in the reference
export const CORROSIVE = 0xd8a02a;
export const CORROSIVE_HOT = 0xf0c94a;

// Flesh shading, exported so the corrosive FX and anything else that wants to
// match his body uses the exact same response. Low gloss — he is wet, not
// polished — and a hot rim so the silhouette stays lit against dark arenas.
export function fleshMaterial(o = {}) {
  return toonMaterial({
    steps: [58, 118, 190, 255], rim: 0.34, rimStart: 0.66, gloss: 0.22,
    rimColor: 0xff9a6a, warm: 0x3a1410, cool: 0x180c1e, ...o
  });
}

export function buildKurourushi() {
  const spec = {
    id: 'kurourushi', name: 'Kurourushi', H: 2.25, headScale: 0.96,
    shoulder: 0.136, hip: 0.054, muscle: 1.26, bulk: 1.14, legBulk: 1.10,
    skinTone: FLESH,
    // bare to the waist: the body is the costume, the cloth is only the wrap
    bodySlot: 'skin', armSlot: 'skin',
    // BARE LEGS. `pantColor` was HAKAMA on the first attempt and it painted him
    // black from the hip down — the reference's legs are bare red and only the
    // waist wrap is cloth, so the legs stay flesh and the wrap lathe below is
    // the only black on the lower body.
    clothColor: FLESH, sleeveColor: FLESH, handColor: FLESH,
    pantColor: FLESH, shoeColor: FLESH,
    torsoShape: { chest: 1.16, waist: 0.90, hip: 1.00 },
    // broad and heavy-browed, but a face rather than a head capsule — the mask
    // and the horns do the "not human" work and they need something to sit on
    face: { jaw: 0.92, chin: 0.62, width: 1.10, faceFlat: 0.40 },
    // barefoot in the reference: the "shoe" is just the foot block
    shoe: { len: 0.132, hgt: 0.038, wid: 0.048 },
    ears: false,
    shoulderCap: false,
    // THE SECOND ARM PAIR. Unchanged from the previous pass on purpose — it
    // appends four bones after the shared twenty, so every existing clip keeps
    // working and only his own clips ever name them.
    arms2: { shoulder: 0.104, shoulderY: 0.686, scale: 0.86, spread: 30, back: -0.030, slot: 'skin' },
    palette: {
      rim: 0xff9a6a, hairRim: 0xff7a52, outline: 0x0a0406,
      accent: EYE, energy: CURSED, metalRim: 0xffd0a8
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.06;

  // The mark slot: flat, unlit black line art. Same trick Sukuna uses — cel
  // shading treats a thin dark mesh as a drawn line rather than as form, which
  // is the only way definition survives on a bare body at this poly budget.
  const markMat = new THREE.MeshBasicMaterial({ vertexColors: true });

  const bar = (w, h) => roundBox(w, h, 0.005, 0.002);

  // =========================================================================
  // MUSCLE — the body has to read as heavy before anything is drawn on it
  // =========================================================================
  // Definition is DRAWN, not modelled: separate pectoral lobes read as breasts
  // under cel banding at this poly count no matter how flat they are (the
  // lesson Sukuna's fifth pass paid for). So the mass lives in the torso
  // profile and the shape lives in one sternum wedge plus mark-slot creases.
  bag.add('skin', tGeo(new THREE.SphereGeometry(0.050 * H, 14, 10), {
    scale: [0.66, 1.30, 0.30], pos: [0, 0.706 * H, 0.048 * H]
  }), { chain: torsoChain, color: FLESH_HI, blend: 0.05 });
  // three abdominal bands, deep-toned, stacked down the front
  for (let i = 0; i < 3; i++) {
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.044 * H, 12, 8), {
      scale: [1.30, 0.34, 0.34], pos: [0, 0.640 * H - i * 0.042 * H, 0.044 * H]
    }), { chain: torsoChain, color: FLESH_DEEP, blend: 0.05 });
  }
  // deltoid caps: the reference's shoulders are round and bare, and with
  // shoulderCap off the builder leaves the joint square
  for (const [bone, m, sc] of [['UpArmL', 1, 1], ['UpArmR', -1, 1], ['UpArmL2', 1, 0.84], ['UpArmR2', -1, 0.84]]) {
    const j = joints.get(bone);
    if (!j) continue;
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.038 * H * sc, 10, 8), {
      scale: [1.0, 0.86, 0.94], pos: [j.x, j.y + 0.004 * H, j.z]
    }), { bone, color: FLESH_HI });
  }

  // =========================================================================
  // THE DORSAL RIDGE — where the tendrils come out of him
  // =========================================================================
  // Replaces the old pronotum. A low, dark, ROOTED shelf across the upper back
  // only: nothing crosses the chest, because the reference's front is bare and
  // the first pass of the old model learned the hard way that a raised band
  // across the front reads as a grin. Its whole job is to give the eight
  // tendril chains a believable origin instead of having them sprout from skin.
  bag.add('skin', tGeo(sphereShell(0.118 * H, {
    thetaLength: Math.PI * 0.40, scale: [1.16, 0.44, 0.72]
  }), { rot: [-16, 0, 0], pos: [0, 0.748 * H, -0.048 * H] }),
    { chain: torsoChain, color: CHAR, blend: 0.05 });
  // four knuckled roots along it, alternating height
  for (let i = 0; i < 4; i++) {
    const s = i < 2 ? 1 : -1, k = i % 2;
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.020 * H, 8, 6), {
      scale: [1.0, 0.7, 0.8],
      pos: [s * (0.034 + k * 0.040) * H, (0.760 - k * 0.030) * H, -0.062 * H]
    }), { chain: torsoChain, color: CHAR, blend: 0.05 });
  }

  // =========================================================================
  // MARKINGS — black line art over red
  // =========================================================================
  // The reference reads as heavily shadowed rather than tattooed, so this set
  // is deliberately SPARSE: enough to break the red up and say "cursed spirit",
  // not so much that he becomes Sukuna with a repaint.
  for (const s of [1, -1]) {
    // pectoral crease — the drawn definition the modelled lobes are not
    bag.add('mark', tGeo(bar(0.056 * H, 0.007 * H),
      { rot: [0, 0, s * 22], pos: [s * 0.034 * H, 0.744 * H, 0.062 * H] }),
      { chain: torsoChain, color: MARK, blend: 0.05 });
    // a long rib diagonal below it
    bag.add('mark', tGeo(bar(0.062 * H, 0.008 * H),
      { rot: [0, 0, s * -34], pos: [s * 0.044 * H, 0.664 * H, 0.052 * H] }),
      { chain: torsoChain, color: MARK, blend: 0.05 });
  }
  // arm and ankle bands, authored for all four arms from one loop — if the
  // lower pair is ever dropped from the spec this simply builds nothing for it
  const bandAt = (bone, r, thick, drop = 0, color = MARK) => {
    const j = joints.get(bone);
    if (!j) return;
    bag.add('mark', tGeo(new THREE.CylinderGeometry(r, r, thick, 12, 1, true),
      { pos: [j.x, j.y - drop, j.z] }), { bone, color });
  };
  for (const [up, , hand] of [['UpArmL', 'LoArmL', 'HandL'], ['UpArmR', 'LoArmR', 'HandR'],
  ['UpArmL2', 'LoArmL2', 'HandL2'], ['UpArmR2', 'LoArmR2', 'HandR2']]) {
    bandAt(up, 0.028 * H, 0.012 * H, 0.010 * H);
    bandAt(hand, 0.021 * H, 0.014 * H, 0.004 * H);
  }
  for (const s of ['L', 'R']) bandAt('Foot' + s, 0.026 * H, 0.020 * H, -0.014 * H);

  // =========================================================================
  // LEG DEFINITION
  // =========================================================================
  // The reference's legs are bare, heavy and clearly separated at the calf.
  // One deep-toned calf mass per side does that; the old tibial spine rows are
  // gone with the exoskeleton.
  for (const s of ['L', 'R']) {
    const m = s === 'L' ? 1 : -1;
    const kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    bag.add('skin', tGeo(new THREE.SphereGeometry(0.034 * H, 10, 8), {
      scale: [0.86, 1.60, 0.80],
      pos: [kn.x + m * 0.002 * H, kn.y + (an.y - kn.y) * 0.30, kn.z - 0.012 * H]
    }), { bone: 'Shin' + s, color: FLESH_DEEP });
  }

  // =========================================================================
  // THE WRAP — black tattered cloth at the waist
  // =========================================================================
  // Closed all the way round at the belt and torn from there down. The long
  // trailing sheet behind him is the MANTLE (below); this is only the wrap.
  bag.add('cloth', latheY([
    [0.078 * H, 0.556 * H], [0.086 * H, 0.520 * H], [0.086 * H, 0.492 * H]
  ], 20, 0.92), { chain: torsoChain, color: HAKAMA_HI, blend: 0.05 });
  bag.add('cloth', latheY([
    [0.084 * H, 0.496 * H], [0.100 * H, 0.430 * H], [0.112 * H, 0.352 * H]
  ], 20, 0.90), { bone: 'Hips', color: HAKAMA });

  const model = finalizeModel(ctx, {
    outlineThickness: 0.012, outlineHairScale: 1.0,
    materials: {
      skin: fleshMaterial(),
      cloth: MAT.cloth({ steps: [40, 96, 200], rim: 0.30, rimStart: 0.70, rimColor: 0x8f5a7a }),
      hair: fleshMaterial({ steps: [40, 100, 190, 255], rim: 0.46, gloss: 0.40 }),
      mark: markMat
    },
    springs: kurourushiSprings(ctx),
    props: {
      // THE FESTERING LIFE SWORD. Held in the UPPER LEFT hand, which is the
      // arm thrown up and back in the reference. `back` exists so the sword can
      // be stowed without deleting it; nothing ships calling it yet.
      //
      // THE KEY IS `festering`, NOT `sword`, and that is load-bearing. Both
      // combat/fighter.js `_props` and the viewer's clip router branch on a
      // bare `props.has('sword')` for HIGURUMA's Executioner's Sword and send
      // it to an `away` slot — a slot this prop does not have, so attachProp
      // hides it. A unique key keeps the blade out of that routing entirely
      // and means neither shared file has to be touched.
      festering: {
        node: buildFesteringLifeSword(H, spec.palette), default: 'hand',
        attachments: {
          hand: { bone: 'HandL', pos: [0, -0.038 * H, 0.010 * H], rot: [-18, 0, 152] },
          back: { bone: 'Hips', pos: [-0.058 * H, 0.030 * H, -0.082 * H], rot: [0, 0, -104] }
        }
      }
    }
  });

  // Everything from here is parented to a BONE rather than skinned, because it
  // has to be driven at runtime — the mantle sways and flares, the maw opens,
  // the face burns brighter with each growth stage.
  const hips = model.getBone('Hips');
  const chest = model.getBone('Chest');
  const head = model.getBone('Head');
  const chestJ = joints.get('Chest'), headJ = joints.get('Head');

  const flesh = fleshMaterial();
  const charMat = fleshMaterial({ steps: [34, 82, 168], rim: 0.42, gloss: 0.30 });
  const clothMat = MAT.cloth({ steps: [40, 96, 200], rim: 0.30, rimColor: 0x8f5a7a });
  const outlineOpts = { color: 0x0a0406, thickness: 0.012 };
  // color may be a hex or fn(x,y,z) -> THREE.Color, which is how the sword's
  // bone-to-rot gradient is painted without a texture file
  const mk = (geo, mat, color) => {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.getAttribute('position');
    const n = p.count;
    const arr = new Float32Array(n * 3);
    const fn = typeof color === 'function' ? color : null;
    const c = fn ? new THREE.Color() : new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const cc = fn ? fn(p.getX(i), p.getY(i), p.getZ(i), c) : c;
      arr[i * 3] = cc.r; arr[i * 3 + 1] = cc.g; arr[i * 3 + 2] = cc.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, mat);
    const grp = new THREE.Group();
    grp.add(mesh, makeOutline(mesh, outlineOpts));
    return grp;
  };

  // =========================================================================
  // THE MANTLE — the big sheet of torn black cloth behind him
  // =========================================================================
  // Six tapering panels chained off the hips, each hanging from the one above,
  // so a wave runs down the whole sheet instead of it swinging as one board.
  // This is the old abdomen's segment chain rebuilt as cloth: same wave, same
  // sway code, completely different read.
  // THE PANELS HANG, THEY DO NOT STACK. The first pass built each one as
  // roundBox(w, 0.010H, 0.086H) — a slab that is thin in Y and deep in Z, i.e.
  // a horizontal SHELF — and chained them downward, so from behind the mantle
  // read as a six-step staircase bolted to his back. A hanging sheet is wide in
  // X, TALL IN Y and thin in Z, and each panel overlaps the one above it.
  const mantle = new THREE.Group();
  const segs = [];
  {
    let z = -0.030 * H, yy = 0, w = 0.215 * H;
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Group();
      const h = 0.082 * H;
      const panel = mk(tGeo(roundBox(w, h, 0.013 * H, 0.006),
        { pos: [0, -h * 0.5, 0] }), clothMat, i % 2 ? HAKAMA : HAKAMA_HI);
      seg.add(panel);
      // two tears cut UP from the lower edge, offset per panel so the rip line
      // down the sheet is ragged rather than a repeating stamp
      for (const s of [1, -1]) {
        const tear = mk(coneSpike(0.020 * H, 0.058 * H, v3(s * 0.014 * H, 0, 0), { radial: 4, hSeg: 2 }),
          clothMat, HAKAMA);
        tear.rotation.x = 180 * DEG;
        tear.position.set(s * w * (0.18 + (i % 2) * 0.16), -h * 0.94, 0.002 * H);
        seg.add(tear);
      }
      seg.position.set(0, yy, z);
      segs.push(seg);
      (i === 0 ? mantle : segs[i - 1]).add(seg);
      // overlap: the drop is a hair less than a panel's height, so there is no
      // gap between them at any sway angle
      yy = -h * 0.88;
      z = -0.005 * H;
      // TAPER HARD. At 0.94 per panel the sheet stayed the same width all the
      // way down and read as a rectangular apron; cloth hanging off a pair of
      // hips narrows, and the narrowing is what stops it looking bolted on.
      w *= 0.86;
    }
  }
  // Off the BACK of the hips and hanging, with only a slight backward lean —
  // it is a sheet of cloth, and cloth falls.
  mantle.position.set(0, 0.026 * H, -0.062 * H);
  mantle.rotation.x = -0.16;
  hips.add(mantle);

  // =========================================================================
  // THE SHOULDER MANTLE HALVES + the cursed-energy sheet between them
  // =========================================================================
  // `setWings(k)` flares the two halves off his back and opens a violet sheet
  // between them. Same hook the elytra used, so combat/swarm.js is untouched.
  const flares = [];
  const veils = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * 0.048 * H, 0.690 * H - chestJ.y, -0.058 * H);
    chest.add(hinge);
    // TWO SEPARATE DRAPES, NOT ONE PANEL EACH. The first pass ran a 0.120 H
    // slab centred 0.078 H off the spine — the two of them met on the
    // centreline and read as a flat black BACKPACK. They are now narrower,
    // angled outboard, and pushed apart so the spine and the tendril roots
    // stay visible between them, which is what makes it read as cloth over a
    // back rather than as a box.
    // two stacked panels rather than one slab, the lower one narrower — the
    // taper is what keeps a rectangle from reading as a rectangle
    const half = mk(tGeo(roundBox(0.092 * H, 0.130 * H, 0.011 * H, 0.005),
      { rot: [8, s * -16, s * -9] }), clothMat, HAKAMA);
    half.position.set(s * 0.062 * H, -0.052 * H, -0.062 * H);
    hinge.add(half);
    const lower = mk(tGeo(roundBox(0.062 * H, 0.110 * H, 0.010 * H, 0.005),
      { rot: [8, s * -16, s * -14] }), clothMat, HAKAMA_HI);
    lower.position.set(s * 0.070 * H, -0.158 * H, -0.062 * H);
    hinge.add(lower);
    // a torn lower edge on each drape
    for (let i = 0; i < 3; i++) {
      const t = mk(coneSpike(0.015 * H, 0.066 * H, v3(s * 0.008 * H, 0, 0), { radial: 4, hSeg: 2 }),
        clothMat, HAKAMA_HI);
      t.rotation.x = 176 * DEG;
      t.position.set(s * 0.070 * H + (i - 1) * 0.022 * H, -0.206 * H, -0.062 * H);
      hinge.add(t);
    }
    flares.push(hinge);

    // the veil: a translucent violet fan, hidden at rest
    const vg = new THREE.Group();
    // SMALL AND FAINT. The first pass ran 0.32 H at 0.30 alpha and the two of
    // them met in front of him as a solid violet skirt that hid the whole body
    // — this is an accent on the cloth, not a costume piece. It also fans
    // BACKWARD (the -Z half of the arc) so it trails behind the drape instead
    // of crossing his chest.
    const veilMat = new THREE.MeshBasicMaterial({
      color: CURSED, transparent: true, opacity: 0.20,
      side: THREE.DoubleSide, depthWrite: false
    });
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(
        tGeo(new THREE.CircleGeometry(0.150 * H, 10, Math.PI * 0.62, 0.85), { rot: [90, 0, 0] }), veilMat);
      w.rotation.y = s * (0.14 + i * 0.12);
      w.position.set(s * 0.030 * H, -0.070 * H + i * 0.004 * H, -0.060 * H);
      vg.add(w);
    }
    vg.scale.setScalar(0.01);
    vg.visible = false;
    hinge.add(vg);
    veils.push({ node: vg, side: s });
  }

  // =========================================================================
  // THE HEAD — the mask, the horns, the four burning eyes, the splitting jaw
  // =========================================================================
  const hy = headC.y - headJ.y, hz = headC.z - headJ.z;

  // THE MASK — a CROWN CAP, not a helmet.
  // The first pass built this as a dome on the nominal head radius sitting at
  // head centre, and it swallowed the entire face: the eye glow only showed as
  // two slivers under its lip and the horns were buried inside it. The head is
  // one unit radius at hy ~= 0.88 headR, so anything reaching more than about
  // 0.4 headR below its own centre is over the eyes. This covers the crown and
  // the nape ONLY, and the face below it is left open for the glow.
  {
    const cap = mk(sphereShell(headR * 1.06, { thetaLength: Math.PI * 0.40, scale: [1.10, 0.80, 1.00] }),
      charMat, CHAR);
    cap.position.set(0, hy + headR * 0.16, hz - headR * 0.04);
    head.add(cap);
    // and the nape, so the back of the head is dark from behind too
    const nape = mk(sphereShell(headR * 1.04, { thetaLength: Math.PI * 0.44, scale: [1.02, 1.00, 0.86] }),
      charMat, CHAR);
    nape.rotation.x = -68 * DEG;
    nape.position.set(0, hy - headR * 0.10, hz - headR * 0.24);
    head.add(nape);
  }

  // THE FACE PLATE. A flat dark slab across the front of the face, from the
  // brow down over the cheekbones. Its only job is to be the BLACK that the
  // orange burns out of — glow on bare red flesh reads as sunburn, glow on a
  // dark plate reads as light coming from inside the skull.
  {
    const plate = mk(tGeo(new THREE.SphereGeometry(headR * 0.66, 12, 10), { scale: [1.02, 1.28, 0.34] }),
      charMat, CHAR);
    plate.position.set(0, hy - headR * 0.10, hz + headR * 0.44);
    head.add(plate);
    // a brow ridge along its top edge, so the glow sits under an overhang
    const brow = mk(tGeo(new THREE.SphereGeometry(headR * 0.40, 10, 8), { scale: [1.55, 0.34, 0.44] }),
      charMat, CHAR);
    brow.position.set(0, hy + headR * 0.50, hz + headR * 0.40);
    head.add(brow);
  }

  // THE HORNS. Two long ones swept up and back off the temples — the shape
  // that carries the whole head in the reference — and a shorter secondary
  // pair inboard of them. They root just BELOW the crown cap's lower edge and
  // grow out past it, which is the only placement where they read at all.
  // MEASURED. The first placement rooted them at 0.74 headR out and grew them
  // 1.75 headR — which put the base INSIDE the crown cap (it reaches 1.17 headR
  // wide) and left about 0.2 headR of tip showing above it. From the front they
  // were invisible. They now root OUTSIDE the cap's width, start above its
  // lower edge, and are long enough that the sweep is the head's silhouette.
  for (const s of [1, -1]) {
    const horn = mk(coneSpike(headR * 0.26, headR * 2.30,
      v3(s * headR * 0.55, -headR * 0.35, -headR * 1.05), { radial: 6, hSeg: 7 }), charMat, CHAR);
    horn.position.set(s * headR * 1.02, hy + headR * 0.36, hz - headR * 0.18);
    horn.rotation.set(-14 * DEG, 0, s * -30 * DEG);
    head.add(horn);
    const minor = mk(coneSpike(headR * 0.15, headR * 1.10,
      v3(s * headR * 0.22, -headR * 0.20, -headR * 0.52), { radial: 5, hSeg: 5 }), charMat, CHAR);
    minor.position.set(s * headR * 0.52, hy + headR * 0.78, hz - headR * 0.26);
    minor.rotation.set(-10 * DEG, 0, s * -16 * DEG);
    head.add(minor);
  }

  // THE FACE GLOW. In the reference this is the single brightest thing in the
  // frame and everything else is read relative to it, so it is built as one
  // system: a brow bar, an upper pair of long eye slits, and a lower pair of
  // short ones. Flat unlit, never additive.
  const faceGlow = [];
  const glowPart = (geo, color) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color }));
    // its OWN base colour is remembered, because the pulse multiplies and a
    // multiply against last frame's result decays every glow to black in about
    // a second — the brow bar and the eye slits are deliberately different hues
    m.userData.base = color;
    head.add(m);
    faceGlow.push(m);
    return m;
  };
  // The plate's front face sits at about hz + 0.66 headR; every part below is
  // pushed a hair proud of that so nothing z-fights with it.
  const glowZ = hz + headR * 0.68;
  glowPart(tGeo(bar(headR * 0.86, headR * 0.075), {
    pos: [0, hy + headR * 0.34, glowZ - headR * 0.06]
  }), EYE);
  for (const s of [1, -1]) {
    // upper pair: long, angled down toward the centre — an angry read
    glowPart(tGeo(bar(headR * 0.44, headR * 0.125), {
      rot: [0, 0, s * 16], pos: [s * headR * 0.34, hy + headR * 0.02, glowZ]
    }), EYE_GLOW);
    // lower pair: short, out on the cheekbones
    glowPart(tGeo(bar(headR * 0.22, headR * 0.080), {
      rot: [0, 0, s * 28], pos: [s * headR * 0.50, hy - headR * 0.34, glowZ - headR * 0.08]
    }), EYE);
  }

  // THE MAW. The lower face SPLITS: two jaw halves hinged at the corners of
  // the mouth swing outward around a lit gullet, with a fang row on each.
  // `setMaw(k)` drives it — this is what makes DEVOUR work, and it is the same
  // sideways motion the old mandibles had, so the clip timing still lands.
  // The gullet sits WELL BACK inside the skull. The first pass put it at the
  // face plane and it read as a dark ball stuck on his nose; a mouth is a hole
  // into a head, so the hole has to be behind the face, not in front of it.
  const mawY = hy - headR * 0.56, mawZ = hz + headR * 0.30;
  const gullet = new THREE.Mesh(
    tGeo(new THREE.SphereGeometry(headR * 0.28, 10, 8), { scale: [1.0, 0.80, 0.72] }),
    new THREE.MeshBasicMaterial({ color: GULLET }));
  gullet.position.set(0, mawY, mawZ - headR * 0.10);
  head.add(gullet);
  // an ember at the back of the throat, so an open mouth is lit rather than a hole
  const throat = new THREE.Mesh(
    tGeo(new THREE.SphereGeometry(headR * 0.18, 8, 6), { scale: [1.0, 0.8, 0.6] }),
    new THREE.MeshBasicMaterial({ color: EYE }));
  throat.position.set(0, mawY, mawZ - headR * 0.04);
  head.add(throat);

  const jaws = [];
  const fangs = [];
  for (const s of [1, -1]) {
    const hinge = new THREE.Group();
    hinge.position.set(s * headR * 0.30, mawY + headR * 0.14, mawZ - headR * 0.04);
    head.add(hinge);
    // the jaw half: a flat wedge of flesh sweeping inward to the chin. Closed,
    // the pair meets on the centreline and hides the gullet completely — the
    // whole point of DEVOUR is that you only see inside him when he opens.
    // FLAT and WIDE. Round halves at even a modest radius read as two balls
    // stuck to his chin under cel banding, which is exactly what the first
    // pass produced — a jaw is a shelf, not a pair of spheres.
    // WIDE IN X, SHALLOW IN Z. Deep halves swing forward off the hinge and hang
    // past the chin as two prongs however they are rotated; shallow ones split
    // ACROSS the face, which is the read this maw is supposed to have.
    const half = mk(tGeo(new THREE.SphereGeometry(headR * 0.34, 10, 8), { scale: [1.06, 0.36, 0.54] }),
      charMat, CHAR);
    half.position.set(-s * headR * 0.14, -headR * 0.05, headR * 0.10);
    hinge.add(half);
    for (let i = 0; i < 4; i++) {
      const tooth = mk(coneSpike(headR * 0.034, headR * 0.13, v3(0, 0, 0), { radial: 4, hSeg: 2 }),
        charMat, FANG);
      tooth.rotation.x = 172 * DEG;
      tooth.position.set(-s * headR * (0.03 + i * 0.09), headR * 0.06, headR * (0.30 - i * 0.06));
      hinge.add(tooth);
      fangs.push({ node: tooth, side: s, i });
    }
    jaws.push({ node: hinge, side: s });
  }

  // =========================================================================
  // RUNTIME CONTROLS
  // =========================================================================
  // GROWTH. Reused wholesale from Mahoraga's ruling: the visual scale changes
  // and NOTHING about navigation does. His body radius and his wall probe stay
  // human, so a stage-3 Kurourushi can physically go everywhere a stage-0 one
  // can and "stuck in the Shibuya ticket hall" is impossible by construction
  // rather than by testing. The size lives in the hurt capsule, the reach
  // numbers, the push radius and the camera — see characters/kurourushi.js.
  let growth = 1, growthShown = 1;
  let stage = 0;
  let maw = 0, mawShown = 0;
  let wingK = 0, wingShown = 0;
  let t = 0;
  const swordNode = model.props.get('festering')?.node ?? null;

  model.setGrowth = k => { growth = k; };
  model.setStage = n => {
    stage = n;
    // The read the Gluttony design asks for: the opponent must be able to see
    // how far gone he is at a glance, without parsing a bar.
    const thick = 1 + n * 0.12;
    for (const f of flares) f.scale.set(thick, thick, 1 + n * 0.06);
    for (const s of segs) s.scale.setScalar(1 + n * 0.045);
    // and one more fang per side articulates per stage
    fangs.forEach(f => { f.node.visible = f.i < 2 + n; });
  };
  // Toggle the blade without deleting it. Nothing ships calling this yet — it
  // exists so a future "he loses the sword" beat does not have to rebuild him.
  model.setSword = v => { if (swordNode) swordNode.visible = !!v; };
  model.setMaw = k => { maw = Math.max(0, Math.min(1, k)); };
  model.setWings = k => { wingK = Math.max(0, Math.min(1, k)); };
  model.setStage(0);

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    t += dt;
    growthShown += (growth - growthShown) * Math.min(1, dt * 3.4);
    model.group.scale.setScalar(growthShown);

    // THE EMBER PULSE. The face is the brightest thing on him and it BREATHES
    // — a slow swell with a faster flicker riding on it — and it burns harder
    // at every growth stage. This replaces the old chitin hue cycle, which
    // existed only to stop jet black reading as a hole and has nothing to do
    // with flesh.
    const pulse = 0.80 + Math.sin(t * 1.9) * 0.10 + Math.sin(t * 11.3) * 0.04 + stage * 0.09;
    for (const g of faceGlow) g.material.color.setHex(g.userData.base).multiplyScalar(pulse);
    throat.material.color.setHex(EYE).multiplyScalar(0.55 + mawShown * 0.55);

    // the mantle lags: a wave down the panels driven by his own motion
    const sway = Math.sin(t * 2.1) * 0.075;
    segs.forEach((s, i) => {
      const k = 1 - i / segs.length;
      s.rotation.y = sway * k * (i % 2 ? 1 : -1);
      s.rotation.x = -0.12 + Math.sin(t * 1.5 - i * 0.5) * 0.045 * k;
    });

    // the maw
    mawShown += (maw - mawShown) * Math.min(1, dt * 14);
    // OPEN DOWN AND OUT, NOT FORWARD. Swinging the halves out on Y while also
    // pitching them forward on X threw them off the front of his neck as two
    // prongs — a pair of tusks, not a mouth. Dropping them (negative X) opens a
    // hole into the head, which is what the lit gullet behind is there for.
    for (const j of jaws) {
      j.node.rotation.y = j.side * mawShown * 0.85;
      j.node.rotation.z = j.side * mawShown * 0.16;
      j.node.rotation.x = -mawShown * 0.80;
    }
    gullet.scale.setScalar(0.8 + mawShown * 0.85);
    throat.scale.setScalar(0.5 + mawShown * 1.4);

    // the shoulder halves and the cursed-energy veil between them
    wingShown += (wingK - wingShown) * Math.min(1, dt * 9);
    for (let i = 0; i < flares.length; i++) {
      // AT REST THE HALVES LIE FLAT DOWN HIS BACK. Left at zero they stood off
      // him like two boards; the rest angle is what makes them read as cloth.
      flares[i].rotation.x = -0.18 + wingShown * 0.95;
      flares[i].rotation.y = veils[i].side * wingShown * 0.55;
      const v = veils[i].node;
      v.visible = wingShown > 0.02;
      v.scale.setScalar(0.01 + wingShown * 0.99);
      v.rotation.y = veils[i].side * (0.5 + Math.sin(t * 6) * wingShown * 0.14);
    }

    // the sword weeps
    if (swordNode?.userData.tick) swordNode.userData.tick(t, dt);
  };
  return model;
}

// ---------------------------------------------------------------------------
// THE FESTERING LIFE SWORD
// ---------------------------------------------------------------------------
// Original design — there is no canon weapon of this name. Built as a GROWTH
// rather than as a forged object, which is the whole idea: it has no guard and
// no pommel, the grip is sinew fused into the hand, and the blade is bone that
// is visibly rotting from the root up.
//
// The gradient is the "texture", and it is painted into the VERTEX COLOURS by
// a function of height rather than by a map — the project's assets are all
// procedural by hard requirement, so there is no image to sample. Pale
// diseased ivory at the tip, deepening through jaundiced amber, to wet red rot
// where it meets his hand.
//
// Built pointing +Y from the origin, the convention the rest of the roster's
// props use (see nanami.js), so the attachment rotations read the same way.
function buildFesteringLifeSword(H, palette) {
  const g = new THREE.Group();
  const oOpts = { color: palette.outline ?? 0x0a0406, thickness: 0.009 };
  const boneMat = MAT.metal({ steps: [52, 128, 210, 255], rim: 0.50, rimStart: 0.62, gloss: 0.42, rimColor: 0xffd0a8 });
  const sinewMat = fleshMaterial({ steps: [40, 96, 180], rim: 0.36, gloss: 0.30 });

  // The middle tone matters more than either end. The first pass ran a clean
  // #9a6f3c through the belly of the blade and the whole thing read as POLISHED
  // BRASS — a treasure, which is the opposite of the brief. A desaturated,
  // slightly green-grey sick tone is what makes the same gradient read as
  // something going bad rather than something valuable.
  const BONE = new THREE.Color(0xd6c9b4);
  const AMBER = new THREE.Color(0x6d6248);
  const ROT = new THREE.Color(0x5a1218);
  const GRIP = 0x3a1216;
  const WEEP = 0xff8a2e;

  const add = (geo, mat, color) => {
    const n = geo.index ? geo.toNonIndexed() : geo;
    const p = n.getAttribute('position');
    const cnt = p.count;
    const arr = new Float32Array(cnt * 3);
    const fn = typeof color === 'function' ? color : null;
    const c = fn ? new THREE.Color() : new THREE.Color(color);
    for (let i = 0; i < cnt; i++) {
      const cc = fn ? fn(p.getX(i), p.getY(i), p.getZ(i), c) : c;
      arr[i * 3] = cc.r; arr[i * 3 + 1] = cc.g; arr[i * 3 + 2] = cc.b;
    }
    n.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    n.computeVertexNormals();
    const mesh = new THREE.Mesh(n, mat);
    g.add(mesh, makeOutline(mesh, oOpts));
    return mesh;
  };

  const gripLen = 0.105 * H;
  const bladeBase = gripLen + 0.028 * H;
  const bladeTip = 0.720 * H;      // long and thin, as in the reference

  // ---- grip: sinew, not leather -------------------------------------------
  add(tGeo(new THREE.CylinderGeometry(0.017 * H, 0.014 * H, gripLen, 8),
    { pos: [0, gripLen * 0.5, 0] }), sinewMat, GRIP);
  // four cords wound up it, each a hair proud so they catch a band
  for (let i = 0; i < 4; i++) {
    add(tGeo(new THREE.TorusGeometry(0.017 * H, 0.0042 * H, 5, 12),
      { rot: [88, 0, i * 12], pos: [0, 0.016 * H + i * 0.024 * H, 0] }), sinewMat, 0x5e1220);
  }
  // ---- the collar: a knot of fused flesh where blade meets hand ------------
  add(tGeo(new THREE.SphereGeometry(0.030 * H, 10, 8), { scale: [1.05, 0.62, 0.72], pos: [0, bladeBase - 0.010 * H, 0] }),
    sinewMat, 0x5e1220);
  // three tendons running off the collar onto the blade's root — the join is a
  // graft, so it should look like one rather than like a socket
  for (let i = 0; i < 3; i++) {
    const s = i - 1;
    add(tubeBetween(v3(s * 0.014 * H, bladeBase - 0.006 * H, 0),
      v3(s * 0.008 * H, bladeBase + 0.075 * H, 0.002 * H),
      [0.0060 * H, 0.0022 * H], { radial: 5, hSeg: 3 }), sinewMat, 0x7a1a24);
  }

  // ---- the blade -----------------------------------------------------------
  // A slight curve, built as a ribbon through three control points so the
  // silhouette bends the way the reference's does rather than being a ruler.
  const span = bladeTip - bladeBase;
  const bladeColor = (x, yy, z, c) => {
    const u = Math.max(0, Math.min(1, (yy - bladeBase) / span));
    // rot at the root -> amber through the middle -> pale bone at the tip
    return u < 0.5 ? c.copy(ROT).lerp(AMBER, u * 2) : c.copy(AMBER).lerp(BONE, (u - 0.5) * 2);
  };
  add(ribbonShell([
    v3(0, bladeBase, 0),
    v3(0.016 * H, bladeBase + span * 0.50, 0.008 * H),
    v3(0.044 * H, bladeTip, 0.016 * H)
  ], u => 0.046 * H * (1 - u * 0.86), 0.014 * H, { seg: 14, normalHint: v3(0, 0, 1) }),
    boneMat, bladeColor);

  // ---- the pitting ---------------------------------------------------------
  // Irregular bites taken out of the cutting edge. Placed on a fixed
  // pseudo-random walk rather than evenly: an even row reads as serration,
  // which is a designed feature — this is supposed to read as DECAY.
  const bite = [0.10, 0.19, 0.24, 0.38, 0.47, 0.51, 0.66, 0.79];
  for (let i = 0; i < bite.length; i++) {
    const u = bite[i];
    const yy = bladeBase + span * u;
    const w = 0.046 * H * (1 - u * 0.86);
    const side = i % 3 === 0 ? -1 : 1;
    add(tGeo(new THREE.SphereGeometry(0.008 * H * (1 - u * 0.5), 6, 5),
      { scale: [1.0, 1.5 + (i % 2) * 0.7, 0.5], pos: [side * w * 0.48 + 0.016 * H * u, yy, 0.006 * H * u] }),
      boneMat, 0x2a1418);
  }

  // ---- the weeping veins ---------------------------------------------------
  // Three lines down the fuller that pulse. Flat and unlit so they stay legible
  // against the blade at any angle, and NOT additive — three overlapping
  // additive strips at a glancing angle blow straight out to white.
  const veinMat = new THREE.MeshBasicMaterial({ color: WEEP });
  const veins = [];
  for (let i = 0; i < 3; i++) {
    const off = (i - 1) * 0.012 * H;
    const v = new THREE.Mesh(ribbonShell([
      v3(off, bladeBase + span * 0.04, 0.008 * H),
      v3(off + 0.014 * H, bladeBase + span * 0.50, 0.014 * H),
      v3(off + 0.036 * H, bladeBase + span * (0.86 - i * 0.10), 0.018 * H)
    ], u => 0.0060 * H * (1 - u * 0.7), 0.003 * H, { seg: 10, normalHint: v3(0, 0, 1) }), veinMat);
    g.add(v);
    veins.push(v);
  }

  // ---- the weeping itself --------------------------------------------------
  // Five drops running down the blade on staggered loops. Cheap — five tiny
  // spheres on a modulo — and it is what stops the sword reading as a static
  // prop the moment he holds still, which he does a lot.
  const dropMat = new THREE.MeshBasicMaterial({ color: WEEP, transparent: true, opacity: 0.85, depthWrite: false });
  const drops = [];
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.006 * H, 5, 4), dropMat.clone());
    g.add(d);
    drops.push({ node: d, phase: i / 5, u0: 0.20 + i * 0.15 });
  }

  g.userData.tick = (t) => {
    const pulse = 0.68 + Math.sin(t * 2.6) * 0.22 + Math.sin(t * 9.1) * 0.10;
    veinMat.color.setHex(WEEP).multiplyScalar(Math.max(0.2, pulse));
    for (const d of drops) {
      // travel from where the drop wells up down to the collar, then reset
      const k = (t * 0.34 + d.phase) % 1;
      const u = Math.max(0, d.u0 - k * d.u0);
      const yy = bladeBase + span * u;
      d.node.position.set(0.044 * H * u + 0.004 * H, yy, 0.013 * H);
      d.node.material.opacity = 0.85 * Math.min(1, (1 - k) * 2.4);
      d.node.scale.setScalar(0.7 + k * 0.6);
    }
  };
  return g;
}

// ---------------------------------------------------------------------------
// SPRING CHAINS: the tendrils
// ---------------------------------------------------------------------------
// The reference's defining background element: long, thin, dark-red whips
// radiating out behind him and curving as they go. There are EIGHT — four
// rooted high on the dorsal ridge, two low off the thorax, two off the back of
// the head — and they are long, light and very lightly damped, so they keep
// travelling for a beat after the body stops. That overrun is what makes the
// "skitter and freeze" movement language still land on a body that is no
// longer an insect: he stops dead and the tendrils do not.
function kurourushiSprings(ctx) {
  const H = ctx.spec.H;
  const headR = ctx.m.headR;
  const headJ = ctx.m.joints.get('Head');
  const headC = ctx.m.headC;
  const mat = fleshMaterial({ steps: [40, 96, 186], rim: 0.48, gloss: 0.38 });
  const outline = { color: 0x0a0406, thickness: 0.009 };

  // THE SEGMENT MESH MUST BE DRAWN ALONG `restDir`, NOT ALONG -Y.
  // SpringChain orients each pivot with `setFromUnitVectors(restDir, actualDir)`
  // — so a segment modelled down -Y only lines up with its own chain when
  // restDir IS -Y. Every other character's chains hang straight down (Nanami's
  // tie, Sukuna's hakama tatters) and got away with it; these sweep backwards
  // and outwards, and the first pass rendered them as a scatter of loose rods
  // floating around his shoulders because of exactly this. Passing the rest
  // direction through and building the tube along it is the fix.
  const whip = (len, w, n, dir) => {
    const segs = [];
    for (let i = 0; i < n; i++) {
      const k = 1 - i / n;
      segs.push({
        len,
        mesh: makeSeg(w * k, w * (k - 1 / n), len, dir, mat, i % 2 ? TENDRIL_HI : TENDRIL, outline)
      });
    }
    return segs;
  };

  // One chain, built from its rest direction so the mesh and the physics agree.
  //
  // STIFFNESS IS LOW AND DAMPING IS HEAVY, and that is the opposite of what it
  // looks like it should be. The tendrils have to hold a near-straight fan —
  // sagging into an elbow at every joint made eight tendrils read as eight
  // INSECT LEGS, the one thing this restyle exists to get away from — and the
  // obvious fix, cranking stiffness up, makes it WORSE. SpringChain integrates
  // explicitly (`vel += (target - pos) * stiffness * dt`), so at 60 Hz a
  // stiffness of 150 is a gain of 2.5 per frame and the chain never settles; it
  // oscillates, and the oscillation is the zigzag. Measured settled kink angle
  // on the longest chain, 220 steps from reset:
  //     150 / 0.88 / 0.6  ->  57 deg     (unusable)
  //      60 / 0.80 / 0.5  ->  16 deg
  //      40 / 0.70 / 0.4  ->  12 deg     <- shipped
  //      25 / 0.60 / 0.3  ->   6 deg     (settles straight, but too laggy)
  // 40/0.70/0.4 is the knee: a gentle curve that still travels when he does.
  const chain = (bone, offset, dir, len, w, n, o = {}) => {
    const d = dir.clone().normalize();
    defs.push({
      bone, localOffset: offset, restDir: d,
      segments: whip(len, w, n, d),
      stiffness: o.stiffness ?? 40, damping: o.damping ?? 0.70, gravity: o.gravity ?? 0.4
    });
  };

  const defs = [];
  // FOUR off the dorsal ridge, fanning out and back. The outboard pair is
  // longer and aimed wider — that spread is the whole silhouette from behind.
  for (const s of [1, -1]) {
    for (let i = 0; i < 2; i++) {
      chain('Chest',
        v3(s * (0.038 + i * 0.044) * H, (0.076 - i * 0.030) * H, -0.062 * H),
        v3(s * (0.34 + i * 0.50), 0.34 - i * 0.40, -0.88),
        (0.086 - i * 0.008) * H, 0.013 * H, 7, { gravity: 0.35 });
    }
  }
  // TWO low off the thorax, dropping and trailing
  for (const s of [1, -1]) {
    chain('Chest',
      v3(s * 0.072 * H, -0.034 * H, -0.020 * H),
      v3(s * 0.62, -0.50, -0.61),
      0.076 * H, 0.014 * H, 6, { stiffness: 34, damping: 0.68, gravity: 1.4 });
  }
  // TWO off the back of the head, short and quick — they read as part of the
  // horn crest at rest and fly out the moment he moves
  for (const s of [1, -1]) {
    chain('Head',
      v3(s * headR * 0.44, headC.y - headJ.y + headR * 0.10, headC.z - headJ.z - headR * 0.58),
      v3(s * 0.40, 0.18, -0.90),
      0.062 * H, 0.010 * H, 6, { stiffness: 46, damping: 0.72, gravity: 0.3 });
  }
  return defs;
}

// A tapered flesh segment for a spring chain, pointing along `dir` — see the
// note in kurourushiSprings for why that is not -Y here. Round rather than the
// flat cloth flap the sorcerers use: a tendril is a rod, and a ribbon with a
// spine gives itself away the moment the camera goes side-on.
function makeSeg(w0, w1, len, dir, mat, color, outlineOpts) {
  const geo = tubeBetween(v3(0, 0, 0), dir.clone().multiplyScalar(len),
    [Math.max(0.0006, w0), Math.max(0.0004, w1)], { radial: 6, hSeg: 2 });
  const n = geo.toNonIndexed();
  const cnt = n.getAttribute('position').count;
  const c = new THREE.Color(color);
  const arr = new Float32Array(cnt * 3);
  for (let i = 0; i < cnt; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  n.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  n.computeVertexNormals();
  const grp = new THREE.Group();
  const mesh = new THREE.Mesh(n, mat);
  grp.add(mesh, makeOutline(mesh, outlineOpts));
  return grp;
}
