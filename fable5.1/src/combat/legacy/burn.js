// BURN — shared stacking fire debuff (Jogo). Damage over time that decays
// outside of fire; at max stacks the victim takes increased damage from all
// sources. Deliberately does NOT feed anyone's MAX_CE: only direct hits grow
// the bar, so Jogo cannot snowball resources from full screen.
export const BURN = {
  maxStacks: 5,
  dpsPerStack: 0.55,   // hp/s per stack
  decayEvery: 1.3,     // seconds per stack lost when not being refreshed
  vulnMult: 1.15,      // incoming damage multiplier while AT max stacks
  refreshHold: 0.6     // seconds after a stack lands before decay can start
};

// add `n` stacks to a fighter (capped); resets the decay clock
export function applyBurn(fighter, n = 1) {
  const b = fighter.burn;
  b.stacks = Math.min(BURN.maxStacks, b.stacks + n);
  b.t = -BURN.refreshHold;
}

// per-tick: DoT + decay. `noDecay` is set while Jogo's domain holds the heat.
export function tickBurn(fighter, dt) {
  const b = fighter.burn;
  if (b.stacks <= 0) return;
  // routed through takeChip so Mahoraga's adaptation can see (and reduce)
  // damage-over-time — otherwise BURN & BLEED would be an unreachable
  // category. Tagged `fire`, which is what makes Hanami's vulnerability apply
  // to the burn as well as to the blow that lit it: for a character made of
  // wood, the DoT is most of what fire actually does to him.
  fighter.takeChip(b.stacks * BURN.dpsPerStack * dt, 'dot', 'fire');
  if (b.noDecay) return;
  b.t += dt;
  if (b.t >= BURN.decayEvery) { b.t = 0; b.stacks--; }
}
