export const PERSONAL_JOBS_33_MODULE = {
  moduleId: "PERSONAL-JOBS-33",
  title: "Candidate Document Pack Index / Application Evidence Attachment Map",
  route: "/personal-job-desk/document-pack-index",
  apiRoute: "/api/personal-jobs/document-pack-index",
  agentScript: "scripts/agents/personal-job-document-pack-index.mjs",
  input: "data/personal-job-desk/public-snapshot.local.json",
  output: "data/personal-job-desk/document-pack-index.local.json",
  consumesOnly: "PJ32 candidate-safe snapshot items",
  produces: [
    "document pack readiness index",
    "application evidence attachment map",
    "truthful document slots",
    "candidate instructions",
    "exportable document pack index"
  ],
  boundaries: {
    productionReady: false,
    deployedToOracle: false,
    createsDocuments: false,
    fabricatesDocuments: false,
    exposesSensitiveProof: false,
    sendsApplications: false,
    sendsEmail: false,
    sendsWhatsApp: false,
    sendsSms: false,
    touchesPayments: false,
    contactsEmployers: false,
    bypassesLoginOtpCaptcha: false,
    readOnlyIndex: true
  }
} as const;