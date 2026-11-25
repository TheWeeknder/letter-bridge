// =============================================================================
// examples.ts — find a couple of words that WOULD have worked, for the
// game-over screen.
//
// WHY use the common-word index: showing "aerophore" as a hint feels unfair.
// Common words like "above" show the player the prompt really was solvable.
// The index keeps words in frequency order (most common first), so taking the
// first few unused ones gives the most familiar examples.
// =============================================================================

import { EXAMPLE_WORD_COUNT } from "./config";
import { pairKey } from "./pairIndex";
import type { LetterPair } from "./types";

/** Return up to `count` common words for `pair` that weren't already used. */
export function getExampleWords(
  index: Map<string, string[]>,
  pair: LetterPair,
  usedWords: string[],
  count: number = EXAMPLE_WORD_COUNT,
): string[] {
  const words = index.get(pairKey(pair.start, pair.end)) ?? []; // ?? [] = "or an empty list if missing"
  return words.filter((word) => !usedWords.includes(word)).slice(0, count);
}
