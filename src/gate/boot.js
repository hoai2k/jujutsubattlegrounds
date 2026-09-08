/**
 * Entry points, ahead of the game.
 *
 * Each page loads its own boot from here instead of its module directly, so the
 * door goes up first and the page behind it is imported only once the visitor
 * is through. The game is behind a dynamic import, which the bundler splits
 * into its own chunk: somebody who never gets in never downloads it.
 *
 * The door is off on localhost, so `npm run dev` and any local tooling never
 * meet it — see the header of `gate.js`.
 */
import { openGate } from './gate.js';

const BLURB = 'This game is for friends of Hoai Nguyen. Use your invite link, or enter your code below.';

/** One door, one label per page, one thing to start afterwards. */
export function boot(title, game, start) {
  return openGate({ title, blurb: BLURB, game }).then(start);
}
