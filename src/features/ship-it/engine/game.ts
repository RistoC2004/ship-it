import { applyEffects, diffMetrics } from "./metrics";
import { planRun } from "./plan";
import type {
  Choice,
  Decision,
  GameAction,
  GameContent,
  GameState,
  Incident,
  ScheduledFollowUp,
} from "./types";

/** Content plus lookup tables, built once per engine. */
export interface Library {
  readonly content: GameContent;
  readonly incidents: ReadonlyMap<string, Incident>;
}

export function indexContent(content: GameContent): Library {
  return {
    content,
    incidents: new Map(content.incidents.map((incident) => [incident.id, incident])),
  };
}

export function requireIncident(library: Library, id: string): Incident {
  const incident = library.incidents.get(id);
  if (!incident) throw new Error(`SHIP IT: unknown incident "${id}".`);
  return incident;
}

export function createGame(library: Library, seed: number): GameState {
  const normalizedSeed = seed >>> 0;
  const plan = planRun(library.content, normalizedSeed);
  return {
    seed: normalizedSeed,
    plan,
    followUps: plan.map(() => null),
    stageIndex: 0,
    incidentId: plan[0],
    phase: "incident",
    metrics: { ...library.content.rules.initialMetrics },
    minutesUsed: 0,
    risks: [],
    history: [],
  };
}

/**
 * Pure transition function. Actions that don't apply to the current phase
 * return the same state object so React can skip the re-render.
 */
export function reduceGame(library: Library, state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "choose":
      return choose(library, state, action.choiceId);
    case "advance":
      return advance(state);
    case "restart":
      return createGame(library, action.seed);
    default:
      return state;
  }
}

function choose(library: Library, state: GameState, choiceId: string): GameState {
  if (state.phase !== "incident") return state;
  const incident = requireIncident(library, state.incidentId);
  const choice = incident.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) return state;

  const metrics = applyEffects(state.metrics, choice.effects);
  const resolved = (choice.resolvesRisks ?? []).filter((risk) => state.risks.includes(risk));
  let risks = state.risks.filter((risk) => !resolved.includes(risk));
  let followUps = state.followUps;
  const added: string[] = [];

  if (choice.addsRisk && !risks.includes(choice.addsRisk)) {
    risks = [...risks, choice.addsRisk];
    added.push(choice.addsRisk);
    followUps = scheduleFollowUp(library, state, followUps, choice);
  }

  const minutesUsed = state.minutesUsed + choice.minutes;
  const decision: Decision = {
    stageIndex: state.stageIndex,
    incidentId: incident.id,
    choiceId: choice.id,
    grade: choice.grade,
    minutes: choice.minutes,
    applied: diffMetrics(state.metrics, metrics),
    risksAdded: added,
    risksResolved: resolved,
    at: minutesUsed,
  };

  return {
    ...state,
    phase: "feedback",
    metrics,
    minutesUsed,
    risks,
    followUps,
    history: [...state.history, decision],
  };
}

/**
 * A risk with a follow-up incident lands `followUpDelay` stages later (or on
 * the last stage). If that stage is already taken it tries the next one; if
 * none are left the risk simply ships and shows up in the release report.
 */
function scheduleFollowUp(
  library: Library,
  state: GameState,
  followUps: readonly (ScheduledFollowUp | null)[],
  choice: Choice,
): readonly (ScheduledFollowUp | null)[] {
  const riskId = choice.addsRisk;
  const incidentId = riskId ? library.content.risks[riskId]?.followUp : undefined;
  if (!riskId || !incidentId) return followUps;

  const alreadyUsed =
    followUps.some((slot) => slot?.incidentId === incidentId) ||
    state.history.some((decision) => decision.incidentId === incidentId);
  if (alreadyUsed) return followUps;

  const last = followUps.length - 1;
  const delay = library.content.rules.followUpDelay;
  const start = Math.max(state.stageIndex + 1, Math.min(state.stageIndex + delay, last));
  for (let stage = start; stage <= last; stage++) {
    if (followUps[stage] === null) {
      const next = followUps.slice();
      next[stage] = { incidentId, riskId };
      return next;
    }
  }
  return followUps;
}

function advance(state: GameState): GameState {
  if (state.phase !== "feedback") return state;
  const nextStage = state.stageIndex + 1;
  if (nextStage >= state.plan.length) return { ...state, phase: "complete" };

  const scheduled = state.followUps[nextStage];
  const incidentId =
    scheduled && state.risks.includes(scheduled.riskId) ? scheduled.incidentId : state.plan[nextStage];

  return { ...state, stageIndex: nextStage, incidentId, phase: "incident" };
}

export function minutesLeft(content: GameContent, state: GameState): number {
  return content.rules.windowMinutes - state.minutesUsed;
}

export function lastDecision(state: GameState): Decision | undefined {
  return state.history[state.history.length - 1];
}

export function isFollowUp(state: GameState, stageIndex = state.stageIndex): boolean {
  const incidentId = stageIndex === state.stageIndex ? state.incidentId : state.history[stageIndex]?.incidentId;
  return incidentId !== undefined && incidentId !== state.plan[stageIndex];
}
