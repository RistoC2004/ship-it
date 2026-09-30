import type { GameContent } from "./types";

const MIN_CHOICES = 3;
const MAX_CHOICES = 4;
const MAX_EFFECT = 40;

/**
 * Structural checks for an incident library. Returns human-readable problems;
 * an empty array means the content is safe to play. Run in the test suite so
 * a typo in a new incident fails CI instead of a player's run.
 */
export function validateContent(content: GameContent): string[] {
  const problems: string[] = [];
  const incidentIds = new Set<string>();
  const stageIds = new Set(content.stages.map((stage) => stage.id));
  const followUpTargets = new Set(
    Object.values(content.risks)
      .map((risk) => risk.followUp)
      .filter((id): id is string => id !== undefined),
  );

  if (content.stages.length === 0) problems.push("No stages defined.");
  if (stageIds.size !== content.stages.length) problems.push("Stage ids must be unique.");

  for (const [key, risk] of Object.entries(content.risks)) {
    if (risk.id !== key) problems.push(`Risk "${key}" has mismatched id "${risk.id}".`);
  }
  for (const [key, practice] of Object.entries(content.practices)) {
    if (practice.id !== key) problems.push(`Practice "${key}" has mismatched id "${practice.id}".`);
  }

  for (const incident of content.incidents) {
    const where = `Incident "${incident.id}"`;
    if (incidentIds.has(incident.id)) problems.push(`${where} is defined twice.`);
    incidentIds.add(incident.id);

    if (incident.stage !== "follow-up" && !stageIds.has(incident.stage)) {
      problems.push(`${where} uses unknown stage "${incident.stage}".`);
    }
    if (incident.stage === "follow-up" && !followUpTargets.has(incident.id)) {
      problems.push(`${where} is a follow-up that no risk triggers.`);
    }
    if (incident.stage !== "follow-up" && followUpTargets.has(incident.id)) {
      problems.push(`${where} is triggered as a follow-up but also drawn for a stage.`);
    }
    if (incident.choices.length < MIN_CHOICES || incident.choices.length > MAX_CHOICES) {
      problems.push(`${where} needs ${MIN_CHOICES}–${MAX_CHOICES} choices.`);
    }
    if (!incident.choices.some((choice) => choice.grade === "strong")) {
      problems.push(`${where} has no strong choice, so it can't be played well.`);
    }

    const choiceIds = new Set<string>();
    for (const choice of incident.choices) {
      const at = `${where} choice "${choice.id}"`;
      if (choiceIds.has(choice.id)) problems.push(`${at} is defined twice.`);
      choiceIds.add(choice.id);

      if (!Number.isInteger(choice.minutes) || choice.minutes <= 0) {
        problems.push(`${at} must cost a positive whole number of minutes.`);
      }
      for (const [metric, value] of Object.entries(choice.effects)) {
        if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > MAX_EFFECT) {
          problems.push(`${at} has an out-of-range ${metric} effect.`);
        }
      }
      if (choice.addsRisk && !content.risks[choice.addsRisk]) {
        problems.push(`${at} adds unknown risk "${choice.addsRisk}".`);
      }
      for (const risk of choice.resolvesRisks ?? []) {
        if (!content.risks[risk]) problems.push(`${at} resolves unknown risk "${risk}".`);
      }
      if (choice.practice && !content.practices[choice.practice]) {
        problems.push(`${at} credits unknown practice "${choice.practice}".`);
      }
      if (choice.grade === "strong" && choice.addsRisk) {
        problems.push(`${at} is graded strong but leaves a risk behind.`);
      }
    }
  }

  for (const risk of Object.values(content.risks)) {
    if (!risk.followUp) continue;
    const target = content.incidents.find((incident) => incident.id === risk.followUp);
    if (!target) {
      problems.push(`Risk "${risk.id}" follows up with unknown incident "${risk.followUp}".`);
    } else if (!target.choices.some((choice) => choice.resolvesRisks?.includes(risk.id))) {
      problems.push(`Follow-up "${target.id}" offers no way to resolve risk "${risk.id}".`);
    }
  }

  for (const stage of content.stages) {
    if (!content.incidents.some((incident) => incident.stage === stage.id)) {
      problems.push(`Stage "${stage.id}" has no incidents to draw.`);
    }
  }
  for (const tag of content.rules.requiredTags) {
    if (!content.incidents.some((incident) => incident.stage !== "follow-up" && incident.tags.includes(tag))) {
      problems.push(`No drawable incident carries required tag "${tag}".`);
    }
  }

  return problems;
}
