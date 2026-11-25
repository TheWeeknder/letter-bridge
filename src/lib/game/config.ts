// =============================================================================
// config.ts — every "magic number" for the game lives here.
//
// WHY: if a number is hard-coded in five places, changing it means hunting for
// all five. Keeping them in one file means one edit changes the whole game,
// and tests can import the same values the game uses.
// =============================================================================

/**
 * A letter pair is only offered to the player if at least this many COMMON
 * words start and end with those letters. This is what prevents "impossible"
 * prompts like START "X", END "q".
 */
export const MIN_WORDS_PER_PAIR = 15;

/** Answers shorter than this are rejected (so "ae" can't sneak through). */
export const MIN_WORD_LENGTH = 3;

/**
 * The time limits (in seconds) the player can choose before a game.
 * Add or remove numbers here and the picker buttons update automatically.
 */
export const TIME_LIMITS = [10, 5, 3] as const;

/** A TypeScript type meaning "one of the numbers in TIME_LIMITS". */
export type TimeLimit = (typeof TIME_LIMITS)[number];

/** How many example words to show on the game-over screen. */
export const EXAMPLE_WORD_COUNT = 2;

/**
 * The files that together make up the DICTIONARY (used to accept answers).
 * The game merges them into one big list, so a word counts if it is in ANY of
 * them. To add another list, drop the file in /data and add its name here.
 *   enable1.txt          ~173k words, the main list
 *   scowl-additions.txt  ~17k newer words ENABLE lacks ("blog", "selfie")
 *   extra-words.txt      words you add by hand ("nile")
 */
export const VALIDATION_LIST_FILES = [
  "enable1.txt",
  "scowl-additions.txt",
  "extra-words.txt",
] as const;

/** The COMMON words, used to pick fair letter pairs and example words. */
export const GENERATION_LIST_FILE = "common-10k.txt";

// WHERE these files live:
//   - the browser downloads them from  /data/<file>   (copied to /public/data)
//   - Node (tests, scripts) reads them from  data/<file>  on disk
// Keeping just the NAMES here means both places always use the same files.
