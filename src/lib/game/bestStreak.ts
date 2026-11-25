// =============================================================================
// bestStreak.ts — pure helpers for the "best streak" record.
//
// WHY separate from the React hook: the hook deals with localStorage (a
// browser thing). The rules here ("what counts as a valid saved number?",
// "is this a new record?") are plain functions, so tests can check them
// without a browser.
// =============================================================================

/** The localStorage key the best streak is saved under. */
export const BEST_STREAK_STORAGE_KEY = "letter-bridge:best-streak";

/**
 * Turn whatever was saved in storage back into a number.
 * Anything missing or broken (null, "abc", "-3", "2.5") counts as 0, so a
 * corrupted value can never crash the game or show a weird record.
 */
export function parseBestStreak(raw: string | null): number {
  if (raw === null) return 0;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : 0;
}

/**
 * Is `streak` a new record compared with the best from BEFORE this game?
 * Must be strictly higher: matching your record isn't beating it, and a
 * streak of 0 is never a record.
 */
export function isNewBest(streak: number, previousBest: number): boolean {
  return streak > 0 && streak > previousBest;
}
