export const PERSONAL_JOBS_21_MODULE = {
  moduleId: "PERSONAL-JOBS-21",
  title: "One Profile Apply Pack Builder / CV + Motivation Drafts / Manual Submission Packet",
  route: "/personal-job-desk/apply-pack-builder",
  apiRoute: "/api/personal-jobs/apply-pack-builder/build",
  agentScript: "scripts/agents/personal-job-apply-pack-builder.mjs",
  input: "data/personal-job-desk/opportunity-quality-gate.local.json",
  profile: "data/personal-job-desk/one-profile.local.json",
  output: "data/personal-job-desk/application-packs.local.json",
  consumesOnly: "PJ20B readyForApplyPack leads",
  produces: [
    "CV focus points",
    "motivation draft",
    "manual application steps",
    "proof capture checklist",
    "human review boundary"
  ],
  boundaries: {
    productionReady: false,
    deployedToOracle: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOrCaptcha: false
  }
} as const;