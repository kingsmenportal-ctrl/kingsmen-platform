export const PERSONAL_JOBS_12_ROUTE = "/personal-job-desk/source-runner" as const;

export const PERSONAL_JOBS_12_SESSION_KEY =
  "kingsmen.personalJobs12.sourceRunnerSessions.v1" as const;

export const PERSONAL_JOBS_12_PUSH_TARGET_KEY =
  "kingsmen.personalJobs02.externalLeads.v1" as const;

export const PERSONAL_JOBS_12_LOCAL_PRIVATE_PROFILE_PATH =
  "data/personal-job-desk/personal-candidate.local.json" as const;

export const PERSONAL_JOBS_12_LINKED_ROUTES = [
  "/personal-job-desk/import-search",
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/daily-loop"
] as const;

export const PERSONAL_JOBS_12_BOUNDARY = {
  localOnly: true,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  usesSecrets: false,
  runsBackgroundBots: false,
  extractsWebsiteContentAutomatically: false,
  autoSubmitsApplications: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false
} as const;

export type PersonalJobs12SourceTrustBand =
  | "KNOWN_PUBLIC_SOURCE"
  | "USER_REVIEW_REQUIRED";

export type PersonalJobs12MissionStatus =
  | "READY"
  | "OPENED"
  | "REVIEWED"
  | "CAPTURED";

export type PersonalJobs12SourceMission = {
  id: string;
  sourceId: string;
  sourceName: string;
  url: string;
  searchText: string;
  locationText: string;
  verificationChecklist: string[];
  openedAt?: string;
  status: PersonalJobs12MissionStatus;
};