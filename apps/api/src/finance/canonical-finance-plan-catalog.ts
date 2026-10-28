import type { FinancePlan, FinancePlanCode } from "./finance-types";

/** Canonical finance-side prices and service quantities; amountCents is always integer ZAR cents. */
export const KINGSMEN_PRICING_CATALOG: readonly FinancePlan[] = [
  { planCode: "FREE_DESTINY_MAP_R0", planName: "Free Destiny Map", description: "All-sector preview only; exact targets and route plans remain sealed until activation.", amountCents: 0, currency: "ZAR", managedApplicationCount: 0, accommodationRouteCount: 0, cvVersions: 0, motivationLetters: 0, doctrineNotes: "Preview only; zero managed applications." },
  { planCode: "FOUNDATIONAL_ACCORD_R169_99", planName: "Foundational Accord", description: "Academic and opportunity foundation; five managed applications.", amountCents: 16999, currency: "ZAR", managedApplicationCount: 5, accommodationRouteCount: 8, cvVersions: null, motivationLetters: null, doctrineNotes: "Verified routes only; no outcome guarantees." },
  { planCode: "COLLEGIATE_ORDINANCE_R299_99", planName: "Collegiate Ordinance", description: "Guided academic matching and progression; ten managed applications.", amountCents: 29999, currency: "ZAR", managedApplicationCount: 10, accommodationRouteCount: 8, cvVersions: null, motivationLetters: null, doctrineNotes: "Automated submission only on verified supported routes." },
  { planCode: "CHANCELLORS_WRIT_R399_99", planName: "Chancellor's Writ", description: "Strategic academic orchestration; fifteen managed applications.", amountCents: 39999, currency: "ZAR", managedApplicationCount: 15, accommodationRouteCount: 8, cvVersions: null, motivationLetters: null, doctrineNotes: "Suitability estimates are not guarantees." },
  { planCode: "REGENCY_MANDATE_R469_99", planName: "Regency Mandate", description: "Highest service intensity; fifteen managed applications.", amountCents: 46999, currency: "ZAR", managedApplicationCount: 15, accommodationRouteCount: 8, cvVersions: null, motivationLetters: null, doctrineNotes: "24-hour monitoring is subject to verified live coverage." },
  { planCode: "ARTISAN_CHARTER_R149_99", planName: "Artisan Charter", description: "Employment, internship, learnership, apprenticeship and artisan routes; five managed career applications.", amountCents: 14999, currency: "ZAR", managedApplicationCount: 5, accommodationRouteCount: 8, cvVersions: null, motivationLetters: null, doctrineNotes: "No guaranteed interview, offer or employment." },
  { planCode: "GUILDMASTERS_CHARTER_R199_99", planName: "Guildmaster's Charter", description: "Advanced career positioning; eight managed career applications.", amountCents: 19999, currency: "ZAR", managedApplicationCount: 8, accommodationRouteCount: 8, cvVersions: null, motivationLetters: null, doctrineNotes: "CV and letters must remain truthful." },
  { planCode: "CV_REVAMP_R49_99", planName: "CV Revamp", description: "Fifteen personalised truthful CV versions and fifteen matching motivation letters.", amountCents: 4999, currency: "ZAR", managedApplicationCount: 0, accommodationRouteCount: 0, cvVersions: 15, motivationLetters: 15, doctrineNotes: "Never invent candidate experience, qualifications, references, certificates, skills or results; later paid package upgrade adds +2 managed routes once." },
  { planCode: "ACCOMMODATION_SUPPORT_R179", planName: "Accommodation Support Package", description: "Eight accommodation routes; standalone service.", amountCents: 17900, currency: "ZAR", managedApplicationCount: 0, accommodationRouteCount: 8, cvVersions: 0, motivationLetters: 0, doctrineNotes: "No rent/deposit handling or accommodation guarantee." }
] as const;

export function getFinancePlan(planCode: FinancePlanCode): FinancePlan {
  const plan = KINGSMEN_PRICING_CATALOG.find((item) => item.planCode === planCode);
  if (!plan) throw new Error(`Unknown finance plan: ${planCode}`);
  return plan;
}

export function assertCvRevampTruthBoundary(planCode: FinancePlanCode): void {
  if (planCode === "CV_REVAMP_R49_99" && !getFinancePlan(planCode).doctrineNotes.includes("Never invent")) {
    throw new Error("CV Revamp truth boundary is missing.");
  }
}

export function validateFinanceCatalogue(): true {
  const expected: ReadonlyArray<readonly [FinancePlanCode, number, number, number, number | null, number | null]> = [
    ["FREE_DESTINY_MAP_R0", 0, 0, 0, 0, 0],
    ["FOUNDATIONAL_ACCORD_R169_99", 16999, 5, 8, null, null],
    ["COLLEGIATE_ORDINANCE_R299_99", 29999, 10, 8, null, null],
    ["CHANCELLORS_WRIT_R399_99", 39999, 15, 8, null, null],
    ["REGENCY_MANDATE_R469_99", 46999, 15, 8, null, null],
    ["ARTISAN_CHARTER_R149_99", 14999, 5, 8, null, null],
    ["GUILDMASTERS_CHARTER_R199_99", 19999, 8, 8, null, null],
    ["CV_REVAMP_R49_99", 4999, 0, 0, 15, 15],
    ["ACCOMMODATION_SUPPORT_R179", 17900, 0, 8, 0, 0]
  ];
  if (KINGSMEN_PRICING_CATALOG.length !== expected.length) throw new Error("FINANCE_CATALOGUE_COUNT_MISMATCH");
  for (const [code, cents, apps, routes, cvs, letters] of expected) {
    const plan = getFinancePlan(code);
    if (plan.amountCents !== cents || plan.managedApplicationCount !== apps || plan.accommodationRouteCount !== routes || plan.cvVersions !== cvs || plan.motivationLetters !== letters || plan.currency !== "ZAR") {
      throw new Error(`FINANCE_CATALOGUE_ENTITLEMENT_MISMATCH:${code}`);
    }
  }
  return true;
}
