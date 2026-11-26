"use client";
// =============================================================================
// Standings — every player ranked by points (one per letter of every
// accepted word), in the same quiet card style as the high score board.
// Used while you wait for the others to finish, and on the results screen.
//
// Ties: in Streak whoever lasted longer ranks higher; in Sprint everyone
// stops together, so equal points share the place (1, 1, 3) and every
// winner gets the emerald bar.
// =============================================================================

import { isSprint } from "@/lib/game/modes";
import { scoreFor } from "@/lib/game/scoring";
import { placesFor, rankPlayers, type RoomState } from "@/lib/multiplayer/room";
import { LIST_CARD, SectionHeading } from "../ui";

export function Standings({ room, myId, title }: { room: RoomState; myId: string | null; title: string }) {
  const ranked = rankPlayers(room.players, room.mode);
  const places = placesFor(ranked, room.mode);
  const finished = room.phase === "finished";
  const sprint = room.mode !== null && isSprint(room.mode);

  return (
    <section className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeading>{title}</SectionHeading>
      <ol className={LIST_CARD}>
        {ranked.map((p, i) => {
          const isWinner = finished && places[i] === 1;
          return (
            <li
              key={p.id}
              // Only colour the LEFT border: the top border is the row divider.
              className={
                "flex items-baseline gap-3 border-l-4 px-3 py-2.5 " +
                (isWinner ? "border-l-accent" : "border-l-transparent")
              }
            >
              <span className="w-5 text-sm text-muted tabular-nums">{places[i]}</span>
              <span className={"min-w-0 flex-1 truncate " + (p.id === myId ? "font-bold" : "")}>
                {p.name}
                {p.id === myId && <span className="font-normal text-muted"> (you)</span>}
              </span>
              {!p.connected && p.status === "playing" ? (
                <span className="text-xs text-muted">reconnecting…</span>
              ) : p.status === "playing" ? (
                <span className="text-xs text-accent-text">playing</span>
              ) : (
                !finished && <span className="text-xs text-muted">{sprint ? "done" : "out"}</span>
              )}
              <span className="w-8 text-right font-bold tabular-nums">{scoreFor(p.usedWords)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
