// =============================================================================
// random.ts — "random" numbers that are the same every time for the same seed.
//
// WHY: in multiplayer, every player (and the room server) must get the SAME
// letter pairs in the same order. Math.random can't do that: it's different
// on every device. A seeded generator turns a seed string like "k3x9q" into
// a fixed sequence of numbers, so everyone who has the seed sees the same game.
// Single player just uses a fresh random seed per game, so it still feels
// random.
// =============================================================================

import { pickLetterPair } from "./letterPicker";
import type { LetterPair } from "./types";

/**
 * Turn a string into a 32-bit number (the FNV-1a hash). Similar strings
 * ("seed#1", "seed#2") give very different numbers, which is what we want.
 */
function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // >>> 0 = treat as an unsigned (never negative) number
}

/**
 * A small, fast random-number generator ("mulberry32") started from `seed`.
 * Returns a function that works like Math.random: each call gives the next
 * number in [0, 1). Same seed -> same numbers, on every device.
 */
export function createRng(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The letter pair for round number `round` of the game started with `seed`.
 * Round 0 is the first pair; each correct answer moves to the next round, so
 * the round number is simply the player's current streak.
 *
 * `previous` is the pair of round `round - 1` (null for round 0). Passing it
 * keeps the "never the same pair twice in a row" rule. Because it's itself
 * worked out from the seed, the whole sequence depends only on the seed, so
 * the room server can find any player's pair from just the seed and streak.
 */
export function pairForRound(
  eligible: LetterPair[],
  seed: string,
  round: number,
  previous: LetterPair | null,
): LetterPair {
  // A separate generator per round means round 7 doesn't depend on how many
  // numbers rounds 0-6 happened to use.
  return pickLetterPair(eligible, createRng(`${seed}#${round}`), previous);
}

/** A fresh, unpredictable seed for a new game (e.g. "f3a9c2e1…"). */
export function newSeed(): string {
  return crypto.randomUUID();
}
