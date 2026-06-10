export const PERSONAL_JOBS_20B_MODULE = {
  moduleId: "PERSONAL-JOBS-20B",
  title: "Opportunity Quality Gate / Specific Vacancy Filter / Search Landing Demotion",
  route: "/personal-job-desk/opportunity-quality-gate",
  apiRoute: "/api/personal-jobs/opportunity-quality-gate/build",
  agentScript: "scripts/agents/personal-job-opportunity-quality-gate.mjs",
  input: "data/personal-job-desk/opportunity-command-queue.local.json",
  output: "data/personal-job-desk/opportunity-quality-gate.local.json",
  states: [
    "READY_FOR_APPLY_PACK",
    "REVIEWABLE_SOURCE_PAGE",
    "GOV_SOURCE_DOCUMENT",
    "MANUAL_SOURCE_REVIEW",
    "LOW_PRIORITY_REJECT_CANDIDATE",
    "EXPIRED_OR_DEAD_LEAD"
  ],
  boundaries: {
    productionReady: false,
    deployedToOracle: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOrCaptcha: false
  }
} as const;