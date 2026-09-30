import { defineIncidents } from "../define";

/**
 * Consequences. These are never drawn for a stage; they replace a later
 * stage's incident when a risk that points at them is still open.
 */
export const FOLLOW_UP_INCIDENTS = defineIncidents([
  {
    id: "fu-order-exposure",
    stage: "follow-up",
    title: "Customers can see each other's orders",
    summary:
      "That order history fix is back. A customer emailed support: changing the number in the URL shows someone else's orders.",
    severity: "sev1",
    category: "Security",
    concept: "fu-order-exposure",
    tags: ["ai"],
    log: "Security report: orders readable across accounts",
    evidence: {
      kind: "log",
      title: "api · access log",
      lines: [
        "session user 2210",
        "GET /api/users/1043/orders → 200 OK",
        "GET /api/users/1044/orders → 200 OK",
        "GET /api/users/1045/orders → 200 OK",
      ],
    },
    choices: [
      {
        id: "contain-and-audit",
        label: "Roll back, restore the auth check, and audit who was exposed",
        minutes: 22,
        grade: "strong",
        effects: { stability: 8, confidence: 8, userImpact: 14 },
        resolvesRisks: ["idor"],
        practice: "disclose",
        feedback:
          "Rolling back closes the hole now. The access log shows whose orders were read, and a new cross-account test keeps it closed. The review you skipped would have taken 14 minutes.",
        log: "Auth check restored · exposure audited",
      },
      {
        id: "hide-id",
        label: "Hide the user id from the URL",
        minutes: 8,
        grade: "risky",
        effects: { confidence: -8, userImpact: 12 },
        feedback: "The API still accepts any id. Hiding an input doesn't authorize the request.",
        log: "User id moved out of the URL",
      },
      {
        id: "quiet-patch",
        label: "Patch the check quietly and keep rolling out",
        minutes: 10,
        grade: "reasonable",
        effects: { stability: 4, confidence: -4, userImpact: 20 },
        resolvesRisks: ["idor"],
        feedback:
          "The hole is closed from now on, but nobody knows whose data was exposed. A security incident needs an audit trail, not just a patch.",
        log: "Auth check patched",
      },
    ],
  },
  {
    id: "fu-key-abuse",
    stage: "follow-up",
    title: "Refunds are coming from an unknown IP",
    summary:
      "Someone found the payments key in the client bundle. Your provider flagged 14 refunds in the last hour from an address you don't recognize.",
    severity: "sev1",
    category: "Security",
    concept: "fu-key-abuse",
    tags: [],
    log: "Payments alert: unauthorized refunds with key …9f2c",
    evidence: {
      kind: "log",
      title: "payments · audit log",
      lines: [
        "POST /v1/refunds  key …9f2c  ip 185.•••.12",
        "POST /v1/refunds  key …9f2c  ip 185.•••.12",
        "",
        "14 refunds · $2,380 · last 60 min",
      ],
    },
    choices: [
      {
        id: "revoke-and-move",
        label: "Revoke the key, move payments server-side, dispute the refunds",
        minutes: 24,
        grade: "strong",
        effects: { stability: 6, confidence: 8, userImpact: 12 },
        resolvesRisks: ["leaked-key"],
        practice: "secrets",
        feedback:
          "Revoking stops the abuse immediately, and the server route stops it from happening again. The provider's audit log backs up the disputes.",
        log: "Key …9f2c revoked · refunds disputed",
      },
      {
        id: "block-ip",
        label: "Block the IP address",
        minutes: 4,
        grade: "risky",
        effects: { confidence: -8, userImpact: 10 },
        feedback: "The next refund comes from a different IP. The key is the problem, not the address.",
        log: "IP 185.•••.12 blocked",
      },
      {
        id: "rotate-in-place",
        label: "Rotate the key and put the new one in the same variable",
        minutes: 6,
        grade: "risky",
        effects: { confidence: -10, userImpact: 8 },
        feedback: "The new key ships in the same public bundle. You've just restarted the clock.",
        log: "Key rotated (still client-side)",
      },
    ],
  },
  {
    id: "fu-open-reports",
    stage: "follow-up",
    title: "Reports are being downloaded without a session",
    summary:
      "The auth bypass from staging made it to production. Clients with no session are pulling other organizations' reports.",
    severity: "sev1",
    category: "Security",
    concept: "fu-open-reports",
    tags: [],
    log: "Prod: unauthenticated traffic on /api/reports",
    evidence: {
      kind: "log",
      title: "prod · api",
      lines: [
        "GET /api/reports?org=118  200  (no session)",
        "GET /api/reports?org=119  200  (no session)",
        "GET /api/reports?org=120  200  (no session)",
        "",
        "2,914 requests · 41 orgs · last 30 min",
      ],
    },
    choices: [
      {
        id: "restore-auth",
        label: "Restore auth, fix the cookie domain, and audit the access",
        minutes: 18,
        grade: "strong",
        effects: { stability: 8, confidence: 8, userImpact: 14 },
        resolvesRisks: ["open-reports"],
        practice: "disclose",
        feedback:
          "Reports are private again, the original 401 is fixed properly this time, and the audit tells you which organizations need to hear from you.",
        log: "Auth restored · 41 orgs identified",
      },
      {
        id: "rate-limit",
        label: "Rate-limit the endpoint",
        minutes: 6,
        grade: "risky",
        effects: { confidence: -6, userImpact: 10 },
        feedback: "Slower scraping is still scraping. The endpoint needs authentication, not a speed limit.",
        log: "Rate limit on /api/reports",
      },
      {
        id: "reenable-auth",
        label: "Re-enable auth and move on",
        minutes: 6,
        grade: "reasonable",
        effects: { stability: -4, confidence: -2, userImpact: 20 },
        resolvesRisks: ["open-reports"],
        feedback:
          "The data is safe again, and the staging 401 is now a production 401. Nobody knows yet which reports were downloaded.",
        log: "Auth re-enabled · 401s in production",
      },
    ],
  },
  {
    id: "fu-exposed-files",
    stage: "follow-up",
    title: "Private photos are readable by anyone",
    summary:
      "A security researcher emailed: they can download any user's photos without being that user. The storage shortcut from staging is live.",
    severity: "sev1",
    category: "Security",
    concept: "fu-exposed-files",
    tags: [],
    log: "Security report: user photos readable by non-owners",
    evidence: {
      kind: "log",
      title: "prod · storage",
      lines: [
        "GET /storage/avatars/u_1043/photo.jpg  200",
        "GET /storage/avatars/u_1044/photo.jpg  200",
        "requester: not the owner",
      ],
    },
    choices: [
      {
        id: "lock-down",
        label: "Lock storage down, rotate keys, and notify affected users",
        minutes: 24,
        grade: "strong",
        effects: { stability: 6, confidence: 8, userImpact: 14 },
        resolvesRisks: ["public-files", "service-key"],
        practice: "disclose",
        feedback:
          "Owner-only access is back, any exposed keys are dead, and the policy is enforced instead of bypassed. Telling users what happened is part of the fix.",
        log: "Storage locked down · users notified",
      },
      {
        id: "random-names",
        label: "Switch to random, unguessable file names",
        minutes: 12,
        grade: "risky",
        effects: { confidence: -6, userImpact: 10 },
        feedback: "Harder to guess isn't private. Anyone with a link, or the key, still gets the file.",
        log: "File names randomized",
      },
      {
        id: "next-sprint",
        label: "Thank the researcher and schedule a fix next sprint",
        minutes: 2,
        grade: "risky",
        effects: { confidence: -10, userImpact: 16 },
        feedback:
          "The researcher found it in an afternoon, and so can anyone else. The photos stay readable until the fix ships.",
        log: "Fix scheduled for next sprint",
      },
    ],
  },
]);
