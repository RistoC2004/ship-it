import { ShipItSection } from "@/features/ship-it/ShipItSection";
import { GITHUB_PROFILE_URL, PORTFOLIO_URL, SOURCE_URL } from "@/features/ship-it/site";

const pillars = [
  {
    title: "Deterministic engine",
    body: "The game is a pure reducer over plain TypeScript, with no React inside. Every run comes from a seed, so it can be replayed, shared as a code, and tested exhaustively.",
    path: "tree/main/src/features/ship-it/engine",
    label: "engine/",
  },
  {
    title: "Content as data",
    body: "Incidents, risks and practices are typed data with their own validator, so a new scenario can't reference a missing risk or ship without a good answer.",
    path: "tree/main/src/features/ship-it/content",
    label: "content/",
  },
  {
    title: "Balance as tests",
    body: "The suite plays 1,000 seeded runs per strategy: strong calls must ship clean, shortcuts must never pay off, and doing the slowest thing everywhere must never ship clean.",
    path: "blob/main/tests/ship-it/balance.test.ts",
    label: "balance.test.ts",
  },
  {
    title: "Loaded on demand",
    body: "The engine, content and UI are one lazy chunk fetched when someone presses Start. An error boundary contains failures, and Try again genuinely re-fetches.",
    path: "blob/main/src/features/ship-it/ShipItLauncher.tsx",
    label: "ShipItLauncher.tsx",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#111111]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f6f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <h1 className="heading text-sm font-extrabold tracking-[-0.03em]">
            SHIP IT <span className="font-semibold text-[#62645f]">by Risto Caissie</span>
          </h1>
          <nav className="flex items-center gap-3">
            <a
              href={SOURCE_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-white sm:inline-block"
            >
              Source ↗
            </a>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#31594a]"
            >
              Portfolio ↗
            </a>
          </nav>
        </div>
      </header>

      <ShipItSection />

      <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-16 border-t border-black/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#31594a]">How it&apos;s built</p>
          <h2 id="how-title" className="heading mt-4 max-w-3xl text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">
            A small game, engineered like a product.
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <li key={pillar.title} className="flex flex-col rounded-[24px] border border-black/10 bg-[#f7f6f2] p-6 sm:p-7">
                <h3 className="heading text-xl font-extrabold tracking-[-0.03em]">{pillar.title}</h3>
                <p className="mt-3 flex-1 leading-7 text-[#62645f]">{pillar.body}</p>
                <a
                  href={`${SOURCE_URL}/${pillar.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-fit items-center gap-2 border-b border-black pb-1 font-mono text-sm font-semibold transition hover:text-[#31594a]"
                >
                  {pillar.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-[#62645f] sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>SHIP IT · a game about release judgement, not a skills assessment.</p>
          <p className="flex gap-4">
            <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[#111111]">
              Portfolio
            </a>
            <a href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[#111111]">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
