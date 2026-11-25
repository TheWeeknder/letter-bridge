// Tests for getExampleWords(): the "you could have tried…" hints.
import { describe, expect, it } from "vitest";
import { getExampleWords } from "@/lib/game/examples";
import { buildPairIndex } from "@/lib/game/pairIndex";

// Order matters: the index keeps words in the order given (most common first).
const index = buildPairIndex(["are", "able", "above", "ace", "ant"]);
const AE = { start: "a", end: "e" };

describe("getExampleWords", () => {
  it("returns the first (most common) words for the pair", () => {
    expect(getExampleWords(index, AE, [], 2)).toEqual(["are", "able"]);
  });

  it("skips words the player already used", () => {
    expect(getExampleWords(index, AE, ["are"], 2)).toEqual(["able", "above"]);
  });

  it("returns fewer words if there aren't enough", () => {
    expect(getExampleWords(index, AE, ["are", "able", "above"], 2)).toEqual(["ace"]);
  });

  it("returns an empty list for an unknown pair", () => {
    expect(getExampleWords(index, { start: "z", end: "q" }, [], 2)).toEqual([]);
  });

  it("defaults to EXAMPLE_WORD_COUNT (2) words", () => {
    expect(getExampleWords(index, AE, [])).toHaveLength(2);
  });
});
