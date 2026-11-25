// =============================================================================
// highScores.ts — pure rules for the high score boards: one top-5 list per
// time limit, each entry remembering the streak and the words used.
//
// WHY separate from storage: where scores are kept (localStorage today, maybe
// a server once multiplayer arrives) is a browser/network detail. The rules
// here ("is this a high score?", "what place is it?", "is this saved data
// valid?") are plain functions, so tests can check them without a browser.
// =============================================================================

import { HIGH_SCORE_LIMIT, TIME_LIMITS, type TimeLimit } from "./config";

/** One finished game on a board. */
export interface HighScoreEntry {
  streak: number;
  words: string[]; // the words accepted during that streak, in order
}

/** Every board, one per time limit. Each is sorted best first. */
export type HighScoreBoards = Record<TimeLimit, HighScoreEntry[]>;

/** The localStorage key the boards are saved under (as JSON). */
export const HIGH_SCORES_STORAGE_KEY = "letter-bridge:high-scores";

/** A fresh set of boards with no scores yet. */
export function emptyBoards(): HighScoreBoards {
  return Object.fromEntries(TIME_LIMITS.map((limit) => [limit, []])) as unknown as HighScoreBoards;
}

/** Is `value` a well-formed entry? Anything else is dropped when loading. */
function isValidEntry(value: unknown): value is HighScoreEntry {
  if (typeof value !== "object" || value === null) return false;
  const { streak, words } = value as Record<string, unknown>;
  return (
    Number.isInteger(streak) &&
    (streak as number) > 0 &&
    Array.isArray(words) &&
    words.every((word) => typeof word === "string")
  );
}

/**
 * Sort best first and keep only the top HIGH_SCORE_LIMIT. The sort is stable,
 * so equal streaks keep their order: the OLDER score stays ahead.
 */
function tidy(board: HighScoreEntry[]): HighScoreEntry[] {
  return [...board].sort((a, b) => b.streak - a.streak).slice(0, HIGH_SCORE_LIMIT);
}

/**
 * Turn whatever was saved in storage back into boards. Anything missing or
 * broken (null, bad JSON, wrong shapes, unknown time limits) is ignored, so a
 * corrupted value can never crash the game or show a weird board.
 */
export function parseHighScores(raw: string | null): HighScoreBoards {
  const boards = emptyBoards();
  if (raw === null) return boards;

  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return boards;
  }
  if (typeof saved !== "object" || saved === null) return boards;

  for (const limit of TIME_LIMITS) {
    // JSON object keys are always strings, so 5 is saved as "5".
    const board = (saved as Record<string, unknown>)[String(limit)];
    if (Array.isArray(board)) {
      boards[limit] = tidy(
        board.filter(isValidEntry).map(({ streak, words }) => ({ streak, words: [...words] })),
      );
    }
  }
  return boards;
}

/**
 * The 1-based place a new `streak` would take on `board`, or null if it
 * doesn't make the board. A streak of 0 never counts. On a tie the older
 * score stays ahead, so matching a score puts you just below it.
 */
export function rankFor(board: HighScoreEntry[], streak: number): number | null {
  if (streak <= 0) return null;
  const rank = board.filter((entry) => entry.streak >= streak).length + 1;
  return rank <= HIGH_SCORE_LIMIT ? rank : null;
}

/** A NEW board with `entry` added in its place (the old board is untouched). */
export function insertScore(board: HighScoreEntry[], entry: HighScoreEntry): HighScoreEntry[] {
  return tidy([...board, entry]);
}

/** The best streak for one time limit (0 if its board is empty). */
export function bestFor(boards: HighScoreBoards, timeLimit: TimeLimit): number {
  return boards[timeLimit][0]?.streak ?? 0;
}
