"use client";
// =============================================================================
// useRoom.ts — connect to a multiplayer room and keep its state up to date.
//
// partysocket opens a WebSocket to the room server (party/server.ts) and
// reconnects automatically if the connection drops. The server sends the
// whole room state after every change, so this hook just stores the latest.
//
// WHO YOU ARE: each browser tab gets a secret token (kept in sessionStorage,
// so it survives a page reload but two tabs are two players). It's sent with
// the nickname in the connection URL every time partysocket (re)connects, so
// after a reload or a dropped connection the server puts you straight back in
// your seat. The server answers with "welcome" and your public player id.
//
// SERVER CLOCK: every state message carries the server's time. We keep the
// difference to this device's clock (serverOffset), so a player who reloads
// mid-sprint can work out how much of the shared 30 seconds is left.
//
// WHERE is the server? NEXT_PUBLIC_PARTY_HOST (e.g. letter-bridge-rooms.
// you.workers.dev) once deployed. Without it, we use port 8787 on the same
// machine the page came from, which is where `npm run party:dev` listens.
// =============================================================================

import usePartySocket from "partysocket/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMode } from "@/lib/game/modes";
import { ROOM_PARTY } from "@/lib/multiplayer/config";
import { type ClientMessage, encodeMessage, parseServerMessage } from "@/lib/multiplayer/protocol";
import type { RoomState } from "@/lib/multiplayer/room";

const TOKEN_KEY = "letter-bridge:player-token";

/** The room server's address (host and port, no protocol). */
function partyHost(): string {
  if (process.env.NEXT_PUBLIC_PARTY_HOST) return process.env.NEXT_PUBLIC_PARTY_HOST;
  // During the server render there's no window; the socket only opens in the browser anyway.
  return typeof window === "undefined" ? "localhost:8787" : `${window.location.hostname}:8787`;
}

/**
 * How far the server's clock is ahead of this device's (ms), from a message
 * stamped with the server time. (Called from the message handler; it lives
 * out here because reading the clock isn't allowed while React renders.)
 */
function clockOffset(serverNow: number): number {
  return serverNow - Date.now();
}

// Used only if sessionStorage is blocked: a token for this page load.
let fallbackToken: string | null = null;

/** This tab's secret player token, created on first use. */
function playerToken(): string {
  try {
    let token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    fallbackToken ??= crypto.randomUUID(); // storage blocked: a reload means a new seat
    return fallbackToken;
  }
}

export interface UseRoomResult {
  room: RoomState | null; // null until the server's first message
  connected: boolean;
  myId: string | null; // my public player id; null until I have a seat
  error: string | null; // the last thing the server refused, e.g. "This room is full"
  serverOffset: number; // server clock minus this device's clock (ms), from the latest state message
  start: (mode: GameMode) => void; // host only
  sendAnswer: (round: number, input: string) => void; // report an answer for round `round`
  sendTimeout: (round: number) => void; // report that time ran out on round `round`
  rematch: () => void; // host only: back to the lobby
  retryJoin: () => void; // ask for a seat again (e.g. after "room is full")
  leave: () => void; // free my seat now (before navigating away)
  kick: (playerId: string) => void; // host only: remove a player
}

/**
 * @param code      the room code, e.g. "KBXQM"
 * @param nickname  null = don't connect yet (still choosing a name)
 */
export function useRoom(code: string, nickname: string | null): UseRoomResult {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverOffset, setServerOffset] = useState(0);

  // Read at every (re)connect by the query function below, so it always uses
  // the CURRENT nickname (partysocket keeps the first function it was given).
  const nicknameRef = useRef(nickname);
  const myIdRef = useRef<string | null>(null);
  const lastPhaseRef = useRef<RoomState["phase"] | null>(null);
  useEffect(() => {
    nicknameRef.current = nickname;
  }, [nickname]);

  const socket = usePartySocket({
    host: partyHost(),
    party: ROOM_PARTY,
    room: code,
    enabled: nickname !== null,
    query: () => ({ token: playerToken(), name: nicknameRef.current ?? "" }),
    onOpen: () => setConnected(true),
    onClose: () => setConnected(false),
    onMessage: (event: MessageEvent) => {
      const message = parseServerMessage(event.data);
      if (!message) return;
      switch (message.type) {
        case "welcome":
          myIdRef.current = message.playerId;
          setMyId(message.playerId);
          setError(null);
          break;
        case "state": {
          const next = message.state;
          const seated = next.players.some((p) => p.id === myIdRef.current);
          // Watching a game I couldn't join? When it returns to the lobby, take a seat.
          if (!seated && next.phase === "lobby" && lastPhaseRef.current && lastPhaseRef.current !== "lobby") {
            socket.send(encodeMessage({ type: "join", name: nicknameRef.current ?? "" }));
          }
          lastPhaseRef.current = next.phase;
          setServerOffset(clockOffset(message.now));
          setRoom(next);
          break;
        }
        case "error":
          setError(message.message);
          break;
      }
    },
  });

  const send = useCallback((message: ClientMessage) => socket.send(encodeMessage(message)), [socket]);

  // Changing the nickname while connected renames me (no reconnect needed).
  const sentNameRef = useRef(nickname);
  useEffect(() => {
    if (connected && nickname && nickname !== sentNameRef.current) send({ type: "join", name: nickname });
    sentNameRef.current = nickname;
  }, [connected, nickname, send]);

  /** Send something the user asked for, forgetting the previous complaint. */
  const request = useCallback(
    (message: ClientMessage) => {
      setError(null);
      send(message);
    },
    [send],
  );

  const start = useCallback((mode: GameMode) => request({ type: "start", mode }), [request]);
  const sendAnswer = useCallback((round: number, input: string) => send({ type: "answer", round, input }), [send]);
  const sendTimeout = useCallback((round: number) => send({ type: "timeout", round }), [send]);
  const rematch = useCallback(() => request({ type: "rematch" }), [request]);
  const retryJoin = useCallback(() => request({ type: "join", name: nicknameRef.current ?? "" }), [request]);
  const leave = useCallback(() => send({ type: "leave" }), [send]);
  const kick = useCallback((playerId: string) => request({ type: "kick", playerId }), [request]);

  return { room, connected, myId, error, serverOffset, start, sendAnswer, sendTimeout, rematch, retryJoin, leave, kick };
}
