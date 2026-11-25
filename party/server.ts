// =============================================================================
// party/server.ts — the multiplayer room server.
//
// It runs on Cloudflare (locally with `npm run party:dev`), NOT inside the
// Next.js app. Each room code gets its own tiny server instance (a "Durable
// Object"), which holds that room's state in memory while people are in it.
//
// This file is deliberately thin. It:
//   - works out WHO each connection is (a secret token -> a public player id)
//   - hands every message to the pure room rules (src/lib/multiplayer/room.ts)
//   - sends the new state to everyone
//   - keeps a clock running for round deadlines and abandoned seats
// All decisions live in room.ts, where they're unit-tested.
//
// URL: wss://<host>/parties/letter-room/<ROOMCODE>?token=…&name=…  (made by partysocket)
// =============================================================================

import { type Connection, type ConnectionContext, routePartykitRequest, Server, type WSMessage } from "partyserver";
import { newSeed } from "../src/lib/game/random";
import {
  encodeMessage,
  parseClientMessage,
  parseConnectionQuery,
  type ServerMessage,
} from "../src/lib/multiplayer/protocol";
import { createRoom, nextWakeup, type RoomEvent, type RoomState, roomReducer } from "../src/lib/multiplayer/room";
import { getWords } from "./words";

export class LetterRoom extends Server {
  /** This room's state. In memory only: it's gone once everyone has left. */
  private room: RoomState = createRoom();

  /** Secret token -> public player id. Proves who owns a seat when they reconnect. */
  private tokens = new Map<string, string>();

  /** Connection id -> the token it connected with (if any). */
  private connectionTokens = new Map<string, string>();

  /** Connection id -> the player it's seated as. Connections without a seat are watching. */
  private seats = new Map<string, string>();

  /** The pending clock timer, if any. */
  private clock: ReturnType<typeof setTimeout> | null = null;

  /** Send one message to one connection. */
  private sendTo(connection: Connection, message: ServerMessage): void {
    connection.send(encodeMessage(message));
  }

  /**
   * Run an event through the room rules. If it's allowed, everyone gets the
   * new state; if not, only the person who caused it (`from`) hears why.
   * Returns whether it was allowed.
   */
  private apply(event: RoomEvent, from?: Connection): boolean {
    // The dictionary is only needed once a game starts (built on first use).
    const words = this.room.phase === "lobby" && event.type !== "start" ? undefined : getWords();
    const result = roomReducer(this.room, event, words);
    if (!result.ok) {
      if (from) this.sendTo(from, { type: "error", message: result.error });
      return false;
    }
    const changed = result.state !== this.room;
    this.room = result.state;
    this.forgetRemovedPlayers();
    if (changed) this.broadcast(encodeMessage({ type: "state", state: this.room }));
    this.scheduleClock();
    return true;
  }

  /** Drop seat records for players no longer in the room (left, kicked, expired). */
  private forgetRemovedPlayers(): void {
    const present = new Set(this.room.players.map((p) => p.id));
    for (const [connectionId, playerId] of this.seats) {
      if (!present.has(playerId)) this.seats.delete(connectionId);
    }
  }

  /** Set a timer for the next moment the room rules need to check the clock. */
  private scheduleClock(): void {
    if (this.clock !== null) clearTimeout(this.clock);
    this.clock = null;
    const wakeAt = nextWakeup(this.room);
    if (wakeAt === null) return;
    // +5 ms so the tick lands just AFTER the deadline, not on it.
    this.clock = setTimeout(() => this.apply({ type: "tick", now: Date.now() }), Math.max(0, wakeAt - Date.now()) + 5);
  }

  /** Seat a connection: as a returning player (same token) or a new one. */
  private join(connection: Connection, name: string): void {
    const token = this.connectionTokens.get(connection.id);
    if (!token) return; // connected without an identity: can only watch
    const playerId = this.tokens.get(token) ?? crypto.randomUUID();
    if (this.apply({ type: "join", playerId, name, now: Date.now() }, connection)) {
      this.tokens.set(token, playerId);
      this.seats.set(connection.id, playerId);
      this.sendTo(connection, { type: "welcome", playerId });
    }
  }

  /** A browser connected: show it the room, and seat it if it said who it is. */
  onConnect(connection: Connection, ctx: ConnectionContext): void {
    this.sendTo(connection, { type: "state", state: this.room });
    const identity = parseConnectionQuery(ctx.request.url);
    if (identity) {
      this.connectionTokens.set(connection.id, identity.token);
      this.join(connection, identity.name);
    }
  }

  onMessage(connection: Connection, raw: WSMessage): void {
    const message = parseClientMessage(raw);
    if (!message) return; // broken or unknown message: ignore it
    const now = Date.now();

    // Joining (or renaming) works without a seat; everything else needs one.
    if (message.type === "join") return this.join(connection, message.name);
    const playerId = this.seats.get(connection.id);
    if (!playerId) return;

    switch (message.type) {
      case "start":
        // The seed is chosen HERE, on the server, so every player gets the same one.
        this.apply({ type: "start", playerId, timeLimit: message.timeLimit, seed: newSeed(), now }, connection);
        return;
      case "answer":
        this.apply({ type: "answer", playerId, round: message.round, input: message.input, now }, connection);
        return;
      case "timeout":
        this.apply({ type: "timeout", playerId, round: message.round }, connection);
        return;
      case "rematch":
        this.apply({ type: "rematch", playerId }, connection);
        return;
      case "leave":
        this.apply({ type: "leave", playerId }, connection);
        return;
      case "kick": {
        const targetConnections = [...this.seats].filter(([, id]) => id === message.playerId).map(([c]) => c);
        if (this.apply({ type: "kick", playerId, targetId: message.playerId }, connection)) {
          for (const connectionId of targetConnections) {
            const target = this.getConnection(connectionId);
            if (target) this.sendTo(target, { type: "error", message: "The host removed you from the room." });
          }
        }
        return;
      }
    }
  }

  /** Connection lost: keep the seat for a while, unless another tab still holds it. */
  onClose(connection: Connection): void {
    const playerId = this.seats.get(connection.id);
    this.seats.delete(connection.id);
    this.connectionTokens.delete(connection.id);
    if (!playerId || [...this.seats.values()].includes(playerId)) return;
    this.apply({ type: "disconnect", playerId, now: Date.now() });
  }
}

export default {
  // Send /parties/letter-room/<code> requests to that room's server.
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) ?? new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
