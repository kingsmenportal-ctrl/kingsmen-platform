import {
  withCandidateBackendTransaction,
  type CandidateBackendPool
} from "./candidate-backend-transaction";
import {
  listVerifiedCandidateDocuments,
  resolveOwnedDocumentStorageLocator,
  type CandidateDocumentSummary
} from "./candidate-document-vault";

export class CandidateDocumentVaultRuntime {
  constructor(private readonly pool: CandidateBackendPool) {}

  list(verifiedSupabaseUserId: string): Promise<CandidateDocumentSummary[] | null> {
    return withCandidateBackendTransaction(this.pool, (db) =>
      listVerifiedCandidateDocuments(db, verifiedSupabaseUserId));
  }

  /** Internal-only locator for a future trusted storage signer; do not return to clients. */
  resolveStorageLocator(verifiedSupabaseUserId: string, documentId: string) {
    return withCandidateBackendTransaction(this.pool, (db) =>
      resolveOwnedDocumentStorageLocator(db, verifiedSupabaseUserId, documentId));
  }
}
