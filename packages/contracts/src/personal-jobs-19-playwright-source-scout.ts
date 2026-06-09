export const PERSONAL_JOBS_19_MODULE = {
  moduleId: "PERSONAL-JOBS-19",
  title: "Playwright Source Queue / Employer Career Page Scout / SA Source Health Report",
  route: "/personal-job-desk/source-scout",
  apiRoute: "/api/personal-jobs/source-scout/run",
  agentScript: "scripts/agents/personal-job-playwright-source-scout.mjs",
  readsOneProfile: "data/personal-job-desk/personal-candidate.local.json",
  readsSaSources: "data/personal-job-desk/sa-job-sources.local.json",
  optionalQueueOverride: "data/personal-job-desk/source-scout-queue.local.json",
  writesScoutResults: "data/personal-job-desk/playwright-source-scout-results.local.json",
  writesSourceHealth: "data/personal-job-desk/sa-source-health.local.json",
  writesLatestReport: "reports/personal-jobs/personal-jobs-19-source-scout-latest.json",
  browserLocalStorageKeys: {
    pj19ScoutLeads: "kingsmen.personalJobs19.playwrightScoutLeads.v1",
    pj19SourceHealth: "kingsmen.personalJobs19.sourceHealth.v1",
    pj02CompatibleLeads: "kingsmen.personalJobs02.externalLeads.v1"
  },
  healthStatuses: [
    "HEALTHY_STATIC",
    "HEALTHY_JS_RENDERED",
    "NO_JOB_LINKS_FOUND",
    "BLOCKED_BY_LOGIN",
    "BLOCKED_BY_CAPTCHA",
    "PORTAL_DOWN",
    "TIMEOUT",
    "MANUAL_REVIEW_REQUIRED"
  ],
  capabilities: {
    usesPlaywrightScout: true,
    buildsQueueFromPj18Sources: true,
    supportsLocalQueueOverride: true,
    maxConcurrencyOne: true,
    extractsVisibleJobLinks: true,
    reportsSourceHealth: true,
    exportsToPj02Shape: true,
    combinesWithPj17AndPj18Leads: true,
    countryFocusSouthAfrica: true
  },
  boundaries: {
    productionReady: false,
    deployedToOracle: false,
    startsDocker: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    usesCredentials: false,
    bypassesLoginOrCaptcha: false,
    requiresHumanApprovalBeforeApply: true
  }
} as const;

export type PersonalJobs19Module = typeof PERSONAL_JOBS_19_MODULE;