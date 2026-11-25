// =============================================================================
// normalize.ts — turn messy user/file text into one clean, comparable form.
//
// WHY: "  Astute ", "ASTUTE" and "astute" should all count as the same word.
// If every word (from the dictionary AND from the player) passes through this
// one function, comparisons are always apples-to-apples.
// =============================================================================

/**
 * Trim surrounding whitespace, collapse inner runs of whitespace, lowercase.
 * Example: "  AsTute " -> "astute"
 *
 * Note: we do NOT delete spaces inside the text. "as tute" stays "as tute",
 * which the validator later rejects as "not a word". Silently gluing pieces
 * together could accept things the player didn't actually type as one word.
 */
export function normalizeWord(raw: string): string {
  return raw
    .trim() // "  astute  " -> "astute"
    .replace(/\s+/g, " ") // "as    tute" -> "as tute" (tabs/newlines too)
    .toLowerCase(); // "ASTUTE" -> "astute"
}
