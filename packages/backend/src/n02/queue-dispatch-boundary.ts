import { assertN02CommandAllowed } from "./command-policy-guard";
import { assertIdempotentCommand } from "./idempotency-store";
import { buildAuditContext } from "./audit-context";

export async function dispatchToOracleLiteQueue(input: {
  commandId: string;
  commandType: string;
  actorType: "candidate" | "founder" | "operator" | "system" | "worker";
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
  risk: "low" | "medium" | "high" | "critical";
  reason: string;
  queueName: "commands" | "documents" | "payments" | "communications" | "route_workbench" | "founder_control";
  requiresFounderApproval?: boolean;
  providerProofPresent?: boolean;
}) {
  assertN02CommandAllowed(input);

  const idem = assertIdempotentCommand({
    commandId: input.commandId,
    idempotencyKey: input.idempotencyKey
  });

  const audit = buildAuditContext({
    auditId: `audit_${input.commandId}`,
    actorType: input.actorType,
    actorId: input.actorId,
    correlationId: input.correlationId,
    commandId: input.commandId,
    reason: input.reason,
    risk: input.risk
  });

  if (idem.duplicate) {
    return {
      accepted: false,
      queued: false,
      duplicate: true,
      auditRequired: true,
      audit
    } as const;
  }

  return {
    accepted: true,
    queued: true,
    duplicate: false,
    oracleLiteSafe: true,
    maxAttempts: 3,
    auditRequired: true,
    audit
  } as const;
}