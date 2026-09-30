import { useEffect, useRef, useState, type Ref } from "react";
import { encodeSeed } from "../engine/rng";
import { MAX_SCORE } from "../engine/outcome";
import { metricBand, type Band, userImpactLabel } from "../engine/metrics";
import type { GameState, RiskSeverity, RunResult } from "../engine/types";
import { GRADE_COPY, OUTCOME_COPY, type Tone } from "./copy";
import { shipIt } from "./engine";
import { AlertIcon, CheckIcon, LinkIcon, PlayIcon, RestartIcon } from "./icons";
import styles from "./ship-it.module.css";
import { GITHUB_PROFILE_URL, PORTFOLIO_URL } from "../site";
import { cx, TONE_FILL, TONE_SURFACE, TONE_TEXT } from "./tones";
import { useCountUp } from "./useCountUp";

interface ReleaseReportProps {
  state: GameState;
  result: RunResult;
  best: number | null;
  isNewBest: boolean;
  reducedMotion: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  onPlayAgain: () => void;
  onReplay: () => void;
}

const SEVERITY_TONE: Readonly<Record<RiskSeverity, Tone>> = { medium: "warn", high: "bad", critical: "bad" };
const BAND_TONE: Readonly<Record<Band, Tone>> = { good: "good", watch: "warn", poor: "bad" };

