// ===========================================================================
// URAUME 裏梅 — REFERENCE SHEET
// ===========================================================================
// SOURCE OF THE REFERENCE. Two authorities, and where they disagree the image
// wins and the disagreement is recorded:
//   1. THE OFFICIAL ANIME CHARACTER SHEET supplied with the brief — a full
//      body FRONT view, line art with flats, standing neutral. This is the
//      authority for the costume, the palette and the proportions.
//   2. The Jujutsu Kaisen Wiki's Uraume / Ice Formation / Frost Calm / Icefall
//      entries, read as raw wikitext through the fandom MediaWiki API. Worth
//      saying explicitly because every earlier model file in this project
//      records that the fandom host answers 402 to a plain page fetch from
//      this environment: `api.php?action=parse&page=Uraume&prop=wikitext`
//      answers 200, so this character's text reference was ACTUALLY READ
//      rather than remembered, unlike Miwa's, Maki's and Uro's.
//
// ONLY THE FRONT VIEW WAS AVAILABLE. No side, 3/4 or back reference exists for
// this model, so the back of the hair, the wrap of the black robe behind the
// body and the profile of the fringe are EXTRAPOLATED. They are listed again
// in the APPROXIMATED block at the bottom rather than presented as observed.
//
// ---------------------------------------------------------------------------
// ONE CORRECTION TO THE WRITTEN SOURCE, UP FRONT
// ---------------------------------------------------------------------------
// The wiki's appearance paragraph says "a plain monk robe of DARK BLUE, which
// is white on the innermost layer". The supplied anime sheet says something
// more specific and more interesting, and it is what is built here:
//   · the outer robe is BLACK, not dark blue, and it is not plain — it is an
//     enormous kesa-like drape thrown over the RIGHT shoulder and across the
//     body, leaving the LEFT arm's white sleeve fully exposed from the
//     shoulder down. It is by a distance the largest single mass on the model.
//   · under it is a WHITE kosode with very wide sleeves, and
//   · below both is a PURPLE PLEATED HAKAMA, which the written description
//     omits entirely and which is the second most identifiable thing about the
//     costume after the hair.
// Three layers, not two. The sheet wins.
//
// ---------------------------------------------------------------------------
// BUILD AND HEIGHT, RELATIVE TO THE ROSTER
// ---------------------------------------------------------------------------
// No official height is published. The sheet reads as a slim, small-average,
// deliberately androgynous adult — narrow shoulders, no bulk anywhere, and a
// stance with the feet close together and the weight perfectly even. H = 1.68.
//     Nobara 1.62 · Miwa 1.66 · >>> URAUME 1.68 <<< · Inumaki 1.68 ·
//     Uro 1.72 · Yuta 1.73 · Maki 1.74 · Yuji 1.75 · Yuki 1.82 · Ryu 1.86
// `muscle: 0.86` and `bulk: 0.86` — the LOWEST mass numbers on the roster
// alongside Inumaki's. Shoulders 0.096, narrower than Uro's 0.100 and Miwa's
// 0.094 is the only thing under it. They are not physically imposing and they
// must never read as if they are: the whole design thesis is that the calmest
// and least threatening silhouette in the game is the one taking the arena
// away from you.
//
// THE SILHOUETTE NUMBER THAT MATTERS: WIDTH AT THE ELBOW LINE. The black drape
// takes the body from 0.34 m across at the shoulders to 0.72 m at the hip — it
// more than doubles. From across the arena Uraume is a narrow white head on a
// wide black triangle, and nothing else in the roster has that shape.
//
// ---------------------------------------------------------------------------
// HEAD AND FACE
// ---------------------------------------------------------------------------
// Softly rounded, small chin, no angularity anywhere — the sheet deliberately
// resists being read as either male or female and the geometry follows.
//   EYES    LARGE aperture but HALF-LIDDED, which is the whole expression.
//           The lash line is heavy and sits LOW across the eye, so most of the
//           iris is covered; what shows is a flat, unhurried look with no
//           tension in it. Iris a pale dark-pink / mauve (#b9a3c8 over a
//           #7d6288 lower half — the sheet shades the iris top-dark).
//           eyeH 0.40 with `lashTilt` near flat: the height is there and the
//           lid takes it away, which is a different construction from simply
//           drawing a small eye and reads completely differently in motion.
//   BROWS   thin, pale, nearly HORIZONTAL (browTilt -2). Every other face on
//           the roster angles its brows to state an emotion; the flatness here
//           is the statement.
//   MOUTH   very small, dead straight, closed. mouthW 0.15 — the smallest on
//           the roster. No corner lift in either direction.
//   HEAD SCALE 1.00.
// *** THE STILLNESS IS THE CHARACTER, and half of it is not in this file. ***
// The face gets it to neutral; anim/uraume.js has to keep it there — see the
// note in that file about the head never leading a movement.
//
// ---------------------------------------------------------------------------
// THE HAIR, FROM EVERY ANGLE
// ---------------------------------------------------------------------------
// A CHIN-LENGTH BLUNT BOB in white, with a straight blunt fringe. It is a
// simple shape and the simplicity is the point — it is the only major
// silhouette on the roster that is not spiked, swept, crested or tied.
//   FRONT   the fringe is a single straight horizontal edge across the brow,
//           cut just above the eyebrows, with NO parting and no stray locks.
//           The side masses fall straight down past the cheekbone and stop
//           level with the jaw in a second straight horizontal edge. Ears are
//           completely covered.
//   3/4     the mass is a close helmet with almost no depth beyond the skull —
//           it does not project backward at all. (EXTRAPOLATED.)
//   SIDE    dead vertical from the crown to the jaw. No taper, no undercut.
//           (EXTRAPOLATED.)
//   BACK    the same blunt horizontal edge continues all the way round at jaw
//           height, so the back is a plain rounded curtain. (EXTRAPOLATED.)
//   THE MARK  *** the single most missable identifier on this character. ***
//           The wiki describes "an irregular line of dark plum pink running
//           HORIZONTALLY ACROSS THE BACK OF THEIR HEAD". On the front sheet
//           what you see of it is the two ends where that line WRAPS ROUND to
//           the temples: two irregular dark-red patches sitting at eye height
//           on each side, partly behind the fringe. It is built here as one
//           continuous irregular band round the back of the skull with the two
//           ends brought forward to the temples, which is what makes the front
//           view correct AND the (unreferenced) back view correct at the same
//           time. #c0303a, deepening to #8e2029 in the recesses.
// CONSTRUCTION. A close scalp shell with a phi-wedge cut out for the face (the
//   project idiom — see models/miwa.js and models/nobara.js), a separate
//   FRINGE SLAB with a hard bottom edge, and two side curtains. The bob gets
//   THREE two-segment spring chains — one at each side of the jaw and one at
//   the nape — with HIGH stiffness and HIGH damping, so it moves a very small
//   amount and settles immediately. That tuning is deliberate and it is a
//   characterisation: Uro's crest is sprung loose so it tells you she changed
//   direction, and this is sprung TIGHT so it tells you Uraume did not.
// COLOUR #eef0f2 with #c3c9d2 in the recesses and #ffffff on the top catch.
//   Almost no warmth at all — it is a cold white, not an ivory.
//
// ---------------------------------------------------------------------------
// GARMENTS — THREE LAYERS, BOTTOM TO TOP
// ---------------------------------------------------------------------------
//   1. WHITE KOSODE. Wide-sleeved, worn under everything. On the sheet you see
//      it at the throat (a crossed collar, LEFT OVER RIGHT — the living wrap;
//      right over left is how a body is dressed for burial and getting it
//      backwards is the most embarrassing possible error on a Japanese-robed
//      character), down the whole of the left arm as an enormous hanging
//      sleeve, and as a white hem at the ankles below the purple. #f2f3f5,
//      shaded #d5d8e0.
//   2. PURPLE PLEATED HAKAMA. Waist to ankle, a clear vertical pleat pattern —
//      the sheet reads about fourteen pleats across the visible front. Built
//      as a flared lathe with a real radial ridge on it rather than as painted
//      stripes, because the pleat has to survive being lit from the side.
//      #6b4a76, pleat shadow #4e3358.
//   3. THE BLACK DRAPE. The mass. It comes over the RIGHT shoulder, crosses
//      the chest on a diagonal from the right collarbone to the left hip,
//      and hangs to just below the knee in a broad bell. The right arm is
//      inside it and effectively invisible; the left arm is outside it in its
//      white sleeve. #1c1d24 with #2c2e38 on the catch — a true near-black,
//      NOT a dark blue.
//   FOOTWEAR  white/grey TABI (a split-toe sock, so the geometry has a real
//      notch at the big toe) inside white ZŌRI with PURPLE hanao straps.
//      #d8dce2 / #eceff3 / #6b4a76.
//
// SECONDARY MOTION. Four flap-spring chains on the loose fabric: the two
//   front corners of the black drape, its back hem, and the left kosode
//   sleeve. Same tuning philosophy as the hair — present, small, and settling
//   fast. A servant standing still should look like they are standing still.
//
// ---------------------------------------------------------------------------
// PALETTE (hex)
// ---------------------------------------------------------------------------
//   skin    #f7e2d0     hair    #eef0f2   hairDk #c3c9d2   hairLt #ffffff
//   mark    #c0303a     markDk  #8e2029
//   black   #1c1d24     blackLt #2c2e38
//   white   #f2f3f5     whiteDk #d5d8e0
//   purple  #6b4a76     purpleDk #4e3358
//   tabi    #d8dce2     zori    #eceff3
//   eyes    #b9a3c8     eyeDk   #7d6288   brows #a9a3ad  lash #241d2b
//   ice     #dff2fb / #a8dce8 / #4fd8e8   (the three tones of formed ice)
//   rim     #dff2fb     outline #0a0b10   accent #4fd8e8
//
// *** THE ACCENT, AND THE AUDIT BEHIND IT. ***
// The brief requires the ice to be clearly distinct from Gojo's blue and
// Kashimo's electric accent, so it was chosen by MEASUREMENT rather than by
// eye: candidates were scored as CIELAB ΔE against all twenty-eight existing
// roster accents and the maximum-minimum was taken. #4fd8e8 wins at ΔE 21.0
// from its nearest neighbour (Miwa's #a8d8e8), against ΔE 22.9 from Gojo's
// #7fd0ff and ΔE 97.7 from Kashimo's #a46bff. For comparison the obvious
// candidates all failed: a near-white frost (#dff2fb) lands ΔE 4.7 from Uro,
// a cold steel (#9ab8c8) ΔE 5.4 from Mahito, a glacial teal (#7fc9c4) ΔE 9.4
// from Inumaki's mint. It is a SATURATED glacial cyan rather than the pale
// blue the brief describes, and that departure is deliberate: the pale-blue
// slot in this roster is genuinely full.
//
// THE MODEL DOES NOT WEAR THE ACCENT. Uraume on screen is white, near-black
// and purple; #4fd8e8 is the colour of the CALLOUTS and the core of the formed
// ice, and the ice GEOMETRY is built in the two pale tones above it so the
// character still reads calm and cold at distance. That is the Uro precedent
// (accent ≠ hair colour) applied the other way round, and it is written down
// here for the same reason hers is.
//
// ---------------------------------------------------------------------------
// KEY IDENTIFIERS, in priority order
// ---------------------------------------------------------------------------
//   1. the white blunt bob with the straight fringe
//   2. the plum-red mark wrapping the back of the head to both temples
//   3. the enormous black drape over one shoulder — the triangle silhouette
//   4. the purple pleated hakama under it
//   5. the wide white sleeve on the exposed left arm
//   6. the flat half-lidded stare and the completely level brows
// All six are in this file. Item 6 leans on anim/uraume.js — see the note
// there about stillness being authored rather than absent.
//
// ---------------------------------------------------------------------------
// APPROXIMATED, and said plainly
// ---------------------------------------------------------------------------
//   · the back and the side of the hair, and the exact irregularity of the
//     plum mark's line. One front view was available; the wrap is designed to
//     be consistent with the two visible ends rather than observed.
//   · how the black drape closes behind the body, and where its far edge is
//     tucked. Extrapolated as continuing round to the right hip.
//   · the pleat COUNT (fourteen) is read off the visible front of the sheet
//     and continued all the way round.
//   · the hands are the shared mitt; the sheet draws real fingers and this
//     budget does not carry them.
//   · the tabi's toe notch is geometric rather than a real seam.
//   · the sheet's flat-shaded fabric is resolved to two tones per garment.
//
// WHAT I WOULD FIX WITH MORE TIME: the drape is a bell of revolution with
// authored folds rather than simulated cloth, so from directly behind it is
// more symmetrical than the reference implies; and the plum mark is a painted
// band on the scalp shell rather than being cut into the hair mass, so at
// extreme angles its edge is slightly too clean.
// ===========================================================================
import * as THREE from 'three';
import { buildHumanoid, addFace, finalizeModel, makeFlapMesh } from '../builders/humanoid.js';
import {
  latheY, tGeo, roundBox, sphereShell, ribbonShell, mergeGeos, tubeBetween
} from '../builders/geo.js';
import { MAT } from '../shaders/toon.js';
import { v3 } from '../../core/mathutil.js';

