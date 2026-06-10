export const PERSONAL_JOBS_28_MODULE = {
  moduleId: "PERSONAL-JOBS-28",
  title: "Operator Daily Worklist / Founder Action Packet Digest",
  route: "/personal-job-desk/daily-worklist",
  apiRoute: "/api/personal-jobs/daily-worklist",
  agentScript: "scripts/agents/personal-job-daily-worklist.mjs",
  input: "data/personal-job-desk/readiness-priority-queue.local.json",
  output: "data/personal-job-desk/daily-worklist.local.json",
  consumesOnly: "PJ27 readiness priority queue items",
  produces: [
    "daily operator worklist",
    "founder digest",
    "action packets",
    "estimated workload",
    "work progress fields"
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