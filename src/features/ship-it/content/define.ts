import type { Choice, Incident } from "../engine/types";
import type { PracticeId } from "./practices";
import type { RiskId } from "./risks";

type ChoiceDefinition = Omit<Choice, "addsRisk" | "resolvesRisks" | "practice"> & {
  readonly addsRisk?: RiskId;
  readonly resolvesRisks?: readonly RiskId[];
  readonly practice?: PracticeId;
};

type IncidentDefinition = Omit<Incident, "choices"> & {
  readonly choices: readonly ChoiceDefinition[];
};

/**
 * Identity helper that narrows risk and practice ids to the known catalogs,
 * so a typo in a new incident is a compile error rather than a runtime one.
 */
export function defineIncidents(incidents: readonly IncidentDefinition[]): readonly Incident[] {
  return incidents;
}
