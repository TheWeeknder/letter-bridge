"use client";
// =============================================================================
// VisualViewportSync — an invisible helper placed once in layout.tsx. It only
// runs useVisualViewportHeight (keeps --vvh = the visible screen height, so
// the page fits above the phone keyboard). It's a separate component because
// layout.tsx runs on the server, and hooks need a client component.
// =============================================================================

import { useVisualViewportHeight } from "@/hooks/useVisualViewportHeight";

export function VisualViewportSync() {
  useVisualViewportHeight();
  return null; // draws nothing
}
