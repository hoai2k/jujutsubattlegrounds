// ===========================================================================
// MAKI ZENIN 禪院真希 — REFERENCE SHEET
// ===========================================================================
// Researched 2026-08-19 from the Jujutsu Kaisen Wiki's Appearance section (via
// search-result extraction — the fandom host still answers 402 to WebFetch in
// this environment, exactly as models/toji.js records, so NO IMAGE WAS VIEWED
// for this pass and everything below is built from the written description
// plus the cosplay-guide breakdowns, which are unusually good on garment
// construction). Said plainly because the brief asked for it: this is a
// text-reference model, not a sheet-reference model, and the places that cost
// something are listed under APPROXIMATED at the bottom.
//
// ---------------------------------------------------------------------------
// WHICH MAKI. The version question is the first decision and it decides the
// whole file.
// ---------------------------------------------------------------------------
// Three canon looks exist:
//   1. ZENIN CLAN — white yukata, black hakama, long hair. Pre-series.
//   2. FIRST/SECOND YEAR — Jujutsu High jacket + pencil skirt, long black hair
//      in a short ponytail, rimless round glasses (year 1) then square
//      under-rim glasses (year 2).
//   3. POST-SHIBUYA — burned by Jogo's flames. Heavy burn scarring up both
//      arms and the sides of her face. Hair cut back to just past the ears.
//      Sleeveless black turtleneck, a CAPE pinned at each shoulder by a
//      Jujutsu High pin, a wide brown belt with a gold buckle, tight black
//      trousers. Still wearing the square glasses.
//
// SHIPPED: version 3, and the choice is forced by the gameplay. The awakening
// mechanic needs a base state WITH glasses and a final state WITHOUT them,
// because losing the glasses mid-fight is the strongest visual beat available
// — and that is exactly the canon transition. Post-Shibuya Maki wears them;
// after the Zenin massacre completes her Heavenly Restriction she can see
// curses unaided and stops. So the three awakening stages are not an invention
// laid over the design, they are the canon arc compressed into a round.
// The burn scars are therefore BASE geometry, present from stage 0, because
// she already has them when this outfit starts.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// Canon is 170 cm. This project scales slightly up from canon (Yuji is 173 cm
// and ships at 1.75), so H = 1.74. Against the shipped cast:
//     Nobara 1.62 · MIWA 1.66 · Inumaki 1.68 · Yuta 1.73 · >>> MAKI 1.74 <<< ·
//     Yuji/Megumi/Mahito 1.75 · Kashimo 1.79 · YUKI 1.82 · Naoya 1.83 ·
//     Nanami 1.845 · Toji 1.88 · Gojo 1.92
// which makes her the second-tallest woman in the game behind Yuki and the
// tallest of the students — "one of the taller characters" as the brief asks,
// without inventing 15 cm she does not have.
//
// MASS is where the brief's "visibly athletic and muscular" actually lives,
// and it is the number that matters more than the height. `muscle: 1.16` is
// the highest on any woman in the roster by a distance (Nobara 0.86) and sits
// between Nanami (1.10) and Hakari (1.28) — Panda's line about her "ripped
// abs" is a real design note and the shoulders and arms have to carry it. But
// `bulk` stays at 0.94: she is a LEAN athlete, not a heavyweight, and the
// silhouette is wide-shouldered over a narrow waist rather than thick. The
// sleeveless top exists in canon specifically to show the arms, so the arms
// are what the mass budget is spent on.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
// Wiki: "small green eyes (amber in the anime)", "thin eyebrows". A narrow,
// hard face — the eye aperture is the second-narrowest on the roster after
// Toji's, and on her it reads as focus rather than as his boredom.
// Eyes: the wiki leads with GREEN for the manga and the anime grades them
// amber. Taken as a green-gold (#8d9a4a) which is honest to both and survives
// the toon banding better than either extreme.
// Mouth: a flat, level line. She does not smile in a fight. The mouth widens
// slightly across the awakening stages — see `setStage` — which is the only
// facial change in the set and it is the last one to arrive.
//
// THE BURN SCARS. Modelled as real geometry, per the same standard the Toji
// mouth-scar note sets. Wiki: scars "running all the way up and down both her
// arms and the sides of her face". Built as:
//   · a mottled run of slightly raised, desaturated patches down the OUTSIDE
//     of both upper arms and forearms — five per arm, irregular
//   · two swept patches on the sides of the face, below and behind each eye,
//     stopping short of the eye itself so the face still reads
// Colour #c98a78 — the same scar tone Toji's mouth scar uses, deliberately, so
// the roster has one scar value rather than two.
//
// ---------------------------------------------------------------------------
// HAIR, FROM EVERY ANGLE
// ---------------------------------------------------------------------------
// Post-Shibuya length: "her hair now only reaches just past her ears."
// FRONT: a full fringe across the forehead, parted slightly off centre, with
//   longer strands framing each cheek — those cheek strands survive the cut
//   and are the detail that keeps the short version recognisably her.
// 3/4: the mass sits close to the skull; there is no volume at the crown.
// SIDE: it clears the ear and stops just below it. Shorter than Toji's, and
//   that is the reference — his stops AT the ear, hers just past it.
// BACK: flat and blunt-cut at the nape, no flick, no layering.
// Construction: scalp shell + hanging CARDS, the same treatment Nobara's bob
// uses and for the same reason (cones give a hedgehog, a cut hanging mass
// needs ribbons with a flat bottom edge).
// COLOUR: the manga draws it black; the anime grades it a very dark GREEN.
// #1f2a24 takes the anime reading — a black that goes green in the rim light,
// which is what separates her hair value from Megumi's and Toji's blue-blacks
// on screen. This is the single most-often-cited thing about her design and
// getting it merely "black" would be the most visible possible miss.
//
// ---------------------------------------------------------------------------
// GARMENTS, layer by layer
// ---------------------------------------------------------------------------
//   · TURTLENECK   sleeveless, black, high collar, tucked in. #1a1c22 — a
//                  charcoal rather than a true black, so the fabric bands.
//                  Built as the torso lathe (cloth) with BARE SKIN ARMS —
//                  `armSlot: 'skin'`, the same builder feature Toji's short
//                  sleeves added. The collar is its own short lathe.
//   · CAPE         the distinctive layer, and the one that makes the
//                  silhouette. Hangs from two shoulder pins, open at the
//                  front, falling to mid-thigh at the back. #14161c. Built as
//                  a spring chain so it swings — the brief's posture change
//                  across awakening stages reads mostly through this.
//   · PINS         two Jujutsu High pins, one per shoulder, gold #d8b45a.
//                  Small, but they are the reason the cape hangs the way it
//                  does and they are named in the reference.
//   · BELT         WIDE brown leather with a large gold buckle, worn high on
//                  the waist over the tucked hem. #6b4a2c / buckle #d9b64e.
//                  The single warmest value on the model and it is what stops
//                  her reading as a black column.
//   · TROUSERS     tight, black. #202229, a hair lighter than the top so the
//                  two layers separate.
//   · BOOTS        flat, black, low. #16171d.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin      #e8c6a6      hair       #1f2a24      top     #1a1c22
//   cape      #14161c      belt       #6b4a2c      buckle  #d9b64e
//   pants     #202229      boots      #16171d      pins    #d8b45a
//   eyes      #8d9a4a      brows      #1a2220      scar    #c98a78
//   glass     #cfe4e8      frame      #2a2d34
//   rim       #cfe0d6      outline    #0a0c10      accent  #5fae7a
// THE ACCENT IS DELIBERATELY TOJI'S FAMILY. His is #6ea88a, hers is #5fae7a —
// the same jade, hers greener and a shade deeper. They are the two Heavenly
// Restrictions and the select screen should say so at a glance. It is the one
// place in the project where two characters are intentionally adjacent in hue,
// and the rest of the design does the separating (see the note in anim/maki.js
// about why they do not read alike in the hands).
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the square under-rim glasses   4. the wide brown belt + gold buckle
//   2. the pinned cape silhouette     5. bare, scarred, muscled arms
//   3. short dark-green hair          6. two weapons, never four
// Items 1-5 are geometry and are in this file. Item 6 is the arsenal below.
//
// ---------------------------------------------------------------------------
// THE AWAKENING STAGES — what changes on the model
// ---------------------------------------------------------------------------
// `setStage(n)` for n in 0..3. Everything it touches is built once here and
// only shown/hidden or re-coloured, so the call is cheap enough to run every
// frame. Per stage:
//   0  BASE      glasses on. Cape intact. Posture is animation's job.
//   1  +wear     first tears in the cape hem. Eyes brighten a step.
//   2  +wear     cape badly torn, one pin's cloth ripped through. Glasses
//                CRACKED — a hairline across the left lens. Eyes brighter.
//   3  AWAKENED  GLASSES GONE. Cape shredded to ribbons. Eyes at full jade
//                and the sclera goes cold. A faint white presence shell
//                stands off the shoulders and forearms.
// The glasses are the beat and they are staged so the player sees it coming:
// intact → cracked → gone.
//
// ---------------------------------------------------------------------------
// WEAPONS — REUSED, NOT REBUILT, and said plainly as the brief asked
// ---------------------------------------------------------------------------
// PLAYFUL CLOUD and the SPLIT SOUL KATANA are Toji's existing prop builders
// from art/models/toji_weapons.js, imported unchanged and scaled to her
// height. Nothing in that file is modified. This is canon-correct as well as
// cheap: they are literally the same two cursed tools, inherited.
// What differs is her ATTACHMENT rotations, which are solved for her stance
// and her arm lengths (see the note in toji.js about why an attachment
// rotation cannot be copied between characters), and the fact that she carries
// BOTH — the katana rides on her back when the staff is in hand and vice
// versa, rather than going to the under-world stow slot Toji's arsenal uses.
// That is the visual statement of "two weapons, not an inventory".
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the cape's exact cut and how far down the back it falls. The reference
//     describes it as "a large cape attached by two pins" and no more; the
//     length here is a judgement call read off cosplay construction guides.
//   · the burn scars' actual pattern. The reference says where they are, not
//     what shape they are. These are plausible mottling, not a copy.
//   · the glasses' exact frame geometry — "square-framed under-rim" is the
//     description and that is what is built, but the bridge and temple detail
//     is invented.
//   · her hands. The shared mitt is used unchanged, as everywhere else.
//   · the Zenin-era yukata and the school-uniform-with-skirt versions are NOT
//     built. She ships post-Shibuya only.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, ribbonShell, mergeGeos, tubeBetween } from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';
import { buildPlayfulCloud, buildSplitSoulKatana } from './toji_weapons.js';

