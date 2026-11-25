"use client";
// =============================================================================
// Lobby — the waiting room before a game: the code to share, who's here, and
// (for the host) the time limit and the Start button.
// =============================================================================

import { useState } from "react";
import type { TimeLimit } from "@/lib/game/config";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/multiplayer/config";
import type { RoomState } from "@/lib/multiplayer/room";
import { TimeLimitPicker } from "../TimeLimitPicker";
import { Button, ScreenHeader, SectionHeading } from "../ui";
import { PlayerList } from "./PlayerList";

export interface LobbyProps {
  code: string;
  room: RoomState;
  myId: string;
  error: string | null; // e.g. "You need at least 2 players to start."
  onStart: (timeLimit: TimeLimit) => void;
  onChangeName: () => void;
}

export function Lobby({ code, room, myId, error, onStart, onChangeName }: LobbyProps) {
  const isHost = room.hostId === myId;
  const host = room.players.find((p) => p.id === room.hostId);
  const enoughPlayers = room.players.length >= MIN_PLAYERS;
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(room.timeLimit ?? 10);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. not HTTPS): the code is on screen to read out.
    }
  }

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <ScreenHeader
        title="Waiting room"
        subtitle={`Share the code or link with up to ${MAX_PLAYERS - 1} friends.`}
      />

      <div className="flex w-full max-w-xs flex-col items-center gap-3">
        <div className="text-4xl font-bold tracking-[0.3em] tabular-nums" aria-label={`Room code ${[...code].join(" ")}`}>
          {code}
        </div>
        <Button variant="secondary" className="w-full" onClick={copyLink}>
          {copied ? "Link copied!" : "Copy invite link"}
        </Button>
      </div>

      <div className="flex w-full flex-col items-center gap-2">
        <PlayerList room={room} myId={myId} />
        <button type="button" onClick={onChangeName} className="text-sm text-zinc-500 underline hover:text-foreground">
          Change my nickname
        </button>
      </div>

      {isHost ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-3">
          <SectionHeading>Seconds per word</SectionHeading>
          <TimeLimitPicker onPick={setTimeLimit} selected={timeLimit} />
          <Button className="w-full disabled:opacity-40" disabled={!enoughPlayers} onClick={() => onStart(timeLimit)}>
            Start game
          </Button>
          {!enoughPlayers && <p className="text-sm text-zinc-500">Waiting for at least one more player…</p>}
        </div>
      ) : (
        <p className="text-zinc-500">Waiting for {host?.name ?? "the host"} to start the game…</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}
