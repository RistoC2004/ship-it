/** Off-site links open in a new tab so an in-progress run isn't lost. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

export function linkProps(href: string): { target?: "_blank"; rel?: "noreferrer" } {
  return isExternal(href) ? { target: "_blank", rel: "noreferrer" } : {};
}

/** In-page targets (the project cards) sit above the game. */
export function linkArrow(href: string): string {
  return isExternal(href) ? "↗" : "↑";
}
