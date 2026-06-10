export const PERSONAL_JOBS_23_MODULE = {
  moduleId: "PERSONAL-JOBS-23",
  title: "Manual Submission Execution Checklist / Follow-Up Calendar / Outcome Reporting",
  route: "/personal-job-desk/manual-submission-workbench",
  apiRoute: "/api/personal-jobs/manual-submission-workbench",
  agentScript: "scripts/agents/personal-job-manual-submission-workbench.mjs",
  input: "data/personal-job-desk/application-review-ledger.local.json",
  output: "data/personal-job-desk/manual-submission-workbench.local.json",
  consumesOnly: "PJ22 review ledger records",
  produces: [
    "manual submission checklist",
    "manual execution status",
    "proof capture state",
    "follow-up date",
    "outcome reporting"
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
    manualExecutionOnly: true
  }
} as const;