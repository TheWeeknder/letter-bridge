// =============================================================================
// letterPicker.ts — choose the next START/END letters for the player.
//
// The picker NEVER invents letters. It only chooses from `eligible`, the list
// of pairs that step (a) already checked have at least MIN_WORDS_PER_PAIR
// common words. That is what guarantees every prompt is solvable.
//
// WHY the `rng` parameter: Math.random() gives different results every run,
// which makes testing hard. By letting the caller pass in a random function,
// tests can pass a fake one that always returns, say, 0.5 and check exactly
// which pair comes out. The real game just uses the default (Math.random).
// =============================================================================

import type { LetterPair } from "./types";

/** True if two pairs have the same start AND end letter. */
export function samePair(a: LetterPair, b: LetterPair): boolean {
  return a.start === b.start && a.end === b.end;
}

/**
 * Pick a random pair from `eligible`, never returning the same pair as
 * `previous` twice in a row (unless it's the only option).
 *
 * @param eligible  pairs that are allowed (must not be empty)
 * @param rng       function returning a number in [0, 1), like Math.random
 * @param previous  the pair the player just had (optional)
 */
export function pickLetterPair(
  eligible: LetterPair[],
  rng: () => number = Math.random,
  previous?: LetterPair | null,
): LetterPair {
  // --- 1. Guard: with no pairs at all there is nothing sensible to return. ---
  // This would mean MIN_WORDS_PER_PAIR is set too high for the word list,
  // so we fail loudly instead of showing the player a broken prompt.
  if (eligible.length === 0) {
    throw new Error("No eligible letter pairs. Is MIN_WORDS_PER_PAIR too high?");
  }

  // --- 2. Remove the previous pair so the player always sees something new. ---
  // If that leaves nothing (only one pair exists), fall back to the full list.
  const withoutPrevious = previous
    ? eligible.filter((pair) => !samePair(pair, previous))
    : eligible;
  const candidates = withoutPrevious.length > 0 ? withoutPrevious : eligible;

  // --- 3. Turn a random number in [0, 1) into a list position. ---
  // Example with 4 candidates: rng() = 0.6  ->  0.6 * 4 = 2.4  ->  floor = 2.
  // Math.min is a safety net in case a custom rng ever returns exactly 1.
  const index = Math.min(
    Math.floor(rng() * candidates.length),
    candidates.length - 1,
  );

  // Return a COPY so callers can't accidentally modify our eligible list.
  return { ...candidates[index] };
}
