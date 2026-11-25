// =============================================================================
// roomCode.ts — make, clean up and check room codes like "KBXQM".
// =============================================================================

import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from "./config";

/** A new random room code. `rng` works like Math.random (tests pass their own). */
export function newRoomCode(rng: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const index = Math.min(Math.floor(rng() * ROOM_CODE_ALPHABET.length), ROOM_CODE_ALPHABET.length - 1);
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}

/** Tidy what someone typed: " kbx-qm " -> "KBXQM" (uppercase, letters only). */
export function normalizeRoomCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z]/g, "");
}

/** Is this exactly a valid room code (right length, allowed letters only)? */
export function isValidRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && [...code].every((char) => ROOM_CODE_ALPHABET.includes(char));
}
