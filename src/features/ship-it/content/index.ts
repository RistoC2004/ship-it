import type { GameContent } from "../engine/types";
import { CANARY_INCIDENTS } from "./incidents/canary";
import { CI_INCIDENTS } from "./incidents/ci";
import { FOLLOW_UP_INCIDENTS } from "./incidents/follow-ups";
import { PRODUCTION_INCIDENTS } from "./incidents/production";
import { REVIEW_INCIDENTS } from "./incidents/review";
import { STAGING_INCIDENTS } from "./incidents/staging";
import { PRACTICES } from "./practices";
import { RISKS } from "./risks";
import { RULES } from "./rules";
import { STAGES } from "./stages";

/**
 * The full SHIP IT library. To add an incident, append it to the stage file
 * it belongs to; `npm test` validates references, grading and balance.
 */
export const SHIP_IT_CONTENT: GameContent = {
  stages: STAGES,
  incidents: [
    ...CI_INCIDENTS,
    ...REVIEW_INCIDENTS,
    ...STAGING_INCIDENTS,
    ...CANARY_INCIDENTS,
    ...PRODUCTION_INCIDENTS,
    ...FOLLOW_UP_INCIDENTS,
  ],
  risks: RISKS,
  practices: PRACTICES,
  rules: RULES,
};
