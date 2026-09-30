import type { Evidence } from "../engine/types";

export type LineKind = "added" | "removed" | "comment" | "alert" | "plain";

const ALERT = /(✕|⚠|\b(?:401|403|5xx)\b|error|failed|TypeError|exhausted|Invalid Date|Seq Scan)/i;

/** Light, dependency-free highlighting for evidence snippets. */
export function classifyLine(kind: Evidence["kind"], line: string): LineKind {
  if (kind === "diff") {
    if (line.startsWith("+")) return "added";
    if (line.startsWith("-")) return "removed";
  }
  if (/^\s*\/\//.test(line)) return "comment";
  if (kind !== "code" && ALERT.test(line)) return "alert";
  return "plain";
}

export const EVIDENCE_KIND_LABEL: Readonly<Record<Evidence["kind"], string>> = {
  log: "Log",
  diff: "Diff",
  code: "Code",
  metrics: "Metrics",
};
