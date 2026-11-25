// =============================================================================
// AppShell — the frame around every screen: the small "Letter Bridge"
// wordmark at the top (a link home), and the current screen centred below it.
// Used by the solo game (app/page.tsx) and multiplayer rooms (app/room/…).
// =============================================================================

import Link from "next/link";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/brand";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-6 pb-10">
      {/* The app's name: a small wordmark at the top, so each screen's own
          title ("How to play", "Game over") is the clear headline. */}
      <header className="text-center">
        <h1 className="text-lg font-bold">
          <Link href="/">{APP_NAME}</Link>
        </h1>
      </header>

      {/* The current screen, centred in the space below the wordmark. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">{children}</div>
    </main>
  );
}
