/**
 * Personal-best rules, independent of the browser so they can be tested.
 * Storage may be missing or throw (private mode, blocked site data); every
 * failure degrades to "no best yet" rather than breaking the game.
 */

export const BEST_SCORE_KEY = "ship-it:best-score:v1";

export interface ScoreStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type SaveResult = "first" | "improved" | "unchanged" | "unavailable";

export function readBestScore(storage: ScoreStorage | null): number | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(BEST_SCORE_KEY);
    // Scores are written as plain digits; anything else (including "", which
    // Number() would read as 0) is treated as no best.
    if (raw === null || !/^\d{1,7}$/.test(raw)) return null;
    return Number(raw);
  } catch {
    return null;
  }
}

/**
 * Stores the score when it's the first one or beats the best. "first" is kept
 * separate from "improved" so the UI doesn't celebrate a best on a first run.
 */
export function saveBestScore(storage: ScoreStorage | null, score: number): SaveResult {
  if (!storage) return "unavailable";
  const previous = readBestScore(storage);
  if (previous !== null && score <= previous) return "unchanged";
  try {
    storage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    return "unavailable";
  }
  return previous === null ? "first" : "improved";
}
