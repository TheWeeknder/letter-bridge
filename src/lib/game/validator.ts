// =============================================================================
// validator.ts — decide whether the player's answer is accepted, and if not,
// say exactly WHY.
//
// WHY return a reason instead of just true/false: a game-over screen saying
// "Wrong!" is frustrating. "'Aeioue' isn't in the dictionary" teaches you
// something. It also makes the tests clearer: we can check that each kind of
// mistake produces the right reason.
//
// The checks run in a fixed order, cheapest and most obvious first:
//   1. EMPTY        nothing typed
//   2. TOO_SHORT    fewer than MIN_WORD_LENGTH letters
//   3. WRONG_START  first letter doesn't match
//   4. WRONG_END    last letter doesn't match
//   5. NOT_A_WORD   not in the dictionary
//   6. ALREADY_USED accepted earlier in this streak
// Order matters when an answer breaks several rules at once: "xyz" for A…e
// is reported as WRONG_START, the most helpful thing to fix first.
// The validator only REPORTS the reason. What happens next depends on the
// mode (see warnsInstead in modes.ts): in Streak, TOO_SHORT and ALREADY_USED
// let the player try again while anything else ends the game; in Sprint
// every mistake just warns.
// Timeouts are NOT handled here. The validator only judges typed answers;
// the clock is handled by useCountdown and useGame.
// =============================================================================

import { MIN_WORD_LENGTH } from "./config";
import { displayEnd, displayStart } from "./display";
import { normalizeWord } from "./normalize";
import type {
  GameOverReason,
  LetterPair,
  RejectionReason,
  ValidationResult,
  Warning,
} from "./types";

/** Short, general text for each rejection reason. */
export const REJECTION_MESSAGES: Record<RejectionReason, string> = {
  EMPTY: "You didn't type anything.",
  TOO_SHORT: `Words must be at least ${MIN_WORD_LENGTH} letters long.`,
  WRONG_START: "That word doesn't start with the right letter.",
  WRONG_END: "That word doesn't end with the right letter.",
  NOT_A_WORD: "That isn't in the dictionary.",
  ALREADY_USED: "You already used that word in this streak.",
};

export interface ValidateAnswerInput {
  input: string; // exactly what the player typed, e.g. "  Astute "
  pair: LetterPair; // the current letters, e.g. { start: "a", end: "e" }
  validation: Set<string>; // the big dictionary (already normalized)
  usedWords: string[]; // words already accepted in this streak (normalized)
}

/** Check the answer against every rule, in a fixed order. */
export function validateAnswer({
  input,
  pair,
  validation,
  usedWords,
}: ValidateAnswerInput): ValidationResult {
  // Clean the input first so case and extra spaces never matter:
  // "  AsTute " -> "astute". Everything below uses `word`, never `input`.
  const word = normalizeWord(input);

  // --- 1-2: length checks --------------------------------------------------
  if (word.length === 0) return { ok: false, reason: "EMPTY" };
  if (word.length < MIN_WORD_LENGTH) return { ok: false, reason: "TOO_SHORT" };

  // --- 3-4: letter checks --------------------------------------------------
  // The pair is lowercased too, just in case a caller passes "A" instead of "a".
  if (!word.startsWith(pair.start.toLowerCase())) return { ok: false, reason: "WRONG_START" };
  if (!word.endsWith(pair.end.toLowerCase())) return { ok: false, reason: "WRONG_END" };

  // --- 5: dictionary check -------------------------------------------------
  // Set.has() is instant even with ~170k words. Anything with spaces, digits
  // or punctuation ("as tute", "a-e") is never in the set, so it fails here.
  if (!validation.has(word)) return { ok: false, reason: "NOT_A_WORD" };

  // --- 6: no repeats within a streak ---------------------------------------
  if (usedWords.includes(word)) return { ok: false, reason: "ALREADY_USED" };

  // Passed every check. Return the CLEAN word so the game stores "astute",
  // not "  Astute ", in its list of used words.
  return { ok: true, word };
}

/**
 * Build a specific, friendly sentence for the game-over screen, e.g.
 *   "'aeioue' isn't in the dictionary."
 *   "'bite' doesn't start with A."
 * Also covers TIMEOUT, so the UI has one place to get every game-over message.
 */
export function explainGameOver(
  reason: GameOverReason,
  input: string | null,
  pair: LetterPair,
): string {
  const word = input ? normalizeWord(input) : "";
  const start = displayStart(pair); // shown uppercase, like on screen
  const end = displayEnd(pair); // shown lowercase, like on screen

  switch (reason) {
    case "TIMEOUT":
      return "Time's up!";
    case "EMPTY":
      return REJECTION_MESSAGES.EMPTY;
    case "TOO_SHORT":
      return `'${word}' is too short. Words need at least ${MIN_WORD_LENGTH} letters.`;
    case "WRONG_START":
      return `'${word}' doesn't start with ${start}.`;
    case "WRONG_END":
      return `'${word}' doesn't end with ${end}.`;
    case "NOT_A_WORD":
      return `'${word}' isn't in the dictionary.`;
    case "ALREADY_USED":
      return `You already used '${word}' in this streak.`;
  }
}

/**
 * The warning shown under the answer box. These don't end the game, so the
 * text is a nudge to try again rather than a verdict. `pair` is the letters
 * the player was on, for "doesn't start with A".
 */
export function explainWarning({ reason, word }: Warning, pair: LetterPair): string {
  switch (reason) {
    case "TOO_SHORT":
      return `'${word}' is too short. Use at least ${MIN_WORD_LENGTH} letters!`;
    case "ALREADY_USED":
      return `You already used '${word}'. Try another word!`;
    case "WRONG_START":
      return `'${word}' doesn't start with ${displayStart(pair)}. Try again!`;
    case "WRONG_END":
      return `'${word}' doesn't end with ${displayEnd(pair)}. Try again!`;
    case "NOT_A_WORD":
      return `'${word}' isn't in the dictionary. Try another word!`;
  }
}
