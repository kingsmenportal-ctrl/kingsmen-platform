export const PERSONAL_JOBS_06_ROUTE = "/personal-job-desk/follow-up" as const;

export const PERSONAL_JOBS_06_READS_LOCAL_STORAGE_KEY =
  "kingsmen.personalJobs05.submissions.v1" as const;

export const PERSONAL_JOBS_06_WRITES_LOCAL_STORAGE_KEY =
  "kingsmen.personalJobs06.followUps.v1" as const;

export const PERSONAL_JOBS_06_LOCAL_PRIVATE_PROFILE_PATH =
  "data/personal-job-desk/personal-candidate.local.json" as const;

export const PERSONAL_JOBS_06_BOUNDARY = {
  localOnly: true,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false
} as const;

export const PERSONAL_JOBS_06_STATUSES = [
  "WAITING_RESPONSE",
  "FOLLOW_UP_DUE",
  "RECRUITER_REPLIED",
  "INTERVIEW_INVITED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_PREP_READY",
  "OFFER_RECEIVED",
  "REJECTED",
  "CLOSED_NO_RESPONSE"
] as const;

export type PersonalJobs06Status = (typeof PERSONAL_JOBS_06_STATUSES)[number];

export type PersonalJobs06FollowUpRecord = {
  id: string;
  submissionId: string;
  opportunityTitle: string;
  companyName: string;
  platform?: string;
  status: PersonalJobs06Status;
  followUpDate: string;
  interviewDate?: string;
  recruiterResponse?: string;
  proofReference?: string;
  interviewPrepNotes: string;
  nextAction: string;
  riskFlag: string;
  updatedAt: string;
};