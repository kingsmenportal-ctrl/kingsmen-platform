export const N07_AIRTABLE_BASE_MAP = [
  { baseName: "Kingsman Nexus-7", mirrorPurpose: "portal sessions, drafts, onboarding", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Kingsman Nexus (MSB)", mirrorPurpose: "MSB council profile mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Applications Hub", mirrorPurpose: "applications, timeline, war room mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "AI Engine", mirrorPurpose: "AI logs and prompt mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "AI Decision & Orchestration Engine", mirrorPurpose: "decision signal mirror only", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "System Operations", mirrorPurpose: "health and capacity mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Automation Control", mirrorPurpose: "approvals, kill switches, workflow mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Communications Center", mirrorPurpose: "message and support mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Programs & Intelligence", mirrorPurpose: "program and route intelligence mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Kingsmen Financial Operations", mirrorPurpose: "finance and refund visibility mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Partner Ecosystem Directory", mirrorPurpose: "partner directory and demand mirror", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false },
  { baseName: "Document Vault", mirrorPurpose: "document status mirror without raw file access", truthOwner: "postgres", airtableRole: "async_mirror_only", canGovernTruth: false, productionReady: false }
] as const;

export function assertN07AirtableBaseMapSafe() {
  if (N07_AIRTABLE_BASE_MAP.length !== 12) {
    throw new Error("N07 Airtable base map must include exactly 12 bases");
  }

  for (const row of N07_AIRTABLE_BASE_MAP) {
    if (row.truthOwner !== "postgres") {
      throw new Error(`N07 Airtable base map blocked: truth owner must be postgres for ${row.baseName}`);
    }

    if (row.airtableRole !== "async_mirror_only" || row.canGovernTruth !== false) {
      throw new Error(`N07 Airtable base map blocked: Airtable cannot govern truth for ${row.baseName}`);
    }
  }

  return true;
}