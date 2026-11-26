// =============================================================================
// modes.ts — the two ways to play, and the few rules that differ between them.
//
//   Streak (10, 5 or 3)  a fresh timer for EVERY word. A wrong word or running
//                        out of time ends the game. Score = your streak.
//   Sprint ("sprint")    ONE clock for the whole game (SPRINT_SECONDS). A wrong
//                        word only warns you; you stay on the same letters
//                        until you find one. Score = how many words you found.
//
// WHY one small file: the reducer, the room rules, the screens and the high
// score boards all need to ask "which mode is this?". Keeping the answers
// here means a rule like "what counts as a warning?" is written exactly once.
// =============================================================================

import { SPRINT_SECONDS, TIME_LIMITS, type TimeLimit } from "./config";
import type { RejectionReason } from "./types";

/** A Streak game is named by its seconds per word; a Sprint game by "sprint". */
export type GameMode = TimeLimit | "sprint";

/** Every mode, in the order the setup screen and high score boards list them. */
export const GAME_MODES: readonly GameMode[] = [...TIME_LIMITS, "sprint"];

/** Is this the one-clock, warn-only Sprint mode? */
export function isSprint(mode: GameMode): mode is "sprint" {
  return mode === "sprint";
}

/** Is `value` a real mode? (Used to check messages from the network.) */
export function isGameMode(value: unknown): value is GameMode {
  return GAME_MODES.includes(value as GameMode);
}

/**
 * How long the countdown runs, in seconds: per word in Streak, for the whole
 * game in Sprint.
 */
export function modeSeconds(mode: GameMode): number {
  return isSprint(mode) ? SPRINT_SECONDS : mode;
}

/** A short name for buttons and headings: "10s" or "30s sprint". */
export function modeLabel(mode: GameMode): string {
  return isSprint(mode) ? `${SPRINT_SECONDS}s sprint` : `${mode}s`;
}

/**
 * How the number of accepted words is described next to the points:
 * "Streak 4" in Streak (they were in a row), "4 words" / "1 word" in Sprint.
 */
export function wordCountLabel(mode: GameMode, words: number): string {
  if (isSprint(mode)) return `${words} ${words === 1 ? "word" : "words"}`;
  return `Streak ${words}`;
}

/**
 * Does this rejected answer only WARN the player (try again, same letters)
 * instead of ending the game?
 * - Sprint: every mistake just warns. Only the clock ends a sprint.
 * - Streak: only honest slips warn (too short, already used); a wrong word
 *   ends the game.
 * An empty answer never gets this far (the answer box ignores it).
 */
export function warnsInstead(mode: GameMode, reason: RejectionReason): boolean {
  if (reason === "EMPTY") return false;
  if (isSprint(mode)) return true;
  return reason === "TOO_SHORT" || reason === "ALREADY_USED";
}
