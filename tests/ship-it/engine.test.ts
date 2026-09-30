import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEngine } from "../../src/features/ship-it/engine";
import type { GameState } from "../../src/features/ship-it/engine";
import { FIXTURE_CONTENT } from "./fixtures";

const engine = createEngine(FIXTURE_CONTENT);
const SEED = 42;

function play(state: GameState, choiceIds: readonly string[]): GameState {
  let next = state;
  for (const choiceId of choiceIds) {
    next = engine.reduce(next, { type: "choose", choiceId });
    next = engine.reduce(next, { type: "advance" });
  }
  return next;
}

describe("new game", () => {
  test("starts on the first stage with the configured metrics and an empty history", () => {
    const state = engine.newGame(SEED);
    assert.equal(state.phase, "incident");
    assert.equal(state.stageIndex, 0);
    assert.equal(state.incidentId, "build");
    assert.deepEqual(state.metrics, FIXTURE_CONTENT.rules.initialMetrics);
    assert.equal(state.minutesUsed, 0);
    assert.deepEqual(state.risks, []);
    assert.deepEqual(state.history, []);
    assert.deepEqual(state.plan, ["build", "review", "stage"]);
    assert.deepEqual(state.followUps, [null, null, null]);
  });

  test("is fully determined by the seed", () => {
    assert.deepEqual(engine.newGame(SEED), engine.newGame(SEED));
  });

  test("normalizes the seed to an unsigned 32-bit integer", () => {
    assert.equal(engine.newGame(-1).seed, 0xffffffff);
    assert.equal(engine.newGame(2 ** 32 + 5).seed, 5);
  });

  test("does not share metric objects with the content rules", () => {
    const state = engine.newGame(SEED);
    assert.notEqual(state.metrics, FIXTURE_CONTENT.rules.initialMetrics);
  });
});

describe("choosing", () => {
  test("applies effects and time, records the decision, and moves to feedback", () => {
    const state = engine.reduce(engine.newGame(SEED), { type: "choose", choiceId: "good" });
    assert.equal(state.phase, "feedback");
    assert.deepEqual(state.metrics, { stability: 60, userImpact: 10, confidence: 60 });
    assert.equal(state.minutesUsed, 10);
    assert.equal(state.history.length, 1);
    assert.deepEqual(state.history[0], {
      stageIndex: 0,
      incidentId: "build",
      choiceId: "good",
      grade: "strong",
      minutes: 10,
      applied: { stability: 10, userImpact: 0, confidence: 10 },
      risksAdded: [],
      risksResolved: [],
      at: 10,
    });
  });

  test("clamps metrics to 0–100 and records the change that was actually applied", () => {
    const state = engine.reduce(engine.newGame(SEED), { type: "choose", choiceId: "boost" });
    assert.deepEqual(state.metrics, { stability: 90, userImpact: 0, confidence: 90 });
    assert.deepEqual(state.history[0].applied, { stability: 40, userImpact: -10, confidence: 40 });

    const nearMax = createEngine({
      ...FIXTURE_CONTENT,
      rules: { ...FIXTURE_CONTENT.rules, initialMetrics: { stability: 95, userImpact: 90, confidence: 70 } },
    });
    const capped = nearMax.reduce(nearMax.newGame(SEED), { type: "choose", choiceId: "boost" });
    assert.deepEqual(capped.metrics, { stability: 100, userImpact: 50, confidence: 100 });
    assert.deepEqual(capped.history[0].applied, { stability: 5, userImpact: -40, confidence: 30 });
  });

  test("ignores actions that don't apply, returning the same state object", () => {
    const start = engine.newGame(SEED);
    assert.equal(engine.reduce(start, { type: "choose", choiceId: "not-a-choice" }), start);
    assert.equal(engine.reduce(start, { type: "choose", choiceId: "patch-hole" }), start, "choice from another incident");
    assert.equal(engine.reduce(start, { type: "advance" }), start, "advance before choosing");

    const feedback = engine.reduce(start, { type: "choose", choiceId: "good" });
    assert.equal(engine.reduce(feedback, { type: "choose", choiceId: "shortcut" }), feedback, "double choose");
  });

  test("never mutates the previous state", () => {
    const start = engine.newGame(SEED);
    const snapshot = structuredClone(start);
    engine.reduce(start, { type: "choose", choiceId: "shortcut" });
    assert.deepEqual(start, snapshot);
  });
});

describe("progression", () => {
  test("advances through every stage in order, then completes", () => {
    let state = engine.newGame(SEED);
    const seen: string[] = [];
    while (state.phase !== "complete") {
      seen.push(state.incidentId);
      state = engine.reduce(state, { type: "choose", choiceId: "good" });
      state = engine.reduce(state, { type: "advance" });
    }
    assert.deepEqual(seen, ["build", "review", "stage"]);
    assert.equal(state.history.length, 3);
    assert.equal(state.stageIndex, 2, "stays on the last stage when complete");
  });

  test("a completed run ignores further choices and advances", () => {
    const done = play(engine.newGame(SEED), ["good", "good", "good"]);
    assert.equal(done.phase, "complete");
    assert.equal(engine.reduce(done, { type: "advance" }), done);
    assert.equal(engine.reduce(done, { type: "choose", choiceId: "good" }), done);
  });

  test("time can run past the window and is reported as negative minutes left", () => {
    const done = play(engine.newGame(SEED), ["boost", "good", "slow"]);
    assert.equal(done.minutesUsed, 85);
    assert.equal(engine.minutesLeft(done), -25);
    assert.equal(engine.result(done).overtime, 25);
  });

  test("restart builds a fresh game for the new seed", () => {
    const midRun = play(engine.newGame(SEED), ["shortcut"]);
    const restarted = engine.reduce(midRun, { type: "restart", seed: 7 });
    assert.deepEqual(restarted, engine.newGame(7));
  });
});

