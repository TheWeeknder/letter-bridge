// Tests for pickLetterPair(). We pass FAKE random functions so results are
// predictable, plus a few runs with real Math.random to check the rules hold.
import { describe, expect, it } from "vitest";
import { MIN_WORDS_PER_PAIR } from "@/lib/game/config";
import { pickLetterPair, samePair } from "@/lib/game/letterPicker";
import { readLocalWordData } from "@/lib/node/readLocalWordData";
import type { LetterPair } from "@/lib/game/types";

const AE: LetterPair = { start: "a", end: "e" };
const BS: LetterPair = { start: "b", end: "s" };
const CT: LetterPair = { start: "c", end: "t" };
const DY: LetterPair = { start: "d", end: "y" };
const PAIRS = [AE, BS, CT, DY];

/** A fake rng that always returns the same number. */
const always = (n: number) => () => n;

describe("samePair", () => {
  it("compares both letters", () => {
    expect(samePair(AE, { start: "a", end: "e" })).toBe(true);
    expect(samePair(AE, { start: "a", end: "s" })).toBe(false);
    expect(samePair(AE, { start: "b", end: "e" })).toBe(false);
  });
});

describe("pickLetterPair: deterministic (fake rng)", () => {
  it("maps the random number onto a list position", () => {
    expect(pickLetterPair(PAIRS, always(0))).toEqual(AE); // 0    * 4 = 0
    expect(pickLetterPair(PAIRS, always(0.3))).toEqual(BS); // 0.3  * 4 = 1.2
    expect(pickLetterPair(PAIRS, always(0.6))).toEqual(CT); // 0.6  * 4 = 2.4
    expect(pickLetterPair(PAIRS, always(0.99))).toEqual(DY); // 0.99 * 4 = 3.96
  });

  it("doesn't crash if a custom rng returns exactly 1", () => {
    expect(pickLetterPair(PAIRS, always(1))).toEqual(DY);
  });

  it("skips the previous pair (it's removed before choosing)", () => {
    // Without AE the candidates are [BS, CT, DY]; rng 0 picks the first.
    expect(pickLetterPair(PAIRS, always(0), AE)).toEqual(BS);
    // Without CT the candidates are [AE, BS, DY]; rng 0.7 -> 2.1 -> DY.
    expect(pickLetterPair(PAIRS, always(0.7), CT)).toEqual(DY);
  });

  it("returns the only pair even if it was the previous one", () => {
    expect(pickLetterPair([AE], always(0.5), AE)).toEqual(AE);
  });

  it("ignores a 'previous' pair that isn't in the list", () => {
    const outsider = { start: "z", end: "q" };
    expect(pickLetterPair(PAIRS, always(0), outsider)).toEqual(AE);
  });

  it("returns a copy, so changing the result can't corrupt the list", () => {
    const picked = pickLetterPair(PAIRS, always(0));
    picked.start = "x";
    expect(PAIRS[0]).toEqual({ start: "a", end: "e" });
  });

  it("throws a helpful error when there are no eligible pairs", () => {
    expect(() => pickLetterPair([], always(0))).toThrow(/No eligible letter pairs/);
  });
});

describe("pickLetterPair: with real randomness", () => {
  it("only ever returns pairs from the eligible list", () => {
    for (let i = 0; i < 1000; i++) {
      const picked = pickLetterPair(PAIRS);
      expect(PAIRS.some((p) => samePair(p, picked))).toBe(true);
    }
  });

  it("never repeats the same pair twice in a row", () => {
    let previous: LetterPair | null = null;
    for (let i = 0; i < 1000; i++) {
      const picked = pickLetterPair(PAIRS, Math.random, previous);
      if (previous) expect(samePair(picked, previous)).toBe(false);
      previous = picked;
    }
  });

  it("eventually picks every pair (nothing is unreachable)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const p = pickLetterPair(PAIRS);
      seen.add(`${p.start}|${p.end}`);
    }
    expect(seen.size).toBe(PAIRS.length);
  });
});

describe("pickLetterPair: with the real word lists", () => {
  const data = readLocalWordData();

  it("every picked pair has enough common words to be solvable", () => {
    let previous: LetterPair | null = null;
    for (let i = 0; i < 500; i++) {
      const picked = pickLetterPair(data.eligiblePairs, Math.random, previous);
      expect(data.pairIndex.get(`${picked.start}|${picked.end}`)!.length).toBeGreaterThanOrEqual(MIN_WORDS_PER_PAIR);
      previous = picked;
    }
  });
});
