-- 0040 - Verified Supabase Auth user -> candidate identity mapping
-- A mapping is created/verified only by a trusted backend/operator workflow.
-- Never create or resolve this link by email equality.
CREATE TABLE IF NOT EXISTS public.candidate_auth_identity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NOT NULL UNIQUE,
  candidate_id uuid NOT NULL UNIQUE REFERENCES public.candidates(id) ON DELETE CASCADE,
  link_status text NOT NULL DEFAULT 'PENDING'
    CHECK (link_status IN ('PENDING', 'VERIFIED', 'REVOKED')),
  verified_at timestamptz,
  verified_by text,
  revocation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidate_auth_identity_verified_fields_check
    CHECK (
      link_status <> 'VERIFIED'
      OR (verified_at IS NOT NULL AND length(btrim(verified_by)) > 0)
    ),
  CONSTRAINT candidate_auth_identity_revocation_reason_check
    CHECK (
      link_status <> 'REVOKED'
      OR (revocation_reason IS NOT NULL AND length(btrim(revocation_reason)) BETWEEN 1 AND 500)
    )
);

CREATE INDEX IF NOT EXISTS idx_candidate_auth_identity_status_user
  ON public.candidate_auth_identity_links(supabase_user_id, link_status);

ALTER TABLE public.candidate_auth_identity_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS candidate_auth_identity_links_backend_all
  ON public.candidate_auth_identity_links;
CREATE POLICY candidate_auth_identity_links_backend_all
  ON public.candidate_auth_identity_links
  FOR ALL
  USING (kingsmen_security.is_backend_service_role())
  WITH CHECK (kingsmen_security.is_backend_service_role());

COMMENT ON TABLE public.candidate_auth_identity_links IS
  'Privileged mapping from a server-verified Supabase Auth user UUID to one candidate. Never resolve by email; candidates cannot self-assign this link.';
