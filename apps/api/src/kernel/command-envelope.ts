export type KingsmenActorType =
  | "candidate"
  | "founder"
  | "operator"
  | "system"
  | "worker"
  | "integration";

export interface KingsmenActor {
  type: KingsmenActorType;
  id: string;
  displayName?: string;
}

export type KingsmenCommandType =
  | "candidate.intake.received"
  | "candidate.profile.reviewed"
  | "document.uploaded"
  | "application.evaluate.requested"
  | "application.execute.requested"
  | "workflow.result.received"
  | "manual.map.requested"
  | "communication.send.requested"
  | "finance.payment.recorded"
  | "system.override.requested"
  | "system.health.requested";

export interface CommandEnvelope<TPayload = unknown> {
  commandId: string;
  commandType: KingsmenCommandType;
  idempotencyKey: string;
  correlationId: string;
  actor: KingsmenActor;
  candidateId?: string;
  applicationId?: string;
  source: "portal" | "control_plane" | "worker" | "jarvis" | "api" | "system";
  createdAt: string;
  payload: TPayload;
}

export function assertCommandEnvelope<TPayload>(command: CommandEnvelope<TPayload>): CommandEnvelope<TPayload> {
  const missing: string[] = [];

  if (!command.commandId) missing.push("commandId");
  if (!command.commandType) missing.push("commandType");
  if (!command.idempotencyKey) missing.push("idempotencyKey");
  if (!command.correlationId) missing.push("correlationId");
  if (!command.actor?.id) missing.push("actor.id");
  if (!command.actor?.type) missing.push("actor.type");
  if (!command.source) missing.push("source");
  if (!command.createdAt) missing.push("createdAt");

  if (missing.length > 0) {
    throw new Error(`Invalid command envelope. Missing: ${missing.join(", ")}`);
  }

  return command;
}

export function createCommandId(prefix = "cmd"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}