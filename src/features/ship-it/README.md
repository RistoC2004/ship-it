# SHIP IT

A 90-second release-engineering game. It also runs on the portfolio at [madebycaissie.com/risto](https://madebycaissie.com/risto#ship-it). The player gets release v2.4.0 through five pipeline stages (Build & CI → Code review → Staging → Canary → Production), making one call per incident against a 100-minute release window.

## Layout

```
engine/     Pure TypeScript game logic. No React, no DOM, no content.
  types.ts      Domain model (Incident, Choice, GameState, RunResult, …)
  rng.ts        Seeded PRNG (mulberry32), FNV-1a stream derivation, run codes
  plan.ts       Draws one incident per stage for a seed; seeded choice order
  game.ts       The reducer: choose / advance / restart, follow-up scheduling
  outcome.ts    Scoring and the release outcome rules
  selectors.ts  Derived views: release log, pipeline statuses, clock
  validate.ts   Structural checks for an incident library
  index.ts      createEngine(content), the only API the UI uses
content/    The incident library: data, not code
  incidents/    One file per stage, plus follow-ups (consequences)
  risks.ts      Latent problems a choice can leave behind
  practices.ts  Engineering practices credited on the report
  rules.ts      Window length, starting metrics, scoring weights
ui/         React components for the game (lazy-loaded chunk)
ShipItLauncher.tsx  Small client island: preview, Start, lazy load, error boundary
ShipItSection.tsx   Server-rendered section placed on /risto
```

## How a run works

- **Seeded:** `createEngine(content).newGame(seed)` is fully deterministic. The seed decides which incidents are drawn and the order their choices appear. Seeds are shared as base-36 run codes (`/risto?run=1K7Q2Z#ship-it`).
- **Constraints:** a run never repeats a `concept` (two idempotency incidents, say) and always includes an incident tagged `ai`. Rejection sampling keeps every valid plan equally likely, with a depth-first search as a guaranteed fallback.
- **Consequences:** some shortcuts add a risk. A risk with a `followUp` replaces the incident two stages later, if it's still open by then. Any risk still open at the end ships and caps the outcome.
- **Outcome:** a shipped critical risk is a production incident however healthy the meters look. A follow-up that reached users caps the release at "Risky deployment". A clean ship needs strong metrics, no open risks, and no overtime.

## Adding an incident

1. Append it to the matching file in `content/incidents/`. `defineIncidents` narrows risk and practice ids at compile time.
2. Give it 3–4 choices, at least one graded `strong`, and a faster non-strong option so the shortcut is tempting.
3. Run `npm test`. The suite validates references and copy length budgets, checks that related-work links point at real project cards, and re-runs the balance invariants across 1,000 seeds. Best play must ship clean, shortcuts must never pay off, and doing the slowest thing everywhere must never ship clean.

## Tests

`npm test` runs `node:test` directly on the TypeScript sources through Node's built-in type stripping; `tests/register.mjs` resolves the `@/` alias and extensionless imports. It needs Node 22.18+ and no extra dependencies. `tests/tsconfig.json` turns on `verbatimModuleSyntax` and `erasableSyntaxOnly`, so `npm run typecheck` catches anything Node couldn't strip.
