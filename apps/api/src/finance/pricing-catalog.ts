import type { FinancePlan, FinancePlanCode } from "./finance-types";

const CATALOGUE_VERSION = "1.0";
const REFUND_POLICY_VERSION = "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1";
const RESPONSE_TARGET_DISCLAIMER = "Business-hour target after complete intake; not a guarantee of application outcome, provider decision, funding, admission, employment, or accommodation.";
const ACCOMMODATION_POLICY = "Accommodation support, where relevant, consumes one managed-route slot; no separate accommodation fee or extra route allowance. Subject to verification, availability and consent. Kingsmen does not receive or pay rent/deposits.";

export const KINGSMEN_PRICING_CATALOG: readonly FinancePlan[] = [
  {
    planCode: "FREE_DESTINY_MAP_R0",
    planName: "Free Destiny Map",
    description: "All-sector preview only. Exact targets, application links, and manual route plans stay sealed until package activation.",
    amountCents: 0, currency: "ZAR",
    managedApplicationCount: 0, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 0, acknowledgementTargetBusinessHours: 0, firstResponseTargetBusinessHours: 0,
    upgradeBonusRoutesWhenCvRevampOwned: 0, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "All-sector preview only; no managed applications.",
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "Free route preview only; no managed applications."
  },
  {
    planCode: "CV_REVAMP_R49_99",
    planName: "CV Revamp",
    description: "15 personalised truthful CV versions and 15 matching motivation letters; one-off CV pack delivery target is 3 business days after complete intake.",
    amountCents: 4999, currency: "ZAR",
    managedApplicationCount: 0, accommodationRouteCount: 0, cvVersions: 15, motivationLetters: 15,
    serviceTermDays: 0, acknowledgementTargetBusinessHours: 16, firstResponseTargetBusinessHours: 24,
    upgradeBonusRoutesWhenCvRevampOwned: 0, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "One CV pack: 15 personalised truthful CV versions and 15 matching motivation letters. No managed routes included.",
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "Never invent fake experience, qualifications, references, certificates, skills, or results."
  },
  {
    planCode: "ARTISAN_CHARTER_R149_99",
    planName: "Artisan Charter",
    description: "3 concurrent active managed route slots for 30 calendar days; work and skills focus.",
    amountCents: 14999, currency: "ZAR",
    managedApplicationCount: 3, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 30, acknowledgementTargetBusinessHours: 16, firstResponseTargetBusinessHours: 16,
    upgradeBonusRoutesWhenCvRevampOwned: 2, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "Work, skills, learnership, internship, apprenticeship and employment readiness. " + ACCOMMODATION_POLICY,
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "3 concurrent active route slots; slots can be reused after routes close during the term. Response targets begin after complete intake."
  },
  {
    planCode: "FOUNDATIONAL_ACCORD_R169_99",
    planName: "Foundational Accord",
    description: "4 concurrent active managed route slots for 30 calendar days across the six core gates.",
    amountCents: 16999, currency: "ZAR",
    managedApplicationCount: 4, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 30, acknowledgementTargetBusinessHours: 16, firstResponseTargetBusinessHours: 16,
    upgradeBonusRoutesWhenCvRevampOwned: 2, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "Higher Education, TVET, SETA/Learnership, Internship, Apprenticeship and Employment. " + ACCOMMODATION_POLICY,
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "4 concurrent active route slots; slots can be reused after routes close during the term. Response targets begin after complete intake."
  },
  {
    planCode: "GUILDMASTERS_CHARTER_R199_99",
    planName: "Guildmaster's Charter",
    description: "5 concurrent active managed route slots for 30 calendar days with increased work/skills monitoring.",
    amountCents: 19999, currency: "ZAR",
    managedApplicationCount: 5, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 30, acknowledgementTargetBusinessHours: 16, firstResponseTargetBusinessHours: 16,
    upgradeBonusRoutesWhenCvRevampOwned: 2, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "Work and skills focus with increased monitoring and follow-up. " + ACCOMMODATION_POLICY,
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "5 concurrent active route slots; slots can be reused after routes close during the term. Response targets begin after complete intake."
  },
  {
    planCode: "COLLEGIATE_ORDINANCE_R299_99",
    planName: "Collegiate Ordinance",
    description: "8 concurrent active managed route slots for 30 calendar days with higher monitoring priority.",
    amountCents: 29999, currency: "ZAR",
    managedApplicationCount: 8, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 30, acknowledgementTargetBusinessHours: 8, firstResponseTargetBusinessHours: 8,
    upgradeBonusRoutesWhenCvRevampOwned: 2, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "Higher managed volume and monitoring priority across the six core gates. " + ACCOMMODATION_POLICY,
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "8 concurrent active route slots; slots can be reused after routes close during the term. Response targets begin after complete intake."
  },
  {
    planCode: "CHANCELLORS_WRIT_R399_99",
    planName: "Chancellor's Writ",
    description: "10 concurrent active managed route slots for 30 calendar days with priority queue and deeper human review.",
    amountCents: 39999, currency: "ZAR",
    managedApplicationCount: 10, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 30, acknowledgementTargetBusinessHours: 8, firstResponseTargetBusinessHours: 8,
    upgradeBonusRoutesWhenCvRevampOwned: 2, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "Priority queue, deeper human review and stronger fallback support. " + ACCOMMODATION_POLICY,
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "10 concurrent active route slots; slots can be reused after routes close during the term. Response targets begin after complete intake."
  },
  {
    planCode: "REGENCY_MANDATE_R469_99",
    planName: "Regency Mandate",
    description: "12 concurrent active managed route slots for 30 calendar days with highest queue priority and escalation depth.",
    amountCents: 46999, currency: "ZAR",
    managedApplicationCount: 12, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0,
    serviceTermDays: 30, acknowledgementTargetBusinessHours: 8, firstResponseTargetBusinessHours: 8,
    upgradeBonusRoutesWhenCvRevampOwned: 2, refundPolicyVersion: REFUND_POLICY_VERSION, catalogueVersion: CATALOGUE_VERSION,
    serviceScope: "Highest queue priority, monitoring intensity and escalation depth. " + ACCOMMODATION_POLICY,
    responseTargetDisclaimer: RESPONSE_TARGET_DISCLAIMER,
    doctrineNotes: "12 concurrent active route slots; slots can be reused after routes close during the term. Response targets begin after complete intake."
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
