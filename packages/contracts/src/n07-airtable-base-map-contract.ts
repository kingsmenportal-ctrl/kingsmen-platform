export type N07AirtableBaseName =
  | "Kingsman Nexus-7"
  | "Kingsman Nexus (MSB)"
  | "Applications Hub"
  | "AI Engine"
  | "AI Decision & Orchestration Engine"
  | "System Operations"
  | "Automation Control"
  | "Communications Center"
  | "Programs & Intelligence"
  | "Kingsmen Financial Operations"
  | "Partner Ecosystem Directory"
  | "Document Vault";

export type N07AirtableBaseMapRow = {
  baseName: N07AirtableBaseName;
  mirrorPurpose: string;
  truthOwner: "postgres";
  airtableRole: "async_mirror_only";
  canGovernTruth: false;
  productionReady: false;
};