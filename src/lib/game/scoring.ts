// =============================================================================
// scoring.ts — how many points a game is worth.
//
// THE RULE: every accepted word scores one point per letter
// (POINTS_PER_LETTER in config.ts). "soaps" = 5, "superheroes" = 11. So two
// players who find the same NUMBER of words rarely tie: whoever found the
// longer words wins.
//
// WHY points are worked out, not stored: every accepted word is already kept
// (usedWords in the game and on each room player, words in each saved high
// score). Adding them up whenever we need the score means there's no second
// number that could drift out of step, nothing new to send over the network,
// and high scores saved before points existed re-score themselves.
//
// Note: the game's `streak` is still the NUMBER of words (it doubles as the
// round number that picks the next letter pair), so it isn't the score.
// =============================================================================

import { POINTS_PER_LETTER } from "./config";

/** Points for one accepted word. */
export function wordPoints(word: string): number {
  return word.length * POINTS_PER_LETTER;
}

/** Points for a whole game: every accepted word added up (0 for none). */
export function scoreFor(words: readonly string[]): number {
  return words.reduce((total, word) => total + wordPoints(word), 0);
}

/** "1 point" / "57 points", for sentences on screen. */
export function pointsLabel(points: number): string {
  return `${points} ${points === 1 ? "point" : "points"}`;
}

/** The longest word in a game (the first one if several tie), or null for none. */
export function longestWord(words: readonly string[]): string | null {
  return words.reduce<string | null>((best, word) => (best === null || word.length > best.length ? word : best), null);
}
