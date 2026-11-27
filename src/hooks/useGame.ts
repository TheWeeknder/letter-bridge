"use client";
// =============================================================================
// useGame.ts — the "glue" between the pure game logic and React.
//
// WHY: the reducer, picker and validator are pure and know nothing about
// React or time. This hook connects them:
//   - holds the game state (useReducer + gameReducer)
//   - picks each round's letter pair from the game's seed (pairForRound)
//   - checks answers (validateAnswer)
//   - runs the 3 · 2 · 1 before each game: start() goes to the "countdown"
//     phase and remembers WHEN play begins (startsAt); a timer then sends GO
//   - runs the game clock (useCountdown) and ends the game when it expires:
//     per word in Streak mode, once for the whole game in Sprint
//   - decides, per mode, whether a mistake ends the game or just warns
// Components only call start(), submit(), restart() and read `state`.
//
// MULTIPLAYER uses the same hook with a few options (see UseGameOptions):
// the game starts from the room's seed, counting down to the moment the
// room server picked (so everyone starts together), every answer and timeout
// is also reported to the room server, and the server can end the game
// (forceOver) if it disagrees, because the server's verdict is final.
// =============================================================================

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { START_COUNTDOWN_SECONDS } from "@/lib/game/config";
import { getExampleWords } from "@/lib/game/examples";
import { gameReducer, initialGameState } from "@/lib/game/gameReducer";
import { type GameMode, warnsInstead } from "@/lib/game/modes";
import { normalizeWord } from "@/lib/game/normalize";
import { newSeed, pairForRound } from "@/lib/game/random";
import type { GameOverReason, GameState, LetterPair, WordData } from "@/lib/game/types";
import { validateAnswer } from "@/lib/game/validator";
import { useCountdown } from "./useCountdown";

export interface UseGameResult {
  state: GameState;
  secondsLeft: number; // for the countdown bar / number
  startsAt: number | null; // when play begins after the 3 · 2 · 1 (Date.now() ms), for the countdown screen
  start: (mode: GameMode, seed?: string) => void; // begin a new game (same seed = same pairs)
  submit: (input: string) => void; // the player pressed Enter
  restart: () => void; // back to the mode screen
  forceOver: (reason: GameOverReason, input: string | null) => void; // end the game (the server said so)
  reset: () => void; // forget the game entirely (back to a fresh setup screen)
  exampleWords: string[]; // filled in on the game-over screen
}

export interface UseGameOptions {
  /**
   * Start playing straight away with this mode and seed (multiplayer).
   * `resume` continues a game already in progress (e.g. after a page reload),
   * from the streak, words and pair the room server remembered. In Sprint,
   * `secondsLeft` is what's left of the shared clock.
   */
  autoStart?: {
    mode: GameMode;
    seed: string;
    resume?: { streak: number; usedWords: string[]; pair: LetterPair; secondsLeft?: number };
    /** When play begins (this device's Date.now() ms). Still ahead = show the 3 · 2 · 1 first. */
    startsAt?: number;
  };
  /** Called for every answer that counts: right OR game-ending (not warnings). `round` = the streak it was for. */
  onAnswer?: (round: number, input: string) => void;
  /** Called when time runs out on round `round`. */
  onTimeout?: (round: number) => void;
}

