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
 *
 * WHY 10: that gives 200 pairs (15 gave 161), including pairs that start with
 * J and Q. Every pair still has at least 10 EVERYDAY answers, and the full
 * dictionary accepts many more. Run `npm run stats` to see the trade-off.
 */
export const MIN_WORDS_PER_PAIR = 10;

/** Answers shorter than this are rejected (so "ae" can't sneak through). */
export const MIN_WORD_LENGTH = 3;

/**
 * The answer box accepts at most this many letters. The longest
 * words in the dictionary are about 28 letters, so no real word is cut off.
 */
export const MAX_ANSWER_LENGTH = 30;

/**
 * How long the "3 · 2 · 1" countdown before every game lasts, in seconds.
 * Solo, the countdown screen and the room server all use this one number,
 * so multiplayer players all start at the same moment.
 */
export const START_COUNTDOWN_SECONDS = 3;

/**
 * The time limits (in seconds) the player can choose before a game.
 * Add or remove numbers here and the picker buttons update automatically.
 */
export const TIME_LIMITS = [10, 5, 3] as const;

/** A TypeScript type meaning "one of the numbers in TIME_LIMITS". */
export type TimeLimit = (typeof TIME_LIMITS)[number];

/**
 * Sprint mode: ONE clock for the whole game, this many seconds long. Find as
 * many words as you can; a wrong word only warns you (see modes.ts).
 */
export const SPRINT_SECONDS = 30;

/**
 * Points for each letter of an accepted word, so longer words score more
 * ("soaps" = 5, "superheroes" = 11). See scoring.ts.
 */
export const POINTS_PER_LETTER = 1;

/** How many scores each mode's high score board keeps. */
export const HIGH_SCORE_LIMIT = 5;

/** How many example words to show on the game-over screen. */
export const EXAMPLE_WORD_COUNT = 2;

/**
 * The files that together make up the DICTIONARY (used to accept answers).
 * The game merges them into one big list, so a word counts if it is in ANY of
 * them. To add another list, drop the file in /data and add its name here.
 *   enable1.txt          ~173k words, the main list
 *   scowl-additions.txt  ~17k newer words ENABLE lacks ("blog", "selfie")
 *   proper-nouns.txt     capitalised everyday words the big lists skip:
 *                        months, days, holidays, countries, nationalities,
 *                        languages, states and big cities ("april", "canada")
 *   extra-words.txt      words you add by hand ("nile")
 */
export const VALIDATION_LIST_FILES = [
  "enable1.txt",
  "scowl-additions.txt",
  "proper-nouns.txt",
  "extra-words.txt",
] as const;

/** The COMMON words, used to pick fair letter pairs and example words. */
export const GENERATION_LIST_FILE = "common-10k.txt";

// WHERE these files live:
//   - the browser downloads them from  /data/<file>   (copied to /public/data)
//   - Node (tests, scripts) reads them from  data/<file>  on disk
// Keeping just the NAMES here means both places always use the same files.
