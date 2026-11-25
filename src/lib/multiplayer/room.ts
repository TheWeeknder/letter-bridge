// =============================================================================
// room.ts — the rules of a multiplayer room, as a pure "reducer".
//
// WHY pure (like gameReducer.ts): the room server (party/server.ts) only
// handles connections, messages and the clock. Every decision ("can this
// person join?", "was that answer right?", "is the game over?") happens here,
// in a plain function that tests can call without a server or a network.
// The current time is passed IN with each event (`now`), so even the timing
// rules are testable.
//
// Phases:  lobby --start--> playing --everyone out--> finished --rematch--> lobby
//
// SEATS: a player keeps their seat when their connection drops (connected:
// false). Coming back within RECONNECT_GRACE_MS puts them right back, even
// mid-game. Outside a game, a seat left empty longer than that is freed.
//
// The game is "parallel survival": every player gets the SAME sequence of
// letter pairs (from the shared seed) and plays their own streak on their own
// timer. A wrong answer or running out of time knocks you out. When everyone
// is out, the highest streak wins.
// =============================================================================

import type { TimeLimit } from "../game/config";
import { pairForRound } from "../game/random";
import type { GameOverReason, LetterPair, WordData } from "../game/types";
import { isWarningReason, validateAnswer } from "../game/validator";
import { MAX_PLAYERS, MIN_PLAYERS, NICKNAME_MAX_LENGTH, RECONNECT_GRACE_MS, TIMEOUT_GRACE_MS } from "./config";

export type RoomPhase = "lobby" | "playing" | "finished";

/** "lobby" = waiting; "playing" = still in the game; "out" = knocked out. */
export type PlayerStatus = "lobby" | "playing" | "out";

export interface RoomPlayer {
  id: string; // a public id for this seat (the server keeps the secret that proves who owns it)
  name: string;
  connected: boolean; // false = connection lost; the seat is kept for a while
  disconnectedAt: number | null; // server time (ms) the connection was lost
  status: PlayerStatus;
  streak: number;
  usedWords: string[]; // words accepted this game, in order
  pair: LetterPair | null; // the pair this player is answering right now
  roundStartedAt: number | null; // server time (ms) the current round began
  outAt: number | null; // server time (ms) they were knocked out
  gameOverReason: GameOverReason | null;
  lastInput: string | null; // what they typed when they were knocked out
}

/** Everything about a room. The server sends this whole object to every player. */
export interface RoomState {
  phase: RoomPhase;
  players: RoomPlayer[]; // in the order they joined
  hostId: string | null; // the player who can start the game
  seed: string | null; // decides the letter pairs (see lib/game/random.ts)
  timeLimit: TimeLimit | null;
}

/** Everything that can happen in a room. `now` is the server's clock in ms. */
export type RoomEvent =
  | { type: "join"; playerId: string; name: string; now: number } // join, rejoin after a drop, or rename
  | { type: "disconnect"; playerId: string; now: number } // connection lost: keep the seat for now
  | { type: "leave"; playerId: string } // left on purpose: free the seat now
  | { type: "kick"; playerId: string; targetId: string } // host removes someone (not during a game)
  | { type: "start"; playerId: string; timeLimit: TimeLimit; seed: string; now: number }
  | { type: "answer"; playerId: string; round: number; input: string; now: number }
  | { type: "timeout"; playerId: string; round: number }
  | { type: "tick"; now: number } // the server's clock: expired rounds and abandoned seats
  | { type: "rematch"; playerId: string };

/** Either the new state, or why the event was refused (shown to that player). */
export type RoomResult = { ok: true; state: RoomState } | { ok: false; error: string };

/** The dictionary parts the room needs to judge answers. */
export type RoomWords = Pick<WordData, "validation" | "eligiblePairs">;

/** A brand-new, empty room. */
export function createRoom(): RoomState {
  return { phase: "lobby", players: [], hostId: null, seed: null, timeLimit: null };
}

/** A player as they are in the lobby: no game state yet. */
function lobbyPlayer(id: string, name: string): RoomPlayer {
  return {
    id,
    name,
    connected: true,
    disconnectedAt: null,
    status: "lobby",
    streak: 0,
    usedWords: [],
    pair: null,
    roundStartedAt: null,
    outAt: null,
    gameOverReason: null,
    lastInput: null,
  };
}

/**
 * Tidy a nickname: no control characters, single spaces, trimmed, and at most
 * NICKNAME_MAX_LENGTH characters. Returns "" if nothing usable is left.
 */
export function cleanNickname(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, "") // invisible control characters
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NICKNAME_MAX_LENGTH)
    .trim();
}

/**
 * When the server stops waiting for this player's answer (ms). It's the time
 * limit plus a little grace for network delay: the player's own screen runs
 * out first, so the grace never gives anyone extra thinking time.
 */
