import { isImprovement, metricBand, userImpactLabel } from "../engine/metrics";
import type { MetricKey, Metrics } from "../engine/types";
import { METRIC_LABELS, type Tone } from "./copy";
import styles from "./ship-it.module.css";
import { cx, TONE_FILL, TONE_TEXT } from "./tones";

const BAND_TONE = { good: "good", watch: "warn", poor: "bad" } as const satisfies Record<string, Tone>;
const BAND_WORD = { good: "healthy", watch: "needs attention", poor: "poor" } as const;
const SHORT_LABELS: Readonly<Record<MetricKey, string>> = {
  stability: "Stability",
  userImpact: "Impact",
  confidence: "Confidence",
};
// Phones: 2×2 compact rows (label left, value right). Tablets: one row of four.
// Desktop: a stacked sidebar.
const CARD = "min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:rounded-2xl sm:p-3.5";
const HEAD = "flex items-baseline justify-between gap-2 sm:block";
const LABEL = "truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/60 sm:text-[11px] sm:tracking-[0.1em]";
const READOUT = "flex shrink-0 items-baseline gap-1.5 sm:mt-1 sm:gap-2";
const VALUE = "heading text-lg font-extrabold tabular-nums tracking-[-0.04em] sm:text-xl lg:text-2xl";

interface MetricsPanelProps {
  metrics: Metrics;
  /** Change from the decision just made, shown as a small delta. */
  delta?: Metrics;
  minutesSpent?: number;
  minutesLeft: number;
  windowMinutes: number;
  closesAt: string;
  /** Changes per decision so delta animations replay. */
  pulseKey: number;
}

export function MetricsPanel({ metrics, delta, minutesSpent, minutesLeft, windowMinutes, closesAt, pulseKey }: MetricsPanelProps) {
  return (
    <section aria-label="Release health" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2 lg:grid-cols-1 lg:gap-2.5">
      {(["stability", "userImpact", "confidence"] as const).map((key) => (
        <Meter key={key} metric={key} value={metrics[key]} delta={delta?.[key]} pulseKey={pulseKey} />
      ))}
      <TimeMeter
        minutesLeft={minutesLeft}
        windowMinutes={windowMinutes}
        closesAt={closesAt}
        spent={minutesSpent}
        pulseKey={pulseKey}
      />
    </section>
  );
}

function Delta({ value, tone, pulseKey, suffix = "" }: { value: number; tone: string; pulseKey: number; suffix?: string }) {
  return (
    <span key={pulseKey} aria-hidden="true" className={cx(styles.pop, "font-mono text-[11px] font-semibold tabular-nums", tone)}>
      {value > 0 ? "+" : "−"}
      {Math.abs(value)}
      {suffix}
    </span>
  );
}

function Meter({ metric, value, delta, pulseKey }: { metric: MetricKey; value: number; delta?: number; pulseKey: number }) {
  const band = metricBand(metric, value);
  const tone = BAND_TONE[band];
  const isImpact = metric === "userImpact";
  const valueText = isImpact
    ? `${userImpactLabel(value)}, ${value} of 100`
    : `${value} of 100, ${BAND_WORD[band]}`;

  return (
    <div
      role="meter"
      aria-label={METRIC_LABELS[metric]}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={CARD}
    >
      <div className={HEAD}>
        <p className={LABEL}>
          <span className="sm:hidden">{SHORT_LABELS[metric]}</span>
          <span className="hidden sm:inline">{METRIC_LABELS[metric]}</span>
        </p>
        <div className={READOUT}>
          <span className={cx(VALUE, TONE_TEXT[tone])}>{isImpact ? userImpactLabel(value) : value}</span>
          {delta ? (
            <Delta
              value={delta}
              tone={isImprovement(metric, delta) ? TONE_TEXT.good : TONE_TEXT.bad}
              pulseKey={pulseKey}
            />
          ) : null}
        </div>
      </div>
      <Bar tone={tone} percent={value} />
    </div>
  );
}

function Bar({ tone, percent }: { tone: Tone; percent: number }) {
  return (
    <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
      <div
        className={cx("h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none", TONE_FILL[tone])}
        style={{ width: `${Math.max(percent, 2)}%` }}
      />
    </div>
  );
}

function TimeMeter({
  minutesLeft,
  windowMinutes,
  closesAt,
  spent,
  pulseKey,
}: {
  minutesLeft: number;
  windowMinutes: number;
  closesAt: string;
  spent?: number;
  pulseKey: number;
}) {
  const over = minutesLeft < 0;
  const tone: Tone = over ? "bad" : minutesLeft < 20 ? "warn" : "good";
  const width = over ? 100 : (minutesLeft / windowMinutes) * 100;

  return (
    <div
      role="meter"
      aria-label="Release window"
      aria-valuemin={0}
      aria-valuemax={windowMinutes}
      aria-valuenow={Math.max(0, minutesLeft)}
      aria-valuetext={
        over ? `${-minutesLeft} minutes past the ${closesAt} window` : `${minutesLeft} minutes left, closes at ${closesAt}`
      }
      className={CARD}
    >
      <div className={HEAD}>
        <p className={LABEL}>{over ? "Over window" : "Time left"}</p>
        <div className={READOUT}>
          <span className={cx(VALUE, TONE_TEXT[tone])}>
            {Math.abs(minutesLeft)}
            <span className="ml-0.5 text-[11px] font-bold tracking-normal text-white/55 sm:ml-1 sm:text-sm">min</span>
          </span>
          {spent ? <Delta value={-spent} tone="text-white/60" pulseKey={pulseKey} suffix="m" /> : null}
        </div>
      </div>
      <Bar tone={tone} percent={width} />
    </div>
  );
}