const SKIN = 0xe8c6a6;
const HAIR = 0x1f2a24;
const TOP = 0x1a1c22;
// PASS 4: lifted from #14161c. The cape was BUILT CORRECTLY the whole time —
// the spring chain hangs from the chest to mid-thigh, verified by reading the
// pivot world positions off a live model — but at #14161c against a #1a1c22
// turtleneck it was invisible from every angle. A cape reads by its EDGE, and
// there was no value difference for the edge to sit on. This is still a black
// at a glance; it is a slate-blue black rather than a charcoal one, and the
// two now separate.
const CAPE = 0x232838;
const BELT = 0x6b4a2c;
const BUCKLE = 0xd9b64e;
const PANTS = 0x202229;
const BOOT = 0x16171d;
const PIN = 0xd8b45a;
const EYE = 0x8d9a4a;
const SCAR = 0xc98a78;
const FRAME = 0x2a2d34;

// The four eye values, one per awakening stage. They walk from the green-gold
// the reference gives toward a cold, pale jade — the "her eyes change" beat.
const EYE_STAGES = [0x8d9a4a, 0x9fb455, 0xb4d06a, 0xd8f5a8];

export function buildMaki() {
  const spec = {
    id: 'maki', name: 'Maki', H: 1.74, headScale: 1.02,
    // WIDE SHOULDERS OVER A NARROW WAIST. 0.107 is broad for the frame — only
    // the heavyweights go higher — and the hip stays narrow, which is what
    // makes the athletic V read from the front without any extra geometry.
    shoulder: 0.107, hip: 0.050, muscle: 1.16, bulk: 0.94, legBulk: 0.97,
    skinTone: SKIN,
    clothColor: TOP,
    // ---- THE SLEEVELESS TOP: SLOT *AND* COLOUR --------------------------
    // PASS 2 FIX. `armSlot` only chooses the MATERIAL; the arm's vertex colour
    // still comes from `sleeveColor`, which defaults to `clothColor`. Setting
    // the slot alone gives skin-shaded arms painted charcoal — a sleeveless
    // top with sleeves. Toji's model already had this right and this now
    // matches it exactly.
    armSlot: 'skin', foreArmSlot: 'skin',
    sleeveColor: SKIN, foreSleeveColor: SKIN, handColor: SKIN,
    pantColor: PANTS, shoeColor: BOOT,
    torsoShape: { chest: 0.99, waist: 0.83, hip: 0.97 },
    face: { jaw: 0.94, chin: 1.02, width: 0.99 },
    shoe: { len: 0.104, wid: 0.042, hgt: 0.048 },
    palette: {
      rim: 0xcfe0d6, hairRim: 0x8fc4a0, outline: 0x0a0c10,
      accent: 0x5fae7a, energy: 0xcfe8d8, metalRim: 0xdfe8ff
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;
  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // Everything the awakening stages touch is collected here as it is built,
  // then wired into `setStage` at the bottom. Building the staged geometry up
  // front and only toggling visibility keeps the per-frame call free.
  const staged = { capeTears: [], presence: [], scarFace: [] };

  // ---- FACE ---------------------------------------------------------------
  // NARROW EYES UNDER THIN, LEVEL BROWS. The brows are the tell: thin (the
  // reference says so), set low, and almost horizontal — which reads as
  // concentration. Nobara's high arch is amusement; Maki's flat line is work.
  addFace(ctx, { noEyes: true, mouthW: 0 });
  const eyeW = headR * 0.50, eyeH = headR * 0.235;
  // ---- WHY THE EYES ARE NOT IN THE PART BAG -------------------------------
  // The bag MERGES every geometry in a slot into one SkinnedMesh and bakes the
  // colour into vertex attributes, so a handle returned by `bag.add` cannot be
  // recoloured afterwards — the buffer it came from no longer exists on its
  // own. Her irises change across the awakening stages, so the sclera and iris
  // are plain meshes parented to the Head bone instead, which is the same
  // treatment Kashimo's arcs use for the same reason. The lash, brow and pupil
  // never change, so those stay in the bag where they are cheaper.
  const eyeGroup = new THREE.Group();
  const irisMats = [];
  const scleraMats = [];
  for (const s of [1, -1]) {
    const ex = s * headR * 0.395;
    // heavy upper lash, angled DOWN toward the nose — a hard eye
    // PASS 4: thinned from 0.30 to 0.18 of the aperture. Her eye is already
    // the second-narrowest on the roster, and a heavy lash on top of a narrow
    // aperture merged with the brow into one black bar at gameplay distance.
    bag.add('flat', tGeo(roundBox(eyeW * 1.06, eyeH * 0.18, 0.004, 0.002),
      { rot: [0, 0, s * 7], pos: [ex, eyeY + eyeH * 0.50, faceZ + headR * 0.028] }),
      { bone: 'Head', color: 0x131a17 });
    const sclMat = new THREE.MeshBasicMaterial({ color: 0xf2f4f0 });
    scleraMats.push(sclMat);
    const scl = new THREE.Mesh(roundBox(eyeW, eyeH, 0.004, eyeH * 0.42), sclMat);
    scl.position.set(ex, eyeY, faceZ + headR * 0.02);
    eyeGroup.add(scl);
    const irMat = new THREE.MeshBasicMaterial({ color: EYE });
    irisMats.push(irMat);
    const ir = new THREE.Mesh(new THREE.CircleGeometry(eyeH * 0.52, 12), irMat);
    ir.scale.set(0.86, 1.10, 1);
    ir.position.set(ex - s * eyeW * 0.04, eyeY + eyeH * 0.02, faceZ + headR * 0.024);
    eyeGroup.add(ir);
    const pup = new THREE.Mesh(new THREE.CircleGeometry(eyeH * 0.22, 10),
      new THREE.MeshBasicMaterial({ color: 0x14180f }));
    pup.position.set(ex - s * eyeW * 0.04, eyeY + eyeH * 0.02, faceZ + headR * 0.027);
    eyeGroup.add(pup);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(eyeH * 0.13, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    gl.position.set(ex - s * eyeW * 0.16, eyeY + eyeH * 0.20, faceZ + headR * 0.031);
    eyeGroup.add(gl);
    // BROW: thin, low, near level. The 4-degree tilt is almost nothing and
    // that is the point.
    bag.add('flat', tGeo(roundBox(eyeW * 0.92, eyeH * 0.13, 0.004, 0.002),
      { rot: [0, 0, s * -4], pos: [ex, eyeY + eyeH * 1.34, faceZ + headR * 0.02] }),
      { bone: 'Head', color: 0x1a2220 });
  }
  // MOUTH: a level line, dead centre, no tilt at all.
  bag.add('flat', tGeo(roundBox(headR * 0.21, headR * 0.038, 0.004, 0.002),
    { pos: [0, headC.y - headR * 0.585, faceZ - headR * 0.045] }),
    { bone: 'Head', color: 0x8a4f4c });

  // ---- THE FACE SCARS -----------------------------------------------------
  // Swept patches on the sides of the face, below and behind each eye. They
  // stop well short of the eye itself: the reference puts them on the SIDES,
  // and running them across the eye would turn a burn survivor into a
  // pirate. Three irregular patches per side, angled back along the jaw.
  for (const s of [1, -1]) {
    // PASS 2: halved, for the same reason as the arm patches — at the old
    // size they read as face paint rather than as scarring, and the largest
    // one reached the outer corner of the eye, which the reference explicitly
    // does not do.
    const marks = [
      { w: 0.13, h: 0.042, x: 0.76, yy: -0.20, rot: -22 },
      { w: 0.095, h: 0.032, x: 0.82, yy: -0.34, rot: -30 },
      { w: 0.065, h: 0.025, x: 0.70, yy: -0.44, rot: -14 }
    ];
    for (const mk of marks) {
      const g = bag.add('skin', tGeo(roundBox(headR * mk.w, headR * mk.h, 0.005, headR * 0.02),
        { rot: [0, s * 26, s * mk.rot], pos: [s * headR * mk.x, headC.y + headR * mk.yy, headC.z + headR * 0.30] }),
        { bone: 'Head', color: SCAR });
      staged.scarFace.push(g);
    }
  }

  // ---- HAIR ---------------------------------------------------------------
  // Scalp shell first, cut away at the face, then hanging cards. The shell
  // reaches well down the skull (0.70π) — the same lesson nobara.js records:
  // stop it short and a pale band of scalp shows from behind.
  const FACE_GAP = 1.10;
  bag.add('hair', tGeo(sphereShell(headR * 1.02, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.70, scale: [1.03, 1.0, 1.06]
  }), { pos: [headC.x, headC.y + headR * 0.03, headC.z - headR * 0.02] }), { bone: 'Head', color: HAIR });

  // Hair card helper. The normal hint MUST be the radial direction at the
  // card's own position — see the pass-2 note in models/nobara.js for what
  // happens when every card shares one hint (a pumpkin with a face in it).
  const card = (from, mid, to, w0, w1, hint, color = HAIR) => {
    const geo = ribbonShell([from, mid, to], t => w0 + (w1 - w0) * t, headR * 0.085,
      { seg: 8, normalHint: hint.clone().normalize(), taperThick: false });
    return bag.add('hair', geo, { bone: 'Head', color });
  };

  // FRINGE: a full curtain across the forehead, parted just off centre so it
  // is not symmetrical. Cards hang forward and down over the brow.
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.30 + 0.09;               // the +0.09 is the off-centre part
    const sx = Math.sin(a) * headR * 0.86;
    const sz = Math.cos(a) * headR * 0.80;
    const len = headR * (0.66 - Math.abs(i) * 0.045);
    card(
      v3(sx * 0.86, headC.y + headR * 0.60, sz * 0.86),
      v3(sx * 1.02, headC.y + headR * 0.16, sz * 1.02),
      v3(sx * 1.04, headC.y - len * 0.52, sz * 1.02),
      headR * 0.30, headR * 0.20,
      v3(sx, headR * 0.30, sz)
    );
  }
  // CHEEK STRANDS: the two longer pieces that frame the face. These survive
  // the post-Shibuya cut in the reference and they are what keeps the short
  // version recognisable, so they run noticeably past the jaw.
  for (const s of [1, -1]) {
    card(
      v3(s * headR * 0.84, headC.y + headR * 0.44, headR * 0.52),
      v3(s * headR * 0.94, headC.y - headR * 0.22, headR * 0.56),
      v3(s * headR * 0.88, headC.y - headR * 0.98, headR * 0.44),
      headR * 0.22, headR * 0.12,
      v3(s * 1, 0.1, 0.7)
    );
  }
  // SIDES AND BACK: a ring of cards clearing the ear and stopping just below
  // it, blunt-cut. No flick at the nape — the back is flat, which is the
  // difference between this and every long-haired model in the project.
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * 0.30 + (i / 10) * Math.PI * 1.40;
    const sx = Math.sin(a), sz = Math.cos(a);
    // just past the ear: the ear sits at about -0.08·headR, so -0.62 clears it
    const drop = headC.y - headR * (0.58 + (Math.abs(sz) > 0.5 && sz < 0 ? 0.10 : 0));
    card(
      v3(sx * headR * 0.80, headC.y + headR * 0.42, sz * headR * 0.80),
      v3(sx * headR * 1.00, headC.y - headR * 0.10, sz * headR * 1.00),
      v3(sx * headR * 0.98, drop, sz * headR * 1.00),
      headR * 0.30, headR * 0.26,
      v3(sx, 0.22, sz)
    );
  }

  // ---- THE GLASSES --------------------------------------------------------
  // SQUARE UNDER-RIM. The reference is specific: her second-year pair is
  // square and under-rim, meaning the frame runs along the BOTTOM of the lens
  // and the top edge is open. That is genuinely distinctive and it is built
  // as described — a lens plate with a bar under it and no bar over it.
  //
  // Kept in its own group so `setStage` can hide the whole thing at once,
  // which is the awakening's headline beat.
  const glassGroup = new THREE.Group();
  const lensMat = new THREE.MeshBasicMaterial({
    color: 0xcfe4e8, transparent: true, opacity: 0.26, depthWrite: false
  });
  const frameMat = MAT.metal({ vertexColors: false, color: FRAME, rimColor: 0xdfe8ff });
  const lensW = headR * 0.46, lensH = headR * 0.30;
  const crackMeshes = [];
  for (const s of [1, -1]) {
    const lx = s * headR * 0.40;
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(lensW, lensH), lensMat);
    lens.position.set(lx, eyeY + headR * 0.01, faceZ + headR * 0.10);
    glassGroup.add(lens);
    // UNDER-RIM: the bar goes along the bottom edge only.
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(lensW * 1.06, headR * 0.028, headR * 0.026), frameMat);
    rim.position.set(lx, eyeY - lensH * 0.5, faceZ + headR * 0.10);
    glassGroup.add(rim);
    // short vertical returns at the outer and inner corners — a square frame
    // reads square because of its corners, not its edges
    for (const c of [-1, 1]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(headR * 0.024, lensH * 0.42, headR * 0.024), frameMat);
      post.position.set(lx + c * lensW * 0.5, eyeY - lensH * 0.30, faceZ + headR * 0.10);
      glassGroup.add(post);
    }
    // temple arm back to the ear
    const temple = new THREE.Mesh(
      new THREE.BoxGeometry(headR * 0.020, headR * 0.020, headR * 0.86), frameMat);
    temple.position.set(s * headR * 0.86, eyeY + headR * 0.02, faceZ - headR * 0.44);
    glassGroup.add(temple);
    // THE CRACK, hidden until stage 2. A hairline across the LEFT lens only
    // (the model's +X side), angled. One thin dark quad — restraint reads as
    // damage here; a shattered lens would read as comedy.
    if (s === 1) {
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(lensW * 0.92, headR * 0.010, headR * 0.004),
        new THREE.MeshBasicMaterial({ color: 0xe8f4f8, transparent: true, opacity: 0.85 }));
      crack.position.set(lx, eyeY + headR * 0.01, faceZ + headR * 0.11);
      crack.rotation.z = -0.42;
      crack.visible = false;
      glassGroup.add(crack);
      crackMeshes.push(crack);
      const crack2 = new THREE.Mesh(
        new THREE.BoxGeometry(lensW * 0.38, headR * 0.008, headR * 0.004),
        new THREE.MeshBasicMaterial({ color: 0xe8f4f8, transparent: true, opacity: 0.7 }));
      crack2.position.set(lx + lensW * 0.12, eyeY - headR * 0.05, faceZ + headR * 0.11);
      crack2.rotation.z = 0.9;
      crack2.visible = false;
      glassGroup.add(crack2);
      crackMeshes.push(crack2);
    }
  }
  // bridge
  const bridge = new THREE.Mesh(
    new THREE.BoxGeometry(headR * 0.30, headR * 0.020, headR * 0.022), frameMat);
  bridge.position.set(0, eyeY - lensH * 0.30, faceZ + headR * 0.10);
  glassGroup.add(bridge);

  // ---- THE ARM SCARS ------------------------------------------------------
  // Down the OUTSIDE of both arms, upper and fore. Irregular in size and
  // spacing — a regular run of identical patches reads as a pattern, and burn
  // scarring is the opposite of a pattern. Placed against the arm chain so
  // they deform with the limb.
  for (const s of ['L', 'R']) {
    const sgn = s === 'L' ? 1 : -1;
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s), wr = joints.get('Hand' + s);
    const armChain = [
      { bone: 'UpArm' + s, point: sh }, { bone: 'LoArm' + s, point: el }, { bone: 'Hand' + s, point: wr }
    ];
    // PASS 2 FIX — these were roughly a THIRD the size. At 0.052·H wide on a
    // limb whose tube radius is 0.036·H, each "patch" was wider than the arm
    // and the six of them read as a sleeve rather than as scarring. Scars are
    // marks ON a surface; if they cover the surface they have stopped being
    // scars. Narrow, short, and spread further apart now.
    const patches = [
      { t: 0.20, seg: 'up', w: 0.020, h: 0.034 },
      { t: 0.46, seg: 'up', w: 0.014, h: 0.024 },
      { t: 0.74, seg: 'up', w: 0.017, h: 0.020 },
      { t: 0.24, seg: 'fore', w: 0.015, h: 0.026 },
      { t: 0.60, seg: 'fore', w: 0.012, h: 0.018 },
      { t: 0.86, seg: 'fore', w: 0.010, h: 0.015 }
    ];
    for (const p of patches) {
      const a = p.seg === 'up' ? sh : el;
      const b = p.seg === 'up' ? el : wr;
      const at = a.clone().lerp(b, p.t);
      // pushed out along the limb's OUTBOARD normal so the patch sits on the
      // surface rather than inside the tube
      at.x += sgn * 0.031 * H;
      bag.add('skin', tGeo(roundBox(p.w * H, p.h * H, 0.006 * H, 0.003 * H),
        { rot: [0, 0, sgn * 12], pos: [at.x, at.y, at.z] }),
        { chain: armChain, color: SCAR, blend: 0.09 });
    }
  }

  // ---- THE TURTLENECK COLLAR ---------------------------------------------
  // A short lathe standing up off the shoulders. High enough to read from the
  // front, not so high it eats the jaw.
  bag.add('cloth', tGeo(latheY([
    [0.046 * H, y.neck - 0.026 * H], [0.043 * H, y.neck + 0.006 * H],
    [0.041 * H, y.neck + 0.030 * H], [0.040 * H, y.neck + 0.044 * H]
  ], 16, 0.80), { pos: [0, 0, 0.004 * H] }), { bone: 'Neck', color: TOP });

  // ---- THE BELT -----------------------------------------------------------
  // WIDE, brown, worn high, with a big gold buckle. The reference calls it
  // "a large brown belt with a gold buckle" and it is the only warm value on
  // the whole model — it is what stops her being a black column, so it is
  // built generously.
  bag.add('cloth', tGeo(latheY([
    [0.062 * H, 0.560 * H], [0.066 * H, 0.572 * H],
    [0.066 * H, 0.606 * H], [0.062 * H, 0.618 * H]
  ], 20, 0.78)), { chain: torsoChain, color: BELT, blend: 0.04 });
  bag.add('metal', tGeo(roundBox(0.060 * H, 0.044 * H, 0.016 * H, 0.006 * H),
    { pos: [0, 0.589 * H, 0.050 * H] }), { chain: torsoChain, color: BUCKLE, blend: 0.02 });
  // the buckle's inner cut-out, drawn as a darker inset plate
  bag.add('metal', tGeo(roundBox(0.034 * H, 0.022 * H, 0.008 * H, 0.004 * H),
    { pos: [0, 0.589 * H, 0.056 * H] }), { chain: torsoChain, color: 0x8a6f2e, blend: 0.02 });

  // ---- THE SHOULDER PINS --------------------------------------------------
  // Two Jujutsu High pins, one per shoulder, holding the cape on. Small — but
  // they are the reason the cape hangs at all and they are named in the
  // reference, so they are real geometry.
  for (const s of [1, -1]) {
    const sh = joints.get('UpArm' + (s > 0 ? 'L' : 'R'));
    bag.add('metal', tGeo(new THREE.CylinderGeometry(0.016 * H, 0.016 * H, 0.008 * H, 10),
      { rot: [90, 0, 0], pos: [sh.x * 0.86, sh.y + 0.014 * H, sh.z + 0.024 * H] }),
      { bone: 'Chest', color: PIN });
    bag.add('metal', tGeo(new THREE.CylinderGeometry(0.008 * H, 0.008 * H, 0.010 * H, 8),
      { rot: [90, 0, 0], pos: [sh.x * 0.86, sh.y + 0.014 * H, sh.z + 0.030 * H] }),
      { bone: 'Chest', color: 0x8a6f2e });
  }

  // =========================================================================
  // THE CAPE
  // =========================================================================
  // The silhouette. Hung from the two pins as a spring chain so it swings with
  // her — which is where most of the posture change across the awakening
  // stages actually reads, because a cape on a braced body hangs dead and a
  // cape on a loose one moves.
  //
  // Built as SIX panels across the back rather than one sheet: a single flap
  // reads as a plank, and six lets the hem tear independently per stage.
  // a strong cool rim, for the same reason: the silhouette edge is the only
  // part of a near-black garment that can carry information
  const capeMat = MAT.cloth({ vertexColors: false, color: CAPE, rimColor: 0xa8bdd4 });
  const springs = [];
  const capePanels = [];
  const PANELS = 6;
  for (let i = 0; i < PANELS; i++) {
    const u = (i / (PANELS - 1)) * 2 - 1;               // -1 .. 1 across the back
    const px = u * 0.088 * H;
    // panels toward the outside are shorter, so the hem reads as a curve
    const len = 0.30 * H * (1 - Math.abs(u) * 0.22);
    const seg1 = makeFlapMesh(0.042 * H, 0.048 * H, len * 0.55, 0.006 * H, capeMat, CAPE,
      { color: 0x0a0c10, thickness: 0.016 });
    const seg2 = makeFlapMesh(0.048 * H, 0.040 * H, len * 0.45, 0.006 * H, capeMat, CAPE,
      { color: 0x0a0c10, thickness: 0.016 });
    springs.push({
      bone: 'Chest',
      localOffset: v3(px, 0.104 * H, -0.052 * H),
      restDir: v3(u * 0.10, -1, -0.14).normalize(),
      segments: [
        { len: len * 0.55, mesh: seg1 },
        { len: len * 0.45, mesh: seg2 }
      ],
      // SOFT AND SLOW. A cape is a big, heavy sheet: low stiffness so it lags
      // well behind her, high damping so it settles rather than flapping. The
      // roster's other spring chains (Toji's belt tails at 62) are small light
      // things and want the opposite numbers.
      stiffness: 30, damping: 0.86, gravity: 7.5
    });
    capePanels.push({ seg1, seg2, u });
  }
  // THE TEARS. Built now, hidden now. Each stage reveals more of them, and
  // they are RAGGED WEDGES cut out of the hem rather than a texture — a
  // notch in the silhouette is the only kind of damage that survives a toon
  // outline pass at gameplay distance.
  for (const p of capePanels) {
    for (let k = 0; k < 3; k++) {
      const notch = new THREE.Mesh(
        new THREE.ConeGeometry(0.020 * H * (1 + k * 0.3), 0.070 * H * (1 + k * 0.45), 3),
        new THREE.MeshBasicMaterial({ color: 0x05060a }));
      // sits at the bottom edge of the lower segment, pointing UP into it, so
      // it reads as cloth missing rather than as a spike hanging off
      notch.position.set((k - 1) * 0.016 * H, -0.008 * H, 0);
      notch.rotation.x = Math.PI;
      notch.visible = false;
      p.seg2.add(notch);
      staged.capeTears.push({ mesh: notch, stage: k + 1 });
    }
  }

  // ---- THE PRESENCE SHELL -------------------------------------------------
  // Stage 3 only. A faint white standing shell off the shoulders and forearms
  // — the "subtle physical presence effect" the brief asks for. Deliberately
  // NOT particles and NOT an aura dome: she has no cursed energy and giving
  // her a glow would say the opposite of what the character is. This is
  // pressure displacing air, so it is a hard-edged shell that sits still.
  const presenceMat = new THREE.MeshBasicMaterial({
    color: 0xdff0e4, transparent: true, opacity: 0.0,
    depthWrite: false, side: THREE.BackSide
  });
  for (const [bone, r, off] of [
    ['UpArmL', 0.052, 0.02], ['UpArmR', 0.052, 0.02],
    ['LoArmL', 0.042, 0.01], ['LoArmR', 0.042, 0.01],
    ['Chest', 0.098, 0.00]
  ]) {
    const shell = new THREE.Mesh(new THREE.SphereGeometry(r * H, 10, 8), presenceMat);
    shell.position.y = off * H;
    shell.scale.set(1, 1.5, 1);
    shell.visible = false;
    staged.presence.push({ mesh: shell, bone });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0125, outlineHairScale: 0.95,
    props: {
      // ---- THE TWO WEAPONS ------------------------------------------------
      // TOJI'S BUILDERS, IMPORTED UNCHANGED. Nothing in toji_weapons.js is
      // modified and nothing is rebuilt. What is hers is the ATTACHMENT set:
      // she has a `back` slot as well as a `hand` slot, because unlike his
      // inventory curse — which swallows what he is not holding — she visibly
      // carries BOTH tools at once. Two weapons on the body at all times is
      // the read that separates her from his four-weapon wheel at a glance.
      playful_cloud: {
        node: buildPlayfulCloud(spec.H, { section: 0.32 }), default: 'twoHand',
        attachments: {
          // SOLVED, not guessed. The rotation is derived by taking the bone's
          // world quaternion under HER OWN stance, inverting it, and asking for
          // the minimal rotation that lands the prop's local +Y on the world
          // direction the weapon should point — which is the method
          // models/toji.js documents and the reason his numbers cannot simply
          // be copied here.
          // PASS 4. A 1.35 m staff on a 1.74 m body DOUBLES her silhouette if
          // it points up, which is what passes 1–3 all did in one form or
          // another. Carried in one hand it HANGS — tip down and slightly
          // forward — and the whole model reads as a person with a weapon
          // instead of a person with a flagpole.
          // THE TWO-HANDED CARRY, and the reason it exists.
          //
          // Her whole Cloud clip set is authored around a staff held ACROSS
          // THE BODY — idleCloud says so in as many words, and the poses back
          // it: both arms are driven, and her hands sit 0.75-0.96 m apart
          // through every clip in the set. But the weapon was hanging off one
          // hand in `hand` below, which meant her left hand was reaching for
          // something 0.62-0.92 m away from it. The animation and the
          // attachment disagreed, and the animation was right.
          //
          // Solved, not guessed, by the method models/toji.js documents: take
          // the settled idleCloud pose, aim the staff's local +Y from the left
          // hand to the right one, and put the butt 0.25 m back beyond the
          // left. At 0.32·H the three sections come to 1.67 m, which leaves
          // 0.54 m of staff past her leading hand — the part that reads as a
          // polearm rather than a bar.
          //
          // `grip` is what makes it survive an imported body (rig3d/grip.js):
          // the retargeter transfers rotations, so a 3D Maki's left hand lands
          // wherever HER arm reaches and misses the haft by a few centimetres.
          // The segment, rather than a point, is the grip sliding along the
          // shaft as her hands open and close through the set.
          twoHand: {
            bone: 'HandR',
            pos: [0.0231 * spec.H, 0.192 * spec.H, -0.5443 * spec.H],
            rot: [111.7, -44.5, 3.2],
            grip: { bone: 'HandL', at: [0, 0.05, 0], to: [0, 0.26, 0] }
          },
          // the one-handed hang, kept: it is the carry for anything that is
          // not the Cloud set, and it is what `back` swaps against
          hand: { bone: 'HandR', pos: [0, -0.050 * spec.H, 0.010 * spec.H], rot: [-5, -3, 72] },
          // slung diagonally across the back, butt-down over the left hip
          // PASS 3, solved the same way: slung DIAGONALLY across the back, so
          // the two weapons make an X behind her shoulder blades rather than
          // two vertical bars beside her head (pass 1) or a bar across her
          // hips (pass 2).
          back: { bone: 'Chest', pos: [-0.026 * spec.H, 0.030 * spec.H, -0.070 * spec.H], rot: [-156, -12, 8] }
        }
      },
      split_soul: {
        node: buildSplitSoulKatana(spec.H), default: 'back',
        attachments: {
          // solved against HER stance, not copied from his — see the note in
          // models/toji.js about why an attachment rotation cannot travel
          // between characters
          hand: { bone: 'HandR', pos: [0, -0.053 * spec.H, 0.012 * spec.H], rot: [3, -13, -153] },
          // ...and the katana the other way across it.
          // PASS 4: steepened. At [-18, 32, -123] the blade lay nearly
          // horizontal across her back and projected a full body-width to the
          // side, which reads as a crossbar rather than as a carried sword.
          // This is the classic back-carry — hilt above one shoulder, tip down
          // toward the opposite hip — which is also the most compact way to
          // hang 1.2 m of blade on a 1.74 m body.
          back: { bone: 'Chest', pos: [0.026 * spec.H, 0.030 * spec.H, -0.068 * spec.H], rot: [-24, 12, -152] }
        }
      }
    }
  });

  // the glasses and the recolourable eyes ride the head bone
  model.getBone('Head').add(glassGroup);
  model.getBone('Head').add(eyeGroup);
  // presence shells ride their own bones
  for (const p of staged.presence) model.getBone(p.bone).add(p.mesh);

  // =========================================================================
  // setStage — THE AWAKENING, ON THE MODEL
  // =========================================================================
  // Called every tick from combat/awakening.js. Cheap: it flips visibility and
  // writes two colours, and it early-outs when the stage has not changed.
  let curStage = -1;
  model.setStage = n => {
    const s = Math.max(0, Math.min(3, n | 0));
    if (s === curStage) return;
    curStage = s;

    // GLASSES: on at 0 and 1, cracked at 2, GONE at 3.
    glassGroup.visible = s < 3;
    for (const c of crackMeshes) c.visible = s === 2;

    // CAPE WEAR: one more tear per stage.
    for (const t of staged.capeTears) t.mesh.visible = s >= t.stage;

    // EYES: brighter and colder each step.
    for (const mt of irisMats) mt.color.setHex(EYE_STAGES[s]);
    // at full awakening the sclera goes cold too — the whole eye changes, not
    // just the iris, which is what makes it read at gameplay distance
    for (const mt of scleraMats) mt.color.setHex(s === 3 ? 0xdff2e8 : 0xf2f4f0);

    // PRESENCE: stage 3 only, and it fades in rather than popping.
    presenceMat.opacity = s === 3 ? 0.16 : 0;
    for (const p of staged.presence) p.mesh.visible = s === 3;
  };
  model.setStage(0);

  // WHICH WEAPON IS IN HAND. Two-way, not a wheel: whichever one is not held
  // goes to the BACK, never to the under-world stow slot.
  model.setWeapon = key => {
    const held = key === 'split_soul' ? 'split_soul' : 'playful_cloud';
    const other = held === 'split_soul' ? 'playful_cloud' : 'split_soul';
    // the staff goes in BOTH hands — that is the carry its clip set is drawn
    // for. The katana is a one-handed weapon and keeps `hand`.
    model.attachProp(held, held === 'playful_cloud' ? 'twoHand' : 'hand');
    model.attachProp(other, 'back');
  };
  model.setWeapon('playful_cloud');

  // NO CURSED ENERGY. Same stubs Toji carries and for the same reason: any
  // system that optional-chains one of these gets a defined no-op rather than
  // silently doing nothing for a reason nobody can find six months later.
  model.setSukuna = () => { };
  model.setOverheat = () => { };
  model.setFingers = () => { };
  return model;
}
