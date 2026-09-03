// PANDA — 呪骸. AN ABRUPT-MUTATION CURSED CORPSE, built by Masamichi Yaga,
// that happens to look like a giant panda. NOT a real panda and NOT a mascot.
//
// ============================ REFERENCE SHEET ============================
// RESEARCH, AND WHAT I COULD AND COULD NOT DO (2026-08-13). Web research
// across the Jujutsu Kaisen Wiki mirrors, the Heroes Wiki entry, the VS Battles
// profile, a Gamerant explainer on the three cores, the Nerz piece on the
// sister core and an ORICON character profile. I could NOT study reference
// IMAGES — the in-app browser pane is not displayed in this session, so it
// composites no frames and every screenshot attempt timed out. This sheet is
// built from TEXT descriptions cross-checked across six sources, not from
// looking at front / 3-4 / side / back art, and the delivery notes say so in
// the same words. ACCURATE / INFERRED is marked per line.
//
// BUILD    ACCURATE. "The appearance of a fully-grown giant panda", "stands
//          much taller than his classmates with his bear-shaped frame", height
//          given as over 190 cm. Built at 1.98 m with the roster's widest
//          shoulders (0.150·H) and heaviest bulk (1.34).
//          THE RANKING THE BRIEF ASKS FOR, MEASURED off the model files and
//          then verified in a lineup render (shots/lineup2.png):
//            Mahoraga 3.60 >> Kurourushi 2.25 > Hanami 2.15 > Todo 2.00
//            > PANDA 1.98 > Hakari 1.95 > Sukuna 1.94 > Gojo 1.92 > Toji 1.88
//            > Geto 1.86 = Higuruma 1.86 > Nanami 1.845 > Naoya 1.83
//            > Choso 1.81 > KASHIMO 1.79 > Megumi 1.75 = Yuji 1.75
//            > Yuta 1.73 > Nobara 1.62 > Jogo 1.42
//          So: bigger than every student, TWO CENTIMETRES under Todo, and
//          barely half of Mahoraga. He reads as the BULKIEST rather than the
//          tallest, which is the right answer for a bear standing next to a
//          bodybuilder — in the lineup he is visibly the widest thing on the
//          line that is not Mahoraga.
// HEAD     ACCURATE, and it is the entire silhouette. A giant panda's head is
//          nearly SPHERICAL and very wide — wider than the neck by a long way —
//          with a short blunt muzzle. Built as an oversized sphere (headScale
//          1.34, the largest in the roster) with a separate muzzle wedge, and
//          the neck is deliberately almost invisible: a panda has no visible
//          neck and giving him one makes him a man in a suit.
// EARS     ACCURATE — "round ears". They are the second most identifiable
//          thing about him and the most likely to be got wrong: they are BLACK,
//          nearly circular, set WIDE and HIGH on the skull and angled slightly
//          outward, and they are large — roughly a third of the head radius.
//          Small ears read as a bear cub; ears set low read as a dog.
// PATCHES  ACCURATE — the black eye patches are the design. On a giant panda
//          they are large ROUNDED-TEARDROP shapes that are WIDER than they are
//          tall, tilted so the outer end drops toward the cheek, and they do
//          NOT touch the muzzle. The eye sits low and forward inside the patch,
//          which is why a panda's eyes look small — they are small, inside a
//          big black shape. Also black: both ears, both arms and shoulders as a
//          continuous band over the back, and both legs.
// EYES     ACCURATE(small) / INFERRED(expression). Small, dark, bright, set
//          inside the patches. "Bright eyes" and "approachable and endearing"
//          are in the sources and the model has to carry that while the
//          gameplay says he is dangerous — which is exactly the tension the
//          brief asks the animation to hold.
// GARMENT  ACCURATE. He "sometimes dons clothing and has been shown to wear
//          armbands, scarves, and jackets". He is NOT dressed in a school
//          uniform, and giving him one would be wrong. So: the Jujutsu High
//          ARMBANDS on both upper arms, and nothing else. It is the minimum
//          the sources support and it is the detail that says "student" without
//          putting a bear in a blazer.
// GORILLA  ACCURATE. "His build looks much more muscular", "the black spots
//          around his eyes extend to his ears", "his eyes become much more
//          elongated and visible", "its jaw extends forward which makes its
//          teeth more visible and it has two sharp fangs". Every one of those
//          is real geometry that is switched on by `setStance('gorilla')` —
//          see THE THREE BODIES below. Canon also notes the form rapidly
//          drains cursed energy, which is gameplay and lives in the config.
// TRIKE    ACCURATE(shape) / INFERRED(detail). "The appearance of Panda's body
//          becomes more slender and feminine while his head takes on a wide
//          Triceratops shape." So: the body narrows and the head grows a wide
//          FRILL and three horns. The frill is the silhouette and it is built
//          big enough to read from behind.
// PALETTE  fur white #f2f0e8 / shade #d6d3c6 · fur black #1c1c22 / lift
//          #33333d · muzzle #e8e5da · nose #14141a · eye #2a2a33 ·
//          armband #2b3550 with #c8ccd8 trim
//          GORILLA adds a warm tint to the black #2a2620 and brass-ish fang
//          ivory #efe6cc. TRICERATOPS adds the frill's inner flush #d9899f.
// FUR      THE MATERIAL IS THE POINT — see THE FUR SHADER below. He is the
//          only non-human, non-monster body in a roster of uniforms, and if his
//          surface shades like cloth he is a costume.
// IDENTITY 1) a nearly spherical wide head with big round black ears
//          2) the wide tilted teardrop eye patches
//          3) a bear-shaped mass that is round AND athletic, not fat
// =========================================================================
import * as THREE from 'three';
import { buildHumanoid, finalizeModel } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, tubeBetween } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { makeOutline } from '../../shaders/outline.js';
import { v3 } from '../../../core/math.js';

