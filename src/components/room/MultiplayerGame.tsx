"use client";
// =============================================================================
// MultiplayerGame — your game inside a room, from the first pair to the
// results.
//
// HOW IT STAYS FAST AND FAIR:
// - Your game runs locally with the same useGame hook as solo, so letters,
//   the timer and right/wrong feedback are instant (no waiting on the network).
// - Every answer and timeout is ALSO sent to the room server, which judges it
//   again with the same rules and dictionary. The server's verdict is final:
//   if it knocks you out (e.g. your answer arrived too late), your screen
//   follows.
// - Everyone's game uses the room's seed, so you all get the same pairs.
// - Sprint: the clock is shared. We work out how much of it is left from the
//   server's start time and clock (serverOffset), so a reload mid-sprint
//   picks up with the time that's really left, not a fresh 30 seconds.
//
// The parent renders this with key={seed}, so every new game starts fresh.
//
// Screens:  playing -> "You're out" / "Time's up" (others still going) -> results
// Results: the winner, or "It's a tie!" when a sprint ends with equal counts.
// =============================================================================

import { useEffect, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { isSprint, modeSeconds } from "@/lib/game/modes";
import type { WordData } from "@/lib/game/types";
import { explainGameOver } from "@/lib/game/validator";
import { placesFor, rankPlayers, type RoomState } from "@/lib/multiplayer/room";
import { PlayingScreen } from "../PlayingScreen";
import { BackLink, Button, LinkButton, ScreenHeader } from "../ui";
import { OpponentsStrip } from "./OpponentsStrip";
import { Standings } from "./Standings";

export interface MultiplayerGameProps {
  room: RoomState; // phase "playing" or "finished", with a seed and mode
  myId: string;
  data: WordData;
  serverOffset: number; // server clock minus this device's clock (ms), see useRoom
  sendAnswer: (round: number, input: string) => void;
  sendTimeout: (round: number) => void;
  onRematch: () => void;
  onLeave: () => void; // free my seat before going home
}

export function MultiplayerGame({
  room,
  myId,
  data,
  serverOffset,
  sendAnswer,
  sendTimeout,
  onRematch,
  onLeave,
}: MultiplayerGameProps) {
  const me = room.players.find((p) => p.id === myId);
  const sprint = room.mode !== null && isSprint(room.mode);

  // Sprint: what's left of the shared clock, worked out ONCE when this game
  // appears (lazy state, so it isn't recomputed on every render).
  const [sprintSecondsLeft] = useState(() => {
    if (!sprint || room.mode === null || room.startedAt === null) return undefined;
    const endsAt = room.startedAt + modeSeconds(room.mode) * 1000;
    const secondsLeft = (endsAt - (Date.now() + serverOffset)) / 1000;
    return Math.min(modeSeconds(room.mode), Math.max(0, secondsLeft));
  });

  const game = useGame(data, {
    // Pick up where the server says we are: round 0 for a new game, or our
    // streak, words and pair if we're coming back after a reload. A sprint
    // always resumes, so its clock matches the shared one.
    autoStart:
      room.seed && room.mode
        ? {
            seed: room.seed,
            mode: room.mode,
            resume:
              me && me.pair && (sprint || me.streak > 0 || me.usedWords.length > 0)
                ? { streak: me.streak, usedWords: me.usedWords, pair: me.pair, secondsLeft: sprintSecondsLeft }
                : undefined,
          }
        : undefined,
    onAnswer: sendAnswer,
    onTimeout: sendTimeout,
  });
  const { state, forceOver } = game;

  // The server's word is final: if it says we're out, end our local game too.
  const serverSaysOut = me?.status === "out" && state.phase === "playing";
  useEffect(() => {
    if (serverSaysOut && me?.gameOverReason) forceOver(me.gameOverReason, me.lastInput);
  }, [serverSaysOut, me?.gameOverReason, me?.lastInput, forceOver]);

  // --- Still playing ---------------------------------------------------------
  if (state.phase === "playing" && room.phase === "playing") {
    return (
      <PlayingScreen
        state={state}
        secondsLeft={game.secondsLeft}
        onSubmit={game.submit}
        top={<OpponentsStrip room={room} myId={myId} />}
      />
    );
  }

  // Why I'm out: the server's reason if it has one (it's the one that counts).
  const reason = me?.gameOverReason ?? state.gameOverReason;
  const input = me?.gameOverReason ? me.lastInput : state.lastInput;
  // The pair they were on when knocked out (the server's, if it has one).
  const lastPair = me?.pair ?? state.pair;
  const why = reason && lastPair ? explainGameOver(reason, input, lastPair) : null;
  const myStreak = me?.streak ?? state.streak;

  // --- Results: everyone is out (or the sprint is over) ----------------------
  if (room.phase === "finished") {
    const ranked = rankPlayers(room.players, room.mode);
    const places = placesFor(ranked, room.mode);
    const winners = ranked.filter((_, i) => places[i] === 1);
    const winner = winners[0];
    const tie = winners.length > 1;
    const iWon = !tie && winner?.id === myId;
    const isHost = room.hostId === myId;
    const host = room.players.find((p) => p.id === room.hostId);
    const score = winner?.streak ?? 0;

    let title = iWon ? "You win!" : `${winner?.name ?? "Nobody"} wins!`;
    let subtitle = sprint
      ? `${iWon ? "You" : (winner?.name ?? "")} found ${score} ${score === 1 ? "word" : "words"}.`
      : `${iWon ? "You" : (winner?.name ?? "")} reached a streak of ${score}.`;
    if (tie) {
      const names = winners.map((p) => (p.id === myId ? "You" : p.name));
      title = "It's a tie!";
      subtitle = `${names.slice(0, -1).join(", ")} and ${names.at(-1)} found ${score} ${score === 1 ? "word" : "words"} each.`;
    }

    return (
      <section className="flex w-full flex-col items-center gap-8 text-center">
        <ScreenHeader title={title} subtitle={subtitle} />
        <Standings room={room} myId={myId} title="Final standings" />
        {/* In a sprint everyone's reason is "time's up", so it isn't worth a line. */}
        {why && !sprint && <p className="text-sm text-zinc-500 dark:text-zinc-400">You: {why}</p>}
        <div className="flex w-full max-w-xs flex-col gap-3">
          {isHost ? (
            <Button onClick={onRematch}>Rematch</Button>
          ) : (
            <p className="text-sm text-zinc-500">Waiting for {host?.name ?? "the host"} to start a rematch…</p>
          )}
          <LinkButton href="/" variant="secondary" onClick={onLeave}>
            Leave room
          </LinkButton>
        </div>
      </section>
    );
  }

  // --- I'm out, others are still going --------------------------------------
  return (
    <section className="flex w-full flex-col items-center gap-8 text-center">
      <ScreenHeader title={sprint ? "Time's up!" : "You're out"} subtitle={sprint ? undefined : (why ?? undefined)} />
      <div className="flex flex-col items-center gap-1">
        <div className="text-7xl leading-none font-bold tabular-nums">{myStreak}</div>
        <div className="text-sm text-zinc-500">{sprint ? "Your words" : "Your streak"}</div>
      </div>
      <Standings room={room} myId={myId} title="Live standings" />
      {game.exampleWords.length > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You could have tried:{" "}
          {game.exampleWords.map((word, i) => (
            <span key={word}>
              {i > 0 && " · "}
              <strong className="text-foreground">{word}</strong>
            </span>
          ))}
        </p>
      )}
      <p className="text-zinc-500">Waiting for the others to finish…</p>
      <BackLink onClick={onLeave}>Leave room</BackLink>
    </section>
  );
}