export function roundDeadline(player: RoomPlayer, timeLimit: TimeLimit): number | null {
  if (player.status !== "playing" || player.roundStartedAt === null) return null;
  return player.roundStartedAt + timeLimit * 1000 + TIMEOUT_GRACE_MS;
}

/**
 * Players in finishing order: highest streak first; on a tie, whoever lasted
 * longer (still playing beats knocked out; out later beats out earlier).
 */
export function rankPlayers(players: RoomPlayer[]): RoomPlayer[] {
  return [...players].sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return (b.outAt ?? Infinity) - (a.outAt ?? Infinity);
  });
}

const refuse = (error: string): RoomResult => ({ ok: false, error });
const accept = (state: RoomState): RoomResult => ({ ok: true, state });

/** Replace one player (by id) using `update`. */
function updatePlayer(state: RoomState, id: string, update: (p: RoomPlayer) => RoomPlayer): RoomState {
  return { ...state, players: state.players.map((p) => (p.id === id ? update(p) : p)) };
}

/** Knock a player out. */
function knockOut(player: RoomPlayer, reason: GameOverReason, now: number | null, input: string | null): RoomPlayer {
  return { ...player, status: "out", gameOverReason: reason, outAt: now, lastInput: input, roundStartedAt: null };
}

/** Free a seat; if it was the host's, the longest-waiting player takes over. */
function removePlayer(state: RoomState, id: string): RoomState {
  const players = state.players.filter((p) => p.id !== id);
  // Everyone's gone: start over with a fresh room.
  if (players.length === 0) return createRoom();
  return finishIfDone({
    ...state,
    players,
    hostId: state.hostId === id ? (players.find((p) => p.connected) ?? players[0]).id : state.hostId,
  });
}

/** Has this disconnected player been gone long enough to lose their seat? */
function seatExpired(player: RoomPlayer, now: number): boolean {
  return !player.connected && player.disconnectedAt !== null && now - player.disconnectedAt >= RECONNECT_GRACE_MS;
}

/** Once nobody is still playing, the game is finished. */
function finishIfDone(state: RoomState): RoomState {
  if (state.phase === "playing" && !state.players.some((p) => p.status === "playing")) {
    return { ...state, phase: "finished" };
  }
  return state;
}

