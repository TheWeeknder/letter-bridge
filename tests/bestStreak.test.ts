// Tests for the pure best-streak helpers (the localStorage part lives in a hook).
import { describe, expect, it } from "vitest";
import { isNewBest, parseBestStreak } from "@/lib/game/bestStreak";

describe("parseBestStreak", () => {
  it("reads a saved positive whole number", () => {
    expect(parseBestStreak("7")).toBe(7);
  });

  it("treats missing or broken values as 0", () => {
    for (const raw of [null, "", "abc", "-3", "2.5", "NaN", "Infinity"]) {
      expect(parseBestStreak(raw)).toBe(0);
    }
  });
});

describe("isNewBest", () => {
  it("is true only when the streak is strictly higher", () => {
    expect(isNewBest(6, 5)).toBe(true);
    expect(isNewBest(5, 5)).toBe(false); // matching isn't beating
    expect(isNewBest(4, 5)).toBe(false);
  });

  it("never counts a streak of 0 as a record", () => {
    expect(isNewBest(0, 0)).toBe(false);
  });
});
