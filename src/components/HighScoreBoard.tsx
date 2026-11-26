"use client";
// =============================================================================
// HighScoreBoard — the top scores for one mode, shown on game over.
//
// One quiet bordered card (LIST_CARD in ui.tsx) with a row per score: the
// place, the streak and the words used (in Sprint the score IS the number of
// words). The words are cut to one line; each row is a native <details>, so
// tapping it (on a phone) or clicking it opens the full list. The row for the
// game just played gets an emerald bar on its left edge.
// =============================================================================

import type { HighScoreEntry } from "@/lib/game/highScores";
import { type GameMode, modeLabel } from "@/lib/game/modes";
import { LIST_CARD, SectionHeading } from "./ui";

export interface HighScoreBoardProps {
  board: HighScoreEntry[]; // best first
  mode: GameMode;
  highlightIndex: number | null; // the row for this game, if it made the board
}

export function HighScoreBoard({ board, mode, highlightIndex }: HighScoreBoardProps) {
  if (board.length === 0) return null;

  return (
    <section className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeading>High scores · {modeLabel(mode)}</SectionHeading>
      <ol className={LIST_CARD}>
        {board.map((entry, i) => {
          const highlighted = i === highlightIndex;
          return (
            // Index as key is fine: the list is rebuilt whole, never reordered in place.
            <li
              key={i}
              // Only colour the LEFT border: the top border is the row divider.
              className={"border-l-4 " + (highlighted ? "border-l-accent" : "border-l-transparent")}
              aria-current={highlighted ? "true" : undefined}
            >
              <details className="group px-3 py-2">
                <summary className="flex cursor-pointer list-none items-baseline gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="w-5 text-sm text-muted tabular-nums">{i + 1}</span>
                  <span className={"w-6 tabular-nums " + (highlighted ? "font-bold" : "font-semibold")}>
                    {entry.streak}
                  </span>
                  {/* One line when closed; the full list is shown below when open. */}
                  <span className="min-w-0 flex-1 truncate text-sm text-muted group-open:hidden">
                    {entry.words.join(", ")}
                  </span>
                </summary>
                {/* Indent = place (w-5) + streak (w-6) + two gap-3s, so it lines up with the words above. */}
                <p className="pt-1 pl-17 text-sm break-words text-muted">
                  {entry.words.join(", ")}
                </p>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
