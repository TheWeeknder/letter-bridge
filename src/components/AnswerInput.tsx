"use client";
// =============================================================================
// AnswerInput — the text box. Pressing Enter submits the answer.
//
// ON PHONES AND TABLETS the phone's own keyboard would slide up over the
// page, so the box asks it not to open (inputMode="none") and the game shows
// its own keyboard underneath instead (OnScreenKeyboard). Its keys edit the
// same text, and its ENTER submits exactly like the real Enter key. The box
// is still a real <input>, so a physical keyboard, paste and screen readers
// keep working. Computers get no extra keys (see useTouchKeyboard).
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
import { useTouchKeyboard } from "@/hooks/useTouchKeyboard";
import { type KeyboardKey, applyKey } from "./keyboard";
import { OnScreenKeyboard } from "./OnScreenKeyboard";
import { SHAKE_DURATION, SHAKE_X } from "./shake";
import { INPUT_BASE, INPUT_BORDER } from "./ui";

export interface AnswerInputProps {
  onSubmit: (text: string) => void;
  warning?: string | null; // e.g. "'ab' is too short. Use at least 3 letters!"
  shakeKey?: number; // changes every time the box should shake again
  highlight?: string[]; // on-screen keyboard: letters to outline (the pair's start and end)
}

export function AnswerInput({
  onSubmit,
  warning = null,
  shakeKey = 0,
  highlight,
}: AnswerInputProps) {
  const [text, setText] = useState("");
  const touch = useTouchKeyboard();

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
    submit();
  }

  /** Send the answer (real Enter key, or the on-screen ENTER). */
  function submit() {
    // Pressing Enter on an empty box does nothing. Losing the game because of
    // an accidental key press would feel unfair.
    if (text.trim() === "") return;
    onSubmit(text);
    // Empty the box after every answer. Correct answers and game overs replace
    // this component anyway; for a repeated word it means the player can type
    // a new word straight away without deleting the old one.
    setText("");
  }

  /** A tap on the on-screen keyboard. */
  function handleKey(key: KeyboardKey) {
    if (key === "ENTER") submit();
    else setText((current) => applyKey(current, key));
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col items-center gap-2"
      >
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
          // Touch screens: don't open the phone's keyboard; ours is below.
          inputMode={touch ? "none" : undefined}
          aria-label="Your word"
          // Links the box to the warning, so screen readers read it as a hint.
          aria-describedby={warning ? "answer-warning" : undefined}
          aria-invalid={warning ? true : undefined}
          placeholder={touch ? "Type a word" : "Type a word, press Enter"}
          className={`${INPUT_BASE} py-3 text-2xl short:py-1.5 ${warning ? INPUT_BORDER.invalid : INPUT_BORDER.normal}`}
        />
        {/* role="status": screen readers announce the warning when it appears. */}
        <p id="answer-warning" role="status" className="min-h-6 text-danger">
          {warning}
        </p>
      </form>
      {/* A sibling of the form, so the playing screen can push it to the bottom. */}
      {touch && (
        <div className="mt-auto flex w-full justify-center">
          <OnScreenKeyboard onKey={handleKey} highlight={highlight} />
        </div>
      )}
    </>
  );
}
