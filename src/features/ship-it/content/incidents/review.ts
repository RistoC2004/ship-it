import { defineIncidents } from "../define";

export const REVIEW_INCIDENTS = defineIncidents([
  {
    id: "rv-ai-authz",
    stage: "review",
    title: "An AI-generated fix for empty order history",
    summary:
      "After an API refactor, customers see an empty order history. An assistant generated this fix. It compiles, and orders load again.",
    severity: "sev2",
    category: "AI-assisted code",
    concept: "authorization",
    tags: ["ai"],
    log: "PR #482: order history fix (AI-generated)",
    evidence: {
      kind: "diff",
      title: "PR #482 · api/users/[userId]/orders.ts",
      lines: [
        "  export async function GET(req, { params }) {",
        "-   const user = await requireUser(req);",
        "    const orders = await db.order.findMany({",
        "-     where: { userId: user.id },",
        "+     where: { customerId: params.userId },",
        "    });",
        "    return Response.json(orders);",
        "  }",
      ],
    },
    choices: [
      {
        id: "ship",
        label: "Ship it; it fixes the reported bug",
        minutes: 2,
        grade: "risky",
        effects: { stability: 4, confidence: -8 },
        addsRisk: "idor",
        feedback:
          "Orders load again, for anyone. The fix drops requireUser and trusts the id in the URL, so one customer can read another's orders.",
        log: "PR #482 merged",
      },
      {
        id: "review",
        label: "Review the diff line by line and run the access tests",
        minutes: 14,
        grade: "strong",
        effects: { stability: 8, confidence: 14 },
        practice: "review-ai",
        feedback:
          "The review catches it. The real bug was the renamed customerId column, so you keep requireUser, query by user.id, and add a test that user A can't read user B's orders.",
        log: "Auth check kept · cross-account access test added",
      },
      {
        id: "rewrite",
        label: "Rewrite the order endpoints by hand",
        minutes: 48,
        grade: "costly",
        effects: { stability: 2, confidence: 2 },
        feedback:
          "It works, but most of the release window went into rewriting code that needed a two-line review. The new endpoints have fewer tests than the old ones.",
        log: "Order endpoints rewritten",
      },
      {
        id: "explain",
        label: "Ask the AI to explain the change, then ship it",
        minutes: 5,
        grade: "risky",
        effects: { stability: 4, confidence: -6 },
        addsRisk: "idor",
        feedback:
          "The explanation is fluent and confident, and never mentions the removed auth check. An explanation isn't a review.",
        log: "PR #482 merged after AI summary",
      },
    ],
    related: {
      project: "Domino",
      anchor: "domino",
      note: "Domino protects group history with membership-based access control.",
    },
  },
  {
    id: "rv-double-submit",
    stage: "review",
    title: "“Place order” can be tapped twice",
    summary:
      "QA found that a quick double tap creates two orders and two charges. The PR disables the button while the request is in flight.",
    severity: "sev2",
    category: "Data integrity",
    concept: "idempotency",
    tags: [],
    log: "PR #479: prevent double-submit on checkout",
    evidence: {
      kind: "code",
      title: "PR #479 · CheckoutButton.tsx",
      lines: [
        "async function placeOrder() {",
        "  setPending(true);",
        "  await api.post(\"/orders\", cart);",
        "  setPending(false);",
        "}",
        "",
        "<Button onPress={placeOrder}",
        "        disabled={pending} />",
      ],
    },
    choices: [
      {
        id: "approve",
        label: "Approve it; the disabled button covers it",
        minutes: 3,
        grade: "risky",
        effects: { stability: 2, confidence: -6 },
        addsRisk: "duplicate-orders",
        feedback:
          "It helps with the double tap. It doesn't help a timeout retry, a flaky network sending twice, or a second tab. The server still accepts duplicates.",
        log: "PR #479 approved",
      },
      {
        id: "idempotency-key",
        label: "Add an idempotency key the server enforces",
        minutes: 20,
        grade: "strong",
        effects: { stability: 8, confidence: 12 },
        practice: "idempotency",
        feedback:
          "Each checkout attempt gets a key. The server stores it under a unique constraint and returns the original order on repeats, so taps, retries and flaky networks all end in one order.",
        log: "Idempotency-Key enforced on POST /orders",
      },
      {
        id: "debounce",
        label: "Debounce the button by two seconds",
        minutes: 5,
        grade: "costly",
        effects: { stability: -2, confidence: -4 },
        addsRisk: "duplicate-orders",
        feedback:
          "Double taps get rarer on your phone. Retries still duplicate, and the button now feels broken for two seconds.",
        log: "Checkout button debounced (2 s)",
      },
      {
        id: "nightly-dedupe",
        label: "Merge it and dedupe orders in a nightly job",
        minutes: 10,
        grade: "costly",
        effects: { stability: -2, confidence: -4, userImpact: 6 },
        feedback:
          "Customers get charged twice today and refunded tomorrow. The job cleans up after the bug instead of preventing it.",
        log: "Nightly dedupe job scheduled",
      },
    ],
    related: {
      project: "QueryLift",
      anchor: "querylift",
      note: "QueryLift's merchant-controlled writes are hardened for mutation safety and idempotency.",
    },
  },
  {
    id: "rv-lost-update",
    stage: "review",
    title: "Two people edit the same group at once",
    summary:
      "A PR adds shared group settings. Each client reads the whole group, changes it, and writes the whole thing back.",
    severity: "sev2",
    category: "Shared state",
    concept: "concurrency",
    tags: [],
    log: "PR #486: shared group settings",
    evidence: {
      kind: "code",
      title: "PR #486 · groups.ts",
      lines: [
        "const group = await getGroup(id);",
        "group.members.push(newMember);",
        "await saveGroup(group); // overwrites the row",
      ],
    },
    choices: [
      {
        id: "approve",
        label: "Approve it; simultaneous edits will be rare",
        minutes: 2,
        grade: "risky",
        effects: { confidence: -8 },
        addsRisk: "lost-updates",
        feedback:
          "Rare isn't never. When two members join in the same second, one silently disappears, and nobody can reproduce it later.",
        log: "PR #486 approved",
      },
      {
        id: "atomic-insert",
        label: "Replace it with an atomic insert on the server",
        minutes: 16,
        grade: "strong",
        effects: { stability: 8, confidence: 12 },
        practice: "db-invariants",
        feedback:
          "Inserting a group_members row instead of rewriting the whole group means two joins at once both land. The database does the coordinating.",
        log: "Atomic member insert · race test added",
      },
      {
        id: "version-column",
        label: "Add optimistic locking with a version column",
        minutes: 24,
        grade: "reasonable",
        effects: { stability: 6, confidence: 8 },
        feedback:
          "Silent overwrites become conflicts the client can detect and retry. Solid, if heavier than an append needs.",
        log: "Optimistic locking on groups.version",
      },
      {
        id: "table-lock",
        label: "Lock the groups table during every edit",
        minutes: 12,
        grade: "costly",
        effects: { stability: -6, confidence: 2 },
        feedback:
          "Correct, and now every group waits on every other group's edits. Under load, that's the next outage.",
        log: "Table lock added to saveGroup",
      },
    ],
    related: {
      project: "Domino",
      anchor: "domino",
      note: "Domino coordinates sequential turn state across every member of a group.",
    },
  },
]);
