// Tests for room codes.
import { describe, expect, it } from "vitest";
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "@/lib/multiplayer/config";
import { isValidRoomCode, newRoomCode, normalizeRoomCode } from "@/lib/multiplayer/roomCode";
import { createRng } from "@/lib/game/random";

describe("room codes", () => {
  it("makes valid codes, without look-alike letters", () => {
    const rng = createRng("codes");
    for (let i = 0; i < 200; i++) {
      const code = newRoomCode(rng);
      expect(code).toHaveLength(ROOM_CODE_LENGTH);
      expect(isValidRoomCode(code)).toBe(true);
      expect(code).not.toMatch(/[ILO]/);
    }
  });

  it("copes with an rng that returns exactly 1", () => {
    expect(newRoomCode(() => 1)).toBe(ROOM_CODE_ALPHABET.at(-1)!.repeat(ROOM_CODE_LENGTH));
  });

  it("tidies typed codes", () => {
    expect(normalizeRoomCode(" kbx-qm ")).toBe("KBXQM");
  });

  it("rejects wrong lengths and look-alike letters", () => {
    expect(isValidRoomCode("KBXQ")).toBe(false);
    expect(isValidRoomCode("KBXQMM")).toBe(false);
    expect(isValidRoomCode("KBXQO")).toBe(false);
  });
});
