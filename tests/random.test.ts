// Tests for the seeded random numbers and pair sequences.
// The key promise for multiplayer: same seed -> same game, on every device.
import { describe, expect, it } from "vitest";
import { samePair } from "@/lib/game/letterPicker";
import { createRng, newSeed, pairForRound } from "@/lib/game/random";
import type { LetterPair } from "@/lib/game/types";
import { readLocalWordData } from "@/lib/node/readLocalWordData";

/** The first `count` numbers from a generator. */
const take = (rng: () => number, count: number) => Array.from({ length: count }, () => rng());

/** The pairs for rounds 0..count-1, chaining each round's pair into the next. */
function sequence(eligible: LetterPair[], seed: string, count: number): LetterPair[] {
  const pairs: LetterPair[] = [];
  for (let round = 0; round < count; round++) {
    pairs.push(pairForRound(eligible, seed, round, pairs[round - 1] ?? null));
  }
  return pairs;
}

describe("createRng", () => {
  it("gives the same numbers for the same seed", () => {
    expect(take(createRng("abc"), 20)).toEqual(take(createRng("abc"), 20));
  });

  it("gives different numbers for different seeds", () => {
    expect(take(createRng("abc"), 5)).not.toEqual(take(createRng("abd"), 5));
  });

  it("always returns numbers in [0, 1), spread across the range", () => {
    const values = take(createRng("spread"), 10_000);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    // Rough check that it isn't stuck in one corner: each tenth gets some hits.
    for (let tenth = 0; tenth < 10; tenth++) {
      const hits = values.filter((v) => Math.floor(v * 10) === tenth).length;
      expect(hits).toBeGreaterThan(800);
    }
  });
});

describe("pairForRound", () => {
  const { eligiblePairs } = readLocalWordData();

  it("gives every player with the same seed the same sequence of pairs", () => {
    expect(sequence(eligiblePairs, "room-42", 50)).toEqual(sequence(eligiblePairs, "room-42", 50));
  });

  it("gives a different sequence for a different seed", () => {
    expect(sequence(eligiblePairs, "room-42", 10)).not.toEqual(sequence(eligiblePairs, "room-43", 10));
  });

  it("can find any round directly from the seed and the previous pair", () => {
    const pairs = sequence(eligiblePairs, "jump", 20);
    expect(pairForRound(eligiblePairs, "jump", 12, pairs[11])).toEqual(pairs[12]);
  });

  it("only returns eligible pairs, and never the same pair twice in a row", () => {
    const pairs = sequence(eligiblePairs, "no-repeats", 500);
    for (let i = 0; i < pairs.length; i++) {
      expect(eligiblePairs.some((p) => samePair(p, pairs[i]))).toBe(true);
      if (i > 0) expect(samePair(pairs[i], pairs[i - 1])).toBe(false);
    }
  });
});

describe("newSeed", () => {
  it("makes a different seed each time", () => {
    expect(newSeed()).not.toBe(newSeed());
  });
});
