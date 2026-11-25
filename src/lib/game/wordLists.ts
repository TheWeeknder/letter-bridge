// =============================================================================
// wordLists.ts — turn raw .txt file contents into the data the game needs.
//
// WHY this is separate from fetching: this file only deals with STRINGS, not
// the network. That means tests can feed it a tiny fake word list without a
// browser or server, and the browser code (lib/browser/loadWordData.ts) only
// has to worry about downloading.
// =============================================================================

import { MIN_WORDS_PER_PAIR, MIN_WORD_LENGTH } from "./config";
import { normalizeWord } from "./normalize";
import { buildPairIndex, getEligiblePairs } from "./pairIndex";
import type { WordData } from "./types";

/** Only plain lowercase letters a–z. No digits, hyphens, apostrophes or spaces. */
const LETTERS_ONLY = /^[a-z]+$/;

/**
 * Split a word-list file (one word per line) into a clean array:
 * normalized, letters a–z only, at least MIN_WORD_LENGTH long, no duplicates.
 *
 * Original order is kept (important for the common-word list, which is sorted
 * by how frequently each word is used).
 */
export function parseWordList(text: string): string[] {
  // A Set ignores anything already added, so duplicates disappear for free,
  // and it remembers insertion order.
  const words = new Set<string>();

  // Split on line breaks. "\r?\n" handles both Unix (\n) and Windows (\r\n) files.
  for (const line of text.split(/\r?\n/)) {
    const word = normalizeWord(line);

    if (word.length < MIN_WORD_LENGTH) continue; // too short (also skips blank lines)
    if (!LETTERS_ONLY.test(word)) continue; // "don't", "e-mail", "123" etc.

    words.add(word);
  }

  return [...words]; // convert the Set back into a normal array
}

/**
 * Build everything the game needs from the two raw files.
 *
 * - validation:    every dictionary word -> a Set, so "is this a word?" is instant
 * - generation:    common words that ALSO appear in the dictionary. This drops
 *                  abbreviations and names like "usa" or "html", and it
 *                  guarantees every example word we show will be accepted.
 * - pairIndex:     common words grouped by first+last letter
 * - eligiblePairs: only pairs with at least MIN_WORDS_PER_PAIR common words
 */
export function buildWordData(
  validationText: string,
  generationText: string,
  minWordsPerPair: number = MIN_WORDS_PER_PAIR,
): WordData {
  // A Set lets us check membership instantly, even with ~170k words.
  // (Searching an array would compare against every word, one by one.)
  const validation = new Set(parseWordList(validationText));

  const generation = parseWordList(generationText).filter((word) =>
    validation.has(word),
  );

  const pairIndex = buildPairIndex(generation);
  const eligiblePairs = getEligiblePairs(pairIndex, minWordsPerPair);

  return { validation, generation, pairIndex, eligiblePairs };
}
