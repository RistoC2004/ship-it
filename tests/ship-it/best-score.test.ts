import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { BEST_SCORE_KEY, readBestScore, saveBestScore } from "../../src/features/ship-it/ui/bestScore";
import type { ScoreStorage } from "../../src/features/ship-it/ui/bestScore";

function memoryStorage(initial: Record<string, string> = {}): ScoreStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const blocked: ScoreStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("personal best", () => {
  test("a first run is saved but isn't celebrated as beating anything", () => {
    const storage = memoryStorage();
    assert.equal(saveBestScore(storage, 433), "first");
    assert.equal(readBestScore(storage), 433);
  });

  test("only a strictly higher score replaces the best", () => {
    const storage = memoryStorage({ [BEST_SCORE_KEY]: "600" });
    assert.equal(saveBestScore(storage, 600), "unchanged");
    assert.equal(saveBestScore(storage, 420), "unchanged");
    assert.equal(readBestScore(storage), 600);
    assert.equal(saveBestScore(storage, 812), "improved");
    assert.equal(readBestScore(storage), 812);
  });

  test("corrupt stored values are ignored and then overwritten", () => {
    for (const junk of ["", "NaN", "-5", "12.5", "{}", "9e999"]) {
      const storage = memoryStorage({ [BEST_SCORE_KEY]: junk });
      assert.equal(readBestScore(storage), null, `"${junk}"`);
      assert.equal(saveBestScore(storage, 300), "first");
      assert.equal(storage.data[BEST_SCORE_KEY], "300");
    }
  });

  test("missing or blocked storage degrades to 'no best' without throwing", () => {
    assert.equal(readBestScore(null), null);
    assert.equal(saveBestScore(null, 900), "unavailable");
    assert.equal(readBestScore(blocked), null);
    assert.equal(saveBestScore(blocked, 900), "unavailable");
  });
});
