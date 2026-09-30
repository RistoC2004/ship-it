import { useCallback, useRef, useState } from "react";
import type { GameAction, GameState } from "../engine/types";
import { shipIt } from "./engine";
import { recordBestScore } from "./stores";

/**
 * React binding for the engine. State changes go through the pure reducer;
 * side effects of a transition (saving a personal best) happen here, in the
 * event that caused them, rather than in an effect reacting to state.
 */
export function useShipIt(initialSeed: number) {
  const [state, setState] = useState<GameState>(() => shipIt.newGame(initialSeed));
  const [run, setRun] = useState({ key: 0, isNewBest: false });
  // Handlers read the latest state from a ref so a fast double press can't
  // act on a stale render.
  const latest = useRef(state);

  const dispatch = useCallback((action: GameAction) => {
    const current = latest.current;
    const next = shipIt.reduce(current, action);
    if (next === current) return;
    latest.current = next;
    setState(next);

    if (action.type === "restart") {
      setRun((previous) => ({ key: previous.key + 1, isNewBest: false }));
    } else if (next.phase === "complete" && current.phase !== "complete") {
      const isNewBest = recordBestScore(shipIt.result(next).score);
      setRun((previous) => ({ ...previous, isNewBest }));
    }
  }, []);

  const choose = useCallback((choiceId: string) => dispatch({ type: "choose", choiceId }), [dispatch]);
  const advance = useCallback(() => dispatch({ type: "advance" }), [dispatch]);
  const restart = useCallback((seed: number) => dispatch({ type: "restart", seed }), [dispatch]);

  return { state, runKey: run.key, isNewBest: run.isNewBest, choose, advance, restart };
}
