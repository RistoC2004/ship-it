import type { Library } from "./game";
import { isFollowUp, requireIncident } from "./game";
import type { Grade, LogEntry, LogTone, GameState, Severity, StageStatus } from "./types";

export function stageStatuses(state: GameState): StageStatus[] {
  return state.plan.map((_, index) => {
    if (index < state.stageIndex || (index === state.stageIndex && state.phase !== "incident")) {
      const decision = state.history[index];
      if (!decision) return "passed";
      return decision.risksAdded.length > 0 || decision.grade === "risky" ? "warned" : "passed";
    }
    if (index === state.stageIndex) return isFollowUp(state) ? "alert" : "active";
    return "pending";
  });
}

const SEVERITY_TONE: Readonly<Record<Severity, LogTone>> = { sev1: "bad", sev2: "warn", sev3: "warn" };
const GRADE_TONE: Readonly<Record<Grade, LogTone>> = {
  strong: "good",
  reasonable: "good",
  costly: "warn",
  risky: "bad",
};

/**
 * The release log is derived from state rather than stored, so it can never
 * disagree with what actually happened in the run.
 */
export function buildReleaseLog(library: Library, state: GameState): LogEntry[] {
  const { content } = library;
  const entries: LogEntry[] = [
    { id: "start", minute: 0, stage: null, tone: "info", text: "release/v2.4.0 · pipeline started" },
  ];

  const openedStages = state.phase === "incident" ? state.stageIndex + 1 : state.history.length;
  for (let index = 0; index < openedStages; index++) {
    const decision = state.history[index];
    const incidentId = decision?.incidentId ?? state.incidentId;
    const incident = requireIncident(library, incidentId);
    const stage = content.stages[index]?.id ?? null;
    const opened = index === 0 ? 0 : (state.history[index - 1]?.at ?? state.minutesUsed);

    entries.push({
      id: `open-${index}`,
      minute: opened,
      stage,
      tone: SEVERITY_TONE[incident.severity],
      text: incident.log,
    });

    if (!decision) continue;
    const choice = incident.choices.find((candidate) => candidate.id === decision.choiceId);
    entries.push({
      id: `decide-${index}`,
      minute: decision.at,
      stage,
      tone: GRADE_TONE[decision.grade],
      text: choice?.log ?? choice?.label ?? decision.choiceId,
    });
    for (const riskId of decision.risksResolved) {
      entries.push({
        id: `resolved-${index}-${riskId}`,
        minute: decision.at,
        stage,
        tone: "good",
        text: `Resolved: ${content.risks[riskId]?.title ?? riskId}`,
      });
    }
    for (const riskId of decision.risksAdded) {
      entries.push({
        id: `risk-${index}-${riskId}`,
        minute: decision.at,
        stage,
        tone: "warn",
        text: `Known risk: ${content.risks[riskId]?.title ?? riskId}`,
      });
    }
  }
  return entries;
}
