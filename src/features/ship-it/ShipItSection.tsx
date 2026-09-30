import { ShipItLauncher } from "./ShipItLauncher";
import { PORTFOLIO_URL } from "./site";

/**
 * Server-rendered wrapper. The heading and copy are static HTML; only the
 * launcher is interactive, and the game itself loads on demand.
 */
export function ShipItSection() {
  return (
    <section id="ship-it" aria-labelledby="ship-it-title" className="scroll-mt-16 border-t border-black/10">
      <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10 lg:py-28">
        <div className="mb-10 grid gap-6 sm:mb-12 lg:grid-cols-[1fr_0.95fr] lg:items-end lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#31594a]">Interactive engineering challenge</p>
            <h2 id="ship-it-title" className="heading mt-4 text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Can you ship the release?
            </h2>
          </div>
          <div>
            <p className="text-lg leading-8 text-[#62645f]">
              <strong className="font-bold text-[#111111]">SHIP IT</strong> is a 90-second game about the judgement calls
              behind a production release. Five incidents are drawn from a library of real-world failure modes, and every
              action costs time. Some shortcuts come back later.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#62645f]">
              Built by Risto Caissie ·{" "}
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-black/25 underline-offset-4 transition hover:text-[#31594a]"
              >
                See the portfolio ↗
              </a>{" "}
              ·{" "}
              <a href="#how-it-works" className="underline decoration-black/25 underline-offset-4 transition hover:text-[#31594a]">
                How it&apos;s built
              </a>
            </p>
          </div>
        </div>
        <ShipItLauncher />
      </div>
    </section>
  );
}
