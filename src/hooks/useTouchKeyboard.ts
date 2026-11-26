"use client";
// =============================================================================
// useTouchKeyboard.ts — should the game use its own on-screen keyboard?
//
// Yes on phones and tablets: their built-in keyboard slides up over the page
// and hides the letters and the timer. No on computers: they type on a real
// keyboard and don't need extra keys on screen.
//
// HOW: the CSS media query "(pointer: coarse)" is true when the main way to
// point is a finger. A touchscreen laptop used with a mouse counts as "fine",
// so it keeps the normal behaviour and nobody is left unable to type.
//
// useSyncExternalStore reads the media query and re-renders if it changes
// (e.g. a tablet gets a mouse). The server can't know, so it says "no".
// =============================================================================

import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

/** True when the game should show its own keyboard (touch screens). */
export function useTouchKeyboard(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
