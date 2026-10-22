-- Review queues and review audit trails are service-role-only.
-- Candidate-facing operations must go through the authorised Edge Function/RPC
-- workflow; direct REST table access is intentionally unavailable to anon/authenticated.
REVOKE ALL PRIVILEGES ON TABLE
  public.candidate_identity_review_audit,
  public.candidate_identity_review_requests,
  public.candidate_private_document_reviews
FROM anon, authenticated;

COMMENT ON TABLE public.candidate_identity_review_audit IS
  'Backend-only audit trail for candidate identity decisions. Access via authorised service-role workflow only.';
COMMENT ON TABLE public.candidate_identity_review_requests IS
  'Backend-only queue of unverified candidate identity claims. Never authoritative until authorised human review.';
COMMENT ON TABLE public.candidate_private_document_reviews IS
  'Backend-only document review decisions and evidence. Access via authorised service-role workflow only.';
