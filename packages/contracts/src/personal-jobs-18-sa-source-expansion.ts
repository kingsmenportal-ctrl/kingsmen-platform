export const PERSONAL_JOBS_18_MODULE = {
  moduleId: "PERSONAL-JOBS-18",
  title: "South African Job Source Expansion / Real Local Lead Adapters",
  route: "/personal-job-desk/sa-sources",
  apiRoute: "/api/personal-jobs/sa-sources/run",
  agentScript: "scripts/agents/personal-job-sa-source-runner.mjs",
  readsOneProfile: "data/personal-job-desk/personal-candidate.local.json",
  readsSaSourceRegistry: "data/personal-job-desk/sa-job-sources.local.json",
  writesSaDiscoveredJobs: "data/personal-job-desk/sa-discovered-jobs.local.json",
  writesSaSourceRuns: "data/personal-job-desk/sa-source-runs.local.json",
  sourceRegistryExample: "data/personal-job-desk/sa-job-sources.local.example.json",
  browserLocalStorageKeys: {
    pj18SaLeads: "kingsmen.personalJobs18.saDiscoveredLeads.v1",
    pj02CompatibleLeads: "kingsmen.personalJobs02.externalLeads.v1"
  },
  capabilities: {
    countryFocusSouthAfrica: true,
    publicSectorDpsaLandingAdapter: true,
    publicCareersPageAdapter: true,
    searchLandingAdapter: true,
    retailCareerSources: true,
    companyCareerSources: true,
    profileGeneratedQueries: true,
    exportsToPj02Shape: true,
    combinesWithPj17Leads: true
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

export type PersonalJobs18Module = typeof PERSONAL_JOBS_18_MODULE;