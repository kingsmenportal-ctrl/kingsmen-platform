import type { FounderCommandCatalogEntry } from "./founder-ops-types";

export const FOUNDER_COMMAND_CATALOG: FounderCommandCatalogEntry[] = [
  { commandKey: "INSPECT_CANDIDATE", commandName: "Inspect Candidate", commandGroup: "INSPECT", commandIntent: "Open candidate operational picture without changing state.", routesThrough: "N08_CONTROL_PLANE_READ_ONLY", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "INSPECT_APPLICATION", commandName: "Inspect Application", commandGroup: "INSPECT", commandIntent: "Open application status, blockers, and evidence.", routesThrough: "N08_CONTROL_PLANE_READ_ONLY", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "SET_PRIORITY_LANE", commandName: "Set Priority Lane", commandGroup: "PRIORITIZE", commandIntent: "Request priority change without changing dignity or sector access.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "PAUSE_WORKER", commandName: "Pause Worker", commandGroup: "PAUSE_RESUME", commandIntent: "Pause unsafe worker or connector.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "RESUME_WORKER", commandName: "Resume Worker", commandGroup: "PAUSE_RESUME", commandIntent: "Resume paused worker after safety evidence.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "APPROVE_MANUAL_PACKAGE", commandName: "Approve MAP", commandGroup: "APPROVAL", commandIntent: "Approve manual package for candidate/operator use.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "REQUEST_MAP_HANDOFF", commandName: "Request MAP Handoff", commandGroup: "MAP", commandIntent: "Create manual handoff for blocked portal or manual-only route.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "REQUEST_PHOENIX_FALLBACK", commandName: "Request Phoenix Fallback", commandGroup: "PHOENIX", commandIntent: "Request evidence-backed reroute after failure.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "ESCALATE_INCIDENT", commandName: "Escalate Incident", commandGroup: "INCIDENT", commandIntent: "Escalate visible incident with cause and fix path.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "REQUEST_DOCUMENT_REVIEW", commandName: "Request Document Review", commandGroup: "DOCUMENTS", commandIntent: "Route document uncertainty to review.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "REQUEST_SOURCE_REVIEW", commandName: "Request Source Review", commandGroup: "SOURCE_REVIEW", commandIntent: "Review uncertain source, deadline, fee, or requirement.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "REQUEST_COMMS_ESCALATION", commandName: "Request Comms Escalation", commandGroup: "COMMS", commandIntent: "Escalate communication while preserving email-first doctrine.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "REQUEST_REFUND_REVIEW", commandName: "Request Refund Review", commandGroup: "FINANCE", commandIntent: "Create refund review request without final payout.", routesThrough: "N12_GOVERNANCE_AND_N16_ORCHESTRATOR", requiresApproval: true, requiresEvidence: true, allowedFromPhone: true, dangerous: true },
  { commandKey: "BUILD_MORNING_BRIEF", commandName: "Build Morning Brief", commandGroup: "REPORT", commandIntent: "Build founder morning brief.", routesThrough: "N13_OBSERVABILITY_ONLY", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "BUILD_MIDDAY_BRIEF", commandName: "Build Midday Brief", commandGroup: "REPORT", commandIntent: "Build founder midday brief.", routesThrough: "N13_OBSERVABILITY_ONLY", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "BUILD_EVENING_BRIEF", commandName: "Build Evening Brief", commandGroup: "REPORT", commandIntent: "Build founder evening brief.", routesThrough: "N13_OBSERVABILITY_ONLY", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false },
  { commandKey: "CAPACITY_CHECK", commandName: "Capacity Check", commandGroup: "CAPACITY", commandIntent: "Inspect Oracle Lite cap pressure.", routesThrough: "N13_OBSERVABILITY_ONLY", requiresApproval: false, requiresEvidence: true, allowedFromPhone: true, dangerous: false }
];

export function getFounderCommand(commandKey: string): FounderCommandCatalogEntry {
  const command = FOUNDER_COMMAND_CATALOG.find((item) => item.commandKey === commandKey);
  if (!command) throw new Error("UNKNOWN_FOUNDER_COMMAND");
  return command;
}

export function listPhoneAllowedCommands(): FounderCommandCatalogEntry[] {
  return FOUNDER_COMMAND_CATALOG.filter((command) => command.allowedFromPhone);
}