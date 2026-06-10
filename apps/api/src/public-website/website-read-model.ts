import { PUBLIC_PACKAGE_CARDS } from "./package-boundaries";
import { PUBLIC_SECTOR_CARDS } from "./sector-universe";
import { ROUTE_HOUSE_COPY } from "./route-house-copy";
import type { PublicWebsiteReadModel } from "./public-website-types";

export function buildPublicWebsiteReadModel(): PublicWebsiteReadModel {
  return {
    identity: ROUTE_HOUSE_COPY.identity,
    heroPromise: ROUTE_HOUSE_COPY.promise,
    packageCards: PUBLIC_PACKAGE_CARDS,
    sectorCards: PUBLIC_SECTOR_CARDS,
    hardBoundaries: [
      "Kingsmen is not an official portal.",
      "No admission, funding, employment, accommodation, or approval guarantee.",
      "Free Destiny Map is R0 with 0 managed applications.",
      "Exact targets and links remain sealed until package activation.",
      "CV Revamp must remain truthful and cannot invent experience or qualifications.",
      "Email is primary; WhatsApp is urgent-only.",
      "Lead handoff requires POPIA consent and candidate confirmation."
    ],
    leadCaptureEnabled: true
  };
}

export function publicWebsiteIsStaticFirstOracleLite(): true {
  return true;
}