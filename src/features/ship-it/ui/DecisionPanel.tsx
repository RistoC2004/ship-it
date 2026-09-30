import type { Ref } from "react";
import { isImprovement, METRIC_KEYS } from "../engine/metrics";
import type { Choice, Decision, GameContent, Incident } from "../engine/types";
import { projectUrl } from "../site";
import { GRADE_COPY, METRIC_LABELS } from "./copy";
import { AlertIcon, ArrowIcon, CheckIcon } from "./icons";
import { linkArrow, linkProps } from "./links";
import styles from "./ship-it.module.css";
import { cx, TONE_SURFACE, TONE_TEXT } from "./tones";

interface DecisionPanelProps {
  incident: Incident;
  choice: Choice;
  decision: Decision;
  content: GameContent;
  isLast: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
  onContinue: () => void;
}

export function DecisionPanel({ incident, choice, decision, content, isLast, headingRef, onContinue }: DecisionPanelProps) {
  const grade = GRADE_COPY[choice.grade];
  const alternatives = incident.choices.filter((candidate) => candidate.id !== choice.id);
  const changes = METRIC_KEYS.filter((key) => decision.applied[key] !== 0);
  const relatedHref = incident.related ? projectUrl(incident.related.anchor) : "";

  return (
    <section aria-labelledby="ship-it-verdict" className={cx("mt-6 scroll-mt-24", styles.enter)}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-white/55">You chose</span>
        <span className="min-w-0 flex-1 text-sm font-semibold text-white/85">{choice.label}</span>
      </div>

      <div className={cx("mt-3 rounded-2xl border p-5 sm:p-6", TONE_SURFACE[grade.tone])}>
        <h4
          ref={headingRef}
          id="ship-it-verdict"
          tabIndex={-1}
          className={cx("heading flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em] outline-none", TONE_TEXT[grade.tone])}
        >
          {choice.grade === "strong" || choice.grade === "reasonable" ? <CheckIcon /> : <AlertIcon />}
          {grade.label}
        </h4>
        <p className="mt-2 text-[15px] leading-7 text-white/85">{choice.feedback}</p>

        <ul className="mt-4 flex flex-wrap gap-2 font-mono text-[11px]" aria-label="Effect of this call">
          {changes.map((key) => {
            const value = decision.applied[key];
            const good = isImprovement(key, value);
            return (
              <li
                key={key}
                className={cx("rounded-full border px-2.5 py-1", good ? TONE_SURFACE.good : TONE_SURFACE.bad, good ? TONE_TEXT.good : TONE_TEXT.bad)}
              >
                {METRIC_LABELS[key]} {value > 0 ? "+" : "−"}
                {Math.abs(value)}
              </li>
            );
          })}
          <li className="rounded-full border border-white/10 px-2.5 py-1 text-white/65">{decision.minutes} min</li>
        </ul>

        {decision.risksResolved.map((risk) => (
          <p key={risk} className={cx("mt-3 flex items-start gap-2 text-sm font-semibold", TONE_TEXT.good)}>
            <CheckIcon className="mt-0.5 shrink-0" />
            <span>Resolved: {content.risks[risk]?.title}</span>
          </p>
        ))}
        {decision.risksAdded.map((risk) => (
          <p key={risk} className={cx("mt-3 flex items-start gap-2 text-sm font-semibold", TONE_TEXT.warn)}>
            <AlertIcon className="mt-0.5 shrink-0" />
            <span>Known risk added: {content.risks[risk]?.title}</span>
          </p>
        ))}
      </div>

      {incident.related ? (
        <a
          href={relatedHref}
          {...linkProps(relatedHref)}
          className="group mt-3 flex items-start gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm leading-6 text-white/70 transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9fdcbf]"
        >
          <span className="mt-0.5 shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-[#9fdcbf]">In my work</span>
          <span className="min-w-0">
            {incident.related.note}{" "}
            <span className="whitespace-nowrap font-semibold text-white/90 group-hover:text-white">
              See {incident.related.project} {linkArrow(relatedHref)}
            </span>
          </span>
        </a>
      ) : null}

      <details className="group mt-3 rounded-2xl border border-white/10 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9fdcbf]">
          How the other options play out
          <span aria-hidden="true" className="font-mono text-white/50 transition group-open:rotate-45">
            +
          </span>
        </summary>
        <ul className="grid gap-3 border-t border-white/10 px-4 py-4">
          {alternatives.map((alternative) => {
            const copy = GRADE_COPY[alternative.grade];
            return (
              <li key={alternative.id} className="text-sm leading-6">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className={cx("font-mono text-[11px] uppercase tracking-[0.1em]", TONE_TEXT[copy.tone])}>{copy.label}</span>
                  <span className="font-semibold text-white/85">{alternative.label}</span>
                  <span className="font-mono text-[11px] text-white/50">{alternative.minutes} min</span>
                </p>
                <p className="mt-1 text-white/60">{alternative.feedback}</p>
              </li>
            );
          })}
        </ul>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-full bg-[#9fdcbf] px-6 py-3.5 text-sm font-bold text-[#0b1110] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9fdcbf]"
        >
          {isLast ? "See the release report" : "Next incident"}
          <ArrowIcon />
        </button>
        <span aria-hidden="true" className="hidden font-mono text-xs text-white/50 pointer-fine:inline">
          or press Enter
        </span>
      </div>
    </section>
  );
}
