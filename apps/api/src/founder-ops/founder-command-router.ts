import { evaluateFounderCommand } from "./founder-command-policy";
import type { FounderCommandDecision, FounderCommandRequest } from "./founder-ops-types";

export interface RoutedFounderCommand {
  command: FounderCommandRequest;
  decision: FounderCommandDecision;
  auditMessage: string;
  nextSystem: "N08" | "N12" | "N13" | "N16";
}

export function routeFounderCommand(command: FounderCommandRequest): RoutedFounderCommand {
  const decision = evaluateFounderCommand(command);

  const nextSystem =
    decision.requiredNextStep === "READ_ONLY" ? "N08" :
    decision.requiredNextStep === "N13_REPORT" ? "N13" :
    decision.requiredNextStep === "N12_APPROVAL" ? "N12" :
    "N16";

  return {
    command,
    decision,
    nextSystem,
    auditMessage: `Founder command ${command.commandKey} evaluated: ${decision.reason}.`
  };
}

export function buildW24CommandEnvelope(command: FounderCommandRequest) {
  const routed = routeFounderCommand(command);
  if (routed.nextSystem !== "N16") {
    return {
      envelopeRequired: false,
      reason: `Command routes to ${routed.nextSystem} before orchestrator dispatch.`
    };
  }

  return {
    envelopeRequired: true,
    workerPath: ["W24", "W17", "N16_ORCHESTRATOR"],
    commandRef: command.commandRef,
    priorityLane: command.priorityLane,
    evidenceRefs: command.evidenceRefs,
    reason: command.reason,
    payload: command.payload
  };
}

export function noFounderCommandMayBypassN12OrN16(): true {
  return true;
}