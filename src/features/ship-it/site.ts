/**
 * Where the game links out to. Links are the one thing that differs between
 * the portfolio copy (in-page anchors) and this standalone repo (absolute
 * URLs to the live portfolio), so they all live here.
 */
export const PORTFOLIO_URL = "https://madebycaissie.com/risto";
export const SOURCE_URL = "https://github.com/RistoC2004/ship-it";
export const GITHUB_PROFILE_URL = "https://github.com/RistoC2004";
export const PROJECTS_URL = `${PORTFOLIO_URL}#work`;

/** Project cards on the portfolio. Every "In my work" link must target one. */
export const PORTFOLIO_PROJECTS = [
  "moneyback",
  "mealsaver",
  "querylift",
  "swipeaway",
  "one-day",
  "domino",
  "petfolio",
] as const;

export function projectUrl(anchor: string): string {
  return `${PORTFOLIO_URL}#${anchor}`;
}
