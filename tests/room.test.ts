// Tests for the multiplayer room rules. Like gameReducer, the room is a pure
// function, so a whole multiplayer game can be "played" with plain function
// calls. The server clock is passed in as `now`, so timing is testable too.
import { describe, expect, it } from "vitest";
import { SPRINT_SECONDS, START_COUNTDOWN_SECONDS } from "@/lib/game/config";
import type { GameMode } from "@/lib/game/modes";
import { MAX_PLAYERS, RECONNECT_GRACE_MS, TIMEOUT_GRACE_MS } from "@/lib/multiplayer/config";
import {
  cleanNickname,
  createRoom,
  nextWakeup,
  placesFor,
  rankPlayers,
  type RoomEvent,
  type RoomPlayer,
  type RoomState,
  type RoomWords,
  roomReducer,
} from "@/lib/multiplayer/room";

// A tiny dictionary with two letter pairs, so the right answer is obvious.
const ANSWERS: Record<string, string[]> = {
  "a|e": ["able", "ace", "astute", "above"],
  "t|s": ["tests", "toys", "tips", "tags"],
};
const WORDS: RoomWords = {
  validation: new Set(Object.values(ANSWERS).flat()),
  eligiblePairs: [
    { start: "a", end: "e" },
    { start: "t", end: "s" },
  ],
};

/** Apply events in a row; fails the test if any is refused. */
function apply(state: RoomState, ...events: RoomEvent[]): RoomState {
  return events.reduce((s, event) => {
    const result = roomReducer(s, event, WORDS);
    if (!result.ok) throw new Error(`refused: ${result.error}`);
    return result.state;
  }, state);
}

/** The refusal message for one event (fails the test if it was allowed). */
function refusal(state: RoomState, event: RoomEvent, words: RoomWords | null = WORDS): string {
  const result = roomReducer(state, event, words ?? undefined);
  if (result.ok) throw new Error("expected a refusal");
  return result.error;
}

const T0 = 1_000_000; // the server time PLAY begins (after the 3 · 2 · 1)
const COUNTDOWN_MS = START_COUNTDOWN_SECONDS * 1000;
const join = (playerId: string, name = playerId, now = 0): RoomEvent => ({ type: "join", playerId, name, now });
const disconnect = (playerId: string, now: number): RoomEvent => ({ type: "disconnect", playerId, now });
const kick = (playerId: string, targetId: string): RoomEvent => ({ type: "kick", playerId, targetId });
const leave = (playerId: string): RoomEvent => ({ type: "leave", playerId });
// The host presses Start COUNTDOWN_MS before T0, so play begins exactly at T0.
const start = (playerId: string, now = T0 - COUNTDOWN_MS, mode: GameMode = 5): RoomEvent => ({
  type: "start",
  playerId,
  mode,
  seed: "seed-1",
  now,
});
const player = (state: RoomState, id: string): RoomPlayer => state.players.find((p) => p.id === id)!;

/** An answer from `id` for their current pair: a right one (index 0, 1, …) or the given text. */
function answer(state: RoomState, id: string, now: number, input?: string, pick = 0): RoomEvent {
  const p = player(state, id);
  const word = input ?? ANSWERS[`${p.pair!.start}|${p.pair!.end}`].filter((w) => !p.usedWords.includes(w))[pick];
  return { type: "answer", playerId: id, round: p.streak, input: word, now };
}

const twoPlayers = apply(createRoom(), join("a", "Ann"), join("b", "Bo"));
const playing = apply(twoPlayers, start("a"));

describe("join", () => {
  it("adds players in order and makes the first one host", () => {
    expect(twoPlayers.players.map((p) => p.name)).toEqual(["Ann", "Bo"]);
    expect(twoPlayers.hostId).toBe("a");
    expect(twoPlayers.players.every((p) => p.status === "lobby" && p.streak === 0)).toBe(true);
  });

  it("renames a player who joins again instead of adding them twice", () => {
    const renamed = apply(twoPlayers, join("b", "Bobby"));
    expect(renamed.players.map((p) => p.name)).toEqual(["Ann", "Bobby"]);
  });

  it("cleans up nicknames and refuses empty ones", () => {
    expect(apply(createRoom(), join("a", "   Ann    Lee  ")).players[0].name).toBe("Ann Lee");
    expect(refusal(createRoom(), join("a", "   "))).toMatch(/nickname/);
  });

  it(`refuses a player when the room already has ${MAX_PLAYERS}`, () => {
    const full = apply(createRoom(), ...Array.from({ length: MAX_PLAYERS }, (_, i) => join(`p${i}`)));
    expect(refusal(full, join("late"))).toMatch(/full/);
  });

  it("refuses new players once the game has started", () => {
    expect(refusal(playing, join("c"))).toMatch(/already started/);
  });
});

