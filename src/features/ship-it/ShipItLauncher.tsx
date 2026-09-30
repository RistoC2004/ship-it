"use client";

import { Component, lazy, Suspense, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { RULES } from "./content/rules";
import { STAGES } from "./content/stages";
import { formatClock, windowClose } from "./engine/clock";
import { encodeSeed } from "./engine/rng";
import { ConsoleFrame } from "./ui/ConsoleFrame";
import { PlayIcon } from "./ui/icons";
import { PipelineTrack } from "./ui/PipelineTrack";
import { randomSeed, readSharedRunSeed, useSharedRunSeed } from "./ui/stores";

// The engine, incident library and game UI load only after someone presses
// Start, so they add nothing to the portfolio's initial JavaScript.
const loadGame = () => import("./ui/ShipItGame");

/** Warms the chunk on hover/focus. Failures are ignored here; Start reports them. */
function prefetchGame() {
  loadGame().catch(() => {});
}

type GameComponent = ComponentType<{ seed: number; onExit: () => void }>;

const IDLE_STAGES = STAGES.map((stage) => ({ ...stage, status: "pending" as const }));
const OPENS_AT = formatClock(RULES, 0);
const CLOSES_AT = windowClose(RULES);

const TEASERS = [
  "AI-generated diffs",
  "401s only in staging",
  "Duplicate writes",
  "Leaked secrets",
  "Race conditions",
  "Failing canaries",
];

export function ShipItLauncher() {
  // Each attempt gets its own lazy loader, so "Try again" after a failed chunk
  // load really fetches again instead of replaying the cached failure.
  const [session, setSession] = useState<{ seed: number; attempt: number; Game: GameComponent } | null>(null);
  const sharedSeed = useSharedRunSeed();
  const startRef = useRef<HTMLButtonElement>(null);

  function start() {
    setSession({ seed: readSharedRunSeed() ?? randomSeed(), attempt: Date.now(), Game: lazy(loadGame) });
  }

  function exit() {
    flushSync(() => setSession(null));
    startRef.current?.focus();
  }

  if (session) {
    const { Game } = session;
    return (
      <GameErrorBoundary key={session.attempt} onRetry={start} onExit={exit}>
        <Suspense fallback={<BootingConsole />}>
          <Game seed={session.seed} onExit={exit} />
        </Suspense>
      </GameErrorBoundary>
    );
  }

  return (
    <ConsoleFrame status={{ label: "Standby", tone: "info" }} meta={
        <span className="font-mono text-xs text-white/55">
          {OPENS_AT} → {CLOSES_AT}
        </span>
      }>
      <PipelineTrack stages={IDLE_STAGES} />
      <div className="relative flex min-h-[400px] items-center border-t border-white/10 px-5 py-12 sm:min-h-[460px] sm:px-10 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9fdcbf]">Release v2.4.0 · window closes {CLOSES_AT}</p>
          <h3 className="heading mt-4 text-[30px] font-extrabold leading-[1.05] tracking-[-0.045em] text-white sm:text-5xl">
            Five things will go wrong before the window closes.
          </h3>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-7 text-white/70 sm:text-base">
            You&apos;re the engineer on point. Every action costs time, not every shortcut shows up right away, and the
            pipeline keeps moving.
          </p>
          <ul className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2" aria-label="Kinds of incidents">
            {TEASERS.map((teaser) => (
              <li key={teaser} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-white/65">
                {teaser}
              </li>
            ))}
          </ul>
          <button
            ref={startRef}
            type="button"
            onClick={start}
            onPointerEnter={prefetchGame}
            onFocus={prefetchGame}
            onTouchStart={prefetchGame}
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#9fdcbf] px-8 py-4 text-sm font-bold text-[#0b1110] shadow-[0_12px_40px_-12px_rgba(159,220,191,0.6)] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
          >
            <PlayIcon />
            {sharedSeed !== null ? `Play shared run ${encodeSeed(sharedSeed)}` : "Start the release"}
          </button>
          <p className="mt-4 font-mono text-[11px] text-white/55">
            About 90 seconds · 5 incidents · no sign-up
            <span className="hidden pointer-fine:inline"> · keys 1–4 to choose</span>
          </p>
          <noscript>
            <p className="mt-4 text-sm text-white/70">SHIP IT needs JavaScript. The rest of the portfolio works without it.</p>
          </noscript>
        </div>
      </div>
    </ConsoleFrame>
  );
}

function BootingConsole() {
  return (
    <ConsoleFrame status={{ label: "Booting", tone: "good", live: true }}>
      <PipelineTrack stages={IDLE_STAGES} />
      <div className="flex min-h-[400px] items-center justify-center border-t border-white/10 sm:min-h-[460px]">
        <p role="status" className="font-mono text-xs text-white/60">
          Starting release pipeline…
        </p>
      </div>
    </ConsoleFrame>
  );
}

interface BoundaryProps {
  children: ReactNode;
  onRetry: () => void;
  onExit: () => void;
}

/**
 * Contains any failure in the game, including a chunk that fails to load on a
 * bad connection, so the rest of the portfolio keeps working.
 */
class GameErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("SHIP IT stopped unexpectedly", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ConsoleFrame status={{ label: "Pipeline halted", tone: "bad" }}>
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-5 border-t border-white/10 px-6 py-12 text-center">
          <p className="heading text-2xl font-extrabold tracking-[-0.03em] text-white">The game hit an unexpected error.</p>
          <p className="max-w-md text-sm leading-6 text-white/70">
            Fittingly, it failed safe: nothing else on the page is affected.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.props.onRetry}
              className="rounded-full bg-[#9fdcbf] px-6 py-3 text-sm font-bold text-[#0b1110] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.props.onExit}
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
            >
              Back to the portfolio
            </button>
          </div>
        </div>
      </ConsoleFrame>
    );
  }
}
