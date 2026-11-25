"use client";
// =============================================================================
// useNickname.ts — remember the player's multiplayer nickname in localStorage,
// so they only type it once. Same useSyncExternalStore pattern as
// useHighScores (see there for why).
// =============================================================================

import { useCallback, useSyncExternalStore } from "react";
import { cleanNickname } from "@/lib/multiplayer/room";

const STORAGE_KEY = "letter-bridge:nickname";
const LOCAL_CHANGE_EVENT = "letter-bridge:nickname-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): string | null {
  try {
    return cleanNickname(localStorage.getItem(STORAGE_KEY) ?? "") || null;
  } catch {
    return null; // storage blocked: just ask for a name each time
  }
}

function getServerSnapshot(): string | null {
  return null;
}

export interface UseNicknameResult {
  nickname: string | null; // null = not chosen yet
  setNickname: (name: string) => void;
}

export function useNickname(): UseNicknameResult {
  const nickname = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setNickname = useCallback((name: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, cleanNickname(name));
      window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT));
    } catch {
      // Storage blocked: the name can't be remembered, and there's nothing to show.
    }
  }, []);

  return { nickname, setNickname };
}
