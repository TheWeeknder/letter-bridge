"use client";
// =============================================================================
// NicknameForm — choose the name other players will see. It's remembered in
// this browser, so it's only asked for once.
// =============================================================================

import { useState } from "react";
import { NICKNAME_MAX_LENGTH } from "@/lib/multiplayer/config";
import { cleanNickname } from "@/lib/multiplayer/room";
import { Button, INPUT_BASE, INPUT_BORDER, ScreenHeader } from "../ui";

export interface NicknameFormProps {
  code: string;
  initialName: string;
  onSubmit: (name: string) => void;
}

export function NicknameForm({ code, initialName, onSubmit }: NicknameFormProps) {
  const [name, setName] = useState(initialName);
  const clean = cleanNickname(name);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    if (clean) onSubmit(clean);
  }

  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <ScreenHeader title={`Join room ${code}`} subtitle="Pick a nickname the other players will see." />
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NICKNAME_MAX_LENGTH}
          autoFocus
          aria-label="Nickname"
          placeholder="Your nickname"
          autoComplete="nickname"
          enterKeyHint="go"
          className={`${INPUT_BASE} ${INPUT_BORDER.normal} text-lg`}
        />
        <Button type="submit" disabled={!clean}>
          Join room
        </Button>
      </form>
    </section>
  );
}
