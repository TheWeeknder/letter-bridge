"use client";
// =============================================================================
// GameOver — final streak, why the game ended, example words, and two ways
// to continue: play again with the same time, or choose a different time.
//
// ANIMATIONS (skipped if the player turned on "reduce motion"):
// - The reason sentence SHAKES side to side for wrong answers, like a head
//   shaking "no". Timeouts don't shake: you didn't type anything wrong.
// - "New best!" pops in when you beat your record.
// =============================================================================

import { motion, useReducedMotion } from "motion/react";
import type { TimeLimit } from "@/lib/game/config";
import type { GameOverReason, LetterPair } from "@/lib/game/types";
import { explainGameOver } from "@/lib/game/validator";

export interface GameOverProps {
  streak: number;
  best: number; // the record, already including this game
  isNewBest: boolean; // did this game beat the previous record?
  reason: GameOverReason;
  lastInput: string | null;
  pair: LetterPair;
  timeLimit: TimeLimit;
  exampleWords: string[];
  onPlayAgain: () => void; // same time limit, start immediately
  onChangeTime: () => void; // back to the time-limit screen
}

// Shake keyframes: move left/right by a few pixels, getting smaller, then
// stop in the middle. Motion plays the list in order.
const SHAKE_X = [0, -10, 10, -8, 8, -4, 4, 0];

export function GameOver({
  streak,
  best,
  isNewBest,
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
        {isNewBest ? (
          <motion.div
            className="mt-1 font-bold text-emerald-600 dark:text-emerald-400"
            initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
          >
            New best!
          </motion.div>
        ) : (
          <div className="mt-1 text-sm text-zinc-500 tabular-nums">Best: {best}</div>
        )}
      </div>

      {/* Why it ended, e.g. "'aeioue' isn't in the dictionary." */}
      <motion.p
        className="text-lg text-red-600 dark:text-red-400"
        animate={shouldShake ? { x: SHAKE_X } : undefined}
        transition={{ duration: 0.4 }}
      >
        {explainGameOver(reason, lastInput, pair)}
      </motion.p>

      {/* Words that would have worked for the last pair */}
      {exampleWords.length > 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          For <strong>{pair.start.toUpperCase()}</strong> … <strong>{pair.end}</strong> you could have tried:{" "}
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
