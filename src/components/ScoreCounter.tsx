"use client";
// =============================================================================
// ScoreCounter — the score while you play: your POINTS (one per letter of
// every accepted word, see lib/game/scoring.ts), with a small line underneath
// for how many words you've found and your best.
//
// Two little animations every time a word is accepted:
// - the number "pops": `key={points}` gives it a new identity whenever the
//   points change, so React creates a fresh element that starts at 1.4x size
//   and springs back to normal;
// - a small emerald "+11" floats up next to it and fades, so you learn the
//   rule as you play (longer words = more points). `key={words}` restarts it
//   for each new word.
//
// useReducedMotion(): some people turn on "reduce motion" in their phone or
// computer settings (animations can cause dizziness). We respect that and
// skip both animations for them.
// =============================================================================

import { motion, useReducedMotion } from "motion/react";

export interface ScoreCounterProps {
  points: number;
  words: number; // how many words have been accepted
  wordsText: string; // e.g. "4 words" (Sprint) or "Streak 4" (see wordCountLabel)
  lastWordPoints?: number; // points for the word just accepted (shows the "+N")
  best?: number; // best saved points for this mode (left out = no "Best")
}

export function ScoreCounter({ points, words, wordsText, lastWordPoints, best }: ScoreCounterProps) {
  const reduceMotion = useReducedMotion();
  const details = [wordsText, best !== undefined ? `Best: ${Math.max(best, points)}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      {/* Hidden on phones to save room above the keyboard; the big number
          and the "+N" make it obvious what it is. */}
      <div className="text-sm text-muted compact:hidden">Points</div>
      <div className="relative">
        <motion.div
          key={points}
          className="text-4xl font-bold tabular-nums compact:text-3xl tight:text-2xl"
          // No pop on the very first render of a game (0 points).
          // `false` = start at the final size, no animation.
          initial={reduceMotion || points === 0 ? false : { scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          {points}
        </motion.div>
        {/* "+11": floats up beside the number and fades away. */}
        {!reduceMotion && words > 0 && lastWordPoints !== undefined && (
          <motion.span
            key={words}
            className="absolute top-0 left-full ml-2 font-bold text-accent-text tabular-nums"
            initial={{ opacity: 1, y: 4 }}
            animate={{ opacity: 0, y: -18 }}
            transition={{ duration: 1, ease: "easeOut" }}
            aria-hidden
          >
            +{lastWordPoints}
          </motion.span>
        )}
      </div>
      <div className="text-sm text-muted tabular-nums">{details}</div>
    </div>
  );
}
