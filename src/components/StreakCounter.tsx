"use client";
// =============================================================================
// StreakCounter — shows the current score (the streak, or in Sprint the words
// found), with a little "pop" every time it goes up, and the best underneath.
//
// HOW THE POP WORKS: `key={streak}` gives the number a new identity every
// time the streak changes, so React creates a fresh element. Its `initial`
// size is 1.4x, and it springs back to normal size (`animate`).
//
// useReducedMotion(): some people turn on "reduce motion" in their phone or
// computer settings (animations can cause dizziness). We respect that and
// skip the pop for them.
// =============================================================================

import { motion, useReducedMotion } from "motion/react";

export interface StreakCounterProps {
  streak: number;
  best?: number; // best saved score for this mode (left out = no "Best" line)
  label?: string; // what the number is: "Streak" (default) or "Words"
}

export function StreakCounter({ streak, best, label = "Streak" }: StreakCounterProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="text-sm text-zinc-500">{label}</div>
      <motion.div
        key={streak}
        className="text-4xl font-bold tabular-nums"
        // No pop on the very first render of a game (streak 0).
        // `false` = start at the final size, no animation.
        initial={reduceMotion || streak === 0 ? false : { scale: 1.4 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
      >
        {streak}
      </motion.div>
      {best !== undefined && <div className="text-sm text-zinc-500 tabular-nums">Best: {Math.max(best, streak)}</div>}
    </div>
  );
}
