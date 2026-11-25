"use client";
// =============================================================================
// GameOver — final streak, why the game ended, example words, and two ways
// to continue: play again with the same time, or choose a different time.
//
// ANIMATIONS (skipped if the player turned on "reduce motion"):
// - The reason sentence SHAKES side to side for wrong answers, like a head
//   shaking "no". Timeouts don't shake: you didn't type anything wrong.
// - "New best!" / "New high score! #3" pops in when the game made the board.
// =============================================================================

import { motion, useReducedMotion } from "motion/react";
import type { TimeLimit } from "@/lib/game/config";
import { displayEnd, displayStart } from "@/lib/game/display";
import type { HighScoreEntry } from "@/lib/game/highScores";
import type { GameOverReason, LetterPair } from "@/lib/game/types";
import { explainGameOver } from "@/lib/game/validator";
import { HighScoreBoard } from "./HighScoreBoard";
import { SHAKE_DURATION, SHAKE_X } from "./shake";

export interface GameOverProps {
  streak: number;
  board: HighScoreEntry[]; // this time limit's board, already including this game
  rank: number | null; // this game's place on the board (1 = new best), or null
  reason: GameOverReason;
  lastInput: string | null;
  pair: LetterPair;
  timeLimit: TimeLimit;
  exampleWords: string[];
  onPlayAgain: () => void; // same time limit, start immediately
  onChangeTime: () => void; // back to the time-limit screen
}

export function GameOver({
  streak,
  board,
  rank,
  reason,
  lastInput,
  pair,
  timeLimit,
  exampleWords,
  onPlayAgain,
  onChangeTime,
}: GameOverProps) {
  const reduceMotion = useReducedMotion();
  const shouldShake = !reduceMotion && reason !== "TIMEOUT";

  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <h2 className="text-3xl font-bold">Game over</h2>

      {/* The final score */}
      <div>
        <div className="text-xs tracking-wide text-zinc-500 uppercase">Final streak</div>
        <div className="text-6xl font-bold tabular-nums">{streak}</div>
        {rank !== null ? (
          <motion.div
            className="mt-1 font-bold text-emerald-600 dark:text-emerald-400"
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
          >
            {rank === 1 ? "New best!" : `New high score! #${rank}`}
          </motion.div>
        ) : (
          <div className="mt-1 text-sm text-zinc-500 tabular-nums">
            Best: {Math.max(board[0]?.streak ?? 0, streak)}
          </div>
        )}
      </div>

      {/* Why it ended, e.g. "'aeioue' isn't in the dictionary." */}
      <motion.p
        className="text-lg text-red-600 dark:text-red-400"
        animate={shouldShake ? { x: SHAKE_X } : undefined}
        transition={{ duration: SHAKE_DURATION }}
      >
        {explainGameOver(reason, lastInput, pair)}
      </motion.p>

      <HighScoreBoard board={board} timeLimit={timeLimit} highlightIndex={rank === null ? null : rank - 1} />

      {/* Words that would have worked for the last pair */}
      {exampleWords.length > 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          For <strong>{displayStart(pair)}</strong> … <strong>{displayEnd(pair)}</strong> you could have tried:{" "}
          {exampleWords.map((word, i) => (
            <span key={word}>
              {i > 0 && " or "}
              <strong className="text-foreground">{word}</strong>
            </span>
          ))}
        </p>
      )}

      {/* What next? flex-wrap lets the buttons stack on very narrow phones. */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={onPlayAgain}
          className="min-h-12 rounded-lg bg-emerald-500 px-5 py-3 font-bold text-white hover:bg-emerald-600"
        >
          Play again ({timeLimit}s)
        </button>
        <button
          onClick={onChangeTime}
          className="min-h-12 rounded-lg border-2 border-zinc-300 px-5 py-3 font-bold hover:border-emerald-500 dark:border-zinc-700"
        >
          Home
        </button>
      </div>
    </section>
  );
}
