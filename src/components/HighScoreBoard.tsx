"use client";
// =============================================================================
// HighScoreBoard — the top scores for one time limit, shown on game over.
//
// Each row shows the place, the streak and the words used. The words are cut
// to one line; each row is a native <details>, so tapping it (on a phone) or
// clicking it opens the full list. The row for the game just played is
// highlighted.
// =============================================================================

import type { TimeLimit } from "@/lib/game/config";
import type { HighScoreEntry } from "@/lib/game/highScores";

export interface HighScoreBoardProps {
  board: HighScoreEntry[]; // best first
  timeLimit: TimeLimit;
  highlightIndex: number | null; // the row for this game, if it made the board
}

export function HighScoreBoard({ board, timeLimit, highlightIndex }: HighScoreBoardProps) {
  if (board.length === 0) return null;

  return (
    <section className="w-full max-w-sm text-left">
      <h3 className="mb-2 text-center text-xs tracking-wide text-zinc-500 uppercase">
        High scores — {timeLimit}s
      </h3>
      <ol className="flex flex-col gap-1">
        {board.map((entry, i) => (
          // Index as key is fine: the list is rebuilt whole, never reordered in place.
          <li key={i}>
            <details
              className={
                "group rounded-lg px-3 py-1.5 " +
                (i === highlightIndex
                  ? "bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950"
                  : "bg-zinc-100 dark:bg-zinc-900")
              }
            >
              <summary className="flex cursor-pointer list-none items-baseline gap-3 [&::-webkit-details-marker]:hidden">
                <span className="w-6 text-sm text-zinc-500 tabular-nums">#{i + 1}</span>
                <span className="w-8 font-bold tabular-nums">{entry.streak}</span>
                {/* One line when closed; the full list is shown below when open. */}
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 group-open:hidden dark:text-zinc-400">
                  {entry.words.join(", ")}
                </span>
              </summary>
              <p className="pt-1 pl-[4.25rem] text-sm break-words text-zinc-600 dark:text-zinc-400">
                {entry.words.join(", ")}
              </p>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
