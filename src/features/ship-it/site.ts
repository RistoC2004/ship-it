/**
 * Where the game links out to. On the portfolio page these are in-page
 * anchors; in this standalone copy they open the live portfolio.
 */
export const PORTFOLIO_URL = "https://madebycaissie.com/risto";
export const SOURCE_URL = "https://github.com/RistoC2004/ship-it";
export const GITHUB_PROFILE_URL = "https://github.com/RistoC2004";

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
