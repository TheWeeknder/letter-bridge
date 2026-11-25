"use client";
// =============================================================================
// solo/page.tsx — single player ("/solo"): pick a time limit and play.
//
// This file only decides WHICH screen to show. All the rules live in
// lib/game (pure logic) and are wired together by the useGame hook.
//
//   loading / error -> waiting for the word lists
//   "setup"         -> pick a time limit
//   "playing"       -> streak, letters, countdown bar, answer box
//   "over"          -> final streak, reason, high scores, play again / home
//
// "use client" = this component runs in the browser, which we need because
// it uses React hooks and downloads the word lists with fetch().
// =============================================================================

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GameOver } from "@/components/GameOver";
import { PlayingScreen } from "@/components/PlayingScreen";
import { TimeLimitPicker } from "@/components/TimeLimitPicker";
import { BackLink, ScreenHeader, SectionHeading } from "@/components/ui";
import { useGame } from "@/hooks/useGame";
import { useHighScores } from "@/hooks/useHighScores";
import { useWordData } from "@/hooks/useWordData";
import { TIME_LIMITS, type TimeLimit } from "@/lib/game/config";
import { type HighScoreEntry, bestFor, insertScore, rankFor } from "@/lib/game/highScores";

export default function SoloPage() {
  const router = useRouter();
  const { data, loading, error } = useWordData();
  const { state, secondsLeft, start, submit, reset, exampleWords } = useGame(data);

  // Next.js keeps this page alive (hidden) when you navigate away, so its
  // state would otherwise still be there when you come back: e.g. the old
  // game-over screen. This cleanup runs whenever the page is hidden and
  // resets the game, so "Play solo" always opens on the time options.
  // (useLayoutEffect: the reset happens before the page is hidden, so the
  // old screen never flashes on the way back.)
  useLayoutEffect(() => reset, [reset]);
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
    <AppShell>
      {/* --- Word lists still downloading, or failed --- */}
      {loading && <p className="text-zinc-500">Loading word lists…</p>}
      {error && <p className="text-red-600">Could not load the word lists: {error}</p>}

      {/* --- Setup: choose a time limit --- */}
      {data && state.phase === "setup" && (
        <section className="flex flex-col items-center gap-8 text-center">
          <ScreenHeader title="Play solo" subtitle="How long do you want for each word? Fewer seconds, more pressure." />
          <div className="flex flex-col items-center gap-3">
            <SectionHeading>Seconds per word</SectionHeading>
            <TimeLimitPicker onPick={startGame} selected={state.timeLimit} />
            {bestPerMode && <p className="text-sm text-zinc-500 tabular-nums">Best — {bestPerMode}</p>}
          </div>
          <BackLink />
        </section>
      )}

      {/* --- Playing --- */}
      {data && state.phase === "playing" && state.timeLimit && (
        <PlayingScreen
          state={state}
          secondsLeft={secondsLeft}
          onSubmit={submit}
          best={bestFor(boards, state.timeLimit)}
        />
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
          onHome={() => router.push("/")}
        />
      )}
    </AppShell>
  );
}
