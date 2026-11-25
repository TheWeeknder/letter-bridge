// =============================================================================
// protocol.ts — the messages the browser and the room server send each other.
//
// Messages travel as JSON text over a WebSocket. Both sides import these
// types, so a typo in a message name is a compile error instead of a silent
// bug. Anything arriving from the network is CHECKED before it's trusted
// (parseClientMessage / parseServerMessage): a broken or hostile message is
// simply ignored instead of crashing the room.
// =============================================================================

import { TIME_LIMITS, type TimeLimit } from "../game/config";
import type { RoomState } from "./room";

/** Browser -> server. */
export type ClientMessage =
  | { type: "join"; name: string } // join the room (or change your nickname)
  | { type: "start"; timeLimit: TimeLimit } // host only: begin the game
  | { type: "answer"; round: number; input: string } // an answer for round `round` (= your streak)
  | { type: "timeout"; round: number } // your timer ran out on round `round`
  | { type: "rematch" }; // host only: back to the lobby for another game

/** Server -> browser. */
export type ServerMessage =
  | { type: "state"; state: RoomState } // the whole room, after every change
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

function isTimeLimit(value: unknown): value is TimeLimit {
  return TIME_LIMITS.includes(value as TimeLimit);
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
      return isTimeLimit(data.timeLimit) ? { type: "start", timeLimit: data.timeLimit } : null;
    case "answer":
      return isRound(data.round) && typeof data.input === "string" && data.input.length <= 100
        ? { type: "answer", round: data.round, input: data.input }
        : null;
    case "timeout":
      return isRound(data.round) ? { type: "timeout", round: data.round } : null;
    case "rematch":
      return { type: "rematch" };
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
  if (data.type === "state" && typeof data.state === "object" && data.state !== null) {
    return { type: "state", state: data.state as RoomState };
  }
  if (data.type === "error" && typeof data.message === "string") {
    return { type: "error", message: data.message };
  }
  return null;
}
