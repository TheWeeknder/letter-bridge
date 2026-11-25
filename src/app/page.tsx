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

import { AnswerInput } from "@/components/AnswerInput";
import { CountdownBar } from "@/components/CountdownBar";
import { GameOver } from "@/components/GameOver";
import { LetterPair } from "@/components/LetterPair";
import { StreakCounter } from "@/components/StreakCounter";
import { TimeLimitPicker } from "@/components/TimeLimitPicker";
import { useGame } from "@/hooks/useGame";
import { useWordData } from "@/hooks/useWordData";

export default function Home() {
  const { data, loading, error } = useWordData();
  const { state, secondsLeft, start, submit, restart, exampleWords } = useGame(data);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-4xl font-bold">Generate a Word!</h1>

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
          <TimeLimitPicker onPick={start} selected={state.timeLimit} />
        </section>
      )}

      {/* --- Playing --- */}
      {data && state.phase === "playing" && state.pair && state.timeLimit && (
        <section className="flex w-full flex-col items-center gap-6">
          <StreakCounter streak={state.streak} />
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
          <AnswerInput key={state.roundId} onSubmit={submit} />
        </section>
      )}

      {/* --- Game over --- */}
      {data && state.phase === "over" && state.pair && state.gameOverReason && state.timeLimit && (
        <GameOver
          streak={state.streak}
          reason={state.gameOverReason}
          lastInput={state.lastInput}
          pair={state.pair}
          timeLimit={state.timeLimit}
          exampleWords={exampleWords}
          onPlayAgain={() => start(state.timeLimit!)}
          onChangeTime={restart}
        />
      )}
    </main>
  );
}
