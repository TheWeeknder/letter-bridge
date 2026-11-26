// =============================================================================
// types.ts — the shared "shapes" of data used across the game.
//
// WHY: TypeScript types are like a contract. If the validator promises to
// return a `ValidationResult`, the UI knows exactly which fields exist and the
// compiler warns us if we misspell one or forget to handle a case.
// =============================================================================

import type { GameMode } from "./modes";

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

/**
 * Rejections that CAN be just a warning: the player tries again on the same
 * pair while the clock keeps running. Which ones actually warn depends on the
 * mode (see warnsInstead in modes.ts): in Streak only TOO_SHORT and
 * ALREADY_USED, in Sprint all of them.
 */
export type WarningReason = Exclude<RejectionReason, "EMPTY">;

/** A warning shown under the answer box: why, and the (cleaned) word typed. */
export interface Warning {
  reason: WarningReason;
  word: string;
}

/** Why a game ended: a rejected answer, or the clock ran out. */
export type GameOverReason = RejectionReason | "TIMEOUT";

/** The three screens / phases of the game. */
export type GamePhase = "setup" | "playing" | "over";

/** The complete state of one game. The reducer turns (state, action) -> new state. */
export interface GameState {
  phase: GamePhase;
  mode: GameMode | null; // Streak (seconds per word) or Sprint (see modes.ts)
  seed: string | null; // decides this game's sequence of pairs (see random.ts)
  pair: LetterPair | null;
  streak: number;
  usedWords: string[]; // words accepted in the current streak
  roundId: number; // goes up for every new pair (fresh, empty answer box)
  // The countdown is separate from the round: in Sprint a new pair keeps the
  // same clock. timerId goes up whenever the countdown should restart.
  timerId: number;
  timerSeconds: number; // how long the current countdown runs (less if resumed mid-sprint)
  gameOverReason: GameOverReason | null;
  lastInput: string | null; // what the player typed when they lost (if anything)
  // Some mistakes don't end the game; the player just tries again (see modes.ts).
  warning: Warning | null; // the latest warning this round (shown under the box)
  warningCount: number; // goes up on every warning, so the input shakes EVERY time
}

/** Everything that can happen in the game. */
export type GameAction =
  | { type: "START"; mode: GameMode; seed: string; pair: LetterPair }
  | { type: "SUBMIT_CORRECT"; word: string; nextPair: LetterPair }
  | { type: "WARN"; warning: Warning }
  | { type: "FAIL"; reason: GameOverReason; input?: string }
  | { type: "RESTART" }
  | { type: "RESET" };
