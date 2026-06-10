import type { CommandEnvelope } from "../kernel/command-envelope";

export interface PolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reasons: string[];
  hardBlockers: string[];
}

const DANGEROUS_COMMANDS = new Set<string>([
  "communication.send.requested",
  "finance.payment.recorded",
  "system.override.requested",
  "application.execute.requested"
]);

export function evaluateCommandPolicy(command: CommandEnvelope): PolicyDecision {
  const reasons: string[] = [];
  const hardBlockers: string[] = [];
  let requiresApproval = false;

  if (!command.idempotencyKey) {
    hardBlockers.push("NO_IDEMPOTENCY_KEY");
  }

  if (!command.correlationId) {
    hardBlockers.push("NO_CORRELATION_ID");
  }

  if (DANGEROUS_COMMANDS.has(command.commandType)) {
    requiresApproval = true;
    reasons.push("Dangerous or sensitive command requires founder/operator approval.");
  }

  if (command.commandType === "communication.send.requested") {
    reasons.push("Outbound communication must follow email-primary and WhatsApp urgent-only doctrine.");
  }

  if (command.commandType === "application.execute.requested") {
    reasons.push("Official submission actions must be evidence-ledgered and never bypass CAPTCHA/OTP.");
  }

  if (command.commandType === "finance.payment.recorded") {
    reasons.push("Finance actions cannot be governed by AI alone.");
  }

  return {
    allowed: hardBlockers.length === 0,
    requiresApproval,
    reasons,
    hardBlockers
  };
}

export function assertPolicyAllows(command: CommandEnvelope): PolicyDecision {
  const decision = evaluateCommandPolicy(command);

  if (!decision.allowed) {
    throw new Error(`Command blocked by policy: ${decision.hardBlockers.join(", ")}`);
  }

  return decision;
}