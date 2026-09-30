import type { Choice } from "../engine/types";
import { cx } from "./tones";

interface ChoiceListProps {
  choices: readonly Choice[];
  minutesLeft: number;
  onChoose: (choiceId: string) => void;
}

export function ChoiceList({ choices, minutesLeft, onChoose }: ChoiceListProps) {
  return (
    <div role="group" aria-labelledby="ship-it-choices-label" className="mt-6">
      <p
        id="ship-it-choices-label"
        className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-white/60"
      >
        <span>Your call</span>
        <span aria-hidden="true" className="hidden normal-case tracking-normal text-white/50 pointer-fine:inline">
          Press 1–{choices.length}
        </span>
      </p>
      <ol className="grid gap-2.5">
        {choices.map((choice, index) => {
          const pastWindow = minutesLeft >= 0 && choice.minutes > minutesLeft;
          return (
            <li key={choice.id}>
              <button
                type="button"
                onClick={() => onChoose(choice.id)}
                aria-keyshortcuts={String(index + 1)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 py-3.5 text-left transition duration-200 hover:-translate-y-px hover:border-[#9fdcbf]/45 hover:bg-white/[0.07] focus-visible:border-[#9fdcbf]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9fdcbf] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:gap-4 sm:px-4 sm:py-4"
              >
                <kbd
                  aria-hidden="true"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/[0.04] font-mono text-xs font-semibold text-white/70 transition group-hover:border-[#9fdcbf]/60 group-hover:text-[#9fdcbf]"
                >
                  {index + 1}
                </kbd>
                <span className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-white/90">{choice.label}</span>
                <span
                  className={cx(
                    "shrink-0 rounded-full border px-2 py-0.5 font-mono text-[11px] tabular-nums",
                    pastWindow ? "border-[#f0c36b]/40 text-[#f0c36b]" : "border-white/10 text-white/60",
                  )}
                  title={pastWindow ? "Runs past the release window" : undefined}
                >
                  <span className="sr-only">, takes </span>
                  {choice.minutes} min
                  {pastWindow ? <span className="sr-only">, past the release window</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