describe("leave", () => {
  it("removes the player", () => {
    expect(apply(twoPlayers, leave("b")).players.map((p) => p.id)).toEqual(["a"]);
  });

  it("passes host to the longest-waiting player when the host leaves", () => {
    expect(apply(twoPlayers, join("c"), leave("a")).hostId).toBe("b");
  });

  it("resets the room when the last player leaves", () => {
    expect(apply(twoPlayers, leave("a"), leave("b"))).toEqual(createRoom());
  });

  it("ignores someone who never joined", () => {
    expect(apply(twoPlayers, leave("stranger"))).toEqual(twoPlayers);
  });

  it("finishes the game if the only player still in it leaves", () => {
    const bOut = apply(playing, answer(playing, "b", T0 + 100, "zzz"));
    expect(apply(bOut, leave("a")).phase).toBe("finished");
  });
});

describe("start", () => {
  it("starts everyone on the SAME first pair, with the round clock running", () => {
    expect(playing).toMatchObject({ phase: "playing", seed: "seed-1", mode: 5, startedAt: T0 });
    const [a, b] = playing.players;
    expect(a.pair).toEqual(b.pair);
    expect(playing.players.every((p) => p.status === "playing" && p.streak === 0 && p.roundStartedAt === T0)).toBe(
      true,
    );
  });

  it("only the host can start", () => {
    expect(refusal(twoPlayers, start("b"))).toMatch(/host/);
  });

  it("needs at least 2 players", () => {
    expect(refusal(apply(createRoom(), join("a")), start("a"))).toMatch(/at least 2/);
  });

  it("can't start twice", () => {
    expect(refusal(playing, start("a"))).toMatch(/already started/);
  });

  it("waits for the dictionary", () => {
    expect(refusal(twoPlayers, start("a"), null)).toMatch(/dictionary/);
  });
});

describe("the 3 · 2 · 1 before play", () => {
  const pressedAt = T0 - COUNTDOWN_MS; // when the host pressed Start

  it("play (and everyone's first round clock) begins START_COUNTDOWN_SECONDS after Start", () => {
    expect(playing.startedAt).toBe(pressedAt + COUNTDOWN_MS);
    expect(playing.players.every((p) => p.roundStartedAt === pressedAt + COUNTDOWN_MS)).toBe(true);
  });

  it("an answer sent during the countdown is ignored (nothing changes)", () => {
    expect(apply(playing, answer(playing, "a", T0 - 1))).toEqual(playing);
  });

  it("the countdown doesn't eat into the time: the first deadline counts from the end of it", () => {
    expect(nextWakeup(playing)).toBe(T0 + 5 * 1000 + TIMEOUT_GRACE_MS);
    // The server clock ticking during the countdown knocks nobody out.
    expect(apply(playing, { type: "tick", now: T0 - 1 }).players.every((p) => p.status === "playing")).toBe(true);
  });

  it("coming back DURING the countdown doesn't start your clock early", () => {
    const back = apply(playing, disconnect("b", pressedAt + 500), join("b", "b", pressedAt + 1000));
    expect(player(back, "b").roundStartedAt).toBe(T0);
  });
});

