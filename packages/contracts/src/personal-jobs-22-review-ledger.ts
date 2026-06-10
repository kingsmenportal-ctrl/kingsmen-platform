export const PERSONAL_JOBS_22_MODULE = {
  moduleId: "PERSONAL-JOBS-22",
  title: "Human Review Selector / Proof Capture / Outcome Ledger Handoff",
  route: "/personal-job-desk/review-ledger",
  apiRoute: "/api/personal-jobs/review-ledger",
  agentScript: "scripts/agents/personal-job-review-ledger.mjs",
  input: "data/personal-job-desk/application-packs.local.json",
  output: "data/personal-job-desk/application-review-ledger.local.json",
  consumesOnly: "PJ21 application packs",
  produces: [
    "review queue",
    "candidate approval flags",
    "founder/operator review flags",
    "manual application readiness state",
    "submission proof ledger",
    "outcome ledger handoff"
  ],
  boundaries: {
    productionReady: false,
    deployedToOracle: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    manualSubmissionOnlyAfterApproval: true
  }
} as const;