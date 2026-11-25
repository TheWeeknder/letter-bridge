"use client";
// =============================================================================
// PlayWithFriends — the way into multiplayer (on /friends): create a new room
// (you get a fresh code to share), or type a friend's code to join theirs.
// Both just go to /room/<CODE>; the room page does the rest.
// =============================================================================

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROOM_CODE_LENGTH } from "@/lib/multiplayer/config";
import { isValidRoomCode, newRoomCode, normalizeRoomCode } from "@/lib/multiplayer/roomCode";
import { Button, SectionHeading } from "./ui";

export function PlayWithFriends() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const cleanCode = normalizeRoomCode(code);
  const canJoin = isValidRoomCode(cleanCode);

  function join(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    if (canJoin) router.push(`/room/${cleanCode}`);
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-8">
      <div className="flex w-full flex-col items-center gap-3">
        <SectionHeading>Start a new game</SectionHeading>
        <Button className="w-full" onClick={() => router.push(`/room/${newRoomCode()}`)}>
          Create a room
        </Button>
      </div>
      <div className="flex w-full flex-col items-center gap-3">
        <SectionHeading>Have a code?</SectionHeading>
        <form onSubmit={join} className="flex w-full gap-2">
          <input
            value={code}
            onChange={(e) => setCode(normalizeRoomCode(e.target.value).slice(0, ROOM_CODE_LENGTH))}
            aria-label="Room code"
            placeholder="Room code"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="go"
            className="min-h-12 w-full min-w-0 rounded-xl border-2 border-zinc-300 bg-transparent px-4 text-center text-lg font-bold tracking-widest uppercase outline-none placeholder:font-normal placeholder:tracking-normal placeholder:normal-case focus:border-emerald-500 dark:border-zinc-700"
          />
          <Button type="submit" variant="secondary" disabled={!canJoin} className="disabled:opacity-40">
            Join
          </Button>
        </form>
      </div>
    </div>
  );
}
