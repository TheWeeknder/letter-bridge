"use client";
// =============================================================================
// PlayingScreen — the screen while a round is on: score, the two letters,
// the countdown and the answer box. Shared by solo (app/solo/page.tsx) and
// multiplayer (room/MultiplayerGame.tsx), so both play exactly the same.
//
// The countdown follows the game's TIMER (timerId / timerSeconds), not the
// round: in Streak mode every pair gets a fresh bar, in Sprint one bar runs
// down over the whole game. The answer box still resets for every new pair.
// =============================================================================

import type { ReactNode } from "react";
import { isSprint, modeSeconds } from "@/lib/game/modes";
import type { GameState } from "@/lib/game/types";
import { explainWarning } from "@/lib/game/validator";
import { AnswerInput } from "./AnswerInput";
import { CountdownBar } from "./CountdownBar";
import { LetterPair } from "./LetterPair";
import { StreakCounter } from "./StreakCounter";

export interface PlayingScreenProps {
  state: GameState; // must be in the "playing" phase, with a pair and mode
  secondsLeft: number;
  onSubmit: (input: string) => void;
  best?: number; // solo: the saved best for this mode (multiplayer leaves it out)
  top?: ReactNode; // shown above the streak, e.g. the opponents strip
}

export function PlayingScreen({ state, secondsLeft, onSubmit, best, top }: PlayingScreenProps) {
  if (!state.pair || !state.mode) return null;
  const pair = state.pair;

  return (
    <section className="flex w-full flex-col items-center gap-8">
      {top}
      <StreakCounter streak={state.streak} best={best} label={isSprint(state.mode) ? "Words" : "Streak"} />
      <LetterPair pair={pair} />
      <div className="flex w-full flex-col items-center gap-1">
        <CountdownBar
          seconds={state.timerSeconds}
          total={modeSeconds(state.mode)}
          roundId={state.timerId}
          running
          secondsLeft={secondsLeft}
        />
        <span className="text-sm text-zinc-500 tabular-nums">{secondsLeft.toFixed(1)}s</span>
      </div>
      {/* key={roundId}: a fresh, empty, focused input for every new pair */}
      <AnswerInput
        key={state.roundId}
        onSubmit={onSubmit}
        warning={state.warning ? explainWarning(state.warning, pair) : null}
        shakeKey={state.warningCount}
      />
    </section>
  );
}
