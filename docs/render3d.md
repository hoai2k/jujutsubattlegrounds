# `?render3d` — rigged 3D models over the procedural roster

An opt-in URL parameter that swaps a character's procedural body for an
imported rigged humanoid (`.glb`/`.gltf`), while every pose and clip the game
has — and every one it grows later — plays on it unchanged. Off by default;
the shipped game stays fully procedural.

## Using it

| URL | Effect |
| --- | --- |
| `/?render3d` | per-character models from `public/models/manifest.json` |
| `/?render3d=<url>` | one model for **every** fighter (quick testing; the URL must be encoded if it carries `&`) |
| `/?render3d#viewer` | the same swap on the model-viewer bench |

The bench (`#viewer`) is the intended iteration loop: load a character, page
through `idle → run → punch3 → knockdown → finishers` and watch the imported
body take the whole library.

Models load at runtime — nothing is bundled, a missing file or an unusable
rig warns once in the console and leaves the procedural model standing.

## How the mapping works (`src/art/rig3d/`)

The game's animation system stays the single source of truth. Clips are
authored once against the shared canonical skeleton (`art/rig/rig.js`
`BONE_NAMES`), and the procedural model keeps running invisibly as a **drive
rig**: combat, spring physics, prop attachment and `AnimPlayer` all keep
reading and writing the same bones they always did. Per frame, after the
model updates, `Retargeter.apply()` transfers the pose onto the imported
skeleton. Three ideas make the transfer natural rather than mechanical:

1. **World-rotation transfer.** The drive rig's bones have identity rest
   rotations, so each bone's quaternion chain *is* its world rotation away
   from bind. That rotation is applied to the mapped target bone in world
   space, recovered into the target's own local space top-down through its
   real hierarchy — so unmapped in-between bones (twist bones, extra spine
   links, fingers) keep their authored rest pose and everything below them
   still lands where the clip put it.
2. **Bind-pose alignment.** Imported models arrive in T-pose, A-pose, or
   anything else; the game's bind is its own relaxed A-pose. Once, at load, a
   shortest-arc rotation per bone takes the target's rest limb direction
   (toward its canonical child) onto the source's. Bones with nothing to aim
   at — hands, feet, head — inherit their parent's alignment and keep their
   natural rest attitude relative to it, which is what keeps wrists and
   ankles looking owned instead of reset.
3. **Twist resolution.** Matching a bone's direction alone leaves its
   rotation *about* that direction undetermined, and the leftover twist makes
   elbows and knees bend out of plane the moment a clip flexes them. Each
   bone therefore names a second reference — a limb uses its own bend plane
   (the elbow for the upper arm, the knee for the thigh), the torso uses the
   shoulder axis — and the alignment becomes a full frame match.
4. **Height-scaled root motion.** The `Hips_pos` positional track (crouch,
   knockdown, jump squash) transfers as a world offset scaled by the ratio of
   the two rigs' hip heights, so a short model crouches proportionally and a
   knockdown still puts the body on the floor.

Bone names are auto-detected (`bonemap.js`): token-based matching that
understands Mixamo (`mixamorig:LeftForeArm`), VRM (`J_Bip_L_LowerArm`),
Rigify/Blender (`forearm.L`) and most hand-named rigs, including collapsing a
2–4-bone spine chain onto the game's `Spine`/`Chest` pair. Anything it cannot
find is skipped, same contract as `AnimPlayer`'s missing-bone rule — and the
manifest can override any guess.

The model itself is normalized on load: height fitted to the character's `H`,
feet grounded on `y = 0`, centred, facing `+Z`.

## Manifest reference (`public/models/manifest.json`)

Keys are a character id (`"yuji"`), a variant pick (`"gojo:shinjuku"`), or
`"*"` as a catch-all; the value is a URL string or an entry object:

