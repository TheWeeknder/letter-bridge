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
// Anything random (the seed and the next letter pair) is decided OUTSIDE and
// passed in inside the action.
//
// Phases:  setup --START--> countdown --GO--> playing --FAIL--> over --START--> countdown
//                                               ^   |            |
//                                               +---+            +--RESTART--> setup
//                                                  (RESET from anywhere -> setup)
//
// COUNTDOWN: START doesn't begin play straight away. The "3 · 2 · 1" comes
// first (START_COUNTDOWN_SECONDS); the pair is picked but hidden and nothing
// can be answered. The hook (useGame) sends GO when the time is up. The
// reducer never looks at the clock itself.
//                        SUBMIT_CORRECT
//                   (streak + 1, new pair;
//               Streak: fresh timer, Sprint: same clock)
//                           WARN
//          (a mistake that doesn't end the game: same pair,
//               same timer, warning shown)
//
// Actions that don't make sense in the current phase are IGNORED (the same
// state is returned). Example: the timer fires "FAIL: TIMEOUT" a split second
// after the player already lost. Ignoring it means the first reason sticks.
// =============================================================================

import { isSprint, modeSeconds } from "./modes";
import type { GameAction, GameState } from "./types";

/** The state before any game has started. */
export const initialGameState: GameState = {
  phase: "setup",
  mode: null,
  seed: null,
  pair: null,
  streak: 0,
  usedWords: [],
  roundId: 0,
  timerId: 0,
  timerSeconds: 0,
  gameOverReason: null,
  lastInput: null,
  warning: null,
  warningCount: 0,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // --- Start a brand-new game (from the setup or game-over screen) ---------
    case "START": {
      // Already counting down or playing: ignore.
      if (state.phase === "countdown" || state.phase === "playing") return state;
      return {
        ...state,
        phase: "countdown", // the 3 · 2 · 1 first; GO starts the real game
        mode: action.mode,
        seed: action.seed,
        pair: action.pair,
        streak: 0,
        usedWords: [],
        roundId: state.roundId + 1, // new round -> fresh answer box
        timerId: state.timerId + 1, // new game -> the countdown starts from full
        timerSeconds: modeSeconds(action.mode),
        gameOverReason: null,
        lastInput: null,
        warning: null,
      };
    }

    // --- The countdown is over: show the letters, start the clock ----------
    // (The clock starts by itself: useCountdown only runs while "playing".)
    case "GO": {
      if (state.phase !== "countdown") return state;
      return { ...state, phase: "playing" };
    }

    // --- The player's answer was valid: +1 streak, next pair ---------------
    // Streak mode gives every pair its own fresh timer; Sprint keeps the one
    // clock running (timerId stays the same, so the countdown doesn't restart).
    case "SUBMIT_CORRECT": {
      if (state.phase !== "playing") return state;
      const freshTimer = state.mode !== null && !isSprint(state.mode);
      return {
        ...state,
        streak: state.streak + 1,
        // Make a NEW array instead of push(). React only notices changes when
        // it gets a new object/array, and the old state stays untouched.
        usedWords: [...state.usedWords, action.word],
        pair: action.nextPair,
        roundId: state.roundId + 1,
        timerId: freshTimer ? state.timerId + 1 : state.timerId,
        timerSeconds: freshTimer && state.mode !== null ? modeSeconds(state.mode) : state.timerSeconds,
        warning: null, // new pair: the old warning no longer applies
      };
    }

    // --- A mistake that only warns (see warnsInstead in modes.ts) -----------
    // Nothing else changes: same pair, same streak, the SAME timer, which
    // keeps running. A slip costs time, but it isn't game over.
    // warningCount always goes up (even for the same word twice) so the
    // screen can tell a NEW warning happened and shake again.
    case "WARN": {
      if (state.phase !== "playing") return state;
      return {
        ...state,
        warning: action.warning,
        warningCount: state.warningCount + 1,
      };
    }

    // --- Wrong answer (Streak) or time ran out: game over ---------------------
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

    // --- Back to the setup screen to choose a different mode ----------------
    case "RESTART": {
      // Keep the last mode so it's pre-selected next time;
      // everything else goes back to the starting values.
      return { ...initialGameState, mode: state.mode, roundId: state.roundId, timerId: state.timerId };
    }

    // --- Leave the game completely (e.g. the player went back home) ---------
    case "RESET": {
      // Like a fresh visit: nothing pre-selected. roundId and timerId keep
      // counting up so React never mistakes a new round for an old one.
      return { ...initialGameState, roundId: state.roundId, timerId: state.timerId };
    }
  }
}
