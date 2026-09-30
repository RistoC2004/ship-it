/**
 * Seeded randomness. Every random decision in a run (which incidents are
 * drawn, the order choices are shown in) derives from the run seed, so a
 * run can be replayed, shared as a code, and tested exhaustively.
 */

export type Rng = () => number;

/** Mulberry32: small and fast with good distribution. Gameplay only, never security. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a, used to derive independent streams from one seed. */
export function hashString(value: string, basis = 0x811c9dc5): number {
  let hash = basis >>> 0;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * A seed for one purpose within a run. Separate streams mean adding a new
 * incident's choice order never changes which incidents a seed draws.
 */
export function deriveSeed(seed: number, purpose: string): number {
  return hashString(purpose, (seed ^ 0x811c9dc5) >>> 0);
}

export function randomInt(rng: Rng, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive);
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    const swap = result[i];
    result[i] = result[j];
    result[j] = swap;
  }
  return result;
}

const MAX_SEED = 0xffffffff;
const SEED_CODE = /^[0-9A-Z]{1,7}$/;

/** Run code shown to players, e.g. "1K7Q2Z". */
export function encodeSeed(seed: number): string {
  return (seed >>> 0).toString(36).toUpperCase().padStart(6, "0");
}

export function decodeSeed(code: string): number | null {
  const normalized = code.trim().toUpperCase();
  if (!SEED_CODE.test(normalized)) return null;
  const value = parseInt(normalized, 36);
  return value <= MAX_SEED ? value : null;
}
