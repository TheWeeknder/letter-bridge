"use client";
// =============================================================================
// CountdownBar — a bar that shrinks from full to empty over `seconds`,
// animated with Framer Motion (the `motion` package).
//
// NOTE: the bar is only VISUAL. The real "time's up" decision is made by the
// useCountdown hook, so a laggy animation can never give the player extra time.
//
// HOW THE ANIMATION WORKS
// - `key={roundId}`: when the round changes, React throws away the old bar and
//   creates a new one, so the animation restarts from full.
// - `initial={{ scaleX: 1 }}` -> `animate={{ scaleX: 0 }}`: shrink from 100%
//   wide to 0% wide, at a constant speed (`ease: "linear"`) over `seconds`.
// - We animate scaleX (a "transform") rather than width: the browser can do
//   transforms on the graphics card without recalculating the page layout,
//   so the bar stays smooth even on slow devices.
// - `origin-left` makes it shrink towards the left edge instead of the middle.
// =============================================================================

import { motion } from "motion/react";

export interface CountdownBarProps {
  seconds: number; // total length of the countdown
  roundId: number; // when this changes, the bar resets to full
  running: boolean; // false = freeze the bar where it is
  secondsLeft: number; // used to freeze the bar at the right spot when stopped
}

export function CountdownBar({ seconds, roundId, running, secondsLeft }: CountdownBarProps) {
  // What fraction of the bar should be filled when it's frozen (0 to 1).
  const frozenFraction = seconds > 0 ? secondsLeft / seconds : 0;

  return (
    // The grey "track" behind the bar.
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      role="progressbar"
      aria-label="Time left"
      aria-valuemin={0}
      aria-valuemax={seconds}
      aria-valuenow={Math.ceil(secondsLeft)}
    >
      <motion.div
        key={roundId}
        className="h-full origin-left rounded-full bg-emerald-500"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: running ? 0 : frozenFraction }}
        transition={running ? { duration: seconds, ease: "linear" } : { duration: 0 }}
      />
    </div>
  );
}