const SKIN = 0xf7e2d0;
const HAIR = 0xeef0f2;
const HAIR_DK = 0xc3c9d2;
const HAIR_LT = 0xffffff;
const MARK = 0xc0303a;
const MARK_DK = 0x8e2029;
// PASS 3 — THE VOID. At the reference's true near-black (#1c1d24 over #2c2e38)
// the drape rendered as a single flat silhouette with NO internal form at all:
// the eleven-point separation between the two tones is invisible under a toon
// ramp, and the outline hull round it made the whole mass read as a hole cut
// in the screen. Both tones are lifted and the gap between them roughly
// TRIPLED. It is now lighter than the reference draws it, and that is a
// deliberate, stated departure: a garment that is the largest shape on the
// model has to have a lit face and a shadowed one, and a literal transcription
// of a flat black fill does not survive being turned into geometry.
const BLACK = 0x23252e;
const BLACK_LT = 0x3d4150;
const WHITE = 0xf2f3f5;
const WHITE_DK = 0xd5d8e0;
// PASS 3 — lifted for the same reason as the black above, and less far,
// because the hakama has more of its own value contrast to work with. What it
// mostly needed was to stop losing to the outline in the pleat valleys — see
// the pleat-count and depth notes in `pleatedSkirt` and in the build below.
const PURPLE = 0x7b5589;
const PURPLE_DK = 0x513660;
const TABI = 0xd8dce2;
const ZORI = 0xeceff3;
const EYE = 0xb9a3c8;

