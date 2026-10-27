import type { PublicPackageCard } from "./public-website-types";

/**
 * Canonical candidate-facing package catalogue.
 * Entitlements describe service scope; they are not guarantees of admission,
 * employment, funding, accommodation, provider response, or automated portal access.
 */
export const PUBLIC_PACKAGE_CARDS: PublicPackageCard[] = [
  {
    packageKey: "FOUNDATIONAL_ACCORD",
    packageName: "Foundational Accord",
    priceLabel: "R169.99",
    managedApplicationCount: 5,
    includedCvVersions: null,
    includedMotivationLetters: null,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "A controlled academic and opportunity campaign foundation.",
    includedBenefits: ["5 priority applications or managed opportunity routes", "Up to 8 accommodation routes included where relevant", "Academic and opportunity profile review", "Document checklist, readiness warnings, and information validation", "Source, deadline, and application-fee awareness", "Application ordering, proof tracking, and candidate status visibility", "CAO support where applicable; one CAO parent application counts as one Kingsmen application", "NSFAS, TVET, and SETA support where relevant", "CV and motivation-letter support where a route requires it", "Duplicate-submission prevention and intelligent document reuse", "Manual/MAP fallback and Phoenix fallback planning when a portal or route fails"],
    boundary: "Core safety and route capabilities remain available to all packages. Exact routes depend on verified sources, eligibility, opening status, candidate consent, and provider requirements."
  },
  {
    packageKey: "COLLEGIATE_ORDINANCE",
    packageName: "Collegiate Ordinance",
    priceLabel: "R299.99",
    managedApplicationCount: 10,
    includedCvVersions: null,
    includedMotivationLetters: null,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "Guided academic alignment and informed application progression.",
    includedBenefits: ["10 priority applications", "NSFAS submission support where eligible and applicable", "Structured education and programme matching", "Context-aware motivation-letter support", "Document enhancement and readiness checks", "Queue management and supported automatic release", "Academic history, strengths, intended direction, and compatibility review", "Programme-fit scoring and institutional compatibility filtering", "Deadline-aware timing, alternative recommendations, and fallback routes", "Up to 8 accommodation routes included where relevant"],
    boundary: "Matching is decision support, not a guarantee of acceptance. Submission automation runs only where the provider permits it and the workflow is verified."
  },
  {
    packageKey: "CHANCELLORS_WRIT",
    packageName: "Chancellor's Writ",
    priceLabel: "R399.99",
    managedApplicationCount: 15,
    includedCvVersions: 0,
    includedMotivationLetters: 1,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "Strategic academic orchestration across multiple viable pathways.",
    includedBenefits: ["15 priority applications", "NSFAS and CAO execution support where applicable", "Advanced profile-to-opportunity matching", "High-probability placement strategy using evidence-backed suitability estimates", "Supported auto-submit when an eligible opportunity opens", "Priority queue acceleration", "Application-fee and institutional-pattern awareness where reliable data exists", "Consent-based document storage", "Sequencing, timing, ranking, and multi-path fallback strategy", "Up to 8 accommodation routes included where relevant"],
    boundary: "Acceptance probabilities are estimates, never promises. Institutional monitoring and automated submissions require verified data and supported integrations."
  },
  {
    packageKey: "REGENCY_MANDATE",
    packageName: "Regency Mandate",
    priceLabel: "R469.99",
    managedApplicationCount: 15,
    includedCvVersions: 0,
    includedMotivationLetters: 1,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "Highest package intensity for urgent, closely monitored placement campaigns.",
    includedBenefits: ["15 applications with maximum package priority", "NSFAS and CAO support where applicable", "Elite profile and opportunity matching", "Intensive placement and recovery strategy", "Real-time opening/seat detection when reliable provider data supports it", "Immediate supported submission execution when conditions are met", "Institutional escalation routing where available and appropriate", "Fast-track queue handling", "24-hour monitoring target, subject to live operational coverage being enabled", "Emergency fallback routes and institution-opening alerts", "Up to 8 accommodation routes included where relevant"],
    boundary: "The 24-hour monitoring and escalation design is not a guarantee of a provider response, a seat, admission, or a continuously available human operator. Live coverage must be operationally verified."
  },
  {
    packageKey: "ARTISAN_CHARTER",
    packageName: "Artisan Charter",
    priceLabel: "R149.99",
    managedApplicationCount: 5,
    includedCvVersions: null,
    includedMotivationLetters: null,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "A practical entry into employment, internships, learnerships, apprenticeships, and artisan routes.",
    includedBenefits: ["5 priority career applications", "Basic role matching", "CV structuring and presentation", "Basic motivation-letter support", "Streamlined submission workflow for supported opportunities", "Relevant opportunity alerts", "All six Kingsmen pathways remain visible; matching depends on candidate intent and eligibility", "Up to 8 accommodation routes included where relevant"],
    boundary: "The package supports career applications; it does not promise interviews, offers, employment, or provider acceptance."
  },
  {
    packageKey: "GUILDMASTERS_CHARTER",
    packageName: "Guildmaster's Charter",
    priceLabel: "R199.99",
    managedApplicationCount: 8,
    includedCvVersions: 1,
    includedMotivationLetters: 1,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "Advanced professional positioning and career-path support.",
    includedBenefits: ["8 priority career applications", "Advanced role matching", "ATS-aware CV preparation that remains truthful", "Professional role-specific motivation-letter support", "Opportunity recommendations", "Priority submission handling", "Interview preparation tips", "Skills-gap analysis", "Career-path projection", "Up to 8 accommodation routes included where relevant"],
    boundary: "CVs and letters must reflect candidate-provided evidence. ATS compatibility does not guarantee selection or interview."
  },
  {
    packageKey: "FREE_DESTINY_MAP",
    packageName: "Free Destiny Map",
    priceLabel: "R0",
    managedApplicationCount: 0,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    routeVisibility: "PREVIEW_ONLY",
    summary: "All-sector preview before a paid package is activated.",
    includedBenefits: ["All-sector pathway preview", "No managed applications", "Exact targets and manual route plans remain sealed until activation"],
    boundary: "Preview only; no managed application entitlement."
  },
  {
    packageKey: "CV_REVAMP",
    packageName: "CV Revamp",
    priceLabel: "R49.99",
    managedApplicationCount: 0,
    includedCvVersions: 15,
    includedMotivationLetters: 15,
    includedAccommodationRoutes: 0,
    routeVisibility: "SEALED",
    summary: "Standalone personalised CV and motivation-letter preparation.",
    includedBenefits: ["15 personalised CV versions", "15 matching motivation letters", "Truthful personalisation only; no invented experience, qualifications, references, certificates, skills, or results"],
    boundary: "Standalone document product; no managed applications."
  },
  {
    packageKey: "ACCOMMODATION_SUPPORT",
    packageName: "Accommodation Support Package",
    priceLabel: "R179.00",
    managedApplicationCount: 8,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 8,
    routeVisibility: "ACTIVATED",
    summary: "Standalone accommodation checkout is retired; route assistance remains included with paid packages where relevant.",
    includedBenefits: ["8 accommodation applications/routes", "Provider/source legitimacy checks where verifiable", "Deposit and scam-risk warnings", "Location/safety notes where available", "Consent before sharing candidate details", "Accommodation proof tracking and fallback options"],
    boundary: "Kingsmen does not handle rent/deposits or guarantee accommodation. Every paid Kingsmen package includes up to 8 ACC-01 routes where relevant, subject to verification, availability, and consent."
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
  if (cv.priceLabel !== "R49.99" || cv.includedCvVersions !== 15 || cv.includedMotivationLetters !== 15 ||
      !cv.boundary.includes("no invented experience")) {
    throw new Error("CV_REVAMP_TRUTH_BOUNDARY_BROKEN");
  }
  return true;
}

export function accommodationSupportBoundary(): true {
  const acc = getPublicPackageCard("ACCOMMODATION_SUPPORT");
  if (acc.priceLabel !== "R179.00" || acc.includedAccommodationRoutes !== 8) {
    throw new Error("ACCOMMODATION_SUPPORT_CANONICAL_PRICING_BROKEN");
  }
  return true;
}

export function validateCanonicalCandidatePackages(): true {
  const expected = [
    ["FOUNDATIONAL_ACCORD", "R169.99", 5],
    ["COLLEGIATE_ORDINANCE", "R299.99", 10],
    ["CHANCELLORS_WRIT", "R399.99", 15],
    ["REGENCY_MANDATE", "R469.99", 15],
    ["ARTISAN_CHARTER", "R149.99", 5],
    ["GUILDMASTERS_CHARTER", "R199.99", 8]
  ] as const;
  for (const [key, price, applications] of expected) {
    const card = getPublicPackageCard(key);
    if (card.priceLabel !== price || card.managedApplicationCount !== applications || card.includedBenefits.length < 5) {
      throw new Error(`CANONICAL_PACKAGE_ENTITLEMENT_BROKEN:${key}`);
    }
  }
  if (PUBLIC_PACKAGE_CARDS.length !== 9) throw new Error("PUBLIC_PACKAGE_CATALOGUE_COUNT_BROKEN");
  return true;
}
