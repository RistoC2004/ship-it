import type { RiskDefinition } from "../engine/types";

/**
 * Latent problems a choice can leave in the release. Risks with a `followUp`
 * come back as an incident later in the same run; the rest ship and show up
 * in the release report.
 */
export const RISKS = {
  rounding: { id: "rounding", title: "Discount totals can be off by a cent", severity: "medium" },
  "billing-undefined": {
    id: "billing-undefined",
    title: "Trial accounts can break invoice generation",
    severity: "medium",
  },
  "leaked-key": {
    id: "leaked-key",
    title: "Live payments key exposed in client JavaScript",
    severity: "critical",
    followUp: "fu-key-abuse",
  },
  "unrotated-key": { id: "unrotated-key", title: "A leaked payments key was never rotated", severity: "high" },
  idor: {
    id: "idor",
    title: "Any signed-in user can read any other user's orders",
    severity: "critical",
    followUp: "fu-order-exposure",
  },
  "duplicate-orders": {
    id: "duplicate-orders",
    title: "Retries and double taps can still charge twice",
    severity: "high",
  },
  "lost-updates": {
    id: "lost-updates",
    title: "Simultaneous group edits silently overwrite each other",
    severity: "medium",
  },
  "open-reports": {
    id: "open-reports",
    title: "Reports API reachable without authentication",
    severity: "critical",
    followUp: "fu-open-reports",
  },
  "public-files": {
    id: "public-files",
    title: "User photos readable by anyone with a URL",
    severity: "critical",
    followUp: "fu-exposed-files",
  },
  "service-key": {
    id: "service-key",
    title: "Service-role key shipped inside the app",
    severity: "critical",
    followUp: "fu-exposed-files",
  },
  "shared-write": { id: "shared-write", title: "Any user can overwrite another user's photo", severity: "high" },
  "unvalidated-ai": {
    id: "unvalidated-ai",
    title: "Malformed AI output reaches clients unchecked",
    severity: "medium",
  },
  "slow-query": { id: "slow-query", title: "Unindexed order lookups slow down as data grows", severity: "medium" },
  "stale-orders": { id: "stale-orders", title: "Order history can be stale right after checkout", severity: "medium" },
  "retry-dupes": { id: "retry-dupes", title: "Client retries can still create duplicate records", severity: "high" },
  "turn-race": { id: "turn-race", title: "Two members can still claim the same daily turn", severity: "medium" },
  "pool-leak": { id: "pool-leak", title: "A connection leak is hidden behind a bigger pool", severity: "high" },
} as const satisfies Record<string, RiskDefinition>;

export type RiskId = keyof typeof RISKS;
