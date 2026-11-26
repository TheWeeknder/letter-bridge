// Tests for the two game modes (Streak and Sprint) and the rules that differ.
import { describe, expect, it } from "vitest";
import { SPRINT_SECONDS, TIME_LIMITS } from "@/lib/game/config";
import { GAME_MODES, isGameMode, isSprint, modeLabel, modeSeconds, warnsInstead } from "@/lib/game/modes";
import type { RejectionReason } from "@/lib/game/types";

const MISTAKES = ["WRONG_START", "WRONG_END", "NOT_A_WORD"] as const;
const SLIPS = ["TOO_SHORT", "ALREADY_USED"] as const;

describe("game modes", () => {
  it("lists every Streak time limit, then Sprint", () => {
    expect(GAME_MODES).toEqual([...TIME_LIMITS, "sprint"]);
  });

  it("knows how long each countdown runs", () => {
    for (const limit of TIME_LIMITS) expect(modeSeconds(limit)).toBe(limit);
    expect(modeSeconds("sprint")).toBe(SPRINT_SECONDS);
  });

  it("labels modes for buttons and headings", () => {
    expect(modeLabel(10)).toBe("10s");
    expect(modeLabel("sprint")).toBe(`${SPRINT_SECONDS}s sprint`);
  });

  it("recognises real modes only (for network messages)", () => {
    expect(isSprint("sprint")).toBe(true);
    expect(isSprint(5)).toBe(false);
    for (const mode of GAME_MODES) expect(isGameMode(mode)).toBe(true);
    for (const value of [4, "5", "SPRINT", null, undefined, {}]) expect(isGameMode(value)).toBe(false);
  });
});

describe("warnsInstead", () => {
  it("Streak: only slips warn; a wrong word ends the game", () => {
    for (const reason of SLIPS) expect(warnsInstead(5, reason)).toBe(true);
    for (const reason of MISTAKES) expect(warnsInstead(5, reason)).toBe(false);
  });

  it("Sprint: every mistake just warns", () => {
    for (const reason of [...SLIPS, ...MISTAKES]) expect(warnsInstead("sprint", reason)).toBe(true);
  });

  it("an empty answer is never a warning (the answer box ignores it)", () => {
    const empty: RejectionReason = "EMPTY";
    expect(warnsInstead(5, empty)).toBe(false);
    expect(warnsInstead("sprint", empty)).toBe(false);
  });
});
