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
//
// RESUMING: a sprint picked up after a reload has less than the full time
// left. `total` is the full length, so the bar starts part-empty
// (seconds / total) and shrinks from there.
//
// RED WARNING: in the last 30% of the time the bar turns red. Changing the
// colour class doesn't restart the animation, because `key` stays the same.
// =============================================================================

import { motion } from "motion/react";

/** Below this fraction of time left, the bar turns red (0.3 = last 30%). */
const DANGER_FRACTION = 0.3;

export interface CountdownBarProps {
  seconds: number; // how long this countdown runs
  total?: number; // the full length, if more than `seconds` (a resumed sprint); defaults to `seconds`
  roundId: number; // when this changes, the bar resets
  running: boolean; // false = freeze the bar where it is
  secondsLeft: number; // used to freeze the bar at the right spot when stopped
}

export function CountdownBar({ seconds, total = seconds, roundId, running, secondsLeft }: CountdownBarProps) {
  // What fraction of the bar should be filled when it's frozen (0 to 1).
  const frozenFraction = total > 0 ? secondsLeft / total : 0;
  // Where the bar starts: full, or part-empty for a resumed sprint.
  const startFraction = total > 0 ? Math.min(1, seconds / total) : 0;
  const inDanger = frozenFraction <= DANGER_FRACTION;

  return (
    // The grey "track" behind the bar.
    <div
      className="h-3 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-label="Time left"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.ceil(secondsLeft)}
    >
      <motion.div
        key={roundId}
        className={
          "h-full origin-left rounded-full transition-colors duration-300 " +
          (inDanger ? "bg-danger" : "bg-accent")
        }
        initial={{ scaleX: startFraction }}
        animate={{ scaleX: running ? 0 : frozenFraction }}
        transition={running ? { duration: seconds, ease: "linear" } : { duration: 0 }}
      />
    </div>
  );
}
