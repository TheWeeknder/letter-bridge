// =============================================================================
// types.ts — the shared "shapes" of data used across the game.
//
// WHY: TypeScript types are like a contract. If the validator promises to
// return a `ValidationResult`, the UI knows exactly which fields exist and the
// compiler warns us if we misspell one or forget to handle a case.
// =============================================================================

import type { TimeLimit } from "./config";

/** The two letters shown to the player. Always stored lowercase internally. */
export interface LetterPair {
  start: string; // e.g. "a" (displayed as "A")
  end: string; // e.g. "e" (displayed as "e")
}

/**
 * Everything we compute from the two word lists, built ONCE at startup.
 * - validation:    big dictionary, used to accept/reject answers
 * - generation:    common words only, used to choose fair letter pairs
 * - pairIndex:     "a|e" -> ["above", "able", ...] (common words only)
 * - eligiblePairs: the pairs that have at least MIN_WORDS_PER_PAIR words
 */
export interface WordData {
  validation: Set<string>;
  generation: string[];
  pairIndex: Map<string, string[]>;
  eligiblePairs: LetterPair[];
}

/** Every way an answer can be wrong. Each one gets its own friendly message. */
export type RejectionReason =
  | "EMPTY"
  | "TOO_SHORT"
  | "WRONG_START"
  | "WRONG_END"
  | "NOT_A_WORD"
  | "ALREADY_USED";

/**
 * The validator returns ONE of these two shapes (a "discriminated union").
 * Checking `result.ok` tells TypeScript which shape you have.
 */
export type ValidationResult =
  | { ok: true; word: string }
  | { ok: false; reason: RejectionReason };

/** Why a game ended: a rejected answer, or the clock ran out. */
export type GameOverReason = RejectionReason | "TIMEOUT";

/** The three screens / phases of the game. */
export type GamePhase = "setup" | "playing" | "over";

/** The complete state of one game. The reducer turns (state, action) -> new state. */
export interface GameState {
  phase: GamePhase;
  timeLimit: TimeLimit | null;
  pair: LetterPair | null;
  streak: number;
  usedWords: string[]; // words accepted in the current streak
  roundId: number; // goes up every round so the timer knows to restart
  gameOverReason: GameOverReason | null;
  lastInput: string | null; // what the player typed when they lost (if anything)
}

/** Everything that can happen in the game. */
export type GameAction =
  | { type: "START"; timeLimit: TimeLimit; pair: LetterPair }
  | { type: "SUBMIT_CORRECT"; word: string; nextPair: LetterPair }
  | { type: "FAIL"; reason: GameOverReason; input?: string }
  | { type: "RESTART" };
