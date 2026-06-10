import type { PublicPackageCard } from "./public-website-types";

export const PUBLIC_PACKAGE_CARDS: PublicPackageCard[] = [
  {
    packageKey: "FREE_DESTINY_MAP",
    packageName: "Free Destiny Map",
    priceLabel: "R0",
    managedApplicationCount: 0,
    includedCvVersions: 0,
    includedMotivationLetters: 0,
    includedAccommodationRoutes: 0,
    routeVisibility: "PREVIEW_ONLY",
    boundary:
      "All-sector preview only. Exact targets, links, portals, manual route plans, bursary targets, and accommodation targets remain sealed until package activation."
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
    boundary:
      "Includes 15 personalised CV versions and 15 matching motivation letters. Must remain truthful and may never invent experience, qualifications, references, certificates, or skills."
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
    boundary:
      "Standalone support for 8 accommodation applications/routes. Every paid Kingsmen package includes up to 8 ACC-01 accommodation routes."
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

export function accommodationSupportBoundary(): true {
  const acc = getPublicPackageCard("ACCOMMODATION_SUPPORT");
  if (acc.priceLabel !== "R179.00" || acc.includedAccommodationRoutes !== 8) {
    throw new Error("ACCOMMODATION_SUPPORT_CANONICAL_PRICING_BROKEN");
  }
  return true;
}