export function useGame(data: WordData | null, options: UseGameOptions = {}): UseGameResult {
  const { autoStart, onAnswer, onTimeout } = options;

  // When play begins after the 3 · 2 · 1 (Date.now() ms). Set by start(),
  // or by the room (autoStart.startsAt) in multiplayer.
  const [startsAt, setStartsAt] = useState<number | null>(() => autoStart?.startsAt ?? null);

  // useReducer: React stores the state and runs gameReducer on every dispatch.
  // With autoStart (and the words loaded), the very first state is already a
  // started game, so there's no extra "start" step or flash of the setup screen.
  const [state, dispatch] = useReducer(gameReducer, initialGameState, (initial) => {
    if (!autoStart || !data) return initial;
    const counting = gameReducer(initial, {
      type: "START",
      mode: autoStart.mode,
      seed: autoStart.seed,
      pair: pairForRound(data.eligiblePairs, autoStart.seed, 0, null),
    });
    const resume = autoStart.resume;
    const withResume = resume
      ? {
          ...counting,
          streak: resume.streak,
          usedWords: resume.usedWords,
          pair: resume.pair,
          timerSeconds: resume.secondsLeft ?? counting.timerSeconds,
        }
      : counting;
    // The room's start moment already passed (e.g. a reload mid-game)? Then
    // skip the 3 · 2 · 1 and go straight to playing.
    const stillCounting = autoStart.startsAt !== undefined && autoStart.startsAt > Date.now();
    return stillCounting ? withResume : gameReducer(withResume, { type: "GO" });
  });

  // --- The 3 · 2 · 1: send GO when the countdown is over ---------------------
  // A timeout, not a check on every frame: the screen shows the numbers itself
  // (StartCountdown); this only decides when the game really begins.
  useEffect(() => {
    if (state.phase !== "countdown" || startsAt === null) return;
    const id = setTimeout(() => dispatch({ type: "GO" }), Math.max(0, startsAt - Date.now()));
    return () => clearTimeout(id);
  }, [state.phase, startsAt]);

  // --- The timer: runs only while playing, restarts when timerId changes ----
  // (every new pair in Streak mode; only at the start of the game in Sprint)
  const { secondsLeft, isTimeUp } = useCountdown({
    seconds: state.timerSeconds,
    roundId: state.timerId,
    running: state.phase === "playing",
    onExpire: () => {
      onTimeout?.(state.streak);
      dispatch({ type: "FAIL", reason: "TIMEOUT" });
    },
  });

  // --- Actions the UI can call ----------------------------------------------
  /**
   * Begin a new game. The pairs come from `seed` (see random.ts), so everyone
   * with the same seed gets the same pairs. Single player leaves it out and
   * gets a fresh random seed each game.
   */
  function start(mode: GameMode, seed: string = newSeed()) {
    if (!data) return; // word lists not loaded yet
    // The 3 · 2 · 1 first: play begins START_COUNTDOWN_SECONDS from now.
    setStartsAt(Date.now() + START_COUNTDOWN_SECONDS * 1000);
    dispatch({ type: "START", mode, seed, pair: pairForRound(data.eligiblePairs, seed, 0, null) });
  }

  function submit(input: string) {
    if (!data || state.phase !== "playing" || !state.pair || state.seed === null || state.mode === null) return;

    // The deadline might have passed since the last screen refresh.
    // Checking here means a late answer can never sneak through.
    if (isTimeUp()) {
      onTimeout?.(state.streak);
      dispatch({ type: "FAIL", reason: "TIMEOUT", input });
      return;
    }

    const result = validateAnswer({
      input,
      pair: state.pair,
      validation: data.validation,
      usedWords: state.usedWords,
    });

    // A mistake that only warns in this mode (see modes.ts)?
    const justWarn = !result.ok && warnsInstead(state.mode, result.reason);

    // Tell the room server about every answer that counts (a no-op in solo).
    // Warnings aren't sent: they change nothing, here or on the server.
    if (!justWarn) onAnswer?.(state.streak, input);

    if (result.ok) {
      // The next round is number streak + 1 (randomness stays out of the reducer).
      const nextPair = pairForRound(data.eligiblePairs, state.seed, state.streak + 1, state.pair);
      dispatch({ type: "SUBMIT_CORRECT", word: result.word, nextPair });
    } else if (justWarn && result.reason !== "EMPTY") {
      // Warn and let the player try again on the same pair (the clock keeps
      // running). In Streak that's only for slips (too short, repeated); in
      // Sprint it's every mistake.
      dispatch({ type: "WARN", warning: { reason: result.reason, word: normalizeWord(input) } });
    } else {
      dispatch({ type: "FAIL", reason: result.reason, input });
    }
  }

  // useCallback: the same function every render, so it's safe in effect dependencies.
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  function restart() {
    dispatch({ type: "RESTART" });
  }

  function forceOver(reason: GameOverReason, input: string | null) {
    // FAIL is ignored if the game is already over, so calling this twice is safe.
    dispatch({ type: "FAIL", reason, input: input ?? undefined });
  }

  // --- Example words, only computed when the game is over ------------------
  // useMemo remembers the result until one of the listed values changes,
  // so we don't redo the work on every re-render.
  const exampleWords = useMemo(() => {
    if (!data || state.phase !== "over" || !state.pair) return [];
    return getExampleWords(data.pairIndex, state.pair, state.usedWords);
  }, [data, state.phase, state.pair, state.usedWords]);

  return { state, secondsLeft, startsAt, start, submit, restart, forceOver, reset, exampleWords };
}
