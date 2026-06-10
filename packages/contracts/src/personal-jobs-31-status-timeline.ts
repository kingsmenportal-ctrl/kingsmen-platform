export const PERSONAL_JOBS_31_MODULE = {
  moduleId: "PERSONAL-JOBS-31",
  title: "Candidate Status Timeline / Evidence-Readable Dashboard",
  route: "/personal-job-desk/status-timeline",
  apiRoute: "/api/personal-jobs/status-timeline",
  agentScript: "scripts/agents/personal-job-status-timeline.mjs",
  input: "data/personal-job-desk/status-advancement-audit.local.json",
  output: "data/personal-job-desk/status-timeline.local.json",
  consumesOnly: "PJ30 status advancement audit mirror records",
  produces: [
    "candidate status timeline",
    "evidence-readable progress steps",
    "candidate-safe summaries",
    "proof visibility rules",
    "dashboard read model"
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
    readOnlyDashboard: true
  }
} as const;