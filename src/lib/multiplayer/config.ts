// =============================================================================
// multiplayer/config.ts — the numbers for multiplayer rooms, in one place
// (like lib/game/config.ts does for the game itself).
// =============================================================================

/** A room holds at most this many players. */
export const MAX_PLAYERS = 4;

/** A game needs at least this many players before the host can start it. */
export const MIN_PLAYERS = 2;

/**
 * Extra time (ms) the server waits for an answer after a round's time limit,
 * to cover network delay. The player's own screen times out first, so this
 * never gives anyone more time to think; it only stops a slow connection from
 * turning a right answer into a timeout.
 */
export const TIMEOUT_GRACE_MS = 1500;

/** Longest nickname allowed (longer ones are cut off). */
export const NICKNAME_MAX_LENGTH = 16;

/** How many letters a room code has, e.g. "KBXQM". */
export const ROOM_CODE_LENGTH = 5;

/**
 * Letters used in room codes. I, L and O are left out because they're easy
 * to confuse with 1, l/I and 0 when reading a code out loud or off a screen.
 */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * The PartyServer "party" name for rooms. It's the kebab-case version of the
 * Durable Object binding name in wrangler.jsonc (LetterRoom -> letter-room).
 */
export const ROOM_PARTY = "letter-room";
