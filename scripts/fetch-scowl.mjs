// =============================================================================
// fetch-scowl.mjs — download extra everyday words from SCOWL and save the ones
// our main dictionary (ENABLE) is missing.
// Run with: npm run dict:fetch   (only when you want to refresh the list)
//
// WHAT is SCOWL? "Spell Checker Oriented Word Lists" — the word list behind
// most spell checkers (aspell, hunspell). It knows newer words that ENABLE
// lacks, like "blog", "selfie" and "emoji".
//
// WHY only save the "additions"? ENABLE already has ~173k words. Most of
// SCOWL overlaps with it, so we store just the NEW words (~17k). That keeps
// the extra download for the browser small.
//
// WHY save a file at all instead of downloading in the game? Two reasons:
//   1. The game never depends on someone else's website being up.
//   2. The file is committed, so you can see exactly which words changed
//      (with git diff) every time you refresh it.
// =============================================================================

import { readFileSync, writeFileSync } from "node:fs";

// --- Settings ----------------------------------------------------------------
// SIZE controls how big the list is. 70 = words a normal person might use.
// 80 (what we use) adds ~17k rarer but real words ("revocably",
// "transborder"). 95 adds ~64k more, mostly archaic or near-junk
// ("quinquefarious"), so we stop at 80.
const SIZE = 80;

// The SCOWL website builds a custom list from these options:
//   spelling=US & spelling=GBs  -> American AND British spellings ("color", "colour")
//   max_variant=1               -> include common alternative spellings
//   diacritic=strip             -> "café" becomes "cafe"
//   special=hacker              -> include tech words ("qwerty", "blog")
const URL =
  `http://app.aspell.net/create?max_size=${SIZE}` +
  "&spelling=US&spelling=GBs&max_variant=1&diacritic=strip&special=hacker" +
  "&download=wordlist&encoding=utf-8&format=inline";

const ENABLE_FILE = "data/enable1.txt";
const OUTPUT_FILE = "data/scowl-additions.txt";

// Only lowercase a–z, at least 3 letters. Because SCOWL keeps capital letters,
// this one rule throws away:
//   names      "Nile", "Paris", "John"   (start with a capital)
//   acronyms   "AAA", "NASA"             (all capitals)
//   others     "cat's", "e-mail"         (apostrophes, hyphens)
const PLAIN_WORD = /^[a-z]{3,}$/;

// --- 1. Download SCOWL -------------------------------------------------------
console.log(`Downloading SCOWL size ${SIZE}...`);
const response = await fetch(URL);
if (!response.ok) {
  throw new Error(`Download failed (HTTP ${response.status})`);
}
const scowlText = await response.text();

// The download starts with a header (where it came from + the copyright
// notice), then a line that is just "---", then one word per line.
const allLines = scowlText.split(/\r?\n/);
const marker = allLines.indexOf("---");
if (marker === -1) {
  throw new Error('Could not find the "---" line. Did the SCOWL format change?');
}
const headerLines = allLines.slice(0, marker);
const scowlLines = allLines.slice(marker + 1);

// --- 2. Keep only plain lowercase words --------------------------------------
const scowlWords = scowlLines.filter((line) => PLAIN_WORD.test(line));

// --- 3. Drop words ENABLE already has ----------------------------------------
// A Set makes "is this word in ENABLE?" an instant check.
const enable = new Set(readFileSync(ENABLE_FILE, "utf8").split(/\r?\n/));
const additions = [...new Set(scowlWords)] // remove any duplicates
  .filter((word) => !enable.has(word))
  .sort();

// --- 4. Save -----------------------------------------------------------------
// SCOWL's license says its copyright notice must travel with every copy, so
// we keep the header at the top of our file, with "# " in front of each line.
// The game skips those lines automatically (they aren't plain a–z words).
const header = [
  `# Words from SCOWL size ${SIZE} that are NOT in enable1.txt.`,
  "# Made by scripts/fetch-scowl.mjs (npm run dict:fetch). Don't edit by hand:",
  "# add your own words to extra-words.txt instead.",
  "#",
  ...headerLines.map((line) => `# ${line}`.trimEnd()),
];

// One word per line, ending with a newline (a common text-file convention).
writeFileSync(OUTPUT_FILE, [...header, ...additions].join("\n") + "\n");

console.log(`SCOWL lines downloaded:          ${scowlLines.length.toLocaleString()}`);
console.log(`Plain lowercase words (3+ chars): ${scowlWords.length.toLocaleString()}`);
console.log(`New words not in ENABLE:          ${additions.length.toLocaleString()}`);
console.log(`Saved to ${OUTPUT_FILE}`);
