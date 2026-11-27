// =============================================================================
// AppShell — the frame around every screen: a slim bar across the top with
// the "Weld" wordmark (a link home) and a thin line under it, and
// the current screen centred below.
// Used by the landing page, solo (app/solo) and multiplayer (app/friends,
// app/room/…).
// =============================================================================

import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME_ENDS } from "@/lib/brand";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* The app's name, small, so each screen's own title ("How to play",
          "Game over") is the clear headline. The bar spans the full width. */}
      <header className="flex h-16 shrink-0 items-center justify-center border-b border-line compact:h-12">
        <h1 className="font-display text-3xl compact:text-2xl">
          {/* "Weld" with the W and d in emerald: the start and end letters,
              welded into one word, just like an answer in the game. */}
          <Link href="/">
            <span className="text-accent">{APP_NAME_ENDS.first}</span>
            {APP_NAME_ENDS.middle}
            <span className="text-accent">{APP_NAME_ENDS.last}</span>
          </Link>
        </h1>
      </header>

      {/* The current screen, centred in the space below the bar. */}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 px-6 pt-8 pb-4 compact:pt-3">
        {children}
      </main>
    </>
  );
}
