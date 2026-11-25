// Tests for the game state machine. Because the reducer is pure, a whole game
// can be "played" with plain function calls, no browser or timer needed.
import { describe, expect, it } from "vitest";
import { gameReducer, initialGameState } from "@/lib/game/gameReducer";
import type { GameAction, GameState, LetterPair } from "@/lib/game/types";

const AE: LetterPair = { start: "a", end: "e" };
const TS: LetterPair = { start: "t", end: "s" };
const BK: LetterPair = { start: "b", end: "k" };

/** Apply several actions in a row, starting from `state`. */
function play(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

const started = play(initialGameState, { type: "START", timeLimit: 5, pair: AE });

describe("START", () => {
  it("moves from setup to playing with a fresh game", () => {
    expect(started).toMatchObject({
      phase: "playing",
      timeLimit: 5,
      pair: AE,
      streak: 0,
      usedWords: [],
      gameOverReason: null,
      lastInput: null,
    });
  });

  it("increases roundId so the timer starts", () => {
    expect(started.roundId).toBe(initialGameState.roundId + 1);
  });

  it("is ignored while already playing", () => {
    expect(gameReducer(started, { type: "START", timeLimit: 3, pair: TS })).toBe(started);
  });
});

describe("SUBMIT_CORRECT", () => {
  const afterOne = gameReducer(started, { type: "SUBMIT_CORRECT", word: "astute", nextPair: TS });

  it("adds 1 to the streak, records the word, and shows the next pair", () => {
    expect(afterOne).toMatchObject({ phase: "playing", streak: 1, usedWords: ["astute"], pair: TS });
  });

  it("starts a new round (fresh timer)", () => {
    expect(afterOne.roundId).toBe(started.roundId + 1);
  });

  it("keeps counting over several correct answers", () => {
    const afterThree = play(
      afterOne,
      { type: "SUBMIT_CORRECT", word: "tests", nextPair: BK },
      { type: "SUBMIT_CORRECT", word: "book", nextPair: AE },
    );
    expect(afterThree.streak).toBe(3);
    expect(afterThree.usedWords).toEqual(["astute", "tests", "book"]);
  });

  it("doesn't modify the previous state (pure function)", () => {
    expect(started.streak).toBe(0);
    expect(started.usedWords).toEqual([]);
  });

  it("is ignored outside of playing", () => {
    const action: GameAction = { type: "SUBMIT_CORRECT", word: "x", nextPair: TS };
    expect(gameReducer(initialGameState, action)).toBe(initialGameState);
  });
});

describe("FAIL", () => {
  const twoCorrect = play(
    started,
    { type: "SUBMIT_CORRECT", word: "astute", nextPair: TS },
    { type: "SUBMIT_CORRECT", word: "tests", nextPair: BK },
  );

  it("ends the game with the reason and what was typed", () => {
    const over = gameReducer(twoCorrect, { type: "FAIL", reason: "NOT_A_WORD", input: "bxk" });
    expect(over).toMatchObject({ phase: "over", gameOverReason: "NOT_A_WORD", lastInput: "bxk" });
  });

  it("keeps the final streak, last pair and used words for the game-over screen", () => {
    const over = gameReducer(twoCorrect, { type: "FAIL", reason: "TIMEOUT" });
    expect(over).toMatchObject({ streak: 2, pair: BK, usedWords: ["astute", "tests"], lastInput: null });
  });

  it("first reason wins: a late TIMEOUT after a wrong answer is ignored", () => {
    const over = play(
      twoCorrect,
      { type: "FAIL", reason: "WRONG_END", input: "bad" },
      { type: "FAIL", reason: "TIMEOUT" },
    );
    expect(over.gameOverReason).toBe("WRONG_END");
  });

  it("is ignored on the setup screen", () => {
    expect(gameReducer(initialGameState, { type: "FAIL", reason: "TIMEOUT" })).toBe(initialGameState);
  });
});

describe("restarting", () => {
  const over = play(
    started,
    { type: "SUBMIT_CORRECT", word: "astute", nextPair: TS },
    { type: "FAIL", reason: "TIMEOUT" },
  );

  it("START from game over begins a new game with streak 0 and no used words", () => {
    const again = gameReducer(over, { type: "START", timeLimit: 5, pair: BK });
    expect(again).toMatchObject({ phase: "playing", streak: 0, usedWords: [], pair: BK, gameOverReason: null });
    expect(again.roundId).toBeGreaterThan(over.roundId);
  });

  it("RESTART goes back to setup but remembers the time limit", () => {
    const setup = gameReducer(over, { type: "RESTART" });
    expect(setup).toMatchObject({ phase: "setup", timeLimit: 5, streak: 0, usedWords: [], pair: null });
  });

  it("a word used in a previous game can be used again (new streak)", () => {
    const again = gameReducer(over, { type: "START", timeLimit: 5, pair: AE });
    expect(again.usedWords).not.toContain("astute");
  });
});

describe("WARN (too short or already used: try again)", () => {
  const afterOne = gameReducer(started, { type: "SUBMIT_CORRECT", word: "astute", nextPair: TS });
  const REPEAT = { reason: "ALREADY_USED", word: "astute" } as const;
  const SHORT = { reason: "TOO_SHORT", word: "ts" } as const;
  const repeated = gameReducer(afterOne, { type: "WARN", warning: REPEAT });

  it("does NOT end the game: same phase, pair and streak", () => {
    expect(repeated).toMatchObject({ phase: "playing", pair: TS, streak: 1, usedWords: ["astute"] });
  });

  it("keeps the same roundId, so the timer keeps running (no free time)", () => {
    expect(repeated.roundId).toBe(afterOne.roundId);
  });

  it("remembers the warning and counts it", () => {
    expect(repeated.warning).toEqual(REPEAT);
    expect(repeated.warningCount).toBe(afterOne.warningCount + 1);
  });

  it("handles a too-short word the same way", () => {
    const short = gameReducer(afterOne, { type: "WARN", warning: SHORT });
    expect(short).toMatchObject({ phase: "playing", pair: TS, streak: 1, warning: SHORT });
    expect(short.roundId).toBe(afterOne.roundId);
  });

  it("counts up again for the same warning twice, so the box shakes again", () => {
    const twice = gameReducer(repeated, { type: "WARN", warning: REPEAT });
    expect(twice.warningCount).toBe(repeated.warningCount + 1);
  });

  it("replaces the previous warning with the latest one", () => {
    const thenShort = gameReducer(repeated, { type: "WARN", warning: SHORT });
    expect(thenShort.warning).toEqual(SHORT);
  });

  it("clears the warning on the next correct answer", () => {
    const next = gameReducer(repeated, { type: "SUBMIT_CORRECT", word: "tests", nextPair: BK });
    expect(next.warning).toBeNull();
  });

  it("clears the warning when a new game starts", () => {
    const over = gameReducer(repeated, { type: "FAIL", reason: "TIMEOUT" });
    const again = gameReducer(over, { type: "START", timeLimit: 5, pair: AE });
    expect(again.warning).toBeNull();
  });

  it("is ignored when not playing", () => {
    expect(gameReducer(initialGameState, { type: "WARN", warning: REPEAT })).toBe(initialGameState);
  });
});
