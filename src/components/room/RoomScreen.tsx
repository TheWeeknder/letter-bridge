"use client";
// =============================================================================
// RoomScreen — everything on a room page, depending on where you are:
//
//   bad code          -> "that code doesn't look right"
//   no nickname yet   -> NicknameForm
//   connecting        -> "Connecting…"
//   no seat           -> Spectator (room full / game already running / removed)
//   lobby             -> Lobby (player list, host picks a mode and starts)
//   playing/finished  -> MultiplayerGame (the game, then the results)
//
// If the connection drops, the current screen stays put with a small
// "Reconnecting…" banner, so a game in progress isn't interrupted. When the
// connection is back, the server puts you straight back in your seat.
// =============================================================================

import { useState } from "react";
import { useNickname } from "@/hooks/useNickname";
import { useRoom } from "@/hooks/useRoom";
import { useWordData } from "@/hooks/useWordData";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/multiplayer/roomCode";
import { LinkButton, ScreenHeader } from "../ui";
import { Lobby } from "./Lobby";
import { MultiplayerGame } from "./MultiplayerGame";
import { NicknameForm } from "./NicknameForm";
import { Spectator } from "./Spectator";

/** A short message with a way back home. */
function Notice({ title, message }: { title: string; message: string }) {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <ScreenHeader title={title} subtitle={message} />
      <LinkButton href="/" variant="secondary" className="w-full max-w-xs">
        Home
      </LinkButton>
    </section>
  );
}

export function RoomScreen({ code: rawCode }: { code: string }) {
  const code = normalizeRoomCode(rawCode);
  const { nickname: savedNickname, setNickname } = useNickname();
  // If storage is blocked the saved nickname never appears, so also keep the
  // name typed in THIS visit.
  const [typedNickname, setTypedNickname] = useState<string | null>(null);
  const nickname = typedNickname ?? savedNickname;
  // Changing your name keeps you connected: the server just renames you.
  const [editingName, setEditingName] = useState(false);

  const roomApi = useRoom(code, isValidRoomCode(code) ? nickname : null);
  const { room, connected, myId, error, serverOffset } = roomApi;
  // Start downloading the word lists right away, while people gather in the lobby.
  const { data, error: wordsError } = useWordData();

  if (!isValidRoomCode(code)) {
    return <Notice title="Room not found" message={`"${rawCode}" doesn't look like a room code.`} />;
  }

  if (nickname === null || editingName) {
    return (
      <NicknameForm
        code={code}
        initialName={nickname ?? ""}
        onSubmit={(name) => {
          setNickname(name);
          setTypedNickname(name);
          setEditingName(false);
        }}
      />
    );
  }

  if (!room) return <p className="text-zinc-500">Connecting to room {code}…</p>;

  const banner = !connected && (
    <p role="status" className="rounded-full bg-amber-500/15 px-3 py-1 text-sm text-amber-800 dark:text-amber-300">
      Connection lost. Reconnecting…
    </p>
  );

  const me = room.players.find((p) => p.id === myId);

  // Connected, but no seat: watch instead (room full, game already running, removed…).
  if (!me) {
    if (!error && connected && room.phase === "lobby") return <p className="text-zinc-500">Joining room {code}…</p>;
    return (
      <>
        {banner}
        <Spectator code={code} room={room} reason={error} onRetry={roomApi.retryJoin} />
      </>
    );
  }

  if (room.phase === "lobby") {
    return (
      <>
        {banner}
        <Lobby
          code={code}
          room={room}
          myId={me.id}
          error={error}
          onStart={roomApi.start}
          onChangeName={() => setEditingName(true)}
          onKick={roomApi.kick}
          onLeave={roomApi.leave}
        />
      </>
    );
  }

  // The game is on (or just finished).
  if (wordsError) return <Notice title="Couldn't load the words" message={wordsError} />;
  if (!data) return <p className="text-zinc-500">Loading word lists…</p>;
  return (
    <>
      {banner}
      <MultiplayerGame
        key={room.seed}
        room={room}
        myId={me.id}
        data={data}
        serverOffset={serverOffset}
        sendAnswer={roomApi.sendAnswer}
        sendTimeout={roomApi.sendTimeout}
        onRematch={roomApi.rematch}
        onLeave={roomApi.leave}
      />
    </>
  );
}
