import fs from "node:fs";

export function loadKingsmenConstitution(path = "manifests/constitution/n00-constitution-doctrine-lock.json") {
  const raw = fs.readFileSync(path, "utf8");
  const constitution = JSON.parse(raw);

  assertKingsmenConstitution(constitution);
  return constitution;
}

export function assertKingsmenConstitution(constitution: any) {
  const requiredTrue = [
    "oracleLiteDefault",
    "postgresBackendAuthority",
    "proofDisciplineRequired",
    "allSixGatesVisibleToAllUsers",
    "packageControlsIntensityNotGateAccess",
    "caoParentChildRule",
    "submittedRequiresProof",
    "outcomeRequiresProof",
    "emailFirst",
    "whatsappUrgentOnly",
    "smsBackupOnly",
    "playwrightProbeOnly",
    "mapFallbackRequiredOnPortalBlocker",
    "sourceConfidenceRequiredForOfficialInstructions",
    "candidatePartnerSharingRequiresConsent",
    "aiMaySuggestNotGovern",
    "capLimitsVolumeNotCapability",
    "founderApprovalRequiredForHighRiskActions"
  ];

  for (const key of requiredTrue) {
    if (constitution[key] !== true) {
      throw new Error(`Kingsmen constitution failed: ${key} must be true`);
    }
  }

  if (constitution.productionReady !== false) {
    throw new Error("N00 cannot claim productionReady=true");
  }

  if (constitution.captchaOtpBypassAllowed !== false) {
    throw new Error("CAPTCHA/OTP bypass must be false");
  }

  if (constitution.activeCandidateStartingCap !== 500) {
    throw new Error("Starting active candidate cap must be 500");
  }

  return true;
}