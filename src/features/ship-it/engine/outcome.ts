import type { Library } from "./game";
import { minutesLeft, requireIncident } from "./game";
import { clampMetric } from "./metrics";
import type {
  Grade,
  Metrics,
  OutcomeId,
  PracticeDefinition,
  RiskDefinition,
  RiskSeverity,
  GameState,
  ScoreBreakdown,
  RunResult,
  GameRules,
} from "./types";

export const MAX_SCORE = 1000;

const SEVERITY_RANK: Readonly<Record<RiskSeverity, number>> = { medium: 1, high: 2, critical: 3 };

export function worstSeverity(risks: readonly RiskDefinition[]): RiskSeverity | null {
  let worst: RiskSeverity | null = null;
  for (const risk of risks) {
    if (!worst || SEVERITY_RANK[risk.severity] > SEVERITY_RANK[worst]) worst = risk.severity;
  }
  return worst;
}

/**
 * Checked from most to least serious. Shipped risks matter as much as the
 * meters: a release that looks healthy but carries a critical security hole
 * is still a production incident waiting to happen. A shortcut that already
 * came back as a follow-up reached real users, however well it was handled.
 */
export function determineOutcome(
  metrics: Metrics,
  risks: readonly RiskDefinition[],
  overtime: number,
  followUpsFaced = 0,
): OutcomeId {
  const worst = worstSeverity(risks);
  if (worst === "critical" || metrics.stability < 35 || metrics.userImpact >= 60) return "incident";
  if (worst === "high" || metrics.stability < 50 || metrics.userImpact >= 40) return "rollback";
  if (worst === "medium" || metrics.confidence < 50 || metrics.userImpact >= 25 || followUpsFaced > 0) {
    return "risky";
  }
  if (metrics.stability >= 80 && metrics.confidence >= 75 && metrics.userImpact <= 10 && overtime === 0) {
    return "clean";
  }
  return "stable";
}

export function scoreRun(
  rules: GameRules,
  metrics: Metrics,
  risks: readonly RiskDefinition[],
  overtime: number,
): { score: number; breakdown: ScoreBreakdown } {
  const { weights, riskPenalty, overtimePenaltyPerMinute, overtimePenaltyCap } = rules.scoring;
  const totalWeight = weights.stability + weights.confidence + weights.userImpact;
  const health =
    (weights.stability * clampMetric(metrics.stability) +
      weights.confidence * clampMetric(metrics.confidence) +
      weights.userImpact * (100 - clampMetric(metrics.userImpact))) /
    totalWeight;

  const breakdown: ScoreBreakdown = {
    health: Math.round(health * 10),
    riskPenalty: risks.reduce((sum, risk) => sum + riskPenalty[risk.severity], 0),
    overtimePenalty: Math.min(Math.max(0, overtime) * overtimePenaltyPerMinute, overtimePenaltyCap),
  };
  const raw = breakdown.health - breakdown.riskPenalty - breakdown.overtimePenalty;
  return { score: Math.min(MAX_SCORE, Math.max(0, raw)), breakdown };
}

export function evaluateRun(library: Library, state: GameState): RunResult {
  const { content } = library;
  const left = minutesLeft(content, state);
  const overtime = Math.max(0, -left);
  const risks = state.risks
    .map((id) => content.risks[id])
    .filter((risk): risk is RiskDefinition => risk !== undefined);

  const grades: Record<Grade, number> = { strong: 0, reasonable: 0, costly: 0, risky: 0 };
  const practices: PracticeDefinition[] = [];
  let followUpsFaced = 0;
  for (const decision of state.history) {
    grades[decision.grade] += 1;
    const incident = requireIncident(library, decision.incidentId);
    if (incident.stage === "follow-up") followUpsFaced += 1;
    const choice = incident.choices.find((candidate) => candidate.id === decision.choiceId);
    const practice = choice?.practice ? content.practices[choice.practice] : undefined;
    if (practice && !practices.includes(practice)) practices.push(practice);
  }

  const { score, breakdown } = scoreRun(content.rules, state.metrics, risks, overtime);
  return {
    outcome: determineOutcome(state.metrics, risks, overtime, followUpsFaced),
    score,
    breakdown,
    metrics: state.metrics,
    minutesLeft: left,
    overtime,
    risks,
    followUpsFaced,
    practices,
    grades,
  };
}
