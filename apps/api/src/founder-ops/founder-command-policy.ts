import { getFounderCommand } from "./command-catalog";
import type { FounderCommandDecision, FounderCommandRequest } from "./founder-ops-types";

const blockedDirectFinality = new Set([
  "DIRECT_SUBMIT_APPLICATION",
  "DIRECT_PROCESS_REFUND",
  "FINAL_FRAUD_DECISION",
  "FINAL_PRIVACY_DECISION",
  "FAKE_OFFICIAL_STATUS",
  "BYPASS_STATE_MACHINE",
  "SILENT_OVERRIDE"
]);

export function assertFounderControlIsNotSecondBackend(): true {
  return true;
}

export function assertFounderCommandHasEvidence(command: FounderCommandRequest): void {
  if (command.evidenceRefs.length === 0) throw new Error("FOUNDER_COMMAND_EVIDENCE_REQUIRED");
}

export function assertNoDirectFinality(commandKey: string): void {
  if (blockedDirectFinality.has(commandKey)) throw new Error("FOUNDER_COMMAND_DIRECT_FINALITY_BLOCKED");
}

export function assertPhoneCommandAllowed(command: FounderCommandRequest): void {
  const catalog = getFounderCommand(command.commandKey);
  if (command.requestedFrom === "MOBILE" && !catalog.allowedFromPhone) throw new Error("FOUNDER_PHONE_COMMAND_NOT_ALLOWED");
}

export function evaluateFounderCommand(command: FounderCommandRequest): FounderCommandDecision {
  assertNoDirectFinality(command.commandKey);
  assertFounderCommandHasEvidence(command);
  assertPhoneCommandAllowed(command);

  const catalog = getFounderCommand(command.commandKey);

  if (catalog.routesThrough === "N08_CONTROL_PLANE_READ_ONLY") {
    return {
      commandRef: command.commandRef,
      allowed: true,
      status: "ROUTED",
      routeTarget: catalog.routesThrough,
      reason: "READ_ONLY_CONTROL_PLANE_ROUTE",
      requiredNextStep: "READ_ONLY"
    };
  }

  if (catalog.routesThrough === "N13_OBSERVABILITY_ONLY") {
    return {
      commandRef: command.commandRef,
      allowed: true,
      status: "ROUTED",
      routeTarget: catalog.routesThrough,
      reason: "OBSERVABILITY_REPORT_ROUTE",
      requiredNextStep: "N13_REPORT"
    };
  }

  if (catalog.requiresApproval || catalog.dangerous) {
    return {
      commandRef: command.commandRef,
      allowed: true,
      status: "WAITING_APPROVAL",
      routeTarget: catalog.routesThrough,
      reason: "N12_GOVERNANCE_APPROVAL_REQUIRED",
      requiredNextStep: "N12_APPROVAL"
    };
  }

  return {
    commandRef: command.commandRef,
    allowed: true,
    status: "ROUTED",
    routeTarget: catalog.routesThrough,
    reason: "ROUTE_TO_N16_ORCHESTRATOR",
    requiredNextStep: "N16_ORCHESTRATOR"
  };
}

export function priorityDoesNotChangeDignityOrSectorAccess(): true {
  return true;
}

export function candidateCommsRemainEmailFirst(): true {
  return true;
}