import type { Grade, OutcomeId, Severity } from "../engine/types";

export type Tone = "good" | "info" | "warn" | "bad";

export const GRADE_COPY: Readonly<Record<Grade, { label: string; tone: Tone }>> = {
  strong: { label: "Strong call", tone: "good" },
  reasonable: { label: "Reasonable", tone: "info" },
  costly: { label: "Costly", tone: "warn" },
  risky: { label: "Risky", tone: "bad" },
};

export const SEVERITY_COPY: Readonly<Record<Severity, { label: string; tone: Tone }>> = {
  sev1: { label: "SEV-1", tone: "bad" },
  sev2: { label: "SEV-2", tone: "warn" },
  sev3: { label: "SEV-3", tone: "info" },
};

export const OUTCOME_COPY: Readonly<
  Record<OutcomeId, { label: string; headline: string; body: string; tone: Tone }>
> = {
  clean: {
    label: "Clean ship",
    headline: "Shipped clean.",
    body: "On time, verified, and nothing waiting to page anyone tonight.",
    tone: "good",
  },
  stable: {
    label: "Stable release",
    headline: "Shipped, and holding.",
    body: "A few calls cost time or confidence, but production is healthy.",
    tone: "good",
  },
  risky: {
    label: "Risky deployment",
    headline: "Shipped, with a few scars.",
    body: "It's live, but something slipped through or never got verified. Worth a proper look in the morning.",
    tone: "warn",
  },
  rollback: {
    label: "Rollback required",
    headline: "Rolled back, this time.",
    body: "Enough went wrong that v2.4.0 came back out. Nothing permanent; that's what rollbacks are for.",
    tone: "warn",
  },
  incident: {
    label: "Production incident",
    headline: "Paged at 2 a.m.",
    body: "Something serious reached real users. Most engineers have a release like this, and the post-mortem is where the learning happens.",
    tone: "bad",
  },
};

export const METRIC_LABELS = {
  stability: "Stability",
  userImpact: "User impact",
  confidence: "Confidence",
} as const;
