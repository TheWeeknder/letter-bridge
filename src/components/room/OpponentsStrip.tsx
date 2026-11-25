"use client";
// =============================================================================
// OpponentsStrip — the other players' live streaks, shown above your letters
// while you play. Someone who's out is greyed out with a ✕; someone whose
// connection dropped is faded until they're back.
// =============================================================================

import type { RoomState } from "@/lib/multiplayer/room";

export function OpponentsStrip({ room, myId }: { room: RoomState; myId: string }) {
  const opponents = room.players.filter((p) => p.id !== myId);
  if (opponents.length === 0) return null;

  return (
    <ul className="flex flex-wrap justify-center gap-2" aria-label="Other players">
      {opponents.map((p) => {
        const out = p.status === "out";
        return (
          <li
            key={p.id}
            className={
              "flex items-center gap-2 rounded-full px-3 py-1 text-sm " +
              (out ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600" : "bg-zinc-100 dark:bg-zinc-900")
            }
            aria-label={`${p.name}: streak ${p.streak}${out ? ", out" : ""}${p.connected ? "" : ", reconnecting"}`}
            style={p.connected ? undefined : { opacity: 0.5 }}
            title={p.connected ? undefined : "Reconnecting…"}
          >
            <span className={"max-w-24 truncate " + (out ? "line-through" : "")}>{p.name}</span>
            <span className="font-bold tabular-nums">{out ? "✕" : p.streak}</span>
            {out && <span className="font-bold tabular-nums">{p.streak}</span>}
          </li>
        );
      })}
    </ul>
  );
}
