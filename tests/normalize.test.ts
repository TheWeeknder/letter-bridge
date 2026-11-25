// Tests for normalizeWord(): matching must ignore case and extra whitespace.
import { describe, expect, it } from "vitest";
import { normalizeWord } from "@/lib/game/normalize";

describe("normalizeWord", () => {
  it("lowercases", () => {
    expect(normalizeWord("ASTUTE")).toBe("astute");
    expect(normalizeWord("AsTuTe")).toBe("astute");
  });

  it("trims surrounding whitespace (spaces, tabs, newlines)", () => {
    expect(normalizeWord("  astute  ")).toBe("astute");
    expect(normalizeWord("\tastute\n")).toBe("astute");
    expect(normalizeWord("astute\r")).toBe("astute"); // Windows line endings
  });

  it("collapses inner whitespace but does not glue words together", () => {
    expect(normalizeWord("as    tute")).toBe("as tute");
  });

  it("turns whitespace-only input into an empty string", () => {
    expect(normalizeWord("   ")).toBe("");
    expect(normalizeWord("")).toBe("");
  });
});
