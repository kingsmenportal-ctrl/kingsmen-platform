import type { CandidateBackendTransactionDatabase } from "./candidate-backend-transaction";

export type CandidateDocumentStatus = "UPLOADED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "ARCHIVED";
export type CandidateDocumentType = "IDENTITY" | "ACADEMIC" | "CV" | "PROOF_OF_ADDRESS" | "FINANCIAL" | "CONSENT" | "OTHER";

export interface CandidateDocumentSummary {
  documentId: string;
  documentType: CandidateDocumentType;
  displayName: string;
  contentType: string;
  byteSize: number;
  status: CandidateDocumentStatus;
  uploadedAt: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Lists only metadata for the candidate linked to the server-verified Auth UUID.
 * It never returns storage object keys, signed URLs, hashes, or other candidates'
 * records. Caller must use withCandidateBackendTransaction() so the DB sees the
 * fixed trusted backend RLS context.
 */
export async function listVerifiedCandidateDocuments(
  db: CandidateBackendTransactionDatabase,
  verifiedSupabaseUserId: string
): Promise<CandidateDocumentSummary[] | null> {
  if (typeof verifiedSupabaseUserId !== "string" || !UUID.test(verifiedSupabaseUserId)) return null;

  const result = await db.query<{
    id: string;
    document_type: CandidateDocumentType;
    display_name: string;
    content_type: string;
    byte_size: string | number;
    document_status: CandidateDocumentStatus;
    uploaded_at: Date | string;
  }>(
    `select document.id, document.document_type, document.display_name,
            document.content_type, document.byte_size, document.document_status,
            document.uploaded_at
       from public.candidate_auth_identity_links as link
       join public.candidates as candidate
         on candidate.id = link.candidate_id and candidate.is_active = true
       join public.candidate_documents as document
         on document.candidate_id = candidate.id
      where link.supabase_user_id = $1::uuid
        and link.link_status = 'VERIFIED'
      order by document.uploaded_at desc, document.id asc
      limit 200`,
    [verifiedSupabaseUserId]
  );

  return result.rows.map((row) => ({
    documentId: row.id,
    documentType: row.document_type,
    displayName: row.display_name,
    contentType: row.content_type,
    byteSize: Number(row.byte_size),
    status: row.document_status,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : String(row.uploaded_at)
  }));
}

/**
 * Resolve one document through the verified owner mapping. Return only a
 * server-internal object locator; never expose this result to a browser.
 * A real storage signer must independently enforce short expiry and private ACL.
 */
export async function resolveOwnedDocumentStorageLocator(
  db: CandidateBackendTransactionDatabase,
  verifiedSupabaseUserId: string,
  documentId: string
): Promise<{ documentId: string; storageProvider: string; storageObjectKey: string; contentType: string } | null> {
  if (!UUID.test(verifiedSupabaseUserId) || !UUID.test(documentId)) return null;
  const result = await db.query<{
    id: string;
    storage_provider: string;
    storage_object_key: string;
    content_type: string;
  }>(
    `select document.id, document.storage_provider, document.storage_object_key, document.content_type
       from public.candidate_auth_identity_links as link
       join public.candidates as candidate
         on candidate.id = link.candidate_id and candidate.is_active = true
       join public.candidate_documents as document
         on document.candidate_id = candidate.id
      where link.supabase_user_id = $1::uuid
        and link.link_status = 'VERIFIED'
        and document.id = $2::uuid
        and document.document_status <> 'ARCHIVED'
      limit 1`,
    [verifiedSupabaseUserId, documentId]
  );
  const row = result.rows[0];
  return row ? {
    documentId: row.id,
    storageProvider: row.storage_provider,
    storageObjectKey: row.storage_object_key,
    contentType: row.content_type
  } : null;
}
