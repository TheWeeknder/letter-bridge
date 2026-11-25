"use client";
// =============================================================================
// HighScoreBoard — the top scores for one time limit, shown on game over.
//
// One quiet card with a row per score: the place, the streak and the words
// used. The words are cut to one line; each row is a native <details>, so
// tapping it (on a phone) or clicking it opens the full list. The row for the
// game just played gets an emerald bar on its left edge.
// =============================================================================

import type { TimeLimit } from "@/lib/game/config";
import type { HighScoreEntry } from "@/lib/game/highScores";
import { SectionHeading } from "./ui";

export interface HighScoreBoardProps {
  board: HighScoreEntry[]; // best first
  timeLimit: TimeLimit;
  highlightIndex: number | null; // the row for this game, if it made the board
}

export function HighScoreBoard({ board, timeLimit, highlightIndex }: HighScoreBoardProps) {
  if (board.length === 0) return null;

  return (
    <section className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeading>High scores · {timeLimit}s</SectionHeading>
      <ol className="divide-y divide-zinc-200 overflow-hidden rounded-xl bg-zinc-100 text-left dark:divide-zinc-800 dark:bg-zinc-900">
        {board.map((entry, i) => {
          const highlighted = i === highlightIndex;
          return (
            // Index as key is fine: the list is rebuilt whole, never reordered in place.
            <li
              key={i}
              // Only colour the LEFT border: the top border is the row divider.
              className={"border-l-4 " + (highlighted ? "border-l-emerald-500" : "border-l-transparent")}
              aria-current={highlighted ? "true" : undefined}
            >
              <details className="group px-3 py-2">
                <summary className="flex cursor-pointer list-none items-baseline gap-3 [&::-webkit-details-marker]:hidden">
                  <span className="w-5 text-sm text-zinc-500 tabular-nums">{i + 1}</span>
                  <span className={"w-6 tabular-nums " + (highlighted ? "font-bold" : "font-semibold")}>
                    {entry.streak}
                  </span>
                  {/* One line when closed; the full list is shown below when open. */}
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-500 group-open:hidden dark:text-zinc-400">
                    {entry.words.join(", ")}
                  </span>
                </summary>
                {/* Indent = place (w-5) + streak (w-6) + two gap-3s, so it lines up with the words above. */}
                <p className="pt-1 pl-17 text-sm break-words text-zinc-500 dark:text-zinc-400">
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