describe("risks and follow-ups", () => {
  test("a risky choice adds a risk and schedules its follow-up two stages later", () => {
    const state = engine.reduce(engine.newGame(SEED), { type: "choose", choiceId: "shortcut" });
    assert.deepEqual(state.risks, ["hole"]);
    assert.deepEqual(state.history[0].risksAdded, ["hole"]);
    assert.deepEqual(state.followUps, [null, null, { incidentId: "consequence", riskId: "hole" }]);
  });

  test("the follow-up replaces the planned incident and can resolve the risk", () => {
    let state = play(engine.newGame(SEED), ["shortcut", "good"]);
    assert.equal(state.incidentId, "consequence");
    assert.equal(engine.isFollowUp(state), true);

    state = engine.reduce(state, { type: "choose", choiceId: "fix" });
    assert.deepEqual(state.risks, []);
    assert.deepEqual(state.history[2].risksResolved, ["hole"]);
  });

  test("a follow-up is cancelled if its risk is resolved before its stage", () => {
    const state = play(engine.newGame(SEED), ["shortcut", "patch-hole"]);
    assert.deepEqual(state.risks, []);
    assert.equal(state.incidentId, "stage", "planned incident is back");
    assert.equal(engine.isFollowUp(state), false);
  });

  test("an unresolved follow-up leaves the risk open at the end of the run", () => {
    const done = play(engine.newGame(SEED), ["shortcut", "good", "ignore"]);
    assert.deepEqual(done.risks, ["hole"]);
    assert.equal(engine.result(done).outcome, "incident");
  });

  test("the same risk added twice is only tracked once", () => {
    const done = play(engine.newGame(SEED), ["good", "minor", "minor"]);
    assert.deepEqual(done.risks, ["minor"]);
    assert.deepEqual(done.history[2].risksAdded, [], "second time adds nothing new");
  });

  test("a risk added on the last stage ships without scheduling a follow-up", () => {
    const content = {
      ...FIXTURE_CONTENT,
      risks: { ...FIXTURE_CONTENT.risks, minor: { ...FIXTURE_CONTENT.risks.minor, followUp: "consequence" } },
    };
    const lastStageEngine = createEngine(content);
    let state = lastStageEngine.newGame(SEED);
    for (const choiceId of ["good", "good", "minor"]) {
      state = lastStageEngine.reduce(state, { type: "choose", choiceId });
      if (state.stageIndex < 2) state = lastStageEngine.reduce(state, { type: "advance" });
    }
    assert.deepEqual(state.followUps, [null, null, null]);
    assert.deepEqual(state.risks, ["minor"]);
  });
});

describe("choice order", () => {
  test("is a seeded permutation of the incident's choices", () => {
    const incident = engine.incident("build");
    const ids = incident.choices.map((choice) => choice.id).sort();
    const orders = new Set<string>();
    for (let seed = 0; seed < 50; seed++) {
      const state = engine.newGame(seed);
      const order = engine.choices(state).map((choice) => choice.id);
      assert.deepEqual([...order].sort(), ids);
      assert.deepEqual(engine.choices(engine.newGame(seed)).map((choice) => choice.id), order, "stable per seed");
      orders.add(order.join());
    }
    assert.ok(orders.size > 1, "different seeds show different orders");
  });
});

describe("derived views", () => {
  test("stage statuses follow the run", () => {
    let state = engine.newGame(SEED);
    assert.deepEqual(engine.stageStatuses(state), ["active", "pending", "pending"]);

    state = engine.reduce(state, { type: "choose", choiceId: "shortcut" });
    assert.deepEqual(engine.stageStatuses(state), ["warned", "pending", "pending"]);

    state = play(engine.reduce(state, { type: "advance" }), ["good"]);
    assert.deepEqual(engine.stageStatuses(state), ["warned", "passed", "alert"]);
  });

  test("the release log mirrors decisions, risks and resolutions in time order", () => {
    const state = engine.reduce(play(engine.newGame(SEED), ["shortcut", "good"]), {
      type: "choose",
      choiceId: "fix",
    });
    const log = engine.releaseLog(state);
    const texts = log.map((entry) => entry.text);

    assert.equal(texts[0], "release/v2.4.0 · pipeline started");
    assert.ok(texts.includes("build opened"));
    assert.ok(texts.includes("Take the shortcut"), "falls back to the label without a log line");
    assert.ok(texts.includes("Known risk: A critical hole"));
    assert.ok(texts.includes("consequence opened"));
    assert.ok(texts.includes("Resolved: A critical hole"));
    assert.equal(new Set(log.map((entry) => entry.id)).size, log.length, "unique ids");
    for (let i = 1; i < log.length; i++) {
      assert.ok(log[i].minute >= log[i - 1].minute, "never goes back in time");
    }
  });

  test("the clock formats simulated time and wraps past midnight", () => {
    assert.equal(engine.clock(0), "09:00");
    assert.equal(engine.clock(75), "10:15");
    assert.equal(engine.windowClose(), "10:00");
    const late = createEngine({ ...FIXTURE_CONTENT, rules: { ...FIXTURE_CONTENT.rules, clockStart: 23 * 60 + 50 } });
    assert.equal(late.clock(20), "00:10");
    assert.equal(late.clock(-20), "23:30");
  });
});

describe("clock module", () => {
  test("is usable on its own, without building an engine", async () => {
    const { formatClock, windowClose } = await import("../../src/features/ship-it/engine/clock");
    const rules = { clockStart: 16 * 60 + 20, windowMinutes: 100 };
    assert.equal(formatClock(rules, 0), "16:20");
    assert.equal(windowClose(rules), "18:00");
  });
});
