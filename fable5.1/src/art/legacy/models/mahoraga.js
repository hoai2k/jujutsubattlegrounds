// EIGHT-HANDLED SWORD DIVERGENT SILA DIVINE GENERAL MAHORAGA
// 八握剣異戒神将魔虚羅
//
// ========================== REFERENCE SHEET ==============================
// PRIMARY SOURCE: the reference image supplied with the brief (full-body
// front view, standing at rest). Everything below that is marked [IMG] was
// read straight off that sheet. Items marked [RES] come from a research pass
// over the JJK wiki entry and the anime/manga descriptions for the angles the
// image does not cover (back, profile, how the wheel reads from behind).
// Geometry here is original and procedural — nothing imported.
//
// BUILD   [IMG] Enormous. H 3.60 m — 1.80x Todo (2.00), 2.06x Megumi (1.75),
//         the largest thing that has ever stood on these maps. Read the image
//         as proportion, not as height: the shoulders are extraordinarily
//         wide (half-width 0.150·H — twice Todo's absolute span), the chest is
//         a deep barrel, the waist pinches hard above a heavy pelvis, and the
//         limbs are thick all the way down with no taper at the wrist or
//         ankle. Roughly 7.9 heads — the head is deliberately SMALL for the
//         mass, which is most of why the silhouette reads as inhuman.
//         muscle 1.55, bulk 1.30, legBulk 1.24.
// SKIN    [IMG] Bone white with a cool grey shadow — #e7e6e2. Not flesh: it
//         reads as carved. Every muscle group is drawn as a hard-edged plate
//         rather than a soft mass, which is where the brief's "segmented
//         armour plating" lives on this design — the plating IS his anatomy.
//         Pecs, the eight abdominal blocks, the serratus fan, the deltoid
//         caps, shin and forearm plates are all modelled as separate raised
//         slabs in the ARMOUR material (see MATERIALS).
// HEAD    [IMG] A skull, not a face. Long narrow cranium, no nose, no ears.
//         The lower third is an exposed jaw carrying a permanent square-
//         toothed grin that runs the full width of the head — the single most
//         recognisable thing about him at a distance.
//         [IMG] FOUR WING-BLADES leave the eye sockets: an upper pair sweeping
//         up-and-back over the crown in a long curve, and a lower pair angled
//         forward and down past the cheekbone. They are flat blades, not
//         horns — thin in profile, wide face-on.
//         [IMG] A long tail-like appendage trails from the back of the skull,
//         tapering to a whip point. It is a spring chain, so it lags.
//         [RES] Canonically the sockets hold no eyes at all. The brief asks
//         for glowing eyes, so the compromise is two narrow slits burning deep
//         inside the socket recess, under the wing roots: from a low angle
//         (the gameplay camera) they read as eyes; from above they read as
//         empty sockets. Amber #ffc63a, emissive.
// WHEEL   [IMG] THE DHARMA WHEEL. Warm gold #c6ac72, sitting just above the
//         crown, tilted ~22 deg back off horizontal — from the front it reads
//         as a flattened ellipse over the head, from behind as a full ring
//         cutting the skyline [RES]. Eight spokes to eight rounded knobs
//         around the rim (the eight of "eight-handled"), a hub boss, and a
//         band of inscription ticks on the inner face. It is real geometry on
//         its own transform and rotates independently of the head — the
//         adaptation spins it.
// CHEST   [IMG] A dark chain across the collarbones with a squared pendant
//         hanging at the sternum. Small, but it is the only jewellery on him.
// ARMS    [IMG] The right arm (screen left) is wrapped in pale binding strips
//         from mid-forearm to the wrist and holds the blade. The left is bare
//         with a heavy black band at the wrist.
// WAIST   [IMG] A wide dark obi, with a large off-white cloth knotted at the
//         front-left, its tails hanging over the skirt.
// SKIRT   [IMG] A dark slate-green pleated hakama, hem just above the knee,
//         with a longer front-left panel. Cloth, and it moves.
// LEGS    [IMG] Bare, heavy, BAREFOOT with modelled toes. Thick black bands
//         at both ankles.
// BLADE   [IMG] A single very slender straight blade, no guard, held point-
//         down in the wrapped right hand. Long — it reaches most of the way
//         to the floor even in that enormous hand.
// PALETTE skin #e7e6e2 · armour/bone #f2efe6 shadowed #b9b5aa ·
//         wheel #c6ac72 / dark #836d3e · eye #ffc63a ·
//         obi #363c46 · knot cloth #cac7bd · hakama #2b3a34 ·
//         bands #14161a · steel #b7bec6 · rim #cfe0ff
// IDENTITY 1) the wheel over the skull
//          2) the four wing-blades out of the eye sockets, and the grin
//          3) the sheer height — he changes what the arena looks like
// =========================================================================
//
// MATERIALS. Four shading languages, not one:
//   skin   — the pale body, the roster's softest ramp
//   hair   — REPURPOSED as ARMOUR/BONE. Harder bands, tighter rim, real gloss,
//            and it is one of the slots that gets an inverted-hull outline, so
//            the plates keep their ink line. This is the "distinct treatment
//            for the armour" the brief asks for: 4 bands against the body's 3,
//            a rim that starts much earlier, and a gloss term the cloth and
//            skin materials do not have.
//   cloth  — hakama, obi, bindings, bands
//   metal  — the blade and the wheel (the wheel additionally emissive)
import * as THREE from 'three';
import { buildHumanoid, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tubeBetween, tGeo, roundBox, coneSpike, sphereShell, shapeExtrude } from '../builders/geo.js';
import { MAT, toonMaterial } from '../../shaders/toon.js';
import { v3, DEG } from '../../../core/math.js';

