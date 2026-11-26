"use client";
// =============================================================================
// TimeLimitPicker — choose how many seconds you get per word.
// One key per value in TIME_LIMITS (config.ts), so changing that list
// changes the keys without touching this file. The keys look like on-screen
// keyboard keys (CHOICE_KEY in ui.tsx) and turn emerald once picked.
// =============================================================================

import { TIME_LIMITS, type TimeLimit } from "@/lib/game/config";
import { CHOICE_KEY, CHOICE_KEY_STATE } from "./ui";

export interface TimeLimitPickerProps {
  onPick: (seconds: TimeLimit) => void;
  selected?: TimeLimit | null; // highlights the current choice (optional)
}

export function TimeLimitPicker({ onPick, selected }: TimeLimitPickerProps) {
  return (
    <div className="flex gap-1.5" role="group" aria-label="Seconds per word">
      {TIME_LIMITS.map((seconds) => (
        <button
          type="button"
          key={seconds}
          onClick={() => onPick(seconds)}
          aria-pressed={selected === seconds}
          className={`${CHOICE_KEY} w-20 ${selected === seconds ? CHOICE_KEY_STATE.selected : CHOICE_KEY_STATE.idle}`}
        >
          {seconds}s
        </button>
      ))}
    </div>
  );
}
