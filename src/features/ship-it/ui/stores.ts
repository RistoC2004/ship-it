/**
 * Small external stores read through `useSyncExternalStore`, so browser-only
 * state (preferences, the URL, localStorage) never causes a hydration mismatch.
 */
import { useSyncExternalStore } from "react";
import { decodeSeed } from "../engine/rng";
import { readBestScore, saveBestScore, type ScoreStorage } from "./bestScore";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const noopSubscribe = () => () => {};

/** A run code shared through `?run=CODE`, if the URL carries a valid one. */
export function useSharedRunSeed(): number | null {
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => "",
  );
  const code = new URLSearchParams(search).get("run");
  return code ? decodeSeed(code) : null;
}

export function readSharedRunSeed(): number | null {
  const code = new URLSearchParams(window.location.search).get("run");
  return code ? decodeSeed(code) : null;
}

export function randomSeed(): number {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0];
}

// Personal best, per browser. The rules live in bestScore.ts; this is the
// localStorage binding plus a subscription so every reader stays in sync.
const bestListeners = new Set<() => void>();

function browserStorage(): ScoreStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStoredBest(): number | null {
  return readBestScore(browserStorage());
}

/** Saves the score if it's a best. Returns true only when an earlier best was beaten. */
export function recordBestScore(score: number): boolean {
  const result = saveBestScore(browserStorage(), score);
  if (result === "first" || result === "improved") bestListeners.forEach((listener) => listener());
  return result === "improved";
}

function subscribeBest(onChange: () => void) {
  bestListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    bestListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useBestScore(): number | null {
  return useSyncExternalStore(subscribeBest, readStoredBest, () => null);
}