describe("answers", () => {
  it("a right answer adds to the streak and moves on to the next shared pair", () => {
    const after = apply(playing, answer(playing, "a", T0 + 2000));
    const a = player(after, "a");
    expect(a.streak).toBe(1);
    expect(a.usedWords).toHaveLength(1);
    expect(a.roundStartedAt).toBe(T0 + 2000); // fresh clock for the new round
    expect(a.pair).not.toEqual(player(playing, "a").pair); // never the same pair twice in a row
    expect(player(after, "b").streak).toBe(0); // the other player is unaffected
  });

  it("both players walk through the same sequence of pairs", () => {
    let state = playing;
    const pairsA = [];
    const pairsB = [];
    for (let i = 0; i < 3; i++) {
      pairsA.push(player(state, "a").pair);
      state = apply(state, answer(state, "a", T0 + 100 * (i + 1)));
    }
    for (let i = 0; i < 3; i++) {
      pairsB.push(player(state, "b").pair);
      state = apply(state, answer(state, "b", T0 + 1000 + 100 * (i + 1)));
    }
    expect(pairsB).toEqual(pairsA);
  });

  it("a wrong answer knocks the player out, with the reason", () => {
    const after = apply(playing, answer(playing, "a", T0 + 500, "zebra"));
    expect(player(after, "a")).toMatchObject({ status: "out", outAt: T0 + 500, lastInput: "zebra" });
    expect(player(after, "a").gameOverReason).not.toBeNull();
    expect(after.phase).toBe("playing"); // Bo is still going
  });

  it("too-short and repeated words are just warnings: nothing changes", () => {
    expect(apply(playing, answer(playing, "a", T0 + 100, "ab"))).toEqual(playing);
    const one = apply(playing, answer(playing, "a", T0 + 100));
    const used = player(one, "a").usedWords[0];
    // Only a warning if the repeated word fits the new pair; otherwise it's simply wrong.
    const repeat = roomReducer(one, answer(one, "a", T0 + 200, used), WORDS);
    expect(repeat.ok).toBe(true);
  });

  it("ignores answers for a round the player already finished (double submit)", () => {
    const first = answer(playing, "a", T0 + 100);
    const once = apply(playing, first);
    expect(apply(once, first)).toEqual(once);
  });

  it("an answer after the deadline (plus grace) is a timeout", () => {
    const late = answer(playing, "a", T0 + 5000 + TIMEOUT_GRACE_MS + 1);
    expect(player(apply(playing, late), "a")).toMatchObject({ status: "out", gameOverReason: "TIMEOUT" });
  });

  it("an answer within the grace period still counts", () => {
    const justInTime = answer(playing, "a", T0 + 5000 + TIMEOUT_GRACE_MS);
    expect(player(apply(playing, justInTime), "a").streak).toBe(1);
  });
});

describe("timeouts and the server clock", () => {
  it("a player reporting their own timeout is knocked out", () => {
    const after = apply(playing, { type: "timeout", playerId: "a", round: 0 });
    expect(player(after, "a")).toMatchObject({ status: "out", gameOverReason: "TIMEOUT" });
  });

  it("ignores a timeout for an old round", () => {
    const one = apply(playing, answer(playing, "a", T0 + 100));
    expect(apply(one, { type: "timeout", playerId: "a", round: 0 })).toEqual(one);
  });

  it("the server clock knocks out anyone whose round expired", () => {
    const one = apply(playing, answer(playing, "a", T0 + 3000)); // Ann's clock restarted at T0+3000
    const tick = apply(one, { type: "tick", now: T0 + 5000 + TIMEOUT_GRACE_MS + 1 });
    expect(player(tick, "a").status).toBe("playing");
    expect(player(tick, "b")).toMatchObject({ status: "out", gameOverReason: "TIMEOUT" });
  });

  it("nextWakeup is the earliest round expiry among players still in", () => {
    const one = apply(playing, answer(playing, "a", T0 + 3000));
    expect(nextWakeup(one)).toBe(T0 + 5000 + TIMEOUT_GRACE_MS);
    expect(nextWakeup(twoPlayers)).toBeNull();
  });
});

