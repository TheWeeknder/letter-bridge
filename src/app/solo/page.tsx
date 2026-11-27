"use client";
// =============================================================================
// solo/page.tsx — single player ("/solo"): pick a mode and play.
//
// This file only decides WHICH screen to show. All the rules live in
// lib/game (pure logic) and are wired together by the useGame hook.
//
//   loading / error -> waiting for the word lists
//   "setup"         -> pick a mode: Streak (10s/5s/3s per word) or Sprint (30s)
//   "playing"       -> score, letters, countdown bar, answer box
//   "over"          -> final points, reason, high scores, play again / home
//
// "use client" = this component runs in the browser, which we need because
// it uses React hooks and downloads the word lists with fetch().
// =============================================================================

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GameOver } from "@/components/GameOver";
import { PlayingScreen } from "@/components/PlayingScreen";
import { ModePicker } from "@/components/ModePicker";
import { BackLink, ScreenHeader } from "@/components/ui";
import { useGame } from "@/hooks/useGame";
import { useHighScores } from "@/hooks/useHighScores";
import { useWordData } from "@/hooks/useWordData";
import { type HighScoreEntry, bestFor, insertScore, rankFor } from "@/lib/game/highScores";
import { GAME_MODES, type GameMode } from "@/lib/game/modes";
import { scoreFor } from "@/lib/game/scoring";

export default function SoloPage() {
  const router = useRouter();
  const { data, loading, error } = useWordData();
  const { state, secondsLeft, startsAt, start, submit, reset, exampleWords } = useGame(data);

  // Next.js keeps this page alive (hidden) when you navigate away, so its
  // state would otherwise still be there when you come back: e.g. the old
  // game-over screen. This cleanup runs whenever the page is hidden and
  // resets the game, so "Play solo" always opens on the mode options.
  // (useLayoutEffect: the reset happens before the page is hidden, so the
  // old screen never flashes on the way back.)
  useLayoutEffect(() => reset, [reset]);
  const { boards, save } = useHighScores();

  // --- High scores -----------------------------------------------------------
  // This mode's board as it was when the game STARTED. The saved board
  // changes the moment the game ends, but the rank ("New high score! #2") and
  // the board on the game-over screen are worked out from the OLD one, so
  // they're right on the very first render.
  const [boardBeforeGame, setBoardBeforeGame] = useState<HighScoreEntry[]>([]);

  /** Start a game, remembering the board from before it. */
  function startGame(mode: GameMode) {
    setBoardBeforeGame(boards[mode]);
    start(mode);
  }

  // Only meaningful once the game is over: this game's points, its place on
  // the board (or null) and the board including it.
  const points = scoreFor(state.usedWords);
  const rank = rankFor(boardBeforeGame, points);
  const shownBoard =
    rank === null ? boardBeforeGame : insertScore(boardBeforeGame, { streak: state.streak, words: state.usedWords });

  // The game-over screen's "Play again" reuses the last mode. It only
  // renders when mode is set, so the fallback never actually runs.
  const lastMode = state.mode;
  function playAgain() {
    if (lastMode) startGame(lastMode);
  }

  // When a game ends (by a wrong answer OR the timer), save it if it made the
  // board. An effect is the one place that sees both ways a game can end.
  // The ref remembers which game (roundId) was already handled, so a game is
  // never added twice, e.g. when React runs the effect again.
  const handledRoundRef = useRef<number | null>(null);
  useEffect(() => {
    if (state.phase !== "over" || !state.mode) return;
    if (handledRoundRef.current === state.roundId) return;
    handledRoundRef.current = state.roundId;
    if (rankFor(boardBeforeGame, scoreFor(state.usedWords)) === null) return; // didn't make the board
    save(state.mode, { streak: state.streak, words: state.usedWords });
  }, [state.phase, state.roundId, state.mode, state.streak, state.usedWords, boardBeforeGame, save]);

  // Setup screen: the best score for every mode (the picker shows the ones above 0).
  const bests = Object.fromEntries(GAME_MODES.map((mode) => [mode, bestFor(boards, mode)]));

  return (
    <AppShell>
      {/* --- Word lists still downloading, or failed --- */}
      {loading && <p className="text-muted">Loading word lists…</p>}
      {error && <p className="text-danger">Could not load the word lists: {error}</p>}

      {/* --- Setup: choose a mode --- */}
      {data && state.phase === "setup" && (
        <section className="flex flex-col items-center gap-8 text-center">
          <ScreenHeader title="Play solo" subtitle="Pick how you want to play. Tap one to start." />
          <ModePicker onPick={startGame} selected={state.mode} bests={bests} />
          <BackLink />
        </section>
      )}

      {/* --- The 3 · 2 · 1, then playing (same screen, see PlayingScreen) --- */}
      {data && (state.phase === "countdown" || state.phase === "playing") && state.mode && (
        <PlayingScreen
          state={state}
          secondsLeft={secondsLeft}
          countdownEndsAt={startsAt}
          onSubmit={submit}
          best={bestFor(boards, state.mode)}
        />
      )}

      {/* --- Game over --- */}
      {data && state.phase === "over" && state.pair && state.gameOverReason && state.mode && (
        <GameOver
          words={state.usedWords}
          board={shownBoard}
          rank={rank}
          reason={state.gameOverReason}
          lastInput={state.lastInput}
          pair={state.pair}
          mode={state.mode}
          exampleWords={exampleWords}
          onPlayAgain={playAgain}
          onHome={() => router.push("/")}
        />
      )}
    </AppShell>
  );
}
