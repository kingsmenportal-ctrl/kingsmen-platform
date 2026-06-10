import { allSectorsVisibleFromPublicWebsite } from "./sector-universe";
import type { DestinyMapPreview } from "./public-website-types";

export function buildFreeDestinyMapPreview(): DestinyMapPreview {
  return {
    requestRef: `destiny_preview_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    priceLabel: "R0",
    managedApplications: 0,
    previewScope: "ALL_SECTOR_PREVIEW",
    exactTargetsSealed: true,
    activationPrompt: "Activate a package to unlock exact targets, links, manual route plans, and managed execution.",
    visibleSectors: allSectorsVisibleFromPublicWebsite(),
    hiddenUntilActivation: [
      "exact institutions",
      "exact companies",
      "portal links",
      "programme targets",
      "bursary targets",
      "accommodation targets",
      "manual route plans",
      "submission execution details"
    ]
  };
}

export function freePreviewDoesNotExposeSealedRoutes(preview: DestinyMapPreview): true {
  if (!preview.exactTargetsSealed) throw new Error("FREE_PREVIEW_MUST_KEEP_TARGETS_SEALED");
  if (preview.managedApplications !== 0) throw new Error("FREE_PREVIEW_HAS_ZERO_MANAGED_APPLICATIONS");
  return true;
}