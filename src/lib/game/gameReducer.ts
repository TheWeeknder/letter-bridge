// =============================================================================
// gameReducer.ts — the game's "state machine".
//
// WHAT is a reducer: a pure function (state, action) -> newState. "Pure" means
// it never reads the clock, never calls Math.random, never touches the screen.
// Given the same inputs it ALWAYS gives the same output.
//
// WHY: that makes the whole game flow testable with plain function calls:
//   state = gameReducer(state, { type: "START", ... })
//   expect(state.phase).toBe("playing")
// Anything random (the next letter pair) is decided OUTSIDE and passed in
// inside the action.
//
// Phases:  setup --START--> playing --FAIL--> over --START--> playing
//                             ^   |             |
//                             +---+             +--RESTART--> setup
//                        SUBMIT_CORRECT
//                   (streak + 1, new pair)
//                        REPEAT_WORD
//              (same pair, same timer, warning shown)
//
// Actions that don't make sense in the current phase are IGNORED (the same
// state is returned). Example: the timer fires "FAIL: TIMEOUT" a split second
// after the player already lost. Ignoring it means the first reason sticks.
// =============================================================================

import type { GameAction, GameState } from "./types";

/** The state before any game has started. */
export const initialGameState: GameState = {
  phase: "setup",
  timeLimit: null,
  pair: null,
  streak: 0,
  usedWords: [],
  roundId: 0,
  gameOverReason: null,
  lastInput: null,
  repeatedWord: null,
  repeatCount: 0,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // --- Start a brand-new game (from the setup or game-over screen) ---------
    case "START": {
      if (state.phase === "playing") return state; // already playing: ignore
      return {
        ...state,
        phase: "playing",
        timeLimit: action.timeLimit,
        pair: action.pair,
        streak: 0,
        usedWords: [],
        roundId: state.roundId + 1, // new round -> timer restarts
        gameOverReason: null,
        lastInput: null,
        repeatedWord: null,
      };
    }

    // --- The player's answer was valid: +1 streak, next pair, fresh timer ---
    case "SUBMIT_CORRECT": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        streak: state.streak + 1,
        // Make a NEW array instead of push(). React only notices changes when
        // it gets a new object/array, and the old state stays untouched.
        usedWords: [...state.usedWords, action.word],
        pair: action.nextPair,
        roundId: state.roundId + 1,
        repeatedWord: null, // new pair: the old warning no longer applies
      };
    }

    // --- The player typed a word they already used: warn, but keep playing --
    // Nothing else changes: same pair, same streak, and the SAME roundId, so
    // the timer keeps running. A repeat costs time, but it isn't game over.
    // repeatCount always goes up (even for the same word twice) so the
    // screen can tell a NEW repeat happened and shake again.
    case "REPEAT_WORD": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        repeatedWord: action.word,
        repeatCount: state.repeatCount + 1,
      };
    }

    // --- Wrong answer or time ran out: game over -----------------------------
    case "FAIL": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        phase: "over",
        gameOverReason: action.reason,
        lastInput: action.input ?? null,
        // `pair`, `streak` and `usedWords` are kept so the game-over screen
        // can show the final streak and example words for the last pair.
      };
    }

    // --- Back to the setup screen to choose a different time limit ----------
    case "RESTART": {
      // Keep the last time limit so it's pre-selected next time;
      // everything else goes back to the starting values.
      return { ...initialGameState, timeLimit: state.timeLimit, roundId: state.roundId };
    }
  }
}
