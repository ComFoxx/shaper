import type { GameAction, GameContext, GameEvent, GameGuard } from "../types";

export const isCurrentPlayer = (
  context: GameContext,
  event: { playerId: string }
) => {
  return context.currentPlayer?.id === event.playerId;
};

export const canJoinGame: GameGuard<"join"> = (context: GameContext, event) => {
  return context.players.find((p) => p.id === event.playerId) === undefined;
};

export const canReady: GameGuard<"ready"> = (context, event) => {
  return context.players.find((p) => p.id === event.playerId)?.ready === false;
};

export const canStartGame = (
  context: GameContext,
  event: { playerId: string }
) => {
  return (
    context.players.filter((p) => p.ready).length > 3 &&
    context.players[0].id === event.playerId
  );
};

export const canChooseWord: GameGuard<"chooseWord"> = (context, event) => {
  return (
    context.availableWords.find((word) => word.name === event.word) !==
    undefined
  );
};

export const canDrawLine = (context: GameContext) => {
  return context.lines.length < context.linesLimit;
};

export const isRightWord = (context: GameContext, event: { word: string }) => {
  return context.wordToGuess?.name.toLowerCase() === event.word.toLowerCase();
};

export const hasWinner = (context: GameContext) => {
  console.log(
    "Testing hasWinner : ",
    context.players.find((p) => p.score >= context.scoreLimit) !== undefined
  );
  return (
    context.players.find((p) => p.score >= context.scoreLimit) !== undefined
  );
};

/**
 * Utilities
 */
export function combineGuards<E extends GameEvent["type"]>(
  ...conds: GameGuard<E>[]
): GameGuard<E> {
  return (context, event) => {
    for (const cond of conds) {
      if (!cond(context, event)) {
        return false;
      }
    }
    return true;
  };
}

export function reverseGuard<E extends Function>(fn: E) {
  return (...args: unknown[]) => !fn(...args);
}
