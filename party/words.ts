// =============================================================================
// party/words.ts — the dictionary, inside the room server.
//
// The room server judges answers itself (so nobody can cheat by editing their
// browser), which means it needs exactly the same dictionary as the game.
// The .txt files from /data are bundled into the server as plain text
// (wrangler treats *.txt imports as text automatically) and run through the
// SAME buildWordData() the browser uses.
// =============================================================================

import common from "../data/common-10k.txt";
import enable1 from "../data/enable1.txt";
import extraWords from "../data/extra-words.txt";
import scowlAdditions from "../data/scowl-additions.txt";
import { type VALIDATION_LIST_FILES } from "../src/lib/game/config";
import type { WordData } from "../src/lib/game/types";
import { buildWordData } from "../src/lib/game/wordLists";

/**
 * Every dictionary file by name. The type forces this to list EXACTLY the
 * files in VALIDATION_LIST_FILES, so adding a list to config.ts without
 * adding it here is a compile error, and the server can't drift from the game.
 */
const VALIDATION_TEXTS: Record<(typeof VALIDATION_LIST_FILES)[number], string> = {
  "enable1.txt": enable1,
  "scowl-additions.txt": scowlAdditions,
  "extra-words.txt": extraWords,
};

let cached: WordData | null = null;

/** The word data, built on first use and then kept for this server instance. */
export function getWords(): WordData {
  // Same order as the browser (lib/browser/loadWordData.ts) joins them.
  cached ??= buildWordData(Object.values(VALIDATION_TEXTS).join("\n"), common);
  return cached;
}
