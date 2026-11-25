// Tests for the high score rules (no browser or storage needed).
import { describe, expect, it } from "vitest";
import { HIGH_SCORE_LIMIT } from "@/lib/game/config";
import {
  type HighScoreEntry,
  bestFor,
  emptyBoards,
  insertScore,
  parseHighScores,
  rankFor,
} from "@/lib/game/highScores";

/** A quick entry; the words just label which game it was. */
const e = (streak: number, label = `s${streak}`): HighScoreEntry => ({ streak, words: [label] });

const FULL: HighScoreEntry[] = [e(20), e(15), e(10), e(8), e(5)];

describe("parseHighScores", () => {
  it("returns empty boards for missing or broken data", () => {
    for (const raw of [null, "", "not json", "42", "null", "[]", '"text"']) {
      expect(parseHighScores(raw)).toEqual(emptyBoards());
    }
  });

  it("reads saved boards back", () => {
    const boards = { ...emptyBoards(), 5: [e(7), e(3)] };
    expect(parseHighScores(JSON.stringify(boards))).toEqual(boards);
  });

  it("drops bad entries and ignores unknown time limits", () => {
    const raw = JSON.stringify({
      5: [e(4), { streak: 0, words: [] }, { streak: 2.5, words: [] }, { streak: 3 }, { streak: 6, words: [1] }, null],
      99: [e(50)],
      10: "nope",
    });
    const boards = parseHighScores(raw);
    expect(boards[5]).toEqual([e(4)]);
    expect(boards[10]).toEqual([]);
    expect(Object.keys(boards)).not.toContain("99");
  });

  it("sorts and caps saved boards", () => {
    const raw = JSON.stringify({ 3: [e(1), e(9), e(4), e(7), e(2), e(8), e(3)] });
    expect(parseHighScores(raw)[3].map((x) => x.streak)).toEqual([9, 8, 7, 4, 3]);
  });
});

describe("rankFor", () => {
  it("any positive streak is #1 on an empty board", () => {
    expect(rankFor([], 1)).toBe(1);
  });

  it("a streak of 0 never ranks", () => {
    expect(rankFor([], 0)).toBeNull();
  });

  it("finds the place in the middle of the board", () => {
    expect(rankFor(FULL, 12)).toBe(3);
    expect(rankFor(FULL, 25)).toBe(1);
  });

  it("a tie goes BELOW the existing score (older score stays ahead)", () => {
    expect(rankFor(FULL, 20)).toBe(2);
    expect(rankFor([e(5)], 5)).toBe(2);
  });

  it("returns null when the board is full and the streak is too low", () => {
    expect(rankFor(FULL, 5)).toBeNull();
    expect(rankFor(FULL, 4)).toBeNull();
    expect(rankFor(FULL, 6)).toBe(HIGH_SCORE_LIMIT);
  });
});

describe("insertScore", () => {
  it("adds the entry in its place and caps the board", () => {
    const board = insertScore(FULL, e(12, "new"));
    expect(board.map((x) => x.streak)).toEqual([20, 15, 12, 10, 8]);
    expect(board[2].words).toEqual(["new"]);
  });

  it("puts a tie after the older score, matching rankFor", () => {
    const board = insertScore([e(5, "old")], e(5, "new"));
    expect(board.map((x) => x.words[0])).toEqual(["old", "new"]);
  });

  it("does not change the original board", () => {
    const before = [...FULL];
    insertScore(FULL, e(30));
    expect(FULL).toEqual(before);
  });
});

describe("bestFor", () => {
  it("is 0 for an empty board and #1's streak otherwise", () => {
    const boards = { ...emptyBoards(), 10: [e(9), e(4)] };
    expect(bestFor(boards, 5)).toBe(0);
    expect(bestFor(boards, 10)).toBe(9);
  });
});
