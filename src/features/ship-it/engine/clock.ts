import type { GameRules } from "./types";

// Dependency-free so the launcher can show the release window without pulling
// the rest of the engine into the initial bundle.

/** "16:47" for a number of minutes into the release window. */
export function formatClock(rules: Pick<GameRules, "clockStart">, minutesIntoRun: number): string {
  const total = (((rules.clockStart + minutesIntoRun) % 1440) + 1440) % 1440;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function windowClose(rules: Pick<GameRules, "clockStart" | "windowMinutes">): string {
  return formatClock(rules, rules.windowMinutes);
}
