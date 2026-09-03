// ============================================================================
// HAKARI KINJI — REFERENCE SHEET
// ----------------------------------------------------------------------------
// RESEARCHED, not modelled from memory. Sources used (July 2026):
//   Jujutsu Kaisen Wiki (Kinji Hakari) via the ORICON profile digest, the
//   Heroes Wiki entry, jjkcharacters.org, quotetheanime.com, and the Idle
//   Death Gamble technique pages. No official turnaround / model sheet with
//   front-3/4-side-back views is published anywhere I could reach, so the back
//   of the hair and the back of the coat are reasoned from the front and side
//   art rather than copied — flagged again in the notes at the bottom.
//
// BUILD AND HEIGHT (relative to this roster)
//   Canon gives no databook height; every source calls him "a tall young man"
//   with a heavy muscular build, and he reads as one of the biggest students.
//   H = 1.95. Lineup: Yuta 1.73 < Yuji/Megumi/Mahito 1.75 < Nanami 1.845 <
//   Gojo 1.92 < HAKARI 1.95 < Todo 2.00. Bigger than Yuji, smaller than Todo,
//   exactly as briefed — and unlike Gojo, who is tall and LEAN, Hakari carries
//   Todo-class mass on a slightly shorter frame: shoulder 0.122 against Gojo's
//   0.099 and Todo's 0.132, muscle 1.28, bulk 1.10.
//
// HEAD AND FACE
//   Older-looking than the other students: a broad squared jaw, heavy cheek
//   structure, a chin that does not taper to a point. SMALL eyes — noticeably
//   smaller than anyone else in the cast, which is half of why he reads as an
//   adult. Irises are MAGENTA (#d23a86), the only pink-eyed character here.
//   Eyebrows are THIN and slitted, set low and close to the lash line, not the
//   thick slabs Todo and Yuji wear. Permanent unshaven stubble: a thin
//   moustache line above the lip and a light shadow along the jaw.
//
// HAIR — the main identifier, and the thing most likely to come out wrong
//   NOT a pompadour and NOT spikes. Canon: hair dyed blonde and shaped into a
//   "puffy, tapered afro that slicks back toward the rear of his head."
//     FRONT:  a rounded blonde mass rising off the forehead with a clean hard
//             hairline well above the brows; widest at temple height; the
//             sides are FADED SHORT so the mass sits on top of a taper rather
//             than hanging past the ears.
//     SIDE:   the silhouette is the tell. It starts low at the forehead, rises
//             over the crown, and keeps GROWING backward — the deepest point
//             of the volume is behind the ear, not above it. Reads as swept.
//     BACK:   a full rounded dome, wider than the skull, dropping into the
//             faded nape with a visible step where the taper starts.
//     TOP:    egg-shaped, long axis front-to-back.
//   Surface is CLUMPED, not spiked: short fat lobes, every one of them bent
//   backwards. His Jujutsu High flashback hair (black, twisted locks, fade) is
//   deliberately not modelled — the blonde is the current design.
//
// GARMENT LAYERS (all real geometry, no painted-on layers)
//   1. White ribbed TANK TOP, worn as the innermost torso surface.
//   2. Heavy dark FUR COAT over it, hanging open: two lapel slabs form a deep
//      V so the tank shows between them, a closed skirt from the ribs down to
//      mid-thigh, full sleeves, and a plush collar that drapes off the
//      shoulders. The fur is modelled as rings of overlapping lobes at the
//      collar, the cuffs and the hem — the three places it actually shows.
//   3. Grey trousers.
//   4. Light cream BOOTS, chunkier than the roster's shoes.
//
// PALETTE (hex)
//   skin        #c9986e   tan, the darkest in the roster after Todo
//   hair        #e3c87f   bleached blonde
//   hair taper  #8a6d3a   the faded sides / roots
//   coat        #23212c   near-black with a violet cast
//   coat fur    #34313f   the plush trim, lifted so it separates from the coat
//   coat lining #171620
//   tank        #e9e4d8   off-white
//   trousers    #6d6d78   mid grey
//   boots       #d3c7ac   cream
//   eyes        #d23a86   magenta
//   accent      #ffc93c   pachinko gold — HUD, aura, energy, jackpot
//
// INSTANTLY IDENTIFIABLE — the three things that must survive at fighting range
//   1. The blonde swept-back afro mass over a hard fade.
//   2. The black fur coat silhouette: plush collar off the shoulders, white
//      wedge of tank down the middle, heavy skirt.
//   3. The loose brash posture — weight on the back foot, hands low, chin up.
//
// JACKPOT is a material-and-effect variant of THIS mesh: gold emissive pushed
// into the existing materials, an additive gold rim hull over every body slot,
// and cursed-energy bands on the forearms. No second model.
// ============================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, coneSpike, sphereShell, roundBox } from '../builders/geo.js';
import { MAT } from '../../shaders/toon.js';
import { v3 } from '../../../core/math.js';