// ---------------------------------------------------------------------------
// A PLEATED HAKAMA. A flared lathe with a REAL radial ridge, not painted
// stripes: the profile is swept and then every vertex is pushed in or out by a
// square wave in theta, so each pleat has an actual crease that catches the
// light. Painted stripes on a lathe die the moment the character is lit from
// the side, which is most of a fight.
//
//   yTop/yBot   where the garment starts and stops
//   rTop/rBot   waist and hem radius — the flare
//   pleats      how many creases go round
//   depth       how far a crease sits proud of the mean radius
// ---------------------------------------------------------------------------
function pleatedSkirt({ yTop, yBot, rTop, rBot, pleats = 14, depth = 0.10, seg = 10 }) {
  const radial = pleats * 4;                 // four vertices per pleat cycle
  // ---- *** THE PROFILE RUNS UPWARD. READ THIS BEFORE CHANGING IT. *** -----
  // THREE.LatheGeometry derives its face winding from the ORDER of the profile
  // points, so a profile authored from the waist DOWN to the hem produces a
  // surface whose normals point INWARD. The mesh is then entirely backface-
  // culled from outside, its own material never draws, and the only thing
  // visible where the garment should be is the BackSide inverted-hull OUTLINE
  // — a solid, flat, near-black shape exactly the size of the garment.
  //
  // That is a five-pass bug and it is worth the paragraph. It presents as a
  // SHADING problem: the hakama and the drape both rendered as featureless
  // black masses, and passes 2, 3 and 4 of this model went into lifting the
  // palette, adding fold geometry and cutting the outline thickness, none of
  // which could possibly have worked because none of the affected surfaces was
  // being drawn at all. It was finally caught by colouring the drape pure
  // green and finding that only the shoulder roll and the spring flaps — the
  // two pieces NOT built from a lathe — changed colour.
  //
  // Every other lathe in this project (builders/humanoid.js's torso, and the
  // rest of the roster's) happens to run bottom-up because bodies are authored
  // from the crotch upward. A GARMENT is naturally described from the waist
  // down, which is why this file is the first place it bit.
  //
  //   *** LATHE PROFILES GO LOW-Y FIRST. ***
  const profile = [];
  for (let i = seg; i >= 0; i--) {
    const k = i / seg;
    // the flare accelerates toward the hem — a hakama hangs straight from the
    // waist and only opens near the bottom
    const r = rTop + (rBot - rTop) * Math.pow(k, 1.45);
    profile.push([r, yTop + (yBot - yTop) * k]);
  }
  const geo = latheY(profile, radial, 1.0);
  const pos = geo.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const r = Math.hypot(v.x, v.z);
    if (r < 1e-5) continue;
    const th = Math.atan2(v.z, v.x);
    // square-ish wave: a flat face, a hard crease, a flat face. `Math.sign` on
    // a cosine would give a true square and a shading artifact at every step,
    // so it is softened by a cube — visually a crease, numerically continuous.
    const w = Math.cos(th * pleats);
    const push = Math.sign(w) * Math.pow(Math.abs(w), 0.35);
    // the pleat opens toward the hem: at the waist the fabric is gathered flat.
    //
    // *** PASS 1 — THE SIGN BUG, AND IT IS WORTH LEAVING WRITTEN DOWN. ***
    // This read `Math.max(1e-5, yBot - yTop)` — a divide-by-zero guard copied
    // from a function whose span ran upward. Here `yTop` is the WAIST and
    // `yBot` is the HEM, so `yBot - yTop` is NEGATIVE, the guard clamped it to
    // 1e-5, and `k` came out at up to 71,000 instead of 0..1. The pleat
    // amplitude went with it and the hakama rendered as a 1.3-KILOMETRE
    // starburst that filled the entire frame. `Math.abs`, and the clamp, so
    // the guard does the job it was for whichever way the span runs.
    const k = Math.max(0, Math.min(1, (v.y - yTop) / (yBot - yTop || 1e-5)));
    const amp = depth * (0.25 + 0.75 * k);
    const nr = r * (1 + push * amp);
    pos.setXYZ(i, Math.cos(th) * nr, v.y, Math.sin(th) * nr);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// THE BLACK DRAPE. A bell of revolution that is deliberately NOT axisymmetric:
// after sweeping it, the whole mass is sheared toward the left hip and one
// side is lifted, which is what turns a cone into a garment thrown over one
// shoulder. Built as one geometry so it shades as a single sheet of cloth.
// ---------------------------------------------------------------------------
//
// *** PASS 4 — THE FOLDS, AND WHY THE FIRST THREE PASSES FAILED WITHOUT THEM.
// Passes 1-3 built this as a smooth bell of revolution and it rendered as a
// FLAT BLACK SILHOUETTE from every angle, at three different palettes. The
// palette was never the problem: a smooth surface of revolution under a toon
// ramp has ONE value across its whole front, because every point on it faces
// the light at almost the same angle. Yaga's black suit reads because it is
// made of limbs and lapels; Geto's robe reads because it has a sash, a collar
// and a hem. This had nothing.
// So the bell is modulated in theta by an IRREGULAR fold pattern — seven
// lobes at uneven angles, deepening toward the hem — which gives the ramp
// something to band across. It is the same trick as the hakama's pleats and it
// is doing a completely different job: the pleats are a costume detail, and
// these exist so the garment has a lit face and a shadowed one at all.
function drape({ yTop, yBot, rTop, rBot, shear = 0.10, lift = 0.06, seg = 12, radial = 26, folds = 7, foldDepth = 0.085 }) {
  // LOW-Y FIRST — see the long note in `pleatedSkirt`. `k` still runs 0 at the
  // shoulder to 1 at the hem so the shape maths below is unchanged; only the
  // ORDER the points are handed to the lathe is reversed.
  const profile = [];
  for (let i = seg; i >= 0; i--) {
    const k = i / seg;
    // an S-curve: tight at the shoulder, swelling through the ribs, falling
    // almost straight from the hip
    const r = rTop + (rBot - rTop) * (0.35 * k + 0.65 * Math.pow(k, 2.1));
    profile.push([r, yTop + (yBot - yTop) * k]);
  }
  const geo = latheY(profile, radial, 1.0);
  const pos = geo.getAttribute('position');
  const v = new THREE.Vector3();
  const span = Math.max(1e-5, yTop - yBot);
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const k = (yTop - v.y) / span;              // 0 at the shoulder, 1 at the hem
    // SHEAR: the whole bell leans toward -X (the model's left hip), more the
    // further down it goes. This is the diagonal the sheet draws across the
    // chest, expressed as a deformation rather than as a seam.
    v.x -= shear * k * k;
    // LIFT: the right-hand side (+X) rides UP over the shoulder it is thrown
    // across, so the hemline is not level — which is the single detail that
    // stops it reading as a poncho.
    if (v.x > 0) v.y += lift * (v.x / Math.max(1e-5, rBot)) * (1 - k * 0.35);
    // THE FOLDS. Applied AFTER the shear so they follow the sheared surface
    // rather than a notional cylinder, and irregular in both phase and
    // amplitude — a regular corrugation reads as a lampshade. `k*k` opens them
    // toward the hem, because cloth gathers at the shoulder and hangs loose
    // at the bottom.
    const th = Math.atan2(v.z, v.x);
    const rr = Math.hypot(v.x, v.z);
    if (rr > 1e-4) {
      const w = Math.sin(th * folds + Math.cos(th * 2) * 0.8);
      const amp = foldDepth * k * k;
      const nr = rr * (1 + w * amp);
      v.x = Math.cos(th) * nr;
      v.z = Math.sin(th) * nr;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// A WIDE KOSODE SLEEVE — the hanging bag of a Japanese robe.
//
// *** PASS 3 — IT WAS A BOX ON THE ELBOW. *** Pass 2 built this at 0.086 x
// 0.300 H and hung it off the forearm, which put a white slab the size of a
// briefcase sticking out HORIZONTALLY at each elbow — because the forearm in
// the bind A-pose points down AND OUT, so "hang it along -Y from the joint"
// was not what the geometry actually did. Two fixes, and both matter:
//   1. IT IS AUTHORED AROUND THE UPPER ARM'S LOWER END rather than around the
//      wrist, and it is sized off the arm rather than off the body — a sleeve
//      is a thing an arm is inside, not a prop hung near one.
//   2. IT IS 40% SMALLER. The reference's sleeve is enormous by real-clothing
//      standards and still only reaches the hip; pass 2's reached the knee.
function wideSleeve(H, side) {
  const w = 0.062 * H, d = 0.056 * H, len = 0.185 * H;
  const parts = [];
  // PASS 4 — THE SHOULDER JOIN. Pass 3's bag started a third of the way down
  // the upper arm with nothing above it, so it read as a white box FLOATING
  // beside the shoulder rather than as a sleeve the arm is inside. A tapered
  // cap over the deltoid closes it, and it is the difference between a garment
  // and a prop.
  parts.push(tGeo(new THREE.CylinderGeometry(w * 0.46, w * 0.56, len * 0.52, 10), {
    pos: [0, len * 0.24, 0]
  }));
  // the bag, widening slightly toward the hem — a kosode sleeve is a trapezoid
  parts.push(tGeo(roundBox(w, len, d, 0.014 * H, 2), { pos: [0, -len * 0.42, 0] }));
  parts.push(tGeo(roundBox(w * 1.16, len * 0.34, d * 1.10, 0.012 * H, 2),
    { pos: [0, -len * 0.78, 0.004 * H] }));
  // the hard hem lip — the one detail that keeps it a BAG and not a tube
  parts.push(tGeo(roundBox(w * 1.20, 0.022 * H, d * 1.14, 0.006 * H, 2),
    { pos: [0, -len * 0.94, 0.004 * H] }));
  // a fold down the outboard face, so it has a lit side and a shadowed one
  parts.push(tGeo(roundBox(0.010 * H, len * 0.80, d * 0.26, 0.004 * H, 2),
    { pos: [side * w * 0.42, -len * 0.50, d * 0.34] }));
  return mergeGeos(parts);
}

// A TABI. A split-toe sock, so there is a real notch between the big toe and
// the rest — the one detail that separates it from a plain white bootie.
function tabi(H, ankle, side) {
  const parts = [];
  const len = 0.104 * H, wid = 0.040 * H, hgt = 0.040 * H;
  parts.push(tGeo(roundBox(wid, hgt, len, 0.012 * H, 2), { pos: [0, 0, len * 0.10] }));
  // the ankle cuff
  parts.push(tGeo(new THREE.CylinderGeometry(wid * 0.52, wid * 0.46, 0.052 * H, 10), {
    pos: [0, hgt * 0.62, -len * 0.06]
  }));
  // the split: the big toe as its own lobe, inboard, with a gap to the rest
  const sgn = side === 'L' ? -1 : 1;
  parts.push(tGeo(new THREE.SphereGeometry(wid * 0.30, 8, 6), {
    scale: [0.9, 0.72, 1.5], pos: [sgn * wid * 0.28, -hgt * 0.16, len * 0.50]
  }));
  parts.push(tGeo(new THREE.SphereGeometry(wid * 0.40, 8, 6), {
    scale: [1.0, 0.68, 1.35], pos: [-sgn * wid * 0.14, -hgt * 0.16, len * 0.46]
  }));
  const geo = mergeGeos(parts);
  geo.translate(ankle.x, ankle.y - 0.006 * H, ankle.z);
  geo.computeVertexNormals();
  return geo;
}

export function buildUraume() {
  const spec = {
    id: 'uraume', name: 'Uraume', H: 1.68, headScale: 1.00,
    // THE LOWEST MASS ON THE ROSTER, alongside Inumaki. Slim, narrow and
    // deliberately unimposing — see the reference sheet.
    shoulder: 0.096, hip: 0.048, muscle: 0.86, bulk: 0.86, legBulk: 0.92,
    skinTone: SKIN,
    // The TORSO is the white kosode; the ARMS are its wide sleeves, in the
    // same white, with the huge hanging bags added separately below. Legs are
    // the hakama's white under-layer — the purple is a garment on top of them,
    // not a trouser colour, because the hem of the white shows at the ankle.
    bodySlot: 'cloth', armSlot: 'cloth', foreArmSlot: 'cloth', legSlot: 'cloth',
    clothColor: WHITE, sleeveColor: WHITE, foreSleeveColor: WHITE,
    handColor: SKIN, pantColor: WHITE,
    shoulderCap: false,
    torsoShape: { chest: 0.92, waist: 0.86, hip: 0.94 },
    // soft, round, small-chinned, deliberately unreadable as either sex
    face: { jaw: 0.80, chin: 0.86, width: 1.00 },
    // the zōri are built below on top of a tabi, so the shared shoe block is
    // off — a generic shoe under a split-toe sock is the wrong object twice
    shoe: false,
    palette: {
      rim: 0xdff2fb, hairRim: 0xffffff, outline: 0x0a0b10,
      accent: 0x4fd8e8, energy: 0xdff2fb, metalRim: 0xdff2fb
    }
  };
  const ctx = buildHumanoid(spec);
  const { bag } = ctx;
  const { H, headR, headC, y, joints, torsoChain } = ctx.m;

  addFace(ctx, {
    // LARGE APERTURE, HEAVY LOW LID. The height is there and the lash takes it
    // away — see the reference sheet for why that is a different construction
    // from simply drawing a small eye.
    eyeW: 0.60, eyeH: 0.40, eyeColor: EYE,
    eyeTilt: 3, lashTilt: 2, lashColor: 0x241d2b,
    // NEARLY HORIZONTAL. Every other brow on the roster states an emotion.
    browTilt: -2, browUp: 1.22, browColor: 0xa9a3ad,
    mouthW: 0.15, mouthTilt: 0, mouthColor: 0xa8707a
  });

  const faceZ = headC.z + headR * 0.615;
  const eyeY = headC.y - headR * 0.10;

  // THE HALF LID. A flat slab laid across the top of each eye, in the hair
  // colour's shadow so it reads as an eyelid rather than as a lash. This is
  // what makes the stare flat instead of wide, and it is the single most
  // load-bearing four lines in the file for characterisation.
  for (const s of [1, -1]) {
    bag.add('flat', tGeo(roundBox(headR * 0.30, headR * 0.10, 0.004, 0.002), {
      rot: [0, 0, s * 2],
      pos: [s * headR * 0.34, eyeY + headR * 0.085, faceZ + headR * 0.012]
    }), { bone: 'Head', color: 0x241d2b });
  }

  // =========================================================================
  // THE BOB
  // =========================================================================
  const springs = [];

  // SCALP. A close shell with a phi wedge cut out where the face is — the
  // project idiom (models/miwa.js, models/nobara.js). The wedge is NARROW here
  // (0.86 rad against Uro's 1.25) because the fringe comes down almost to the
  // brows and there is very little bare forehead on the reference at all.
  // PASS 7 — widened from 0.86: the shell's edge came round far enough to eat
  // the outer corner of each eye.
  const FACE_GAP = 1.02;
  bag.add('hair', tGeo(sphereShell(headR * 1.05, {
    phiStart: Math.PI / 2 + FACE_GAP / 2, phiLength: Math.PI * 2 - FACE_GAP,
    thetaLength: Math.PI * 0.78, scale: [1.02, 0.96, 1.04]
  }), { pos: [headC.x, headC.y + headR * 0.02, headC.z - headR * 0.02] }),
    { bone: 'Head', color: HAIR });

  // THE FRINGE. A single slab with a HARD, DEAD-STRAIGHT bottom edge. Built as
  // a box rather than as strands on purpose: the reference draws one
  // uninterrupted horizontal line across the brow with no parting and no
  // tapering locks, and any attempt to break it up into strands makes it a
  // different haircut.
  // PASS 7 — RAISED 0.10 head-radii and SHALLOWED. At 0.62 deep and sitting
  // at +0.30 the slab's bottom edge landed across the eye line and the face
  // was a white helmet with a mouth under it — the same failure models/uro.js
  // records on her pass 2, arrived at from the opposite direction (hers was a
  // cap that came down, this is a fringe that hangs). The reference cuts the
  // fringe JUST ABOVE the eyebrows, which is a hairline and not a visor.
  bag.add('hair', tGeo(roundBox(headR * 1.42, headR * 0.50, headR * 0.40, headR * 0.06, 2), {
    rot: [6, 0, 0],
    pos: [headC.x, headC.y + headR * 0.40, headC.z + headR * 0.60]
  }), { bone: 'Head', color: HAIR });
  // the catch along the top of the fringe, where it leaves the crown
  bag.add('hair', tGeo(roundBox(headR * 1.30, headR * 0.16, headR * 0.30, headR * 0.05, 2), {
    rot: [10, 0, 0],
    pos: [headC.x, headC.y + headR * 0.56, headC.z + headR * 0.52]
  }), { bone: 'Head', color: HAIR_LT });

  // THE SIDE CURTAINS. Straight down past the cheekbone, stopping level with
  // the jaw in a second hard horizontal edge. They cover the ears completely,
  // which is why `ears` is left on in the spec but nothing of them shows.
  for (const s of [1, -1]) {
    bag.add('hair', tGeo(roundBox(headR * 0.40, headR * 1.24, headR * 0.86, headR * 0.08, 2), {
      rot: [0, 0, s * -3],
      pos: [s * headR * 0.82, headC.y - headR * 0.44, headC.z - headR * 0.04]
    }), { bone: 'Head', color: HAIR });
    // the inboard shadow face, so the curtain has depth against the cheek
    bag.add('hair', tGeo(roundBox(headR * 0.12, headR * 1.10, headR * 0.62, headR * 0.04, 2), {
      pos: [s * headR * 0.62, headC.y - headR * 0.46, headC.z + headR * 0.04]
    }), { bone: 'Head', color: HAIR_DK });
  }

  // THE BACK CURTAIN. Same blunt horizontal edge continued round. EXTRAPOLATED
  // — no back reference exists; it is designed to be consistent with the two
  // visible side edges rather than observed.
  bag.add('hair', tGeo(roundBox(headR * 1.52, headR * 1.16, headR * 0.44, headR * 0.09, 2), {
    rot: [-4, 0, 0],
    pos: [headC.x, headC.y - headR * 0.40, headC.z - headR * 0.78]
  }), { bone: 'Head', color: HAIR });

  // =========================================================================
  // THE PLUM MARK — identifier #2, and the one this model would be wrong
  // without. One irregular band round the BACK of the skull whose two ends
  // come forward to the temples, which is what makes the front sheet and the
  // written description agree.
  // =========================================================================
  const MARK_SEGS = [
    // the two temple ends — what the front view actually shows
    // PASS 7 — the temple ends are ENLARGED and pushed forward. This is
    // identifier #2 and at pass 6's size it read as a two-pixel red dot from
    // select-screen distance. On the reference the patch is about an eye's
    // width across and it is the only warm colour anywhere on the character.
    // PASS 8 — PULLED BACK OFF THE FACE. Pass 7 enlarged these and pushed
    // them to z +0.22, which wrapped the band round onto the CHEEKS: the
    // render came back with what looked like red goggles. The mark belongs at
    // the TEMPLE — level with the eye but at the side of the skull, behind the
    // fringe's edge — so z goes to -0.06 and the lateral spread comes back in.
    // It is still comfortably bigger than pass 6's, which is what it needed.
    { x: 0.92, y: -0.04, z: -0.06, w: 0.42, h: 0.36, c: MARK },
    { x: -0.92, y: -0.02, z: -0.06, w: 0.42, h: 0.34, c: MARK },
    // ...running back along each side, dropping and thinning
    { x: 0.88, y: -0.10, z: -0.40, w: 0.38, h: 0.28, c: MARK },
    { x: -0.88, y: -0.08, z: -0.38, w: 0.38, h: 0.30, c: MARK_DK },
    // ...and closing across the back. IRREGULAR: the heights and the
    // z-offsets deliberately do not match side to side, because the source
    // calls it an irregular line and a symmetrical one reads as a hairband.
    { x: 0.36, y: -0.18, z: -0.82, w: 0.46, h: 0.20, c: MARK },
    { x: -0.30, y: -0.13, z: -0.84, w: 0.44, h: 0.26, c: MARK_DK },
    { x: 0.02, y: -0.16, z: -0.88, w: 0.40, h: 0.22, c: MARK }
  ];
  for (const m of MARK_SEGS) {
    bag.add('hair', tGeo(new THREE.SphereGeometry(headR * 0.30, 10, 8), {
      scale: [m.w / 0.30 * 0.9, m.h / 0.30 * 0.5, 0.62],
      pos: [headC.x + headR * m.x * 0.98, headC.y + headR * m.y,
      headC.z + headR * m.z * 0.92]
    }), { bone: 'Head', color: m.c });
  }

  // THE THREE HAIR SPRINGS. Two at the jawline and one at the nape.
  // *** HIGH STIFFNESS, HIGH DAMPING, LOW GRAVITY. *** Uro's crest is sprung
  // loose so it tells you she changed direction; this is sprung tight so it
  // tells you Uraume did not. It is the same system tuned to say the opposite
  // thing, and that is the cheapest characterisation in the project.
  //
  // THE COORDINATE SPACE IS BONE-LOCAL, NOT WORLD. `bag.add` above authors in
  // world space and lets the skin bind sort it out; a SpringChain's
  // `localOffset` is parented straight onto the bone. Handing it a world Y
  // puts the chain a whole body-height into the sky — the bug this project
  // already found on the shipped Miwa model. `headJ` is the Head bone's own
  // world position and every anchor below is an offset FROM it.
  const hairMat = MAT.hair({ rimColor: 0xffffff });
  const headJ = joints.get('Head');
  const SPRUNG = [
    { x: 0.80, z: 0.06, rest: v3(0.14, -1, 0.05) },
    { x: -0.80, z: 0.06, rest: v3(-0.14, -1, 0.05) },
    { x: 0.00, z: -0.86, rest: v3(0, -1, -0.16) }
  ];
  for (const s of SPRUNG) {
    const segs = [];
    for (let i = 0; i < 2; i++) {
      // audited against the same error as the cloth flaps below. These were
      // already in the right range (0.052 H = 0.087 m against a head radius of
      // 0.116 m, so about three-quarters of a head wide) and are trimmed
      // slightly rather than halved — the bob's tips genuinely are that broad.
      const len = (i === 0 ? 0.044 : 0.032) * H;
      const w0 = (i === 0 ? 0.044 : 0.036) * H;
      const w1 = (i === 0 ? 0.038 : 0.024) * H;
      segs.push({
        len,
        mesh: makeFlapMesh(w0, w1, len, 0.014 * H, hairMat, i === 0 ? HAIR : HAIR_DK,
          { color: 0x0a0b10, thickness: 0.012 })
      });
    }
    springs.push({
      bone: 'Head',
      localOffset: v3(headR * s.x * 0.86, headC.y - headJ.y - headR * 0.52, headR * s.z * 0.86),
      restDir: s.rest.clone().normalize(),
      segments: segs,
      stiffness: 150, damping: 0.60, gravity: 3.2
    });
  }

  // =========================================================================
  // THE COLLAR — LEFT OVER RIGHT
  // =========================================================================
  // The living wrap. Right over left is how a body is dressed for burial, and
  // getting it backwards is the most embarrassing available error on a
  // Japanese-robed character, so it is called out here and the two panels are
  // ordered deliberately: the LEFT panel (+X on this model, which faces +Z)
  // sits ON TOP of the right one.
  const collarY = y.chest + 0.070 * H;
  for (const p of [
    { s: -1, top: false, c: WHITE_DK },   // right panel, underneath
    { s: 1, top: true, c: WHITE }         // left panel, on top
  ]) {
    bag.add('cloth', tGeo(roundBox(0.052 * H, 0.150 * H, 0.026 * H, 0.008 * H, 2), {
      rot: [8, p.s * 10, p.s * 30],
      pos: [p.s * 0.026 * H, collarY - 0.052 * H,
      0.046 * H + (p.top ? 0.010 * H : 0)]
    }), { chain: torsoChain, color: p.c, blend: 0.05 });
  }
  // the band round the back of the neck that joins them
  bag.add('cloth', tGeo(new THREE.TorusGeometry(0.050 * H, 0.014 * H, 6, 14, Math.PI * 1.15), {
    rot: [92, 0, 0], pos: [0, collarY - 0.006 * H, -0.006 * H]
  }), { chain: torsoChain, color: WHITE, blend: 0.05 });

  // =========================================================================
  // THE HAKAMA
  // =========================================================================
  // Waist to ankle, fourteen pleats, flaring only near the hem.
  // PASS 3 — TEN PLEATS, NOT FOURTEEN, AND HALF THE DEPTH.
  // The reference reads about fourteen across the visible front and pass 2
  // built fourteen faithfully. At this body's radius that makes each facet
  // roughly 4 cm wide, which is NARROWER THAN THE OUTLINE HULL AROUND IT — the
  // inverted-hull outline filled every valley and the whole hakama rendered as
  // a black fringe with no purple in it at all. Ten facets at half the depth
  // clear the outline and still read unmistakably as pleats.
  //
  // It is also WIDER than pass 2 (0.150 H at the hem against 0.132), because
  // with the drape shortened above there is now a real band of it on show and
  // it should have the weight the reference gives it.
  bag.add('cloth', pleatedSkirt({
    yTop: 0.500 * H, yBot: 0.075 * H,
    rTop: 0.074 * H, rBot: 0.162 * H,
    pleats: 10, depth: 0.055, seg: 12
  }), { bone: 'Hips', color: PURPLE });
  // the deep tone sits INSIDE the hem, so a crease that turns away from the
  // light has something dark behind it rather than the leg
  bag.add('cloth', pleatedSkirt({
    yTop: 0.470 * H, yBot: 0.082 * H,
    rTop: 0.066 * H, rBot: 0.138 * H,
    pleats: 10, depth: 0.028, seg: 8
  }), { bone: 'Hips', color: PURPLE_DK });
  // the WAISTBAND (himo) — a flat band with the knot at the front
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.074 * H, 0.072 * H, 0.048 * H, 20), {
    pos: [0, 0.512 * H, 0]
  }), { bone: 'Hips', color: PURPLE_DK });
  bag.add('cloth', tGeo(roundBox(0.052 * H, 0.034 * H, 0.026 * H, 0.008 * H, 2), {
    pos: [0, 0.508 * H, 0.070 * H]
  }), { bone: 'Hips', color: PURPLE_DK });
  // the WHITE UNDER-HEM showing below the purple at the ankle — a small detail
  // and one of the clearest things on the reference sheet
  bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.126 * H, 0.130 * H, 0.058 * H, 18, 1, true), {
    pos: [0, 0.058 * H, 0]
  }), { bone: 'Hips', color: WHITE });

  // =========================================================================
  // THE BLACK DRAPE — the mass, and the silhouette
  // =========================================================================
  // PASS 3 — SHORTER AND NARROWER. Pass 2's bell reached 0.30 H and flared to
  // 0.215 H, which swallowed the entire hakama and turned the character into a
  // black cone with a head on it. The reference's drape stops just below the
  // KNEE with a clear band of purple under it, and it is a garment hanging off
  // a narrow body rather than a tent. Hem up to 0.38 H, flare down to 0.175 H.
  // PASS 4 — HIGHER STILL. Even at 0.38 H the bell's hem sat below the
  // hakama's widest point and hid the purple completely; in a lineup against
  // Geto (whose robe is the same length and whose trousers and shoes are all
  // clearly visible under it) the difference was obvious. 0.47 H puts the hem
  // just above the knee and leaves a real band of purple under it, which is
  // what the reference draws.
  bag.add('cloth', drape({
    yTop: 0.812 * H, yBot: 0.436 * H,
    rTop: 0.082 * H, rBot: 0.158 * H,
    shear: 0.044 * H, lift: 0.036 * H, seg: 14, radial: 32,
    folds: 7, foldDepth: 0.095
  }), { chain: torsoChain, color: BLACK, blend: 0.07 });
  // the CATCH: a second, slightly smaller bell in the lighter black, offset
  // forward, so the front of the drape has a lit face and the sides fall away
  // dark. Without this the whole mass reads as one flat silhouette and the
  // folds authored below are invisible.
  // ...and the catch is pushed FORWARD as well as inward, so the lit face is
  // genuinely the front of the garment rather than a concentric shell hidden
  // inside the outer one, which is what pass 2 built and why the two tones
  // never met the camera at the same time.
  {
    const g = drape({
      yTop: 0.796 * H, yBot: 0.462 * H,
      rTop: 0.066 * H, rBot: 0.134 * H,
      shear: 0.040 * H, lift: 0.032 * H, seg: 12, radial: 26,
      // the catch's folds are OFFSET in count from the outer bell's, so the
      // two surfaces cross rather than nesting — which is what makes the
      // lighter tone show through in bands instead of only at the edge
      folds: 5, foldDepth: 0.075
    });
    g.translate(0, 0, 0.032 * H);
    bag.add('cloth', g, { chain: torsoChain, color: BLACK_LT, blend: 0.07 });
  }

  // THE SHOULDER ROLL. Where the drape comes over the RIGHT shoulder it
  // bunches into a thick roll — the heaviest single fold on the reference and
  // the thing that says "thrown over" rather than "worn".
  bag.add('cloth', tGeo(new THREE.SphereGeometry(0.062 * H, 12, 9), {
    scale: [1.25, 0.90, 1.05], pos: [-0.078 * H, 0.792 * H, -0.004 * H]
  }), { chain: torsoChain, color: BLACK, blend: 0.05 });
  bag.add('cloth', tGeo(new THREE.SphereGeometry(0.046 * H, 10, 8), {
    scale: [1.10, 0.80, 1.00], pos: [-0.092 * H, 0.752 * H, 0.024 * H]
  }), { chain: torsoChain, color: BLACK_LT, blend: 0.05 });

  // THE DIAGONAL. The edge of the drape crossing the chest from the right
  // collarbone to the left hip. A tapered ribbon in the lighter black laid on
  // top of the bell — this is the single line that makes the garment readable
  // as a kesa rather than as a cloak.
  {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      pts.push(new THREE.Vector3(
        (-0.070 + 0.150 * k) * H,
        (0.790 - 0.260 * k) * H,
        (0.038 + 0.020 * Math.sin(k * Math.PI)) * H
      ));
    }
    bag.add('cloth', ribbonShell(pts, t => (0.020 - 0.006 * t) * H, 0.008 * H, {
      seg: 12, normalHint: new THREE.Vector3(0, 0, 1)
    }), { chain: torsoChain, color: BLACK_LT, blend: 0.05 });
  }

  // =========================================================================
  // THE WHITE SLEEVES
  // =========================================================================
  // Both arms get one. The LEFT is fully exposed and is the one the reference
  // shows; the RIGHT is mostly swallowed by the drape and is built anyway,
  // because it shows during every technique that raises that arm.
  for (const s of ['L', 'R']) {
    const sh = joints.get('UpArm' + s), el = joints.get('LoArm' + s);
    const sgn = s === 'L' ? 1 : -1;
    // *** PASS 7 — ALIGN THE SLEEVE TO THE ARM. ***
    // Passes 3-6 authored the bag hanging straight DOWN in world space, which
    // put two vertical white slabs standing beside the shoulders like
    // shutters — because the bind pose is an A-POSE and the arm does not go
    // straight down, it goes down AND OUT at thirteen degrees. A sleeve is a
    // tube the arm is inside, so it has to be built along the arm's own axis.
    // `buildHumanoid` splays the limb by `sin(13°)` and this rotates by the
    // same thirteen degrees, mirrored per side, so the two cannot drift.
    bag.add('cloth', tGeo(wideSleeve(H, sgn), {
      rot: [0, 0, sgn * 13],
      pos: [sh.x + sgn * 0.004 * H, sh.y - 0.008 * H, sh.z + 0.004 * H]
    }), { bone: 'UpArm' + s, color: WHITE });
    // ...and a narrower cuff on the FOREARM, so the sleeve continues past the
    // elbow the way a kosode does rather than stopping at it. Bound to the
    // forearm bone, so it bends with the elbow instead of shearing across it.
    const wr = joints.get('Hand' + s);
    const fd = wr.clone().sub(el).normalize();
    const fang = Math.atan2(fd.x, -fd.y) * 180 / Math.PI;
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.036 * H, 0.046 * H, 0.118 * H, 10), {
      rot: [0, 0, fang],
      pos: [el.x + fd.x * 0.056 * H, el.y + fd.y * 0.056 * H, el.z + fd.z * 0.056 * H]
    }), { bone: 'LoArm' + s, color: WHITE });
  }

  // =========================================================================
  // FOOTWEAR — TABI IN ZŌRI
  // =========================================================================
  for (const s of ['L', 'R']) {
    const an = joints.get('Foot' + s);
    bag.add('cloth', tabi(H, an, s), { bone: 'Foot' + s, color: TABI });
    // the zōri sole — a flat oval board under the tabi
    bag.add('cloth', tGeo(new THREE.CylinderGeometry(0.044 * H, 0.042 * H, 0.016 * H, 14), {
      scale: [1.0, 1.0, 1.32],
      pos: [an.x, an.y - 0.028 * H, an.z + 0.012 * H]
    }), { bone: 'Foot' + s, color: ZORI });
    // the two hanao straps, in the hakama's purple — the sheet's one flash of
    // colour below the knee
    for (const t of [{ x: 0.020, z: 0.030 }, { x: -0.020, z: 0.030 }]) {
      bag.add('cloth', tGeo(roundBox(0.008 * H, 0.008 * H, 0.052 * H, 0.003 * H, 1), {
        rot: [0, t.x > 0 ? 24 : -24, 0],
        pos: [an.x + t.x * H, an.y - 0.012 * H, an.z + t.z * H]
      }), { bone: 'Foot' + s, color: PURPLE });
    }
  }

  // =========================================================================
  // THE FOUR CLOTH SPRINGS
  // =========================================================================
  // The two front corners of the drape, its back hem, and the left kosode
  // sleeve. Same tuning philosophy as the hair: present, small, settling fast.
  const clothMat = MAT.cloth({ rimColor: 0xdff2fb });
  const hipsJ = joints.get('Hips');
  // *** PASS 5 — THE FLAPS WERE THE BLACK BELL. ***
  // This is the bug that survived four passes because it looked like a
  // shading problem. Pass 2-4 authored these at w 0.086-0.100 H and len
  // 0.130-0.140 H per segment — three chains, two segments each, of black
  // cloth roughly 0.16 m wide and 0.4 m long, hanging from the hips at
  // x = ±0.25-0.29 m. Six slabs that size arranged around a body simply ARE a
  // floor-length black skirt, and every render from pass 2 onward was of that
  // skirt rather than of the hakama — which was underneath it the whole time,
  // correctly purple, and completely invisible except for a two-pixel sliver
  // at one edge. It took colouring the hakama pure red to see it.
  //
  // For scale, the reference this should have been built against: Uro's hair
  // flaps are 0.30 head-radii wide, which on her model is 0.035 m. These are
  // now 0.045 H = 0.076 m — twice hers, because they are cloth rather than
  // hair and they are the hem of a large garment, and half of what they were.
  //
  // THE LESSON, written down because it will happen again: a spring flap is
  // authored in BONE-LOCAL metres and everything around it in this file is
  // authored as a fraction of H. Those two look identical on the page.
  const FLAPS = [
    { bone: 'Hips', x: 0.088, y: -0.100, z: 0.068, col: BLACK, w: [0.045, 0.032], len: [0.080, 0.058], rest: v3(0.16, -1, 0.20) },
    { bone: 'Hips', x: -0.096, y: -0.104, z: 0.062, col: BLACK, w: [0.047, 0.034], len: [0.086, 0.062], rest: v3(-0.18, -1, 0.18) },
    { bone: 'Hips', x: -0.012, y: -0.102, z: -0.094, col: BLACK, w: [0.052, 0.036], len: [0.082, 0.058], rest: v3(0, -1, -0.22) }
  ];
  for (const f of FLAPS) {
    const segs = f.len.map((len, i) => ({
      len: len * H,
      mesh: makeFlapMesh(f.w[i] * H, (f.w[i + 1] ?? f.w[i] * 0.7) * H, len * H, 0.012 * H,
        clothMat, i === 0 ? f.col : BLACK_LT, { color: 0x0a0b10, thickness: 0.011 })
    }));
    springs.push({
      bone: f.bone,
      localOffset: v3(f.x * H, f.y * H, f.z * H),
      restDir: f.rest.clone().normalize(),
      segments: segs,
      stiffness: 120, damping: 0.66, gravity: 7.0
    });
  }
  // the left sleeve's hanging tail, off the forearm
  {
    const el = joints.get('LoArmL');
    // same correction as the hem flaps above — these were 0.082 H wide, which
    // is a sleeve tail as broad as the character's own hips
    const segs = [
      { len: 0.062 * H, mesh: makeFlapMesh(0.048 * H, 0.042 * H, 0.062 * H, 0.010 * H, clothMat, WHITE, { color: 0x0a0b10, thickness: 0.009 }) },
      { len: 0.048 * H, mesh: makeFlapMesh(0.042 * H, 0.030 * H, 0.048 * H, 0.010 * H, clothMat, WHITE_DK, { color: 0x0a0b10, thickness: 0.009 }) }
    ];
    springs.push({
      bone: 'LoArmL',
      localOffset: v3(0, -0.052 * H, 0),
      restDir: v3(0.05, -1, 0.04).normalize(),
      segments: segs,
      stiffness: 128, damping: 0.64, gravity: 8.0
    });
  }

  const model = finalizeModel(ctx, {
    springs, outlineThickness: 0.0090, outlineHairScale: 1.10
  });

  // =========================================================================
  // THE FROST SHELL HOOK
  // =========================================================================
  // FROSTBOUND puts a closed ice shell round a body — any body, including
  // Uraume's own if somebody borrows the technique. The SHELL ITSELF is not
  // built here (it is authored per-victim by fx/newfx.js, because the victim
  // might be Mahoraga or a Panda and it has to be measured against whatever it
  // is closing around). What the model exposes is only how much ice is on it,
  // so the FX system has one number to read and never has to know anatomy.
  //
  // Every character gets the setter as a no-op through optional chaining at
  // the call site; declaring it here means Uraume's own model can also frost
  // over, which matters for the mirror match and for Yuta's Copy.
  model.frost = 0;
  model.setFrostShell = k => { model.frost = Math.max(0, Math.min(1, k)); };

  // Where formed ice grows from and where the mist is blown from. Declared on
  // the model so the effect code never hardcodes a height for a body it cannot
  // measure — the same contract Uro's `warpAnchor` keeps.
  //   palm   Icefall: frost the hand, touch the ground
  //   mouth  Frost Calm: the mist is blown, guided by the hand
  model.iceAnchor = {
    palmY: 0.52 * spec.H, mouthY: 0.86 * spec.H, ahead: 0.42
  };
  return model;
}
