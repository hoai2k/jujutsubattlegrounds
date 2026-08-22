// ===========================================================================
// TAKUMA INO — 猪野琢真
// ===========================================================================
// REFERENCE SHEET. Written from the anime character design sheet (JJK season
// 2, Shibuya Incident) plus the Jujutsu Kaisen Wiki, the Heroes Wiki entry,
// the Animated Character Database entry and the Japanese アニヲタWiki /
// entame-life / comic-mate write-ups. Studied front, three-quarter, side and
// back before a line of this was written.
//
// ---------------------------------------------------------------------------
// *** THE ONE THING THE DESIGN BRIEF GOT WRONG ABOUT HIS LOOK ***
// ---------------------------------------------------------------------------
// HE DOES NOT WEAR SUNGLASSES. The brief lists "sunglasses and the mask" as
// his two identifiers. There are no sunglasses anywhere in his design; he has
// ordinary, slightly tired, uncovered eyes. What the brief is reaching for is
// real and it is ONE object rather than two: THE BLACK KNIT SKI MASK, worn
// rolled up as a beanie, which he pulls down over his whole face to the chin
// to activate his technique. It is his silhouette, it is his gameplay, and it
// is modelled here as a real garment with two states rather than as a hat plus
// a separate mask.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, AGAINST THE ROSTER
// ---------------------------------------------------------------------------
// Canon: "a young man of average height". He is 21, a grade 2 sorcerer at the
// time of Shibuya, and he is built like a normal fit adult rather than like a
// fighter — no visible muscle, no bulk, no width.
//
//   H = 1.79  — level with Kashimo (1.79), just under Takaba (1.80) and Choso
//               (1.81), above the students (Yuji/Megumi 1.75). Dead centre of
//               the human half of the roster, which is what "average" means
//               here.
//   muscle 0.96 / bulk 0.98 — BELOW the default. He is the second-slightest
//               adult male on the roster after Inumaki. The loose sweatshirt
//               does all the shape.
//   shoulder 0.112 — narrow, and narrower than the garment reads, which is the
//               point: the sweatshirt is oversized and hangs off him.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
//   · Soft oval face, small chin, unremarkable jaw. `face: { jaw: 0.94,
//     chin: 0.92, width: 0.97 }`.
//   · THE EYES ARE THE CHARACTERISATION. Half-lidded, slightly downturned,
//     with low flat brows — the design sheet gives him a permanently
//     unimpressed, faintly tired expression. He is the most earnest person in
//     the cast and he does not look like it, and that gap is the joke of the
//     design. `browTilt: 3`, `lashTilt: 4`, eyes wide and short.
//   · Dark brown eyes (0x4a3a2e), not black.
//   · A small flat mouth. No smile in neutral.
//
// ---------------------------------------------------------------------------
// HAIR — DISHEVELLED, DARK BROWN, AND MOSTLY HIDDEN
// ---------------------------------------------------------------------------
//   FRONT  a few strands escape from under the beanie's edge onto the
//          forehead, in two or three clumps. Not a fringe — the beanie sits
//          low enough that the hairline is covered.
//   3/4    the mass at the temple and in front of the ear is visible and it is
//          messy: short irregular tufts going in three directions.
//   SIDE   ends just below the ear.
//   BACK   a wedge of hair sticking out from under the beanie's rolled hem,
//          slightly longer at the nape. This is the angle where the hair reads
//          most, and it is the one a lineup shot has to check.
//   Colour 0x3e3128 base, 0x574538 highlight. Canon is BROWN, not black —
//          it is why he does not read as another dark-haired Tokyo sorcerer
//          next to Megumi and Inumaki on the select screen.
//
// ---------------------------------------------------------------------------
// GARMENTS — every layer
// ---------------------------------------------------------------------------
//   1 THE SKI MASK / BEANIE (0x181920). ONE garment, TWO STATES, and it is
//     built as real geometry that moves between them:
//        UP    a slouched beanie with a thick rolled hem sitting above the
//              brows. This is neutral.
//        DOWN  the same knit pulled over the whole face to the chin, with an
//              EYE SLOT cut in it. This is his technique being on.
//     `setMask(t)` drives it — see the bottom of this file. The knit's rolled
//     hem becomes the collar of the balaclava, which is exactly what happens
//     when you unroll a real one.
//   2 THE SWEATSHIRT (0x1c1d24). WIDE-COLLARED — the design sheet's most
//     specific garment note. A boat neck that sits off the shoulders and shows
//     the collarbone. Long sleeves ending at the wrist with a ribbed cuff.
//     Loose through the body; the hem sits at the hip.
//   3 THE TROUSERS (0x1c1d24). Same black, loose, and TUCKED INTO the boots —
//     so there is a visible bunch at the ankle rather than a clean line.
//   4 THE HIGH-TOP SNEAKERS. Dark navy canvas (0x2c3446) with a WHITE RUBBER
//     TOE CAP and white sole (0xdedbd2), and dark laces. The white toe is the
//     only bright thing on the entire character and it is the detail that
//     stops him reading as a black silhouette.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin        0xe8c4a2
//   hair        0x3e3128   brown, canon — NOT black
//   hair hi     0x574538
//   knit        0x181920   the mask/beanie
//   knit rib    0x24262f   its rolled hem, one step up so the roll reads
//   cloth       0x1c1d24   sweatshirt and trousers
//   cloth dk    0x121319
//   shoe        0x2c3446   navy canvas
//   shoe white  0xdedbd2   toe cap and sole
//   eye         0x4a3a2e
//   ACCENT      0x8fd8c4   — see the audit in characters/ino.js
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in the order a player will notice them
// ---------------------------------------------------------------------------
//   1. The beanie, and the moment it comes DOWN.
//   2. Head-to-toe black with two white toe caps.
//   3. The wide collar and the bare collarbone.
//   4. The tired eyes above it all.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import { latheY, tGeo, roundBox, sphereShell, coneSpike } from '../builders/geo.js';
import { MAT, toonMaterial } from '../shaders/toon.js';
import { makeOutline } from '../shaders/outline.js';
import { v3 } from '../../core/mathutil.js';

