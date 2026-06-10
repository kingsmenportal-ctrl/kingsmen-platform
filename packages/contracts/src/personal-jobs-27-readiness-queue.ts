export const PERSONAL_JOBS_27_MODULE = {
  moduleId: "PERSONAL-JOBS-27",
  title: "Application Readiness Governor / Priority Queue for Manual Execution",
  route: "/personal-job-desk/readiness-queue",
  apiRoute: "/api/personal-jobs/readiness-queue",
  agentScript: "scripts/agents/personal-job-readiness-queue.mjs",
  input: "data/personal-job-desk/response-library.local.json",
  output: "data/personal-job-desk/readiness-priority-queue.local.json",
  consumesOnly: "PJ26 response library workflows",
  produces: [
    "readiness queue items",
    "priority scoring",
    "manual action packets",
    "readiness gates",
    "operator assignment fields"
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
    manualActionOnly: true
  }
} as const;