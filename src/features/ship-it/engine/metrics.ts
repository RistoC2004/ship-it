import type { MetricDelta, MetricKey, Metrics } from "./types";

export const METRIC_KEYS: readonly MetricKey[] = ["stability", "userImpact", "confidence"];

export const METRIC_MIN = 0;
export const METRIC_MAX = 100;

export function clampMetric(value: number): number {
  if (Number.isNaN(value)) return METRIC_MIN;
  return Math.min(METRIC_MAX, Math.max(METRIC_MIN, Math.round(value)));
}

export function applyEffects(metrics: Metrics, effects: MetricDelta): Metrics {
  return {
    stability: clampMetric(metrics.stability + (effects.stability ?? 0)),
    userImpact: clampMetric(metrics.userImpact + (effects.userImpact ?? 0)),
    confidence: clampMetric(metrics.confidence + (effects.confidence ?? 0)),
  };
}

export function diffMetrics(before: Metrics, after: Metrics): Metrics {
  return {
    stability: after.stability - before.stability,
    userImpact: after.userImpact - before.userImpact,
    confidence: after.confidence - before.confidence,
  };
}

/** userImpact is the only metric where a smaller number is better. */
export function isImprovement(key: MetricKey, delta: number): boolean {
  return key === "userImpact" ? delta < 0 : delta > 0;
}

export type Band = "good" | "watch" | "poor";

/** Shared thresholds so the meters and the release outcome agree. */
export function metricBand(key: MetricKey, value: number): Band {
  if (key === "userImpact") {
    if (value <= 10) return "good";
    if (value < 40) return "watch";
    return "poor";
  }
  if (value >= 75) return "good";
  if (value >= 50) return "watch";
  return "poor";
}

export function userImpactLabel(value: number): string {
  if (value <= 0) return "None";
  if (value <= 10) return "Low";
  if (value < 25) return "Moderate";
  if (value < 60) return "High";
  return "Severe";
}
