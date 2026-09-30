import type { GameRules } from "../engine/types";

export const RULES: GameRules = {
  // 16:20 → 18:00. Best play fits comfortably; being thorough everywhere doesn't.
  windowMinutes: 100,
  clockStart: 16 * 60 + 20,
  initialMetrics: { stability: 60, userImpact: 0, confidence: 35 },
  followUpDelay: 2,
  requiredTags: ["ai"],
  scoring: {
    weights: { stability: 4, confidence: 3.5, userImpact: 2.5 },
    riskPenalty: { medium: 60, high: 120, critical: 200 },
    overtimePenaltyPerMinute: 4,
    overtimePenaltyCap: 200,
  },
};
