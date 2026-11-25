"use client";
// =============================================================================
// AnswerInput — the text box. Pressing Enter submits the answer.
//
// The parent renders it with `key={roundId}`. When the round changes, React
// replaces it with a brand-new input, which is automatically empty and
// focused (autoFocus). No extra "clear the box" code needed.
// =============================================================================

import { useState } from "react";

export interface AnswerInputProps {
  onSubmit: (text: string) => void;
}

export function AnswerInput({ onSubmit }: AnswerInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    // Pressing Enter on an empty box does nothing. Losing the game because of
    // an accidental key press would feel unfair.
    if (text.trim() === "") return;
    onSubmit(text);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        // Phones would otherwise capitalise, autocorrect or underline words.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Your word"
        placeholder="Type a word, press Enter"
        className="w-full rounded-lg border-2 border-zinc-300 bg-transparent px-4 py-3 text-center text-2xl outline-none focus:border-emerald-500 dark:border-zinc-700"
      />
    </form>
  );
}
