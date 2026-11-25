// Tests for checking messages that arrive over the network.
import { describe, expect, it } from "vitest";
import { encodeMessage, parseClientMessage, parseServerMessage } from "@/lib/multiplayer/protocol";
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
