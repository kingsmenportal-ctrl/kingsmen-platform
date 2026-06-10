export const PERSONAL_JOBS_30_MODULE = {
  moduleId: "PERSONAL-JOBS-30",
  title: "Status Advancement Writer / Audit Mirror",
  route: "/personal-job-desk/status-advancement",
  apiRoute: "/api/personal-jobs/status-advancement",
  agentScript: "scripts/agents/personal-job-status-advancement.mjs",
  input: "data/personal-job-desk/proof-review-board.local.json",
  output: "data/personal-job-desk/status-advancement-audit.local.json",
  consumesOnly: "PJ29 proof review board items",
  produces: [
    "status advancement audit records",
    "proof-backed target status mirror",
    "candidate-facing status message drafts",
    "manual-send proof fields",
    "audit mirror controls"
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
    autoMutatesApplicationTracker: false,
    autoMutatesProofBoard: false,
    writesAuditMirrorOnly: true
  }
} as const;