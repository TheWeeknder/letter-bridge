// =============================================================================
// friends/page.tsx — multiplayer's front door ("/friends"): create a new room
// or join a friend's room with their code. Both lead to /room/<CODE>.
// =============================================================================

import { AppShell } from "@/components/AppShell";
import { PlayWithFriends } from "@/components/PlayWithFriends";
import { BackLink, ScreenHeader } from "@/components/ui";
import { MAX_PLAYERS } from "@/lib/multiplayer/config";

export default function FriendsPage() {
  return (
    <AppShell>
      <section className="flex w-full flex-col items-center gap-8 text-center">
        <ScreenHeader
          title="Play with friends"
          subtitle={`Race up to ${MAX_PLAYERS - 1} friends on the same letters. Longer words score more; most points wins.`}
        />
        <PlayWithFriends />
        <BackLink />
      </section>
    </AppShell>
  );
}
