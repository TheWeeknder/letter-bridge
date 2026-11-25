// Tests for the pair lookup: pairKey, buildPairIndex, getEligiblePairs.
// The last block loads the REAL word lists from /data as a safety net.
import { describe, expect, it } from "vitest";
import { MIN_WORDS_PER_PAIR } from "@/lib/game/config";
import { buildPairIndex, getEligiblePairs, pairKey } from "@/lib/game/pairIndex";
import { readLocalWordData } from "@/lib/node/readLocalWordData";

describe("pairKey", () => {
  it("joins start and end with a bar", () => {
    expect(pairKey("a", "e")).toBe("a|e");
  });
});

describe("buildPairIndex", () => {
  it("groups words by first and last letter, keeping order", () => {
    const index = buildPairIndex(["able", "and", "above", "ant", "tea"]);
    expect(index.get("a|e")).toEqual(["able", "above"]);
    expect(index.get("a|d")).toEqual(["and"]);
    expect(index.get("a|t")).toEqual(["ant"]);
    expect(index.get("t|a")).toEqual(["tea"]);
    expect(index.size).toBe(4);
  });

  it("returns an empty map for an empty list", () => {
    expect(buildPairIndex([]).size).toBe(0);
  });
});

describe("getEligiblePairs", () => {
  const index = buildPairIndex(["able", "above", "acre", "ant", "and", "bee", "blue"]);
  // a|e: 3 words, b|e: 2 words, a|t: 1, a|d: 1

  it("keeps only pairs with at least minCount words", () => {
    expect(getEligiblePairs(index, 2)).toEqual([
      { start: "a", end: "e" },
      { start: "b", end: "e" },
    ]);
    expect(getEligiblePairs(index, 3)).toEqual([{ start: "a", end: "e" }]);
  });

  it("returns pairs in a stable alphabetical order", () => {
    const keys = getEligiblePairs(index, 1).map((p) => pairKey(p.start, p.end));
    expect(keys).toEqual(["a|d", "a|e", "a|t", "b|e"]);
  });

  it("returns nothing if the threshold is too high", () => {
    expect(getEligiblePairs(index, 99)).toEqual([]);
  });
});

describe("with the real word lists in /data", () => {
  const data = readLocalWordData();

  it("loads a big dictionary and a useful number of common words", () => {
    expect(data.validation.size).toBeGreaterThan(150_000);
    expect(data.generation.length).toBeGreaterThan(5_000);
  });

  it("offers a good variety of eligible pairs", () => {
    expect(data.eligiblePairs.length).toBeGreaterThan(50);
  });

  it("every eligible pair really has at least MIN_WORDS_PER_PAIR common words", () => {
    for (const { start, end } of data.eligiblePairs) {
      expect(data.pairIndex.get(pairKey(start, end))!.length).toBeGreaterThanOrEqual(MIN_WORDS_PER_PAIR);
    }
  });

  it("includes the example from the rules: A … e, with 'astute' valid", () => {
    expect(data.eligiblePairs).toContainEqual({ start: "a", end: "e" });
    expect(data.validation.has("astute")).toBe(true);
    expect(data.validation.has("aeioue")).toBe(false);
  });

  it("every common word is also a valid answer", () => {
    for (const word of data.generation) expect(data.validation.has(word)).toBe(true);
  });
});
