"use client";
// =============================================================================
// PlayerList — everyone in the room, in one quiet card (same style as the
// high score board): name, "you", who the host is, and who's reconnecting.
// The host also gets a "Remove" button for other players (e.g. someone who
// wandered off and is holding a seat).
// =============================================================================

import { MAX_PLAYERS } from "@/lib/multiplayer/config";
import type { RoomState } from "@/lib/multiplayer/room";
import { LIST_CARD, SectionHeading } from "../ui";

export interface PlayerListProps {
  room: RoomState;
  myId: string | null;
  onKick?: (playerId: string) => void; // only passed for the host
}

export function PlayerList({ room, myId, onKick }: PlayerListProps) {
  return (
    <section className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeading>
        Players ({room.players.length}/{MAX_PLAYERS})
      </SectionHeading>
      <ul className={LIST_CARD}>
        {room.players.map((player) => {
          const isMe = player.id === myId;
          return (
            <li key={player.id} className="flex items-center gap-2 px-4 py-2.5">
              <span
                className={
                  "min-w-0 flex-1 truncate " + (isMe ? "font-bold " : "") + (player.connected ? "" : "text-muted")
                }
              >
                {player.name}
                {isMe && <span className="font-normal text-muted"> (you)</span>}
                {!player.connected && <span className="text-xs font-normal"> reconnecting…</span>}
              </span>
              {player.id === room.hostId && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-text">
                  Host
                </span>
              )}
              {onKick && !isMe && (
                <button
                  type="button"
                  onClick={() => onKick(player.id)}
                  className="text-xs text-muted underline-offset-4 hover:text-danger hover:underline"
                  aria-label={`Remove ${player.name} from the room`}
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
