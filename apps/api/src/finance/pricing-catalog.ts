import type { FinancePlan, FinancePlanCode } from "./finance-types";
import { KINGSMEN_COMMERCIAL_CATALOGUE, KINGSMEN_FREE_PREVIEW } from "../commercial/commercial-catalogue";

/**
 * This is the checkout-eligible projection of the shared commercial catalogue.
 * The five non-CV paid package checkout paths stay disabled until reviewed PayFast
 * settlement and entitlement evidence exists; they are still visible in public pricing.
 */
export const KINGSMEN_PRICING_CATALOG: readonly FinancePlan[] = [
  {
    planCode: "FREE_DESTINY_MAP_R0",
    planName: KINGSMEN_FREE_PREVIEW.name,
    description: "All-sector preview only. Exact targets, application links, and manual route plans stay sealed until package activation.",
    amountCents: KINGSMEN_FREE_PREVIEW.priceCents,
    currency: "ZAR",
    managedApplicationCount: 0,
    accommodationRouteCount: 0,
    cvVersions: 0,
    motivationLetters: 0,
    doctrineNotes: "Free route preview only; no managed applications."
  },
  ...KINGSMEN_COMMERCIAL_CATALOGUE.filter((plan) => plan.checkoutEnabled).map((plan): FinancePlan => ({
    planCode: plan.planCode as FinancePlanCode,
    planName: plan.name,
    description: plan.packageId === "cv_revamp"
      ? "15 personalised truthful CV versions and 15 matching motivation letters."
      : "Kingsmen commercial package.",
    amountCents: plan.priceCents,
    currency: "ZAR",
    managedApplicationCount: plan.concurrentManagedRoutes30d,
    accommodationRouteCount: plan.includedAccommodationRoutes,
    cvVersions: plan.cvVersions,
    motivationLetters: plan.motivationLetters,
    doctrineNotes: plan.packageId === "cv_revamp"
      ? "Never invent fake experience, qualifications, references, certificates, skills, or results."
      : "Checkout must remain disabled until verified settlement and entitlement tests pass."
  }))
] as const;

export function getFinancePlan(planCode: FinancePlanCode): FinancePlan {
  const plan = KINGSMEN_PRICING_CATALOG.find((item) => item.planCode === planCode);
  if (!plan) throw new Error(`Unknown or checkout-disabled finance plan: ${planCode}`);
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
