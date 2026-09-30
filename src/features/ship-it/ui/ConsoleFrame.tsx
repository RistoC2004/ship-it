import type { KeyboardEventHandler, ReactNode, Ref } from "react";
import type { Tone } from "./copy";
import { cx, TONE_FILL, TONE_TEXT } from "./tones";

interface ConsoleFrameProps {
  status: { label: string; tone: Tone; live?: boolean };
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  label?: string;
  ref?: Ref<HTMLDivElement>;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
}

/** The dark "control room" shell shared by the preview, loading state and game. */
export function ConsoleFrame({ status, meta, actions, children, label = "SHIP IT game", ref, onKeyDown }: ConsoleFrameProps) {
  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative isolate scroll-mt-20 overflow-hidden rounded-[24px] border border-black/10 bg-[#0b1110] text-[#e7eee9] shadow-[0_50px_120px_-50px_rgba(10,30,22,0.75)] sm:rounded-[30px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_8%_0%,rgba(49,89,74,0.55),transparent_70%),radial-gradient(45%_35%_at_100%_100%,rgba(49,89,74,0.22),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_65%)]"
      />

      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span className="heading shrink-0 whitespace-nowrap text-[15px] font-extrabold tracking-[-0.02em] text-white">SHIP IT</span>
          <span aria-hidden="true" className="hidden h-4 w-px bg-white/15 md:block" />
          <span className="hidden font-mono text-xs text-white/55 md:inline">release/v2.4.0</span>
          <span
            className={cx(
              "inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em]",
              TONE_TEXT[status.tone],
            )}
          >
            <span
              aria-hidden="true"
              className={cx("h-1.5 w-1.5 shrink-0 rounded-full", TONE_FILL[status.tone], status.live && "motion-safe:animate-pulse")}
            />
            <span className="truncate">{status.label}</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {meta}
          {actions}
        </div>
      </div>

      {children}
    </div>
  );
}

export function ConsoleButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9fdcbf]"
    >
      {children}
    </button>
  );
}
