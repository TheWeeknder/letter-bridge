"use client";
// =============================================================================
// AnswerInput — the text box. Pressing Enter (or "Go" on a phone keyboard)
// submits the answer. Phones use their own keyboard; the playing screen sits
// near the top on phones so the letters stay visible above it.
//
// ONE BOX FOR THE WHOLE GAME: the box stays on screen from the first pair to
// the last, and simply empties itself after every answer. We deliberately do
// NOT swap in a new box for each pair: on iPhones, removing the box that has
// focus closes the keyboard, so it would drop after every correct word.
//
// LOCKED: during the 3 · 2 · 1 the box is already there (invisible, so the
// phone keyboard can open early) but ignores typing and Enter. It is NOT
// `disabled`: a disabled box loses focus, which would close the keyboard.
//
// WARNINGS: if the player types a word that's too short or already used,
// the game doesn't end. Instead the parent passes a `warning` and a new `shakeKey`:
//   - the box shakes (like a head shaking "no") and turns red
//   - the warning text appears underneath
//   - the box is cleared, ready for another try
// =============================================================================

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MAX_ANSWER_LENGTH } from "@/lib/game/config";
import { SHAKE_DURATION, SHAKE_X } from "./shake";
import { INPUT_BASE, INPUT_BORDER } from "./ui";

export interface AnswerInputProps {
  onSubmit: (text: string) => void;
  warning?: string | null; // e.g. "'ab' is too short. Use at least 3 letters!"
  shakeKey?: number; // changes every time the box should shake again
  locked?: boolean; // true = ignore typing and Enter (the 3 · 2 · 1 before a game)
}

export function AnswerInput({ onSubmit, warning = null, shakeKey = 0, locked = false }: AnswerInputProps) {
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
    if (locked) return; // the game hasn't started yet
    // Pressing Enter on an empty box does nothing. Losing the game because of
    // an accidental key press would feel unfair.
    if (text.trim() === "") return;
    onSubmit(text);
    // Empty the box after every answer, right or wrong, so the next word can
    // be typed straight away (and the same box keeps focus, see above).
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-2">
      <input
        ref={scope}
        value={text}
        onChange={(e) => {
          if (!locked) setText(e.target.value); // locked: the letters just don't appear
        }}
        autoFocus
        maxLength={MAX_ANSWER_LENGTH}
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
        placeholder="Type a word"
        // text-2xl = 24px. Keep it 16px or bigger: iPhones zoom the whole page
        // in when you tap a text box with smaller text.
        className={`${INPUT_BASE} py-3 text-2xl compact:py-1.5 ${warning ? INPUT_BORDER.invalid : INPUT_BORDER.normal}`}
      />
      {/* role="status": screen readers announce the warning when it appears. */}
      <p id="answer-warning" role="status" className="min-h-6 text-danger">
        {warning}
      </p>
    </form>
  );
}
