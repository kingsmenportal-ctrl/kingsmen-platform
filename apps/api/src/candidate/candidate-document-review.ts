import { randomUUID } from "node:crypto";
import type { CandidateBackendTransactionDatabase } from "./candidate-backend-transaction";
import type { CandidateDocumentStatus } from "./candidate-document-vault";

export type CandidateDocumentReviewAction = "START_REVIEW" | "ACCEPT" | "REJECT" | "ARCHIVE";

export interface CandidateDocumentReviewCommand {
  documentId: string;
  action: CandidateDocumentReviewAction;
  reason: string;
  correlationId: string;
  expectedStatus: CandidateDocumentStatus;
}

export interface CandidateDocumentReviewer {
  readonly actorId: string;
  hasPermission(permission: string): boolean | Promise<boolean>;
}

export interface CandidateDocumentReviewResult {
  documentId: string;
  previousStatus: CandidateDocumentStatus;
  status: CandidateDocumentStatus;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CORRELATION_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,119}$/;
const REASON = /^[^\u0000-\u001f]{8,500}$/;
const REQUIRED_PERMISSION: Record<CandidateDocumentReviewAction, string> = {
  START_REVIEW: "candidate.documents.review",
  ACCEPT: "candidate.documents.accept",
  REJECT: "candidate.documents.reject",
  ARCHIVE: "candidate.documents.archive"
};
const TRANSITIONS: Record<CandidateDocumentReviewAction, { from: CandidateDocumentStatus; to: CandidateDocumentStatus }> = {
  START_REVIEW: { from: "UPLOADED", to: "UNDER_REVIEW" },
  ACCEPT: { from: "UNDER_REVIEW", to: "ACCEPTED" },
  REJECT: { from: "UNDER_REVIEW", to: "REJECTED" },
  ARCHIVE: { from: "REJECTED", to: "ARCHIVED" }
};

/**
 * Must be called only inside withCandidateBackendTransaction. The trusted
 * reviewer is resolved by the caller from server-side auth; request data cannot
 * create reviewer permissions. The status update and audit insert share a
 * transaction, so audit failure rolls back the state change.
 */
export async function reviewCandidateDocument(
  db: CandidateBackendTransactionDatabase,
  reviewer: CandidateDocumentReviewer,
  command: CandidateDocumentReviewCommand
): Promise<CandidateDocumentReviewResult> {
  if (!reviewer || typeof reviewer.actorId !== "string" || !reviewer.actorId.trim()) {
    throw new Error("CANDIDATE_DOCUMENT_REVIEWER_REQUIRED");
  }
  if (!UUID.test(command.documentId)) throw new Error("CANDIDATE_DOCUMENT_ID_INVALID");
  if (!CORRELATION_ID.test(command.correlationId)) throw new Error("CANDIDATE_DOCUMENT_CORRELATION_ID_INVALID");
  if (!REASON.test(command.reason) || command.reason.trim() !== command.reason) {
    throw new Error("CANDIDATE_DOCUMENT_REVIEW_REASON_REQUIRED");
  }
  const transition = TRANSITIONS[command.action];
  if (!transition) throw new Error("CANDIDATE_DOCUMENT_REVIEW_ACTION_UNSUPPORTED");
  if (command.expectedStatus !== transition.from) throw new Error("CANDIDATE_DOCUMENT_EXPECTED_STATUS_INVALID");
  if (!(await reviewer.hasPermission(REQUIRED_PERMISSION[command.action]))) {
    throw new Error("CANDIDATE_DOCUMENT_REVIEW_PERMISSION_REQUIRED");
  }

  const updated = await db.query<{ id: string; candidate_id: string; document_status: CandidateDocumentStatus }>(
    `update public.candidate_documents
        set document_status = $2,
            reviewed_by = $3,
            reviewed_at = now(),
            review_reason = $4,
            updated_at = now()
      where id = $1::uuid
        and document_status = $5
      returning id, candidate_id, document_status`,
    [command.documentId, transition.to, reviewer.actorId, command.reason, transition.from]
  );
  const row = updated.rows[0];
  if (!row) throw new Error("CANDIDATE_DOCUMENT_STATUS_CONFLICT_OR_NOT_FOUND");

  await db.query(
    `insert into public.audit_events
       (event_id, event_type, severity, correlation_id, actor_id, candidate_id,
        evidence_ref, message, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [
      `evt_${randomUUID()}`,
      `candidate.document.${command.action.toLowerCase()}`,
      command.action === "REJECT" ? "WARNING" : "INFO",
      command.correlationId,
      reviewer.actorId,
      row.candidate_id,
      row.id,
      `Candidate document status changed from ${transition.from} to ${transition.to}`,
      JSON.stringify({
        documentId: row.id,
        action: command.action,
        previousStatus: transition.from,
        status: transition.to,
        reason: command.reason
      })
    ]
  );

  return { documentId: row.id, previousStatus: transition.from, status: row.document_status };
}
