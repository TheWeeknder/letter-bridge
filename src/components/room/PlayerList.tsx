"use client";
// =============================================================================
// PlayerList — everyone in the room, in one quiet card (same style as the
// high score board): name, "you", and who the host is.
// =============================================================================

import { MAX_PLAYERS } from "@/lib/multiplayer/config";
import type { RoomState } from "@/lib/multiplayer/room";
import { SectionHeading } from "../ui";

export function PlayerList({ room, myId }: { room: RoomState; myId: string }) {
  return (
    <section className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeading>
        Players ({room.players.length}/{MAX_PLAYERS})
      </SectionHeading>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl bg-zinc-100 text-left dark:divide-zinc-800 dark:bg-zinc-900">
        {room.players.map((player) => (
          <li key={player.id} className="flex items-center gap-2 px-4 py-2.5">
            <span className={"min-w-0 flex-1 truncate " + (player.id === myId ? "font-bold" : "")}>
              {player.name}
              {player.id === myId && <span className="font-normal text-zinc-500"> (you)</span>}
            </span>
            {player.id === room.hostId && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Host
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
