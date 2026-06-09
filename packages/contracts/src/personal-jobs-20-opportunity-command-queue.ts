export const PERSONAL_JOBS_20_MODULE = {
  moduleId: "PERSONAL-JOBS-20",
  title: "Unified Opportunity Command Queue / Apply Readiness Selector",
  route: "/personal-job-desk/opportunity-queue",
  apiRoute: "/api/personal-jobs/opportunity-queue/build",
  agentScript: "scripts/agents/personal-job-opportunity-command-queue.mjs",
  readsOneProfile: "data/personal-job-desk/personal-candidate.local.json",
  readsPj17Leads: "data/personal-job-desk/discovered-jobs.local.json",
  readsPj18Leads: "data/personal-job-desk/sa-discovered-jobs.local.json",
  readsPj19Leads: "data/personal-job-desk/playwright-source-scout-results.local.json",
  readsPj19SourceHealth: "data/personal-job-desk/sa-source-health.local.json",
  writesOpportunityQueue: "data/personal-job-desk/opportunity-command-queue.local.json",
  writesLatestReport: "reports/personal-jobs/personal-jobs-20-opportunity-command-queue-latest.json",
  browserLocalStorageKeys: {
    queue: "kingsmen.personalJobs20.opportunityCommandQueue.v1",
    selectedForApplyPack: "kingsmen.personalJobs20.selectedForApplyPack.v1",
    applyPackCandidates: "kingsmen.personalJobs04.applyPackCandidates.v1"
  },
  readinessStates: [
    "READY_FOR_APPLY_PACK",
    "REVIEWABLE_SA_ROUTE",
    "WATCHLIST",
    "NEEDS_MANUAL_SOURCE_REVIEW",
    "LOW_PRIORITY_REJECT_CANDIDATE"
  ],
  capabilities: {
    combinesPj17Pj18Pj19Leads: true,
    deduplicatesOpportunities: true,
    ranksReadiness: true,
    classifiesApplyReadiness: true,
    usesSourceHealth: true,
    selectsApplyPackCandidates: true,
    exportsToApplyPackCandidateKey: true
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

export type PersonalJobs20Module = typeof PERSONAL_JOBS_20_MODULE;