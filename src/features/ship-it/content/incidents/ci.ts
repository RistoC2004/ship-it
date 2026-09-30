import { defineIncidents } from "../define";

export const CI_INCIDENTS = defineIncidents([
  {
    id: "ci-flaky-discount",
    stage: "ci",
    title: "Checkout tests fail right before release",
    summary:
      "The release branch is red. A discount test fails on 2 of 5 runs, and nobody touched checkout this sprint.",
    severity: "sev3",
    category: "Testing",
    concept: "testing",
    tags: [],
    log: "CI red: checkout discount test fails 2 of 5 runs",
    evidence: {
      kind: "log",
      title: "ci · tests/checkout.test.ts",
      lines: [
        "✕ checkout › applies 15% discount before tax",
        "    expected total_cents  10799",
        "    received total_cents  10800",
        "    cart fixture: random (seed 48213)",
        "  retried 5×: 3 passed · 2 failed",
      ],
    },
    choices: [
      {
        id: "rerun",
        label: "Re-run the pipeline until it goes green",
        minutes: 6,
        grade: "risky",
        effects: { stability: -4, confidence: -10 },
        addsRisk: "rounding",
        feedback:
          "The third run is green, but a test that fails for specific carts is describing a real bug. The rounding error ships with the release.",
        log: "Re-ran CI 3× → green",
      },
      {
        id: "pin-seed",
        label: "Pin the failing seed and reproduce it locally",
        minutes: 18,
        grade: "strong",
        effects: { stability: 8, confidence: 14 },
        practice: "reproduce",
        feedback:
          "Seed 48213 fails every time: the discount is applied to a float total and rounded twice. Moving the math to integer cents fixes it, and the pinned seed becomes a regression test.",
        log: "Reproduced with seed 48213 · totals now in cents",
      },
      {
        id: "skip",
        label: "Skip the test for this release",
        minutes: 2,
        grade: "risky",
        effects: { stability: -4, confidence: -14 },
        addsRisk: "rounding",
        feedback:
          "CI is green, and nothing is watching discount math anymore. Skipped tests have a way of staying skipped.",
        log: "checkout.test.ts marked skip",
      },
      {
        id: "ai-make-green",
        label: "Ask an AI assistant to make the test pass",
        minutes: 4,
        grade: "risky",
        effects: { stability: -4, confidence: -10 },
        addsRisk: "rounding",
        feedback:
          "The assistant loosened the assertion to the nearest dollar, so the test passes by no longer checking cents. Asking it why the totals differ would have gone better.",
        log: "Assertion loosened (AI-suggested)",
      },
    ],
    related: {
      project: "QueryLift",
      anchor: "querylift",
      note: "QueryLift is backed by 129 automated tests.",
    },
  },
  {
    id: "ci-lockfile",
    stage: "ci",
    title: "A lockfile refresh broke the build",
    summary:
      "Someone regenerated the lockfile this morning. A date library jumped a major version, and type checking now fails in billing code.",
    severity: "sev3",
    category: "Dependencies",
    concept: "dependencies",
    tags: [],
    log: "Build failed: TS2345 in billing/period.ts",
    evidence: {
      kind: "log",
      title: "build · tsc --noEmit",
      lines: [
        "src/billing/period.ts:42:18",
        "  error TS2345: Argument of type",
        "  'Date | undefined' is not assignable",
        "  to parameter of type 'Date'.",
        "date-fns 3.6.0 → 4.1.0 (lockfile refresh)",
      ],
    },
    choices: [
      {
        id: "restore",
        label: "Restore the old lockfile and upgrade in its own PR",
        minutes: 8,
        grade: "strong",
        effects: { stability: 8, confidence: 10 },
        practice: "scope",
        feedback:
          "The release ships with exactly the versions it was tested against. The upgrade still happens, as its own reviewed change.",
        log: "Lockfile restored · upgrade moved to its own PR",
      },
      {
        id: "ts-ignore",
        label: "Add @ts-ignore and keep going",
        minutes: 2,
        grade: "risky",
        effects: { stability: -4, confidence: -12 },
        addsRisk: "billing-undefined",
        feedback:
          "The compiler found a real case: trial accounts have no billing end date. Silencing it moves the error from the build to a customer's invoice.",
        log: "@ts-ignore added to period.ts",
      },
      {
        id: "upgrade-all",
        label: "Upgrade every dependency to latest and fix what breaks",
        minutes: 45,
        grade: "costly",
        effects: { stability: -6, confidence: -2 },
        feedback:
          "It compiles 45 minutes later, and the release now carries a dozen untested upgrades nobody asked for.",
        log: "Upgraded 14 packages",
      },
      {
        id: "handle-undefined",
        label: "Handle the undefined date and add a test",
        minutes: 16,
        grade: "reasonable",
        effects: { stability: 6, confidence: 8 },
        feedback:
          "Correct: trial accounts are covered and tested. Restoring the lockfile would have unblocked the release sooner, but you fixed a real edge case.",
        log: "Trial accounts handled · test added",
      },
    ],
  },
  {
    id: "ci-leaked-key",
    stage: "ci",
    title: "Secret scanner found a live key in the bundle",
    summary:
      "The build's secret scan flagged client JavaScript. A server-only payments key is read through a public environment variable, and it has been there for two releases.",
    severity: "sev1",
    category: "Security",
    concept: "secrets",
    tags: [],
    log: "Secret scan: live payments key in client JS",
    evidence: {
      kind: "log",
      title: "build · secret-scan",
      lines: [
        "⚠ 1 finding in chunks/app-4f2a.js",
        "  pattern  sk_live_••••••••9f2c",
        "  source   process.env.NEXT_PUBLIC_PAY_KEY",
        "  since    v2.2.0",
      ],
    },
    choices: [
      {
        id: "server-and-rotate",
        label: "Move the call server-side and rotate the key",
        minutes: 24,
        grade: "strong",
        effects: { stability: 6, confidence: 12 },
        practice: "secrets",
        feedback:
          "Anything in a NEXT_PUBLIC_ variable ships to every browser. A server route stops the leak, and rotating covers the two releases where the key was already public.",
        log: "Payments moved server-side · key rotated",
      },
      {
        id: "rename",
        label: "Rename the variable so the scanner stops matching",
        minutes: 3,
        grade: "risky",
        effects: { confidence: -14 },
        addsRisk: "leaked-key",
        feedback: "The scanner goes quiet. The key is still in every visitor's browser.",
        log: "Env var renamed · scan passing",
      },
      {
        id: "server-only",
        label: "Move it server-side; rotation can wait",
        minutes: 14,
        grade: "risky",
        effects: { stability: 4, confidence: 2 },
        addsRisk: "unrotated-key",
        feedback:
          "The leak stops with this build, but the key was public for two releases. Anyone who copied it can keep using it until it's rotated.",
        log: "Payments moved server-side",
      },
      {
        id: "ticket",
        label: "Ship now and ticket it for next sprint",
        minutes: 1,
        grade: "risky",
        effects: { confidence: -12 },
        addsRisk: "leaked-key",
        feedback:
          "A live key in public JavaScript isn't a next-sprint problem. Anyone can open dev tools and copy it.",
        log: "Ticket SEC-212 filed",
      },
    ],
    related: {
      project: "MealSaver",
      anchor: "mealsaver",
      note: "MealSaver keeps its AI and API secrets in server-side Edge Functions.",
    },
  },
]);
