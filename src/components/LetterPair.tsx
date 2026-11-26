"use client";
// =============================================================================
// LetterPair — shows the START letter (uppercase) and END letter (lowercase),
// each in a big square tile. The letters are the "hero" of the playing
// screen: the biggest thing on it.
//
// Two things make look-alike letters (uppercase "I" vs lowercase "l")
// impossible to mix up:
//   1. The app font (Atkinson Hyperlegible Next, see layout.tsx) draws them
//      differently: "I" has bars top and bottom, "l" has a curved tail.
//   2. Each letter has a small label underneath ("starts with" / "ends with"),
//      so even without the font you always know which is which.
//
// LetterTile is exported too: the landing page uses smaller tiles for its
// "A … e" example. Tiles are square on purpose (see DESIGN.md).
// =============================================================================

import { displayEnd, displayStart } from "@/lib/game/display";
import type { LetterPair as LetterPairType } from "@/lib/game/types";

export interface LetterPairProps {
  pair: LetterPairType;
}

/** The two tile sizes: "hero" while playing, "small" for examples. */
const TILE_SIZES = {
  hero: "size-hero-tile text-7xl short:size-tile short:text-5xl",
  small: "size-tile text-tile",
} as const;

/** One letter in a square tile with a 2px border. The letter's case is kept as given. */
export function LetterTile({ letter, size = "hero" }: { letter: string; size?: keyof typeof TILE_SIZES }) {
  return (
    <span className={`flex items-center justify-center border-2 border-tile-border leading-none font-bold ${TILE_SIZES[size]}`}>
      {letter}
    </span>
  );
}

/** A big letter tile with a small caption below it. */
function LetterBox({ letter, caption }: { letter: string; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <LetterTile letter={letter} />
      <span className="text-sm text-muted">{caption}</span>
    </div>
  );
}

export function LetterPair({ pair }: LetterPairProps) {
  const start = displayStart(pair);
  const end = displayEnd(pair);

  return (
    // aria-label gives screen readers a clear sentence instead of "I dot dot dot l".
    <div className="flex items-start gap-4" aria-label={`Starts with ${start}, ends with lowercase ${end}`}>
      <LetterBox letter={start} caption="starts with" />
      {/* Centred on the tiles (hero tile = 96px tall, 62px on short screens). */}
      <span className="flex h-hero-tile items-center text-4xl text-muted short:h-tile short:text-2xl" aria-hidden>
        …
      </span>
      <LetterBox letter={end} caption="ends with" />
    </div>
  );
}
