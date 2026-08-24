# Rigged 3D models (opt-in, `?render3d`)

Drop `.glb`/`.gltf` humanoid models here and list them in `manifest.json` to
replace a character's procedural body at runtime. This is the one sanctioned
door for model files: nothing in this folder is imported into the bundle, the
default game stays fully procedural, and the swap only happens when the page
is loaded with the `?render3d` URL parameter.

- `/?render3d` — use `manifest.json` (per-character entries)
- `/?render3d=<url>` — one model for every fighter, no manifest needed
- `/?render3d#viewer` — same, on the model-viewer bench (the place to check a
  model against the whole clip library)

`manifest.json` maps a character id (`"yuji"`), a variant pick
(`"gojo:shinjuku"`), or `"*"` (every fighter) to a URL string or an entry:

```json
{
  "yuji": "./yuji.glb",
  "gojo": {
    "url": "./gojo.glb",
    "scale": 1.0,
    "yOffset": 0,
    "faceYaw": 0,
    "boneMap": { "Chest": "Spine03", "HandL": null },
    "rotOffset": { "UpArmL": [0, 0, -8] },
    "keepProps": true,
    "hideSprings": true
  }
}
```

Relative URLs resolve against this folder. Any humanoid rig works — Mixamo,
VRM, Rigify exports — bone names are auto-detected and the game's whole pose
and clip library retargets onto it live. See `docs/render3d.md` for how the
mapping works and what each manifest field tunes.