const COAT = 0x23212c;
const COAT_FUR = 0x34313f;
const COAT_LINE = 0x171620;
const TANK = 0xe9e4d8;
const PANT = 0x6d6d78;
const BOOT = 0xd3c7ac;
const HAIR = 0xe3c87f;
// The faded sides read as SHORT HAIR, so they have to separate from both the
// blonde above and the tan skin below. An earlier value sat between the two
// and the back of his head rendered as bald.
const HAIR_DK = 0x7d5a1e;
const SKIN = 0xc9986e;
const STUBBLE = 0x6a5238;
const GOLD = 0xffc93c;

// Additive gold rim hull: the same inverted-hull trick the outline pass uses,
// but blended rather than solid, so the whole silhouette lights up from the
// inside during Jackpot. Shares geometry and skeleton with the source mesh.
const GOLD_VERT = /* glsl */`
uniform float uThickness;
#include <common>
#include <skinning_pars_vertex>
void main() {
  #include <skinbase_vertex>
  vec3 objectNormal = vec3( normal );
  #include <skinnormal_vertex>
  vec3 transformed = vec3( position );
  #include <skinning_vertex>
  transformed += normalize( objectNormal ) * uThickness;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );
}`;
const GOLD_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uOpacity;
void main() { gl_FragColor = vec4( uColor, uOpacity ); }`;

function goldHull(src, thickness) {
  const mat = new THREE.ShaderMaterial({
    vertexShader: GOLD_VERT, fragmentShader: GOLD_FRAG,
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(GOLD) },
      uOpacity: { value: 0.55 }
    },
    side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const hull = src.isSkinnedMesh
    ? new THREE.SkinnedMesh(src.geometry, mat)
    : new THREE.Mesh(src.geometry, mat);
  if (src.isSkinnedMesh) hull.bind(src.skeleton, src.bindMatrix);
  hull.frustumCulled = false;
  hull.name = src.name + '_gold';
  hull.visible = false;
  return hull;
}

export function buildHakari() {
  const spec = {
    id: 'hakari', name: 'Hakari', H: 1.95, headScale: 0.94,
    // heavyweight proportions, one notch below Todo on every axis
    shoulder: 0.122, hip: 0.056, muscle: 1.28, bulk: 1.10, legBulk: 1.10,
    skinTone: SKIN,
    // the base torso is the coat's LINING: it is the surface that shows in any
    // gap between the layers built over it, and a gap should read as the
    // inside of a coat, not as a stripe of vest
    clothColor: COAT_LINE, sleeveColor: COAT, pantColor: PANT, shoeColor: BOOT,
    torsoShape: { chest: 1.14, waist: 0.92, hip: 0.96 },
    face: { jaw: 1.12, chin: 0.98, width: 1.05 },
    shoe: { len: 0.124, hgt: 0.062, wid: 0.05 },
    palette: { rim: 0xffd9a8, hairRim: 0xfff0c0, outline: 0x0b0910, accent: GOLD, energy: GOLD }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- 1. FUR COAT ---------------------------------------------------------
  // (a) the body: a closed lathe from mid-thigh all the way to the collar,
  // wider than the torso so it hangs off him instead of clinging. It runs the
  // full height on purpose — an earlier pass stopped it at the ribs and left
  // a band of white vest wrapping his flanks, which read as bare sides in
  // profile. The coat is worn OPEN at the FRONT only, and that opening is
  // built below out of two lapels with the tank showing between them.
  bag.add('cloth', latheY([
    [0.084 * H, 0.360 * H], [0.090 * H, 0.410 * H], [0.089 * H, 0.470 * H],
    [0.085 * H, 0.530 * H], [0.083 * H, 0.600 * H], [0.086 * H, 0.680 * H],
    [0.087 * H, 0.740 * H], [0.080 * H, 0.782 * H]
  ], 22, 0.80), { chain: torsoChain, color: COAT, blend: 0.06 });

  // ---- 2. TANK TOP ---------------------------------------------------------
  // What is actually visible of it: a wedge of off-white down the centre of
  // the chest, sitting proud of the coat so the lapels frame it, plus the
  // ribbed neckline above.
  bag.add('cloth', tGeo(roundBox(0.062 * H, 0.185 * H, 0.036 * H, 0.010),
    { rot: [7, 0, 0], pos: [0, 0.696 * H, 0.064 * H] }),
    { chain: torsoChain, color: TANK, blend: 0.05 });
  bag.add('cloth', tGeo(roundBox(0.070 * H, 0.016 * H, 0.030 * H, 0.006),
    { rot: [7, 0, 0], pos: [0, 0.784 * H, 0.056 * H] }),
    { bone: 'Chest', color: 0xd6d0c2 });
  // the inside of the skirt, visible under the hem
  bag.add('cloth', latheY([
    [0.079 * H, 0.362 * H], [0.083 * H, 0.420 * H]
  ], 20, 0.80), { bone: 'Hips', color: COAT_LINE });

  // (b) the lapels: two thick slabs angled off the chest into a deep V, so the
  // tank shows down the middle. This is the coat "hanging open".
  for (const s of [1, -1]) {
    bag.add('cloth', tGeo(roundBox(0.040 * H, 0.185 * H, 0.030 * H, 0.008),
      { rot: [6, s * -16, s * 13], pos: [s * 0.055 * H, 0.700 * H, 0.055 * H] }),
      { chain: torsoChain, color: COAT, blend: 0.05 });
    // lining strip facing inward, so the V has depth from three-quarter on
    bag.add('cloth', tGeo(roundBox(0.012 * H, 0.175 * H, 0.020 * H, 0.005),
      { rot: [6, s * -16, s * 13], pos: [s * 0.038 * H, 0.700 * H, 0.062 * H] }),
      { chain: torsoChain, color: COAT_LINE, blend: 0.05 });
  }
  // (c) the upper back panel joining the lapels round the sides. A flat slab,
  // NOT a dome: the first pass used a sphere shell here and it read as a
  // hunchback from every angle but dead front.
  // A softened slab across the shoulder blades, giving the back the width the
  // lathe alone does not have.
  bag.add('cloth', tGeo(roundBox(0.185 * H, 0.170 * H, 0.062 * H, 0.024, 3),
    { rot: [-3, 0, 0], pos: [0, 0.706 * H, -0.026 * H] }), { chain: torsoChain, color: COAT, blend: 0.05 });

  // (d) FUR. Rings of overlapping lobes at the three places fur actually
  // shows: the collar, the cuffs and the hem. Built as real geometry — a
  // painted band would vanish the moment the silhouette matters.
  const furRing = (cy, r, n, lobe, bone, zSquash = 0.84, colour = COAT_FUR) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + ((i % 3) - 1) * 0.16;
      bag.add('cloth', tGeo(new THREE.SphereGeometry(lobe * wob, 7, 6), {
        scale: [1, 0.86, 1],
        pos: [Math.sin(a) * r, cy + ((i % 2) ? lobe * 0.22 : -lobe * 0.14), Math.cos(a) * r * zSquash]
      }), { bone, color: colour });
    }
  };
  // collar: sits low and wide, draping OFF the shoulders rather than round the
  // throat — that slouch is most of the coat's read from behind
  furRing(0.788 * H, 0.072 * H, 15, 0.030 * H, 'Chest', 0.88);
  furRing(0.822 * H, 0.060 * H, 13, 0.026 * H, 'Neck', 0.90);
  // hem
  furRing(0.372 * H, 0.088 * H, 18, 0.024 * H, 'Hips', 0.82);
  // cuffs
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    const el = joints.get('LoArm' + s);
    const dir = wr.clone().sub(el).normalize();
    const c = wr.clone().addScaledVector(dir, -0.018 * H);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      // ring laid across the forearm axis: approximate with a horizontal ring,
      // which is close enough at this scale and keeps the code readable
      bag.add('cloth', tGeo(new THREE.SphereGeometry(0.017 * H, 6, 5),
        { pos: [c.x + Math.sin(a) * 0.024 * H, c.y, c.z + Math.cos(a) * 0.024 * H] }),
        { bone: 'LoArm' + s, color: COAT_FUR });
    }
  }
  // (e) sleeve mass over the deltoid so the coat shoulder reads round
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s);
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.039 * H, 10, 8),
      { scale: [1, 0.90, 0.95], pos: [sh.x, sh.y + 0.006 * H, sh.z] }),
      { bone: 'UpArm' + s, color: COAT });
  }

  // ---- 3. BOOTS ------------------------------------------------------------
  // chunkier than the roster's shoes: a cuff above the ankle and a dark sole
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.036 * H, 0.033 * H, 0.075 * H, 12),
      { pos: [an.x, an.y + 0.052 * H, an.z + 0.004 * H] }), { bone: 'Shin' + s, color: BOOT });
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.039 * H, 0.037 * H, 0.016 * H, 12),
      { pos: [an.x, an.y + 0.090 * H, an.z + 0.004 * H] }), { bone: 'Shin' + s, color: 0xa8997c });
  }

  // ---- 4. FACE -------------------------------------------------------------
  // Small magenta eyes, thin slitted brows set low, a confident set to the
  // mouth. The eyes are the smallest in the roster on purpose.
  addFace(ctx, {
    eyeW: 0.40, eyeH: 0.19, eyeColor: 0xd23a86, eyeTilt: 9, lashTilt: 11,
    browTilt: 5, browUp: 1.30, browColor: 0x6b5330, lashColor: 0x1a1218,
    mouthW: 0.30, mouthTilt: -7, mouthColor: 0x6b3a3c
  });
  // stubble: the thin moustache line, then a faint jaw shadow. Kept low
  // contrast — at fighting range it should register as "unshaven", not as a
  // drawn-on moustache.
  bag.add('flat', tGeo(roundBox(headR * 0.30, headR * 0.055, 0.004, 0.002),
    { pos: [0, headC.y - headR * 0.47, headC.z + headR * 0.60] }),
    { bone: 'Head', color: STUBBLE });
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.30, headR * 0.10, 0.004, 0.002),
      { rot: [0, 0, s * 26], pos: [s * headR * 0.40, headC.y - headR * 0.68, headC.z + headR * 0.44] }),
      { bone: 'Head', color: 0x9c7b57 });
  }

  // ---- 5. HAIR -------------------------------------------------------------
  // Built in three passes, in the order the silhouette is read:
  //   (a) the FADE — a tight dark shell over the whole skull including the
  //       nape, so the taper exists under the mass instead of being implied.
  //   (b) the MASS — an egg-shaped blonde volume whose long axis runs
  //       front-to-back and whose centre sits BEHIND the crown. This is the
  //       "slicked back" read, and it has to be right from the side and the
  //       back, not just the front.
  //   (c) the LOBES — short fat clumps over the mass, every one bent
  //       backwards. Fat and short: a spike here would turn him into Yuji.
  // (a) THE FADE — SIDES AND NAPE ONLY. There is deliberately nothing dark
  // across the forehead: a full dome here rendered as a hard band over the
  // eyes and read as a visor. The taper is a shade under the blonde rather
  // than a different colour, because this is short hair, not scalp.
  bag.add('hair', tGeo(sphereShell(headR * 0.98, { thetaLength: Math.PI * 0.34, scale: [0.96, 1.0, 1] }),
    { rot: [-118, 0, 0], pos: [headC.x, headC.y - headR * 0.06, headC.z - headR * 0.20] }),
    { bone: 'Head', color: HAIR_DK });
  for (const s of [1, -1]) {
    // temple patch: a flattened lens hugging the side of the skull
    bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.46, 10, 8), {
      scale: [0.32, 0.78, 0.92],
      pos: [s * headR * 0.86, headC.y + headR * 0.02, headC.z - headR * 0.16]
    }), { bone: 'Head', color: HAIR_DK });
    // sideburn dropping to the ear
    bag.add('hair', tGeo(roundBox(headR * 0.09, headR * 0.26, headR * 0.12, 0.004),
      { pos: [s * headR * 0.90, headC.y - headR * 0.24, headC.z - headR * 0.02] }),
      { bone: 'Head', color: HAIR_DK });
  }

  // (b) THE MASS — an egg of overlapping PUFFS, long axis front-to-back, its
  // centre set BEHIND the crown. Spheres rather than cones: the previous pass
  // built it out of coneSpike and every clump came to a point, which turned
  // an afro into a tiara. Puffs overlap into one lumpy volume instead.
  //
  //   A/B/C are the ellipsoid the puffs sit on. C > A is what makes the
  //   silhouette grow toward the back; the -0.22R z offset is the sweep.
  const hairC = headC.clone().add(v3(0, headR * 0.26, -headR * 0.26));
  const A = headR * 0.84, B = headR * 0.60, C = headR * 1.02;
  const addPuff = (thetaDeg, phiDeg, r) => {
    const th = thetaDeg * Math.PI / 180, ph = phiDeg * Math.PI / 180;
    const st = Math.sin(th);
    bag.add('hair', tGeo(new THREE.SphereGeometry(r, 9, 7), {
      scale: [1, 0.92, 1.04],
      pos: [hairC.x + A * st * Math.sin(ph), hairC.y + B * Math.cos(th), hairC.z + C * st * Math.cos(ph)]
    }), { bone: 'Head', color: HAIR });
  };
  // filler shells under the puffs so no gap can open between them: one over
  // the crown, one over the occiput. Without the second, the back of the head
  // rendered bald between the cap and the nape.
  bag.add('hair', tGeo(sphereShell(headR * 1.00, { thetaLength: Math.PI * 0.44, scale: [1.0, 0.96, 1.14] }),
    { rot: [-12, 0, 0], pos: [headC.x, headC.y + headR * 0.14, headC.z - headR * 0.16] }),
    { bone: 'Head', color: HAIR });
  bag.add('hair', tGeo(sphereShell(headR * 1.05, { thetaLength: Math.PI * 0.42, scale: [0.94, 1.0, 1.0] }),
    { rot: [-112, 0, 0], pos: [headC.x, headC.y + headR * 0.04, headC.z - headR * 0.18] }),
    { bone: 'Head', color: HAIR });
  addPuff(0, 0, headR * 0.40);                                   // crown
  for (let i = 0; i < 7; i++) addPuff(42, i * (360 / 7) + 12, headR * (0.36 + (i % 2) * 0.04));
  // the flank ring skips the most forward slots: that gap IS the hairline, and
  // it has to clear the brows from every angle
  for (let i = 0; i < 9; i++) {
    const phi = i * (360 / 9) + 20;
    if (Math.cos(phi * Math.PI / 180) > 0.72) continue;
    addPuff(76, phi, headR * (0.35 + (i % 2) * 0.04));
  }
  // the front roll: a tight row right on the hairline, lifting off the
  // forehead and immediately going back over the crown
  for (const phi of [-26, 0, 26]) addPuff(36, phi, headR * 0.30);

  // THE REAR AND SIDE BULK — placed in head space rather than on the ellipsoid
  // above. The ellipsoid's radius collapses with sin(theta), so everything
  // below the equator ended up buried inside the skull and the back of his
  // head rendered bald. These are positioned directly, and they are the whole
  // reason the deepest point of the volume sits behind the ear.
  // x/y/z AND r are all in head radii, like everything else in this block
  const addAt = (x, y, z, r) => bag.add('hair', tGeo(new THREE.SphereGeometry(r * headR, 9, 7), {
    scale: [1, 0.94, 1.02],
    pos: [headC.x + x * headR, headC.y + y * headR, headC.z + z * headR]
  }), { bone: 'Head', color: HAIR });
  // the occiput shelf
  addAt(0, 0.14, -1.16, 0.36);
  addAt(0.44, 0.10, -1.06, 0.33);
  addAt(-0.44, 0.10, -1.06, 0.33);
  // the mass at eye height behind the skull
  addAt(0, -0.16, -1.10, 0.32);
  addAt(0.38, -0.20, -1.00, 0.29);
  addAt(-0.38, -0.20, -1.00, 0.29);
  // the nape, tapering down and in
  addAt(0, -0.46, -0.94, 0.25);
  addAt(0.30, -0.48, -0.86, 0.22);
  addAt(-0.30, -0.48, -0.86, 0.22);
  // side wrap, behind the ears so the taper still reads
  addAt(0.92, 0.10, -0.34, 0.30);
  addAt(-0.92, 0.10, -0.34, 0.30);
  addAt(0.84, -0.16, -0.56, 0.26);
  addAt(-0.84, -0.16, -0.56, 0.26);

  // ---- 6. SPRINGS: the coat tails -----------------------------------------
  // The heaviest cloth in the roster: two long back panels plus one on each
  // side, slow and weighty rather than flappy.
  // The tails get their OWN material with a cool, weak rim. The body's warm
  // peach rim is right on skin and on a curved sleeve, but a flat panel seen
  // edge-on sits permanently in the fresnel band, and with the shared material
  // the coat tails lit up tan — they read as suede rather than as black fur.
  const clothMat = MAT.cloth({ rimColor: 0x8f86a8, rim: 0.14 });
  const oOpts = { color: spec.palette.outline, thickness: 0.009 };
  const springs = [];
  for (const s of [1, -1]) {
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.058 * H, -0.13 * H, -0.062 * H),
      restDir: v3(s * 0.05, -1, -0.10).normalize(), stiffness: 58, damping: 0.86, gravity: 9,
      segments: [
        { len: 0.062 * H, mesh: makeFlapMesh(0.070 * H, 0.062 * H, 0.062 * H, 0.011, clothMat, COAT, oOpts) },
        { len: 0.055 * H, mesh: makeFlapMesh(0.062 * H, 0.050 * H, 0.055 * H, 0.010, clothMat, COAT, oOpts) }
      ]
    });
    springs.push({
      bone: 'Hips', localOffset: v3(s * 0.086 * H, -0.11 * H, 0.006 * H),
      restDir: v3(s * 0.14, -1, 0).normalize(), stiffness: 64, damping: 0.84, gravity: 8,
      segments: [
        { len: 0.052 * H, mesh: makeFlapMesh(0.050 * H, 0.042 * H, 0.052 * H, 0.010, clothMat, COAT, oOpts) }
      ]
    });
  }

  const model = finalizeModel(ctx, { springs, outlineThickness: 0.0135, outlineHairScale: 0 });

  // ---- 7. JACKPOT VARIANT --------------------------------------------------
  // Same mesh, different material state. Three layers, all toggled together:
  //   - gold emissive pushed into the existing toon materials, so the coat and
  //     the skin themselves warm up rather than just gaining a halo,
  //   - an additive gold inverted hull over every body slot for the rim,
  //   - cursed-energy bands orbiting the forearms.
  const hulls = [];
  for (const slot of ['skin', 'cloth', 'hair']) {
    const src = model.meshes[slot];
    if (!src) continue;
    const hull = goldHull(src, slot === 'hair' ? 0.020 : 0.016);
    model.group.add(hull);
    hulls.push(hull);
  }
  const bands = [];
  const bandMat = new THREE.MeshBasicMaterial({
    color: GOLD, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  for (const s of ['L', 'R']) {
    const bone = model.getBone('LoArm' + s);
    const wr = joints.get('Hand' + s), el = joints.get('LoArm' + s);
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036 * H, 0.006 * H, 6, 18), bandMat);
      // bone-local: the forearm bone sits at the elbow, wrist is down its axis
      const t = 0.35 + i * 0.42;
      ring.position.set(
        (wr.x - el.x) * t, (wr.y - el.y) * t, (wr.z - el.z) * t);
      ring.rotation.x = Math.PI / 2;
      bone.add(ring);
      bands.push(ring);
    }
  }
  const baseEmissive = {};
  for (const [slot, mesh] of Object.entries(model.meshes)) {
    if (mesh.material.emissive) baseEmissive[slot] = mesh.material.emissive.getHex();
  }
  model.jackpotOn = false;
  model.setJackpot = (on) => {
    model.jackpotOn = !!on;
    for (const h of hulls) h.visible = !!on;
    for (const b of bands) b.visible = !!on;
    for (const [slot, mesh] of Object.entries(model.meshes)) {
      if (!mesh.material.emissive) continue;
      const warm = { skin: 0x3a2405, cloth: 0x2e2005, hair: 0x4a3208, flat: 0x000000 }[slot] ?? 0x2a1c04;
      mesh.material.emissive.setHex(on ? warm : (baseEmissive[slot] ?? 0x000000));
    }
  };
  for (const b of bands) b.visible = false;
  // pulse the rim so it breathes rather than sitting as a flat outline
  const baseUpdate = model.update.bind(model);
  let pulse = 0;
  model.update = (dt) => {
    baseUpdate(dt);
    if (!model.jackpotOn) return;
    pulse += dt;
    const k = 0.42 + Math.sin(pulse * 5.2) * 0.16;
    for (const h of hulls) h.material.uniforms.uOpacity.value = k;
    for (const b of bands) b.rotation.z += dt * 3.4;
  };

  return model;
}
