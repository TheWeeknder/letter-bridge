// Tests for the multiplayer room rules. Like gameReducer, the room is a pure
// function, so a whole multiplayer game can be "played" with plain function
// calls. The server clock is passed in as `now`, so timing is testable too.
import { describe, expect, it } from "vitest";
import { MAX_PLAYERS, TIMEOUT_GRACE_MS } from "@/lib/multiplayer/config";
import {
  cleanNickname,
  createRoom,
  nextDeadline,
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

const T0 = 1_000_000; // the server time the game starts
const join = (playerId: string, name = playerId): RoomEvent => ({ type: "join", playerId, name });
const leave = (playerId: string): RoomEvent => ({ type: "leave", playerId });
const start = (playerId: string, now = T0): RoomEvent => ({ type: "start", playerId, timeLimit: 5, seed: "seed-1", now });
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
    expect(playing).toMatchObject({ phase: "playing", seed: "seed-1", timeLimit: 5 });
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

  it("nextDeadline is the earliest expiry among players still in", () => {
    const one = apply(playing, answer(playing, "a", T0 + 3000));
    expect(nextDeadline(one)).toBe(T0 + 5000 + TIMEOUT_GRACE_MS);
    expect(nextDeadline(twoPlayers)).toBeNull();
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

  it("ranks by streak, then by who lasted longer", () => {
    expect(rankPlayers(finished.players).map((p) => p.id)).toEqual(["a", "b"]);
    const tie = [
      { ...finished.players[0], streak: 3, outAt: 100 },
      { ...finished.players[1], streak: 3, outAt: 200 },
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

describe("cleanNickname", () => {
  it("removes control characters and cuts long names", () => {
    expect(cleanNickname("A\u0000nn")).toBe("Ann");
    expect(cleanNickname("x".repeat(40)).length).toBe(16);
  });
});
