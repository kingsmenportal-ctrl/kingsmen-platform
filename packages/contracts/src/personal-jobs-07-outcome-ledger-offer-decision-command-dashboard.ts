export const PERSONAL_JOBS_07_ROUTE = "/personal-job-desk/outcomes" as const;

export const PERSONAL_JOBS_07_READS_LOCAL_STORAGE_KEYS = [
  "kingsmen.personalJobs02.externalLeads.v1",
  "kingsmen.personalJobs03.shortlist.v1",
  "kingsmen.personalJobs04.applyPacks.v1",
  "kingsmen.personalJobs05.submissions.v1",
  "kingsmen.personalJobs06.followUps.v1"
] as const;

export const PERSONAL_JOBS_07_WRITES_LOCAL_STORAGE_KEY =
  "kingsmen.personalJobs07.outcomeLedger.v1" as const;

export const PERSONAL_JOBS_07_LOCAL_PRIVATE_PROFILE_PATH =
  "data/personal-job-desk/personal-candidate.local.json" as const;

export const PERSONAL_JOBS_07_BOUNDARY = {
  localOnly: true,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false
} as const;

export const PERSONAL_JOBS_07_OUTCOME_STATUSES = [
  "STILL_SEARCHING",
  "WAITING_RESPONSE",
  "INTERVIEW_ACTIVE",
  "OFFER_RECEIVED",
  "OFFER_ACCEPTED",
  "OFFER_DECLINED",
  "UNSUCCESSFUL",
  "CLOSED_NO_RESPONSE",
  "HIRED"
] as const;

export const PERSONAL_JOBS_07_OFFER_DECISIONS = [
  "NO_OFFER_YET",
  "TAKE_NOW",
  "NEGOTIATE",
  "WAIT_FOR_BETTER",
  "DECLINE_RISK",
  "NEEDS_INFORMATION"
] as const;

export type PersonalJobs07OutcomeStatus =
  (typeof PERSONAL_JOBS_07_OUTCOME_STATUSES)[number];

export type PersonalJobs07OfferDecision =
  (typeof PERSONAL_JOBS_07_OFFER_DECISIONS)[number];

export type PersonalJobs07OutcomeRecord = {
  id: string;
  sourceId: string;
  opportunityTitle: string;
  companyName: string;
  status: PersonalJobs07OutcomeStatus;
  offerDecision: PersonalJobs07OfferDecision;
  salaryText: string;
  startDate: string;
  proofReference: string;
  riskNotes: string;
  finalDecision: string;
  nextAction: string;
  updatedAt: string;
};