export const PERSONAL_JOBS_08_ROUTE = "/personal-job-desk/real-use-gate" as const;

export const PERSONAL_JOBS_08_NAVIGATION_ROUTES = [
  "/personal-job-desk",
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/apply-pack",
  "/personal-job-desk/submissions",
  "/personal-job-desk/follow-up",
  "/personal-job-desk/outcomes"
] as const;

export const PERSONAL_JOBS_08_READS_LOCAL_STORAGE_KEYS = [
  "kingsmen.personalJobs02.externalLeads.v1",
  "kingsmen.personalJobs03.shortlist.v1",
  "kingsmen.personalJobs04.applyPacks.v1",
  "kingsmen.personalJobs05.submissions.v1",
  "kingsmen.personalJobs06.followUps.v1",
  "kingsmen.personalJobs07.outcomeLedger.v1"
] as const;

export const PERSONAL_JOBS_08_WRITES_LOCAL_STORAGE_KEY =
  "kingsmen.personalJobs08.realUseGate.v1" as const;

export const PERSONAL_JOBS_08_LOCAL_PRIVATE_PROFILE_PATH =
  "data/personal-job-desk/personal-candidate.local.json" as const;

export const PERSONAL_JOBS_08_BOUNDARY = {
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

export type PersonalJobs08Route = (typeof PERSONAL_JOBS_08_NAVIGATION_ROUTES)[number];

export type PersonalJobs08GateRouteResult = {
  module: string;
  route: PersonalJobs08Route;
  openedByUser: boolean;
  dataFound: boolean;
  note: string;
};

export type PersonalJobs08GateResult = {
  schema: "kingsmen.personal-jobs-08-real-use-gate.v1";
  generatedAt: string;
  localOnly: true;
  noSendBoundary: true;
  testedRoutes: PersonalJobs08GateRouteResult[];
  commands: string[];
  readyForRealUse: boolean;
};