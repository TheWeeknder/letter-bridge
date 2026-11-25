// =============================================================================
// highScoreStore.ts — where the high score boards are KEPT: localStorage, on
// this device.
//
// WHY one file: this is the only code that touches storage for scores. When
// multiplayer arrives and scores move to a server, this file (and the inside
// of useHighScores) is what changes; components and the rules in
// lib/game/highScores.ts stay as they are.
// =============================================================================

import { type HighScoreBoards, HIGH_SCORES_STORAGE_KEY, emptyBoards, parseHighScores } from "../game/highScores";

// The "storage" event only fires for changes made in OTHER tabs. We send our
// own event for changes made in THIS tab, so both cases update the screen.
const LOCAL_CHANGE_EVENT = "letter-bridge:high-scores-changed";

/** Call `onChange` whenever the boards change (in this tab or another). */
export function subscribeHighScores(onChange: () => void): () => void {
  window.addEventListener("storage", onChange); // another tab saved a score
  window.addEventListener(LOCAL_CHANGE_EVENT, onChange); // this tab saved one
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_CHANGE_EVENT, onChange);
  };
}

// React's useSyncExternalStore needs the SAME object back while nothing has
// changed (otherwise it re-renders forever). So we remember the raw text we
// last parsed and only parse again when it's different.
let cachedRaw: string | null = null;
let cachedBoards: HighScoreBoards = emptyBoards();

/** The saved boards (empty boards if there are none or storage is blocked). */
export function loadHighScores(): HighScoreBoards {
  let raw: string | null;
  // try/catch: some browsers block storage (e.g. strict privacy modes).
  // Then we simply have no saved scores instead of crashing.
  try {
    raw = localStorage.getItem(HIGH_SCORES_STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedBoards = parseHighScores(raw);
  }
  return cachedBoards;
}

/** Save the boards and tell this tab's screen to update. */
export function saveHighScores(boards: HighScoreBoards): void {
  try {
    localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(boards));
    window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
  } catch {
    // Storage blocked or full: the score just isn't saved. The game goes on.
  }
}
