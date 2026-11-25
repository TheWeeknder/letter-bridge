"use client";
// =============================================================================
// TimeLimitPicker — choose how many seconds you get per word.
// One button per value in TIME_LIMITS (config.ts), so changing that list
// changes the buttons without touching this file.
// =============================================================================

import { TIME_LIMITS, type TimeLimit } from "@/lib/game/config";

export interface TimeLimitPickerProps {
  onPick: (seconds: TimeLimit) => void;
  selected?: TimeLimit | null; // highlights the current choice (optional)
  disabled?: boolean; // e.g. while the word lists are still loading
}

export function TimeLimitPicker({ onPick, selected, disabled }: TimeLimitPickerProps) {
  return (
    <div className="flex gap-3" role="group" aria-label="Seconds per word">
      {TIME_LIMITS.map((seconds) => (
        <button
          key={seconds}
          onClick={() => onPick(seconds)}
          disabled={disabled}
          aria-pressed={selected === seconds}
          className={
            "w-20 rounded-lg border-2 px-4 py-3 text-xl font-bold transition-colors disabled:opacity-40 " +
            (selected === seconds
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-zinc-300 hover:border-emerald-500 dark:border-zinc-700")
          }
        >
          {seconds}s
        </button>
      ))}
    </div>
  );
}
