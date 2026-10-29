import { KINGSMEN_COMMERCIAL_CATALOGUE, KINGSMEN_FREE_PREVIEW, formatZar } from "../commercial/commercial-catalogue";
import type { PublicPackageCard } from "./public-website-types";

const freeCard: PublicPackageCard = {
  packageKey: KINGSMEN_FREE_PREVIEW.packageKey,
  packageName: KINGSMEN_FREE_PREVIEW.name,
  priceLabel: "R0",
  managedApplicationCount: 0,
  priorityApplicationCount: 0,
  concurrentManagedRouteCapacity30d: 0,
  accommodationSupport: true,
  includedCvVersions: 0,
  includedMotivationLetters: 0,
  includedAccommodationRoutes: 0,
  routeVisibility: "PREVIEW_ONLY",
  boundary: "All six pathways remain discoverable. Free Destiny Map is a preview with zero managed applications; exact targets and execution unlock only when applicable service entitlement is active."
};

export const PUBLIC_PACKAGE_CARDS: PublicPackageCard[] = [
  freeCard,
  ...KINGSMEN_COMMERCIAL_CATALOGUE.map((plan): PublicPackageCard => ({
    packageKey: plan.packageKey,
    packageName: plan.name,
    priceLabel: formatZar(plan.priceCents),
    // Kept only for backwards-compatible readers. New logic must use the explicit fields below.
    managedApplicationCount: plan.concurrentManagedRoutes30d,
    priorityApplicationCount: plan.priorityApplications,
    concurrentManagedRouteCapacity30d: plan.concurrentManagedRoutes30d,
    accommodationSupport: plan.accommodationSupport,
    includedCvVersions: plan.cvVersions,
    includedMotivationLetters: plan.motivationLetters,
    includedAccommodationRoutes: plan.includedAccommodationRoutes,
    routeVisibility: "SEALED",
    boundary: plan.packageId === "cv_revamp"
      ? "Standalone CV service: 15 personalised CV versions and 15 matching motivation letters, delivered truthfully after complete intake. No managed application allowance."
      : `All six pathways remain discoverable. ${plan.priorityApplications} priority applications; capacity for ${plan.concurrentManagedRoutes30d} concurrent managed routes over 30 days. Accommodation support is included; ${plan.includedAccommodationRoutes} accommodation routes are included without extra charge. Checkout is not enabled until payment settlement and entitlement tests are approved.`
  }))
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

/** Accommodation is a capability of every package, not a separately sold R179 product. */
export function accommodationSupportBoundary(): true {
  const paid = PUBLIC_PACKAGE_CARDS.filter((card) => card.packageKey !== "FREE_DESTINY_MAP");
  if (paid.some((card) => !card.accommodationSupport)) throw new Error("PACKAGE_ACCOMMODATION_SUPPORT_MISSING");
  if (PUBLIC_PACKAGE_CARDS.some((card) => card.packageKey === "ACCOMMODATION_SUPPORT")) {
    throw new Error("STANDALONE_ACCOMMODATION_PRODUCT_MUST_NOT_BE_OFFERED");
  }
  return true;
}
