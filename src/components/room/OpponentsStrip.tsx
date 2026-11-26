"use client";
// =============================================================================
// OpponentsStrip — the other players' live points, shown above your letters
// while you play, as small outlined chips. In Streak, someone who's out is
// greyed out with a ✕ (in Sprint nobody is knocked out, so the count simply
// stays). Someone whose connection dropped is faded until they're back.
// =============================================================================

import { isSprint } from "@/lib/game/modes";
import { scoreFor } from "@/lib/game/scoring";
import type { RoomState } from "@/lib/multiplayer/room";

export function OpponentsStrip({ room, myId }: { room: RoomState; myId: string }) {
  const opponents = room.players.filter((p) => p.id !== myId);
  if (opponents.length === 0) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-label="Other players">
      {opponents.map((p) => {
        // A sprint has no knock-outs: someone whose time is up just keeps their count.
        const out = p.status === "out" && !(room.mode !== null && isSprint(room.mode));
        return (
          <li
            key={p.id}
            className={
              "flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm " + (out ? "text-muted" : "")
            }
            aria-label={`${p.name}: ${scoreFor(p.usedWords)} points${out ? ", out" : ""}${p.connected ? "" : ", reconnecting"}`}
            style={p.connected ? undefined : { opacity: 0.5 }}
            title={p.connected ? undefined : "Reconnecting…"}
          >
            <span className={"max-w-24 truncate " + (out ? "line-through" : "")}>{p.name}</span>
            <span className="font-bold tabular-nums">{out ? "✕" : scoreFor(p.usedWords)}</span>
            {out && <span className="font-bold tabular-nums">{scoreFor(p.usedWords)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
