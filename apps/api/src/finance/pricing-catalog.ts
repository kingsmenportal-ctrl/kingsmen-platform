import type { FinancePlan, FinancePlanCode } from "./finance-types";

export const KINGSMEN_PRICING_CATALOG: readonly FinancePlan[] = [
  {
    planCode: "FREE_DESTINY_MAP_R0",
    planName: "Free Destiny Map",
    description: "All-sector preview only. Exact targets, application links, and manual route plans stay sealed until package activation.",
    amountCents: 0,
    currency: "ZAR",
    managedApplicationCount: 0,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Free route preview only; no managed applications."
  },
  {
    planCode: "CV_REVAMP_R49_99",
    planName: "CV Revamp",
    description: "15 personalised truthful CV versions and 15 matching motivation letters.",
    amountCents: 4999,
    currency: "ZAR",
    managedApplicationCount: 0,
    accommodationRouteCount: 0,
    cvVersions: 15,
    motivationLetters: 15,
    doctrineNotes: "Never invent fake experience, qualifications, references, certificates, skills, or results."
  },
  {
    planCode: "ARTISAN_CHARTER_R149_99",
    planName: "Artisan Charter",
    description: "Focused managed-service support for technical and trade pathways.",
    amountCents: 14999,
    currency: "ZAR",
    managedApplicationCount: 3,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Three concurrent managed routes; entitlements activate only after verified payment."
  },
  {
    planCode: "FOUNDATIONAL_ACCORD_R169_99",
    planName: "Foundational Accord",
    description: "Structured application support with eight accommodation routes included.",
    amountCents: 16999,
    currency: "ZAR",
    managedApplicationCount: 4,
    accommodationRouteCount: 8,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Four concurrent managed routes and eight accommodation routes; entitlements activate only after verified payment."
  },
  {
    planCode: "GUILDMASTERS_CHARTER_R199_99",
    planName: "Guildmasters Charter",
    description: "Expanded managed-route capacity for candidates coordinating several applications.",
    amountCents: 19999,
    currency: "ZAR",
    managedApplicationCount: 5,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Five concurrent managed routes; entitlements activate only after verified payment."
  },
  {
    planCode: "COLLEGIATE_ORDINANCE_R299_99",
    planName: "Collegiate Ordinance",
    description: "Expanded support for candidates pursuing multiple education routes.",
    amountCents: 29999,
    currency: "ZAR",
    managedApplicationCount: 8,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Eight concurrent managed routes; entitlements activate only after verified payment."
  },
  {
    planCode: "CHANCELLORS_WRIT_R399_99",
    planName: "Chancellor's Writ",
    description: "Higher-volume application support and managed-route capacity.",
    amountCents: 39999,
    currency: "ZAR",
    managedApplicationCount: 10,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Ten concurrent managed routes; entitlements activate only after verified payment."
  },
  {
    planCode: "REGENCY_MANDATE_R469_99",
    planName: "Regency Mandate",
    description: "Highest standard managed-route capacity for candidates coordinating many routes.",
    amountCents: 46999,
    currency: "ZAR",
    managedApplicationCount: 12,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Twelve concurrent managed routes; entitlements activate only after verified payment."
  }
] as const;

export function getFinancePlan(planCode: FinancePlanCode): FinancePlan {
  const plan = KINGSMEN_PRICING_CATALOG.find((item) => item.planCode === planCode);
  if (!plan) throw new Error(`Unknown finance plan: ${planCode}`);
  return plan;
}

export function assertCvRevampTruthBoundary(planCode: FinancePlanCode): void {
  if (planCode === "CV_REVAMP_R49_99") {
    const plan = getFinancePlan(planCode);
    if (!plan.doctrineNotes.includes("Never invent fake")) {
      throw new Error("CV Revamp truth boundary is missing.");
    }
  }
}