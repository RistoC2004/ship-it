import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEngine, createRng, MAX_SCORE } from "../../src/features/ship-it/engine";
import type { Choice, GameState, OutcomeId, RunResult } from "../../src/features/ship-it/engine";
import { SHIP_IT_CONTENT } from "../../src/features/ship-it/content";

/**
 * Design invariants, checked across many seeded runs. These encode what the
 * game is meant to teach, so a content change that breaks the lesson fails CI.
 */
const engine = createEngine(SHIP_IT_CONTENT);
const RUNS = 1000;
const seeds = Array.from({ length: RUNS }, (_, i) => (i * 2654435761) >>> 0);

type Strategy = (choices: readonly Choice[], state: GameState) => Choice;

function minBy(choices: readonly Choice[], key: (choice: Choice) => number): Choice {
  return choices.reduce((best, choice) => (key(choice) < key(best) ? choice : best));
}

function playOut(seed: number, pick: Strategy): { state: GameState; result: RunResult } {
  let state = engine.newGame(seed);
  for (let guard = 0; state.phase !== "complete"; guard++) {
    assert.ok(guard < 50, "run terminates");
    state =
      state.phase === "incident"
        ? engine.reduce(state, { type: "choose", choiceId: pick(engine.choices(state), state).id })
        : engine.reduce(state, { type: "advance" });
  }
  return { state, result: engine.result(state) };
}

const RANK: Readonly<Record<OutcomeId, number>> = { clean: 0, stable: 1, risky: 2, rollback: 3, incident: 4 };

const bestCall: Strategy = (choices) =>
  minBy(choices, (choice) => (choice.grade === "strong" ? choice.minutes : 1000 + choice.minutes));
const fastest: Strategy = (choices) => minBy(choices, (choice) => choice.minutes);
const slowest: Strategy = (choices) => minBy(choices, (choice) => -choice.minutes);

describe("game balance", () => {
  test("the game is winnable: strong calls ship clean, on time, on every seed", () => {
    for (const seed of seeds) {
      const { result } = playOut(seed, bestCall);
      assert.equal(result.outcome, "clean", `seed ${seed}`);
      assert.equal(result.overtime, 0);
      assert.ok(result.score >= 900, `seed ${seed} scored ${result.score}`);
    }
  });

  test("shortcuts never pay off: always taking the fastest option ends in rollback or worse", () => {
    for (const seed of seeds) {
      const { result } = playOut(seed, fastest);
      assert.ok(RANK[result.outcome] >= RANK.rollback, `seed ${seed} → ${result.outcome}`);
    }
  });

  test("over-engineering doesn't either: always taking the slowest option never ships clean", () => {
    let overran = 0;
    for (const seed of seeds) {
      const { result } = playOut(seed, slowest);
      assert.notEqual(result.outcome, "clean", `seed ${seed}`);
      if (result.overtime > 0) overran++;
    }
    assert.ok(overran / RUNS > 0.5, `the window only ran out in ${overran} of ${RUNS} slow runs`);
  });

  test("shortcuts come back: taking risky calls usually triggers a follow-up incident", () => {
    let faced = 0;
    for (const seed of seeds) {
      if (playOut(seed, fastest).result.followUpsFaced > 0) faced++;
    }
    assert.ok(faced / RUNS > 0.5, `follow-ups appeared in ${faced} of ${RUNS} shortcut runs`);
  });

  test("random play always produces a valid, complete run", () => {
    const risksById = SHIP_IT_CONTENT.risks;
    for (const seed of seeds) {
      const rng = createRng(seed ^ 0x5eed);
      const { state, result } = playOut(seed, (choices) => choices[Math.floor(rng() * choices.length)]);

      assert.equal(state.history.length, SHIP_IT_CONTENT.stages.length);
      assert.deepEqual(
        state.history.map((decision) => decision.stageIndex),
        SHIP_IT_CONTENT.stages.map((_, index) => index),
      );
      for (const value of Object.values(state.metrics)) {
        assert.ok(Number.isInteger(value) && value >= 0 && value <= 100, `seed ${seed} metric ${value}`);
      }
      assert.equal(new Set(state.risks).size, state.risks.length, "no duplicate risks");
      for (const risk of state.risks) assert.ok(risksById[risk], `known risk ${risk}`);
      assert.equal(state.minutesUsed, state.history.reduce((sum, decision) => sum + decision.minutes, 0));
      assert.ok(result.score >= 0 && result.score <= MAX_SCORE);
      assert.ok(Number.isInteger(result.score));
      assert.ok(result.outcome in RANK);
    }
  });
});
