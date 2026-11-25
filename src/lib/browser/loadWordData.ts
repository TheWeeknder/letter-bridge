// =============================================================================
// loadWordData.ts — download the word lists in the browser, ONCE.
//
// WHY a module-level cache: React may render components many times (and runs
// effects twice in development "Strict Mode"). We don't want to download
// ~2 MB and rebuild the lookup table each time, so we remember the Promise
// and hand the same one to every caller.
// =============================================================================

import { GENERATION_LIST_FILE, VALIDATION_LIST_FILES } from "../game/config";
import type { WordData } from "../game/types";
import { buildWordData } from "../game/wordLists";

// Lives outside any function, so it survives between calls (the "cache").
let cached: Promise<WordData> | null = null;

/** Download one file from /public/data, failing loudly if the server says no (e.g. 404). */
async function fetchText(file: string): Promise<string> {
  const url = `/data/${file}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url} (HTTP ${response.status})`);
  }
  return response.text();
}

/** Fetch every list (in parallel) and build the WordData. Cached after the first call. */
export function loadWordData(): Promise<WordData> {
  if (!cached) {
    cached = (async () => {
      // Promise.all starts ALL downloads at the same time instead of one
      // after the other, so loading takes about as long as the biggest file.
      const [generationText, ...validationTexts] = await Promise.all([
        fetchText(GENERATION_LIST_FILE),
        ...VALIDATION_LIST_FILES.map(fetchText),
      ]);

      // Glue the dictionary files together into one long text, one word per
      // line. buildWordData() removes any duplicates, so a word that appears
      // in two files is only counted once.
      return buildWordData(validationTexts.join("\n"), generationText);
    })();

    // If loading fails, forget the failed Promise so a later call can retry
    // instead of getting the same error forever.
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}
