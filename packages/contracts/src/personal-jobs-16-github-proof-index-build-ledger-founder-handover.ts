export const PERSONAL_JOBS_16_MODULE = {
  moduleId: "PERSONAL-JOBS-16",
  title: "GitHub Proof Index / Build Ledger / Founder Handover",
  route: "/personal-job-desk/proof-index",
  localUiOnly: true,
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
  contactsEmployers: false,
  writesLocalStorageKeys: [
    "kingsmen.personalJobs16.githubProofIndex.v1",
    "kingsmen.personalJobs16.founderHandover.v1"
  ],
  requiredDependencyModules: [
    "PERSONAL-JOBS-01",
    "PERSONAL-JOBS-02",
    "PERSONAL-JOBS-03",
    "PERSONAL-JOBS-04",
    "PERSONAL-JOBS-06",
    "PERSONAL-JOBS-07",
    "PERSONAL-JOBS-08",
    "PERSONAL-JOBS-10",
    "PERSONAL-JOBS-11",
    "PERSONAL-JOBS-12",
    "PERSONAL-JOBS-13",
    "PERSONAL-JOBS-14",
    "PERSONAL-JOBS-15"
  ],
  indexedRoutes: [
    "/personal-job-desk",
    "/personal-job-desk/opportunities",
    "/personal-job-desk/shortlist",
    "/personal-job-desk/apply-pack",
    "/personal-job-desk/follow-up",
    "/personal-job-desk/outcomes",
    "/personal-job-desk/real-use-gate",
    "/personal-job-desk/daily-loop",
    "/personal-job-desk/import-search",
    "/personal-job-desk/source-runner",
    "/personal-job-desk/import-normalizer",
    "/personal-job-desk/navigation",
    "/personal-job-desk/runtime-click-test",
    "/personal-job-desk/proof-index"
  ]
} as const;

export type PersonalJobs16Module = typeof PERSONAL_JOBS_16_MODULE;

export type PersonalJobs16FounderHandover = {
  reviewedAt: string;
  reviewedBy: string;
  commitReference: string;
  note: string;
};