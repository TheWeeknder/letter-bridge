"use client";
// =============================================================================
// LetterPair — shows the START letter (uppercase) and END letter (lowercase).
//
// Two things make look-alike letters (uppercase "I" vs lowercase "l")
// impossible to mix up:
//   1. The app font (Atkinson Hyperlegible Next, see layout.tsx) draws them
//      differently: "I" has bars top and bottom, "l" has a curved tail.
//   2. Each letter has a small label underneath ("starts with" / "ends with"),
//      so even without the font you always know which is which.
// =============================================================================

import type { LetterPair as LetterPairType } from "@/lib/game/types";

export interface LetterPairProps {
  pair: LetterPairType;
}

/** One big letter with a small caption below it. */
function LetterBox({ letter, caption }: { letter: string; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-7xl leading-none font-bold">{letter}</span>
      <span className="text-xs tracking-wide text-zinc-500 uppercase">{caption}</span>
    </div>
  );
}

export function LetterPair({ pair }: LetterPairProps) {
  return (
    // aria-label gives screen readers a clear sentence instead of "I dot dot dot l".
    <div
      className="flex items-start gap-6"
      aria-label={`Starts with ${pair.start.toUpperCase()}, ends with lowercase ${pair.end}`}
    >
      <LetterBox letter={pair.start.toUpperCase()} caption="starts with" />
      <span className="text-5xl leading-[4.5rem] text-zinc-400" aria-hidden>
        …
      </span>
      <LetterBox letter={pair.end.toLowerCase()} caption="ends with" />
    </div>
  );
}
