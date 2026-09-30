import { createGame, indexContent, isFollowUp, lastDecision, minutesLeft, reduceGame, requireIncident } from "./game";
import { evaluateRun } from "./outcome";
import { orderChoices } from "./plan";
import { formatClock, windowClose } from "./clock";
import { buildReleaseLog, stageStatuses } from "./selectors";
import type { Choice, GameAction, GameContent, GameState, Incident } from "./types";

export type * from "./types";
export { formatClock, windowClose } from "./clock";
export { applyEffects, clampMetric, isImprovement, METRIC_KEYS, metricBand, userImpactLabel } from "./metrics";
export type { Band } from "./metrics";
export { determineOutcome, MAX_SCORE, scoreRun, worstSeverity } from "./outcome";
export { planRun, orderChoices } from "./plan";
export { createRng, decodeSeed, deriveSeed, encodeSeed, hashString, shuffle } from "./rng";
export { validateContent } from "./validate";

/**
 * Binds the pure engine functions to one incident library. The UI holds a
 * single engine instance; tests build their own from fixtures.
 */
export function createEngine(content: GameContent) {
  const library = indexContent(content);

  return {
    content,
    newGame: (seed: number): GameState => createGame(library, seed),
    reduce: (state: GameState, action: GameAction): GameState => reduceGame(library, state, action),
    incident: (id: string): Incident => requireIncident(library, id),
    currentIncident: (state: GameState): Incident => requireIncident(library, state.incidentId),
    /** The current incident's choices, in this run's seeded display order. */
    choices: (state: GameState): Choice[] => orderChoices(state.seed, requireIncident(library, state.incidentId)),
    choice: (incidentId: string, choiceId: string): Choice | undefined =>
      requireIncident(library, incidentId).choices.find((choice) => choice.id === choiceId),
    minutesLeft: (state: GameState): number => minutesLeft(content, state),
    lastDecision,
    isFollowUp,
    stageStatuses,
    releaseLog: (state: GameState) => buildReleaseLog(library, state),
    result: (state: GameState) => evaluateRun(library, state),
    clock: (minutesIntoRun: number): string => formatClock(content.rules, minutesIntoRun),
    windowClose: (): string => windowClose(content.rules),
  };
}

export type ShipItEngine = ReturnType<typeof createEngine>;
