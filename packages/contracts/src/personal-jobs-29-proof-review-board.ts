export const PERSONAL_JOBS_29_MODULE = {
  moduleId: "PERSONAL-JOBS-29",
  title: "Proof Review Board / Status Advancement Control",
  route: "/personal-job-desk/proof-review-board",
  apiRoute: "/api/personal-jobs/proof-review-board",
  agentScript: "scripts/agents/personal-job-proof-review-board.mjs",
  input: "data/personal-job-desk/daily-worklist.local.json",
  output: "data/personal-job-desk/proof-review-board.local.json",
  consumesOnly: "PJ28 daily worklist items",
  produces: [
    "proof review items",
    "founder/operator decision fields",
    "status advancement controls",
    "candidate-safe proof visibility rules",
    "audit rules"
  ],
  boundaries: {
    productionReady: false,
    deployedToOracle: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    sendsSms: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    autoMutatesTracker: false,
    autoMutatesWorklist: false,
    manualActionOnly: true
  }
} as const;