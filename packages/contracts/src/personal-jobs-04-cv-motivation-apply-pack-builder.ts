export const PERSONAL_JOBS_04_CV_MOTIVATION_APPLY_PACK_BUILDER = {
  module: "PERSONAL-JOBS-04 - CV & Motivation Letter Apply Pack Builder",
  route: "/personal-job-desk/apply-pack",
  sourceShortlistStorageKey: "kingsmen.personalJobs03.shortlist.v1",
  applyPackStorageKey: "kingsmen.personalJobs04.applyPacks.v1",
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
  templates: [
    "Executive Classic",
    "ATS Plain",
    "Retail & Service",
    "Administrative Precision",
    "Learnership Entry",
    "General Worker",
    "Digital Support",
    "Hospitality & Care"
  ],
  boundaries: {
    productionReady: false,
    canClaimProduction: false,
    deployedToOracle: false,
    startsDocker: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    touchesPayments: false,
    createsPortalSubmission: false
  },
  truthDoctrine: [
    "Never invent experience",
    "Never invent qualifications",
    "Never invent certificates",
    "Never invent licences",
    "Never invent references",
    "Never invent achievements",
    "Use truthful South African ATS-ready wording"
  ]
} as const;

export type PersonalJobs04Template =
  (typeof PERSONAL_JOBS_04_CV_MOTIVATION_APPLY_PACK_BUILDER.templates)[number];