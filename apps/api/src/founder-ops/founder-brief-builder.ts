import type { FounderBrief } from "./founder-ops-types";

export function buildFounderBrief(input: {
  briefType: FounderBrief["briefType"];
  evidenceRefs: string[];
  systemHealth?: string;
  queue?: string;
  finance?: string;
  documents?: string;
  matching?: string;
  mapPlaywright?: string;
  incidents?: string;
  capacity?: string;
  urgentCandidates?: string;
}): FounderBrief {
  if (input.evidenceRefs.length === 0) throw new Error("FOUNDER_BRIEF_EVIDENCE_REQUIRED");

  return {
    briefRef: `founder_brief_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    briefType: input.briefType,
    title: `Kingsmen ${input.briefType.toLowerCase()} founder brief`,
    sections: [
      { key: "system_health", title: "System Health", summary: input.systemHealth ?? "No system health summary supplied.", severity: "INFO" },
      { key: "queue", title: "Queue", summary: input.queue ?? "No queue summary supplied.", severity: "WATCH" },
      { key: "finance", title: "Finance", summary: input.finance ?? "No finance summary supplied.", severity: "WATCH" },
      { key: "documents", title: "Documents", summary: input.documents ?? "No document summary supplied.", severity: "WATCH" },
      { key: "matching", title: "Matching", summary: input.matching ?? "No matching summary supplied.", severity: "INFO" },
      { key: "map_playwright", title: "Playwright / MAP", summary: input.mapPlaywright ?? "No Playwright/MAP summary supplied.", severity: "WATCH" },
      { key: "incidents", title: "Incidents", summary: input.incidents ?? "No incident summary supplied.", severity: "WARNING" },
      { key: "capacity", title: "Capacity", summary: input.capacity ?? "No capacity summary supplied.", severity: "WATCH" },
      { key: "urgent_candidates", title: "Urgent Candidates", summary: input.urgentCandidates ?? "No urgent candidate summary supplied.", severity: "WARNING" }
    ],
    recommendedActions: [
      "Review waiting approvals.",
      "Clear urgent document blockers.",
      "Inspect source-confidence review queue.",
      "Check MAP handoffs before deadline pressure grows.",
      "Keep WhatsApp urgent-only and email as the primary evidence channel."
    ],
    evidenceRefs: input.evidenceRefs
  };
}

export function founderBriefMustIncludeAllCorePipelines(): string[] {
  return ["system health", "queue", "finance", "documents", "matching", "Playwright/MAP", "incidents", "capacity", "urgent candidates"];
}