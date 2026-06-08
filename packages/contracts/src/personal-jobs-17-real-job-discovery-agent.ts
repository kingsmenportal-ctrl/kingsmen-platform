export const PERSONAL_JOBS_17_MODULE = {
  moduleId: "PERSONAL-JOBS-17",
  title: "Real Job Discovery Agent / One-Profile Job Finder / Playwright Source Scout",
  route: "/personal-job-desk/job-finder",
  apiRoute: "/api/personal-jobs/job-finder/run",
  agentScript: "scripts/agents/personal-job-discovery-agent.mjs",
  playwrightScoutScript: "scripts/agents/playwright-job-source-scout.mjs",
  readsOneProfile: "data/personal-job-desk/personal-candidate.local.json",
  readsSourceRegistry: "data/personal-job-desk/job-search-sources.local.json",
  writesDiscoveredJobs: "data/personal-job-desk/discovered-jobs.local.json",
  writesDiscoveryRuns: "data/personal-job-desk/job-discovery-runs.local.json",
  browserLocalStorageKeys: {
    pj17Leads: "kingsmen.personalJobs17.discoveredLeads.v1",
    pj02CompatibleLeads: "kingsmen.personalJobs02.externalLeads.v1"
  },
  capabilities: {
    generatesSearchQueriesFromProfile: true,
    searchesRealSources: true,
    supportsRemoteOkAdapter: true,
    supportsArbeitnowAdapter: true,
    supportsGreenhouseAdapter: true,
    supportsLeverAdapter: true,
    supportsRssAdapter: true,
    supportsOptionalPlaywrightScout: true,
    deduplicatesLeads: true,
    scoresFit: true,
    exportsToPj02Shape: true
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
    bypassesLoginOrCaptcha: false,
    requiresHumanApprovalBeforeApply: true
  }
} as const;

export type PersonalJobs17Module = typeof PERSONAL_JOBS_17_MODULE;