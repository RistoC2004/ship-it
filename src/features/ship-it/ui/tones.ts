import type { Tone } from "./copy";

/**
 * Full class strings (not concatenated) so Tailwind can see them at build time.
 * Colors are tuned for at least 4.5:1 contrast on the console background.
 */
export const TONE_TEXT: Readonly<Record<Tone, string>> = {
  good: "text-[#9fdcbf]",
  info: "text-[#c5d3cb]",
  warn: "text-[#f0c36b]",
  bad: "text-[#f4978a]",
};

export const TONE_SURFACE: Readonly<Record<Tone, string>> = {
  good: "border-[#9fdcbf]/30 bg-[#9fdcbf]/[0.08]",
  info: "border-white/15 bg-white/[0.05]",
  warn: "border-[#f0c36b]/30 bg-[#f0c36b]/[0.08]",
  bad: "border-[#f4978a]/35 bg-[#f4978a]/[0.08]",
};

export const TONE_FILL: Readonly<Record<Tone, string>> = {
  good: "bg-[#9fdcbf]",
  info: "bg-[#c5d3cb]",
  warn: "bg-[#f0c36b]",
  bad: "bg-[#f4978a]",
};

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