const SKIN = 0xe8c4a2;
const HAIR = 0x3e3128;
const HAIR_HI = 0x574538;
// *** PASS 2 — THE VALUES ARE LIFTED, AND HERE IS WHY. ***
// The first pass used the design sheet's literal near-blacks: knit 0x181920,
// cloth 0x1c1d24. Under the game's toon ramp (`cloth` bands at 64/140/255)
// everything below about 0x24 crushes to the same unlit value, and the first
// render came back as a black silhouette with two white shoes — no collar, no
// sleeve, no hem, no form anywhere on the body.
//
// A cel shader cannot show you a fold it has no room to band. So every value
// here is raised until there are at least TWO readable steps on a curved
// surface, while staying unambiguously black next to the rest of the roster:
// Todo's uniform is 0x222739 and Toji's shirt is darker still, and Ino now
// sits between them rather than below both.
//
// The DARK variants are kept only one step down rather than three, because the
// job of a dark variant here is to draw an EDGE (a hem, a cuff, a fold), and
// an edge that crushes is not an edge.
const KNIT = 0x22242e;
const KNIT_RIB = 0x32353f;      // the rolled hem — a full step up, so it reads
const CLOTH = 0x272932;
const CLOTH_DK = 0x191b22;
const SHOE = 0x2c3446;
const SHOE_W = 0xdedbd2;
const EYE = 0x4a3a2e;
const ACCENT = 0x8fd8c4;

