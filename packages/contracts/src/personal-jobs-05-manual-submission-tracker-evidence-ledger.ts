export const PERSONAL_JOBS_05_MANUAL_SUBMISSION_TRACKER_EVIDENCE_LEDGER = {
  module: "PERSONAL-JOBS-05 - Manual Application Submission Tracker / Evidence Ledger",
  route: "/personal-job-desk/submissions",
  readsLocalStorageKey: "kingsmen.personalJobs04.applyPacks.v1",
  writesLocalStorageKey: "kingsmen.personalJobs05.submissions.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  noSendBoundary:
    "Manual submission tracker only; no applications, emails, WhatsApps, payment actions, portal submissions, employer contact, or automated sending are performed.",
  statuses: [
    "DRAFT_PACK_READY",
    "MANUALLY_SUBMITTED",
    "PROOF_CAPTURED",
    "FOLLOW_UP_DUE",
    "RESPONSE_RECEIVED",
    "INTERVIEW_STAGE",
    "UNSUCCESSFUL",
    "OFFER_RECEIVED",
    "CLOSED"
  ]
} as const;

export type PersonalJobs05SubmissionStatus =
  (typeof PERSONAL_JOBS_05_MANUAL_SUBMISSION_TRACKER_EVIDENCE_LEDGER.statuses)[number];
