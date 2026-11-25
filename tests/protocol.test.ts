// Tests for checking messages that arrive over the network.
import { describe, expect, it } from "vitest";
import {
  encodeMessage,
  parseClientMessage,
  parseConnectionQuery,
  parseServerMessage,
} from "@/lib/multiplayer/protocol";
import { createRoom } from "@/lib/multiplayer/room";

describe("parseClientMessage", () => {
  it("accepts well-formed messages", () => {
    expect(parseClientMessage(encodeMessage({ type: "join", name: "Ann" }))).toEqual({ type: "join", name: "Ann" });
    expect(parseClientMessage(encodeMessage({ type: "start", timeLimit: 5 }))).toEqual({ type: "start", timeLimit: 5 });
    expect(parseClientMessage(encodeMessage({ type: "answer", round: 3, input: "able" }))).toEqual({
      type: "answer",
      round: 3,
      input: "able",
    });
    expect(parseClientMessage(encodeMessage({ type: "timeout", round: 0 }))).toEqual({ type: "timeout", round: 0 });
    expect(parseClientMessage(encodeMessage({ type: "rematch" }))).toEqual({ type: "rematch" });
    expect(parseClientMessage(encodeMessage({ type: "leave" }))).toEqual({ type: "leave" });
    expect(parseClientMessage(encodeMessage({ type: "kick", playerId: "p1" }))).toEqual({ type: "kick", playerId: "p1" });
  });

  it("ignores anything broken or unexpected", () => {
    for (const raw of [
      "not json",
      "null",
      "42",
      '{"type":"explode"}',
      '{"type":"join"}',
      '{"type":"join","name":7}',
      `{"type":"join","name":"${"x".repeat(500)}"}`,
      '{"type":"start","timeLimit":4}',
      '{"type":"answer","round":-1,"input":"able"}',
      '{"type":"answer","round":1.5,"input":"able"}',
      '{"type":"answer","round":1}',
      `{"type":"answer","round":1,"input":"${"x".repeat(101)}"}`,
      '{"type":"timeout","round":"1"}',
      '{"type":"kick"}',
      '{"type":"kick","playerId":5}',
      new ArrayBuffer(4),
    ]) {
      expect(parseClientMessage(raw)).toBeNull();
    }
  });
});

describe("parseServerMessage", () => {
  it("reads state and error messages", () => {
    const state = createRoom();
    expect(parseServerMessage(encodeMessage({ type: "state", state }))).toEqual({ type: "state", state });
    expect(parseServerMessage(encodeMessage({ type: "welcome", playerId: "p1" }))).toEqual({
      type: "welcome",
      playerId: "p1",
    });
    expect(parseServerMessage(encodeMessage({ type: "error", message: "nope" }))).toEqual({
      type: "error",
      message: "nope",
    });
  });

  it("ignores anything else", () => {
    expect(parseServerMessage("garbage")).toBeNull();
    expect(parseServerMessage('{"type":"state"}')).toBeNull();
  });
});

describe("parseConnectionQuery", () => {
  const base = "wss://rooms.example/parties/letter-room/KBXQM";
  const token = "0f8e1c2a-4b5d-4e6f-8a9b-0c1d2e3f4a5b";

  it("reads the token and nickname from the connection URL", () => {
    expect(parseConnectionQuery(`${base}?token=${token}&name=Ann%20Lee`)).toEqual({ token, name: "Ann Lee" });
  });

  it("returns null (watch only) for a missing or malformed identity", () => {
    expect(parseConnectionQuery(base)).toBeNull();
    expect(parseConnectionQuery(`${base}?token=${token}`)).toBeNull(); // no name
    expect(parseConnectionQuery(`${base}?token=short&name=Ann`)).toBeNull();
    expect(parseConnectionQuery(`${base}?token=${token}!!&name=Ann`)).toBeNull();
    expect(parseConnectionQuery("not a url")).toBeNull();
  });
});
