// ===========================================================================
// GARUDA — ANIMATION
// ===========================================================================
// NOT A CLIP SET. Garuda has no humanoid rig, so none of BASE_CLIPS means
// anything to it and there is nothing for the shared AnimPlayer to drive. It
// gets a PROCEDURAL ANIMATOR instead — the same shape the Ten Shadows
// creatures use (`tick(dt, state)` in art/models/shikigami.js), which is the
// established pattern in this project for a non-humanoid body.
//
// ---------------------------------------------------------------------------
// WHY PROCEDURAL AND NOT KEYFRAMED
// ---------------------------------------------------------------------------
// The body is a 14-link chain and the motion that defines it is a TRAVELLING
// WAVE down that chain. Keyframing a wave means authoring fourteen phase-
// offset curves by hand and re-authoring all fourteen every time the length
// changes; expressing it as `sin(t - i * lag)` is three lines, is correct at
// any length, and is what every serpentine animator in the project already
// does. Same argument for the eight wings, which are eight copies of one
// oscillator at different phases.
//
// ---------------------------------------------------------------------------
// THE STATES
// ---------------------------------------------------------------------------
//   hover     the default. It is ALWAYS on the field, so this is what it does
//             for most of every round: a slow vertical bob, a lazy S through
//             the body, wings beating at a quarter rate. Deliberately calm —
//             a partner that thrashes constantly becomes visual noise over a
//             ninety-second round.
//   fly       following Yuki. The body straightens, the wave tightens and
//             speeds up, and the wings beat properly. Blends with `hover` by
//             the `speed` term rather than being a separate pose, so there is
//             no pop when it starts and stops moving.
//   dive      the commanded attack. The whole chain straightens into a LINE —
//             this is the one moment the creature stops being serpentine and
//             becomes a spear — the wings sweep back flat, and the bill opens.
//             The straightening is the tell, and it is readable from anywhere
//             on the map.
//   hurt      knocked away. The chain goes slack and whips, the wings lose
//             their phase relationship and flutter out of sync, and the head
//             pitches up. Desynchronising the wings is what sells "stunned"
//             — a coordinated animal that stops being coordinated.
//   recover   coming back. The wings resynchronise over about a second, which
//             is the visual promise that it is not gone. See the note in
//             combat/garuda.js about why it can never be permanently lost.
//
// ---------------------------------------------------------------------------
// THE WING RULE
// ---------------------------------------------------------------------------
// The wings LEVITATE — they are not hinged, so they must never rotate about a
// point on the body. Each one rotates about ITS OWN centre and translates a
// little, which is what a detached floating object does. The single most
// important line in this file is that the wing joints' POSITIONS are only ever
// offset by small amounts and never zeroed: the gap between wing and body is
// the design, and an animator that closes it has broken the character.
// ===========================================================================

// how far behind its neighbour each link runs — the wave's wavelength
const LAG = 0.42;

export function makeGarudaAnimator(model) {
  const { segments, wings, head, jaw } = model;
  let t = 0;
  // wing phase desync, used by `hurt`: each wing drifts its own way and is
  // hauled back into line by `recover`
  const desync = wings.map(() => 0);

  return function tick(dt, st = {}) {
    const state = st.state || 'hover';
    const speed = Math.max(0, Math.min(1, st.speed ?? 0));      // 0 hovering, 1 flying flat out
    const mass = Math.max(0, Math.min(1, st.mass ?? 0));        // Star Rage poured in
    const k = Math.max(0, Math.min(1, st.actionK ?? 0));        // 0..1 through a dive
    const hurt = state === 'hurt';
    const diving = state === 'dive';

    // The clock runs faster when it is moving and faster again when it is
    // heavy — mass makes it URGENT rather than slow, which is the opposite of
    // what mass does to Yuki and is deliberate: she carries the weight, it
    // carries the momentum.
    t += dt * (1.6 + speed * 3.4 + mass * 1.2 + (diving ? 4.0 : 0));

    // ---- THE BODY -------------------------------------------------------
    // A travelling wave, flattened toward a straight line as it dives.
    const straight = diving ? Math.min(1, k * 2.2) : 0;
    const amp = (1 - straight) * (0.30 - speed * 0.13);
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const ki = i / (segments.length - 1);
      // amplitude grows toward the tail — the head leads, the tail follows
      const a = amp * (0.35 + ki * 0.95);
      const w = Math.sin(t - i * LAG);
      s.node.rotation.y = w * a + (hurt ? Math.sin(t * 3.1 + i) * 0.22 * ki : 0);
      // a smaller vertical component, a quarter-phase behind, which is what
      // makes it read as swimming through air rather than slithering on glass
      s.node.rotation.x = Math.cos(t * 0.85 - i * LAG * 0.7) * a * 0.42
        - straight * 0.02
        + (hurt ? 0.12 * ki : 0);
      // the roll: the body banks INTO its own turn
      s.node.rotation.z = -w * a * 0.5 * (1 - straight);
    }

    // ---- THE HEAD AND BILL ----------------------------------------------
    head.rotation.x = Math.sin(t * 0.7) * 0.06 * (1 - straight)
      - (diving ? 0.34 * k : 0)
      + (hurt ? 0.45 : 0);                    // pitched UP when hit
    head.rotation.y = Math.sin(t * 0.5) * 0.12 * (1 - speed) * (1 - straight);
    head.rotation.z = hurt ? Math.sin(t * 4.2) * 0.16 : 0;
    // the bill opens for the dive and hangs slack when hurt
    jaw.rotation.x = diving
      ? -Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.62
      : hurt ? -0.22 : -0.05 - Math.sin(t * 0.6) * 0.03;

    // ---- THE EIGHT WINGS -------------------------------------------------
    // Each rotates about its OWN centre and translates slightly. The gap
    // between wing and body is never closed — see the header.
    const beat = 1.2 + speed * 5.5 + (diving ? 3.0 : 0);
    for (let i = 0; i < wings.length; i++) {
      const w = wings[i];
      if (hurt) {
        // lose the phase relationship: each wing drifts its own way
        desync[i] += dt * (0.6 + (i % 4) * 0.5);
      } else {
        // ...and get hauled back into line over about a second
        desync[i] *= Math.max(0, 1 - dt * 1.1);
      }
      const phase = t * beat + i * 0.55 + desync[i] * 6.0;
      const flap = Math.sin(phase);
      // wings sweep BACK and FLAT for a dive, and beat for flight
      if (diving) {
        w.node.rotation.z = w.side * (0.10 + flap * 0.06);
        w.node.rotation.y = -w.side * 0.85 * Math.min(1, k * 2);
        w.node.rotation.x = 0.20 * Math.min(1, k * 2);
      } else {
        w.node.rotation.z = w.side * (flap * (0.16 + speed * 0.30) + 0.06);
        w.node.rotation.y = -w.side * (0.10 + speed * 0.22) + Math.sin(phase * 0.5) * 0.05;
        w.node.rotation.x = Math.cos(phase) * 0.10 * (1 + speed);
      }
      // THE LEVITATION. A small independent drift on each wing's position,
      // never reaching zero offset — the gap is the design.
      const drift = Math.sin(phase * 0.7) * 0.035 * (1 - straight * 0.6);
      // the rest height is captured ONCE, on the first tick, and every frame
      // after that is an offset from it. Reading the live position back each
      // frame would integrate the drift and walk the wing away from the body.
      if (w.node.userData.baseY === undefined) w.node.userData.baseY = w.node.position.y;
      w.node.position.y = w.node.userData.baseY + drift + (hurt ? -0.06 : 0);
    }
  };
}
