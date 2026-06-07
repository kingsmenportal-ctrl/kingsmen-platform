export const PERSONAL_JOBS_03_LOCAL_FIT_SCORING_SHORTLIST = {
  module: "PERSONAL-JOBS-03 - Local Fit Scoring / Shortlist Decision Desk",
  route: "/personal-job-desk/shortlist",
  sourceLeadStorageKey: "kingsmen.personalJobs02.externalLeads.v1",
  shortlistStorageKey: "kingsmen.personalJobs03.shortlist.v1",
  localPrivateProfilePath: "data/personal-job-desk/personal-candidate.local.json",
  cvSlots: [
    "CV-01", "CV-02", "CV-03", "CV-04", "CV-05",
    "CV-06", "CV-07", "CV-08", "CV-09", "CV-10",
    "CV-11", "CV-12", "CV-13", "CV-14", "CV-15"
  ],
  motivationLetterSlots: [
    "ML-01", "ML-02", "ML-03", "ML-04", "ML-05",
    "ML-06", "ML-07", "ML-08", "ML-09", "ML-10",
    "ML-11", "ML-12", "ML-13", "ML-14", "ML-15"
  ],
  fitBands: ["CROWN_TARGET", "STRONG_ROUTE", "WATCHLIST", "RESEARCH_FIRST"],
  boundaries: {
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    startsDocker: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false
  }
} as const;

export type PersonalJobs03FitBand =
  (typeof PERSONAL_JOBS_03_LOCAL_FIT_SCORING_SHORTLIST.fitBands)[number];
