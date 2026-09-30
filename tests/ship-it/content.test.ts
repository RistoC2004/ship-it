import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEngine, validateContent } from "../../src/features/ship-it/engine";
import type { GameContent, Incident } from "../../src/features/ship-it/engine";
import { SHIP_IT_CONTENT } from "../../src/features/ship-it/content";
import { PORTFOLIO_PROJECTS } from "../../src/features/ship-it/site";
import { FIXTURE_CONTENT } from "./fixtures";

const engine = createEngine(SHIP_IT_CONTENT);
const drawable = SHIP_IT_CONTENT.incidents.filter((incident) => incident.stage !== "follow-up");

describe("incident library", () => {
  test("passes structural validation", () => {
    assert.deepEqual(validateContent(SHIP_IT_CONTENT), []);
  });

  test("offers several incidents per stage so runs vary", () => {
    for (const stage of SHIP_IT_CONTENT.stages) {
      const pool = drawable.filter((incident) => incident.stage === stage.id);
      assert.ok(pool.length >= 3, `${stage.id} has ${pool.length} incidents`);
    }
  });

  test("keeps the shortcut tempting: every drawable incident has a faster option than its best call", () => {
    for (const incident of drawable) {
      const fastestStrong = Math.min(
        ...incident.choices.filter((choice) => choice.grade === "strong").map((choice) => choice.minutes),
      );
      assert.ok(
        incident.choices.some((choice) => choice.grade !== "strong" && choice.minutes < fastestStrong),
        `${incident.id} has no faster shortcut`,
      );
    }
  });

  test("stays within the UI's copy budget", () => {
    for (const incident of SHIP_IT_CONTENT.incidents) {
      assert.ok(incident.title.length <= 48, `${incident.id} title`);
      assert.ok(incident.summary.length <= 170, `${incident.id} summary`);
      assert.ok(incident.log.length <= 52, `${incident.id} log`);
      for (const line of incident.evidence?.lines ?? []) {
        assert.ok(line.length <= 48, `${incident.id} evidence line fits a phone: "${line}"`);
      }
      for (const choice of incident.choices) {
        assert.ok(choice.label.length <= 64, `${incident.id}/${choice.id} label`);
        assert.ok(choice.feedback.length <= 220, `${incident.id}/${choice.id} feedback`);
        assert.ok((choice.log ?? "").length <= 52, `${incident.id}/${choice.id} log`);
      }
    }
  });

  test("links related work only to project cards on the portfolio", () => {
    const anchors = new Set<string>(PORTFOLIO_PROJECTS);
    for (const incident of SHIP_IT_CONTENT.incidents) {
      if (!incident.related) continue;
      const { anchor, project } = incident.related;
      assert.ok(anchors.has(anchor), `${incident.id} links to unknown project "${anchor}"`);
      assert.equal(anchor, project.toLowerCase().replace(/\s+/g, "-"), `${incident.id} anchor matches its project`);
    }
  });
});

describe("content validation catches broken libraries", () => {
  const withIncident = (change: (incident: Incident) => Incident): GameContent => ({
    ...FIXTURE_CONTENT,
    incidents: FIXTURE_CONTENT.incidents.map((incident) => (incident.id === "build" ? change(incident) : incident)),
  });

  test("the fixture library is itself valid", () => {
    assert.deepEqual(validateContent(FIXTURE_CONTENT), []);
  });

  test("unknown risk and practice references", () => {
    const problems = validateContent(
      withIncident((incident) => ({
        ...incident,
        choices: incident.choices.map((choice) =>
          choice.id === "shortcut" ? { ...choice, addsRisk: "typo", practice: "nope" } : choice,
        ),
      })),
    );
    assert.ok(problems.some((problem) => problem.includes('unknown risk "typo"')));
    assert.ok(problems.some((problem) => problem.includes('unknown practice "nope"')));
  });

  test("an incident with no strong choice, too few choices, or duplicate ids", () => {
    const problems = validateContent(
      withIncident((incident) => ({
        ...incident,
        choices: [incident.choices[1], incident.choices[1]],
      })),
    );
    assert.ok(problems.some((problem) => problem.includes("no strong choice")));
    assert.ok(problems.some((problem) => problem.includes("needs 3–4 choices")));
    assert.ok(problems.some((problem) => problem.includes("defined twice")));
  });

  test("a strong choice that leaves a risk behind", () => {
    const problems = validateContent(
      withIncident((incident) => ({
        ...incident,
        choices: incident.choices.map((choice) => (choice.id === "good" ? { ...choice, addsRisk: "minor" } : choice)),
      })),
    );
    assert.ok(problems.some((problem) => problem.includes("graded strong but leaves a risk")));
  });

  test("an orphaned follow-up and a follow-up that can't resolve its risk", () => {
    const orphaned = validateContent({
      ...FIXTURE_CONTENT,
      risks: { ...FIXTURE_CONTENT.risks, hole: { ...FIXTURE_CONTENT.risks.hole, followUp: undefined } },
    });
    assert.ok(orphaned.some((problem) => problem.includes("no risk triggers")));

    const unresolvable = validateContent({
      ...FIXTURE_CONTENT,
      risks: { ...FIXTURE_CONTENT.risks, minor: { ...FIXTURE_CONTENT.risks.minor, followUp: "consequence" } },
    });
    assert.ok(unresolvable.some((problem) => problem.includes('no way to resolve risk "minor"')));
  });

  test("a required tag no drawable incident carries", () => {
    const problems = validateContent({
      ...FIXTURE_CONTENT,
      rules: { ...FIXTURE_CONTENT.rules, requiredTags: ["ai", "mobile"] },
    });
    assert.ok(problems.some((problem) => problem.includes('required tag "mobile"')));
  });
});

describe("run plans", () => {
  const SEEDS = 5000;

  test("draw one incident per stage, never repeat a concept, and always include AI", () => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const { plan } = engine.newGame(seed);
      const incidents = plan.map((id) => engine.incident(id));
      assert.deepEqual(
        incidents.map((incident) => incident.stage),
        SHIP_IT_CONTENT.stages.map((stage) => stage.id),
      );
      assert.equal(new Set(incidents.map((incident) => incident.concept)).size, plan.length, `seed ${seed}`);
      assert.ok(
        incidents.some((incident) => incident.tags.includes("ai")),
        `seed ${seed} has an AI incident`,
      );
    }
  });

  test("every drawable incident is reachable and none dominates", () => {
    const counts = new Map<string, number>();
    for (let seed = 0; seed < SEEDS; seed++) {
      for (const id of engine.newGame(seed).plan) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const incident of drawable) {
      const share = (counts.get(incident.id) ?? 0) / SEEDS;
      assert.ok(share > 0.1 && share < 0.7, `${incident.id} drawn in ${(share * 100).toFixed(1)}% of runs`);
    }
  });

  test("plans are deterministic for a seed", () => {
    for (const seed of [0, 1, 99, 123456, 0xffffffff]) {
      assert.deepEqual(engine.newGame(seed).plan, engine.newGame(seed).plan);
    }
  });
});
