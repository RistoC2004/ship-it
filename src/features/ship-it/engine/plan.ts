import { createRng, deriveSeed, randomInt, shuffle } from "./rng";
import type { Choice, GameContent, Incident } from "./types";

const MAX_SAMPLES = 256;

/**
 * Draws one incident per stage for a seed.
 *
 * Constraints:
 * - no two incidents share a `concept` (a run never asks the same question twice)
 * - every tag in `rules.requiredTags` appears at least once (e.g. one AI incident)
 *
 * Rejection sampling keeps every valid plan equally likely, so a constraint
 * never quietly over-represents one incident. If sampling can't find a plan
 * (pathological content), a depth-first search either finds one or proves
 * none exists. Both paths are deterministic for a seed.
 */
export function planRun(content: GameContent, seed: number): string[] {
  const rng = createRng(deriveSeed(seed, "plan"));
  const pools = content.stages.map((stage) =>
    content.incidents.filter((incident) => incident.stage === stage.id),
  );
  if (pools.some((pool) => pool.length === 0)) {
    throw new Error("SHIP IT: every stage needs at least one incident.");
  }

  const isValid = (plan: readonly Incident[]) =>
    new Set(plan.map((incident) => incident.concept)).size === plan.length &&
    content.rules.requiredTags.every((tag) => plan.some((incident) => incident.tags.includes(tag)));

  for (let sample = 0; sample < MAX_SAMPLES; sample++) {
    const plan = pools.map((pool) => pool[randomInt(rng, pool.length)]);
    if (isValid(plan)) return plan.map((incident) => incident.id);
  }

  const plan = searchPlan(
    pools.map((pool) => shuffle(pool, rng)),
    isValid,
  );
  if (!plan) throw new Error("SHIP IT: the incident library cannot satisfy the run constraints.");
  return plan.map((incident) => incident.id);
}

function searchPlan(
  pools: readonly (readonly Incident[])[],
  isValid: (plan: readonly Incident[]) => boolean,
): Incident[] | null {
  const picked: Incident[] = [];
  const search = (depth: number): boolean => {
    if (depth === pools.length) return isValid(picked);
    for (const candidate of pools[depth]) {
      if (picked.some((incident) => incident.concept === candidate.concept)) continue;
      picked.push(candidate);
      if (search(depth + 1)) return true;
      picked.pop();
    }
    return false;
  };
  return search(0) ? picked : null;
}

/** Choices are shown in a seeded order so the best answer isn't always first. */
export function orderChoices(seed: number, incident: Incident): Choice[] {
  return shuffle(incident.choices, createRng(deriveSeed(seed, `choices:${incident.id}`)));
}
