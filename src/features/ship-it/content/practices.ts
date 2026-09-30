import type { PracticeDefinition } from "../engine/types";

/** Credited on the release report when a strong call uses them. */
export const PRACTICES = {
  reproduce: { id: "reproduce", label: "Reproduced it before fixing it" },
  scope: { id: "scope", label: "Kept the release scope tight" },
  secrets: { id: "secrets", label: "Kept secrets on the server" },
  "review-ai": { id: "review-ai", label: "Reviewed AI-generated code before shipping" },
  "ai-triage": { id: "ai-triage", label: "Used AI to narrow the search, then verified" },
  idempotency: { id: "idempotency", label: "Made writes safe to retry" },
  "db-invariants": { id: "db-invariants", label: "Let the database enforce the invariant" },
  evidence: { id: "evidence", label: "Let the logs make the call" },
  "least-privilege": { id: "least-privilege", label: "Kept access least-privilege" },
  validate: { id: "validate", label: "Treated model output as untrusted input" },
  "rollback-first": { id: "rollback-first", label: "Rolled back before debugging" },
  measure: { id: "measure", label: "Found the bottleneck before scaling" },
  disclose: { id: "disclose", label: "Owned the incident, audit trail and all" },
} as const satisfies Record<string, PracticeDefinition>;

export type PracticeId = keyof typeof PRACTICES;
