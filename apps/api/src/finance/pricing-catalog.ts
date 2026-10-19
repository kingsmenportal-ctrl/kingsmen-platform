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