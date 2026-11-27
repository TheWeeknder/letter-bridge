"use client";
// =============================================================================
// useVisualViewportHeight — keeps the page exactly as tall as the part of the
// screen you can actually SEE, even while the phone keyboard is open.
//
// WHY: on iPhones, opening the keyboard does NOT make the page shorter.
// Safari just covers the bottom with the keyboard and scrolls the page to
// show the text box, pushing the "Weld" bar and the score off the top.
//
// HOW:
//   1. window.visualViewport.height = the visible height (it shrinks when the
//      keyboard opens). We copy it into the CSS variable --vvh on <html>.
//   2. AppShell's outer box uses h-[var(--vvh,100dvh)], so the whole page
//      shrinks to fit above the keyboard and has nothing to scroll.
//   3. window.scrollTo(0, 0) undoes the scroll Safari does on its own.
//   4. When very little is visible (TIGHT_HEIGHT), <html> gets data-tight,
//      which the `tight:` classes use to squeeze the playing screen further.
//
// Browsers without visualViewport (very old ones) skip all this; the CSS
// falls back to 100dvh.
// =============================================================================

import { useEffect } from "react";

/** Below this visible height (px), the page counts as "tight" (see above). */
const TIGHT_HEIGHT = 420;

export function useVisualViewportHeight() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;

    function update() {
      if (!viewport) return;
      // The visible height, in pixels, for the CSS to use.
      root.style.setProperty("--vvh", `${viewport.height}px`);
      // Very little room (keyboard open on a small phone)? Squeeze harder.
      root.toggleAttribute("data-tight", viewport.height < TIGHT_HEIGHT);
      // Undo Safari's auto-scroll. Skipped while the player has pinch-zoomed
      // in (scale > 1), so we never fight someone zooming to read.
      if (viewport.scale <= 1) window.scrollTo(0, 0);
    }

    update(); // set it once straight away
    // "resize": the keyboard opened or closed, or the phone was rotated.
    // "scroll": Safari moved the page to show the text box.
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--vvh");
      root.removeAttribute("data-tight");
    };
  }, []);
}
