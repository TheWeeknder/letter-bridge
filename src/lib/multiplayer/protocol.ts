// =============================================================================
// protocol.ts — the messages the browser and the room server send each other.
//
// Messages travel as JSON text over a WebSocket. Both sides import these
// types, so a typo in a message name is a compile error instead of a silent
// bug. Anything arriving from the network is CHECKED before it's trusted
// (parseClientMessage / parseServerMessage): a broken or hostile message is
// simply ignored instead of crashing the room.
//
// WHO YOU ARE travels in the connection URL, not in a message:
//   wss://…/parties/letter-room/KBXQM?token=<secret>&name=Ann
// so the server knows (and seats) you before any message arrives, even
// messages partysocket queued while the connection was down. The token is a
// secret per browser tab; the server gives each player a separate PUBLIC id,
// so seeing someone's id in the room list doesn't let you take their seat.
// =============================================================================

import { type GameMode, isGameMode } from "../game/modes";
import type { RoomState } from "./room";

/** Browser -> server. */
export type ClientMessage =
  | { type: "join"; name: string } // join (or try again), or change your nickname
  | { type: "leave" } // leaving on purpose: free my seat now
  | { type: "kick"; playerId: string } // host only: remove a player
  | { type: "start"; mode: GameMode } // host only: begin the game in this mode
  | { type: "answer"; round: number; input: string } // an answer for round `round` (= your streak)
  | { type: "timeout"; round: number } // your timer ran out on round `round`
  | { type: "rematch" }; // host only: back to the lobby for another game

/** Server -> browser. */
export type ServerMessage =
  | { type: "welcome"; playerId: string } // you have a seat; this is your public id
  | { type: "state"; state: RoomState; now: number } // the whole room after every change, and the server's clock (ms) when sent
  | { type: "error"; message: string }; // something you asked for was refused

/** Turn a message into text for the WebSocket. */
export function encodeMessage(message: ClientMessage | ServerMessage): string {
  return JSON.stringify(message);
}

/** Parse JSON without throwing: broken text just becomes null. */
function parseJson(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string") return null;
  try {
    const value: unknown = JSON.parse(raw);
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isRound(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

/** Check a message from a browser (run on the server). Null = ignore it. */
export function parseClientMessage(raw: unknown): ClientMessage | null {
  const data = parseJson(raw);
  if (!data) return null;
  switch (data.type) {
    case "join":
      return typeof data.name === "string" && data.name.length <= 200 ? { type: "join", name: data.name } : null;
    case "start":
      return isGameMode(data.mode) ? { type: "start", mode: data.mode } : null;
    case "answer":
      return isRound(data.round) && typeof data.input === "string" && data.input.length <= 100
        ? { type: "answer", round: data.round, input: data.input }
        : null;
    case "timeout":
      return isRound(data.round) ? { type: "timeout", round: data.round } : null;
    case "rematch":
      return { type: "rematch" };
    case "leave":
      return { type: "leave" };
    case "kick":
      return typeof data.playerId === "string" && data.playerId.length <= 100
        ? { type: "kick", playerId: data.playerId }
        : null;
    default:
      return null;
  }
}

/**
 * Check a message from the server (run in the browser). The server is ours,
 * so this only checks the outer shape, enough to never crash on a surprise.
 */
export function parseServerMessage(raw: unknown): ServerMessage | null {
  const data = parseJson(raw);
  if (!data) return null;
  if (data.type === "state" && typeof data.state === "object" && data.state !== null && typeof data.now === "number") {
    return { type: "state", state: data.state as RoomState, now: data.now };
  }
  if (data.type === "welcome" && typeof data.playerId === "string") {
    return { type: "welcome", playerId: data.playerId };
  }
  if (data.type === "error" && typeof data.message === "string") {
    return { type: "error", message: data.message };
  }
  return null;
}

/** The query parameters a browser connects with (see the note at the top). */
export interface ConnectionQuery {
  token: string;
  name: string;
}

/** Read and check the connection URL's identity. Null = no usable identity (just watch). */
export function parseConnectionQuery(url: string): ConnectionQuery | null {
  let params: URLSearchParams;
  try {
    params = new URL(url).searchParams;
  } catch {
    return null;
  }
  const token = params.get("token") ?? "";
  const name = params.get("name") ?? "";
  if (!/^[A-Za-z0-9-]{16,100}$/.test(token) || name.length === 0 || name.length > 200) return null;
  return { token, name };
}
