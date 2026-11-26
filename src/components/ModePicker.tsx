"use client";
// =============================================================================
// ModePicker — choose how to play, in two short sections:
//
//   Streak: seconds per word    [10s] [5s] [3s]   one wrong word ends it
//   Sprint: 30 seconds          [30s sprint]      as many words as you can
//
// Solo starts a game the moment you tap; the multiplayer lobby only selects
// (the host presses Start afterwards). Both use this same component, so the
// two screens always offer the same choices. Under each section an optional
// "Best" line shows your saved high scores for that mode.
// =============================================================================

import type { ReactNode } from "react";
import { SPRINT_SECONDS, TIME_LIMITS } from "@/lib/game/config";
import { type GameMode, isSprint, modeLabel } from "@/lib/game/modes";
import { TimeLimitPicker } from "./TimeLimitPicker";
import { CHOICE_KEY, CHOICE_KEY_STATE, SectionHeading } from "./ui";

export interface ModePickerProps {
  onPick: (mode: GameMode) => void;
  selected?: GameMode | null; // highlights the current choice (optional)
  bests?: Partial<Record<GameMode, number>>; // solo: saved best per mode (0 / missing = no best yet)
}

/** One mode's section: a heading, a one-line explanation, its buttons and a best line. */
function Section({ title, hint, best, children }: { title: string; hint: string; best?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-0.5">
        <SectionHeading>{title}</SectionHeading>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      {children}
      {best && <p className="text-sm text-muted tabular-nums">{best}</p>}
    </div>
  );
}

export function ModePicker({ onPick, selected = null, bests }: ModePickerProps) {
  // "Best — 10s: 12 · 5s: 7" for the Streak modes that have a score.
  const streakBests = TIME_LIMITS.filter((limit) => (bests?.[limit] ?? 0) > 0)
    .map((limit) => `${limit}s: ${bests?.[limit]}`)
    .join(" · ");
  const sprintBest = bests?.sprint ?? 0;
  const sprintSelected = selected !== null && isSprint(selected);

  return (
    <div className="flex flex-col items-center gap-8">
      <Section
        title="Streak: seconds per word"
        hint="A fresh timer for every word. One wrong word ends it."
        best={streakBests ? `Best — ${streakBests}` : undefined}
      >
        <TimeLimitPicker onPick={onPick} selected={selected === null || isSprint(selected) ? null : selected} />
      </Section>

      <Section
        title={`Sprint: ${SPRINT_SECONDS} seconds`}
        hint="As many words as you can. Mistakes only warn you."
        best={sprintBest > 0 ? `Best — ${sprintBest} ${sprintBest === 1 ? "word" : "words"}` : undefined}
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
