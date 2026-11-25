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
//
// The parent renders this with key={seed}, so every new game starts fresh.
//
// Screens:  playing -> "You're out" (others still playing) -> results
// =============================================================================

import { useEffect } from "react";
import { useGame } from "@/hooks/useGame";
import type { WordData } from "@/lib/game/types";
import { explainGameOver } from "@/lib/game/validator";
import { rankPlayers, type RoomState } from "@/lib/multiplayer/room";
import { PlayingScreen } from "../PlayingScreen";
import { BackLink, Button, LinkButton, ScreenHeader } from "../ui";
import { OpponentsStrip } from "./OpponentsStrip";
import { Standings } from "./Standings";

export interface MultiplayerGameProps {
  room: RoomState; // phase "playing" or "finished", with a seed and time limit
  myId: string;
  data: WordData;
  sendAnswer: (round: number, input: string) => void;
  sendTimeout: (round: number) => void;
  onRematch: () => void;
  onLeave: () => void; // free my seat before going home
}

export function MultiplayerGame({
  room,
  myId,
  data,
  sendAnswer,
  sendTimeout,
  onRematch,
  onLeave,
}: MultiplayerGameProps) {
  const me = room.players.find((p) => p.id === myId);
  const game = useGame(data, {
    // Pick up where the server says we are: round 0 for a new game, or our
    // streak, words and pair if we're coming back after a reload.
    autoStart:
      room.seed && room.timeLimit
        ? {
            seed: room.seed,
            timeLimit: room.timeLimit,
            resume:
              me && me.pair && (me.streak > 0 || me.usedWords.length > 0)
                ? { streak: me.streak, usedWords: me.usedWords, pair: me.pair }
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

  // --- Results: everyone is out ---------------------------------------------
  if (room.phase === "finished") {
    const winner = rankPlayers(room.players)[0];
    const iWon = winner?.id === myId;
    const isHost = room.hostId === myId;
    const host = room.players.find((p) => p.id === room.hostId);
    return (
      <section className="flex w-full flex-col items-center gap-8 text-center">
        <ScreenHeader
          title={iWon ? "You win!" : `${winner?.name ?? "Nobody"} wins!`}
          subtitle={`${iWon ? "You" : (winner?.name ?? "")} reached a streak of ${winner?.streak ?? 0}.`}
        />
        <Standings room={room} myId={myId} title="Final standings" />
        {why && <p className="text-sm text-zinc-500 dark:text-zinc-400">You: {why}</p>}
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
      <ScreenHeader title="You're out" subtitle={why ?? undefined} />
      <div className="flex flex-col items-center gap-1">
        <div className="text-7xl leading-none font-bold tabular-nums">{myStreak}</div>
        <div className="text-sm text-zinc-500">Your streak</div>
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
