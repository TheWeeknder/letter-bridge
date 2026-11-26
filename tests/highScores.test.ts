// Tests for the high score rules (no browser or storage needed).
// A game's score is its POINTS (one per letter of every word), worked out
// from the saved words; the stored `streak` is just the word count.
import { describe, expect, it } from "vitest";
import { HIGH_SCORE_LIMIT } from "@/lib/game/config";
import {
  type HighScoreEntry,
  bestFor,
  emptyBoards,
  entryPoints,
  insertScore,
  parseHighScores,
  rankFor,
} from "@/lib/game/highScores";

/**
 * A quick one-word entry worth `points`: the word is `label` padded with x's
 * to that many letters, so the label still shows which game it was.
 */
const e = (points: number, label = "w"): HighScoreEntry => ({ streak: 1, words: [label.padEnd(points, "x")] });
const points = (board: HighScoreEntry[]) => board.map(entryPoints);

const FULL: HighScoreEntry[] = [e(20), e(15), e(10), e(8), e(5)];

describe("entryPoints", () => {
  it("adds up one point per letter of every word", () => {
    expect(entryPoints({ streak: 2, words: ["soaps", "superheroes"] })).toBe(16);
  });
});

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

  it("keeps a separate board for sprints", () => {
    const boards = { ...emptyBoards(), sprint: [e(18), e(12)] };
    const parsed = parseHighScores(JSON.stringify(boards));
    expect(parsed.sprint).toEqual([e(18), e(12)]);
    expect(bestFor(parsed, "sprint")).toBe(18);
  });

  it("still loads scores saved before sprints existed", () => {
    const parsed = parseHighScores(JSON.stringify({ 10: [e(9)], 5: [e(4)], 3: [] }));
    expect(parsed[10]).toEqual([e(9)]);
    expect(parsed.sprint).toEqual([]);
  });

  it("sorts and caps saved boards by points", () => {
    const raw = JSON.stringify({ 3: [e(1), e(9), e(4), e(7), e(2), e(8), e(3)] });
    expect(points(parseHighScores(raw)[3])).toEqual([9, 8, 7, 4, 3]);
  });

  it("re-sorts a board saved before points existed (it was sorted by word count)", () => {
    // Old order: 3 short words first, then 1 long word.
    const old = [
      { streak: 3, words: ["cat", "dog", "owl"] }, // 9 points
      { streak: 1, words: ["superheroes"] }, // 11 points
    ];
    const parsed = parseHighScores(JSON.stringify({ sprint: old }));
    expect(parsed.sprint.map((x) => x.words[0])).toEqual(["superheroes", "cat"]);
    expect(bestFor(parsed, "sprint")).toBe(11);
  });
});

describe("rankFor", () => {
  it("any positive score is #1 on an empty board", () => {
    expect(rankFor([], 1)).toBe(1);
  });

  it("0 points never ranks", () => {
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

  it("returns null when the board is full and the score is too low", () => {
    expect(rankFor(FULL, 5)).toBeNull();
    expect(rankFor(FULL, 4)).toBeNull();
    expect(rankFor(FULL, 6)).toBe(HIGH_SCORE_LIMIT);
  });
});

describe("insertScore", () => {
  it("adds the entry in its place and caps the board", () => {
    const board = insertScore(FULL, e(12, "new"));
    expect(points(board)).toEqual([20, 15, 12, 10, 8]);
    expect(board[2].words[0]).toMatch(/^new/);
  });

  it("one long word beats several short ones", () => {
    const board = insertScore([{ streak: 3, words: ["cat", "dog", "owl"] }], { streak: 1, words: ["superheroes"] });
    expect(board.map((x) => x.words[0])).toEqual(["superheroes", "cat"]);
  });

  it("puts a tie after the older score, matching rankFor", () => {
    const board = insertScore([e(5, "old")], e(5, "new"));
    expect(board.map((x) => x.words[0])).toEqual(["oldxx", "newxx"]);
  });

  it("does not change the original board", () => {
    const before = [...FULL];
    insertScore(FULL, e(30));
    expect(FULL).toEqual(before);
  });
});

describe("bestFor", () => {
  it("is 0 for an empty board and #1's points otherwise", () => {
    const boards = { ...emptyBoards(), 10: [e(9), e(4)] };
    expect(bestFor(boards, 5)).toBe(0);
    expect(bestFor(boards, 10)).toBe(9);
  });
});
