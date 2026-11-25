// Tests for parseWordList() and buildWordData(), using tiny fake word lists
// so every expected result can be worked out by hand.
import { describe, expect, it } from "vitest";
import { buildWordData, parseWordList } from "@/lib/game/wordLists";

describe("parseWordList", () => {
  it("splits lines, normalizes, and keeps order", () => {
    expect(parseWordList("Apple\nbanana\n  Cherry  ")).toEqual(["apple", "banana", "cherry"]);
  });

  it("handles Windows (\\r\\n) line endings", () => {
    expect(parseWordList("apple\r\nbanana\r\n")).toEqual(["apple", "banana"]);
  });

  it("drops words shorter than 3 letters and blank lines", () => {
    expect(parseWordList("a\nan\nant\n\n")).toEqual(["ant"]);
  });

  it("drops anything that isn't plain letters a-z", () => {
    expect(parseWordList("don't\ne-mail\nmp3\ntwo words\nfine")).toEqual(["fine"]);
  });

  it("removes duplicates (including ones that only differ by case)", () => {
    expect(parseWordList("cat\nCAT\ncat")).toEqual(["cat"]);
  });

  it("skips # comment lines, so word files can contain notes", () => {
    expect(parseWordList("# my notes about this file\n#\nnile\n# another note")).toEqual(["nile"]);
  });

  it("merges several files glued together, counting shared words once", () => {
    // This is how the game combines enable1.txt + scowl-additions.txt + extra-words.txt.
    const fileA = "apple\nbanana";
    const fileB = "banana\ncherry";
    expect(parseWordList([fileA, fileB].join("\n"))).toEqual(["apple", "banana", "cherry"]);
  });
});

describe("buildWordData", () => {
  const dictionary = ["able", "above", "acre", "ant", "and", "bee"].join("\n");
  // "usa" is a common "word" that ISN'T in the dictionary -> must be dropped.
  const common = ["above", "usa", "able", "ant", "acre"].join("\n");

  it("puts every dictionary word in the validation set", () => {
    const data = buildWordData(dictionary, common, 2);
    expect(data.validation.has("bee")).toBe(true);
    expect(data.validation.has("usa")).toBe(false);
  });

  it("keeps only common words that are also in the dictionary, in order", () => {
    const data = buildWordData(dictionary, common, 2);
    expect(data.generation).toEqual(["above", "able", "ant", "acre"]);
  });

  it("builds the pair index from the common words only", () => {
    const data = buildWordData(dictionary, common, 2);
    expect(data.pairIndex.get("a|e")).toEqual(["above", "able", "acre"]);
    expect(data.pairIndex.get("a|t")).toEqual(["ant"]);
    expect(data.pairIndex.has("a|d")).toBe(false); // "and" is not a common word here
    expect(data.pairIndex.has("b|e")).toBe(false); // "bee" is not a common word here
  });

  it("only marks pairs with enough words as eligible", () => {
    expect(buildWordData(dictionary, common, 2).eligiblePairs).toEqual([{ start: "a", end: "e" }]);
    expect(buildWordData(dictionary, common, 1).eligiblePairs).toEqual([
      { start: "a", end: "e" },
      { start: "a", end: "t" },
    ]);
    expect(buildWordData(dictionary, common, 4).eligiblePairs).toEqual([]);
  });
});
