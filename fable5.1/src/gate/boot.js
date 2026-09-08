/**
 * The fable5.1 build's entry, ahead of its game.
 *
 * This page is a self-contained second build with its own source tree, so it
 * carries its own copy of the door rather than reaching across into `/src`.
 * The copy is byte-identical and deliberately so — if one is changed, change
 * both, or the two pages start disagreeing about who is allowed in.
 */
import { openGate } from './gate.js';

openGate({
  title: 'Jujutsu Battlegrounds',
  blurb: 'This game is for friends of Hoai Nguyen. Use your invite link, or enter your code below.',
  game: 'jujutsubattlegrounds-fable51',
}).then(() => import('../app/main.js'));