| Field | Default | Meaning |
| --- | --- | --- |
| `url` | — | model file, relative to the manifest's folder |
| `scale` | `1` | extra multiplier on the height-normalized fit |
| `yOffset` | `0` | metres up/down after grounding |
| `faceYaw` | `0` | degrees, for models that don't face `+Z` |
| `boneMap` | `{}` | `{canonical: nodeName}` overrides; `null` drops a bone |
| `pose` | `{}` | `{nodeName: [x°,y°,z°]}` rest-pose calibration — absolute local rotations applied before anything is measured, which is how a model that ships in some arbitrary pose is stood into a bind |
| `joints` | `{}` | `{nodeName: [dx,dy,dz]}` pivot corrections — moves where a bone *rotates* without moving the mesh (inverse-binds are rebuilt). The fix for a shoulder that sits too low. Values are an offset in the model's own axes **as a fraction of its height**, so they survive the model being re-exported or decimated |
| `lift` | `{ambient: 0.22, saturation: 1.18}` | a small lighting lift (see below). `false` leaves the file's materials completely untouched |
| `rotOffset` | `{}` | `{canonical: [x°,y°,z°]}` world-space trim per bone |
| `weights` | `[]` | skin repairs (see below) — `{bleed: […]}` as a rule, or `{at, rigid}` / `{at, drop}` per mesh island |
| `keepProps` | `true` | procedural weapons stay visible. Set `false` when the model already has them modelled in — Nobara's hammer is in her mesh, so the procedural one would be a second hammer |
| `hideSprings` | `true` | procedural hair/coat spring meshes hidden |

`boneMap`/`rotOffset` canonical names are the shared skeleton's:
`Hips Spine Chest Neck Head ClavL UpArmL LoArmL HandL … ThighR ShinR FootR`.

## What ships today

Three models are committed and mapped, all of them the same shape of export —
a Rigify `DEF-` rig, 33 bones, 19 of them canonical, ~120k triangles, 3–4 MB:

| Character | File | Rest pose | Entry |
| --- | --- | --- | --- |
| Yuji | `yuji.glb` | as authored (neither T nor A) | plain URL |
| Nobara | `nobara.glb` | A-pose | plain URL |
| Jogo | `jogo.glb` | T-pose | `scale: 1.06` |

None of them needed a `pose` calibration, a `boneMap` override or a pivot
fix: bind alignment absorbs the rest-pose difference (that is what it is for,
and it is why Yuji's un-posed export maps as cleanly as Jogo's T-pose), and
`rerigHierarchy` reparents the eight limbs Rigify exports flat under the
armature root.

Jogo's `scale` is the one deliberate trim, and it is a *proportion* fix
rather than a fit one. His procedural body is built around a volcano head
roughly a third of his height, and the crater emitter that vents his smoke
and embers is parented to the drive rig's `Head` bone at an offset derived
from that geometry. An imported Jogo is humanly proportioned, so his head
stops ~12 cm short of where the plume starts and the flame reads as floating.
Six percent of extra height closes it. Anything else procedural that anchors
off model-specific geometry will want the same kind of trim.

Verify a model before it lands:

    node tools/modelcheck.mjs              # every manifest entry
    node tools/modelcheck.mjs jogo         # one

## Props and effects follow the body

Everything a character hangs off a bone — Toji's spear, the particle emitter
venting fire from Jogo's head — is parented to the *procedural* skeleton.
That skeleton keeps running as the drive rig, so those nodes keep updating;
but it is invisible now, and its bones sit wherever the procedural body's
proportions put them. Left alone, Jogo's fire burns in mid-air beside his
head.

So each one is re-parented onto the imported bone with the transform that
lands it in the same place on the new body. The retargeter drives
`importedWorld = srcWorld ∘ align`, so a node wanting to sit at `srcWorld · v`
from the imported bone gets the local offset `align⁻¹ · v`, and a local scale
that undoes the wrapper's model-units-to-metres factor. Uniform scale
commutes with rotation, so the two cancel exactly. `attachProp` is wrapped as
well, because it re-parents onto the drive rig every time a clip changes
hands.

This is why Jogo needs no `scale` trim to make his plume meet his head.

## Skin repairs (`weights`)