export function ReleaseReport({ state, result, best, isNewBest, reducedMotion, headingRef, onPlayAgain, onReplay }: ReleaseReportProps) {
  const copy = OUTCOME_COPY[result.outcome];
  const score = useCountUp(result.score, !reducedMotion);
  const runCode = encodeSeed(state.seed);
  const { breakdown } = result;

  const { metrics } = result;
  const stats: { label: string; value: string; tone: Tone }[] = [
    { label: "Stability", value: String(metrics.stability), tone: BAND_TONE[metricBand("stability", metrics.stability)] },
    {
      label: "User impact",
      value: userImpactLabel(metrics.userImpact),
      tone: BAND_TONE[metricBand("userImpact", metrics.userImpact)],
    },
    { label: "Confidence", value: String(metrics.confidence), tone: BAND_TONE[metricBand("confidence", metrics.confidence)] },
    {
      label: "Window",
      value: result.overtime > 0 ? `${result.overtime} min over` : `${result.minutesLeft} min spare`,
      tone: result.overtime > 0 ? "bad" : "good",
    },
  ];

  return (
    <section aria-labelledby="ship-it-report-title" className={cx("border-t border-white/10 p-4 sm:p-6 lg:p-10", styles.enter)}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">
            Release report · v2.4.0 · run {runCode}
          </p>
          <div
            className={cx(
              "mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em]",
              TONE_SURFACE[copy.tone],
              TONE_TEXT[copy.tone],
              styles.stamp,
            )}
          >
            <span aria-hidden="true" className={cx("h-2 w-2 rounded-full", TONE_FILL[copy.tone], styles.glow)} />
            {copy.label}
          </div>
          <h3
            ref={headingRef}
            id="ship-it-report-title"
            tabIndex={-1}
            className="heading mt-4 scroll-mt-24 text-4xl font-extrabold tracking-[-0.05em] text-white outline-none sm:text-5xl"
          >
            {copy.headline}
          </h3>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/70">
            {copy.body}
            {result.overtime > 0 ? ` It also shipped ${result.overtime} minutes past the release window.` : null}
          </p>

          <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Score</p>
              <p className="heading mt-1 text-6xl font-extrabold tabular-nums tracking-[-0.05em] text-white sm:text-7xl">
                <span aria-hidden="true">{score}</span>
                <span className="sr-only">{result.score}</span>
                <span className="ml-2 text-xl font-bold tracking-normal text-white/50 sm:text-2xl">/ {MAX_SCORE}</span>
              </p>
            </div>
            {isNewBest ? (
              <span className={cx("mb-3 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]", TONE_SURFACE.good, TONE_TEXT.good)}>
                New personal best
              </span>
            ) : best !== null && best > result.score ? (
              <span className="mb-3 rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-white/60">
                Your best {best}
              </span>
            ) : null}
          </div>
          <p className="mt-2 font-mono text-[11px] text-white/50">
            health {breakdown.health} − risks {breakdown.riskPenalty} − overtime {breakdown.overtimePenalty}
          </p>

          <dl className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">{stat.label}</dt>
                <dd className={cx("heading mt-1 text-lg font-extrabold tracking-[-0.03em]", TONE_TEXT[stat.tone])}>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Your calls</h4>
          <ol className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
            {state.history.map((decision) => {
              const incident = shipIt.incident(decision.incidentId);
              const choice = shipIt.choice(decision.incidentId, decision.choiceId);
              const grade = GRADE_COPY[decision.grade];
              const stage = shipIt.content.stages[decision.stageIndex];
              return (
                <li
                  key={decision.stageIndex}
                  className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]"
                >
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/55 sm:mt-0.5">
                    {stage?.short}
                  </span>
                  <span
                    className={cx(
                      "justify-self-end font-mono text-[10.5px] uppercase tracking-[0.1em] sm:order-last sm:mt-0.5",
                      TONE_TEXT[grade.tone],
                    )}
                  >
                    {grade.label}
                  </span>
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <p className="text-sm font-semibold leading-snug text-white/90">{incident.title}</p>
                    <p className="mt-0.5 text-sm leading-snug text-white/60">{choice?.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          {result.risks.length > 0 ? (
            <div className="mt-6">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Shipped with known risks</h4>
              <ul className="mt-3 grid gap-2">
                {result.risks.map((risk) => (
                  <li key={risk.id} className={cx("flex items-start gap-2 text-sm", TONE_TEXT[SEVERITY_TONE[risk.severity]])}>
                    <AlertIcon className="mt-0.5 shrink-0" />
                    <span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em]">{risk.severity}</span>{" "}
                      <span className="text-white/80">{risk.title}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={cx("mt-6 flex items-center gap-2 text-sm font-semibold", TONE_TEXT.good)}>
              <CheckIcon /> No known risks shipped.
            </p>
          )}

          {result.practices.length > 0 ? (
            <div className="mt-6">
              <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/55">Practices you used</h4>
              <ul className="mt-3 flex flex-wrap gap-2">
                {result.practices.map((practice) => (
                  <li
                    key={practice.id}
                    className="rounded-full border border-[#9fdcbf]/25 bg-[#9fdcbf]/[0.07] px-3 py-1 text-xs font-semibold text-[#c3efd9]"
                  >
                    {practice.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="inline-flex items-center gap-2 rounded-full bg-[#9fdcbf] px-6 py-3.5 text-sm font-bold text-[#0b1110] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
        >
          <PlayIcon /> Play a new run
        </button>
        <button
          type="button"
          onClick={onReplay}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
        >
          <RestartIcon /> Replay these incidents
        </button>
        <CopyRunLink runCode={runCode} />
      </div>

      <div className="mt-10 rounded-[22px] bg-[#f7f6f2] p-6 text-[#111111] sm:p-8 lg:flex lg:items-end lg:justify-between lg:gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#31594a]">Behind the game</p>
          <h4 className="heading mt-3 text-2xl font-extrabold tracking-[-0.045em] sm:text-3xl">Want to see how I build real software?</h4>
          <p className="mt-3 max-w-2xl leading-7 text-[#62645f]">
            Several of these calls come from real projects: idempotent, rollback-ready writes in QueryLift, server-validated
            AI output in MealSaver, and server-side turn logic in One Day.
          </p>
        </div>
        <div className="mt-6 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0">
          <a
            href={`${PORTFOLIO_URL}#work`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#31594a] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#244438] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#31594a]"
          >
            View projects ↗
          </a>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-black/20 px-6 py-3.5 text-sm font-bold transition hover:border-black hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#31594a]"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      <p className="mt-6 text-xs leading-5 text-white/55">
        SHIP IT is a game about release judgement, not a skills assessment. Every scenario is a fictional composite of
        common engineering problems.
      </p>
    </section>
  );
}

function CopyRunLink({ runCode }: { runCode: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("run", runCode);
    url.hash = "ship-it";
    try {
      await navigator.clipboard.writeText(url.toString());
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2400);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
      >
        {status === "copied" ? <CheckIcon /> : <LinkIcon />}
        {status === "copied" ? "Link copied" : status === "failed" ? `Run code ${runCode}` : "Copy challenge link"}
      </button>
      <span role="status" className="sr-only">
        {status === "copied" ? "Challenge link copied to the clipboard." : status === "failed" ? `Copy failed. The run code is ${runCode}.` : ""}
      </span>
    </>
  );
}
