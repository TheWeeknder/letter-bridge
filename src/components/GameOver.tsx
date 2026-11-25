"use client";
// =============================================================================
// GameOver — final streak, why the game ended, example words, and two ways
// to continue: play again with the same time, or choose a different time.
// =============================================================================

import type { TimeLimit } from "@/lib/game/config";
import type { GameOverReason, LetterPair } from "@/lib/game/types";
import { explainGameOver } from "@/lib/game/validator";

export interface GameOverProps {
  streak: number;
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
  reason,
  lastInput,
  pair,
  timeLimit,
  exampleWords,
  onPlayAgain,
  onChangeTime,
}: GameOverProps) {
  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <h2 className="text-3xl font-bold">Game over</h2>

      {/* The final score */}
      <div>
        <div className="text-xs tracking-wide text-zinc-500 uppercase">Final streak</div>
        <div className="text-6xl font-bold tabular-nums">{streak}</div>
      </div>

      {/* Why it ended, e.g. "'aeioue' isn't in the dictionary." */}
      <p className="text-lg text-red-600 dark:text-red-400">{explainGameOver(reason, lastInput, pair)}</p>

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

      {/* What next? */}
      <div className="flex gap-3">
        <button
          onClick={onPlayAgain}
          className="rounded-lg bg-emerald-500 px-5 py-3 font-bold text-white hover:bg-emerald-600"
        >
          Play again ({timeLimit}s)
        </button>
        <button
          onClick={onChangeTime}
          className="rounded-lg border-2 border-zinc-300 px-5 py-3 font-bold hover:border-emerald-500 dark:border-zinc-700"
        >
          Change time
        </button>
      </div>
    </section>
  );
}
