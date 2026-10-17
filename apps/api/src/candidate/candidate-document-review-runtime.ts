import {
  withCandidateBackendTransaction,
  type CandidateBackendPool
} from "./candidate-backend-transaction";
import {
  reviewCandidateDocument,
  type CandidateDocumentReviewCommand,
  type CandidateDocumentReviewResult,
  type CandidateDocumentReviewer
} from "./candidate-document-review";

export interface CandidateDocumentReviewerResolver<TContext> {
  resolve(context: TContext): Promise<CandidateDocumentReviewer | null>;
}

export class CandidateDocumentReviewRuntime<TContext> {
  constructor(
    private readonly pool: CandidateBackendPool,
    private readonly reviewerResolver: CandidateDocumentReviewerResolver<TContext>
  ) {}

  async execute(context: TContext, command: CandidateDocumentReviewCommand): Promise<CandidateDocumentReviewResult> {
    const reviewer = await this.reviewerResolver.resolve(context);
    if (!reviewer) throw new Error("CANDIDATE_DOCUMENT_REVIEWER_REQUIRED");
    return withCandidateBackendTransaction(this.pool, (db) =>
      reviewCandidateDocument(db, reviewer, command));
  }
}
