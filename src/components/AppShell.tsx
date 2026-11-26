// =============================================================================
// AppShell — the frame around every screen: a slim bar across the top with
// the "Letter Bridge" wordmark (a link home) and a thin line under it, and
// the current screen centred below.
// Used by the landing page, solo (app/solo) and multiplayer (app/friends,
// app/room/…).
// =============================================================================

import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/* The app's name, small, so each screen's own title ("How to play",
          "Game over") is the clear headline. The bar spans the full width. */}
      <header className="flex h-16 shrink-0 items-center justify-center border-b border-line">
        <h1 className="font-display text-3xl">
          <Link href="/">{APP_NAME}</Link>
        </h1>
      </header>

      {/* The current screen, centred in the space below the bar. */}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
        {children}
      </main>
    </>
  );
}
