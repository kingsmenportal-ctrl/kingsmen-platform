export const N04_OFFICIAL_PACKAGE_PRICES = {
  FOUNDATIONAL_ACCORD: { name: "Foundational Accord", amountCents: 16999, displayPrice: "R169.99" },
  COLLEGIATE_ORDINANCE: { name: "Collegiate Ordinance", amountCents: 29999, displayPrice: "R299.99" },
  CHANCELLORS_WRIT: { name: "Chancellor's Writ", amountCents: 39999, displayPrice: "R399.99" },
  REGENCY_MANDATE: { name: "Regency Mandate", amountCents: 46999, displayPrice: "R469.99" },
  ARTISAN_CHARTER: { name: "Artisan Charter", amountCents: 14999, displayPrice: "R149.99" },
  GUILDMASTERS_CHARTER: { name: "Guildmaster's Charter", amountCents: 19999, displayPrice: "R199.99" },
  CV_REVAMP: { name: "CV Revamp", amountCents: 4999, displayPrice: "R49.99" }
} as const;

export function assertN04ServiceOrderSafe(input: {
  packageCode: keyof typeof N04_OFFICIAL_PACKAGE_PRICES;
  candidateAction?: string;
  auditId?: string;
}) {
  if (!input.auditId) {
    throw new Error("N04 service order requires auditId");
  }

  if (!N04_OFFICIAL_PACKAGE_PRICES[input.packageCode]) {
    throw new Error(`N04 service order blocked: unknown package code ${input.packageCode}`);
  }

  if (input.candidateAction === "mark_paid") {
    throw new Error("N04 service order blocked: candidate cannot mark paid");
  }

  return true;
}

export function getN04CvRevampUpgradeBonus(input: { paidCvRevampBeforeUpgrade: boolean }) {
  return {
    cvRevampUpgradeBonusPreserved: true,
    additionalManagedApplicationsOnUpgrade: input.paidCvRevampBeforeUpgrade ? 2 : 0
  } as const;
}