Two defects turn up in nearly every imported character, and neither is really
a rigging mistake — they are what automatic weighting does when two pieces of
geometry are near each other in the bind pose:

- **Bled weights.** Nobara's arms hang beside her hips, so the bind gave her
  skirt a share of the forearm. It looks fine at rest and wrong the moment
  she moves: the dress swings when the arm does.
- **Soft props.** A hammer held in a fist is one mesh with the body, so it
  gets blended across the hand and forearm like flesh, and *bends*.

Neither can be fixed by distance — the skirt really is closer to the forearm
than to anything else while the arm hangs beside it — so the unit of repair
is the **mesh island**, a connected component of the geometry. A skirt is not
connected to a sleeve; a hammer is not connected to a hand.

| Op | Meaning |
| --- | --- |
| `{"bleed": ["hand", "forearm"]}` | remove those bones' influence from every island they do not **dominate**. A sleeve is dominated by the forearm and keeps its weights; a skirt is dominated by the thigh and pelvis, so the 15% the forearm had acquired comes off |
| `{"at": […], "rigid": "DEF-handR"}` | bind one island 100% to a bone — the fix for a held prop that bends |
| `{"at": […], "drop": ["…"]}` | remove named bones from one island |

`bleed` is the one that generalises: no anchors, nothing to re-derive when
the model is exported again, and it is a no-op where there is no bleed (it
cleaned two islands on Yuji, ten on Nobara, none on Jogo). `at` is a point
measured from the mesh's own rest bounding box and divided by that box's
height, so it is scale- and space-invariant — the bench measures a fitted
model in metres, the game applies ops before the fit in the file's own units,
and both land on the same island.

Author them by clicking: **5 · SKIN** on `/workbench/?edit=rig` selects the
island under the cursor, lists what drives it, and offers rigid/drop.

## Where the swap applies

Every place a character's body is built: the match, summons, the select
screen (grid and variant preview), the title screen, and the model viewer.
All of them route through `maybeAttachRender3D`, so a player never picks one
body and gets another.

## What deliberately does not change

- Hitboxes, movement, combat timing — all read the drive rig; the swap is
  presentation only, so netplay and balance are untouched.
- The asset policy: the game's own art remains procedural and nothing in
  `public/models/` is imported into the bundle — model `.glb`s live in that
  folder as committed, runtime-fetched files, opt-in behind the URL param.
- Characters whose body plan exceeds the humanoid contract degrade
  gracefully: Sukuna's second arm pair has no counterpart on a stock
  humanoid, so those clips' extra-arm tracks simply don't transfer.

## The workbenches

Two pages at `/workbench/` do the model-preparation work, both built on the
shipped pipeline rather than a parallel implementation — the same
`guessBoneMap`, `rerigHierarchy`, `Retargeter` and `fitInto` the game runs.
Models load from the manifest, from a URL, or by dropping a file on the page,
so nothing has to be committed to be inspected.

A manifest chip loads the model **as the game loads it**: the entry's own
`scale`, `pose`, `boneMap`, `joints`, `rotOffset` and `lift` are replayed onto
it, and the character the entry is keyed to becomes the reference body. A
bench that showed the raw file instead would disagree with the game about
every model that needed a fix to ship — and would measure the fit against
whatever fighter happened to be selected, since the height fit is normalized
to the reference's `H`.

**`?edit=models` — integration.** Stand a model into a bind (auto T-pose or
auto game-bind, then per-bone adjustment), check skinning with the per-bone
weight heatmap, and preview any character's real clips beside the procedural
body it replaces.

### Lighting: a lift, not a restyle

A `.glb` authored for an offline render arrives lit for a room that has an
environment in it. Dropped into this scene — three lights, no envmap — the
dark half of every surface falls to near-black and a navy uniform reads as a
black one. The colour is in the texture; nothing is reaching it.

So imported models keep their own PBR materials and get two small dials
(`src/art/rig3d/lift.js`), live in both benches and exported with the model:

