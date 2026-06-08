export const PERSONAL_JOBS_11_ROUTE = "/personal-job-desk/import-search" as const;

export const PERSONAL_JOBS_11_IMPORT_HISTORY_KEY =
  "kingsmen.personalJobs11.searchImportBatches.v1" as const;

export const PERSONAL_JOBS_11_PUSH_TARGET_KEY =
  "kingsmen.personalJobs02.externalLeads.v1" as const;

export const PERSONAL_JOBS_11_LOCAL_PRIVATE_PROFILE_PATH =
  "data/personal-job-desk/personal-candidate.local.json" as const;

export const PERSONAL_JOBS_11_LINKED_ROUTES = [
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/daily-loop"
] as const;

export const PERSONAL_JOBS_11_BOUNDARY = {
  localOnly: true,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  searchesInternet: false,
  scrapesWebsites: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false
} as const;

export type PersonalJobs11WorkMode = "remote" | "hybrid" | "onsite" | "unknown";
export type PersonalJobs11Confidence = "high" | "medium" | "low";
export type PersonalJobs11DuplicateRisk = "new" | "possible_duplicate";

export type PersonalJobs11ImportedLead = {
  id: string;
  importedAt: string;
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  sourceName: string;
  rawText: string;
  salaryHint: string;
  deadlineHint: string;
  workMode: PersonalJobs11WorkMode;
  confidence: PersonalJobs11Confidence;
  duplicateRisk: PersonalJobs11DuplicateRisk;
  verificationStatus: "unverified_import";
  nextAction: string;
};