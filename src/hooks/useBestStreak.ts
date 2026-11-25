"use client";
// =============================================================================
// useBestStreak.ts — remember the player's best streak in localStorage, so it
// survives closing the tab.
//
// WHY useSyncExternalStore (and not useState + useEffect):
// localStorage lives OUTSIDE React. useSyncExternalStore is React's official
// way to read outside data. It needs three things:
//   1. subscribe:         "tell me when the value changes"
//   2. getSnapshot:       "what is the value right now?" (in the browser)
//   3. getServerSnapshot: "what should the server render?" The server has no
//                         localStorage, so it shows 0. React then swaps in the
//                         real value in the browser without a mismatch error.
// =============================================================================

import { useCallback, useSyncExternalStore } from "react";
import { BEST_STREAK_STORAGE_KEY, parseBestStreak } from "@/lib/game/bestStreak";

// The "storage" event only fires for changes made in OTHER tabs. We send our
// own event for changes made in THIS tab, so both cases update the screen.
const LOCAL_CHANGE_EVENT = "letter-bridge:best-streak-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange); // another tab saved a record
  window.addEventListener(LOCAL_CHANGE_EVENT, onChange); // this tab saved one
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): number {
  // try/catch: some browsers block storage (e.g. strict privacy modes).
  // Then we simply have no saved record instead of crashing.
  try {
    return parseBestStreak(localStorage.getItem(BEST_STREAK_STORAGE_KEY));
  } catch {
    return 0;
  }
}

function getServerSnapshot(): number {
  return 0;
}

export interface UseBestStreakResult {
  best: number; // the saved record (0 if none yet)
  record: (streak: number) => void; // save `streak` if it beats the record
}

export function useBestStreak(): UseBestStreakResult {
  const best = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const record = useCallback((streak: number) => {
    if (streak <= getSnapshot()) return; // not a new record: nothing to save
    try {
      localStorage.setItem(BEST_STREAK_STORAGE_KEY, String(streak));
      window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT)); // update the screen
    } catch {
      // Storage blocked or full: the record just isn't saved. The game goes on.
    }
  }, []);

  return { best, record };
}
