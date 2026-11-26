// =============================================================================
// brand.ts — the app's name and colours, in ONE place.
//
// WHY: the name appears in the browser tab, the heading, the phone's home
// screen and the icons. If it's typed out in five files, a rename means
// hunting for all five. Here it's one edit.
// =============================================================================

export const APP_NAME = "Weld";

/**
 * The name's first and last letters, highlighted in the wordmark (AppShell):
 * like the game's start and end letters, they're "welded" into one word.
 */
export const APP_NAME_ENDS = { first: "W", middle: "el", last: "d" } as const;

export const APP_DESCRIPTION =
  "Type a word that starts and ends with the given letters before time runs out.";

/** The game's green (Tailwind's emerald-500), used for icons and buttons. */
export const BRAND_COLOR = "#10b981";

/** Page backgrounds, matching --background in globals.css. */
export const BACKGROUND_LIGHT = "#ffffff";
export const BACKGROUND_DARK = "#121213";
