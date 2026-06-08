export const PERSONAL_JOBS_10_ROUTE = "/personal-job-desk/daily-loop" as const;

export const PERSONAL_JOBS_10_READS_LOCAL_STORAGE_KEYS = [
  "kingsmen.personalJobs02.externalLeads.v1",
  "kingsmen.personalJobs03.shortlist.v1",
  "kingsmen.personalJobs04.applyPacks.v1",
  "kingsmen.personalJobs05.submissions.v1",
  "kingsmen.personalJobs06.followUps.v1",
  "kingsmen.personalJobs07.outcomeLedger.v1",
  "kingsmen.personalJobs08.realUseGate.v1"
] as const;

export const PERSONAL_JOBS_10_WRITES_LOCAL_STORAGE_KEY =
  "kingsmen.personalJobs10.dailyOperatingLoop.v1" as const;

export const PERSONAL_JOBS_10_LOCAL_PRIVATE_PROFILE_PATH =
  "data/personal-job-desk/personal-candidate.local.json" as const;

export const PERSONAL_JOBS_10_LINKED_ROUTES = [
  "/personal-job-desk",
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/apply-pack",
  "/personal-job-desk/submissions",
  "/personal-job-desk/follow-up",
  "/personal-job-desk/outcomes",
  "/personal-job-desk/real-use-gate"
] as const;

export const PERSONAL_JOBS_10_BOUNDARY = {
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

export type PersonalJobs10Urgency = "CROWN" | "HIGH" | "STEADY" | "WATCH";

export type PersonalJobs10DailyTargets = {
  leadTarget: number;
  applyPackTarget: number;
  submissionTarget: number;
  followUpTarget: number;
};

export type PersonalJobs10DailyCommand = {
  id: string;
  rank: number;
  title: string;
  reason: string;
  route: string;
  urgency: PersonalJobs10Urgency;
  proofRequired: boolean;
};