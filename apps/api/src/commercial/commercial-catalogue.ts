/**
 * Canonical runtime commercial contract.
 * Money is integer cents. Discovery is universal; entitlements control service quantity,
 * not access to opportunity pathways. Checkout eligibility is deliberately separate.
 */
export const KINGSMEN_COMMERCIAL_CATALOGUE = [
  { packageId: "foundational_accord", packageKey: "FOUNDATIONAL_ACCORD", planCode: "FOUNDATIONAL_ACCORD_R169_99", name: "Foundational Accord", priceCents: 16999, priorityApplications: 5, concurrentManagedRoutes30d: 4, accommodationSupport: true, includedAccommodationRoutes: 8, cvVersions: 0, motivationLetters: 0, checkoutEnabled: false },
  { packageId: "collegiate_ordinance", packageKey: "COLLEGIATE_ORDINANCE", planCode: "COLLEGIATE_ORDINANCE_R299_99", name: "Collegiate Ordinance", priceCents: 29999, priorityApplications: 10, concurrentManagedRoutes30d: 8, accommodationSupport: true, includedAccommodationRoutes: 0, cvVersions: 0, motivationLetters: 0, checkoutEnabled: false },
  { packageId: "chancellors_writ", packageKey: "CHANCELLORS_WRIT", planCode: "CHANCELLORS_WRIT_R399_99", name: "Chancellor's Writ", priceCents: 39999, priorityApplications: 15, concurrentManagedRoutes30d: 10, accommodationSupport: true, includedAccommodationRoutes: 0, cvVersions: 0, motivationLetters: 0, checkoutEnabled: false },
  { packageId: "regency_mandate", packageKey: "REGENCY_MANDATE", planCode: "REGENCY_MANDATE_R469_99", name: "Regency Mandate", priceCents: 46999, priorityApplications: 15, concurrentManagedRoutes30d: 12, accommodationSupport: true, includedAccommodationRoutes: 0, cvVersions: 0, motivationLetters: 0, checkoutEnabled: false },
  { packageId: "artisan_charter", packageKey: "ARTISAN_CHARTER", planCode: "ARTISAN_CHARTER_R149_99", name: "Artisan Charter", priceCents: 14999, priorityApplications: 5, concurrentManagedRoutes30d: 3, accommodationSupport: true, includedAccommodationRoutes: 0, cvVersions: 0, motivationLetters: 0, checkoutEnabled: false },
  { packageId: "guildmasters_charter", packageKey: "GUILDMASTERS_CHARTER", planCode: "GUILDMASTERS_CHARTER_R199_99", name: "Guildmasters Charter", priceCents: 19999, priorityApplications: 8, concurrentManagedRoutes30d: 5, accommodationSupport: true, includedAccommodationRoutes: 0, cvVersions: 0, motivationLetters: 0, checkoutEnabled: false },
  { packageId: "cv_revamp", packageKey: "CV_REVAMP", planCode: "CV_REVAMP_R49_99", name: "CV Revamp", priceCents: 4999, priorityApplications: null, concurrentManagedRoutes30d: 0, accommodationSupport: true, includedAccommodationRoutes: 0, cvVersions: 15, motivationLetters: 15, checkoutEnabled: true, targetBusinessDaysAfterCompleteIntake: 3 },
] as const;

export const KINGSMEN_FREE_PREVIEW = {
  packageKey: "FREE_DESTINY_MAP",
  name: "Free Destiny Map",
  priceCents: 0,
  priorityApplications: 0,
  concurrentManagedRoutes30d: 0,
  accommodationSupport: true,
  includedAccommodationRoutes: 0,
  cvVersions: 0,
  motivationLetters: 0,
  checkoutEnabled: false,
} as const;

export const KINGSMEN_PATHWAYS = [
  "Higher Education",
  "TVET",
  "SETA programmes and learnerships",
  "Internships",
  "Apprenticeships",
  "Employment",
] as const;

export function formatZar(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error("INVALID_MONEY_CENTS");
  return `R${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