- **`ambient`** adds back a fraction of the model's **own base texture** as
  emissive. That detail is the whole point: an ambient *light* adds grey and
  washes the hue out, while adding the surface's own colour lifts the shadows
  and makes the blue *more* blue. It is also per material rather than per
  scene, so two fighters don't double each other's lighting the way two
  ambient lights in one scene would.
- **`saturation`** is a gentle push on top, for a texture baked a little grey
  for a fighting game. At `1` no shader is compiled at all.

Deliberately not a style pass. An earlier version re-shaded imports through
the game's cel material with an ink outline, and it was far too much — a
model should look like itself, only lit.

### Landmarks: pointing at the joints

Everything the alignment does is derived from **where the bones sit inside the
mesh**: a bone's rest direction is (this joint → the next joint down), and
that direction is what gets matched onto the game's. So a bone in the wrong
place aims its limb somewhere the clip never asked for — arms that come out
bent, a torso that hunches — and no amount of tuning the clip will fix it.

Skin weights can measure this (`MEASURE`, above) but only up to the shape of
the costume: the hand-over band between two bones is a hoodie as much as it
is a shoulder. A person looking at the model does not have that problem.

So the rig bench asks for the one thing a person is unambiguously better at.
Pick a row from the landmark list — pelvis, waist, chest, neck base, head,
and both shoulders, elbows, wrists, hips, knees and ankles — then **click that
joint on the model**. The click lands *inside* the body (the ray is averaged
through it), and clicking the same joint again from the opposite side
averages the samples, which is worth doing for the shoulders and hips. A pink
dot marks it; a line runs to where the bone currently is, so a long line is
the error.

Two buttons turn marks into fixes:

- **Check mapping** — for each mark, the nearest joint in the model is the
  model's own answer. Where it disagrees with what was mapped, that is a
  *mapping* bug rather than a placement one.
- **Move bones to marks** — every marked joint becomes its bone's pivot.
  Because the alignment is derived from bone positions, correcting the
  positions corrects every clip at once.

The export carries the marks (in model space and normalized by body height),
the per-bone error in centimetres, and any mapping the marks disagree with —
enough to reproduce and improve the fix offline.

**`?edit=rig` — the questions only eyes can answer.** Walk the mapping bone
by bone with the guessed joint lit in the view (click the right joint in 3D
to reassign); run the **stress poses** — arms overhead, deep squat, spine
twist — which is where a misplaced pivot stops being subtle; **measure** the
skin weights to see where each joint actually is versus where the bone sits;
and correct pivots and retarget trims with live dials.

Both export one manifest-entry JSON carrying every correction — mapping
picks, landmarks, pivot fixes, rest-pose calibration, trims, fit numbers,
lighting dials and free-text notes.

### Where a joint actually is

Between two adjacent bones the skin weights hand over across a band, and the
centroid of that band **is** the joint — so the difference against the bone's
position is a measurement rather than an opinion. MEASURE reports it per
bone; the fix moves the pivot and rebuilds the inverse-bind so the rest mesh
is bit-identical and only the rotation centre changes. `Mirror fixes L↔R`
averages the left and right *corrections* (not the absolute pivots, which
would tear apart a model whose bind pose is legitimately asymmetric).

## Budget

A model authored for rendering is routinely far heavier than one authored for
a game. `tools/decimate.mjs` shrinks one safely — see tools/README.md — and
**a decimation that preserves the skeleton preserves every manifest fix**,
because `boneMap`, `pose` and `rotOffset` are keyed to bone names, `joints`
is stored as a fraction of body height in the model's own axes (so it
survives a re-export at a different scale or origin), and every automatic
pass is re-derived at load from the skeleton. The tool diffs the two skeletons and says so explicitly.

Anything over ~150k triangles warns at load and in the bench status:
expect frame drops with several fighters on screen, and decimate the source
(`gltfpack -si`, or Blender's Decimate) before shipping it.

`test/render3d.mjs` covers the mapping math headlessly: it drives a synthetic
Mixamo-named T-pose skeleton from a real roster model and asserts limb
directions track the source through real clips.
