// Tests for validateAnswer() and explainGameOver().
// Most tests use a tiny hand-made dictionary so the expected answer is obvious;
// the last block re-checks the examples from the game rules on the REAL list.
import { describe, expect, it } from "vitest";
import { explainGameOver, explainRepeat, REJECTION_MESSAGES, validateAnswer } from "@/lib/game/validator";
import { readLocalWordData } from "@/lib/node/readLocalWordData";
import type { LetterPair } from "@/lib/game/types";

const AE: LetterPair = { start: "a", end: "e" };
const DICTIONARY = new Set(["astute", "able", "above", "ace", "bite", "ants"]);

/** Shortcut: validate `input` for A…e with optional already-used words. */
function check(input: string, usedWords: string[] = []) {
  return validateAnswer({ input, pair: AE, validation: DICTIONARY, usedWords });
}

describe("validateAnswer: accepted answers", () => {
  it("accepts a real word with the right letters", () => {
    expect(check("astute")).toEqual({ ok: true, word: "astute" });
  });

  it("ignores case and extra whitespace, and returns the clean word", () => {
    expect(check("ASTUTE")).toEqual({ ok: true, word: "astute" });
    expect(check("  AsTute \t")).toEqual({ ok: true, word: "astute" });
  });

  it("accepts a word of exactly the minimum length", () => {
    expect(check("ace")).toEqual({ ok: true, word: "ace" });
  });

  it("accepts a word that wasn't used yet, even if others were", () => {
    expect(check("able", ["astute", "above"])).toEqual({ ok: true, word: "able" });
  });

  it("works if the pair letters are given in uppercase", () => {
    const result = validateAnswer({
      input: "astute",
      pair: { start: "A", end: "E" },
      validation: DICTIONARY,
      usedWords: [],
    });
    expect(result.ok).toBe(true);
  });
});

describe("validateAnswer: each rejection reason", () => {
  it("EMPTY: nothing typed, or only spaces", () => {
    expect(check("")).toEqual({ ok: false, reason: "EMPTY" });
    expect(check("    ")).toEqual({ ok: false, reason: "EMPTY" });
  });

  it("TOO_SHORT: fewer than 3 letters", () => {
    expect(check("a")).toEqual({ ok: false, reason: "TOO_SHORT" });
    expect(check("ae")).toEqual({ ok: false, reason: "TOO_SHORT" });
  });

  it("WRONG_START: first letter doesn't match", () => {
    expect(check("bite")).toEqual({ ok: false, reason: "WRONG_START" });
  });

  it("WRONG_END: last letter doesn't match", () => {
    expect(check("ants")).toEqual({ ok: false, reason: "WRONG_END" });
  });

  it("NOT_A_WORD: right letters, but not in the dictionary", () => {
    expect(check("aeioue")).toEqual({ ok: false, reason: "NOT_A_WORD" });
  });

  it("NOT_A_WORD: inner spaces are not silently removed", () => {
    expect(check("as tute")).toEqual({ ok: false, reason: "NOT_A_WORD" });
  });

  it("ALREADY_USED: repeats are caught regardless of case/spacing", () => {
    expect(check("astute", ["astute"])).toEqual({ ok: false, reason: "ALREADY_USED" });
    expect(check("  ASTUTE ", ["astute"])).toEqual({ ok: false, reason: "ALREADY_USED" });
  });
});

describe("validateAnswer: check order", () => {
  it("reports the first broken rule when several are broken", () => {
    // "xy" is too short AND has the wrong letters -> TOO_SHORT wins.
    expect(check("xy")).toEqual({ ok: false, reason: "TOO_SHORT" });
    // "xyz" has wrong start AND wrong end AND isn't a word -> WRONG_START wins.
    expect(check("xyz")).toEqual({ ok: false, reason: "WRONG_START" });
    // "azz" has the right start but wrong end and isn't a word -> WRONG_END wins.
    expect(check("azz")).toEqual({ ok: false, reason: "WRONG_END" });
  });
});

describe("REJECTION_MESSAGES / explainGameOver", () => {
  it("has a message for every rejection reason", () => {
    for (const message of Object.values(REJECTION_MESSAGES)) {
      expect(message.length).toBeGreaterThan(0);
    }
  });

  it("builds specific sentences using the cleaned word and display letters", () => {
    expect(explainGameOver("NOT_A_WORD", " Aeioue ", AE)).toBe("'aeioue' isn't in the dictionary.");
    expect(explainGameOver("WRONG_START", "bite", AE)).toBe("'bite' doesn't start with A.");
    expect(explainGameOver("WRONG_END", "ants", AE)).toBe("'ants' doesn't end with e.");
    expect(explainGameOver("TOO_SHORT", "ae", AE)).toMatch(/'ae' is too short/);
    expect(explainGameOver("ALREADY_USED", "astute", AE)).toBe("You already used 'astute' in this streak.");
    expect(explainGameOver("EMPTY", "", AE)).toBe(REJECTION_MESSAGES.EMPTY);
    expect(explainGameOver("TIMEOUT", null, AE)).toBe("Time's up!");
  });

  it("builds the repeated-word warning", () => {
    expect(explainRepeat("astute")).toBe("You already used 'astute'. Try another word!");
  });
});

describe("the examples from the game rules (real dictionary)", () => {
  const data = readLocalWordData();
  const real = (input: string) =>
    validateAnswer({ input, pair: AE, validation: data.validation, usedWords: [] });

  it('Start "A", end "e": "Astute" is accepted', () => {
    expect(real("Astute")).toEqual({ ok: true, word: "astute" });
  });

  it('Start "A", end "e": "Aeioue" is rejected as not a word', () => {
    expect(real("Aeioue")).toEqual({ ok: false, reason: "NOT_A_WORD" });
  });

  it("every common word for an eligible pair passes validation", () => {
    for (const { start, end } of data.eligiblePairs) {
      for (const word of data.pairIndex.get(`${start}|${end}`)!) {
        const result = validateAnswer({ input: word, pair: { start, end }, validation: data.validation, usedWords: [] });
        expect(result.ok).toBe(true);
      }
    }
  });
});

describe("the bigger dictionary (ENABLE + SCOWL additions + extra-words.txt)", () => {
  const data = readLocalWordData();

  /** Check a word against the real dictionary, using its own first/last letter. */
  const realWord = (word: string) =>
    validateAnswer({
      input: word,
      pair: { start: word[0], end: word[word.length - 1] },
      validation: data.validation,
      usedWords: [],
    });

  it('accepts "nile", which we added by hand in extra-words.txt', () => {
    expect(realWord("nile")).toEqual({ ok: true, word: "nile" });
  });

  it("accepts newer words that only SCOWL knows", () => {
    for (const word of ["selfie", "blog", "emoji"]) {
      expect(realWord(word)).toEqual({ ok: true, word });
    }
  });

  it("still rejects names, because SCOWL names are left out on purpose", () => {
    // "Brittney" is in SCOWL, but only with a capital letter (it's a name).
    expect(realWord("brittney")).toEqual({ ok: false, reason: "NOT_A_WORD" });
  });

  it("never lets the # comment lines from the files sneak in as words", () => {
    // The header of scowl-additions.txt contains lines like "# Copyright ...".
    // Collect anything that ISN'T plain a–z. The list should be empty.
    const notPlainWords = [...data.validation].filter((word) => !/^[a-z]+$/.test(word));
    expect(notPlainWords).toEqual([]);
  });
});