// VALUE RANGE. The first pass made everything one white and the anatomy
// vanished. Three clearly separated values do the work the toon ramp cannot:
// the body sits in the middle, the raised plates read light against it, and
// the recesses (sockets, the mouth cavity, the plate gaps) go properly dark.
const SKIN = 0xd6d4cd;        // the body
const BONE = 0xf6f4ec;        // raised plate / carved bone
const BONE_DK = 0x87847c;     // recesses — a full third of the way to black
const CAVITY = 0x1b1c21;      // inside the skull: the socket wells and the mouth
const WHEEL_GOLD = 0xc6ac72;
const WHEEL_DK = 0x836d3e;
const EYE = 0xffc63a;
const OBI = 0x363c46;
const KNOT = 0xcac7bd;
const HAKAMA = 0x2b3a34;
const BAND = 0x14161a;
const STEEL = 0xb7bec6;
const BIND = 0xdedbd2;        // the forearm wrappings

// The armour ramp. Four bands instead of three and a rim that opens at 0.55
// rather than 0.78: against the skin material beside it the plate edges snap
// instead of rolling, which is what sells "carved" over "muscular".
const armourMat = (rimColor) => toonMaterial({
  steps: [34, 104, 186, 255], rim: 0.52, rimStart: 0.55, gloss: 0.42,
  rimColor, warm: 0x241d16, cool: 0x0f1626
});

