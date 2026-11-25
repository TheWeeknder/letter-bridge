"use client";
// =============================================================================
// Spectator — for someone in the room without a seat: the room was full, the
// game had already started, or the host removed them. They can still watch:
// the lobby's player list, or the live standings of the game in progress.
// When a running game goes back to the lobby, useRoom takes a seat for them
// automatically; in a full lobby they can try again once someone leaves.
// =============================================================================

import { MAX_PLAYERS } from "@/lib/multiplayer/config";
import type { RoomState } from "@/lib/multiplayer/room";
import { BackLink, Button, ScreenHeader } from "../ui";
import { PlayerList } from "./PlayerList";
import { Standings } from "./Standings";

export interface SpectatorProps {
  code: string;
  room: RoomState;
  reason: string | null; // why we have no seat, as the server said it
  onRetry: () => void; // ask for a seat again
}

export function Spectator({ code, room, reason, onRetry }: SpectatorProps) {
  if (room.phase === "lobby") {
    const full = room.players.length >= MAX_PLAYERS;
    return (
      <section className="flex w-full flex-col items-center gap-8 text-center">
        <ScreenHeader
          title={full ? "This room is full" : `Room ${code}`}
          subtitle={
            full
              ? "You can watch the lobby. A seat frees up when someone leaves."
              : (reason ?? "You're not in this room yet.")
          }
        />
        <PlayerList room={room} myId={null} />
        <Button className="w-full max-w-xs disabled:opacity-40" disabled={full} onClick={onRetry}>
          {full ? "Waiting for a free seat…" : "Join room"}
        </Button>
        <BackLink>Home</BackLink>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <ScreenHeader
        title="You're watching"
        subtitle={
          room.phase === "playing"
            ? "This game started before you joined. You'll get a seat automatically for the next one."
            : "This game just finished. You'll get a seat if the host starts a rematch."
        }
      />
      <Standings room={room} myId={null} title={room.phase === "playing" ? "Live standings" : "Final standings"} />
      <BackLink>Home</BackLink>
    </section>
  );
}
