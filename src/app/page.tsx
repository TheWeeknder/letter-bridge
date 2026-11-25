"use client";
// =============================================================================
// page.tsx — the home page ("/"): the game itself.
//
// This file only decides WHICH screen to show. All the rules live in
// lib/game (pure logic) and are wired together by the useGame hook.
//
//   loading / error -> waiting for the word lists
//   "setup"         -> pick a time limit
//   "playing"       -> streak, letters, countdown bar, answer box
//   "over"          -> final streak, reason, example words, restart buttons
//
// "use client" = this component runs in the browser, which we need because
// it uses React hooks and downloads the word lists with fetch().
// =============================================================================

import { useEffect, useState } from "react";
import { AnswerInput } from "@/components/AnswerInput";
import { CountdownBar } from "@/components/CountdownBar";
import { GameOver } from "@/components/GameOver";
import { LetterPair } from "@/components/LetterPair";
import { StreakCounter } from "@/components/StreakCounter";
import { TimeLimitPicker } from "@/components/TimeLimitPicker";
import { useBestStreak } from "@/hooks/useBestStreak";
import { useGame } from "@/hooks/useGame";
import { useWordData } from "@/hooks/useWordData";
import { APP_NAME } from "@/lib/brand";
import type { TimeLimit } from "@/lib/game/config";
import { isNewBest } from "@/lib/game/bestStreak";

export default function Home() {
  const { data, loading, error } = useWordData();
  const { state, secondsLeft, start, submit, restart, exampleWords } = useGame(data);
  const { best, record } = useBestStreak();

  // --- Best streak -----------------------------------------------------------
  // The record as it was when this game STARTED. We need it because the saved
  // record changes the moment the game ends, and "New best!" compares against
  // the OLD record.
  const [bestBeforeGame, setBestBeforeGame] = useState(0);

  /** Start a game, remembering the record from before it. */
  function startGame(timeLimit: TimeLimit) {
    setBestBeforeGame(best);
    start(timeLimit);
  }

  // When a game ends (by a wrong answer OR the timer), save the streak if it
  // beats the record. An effect is the one place that sees both ways a game
  // can end.
  useEffect(() => {
    if (state.phase === "over") record(state.streak);
  }, [state.phase, state.streak, record]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 p-6">
      {/* Slightly smaller title on narrow phone screens (sm: = 640px and up). */}
      <h1 className="text-center text-3xl font-bold sm:text-4xl">{APP_NAME}</h1>

      {/* --- Word lists still downloading, or failed --- */}
      {loading && <p className="text-zinc-500">Loading word lists…</p>}
      {error && <p className="text-red-600">Could not load the word lists: {error}</p>}

      {/* --- Setup: choose a time limit --- */}
      {data && state.phase === "setup" && (
        <section className="flex flex-col items-center gap-5 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Type a word that <strong>starts</strong> with the first letter and <strong>ends</strong> with the
            second, before time runs out. Every correct word adds 1 to your streak.
          </p>
          <p className="font-bold">Seconds per word:</p>
          <TimeLimitPicker onPick={startGame} selected={state.timeLimit} />
          {best > 0 && <p className="text-sm text-zinc-500 tabular-nums">Your best streak: {best}</p>}
        </section>
      )}

      {/* --- Playing --- */}
      {data && state.phase === "playing" && state.pair && state.timeLimit && (
        <section className="flex w-full flex-col items-center gap-6">
          <StreakCounter streak={state.streak} best={best} />
          <LetterPair pair={state.pair} />
          <div className="flex w-full flex-col items-center gap-1">
            <CountdownBar
              seconds={state.timeLimit}
              roundId={state.roundId}
              running
              secondsLeft={secondsLeft}
            />
            <span className="text-sm text-zinc-500 tabular-nums">{secondsLeft.toFixed(1)}s</span>
          </div>
          {/* key={roundId}: a fresh, empty, focused input for every new pair */}
          <AnswerInput
            key={state.roundId}
            onSubmit={submit}
            warning={
              state.repeatedWord ? `You already used '${state.repeatedWord}'. Try another word!` : null
            }
            shakeKey={state.repeatCount}
          />
        </section>
      )}

      {/* --- Game over --- */}
      {data && state.phase === "over" && state.pair && state.gameOverReason && state.timeLimit && (
        <GameOver
          streak={state.streak}
          best={Math.max(best, state.streak)}
          isNewBest={isNewBest(state.streak, bestBeforeGame)}
          reason={state.gameOverReason}
          lastInput={state.lastInput}
          pair={state.pair}
          timeLimit={state.timeLimit}
          exampleWords={exampleWords}
          onPlayAgain={() => startGame(state.timeLimit!)}
          onChangeTime={restart}
        />
      )}
    </main>
  );
}
