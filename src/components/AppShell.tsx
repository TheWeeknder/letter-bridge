// =============================================================================
// AppShell — the frame around every screen: a slim bar across the top with
// the "Weld" wordmark (a link home) and a thin line under it, and
// the current screen below.
// Used by the landing page, solo (app/solo) and multiplayer (app/friends,
// app/room/…).
//
// THE PAGE NEVER SCROLLS: the outer box is exactly as tall as the visible
// screen (--vvh, kept up to date by useVisualViewportHeight; it shrinks when
// the phone keyboard opens). The top bar keeps its size and the screen area
// takes the rest. If a screen is ever taller than that (a long standings
// list), only the screen area scrolls; the top bar stays put.
// =============================================================================

import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME_ENDS } from "@/lib/brand";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    // Exactly the visible height (100dvh until the hook has measured it).
    <div className="flex h-[var(--vvh,100dvh)] flex-col overflow-hidden">
      {/* The app's name, small, so each screen's own title ("How to play",
          "Game over") is the clear headline. shrink-0: never squashed. */}
      <header className="flex h-16 shrink-0 items-center justify-center border-b border-line compact:h-12 tight:h-10">
        <h1 className="font-display text-3xl compact:text-2xl tight:text-xl">
          {/* "Weld" with the W and d in emerald: the start and end letters,
              welded into one word, just like an answer in the game. */}
          <Link href="/">
            <span className="text-accent">{APP_NAME_ENDS.first}</span>
            {APP_NAME_ENDS.middle}
            <span className="text-accent">{APP_NAME_ENDS.last}</span>
          </Link>
        </h1>
      </header>

      {/* The current screen: takes the rest of the height (flex-1), may
          shrink below its content (min-h-0) and then scrolls inside itself.
          justify-center-safe: centred, but if the content is too tall it
          starts at the top instead of being cut off above. The playing
          screen fills this area and lays itself out from the top. */}
      <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col items-center justify-center-safe gap-8 overflow-y-auto px-6 pt-8 pb-4 compact:pt-3 tight:pt-2">
        {children}
      </main>
    </div>
  );
}
