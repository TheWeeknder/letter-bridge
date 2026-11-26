"use client";
// =============================================================================
// Standings — every player ranked by score, in the same quiet card style as
// the high score board. Used while you wait for the others to finish, and on
// the results screen.
//
// Ties: in Streak whoever lasted longer ranks higher; in Sprint everyone
// stops together, so equal word counts share the place (1, 1, 3) and every
// winner gets the emerald bar.
// =============================================================================

import { isSprint } from "@/lib/game/modes";
import { placesFor, rankPlayers, type RoomState } from "@/lib/multiplayer/room";
import { SectionHeading } from "../ui";

export function Standings({ room, myId, title }: { room: RoomState; myId: string | null; title: string }) {
  const ranked = rankPlayers(room.players, room.mode);
  const places = placesFor(ranked, room.mode);
  const finished = room.phase === "finished";
  const sprint = room.mode !== null && isSprint(room.mode);

  return (
    <section className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeading>{title}</SectionHeading>
      <ol className="divide-y divide-zinc-200 overflow-hidden rounded-xl bg-zinc-100 text-left dark:divide-zinc-800 dark:bg-zinc-900">
        {ranked.map((p, i) => {
          const isWinner = finished && places[i] === 1;
          return (
            <li
              key={p.id}
              // Only colour the LEFT border: the top border is the row divider.
              className={
                "flex items-baseline gap-3 border-l-4 px-3 py-2.5 " +
                (isWinner ? "border-l-emerald-500" : "border-l-transparent")
              }
            >
              <span className="w-5 text-sm text-zinc-500 tabular-nums">{places[i]}</span>
              <span className={"min-w-0 flex-1 truncate " + (p.id === myId ? "font-bold" : "")}>
                {p.name}
                {p.id === myId && <span className="font-normal text-zinc-500"> (you)</span>}
              </span>
              {!p.connected && p.status === "playing" ? (
                <span className="text-xs text-zinc-500">reconnecting…</span>
              ) : p.status === "playing" ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">playing</span>
              ) : (
                !finished && <span className="text-xs text-zinc-500">{sprint ? "done" : "out"}</span>
              )}
              <span className="w-6 text-right font-bold tabular-nums">{p.streak}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
