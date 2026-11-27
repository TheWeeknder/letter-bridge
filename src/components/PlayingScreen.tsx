"use client";
// =============================================================================
// PlayingScreen — the screen while a round is on: points, the two letters,
// the countdown and the answer box. Shared by solo (app/solo/page.tsx) and
// multiplayer (room/MultiplayerGame.tsx), so both play exactly the same.
//
// The countdown follows the game's TIMER (timerId / timerSeconds), not the
// round: in Streak mode every pair gets a fresh bar, in Sprint one bar runs
// down over the whole game. The answer box stays the same for the whole game
// (it empties itself after each answer; see AnswerInput for why).
//
// LAYOUT: laid out from the TOP (not centred), right under the "Weld" bar.
// While you type on a phone, the keyboard takes the bottom half and the page
// shrinks to the part above it (see AppShell / useVisualViewportHeight), so
// starting at the top keeps the score, letters and box all visible.
// On phones (the `compact:` variant in globals.css) everything also
// tightens up so it fits in that smaller space, and squeezes further
// when the visible part is tiny (the `tight:` variant, e.g. iPhone SE with
// the keyboard open).
// =============================================================================

import type { ReactNode } from "react";
import { modeSeconds, wordCountLabel } from "@/lib/game/modes";
import { scoreFor, wordPoints } from "@/lib/game/scoring";
import type { GameState } from "@/lib/game/types";
import { explainWarning } from "@/lib/game/validator";
import { AnswerInput } from "./AnswerInput";
import { CountdownBar } from "./CountdownBar";
import { LetterPair } from "./LetterPair";
import { ScoreCounter } from "./ScoreCounter";

export interface PlayingScreenProps {
  state: GameState; // must be in the "playing" phase, with a pair and mode
  secondsLeft: number;
  onSubmit: (input: string) => void;
  best?: number; // solo: the saved best points for this mode (multiplayer leaves it out)
  top?: ReactNode; // shown above the score, e.g. the opponents strip
}

export function PlayingScreen({ state, secondsLeft, onSubmit, best, top }: PlayingScreenProps) {
  if (!state.pair || !state.mode) return null;
  const pair = state.pair;
  const lastWord = state.usedWords.at(-1);

  return (
    <section className="flex w-full flex-1 flex-col items-center justify-start gap-8 pt-2 compact:gap-3 compact:pt-0 tight:gap-2">
      <div className="flex flex-col items-center gap-3 compact:gap-2">
        {top}
        <ScoreCounter
          points={scoreFor(state.usedWords)}
          words={state.usedWords.length}
          wordsText={wordCountLabel(state.mode, state.usedWords.length)}
          lastWordPoints={lastWord ? wordPoints(lastWord) : undefined}
          best={best}
        />
      </div>
      <LetterPair pair={pair} />
      <div className="flex w-full flex-col items-center gap-1">
        <CountdownBar
          seconds={state.timerSeconds}
          total={modeSeconds(state.mode)}
          roundId={state.timerId}
          running
          secondsLeft={secondsLeft}
        />
        {/* Hidden when space is tiny (tight:); the bar still shows the time. */}
        <span className="text-sm text-muted tabular-nums tight:hidden">{secondsLeft.toFixed(1)}s</span>
      </div>
      <AnswerInput
        onSubmit={onSubmit}
        warning={state.warning ? explainWarning(state.warning, pair) : null}
        shakeKey={state.warningCount}
      />
    </section>
  );
}
