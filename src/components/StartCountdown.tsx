"use client";
// =============================================================================
// StartCountdown — the full-screen "3 · 2 · 1" shown before every game.
// While it runs it is the ONLY thing on the screen (no score, letters or
// timer); when it's over PlayingScreen swaps in the game.
//
// WHY: starting the clock the instant you pick a mode felt abrupt. Three
// seconds to get ready makes the start fair, and the letters stay hidden
// until it's over, so nobody can peek and think ahead.
//
// HOW: `endsAt` is the moment play begins (Date.now() ms; in multiplayer it
// comes from the room server so everyone ends together). Every screen refresh
// we work out the whole seconds left (3, 2, 1). The game itself is started by
// useGame at the same moment; this component only draws the number.
//
// ANIMATION (motion/react): the old number shrinks away quickly, then the new
// one pops in big and settles with a spring. Players who turned on "reduce
// motion" get a plain swap instead.
// =============================================================================

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { START_COUNTDOWN_SECONDS } from "@/lib/game/config";

/** The whole seconds still to show at `now` (3, 2, 1), never below 1. */
function numberAt(endsAt: number, now: number): number {
  const seconds = Math.ceil((endsAt - now) / 1000);
  return Math.min(START_COUNTDOWN_SECONDS, Math.max(1, seconds));
}

export interface StartCountdownProps {
  endsAt: number; // when play begins (Date.now() ms)
  label?: string; // shown under the number, e.g. "30s sprint"
}

export function StartCountdown({ endsAt, label }: StartCountdownProps) {
  const reduceMotion = useReducedMotion();
  const [number, setNumber] = useState(() => numberAt(endsAt, Date.now()));

  // Check the clock on every screen refresh. setNumber with the same value
  // doesn't re-render, so this is cheap.
  useEffect(() => {
    let frameId = 0;
    const tick = () => {
      setNumber(numberAt(endsAt, Date.now()));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [endsAt]);

  return (
    // flex-1 + justify-center: fills the whole screen area, number in the middle.
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4">
      <div
        // A fixed-size box so the words above and below don't move while the
        // numbers change size during the animation.
        className="relative flex h-countdown w-full items-center justify-center"
        // Screen readers announce each number as it changes.
        role="status"
        aria-live="assertive"
        aria-label={`Starting in ${number}`}
      >
        {/* AnimatePresence lets the old number animate OUT before it's
            removed. mode="wait": the old one shrinks away quickly (0.15s),
            THEN the new one pops in, so two numbers never overlap. */}
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={number}
            className="font-display text-countdown text-accent-text tabular-nums"
            initial={reduceMotion ? false : { scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { scale: 0.5, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
            }
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            aria-hidden
          >
            {number}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
