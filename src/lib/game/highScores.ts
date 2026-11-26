// =============================================================================
// highScores.ts — pure rules for the high score boards: one top-5 list per
// game mode (10s, 5s, 3s and the 30s sprint), each entry remembering the
// words used. A game's score is its POINTS, worked out from those words (one
// point per letter, see scoring.ts), so boards saved before points existed
// simply re-score and re-sort themselves when loaded.
//
// WHY separate from storage: where scores are kept (localStorage today, maybe
// a server once multiplayer arrives) is a browser/network detail. The rules
// here ("is this a high score?", "what place is it?", "is this saved data
// valid?") are plain functions, so tests can check them without a browser.
// =============================================================================

import { HIGH_SCORE_LIMIT } from "./config";
import { GAME_MODES, type GameMode } from "./modes";
import { scoreFor } from "./scoring";

/** One finished game on a board. */
export interface HighScoreEntry {
  // How many words were accepted. (Called "streak" so old saves load fine.)
  // The SCORE isn't stored: it's entryPoints(entry), worked out from the words.
  streak: number;
  words: string[]; // the words accepted during that game, in order
}

/** An entry's score: the points for its words. */
export function entryPoints(entry: HighScoreEntry): number {
  return scoreFor(entry.words);
}

/** Every board, one per game mode. Each is sorted best first. */
export type HighScoreBoards = Record<GameMode, HighScoreEntry[]>;

/** The localStorage key the boards are saved under (as JSON). */
export const HIGH_SCORES_STORAGE_KEY = "letter-bridge:high-scores";

/** A fresh set of boards with no scores yet. */
export function emptyBoards(): HighScoreBoards {
  return Object.fromEntries(GAME_MODES.map((mode) => [mode, []])) as unknown as HighScoreBoards;
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
 * Sort by points, best first, and keep only the top HIGH_SCORE_LIMIT. The sort
 * is stable, so equal points keep their order: the OLDER score stays ahead.
 */
function tidy(board: HighScoreEntry[]): HighScoreEntry[] {
  return [...board].sort((a, b) => entryPoints(b) - entryPoints(a)).slice(0, HIGH_SCORE_LIMIT);
}

/**
 * Turn whatever was saved in storage back into boards. Anything missing or
 * broken (null, bad JSON, wrong shapes, unknown modes) is ignored, so a
 * corrupted value can never crash the game or show a weird board. Scores
 * saved before Sprint existed simply have no "sprint" board yet.
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

  for (const mode of GAME_MODES) {
    // JSON object keys are always strings, so 5 is saved as "5".
    const board = (saved as Record<string, unknown>)[String(mode)];
    if (Array.isArray(board)) {
      boards[mode] = tidy(
        board.filter(isValidEntry).map(({ streak, words }) => ({ streak, words: [...words] })),
      );
    }
  }
  return boards;
}

/**
 * The 1-based place a game worth `points` would take on `board`, or null if
 * it doesn't make the board. 0 points never counts. On a tie the older score
 * stays ahead, so matching a score puts you just below it.
 */
export function rankFor(board: HighScoreEntry[], points: number): number | null {
  if (points <= 0) return null;
  const rank = board.filter((entry) => entryPoints(entry) >= points).length + 1;
  return rank <= HIGH_SCORE_LIMIT ? rank : null;
}

/** A NEW board with `entry` added in its place (the old board is untouched). */
export function insertScore(board: HighScoreEntry[], entry: HighScoreEntry): HighScoreEntry[] {
  return tidy([...board, entry]);
}

/** The best score (points) for one mode (0 if its board is empty). */
export function bestFor(boards: HighScoreBoards, mode: GameMode): number {
  const best = boards[mode][0];
  return best ? entryPoints(best) : 0;
}
