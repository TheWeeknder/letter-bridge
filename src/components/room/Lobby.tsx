"use client";
// =============================================================================
// Lobby — the waiting room before a game: the code, link and QR code to
// share, who's here, and (for the host) the mode (Streak 10s/5s/3s or the
// 30s Sprint), the Start button and removing players.
// =============================================================================

import { useState } from "react";
import type { GameMode } from "@/lib/game/modes";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/multiplayer/config";
import type { RoomState } from "@/lib/multiplayer/room";
import { LetterTile } from "../LetterPair";
import { ModePicker } from "../ModePicker";
import { BackLink, Button, ScreenHeader } from "../ui";
import { PlayerList } from "./PlayerList";
import { RoomQrCode } from "./RoomQrCode";

export interface LobbyProps {
  code: string;
  room: RoomState;
  myId: string;
  error: string | null; // e.g. "You need at least 2 players to start."
  onStart: (mode: GameMode) => void;
  onChangeName: () => void;
  onKick: (playerId: string) => void; // host only
  onLeave: () => void; // free my seat before going home
}

export function Lobby({ code, room, myId, error, onStart, onChangeName, onKick, onLeave }: LobbyProps) {
  const isHost = room.hostId === myId;
  const host = room.players.find((p) => p.id === room.hostId);
  const enoughPlayers = room.players.length >= MIN_PLAYERS;
  // Starts on the mode of the last game in this room (a rematch), else 10s.
  const [mode, setMode] = useState<GameMode>(room.mode ?? 10);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`);
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
        subtitle={`Share the code, link or QR code with up to ${MAX_PLAYERS - 1} friends.`}
      />

      <div className="flex w-full flex-col items-center gap-3">
        {/* The code in letter tiles, like the game's letters. It sits outside
            the narrower max-w-xs column: five tiles need ~330px. */}
        <div className="flex gap-1" role="img" aria-label={`Room code ${[...code].join(" ")}`}>
          {[...code].map((letter, i) => (
            <LetterTile key={i} letter={letter} size="small" />
          ))}
        </div>
        <RoomQrCode code={code} />
        <Button variant="secondary" className="w-full max-w-xs" onClick={copyLink}>
          {copied ? "Link copied!" : "Copy invite link"}
        </Button>
      </div>

      <div className="flex w-full flex-col items-center gap-2">
        <PlayerList room={room} myId={myId} onKick={isHost ? onKick : undefined} />
        <button type="button" onClick={onChangeName} className="text-sm text-muted underline hover:text-foreground">
          Change my nickname
        </button>
      </div>

      {isHost ? (
        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <ModePicker onPick={setMode} selected={mode} />
          <Button className="w-full" disabled={!enoughPlayers} onClick={() => onStart(mode)}>
            Start game
          </Button>
          {!enoughPlayers && <p className="text-sm text-muted">Waiting for at least one more player…</p>}
        </div>
      ) : (
        <p className="text-muted">Waiting for {host?.name ?? "the host"} to start the game…</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <BackLink onClick={onLeave}>Leave room</BackLink>
    </section>
  );
}
