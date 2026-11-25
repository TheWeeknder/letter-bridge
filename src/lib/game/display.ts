// =============================================================================
// display.ts — how a letter pair is SHOWN to the player.
//
// The rule "START letter uppercase, END letter lowercase" is used by the
// letters on screen, the game-over sentences and the stats script. Keeping it
// here means they can never disagree.
// =============================================================================

import type { LetterPair } from "./types";

/** The START letter as shown on screen, e.g. "A". */
export function displayStart(pair: LetterPair): string {
  return pair.start.toUpperCase();
}

/** The END letter as shown on screen, e.g. "e". */
export function displayEnd(pair: LetterPair): string {
  return pair.end.toLowerCase();
}
