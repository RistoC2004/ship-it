import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEngine, determineOutcome, MAX_SCORE, scoreRun } from "../../src/features/ship-it/engine";
import type { GameState, Metrics, RiskDefinition } from "../../src/features/ship-it/engine";
import { FIXTURE_CONTENT, FIXTURE_RULES } from "./fixtures";

const healthy: Metrics = { stability: 90, userImpact: 2, confidence: 90 };
const risk = (severity: RiskDefinition["severity"]): RiskDefinition => ({
  id: severity,
  title: `${severity} risk`,
  severity,
});

describe("release outcome", () => {
  test("a healthy, verified, on-time release with nothing shipped is clean", () => {
    assert.equal(determineOutcome(healthy, [], 0), "clean");
  });

  test("shipped risks override healthy metrics, most severe first", () => {
    assert.equal(determineOutcome(healthy, [risk("medium"), risk("critical")], 0), "incident");
    assert.equal(determineOutcome(healthy, [risk("high"), risk("medium")], 0), "rollback");
    assert.equal(determineOutcome(healthy, [risk("medium")], 0), "risky");
  });

  test("a shortcut that already reached users caps the release at risky", () => {
    assert.equal(determineOutcome(healthy, [], 0, 1), "risky");
  });

  test("metric thresholds decide the outcome when nothing risky shipped", () => {
    assert.equal(determineOutcome({ ...healthy, stability: 34 }, [], 0), "incident");
    assert.equal(determineOutcome({ ...healthy, userImpact: 60 }, [], 0), "incident");
    assert.equal(determineOutcome({ ...healthy, stability: 49 }, [], 0), "rollback");
    assert.equal(determineOutcome({ ...healthy, userImpact: 40 }, [], 0), "rollback");
    assert.equal(determineOutcome({ ...healthy, confidence: 49 }, [], 0), "risky");
    assert.equal(determineOutcome({ ...healthy, userImpact: 25 }, [], 0), "risky");
  });

  test("clean needs every bar met; falling just short is still a stable release", () => {
    assert.equal(determineOutcome({ ...healthy, stability: 79 }, [], 0), "stable");
    assert.equal(determineOutcome({ ...healthy, confidence: 74 }, [], 0), "stable");
    assert.equal(determineOutcome({ ...healthy, userImpact: 11 }, [], 0), "stable");
    assert.equal(determineOutcome(healthy, [], 1), "stable", "one minute over the window");
  });
});

describe("score", () => {
  test("perfect health scores the maximum; the worst health scores zero", () => {
    assert.equal(scoreRun(FIXTURE_RULES, { stability: 100, userImpact: 0, confidence: 100 }, [], 0).score, MAX_SCORE);
    assert.equal(scoreRun(FIXTURE_RULES, { stability: 0, userImpact: 100, confidence: 0 }, [], 0).score, 0);
  });

  test("shipped risks and overtime are subtracted and itemized", () => {
    const perfect: Metrics = { stability: 100, userImpact: 0, confidence: 100 };
    const { score, breakdown } = scoreRun(FIXTURE_RULES, perfect, [risk("medium"), risk("high")], 10);
    assert.deepEqual(breakdown, { health: 1000, riskPenalty: 180, overtimePenalty: 40 });
    assert.equal(score, 780);
  });

  test("the overtime penalty is capped and the score never goes negative", () => {
    const { breakdown } = scoreRun(FIXTURE_RULES, healthy, [], 500);
    assert.equal(breakdown.overtimePenalty, FIXTURE_RULES.scoring.overtimePenaltyCap);

    const floor = scoreRun(FIXTURE_RULES, { stability: 10, userImpact: 90, confidence: 10 }, [risk("critical")], 60);
    assert.equal(floor.score, 0);
  });

  test("health weights stability, confidence and user impact as configured", () => {
    const { breakdown } = scoreRun(FIXTURE_RULES, { stability: 50, userImpact: 50, confidence: 50 }, [], 0);
    assert.equal(breakdown.health, 500);
    const tilted = scoreRun(FIXTURE_RULES, { stability: 100, userImpact: 100, confidence: 0 }, [], 0);
    assert.equal(tilted.breakdown.health, 400, "stability carries 40% of the weight");
  });
});

describe("run result", () => {
  const engine = createEngine(FIXTURE_CONTENT);

  function finish(choiceIds: readonly string[]): GameState {
    let state = engine.newGame(1);
    for (const choiceId of choiceIds) {
      state = engine.reduce(engine.reduce(state, { type: "choose", choiceId }), { type: "advance" });
    }
    assert.equal(state.phase, "complete");
    return state;
  }

  test("counts grades and credits each practice once, in the order it was used", () => {
    const result = engine.result(finish(["good", "good", "good"]));
    assert.deepEqual(result.grades, { strong: 3, reasonable: 0, costly: 0, risky: 0 });
    assert.deepEqual(
      result.practices.map((practice) => practice.id),
      ["careful", "verify"],
    );
    assert.equal(result.followUpsFaced, 0);
    assert.equal(result.minutesLeft, 30);
    assert.equal(result.overtime, 0);
  });

  test("reports the follow-ups faced and the risks still open", () => {
    const result = engine.result(finish(["shortcut", "minor", "ignore"]));
    assert.equal(result.followUpsFaced, 1);
    assert.deepEqual(
      result.risks.map((open) => open.id),
      ["hole", "minor"],
    );
    assert.equal(result.outcome, "incident");
    assert.equal(result.breakdown.riskPenalty, 260);
  });
});
