"use client";
// =============================================================================
// useHighScores.ts — gives components the high score boards and a way to save
// a finished game.
//
// WHY useSyncExternalStore (and not useState + useEffect):
// the boards live OUTSIDE React (in storage). useSyncExternalStore is React's
// official way to read outside data. It needs three things:
//   1. subscribe:         "tell me when the value changes"
//   2. getSnapshot:       "what is the value right now?" (in the browser)
//   3. getServerSnapshot: "what should the server render?" The server has no
//                         storage, so it shows empty boards. React then swaps
//                         in the real ones in the browser without a mismatch.
// =============================================================================

import { useCallback, useSyncExternalStore } from "react";
import { loadHighScores, saveHighScores, subscribeHighScores } from "@/lib/browser/highScoreStore";
import type { TimeLimit } from "@/lib/game/config";
import { type HighScoreBoards, type HighScoreEntry, emptyBoards, insertScore } from "@/lib/game/highScores";

// One shared object, so the server snapshot is the same on every call.
const SERVER_BOARDS = emptyBoards();

function getServerSnapshot(): HighScoreBoards {
  return SERVER_BOARDS;
}

export interface UseHighScoresResult {
  boards: HighScoreBoards; // one top list per time limit, best first
  save: (timeLimit: TimeLimit, entry: HighScoreEntry) => void; // add a finished game
}

export function useHighScores(): UseHighScoresResult {
  const boards = useSyncExternalStore(subscribeHighScores, loadHighScores, getServerSnapshot);

  const save = useCallback((timeLimit: TimeLimit, entry: HighScoreEntry) => {
    // Read the LATEST boards (another tab may have saved since we rendered).
    const current = loadHighScores();
    saveHighScores({ ...current, [timeLimit]: insertScore(current[timeLimit], entry) });
  }, []);

  return { boards, save };
}
