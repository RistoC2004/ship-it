import type { StageStatus } from "../engine/types";
import { cx } from "./tones";

export interface PipelineStage {
  readonly id: string;
  readonly label: string;
  readonly short: string;
  readonly status: StageStatus;
}

const STATUS: Readonly<Record<StageStatus, { bar: string; text: string; glyph: string; spoken: string }>> = {
  pending: { bar: "bg-white/10", text: "text-white/50", glyph: "", spoken: "not started" },
  active: { bar: "bg-[#9fdcbf]/70 motion-safe:animate-pulse", text: "text-white", glyph: "●", spoken: "in progress" },
  alert: { bar: "bg-[#f4978a] motion-safe:animate-pulse", text: "text-[#f4978a]", glyph: "!", spoken: "incident in progress" },
  passed: { bar: "bg-[#9fdcbf]", text: "text-[#9fdcbf]", glyph: "✓", spoken: "passed" },
  warned: { bar: "bg-[#f0c36b]", text: "text-[#f0c36b]", glyph: "▲", spoken: "passed with a known risk" },
};

/** Five-segment release pipeline. Labels shorten on phones. */
export function PipelineTrack({ stages }: { stages: readonly PipelineStage[] }) {
  return (
    <ol aria-label="Release pipeline" className="grid grid-cols-5 gap-1.5 px-4 pb-4 pt-4 sm:gap-2.5 sm:px-6 sm:pt-5">
      {stages.map((stage) => {
        const status = STATUS[stage.status];
        const current = stage.status === "active" || stage.status === "alert";
        return (
          <li key={stage.id} aria-current={current ? "step" : undefined} className="min-w-0">
            <div className={cx("h-1.5 rounded-full transition-colors duration-500", status.bar)} />
            <div
              className={cx(
                "mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] sm:text-[11px]",
                status.text,
              )}
            >
              {status.glyph ? (
                <span aria-hidden="true" className="hidden shrink-0 text-[10px] sm:inline">
                  {status.glyph}
                </span>
              ) : null}
              <span className="truncate sm:hidden">{stage.short}</span>
              <span className="hidden truncate sm:inline">{stage.label}</span>
              <span className="sr-only">, {status.spoken}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
