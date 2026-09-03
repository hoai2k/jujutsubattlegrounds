# Jujutsu Battlegrounds — `fable5.1` direction

This is the brief for the redesign that lives in `fable5.1/`. It is written
before the work, and the work is measured against it. Where the code and this
document disagree at the end, the summary in `docs/fable5.1-summary.md` says
which one moved and why.

The old game stays at `/` and is untouched. The new one is at `/fable5.1/`.
Same game, same roster, same ten maps, same controls — a higher quality bar,
and a codebase that can hold it.

## 1. Target look — committed: **painted cel**

Cel/toon, not stylized PBR. The reference is the anime itself: a hard two-band
terminator on cloth, a softer three-band one on skin, a crisp ink line around
every silhouette, and light that is *authored* rather than simulated. The
reasons, in order:

1. **It is what the source looks like.** A PBR Gojo reads as a game about a
   man in a coat; a cel Gojo reads as Gojo.
2. **It holds up at the budget.** A toon ramp plus a shadow map plus an
   inverted-hull outline costs less than a metallic-roughness pipeline with
   the image-based lighting it needs to not look like plastic, and it still
   looks finished on an iGPU.
3. **It survives the post stack.** Impact frames, ink flashes and domain
   grades all push the image toward graphic extremes; a flat-shaded base
   goes there gracefully, a photoreal one falls apart.

