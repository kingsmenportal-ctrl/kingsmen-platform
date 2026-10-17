-- 0059: safe candidate identity-link requests.
-- Self-service sign-in must never claim a candidate row by email matching.
-- An authorised reviewer resolves the candidate and creates the verified identity link.
CREATE TABLE IF NOT EXISTS public.candidate_identity_link_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  verified_email text NOT NULL,
  candidate_reference text,
  status text NOT NULL DEFAULT 'PENDING',
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  decision_notes text,
  correlation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT candidate_identity_link_requests_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  CONSTRAINT candidate_identity_link_requests_review_consistency
    CHECK (
      (status = 'PENDING' AND reviewed_at IS NULL AND reviewed_by IS NULL)
      OR status <> 'PENDING'
    ),
  CONSTRAINT candidate_identity_link_requests_reference_length
    CHECK (candidate_reference IS NULL OR length(candidate_reference) <= 100),
  CONSTRAINT candidate_identity_link_requests_email_length
    CHECK (length(verified_email) BETWEEN 3 AND 320)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_identity_link_requests_pending_user
  ON public.candidate_identity_link_requests(auth_user_id)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_candidate_identity_link_requests_review_queue
  ON public.candidate_identity_link_requests(status, requested_at ASC);

ALTER TABLE public.candidate_identity_link_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_candidate_identity_link_requests
  ON public.candidate_identity_link_requests;
CREATE POLICY service_role_all_candidate_identity_link_requests
  ON public.candidate_identity_link_requests
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.candidate_identity_link_requests IS
  'Pending identity-link claims. Does not establish candidate ownership; authorised review must resolve and verify the candidate_auth_identity_links record.';
