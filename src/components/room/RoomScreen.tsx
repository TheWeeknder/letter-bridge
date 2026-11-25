"use client";
// =============================================================================
// RoomScreen — everything on a room page, depending on where you are:
//
//   bad code          -> "that code doesn't look right"
//   no nickname yet   -> NicknameForm
//   connecting        -> "Connecting…"
//   couldn't get in   -> "room is full" / "game already started"
//   lobby             -> Lobby (player list, host picks a time and starts)
//   playing/finished  -> MultiplayerGame (the game, then the results)
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

  const { room, connected, myId, error, start, sendAnswer, sendTimeout, rematch } = useRoom(
    code,
    isValidRoomCode(code) ? nickname : null,
  );
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

  if (!room || !connected) {
    return <p className="text-zinc-500">Connecting to room {code}…</p>;
  }

  const me = room.players.find((p) => p.id === myId);

  // Connected, but the server didn't let us in.
  if (!me) {
    if (error) return <Notice title="Can't join" message={error} />;
    return <p className="text-zinc-500">Joining room {code}…</p>;
  }

  if (room.phase === "lobby") {
    return (
      <Lobby
        code={code}
        room={room}
        myId={myId}
        error={error}
        onStart={start}
        onChangeName={() => setEditingName(true)}
      />
    );
  }

  // The game is on (or just finished).
  if (wordsError) return <Notice title="Couldn't load the words" message={wordsError} />;
  if (!data) return <p className="text-zinc-500">Loading word lists…</p>;
  return (
    <MultiplayerGame
      key={room.seed}
      room={room}
      myId={myId}
      data={data}
      sendAnswer={sendAnswer}
      sendTimeout={sendTimeout}
      onRematch={rematch}
    />
  );
}
