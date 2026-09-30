import type { Ref } from "react";
import type { Evidence, Incident, StageDefinition } from "../engine/types";
import { SEVERITY_COPY } from "./copy";
import { classifyLine, EVIDENCE_KIND_LABEL, type LineKind } from "./evidence";
import styles from "./ship-it.module.css";
import { cx, TONE_SURFACE, TONE_TEXT } from "./tones";

interface IncidentCardProps {
  incident: Incident;
  stage: StageDefinition;
  number: number;
  total: number;
  followUp: boolean;
  headingRef?: Ref<HTMLHeadingElement>;
}

export function IncidentCard({ incident, stage, number, total, followUp, headingRef }: IncidentCardProps) {
  const severity = SEVERITY_COPY[incident.severity];
  const chip = "rounded-md border px-1.5 py-0.5";

  return (
    <article aria-labelledby="ship-it-incident-title" className={styles.enter}>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.1em]">
        <span className="text-white/60">
          Incident {number}/{total}
        </span>
        <span className={cx(chip, TONE_SURFACE[severity.tone], TONE_TEXT[severity.tone])}>{severity.label}</span>
        {followUp ? <span className={cx(chip, TONE_SURFACE.bad, TONE_TEXT.bad)}>Follow-up</span> : null}
        <span className="text-white/60">
          {stage.label} · {incident.category}
        </span>
      </div>

      <h3
        ref={headingRef}
        id="ship-it-incident-title"
        tabIndex={-1}
        className="heading mt-3 scroll-mt-24 text-[26px] font-extrabold leading-[1.08] tracking-[-0.04em] text-white outline-none sm:text-[34px]"
      >
        {incident.title}
      </h3>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/70 sm:text-base">{incident.summary}</p>

      {incident.evidence ? <EvidenceBlock evidence={incident.evidence} /> : null}
    </article>
  );
}

const LINE_CLASS: Readonly<Record<LineKind, string>> = {
  added: "bg-[#9fdcbf]/[0.09] text-[#c3efd9]",
  removed: "bg-[#f4978a]/[0.1] text-[#f8bdb3]",
  comment: "text-white/50",
  alert: "text-[#f6b4a9]",
  plain: "text-white/80",
};

function EvidenceBlock({ evidence }: { evidence: Evidence }) {
  return (
    <figure className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#050807]/80">
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2 font-mono text-[11px] text-white/55">
        <span className="truncate">{evidence.title}</span>
        <span className="shrink-0 uppercase tracking-[0.14em]">{EVIDENCE_KIND_LABEL[evidence.kind]}</span>
      </figcaption>
      {/* Lines wrap on phones instead of scrolling sideways; from `sm` up they always fit. */}
      <pre className="whitespace-pre-wrap break-words py-3 font-mono text-[11px] leading-[1.7] sm:overflow-x-auto sm:whitespace-pre sm:text-[12.5px] sm:leading-[1.75]">
        <code className="block sm:w-max sm:min-w-full">
          {evidence.lines.map((line, index) => (
            <span
              key={index}
              className={cx("block px-3 sm:px-4", LINE_CLASS[classifyLine(evidence.kind, line)], styles.line)}
              style={{ animationDelay: `${80 + index * 40}ms` }}
            >
              {line || " "}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
