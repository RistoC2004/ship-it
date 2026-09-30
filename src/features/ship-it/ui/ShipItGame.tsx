"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { METRIC_KEYS } from "../engine/metrics";
import { encodeSeed } from "../engine/rng";
import type { Decision, GameState, RunResult } from "../engine/types";
import { ChoiceList } from "./ChoiceList";
import { ConsoleButton, ConsoleFrame } from "./ConsoleFrame";
import { METRIC_LABELS, OUTCOME_COPY } from "./copy";
import { DecisionPanel } from "./DecisionPanel";
import { shipIt } from "./engine";
import { CloseIcon, RestartIcon } from "./icons";
import { IncidentCard } from "./IncidentCard";
import { MetricsPanel } from "./MetricsPanel";
import { PipelineTrack } from "./PipelineTrack";
import { ReleaseLog } from "./ReleaseLog";
import { ReleaseReport } from "./ReleaseReport";
import { randomSeed, usePrefersReducedMotion, useBestScore } from "./stores";
import { useShipIt } from "./useShipIt";

interface ShipItGameProps {
  seed: number;
  onExit: () => void;
}

/** Lazily loaded: none of this ships until someone presses Start. */
export default function ShipItGame({ seed, onExit }: ShipItGameProps) {
  const { state, runKey, isNewBest, choose, advance, restart } = useShipIt(seed);
  const reducedMotion = usePrefersReducedMotion();
  const best = useBestScore();
  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { content } = shipIt;
  const incident = shipIt.currentIncident(state);
  const choices = shipIt.choices(state);
  const decision = state.phase === "feedback" ? shipIt.lastDecision(state) : undefined;
  const chosen = decision ? shipIt.choice(decision.incidentId, decision.choiceId) : undefined;
  const minutesLeft = shipIt.minutesLeft(state);
  const result = state.phase === "complete" ? shipIt.result(state) : null;
  const log = shipIt.releaseLog(state);
  const statuses = shipIt.stageStatuses(state);
  const stages = content.stages.map((stage, index) => ({ ...stage, status: statuses[index] }));
  const isLastStage = state.stageIndex === content.stages.length - 1;

  // Each step moves focus to its heading (so screen readers hear what changed).
  // New incidents and the report pin the console to the top of the viewport so
  // the choices sit above the fold; feedback only scrolls if it's out of view.
  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    if (state.phase === "feedback") reveal(heading.closest("section"), reducedMotion, "ensure");
    else reveal(rootRef.current, reducedMotion, "align");
  }, [state.phase, state.stageIndex, runKey, reducedMotion]);

  // Shortcuts only work while focus is inside the game, so they never
  // interfere with the rest of the page or with assistive technology.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // `repeat` guards against a held Enter selecting a choice and then
    // immediately skipping past its feedback.
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) return;

    if (state.phase === "incident" && /^[1-9]$/.test(event.key)) {
      const choice = choices[Number(event.key) - 1];
      if (choice) {
        event.preventDefault();
        choose(choice.id);
      }
    } else if (state.phase === "feedback" && event.key === "Enter" && !target.closest("a, button, summary")) {
      event.preventDefault();
      advance();
    }
  }

  const status =
    state.phase === "complete" && result
      ? { label: OUTCOME_COPY[result.outcome].label, tone: OUTCOME_COPY[result.outcome].tone }
      : shipIt.isFollowUp(state)
        ? { label: "Incident open", tone: "bad" as const, live: true }
        : { label: `Stage ${state.stageIndex + 1}/${content.stages.length}`, tone: "good" as const, live: true };

  return (
    <ConsoleFrame
      ref={rootRef}
      onKeyDown={handleKeyDown}
      status={status}
      meta={
        <span className="font-mono text-xs tabular-nums">
          <span className="sr-only">Clock </span>
          <span className={minutesLeft < 0 ? "text-[#f4978a]" : "text-white"}>{shipIt.clock(state.minutesUsed)}</span>
          <span aria-hidden="true" className="hidden text-white/50 sm:inline">
            {" "}
            / {shipIt.windowClose()}
          </span>
          <span className="sr-only">, window closes {shipIt.windowClose()}</span>
        </span>
      }
      actions={
        <>
          <span className="hidden font-mono text-[11px] text-white/50 lg:inline">run {encodeSeed(state.seed)}</span>
          <ConsoleButton label="Start a new run" onClick={() => restart(randomSeed())}>
            <RestartIcon />
          </ConsoleButton>
          <ConsoleButton label="Exit the game" onClick={onExit}>
            <CloseIcon />
          </ConsoleButton>
        </>
      }
    >
      <PipelineTrack stages={stages} />

      {result ? (
        <ReleaseReport
          key={runKey}
          state={state}
          result={result}
          best={best}
          isNewBest={isNewBest}
          reducedMotion={reducedMotion}
          headingRef={headingRef}
          onPlayAgain={() => restart(randomSeed())}
          onReplay={() => restart(state.seed)}
        />
      ) : (
        <div className="grid gap-5 border-t border-white/10 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_292px] lg:gap-8 lg:p-8">
          <div className="flex flex-col gap-4 lg:col-start-2 lg:row-start-1">
            <MetricsPanel
              metrics={state.metrics}
              delta={decision?.applied}
              minutesSpent={decision?.minutes}
              minutesLeft={minutesLeft}
              windowMinutes={content.rules.windowMinutes}
              closesAt={shipIt.windowClose()}
              pulseKey={state.history.length}
            />
            <div className="hidden rounded-2xl border border-white/10 bg-black/25 lg:block">
              <p
                aria-hidden="true"
                className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/55"
              >
                Release log
                <span className="tabular-nums">{log.length}</span>
              </p>
              <div className="px-4 py-3">
                <ReleaseLog entries={log} clock={shipIt.clock} compact />
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <IncidentCard
              key={`${runKey}-${state.stageIndex}`}
              incident={incident}
              stage={content.stages[state.stageIndex]}
              number={state.stageIndex + 1}
              total={content.stages.length}
              followUp={shipIt.isFollowUp(state)}
              headingRef={state.phase === "incident" ? headingRef : undefined}
            />
            {state.phase === "incident" ? (
              <ChoiceList choices={choices} minutesLeft={minutesLeft} onChoose={choose} />
            ) : decision && chosen ? (
              <DecisionPanel
                key={`${runKey}-${state.stageIndex}-decision`}
                incident={incident}
                choice={chosen}
                decision={decision}
                content={content}
                isLast={isLastStage}
                headingRef={headingRef}
                onContinue={advance}
              />
            ) : null}

            <details className="group mt-6 rounded-2xl border border-white/10 bg-black/25 lg:hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9fdcbf]">
                Release log · {log.length}
                <span aria-hidden="true" className="transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-white/10 px-4 py-3">
                <ReleaseLog entries={log} clock={shipIt.clock} />
              </div>
            </details>
          </div>
        </div>
      )}

      <p role="status" className="sr-only">
        {announcement(state, decision, minutesLeft, result)}
      </p>
    </ConsoleFrame>
  );
}

