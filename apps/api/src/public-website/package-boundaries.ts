import type { PublicPackageCard } from "./public-website-types";

const responseDisclaimer = "Business-hour target after complete intake; not a guarantee of admission, funding, employment, provider decisions, or accommodation.";
const accommodationBoundary = "Accommodation support, where relevant, uses one of the package's managed-route slots; no separate accommodation fee or extra route allowance. Subject to verification, availability and consent. Kingsmen does not receive or pay rent/deposits.";

export const PUBLIC_PACKAGE_CARDS: PublicPackageCard[] = [
  {
    packageKey: "FREE_DESTINY_MAP",
    packageName: "Free Destiny Map",
    priceLabel: "R0",
    managedApplicationCount: 0,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 0,
    routeVisibility: "PREVIEW_ONLY",
    boundary: "All-sector preview only. Exact targets, links, portals, manual route plans, bursary targets, and accommodation targets remain sealed until package activation."
  },
  {
    packageKey: "CV_REVAMP",
    packageName: "CV Revamp",
    priceLabel: "R49.99",
    managedApplicationCount: 0,
    includedCvVersions: 15,
    includedMotivationLetters: 15,
    includedAccommodationRoutes: 0,
    serviceTermDays: 0,
    acknowledgementTargetBusinessHours: 16,
    firstResponseTargetBusinessHours: 24,
    catalogueVersion: "1.0",
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "One CV pack: 15 personalised truthful CV versions and 15 matching motivation letters. Delivery target is 3 business days after complete intake. Must never invent experience, qualifications, references, certificates, skills, or results."
  },
  {
    packageKey: "ARTISAN_CHARTER",
    packageName: "Artisan Charter",
    priceLabel: "R149.99",
    managedApplicationCount: 3,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 30,
    acknowledgementTargetBusinessHours: 16,
    firstResponseTargetBusinessHours: 16,
    upgradeBonusRoutesWhenCvRevampOwned: 2,
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    catalogueVersion: "1.0",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "3 concurrent managed-route slots for 30 calendar days; work, skills, learnership, internship, apprenticeship and employment readiness. " + accommodationBoundary
  },
  {
    packageKey: "FOUNDATIONAL_ACCORD",
    packageName: "Foundational Accord",
    priceLabel: "R169.99",
    managedApplicationCount: 4,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 30,
    acknowledgementTargetBusinessHours: 16,
    firstResponseTargetBusinessHours: 16,
    upgradeBonusRoutesWhenCvRevampOwned: 2,
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    catalogueVersion: "1.0",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "4 concurrent managed-route slots for 30 calendar days across Higher Education, TVET, SETA/Learnership, Internship, Apprenticeship and Employment. " + accommodationBoundary
  },
  {
    packageKey: "GUILDMASTERS_CHARTER",
    packageName: "Guildmaster's Charter",
    priceLabel: "R199.99",
    managedApplicationCount: 5,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 30,
    acknowledgementTargetBusinessHours: 16,
    firstResponseTargetBusinessHours: 16,
    upgradeBonusRoutesWhenCvRevampOwned: 2,
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    catalogueVersion: "1.0",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "5 concurrent managed-route slots for 30 calendar days with increased work/skills monitoring. " + accommodationBoundary
  },
  {
    packageKey: "COLLEGIATE_ORDINANCE",
    packageName: "Collegiate Ordinance",
    priceLabel: "R299.99",
    managedApplicationCount: 8,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 30,
    acknowledgementTargetBusinessHours: 8,
    firstResponseTargetBusinessHours: 8,
    upgradeBonusRoutesWhenCvRevampOwned: 2,
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    catalogueVersion: "1.0",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "8 concurrent managed-route slots for 30 calendar days with higher monitoring priority. " + accommodationBoundary
  },
  {
    packageKey: "CHANCELLORS_WRIT",
    packageName: "Chancellor's Writ",
    priceLabel: "R399.99",
    managedApplicationCount: 10,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 30,
    acknowledgementTargetBusinessHours: 8,
    firstResponseTargetBusinessHours: 8,
    upgradeBonusRoutesWhenCvRevampOwned: 2,
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    catalogueVersion: "1.0",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "10 concurrent managed-route slots for 30 calendar days with priority queue and deeper human review. " + accommodationBoundary
  },
  {
    packageKey: "REGENCY_MANDATE",
    packageName: "Regency Mandate",
    priceLabel: "R469.99",
    managedApplicationCount: 12,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    serviceTermDays: 30,
    acknowledgementTargetBusinessHours: 8,
    firstResponseTargetBusinessHours: 8,
    upgradeBonusRoutesWhenCvRevampOwned: 2,
    refundPolicyVersion: "ZA_CONSUMER_REVIEW_PENDING_PUBLICATION_V1",
    catalogueVersion: "1.0",
    responseTargetDisclaimer: responseDisclaimer,
    routeVisibility: "SEALED",
    boundary: "12 concurrent managed-route slots for 30 calendar days with highest queue priority and escalation depth. " + accommodationBoundary
  }
];

export function getPublicPackageCard(packageKey: PublicPackageCard["packageKey"]): PublicPackageCard {
  const found = PUBLIC_PACKAGE_CARDS.find((card) => card.packageKey === packageKey);
  if (!found) throw new Error("UNKNOWN_PUBLIC_PACKAGE");
  return found;
}

export function packagesControlWeightNotDignity(): true {
  return true;
}

export function freeDestinyMapHasZeroManagedApplications(): true {
  const free = getPublicPackageCard("FREE_DESTINY_MAP");
  if (free.priceLabel !== "R0" || free.managedApplicationCount !== 0 || free.routeVisibility !== "PREVIEW_ONLY") {
    throw new Error("FREE_DESTINY_MAP_BOUNDARY_BROKEN");
  }
  return true;
}

export function cvRevampTruthBoundary(): true {
  const cv = getPublicPackageCard("CV_REVAMP");
  if (cv.priceLabel !== "R49.99" || cv.includedCvVersions !== 15 || cv.includedMotivationLetters !== 15) {
    throw new Error("CV_REVAMP_CANONICAL_PRICING_BROKEN");
  }
  return true;
}
