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

import { useEffect, useRef, useState } from "react";
import { AnswerInput } from "@/components/AnswerInput";
import { CountdownBar } from "@/components/CountdownBar";
import { GameOver } from "@/components/GameOver";
import { LetterPair } from "@/components/LetterPair";
import { StreakCounter } from "@/components/StreakCounter";
import { TimeLimitPicker } from "@/components/TimeLimitPicker";
import { ScreenHeader, SectionHeading } from "@/components/ui";
import { useGame } from "@/hooks/useGame";
import { useHighScores } from "@/hooks/useHighScores";
import { useWordData } from "@/hooks/useWordData";
import { APP_NAME } from "@/lib/brand";
import { TIME_LIMITS, type TimeLimit } from "@/lib/game/config";
import { type HighScoreEntry, bestFor, insertScore, rankFor } from "@/lib/game/highScores";
import { explainWarning } from "@/lib/game/validator";

export default function Home() {
  const { data, loading, error } = useWordData();
  const { state, secondsLeft, start, submit, restart, exampleWords } = useGame(data);
  const { boards, save } = useHighScores();

  // --- High scores -----------------------------------------------------------
  // This time limit's board as it was when the game STARTED. The saved board
  // changes the moment the game ends, but the rank ("New high score! #2") and
  // the board on the game-over screen are worked out from the OLD one, so
  // they're right on the very first render.
  const [boardBeforeGame, setBoardBeforeGame] = useState<HighScoreEntry[]>([]);

  /** Start a game, remembering the board from before it. */
  function startGame(timeLimit: TimeLimit) {
    setBoardBeforeGame(boards[timeLimit]);
    start(timeLimit);
  }

  // Only meaningful once the game is over: this game's place on the board
  // (or null) and the board including it.
  const rank = rankFor(boardBeforeGame, state.streak);
  const shownBoard =
    rank === null ? boardBeforeGame : insertScore(boardBeforeGame, { streak: state.streak, words: state.usedWords });

  // The game-over screen's "Play again" reuses the last time limit. It only
  // renders when timeLimit is set, so the fallback never actually runs.
  const lastTimeLimit = state.timeLimit;
  function playAgain() {
    if (lastTimeLimit) startGame(lastTimeLimit);
  }

  // When a game ends (by a wrong answer OR the timer), save it if it made the
  // board. An effect is the one place that sees both ways a game can end.
  // The ref remembers which game (roundId) was already handled, so a game is
  // never added twice, e.g. when React runs the effect again.
  const handledRoundRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.phase !== "over" || !state.timeLimit) return;
    if (handledRoundRef.current === state.roundId) return;
    handledRoundRef.current = state.roundId;
    if (rankFor(boardBeforeGame, state.streak) === null) return; // didn't make the board
    save(state.timeLimit, { streak: state.streak, words: state.usedWords });
  }, [state.phase, state.roundId, state.timeLimit, state.streak, state.usedWords, boardBeforeGame, save]);

  // Setup screen: the best streak for each time limit that has one.
  const bestPerMode = TIME_LIMITS.filter((limit) => bestFor(boards, limit) > 0)
    .map((limit) => `${limit}s: ${bestFor(boards, limit)}`)
    .join(" · ");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-6 pb-10">
      {/* The app's name: a small wordmark at the top, so each screen's own
          title ("How to play", "Game over") is the clear headline. */}
      <header className="text-center">
        <h1 className="text-lg font-bold">{APP_NAME}</h1>
      </header>

      {/* The current screen, centred in the space below the wordmark. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
        {/* --- Word lists still downloading, or failed --- */}
        {loading && <p className="text-zinc-500">Loading word lists…</p>}
        {error && <p className="text-red-600">Could not load the word lists: {error}</p>}

        {/* --- Setup: choose a time limit --- */}
        {data && state.phase === "setup" && (
          <section className="flex flex-col items-center gap-8 text-center">
            <ScreenHeader
              title="How to play"
              subtitle={
                <>
                  Type a word that <strong className="text-foreground">starts</strong> with the first letter and{" "}
                  <strong className="text-foreground">ends</strong> with the second, before time runs out. Every
                  correct word adds 1 to your streak.
                </>
              }
            />
            <div className="flex flex-col items-center gap-3">
              <SectionHeading>Seconds per word</SectionHeading>
              <TimeLimitPicker onPick={startGame} selected={state.timeLimit} />
              {bestPerMode && <p className="text-sm text-zinc-500 tabular-nums">Best — {bestPerMode}</p>}
            </div>
          </section>
        )}

        {/* --- Playing --- */}
        {data && state.phase === "playing" && state.pair && state.timeLimit && (
          <section className="flex w-full flex-col items-center gap-8">
            <StreakCounter streak={state.streak} best={bestFor(boards, state.timeLimit)} />
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
              warning={state.warning ? explainWarning(state.warning) : null}
              shakeKey={state.warningCount}
            />
          </section>
        )}

        {/* --- Game over --- */}
        {data && state.phase === "over" && state.pair && state.gameOverReason && state.timeLimit && (
          <GameOver
            streak={state.streak}
            board={shownBoard}
            rank={rank}
            reason={state.gameOverReason}
            lastInput={state.lastInput}
            pair={state.pair}
            timeLimit={state.timeLimit}
            exampleWords={exampleWords}
            onPlayAgain={playAgain}
            onChangeTime={restart}
          />
        )}
      </div>
    </main>
  );
}