export function buildMahoraga() {
  const spec = {
    id: 'mahoraga', name: 'Mahoraga', H: 3.6, headScale: 1.22,
    // muscle/bulk are deliberately MODEST: the first pass ran them at 1.55 and
    // 1.30 and the torso lathe swallowed the shoulders into one sphere. The
    // mass comes from the shoulder span (0.150·H = a 1.08 m shoulder line,
    // twice Todo's) and from the plating, not from inflating the tubes.
    shoulder: 0.150, hip: 0.062, muscle: 1.22, bulk: 1.06, legBulk: 1.24,
    skinTone: SKIN,
    clothColor: SKIN,          // the torso lathe is bare body, not a garment
    sleeveColor: SKIN,         // bare arms
    pantColor: SKIN,           // bare legs
    shoeColor: SKIN,           // barefoot: the "shoe" is the foot itself
    handColor: SKIN,
    ears: false,               // no ears on the skull
    // The SHARED torso lathe is a three-radius profile, and at this scale it
    // cannot do a ribcage: it produced one smooth egg from hip to neck. Turn
    // it off and author the silhouette below instead.
    torso: false,
    face: { jaw: 0.62, chin: 0.20, width: 0.84, faceFlat: 0.22 }, // long narrow skull
    shoe: { len: 0.108, hgt: 0.028, wid: 0.050 },          // flat bare foot
    palette: {
      rim: 0xcfe0ff, hairRim: 0xe6f0ff, metalRim: 0xfff0c8, outline: 0x0a0b10,
      accent: WHEEL_GOLD, energy: 0xffd76a
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;

  // ======================================================================
  // TORSO — authored profile: a deep ribcage, a hard pinch, a heavy pelvis
  // ======================================================================
  // Read bottom to top. The two numbers that matter are the waist (0.062·H,
  // a 45 cm span) and the chest (0.112·H, an 81 cm span against a 108 cm
  // shoulder line): a 1.8:1 taper, which is what gives him a silhouette
  // instead of a barrel. zScale 0.70 flattens him front-to-back so the plating
  // has somewhere to sit proud of.
  bag.add('cloth', latheY([
    [0.086 * H, 0.435 * H],   // the base of the pelvis
    [0.099 * H, 0.472 * H],   // widest point of the hips
    [0.096 * H, 0.515 * H],
    [0.076 * H, 0.552 * H],
    [0.062 * H, 0.600 * H],   // THE PINCH
    [0.079 * H, 0.642 * H],
    [0.101 * H, 0.682 * H],
    [0.113 * H, 0.706 * H],   // widest point of the ribcage
    [0.109 * H, 0.742 * H],
    [0.092 * H, 0.778 * H],
    [0.056 * H, 0.822 * H],
    [0.028 * H, 0.849 * H]
  ], 26, 0.70), { chain: torsoChain, color: SKIN, blend: 0.05 });
  // the lower rib arch, cut in as a dark seam under the pecs
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(0.052 * H, 0.010 * H, 0.020 * H, 0.004 * H),
      { rot: [0, 0, s * 26], pos: [s * 0.044 * H, 0.652 * H, 0.052 * H] }),
      { chain: torsoChain, color: BONE_DK, blend: 0.05 });
  }

  // ======================================================================
  // HEAD — skull, grin, four wing-blades, socket glow
  // ======================================================================
  // The read, front-on and top to bottom, is: hard cranial dome / a black
  // horizontal band with two burning slits in it / the grin. Three bars of
  // alternating value. The first pass built all of this in one white and the
  // whole head came out as an egg with a bib, so every element below is
  // deliberately assigned to one of the three values.
  const FZ = headC.z + headR * 0.30;   // the face plane (faceFlat 0.22 · headR)

  // 1 CRANIUM — a HEMISPHERE and no more. The previous pass ran the dome down
  // to 104 deg from the pole and it swallowed the brow, the sockets and the
  // eyes with it; the face was gone. thetaLength 0.50 PI stops the shell dead
  // at its own equator, and that equator is placed exactly on the brow line —
  // so everything below the brow is guaranteed to stay visible from any angle.
  const BROW = headC.y + headR * 0.25;
  // Z IS SQUASHED, NOT STRETCHED. The previous pass scaled it 1.18 deep and
  // the front lip ended up 21 cm in front of the face plane — a visor sitting
  // over the sockets and the grin. 0.68 puts the front edge just BEHIND FZ, so
  // the dome can never occlude the face from any angle.
  bag.add('hair', tGeo(sphereShell(headR * 0.82, {
    thetaLength: Math.PI * 0.50, seg: 11, rings: 4, scale: [1.14, 1.00, 0.74]
  }), { rot: [-4, 0, 0], pos: [headC.x, BROW + headR * 0.02, headC.z - headR * 0.36] }),
    { bone: 'Head', color: BONE });
  // A DARK SEAM between the dome and the brow. Without it the two bright
  // bone slabs merge into one mass and the skull loses its top edge.
  bag.add('hair', tGeo(roundBox(headR * 1.52, headR * 0.07, headR * 0.66, headR * 0.02),
    { rot: [-8, 0, 0], pos: [0, BROW + headR * 0.06, headC.z - headR * 0.06] }),
    { bone: 'Head', color: CAVITY });
  // OCCIPUT — closes the back of the skull from the brow line down to the nape
  bag.add('hair', tGeo(sphereShell(headR * 0.92, {
    phiStart: Math.PI / 2 + 1.15, phiLength: Math.PI * 2 - 2.30,
    thetaLength: Math.PI * 0.50, seg: 12, rings: 5, scale: [1.02, 1.10, 1]
  }), { rot: [-96, 0, 0], pos: [headC.x, BROW - headR * 0.16, headC.z - headR * 0.34] }),
    { bone: 'Head', color: BONE });
  // sagittal crest front-to-back over the dome
  bag.add('hair', tGeo(roundBox(headR * 0.16, headR * 0.18, headR * 1.72, headR * 0.05),
    { rot: [8, 0, 0], pos: [0, BROW + headR * 0.86, headC.z - headR * 0.30] }),
    { bone: 'Head', color: BONE });
  // two lateral crests either side of it — the top of the head is ridged
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(headR * 0.10, headR * 0.12, headR * 1.30, headR * 0.04),
      { rot: [8, 0, s * 17], pos: [s * headR * 0.38, BROW + headR * 0.74, headC.z - headR * 0.32] }),
      { bone: 'Head', color: BONE_DK });
  }

  // 2 THE SOCKET BAND — one full-width CAVITY slab across the face, deeply
  // inset. This single element is what makes him read as a skull rather than
  // as a helmet: there is no face there, only a dark band.
  const SOCK = BROW - headR * 0.33;      // centre of the socket band
  bag.add('hair', tGeo(roundBox(headR * 1.54, headR * 0.46, headR * 0.56, headR * 0.02),
    { rot: [-4, 0, 0], pos: [0, SOCK, FZ - headR * 0.08] }),
    { bone: 'Head', color: CAVITY });
  // BROW SHELF — the hard bright bar hanging over the band, sitting proud of
  // it so it casts the socket into its own shadow from every angle
  // Depth and Z matter more than size here: at 0.44 headR deep and sitting on
  // FZ, its front face landed IN FRONT of the eye slits and hid them. Shorter
  // and set back, so it overhangs the sockets without covering them.
  bag.add('hair', tGeo(roundBox(headR * 1.62, headR * 0.19, headR * 0.34, headR * 0.045),
    { rot: [11, 0, 0], pos: [0, BROW - headR * 0.05, FZ - headR * 0.13] }),
    { bone: 'Head', color: BONE });
  // temple blocks capping the band left and right
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(headR * 0.24, headR * 0.56, headR * 0.46, headR * 0.05),
      { rot: [0, s * -14, s * 5], pos: [s * headR * 0.74, SOCK + headR * 0.02, FZ - headR * 0.18] }),
      { bone: 'Head', color: BONE });
  }
  // THE GLOW. Two narrow slits set INSIDE the cavity band, angled down toward
  // the centre so the expression is a permanent glare. Flat/unlit, so they
  // hold their value no matter how the map is lit.
  for (const s of [1, -1]) {
    const ex = s * headR * 0.38;
    // outer bloom
    bag.add('flat', tGeo(roundBox(headR * 0.76, headR * 0.28, 0.004, 0.002),
      { rot: [0, 0, s * 15], pos: [ex, SOCK, FZ + headR * 0.27] }),
      { bone: 'Head', color: 0x6e4a12 });
    // the slit
    bag.add('flat', tGeo(roundBox(headR * 0.64, headR * 0.185, 0.004, 0.002),
      { rot: [0, 0, s * 15], pos: [ex, SOCK, FZ + headR * 0.285] }),
      { bone: 'Head', color: EYE });
    // the white-hot core, pushed toward the inner corner: it is a glare
    bag.add('flat', tGeo(roundBox(headR * 0.35, headR * 0.09, 0.004, 0.002),
      { rot: [0, 0, s * 15], pos: [ex - s * headR * 0.10, SOCK + headR * 0.018, FZ + headR * 0.30] }),
      { bone: 'Head', color: 0xfff6d4 });
  }

  // 3 THE GRIN — the widest thing on the head, and it is meant to be. Set as
  // a CAVITY box with the teeth standing in front of it, so the mouth is a
  // hole with teeth in it rather than a bar stuck on the chin.
  const jawY = SOCK - headR * 0.39;
  bag.add('hair', tGeo(roundBox(headR * 1.24, headR * 0.42, headR * 0.44, headR * 0.02),
    { pos: [0, jawY, FZ - headR * 0.14] }), { bone: 'Head', color: CAVITY });
  // upper palate and mandible: the bright bone above and below the hole
  bag.add('hair', tGeo(roundBox(headR * 1.34, headR * 0.17, headR * 0.60, headR * 0.05),
    { rot: [6, 0, 0], pos: [0, jawY + headR * 0.27, FZ - headR * 0.20] }),
    { bone: 'Head', color: BONE });
  bag.add('hair', tGeo(roundBox(headR * 1.28, headR * 0.26, headR * 0.58, headR * 0.06),
    { rot: [-9, 0, 0], pos: [0, jawY - headR * 0.27, FZ - headR * 0.22] }),
    { bone: 'Head', color: BONE });
  // TEETH: eight uppers and seven lowers. The previous pass ran thirteen and
  // twelve and it read as a typewriter keyboard — fewer and bigger is the
  // whole trick. Depth and height are jittered off a fixed pattern so it is a
  // jaw rather than a comb, and the two rows interlock.
  const JIT = [0.00, 0.06, -0.04, 0.03, -0.05, 0.02, -0.03, 0.05];
  for (let i = 0; i < 8; i++) {
    const u = i / 7 - 0.5;
    const w = headR * 0.125 * (1 - Math.abs(u) * 0.28);
    const j = JIT[i];
    bag.add('hair', tGeo(roundBox(w, headR * (0.21 + j), headR * 0.18, headR * 0.012),
      { rot: [0, 0, u * 9], pos: [u * headR * 1.02, jawY + headR * (0.08 + j * 0.4), FZ + headR * 0.04] }),
      { bone: 'Head', color: 0xfffdf6 });
    if (i < 7) {
      const b = (i + 0.5) / 7 - 0.5;
      const jb = JIT[7 - i];
      bag.add('hair', tGeo(roundBox(w * 0.92, headR * (0.19 + jb), headR * 0.18, headR * 0.012),
        { rot: [0, 0, b * 9], pos: [b * headR * 1.02, jawY - headR * (0.09 + jb * 0.4), FZ + headR * 0.04] }),
        { bone: 'Head', color: 0xfffdf6 });
    }
  }
  // cheek struts tying the mandible back into the cranium
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(headR * 0.17, headR * 0.66, headR * 0.26, headR * 0.04),
      { rot: [0, s * -10, s * 9], pos: [s * headR * 0.72, jawY + headR * 0.16, headC.z + headR * 0.02] }),
      { bone: 'Head', color: BONE });
  }

  // ---- FOUR WING-BLADES OUT OF THE SOCKETS -------------------------------
  // Flat BLADES, not horns: wide face-on, paper-thin in profile. Rooted at the
  // outer end of the socket band so they genuinely leave the eye sockets, the
  // way the source describes.
  const wingProfile = (len, w0, w1) => shapeExtrude([
    [-w0, 0], [w0, 0], [w1 * 1.15, len * 0.42], [w1 * 0.62, len * 0.76], [0, len],
    [-w1 * 1.5, len * 0.62], [-w0 * 0.72, len * 0.24]
  ], headR * 0.055, {});
  const wing = (from, len, w0, w1, rot, color = BONE) => {
    bag.add('hair', tGeo(wingProfile(len, w0, w1), { rot, pos: [from.x, from.y, from.z] }),
      { bone: 'Head', color });
  };
  for (const s of [1, -1]) {
    const socket = v3(s * headR * 0.62, BROW - headR * 0.10, FZ - headR * 0.20);
    // UPPER PAIR — long, sweeping UP and BACK past the crown. The back rake is
    // what stops the head reading as a bull skull. Narrower than the previous
    // pass, which produced paddles rather than blades.
    wing(socket, headR * 2.55, headR * 0.24, headR * 0.13, [-52, s * 18, s * -30]);
    // a second, shorter blade shadowing it, fanned wider and set darker so the
    // pair reads as two layers rather than one thick horn
    wing(socket.clone().add(v3(0, headR * 0.06, -headR * 0.12)),
      headR * 1.80, headR * 0.17, headR * 0.09, [-40, s * 36, s * -48], BONE_DK);
    // LOWER PAIR — thrown FORWARD and DOWN past the cheek, framing the grin
    wing(socket.clone().add(v3(0, -headR * 0.24, headR * 0.08)),
      headR * 1.40, headR * 0.19, headR * 0.10, [64, s * 8, s * -20]);
  }

  // ======================================================================
  // BODY PLATING — the anatomy authored as slabs
  // ======================================================================
  const chestY = y.chest, sw = ctx.m.sw;
  // pectoral plates
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(0.094 * H, 0.070 * H, 0.038 * H, 0.016 * H),
      { rot: [7, s * -9, s * 8], pos: [s * 0.050 * H, chestY + 0.014 * H, 0.062 * H] }),
      { chain: torsoChain, color: BONE, blend: 0.05 });
    // a hard lower edge under each pec, in the recess value
    bag.add('hair', tGeo(roundBox(0.088 * H, 0.011 * H, 0.024 * H, 0.004 * H),
      { rot: [0, 0, s * 6], pos: [s * 0.048 * H, chestY - 0.026 * H, 0.070 * H] }),
      { chain: torsoChain, color: BONE_DK, blend: 0.05 });
    // DELTOID: three overlapping angular plates rather than one sphere. A
    // sphere here reads as a ball joint on a toy; the stepped plates read as
    // armour, and they are what carries the shoulder line at this width.
    const side = s > 0 ? 'L' : 'R';
    const sh = joints.get('UpArm' + side);
    for (let k = 0; k < 3; k++) {
      bag.add('hair', tGeo(roundBox(0.058 * H - k * 0.006 * H, 0.030 * H, 0.062 * H - k * 0.007 * H, 0.008 * H),
        { rot: [0, 0, s * (10 + k * 9)], pos: [sh.x + s * k * 0.004 * H, sh.y + 0.014 * H - k * 0.026 * H, sh.z] }),
        { bone: 'UpArm' + side, color: k === 1 ? BONE_DK : BONE });
    }
    // serratus fan — four short ribs raking down under the arm
    for (let i = 0; i < 4; i++) {
      bag.add('hair', tGeo(roundBox(0.030 * H - i * 0.003 * H, 0.010 * H, 0.016 * H, 0.004 * H),
        { rot: [0, 0, s * (22 - i * 4)], pos: [s * (0.070 - i * 0.004) * H, (0.672 - i * 0.020) * H, 0.030 * H] }),
        { chain: torsoChain, color: BONE_DK, blend: 0.05 });
    }
  }
  // abdominal blocks: four rows of two, tapering toward the navel
  for (let r = 0; r < 4; r++) {
    const ay = (0.638 - r * 0.032) * H;
    const aw = (0.034 - r * 0.0026) * H;
    for (const s of [1, -1]) {
      bag.add('hair', tGeo(roundBox(aw, 0.021 * H, 0.024 * H, 0.007 * H),
        { pos: [s * (aw * 0.62), ay, 0.058 * H - r * 0.002 * H] }),
        { chain: torsoChain, color: BONE, blend: 0.05 });
    }
  }
  // sternum groove
  bag.add('hair', tGeo(roundBox(0.008 * H, 0.070 * H, 0.020 * H, 0.003 * H),
    { pos: [0, 0.672 * H, 0.066 * H] }), { chain: torsoChain, color: BONE_DK, blend: 0.05 });
  // back: shoulder blades + a spinal ridge, so the rear silhouette is not flat
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(0.056 * H, 0.070 * H, 0.020 * H, 0.010 * H),
      { rot: [0, 0, s * 12], pos: [s * 0.040 * H, 0.712 * H, -0.062 * H] }),
      { chain: torsoChain, color: BONE, blend: 0.05 });
  }
  for (let i = 0; i < 7; i++) {
    bag.add('hair', tGeo(roundBox(0.014 * H, 0.014 * H, 0.014 * H, 0.004 * H),
      { pos: [0, (0.760 - i * 0.030) * H, -0.062 * H] }),
      { chain: torsoChain, color: BONE_DK, blend: 0.05 });
  }
  // forearm and shin plates
  for (const s of ['L', 'R']) {
    const el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const mid = el.clone().lerp(wr, 0.42);
    bag.add('hair', tGeo(roundBox(0.034 * H, 0.092 * H, 0.030 * H, 0.008 * H),
      { pos: [mid.x, mid.y, mid.z + 0.012 * H] }), { bone: 'LoArm' + s, color: BONE });
    // elbow: a hard cap so the arm has a joint instead of being one tube
    bag.add('hair', tGeo(roundBox(0.038 * H, 0.034 * H, 0.038 * H, 0.010 * H),
      { rot: [12, 0, 0], pos: [el.x, el.y, el.z - 0.006 * H] }), { bone: 'LoArm' + s, color: BONE });
    // a bicep plate so the upper arm is not a sausage either
    const up = joints.get('UpArm' + s), bm = up.clone().lerp(el, 0.55);
    bag.add('hair', tGeo(roundBox(0.040 * H, 0.078 * H, 0.034 * H, 0.012 * H),
      { pos: [bm.x, bm.y, bm.z + 0.012 * H] }), { bone: 'UpArm' + s, color: BONE });
    const kn = joints.get('Shin' + s), an = joints.get('Foot' + s);
    const sm = kn.clone().lerp(an, 0.44);
    bag.add('hair', tGeo(roundBox(0.034 * H, 0.108 * H, 0.030 * H, 0.010 * H),
      { pos: [sm.x, sm.y, sm.z + 0.014 * H] }), { bone: 'Shin' + s, color: BONE });
    // knee cap
    bag.add('hair', tGeo(new THREE.SphereGeometry(0.026 * H, 10, 8), {
      scale: [1, 0.9, 1], pos: [kn.x, kn.y, kn.z + 0.016 * H]
    }), { bone: 'Shin' + s, color: BONE });
    // thigh plate
    const th = joints.get('Thigh' + s);
    const tm = th.clone().lerp(kn, 0.46);
    bag.add('hair', tGeo(roundBox(0.046 * H, 0.100 * H, 0.036 * H, 0.014 * H),
      { pos: [tm.x, tm.y, tm.z + 0.016 * H] }), { bone: 'Thigh' + s, color: BONE });
    // CLAWS: the shared hand is an anime mitt and at 3.6 m it reads as a nub.
    // Four tapered finger blades and a thumb, in the armour material, so the
    // thing the claw string is thrown with looks like a claw.
    const hd = joints.get('Hand' + s), fore = joints.get('LoArm' + s);
    const down = hd.clone().sub(fore).normalize();
    const sgn = s === 'L' ? 1 : -1;
    for (let k = 0; k < 4; k++) {
      const off = (k - 1.5) * 0.020 * H;
      const len = (0.062 - Math.abs(k - 1.3) * 0.008) * H;
      const base = hd.clone().addScaledVector(down, 0.030 * H);
      bag.add('hair', tGeo(roundBox(0.015 * H, len, 0.015 * H, 0.005 * H),
        { rot: [10, 0, sgn * (k - 1.5) * 7],
          pos: [base.x + sgn * off, base.y - len * 0.42, base.z + 0.012 * H] }),
        { bone: 'Hand' + s, color: BONE });
    }
    bag.add('hair', tGeo(roundBox(0.017 * H, 0.044 * H, 0.017 * H, 0.005 * H),
      { rot: [8, 0, sgn * -38], pos: [hd.x - sgn * 0.030 * H, hd.y - 0.026 * H, hd.z + 0.018 * H] }),
      { bone: 'Hand' + s, color: BONE });

    // BARE FEET: five toes off the front of each foot block
    for (let t = 0; t < 5; t++) {
      const tx = an.x + (t - 2) * 0.011 * H * (s === 'L' ? 1 : -1);
      bag.add('skin', tGeo(new THREE.SphereGeometry(0.0085 * H * (1 - t * 0.09), 8, 6), {
        scale: [1, 0.8, 1.5],
        pos: [tx, an.y - 0.006 * H, an.z + 0.062 * H - Math.abs(t - 1.4) * 0.003 * H]
      }), { bone: 'Foot' + s, color: SKIN });
    }
  }

  // ======================================================================
  // GARMENTS AND FITTINGS
  // ======================================================================
  // chain across the collarbones + the squared pendant
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.062 * H, 0.0055 * H, 6, 24),
    { rot: [76, 0, 0], pos: [0, 0.752 * H, 0.024 * H] }), { chain: torsoChain, color: BAND, blend: 0.05 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 4 - 0.5) * 1.9;
    bag.add('cloth', tGeo(roundBox(0.017 * H, 0.017 * H, 0.012 * H, 0.004 * H),
      { rot: [0, 0, a * 20], pos: [Math.sin(a) * 0.062 * H, 0.752 * H - Math.abs(a) * 0.012 * H, 0.048 * H] }),
      { chain: torsoChain, color: 0x24272e, blend: 0.05 });
  }
  bag.add('cloth', tGeo(roundBox(0.020 * H, 0.030 * H, 0.010 * H, 0.003 * H),
    { pos: [0, 0.716 * H, 0.062 * H] }), { chain: torsoChain, color: 0x24272e, blend: 0.05 });

  // OBI: a wide dark band around the waist, sitting high, cut square
  bag.add('cloth', tGeo(latheY([
    [0.081 * H, 0.492 * H], [0.086 * H, 0.512 * H], [0.086 * H, 0.552 * H], [0.080 * H, 0.572 * H]
  ], 22, 0.84), {}), { bone: 'Hips', color: OBI });
  // the lighter cord riding the top edge of the obi
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.083 * H, 0.006 * H, 6, 22),
    { rot: [90, 0, 0], pos: [0, 0.566 * H, 0] }), { bone: 'Hips', color: KNOT });

  // HAKAMA: pleated skirt from under the obi to just above the knee.
  // latheY expects the profile BOTTOM TO TOP — the first pass handed it a
  // descending list and the geometry came out inside-out.
  bag.add('cloth', tGeo(latheY([
    [0.113 * H, 0.300 * H], [0.110 * H, 0.340 * H], [0.099 * H, 0.410 * H],
    [0.087 * H, 0.470 * H], [0.080 * H, 0.505 * H]
  ], 26, 0.92), {}), { bone: 'Hips', color: HAKAMA });
  // hem lip: a hard bright edge so the skirt terminates instead of fading out
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.113 * H, 0.008 * H, 6, 26),
    { rot: [90, 0, 0], pos: [0, 0.300 * H, 0] }), { bone: 'Hips', color: 0x1b241f });
  // pleat ridges — fourteen vertical strips, each turned to face outward
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    bag.add('cloth', tGeo(roundBox(0.011 * H, 0.205 * H, 0.012 * H, 0.003 * H),
      { rot: [3, a / DEG, 0], pos: [Math.sin(a) * 0.101 * H, 0.402 * H, Math.cos(a) * 0.094 * H] }),
      { bone: 'Hips', color: 0x1f2b26 });
  }

  // forearm bindings on the sword arm (R) — stacked strips, slightly uneven
  {
    const el = joints.get('LoArmR'), wr = joints.get('HandR');
    for (let i = 0; i < 7; i++) {
      const p = el.clone().lerp(wr, 0.30 + i * 0.105);
      bag.add('cloth', tGeo(new THREE.TorusGeometry(0.0295 * H - i * 0.0007 * H, 0.0062 * H, 6, 14),
        { rot: [82 + (i % 2 ? 5 : -4), 0, 6], pos: [p.x, p.y, p.z] }),
        { bone: 'LoArmR', color: i % 3 === 1 ? 0xcfcbc0 : BIND });
    }
  }
  // heavy bands: left wrist, both ankles
  {
    const wl = joints.get('HandL');
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.032 * H, 0.034 * H, 0.030 * H, 12),
      { pos: [wl.x, wl.y + 0.020 * H, wl.z] }), { bone: 'HandL', color: BAND });
    for (const s of ['L', 'R']) {
      const an = joints.get('Foot' + s);
      bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.038 * H, 0.040 * H, 0.034 * H, 12),
        { pos: [an.x, an.y + 0.046 * H, an.z] }), { bone: 'Shin' + s, color: BAND });
    }
  }

  // ======================================================================
  // THE DHARMA WHEEL — its own transform, rotates independently
  // ======================================================================
  const wheelMat = toonMaterial({
    vertexColors: true, steps: [40, 118, 200, 255], rim: 0.62, rimStart: 0.52,
    gloss: 0.85, rimColor: 0xfff0c8, emissive: 0x40300c, emissiveIntensity: 1.0,
    warm: 0x2c2110, cool: 0x101828
  });
  const paint = (geo, color) => {
    const n = geo.getAttribute('position').count;
    const c = new THREE.Color(color);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return geo;
  };
  // SIZE AND RAKE. The first pass put a 1 m disc lying almost flat on a 55 cm
  // skull, and from the low gameplay angle it became a lid over his face.
  // Smaller, and raked to 55 deg off horizontal: from the front it reads as a
  // foreshortened crown sitting behind and above the head, and from underneath
  // you look THROUGH it rather than at its underside.
  const WR = headR * 1.06;                 // wheel radius
  const wheelMount = new THREE.Group();    // carries the tilt
  const wheelSpin = new THREE.Group();     // carries the rotation
  wheelMount.add(wheelSpin);
  {
    const parts = [];
    // rim
    parts.push(paint(new THREE.TorusGeometry(WR, WR * 0.075, 8, 40), WHEEL_GOLD));
    // inner rim (the wheel reads as a double ring in the reference)
    parts.push(paint(tGeo(new THREE.TorusGeometry(WR * 0.74, WR * 0.032, 6, 32), {}), WHEEL_DK));
    // hub boss
    parts.push(paint(tGeo(new THREE.CylinderGeometry(WR * 0.20, WR * 0.20, WR * 0.10, 16),
      { rot: [90, 0, 0] }), WHEEL_GOLD));
    parts.push(paint(tGeo(new THREE.TorusGeometry(WR * 0.21, WR * 0.030, 6, 20), {}), WHEEL_DK));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const cx = Math.cos(a), cy = Math.sin(a);
      // spoke: individually modelled, slightly tapered
      parts.push(paint(tGeo(roundBox(WR * 0.070, WR * 0.62, WR * 0.055, WR * 0.016),
        { rot: [0, 0, -a / DEG + 90], pos: [cx * WR * 0.50, cy * WR * 0.50, 0] }), WHEEL_GOLD));
      // the knob at the spoke's end, on the outside of the rim
      parts.push(paint(tGeo(new THREE.SphereGeometry(WR * 0.145, 12, 10),
        { pos: [cx * WR * 1.03, cy * WR * 1.03, 0] }), WHEEL_GOLD));
      // knob collar
      parts.push(paint(tGeo(new THREE.TorusGeometry(WR * 0.105, WR * 0.022, 5, 12),
        { rot: [0, 0, -a / DEG + 90], pos: [cx * WR * 0.90, cy * WR * 0.90, 0] }), WHEEL_DK));
    }
    // INSCRIPTIONS: 32 ticks around the inner face of the rim, alternating
    // length — at a glance a band of writing, and they catch the emissive
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const len = i % 4 === 0 ? WR * 0.13 : i % 2 === 0 ? WR * 0.09 : WR * 0.055;
      parts.push(paint(tGeo(roundBox(WR * 0.022, len, WR * 0.020, WR * 0.006),
        { rot: [0, 0, -a / DEG + 90], pos: [Math.cos(a) * WR * 0.86, Math.sin(a) * WR * 0.86, WR * 0.055] }),
        i % 4 === 0 ? 0xf2dda4 : WHEEL_DK));
    }
    for (const g of parts) {
      const mesh = new THREE.Mesh(g, wheelMat);
      mesh.frustumCulled = false;
      wheelSpin.add(mesh);
    }
  }
  // Mount: sitting just clear of the crown, tilted 22 deg back off horizontal.
  // The torus is authored in the XY plane, so -90 lays it flat and +22 rakes
  // the far edge up — which is what gives the front view its ellipse and the
  // back view a full ring against the sky.
  //
  // BONE-LOCAL, NOT WORLD. wheelMount is parented to the Head BONE, whose
  // origin sits at joints.Head (~0.872·H). Feeding it headC's world Y parks
  // the wheel two metres over his head, which is exactly what the first pass
  // did. Everything here is measured FROM the head joint.
  const headJ = joints.get('Head');
  wheelMount.rotation.x = -62 * DEG;
  wheelMount.position.set(
    headC.x - headJ.x,
    headC.y + headR * 1.34 - headJ.y,
    headC.z - headR * 0.62 - headJ.z);

  // ======================================================================
  // THE BLADE
  // ======================================================================
  const blade = new THREE.Group();
  {
    const metalMat = MAT.metal({ rimColor: 0xdfe8ff });
    const bl = new THREE.Mesh(paint(shapeExtrude([
      [-0.026, 0], [0.026, 0], [0.026, 1.34], [0.004, 1.52], [-0.026, 1.40]
    ], 0.016), STEEL), metalMat);
    const ridge = new THREE.Mesh(paint(tGeo(roundBox(0.006, 1.30, 0.022, 0.002),
      { pos: [0, 0.66, 0] }), 0xe6edf4), metalMat);
    const collar = new THREE.Mesh(paint(tGeo(new THREE.CylinderGeometry(0.036, 0.040, 0.05, 10),
      { pos: [0, -0.025, 0] }), 0x2b2f38), metalMat);
    const grip = new THREE.Mesh(paint(tGeo(new THREE.CylinderGeometry(0.030, 0.033, 0.30, 10),
      { pos: [0, -0.20, 0] }), 0x1a1d23), MAT.cloth({ rimColor: 0x9fb0c8 }));
    blade.add(bl, ridge, collar, grip);
  }

  // ======================================================================
  // SPRINGS — heavier and slower than any human on the roster
  // ======================================================================
  // Human chains on this roster run stiffness 72-95 / damping 0.80-0.84 /
  // gravity 5-8. His run 40-52 / 0.90-0.92 / 11-13: everything on him takes
  // longer to start moving, swings further, and takes longer to stop. That
  // difference is most of what sells the mass.
  const clothMat = MAT.cloth({ rimColor: spec.palette.rim });
  const boneMat = armourMat(spec.palette.hairRim);
  const oOpts = { color: spec.palette.outline, thickness: 0.016 };
  const springs = [];

  // head tail — the long whip appendage off the back of the skull
  {
    const hj = joints.get('Head');
    springs.push({
      bone: 'Head',
      localOffset: v3(0, headC.y + headR * 0.30 - hj.y, -headR * 1.02 + (headC.z - hj.z)),
      restDir: v3(0.10, -0.16, -1).normalize(), stiffness: 52, damping: 0.90, gravity: 11,
      segments: [
        { len: headR * 1.5, mesh: makeFlapMesh(headR * 0.42, headR * 0.30, headR * 1.5, 0.030, boneMat, BONE, oOpts) },
        { len: headR * 1.4, mesh: makeFlapMesh(headR * 0.30, headR * 0.18, headR * 1.4, 0.024, boneMat, BONE, oOpts) },
        { len: headR * 1.2, mesh: makeFlapMesh(headR * 0.18, headR * 0.03, headR * 1.2, 0.016, boneMat, BONE_DK, oOpts) }
      ]
    });
  }
  // hakama panels: front-left (the long one), front-right, and two at the back
  const panels = [
    { off: v3(-0.045 * H, -0.030 * H, 0.070 * H), dir: v3(-0.10, -1, 0.14), w: 0.086, len: 0.150, n: 2 },
    { off: v3(0.052 * H, -0.030 * H, 0.062 * H), dir: v3(0.12, -1, 0.12), w: 0.074, len: 0.110, n: 2 },
    { off: v3(-0.052 * H, -0.030 * H, -0.066 * H), dir: v3(-0.10, -1, -0.14), w: 0.078, len: 0.120, n: 2 },
    { off: v3(0.052 * H, -0.030 * H, -0.066 * H), dir: v3(0.10, -1, -0.14), w: 0.078, len: 0.120, n: 2 }
  ];
  for (const p of panels) {
    springs.push({
      bone: 'Hips', localOffset: p.off, restDir: p.dir.normalize(),
      stiffness: 44, damping: 0.91, gravity: 13,
      segments: Array.from({ length: p.n }, (_, i) => ({
        len: p.len * H * (i === 0 ? 0.58 : 0.42),
        mesh: makeFlapMesh(p.w * H * (1 - i * 0.10), p.w * H * (1 - (i + 1) * 0.12),
          p.len * H * (i === 0 ? 0.58 : 0.42), 0.020, clothMat, HAKAMA, oOpts)
      }))
    });
  }
  // the knotted sash at the front-left, hanging over the skirt
  springs.push({
    bone: 'Hips', localOffset: v3(-0.070 * H, -0.010 * H, 0.052 * H),
    restDir: v3(-0.22, -1, 0.20).normalize(), stiffness: 40, damping: 0.92, gravity: 12,
    segments: [
      { len: 0.100 * H, mesh: makeFlapMesh(0.052 * H, 0.044 * H, 0.100 * H, 0.017, clothMat, KNOT, oOpts) },
      { len: 0.086 * H, mesh: makeFlapMesh(0.044 * H, 0.026 * H, 0.086 * H, 0.014, clothMat, KNOT, oOpts) }
    ]
  });
  // pendant on the chain
  springs.push({
    bone: 'Chest', localOffset: v3(0, 0.012 * H, 0.066 * H),
    restDir: v3(0, -1, 0.12).normalize(), stiffness: 60, damping: 0.88, gravity: 10,
    segments: [{ len: 0.040 * H, mesh: makeFlapMesh(0.018 * H, 0.014 * H, 0.040 * H, 0.010, clothMat, 0x24272e, oOpts) }]
  });

  const model = finalizeModel(ctx, {
    springs,
    outlineThickness: 0.020,      // scaled up with him — a 0.012 hull vanishes at 3.6 m
    outlineHairScale: 1.0,        // the armour slot keeps its ink line
    materials: { hair: boneMat },  // 'hair' slot is the ARMOUR/BONE material here
    props: {
      // Deliberately NOT named katana / tool / blade: those three names are
      // driven by Fighter._props for other characters. His is always in hand.
      greatblade: {
        node: blade, default: 'hand',
        attachments: {
          // grip in the fist, blade UP and forward. -168 hung it point-down
          // beside the leg, which on a 3.6 m frame put most of the blade under
          // the floor. Solved against his STANCE — see Toji's split_soul.
          hand: { bone: 'HandR', pos: [0, -0.115 * H, 0.030 * H], rot: [57, -10, -18] },
          away: { bone: 'Hips', pos: [0, -40, 0], rot: [0, 0, 0] }
        }
      }
    }
  });

  // ---- the wheel lives on the Head bone, on its own transform -------------
  model.bones.get('Head').add(wheelMount);
  model.wheel = wheelSpin;
  model.wheelMount = wheelMount;

  // ======================================================================
  // RUNTIME HOOKS
  // ======================================================================
  let spinVel = 0.35;          // idle drift — it is never completely still
  let spinBoost = 0;           // adaptation kick
  let glow = 1;
  let emerge = 1;              // 0 = fully below the floor, 1 = fully risen
  const rootBone = model.bones.get('Root');
  const flatMeshes = () => model.meshes.flat;

  // ADAPTATION: the wheel accelerates hard, then locks. Called with the
  // duration of the spin-up so the visual and the callout stay in sync.
  model.spinWheel = (power = 1) => { spinBoost = Math.max(spinBoost, 16 * power); };
  model.lockWheel = () => { spinBoost = 0; spinVel = 0.35; };
  model.setEyeGlow = k => { glow = k; };
  // EMERGENCE: sink the whole rig (bones, skinned body, outlines, props and
  // the wheel all ride the Root bone) below the floor and raise it back out.
  model.setEmerge = k => {
    emerge = Math.max(0, Math.min(1, k));
    rootBone.position.y = -(1 - emerge) * H * 1.06;
  };
  model.emergeAmount = () => emerge;

  const baseUpdate = model.update.bind(model);
  model.update = dt => {
    baseUpdate(dt);
    if (spinBoost > 0.01) {
      spinVel += (spinBoost - spinVel) * Math.min(1, dt * 6);
      spinBoost *= Math.pow(0.14, dt);           // decays to the lock
    } else if (spinVel > 0.36) {
      spinVel += (0.35 - spinVel) * Math.min(1, dt * 9);
    }
    wheelSpin.rotation.z += spinVel * dt;
    // the eye slits pulse with the wheel — faster spin, hotter sockets
    const f = flatMeshes();
    if (f) {
      const hot = 0.92 + Math.min(0.08, spinVel * 0.01) + Math.sin(performance.now() * 0.004) * 0.05;
      f.material.opacity = Math.max(0, Math.min(1, hot * glow));
      f.material.transparent = true;
    }
    wheelMat.emissiveIntensity = 0.9 + Math.min(1.6, spinVel * 0.09);
  };

  model.setEmerge(1);
  return model;
}
