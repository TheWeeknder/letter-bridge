"use client";
// =============================================================================
// GameOver — why the game ended, the final score, the high score board,
// example words, and two ways to continue: play again in the same mode, or
// go back home (to pick a different mode or play with friends).
//
// The big number is the POINTS (one per letter of every accepted word), with
// the word count and the longest word underneath.
// Streak: "Game over" + why (wrong word or time's up).
// Sprint: only the clock ends a sprint, so just "Time's up!".
//
// ANIMATIONS (skipped if the player turned on "reduce motion"):
// - The reason sentence SHAKES side to side for wrong answers, like a head
//   shaking "no". Timeouts don't shake: you didn't type anything wrong.
// - "New best!" / "New high score! #3" pops in when the game made the board.
// =============================================================================

import { motion, useReducedMotion } from "motion/react";
import { type HighScoreEntry, entryPoints } from "@/lib/game/highScores";
import { type GameMode, isSprint, modeLabel, wordCountLabel } from "@/lib/game/modes";
import { longestWord, scoreFor } from "@/lib/game/scoring";
import type { GameOverReason, LetterPair } from "@/lib/game/types";
import { explainGameOver } from "@/lib/game/validator";
import { HighScoreBoard } from "./HighScoreBoard";
import { SHAKE_DURATION, SHAKE_X } from "./shake";
import { Button, ScreenHeader } from "./ui";

export interface GameOverProps {
  words: string[]; // the words accepted this game (the points come from these)
  board: HighScoreEntry[]; // this mode's board, already including this game
  rank: number | null; // this game's place on the board (1 = new best), or null
  reason: GameOverReason;
  lastInput: string | null;
  pair: LetterPair;
  mode: GameMode;
  exampleWords: string[];
  onPlayAgain: () => void; // same mode, start immediately
  onHome: () => void; // back to the landing page
}

export function GameOver({
  words,
  board,
  rank,
  reason,
  lastInput,
  pair,
  mode,
  exampleWords,
  onPlayAgain,
  onHome,
}: GameOverProps) {
  const reduceMotion = useReducedMotion();
  const shouldShake = !reduceMotion && reason !== "TIMEOUT";
  const sprint = isSprint(mode);
  const points = scoreFor(words);
  const longest = longestWord(words);
  const best = Math.max(board[0] ? entryPoints(board[0]) : 0, points);

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      {/* 1. What happened. The reason shakes for wrong answers. */}
      <ScreenHeader
        title={sprint ? "Time's up!" : "Game over"}
        subtitle={
          // A sprint always ends the same way, so the big number below says it all.
          sprint ? undefined : (
            <motion.span
              className="inline-block"
              animate={shouldShake ? { x: SHAKE_X } : undefined}
              transition={{ duration: SHAKE_DURATION }}
            >
              {explainGameOver(reason, lastInput, pair)}
            </motion.span>
          )
        }
      />

      {/* 2. The score: the one big thing on this screen. */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-7xl leading-none font-bold tabular-nums">{points}</div>
        <div className="text-sm text-muted">Points</div>
        <div className="text-sm text-muted">
          {wordCountLabel(mode, words.length)}
          {longest && (
            <>
              {" "}
              · longest: <strong className="text-foreground">{longest}</strong>
            </>
          )}
        </div>
        {rank !== null ? (
          <motion.div
            className="mt-2 font-bold text-accent-text"
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
          >
            {rank === 1 ? "New best!" : `New high score! #${rank}`}
          </motion.div>
        ) : (
          <div className="mt-2 text-sm text-muted tabular-nums">
            Best: {best}
          </div>
        )}
      </div>

      {/* 3. High scores and 4. words that would have worked */}
      {(board.length > 0 || exampleWords.length > 0) && (
        <div className="flex w-full flex-col items-center gap-4">
          <HighScoreBoard board={board} mode={mode} highlightIndex={rank === null ? null : rank - 1} />
          {exampleWords.length > 0 && (
            <p className="text-sm text-muted">
              You could have tried:{" "}
              {exampleWords.map((word, i) => (
                <span key={word}>
                  {i > 0 && " · "}
                  <strong className="text-foreground">{word}</strong>
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {/* 5. What next? Stacked full-width buttons are easy to tap on a phone. */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button onClick={onPlayAgain}>Play again ({modeLabel(mode)})</Button>
        <Button variant="secondary" onClick={onHome}>
          Home
        </Button>
      </div>
    </section>
  );
}