const FUR_W = 0xf2f0e8;
const FUR_WS = 0xd6d3c6;
const FUR_B = 0x1c1c22;
const FUR_BL = 0x33333d;
const MUZZLE = 0xe8e5da;
const NOSE = 0x14141a;
const EYE = 0x2a2a33;
const BAND = 0x2b3550;
const BAND_TRIM = 0xc8ccd8;
const GOR_B = 0x2a2620;
const IVORY = 0xefe6cc;
const FRILL_IN = 0xd9899f;

export function buildPanda() {
  const spec = {
    id: 'panda', name: 'Panda', H: 1.98,
    // THE BIGGEST HEAD IN THE ROSTER, by a distance, and it is not a stylistic
    // choice — a giant panda's skull genuinely is enormous relative to its
    // body, and at the roster's default 1.0 he read as a very large man with
    // ears on.
    headScale: 1.34,
    // PASS 2 — muscle 1.30 -> 1.62. At 1.30 the arms were thin black TUBES and
    // the whole figure read as a mascot costume rather than as an animal. A
    // bear's forelimb is nearly as thick as its own torso, and the arms are the
    // one place a panda cannot be slim without stopping being a panda.
    shoulder: 0.150, hip: 0.072, muscle: 1.62, bulk: 1.40,
    legBulk: 1.58,
    // EVERYTHING IS FUR. `bodySlot`/`armSlot` put the torso and arms in the fur
    // material rather than in cloth — this is the hook the whole material
    // treatment hangs off, and it is why he needed a builder that could be told
    // which slot the body belongs to at all.
    bodySlot: 'fur', armSlot: 'fur',
    skinTone: FUR_W, clothColor: FUR_W, sleeveColor: FUR_B,
    pantColor: FUR_B, shoeColor: FUR_B, handColor: FUR_B,
    torsoShape: { chest: 1.10, waist: 1.14, hip: 1.10 },
    // NO EARS from the builder — a panda's ears are nothing like a human's and
    // are built from scratch below.
    ears: false,
    face: { jaw: 0.88, chin: 0.80, width: 1.16 },
    shoe: { len: 0.100, hgt: 0.060, wid: 0.058 },
    palette: {
      rim: 0xfff4e2, hairRim: 0xfff4e2, outline: 0x0a0a10,
      accent: 0xf2f0e8, energy: 0xd9a94e
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints } = ctx.m;

  // ---- THE HEAD ------------------------------------------------------------
  // The builder's `animeHead` is a human skull. A panda's is a sphere, so the
  // human one is BURIED inside a bigger fur sphere and everything that reads —
  // the muzzle, the patches, the ears — is built on that.
  const SK = { r: headR * 1.02, sx: 1.10, sy: 0.98, sz: 1.02, dz: -headR * 0.04 };
  bag.add('fur', tGeo(new THREE.SphereGeometry(SK.r, 20, 16),
    { scale: [SK.sx, SK.sy, SK.sz], pos: [headC.x, headC.y, headC.z + SK.dz] }),
    { bone: 'Head', color: FUR_W });

  // PASS 2 — EVERY FACE FEATURE IS PLACED ON THE SKULL'S SURFACE, COMPUTED.
  //
  // Pass 1 placed the muzzle, the nose, the mouth and both eye patches against
  // the builder's `faceZ` (headC.z + 0.615·headR), which is the flattened face
  // plane of the HUMAN head — the one that is now buried inside a fur sphere
  // whose front reaches 1.04·headR. Every single feature was therefore INSIDE
  // the skull and the render was a completely blank white ball. It is the same
  // class of mistake as Kashimo's crown bands and it has the same fix: derive
  // the radius instead of inheriting a constant that belonged to different
  // geometry.
  //
  // `surf(dx, dy)` returns the z of the ellipsoid's surface at a given lateral
  // and vertical offset from the skull centre, so a feature can be asked to sit
  // ON the head rather than at a guessed depth. Everything below adds a small
  // proud offset to that.
  const surf = (dx, dy) => {
    const u = dx / (SK.r * SK.sx), v = dy / (SK.r * SK.sy);
    const k = Math.max(0, 1 - u * u - v * v);
    return headC.z + SK.dz + SK.r * SK.sz * Math.sqrt(k);
  };
  const faceZ = surf(0, 0);

  // MUZZLE — short and blunt, and it must NOT reach the eye patches. A muzzle
  // that runs into them turns a panda into a badger.
  const muzY = -headR * 0.34;
  bag.add('fur', tGeo(new THREE.SphereGeometry(headR * 0.42, 14, 12),
    { scale: [1.10, 0.86, 0.90], pos: [0, headC.y + muzY, surf(0, muzY) - headR * 0.14] }),
    { bone: 'Head', color: MUZZLE });
  // nose: a rounded black wedge sitting on the front of the muzzle
  bag.add('flat', tGeo(new THREE.SphereGeometry(headR * 0.125, 10, 8),
    { scale: [1.35, 0.82, 0.7], pos: [0, headC.y - headR * 0.24, surf(0, -headR * 0.24) + headR * 0.13] }),
    { bone: 'Head', color: NOSE });
  // the mouth line under it — one shallow curve, no teeth in the base form
  bag.add('flat', tGeo(roundBox(headR * 0.30, headR * 0.040, 0.004, 0.002),
    { pos: [0, headC.y - headR * 0.48, surf(0, -headR * 0.48) + headR * 0.10] }),
    { bone: 'Head', color: 0x4a3a34 });

  // ---- THE EYE PATCHES -----------------------------------------------------
  // Identity cue #2 and the thing most likely to look wrong. WIDER THAN TALL,
  // tilted so the outer end drops, clear of the muzzle, and large. The eye is
  // small and sits LOW AND FORWARD inside the patch.
  const patchDY = headR * 0.06;
  const patchY = headC.y + patchDY;
  for (const s of [1, -1]) {
    const px = s * headR * 0.44;
    const pz = surf(px, patchDY);
    // WIDER THAN TALL and tilted so the outer end drops. Flattened in z and
    // pushed just proud of the skull so it wraps the surface rather than
    // floating off it.
    bag.add('fur', tGeo(new THREE.SphereGeometry(headR * 0.34, 12, 10),
      { scale: [1.46, 0.80, 0.30], rot: [0, s * -18, s * -30], pos: [px, patchY, pz - headR * 0.10] }),
      { bone: 'Head', color: FUR_B });
    // the eye, small, LOW AND FORWARD inside the patch — which is why a panda's
    // eyes look tiny: they are, and they are inside a very large black shape
    const ez = surf(px, patchDY - headR * 0.08);
    bag.add('flat', tGeo(new THREE.SphereGeometry(headR * 0.098, 10, 8),
      { scale: [1, 1, 0.5], pos: [px + s * headR * 0.02, patchY - headR * 0.08, ez + headR * 0.05] }),
      { bone: 'Head', color: EYE });
    bag.add('flat', tGeo(new THREE.CircleGeometry(headR * 0.032, 8),
      { pos: [px + s * headR * 0.055, patchY - headR * 0.045, ez + headR * 0.09] }),
      { bone: 'Head', color: 0xffffff });
  }

  // ---- THE EARS ------------------------------------------------------------
  // Big, round, BLACK, set wide and high, angled outward. Two discs rather than
  // hemispheres so they keep a hard round outline from every angle — which is
  // what "round ears" has to mean in a silhouette.
  for (const s of [1, -1]) {
    const ex = s * headR * 0.78, ey = headC.y + headR * 0.74, ez = headC.z - headR * 0.14;
    bag.add('fur', tGeo(new THREE.SphereGeometry(headR * 0.32, 12, 10),
      { scale: [1, 1, 0.42], rot: [0, s * -22, s * 12], pos: [ex, ey, ez] }),
      { bone: 'Head', color: FUR_B });
    // a slightly lifted inner disc, so the ear is not a flat black blob
    bag.add('fur', tGeo(new THREE.SphereGeometry(headR * 0.19, 10, 8),
      { scale: [1, 1, 0.36], rot: [0, s * -22, s * 12], pos: [ex, ey, ez + s * 0 + headR * 0.06] }),
      { bone: 'Head', color: FUR_BL });
  }

  // ---- THE BODY ------------------------------------------------------------
  // The builder already made a fur torso from `bodySlot`. What it cannot do is
  // the panda's BLACK BAND — the continuous saddle over the shoulders and down
  // both arms — so that goes on top as a shoulder yoke.
  // PASS 2 — THE SADDLE HAS TO REACH THE ARMS. The first pass stopped the
  // black band at the torso lathe's own radius, which left a white ring of
  // shoulder between the band and the black arms and turned the whole thing
  // into a crop top. On a giant panda the black is CONTINUOUS: it goes over
  // both shoulders, down both arms, and round the chest as one shape. So the
  // band is wider than the torso and two shoulder caps bridge the gap.
  bag.add('fur', tGeo(latheY([
    [0.112 * H, 0.688 * H], [0.118 * H, 0.750 * H], [0.112 * H, 0.812 * H],
    [0.074 * H, 0.848 * H]
  ], 22, 0.96), {}), { bone: 'Chest', color: FUR_B });
  // PASS 3 — THE LIMBS ARE BUILT UP IN THREE PLACES, NOT ONE. Raising `muscle`
  // to 1.62 fattened the upper arm and did almost nothing below the elbow,
  // because the builder tapers every arm to a 0.0165·H wrist regardless — so
  // the 3/4 render still showed two thick shoulders with black STICKS hanging
  // off them. A bear's forelimb barely tapers at all and ends in a paw wider
  // than the wrist, so the shoulder, the forearm and the paw each get their own
  // mass rather than one multiplier being asked to do all three jobs.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    bag.add('fur', tGeo(new THREE.SphereGeometry(0.064 * H, 12, 10),
      { scale: [1.05, 1.0, 1.0], pos: [sh.x, sh.y + 0.006 * H, sh.z] }),
      { bone: 'UpArm' + s, color: FUR_B });
    // FOREARM — a barely-tapering tube over the builder's thin one
    bag.add('fur', tubeBetween(el.clone().lerp(sh, 0.10), wr.clone().lerp(el, -0.08),
      [0.049 * H, 0.043 * H], { bulge: 0.06, hSeg: 5 }),
      { chain: armChain, color: FUR_B, blend: 0.09 });
    // PAW — wider than the wrist, which is the shape that says "bear" rather
    // than "gauntlet"
    bag.add('fur', tGeo(new THREE.SphereGeometry(0.050 * H, 12, 10),
      { scale: [1.0, 1.25, 0.90], pos: [wr.x, wr.y - 0.022 * H, wr.z + 0.004 * H] }),
      { bone: 'Hand' + s, color: FUR_B });
  }
  // ...and the round belly, which is what stops him reading as a bodybuilder
  // in a bear head. Round AND athletic: wide at the waist and still tapering.
  bag.add('fur', tGeo(new THREE.SphereGeometry(0.104 * H, 16, 14),
    { scale: [1.08, 0.94, 0.90], pos: [0, 0.582 * H, 0.012 * H] }),
    { bone: 'Spine', color: FUR_W });
  // THE HIPS AND HAUNCHES ARE BLACK, and this is not decoration — the first
  // pass left the white torso lathe running down between two black legs and it
  // read as a nappy. On a giant panda the legs' black runs UP over the haunch
  // and meets the saddle at the flank, so the white belly is an island.
  bag.add('fur', tGeo(latheY([
    [0.086 * H, 0.400 * H], [0.098 * H, 0.452 * H], [0.100 * H, 0.500 * H],
    [0.092 * H, 0.545 * H]
  ], 20, 0.94), {}), { bone: 'Hips', color: FUR_B });
  for (const s of ['L', 'R']) {
    const hp = joints.get('Thigh' + s);
    // PASS 3 — bigger and dropped 0.030·H. A panda's leg is short and the mass
    // sits at the haunch; at the first pass's size and height the sphere was
    // inside the hip lathe and the legs read as long black trousers.
    bag.add('fur', tGeo(new THREE.SphereGeometry(0.086 * H, 14, 12),
      { scale: [1.02, 1.20, 1.06], pos: [hp.x * 1.08, hp.y - 0.030 * H, hp.z] }),
      { bone: 'Thigh' + s, color: FUR_B });
  }

  // THE ARMBANDS — the one garment, and the only thing that says "student".
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s);
    const p = sh.clone().lerp(el, 0.46);
    const tilt = (s === 'L' ? 1 : -1);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.049 * H, 0.049 * H, 0.052 * H, 14),
      { rot: [4, 0, tilt * 13], pos: [p.x, p.y, p.z] }), { bone: 'UpArm' + s, color: BAND });
    for (const o of [-0.021, 0.021]) {
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.0505 * H, 0.0505 * H, 0.008 * H, 14),
        { rot: [4, 0, tilt * 13], pos: [p.x, p.y + o * H, p.z] }),
        { bone: 'UpArm' + s, color: BAND_TRIM });
    }
  }

  // a short round tail, because a panda has one and its absence is noticeable
  // from behind — which is one of the four angles this gets judged from
  bag.add('fur', tGeo(new THREE.SphereGeometry(0.030 * H, 10, 8),
    { scale: [1.1, 0.9, 0.8], pos: [0, 0.470 * H, -0.086 * H] }), { bone: 'Hips', color: FUR_W });

  // ---- THE FUR SHADER ------------------------------------------------------
  // "Fur needs a distinct material treatment in the toon shader: softer shading
  // falloff than the cloth and skin materials so he reads as a different
  // surface entirely."
  //
  // The shared `MAT.cloth` and `MAT.skin` are BANDED cel shaders — hard steps
  // between two or three light levels, which is what makes a uniform read as
  // fabric. Fur has no hard terminator: it is a mass of fibres, so the
  // light-to-dark transition smears over a wide angle and the rim is much
  // brighter and much wider than on cloth because light passes THROUGH the
  // outer fibres.
  //
  // So `MAT.fur` is a FIFTH ARCHETYPE in shaders/toon.js alongside skin, cloth,
  // hair and metal, and the reasoning for each of its three numbers is written
  // out there rather than here. The short version: five soft bands on a raised
  // floor instead of three hard ones, a rim that is twice as strong and starts
  // eighteen points earlier, and no gloss at all.
  //
  // MY FIRST ATTEMPT WAS TO REUSE `MAT.hair` AND PUSH UNIFORMS ON IT, on the
  // reasoning that hair and fur are the same material problem. That was wrong
  // twice over: the uniforms I was setting (`uBands`, `uSoft`) DO NOT EXIST in
  // this shader — its softness is expressed through the band TEXTURE, not
  // through a uniform, so every one of those lines was a silent no-op — and
  // hair carries a GLOSS term that is exactly what would have made him look
  // like a man in a costume. Reading the shader before tuning it is the whole
  // lesson.
  const furMat = MAT.fur({ rimColor: 0xfff4e2 });

  const model = finalizeModel(ctx, {
    materials: { fur: furMat },
    // A THICKER OUTLINE THAN ANYONE ELSE. He is a big rounded mass with almost
    // no internal detail, and at the roster's 0.012 his silhouette dissolved
    // into the arena at fighting distance. 0.016 is what a shape this simple
    // needs to hold its own edge.
    outlineThickness: 0.016, outlineHairScale: 1.0,
    outlineSlots: ['fur', 'skin', 'cloth', 'hair']
  });

  // ---- THE THREE BODIES ----------------------------------------------------
  // "The Gorilla stance should visibly change his posture, mass distribution,
  // and bulk — build it as a real transformation of the pose and, if the design
  // supports it, some geometry change, not just a different animation set."
  //
  // It is both. The POSE change is in art/anim/panda.js (three complete stance
  // sets). The GEOMETRY change is here, and it is real added mass rather than a
  // scale: each stance owns a group of extra meshes that is switched on with
  // it, so the Gorilla's jaw, fangs and shoulder mass and the Triceratops's
  // frill and horns are genuinely there or genuinely not.
  //
  // Everything is built ONCE at construction and toggled. Rebuilding geometry
  // on a stance swap would put a hitch in the middle of a 26-frame window that
  // is already the character's biggest risk.
  const stanceGroups = {};
  const mkGroup = () => { const g = new THREE.Group(); g.visible = false; return g; };

  // The extra parts hang off BONES rather than off model.group, so they follow
  // the animation. Bone-local space is offset from the space `bag` geometry was
  // authored in, so each group is shifted by (author origin - bone position)
  // once, here, rather than being guessed per mesh.
  const headBone = model.getBone('Head');
  const chestBone = model.getBone('Chest');
  const hj = joints.get('Head'), cj = joints.get('Chest');

  // PASS 3 — THE STANCE GEOMETRY IS SHADED AND OUTLINED LIKE THE REST OF HIM.
  //
  // The first pass built these parts with `MeshBasicMaterial`, which is unlit:
  // the Gorilla's jaw and brow rendered as flat black holes hanging off a
  // toon-shaded head, and none of the extra geometry had an inverted-hull
  // outline while every other surface on him did. At fighting distance the
  // transformation read as damage rather than as a body.
  //
  // So each part gets a real `MAT.fur` in its own colour (vertexColors OFF,
  // because these are single-colour meshes rather than bag geometry carrying a
  // colour attribute — a vertex-coloured toon material on a mesh with no colour
  // attribute renders black, which is its own trap) and an outline hull to
  // match. Materials are cached per colour so three horns share one.
  const stanceMats = new Map();
  const furMat2 = c => {
    if (!stanceMats.has(c)) {
      stanceMats.set(c, MAT.fur({ rimColor: 0xfff4e2, vertexColors: false, color: c }));
    }
    return stanceMats.get(c);
  };
  // build a mesh + its outline into a group, so the caller adds one thing
  const part = (geo, color, outline = true) => {
    const mesh = new THREE.Mesh(geo, furMat2(color));
    if (!outline) return mesh;
    const g = new THREE.Group();
    g.add(mesh);
    g.add(makeOutline(mesh, { color: spec.palette.outline, thickness: 0.014 }));
    return g;
  };
  // kept for the small flat details (the gorilla's eye slits) that must stay
  // unlit and outline-free — a 2 cm quad with a hull round it is a black dot
  const furMesh = c => new THREE.MeshBasicMaterial({ color: c });

  // ---- GORILLA -------------------------------------------------------------
  {
    const g = mkGroup();
    g.position.set(-hj.x, -hj.y, -hj.z);
    // THE JAW, EXTENDED FORWARD. Canon: "its jaw extends forward which makes
    // its teeth more visible and it has two sharp fangs."
    const jaw = part(new THREE.SphereGeometry(headR * 0.42, 14, 12), GOR_B);
    jaw.scale.set(1.02, 0.66, 1.22);
    jaw.position.set(0, headC.y - headR * 0.40, faceZ + headR * 0.06);
    g.add(jaw);
    // the brow ridge, heavy and low over the eyes
    // PASS 4 — a ROUNDED ridge, not a box. As a BoxGeometry it read as a
    // visor bolted across his face; a squashed sphere reads as bone under skin,
    // which is what a brow ridge is.
    const brow = part(new THREE.SphereGeometry(headR * 0.46, 14, 10), GOR_B);
    brow.scale.set(1.55, 0.42, 0.62);
    brow.position.set(0, headC.y + headR * 0.24, faceZ - headR * 0.20);
    g.add(brow);
    // TWO SHARP FANGS
    for (const s of [1, -1]) {
      const fang = part(new THREE.ConeGeometry(headR * 0.055, headR * 0.20, 6), IVORY);
      fang.rotation.x = Math.PI;
      fang.position.set(s * headR * 0.19, headC.y - headR * 0.46, faceZ + headR * 0.30);
      g.add(fang);
    }
    // the tooth row between them
    const teeth = part(new THREE.BoxGeometry(headR * 0.46, headR * 0.075, headR * 0.06), IVORY, false);
    teeth.position.set(0, headC.y - headR * 0.43, faceZ + headR * 0.32);
    g.add(teeth);
    // ELONGATED EYES — canon says they become "much more elongated and
    // visible", so two bright slits are laid over the small round base eyes
    for (const s of [1, -1]) {
      const eye = new THREE.Mesh(new THREE.PlaneGeometry(headR * 0.26, headR * 0.085), furMesh(0xffe9b0));
      eye.rotation.z = s * -0.30;
      eye.position.set(s * headR * 0.44, patchY - headR * 0.06, faceZ + headR * 0.20);
      g.add(eye);
    }
    // ...and the patches extending INTO the ears, which is the specific canon
    // detail and the one that makes the head read as a different animal
    for (const s of [1, -1]) {
      const bridge = part(new THREE.BoxGeometry(headR * 0.20, headR * 0.30, headR * 0.30), GOR_B, false);
      bridge.rotation.z = s * -0.5;
      bridge.position.set(s * headR * 0.64, headC.y + headR * 0.40, headC.z + headR * 0.10);
      g.add(bridge);
    }
    headBone.add(g);
    stanceGroups.gorilla = [g];

    // SHOULDER AND BACK MASS, on the chest bone. This is the "mass
    // distribution" half: a gorilla carries its bulk high and forward, so the
    // silhouette gains a hump behind the neck and two enormous deltoids.
    const gb = mkGroup();
    gb.position.set(-cj.x, -cj.y, -cj.z);
    const hump = part(new THREE.SphereGeometry(0.082 * H, 14, 12), GOR_B);
    hump.scale.set(1.5, 0.86, 1.0);
    hump.position.set(0, 0.800 * H, -0.030 * H);
    gb.add(hump);
    for (const s of [1, -1]) {
      const delt = part(new THREE.SphereGeometry(0.062 * H, 12, 10), GOR_B);
      delt.scale.set(1.1, 1.0, 1.0);
      delt.position.set(s * 0.148 * H, 0.786 * H, 0.004 * H);
      gb.add(delt);
      // and a forearm bulk, because a gorilla's arms are the whole animal
      const arm = part(new THREE.SphereGeometry(0.052 * H, 12, 10), GOR_B);
      arm.scale.set(1.0, 1.5, 1.0);
      arm.position.set(s * 0.174 * H, 0.686 * H, 0.010 * H);
      gb.add(arm);
    }
    chestBone.add(gb);
    stanceGroups.gorilla.push(gb);
  }

  // ---- TRICERATOPS ---------------------------------------------------------
  {
    const g = mkGroup();
    g.position.set(-hj.x, -hj.y, -hj.z);
    // THE FRILL. Canon gives "a wide Triceratops shape" for the head and
    // nothing else, so the frill is where the invention went — and it is built
    // BIG, because it is the only thing that can carry a silhouette change
    // this stance needs to read from behind.
    // PASS 4 — 1.62 -> 2.15 headR and pushed back and up. At the first size it
    // sat BEHIND the head and the head hid it: the render showed a panda with a
    // few white spikes over its ears and no frill at all. A frill has to be
    // wider than the skull or it is not a silhouette, and this stance has
    // nothing else carrying one.
    const frill = part(new THREE.CylinderGeometry(headR * 2.15, headR * 1.30, headR * 0.18, 20, 1, false,
      -Math.PI * 0.62, Math.PI * 1.24), FUR_WS);
    frill.rotation.set(Math.PI / 2 - 0.42, 0, 0);
    frill.position.set(0, headC.y + headR * 0.46, headC.z - headR * 0.66);
    g.add(frill);
    const frillIn = part(new THREE.CylinderGeometry(headR * 1.80, headR * 1.10, headR * 0.11, 20, 1, false,
      -Math.PI * 0.60, Math.PI * 1.20), FRILL_IN, false);
    frillIn.rotation.copy(frill.rotation);
    frillIn.position.set(0, headC.y + headR * 0.44, headC.z - headR * 0.56);
    g.add(frillIn);
    // scallops around the frill's edge — a plain disc reads as a satellite dish
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.56 + (i / 8) * Math.PI * 1.12;
      const k = part(new THREE.ConeGeometry(headR * 0.17, headR * 0.34, 5), FUR_WS, false);
      k.position.set(Math.sin(a) * headR * 2.10, headC.y + headR * 0.46 + Math.cos(a) * headR * 1.62, headC.z - headR * 0.66);
      k.rotation.z = -a;
      k.rotation.x = -0.30;
      g.add(k);
    }
    // THREE HORNS: two long brow horns and a short nose horn.
    for (const s of [1, -1]) {
      const horn = part(new THREE.ConeGeometry(headR * 0.10, headR * 0.86, 7), IVORY);
      horn.rotation.set(-1.05, 0, s * -0.30);
      horn.position.set(s * headR * 0.46, headC.y + headR * 0.30, faceZ + headR * 0.14);
      g.add(horn);
    }
    const nub = part(new THREE.ConeGeometry(headR * 0.11, headR * 0.34, 7), IVORY);
    nub.rotation.x = -0.65;
    nub.position.set(0, headC.y - headR * 0.20, faceZ + headR * 0.10);
    g.add(nub);
    // a BEAK over the muzzle, which is the other half of "a wide Triceratops
    // shape" — the head is not just a panda head with horns glued on
    const beak = part(new THREE.ConeGeometry(headR * 0.26, headR * 0.40, 6), FUR_WS);
    beak.rotation.x = Math.PI / 2 + 0.25;
    beak.position.set(0, headC.y - headR * 0.42, faceZ + headR * 0.08);
    g.add(beak);
    headBone.add(g);
    stanceGroups.trike = [g];
  }

  // ---- THE STANCE SWITCH ---------------------------------------------------
  // One method, called by Fighter._setStance. `all` (the ultimate's stance)
  // deliberately shows the GORILLA parts: he is drawing on every core at once
  // and the gorilla is the one whose geometry says "more", so the ultimate
  // reads as an escalation rather than as a reversion to the base body.
  let stance = 'panda';
  model.setStance = key => {
    stance = key;
    const show = key === 'all' ? 'gorilla' : key;
    for (const [k, list] of Object.entries(stanceGroups)) {
      for (const g of list) g.visible = (k === show);
    }
  };
  model.stance = () => stance;
  model.setStance('panda');

  // ---- THREE CORES, ONE BODY ----------------------------------------------
  // The ultimate's tell: three rings at different heights in the three core
  // colours, turning at different rates, so a Panda drawing on all three is
  // unmistakable from any angle and at any distance.
  const auraRings = new THREE.Group();
  auraRings.visible = false;
  {
    const cols = [0xf2f0e8, 0xd9a94e, 0xe08aa8];
    for (let k = 0; k < 3; k++) {
      const ring = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        color: cols[k], transparent: true, opacity: 0.72,
        depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
      });
      const r = 0.86 - k * 0.08;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const t = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.24), mat);
        t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        t.rotation.set(-Math.PI / 2, 0, -a);
        ring.add(t);
      }
      ring.position.y = 0.24 + k * 0.72;
      ring.userData.spin = (k % 2 ? -1 : 1) * (1.4 + k * 0.7);
      auraRings.add(ring);
    }
    model.group.add(auraRings);
  }
  model.setAllCores = on => { auraRings.visible = !!on; };

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    if (!auraRings.visible) return;
    for (const r of auraRings.children) r.rotation.y += dt * r.userData.spin;
  };

  return model;
}
