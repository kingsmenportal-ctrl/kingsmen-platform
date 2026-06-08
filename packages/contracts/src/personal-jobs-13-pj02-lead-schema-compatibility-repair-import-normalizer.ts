export const PERSONAL_JOBS_13_ROUTE = "/personal-job-desk/normalizer" as const;

export const PERSONAL_JOBS_13_PJ02_TARGET_KEY =
  "kingsmen.personalJobs02.externalLeads.v1" as const;

export const PERSONAL_JOBS_13_BACKUP_KEY =
  "kingsmen.personalJobs13.normalizerBackups.v1" as const;

export const PERSONAL_JOBS_13_REPORT_KEY =
  "kingsmen.personalJobs13.normalizerReports.v1" as const;

export const PERSONAL_JOBS_13_EXACT_PJ02_FIELDS = [
  "id",
  "createdAt",
  "updatedAt",
  "company",
  "roleTitle",
  "opportunityLink",
  "sourceType",
  "location",
  "workMode",
  "deadline",
  "salaryText",
  "requirementsText",
  "fitReason",
  "riskNotes",
  "confidence",
  "status",
  "nextAction",
  "cvSlot",
  "motivationLetterSlot",
  "proofNote"
] as const;

export const PERSONAL_JOBS_13_BOUNDARY = {
  localOnly: true,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  searchesInternet: false,
  opensExternalPages: false,
  scrapesWebsites: false,
  sendsApplications: false,
  sendsEmail: false,
  sendsWhatsApp: false,
  touchesPayments: false,
  touchesExternalCalendar: false,
  contactsEmployers: false
} as const;

export type PersonalJobs13PJ02SourceType =
  | "Indeed"
  | "LinkedIn"
  | "Company Career Page"
  | "Facebook"
  | "WhatsApp Group"
  | "Email"
  | "Referral"
  | "Walk-in"
  | "Other";

export type PersonalJobs13PJ02LeadStatus =
  | "Found"
  | "Reviewed"
  | "Prepared"
  | "Applied"
  | "Follow Up"
  | "Interview"
  | "Rejected"
  | "Offer"
  | "Closed";