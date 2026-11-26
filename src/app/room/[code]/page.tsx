// =============================================================================
// room/[code]/page.tsx — a multiplayer room, e.g. /room/KBXQM.
//
// The room code is only known when someone visits, so (with Cache Components
// on) it's read inside <Suspense>: Next.js serves the frame straight away and
// fills in the room once it has the code. Everything else happens in the
// browser, in <RoomScreen>.
// =============================================================================

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { RoomScreen } from "@/components/room/RoomScreen";

export default function RoomPage({ params }: PageProps<"/room/[code]">) {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-muted">Loading room…</p>}>
        {params.then(({ code }) => (
          <RoomScreen code={code} />
        ))}
      </Suspense>
    </AppShell>
  );
}
