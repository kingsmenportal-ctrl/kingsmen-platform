export const PERSONAL_JOBS_26_MODULE = {
  moduleId: "PERSONAL-JOBS-26",
  title: "Operator Response Library / Reusable Templates / Manual-Send Proof Workflow",
  route: "/personal-job-desk/response-library",
  apiRoute: "/api/personal-jobs/response-library",
  agentScript: "scripts/agents/personal-job-response-library.mjs",
  input: "data/personal-job-desk/follow-up-inbox.local.json",
  output: "data/personal-job-desk/response-library.local.json",
  consumesOnly: "PJ25 follow-up inbox threads",
  produces: [
    "safe response templates",
    "thread response workflows",
    "operator draft/final response fields",
    "manual-send approval fields",
    "manual-send proof capture"
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
    manualSendOnly: true
  }
} as const;