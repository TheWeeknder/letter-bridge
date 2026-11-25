// =============================================================================
// party/server.ts — the multiplayer room server.
//
// It runs on Cloudflare (locally with `npm run party:dev`), NOT inside the
// Next.js app. Each room code gets its own tiny server instance (a "Durable
// Object"), which holds that room's state in memory while people are in it.
//
// This file is deliberately thin: it receives messages, hands them to the
// pure room rules in src/lib/multiplayer/room.ts, sends the new state to
// everyone, and keeps a clock running so slow or silent players time out.
// All decisions live in room.ts, where they're unit-tested.
//
// URL: ws://<host>/parties/letter-room/<ROOMCODE>  (made by partysocket)
// =============================================================================

import { type Connection, routePartykitRequest, Server, type WSMessage } from "partyserver";
import { newSeed } from "../src/lib/game/random";
import { encodeMessage, parseClientMessage, type ServerMessage } from "../src/lib/multiplayer/protocol";
import { createRoom, nextDeadline, type RoomEvent, type RoomState, roomReducer } from "../src/lib/multiplayer/room";
import { getWords } from "./words";

export class LetterRoom extends Server {
  /** This room's state. In memory only: it's gone once everyone has left. */
  private room: RoomState = createRoom();

  /** The pending "check for expired rounds" timer, if any. */
  private clock: ReturnType<typeof setTimeout> | null = null;

  /** Send one message to one connection. */
  private sendTo(connection: Connection, message: ServerMessage): void {
    connection.send(encodeMessage(message));
  }

  /**
   * Run an event through the room rules. If it's allowed, everyone gets the
   * new state; if not, only the person who caused it (`from`) hears why.
   */
  private apply(event: RoomEvent, from?: Connection): void {
    // The dictionary is only needed once a game starts (built on first use).
    const words = this.room.phase === "lobby" && event.type !== "start" ? undefined : getWords();
    const result = roomReducer(this.room, event, words);
    if (!result.ok) {
      if (from) this.sendTo(from, { type: "error", message: result.error });
      return;
    }
    const changed = result.state !== this.room;
    this.room = result.state;
    if (changed) this.broadcast(encodeMessage({ type: "state", state: this.room }));
    this.scheduleClock();
  }

  /**
   * Set a timer for the next moment a player's round expires, so the server
   * can knock them out even if their browser never reports it.
   */
  private scheduleClock(): void {
    if (this.clock !== null) clearTimeout(this.clock);
    this.clock = null;
    const deadline = nextDeadline(this.room);
    if (deadline === null) return;
    // +5 ms so the tick lands just AFTER the deadline, not on it.
    this.clock = setTimeout(() => this.apply({ type: "tick", now: Date.now() }), Math.max(0, deadline - Date.now()) + 5);
  }

  /** A new browser connected: show it the room straight away. */
  onConnect(connection: Connection): void {
    this.sendTo(connection, { type: "state", state: this.room });
  }

  onMessage(connection: Connection, raw: WSMessage): void {
    const message = parseClientMessage(raw);
    if (!message) return; // broken or unknown message: ignore it
    const playerId = connection.id;
    const now = Date.now();

    switch (message.type) {
      case "join":
        return this.apply({ type: "join", playerId, name: message.name }, connection);
      case "start":
        // The seed is chosen HERE, on the server, so every player gets the same one.
        return this.apply({ type: "start", playerId, timeLimit: message.timeLimit, seed: newSeed(), now }, connection);
      case "answer":
        return this.apply({ type: "answer", playerId, round: message.round, input: message.input, now }, connection);
      case "timeout":
        return this.apply({ type: "timeout", playerId, round: message.round }, connection);
      case "rematch":
        return this.apply({ type: "rematch", playerId }, connection);
    }
  }

  /** Tab closed or connection lost: that player leaves the room. */
  onClose(connection: Connection): void {
    this.apply({ type: "leave", playerId: connection.id });
  }
}

export default {
  // Send /parties/letter-room/<code> requests to that room's server.
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