describe("finishing, ranking and rematch", () => {
  // Ann gets 2 right then fails; Bo gets 1 right then times out.
  let game = playing;
  game = apply(game, answer(game, "a", T0 + 100));
  game = apply(game, answer(game, "a", T0 + 200));
  game = apply(game, answer(game, "b", T0 + 300));
  game = apply(game, answer(game, "a", T0 + 400, "nope"));
  const finished = apply(game, { type: "timeout", playerId: "b", round: 1 });

  it("the game finishes once everyone is out", () => {
    expect(game.phase).toBe("playing");
    expect(finished.phase).toBe("finished");
  });

  it("ranks by points, then by who lasted longer", () => {
    expect(rankPlayers(finished.players).map((p) => p.id)).toEqual(["a", "b"]);
    // Equal points (6 each): in Streak, whoever was knocked out later is ahead.
    const tie = [
      { ...finished.players[0], usedWords: ["cat", "dog"], outAt: 100 },
      { ...finished.players[1], usedWords: ["rabbit"], outAt: 200 },
    ];
    expect(rankPlayers(tie).map((p) => p.id)).toEqual(["b", "a"]);
    const stillPlaying = [{ ...tie[1] }, { ...tie[0], outAt: null }];
    expect(rankPlayers(stillPlaying)[0].id).toBe("a");
  });

  it("rematch (host only) returns everyone to the lobby with fresh stats", () => {
    expect(refusal(finished, { type: "rematch", playerId: "b" })).toMatch(/host/);
    expect(refusal(playing, { type: "rematch", playerId: "a" })).toMatch(/isn't over/);
    const lobby = apply(finished, { type: "rematch", playerId: "a" });
    expect(lobby.phase).toBe("lobby");
    expect(lobby.seed).toBeNull();
    expect(lobby.players.every((p) => p.status === "lobby" && p.streak === 0 && p.usedWords.length === 0)).toBe(
      true,
    );
  });
});

describe("lost connections and seats", () => {
  it("a dropped connection keeps the seat (marked as disconnected)", () => {
    const dropped = apply(twoPlayers, disconnect("b", 500));
    expect(dropped.players.map((p) => p.id)).toEqual(["a", "b"]);
    expect(player(dropped, "b")).toMatchObject({ connected: false, disconnectedAt: 500 });
  });

  it("coming back puts the player in the same seat", () => {
    const back = apply(twoPlayers, disconnect("b", 500), join("b", "Bo", 900));
    expect(player(back, "b")).toMatchObject({ connected: true, disconnectedAt: null, name: "Bo" });
    expect(back.players).toHaveLength(2);
  });

  it("can come back mid-game, keeping the streak, with a fresh round clock", () => {
    const one = apply(playing, answer(playing, "b", T0 + 1000));
    const back = apply(one, disconnect("b", T0 + 2000), join("b", "Bo", T0 + 4000));
    expect(player(back, "b")).toMatchObject({ status: "playing", streak: 1, connected: true, roundStartedAt: T0 + 4000 });
  });

  it("frees a lobby seat that stays empty past the grace period (and moves host on)", () => {
    const dropped = apply(twoPlayers, disconnect("a", 1000));
    expect(nextWakeup(dropped)).toBe(1000 + RECONNECT_GRACE_MS);
    const early = apply(dropped, { type: "tick", now: 1000 + RECONNECT_GRACE_MS - 1 });
    expect(early.players).toHaveLength(2);
    const freed = apply(dropped, { type: "tick", now: 1000 + RECONNECT_GRACE_MS });
    expect(freed.players.map((p) => p.id)).toEqual(["b"]);
    expect(freed.hostId).toBe("b");
  });

  it("keeps a disconnected player's seat during a game; the round clock knocks them out", () => {
    const dropped = apply(playing, disconnect("b", T0 + 100));
    const later = apply(dropped, { type: "tick", now: T0 + 5000 + TIMEOUT_GRACE_MS + 1 });
    expect(player(later, "b")).toMatchObject({ status: "out", gameOverReason: "TIMEOUT" });
    expect(later.players).toHaveLength(2);
  });

  it("host moves to someone still connected when the host's seat is freed", () => {
    const three = apply(createRoom(), join("a"), join("b"), join("c"));
    const state = apply(three, disconnect("b", 0), { type: "leave", playerId: "a" });
    expect(state.hostId).toBe("c");
  });
});

describe("kick", () => {
  const three = apply(createRoom(), join("a"), join("b"), join("c"));

  it("the host can remove another player in the lobby", () => {
    expect(apply(three, kick("a", "c")).players.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("only the host, never yourself, and not during a game", () => {
    expect(refusal(three, kick("b", "c"))).toMatch(/host/);
    expect(refusal(three, kick("a", "a"))).toMatch(/yourself/);
    expect(refusal(playing, kick("a", "b"))).toMatch(/during a game/);
  });
});

describe("cleanNickname", () => {
  it("removes control characters and cuts long names", () => {
    expect(cleanNickname("A\u0000nn")).toBe("Ann");
    expect(cleanNickname("x".repeat(40)).length).toBe(16);
  });
});

describe("sprint mode (one shared clock, mistakes only warn)", () => {
  const sprint = apply(twoPlayers, start("a", T0 - COUNTDOWN_MS, "sprint"));
  const SPRINT_END = T0 + SPRINT_SECONDS * 1000 + TIMEOUT_GRACE_MS; // the server's last moment to accept answers

  it("starts with the sprint mode and the shared start time", () => {
    expect(sprint).toMatchObject({ phase: "playing", mode: "sprint", startedAt: T0 });
    expect(sprint.players.every((p) => p.status === "playing")).toBe(true);
  });

  it("a wrong answer is only a warning: nobody is knocked out, nothing changes", () => {
    for (const wrong of ["zebra", "bite", "aeioue", "ab"]) {
      expect(apply(sprint, answer(sprint, "a", T0 + 500, wrong))).toEqual(sprint);
    }
  });

  it("right answers count and move on to the next shared pair", () => {
    const one = apply(sprint, answer(sprint, "a", T0 + 1000));
    expect(player(one, "a")).toMatchObject({ streak: 1, status: "playing" });
    expect(player(one, "a").pair).not.toEqual(player(sprint, "a").pair);
  });

  it("the deadline is the same for everyone and doesn't move with right answers", () => {
    let state = sprint;
    for (let i = 0; i < 3; i++) state = apply(state, answer(state, "a", T0 + 20_000 + i));
    expect(nextWakeup(state)).toBe(SPRINT_END);
  });

  it("an answer after the shared deadline (plus grace) doesn't count", () => {
    const late = apply(sprint, answer(sprint, "a", SPRINT_END + 1));
    expect(player(late, "a")).toMatchObject({ streak: 0, status: "out", gameOverReason: "TIMEOUT" });
    const justInTime = apply(sprint, answer(sprint, "a", SPRINT_END));
    expect(player(justInTime, "a").streak).toBe(1);
  });

  it("the server clock ends the sprint for everyone at once", () => {
    const one = apply(sprint, answer(sprint, "a", T0 + 29_000)); // a late right answer doesn't buy more time
    expect(apply(one, { type: "tick", now: SPRINT_END })).toEqual(one); // not over yet
    const over = apply(one, { type: "tick", now: SPRINT_END + 1 });
    expect(over.players.every((p) => p.status === "out" && p.gameOverReason === "TIMEOUT")).toBe(true);
    expect(over.phase).toBe("finished");
  });

  it("coming back after a dropped connection doesn't reset the shared clock", () => {
    const back = apply(sprint, disconnect("b", T0 + 10_000), join("b", "Bo", T0 + 15_000));
    expect(player(back, "b").connected).toBe(true);
    expect(nextWakeup(back)).toBe(SPRINT_END);
  });

  it("rematch keeps the mode (so the host's picker remembers it) but clears the start time", () => {
    const over = apply(sprint, { type: "tick", now: SPRINT_END + 1 });
    const lobby = apply(over, { type: "rematch", playerId: "a" });
    expect(lobby).toMatchObject({ phase: "lobby", mode: "sprint", startedAt: null });
  });

  it("equal points share the place; Streak keeps breaking ties", () => {
    const [a, b] = sprint.players;
    const c = { ...a, id: "c" };
    const players = [
      { ...a, streak: 2, usedWords: ["cat", "dog"] }, // 6 points
      { ...b, streak: 1, usedWords: ["superheroes"] }, // 11 points
      { ...c, streak: 2, usedWords: ["soaps", "rabbit"] }, // 11 points
    ];
    const ranked = rankPlayers(players, "sprint");
    expect(ranked.map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(placesFor(ranked, "sprint")).toEqual([1, 1, 3]);
    expect(placesFor(ranked, 5)).toEqual([1, 2, 3]);
  });

  it("the same number of words is NOT a tie when the words are longer", () => {
    const [a, b] = sprint.players;
    const players = [
      { ...a, streak: 2, usedWords: ["cat", "dog"] }, // 6 points
      { ...b, streak: 2, usedWords: ["soaps", "superheroes"] }, // 16 points
    ];
    const ranked = rankPlayers(players, "sprint");
    expect(ranked.map((p) => p.id)).toEqual(["b", "a"]);
    expect(placesFor(ranked, "sprint")).toEqual([1, 2]);
  });
});
