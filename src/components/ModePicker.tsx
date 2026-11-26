"use client";
// =============================================================================
// ModePicker — choose how to play, in two short sections, each with a big
// slab headline (text-headline) so the two choices stand out:
//
//   Streak    seconds per word    [10s] [5s] [3s]   one wrong word ends it
//     OR
//   Sprint    30 seconds          [30s sprint]      as many words as you can
//
// Solo starts a game the moment you tap; the multiplayer lobby only selects
// (the host presses Start afterwards). Both use this same component, so the
// two screens always offer the same choices. Under each section an optional
// "Best" line shows your saved best points for that mode.
// =============================================================================

import type { ReactNode } from "react";
import { SPRINT_SECONDS, TIME_LIMITS } from "@/lib/game/config";
import { type GameMode, isSprint, modeLabel } from "@/lib/game/modes";
import { TimeLimitPicker } from "./TimeLimitPicker";
import { CHOICE_KEY, CHOICE_KEY_STATE } from "./ui";

export interface ModePickerProps {
  onPick: (mode: GameMode) => void;
  selected?: GameMode | null; // highlights the current choice (optional)
  bests?: Partial<Record<GameMode, number>>; // solo: saved best points per mode (0 / missing = no best yet)
}

/** One mode's section: a heading, a one-line explanation, its buttons and a best line. */
function Section({ title, hint, best, children }: { title: string; hint: string; best?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-1">
        <h3 className="font-display text-headline">{title}</h3>
        <p className="text-sm">{hint}</p>
      </div>
      {children}
      {best && <p className="text-sm text-muted tabular-nums">{best}</p>}
    </div>
  );
}

export function ModePicker({ onPick, selected = null, bests }: ModePickerProps) {
  // "Best points — 10s: 42 · 5s: 30" for the Streak modes that have a score.
  const streakBests = TIME_LIMITS.filter((limit) => (bests?.[limit] ?? 0) > 0)
    .map((limit) => `${limit}s: ${bests?.[limit]}`)
    .join(" · ");
  const sprintBest = bests?.sprint ?? 0;
  const sprintSelected = selected !== null && isSprint(selected);

  return (
    <div className="flex flex-col items-center gap-6">
      <Section
        title="Streak"
        hint="Seconds per word, fresh for every word. One wrong word ends it."
        best={streakBests ? `Best points — ${streakBests}` : undefined}
      >
        <TimeLimitPicker onPick={onPick} selected={selected === null || isSprint(selected) ? null : selected} />
      </Section>

      <section className="text-lg"> OR </section>

      <Section
        title="Sprint"
        hint={`${SPRINT_SECONDS} seconds, as many words as you can. Mistakes only warn you.`}
        best={sprintBest > 0 ? `Best — ${sprintBest} ${sprintBest === 1 ? "point" : "points"}` : undefined}
      >
        <button
          type="button"
          onClick={() => onPick("sprint")}
          aria-pressed={sprintSelected}
          // Same key as the seconds buttons, as wide as all three together
          // (3 × w-20 + 2 × gap-1.5 = w-63).
          className={`${CHOICE_KEY} w-63 ${sprintSelected ? CHOICE_KEY_STATE.selected : CHOICE_KEY_STATE.idle}`}
        >
          {modeLabel("sprint")}
        </button>
      </Section>
    </div>
  );
}
