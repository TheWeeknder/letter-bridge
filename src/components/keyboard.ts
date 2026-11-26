// =============================================================================
// keyboard.ts — what a tap on the on-screen keyboard does to the answer text.
//
// A plain function (no React), so the rule is easy to read and to test:
//   a letter  -> added to the end (lowercase, like the dictionary)
//   BACKSPACE -> the last letter is removed
// ENTER isn't handled here: the answer box submits the text instead.
// =============================================================================

import { MAX_ANSWER_LENGTH } from "@/lib/game/config";

/** The two special keys; every other key is a single letter "a"–"z". */
export type SpecialKey = "ENTER" | "BACKSPACE";
export type KeyboardKey = SpecialKey | string;

/** The answer text after pressing `key` (ENTER leaves it unchanged). */
export function applyKey(text: string, key: KeyboardKey): string {
  if (key === "BACKSPACE") return text.slice(0, -1);
  if (key === "ENTER") return text;
  if (text.length >= MAX_ANSWER_LENGTH) return text;
  return text + key.toLowerCase();
}
