/**
 * Domain model for SHIP IT.
 *
 * The engine is content-agnostic: it only knows about stages, incidents,
 * choices, risks and practices by id. The incident library lives in
 * `../content` and can be swapped for fixtures in tests.
 *
 * Everything in `engine/` is plain, erasable TypeScript (no JSX, enums or
 * runtime imports from React), so it runs unchanged under `node --test`.
 */

export type MetricKey = "stability" | "userImpact" | "confidence";

/** Release health. Every value is clamped to 0–100. Lower userImpact is better. */
export type Metrics = Readonly<Record<MetricKey, number>>;

export type MetricDelta = Readonly<Partial<Record<MetricKey, number>>>;

export type Grade = "strong" | "reasonable" | "costly" | "risky";

export type Severity = "sev1" | "sev2" | "sev3";

export type RiskSeverity = "medium" | "high" | "critical";

export type StageId = "ci" | "review" | "staging" | "canary" | "production";

export interface StageDefinition {
  readonly id: StageId;
  readonly label: string;
  readonly short: string;
}

export interface Evidence {
  readonly kind: "log" | "diff" | "code" | "metrics";
  readonly title: string;
  readonly lines: readonly string[];
}

export interface RelatedWork {
  readonly project: string;
  /** Element id of the project card on the portfolio page. */
  readonly anchor: string;
  readonly note: string;
}

export interface Choice {
  readonly id: string;
  readonly label: string;
  /** Simulated minutes of the release window this action consumes. */
  readonly minutes: number;
  readonly grade: Grade;
  readonly effects: MetricDelta;
  /** One or two sentences shown after the choice is made. */
  readonly feedback: string;
  /** Short release-log line. Falls back to the label. */
  readonly log?: string;
  /** A latent problem this choice leaves in the release. */
  readonly addsRisk?: string;
  readonly resolvesRisks?: readonly string[];
  /** Engineering practice credited on the results screen. */
  readonly practice?: string;
}

export interface Incident {
  readonly id: string;
  /**
   * Stage pool this incident is drawn from, or "follow-up" for incidents
   * that only appear as the consequence of a risk added earlier in the run.
   */
  readonly stage: StageId | "follow-up";
  readonly title: string;
  readonly summary: string;
  readonly severity: Severity;
  /** Short display label, e.g. "Authentication". */
  readonly category: string;
  /** At most one incident per concept is drawn into a run. */
  readonly concept: string;
  readonly tags: readonly string[];
  readonly evidence?: Evidence;
  /** Release-log line written when the incident opens. */
  readonly log: string;
  readonly choices: readonly Choice[];
  readonly related?: RelatedWork;
}

export interface RiskDefinition {
  readonly id: string;
  readonly title: string;
  readonly severity: RiskSeverity;
  /** Incident that surfaces later in the run if this risk is still open. */
  readonly followUp?: string;
}

export interface PracticeDefinition {
  readonly id: string;
  readonly label: string;
}

export interface GameRules {
  /** Length of the release window in simulated minutes. */
  readonly windowMinutes: number;
  /** Clock time the run starts at, in minutes after midnight. */
  readonly clockStart: number;
  readonly initialMetrics: Metrics;
  /** How many stages after the risky decision a follow-up incident lands. */
  readonly followUpDelay: number;
  /** Every run must include at least one incident with each of these tags. */
  readonly requiredTags: readonly string[];
  readonly scoring: {
    readonly weights: Readonly<Record<MetricKey, number>>;
    readonly riskPenalty: Readonly<Record<RiskSeverity, number>>;
    readonly overtimePenaltyPerMinute: number;
    readonly overtimePenaltyCap: number;
  };
}

export interface GameContent {
  readonly stages: readonly StageDefinition[];
  readonly incidents: readonly Incident[];
  readonly risks: Readonly<Record<string, RiskDefinition>>;
  readonly practices: Readonly<Record<string, PracticeDefinition>>;
  readonly rules: GameRules;
}

export type Phase = "incident" | "feedback" | "complete";

export interface ScheduledFollowUp {
  readonly incidentId: string;
  /** The follow-up only fires if this risk is still open when its stage starts. */
  readonly riskId: string;
}

export interface Decision {
  readonly stageIndex: number;
  readonly incidentId: string;
  readonly choiceId: string;
  readonly grade: Grade;
  readonly minutes: number;
  /** Metric change actually applied, after clamping. */
  readonly applied: Metrics;
  readonly risksAdded: readonly string[];
  readonly risksResolved: readonly string[];
  /** Minutes used when the decision finished. */
  readonly at: number;
}

export interface GameState {
  readonly seed: number;
  /** The incident drawn for each stage when the run was created. */
  readonly plan: readonly string[];
  /** Follow-up incidents waiting to replace a planned stage, by stage index. */
  readonly followUps: readonly (ScheduledFollowUp | null)[];
  readonly stageIndex: number;
  /** Incident being played at `stageIndex` (planned or follow-up). */
  readonly incidentId: string;
  readonly phase: Phase;
  readonly metrics: Metrics;
  readonly minutesUsed: number;
  /** Open risks, in the order they were added. */
  readonly risks: readonly string[];
  readonly history: readonly Decision[];
}

export type GameAction =
  | { readonly type: "choose"; readonly choiceId: string }
  | { readonly type: "advance" }
  | { readonly type: "restart"; readonly seed: number };

export type OutcomeId = "clean" | "stable" | "risky" | "rollback" | "incident";

export interface ScoreBreakdown {
  /** 0–1000 from the weighted metrics alone. */
  readonly health: number;
  readonly riskPenalty: number;
  readonly overtimePenalty: number;
}

export interface RunResult {
  readonly outcome: OutcomeId;
  readonly score: number;
  readonly breakdown: ScoreBreakdown;
  readonly metrics: Metrics;
  readonly minutesLeft: number;
  readonly overtime: number;
  readonly risks: readonly RiskDefinition[];
  /** Follow-up incidents the run ran into, i.e. shortcuts that reached users. */
  readonly followUpsFaced: number;
  readonly practices: readonly PracticeDefinition[];
  readonly grades: Readonly<Record<Grade, number>>;
}

export type StageStatus = "pending" | "active" | "alert" | "passed" | "warned";

export type LogTone = "info" | "good" | "warn" | "bad";

export interface LogEntry {
  readonly id: string;
  readonly minute: number;
  readonly stage: StageId | null;
  readonly tone: LogTone;
  readonly text: string;
}
