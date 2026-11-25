// =============================================================================
// stats.ts — print facts about the word lists so we can tune MIN_WORDS_PER_PAIR.
// Run with: npm run stats
//
// It reads the files straight from /data with Node (no browser needed) and
// uses the exact same buildWordData() function as the game.
// =============================================================================

import { GENERATION_LIST_FILE, MIN_WORDS_PER_PAIR, VALIDATION_LIST_FILES } from "../src/lib/game/config";
import { displayEnd, displayStart } from "../src/lib/game/display";
import { pairKey } from "../src/lib/game/pairIndex";
import { parseWordList } from "../src/lib/game/wordLists";
import { readDataFile, readLocalWordData } from "../src/lib/node/readLocalWordData";

const generationText = readDataFile(GENERATION_LIST_FILE);
const data = readLocalWordData();

// --- 1. Basic counts --------------------------------------------------------
// First, each dictionary file on its own (after cleaning: >=3 letters, a–z
// only, # notes skipped). Then the merged total the game actually uses.
// The total can be a bit smaller than the sum if two files share a word.
console.log("=== Dictionary files ===");
for (const file of VALIDATION_LIST_FILES) {
  const count = parseWordList(readDataFile(file)).length;
  console.log(`  ${file.padEnd(22)} ${count.toLocaleString().padStart(8)} words`);
}
console.log(`  ${"TOTAL (merged)".padEnd(22)} ${data.validation.size.toLocaleString().padStart(8)} words`);

const rawCommon = generationText.split(/\r?\n/).filter(Boolean).length;
console.log("\n=== Common words (for picking letter pairs) ===");
console.log(`Common list (raw lines):                ${rawCommon.toLocaleString()}`);
console.log(`Common words kept (in dictionary, >=3): ${data.generation.length.toLocaleString()}`);
console.log(`Letter pairs that have >=1 word:        ${data.pairIndex.size} (of 26x26 = 676)`);

// --- 2. How many pairs would survive different thresholds? -------------------
// This table is what helps us choose MIN_WORDS_PER_PAIR.
console.log("\n=== Eligible pairs by threshold ===");
for (const n of [1, 5, 10, 15, 20, 30, 50]) {
  const pairs = [...data.pairIndex.values()].filter((w) => w.length >= n);
  const covered = pairs.reduce((sum, w) => sum + w.length, 0);
  const marker = n === MIN_WORDS_PER_PAIR ? "  <-- current setting" : "";
  console.log(
    `N >= ${String(n).padStart(2)}: ${String(pairs.length).padStart(3)} pairs, ` +
      `covering ${covered.toLocaleString()} common words${marker}`,
  );
}

// --- 3. The biggest and smallest eligible pairs -----------------------------
const eligible = data.eligiblePairs
  .map((p) => ({ ...p, words: data.pairIndex.get(pairKey(p.start, p.end))! }))
  .sort((a, b) => b.words.length - a.words.length);

const show = (p: (typeof eligible)[number]) =>
  `  ${displayStart(p)} … ${displayEnd(p)}: ${String(p.words.length).padStart(3)} words  (e.g. ${p.words.slice(0, 4).join(", ")})`;

console.log(`\n=== ${eligible.length} eligible pairs at N = ${MIN_WORDS_PER_PAIR} ===`);
console.log("Easiest (most words):");
eligible.slice(0, 8).forEach((p) => console.log(show(p)));
console.log("Hardest (fewest words, still allowed):");
eligible.slice(-8).forEach((p) => console.log(show(p)));

// --- 4. Which START letters can appear at all? -------------------------------
const starts = new Set(eligible.map((p) => p.start));
const ends = new Set(eligible.map((p) => p.end));
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
console.log(`\nStart letters never used: ${alphabet.filter((c) => !starts.has(c)).join(" ") || "(none)"}`);
console.log(`End letters never used:   ${alphabet.filter((c) => !ends.has(c)).join(" ") || "(none)"}`);
