// =============================================================================
// timer.ts — the pure maths behind the countdown (no React, no real clock).
//
// WHY separate: the React hook (hooks/useCountdown.ts) deals with browser
// details like animation frames. The actual calculation "how much time is
// left?" lives here, where tests can call it with made-up times.
//
// All times are in MILLISECONDS from performance.now() (see useCountdown.ts).
// =============================================================================

/** When does a countdown that starts at `startMs` and lasts `seconds` end? */
export function computeDeadline(startMs: number, seconds: number): number {
  return startMs + seconds * 1000;
}

/**
 * Seconds left until `deadlineMs`, never below 0.
 * Example: deadline 5000, now 3500 -> 1.5 seconds left.
 */
export function secondsLeftUntil(deadlineMs: number, nowMs: number): number {
  return Math.max(0, (deadlineMs - nowMs) / 1000);
}

/** Has the deadline been reached? (Exactly at the deadline counts as "yes".) */
export function isPastDeadline(deadlineMs: number, nowMs: number): boolean {
  return nowMs >= deadlineMs;
}
