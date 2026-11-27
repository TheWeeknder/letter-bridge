"use client";
// =============================================================================
// useCountdown.ts — a countdown timer that calls `onExpire` exactly once.
//
// HOW IT WORKS
// 1. When a round starts we compute a DEADLINE: "now + 5 seconds".
// 2. On every screen refresh (requestAnimationFrame, ~60 times a second) we
//    compare the clock with the deadline and update `secondsLeft`.
// 3. The first time the clock passes the deadline we call onExpire() and stop.
//
// WHY a deadline instead of "subtract 0.1 every 100ms": timers in browsers are
// not exact. setInterval(…, 100) might fire after 104ms, then 112ms… and the
// small errors add up ("drift"), so a "5 second" round could last 5.6s.
// Comparing against a fixed deadline is always exact, however late a tick is.
//
// WHY performance.now() instead of Date.now(): Date.now() follows the
// computer's wall clock, which can jump (e.g. when the clock syncs). The
// performance clock only ever moves forward at a steady pace.
//
// WHY `roundId`: whenever it changes the timer restarts with a fresh deadline.
// That's how every new letter pair gets its own full countdown.
// =============================================================================

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { computeDeadline, isPastDeadline, secondsLeftUntil } from "@/lib/game/timer";

export interface UseCountdownOptions {
  seconds: number; // length of the countdown
  roundId: number; // change this to restart the timer
  running: boolean; // false = stopped (e.g. on the game-over screen)
  onExpire: () => void; // called once when time runs out
}

export interface UseCountdownResult {
  /** Seconds left, e.g. 3.42 (for display). */
  secondsLeft: number;
  /**
   * Ask "is time up RIGHT NOW?". The game loop calls this when an answer is
   * submitted, so an answer typed after the deadline is never accepted, even
   * if the screen hasn't refreshed yet.
   */
  isTimeUp: () => boolean;
}

export function useCountdown({
  seconds,
  roundId,
  running,
  onExpire,
}: UseCountdownOptions): UseCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState(seconds);

  // A NEW timer (roundId changed): show the full time straight away, even
  // before it starts running (e.g. during the 3 · 2 · 1), instead of the
  // last game's leftover "0.0s". React allows setting state during render
  // like this when it only depends on a prop change ("adjusting state when a
  // prop changes"); it re-renders immediately, before anything is painted.
  const [timerFor, setTimerFor] = useState(roundId);
  if (timerFor !== roundId) {
    setTimerFor(roundId);
    setSecondsLeft(seconds);
  }

  // The current deadline. A ref (not state) because changing it shouldn't
  // re-render anything; it's just a number we look up.
  const deadlineRef = useRef<number | null>(null);

  // useEffectEvent wraps onExpire so the effect below always calls the LATEST
  // version of it, without restarting the timer every time the parent
  // component re-renders and passes a "new" function.
  const fireExpire = useEffectEvent(() => onExpire());

  useEffect(() => {
    if (!running) {
      deadlineRef.current = null; // stopped: no deadline
      return;
    }

    // --- 1. Fresh deadline for this round ---
    const deadline = computeDeadline(performance.now(), seconds);
    deadlineRef.current = deadline;
    let frameId = 0;

    // --- 2. Runs on every screen refresh ---
    const tick = () => {
      const now = performance.now();
      setSecondsLeft(secondsLeftUntil(deadline, now));

      if (isPastDeadline(deadline, now)) {
        fireExpire(); // --- 3. Time's up: tell the game, and stop ticking ---
      } else {
        frameId = requestAnimationFrame(tick); // ask for the next frame
      }
    };
    frameId = requestAnimationFrame(tick);

    // Cleanup: runs when the round changes, the timer stops, or the component
    // disappears. Cancelling the pending frame stops the old loop, so two
    // timers can never run at once.
    return () => cancelAnimationFrame(frameId);
  }, [seconds, roundId, running]);

  // useCallback keeps the same function between renders (it only reads a ref).
  const isTimeUp = useCallback(
    () => deadlineRef.current !== null && isPastDeadline(deadlineRef.current, performance.now()),
    [],
  );

  return { secondsLeft, isTimeUp };
}
