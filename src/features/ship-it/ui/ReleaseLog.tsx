import { useEffect, useRef } from "react";
import type { LogEntry, LogTone } from "../engine/types";
import styles from "./ship-it.module.css";
import { cx } from "./tones";

const TONE_CLASS: Readonly<Record<LogTone, string>> = {
  info: "text-white/70",
  good: "text-[#9fdcbf]",
  warn: "text-[#f0c36b]",
  bad: "text-[#f4978a]",
};

interface ReleaseLogProps {
  entries: readonly LogEntry[];
  clock: (minute: number) => string;
  /** Height-capped and auto-scrolling in the sidebar; full length elsewhere. */
  compact?: boolean;
}

export function ReleaseLog({ entries, clock, compact = false }: ReleaseLogProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (compact && list) list.scrollTop = list.scrollHeight;
  }, [entries.length, compact]);

  return (
    <ol
      ref={listRef}
      aria-label="Release log"
      tabIndex={compact ? 0 : undefined}
      className={cx(
        "space-y-1.5 font-mono text-[11.5px] leading-relaxed",
        compact &&
          "max-h-[248px] overflow-y-auto pr-1 [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9fdcbf]",
      )}
    >
      {entries.map((entry) => (
        <li key={entry.id} className={cx("grid grid-cols-[2.9rem_1fr] gap-2", styles.line)}>
          <span className="tabular-nums text-white/50">{clock(entry.minute)}</span>
          <span className={TONE_CLASS[entry.tone]}>{entry.text}</span>
        </li>
      ))}
    </ol>
  );
}
