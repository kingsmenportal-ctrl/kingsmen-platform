export const PERSONAL_JOBS_24_MODULE = {
  moduleId: "PERSONAL-JOBS-24",
  title: "Candidate Application Tracker / Proof-Backed Progress View",
  route: "/personal-job-desk/application-tracker",
  apiRoute: "/api/personal-jobs/application-tracker",
  agentScript: "scripts/agents/personal-job-application-tracker.mjs",
  input: "data/personal-job-desk/manual-submission-workbench.local.json",
  output: "data/personal-job-desk/application-tracker.local.json",
  consumesOnly: "PJ23 manual submission workbench records",
  produces: [
    "candidate-safe application statuses",
    "proof-backed progress steps",
    "timeline summary",
    "candidate note capture",
    "outcome visibility"
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
    candidateVisibleOnly: true
  }
} as const;