export function buildIno() {
  const spec = {
    id: 'ino', name: 'Ino', H: 1.79, headScale: 1.0,
    shoulder: 0.112, hip: 0.050, muscle: 0.96, bulk: 0.98, legBulk: 1.02,
    skinTone: SKIN, clothColor: CLOTH, sleeveColor: CLOTH, pantColor: CLOTH,
    shoeColor: SHOE,
    // the high-tops are TALL, which is what makes them high-tops rather than
    // trainers, and the trouser bunches on top of them
    shoe: { len: 0.120, hgt: 0.068, wid: 0.048 },
    torsoShape: { chest: 1.00, waist: 0.98, hip: 1.00 },
    face: { jaw: 0.94, chin: 0.92, width: 0.97 },
    // A STRONG COOL RIM, and it is doing more work here than on anybody else on
    // the roster: he is the only fighter dressed head to toe in one dark value,
    // so the rim light is the entire reason his arm reads as separate from his
    // torso at fighting distance. 0x8fb4d8 against the roster's usual warm
    // 0xffd0b0 — cool, because a warm rim on black cloth reads as brown.
    // `hairRim` is DELIBERATELY the darkest on the roster. `MAT.hair` carries
    // gloss 0.35 and a strong wide rim, which is right for Gojo's white crop and
    // catastrophic on a mass of short dark tufts: it lit every tuft's tip and
    // turned the back of his head into a row of pale blocks in two consecutive
    // passes. At 0x4e5a68 the mass holds together and the specular only shows
    // on the strands actually facing the key light.
    palette: { rim: 0x8fb4d8, hairRim: 0x4e5a68, outline: 0x05060b, accent: ACCENT, energy: ACCENT }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, torsoChain, joints } = ctx.m;

  // ---- THE WIDE COLLAR ----------------------------------------------------
  // The single most specific garment note on the design sheet, and it is a
  // NEGATIVE feature: the neckline is cut wide and LOW so the collarbone and
  // the base of the neck are bare. Built as a shallow lathe ring that sits
  // BELOW the neck rather than around it, plus a bare skin patch above it.
  bag.add('skin', latheY([
    [0.040 * H, y.neck - 0.030 * H], [0.046 * H, y.neck - 0.048 * H]
  ], 18, 0.86), { chain: torsoChain, color: SKIN, blend: 0.05 });
  // the collar band itself — thick knit ribbing, sitting wide
  // *** PASS 2: THE COLLAR IS A RIDGE, NOT A STRIPE. *** Pass 1 built it as
  // two thin lathes a millimetre apart in two values that both crushed, and it
  // vanished. It is now a genuinely PROUD ring — 0.064 H against the body's
  // 0.056 H, so it stands 1.5 cm off the chest — with a lighter top edge, which
  // is how a thick knit collar catches light in every reference of him.
  bag.add('cloth', latheY([
    [0.058 * H, 0.774 * H], [0.064 * H, 0.788 * H],
    [0.0645 * H, 0.802 * H], [0.058 * H, 0.814 * H]
  ], 22, 0.92), { chain: torsoChain, color: CLOTH_DK, blend: 0.05 });
  bag.add('cloth', latheY([
    [0.0652 * H, 0.792 * H], [0.0652 * H, 0.800 * H]
  ], 22, 0.92), { chain: torsoChain, color: 0x3a3d48, blend: 0.05 });

  // ---- THE SWEATSHIRT'S LOOSENESS -----------------------------------------
  // The torso lathe the builder makes is a BODY, and he is wearing a garment
  // two sizes too big. One extra shell over the chest and waist, wider than
  // the body underneath, is what turns a slim torso into a loose sweatshirt.
  bag.add('cloth', latheY([
    [0.070 * H, 0.480 * H], [0.078 * H, 0.520 * H], [0.082 * H, 0.600 * H],
    [0.084 * H, 0.680 * H], [0.081 * H, 0.740 * H], [0.070 * H, 0.782 * H]
  ], 22, 0.82), { chain: torsoChain, color: CLOTH, blend: 0.05 });
  // the hem, one step darker so it reads as a folded edge
  bag.add('cloth', latheY([
    [0.0785 * H, 0.472 * H], [0.0805 * H, 0.492 * H]
  ], 22, 0.82), { chain: torsoChain, color: CLOTH_DK, blend: 0.05 });
  // ribbed cuffs at the wrists
  for (const s of ['L', 'R']) {
    const wr = joints.get('Hand' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.021 * H, 0.024 * H, 0.034 * H, 10),
      { pos: [wr.x, wr.y + 0.020 * H, wr.z] }), { bone: 'LoArm' + s, color: CLOTH_DK });
  }

  // ---- TROUSERS TUCKED INTO THE BOOTS -------------------------------------
  // The bunch at the ankle. Two stacked rings above the shoe, the upper one
  // wider — that overhang is the whole read of "tucked in".
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.036 * H, 0.030 * H, 0.045 * H, 10),
      { pos: [an.x, an.y + 0.070 * H, an.z] }), { bone: 'Shin' + s, color: CLOTH });
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.032 * H, 0.028 * H, 0.030 * H, 10),
      { pos: [an.x, an.y + 0.042 * H, an.z] }), { bone: 'Shin' + s, color: CLOTH_DK });
  }

  // ---- THE HIGH-TOPS ------------------------------------------------------
  // The builder gave us a navy shoe block; these are the three things that
  // make it a high-top canvas sneaker: a TALL ANKLE COLLAR, a WHITE RUBBER TOE
  // CAP and a WHITE SOLE. The white is the only bright value on the character.
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    // ankle collar
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.031 * H, 0.034 * H, 0.055 * H, 10),
      { pos: [an.x, an.y + 0.020 * H, an.z + 0.004 * H] }), { bone: 'Foot' + s, color: SHOE });
    // white sole, running the length of the foot
    bag.add('cloth', tGeo(roundBox(0.050 * H, 0.018 * H, 0.126 * H, 0.008 * H),
      { pos: [an.x, an.y - 0.014 * H, an.z + 0.020 * H] }), { bone: 'Foot' + s, color: SHOE_W });
    // THE WHITE TOE CAP — a rounded shell over the front third
    bag.add('cloth', tGeo(new THREE.SphereGeometry(0.030 * H, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.62),
      { scale: [0.86, 0.80, 1.25], pos: [an.x, an.y + 0.004 * H, an.z + 0.062 * H] }),
      { bone: 'Foot' + s, color: SHOE_W });
    // laces: three dark bars up the tongue
    for (let i = 0; i < 3; i++) {
      bag.add('flat', tGeo(roundBox(0.034 * H, 0.006 * H, 0.006 * H, 0.002),
        { pos: [an.x, an.y + 0.014 * H + i * 0.016 * H, an.z + 0.030 * H - i * 0.006 * H] }),
        { bone: 'Foot' + s, color: 0x0e0f14 });
    }
  }

  // ---- FACE ---------------------------------------------------------------
  // TIRED AND FLAT. Wide, short, half-lidded eyes; low brows with almost no
  // tilt; a small straight mouth. Nothing about this face is trying.
  // *** PASS 4. *** Pass 3 tried to fix "the eyes read as blank white bars" by
  // narrowing them and stacking a second, bigger iris behind the helper's —
  // and overshot completely: the lash line, the heavy lid, the shadow and two
  // stacked irises added up to a dark slot with nothing legible in it. He
  // looked asleep, which was ALSO what the low beanie was doing, so the two
  // faults compounded.
  //
  // The second iris is gone. What was actually wrong was the eye's ASPECT: a
  // 0.56-wide, 0.21-tall eye is a letterbox, and `addFace` sizes the iris off
  // the HEIGHT, so a wide short eye always leaves white on both sides. 0.50 x
  // 0.26 is a rounder eye at the same area, and the iris now fills it.
  addFace(ctx, {
    eyeW: 0.50, eyeH: 0.26, eyeColor: EYE, eyeTilt: 2, lashTilt: 4,
    browTilt: 3, browUp: 1.06, browColor: 0x2a2118,
    mouthW: 0.22, mouthTilt: 0, mouthColor: 0x8a5450
  });
  // the heavy upper lids
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.50, headR * 0.065, 0.004, 0.002),
      { rot: [0, 0, s * 2], pos: [s * headR * 0.40, headC.y - headR * 0.10 + headR * 0.26 * 0.68, headC.z + headR * 0.645] }),
      { bone: 'Head', color: SKIN });
  }
  // the faint under-eye shadow that finishes the look
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.34, headR * 0.032, 0.004, 0.002),
      { pos: [s * headR * 0.40, headC.y - headR * 0.285, headC.z + headR * 0.628] }),
      { bone: 'Head', color: 0xd8b094 });
  }

  // ---- HAIR — DISHEVELLED, DARK BROWN, AND MOSTLY UNDER THE BEANIE --------
  // *** PASS 3 REBUILD. *** Pass 2's back-of-head render is the reason this
  // section was thrown away and rewritten. The nape was five `roundBox` panels
  // in HAIR / HAIR_HI, and under `MAT.hair` — which carries gloss 0.35 and a
  // strong rim — they came back as A ROW OF FIVE BRIGHT BROWN BRICKS sitting
  // on the back of his neck. Not hair; masonry. It was invisible from the
  // front and it was the loudest thing on the model from behind, which is
  // exactly the failure a four-angle bench exists to catch.
  //
  // Two rules came out of it and both are applied throughout:
  //   1. HAIR IS A TAPERED MASS, NEVER A BOX. Anything in the `hair` slot that
  //      keeps a flat bottom edge reads as a brick, because the rim lights
  //      that edge. Everything below narrows toward its tip.
  //   2. IT MUST BE DARKER THAN IT LOOKS IN THE PALETTE. The hair material's
  //      gloss lifts these values a long way; the highlight is now only used
  //      on the two small front strands, where a specular is correct.
  //
  // A soft tapered tuft — the one primitive the whole hairstyle is made of.
  // Hangs down -Y from its own root, narrowing and thinning to the tip.
  const tuft = (w0, len, thick, curl = 0.30) => {
    const g = roundBox(w0, len, thick, thick * 0.34, 1);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const yy = p.getY(i);
      const f = (len * 0.5 - yy) / len;
      const k = Math.sqrt(Math.max(0, 1 - f * f * 0.92));   // a quarter-circle taper
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k + len * curl * f * f);        // and it curls outward
    }
    g.computeVertexNormals();
    g.translate(0, -len * 0.5, 0);
    return g;
  };

  // ---- THE SKULL CAP, AND *** THIS WAS THE BUG *** ----------------------
  // Passes 3, 4 and 5 all shipped with hair across his eyes, and three
  // consecutive rounds of tuning the FRINGE failed to move it, because the
  // fringe was never the problem. Colour-isolating the `hair` slot to pure red
  // and re-shooting settled it in one image: the culprit was THE SKULL CAP.
  //
  // It swept to thetaLength 0.58π — 0.26 R below the head centre — while the
  // beanie above it stops at the brow line at +0.15 R. So a band of scalp hair
  // hung out from under the hat and sat exactly across his eyes, and because
  // it is one smooth shell rather than a strand it did not read as hair at
  // all; it read as a blindfold.
  //
  // It is now 0.38π and lifted, which puts its entire lower edge ABOVE the
  // beanie's hem — so the cap exists only where the hat already covers it, and
  // every visible strand on the model is a deliberate tuft rather than a
  // leaked shell edge.
  //
  // The general lesson, and it cost three passes: when a fault survives edits
  // to the thing you believe causes it, stop editing and isolate the slot.
  bag.add('hair', tGeo(sphereShell(headR * 1.01, { thetaLength: Math.PI * 0.38, scale: [1.0, 0.92, 1.02] }),
    { rot: [-8, 0, 0], pos: [headC.x, headC.y + headR * 0.20, headC.z - headR * 0.04] }), { bone: 'Head', color: HAIR });
  // THE BACK OF THE SKULL still needs covering, and raising the cap above the
  // hat's hem left it bare — the 179° shot came back showing scalp. So a
  // SECOND shell covers only the REAR HALF, using `phiStart`/`phiLength` to cut
  // the front away entirely: it sweeps down to 0.62π where the full cap could
  // not, because behind the head there is no eye for it to land on.
  //
  // This is the correct shape of the fix rather than a patch: a beanie covers
  // the front hairline and does not cover the nape, and now so does the model.
  // RADIUS 1.06, NOT 1.005. At half a percent over the skull the two surfaces
  // interpenetrate and the scalp shows through in patches — which is exactly
  // what the 148°/179° shot came back with after the phi fix. Hair sits ON the
  // head; it needs real clearance, and every other hair shell on this model
  // already has it.
  bag.add('hair', tGeo(sphereShell(headR * 1.06, {
    // *** THE PHI ORIGIN IS NOT THE FRONT. *** In three.js's SphereGeometry,
    // phi = 0.5π faces +Z (the character's front) and phi = 1.5π faces −Z (the
    // back). The first attempt at this used phiStart 0.62π, which centres on
    // 1.0π — the character's LEFT — so the "rear" shell wrapped round the side
    // of his face and put hair back over his eye while leaving the nape as bare
    // as it started. Centred on 1.5π it covers what it is named for.
    phiStart: Math.PI * 1.02, phiLength: Math.PI * 0.96,
    thetaLength: Math.PI * 0.64, scale: [1.0, 0.96, 1.06]
  }), { rot: [-6, 0, 0], pos: [headC.x, headC.y + headR * 0.06, headC.z - headR * 0.04] }),
    { bone: 'Head', color: HAIR });

  // THE NAPE MASS — one continuous wedge with a ragged lower edge, replacing
  // the five bricks. This is the back-angle read and it is the only substantial
  // hair on him.
  for (let i = 0; i < 7; i++) {
    const f = (i - 3) / 3;
    const a = f * 1.15;
    // PASS 5: narrower (0.34 R -> 0.24) and longer, and ALL ONE VALUE. The
    // every-third-one highlight put the stripes straight back — the same fault
    // Reggie's back sheet had, for the same reason, and it is worth stating
    // twice: in this renderer, alternating adjacent panels between two values
    // does not read as shading, it reads as the panels' edges.
    const len = headR * (0.86 - Math.abs(f) * 0.22) * (i % 2 ? 0.84 : 1);
    bag.add('hair', tGeo(tuft(headR * 0.24, len, headR * 0.22, 0.34), {
      rot: [-24, f * -26, f * 14],
      pos: [Math.sin(a) * headR * 0.82, headC.y - headR * 0.26, headC.z - Math.cos(a) * headR * 0.80]
    }), { bone: 'Head', color: HAIR });
  }

  // TEMPLE TUFTS — irregular, going three ways, which is the whole
  // "dishevelled". They sit in front of and above the ear where the beanie's
  // hem stops, so they are the piece that reads at three-quarters.
  for (const [side, dz, len, out] of [
    [1, 0.26, 0.56, 0.30], [1, -0.06, 0.42, 0.16], [1, -0.34, 0.34, 0.10],
    [-1, 0.22, 0.50, 0.26], [-1, -0.10, 0.38, 0.14], [-1, -0.38, 0.30, 0.08]
  ]) {
    bag.add('hair', tGeo(tuft(headR * 0.22, headR * len, headR * 0.20, 0.26), {
      rot: [-8, side * 20, side * (34 + out * 40)],
      pos: [side * headR * 0.88, headC.y - headR * 0.16, headC.z + headR * dz]
    }), { bone: 'Head', color: HAIR });
  }

  // FRONT STRANDS on the forehead, escaping under the beanie's hem. Three
  // clumps, and the only place the highlight value is used — a specular on the
  // strands nearest the light is correct and is what stops the whole head
  // reading as one flat brown.
  // *** PASS 5: THEY HAVE TO CLEAR THE EYES, AND THAT IS ARITHMETIC TOO. ***
  // Pass 4 raised the beanie off his brows and then hung 0.28-0.36 R of fringe
  // from the new hem — which put hair back over his eyes at −0.12 to −0.20 R
  // and undid the fix in the same pass that made it. The eyes sit at −0.10 R,
  // the hem is now at +0.16 R, so a strand can be at most 0.24 R long before it
  // is in his eye. These are 0.13-0.19, which leaves daylight.
  for (const [dx, len, rotZ, hi] of [[-0.34, 0.19, -30, false], [0.00, 0.13, 4, true], [0.36, 0.17, 27, false]]) {
    bag.add('hair', tGeo(tuft(headR * 0.24, headR * len, headR * 0.18, -0.20), {
      rot: [16, 0, rotZ], pos: [headR * dx, headC.y + headR * 0.17, headC.z + headR * 0.62]
    }), { bone: 'Head', color: hi ? HAIR_HI : HAIR });
  }

  const model = finalizeModel(ctx, { outlineThickness: 0.011, outlineHairScale: 1.15 });

  // =========================================================================
  // THE SKI MASK — ONE GARMENT, TWO STATES
  // =========================================================================
  // *** THE MASK IS REAL GEOMETRY AND IT VISIBLY GOES ON AND OFF. *** The
  // brief demands this and it is right: the swap is the character's signature
  // moment, and a material change would make it a lighting effect rather than
  // an action.
  //
  // It is built ONCE, at construction, as TWO GROUPS parented to the head
  // bone, and `setMask(t)` cross-fades and moves between them:
  //
  //   BEANIE  (t = 0)  a slouched knit cap with a thick rolled hem above the
  //                    brows, and a slouch at the back.
  //   BALACLAVA (t = 1) the same knit pulled down over the whole face to the
  //                    chin, with an eye slot. The rolled hem UNROLLS into the
  //                    neck collar, which is what actually happens.
  //
  // The in-between is not a dissolve: the beanie's body SCALES DOWN the skull
  // while the balaclava SCALES UP from the crown, so at t = 0.5 the knit is
  // genuinely halfway over his face — which is the frame the swap animation
  // holds on.
  const headBone = model.getBone('Head');
  const hj = joints.get('Head');
  const off = v3(headC.x - hj.x, headC.y - hj.y, headC.z - hj.z);

  const knitMat = c => toonMaterial({
    vertexColors: false, color: c, steps: [58, 132, 255],
    rim: 0.24, rimStart: 0.72, rimColor: 0x9fb0c4
  });
  const knitPart = (geo, c, t = 0.010) => {
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geo, knitMat(c));
    g.add(mesh);
    g.add(makeOutline(mesh, { color: 0x06070c, thickness: t }));
    return g;
  };

  // ---- BEANIE -------------------------------------------------------------
  const beanie = new THREE.Group();
  // the crown, slouched BACKWARD — a beanie that fits like a swim cap reads as
  // a bald head painted black
  // *** PASS 3: THE CROWN IS LOWER. *** At 1.10 vertical scale and +0.16 R of
  // lift it stood a third of a head above his skull and read as a wizard's
  // cap. A slouched beanie sits ON the head with the spare knit hanging BACK,
  // not UP — so the crown is now barely taller than the skull and every bit of
  // the excess has moved into the slouch behind it.
  // *** PASS 4: THE HEM HAS TO CLEAR THE BROWS, AND THAT IS ARITHMETIC. ***
  // Pass 3's crown swept down to thetaLength 0.58π, i.e. 0.26 R BELOW the head
  // centre — and the eyes sit at −0.10 R and the brow line at +0.15 R, so the
  // hat was over his eyes. He looked like he was asleep.
  //
  // Solved rather than nudged: for the crown's lower edge to land on the brow
  // line at +0.15 R, with the shell lifted +0.14 R and scaled 0.98, the sweep
  // has to stop at acos(0.01 / 1.058) ≈ 89°, so 0.46π with the lift doing the
  // rest. Every number below is that calculation.
  beanie.add(knitPart(tGeo(sphereShell(headR * 1.08, { thetaLength: Math.PI * 0.46, scale: [1.02, 1.02, 1.04] }),
    { rot: [-10, 0, 0], pos: [0, headR * 0.14, -headR * 0.06] }), KNIT));
  // the slouch: a second smaller dome sitting off the back of the crown
  // THE SLOUCH. A beanie that fits the skull like a swim cap reads as a bald
  // head painted black — this is the lump of spare knit hanging off the back,
  // and pass 2 makes it half again as big because at pass 1's size it was
  // invisible from the front and read as a bump from behind.
  beanie.add(knitPart(tGeo(new THREE.SphereGeometry(headR * 0.66, 12, 9),
    { scale: [0.94, 0.76, 1.16], pos: [0, headR * 0.78, -headR * 0.58] }), KNIT));
  beanie.add(knitPart(tGeo(new THREE.SphereGeometry(headR * 0.40, 10, 8),
    { scale: [0.90, 0.68, 1.08], pos: [0, headR * 0.92, -headR * 0.84] }), KNIT_RIB));
  // THE ROLLED HEM. Thick, one value lighter, sitting just above the brows —
  // this is the single most recognisable line on his head.
  // THE ROLLED HEM — thicker than pass 1 (0.22 R against 0.17) and a full
  // value lighter than the crown, because it is the single most recognisable
  // line on his head and pass 1 lost it entirely into the crown's value.
  beanie.add(knitPart(tGeo(new THREE.TorusGeometry(headR * 1.00, headR * 0.17, 8, 20),
    { rot: [92, 0, 0], scale: [1.0, 1.0, 0.96], pos: [0, headR * 0.33, -headR * 0.02] }), KNIT_RIB));
  // and the fold line ON the roll, which is what makes it read as rolled knit
  // rather than as a band sewn on
  beanie.add(knitPart(tGeo(new THREE.TorusGeometry(headR * 1.025, headR * 0.045, 6, 20),
    { rot: [92, 0, 0], scale: [1.0, 1.0, 0.96], pos: [0, headR * 0.34, -headR * 0.02] }), KNIT, 0.006));
  beanie.position.copy(off);
  headBone.add(beanie);

  // ---- BALACLAVA ----------------------------------------------------------
  const mask = new THREE.Group();
  // the full head shell, down past the jaw. It follows the skull rather than
  // ballooning: 1.05 R with a 1.10 vertical scale and a taper at the chin, so
  // the silhouette is a head in a knit hood and not an egg.
  // *** 1.13 R, AND THE NUMBER IS LOAD-BEARING. *** The rear hair shell sits
  // at 1.06 R (it has to — see its own note), so a hood at 1.05 R is INSIDE the
  // hair, and the mask-down bench came back with a brown scalp showing through
  // the back of the balaclava. Anything that covers the head has to be outside
  // everything already on it.
  mask.add(knitPart(tGeo(sphereShell(headR * 1.13, { thetaLength: Math.PI * 0.92, scale: [1.01, 1.09, 1.03] }),
    { rot: [-4, 0, 0], pos: [0, headR * 0.02, -headR * 0.02] }), KNIT));
  // the jaw wrap — narrower than the skull, which is what gives it a chin
  mask.add(knitPart(tGeo(new THREE.SphereGeometry(headR * 0.88, 14, 10),
    { scale: [0.94, 0.88, 1.00], pos: [0, -headR * 0.58, headR * 0.08] }), KNIT));
  // the chin/neck cuff — this is the rolled hem, unrolled
  mask.add(knitPart(tGeo(new THREE.TorusGeometry(headR * 0.70, headR * 0.15, 8, 16),
    { rot: [86, 0, 0], pos: [0, -headR * 1.00, -headR * 0.04] }), KNIT_RIB));
  // KNIT RIBS. Six shallow bands running over the crown, so the hood reads as
  // knitted fabric rather than as a rubber mask. Cheap, and it is the whole
  // difference between "balaclava" and "diving helmet".
  for (let i = 0; i < 6; i++) {
    const a = (i - 2.5) * 0.30;
    mask.add(knitPart(tGeo(new THREE.TorusGeometry(headR * 1.10, headR * 0.032, 5, 20, Math.PI * 1.1),
      { rot: [90, a * 57, 0], pos: [0, headR * 0.04, -headR * 0.02] }), KNIT_RIB, 0.005));
  }

  // ---- THE EYE SLOT, AND IT HAS TO BE PROUD OF THE SHELL ------------------
  // *** THE FIRST VERSION WAS INVISIBLE. *** The slot was authored at
  // z = 0.74 R inside a shell of radius 1.05 R, which put it a third of a head
  // INSIDE the knit — so the mask-down bench came back as a featureless black
  // egg with no face at all, which is the one thing this state must never be.
  //
  // Everything below sits at 0.98-1.06 R, i.e. genuinely on and slightly out
  // from the surface. It is built as a recessed dark plate with the sclera and
  // irises stacked proud of it, rather than as a hole cut in the shell: a real
  // hole in a sphere shell is expensive to build and reads worse at fighting
  // distance than a stated slot does, and this is the frame that has to
  // communicate "the technique is ON" from across the arena.
  {
    const dark = toonMaterial({ vertexColors: false, color: 0x05060a, steps: [30, 90, 200], rim: 0.1 });
    const plate = new THREE.Mesh(
      tGeo(roundBox(headR * 1.46, headR * 0.40, headR * 0.16, headR * 0.06),
        { rot: [4, 0, 0], pos: [0, headR * 0.02, headR * 1.05] }), dark);
    plate.renderOrder = 2;
    mask.add(plate);
    // the knit lip above and below the slot, which is what makes it a SLOT
    for (const dy of [0.30, -0.28]) {
      mask.add(knitPart(tGeo(roundBox(headR * 1.50, headR * 0.13, headR * 0.13, headR * 0.05),
        { rot: [4, 0, 0], pos: [0, headR * (0.02 + dy), headR * 1.04] }), KNIT_RIB, 0.006));
    }
    for (const side of [1, -1]) {
      const white = toonMaterial({ vertexColors: false, color: 0xf2f4f8, steps: [200, 240, 255], rim: 0 });
      const sc = new THREE.Mesh(
        tGeo(roundBox(headR * 0.46, headR * 0.20, 0.004, 0.004),
          { pos: [side * headR * 0.36, headR * 0.03, headR * 1.125] }), white);
      sc.renderOrder = 3;
      mask.add(sc);
      const iris = new THREE.Mesh(
        tGeo(new THREE.CircleGeometry(headR * 0.135, 12),
          { scale: [0.86, 1.08, 1], pos: [side * headR * 0.34, headR * 0.03, headR * 1.132] }),
        toonMaterial({ vertexColors: false, color: EYE, steps: [200, 240, 255], rim: 0 }));
      iris.renderOrder = 4;
      mask.add(iris);
      const glint = new THREE.Mesh(
        tGeo(new THREE.CircleGeometry(headR * 0.028, 8),
          { pos: [side * headR * 0.30, headR * 0.075, headR * 1.136] }),
        new THREE.MeshBasicMaterial({ color: 0xffffff }));
      glint.renderOrder = 5;
      mask.add(glint);
    }
  }
  // the knit seam running over the crown, so the balaclava is not a smooth egg
  // At 1.9 R long on a 1.13 R shell it speared out of the top of his head fore
  // and aft like an antenna — clearly visible in the mask bench and invisible
  // in the code. Shorter than the shell it lies on, and tucked into it.
  mask.add(knitPart(tGeo(roundBox(headR * 0.11, headR * 0.07, headR * 1.24, headR * 0.025),
    { rot: [6, 0, 0], pos: [0, headR * 1.06, -headR * 0.12] }), KNIT_RIB, 0.006));
  mask.position.copy(off);
  mask.visible = false;
  headBone.add(mask);

  // The face's own meshes have to disappear under the knit. They are part of
  // the merged body meshes and cannot be hidden individually, so the mask
  // shell simply sits proud of them — `headR * 1.07` against the head's
  // `headR`, which is a 7% gap and enough at every angle. Verified in the
  // viewer from front, 3/4, side and back before this comment was written.

  let maskT = 0;
  model.setMask = t => {
    maskT = Math.max(0, Math.min(1, t));
    // BEANIE shrinks up off the skull as MASK grows down over it. The two
    // curves are offset so there is a frame where both are partly there,
    // which is what makes the middle of the swap read as "pulling it down".
    const bUp = 1 - Math.max(0, (maskT - 0.15) / 0.85);
    const mDown = Math.max(0, (maskT - 0.10) / 0.90);
    beanie.visible = bUp > 0.02;
    beanie.scale.set(1, Math.max(0.02, bUp), 1);
    beanie.position.y = off.y + (1 - bUp) * headR * 0.55;
    mask.visible = mDown > 0.02;
    mask.scale.set(1, Math.max(0.02, mDown), 1);
    mask.position.y = off.y + (1 - mDown) * headR * 0.72;
  };
  model.maskAmount = () => maskT;
  model.setMask(0);

  // =========================================================================
  // THE BEAST GLOW
  // =========================================================================
  // While a beast is channelled, the mask's eye slot and the knit's seam take
  // that beast's colour. It is the ONE piece of information the opponent needs
  // from across the arena that the posture alone cannot carry — WHICH beast —
  // and it costs two material writes.
  const glowMats = [];
  mask.traverse(o => { if (o.material && o.material.color) glowMats.push(o.material); });
  model.setBeastTint = (color) => {
    // only the eye quads take it, and only when a beast is actually up
    for (const mm of glowMats) {
      if (mm.color.getHex() === 0xf2f4f8 || mm.emissive) {
        mm.emissive?.setHex?.(color ?? 0x000000);
        if (mm.emissiveIntensity != null) mm.emissiveIntensity = color ? 0.8 : 0;
      }
    }
  };
  return model;
}
