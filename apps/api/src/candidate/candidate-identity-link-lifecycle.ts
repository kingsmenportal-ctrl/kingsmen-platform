import { randomUUID } from "node:crypto";
import type { CandidateBackendTransactionDatabase } from "./candidate-backend-transaction";

export interface CandidateIdentityLinkActor {
  /** Stable actor ID from a trusted server-side operator session, never request body input. */
  actorId: string;
  /** Must be implemented against the trusted operator/permission source. */
  isAuthorizedOperator: (actorId: string) => Promise<boolean>;
}

export interface CandidateIdentityLinkCommand {
  supabaseUserId: string;
  candidateId: string;
  reason: string;
  correlationId: string;
}

export type CandidateIdentityLinkStatus = "PENDING" | "VERIFIED" | "REVOKED";

export interface CandidateIdentityLinkResult {
  linkId: string;
  status: CandidateIdentityLinkStatus;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireText(value: string, label: string, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new Error(`CANDIDATE_IDENTITY_LINK_INVALID_${label.toUpperCase()}`);
  }
  return value.trim();
}

function validateCommand(command: CandidateIdentityLinkCommand): void {
  if (!UUID.test(command.supabaseUserId)) throw new Error("CANDIDATE_IDENTITY_LINK_INVALID_AUTH_USER");
  if (!UUID.test(command.candidateId)) throw new Error("CANDIDATE_IDENTITY_LINK_INVALID_CANDIDATE");
  requireText(command.reason, "reason");
  requireText(command.correlationId, "correlation_id", 200);
}

async function authorize(actor: CandidateIdentityLinkActor): Promise<string> {
  const actorId = requireText(actor.actorId, "actor_id", 200);
  if (typeof actor.isAuthorizedOperator !== "function" || !(await actor.isAuthorizedOperator(actorId))) {
    throw new Error("CANDIDATE_IDENTITY_LINK_OPERATOR_REQUIRED");
  }
  return actorId;
}

async function audit(
  db: CandidateBackendTransactionDatabase,
  input: {
    eventType: string;
    actorId: string;
    candidateId: string;
    correlationId: string;
    reason: string;
    authUserId: string;
    linkId: string;
  }
): Promise<void> {
  await db.query(
    `insert into public.audit_events
      (event_id, event_type, severity, correlation_id, actor_id, candidate_id, message, metadata)
     values ($1, $2, $3, $4, $5, $6::uuid, $7, $8::jsonb)`,
    [
      `evt_candidate_identity_${randomUUID()}`,
      input.eventType,
      input.eventType.endsWith("REVOKED") ? "WARNING" : "INFO",
      input.correlationId,
      input.actorId,
      input.candidateId,
      input.reason,
      JSON.stringify({ link_id: input.linkId, supabase_user_id: input.authUserId })
    ]
  );
}

/**
 * Creates a PENDING mapping only after trusted operator authorization.
 * Caller must execute this function inside withCandidateBackendTransaction().
 * No email-based matching or candidate-controlled IDs are accepted from web routes.
 */
export async function createPendingCandidateIdentityLink(
  db: CandidateBackendTransactionDatabase,
  actor: CandidateIdentityLinkActor,
  command: CandidateIdentityLinkCommand
): Promise<CandidateIdentityLinkResult> {
  validateCommand(command);
  const actorId = await authorize(actor);
  const result = await db.query<{ id: string; link_status: CandidateIdentityLinkStatus }>(
    `insert into public.candidate_auth_identity_links
       (supabase_user_id, candidate_id, link_status)
     select $1::uuid, candidate.id, 'PENDING'
       from public.candidates as candidate
      where candidate.id = $2::uuid and candidate.is_active = true
     returning id, link_status`,
    [command.supabaseUserId, command.candidateId]
  );
  if (result.rows.length !== 1) throw new Error("CANDIDATE_IDENTITY_LINK_ACTIVE_CANDIDATE_REQUIRED");
  const link = result.rows[0];
  await audit(db, {
    eventType: "CANDIDATE_IDENTITY_LINK_CREATED_PENDING",
    actorId,
    candidateId: command.candidateId,
    correlationId: command.correlationId,
    reason: requireText(command.reason, "reason"),
    authUserId: command.supabaseUserId,
    linkId: link.id
  });
  return { linkId: link.id, status: link.link_status };
}

/** Only PENDING -> VERIFIED is permitted; duplicate/terminal transitions fail closed. */
export async function verifyPendingCandidateIdentityLink(
  db: CandidateBackendTransactionDatabase,
  actor: CandidateIdentityLinkActor,
  command: CandidateIdentityLinkCommand
): Promise<CandidateIdentityLinkResult> {
  validateCommand(command);
  const actorId = await authorize(actor);
  const result = await db.query<{ id: string; link_status: CandidateIdentityLinkStatus }>(
    `update public.candidate_auth_identity_links as link
        set link_status = 'VERIFIED', verified_at = now(), verified_by = $3, updated_at = now()
       from public.candidates as candidate
      where link.supabase_user_id = $1::uuid
        and link.candidate_id = $2::uuid
        and link.link_status = 'PENDING'
        and candidate.id = link.candidate_id
        and candidate.is_active = true
     returning link.id, link.link_status`,
    [command.supabaseUserId, command.candidateId, actorId]
  );
  if (result.rows.length !== 1) throw new Error("CANDIDATE_IDENTITY_LINK_PENDING_LINK_REQUIRED");
  const link = result.rows[0];
  await audit(db, {
    eventType: "CANDIDATE_IDENTITY_LINK_VERIFIED",
    actorId,
    candidateId: command.candidateId,
    correlationId: command.correlationId,
    reason: requireText(command.reason, "reason"),
    authUserId: command.supabaseUserId,
    linkId: link.id
  });
  return { linkId: link.id, status: link.link_status };
}

/** Revocation is explicit, reasoned, audited and atomic with the state transition. */
export async function revokeCandidateIdentityLink(
  db: CandidateBackendTransactionDatabase,
  actor: CandidateIdentityLinkActor,
  command: CandidateIdentityLinkCommand
): Promise<CandidateIdentityLinkResult> {
  validateCommand(command);
  const actorId = await authorize(actor);
  const reason = requireText(command.reason, "reason");
  const result = await db.query<{ id: string; link_status: CandidateIdentityLinkStatus }>(
    `update public.candidate_auth_identity_links
        set link_status = 'REVOKED', revocation_reason = $3, updated_at = now()
      where supabase_user_id = $1::uuid
        and candidate_id = $2::uuid
        and link_status in ('PENDING', 'VERIFIED')
     returning id, link_status`,
    [command.supabaseUserId, command.candidateId, reason]
  );
  if (result.rows.length !== 1) throw new Error("CANDIDATE_IDENTITY_LINK_REVOCABLE_LINK_REQUIRED");
  const link = result.rows[0];
  await audit(db, {
    eventType: "CANDIDATE_IDENTITY_LINK_REVOKED",
    actorId,
    candidateId: command.candidateId,
    correlationId: command.correlationId,
    reason,
    authUserId: command.supabaseUserId,
    linkId: link.id
  });
  return { linkId: link.id, status: link.link_status };
}