"Painted" means the cel is not flat: every material gets a warm/cool split on
the up axis, a fresnel rim from the opposite side of the key, and the ramp's
dark band is tinted toward the light's complement instead of black. Cast
shadows from the key light land *on* characters (a hand across a chest, a
jaw's shadow on a collar) — that is the single biggest tell between the demo
look and the shipped look, and it is why the shadow map is tier 2 and not
tier 4.

## 2. Lighting and post

One light rig per map, three lights, all directional or hemispherical (no
point lights in the base pass — they cost and they do not read in cel):

- **Key**: warm, from high front-left, casts the shadow map. Shadow frustum is
  small (the fight box, ~14 m) and follows the fighters' midpoint, so the
  2048 map is spent where the characters are, not on the skyline.
- **Rim**: cool, from behind-right, no shadow. This is what separates fighters
  from the stage; it is strong (1.5–2.0) on purpose.
- **Sky/ground hemisphere**: the ambient, tinted per map.

Colour management: linear working space, `SRGBColorSpace` output,
**ACES filmic** tone mapping at exposure 1.0 with the toon ramps authored to
land after it (the ramps are brighter than they look in isolation). Half-float
render targets.

Post stack, in order, all in `fable5.1/src/render/post.js`:

| Pass | What it is for | Tier |
| --- | --- | --- |
| Shadow map (PCF soft) | fighters reading as solid | MEDIUM+ |
| Contact shadow decal | the floor under a fighter, every tier — a projected soft disc that follows the feet, never a "blob" alone: it sits *under* the map shadow and fills the gap at the ankle | LOW+ |
| Bloom (threshold 0.85, radius 0.4, strength 0.45) | cursed energy, sparks, domain light | HIGH+ |
| Grade | vignette, per-map/domain tint + lift + saturation, hit flash | MEDIUM+ |
| Impact | chromatic aberration + radial blur + zoom pulse from a screen-space origin, driven by hits and dashes; the **impact frame** — a two-to-four-frame ink treatment (inverted luminance, two-tone, heavy outline) on heavies, launchers, counters and finishers | HIGH+ (frame on MEDIUM+, aberration/blur on HIGH+) |
| FXAA | edges | HIGH+ |
| Output (sRGB) | | all |

Tiers are real:

- **LOW** — direct render to screen, no shadow map, no composer at all.
  Pixel ratio 1. Contact decals only.
- **MEDIUM** — shadow map 1024, grade pass, impact frame. No bloom, no
  aberration. Pixel ratio ≤ 1.25.
- **HIGH** (default) — everything, shadow 2048, pixel ratio ≤ 1.5.
- **ULTRA** — shadow 4096, pixel ratio ≤ 2, particle budget ×1.5.

Split screen renders the full stack per eye into its own target and blits.

## 3. Character construction language

**A character is described, not assembled.** `fable5.1/src/roster/specs/`
holds one object per character:

```js
{
  id: 'gojo', height: 1.92, build: 'lean',        // proportion preset
  head: { face: 'long', eyes: 'sharp', brow: 'flat', skin: 'fair' },
  hair: { style: 'spikes-up', color: 0xf2f6ff, length: 1.1 },
  outfit: [
    { piece: 'jacket', color: 0x171b28, collar: 'high', hem: 'hip' },
    { piece: 'pants', color: 0x121522, cut: 'straight' },
    { piece: 'blindfold', color: 0x0b0c12 }
  ],
  palette: { accent: 0x7fd0ff, energy: 0x8fd4ff },
  stance: 'loose'
}
```

`art/character/build.js` turns that into a rigged, skinned, outlined,
spring-driven model. Garments and hair styles are *generators* in
`art/character/garments.js` and `hair.js`; a new character is a new spec, a new
look is a new garment generator that every character can then wear.

Silhouette rules:

- **Proportion**: 7.5 heads standard; `build` presets scale shoulders, hips,
  muscle, neck and limb radius as a set (lean / athletic / heavy / slight /
  massive). Hands are 1.1× realistic — they read at camera distance.
- **Read at 6 m**: every character must be identifiable at gameplay distance
  by hair mass + top-garment mass + one accent colour. The lineup bench
  (`/fable5.1/?bench=lineup`) shows the whole roster at that distance.
- **Joints deform**: chain-weighted skinning over the shared skeleton with
  blend zones at elbow, knee, shoulder, hip; joint balls under the sleeve so
  a bent limb stays convex.
- **Faces**: a sculpted head (brow ridge, sockets, cheek, nose, jaw) with
  planar eye/brow/mouth decals. Eyes are the one place the cel is broken with
  a flat unlit material — they always read.
- **Cloth and hair**: spring chains (verlet, length-constrained) on every hair
  mass longer than the jaw, every coat tail, tie, sash and sleeve flap.
  Secondary motion lags the body by 2–4 frames and settles over ~0.4 s.

Shaders (`art/shaders/`): one toon shader with archetype presets — skin,
cloth, hair, metal, fur, energy — differing in band count, band floor, rim
width and gloss. Materials are shared per archetype+colour-key so the whole
roster is a few dozen programs, not 160.

## 4. Animation principles

Clips are pose keyframes on the shared skeleton (degrees per bone, eased),
crossfaded on state change. The vocabulary:

- **Anticipation**: 4–8 frames of wind-up in the opposite direction. A jab
  cocks the shoulder; a heavy drops the hips.
- **Contact**: the hit frame is a *held* pose. Light hits hold 2 frames, heavy
  hits 4, launchers 5, plus hit-stop on both bodies (light 3f, heavy 6f,
  launcher 8f, counter 10f). A hit reads in **two frames** because both the
  pose and the world stop.
- **Settle**: recovery eases *out* back to stance over the whole recovery
  window — no snap back to idle.
- **Weight**: hips lead. Every locomotion clip carries pelvis yaw, hip drop,
  chest counter-twist and foot roll.
- **Smear on fast arcs**: heavies and launchers get a one-frame arc mesh
  (`fx/smear.js`) along the striking limb's path.

Per-character identity is carried by the **stance** and by a short set of
signature clips (idle, taunt, victory, the two casts, the heavy); shared
clips (walk, run, hit reactions, block, knockdown, getup) retarget across the
roster.

## 5. UI language

- **Type**: one heavy condensed display face for numbers and names (system
  stack, no font files), one grotesque for body. Names are uppercase, tracked
  wide. Kanji sits behind names as a watermark, never as the label.
- **Layout**: a 12-column safe area with 4% margins. HUD hierarchy top-down:
  health (largest, top corners, always visible) → round timer (top centre) →
  cursed-energy gauge (under health, two-part: MAX_CE as the frame, CURRENT
  as the fill) → stamina (thin, under CE) → cooldown slots (small, under the
  plate). Combo counter is mid-screen on the victim's side and *punches*
  (scale 1.4 → 1.0 in 120 ms, then drifts).
- **Motion**: every screen has an enter and exit; transitions are 220–320 ms
  with a diagonal wipe in the accent colour. `prefers-reduced-motion` turns
  all of it into crossfades ≤ 120 ms and disables screen shake.
- **Sound**: every focus move, confirm and cancel has a synthesized tick.
- **Input**: full gamepad navigation everywhere (d-pad/stick + A/B), keyboard
  mirrors it, mouse works but is never required. Focus is always visible.
- **Under pressure**: health flashes white for 80 ms on damage, then the lost
  chunk drains as a red ghost. Stun states are a word over the head (STUN /
  LAUNCH / GUARD BREAK / KO) in the display face, 300 ms, plus a colour on
  the plate edge.

## 6. Module layout of `fable5.1/src/`

```
app/        main.js (entry), game.js (screen router), loop.js, settings.js
render/     stage.js (renderer, colour, lights, shadow follow), post.js,
            passes/ (grade, impact, contact), quality.js, camera.js
art/        geo.js, rig.js, springs.js, shaders/ (toon, outline, energy),
            textures/ (canvas generators), character/ (spec, build,
            garments, hair, face, props), anim/ (player, base, gestures,
            stances)
roster/     index.js (registry), specs/ (visual description per character),
            configs/ (gameplay data, ported from the old game), effects.js
            (effect key → archetype table)
combat/     fighter.js (state machine), states.js, hits.js (resolution, pure),
            moves.js, effects/ (projectile, burst, beam, zone, grab, buff,
            teleport, summon), meter.js, ai.js, match.js, camera-director.js
stage/      kit.js, index.js, maps/ (ten files)
fx/         particles.js, sparks.js, impact.js, smear.js, domain.js
audio/      synth.js, sfx.js, music.js, announcer.js
ui/         style.css, nav.js, motion.js, screens/ (title, mode, select,
            mapselect, hud, pause, results, lobby, training)
bench/      viewer.js, lineup.js
```

Rules of the codebase: no file over ~900 lines; a module is named for what it
does; gameplay data is data, not code; anything that can break silently
(hit resolution, state transitions, roster integrity, effect table coverage)
has a node test under `fable5.1/test/`.

## 7. What "faithful port" means here

Frame data, damage, costs, cooldowns, speeds and the resource model come from
the old `src/characters/*.js` configs verbatim. Techniques are re-expressed on
a small effect vocabulary (projectile / burst / beam / zone / grab / buff /
teleport / summon). Where an old effect had bespoke behaviour that the
vocabulary cannot express, the port keeps the numbers and the *shape* of the
move and the summary lists the difference. Domains are ported as an
environment swap + sure-hit + backlash on the same timers; the bespoke
domain minigames (execution duel, sword rain, jackpot, the set) are listed as
not yet ported rather than approximated badly.
