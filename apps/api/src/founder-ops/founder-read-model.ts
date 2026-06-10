import { FOUNDER_COMMAND_CATALOG } from "./command-catalog";
import { buildFounderMobileCards } from "./founder-mobile-cockpit";

export function buildFounderOpsReadModel() {
  return {
    title: "Kingsmen Founder Command Ops",
    doctrine: "Command cockpit only. Governance and orchestrator remain authoritative.",
    commandCount: FOUNDER_COMMAND_CATALOG.length,
    phoneCards: buildFounderMobileCards(),
    hardBoundaries: [
      "No state-machine bypass",
      "No direct official submission",
      "No direct refund finality",
      "No fraud/privacy finality without governance",
      "No fake official status",
      "No silent override"
    ],
    dailyBriefSections: [
      "system health",
      "queue",
      "finance",
      "documents",
      "matching",
      "Playwright/MAP",
      "incidents",
      "capacity",
      "urgent candidates"
    ]
  };
}