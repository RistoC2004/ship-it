import { defineIncidents } from "../define";

export const CANARY_INCIDENTS = defineIncidents([
  {
    id: "cn-purchases",
    stage: "canary",
    title: "Canary purchases are failing",
    summary:
      "Five percent of users are on v2.4.0. CI is green, but subscription purchases on the canary succeed far less often than on the stable build.",
    severity: "sev1",
    category: "Payments",
    concept: "rollback",
    tags: [],
    log: "Canary: purchase success 60.7% (stable 94.6%)",
    evidence: {
      kind: "metrics",
      title: "canary · purchases, last 30 min",
      lines: [
        "                  stable 95%   canary 5%",
        "purchase_start        1,204          61",
        "purchase_success      1,139          37",
        "success rate          94.6%       60.7%",
        "",
        "canary only: receipt_validation_failed",
      ],
    },
    choices: [
      {
        id: "rollback",
        label: "Halt the rollout and roll the canary back",
        minutes: 6,
        grade: "strong",
        effects: { stability: 10, confidence: 8, userImpact: 2 },
        practice: "rollback-first",
        feedback:
          "Rolling back first caps the damage at 5% of users for a few minutes. The error only happens on the canary, so the cause is in this release, and now you can find it without customers paying for it.",
        log: "Canary rolled back · rollout halted",
      },
      {
        id: "promote",
        label: "Promote to 100%; CI passed",
        minutes: 1,
        grade: "risky",
        effects: { stability: -22, confidence: -10, userImpact: 34 },
        feedback:
          "CI tests the paths you thought to test. Real purchases hit real stores and real receipts, and now every customer hits the failure.",
        log: "v2.4.0 promoted to 100%",
      },
      {
        id: "debug-live",
        label: "Keep the canary running and debug it live",
        minutes: 20,
        grade: "costly",
        effects: { stability: -4, confidence: 4, userImpact: 12 },
        feedback:
          "You'll find it, but every minute of live debugging is more failed purchases on real accounts.",
        log: "Debugging on the live canary",
      },
      {
        id: "hotfix-forward",
        label: "Hotfix forward on the canary",
        minutes: 14,
        grade: "costly",
        effects: { stability: -6, confidence: -4, userImpact: 8 },
        feedback:
          "Patching under pressure sometimes works. This hotfix skipped the receipt tests, and the canary is still failing.",
        log: "Hotfix 2.4.1 to canary · still failing",
      },
    ],
    related: {
      project: "MoneyBack",
      anchor: "moneyback",
      note: "MoneyBack's subscription purchases were verified live in production after its App Store release.",
    },
  },
  {
    id: "cn-latency",
    stage: "canary",
    title: "Canary latency tripled",
    summary: "Canary API p95 latency went from 180 ms to 620 ms. Error rates look normal.",
    severity: "sev2",
    category: "Performance",
    concept: "performance",
    tags: [],
    log: "Canary: p95 latency 180 ms → 620 ms",
    evidence: {
      kind: "log",
      title: "canary · slow query log",
      lines: [
        "SELECT * FROM orders",
        "  WHERE customer_id = $1",
        "  ORDER BY created_at DESC",
        "→ Seq Scan on orders (2,184,003 rows)",
        "  actual time 412.8 ms",
        "",
        "migration 0042: added customer_id, no index",
      ],
    },
    choices: [
      {
        id: "add-index",
        label: "Add the missing index concurrently",
        minutes: 12,
        grade: "strong",
        effects: { stability: 10, confidence: 10 },
        practice: "measure",
        feedback:
          "Migration 0042 added customer_id without an index, so every lookup scans 2 million rows. CREATE INDEX CONCURRENTLY fixes it without locking the table.",
        log: "Index on orders(customer_id) · p95 175 ms",
      },
      {
        id: "scale-up",
        label: "Scale up the database instance",
        minutes: 6,
        grade: "costly",
        effects: { stability: 2, confidence: -2 },
        addsRisk: "slow-query",
        feedback:
          "Bigger hardware buys headroom, not a fix. The scan grows with every order, and so does the bill.",
        log: "Database scaled 2× · p95 410 ms",
      },
      {
        id: "ignore",
        label: "Ship it; the error rate is normal",
        minutes: 1,
        grade: "risky",
        effects: { stability: -10, confidence: -8, userImpact: 12 },
        addsRisk: "slow-query",
        feedback:
          "Latency is a leading indicator. At full traffic, a 400 ms scan on every request turns into connection pool exhaustion.",
        log: "Latency alert acknowledged",
      },
      {
        id: "cache",
        label: "Put a cache in front of the orders API",
        minutes: 18,
        grade: "costly",
        effects: { stability: 2, confidence: -4 },
        addsRisk: "stale-orders",
        feedback:
          "Repeat visits get faster and the slow query is still there. Customers also see stale order lists right after they buy.",
        log: "Orders API cached (60 s TTL)",
      },
    ],
  },
  {
    id: "cn-retry-dupes",
    stage: "canary",
    title: "Retries are creating duplicate records",
    summary:
      "The mobile client now retries failed requests. On the canary, some users have two identical expense entries.",
    severity: "sev2",
    category: "Reliability",
    concept: "idempotency",
    tags: [],
    log: "Canary: duplicate expenses after client retries",
    evidence: {
      kind: "log",
      title: "canary · request trace",
      lines: [
        "POST /expenses → 201 Created   1,840 ms",
        "  client timeout at 1,500 ms → retry",
        "POST /expenses → 201 Created     240 ms",
        "",
        "result: 2 rows · same amount · same second",
      ],
    },
    choices: [
      {
        id: "disable-retries",
        label: "Turn off client retries",
        minutes: 4,
        grade: "reasonable",
        effects: { stability: 2, confidence: 2, userImpact: 4 },
        feedback:
          "Duplicates stop, and so does recovery from requests that really failed. Users on bad connections now see more errors.",
        log: "Client retries disabled",
      },
      {
        id: "idempotent-endpoint",
        label: "Make POST /expenses idempotent with a request key",
        minutes: 18,
        grade: "strong",
        effects: { stability: 10, confidence: 12 },
        practice: "idempotency",
        feedback:
          "The first request succeeded; the client just never heard back. With an idempotency key, the retry returns the original record instead of creating a second one.",
        log: "Idempotency-Key on POST /expenses",
      },
      {
        id: "longer-timeout",
        label: "Raise the client timeout to 10 seconds",
        minutes: 3,
        grade: "costly",
        effects: { stability: -2, confidence: -4, userImpact: 4 },
        addsRisk: "retry-dupes",
        feedback:
          "Fewer timeouts, same bug. Any retry of a slow success still duplicates, and users now wait ten seconds to find out.",
        log: "Client timeout raised to 10 s",
      },
      {
        id: "cleanup-script",
        label: "Clean up duplicate rows with a script after release",
        minutes: 10,
        grade: "costly",
        effects: { stability: -2, confidence: -4, userImpact: 6 },
        addsRisk: "retry-dupes",
        feedback: "The script cleans up today's duplicates. Tomorrow's are already on their way.",
        log: "Dedupe script scheduled",
      },
    ],
    related: {
      project: "Domino",
      anchor: "domino",
      note: "Domino's shared group state had to account for duplicate writes.",
    },
  },
]);
