"use client";
// =============================================================================
// useGame.ts — the "glue" between the pure game logic and React.
//
// WHY: the reducer, picker and validator are pure and know nothing about
// React or time. This hook connects them:
//   - holds the game state (useReducer + gameReducer)
//   - picks random letter pairs (pickLetterPair)
//   - checks answers (validateAnswer)
//   - runs the countdown (useCountdown) and ends the game when it expires
// Components only call start(), submit(), restart() and read `state`.
// =============================================================================

import { useMemo, useReducer } from "react";
import type { TimeLimit } from "@/lib/game/config";
import { getExampleWords } from "@/lib/game/examples";
import { gameReducer, initialGameState } from "@/lib/game/gameReducer";
import { pickLetterPair } from "@/lib/game/letterPicker";
import { normalizeWord } from "@/lib/game/normalize";
import type { GameState, LetterPair, WordData } from "@/lib/game/types";
import { validateAnswer } from "@/lib/game/validator";
import { useCountdown } from "./useCountdown";

export interface UseGameResult {
  state: GameState;
  secondsLeft: number; // for the countdown bar / number
  start: (timeLimit: TimeLimit) => void; // begin a new game
  submit: (input: string) => void; // the player pressed Enter
  restart: () => void; // back to the time-limit screen
  exampleWords: string[]; // filled in on the game-over screen
}

export function useGame(data: WordData | null): UseGameResult {
  // useReducer: React stores the state and runs gameReducer on every dispatch.
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // --- The timer: runs only while playing, restarts every round ------------
  const { secondsLeft, isTimeUp } = useCountdown({
    seconds: state.timeLimit ?? 0,
    roundId: state.roundId,
    running: state.phase === "playing",
    onExpire: () => dispatch({ type: "FAIL", reason: "TIMEOUT" }),
  });

  /**
   * Pick a random pair that differs from the current one. Randomness stays
   * HERE, outside the reducer. Passing the last pair (even from the previous
   * game) avoids an instant repeat.
   */
  function pickNextPair(words: WordData): LetterPair {
    return pickLetterPair(words.eligiblePairs, Math.random, state.pair);
  }

  // --- Actions the UI can call ----------------------------------------------
  function start(timeLimit: TimeLimit) {
    if (!data) return; // word lists not loaded yet
    dispatch({ type: "START", timeLimit, pair: pickNextPair(data) });
  }

  function submit(input: string) {
    if (!data || state.phase !== "playing" || !state.pair) return;

    // The deadline might have passed since the last screen refresh.
    // Checking here means a late answer can never sneak through.
    if (isTimeUp()) {
      dispatch({ type: "FAIL", reason: "TIMEOUT", input });
      return;
    }

    const result = validateAnswer({
      input,
      pair: state.pair,
      validation: data.validation,
      usedWords: state.usedWords,
    });

    if (result.ok) {
      dispatch({ type: "SUBMIT_CORRECT", word: result.word, nextPair: pickNextPair(data) });
    } else if (result.reason === "ALREADY_USED") {
      // A repeat is an honest slip, not a wrong word: warn and let the player
      // try again on the same pair (the clock keeps running).
      dispatch({ type: "REPEAT_WORD", word: normalizeWord(input) });
    } else {
      dispatch({ type: "FAIL", reason: result.reason, input });
    }
  }

  function restart() {
    dispatch({ type: "RESTART" });
  }

  // --- Example words, only computed when the game is over ------------------
  // useMemo remembers the result until one of the listed values changes,
  // so we don't redo the work on every re-render.
  const exampleWords = useMemo(() => {
    if (!data || state.phase !== "over" || !state.pair) return [];
    return getExampleWords(data.pairIndex, state.pair, state.usedWords);
  }, [data, state.phase, state.pair, state.usedWords]);

  return { state, secondsLeft, start, submit, restart, exampleWords };
}
