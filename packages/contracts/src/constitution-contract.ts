export type KingsmenGate =
  | "higher_education"
  | "tvet"
  | "seta_learnership"
  | "internship"
  | "apprenticeship"
  | "employment";

export type KingsmenConstitution = {
  schema: "kingsmen.constitution.n00.v1";
  module: "N00 - Constitution / Doctrine Lock";
  productionReady: false;
  oracleLiteDefault: true;
  postgresBackendAuthority: true;
  proofDisciplineRequired: true;
  allSixGatesVisibleToAllUsers: true;
  packageControlsIntensityNotGateAccess: true;
  caoParentChildRule: true;
  submittedRequiresProof: true;
  outcomeRequiresProof: true;
  emailFirst: true;
  whatsappUrgentOnly: true;
  smsBackupOnly: true;
  playwrightProbeOnly: true;
  captchaOtpBypassAllowed: false;
  mapFallbackRequiredOnPortalBlocker: true;
  sourceConfidenceRequiredForOfficialInstructions: true;
  candidatePartnerSharingRequiresConsent: true;
  aiMaySuggestNotGovern: true;
  activeCandidateStartingCap: 500;
  capLimitsVolumeNotCapability: true;
  founderApprovalRequiredForHighRiskActions: true;
};