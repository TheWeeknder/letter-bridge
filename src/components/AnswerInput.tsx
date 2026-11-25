"use client";
// =============================================================================
// AnswerInput — the text box. Pressing Enter submits the answer.
//
// The parent renders it with `key={roundId}`. When the round changes, React
// replaces it with a brand-new input, which is automatically empty and
// focused (autoFocus). No extra "clear the box" code needed.
//
// WARNINGS: if the player types a word that's too short or already used,
// the game doesn't end. Instead the parent passes a `warning` and a new `shakeKey`:
//   - the box shakes (like a head shaking "no") and turns red
//   - the warning text appears underneath
//   - the box is cleared, ready for another try
// =============================================================================

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { SHAKE_DURATION, SHAKE_X } from "./shake";

export interface AnswerInputProps {
  onSubmit: (text: string) => void;
  warning?: string | null; // e.g. "'ab' is too short. Use at least 3 letters!"
  shakeKey?: number; // changes every time the box should shake again
}

export function AnswerInput({ onSubmit, warning = null, shakeKey = 0 }: AnswerInputProps) {
  const [text, setText] = useState("");

  // useAnimate gives us a `scope` (attach it to an element) and an `animate`
  // function to run an animation on that element whenever WE decide, instead
  // of when a prop changes. Perfect for "shake now!".
  const [scope, animate] = useAnimate<HTMLInputElement>();
  const reduceMotion = useReducedMotion();

  // Shake every time shakeKey changes (but not on the first render, and not
  // for players who turned on "reduce motion"; the red border and message
  // still tell them what happened).
  useEffect(() => {
    if (shakeKey === 0 || !warning || reduceMotion) return;
    animate(scope.current, { x: SHAKE_X }, { duration: SHAKE_DURATION });
  }, [shakeKey, warning, reduceMotion, animate, scope]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    // Pressing Enter on an empty box does nothing. Losing the game because of
    // an accidental key press would feel unfair.
    if (text.trim() === "") return;
    onSubmit(text);
    // Empty the box after every answer. Correct answers and game overs replace
    // this component anyway; for a repeated word it means the player can type
    // a new word straight away without deleting the old one.
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-2">
      <input
        ref={scope}
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        // Phones would otherwise capitalise, autocorrect or underline words.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        // The phone keyboard's Enter key says "Go" instead of a return arrow.
        enterKeyHint="go"
        aria-label="Your word"
        // Links the box to the warning, so screen readers read it as a hint.
        aria-describedby={warning ? "answer-warning" : undefined}
        aria-invalid={warning ? true : undefined}
        placeholder="Type a word, press Enter"
        className={
          "w-full rounded-lg border-2 bg-transparent px-4 py-3 text-center text-2xl outline-none " +
          (warning
            ? "border-red-500 focus:border-red-500"
            : "border-zinc-300 focus:border-emerald-500 dark:border-zinc-700")
        }
      />
      {/* role="status": screen readers announce the warning when it appears. */}
      <p id="answer-warning" role="status" className="min-h-6 text-red-600 dark:text-red-400">
        {warning}
      </p>
    </form>
  );
}