export function roomReducer(state: RoomState, event: RoomEvent, words?: RoomWords): RoomResult {
  switch (event.type) {
    // --- Someone joins (or renames themselves) ---------------------------------
    case "join": {
      const name = cleanNickname(event.name);
      if (!name) return refuse("Please choose a nickname.");

      // Already has a seat: rename, and/or come back after a lost connection.
      // Mid-game, a returning player gets a fresh round clock: their screen
      // starts the round again, and the server's clock should match it.
      if (state.players.some((p) => p.id === event.playerId)) {
        return accept(
          updatePlayer(state, event.playerId, (p) => ({
            ...p,
            name,
            connected: true,
            disconnectedAt: null,
            roundStartedAt: p.status === "playing" ? event.now : p.roundStartedAt,
          })),
        );
      }

      if (state.phase !== "lobby") return refuse("This game has already started.");
      if (state.players.length >= MAX_PLAYERS) return refuse(`This room is full (${MAX_PLAYERS} players).`);

      return accept({
        ...state,
        players: [...state.players, lobbyPlayer(event.playerId, name)],
        hostId: state.hostId ?? event.playerId, // the first player becomes host
      });
    }

    // --- Connection lost: keep the seat, in case they come straight back -----
    case "disconnect": {
      if (!state.players.some((p) => p.id === event.playerId)) return accept(state);
      return accept(
        updatePlayer(state, event.playerId, (p) => ({ ...p, connected: false, disconnectedAt: event.now })),
      );
    }

    // --- Someone leaves on purpose ("Leave room") -----------------------------
    case "leave": {
      if (!state.players.some((p) => p.id === event.playerId)) return accept(state); // wasn't in the room
      return accept(removePlayer(state, event.playerId));
    }

    // --- The host removes someone (e.g. a seat nobody is using) ---------------
    case "kick": {
      if (event.playerId !== state.hostId) return refuse("Only the host can remove players.");
      if (state.phase === "playing") return refuse("You can't remove players during a game.");
      if (event.targetId === event.playerId) return refuse("You can't remove yourself. Use Leave room instead.");
      if (!state.players.some((p) => p.id === event.targetId)) return accept(state);
      return accept(removePlayer(state, event.targetId));
    }

    // --- The host starts the game ----------------------------------------------
    case "start": {
      if (event.playerId !== state.hostId) return refuse("Only the host can start the game.");
      if (state.phase !== "lobby") return refuse("The game has already started.");
      if (state.players.length < MIN_PLAYERS) return refuse(`You need at least ${MIN_PLAYERS} players to start.`);
      if (!words) return refuse("The dictionary isn't ready yet. Try again.");

      // Round 0's pair is the same for everyone (it only depends on the seed).
      const firstPair = pairForRound(words.eligiblePairs, event.seed, 0, null);
      return accept({
        ...state,
        phase: "playing",
        seed: event.seed,
        timeLimit: event.timeLimit,
        players: state.players.map((p) => ({
          ...lobbyPlayer(p.id, p.name),
          status: "playing",
          pair: firstPair,
          roundStartedAt: event.now,
        })),
      });
    }

    // --- A player submitted an answer ----------------------------------------
    case "answer": {
      const player = state.players.find((p) => p.id === event.playerId);
      // Not playing, or an answer for a round they've already finished
      // (e.g. a double submit): ignore it quietly.
      if (state.phase !== "playing" || !player || player.status !== "playing" || event.round !== player.streak) {
        return accept(state);
      }
      if (!words || !player.pair || state.seed === null || state.timeLimit === null) return accept(state);

      // Too late? The server's clock has the final say.
      const deadline = roundDeadline(player, state.timeLimit);
      if (deadline !== null && event.now > deadline) {
        return accept(finishIfDone(updatePlayer(state, player.id, (p) => knockOut(p, "TIMEOUT", event.now, event.input))));
      }

      const result = validateAnswer({
        input: event.input,
        pair: player.pair,
        validation: words.validation,
        usedWords: player.usedWords,
      });

      if (result.ok) {
        // Correct: next round, with the next pair in the shared sequence.
        const nextPair = pairForRound(words.eligiblePairs, state.seed, player.streak + 1, player.pair);
        return accept(
          updatePlayer(state, player.id, (p) => ({
            ...p,
            streak: p.streak + 1,
            usedWords: [...p.usedWords, result.word],
            pair: nextPair,
            roundStartedAt: event.now,
          })),
        );
      }

      // Too short or repeated: the player just tries again (nothing changes).
      if (isWarningReason(result.reason)) return accept(state);

      return accept(finishIfDone(updatePlayer(state, player.id, (p) => knockOut(p, result.reason, event.now, event.input))));
    }

    // --- A player's own timer ran out ----------------------------------------
    // Trusted as-is: claiming your own timeout only ever hurts you.
    case "timeout": {
      const player = state.players.find((p) => p.id === event.playerId);
      if (state.phase !== "playing" || !player || player.status !== "playing" || event.round !== player.streak) {
        return accept(state);
      }
      return accept(finishIfDone(updatePlayer(state, player.id, (p) => knockOut(p, "TIMEOUT", p.roundStartedAt, null))));
    }

    // --- The server's clock: knock out anyone whose round has expired --------
    // This catches players whose browser went quiet (closed laptop, slow
    // network, or a tampered page that never reports its own timeout).
    // Outside a game it also frees seats that have been empty too long.
    case "tick": {
      if (state.phase === "playing" && state.timeLimit !== null) {
        const timeLimit = state.timeLimit;
        const players = state.players.map((p) => {
          const deadline = roundDeadline(p, timeLimit);
          return deadline !== null && event.now > deadline ? knockOut(p, "TIMEOUT", event.now, null) : p;
        });
        return accept(finishIfDone({ ...state, players }));
      }
      const expired = state.players.filter((p) => seatExpired(p, event.now));
      if (expired.length === 0) return accept(state);
      return accept(expired.reduce((s, p) => removePlayer(s, p.id), state));
    }

    // --- The host wants another round with the same players ------------------
    case "rematch": {
      if (event.playerId !== state.hostId) return refuse("Only the host can start a rematch.");
      if (state.phase !== "finished") return refuse("The game isn't over yet.");
      return accept({
        ...state,
        phase: "lobby",
        seed: null,
        players: state.players.map((p) => lobbyPlayer(p.id, p.name)),
      });
    }
  }
}

/**
 * The next moment (ms) something needs checking: a player's round expiring
 * (during a game), or an empty seat running out of grace (outside a game).
 * Null if nothing is pending. The server sets a timer for it and sends a "tick".
 */
export function nextWakeup(state: RoomState): number | null {
  const times: number[] = [];
  if (state.phase === "playing" && state.timeLimit !== null) {
    for (const p of state.players) {
      const deadline = roundDeadline(p, state.timeLimit);
      if (deadline !== null) times.push(deadline);
    }
  } else {
    for (const p of state.players) {
      if (!p.connected && p.disconnectedAt !== null) times.push(p.disconnectedAt + RECONNECT_GRACE_MS);
    }
  }
  return times.length > 0 ? Math.min(...times) : null;
}
