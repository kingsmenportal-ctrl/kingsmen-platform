export const PERSONAL_JOBS_32_MODULE = {
  moduleId: "PERSONAL-JOBS-32",
  title: "Candidate-Safe Public Job Desk Snapshot / Exportable Progress Report",
  route: "/personal-job-desk/public-snapshot",
  apiRoute: "/api/personal-jobs/public-snapshot",
  agentScript: "scripts/agents/personal-job-public-snapshot.mjs",
  input: "data/personal-job-desk/status-timeline.local.json",
  output: "data/personal-job-desk/public-snapshot.local.json",
  consumesOnly: "PJ31 status timeline items",
  produces: [
    "candidate-safe snapshot items",
    "redacted evidence summaries",
    "exportable markdown progress report",
    "public-safe progress dashboard",
    "candidate-safe visibility rules"
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
    exposesSensitiveProof: false,
    readOnlyDashboard: true
  }
} as const;