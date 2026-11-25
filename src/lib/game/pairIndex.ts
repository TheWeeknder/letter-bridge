// =============================================================================
// pairIndex.ts — the "lookup table" that prevents impossible letter pairs.
//
// WHY: if we picked two random letters, we might ask for a word that starts
// with "Q" and ends with "j" — nobody can answer that. Instead we look at every
// common word ONCE, group them by (first letter, last letter), and later only
// offer pairs whose group is big enough.
//
// Example with the words ["able", "above", "and", "ant"]:
//   "a|e" -> ["able", "above"]
//   "a|d" -> ["and"]
//   "a|t" -> ["ant"]
// =============================================================================

import type { LetterPair } from "./types";

/**
 * Turn a pair into a Map key, e.g. ("a", "e") -> "a|e".
 *
 * WHY a string key: JavaScript Maps compare object keys by identity, so two
 * separate { start: "a", end: "e" } objects would count as DIFFERENT keys.
 * Strings are compared by value, so "a|e" always finds the same entry.
 */
export function pairKey(start: string, end: string): string {
  return `${start}|${end}`;
}

/**
 * Group words by their first and last letter.
 * Result: Map { "a|e" => ["able", "above", ...], "t|s" => [...], ... }
 *
 * We store the actual WORDS (not just a count) because:
 *  - the count is simply `words.length`, and
 *  - the game-over screen needs real example words for a pair.
 * Words keep their original order. The common-word list is sorted from most
 * to least frequent, so the first words in each group are the most familiar.
 */
export function buildPairIndex(words: string[]): Map<string, string[]> {
  const index = new Map<string, string[]>();

  for (const word of words) {
    if (word.length === 0) continue; // safety: skip blank entries

    const key = pairKey(word[0], word[word.length - 1]);
    const group = index.get(key);

    if (group) {
      group.push(word); // pair seen before: add to its list
    } else {
      index.set(key, [word]); // first word for this pair: start a new list
    }
  }

  return index;
}

/**
 * Return every pair whose group has at least `minCount` words.
 * Sorted alphabetically ("a|d" before "a|e" before "b|e"...) so the result is
 * always in the same order, which makes it easier to test and debug.
 */
export function getEligiblePairs(
  index: Map<string, string[]>,
  minCount: number,
): LetterPair[] {
  const pairs: LetterPair[] = [];

  for (const [key, words] of index) {
    if (words.length >= minCount) {
      const [start, end] = key.split("|"); // "a|e" -> ["a", "e"]
      pairs.push({ start, end });
    }
  }

  return pairs.sort((x, y) => pairKey(x.start, x.end).localeCompare(pairKey(y.start, y.end)));
}
