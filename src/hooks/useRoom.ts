"use client";
// =============================================================================
// useRoom.ts — connect to a multiplayer room and keep its state up to date.
//
// partysocket opens a WebSocket to the room server (party/server.ts) and
// reconnects automatically if the connection drops. The server sends the
// whole room state after every change, so this hook just stores the latest.
//
// WHERE is the server? NEXT_PUBLIC_PARTY_HOST (e.g. letter-bridge-rooms.
// you.workers.dev) once deployed. Without it, we use port 8787 on the same
// machine the page came from, which is where `npm run party:dev` listens.
// =============================================================================

import usePartySocket from "partysocket/react";
import { useCallback, useEffect, useState } from "react";
import type { TimeLimit } from "@/lib/game/config";
import { ROOM_PARTY } from "@/lib/multiplayer/config";
import { type ClientMessage, encodeMessage, parseServerMessage } from "@/lib/multiplayer/protocol";
import type { RoomState } from "@/lib/multiplayer/room";

/** The room server's address (host and port, no protocol). */
function partyHost(): string {
  if (process.env.NEXT_PUBLIC_PARTY_HOST) return process.env.NEXT_PUBLIC_PARTY_HOST;
  // During the server render there's no window; the socket only opens in the browser anyway.
  return typeof window === "undefined" ? "localhost:8787" : `${window.location.hostname}:8787`;
}

export interface UseRoomResult {
  room: RoomState | null; // null until the server's first message
  connected: boolean;
  myId: string; // this browser's id in the room (matches RoomPlayer.id)
  error: string | null; // the last thing the server refused, e.g. "This room is full"
  start: (timeLimit: TimeLimit) => void; // host only
  sendAnswer: (round: number, input: string) => void; // report an answer for round `round`
  sendTimeout: (round: number) => void; // report that time ran out on round `round`
  rematch: () => void; // host only: back to the lobby
}

/**
 * @param code      the room code, e.g. "KBXQM"
 * @param nickname  null = don't connect yet (still choosing a name)
 */
export function useRoom(code: string, nickname: string | null): UseRoomResult {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socket = usePartySocket({
    host: partyHost(),
    party: ROOM_PARTY,
    room: code,
    enabled: nickname !== null,
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage: (event: MessageEvent) => {
      const message = parseServerMessage(event.data);
      if (message?.type === "state") setRoom(message.state);
      if (message?.type === "error") setError(message.message);
    },
  });

  const send = useCallback((message: ClientMessage) => socket.send(encodeMessage(message)), [socket]);

  // Join once connected, and again after every reconnect (the server treats a
  // reconnect as a new arrival) or when the nickname changes.
  useEffect(() => {
    if (connected && nickname) send({ type: "join", name: nickname });
  }, [connected, nickname, send]);

  const start = useCallback(
    (timeLimit: TimeLimit) => {
      setError(null); // a new request: forget the old complaint
      send({ type: "start", timeLimit });
    },
    [send],
  );

  const sendAnswer = useCallback((round: number, input: string) => send({ type: "answer", round, input }), [send]);
  const sendTimeout = useCallback((round: number) => send({ type: "timeout", round }), [send]);
  const rematch = useCallback(() => {
    setError(null);
    send({ type: "rematch" });
  }, [send]);

  return { room, connected, myId: socket.id, error, start, sendAnswer, sendTimeout, rematch };
}
