export const PERSONAL_JOBS_25_MODULE = {
  moduleId: "PERSONAL-JOBS-25",
  title: "Candidate Follow-Up Inbox / Questions / Operator Response Queue",
  route: "/personal-job-desk/follow-up-inbox",
  apiRoute: "/api/personal-jobs/follow-up-inbox",
  agentScript: "scripts/agents/personal-job-follow-up-inbox.mjs",
  input: "data/personal-job-desk/application-tracker.local.json",
  output: "data/personal-job-desk/follow-up-inbox.local.json",
  consumesOnly: "PJ24 application tracker items",
  produces: [
    "candidate question threads",
    "operator response drafts",
    "manual-send approval flags",
    "manual-send proof fields",
    "response safety queue"
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