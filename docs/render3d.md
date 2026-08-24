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
| `joints` | `{}` | `{nodeName: [x,y,z]}` corrected pivot positions — moves where a bone *rotates* without moving the mesh (inverse-binds are rebuilt). The fix for a shoulder that sits too low |
| `toon` | `true` | re-shade with the game's cel material + outline. `false` keeps the file's PBR materials; an object overrides the grade (`saturation`, `brightness`, `contrast`, `steps`, `rim`, `outline`) |
| `rotOffset` | `{}` | `{canonical: [x°,y°,z°]}` world-space trim per bone |
| `keepProps` | `true` | procedural weapons stay in hand (they follow the drive rig's hands, which track the imported hands) |
| `hideSprings` | `true` | procedural hair/coat spring meshes hidden |

`boneMap`/`rotOffset` canonical names are the shared skeleton's:
`Hips Spine Chest Neck Head ClavL UpArmL LoArmL HandL … ThighR ShinR FootR`.

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

**`?edit=models` — integration.** Stand a model into a bind (auto T-pose or
auto game-bind, then per-bone adjustment), check skinning with the per-bone
weight heatmap, and preview any character's real clips beside the procedural
body it replaces.

**`?edit=rig` — the questions only eyes can answer.** Walk the mapping bone
by bone with the guessed joint lit in the view (click the right joint in 3D
to reassign); run the **stress poses** — arms overhead, deep squat, spine
twist — which is where a misplaced pivot stops being subtle; **measure** the
skin weights to see where each joint actually is versus where the bone sits;
and correct pivots and retarget trims with live dials.

Both export one manifest-entry JSON carrying every correction — mapping
picks, pivot fixes, rest-pose calibration, trims, fit numbers, look dials and
free-text notes.

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
because `boneMap`, `joints`, `pose` and `rotOffset` are all keyed to bone
names and bone-local frames, and every automatic pass is re-derived at load
from the skeleton. The tool diffs the two skeletons and says so explicitly.

Anything over ~150k triangles warns at load and in the bench status:
expect frame drops with several fighters on screen, and decimate the source
(`gltfpack -si`, or Blender's Decimate) before shipping it.

`test/render3d.mjs` covers the mapping math headlessly: it drives a synthetic
Mixamo-named T-pose skeleton from a real roster model and asserts limb
directions track the source through real clips.