/** Screen-reader summary of what just changed; the focused heading covers the rest. */
function announcement(state: GameState, decision: Decision | undefined, minutesLeft: number, result: RunResult | null): string {
  if (result) return `${OUTCOME_COPY[result.outcome].label}. Score ${result.score} out of 1000.`;
  if (state.phase !== "feedback" || !decision) return "";
  const changes = METRIC_KEYS.filter((key) => decision.applied[key] !== 0).map(
    (key) => `${METRIC_LABELS[key]} ${decision.applied[key] > 0 ? "up" : "down"} ${Math.abs(decision.applied[key])}`,
  );
  const time = minutesLeft >= 0 ? `${minutesLeft} minutes left` : `${-minutesLeft} minutes past the window`;
  return [...changes, `${decision.minutes} minutes used, ${time}`].join(". ") + ".";
}

/**
 * "align" brings the element's top just under the sticky header; "ensure" only
 * scrolls when its top is off screen or low in the viewport. Both respect the
 * element's scroll-margin and the reduced-motion preference.
 */
function reveal(element: Element | null | undefined, reducedMotion: boolean, mode: "align" | "ensure") {
  if (!element) return;
  const { top } = element.getBoundingClientRect();
  const headerClearance = 72;
  const settled =
    mode === "align" ? top >= headerClearance - 8 && top <= headerClearance + 56 : top >= headerClearance && top <= window.innerHeight * 0.45;
  if (settled) return;
  // "auto" would inherit the page's CSS smooth scrolling, so reduced motion asks for "instant".
  element.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
}
