// Tests for what an on-screen keyboard tap does to the answer text.
import { describe, expect, it } from "vitest";
import { applyKey } from "@/components/keyboard";
import { MAX_ANSWER_LENGTH } from "@/lib/game/config";

describe("applyKey", () => {
  it("adds a letter to the end, in lowercase", () => {
    expect(applyKey("", "w")).toBe("w");
    expect(applyKey("wel", "D")).toBe("weld");
  });

  it("BACKSPACE removes the last letter, and does nothing on an empty box", () => {
    expect(applyKey("weld", "BACKSPACE")).toBe("wel");
    expect(applyKey("", "BACKSPACE")).toBe("");
  });

  it("ENTER leaves the text alone (the answer box submits it)", () => {
    expect(applyKey("weld", "ENTER")).toBe("weld");
  });

  it("stops adding letters at MAX_ANSWER_LENGTH", () => {
    const full = "a".repeat(MAX_ANSWER_LENGTH);
    expect(applyKey(full, "b")).toBe(full);
    expect(applyKey(full, "BACKSPACE")).toHaveLength(MAX_ANSWER_LENGTH - 1);
  });
});
