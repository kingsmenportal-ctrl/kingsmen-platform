export const FREE_DESTINY_MAP_CONTROLLED_NEXT_BOOT_MODULE =
  "BATCH 14 - Controlled Local Next Web Boot Proof" as const;

export const FREE_DESTINY_MAP_CONTROLLED_NEXT_BOOT_WEB_PACKAGE =
  "apps/web/package.json" as const;

export const FREE_DESTINY_MAP_CONTROLLED_NEXT_BOOT_ROUTE =
  "/free-destiny-map" as const;

export type FreeDestinyMapControlledNextBootStatus =
  | "CONTROLLED_NEXT_BOOT_PROVEN"
  | "CONTROLLED_NEXT_BOOT_FAILED";

export interface FreeDestinyMapControlledNextBootCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface FreeDestinyMapControlledNextBootReport {
  schema: "kingsmen.controlled-next-boot-report.v1";
  module: typeof FREE_DESTINY_MAP_CONTROLLED_NEXT_BOOT_MODULE;
  status: FreeDestinyMapControlledNextBootStatus;
  passed: boolean;
  productionReady: false;
  canClaimProduction: false;
  serverStarted: boolean;
  serverStopped: boolean;
  webStatus: number;
  oracleLiteImpact: "none_runtime_yet";
  checks: FreeDestinyMapControlledNextBootCheck[];
  failed: FreeDestinyMapControlledNextBootCheck[];
  nextAction: string;
}
