// =============================================================================
// readLocalWordData.ts — the Node.js twin of lib/browser/loadWordData.ts.
//
// WHY: tests and scripts (like `npm run stats`) run in Node, not a browser,
// so they read the files straight from the /data folder on disk instead of
// downloading them. They use the SAME file list from config.ts and the SAME
// buildWordData(), so they see exactly the dictionary the game sees.
//
// Only import this from Node code (tests, scripts). The browser has no "fs".
// =============================================================================

import { readFileSync } from "node:fs";
import { GENERATION_LIST_FILE, VALIDATION_LIST_FILES } from "../game/config";
import type { WordData } from "../game/types";
import { buildWordData } from "../game/wordLists";

/** Read one file from the /data folder as text. */
export function readDataFile(file: string): string {
  return readFileSync(`data/${file}`, "utf8");
}

/** Read every list from /data and build the WordData, just like the game does. */
export function readLocalWordData(): WordData {
  // Same idea as the browser version: glue the dictionary files together.
  const validationText = VALIDATION_LIST_FILES.map(readDataFile).join("\n");
  const generationText = readDataFile(GENERATION_LIST_FILE);
  return buildWordData(validationText, generationText);
}
