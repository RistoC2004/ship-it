import type { StageDefinition } from "../engine/types";

/** The release pipeline, in order. One incident is drawn per stage. */
export const STAGES = [
  { id: "ci", label: "Build & CI", short: "Build" },
  { id: "review", label: "Code review", short: "Review" },
  { id: "staging", label: "Staging", short: "Staging" },
  { id: "canary", label: "Canary · 5%", short: "Canary" },
  { id: "production", label: "Production", short: "Prod" },
] as const satisfies readonly StageDefinition[];
