export const PERSONAL_JOBS_15_ROUTE = "/personal-job-desk/runtime-click-test" as const;

export const PERSONAL_JOBS_15_RUNTIME_TARGETS = [
  "/personal-job-desk",
  "/personal-job-desk/opportunities",
  "/personal-job-desk/shortlist",
  "/personal-job-desk/apply-pack",
  "/personal-job-desk/submissions",
  "/personal-job-desk/follow-up",
  "/personal-job-desk/outcomes",
  "/personal-job-desk/real-use-gate",
  "/personal-job-desk/daily-loop",
  "/personal-job-desk/import-search",
  "/personal-job-desk/source-runner",
  "/personal-job-desk/normalizer",
  "/personal-job-desk/navigation",
  "/personal-job-desk/runtime-click-test"
] as const;

export const PERSONAL_JOBS_15_LOCAL_STORAGE_KEYS = [
  "kingsmen.personalJobs15.runtimeClickTestVisits.v1",
  "kingsmen.personalJobs15.manualClickChecklist.v1"
] as const;

export const PERSONAL_JOBS_15_BOUNDARY = {
  localOnly: true,
  productionReady: false,
  canClaimProduction: false,
  deployedToOracle: false,
  startsDocker: false,
  startsNextDev: false,
  requiresRunningLocalNextServer: true,
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