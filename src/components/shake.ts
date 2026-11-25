// =============================================================================
// shake.ts — the "head shaking no" animation, shared by every component that
// shakes (the game-over reason, the answer box on a repeated word).
//
// WHY one file: if we tweak how the shake feels, every shake changes together.
// =============================================================================

/** Move left/right by a few pixels, getting smaller, then stop in the middle. */
export const SHAKE_X = [0, -10, 10, -8, 8, -4, 4, 0];

/** How long one shake takes, in seconds. */
export const SHAKE_DURATION = 0.4;
