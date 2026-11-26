// =============================================================================
// page.tsx — the landing page ("/"): what the game is, and two ways in.
//
//   Play solo          -> /solo     (pick a mode: Streak or Sprint, and go)
//   Play with friends  -> /friends  (create a room or join one with a code)
//
// Nothing here needs the browser, so this page is plain HTML that loads
// instantly. The word lists only start downloading once you pick a mode.
// =============================================================================

import { AppShell } from "@/components/AppShell";
import { LetterTile } from "@/components/LetterPair";
import { LinkButton, ScreenHeader } from "@/components/ui";

export default function Home() {
  return (
    <AppShell>
      <section className="flex w-full flex-col items-center gap-10 text-center">
        {/* The "A … e" idea at a glance, with the same tiles as the game screen. */}
        <div className="flex items-center gap-3" aria-hidden>
          <LetterTile letter="A" size="small" />
          <span className="text-2xl text-muted">…</span>
          <LetterTile letter="e" size="small" />
        </div>

        <ScreenHeader
          title="How to play"
          subtitle={
            <>
              Type a word that <strong className="text-foreground">starts</strong> with the first letter and{" "}
              <strong className="text-foreground">ends</strong> with the second, before time runs out. Play a{" "}
              <strong className="text-foreground">streak</strong> or a 30-second{" "}
              <strong className="text-foreground">sprint</strong>.{" "}
              <strong className="text-foreground">Longer words score more points.</strong>
            </>
          }
        />

        <nav className="flex w-full max-w-xs flex-col gap-3" aria-label="Choose a mode">
          <LinkButton href="/solo">Play solo</LinkButton>
          <LinkButton href="/friends" variant="secondary">
            Play with friends
          </LinkButton>
        </nav>
      </section>
    </AppShell>
  );
}
