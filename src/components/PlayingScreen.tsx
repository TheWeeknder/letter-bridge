"use client";
// =============================================================================
// PlayingScreen — the screen while a round is on: streak, the two letters,
// the countdown and the answer box. Shared by solo (app/page.tsx) and
// multiplayer (room/MultiplayerGame.tsx), so both play exactly the same.
// =============================================================================

import type { ReactNode } from "react";
import type { GameState } from "@/lib/game/types";
import { explainWarning } from "@/lib/game/validator";
import { AnswerInput } from "./AnswerInput";
import { CountdownBar } from "./CountdownBar";
import { LetterPair } from "./LetterPair";
import { StreakCounter } from "./StreakCounter";

export interface PlayingScreenProps {
  state: GameState; // must be in the "playing" phase, with a pair and time limit
  secondsLeft: number;
  onSubmit: (input: string) => void;
  best?: number; // solo: the saved best for this time limit (multiplayer leaves it out)
  top?: ReactNode; // shown above the streak, e.g. the opponents strip
}

export function PlayingScreen({ state, secondsLeft, onSubmit, best, top }: PlayingScreenProps) {
  if (!state.pair || !state.timeLimit) return null;

  return (
    <section className="flex w-full flex-col items-center gap-8">
      {top}
      <StreakCounter streak={state.streak} best={best} />
      <LetterPair pair={state.pair} />
      <div className="flex w-full flex-col items-center gap-1">
        <CountdownBar seconds={state.timeLimit} roundId={state.roundId} running secondsLeft={secondsLeft} />
        <span className="text-sm text-zinc-500 tabular-nums">{secondsLeft.toFixed(1)}s</span>
      </div>
      {/* key={roundId}: a fresh, empty, focused input for every new pair */}
      <AnswerInput
        key={state.roundId}
        onSubmit={onSubmit}
        warning={state.warning ? explainWarning(state.warning) : null}
        shakeKey={state.warningCount}
      />
    </section>
  );
}
