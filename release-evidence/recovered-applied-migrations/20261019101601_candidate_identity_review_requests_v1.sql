-- Candidate identity review intake. A request never creates or verifies an identity link.
-- Only the existing authorised review process may create candidate_auth_identity_links rows.
CREATE TABLE IF NOT EXISTS public.candidate_identity_review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_reference text NOT NULL CHECK (length(trim(candidate_reference)) BETWEEN 2 AND 120),
  claimant_name text NOT NULL CHECK (length(trim(claimant_name)) BETWEEN 2 AND 160),
  claimant_message text NOT NULL DEFAULT '' CHECK (length(claimant_message) <= 1200),
  request_status text NOT NULL DEFAULT 'PENDING'
    CHECK (request_status IN ('PENDING','NEEDS_INFORMATION','APPROVED','REJECTED','WITHDRAWN')),
  reviewer_note text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_identity_review_decision_fields CHECK (
    (request_status IN ('APPROVED','REJECTED') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
    OR request_status NOT IN ('APPROVED','REJECTED')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS candidate_identity_review_one_open_request_per_user
  ON public.candidate_identity_review_requests(supabase_user_id)
  WHERE request_status IN ('PENDING','NEEDS_INFORMATION');

CREATE INDEX IF NOT EXISTS candidate_identity_review_queue_idx
  ON public.candidate_identity_review_requests(request_status, created_at)
  WHERE request_status IN ('PENDING','NEEDS_INFORMATION');

ALTER TABLE public.candidate_identity_review_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.candidate_identity_review_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.candidate_identity_review_requests TO service_role;

COMMENT ON TABLE public.candidate_identity_review_requests IS
  'Unverified candidate identity claims awaiting authorised human review. Never an identity-link authority.';
