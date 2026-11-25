"use client";
// =============================================================================
// StreakCounter — shows the current streak.
// (Step f will add a "pop" animation when it goes up, and the best streak.)
// =============================================================================

export interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="text-center">
      <div className="text-xs tracking-wide text-zinc-500 uppercase">Streak</div>
      <div className="text-4xl font-bold tabular-nums">{streak}</div>
    </div>
  );
}
