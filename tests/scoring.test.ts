// Tests for the points rule: one point per letter of every accepted word.
import { describe, expect, it } from "vitest";
import { POINTS_PER_LETTER } from "@/lib/game/config";
import { longestWord, pointsLabel, scoreFor, wordPoints } from "@/lib/game/scoring";

describe("wordPoints", () => {
  it("scores one point per letter, so longer words are worth more", () => {
    expect(POINTS_PER_LETTER).toBe(1);
    expect(wordPoints("soaps")).toBe(5);
    expect(wordPoints("superheroes")).toBe(11);
    expect(wordPoints("superheroes")).toBeGreaterThan(wordPoints("soaps"));
  });
});

describe("scoreFor", () => {
  it("adds up every word, and is 0 for no words", () => {
    expect(scoreFor([])).toBe(0);
    expect(scoreFor(["soaps", "superheroes"])).toBe(16);
  });

  it("two games with the same number of words usually score differently", () => {
    expect(scoreFor(["cat", "dog"])).not.toBe(scoreFor(["elephant", "dinosaur"]));
  });
});

describe("longestWord", () => {
  it("finds the longest word (the first one on a tie), or null for none", () => {
    expect(longestWord([])).toBeNull();
    expect(longestWord(["soaps", "superheroes", "cat"])).toBe("superheroes");
    expect(longestWord(["cat", "dog"])).toBe("cat");
  });
});

describe("pointsLabel", () => {
  it("uses the singular for 1 point", () => {
    expect(pointsLabel(1)).toBe("1 point");
    expect(pointsLabel(57)).toBe("57 points");
  });
});
